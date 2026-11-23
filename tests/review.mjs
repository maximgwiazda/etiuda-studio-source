/* ONE LEG PER CLAIM THE REVIEW QUEUE MAKES THAT COULD BE WRONG. Course node 9, spec 3.3.
 *
 *     node tests/review.mjs [--keep]
 *
 * The claims, in the order the ruling of 2026-09-17 01:37 names them: a changed field is found;
 * an unchanged one is not listed; an accepted change lands in the working copy; a rejected one
 * does not; the attribution is recorded; a second review of the same file changes nothing.
 * Four more are here because they are equally capable of being wrong: a proposal that is a
 * different catalog is refused, the fields that are never a proposal are not offered although
 * they differ, a decision with nobody's name on it is refused, and a rejected field proposed
 * again with a DIFFERENT value comes back to the queue.
 *
 * THE FIXTURE IS THE GENERATOR'S, THE PROPOSAL IS THIS FILE'S. The head is a seeded pile taken
 * through the importer and published, so the document being reviewed is one Studio itself
 * wrote through the pinned engine. The agent's export is made here, by hand, doing to that
 * published file what the engine's export did before engine ecd66dd: it keeps the origin's id
 * and rev, sets `modified: true`, and recomputes the content hash last, over the finished
 * payload with the flag already in it (engine spec 5). The pinned engine's export mints a new id
 * and rev 1, so this queue reads it as a different catalog; whether an agent's export should
 * still arrive as a proposal against its own catalog is open ruling R1. Nothing in this file
 * asks the review queue whether it agrees with itself: every leg asserts against the edit that
 * was planted.
 *
 * THE DECISIONS GO THROUGH THE COMMAND LINE, not through the module, because the command line
 * is what node 9 delivers and a decisions file that parses differently from the flags is
 * exactly the sort of fault a module-level test would miss.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as Engine from "../src/engine.mjs";
import { importCsv } from "../src/import.mjs";
import { publishFull, PROJECT_FILE, DRAFT_FILE } from "../src/publish.mjs";
import { diffCatalogs, readCatalogDocument } from "../src/diff.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { reviewProposal, parseDecisions, resolveDecisions, readLog,
         REVIEW_LOG } from "../src/review.mjs";
import { copyPlants } from "./plant-copy.mjs";
import { loadPage } from "./page-stand-in.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "review-legs");
const CLOCK = "2026-09-17T09:00:00";
const WHO = "the agent at desk 4";

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
function skip(line) {
  process.stdout.write("  skip " + line + "\n");
}

function pile(name, seed, rows) {
  const out = path.join(SCRATCH, "piles", name);
  const r = spawnSync(process.execPath, ["tools/fixtures/generate.mjs", "--seed", String(seed),
    "--rows", String(rows), "--out", out], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) throw new Error("the generator refused: " + (r.stderr || r.stdout));
  return path.join(out, "macros.csv");
}

async function project(name, csv, id) {
  const dir = path.join(SCRATCH, name);
  fs.mkdirSync(dir, { recursive: true });
  const made = await importCsv({ file: csv, id, name: id });
  fs.writeFileSync(path.join(dir, DRAFT_FILE), JSON.stringify(made.catalog, null, 1) + "\n");
  fs.writeFileSync(path.join(dir, PROJECT_FILE), JSON.stringify(
    { id: made.catalog.id, rev: 0, edition: "" }, null, 1) + "\n");
  return { dir, catalog: made.catalog };
}

/** Every file under a folder with its sha256, so "nothing changed" is a claim about bytes. */
function treeFingerprint(dir) {
  const out = [];
  (function walk(at, rel) {
    fs.readdirSync(at, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
      .forEach(e => {
        const p = path.join(at, e.name), r = rel ? rel + "/" + e.name : e.name;
        if (e.isDirectory()) walk(p, r);
        else out.push(r + " " + crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex"));
      });
  })(dir, "");
  return out.join("\n");
}

const readJson = p => JSON.parse(fs.readFileSync(p, "utf8"));
const cardOf = (cat, id) => (cat.cards || []).find(c => c.id === id);
const cli = (args) => spawnSync(process.execPath, ["tools/review.mjs"].concat(args),
                                { cwd: ROOT, encoding: "utf8" });

async function main(argv) {
  const only = process.env.REVIEW_LEG || "";
  if (only === "17a" || only === "17b" || only === "17c") {
    clearScratch(SCRATCH);
    fs.mkdirSync(SCRATCH, { recursive: true });
    if (only === "17a") await keptThroughReview();
    else if (only === "17b") await warnedAboveEngine();
    else await warnedUnknownHead();
    process.stdout.write("\nreview  " + asserted + " assertion(s), " + failed + " failure(s)\n");
    if (!argv.includes("--keep")) dropScratch(SCRATCH, "review");
    process.exit(failed ? 1 : 0);
  }
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const F = await Engine.format();

  /* ---- the head: a seeded pile, imported and published ------------------------------------ */

  const csv = pile("head", 31, 40);
  const p = await project("head", csv, "desk-pile");
  const outFolder = path.join(SCRATCH, "published");
  const first = await publishFull({ project: p.dir, folder: outFolder, notes: "first",
                                    now: CLOCK });
  const head = readJson(path.join(p.dir, DRAFT_FILE));
  const published = readCatalogDocument(first.ec);

  /* ---- the agent's export, made here, in the shape of an export before ecd66dd (the head) -- */

  const ids = published.cards.map(c => c.id);
  const EDITED = ids[3], REJECTED = ids[5], MOVED = ids[7], DROPPED = ids[9];
  const shelves = published.tags.filter(t => t.kind === "shelf").map(t => t.id);
  const NEW_SHELF = shelves.find(s => s !== cardOf(published, MOVED).shelf);
  const LABELLED = shelves[0];
  const NEW_CARD = "c-agent-proposal-one";
  const ADDED_AFTER = ids[1];
  const NEW_BODY = cardOf(published, EDITED).body.en + "\nGrelira thelork ustuma widesk.";
  const NEW_TITLE_PL = "Norvira zubalt ondrek";
  const NEW_FACTS = "Tosan widil, the agent's quick facts.";
  const NEW_LABEL = "Sarnan, renamed at the desk";

  const proposal = JSON.parse(JSON.stringify(published));
  cardOf(proposal, EDITED).body.en = NEW_BODY;
  cardOf(proposal, REJECTED).title.pl = NEW_TITLE_PL;
  cardOf(proposal, MOVED).shelf = NEW_SHELF;
  proposal.cards.splice(ids.indexOf(ADDED_AFTER) + 1, 0, {
    id: NEW_CARD, shelf: NEW_SHELF,
    title: { en: "Thelork ustuma", pl: "Thelork ustuma" },
    body: { en: "Widesk dovib glemira norvil.", pl: "Widesk dovib glemira norvil." },
    bodyShape: "plain",
  });
  proposal.cards = proposal.cards.filter(c => c.id !== DROPPED);
  proposal.facts = NEW_FACTS;
  proposal.tags.find(t => t.id === LABELLED).label.en = NEW_LABEL;
  /* What the engine writes, and in the engine's order: the flag, then the hash over the
     finished payload with the flag already in it. */
  proposal.modified = true;
  delete proposal.hash; delete proposal.sig;
  proposal.hash = F.contentHash(proposal);
  const proposalAt = path.join(SCRATCH, "from-desk-4.ec");
  fs.writeFileSync(proposalAt, JSON.stringify(proposal, null, 1) + "\n", "utf8");

  const K = {
    edited: "card:" + EDITED + ":body.en",
    rejected: "card:" + REJECTED + ":title.pl",
    moved: "card:" + MOVED + ":shelf",
    added: "card+:" + NEW_CARD,
    dropped: "card-:" + DROPPED,
    header: "header:facts",
    label: "tag:" + LABELLED + ":label.en",
  };

  /* ---- 1. A CHANGED FIELD IS FOUND, and 2. AN UNCHANGED ONE IS NOT LISTED ------------------ */

  const preview = cli([p.dir, proposalAt, "--dry-run"]);
  const seen = await reviewProposal({ project: p.dir, file: proposalAt, rules: [],
                                      write: false });
  const keys = seen.changes.map(c => c.key).sort();
  const want = Object.values(K).sort();
  check(keys.join("\n") === want.join("\n"),
    "1a every one of the " + want.length + " planted edits is a row of the queue, and the queue"
    + " has no other row: " + keys.length + " key(s), " + keys.filter(k => !want.includes(k)).length
    + " unplanted");
  const edited = seen.changes.find(c => c.key === K.edited);
  check(edited && edited.from === published.cards[3].body.en && edited.to === NEW_BODY,
    "1b with the value on each side, not merely the path: the from is the published body and"
    + " the to is the edit");
  const moved = seen.changes.find(c => c.key === K.moved);
  check(moved && moved.op === "move" && moved.to === NEW_SHELF,
    "1c a card whose shelf changed is a move rather than an ordinary field change");
  check(seen.changes.filter(c => c.id === EDITED).length === 1
        && seen.changes.filter(c => c.id === REJECTED).length === 1,
    "2a a card with one edited field contributes ONE row, not a row per field it has ("
    + published.cards[3].title.en.length + " other fields on that card were equal and none is listed)");
  const untouched = ids.filter(id => ![EDITED, REJECTED, MOVED, DROPPED].includes(id));
  check(!seen.changes.some(c => untouched.includes(c.id)),
    "2b and none of the " + untouched.length + " untouched cards appears at all");

  /* ---- 3. THE FIELDS THAT ARE NEVER A PROPOSAL --------------------------------------------- */

  check(String(proposal.date) !== String(head.date) && proposal.hash !== head.hash,
    "3a the export really does differ from the working copy in date and hash (" + proposal.date
    + " against " + (head.date === undefined ? "none" : head.date) + ")");
  check(!keys.some(k => /^header:(id|rev|date|hash|sig|modified|evaluation)$/.test(k)),
    "3b and not one of them is offered for acceptance: the publisher owns rev and the edition,"
    + " the hash is derived, and the evaluation mark is a stamp");

  /* ---- the command line, as a reviewer would use it ----------------------------------------- */

  check(preview.status === 1 && preview.stdout.includes("waiting for a decision")
        && preview.stdout.includes(K.edited),
    "4a --dry-run prints the queue and exits 1, changes are waiting (" + preview.status + ")");
  check(!fs.existsSync(path.join(p.dir, REVIEW_LOG)),
    "4b and writes nothing at all: reading a queue is not a decision");

  const nameless = cli([p.dir, proposalAt, "--accept", K.edited]);
  check(nameless.status === 2 && /attributable/.test(nameless.stderr)
        && !fs.existsSync(path.join(p.dir, REVIEW_LOG)),
    "4c a decision with nobody's name on it is refused and nothing is written");

  const decisionsAt = path.join(SCRATCH, "decisions.txt");
  fs.writeFileSync(decisionsAt, [
    "# the queue of from-desk-4.ec",
    "accept " + K.edited,
    "accept " + K.moved,
    "accept card+:*            # every card the agent added",
    "accept " + K.dropped,
    "reject " + K.rejected,
    "reject " + K.header,
    "",
  ].join("\n"), "utf8");

  const run = cli([p.dir, proposalAt, "--decisions", decisionsAt, "--from", WHO,
                   "--note", "reviewed on the morning round", "--now", CLOCK]);
  check(run.status === 1 && /4 change\(s\) landed/.test(run.stdout),
    "4d the decisions file lands the four accepted changes and exits 1 for the one still"
    + " pending (" + run.status + ")");

  /* ---- 5. AN ACCEPT LANDS ------------------------------------------------------------------ */

  const after = readJson(path.join(p.dir, DRAFT_FILE));
  check(cardOf(after, EDITED).body.en === NEW_BODY,
    "5a the accepted body is in the working copy");
  check(cardOf(after, MOVED).shelf === NEW_SHELF,
    "5b the accepted move is in the working copy");
  check(cardOf(after, NEW_CARD) && !cardOf(head, NEW_CARD),
    "5c the accepted card was added, and it was not there before");
  check(after.cards[after.cards.findIndex(c => c.id === ADDED_AFTER) + 1].id === NEW_CARD,
    "5d in the place the agent put it, after " + ADDED_AFTER + ", rather than appended to the end");
  check(!cardOf(after, DROPPED) && cardOf(head, DROPPED),
    "5e the accepted removal took the card out, and it was there before");
  check(after.hash === F.contentHash(after) && after.hash !== head.hash,
    "5f and the working copy carries the ENGINE's hash of what it now holds, so the next"
    + " publish reads a file the engine's own reader calls whole");
  const lint = Engine.lint().lintCatalog(after);
  check(!lint.errors.length,
    "5g the edited working copy still lints clean by the pinned engine: " + lint.errors.length
    + " error(s)");

  /* ---- 6. A REJECT DOES NOT ---------------------------------------------------------------- */

  check(cardOf(after, REJECTED).title.pl === cardOf(head, REJECTED).title.pl
        && cardOf(after, REJECTED).title.pl !== NEW_TITLE_PL,
    "6a the rejected title is untouched in the working copy");
  check(after.facts === head.facts && after.facts !== NEW_FACTS,
    "6b and so is the rejected header field");
  const labelOf = c => c.tags.find(t => t.id === LABELLED).label.en;
  check(labelOf(after) === labelOf(head) && labelOf(after) !== NEW_LABEL,
    "6c a change nobody decided does not land either: pending is not a quiet yes");

  /* ---- 7. THE ATTRIBUTION IS RECORDED ------------------------------------------------------ */

  const log = readLog(p.dir);
  const entry = log.reviews[log.reviews.length - 1];
  check(log.reviews.length === 1 && entry.from === WHO && entry.at === CLOCK
        && entry.note === "reviewed on the morning round",
    "7a the review is recorded with whose it was and when: " + JSON.stringify(entry.from));
  check(entry.source === path.basename(proposalAt)
        && entry.sourceSha256 === crypto.createHash("sha256")
             .update(fs.readFileSync(proposalAt)).digest("hex")
        && entry.proposalHash === proposal.hash && entry.modified === true,
    "7b beside the file it came from, by sha256 and by the catalog's own hash, so the record"
    + " names one exact document rather than a filename anybody can reuse");
  check(entry.accepted.sort().join(",") === [K.edited, K.moved, K.added, K.dropped].sort().join(",")
        && entry.rejected.sort().join(",") === [K.rejected, K.header].sort().join(",")
        && entry.pending.join(",") === K.label,
    "7c with every decision named, the rejections included, which is the half a log usually"
    + " loses");
  check(log.decided.length === 6 && log.decided.every(d => d.from === WHO && d.fingerprint),
    "7d and each decision is kept with the attribution and a fingerprint of the two values it"
    + " decided between (" + log.decided.length + " decisions)");

  /* ---- 8. A SECOND REVIEW OF THE SAME FILE CHANGES NOTHING ---------------------------------- */

  const before8 = treeFingerprint(p.dir);
  const again = cli([p.dir, proposalAt, "--decisions", decisionsAt, "--from", WHO, "--now", CLOCK]);
  const after8 = treeFingerprint(p.dir);
  check(after8 === before8,
    "8a the same file reviewed a second time with the same decisions leaves the project folder"
    + " byte for byte where it was, over " + before8.split("\n").length + " file(s)");
  check(again.status === 1 && /2 decided in an earlier review/.test(again.stdout)
        && /nothing was written/.test(again.stdout),
    "8b the two rejections are remembered and not offered again, and the run says so");
  check(readLog(p.dir).reviews.length === 1,
    "8c and no second entry is written for a review that decided nothing: the log is a record"
    + " of decisions, not of who looked");

  /* ---- 9. A REJECTED FIELD PROPOSED AGAIN WITH A DIFFERENT VALUE COMES BACK ----------------- */

  const second = JSON.parse(JSON.stringify(proposal));
  cardOf(second, REJECTED).title.pl = "Norvira zubalt, a third wording";
  cardOf(second, EDITED).body.en = NEW_BODY;
  delete second.hash; second.hash = F.contentHash(second);
  const secondAt = path.join(SCRATCH, "from-desk-4-again.ec");
  fs.writeFileSync(secondAt, JSON.stringify(second, null, 1) + "\n", "utf8");
  const reopened = await reviewProposal({ project: p.dir, file: secondAt, rules: [],
                                          write: false });
  const pendingKeys = reopened.pending.map(c => c.key);
  check(pendingKeys.includes(K.rejected) && !reopened.known.some(k => k.c.key === K.rejected),
    "9a the same field with a DIFFERENT wording is asked afresh: a decision is remembered by"
    + " the pair of values it decided, not by the field it was made at");
  check(reopened.known.some(k => k.c.key === K.header),
    "9b while the rejection that is being proposed again unchanged stays decided");

  /* ---- 10. A DIFFERENT CATALOG IS A DIFFERENT KIND OF PROPOSAL (board 539) ------------------
   *
   * Until 2026-09-19 a file whose id was not this project's was refused outright, which made
   * "import this pile into the project I have open" impossible: the importer could only ever
   * make a NEW project. Maxim ruled the two acts are one, so the queue now takes such a file
   * and offers what it can honestly offer - additions and changes - and nothing else.
   *
   * THE CONTROL IS THE SAME DOCUMENT UNDER BOTH IDS. The pair below differ in one field, the
   * catalog id, and in nothing else: the same cards, the same tags, the same header. So the
   * rows that the foreign one does NOT offer are exactly the rows the filter removed, and the
   * leg is a measurement of the filter rather than of the fixture.
   */

  const foreign = JSON.parse(JSON.stringify(proposal));
  foreign.id = "some-other-pile";
  delete foreign.hash; foreign.hash = F.contentHash(foreign);
  const foreignAt = path.join(SCRATCH, "not-ours.ec");
  fs.writeFileSync(foreignAt, JSON.stringify(foreign, null, 1) + "\n", "utf8");

  /* A PROJECT OF ITS OWN, HOLDING THE HEAD AS IT WAS BEFORE ANY OF THE REVIEWS ABOVE. Sections
     4 to 9 have landed changes in p.dir, so the added card is already there and the dropped one
     is already gone; asking this section's question of that folder would compare the proposal
     against a working copy that has half of it in already, and the counts would mean nothing. */
  const dir10 = path.join(SCRATCH, "origin");
  fs.mkdirSync(dir10, { recursive: true });
  fs.writeFileSync(path.join(dir10, DRAFT_FILE),
    JSON.stringify(head, null, 1) + "\n", "utf8");
  fs.writeFileSync(path.join(dir10, PROJECT_FILE), JSON.stringify(
    { id: head.id, rev: 1, edition: "" }, null, 1) + "\n", "utf8");

  const before10 = treeFingerprint(dir10);
  const asForeign = await reviewProposal({ project: dir10, file: foreignAt, rules: [],
                                           write: false });
  const asOwn = await reviewProposal({ project: dir10, file: proposalAt, rules: [],
                                       write: false });
  check(asForeign.ok && asForeign.foreign === true
        && asForeign.foreignId === "some-other-pile",
    "10a a proposal carrying another catalog's id is no longer refused: it opens as a queue and"
    + " says which catalog it came from (" + JSON.stringify(asForeign.foreignId) + ")");

  const ops = (r) => r.changes.map(c => c.scope + ":" + c.op).sort();
  const droppedRows = asOwn.changes.filter(c =>
    !asForeign.changes.some(x => x.key === c.key));
  check(droppedRows.length === 2
        && droppedRows.some(c => c.op === "remove" && c.key === K.dropped)
        && droppedRows.some(c => c.scope === "header" && c.key === K.header),
    "10b and it offers ADDITIONS AND CHANGES ONLY: the same document under this project's own"
    + " id offers " + asOwn.changes.length + " rows and under another id " + asForeign.changes.length
    + ", the " + droppedRows.length + " missing being exactly the removal and the header row ("
    + droppedRows.map(c => c.key).join(", ") + ")");
  check(!asForeign.changes.some(c => c.op === "remove" || c.scope === "header")
        && asOwn.changes.some(c => c.op === "remove")
        && asOwn.changes.some(c => c.scope === "header"),
    "10c stated as a rule rather than as a difference of two numbers: no row of the foreign"
    + " queue is a removal or a header field, and the same file under this id has one of each ["
    + ops(asForeign).join(" ") + "]");
  check(asForeign.changes.some(c => c.key === K.added)
        && asForeign.changes.some(c => c.key === K.edited)
        && asForeign.changes.some(c => c.key === K.label),
    "10d while every addition and every change survives, the card it adds and the card and the"
    + " tag it edits among them");
  /* `.message` SINCE THE NOTES BECAME FRAMES (539's tail): a note travels as the English
     sentence and the frame it was built from, so that the queue's dashed box is Polish on a
     Polish screen. The English here is the English this leg asserted before. */
  check(asForeign.notes.map(n => n.message)
      .some(n => /different catalog/.test(n) && n.indexOf("some-other-pile") >= 0
        && n.indexOf("desk-pile") >= 0),
    "10e and the queue says so at its head, naming both catalogs rather than leaving a person"
    + " to notice: " + JSON.stringify((asForeign.notes[0] || {}).message || ""));
  check(treeFingerprint(dir10) === before10,
    "10f none of that wrote a byte: reading a queue is not a decision, whosever catalog it is");

  /* THE COMMAND LINE IS THE SAME DOOR. A screen that adopted a foreign file while
     tools/review.mjs refused it would break the one claim tests/review-screen.mjs makes. */
  const cliForeign = cli([dir10, foreignAt, "--dry-run"]);
  check(cliForeign.status === 1 && cliForeign.stdout.includes(K.added)
        && !/different catalog: it says/.test(cliForeign.stderr),
    "10g and node tools/review.mjs reads it the same way with no flag of its own, exit "
    + cliForeign.status);

  const orphan = JSON.parse(JSON.stringify(proposal));
  delete orphan.id; delete orphan.modified;
  fs.writeFileSync(path.join(SCRATCH, "no-id.ec"), JSON.stringify(orphan, null, 1) + "\n", "utf8");
  const noId = cli([p.dir, path.join(SCRATCH, "no-id.ec"), "--dry-run"]);
  check(noId.status === 2 && /does not say which catalog/.test(noId.stderr),
    "10h but a file with no id at all is still refused: the widening is about WHICH catalog a"
    + " document is, not about whether it says");

  /* A FILE THAT IS NOT A CATALOG AT ALL is refused in the page's words, with no path in them
     (polish 03, item 8); before, the reader's own English and the file's full path reached the
     Polish screen. */
  fs.writeFileSync(path.join(SCRATCH, "not-a-catalog.ec"), "Friday: ask about the glaze\n", "utf8");
  const notCat = await reviewProposal({ project: p.dir, file: path.join(SCRATCH, "not-a-catalog.ec"),
    rules: [], write: false });
  check(!notCat.ok && notCat.said && notCat.said.frame === notCat.refusal
    && /not a catalog/.test(notCat.refusal) && notCat.refusal.indexOf(SCRATCH) < 0,
    "10i a file that is not a catalog is answered with a frame the page can say: "
    + JSON.stringify(notCat.refusal));

  /* ---- 11. THE DECISION RULES THEMSELVES ---------------------------------------------------- */

  const rules = parseDecisions("reject *\naccept card:a:b   # the last word wins\n");
  const r11 = resolveDecisions(rules, ["card:a:b", "card:c:d"]);
  check(r11.get("card:a:b") === "accept" && r11.get("card:c:d") === "reject",
    "11a the last rule that matches a key decides it, so 'no to everything then yes to these'"
    + " is four lines");
  let bad = null;
  try { parseDecisions("accept x\nmaybe y\n"); } catch (e) { bad = e; }
  check(bad && /neither an accept nor a reject/.test(bad.message) && /line 2/.test(bad.message),
    "11b and a line that is neither refuses the file by number rather than being skipped");

  /* ---- 12. THE ACCEPTED CHANGES ARE IN THE NEXT PUBLISH -------------------------------------- */

  const clear = cli([p.dir, proposalAt, "--reject-all", "--from", WHO, "--now", CLOCK]);
  check(clear.status === 0 && readLog(p.dir).reviews.length === 2,
    "12a the last pending change decided leaves nothing waiting and the run exits 0 ("
    + clear.status + ")");

  const next = await publishFull({ project: p.dir, folder: outFolder, notes: "after the review",
                                   now: CLOCK });
  const out = readCatalogDocument(next.ec);
  check(next.rev === 2 && cardOf(out, EDITED).body.en === NEW_BODY
        && cardOf(out, NEW_CARD) && !cardOf(out, DROPPED)
        && cardOf(out, REJECTED).title.pl !== NEW_TITLE_PL,
    "12b the published rev " + next.rev + " carries every accepted change and not one rejected"
    + " one");
  const d = diffCatalogs(published, out, F.canonical);
  const touched = d.cards.changed.map(c => c.id).concat(d.cards.added.map(c => c.id))
    .concat(d.cards.removed.map(c => c.id)).sort();
  check(touched.join(",") === [EDITED, MOVED, NEW_CARD, DROPPED].sort().join(","),
    "12c and the diff between the two published editions names exactly the accepted changes: "
    + touched.length + " card(s)");

  await madeFromEarlier();
  await noKeyAltersTheProgram(p.dir, published);
  await deskExportIsListed(published);
  await sidecarsArePlain();
  await keptThroughReview();
  await warnedAboveEngine();
  await warnedUnknownHead();
  copyPlants({
    root: ROOT, self: fileURLToPath(import.meta.url), label: "review", onlyVar: "REVIEW_LEG",
    plants: [
      { mark: "u7-above", leg: "17b", rel: "src/studio.mjs", line: "    aboveEngine: false," },
      { mark: "u7-head", leg: "17c", rel: "src/studio.mjs", line: "    unknownHead: false," },
    ],
    check, skip,
  });

  /* ---- the tally --------------------------------------------------------------------------- */

  process.stdout.write("\nreview  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "review");
  else process.stdout.write("review  kept " + SCRATCH + "\n");
  process.exit(failed ? 1 : 0);
}

/* ---- 13. A FILE MADE FROM AN EARLIER COPY NEVER UNDOES WHAT LANDED SINCE (sense pass 3, 1) ----
 *
 * The finder's case, through Studio's own doors: a desk exports edition 1 with one card improved
 * while the author publishes edition 2 (a new card, an edit) and keeps editing. What Accept all
 * would tick is every row not decided before and not held back, which is what `tickAll` builds.
 */
async function madeFromEarlier() {
  const S = await import("../src/studio.mjs");
  const F = await Engine.format();
  const home = path.join(SCRATCH, "made-from-earlier");
  const root = path.join(home, "projects"), share = path.join(home, "share");
  fs.mkdirSync(root, { recursive: true }); fs.mkdirSync(share, { recursive: true });
  const made = await S.newProject(root, "Earlier copy", [{ code: "en", name: "English" }]);
  const dir = made.dir;
  const t0 = await S.addTag(dir, "shelf", { en: "General" });
  const shelf = (t0.tag || t0).id;
  const id = {};
  for (const w of ["Alpha", "Bravo", "Charlie", "Echo"])
    id[w] = (await S.addCard(dir, shelf, w, "The " + w.toLowerCase() + " answer, in full.")).card.id;
  const ed1 = readJson((await S.publishProject(dir, { folder: share, notes: "one" })).ec);
  const exportOf = (from, edit, asEdition) => {
    const x = JSON.parse(JSON.stringify(from));
    edit(x);
    if (asEdition) { x.rev = from.rev + 1; x.date = from.date + "a"; }
    x.modified = true;
    delete x.hash; delete x.sig; x.hash = F.contentHash(x);
    return x;
  };
  const inbox = path.join(dir, "inbox");
  fs.mkdirSync(inbox, { recursive: true });
  const drop = (name, doc) => {
    const at = path.join(inbox, name);
    fs.writeFileSync(at, JSON.stringify(doc, null, 1) + "\n", "utf8");
    return at;
  };
  const IMPROVED = "The charlie answer, improved at a desk.";
  const deskA = exportOf(ed1, x => { cardOf(x, id.Charlie).body.en = IMPROVED; }, true);
  const deskB = exportOf(ed1, x => { cardOf(x, id.Echo).title.en = "Echo, retitled"; }, false);
  const deskC = exportOf(ed1, x => { cardOf(x, id.Alpha).body.en = "Alpha, as a desk put it."; },
    false);

  const DELTA = "The delta answer, added for edition two.";
  const ALPHA = "The alpha answer, corrected by the author.";
  const BRAVO = "The bravo answer, being rewritten today.";
  id.Delta = (await S.addCard(dir, shelf, "Delta", DELTA)).card.id;
  await S.saveCard(dir, id.Alpha, { body: { en: ALPHA } });
  const ed2 = readJson((await S.publishProject(dir, { folder: share, notes: "two" })).ec);
  await S.saveCard(dir, id.Bravo, { body: { en: BRAVO } });

  /* WHAT THE SCREEN'S ACCEPT ALL TICKS, and landed the way the screen lands it. */
  const acceptAll = async (at, from) => {
    const o = await S.openProposal(dir, at, {});
    const ticks = {};
    o.changes.forEach(c => { if (!c.decided && !c.conflict) ticks[c.key] = "accept"; });
    const done = await S.decideProposal(dir, at, ticks, from, "");
    return { o, done, draft: readJson(path.join(dir, DRAFT_FILE)) };
  };
  const body = (d, k) => (cardOf(d, id[k]) || { body: {} }).body.en;

  const aAt = drop("desk-a.ec", deskA);
  const a = await acceptAll(aAt, "desk A");
  check(a.o.changes.map(c => c.key).join() === "card:" + id.Charlie + ":body.en",
    "13a a desk's export of edition 1 offers its own change and nothing the author did since:"
    + " rows " + JSON.stringify(a.o.changes.map(c => c.key)));
  check(body(a.draft, "Charlie") === IMPROVED && body(a.draft, "Alpha") === ALPHA
    && body(a.draft, "Bravo") === BRAVO && body(a.draft, "Delta") === DELTA,
    "13b and Accept all lands the desk's card while the author's edit of edition 2, the"
    + " unpublished rewrite and the new card all stay: "
    + JSON.stringify(["Alpha", "Bravo", "Delta"].map(k => body(a.draft, k))));

  const bAt = drop("desk-b.ec", deskB);
  const b = await acceptAll(bAt, "desk B");
  check(b.o.changes.map(c => c.key).join() === "card:" + id.Echo + ":title.en"
    && body(b.draft, "Charlie") === IMPROVED,
    "13c a second desk's file of the same edition does not undo the first desk's landed card:"
    + " rows " + JSON.stringify(b.o.changes.map(c => c.key)) + ", Charlie "
    + JSON.stringify(body(b.draft, "Charlie")));

  const cAt = drop("desk-c.ec", deskC);
  const KC = "card:" + id.Alpha + ":body.en";
  const c = await acceptAll(cAt, "desk C");
  const rowC = c.o.changes.find(x => x.key === KC);
  check(rowC && rowC.conflict === true && body(c.draft, "Alpha") === ALPHA
    && c.done.pending.indexOf(KC) >= 0,
    "13d a field the author also changed since is a row held back from Accept all, and the"
    + " author's text stays: " + JSON.stringify(body(c.draft, "Alpha")));
  const cFile = c.done.decidedTo || cAt;
  const star = await reviewProposal({ project: dir, file: cFile,
    rules: [{ verb: "accept", pattern: "*" }], from: "desk C", write: false });
  check(star.ok && star.pending.some(x => x.key === KC) && !star.accepted.some(x => x.key === KC),
    "13e and a wildcard accept, the command line's --accept-all, leaves it waiting too");
  const byKey = await reviewProposal({ project: dir, file: cFile,
    rules: [{ verb: "accept", pattern: KC }], from: "desk C", write: false });
  check(byKey.ok && byKey.accepted.some(x => x.key === KC),
    "13f CONTROL: accepted by its own key it still lands, so held back is not taken away");

  /* THE SAME DESK, A CURRENT COPY: made from edition 2, Alpha is not the author's any more to
     lose, so the same kind of edit is an ordinary row. */
  const deskD = exportOf(ed2, x => { cardOf(x, id.Delta).body.en = "Delta, as a desk put it."; },
    false);
  const dAt = drop("desk-d.ec", deskD);
  const d = await S.openProposal(dir, dAt, {});
  check(d.changes.length === 1 && d.changes[0].key === "card:" + id.Delta + ":body.en"
    && !d.changes[0].conflict,
    "13g CONTROL: a file of the current edition offers its change as an ordinary row, and"
    + " the unpublished Bravo rewrite is still not offered back: "
    + JSON.stringify(d.changes.map(x => x.key + (x.conflict ? " held" : ""))));

  /* AN EDITION PUBLISHED AFTER THE QUEUE HAS READ THE ARCHIVE is read too: the archive's listing
     is kept between reviews, and a stale one would read this file against edition 2, where
     Bravo still had the words the author has since published, and hold the row. */
  const ed3 = readJson((await S.publishProject(dir, { folder: share, notes: "three" })).ec);
  const deskE = exportOf(ed3, x => { cardOf(x, id.Bravo).body.en = "Bravo, as a desk put it."; },
    false);
  const e = await S.openProposal(dir, drop("desk-e.ec", deskE), {});
  check(e.changes.length === 1 && e.changes[0].key === "card:" + id.Bravo + ":body.en"
    && !e.changes[0].conflict,
    "13j a file of an edition published after the archive was last read is read against it: "
    + JSON.stringify(e.changes.map(x => x.key + (x.conflict ? " held" : ""))));

  /* A SHEET IMPORTED AGAIN: the earlier import of the same file is what the new one is read
     against. */
  const sheet = (b) => "Title,Body,Category\r\n"
    + "Refund late,\"Your refund is on its way, it takes five days.\",Payments\r\n"
    + "Refund card,\"" + b + "\",Payments\r\n";
  const v1 = path.join(home, "v1", "helpdesk.csv"), v2 = path.join(home, "v2", "helpdesk.csv");
  fs.mkdirSync(path.dirname(v1), { recursive: true });
  fs.mkdirSync(path.dirname(v2), { recursive: true });
  fs.writeFileSync(v1, sheet("A card refund takes three days."), "utf8");
  fs.writeFileSync(v2, sheet("A card refund takes three to five days."), "utf8");
  const into = await S.newProject(root, "Sheet home", [{ code: "en", name: "English" }]);
  const first = await S.importLand(root, v1, {}, into.dir);
  const firstOpen = await S.openProposal(into.dir, first.file, {});
  const all1 = {};
  firstOpen.changes.forEach(x => { all1[x.key] = "accept"; });
  await S.decideProposal(into.dir, first.file, all1, "helpdesk.csv", "");
  const sheetDraft = () => readJson(path.join(into.dir, DRAFT_FILE));
  const late = sheetDraft().cards.find(x => /late/i.test(x.title.en)).id;
  const LATE = "Your refund is on its way; banks take up to five working days.";
  await S.saveCard(into.dir, late, { body: { en: LATE } });
  const second = await S.importLand(root, v2, {}, into.dir);
  const secondOpen = await S.openProposal(into.dir, second.file, {});
  check(secondOpen.changes.length === 1 && /card/.test(secondOpen.changes[0].id)
    && !secondOpen.changes.some(x => x.id === late),
    "13h a sheet imported again offers the row the sheet changed and not the author's edit"
    + " made since the first import: " + JSON.stringify(secondOpen.changes.map(x => x.key)));

  /* NOTHING TO READ IT AGAINST: a project born from the sheet has no earlier import of it, so a
     row meeting a card here cannot be told from a change made here, and Accept all leaves it. */
  const born = await S.importLand(root, v1, {}, null);
  const bornLate = readJson(path.join(born.dir, born.project.draft)).cards
    .find(x => /late/i.test(x.title.en)).id;
  await S.saveCard(born.dir, bornLate, { body: { en: LATE } });
  const again = await S.importLand(root, v2, {}, born.dir);
  const againOpen = await S.openProposal(born.dir, again.file, {});
  const lateRow = againOpen.changes.find(x => x.id === bornLate);
  check(lateRow && lateRow.conflict === true
    && againOpen.notes.some(n => /made from/.test(n.message || "")),
    "13i with nothing to read it against, the row that would undo the author's edit is held"
    + " back and the queue says why: " + JSON.stringify(againOpen.changes.map(x => x.key
      + (x.conflict ? " held" : ""))));
}

/* ---- 14. NO FILE FROM A SHARE ALTERS THE PROGRAM'S OBJECTS (sense pass 3, item 7) ----------
 *
 * A card carrying its own `__proto__` key made a row keyed `__proto__.<k>`, and accepting it
 * wrote onto Object.prototype. The files are written as text, because a JavaScript literal with
 * `__proto__` in it sets a prototype rather than making the key the file carries.
 */
async function noKeyAltersTheProgram(dir, published) {
  const { setPath } = await import("../src/review.mjs");
  const { paths } = await import("../src/diff.mjs");
  const cardId = published.cards[0].id;
  const planted = (key) => {
    const text = JSON.stringify(published, null, 1).replace('"id": "' + cardId + '",',
      '"id": "' + cardId + '", "' + key + '": { "polluted": "yes", "prototype": { "polluted": "yes" } },');
    const at = path.join(SCRATCH, "planted-" + key.replace(/_/g, "") + ".ec");
    fs.writeFileSync(at, text, "utf8");
    return at;
  };
  const clean = () => {
    delete Object.prototype.polluted;
    delete Object.polluted; delete Object.prototype.constructor.polluted;
  };
  for (const key of ["__proto__", "constructor"]) {
    const at = planted(key);
    check(fs.readFileSync(at, "utf8").indexOf('"' + key + '": { "polluted"') > 0,
      "14" + (key === "__proto__" ? "a" : "c") + " CONTROL: the planted file carries its own "
      + key + " key");
    let r = null, threw = null;
    try {
      r = await reviewProposal({ project: dir, file: at,
        rules: [{ verb: "accept", pattern: "*" }], from: WHO, write: false });
    } catch (e) { threw = e; }
    const leaked = ({}).polluted !== undefined || Object.polluted !== undefined;
    clean();
    check(!threw && r && !r.ok && r.said && /key/.test(r.refusal) && r.refusal.indexOf(key) >= 0
      && !leaked,
      "14" + (key === "__proto__" ? "b" : "d") + " a file whose card carries " + key
      + " is refused by name and the program's objects are untouched: "
      + JSON.stringify(threw ? threw.message : r && r.refusal) + (leaked ? ", LEAKED" : ""));
  }
  const target = {};
  let refused = null;
  try { setPath(target, "__proto__.polluted", "yes"); } catch (e) { refused = e; }
  const leaked = ({}).polluted !== undefined;
  clean();
  const own = JSON.parse('{"a": 1, "__proto__": {"polluted": "yes"}}');
  check(refused && !leaked && paths({ a: 2 }, own, "", []).every(f => !/__proto__/.test(f.path)),
    "14e behind the door as well: setPath refuses a __proto__ step and paths() never walks one");
}

/* ---- 15. A DESK'S OWN EXPORT IS A PROPOSAL (sense pass 3, item 3) ----------------------------
 *
 * The desk's Export wrote `<slug>.js`, the catalog behind `window.E_CATALOG =` under a comment
 * header, and the inbox listed `.ec` and `.json` alone: the file an agent dropped in was never
 * seen. The export is built here as the engine's exportCatalog built it before 162f8dd, which
 * saves an `.ec`, and ecd66dd, which mints a new id and rev 1: the pinned engine's export is
 * read as a different catalog, and whether it should be is open ruling R1.
 */
async function deskExportIsListed(published) {
  const { listProposals, INBOX } = await import("../src/studio.mjs");
  const F = await Engine.format();
  const dir = path.join(SCRATCH, "js-inbox");
  fs.mkdirSync(path.join(dir, INBOX), { recursive: true });
  fs.writeFileSync(path.join(dir, DRAFT_FILE), JSON.stringify(published, null, 1) + "\n");
  fs.writeFileSync(path.join(dir, PROJECT_FILE), JSON.stringify({ id: published.id,
    name: published.name, rev: published.rev, edition: "" }, null, 1) + "\n");
  const desk = JSON.parse(JSON.stringify(published));
  desk.cards[2].body.en += " Ustuma widesk, at the desk.";
  desk.modified = true;
  delete desk.hash; delete desk.sig; desk.hash = F.contentHash(desk);
  const js = "/* Etiuda catalog - " + desk.name + "\n   To load it: Library > Import catalog. */\n"
    + "window.E_CATALOG = " + JSON.stringify(desk, null, 1) + ";\n";
  fs.writeFileSync(path.join(dir, INBOX, "desk-pile.js"), js, "utf8");
  fs.writeFileSync(path.join(dir, INBOX, "desk-pile.txt"), js, "utf8");
  const listed = (await listProposals(dir)).proposals;
  const js1 = listed.filter(x => x.name === "desk-pile.js");
  check(js1.length === 1 && js1[0].ok && js1[0].changes === 1,
    "15a a desk's export, desk-pile.js, is listed once and read as one change: "
    + JSON.stringify(listed.map(x => [x.name, x.ok, x.changes])));
  check(!listed.some(x => x.name === "desk-pile.txt"),
    "15b CONTROL: the same bytes under .txt are not a proposal");
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("review  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});

/* ---- 16. A FILE BESIDE A PROPOSAL IS READ AS PLAIN DATA OR NOT AT ALL (board 858, P6) ----------
 *
 * The inbox is a folder desks write into, and src/plain-json.mjs says a file from a share is read
 * as plain data or refused. The marks and the import report beside a proposal were read by a bare
 * JSON.parse. A missing or unreadable sidecar is the ordinary case and reads as none, so a hostile
 * one must read as none too. The control is the same sidecar without the hostile key. */
async function sidecarsArePlain() {
  const R = await import("../src/review.mjs");
  const { REPORT_KIND } = await import("../src/import-text.mjs");
  const home = path.join(SCRATCH, "sidecars");
  fs.mkdirSync(home, { recursive: true });
  const proposal = path.join(home, "pasted.ec");
  fs.writeFileSync(proposal, "{}", "utf8");
  const doc = { kind: REPORT_KIND, source: "replies.txt",
    marks: [{ card: "c-1", lang: "en", marks: [{ at: 0, len: 3, was: "Hey", kind: "reword" }] }] };
  const sidecar = (extra) => fs.writeFileSync(R.besideOf(proposal),
    JSON.stringify(doc).replace(/^\{/, "{" + extra), "utf8");
  sidecar("");
  const plainMarks = R.marksBeside(proposal), plainFrom = R.importedAs(proposal);
  check(!!plainMarks && plainMarks.cards.has("c-1") && plainFrom === "replies.txt",
    "16a CONTROL: a plain sidecar gives its marks and the file it was imported from");
  sidecar("\"__proto__\":{\"x\":1},");
  const hostileMarks = R.marksBeside(proposal), hostileFrom = R.importedAs(proposal);
  check(hostileMarks === null && hostileFrom === null,
    "16b a sidecar carrying a __proto__ key reads as none, marks and source alike: "
    + JSON.stringify([!!hostileMarks, hostileFrom]));
}

/* ---- 17. AN UNKNOWN FIELD STAYS IN THE PROPOSAL FILE, AND THE LEAD IS TOLD ONCE ---------------
 *
 * A field the pinned engine does not name, and this queue does not offer, is still the desk's.
 * It is not written onto the draft: the lead never reviewed it, so the next edition must not
 * carry it. Rejecting a row and then accepting one leaves the draft without it, and the
 * archived proposal is the file that arrived, byte for byte. The screen asks once before that
 * archive when the file holds such a field, and does not ask when it holds none. A higher
 * minEngine asks as well, and where both apply the screen says so once.
 *
 * KEPT is one value whose bytes a trim, a dropped key or a reordered object would change.
 * The draft's own older note is a field the proposal does not carry, and it stays.
 */

const KEPT = { "note": "kept  whole\nline", "order": ["\u00e9", "b"], "n": 2, "flag": false, "nest": { "z": 1, "a": null } };
const SPARE = "kept  whole\nline";
const OLDER = { "kept": "on the draft" };
const FACTS = "A fact the lead has not accepted.";
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);

async function bornDesk(S, F, root, name) {
  const made = await S.newProject(root, name, [{ code: "en" }, { code: "pl" }]);
  const tag = await S.addTag(made.dir, "shelf", { en: "Hours", pl: "Godziny" });
  await S.addCard(made.dir, tag.tag.id, "Opening", "We open at nine.");
  const draft = readJson(path.join(made.dir, DRAFT_FILE));
  draft.olderNote = OLDER;
  delete draft.hash; delete draft.sig;
  draft.hash = F.contentHash(draft);
  fs.writeFileSync(path.join(made.dir, DRAFT_FILE), JSON.stringify(draft, null, 1) + "\n", "utf8");
  return { dir: made.dir, draft };
}

function writeProposal(F, born, minEngine, changeBody, unknown) {
  const proposal = JSON.parse(JSON.stringify(born.draft));
  delete proposal.olderNote;
  if (unknown) {
    proposal.lane = JSON.parse(JSON.stringify(KEPT));
    proposal.spare = SPARE;
  }
  proposal.modified = true;
  if (minEngine != null) proposal.minEngine = minEngine;
  if (changeBody) {
    const lang = proposal.langs[0].code;
    proposal.cards[0].body[lang] = proposal.cards[0].body[lang] + "\nOne more line from the desk.";
    proposal.facts = FACTS;
  }
  delete proposal.hash; delete proposal.sig;
  proposal.hash = F.contentHash(proposal);
  const inbox = path.join(born.dir, "inbox");
  fs.mkdirSync(inbox, { recursive: true });
  const file = path.join(inbox, "desk.ec");
  fs.writeFileSync(file, JSON.stringify(proposal, null, 1) + "\n", "utf8");
  return file;
}

async function keptThroughReview() {
  try {
    const S = await import("../src/studio.mjs");
    const F = await Engine.format();
    const root = path.join(SCRATCH, "kept");
    fs.mkdirSync(root, { recursive: true });
    const born = await bornDesk(S, F, root, "Lane");
    const file = writeProposal(F, born, null, true, true);
    const original = fs.readFileSync(file);
    const draftAt = path.join(born.dir, DRAFT_FILE);
    const before = fs.readFileSync(draftAt);
    const look = await reviewProposal({ project: born.dir, file, rules: [], write: false });
    const untouched = fs.readFileSync(draftAt).equals(before);
    const body = look.ok ? look.changes.find((c) => c.scope === "card" && String(c.path || "").indexOf("body") === 0) : null;
    const facts = look.ok ? look.changes.find((c) => c.key === "header:facts") : null;
    const offered = look.ok ? look.changes.map((c) => c.key) : [];
    check(look.ok && untouched && body && facts
      && offered.every((k) => k.indexOf("lane") < 0 && k.indexOf("spare") < 0 && k.indexOf("olderNote") < 0),
      "17a reading the queue writes nothing, and an unknown field is not a row: "
      + (look.ok ? offered.join(",") : look.refusal));
    if (!look.ok || !body || !facts) return;
    const rejected = await S.decideProposal(born.dir, file, { [body.key]: "reject" }, WHO, "");
    const mid = readJson(draftAt);
    check(rejected.ok && !rejected.decidedTo && rejected.pending.indexOf(facts.key) >= 0
      && mid.lane === undefined && mid.spare === undefined && sameJson(mid.olderNote, OLDER),
      "17a rejecting a row leaves the unknown field off the draft: "
      + JSON.stringify({ ok: rejected.ok, to: rejected.decidedTo || null, pending: rejected.pending, lane: mid.lane, spare: mid.spare }));
    const accepted = await S.decideProposal(born.dir, file, { [facts.key]: "accept" }, WHO, "");
    const after = readJson(draftAt);
    const archived = accepted.decidedTo ? fs.readFileSync(accepted.decidedTo) : null;
    const sameBytes = !!(archived && archived.equals(original));
    check(accepted.ok && !!accepted.decidedTo && accepted.pending.length === 0
      && after.lane === undefined && after.spare === undefined && sameJson(after.olderNote, OLDER)
      && after.facts === FACTS && sameBytes,
      "17a rejected and then accepted, the draft has no unknown field and the archived proposal is the original byte for byte: "
      + JSON.stringify({ ok: accepted.ok, to: accepted.decidedTo || null, lane: after.lane, spare: after.spare, facts: after.facts, bytes: sameBytes }));
  } catch (e) {
    check(false, "17a " + (e && e.stack ? e.stack : e));
  }
}

const ASKS = "This proposal asks for Etiuda";
const ASKS_PL = "Ta propozycja wymaga Etiudy";
const HOLDS = "This proposal holds things this Studio cannot show";
const HOLDS_PL = "Ta propozycja zawiera coś, czego to Studio nie potrafi pokazać";
/* THE ONE SENTENCE BEFORE AN ARCHIVE (rvAboveText), read on the page stand-in in either language. Since board 1016 item 7 the
   question is asked by the stack's Apply alone, once per file it would archive, and tests/review-door.mjs rd48 holds the asking:
   once, Cancel keeping the rows, Archive anyway going on. What is left here is what the sentence says. */
function aboveSaid(open, uiLang) {
  const home = loadPage({ api: {}, uiLang: uiLang || "en" });
  return String(home.page.__get("rvAboveText")(open) || "");
}

/* A version above whatever engine is pinned: a fixed literal is reached once the pin moves (2.1.0, at the stage 3 pin). */
const ABOVE_PIN = () => { const v = String(Engine.engineVersion()).split(".").map(n => parseInt(n, 10) || 0); return (v[0] + 1) + ".0.0"; };

async function warnedAboveEngine() {
  try {
    const S = await import("../src/studio.mjs");
    const F = await Engine.format();
    const root = path.join(SCRATCH, "above");
    fs.mkdirSync(root, { recursive: true });
    const high = await bornDesk(S, F, root, "High");
    const equal = await bornDesk(S, F, root, "Equal");
    const lower = await bornDesk(S, F, root, "Lower");
    const waiting = await bornDesk(S, F, root, "Waiting");
    const highFile = writeProposal(F, high, ABOVE_PIN(), false);
    const equalFile = writeProposal(F, equal, equal.draft.minEngine, false);
    const lowerFile = writeProposal(F, lower, "1.0.0", false);
    const waitingFile = writeProposal(F, waiting, ABOVE_PIN(), true);
    const ho = await S.openProposal(high.dir, highFile, {});
    const eo = await S.openProposal(equal.dir, equalFile, {});
    const lo = await S.openProposal(lower.dir, lowerFile, {});
    const wo = await S.openProposal(waiting.dir, waitingFile, {});
    check(ho.ok === true && ho.aboveEngine === true && eo.ok === true && eo.aboveEngine === false
      && lo.ok === true && lo.aboveEngine === false && wo.ok === true && wo.aboveEngine === true
      && (ho.changes || []).length >= 1 && (wo.changes || []).length >= 2 && (eo.changes || []).length === 0,
      "17b a higher minEngine is above this Studio, and an equal or lower one is not: "
      + JSON.stringify({
        high: ho.aboveEngine, equal: eo.aboveEngine, lower: lo.aboveEngine, waiting: wo.aboveEngine,
        n: [ho, eo, lo, wo].map((o) => (o.changes || []).length),
        refusal: [ho, eo, lo, wo].map((o) => o.refusal || null),
      }));

    /* MOVED WITH BOARD 1016 ITEM 7, old and then new: "the first land of a higher minEngine asks once, Cancel asks again, and
       Archive anyway goes on" and "an equal minEngine, a lower one, and a higher one that still has a row waiting are not
       asked" pressed the table's Land, which is gone: the stack's Apply asks, rd48, and the flags it asks on are the line
       above. What the question says stays here. */
    const en = aboveSaid(ho, "en");
    check(en.indexOf(ASKS) >= 0 && en.indexOf(ABOVE_PIN() + " or newer") >= 0 && en.indexOf(HOLDS) < 0,
      "17b the question for a higher minEngine names the version it asks for: " + JSON.stringify(en.slice(0, 90)));
    const polish = aboveSaid(ho, "pl");
    check(polish.indexOf(ASKS_PL) >= 0 && polish.indexOf(ABOVE_PIN() + " lub nowszej") >= 0,
      "17b in Polish the same warning is the Polish sentence: " + (polish.indexOf(ASKS_PL) >= 0));
  } catch (e) {
    check(false, "17b " + (e && e.stack ? e.stack : e));
  }
}

/* An unknown field asks once before the archive, whatever minEngine. A proposal with none does
 * not. Where a higher minEngine applies as well, one warning is said, not two. */
async function warnedUnknownHead() {
  try {
    const S = await import("../src/studio.mjs");
    const F = await Engine.format();
    const root = path.join(SCRATCH, "unknown-warn");
    fs.mkdirSync(root, { recursive: true });
    const held = await bornDesk(S, F, root, "Held");
    const none = await bornDesk(S, F, root, "None");
    const both = await bornDesk(S, F, root, "Both");
    const waiting = await bornDesk(S, F, root, "Wait");
    const heldFile = writeProposal(F, held, null, false, true);
    const noneFile = writeProposal(F, none, null, false, false);
    const bothFile = writeProposal(F, both, ABOVE_PIN(), false, true);
    const waitFile = writeProposal(F, waiting, null, true, true);
    const ho = await S.openProposal(held.dir, heldFile, {});
    const no = await S.openProposal(none.dir, noneFile, {});
    const bo = await S.openProposal(both.dir, bothFile, {});
    const wo = await S.openProposal(waiting.dir, waitFile, {});
    check(ho.ok === true && ho.unknownHead === true && ho.aboveEngine === false
      && no.ok === true && no.unknownHead === false && (no.changes || []).length === 0
      && bo.ok === true && bo.unknownHead === true && bo.aboveEngine === true
      && wo.ok === true && wo.unknownHead === true && (wo.changes || []).length >= 2,
      "17c a proposal with an unknown field is marked, and one with none is not: "
      + JSON.stringify({
        held: ho.unknownHead, none: no.unknownHead, both: bo.unknownHead, waiting: wo.unknownHead,
        above: [ho.aboveEngine, bo.aboveEngine],
        n: [ho, no, bo, wo].map((o) => (o.changes || []).length),
      }));

    /* MOVED WITH BOARD 1016 ITEM 7, old and then new: "an unknown field asks once, Cancel asks again, and Archive anyway goes
       on", "a proposal with no unknown field is not asked" and "an unknown field with a row still waiting is not asked"
       pressed the table's Land: the stack's Apply asks, rd48. What the question says stays here. */
    const held1 = aboveSaid(ho, "en"), both1 = aboveSaid(bo, "en");
    check(held1.indexOf(HOLDS) >= 0 && held1.indexOf(ASKS) < 0,
      "17c the question for an unknown field says what this Studio cannot show: " + JSON.stringify(held1));
    check(both1.indexOf(ASKS) >= 0 && both1.indexOf(HOLDS) < 0,
      "17c where a higher minEngine and an unknown field both apply, the warning is said once: " + JSON.stringify(both1.slice(0, 60)));
    const polish = aboveSaid(ho, "pl");
    check(polish.indexOf(HOLDS_PL) >= 0, "17c in Polish the same warning is the Polish sentence: " + (polish.indexOf(HOLDS_PL) >= 0));
  } catch (e) {
    check(false, "17c " + (e && e.stack ? e.stack : e));
  }
}
