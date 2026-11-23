/* A SURROGATE REFERENCE IS THE REPLACEMENT CHARACTER, AND THE READ GOES ON.
 *
 *     node tests/import-charref.mjs [--keep]
 *
 * A shared string and an inline cell hold &#xD800;, and a later cell holds ordinary text.
 * The same book holds &#55296;, &#xDFFF;, a code point past U+10FFFF, and &amp;. Each
 * surrogate comes back as U+FFFD, the later cell is still there, an out-of-range reference
 * stays the text the file wrote, and &amp; is &.
 *
 * The plant puts fromCodePoint back on the surrogate line, so the read throws and this leg
 * fails. ETIUDA_PLANTS=off skips that proof and prints NOT RUN.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readWorkbook } from "../src/workbook.mjs";
import { zip } from "../tools/fixtures/workbook.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { copyPlants } from "./plant-copy.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "import-charref");
const SELF = fileURLToPath(import.meta.url);
const ONLY = process.env.IMPORT_CHAR_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const FFFD = "\uFFFD";

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

function pack(sheet, sst) {
  return zip([
    { name: "xl/workbook.xml", data: WORKBOOK },
    { name: "xl/_rels/workbook.xml.rels", data: RELS },
    { name: "xl/worksheets/sheet1.xml", data: sheet },
    { name: "xl/sharedStrings.xml", data: sst },
  ]);
}

function main() {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });

  if (want("iu12")) {
    const sst = '<?xml version="1.0" encoding="UTF-8"?>'
      + '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
      + "<si><t>lead&#xD800;tail</t></si>"
      + "<si><t>&#55296;</t></si>"
      + "<si><t>end&#xDFFF;end</t></si>"
      + "<si><t>&#x110000;</t></si>"
      + "<si><t>&#1114112;</t></si>"
      + "<si><t>a &amp; b</t></si>"
      + "<si><t>after</t></si>"
      + "</sst>";
    const sheet = '<?xml version="1.0" encoding="UTF-8"?>'
      + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'
      + '<row r="1">'
      + '<c r="A1" t="s"><v>0</v></c>'
      + '<c r="B1" t="s"><v>1</v></c>'
      + '<c r="C1" t="s"><v>2</v></c>'
      + '<c r="D1" t="s"><v>3</v></c>'
      + '<c r="E1" t="s"><v>4</v></c>'
      + '<c r="F1" t="s"><v>5</v></c>'
      + '<c r="G1" t="s"><v>6</v></c>'
      + '<c r="H1" t="inlineStr"><is><t>go&#xD800;on</t></is></c>'
      + '<c r="I1" t="inlineStr"><is><t>kept</t></is></c>'
      + "</row></sheetData></worksheet>";
    const buf = pack(sheet, sst);
    fs.writeFileSync(path.join(SCRATCH, "charref.xlsx"), buf);
    let thrown = null, wb = null;
    try { wb = readWorkbook(buf); }
    catch (e) { thrown = e; }
    const cells = (wb && wb.sheets[0] && wb.sheets[0].cells) || [];
    const at = (ref) => cells.find(c => c.ref === ref);
    const show = (ref) => {
      if (thrown) return (thrown.name || "Error") + ": " + (thrown.message || String(thrown));
      const c = at(ref);
      return c ? JSON.stringify(c.value) : "absent";
    };
    check(!thrown && at("A1") && at("A1").value === "lead" + FFFD + "tail",
      "iu12 a shared string's &#xD800; is U+FFFD and the read does not abort: " + show("A1"));
    check(!thrown && at("B1") && at("B1").value === FFFD,
      "iu12 the decimal surrogate &#55296; is U+FFFD: " + show("B1"));
    check(!thrown && at("C1") && at("C1").value === "end" + FFFD + "end",
      "iu12 &#xDFFF; is U+FFFD: " + show("C1"));
    check(!thrown && at("D1") && at("D1").value === "&#x110000;",
      "iu12 a code point past U+10FFFF stays the reference the file wrote: " + show("D1"));
    check(!thrown && at("E1") && at("E1").value === "&#1114112;",
      "iu12 the same point in decimal stays the reference: " + show("E1"));
    check(!thrown && at("F1") && at("F1").value === "a & b",
      "iu12 &amp; is still &: " + show("F1"));
    check(!thrown && at("G1") && at("G1").value === "after",
      "iu12 a shared string after the surrogate is still read: " + show("G1"));
    check(!thrown && at("H1") && at("H1").value === "go" + FFFD + "on",
      "iu12 an inline cell's &#xD800; is U+FFFD: " + show("H1"));
    check(!thrown && at("I1") && at("I1").value === "kept",
      "iu12 the cell after that inline surrogate is still read: " + show("I1"));
  }

  if (!ONLY) {
    copyPlants({
      root: ROOT, self: SELF, label: "import-charref", onlyVar: "IMPORT_CHAR_ONLY",
      check, skip, timeout: 180000,
      plants: [
        { mark: "surrogate", leg: "iu12", rel: "src/workbook.mjs",
          line: "      if (code >= 0xD800 && code <= 0xDFFF) return String.fromCodePoint(code);" },
      ],
    });
  }

  if (!process.argv.includes("--keep")) dropScratch(SCRATCH, "import-charref");
  process.stdout.write("import-charref: " + asserted + " assertion(s), " + skipped
    + " skipped, " + failed + " failure(s)"
    + (PLANTS_OFF ? " (ETIUDA_PLANTS=off)" : "") + "\n");
  process.exit(failed ? 1 : 0);
}

main();
