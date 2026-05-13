import * as THREE from "three";
import JSZip from "jszip";

const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;

const RELS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;

type Triangle = { v1: number; v2: number; v3: number };
type MeshData = { vertices: Float32Array; triangles: Triangle[] };

export async function exportTo3MF(root: THREE.Object3D): Promise<Blob> {
  root.updateMatrixWorld(true);

  const meshes: MeshData[] = [];
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const data = extractMeshData(child);
    if (data) meshes.push(data);
  });

  if (meshes.length === 0) {
    throw new Error("No mesh geometry found to export as 3MF");
  }

  const modelXml = buildModelXml(meshes);

  const zip = new JSZip();
  zip.file("[Content_Types].xml", CONTENT_TYPES_XML);
  zip.folder("_rels")!.file(".rels", RELS_XML);
  zip.folder("3D")!.file("3dmodel.model", modelXml);

  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "model/3mf",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  return blob;
}

function extractMeshData(mesh: THREE.Mesh): MeshData | null {
  const geo = mesh.geometry.clone();
  geo.applyMatrix4(mesh.matrixWorld);

  const posAttr = geo.getAttribute("position") as THREE.BufferAttribute | undefined;
  if (!posAttr) return null;

  const vertexCount = posAttr.count;
  const vertices = new Float32Array(vertexCount * 3);
  for (let i = 0; i < vertexCount; i++) {
    vertices[i * 3] = posAttr.getX(i);
    vertices[i * 3 + 1] = posAttr.getY(i);
    vertices[i * 3 + 2] = posAttr.getZ(i);
  }

  const triangles: Triangle[] = [];
  const indexAttr = geo.getIndex();
  if (indexAttr) {
    for (let i = 0; i < indexAttr.count; i += 3) {
      triangles.push({
        v1: indexAttr.getX(i),
        v2: indexAttr.getX(i + 1),
        v3: indexAttr.getX(i + 2),
      });
    }
  } else {
    for (let i = 0; i < vertexCount; i += 3) {
      triangles.push({ v1: i, v2: i + 1, v3: i + 2 });
    }
  }

  geo.dispose();
  return { vertices, triangles };
}

function buildModelXml(meshes: MeshData[]): string {
  const lines: string[] = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(
    `<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">`,
  );
  lines.push(`  <metadata name="Application">Flip3D</metadata>`);
  lines.push(`  <resources>`);

  meshes.forEach((mesh, index) => {
    const id = index + 1;
    lines.push(`    <object id="${id}" type="model">`);
    lines.push(`      <mesh>`);
    lines.push(`        <vertices>`);
    for (let i = 0; i < mesh.vertices.length; i += 3) {
      lines.push(
        `          <vertex x="${fmt(mesh.vertices[i])}" y="${fmt(mesh.vertices[i + 1])}" z="${fmt(mesh.vertices[i + 2])}" />`,
      );
    }
    lines.push(`        </vertices>`);
    lines.push(`        <triangles>`);
    for (const t of mesh.triangles) {
      lines.push(`          <triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" />`);
    }
    lines.push(`        </triangles>`);
    lines.push(`      </mesh>`);
    lines.push(`    </object>`);
  });

  lines.push(`  </resources>`);
  lines.push(`  <build>`);
  meshes.forEach((_, index) => {
    lines.push(`    <item objectid="${index + 1}" />`);
  });
  lines.push(`  </build>`);
  lines.push(`</model>`);

  return lines.join("\n");
}

function fmt(n: number): string {
  return Number.isFinite(n) ? n.toFixed(6).replace(/0+$/, "").replace(/\.$/, "") : "0";
}
