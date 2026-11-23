/* THE WORKBOOK READER, THE PERIODIC COLUMN AND THE FORK. Boards 641 and 642.
 *
 *     node tests/workbook.mjs [--keep]
 *
 * THE ORACLE IS THE ANSWER KEY THE GENERATOR WROTE, plus a second reading of each file by a
 * zip walk written in this file. tools/fixtures/workbook.mjs makes eleven books from a seed and
 * writes what is in each beside it; nothing here asks the reader what it thinks it found and
 * then agrees with it. Where a count could be got two ways it is got two ways: the cells the
 * reader returns against the `<c ` tags in the sheet the walk below inflates, and the shared
 * strings it resolved against the `<si>` elements in the table.
 *
 * THE CONTROLS, which are the legs that give the rest their teeth:
 *   a SHUFFLED copy of a periodic column, same cells and same character mix, must be refused.
 *     If it were accepted the detection would be reading the mixture rather than the order, and
 *     every other leg here would pass on a file with no cycle in it.
 *   a stray inserted in the MIDDLE must be refused too, because half a file's cycle is not a
 *     cycle and cutting the cards in the wrong place is the failure this whole item exists to
 *     avoid.
 *   a GENUINE TABLE must not be read as periodic, and the flat column must not be read as
 *     anything.
 * The real file this was written for is never referenced here: it is the employer's content, it
 * is checked by hand on the desk, and what reaches this tree is invented.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readWorkbook, sheetGrid, trimGrid, firstSheetWithCells } from "../src/workbook.mjs";
import { detectPeriod, proposePeriodic } from "../src/periodic.mjs";
import { book, oneColumn } from "../tools/fixtures/workbook.mjs";
import { examine } from "../src/source.mjs";
import { importCsv } from "../src/import.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "workbook-legs");
const SEED = 11;

/* Two per readable book (14), the reader's own 2a to 2h (20), the period 3a to 3i (21), the
   fork 4a to 4e (6), the importer 5a to 5h (8), the refusal that carries the reading 6a to 6h
   (8), the ceiling 2i to 2k (3), and the floor itself (1). */
const EXPECTED = 84;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

/* ---- the second reading, written here on purpose ------------------------------------------ */

/* A zip walk of its own, so that "the reader found 36 cells" is checked against the file rather
   than against the reader. Twenty lines, the central directory only, no sharing with src/. */
function entriesOf(buf) {
  let end = -1;
  for (let i = buf.length - 22; i >= 0; i--) if (buf.readUInt32LE(i) === 0x06054b50) { end = i; break; }
  const count = buf.readUInt16LE(end + 10);
  let p = buf.readUInt32LE(end + 16);
  const out = new Map();
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nlen = buf.readUInt16LE(p + 28);
    const elen = buf.readUInt16LE(p + 30);
    const clen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nlen);
    const ln = buf.readUInt16LE(local + 26), le = buf.readUInt16LE(local + 28);
    const at = local + 30 + ln + le;
    const raw = buf.subarray(at, at + csize);
    out.set(name, method === 0 ? raw.toString("utf8") : zlib.inflateRawSync(raw).toString("utf8"));
    p += 46 + nlen + elen + clen;
  }
  return out;
}

const countOf = (text, re) => (String(text).match(re) || []).length;

/* ---- the fixtures ------------------------------------------------------------------------- */

function make() {
  clearScratch(SCRATCH);
  const r = spawnSync(process.execPath,
    [path.join(ROOT, "tools", "fixtures", "workbook.mjs"), "--seed", String(SEED),
     "--out", SCRATCH], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0)
    throw new Error("the fixture generator refused: " + String(r.stderr || r.stdout).trim());
}

const at = (name, ext) => path.join(SCRATCH, name + (ext || ".xlsx"));
const keyOf = (name) => JSON.parse(fs.readFileSync(at(name, ".key.json"), "utf8"));
const bytesOf = (name) => fs.readFileSync(at(name));
const columnOf = (wb) => trimGrid(sheetGrid(firstSheetWithCells(wb))).rows
  .map(r => String(r[0] == null ? "" : r[0]));

function refusalOf(fn) {
  try { fn(); return null; } catch (e) { return e; }
}

async function main(argv) {
  make();

  /* ---- 1. the file the generator wrote is the file the reader reads ----------------------- */

  const READABLE = ["period3", "ragged", "heading", "period4", "table", "flat", "oddities"];
  READABLE.forEach(name => {
    const parts = entriesOf(bytesOf(name));
    const wb = readWorkbook(bytesOf(name));
    /* A <c> tag holding neither a value nor an inline string is a cell the file has no content
       for - a formula whose result was never saved is the case here - and the reader hands back
       nothing for it on purpose, so the second count has to make the same distinction rather
       than count tags. */
    let cellsInFile = 0, valueless = 0;
    Array.from(parts.keys()).filter(k => k.startsWith("xl/worksheets/")).forEach(k => {
      const xml = parts.get(k);
      const re = /<c\s[^>]*?(?:\/>|>([\s\S]*?)<\/c>)/g;
      let m;
      while ((m = re.exec(xml))) {
        cellsInFile++;
        if (!/<v[\s>]|<is[\s>]/.test(m[1] == null ? "" : m[1])) valueless++;
      }
    });
    const cellsRead = wb.sheets.reduce((a, s) => a + s.cells.length, 0);
    check(cellsRead === cellsInFile - valueless,
      "1a " + name + ": the reader's cells equal the sheet's own <c> tags that carry a value,"
      + " counted by a zip walk written in this file, " + cellsRead + " against "
      + cellsInFile + " less " + valueless + " valueless");
    const si = countOf(parts.get("xl/sharedStrings.xml") || "", /<si>|<si /g);
    check(wb.strings === si,
      "1b " + name + ": the shared strings it resolved equal the <si> elements in the table, "
      + wb.strings + " against " + si);
  });

  /* ---- 2. what the reader hands on, and what it refuses ----------------------------------- */

  const odd = readWorkbook(bytesOf("oddities"));
  const oddKey = keyOf("oddities");
  const sheet = firstSheetWithCells(odd);
  const byRef = new Map(sheet.cells.map(c => [c.ref, c]));
  Object.keys(oddKey.cells).forEach(ref => {
    const want = oddKey.cells[ref];
    const got = byRef.get(ref);
    const same = got && got.kind === want.kind && got.value === want.value
      && (want.dateFormat == null || got.dateFormat === want.dateFormat)
      && (want.formula == null || got.formula === want.formula);
    check(same, "2a " + ref + " is " + want.kind + " " + JSON.stringify(want.value)
      + (want.dateFormat ? " flagged as a date by " + JSON.stringify(want.dateFormat) : "")
      + (want.formula ? " and flagged as a formula" : "")
      + (same ? "" : ", got " + JSON.stringify(got || null)));
  });
  check(oddKey.empty.every(ref => !byRef.has(ref)),
    "2b the cells the file holds no value for are absent rather than empty strings: "
    + oddKey.empty.join(", "));
  const census = odd.notes.reduce((a, n) => (a[n.what] = (a[n.what] || 0) + 1, a), {});
  check(Object.keys(oddKey.notes).every(k => census[k] === oddKey.notes[k])
        && Object.keys(census).length === Object.keys(oddKey.notes).length,
    "2c the notes it raised are the ones the key says, " + JSON.stringify(census));
  check(sheet.merges.join(",") === oddKey.merges.join(",")
        && sheet.hiddenRows === oddKey.hiddenRows && odd.sheets.length === oddKey.sheets,
    "2d the merged region, the hidden row and both sheets are reported: "
    + JSON.stringify(sheet.merges) + ", " + sheet.hiddenRows + " hidden row(s), "
    + odd.sheets.length + " sheet(s)");
  check(sheet.name === "Odd" && odd.sheets.filter(s => s.state === "hidden").length === 1,
    "2e the sheet an importer is given is the visible one, " + JSON.stringify(sheet.name)
    + ", with " + odd.sheets.filter(s => s.state === "hidden").length + " hidden beside it");
  const trimmed = trimGrid(sheetGrid(sheet));
  check(trimmed.rows.length === oddKey.trimmed.rows && trimmed.top === oddKey.trimmed.top
        && trimmed.left === oddKey.trimmed.left
        && trimmed.rows[0].length === oddKey.trimmed.columns,
    "2f content that starts at C5 keeps its address: " + trimmed.rows.length + " x "
    + trimmed.rows[0].length + " after cutting " + trimmed.top + " row(s) and " + trimmed.left
    + " column(s)");

  const REFUSALS = [
    ["nosheet", /no xl\/workbook\.xml/],
    ["zip64", /zip64/],
    ["method", /method 12/],
    ["notazip", /not a workbook/],
  ];
  REFUSALS.forEach(([name, re]) => {
    const e = refusalOf(() => readWorkbook(bytesOf(name)));
    check(e && re.test(e.message) && e.said && typeof e.said.frame === "string",
      "2g " + name + " is refused by name and the refusal carries its frame: "
      + (e ? JSON.stringify(e.message) : "NOTHING WAS THROWN"));
  });
  /* A WORKBOOK THAT UNPACKS PAST THE CEILING IS REFUSED, BY ITS DIRECTORY OR BY ITS BYTES (sense
     pass 3, item 32). One cell of 96 MB of spaces packs to about 100 KB; the lying copy is the
     same file with its directory saying the sheet is 1 KB. */
  const one = oneColumn(["Ustuma"]);
  const small = book([{ name: "Cards", rows: one.rows }], one.strings);
  const packed = book([{ name: "Cards", rows: [{ r: 1, cells: [one.rows[0].cells[0],
    { ref: "B1", inline: " ".repeat(96 * 1024 * 1024) }] }] }], one.strings);
  const honest = refusalOf(() => readWorkbook(packed));
  check(packed.length < 1024 * 1024 && honest && /unpacks to more than/.test(honest.message)
        && honest.said && typeof honest.said.frame === "string",
    "2i a " + Math.round(packed.length / 1024) + " KB workbook whose sheet unpacks to 96 MB is"
    + " refused by its directory, with a frame: "
    + (honest ? JSON.stringify(honest.message) : "NOTHING WAS THROWN"));
  const lying = Buffer.from(packed);
  let cd = -1;
  for (let i = lying.length - 46; i >= 0 && cd < 0; i--)
    if (lying.readUInt32LE(i) === 0x02014b50 && lying.toString("utf8", i + 46,
        i + 46 + lying.readUInt16LE(i + 28)) === "xl/worksheets/sheet1.xml") cd = i;
  if (cd > 0) lying.writeUInt32LE(1024, cd + 24);
  const lie = refusalOf(() => readWorkbook(lying));
  check(cd > 0 && lie && /unpacks to more than/.test(lie.message),
    "2j and the same file with its directory saying 1 KB is refused by its bytes: "
    + (lie ? JSON.stringify(lie.message) : "NOTHING WAS THROWN"));
  const read = readWorkbook(small);
  check(read.sheets.length === 1 && read.sheets[0].cells.length === 1,
    "2k CONTROL: a small workbook built the same way still reads, one cell");

  /* A CSV that somebody saved with a workbook's name on it is not a refusal at the door it
     actually arrives at: examine() reads bytes, not extensions. */
  const asCsv = examine({ file: at("notazip") });
  check(asCsv.source === "csv" && asCsv.table.rows.length === 1,
    "2h and the same file reaching the importer is read as the CSV it is, by its bytes rather"
    + " than by its name: source " + asCsv.source + ", " + asCsv.table.rows.length + " row(s)");

  /* ---- 3. the period ---------------------------------------------------------------------- */

  ["period3", "ragged", "heading", "period4"].forEach(name => {
    const key = keyOf(name);
    const col = columnOf(readWorkbook(bytesOf(name)));
    const found = detectPeriod(col);
    check(found.found && found.period === key.period && found.skip === key.skip
          && found.ragged === key.ragged,
      "3a " + name + ": period " + (found.found ? found.period : "none") + " skip "
      + (found.found ? found.skip : "-") + " ragged " + (found.found ? found.ragged : "-")
      + ", the key says " + key.period + "/" + key.skip + "/" + key.ragged);
    const t = proposePeriodic(col, col.map((v, i) => i + 1), found);
    check(t && t.periodic.roles.map(r => r.field).join(",") === key.roles.join(","),
      "3b " + name + ": the roles by character profile are " + key.roles.join(", ") + ", got "
      + (t ? t.periodic.roles.map(r => r.field).join(", ") : "none"));
    const wrong = [];
    key.cards.forEach((card, i) => {
      const row = t.rows[i] || {};
      Object.keys(card).forEach(f => {
        if (String(row[f] == null ? "" : row[f]) !== String(card[f])) wrong.push(i + "." + f);
      });
    });
    check(t.rows.length === key.cycles && wrong.length === 0,
      "3c " + name + ": every cell of all " + key.cycles + " cycles lands in the field the key"
      + " says, " + t.rows.length + " row(s) proposed, " + wrong.length + " cell(s) wrong"
      + (wrong.length ? " (" + wrong.slice(0, 4).join(", ") + ")" : ""));
    check(t.rows.every(r => typeof r.__row === "number" && r.__row >= 1),
      "3d " + name + ": each proposed row carries the workbook row its cycle began at");
  });

  const raggedKey = keyOf("ragged");
  const raggedT = proposePeriodic(columnOf(readWorkbook(bytesOf("ragged"))));
  const lastRow = raggedT.rows[raggedT.rows.length - 1];
  check(raggedKey.ragged && String(lastRow.note || "") === ""
        && String(lastRow.title || "").length > 0 && String(lastRow.body || "").length > 0,
    "3e a last cycle short by one row is a row with an empty position, not a broken detection"
    + " and not a dropped card: the last row keeps its title and body and its note is "
    + JSON.stringify(String(lastRow.note || "")));

  const headingT = proposePeriodic(columnOf(readWorkbook(bytesOf("heading"))));
  check(headingT.periodic.skip === 1 && headingT.periodic.skipped.length === 1
        && headingT.periodic.skipped[0].row === 1,
    "3f a leading row that is the sole exception in an otherwise constant position is skipped"
    + " and REPORTED rather than swallowed: row "
    + (headingT.periodic.skipped[0] || {}).row + " left out of the table");

  /* THE CONTROLS. */
  const clean = columnOf(readWorkbook(bytesOf("period3")));
  const shuffled = clean.slice();
  let seed = 7;
  const rnd = () => { seed = (seed * 1103515245 + 12345) >>> 0; return seed / 4294967296; };
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const x = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = x;
  }
  const onShuffled = detectPeriod(shuffled);
  check(!onShuffled.found && /no period/.test(onShuffled.why),
    "3g THE CONTROL: the same cells in a shuffled order have no period, so the detection is"
    + " reading the ORDER and not the character mixture - " + onShuffled.why);
  const mid = clean.slice(0, 17).concat(["a line that belongs to no cycle"]).concat(clean.slice(17));
  const onMid = detectPeriod(mid);
  check(!onMid.found,
    "3h THE SECOND CONTROL: one stray in the middle breaks the cycle for everything after it,"
    + " and half a file's cycle is refused rather than half read - " + onMid.why);
  const flatFound = detectPeriod(columnOf(readWorkbook(bytesOf("flat"))));
  check(!flatFound.found && flatFound.best && flatFound.best.score < 0.55,
    "3i a column of thirty similar lines is no period and says how close it came: best "
    + (flatFound.best || {}).period + " at " + (flatFound.best || {}).score);

  /* ---- 4. the fork (642) ------------------------------------------------------------------- */

  const onTable = examine({ file: at("table") });
  const onPeriodic = examine({ file: at("period3") });
  const onFlat = examine({ file: at("flat") });
  const tableKey = keyOf("table");
  check(onTable.shape === "table" && onTable.table.head.join(",") === tableKey.head.join(",")
        && onTable.table.rows.length === tableKey.cards.length && !onTable.periodic,
    "4a a genuine table with a header row is read as a table and NOT as a periodic column: "
    + onTable.shape + ", head " + JSON.stringify(onTable.table.head) + ", "
    + onTable.table.rows.length + " row(s)");
  [["table", onTable], ["period3", onPeriodic]].forEach(([name, r]) => {
    const model = r.fork.paths.find(p => p.name === "model");
    const det = r.fork.paths.find(p => p.name === "deterministic");
    check(r.fork.byDefault === "deterministic" && det.byDefault === true
          && model.proposed === false && model.byDefault === false,
      "4b " + name + ": structure was found, so the deterministic path is the default and the"
      + " model is not proposed at all - " + model.why);
  });
  const flatModel = onFlat.fork.paths.find(p => p.name === "model");
  check(onFlat.shape === "column" && flatModel.proposed === true
        && onFlat.table.rows.length > 0 && flatModel.fixableWithout === true,
    "4c no structure found is where the model is PROPOSED, and the deterministic table comes"
    + " back anyway so declining it leaves " + onFlat.table.rows.length + " row(s) rather than"
    + " nothing");
  const col = columnOf(readWorkbook(bytesOf("flat")));
  const chars = col.reduce((a, v) => a + v.length, 0);
  check(flatModel.wouldSend.cells === col.length && flatModel.wouldSend.characters === chars
        && flatModel.available === false && flatModel.provider === null,
    "4d what would be sent is measured and not described, " + flatModel.wouldSend.cells
    + " cell(s) and " + flatModel.wouldSend.characters + " character(s) against " + col.length
    + " and " + chars + " counted here, and with no provider configured the path is not even"
    + " available");
  const withProvider = examine({ file: at("flat"), provider: "anthropic" });
  check(withProvider.fork.paths[1].available === true
        && withProvider.fork.paths[1].provider === "anthropic",
    "4e the provider the project configured is named on the path rather than assumed");

  /* ---- 5. the importer, end to end --------------------------------------------------------- */

  const key3 = keyOf("period3");
  const made = await importCsv({ file: at("period3"), id: "cycle-of-three", name: "Cycle" });
  const cards = made.catalog.cards || [];
  const titles = cards.map(c => String((c.title || {}).en || ""));
  const bodies = cards.map(c => String((c.body || {}).en || ""));
  check(cards.length === key3.cycles,
    "5a a workbook of one periodic column imports as " + cards.length + " card(s), the key"
    + " says " + key3.cycles);
  check(titles.join("|") === key3.cards.map(c => c.title).join("|")
        && bodies.join("|") === key3.cards.map(c => c.body).join("|"),
    "5b every card's title and body is the cell the key put there, in order");
  check(made.report.read.source === "workbook" && made.report.read.shape === "periodic"
        && made.report.read.periodic.period === 3
        && made.report.read.periodic.roles.every(r => typeof r.rule === "string" && r.rule),
    "5c the report says what was read and on what evidence: " + made.report.read.source + ", "
    + made.report.read.shape + ", period " + made.report.read.periodic.period
    + ", every position carrying the rule that gave it its field");
  const said = made.report.findings.filter(f => /repeats the same pattern/.test(f.what));
  check(said.length === 1 && said[0].severity === "warning",
    "5d and the person is told, in the findings rather than in a log: "
    + JSON.stringify(said.length ? said[0].what.slice(0, 90) : ""));
  check(made.report.counts.cards === key3.cycles
        && made.report.counts.macros === key3.cycles,
    "5e the count contract holds over a shape that was never a CSV: " + made.report.counts.cards
    + " card(s), " + made.report.counts.macros + " macro(s)");
  const madeTable = await importCsv({ file: at("table"), id: "plain-table", name: "Table" });
  check(madeTable.report.read.shape === "table"
        && (madeTable.catalog.cards || []).length === tableKey.cards.length,
    "5f and a workbook that IS a table imports through the same door with no cycle in sight: "
    + (madeTable.catalog.cards || []).length + " card(s)");

  /* THE WIZARD'S FIRST COVER READ THE FILE A SECOND TIME until this item, with its own decode
     and its own CSV parse, and on a workbook that second reading answers about a zip. One door
     for both, checked here because the cover is what a person sees before they trust the rest. */
  const { importPlan } = await import("../src/studio.mjs");
  const plan = await importPlan(path.join(SCRATCH, "plan-root"), at("period3"), {}, "");
  check(plan.encoding === "utf-8" && plan.rows === key3.cycles && plan.cols === 3,
    "5g the wizard's first cover reads the workbook through the same door the import does: "
    + plan.encoding + ", " + plan.rows + " row(s), " + plan.cols + " column(s), where the old"
    + " second reading would have called a zip windows-1252");
  check(plan.read.source === "workbook" && plan.read.shape === "periodic"
        && plan.read.periodic.period === 3
        && plan.columns.map(c => c.header).join(",") === "title,body,note"
        && String(plan.columns[0].first) === key3.cards[0].title,
    "5h and the plan carries the shape and the fork for a cover that has to say what was found"
    + " before anything is mapped, each column's verdict beside its first cell: "
    + plan.columns.map(c => c.header + " -> " + c.field).join(", "));

  /* ---- 6. the refusal that carries the reading (642) --------------------------------------- */

  /* A FILE THE IMPORTER CANNOT MAKE A PLAN FROM IS NOT A FILE NOTHING IS KNOWN ABOUT. Claudia
     drew the wizard's first cover over four kinds of file and found that the one the AI import
     exists for - a pile with no structure in it - reached no cover at all: importPlan threw, and
     the person got three unreachable steps, a sentence written for the override table, and
     Cancel. These legs hold the data half of the fix. The reading survives the refusal; it is
     the SAME reading a plan carries; and a file that is not a spreadsheet at all still says what
     was attempted. What a cover does with the two is not decided here and is not tested here. */

  let flatPlan = null, flatPlanThrew = null;
  try { flatPlan = await importPlan(path.join(SCRATCH, "plan-root"), at("flat"), {}, ""); }
  catch (e) { flatPlanThrew = e; }
  const flatThrew = await (async () => {
    try { await importCsv({ file: at("flat") }); return null; } catch (e) { return e; }
  })();
  check(!!flatPlan && !flatPlanThrew && !!flatThrew
        && flatPlan.refusal === flatThrew.message
        && !!flatPlan.said && flatPlan.said.frame === (flatThrew.said || {}).frame,
    "6a a shapeless file answers with a refusal instead of throwing, and it is the importer's"
    + " own sentence and frame rather than one written for the screen: "
    + (flatPlanThrew ? "IT THREW " + JSON.stringify(flatPlanThrew.message)
                     : JSON.stringify(String((flatPlan || {}).refusal).slice(0, 64))));

  const flatSrc = examine({ file: at("flat") });
  /* Read through a stand-in when the fork is missing, so that a refusal carrying no reading
     FAILS THIS LEG rather than throwing out of the gate and taking the rest of section 6 with
     it: a control that stops the run tells you less than one that goes red. */
  const flatFork = (flatPlan && flatPlan.read && flatPlan.read.fork)
    || { paths: [{}, { wouldSend: {} }] };
  check(!!flatPlan && flatPlan.read.source === "workbook" && flatPlan.read.shape === "column"
        && flatPlan.rows === flatSrc.table.rows.length && flatPlan.cols === 1
        && flatFork.paths[1].proposed === true
        && (flatFork.paths[1].wouldSend || {}).cells > 0
        && flatFork.paths[0].available === true,
    "6b and it carries what the reader found, which is everything a cover needs to say before"
    + " it offers the fork: " + (flatPlan ? flatPlan.read.source + ", " + flatPlan.read.shape
      + ", " + flatPlan.rows + " row(s), " + flatPlan.cols + " column(s), the model proposed"
      + " over " + ((flatFork.paths[1].wouldSend || {}).cells) + " cell(s) and the"
      + " deterministic path still there" : "NO PLAN"));

  /* THE READING'S KEYS ARE WRITTEN OUT HERE ON PURPOSE, not copied from the answer: a helper
     that took whatever `read` happened to hold would agree with it however it changed, which is
     the whole failure this leg exists to catch. `sample` joined the five on board 642. */
  const readOf = (s) => JSON.stringify({ source: s.source, shape: s.shape,
                                         periodic: s.periodic, fork: s.fork,
                                         sample: s.sample });
  check(!!flatPlan && JSON.stringify(flatPlan.read) === readOf(flatSrc)
        && JSON.stringify(plan.read) === readOf(examine({ file: at("period3") }))
        && Object.keys(flatPlan.read).join(",") === Object.keys(plan.read).join(","),
    "6c the reading a refusal carries is the reading a plan carries and not a second one written"
    + " for it: both equal a reading taken here by examine(), with the same keys in the same"
    + " order (" + (flatPlan ? Object.keys(flatPlan.read).join(", ") : "-") + ")");

  let badPlan = null, badThrew = null;
  try { badPlan = await importPlan(path.join(SCRATCH, "plan-root"), at("nosheet"), {}, ""); }
  catch (e) { badThrew = e; }
  check(!!badPlan && !badThrew && /no xl\/workbook\.xml/.test(String(badPlan.refusal))
        && badPlan.read.source === "workbook" && badPlan.read.shape === "unread"
        && badPlan.read.fork === null && badPlan.rows === 0 && badPlan.cols === 0
        && badPlan.encoding === null,
    "6d a file that is not a spreadsheet at all still says what was attempted - read as a "
    + (badPlan ? badPlan.read.source + " by its first four bytes and " + badPlan.read.shape
      : "THROW: " + (badThrew || {}).message) + " - beside the reader's own refusal, and offers"
    + " no fork at all where there is no way to import it");

  const PLAN_KEYS = "file,base,to,encoding,rows,cols,read,id,name,dir,exists,into,columns,"
    + "fields,langs,titles,report,fingerprint";
  check(Object.keys(plan).join(",") === PLAN_KEYS && plan.refusal === undefined
        && plan.said === undefined && plan.notes === undefined,
    "6e THE CONTROL: a plan that succeeds is the object it always was, the same eighteen keys"
    + " in the same order and not one of the refusal's three, so the reading being shared did"
    + " not change what a caller already reads: " + Object.keys(plan).length + " key(s)");

  /* THE CYCLE'S OWN CELLS, which is the one shape a sample has to prove somewhere: a table's
     and a pile's are held in tests/source-shape.mjs, and no cycle fixture lives there. Variant B
     draws three repeats of the person's own cells bracketed by the role each position was given,
     so what travels has to be the cells in cycle order and the count of repeats has to be the
     reader's own - a frame showing three of twelve while the reading says something else is the
     failure this catches. */
  const cyc = plan.read.sample, per = plan.read.periodic;
  /* The second reading is the workbook's own column, walked here, cut into repeats by the
     period and the skip the reading declares - so the cells are checked against the file rather
     than against the thing that produced them. */
  const cycCol = columnOf(readWorkbook(bytesOf("period3")));
  const wantRepeats = [0, 1, 2].map(k =>
    cycCol.slice(per.skip + k * per.period, per.skip + (k + 1) * per.period));
  check(!!cyc && cyc.kind === "cycle" && cyc.repeats.length === 3
        && cyc.repeats.every(r => r.length === per.period)
        && cyc.times === per.cycles
        && JSON.stringify(cyc.repeats) === JSON.stringify(wantRepeats),
    "6h and it carries three repeats of the file's own cells, " + (cyc ? cyc.repeats.length : "-")
    + " of " + (cyc ? cyc.times : "-") + " at a period of " + (per ? per.period : "-")
    + ", which is the reading's own count rather than a second one");

  check(!!flatPlan && flatSrc.notes.length > 0
        && JSON.stringify(flatPlan.notes) === JSON.stringify(flatSrc.notes)
        && examine({ file: at("period3") }).notes
             .every(n => plan.report.findings.some(f => f.what === n.what)),
    "6f the notes a refusal carries are the reader's own, which is what a plan that succeeds"
    + " already gets through its report's findings: " + (flatPlan ? flatPlan.notes.length : "-")
    + " note(s) on the shapeless file, every one of the periodic file's in the plan's report");

  check(asserted + 1 === EXPECTED, "tally " + (asserted + 1) + " equal expected " + EXPECTED);

  if (!argv.includes("--keep")) dropScratch(SCRATCH, "workbook");
  process.stdout.write("workbook-legs: " + asserted + " assertion(s), " + failed
    + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("workbook  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(1);
});
