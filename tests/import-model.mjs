/* THE TEXT IMPORTER'S PIPELINE AGAINST THE ORACLE, ON A STUB. Board 602, 604.
 *
 *     node tests/import-model.mjs [--keep]
 *
 * NO MODEL, NO KEY, NO ACCOUNT AND NO NETWORK ANYWHERE IN THIS RUN. importText takes a function
 * that turns a prompt and a body into text; here that function is `stubAsk`, which runs a local
 * program, tests/stub-model.mjs, with the request on standard input, and the canned answer is
 * built here out of the flatten key the oracle already holds (603, tests/import-oracle.mjs).
 * Studio has no module that reaches a model since Maxim's ruling of 2026-09-28 13:19
 * (tests/no-model.mjs holds that); this file supplies the answers itself. `globalThis.fetch` is
 * still replaced with a throw for the whole of this file: the run passes with fetch poisoned, so
 * nothing in the importer called it.
 *
 * WHAT IS BEING PROVED, and each claim has the case that fails without it:
 *
 *   1  the stub       the program the importer is asked through returns its canned answer on
 *                     standard output, which is what every later section is measured on.
 *   2  the check      the deterministic guard of 604, alone, with no model in it: verbatim
 *                     passes unmarked, a span with no source is refused as invented, a rewording
 *                     is marked and reversible byte for byte, a rewording of something the file
 *                     does not contain is an invention wearing a `was`.
 *   3  the pipeline   the whole path on the stub: a planted invention is refused BEFORE the
 *                     proposal is written, the nonce appears in no byte of the inbox, and the
 *                     proposal the review queue reads offers one row per card.
 *   4  the score      tools/import-bench/score.mjs's own counts over what this importer actually wrote,
 *                     against the same key the oracle scores the present CSV importer with,
 *                     and the baseline re-measured in the same run rather than quoted from a
 *                     report: 0 proposed, 29 missed.
 *   4b the anchors    the same cards given as {from, to, chars} rather than as the words score
 *                     identically and resolve to the same bytes. A tail quoted inside its own
 *                     reply resolves to the right end when `chars` is given. An anchor shorter
 *                     than 40 characters, or one with no length, is refused.
 *   5  the marker     a reworded run scores an invention where the verbatim run scores none,
 *                     which is the control that a mark is a real change to the words and not a
 *                     decoration; and one press puts the file's own bytes back.
 *   7  the joining    an answer with every reply cut in two comes back joined and scoring exactly
 *                     as the unsplit one, and an answer that is already right comes back
 *                     untouched, under one rule in one run; a run of two pieces from opposite
 *                     ends of the file is refused as the splice it is.
 *   8  the filing     the categories and intents the project already has reach the prompt whole,
 *                     a category proposed for one card is reported rather than created, and an
 *                     intent one card answers is kept - which is the half of that rule the
 *                     oracle refutes, measured in the leg rather than argued.
 *
 * THE FIXTURE IS GENERATED, NEVER COMMITTED (Studio's rule): the canned answer is written here
 * from the invented sample catalog's own flattening, so it is deterministic and it carries no
 * customer content of any kind.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { flattenCatalog, writeFlatten } from "../tools/import-bench/flatten.mjs";
import { scoreCatalog, printScore } from "../tools/import-bench/score.mjs";
import { readCatalogDocument } from "../src/diff.mjs";
import { reviewProposal, readLog, REVIEW_LOG } from "../src/review.mjs";
import { PROJECT_FILE, DRAFT_FILE } from "../src/publish.mjs";
import { importCsv } from "../src/import.mjs";
import { shippedSample, sampleIsShipped } from "./shipped-sample.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { importText, writeTextImport, checkSpans, markSegments, revertMark, revertBody,
         holdBack, promptFor, joinCandidates, joinQuestion, knownFiling, knownBlock }
  from "../src/import-text.mjs";

/* THE POISON, BEFORE ANYTHING ELSE IS IMPORTED OR CALLED. Anything reaching the network in this
   process from here on fails loudly rather than quietly succeeding on somebody's connection. */
const REAL_FETCH = globalThis.fetch;
globalThis.fetch = () => { throw new Error("tests/import-model.mjs: no network in this gate"); };

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "import-model");
const STUB = path.join(HERE, "stub-model.mjs");
const NONCE = "hqvwrz-not-in-any-source-602";

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

/* THE REQUEST AS ONE PIECE OF TEXT, as the importer's asker is handed it: the prompt without its
   trailing white space, a blank line, then the body. */
function requestText(prompt, body) {
  return String(prompt == null ? "" : prompt).replace(/\s+$/, "")
    + "\n\n" + String(body == null ? "" : body);
}

/** The asker importText takes: ({prompt, body}) -> Promise<{ok:true,text} | {ok:false,refusal}>.
 *  It runs the stub program with the request on standard input and answers with its standard
 *  output; a non-zero exit or no output is a refusal. The stub reads the canned answer from
 *  `answerAt`, which a leg rewrites between runs. */
let answerAt = null;
function stubAsk() {
  const ask = (req) => {
    const r = req || {};
    const run = spawnSync(process.execPath, [STUB, answerAt],
      { input: requestText(r.prompt, r.body), encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
    const text = String(run.stdout || "").trim();
    if (run.status !== 0 || !text)
      return Promise.resolve({ ok: false, refusal: "the stub exited " + run.status
        + " and wrote " + (text ? "text" : "nothing") });
    return Promise.resolve({ ok: true, text, provider: "stub", model: "stub" });
  };
  ask.provider = "stub";
  ask.model = "stub";
  ask.ready = true;
  return ask;
}

/* THE SAMPLE IS THE ONE THE ENGINE SHIPS AT STUDIO'S PIN (2026-09-25), read by
   tests/shipped-sample.mjs, never the fixtures folder's copy, which went stale. No sample is a
   failure: a leg about the shipped sample that reads nothing has not been run. */
function samplePath() {
  try { return shippedSample().at; }
  catch (e) { process.stderr.write("  FAIL the shipped sample could not be read: " + e.message + "\n"); return null; }
}

const sha = s => crypto.createHash("sha256").update(s, "utf8").digest("hex");

/** Every byte under a folder, joined, so "the nonce is nowhere in it" is a claim about bytes. */
function allBytes(dir) {
  let out = "";
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const at = path.join(d, e.name);
      if (e.isDirectory()) walk(at); else out += fs.readFileSync(at, "utf8");
    }
  };
  if (fs.existsSync(dir)) walk(dir);
  return out;
}

/* ---- the canned answer, out of the flatten key ------------------------------------------------
 *
 * A PERFECT IMPORTER, WRITTEN AS JSON. One card per card the key knows, one body per stretch,
 * each body one span holding the stretch exactly as the source file has it. This is what a model
 * that obeyed the prompt would answer, and it is the upper bound the real thing is measured
 * against: whatever a model does, the pipeline between it and the queue behaves like this.
 */
function cannedAnswer(key, source, o) {
  const opts = o || {};
  const byCard = new Map();
  (key.stretches || []).forEach(s => {
    if (!byCard.has(s.card)) byCard.set(s.card, []);
    byCard.get(s.card).push(s);
  });
  const cards = [];
  let n = 0;
  byCard.forEach((stretches, id) => {
    n++;
    const first = stretches[0];
    const title = {};
    stretches.forEach(s => { title[s.lang] = "Reply " + n; });
    const label = {};
    Object.keys(first.categoryLabels || {}).forEach(k => { label[k] = first.categoryLabels[k]; });
    const card = {
      title, category: String(first.category || "imported"),
      intents: (first.intentClauses || []).slice(),
      bodies: stretches.map(s => ({ lang: s.lang,
        spans: [{ text: source.slice(s.start, s.end) }] })),
    };
    if (Object.keys(label).length) card.categoryLabel = label;
    cards.push(card);
  });
  /* THE SAME ANSWER POINTING AT THE REPLIES RATHER THAN COPYING THEM, which is what a model
     asked the real prompt sends: the first and last 40 characters and a length. */
  if (opts.anchor) cards.forEach(c => c.bodies.forEach(b => {
    const t = b.spans[0].text;
    if (t.length < 80) return;
    b.spans = [{ from: t.slice(0, 40), to: t.slice(-40), chars: t.length }];
  }));
  /* THE PLANTED INVENTION, which is the tooth of section 3: a card whose body is in no file
     anywhere. Without it every count below would be the same whether the check ran or not. */
  if (opts.invent) cards.push({
    title: { en: "An invented card" }, category: "invented", intents: [],
    bodies: [{ lang: "en", spans: [{ text: NONCE + " this sentence was never in the file" }] }],
  });
  /* THE REWORDING, which is section 5's: the first card's first body is replaced word for word
     with something else, carrying the exact original it replaced. */
  if (opts.reword && cards.length) {
    const b = cards[0].bodies[0];
    const was = b.spans[0].text;
    b.spans = [{ text: "A shorter way of saying it.", was }];
  }
  return JSON.stringify({ cards }, null, 1) + "\n";
}

async function plantProject(dir, csv, id) {
  fs.mkdirSync(dir, { recursive: true });
  const made = await importCsv({ file: csv, id, name: id });
  fs.writeFileSync(path.join(dir, DRAFT_FILE), JSON.stringify(made.catalog, null, 1) + "\n");
  fs.writeFileSync(path.join(dir, PROJECT_FILE), JSON.stringify(
    { id: made.catalog.id, rev: 0, edition: "" }, null, 1) + "\n");
  return made.catalog;
}

async function main(argv) {
  const sampleAt = samplePath();
  if (!sampleAt) {
    process.stdout.write("import-model: 0 assertion(s), NO VERDICT, the shipped sample was not read\n");
    process.exit(78);
  }
  const shipped = sampleIsShipped(sampleAt);
  check(shipped.ok, "0s the sample these legs read is the engine's shell/sample-catalog.ec at the"
    + " pin " + shipped.pin + ": blob " + shipped.got.slice(0, 12) + " against " + shipped.want.slice(0, 12));
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });

  /* ---- 1. THE STUB -------------------------------------------------------------------------- */

  process.stdout.write("1  the stub\n");

  answerAt = path.join(SCRATCH, "answer.json");
  fs.writeFileSync(answerAt, "the canned answer\n", "utf8");
  const got = await stubAsk()({ prompt: "PROMPT", body: "BODY" });
  check(got.ok && got.text === "the canned answer",
    "1a  the stub's standard output is the answer the importer is handed");

  /* ---- 2. THE CHECK, WITH NO MODEL IN IT ------------------------------------------------- */

  process.stdout.write("2  the check of 604, alone\n");

  const SRC = "Hello there. We refund within fourteen days.\n\nCzesc. Zwracamy w ciagu 14 dni.\n";
  const verb = checkSpans([{ text: "We refund within fourteen days." }], SRC, {});
  check(verb.ok && verb.marks.length === 0 && verb.body === "We refund within fourteen days.",
    "2a  a verbatim span passes and carries no mark");

  const invented = checkSpans([{ text: NONCE }], SRC, {});
  check(invented.ok === false && invented.why === "invented" && invented.at === 0,
    "2b  a span with no source at all is refused as an invention, naming which span");

  const notAsked = checkSpans([{ text: "We refund fast.", was: "We refund within fourteen days." }],
    SRC, {});
  check(notAsked.ok === false && /not asked for/.test(notAsked.why),
    "2c  a rewording is refused where rewording was not asked for");

  const reworded = checkSpans([{ text: "Hello there. " },
    { text: "We refund fast.", was: "We refund within fourteen days." }], SRC, { reword: true });
  check(reworded.ok && reworded.marks.length === 1 && reworded.marks[0].at === 13
        && reworded.marks[0].len === "We refund fast.".length,
    "2d  a rewording passes with one mark at the offset it starts at in the proposed body");

  const fakeWas = checkSpans([{ text: "We refund fast.", was: NONCE }], SRC, { reword: true });
  check(fakeWas.ok === false && fakeWas.why === "invented",
    "2e  a rewording of something the file does not contain is an invention wearing a `was`");

  const backOne = revertMark(reworded.body, reworded.marks, 0);
  check(backOne.text === "Hello there. We refund within fourteen days." && backOne.marks.length === 0,
    "2f  one press puts the original bytes back and takes the mark with them");

  const twoMarks = checkSpans([
    { text: "A.", was: "Hello there." },
    { text: " " },
    { text: "B.", was: "We refund within fourteen days." }], SRC, { reword: true });
  const afterFirst = revertMark(twoMarks.body, twoMarks.marks, 0);
  check(twoMarks.ok && twoMarks.marks.length === 2 && afterFirst.marks.length === 1
        && afterFirst.text.slice(afterFirst.marks[0].at,
             afterFirst.marks[0].at + afterFirst.marks[0].len) === "B.",
    "2g  reverting one mark moves the marks after it, which still cover their own text");
  check(revertBody(twoMarks.body, twoMarks.marks)
        === "Hello there. We refund within fourteen days.",
    "2h  reverting them all gives the bytes the file holds");

  const segs = markSegments(reworded.body, reworded.marks);
  check(segs.map(s => s.text).join("") === reworded.body
        && segs.filter(s => s.mark).length === 1
        && segs.filter(s => s.mark)[0].text === "We refund fast.",
    "2i  the highlighter's runs join back to the body and exactly one of them is the change");

  /* THE PLACEHOLDERS, WHICH ARE A CHANGE TO THE WORDS LIKE ANY OTHER and go through the same
     marks. Driven through importText rather than through checkSpans, because the coordinate
     arithmetic that moves a reword mark past a translated token lives there and is the one
     piece of this feature where being off by a few characters would put the highlight beside
     the change rather than on it. */
  const PH = "Hi {{customer.name}}, your refund is on its way, {{agent.name}} will confirm.\n";
  const phAt = path.join(SCRATCH, "placeholders.txt");
  fs.writeFileSync(phAt, PH, "utf8");
  const phCard = (spans) => JSON.stringify({ cards: [{ title: { en: "Refund" },
    category: "refunds", intents: [], bodies: [{ lang: "en", spans }] }] }, null, 1) + "\n";

  fs.writeFileSync(answerAt, phCard([{ text: PH.trim() }]), "utf8");
  const ph = await importText({ file: phAt, ask: stubAsk(),
    id: "ph-one", name: "ph one" });
  const phBody = ph.catalog.cards[0].body.en;
  const phMarks = ph.report.marks[0].marks;
  check(ph.report.counts.placeholder === 2 && phBody.indexOf("{PAX}") >= 0
        && phBody.indexOf("{AGENT}") >= 0 && phBody.indexOf("{{") < 0,
    "2j  a verbatim span's platform tokens become the engine's, and each is a mark ("
    + ph.report.counts.placeholder + " of them)");
  check(phMarks.every(m => phBody.slice(m.at, m.at + m.len) === (m.was.indexOf("agent") >= 0
          ? "{AGENT}" : "{PAX}")),
    "2k  each placeholder mark covers exactly the engine token it put there");
  check(revertBody(phBody, phMarks) === PH.trim(),
    "2l  reverting them gives the file's own bytes, tokens and all");

  /* A TOKEN INSIDE A REWORDED SPAN IS NOT A SECOND MARK. Two marks over one run would overlap,
     and markSegments cuts the body into runs on the assumption that they never do. */
  fs.writeFileSync(answerAt, phCard([
    { text: "Hello {{customer.name}}, the money is coming back to you,",
      was: "Hi {{customer.name}}, your refund is on its way," },
    { text: " {{agent.name}} will confirm." }]), "utf8");
  const phR = await importText({ file: phAt, ask: stubAsk(),
    id: "ph-two", name: "ph two", reword: true });
  const rBody = phR.catalog.cards[0].body.en;
  const rMarks = phR.report.marks[0].marks;
  const overlap = rMarks.some((m, i) => i > 0
    && m.at < rMarks[i - 1].at + rMarks[i - 1].len);
  check(phR.report.counts.reword === 1 && phR.report.counts.placeholder === 1 && !overlap,
    "2m  a token inside a rewording is swallowed by its mark: 1 reword, 1 placeholder, no"
    + " overlap");
  check(markSegments(rBody, rMarks).map(s => s.text).join("") === rBody
        && revertBody(rBody, rMarks) === PH.trim(),
    "2n  the runs still join to the body and reverting them all gives the file's bytes");

  /* ---- 3. THE PIPELINE, ON THE STUB --------------------------------------------------------- */

  process.stdout.write("3  the pipeline, on the stub, with a planted invention\n");

  const catalog = readCatalogDocument(sampleAt);
  const flat = flattenCatalog(catalog);
  const flatDir = path.join(SCRATCH, "flat");
  const { textAt } = writeFlatten(flatDir, flat.text, flat.key);
  const source = fs.readFileSync(textAt, "utf8");
  const trueCards = new Set(flat.key.stretches.map(s => s.card)).size;

  fs.writeFileSync(answerAt, cannedAnswer(flat.key, source, { invent: true }), "utf8");
  const out = await importText({ file: textAt, ask: stubAsk(),
    id: "stub-import", name: "stub import" });
  check(!!out.catalog, "3a  the whole path ran on a local program and fetch poisoned");
  check(out.report.counts.proposed === trueCards + 1 && out.report.counts.refused === 1
        && out.report.counts.cards === trueCards,
    "3b  " + (trueCards + 1) + " proposed, 1 refused by the source check, " + trueCards + " kept");
  check(JSON.stringify(out.catalog).indexOf(NONCE) < 0,
    "3c  the invented card is in no byte of the catalog the importer built");
  check(out.report.counts.spliced === 0 && out.report.counts.reword === 0,
    "3d  a verbatim run splices nothing and rewords nothing");

  const proj = path.join(SCRATCH, "project");
  const csv = (() => {
    const at = path.join(SCRATCH, "piles", "head");
    const r = spawnSync(process.execPath, ["tools/fixtures/generate.mjs", "--seed", "602",
      "--rows", "6", "--out", at], { cwd: ROOT, encoding: "utf8" });
    if (r.status !== 0) throw new Error("the generator refused: " + (r.stderr || r.stdout));
    return path.join(at, "macros.csv");
  })();
  await plantProject(proj, csv, "head-catalog");
  const inbox = path.join(proj, "inbox");
  writeTextImport(inbox, "replies.ec", out.catalog, out.report);
  check(allBytes(inbox).indexOf(NONCE) < 0,
    "3e  the nonce is in no byte of the inbox, report included: the refusal is before the queue");

  const queue = await reviewProposal({ project: proj, file: path.join(inbox, "replies.ec"),
    rules: [], write: false });
  const adds = queue.changes.filter(c => c.scope === "card" && c.op === "add").length;
  const removes = queue.changes.filter(c => c.op === "remove").length;
  check(queue.ok && queue.foreign === true && adds === trueCards && removes === 0,
    "3f  the review queue reads it as another catalog's cards coming in: " + adds
    + " card(s) added, " + removes + " removals offered");

  const decided = await reviewProposal({ project: proj, file: path.join(inbox, "replies.ec"),
    rules: [{ verb: "accept", pattern: queue.changes[0].key }],
    from: "the import model", now: "2026-09-21T00:00:00" });
  const log = readLog(proj);
  const entry = log.reviews[log.reviews.length - 1];
  check(decided.ok && decided.accepted.length === 1 && entry && entry.by && entry.at
        && entry.from === "the import model",
    "3g  accepting one row stamps who accepted it and when, in " + REVIEW_LOG
    + " (by " + JSON.stringify(entry ? entry.by : null) + ")");

  /* ---- 4. THE SCORE, OUT OF A REAL RUN ------------------------------------------------------ */

  process.stdout.write("4  the score, from tools/import-bench/score.mjs over what this importer wrote\n");

  const clean = await importText({ file: textAt,
    ask: stubAsk(), id: "stub-clean", name: "stub clean" });
  const report = scoreCatalog(clean.catalog, flat.key, source);
  printScore(report, l => process.stdout.write("       " + l + "\n"));
  check(report.invention.n === 0 && report.invention.of === report.verbatim.of,
    "4a  invention " + report.invention.n + " of " + report.invention.of + " proposed bodies");
  check(report.boundaries.exact === trueCards && report.boundaries.missed === 0
        && report.boundaries.split === 0 && report.boundaries.merged === 0,
    "4b  boundaries exact " + report.boundaries.exact + " of " + report.boundaries.trueCards
    + ", missed " + report.boundaries.missed);
  check(report.language.right === report.language.of,
    "4c  language " + report.language.right + " of " + report.language.of);
  check(report.category.right === report.category.of,
    "4d  category " + report.category.right + " of " + report.category.of);
  check(report.intent.right === report.intent.of,
    "4e  intent " + report.intent.right + " of " + report.intent.of);

  /* THE BASELINE IN THE SAME RUN, so the comparison is two numbers this file produced rather
     than one number and a memory of another. 603 measured the present CSV importer at 0
     proposed and 29 missed; it is measured again here because a baseline quoted from a report
     is a baseline nobody re-ran. */
  let csvScore = null;
  try {
    const made = await importCsv({ file: textAt, id: "csv-on-text", name: "csv on text" });
    csvScore = scoreCatalog(made.catalog, flat.key, source);
  } catch {
    csvScore = scoreCatalog({ cards: [] }, flat.key, source);
  }
  check(csvScore.boundaries.exact === 0 && csvScore.boundaries.missed === trueCards,
    "4f  the baseline in the same run: the CSV importer fed the same file proposes "
    + csvScore.boundaries.proposedCards + " and misses " + csvScore.boundaries.missed
    + " of " + trueCards);

  /* ---- 4b. THE ANCHORS, WHICH ARE WHAT MAKES A REAL CATALOG FIT IN AN ANSWER ---------------- */

  process.stdout.write("4b  anchors rather than the words\n");

  const wordsBytes = Buffer.byteLength(cannedAnswer(flat.key, source, {}), "utf8");
  const anchorAnswer = cannedAnswer(flat.key, source, { anchor: true });
  fs.writeFileSync(answerAt, anchorAnswer, "utf8");
  const anchored = await importText({ file: textAt,
    ask: stubAsk(), id: "stub-anchor",
    name: "stub anchor" });
  const anchorScore = scoreCatalog(anchored.catalog, flat.key, source);
  check(anchored.report.counts.anchored > 0
        && anchorScore.boundaries.exact === trueCards && anchorScore.invention.n === 0,
    "4g  " + anchored.report.counts.anchored + " span(s) given as anchors score exactly as the"
    + " words do: exact " + anchorScore.boundaries.exact + ", invention " + anchorScore.invention.n);
  /* WHAT AN ANCHOR COSTS DOES NOT DEPEND ON HOW LONG THE REPLY IS, which is the whole claim;
     the invented sample's replies average about 145 characters, so the saving ON IT is small
     and the number that matters is the one per span. A real catalog's replies are three times
     longer and there are nine times as many of them. */
  const anchorBytes = Buffer.byteLength(anchorAnswer, "utf8");
  const lens = flat.key.stretches.map(x => x.end - x.start);
  const longest = Math.max.apply(null, lens);
  const spanCost = JSON.stringify({ from: "x".repeat(40), to: "y".repeat(40),
                                    chars: longest }).length;
  check(anchorBytes < wordsBytes && spanCost < 120,
    "4h  the answer is " + anchorBytes + " bytes against " + wordsBytes + " written out, over a"
    + " source of " + source.length + " characters; one anchor span is " + spanCost
    + " bytes whatever the reply is, and the longest here is " + longest);
  check(JSON.stringify(anchored.catalog.cards.map(c => c.body))
        === JSON.stringify(clean.catalog.cards.map(c => c.body)),
    "4i  and the bodies it resolved are byte for byte the ones the copied answer gave");

  /* A TAIL ANCHOR THAT REPEATS INSIDE ITS OWN REPLY, which is the ordinary case in a support
     catalog: the sign-off is forty characters, quoted in the middle and written again at the
     end. The first occurrence after the head is the wrong end; `chars` tells the two apart.
     An anchor shorter than 40 characters is refused, and so is one that gives no length. */
  const head = "H".repeat(40);
  const tail = "K".repeat(40);
  const first = head + " We wrote: " + tail
    + " Then several more words follow here before the end. " + tail;
  const REP = first + "\n\nReply two, another one.\n";
  const withChars = checkSpans([{ from: head, to: tail, chars: first.length }],
    REP, { cursor: { at: 0 } });
  const noChars = checkSpans([{ from: head, to: tail }], REP, { cursor: { at: 0 } });
  check(withChars.ok && withChars.body === first && withChars.loose !== true,
    "4j  a sign-off quoted inside its own reply resolves to the right end by `chars` ("
    + (withChars.ok ? withChars.body.length : withChars.why) + " of " + first.length
    + " characters)");
  check(noChars.ok === false && noChars.anchor === true && /length/.test(String(noChars.why)),
    "4k  and without `chars` the anchor is refused ("
    + (noChars.ok ? noChars.body.length + " characters kept" : noChars.why)
    + "): a missing length is not a guess");
  const badFrom = (NONCE + "x".repeat(40)).slice(0, 48);
  const badTo = "Z".repeat(40);
  const badAnchor = checkSpans([{ from: badFrom, to: badTo, chars: 40 }],
    REP, { cursor: { at: 0 } });
  check(badAnchor.ok === false && badAnchor.why === "invented" && badAnchor.anchor === true,
    "4l  an anchor the file has not got is the same refusal as an invented span");

  /* ---- 4c. THE FILE IN PIECES ---------------------------------------------------------------
   *
   * A real file is asked for in pieces and the pieces have to add up to the same catalog. The
   * model here reads only the piece it was sent and proposes every reply that begins or ends in
   * it CUT TO THE PIECE, which is what a model shown half a reply does. So a piece beginning or
   * ending inside a reply that the import did not hold back is a card proposed twice, and the
   * score says so; and a model that handed back one answer to every ask could not pass.
   */
  process.stdout.write("4c  the file in pieces\n");

  const pieceModel = (shape) => {
    let from = 0;
    const read = [];
    const ask = async (q) => {
      /* A cut moved back sends a piece beginning before the last one sent; 4m holds the place
         found here to the report's own. */
      let at = source.indexOf(q.body, from);
      if (at < 0) at = source.lastIndexOf(q.body, from);
      if (at < 0) return { ok: false, refusal: "the stub was sent text the file has not got" };
      from = at; read.push(at);
      const end = at + q.body.length;
      const mine = flat.key.stretches.filter(x => x.start < end && x.end > at)
        .map(x => Object.assign({}, x, { start: Math.max(x.start, at), end: Math.min(x.end, end),
                                         cutEnd: x.end > end }))
        .filter(x => source.slice(x.start, x.end).trim());
      const said = shape ? shape(mine) : mine;
      const text = cannedAnswer({ stretches: said }, source, { anchor: true });
      if (text !== cannedAnswer({ stretches: mine }, source, { anchor: true })) m.misread++;
      return { ok: true, text };
    };
    const m = { ask, read, misread: 0 };
    return m;
  };
  const inReply = o => flat.key.stretches.some(x => o > x.start && o < x.end);
  const inPieces = async (chars, id) => {
    const m = pieceModel();
    const got = await importText({ file: textAt, ask: m.ask, id, name: id, chunkChars: chars });
    const rows = got.report.asked.pieces;
    return { got, rows, read: m.read, score: scoreCatalog(got.catalog, flat.key, source),
             ends: rows.filter(p => !p.grown && inReply(p.at + p.chars)).length };
  };

  const chunked = await inPieces(2500, "stub-chunked");
  const rows = chunked.rows;
  check(rows.length > 1 && !rows.some(p => inReply(p.at))
        && rows.every((p, i) => p.at === chunked.read[i]),
    "4m  the file is asked for in " + rows.length + " piece(s), none of them beginning inside"
    + " a reply");
  const covered = new Uint8Array(source.length);
  rows.forEach(p => covered.fill(1, p.at, p.at + p.chars));
  let bare = 0;
  for (let i = 0; i < source.length; i++) if (!covered[i] && /\S/.test(source[i])) bare++;
  check(bare === 0 && chunked.ends > 0,
    "4n  the pieces hold every visible character of the file (" + bare + " outside), and "
    + chunked.ends + " of them ended inside a reply, the case 4m and 4q are about");
  check(chunked.got.report.asked.unanswered === 0,
    "4o  " + chunked.got.report.asked.calls + " ask(s), " + chunked.got.report.asked.unanswered
    + " unanswered");
  const b = chunked.score.boundaries;
  check(chunked.score.invention.n === 0 && b.missed === 0,
    "4p  nothing is invented and nothing is lost across the cuts: invention "
    + chunked.score.invention.n + ", missed " + b.missed);
  check(b.exact === trueCards && b.trueCards === trueCards,
    "4q  and cutting costs nothing: exact " + b.exact + " of " + b.trueCards + ", split "
    + b.split + " merged " + b.merged + " inexact " + b.inexact);

  /* A REPLY LONGER THAN THE PIECE, asked for with pieces half as long as the longest reply: its
     piece holds no second reply to cut before, so it is asked again, longer, rather than cut. */
  const widest = Math.max(...flat.key.stretches.map(x => x.end - x.start));
  const small = await inPieces(Math.floor(widest / 2), "stub-small");
  const sb = small.score.boundaries;
  check(small.rows.some(p => p.grown) && sb.exact === trueCards
        && !small.rows.some(p => inReply(p.at)),
    "4r  pieces of " + Math.floor(widest / 2) + " characters against a reply of " + widest
    + ": " + small.rows.filter(p => p.grown).length + " piece(s) asked again longer, exact "
    + sb.exact + " of " + sb.trueCards);

  /* A CARD REACHING INTO THE LAST REPLY MOVES THE CUT BACK TO ITSELF, and an answer placing no
     card in the piece moves on past it rather than asking the same piece forever. */
  const hbText = "First reply here.\nSecond reply, which a model\n\nran into the third.\nThird reply";
  const hb = holdBack({ at: 100, text: hbText }, [
    { bodies: [{ lang: "en", spans: [{ text: "First reply here." }] }] },
    { bodies: [{ lang: "en", spans: [{ text: "Second reply, which a model\n\nran into the third." }] }] },
    { bodies: [{ lang: "en", spans: [{ text: "the third.\nThird reply" }] }] }]);
  const none = holdBack({ at: 0, text: hbText },
    [{ bodies: [{ lang: "en", spans: [{ text: "not in this piece" }] }] }]);
  check(hb.next === 100 + hbText.indexOf("Second") && hb.keep.length === 1 && hb.held === 2
        && none.next === "end" && none.keep.length === 1,
    "4s  a card reaching into the last reply is held back with it (next " + hb.next + ", kept "
    + hb.keep.length + ", held " + hb.held + "), and a piece with no card placed moves on ("
    + none.next + ")");

  /* A MODEL THAT READS THE PIECE'S LAST REPLY WRONG, which is the one thing the cut above relies
     on the model to read right: it begins the next piece where the answer's last card begins.
     The piece model above is a perfect reader, so on its own it cannot tell a cutter that follows
     the answer from one that follows the replies. Each model here differs from it only in how it
     cards a reply the piece's end has cut off, and asked the whole file it is the perfect reader.
     THE ORACLE IS THE SAME MODEL ASKED THE WHOLE FILE AT ONCE: whatever the pieces lose against
     that, the cutting lost. A cutter that cuts only where replies begin passes this, measured.
     Not here, on purpose: a model over-splitting every reply into interleaved halves, the shape
     the join note measured on a real model. Asked whole it already builds one card of 77 kB,
     because an anchor that stands before the cursor resolves to an earlier repeat (resolveAnchor),
     so a cutter that follows the replies exactly still differs from it by a card. That is a fault
     of its own, not the cutting's. Added by the test architect, 2026-09-25, reading 4c after the
     lead engineer rewrote it. */
  const paras = (a, b) => {
    const out = [];
    const re = /\n[ \t]*\n/g;
    const s = source.slice(a, b);
    let p = 0, m;
    const push = (x, y) => {
      while (x < y && /\s/.test(s[x])) x++;
      while (y > x && /\s/.test(s[y - 1])) y--;
      if (y > x) out.push([a + x, a + y]);
    };
    while ((m = re.exec(s))) { push(p, m.index); p = m.index + m[0].length; }
    push(p, s.length);
    return out;
  };
  const SHAPES = {
    /* the visible paragraphs of a reply cut off at the piece's end, each read as a reply */
    "fragment paragraphs": mine => mine.flatMap(x => !x.cutEnd ? [x]
      : paras(x.start, x.end).map(([a, b], i) => Object.assign({}, x,
          { start: a, end: b, card: i ? x.card + "#p" + i : x.card }))),
    /* a language cut off at the piece's end, not paired with the rest of its card */
    "fragment unpaired": mine => mine.map(x => !x.cutEnd ? x
      : Object.assign({}, x, { card: x.card + "#cut" })),
  };
  const bodiesOf = cat => cat.cards.map(c => JSON.stringify(c.body)).sort();
  const lost = [];
  for (const name of Object.keys(SHAPES)) {
    const whole = await importText({ file: textAt, ask: pieceModel(SHAPES[name]).ask,
      id: "stub-whole", name: "stub whole", chunkChars: 0 });
    const m = pieceModel(SHAPES[name]);
    const cut = await importText({ file: textAt, ask: m.ask, id: "stub-cut", name: "stub cut",
      chunkChars: 2500 });
    const w = bodiesOf(whole.catalog), c = bodiesOf(cut.catalog);
    const extra = c.filter(x => w.indexOf(x) < 0).length;
    const gone = w.filter(x => c.indexOf(x) < 0).length;
    const sw = scoreCatalog(whole.catalog, flat.key, source).boundaries;
    const sc = scoreCatalog(cut.catalog, flat.key, source).boundaries;
    /* THE LIVENESS: the model misread at least one piece it was sent, or this is 4q again. */
    lost.push({ ok: m.misread > 0 && extra === 0 && gone === 0, line: name + ": " + m.misread
      + " of " + m.read.length + " piece(s) misread, whole exact " + sw.exact + ", in pieces exact "
      + sc.exact + " (" + gone + " card(s) of the whole answer lost, " + extra + " not in it)" });
  }
  check(lost.every(x => x.ok),
    "4t  a model reading the last reply of a piece wrong loses nothing to the cutting that it"
    + " would not lose asked the whole file: " + lost.map(x => x.line).join("; "));

  /* A CHAIN OF CARDS, each reaching into the next, is held back whole: the loop in holdBack runs
     until nothing moves, which one pass over the cards in answer order does not reach. */
  const chText = "zero one two three four five six";
  const ch = holdBack({ at: 0, text: chText }, ["zero", "one two three", "three four five",
    "five six"].map(t => ({ bodies: [{ lang: "en", spans: [{ text: t }] }] })));
  check(ch.next === chText.indexOf("one") && ch.keep.length === 1 && ch.held === 3,
    "4u  a chain of three cards each reaching into the next is held back whole (next " + ch.next
    + ", kept " + ch.keep.length + ", held " + ch.held + ")");

  /* ---- 4v-4x. MANY FRAGMENTS, AND A PIECE THAT FAILS ----------------------------------------
   *
   * A generated file of invented words whose every reply is four paragraphs, so a cut reply shows
   * up to three and a model carding each paragraph apart gives up to three fragments, more than
   * holding back a fixed number of cards covers. The model reads a piece as 4c's does.
   */
  const SYL = ["ba", "dor", "ven", "lis", "mo", "tar", "quen", "sul", "rin", "po", "gal", "ez"];
  let seed = 770;
  const rnd = () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const word = () => Array.from({ length: 2 + Math.floor(rnd() * 3) },
    () => SYL[Math.floor(rnd() * SYL.length)]).join("");
  const sentence = () => {
    const w = Array.from({ length: 6 + Math.floor(rnd() * 6) }, word).join(" ");
    return w[0].toUpperCase() + w.slice(1) + ".";
  };
  const MANY = [];
  let many = "";
  for (let r = 0; r < 24; r++) {
    const start = many.length;
    many += Array.from({ length: 4 }, () => sentence() + " " + sentence()).join("\n\n");
    MANY.push({ card: "m" + r, lang: "en", start, end: many.length });
    many += "\n\n";
  }
  const manyAt = path.join(SCRATCH, "many.txt");
  fs.writeFileSync(manyAt, many, "utf8");
  const manyModel = (o) => {
    const m = { read: [], misread: 0, most: 0, times: new Map() };
    let from = 0;
    m.ask = async (q) => {
      let at = many.indexOf(q.body, from);
      if (at < 0) at = many.lastIndexOf(q.body, from);
      from = at; m.read.push(at);
      const times = (m.times.get(at) || 0) + 1;
      m.times.set(at, times);
      const fail = o && o.fail ? o.fail(at, times) : null;
      if (fail === "refuse") return { ok: false, refusal: "the stub refused this ask" };
      if (fail === "empty") return { ok: true, text: '{"cards":[]}' };
      const end = at + q.body.length;
      const mine = MANY.filter(x => x.start < end && x.end > at)
        .map(x => Object.assign({}, x, { start: Math.max(x.start, at), end: Math.min(x.end, end),
                                         cutEnd: x.end > end }));
      const said = o && o.fragment ? mine.flatMap(x => {
        if (!x.cutEnd) return [x];
        const bits = [];
        let p = x.start;
        many.slice(x.start, x.end).split("\n\n").forEach((t, i) => {
          if (t.trim()) bits.push(Object.assign({}, x, { start: p, end: p + t.length,
                                                        card: i ? x.card + "#p" + i : x.card }));
          p += t.length + 2;
        });
        if (bits.length > 1) m.misread++;
        m.most = Math.max(m.most, bits.length);
        return bits;
      }) : mine;
      return { ok: true, text: JSON.stringify({ cards: said.reduce((cards, x) => {
        let c = cards.find(k => k.id === x.card);
        if (!c) cards.push(c = { id: x.card, title: { en: "Reply " + x.card }, category: "many",
                                 intents: [], bodies: [] });
        c.bodies.push({ lang: "en", spans: [{ text: many.slice(x.start, x.end) }] });
        return cards;
      }, []) }) };
    };
    return m;
  };
  const manyRun = (m, chars) => importText({ file: manyAt, ask: m.ask, id: "stub-many",
    name: "stub many", chunkChars: chars });
  const manyWhole = bodiesOf((await manyRun(manyModel({ fragment: true }), 0)).catalog);
  const frag = manyModel({ fragment: true });
  const fragOut = await manyRun(frag, 2500);
  const fragBodies = bodiesOf(fragOut.catalog);
  check(frag.most >= 3 && manyWhole.length === MANY.length
        && JSON.stringify(fragBodies) === JSON.stringify(manyWhole),
    "4v  a cut reply carded as up to " + frag.most + " fragments (" + frag.misread + " of "
    + frag.read.length + " pieces) loses nothing the whole file would not: " + fragBodies.length
    + " cards against " + manyWhole.length + " asked whole");

  /* THE RETRY (board 770): a piece that is refused, or answered with no card, is asked once more,
     and the run then comes out as if nothing had failed. */
  const plain = await manyRun(manyModel(), 2500);
  const third = plain.report.asked.pieces[2].at;
  const retries = [];
  for (const how of ["refuse", "empty"]) {
    const m = manyModel({ fail: (at, times) => (at === third && times === 1 ? how : null) });
    const r = await manyRun(m, 2500);
    retries.push({ ok: m.times.get(third) === 2 && r.report.asked.retried === 1
      && r.report.counts.unread === 0
      && JSON.stringify(bodiesOf(r.catalog)) === JSON.stringify(bodiesOf(plain.catalog)),
      line: how + ": asked " + m.times.get(third) + " time(s) there, retried "
        + r.report.asked.retried + ", unread " + r.report.counts.unread });
  }
  check(retries.every(x => x.ok),
    "4w  a piece that fails once is asked again and the run is the uninterrupted one: "
    + retries.map(x => x.line).join("; "));

  /* A PIECE THAT FAILS EVERY TIME is asked twice and no more, cut blind, and the report names the
     card beginning last before the unread stretch and first after it, for the review to flag. */
  const stuck = manyModel({ fail: at => (at === third ? "refuse" : null) });
  const stuckOut = await manyRun(stuck, 2500);
  const u = (stuckOut.report.unread || [])[0] || {};
  const startOfCard = id => {
    const c = stuckOut.catalog.cards.find(k => k.id === id);
    return c ? many.indexOf(c.body.en) : -1;
  };
  const between = stuckOut.catalog.cards.filter(c => {
    const a = many.indexOf(c.body.en);
    return a >= u.at && a < u.end;
  }).length;
  const b0 = startOfCard(u.before), a0 = startOfCard(u.after);
  const nearer = stuckOut.catalog.cards.filter(c => {
    const a = many.indexOf(c.body.en);
    return (a > b0 && a < u.at) || (a >= u.end && a < a0);
  }).length;
  check(stuck.times.get(third) === 2 && stuckOut.report.counts.unread === 1 && u.at === third
        && b0 >= 0 && b0 < u.at && a0 >= u.end && between === 0 && nearer === 0,
    "4x  a piece that fails every time is asked " + stuck.times.get(third) + " times, and the cut"
    + " is flagged with the cards either side: unread " + u.at + ".." + u.end + ", before "
    + u.before + " at " + b0 + ", after " + u.after + " at " + a0);

  /* ---- 4y-4z. AN ANCHOR BEHIND THE CURSOR (board 771) ---------------------------------------
   *
   * A card cut in two with its languages interleaved leaves the cursor past the second half's
   * first language, and two replies may open with the same forty characters. The head behind the
   * cursor is then the nearest one, and a pair of anchors naming nothing near `chars` is none.
   */
  const OPEN = "Thank you for writing to us about the parcel you sent";
  const DUPS = [OPEN + " last week. It is on its way back to you. Kind regards.",
    "A reply standing between the two, long enough to be a reply of its own. Best wishes.",
    "Another reply between them, about opening hours and the lift. With thanks.",
    OPEN + " yesterday. We have found it and it leaves today. Warm regards.",
    "The reply after it, which the cursor has already passed. All the best."];
  const DUP_SRC = DUPS.join("\n\n") + "\n";
  const past = { at: DUP_SRC.indexOf(DUPS[4]) + DUPS[4].length };
  const behind = checkSpans([{ from: DUPS[3].slice(0, 40), to: DUPS[3].slice(-40),
    chars: DUPS[3].length }], DUP_SRC, { cursor: past });
  /* and a head ahead of the cursor whose run is only near `chars` loses to one behind it that
     is close, which is the interleaved card's second language meeting a later repeat */
  const CLOSE = " We will write again soon. Kind regards, the team.";
  const AHEAD = [OPEN + " yesterday. We have found it and it leaves today." + CLOSE,
    "The reply after it, which the cursor has already passed. All the best.",
    OPEN + " on Monday. It has not arrived yet.",
    "A note about the courier's timetable, which changes in winter and again in spring,"
    + " when the depot moves its collections to the morning." + CLOSE];
  const AHEAD_SRC = AHEAD.join("\n\n") + "\n";
  const ahead = checkSpans([{ from: AHEAD[0].slice(0, 40), to: AHEAD[0].slice(-40),
    chars: AHEAD[0].length }], AHEAD_SRC,
    { cursor: { at: AHEAD_SRC.indexOf(AHEAD[1]) + AHEAD[1].length } });
  check(behind.ok && behind.body === DUPS[3] && ahead.ok && ahead.body === AHEAD[0],
    "4y  an anchor behind the cursor resolves to the nearest head, not the file's first: "
    + (behind.ok ? behind.body.length : behind.why) + " characters for a reply of "
    + DUPS[3].length + "; and the close head behind wins over a near one ahead: "
    + (ahead.ok ? ahead.body.length : ahead.why) + " for " + AHEAD[0].length);
  const far = checkSpans([{ from: DUPS[1].slice(0, 40), to: DUPS[4].slice(-40), chars: 20 }],
    DUP_SRC, { cursor: { at: 0 } });
  check(!far.ok && far.anchor === true,
    "4z  anchors naming no passage near the length given are refused: "
    + (far.ok ? far.body.length + " characters for 20" : far.why));

  /* ---- 5. THE MARKER PEN IS A REAL CHANGE --------------------------------------------------- */

  process.stdout.write("5  the marker pen, and what it costs the score\n");

  fs.writeFileSync(answerAt, cannedAnswer(flat.key, source, { reword: true }), "utf8");
  const rew = await importText({ file: textAt, ask: stubAsk(),
    id: "stub-reword", name: "stub reword", reword: true });
  check(rew.report.counts.reword === 1 && rew.report.marks.length === 1,
    "5a  the reworded run carries exactly one mark");
  const rewScore = scoreCatalog(rew.catalog, flat.key, source);
  check(rewScore.invention.n === 1 && report.invention.n === 0,
    "5b  the scorer calls the reworded body an invention (" + rewScore.invention.n + " of "
    + rewScore.invention.of + ") where the verbatim run scored 0: the mark is a real change");

  const mark = rew.report.marks[0];
  const card = rew.catalog.cards.find(c => c.id === mark.card);
  const back = revertBody(card.body[mark.lang], mark.marks);
  check(source.indexOf(back) >= 0,
    "5c  one press per mark and the body is a substring of the source file again");

  const rewordedRefused = await (async () => {
    const r = await importText({ file: textAt,
      ask: stubAsk(), id: "stub-noreword",
      name: "stub noreword" });
    return r;
  })();
  check(rewordedRefused.report.counts.refused === 1
        && rewordedRefused.report.counts.cards === trueCards - 1,
    "5d  the same answer with rewording not asked for drops that card: refused "
    + rewordedRefused.report.counts.refused + ", kept " + rewordedRefused.report.counts.cards);

  /* ---- 7. THE SECOND PASS, WHICH ONLY JOINS -------------------------------------------------
   *
   * THE RED IS BUILT, NOT QUOTED. The same canned answer with every stretch cut in two is what
   * the real model does wrong: over 60 kB of a real catalog it got 38 of 73 boundaries right and
   * over-split 28, and a firmer first prompt moved that not at all. Here the over-splitting is
   * exact and total, so the before and after are both whole numbers rather than a sample.
   *
   * ONE RULE, TWO ANSWERS, OPPOSITE OUTCOMES. The pass asks nobody anything: it joins a run of
   * pieces that interleave, which is what two halves of one bilingual card do and what two whole
   * replies never do. So the over-split answer must come back joined and the correct answer must
   * come back untouched, under the same rule in the same run. Without the second arm this section
   * would pass on a pass that merged everything; without the first it would pass on one that did
   * nothing.
   */
  process.stdout.write("7  the second pass, which only joins\n");

  /**
   * Every reply cut in two at the first space past its middle: one proposed card becomes two,
   * each carrying one half of every language. This is the over-splitting, made exact.
   *
   * A REPLY TOO SHORT TO CUT GOES IN WHOLE, and the count of those is why the numbers below are
   * computed rather than written down. Halving the shortest reply in this fixture leaves a piece
   * of ten characters which stands four times in the file, and the importer's cursor then
   * resolves it somewhere else entirely - a fixture fault, not a joiner fault, but one that would
   * read exactly like a joiner fault.
   */
  function overSplitAnswer(key, src) {
    const byCard = new Map();
    (key.stretches || []).forEach(s => {
      if (!byCard.has(s.card)) byCard.set(s.card, []);
      byCard.get(s.card).push(s);
    });
    const cards = [], runs = [];
    let n = 0;
    byCard.forEach((stretches) => {
      n++;
      const whole = stretches.map(s => ({ lang: s.lang,
        spans: [{ text: src.slice(s.start, s.end) }] }));
      if (stretches.some(s => s.end - s.start < 120)) {
        cards.push({ title: { en: "Reply " + n }, category: "over-split", intents: [],
                     bodies: whole });
        return;
      }
      const halves = [[], []];
      stretches.forEach(s => {
        const text = src.slice(s.start, s.end);
        let cut = text.indexOf(" ", Math.floor(text.length / 2));
        if (cut < 0) cut = Math.floor(text.length / 2);
        halves[0].push({ lang: s.lang, spans: [{ text: text.slice(0, cut) }] });
        halves[1].push({ lang: s.lang, spans: [{ text: text.slice(cut) }] });
      });
      runs.push([cards.length, cards.length + 1]);
      halves.forEach((bodies, half) => cards.push({
        title: { en: "Reply " + n + " half " + (half + 1) },
        category: "over-split", intents: [], bodies }));
    });
    return { cards, runs };
  }

  const over = overSplitAnswer(flat.key, source);
  const overSplit = over.cards;
  const pairs = over.runs;

  fs.writeFileSync(answerAt, JSON.stringify({ cards: overSplit }, null, 1) + "\n", "utf8");
  const splitRun = await importText({ file: textAt,
    ask: stubAsk(), id: "stub-oversplit",
    name: "stub oversplit", join: false });
  const splitScore = scoreCatalog(splitRun.catalog, flat.key, source);
  check(splitScore.invention.n === 0 && splitScore.boundaries.split === pairs.length
        && splitScore.boundaries.exact === trueCards - pairs.length,
    "7a  the red: " + pairs.length + " of " + trueCards + " replies cut in two score exact "
    + splitScore.boundaries.exact + " split " + splitScore.boundaries.split + " of " + trueCards
    + ", inventing " + splitScore.invention.n);

  /* THE SAME ANSWER WITH THE PASS LEFT ON, which asks nobody anything. */
  const joined = await importText({ file: textAt,
    ask: stubAsk(), id: "stub-joined",
    name: "stub joined" });
  const joinScore = scoreCatalog(joined.catalog, flat.key, source);
  check(joined.report.join.how === "weave" && joined.report.join.asked === 0
        && joined.report.counts.joined === pairs.length
        && joined.report.counts.joinedCards === pairs.length
        && joined.report.counts.joinRefused === 0,
    "7b  " + joined.report.counts.joined + " of " + pairs.length + " runs applied with "
    + joined.report.join.asked + " asks, " + joined.report.counts.joinedCards
    + " cards absorbed, " + joined.report.counts.joinRefused + " refused");
  check(joinScore.boundaries.exact === trueCards && joinScore.invention.n === 0
        && joinScore.boundaries.split === 0,
    "7c  and the green: exact " + splitScore.boundaries.exact + " becomes "
    + joinScore.boundaries.exact + " of " + trueCards + ", split " + splitScore.boundaries.split
    + " becomes " + joinScore.boundaries.split + ", invention " + joinScore.invention.n);
  check(JSON.stringify(joined.catalog.cards.map(c => c.body))
        === JSON.stringify(clean.catalog.cards.map(c => c.body)),
    "7d  the bodies it joined are byte for byte the ones the unsplit answer gave");

  /* THE CONTROL, AND IT IS THE HALF THAT GIVES THIS SECTION TEETH. The same rule over an answer
     whose boundaries are already right: two whole replies stand one after the other and do not
     interleave, so nothing may be proposed and nothing may move. A pass that joined on any
     weaker signal - a blank line, a short gap - would merge all 29 here and fail. */
  fs.writeFileSync(answerAt, cannedAnswer(flat.key, source, {}), "utf8");
  const control = await importText({ file: textAt,
    ask: stubAsk(), id: "stub-control",
    name: "stub control" });
  const controlScore = scoreCatalog(control.catalog, flat.key, source);
  check(control.report.join.proposed === 0 && control.report.counts.joined === 0
        && control.report.counts.cards === trueCards,
    "7e  the control: over an answer that is already right the pass proposes "
    + control.report.join.proposed + " runs and joins " + control.report.counts.joined
    + ", leaving " + control.report.counts.cards + " cards");
  check(controlScore.boundaries.exact === trueCards
        && JSON.stringify(control.catalog.cards.map(c => c.body))
           === JSON.stringify(clean.catalog.cards.map(c => c.body)),
    "7f  and it comes back unchanged: exact " + controlScore.boundaries.exact + " of "
    + trueCards + ", the bodies byte for byte the ones it went in with");

  /* THE ASK, WHICH IS KEPT AND IS NOT THE DEFAULT. Measured on a real catalog at exact 38 to 39
     against the weave's 53, three prompts running, so it ships behind a flag. Here it is driven
     on the stub to prove the path still works and that the two ways agree on what a run is, and
     then given a run of two pieces from opposite ends of the file, which is a splice however
     confidently it is proposed. */
  fs.writeFileSync(answerAt,
    JSON.stringify({ cards: overSplit, joins: pairs }, null, 1) + "\n", "utf8");
  const asked = await importText({ file: textAt,
    ask: stubAsk(), id: "stub-asked",
    name: "stub asked", join: "ask" });
  const askScore = scoreCatalog(asked.catalog, flat.key, source);
  check(asked.report.join.how === "ask" && asked.report.join.asked > 0
        && asked.report.counts.joined === pairs.length
        && askScore.boundaries.exact === trueCards,
    "7g  the ask behind the flag reaches the same place in " + asked.report.join.asked
    + " ask(s): " + asked.report.counts.joined + " runs applied, exact "
    + askScore.boundaries.exact + " of " + trueCards);

  fs.writeFileSync(answerAt,
    JSON.stringify({ cards: overSplit, joins: [[0, 5]] }, null, 1) + "\n", "utf8");
  const splice = await importText({ file: textAt,
    ask: stubAsk(), id: "stub-splice",
    name: "stub splice", join: "ask" });
  const spliceScore = scoreCatalog(splice.catalog, flat.key, source);
  check(splice.report.counts.joined === 0 && splice.report.counts.joinRefused === 1
        && splice.report.counts.cards === splitRun.report.counts.cards
        && spliceScore.invention.n === 0,
    "7h  a run of two pieces from opposite ends is refused as a splice: applied "
    + splice.report.counts.joined + ", refused " + splice.report.counts.joinRefused
    + ", cards " + splice.report.counts.cards + ", invention " + spliceScore.invention.n);

  /* THE QUESTION ITSELF CARRIES NO REPLY. What a real model is sent in the second ask is
     eighty characters a piece and a number, whatever the replies are worth; the leg states the
     size because the cost of this pass is the whole argument for it being a second ask rather
     than a longer first one. */
  const rowsFor = overSplit.map((c, i) => ({ i, card: c, bodies: c.bodies.map(b => ({
    lang: b.lang, body: b.spans[0].text, marks: [],
    at: source.indexOf(b.spans[0].text),
    end: source.indexOf(b.spans[0].text) + b.spans[0].text.length })) }));
  const question = joinQuestion(joinCandidates(rowsFor));
  const perPiece = Math.round(question.length / joinCandidates(rowsFor).length);
  check(perPiece < 150 && question.indexOf(NONCE) < 0
        && !overSplit.some(c => c.bodies[0].spans[0].text.length > 80
                                && question.indexOf(c.bodies[0].spans[0].text) >= 0),
    "7i  were it asked, the question would cost " + perPiece + " characters a piece whatever the"
    + " replies are worth (" + question.length + " over " + joinCandidates(rowsFor).length
    + " pieces), and it holds no reply longer than the eighty characters of its two anchors");

  /* WHERE THE PASS DOES NOTHING, MEASURED RATHER THAN LEFT TO BE ASSUMED. The rule is that two
     halves of one card interleave, and they interleave because the card has two languages: its
     second half's English begins before its first half's Polish ends. A file in ONE language has
     no such weave, so an over-split monolingual catalog comes back over-split and the joining
     pass is worth exactly nothing on it. Somebody will otherwise read section 7 as "over-
     splitting is fixed", and it is fixed for a bilingual catalog only. The file here is the
     fixture's English stretches alone, re-laid out with their own offsets and their own key. */
  const monoKey = { kind: "etiuda-studio-flatten-key", stretches: [] };
  let monoText = "";
  flat.key.stretches.filter(s => s.lang === "en").forEach((s, i) => {
    const t = source.slice(s.start, s.end);
    monoKey.stretches.push({ i, card: s.card, lang: "en", start: monoText.length,
      end: monoText.length + t.length, intent: s.intent, intentClauses: s.intentClauses,
      category: s.category, categoryLabels: s.categoryLabels });
    monoText += t + "\n\n";
  });
  const monoCards = [];
  monoKey.stretches.forEach((s, n) => {
    const t = monoText.slice(s.start, s.end);
    const one = (title, text) => monoCards.push({ title: { en: title }, category: "mono",
      intents: [], bodies: [{ lang: "en", spans: [{ text }] }] });
    if (t.length < 120) { one("Reply " + n, t); return; }
    let cut = t.indexOf(" ", Math.floor(t.length / 2));
    if (cut < 0) cut = Math.floor(t.length / 2);
    one("Reply " + n + " half 1", t.slice(0, cut));
    one("Reply " + n + " half 2", t.slice(cut));
  });
  const monoAt = path.join(SCRATCH, "monolingual.txt");
  fs.writeFileSync(monoAt, monoText, "utf8");
  fs.writeFileSync(answerAt, JSON.stringify({ cards: monoCards }, null, 1) + "\n", "utf8");
  const mono = await importText({ file: monoAt,
    ask: stubAsk(), id: "stub-mono", name: "stub mono" });
  const monoScore = scoreCatalog(mono.catalog, monoKey, monoText);
  check(mono.report.counts.joined === 0 && monoScore.boundaries.split > 0
        && monoScore.invention.n === 0,
    "7j  and it is worth nothing on a file in ONE language: " + mono.report.counts.joined
    + " runs joined, boundaries exact " + monoScore.boundaries.exact + " split "
    + monoScore.boundaries.split + " of " + monoScore.boundaries.trueCards
    + " - over-splitting is repaired for a bilingual catalog and for no other");

  /* A MODEL CARDING EVERY REPLY OF TWO PARAGRAPHS OR MORE AS TWO CARDS, at its middle paragraph,
     through 4c's piece model: a half under 80 characters comes as its words, often a sign-off
     standing many times in the file, and the next repeat ahead of the cursor is another reply's
     (board 773). Liveness: such halves exist here and stand more than once. */
  const halvesShape = mine => mine.flatMap(x => {
    const ps = paras(x.start, x.end);
    if (ps.length < 2) return [x];
    const k = Math.ceil(ps.length / 2);
    return [Object.assign({}, x, { end: ps[k - 1][1], half: 1 }),
            Object.assign({}, x, { start: ps[k][0], card: x.card + "#h2", half: 2 })];
  });
  const repeated = halvesShape(flat.key.stretches).filter(x => x.half && x.end - x.start < 80
    && source.split(source.slice(x.start, x.end)).length > 2).length;
  const halfRuns = [];
  for (const chars of [0, 2500, 5000]) {
    const r = await importText({ file: textAt, ask: pieceModel(halvesShape).ask,
      id: "stub-halves", name: "stub halves", chunkChars: chars });
    const b = scoreCatalog(r.catalog, flat.key, source).boundaries;
    halfRuns.push({ ok: b.exact === trueCards && b.split === 0 && b.merged === 0
                        && r.report.counts.joinRefused === 0,
      line: (chars ? "in pieces of " + chars : "whole") + " exact " + b.exact + " split " + b.split
        + " merged " + b.merged + " joins refused " + r.report.counts.joinRefused });
  }
  check(repeated > 0 && halfRuns.every(x => x.ok),
    "7k  every reply carded in halves comes back one card, " + repeated + " half(s) given as words"
    + " that repeat in the file: " + halfRuns.map(x => x.line).join("; "));

  /* AND THE CARD BEFORE KEEPS ITS OWN WORDS: a card given as the words that also end the card
     before it is looked for past what that card holds, or the weave would join the two. */
  const TAIL = ["Your parcel comes back to us tomorrow morning and goes out again straight after."
    + "\n\nWith warm regards", "Paczka wraca do nas jutro rano i zaraz potem pojedzie dalej."
    + "\n\nPozdrawiamy serdecznie", "With warm regards", "Pozdrawiamy serdecznie"];
  const tailAt = path.join(SCRATCH, "tail.txt");
  fs.writeFileSync(tailAt, TAIL.join("\n\n") + "\n", "utf8");
  const tailCard = (en, pl) => ({ title: { en: "Reply" }, category: "tail", intents: [],
    bodies: [{ lang: "en", spans: [{ text: en }] }, { lang: "pl", spans: [{ text: pl }] }] });
  const tailOut = await importText({ file: tailAt, id: "stub-tail", name: "stub tail",
    ask: async () => ({ ok: true, text: JSON.stringify({ cards: [tailCard(TAIL[0], TAIL[1]),
      tailCard(TAIL[2], TAIL[3])] }) }) });
  const tailBodies = tailOut.catalog.cards.map(c => c.body.en + "|" + c.body.pl);
  check(tailBodies.length === 2 && tailBodies[0] === TAIL[0] + "|" + TAIL[1]
        && tailBodies[1] === TAIL[2] + "|" + TAIL[3] && tailOut.report.counts.joined === 0,
    "7l  a card whose words also end the card before it stays its own card: "
    + tailBodies.length + " card(s), " + tailOut.report.counts.joined + " joined");

  /* ---- 8. THE FILING THE OWNER ALREADY HAS --------------------------------------------------
   *
   * TWO CHANGES AND ONE REFUTATION. The prompt now carries the categories and intents the project
   * already holds, because measured without them the model matched the owner's categories on 3
   * cards of 38 and their intents on none of 30 while filing 133 cards under 45 categories of its
   * own. And a category proposed for a single card is reported rather than created.
   *
   * THE REFUTATION IS IN 8f AND IT IS THE ORACLE'S. The same rule was carved for intents, and
   * this fixture has 8 intent clauses used by one card each; the real catalog behind the
   * measurement has 150 clauses over 258 cards. A request one reply answers is ordinary, so the
   * rule is a category rule only, and the leg holds it that way.
   */
  process.stdout.write("8  the filing the owner already has\n");

  check(knownBlock(null) === "" && knownBlock({ categories: [], intents: [] }) === ""
        && promptFor(false, null) === promptFor(false, { categories: [], intents: [] }),
    "8a  an empty project gets the prompt it always got, to the character: no list and no"
    + " sentence about one");

  const ownFiling = knownFiling(catalog);
  const block = knownBlock(ownFiling);
  const sent = requestText(promptFor(false, ownFiling), "BODY");
  check(ownFiling.categories.length > 0 && ownFiling.intents.length > 0
        && ownFiling.categories.every(c => sent.indexOf('"' + c.key + '"') >= 0)
        && ownFiling.intents.every(c => sent.indexOf(c) >= 0),
    "8b  the project's own " + ownFiling.categories.length + " categor(ies) and "
    + ownFiling.intents.length + " intent(s) reach the prompt whole, in " + block.length
    + " characters of prompt");

  /* THE RED AND THE GREEN, in one pair of runs over one answer. The first card is given a
     category of its own that nothing else uses; without the rule that is a 7th shelf holding one
     card, with it the card is on the general shelf and the key is in the report. */
  const ONE_OF = "a-category-only-one-card-uses";
  const loneAnswer = (() => {
    const doc = JSON.parse(cannedAnswer(flat.key, source, {}));
    doc.cards[0].category = ONE_OF;
    delete doc.cards[0].categoryLabel;
    return JSON.stringify(doc, null, 1) + "\n";
  })();
  fs.writeFileSync(answerAt, loneAnswer, "utf8");
  const lone = await importText({ file: textAt,
    ask: stubAsk(), id: "stub-lone", name: "stub lone" });
  /* A SHELF IS FOUND BY ITS LABEL AND NEVER BY ITS KEY: the id in the document is the pinned
     engine's tagId of the key, which is slugged and cut to the engine's length, so a key looked
     for among the ids is a key that is never there and a leg asserting its absence would pass
     however badly this went. The label is the key where the answer gave no label of its own. */
  const shelfKeys = t => t.filter(x => x.kind === "shelf").map(x => x.id);
  const shelfLabelled = (t, text) => t.filter(x => x.kind === "shelf"
    && Object.values(x.label || {}).some(v => String(v).trim() === text));
  check(lone.report.counts.catsSuppressed === 1
        && lone.report.filing.suppressed.length === 1
        && lone.report.filing.suppressed[0] === ONE_OF
        && shelfLabelled(lone.catalog.tags, ONE_OF).length === 0,
    "8c  a category proposed for one card is reported and not created: "
    + lone.report.counts.catsSuppressed + " suppressed, named in the report, absent from the "
    + shelfKeys(lone.catalog.tags).length + " shelves the proposal has");
  check(lone.catalog.cards[0].shelf === lone.catalog.tags
          .filter(t => t.kind === "shelf" && t.label
            && Object.values(t.label).indexOf("imported") >= 0)
          .map(t => t.id)[0]
        && lone.report.counts.cards === clean.report.counts.cards,
    "8d  and its card is on the general shelf rather than lost: " + lone.report.counts.cards
    + " cards, the same " + clean.report.counts.cards + " the unchanged answer gave");

  /* THE CONTROL. The same rule over an answer whose filing is real: 6 categories over 29 cards,
     none of them holding one card, and nothing may be suppressed. A rule that fired on anything
     weaker would empty this fixture onto one shelf. */
  fs.writeFileSync(answerAt, cannedAnswer(flat.key, source, {}), "utf8");
  const filed = await importText({ file: textAt,
    ask: stubAsk(), id: "stub-filed", name: "stub filed" });
  check(filed.report.counts.catsSuppressed === 0 && filed.report.counts.cats > 1
        && filed.report.filing.suppressed.length === 0,
    "8e  the control: over a filing that is real, " + filed.report.counts.cats
    + " categor(ies) stand and " + filed.report.counts.catsSuppressed + " are suppressed");

  /* THE REFUTATION, MEASURED RATHER THAN ARGUED. */
  const clauseUse = new Map();
  const seenCard = new Set();
  flat.key.stretches.forEach(s => {
    if (seenCard.has(s.card)) return;
    seenCard.add(s.card);
    (s.intentClauses || []).forEach(c => {
      const k = String(c).trim();
      if (k) clauseUse.set(k, (clauseUse.get(k) || 0) + 1);
    });
  });
  const lonelyClauses = Array.from(clauseUse.entries()).filter(([, n]) => n === 1).map(([c]) => c);
  const clausesKept = new Set();
  filed.catalog.tags.filter(t => t.kind === "request").forEach(t =>
    Object.values(t.clause || {}).forEach(v => clausesKept.add(String(v).trim())));
  check(lonelyClauses.length > 0 && lonelyClauses.every(c => clausesKept.has(c)),
    "8f  an intent one card answers is ordinary and is kept: all " + lonelyClauses.length
    + " clause(s) this catalog uses on a single card survive, of " + clauseUse.size);

  /* A SHELF THE PROJECT ALREADY HAS IS NOT THIS IMPORT'S TO JUDGE, however few cards land on
     it. Same answer, same lone category, but now the project has it. */
  fs.writeFileSync(answerAt, loneAnswer, "utf8");
  const owned = await importText({ file: textAt,
    ask: stubAsk(), id: "stub-owned", name: "stub owned",
    known: { categories: [{ key: ONE_OF, label: "The owner's own shelf" }], intents: [] } });
  check(owned.report.counts.catsSuppressed === 0
        && shelfLabelled(owned.catalog.tags, ONE_OF).length === 1,
    "8g  the same category is kept where the project already has it: suppressed "
    + owned.report.counts.catsSuppressed + ", and the key is among the "
    + shelfKeys(owned.catalog.tags).length + " shelves");

  if (argv.indexOf("--keep") < 0) dropScratch(SCRATCH, "import-model");
  globalThis.fetch = REAL_FETCH;
  process.stdout.write("import-model: " + asserted + " assertion(s), " + failed
    + " failure(s)\n");
  if (failed) process.exit(1);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("import-model: " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(1);
});
