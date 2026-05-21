import JSZip from "jszip";

// ---------------------------------------------------------------------------
// Bambu / Orca .3mf → vanilla .3mf
//
// Real Bambu Studio / OrcaSlicer / MakerWorld files almost always use the 3MF
// **production extension**: the root `3D/3dmodel.model` declares
// `requiredextensions="p"` and stores no geometry itself — instead it holds
// `<component p:path="/3D/Objects/object_N.model" objectid="M"/>` references to
// dozens of external part files under `3D/Objects/`.
//
// PrusaSlicer (and most "standard" readers) do not implement the production
// extension's cross-file `p:path` references, so they either refuse the file
// (`requiredextensions` they don't support) or open it with no geometry.
//
// This module FLATTENS that structure into a single self-contained
// `3D/3dmodel.model`: every external object is inlined into the root
// `<resources>` with a fresh unique id, every `<component>`/`<item>` reference
// is rewritten to point at the inlined id, and the production + vendor
// namespaces (`xmlns:p`, `xmlns:BambuStudio`, …) are removed. The result is a
// plain core-spec 3MF that any slicer can open.
//
// Files without the production extension (geometry already inline) still pass
// through correctly — they just get their vendor namespaces and slicer-private
// folders stripped, same as before.
// ---------------------------------------------------------------------------

// Standard 3MF namespace URIs we must KEEP (core geometry + material extension).
const KEEP_NS_PATTERNS = [
  "schemas.microsoft.com/3dmanufacturing/core",
  "schemas.microsoft.com/3dmanufacturing/material",
];

// Path prefixes that are slicer-private (settings, AMS maps, thumbnails,
// previews, calibration). Dropped wholesale.
const PRIVATE_PATH_PREFIXES = ["Metadata/", "Auxiliaries/"];

export type SanitizeReport = {
  droppedPaths: string[];
  strippedNamespaces: string[];
  /** Number of external object-model files merged into the root model. */
  mergedModelFiles: number;
  /** True when a production-extension (multi-file) structure was flattened. */
  flattenedProduction: boolean;
  inputBytes: number;
  outputBytes: number;
};

export type SanitizeResult = {
  blob: Blob;
  report: SanitizeReport;
};

// ---------------------------------------------------------------------------
// Small string helpers — we operate on the XML as text and only ever touch
// structural tags (<model>, <object>, <component>, <item>), never the bulk
// <vertices>/<triangles> payload. That keeps memory flat on large meshes and,
// because it has no DOM dependency, runs identically in the browser and Node.
// ---------------------------------------------------------------------------

function normalizePath(p: string): string {
  return p.replace(/^\/+/, "");
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Read a single attribute value out of a tag string. Attributes inside a 3MF
// tag are always whitespace-separated and double-quoted, with no `>` or `"`
// inside the value, so this is safe.
function getAttr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`\\s${escapeRegExp(name)}\\s*=\\s*"([^"]*)"`));
  return m ? m[1] : null;
}

// Determine which namespace prefixes declared on a <model> tag are non-standard
// and must be stripped (everything except core + material).
function prefixesToStrip(modelTag: string): string[] {
  const out: string[] = [];
  const re = /\sxmlns:([A-Za-z0-9_]+)\s*=\s*"([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(modelTag)) !== null) {
    const [, prefix, uri] = m;
    if (KEEP_NS_PATTERNS.some((p) => uri.includes(p))) continue;
    out.push(prefix);
  }
  return out;
}

// Remove `prefix:attr="..."` attributes (e.g. p:UUID, p:path, BambuStudio:foo)
// from a single tag.
function stripPrefixedAttrs(tag: string, prefixes: string[]): string {
  let out = tag;
  for (const p of prefixes) {
    out = out.replace(new RegExp(`\\s${escapeRegExp(p)}:[\\w.-]+\\s*=\\s*"[^"]*"`, "g"), "");
  }
  return out;
}

// ---------------------------------------------------------------------------
// Object extraction / rewriting
// ---------------------------------------------------------------------------

// Match a whole <object …>…</object> block, or a self-closing <object …/>.
// 3MF objects never nest, and attribute values never contain `>`, so the
// non-greedy match terminates at the correct </object>.
const OBJECT_BLOCK_RE = /<object\b(?:[^>]*\/>|[^>]*>[\s\S]*?<\/object>)/g;
const COMPONENT_RE = /<component\b[^>]*?\/?>/g;

type ParsedObject = {
  globalId: number;
  block: string; // rewritten, references resolved, vendor attrs stripped
  deps: number[]; // global ids this object references via <component>
};

// First pass: find every object id in a model file and register a fresh global
// id for it, keyed by "<path>::<localId>".
function registerObjectIds(
  xml: string,
  path: string,
  idMap: Map<string, number>,
  nextId: () => number,
): void {
  const matches = xml.match(OBJECT_BLOCK_RE) ?? [];
  for (const block of matches) {
    const localId = getAttr(block, "id");
    if (localId == null) continue;
    idMap.set(`${path}::${localId}`, nextId());
  }
}

// Second pass: rewrite each object block — remap its id, resolve every
// <component> reference to a global id (dropping p:path), and strip vendor
// prefixed attributes.
function rewriteObjects(
  xml: string,
  path: string,
  idMap: Map<string, number>,
  stripPrefixes: string[],
): ParsedObject[] {
  const blocks = xml.match(OBJECT_BLOCK_RE) ?? [];
  const result: ParsedObject[] = [];

  for (const original of blocks) {
    const localId = getAttr(original, "id");
    if (localId == null) continue;
    const globalId = idMap.get(`${path}::${localId}`);
    if (globalId === undefined) continue;

    const deps: number[] = [];

    // Resolve <component> references first.
    let block = original.replace(COMPONENT_RE, (tag) => {
      const oid = getAttr(tag, "objectid");
      if (oid == null) return tag;
      const pPath = getAttr(tag, "p:path");
      const targetFile = pPath ? normalizePath(pPath) : path;
      const target = idMap.get(`${targetFile}::${oid}`);
      if (target === undefined) return tag; // unresolved — leave as-is
      deps.push(target);
      const transform = getAttr(tag, "transform");
      return transform != null
        ? `<component objectid="${target}" transform="${transform}"/>`
        : `<component objectid="${target}"/>`;
    });

    // Rewrite the object's own opening tag: new id + drop vendor attrs.
    block = block.replace(/<object\b[^>]*?>/, (tag) => {
      let t = tag.replace(/(\sid\s*=\s*")[^"]*"/, `$1${globalId}"`);
      t = stripPrefixedAttrs(t, stripPrefixes);
      return t;
    });

    result.push({ globalId, block, deps });
  }

  return result;
}

// Order objects so that every object is defined before anything that references
// it (3MF forbids forward references). Leaf meshes (no deps) come first.
function topoSort(objects: ParsedObject[]): ParsedObject[] {
  const byId = new Map<number, ParsedObject>();
  for (const o of objects) byId.set(o.globalId, o);

  const ordered: ParsedObject[] = [];
  const state = new Map<number, 0 | 1 | 2>(); // 0=visiting, 2=done

  const visit = (o: ParsedObject) => {
    const s = state.get(o.globalId);
    if (s === 2) return;
    if (s === 0) return; // cycle guard (shouldn't happen in valid 3MF)
    state.set(o.globalId, 0);
    for (const dep of o.deps) {
      const d = byId.get(dep);
      if (d) visit(d);
    }
    state.set(o.globalId, 2);
    ordered.push(o);
  };

  for (const o of objects) visit(o);
  return ordered;
}

// ---------------------------------------------------------------------------
// Output skeleton
// ---------------------------------------------------------------------------

const OUT_CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;

const OUT_RELS = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function sanitize3MF(file: File | Blob): Promise<SanitizeResult> {
  const inputBytes = file.size;
  const zip = await JSZip.loadAsync(file);

  const allPaths = Object.keys(zip.files).filter((p) => !zip.files[p].dir);

  // Locate the root model (the one targeted from _rels/.rels) and any external
  // object model files referenced via the production extension.
  const rootPath = await findRootModelPath(zip, allPaths);
  if (!rootPath) {
    throw new Error(
      "This file isn't a valid 3MF — it has no 3D model entry (3D/3dmodel.model).",
    );
  }
  const modelPaths = allPaths.filter(
    (p) => /\.model$/i.test(p) && p.startsWith("3D/"),
  );
  // Process root last so a same-id collision can't shadow externals (ids are
  // globally unique anyway, but keep root authoritative for build items).
  const externalModelPaths = modelPaths.filter((p) => p !== rootPath);

  // Read every model file once.
  const xmlByPath = new Map<string, string>();
  for (const p of modelPaths) {
    xmlByPath.set(p, await zip.files[p].async("string"));
  }

  // Determine the highest existing numeric id across all resources so freshly
  // assigned object ids never collide with preserved <basematerials> etc.
  let maxExistingId = 0;
  for (const xml of xmlByPath.values()) {
    const re = /\bid\s*=\s*"(\d+)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml)) !== null) {
      const n = parseInt(m[1], 10);
      if (n > maxExistingId) maxExistingId = n;
    }
  }
  let counter = maxExistingId;
  const nextId = () => ++counter;

  // Pass 1: register a global id for every object in every model file.
  const idMap = new Map<string, number>();
  for (const p of modelPaths) {
    registerObjectIds(xmlByPath.get(p)!, p, idMap, nextId);
  }

  // Pass 2: rewrite + collect all objects.
  const strippedNs = new Set<string>();
  const allObjects: ParsedObject[] = [];
  for (const p of modelPaths) {
    const xml = xmlByPath.get(p)!;
    const modelTag = xml.match(/<model\b[^>]*>/)?.[0] ?? "";
    const stripPrefixes = prefixesToStrip(modelTag);
    stripPrefixes.forEach((pre) => strippedNs.add(pre));
    allObjects.push(...rewriteObjects(xml, p, idMap, stripPrefixes));
  }

  // Preserve any non-<object> resource children from the root model
  // (e.g. <basematerials>, <m:colorgroup>) verbatim — their ids are below the
  // freshly assigned object ids, so they can't collide.
  const rootXml = xmlByPath.get(rootPath)!;
  const rootStripPrefixes = prefixesToStrip(
    rootXml.match(/<model\b[^>]*>/)?.[0] ?? "",
  );
  const preservedResources = extractNonObjectResources(rootXml);

  // Assemble the new root <resources> in dependency order.
  const ordered = topoSort(allObjects);
  const resourcesInner =
    (preservedResources ? `    ${preservedResources}\n` : "") +
    ordered.map((o) => `    ${o.block}`).join("\n");

  // Rebuild the root model document from the original root: keep its <metadata>
  // and <build>, swap in the flattened <resources>, clean the <model> tag.
  const outModel = buildRootModel(
    rootXml,
    resourcesInner,
    idMap,
    rootPath,
    rootStripPrefixes,
  );

  // Emit a minimal, self-contained package.
  const out = new JSZip();
  out.file("[Content_Types].xml", OUT_CONTENT_TYPES);
  out.file("_rels/.rels", OUT_RELS);
  out.file("3D/3dmodel.model", outModel);

  const droppedPaths = allPaths.filter((p) => {
    if (p === rootPath) return false;
    if (PRIVATE_PATH_PREFIXES.some((pre) => p.startsWith(pre))) return true;
    if (externalModelPaths.includes(p)) return true;
    // Anything else not carried over (rels, svgs, stray files) is dropped too.
    return p !== "[Content_Types].xml" && p !== "_rels/.rels";
  });

  const blob = await out.generateAsync({
    type: "blob",
    mimeType: "model/3mf",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return {
    blob,
    report: {
      droppedPaths,
      strippedNamespaces: [...strippedNs],
      mergedModelFiles: externalModelPaths.length,
      flattenedProduction: externalModelPaths.length > 0,
      inputBytes,
      outputBytes: blob.size,
    },
  };
}

// Find the root model path from _rels/.rels (the relationship of type
// .../3dmodel), falling back to the conventional location.
async function findRootModelPath(
  zip: JSZip,
  allPaths: string[],
): Promise<string | null> {
  const rels = zip.file("_rels/.rels");
  if (rels) {
    const xml = await rels.async("string");
    const re = /<Relationship\b[^>]*>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml)) !== null) {
      const tag = m[0];
      const type = getAttr(tag, "Type") ?? "";
      const target = getAttr(tag, "Target");
      if (type.includes("3dmodel") && target) {
        const norm = normalizePath(target);
        if (zip.file(norm)) return norm;
      }
    }
  }
  if (zip.file("3D/3dmodel.model")) return "3D/3dmodel.model";
  // Last resort: first .model under 3D/.
  return allPaths.find((p) => /\.model$/i.test(p) && p.startsWith("3D/")) ?? null;
}

// Pull out resource children that aren't <object> (materials, color groups…)
// so we can preserve them. Returns the concatenated XML or "".
function extractNonObjectResources(xml: string): string {
  const res = xml.match(/<resources\b[^>]*>([\s\S]*?)<\/resources>/);
  if (!res) return "";
  const inner = res[1];
  const withoutObjects = inner.replace(OBJECT_BLOCK_RE, "");
  return withoutObjects.trim();
}

// Reconstruct the root <model>: clean opening tag, flattened <resources>,
// and the original <build> with item objectids remapped.
function buildRootModel(
  rootXml: string,
  resourcesInner: string,
  idMap: Map<string, number>,
  rootPath: string,
  stripPrefixes: string[],
): string {
  // 1. Clean the <model> opening tag.
  let modelTag = rootXml.match(/<model\b[^>]*>/)?.[0] ?? `<model>`;
  for (const p of stripPrefixes) {
    modelTag = modelTag.replace(
      new RegExp(`\\sxmlns:${escapeRegExp(p)}\\s*=\\s*"[^"]*"`, "g"),
      "",
    );
  }
  modelTag = stripPrefixedAttrs(modelTag, stripPrefixes);
  // Drop now-unsatisfiable requiredextensions (we resolved the production ext).
  modelTag = modelTag.replace(/\srequiredextensions\s*=\s*"([^"]*)"/, (_m, val) => {
    const kept = (val as string)
      .split(/\s+/)
      .filter((tok) => tok && !stripPrefixes.includes(tok));
    return kept.length ? ` requiredextensions="${kept.join(" ")}"` : "";
  });

  // 2. Carry over root-level <metadata> (drop vendor-namespaced names).
  const metadata = (rootXml.match(/<metadata\b[\s\S]*?<\/metadata>|<metadata\b[^>]*\/>/g) ?? [])
    .filter((md) => {
      const name = getAttr(md, "name") ?? "";
      return !stripPrefixes.some((p) => name.startsWith(`${p}:`));
    });

  // 3. Rebuild <build> with remapped item objectids.
  const buildMatch = rootXml.match(/<build\b[^>]*>[\s\S]*?<\/build>|<build\b[^>]*\/>/);
  let buildXml = "  <build/>";
  if (buildMatch) {
    let b = buildMatch[0];
    b = b.replace(/<item\b[^>]*?\/?>/g, (tag) => {
      const oid = getAttr(tag, "objectid");
      if (oid == null) return stripPrefixedAttrs(tag, stripPrefixes);
      const g = idMap.get(`${rootPath}::${oid}`);
      let t = tag;
      if (g !== undefined) {
        t = t.replace(/(\sobjectid\s*=\s*")[^"]*"/, `$1${g}"`);
      }
      return stripPrefixedAttrs(t, stripPrefixes);
    });
    // Clean vendor attrs on the <build> tag itself.
    b = b.replace(/<build\b[^>]*?>/, (tag) => stripPrefixedAttrs(tag, stripPrefixes));
    buildXml = b;
  }

  const lines = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    modelTag,
    ...metadata.map((md) => `  ${md}`),
    `  <resources>`,
    resourcesInner,
    `  </resources>`,
    buildXml.startsWith("  ") ? buildXml : `  ${buildXml}`,
    `</model>`,
  ];
  return lines.join("\n");
}
