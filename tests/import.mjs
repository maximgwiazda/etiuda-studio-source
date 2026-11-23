/* ONE LEG PER RULE THE IMPORTER COULD GET WRONG, and the oracle is never the importer.
 *
 *     node tests/import.mjs [--keep]
 *
 * Every leg over a pile the committed generator makes from a seed, with ONE fault planted at a
 * time, and what a leg asserts against is `manifest.json` - the record of what was planted,
 * written before the importer existed and by a file that does not import it. A leg that asked
 * the importer how many duplicates it found and then checked that number against itself would
 * pass on the day the rule stopped working.
 *
 * ONE FAULT AT A TIME, and that is not tidiness. Turn two on and the counts stop being
 * separable: a near-duplicate twin of a row that was also stripped of its Polish makes nine
 * rows with no Polish where eight were planted, and the leg is then either wrong or carrying an
 * explanation. The full-blast pile with every fault on gets a leg of its own at the end, and
 * that one asserts only that nothing crashed and that every planted fault appears somewhere.
 *
 * THE TWO LEGS THE GENERATOR CANNOT SERVE are the language ones: its vocabulary is an invented
 * syllabary with no Polish letter and no function word of either language in it, so every
 * column of every pile is correctly undetermined. Those legs are driven by a hand-written CSV
 * below, whose sentences are ordinary Polish and English of this seat's own writing.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { importCsv, awaitingOver, awaitingCards, lintBlock } from "../src/import.mjs";
import { detect, score } from "../src/lang.mjs";
import { mapColumn, mapHeaders } from "../src/mapping.mjs";
import { translate } from "../src/placeholders.mjs";
import { dice, findDuplicates, TITLE_NEAR, BODY_NEAR } from "../src/dedupe.mjs";
import { parseCsv, expected } from "./round-trip.mjs";
import { upgradePlan, upgradeLand, openProject, importPlan } from "../src/studio.mjs";
import * as Engine from "../src/engine.mjs";
import { shippedSample, sampleIsShipped } from "./shipped-sample.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "import-legs");

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

/** A pile, made by the committed generator so that nothing here invents test content. */
function pile(name, seed, rows, faults) {
  const out = path.join(SCRATCH, name);
  const args = ["tools/fixtures/generate.mjs", "--seed", String(seed), "--rows", String(rows),
                "--out", out].concat(faults.map(f => "--" + f));
  const r = spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0)
    throw new Error("the generator refused (" + r.status + "): " + (r.stderr || r.stdout));
  return { dir: out, csv: path.join(out, "macros.csv"),
           manifest: JSON.parse(fs.readFileSync(path.join(out, "manifest.json"), "utf8")) };
}

const findingsSaying = (rep, re) => rep.findings.filter(f => re.test(f.what));
/* The CSV line ending, built from its code points rather than typed: this file is LF and the
   pile below must be CRLF, which is what a spreadsheet writes. */
const CRLF = String.fromCharCode(13, 10);

/* WHICH VERDICT THE PINNED ENGINE GIVES A LANGUAGE CARDS LACK: one error per card before engine
   505, one awaiting finding after it (board 510). The legs below read the engine's own return
   shape rather than the pin's hash, so each states the right expectation on either pin. Any
   argument serves the probe: the newer lint carries the key on every return path and the older
   on none. */
const CLASSES_AWAITING = Array.isArray(Engine.lint().lintCatalog(null).awaiting);

async function main(argv) {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });

  /* ---- 1. A HEADER MAPPED ----------------------------------------------------------------- */

  /* The generator's own columns first, because those are the ones the round-trip gate's
     arithmetic assumes, and then a second dialect, because an importer that only reads the
     fixture's spelling has learned the fixture rather than the rule. */
  const clean = pile("clean", 7, 40, []);
  const c1 = await importCsv({ file: clean.csv });
  const verdict = h => (c1.report.columns.find(c => c.header === h) || {});
  check(verdict("id").field === "id" && verdict("category").field === "shelf"
        && verdict("intents").field === "requests" && verdict("role").field === "role",
    "1a the four columns with no language land on id, shelf, requests and role ["
    + ["id", "category", "intents", "role"].map(h => h + "->" + verdict(h).field).join(" ") + "]");
  check(verdict("body_en").field === "body" && verdict("body_en").lang === "en"
        && verdict("body_pl").lang === "pl" && verdict("title_pl").field === "title"
        && verdict("note_en").field === "note" && verdict("note_en").lang === "en",
    "1b the five columns with a language affix land on the field AND the language ["
    + ["body_en", "body_pl", "title_pl", "note_en"].map(h =>
        h + "->" + verdict(h).field + "." + verdict(h).lang).join(" ") + "]");
  check(c1.report.columns.every(c => c.field) && c1.report.columns.length === 9,
    "1c and nothing was left unclaimed, so no column of the pile was silently dropped ("
    + c1.report.columns.length + " columns)");

  const dialect = ["Macro Title", "Answer (pl)", "Tags", "Internal comment", "Macro ID"]
    .map(h => mapColumn(h));
  check(dialect[0].field === "title" && dialect[1].field === "body" && dialect[1].lang === "pl"
        && dialect[2].field === "shelf" && dialect[3].field === "note" && dialect[4].field === "id",
    "1d a second platform's spelling maps without an override ["
    + dialect.map(d => JSON.stringify(d.header) + "->" + d.field + (d.lang ? "." + d.lang : ""))
        .join(" ") + "]");

  const ov = mapHeaders(["Ticket subject", "Answer"], { "Ticket subject": "title.en" });
  check(ov.columns[0].field === "title" && ov.columns[0].lang === "en"
        && ov.columns[0].rule === "override" && !ov.errors.length,
    "1e the override table beats the rules and says so in the verdict ["
    + ov.columns[0].rule + "]");
  const ovBad = mapHeaders(["Answer"], { "Subject": "title.en" });
  check(ovBad.errors.length === 1 && /does not have/.test(ovBad.errors[0]),
    "1f an override naming a column the CSV has not got is an error, not a shrug ["
    + JSON.stringify(ovBad.errors) + "]");
  const ovAmbig = mapHeaders(["Category", "Folder"], {});
  check(ovAmbig.errors.length === 1 && /columns claiming shelf: 2/.test(ovAmbig.errors[0]),
    "1g two columns claiming one identity field is refused rather than resolved by position ["
    + JSON.stringify(ovAmbig.errors) + "]");

  const bareLang = ["tytul", "pl", "en", "Title", " PL ", " EN ", "id"].map(h => mapColumn(h));
  check(bareLang[0].field === "title"
        && bareLang[1].field === "body" && bareLang[1].lang === "pl"
        && bareLang[2].field === "body" && bareLang[2].lang === "en"
        && bareLang[3].field === "title"
        && bareLang[4].field === "body" && bareLang[4].lang === "pl"
        && bareLang[5].field === "body" && bareLang[5].lang === "en"
        && bareLang[6].field === "id",
    "1h a bare language code is read as that language's text and existing aliases stay ["
    + bareLang.map(d => JSON.stringify(d.header) + "->" + (d.field ? d.field + (d.lang ? "." + d.lang : "") : "null"))
        .join(" ") + "]");

  /* A BARE CODE IS A LANGUAGE ONLY WHERE THE ENGINE HAS THAT LANGUAGE (verdict on board 776).
     Every two-letter word names some language somewhere: "No" and "Nr" head a numbering column,
     "To" a recipient, "It" nothing at all. Claimed as reply text, such a column became the
     primary language, because the primary is the first language a body column names, and the
     sheet's real text column was then dropped. Expected from the prose, before running: each
     header unclaimed, and a numbered Polish sheet still imports its Polish text under pl. */
  const notLang = ["No", "Nr", " NO ", "To", "It", "nr"].map(h => mapColumn(h));
  check(notLang.every(d => d.field === null),
    "1i a two-letter heading the engine has no language for stays unclaimed ["
    + notLang.map(d => JSON.stringify(d.header) + "->"
        + (d.field ? d.field + (d.lang ? "." + d.lang : "") : "null")).join(" ") + "]");
  const numbered = await importCsv({ dir: SCRATCH, text: ["Nr,Tytuł,Treść",
    "1,Powitanie,\"Dzień dobry, proszę o cierpliwość, sprawdzam to teraz i wracam z odpowiedzią.\"",
    "2,Wysyłka,\"Dziękuję za wiadomość, zamówienie zostało już wysłane i jest w drodze.\""]
    .join(CRLF) + CRLF });
  const nb = (numbered.catalog.cards || [])[0] || {};
  check(numbered.report.primary === "pl" && /^Dzień dobry/.test((nb.body || {}).pl || "")
        && Object.keys(nb.body || {}).join() === "pl",
    "1j a numbered Polish sheet keeps its text under pl and mints no language from the number"
    + " column [primary " + numbered.report.primary + ", first card's body "
    + JSON.stringify(nb.body || null) + "]");

  /* AND A BARE CODE NEVER TAKES THE TEXT FROM A COLUMN THAT ALREADY HELD IT. A sheet headed
     Tytuł, Treść, EN imported its Polish under pl before board 776, with EN unclaimed; had EN
     claimed English text, it would have named the primary, and Treść, a text column with no
     language named, would have been dropped without a word. Likewise a helpdesk's Comment is its
     text where no other column is, and a bare code must not be the column that stops it. */
  const beside = mapHeaders(["Tytuł", "Treść", "EN"], {}).columns;
  const withComment = mapHeaders(["Title", "Comment", "PL"], {}).columns;
  check(beside[1].field === "body" && !beside[1].lang && beside[2].field === null
        && withComment[1].field === "body" && withComment[2].field === null,
    "1k a bare code beside a text column with no language named stays unclaimed ["
    + beside.concat(withComment).map(d => JSON.stringify(d.header) + "->"
        + (d.field ? d.field + (d.lang ? "." + d.lang : "") : "null")).join(" ") + "]");
  const besideCsv = await importCsv({ dir: SCRATCH, text: ["Tytuł,Treść,EN",
    "Powitanie,\"Dzień dobry, proszę o cierpliwość, sprawdzam to teraz i wracam z odpowiedzią.\","
      + "\"Hello, your parcel is on its way and should reach you by the end of the week.\""]
    .join(CRLF) + CRLF });
  const bb = (besideCsv.catalog.cards || [])[0] || {};
  check(besideCsv.report.primary === "pl" && /^Dzień dobry/.test((bb.body || {}).pl || ""),
    "1l that sheet still imports its Polish text under pl [primary " + besideCsv.report.primary
    + ", first card's body " + JSON.stringify(bb.body || null) + "]");

  /* AND A BARE TEXT COLUMN BESIDE A LANGUAGE-NAMED ONE KEEPS ITS POLISH (board 778).
     The natural reading of "Tytuł,Treść,body_en" is Treść as Polish (the main language) and
     body_en as English. Without whole-sheet language resolution, body_en would make English the
     primary and drop Treść silently without a finding. */
  const bodyLangCols = mapHeaders(["Tytuł", "Treść", "body_en"], {}).columns;
  const bodyLangCsv = await importCsv({ dir: SCRATCH, text: ["Tytuł,Treść,body_en",
    "Powitanie,\"Dzień dobry, proszę o cierpliwość, sprawdzam to teraz i wracam z odpowiedzią.\","
      + "\"Hello, your parcel is on its way and should reach you by the end of the week.\""]
    .join(CRLF) + CRLF });
  const blCard = (bodyLangCsv.catalog.cards || [])[0] || {};
  check(bodyLangCols[1].field === "body" && bodyLangCols[1].lang === "pl"
        && bodyLangCols[2].field === "body" && bodyLangCols[2].lang === "en"
        && bodyLangCsv.report.primary === "pl"
        && /^Dzień dobry/.test((blCard.body || {}).pl || "")
        && /^Hello/.test((blCard.body || {}).en || ""),
    "1m a sheet headed Tytuł,Treść,body_en keeps its Polish text under pl beside body_en [primary "
    + bodyLangCsv.report.primary + ", first card's body " + JSON.stringify(blCard.body || null) + "]");

  /* AND EACH CLAUSE OF THAT RULE, which 1m alone does not see (merge verdict on board 778: with
     the Polish alias keys removed, the sheet-wide reading removed, or the English fallback turned
     to Polish, 1m stayed green, because Treść is Polish by its own letters). Expected from the
     rule's prose, before running: a heading folded to ASCII is still Polish (Tresc), a bare Body
     on a sheet with any Polish heading is Polish, and on a sheet with none it is English, so an
     English Body beside body_pl imports under en with its Polish translation kept. */
  const clauseOf = h => mapHeaders(h, {}).columns.map(d => d.field + (d.lang ? "." + d.lang : ""));
  const asciiPl = clauseOf(["Tytul", "Tresc", "body_en"]);
  const sheetWide = clauseOf(["Tytuł", "Body", "body_en"]);
  const english = clauseOf(["Title", "Body", "body_pl"]);
  const englishCsv = await importCsv({ dir: SCRATCH, text: ["Title,Body,body_pl",
    "Greeting,\"Hello, your parcel is on its way and should reach you by the end of the week.\","
      + "\"Dzień dobry, proszę o cierpliwość, sprawdzam to teraz i wracam z odpowiedzią.\""]
    .join(CRLF) + CRLF });
  const enCard = (englishCsv.catalog.cards || [])[0] || {};
  check(asciiPl[1] === "body.pl" && sheetWide[1] === "body.pl" && english[1] === "body.en"
        && englishCsv.report.primary === "en" && /^Hello/.test((enCard.body || {}).en || "")
        && /^Dzień dobry/.test((enCard.body || {}).pl || ""),
    "1n a bare text column's language: ASCII-folded Polish, a Polish heading elsewhere, and"
    + " English where no heading is Polish [" + [asciiPl, sheetWide, english].map(c => c.join(","))
      .join(" | ") + "; English sheet primary " + englishCsv.report.primary + ", body "
    + JSON.stringify(enCard.body || null) + "]");

  /* GUESSED NOTE AND TWO-CLAIM COLLISION (boards 779, 780).
     When a bare column takes its language from neighbouring headings (alias, main language of the
     sheet) and the text does not confirm it, the wizard shows the guessed note with {COLUMN} and
     {FIELD}; where text confirms it, nothing is shown. Collisions on one field are reported with
     {COLUMNS}, {FIELD} and {FIRST}, with no override table mention. */
  const germanCsv = await importCsv({ dir: SCRATCH, text: ["Title,Text,body_pl",
    "Greeting,\"Guten Tag, wie kann ich Ihnen heute helfen?\",\"Dzień dobry, w czym mogę pomóc?\"",
    "Farewell,\"Auf Wiedersehen, schönen Tag noch.\",\"Do widzenia, miłego dnia.\""]
    .join(CRLF) + CRLF });
  const guessedGerman = (germanCsv.report.findings || []).filter(f =>
    /went under "Text \(English\)" because of the headings beside it/.test(f.what));

  const confirmedCsv = await importCsv({ dir: SCRATCH, text: ["Title,Treść,body_en",
    "Greeting,\"Dzień dobry, proszę o cierpliwość, sprawdzam to teraz i wracam z odpowiedzią.\","
      + "\"Hello, your parcel is on its way and should reach you by the end of the week.\"",
    "Farewell,\"Do widzenia, miłego dnia.\",\"Goodbye, have a good day.\""]
    .join(CRLF) + CRLF });
  const guessedConfirmed = (confirmedCsv.report.findings || []).filter(f =>
    /because of the headings beside it/.test(f.what));

  const twoClaimCsv = await importCsv({ dir: SCRATCH, text: ["Title,Body,body_en",
    "Greeting,\"Hello, how can I help?\",\"Hello, how can I help?\"",
    "Farewell,\"Goodbye, have a good day.\",\"Goodbye, have a good day.\""]
    .join(CRLF) + CRLF });
  const twoClaimFinding = (twoClaimCsv.report.findings || []).filter(f =>
    /The columns "Body" and "body_en" went under the same field, "Text \(English\)"/.test(f.what));
  const hasOverrideTable = (twoClaimCsv.report.findings || []).some(f =>
    /override table/.test(f.what));

  check(guessedGerman.length === 1 && guessedGerman[0].severity === "warning"
        && guessedConfirmed.length === 0
        && twoClaimFinding.length === 1 && twoClaimFinding[0].severity === "error"
        && !hasOverrideTable,
    "1o import notes: German text beside body_pl shows guessed note, confirmed Polish guess shows"
    + " nothing, and Body, body_en shows two-claim error without override table ["
    + (guessedGerman[0] ? guessedGerman[0].what.slice(0, 60) + "..." : "no guessed note") + "]");

  /* ONE NOTE ON ONE COLUMN (the copywriter's BUILDER line on studio.import.guessed, board 779;
     test architect's verdict of 2026-09-25). Where the text of a guessed column reads as the
     OTHER of pl and en, the error "headed {CODE} and reads as {READS}" already speaks for that
     column, and the guessed note stays silent. 1o cannot see this: every sheet in it either
     confirms its guess or reads as nothing. One sheet per direction, so each half of the rule
     fails on its own: a guess of en over Polish text, and a guess of pl over English text. */
  const PLTXT = "\"Dzień dobry, proszę o cierpliwość, sprawdzam to teraz i wracam z odpowiedzią.\"";
  const ENTXT = "\"Hello, your parcel is on its way and should reach you by the end of the week.\"";
  const contra = [];
  for (const [head, col, text] of [["Title,Body,body_pl", "Body", PLTXT],
                                   ["Tytuł,Treść,body_en", "Treść", ENTXT]]) {
    const r = await importCsv({ dir: SCRATCH, text: [head, "Greeting," + text + "," + text,
      "Farewell," + text + "," + text].join(CRLF) + CRLF });
    const fs2 = r.report.findings || [];
    contra.push({ col,
      readsAs: fs2.filter(f => f.said && /is headed \{CODE\} and reads as \{READS\}/.test(f.said.frame)
        && f.said.vars.NAME === JSON.stringify(col)).length,
      guessed: fs2.filter(f => /because of the headings beside it/.test(f.what)).length });
  }
  check(contra.length === 2 && contra.every(c => c.readsAs === 1 && c.guessed === 0),
    "1p a guess the text contradicts gets the reads-as error alone, not the guessed note too, in"
    + " both directions " + JSON.stringify(contra));

  /* A POLISH GUESS IS NAMED AS POLISH. 1o's guess is English, so the pl half of fieldFrame()
     could say "Text, English" of a Polish guess and pass: the Polish desk's own case, Treść
     beside body_en, holding text the detector cannot read. */
  const DETXT = "\"Guten Tag, wie kann ich Ihnen heute helfen?\"";
  const plGuess = await importCsv({ dir: SCRATCH, text: ["Tytuł,Treść,body_en",
    "Powitanie," + DETXT + "," + ENTXT, "Pożegnanie," + DETXT + "," + ENTXT].join(CRLF) + CRLF });
  const plGuessed = (plGuess.report.findings || []).filter(f =>
    /because of the headings beside it/.test(f.what));
  check(plGuessed.length === 1 && plGuessed[0].severity === "warning"
        && plGuessed[0].what.indexOf("The column \"Treść\" went under \"Text (Polish)\"") === 0,
    "1q a Polish guess the text cannot confirm is named as Polish ["
    + plGuessed.map(f => f.what.slice(0, 60)).join(" | ") + "]");

  /* TWO COLUMNS ON A FIELD WITH NO LANGUAGE STILL SAY SO. The raw "columns claim" error is now
     filtered out of the findings and the two-claim note stands in for it, so a lost collision
     for the id, the category or the keywords would import the first column WITHOUT A WORD, the
     one thing src/mapping.mjs says must not happen. 1g reads mapHeaders' own errors and cannot
     see the findings. */
  const idClash = await importCsv({ dir: SCRATCH, text: ["Title,Body,Category,Folder",
    "Greeting," + ENTXT + ",greet,f1", "Farewell,\"Goodbye, have a good day.\",bye,f2"]
    .join(CRLF) + CRLF });
  const idClashSaid = (idClash.report.findings || []).filter(f => f.severity === "error"
    && f.what.indexOf("The columns \"Category\" and \"Folder\" went under the same field,"
      + " \"Categories\", which holds only one; for now, \"Category\" is the one read.") === 0);
  check(idClashSaid.length === 1
        && !(idClash.report.findings || []).some(f => /columns claim/.test(f.what)),
    "1r two columns on a field with no language get the two-claim note, naming the field and"
    + " the column read [" + (idClashSaid[0] ? idClashSaid[0].what.slice(0, 70) : "no note") + "]");

  /* A PERIODIC FILE WITH AN UNCLAIMED POSITION (board 781; test architect's verdict of
     2026-09-25). A cycle with a position nothing claimed must not show the person the raw
     English "override table" note; the translated note says which position was not imported
     and what can be done about it. */
  const tagWords = ["red lamp", "blue door", "green cup", "grey coat", "pale moon", "dark sea"];
  const cycleLines = [];
  for (let i = 0; i < 6; i++) cycleLines.push("Order " + (i + 1),
    "Thank you for writing to us about order number " + (i + 1) + " and we are checking it now and will come back shortly with an answer.",
    "order-" + (i + 1), "tag " + tagWords[i] + " and " + tagWords[(i + 2) % 6]);
  const cycleCsv = await importCsv({ dir: SCRATCH, text: cycleLines.join(CRLF) + CRLF });
  const cycleFindings = cycleCsv.report.findings || [];
  const cycleOverride = cycleFindings.filter(f => /override table/.test(f.what)
    || (f.said && /override table/.test(JSON.stringify(f.said))));
  const unclaimedSaid = cycleFindings.filter(f => f.said
    && /The column \{NAME\} stays out of the import/.test(f.said.frame)
    && f.said.vars.NAME === JSON.stringify("cell 4 of the cycle"));
  check(cycleOverride.length === 0 && unclaimedSaid.length === 1 && unclaimedSaid[0].severity === "warning",
    "1s a periodic file with an unclaimed position shows no override table note, and names the"
    + " unclaimed position in the screen's language ["
    + (unclaimedSaid[0] ? unclaimedSaid[0].what.slice(0, 60) + "..." : "no note") + "]");

  /* TWO COLUMNS WITH THE SAME NAME DO NOT FIRE A TWO-CLAIM NOTE (board 788).
     When two columns share a header name ("Title,Body,Title"), the reader keeps the last
     column. The two-claim note must not fire claiming the first column was read; duplicate
     headers are reported by their own error instead. */
  const dupTitleCsv = await importCsv({ dir: SCRATCH, text: ["Title,Body,Title",
    "First,Body one,Second", "Third,Body two,Fourth"].join(CRLF) + CRLF });
  const dupFindings = dupTitleCsv.report.findings || [];
  const dupTwoClaim = dupFindings.filter(f => /went under the same field/.test(f.what)
    || (f.said && /went under the same field/.test(JSON.stringify(f.said))));
  const dupCards = dupTitleCsv.catalog.cards || [];
  check(dupTwoClaim.length === 0
        && dupCards.length === 2
        && (dupCards[0].title || {}).en === "Second"
        && (dupCards[1].title || {}).en === "Fourth",
    "1t duplicate header columns do not fire two-claim note and the import reads the last column ["
    + (dupTwoClaim.length ? "two-claim fired" : "clean") + ", first title "
    + JSON.stringify((dupCards[0] || {}).title || null) + "]");

  /* THE ENGLISH SAME-NAME ERROR NAMES THE HEADING AND SAYS ONLY THE LAST WAS READ (board 788 / 791).
     Claudette's words: "More than one column is headed {NAME}, and only the last of them was read..." */
  const wantSameNameEn = 'More than one column is headed "Title", and only the last of them was read. Once each has a name of its own in the file, a second import reads them all.';
  const sameNameEnFound = dupFindings.filter(f => f.what === wantSameNameEn);
  check(sameNameEnFound.length === 1 && !dupFindings.some(f => /only the first of them was read/i.test(f.what || "")),
    "1w same-name error in English states only the last of them was read ["
    + (sameNameEnFound.length === 1 ? "exact" : "missing") + "]");

  /* DUPLICATE NON-LANGUAGE HEADERS DO NOT FIRE TWO-CLAIM COLLISION (board 788 / 791).
     When a non-language field like id repeats ("id,title_en,body_en,id"), the non-language loop
     in src/mapping.mjs must not report a collision note or error; duplicate headers are covered by samename. */
  const dupIdCsv = await importCsv({ dir: SCRATCH, text: ["id,title_en,body_en,id",
    "c-1,Title one,Body one,c-2", "c-3,Title two,Body two,c-4"].join(CRLF) + CRLF });
  const dupIdFindings = dupIdCsv.report.findings || [];
  const dupIdTwoClaim = dupIdFindings.filter(f => /went under the same field/.test(f.what)
    || (f.said && /went under the same field/.test(JSON.stringify(f.said))));
  const dupIdCards = dupIdCsv.catalog.cards || [];
  check(dupIdTwoClaim.length === 0
        && dupIdCards.length === 2
        && dupIdCards[0].id === "c-2"
        && dupIdCards[1].id === "c-4",
    "1x duplicate non-language headers do not fire two-claim collision and read the last column ["
    + (dupIdTwoClaim.length ? "two-claim fired" : "clean") + ", first id "
    + JSON.stringify((dupIdCards[0] || {}).id || null) + "]");

  /* AN EMPTY SIBLING (ZERO BYTES OR BLANK LINES) REFUSES NAMING THE FILE (board 791, item 2).
     A companion categories.csv or intents.csv of zero bytes or only blank lines refuses the import
     in Claudette's words, never blaming the main file. A sibling opening with a blank line is read. */
  const sibDir = path.join(SCRATCH, "sibling-blank");
  fs.mkdirSync(sibDir, { recursive: true });
  fs.writeFileSync(path.join(sibDir, "macros.csv"),
    ["Title,Body,Category", "T1,B1,a", "T2,B2,b"].join(CRLF) + CRLF);
  const shelvesWith = async (sibling) => {
    fs.writeFileSync(path.join(sibDir, "categories.csv"), sibling);
    try {
      const r = await importCsv({ file: path.join(sibDir, "macros.csv") });
      return (r.catalog.tags || []).filter(t => t.kind === "shelf").map(t => (t.label || {}).en).join(",");
    } catch (e) { return "refused: " + e.message; }
  };
  const wantEmptySibling = "categories.csv, beside the file being imported, is empty. Once it is filled in or moved to another folder, a second import goes ahead; without it, the file being imported is read on its own.";
  const sibZero = await shelvesWith("");
  const sibBlank = await shelvesWith(CRLF + " " + CRLF + "," + CRLF);
  const sibLead = await shelvesWith(CRLF + "key,label" + CRLF + "a,Alpha" + CRLF);
  check(sibZero === "refused: " + wantEmptySibling && sibBlank === "refused: " + wantEmptySibling && sibLead === "Alpha,b",
    "1u an empty categories.csv (zero bytes or blank lines) refuses naming the file, and one opening with a blank line is read ["
    + (sibZero === "refused: " + wantEmptySibling ? "zero ok" : sibZero) + " | "
    + (sibBlank === "refused: " + wantEmptySibling ? "blank ok" : sibBlank) + " | " + sibLead + "]");

  /* A REFUSED PLAN SHOWS SAMENAME AND WITHDRAWS TABLE.TWICE (board 786 / 791). When a CSV with
     duplicate headers is refused (e.g. no body column), its refused plan carries the samename
     error in Claudette's words, and table.twice is not raised. */
  const refusedPlanCsv = path.join(SCRATCH, "refused-plan.csv");
  fs.writeFileSync(refusedPlanCsv, ["Title,Keywords,Title", "T1,K1,T2", "T3,K2,T4"].join(CRLF) + CRLF, "utf8");
  const refusedP = await importPlan(SCRATCH, refusedPlanCsv, {}, "");
  const refusedNotes = (refusedP && refusedP.notes) || [];
  const hasSameName = refusedNotes.some(n => n.said && n.said.frame && n.said.frame.startsWith("More than one column is headed"));
  const hasTableTwice = refusedNotes.some(n => (n.said && n.said.frame && n.said.frame.startsWith("Some names appear more than once"))
    || (typeof n.what === "string" && n.what.startsWith("Some names appear more than once")));
  check(hasSameName && !hasTableTwice,
    "1v a refused plan shows samename error and table.twice is withdrawn ["
    + (hasSameName ? "samename present" : "samename missing") + ", "
    + (hasTableTwice ? "table.twice present" : "table.twice clean") + "]");

  /* ---- 2. A LANGUAGE DETECTED -------------------------------------------------------------- */

  const PL = "Dzien dobry, prosze o cierpliwosc, sprawdzam to teraz i wracam z odpowiedzia w"
    + " ciagu kilku minut. Dziekuje za zgloszenie i za to, ze czekasz.";
  const PL_ACC = "Dzień dobry, proszę o cierpliwość, sprawdzam to teraz"
    + " i wracam z odpowiedzią.";
  const EN = "Good news about your order. The parcel left our depot this morning and we expect it to"
    + " arrive on Friday, so please keep an eye on your door in the afternoon.";
  check(detect([PL]).verdict === "pl" && detect([EN]).verdict === "en",
    "2a ordinary Polish reads pl and ordinary English reads en [" + detect([PL]).why
    + " | " + detect([EN]).why + "]");
  /* Counted a second way here rather than written down: a hand-count in a test is a number
     that is wrong once and then believed forever.
     The control is the same sentence with its diacritics FOLDED to base letters rather than
     deleted: deleting them also deletes a function word ("prosze" stops being one the moment
     its e-ogonek goes), and the leg would then be measuring two rules at once. Folding leaves
     every word a word and changes nothing but the letter score. */
  const PL_SET = "ąćęłńóśźż";
  const byHand = Array.from(PL_ACC).filter(ch => PL_SET.includes(ch.toLowerCase())).length;
  const folded = PL_ACC.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l").replace(/Ł/g, "L");
  check(byHand > 0 && score(PL_ACC).diacritics === byHand && score(folded).diacritics === 0
        && score(PL_ACC).pl - score(folded).pl === byHand * 3
        && detect([PL_ACC]).verdict === "pl" && detect([folded]).verdict === "pl",
    "2b a Polish letter outside the Latin-1 alphabet is worth three points and nothing else:"
    + " " + byHand + " of them, worth exactly " + (score(PL_ACC).pl - score(folded).pl)
    + " points over the same sentence folded to base letters, which still reads pl on its"
    + " function words alone [" + detect([folded]).why + "]");
  const invented = c1.report.languages.map(l => l.detected);
  check(invented.every(v => v === null),
    "2c the generator's invented syllabary is UNDETERMINED in both columns, which is the"
    + " correct answer and the reason the header still decides [" + JSON.stringify(invented) + "]");
  check(c1.report.languages.map(l => l.code).join(",") === "en,pl"
        && c1.catalog.langs.map(l => l.code).join(",") === "en,pl",
    "2d so the declared languages come from the headers: "
    + c1.catalog.langs.map(l => l.code).join(","));

  /* THE CASE THE HEADER CANNOT ANSWER: the two columns are swapped. The importer keeps the
     header, because overruling a heading on a heuristic loses content, and it says so. */
  const swapped = "id,category,title_en,body_en,body_pl\r\n"
    + "r-one,cat-a,One," + JSON.stringify(PL) + "," + JSON.stringify(EN) + "\r\n"
    + "r-two,cat-a,Two," + JSON.stringify(PL) + "," + JSON.stringify(EN) + "\r\n";
  const sw = await importCsv({ text: swapped, name: "swapped pile", id: "swapped-pile" });
  const swSaid = findingsSaying(sw.report, /is headed en and reads as pl/);
  check(swSaid.length === 1 && sw.report.languages[0].detected === "pl"
        && sw.catalog.cards[0].body.en === PL,
    "2e a body_en column holding Polish is flagged and the header is still obeyed, so nothing"
    + " is moved behind the author's back [" + swSaid.length + " finding(s)]");

  /* ---- 3. A DUPLICATE FLAGGED -------------------------------------------------------------- */

  const dup = pile("near", 11, 40, ["near-duplicates"]);
  const d3 = await importCsv({ file: dup.csv });
  const planted = dup.manifest.planted.nearDuplicates;
  const found = d3.report.duplicates.near.concat(d3.report.duplicates.exact);
  const pairFound = p => found.some(f => (f.of === p.of && f.twin === p.twin)
                                      || (f.of === p.twin && f.twin === p.of));
  check(planted.length > 0 && planted.every(pairFound),
    "3a every planted twin is reported, by the pair the generator named rather than by a count ("
    + planted.length + " planted, " + found.length + " found: "
    + d3.report.duplicates.near.length + " near, " + d3.report.duplicates.exact.length
    + " exact)");
  check(found.length === planted.length,
    "3b and nothing else is: " + found.length + " findings for " + planted.length + " plants");
  check(d3.report.duplicates.exact.length >= 1
        && d3.report.duplicates.exact.every(e => /shelf\+title|body/.test(e.on)),
    "3c a twin whose one-letter title edit was a no-op is reported as EXACT rather than near,"
    + " which is the stronger and truer finding ["
    + JSON.stringify(d3.report.duplicates.exact.map(e => e.on)) + "]");
  check(c1.report.duplicates.near.length === 0 && c1.report.duplicates.exact.length === 0,
    "3d and the pile with no twins in it reports none, so the rule is not simply always on");

  /* THE THRESHOLD IS A CURVE, NOT AN ANSWER (the generator's own words). Driven here so the
     number at the top of src/dedupe.mjs is a measurement rather than a preference. */
  const base = "opening-for-a-delayed-refund-enquiry";
  const curve = [1, 2, 3, 5, 8, 13].map(n => {
    const cut = base.slice(0, base.length - n) + "x".repeat(n);
    return { edits: n, d: Math.round(dice(base, cut) * 1000) / 1000 };
  });
  const firstBelow = curve.find(x => x.d < 0.85);
  check(curve[0].d >= 0.85 && !!firstBelow,
    "3e the curve over " + base.length + " characters, edits then coefficient: "
    + curve.map(x => x.edits + " -> " + x.d.toFixed(3)).join(", ")
    + "; 0.85 first fails at " + firstBelow.edits + " edit(s)");

  /* THE INDEX FINDS WHAT EVERY PAIR TRIED WOULD, AND FAST (sense pass 3, item 4). A seeded pile of
     phrases and copies of them edited by a letter or two sits on both sides of the threshold,
     which the generator's few planted twins cannot; the oracle is every pair scored by dice(),
     the rule as src/dedupe.mjs states it. */
  const F3 = await Engine.format();
  let seed3 = 20260924;
  const rnd3 = () => { seed3 = (seed3 * 1103515245 + 12345) & 0x7fffffff; return seed3 / 0x7fffffff; };
  const WORDS3 = ["refund", "order", "card", "days", "bank", "parcel", "late", "way", "we", "it",
    "the", "is", "on", "a", "x", "ok", "shop", "address", "grelira", "thelork", "ustuma"];
  const phrase3 = (k) => Array.from({ length: k }, () => WORDS3[Math.floor(rnd3() * WORDS3.length)])
    .join(" ");
  const edit3 = (s) => s.split("").map(ch => (rnd3() < 0.03 ? "qz"[Math.floor(rnd3() * 2)] : ch))
    .join("");
  const pile3 = (count) => {
    const out = [];
    for (let i = 0; i < count; i++) {
      const from = out.length && rnd3() < 0.4 ? out[Math.floor(rnd3() * out.length)] : null;
      out.push({ ref: "r" + i, shelf: "s" + Math.floor(rnd3() * 4),
        title: from && rnd3() < 0.7 ? edit3(from.title) : phrase3(1 + Math.floor(rnd3() * 4)),
        body: from && rnd3() < 0.7 ? edit3(from.body) : phrase3(4 + Math.floor(rnd3() * 30)) });
    }
    return out;
  };
  const small3 = pile3(300);
  const got3 = findDuplicates(small3, F3.slug);
  const norm3 = small3.map(x => ({ shelf: x.shelf, title: F3.slug(x.title, 200),
                                   body: F3.slug(x.body, 4000) }));
  const want3 = [];
  for (let i = 0; i < norm3.length; i++) for (let j = i + 1; j < norm3.length; j++) {
    const a = norm3[i], b = norm3[j];
    if ((a.shelf === b.shelf && a.title && b.title && dice(a.title, b.title) >= TITLE_NEAR)
        || (a.body && b.body && dice(a.body, b.body) >= BODY_NEAR)) want3.push(i + "-" + j);
  }
  const at3 = new Map(small3.map((x, i) => [x.ref, i]));
  const pairOf3 = (f) => Math.min(at3.get(f.of), at3.get(f.twin)) + "-"
    + Math.max(at3.get(f.of), at3.get(f.twin));
  const found3 = got3.near.map(pairOf3).concat(got3.exact.map(pairOf3)).sort();
  check(want3.length > 50 && found3.join() === want3.slice().sort().join()
    && got3.near.map(pairOf3).join() === want3.filter(p => got3.near.map(pairOf3).includes(p)).join(),
    "3f the index reports exactly the pairs every pair tried reports, " + want3.length + " of "
    + (300 * 299 / 2) + ", the near ones in the order the pairs are met");
  const big3 = pile3(2000);
  const t3 = Date.now();
  findDuplicates(big3, F3.slug);
  const ms3 = Date.now() - t3;
  check(ms3 < 4000,
    "3g 2,000 rows are checked in " + ms3 + " ms of wall clock, against a bound of 4,000; every"
    + " pair tried took about 20 s at that size");

  /* ---- 4 AND 5. A PLACEHOLDER MAPPED, AND ONE FLAGGED -------------------------------------- */

  const ph = pile("placeholders", 11, 40, ["platform-placeholders"]);
  const p4 = await importCsv({ file: ph.csv });
  const plants = ph.manifest.planted.platformPlaceholders;
  const withMapping = plants.filter(p => translate(p.token).found[0].to);
  const noMapping = plants.filter(p => !translate(p.token).found[0].to);
  const bodyOf = id => {
    const card = p4.catalog.cards.find(c => c.id === id);
    return Object.values((card || {}).body || {}).join("\n");
  };
  check(withMapping.length > 0
        && withMapping.every(p => !bodyOf(p.id).includes(p.token)
                               && bodyOf(p.id).includes(translate(p.token).found[0].to)),
    "4a every planted token that has a mapping is gone from the card and the engine's own token"
    + " is there instead (" + withMapping.length + " row(s), tokens "
    + Array.from(new Set(withMapping.map(p => p.token))).join(" ") + ")");
  const mappedTotal = p4.report.placeholders.mapped.reduce((n, x) => n + x.n, 0);
  check(mappedTotal === withMapping.reduce((n, p) =>
          n + (bodyOf(p.id).split("\n").length > 1 ? 2 : 1), 0),
    "4b and the report's count is the occurrences rather than the rows: " + mappedTotal
    + " over " + withMapping.length + " planted row(s), one per language the row carries");

  check(noMapping.length > 0
        && noMapping.every(p => bodyOf(p.id).includes(p.token)),
    "5a a token with no engine equivalent is LEFT EXACTLY AS IT STANDS ("
    + Array.from(new Set(noMapping.map(p => p.token))).join(" ") + " on " + noMapping.length
    + " row(s)) - inventing a value would put a wrong one in front of a customer");
  const flaggedTokens = p4.report.placeholders.flagged.map(x => x.token).sort();
  check(flaggedTokens.join(",") === Array.from(new Set(noMapping.map(p => p.token))).sort().join(","),
    "5b and each is flagged by name in the report [" + flaggedTokens.join(" ") + "]");
  check(findingsSaying(p4.report, /has no engine equivalent/).length === flaggedTokens.length,
    "5c with one finding per token rather than one per occurrence, which is what an author acts on");
  const unknown = translate("hello {{some.platform.thing}} there");
  check(unknown.found.length === 1 && unknown.found[0].known === false
        && unknown.text.includes("{{some.platform.thing}}"),
    "5d a token no row of the table has ever heard of is still SEEN, so \"flag the rest\" is"
    + " not a promise about tokens somebody already thought of");
  /* The pin warns about {name} inside the {{name}} flagged above, and about a bare {agent} the
     importer does not see; the first is one token said twice and goes, the second stays. */
  const inside = await importCsv({ text: "id,category,title_en,body_en,title_pl,body_pl\r\n"
    + "r-one,cat-a,One,Hello {{name}} and {agent}.,Raz,Witaj {{name}}.\r\n"
    + "r-two,cat-a,Two,Plain words here.,Dwa,Zwykle slowa.\r\n", name: "inside", id: "inside" });
  const braced = inside.report.findings.filter(f => /\{/.test(f.what)).map(f => f.what);
  check(braced.length === 2 && /platform placeholder \{\{name\}\}/.test(braced[0])
        && /^Etiuda's checks: card 1: \{agent\} in the EN body/.test(braced[1]),
    "5e a flagged moustache is said once, not again by the engine's warning about its inside,"
    + " and the engine's own finding a moustache does not hold stays: " + JSON.stringify(braced));

  /* ---- 6. THE REST OF THE FAULTS ----------------------------------------------------------- */

  const dupId = pile("dupid", 11, 40, ["duplicate-id"]);
  const d6 = await importCsv({ file: dupId.csv });
  check(findingsSaying(d6.report, /which is taken; it was given/).length
          === dupId.manifest.planted.duplicateId.length
        && new Set(d6.catalog.cards.map(c => c.id)).size === d6.catalog.cards.length,
    "6a a repeated id is reported AND given an id of its own, so the file still loads ("
    + dupId.manifest.planted.duplicateId.length + " planted, "
    + new Set(d6.catalog.cards.map(c => c.id)).size + " distinct ids over "
    + d6.catalog.cards.length + " cards)");

  const orphan = pile("orphan", 11, 40, ["orphan-category"]);
  const o6 = await importCsv({ file: orphan.csv });
  const orphKey = orphan.manifest.planted.orphanCategory[0].category;
  check(findingsSaying(o6.report, new RegExp(orphKey.replace(/[-]/g, "\\-"))).length === 1,
    "6b a row filing under a category categories.csv does not declare is flagged by key ["
    + orphKey + "]");

  const missing = pile("missing", 11, 40, ["missing-second-language"]);
  const m6 = await importCsv({ file: missing.csv });
  const plantedMissing = missing.manifest.planted.missingSecondLanguage.length;
  /* The sentence is a frame since the sense pass of 2026-09-22 (item 21), its count behind a
     colon so the Polish can say it; the leg asks the same count of the new words. */
  check(findingsSaying(m6.report, new RegExp("^rows with no pl text in .*: " + plantedMissing
    + " of 40;")).length === 1,
    "6c the rows with no second language are counted exactly, " + plantedMissing + " of 40");
  const m6Awaiting = m6.report.findings.filter(f => f.severity === "awaiting");
  check(CLASSES_AWAITING
        ? m6.report.engineLint.errors === 0 && m6Awaiting.length === 1
          && m6Awaiting[0].lang === "pl" && m6Awaiting[0].cards === plantedMissing
        : m6.report.engineLint.errors === plantedMissing && m6Awaiting.length === 0,
    "6d and the PINNED ENGINE's verdict, not Studio's opinion, counts each of them ("
    + m6.report.engineLint.errors + " error(s) and " + m6Awaiting.length + " awaiting at pin "
    + String(m6.report.pin).slice(0, 7) + ")");

  const enc = pile("encoding", 11, 40, ["wrong-encoding"]);
  const encFile = path.join(enc.dir, "macros-cp1252.csv");
  const e6 = await importCsv({ file: encFile, id: "encoding-pile" });
  check(e6.report.encoding === "windows-1252"
        && findingsSaying(e6.report, /not valid UTF-8/).length === 1,
    "6e a file that is valid windows-1252 and invalid UTF-8 is read as windows-1252 and said so,"
    + " rather than filled with replacement characters");
  const letters = enc.manifest.planted.wrongEncoding[0].letters;
  check(e6.catalog.cards.some(c => String(c.title.en).includes(letters)),
    "6f and the letters come back as themselves [" + letters + "]");

  /* 493: A LANGUAGE THE CATALOG NEVER DECLARED IS A STATE; ONE IT DECLARED AND A CARD LACKS IS
     STILL AN ERROR. The pile is the clean one with its Polish columns dropped at the door, which
     is the shape every vendor export arrives in, and the oracle is the pinned engine's own raw
     count rather than anything this suite knows about the rule. */
  const oneLang = await importCsv({ file: clean.csv, override: { title_pl: null, body_pl: null } });
  const awaiting = oneLang.report.findings.filter(f => f.severity === "awaiting");
  check(oneLang.report.errors === 0 && oneLang.report.awaiting === 1
        && awaiting.length === 1 && awaiting[0].lang === "pl"
        /* AMENDED 2026-09-18 BY THE TEST ARCHITECT: the line claims the finding carries the
           ENGINE'S own line for pl, and a non-empty string is not that claim. The sample must
           name the language the finding names, which `pl: 40 card(s) lacking text` does at its
           head and `card 3 ("T"): Polish (pl) is required` does inside, so one clause reads on
           either pin. */
        && new RegExp("(^|[^a-z])" + awaiting[0].lang + "([^a-z]|$)")
             .test(String(awaiting[0].sample || "")),
    "6g a pile carrying one language imports with 0 error(s) and one finding of class"
    + " \"awaiting\" naming pl, carrying the engine's own line for it [errors "
    + oneLang.report.errors + ", awaiting " + JSON.stringify(awaiting.map(f => f.lang)) + "]");
  const oneRaw = oneLang.report.engineLint.raw;
  check((CLASSES_AWAITING
          ? oneRaw.errors === 0 && awaiting[0].engineFindings === 1
          : oneRaw.errors === oneLang.catalog.cards.length
            && awaiting[0].engineFindings === oneLang.catalog.cards.length)
        && awaiting[0].cards === oneLang.catalog.cards.length
        /* AMENDED 2026-09-18 BY THE TEST ARCHITECT, at the pin move to 4c377cb. The identity
           `errors + awaiting === raw.errors` is the classing arithmetic of the DIFFERENTIAL
           path, where every error taken out of the count became one awaiting finding. Where the
           engine is ASKED it holds nothing: nothing is classed, so it reads 0 + 1 === 0 and the
           leg reddened at a build that is correct. What carries a number on that path is the
           engine's own line, whose count this repository parses in src/import.mjs's
           cardsAwaiting - so the leg asserts it whole, with the pile's own card count in it, and
           the cross-repository coupling on that wording is stated rather than implied. */
        && (CLASSES_AWAITING
              ? new RegExp("^pl: " + oneLang.catalog.cards.length + " card\\(s\\) lacking text$")
                  .test(String(awaiting[0].sample || ""))
              : oneLang.report.engineLint.errors + oneLang.report.engineLint.awaiting
                  === oneRaw.errors)
        && oneLang.catalog.langs.length === 1,
    "6h and the pinned engine's verdict is kept whole beside it while the draft declares only"
    + " the language it has [raw " + oneRaw.errors + " error(s) and " + oneRaw.awaiting
    + " awaiting, " + oneLang.report.engineLint.awaiting + " of its error(s) classed, the"
    + " finding counts " + awaiting[0].cards + " card(s) of " + oneLang.catalog.cards.length
    + ", langs " + JSON.stringify(oneLang.catalog.langs.map(l => l.code)) + "]");
  check(CLASSES_AWAITING
        ? m6Awaiting.length === 1 && m6Awaiting[0].cards === plantedMissing
          && plantedMissing < m6.catalog.cards.length
        : m6.report.awaiting === 0 && m6.report.engineLint.errors === plantedMissing,
    "6i and a language the catalog DOES declare and " + plantedMissing + " card(s) of "
    + m6.catalog.cards.length + " lack is counted over those card(s) alone, not over the pile ["
    + m6.report.engineLint.errors + " error(s), " + m6Awaiting.length + " awaiting]");

  /* ---- 7. THE COUNT CONTRACT, AGAINST THE GATE'S OWN ARITHMETIC ---------------------------- */

  /* The round-trip gate's csv and expect stages, reached through its exports rather than
     re-derived: the gate computes the four counts from the CSV by rules of its own, and the
     importer's have to equal them or the publish stage will fail on a file nobody has written
     yet. Catching that here is catching it one node early. */
  for (const [what, p] of [["the clean pile", clean], ["the full-blast pile", null]]) {
    const src = p || pile("all", 13, 40, ["missing-second-language", "platform-placeholders",
      "near-duplicates", "orphan-category", "duplicate-id"]);
    const rows = parseCsv(fs.readFileSync(src.csv, "utf8"));
    const want = expected(rows);
    const got = (await importCsv({ file: src.csv })).report.counts;
    check(["cards", "macros", "intents", "cats"].every(k => got[k] === want[k]),
      "7 " + what + ": the importer's counts equal the gate's own arithmetic over the same CSV ["
      + ["cards", "macros", "intents", "cats"].map(k => k + " " + got[k] + "/" + want[k]).join(" ")
      + "]");
  }

  /* ---- 8. A CATALOG FILE PICKED AT THE IMPORT CATALOG COVER -------------------------------- */

  /* THE ORACLE IS THE PINNED ENGINE READING THE SAME FILE, never Studio reading itself. A desk
     loads a catalog into a runtime shape whose cards are a list, whose categories are keys and
     whose intents are the `en` column, so the three numbers this cover shows are held to the
     three numbers the desk that reads the same file would show.

     BOARD ITEM 501 IS WHY THERE IS A LEG HERE AT ALL. The cover handed every picked file to the
     format 1 reader, so a format 2 document - which is what every desk writes - reported its
     cards and then 0 categories, 0 intents and three findings per card: it names a category the
     file does not declare, it has no title in the primary language, it has no body in the
     primary language. All three were the converter faithfully reporting that the two shapes
     differ, and a person reading them would conclude their own catalog was broken.

     THE DOCUMENTS ARE THE DESK'S OWN AND NONE IS COPIED INTO THIS TREE. ETIUDA_FIXTURES names
     the folder the engine's harness keeps its catalogs in, read here the same way; where it is
     unset the leg makes a format 2 document of its own out of the clean pile through the
     importer above, so the section runs on a desk that has no fixtures folder. Only the public
     document is ever landed: the deployment catalog is read, counted and never written
     anywhere. */

  const FIXTURES = process.env.ETIUDA_FIXTURES
    ? path.resolve(process.env.ETIUDA_FIXTURES) : null;
  const fixtureAt = (name) => {
    const at = FIXTURES ? path.join(FIXTURES, name) : null;
    return at && fs.existsSync(at) ? at : null;
  };
  /* The shipped sample is the engine's own at Studio's pin (2026-09-25, tests/shipped-sample.mjs),
     never the fixtures folder's copy, which went stale; only the deployment catalog comes from
     ETIUDA_FIXTURES, being somebody's content. */
  const sampleEc = shippedSample().at, deskEc = fixtureAt("etiuda-catalog.ec");
  const shipped = sampleIsShipped(sampleEc);
  check(shipped.ok, "0s the sample this section reads is the engine's shell/sample-catalog.ec at the"
    + " pin " + shipped.pin + ": blob " + shipped.got.slice(0, 12) + " against " + shipped.want.slice(0, 12));
  const docs = [];
  if (sampleEc) docs.push({ what: "the shipped sample", at: sampleEc, land: true });
  if (deskEc) docs.push({ what: "a desk's deployment catalog", at: deskEc, land: false });
  if (!docs.length) {
    const made = await importCsv({ file: clean.csv, id: "made-here" });
    const at = path.join(SCRATCH, "made-here.ec");
    fs.writeFileSync(at, JSON.stringify(made.catalog, null, 1) + "\n", "utf8");
    docs.push({ what: "a document made here from the clean pile, ETIUDA_FIXTURES being unset",
                at, land: true });
  }

  /* The sentences the three false classes were reported in, matched as text because that is what
     a person read on the cover. A leg asserting only that the counts are right would have passed
     the day the counts were right and the findings still wrong. */
  const FALSE_CLASSES = [/names a category the file does not declare/,
                         /has no title in the primary language/,
                         /has no body in the primary language/];
  const { loadCatalog } = Engine.lint();
  const coverRoot = path.join(SCRATCH, "cover-projects");
  for (const d of docs) {
    const desk = loadCatalog(d.at);
    const want = { cards: desk.cards.length, cats: Object.keys(desk.categories || {}).length,
                   intents: ((desk.intents || {}).en || []).length };
    const plan = await upgradePlan(coverRoot, d.at);
    const got = plan.counts;
    check(got.cards === want.cards && got.cats === want.cats && got.intents === want.intents,
      "8 " + d.what + ": the cover counts what a desk loading the same file counts [cards "
      + got.cards + "/" + want.cards + ", categories " + got.cats + "/" + want.cats
      + ", intents " + got.intents + "/" + want.intents + "]");
    const said = plan.problems.concat(plan.differs);
    const false0 = said.filter(x => FALSE_CLASSES.some(re => re.test(x)));
    check(said.length === 0 && false0.length === 0,
      "8 " + d.what + ": and nothing is wrong with it - " + said.length + " problem(s), "
      + false0.length + " of the three classes 501 reported over " + got.cards + " card(s)"
      + (said.length ? " " + JSON.stringify(said.slice(0, 2)) : ""));
    if (!d.land) continue;
    /* The refusal is caught rather than thrown: a landing that refuses is this leg's own red
       line, and letting it end the run would take the documents after it down with it. */
    let opened = null, read = null, err = null;
    try { opened = await upgradeLand(coverRoot, d.at); }
    catch (e) { err = e; }
    if (opened) {
      try { read = loadCatalog(path.join(opened.dir, opened.project.draft)); }
      catch (e) { err = e; }
    }
    check(!err && !!read && read.cards.length === want.cards && opened.lint.errors === 0,
      "8 " + d.what + ": landing writes a draft the pinned engine reads back with the same "
      + want.cards + " card(s) and " + (opened ? opened.lint.errors : "no") + " lint error(s)"
      + (err ? ": " + String(err.message).slice(0, 120) : ""));
  }


  /* ---- 9. THE ENGINE'S VERDICT IN THE REPORT, ON EITHER ENGINE ------------------------------
   *
   * CLEMENT'S MEASUREMENT OF 2026-09-18 (boards 518 and 530): report.engineLint.awaiting was
   * `classed.size`, `classed` holds engine ERROR lines, and it is filled on the differential
   * path alone - so at an engine that emits the awaiting class it was empty and the field read
   * 0 while forty cards waited. The count is now taken from the findings themselves, each of
   * which carries how many engine findings it took.
   *
   * THE STUB IS THE POINT. A pin swap would measure one engine per run and would take a lab;
   * a lint of four lines measures both in one, and what it stands in for is written beside it.
   * Every number here counts ENGINE FINDINGS and not cards - errors, warnings and awaiting are
   * lines the engine wrote - which is the only reading under which the three can be added up;
   * how many cards wait is on the finding, as `cards`.
   */
  const stubCatalog = (langs) => ({
    format: 2, kind: "etiuda-catalog", id: "stub", name: "stub", rev: 1,
    langs: langs.map(c => ({ code: c, label: c.toUpperCase() })),
    commentLang: langs[0], tags: [],
    cards: Array.from({ length: 40 }, (_, i) => ({ id: "c-" + i, shelf: null,
      title: { en: "t" + i }, body: { en: "b" + i } })),
  });
  const HASH = (c) => "stub:" + JSON.stringify(c).length;

  /* An engine with a class of its own: it says nothing about a catalog that declares one
     language and answers the probe - which declares the second and fills nothing - with one
     awaiting line naming the language and the count. */
  const classLint = (c) => {
    const declared = (c.langs || []).map(l => l.code);
    return { errors: [], warnings: [],
             awaiting: declared.indexOf("pl") < 0 ? []
               : ["pl: " + (c.cards || []).filter(x => !(x.body || {}).pl).length
                  + " card(s) lacking text"] };
  };
  /* An older engine: one error per card, whatever the catalog's own langs say, and no class. */
  const olderLint = (c) => ({
    errors: (c.cards || []).filter(x => !(x.body || {}).pl)
      .map(x => "card " + x.id + ": Polish (pl) is required"),
    warnings: [],
  });

  const stubOneLang = stubCatalog(["en"]);
  const classSaw = awaitingOver(stubOneLang, classLint(stubOneLang), classLint, ["en", "pl"], HASH);
  const olderSaw = awaitingOver(stubOneLang, olderLint(stubOneLang), olderLint, ["en", "pl"], HASH);
  const classBlock = lintBlock(classLint(stubOneLang), classSaw);
  const olderBlock = lintBlock(olderLint(stubOneLang), olderSaw);
  check(classBlock.awaiting === 1 && classSaw.rows.length === 1
        && classSaw.rows[0].lang === "pl" && classSaw.rows[0].cards === 40,
    "9a at an engine that emits the awaiting class the report counts the finding the state took"
    + " rather than nought: engineLint.awaiting " + classBlock.awaiting + " over "
    + classSaw.rows.length + " finding(s) naming " + JSON.stringify(classSaw.rows[0].lang)
    + " on " + classSaw.rows[0].cards + " card(s)");
  check(olderBlock.awaiting === 40 && olderBlock.errors === 0 && olderBlock.raw.errors === 40,
    "9b and at an older engine it counts the forty errors the state accounts for, which leave"
    + " the error count: " + JSON.stringify(olderBlock));
  check(classBlock.errors === 0 && classBlock.raw.errors === 0
        && classBlock.raw.awaiting === 0,
    "9c with `raw` still the engine's untouched output on both - at the class engine a draft"
    + " declaring one language gets nothing from it, because the class covers only the languages"
    + " a catalog declares, and that nought is a fact about the engine: "
    + JSON.stringify(classBlock.raw));
  check(classSaw.rows[0].cards === olderSaw.rows[0].cards
        && classSaw.rows[0].lang === olderSaw.rows[0].lang,
    "9d and the finding a reader sees is the same on both engines, " + classSaw.rows[0].lang
    + " on " + classSaw.rows[0].cards + " card(s), which is what the one classifier is for");


  /* ---- 10. WHICH CARDS ARE AWAITING, AND WHO SAYS SO ----------------------------------------
   *
   * BOARD 548, Claudia's finding of 2026-09-18: `publishPlan` asked the classifier and
   * `openProject` did not, so the cover could say eight cards were waiting while the cards
   * table, the card editor and the lint list had no way to know it and the rail counted two.
   * The state is in the project's own read now, and with it the ids of the cards it covers.
   *
   * THE ORACLE FOR THE IDS IS THE GENERATOR'S MANIFEST, not the importer's opinion and not the
   * engine's: the pile is made with --missing-second-language, which empties the Polish of
   * every fifth row and writes those row ids down. So the leg compares the cards the read
   * marks against the cards the fixture plantedPl, which is the comparison that could fail.
   */
  const awaitPile = pile("awaiting-pile", 23, 24, ["missing-second-language"]);
  const plantedPl = awaitPile.manifest.planted.missingSecondLanguage.slice().sort();
  const awaitMade = await importCsv({ file: awaitPile.csv, id: "awaiting-probe",
                                      name: "Awaiting probe" });
  const awaitDir = path.join(SCRATCH, "awaiting-project");
  fs.mkdirSync(awaitDir, { recursive: true });
  fs.writeFileSync(path.join(awaitDir, "catalog.draft.json"),
    JSON.stringify(awaitMade.catalog, null, 1) + "\n");
  const opened = await openProject(awaitDir);
  const openAwait = opened.awaiting || [];
  const openIds = (openAwait[0] && openAwait[0].ids || []).slice().sort();
  /* Either pin, stated for each: an engine with a class of its own reports the state and names
     the cards through it; an older one calls each such card an error, which the lint list has
     always shown per card, and no state is reported at all. */
  check(CLASSES_AWAITING
    ? (openAwait.length === 1 && openAwait[0].lang === "pl"
       && openAwait[0].cards === plantedPl.length
       && openIds.join("|") === plantedPl.join("|"))
    : (openAwait.length === 0 && opened.lint.errors === plantedPl.length),
    "10a the project's own read carries the awaiting state at "
    + (CLASSES_AWAITING ? "a pin with the class" : "a pin without one") + ": "
    + JSON.stringify(openAwait.map(a => a.lang + " over " + a.cards + " card(s)"))
    + ", ids " + JSON.stringify(openIds) + " against the "
    + plantedPl.length + " the generator planted " + JSON.stringify(plantedPl));
  check(opened.lint.errors + opened.lint.warnings + opened.lint.awaiting
        === opened.lint.rows.length
        && opened.lint.awaiting === openAwait.length,
    "10b and the rail's count is the findings a person can see: " + opened.lint.errors
    + " error(s) + " + opened.lint.warnings + " warning(s) + " + opened.lint.awaiting
    + " awaiting = " + opened.lint.rows.length + " row(s) in the list");

  /* THE THREE ANSWERS THE ATTRIBUTION CAN GIVE, DRIVEN AT A STUB for section 9's reason: a pin
     swap would measure one engine per run and take a lab. The stubs are section 9's own. */
  const classIds = awaitingCards(stubOneLang, classSaw.rows, classLint);
  check((classIds.pl || []).length === 40
        && (classIds.pl || []).join("|") === stubOneLang.cards.map(c => c.id).join("|"),
    "10c at an engine that emits the class the forty cards are named one at a time and the set"
    + " is the catalog's own: " + (classIds.pl || []).length + " id(s), first "
    + JSON.stringify((classIds.pl || [])[0]));

  /* An engine off by one about its own catalog: it owns up to forty cards one at a time and
     says forty-one over the whole. The attribution is the engine's number or it is nothing. */
  const missLint = (c) => {
    const base = classLint(c);
    if ((c.cards || []).length < 2 || !base.awaiting.length) return base;
    return { errors: base.errors, warnings: base.warnings,
             awaiting: ["pl: " + ((c.cards || []).filter(x => !(x.body || {}).pl).length + 1)
                        + " card(s) lacking text"] };
  };
  const missSaw = awaitingOver(stubOneLang, missLint(stubOneLang), missLint, ["en", "pl"], HASH);
  const missIds = awaitingCards(stubOneLang, missSaw.rows, missLint);
  check(missSaw.rows[0].cards === 41 && !missIds.pl,
    "10d and where the per-card answers do not reproduce that number the whole attribution is"
    + " dropped rather than half-shown: the finding still says " + missSaw.rows[0].cards
    + " card(s) and names " + JSON.stringify(Object.keys(missIds)));

  const olderIds = awaitingCards(stubOneLang, olderSaw.rows, olderLint);
  check(!olderIds.pl && olderSaw.rows[0].cards === 40,
    "10e and an engine with no class of its own is not asked which cards at all, because there"
    + " every one of them is already an error naming it: " + olderSaw.rows[0].cards
    + " card(s) awaiting, " + JSON.stringify(Object.keys(olderIds)) + " named");

  /* ---- 11. THE KEYWORD BAG, AND WHAT IT BUYS ------------------------------------------------
   *
   * Board 597 and 585. Every card below is invented at this keyboard, as section 2's Polish is
   * and for the same reason: the generator's syllabary has no word that could be in a card's
   * text AND in its bag, which is the one relation these legs are about.
   *
   * THE CONTROL IS THE EMPTY LIST. A leg that only checked that a bag word was named would pass
   * on an importer that named every bag word, which is the report nobody can act on - it is the
   * count that says nothing, and the whole item exists because that count says nothing. So the
   * pile carries one card whose every keyword is already in its own text (r-echo), and the leg
   * that matters is the one asserting NOTHING is named for it.
   */

  const KW_CSV = "id,category,title_en,body_en,keywords" + CRLF
    + '"k-echo","glass","Echo stamp","The echo stamp is issued at the counter when a ticket is'
    + ' torn.","echo stamp counter ticket"' + CRLF
    + '"k-quill","glass","Quill badge","The quill badge is handed over at the gate.","quill'
    + ' badge lantern ferry"' + CRLF
    + '"k-sail","glass","Sail hook","The sail hook is stored beside the \u017cagiel locker.",'
    + '"zagiel hook"' + CRLF
    + '"k-pane","glass","Pane list","The pane list names what is behind each opening.","glass'
    + ' pane"' + CRLF;
  const kw = await importCsv({ text: KW_CSV, name: "bag pile", id: "bag-pile" });
  const kwBy = (id) => (kw.report.keywords.cards.find(r => r.card === id) || {});

  check(kw.report.columns.find(c => c.header === "keywords").field === "keys"
        && kw.catalog.cards[0].k === "echo stamp counter ticket"
        && kw.catalog.cards.filter(c => c.k).length === 4,
    "11a a keywords column lands on the bag and the bag reaches the card as the ONE string it"
    + " was written as, unsplit and unjoined [" + JSON.stringify(kw.catalog.cards[0].k) + "]");

  check(kwBy("k-echo").words === 4 && kwBy("k-echo").only.length === 0,
    "11b THE CONTROL: a card whose every keyword is already in its own text has an EMPTY"
    + " bag-only list, so the report is measuring what a bag buys rather than that it is there ("
    + kwBy("k-echo").words + " word(s), " + JSON.stringify(kwBy("k-echo").only) + " named)");

  check(kwBy("k-quill").only.join(" ") === "lantern ferry",
    "11c and the two words of the next card that its text does not carry are named, in the bag's"
    + " own order [" + JSON.stringify(kwBy("k-quill").only) + "]");

  check(kwBy("k-sail").only.length === 0,
    "11d a keyword differing from the text only by a diacritic is NOT bag-only, so the rule is"
    + " the pinned engine's own splitWords and not a string compare of Studio's ("
    + JSON.stringify(kwBy("k-sail").only) + " named for a bag of "
    + JSON.stringify(kw.catalog.cards[2].k) + ")");

  check(kwBy("k-pane").only.length === 0,
    "11e and a keyword the card's CATEGORY carries is not bag-only either, because the engine"
    + " indexes the category label as the card's own meta ("
    + JSON.stringify(kwBy("k-pane").only) + " named for " + JSON.stringify(kw.catalog.cards[3].k)
    + " under the shelf " + JSON.stringify(kw.catalog.tags[0].label.en) + ")");

  const kwSaid = findingsSaying(kw.report, /cards with search keywords:/);
  check(kw.report.keywords.carrying === 4 && kw.report.keywords.words === 12
        && kw.report.keywords.only === 2 && kw.report.keywords.repeatOnly === 3
        && kwSaid.length === 1,
    "11f the totals are over the cards that carry a bag and the words are counted once per card,"
    + " and the screen gets ONE finding rather than one per card: " + kw.report.keywords.carrying
    + " card(s), " + kw.report.keywords.words + " word(s), " + kw.report.keywords.only
    + " bag-only, " + kw.report.keywords.repeatOnly + " bag(s) that repeat the card entirely, "
    + kwSaid.length + " finding(s)");

  check(c1.report.keywords.carrying === 0 && c1.report.keywords.column === null
        && findingsSaying(c1.report, /cards with search keywords:/).length === 0
        && c1.catalog.cards.every(c => c.k === undefined),
    "11g and a pile with no keyword column mints no bag and says nothing about one, so the rule"
    + " is not simply always on (" + JSON.stringify(c1.report.keywords.column) + " column, "
    + c1.report.keywords.carrying + " card(s) carrying)");

  const kwAmbig = mapHeaders(["Keywords", "Synonyms"], {});
  check(kwAmbig.errors.length === 1 && /columns claiming keys: 2/.test(kwAmbig.errors[0]),
    "11h two keyword columns are an ambiguity the override table has to settle, not two"
    + " languages' bags merged behind the author [" + JSON.stringify(kwAmbig.errors) + "]");

  if (!argv.includes("--keep")) dropScratch(SCRATCH, "import");
  process.stdout.write("import-legs: " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]))
  main(process.argv.slice(2)).catch(e => {
    process.stderr.write("import-legs: REFUSED " + (e && e.stack ? e.stack : e) + "\n");
    process.exit(2);
  });
