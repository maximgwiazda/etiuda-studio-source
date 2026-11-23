/* WORKBOOKS THAT ARE NOBODY'S, AND THE ANSWER KEY BESIDE EACH. Board 641.
 *
 *     node tools/fixtures/workbook.mjs --seed 11 [--out <dir>] [--only <name>]
 *
 * A real export is customer content from its first byte, so the workbook reader is tested
 * against files made here. Writing a minimal .xlsx is the same zip and the same XML the reader
 * takes apart, in reverse, which is the one thing worth saying about the method: the writer is
 * not the reader run backwards - it is written from the format's own shape, so a mistake the
 * reader makes about, say, a shared string's index would have to be made twice and in opposite
 * directions to pass.
 *
 * DETERMINISTIC BY CONSTRUCTION. One seed, one set of files. The zip's timestamps are a fixed
 * constant rather than the clock, because a timestamp is the usual way a "deterministic"
 * generator stops being one. The compressed bytes depend on the zlib the desk has, so what is
 * promised is the same CONTENT rather than the same bytes, and no test here hashes a fixture.
 *
 * WHAT IS IN EACH BOOK, and the `.key.json` beside it says the same thing in numbers:
 *
 *   period3    one column, a cycle of three - a slug, a long body, a line identical in every
 *              cycle - with every cycle complete.
 *   ragged     the same cycle, with the last one short by one row, which is what an export
 *              that ended where the content ended looks like.
 *   heading    the same cycle again behind one leading row that belongs to no cycle.
 *   period4    a cycle of four: a slug, a short title, a long body, a constant footer.
 *   table      a genuine table with a header row and four columns, which must NOT be read as
 *              a periodic column.
 *   flat       one column of thirty similar lines and no cycle at all, which must be reported
 *              as no period rather than guessed at.
 *   oddities   one of everything the reader flags rather than converts: a formula with a
 *              cached value and one without, a date by built-in format and one by a custom
 *              code, an inline string, a rich string in two runs, a boolean, an error, a
 *              merged region, a hidden row, a second sheet, a stored entry, XML entities, and
 *              content that starts away from A1.
 *   notazip    a text file with a workbook's name on it.
 *   nosheet    a valid zip with no workbook part in it.
 *   zip64      a valid workbook whose end record carries the zip64 sentinel.
 *   method     a valid workbook with an impossible compression method on one entry.
 *
 * The four last are refusals, and each is here because a refusal nobody has ever seen fire is
 * a sentence rather than a behaviour.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { rng, hookToday } from "./generate.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");

/* ---- an invented vocabulary, and not the one generate.mjs uses -------------------------------- */

const SYL_A = ["quen", "ralm", "bisto", "hurn", "velk", "tarq", "onsi", "drev", "lupa", "esk",
               "morv", "chad", "yrin", "polv", "tesk", "narb", "gilo", "urth", "sabo", "flen"];
const SYL_B = ["ar", "ide", "oss", "unt", "eli", "orne", "ax", "uvi", "emp", "isk",
               "ola", "ern", "uth", "ima", "ols", "eve", "arn", "ino", "esh", "ubo"];

const pick = (r, list) => list[Math.floor(r() * list.length)];
const word = (r) => pick(r, SYL_A) + pick(r, SYL_B);
function words(r, n) { const w = []; for (let i = 0; i < n; i++) w.push(word(r)); return w.join(" "); }
function phrase(r, n) { return words(r, n).replace(/^./, c => c.toUpperCase()); }
function prose(r, sentences) {
  const out = [];
  for (let i = 0; i < sentences; i++) out.push(phrase(r, 6 + Math.floor(r() * 8)) + ".");
  return out.join(" ");
}
function slug(r) { return word(r) + "_" + word(r); }

/* ---- CRC32 and the zip ------------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

/* 2020-01-01 00:00:00 in the DOS pair, so the same seed writes the same file next year. */
const DOS_TIME = 0;
const DOS_DATE = ((2020 - 1980) << 9) | (1 << 5) | 1;

/** A zip of the given parts. `stored` names the entries to leave uncompressed, `method` forces
 *  an impossible method on one entry, `zip64` forges the sentinel in the end record: the last
 *  two are for the refusals and are never set for a book meant to be read. */
function zip(parts, opts) {
  const o = opts || {};
  const chunks = [];
  const central = [];
  let offset = 0;
  parts.forEach(p => {
    const name = Buffer.from(p.name, "utf8");
    const data = Buffer.from(p.data, "utf8");
    const stored = (o.stored || []).includes(p.name);
    const body = stored ? data : zlib.deflateRawSync(data);
    const method = p.name === o.badMethodOn ? 12 : (stored ? 0 : 8);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc32(data), 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    chunks.push(local, name, body);
    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(method, 10);
    cd.writeUInt16LE(DOS_TIME, 12);
    cd.writeUInt16LE(DOS_DATE, 14);
    cd.writeUInt32LE(crc32(data), 16);
    cd.writeUInt32LE(body.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(name.length, 28);
    cd.writeUInt32LE(offset, 42);
    central.push(Buffer.concat([cd, name]));
    offset += local.length + name.length + body.length;
  });
  const cdBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(o.zip64 ? 0xFFFF : parts.length, 8);
  end.writeUInt16LE(o.zip64 ? 0xFFFF : parts.length, 10);
  end.writeUInt32LE(cdBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([Buffer.concat(chunks), cdBuf, end, Buffer.alloc(0)]);
}

/* ---- the XML a workbook is made of ------------------------------------------------------------ */

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function contentTypes(sheets) {
  const over = sheets.map((s, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1)
    + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join("");
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
    + over
    + '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>'
    + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
    + '</Types>';
}

const ROOT_RELS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
  + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
  + '</Relationships>';

function bookXml(sheets) {
  const tabs = sheets.map((s, i) => '<sheet name="' + esc(s.name) + '" sheetId="' + (i + 1)
    + '" r:id="rId' + (i + 1) + '"' + (s.hidden ? ' state="hidden"' : "") + '/>').join("");
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
    + ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
    + '<sheets>' + tabs + '</sheets></workbook>';
}

function bookRels(sheets) {
  const rels = sheets.map((s, i) => '<Relationship Id="rId' + (i + 1)
    + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"'
    + ' Target="worksheets/sheet' + (i + 1) + '.xml"/>').join("");
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + rels
    + '<Relationship Id="rId90" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>'
    + '<Relationship Id="rId91" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
    + '</Relationships>';
}

/* Style 0 general, 1 a built-in date, 2 a custom date code, 3 a thousands number that is not
   a date however much it looks like a format. */
const STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
  + '<numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy\\-mm\\-dd\\ hh:mm"/></numFmts>'
  + '<cellXfs count="4">'
  + '<xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>'
  + '<xf numFmtId="14" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/>'
  + '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/>'
  + '<xf numFmtId="3" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/>'
  + '</cellXfs></styleSheet>';

function sharedStringsXml(list) {
  const items = list.map(s => (typeof s === "string"
    ? '<si><t xml:space="preserve">' + esc(s) + '</t></si>'
    : '<si>' + s.runs.map(r => '<r><t xml:space="preserve">' + esc(r) + '</t></r>').join("")
      + '</si>')).join("");
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="'
    + list.length + '" uniqueCount="' + list.length + '">' + items + '</sst>';
}

/** A sheet from rows of cell descriptions. Each cell is `{ ref, s?, ...one of: si, n, inline,
 *  b, e, f+v }`, which is the file's own vocabulary rather than a friendlier one, so that
 *  what a leg asserts about a kind is what the file actually said. */
function sheetXml(rows, opts) {
  const o = opts || {};
  const body = rows.map(r => {
    const cells = r.cells.map(c => {
      const s = c.s == null ? "" : ' s="' + c.s + '"';
      if (c.si != null) return '<c r="' + c.ref + '" t="s"' + s + '><v>' + c.si + '</v></c>';
      if (c.inline != null) return '<c r="' + c.ref + '" t="inlineStr"' + s
        + '><is><t xml:space="preserve">' + esc(c.inline) + '</t></is></c>';
      if (c.b != null) return '<c r="' + c.ref + '" t="b"' + s + '><v>' + c.b + '</v></c>';
      if (c.e != null) return '<c r="' + c.ref + '" t="e"' + s + '><v>' + esc(c.e) + '</v></c>';
      if (c.fstr != null) return '<c r="' + c.ref + '" t="str"' + s + '><f>' + esc(c.f)
        + '</f><v>' + esc(c.fstr) + '</v></c>';
      if (c.f != null && c.n == null) return '<c r="' + c.ref + '"' + s + '><f>' + esc(c.f)
        + '</f></c>';
      if (c.f != null) return '<c r="' + c.ref + '"' + s + '><f>' + esc(c.f) + '</f><v>'
        + c.n + '</v></c>';
      if (c.n != null) return '<c r="' + c.ref + '"' + s + '><v>' + c.n + '</v></c>';
      return '<c r="' + c.ref + '"' + s + '/>';
    }).join("");
    return '<row r="' + r.r + '"' + (r.hidden ? ' hidden="1"' : "") + '>' + cells + '</row>';
  }).join("");
  const merges = (o.merges || []).length
    ? '<mergeCells count="' + o.merges.length + '">'
      + o.merges.map(m => '<mergeCell ref="' + m + '"/>').join("") + '</mergeCells>'
    : "";
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
    + '<sheetData>' + body + '</sheetData>' + merges + '</worksheet>';
}

/** A whole book: sheets, each `{ name, hidden?, rows, merges? }`, and one shared string table
 *  shared by all of them, which is what a spreadsheet writes. */
function book(sheets, strings, opts) {
  const parts = [
    { name: "[Content_Types].xml", data: contentTypes(sheets) },
    { name: "_rels/.rels", data: ROOT_RELS },
    { name: "xl/workbook.xml", data: bookXml(sheets) },
    { name: "xl/_rels/workbook.xml.rels", data: bookRels(sheets) },
    { name: "xl/styles.xml", data: (opts && opts.styles) || STYLES },
    { name: "xl/sharedStrings.xml", data: sharedStringsXml(strings) },
  ].concat(sheets.map((s, i) => ({ name: "xl/worksheets/sheet" + (i + 1) + ".xml",
                                   data: sheetXml(s.rows, { merges: s.merges }) })));
  return zip(parts, opts);
}

/** One column of values down A, as shared strings, one per row. */
function oneColumn(values) {
  const strings = [];
  const index = new Map();
  const rows = values.map((v, i) => {
    if (!index.has(v)) { index.set(v, strings.length); strings.push(v); }
    return { r: i + 1, cells: [{ ref: "A" + (i + 1), si: index.get(v) }] };
  });
  return { rows, strings };
}

/* ---- the books -------------------------------------------------------------------------------- */

function periodicBook(r, cycles, period, opts) {
  const o = opts || {};
  const constant = "Available " + words(r, 2) + ".";
  const cards = [];
  for (let i = 0; i < cycles; i++) {
    cards.push({ slug: slug(r), title: phrase(r, 3), body: prose(r, 3 + Math.floor(r() * 3)),
                 note: constant });
  }
  const values = [];
  if (o.heading) values.push(phrase(r, 5));
  cards.forEach((c, i) => {
    const last = i === cards.length - 1;
    const cell = period === 4 ? [c.slug, c.title, c.body, c.note] : [c.slug, c.body, c.note];
    const take = last && o.ragged ? cell.length - 1 : cell.length;
    for (let j = 0; j < take; j++) values.push(cell[j]);
    if (last && o.ragged) c.note = "";
  });
  const col = oneColumn(values);
  const roles = period === 4 ? ["id", "title", "body", "note"] : ["title", "body", "note"];
  return {
    bytes: book([{ name: "Sheet1", rows: col.rows }], col.strings),
    key: {
      kind: "periodic", rows: values.length, period, skip: o.heading ? 1 : 0,
      ragged: !!o.ragged, cycles, roles,
      cards: cards.map(c => (period === 4
        ? { id: c.slug, title: c.title, body: c.body, note: c.note }
        : { title: c.slug, body: c.body, note: c.note })),
    },
  };
}

function tableBook(r, rowCount) {
  const heads = ["id", "title", "body", "note"];
  const cards = [];
  for (let i = 0; i < rowCount; i++)
    cards.push({ id: slug(r), title: phrase(r, 3), body: prose(r, 2), note: phrase(r, 4) });
  const strings = [];
  const index = new Map();
  const si = (v) => { if (!index.has(v)) { index.set(v, strings.length); strings.push(v); }
                      return index.get(v); };
  const letters = ["A", "B", "C", "D"];
  const rows = [{ r: 1, cells: heads.map((h, j) => ({ ref: letters[j] + "1", si: si(h) })) }];
  cards.forEach((c, i) => rows.push({ r: i + 2, cells: heads.map((h, j) =>
    ({ ref: letters[j] + (i + 2), si: si(c[h]) })) }));
  return {
    bytes: book([{ name: "Sheet1", rows }], strings),
    key: { kind: "table", rows: rowCount + 1, columns: 4, head: heads, cards },
  };
}

function flatBook(r, rowCount) {
  const values = [];
  for (let i = 0; i < rowCount; i++) values.push(phrase(r, 4 + Math.floor(r() * 2)));
  const col = oneColumn(values);
  return {
    bytes: book([{ name: "Sheet1", rows: col.rows }], col.strings),
    key: { kind: "flat", rows: rowCount },
  };
}

/** Everything the reader flags rather than converts, one of each, at a known address. */
function odditiesBook(r) {
  const strings = ["plain string", { runs: ["bold ", "and ", "plain"] },
                   "  kept  spaces  ", "a & b < c > d \"quoted\""];
  const rows = [
    { r: 5, cells: [{ ref: "C5", si: 0 }, { ref: "D5", si: 1 }, { ref: "E5", si: 2 }] },
    { r: 6, cells: [{ ref: "C6", si: 3 }, { ref: "D6", inline: "inline text" },
                    { ref: "E6", n: "42" }] },
    { r: 7, cells: [{ ref: "C7", n: "45000", s: 1 }, { ref: "D7", n: "45000.5", s: 2 },
                    { ref: "E7", n: "1234567", s: 3 }] },
    { r: 8, cells: [{ ref: "C8", f: "SUM(E6:E7)", n: "1234609" },
                    { ref: "D8", fstr: "computed text", f: 'CONCATENATE("computed"," text")' },
                    { ref: "E8", f: "TODAY()" }] },
    { r: 9, cells: [{ ref: "C9", b: "1" }, { ref: "D9", b: "0" }, { ref: "E9", e: "#REF!" }] },
    { r: 10, hidden: true, cells: [{ ref: "C10", si: 0 }] },
    { r: 11, cells: [{ ref: "C11", si: 0 }] },
  ];
  const second = { name: "Notes", hidden: true, rows: [{ r: 1, cells: [{ ref: "A1", si: 0 }] }] };
  return {
    bytes: book([{ name: "Odd", rows, merges: ["C11:D11"] }, second], strings,
                { stored: ["xl/sharedStrings.xml"] }),
    key: {
      kind: "oddities",
      cells: {
        C5: { kind: "text", value: "plain string" },
        D5: { kind: "text", value: "bold and plain" },
        E5: { kind: "text", value: "  kept  spaces  " },
        C6: { kind: "text", value: 'a & b < c > d "quoted"' },
        D6: { kind: "text", value: "inline text" },
        E6: { kind: "number", value: "42" },
        C7: { kind: "number", value: "45000", dateFormat: "builtin 14" },
        D7: { kind: "number", value: "45000.5", dateFormat: "yyyy\\-mm\\-dd\\ hh:mm" },
        E7: { kind: "number", value: "1,234,567" },
        C8: { kind: "number", value: "1234609", formula: true },
        D8: { kind: "text", value: "computed text", formula: true },
        C9: { kind: "boolean", value: "TRUE" },
        D9: { kind: "boolean", value: "FALSE" },
        E9: { kind: "error", value: "#REF!" },
      },
      empty: ["E8", "D11"],
      notes: { "date-not-converted": 2, "formula-without-value": 1, "error-value": 1,
               "number-shown": 1 },
      merges: ["C11:D11"], hiddenRows: 1, sheets: 2, hiddenSheets: 1,
      trimmed: { rows: 7, columns: 3, top: 4, left: 2 },
    },
  };
}

function nosheetBook() {
  return zip([{ name: "[Content_Types].xml", data: contentTypes([]) },
              { name: "_rels/.rels", data: ROOT_RELS }]);
}

/* ---- writing them out -------------------------------------------------------------------------- */

const BOOKS = ["period3", "ragged", "heading", "period4", "table", "flat", "oddities",
               "notazip", "nosheet", "zip64", "method"];

function make(name, seed) {
  const r = rng(seed);
  if (name === "period3") return periodicBook(r, 12, 3, {});
  if (name === "ragged") return periodicBook(r, 12, 3, { ragged: true });
  if (name === "heading") return periodicBook(r, 12, 3, { heading: true });
  if (name === "period4") return periodicBook(r, 10, 4, {});
  if (name === "table") return tableBook(r, 12);
  if (name === "flat") return flatBook(r, 30);
  if (name === "oddities") return odditiesBook(r);
  if (name === "notazip")
    return { bytes: Buffer.from("id,title\n1,not a workbook at all\n", "utf8"),
             key: { kind: "refusal", why: "not a zip" } };
  if (name === "nosheet") return { bytes: nosheetBook(), key: { kind: "refusal", why: "no workbook part" } };
  if (name === "zip64") {
    const col = oneColumn(["one", "two", "three"]);
    return { bytes: book([{ name: "Sheet1", rows: col.rows }], col.strings, { zip64: true }),
             key: { kind: "refusal", why: "zip64 sentinel" } };
  }
  if (name === "method") {
    const col = oneColumn(["one", "two", "three"]);
    return { bytes: book([{ name: "Sheet1", rows: col.rows }], col.strings,
                         { badMethodOn: "xl/sharedStrings.xml" }),
             key: { kind: "refusal", why: "compression method 12" } };
  }
  throw new Error("no book called " + name);
}

/** The content scan over every text file written, the same rule generate.mjs follows: a
 *  fixture is output, and output that fails the scan must not be left on disk. The workbooks
 *  are zips, so what is scanned is the key beside each, where every invented word also sits. */
function scan(dir, files) {
  const hook = path.join(ROOT, "tools", "pre-commit");
  if (!fs.existsSync(hook)) return { ran: false, why: "no tools/pre-commit at " + hook };
  const today = hookToday(process.env);   /* the hook's own date, not UTC: see generate.mjs */
  const bad = [];
  files.forEach(name => {
    const res = spawnSync("sh", [hook, path.join(dir, name)], { encoding: "utf8", cwd: ROOT,
      env: Object.assign({}, process.env, { ETIUDA_SCAN_OFF: today }) });
    if (res.status !== 0) bad.push(name + ": " + String(res.stdout || res.stderr || "").trim());
  });
  return { ran: true, files: files.length, bad };
}

function write(dir, seed, only) {
  fs.mkdirSync(dir, { recursive: true });
  const written = [];
  const keys = [];
  BOOKS.filter(b => !only || b === only).forEach((name, i) => {
    const made = make(name, seed + i * 101);
    fs.writeFileSync(path.join(dir, name + ".xlsx"), made.bytes);
    fs.writeFileSync(path.join(dir, name + ".key.json"),
                     JSON.stringify(made.key, null, 1) + "\n", "utf8");
    written.push(name + ".xlsx");
    keys.push(name + ".key.json");
  });
  const scanned = scan(dir, keys);
  return { dir, written, keys, scanned };
}

function main(argv) {
  let seed = 11, out = path.join(ROOT, "scratch", "workbooks"), only = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--seed") seed = parseInt(argv[++i], 10);
    else if (argv[i] === "--out") out = path.resolve(argv[++i]);
    else if (argv[i] === "--only") only = argv[++i];
    else { process.stderr.write("workbook fixtures: no flag " + argv[i] + "\n"); process.exit(2); }
  }
  const r = write(out, seed, only);
  if (r.scanned.ran && r.scanned.bad.length) {
    process.stderr.write("workbook fixtures: the content scan refused "
      + r.scanned.bad.join("; ") + "\n");
    process.exit(2);
  }
  process.stdout.write("workbook fixtures  " + r.written.length + " book(s) into " + out
    + (r.scanned.ran ? ", scan clean" : ", scan not run: " + r.scanned.why) + "\n");
}

export { write, make, BOOKS, book, zip, oneColumn, sheetXml, sharedStringsXml, crc32 };

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]))
  main(process.argv.slice(2));
