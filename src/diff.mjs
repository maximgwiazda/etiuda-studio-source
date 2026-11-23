/* TWO REVISIONS OF ONE CATALOG, OVER THE FORMAT'S OWN STRUCTURE.
 *
 * A textual diff of two format 2 documents is useless: the cards are a JSON array, one added
 * card shifts every line after it, and a field renamed inside a card looks like the card being
 * replaced. So the comparison here is over the shape the format actually has - tags and cards
 * matched BY THEIR IDS, which is exactly what ids are for, and then field by field inside a
 * matched pair.
 *
 * WHAT COUNTS AS A CHANGE, stated so a second tool could be written from it:
 *   added / removed    an id in one revision and not the other, by kind (shelf, request, card).
 *   changed            a matched pair whose canonical form differs, listed as one row per
 *                      differing field path, with the field's value on each side.
 *   moved              a card whose `shelf` changed, which is called out separately because it
 *                      is the change an author most often makes by accident.
 *   a list             is one value: a card's `next` changing is ONE row at the path `next`, the
 *                      whole list on each side, because its order is its meaning. `retired` and
 *                      `commits` are flags and row like any other field (tests/format-pass.mjs).
 *   header             the catalog's own fields: name, rev, date, langs, role, minEngine. `hash`
 *                      is NOT compared: it is derived from everything else, so reporting it
 *                      would be reporting that something changed, which the rest of the report
 *                      has just said in detail. `evaluation` is left out the same way: it is a
 *                      publish-time stamp of the edition (an evaluation copy, or one from a
 *                      newer build), never content.
 *   a date             a card's or a tag's `changedAt` is NOT compared either (board 982, src/dated.mjs): Studio
 *                      writes it at publish because the rest changed, and a date read as a change would leave every
 *                      published card changed for ever, and offer a desk's own date as a row to accept.
 *
 * THE CANONICAL FORM IS THE ENGINE'S, handed in rather than reimplemented, so two documents
 * this tool calls equal are two documents the engine would hash the same.
 *
 * VALUES ARE SHOWN, and that is a decision rather than an oversight. The engine's own converter
 * prints paths and never values, because it runs against a customer's catalog inside a public
 * repository. Studio runs on the machine of the person who owns the content, and a diff that
 * says "card c-refund-late: body.pl changed" without saying how is a diff nobody can review. A
 * caller that wants the converter's discretion passes `values: false`.
 */

import fs from "node:fs";
import { parsePlain, HOSTILE } from "./plain-json.mjs";
import { undated } from "./dated.mjs";

const HEADER_FIELDS = ["rev", "date", "langs", "role", "minEngine", "commentLang",
                       "greet", "stop", "sample", "facts", "variables"];

/* ONE READER FOR A CATALOG DOCUMENT ON DISK, wherever it came from: a `.ec`, a `.json`, or the
 * sibling script that a page opened from file:// can run but cannot fetch (engine spec 2, "the
 * container is not the format"). It lived in tools/diff.mjs until the review queue needed the
 * same thing for an agent's export; two readers of one container is exactly the duplication
 * this repository's one-door rule exists to prevent, so it moved here and the tool imports it.
 *
 * THE ORDER IS THE TRAP, and it is the engine's own: parse the text as it stands FIRST and look
 * for the assignment only once that has failed, because searching for the global's name first
 * cuts a document at a card that happens to mention it. A document that parses and is not plain
 * data is refused as it stands (src/plain-json.mjs), never read again as an assignment. */
function readCatalogDocument(file) {
  return catalogFromText(fs.readFileSync(file, "utf8"), file);
}
/** The same reading of text already read. */
function catalogFromText(text, file) {
  const raw = String(text).replace(/^\uFEFF/, "").trim();
  try { return parsePlain(raw); }
  catch (e) {
    if (e && e.said) throw e;
    const at = raw.indexOf("E_CATALOG"), eq = at > -1 ? raw.indexOf("=", at) : -1;
    if (eq < 0) throw new Error("not a catalog document and no catalog assignment in " + file);
    return parsePlain(raw.slice(eq + 1).trim().replace(/;\s*$/, ""));
  }
}

function byId(list) {
  const out = new Map();
  (Array.isArray(list) ? list : []).forEach(x => { if (x && x.id) out.set(String(x.id), x); });
  return out;
}

/** Every leaf path where two values differ, as dotted paths with array indices in brackets. */
function paths(a, b, at, out) {
  const ca = canonicalish(a), cb = canonicalish(b);
  if (ca === cb) return out;
  const objectish = v => v && typeof v === "object" && !Array.isArray(v);
  if (objectish(a) && objectish(b)) {
    const keys = Array.from(new Set(Object.keys(a).concat(Object.keys(b)))).sort()
      .filter(k => !HOSTILE.has(k));
    keys.forEach(k => paths(a[k], b[k], at ? at + "." + k : k, out));
    return out;
  }
  out.push({ path: at || "(whole)", from: a, to: b });
  return out;
}
function canonicalish(v) { return JSON.stringify(v === undefined ? null : v); }

function asText(v) {
  if (v === undefined) return null;
  return typeof v === "string" ? v : JSON.stringify(v);
}

/* A WINDOW ON THE DIFFERENCE, NOT ON THE HEAD OF THE STRING.
 *
 * Truncating a changed body at its first seventy characters shows the seventy characters that
 * did not change, which is the one part of it nobody needs. Measured: a sentence appended to a
 * card body produced two identical excerpts and a diff that said a field had changed without
 * showing anything that had. So the window is centred on the first character where the two
 * sides part company, and a leading or trailing cut is marked with three plain dots in the lines.
 * The screen fades a cut end instead, so excerptParts() says which ends were cut beside the text. */
function excerptParts(from, to, n) {
  const a = asText(from), b = asText(to);
  const head = (s) => s === null ? { text: "(absent)", l: false, r: false }
    : { text: s.length > n ? s.slice(0, n) : s, l: false, r: s.length > n };
  if (a === null || b === null) return [head(a), head(b)];
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  const start = Math.max(0, i - Math.floor(n / 3));
  const win = (s) => ({ text: s.slice(start, start + n), l: start > 0, r: start + n < s.length });
  return [win(a), win(b)];
}
const dotted = (p) => (p.l ? "..." : "") + p.text + (p.r ? "..." : "");
function excerpt(from, to, n) { return excerptParts(from, to, n).map(dotted); }
function short(s, n) { return s.length > n ? s.slice(0, n) + "..." : s; }

/** `a` and `b` are format 2 documents. `canonical` is the engine's. */
function diffCatalogs(a, b, canonical, opts) {
  const o = opts || {};
  const eq = (x, y) => canonical(x === undefined ? null : x) === canonical(y === undefined ? null : y);

  const header = HEADER_FIELDS.filter(k => !eq(a[k], b[k]))
    .map(k => ({ field: k, from: a[k], to: b[k] }));

  const kinds = {};
  const at = byId(undated(a.tags)), bt = byId(undated(b.tags));
  const ac = byId(undated(a.cards)), bc = byId(undated(b.cards));
  const kindOf = (m, id) => String((m.get(id) || {}).kind || "tag");

  const tagAdded = Array.from(bt.keys()).filter(id => !at.has(id))
    .map(id => ({ id, kind: kindOf(bt, id) }));
  const tagRemoved = Array.from(at.keys()).filter(id => !bt.has(id))
    .map(id => ({ id, kind: kindOf(at, id) }));
  const tagChanged = [];
  at.forEach((x, id) => {
    if (!bt.has(id)) return;
    const y = bt.get(id);
    if (eq(x, y)) return;
    tagChanged.push({ id, kind: kindOf(at, id), fields: paths(x, y, "", []) });
  });

  const cardAdded = Array.from(bc.keys()).filter(id => !ac.has(id)).map(id => ({ id }));
  const cardRemoved = Array.from(ac.keys()).filter(id => !bc.has(id)).map(id => ({ id }));
  const cardChanged = [], cardMoved = [];
  ac.forEach((x, id) => {
    if (!bc.has(id)) return;
    const y = bc.get(id);
    if (eq(x, y)) return;
    const fields = paths(x, y, "", []);
    const shelf = fields.find(f => f.path === "shelf");
    if (shelf) cardMoved.push({ id, from: shelf.from, to: shelf.to });
    cardChanged.push({ id, fields });
  });

  kinds.shelves = { added: tagAdded.filter(t => t.kind === "shelf").length,
                    removed: tagRemoved.filter(t => t.kind === "shelf").length };
  kinds.requests = { added: tagAdded.filter(t => t.kind === "request").length,
                     removed: tagRemoved.filter(t => t.kind === "request").length };

  return {
    header,
    tags: { added: tagAdded, removed: tagRemoved, changed: tagChanged },
    cards: { added: cardAdded, removed: cardRemoved, changed: cardChanged, moved: cardMoved },
    kinds,
    same: !header.length && !tagAdded.length && !tagRemoved.length && !tagChanged.length
          && !cardAdded.length && !cardRemoved.length && !cardChanged.length,
    values: o.values !== false,
  };
}

/** The same report as lines a person reads. Deterministic: ids sort, nothing is timestamped.
 *  `opts.cuts`, an array, receives one entry per line: null, or {was, becomes} each {l, r}, the
 *  ends of that side the window cut, which the screen fades where the line prints dots. */
function diffLines(d, opts) {
  const o = opts || {};
  const width = o.width || 70;
  const values = d.values && o.values !== false;
  const out = [];
  const cuts = Array.isArray(o.cuts) ? o.cuts : null;
  let cut = null;
  const val = (f, t) => {
    if (!values) return "";
    const [a, b] = excerptParts(f, t, width);
    cut = { was: { l: a.l, r: a.r }, becomes: { l: b.l, r: b.r } };
    return "  " + dotted(a) + "  ->  " + dotted(b);
  };
  const push = (line) => { out.push(line); if (cuts) cuts.push(cut); cut = null; };
  d.header.slice().sort((x, y) => x.field.localeCompare(y.field))
    .forEach(h => push("header  " + h.field + val(h.from, h.to)));
  const sortId = (x, y) => String(x.id).localeCompare(String(y.id));
  d.tags.added.slice().sort(sortId).forEach(t => push("added   " + t.kind + " " + t.id));
  d.tags.removed.slice().sort(sortId).forEach(t => push("removed " + t.kind + " " + t.id));
  d.tags.changed.slice().sort(sortId).forEach(t => t.fields.forEach(f =>
    push("changed " + t.kind + " " + t.id + " " + f.path + val(f.from, f.to))));
  d.cards.added.slice().sort(sortId).forEach(c => push("added   card " + c.id));
  d.cards.removed.slice().sort(sortId).forEach(c => push("removed card " + c.id));
  d.cards.moved.slice().sort(sortId).forEach(c =>
    push("moved   card " + c.id + "  " + c.from + "  ->  " + c.to));
  d.cards.changed.slice().sort(sortId).forEach(c => c.fields
    .filter(f => f.path !== "shelf")
    .forEach(f => push("changed card " + c.id + " " + f.path + val(f.from, f.to))));
  return out;
}

/* THE SAME LINES, IN THREE COLUMNS: what changes, what it was, what it becomes. Board 479,
 * Maxim, 2026-09-18 - the archive's diff is shown in the Proposals renderer's three columns, and
 * it is PARSED FROM THE LINES ABOVE rather than built a second time from the report, so the
 * screen cannot come to show a change the command line does not print or print it differently.
 * One parser, here, for whoever wants the columns.
 *
 * THE PARSE IS TIMID, as the lint jump's in src/studio.mjs is: a line it cannot read whole goes
 * into `what` entire and leaves the other two columns empty, because a line shown as itself is
 * readable and a line cut in the wrong place is not. `was` and `becomes` are null rather than
 * empty where the LINE carries no values at all - an added card is a verb and an id - and the
 * renderer leaves those cells blank rather than writing "nothing" into them, which would be a
 * claim the line does not make.
 *
 * THE ONE AMBIGUITY IS NAMED RATHER THAN HIDDEN. The separator is two spaces, an arrow and two
 * spaces, and a card's own text may contain that; the first separator wins, so such a value
 * shows short. The line it was parsed from travels with the row for exactly this reason.
 */
const DIFF_ARROW = "  ->  ";
function parseDiffLine(line) {
  const raw = String(line == null ? "" : line);
  const out = { what: raw, was: null, becomes: null, line: raw };
  const m = /^(header|added|removed|changed|moved)\s+(\S[^]*)$/.exec(raw);
  if (!m) return out;
  const verb = m[1], rest = m[2];
  const whole = verb + " " + rest;
  /* The subject - a kind, an id, a field path - carries no double space, and val() puts one in
     front of the values it appends. So the first double space is the join, where there is one. */
  const cut = rest.indexOf("  ");
  if (cut < 0) { out.what = whole; return out; }
  const values = rest.slice(cut + 2);
  const at = values.indexOf(DIFF_ARROW);
  if (at < 0) { out.what = whole; return out; }
  out.what = verb + " " + rest.slice(0, cut);
  out.was = values.slice(0, at);
  out.becomes = values.slice(at + DIFF_ARROW.length);
  return out;
}

/** The rows of three columns over `lines`, each carrying the cut its line's `cuts` entry names. */
function diffRows(lines, cuts) {
  return lines.map((l, i) => Object.assign(parseDiffLine(l), { cut: (cuts && cuts[i]) || null }));
}

function summary(d) {
  return d.cards.added.length + " card(s) added, " + d.cards.removed.length + " removed, "
    + d.cards.changed.length + " changed (" + d.cards.moved.length + " moved shelf), "
    + (d.tags.added.length + d.tags.removed.length + d.tags.changed.length)
    + " tag change(s), " + d.header.length + " header field(s)";
}

export { diffCatalogs, diffLines, diffRows, parseDiffLine, summary, paths, excerpt, excerptParts, short,
         readCatalogDocument, catalogFromText, HEADER_FIELDS };
