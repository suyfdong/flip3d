// SVG ↔ DXF pure-logic tests. Run: npx tsx scripts/vector-test.mts
// (SVGLoader.parse itself needs DOMParser, so the full SVG path is checked in
// the browser; here we test sizing, tessellation and the writers.)
import * as THREE from "three";
import { svgDocumentScale, shapePathsToPolylines, polylineBounds } from "@/lib/svg/svg-to-polylines";
import { writeDxfPolylines } from "@/lib/dxf/write";
import { writeSvgPolylines } from "@/lib/dxf/svg";
import { parseDxf, dxfToLoops } from "@/lib/dxf/parse";

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, extra = "") {
  if (cond) { pass++; console.log(`  ✓ ${name} ${extra}`); }
  else { fail++; console.log(`  ✗ FAIL: ${name} ${extra}`); }
}
const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

console.log("svgDocumentScale");
{
  const s = svgDocumentScale(`<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 210 297">`);
  check("Inkscape mm + viewBox → 1 mm/unit, declared", near(s.mmPerUnit, 1) && s.source === "declared");
  const s2 = svgDocumentScale(`<svg width="4in" viewBox="0 0 400 200">`);
  check("4in over 400 units → 0.254 mm/unit", near(s2.mmPerUnit, 0.254) && s2.source === "declared");
  const s3 = svgDocumentScale(`<svg viewBox="0 0 100 100">`);
  check("viewBox only → 96 dpi px", near(s3.mmPerUnit, 25.4 / 96) && s3.source === "px");
  const s4 = svgDocumentScale(`<svg width="200px" height="100px" viewBox="0 0 100 50">`);
  check("200px over 100 units → 2 px/unit at 96 dpi", near(s4.mmPerUnit, (200 * 25.4) / 96 / 100) && s4.source === "px");
  const s5 = svgDocumentScale(`<svg width="100%" viewBox="0 0 10 10">`);
  check("percent width ignored → px", s5.source === "px" && near(s5.mmPerUnit, 25.4 / 96));
  const s6 = svgDocumentScale(`<svg width='10cm' viewBox='0,0,50,50'>`);
  check("single quotes + comma viewBox + cm", near(s6.mmPerUnit, 2));
  const s7 = svgDocumentScale(`<svg width="72pt" height="72pt">`);
  check("no viewBox → user units are px even with pt width", near(s7.mmPerUnit, 25.4 / 96));
}

console.log("shapePathsToPolylines");
{
  // 10×10 square (closed) + circle r=5 at (30,5) + open line, SVG y-down.
  const sq = new THREE.ShapePath();
  sq.moveTo(0, 0); sq.lineTo(10, 0); sq.lineTo(10, 10); sq.lineTo(0, 10);
  sq.currentPath!.autoClose = true;
  const circ = new THREE.ShapePath();
  const cp = new THREE.Path();
  cp.absarc(30, 5, 5, 0, Math.PI * 2, false);
  circ.subPaths.push(cp);
  const line = new THREE.ShapePath();
  line.moveTo(0, 20); line.lineTo(35, 20);
  const hidden = new THREE.ShapePath();
  hidden.moveTo(0, 0); hidden.lineTo(100, 100);
  (hidden as unknown as { userData: unknown }).userData = { style: { fill: "none", stroke: "none" } };

  const { polylines, hiddenPaths } = shapePathsToPolylines([sq, circ, line, hidden], 1);
  check("3 polylines, 1 hidden skipped", polylines.length === 3 && hiddenPaths === 1, `(${polylines.length}, ${hiddenPaths})`);
  const [a, b, c] = polylines;
  check("square closed with 4 corners (no duplicate closing point)", a.closed && a.points.length === 4);
  check("circle closed", b.closed, `(${b.points.length} pts)`);
  check("circle segments ≤ 0.25 mm", (() => {
    const p = b.points;
    for (let i = 0; i < p.length; i++) {
      const q = p[(i + 1) % p.length];
      if (Math.hypot(q[0] - p[i][0], q[1] - p[i][1]) > 0.26) return false;
    }
    return true;
  })());
  check("circle radius preserved", b.points.every(([x, y]) => {
    // origin moved to lower-left: circle centre x=30, y-up: centre y = -5 shifted by minY (-20) → 15
    return near(Math.hypot(x - 30, y - 15), 5, 1e-6);
  }));
  check("line open", !c.closed && c.points.length === 2);
  const [w, h] = polylineBounds(polylines);
  check("bounds 35 × 20", near(w, 35) && near(h, 20), `(${w}, ${h})`);
  // y-flip: SVG square at top (y 0..10) must end up at the top in CAD (y 10..20).
  const sqYs = a.points.map((p) => p[1]);
  check("y flipped: top-of-SVG square sits at top of DXF", near(Math.min(...sqYs), 10) && near(Math.max(...sqYs), 20));
  check("lower-left at origin", Math.min(...polylines.flatMap((p) => p.points.map((q) => q[0]))) === 0);

  // Scale: same square with mmPerUnit 25.4 (1 unit = 1 in).
  const big = shapePathsToPolylines([sq], 25.4).polylines[0];
  check("mmPerUnit scales coordinates", near(polylineBounds([big])[0], 254));

  // Bezier with explicit closing point repeated → treated as closed, duplicate removed.
  const bz = new THREE.ShapePath();
  bz.moveTo(0, 0); bz.bezierCurveTo(10, 0, 10, 10, 0, 10); bz.lineTo(0, 0);
  const bp = shapePathsToPolylines([bz], 1).polylines[0];
  const f = bp.points[0], l = bp.points[bp.points.length - 1];
  check("explicit return to start → closed, no duplicate", bp.closed && !(near(f[0], l[0]) && near(f[1], l[1])));
}

console.log("SVG → DXF → parse round trip");
{
  const sq = new THREE.ShapePath();
  sq.moveTo(0, 0); sq.lineTo(40, 0); sq.lineTo(40, 20); sq.lineTo(0, 20);
  sq.currentPath!.autoClose = true;
  const hole = new THREE.ShapePath();
  const hp = new THREE.Path(); hp.absarc(20, 10, 4, 0, Math.PI * 2, false); hole.subPaths.push(hp);
  const { polylines } = shapePathsToPolylines([sq, hole], 1);
  const dxf = writeDxfPolylines(polylines, { units: "mm", layer: "0" });
  const doc = parseDxf(dxf);
  check("parsed back 2 polylines", doc.polylines.length === 2);
  check("$INSUNITS = 4 (mm)", doc.insUnits === 4);
  const { loops, openChains } = dxfToLoops(doc);
  check("both loops closed, no open chains", loops.length === 2 && openChains.length === 0);
  const inch = writeDxfPolylines(polylines.map((p) => ({ ...p, points: p.points.map(([x, y]) => [x / 25.4, y / 25.4] as [number, number]) })), { units: "in" });
  check("inch output sets $INSUNITS = 1", parseDxf(inch).insUnits === 1);
}

console.log("DXF → SVG writer");
{
  const polys = [
    { closed: true, points: [[0, 0], [40, 0], [40, 20], [0, 20]] as [number, number][] },
    { closed: true, points: [[18, 8], [22, 8], [22, 12], [18, 12]] as [number, number][] },
    { closed: false, points: [[5, 15], [35, 15]] as [number, number][] },
  ];
  const cut = writeSvgPolylines(polys, { units: "mm" });
  check("cut: width=40mm height=20mm", cut.includes('width="40mm"') && cut.includes('height="20mm"'));
  check("cut: 3 stroked paths, no fill", (cut.match(/<path /g) ?? []).length === 3 && cut.includes('fill="none"'));
  const fill = writeSvgPolylines(polys, { units: "mm", style: "fill" });
  check("fill: one evenodd path holding both closed loops", (fill.match(/fill-rule="evenodd"/g) ?? []).length === 1 && (fill.match(/ Z/g) ?? []).length === 2);
  check("fill: open path stays a stroke", fill.includes('stroke="#000000"') && (fill.match(/<path /g) ?? []).length === 2);
  check("y flipped in SVG (top edge y=20 → svg y 0)", cut.includes("M0 20 L40 20 L40 0 L0 0 Z"));
  const inch = writeSvgPolylines(polys.map((p) => ({ ...p, points: p.points.map(([x, y]) => [x / 25.4, y / 25.4] as [number, number]) })), { units: "in" });
  check("inch SVG: width in inches", /width="1\.5748in"/.test(inch));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
