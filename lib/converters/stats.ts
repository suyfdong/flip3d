import * as THREE from "three";

export type ModelStats = {
  triangles: number;
  vertices: number;
  meshes: number;
  /** Vertices drawn as a point cloud (PLY scans/splats with no faces). */
  points: number;
  bbox: { x: number; y: number; z: number };
};

export function computeStats(object: THREE.Object3D): ModelStats {
  let triangles = 0;
  let vertices = 0;
  let meshes = 0;
  let points = 0;

  object.traverse((child) => {
    if (child instanceof THREE.Points) {
      points += child.geometry.getAttribute("position")?.count ?? 0;
      return;
    }
    if (!(child instanceof THREE.Mesh)) return;
    meshes += 1;
    const geo = child.geometry;
    const posAttr = geo.getAttribute("position");
    if (!posAttr) return;
    vertices += posAttr.count;
    const index = geo.getIndex();
    triangles += index ? index.count / 3 : posAttr.count / 3;
  });

  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  box.getSize(size);

  return {
    triangles: Math.floor(triangles),
    vertices,
    meshes,
    points,
    bbox: {
      x: Number(size.x.toFixed(2)),
      y: Number(size.y.toFixed(2)),
      z: Number(size.z.toFixed(2)),
    },
  };
}

export function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Points) {
      child.geometry.dispose();
      const mat = child.material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat.dispose();
    }
  });
}

/** Point-cloud-only objects have no surface to export as STL/3MF or repair. */
export function assertHasSurface(object: THREE.Object3D): void {
  let hasMesh = false;
  let points = 0;
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) hasMesh = true;
    else if (child instanceof THREE.Points) points += child.geometry.getAttribute("position")?.count ?? 0;
  });
  if (!hasMesh && points > 0) {
    throw new Error(
      `This file is a point cloud (${points.toLocaleString("en-US")} points, no faces), so there is no surface to save as a printable mesh. Reconstruct a surface first (e.g. Poisson reconstruction in MeshLab or CloudCompare), or keep it as PLY / GLB.`,
    );
  }
}
