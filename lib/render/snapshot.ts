// Offscreen WebGL render of a parsed 3D object to a raster image Blob.
//
// Browser-only (needs a canvas + WebGL). Never reuses MeshViewer's renderer:
// that one is created without `preserveDrawingBuffer`, so reading its canvas
// after a frame returns an empty buffer on most drivers. A throwaway renderer
// also lets the output resolution be independent of the on-screen viewport.

import * as THREE from "three";
import {
  cameraPositionFor,
  clampSize,
  fitDistance,
  IMAGE_MIME,
  supportsAlpha,
  type ImageFormat,
  type ViewPreset,
} from "./framing";

export type SnapshotOptions = {
  width: number;
  height: number;
  format: ImageFormat;
  view: ViewPreset;
  /** "transparent" or any CSS/hex color three.js accepts. */
  background: string;
  /** 0–1, applies to JPG and WebP only. */
  quality?: number;
};

const FOV = 45;

/** Render `object` once, offscreen, and return the encoded image. */
export async function renderObjectToBlob(
  object: THREE.Object3D,
  opts: SnapshotOptions,
): Promise<Blob> {
  const width = clampSize(opts.width);
  const height = clampSize(opts.height);
  // JPEG has no alpha: a "transparent" pick would encode as black, so fall
  // back to white rather than silently handing back a black-backed image.
  const transparent = opts.background === "transparent" && supportsAlpha(opts.format);
  const solid = opts.background === "transparent" ? "#ffffff" : opts.background;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });

  try {
    renderer.setPixelRatio(1); // output is exactly width × height pixels
    renderer.setSize(width, height, false);

    const scene = new THREE.Scene();
    if (transparent) {
      renderer.setClearColor(0x000000, 0);
    } else {
      scene.background = new THREE.Color(solid);
    }

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 0.8);
    key.position.set(100, 100, 100);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-100, -100, -100);
    scene.add(fill);

    // Center on the origin so every view preset frames the same way. The
    // object may already be centered (MeshViewer does this) — recentering is
    // idempotent, and the original position is restored either way.
    //
    // The live preview owns this object: an Object3D has exactly one parent,
    // so adding it to our throwaway scene REPARENTS it out of MeshViewer's.
    // Remember where it came from and put it back, or the preview goes blank
    // after the first render.
    const originalParent = object.parent;
    const originalPosition = object.position.clone();
    const box = new THREE.Box3().setFromObject(object);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    object.position.sub(center);

    const aspect = width / height;
    const distance = fitDistance(size, aspect, FOV);
    const pos = cameraPositionFor(opts.view, distance);
    const camera = new THREE.PerspectiveCamera(FOV, aspect, distance / 100, distance * 100);
    camera.position.set(pos.x, pos.y, pos.z);
    camera.lookAt(0, 0, 0);

    try {
      scene.add(object);
      renderer.render(scene, camera);
    } finally {
      // Hand the object back untouched, even if the draw threw: restore its
      // transform and return it to whichever scene owned it.
      scene.remove(object);
      object.position.copy(originalPosition);
      if (originalParent) originalParent.add(object);
    }

    const blob = await canvasToBlob(
      renderer.domElement,
      IMAGE_MIME[opts.format],
      opts.quality,
    );
    if (!blob) throw new Error("The browser could not encode that image format.");
    return blob;
  } finally {
    renderer.dispose();
    renderer.forceContextLoss();
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), mime, quality);
  });
}
