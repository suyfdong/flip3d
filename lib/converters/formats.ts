export const FORMATS = ["stl", "obj", "glb", "3mf", "ply"] as const;
export type Format = (typeof FORMATS)[number];

const FORMAT_SET = new Set<string>(FORMATS);

export function isFormat(s: string): s is Format {
  return FORMAT_SET.has(s);
}

export function detectFormat(filename: string): Format | null {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  return isFormat(ext) ? ext : null;
}

export const MIME_TYPES: Record<Format, string> = {
  stl: "model/stl",
  obj: "model/obj",
  glb: "model/gltf-binary",
  "3mf": "model/3mf",
  ply: "application/octet-stream",
};

export const FORMAT_LABELS: Record<Format, string> = {
  stl: "STL",
  obj: "OBJ",
  glb: "GLB",
  "3mf": "3MF",
  ply: "PLY",
};
