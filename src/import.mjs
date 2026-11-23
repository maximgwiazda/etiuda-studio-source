/* A MACRO PILE INTO A DRAFT CATALOG. Course node 6, spec 3.1.
 *
 *     import { importCsv } from "./src/import.mjs";
 *     const { catalog, report, stem } = await importCsv({ file, override, primary, id });
 *
 * NOTHING PUBLISHES FROM AN IMPORT (spec 3.1). What comes back is a DRAFT and a report, and the
 * draft is written to disk by tools/import.mjs with the report beside it. Publishing is course
 * node 7 and takes a separate act, because the whole value of an importer is that somebody
 * looks at what it guessed before a customer reads it.
 *
 * THE SHAPE OF THE ANSWER, and every stage of it is in the report rather than in a log:
 *   columns      every column's verdict and the rule that decided it, including the ones
 *                nothing claimed. A column silently dropped is content silently lost.
 *   languages    the header's verdict and the text's, per language, and a finding where the
 *                two disagree.
 *   duplicates   exact by the engine's identity rules, near by Studio's stated coefficient.
 *   placeholders every platform token met, translated or flagged, with its card.
 *   keywords    per card, the bag words that appear NOWHERE in the card's own text. A bag is a
 *               place for words a card does not say and somebody would still type; a word the
 *               card already carries is found without it, so the bag-only list is the whole of
 *               what a bag buys. See WHAT A BAG BUYS below.
 *   categories   proposed from the category column, labelled from a sibling categories.csv
 *                where there is one, in the primary language from its `label` column and in
 *                any other language the file speaks from a `label_<code>` column.
 *   lint         the PINNED ENGINE's own lintCatalog over the draft, errors and warnings
 *                verbatim. Studio does not have an opinion about a catalog that the engine
 *                does not have, and where it CLASSES one of the engine's own errors rather
 *                than repeating it, the engine's untouched count stays in engineLint.raw.
 *   awaiting     one finding per language the pinned engine says the draft is waiting for
 *                text in, whether the catalog declares that language or not. A state, not an
 *                error: see AWAITING A LANGUAGE below.
 *
 * THE COUNT CONTRACT, which tests/round-trip.mjs holds this file to and which is therefore
 * written here in the same words:
 *   cards       one row of the CSV is one card.
 *   macros      body blocks in the primary language, by the pinned engine's ecBlocks: a plain
 *               body is one block, so for a pile of plain bodies this is the count of rows with
 *               a non-empty primary body; a body written in the engine's own steps or alts
 *               encoding counts the blocks its marker lines divide it into.
 *   intents     distinct non-empty clauses over the intents column, split on ";".
 *   categories  distinct category keys NAMED BY AT LEAST ONE ROW. A sibling categories.csv may
 *               declare more, and a shelf no card stands on is not minted: it is reported as a
 *               declared-and-unused category instead. Minting it would make the gate red, and
 *               the gate is right - an empty shelf in a customer's first sight of their own
 *               content is a defect, not a feature.
 *
 * WHAT THIS FILE DOES NOT DECIDE. Ids, slugs, the canonical form, the content hash and every
 * lint rule come from the pinned engine through src/engine.mjs. The judgements that are
 * Studio's own - which column is which, which language a passage is in, which pairs are near
 * duplicates, which platform token maps where - each live in a module of their own with the
 * rule written at the top of it.
 */
import fs from "node:fs";
import path from "node:path";
import * as Engine from "./engine.mjs";
import { decode, rows, table, delimiterOf, cellText } from "./csv.mjs";
import { examine } from "./source.mjs";
import { mapHeaders, FIELDS } from "./mapping.mjs";
import { detect } from "./lang.mjs";
import { translate, verify as verifyPlaceholders, tokensMet, untold } from "./placeholders.mjs";
import { findDuplicates } from "./dedupe.mjs";
/* THE REFUSALS A PERSON MEETS AT A SCREEN GO THROUGH refuse(), which keeps the English as
   the Error's message and carries the frame and its variables beside it so the page can say
   the same thing in Polish (board 523, src/refusal.mjs). A plain `throw new Error` below
   names a flag or reports a fault in this program, and stays English on purpose. */
import { refuse, noteOf, counted } from "./refusal.mjs";
import { lintSaid, importLintSaid } from "./lint-said.mjs";
import { isPasteFile } from "./paste.mjs";

const SCHEMA = 1;
/* What the report beside an import says it is. src/review.mjs reads it to know that a file in
   the inbox is the person's own import rather than a document from somewhere else. */
const REPORT_KIND = "etiuda-studio-import-report";

/* THE ONE REFUSAL A PERSON CAN ANSWER ON THE MAPPING COVER ITSELF (sense pass 2026-09-22, item
   4): no column was read as text in the primary language, which choosing a column's field
   fixes. src/studio.mjs recognises it by this frame and paints the mapping table with the
   refusal as its error, where every other refusal ends at the no-plan screen. It used to name
   "the override table" and "--primary", a table the screen did not have and a flag of the
   command line's; tools/import.mjs adds the flags where they mean something. NO SEMICOLON IN
   IT: tests/polish.mjs resolves a named frame by reading `const NAME = ...;` up to the first
   semicolon, so one inside the string cuts the frame short and the pair reads as missing. */
const NO_PRIMARY = "No column holds text in the primary language, {CODE}. Choose the column that"
  + " holds it, or give a column that language, in the table of headings";

/* WHAT A BAG BUYS, AND WHY THAT IS THE ONLY NUMBER WORTH PRINTING ABOUT ONE. Board 585, 597.
 *
 * The keyword bag is the card's `k`, one string shared by every language (spec 2.4). Maxim
 * ruled on 2026-09-19 that it stays: the format keeps it and an author may leave it empty. What
 * it is FOR was settled by measurement on a real catalog - of 176 bag words sampled, 151
 * repeated words the card's own text already carried, and the 25 that lived only in the bag
 * were the whole of its content. A word the card says is found whether or not the bag repeats
 * it; a word it does not say is found only because the bag is there. So an importer that says
 * "this card has 15 keywords" says nothing, and one that names the words nobody could reach the
 * card without has said everything.
 *
 * WHAT COUNTS AS A WORD IS THE ENGINE'S, NEVER A REGEX OF STUDIO'S: src/engine.mjs slices
 * splitWords out of the pin, which folds diacritics (nobody reaches for the ogonek at chat
 * speed) and splits on everything that is neither a letter nor a digit. A second rule here
 * could tell an author a bag word was missing from text the engine would have matched it
 * against, which is the quiet disagreement the pin exists to prevent.
 *
 * CONTAINMENT IS LITERAL AND NOT THE SEARCH'S PREFIX RULE, deliberately. The engine's search
 * also matches a word by a shared prefix, so "bagaz" in the bag would be reached from "bagazu"
 * in the body; under that rule the bag-only list would be shorter and it would be a claim about
 * what search happens to do today. The ruling is about the TEXT - a bag is a place for words
 * the card's text does not contain - so the test is whole-word identity after the engine's own
 * folding, and the day search changes this number does not.
 *
 * THE CATEGORY'S LABEL IS PART OF THE CARD'S OWN TEXT here, because the engine indexes it as
 * the card's `meta` and a bag word equal to the shelf's name buys nothing either.
 */
function bagOnly(card, catalog, splitWords) {
  const bag = [];
  splitWords((card && card.k) || "").forEach(w => { if (bag.indexOf(w) < 0) bag.push(w); });
  const text = new Set();
  const eat = (v) => splitWords(v == null ? "" : String(v)).forEach(w => text.add(w));
  ["title", "body", "note"].forEach(f => {
    const map = (card && card[f]) || {};
    Object.keys(map).forEach(code => eat(map[code]));
  });
  const shelf = ((catalog && catalog.tags) || [])
    .find(t => t && t.kind === "shelf" && t.id === (card && card.shelf));
  if (shelf) Object.keys(shelf.label || {}).forEach(code => eat(shelf.label[code]));
  return { bag, only: bag.filter(w => !text.has(w)) };
}

/** A sibling table of two columns, read where it is there and ignored where it is not. */
function sibling(dir, name, keyCol, valCol) {
  const p = path.join(dir, name);
  if (!fs.existsSync(p)) return null;
  const text = decode(fs.readFileSync(p)).text;
  const delim = delimiterOf(text);
  const all = rows(text, delim);
  const used = r => r && r.some(v => String(v).trim());
  if (!all.length || !all.some(used))
    throw refuse("{FILE}, beside the file being imported, is empty. Once it is filled in or moved to another folder, a second import goes ahead; without it, the file being imported is read on its own.",
      { FILE: name });
  const t = table(text, delim);
  const out = new Map();
  t.rows.forEach(r => {
    const k = cellText(r[keyCol] || "");
    if (k) out.set(k, cellText(r[valCol] == null ? "" : r[valCol]));
  });
  return out;
}

/* A label the sibling file gives is what the shelf shows, including where it is the same words
   as the key. The cover names the ones a row uses. Eight are written out and the rest are
   counted. A blank label is not one: the key stands, and this line does not name it. */
function langFrame(code) {
  if (code === "en") return { frame: "English" };
  if (code === "pl") return { frame: "Polish" };
  return String(code || "").toUpperCase();
}

/* A label the sibling file gives is what the shelf shows, including where it is the same words
   as the key. The cover names the ones a row uses. Eight are written out and the rest are
   counted. A blank label is not one: the key stands, and this line does not name it. */
function reportSiblingLabels(shelfOrder, catLabels, note) {
  const taken = shelfOrder.filter(k => catLabels.get(k));
  if (!taken.length) return;
  const shown = taken.slice(0, 8);
  const more = taken.length - shown.length;
  const list = shown.map(k => ({
    frame: '"{FROM}" as "{TO}"',
    vars: { FROM: k, TO: catLabels.get(k) },
  })).reduce((acc, cur) => acc ? { frame: "{A}, {B}", vars: { A: acc, B: cur } } : cur, null);
  note("warning", noteOf("labels renamed by categories.csv beside the file: {N}. {LIST}{MORE}", {
    N: taken.length,
    LIST: list,
    MORE: more ? { frame: ", and the rest: {M}", vars: { M: more } } : "",
  }));
}

function splitClauses(v) {
  return String(v || "").split(";").map(cellText).filter(Boolean);
}

/* A BODY'S SHAPE, READ OFF ITS FIRST LINE BY THE PINNED ENGINE'S OWN MARKER (`marker` is the pin's
   V2_MARKER_RE, never a pattern of Studio's). The first language in `codes` that has text decides,
   which is the primary wherever the card has it; the engine's lint compares the other languages
   against it, so a language that disagrees is said there, as for any catalog. */
function shapeOf(body, codes, marker) {
  const map = body || {};
  const code = codes.find(c => String(map[c] || "").trim());
  const first = code ? String(map[code]).split("\n").map(s => s.trim()).filter(Boolean)[0] : "";
  const m = first ? marker.exec(first) : null;
  return !m ? "plain" : m[1] === "step" ? "steps" : "alts";
}

/* AWAITING A LANGUAGE IS A STATE, NOT FORTY ERRORS. Board item 493, settled by the spec.
 *
 * A vendor export carries one language, and a catalog without a second one is not a broken
 * catalog. Spec 2.7: every card must carry title and body in the PRIMARY language, and "any
 * other language is optional, and a card missing one speaks the primary instead". Maxim's
 * decision A1.3 of 2026-09-11: catalogs are language agnostic. So the absence is reported ONCE,
 * as a state named `awaiting` carrying the language and the number of cards waiting for it.
 *
 * THE VERDICT IS THE PINNED ENGINE'S, AND TWO ENGINES ANSWER DIFFERENTLY (board 510):
 *   - one whose lint returns an `awaiting` list has the class of its own, so it is ASKED: the
 *     draft is linted with the language DECLARED and nothing filled, and the engine's own line
 *     and count are taken whole;
 *   - an older one calls every such card an error - `card N ("T"): Polish (pl) is required`,
 *     whatever the file's own `langs` says - so the question is asked DIFFERENTIALLY instead:
 *     the draft is linted with the language declared and FILLED from the primary, and what
 *     disappears is what the absence caused. One error per card is what that engine writes, so
 *     the number of findings that disappear is the number of cards.
 * Which of the two is decided by the shape of the lint's own return, never by the pin's hash.
 *
 * WHICH FINDINGS THE ABSENCE CAUSED IS ASKED OF THE ENGINE, NEVER OF A REGEX. Matching the
 * lint's prose would be a copy of the engine's wording living in Studio, and it would fail
 * SILENTLY the day the wording changed. THE PROBE MUST COME BACK CLEAN OR IT PROVES NOTHING - a
 * catalog the reader REFUSES returns the refusal and nothing else, so every finding would look
 * as though it had disappeared. Measured while this was written: with the draft's own `hash`
 * left on the probe the reader refuses it for the hash alone and all forty findings "vanish".
 * Hence the hash is recomputed and any error the probe ADDS voids the class.
 *
 * STUDIO CLASSES, IT DOES NOT OVERRULE. Every other error stands as an error and the engine's
 * untouched counts stay at engineLint.raw. PUBLISH SHOWS THE STATE AND DOES NOT REFUSE IT since
 * Maxim's ruling of 2026-09-18 (board 510): src/publish.mjs asks this same classifier and counts
 * what is awaited per language onto the publish cover and into the release notes, and only
 * errors still refuse. An importer that refused would be a wall, and this is a floor.
 */

/** The number of cards the pinned engine says lack a language, read out of its own awaiting
 *  line. THE PARSE IS TIMID, as the lint jump's in src/studio.mjs is: a line it cannot read
 *  leaves the count null and the finding still stands, because the state is the engine's word
 *  and the number is only its detail. */
function cardsAwaiting(code, line) {
  const m = new RegExp("^" + code + ": (\\d+) card").exec(String(line == null ? "" : line));
  return m ? +m[1] : null;
}

function absentLanguages(catalog, base, lintCatalog, builtIn, contentHash) {
  const declared = (catalog.langs || []).map(l => l.code);
  const primary = declared[0];
  const asked = Array.isArray(base.awaiting);
  const out = [];
  for (const code of builtIn) {
    if (declared.indexOf(code) > -1) continue;
    const probe = JSON.parse(JSON.stringify(catalog));
    probe.langs = probe.langs.concat([{ code, label: code.toUpperCase() }]);
    if (!asked) {
      const fill = (o, fields) => fields.forEach(f => {
        const m = o && o[f];
        if (m && typeof m === "object" && m[primary] != null && m[code] == null) m[code] = m[primary];
      });
      (probe.cards || []).forEach(c => fill(c, ["title", "body", "note"]));
      (probe.tags || []).forEach(t => fill(t, ["label", "clause", "action", "topic"]));
    }
    delete probe.hash;
    probe.hash = contentHash(probe);
    const after = lintCatalog(probe);
    const added = after.errors.filter(e => base.errors.indexOf(e) < 0);
    const gone = asked ? [] : base.errors.filter(e => after.errors.indexOf(e) < 0);
    const said = asked ? (after.awaiting || []).filter(a =>
      String(a).indexOf(code + ":") === 0 && base.awaiting.indexOf(a) < 0) : [];
    const lines = asked ? said : gone;
    out.push({ code, gone, lines, added,
               cards: asked ? cardsAwaiting(code, lines[0]) : gone.length,
               sound: added.length === 0 && lines.length > 0 });
  }
  return out;
}

/* ONE CLASSIFIER, TWO DOORS. The importer reports this state and src/publish.mjs refuses on it,
 * so both ask this function and a draft that imports as awaiting cannot publish as clean.
 * Returns the finished findings, the notes to raise where the engine could not be asked, and
 * the engine errors that were classed rather than repeated. */
function awaitingOver(catalog, base, lintCatalog, builtIn, contentHash) {
  const declared = (catalog.langs || []).map(l => l.code);
  const primary = declared[0];
  const declaredList = declared.join(", ");
  const nCards = (catalog.cards || []).length;
  const rows = [], notes = [], classed = new Set();
  const row = (code, cards, lines) => {
    const n = cards == null
      ? noteOf("this draft is waiting for its {LANG} text: the catalog declares {LANGS}, and the"
          + " engine says \"{SAYS}\"."
          + " A language beyond the first is optional, so the import stands as it is and the"
          + " gap is shown here once rather than on every card. It publishes as it stands, and what is"
          + " still missing is counted on the publish cover and in the release notes.",
          { LANG: langFrame(code), LANGS: declaredList, SAYS: String(lines[0]) })
      : noteOf("this draft is waiting for its {LANG} text: the catalog declares {LANGS}, and cards"
          + " lacking {LANG}: {N} of {TOTAL}."
          + " A language beyond the first is optional, so the import stands as it is and the"
          + " gap is shown here once rather than on every card. It publishes as it stands, and what is"
          + " still missing is counted on the publish cover and in the release notes.", /* plant:wf-tail */
          { LANG: langFrame(code), LANGS: declaredList, N: cards, TOTAL: nCards });
    rows.push({
      severity: "awaiting", lang: code, cards, engineFindings: lines.length, sample: lines[0],
      what: n.message, said: n.said,
    });
  };

  /* A language the catalog DOES declare and some cards lack, where the pin has a class for it.
     On an older pin these arrive as errors and stay errors, because there the gap is per card
     and somebody can close it one card at a time. */
  (Array.isArray(base.awaiting) ? base.awaiting : []).forEach(line => {
    const code = declared.filter(c => c !== primary)
      .find(c => String(line).indexOf(c + ":") === 0);
    if (!code) {
      notes.push(noteOf("the engine reports a language awaiting text under a name this draft does"
        + " not declare: {LINE}", { LINE: String(line) }));
      return;
    }
    row(code, cardsAwaiting(code, line), [line]);
  });

  /* A language the engine has and the catalog never declared at all. */
  absentLanguages(catalog, base, lintCatalog, builtIn, contentHash).forEach(a => {
    if (!a.sound) {
      /* The classification failed rather than found nothing, so say which, and leave every
         finding exactly as the engine wrote it. Silence here would read as agreement. */
      if (a.added.length) notes.push(noteOf("the engine could not be asked which of its findings the"
        + " absence of {LANG} causes, because the test catalog added findings of its own: {N}"
        + " (the first: {FIRST}). So all of them stand as errors",
        { LANG: langFrame(a.code), N: a.added.length, FIRST: String(a.added[0]) }));
      return;
    }
    a.gone.forEach(e => classed.add(e));
    row(a.code, a.cards, a.lines);
  });
  return { rows, notes, classed };
}

/* WHICH CARDS ARE AWAITING A LANGUAGE, ASKED ONE CARD AT A TIME OF THE ENGINE'S OWN LINT.
 *
 * The finding above says "pl: 8 card(s) lacking text" and names no card, because the engine
 * counts the state over the whole catalog. A screen that marks a ROW has to know which eight,
 * and board 548 is that gap: the publish cover could say the number and the cards table could
 * say nothing at all.
 *
 * IT IS ASKED, NOT DERIVED, for the reason the classifier above gives at length. The rule that
 * decides it - a body key empty after trimming, under the language's own column name - is the
 * engine's, and a copy of it here would be a second implementation of a count this repository
 * is not allowed to have one of, failing SILENTLY the day the engine's rule moved. So the same
 * lint is asked again over a catalog holding the catalog's own languages and ONE of its cards,
 * where its answer can only be about that card.
 *
 * IT IS HELD TO THE ENGINE'S OWN COUNT AND DROPPED WHOLE WHERE IT DISAGREES. The per-card
 * answers are attributed only when there are exactly as many of them as the whole-catalog
 * finding said, which is what makes this an attribution of the engine's number rather than a
 * second opinion about it: a probe the reader refuses answers with an empty list and so
 * under-counts, a probe that somehow counted twice over-counts, and either way the language
 * loses its ids and the screen shows the count with no marks. Silence is the right failure
 * here - a chip on the wrong row is worse than no chip.
 *
 * AN ENGINE WITHOUT THE CLASS IS NOT ASKED AT ALL. Where `awaiting` is not an array the pin is
 * one of the older ones (board 510), and there every such card is already an ERROR naming that
 * card, which the lint list has always shown per card and can jump to. Nothing is lost by
 * leaving the marks off; what would be lost by guessing is the one thing this file protects.
 *
 * Cost, measured on this desk 2026-09-19 with the pinned lint: 258 one-card probes over a
 * 258-card catalog, 4 ms, against 2 ms for the one whole-catalog lint beside them.
 */
function awaitingCards(catalog, rows, lintCatalog) {
  const out = Object.create(null);
  const cards = Array.isArray(catalog.cards) ? catalog.cards : [];
  const declared = (catalog.langs || []).map(l => l.code);
  (rows || []).forEach(r => {
    const code = r.lang;
    /* No count came back from the engine's own line, so there is nothing to hold an
       attribution to and the timid answer is none. */
    if (r.cards == null) return;
    const langs = declared.indexOf(code) > -1
      ? catalog.langs
      : (catalog.langs || []).concat([{ code, label: code.toUpperCase() }]);
    const ids = [];
    let asked = true;
    for (const card of cards) {
      const probe = Object.assign({}, catalog, { langs, cards: [card] });
      /* The hash is the whole catalog's and this is not the whole catalog, so it is dropped
         rather than recomputed: the reader accepts a document that carries none, and every
         finding would otherwise be the hash's. */
      delete probe.hash; delete probe.sig;
      const said = lintCatalog(probe).awaiting;
      if (!Array.isArray(said)) { asked = false; break; }
      if (said.some(a => String(a).indexOf(code + ":") === 0)) ids.push(card.id);
    }
    if (asked && ids.length === r.cards) out[code] = ids;
  });
  return out;
}

/* THE ENGINE'S OWN VERDICT AS THE REPORT CARRIES IT, and every number here counts ENGINE
 * FINDINGS, not cards: `errors` and `warnings` are lines the engine wrote and `awaiting` is the
 * lines of its the state accounts for, which is the only reading under which the three can be
 * added up. How many CARDS are waiting is on the finding itself, as `cards`.
 *
 * IT IS COUNTED FROM THE FINDINGS AND NOT FROM `classed`, and that is Clement's measurement of
 * 2026-09-18 (board 518, 530): `classed` holds engine ERROR lines and it is filled on the
 * differential path alone, so at an engine that emits the awaiting class it is empty and the
 * field read 0 while forty cards waited. Each finding carries the number of engine findings it
 * took - the gone errors on one path, the engine's own awaiting lines on the other - so the sum
 * of those is the one number that means the same thing on either pin. He measured it by calling
 * the exported awaitingOver with a stub lint rather than by moving the pin, and the leg in
 * tests/import.mjs does the same over this function.
 *
 * `raw` stays the engine's untouched output, so a report can be read against that engine's own
 * console: at an older pin its awaiting list does not exist and the count is 0, and at a newer
 * one a draft declaring one language gets nothing from it either, because the class covers only
 * the languages a catalog declares. That 0 is a fact about the engine and not about the draft.
 */
function lintBlock(engineLint, awaits) {
  const classed = awaits.classed;
  const taken = awaits.rows.reduce((n, r) => n + (+r.engineFindings || 0), 0);
  return {
    errors: engineLint.errors.length - classed.size,
    warnings: engineLint.warnings.length,
    awaiting: taken,
    raw: { errors: engineLint.errors.length, warnings: engineLint.warnings.length,
           awaiting: (engineLint.awaiting || []).length },
  };
}

const FIELD_WORD = {
  title: "Title", body: "Text", shelf: "Categories", requests: "Intents",
  role: "Who", id: "Identifier", keys: "Keywords", k: "Keywords", note: "Note",
};

function fieldFrame(field, lang) {
  const head = FIELD_WORD[field] || field;
  if (!lang) return { frame: head };
  if (lang === "en") return { frame: head + " (English)" };
  if (lang === "pl") return { frame: head + " (Polish)" };
  return { frame: "{HEAD} ({LANG})", vars: { HEAD: { frame: head }, LANG: lang.toUpperCase() } };
}

function colsJoinFrame(cols) {
  if (!cols || !cols.length) return "";
  if (cols.length === 1) return JSON.stringify(cols[0]);
  if (cols.length === 2) {
    return { frame: "{A} and {B}", vars: { A: JSON.stringify(cols[0]), B: JSON.stringify(cols[1]) } };
  }
  const head = cols.slice(0, -1).map(c => JSON.stringify(c)).join(", ");
  return { frame: "{HEAD} and {LAST}", vars: { HEAD: head, LAST: JSON.stringify(cols[cols.length - 1]) } };
}

async function importCsv(opts) {
  const o = opts || {};
  const file = o.file ? path.resolve(o.file) : null;
  const dir = file ? path.dirname(file) : (o.dir || process.cwd());
  const F = await Engine.format();
  const { lintCatalog } = Engine.lint();
  const bodyMarker = Engine.bodyRules().V2_MARKER_RE;
  const { ecBlocks } = Engine.countRules();
  const findings = [];
  /* A NOTE IS A SENTENCE OR A FRAME (sense pass 2026-09-22, item 21). One built by noteOf()
     carries its English as `what`, which the command line prints and the report keeps, and its
     frame beside it as `said`, which the wizard says in the interface's language. The notes a
     person meets on the wizard's covers are framed; the rest are still English sentences, and
     the list of those is in the report of the run that framed these. */
  const note = (severity, what, where) => {
    const f = what && typeof what === "object"
      ? { severity, what: what.message, said: what.said } : { severity, what };
    if (where != null) f.where = where;
    findings.push(f);
  };

  /* The mapping table's engine half against the engine's own vocabulary, before a single
     token is translated. A stale row here would render as literal text on a desk. */
  const stale = verifyPlaceholders(Engine.cardTokens().tokens);
  if (stale.length) throw new Error(stale.join("; ")
    + " - the placeholder table and the pinned engine have drifted apart");

  /* ---- the bytes ------------------------------------------------------------------------ */

  const buf = o.text != null ? Buffer.from(String(o.text), "utf8") : fs.readFileSync(file);
  /* WHAT THE FILE IS, BEFORE A COLUMN IS MAPPED (boards 641, 642). src/source.mjs reads the
     bytes and says whether this is a CSV or a workbook, and whether what is inside is a table,
     a column that comes round in a cycle, or a pile with no structure in it. What comes back is
     the table src/csv.mjs would have returned either way, so every verdict below - the column
     rules, the language guess, the engine's own lint - is the one a real CSV would have got. */
  const src = examine({ buf, provider: o.provider || null });
  const dec = { encoding: src.encoding, replaced: src.replaced, offsets: src.offsets || [] };
  if (dec.encoding !== "utf-8")
    note("warning", noteOf("the file is not valid UTF-8 and was read as {ENC}; byte sequences a"
      + " UTF-8 reader would have replaced: {N}. Check the letters of any card that looked wrong"
      + " before this catalog goes out", { ENC: dec.encoding,
        N: dec.offsets.length ? dec.offsets.join(", ") : dec.replaced }));
  const isTableTwice = n => (n.said && n.said.frame && n.said.frame.startsWith("Some names appear more than once in the heading row"))
    || (typeof n.what === "string" && n.what.startsWith("Some names appear more than once in the heading row"));
  src.notes.filter(n => !isTableTwice(n)).forEach(n => note(n.severity, n.said ? { message: n.what, said: n.said } : n.what));
  const t = src.table;
  if (!t.rows.length) throw refuse("the CSV has a header and no rows");
  t.duplicateHeaders.forEach(h =>
    note("error", noteOf("More than one column is headed {NAME}, and only the last of them"
      + " was read. Once each has a name of its own in the file, a second import reads them all.",
      { NAME: JSON.stringify(h) })));

  /* ---- columns to fields ----------------------------------------------------------------- */

  const mapped = mapHeaders(t.head, o.override);
  /* The two-claim note replaces the raw English '2 columns claim ...' error and points only
     at actions the screen really offers (board 780). */
  (mapped.errorNotes || mapped.errors)
    .filter(e => !/^columns claiming /.test(typeof e === "string" ? e : e.message))
    .forEach(e => note("error", e));
  (mapped.collisions || []).forEach(c => {
    note("error", noteOf("The columns {COLUMNS} went under the same field, \"{FIELD}\", which"
      + " holds only one; for now, {FIRST} is the one read. On the screen \"What is in this file\","
      + " each can be given a field of its own on its row, or left out with \"Do not import\".", {
        COLUMNS: colsJoinFrame(c.columns),
        FIELD: fieldFrame(c.field, c.lang),
        FIRST: JSON.stringify(c.first),
      }));
  });
  mapped.columns.filter(c => !c.field && c.rule !== "override, dropped").forEach(c =>
    note("warning", noteOf("The column {NAME} stays out of the import, as Studio could not"
      + " tell which field it belongs to. If it holds catalog content, the screen \"What is in"
      + " this file\" offers a field for it on its row. If not, nothing needs doing.",
      { NAME: JSON.stringify(c.header) })));

  /* When a column took its language from neighbouring headings and text does not confirm it,
     say so (board 779). Where text confirms it, or reads as the other of pl and en (where
     line 447 speaks), nothing is shown. */
  mapped.columns.filter(c => c.rule === "alias, main language of the sheet").forEach(c => {
    const passages = t.rows.map(r => r[c.header]);
    const said = detect(passages);
    const confirmed = said.verdict === c.lang;
    const isOtherPlEn = (c.lang === "pl" && said.verdict === "en") || (c.lang === "en" && said.verdict === "pl");
    if (!confirmed && !isOtherPlEn) {
      note("warning", noteOf("The column {COLUMN} went under \"{FIELD}\" because of the headings"
        + " beside it; its text alone could not confirm that. If the language is right, nothing"
        + " needs doing. If not, the screen \"What is in this file\" offers the right one on this"
        + " column's row, or \"Do not import\".", {
          COLUMN: JSON.stringify(c.header),
          FIELD: fieldFrame(c.field, c.lang),
        }));
    }
  });

  const colsFor = (field, lang) => mapped.columns.filter(c =>
    c.field === field && (FIELDS[field].lang ? (c.lang || null) === (lang || null) : true));
  const one = (field, lang) => (colsFor(field, lang)[0] || {}).header || null;

  /* ---- which languages, and what the text says about them -------------------------------- */

  /* The languages the HEADERS claim, in the order they appear, with a bare "body" counting as
     the primary. The primary is the caller's when given, otherwise the first language a body
     column names, otherwise English. */
  const bodyCols = mapped.columns.filter(c => c.field === "body");
  const headerLangs = [];
  bodyCols.forEach(c => { const l = c.lang; if (l && !headerLangs.includes(l)) headerLangs.push(l); });
  /* WHERE NO HEADING NAMES A LANGUAGE, THE TEXT MAY (sense pass 2026-09-22, item 3). A Polish
     file headed Title and Body was filed under English, its Polish text shown under ANGIELSKI
     and every card then "awaiting PL". The header still wins wherever there is one - that rule
     is below and unchanged - but a bare heading says nothing about language, and an
     unambiguous verdict of the detector over the one bare body column is better evidence than
     the default. Undetermined stays English, as before. */
  const bare = mapped.columns.find(c => c.field === "body" && !c.lang);
  const readAs = (!o.primary && !headerLangs.length && bare)
    ? detect(t.rows.map(r => r[bare.header])).verdict : null;
  const primary = o.primary || headerLangs[0] || readAs || "en";
  if (!headerLangs.includes(primary)) headerLangs.unshift(primary);
  const codes = [primary].concat(headerLangs.filter(l => l !== primary));

  const languages = codes.map(code => {
    const header = one("body", code) || (code === primary ? one("body", null) : null);
    const passages = header ? t.rows.map(r => r[header]) : [];
    const said = detect(passages);
    const filled = passages.filter(p => String(p || "").trim()).length;
    /* THE HEADER IS CHECKED BY THE TEXT AND KEPT ANYWAY. Overruling a column heading on a
       heuristic is how an importer loses a language; saying nothing is how it ships one that
       is wrong. So: a disagreement is a finding, and the header still decides. */
    if (said.verdict && said.verdict !== code)
      /* The detector's own account of why stays in `languages[].why`, where the second cover
         reads it; a sentence of the detector's inside this one would be English on any screen. */
      note("error", noteOf("the column {NAME} is headed {CODE} and reads as {READS}; the header"
        + " was kept, so either the heading or the content is wrong and only a person can say"
        + " which", { NAME: JSON.stringify(header), CODE: code, READS: said.verdict }));
    if (header && filled < t.rows.length)
      note("warning", noteOf("rows with no {CODE} text in {NAME}: {MISSING} of {TOTAL};"
        + " the engine refuses a card with no text in a language the"
        + " catalog declares, so those cards will fail the checks until"
        + " they are filled or {CODE} is dropped",
        { CODE: code, NAME: JSON.stringify(header), MISSING: t.rows.length - filled,
          TOTAL: t.rows.length }), code);
    return { code, column: header, rows: filled, detected: said.verdict,
             why: said.why, override: o.primary && code === primary ? "primary given by hand"
               : (readAs && code === primary ? "primary read from the text" : null) };
  });
  /* A language no column carries is not declared: a promise the Languages screen would then
     have to explain away (the engine's own converter says the same and for the same reason). */
  const spoken = languages.filter(l => l.column && l.rows > 0).map(l => l.code);
  if (!spoken.includes(primary)) throw refuse(NO_PRIMARY, { CODE: primary.toUpperCase() });

  /* ---- the rows -------------------------------------------------------------------------- */

  const idCol = one("id"), shelfCol = one("shelf"), reqCol = one("requests"), roleCol = one("role");
  const keysCol = one("keys");
  if (!shelfCol) note("warning", noteOf("no column names a category, so every card lands on"
    + " one shelf"));

  const catLabels = sibling(dir, "categories.csv", "key", "label");
  const declaredClauses = sibling(dir, "intents.csv", "clause_" + primary, "clause_" + primary);
  /* THE OTHER LANGUAGES' LABELS AND CLAUSES, where the two tables carry them: a `label_<code>`
     column beside `label`, keyed by the category key, and a `clause_<code>` column beside the
     primary clause, keyed by it, for each language the file speaks besides the primary. That is
     what src/export-csv.mjs writes, so a catalog in two languages comes back with its categories
     and intents in both; a table without such a column gives nothing, as before. */
  const others = spoken.filter(code => code !== primary);
  const otherLabels = catLabels
    ? others.map(code => [code, sibling(dir, "categories.csv", "key", "label_" + code)]) : [];
  const otherClauses = declaredClauses
    ? others.map(code => [code, sibling(dir, "intents.csv", "clause_" + primary, "clause_" + code)]) : [];

  const seenIds = new Map();
  /* The engine's own rule for a taken id, and the engine's own reason: handing the second
     claimant the taken id writes a file whose ids repeat, which the reader refuses outright,
     so two rows that happened to share one cost the author the whole catalog. */
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

  /* Shelves first, so a card can name one; only the keys at least one row uses. */
  const shelfOrder = [];
  t.rows.forEach(r => {
    const k = cellText((shelfCol ? r[shelfCol] : "") || "");
    if (k && !shelfOrder.includes(k)) shelfOrder.push(k);
  });
  if (!shelfOrder.length) shelfOrder.push(o.fallbackShelf || "imported");
  const shelfOf = {};
  const tags = [];
  shelfOrder.forEach(k => {
    const c = claim(F.tagId(k), "shelf " + k);
    shelfOf[k] = c.id;
    if (c.collided) note("warning", noteOf("two category keys slug to one id; {KEY} was given {ID}"
      + " so that {TAKEN} stays with the first", { KEY: JSON.stringify(k), ID: c.id,
        TAKEN: c.taken }));
    const label = {};
    label[primary] = (catLabels && catLabels.get(k)) || k;
    otherLabels.forEach(([code, m]) => { if (m.get(k)) label[code] = m.get(k); });
    tags.push({ id: c.id, kind: "shelf", label });
  });
  if (catLabels) {
    reportSiblingLabels(shelfOrder, catLabels, note); /* plant:sibling-label */
    /* THE INVERSE IS THE LOUDER HALF. A row naming a key the pile's own category table does
       not declare is either a typo in one row or a shelf somebody forgot to describe, and
       either way the shelf is minted with its bare key as its label, which is what a customer
       then reads on the pill. Minting it anyway is deliberate: dropping the row instead would
       lose a card, and a shelf labelled with its key is visibly wrong rather than invisibly
       absent. */
    const orphan = shelfOrder.filter(k => !catLabels.has(k));
    orphan.forEach(k => note("warning", noteOf("cards are filed under the category key {KEY},"
      + " which categories.csv does not declare; the shelf was minted and labelled with the key"
      + " itself, so it will read as {KEY} on the pill until somebody names it",
      { KEY: JSON.stringify(k) })));
    const unused = Array.from(catLabels.keys()).filter(k => !shelfOrder.includes(k));
    if (unused.length) note("note", noteOf("category keys declared in categories.csv that no row"
      + " uses, so no category was made for them: {N} ({LIST}). An empty category is the first"
      + " thing a customer sees go wrong", { N: unused.length, LIST: unused.join(", ") }));
  }

  /* Requests from the clauses the rows actually name, in first-seen order. */
  const clauseOrder = [];
  t.rows.forEach(r => splitClauses(reqCol ? r[reqCol] : "").forEach(cl => {
    if (!clauseOrder.includes(cl)) clauseOrder.push(cl);
  }));
  const requestOf = {};
  clauseOrder.forEach(cl => {
    const c = claim(F.tagId(cl), "request " + cl);
    requestOf[cl] = c.id;
    const clause = {}; clause[primary] = cl;
    otherClauses.forEach(([code, m]) => { if (m.get(cl)) clause[code] = m.get(cl); });
    tags.push({ id: c.id, kind: "request", clause });
  });
  if (declaredClauses) {
    const unused = Array.from(declaredClauses.keys()).filter(k => !clauseOrder.includes(k));
    if (unused.length) note("note", noteOf("intent clauses declared in intents.csv that no row"
      + " names: {N} ({LIST}{MORE})", {
        N: unused.length,
        LIST: unused.slice(0, 6).join("; "),
        MORE: unused.length > 6 ? { frame: ", and the rest: {M}", vars: { M: unused.length - 6 } } : "",
      }));
  }

  const placeholders = [];
  const roles = [];
  const lostIds = [];
  const cards = t.rows.map(r => {
    const shelfKey = cellText((shelfCol ? r[shelfCol] : "") || "") || shelfOrder[0];
    const titleRaw = cellText(r[one("title", primary)] || r[one("title", null)] || "");
    const own = String(idCol ? (r[idCol] || "") : "").trim();
    /* THE ROW'S OWN IDENTITY IS KEPT WHEREVER ONE CHARACTER STANDS IN THE WAY (sense pass
       2026-09-22, item 13). An export's ids are commonly written with underscores, which the
       format does not allow, and every such row lost its identity to one minted from its title,
       one warning per row; a card id is the permanent key desk stars and edits hang on. The
       underscore becomes the hyphen, deterministically, before the format's own test. */
    const ownOk = own.replace(/_/g, "-");
    /* And with no category column the minted id is the title's alone: every card used to be
       minted as c-imported-<title>, freezing the fallback shelf's word into every identity. */
    /* A CALLER THAT MEANS THE ROW AS A NEW CARD IN A CATALOG IN USE hands a mint of its own (a
       sheet brought back by id, C09); the command line and the wizard mint from the title as ever. */
    const wanted = F.idOk(ownOk) ? ownOk
      : (typeof o.mintId === "function" ? o.mintId() : F.cardId((shelfCol ? shelfKey + "-" : "") + titleRaw));
    const c = claim(wanted, "card at row " + r.__row);
    if (c.collided) note("error", noteOf("row {ROW} claims the id {TAKEN}, which is taken; it was"
      + " given {ID} so the file still loads, but two rows asking for one identity is a merge"
      + " somebody has to make", { ROW: r.__row, TAKEN: c.taken, ID: c.id }), r.__row);
    if (own && !F.idOk(ownOk)) lostIds.push({ row: r.__row, own, id: c.id });

    const card = { id: c.id, shelf: shelfOf[shelfKey] || shelfOf[shelfOrder[0]] };
    ["title", "body", "note"].forEach(field => {
      const map = {};
      codes.forEach(code => {
        const h = one(field, code) || (code === primary ? one(field, null) : null);
        if (!h) return;
        const raw = cellText(r[h] == null ? "" : r[h]);
        if (!raw) return;
        const tr = translate(raw);
        tr.found.forEach(f => placeholders.push({ card: c.id, row: r.__row, field, lang: code,
          token: f.token, to: f.to, known: f.known }));
        map[code] = tr.text;
      });
      if (Object.keys(map).length) card[field] = map;
    });
    /* PLAIN, UNLESS THE CELL IS ALREADY WRITTEN IN THE ENGINE'S OWN ENCODING. A CSV cell carries
       prose, and nothing here splits a numbered list into steps. But a cell whose first line is
       the engine's marker ([step], [alt] or [alt: a label], whole on its line) is a steps or alts
       body as the format writes one, which is what src/export-csv.mjs writes for such a card and
       what a desk's catalog brought back as a project carries (board 890). Filing it as plain
       loses the shape and leaves a body the engine's lint refuses, since a plain body may carry no
       marker. The count rule at the head of this file follows the shape, by the engine's ecBlocks. */
    card.bodyShape = shapeOf(card.body, codes, bodyMarker);
    /* THE BAG IS CARRIED AS IT WAS WRITTEN, one string, not re-split and re-joined. `k` is a
       single field the engine splits at search time, so a separator this file imposed would be
       Studio holding an opinion about a rule that belongs to the engine; and an author who
       separated their keywords with slashes would find them silently rewritten. */
    const bagRaw = cellText(keysCol ? (r[keysCol] || "") : "");
    if (bagRaw) card.k = bagRaw;
    const links = splitClauses(reqCol ? r[reqCol] : "").map(cl => requestOf[cl]).filter(Boolean);
    if (links.length) card.requests = links;
    const roleVal = cellText(roleCol ? (r[roleCol] || "") : "");
    /* A role column holding an engine token is the pile saying "the agent's own role goes
       here", not a name: {ROLE} is what the engine fills, so carrying it into the catalog's
       list of roles would offer the author a role literally called "{ROLE}". */
    if (roleVal && !/^\{[A-Z]+\}$/.test(roleVal) && !roles.includes(roleVal)) roles.push(roleVal);
    return card;
  });

  /* ONE NOTE FOR EVERY ROW WHOSE OWN ID COULD NOT BE KEPT, not one per row (item 13): twelve
     rows made twelve warnings on the cover and buried everything else. The first three are
     named, which is enough to see what kind of id the file carries. */
  /* THE COUNT AFTER A COLON, where Polish can say it (src/refusal.mjs); the rows named after it
     are the file's own values and are not words. */
  if (lostIds.length) note("warning", noteOf("rows whose id is not 3 to 64 of a-z, 0-9 and the"
    + " hyphen, each given a new one under which every desk files that card from now on: {N}."
    + " The first of them: {FIRST}", { N: lostIds.length,
      FIRST: lostIds.slice(0, 3).map(x => x.row + " " + JSON.stringify(x.own) + " -> " + x.id)
        .join(", ") }));

  /* ---- duplicates ------------------------------------------------------------------------ */

  const dups = findDuplicates(cards.map((c, i) => ({
    ref: c.id, shelf: c.shelf,
    title: (c.title || {})[primary] || "", body: (c.body || {})[primary] || "",
  })), F.slug);
  dups.exact.forEach(d => note("error", d.on === "body"
    ? noteOf("card {TWIN} carries the same text as {OF}, once letter case, accents and punctuation are"
      + " set aside; the import keeps both as cards of their own, and if they are one answer, one card"
      + " is enough, and if two, each can have words of its own", { TWIN: d.twin, OF: d.of })
    : noteOf("cards {TWIN} and {OF} share one title in one category, once letter case, accents and"
      + " punctuation are set aside; the import keeps both as cards of their own, and at the desk they"
      + " look alike until one is given another title or the two become one card",
      { TWIN: d.twin, OF: d.of })));
  dups.near.forEach(d => note("warning", noteOf("near duplicate: {TWIN} and {OF} score title"
    + " {TITLE}, body {BODY} against thresholds {T1} and {T2} ({ON})", { TWIN: d.twin, OF: d.of,
      TITLE: d.title, BODY: d.body, T1: dups.thresholds.title, T2: dups.thresholds.body,
      ON: d.on })));

  /* ---- placeholders ---------------------------------------------------------------------- */

  const mappedTokens = placeholders.filter(p => p.to);
  const flagged = placeholders.filter(p => !p.to);
  const byToken = m => {
    const out = new Map();
    m.forEach(p => out.set(p.token, (out.get(p.token) || 0) + 1));
    return Array.from(out.entries()).map(([token, n]) => ({ token, n }))
      .sort((a, b) => b.n - a.n || a.token.localeCompare(b.token));
  };
  byToken(flagged).forEach(x => note("warning", noteOf("the platform placeholder {TOKEN} has no"
    + " engine equivalent and was left in the text exactly as it stands, {USES}; a card carrying"
    + " it shows it to the customer", { TOKEN: x.token,
      USES: counted(x.n, "{N} use", "{N} uses") })));

  /* ---- the draft ------------------------------------------------------------------------- */

  /* ANY EXTENSION COMES OFF THE STEM, not only .csv (item 13): a workbook gave the id ragged-xlsx,
     and a text file replies-txt. */
  const stem = String(file ? path.basename(file).replace(/\.[A-Za-z0-9]{1,5}$/, "")
    : "imported catalog").trim()
    || "Imported catalog";
  const id = String(o.id || F.slug(stem)).trim();
  if (!F.idOk(id)) throw refuse("the catalog id {ID} is not 3 to 64 characters of a to z, 0 to 9"
    + " and the hyphen; an id of your own can be typed in its place", { ID: JSON.stringify(id) },
    "the catalog id {ID} is not 3 to 64 of a-z, 0-9 and the hyphen; pass --id");

  const catalog = {
    format: F.FORMAT, kind: F.KIND, id,
    rev: o.rev == null ? 1 : +o.rev,
    langs: spoken.map(code => ({ code, label: code.toUpperCase() })),
    commentLang: primary,
    tags, cards,
  };
  if (roles.length) catalog.role = roles;
  catalog.minEngine = "2.0.0";
  catalog.hash = F.contentHash(catalog);

  /* ---- what the keyword bags buy ---------------------------------------------------------- */

  const splitWords = Engine.wordRules().splitWords;
  const bagRows = cards.map((c, i) => {
    const b = bagOnly(c, catalog, splitWords);
    return { card: c.id, row: t.rows[i].__row, words: b.bag.length, only: b.only };
  }).filter(r => r.words);
  const bagWords = bagRows.reduce((n, r) => n + r.words, 0);
  const bagOnlyWords = bagRows.reduce((n, r) => n + r.only.length, 0);
  const bagRepeats = bagRows.filter(r => !r.only.length);
  if (bagRows.length) {
    /* ONE NOTE AND NOT ONE PER CARD. A pile of two hundred cards would put two hundred findings
       on the import screen and bury every error among them; the per-card list is in the report,
       which is where somebody works through them. The note is what tells them to look. */
    const vars = { K: bagRows.length, C: cards.length, W: bagWords, O: bagOnlyWords };
    note("note", bagRepeats.length
      ? noteOf("cards with search keywords: {K} of {C}. Keywords in all: {W}; found nowhere in"
          + " the card's own title, body, note or category label: {O}. Only those add anything: every"
          + " other keyword repeats a word the card already says, and the card is found without it."
          + " Cards whose keywords only repeat the card, and could be emptied with"
          + " nothing lost: {R}."
          + " The keywords found only there are content, and content belongs in the card's text.", { ...vars, R: bagRepeats.length })
      : noteOf("cards with search keywords: {K} of {C}. Keywords in all: {W}; found nowhere in"
          + " the card's own title, body, note or category label: {O}. Only those add anything: every"
          + " other keyword repeats a word the card already says, and the card is found without it."
          + " The keywords found only there are content, and content belongs in the card's text.", vars));
  }

  /* ---- the engine's own lint over the draft ---------------------------------------------- */

  const engineLint = lintCatalog(catalog);
  const awaits = awaitingOver(catalog, engineLint, lintCatalog,
    Engine.builtInLangs(), F.contentHash);
  const classed = awaits.classed;
  /* THE ENGINE'S LINE INSIDE, as its own frame where src/lint-said.mjs has one. */
  const engineNote = (line) => noteOf("Etiuda's checks: {LINE}", { LINE: importLintSaid(line) || line });
  engineLint.errors.forEach(e => { if (!classed.has(e)) note("error", engineNote(e)); });
  /* A helpdesk token flagged above is not said again by the engine's warning about its inside. */
  untold(engineLint.warnings, tokensMet(catalog, Engine.cardTokens().tokens, engineLint.errors)
    .filter(t => t.platform)).forEach(w => note("warning", engineNote(w)));
  awaits.notes.forEach(n => note("note", n));
  /* Pushed rather than noted, because this finding carries the language it is about: a screen
     offering "draft the missing language" (spec 3.6) needs the code, not the sentence. */
  awaits.rows.forEach(f => findings.push(f));

  const counts = {
    cards: cards.length,
    macros: cards.reduce((n, c) => n + ecBlocks((c.body || {})[primary], c.bodyShape), 0),
    intents: clauseOrder.length,
    cats: shelfOrder.length,
  };

  const report = {
    kind: REPORT_KIND, schema: SCHEMA,
    source: file ? path.basename(file) : "(text)",
    /* A PASTE IS THIS ONE FILE (src/paste.mjs isPasteFile), so a file import's report stays
       the bytes it was. The queue reads the flag and says the paste in its own words. */
    ...(isPasteFile(file) ? { paste: true } : {}),
    encoding: dec.encoding,
    /* WHAT THE FILE WAS, AND WHICH FORK WAS OFFERED. A report that says a workbook's one column
       was read as a table of 37 rows has to say on what evidence, or nobody can argue with it:
       `periodic` carries the period, the score and the rule that gave each position its field. */
    read: { source: src.source, shape: src.shape, workbook: src.workbook,
            periodic: src.periodic, detection: src.detection, fork: src.fork },
    catalog: { id, rev: catalog.rev, hash: catalog.hash },
    primary, languages,
    counts,
    countRules: {
      cards: "one row of the CSV is one card, blank rows dropped",
      macros: "body blocks in the primary language by the pinned engine's ecBlocks; a plain body"
        + " is one block, so for plain bodies this is the count of rows with a non-empty primary"
        + " body, and a body opening with the engine's [step] or [alt] marker counts the blocks"
        + " its markers divide it into",
      intents: "distinct non-empty clauses over the intents column, split on \";\" and trimmed",
      cats: "distinct category keys named by at least one row; a key declared in"
        + " categories.csv and used by no row is reported and not minted",
    },
    columns: mapped.columns,
    categories: shelfOrder.map(k => ({ key: k, id: shelfOf[k],
      label: (catLabels && catLabels.get(k)) || k,
      cards: cards.filter(c => c.shelf === shelfOf[k]).length })),
    /* WHAT THE MAPPING MAKES, SHOWN AS IT IS CHOSEN (import-no-preview-of-structure, the Studio batch of 2026-10-12): each
       intent with the cards that carry it, and the rows whose intents cell holds a comma or a slash and no ";", which
       becomes one intent per distinct cell. */
    intents: clauseOrder.map(cl => ({ clause: cl, cards: cards.filter(c => (c.requests || []).indexOf(requestOf[cl]) >= 0).length })),
    joinedIntentRows: reqCol ? t.rows.filter(r => { const v = String(r[reqCol] || ""); return /[,/]/.test(v) && v.indexOf(";") < 0; }).length : 0,
    duplicates: { exact: dups.exact, near: dups.near, thresholds: dups.thresholds },
    placeholders: { mapped: byToken(mappedTokens), flagged: byToken(flagged),
      total: placeholders.length },
    keywords: {
      column: keysCol,
      carrying: bagRows.length, words: bagWords, only: bagOnlyWords,
      repeatOnly: bagRepeats.length,
      rule: "a bag word is one word of the card's `k` string under the pinned engine's own"
        + " splitWords (diacritics folded, lower-cased, split on everything that is neither a"
        + " letter nor a digit), counted once per card; it is bag-only when that exact word is"
        + " in none of the card's title, body and note in any language, nor in its category's"
        + " label, by the same rule. Whole-word identity, not the search's prefix match",
      cards: bagRows,
    },
    engineLint: lintBlock(engineLint, awaits),
    findings,
    errors: findings.filter(f => f.severity === "error").length,
    warnings: findings.filter(f => f.severity === "warning").length,
    awaiting: findings.filter(f => f.severity === "awaiting").length,
    pin: Engine.pin().commit,
  };
  /* `rowNumbers` are the sheet's own row numbers, `ownIds` the ids it wrote and `ownShelves` the category
     keys it wrote (blank where it wrote none), one per card in the draft's order. */
  return { catalog, report, stem, rowNumbers: t.rows.map(r => r.__row),
           ownIds: t.rows.map(r => String(idCol ? (r[idCol] || "") : "").trim()),
           ownShelves: t.rows.map(r => String(shelfCol ? (r[shelfCol] || "") : "").trim()) };
}

/* ONE WRITER, SO THE TWO DOORS CANNOT DISAGREE. `node tools/import.mjs` and the Import wizard
 * both land an import by calling this, exactly as publishing is one function called by the
 * command line and by the publish cover. The names and the indent are part of what a draft IS -
 * a project folder is recognised by a single `<stem>.draft.json` - so a second writer anywhere
 * would mean two files that differ by a byte and a screen whose output the command line cannot
 * read back. tests/import-screen.mjs holds the two to the same sha256.
 *
 * THE STEM IS THE ID ONLY WHERE THE CALLER GIVES NONE, which is the command line, whose id is the
 * file's slug unless --id says otherwise. The screen passes its folder's name, because a new
 * catalog's id is random (ac137e4) and a file a person meets on the share is named after
 * something they can read.
 */
function writeImport(outDir, catalog, report, stem) {
  fs.mkdirSync(outDir, { recursive: true });
  const at = stem || catalog.id;
  const draftAt = path.join(outDir, at + ".draft.json");
  const lintAt = path.join(outDir, at + ".lint.json");
  fs.writeFileSync(draftAt, JSON.stringify(catalog, null, 1) + "\n", "utf8");
  fs.writeFileSync(lintAt, JSON.stringify(report, null, 1) + "\n", "utf8");
  return { draftAt, lintAt };
}

export { importCsv, writeImport, NO_PRIMARY, REPORT_KIND, splitClauses, absentLanguages, awaitingOver, awaitingCards,
         lintBlock, bagOnly,
         SCHEMA };
