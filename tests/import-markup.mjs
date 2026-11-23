/* UNCLOSED SHEET MARKUP IS REFUSED IN ONE FORWARD PASS, NOT SCANNED AGAIN AND AGAIN.
 *
 *     node tests/import-markup.mjs [--keep]
 *
 * A few megabytes of <row>, of <c> inside a closed row, or of <si>, each without its closer
 * and each under the 64 MB unpack ceiling. The read runs in a child with a time limit. Before
 * the forward scan the child is still in the lazy match when the limit kills it. After it,
 * each part is refused by name well inside the limit. A closed sheet of one cell still reads.
 *
 * The plant lifts the missing-closer refusal in a scratch copy. ETIUDA_PLANTS=off skips that
 * proof and prints NOT RUN.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readWorkbook } from "../src/workbook.mjs";
import { zip, book } from "../tools/fixtures/workbook.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { copyPlants } from "./plant-copy.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "import-markup");
const SELF = fileURLToPath(import.meta.url);
const ONLY = process.env.IMPORT_MARKUP_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const PART = 2 * 1024 * 1024;

if (process.env.IMPORT_MARKUP_DIR) {
  const dir = process.env.IMPORT_MARKUP_DIR;
  for (const name of ["row", "cell", "si"]) {
    let line;
    try {
      const wb = readWorkbook(fs.readFileSync(path.join(dir, name + ".xlsx")));
      const cells = wb.sheets.reduce((a, s) => a + s.cells.length, 0);
      line = "READ cells=" + cells + " strings=" + wb.strings;
    } catch (e) {
      line = "REFUSED " + (e && e.message ? e.message : String(e));
    }
    process.stdout.write(name + " " + line + "\n");
  }
  process.exit(0);
}

let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}
function skip(line) {
  skipped++;
  process.stdout.write("  NOT RUN " + line + "\n");
}
const want = (id) => !ONLY || ONLY === id;

const WORKBOOK = '<?xml version="1.0" encoding="UTF-8"?>'
  + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
  + ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
  + '<sheets><sheet name="Cards" sheetId="1" r:id="rId1"/></sheets></workbook>';
const RELS = '<?xml version="1.0" encoding="UTF-8"?>'
  + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
  + '<Relationship Id="rId1"'
  + ' Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"'
  + ' Target="worksheets/sheet1.xml"/>'
  + '</Relationships>';

function sheetOf(inner) {
  return '<?xml version="1.0" encoding="UTF-8"?>'
    + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
    + '<sheetData>' + inner + '</sheetData></worksheet>';
}
function sstOf(inner) {
  return '<?xml version="1.0" encoding="UTF-8"?>'
    + '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' + inner + '</sst>';
}
function pack(sheet, sst) {
  const parts = [
    { name: "xl/workbook.xml", data: WORKBOOK },
    { name: "xl/_rels/workbook.xml.rels", data: RELS },
    { name: "xl/worksheets/sheet1.xml", data: sheet },
  ];
  if (sst != null) parts.push({ name: "xl/sharedStrings.xml", data: sst });
  return zip(parts);
}
function filled(tag, bytes) {
  const n = Math.ceil(bytes / tag.length);
  return tag.repeat(n);
}

function main() {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });

  if (want("iu2")) {
    const rowXml = sheetOf(filled("<row>", PART));
    const cellXml = sheetOf("<row r=\"1\">" + filled('<c r="A1">', PART) + "</row>");
    const siXml = sstOf(filled("<si><t>", PART));
    const tiny = sheetOf('<row r="1"><c r="A1" t="inlineStr"><is><t>kept</t></is></c></row>');
    fs.writeFileSync(path.join(SCRATCH, "row.xlsx"), pack(rowXml, null));
    fs.writeFileSync(path.join(SCRATCH, "cell.xlsx"), pack(cellXml, null));
    fs.writeFileSync(path.join(SCRATCH, "si.xlsx"), pack(tiny, siXml));
    const sizes = { row: rowXml.length, cell: cellXml.length, si: siXml.length };
    const t0 = Date.now();
    const child = spawnSync(process.execPath, [SELF], {
      cwd: ROOT, encoding: "utf8", timeout: 8000, windowsHide: true,
      env: Object.assign({}, process.env, { IMPORT_MARKUP_DIR: SCRATCH, IMPORT_MARKUP_ONLY: "iu2",
        ETIUDA_PLANTS: "off" }),
    });
    const ms = Date.now() - t0;
    const lines = String(child.stdout || "").split(/\r?\n/).filter(Boolean);
    const byName = {};
    lines.forEach(l => { const sp = l.indexOf(" "); if (sp > 0) byName[l.slice(0, sp)] = l.slice(sp + 1); });
    ["row", "cell", "si"].forEach(name => {
      const got = byName[name] || "";
      const big = sizes[name] >= PART && sizes[name] < 64 * 1024 * 1024;
      check(big && got.startsWith("REFUSED") && /unclosed/.test(got) && ms < 3000,
        "iu2 " + sizes[name] + " bytes of unclosed " + name + " markup, under the unpack ceiling,"
        + " is refused in " + ms + " ms: " + (got || "no line, status " + child.status).slice(0, 180));
    });
    const closed = readWorkbook(book([{ name: "Cards", rows: [{ r: 1, cells: [{ ref: "A1", inline: "kept" }] }] }], []));
    const cell = closed.sheets[0].cells[0];
    check(closed.sheets.length === 1 && cell && cell.value === "kept",
      "iu2 a closed sheet of one cell still reads: " + (cell ? cell.value : "nothing"));
  }

  if (!ONLY) {
    copyPlants({
      root: ROOT, self: SELF, label: "import-markup", onlyVar: "IMPORT_MARKUP_ONLY",
      check, skip, timeout: 120000,
      plants: [
        { mark: "markup-close", leg: "iu2", rel: "src/workbook.mjs",
          line: "  if (end < 0) return { gt: gt, inner: \"\", next: xml.length };" },
      ],
    });
  }

  if (!process.argv.includes("--keep")) dropScratch(SCRATCH, "import-markup");
  process.stdout.write("import-markup: " + asserted + " assertion(s), " + skipped
    + " skipped, " + failed + " failure(s)"
    + (PLANTS_OFF ? " (ETIUDA_PLANTS=off)" : "") + "\n");
  process.exit(failed ? 1 : 0);
}

main();
