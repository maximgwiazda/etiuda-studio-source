/* DATE MODIFIED (board 982, S1): WHEN A CARD, A CATEGORY OR AN INTENT WAS LAST CHANGED, WRITTEN AT PUBLISH.
 *
 * Maxim, 2026-11-11 00:53: "How about if we filled the space by adding more columns there? For example, "Date modified"
 * column, saying when said category or card was last modified." The desk shows the column (engine 6ee2ecd6); the date is
 * recorded where the change is made (Claude α's decision 1 of that night), so Studio writes it on each card, shelf and
 * request it publishes as changed, and the desk on the agent's own cards.
 *
 * THE FIELD is the engine's `changedAt`: an instant in UTC as Date.prototype.toISOString writes it, optional, on a card
 * and on a tag of kind shelf or request. The pinned reader (catalog-v2.js v2ChangedAt) takes nothing else and drops any
 * other value without a word, so dateOk() is its test word for word and nothing that fails it is ever written.
 *
 * WHERE A DATE COMES FROM, recorded facts only, never the clock at the moment of publishing, because two publishes of one
 * project must give the same bytes: the newest standing entry of changes.json that touched the object (its `at`); the
 * newest review acceptance since the last publish that landed a row on it (the review log's `at`), so a desk's
 * proposal is dated by its acceptance and never by the desk's own date; else, for a change Studio found only against the
 * edition (a file edited by hand), the project's `edited`. An object the same as in the edition before keeps the date it
 * had there, or none, so a catalog published before this field needs no conversion.
 *
 * A DATE IS NEVER A CHANGE. Every comparison of a card or a tag between the draft and an edition reads both through
 * undated(): the changes list, the rail's count, the press strip, the review, the audit and the release notes. Otherwise
 * a date would leave every published card changed for ever, and a desk's own date would be offered as a row to accept. */

const DATE_KEY = "changedAt";
const DATED_KINDS = new Set(["shelf", "request"]);
const CHANGES_FILE = "changes.json";

/** The date as the pinned reader keeps it, or "" where it would read as none. */
function dateOk(v) {
  const s = typeof v === "string" ? v : "";
  return /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(s) && Number.isFinite(Date.parse(s)) ? s : "";
}

const own = (x) => !!x && typeof x === "object" && !Array.isArray(x) && Object.prototype.hasOwnProperty.call(x, DATE_KEY);

/** A card or a tag without its date, or a list of them each without; anything else as it is. Never written back. */
function undated(v) {
  if (Array.isArray(v)) return v.some(own) ? v.map(undated) : v;
  if (!own(v)) return v;
  const out = Object.assign({}, v);
  delete out[DATE_KEY];
  return out;
}

/** A whole catalog with every card and tag undated, for a comparison of two whole documents. */
function undatedDoc(cat) {
  if (!cat || typeof cat !== "object") return cat;
  const out = Object.assign({}, cat);
  if (Array.isArray(cat.cards)) out.cards = undated(cat.cards);
  if (Array.isArray(cat.tags)) out.tags = undated(cat.tags);
  return out;
}

/** Two values the same by the engine's canonical form, a card's or a tag's date left out. */
function sameOf(F) {
  return (x, y) => F.canonical(undated(x === undefined ? null : x)) === F.canonical(undated(y === undefined ? null : y));
}

/* A CHANGE STILL STANDING is one whose cards or quick facts are not back as they were: a save and a save back inside
   the joining window leave an entry that changed nothing. The list and the rail's count both read through this, so the
   two cannot disagree (the test architect's read of 2026-10-07: a save and a save back answered 1 while the page
   listed 0). The rail counts what Studio made, as the page counts the list's n > 0. Here since board 982, because the
   publish dates an object by the newest standing entry that touched it, by this same rule. */
const standing = (e, same, i, list) => {
  const stands = (x) => !x.undone && (x.cards.some(c => !same(c.was, c.now))
    || !!(x.facts && !same(x.facts.was, x.facts.now))
    || !!(x.other && x.other.keys.some(k => !same(x.other.was[k], x.other.now[k]))));
  if (Array.isArray(list)) {
    const lastRoll = list.map(x => x.did && x.did.kind === "rollback" && stands(x)).lastIndexOf(true);
    if (lastRoll >= 0 && i < lastRoll) return false;
  }
  return stands(e);
};

const byId = (list) => new Map((Array.isArray(list) ? list : []).filter(x => x && x.id != null).map(x => [String(x.id), x]));

/** The ids of the tags that differ between two `tags` lists: added, gone, or changed. */
function tagsMoved(was, now, same) {
  const a = byId(was), b = byId(now), out = [];
  a.forEach((x, id) => { if (!b.has(id) || !same(x, b.get(id))) out.push(id); });
  b.forEach((x, id) => { if (!a.has(id)) out.push(id); });
  return out;
}

/** The object with its date set to `d`, or taken off where `d` is "": the same object where nothing moves. */
function withDate(x, d) {
  if (!x || typeof x !== "object") return x;
  if (d ? x[DATE_KEY] === d : !own(x)) return x;
  const out = Object.assign({}, x);
  if (d) out[DATE_KEY] = d; else delete out[DATE_KEY];
  return out;
}

/**
 * The cards and tags of `o.doc`, dated for an edition published after `o.before`.
 *   o.before       the last archived edition, or null before the first.
 *   o.doc          the catalog about to be published.
 *   o.journal      changes.json as it stands ({list}), or null where it does not belong to this edition.
 *   o.acceptances  the review log's entries since the last publish (acceptancesSince().reviews).
 *   o.parseKey     src/review.mjs parseKey, which reads a decision's key back into its scope and id.
 *   o.edited       the project's `edited`.
 *   o.F            the pinned engine's format module.
 * @returns {{cards?: object[], tags?: object[]}} only the lists the document has.
 */
function datesFor(o) {
  const same = sameOf(o.F);
  const touched = { card: new Map(), tag: new Map() };
  const note = (m, id, at) => {
    const d = dateOk(at);
    if (!d || id == null) return;
    const k = String(id), was = m.get(k);
    if (!was || Date.parse(d) > Date.parse(was)) m.set(k, d);
  };
  const list = o.journal && Array.isArray(o.journal.list) ? o.journal.list : [];
  list.forEach((e, i) => {
    if (!e || !Array.isArray(e.cards) || !standing(e, same, i, list)) return;
    e.cards.forEach(c => note(touched.card, c && c.id, e.at));
    if (e.other && Array.isArray(e.other.keys) && e.other.keys.indexOf("tags") >= 0)
      tagsMoved((e.other.was || {}).tags, (e.other.now || {}).tags, same).forEach(id => note(touched.tag, id, e.at));
  });
  (Array.isArray(o.acceptances) ? o.acceptances : []).forEach(r => {
    (Array.isArray(r && r.applied) ? r.applied : []).forEach(key => {
      const k = o.parseKey(key);
      if ((k.scope === "card" || k.scope === "tag") && k.id) note(touched[k.scope], k.id, r.at);
    });
  });
  const fallback = dateOk(o.edited);
  const before = o.before || {};
  const one = (x, prev, m) => {
    if (!x || typeof x !== "object" || x.id == null) return x;
    if (prev && same(prev, x)) return withDate(x, dateOk(prev[DATE_KEY]));
    return withDate(x, m.get(String(x.id)) || fallback);
  };
  const out = {};
  const doc = o.doc || {};
  if (Array.isArray(doc.cards)) {
    const was = byId(before.cards);
    out.cards = doc.cards.map(c => one(c, c && was.get(String(c.id)), touched.card));
  }
  if (Array.isArray(doc.tags)) {
    const was = byId(before.tags);
    out.tags = doc.tags.map(t => {
      if (!t || !DATED_KINDS.has(t.kind)) return t;
      const prev = was.get(String(t.id));
      return one(t, prev && prev.kind === t.kind ? prev : null, touched.tag);
    });
  }
  return out;
}

/**
 * `draft` with each card and tag that is the same as the edition's, dates aside, carrying the edition's date, so the
 * draft holds what the edition holds after a publish. Null where nothing moves. An object the person changed while the
 * publish ran is left as it is: its date is the next publish's to give.
 */
function datesIntoDraft(draft, edition, F) {
  const same = sameOf(F);
  let moved = false;
  const over = (list, from) => {
    const ed = byId(from);
    return list.map(x => {
      const e = x && x.id != null ? ed.get(String(x.id)) : null;
      if (!e || !same(e, x)) return x;
      const y = withDate(x, dateOk(e[DATE_KEY]));
      if (y !== x) moved = true;
      return y;
    });
  };
  const next = Object.assign({}, draft);
  if (Array.isArray(draft.cards)) next.cards = over(draft.cards, edition.cards);
  if (Array.isArray(draft.tags)) next.tags = over(draft.tags, edition.tags);
  return moved ? next : null;
}

export { DATE_KEY, DATED_KINDS, CHANGES_FILE, dateOk, undated, undatedDoc, sameOf, standing, tagsMoved, datesFor,
         datesIntoDraft };
