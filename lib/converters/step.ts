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

type OcctNode = { name?: string; meshes: number[]; children: OcctNode[] };

type OcctResult = {
  success: boolean;
  root: OcctNode;
  meshes: OcctMesh[];
};

type OcctModule = {
  ReadStepFile: (data: Uint8Array, params: unknown) => OcctResult;
  ReadIgesFile: (data: Uint8Array, params: unknown) => OcctResult;
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

function resultToGroup(result: OcctResult, fallbackName: string): THREE.Group {
  if (!result.success) {
    throw new Error(`${fallbackName} parser rejected the file`);
  }
  if (!result.meshes.length) {
    throw new Error(`${fallbackName} file contained no triangulated meshes`);
  }

  const meshes = result.meshes.map((mesh) => {
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

    // Keep the CAD file's own part color when it has one (occt reports sRGB 0–1).
    const material = new THREE.MeshStandardMaterial({
      color: BRAND_COLOR,
      metalness: 0.1,
      roughness: 0.6,
    });
    if (mesh.color) material.color.setRGB(...mesh.color, THREE.SRGBColorSpace);
    const threeMesh = new THREE.Mesh(geometry, material);
    threeMesh.name = mesh.name ?? "";
    if (mesh.color) threeMesh.userData.keepColor = true;
    return threeMesh;
  });

  // Mirror the file's assembly tree (sub-assemblies → parts) so the viewer can
  // list and toggle parts. A mesh referenced twice is cloned (shares geometry).
  const used = new Set<number>();
  const buildNode = (node: OcctNode): THREE.Group => {
    const g = new THREE.Group();
    g.name = node.name ?? "";
    for (const i of node.meshes ?? []) {
      const m = meshes[i];
      if (!m) continue;
      g.add(used.has(i) ? m.clone() : m);
      used.add(i);
    }
    for (const child of node.children ?? []) g.add(buildNode(child));
    return g;
  };
  const group = buildNode(result.root);
  if (!group.name) group.name = `${fallbackName.toLowerCase()}-import`;
  // Meshes the tree never referenced still belong in the model.
  meshes.forEach((m, i) => {
    if (!used.has(i)) group.add(m);
  });
  group.userData.assembly = true;

  return group;
}

export async function parseStepFile(buffer: ArrayBuffer): Promise<THREE.Object3D> {
  const occt = await loadOcct();
  const result = occt.ReadStepFile(new Uint8Array(buffer), null);
  return resultToGroup(result, "STEP");
}

export async function parseIgesFile(buffer: ArrayBuffer): Promise<THREE.Object3D> {
  const occt = await loadOcct();
  const result = occt.ReadIgesFile(new Uint8Array(buffer), null);
  return resultToGroup(result, "IGES");
}
