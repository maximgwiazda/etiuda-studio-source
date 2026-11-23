/* FIND AND REPLACE, AND THE ACTS ON SEVERAL CARDS AT ONCE (board 834, step 10, C09).
 *
 * PURE FUNCTIONS OVER A DRAFT: nothing here reads a file or writes one. src/studio.mjs wraps each in
 * withDraft, so the draft is rewritten whole and hashed by the engine as every other verb's is.
 *
 * WHAT A PLACE IS, so a second tool could count the same: one match of the typed text, inside one
 * language's title or body of one card, or inside the catalog's quick facts. Notes and keywords are not
 * searched (FIELDS below is the one place that says so): keywords hold the words the text lacks, so the old
 * word there keeps a card findable after a rename. A match is whole-word when the typed text starts
 * or ends with a letter or a digit: the character before it and the one after it must then be neither
 * (any script, \p{L} and \p{N}). Case is folded unless asked otherwise.
 *
 * A TOKEN IS NEVER CUT: a match that starts or ends inside a {TOKEN} is not a place, and neither is one
 * lying wholly inside the braces, so searching PAX finds nothing in {PAX}. A match that takes a whole
 * token in (typing {PAX} itself, or a phrase round it) is a place.
 *
 * THE PAGE'S TICK IS PER ROW, and a row is one card or the facts; a row with several places is replaced
 * whole or not at all.
 */
import crypto from "node:crypto";

const FIELDS = ["title", "body"];
const FACTS_KEY = "@facts";
const TOKEN = /\{[^}\s]{1,40}\}/g;
const CONTEXT = 40;

/** A new card's id: "c-" and 32 lower-case hex digits, random and made once, never derived from a title. */
function newCardId() { return "c-" + crypto.randomBytes(16).toString("hex"); }

const isWord = (ch) => /[\p{L}\p{N}]/u.test(ch);

/** The typed text as a global regular expression, or null where there is nothing to look for. */
function matcherOf(find, o) {
  const text = String(find == null ? "" : find);
  if (!text) return null;
  const opts = o || {};
  const whole = opts.whole !== false;
  const body = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pre = whole && isWord(text[0]) ? "(?<![\\p{L}\\p{N}])" : "";
  const post = whole && isWord(text[text.length - 1]) ? "(?![\\p{L}\\p{N}])" : "";
  return new RegExp(pre + body + post, "gu" + (opts.matchCase ? "" : "i"));
}

function tokenSpans(text) {
  const out = [];
  TOKEN.lastIndex = 0;
  for (let m; (m = TOKEN.exec(text));) out.push([m.index, m.index + m[0].length]);
  return out;
}

/** Every place in one text: {start, end}, in order, none cutting a token. */
function placesOf(text, re) {
  const t = String(text == null ? "" : text);
  const spans = tokenSpans(t);
  const out = [];
  re.lastIndex = 0;
  for (let m; (m = re.exec(t));) {
    if (m[0] === "") { re.lastIndex++; continue; }
    const s = m.index, e = s + m[0].length;
    const cuts = spans.some(([a, b]) => s < b && e > a && !(s <= a && e >= b));
    if (!cuts) out.push({ start: s, end: e });
  }
  return out;
}

const flat = (s) => s.replace(/\s+/g, " ");
function context(text, p) {
  const from = Math.max(0, p.start - CONTEXT), to = Math.min(text.length, p.end + CONTEXT);
  return { pre: flat(text.slice(from, p.start)), preCut: from > 0,
           hit: text.slice(p.start, p.end),
           post: flat(text.slice(p.end, to)), postCut: to < text.length };
}

function langOrder(draft) {
  const out = (draft.langs || []).map(l => l && l.code).filter(Boolean);
  FIELDS.forEach(f => (draft.cards || []).forEach(c => Object.keys((c && c[f]) || {})
    .forEach(code => { if (out.indexOf(code) < 0) out.push(code); })));
  return out;
}

/** The rows with at least one place: [{key, kind, id, title, retired, places: [{field, lang, start, end,
 *  pre, hit, post}]}], the facts last, and the total of places. */
function findRows(draft, o) {
  const re = matcherOf(o && o.find, o);
  if (!re) return { rows: [], places: 0 };
  const primary = (((draft.langs || [])[0] || {}).code) || "en";
  const codes = langOrder(draft);
  const rows = [];
  (draft.cards || []).forEach((card) => {
    const places = [];
    FIELDS.forEach((field) => codes.forEach((lang) => {
      const text = String(((card[field] || {})[lang]) == null ? "" : card[field][lang]);
      placesOf(text, re).forEach(p => places.push(Object.assign({ field, lang }, p, context(text, p))));
    }));
    if (places.length) rows.push({ key: card.id, kind: "card", id: card.id,
      title: String(((card.title || {})[primary]) || card.id), retired: !!card.retired, places });
  });
  if (typeof draft.facts === "string") {
    const places = placesOf(draft.facts, re).map(p =>
      Object.assign({ field: "facts", lang: "" }, p, context(draft.facts, p)));
    if (places.length) rows.push({ key: FACTS_KEY, kind: "facts", id: "", title: "", retired: false, places });
  }
  return { rows, places: rows.reduce((n, r) => n + r.places.length, 0) };
}

function spliceIn(text, places, to) {
  let out = String(text);
  places.slice().sort((a, b) => b.start - a.start)
    .forEach(p => { out = out.slice(0, p.start) + to + out.slice(p.end); });
  return out;
}

/** Replaces every place in the rows named by `keys`, in the draft itself. Answers {places, cards, facts}. */
function replaceRows(draft, o, keys) {
  const want = new Set((keys || []).map(String));
  const to = String((o && o.replace) == null ? "" : o.replace);
  const found = findRows(draft, o);
  let places = 0, cards = 0, facts = false;
  found.rows.filter(r => want.has(r.key)).forEach((r) => {
    if (r.kind === "facts") { draft.facts = spliceIn(draft.facts, r.places, to); facts = true; }
    else {
      const card = draft.cards.find(c => c.id === r.id);
      FIELDS.forEach((field) => {
        const byLang = {};
        r.places.filter(p => p.field === field).forEach(p => (byLang[p.lang] = byLang[p.lang] || []).push(p));
        Object.keys(byLang).forEach(lang => {
          card[field] = Object.assign({}, card[field]);
          card[field][lang] = spliceIn(card[field][lang], byLang[lang], to);
        });
      });
      cards++;
    }
    places += r.places.length;
  });
  return { places, cards, facts };
}

/** Which of `ids` are not cards of this draft. */
function unknownIds(draft, ids) {
  const have = new Set((draft.cards || []).map(c => c.id));
  return ids.filter(id => !have.has(id));
}

/** Retires every card named that is not retired already. Answers how many. */
function retireMany(draft, ids) {
  const want = new Set(ids);
  let n = 0;
  (draft.cards || []).forEach(c => { if (want.has(c.id) && !c.retired) { c.retired = true; n++; } });
  return n;
}

/** Files every card named under `shelf`. Answers how many moved. */
function moveMany(draft, ids, shelf) {
  const want = new Set(ids);
  let n = 0;
  (draft.cards || []).forEach(c => { if (want.has(c.id) && c.shelf !== shelf) { c.shelf = shelf; n++; } });
  return n;
}

/** Takes every card named out of the draft. Answers how many went. */
function deleteMany(draft, ids) {
  const want = new Set(ids);
  const before = (draft.cards || []).length;
  draft.cards = (draft.cards || []).filter(c => !want.has(c.id));
  return before - draft.cards.length;
}

export { FIELDS, FACTS_KEY, newCardId, matcherOf, placesOf, findRows, replaceRows,
         unknownIds, retireMany, moveMany, deleteMany };
