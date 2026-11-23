/* A SHAPELESS TEXT FILE OF REPLIES INTO PROPOSALS. Board 602, and 604's ruling about what an
 * importer may do to the words it found.
 *
 *     import { importText, writeTextImport } from "./src/import-text.mjs";
 *     const { catalog, report } = await importText({ file, ask, langs });
 *
 * WHAT THIS ANSWERS. A customer with no export has a text file of replies and today their first
 * hour is typing cards. A model finds the boundaries between the replies, titles each one,
 * guesses its language, normalises the platform placeholders in it and groups the cards into
 * categories and intents. Nothing is written into a catalog by this file: what comes out is a
 * DRAFT document and a report, which a caller may land in a project's inbox, where the review
 * queue offers it card by card and the acceptance record stamps who took each one. That is 602's
 * whole point - the manager stays the author.
 *
 * NO MODEL IS NAMED HERE AND STUDIO SHIPS NONE (Maxim's ruling of 2026-09-28 13:19: Etiuda's own
 * code calls no model). This file asks a function it is handed for text and reads what comes
 * back; a test hands it a stub, and nothing in the package does otherwise.
 *
 * ---- WHAT IS REFUSED, AND WHY IT IS REFUSED HERE RATHER THAN AT A SCREEN --------------------
 *
 * 604, Maxim 2026-09-19 21:37. A proposed body has three possible states, not two:
 *
 *   verbatim   the words are in the file. Nothing is marked and nothing has to be.
 *   reworded   the model changed the words, and the span carries the ORIGINAL it replaced, so
 *              the review can highlight it and put it back in one press, byte for byte.
 *   invented   a span with no source at all. REFUSED, before a person ever sees it.
 *
 * THE CHECK IS DETERMINISTIC AND COMES BEFORE ANYTHING ELSE. A span's source is `was` where the
 * model says it reworded and the span's own text where it does not, and that string must be a
 * substring of the file the span came from. No model is consulted about it, no score is
 * involved, and it runs before a card is built, before the placeholders are touched and before
 * a single byte is written: a refused card is not a card this program ever had. The scorer in
 * tools/import-bench/score.mjs counts invention first for the same reason and by the same rule, so the gate and
 * the product cannot disagree about what an invention is.
 *
 * A SPLICE IS NOT AN INVENTION AND IS NOT SILENT EITHER. Two real sentences from opposite ends
 * of the file, joined, are two sourced spans, so the ruling lets them through; but the joined
 * body is then not a substring of anything, which is exactly what the scorer will call an
 * invention when it scores the file. So a body whose spans are all sourced and which is not
 * itself in the file is counted as `spliced` and named in the report. The prompt asks for one
 * span per body unless there is a rewording, and the number says how often that was obeyed.
 *
 * ---- A SPAN MAY BE TWO ANCHORS RATHER THAN THE WORDS ------------------------------------------
 *
 * MEASURED, 2026-09-21: the employer's catalog flattens to 220 kB, and a model asked to copy
 * every reply back out would have to write those 220 kB, which is several times what any of
 * these models will emit in one answer. A pipeline that can only read a file it can also
 * reproduce is a pipeline that stops at about a tenth of a real catalog, and the feature is for
 * customers whose files are real.
 *
 * SO A SPAN MAY INSTEAD BE `{from, to, chars}`: the first characters of the run, the last
 * characters of it, and roughly how long it is. This file finds them in the source and the span
 * IS that slice, which makes it verbatim by construction rather than by a check - the check
 * still runs, and passes trivially, because a guard that is switched off for the fast path is a
 * guard that protects nothing. What the answer costs drops from the size of the file to about
 * a hundred characters a card.
 *
 * THE RESOLUTION IS DETERMINISTIC AND HAS A CURSOR. Replies are read in the order they stand in
 * the file, so the head anchor is looked for from where the last span ended and only then back
 * from there, nearest first; `chars` picks between several candidate tails by which one lands nearest the
 * length the model said. An anchor that is not in the file at all is exactly the same refusal
 * as an invented span, because it is one: the model has described a passage the file has not
 * got.
 *
 * ---- WHAT IS MARKED --------------------------------------------------------------------------
 *
 * Every change to the words the file held carries where it is in the proposed body, how long it
 * is, and what was there before. Two kinds, and the machinery is the same for both:
 *
 *   reword       the model's own rewording, allowed only when the caller asked for it
 *   placeholder  a platform token turned into the engine's, which changes the bytes as surely
 *                as a rewording does and has to be as reversible
 *
 * A MARK IS AN OFFSET INTO THE PROPOSED BODY, NEVER INTO THE SOURCE FILE. The review holds the
 * proposed body and shows it; a mark into the file it came from would be useless there, and the
 * file is not carried with the proposal. `markSegments` cuts the body into the runs a
 * highlighter paints, and `revertMark` undoes one mark and shifts the ones after it, which is
 * the "one press" of the ruling: press it and the original bytes are back and the rest of the
 * marks still point where they should.
 *
 * ---- WHAT IS NOT DECIDED HERE ------------------------------------------------------------------
 *
 * Ids, slugs, the content hash and every lint rule come from the pinned engine through
 * src/engine.mjs, as they do in src/import.mjs. The placeholder table is src/placeholders.mjs's.
 * The review queue and the acceptance record are src/review.mjs's. This file is the boundary
 * check, the marks, and the shape of the draft.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import * as Engine from "./engine.mjs";
import { decode } from "./csv.mjs";
import { translateSpans, verify as verifyPlaceholders } from "./placeholders.mjs";
import { awaitingOver, lintBlock } from "./import.mjs";
import { refuse, refusalOf, noteOf, counted } from "./refusal.mjs";
import { lintSaid, importLintSaid } from "./lint-said.mjs";

const SCHEMA = 1;
const REPORT_KIND = "etiuda-studio-text-import-report";
/* THE GENERAL SHELF, WHICH IS THE ONE KEY THIS FILE MINTS ITSELF: where a card names no
   category, and where the category it named holds only itself. */
const FALLBACK = "imported";

/* ---- the prompt -------------------------------------------------------------------------------
 *
 * ONE PROMPT, AND EVERY RULE IN IT IS ALSO CHECKED IN CODE BELOW. A prompt is a request and not
 * a guarantee: a model that ignores the verbatim rule has its cards refused rather than its
 * instruction repeated more loudly. What the prompt buys is a HIGHER rate of proposals that
 * survive the check, which is the whole of what a prompt can buy.
 *
 * IT ASKS FOR ONE SPAN PER BODY unless something was reworded, because the scorer measures a
 * whole body against the file and a body stitched from two places is not in the file even when
 * both halves are.
 *
 * AND IT ASKS FOR ANCHORS RATHER THAN THE WORDS, for the reason written at the head of this
 * file: a real catalog's replies do not fit in an answer. The words are still accepted, for a
 * short reply and for the case where a model ignores this, and both shapes go through the same
 * check.
 */
const PROMPT_VERBATIM = [
  "You are splitting one plain text file into support reply cards for a catalog.",
  "",
  "Answer with JSON and nothing else. No prose before it, no prose after it, no code fence.",
  "",
  "The shape:",
  '{"cards":[{"title":{"<lang>":"..."},"category":"<short-key>",',
  '  "categoryLabel":{"<lang>":"..."},"intents":["<what the customer asked>"],',
  '  "bodies":[{"lang":"<code>","spans":[{"from":"...","to":"...","chars":0}]}]}]}',
  "",
  "Rules you must not break:",
  "1. DO NOT COPY THE REPLIES OUT. Point at them. A span is three fields:",
  '     "from"   the first 40 characters of the reply, copied EXACTLY',
  '     "to"     the last 40 characters of the reply, copied EXACTLY',
  '     "chars"  roughly how many characters the whole reply is',
  "   Both anchors must be character for character what the file has, punctuation, accents",
  "   and placeholder tokens included, or the card is thrown away. A reply shorter than 80",
  '   characters may instead be given whole, as {"text":"..."}, copied exactly.',
  "2. Give each body ONE span: one reply, from its first character to its last.",
  "3. Do not include headings, separators or blank lines between replies in any span.",
  "4. A reply that appears in two languages is ONE card with two bodies, one per language.",
  "   In this kind of file the two usually stand one after the other. Do not make two cards",
  "   out of them, and do not translate anything yourself.",
  "5. PREFER FEWER, LONGER CARDS. A card is one whole canned reply an agent would paste in",
  "   one go, from its greeting to its sign-off. A reply often runs to several paragraphs,",
  "   and A BLANK LINE INSIDE A REPLY IS NOT A BOUNDARY: a new card starts where a new",
  "   subject starts, not where a paragraph ends. Splitting one reply into several cards is",
  "   the commonest way to get this wrong.",
  "6. <lang> is a two-letter code, lower case.",
  "7. A title is yours to write and is the one thing here that need not be in the file.",
  "8. A category key is lower case letters, digits and hyphens. Use a handful of categories",
  "   for the whole file, not one per card.",
  "9. An intent is the short clause a customer's question takes, in the card's own language.",
  "",
  "Cover the whole file. Every reply in it should be one card.",
].join("\n");

/* THE SECOND PROMPT, AND IT IS THE ONLY PLACE REWORDING IS ASKED FOR. Rewording is allowed on
   two conditions (604) and both are kept by the code below, not by these words: the span
   carries the original, and the original is checked against the file like any other source. A
   span that reworded something the file does not contain is an invention wearing a `was`. */
const PROMPT_REWORD = PROMPT_VERBATIM.replace(
  "2. Give each body ONE span: one reply, from its first character to its last.",
  ['2. Give each body ONE anchor span where you left the reply alone. Where you improved the',
   '   wording, give that body several spans in order instead: {"text":"<your wording>",',
   '   "was":"<the exact original you replaced, copied character for character from the file>"}',
   '   for each piece you changed, and plain anchor spans for the pieces you did not. The',
   '   spans, joined in order, are the proposed body. Every `was` must be in the file exactly.',
   '   Improve wording sparingly: everything you change is shown to the owner as a change.',
  ].join("\n"));

/* ---- THE FILING THE OWNER ALREADY HAS ----------------------------------------------------------
 *
 * MEASURED 2026-09-21 AND IT IS THE WORST NUMBER THIS FEATURE HAS. Asked with no idea where it
 * was landing, the model filed 133 cards under 45 categories of its own and 204 intents of its
 * own, and matched the owner's on 3 categories of 38 and 0 intents of 30. Nothing it proposed was
 * untrue; it simply was not this owner's filing, and a hundred and fifty pounds of vocabulary
 * nobody uses is a worse gift than none.
 *
 * THE IMPORT LANDS IN A PROJECT AND THE PROJECT HAS THAT FILING. So the prompt carries it: the
 * keys and labels of the categories that exist and the exact wording of the intents that exist,
 * with the instruction to use one where it fits and to invent only where none does. That block is
 * the owner's own words, so it costs what their filing is worth - about 5.5 kB for a catalog of
 * 258 cards, 24 categories and 150 intents - and it is sent once per piece.
 *
 * AN EMPTY PROJECT GETS THE PROMPT IT ALWAYS GOT. There is nothing to list, so the block is empty
 * and every word of the instruction about it is absent too: an import into a new project must
 * still come back with a usable filing of its own, and a prompt that asked a model to choose from
 * an empty list would be worse than one that never mentioned the subject.
 */
function knownBlock(known) {
  const cats = (known && Array.isArray(known.categories) ? known.categories : [])
    .map(c => ({ key: String((c && c.key) == null ? "" : c.key).trim(),
                 label: String((c && c.label) == null ? "" : c.label).trim() }))
    .filter(c => c.key);
  const ints = (known && Array.isArray(known.intents) ? known.intents : [])
    .map(clauseKey).filter(Boolean);
  if (!cats.length && !ints.length) return "";
  const out = ["", "This import lands in a catalog that already has a filing of its own, and"
    + " matching it matters more than inventing a better one."];
  if (cats.length) {
    out.push("", "THE CATEGORIES IT ALREADY HAS. Where a reply belongs under one of these, give"
      + " that key exactly as written here. Invent a new key only where none of them fits:");
    cats.forEach(c => out.push('  "' + c.key + '"' + (c.label ? "   " + c.label : "")));
  }
  if (ints.length) {
    out.push("", "THE INTENTS IT ALREADY HAS. Where one of these is what the customer asked,"
      + " write it back exactly as it stands here rather than in your own words:");
    ints.forEach(c => out.push("  " + c));
  }
  out.push("");
  return out.join("\n");
}

/** The filing a project's draft catalog already holds, in the shape `known` takes. */
function knownFiling(catalog, primary) {
  const tags = (catalog && catalog.tags) || [];
  const lang = String(primary || (catalog && catalog.commentLang) || "");
  const pick = (m) => {
    if (!m) return "";
    if (lang && m[lang]) return String(m[lang]);
    const k = Object.keys(m)[0];
    return k ? String(m[k]) : "";
  };
  return {
    categories: tags.filter(t => t && t.kind === "shelf")
      .map(t => ({ key: String(t.id), label: pick(t.label) })),
    intents: tags.filter(t => t && t.kind === "request")
      .map(t => pick(t.clause)).filter(Boolean),
  };
}

function promptFor(reword, known) {
  return (reword ? PROMPT_REWORD : PROMPT_VERBATIM) + knownBlock(known);
}

/* ---- reading the answer ------------------------------------------------------------------------
 *
 * A MODEL WRAPS JSON IN THINGS. The prompt says not to and they do it anyway, so the parser
 * takes the outermost braces and tries those; anything else is a refusal naming what came back
 * by its length, never by quoting it, because the answer is the customer's own content.
 */
function parseLoose(text, ok) {
  const raw = String(text == null ? "" : text).trim();
  const fenced = raw.replace(/^```[a-z]*\s*/i, "").replace(/\s*```$/, "");
  const tries = [raw, fenced];
  const a = fenced.indexOf("{"), b = fenced.lastIndexOf("}");
  if (a >= 0 && b > a) tries.push(fenced.slice(a, b + 1));
  for (const t of tries) {
    try {
      const doc = JSON.parse(t);
      if (ok(doc)) return doc;
    } catch { /* the next shape */ }
  }
  return null;
}

function parseProposal(text) {
  return parseLoose(text, doc => doc && Array.isArray(doc.cards));
}

/* ---- the marks ---------------------------------------------------------------------------------
 *
 * Kept as plain data, sorted by offset and never overlapping, so that every operation on them is
 * a slice and nothing has to parse anything.
 */

/** The body cut into the runs a highlighter paints: `mark` is null for untouched text and the
 *  mark itself for a run that was changed. The runs, joined, are the body. */
function markSegments(body, marks) {
  const s = String(body == null ? "" : body);
  const list = (marks || []).slice().sort((x, y) => x.at - y.at);
  const out = [];
  let read = 0;
  list.forEach(m => {
    if (m.at > read) out.push({ text: s.slice(read, m.at), mark: null });
    out.push({ text: s.slice(m.at, m.at + m.len), mark: m });
    read = m.at + m.len;
  });
  if (read < s.length) out.push({ text: s.slice(read), mark: null });
  return out;
}

/** ONE PRESS. The i-th mark undone, the original bytes back in place, and every mark after it
 *  moved by the difference in length so the rest still point where they should. The mark itself
 *  is gone from the list, because a reverted span is not a change any more. */
function revertMark(body, marks, i) {
  const s = String(body == null ? "" : body);
  const list = (marks || []).slice().sort((x, y) => x.at - y.at);
  const m = list[i];
  if (!m) return { text: s, marks: list };
  const was = String(m.was == null ? "" : m.was);
  const text = s.slice(0, m.at) + was + s.slice(m.at + m.len);
  const shift = was.length - m.len;
  const rest = list.filter((_, k) => k !== i)
    .map(x => x.at > m.at ? Object.assign({}, x, { at: x.at + shift }) : x);
  return { text, marks: rest };
}

/** Every mark undone, which is the body as the file holds it. */
function revertBody(body, marks) {
  let text = String(body == null ? "" : body);
  let list = (marks || []).slice().sort((x, y) => x.at - y.at);
  while (list.length) {
    const r = revertMark(text, list, list.length - 1);
    text = r.text; list = r.marks;
  }
  return text;
}

/* ---- the file in pieces ------------------------------------------------------------------------
 *
 * A REAL FILE DOES NOT FIT IN ONE ANSWER EVEN WHEN THE ANSWER IS ANCHORS. The employer's catalog
 * flattens to 220 kB over 516 replies; at about 110 bytes an anchor span that is 57 kB of JSON,
 * which is past what these models will emit in one turn, and the input alone is most of a
 * context. So the file is cut into pieces and each piece is asked for on its own.
 *
 * A REPLY IS NEVER SPLIT ACROSS TWO PIECES. Split, it would be proposed twice, each half a card.
 * Nothing in the text can say where a reply ends: replies hold blank lines, and two replies may
 * stand a single newline apart. Only an answer says it, and not the answer about the reply the
 * piece's end cut off, which a model may card in any number of fragments. So the next piece begins
 * where the answer's last card begins (`holdBack`), and its own answer confirms that cut: the card
 * it begins with must end inside the piece before. Where it runs on past, the cut is moved back a
 * card and the next piece asked again. Where no card is left to cut before, the piece is asked
 * again twice as long: a piece too big is a worse answer, a reply cut in half is a wrong one.
 *
 * THE CHECK DOES NOT MOVE. Every span, from every piece, is checked against the WHOLE file, so
 * nothing about this cutting can let an invention through: a piece is a smaller question, not a
 * smaller guard.
 */
/** The piece that begins at `at`, ending at the last blank line before `at + chars`. */
function pieceAt(source, at, chars) {
  const src = String(source == null ? "" : source);
  const max = +chars > 0 ? +chars : 0;
  if (at > 0) while (src[at] === "\n") at++;
  if (!max || src.length - at <= max) return { at, text: src.slice(at), last: true };
  let cut = src.lastIndexOf("\n\n", at + max);
  if (cut <= at) {
    const next = src.indexOf("\n\n", at + max);
    cut = next < 0 ? src.length : next;
  }
  const last = !src.slice(cut).trim();
  return { at, text: last ? src.slice(at) : src.slice(at, cut), last };
}

/** The count of parts `source` will be cut into by `pieceAt` with `chunkChars`. */
function importPieceCount(source, chunkChars) {
  const src = String(source == null ? "" : source);
  const max = +chunkChars > 0 ? +chunkChars : 0;
  if (!max || src.length <= max) return 1;
  let count = 0;
  for (let from = 0; ; count++) {
    const piece = pieceAt(src, from, max);
    if (!piece.text.trim()) {
      if (piece.last) break;
      from = piece.at + piece.text.length;
      count--;
      continue;
    }
    if (piece.last) { count++; break; }
    from = piece.at + piece.text.length;
  }
  return count || 1;
}

/** Where each card of a piece's answer stands in the piece, as `{from, to}`; -1 where it cannot
 *  be placed there. */
function placeCards(piece, cards) {
  const cursor = { at: 0, lead: 0, held: [] };
  return cards.map(c => {
    let from = -1, to = -1;
    (Array.isArray(c && c.bodies) ? c.bodies : []).forEach((b, i) => {
      const r = checkSpans(b && b.spans, piece.text, { reword: true, cursor, opens: !i });
      if (!r.ok || r.at < 0) return;
      if (from < 0 || r.at < from) from = r.at;
      if (r.end > to) to = r.end;
    });
    return { from, to };
  });
}

/**
 * The cards of a piece's answer to keep, and where the next piece begins: `next` is the offset in
 * the file of the last card beginning before `before` (the file offset of a cut already refused),
 * or of an earlier card reaching into it; "grow" where that card is the piece's first, or no card
 * begins before `before`; "end" where no card could be placed in the piece at all.
 */
function holdBack(piece, cards, before) {
  const where = placeCards(piece, cards);
  const bound = before == null ? Infinity : before - piece.at;
  let cut = -1;
  where.forEach(w => { if (w.from > cut && w.from < bound) cut = w.from; });
  if (cut < 0 && before != null) return { keep: [], held: cards.length, next: "grow" };
  if (cut < 0) return { keep: cards, held: 0, next: "end" };
  for (let moved = true; moved;) {
    moved = false;
    where.forEach(w => {
      if (w.from >= 0 && w.from < cut && w.to > cut) { cut = w.from; moved = true; }
    });
  }
  if (!piece.text.slice(0, cut).trim()) return { keep: [], held: cards.length, next: "grow" };
  const keep = cards.filter((c, i) => where[i].from < cut);
  return { keep, held: cards.length - keep.length, next: piece.at + cut };
}

/* ---- the check ---------------------------------------------------------------------------------
 *
 * THE WHOLE GUARD, IN ONE FUNCTION, WITH NO MODEL AND NO NETWORK IN IT. Given the spans a model
 * proposed and the source file, either the body and its marks, or the reason this card is
 * refused. Called before anything is built and before anything is written.
 */
/**
 * A `{from, to, chars}` anchor pair resolved to the run of the source it names, as
 * `{text, at, end}`, or null where the file has no such run. `cursor.at` is where the last span
 * ended and is moved on.
 *
 * WHY THE TAIL IS CHOSEN BY LENGTH AND NOT BY BEING THE FIRST. "Kind regards" ends half the
 * replies in a support catalog, so the first occurrence of a tail anchor after the head is very
 * often the end of the WRONG reply, and the span would then swallow everything between them.
 * `chars` is the model's own estimate of the length and it only has to be closer to the right
 * end than to any other candidate, which is a far weaker thing to ask of it than counting.
 *
 * THE HEAD IS TAKEN IN READING ORDER: from the cursor on, then back from it, nearest first; the
 * first whose run is within a quarter of `chars` wins, else the first within three times it.
 * A card whose languages interleave leaves the cursor past its head, and the file's first
 * occurrence of a repeated opening is then another reply, with everything between swallowed.
 * No run near the length given is the refusal an anchor the file has not got is (board 771).
 *
 * A from or a to shorter than 40 characters is refused on its own, and so is a chars that is
 * missing, zero or negative. The first tail is not used in their place. A run that is only
 * near the length, not within a quarter of it, comes back with loose set, and the import
 * counts that body the way it counts a splice.
 */
const ANCHOR_MIN = 40;

function resolveAnchor(sp, src, cursor) {
  const from = String(sp.from == null ? "" : sp.from);
  const to = String(sp.to == null ? "" : sp.to);
  if (!from || !to) return null;
  if (from.length < ANCHOR_MIN || to.length < ANCHOR_MIN || !(+sp.chars > 0)) return { refused: from.length < ANCHOR_MIN || to.length < ANCHOR_MIN ? "anchor shorter than 40" : "anchor without a length" }; /* plant:anchor-floor */
  const chars = +sp.chars > 0 ? +sp.chars : null;
  const tail = (i) => {
    const want = chars == null ? null : i + chars;
    const floor = i + from.length;
    let best = -1;
    for (let j = src.indexOf(to, i); j >= 0; j = src.indexOf(to, j + 1)) {
      const end = j + to.length;
      if (end < floor) continue;
      if (best < 0) { best = end; if (want == null) break; continue; }
      if (Math.abs(end - want) < Math.abs(best - want)) best = end;
      /* Past the estimate and getting further away: every later occurrence is worse. */
      if (end > want && best <= end) break;
    }
    return best;
  };
  const close = (len) => chars == null || Math.abs(len - chars) <= chars / 4 + 40;
  const near = (len) => chars == null || (len <= 3 * chars + 200 && 3 * len + 200 >= chars);
  const heads = [];
  for (let i = src.indexOf(from, cursor.at); i >= 0; i = src.indexOf(from, i + 1)) heads.push(i);
  for (let i = cursor.at > 0 ? src.lastIndexOf(from, cursor.at - 1) : -1; i >= 0;
       i = i > 0 ? src.lastIndexOf(from, i - 1) : -1) heads.push(i);
  const runs = heads.map(head => ({ head, end: tail(head) })).filter(r => r.end >= 0);
  const pick = runs.find(r => close(r.end - r.head)) || runs.find(r => near(r.end - r.head));
  if (!pick) return null;
  const len = pick.end - pick.head;
  cursor.at = pick.end;
  return { text: src.slice(pick.head, pick.end), at: pick.head, end: pick.end, loose: !close(len) };
}

function checkSpans(spans, source, o) {
  const opts = o || {};
  const src = String(source == null ? "" : source);
  const list = Array.isArray(spans) ? spans : [];
  if (!list.length) return { ok: false, why: "no spans" };
  const cursor = opts.cursor || { at: 0 };
  let body = "";
  const marks = [];
  let anchored = 0;
  /* WHERE IN THE SOURCE THIS BODY CAME FROM, which the second pass below needs and nothing
     else uses. `at` is the start of the first span and `end` the end of the last; a body that
     is a single unbroken run of the file satisfies src.slice(at, end) === body, and one that
     was reworded or stitched from two places does not. That equality is the whole test the
     joiner is allowed to trust. */
  let first = -1, last = -1, loose = false;
  const seen = (a, b) => {
    if (first < 0 || a < first) first = a;
    if (b > last) last = b;
  };
  for (let i = 0; i < list.length; i++) {
    let sp = list[i] || {};
    let byAnchor = false;
    if (sp.text == null && sp.from != null && sp.to != null) {
      const got = resolveAnchor(sp, src, cursor);
      if (got && got.refused) return { ok: false, why: got.refused, at: i, anchor: true };
      if (got == null) return { ok: false, why: "invented", at: i, anchor: true };
      sp = { text: got.text };
      byAnchor = true;
      anchored++;
      seen(got.at, got.end);
      if (got.loose) loose = true;
    }
    const text = String(sp.text == null ? "" : sp.text);
    const hasWas = sp.was != null && String(sp.was) !== "";
    const was = hasWas ? String(sp.was) : text;
    if (!text && !hasWas) return { ok: false, why: "an empty span", at: i };
    /* THE ONE CHECK. A span's source is what it says it replaced, or its own text where it
       replaced nothing, and that string is either in the file or this card does not exist. */
    const where = src.indexOf(was);
    if (where < 0) return { ok: false, why: "invented", at: i };
    /* THE CURSOR MOVES FOR EVERY SPAN, not only for an anchored one. A card given as words
       followed by a card given as anchors would otherwise have the second looked for from
       before the first, and a head anchor that repeats would resolve backwards. */
    if (!byAnchor) {
      /* A CARD'S FIRST SPAN, GIVEN AS WORDS, is looked for from where the card before it began,
         at text no span holds yet: half of a card whose languages interleave begins behind the
         cursor, and the next repeat ahead of it is another reply (board 773). */
      const open = opts.opens && i === 0 && cursor.held ? unheld(src, was, cursor.lead, cursor.held)
        : -1;
      const after = open >= 0 ? open : src.indexOf(was, cursor.at);
      seen(after >= 0 ? after : where, (after >= 0 ? after : where) + was.length);
      if (after >= 0) cursor.at = after + was.length;
      else if (where + was.length > cursor.at) cursor.at = where + was.length;
    }
    if (hasWas && !opts.reword) return { ok: false, why: "reworded, which was not asked for",
                                         at: i };
    if (hasWas && text === was) {
      /* A `was` equal to the text is not a rewording, it is a model being thorough. Marking it
         would put a highlight on words nobody changed, which is the one thing a marker pen must
         not do. */
      body += text;
      continue;
    }
    if (hasWas) marks.push({ at: body.length, len: text.length, was, kind: "reword" });
    body += text;
  }
  if (!body.trim()) return { ok: false, why: "no text" };
  if (cursor.held) {
    cursor.held.push([first, last]);
    if (opts.opens) cursor.lead = first;
  }
  return { ok: true, body, marks, anchored, at: first, end: last, loose };
}

/** The first place at or after `from` where `was` stands overlapping none of `held`; -1 if none. */
function unheld(src, was, from, held) {
  for (let j = src.indexOf(was, from > 0 ? from : 0); j >= 0; j = src.indexOf(was, j + 1))
    if (!held.some(h => j < h[1] && j + was.length > h[0])) return j;
  return -1;
}

/* ---- the second pass, which only joins ---------------------------------------------------------
 *
 * MEASURED 2026-09-21 AND IT IS THE NUMBER THIS FEATURE IS SOLD OR NOT SOLD ON. Over 60 kB of a
 * real catalog the first pass invented nothing and lost nothing - invention 0 of 249 bodies,
 * missed 0 of 73 true cards - and got the BOUNDARIES right on 38 of 73, over-splitting 28 of the
 * rest. A firmer instruction in the first prompt moved that not at all: the same slice re-asked
 * with the rule spelled out scored identically.
 *
 * AND THE SECOND PASS IS NOT A SECOND ASK. It was built as one - the pieces' first and last forty
 * characters, in file order, and a model asked which runs are one reply - and THREE PROMPTS
 * MOVED THE NUMBER FROM 38 TO 39 against a ceiling of 59. Eighty characters is not enough to
 * tell a reply that continues from a reply that begins, and the halves of a real reply both read
 * as finished text. The ask is still here behind `join: "ask"` with that number beside it,
 * because a pass that does nothing must be findable rather than deleted and re-invented.
 *
 * WHAT DOES WORK IS ARITHMETIC ON THE OFFSETS THE FIRST PASS ALREADY HAS. A reply given twice,
 * once per language, stands in the file as its whole first language and then its whole second.
 * So when the first pass cuts such a card in two, the two halves INTERLEAVE: the first half's
 * English and the second half's English are neighbours, and the first half's Polish comes after
 * the second half's English. Two pieces whose regions overlap that way cannot be two different
 * replies - two replies stand one after the other - and on the recorded answer this held
 * exactly: 38 interleaving pairs, every one of them two halves of one card, and not one pair of
 * different cards among them. It takes exact from 38 to 53 of 73 with no provider call, no
 * prompt and no network.
 *
 * A JOIN IS A SLICE OF THE SOURCE AND NEVER A CONCATENATION. Two halves of one reply have the
 * paragraph break between them and neither half's span holds it, so joining the two strings would
 * give a body that is in no file at all - the scorer would call that an invention and would be
 * right. A run is applied by taking the source from where the first piece starts to where the
 * last piece ends, which is verbatim by construction and is exactly the reply when the cut was
 * the model's rather than the author's.
 *
 * WHICH IS WHY THE GAPS ARE THE TEST AND NOT THE REGION. What a join ADDS to what the pieces
 * already claimed is exactly the text standing between them, so every gap between two
 * consecutive pieces of one language must be white space and nothing else. A gap holding words
 * means the pieces are not two halves of one reply - the case this is written for is a whole
 * other reply, or the other language of the same card, standing between them - and joining
 * would put text in a card that nothing proposed. Such a run is a splice, it is counted as one,
 * and the pieces stay exactly as the first pass proposed them.
 *
 * AN EARLIER RULE ASKED THAT NO OTHER KEPT BODY OVERLAP THE REGION AT ALL, and it was measured
 * wrong: on the recorded 60 kB answer three over-long proposals lay across a third of the file
 * and refused 13 of the 30 joins the key itself says are right, none of which they had anything
 * to do with. A rule about what the join adds is the rule; a rule about what else the model
 * happened to propose nearby is a rule about the wrong thing.
 */
const JOIN_PROMPT = [
  "Below are the first and last characters of each piece of text that another pass cut out of",
  "one plain text file of support replies. They are in the order they stand in the file.",
  "",
  "Some pieces are halves of ONE reply that was cut in the wrong place. Say which runs of",
  "consecutive pieces are one reply.",
  "",
  "Answer with JSON and nothing else. No prose before it, no prose after it, no code fence.",
  "",
  'The shape: {"joins":[[3,4],[9,10,11]]}',
  "",
  "Rules you must not break:",
  "1. Every number is a piece number from the list below. A run is two or more of them,",
  "   ascending, and next to each other in the list.",
  "2. Join two pieces only where the first plainly runs on into the second: it breaks off",
  "   mid-sentence or mid-thought, or it has no sign-off, and the next one carries it on with",
  "   no greeting of its own.",
  "3. A piece that is a whole reply by itself belongs to no run. MOST PIECES ARE.",
  "4. Two complete replies about one subject are two replies. Do not join them.",
  "5. A reply given twice, once per language, is not a run either: those are two pieces of one",
  "   card and another pass handles them.",
  '6. If nothing should be joined, answer {"joins":[]}.',
  "",
  "The pieces:",
].join("\n");

/**
 * The runs the file's own arithmetic gives, with nothing asked of anybody: a maximal run of
 * pieces each of which starts before the one before it has ended. See the note above for why
 * that can only be one card cut in two, and for the number it is worth.
 */
function weaveRuns(cands) {
  const runs = [];
  let run = [];
  (cands || []).forEach((c, k) => {
    if (run.length && c.at < cands[run[run.length - 1]].end) { run.push(k); return; }
    if (run.length > 1) runs.push(run);
    run = [k];
  });
  if (run.length > 1) runs.push(run);
  return runs;
}

/** The pieces the first pass kept, in the order they stand in the file: each row's own index,
 *  where it starts and ends in the source, and the text of its first body. */
function joinCandidates(rows) {
  const out = [];
  (rows || []).forEach((r, row) => {
    const bodies = (r && r.bodies) || [];
    if (!bodies.length || bodies.some(b => !(b.at >= 0))) return;
    out.push({ row, at: Math.min.apply(null, bodies.map(b => b.at)),
               end: Math.max.apply(null, bodies.map(b => b.end)), text: bodies[0].body });
  });
  out.sort((a, b) => a.at - b.at || a.end - b.end);
  return out.map((c, i) => Object.assign({}, c, { i }));
}

/** The question itself: numbers and two forty-character anchors, and nothing else. */
function joinQuestion(cands) {
  return JSON.stringify({ pieces: cands.map(c => ({ i: c.i, from: c.text.slice(0, 40),
    to: c.text.slice(-40), chars: c.text.length })) }, null, 1);
}

/** The answer read as runs of piece numbers: ascending, at least two long, and each piece in
 *  at most one run. Anything else in the answer is dropped rather than argued with. */
function parseJoins(text, n) {
  const doc = parseLoose(text, d => d && Array.isArray(d.joins));
  if (!doc) return null;
  const runs = [];
  const taken = new Set();
  doc.joins.forEach(run => {
    if (!Array.isArray(run)) return;
    const list = [];
    run.forEach(x => {
      const k = Math.trunc(Number(x));
      if (!(k >= 0 && k < n) || list.indexOf(k) >= 0 || taken.has(k)) return;
      list.push(k);
    });
    if (list.length < 2) return;
    list.sort((a, b) => a - b);
    list.forEach(k => taken.add(k));
    runs.push(list);
  });
  return runs;
}

/** Runs from two questions that share a piece are one run. The questions overlap by one piece
 *  on purpose, so a reply cut across the boundary between them can still be rejoined. */
function mergeRuns(runs) {
  const out = [];
  (runs || []).forEach(run => {
    const hit = out.filter(o => run.some(k => o.indexOf(k) >= 0));
    if (!hit.length) { out.push(run.slice()); return; }
    const one = hit[0];
    hit.slice(1).forEach(h => {
      h.forEach(k => { if (one.indexOf(k) < 0) one.push(k); });
      out.splice(out.indexOf(h), 1);
    });
    run.forEach(k => { if (one.indexOf(k) < 0) one.push(k); });
    one.sort((a, b) => a - b);
  });
  return out;
}

/**
 * The runs applied to the rows, deterministically. Returns the rows that survive, what was
 * joined and what was refused; nothing here consults a model and nothing here writes text that
 * did not come out of `src`.
 */
function applyJoins(rows, cands, runs, src) {
  const applied = [], refused = [];
  const gone = new Set();
  (runs || []).forEach(run => {
    const members = run.map(k => (cands[k] ? cands[k].row : null));
    if (members.some(m => m == null || gone.has(m))) {
      refused.push({ pieces: run.length, why: "a piece is already in another run" });
      return;
    }
    const langs = [];
    members.forEach(m => rows[m].bodies.forEach(b => {
      if (langs.indexOf(b.lang) < 0) langs.push(b.lang);
    }));
    const built = [];
    let bad = null;
    for (const lang of langs) {
      const pieces = [];
      members.forEach(m => rows[m].bodies.forEach(b => { if (b.lang === lang) pieces.push(b); }));
      pieces.sort((a, b) => a.at - b.at);
      if (pieces.some(b => (b.marks && b.marks.length) || !(b.at >= 0))) {
        bad = "a piece carries a mark, so its body is not the file's own bytes"; break;
      }
      /* THE GAPS. `slice` of a pair that overlaps is empty, which is the right answer: two
         pieces that overlap add nothing between them either. */
      for (let k = 1; k < pieces.length && !bad; k++)
        if (src.slice(pieces[k - 1].end, pieces[k].at).trim())
          bad = "the pieces have words between them that no piece claimed, so joining them"
            + " would put text in a card that nothing proposed";
      if (bad) break;
      const at = pieces[0].at;
      const end = Math.max.apply(null, pieces.map(b => b.end));
      built.push({ lang, body: src.slice(at, end), marks: [], at, end });
    }
    if (bad) { refused.push({ pieces: run.length, why: bad }); return; }
    const first = members[0];
    const intents = [];
    members.forEach(m => {
      const list = Array.isArray(rows[m].card && rows[m].card.intents) ? rows[m].card.intents : [];
      list.forEach(x => {
        const s = clauseKey(x);
        if (s && intents.indexOf(s) < 0) intents.push(s);
      });
    });
    /* THE TITLE AND THE SHELF ARE THE FIRST PIECE'S, because the first piece is the head of the
       reply and is what an author will recognise in the queue. The intents are the union: a
       question the second half answered is still a question this card answers. */
    rows[first] = Object.assign({}, rows[first],
      { card: Object.assign({}, rows[first].card, { intents }), bodies: built });
    members.slice(1).forEach(m => gone.add(m));
    applied.push({ pieces: members.length });
  });
  return { rows: rows.filter((_, i) => !gone.has(i)), applied, refused, absorbed: gone.size };
}

/* ---- the draft ------------------------------------------------------------------------------ */

function sha256(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }

function clauseKey(s) { return String(s == null ? "" : s).trim(); }

/**
 * A shapeless text file into a draft catalog and a report.
 *
 * @param o.file    the text file; or o.text for the bytes directly
 * @param o.ask     a function ({prompt, body, model}) -> Promise<{ok:true,text} | {ok:false,refusal}>
 * @param o.model   the model name, passed through to the ask function
 * @param o.reword  allow rewording (604's two conditions are kept whatever this says)
 * @param o.placeholders  normalise platform tokens; marked and reversible like a rewording
 * @param o.id, o.primary, o.rev  the draft's own identity, as src/import.mjs takes them
 */
async function importText(o) {
  const opts = o || {};
  const file = opts.file ? path.resolve(opts.file) : null;
  const F = await Engine.format();
  const { lintCatalog } = Engine.lint();
  const reword = !!opts.reword;
  const doPlaceholders = opts.placeholders !== false;

  const stale = verifyPlaceholders(Engine.cardTokens().tokens);
  if (stale.length) throw new Error(stale.join("; ")
    + " - the placeholder table and the pinned engine have drifted apart");

  const buf = opts.text != null ? Buffer.from(String(opts.text), "utf8") : fs.readFileSync(file);
  const dec = decode(buf);
  /* THE SOURCE THE CHECK RUNS AGAINST IS THE DECODED TEXT WITH ITS LINE ENDINGS SETTLED, and it
     is settled once, here, before the model sees a byte of it. A model handed CRLF answers with
     LF about half the time, and a check run against the undecoded bytes would then call every
     multi-line reply an invention - a guard that fires on the line endings is a guard nobody
     will keep switched on. */
  const source = dec.text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (!source.trim()) throw refuse("the file is empty, so there is nothing to import");

  const findings = [];
  const note = (severity, what, where) => {
    const f = what && typeof what === "object"
      ? { severity, what: what.message, said: what.said } : { severity, what };
    if (where != null) f.where = where;
    findings.push(f);
  };
  if (dec.encoding !== "utf-8") {
    const named = (dec.offsets && dec.offsets.length) ? dec.offsets.join(", ") : String(dec.replaced);
    note("warning", noteOf("the file is not valid UTF-8 and was read as {ENC}; byte offsets a"
      + " UTF-8 reader would have replaced: {LIST}. Check the letters of any card that looked"
      + " wrong before this catalog goes out", { ENC: dec.encoding, LIST: named }));
  }

  const ask = opts.ask;
  if (typeof ask !== "function")
    throw new Error("importText wants an ask function");

  const chunk = +opts.chunkChars > 0 ? +opts.chunkChars : 0;
  const totalParts = importPieceCount(source, chunk);
  const isCancelled = typeof opts.isCancelled === "function" ? opts.isCancelled : () => false;
  let cancelled = false;
  const asked = [];
  const proposed = [];
  let answered = null;
  /* THE PIECE BEFORE, WAITING: its cards before `next` are proposed once this piece's answer
     confirms the cut, and none of them is proposed before that. */
  let held = null;
  /* THE STRETCHES NO ANSWER COVERED, each a cut made blind; the review flags the cards beside it. */
  const unread = [];
  let retried = false, alone = true;
  const settle = () => { if (held) held.keep.forEach(c => proposed.push(c)); held = null; };
  for (let n = 0, from = 0, span = chunk; ; n++) {
    if (isCancelled()) { cancelled = true; break; }
    const piece = pieceAt(source, from, span);
    if (!piece.last) alone = false;
    const whole = alone && piece.last;
    if (!piece.text.trim()) { if (piece.last) break; from = piece.at + piece.text.length; n--; continue; }
    const at = Date.now();
    const answer = await ask({ prompt: promptFor(reword, opts.known), body: piece.text,
                               model: opts.model });
    const ms = Date.now() - at;
    const doc = answer && answer.ok ? parseProposal(answer.text) : null;
    const got = doc && Array.isArray(doc.cards) ? doc.cards : [];
    const where = placeCards(piece, got);
    const row = { piece: n, at: piece.at, chars: piece.text.length, ms, ok: !!doc };
    if (answer && answer.ok) { answered = answered || answer; row.answered = answer.text.length; }
    if (doc) row.cards = got.length;
    else row.refusal = !answer || !answer.ok ? (answer ? answer.refusal : "no answer")
      : "the answer is not the JSON this import asked for";
    asked.push(row);
    if (typeof opts.onPiece === "function") {
      try { opts.onPiece({ n: asked.length, total: totalParts, piece, answer }); } catch {}
    }
    if (isCancelled()) {
      cancelled = true;
      if (doc) got.forEach(c => proposed.push(c));
      break;
    }
    /* ONE PIECE FAILING DOES NOT LOSE THE OTHERS, and it is asked once more before it is given
       up: a run over a real file is tens of asks, and one timing out is ordinary (board 770). */
    const placed = where.some(w => w.from >= 0);
    if (!placed) {
      if (doc) row.none = true;
      if (!retried) { retried = true; row.retry = true; continue; }
      retried = false;
      if (whole && doc) { got.forEach(c => proposed.push(c)); break; }
      if (whole) {
        if (!answer || !answer.ok)
          return { catalog: null, report: null, refusal: answer ? answer.refusal : "no answer",
                   said: answer ? answer.said : null };
        const r = refusalOf("the provider's answer is not the JSON this import asked for, so"
          + " nothing could be read out of it: {CHARS}",
          { CHARS: counted(String(answer.text || "").length,
                           "{N} character", "{N} characters") });
        return { catalog: null, report: null, refusal: r.message, said: r.said };
      }
      settle();
      unread.push({ at: piece.at, end: piece.at + piece.text.length });
      if (piece.last) break;
      from = piece.at + piece.text.length; span = chunk;
      continue;
    }
    retried = false;
    if (held) {
      /* THE CONFIRMATION. The reply this piece begins with was whole in the piece before, or the
         cut may stand inside it, where that piece's answer is the one not to trust. */
      let first = null;
      where.forEach(w => { if (w.from >= 0 && (!first || w.from < first.from)) first = w; });
      if (first && piece.at + first.to > held.piece.at + held.piece.text.length) {
        row.dropped = true;
        const h = holdBack(held.piece, held.cards, held.next);
        if (h.next === "grow") {
          held.row.grown = true;
          from = held.piece.at; span = 2 * held.span; held = null;
          continue;
        }
        held.keep = h.keep; held.next = h.next; held.row.held = h.held;
        from = h.next; span = chunk;
        continue;
      }
      settle();
    }
    if (piece.last) { got.forEach(c => proposed.push(c)); break; }
    /* TWO CARDS BACK, not one: the last is the one a cut may have fragmented, and a cut the next
       answer refuses costs a whole ask where re-reading one more card costs a part of one. */
    let h = holdBack(piece, got);
    if (typeof h.next === "number") {
      const two = holdBack(piece, got, h.next);
      if (typeof two.next === "number") h = two;
    }
    if (h.next === "grow") { row.grown = true; span = 2 * (span || chunk); continue; }
    if (h.held) row.held = h.held;
    held = { piece, cards: got, keep: h.keep, next: h.next, span, row };
    from = h.next; span = chunk;
  }
  if (cancelled) {
    if (held) { (held.cards || []).forEach(c => proposed.push(c)); held = null; }
  } else {
    settle();
  }
  if (!proposed.length) {
    const r = refusalOf("nothing usable came back, so there is nothing to propose: {CALLS}",
      { CALLS: counted(asked.length, "{N} ask", "{N} asks") });
    return { catalog: null, report: null, refusal: r.message, said: r.said, cancelled, askedCount: asked.length, totalParts };
  }

  /* ---- the check, before a card exists --------------------------------------------------- */

  const refused = [];
  let kept = [];
  /* ONE CURSOR FOR THE WHOLE FILE, because the replies stand in it in the order the cards come
     back in and an anchor that repeats has to resolve forwards. See resolveAnchor. */
  const cursor = { at: 0, lead: 0, held: [] };
  let anchoredN = 0;
  proposed.forEach((c, i) => {
    const bodies = Array.isArray(c && c.bodies) ? c.bodies : [];
    if (!bodies.length) { refused.push({ i, why: "no bodies" }); return; }
    const out = [];
    let bad = null;
    for (const b of bodies) {
      const lang = String((b && b.lang) || "").trim().toLowerCase();
      if (!/^[a-z]{2,3}$/.test(lang)) { bad = { i, why: "no language code on a body" }; break; }
      const r = checkSpans(b && b.spans, source, { reword, cursor, opens: !out.length });
      if (!r.ok) { bad = { i, lang, why: r.why, at: r.at == null ? null : r.at,
                           anchor: !!r.anchor }; break; }
      anchoredN += r.anchored || 0;
      out.push({ lang, body: r.body, marks: r.marks, start: r.at,
                 at: source.slice(r.at, r.end) === r.body ? r.at : -1, end: r.end,
                 loose: !!r.loose });
    }
    if (bad) { refused.push(bad); return; }
    kept.push({ i, card: c, bodies: out });
  });

  /* ---- the second pass, which only joins --------------------------------------------------- */

  let join = null;
  const how = opts.join === false ? false : opts.join === "ask" ? "ask" : "weave";
  if (how && kept.length > 1) {
    const cands = joinCandidates(kept);
    const asks = [];
    let runs = [];
    if (how === "weave") runs = weaveRuns(cands);
    else {
      /* ONE PIECE OF OVERLAP BETWEEN QUESTIONS, so a reply whose halves fall either side of a
         question boundary is still askable; mergeRuns puts the two answers back together. */
      const per = Math.max(2, Math.floor((+opts.joinChars > 0 ? +opts.joinChars : 6000) / 120));
      for (let a = 0; a + 1 < cands.length; a += per - 1) {
        const slice = cands.slice(a, a + per);
        if (slice.length < 2) break;
        const at = Date.now();
        const answer = await ask({ prompt: JOIN_PROMPT, body: joinQuestion(slice),
                                   model: opts.model });
        const ms = Date.now() - at;
        if (!answer || !answer.ok) {
          asks.push({ ask: asks.length, pieces: slice.length, ms, ok: false,
                      refusal: answer ? answer.refusal : "no answer" });
          continue;
        }
        const got = parseJoins(answer.text, cands.length);
        asks.push({ ask: asks.length, pieces: slice.length, ms, ok: !!got,
                    answered: answer.text.length, runs: got ? got.length : 0,
                    refusal: got ? undefined
                      : "the answer is not the JSON the joining pass asked for" });
        (got || []).forEach(r => runs.push(r));
      }
      runs = mergeRuns(runs);
    }
    const done = applyJoins(kept, cands, runs, source);
    kept = done.rows;
    join = { how, asked: asks.length, ms: asks.reduce((n, x) => n + x.ms, 0),
             unanswered: asks.filter(x => !x.ok).length, asks,
             proposed: runs.length, applied: done.applied.length, absorbed: done.absorbed,
             refused: done.refused.length, refusedRows: done.refused };
    if (join.refused) note("warning", noteOf("joins proposed by the joining pass and refused,"
      + " because their pieces are not one unbroken stretch of the file: {N}. Those cards are"
      + " in the queue as the first pass proposed them", { N: join.refused }));
  }

  /* ---- placeholders, which are a change like any other ----------------------------------- */

  const tokens = [];
  if (doPlaceholders) kept.forEach(k => k.bodies.forEach(b => {
    const tr = translateSpans(b.body);
    tr.found.forEach(f => tokens.push({ i: k.i, lang: b.lang, token: f.token, to: f.to,
                                        known: f.known }));
    if (!tr.spans.length) return;
    /* THE REWORD MARKS MOVE WITH THE TEXT, AND A TOKEN INSIDE ONE IS NOT A SECOND MARK.
     *
     * Two coordinate systems meet here and getting them the wrong way round puts the highlight
     * beside the characters that changed rather than on them. A reword mark's `at` is an offset
     * into the body BEFORE the tokens were translated; a translated span's `at` is an offset
     * into the body AFTER, and its `from` is where the token stood before. So a reword mark
     * moves by the length every token BEFORE it gained or lost, measured in the old coordinate
     * with `from`.
     *
     * A token that stood inside a reworded span is not marked separately: the reword's mark
     * already covers those characters and its `was` already holds the original, which is what
     * one press has to put back. Two marks over one run would overlap, and markSegments cuts
     * the body into runs on the assumption that they never do. Such a mark's LENGTH grows or
     * shrinks with the token instead. */
    const deltas = tr.spans.map(s => ({ at: s.at, from: s.from, newLen: s.len,
                                        wasLen: String(s.was).length, was: s.was }));
    const swallowed = new Set();
    const moved = b.marks.map(m => {
      let grow = 0, shift = 0;
      deltas.forEach((d, di) => {
        if (d.from >= m.at && d.from < m.at + m.len) {
          swallowed.add(di); grow += d.newLen - d.wasLen;
        }
        else if (d.from < m.at) shift += d.newLen - d.wasLen;
      });
      return Object.assign({}, m, { at: m.at + shift, len: m.len + grow });
    });
    b.body = tr.text;
    b.marks = moved
      .concat(deltas.filter((_, di) => !swallowed.has(di))
        .map(d => ({ at: d.at, len: d.newLen, was: d.was, kind: "placeholder" })))
      .sort((x, y) => x.at - y.at);
  }));

  /* ---- the draft --------------------------------------------------------------------------- */

  const langSeen = [];
  kept.forEach(k => k.bodies.forEach(b => {
    if (langSeen.indexOf(b.lang) < 0) langSeen.push(b.lang);
  }));
  const primary = String(opts.primary || langSeen[0] || "en");
  if (langSeen.indexOf(primary) < 0) langSeen.unshift(primary);
  const codes = [primary].concat(langSeen.filter(l => l !== primary));

  const seenIds = new Map();
  const claim = (wanted, what) => {
    if (!seenIds.has(wanted)) { seenIds.set(wanted, what); return { id: wanted, collided: false }; }
    let n = 2, cand;
    do {
      const tail = "-" + n;
      cand = wanted.slice(0, F.ID_MAX - tail.length).replace(/-+$/, "") + tail;
      n++;
    } while (seenIds.has(cand));
    seenIds.set(cand, what);
    return { id: cand, collided: true, taken: wanted };
  };

  /* Shelves and requests first, so a card can name one. Only the keys a kept card uses: an
     empty shelf is the first thing a customer sees go wrong (src/import.mjs says the same). */
  const tags = [];
  const shelfOf = new Map();
  const shelfLabels = new Map();
  kept.forEach(k => { k.shelfKey = String((k.card && k.card.category) || "").trim() || FALLBACK; });

  /* A SHELF OF ONE CARD IS REPORTED RATHER THAN MINTED, which is src/import.mjs's refusal to
     mint an EMPTY shelf seen from the other side: measured, the model filed 133 cards under 45
     categories, 13 of them holding a single card each, and a manager handed 45 shelves for 133
     replies has been given a filing problem rather than a filing.
     NOT SO FOR AN INTENT, and this is the half of the carved item the oracle refuted: the
     invented sample catalog has 8 intent clauses used by one card each, and the real catalog
     behind tonight's measurement has 150 clauses over 258 cards. A request that one reply
     answers is ordinary; a shelf holding one card is not.
     A KEY THE PROJECT ALREADY HAS IS NEVER SUPPRESSED however few cards land on it: it is the
     owner's own shelf and this import is not entitled to an opinion about how full it is. */
  const knownKeys = new Set((opts.known && Array.isArray(opts.known.categories)
    ? opts.known.categories : []).map(c => String((c && c.key) == null ? "" : c.key).trim()));
  const shelfUse = new Map();
  kept.forEach(k => shelfUse.set(k.shelfKey, (shelfUse.get(k.shelfKey) || 0) + 1));
  const singletons = [];
  if (shelfUse.size > 1) kept.forEach(k => {
    if (shelfUse.get(k.shelfKey) > 1 || k.shelfKey === FALLBACK
        || knownKeys.has(k.shelfKey)) return;
    if (singletons.indexOf(k.shelfKey) < 0) singletons.push(k.shelfKey);
    k.proposedShelf = k.shelfKey;
    k.shelfKey = FALLBACK;
  });

  kept.forEach(k => {
    const key = k.shelfKey;
    if (shelfLabels.has(key)) return;
    const label = {};
    const given = (k.proposedShelf ? null : (k.card && k.card.categoryLabel)) || {};
    Object.keys(given).forEach(code => {
      const v = String(given[code] || "").trim();
      if (v) label[code] = v;
    });
    if (!Object.keys(label).length) label[primary] = key;
    shelfLabels.set(key, label);
  });
  shelfLabels.forEach((label, key) => {
    const c = claim(F.tagId(key), "shelf " + key);
    shelfOf.set(key, c.id);
    tags.push({ id: c.id, kind: "shelf", label });
  });

  const requestOf = new Map();
  kept.forEach(k => {
    const list = Array.isArray(k.card && k.card.intents) ? k.card.intents : [];
    k.clauses = list.map(clauseKey).filter(Boolean);
    k.clauses.forEach(cl => {
      if (requestOf.has(cl)) return;
      const c = claim(F.tagId(cl), "request " + cl);
      requestOf.set(cl, c.id);
      const clause = {}; clause[primary] = cl;
      tags.push({ id: c.id, kind: "request", clause });
    });
  });

  const marks = [], splices = [];
  let spliced = 0, spanN = 0, rewordN = 0, placeholderN = 0;
  const cards = kept.map(k => {
    const title = {};
    const given = (k.card && k.card.title) || {};
    Object.keys(given).forEach(code => {
      const v = String(given[code] || "").trim();
      if (v) title[code] = v;
    });
    if (!Object.keys(title).length) {
      /* A CARD WITHOUT A TITLE IS A CARD THE ENGINE REFUSES, and it is also unreadable in the
         review queue, whose rows are named by title. The first line of the body is a poor title
         and a visible one, which is what an author needs in order to fix it. */
      const first = k.bodies[0];
      title[first ? first.lang : primary] =
        String((first ? first.body : "")).split(/\n/)[0].slice(0, 60).trim() || "Untitled";
      note("warning", noteOf("a card came back with no title and was given its own first line;"
        + " proposal {I}", { I: k.i }));
    }
    const wanted = F.cardId(k.shelfKey + "-" + (title[primary] || Object.values(title)[0] || ""));
    const c = claim(wanted, "card from proposal " + k.i);
    const body = {};
    k.bodies.forEach(b => {
      body[b.lang] = b.body;
      spanN++;
      if (b.loose || source.indexOf(revertBody(b.body, b.marks)) < 0) {
        spliced++;
        splices.push({ card: c.id, lang: b.lang });
      }
      b.marks.forEach(m => { if (m.kind === "reword") rewordN++; else placeholderN++; });
      if (b.marks.length) marks.push({ card: c.id, lang: b.lang, marks: b.marks });
    });
    const card = { id: c.id, shelf: shelfOf.get(k.shelfKey), title, body, bodyShape: "plain" };
    const links = k.clauses.map(cl => requestOf.get(cl)).filter(Boolean);
    if (links.length) card.requests = links;
    return card;
  });

  /* THE CARDS BESIDE A BLIND CUT (board 770): the last to begin before an unread stretch and the
     first to begin after it, where a reply may have been cut short or begun halfway. */
  const startOf = k => k.bodies.reduce((a, b) => {
    const x = b.start != null ? b.start : b.at;
    return x >= 0 && (a < 0 || x < a) ? x : a;
  }, -1);
  const unreadRows = unread.map(u => {
    let before = -1, after = -1;
    kept.forEach((k, i) => {
      const a = startOf(k);
      if (a < 0) return;
      if (a < u.at && (before < 0 || a > startOf(kept[before]))) before = i;
      if (a >= u.end && (after < 0 || a < startOf(kept[after]))) after = i;
    });
    return { at: u.at, end: u.end, before: before < 0 ? null : cards[before].id,
             after: after < 0 ? null : cards[after].id };
  });

  if (!cards.length) throw refuse("nothing in the answer survived the check that every proposed"
    + " span is in the file it came from, so no proposal was written");

  const stem = String(file ? path.basename(file, path.extname(file))
    : "imported replies").trim() || "Imported replies";
  const id = String(opts.id || F.slug(stem)).trim();
  if (!F.idOk(id)) throw refuse("the catalog id {ID} is not 3 to 64 characters of a to z, 0 to 9"
    + " and the hyphen; an id of your own can be typed in its place", { ID: JSON.stringify(id) },
    "the catalog id {ID} is not 3 to 64 of a-z, 0-9 and the hyphen; pass --id");

  const catalog = {
    format: F.FORMAT, kind: F.KIND, id,
    rev: opts.rev == null ? 1 : +opts.rev,
    langs: codes.map(code => ({ code, label: code.toUpperCase() })),
    commentLang: primary,
    tags, cards,
  };
  catalog.minEngine = "2.0.0";
  catalog.hash = F.contentHash(catalog);

  const engineLint = lintCatalog(catalog);
  const awaits = awaitingOver(catalog, engineLint, lintCatalog,
    Engine.builtInLangs(), F.contentHash);
  if (false) ; /* plant:frames-scan */
  const engineNote = (line) => noteOf("Etiuda's checks: {LINE}", { LINE: importLintSaid(line) || line });
  engineLint.errors.forEach(e => { if (!awaits.classed.has(e)) note("error", engineNote(e)); });
  engineLint.warnings.forEach(w => note("warning", engineNote(w)));
  awaits.rows.forEach(f => findings.push(f));

  const REFUSAL_WHY_FRAME = {
    "no spans": "it points at no part of the file",
    "invented": "its text is not in the file",
    "an empty span": "one of its parts is empty",
    "reworded, which was not asked for": "it reworded the text, which was not asked for",
    "no text": "it has no text",
    "no bodies": "it has no reply text",
    "no language code on a body": "a reply text has no language code",
  };
  refused.forEach(r => note("error", noteOf("a proposal was refused before it reached the queue:"
    + " {WHY}{LANGPART}{SPAN}", {
      WHY: REFUSAL_WHY_FRAME[r.why] ? { frame: REFUSAL_WHY_FRAME[r.why] } : r.why,
      LANGPART: r.lang ? " (" + r.lang + ")" : "",
      SPAN: r.at == null ? "" : { frame: ", span {AT}", vars: { AT: r.at } },
    })));
  if (spliced) note("warning", noteOf("proposed bodies made of spans that are each in the file"
    + " but not as one piece, so they join text from more than one place: {N}. The score counts"
    + " such a body as invented, and a reader should look at them", { N: spliced }));

  const byToken = m => {
    const out = new Map();
    m.forEach(p => out.set(p.token, (out.get(p.token) || 0) + 1));
    return Array.from(out.entries()).map(([token, n]) => ({ token, n }))
      .sort((a, b) => b.n - a.n || a.token.localeCompare(b.token));
  };

  const byLang = {};
  kept.forEach(k => {
    k.bodies.forEach(b => {
      const l = b.lang;
      if (l) byLang[l] = (byLang[l] || 0) + 1;
    });
  });

  const report = {
    kind: REPORT_KIND, schema: SCHEMA,
    source: file ? path.basename(file) : "(text)",
    encoding: dec.encoding,
    sourceChars: source.length, sourceSha256: sha256(Buffer.from(source, "utf8")),
    provider: { provider: ask.provider || null,
                model: (answered && answered.model) || opts.model || null },
    asked: { calls: asked.length, chunkChars: +opts.chunkChars > 0 ? +opts.chunkChars : 0,
             unanswered: asked.filter(a => !a.ok).length,
             retried: asked.filter(a => a.retry).length,
             dropped: asked.filter(a => a.dropped).length,
             ms: asked.reduce((n, a) => n + a.ms, 0), pieces: asked },
    reword, placeholders: doPlaceholders,
    catalog: { id, rev: catalog.rev, hash: catalog.hash },
    primary, langs: codes, byLang,
    counts: {
      proposed: proposed.length, cards: cards.length, refused: refused.length,
      bodies: spanN, spliced, anchored: anchoredN,
      reword: rewordN, placeholder: placeholderN,
      byLang,
      cats: tags.filter(t => t.kind === "shelf").length,
      intents: tags.filter(t => t.kind === "request").length,
      joined: join ? join.applied : 0,
      joinedCards: join ? join.absorbed : 0,
      joinRefused: join ? join.refused : 0,
      catsSuppressed: singletons.length,
      unread: unreadRows.length,
    },
    countRules: {
      proposed: "cards in the provider's own answer, before any check",
      cards: "proposed cards every one of whose bodies passed the source check",
      refused: "proposed cards dropped by the source check, never written and never shown",
      bodies: "bodies over the kept cards, one per language per card",
      spliced: "kept bodies which, with every mark reverted, are not a substring of the source"
        + " file, so they join text from more than one place in it",
      anchored: "spans over the KEPT cards that arrived as a {from, to, chars} anchor pair and"
        + " were resolved to a run of the source, rather than as the words themselves",
      reword: "marks of kind reword over the kept bodies",
      placeholder: "marks of kind placeholder over the kept bodies",
      joined: "runs of pieces the joining pass proposed AND the deterministic applier accepted,"
        + " one count per run however many pieces it held",
      joinedCards: "kept cards absorbed into another by those runs: the drop in the card count"
        + " the joining pass is responsible for",
      joinRefused: "runs the joining pass proposed and the applier refused because the pieces"
        + " are not one unbroken stretch of the file, so joining them would splice",
      unread: "stretches of the file whose piece failed twice, once asked and once retried, so no"
        + " answer covered them; `unread` names the kept card beginning last before each and first"
        + " after it, which the review flags",
      catsSuppressed: "categories the answer proposed for one card each, which were reported"
        + " rather than created; those cards are on the general shelf and `filing.suppressed`"
        + " names the keys. A category the project already had is never counted here.",
    },
    filing: {
      knownCategories: (opts.known && Array.isArray(opts.known.categories)
        ? opts.known.categories.length : 0),
      knownIntents: (opts.known && Array.isArray(opts.known.intents)
        ? opts.known.intents.length : 0),
      suppressed: singletons,
      rule: "the import was told the categories and intents the project already has and asked to"
        + " use one where it fits; a category it proposed for a single card was reported here"
        + " rather than created, and its card put on the general shelf. An intent for a single"
        + " card is ordinary and is never suppressed.",
    },
    join,
    joinRule: "a run of pieces is one card cut up. Under `weave`, which is the default and asks"
      + " nobody anything, a run is a maximal set of consecutive pieces each of which starts"
      + " before the one before it has ended, which only happens where one card's languages were"
      + " cut through. Under `ask`, the runs come from a second ask that sees each piece's first"
      + " and last forty characters and its length and nothing else. Either way a run is applied"
      + " by taking the source from the start of its first piece to the end of its last, per"
      + " language, so the joined body is a slice of the file rather than a concatenation; a run"
      + " with words between two of its pieces that no piece claimed is refused as a splice.",
    refusedRows: refused,
    marks,
    /* THE SPLICED BODIES BY NAME, beside the marks and not among them (sense pass item 22): a
       splice has no span a press could put back, and revertProposalMarks drops an entry whose
       marks run out. The review queue reads this list and says it on the row. */
    splices,
    unread: unreadRows,
    markRule: "a mark is an offset into the PROPOSED body, its length there, and the exact"
      + " original text it replaced. revertMark puts one back and shifts the marks after it;"
      + " revertBody puts them all back and returns the bytes the file holds.",
    placeholderTokens: { mapped: byToken(tokens.filter(t => t.to)),
                         flagged: byToken(tokens.filter(t => !t.to)), total: tokens.length },
    engineLint: lintBlock(engineLint, awaits),
    findings,
    errors: findings.filter(f => f.severity === "error").length,
    warnings: findings.filter(f => f.severity === "warning").length,
    awaiting: findings.filter(f => f.severity === "awaiting").length,
    pin: Engine.pin().commit,
  };
  return { catalog, report, cancelled, askedCount: asked.length, totalParts };
}

/* THE FRAME IS WRITTEN AT THE CALL, NEVER PASSED INTO A HELPER. tests/polish.mjs reads the
 * literal that four builder names hold - refuse, refusalOf, noteOf, noted - so a fifth wrapper
 * of this file's own would take every sentence it built out of that scan's sight, and a refusal
 * with no Polish would paint English in the middle of a Polish screen with no gate to say so.
 * There was such a wrapper here for an hour on 2026-09-21; this note is what replaced it.
 */

/* ONE WRITER, SO THE TWO DOORS CANNOT DISAGREE, exactly as src/import.mjs says of writeImport.
 * The proposal is a whole catalog document with its OWN id, which is what makes the review queue
 * read it as another catalog's cards coming in and offer them as additions - src/review.mjs's
 * checkOrigin says why that is the same machinery rather than a second importer. The report goes
 * beside it under the stem the inbox already filters by name, `.lint.json`, so the marks travel
 * with the proposal without the folder gaining a second kind of file it has to know about. */
function writeTextImport(outDir, proposalName, catalog, report) {
  fs.mkdirSync(outDir, { recursive: true });
  const at = path.join(outDir, proposalName);
  const lintAt = at.replace(/\.ec$/, ".lint.json");
  fs.writeFileSync(at, JSON.stringify(catalog, null, 1) + "\n", "utf8");
  fs.writeFileSync(lintAt, JSON.stringify(report, null, 1) + "\n", "utf8");
  return { at, lintAt };
}

export { importText, writeTextImport, checkSpans, parseProposal, pieceAt, holdBack,
         importPieceCount,
         markSegments, revertMark, revertBody, promptFor,
         joinCandidates, joinQuestion, parseJoins, mergeRuns, applyJoins, weaveRuns,
         knownFiling, knownBlock,
         PROMPT_VERBATIM, PROMPT_REWORD, JOIN_PROMPT, REPORT_KIND, SCHEMA };
