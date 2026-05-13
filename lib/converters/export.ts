import * as THREE from "three";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { PLYExporter } from "three/examples/jsm/exporters/PLYExporter.js";
import type { Format } from "./formats";
import { MIME_TYPES } from "./formats";
import { exportTo3MF } from "./3mf-writer";

export async function exportToBlob(
  object: THREE.Object3D,
  format: Format,
): Promise<Blob> {
  switch (format) {
    case "stl": {
      const result = new STLExporter().parse(object, { binary: true });
      const buffer = result.buffer.slice(
        result.byteOffset,
        result.byteOffset + result.byteLength,
      );
      return new Blob([buffer], { type: MIME_TYPES.stl });
    }
    case "obj": {
      const text = new OBJExporter().parse(object);
      return new Blob([text], { type: MIME_TYPES.obj });
    }
    case "glb": {
      const result = await new GLTFExporter().parseAsync(object, { binary: true });
      if (!(result instanceof ArrayBuffer)) {
        throw new Error("GLTFExporter returned JSON for binary export");
      }
      return new Blob([result], { type: MIME_TYPES.glb });
    }
    case "3mf": {
      return exportTo3MF(object);
    }
    case "ply": {
      return new Promise<Blob>((resolve, reject) => {
        try {
          new PLYExporter().parse(
            object,
            (result) => {
              const blob =
                result instanceof ArrayBuffer
                  ? new Blob([result], { type: MIME_TYPES.ply })
                  : new Blob([result], { type: "text/plain" });
              resolve(blob);
            },
            { binary: true },
          );
        } catch (err) {
          reject(err);
        }
      });
    }
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
