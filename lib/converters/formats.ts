export const FORMATS = ["stl", "obj", "glb", "3mf", "ply", "step"] as const;
export type Format = (typeof FORMATS)[number];

const FORMAT_SET = new Set<string>(FORMATS);

// Formats that can only be read, never written.
export const SOURCE_ONLY_FORMATS: ReadonlySet<Format> = new Set(["step"]);

export function isFormat(s: string): s is Format {
  return FORMAT_SET.has(s);
}

export function isExportable(fmt: Format): boolean {
  return !SOURCE_ONLY_FORMATS.has(fmt);
}

export function detectFormat(filename: string): Format | null {
  const lower = filename.toLowerCase();
  const ext = lower.split(".").pop() ?? "";
  // .stp is an accepted alias of .step
  if (ext === "stp") return "step";
  return isFormat(ext) ? ext : null;
}

export const MIME_TYPES: Record<Format, string> = {
  stl: "model/stl",
  obj: "model/obj",
  glb: "model/gltf-binary",
  "3mf": "model/3mf",
  ply: "application/octet-stream",
  step: "model/step",
};

export const FORMAT_LABELS: Record<Format, string> = {
  stl: "STL",
  obj: "OBJ",
  glb: "GLB",
  "3mf": "3MF",
  ply: "PLY",
  step: "STEP",
};
