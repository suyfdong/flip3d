import * as THREE from "three";
import {
  writeDxfPolylines,
  writeDxf3dFaces,
  type Polyline,
  type Triangle3,
} from "@/lib/dxf/write";
import { sliceAtZ, meshToTriangles, zRange } from "@/lib/dxf/section";
import { parseDxf, dxfToLoops } from "@/lib/dxf/parse";
import { dxfToMesh, DEFAULT_DXF_EXTRUDE } from "@/lib/dxf/dxf-to-mesh";
import { analyzePrintReadiness } from "@/lib/print-check/analyze";
import {
  traceImage,
  autoThreshold,
  simplify,
  signedArea,
  DEFAULT_TRACE,
  type RgbaImage,
  type TraceOptions,
} from "@/lib/dxf/trace";

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, extra = "") {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name} ${extra}`);
  } else {
    fail++;
    console.log(`  ✗ FAIL: ${name} ${extra}`);
  }
}
const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

/** Build an RGBA image: fn(x, y) === true means a black pixel. */
function img(w: number, h: number, fn: (x: number, y: number) => boolean): RgbaImage {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const v = fn(x, y) ? 0 : 255;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  return { data, width: w, height: h };
}

function opts(over: Partial<TraceOptions> = {}): TraceOptions {
  // Trace in raw pixel units by default so areas are easy to reason about.
  return { ...DEFAULT_TRACE, simplifyPx: 0, minAreaPx: 0, widthMM: 0, ...over };
}
function pxOpts(w: number, over: Partial<TraceOptions> = {}): TraceOptions {
  return opts({ widthMM: w, ...over }); // widthMM == width ⇒ scale 1
}

// ---------------------------------------------------------------- DXF writer

console.log("\n[1] DXF writer — 2D polylines");
{
  const square: Polyline = {
    points: [[0, 0], [10, 0], [10, 10], [0, 10]],
    closed: true,
  };
  const dxf = writeDxfPolylines([square], { units: "mm" });
  const lines = dxf.split("\n");

  check("starts with SECTION", lines[0] === "0" && lines[1] === "SECTION");
  check("declares R12 (AC1009)", dxf.includes("AC1009"));
  check("declares mm units", /\$INSUNITS\n70\n4\n/.test(dxf));
  check("has HEADER, TABLES, ENTITIES sections",
    dxf.includes("HEADER") && dxf.includes("TABLES") && dxf.includes("ENTITIES"));
  check("one POLYLINE", (dxf.match(/\nPOLYLINE\n/g) ?? []).length === 1);
  check("four VERTEX", (dxf.match(/\nVERTEX\n/g) ?? []).length === 4);
  check("closed flag 70/1", /\n66\n1\n70\n1\n/.test(dxf));
  check("SEQEND present", dxf.includes("SEQEND"));
  check("ends with EOF", dxf.trimEnd().endsWith("EOF"));
  check("group codes pair up", lines.filter((l) => l !== "").length % 2 === 0);
  check("EXTMAX picked up bounds", /\$EXTMAX\n10\n10\.000000\n20\n10\.000000/.test(dxf));
  check("no exponent notation", !/e[+-]\d/i.test(dxf));
}

console.log("\n[2] DXF writer — open polyline + degenerate input");
{
  const open: Polyline = { points: [[0, 0], [5, 5]], closed: false };
  const dxf = writeDxfPolylines([open]);
  check("open flag 70/0", /\n66\n1\n70\n0\n/.test(dxf));

  const dropped = writeDxfPolylines([{ points: [[1, 1]], closed: true }]);
  check("single-point polyline dropped", !dropped.includes("POLYLINE"));
  check("still a valid file", dropped.trimEnd().endsWith("EOF"));
}

console.log("\n[3] DXF writer — 3DFACE");
{
  const tris: Triangle3[] = [
    [[0, 0, 0], [1, 0, 0], [0, 1, 2]],
    [[0, 0, 0], [0, 1, 2], [-1, 0, 0]],
  ];
  const dxf = writeDxf3dFaces(tris);
  check("two 3DFACE entities", (dxf.match(/\n3DFACE\n/g) ?? []).length === 2);
  check("4th corner repeats the 3rd", /\n12\n0\.000000\n22\n1\.000000\n32\n2\.000000\n13\n0\.000000\n23\n1\.000000\n33\n2\.000000/.test(dxf));
  check("3D bounds in EXTMAX", /\$EXTMAX\n10\n1\.000000\n20\n1\.000000\n30\n2\.000000/.test(dxf));
  check("EXTMIN has negative x", /\$EXTMIN\n10\n-1\.000000/.test(dxf));
}

// ------------------------------------------------------------------- tracing

console.log("\n[4] Trace — solid rectangle");
{
  // 20×12 image, black rect covering x 4..13, y 3..8 (10 × 6 px).
  const im = img(20, 12, (x, y) => x >= 4 && x <= 13 && y >= 3 && y <= 8);
  const r = traceImage(im, pxOpts(20));
  check("one loop", r.loopCount === 1, `${r.loopCount}`);
  check("4 corners after simplify",
    traceImage(im, pxOpts(20, { simplifyPx: 0.5 })).polylines[0].points.length === 4,
    `${traceImage(im, pxOpts(20, { simplifyPx: 0.5 })).polylines[0].points.length}`);
  const area = signedArea(r.polylines[0].points);
  check("area == 60 px", near(area, 60), `${area}`);
  check("outer loop is CCW (positive area)", area > 0);
  check("size reported", r.sizeMM[0] === 20 && near(r.sizeMM[1], 12));
}

console.log("\n[5] Trace — rectangle with a hole");
{
  const im = img(20, 20, (x, y) => {
    const inRect = x >= 2 && x <= 17 && y >= 2 && y <= 17;
    const inHole = x >= 7 && x <= 12 && y >= 7 && y <= 12;
    return inRect && !inHole;
  });
  const r = traceImage(im, pxOpts(20, { simplifyPx: 0.5 }));
  check("two loops", r.loopCount === 2, `${r.loopCount}`);
  const areas = r.polylines.map((p) => signedArea(p.points)).sort((a, b) => b - a);
  check("outer area 256 CCW", near(areas[0], 256), `${areas[0]}`);
  check("hole area -36 CW", near(areas[1], -36), `${areas[1]}`);
  check("all loops closed", r.polylines.every((p) => p.closed));
}

console.log("\n[6] Trace — two separated squares → two loops");
{
  const im = img(20, 10, (x, y) =>
    (x >= 1 && x <= 4 && y >= 2 && y <= 5) || (x >= 12 && x <= 15 && y >= 2 && y <= 5));
  const r = traceImage(im, pxOpts(20, { simplifyPx: 0.5 }));
  check("two loops", r.loopCount === 2, `${r.loopCount}`);
  check("both CCW", r.polylines.every((p) => signedArea(p.points) > 0));
  check("areas 16 + 16",
    near(r.polylines.reduce((s, p) => s + signedArea(p.points), 0), 32));
}

console.log("\n[7] Trace — diagonal saddle stays one loop");
{
  // Two 2×2 blocks touching only at a corner.
  const im = img(10, 10, (x, y) =>
    (x >= 2 && x <= 3 && y >= 2 && y <= 3) || (x >= 4 && x <= 5 && y >= 4 && y <= 5));
  const r = traceImage(im, pxOpts(10, { simplifyPx: 0 }));
  check("single loop through the corner", r.loopCount === 1, `${r.loopCount}`);
  check("total area 8", near(Math.abs(signedArea(r.polylines[0].points)), 8),
    `${signedArea(r.polylines[0].points)}`);
}

console.log("\n[8] Trace — speckle filter + scaling");
{
  const im = img(20, 20, (x, y) =>
    (x >= 2 && x <= 11 && y >= 2 && y <= 11) || (x === 17 && y === 17));
  const kept = traceImage(im, pxOpts(20, { minAreaPx: 0, simplifyPx: 0.5 }));
  check("speck kept with filter off", kept.loopCount === 2, `${kept.loopCount}`);
  const filtered = traceImage(im, pxOpts(20, { minAreaPx: 4, simplifyPx: 0.5 }));
  check("speck dropped with filter on", filtered.loopCount === 1, `${filtered.loopCount}`);

  // widthMM 200 on a 20px-wide image ⇒ 10 mm per pixel.
  const scaled = traceImage(im, opts({ widthMM: 200, minAreaPx: 4, simplifyPx: 0.5 }));
  check("area scales by 10²", near(signedArea(scaled.polylines[0].points), 100 * 100),
    `${signedArea(scaled.polylines[0].points)}`);
  check("sizeMM keeps aspect", scaled.sizeMM[0] === 200 && near(scaled.sizeMM[1], 200));
}

console.log("\n[9] Trace — invert + threshold guards");
{
  const im = img(10, 10, (x, y) => x >= 3 && x <= 6 && y >= 3 && y <= 6);
  const normal = traceImage(im, pxOpts(10, { simplifyPx: 0.5 }));
  check("dark square traced", near(signedArea(normal.polylines[0].points), 16));

  const inverted = traceImage(im, pxOpts(10, { invert: true, simplifyPx: 0.5 }));
  // Inverting traces the background: outer frame 100 minus the 16px hole.
  const total = inverted.polylines.reduce((s, p) => s + signedArea(p.points), 0);
  check("invert traces the background", near(total, 100 - 16), `${total}`);

  let threw = "";
  try {
    traceImage(img(10, 10, () => false), pxOpts(10));
  } catch (e) {
    threw = (e as Error).message;
  }
  check("all-background throws a helpful error", threw.includes("Invert"), threw.slice(0, 40));

  threw = "";
  try {
    traceImage(img(10, 10, () => true), pxOpts(10));
  } catch (e) {
    threw = (e as Error).message;
  }
  check("all-ink throws a helpful error", threw.includes("Invert"), threw.slice(0, 40));
}

console.log("\n[10] Otsu auto threshold");
{
  // Half the pixels at 30, half at 220 ⇒ the cut should land between them.
  const im = img(20, 20, () => false);
  for (let p = 0; p < 400; p++) {
    const v = p < 200 ? 30 : 220;
    im.data[p * 4] = im.data[p * 4 + 1] = im.data[p * 4 + 2] = v;
  }
  const t = autoThreshold(im);
  check("threshold between the two clusters", t > 30 && t <= 220, `${t}`);
  const traced = traceImage(im, pxOpts(20, { threshold: t, simplifyPx: 0.5 }));
  check("auto threshold yields a trace", traced.loopCount >= 1, `${traced.loopCount}`);
}

console.log("\n[11] RDP simplify");
{
  const line: [number, number][] = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]];
  check("collinear run collapses to 2", simplify(line, 0.5).length === 2);

  const spike: [number, number][] = [[0, 0], [1, 0], [2, 5], [3, 0], [4, 0]];
  // The flat shoulders sit ~0.93 off the apex lines, so eps 0.5 keeps them...
  check("spike apex kept, shoulders kept below their deviation",
    simplify(spike, 0.5).length === 5, `${simplify(spike, 0.5).length}`);
  // ...and eps 1.5 collapses them, leaving just the apex.
  check("shoulders collapse above their deviation",
    simplify(spike, 1.5).length === 3, `${simplify(spike, 1.5).length}`);
  check("apex survives either way",
    simplify(spike, 1.5).some(([x, y]) => x === 2 && y === 5));
  check("epsilon 0 is a no-op", simplify(spike, 0).length === spike.length);
  check("large epsilon flattens to endpoints", simplify(spike, 100).length === 2);
}

// ------------------------------------------------------- mesh cross-sections

console.log("\n[12] sliceAtZ — solid cube");
{
  const box = new THREE.BoxGeometry(20, 20, 20); // centred on the origin
  const r = sliceAtZ(box, 0);
  check("one closed loop", r.closedLoops === 1, `${r.closedLoops}`);
  check("no open chains", r.openChains === 0, `${r.openChains}`);
  const a = signedArea(r.polylines[0].points);
  check("area == 400 mm²", near(a, 400, 1e-4), `${a}`);
  check("outer loop CCW", a > 0);
}

console.log("\n[13] sliceAtZ — misses above and below the model");
{
  const box = new THREE.BoxGeometry(10, 10, 10);
  check("above the top → nothing", sliceAtZ(box, 6).polylines.length === 0);
  check("below the bottom → nothing", sliceAtZ(box, -6).polylines.length === 0);
}

console.log("\n[14] sliceAtZ — square tube keeps the hole");
{
  const shape = new THREE.Shape([
    new THREE.Vector2(-10, -10), new THREE.Vector2(10, -10),
    new THREE.Vector2(10, 10), new THREE.Vector2(-10, 10),
  ]);
  shape.holes.push(new THREE.Path([
    new THREE.Vector2(-4, -4), new THREE.Vector2(-4, 4),
    new THREE.Vector2(4, 4), new THREE.Vector2(4, -4),
  ]));
  const tube = new THREE.ExtrudeGeometry(shape, { depth: 10, bevelEnabled: false });
  const r = sliceAtZ(tube, 5);
  check("two loops", r.closedLoops === 2, `${r.closedLoops}`);
  const areas = r.polylines.map((p) => signedArea(p.points)).sort((x, y) => y - x);
  check("outer 400 CCW", near(areas[0], 400, 1e-4), `${areas[0]}`);
  check("hole -64 CW", near(areas[1], -64, 1e-4), `${areas[1]}`);
}

console.log("\n[15] meshToTriangles + zRange");
{
  const box = new THREE.BoxGeometry(4, 6, 8);
  check("cube → 12 triangles", meshToTriangles(box).length === 12,
    `${meshToTriangles(box).length}`);
  const [lo, hi] = zRange(box);
  check("z range -4..4", near(lo, -4) && near(hi, 4), `${lo}..${hi}`);
}

// ---------------------------------------------------------------- DXF reader

console.log("\n[16] parseDxf — primitives");
{
  const dxf = [
    "0", "SECTION", "2", "ENTITIES",
    "0", "LINE", "8", "0", "10", "0", "20", "0", "11", "10", "21", "0",
    "0", "CIRCLE", "8", "0", "10", "5", "20", "5", "40", "2",
    "0", "ARC", "8", "0", "10", "0", "20", "0", "40", "1", "50", "0", "51", "90",
    "0", "LWPOLYLINE", "8", "0", "90", "3", "70", "1",
    "10", "0", "20", "0", "10", "4", "20", "0", "10", "4", "20", "3",
    "0", "ENDSEC", "0", "EOF", "",
  ].join("\n");
  const doc = parseDxf(dxf);
  check("4 polylines emitted", doc.polylines.length === 4, `${doc.polylines.length}`);
  const closed = doc.polylines.filter((p) => p.closed);
  check("circle + lwpolyline are closed", closed.length === 2, `${closed.length}`);
  const circle = doc.polylines.find((p) => p.points.length === 72);
  check("circle tessellated to 72 points", !!circle);
  check("circle radius 2 about (5,5)",
    !!circle && near(Math.hypot(circle.points[0][0] - 5, circle.points[0][1] - 5), 2, 1e-6));
  const lw = doc.polylines.find((p) => p.closed && p.points.length === 3);
  check("lwpolyline kept its 3 points", !!lw);
  check("nothing unsupported", Object.keys(doc.unsupported).length === 0,
    JSON.stringify(doc.unsupported));
}

console.log("\n[17] parseDxf — POLYLINE/VERTEX and unsupported reporting");
{
  const dxf = [
    "0", "SECTION", "2", "ENTITIES",
    "0", "POLYLINE", "8", "0", "66", "1", "70", "1",
    "0", "VERTEX", "8", "0", "10", "0", "20", "0",
    "0", "VERTEX", "8", "0", "10", "6", "20", "0",
    "0", "VERTEX", "8", "0", "10", "6", "20", "6",
    "0", "VERTEX", "8", "0", "10", "0", "20", "6",
    "0", "SEQEND", "8", "0",
    "0", "ELLIPSE", "8", "0", "10", "0", "20", "0",
    "0", "ENDSEC", "0", "EOF", "",
  ].join("\n");
  const doc = parseDxf(dxf);
  check("one closed polyline", doc.polylines.length === 1 && doc.polylines[0].closed);
  check("4 vertices", doc.polylines[0].points.length === 4,
    `${doc.polylines[0].points.length}`);
  check("ELLIPSE reported as unsupported", doc.unsupported["ELLIPSE"] === 1,
    JSON.stringify(doc.unsupported));
}

console.log("\n[18] parseDxf — INSERT expands a block with offset + rotation");
{
  const dxf = [
    "0", "SECTION", "2", "BLOCKS",
    "0", "BLOCK", "2", "SQ", "10", "0", "20", "0",
    "0", "LWPOLYLINE", "90", "4", "70", "1",
    "10", "0", "20", "0", "10", "2", "20", "0", "10", "2", "20", "2", "10", "0", "20", "2",
    "0", "ENDBLK",
    "0", "ENDSEC",
    "0", "SECTION", "2", "ENTITIES",
    "0", "INSERT", "2", "SQ", "10", "100", "20", "50", "50", "90",
    "0", "ENDSEC", "0", "EOF", "",
  ].join("\n");
  const doc = parseDxf(dxf);
  check("block geometry emitted", doc.polylines.length === 1, `${doc.polylines.length}`);
  const pts = doc.polylines[0].points;
  check("insertion point applied", near(pts[0][0], 100) && near(pts[0][1], 50),
    JSON.stringify(pts[0]));
  // 90° CCW: local (2,0) → (0,2), plus the insertion offset.
  check("90° rotation applied", near(pts[1][0], 100, 1e-6) && near(pts[1][1], 52, 1e-6),
    JSON.stringify(pts[1]));
  check("nothing reported unsupported", Object.keys(doc.unsupported).length === 0,
    JSON.stringify(doc.unsupported));
}

console.log("\n[19] dxfToLoops — welds separate LINEs into one closed loop");
{
  const seg = (x1: number, y1: number, x2: number, y2: number) =>
    ["0", "LINE", "8", "0", "10", `${x1}`, "20", `${y1}`, "11", `${x2}`, "21", `${y2}`];
  const dxf = [
    "0", "SECTION", "2", "ENTITIES",
    ...seg(0, 0, 10, 0), ...seg(10, 0, 10, 10),
    ...seg(10, 10, 0, 10), ...seg(0, 10, 0, 0),
    "0", "ENDSEC", "0", "EOF", "",
  ].join("\n");
  const doc = parseDxf(dxf);
  check("4 open segments parsed", doc.polylines.length === 4);
  const { loops, openChains } = dxfToLoops(doc);
  check("welded into 1 loop", loops.length === 1, `${loops.length}`);
  check("no leftovers", openChains.length === 0, `${openChains.length}`);
  check("loop area 100", near(Math.abs(signedArea(loops[0])), 100),
    `${signedArea(loops[0])}`);

  // A deliberate gap must NOT be welded shut.
  const broken = parseDxf([
    "0", "SECTION", "2", "ENTITIES",
    ...seg(0, 0, 10, 0), ...seg(10, 0, 10, 10), ...seg(10, 10, 0, 10),
    "0", "ENDSEC", "0", "EOF", "",
  ].join("\n"));
  const b = dxfToLoops(broken);
  check("open outline stays open", b.loops.length === 0 && b.openChains.length === 1,
    `${b.loops.length}/${b.openChains.length}`);
}

// --------------------------------------------------------------- DXF → solid

console.log("\n[20] dxfToMesh — extrude a square with a hole");
{
  const ring = (pts: number[][], closed = true) => [
    "0", "LWPOLYLINE", "90", `${pts.length}`, "70", closed ? "1" : "0",
    ...pts.flatMap(([x, y]) => ["10", `${x}`, "20", `${y}`]),
  ];
  const dxf = [
    "0", "SECTION", "2", "ENTITIES",
    ...ring([[0, 0], [20, 0], [20, 20], [0, 20]]),
    ...ring([[8, 8], [12, 8], [12, 12], [8, 12]]),
    "0", "ENDSEC", "0", "EOF", "",
  ].join("\n");
  const doc = parseDxf(dxf);
  const r = dxfToMesh(doc, { ...DEFAULT_DXF_EXTRUDE, depthMM: 5 });

  check("mode extruded", r.mode === "extruded", r.mode);
  check("1 outline, 1 hole", r.loopCount === 1 && r.holeCount === 1,
    `${r.loopCount}/${r.holeCount}`);
  check("size 20 × 20 × 5",
    near(r.sizeMM[0], 20, 1e-4) && near(r.sizeMM[1], 20, 1e-4) && near(r.sizeMM[2], 5, 1e-4),
    JSON.stringify(r.sizeMM.map((v) => +v.toFixed(3))));

  const check3d = analyzePrintReadiness(r.mesh.geometry);
  check("extruded solid is watertight", check3d.topology.isClosed);
  check("extruded solid is manifold", check3d.topology.isManifold);
  // 20×20×5 minus a 4×4×5 hole = 2000 - 80 = 1920 mm³ = 1.92 cm³
  check("volume 1.92 cm³ (hole subtracted)",
    near(check3d.volumeCm3 ?? 0, 1.92, 1e-3), `${check3d.volumeCm3}`);
}

console.log("\n[21] dxfToMesh — scale mode + 3DFACE path");
{
  const dxf = [
    "0", "SECTION", "2", "ENTITIES",
    "0", "LWPOLYLINE", "90", "4", "70", "1",
    "10", "0", "20", "0", "10", "10", "20", "0", "10", "10", "20", "5", "10", "0", "20", "5",
    "0", "ENDSEC", "0", "EOF", "",
  ].join("\n");
  const doc = parseDxf(dxf);
  const original = dxfToMesh(doc, { ...DEFAULT_DXF_EXTRUDE, depthMM: 2 });
  check("original units kept 1:1", near(original.sizeMM[0], 10, 1e-4),
    `${original.sizeMM[0]}`);

  const scaled = dxfToMesh(doc, {
    ...DEFAULT_DXF_EXTRUDE, depthMM: 2, scaleMode: "width", widthMM: 50,
  });
  check("scaled to width 50", near(scaled.sizeMM[0], 50, 1e-4), `${scaled.sizeMM[0]}`);
  check("aspect preserved (y = 25)", near(scaled.sizeMM[1], 25, 1e-4), `${scaled.sizeMM[1]}`);
  check("depth unaffected by width scaling", near(scaled.sizeMM[2], 2, 1e-4));

  const faceDxf = [
    "0", "SECTION", "2", "ENTITIES",
    "0", "3DFACE", "8", "0",
    "10", "0", "20", "0", "30", "0",
    "11", "1", "21", "0", "31", "0",
    "12", "0", "22", "1", "32", "3",
    "13", "0", "23", "1", "33", "3",
    "0", "ENDSEC", "0", "EOF", "",
  ].join("\n");
  const fdoc = parseDxf(faceDxf);
  check("3DFACE parsed as a triangle", fdoc.faces.length === 1, `${fdoc.faces.length}`);
  const fr = dxfToMesh(fdoc, DEFAULT_DXF_EXTRUDE);
  check("mode faces", fr.mode === "faces", fr.mode);
  check("kept its 3D extent", near(fr.sizeMM[2], 3, 1e-4), `${fr.sizeMM[2]}`);
}

console.log("\n[22] Round trip — cube → slice → DXF → parse → extrude");
{
  const cube = new THREE.BoxGeometry(30, 18, 10);
  const slice = sliceAtZ(cube, 0);
  const dxf = writeDxfPolylines(slice.polylines, { units: "mm" });
  const doc = parseDxf(dxf);
  const back = dxfToMesh(doc, { ...DEFAULT_DXF_EXTRUDE, depthMM: 4 });

  check("outline survived the round trip",
    near(back.sizeMM[0], 30, 1e-3) && near(back.sizeMM[1], 18, 1e-3),
    JSON.stringify(back.sizeMM.map((v) => +v.toFixed(3))));
  check("new thickness applied", near(back.sizeMM[2], 4, 1e-4));
  const a = analyzePrintReadiness(back.mesh.geometry);
  check("round-tripped solid is watertight", a.topology.isClosed);
  check("volume 30×18×4 = 2.16 cm³", near(a.volumeCm3 ?? 0, 2.16, 1e-3), `${a.volumeCm3}`);
}

console.log("\n[23] Error paths");
{
  const msg = (fn: () => unknown) => {
    try {
      fn();
      return "";
    } catch (e) {
      return (e as Error).message;
    }
  };
  check("non-DXF text rejected",
    msg(() => parseDxf("just some text")).includes("doesn't look like a DXF"));
  check("binary DWG hint given",
    msg(() => parseDxf("just some text")).includes("DWG"));
  check("empty ENTITIES rejected",
    msg(() => parseDxf(["0", "SECTION", "2", "ENTITIES", "0", "ENDSEC", "0", "EOF", ""].join("\n")))
      .includes("No geometry"));

  const openOnly = parseDxf([
    "0", "SECTION", "2", "ENTITIES",
    "0", "LINE", "8", "0", "10", "0", "20", "0", "11", "9", "21", "1",
    "0", "ENDSEC", "0", "EOF", "",
  ].join("\n"));
  check("open line can't be extruded",
    msg(() => dxfToMesh(openOnly, DEFAULT_DXF_EXTRUDE)).includes("closed"));
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
