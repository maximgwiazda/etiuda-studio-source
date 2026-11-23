/* WHO ACCEPTED EACH CARD, AND WHEN. Board item 606, spec 3.3 and 3.2.
 *
 *     node tests/acceptance.mjs [--keep]
 *
 * Maxim ruled on 2026-09-19 21:37 that the audit pack is for an internal quality manager and
 * must prove that every card was approved before publication, so the review queue records who
 * accepted each proposal and when; the person is the operating system's account and the record
 * states plainly that the name is unverified. This gate holds the two halves of that: the stamp
 * on the decision, and the record the archive keeps beside the catalog.
 *
 * THE CLOCK IS THE REAL ONE HERE, WHICH IS UNUSUAL IN THIS SUITE. Every other gate passes
 * `--now` so that two publishes of one project give the same bytes; this one takes the wall
 * clock either side of the decision and asserts the stamp falls between them, because a
 * timestamp fixed by the caller cannot show that the program reads a clock at all.
 *
 * THE CONTROL IS A PROJECT WHOSE LOG HAS LOST ITS STAMPS. After the decision the project folder
 * is copied and `by` is deleted from every entry of the copy's review log, which is exactly what
 * a Studio built before this item wrote. Both copies are then published by the real publisher,
 * and the leg that reads the account back is required to HOLD on the first and to FAIL on the
 * second while everything else about the record - the two card ids, the keys, the timestamps -
 * still holds. A record that carried a name it had invented, or a leg that looked at the key
 * rather than at the value, passes one arm and neither passes the pair. A mutant of the source
 * would be stronger still and costs a copy of the whole tree, since src/*.mjs resolve the
 * pinned engine relative to themselves; this mutates the one input the stamp travels in.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { importCsv } from "../src/import.mjs";
import { publishFull, PROJECT_FILE, DRAFT_FILE, ARCHIVE,
         ACCEPTANCES_IN_ARCHIVE } from "../src/publish.mjs";
import { reviewProposal, readLog, keyFor, parseKey, REVIEW_LOG } from "../src/review.mjs";
import { saveCard, openProposal, decideProposal, INBOX } from "../src/studio.mjs";
import * as Engine from "../src/engine.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "acceptance-legs");
const CLOCK = "2026-09-20T09:00:00";
const WHO = "the agent at desk 9";

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

const readJson = p => JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, ""));
const cardOf = (cat, id) => (cat.cards || []).find(c => c.id === id);

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

function copyTree(from, to) {
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from, { withFileTypes: true }).forEach(e => {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copyTree(a, b); else fs.copyFileSync(a, b);
  });
}

const cli = args => spawnSync(process.execPath, ["tools/review.mjs"].concat(args),
                              { cwd: ROOT, encoding: "utf8" });

/** The one assertion the control has to break: every acceptance names the account. */
function everyAcceptanceNamesTheAccount(record, account) {
  const rows = (record.cards || []).reduce((a, c) => a.concat(c.accepted || []), [])
    .concat(record.other || []);
  return rows.length > 0 && rows.every(r => r.by === account);
}

async function main(argv) {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const F = await Engine.format();
  const ACCOUNT = String(os.userInfo().username);

  /* ---- the head, published once so the archive has something to compare against ----------- */

  const csv = pile("head", 41, 14);
  const p = await project("head", csv, "acc-pile");
  const outFolder = path.join(SCRATCH, "published");
  const first = await publishFull({ project: p.dir, folder: outFolder, notes: "the first",
                                    now: CLOCK });
  const published = readJson(first.ec);
  const ids = published.cards.map(c => c.id);
  const TAKEN_A = ids[2], TAKEN_B = ids[4], REFUSED = ids[6], TYPED = ids[8];

  /* ---- the agent's export: three cards edited, of which two will be accepted -------------- */

  const proposal = JSON.parse(JSON.stringify(published));
  cardOf(proposal, TAKEN_A).body.en += "\nGrelira thelork ustuma widesk.";
  cardOf(proposal, TAKEN_B).body.en += "\nNorvira zubalt ondrek glemira.";
  cardOf(proposal, REFUSED).body.en += "\nDovib sarnan renvik ustuma.";
  proposal.modified = true;
  delete proposal.hash; delete proposal.sig;
  proposal.hash = F.contentHash(proposal);
  const proposalAt = path.join(SCRATCH, "from-desk-9.ec");
  fs.writeFileSync(proposalAt, JSON.stringify(proposal, null, 1) + "\n", "utf8");

  const K = {
    a: "card:" + TAKEN_A + ":body.en",
    b: "card:" + TAKEN_B + ":body.en",
    refused: "card:" + REFUSED + ":body.en",
  };

  /* ---- 1. THE STAMP ON THE DECISION -------------------------------------------------------- */

  const t0 = Date.now();
  const run = cli([p.dir, proposalAt, "--from", WHO, "--accept", K.a, "--accept", K.b,
                   "--reject", K.refused]);
  const t1 = Date.now();
  check(run.status === 0, "0a the command line decided all three, exit " + run.status
    + (run.status > 1 ? ": " + run.stderr : ""));

  const log = readLog(p.dir);
  const entry = log.reviews[log.reviews.length - 1];
  const within = s => {
    const t = Date.parse(String(s));
    /* A second either side: the file system's clock and this process's are the same clock, but
       an ISO string is whole milliseconds and t0 is read before the child process starts. */
    return Number.isFinite(t) && t >= t0 - 1000 && t <= t1 + 1000;
  };
  check(entry && entry.by === ACCOUNT && within(entry.at),
    "1a the review is stamped with the operating system's account and a clock reading between"
    + " the two this gate took: by " + JSON.stringify(entry && entry.by) + " against "
    + JSON.stringify(ACCOUNT) + ", at " + JSON.stringify(entry && entry.at) + " within ["
    + new Date(t0).toISOString() + ", " + new Date(t1).toISOString() + "]");
  check(entry && entry.from === WHO && entry.by !== entry.from,
    "1b and it is a different thing from the attribution: whose proposal it was is "
    + JSON.stringify(entry && entry.from) + ", who decided it is " + JSON.stringify(ACCOUNT));
  check(log.decided.length === 3
        && log.decided.every(d => d.by === ACCOUNT && within(d.at))
        && log.decided.filter(d => d.decision === "accept").length === 2,
    "1c and each of the " + log.decided.length + " decisions carries it where the decision is"
    + " remembered, the rejection included, with its own timestamp");

  /* ---- 2. THE ARCHIVE CARRIES THE RECORD --------------------------------------------------- */

  const mutant = path.join(SCRATCH, "mutant");
  copyTree(p.dir, mutant);
  const mutLog = readJson(path.join(mutant, REVIEW_LOG));
  mutLog.reviews.forEach(r => { delete r.by; });
  (mutLog.decided || []).forEach(d => { delete d.by; });
  fs.writeFileSync(path.join(mutant, REVIEW_LOG), JSON.stringify(mutLog, null, 1) + "\n", "utf8");

  const second = await publishFull({ project: p.dir, folder: outFolder, notes: "after the review",
                                     now: CLOCK });
  const mutSecond = await publishFull({ project: mutant, folder: path.join(mutant, "out"),
                                        notes: "after the review", now: CLOCK });
  const recAt = path.join(second.archive, ACCEPTANCES_IN_ARCHIVE);
  check(fs.existsSync(recAt),
    "2a the archived edition " + second.edition + " holds " + ACCEPTANCES_IN_ARCHIVE
    + " beside its catalog");
  const rec = fs.existsSync(recAt) ? readJson(recAt) : { cards: [] };
  const text = fs.existsSync(recAt) ? fs.readFileSync(recAt, "utf8") : "";
  const rowsFor = id => ((rec.cards || []).find(c => c.id === id) || {}).accepted || [];
  check(rec.kind === "etiuda-studio-acceptance-record" && rec.edition === second.edition
        && rec.rev === second.rev && rec.previous === first.edition,
    "2b naming the edition it belongs to and the one before it: " + JSON.stringify(rec.edition)
    + " after " + JSON.stringify(rec.previous) + ", rev " + rec.rev);
  check(rec.person && rec.person.verified === false
        && /not verified/.test(String(rec.person.statement || ""))
        && text.split("not verified").length - 1 === 1,
    "2c with the unverified statement written into the file once (" +
    (text.split("not verified").length - 1) + " occurrence(s))");
  check(rowsFor(TAKEN_A).length === 1 && rowsFor(TAKEN_B).length === 1
        && rowsFor(TAKEN_A)[0].key === K.a && rowsFor(TAKEN_B)[0].key === K.b,
    "2d each accepted card carries its acceptance, by the key the queue printed");
  check(everyAcceptanceNamesTheAccount(rec, ACCOUNT)
        && rowsFor(TAKEN_A).every(r => within(r.at)) && rowsFor(TAKEN_B).every(r => within(r.at)),
    "2e and each names the account " + JSON.stringify(ACCOUNT) + " and a time between this"
    + " gate's two readings of the clock");
  check(!text.includes(REFUSED) && !rec.changedWithoutAcceptance.includes(REFUSED),
    "2f while the card whose change was rejected appears nowhere in the record at all, by a"
    + " search of the whole file for " + JSON.stringify(REFUSED));
  check(rec.counts && rec.counts.acceptedDecisions === 2 && rec.counts.acceptedCards === 2
        && rec.counts.changedCards === 2 && rec.counts.changedWithoutAcceptance === 0,
    "2g and the counts say so: " + JSON.stringify(rec.counts));

  /* The control: the same publish of the same project with the stamps taken out of the log. */
  const mutRec = readJson(path.join(mutSecond.archive, ACCEPTANCES_IN_ARCHIVE));
  const mutRows = id => ((mutRec.cards || []).find(c => c.id === id) || {}).accepted || [];
  check(!everyAcceptanceNamesTheAccount(mutRec, ACCOUNT)
        && mutRows(TAKEN_A).length === 1 && mutRows(TAKEN_B).length === 1
        && mutRows(TAKEN_A)[0].key === K.a && mutRows(TAKEN_A)[0].by === null
        && mutRows(TAKEN_A).every(r => within(r.at)),
    "2h THE CONTROL: with `by` deleted from the copy's review log, the same publisher writes the"
    + " same two cards with the same keys and the same timestamps and the account reads "
    + JSON.stringify(mutRows(TAKEN_A)[0] ? mutRows(TAKEN_A)[0].by : "no row")
    + ", so 2e fails on this arm and holds on the other: the leg is on the value");

  /* ---- 3. A CARD EDITED IN THE AUTHORING SCREEN, NEVER THROUGH THE QUEUE -------------------- */

  await saveCard(p.dir, TYPED, { body: { en: cardOf(readJson(path.join(p.dir, DRAFT_FILE)), TYPED)
    .body.en + "\nWidesk glemira ondrek sarnan." } });
  const third = await publishFull({ project: p.dir, folder: outFolder, notes: "typed in",
                                    now: CLOCK });
  const rec3 = readJson(path.join(third.archive, ACCEPTANCES_IN_ARCHIVE));
  const text3 = fs.readFileSync(path.join(third.archive, ACCEPTANCES_IN_ARCHIVE), "utf8");
  check(rec3.counts.acceptedDecisions === 0 && !(rec3.cards || []).length,
    "3a a card edited in the authoring program and published carries no acceptance: "
    + rec3.counts.acceptedDecisions + " acceptance(s) in " + third.edition);
  check(rec3.changedCards.join(",") === TYPED
        && rec3.changedWithoutAcceptance.join(",") === TYPED,
    "3b and the record says what did happen instead: the card changed in this edition and no"
    + " decision stands behind it (" + JSON.stringify(rec3.changedWithoutAcceptance) + ")");
  check(!/"by"\s*:\s*"/.test(text3),
    "3c so no name is written against it: a direct edit is recorded honestly rather than as an"
    + " acceptance by whoever happened to be publishing");
  check(rec3.window.reviews === 0 && !text3.includes(TAKEN_A) && !text3.includes(TAKEN_B),
    "3d and the acceptances of the previous edition are not counted a second time: the window"
    + " is " + rec3.window.reviews + " review(s) and neither earlier card is named");

  /* ---- 4. THE KEY A RECORD IS BUILT FROM ---------------------------------------------------- */

  const seen = await reviewProposal({ project: p.dir, file: proposalAt, rules: [], again: true,
                                      write: false });
  const wrong = seen.changes.filter(c => {
    const k = parseKey(keyFor(c));
    return k.scope !== c.scope || String(k.id) !== String(c.id === null ? "null" : c.id)
        || (c.path === null ? k.path !== null : k.path !== c.path);
  });
  check(seen.changes.length > 0 && !wrong.length,
    "4a every key the queue prints reads back as the scope, the id and the field it was built"
    + " from, over " + seen.changes.length + " row(s) of a real queue, " + wrong.length
    + " disagreeing: the record groups acceptances by card through that parse");

  /* The queue above holds whatever this fixture happens to differ by, which is two ordinary
     field changes. The eight shapes keyFor can build are put through it by hand, because the
     one that files a
     decision under the wrong card is the one nobody's fixture produced. */
  const shapes = [
    { scope: "header", op: "change", id: null, path: "name" },
    { scope: "card", op: "change", id: "c-one", path: "body.en" },
    { scope: "card", op: "move", id: "c-two", path: "shelf" },
    { scope: "card", op: "add", id: "c-three", path: null },
    { scope: "card", op: "remove", id: "c-four", path: null },
    { scope: "tag", op: "change", id: "t-one", path: "label.pl" },
    { scope: "tag", op: "add", id: "t-two", path: null },
    { scope: "tag", op: "remove", id: "t-three", path: null },
  ];
  const badShapes = shapes.filter(s => {
    const k = parseKey(keyFor(s));
    /* A move is a change of `shelf` and the key says so: the op the record files is the key's,
       which is why this compares the parse against the key rather than against the row. */
    const op = s.op === "move" ? "change" : s.op;
    return k.scope !== s.scope || String(k.id) !== String(s.id) || k.path !== s.path
        || k.op !== op;
  });
  check(!badShapes.length,
    "4b and so does each of the " + shapes.length + " shapes a key can take - a header field, a"
    + " card changed, moved, added and removed, a tag changed, added and removed - "
    + badShapes.length + " disagreeing: " + JSON.stringify(badShapes.map(s => keyFor(s))));

  /* ---- 5. ACCEPT ALL IS STILL ONE DECISION PER CARD (board 539's frame F, board 606) --------
   *
   * The queue's Accept all ticks every waiting row and lands them in one press. The danger it
   * carries is precisely this item's: a bulk accept that wrote ONE entry saying "all of it" -
   * or one that stamped the cards from a single decision - would leave an audit pack that
   * cannot say who approved a given card, which is the whole reason 606 exists. So the screen's
   * own verb is driven here with every key set to accept, and the record is read back card by
   * card.
   *
   * IT IS DRIVEN OVER AN IMPORTED PILE, which is the case 539 adds: a catalog from somewhere
   * else, offering new cards and changes to cards this project has. A bulk accept of two rows
   * would not have shown a bulk accept of twelve failing to stamp the twelfth.
   */

  const bulk = await project("bulk", pile("bulk", 51, 12), "bulk-pile");
  fs.mkdirSync(path.join(bulk.dir, INBOX), { recursive: true });
  const bulkPublished = await publishFull({ project: bulk.dir, folder: outFolder,
                                            notes: "before the import", now: CLOCK });
  const bulkHead = readJson(path.join(bulk.dir, DRAFT_FILE));
  const bulkIds = bulkHead.cards.map(c => c.id);

  /* Another catalog's document: the same cards with three edited, two cards this project has
     not got, and one card of this project's missing from it - which must NOT become a removal
     row and so must not reach the record either. */
  const coming = JSON.parse(JSON.stringify(bulkHead));
  coming.id = "somewhere-else";
  coming.name = "a pile from somewhere else";
  [0, 1, 2].forEach(i => { cardOf(coming, bulkIds[i]).body.en += "\nUstuma widesk glemira."; });
  coming.cards = coming.cards.filter(c => c.id !== bulkIds[9]);
  [1, 2].forEach(n => coming.cards.push({
    id: "c-coming-in-" + n, shelf: cardOf(coming, bulkIds[0]).shelf,
    title: { en: "Thelork ustuma " + n }, body: { en: "Widesk dovib glemira norvil." },
    bodyShape: "plain" }));
  delete coming.hash; delete coming.sig;
  coming.hash = F.contentHash(coming);
  const comingAt = path.join(bulk.dir, INBOX, "from-somewhere-else.ec");
  fs.writeFileSync(comingAt, JSON.stringify(coming, null, 1) + "\n", "utf8");

  const queue = await openProposal(bulk.dir, comingAt);
  check(queue.ok && queue.foreign === true && queue.fromCatalog === "somewhere-else"
        && queue.proposes.cards === 2 && queue.proposes.changes === 3
        && queue.proposes.removed === 0,
    "5a the imported pile opens as a queue of " + queue.changes.length + " rows: "
    + queue.proposes.cards + " card(s) coming in, " + queue.proposes.changes + " change(s), and"
    + " " + queue.proposes.removed + " removals although this project has a card the pile has"
    + " not got");

  /* The map the screen's Accept all builds: every row that is not already decided, set to
     accept. Nothing else about the act differs from ticking each row by hand. */
  const ticks = {};
  queue.changes.forEach(c => { if (!c.decided) ticks[c.key] = "accept"; });
  const t4 = Date.now();
  const landed = await decideProposal(bulk.dir, comingAt, ticks, WHO, null);
  const t5 = Date.now();
  const inWindow = s2 => {
    const t = Date.parse(String(s2));
    return Number.isFinite(t) && t >= t4 - 1000 && t <= t5 + 1000;
  };
  check(landed.ok && landed.accepted.length === queue.changes.length
        && landed.applied.length === queue.changes.length,
    "5b Accept all landed every one of them in one press: " + landed.accepted.length
    + " accepted, " + landed.applied.length + " applied, " + landed.skipped.length + " skipped");

  const bulkLog = readLog(bulk.dir);
  const stamped = (bulkLog.decided || []).filter(d => d.by === ACCOUNT && inWindow(d.at));
  check(bulkLog.decided.length === queue.changes.length
        && stamped.length === queue.changes.length,
    "5c and the log holds ONE decision per row, not one for the lot: "
    + bulkLog.decided.length + " entries for " + queue.changes.length + " rows, "
    + stamped.length + " of them carrying this account and a clock read at the decision");
  check(bulkLog.reviews.length === 1 && bulkLog.reviews[0].by === ACCOUNT
        && bulkLog.reviews[0].fromCatalog === "somewhere-else"
        && bulkLog.reviews[0].from === WHO,
    "5d the review it belongs to is one entry naming the reviewer, the sender and the catalog"
    + " the cards came out of: by " + JSON.stringify(bulkLog.reviews[0].by) + ", fromCatalog "
    + JSON.stringify(bulkLog.reviews[0].fromCatalog));

  const bulkNext = await publishFull({ project: bulk.dir, folder: outFolder,
                                       notes: "after the import", now: CLOCK });
  const bulkRec = readJson(path.join(bulkNext.archive, ACCEPTANCES_IN_ARCHIVE));
  const cardRows = (bulkRec.cards || []).reduce((n, c) => n + c.accepted.length, 0);
  check(everyAcceptanceNamesTheAccount(bulkRec, ACCOUNT)
        && bulkRec.cards.length === 5 && cardRows === 5
        && bulkRec.counts.changedWithoutAcceptance === 0,
    "5e and the archive's record has one row per card under a bulk accept - " + cardRows
    + " acceptance(s) over " + bulkRec.cards.length + " card(s), every one naming the account -"
    + " with " + bulkRec.counts.changedWithoutAcceptance + " card(s) changed in the edition"
    + " that no decision stands behind");
  check(!bulkRec.changedCards.includes(bulkIds[9])
        && cardOf(readJson(path.join(bulk.dir, DRAFT_FILE)), bulkIds[9]),
    "5f and the card the pile did not carry is still in the catalog and in no row of the"
    + " record: an import adds and changes, it does not delete (" + bulkIds[9] + ")");
  check(bulkPublished.rev === 1 && bulkNext.rev === 2,
    "5g over two real editions of a real project, rev " + bulkPublished.rev + " then rev "
    + bulkNext.rev);

  /* ---- the tally ---------------------------------------------------------------------------- */

  process.stdout.write("\nacceptance  " + asserted + " assertion(s), " + failed
    + " failure(s)\n");
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "acceptance");
  else process.stdout.write("acceptance  kept " + SCRATCH + "\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("acceptance  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
