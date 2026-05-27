"use client";

import { useCallback, useState } from "react";

type Props = {
  onFileLoaded: (buffer: ArrayBuffer, fileName: string) => void;
  accept?: string[];
  /** Noun shown in the prompt: "Drop your {label} here". Defaults to "3D file". */
  label?: string;
};

export const SUPPORTED_FORMATS = [
  ".stl",
  ".obj",
  ".glb",
  ".gltf",
  ".3mf",
  ".ply",
  ".fbx",
  ".dae",
  ".step",
  ".stp",
  ".iges",
  ".igs",
] as const;

export default function Dropzone({
  onFileLoaded,
  accept = [...SUPPORTED_FORMATS],
  label = "3D file",
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!accept.includes(ext)) {
        setError(`Unsupported format. Please use: ${accept.join(", ")}`);
        return;
      }

      // 文件大小检查（200MB 上限）
      const MAX_SIZE = 200 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        setError("File too large. Max 200MB.");
        return;
      }

      setError(null);
      try {
        const buffer = await file.arrayBuffer();
        onFileLoaded(buffer, file.name);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to read file");
      }
    },
    [accept, onFileLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="w-full">
      <label
        htmlFor="file-input"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          flex flex-col items-center justify-center w-full min-h-[220px] sm:min-h-[280px]
          rounded-2xl border-2 border-dashed cursor-pointer
          transition-all duration-200 px-4 py-8 sm:px-6 sm:py-12
          ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
              : "border-zinc-300 dark:border-zinc-700 hover:border-blue-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
          }
        `}
      >
        <svg
          className="w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4 text-zinc-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="text-base font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Drop your {label} here, or{" "}
          <span className="text-blue-600 dark:text-blue-400">browse</span>
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {accept.length > 4
            ? `Supports 12 formats: STL, OBJ, GLB, 3MF, STEP, FBX & more`
            : `Supports ${accept.join(", ").toUpperCase()}`}{" "}
          · Max 200MB
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-3">
          🔒 Files never leave your browser. 100% local.
        </p>
        <input
          id="file-input"
          type="file"
          className="hidden"
          accept={accept.join(",")}
          onChange={handleFileInput}
        />
      </label>

      {error && (
        <div className="mt-3 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
