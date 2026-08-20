import * as THREE from "three";

/**
 * Turn a raster image into a printable 3D heightfield solid.
 *
 * Two modes, identical geometry pipeline — they only differ in the default
 * params and the brightness→thickness direction:
 *
 * - **relief**: bright pixels = taller (emboss / photo relief). Thicker plate.
 * - **lithophane**: dark pixels = thicker (block more backlight). Thin plate,
 *   `invert` on by default so dark areas appear dark when lit from behind.
 *
 * 100% client-side: samples luminance on a downsampled grid, displaces a plane
 * along +Z, and seals it into a watertight solid (top surface + flat bottom +
 * perimeter walls) so it slices and prints without a repair step.
 */

export type HeightmapMode = "relief" | "lithophane";

export type ImageToMeshOptions = {
  mode: HeightmapMode;
  /** Physical width (X extent) of the model, in millimetres. Y follows pixel aspect. */
  widthMM: number;
  /** Flat base thickness under the lowest point, in millimetres. */
  baseThicknessMM: number;
  /** Total thickness at the tallest point, in millimetres (must be > base). */
  maxThicknessMM: number;
  /** Max samples along the longer image edge — caps triangle count. */
  resolution: number;
  /** Flip the brightness→thickness mapping. */
  invert: boolean;
  /**
   * Also carry the image's colours as per-vertex colours. STL/OBJ/3MF cannot
   * store them — only PLY and GLB can — so the UI restricts the export format
   * when this is on rather than silently dropping the colour.
   */
  keepColor: boolean;
};

export const MODE_DEFAULTS: Record<HeightmapMode, ImageToMeshOptions> = {
  relief: {
    mode: "relief",
    widthMM: 100,
    baseThicknessMM: 1,
    maxThicknessMM: 6,
    resolution: 200,
    invert: false,
    keepColor: false,
  },
  lithophane: {
    mode: "lithophane",
    widthMM: 100,
    baseThicknessMM: 0.8,
    maxThicknessMM: 3,
    resolution: 250,
    invert: true,
    keepColor: false,
  },
};

export const RESOLUTION_MIN = 60;
export const RESOLUTION_MAX = 400;

export type Heightfield = {
  width: number;
  height: number;
  /** Normalised luminance in [0,1], row-major, length width*height. */
  lum: Float32Array;
  /**
   * Per-pixel colour in three.js working (linear) space, row-major,
   * length width*height*3. Sampled in the same pass as `lum` — the exporters
   * convert back to sRGB on write, so storing linear here is what keeps the
   * printed colours matching the source image.
   */
  rgb: Float32Array;
};

/**
 * sRGB byte → linear float, precomputed for all 256 values. three.js works in
 * linear space and both PLYExporter and GLTFExporter convert back to sRGB when
 * writing, so feeding them sRGB directly would double-apply the transfer curve
 * and wash the colours out.
 */
const SRGB_TO_LINEAR = (() => {
  const lut = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const c = i / 255;
    lut[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  return lut;
})();

/**
 * Draw the image onto a canvas downsampled so its longer edge is `resolution`
 * pixels, then read back per-pixel luminance and colour (Rec. 601 weights for
 * luminance).
 */
export function sampleLuminance(
  source: CanvasImageSource & { width: number; height: number },
  resolution: number,
): Heightfield {
  const srcW = source.width;
  const srcH = source.height;
  const res = Math.max(RESOLUTION_MIN, Math.min(RESOLUTION_MAX, Math.round(resolution)));

  let w: number;
  let h: number;
  if (srcW >= srcH) {
    w = res;
    h = Math.max(2, Math.round((res * srcH) / srcW));
  } else {
    h = res;
    w = Math.max(2, Math.round((res * srcW) / srcH));
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not get a 2D canvas context");
  // White backdrop so transparent PNG areas read as the lightest value
  // (= base thickness) instead of black spikes.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(source, 0, 0, w, h);

  const { data } = ctx.getImageData(0, 0, w, h);
  const lum = new Float32Array(w * h);
  const rgb = new Float32Array(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const a = data[i * 4 + 3] / 255;
    // Composite over white for partial alpha.
    const lr = r * a + 255 * (1 - a);
    const lg = g * a + 255 * (1 - a);
    const lb = b * a + 255 * (1 - a);
    lum[i] = (0.299 * lr + 0.587 * lg + 0.114 * lb) / 255;
    rgb[i * 3] = SRGB_TO_LINEAR[Math.round(lr)];
    rgb[i * 3 + 1] = SRGB_TO_LINEAR[Math.round(lg)];
    rgb[i * 3 + 2] = SRGB_TO_LINEAR[Math.round(lb)];
  }

  return { width: w, height: h, lum, rgb };
}

const BRAND_BLUE = 0x3b82f6;

/**
 * Build a watertight solid from a heightfield. Z is thickness (plate lies flat
 * on the XY plane, ready for the print bed), and the model is centred in XY.
 */
export function heightfieldToMesh(
  field: Heightfield,
  opts: ImageToMeshOptions,
): THREE.Mesh {
  const { width: w, height: h, lum, rgb } = field;
  const withColor = opts.keepColor && rgb.length === w * h * 3;
  const range = Math.max(0.01, opts.maxThicknessMM - opts.baseThicknessMM);
  const scale = opts.widthMM / (w - 1); // mm per pixel step, same on X and Y
  const offX = (opts.widthMM) / 2;
  const offY = (scale * (h - 1)) / 2;

  // top Z for grid node (x, y); image row is flipped so the picture is upright
  // when viewed from +Z.
  const topZ = (x: number, y: number): number => {
    const srcRow = h - 1 - y;
    let f = lum[srcRow * w + x];
    if (opts.invert) f = 1 - f;
    return opts.baseThicknessMM + f * range;
  };

  const positions: number[] = [];
  const indices: number[] = [];
  // One colour per vertex. The bottom grid repeats the top colour so the side
  // walls read as a solid edge of that colour instead of fading to black.
  const colors: number[] = [];

  const pushColor = (x: number, y: number) => {
    if (!withColor) return;
    const i = ((h - 1 - y) * w + x) * 3;
    colors.push(rgb[i], rgb[i + 1], rgb[i + 2]);
  };

  const top = (x: number, y: number) => y * w + x;
  const bottom = (x: number, y: number) => w * h + y * w + x;

  // Vertices: top surface grid, then a matching flat bottom grid at z=0.
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      positions.push(x * scale - offX, y * scale - offY, topZ(x, y));
      pushColor(x, y);
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      positions.push(x * scale - offX, y * scale - offY, 0);
      pushColor(x, y);
    }
  }

  // Top faces — CCW seen from +Z (outward/up).
  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      const a = top(x, y);
      const b = top(x + 1, y);
      const c = top(x + 1, y + 1);
      const d = top(x, y + 1);
      indices.push(a, b, c, a, c, d);
    }
  }
  // Bottom faces — reversed winding (outward/down).
  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      const a = bottom(x, y);
      const b = bottom(x + 1, y);
      const c = bottom(x + 1, y + 1);
      const d = bottom(x, y + 1);
      indices.push(a, c, b, a, d, c);
    }
  }
  // Side walls around the perimeter, outward-facing.
  const wall = (t0: number, t1: number, b0: number, b1: number) => {
    // top edge t0->t1, bottom edge b0->b1, wound so the normal points out.
    indices.push(t0, b0, b1, t0, b1, t1);
  };
  for (let x = 0; x < w - 1; x++) {
    // front edge (y = 0): outward normal -Y
    wall(top(x + 1, 0), top(x, 0), bottom(x + 1, 0), bottom(x, 0));
    // back edge (y = h-1): outward normal +Y
    wall(top(x, h - 1), top(x + 1, h - 1), bottom(x, h - 1), bottom(x + 1, h - 1));
  }
  for (let y = 0; y < h - 1; y++) {
    // left edge (x = 0): outward normal -X
    wall(top(0, y), top(0, y + 1), bottom(0, y), bottom(0, y + 1));
    // right edge (x = w-1): outward normal +X
    wall(top(w - 1, y + 1), top(w - 1, y), bottom(w - 1, y + 1), bottom(w - 1, y));
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  if (withColor) {
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  }
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    // White base so the per-vertex colours come through unmodulated; the brand
    // blue is only the fallback for the plain, colourless relief.
    color: withColor ? 0xffffff : BRAND_BLUE,
    vertexColors: withColor,
    metalness: 0.05,
    roughness: 0.75,
    side: THREE.DoubleSide,
  });
  return new THREE.Mesh(geo, mat);
}

export type MeshResult = {
  mesh: THREE.Mesh;
  triangles: number;
  /** Physical size of the model in mm: [x, y, z]. */
  sizeMM: [number, number, number];
};

/** Convenience: sample + build in one call. */
export function imageToMesh(
  source: CanvasImageSource & { width: number; height: number },
  opts: ImageToMeshOptions,
): MeshResult {
  const field = sampleLuminance(source, opts.resolution);
  const mesh = heightfieldToMesh(field, opts);
  const triangles =
    (field.width - 1) * (field.height - 1) * 2 * 2 +
    (field.width - 1) * 2 * 2 +
    (field.height - 1) * 2 * 2;
  const scale = opts.widthMM / (field.width - 1);
  return {
    mesh,
    triangles,
    sizeMM: [opts.widthMM, scale * (field.height - 1), opts.maxThicknessMM],
  };
}
