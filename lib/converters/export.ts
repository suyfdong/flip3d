import * as THREE from "three";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { PLYExporter } from "three/examples/jsm/exporters/PLYExporter.js";
import type { Format } from "./formats";
import { MIME_TYPES } from "./formats";
import { exportTo3MF } from "./3mf-writer";
import { assertHasSurface, inOwnFrame } from "./stats";

export type ExportOptions = {
  /** GLB only: downscale textures so neither side exceeds this many pixels. */
  maxTextureSize?: number;
  /**
   * OBJ only: round coordinates to this many decimals. OBJExporter prints
   * float32 values at full double precision ("0.30000001192092896"), which
   * roughly doubles file size for no real accuracy.
   */
  objDecimals?: number;
};

export async function exportToBlob(
  object: THREE.Object3D,
  format: Format,
  opts: ExportOptions = {},
): Promise<Blob> {
  return inOwnFrame(object, () => exportInFrame(object, format, opts));
}

/**
 * Round the numbers on vertex lines (v / vt / vn) to `decimals` places, dropping
 * trailing zeros. Other lines (names, faces, materials) are left alone.
 */
export function trimObjPrecision(text: string, decimals: number): string {
  return text.replace(/^(v|vt|vn) (.*)$/gm, (_, tag: string, rest: string) => {
    const nums = rest.trim().split(/\s+/).map((m) => {
      const v = Number(m);
      if (!Number.isFinite(v)) return m;
      const r = v.toFixed(decimals).replace(/\.?0+$/, "");
      return r === "-0" ? "0" : r;
    });
    return `${tag} ${nums.join(" ")}`;
  });
}

async function exportInFrame(
  object: THREE.Object3D,
  format: Format,
  opts: ExportOptions,
): Promise<Blob> {
  if (format === "stl" || format === "3mf") assertHasSurface(object);
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
      let text = new OBJExporter().parse(object);
      if (opts.objDecimals !== undefined) text = trimObjPrecision(text, opts.objDecimals);
      return new Blob([text], { type: MIME_TYPES.obj });
    }
    case "glb": {
      const result = await new GLTFExporter().parseAsync(object, {
        binary: true,
        ...(opts.maxTextureSize ? { maxTextureSize: opts.maxTextureSize } : {}),
      });
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
    case "step":
    case "iges":
    case "fbx":
    case "dae": {
      throw new Error(
        `${format.toUpperCase()} export isn't supported — Flip3D imports these formats but exports only mesh formats (STL, OBJ, GLB, 3MF, PLY).`,
      );
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
