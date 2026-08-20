// Pure framing / naming math for the 3D → image snapshot pipeline.
//
// Deliberately free of three.js and DOM so the whole file runs (and is tested)
// in Node — same split as lib/dxf/*. The WebGL half lives in ./snapshot.ts.

export const IMAGE_FORMATS = ["png", "jpg", "webp"] as const;
export type ImageFormat = (typeof IMAGE_FORMATS)[number];

export const IMAGE_MIME: Record<ImageFormat, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

export const IMAGE_LABELS: Record<ImageFormat, string> = {
  png: "PNG",
  jpg: "JPG",
  webp: "WebP",
};

/** JPEG has no alpha channel — a transparent background silently becomes black. */
export function supportsAlpha(format: ImageFormat): boolean {
  return format !== "jpg";
}

export type Vec3 = { x: number; y: number; z: number };

/** Camera angles offered in the UI. */
export const VIEW_PRESETS = ["iso", "front", "top", "right"] as const;
export type ViewPreset = (typeof VIEW_PRESETS)[number];

export const VIEW_LABELS: Record<ViewPreset, string> = {
  iso: "Isometric",
  front: "Front",
  top: "Top",
  right: "Right",
};

// Unit-ish direction the camera sits along, looking back at the origin. `top`
// is nudged off the Y axis because a camera straight above the target with an
// up-vector of (0,1,0) is degenerate and produces an undefined roll.
const VIEW_DIRS: Record<ViewPreset, Vec3> = {
  iso: { x: 1, y: 0.85, z: 1.15 },
  front: { x: 0, y: 0, z: 1 },
  top: { x: 0, y: 1, z: 0.0001 },
  right: { x: 1, y: 0, z: 0 },
};

export const SIZE_MIN = 64;
export const SIZE_MAX = 4096;

/** Keep output within WebGL-safe bounds and on whole pixels. */
export function clampSize(n: number): number {
  if (!Number.isFinite(n)) return SIZE_MIN;
  return Math.min(SIZE_MAX, Math.max(SIZE_MIN, Math.round(n)));
}

/**
 * Radius of the bounding sphere around a bounding box of `size`. Using the
 * sphere (not the box) makes the framing rotation-independent, so every view
 * preset gets the same scale instead of the model jumping between angles.
 */
export function boundingRadius(size: Vec3): number {
  const r = 0.5 * Math.hypot(size.x, size.y, size.z);
  return r > 0 ? r : 1;
}

/**
 * Distance at which a sphere of `radius` exactly fills the smaller of the two
 * frustum half-angles, times `padding` for breathing room. Handles portrait
 * viewports: when aspect < 1 the horizontal angle is the binding constraint.
 */
export function fitDistance(
  size: Vec3,
  aspect: number,
  fovDeg: number,
  padding = 1.12,
): number {
  const radius = boundingRadius(size);
  const safeAspect = aspect > 0 && Number.isFinite(aspect) ? aspect : 1;
  const halfV = (fovDeg / 2) * (Math.PI / 180);
  const halfH = Math.atan(Math.tan(halfV) * safeAspect);
  return (radius / Math.sin(Math.min(halfV, halfH))) * padding;
}

/** Camera position for a preset, `distance` away from the origin. */
export function cameraPositionFor(preset: ViewPreset, distance: number): Vec3 {
  const dir = VIEW_DIRS[preset];
  const len = Math.hypot(dir.x, dir.y, dir.z) || 1;
  return {
    x: (dir.x / len) * distance,
    y: (dir.y / len) * distance,
    z: (dir.z / len) * distance,
  };
}

/** "chair.stl" + "png" → "chair.png". Files without an extension just gain one. */
export function outputName(sourceName: string, format: ImageFormat): string {
  const base = sourceName.replace(/\.[^./\\]+$/, "").trim();
  return `${base || "model"}.${format}`;
}
