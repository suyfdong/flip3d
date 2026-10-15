import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader.js";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";
import type { Format } from "./formats";

const DEFAULT_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0x3b82f6,
  metalness: 0.1,
  roughness: 0.6,
});

export async function parseToObject(
  buffer: ArrayBuffer,
  format: Format,
): Promise<THREE.Object3D> {
  switch (format) {
    case "stl": {
      const geometry = new STLLoader().parse(buffer);
      geometry.computeVertexNormals();
      return new THREE.Mesh(geometry, DEFAULT_MATERIAL.clone());
    }
    case "obj": {
      const text = new TextDecoder("utf-8").decode(buffer);
      const group = new OBJLoader().parse(text);
      applyBrandMaterial(group);
      return group;
    }
    case "glb": {
      const scene = await new Promise<THREE.Object3D>((resolve, reject) => {
        new GLTFLoader().parse(
          buffer,
          "",
          (gltf) => resolve(gltf.scene),
          (event) => reject(new Error(event.message || "Failed to parse GLB")),
        );
      });
      applyBrandMaterial(scene);
      return scene;
    }
    case "3mf": {
      const { buffer: flat, flattenedParts } = await flattenProduction3MF(buffer);
      const group = new ThreeMFLoader().parse(flat);
      keepNativeOrBrand(group, (m) => m.name !== THREE.Loader.DEFAULT_MATERIAL_NAME);
      if (flattenedParts > 0) group.userData.flattenedParts = flattenedParts;
      return group;
    }
    case "ply": {
      return parsePly(buffer);
    }
    case "step": {
      const { parseStepFile } = await import("./step");
      return parseStepFile(buffer);
    }
    case "iges": {
      const { parseIgesFile } = await import("./step");
      return parseIgesFile(buffer);
    }
    case "fbx": {
      const { FBXLoader } = await import("three/examples/jsm/loaders/FBXLoader.js");
      const group = new FBXLoader().parse(buffer, "");
      applyBrandMaterial(group);
      return group;
    }
    case "dae": {
      const { ColladaLoader } = await import(
        "three/examples/jsm/loaders/ColladaLoader.js"
      );
      const text = new TextDecoder("utf-8").decode(buffer);
      const result = new ColladaLoader().parse(text, "");
      if (!result || !result.scene) {
        throw new Error("Failed to parse Collada (.dae) file");
      }
      applyBrandMaterial(result.scene);
      return result.scene;
    }
  }
}

// Marks meshes whose material carries the file's own colors, so the viewer's
// theme tint leaves them alone. Meshes without native color get brand blue.
function keepNativeOrBrand(
  root: THREE.Object3D,
  hasNativeColor: (m: THREE.Material) => boolean,
): void {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    if (mats.some((m) => m && hasNativeColor(m))) {
      child.userData.keepColor = true;
      return;
    }
    mats.forEach((m) => m?.dispose());
    child.material = DEFAULT_MATERIAL.clone();
  });
}

// Bambu / Orca 3MFs use the production extension: the root model holds no
// geometry and references 3D/Objects/*.model files. ThreeMFLoader only reads
// the root, so flatten first with the same sanitizer the Bambu → Prusa tool uses.
async function flattenProduction3MF(
  buffer: ArrayBuffer,
): Promise<{ buffer: ArrayBuffer; flattenedParts: number }> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(buffer);
  const external = Object.keys(zip.files).some(
    (p) => /^3D\/.+\.model$/i.test(p) && p.toLowerCase() !== "3d/3dmodel.model",
  );
  if (!external) return { buffer, flattenedParts: 0 };
  const { sanitize3MF } = await import("./3mf-sanitizer");
  const { blob, report } = await sanitize3MF(new Blob([buffer]));
  return { buffer: await blob.arrayBuffer(), flattenedParts: report.mergedModelFiles };
}

// 3D Gaussian Splat PLYs store color as spherical-harmonic DC terms.
const SH_C0 = 0.28209479177387814;

function parsePly(buffer: ArrayBuffer): THREE.Object3D {
  const header = new TextDecoder().decode(buffer.slice(0, Math.min(buffer.byteLength, 4096)));
  const isSplat = /property\s+\S+\s+f_dc_0\b/.test(header);
  const loader = new PLYLoader();
  if (isSplat) loader.setCustomPropertyNameMapping({ shDc: ["f_dc_0", "f_dc_1", "f_dc_2"] });
  const geometry = loader.parse(buffer);
  const position = geometry.getAttribute("position");

  if (isSplat) {
    const dc = geometry.getAttribute("shDc");
    if (dc) {
      const colors = new Float32Array(dc.count * 3);
      const c = new THREE.Color();
      for (let i = 0; i < dc.count; i++) {
        const clamp = (v: number) => Math.min(1, Math.max(0, 0.5 + SH_C0 * v));
        c.setRGB(clamp(dc.getX(i)), clamp(dc.getY(i)), clamp(dc.getZ(i)), THREE.SRGBColorSpace);
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geometry.deleteAttribute("shDc");
    }
  }

  const hasColor = !!geometry.getAttribute("color");

  // No faces → point cloud (scans, photogrammetry, splats). Rendering it as a
  // Mesh would stitch every three points into a junk triangle.
  if (!geometry.getIndex()) {
    geometry.computeBoundingBox();
    const size = new THREE.Vector3();
    geometry.boundingBox!.getSize(size);
    const diag = size.length() || 1;
    const pointSize = Math.min(diag / 50, Math.max(diag / 2000, (diag / Math.sqrt(position.count)) * 1.5));
    const points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        size: pointSize,
        sizeAttenuation: true,
        vertexColors: hasColor,
        color: hasColor ? 0xffffff : 0x3b82f6,
      }),
    );
    points.userData.keepColor = hasColor;
    points.userData.pointCloud = { points: position.count, splat: isSplat, color: hasColor };
    return points;
  }

  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  if (hasColor) {
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ vertexColors: true, color: 0xffffff, metalness: 0, roughness: 0.8 }),
    );
    mesh.userData.keepColor = true;
    return mesh;
  }
  return new THREE.Mesh(geometry, DEFAULT_MATERIAL.clone());
}

function applyBrandMaterial(root: THREE.Object3D): void {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const oldMat = child.material;
    if (Array.isArray(oldMat)) {
      oldMat.forEach((m) => m.dispose());
    } else if (oldMat) {
      oldMat.dispose();
    }
    child.material = DEFAULT_MATERIAL.clone();
  });
}
