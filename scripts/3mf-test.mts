// 3MF sanitizer tests. Run: npx tsx scripts/3mf-test.mts
//
// The regression this file locks in (GitHub issue #2, Nexys A7 file from
// QIDIStudio): slicers that follow the core spec only keep objects of type
// "model". A <component>/<build item> that points at a "support"/"surface"/
// "other" object makes PrusaSlicer reject the entire archive with
// "Found component with invalid object id". Forward references fail the same
// way, so the output must also define every object before its first referrer.
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import JSZip from "jszip";
import { sanitize3MF } from "@/lib/converters/3mf-sanitizer";

let pass = 0, fail = 0;
function check(name: string, cond: boolean, extra = "") {
  if (cond) { pass++; console.log(`  ✓ ${name} ${extra}`); } else { fail++; console.log(`  ✗ FAIL: ${name} ${extra}`); }
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;

const RELS = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;

const TRI = `<mesh><vertices><vertex x="0" y="0" z="0"/><vertex x="1" y="0" z="0"/><vertex x="0" y="1" z="0"/></vertices><triangles><triangle v1="0" v2="1" v3="2"/></triangles></mesh>`;

const PROD_NS = `xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06" requiredextensions="p"`;

async function toInput(zip: JSZip): Promise<Uint8Array & { size: number }> {
  const bytes = new Uint8Array(await zip.generateAsync({ type: "uint8array" }));
  return Object.assign(bytes, { size: bytes.length });
}

// QIDI/Bambu-style production file: real geometry lives in 3D/Objects/*.model,
// the root only holds <component p:path> refs, and the parts are typed "other".
async function buildQidiStyleFixture(): Promise<Uint8Array & { size: number }> {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", CONTENT_TYPES);
  zip.file("_rels/.rels", RELS);
  zip.file("3D/Objects/part_a.model", `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" ${PROD_NS}>
 <resources><object id="1" type="other">${TRI}</object></resources>
</model>`);
  zip.file("3D/Objects/part_b.model", `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" ${PROD_NS}>
 <resources><object id="1" type="other">${TRI}</object></resources>
</model>`);
  zip.file("3D/3dmodel.model", `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" ${PROD_NS}>
 <metadata name="Application">QIDIStudio-02.05.01.52</metadata>
 <resources>
  <object id="2" type="model"><components>
   <component objectid="1" p:path="/3D/Objects/part_a.model"/>
   <component objectid="1" p:path="/3D/Objects/part_b.model" transform="1 0 0 0 1 0 0 0 1 10 0 0"/>
  </components></object>
 </resources>
 <build><item objectid="2" transform="1 0 0 0 1 0 0 0 1 0 0 0" printable="1"/></build>
</model>`);
  return toInput(zip);
}

// Returns the list of structural problems a core-spec slicer would choke on.
function structuralProblems(xml: string): string[] {
  const problems: string[] = [];
  const types = new Map<string, string>();
  for (const m of xml.matchAll(/<object\b([^>]*)>/g)) {
    const attrs = m[1];
    const id = attrs.match(/\bid\s*=\s*"(\d+)"/)?.[1];
    if (!id) continue;
    types.set(id, attrs.match(/\btype\s*=\s*"([^"]*)"/)?.[1] ?? "model");
  }
  const refs: Array<{ id: string; at: number }> = [];
  for (const m of xml.matchAll(/<component\b[^>]*>|<item\b[^>]*>/g)) {
    const id = m[0].match(/\bobjectid\s*=\s*"(\d+)"/)?.[1];
    if (id) refs.push({ id, at: m.index! });
  }
  for (const r of refs) {
    if (!types.has(r.id)) { problems.push(`dangling reference ${r.id}`); continue; }
    if (types.get(r.id) !== "model") problems.push(`reference to type=${types.get(r.id)} object ${r.id}`);
  }
  for (const m of xml.matchAll(/<object\b[^>]*\bid\s*=\s*"(\d+)"/g)) {
    const id = m[1];
    if (xml.indexOf(`<component objectid="${id}"`, m.index!) >= 0) {
      const firstRef = xml.indexOf(`<component objectid="${id}"`);
      if (firstRef < m.index!) problems.push(`forward reference to ${id}`);
    }
  }
  if (/\sprintable\s*=\s*"/.test(xml)) problems.push("vendor attr printable left in output");
  if (/\s[a-zA-Z]+:[a-zA-Z]+\s*=\s*"/.test(xml.replace(/xml:lang/g, ""))) problems.push("prefixed attr left in output");
  return problems;
}

console.log("production-extension fixture (QIDI/Bambu layout)");
{
  const input = await buildQidiStyleFixture();
  const { blob, report } = await sanitize3MF(input as unknown as Blob);
  const outZip = await JSZip.loadAsync(await blob.arrayBuffer());
  const models = Object.keys(outZip.files).filter((p) => p.endsWith(".model"));
  const xml = await outZip.file("3D/3dmodel.model")!.async("string");
  check("flattened to a single model file", models.length === 1 && models[0] === "3D/3dmodel.model", `(${models.join(",")})`);
  check("report says production extension flattened", report.flattenedProduction && report.mergedModelFiles === 2);
  check("retyped both 'other' parts", report.retypedObjects === 2, `(got ${report.retypedObjects})`);
  check("no 'other' type survives on referenced parts", !/type="other"/.test(xml));
  check("no printable attribute", !/printable=/.test(xml));
  const problems = structuralProblems(xml);
  check("structurally valid for a core-spec slicer", problems.length === 0, problems.join("; "));
  check("both components resolved to distinct global ids", new Set([...xml.matchAll(/<component objectid="(\d+)"/g)].map((m) => m[1])).size === 2);
}

console.log("already-flat file passes through");
{
  const zip = new JSZip();
  zip.file("[Content_Types].xml", CONTENT_TYPES);
  zip.file("_rels/.rels", RELS);
  zip.file("3D/3dmodel.model", `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
 <resources><object id="1" type="model">${TRI}</object></resources>
 <build><item objectid="1"/></build>
</model>`);
  const { blob, report } = await sanitize3MF((await toInput(zip)) as unknown as Blob);
  const xml = await (await JSZip.loadAsync(await blob.arrayBuffer())).file("3D/3dmodel.model")!.async("string");
  check("nothing to flatten", report.flattenedProduction === false && report.mergedModelFiles === 0);
  check("no retypes needed", report.retypedObjects === 0);
  check("still structurally valid", structuralProblems(xml).length === 0);
}

console.log("real files (skipped when not present)");
for (const p of [
  ".tmp-e2e/f3d/Cube02ProfileMini.3mf",
  ".tmp-e2e/halloween-ghost-with-pumpkin.3mf",
  ".tmp-e2e/pouring-cat.3mf",
  ".tmp-e2e/bambu-two-filament.3mf",
]) {
  if (!existsSync(p)) { console.log(`  - skip ${p}`); continue; }
  const buf = await readFile(p);
  const input = Object.assign(new Uint8Array(buf), { size: buf.length });
  const { blob, report } = await sanitize3MF(input as unknown as Blob);
  const xml = await (await JSZip.loadAsync(await blob.arrayBuffer())).file("3D/3dmodel.model")!.async("string");
  const problems = structuralProblems(xml);
  check(`${p} sanitizes cleanly`, problems.length === 0, `(retyped ${report.retypedObjects}) ${problems.join("; ")}`);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
