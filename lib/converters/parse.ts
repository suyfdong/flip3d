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
      const group = new ThreeMFLoader().parse(buffer);
      applyBrandMaterial(group);
      return group;
    }
    case "ply": {
      const geometry = new PLYLoader().parse(buffer);
      if (!geometry.attributes.normal) geometry.computeVertexNormals();
      return new THREE.Mesh(geometry, DEFAULT_MATERIAL.clone());
    }
  }
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
