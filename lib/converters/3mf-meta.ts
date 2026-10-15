import JSZip from "jszip";

// Reads the slicer metadata a 3MF carries next to its geometry — Bambu Studio /
// Orca (Metadata/model_settings.config + project_settings.config) and
// PrusaSlicer (Metadata/Slic3r_PE*.config). Regex-based on purpose: no DOM, so
// it runs in Node tests and the browser alike.

export type ThreeMFObjectMeta = {
  id: string;
  name?: string;
  /** 1-based filament slot the object prints with. */
  extruder?: number;
};

export type ThreeMFPlate = {
  id: string;
  name?: string;
  objectIds: string[];
};

export type ThreeMFFilament = {
  color: string;
  type?: string;
};

export type ThreeMFMeta = {
  application?: string;
  unit: string;
  printer?: string;
  /** Root-model <build><item objectid> order — matches ThreeMFLoader's children. */
  buildObjectIds: string[];
  objects: ThreeMFObjectMeta[];
  plates: ThreeMFPlate[];
  filaments: ThreeMFFilament[];
  thumbnail?: { bytes: Uint8Array; mime: string };
};

const HEX_COLOR = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i;

function attr(tag: string, name: string): string | undefined {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`))?.[1];
}

function metadataValue(block: string, key: string): string | undefined {
  const re = /<metadata\b[^>]*>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    if (attr(m[0], "key") === key) return attr(m[0], "value");
  }
  return undefined;
}

async function readText(zip: JSZip, path: string): Promise<string | undefined> {
  const entry = zip.file(path) ?? zip.file(new RegExp(`^${path.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}$`, "i"))[0];
  return entry ? entry.async("string") : undefined;
}

// Bambu: <object id="2"> <metadata key="name"/> <metadata key="extruder"/> <part>…</part> </object>
function parseBambuObjects(xml: string): ThreeMFObjectMeta[] {
  const out: ThreeMFObjectMeta[] = [];
  const re = /<object\b[^>]*>([\s\S]*?)<\/object>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const id = attr(m[0], "id");
    if (!id) continue;
    // Object-level keys sit before the first <part>; part keys would shadow them.
    const head = m[1].split(/<part\b/)[0];
    const ext = metadataValue(head, "extruder") ?? metadataValue(m[1], "extruder");
    out.push({
      id,
      name: metadataValue(head, "name"),
      extruder: ext ? parseInt(ext, 10) || undefined : undefined,
    });
  }
  return out;
}

function parseBambuPlates(xml: string): ThreeMFPlate[] {
  const out: ThreeMFPlate[] = [];
  const re = /<plate\b[^>]*>([\s\S]*?)<\/plate>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const body = m[1];
    const objectIds: string[] = [];
    const inst = /<model_instance\b[^>]*>([\s\S]*?)<\/model_instance>/g;
    let i: RegExpExecArray | null;
    while ((i = inst.exec(body)) !== null) {
      const oid = metadataValue(i[1], "object_id");
      if (oid && !objectIds.includes(oid)) objectIds.push(oid);
    }
    out.push({
      id: metadataValue(body, "plater_id") ?? String(out.length + 1),
      name: metadataValue(body, "plater_name") || undefined,
      objectIds,
    });
  }
  return out;
}

// PrusaSlicer: <object id="1"> <metadata type="object" key="name" value="…"/> <metadata type="object" key="extruder" value="2"/>
function parsePrusaObjects(xml: string): ThreeMFObjectMeta[] {
  const out: ThreeMFObjectMeta[] = [];
  const re = /<object\b[^>]*>([\s\S]*?)<\/object>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const id = attr(m[0], "id");
    if (!id) continue;
    const head = m[1].split(/<volume\b/)[0];
    const ext = metadataValue(head, "extruder");
    out.push({
      id,
      name: metadataValue(head, "name"),
      extruder: ext ? parseInt(ext, 10) || undefined : undefined,
    });
  }
  return out;
}

function listValue(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") return v.split(/[;,]/).map((s) => s.trim().replace(/^"|"$/g, ""));
  return [];
}

function zipFilaments(colors: string[], types: string[]): ThreeMFFilament[] {
  return colors
    .map((c, i) => ({ color: c.slice(0, 7), type: types[i] || undefined }))
    .filter((f) => HEX_COLOR.test(f.color));
}

// PrusaSlicer project config is an ini with "; key = value" lines.
function iniValue(ini: string, key: string): string | undefined {
  return ini.match(new RegExp(`^;?\\s*${key}\\s*=\\s*(.*)$`, "m"))?.[1]?.trim();
}

export async function read3MFMeta(data: ArrayBuffer | Uint8Array | Blob): Promise<ThreeMFMeta> {
  const zip = await JSZip.loadAsync(data);
  const rootXml = (await readText(zip, "3D/3dmodel.model")) ?? "";
  const modelTag = rootXml.match(/<model\b[^>]*>/)?.[0] ?? "";

  const meta: ThreeMFMeta = {
    unit: attr(modelTag, "unit") ?? "millimeter",
    application: rootXml.match(/<metadata\b[^>]*name\s*=\s*"Application"[^>]*>([^<]*)<\/metadata>/)?.[1]?.trim() || undefined,
    buildObjectIds: [],
    objects: [],
    plates: [],
    filaments: [],
  };

  const build = rootXml.match(/<build\b[^>]*>([\s\S]*?)<\/build>/)?.[1] ?? "";
  const itemRe = /<item\b[^>]*>/g;
  let it: RegExpExecArray | null;
  while ((it = itemRe.exec(build)) !== null) {
    const oid = attr(it[0], "objectid");
    if (oid) meta.buildObjectIds.push(oid);
  }

  const bambuModel = await readText(zip, "Metadata/model_settings.config");
  if (bambuModel) {
    meta.objects = parseBambuObjects(bambuModel);
    meta.plates = parseBambuPlates(bambuModel);
  }
  const bambuProject = await readText(zip, "Metadata/project_settings.config");
  if (bambuProject) {
    try {
      const cfg = JSON.parse(bambuProject) as Record<string, unknown>;
      meta.filaments = zipFilaments(listValue(cfg.filament_colour), listValue(cfg.filament_type));
      const printer = cfg.printer_model ?? cfg.printer_settings_id;
      if (typeof printer === "string" && printer) meta.printer = printer;
    } catch {
      // Not JSON (older exports) — leave filaments empty rather than guess.
    }
  }

  const prusaModel = await readText(zip, "Metadata/Slic3r_PE_model.config");
  if (prusaModel && !meta.objects.length) meta.objects = parsePrusaObjects(prusaModel);
  const prusaProject = await readText(zip, "Metadata/Slic3r_PE.config");
  if (prusaProject && !meta.filaments.length) {
    const colors = listValue(iniValue(prusaProject, "extruder_colour"));
    const fallback = listValue(iniValue(prusaProject, "filament_colour"));
    meta.filaments = zipFilaments(
      colors.map((c, i) => (HEX_COLOR.test(c.slice(0, 7)) ? c : fallback[i] ?? c)),
      listValue(iniValue(prusaProject, "filament_type")),
    );
    meta.printer ??= iniValue(prusaProject, "printer_model") || undefined;
  }

  const thumbPath = ["Metadata/plate_1.png", "Metadata/thumbnail.png", "Auxiliaries/.thumbnails/thumbnail_3mf.png", "Thumbnails/thumbnail.png"]
    .find((p) => zip.file(p));
  if (thumbPath) {
    const bytes = await zip.file(thumbPath)!.async("uint8array");
    // Only keep real PNGs (some samples ship placeholder bytes).
    if (bytes[0] === 0x89 && bytes[1] === 0x50) meta.thumbnail = { bytes, mime: "image/png" };
  }

  return meta;
}

/** Filament color for a build item, by its object's 1-based extruder slot. */
export function colorForObject(meta: ThreeMFMeta, objectId: string): string | undefined {
  if (!meta.filaments.length) return undefined;
  const obj = meta.objects.find((o) => o.id === objectId);
  const slot = obj?.extruder ?? 1;
  return meta.filaments[slot - 1]?.color ?? meta.filaments[0]?.color;
}
