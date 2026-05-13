// Build a small but realistic-looking G-code that draws a 20×20×6mm cube
// with perimeter + a diagonal raster infill, three layers tall. Used by the
// "Try a sample" button on the G-code Simulator so visitors can demo the
// tool without finding a .gcode file first.

export function buildSampleGcode(): string {
  const lines: string[] = [];
  const push = (s: string) => lines.push(s);

  push("; Flip3D sample G-code");
  push("; PrusaSlicer-style — 20x20x6mm cube, 3 layers");
  push("M82 ; absolute extrusion");
  push("G90 ; absolute positioning");
  push("G92 E0 ; reset extrusion");
  push("G1 Z0.4 F1500 ; lift to first layer");

  const sizeX = 20;
  const sizeY = 20;
  const layerH = 0.2;
  const layers = 30; // 30 * 0.2 = 6mm
  const perimSpeed = 1800; // mm/min
  const infillSpeed = 3000;
  const travelSpeed = 9000;
  const filamentPerMm = 0.041; // typical 0.4 nozzle, 1.75 filament, 0.2 layer

  // origin offset to position cube on bed center (~110,110)
  const ox = 110;
  const oy = 110;

  let e = 0;

  for (let li = 0; li < layers; li++) {
    const z = layerH * (li + 1);
    push(`; LAYER_CHANGE`);
    push(`; Z:${z.toFixed(2)}`);
    push(`G1 Z${z.toFixed(3)} F${travelSpeed}`);

    // travel to perimeter start
    push(`G1 X${ox.toFixed(3)} Y${oy.toFixed(3)} F${travelSpeed}`);

    // perimeter (CCW square)
    const corners: [number, number][] = [
      [ox + sizeX, oy],
      [ox + sizeX, oy + sizeY],
      [ox, oy + sizeY],
      [ox, oy],
    ];
    let cx = ox;
    let cy = oy;
    for (const [tx, ty] of corners) {
      const dist = Math.hypot(tx - cx, ty - cy);
      e += dist * filamentPerMm;
      push(`G1 X${tx.toFixed(3)} Y${ty.toFixed(3)} E${e.toFixed(4)} F${perimSpeed}`);
      cx = tx;
      cy = ty;
    }

    // raster infill (alternating direction each line)
    const stepY = 1.5;
    let goingRight = true;
    let cy2 = oy + stepY;
    while (cy2 < oy + sizeY) {
      const start = goingRight ? [ox + 0.5, cy2] : [ox + sizeX - 0.5, cy2];
      const end = goingRight ? [ox + sizeX - 0.5, cy2] : [ox + 0.5, cy2];
      // travel
      push(`G1 X${start[0].toFixed(3)} Y${start[1].toFixed(3)} F${travelSpeed}`);
      // extrude
      const dist = Math.hypot(end[0] - start[0], end[1] - start[1]);
      e += dist * filamentPerMm;
      push(`G1 X${end[0].toFixed(3)} Y${end[1].toFixed(3)} E${e.toFixed(4)} F${infillSpeed}`);
      cy2 += stepY;
      goingRight = !goingRight;
    }
  }

  push("; End of sample");
  push("G92 E0");
  push("M104 S0 ; turn off hotend");
  push("M140 S0 ; turn off bed");
  push("M84 ; disable motors");

  return lines.join("\n");
}
