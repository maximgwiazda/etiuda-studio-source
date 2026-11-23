/* EVERY PHRASE BUILT INSIDE AN IMPORT NOTE IS SAID RIGHT IN POLISH (board 782).
 *
 *     node tests/note-phrases.mjs
 *
 * WHAT tests/polish.mjs 7a CANNOT SEE. It reads the first argument of every noteOf() and holds
 * that sentence to a pair in ui/lang.js. A note's VALUES are not read: the field a column went
 * under ("Tekst, Polski") and the columns joined ("A" i "B", or "A", "B" i "C") are frames of
 * their own, built at run time out of a field's word and a language's name, so no scan of the
 * source can know their keys, and until this file a wrong or missing Polish value for any of
 * them passed every node gate. The one screen leg that paints them (tests/import-screen.mjs 9f)
 * paints one field in one language with two columns.
 *
 * HOW THE PHRASES ARE FOUND, AND WHY NOT BY EITHER SHORTER ROAD. Exporting the builders from
 * src/import.mjs would test a function the note might stop calling; a list of the field names
 * kept here would go stale in silence the day a field is added. So the importer itself is
 * DRIVEN, over sheets made from the product's own list of fields (src/mapping.mjs FIELDS) in
 * every language branch, and every frame nested in every finding is collected from what the
 * importer returns. What is kept here is only what must be: the Polish words themselves, as
 * the oracle, keyed by field and held to FIELDS both ways, so a field added or removed turns
 * this red rather than going unwatched.
 *
 * THE ORACLES, none of them the table under test alone.
 *   - A field is said as the select says it (the copywriter's rule for {FIELD}, draft of
 *     2026-09-25, board 780): the page's own fieldWord(), langName() and FIELD_WORD, lifted out
 *     of ui/app.js and run against ui/lang.js as shipped, so the note and the select are two
 *     implementations that must agree; and the Polish words as written in this file, so a wrong
 *     word the two share is caught as well.
 *   - Columns are joined by the copywriter's rule, computed from the headings this file wrote:
 *     two names by " i " / " and ", three or more by commas with the same word before the last.
 *   - A lint line nested as "Etiuda's checks: {LINE}" (src/lint-said.mjs) has no prose to be held
 *     to yet, its Polish being placeholders the copywriter will replace; so it is held to what
 *     can be decided without prose: a Polish value, not the English, carrying exactly the
 *     English's braces. Whether it is the RIGHT Polish sentence is prose, which Maxim reads.
 *   - The note's rendering is the page's own saidText(), lifted from ui/app.js like the rest.
 *
 * NOTHING NEW ENTERS UNWATCHED. Every nested frame met in every finding must be one of the
 * kinds above or this file fails, and the nested-frame sites in the node half that feeds the
 * importer's notes are counted, so a phrase added in a note no sheet here raises turns this red
 * with a pointer to where it was added.
 *
 * Node only, no window. Exit 0 when every check holds, 1 when any fails, 2 when the gate itself
 * could not run.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { importCsv } from "../src/import.mjs";
import { FIELDS } from "../src/mapping.mjs";
import { LINT_FRAMES } from "../src/lint-said.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "note-phrases");

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}

/* ---- the oracle's own words --------------------------------------------------------------------
   The select's Polish, one word per field of src/mapping.mjs FIELDS, and the two languages the
   select names in words; any other language it names by its code in capitals (ui/app.js
   langName). Written from the screen's words and the copywriter's filled examples ("Treść
   (polski)", "Treść (angielski)", "Kategorie"), not read out of ui/lang.js. */
const PL_WORD = {
  id: "Identyfikator", shelf: "Kategorie", requests: "Intencje", role: "Kto",
  keys: "Słowa kluczowe", title: "Tytuł", body: "Treść", note: "Notatka",
};
const PL_LANG = (l) => l === "en" ? "angielski" : l === "pl" ? "polski" : l.toUpperCase();
const plField = (f, l) => PL_WORD[f] + (l ? " (" + PL_LANG(l) + ")" : "");
/* A language no pair names, for the third branch of a field's phrase. */
const OTHER = "de";

/* ---- the page, run as a page runs it -------------------------------------------------------- */

function loadLang() {
  const src = fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8");
  const ANCHOR = "window.STUDIO_T = {";
  if (src.split(ANCHOR).length !== 2) throw new Error("ui/lang.js no longer hands its table to window as " + ANCHOR);
  const window = {};
  vm.runInNewContext(src.replace(ANCHOR, ANCHOR + " __pl: () => Object.assign({}, PL),"),
    { window, String, Object, Array, JSON, Math, Number });
  return window.STUDIO_T;
}

/* The text from `start` to the brace that closes the first brace after it, strings and comments
   skipped. Enough for the four pieces lifted below, none of which holds a regular expression; a
   lift that went wrong fails to compile, and that is a failure of the gate, not a pass. */
function liftFrom(src, start) {
  const Q1 = String.fromCharCode(39), Q2 = String.fromCharCode(34), BT = String.fromCharCode(96);
  const BS = String.fromCharCode(92);
  let i = src.indexOf("{", start), depth = 0, q = null;
  for (; i < src.length; i++) {
    const c = src[i];
    if (q) { if (c === BS) { i++; continue; } if (c === q) q = null; continue; }
    if (c === Q1 || c === Q2 || c === BT) { q = c; continue; }
    if (c === "/" && src[i + 1] === "*") { i = src.indexOf("*/", i + 2) + 1; continue; }
    if (c === "/" && src[i + 1] === "/") { i = src.indexOf("\n", i); continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  throw new Error("no closing brace after offset " + start);
}

function liftPage(L) {
  const app = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
  const heads = ["const FIELD_WORD = ", "function langName(", "function fieldWord(", "function saidText("];
  const found = heads.map(h => app.split(h).length - 1);
  if (found.some(n => n !== 1)) return { found, heads };
  const body = heads.map(h => liftFrom(app, app.indexOf(h))).join(";\n");
  const make = new Function("T", "C", body + ";\nreturn { FIELD_WORD, langName, fieldWord, saidText };");
  return { found, heads, page: make((en, vars) => L.T(en, vars), (n, one, many) => L.C(n, one, many)) };
}

/* ---- the sheets --------------------------------------------------------------------------------
   One per target: a field of FIELDS, in each branch of its phrase (no language, English, Polish,
   another), claimed by two and by three columns, and by four once, so both join frames and a
   long list are met. The columns are sent there by the override table, so which columns claim
   the target is what this file wrote, and the base text columns take the language the target
   does not, so they never join the claim. */
const CRLF = String.fromCharCode(13, 10);
const SENTENCES = ["The parcel left the warehouse this morning", "The refund is on its way to you",
  "Your order will arrive on Tuesday", "We have changed the address on the order"];

function targets() {
  const out = [];
  Object.keys(FIELDS).forEach(f => {
    const langs = FIELDS[f].lang ? [null, "en", "pl", OTHER] : [null];
    langs.forEach(l => [2, 3].forEach(n => out.push({ field: f, lang: l, n })));
  });
  out.push({ field: "body", lang: "pl", n: 4 });
  return out;
}

function sheetFor(t) {
  const base = t.lang === "en" ? "pl" : "en";
  const claim = Array.from({ length: t.n }, (_, i) => "Claim" + (i + 1));
  /* Text with no language named is claimed only where no text column names one: beside one
     that does, src/mapping.mjs gives a bare text column the sheet's main language (board 778),
     so that target's sheet has no base text column at all. */
  const bare = t.field === "body" && !t.lang;
  const heads = (bare ? ["Base title"] : ["Base title", "Base text"]).concat(claim);
  const override = { "Base title": "title." + base };
  if (!bare) override["Base text"] = "body." + base;
  claim.forEach(h => { override[h] = t.field + (t.lang ? "." + t.lang : ""); });
  const rows = SENTENCES.map((s, r) => heads.map((h, i) => s + " " + r + "-" + i).join(","));
  return { heads, claim, override, text: [heads.join(",")].concat(rows).join(CRLF) + CRLF };
}

/* The guessed note (board 779) takes its field from the importer's own report, by the column it
   names: a text column with no language, beside one that names its language, whose text is
   German and so confirms neither. */
const GUESSED = [
  { name: "guessed-en", text: ["Title,Text,body_pl",
    "Order shipped,Das ist ein deutsches Haus ohne Zweifel hier,Paczka wyszła dziś rano.",
    "Refund started,Das zweite Haus ist auch ganz bestimmt deutsch,Zwrot jest już w drodze."].join(CRLF) + CRLF },
  { name: "guessed-pl", text: ["Tytuł,Treść,body_en",
    "Paczka wysłana,Das ist ein deutsches Haus ohne Zweifel hier,The parcel left today.",
    "Zwrot rozpoczęty,Das zweite Haus ist auch ganz bestimmt deutsch,The refund is on its way."].join(CRLF) + CRLF },
];

const TWOCLAIM = /^The columns \{COLUMNS\} went under the same field/;
const GUESS = /^The column \{COLUMN\} went under "\{FIELD\}" because of the headings/;

/* Every frame nested in a said, with the path of variable names that led to it. */
function nested(said, trail, out) {
  Object.keys(said.vars || {}).forEach(k => {
    const v = said.vars[k];
    if (v && typeof v === "object" && typeof v.frame === "string") {
      out.push({ trail: trail.concat(k), frame: v.frame, said: v });
      nested(v, trail.concat(k), out);
    }
  });
  return out;
}

/* ---- the sites -------------------------------------------------------------------------------
   Where a nested frame can be built in the node half that feeds the importer's notes: every
   src/*.mjs file src/import.mjs reaches through its relative imports, and the count of `frame:`
   written as an object key in each, comments out. A change in any count is a phrase added or
   taken away, and the line says what to do about it. */
const SITES = { "src/import.mjs": 13, "src/refusal.mjs": 2, "src/source.mjs": 1, "src/mapping.mjs": 2, "src/lint-said.mjs": 20 };

function sitesNow() {
  const seen = new Set(), counts = {};
  (function walk(rel) {
    if (seen.has(rel)) return;
    seen.add(rel);
    const src = fs.readFileSync(path.join(ROOT, rel), "utf8");
    const code = src.replace(/[/][*][^]*?[*][/]/g, " ").replace(/(^|[^:])[/][/].*$/gm, "$1");
    const n = (code.match(/[{,]\s*frame\s*:/g) || []).length;
    if (n) counts[rel] = n;
    const re = /from\s+"(\.[^"]+\.mjs)"/g;
    let m;
    while ((m = re.exec(code))) walk(path.posix.join(path.posix.dirname(rel), m[1]));
  })("src/import.mjs");
  return { files: seen.size, counts };
}

async function main() {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const L = loadLang();
  const PL = L.__pl();
  const lifted = liftPage(L);
  check(lifted.page && lifted.found.every(n => n === 1),
    "0c the page's " + lifted.heads.map(h => h.replace(/[ =(]+$/, "")).join(", ")
    + " are each found once in ui/app.js and run: " + JSON.stringify(lifted.found));
  if (!lifted.page) throw new Error("the page's own pieces could not be lifted from ui/app.js");
  const P = lifted.page;
  const inPl = (fn) => { L.force("pl"); try { return fn(); } finally { L.set("en"); } };
  const inEn = (fn) => { L.set("en"); return fn(); };

  /* Drive the importer. */
  const met = [];            /* { note, field, lang, claim, said } for each two-claim and guess */
  const allNested = [];      /* every nested frame in every finding of every sheet */
  const runs = [];
  for (const t of targets()) {
    const s = sheetFor(t);
    const r = await importCsv({ dir: SCRATCH, text: s.text, override: s.override });
    runs.push(r);
    const mine = r.report.findings.filter(f => f.said && TWOCLAIM.test(f.said.frame)
      && f.said.vars.FIRST === JSON.stringify(s.claim[0]));
    mine.forEach(f => met.push({ note: "twoclaim", field: t.field, lang: t.lang, claim: s.claim, said: f.said }));
    if (mine.length !== 1) met.push({ note: "twoclaim", field: t.field, lang: t.lang, claim: s.claim, said: null });
  }
  for (const g of GUESSED) {
    const r = await importCsv({ dir: SCRATCH, text: g.text });
    runs.push(r);
    r.report.findings.filter(f => f.said && GUESS.test(f.said.frame)).forEach(f => {
      const col = r.report.columns.find(c => JSON.stringify(c.header) === f.said.vars.COLUMN) || {};
      met.push({ note: "guessed", sheet: g.name, field: col.field, lang: col.lang || null, said: f.said });
    });
  }
  runs.forEach(r => r.report.findings.forEach(f => { if (f.said) nested(f.said, [], allNested); }));

  /* ---- 0. SIGHT ------------------------------------------------------------------------------ */

  const tg = targets();
  const missing = met.filter(m => !m.said);
  const joinsMet = new Set(met.filter(m => m.said && m.said.vars.COLUMNS)
    .map(m => m.said.vars.COLUMNS.frame + "/" + m.claim.length));
  const guessedMet = met.filter(m => m.note === "guessed" && m.said).map(m => m.lang).sort();
  check(missing.length === 0 && tg.length === met.filter(m => m.note === "twoclaim").length
        && joinsMet.size === 3 && JSON.stringify(guessedMet) === JSON.stringify(["en", "pl"]),
    "0a " + tg.length + " sheets over the " + Object.keys(FIELDS).length + " fields of FIELDS"
    + " each raised exactly one two-claim note naming its own columns, the joins of 2, 3 and 4"
    + " columns were met (" + Array.from(joinsMet).join(", ") + "), and the guessed note for en"
    + " and pl (" + guessedMet.join(", ") + ")"
    + (missing.length ? "; no note for " + missing.map(m => m.field + "." + m.lang + "/" + m.claim.length).join(", ") : ""));

  /* Every nested frame met is of a kind this file holds to an oracle, and is a pair. */
  const KIND = (n) => n.trail[0] === "FIELD" ? "field" : n.trail[0] === "COLUMNS" ? "join"
    : n.trail[0] === "LANG" && (n.frame === "Polish" || n.frame === "English") ? "lang"
    : (n.trail[0] === "LINE" && LINT_FRAMES.some(([f]) => f === n.frame)) ? "lint" : null;
  const unkinded = allNested.filter(n => !KIND(n));
  const unpaired = Array.from(new Set(allNested.map(n => n.frame)))
    .filter(f => !Object.prototype.hasOwnProperty.call(PL, f));
  const badLang = allNested.filter(n => KIND(n) === "lang"
    && inPl(() => P.saidText(n.said)) !== (n.frame === "English" ? "Angielski" : "Polski"));
  const kinds = {};
  allNested.forEach(n => { const k = KIND(n) || "none"; kinds[k] = (kinds[k] || 0) + 1; });
  check(allNested.length > 0 && unkinded.length === 0 && unpaired.length === 0 && badLang.length === 0,
    "0b every one of the " + allNested.length + " nested frames in the " + runs.length + " imports' "
    + "findings is a field, a join, a language or a lint line " + JSON.stringify(kinds) + ", and each of the "
    + new Set(allNested.map(n => n.frame)).size + " distinct frames is a pair in ui/lang.js"
    + (unkinded.length ? "; no oracle for " + JSON.stringify(unkinded.slice(0, 3).map(n => n.trail.join(".") + " " + n.frame)) : "")
    + (unpaired.length ? "; no Polish for " + JSON.stringify(unpaired.slice(0, 4)) : "")
    + (badLang.length ? "; wrong PL language for " + JSON.stringify(badLang.slice(0, 3).map(n => n.frame)) : ""));

  const sites = sitesNow();
  const same = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());
  check(same(sites.counts, SITES),
    "0d the nested-frame sites in the " + sites.files + " files src/import.mjs reaches are as this"
    + " file knows them, " + JSON.stringify(sites.counts)
    + (same(sites.counts, SITES) ? "" : ", where it knows "
      + JSON.stringify(SITES) + ": a phrase built inside a note was added or removed; give it a sheet"
      + " that raises it and an oracle above, then set SITES"));

  /* ---- 1. THE FIELD, AS THE SELECT SAYS IT ---------------------------------------------------- */

  const fieldRows = met.filter(m => m.said).map(m => {
    const said = m.said.vars.FIELD;
    return {
      at: m.note + " " + m.field + (m.lang ? "." + m.lang : "") + (m.claim ? "/" + m.claim.length : ""),
      pl: inPl(() => P.saidText(said)), en: inEn(() => P.saidText(said)),
      selPl: inPl(() => P.fieldWord(m.field, m.lang)), selEn: inEn(() => P.fieldWord(m.field, m.lang)),
      want: plField(m.field, m.lang),
    };
  });
  const offSelect = fieldRows.filter(r => r.pl !== r.selPl || r.en !== r.selEn);
  check(fieldRows.length === met.length && offSelect.length === 0,
    "1a in all " + fieldRows.length + " notes the field is said in both languages exactly as the"
    + " page's own select says it (fieldWord, ui/app.js)"
    + (offSelect.length ? "; differs at " + JSON.stringify(offSelect.slice(0, 3).map(r =>
      [r.at, r.pl, r.selPl, r.en, r.selEn])) : ""));

  const wrongWord = fieldRows.filter(r => r.pl !== r.want);
  const extra = Object.keys(PL_WORD).filter(f => !FIELDS[f]);
  const lacking = Object.keys(FIELDS).filter(f => !PL_WORD[f]);
  check(wrongWord.length === 0 && extra.length === 0 && lacking.length === 0,
    "1b and its Polish is this file's word for each of the " + Object.keys(PL_WORD).length
    + " fields, with Angielski, Polski or the code in capitals: "
    + JSON.stringify(Array.from(new Set(fieldRows.map(r => r.pl))).slice(0, 6))
    + (wrongWord.length ? "; wrong at " + JSON.stringify(wrongWord.slice(0, 3).map(r => [r.at, r.pl, r.want])) : "")
    + (lacking.length ? "; FIELDS has " + lacking.join(", ") + " and this file no word for it" : "")
    + (extra.length ? "; this file has a word for " + extra.join(", ") + ", which FIELDS no longer has" : ""));

  /* ---- 2. THE COLUMNS, JOINED ----------------------------------------------------------------- */

  const joinOf = (names, and) => {
    const q = names.map(n => JSON.stringify(n));
    return q.length < 3 ? q.join(" " + and + " ") : q.slice(0, -1).join(", ") + " " + and + " " + q[q.length - 1];
  };
  const joinRows = met.filter(m => m.said && m.claim).map(m => ({
    at: m.field + (m.lang ? "." + m.lang : "") + "/" + m.claim.length,
    pl: inPl(() => P.saidText(m.said.vars.COLUMNS)), en: inEn(() => P.saidText(m.said.vars.COLUMNS)),
    wantPl: joinOf(m.claim, "i"), wantEn: joinOf(m.claim, "and"),
  }));
  const wrongJoin = joinRows.filter(r => r.pl !== r.wantPl || r.en !== r.wantEn);
  check(joinRows.length === tg.length && wrongJoin.length === 0,
    "2a in all " + joinRows.length + " two-claim notes the columns are joined by \" i \" / \" and \","
    + " three or more with commas and the word before the last: "
    + JSON.stringify(Array.from(new Set(joinRows.map(r => r.pl))).slice(0, 3))
    + (wrongJoin.length ? "; wrong at " + JSON.stringify(wrongJoin.slice(0, 3).map(r => [r.at, r.pl, r.wantPl, r.en])) : ""));

  /* ---- 3. THE LINT LINE INSIDE "Etiuda's checks: {LINE}" ------------------------------------------ */

  const braces = (s) => (String(s).match(/\{\w+\}/g) || []).slice().sort().join(" ");
  const badLint = LINT_FRAMES.map(([f]) => f).filter(f => !Object.prototype.hasOwnProperty.call(PL, f)
    || PL[f] === f || braces(PL[f]) !== braces(f));
  const outer = PL["Etiuda's checks: {LINE}"];
  check(LINT_FRAMES.length >= 30 && badLint.length === 0 && outer && outer.indexOf("{LINE}") >= 0,
    "3a each of the " + LINT_FRAMES.length + " lint lines src/lint-said.mjs can nest in a note has"
    + " a Polish value that is not its English and carries exactly its braces, and the note around"
    + " it keeps {LINE}" + (badLint.length ? "; not so for " + JSON.stringify(badLint.slice(0, 3)
      .map(f => [f, PL[f]])) : ""));

  process.stdout.write("#counts checks=" + asserted + " failed=" + failed + " sheets=" + runs.length
    + " notes=" + met.length + " nested=" + allNested.length + " lint=" + LINT_FRAMES.length + "\n");
  process.stdout.write("note-phrases  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main().catch(e => {
  process.stdout.write("  FAIL note-phrases could not run: " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
