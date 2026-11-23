/* WHAT AN IMPORT KEEPS, against the review of 2026-11-15, findings 8, 5, 7, 9, 11, 6 and 10.
 *
 *     node tests/import-faithful.mjs
 *
 * One leg per finding. IMPORT_FAITHFUL_ONLY names a single leg, which is how a plant's scratch
 * copy runs. ETIUDA_PLANTS=off skips the plants and prints NOT RUN for each, which is what a
 * merge's area run does. The inputs are invented here.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decode } from "../src/csv.mjs";
import { examine } from "../src/source.mjs";
import { importCsv } from "../src/import.mjs";
import { readWorkbook } from "../src/workbook.mjs";
import { book } from "../tools/fixtures/workbook.mjs";
import { adapt } from "../src/adapt.mjs";
import { splitPaste } from "../src/paste.mjs";
import { checkSpans, importText } from "../src/import-text.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { copyPlants } from "./plant-copy.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SELF = fileURLToPath(import.meta.url);
const SCRATCH = path.join(ROOT, "scratch", "import-faithful");
const ONLY = process.env.IMPORT_FAITHFUL_ONLY || "";

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

/* A real U+FFFD is the three bytes EF BF BD, which are legal UTF-8. A lone 0xE0 is not. */
function leg8() {
  const kept = Buffer.concat([
    Buffer.from("a", "utf8"),
    Buffer.from([0xEF, 0xBF, 0xBD]),
    Buffer.from("łb", "utf8"),
  ]);
  const got = decode(kept);
  check(got.encoding === "utf-8" && got.text === "a\uFFFDłb" && got.replaced === 0
    && Array.isArray(got.offsets) && got.offsets.length === 0,
    "f8 a valid UTF-8 file that contains U+FFFD stays UTF-8, the letter and the replacement"
    + " character both kept, encoding " + got.encoding + ", replaced " + got.replaced);

  const head = Buffer.from("Title,Body\r\nHello,caf", "utf8");
  const badAt = head.length;
  const bad = Buffer.concat([head, Buffer.from([0xE0]), Buffer.from("\r\n", "utf8")]);
  const cp = decode(bad);
  check(cp.encoding === "windows-1252" && cp.text.indexOf("\u00E0") >= 0
    && Array.isArray(cp.offsets) && cp.offsets.indexOf(badAt) >= 0,
    "f8 a byte that is not UTF-8 is still read as " + cp.encoding
    + ", and the illegal offset is named " + JSON.stringify(cp.offsets));
  return { kept, bad, badAt };
}

async function leg8Cover(kept, bad, badAt) {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const plain = await importCsv({
    text: "Title,Body\r\nSee,a\uFFFDłb\r\n",
    dir: SCRATCH, id: "f8kept",
  });
  const warned = (plain.report.findings || []).filter(f => /not valid UTF-8/.test(String(f.what)));
  const body = plain.catalog.cards.map(c => (c.body && (c.body.en || c.body)) || "").join(" ");
  check(plain.report.encoding === "utf-8" && warned.length === 0 && body.indexOf("\uFFFD") >= 0
    && body.indexOf("ł") >= 0,
    "f8 the same file imported as CSV stays UTF-8, with no encoding warning and both characters"
    + " in the card, encoding " + plain.report.encoding + ", warnings " + warned.length);

  const file = path.join(SCRATCH, "west.csv");
  fs.writeFileSync(file, bad);
  const west = await importCsv({ file, dir: SCRATCH, id: "f8west" });
  const hit = (west.report.findings || []).filter(f => /not valid UTF-8/.test(String(f.what)));
  const said = hit.map(f => String(f.what)).join(" ");
  check(west.report.encoding === "windows-1252" && hit.length === 1 && said.indexOf(String(badAt)) >= 0,
    "f8 the cover names the illegal byte offset " + badAt + " in " + JSON.stringify(said.slice(0, 180)));

  const seen = examine({ buf: kept });
  check(seen.encoding === "utf-8" && seen.replaced === 0,
    "f8 examine agrees: encoding " + seen.encoding + ", replaced " + seen.replaced);
}

/* Built-in 9 is 0%, 11 is scientific, 3 is thousands. 164, 165 and 166 are this book's own. */
const NUMBER_STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
  + '<numFmts count="3">'
  + '<numFmt numFmtId="164" formatCode="000"/>'
  + '<numFmt numFmtId="165" formatCode="&quot;$&quot;#,##0.00"/>'
  + '<numFmt numFmtId="166" formatCode="#,##0;(#,##0)"/>'
  + '</numFmts>'
  + '<cellXfs count="7">'
  + '<xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>'
  + '<xf numFmtId="9" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/>'
  + '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/>'
  + '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/>'
  + '<xf numFmtId="11" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/>'
  + '<xf numFmtId="3" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/>'
  + '<xf numFmtId="166" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/>'
  + '</cellXfs></styleSheet>';

function numberBook() {
  const rows = [{ r: 1, cells: [
    { ref: "A1", n: "0.5", s: 1 },
    { ref: "B1", n: "7", s: 2 },
    { ref: "C1", n: "12.5", s: 3 },
    { ref: "D1", n: "1234", s: 4 },
    { ref: "E1", n: "42", s: 0 },
    { ref: "F1", n: "1234567", s: 5 },
    { ref: "G1", n: "-12", s: 6 },
  ] }];
  return book([{ name: "Numbers", rows }], [], { styles: NUMBER_STYLES });
}

function leg7() {
  const html = "<p>It&rsquo;s ready, &#322; and &#xF3;.</p>"
    + "<script>secret()</script><style>.x{color:red}</style>"
    + "<p>See <a href=\"https://help.example/page\">the page</a>"
    + " and &lt;b&gt;kept&lt;/b&gt;.</p>";
  const rows = adapt("templates-list", {
    templates: [{ id: "rowf7", name: "Reply", body: html }],
  });
  const body = rows[0].body;
  check(body.indexOf("\u2019") >= 0 && body.indexOf("\u0142") >= 0 && body.indexOf("\u00F3") >= 0
    && body.indexOf("secret()") < 0 && body.indexOf("color:red") < 0
    && body.indexOf("https://help.example/page") >= 0 && body.indexOf("<b>") >= 0
    && body.indexOf("&rsquo;") < 0,
    "f7 an HTML reply decodes references, keeps the link address, drops script and style,"
    + " and leaves an escaped tag visible: " + JSON.stringify(body));
  const two = adapt("templates-list", {
    templates: [{ id: "rowf7b", name: "Two", body: "<p>One para.</p><p>Two para.</p>" }],
  });
  check(two[0].body === "One para.\n\nTwo para.",
    "f7 two paragraphs stay two paragraphs: " + JSON.stringify(two[0].body));
  const plain = adapt("macros-actions", { macros: [{
    id: "rowf7c", title: "Shelf::Title",
    actions: [
      { field: "comment_value", value: "plain words" },
      { field: "comment_value_html", value: "<p>html words</p>" },
    ],
  }] });
  check(plain[0].body === "plain words",
    "f7 a plain field is kept and the HTML is not used: " + JSON.stringify(plain[0].body));
}

function leg9() {
  const plain = "Opened\n\nfirst reply\n\nSecond heading\n\nsecond reply";
  const merged = splitPaste(plain, "<h1>Opened</h1><h1>not closed<h2>Second heading</h2>");
  check(merged.length === 2
    && merged[0].title === "Opened" && merged[0].body === "first reply"
    && merged[1].title === "Second heading" && merged[1].body === "second reply",
    "f9 an unclosed heading does not swallow the next one: " + merged.length + " card(s) "
    + JSON.stringify(merged.map(c => c.title + " / " + c.body)));
  const literal = splitPaste(plain, "<h1>Opened<h2>Second heading</h2>");
  check(literal.length === 2
    && literal[1] && literal[1].title === "Second heading" && literal[1].body === "second reply",
    "f9 a first heading that is never closed still leaves the later heading: " + literal.length
    + " card(s) " + JSON.stringify(literal.map(c => c.title + " / " + c.body)));
  const alone = splitPaste("Intro\nAlpha\nunder", "<h1>Alpha");
  check(alone.length === 1 && alone[0].title === "Intro" && alone[0].body === "Alpha\nunder",
    "f9 an unclosed heading with nothing after it is still not a heading");
}

async function leg11() {
  const head = "H".repeat(40);
  const tail = "T".repeat(40);
  const first = head + tail;
  const source = first + "R".repeat(280) + tail;
  const loose = checkSpans([{ from: head, to: tail, chars: 250 }], source, { cursor: { at: 0 } });
  check(loose.ok && loose.body.length === 400 && loose.loose === true,
    "f11 a length near the sum of two replies is kept and marked loose: "
    + (loose.ok ? loose.body.length + " loose=" + loose.loose : loose.why));
  const close = checkSpans([{ from: head, to: tail, chars: 80 }], source, { cursor: { at: 0 } });
  check(close.ok && close.body === first && close.loose !== true,
    "f11 the same anchors with the first reply's length stay that reply and are not loose: "
    + (close.ok ? close.body.length : close.why));
  const missing = checkSpans([{ from: head, to: tail }], source, { cursor: { at: 0 } });
  check(missing.ok === false && missing.anchor === true && /length/.test(String(missing.why)),
    "f11 an anchor without a length is refused: " + (missing.ok ? "kept " + missing.body.length : missing.why));
  const zero = checkSpans([{ from: head, to: tail, chars: 0 }], source, { cursor: { at: 0 } });
  check(zero.ok === false && /length/.test(String(zero.why)),
    "f11 a length of zero is the same refusal: " + (zero.ok ? "kept " + zero.body.length : zero.why));
  const shortSrc = "Reply one. We wrote a short line and stop. Kind regards, the team.";
  const short = checkSpans([{ from: "Reply one.", to: "Kind regards, the team.",
    chars: shortSrc.length }], shortSrc, { cursor: { at: 0 } });
  check(short.ok === false && short.anchor === true && short.why === "anchor shorter than 40",
    "f11 an anchor shorter than 40 characters is refused, not read: "
    + (short.ok ? "kept " + short.body.length : short.why));
  const ask = async () => ({
    ok: true,
    text: JSON.stringify({ cards: [{
      title: { en: "A loose reply" }, category: "imported",
      bodies: [{ lang: "en", spans: [{ from: head, to: tail, chars: 250 }] }],
    }] }),
  });
  let out = null, blown = null;
  try { out = await importText({ text: source, ask, id: "f11loose", join: false }); }
  catch (err) { blown = err; }
  const spliced = out && out.report ? out.report.counts.spliced : null;
  const splices = out && out.report && Array.isArray(out.report.splices) ? out.report.splices.length : null;
  const said = out && out.report
    ? (out.report.findings || []).map(f => String(f.what)).join(" | ")
    : String(blown && (blown.message || blown));
  check(spliced === 1 && splices === 1 && /not as one piece/.test(said),
    "f11 the loose reply is counted as a splice on the cover: spliced " + spliced
    + ", splices " + splices + ", " + said.slice(0, 200));
}

function leg6() {
  const hiddenRows = book([{
    name: "Replies",
    rows: [
      { r: 1, cells: [{ ref: "A1", inline: "Title" }] },
      { r: 2, hidden: true, cells: [{ ref: "A2", inline: "old reply" }] },
      { r: 3, hidden: true, cells: [] },
    ],
  }], []);
  const rowsRead = examine({ buf: hiddenRows });
  const rowSaid = rowsRead.notes.map(n => String(n.what)).join(" | ");
  const rowValues = rowsRead.table.rows.map(r => Object.values(r).join(" "));
  check(rowValues.some(v => String(v).indexOf("old reply") >= 0)
    && /hidden rows read on the sheet "Replies": 2\. They are in the import/.test(rowSaid)
    && !/is hidden/.test(rowSaid),
    "f6 hidden rows are still read, and the cover says so: " + rowSaid.slice(0, 240));

  const onlyHidden = book([{
    name: "Archive",
    hidden: true,
    rows: [
      { r: 1, cells: [{ ref: "A1", inline: "Title" }] },
      { r: 2, cells: [{ ref: "A2", inline: "hidden reply" }] },
    ],
  }], []);
  const hid = examine({ buf: onlyHidden });
  const hidSaid = hid.notes.map(n => String(n.what)).join(" | ");
  const hidValues = hid.table.rows.map(r => Object.values(r).join(" "));
  check(hidValues.some(v => String(v).indexOf("hidden reply") >= 0)
    && /the sheet "Archive" is hidden, and no visible sheet has anything in its cells, so the import is this sheet's cells/.test(hidSaid)
    && !/hidden row/.test(hidSaid),
    "f6 a hidden sheet's cells are the import, and the cover names the sheet: " + hidSaid.slice(0, 260));

  const both = book([
    { name: "Open", rows: [{ r: 1, cells: [{ ref: "A1", inline: "visible reply" }] }] },
    { name: "Tucked", hidden: true, rows: [
      { r: 1, hidden: true, cells: [{ ref: "A1", inline: "tucked reply" }] },
    ] },
  ], []);
  const mix = examine({ buf: both });
  const mixSaid = mix.notes.map(n => String(n.what)).join(" | ");
  check(mix.workbook && mix.workbook.sheets[0].name === "Open"
    && !/is hidden/.test(mixSaid)
    && /Only "Open" was read/.test(mixSaid)
    && !/hidden row/.test(mixSaid),
    "f6 a hidden sheet that was not chosen is not given its own line: " + mixSaid.slice(0, 260));
}

async function leg10() {
  const one = path.join(SCRATCH, "f10a");
  fs.mkdirSync(one, { recursive: true });
  const replies = path.join(one, "replies.csv");
  fs.writeFileSync(replies, [
    "Title,Body,Category",
    "A refund,We refund within fourteen days.,refunds",
    "The same,The words are the same as the key.,same",
    "An extra,This key is not in the sibling.,minted",
  ].join("\n"), "utf8");
  fs.writeFileSync(path.join(one, "categories.csv"), [
    "key,label",
    "refunds,not the cell",
    "same,same",
    "spare,nobody used this",
  ].join("\n"), "utf8");
  const out = await importCsv({ file: replies, id: "f10labels" });
  const labels = (out.catalog.tags || []).filter(t => t.kind === "shelf").map(t => t.label && t.label.en);
  const said = (out.report.findings || []).map(f => String(f.what)).join(" | ");
  check(labels.indexOf("not the cell") >= 0 && labels.indexOf("same") >= 0
    && labels.indexOf("minted") >= 0,
    "f10 the sibling label is what lands, and a key the sibling skips keeps its own: "
    + JSON.stringify(labels));
  check(/labels renamed by categories\.csv beside the file: 2\. "refunds" as "not the cell", "same" as "same"/.test(said)
    && said.indexOf("nobody used") < 0,
    "f10 the cover names every shared label, including one that matches its key: "
    + said.slice(0, 320));

  const many = path.join(SCRATCH, "f10b");
  fs.mkdirSync(many, { recursive: true });
  const keys = ["k1", "k2", "k3", "k4", "k5", "k6", "k7", "k8", "k9"];
  fs.writeFileSync(path.join(many, "replies.csv"),
    ["Title,Body,Category"].concat(keys.map(k => k + " title,The reply for " + k + ".," + k)).join("\n"),
    "utf8");
  fs.writeFileSync(path.join(many, "categories.csv"),
    ["key,label"].concat(keys.map(k => k + ",L" + k.slice(1))).join("\n"), "utf8");
  const capped = await importCsv({ file: path.join(many, "replies.csv"), id: "f10nine" });
  const capSaid = (capped.report.findings || []).map(f => String(f.what)).join(" | ");
  check(/labels renamed by categories\.csv beside the file: 9\. "k1" as "L1", "k2" as "L2", "k3" as "L3", "k4" as "L4", "k5" as "L5", "k6" as "L6", "k7" as "L7", "k8" as "L8", and the rest: 1/.test(capSaid)
    && capSaid.indexOf("L9") < 0,
    "f10 the cover shows eight labels and counts the rest: " + capSaid.slice(0, 360));

  const alone = path.join(SCRATCH, "f10c");
  fs.mkdirSync(alone, { recursive: true });
  const bare = path.join(alone, "replies.csv");
  fs.writeFileSync(bare, "Title,Body,Category\nA refund,We refund within fourteen days.,refunds\n", "utf8");
  const none = await importCsv({ file: bare, id: "f10none" });
  const noneSaid = (none.report.findings || []).map(f => String(f.what)).join(" | ");
  check(noneSaid.indexOf("categories.csv beside") < 0,
    "f10 a file with no categories.csv beside it says nothing about one: " + noneSaid.slice(0, 180));
}

function leg5() {
  const bytes = numberBook();
  const wb = readWorkbook(bytes);
  const at = (ref) => wb.sheets[0].cells.find(c => c.ref === ref);
  const value = (ref) => at(ref) ? at(ref).value : null;
  check(value("A1") === "50%" && value("B1") === "007" && value("C1") === "$12.50"
    && value("F1") === "1,234,567" && value("G1") === "(12)",
    "f5 the sheet's own text lands: percent " + JSON.stringify(value("A1"))
    + ", leading zeros " + JSON.stringify(value("B1"))
    + ", currency " + JSON.stringify(value("C1"))
    + ", thousands " + JSON.stringify(value("F1"))
    + ", negative " + JSON.stringify(value("G1")));
  check(value("D1") === "1234" && value("E1") === "42",
    "f5 a format this import cannot show stays " + JSON.stringify(value("D1"))
    + " and a general number stays " + JSON.stringify(value("E1")));
  const src = examine({ buf: bytes });
  const said = src.notes.map(n => String(n.what)).join(" | ");
  check(said.indexOf("A1") >= 0 && said.indexOf("50%") >= 0
    && said.indexOf("B1") >= 0 && said.indexOf("007") >= 0,
    "f5 the cover names the cells and the text that landed: " + said.slice(0, 240));
  check(said.indexOf("D1") >= 0 && said.indexOf("1234") >= 0 && said.indexOf("E1") < 0,
    "f5 the scientific cell is named as kept, and the general cell is not mentioned: "
    + said.slice(0, 240));
}

const PLANTS = [
  { mark: "utf8-fatal", leg: "f8", rel: "src/csv.mjs",
    line: "  if (false) return { text: \"\", encoding: \"utf-8\", replaced: 0, offsets: [] };" },
  { mark: "number-shown", leg: "f5", rel: "src/workbook.mjs",
    line: "      cell.value = raw;" },
  { mark: "html-faithful", leg: "f7", rel: "src/adapt.mjs",
    line: "  s = s;" },
  { mark: "unclosed-heading", leg: "f9", rel: "src/paste.mjs",
    line: "      if (end < 0) break;" },
  { mark: "anchor-floor", leg: "f11", rel: "src/import-text.mjs",
    line: "  if (false) return { refused: \"anchor shorter than 40\" };" },
  { mark: "hidden-read", leg: "f6", rel: "src/source.mjs",
    line: "    void sheet;" },
  { mark: "sibling-label", leg: "f10", rel: "src/import.mjs",
    line: "    void shelfOrder;" },
];

async function main() {
  if (want("f8")) {
    const bag = leg8();
    await leg8Cover(bag.kept, bag.bad, bag.badAt);
  }
  if (want("f5")) leg5();
  if (want("f7")) leg7();
  if (want("f9")) leg9();
  if (want("f11")) await leg11();
  if (want("f6")) leg6();
  if (want("f10")) await leg10();
  if (!ONLY) {
    copyPlants({
      root: ROOT, self: SELF, label: "import-faithful", onlyVar: "IMPORT_FAITHFUL_ONLY",
      plants: PLANTS, check, skip,
    });
  }
  process.stdout.write("import-faithful " + asserted + " assertion(s), " + failed
    + " failure(s), " + skipped + " skipped\n");
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  process.stderr.write("FAIL f8 " + (err && err.stack ? err.stack : err) + "\n");
  process.exit(1);
});
