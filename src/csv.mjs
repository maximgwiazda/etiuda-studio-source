/* RFC 4180, AND A SECOND IMPLEMENTATION ON PURPOSE.
 *
 * tests/round-trip.mjs parses the same CSV with a parser of its own, and that is not waste: the
 * gate is the oracle and an oracle that imports the subject proves that the subject agrees with
 * itself. Two readers written from the same document, disagreeing nowhere on the generator's
 * piles, is a real check; one reader used twice is an assertion.
 *
 * The engine has no CSV in it, so nothing here is a second implementation of an engine rule.
 *
 * THE THREE THINGS A SPREADSHEET EXPORT ACTUALLY DOES, each met here rather than assumed away:
 * a byte order mark at the head, because Excel writes one; CRLF, LF and a lone CR as row
 * endings, because the three platforms disagree; and a quoted field carrying a comma, a
 * doubled quote or a newline, which is the case that separates a parser from a `split(",")`.
 *
 * AND THE SEPARATOR IS NOT ALWAYS A COMMA (sense pass 2026-09-22, item 1). Excel on a Polish
 * desk saves "CSV" with semicolons, because the comma is that locale's decimal mark, and its
 * "Unicode text" is tab-separated UTF-16. A comma-only reader turned both into one column of
 * whole lines and refused them. `delimiterOf` asks which of the three the ROWS AGREE on, by the
 * same agreement rule examine() uses to call a file a table at all, so a sentence with a
 * semicolon in it does not become a column break any more than a sentence with a comma did.
 *
 * ENCODING IS THE CALLER'S QUESTION, not this file's. `read()` takes bytes and says what it
 * decided, because a file that is valid windows-1252 and invalid UTF-8 has to be reported as a
 * finding rather than silently mangled into replacement characters.
 */

/* THE REFUSALS A PERSON MEETS AT A SCREEN GO THROUGH refuse(), which keeps the English as
   the Error's message and carries the frame and its variables beside it so the page can say
   the same thing in Polish (board 523, src/refusal.mjs). A plain `throw new Error` below
   names a flag or reports a fault in this program, and stays English on purpose. */
import { refuse } from "./refusal.mjs";

/* WHICH SINGLE-BYTE CODE PAGE, DECIDED BY THE LETTERS IT MAKES (sense pass 2026-09-22, item 1).
 *
 * This said windows-1252 was what a spreadsheet on a Polish desk writes, and decoded as latin1.
 * Both halves were wrong: Polish Windows' ANSI code page is 1250, and latin1 is not even 1252.
 * The two pages share every byte below 0x80 and most letters above it, and differ exactly where
 * Polish lives: 0xB3 is "\u0142" in one and "\u00B3" in the other, 0x9C is "\u015B" and "\u0153", 0xB9 "\u0105" and "\u00B9".
 *
 * SO EACH BYTE WHERE THE TWO DISAGREE CASTS ONE VOTE: for 1250 when 1250 reads it as a Polish
 * letter, for 1252 when 1252 reads it as a letter and 1250 does not read a Polish one. "\u015B"
 * against "\u0153" is a vote for Polish, and "\u00E0" against "\u0155" is a vote for 1252, which is what keeps
 * a French pile French. A tie, including a file whose only high bytes both pages read alike,
 * goes to 1250, because Studio is sold to Polish desks and that is the page they write.
 */
const POLISH = new Set(Array.from("\u0105\u0107\u0119\u0142\u0144\u00F3\u015B\u017A\u017C\u0104\u0106\u0118\u0141\u0143\u00D3\u015A\u0179\u017B"));
const LETTER = /\p{L}/u;

function codePage(buf) {
  const pl = new TextDecoder("windows-1250").decode(buf);
  const west = new TextDecoder("windows-1252").decode(buf);
  let forPl = 0, forWest = 0;
  const n = Math.min(pl.length, west.length);
  for (let i = 0; i < n; i++) {
    if (pl[i] === west[i]) continue;
    if (POLISH.has(pl[i])) forPl++;
    else if (LETTER.test(west[i])) forWest++;
  }
  return forWest > forPl ? { text: west, encoding: "windows-1252" }
                         : { text: pl, encoding: "windows-1250" };
}

/* WHERE UTF-8 IS ILLEGAL, ONE OFFSET PER SEQUENCE THAT FAILED, advancing a single byte so the
 * next sequence is judged on its own. A fatal decode is what decides; this only names the
 * places, because the warning has to say which bytes, not only that some were wrong. Overlong
 * forms, surrogates and anything past U+10FFFF are illegal, the same calls a fatal decoder makes.
 * A real U+FFFD is the bytes EF BF BD and is not in this list. */
function illegalUtf8Offsets(buf) {
  const offsets = [];
  let i = 0;
  while (i < buf.length) {
    const b = buf[i];
    if (b <= 0x7F) { i++; continue; }
    let len = 0, min2 = 0x80, max2 = 0xBF;
    if (b >= 0xC2 && b <= 0xDF) len = 2;
    else if (b === 0xE0) { len = 3; min2 = 0xA0; }
    else if ((b >= 0xE1 && b <= 0xEC) || b === 0xEE || b === 0xEF) len = 3;
    else if (b === 0xED) { len = 3; max2 = 0x9F; }
    else if (b === 0xF0) { len = 4; min2 = 0x90; }
    else if (b >= 0xF1 && b <= 0xF3) len = 4;
    else if (b === 0xF4) { len = 4; max2 = 0x8F; }
    if (!len || i + len > buf.length) { offsets.push(i); i++; continue; }
    const second = buf[i + 1];
    let ok = second >= min2 && second <= max2;
    for (let k = 2; ok && k < len; k++) ok = (buf[i + k] & 0xC0) === 0x80;
    if (!ok) { offsets.push(i); i++; continue; }
    i += len;
  }
  return offsets;
}

/** Decode bytes, saying which encoding was used and why. A UTF-16 byte order mark is UTF-16,
 *  which is what Excel's "Unicode text" writes. Otherwise UTF-8 when a fatal decode accepts the
 *  bytes, and that includes a file whose text really contains U+FFFD. Only bytes the fatal
 *  decode refuses fall through to the code page `codePage` settles on above, and `offsets`
 *  names each illegal sequence so the warning can say where, rather than decoding the rest a
 *  second time and counting replacement characters. A byte order mark stays in the text, as
 *  `Buffer.toString("utf8")` left it; `rows` already drops it. */
function decode(buf) {
  if (buf.length >= 2 && buf[0] === 0xFF && buf[1] === 0xFE)
    return { text: new TextDecoder("utf-16le").decode(buf.subarray(2)), encoding: "utf-16le",
             replaced: 0, offsets: [] };
  if (buf.length >= 2 && buf[0] === 0xFE && buf[1] === 0xFF)
    return { text: new TextDecoder("utf-16be").decode(buf.subarray(2)), encoding: "utf-16be",
             replaced: 0, offsets: [] };
  let utf8 = null;
  try { utf8 = new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(buf); }
  catch { utf8 = null; }
  if (utf8 != null) return { text: utf8, encoding: "utf-8", replaced: 0, offsets: [] }; /* plant:utf8-fatal */
  const offsets = illegalUtf8Offsets(buf);
  const cp = codePage(buf);
  return { text: cp.text, encoding: cp.encoding, replaced: offsets.length || 1, offsets };
}

/** Rows of fields, as they stand: no header handling, no trimming, nothing dropped. The
 *  separator is a comma unless the caller says otherwise; `delimiterOf` is how it knows. */
function rows(text, delim) {
  const sep = delim || ",";
  const s = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
  const out = [];
  let row = [], field = "", quoted = false, i = 0;
  while (i < s.length) {
    const c = s[i];
    if (quoted) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i += 2; continue; }
        quoted = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"' && field === "") { quoted = true; i++; continue; }
    if (c === sep) { row.push(field); field = ""; i++; continue; }
    if (c === "\r" && s[i + 1] === "\n") { row.push(field); out.push(row); row = []; field = ""; i += 2; continue; }
    if (c === "\n" || c === "\r") { row.push(field); out.push(row); row = []; field = ""; i++; continue; }
    field += c; i++;
  }
  if (field !== "" || row.length) { row.push(field); out.push(row); }
  return out;
}

/** The field count the rows agree on, or 0 if they do not. A majority of at least
 *  two rows, including the first, share one width of two or more fields; a single
 *  comma in a single line is not a table, and a plurality is not agreement. Moved here
 *  from src/source.mjs so that choosing a separator and calling a file a table are one rule. */
function agreedWidth(raw) {
  if (!raw.length) return 0;
  const hist = new Map();
  raw.forEach(r => hist.set(r.length, (hist.get(r.length) || 0) + 1));
  let mode = 0, n = 0;
  hist.forEach((count, width) => {
    if (count > n || (count === n && width > mode)) { mode = width; n = count; }
  });
  if (mode < 2 || n < 2 || n * 2 <= raw.length) return 0;
  if (raw[0].length !== mode) return 0;
  return mode;
}

const DELIMITERS = [",", ";", "\t"];

/** The separator whose rows agree over the most rows. A comma wins every tie, including the
 *  tie at nothing, because a comma is what every reader before this one assumed and a file
 *  none of the three can make a table of is then read exactly as it was before. */
function delimiterOf(text) {
  let best = ",", most = 0;
  DELIMITERS.forEach(d => {
    const raw = rows(text, d).filter(r => r.some(v => String(v).trim()));
    const w = agreedWidth(raw);
    if (!w) return;
    const n = raw.filter(r => r.length === w).length;
    if (n > most) { best = d; most = n; }
  });
  return best;
}

/** The table a spreadsheet meant: the first row names the columns, a row of nothing but
 *  whitespace is not a row, and a short row's missing cells are empty rather than undefined. */
function table(text, delim) {
  const all = rows(text, delim);
  if (!all.length) throw refuse("the CSV has no rows at all");
  const used = (r) => r && r.some(v => String(v).trim());
  let top = 0;
  while (top < all.length && !used(all[top])) top++;
  /* A file of nothing but blank rows reads as it always did, an empty table under its first row,
     so a sibling like categories.csv left blank is passed over rather than refusing the import. */
  if (top >= all.length) top = 0;
  const head = all[top].map(h => String(h).trim());
  const dup = head.filter((h, i) => h && head.indexOf(h) !== i);
  const body = [];
  for (let i = top + 1; i < all.length; i++) {
    const r = all[i];
    if (!used(r)) continue;
    const o = { __row: i + 1 };
    head.forEach((h, j) => { if (h) o[h] = r[j] == null ? "" : r[j]; });
    body.push(o);
  }
  return { head, rows: body, duplicateHeaders: Array.from(new Set(dup)) };
}

/* ---- and the way back out ----------------------------------------------------------------------
 *
 * THE WRITER LIVES HERE BECAUSE TWO THINGS NOW WRITE A CSV. It was three lines inside
 * tools/export-csv.mjs until board 606, and the audit pack's approval record needed the same
 * three; but electron-builder ships `src/**` and `ui/**` and no part of `tools/`, so a module
 * under src/ reaching into tools/ throws on a customer's machine. One implementation, in the
 * half of the tree that ships, quoting by exactly the rule `rows()` above parses.
 *
 * CRLF, WHICH IS RFC 4180 AND IS WHAT A SPREADSHEET EXPECTS. `rows()` reads all three endings,
 * so a file written here comes back through the reader above whatever a person's editor does
 * to it on the way.
 */
/* A SPREADSHEET RUNS A CELL WHOSE TEXT STARTS WITH ONE OF THESE, quotes or no quotes.
   The apostrophe is the text marker those programs strip on opening, so what they show is
   the text that was written. rows() does not strip it: a parser that did would be unable
   to tell a marker from a text that begins with an apostrophe, and the two are one string. */
const FORMULA_LEAD = /^[=+\-@\t\r]/;

function csvText(value) {
  const s = value == null ? "" : String(value);
  if (FORMULA_LEAD.test(s)) return "'" + s; /* plant:csv-formula */
  return s;
}

function csvField(v) {
  const raw = v == null ? "" : String(v);
  const s = csvText(v);
  /* Quoted when the apostrophe was added, and when the field already needed quotes. A
     prefixed field with no comma in it is still one field, not a stray apostrophe. */
  return (s !== raw || /[",\r\n]/.test(s)) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/** The text a content cell holds once an export's marker has done its job. Trimmed, as
 *  every content cell already was. The apostrophe comes off only when the next character
 *  is one of the six, which is what csvText writes. A cell whose own text is an apostrophe
 *  and then one of the six loses that apostrophe: the marker and the text are the same
 *  bytes, and the marker is the one this side can recognise. */
function cellText(value) {
  const s = String(value == null ? "" : value).trim();
  if (s.length > 1 && s[0] === "'" && FORMULA_LEAD.test(s[1])) return s.slice(1);
  return s;
}

function csvOf(table) {
  return table.map(r => r.map(csvField).join(",")).join("\r\n") + "\r\n";
}

export { decode, rows, table, agreedWidth, delimiterOf, csvField, csvOf, csvText, cellText };
