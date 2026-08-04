"use client";

import { useEffect, useRef } from "react";
import type { Polyline } from "@/lib/dxf/write";

/**
 * 2D preview of DXF line work on a canvas.
 *
 * The drawing is fitted to the box with Y flipped (CAD Y points up, canvas Y
 * points down). Closed loops draw in brand blue, open chains in amber so a
 * gap in the outline is visible before the user tries to extrude it.
 */
export default function DxfPreview({
  polylines,
  className = "",
}: {
  polylines: Polyline[];
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const draw = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of polylines) {
        for (const [x, y] of p.points) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
      if (!Number.isFinite(minX)) return;

      const pad = 16;
      const spanX = Math.max(maxX - minX, 1e-9);
      const spanY = Math.max(maxY - minY, 1e-9);
      const scale = Math.min((w - pad * 2) / spanX, (h - pad * 2) / spanY);
      const offX = (w - spanX * scale) / 2;
      const offY = (h - spanY * scale) / 2;
      const tx = (x: number) => offX + (x - minX) * scale;
      const ty = (y: number) => h - (offY + (y - minY) * scale);

      const dark =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-color-scheme: dark)").matches;

      ctx.lineWidth = 1.25;
      ctx.lineJoin = "round";
      for (const p of polylines) {
        if (p.points.length < 2) continue;
        ctx.strokeStyle = p.closed
          ? dark
            ? "#60a5fa"
            : "#2563eb"
          : "#f59e0b";
        ctx.beginPath();
        ctx.moveTo(tx(p.points[0][0]), ty(p.points[0][1]));
        for (let i = 1; i < p.points.length; i++) {
          ctx.lineTo(tx(p.points[i][0]), ty(p.points[i][1]));
        }
        if (p.closed) ctx.closePath();
        ctx.stroke();
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [polylines]);

  return (
    <div
      ref={wrapRef}
      className={`relative w-full h-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 ${className}`}
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
