/* A SHEET BROUGHT BACK INTO A CATALOG IN USE, MATCHED BY ITS id COLUMN (board 834, step 10, C09).
 *
 * THE SHEET IS A PATCH, NOT THE WHOLE CATALOG (Maxim, decisions 2026-10-01 00:20, 11a): a card the sheet
 * does not carry is left alone, so a sheet filtered to one category cannot retire the rest. The reading of
 * the file is src/import.mjs's, unchanged; this file only decides what the rows do to a draft, as a pure
 * function over the draft and what the importer read.
 *
 * WHAT A ROW DOES, by its id (existing ids never change):
 *   - the id is a card of the draft: each title, body and note the sheet gives, in a language the draft
 *     declares, replaces the draft's where the two differ once the sheet's own trimming is set aside; the
 *     keywords and the category likewise. A blank cell changes nothing, so a cell emptied by accident
 *     takes nothing away.
 *   - the id is not: a new card. An id the sheet wrote and the format accepts is kept; a row with none gets
 *     a random one (the caller's mint). It needs a title in the primary language and a category the sheet
 *     names, and is skipped, with its row number, where either is missing. A category the draft lacks is
 *     made, labelled as the sheet labels it.
 *   - a second row for an id the sheet already used is skipped.
 * NOT READ: the sheet's intents and role columns, and any language the draft does not declare.
 */
import { diffCatalogs, diffLines, diffRows } from "./diff.mjs";
import { primaryOf } from "./publish.mjs";

const clone = (v) => JSON.parse(JSON.stringify(v));
const textOf = (v) => String(v == null ? "" : v);
/* A sheet saved on Windows may carry CRLF inside a cell; a card's text has LF, and a line end alone is no change. */
const lines = (v) => textOf(v).replace(/\r\n?/g, "\n");

/** `inc` is src/import.mjs's answer for the file; `ctx` = { minted: Set of the ids the caller's mint made,
 *  mint: () => a fresh id }. */
function patchFromSheet(draft, inc, ctx) {
  const patched = clone(draft);
  const incoming = inc.catalog;
  const primary = primaryOf(patched);
  const declared = new Set((patched.langs || []).map(l => l.code));
  const cards = patched.cards = patched.cards || [];
  const tags = patched.tags = patched.tags || [];
  const byId = new Map(cards.map(c => [c.id, c]));
  const tagIds = new Set(tags.map(t => t.id));
  const was = new Set(cards.map(c => c.id));
  const notes = [], skippedLangs = new Set();
  const changed = [], added = [], unchanged = [];
  const ownSeen = new Set(), seen = new Set();
  const shelves = new Map();

  const shelfFor = (id) => {
    if (!id) return null;
    if (shelves.has(id)) return shelves.get(id);
    const have = tags.find(t => t.id === id && t.kind === "shelf");
    if (have) { shelves.set(id, id); return id; }
    const it = (incoming.tags || []).find(t => t.id === id && t.kind === "shelf");
    let nid = id;
    for (let n = 2; tagIds.has(nid) || byId.has(nid); n++) nid = id.slice(0, 64 - String(n).length - 1) + "-" + n;
    const label = {};
    Object.keys((it && it.label) || {}).forEach(code => { if (declared.has(code)) label[code] = it.label[code]; });
    if (!label[primary]) label[primary] = id.replace(/^t-/, "");
    tags.push({ id: nid, kind: "shelf", label });
    tagIds.add(nid); shelves.set(id, nid);
    return nid;
  };
  const langsOf = (map) => {
    const out = {};
    Object.keys(map || {}).forEach(code => {
      if (declared.has(code)) out[code] = lines(map[code]); else skippedLangs.add(code);
    });
    return out;
  };

  (incoming.cards || []).forEach((ic, i) => {
    const row = inc.rowNumbers[i];
    const mine = !ctx.minted.has(ic.id);
    if (mine) {
      const own = String(inc.ownIds[i] || "").replace(/_/g, "-");
      if (ownSeen.has(own)) { notes.push({ row, kind: "twice", id: own }); return; }
      ownSeen.add(own);
    }
    const card = byId.get(ic.id);
    if (card && mine) {
      seen.add(card.id);
      let did = false;
      let bodyChanged = false;
      ["title", "body", "note"].forEach((field) => {
        const give = langsOf(ic[field]);
        Object.keys(give).forEach((code) => {
          const to = textOf(give[code]);
          if (!to.trim()) return;
          if (textOf((card[field] || {})[code]).trim() === to.trim()) return;
          card[field] = Object.assign({}, card[field]); card[field][code] = to; did = true;
          if (field === "body") bodyChanged = true;
        });
      });
      if (ic.k && textOf(card.k).trim() !== lines(ic.k).trim()) { card.k = lines(ic.k); did = true; }
      if (inc.ownShelves[i]) {
        const s = shelfFor(ic.shelf);
        if (s && s !== card.shelf) { card.shelf = s; did = true; }
      }
      if (bodyChanged) {
        card.bodyShape = (ic.shape && ["plain", "steps", "alts"].includes(ic.shape))
          ? ic.shape
          : (ic.bodyShape || "plain");
      }
      (did ? changed : unchanged).push(card.id);
      return;
    }
    /* A NEW CARD. */
    const title = langsOf(ic.title);
    if (!textOf(title[primary]).trim()) { notes.push({ row, kind: "title" }); return; }
    if (!inc.ownShelves[i]) { notes.push({ row, kind: "category" }); return; }
    let id = ic.id;
    if (byId.has(id) || tagIds.has(id)) id = ctx.mint();
    const card2 = { id, shelf: shelfFor(ic.shelf), title };
    const body = langsOf(ic.body), note = langsOf(ic.note);
    if (Object.keys(body).length) card2.body = body;
    if (Object.keys(note).length) card2.note = note;
    card2.bodyShape = (ic.shape && ["plain", "steps", "alts"].includes(ic.shape))
      ? ic.shape
      : (ic.bodyShape || "plain");
    if (ic.k) card2.k = ic.k;
    cards.push(card2); byId.set(id, card2); tagIds.add(id);
    added.push({ id, row, title: title[primary] });
  });

  const missing = Array.from(was).filter(id => !seen.has(id));
  const titleOf = (id) => textOf(((byId.get(id) || {}).title || {})[primary]) || id;
  return { patched, changed, added, unchanged, notes,
    skippedLangs: Array.from(skippedLangs),
    missing: missing.map(id => ({ id, title: titleOf(id) })) };
}

/** The Archive's own three columns over the draft and what the sheet would make of it, the new cards left
 *  to the caller's rows of their own (an id nobody chose is no help to read). */
function sheetDiff(draft, patched, F) {
  const d = diffCatalogs(draft, patched, F.canonical, { values: true });
  const cuts = [];
  const all = diffLines(d, { values: true, width: 70, cuts });
  const keep = all.map(l => !/^added   card /.test(l));
  const lines = all.filter((l, i) => keep[i]);
  return { same: d.same, lines, rows: diffRows(lines, cuts.filter((c, i) => keep[i])) };
}

export { patchFromSheet, sheetDiff };
