"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import type { ThreeMFMeta } from "@/lib/converters/3mf-meta";
import type { PlyHeader } from "@/lib/converters/parse";

// File-specific facts for the viewer sidebar: slicer info + filaments for 3MF,
// header for PLY, and a toggleable part list for assemblies / multi-object 3MF.

const UNIT_SHORT: Record<string, string> = {
  micron: "µm",
  millimeter: "mm",
  centimeter: "cm",
  inch: "in",
  foot: "ft",
  meter: "m",
};

export function unitLabelFor(object: THREE.Object3D | null): string {
  const meta = object?.userData.threeMF as ThreeMFMeta | undefined;
  if (meta) return UNIT_SHORT[meta.unit] ?? meta.unit;
  return "mm";
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-xs">
      <span className="text-zinc-500 dark:text-zinc-400 shrink-0">{k}</span>
      <span className="text-right text-zinc-800 dark:text-zinc-200 break-all">{v}</span>
    </div>
  );
}

function Swatch({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-3 h-3 rounded-sm border border-black/10 align-middle"
      style={{ backgroundColor: color }}
    />
  );
}

function ThreeMFInfo({ meta }: { meta: ThreeMFMeta }) {
  const [thumb, setThumb] = useState<string | null>(null);
  useEffect(() => {
    if (!meta.thumbnail) return;
    const url = URL.createObjectURL(new Blob([meta.thumbnail.bytes.slice()], { type: meta.thumbnail.mime }));
    setThumb(url);
    return () => URL.revokeObjectURL(url);
  }, [meta]);

  return (
    <div className="space-y-1.5">
      {thumb && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="Slicer thumbnail from the 3MF" className="w-full max-h-48 object-contain bg-zinc-50 dark:bg-zinc-950 rounded-md border border-zinc-200 dark:border-zinc-800 mb-2" />
      )}
      {meta.application && <Row k="Made with" v={meta.application} />}
      {meta.printer && <Row k="Printer" v={meta.printer} />}
      <Row k="Units" v={UNIT_SHORT[meta.unit] ?? meta.unit} />
      {meta.plates.length > 0 && <Row k="Plates" v={meta.plates.length} />}
      {meta.buildObjectIds.length > 0 && <Row k="Objects" v={meta.buildObjectIds.length} />}
      {meta.filaments.length > 0 && (
        <div className="pt-1">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Filaments</p>
          <ul className="space-y-1">
            {meta.filaments.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-xs">
                <Swatch color={f.color} />
                <span className="font-mono text-zinc-500">#{i + 1}</span>
                <span>{f.type ?? "—"}</span>
                <span className="ml-auto font-mono text-zinc-400">{f.color.toUpperCase()}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-zinc-400 mt-1.5">
            Objects are tinted with their assigned filament. Per-face color painting isn&apos;t shown.
          </p>
        </div>
      )}
    </div>
  );
}

function PlyInfo({ header }: { header: PlyHeader }) {
  const vertex = header.elements.find((e) => e.name === "vertex");
  return (
    <div className="space-y-1.5">
      <Row k="Encoding" v={header.format.replace(/_/g, " ")} />
      {header.elements.map((e) => (
        <Row key={e.name} k={`${e.name} count`} v={e.count.toLocaleString("en-US")} />
      ))}
      {vertex && (
        <Row k="Vertex fields" v={<span className="font-mono">{vertex.properties.join(", ")}</span>} />
      )}
    </div>
  );
}

type PartNode = { obj: THREE.Object3D; label: string; depth: number };

const MAX_PARTS = 300;

function isSingleAnonymousPart(node: THREE.Object3D): boolean {
  let leaves = 0;
  let named = false;
  node.traverse((d) => {
    if (d === node) return;
    if (d.name) named = true;
    if (d instanceof THREE.Mesh || d instanceof THREE.Points) leaves++;
  });
  return leaves <= 1 && !named;
}

function collectParts(root: THREE.Object3D): PartNode[] {
  const out: PartNode[] = [];
  let unnamed = 0;
  const walk = (o: THREE.Object3D, depth: number) => {
    for (const c of o.children) {
      if (out.length >= MAX_PARTS) return;
      const isLeaf = c instanceof THREE.Mesh || c instanceof THREE.Points;
      // Skip anonymous wrapper groups with a single child — they add noise.
      if (!isLeaf && !c.name && c.children.length === 1) {
        walk(c, depth);
        continue;
      }
      out.push({ obj: c, label: c.name || `Part ${++unnamed}`, depth });
      // A node whose whole subtree is one anonymous mesh (3MF wraps each object
      // in unnamed groups) is a single part — don't list its innards.
      if (!isLeaf && !isSingleAnonymousPart(c)) walk(c, depth + 1);
    }
  };
  walk(root, 0);
  return out;
}

function PartsList({ object }: { object: THREE.Object3D }) {
  const parts = useMemo(() => collectParts(object), [object]);
  const [, force] = useState(0);
  if (parts.length < 2) return null;
  const toggle = (o: THREE.Object3D) => {
    o.visible = !o.visible;
    force((n) => n + 1);
  };
  const setAll = (v: boolean) => {
    parts.forEach((p) => (p.obj.visible = v));
    force((n) => n + 1);
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Parts ({parts.length}
          {parts.length >= MAX_PARTS ? "+" : ""})
        </p>
        <span className="text-[11px] space-x-2">
          <button onClick={() => setAll(true)} className="text-blue-600 dark:text-blue-400 hover:underline">
            show all
          </button>
        </span>
      </div>
      <ul className="max-h-56 overflow-auto space-y-0.5 pr-1">
        {parts.map((p, i) => (
          <li key={i} style={{ paddingLeft: p.depth * 12 }}>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={p.obj.visible} onChange={() => toggle(p.obj)} />
              <span className={`truncate ${p.obj.visible ? "" : "text-zinc-400 line-through"}`}>{p.label}</span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  parts.forEach((q) => (q.obj.visible = false));
                  // Keep ancestors and descendants of the isolated part visible.
                  p.obj.traverse((d) => (d.visible = true));
                  p.obj.traverseAncestors((a) => (a.visible = true));
                  force((n) => n + 1);
                }}
                className="ml-auto text-[10px] text-zinc-400 hover:text-blue-600"
                title="Show only this part"
              >
                only
              </button>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ModelInfoPanel({ object }: { object: THREE.Object3D | null }) {
  if (!object) return null;
  const meta = object.userData.threeMF as ThreeMFMeta | undefined;
  const ply = object.userData.ply as PlyHeader | undefined;
  const hasParts = collectParts(object).length >= 2;
  if (!meta && !ply && !hasParts) return null;
  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">File details</p>
      {meta && <ThreeMFInfo meta={meta} />}
      {ply && <PlyInfo header={ply} />}
      {hasParts && <PartsList object={object} />}
    </div>
  );
}
