/* A PASTE IS TEXT HANDED TO THE SAME IMPORTER A FILE IS. `node tools/import.mjs --paste` and
 * the wizard's Split into cards both call splitPaste and pasteCsv, then importCsv (src/import.mjs).
 * This file does not call a model, and it does not change a word of the plain text: a platform
 * placeholder is left for the importer, which translates it the way a file's cell is translated.
 *
 * TWO BOUNDARIES. A blank line of the plain text always starts a new piece. Where HTML is
 * offered, an h1 to h6 whose text is a whole line of that plain text starts one too, even with
 * no blank line. The card's bytes are the plain line, never the HTML. What each program puts
 * on the clipboard beyond text/plain and text/html was not established, so a heading that is
 * not an h1 to h6 does not split.
 *
 * The CSV is two columns, Title and Text, every field quoted, so a semicolon or a tab inside
 * a reply cannot choose a different separator. Each paste is its own file. The command line
 * still writes pasted.csv, and that name is still recognised as a paste.
 */
import os from "node:os";
import path from "node:path";
import { csvText } from "./csv.mjs";

const PASTE_NAME = "pasted.csv";

/* HTML's own names for the Latin-1 letters a heading may be written with, the five
   escapes every HTML file uses, typographic punctuation, and Latin Extended-A names for
   Polish and Central European text. */
const NAMED = {
  amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: "\u00a0",
  Agrave: "\u00c0", Aacute: "\u00c1", Acirc: "\u00c2", Atilde: "\u00c3", Auml: "\u00c4",
  Aring: "\u00c5", AElig: "\u00c6", Ccedil: "\u00c7", Egrave: "\u00c8", Eacute: "\u00c9",
  Ecirc: "\u00ca", Euml: "\u00cb", Igrave: "\u00cc", Iacute: "\u00cd", Icirc: "\u00ce",
  Iuml: "\u00cf", Ntilde: "\u00d1", Ograve: "\u00d2", Oacute: "\u00d3", Ocirc: "\u00d4",
  Otilde: "\u00d5", Ouml: "\u00d6", Oslash: "\u00d8", Ugrave: "\u00d9", Uacute: "\u00da",
  Ucirc: "\u00db", Uuml: "\u00dc", Yacute: "\u00dd", szlig: "\u00df", agrave: "\u00e0",
  aacute: "\u00e1", acirc: "\u00e2", atilde: "\u00e3", auml: "\u00e4", aring: "\u00e5",
  aelig: "\u00e6", ccedil: "\u00e7", egrave: "\u00e8", eacute: "\u00e9", ecirc: "\u00ea",
  euml: "\u00eb", igrave: "\u00ec", iacute: "\u00ed", icirc: "\u00ee", iuml: "\u00ef",
  ntilde: "\u00f1", ograve: "\u00f2", oacute: "\u00f3", ocirc: "\u00f4", otilde: "\u00f5",
  ouml: "\u00f6", oslash: "\u00f8", ugrave: "\u00f9", uacute: "\u00fa", ucirc: "\u00fb",
  uuml: "\u00fc", yacute: "\u00fd", yuml: "\u00ff",
  /* Typographic entities */
  ndash: "\u2013", mdash: "\u2014", lsquo: "\u2018", rsquo: "\u2019",
  sbquo: "\u201a", ldquo: "\u201c", rdquo: "\u201d", bdquo: "\u201e",
  hellip: "\u2026", bull: "\u2022", euro: "\u20ac", trade: "\u2122",
  /* Latin Extended-A Polish and Central European entities */
  Aogon: "\u0104", aogon: "\u0105", Cacute: "\u0106", cacute: "\u0107",
  Eogon: "\u0118", eogon: "\u0119", Lstrok: "\u0141", lstrok: "\u0142",
  Nacute: "\u0143", nacute: "\u0144", Sacute: "\u015a", sacute: "\u015b",
  Zacute: "\u0179", zacute: "\u017a", Zdot: "\u017b", zdot: "\u017c",
  Scaron: "\u0160", scaron: "\u0161", Zcaron: "\u017d", zcaron: "\u017e",
  Ccaron: "\u010c", ccaron: "\u010d", Dcaron: "\u010e", dcaron: "\u010f",
  Ecaron: "\u011a", ecaron: "\u011b", Ncaron: "\u0147", ncaron: "\u0148",
  Rcaron: "\u0158", rcaron: "\u0159", Tcaron: "\u0164", tcaron: "\u0165",
  Uring: "\u016e", uring: "\u016f",
};

/** One pass. `&amp;eacute;` stays `&eacute;`, because the amp is consumed as its own entity. */
function decodeEntities(s) {
  return String(s).replace(/&(#x[0-9a-fA-F]+|#\d+|[A-Za-z][A-Za-z0-9]*);/g, (m, body) => {
    if (body.charAt(0) === "#") {
      const hex = body.charAt(1) === "x" || body.charAt(1) === "X";
      const n = parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10);
      if (!Number.isFinite(n) || n < 0 || n > 0x10FFFF) return m;
      try { return String.fromCodePoint(n); } catch (e) { return m; }
    }
    return Object.prototype.hasOwnProperty.call(NAMED, body) ? NAMED[body] : m;
  });
}

function textOf(inner) {
  const broken = String(inner).replace(/<br\s*\/?>/gi, "\n");
  return decodeEntities(broken.replace(/<[^>]*>/g, ""));
}

/** The comparison key: no-break spaces are spaces, and runs of whitespace are one space. */
function collapse(s) {
  return String(s).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function isBlank(line) {
  return /^[\s\u00a0]*$/.test(line);
}

/** h1 to h6, in order, each the heading's text collapsed. Anything else is not a heading. */
function headingsOf(html) {
  let s = String(html || "");
  if (/^Version:\s*[\d.]/.test(s) && s.slice(0, 400).indexOf("StartHTML:") >= 0 && /<html/i.test(s))
    s = s.slice(s.search(/<html/i));
  /* Each span is found by indexOf from where the last one ended, so the scan is linear however many tags are
     left unclosed (a lazy pattern rescans to the end of the text for each one). An unclosed comment, script or
     style drops the rest. An unclosed heading is skipped, and the scan goes on, so a later heading is still
     read. Once a closer is absent, every later search for that same closer is absent too. */
  s = dropSpans(s, /<!--/g, () => "-->");
  s = dropSpans(s, /<script\b[^>]*>/gi, () => "</script>");
  s = dropSpans(s, /<style\b[^>]*>/gi, () => "</style>");
  const out = [];
  const lower = s.toLowerCase();
  const missed = new Map();
  const open = /<([a-z0-9]+)\b([^>]*)>/gi;
  let m;
  while ((m = open.exec(s))) {
    const tag = m[1].toLowerCase();
    const attrs = m[2];
    let close = null;
    if (/^h[1-6]$/.test(tag)) {
      close = "</" + tag;
    } else if (tag === "p" && /\bclass\s*=\s*["']?[^"'>]*\bMsoHeading[1-6]\b/i.test(attrs)) {
      close = "</p";
    } else if (/\brole\s*=\s*["']?heading\b/i.test(attrs)) {
      close = "</" + tag;
    }
    if (!close) continue;
    const known = missed.get(close);
    const end = known == null || open.lastIndex < known ? lower.indexOf(close, open.lastIndex) : -1;
    if (end < 0) {
      if (known == null) missed.set(close, open.lastIndex);
      continue; /* plant:unclosed-heading */
    }
    const text = collapse(textOf(s.slice(open.lastIndex, end)));
    if (text) out.push(text);
    open.lastIndex = end;
  }
  return out;
}

/** s with every span from a match of `openRe` to its closing string removed, scanned once. */
function dropSpans(s, openRe, closeOf) {
  const lower = s.toLowerCase();
  let out = "", at = 0, m;
  openRe.lastIndex = 0;
  while ((m = openRe.exec(s))) {
    const close = closeOf(m);
    const end = lower.indexOf(close, openRe.lastIndex);
    out += s.slice(at, m.index);
    if (end < 0) return out;
    at = end + close.length;
    openRe.lastIndex = at;
  }
  return out + s.slice(at);
}

/** Pieces of a paste: `{ title, body }`, the first non-blank line and the lines under it.
 *  Where headings are present, a heading starts a piece and blank lines are paragraphs inside it;
 *  without headings, a blank line ends a piece. A piece with an empty body is never made from a
 *  heading followed by a blank line. Leading and trailing blanks are dropped. An empty or
 *  whitespace-only plain text is no pieces, whatever the HTML holds. */
function splitPaste(plain, html) {
  const text = String(plain == null ? "" : plain).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = text.split("\n");
  if (!lines.some((line) => !isBlank(line))) return [];
  const heads = headingsOf(html);
  const unused = new Map();
  for (const h of heads) unused.set(h, (unused.get(h) || 0) + 1);
  const hasHeadings = lines.some((line) => !isBlank(line) && unused.has(collapse(line)));
  const pieces = [];
  let cur = null;
  const flush = () => {
    if (!cur) return;
    while (cur.body.length > 0 && isBlank(cur.body[cur.body.length - 1])) {
      cur.body.pop();
    }
    pieces.push({ title: cur.title, body: cur.body.join("\n") });
    cur = null;
  };
  if (!hasHeadings) {
    for (const line of lines) {
      if (isBlank(line)) { flush(); continue; }
      if (!cur) cur = { title: line, body: [] };
      else cur.body.push(line);
    }
    flush();
    return pieces;
  }
  for (const line of lines) {
    const key = collapse(line);
    const count = unused.get(key) || 0;
    if (!isBlank(line) && count > 0) {
      flush();
      cur = { title: line, body: [] };
      if (count === 1) unused.delete(key);
      else unused.set(key, count - 1);
      continue;
    }
    if (isBlank(line)) {
      if (!cur || cur.body.length === 0) continue;
      if (!isBlank(cur.body[cur.body.length - 1])) cur.body.push("");
      continue;
    }
    if (!cur) cur = { title: line, body: [] };
    else cur.body.push(line);
  }
  flush();
  return pieces;
}

function quoted(s) {
  return '"' + csvText(s).replace(/"/g, '""') + '"';
}

/** The CSV importCsv already reads. Both columns are always quoted. CRLF, as csvOf writes. */
function pasteCsv(pieces) {
  const rows = ['"Title","Text"'];
  (pieces || []).forEach((p) => { rows.push(quoted(p.title) + "," + quoted(p.body)); });
  return rows.join("\r\n") + "\r\n";
}

/** A line the importer would keep. Empty and whitespace-only text have no reply. */
function pasteHasReply(plain) {
  const text = String(plain == null ? "" : plain).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return text.split("\n").some((line) => !isBlank(line));
}

/** A blank line with a non-blank line on each side. Leading and trailing blanks are not one. */
function blankBetween(plain) {
  const text = String(plain == null ? "" : plain).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  let seen = false;
  let gap = false;
  for (const line of text.split("\n")) {
    if (isBlank(line)) { if (seen) gap = true; continue; }
    if (seen && gap) return true;
    seen = true;
    gap = false;
  }
  return false;
}

/** True when a heading's text is a whole line. A heading that is only the first line's title
 *  counts: the one-block notice would be false about it. */
function headingMatched(plain, html) {
  const text = String(plain == null ? "" : plain).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const heads = headingsOf(html);
  const headSet = new Set(heads);
  for (const line of text.split("\n")) {
    if (isBlank(line)) continue;
    if (headSet.has(collapse(line))) return true;
  }
  return false;
}

/** The pieces, how many replies that is, and whether the one-block notice applies.
 *  One piece is that notice only when nothing in the text could have split it. */
function pasteAccount(plain, html) {
  const pieces = splitPaste(plain, html);
  const oneBlock = pieces.length === 1 && !blankBetween(plain) && !headingMatched(plain, html);
  return { pieces, replies: pieces.length, oneBlock };
}

/** The column override the wizard's language choice sends: Title and Text, in that language. */
function pasteOverride(code) {
  const c = String(code || "");
  return { Title: "title." + c, Text: "body." + c };
}

/* The folders a paste is written under: the system's temporary folder for the command line and the legs, and each folder this
   thread's writePaste was given (Studio's own work folder, shell/main.js workDir). */
const PASTE_BASES = new Set([path.resolve(os.tmpdir())]);
/* A second paste in the same millisecond still gets its own file. */
let pasteSeq = 0;
/** Where the paste is written under `base` (the temporary folder where none is given), `base` noted as a paste's own.
 *  The name is pasted-<time>-<seq>.csv, base 36, so two pastes never share a file. */
function pasteFileIn(base) {
  const at = path.resolve(base ? String(base) : os.tmpdir());
  PASTE_BASES.add(at);
  const name = "pasted-" + Date.now().toString(36) + "-" + pasteSeq.toString(36) + ".csv";
  pasteSeq += 1;
  return path.join(at, "etiuda-studio-paste", name);
}

/** A paste this process would write: pasted.csv, which the command line and a reset still lay,
 *  or pasted-<time>-<seq>.csv, under an etiuda-studio-paste directory of a base noted here. */
function isPasteFile(file) {
  if (!file) return false;
  const resolved = path.resolve(String(file));
  const dir = path.dirname(resolved);
  if (path.basename(dir).toLowerCase() !== "etiuda-studio-paste") return false;
  if (!/^pasted(-[a-z0-9]+)*\.csv$/.test(path.basename(resolved).toLowerCase())) return false;
  const holder = path.dirname(dir).toLowerCase();
  for (const base of PASTE_BASES) if (holder === path.resolve(base).toLowerCase()) return true;
  return false;
}

export { PASTE_NAME, splitPaste, pasteCsv, pasteHasReply, pasteAccount, pasteOverride, isPasteFile, pasteFileIn };
