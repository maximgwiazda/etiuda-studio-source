/* THE STATISTICS WORKBOOK. One .xlsx, three sheets, and no dependency: a zip of SpreadsheetML,
 * the same shape tools/fixtures/workbook.mjs writes for the harness and src/workbook.mjs reads.
 * Text is a shared string in UTF-8, so a Polish letter does not depend on the Excel locale, and
 * a number is a number cell (no t attribute), so Excel does not have to guess a separator.
 *
 * A complete minimal stylesheet is written on purpose. A sheet that names fontId 0 while the
 * stylesheet has no fonts list is the shape Excel offers to repair. numFmtId 0 is General, so
 * a number stays a number rather than a date.
 */
import fs from "node:fs";
import zlib from "node:zlib";
import { refuse } from "./refusal.mjs";

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

/* 2020-01-01 00:00:00 in the DOS pair, so two writes of the same tables match. */
const DOS_TIME = 0;
const DOS_DATE = ((2020 - 1980) << 9) | (1 << 5) | 1;

function zip(parts) {
  const chunks = [];
  const central = [];
  let offset = 0;
  parts.forEach((p) => {
    const name = Buffer.from(p.name, "utf8");
    const data = Buffer.from(p.data, "utf8");
    const body = zlib.deflateRawSync(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8);
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
    cd.writeUInt16LE(8, 10);
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
  end.writeUInt16LE(parts.length, 8);
  end.writeUInt16LE(parts.length, 10);
  end.writeUInt32LE(cdBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([Buffer.concat(chunks), cdBuf, end]);
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* Characters XML forbids, dropped rather than escaped, so the part stays well formed.
   U+FFFE and U+FFFF are the two more that make Excel offer a repair.
   Lone surrogates are stripped, and a cell is capped at Excel's limit of 32,767 characters. */
function clean(s) {
  const stripped = String(s == null ? "" : s)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, "")
    .replace(/([\uD800-\uDBFF][\uDC00-\uDFFF])|[\uD800-\uDFFF]/g, (m, p) => p || "");
  if (stripped.length <= 32767) return stripped;
  let capped = stripped.slice(0, 32767);
  if (/[\uD800-\uDBFF]$/.test(capped)) capped = capped.slice(0, -1);
  return capped;
}
const xmlText = clean;

function num(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || Object.is(value, -0)) return "0";
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(12).replace(/0+$/, "").replace(/\.$/, "");
}

function colRef(col, row) {
  let n = col, s = "";
  while (n > 0) {
    n -= 1;
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s + row;
}

function contentTypes(count) {
  let sheets = "";
  for (let i = 1; i <= count; i++) {
    sheets += '<Override PartName="/xl/worksheets/sheet' + i
      + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
  }
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
    + sheets
    + '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>'
    + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
    + "</Types>";
}

const ROOT_RELS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
  + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
  + "</Relationships>";

function bookXml(names) {
  const tabs = names.map((name, i) => '<sheet name="' + esc(name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join("");
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
    + "<sheets>" + tabs + "</sheets></workbook>";
}

function bookRels(count) {
  let rels = "";
  for (let i = 1; i <= count; i++) {
    rels += '<Relationship Id="rId' + i
      + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'
      + i + '.xml"/>';
  }
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + rels
    + '<Relationship Id="rId90" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>'
    + '<Relationship Id="rId91" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
    + "</Relationships>";
}

const STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
  + '<fonts count="1"><font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font></fonts>'
  + '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>'
  + '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
  + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
  + '<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>'
  + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
  + "</styleSheet>";

function sharedStringsXml(list) {
  const items = list.map((s) => '<si><t xml:space="preserve">' + esc(s) + "</t></si>").join("");
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="'
    + list.length + '" uniqueCount="' + list.length + '">' + items + "</sst>";
}

function sheetXml(rows, share) {
  const body = [];
  rows.forEach((row, r) => {
    const cells = [];
    (row || []).forEach((value, c) => {
      const xml = cellXml(colRef(c + 1, r + 1), value, share);
      if (xml) cells.push(xml);
    });
    if (cells.length) body.push('<row r="' + (r + 1) + '">' + cells.join("") + "</row>");
  });
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'
    + body.join("") + "</sheetData></worksheet>";
}

function cellXml(ref, value, share) {
  if (value == null || value === "") return "";
  if (typeof value === "number") return '<c r="' + ref + '"><v>' + num(value) + '</v></c>'; /* plant:sx-num */
  const text = xmlText(value);
  if (!text) return "";
  return '<c r="' + ref + '" t="s"><v>' + share(text) + "</v></c>";
}

/** Write `book` to `file`. `book.sheets` is `{ name, rows }`. A row is cells: a string, a finite
 *  number, or null for an empty cell. A number is a number. Text is a shared string. */
function writeStatsBook(file, book) {
  const sheets = book && Array.isArray(book.sheets) ? book.sheets : [];
  const strings = [];
  const index = new Map();
  const share = (s) => {
    if (index.has(s)) return index.get(s);
    const at = strings.length;
    index.set(s, at);
    strings.push(s);
    return at;
  };
  const names = sheets.map((s) => xmlText(s && s.name));
  const built = sheets.map((s) => sheetXml(s && Array.isArray(s.rows) ? s.rows : [], share));
  const parts = [
    { name: "[Content_Types].xml", data: contentTypes(sheets.length) },
    { name: "_rels/.rels", data: ROOT_RELS },
    { name: "xl/workbook.xml", data: bookXml(names) },
    { name: "xl/_rels/workbook.xml.rels", data: bookRels(sheets.length) },
    { name: "xl/styles.xml", data: STYLES },
    { name: "xl/sharedStrings.xml", data: sharedStringsXml(strings) },
  ].concat(built.map((data, i) => ({ name: "xl/worksheets/sheet" + (i + 1) + ".xml", data })));
  const buf = zip(parts);
  const tmp = file + "." + process.pid + ".writing";
  /* The temporary file is written beside the target, then renamed over it. Refusing the write
     is the folder. Refusing the rename is the target, held open. Any other fault is left as it was. */
  try { fs.writeFileSync(tmp, buf); }
  catch (err) {
    const code = err && err.code;
    if (code === "EPERM" || code === "EACCES" || code === "EROFS") {
      try { fs.unlinkSync(tmp); } catch { /* the write already said why */ }
      throw refuse("This computer may not write in that folder, so nothing was written. Pick another, such as Documents, and export again.");
    }
    throw err;
  }
  try { fs.renameSync(tmp, file); }
  catch (err) {
    try { fs.unlinkSync(tmp); } catch { /* the rename already said why */ }
    const code = err && err.code;
    if (code === "EPERM" || code === "EBUSY" || code === "EISDIR" || code === "EACCES") {
      throw refuse("Another program holds {F} open, so nothing was written and the file stays as it was. Once it is closed there, export again.", { F: String(file) });
    }
    throw err;
  }
  return file;
}

export { writeStatsBook, clean };
