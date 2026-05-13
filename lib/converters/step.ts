import * as THREE from "three";

type OcctMesh = {
  name?: string;
  color?: [number, number, number];
  attributes: {
    position: { array: number[] };
    normal?: { array: number[] };
  };
  index: { array: number[] };
};

type OcctResult = {
  success: boolean;
  root: { name?: string; meshes: number[]; children: unknown[] };
  meshes: OcctMesh[];
};

type OcctModule = {
  ReadStepFile: (data: Uint8Array, params: unknown) => OcctResult;
};

let occtPromise: Promise<OcctModule> | null = null;

function loadOcct(): Promise<OcctModule> {
  if (occtPromise) return occtPromise;
  occtPromise = (async () => {
    // Dynamic import keeps this off the main bundle.
    const mod = await import("occt-import-js");
    const factory = (mod.default ?? mod) as (
      opts?: { locateFile?: (path: string) => string },
    ) => Promise<OcctModule>;
    return factory({
      locateFile: (path: string) =>
        path.endsWith(".wasm") ? "/wasm/occt-import-js.wasm" : path,
    });
  })();
  return occtPromise;
}

const BRAND_COLOR = 0x3b82f6;

export async function parseStepFile(buffer: ArrayBuffer): Promise<THREE.Object3D> {
  const occt = await loadOcct();
  const result = occt.ReadStepFile(new Uint8Array(buffer), null);
  if (!result.success) {
    throw new Error("STEP parser rejected the file");
  }
  if (!result.meshes.length) {
    throw new Error("STEP file contained no triangulated meshes");
  }

  const group = new THREE.Group();
  group.name = result.root.name ?? "step-import";

  for (const mesh of result.meshes) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(mesh.attributes.position.array, 3),
    );
    if (mesh.attributes.normal?.array) {
      geometry.setAttribute(
        "normal",
        new THREE.Float32BufferAttribute(mesh.attributes.normal.array, 3),
      );
    }
    geometry.setIndex(mesh.index.array);
    if (!mesh.attributes.normal?.array) {
      geometry.computeVertexNormals();
    }

    const material = new THREE.MeshStandardMaterial({
      color: BRAND_COLOR,
      metalness: 0.1,
      roughness: 0.6,
    });
    const threeMesh = new THREE.Mesh(geometry, material);
    threeMesh.name = mesh.name ?? "";
    group.add(threeMesh);
  }

  return group;
}
