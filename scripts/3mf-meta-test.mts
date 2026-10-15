// Node test for lib/converters/3mf-meta.ts — builds a Bambu-style multi-object,
// multi-plate, two-filament 3MF and a PrusaSlicer one, then checks what we read.
// Also writes the Bambu fixture to .tmp-e2e/ for browser end-to-end checks.
import JSZip from "jszip";
import { mkdirSync, writeFileSync } from "node:fs";
import { read3MFMeta, colorForObject } from "../lib/converters/3mf-meta";
import { decodePaintState, readPaintedMeshes } from "../lib/converters/3mf-paint";

let pass = 0;
let fail = 0;
function ok(cond: boolean, msg: string) {
  if (cond) pass++;
  else {
    fail++;
    console.log("FAIL:", msg);
  }
}

const NS = `xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06" requiredextensions="p"`;

function cubeMesh(size: number, ox: number): string {
  const v = [[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]].map(
    ([x, y, z]) => `<vertex x="${x * size + ox}" y="${y * size}" z="${z * size}"/>`,
  );
  const t = [[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]].map(
    ([a, b, c]) => `<triangle v1="${a}" v2="${b}" v3="${c}"/>`,
  );
  return `<mesh><vertices>${v.join("")}</vertices><triangles>${t.join("")}</triangles></mesh>`;
}

// 1×1 red PNG
const PNG = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==", "base64"));

async function buildBambu(): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/><Default Extension="png" ContentType="image/png"/></Types>`);
  zip.file("_rels/.rels", `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel-1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>`);
  zip.file("3D/3dmodel.model", `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" ${NS}>
  <metadata name="Application">BambuStudio-02.04.00.70</metadata>
  <resources>
    <object id="4" type="model"><components><component p:path="/3D/Objects/object_1.model" objectid="1"/></components></object>
    <object id="5" type="model"><components><component p:path="/3D/Objects/object_1.model" objectid="2"/></components></object>
  </resources>
  <build>
    <item objectid="4" printable="1"/>
    <item objectid="5" printable="1"/>
  </build>
</model>`);
  zip.file("3D/Objects/object_1.model", `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" ${NS}><resources>
<object id="1" type="model">${cubeMesh(10, 0)}</object>
<object id="2" type="model">${cubeMesh(10, 20)}</object>
</resources><build/></model>`);
  zip.file("Metadata/model_settings.config", `<?xml version="1.0" encoding="UTF-8"?>
<config>
  <object id="4">
    <metadata key="name" value="Base Plate"/>
    <metadata key="extruder" value="1"/>
    <part id="1" subtype="normal_part"><metadata key="name" value="cube-a"/><metadata key="extruder" value="2"/></part>
  </object>
  <object id="5">
    <metadata key="name" value="Lid"/>
    <metadata key="extruder" value="2"/>
  </object>
  <plate>
    <metadata key="plater_id" value="1"/>
    <metadata key="plater_name" value="Main"/>
    <model_instance><metadata key="object_id" value="4"/><metadata key="instance_id" value="0"/></model_instance>
  </plate>
  <plate>
    <metadata key="plater_id" value="2"/>
    <metadata key="plater_name" value=""/>
    <model_instance><metadata key="object_id" value="5"/><metadata key="instance_id" value="0"/></model_instance>
  </plate>
</config>`);
  zip.file("Metadata/project_settings.config", JSON.stringify({
    filament_colour: ["#FF6A13", "#2E8B57"],
    filament_type: ["PLA", "PETG"],
    printer_model: "Bambu Lab X1 Carbon",
  }));
  zip.file("Metadata/plate_1.png", PNG);
  return zip.generateAsync({ type: "uint8array" });
}

async function buildPrusa(): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file("3D/3dmodel.model", `<?xml version="1.0"?><model unit="inch" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><metadata name="Application">PrusaSlicer-2.8.1</metadata><resources><object id="1" type="model">${cubeMesh(1, 0)}</object></resources><build><item objectid="1"/></build></model>`);
  zip.file("Metadata/Slic3r_PE_model.config", `<?xml version="1.0"?><config><object id="1" instances_count="1"><metadata type="object" key="name" value="Bracket"/><metadata type="object" key="extruder" value="2"/><volume firstid="0" lastid="11"><metadata type="volume" key="name" value="Bracket"/></volume></object></config>`);
  zip.file("Metadata/Slic3r_PE.config", `; generated by PrusaSlicer\n; extruder_colour = "";"#00FF00"\n; filament_colour = #FF8000;#AAAAAA\n; filament_type = PLA;PETG\n; printer_model = MK4S\n`);
  return zip.generateAsync({ type: "uint8array" });
}

const bambu = await buildBambu();
const m = await read3MFMeta(bambu);
ok(m.application === "BambuStudio-02.04.00.70", `application ${m.application}`);
ok(m.unit === "millimeter", "unit mm");
ok(m.printer === "Bambu Lab X1 Carbon", `printer ${m.printer}`);
ok(JSON.stringify(m.buildObjectIds) === '["4","5"]', `build order ${m.buildObjectIds}`);
ok(m.objects.length === 2, "two objects");
ok(m.objects[0].name === "Base Plate" && m.objects[0].extruder === 1, "object-level name/extruder win over part");
ok(m.objects[1].name === "Lid" && m.objects[1].extruder === 2, "second object");
ok(m.plates.length === 2 && m.plates[0].name === "Main" && m.plates[1].name === undefined, "plates + empty name");
ok(m.plates[0].objectIds[0] === "4" && m.plates[1].objectIds[0] === "5", "plate membership");
ok(m.filaments.length === 2 && m.filaments[1].type === "PETG", "filaments");
ok(colorForObject(m, "4") === "#FF6A13" && colorForObject(m, "5") === "#2E8B57", "object colors by slot");
ok(colorForObject(m, "999") === "#FF6A13", "unknown object falls back to slot 1");
ok(m.thumbnail?.mime === "image/png" && m.thumbnail.bytes.length === PNG.length, "thumbnail");

const p = await read3MFMeta(await buildPrusa());
ok(p.application === "PrusaSlicer-2.8.1", "prusa app");
ok(p.unit === "inch", "prusa unit inch");
ok(p.objects[0]?.name === "Bracket" && p.objects[0]?.extruder === 2, "prusa object");
ok(p.filaments.length === 2 && p.filaments[0].color === "#FF8000" && p.filaments[1].color === "#00FF00", `prusa filaments ${JSON.stringify(p.filaments)}`);
ok(colorForObject(p, "1") === "#00FF00", "prusa color by extruder");
ok(p.printer === "MK4S", "prusa printer");
ok(!p.thumbnail, "no thumbnail");

// Plain 3MF without slicer metadata: nothing invented.
const plain = new JSZip();
plain.file("3D/3dmodel.model", `<model unit="millimeter" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><resources><object id="1">${cubeMesh(1, 0)}</object></resources><build><item objectid="1"/></build></model>`);
const pm = await read3MFMeta(await plain.generateAsync({ type: "uint8array" }));
ok(pm.filaments.length === 0 && pm.objects.length === 0 && !pm.application, "plain 3MF has no slicer meta");
ok(colorForObject(pm, "1") === undefined, "no filament → no color");

// Paint decoding — values taken from a real Bambu Studio 7-color export.
const cases: [string, number][] = [["4", 1], ["8", 2], ["0C", 3], ["1C", 4], ["2C", 5], ["3C", 6], ["4C", 7], ["44043", 1], ["40003", 0], ["", 0]];
for (const [hex, want] of cases) ok(decodePaintState(hex) === want, `paint ${hex} → ${decodePaintState(hex)} (want ${want})`);
const paintedXml = `<model><resources><object id="7" type="model"><mesh><vertices><vertex x="1" y="2" z="3"/><vertex x="0" y="0" z="0"/><vertex x="1" y="0" z="0"/></vertices><triangles><triangle v1="0" v2="1" v3="2" paint_color="8"/><triangle v1="0" v2="2" v3="1"/><triangle v1="1" v2="2" v3="0" slic3rpe:mmu_segmentation="4C"/></triangles></mesh></object><object id="8" type="model"><mesh><vertices><vertex x="0" y="0" z="0"/></vertices><triangles><triangle v1="0" v2="0" v3="0"/></triangles></mesh></object></resources></model>`;
const pm2 = readPaintedMeshes(paintedXml);
ok(pm2.length === 1 && pm2[0].objectId === "7", "only painted objects returned");
ok(pm2[0]?.triCount === 3 && Array.from(pm2[0].states).join() === "2,0,7", `states ${pm2[0] && Array.from(pm2[0].states)}`);
ok(pm2[0]?.firstVertex.join() === "1,2,3", "first vertex");
ok(readPaintedMeshes("<model/>").length === 0, "no paint → empty");

mkdirSync(".tmp-e2e", { recursive: true });
writeFileSync(".tmp-e2e/bambu-two-filament.3mf", bambu);

console.log(`${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
