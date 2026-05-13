import JSZip from "jszip";

// Path patterns inside a .3mf zip that are vendor-private (slicer cache,
// project settings, AMS maps, calibration). We strip them so a generic 3MF
// reader (e.g. PrusaSlicer reading a Bambu .3mf) doesn't choke and the file
// shrinks to just geometry + standard metadata.
const PRIVATE_PATH_PREFIXES = [
  "Metadata/",
  "Auxiliaries/",
  "_rels/Metadata/",
];

// Files that must always survive — without them the 3MF is malformed.
function isCorePath(path: string): boolean {
  return (
    path === "[Content_Types].xml" ||
    path === "_rels/.rels" ||
    path === "3D/3dmodel.model"
  );
}

function shouldDrop(path: string): boolean {
  if (isCorePath(path)) return false;
  return PRIVATE_PATH_PREFIXES.some((p) => path.startsWith(p));
}

// Strip vendor-private XML namespaces (Bambu's `xmlns:p`, Prusa's `xmlns:slic3rpe`,
// OrcaSlicer's `xmlns:o`, etc.) and any attributes/elements that use them.
function stripPrivateNamespaces(xml: string): string {
  let cleaned = xml;
  // Capture custom namespace prefixes declared on the root <model> tag.
  const nsRegex = /\sxmlns:([a-zA-Z0-9_]+)="([^"]*)"/g;
  const prefixesToStrip = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = nsRegex.exec(xml)) !== null) {
    const prefix = match[1];
    const uri = match[2];
    // Standard 3MF namespaces we must keep:
    // - default xmlns (no prefix)
    // - "xml" prefix
    // Keep production_3mf and material_3mf if they appear standardised? They are
    // typically declared with a colon-prefixed name like p:production, but their
    // URI starts with "http://schemas.microsoft.com/3dmanufacturing/...". Keep
    // those. Strip vendor ones (bambulab.com, prusa3d.com, etc).
    if (uri.includes("schemas.microsoft.com/3dmanufacturing")) continue;
    if (prefix === "xml") continue;
    prefixesToStrip.add(prefix);
  }
  for (const prefix of prefixesToStrip) {
    const esc = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Remove namespace declaration
    cleaned = cleaned.replace(
      new RegExp(`\\sxmlns:${esc}="[^"]*"`, "g"),
      "",
    );
    // Remove attributes that use the prefix (e.g. p:UUID="...")
    cleaned = cleaned.replace(
      new RegExp(`\\s${esc}:[a-zA-Z_][\\w.-]*="[^"]*"`, "g"),
      "",
    );
    // Remove self-closing tags like <p:foo ... />
    cleaned = cleaned.replace(
      new RegExp(`<${esc}:[a-zA-Z_][\\w.-]*(?:\\s[^>]*)?\\s*/>`, "g"),
      "",
    );
    // Remove paired tags like <p:foo>...</p:foo> (non-greedy across newlines)
    cleaned = cleaned.replace(
      new RegExp(`<${esc}:[a-zA-Z_][\\w.-]*(?:\\s[^>]*)?>[\\s\\S]*?<\\/${esc}:[a-zA-Z_][\\w.-]*>`, "g"),
      "",
    );
  }
  return cleaned;
}

export type SanitizeReport = {
  droppedPaths: string[];
  strippedNamespaces: string[];
  inputBytes: number;
  outputBytes: number;
};

export type SanitizeResult = {
  blob: Blob;
  report: SanitizeReport;
};

export async function sanitize3MF(file: File | Blob): Promise<SanitizeResult> {
  const inputBytes = file.size;
  const zip = await JSZip.loadAsync(file);
  const out = new JSZip();

  const droppedPaths: string[] = [];
  let strippedNamespaces: string[] = [];

  const entries = Object.keys(zip.files).filter((p) => !zip.files[p].dir);
  for (const path of entries) {
    if (shouldDrop(path)) {
      droppedPaths.push(path);
      continue;
    }
    if (path === "3D/3dmodel.model") {
      const xml = await zip.files[path].async("string");
      const cleaned = stripPrivateNamespaces(xml);
      if (cleaned !== xml) {
        const matches = xml.match(/xmlns:[a-zA-Z0-9_]+="[^"]*"/g) ?? [];
        strippedNamespaces = matches
          .filter((m) => !m.includes("schemas.microsoft.com/3dmanufacturing"))
          .map((m) => m.replace(/^xmlns:/, "").split("=")[0]);
      }
      out.file(path, cleaned);
    } else {
      const data = await zip.files[path].async("uint8array");
      out.file(path, data);
    }
  }

  // Ensure core files exist (some malformed .3mf are missing them; throw clearly)
  if (!out.file("3D/3dmodel.model")) {
    throw new Error(
      "This file isn't a valid 3MF — it's missing the required 3D/3dmodel.model entry.",
    );
  }
  if (!out.file("[Content_Types].xml")) {
    // Reconstruct a minimal one.
    out.file(
      "[Content_Types].xml",
      `<?xml version="1.0" encoding="UTF-8"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />\n  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />\n</Types>\n`,
    );
  }
  if (!out.file("_rels/.rels")) {
    out.file(
      "_rels/.rels",
      `<?xml version="1.0" encoding="UTF-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />\n</Relationships>\n`,
    );
  }

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
      strippedNamespaces,
      inputBytes,
      outputBytes: blob.size,
    },
  };
}
