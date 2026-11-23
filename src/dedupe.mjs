/* THE ENGINE HAS TWO RULES ABOUT SAMENESS. THIS FILE HAS ITS OWN, WIDER, AND SAYS SO.
 *
 * The engine decides two things: a format 2 file may not claim one id twice (v2Problems), and
 * its lint flags one category carrying one title twice (lintCatalog, "same title as card N in
 * this category"), comparing titles with the surrounding space trimmed and nothing else folded.
 * Neither is re-implemented here, and neither is what this file's "exact" means.
 *
 * What the importer calls an EXACT duplicate is Studio's own rule, wider than the engine's in two
 * ways: the title is compared after the engine's `slug()`, so two titles differing only in case,
 * accents or punctuation are one here and two to the engine's lint; and there is a BODY rule, two
 * cards with one text anywhere in the pile, which the engine has no counterpart for. Both are
 * notes, not refusals: the import keeps both cards of every pair (board 801 c). They are found
 * BEFORE the file is written, so the author sees them as rows to merge rather than learning of
 * them from a lint on a file already made.
 *
 * (Until 2026-09-27 this header said exact duplicates were the engine's rule and that Studio
 * re-implemented neither, which the code below has never matched.)
 *
 * The engine has no near-duplicate rule at all - measured, 2026-09-17, by grep over the pinned
 * tree for a distance, a similarity or a shingle: nothing. So the rule below is new, and being
 * new it is stated in full rather than tuned until the fixture passes:
 *
 *   NORMALISATION is the engine's `slug()`, not one invented here: diacritics fold, case goes,
 *   every run of non-alphanumerics becomes one hyphen. Two cards differing only in an accent or
 *   in punctuation therefore normalise to one string, which is the behaviour the engine already
 *   has for ids and the behaviour an author expects.
 *
 *   SIMILARITY is the Sorensen-Dice coefficient over character bigrams: twice the shared
 *   bigrams over the total of both. It is symmetric, it is bounded at 0 and 1, it needs no
 *   quadratic edit matrix, and a one-character change in a fifteen-character title scores about
 *   0.93, which is why the threshold sits where it does.
 *
 *   A PAIR IS NEAR-DUPLICATE when its titles score at or above TITLE_NEAR, or its bodies score
 *   at or above BODY_NEAR. Either, not both: a pile usually carries the same answer under two
 *   titles, and it also carries two answers under one title, and both are worth the author's
 *   eye.
 *
 *   ONLY WITHIN A SHELF for the title rule, across the whole pile for the body rule. Two cards
 *   with the same title on different shelves are the normal shape of a catalog ("Opening" on
 *   each of four shelves); two cards with the same TEXT anywhere are a pile that was copied.
 *
 * COST. Each string's bigrams are counted once, and pairs are scored through an index
 * (`candidates`) that never visits a pair sharing no bigram, so a team's pile is checked in well
 * under a second; it finds exactly the pairs trying every pair would (tests/import.mjs 3f). The
 * ceiling below is still the stated one.
 */

/* THE REFUSALS A PERSON MEETS AT A SCREEN GO THROUGH refuse(), which keeps the English as
   the Error's message and carries the frame and its variables beside it so the page can say
   the same thing in Polish (board 523, src/refusal.mjs). A plain `throw new Error` below
   names a flag or reports a fault in this program, and stays English on purpose. */
import { refuse, counted } from "./refusal.mjs";

const TITLE_NEAR = 0.85;
const BODY_NEAR = 0.85;
const PAIR_CEILING = 4000000;

/** Character bigrams of a normalised string. A string under two characters has none, and two
 *  such strings are compared by equality rather than by a coefficient over nothing. */
function bigrams(s) {
  const out = new Map();
  for (let i = 0; i + 1 < s.length; i++) {
    const g = s.slice(i, i + 2);
    out.set(g, (out.get(g) || 0) + 1);
  }
  return out;
}

/** A string with its bigrams counted once, for every comparison it takes part in. */
function profile(s) {
  const grams = bigrams(s);
  let size = 0;
  grams.forEach(n => { size += n; });
  return { s, grams, size };
}

function diceOf(A, B) {
  if (A.s === B.s) return 1;
  if (A.s.length < 2 || B.s.length < 2) return 0;
  let shared = 0;
  A.grams.forEach((n, g) => { shared += Math.min(n, B.grams.get(g) || 0); });
  const total = A.size + B.size;
  return total ? (2 * shared) / total : 0;
}

function dice(a, b) { return diceOf(profile(a), profile(b)); }

/* EVERY PAIR SCORING `t` OR MORE, BY AN INDEX RATHER THAN BY TRYING EACH PAIR: each string's
 * bigrams go into a list per bigram, and a string arriving adds min(count, count) to every
 * earlier string on each list it is on, which is the shared count dice() would find, so a pair
 * is judged by the same arithmetic. Strings arrive shortest first, and one shorter than
 * t/(2-t) of the arriving one cannot reach t, so each list is read from the first that can.
 * `pr` are profiles in item order, `group` a key or null; adds i*n+j keys, i < j, to `out`. */
function candidates(pr, group, t, n, out) {
  const lists = new Map(), short = new Map();
  const acc = new Int32Array(n);
  const order = pr.map((P, i) => i).filter(i => pr[i] && pr[i].s)
    .sort((a, b) => (pr[a].size - pr[b].size) || (a - b));
  const pair = (a, b) => out.add(Math.min(a, b) * n + Math.max(a, b));
  order.forEach(i => {
    const P = pr[i];
    const g = group ? group(i) : "";
    if (!P.size) {
      const k = g + "\u241F" + P.s, was = short.get(k) || [];
      was.forEach(j => pair(j, i));
      short.set(k, was.concat([i]));
      return;
    }
    const least = t * P.size / (2 - t) - 1e-9;
    const met = [];
    P.grams.forEach((c, gram) => {
      const key = g + "\u241F" + gram;
      let list = lists.get(key);
      if (!list) { list = { from: 0, at: [], count: [] }; lists.set(key, list); }
      while (list.from < list.at.length && pr[list.at[list.from]].size < least) list.from++;
      for (let q = list.from; q < list.at.length; q++) {
        const j = list.at[q];
        if (!acc[j]) met.push(j);
        acc[j] += Math.min(c, list.count[q]);
      }
      list.at.push(i); list.count.push(c);
    });
    met.forEach(j => {
      if ((2 * acc[j]) / (pr[j].size + P.size) >= t) pair(j, i);
      acc[j] = 0;
    });
  });
  return out;
}

/** `items` are `{ ref, shelf, title, body }`; `slug` is the engine's, handed in rather than
 *  imported so this file has no opinion about where the engine lives. */
function findDuplicates(items, slug) {
  const n = items.length;
  if ((n * (n - 1)) / 2 > PAIR_CEILING)
    throw refuse("{ROWS} is {PAIRS}, past this rule's stated ceiling of {N}; a pile this size"
      + " needs a blocking index rather than a longer wait", {
        ROWS: counted(n, "{N} row", "{N} rows"),
        PAIRS: counted(Math.round((n * (n - 1)) / 2), "{N} pair", "{N} pairs"),
        N: PAIR_CEILING });
  const norm = items.map(it => ({
    ref: it.ref, shelf: String(it.shelf || ""),
    title: slug(String(it.title || ""), 200),
    body: slug(String(it.body || ""), 4000),
  }));

  /* Exact first, so a pair reported as near is never also a pair that is simply the same: the
     author is shown one finding per pair, and the stronger one. */
  const exact = [];
  const byKey = new Map();
  norm.forEach((x, i) => {
    const k = x.shelf + "\u241F" + x.title;
    if (!x.title) return;
    if (byKey.has(k)) exact.push({ of: items[byKey.get(k)].ref, twin: x.ref, on: "shelf+title" });
    else byKey.set(k, i);
  });
  const byBody = new Map();
  norm.forEach((x, i) => {
    if (!x.body) return;
    if (byBody.has(x.body)) {
      const of = items[byBody.get(x.body)].ref;
      if (!exact.some(e => e.twin === x.ref && e.of === of))
        exact.push({ of: of, twin: x.ref, on: "body" });
    } else byBody.set(x.body, i);
  });
  const settled = new Set(exact.map(e => e.twin + "\u241F" + e.of));

  const near = [];
  const titles = norm.map(x => (x.title ? profile(x.title) : null));
  const bodies = norm.map(x => (x.body ? profile(x.body) : null));
  const pairs = new Set();
  candidates(titles, i => norm[i].shelf, TITLE_NEAR, n, pairs);
  candidates(bodies, null, BODY_NEAR, n, pairs);
  /* In item order, pair by pair, as trying every pair would list them. */
  Array.from(pairs).sort((x, y) => x - y).forEach(key => {
    const i = Math.floor(key / n), j = key % n;
    const a = norm[i], b = norm[j];
    if (settled.has(b.ref + "\u241F" + a.ref) || settled.has(a.ref + "\u241F" + b.ref)) return;
    const sameShelf = a.shelf === b.shelf;
    const t = (sameShelf && a.title && b.title) ? diceOf(titles[i], titles[j]) : 0;
    const d = (a.body && b.body) ? diceOf(bodies[i], bodies[j]) : 0;
    if (t >= TITLE_NEAR || d >= BODY_NEAR)
      near.push({ of: a.ref, twin: b.ref,
                  title: Math.round(t * 1000) / 1000, body: Math.round(d * 1000) / 1000,
                  on: t >= TITLE_NEAR && d >= BODY_NEAR ? "title and body"
                    : (t >= TITLE_NEAR ? "title" : "body") });
  });
  return { exact, near, thresholds: { title: TITLE_NEAR, body: BODY_NEAR } };
}

export { findDuplicates, dice, bigrams, candidates, profile, TITLE_NEAR, BODY_NEAR,
         PAIR_CEILING };
