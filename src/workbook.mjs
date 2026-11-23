/* A WORKBOOK READER WITH NO DEPENDENCY. Board 641.
 *
 *     import { readWorkbook, sheetGrid, workbookTable } from "./src/workbook.mjs";
 *     const wb = readWorkbook(fs.readFileSync(file));   // { sheets, notes, refuses }
 *
 * Studio ships no dependency and must keep shipping none (CLAUDE.md, "nothing here sends
 * anything" and the packaging rule beside it), so a workbook is opened by what node already
 * has: a .xlsx is a zip, zlib inflates raw deflate, and the two entries that carry the content
 * are the shared string table and the sheet. Nothing else here is clever - values and their
 * addresses are the whole of what an importer wants.
 *
 * WHAT IT REFUSES, AND WHY EACH REFUSAL IS BETTER THAN A GUESS. A reader that quietly
 * mishandles a formula or a date is worse than one that says it cannot, because the mishandling
 * reaches a customer's card and the refusal reaches a screen. So:
 *
 *   not a zip            A legacy .xls is an OLE2 compound file and a different program
 *                        altogether; Numbers and ODS are other formats again. Named, refused.
 *   encrypted           A password-protected workbook is one EncryptedPackage stream. Refused
 *                        by name rather than read as a corrupt zip.
 *   zip64                The 4 GB fields are the sentinel 0xFFFFFFFF and the real sizes live in
 *                        an extra field this reader does not parse. Refused; no workbook of
 *                        canned replies is that large, and half-reading one would be silent.
 *   a compression method No .xlsx writer uses anything but stored and deflate. Anything else is
 *   other than 0 or 8    named and refused rather than inflated hopefully.
 *   unclosed markup      A row, a cell, a shared string, its text or a phonetic guide with no
 *                        closer is refused at the first miss, in one forward pass. Searching
 *                        again from the next character is what let a few megabytes hang.
 *   too many cells       A part holding more cells than this reader will build is refused
 *                        before those cells exist. The unpack ceiling counts bytes; this
 *                        counts cells.
 *
 * And what it reads but hands on UNCONVERTED, each flagged on the cell and counted in `notes`:
 *
 *   a formula            The cached value written beside it is handed on and `formula` is set.
 *                        Nothing is evaluated: a spreadsheet's function library is a program,
 *                        and a cached value is what the person who saved the file last saw. A
 *                        formula with no cached value is an empty cell that says so.
 *   a date               A date in a workbook is a number plus a format, and the epoch is one
 *                        of two (1900 with a leap-year bug it keeps on purpose, or 1904). The
 *                        serial is handed on as its own digits with the format code beside it,
 *                        so a caller that wants a date converts it knowing which epoch the
 *                        workbook declared. `dateFormat` on the cell, `date1904` on the book.
 *   a merged region      The value sits in the top-left cell and the rest of the region is
 *                        genuinely empty in the file. They are left empty and the regions are
 *                        listed, because filling them would invent rows.
 *   a boolean, an error  Handed on as TRUE/FALSE and as the error text (#REF! and the rest).
 *
 * A number format other than a date is the text the sheet shows, and that text is what lands.
 * The note names the cell and both values. A percent, a thousands separator, leading zeros and
 * a currency mark are drawn here. The built-in currency ids are the en-US dollar codes, and the
 * grouping mark is a comma and the decimal mark a point: those ids follow the desk's locale in
 * Excel and the file does not say which. A fraction, a scientific form, or a code with a
 * question mark keeps the stored digits and says so.
 *
 * And what it does not look at at all, listed per sheet so that nobody has to wonder: drawings
 * and the floating images in them, charts, comments, pivot tables, defined names, conditional
 * formats, data validation and every other part of the package. A picture on a sheet is not
 * content an importer can map, but silence about one is how a person concludes the reader broke.
 */
import zlib from "node:zlib";
import { refuse } from "./refusal.mjs";

const EOCD_SIG = 0x06054b50;
const CD_SIG = 0x02014b50;
const LOCAL_SIG = 0x04034b50;

/* ---- the zip half ------------------------------------------------------------------------ */

/** The end-of-central-directory record, scanned for from the tail. The comment field is up to
 *  65535 bytes, so the record can sit that far from the end and no further. */
function endRecord(buf) {
  const floor = Math.max(0, buf.length - (22 + 0xFFFF));
  for (let i = buf.length - 22; i >= floor; i--) {
    if (buf.readUInt32LE(i) === EOCD_SIG) return i;
  }
  return -1;
}

/** Every entry's name, method, sizes and local header offset, from the central directory.
 *  The central directory is used rather than the local headers because a local header may
 *  carry zeroes and a data descriptor after the data, and the directory never does. */
function zipEntries(buf) {
  /* THE OLE2 SIGNATURE IS TWO FILES AT ONCE and the difference cannot be told from these bytes:
     an old .xls is a compound file, and so is a password-protected .xlsx, whose one stream is
     the encrypted package. One sentence covers both, and it names the remedy they share. */
  if (buf.length >= 8 && buf.readUInt32LE(0) === 0xE011CFD0)
    throw refuse("this file is an old .xls workbook or a password-protected one, which are both"
      + " a different format from .xlsx; open it, save a copy as .xlsx without a password, and"
      + " import that", {});
  const end = endRecord(buf);
  if (end < 0 || buf.readUInt32LE(0) !== LOCAL_SIG)
    throw refuse("this file is not a workbook: a .xlsx is a zip and this does not begin like"
      + " one", {});
  const count = buf.readUInt16LE(end + 10);
  const cdSize = buf.readUInt32LE(end + 12);
  const cdOff = buf.readUInt32LE(end + 16);
  if (count === 0xFFFF || cdSize === 0xFFFFFFFF || cdOff === 0xFFFFFFFF)
    throw refuse("this workbook is in the zip64 format, which this reader does not read", {});
  const out = new Map();
  let p = cdOff;
  for (let i = 0; i < count; i++) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== CD_SIG)
      throw refuse("this workbook's directory is damaged and it cannot be opened", {});
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const usize = buf.readUInt32LE(p + 24);
    const nlen = buf.readUInt16LE(p + 28);
    const elen = buf.readUInt16LE(p + 30);
    const clen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nlen);
    if (csize === 0xFFFFFFFF || usize === 0xFFFFFFFF || local === 0xFFFFFFFF)
      throw refuse("this workbook is in the zip64 format, which this reader does not read", {});
    out.set(name, { name, method, csize, usize, local });
    p += 46 + nlen + elen + clen;
  }
  return out;
}

/* A WORKBOOK IS UNPACKED ONLY UP TO A CEILING, asked of the directory before a byte is inflated
   and held against the bytes while they are (sense pass 3, item 32): a zip of a hundred kilobytes
   can unpack to gigabytes, and its directory can say anything. No pile of cards comes near it. */
const UNPACKED_MAX = 64 * 1024 * 1024;
const tooBig = () => refuse("this workbook unpacks to more than {MB} MB, which this reader does"
  + " not read", { MB: String(UNPACKED_MAX / 1048576) });

/** One entry's bytes. Stored and deflate only; the length is the directory's, so a data
 *  descriptor after the data is never read as content. `room` is what the ceiling has left. */
function entryBytes(buf, e, room) {
  const left = room == null ? UNPACKED_MAX : room;
  if (e.usize > left) throw tooBig();
  if (buf.readUInt32LE(e.local) !== LOCAL_SIG)
    throw refuse("this workbook's entry {NAME} is damaged and it cannot be opened",
      { NAME: e.name });
  const nlen = buf.readUInt16LE(e.local + 26);
  const elen = buf.readUInt16LE(e.local + 28);
  const at = e.local + 30 + nlen + elen;
  const raw = buf.subarray(at, at + e.csize);
  if (e.method === 0) return raw;
  if (e.method === 8) {
    try { return zlib.inflateRawSync(raw, { maxOutputLength: Math.max(1, left) }); }
    catch (x) { if (x && x.code === "ERR_BUFFER_TOO_LARGE") throw tooBig(); throw x; }
  }
  throw refuse("this workbook's entry {NAME} is packed by a method this reader does not read"
    + " (method {METHOD})", { NAME: e.name, METHOD: String(e.method) });
}

/* ---- the XML half ------------------------------------------------------------------------ */

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

/** The five named entities and both numeric forms, and nothing else: these documents are
 *  written by spreadsheets, which declare no entity of their own. */
function unescapeXml(s) {
  if (s.indexOf("&") < 0) return s;
  return s.replace(/&(#x?[0-9A-Fa-f]+|[a-z]+);/g, (whole, body) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X"
        ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      /* One line, so a plant can put fromCodePoint back. A surrogate is inside the Unicode
         range and is not a character. Read as the replacement character, so the rest of the
         sheet is still read. A code point past Unicode stays the reference the file wrote. */
      if (code >= 0xD800 && code <= 0xDFFF) return "\uFFFD"; /* plant:surrogate */
      return code >= 0 && code <= 0x10FFFF ? String.fromCodePoint(code) : whole;
    }
    return Object.prototype.hasOwnProperty.call(ENTITIES, body) ? ENTITIES[body] : whole;
  });
}

function attrs(text) {
  const out = {};
  const re = /([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(text))) out[m[1]] = unescapeXml(m[2]);
  return out;
}

/* A MISSING CLOSER IS REFUSED ONCE. A lazy match that fails tries again from the next
   character, and a few megabytes of unclosed <row>, <c> or <si> under the unpack ceiling
   never returns. indexOf of the closer is one forward pass; a miss throws and does not
   resume. The same pass counts cells, so one part cannot ask for more than the grid will
   build. Shared-string entries use that same budget: a table is one part. */
const MARKUP_OPEN = "this workbook has an unclosed {TAG}, so it was not read; save the workbook"
  + " again from the spreadsheet and import that copy";
const TOO_MANY = "this workbook has more than {BUDGET} cells in one part, which this reader"
  + " does not read; split it and import the parts";

/** From the '<' of a tag: its end, the bytes between the brackets, and where to resume.
 *  A slash tight against the '>' is an empty element. No closer means the entry is refused. */
function afterOpen(xml, at, name) {
  const gt = xml.indexOf(">", at);
  if (gt < 0) throw refuse(MARKUP_OPEN, { TAG: name });
  if (xml[gt - 1] === "/") return { gt, inner: "", next: gt + 1 };
  const close = "</" + name + ">";
  const end = xml.indexOf(close, gt + 1);
  /* One line, so a plant can lift the refusal. The lifted line reads end, gt and xml. */
  if (end < 0) throw refuse(MARKUP_OPEN, { TAG: name }); /* plant:markup-close */
  return { gt, inner: xml.slice(gt + 1, end), next: end + close.length };
}

/** True when the characters after a tag name start that tag, or the name is cut off at the
 *  end. A longer name (<cols, <rowFoo) is a different tag and is not this one. */
function tagHere(xml, at, openLen) {
  if (at + openLen >= xml.length) return true;
  const b = xml[at + openLen];
  return b === ">" || b === "/" || b === " " || b === "\t" || b === "\n" || b === "\r";
}

/** Each element of this name, in order. The first argument of onEach is the opening tag's
 *  attributes, the second is its inner markup. A self-closing tag has an empty inner. */
function scanTags(xml, name, onEach) {
  const open = "<" + name;
  let i = 0;
  while (i < xml.length) {
    const at = xml.indexOf(open, i);
    if (at < 0) return;
    if (!tagHere(xml, at, open.length)) { i = at + open.length; continue; }
    const span = afterOpen(xml, at, name);
    const slash = xml[span.gt - 1] === "/" ? 1 : 0;
    onEach(xml.slice(at + open.length, span.gt - slash), span.inner);
    i = span.next;
  }
}

/** The fragment with every element of this name removed, closer and all. An unclosed one is
 *  the same refusal as any other missing closer, which is what keeps a phonetic guide from
 *  hanging the read of the text it sits beside. */
function dropElement(xml, name) {
  const open = "<" + name;
  let out = "";
  let i = 0;
  while (i < xml.length) {
    const at = xml.indexOf(open, i);
    if (at < 0) return out + xml.slice(i);
    if (!tagHere(xml, at, open.length)) {
      out += xml.slice(i, at + open.length);
      i = at + open.length;
      continue;
    }
    out += xml.slice(i, at);
    i = afterOpen(xml, at, name).next;
  }
  return out;
}

/** Every <t> under the given fragment, joined. A shared string may be one <t> or a run of
 *  them under <r> elements, which is how a spreadsheet stores a string with a bold word in
 *  it; the runs are one string and the formatting is not content. The phonetic guide <rPh>
 *  carries a Japanese reading of the same text and would otherwise be concatenated twice. */
function textOf(fragment) {
  const xml = dropElement(String(fragment), "rPh");
  let out = "";
  scanTags(xml, "t", (_attr, inner) => { out += unescapeXml(inner); });
  return out;
}

/** The shared string table, in index order. */
function sharedStrings(xml) {
  const out = [];
  scanTags(String(xml), "si", (_attr, inner) => {
    if (out.length >= CELL_BUDGET) throw refuse(TOO_MANY, { BUDGET: String(CELL_BUDGET) });
    out.push(textOf(inner));
  });
  return out;
}

/* ---- addresses --------------------------------------------------------------------------- */

/** "AA" is 27. Base 26 with no zero, which is why this is not parseInt of anything. */
function colNumber(letters) {
  let n = 0;
  for (let i = 0; i < letters.length; i++) n = n * 26 + (letters.charCodeAt(i) - 64);
  return n;
}

function colLetters(n) {
  let s = "";
  let x = n;
  while (x > 0) { const r = (x - 1) % 26; s = String.fromCharCode(65 + r) + s; x = (x - 1 - r) / 26; }
  return s;
}

/** "B12" into { col: 2, row: 12 }, null for anything else. */
function parseRef(ref) {
  const m = /^([A-Z]+)([0-9]+)$/.exec(String(ref || "").toUpperCase());
  return m ? { col: colNumber(m[1]), row: parseInt(m[2], 10) } : null;
}

/* ---- number formats, which is the whole of what this reader knows about dates ------------- */

/* The built-in format ids a spreadsheet uses for a date or a time. They are not written into
   the file: 14 is the short date on every desk, whatever the desk's locale renders it as. */
const BUILTIN_DATE_IDS = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 30, 36, 45, 46, 47,
                                  50, 57, 58]);

/* The number codes ECMA-376 gives these ids in en-US. Ids 5 to 8 are currency and follow the
 * desk's locale in Excel; the dollar forms here are a stated guess, as are ids 41 to 44.
 * A date id is absent on purpose: a date stays the serial the file stored. */
const BUILTIN_NUMBER_CODES = {
  1: "0",
  2: "0.00",
  3: "#,##0",
  4: "#,##0.00",
  5: '"$"#,##0_);("$"#,##0)',
  6: '"$"#,##0_);[Red]("$"#,##0)',
  7: '"$"#,##0.00_);("$"#,##0.00)',
  8: '"$"#,##0.00_);[Red]("$"#,##0.00)',
  9: "0%",
  10: "0.00%",
  11: "0.00E+00",
  12: "# ?/?",
  13: "# ??/??",
  37: "#,##0_);(#,##0)",
  38: "#,##0_);[Red](#,##0)",
  39: "#,##0.00_);(#,##0.00)",
  40: "#,##0.00_);[Red](#,##0.00)",
  41: '_(* #,##0_);_(* (#,##0);_(* "-"??_);_(@_)',
  42: '_("$"* #,##0_);_("$"* (#,##0);_("$"* "-"??_);_(@_)',
  43: '_(* #,##0.00_);_(* (#,##0.00);_(* "-"??_);_(@_)',
  44: '_("$"* #,##0.00_);_("$"* (#,##0.00);_("$"* "-"??_);_(@_)',
  48: "##0.0E+0",
  49: "@",
};

/** A format code names a date if it uses a date or time letter outside the literal parts. The
 *  quoted runs, the escaped characters, the bracketed colours and conditions and the currency
 *  section all hold letters that mean nothing here, so they come out first. */
function looksLikeDate(code) {
  const bare = String(code || "")
    .replace(/"[^"]*"/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\\./g, "");
  return /[yYmMdDhHsS]/.test(bare) && !/^[^a-zA-Z]*$/.test(bare);
}

/** cellXfs, in index order, each saying its number format and whether that format is a date.
 *  A cell's `s` attribute is an index into this list and not a format id. */
function styleFormats(xml) {
  const custom = new Map();
  const nf = /<numFmt\s[^>]*\/>/g;
  let m;
  while ((m = nf.exec(xml))) {
    const a = attrs(m[0]);
    if (a.numFmtId != null) custom.set(parseInt(a.numFmtId, 10), a.formatCode || "");
  }
  const block = /<cellXfs[\s\S]*?<\/cellXfs>/.exec(xml);
  const out = [];
  if (!block) return out;
  const xf = /<xf\s[^>]*?(?:\/>|>[\s\S]*?<\/xf>)/g;
  while ((m = xf.exec(block[0]))) {
    const a = attrs(m[0]);
    const id = a.numFmtId == null ? 0 : parseInt(a.numFmtId, 10);
    const code = custom.has(id) ? custom.get(id) : (BUILTIN_NUMBER_CODES[id] || "");
    out.push({ numFmtId: id, formatCode: code,
               date: BUILTIN_DATE_IDS.has(id) || (!!code && looksLikeDate(code)) });
  }
  return out;
}

/* ---- the sheet --------------------------------------------------------------------------- */

/** The first sheetData element's inner markup, or nothing when the sheet has none. */
function sheetBody(xml) {
  let body = null;
  scanTags(xml, "sheetData", (_attr, inner) => { if (body == null) body = inner; });
  return body == null ? "" : body;
}

/** One sheet's non-empty cells, each with its address and what kind of value it held.
 *  A cell with no `r` attribute is where the last one left off, which is what a writer that
 *  omits addresses means by omitting them. Every <c> counts toward the budget, before the
 *  cell object exists, so a part of empty cells is the same refusal as a part of full ones. */
function readSheet(xml, strings, styles, notes) {
  const cells = [];
  const merges = [];
  let hiddenRows = 0;
  let rowCursor = 0;
  let seen = 0;
  const body = sheetBody(xml);
  scanTags(body, "row", (rowAttr, rowInner) => {
    const ra = attrs(rowAttr);
    const rowNo = ra.r ? parseInt(ra.r, 10) : rowCursor + 1;
    rowCursor = rowNo;
    if (ra.hidden === "1" || ra.hidden === "true") hiddenRows++;
    let colCursor = 0;
    scanTags(rowInner, "c", (cellAttr, content) => {
      seen += 1;
      if (seen > CELL_BUDGET) throw refuse(TOO_MANY, { BUDGET: String(CELL_BUDGET) });
      const a = attrs(cellAttr);
      const at = parseRef(a.r);
      const col = at ? at.col : colCursor + 1;
      colCursor = col;
      const cell = readCell(a, content, strings, styles, notes,
                            (at && at.row) || rowNo, col);
      if (cell) cells.push(cell);
    });
  });
  const mc = /<mergeCell\s[^>]*\/>/g;
  let mm;
  while ((mm = mc.exec(xml))) { const a = attrs(mm[0]); if (a.ref) merges.push(a.ref); }
  return { cells, merges, hiddenRows };
}

/** One cell, or null where the file holds no value for it. `kind` is what the file said the
 *  value was, never what it looked like: a number that happens to be a postcode stays a
 *  number here and is the caller's to read as text. */
function readCell(a, content, strings, styles, notes, row, col) {
  const type = a.t || "n";
  const formula = /<f(\s|>|\/)/.test(content);
  const vm = /<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/.exec(content);
  const ref = colLetters(col) + row;
  const style = a.s == null ? null : styles[parseInt(a.s, 10)];
  const base = { ref, row, col };
  if (formula) base.formula = true;

  if (type === "inlineStr") {
    const is = /<is(?:\s[^>]*)?>([\s\S]*?)<\/is>/.exec(content);
    const v = is ? textOf(is[1]) : "";
    return v === "" ? null : Object.assign(base, { kind: "text", value: v });
  }
  if (!vm) {
    if (formula) notes.push({ what: "formula-without-value", ref });
    return null;
  }
  const raw = unescapeXml(vm[1]);
  if (type === "s") {
    const i = parseInt(raw, 10);
    if (!(i >= 0 && i < strings.length)) {
      notes.push({ what: "shared-string-missing", ref });
      return null;
    }
    const v = strings[i];
    return v === "" ? null : Object.assign(base, { kind: "text", value: v });
  }
  if (type === "str") {
    return raw === "" ? null : Object.assign(base, { kind: "text", value: raw });
  }
  if (type === "b") {
    return Object.assign(base, { kind: "boolean", value: raw === "1" ? "TRUE" : "FALSE" });
  }
  if (type === "e") {
    notes.push({ what: "error-value", ref });
    return Object.assign(base, { kind: "error", value: raw });
  }
  if (type === "d") {
    /* An ISO 8601 date written as text by the newer schema: no epoch to guess, so it is a
       date the reader can hand on whole, and it still says it is one. */
    return Object.assign(base, { kind: "date", value: raw });
  }
  const cell = Object.assign(base, { kind: "number", value: raw });
  if (style && style.date) {
    cell.dateFormat = style.formatCode || ("builtin " + style.numFmtId);
    notes.push({ what: "date-not-converted", ref });
    return cell;
  }
  if (style && style.formatCode) {
    const shown = showNumber(raw, style.formatCode);
    if (shown && shown.unsupported) notes.push({ what: "number-not-shown", ref, stored: raw });
    else if (shown && shown.shown !== raw) {
      cell.value = shown.shown; /* plant:number-shown */
      notes.push({ what: "number-shown", ref, shown: shown.shown, stored: raw });
    }
  }
  return cell;
}

/* The text a number format draws. Null where the code is general or text, so the stored digits
 * stay and no note is raised. `{ unsupported: true }` where the code is scientific, a fraction,
 * or carries a question mark: the caller keeps the stored digits and says so. Otherwise `shown`
 * is the text, and the caller warns only where it differs from the stored digits.
 *
 * One section formats the absolute value and a leading minus is added for a negative. Two
 * sections give the negative its own text, already carrying the sign or the parentheses. A
 * third section is zero. A condition in brackets is not evaluated. */
function showNumber(raw, code) {
  const format = String(code || "");
  if (!format || format === "General" || format === "@") return null;
  const num = parsePlainNumber(raw);
  if (!num) return { unsupported: true };
  const sections = splitFormatSections(format);
  let section = sections[0], minus = false;
  if (num.sign === 0 && sections.length >= 3) {
    if (sections[2] === "") return { shown: "" };
    section = sections[2];
  } else if (num.sign < 0 && sections.length >= 2) {
    section = sections[1];
  } else {
    minus = num.sign < 0;
  }
  const tokens = formatTokens(section);
  if (!tokens) return { unsupported: true };
  let shown = renderFormat(tokens, num.ip, num.fp);
  if (minus && shown.charAt(0) !== "-" && shown.charAt(0) !== "(") shown = "-" + shown;
  return { shown };
}

function splitFormatSections(code) {
  const parts = [];
  let cur = "", quoted = false, depth = 0;
  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    if (c === '"') { quoted = !quoted; cur += c; continue; }
    if (!quoted && c === "\\") { cur += c + (code[i + 1] || ""); i++; continue; }
    if (!quoted && c === "[") { depth++; cur += c; continue; }
    if (!quoted && c === "]") { depth = Math.max(0, depth - 1); cur += c; continue; }
    if (!quoted && depth === 0 && c === ";") { parts.push(cur); cur = ""; continue; }
    cur += c;
  }
  parts.push(cur);
  return parts;
}

function parsePlainNumber(raw) {
  const m = /^([+-])?(\d*)(?:\.(\d+))?$/.exec(String(raw).trim());
  if (!m || (m[2] === "" && m[3] == null)) return null;
  const fp = m[3] || "";
  let ip = m[2] === "" ? "0" : m[2];
  const zero = /^0*$/.test(ip) && /^0*$/.test(fp);
  ip = ip.replace(/^0+(?=\d)/, "");
  if (ip === "") ip = "0";
  return { sign: zero ? 0 : (m[1] === "-" ? -1 : 1), ip, fp };
}

function shiftDecimal(ip, fp, n) {
  if (!n) return { ip, fp };
  if (n > 0) {
    const digits = ip + fp;
    const point = ip.length + n;
    const padded = point > digits.length ? digits + "0".repeat(point - digits.length) : digits;
    let left = padded.slice(0, point).replace(/^0+(?=\d)/, "");
    if (left === "") left = "0";
    return { ip: left, fp: padded.slice(point) };
  }
  const k = -n;
  if (ip.length <= k) return { ip: "0", fp: "0".repeat(k - ip.length) + ip + fp };
  let left = ip.slice(0, ip.length - k).replace(/^0+(?=\d)/, "");
  if (left === "") left = "0";
  return { ip: left, fp: ip.slice(ip.length - k) + fp };
}

/* Half away from zero, which is what a spreadsheet does with a 5 on its own. */
function roundDecimal(ip, fp, places) {
  if (fp.length <= places) return { ip, fp: fp + "0".repeat(places - fp.length) };
  const up = fp.charCodeAt(places) - 48 >= 5;
  const keep = fp.slice(0, places);
  if (!up) return { ip, fp: keep };
  const digits = (ip + keep).split("");
  let carry = 1;
  for (let i = digits.length - 1; i >= 0 && carry; i--) {
    const d = digits[i].charCodeAt(0) - 48 + carry;
    digits[i] = String(d % 10);
    carry = d > 9 ? 1 : 0;
  }
  if (carry) digits.unshift("1");
  const joined = digits.join("");
  if (!places) return { ip: joined, fp: "" };
  let left = joined.slice(0, joined.length - places).replace(/^0+(?=\d)/, "");
  if (left === "") left = "0";
  return { ip: left, fp: joined.slice(-places) };
}

/* Null where the section cannot be drawn: a question mark, a slash, a scientific mark, or a
 * condition. A colour is skipped. A currency bracket keeps its symbol. */
function formatTokens(section) {
  const tokens = [];
  for (let i = 0; i < section.length; i++) {
    const c = section[i];
    if (c === '"') {
      let j = i + 1, s = "";
      while (j < section.length && section[j] !== '"') { s += section[j]; j++; }
      tokens.push({ t: "lit", s });
      i = j;
      continue;
    }
    if (c === "\\") { tokens.push({ t: "lit", s: section[i + 1] || "" }); i++; continue; }
    if (c === "[") {
      let j = i + 1, s = "";
      while (j < section.length && section[j] !== "]") { s += section[j]; j++; }
      if (/^[<>=]/.test(s)) return null;
      if (s.charAt(0) === "$") tokens.push({ t: "lit", s: s.slice(1).replace(/-[0-9A-Fa-f]+$/, "") });
      i = j;
      continue;
    }
    if (c === "_") { i++; continue; }
    if (c === "*") { tokens.push({ t: "lit", s: section[i + 1] || "" }); i++; continue; }
    if (c === "?" || c === "/") return null;
    if ((c === "E" || c === "e") && (section[i + 1] === "+" || section[i + 1] === "-")) return null;
    if ("0#.,%".indexOf(c) >= 0) { tokens.push({ t: "num", s: c }); continue; }
    tokens.push({ t: "lit", s: c });
  }
  return tokens;
}

function renderFormat(tokens, ip, fp) {
  const nums = tokens.filter(t => t.t === "num");
  let pattern = nums.map(t => t.s).join("").replace(/%/g, "");
  const percents = nums.filter(t => t.s === "%").length;
  let n = { ip, fp };
  if (percents) n = shiftDecimal(n.ip, n.fp, 2 * percents);
  const dot = pattern.indexOf(".");
  let intMask = dot < 0 ? pattern : pattern.slice(0, dot);
  const decMask = dot < 0 ? "" : pattern.slice(dot + 1).replace(/\./g, "");
  let scale = 0;
  while (intMask.endsWith(",")) { scale++; intMask = intMask.slice(0, -1); }
  if (scale) n = shiftDecimal(n.ip, n.fp, -3 * scale);
  const thousands = intMask.indexOf(",") >= 0;
  const zeros = (intMask.match(/0/g) || []).length;
  const rounded = roundDecimal(n.ip, n.fp, decMask.length);
  let ipShow = rounded.ip;
  while (ipShow.length < zeros) ipShow = "0" + ipShow;
  if (thousands) ipShow = ipShow.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  let fpShow = rounded.fp;
  while (fpShow.length && decMask.charAt(fpShow.length - 1) === "#" && fpShow.charAt(fpShow.length - 1) === "0")
    fpShow = fpShow.slice(0, -1);
  const body = nums.length ? ipShow + (fpShow ? "." + fpShow : "") : "";
  let out = "", placed = false;
  tokens.forEach(tok => {
    if (tok.t === "lit") { out += tok.s; return; }
    if (tok.s === "%") { out += "%"; return; }
    if (!placed) { out += body; placed = true; }
  });
  return out;
}

/* ---- the workbook ------------------------------------------------------------------------ */

/** The sheets a workbook declares, in the order the tabs sit in, each with the entry that
 *  holds it. The name is on workbook.xml and the path is on the relationship it names, so a
 *  sheet is never found by guessing sheet1.xml. */
function sheetIndex(bookXml, relsXml) {
  const rel = new Map();
  const re = /<Relationship\s[^>]*\/>/g;
  let m;
  while ((m = re.exec(relsXml || ""))) {
    const a = attrs(m[0]);
    if (a.Id && a.Target) rel.set(a.Id, a.Target);
  }
  const out = [];
  const se = /<sheet\s[^>]*\/>/g;
  while ((m = se.exec(bookXml))) {
    const a = attrs(m[0]);
    const target = a["r:id"] ? rel.get(a["r:id"]) : null;
    out.push({ name: a.name == null ? "" : a.name, state: a.state || "visible",
               target: target || null });
  }
  return out;
}

/** An entry path from a target relative to xl/, with the leading slash form allowed. */
function entryPath(target) {
  const t = String(target || "").replace(/^\.\//, "");
  if (t.startsWith("/")) return t.slice(1);
  if (t.startsWith("xl/")) return t;
  return "xl/" + t;
}

/* The parts this reader knows exist and does not read, named so that a person looking for a
   picture or a comment learns from the report that it was left rather than lost. */
const UNREAD = [
  { prefix: "xl/drawings/", what: "a drawing or a floating image" },
  { prefix: "xl/charts/", what: "a chart" },
  { prefix: "xl/media/", what: "an embedded picture" },
  { prefix: "xl/comments", what: "a cell comment" },
  { prefix: "xl/threadedComments/", what: "a threaded comment" },
  { prefix: "xl/pivotCache/", what: "a pivot table" },
  { prefix: "xl/pivotTables/", what: "a pivot table" },
  { prefix: "xl/embeddings/", what: "an embedded object" },
];

/** Read a workbook's bytes into sheets of cells. Nothing is converted and nothing is
 *  interpreted; see the head of this file for what is refused and what is flagged. */
function readWorkbook(buf) {
  const zip = zipEntries(buf);
  if (zip.has("EncryptedPackage"))
    throw refuse("this workbook is password-protected; open it, save a copy without the"
      + " password and import that", {});
  let spent = 0;
  const get = (name) => {
    if (!zip.has(name)) return null;
    const bytes = entryBytes(buf, zip.get(name), UNPACKED_MAX - spent);
    spent += bytes.length;
    return bytes.toString("utf8");
  };

  const bookXml = get("xl/workbook.xml");
  if (bookXml == null)
    throw refuse("this file is a zip but not a workbook: it has no xl/workbook.xml in it", {});
  const strings = sharedStrings(get("xl/sharedStrings.xml") || "");
  const styles = styleFormats(get("xl/styles.xml") || "");
  const date1904 = /<workbookPr[^>]*\sdate1904="(1|true)"/.test(bookXml);

  const notes = [];
  const unread = [];
  UNREAD.forEach(u => {
    const n = Array.from(zip.keys()).filter(k => k.startsWith(u.prefix)).length;
    if (n) unread.push({ what: u.what, parts: n });
  });

  const sheets = sheetIndex(bookXml, get("xl/_rels/workbook.xml.rels")).map(s => {
    const name = s.target ? entryPath(s.target) : null;
    const xml = name ? get(name) : null;
    if (xml == null) {
      notes.push({ what: "sheet-missing", sheet: s.name });
      return { name: s.name, state: s.state, cells: [], merges: [], hiddenRows: 0,
               rows: 0, columns: 0 };
    }
    const sheetNotes = [];
    const r = readSheet(xml, strings, styles, sheetNotes);
    sheetNotes.forEach(n => notes.push(Object.assign({ sheet: s.name }, n)));
    const rows = r.cells.reduce((a, c) => Math.max(a, c.row), 0);
    const columns = r.cells.reduce((a, c) => Math.max(a, c.col), 0);
    return { name: s.name, state: s.state, cells: r.cells, merges: r.merges,
             hiddenRows: r.hiddenRows, rows, columns };
  });
  if (!sheets.length)
    throw refuse("this workbook declares no sheet at all", {});
  return { sheets, strings: strings.length, date1904, notes, unread };
}

/* A DENSE GRID IS THE OCCUPIED RECTANGLE, from A1 out to the highest row and column of a cell.
   One cell at the far corner names that corner; it is not a pile of empty slots. A million
   cells is a pile of cards this reader will build. Past that it refuses, before the arrays
   exist. Column letters are not capped at three, so the product is what is checked, not the
   spelling of the address. */
const CELL_BUDGET = 1048576;
const RECTANGLE = "this sheet's used rectangle is {ROWS} rows by {COLUMNS} columns, {CELLS}"
  + " cells, and this reader builds at most {BUDGET}; a cell far from the others makes the"
  + " whole rectangle, so move that cell nearer and import again";

/** A sheet's cells as a dense grid of strings, empty where the file held no cell. Addresses
 *  are absolute, so a sheet whose content starts at C5 keeps its blank rows and columns and
 *  the caller decides what to do about them. */
function sheetGrid(sheet) {
  const rows = Number(sheet && sheet.rows);
  const columns = Number(sheet && sheet.columns);
  const cells = rows * columns;
  /* The whole guard is one line so a plant can lift it without leaving a broken statement. */
  if (!(rows >= 0 && columns >= 0 && cells <= CELL_BUDGET)) throw refuse(RECTANGLE, { ROWS: String(rows), COLUMNS: String(columns), CELLS: String(cells), BUDGET: String(CELL_BUDGET) }); /* plant:cell-budget */
  const out = [];
  for (let r = 0; r < rows; r++) out.push(new Array(columns).fill(""));
  sheet.cells.forEach(c => { out[c.row - 1][c.col - 1] = c.value; });
  return out;
}

/** The grid with the empty leading rows and columns cut away, and the offset that was cut, so
 *  that a cell's real address is still reachable from a row and column of the result. */
function trimGrid(grid) {
  const used = (row) => row.some(v => String(v).trim() !== "");
  let top = 0;
  while (top < grid.length && !used(grid[top])) top++;
  let bottom = grid.length;
  while (bottom > top && !used(grid[bottom - 1])) bottom--;
  const rows = grid.slice(top, bottom);
  const width = rows.reduce((a, r) => Math.max(a, r.length), 0);
  let left = 0;
  while (left < width && rows.every(r => String(r[left] || "").trim() === "")) left++;
  let right = width;
  while (right > left && rows.every(r => String(r[right - 1] || "").trim() === "")) right--;
  return { rows: rows.map(r => r.slice(left, right).map(v => (v == null ? "" : v))),
           top, left };
}

/** The sheet an importer should look at: the first visible sheet with a cell in it. A
 *  workbook of one sheet is the ordinary case and this says so rather than assuming it. */
function firstSheetWithCells(wb) {
  const visible = wb.sheets.filter(s => s.state === "visible" && s.cells.length);
  if (visible.length) return visible[0];
  return wb.sheets.find(s => s.cells.length) || null;
}

export { readWorkbook, sheetGrid, trimGrid, firstSheetWithCells, colNumber, colLetters,
         parseRef, unescapeXml, textOf, sharedStrings, looksLikeDate, zipEntries, entryBytes,
         CELL_BUDGET };
