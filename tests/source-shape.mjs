/* PROSE IS NOT A TABLE. A wall of text with commas in it used to be classified as a
 * spreadsheet because examine() took the MAX row width after a CSV split, and ordinary
 * English contains commas. The extra fields were then dropped with no note.
 *
 *     node tests/source-shape.mjs
 *
 * THE CONTROL is a real CSV whose rows agree: it must still be a table, and examine()
 * must parse it as csvTable() does. A fix that rescues prose by breaking CSV import
 * has made things worse.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { rows as csvRows, table as csvTable } from "../src/csv.mjs";
import { examine, attempt } from "../src/source.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "source-shape");
const CRLF = String.fromCharCode(13, 10);

/* 36 before board 642; the five legs of section 14 are the file's own cells travelling on
   the reading, which is what lets a cover show the file rather than assert what is in it. */
const EXPECTED = 42;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

function linesOf(text) {
  return String(text).split(/\r\n|\n|\r/).filter(l => l.trim());
}
/** The file's blocks of non-blank lines, split at blank lines: a second reading of what
 *  src/source.mjs's blocksOf reads, written here from the rule rather than imported. */
function blocksIn(text) {
  const out = [];
  let cur = [];
  String(text).split(/\r\n|\n|\r/).forEach(l => {
    if (l.trim()) cur.push(l); else if (cur.length) { out.push(cur); cur = []; }
  });
  if (cur.length) out.push(cur);
  return out;
}
function lineChars(text) {
  return linesOf(text).reduce((a, l) => a + l.length, 0);
}
function rowValueChars(table) {
  return table.rows.reduce((a, r) => a + Object.keys(r).filter(k => k !== "__row")
    .reduce((b, k) => b + String(r[k] == null ? "" : r[k]).length, 0), 0);
}
function recoveredColumn(src) {
  const h = src.table.head[0] || "";
  return [h].concat(src.table.rows.map(r => String(r[h] == null ? "" : r[h])));
}
function sameTable(a, b) {
  return JSON.stringify({ head: a.head, rows: a.rows, duplicateHeaders: a.duplicateHeaders })
    === JSON.stringify({ head: b.head, rows: b.rows, duplicateHeaders: b.duplicateHeaders });
}
function heldOf(src) {
  return rowValueChars(src.table) + src.table.head.reduce((a, h) => a + String(h).length, 0);
}
/** Non-empty body cells that csvTable would drop: under an empty name, or past the header. */
function droppedBodyChars(text) {
  const raw = csvRows(text).filter(r => r.some(v => String(v).trim()));
  if (!raw.length) return 0;
  const head = raw[0].map(h => String(h).trim());
  let lost = 0;
  for (let i = 1; i < raw.length; i++) {
    raw[i].forEach((c, j) => {
      const s = String(c == null ? "" : c);
      if (!s.trim()) return;
      if (j >= head.length || !head[j]) lost += s.length;
    });
  }
  return lost;
}
/** Body cells csvTable overwrites because a later column repeats the name. */
function overwrittenBodyChars(text) {
  const raw = csvRows(text).filter(r => r.some(v => String(v).trim()));
  if (!raw.length) return 0;
  const head = raw[0].map(h => String(h).trim());
  const lastAt = new Map();
  head.forEach((h, j) => { if (h) lastAt.set(h, j); });
  let lost = 0;
  for (let i = 1; i < raw.length; i++) {
    raw[i].forEach((c, j) => {
      const s = String(c == null ? "" : c);
      if (!s.trim()) return;
      if (j >= head.length || !head[j]) return;
      if (lastAt.get(head[j]) !== j) lost += s.length;
    });
  }
  return lost;
}
function fieldChars(text) {
  const raw = csvRows(text).filter(r => r.some(v => String(v).trim()));
  return raw.reduce((a, r) => a + r.reduce((b, c) => b + String(c == null ? "" : c).length, 0), 0);
}
/** Distinct kinds of content csvTable discards, counted from the grid, not from examine(). */
function kindLosses(text) {
  const raw = csvRows(text).filter(r => r.some(v => String(v).trim()));
  const extra = { n: 0, chars: 0 }, unnamed = { n: 0, chars: 0 }, overwritten = { n: 0, chars: 0 };
  if (!raw.length) return { extra, unnamed, overwritten };
  const head = raw[0].map(h => String(h).trim());
  const lastAt = new Map();
  head.forEach((h, j) => { if (h) lastAt.set(h, j); });
  for (let i = 1; i < raw.length; i++) {
    raw[i].forEach((c, j) => {
      const s = String(c == null ? "" : c);
      if (!s.trim()) return;
      let bucket = null;
      if (j >= head.length) bucket = extra;
      else if (!head[j]) bucket = unnamed;
      else if (lastAt.get(head[j]) !== j) bucket = overwritten;
      if (bucket) { bucket.n++; bucket.chars += s.length; }
    });
  }
  return { extra, unnamed, overwritten };
}
const LOSS_KEYS = {
  extra: "Some rows have more fields than the heading row, and fields with no heading were not imported: {FIELDS} left out, from {ROWS}.",
  unnamed: "Some fields sit under a heading with no name, so they were not imported: {FIELDS}. A name added in the file, and a second import, brings them in.",
  overwritten: "Some names appear more than once in the heading row, and of the columns sharing a name only the last was read: {NAMES} repeated, {FIELDS} left out.",
};
const NO_HEADER_KEY = "The file's rows all have the same number of fields, but the first"
  + " row gives no name to a column that holds content, so Studio read the file as one column"
  + " rather than as a table. Nothing in it was lost. Once every column that holds content"
  + " has a name in the first row, Studio reads the file as a table.";

function kindNamed(notes, kind) {
  const key = LOSS_KEYS[kind];
  if (!key) return false;
  return notes.some(n => (n.said && n.said.frame === key) || n.what === key);
}
/** Kinds of loss present in a table that no note names. A column keeps the lines. */
function hiddenKinds(text, src) {
  if (src.shape !== "table") return [];
  const k = kindLosses(text);
  return ["extra", "unnamed", "overwritten"].filter(kind => k[kind].n > 0 && !kindNamed(src.notes, kind));
}
function silentDrop(text, src) {
  if (src.shape !== "table") {
    return (lineChars(text) - heldOf(src)) > 0 && src.notes.length === 0;
  }
  const lost = droppedBodyChars(text) + overwrittenBodyChars(text);
  if (lost > 0 && src.notes.length === 0) return true;
  return hiddenKinds(text, src).length > 0;
}

/* Invented. A grounds volunteer's note, commas in ordinary English, field counts that
   do not agree: 3 lines of width 1, 5 of 2, 2 of 3, 1 of 5. */
const PROSE = [
  "Good afternoon, I hope you are well.",
  "",
  "The oak by the north gate dropped a limb last night, and it is blocking the path that the morning walkers use. I have tied a ribbon on the nearest post so nobody walks into it in the dark.",
  "",
  "If you can send two people with a saw, a barrow, and a length of rope, we can clear it before the gates open at nine. The wood is sound, so it can go on the pile behind the shed rather than into the skip.",
  "",
  "Please also look at the latch on the west door. It sticks when the air is damp, and yesterday three visitors asked me how to get out.",
  "",
  "The notice about dogs on leads has come down again. I will print another copy, but the tape on that wall never holds through a wet week.",
  "",
  "Thank you for the new hose. It reaches the beds by the pond, which the old one never did, and the seedlings have already picked up.",
  "",
  "One more thing. The kettle in the bothy is leaking from the base, so I have unplugged it. A replacement would help, because the volunteers stop for tea at eleven and at three.",
  "",
  "I will be on the bench by the rose beds until four if you want to walk the path with me.",
  "",
  "Kind regards,",
  "Marta Ellison",
  "Grounds volunteer",
].join("\n");

const ONE_COMMA = [
  "Hello there.",
  "",
  "The kettle is leaking, so I unplugged it.",
  "",
  "See you tomorrow.",
].join("\n");

const AGREEING = [
  ["id", "title_en", "body_en"],
  ["g-1", "Oak limb", "The path is blocked until the limb is cleared."],
  ["g-2", "West latch", "It sticks when the air is damp, and three visitors asked."],
  ["g-3", "Kettle leak", "Unplug the bothy kettle and replace it."],
].map(r => r.map(v => /[",]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v).join(","))
  .join(CRLF) + CRLF;

const RAGGED = [
  "id,title_en,body_en",
  "g-1,Oak limb,The path is blocked.",
  "g-2,West latch",
  "g-3,Kettle leak,Unplug it.",
].join(CRLF) + CRLF;

const EXTRA = [
  "id,title_en,body_en",
  "g-1,Oak limb,The path is blocked.",
  "g-2,West latch,It sticks,spare",
  "g-3,Kettle leak,Unplug it.",
].join(CRLF) + CRLF;

/* First line ends with a comma; every following line has one internal comma.
   Width 2 throughout, so row agreement alone calls it a table; the empty
   second header name then drops the second half of every line with no note. */
const TRAILING = [
  "Meeting Notes,",
  "The oak by the north gate dropped a limb last night, and it is blocking the path",
  "If you can send two people with a saw, we can clear it before nine",
  "Please also look at the latch on the west door, which sticks when the air is damp",
  "The notice about dogs on leads has come down again, so I will print another copy",
  "Thank you for the new hose, which reaches the beds by the pond",
  "The kettle in the bothy is leaking from the base, so I have unplugged it",
  "I will be on the bench by the rose beds until four, if you want to walk the path",
].join("\n");

const SALUTATION = [
  "Dear all,",
  "The path is blocked this morning, so please use the west gate",
  "I have tied a ribbon on the nearest post, and it should be visible",
].join("\n");

/* Same hole, not a trailing comma on line one: an empty name in the middle
   over a column that holds content. */
const MID_EMPTY = [
  "id,,body_en",
  "g-1,Oak limb,The path is blocked.",
  "g-2,West latch,It sticks when damp.",
].join(CRLF) + CRLF;

/* A trailing empty column that holds nothing. Still a table: an empty name
   over empty cells is not a missing name. */
const TRAILING_EMPTY = [
  "id,title_en,body_en,",
  "g-1,Oak limb,The path is blocked.,",
  "g-2,West latch,It sticks when damp.,",
].join(CRLF) + CRLF;

/* Real CSV, every name present, two columns both called notes. csvTable
   writes the second over the first; spare and empty-name drops are 0. */
const DUP = [
  "id,notes,notes",
  "g-1,The oak dropped a limb,Clear it before nine",
  "g-2,The west latch sticks,Three visitors asked how to get out",
].join(CRLF) + CRLF;

/* The two kinds together: a duplicate name AND a spare field. Reporting
   spare through else-if used to leave the overwrite unnamed. */
const DUP_AND_EXTRA = [
  "id,notes,notes",
  "g-1,The oak dropped a limb,Clear it before nine,spare-one",
  "g-2,The west latch sticks,Three visitors asked how to get out",
].join(CRLF) + CRLF;

/* Invented shapes for the general corpus, not named legs. */
const TRIPLE = [
  "id,notes,notes,notes",
  "g-1,first note,second note,third note",
].join(CRLF) + CRLF;
const TWO_DUP_NAMES = [
  "id,notes,notes,title,title",
  "g-1,note one,note two,title one,title two",
].join(CRLF) + CRLF;
const LAST_EMPTY_DUP = [
  "id,notes,notes",
  "g-1,The oak dropped a limb,",
  "g-2,The west latch sticks,",
].join(CRLF) + CRLF;

function main(argv) {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });

  /* THE LETTER IS READ BY ITS BLANK LINES SINCE THE SENSE PASS OF 2026-09-22 (item 2): each
     block between blank lines is one cell, so its closing three lines are one cell and the
     column has no heading, because a file of blocks has none. Every measure below is the same
     question it always was - is every line of the file on the reading, whole and in order -
     asked of cells that may now hold several lines; `joins` is the newlines a block of n lines
     gains inside its one cell, which are the file's own line breaks and not added content. */
  const prose = examine({ text: PROSE });
  const wantLines = linesOf(PROSE);
  const wantChars = lineChars(PROSE);
  const proseBlocks = blocksIn(PROSE);
  const joins = proseBlocks.reduce((a, b) => a + b.length - 1, 0);
  const model = (src) => src.fork.paths.find(p => p.name === "model");
  const proseCells = prose.table.rows.map(r => String(r[prose.table.head[0]] == null ? ""
    : r[prose.table.head[0]]));
  const recovered = [].concat(...proseCells.map(c => c.split("\n")));
  const held = rowValueChars(prose.table);

  check(prose.shape === "column",
    "1a a wall of prose with commas is a column, not a table (shape "
    + JSON.stringify(prose.shape) + ")");
  check(model(prose).proposed === true,
    "1b and the model is proposed, because no structure was found - "
    + JSON.stringify(model(prose).why).slice(0, 80));
  check(model(prose).wouldSend.characters === wantChars + joins,
    "1c wouldSend carries every non-empty line, "
    + model(prose).wouldSend.characters + " character(s) against " + wantChars
    + " counted from the file and " + joins + " line break(s) inside its blocks");
  check(recovered.length === wantLines.length
        && recovered.every((line, i) => line === wantLines[i])
        && wantLines.indexOf(prose.table.head[0]) < 0,
    "1d every non-empty line is recovered whole from the cells, "
    + recovered.length + " against " + wantLines.length + ", and the column's name "
    + JSON.stringify(prose.table.head[0]) + " is none of them"
    + (recovered[0] === wantLines[0] ? "" : ", first recovered "
      + JSON.stringify((recovered[0] || "").slice(0, 40))));
  check(prose.notes.some(n => /(do not agree|blank lines)/.test(n.what) && /dropped/.test(n.what)),
    "1e a note says how the lines were read and that nothing was dropped ("
    + prose.notes.length + " note(s))");
  check(held === wantChars + joins,
    "1f the cells hold " + held + " character(s), the non-empty lines " + wantChars
    + " and their " + joins + " inner line break(s), so the measured drop is zero");

  const one = examine({ text: ONE_COMMA });
  check(one.shape === "column",
    "2a a single comma in a single line does not make a table of a document (shape "
    + JSON.stringify(one.shape) + ")");
  check(recoveredColumn(one).some(l => l.indexOf(",") >= 0),
    "2b and that comma is still in the recovered text");

  const csv = examine({ text: AGREEING });
  const parsed = csvTable(AGREEING);
  check(csv.shape === "table",
    "3a THE CONTROL: a CSV whose rows agree is still a table (shape "
    + JSON.stringify(csv.shape) + ")");
  check(sameTable(csv.table, parsed),
    "3b and examine() parses it as csvTable() does, "
    + csv.table.rows.length + " row(s), head " + JSON.stringify(csv.table.head));
  check(model(csv).proposed === false,
    "3c the model is not proposed on a table - " + JSON.stringify(model(csv).why).slice(0, 80));

  const LEADING_BLANK = CRLF + "id,title_en,body_en" + CRLF
    + "g-1,Oak limb,The path is blocked." + CRLF
    + "g-2,West latch,It sticks." + CRLF;
  const leadBlank = examine({ text: LEADING_BLANK });
  const leadTable = csvTable(LEADING_BLANK);
  check(leadBlank.shape === "table"
        && sameTable(leadBlank.table, leadTable)
        && leadBlank.table.head.join(",") === "id,title_en,body_en"
        && leadBlank.table.rows.length === 2
        && leadBlank.notes.length === 0,
    "3d a CSV whose first line is blank keeps its header row and parses as a table (shape "
    + JSON.stringify(leadBlank.shape) + ", " + leadBlank.table.rows.length + " row(s), "
    + leadBlank.notes.length + " note(s))");

  const out = path.join(SCRATCH, "pile");
  const gen = spawnSync(process.execPath,
    ["tools/fixtures/generate.mjs", "--seed", "7", "--rows", "40", "--out", out],
    { cwd: ROOT, encoding: "utf8" });
  if (gen.status !== 0)
    throw new Error("the generator refused (" + gen.status + "): " + (gen.stderr || gen.stdout));
  const macros = fs.readFileSync(path.join(out, "macros.csv"));
  const generated = examine({ buf: macros });
  const generatedTable = csvTable(macros.toString("utf8"));
  check(generated.shape === "table",
    "4a the generator's macros.csv is a table (shape " + JSON.stringify(generated.shape)
    + ", " + generated.table.rows.length + " row(s))");
  check(sameTable(generated.table, generatedTable),
    "4b and it parses exactly as csvTable() does on the same bytes");

  const ragged = examine({ text: RAGGED });
  check(ragged.shape === "table",
    "5a a CSV with one short row is still a table, because most rows agree (shape "
    + JSON.stringify(ragged.shape) + ")");
  check(sameTable(ragged.table, csvTable(RAGGED)),
    "5b and the short row's missing cell is empty, the same parse csvTable() already did");

  const extra = examine({ text: EXTRA });
  check(extra.shape === "table",
    "6a a CSV with one extra field on one row is still a table (shape "
    + JSON.stringify(extra.shape) + ")");
  check(sameTable(extra.table, csvTable(EXTRA)),
    "6b and the extra field is not in the table, which is csvTable()'s own parse");
  check(extra.notes.some(n => /not imported/.test(n.what)),
    "6c but a note says so, rather than dropping the field in silence ("
    + extra.notes.length + " note(s))");

  const trailing = examine({ text: TRAILING });
  const trailingLines = linesOf(TRAILING);
  const trailingWant = lineChars(TRAILING);
  const trailingHeld = heldOf(trailing);
  check(trailing.shape === "column",
    "7a a first line that ends with a comma is not a header when the other"
    + " cells under that empty name have content (shape "
    + JSON.stringify(trailing.shape) + ", " + droppedBodyChars(TRAILING)
    + " character(s) csvTable would drop, " + trailing.notes.length + " note(s))");
  check(recoveredColumn(trailing).length === trailingLines.length
        && recoveredColumn(trailing).every((line, i) => line === trailingLines[i]),
    "7b every non-empty line is recovered whole, "
    + recoveredColumn(trailing).length + " against " + trailingLines.length);
  check(model(trailing).wouldSend.characters === trailingWant,
    "7c wouldSend carries every non-empty line, "
    + model(trailing).wouldSend.characters + " against " + trailingWant);
  check(trailingHeld === trailingWant
        && trailing.notes.some(n => (n.said && n.said.frame === NO_HEADER_KEY) || n.what === NO_HEADER_KEY),
    "7d header plus row values hold " + trailingHeld + " against " + trailingWant
    + ", and a note says a column had no name rather than dropping in silence ("
    + trailing.notes.length + " note(s))");

  const mid = examine({ text: MID_EMPTY });
  check(mid.shape === "column",
    "8a an empty name in the middle of a first row is the same hole, not a"
    + " trailing-comma special case (shape " + JSON.stringify(mid.shape) + ")");
  check(recoveredColumn(mid).some(l => l.indexOf("Oak limb") >= 0)
        && mid.notes.length > 0,
    "8b the unnamed column's content is kept, and a note says so");

  const trailingEmpty = examine({ text: TRAILING_EMPTY });
  check(trailingEmpty.shape === "table",
    "9a a trailing empty column that holds nothing is still a table (shape "
    + JSON.stringify(trailingEmpty.shape) + ")");
  check(sameTable(trailingEmpty.table, csvTable(TRAILING_EMPTY)),
    "9b and it parses as csvTable() does, head "
    + JSON.stringify(trailingEmpty.table.head));

  const corpus = [
    ["prose", PROSE],
    ["one-comma", ONE_COMMA],
    ["agreeing", AGREEING],
    ["ragged", RAGGED],
    ["extra", EXTRA],
    ["trailing", TRAILING],
    ["salutation", SALUTATION],
    ["mid-empty", MID_EMPTY],
    ["trailing-empty", TRAILING_EMPTY],
    ["dup", DUP],
    ["dup-and-extra", DUP_AND_EXTRA],
    ["triple", TRIPLE],
    ["two-dup-names", TWO_DUP_NAMES],
    ["last-empty-dup", LAST_EMPTY_DUP],
  ];
  const silent = corpus.filter(([_, text]) => silentDrop(text, examine({ text })));
  check(silent.length === 0,
    "10a no shape in the corpus drops content with zero notes"
    + (silent.length ? " (silent: " + silent.map(s => s[0]).join(", ") + ")" : ""));

  const dup = examine({ text: DUP });
  const dupKinds = kindLosses(DUP);
  check(dup.shape === "table",
    "11a a real CSV whose rows agree stays a table even when two columns share a name (shape "
    + JSON.stringify(dup.shape) + ")");
  check(sameTable(dup.table, csvTable(DUP)),
    "11b and examine() parses it as csvTable() does, head "
    + JSON.stringify(dup.table.head) + ", duplicateHeaders "
    + JSON.stringify(dup.table.duplicateHeaders));
  check(dupKinds.overwritten.n === 2 && dupKinds.overwritten.chars === 43
        && kindNamed(dup.notes, "overwritten"),
    "11c 2 field(s), 43 character(s) overwritten by the second notes column are named ("
    + dupKinds.overwritten.n + " field(s), " + dupKinds.overwritten.chars
    + " character(s), " + dup.notes.length + " note(s))");
  check(fieldChars(DUP) - heldOf(dup) === dupKinds.overwritten.chars,
    "11d field characters in minus characters held equal the overwrite, "
    + (fieldChars(DUP) - heldOf(dup)) + " against " + dupKinds.overwritten.chars);

  const both = examine({ text: DUP_AND_EXTRA });
  const bothKinds = kindLosses(DUP_AND_EXTRA);
  check(both.shape === "table" && sameTable(both.table, csvTable(DUP_AND_EXTRA)),
    "12a a CSV with a duplicate name and a spare field is still a table, equal to csvTable()");
  check(kindNamed(both.notes, "extra") && kindNamed(both.notes, "overwritten"),
    "12b both kinds of loss are named, rather than the spare hiding the overwrite ("
    + both.notes.length + " note(s), extra " + bothKinds.extra.n
    + ", overwritten " + bothKinds.overwritten.n + ")");
  check(both.notes.length >= 2,
    "12c two kinds produce two statements, not one (" + both.notes.length + " note(s))");

  const hidden = corpus.map(([name, text]) => [name, hiddenKinds(text, examine({ text }))])
    .filter(([_, kinds]) => kinds.length);
  check(hidden.length === 0,
    "13a no table in the corpus has a kind of loss that no note names"
    + (hidden.length ? " (hidden: " + hidden.map(([n, k]) => n + ":" + k.join("+")).join(", ")
      + ")" : ""));

  /* ---- 14. THE FILE AS IT ACTUALLY IS (642) -------------------------------------------------
   *
   * Maxim ruled variant B on 2026-09-21 12:26, for a table and for a column alike: the top of
   * the person's own file is drawn beside the reading, so the reader's guess is checkable in one
   * glance rather than trusted. That only works if what travels is the FILE'S cells and not the
   * import's, which are trimmed, mapped and renamed by the time anything downstream sees them.
   */
  const tSample = examine({ text: AGREEING }).sample;
  const tRaw = csvRows(AGREEING).filter(r => r.some(v => String(v).trim()));
  check(!!tSample && tSample.kind === "table"
    && JSON.stringify(tSample.head) === JSON.stringify(tRaw[0])
    && JSON.stringify(tSample.rows) === JSON.stringify(tRaw.slice(1, 3))
    && tSample.under === tRaw.length - 1,
    "14a a table's sample is the file's own header and next two rows, cell for cell against a"
    + " second reading of the same bytes, with " + (tSample || {}).under + " row(s) under the"
    + " header - not the import's mapped objects, which are trimmed and renamed");
  check(!!tSample && tSample.rows.every(r => Array.isArray(r))
    && !JSON.stringify(tSample).includes("__row"),
    "14b THE CONTROL: it is arrays of cells and carries no __row, so nothing on the cover can"
    + " be the importer's own reading dressed as the file");

  const pSample = examine({ text: PROSE }).sample;
  const pBlocks = blocksIn(PROSE).map(b => b.join("\n"));
  check(!!pSample && pSample.kind === "pile" && pSample.cells.length === 6
    && JSON.stringify(pSample.cells) === JSON.stringify(pBlocks.slice(0, 6))
    && pSample.cells.length + pSample.more === pBlocks.length,
    "14c a pile's sample is its first six blocks and says how many more, and the two add up to"
    + " the file: 6 + " + (pSample || {}).more + " = " + pBlocks.length);

  /* A CELL IS CUT AT 400, because a plan is made again on every change to the mapping and a
     single pasted essay in one cell would ride the wire on each of them. The control beside it
     is that the cut is PER CELL: a long cell does not shorten its neighbours. */
  const LONG = "a".repeat(900);
  const longOne = examine({ text: "id,body_en\r\ng-1," + LONG + "\r\ng-2,short\r\n" }).sample;
  check(!!longOne && longOne.rows[0][1].length === 400
    && longOne.rows[1][1] === "short" && longOne.head.join(",") === "id,body_en",
    "14d a cell is cut at 400 characters and its neighbours are not: "
    + (longOne ? longOne.rows[0][1].length : "-") + " from " + LONG.length
    + ", the next row still " + JSON.stringify((longOne || { rows: [[], []] }).rows[1][1]));

  const dead = attempt({ buf: Buffer.from([0x50, 0x4B, 0x03, 0x04, 0x00, 0x00]) });
  check(dead.src.sample === null && dead.src.fork === null,
    "14e a file that could not be read has no sample at all, for the reason it has no fork:"
    + " an absence drawn as an empty file is a claim about somebody's content");

  check(asserted + 1 === EXPECTED, "tally " + (asserted + 1) + " equal expected " + EXPECTED);

  if (!argv.includes("--keep")) dropScratch(SCRATCH, "source-shape");
  process.stdout.write("source-shape: " + asserted + " assertion(s), " + failed
    + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2));
