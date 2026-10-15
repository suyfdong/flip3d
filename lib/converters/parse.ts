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
      const mesh = new THREE.Mesh(geometry, DEFAULT_MATERIAL.clone());
      mesh.userData.upAxis = "z"; // 3D-printing convention: Z is up
      return mesh;
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
          (gltf) => {
            // Keep the clips on the root so the viewer can play them.
            gltf.scene.animations = gltf.animations;
            resolve(gltf.scene);
          },
          (event) => reject(new Error(event.message || "Failed to parse GLB")),
        );
      });
      // A GLB's materials and textures are the point of the format (AI-generated
      // models especially) — keep them. Only glTF's built-in default material
      // (no material assigned in the file) gets the brand color.
      keepNativeOrBrand(scene, (m) => !isGltfDefaultMaterial(m));
      let kept = false;
      scene.traverse((n) => {
        if (n.userData.keepColor) kept = true;
      });
      if (kept) scene.userData.pbr = true;
      return scene;
    }
    case "3mf": {
      const { read3MFMeta, colorForObject } = await import("./3mf-meta");
      const meta = await read3MFMeta(buffer).catch(() => null);
      const { buffer: flat, flattenedParts } = await flattenProduction3MF(buffer);
      const group = new ThreeMFLoader().parse(flat);
      // Children follow <build> item order, so meta.buildObjectIds[i] names child i.
      group.children.forEach((child, i) => {
        const id = meta?.buildObjectIds[i];
        const objMeta = id ? meta?.objects.find((o) => o.id === id) : undefined;
        if (objMeta?.name) child.name = objMeta.name;
        if (id) child.userData.objectId = id;
      });
      keepNativeOrBrand(group, (m) => m.name !== THREE.Loader.DEFAULT_MATERIAL_NAME);
      // Slicer projects carry color per filament slot, not in the mesh: paint
      // each object with the filament it is assigned to.
      if (meta?.filaments.length) {
        group.children.forEach((child) => {
          const hex = child.userData.objectId && colorForObject(meta, child.userData.objectId);
          if (!hex) return;
          child.traverse((n) => {
            if (!(n instanceof THREE.Mesh) || n.userData.keepColor) return;
            (n.material as THREE.Material).dispose();
            n.material = new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), metalness: 0.05, roughness: 0.7 });
            n.userData.keepColor = true;
          });
        });
      }
      if (meta?.filaments.length) await applyPaintedColors(group, flat, meta);
      if (flattenedParts > 0) group.userData.flattenedParts = flattenedParts;
      if (meta) group.userData.threeMF = meta;
      group.userData.upAxis = "z";
      return group;
    }
    case "ply": {
      return parsePly(buffer);
    }
    case "step": {
      const { parseStepFile } = await import("./step");
      // No reliable up-axis convention across CAD tools (SolidWorks is Y-up,
      // many others Z-up) — keep the file's frame; the viewer has a toggle.
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

// GLTFLoader's createDefaultMaterial(): unnamed white MeshStandardMaterial with
// metalness 1 / roughness 1 and no maps — what a primitive gets when the file
// assigns no material.
function isGltfDefaultMaterial(m: THREE.Material): boolean {
  return (
    m instanceof THREE.MeshStandardMaterial &&
    !m.name &&
    !m.map &&
    !m.vertexColors &&
    m.metalness === 1 &&
    m.roughness === 1 &&
    m.color.getHex() === 0xffffff
  );
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

// Bambu / Orca / PrusaSlicer "paint" multi-material per triangle. The loader
// keeps triangle order, so a mesh is matched to its painted object by triangle
// count + first vertex, then recolored per face (non-indexed, vertex colors).
async function applyPaintedColors(
  group: THREE.Object3D,
  flat: ArrayBuffer,
  meta: import("./3mf-meta").ThreeMFMeta,
): Promise<void> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(flat);
  const entry = zip.file("3D/3dmodel.model") ?? zip.file(/^3D\/[^/]+\.model$/i)[0];
  if (!entry) return;
  const { readPaintedMeshes } = await import("./3mf-paint");
  const { colorForObject } = await import("./3mf-meta");
  const painted = readPaintedMeshes(await entry.async("string"));
  if (!painted.length) return;

  const palette = meta.filaments.map((f) => new THREE.Color(f.color));
  const done = new Map<string, THREE.BufferGeometry>();
  group.updateMatrixWorld(true);
  group.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    const geo = node.geometry as THREE.BufferGeometry;
    const index = geo.getIndex();
    const pos = geo.getAttribute("position");
    if (!index || !pos) {
      const cached = done.get(geo.uuid);
      if (cached) node.geometry = cached;
      return;
    }
    const triCount = index.count / 3;
    const v0 = [pos.getX(0), pos.getY(0), pos.getZ(0)];
    const hit = painted.find(
      (p) => p.triCount === triCount && p.firstVertex.every((c, i) => Math.abs(c - v0[i]) < 1e-3),
    );
    if (!hit) return;

    // Unpainted faces use the object's own filament.
    let objectId: string | undefined;
    node.traverseAncestors((a) => {
      if (!objectId && a.userData.objectId) objectId = a.userData.objectId;
    });
    const baseHex = (objectId && colorForObject(meta, objectId)) || meta.filaments[0].color;
    const base = new THREE.Color(baseHex);

    let flatGeo = done.get(geo.uuid);
    if (!flatGeo) {
      flatGeo = geo.toNonIndexed();
      const colors = new Float32Array(triCount * 9);
      for (let t = 0; t < triCount; t++) {
        const s = hit.states[t];
        const c = (s > 0 && palette[s - 1]) || base;
        for (let k = 0; k < 3; k++) {
          colors[t * 9 + k * 3] = c.r;
          colors[t * 9 + k * 3 + 1] = c.g;
          colors[t * 9 + k * 3 + 2] = c.b;
        }
      }
      flatGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      flatGeo.computeVertexNormals();
      done.set(geo.uuid, flatGeo);
      geo.dispose();
    }
    node.geometry = flatGeo;
    const old = node.material as THREE.Material;
    old.dispose();
    node.material = new THREE.MeshStandardMaterial({ vertexColors: true, color: 0xffffff, metalness: 0.05, roughness: 0.7 });
    node.userData.keepColor = true;
    node.userData.painted = true;
  });
  if (done.size) group.userData.paintedMeshes = done.size;
}

// 3D Gaussian Splat PLYs store color as spherical-harmonic DC terms.
const SH_C0 = 0.28209479177387814;

export type PlyHeader = {
  format: string;
  elements: { name: string; count: number; properties: string[] }[];
};

function parsePlyHeader(header: string): PlyHeader {
  const end = header.indexOf("end_header");
  const lines = (end >= 0 ? header.slice(0, end) : header).split(/\r?\n/);
  const out: PlyHeader = { format: "", elements: [] };
  for (const line of lines) {
    const t = line.trim().split(/\s+/);
    if (t[0] === "format") out.format = t[1] ?? "";
    else if (t[0] === "element") out.elements.push({ name: t[1], count: Number(t[2]) || 0, properties: [] });
    else if (t[0] === "property" && out.elements.length) {
      out.elements[out.elements.length - 1].properties.push(t[t.length - 1]);
    }
  }
  return out;
}

function parsePly(buffer: ArrayBuffer): THREE.Object3D {
  const header = new TextDecoder().decode(buffer.slice(0, Math.min(buffer.byteLength, 16384)));
  const plyHeader = parsePlyHeader(header);
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
    points.userData.ply = plyHeader;
    return points;
  }

  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  if (hasColor) {
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ vertexColors: true, color: 0xffffff, metalness: 0, roughness: 0.8 }),
    );
    mesh.userData.keepColor = true;
    mesh.userData.ply = plyHeader;
    return mesh;
  }
  const plain = new THREE.Mesh(geometry, DEFAULT_MATERIAL.clone());
  plain.userData.ply = plyHeader;
  return plain;
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
