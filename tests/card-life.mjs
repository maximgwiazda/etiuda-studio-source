/* Retire, restore, undo and a card's history in Studio (board 834, step 6, C07): node tests/card-life.mjs [--keep].
 * A project is published fourteen times with known changes, and the verbs are held to the editions and the draft's
 * bytes on disk, read with the pinned engine's canonical form. How it looks is tests/card-life-page.mjs and Maxim's eye. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import * as Engine from "../src/engine.mjs";
import { publishFull, editionsIn, archivedCatalog, ARCHIVE, DRAFT_FILE, PROJECT_FILE } from "../src/publish.mjs";
import * as S from "../src/studio.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { buildProject } from "./card-life-fixture.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "card-life");
const EXPECTED = 49;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const draftOf = (dir) => JSON.parse(fs.readFileSync(path.join(dir, DRAFT_FILE), "utf8"));
async function refusal(p) {
  try { await p; return null; } catch (e) { return e; }
}
/** Every file under a folder with its hash, in a stable order: the archive "is never touched". */
function treeHash(dir) {
  const out = [];
  const walk = (d) => fs.readdirSync(d).sort().forEach(n => {
    const p = path.join(d, n);
    if (fs.statSync(p).isDirectory()) walk(p); else out.push(path.relative(dir, p) + " " + sha(p));
  });
  walk(dir);
  return out.join("\n");
}

async function main(argv) {
  clearScratch(SCRATCH);
  const root = path.join(SCRATCH, "projects");
  fs.mkdirSync(root, { recursive: true });
  const F = await Engine.format();
  const { lintCatalog } = Engine.lint();

  /* ---- 0. A PROJECT PUBLISHED FOURTEEN TIMES ------------------------------------------------- */

  const { dir, ids, published, NOTES } = await buildProject(root);
  const eds = editionsIn(dir);
  check(eds.length === 14 && Object.keys(published).length === 14 && eds.join() === Object.values(published).join(),
    "cl0a fourteen editions in the archive, one per publish, in the order they were made: " + eds.length);
  const archiveBefore = treeHash(path.join(dir, ARCHIVE));
  const editionCard = (rev, id) => archivedCatalog(dir, published[rev]).cards.find(c => c.id === id);

  /* ---- 1. RETIRE AND RESTORE ----------------------------------------------------------------- */

  check("retired" in editionCard(6, ids.alpha) && editionCard(6, ids.alpha).retired === true
        && !("retired" in editionCard(5, ids.alpha)) && !("retired" in editionCard(11, ids.alpha)),
    "cl1a retire then publish: the edition holds the card with `retired: true` (rev 6), the one before"
    + " does not, and restore then publish takes it off again (rev 11)");
  const otherCards = () => JSON.stringify(draftOf(dir).cards.filter(c => c.id !== ids.charlie));
  const beforeRetire = otherCards();
  const ret = await S.retireCard(dir, ids.charlie);
  check(ret.card && ret.card.id === ids.charlie && ret.card.retired === true && ret.changed === true
        && draftOf(dir).cards.find(c => c.id === ids.charlie).retired === true
        && otherCards() === beforeRetire && !("cards" in ret),
    "cl1b Retire answers with the one card, the draft holds the flag on it and on no other card");
  check(lintCatalog(draftOf(dir)).errors.length === 0,
    "cl1c the draft with a retired card is a catalog the pinned engine's lint reads: "
    + lintCatalog(draftOf(dir)).errors.length + " error(s)");
  const again = await S.retireCard(dir, ids.charlie);
  check(again.card.retired === true && otherCards() === beforeRetire,
    "cl1d retiring a retired card changes nothing (the flag is true, never false or doubled)");
  const res = await S.restoreCard(dir, ids.charlie);
  check(res.card.retired === undefined && !("retired" in draftOf(dir).cards.find(c => c.id === ids.charlie)),
    "cl1e Restore takes the key off the card, and does not write `retired: false`, which the engine refuses");
  const none = await refusal(S.retireCard(dir, "c-nobody"));
  check(none && none.said && /^no card/.test(none.said.frame),
    "cl1f CONTROL: a card that is not there is refused, in a frame, and nothing is written");
  await S.retireCard(dir, ids.charlie);                    /* back to retired: rev 13's state */

  /* ---- 2. DELETE, AND UNDO ------------------------------------------------------------------- */

  const bytes0 = fs.readFileSync(path.join(dir, DRAFT_FILE));
  const order0 = draftOf(dir).cards.map(c => c.id);
  const del = await S.deleteCard(dir, ids.bravo);
  check(del.deleted === true && del.undoable === true && del.title === "Bravo, shorter"
        && draftOf(dir).cards.every(c => c.id !== ids.bravo),
    "cl2a Delete answers that it can be taken back and with the title the bar will say");
  const undone = await S.undoDelete(dir);
  check(Buffer.compare(fs.readFileSync(path.join(dir, DRAFT_FILE)), bytes0) === 0
        && undone.undone === true && undone.card.id === ids.bravo,
    "cl2b delete then Undo: the draft is byte for byte what it was before the delete (" + bytes0.length + " bytes)");
  check(draftOf(dir).cards.map(c => c.id).join() === order0.join()
        && undone.at === order0.indexOf(ids.bravo),
    "cl2c the card is back at the place it stood, which the answer names: " + undone.at);
  const nothing = await refusal(S.undoDelete(dir));
  check(nothing && nothing.said && /no longer remembers the deleted card/.test(nothing.said.frame),
    "cl2d CONTROL: Undo twice is refused, in a frame: the card is not put back a second time");
  await S.deleteCard(dir, ids.charlie);
  await S.saveCard(dir, ids.delta, { note: { en: "A note typed after the delete." } });
  const bytes1 = fs.readFileSync(path.join(dir, DRAFT_FILE));
  const late = await refusal(S.undoDelete(dir));
  check(late && late.said && /has changed since/.test(late.said.frame)
        && Buffer.compare(fs.readFileSync(path.join(dir, DRAFT_FILE)), bytes1) === 0,
    "cl2e once anything else changes the draft Undo is refused, in a frame, and writes nothing");
  fs.writeFileSync(path.join(dir, DRAFT_FILE), bytes0);        /* the project as it was, for 2f */
  const dA = await S.deleteCard(dir, ids.alpha), dB = await S.deleteCard(dir, ids.bravo);
  const back = await S.undoDelete(dir);
  check(dA.deleted && dB.deleted && back.card.id === ids.bravo
        && draftOf(dir).cards.every(c => c.id !== ids.alpha) && draftOf(dir).cards.some(c => c.id === ids.bravo),
    "cl2f two deletes in a row: Undo puts back the last one only, and the first stays deleted");
  fs.writeFileSync(path.join(dir, DRAFT_FILE), bytes0);        /* and again, for what follows */


  /* ---- 3. A DUPLICATE ------------------------------------------------------------------------ */

  await S.retireCard(dir, ids.charlie);
  {
    const d = draftOf(dir);
    const c = d.cards.find(x => x.id === ids.charlie);
    c.commits = true; c.next = [{ to: ids.delta }];
    delete d.hash; d.hash = F.contentHash(d);
    fs.writeFileSync(path.join(dir, DRAFT_FILE), JSON.stringify(d, null, 1) + "\n");
  }
  const srcBefore = JSON.stringify(draftOf(dir).cards.find(c => c.id === ids.charlie));
  const dup = await S.duplicateCard(dir, ids.charlie);
  const copy = draftOf(dir).cards.find(c => c.id === dup.card.id);
  check(copy && !("retired" in copy) && !("retired" in dup.card),
    "cl3a a copy of a retired card is not born retired");
  check(copy.commits === true && JSON.stringify(copy.next) === JSON.stringify([{ to: ids.delta }]),
    "cl3b the copy keeps `commits` and its own outgoing `next`: it is the same reply");
  check(JSON.stringify(draftOf(dir).cards.find(c => c.id === ids.charlie)) === srcBefore
        && !draftOf(dir).cards.some(c => c.id !== copy.id && (c.next || []).some(n => n.to === copy.id)),
    "cl3c the card it came from is untouched and no card gained a link to the copy");
  const lines = lintCatalog(draftOf(dir)).errors;
  check(lines.every(l => /same title as card/.test(l)) && lines.length <= 1,
    "cl3d the only thing the pinned lint says of the draft with the copy is the one every copy carries,"
    + " the same title as its source, and nothing about the three flags: " + JSON.stringify(lines));
  await S.deleteCard(dir, copy.id);
  {
    const d = draftOf(dir);
    const c = d.cards.find(x => x.id === ids.charlie);
    delete c.commits; delete c.next; delete c.retired;
    delete d.hash; d.hash = F.contentHash(d);
    fs.writeFileSync(path.join(dir, DRAFT_FILE), JSON.stringify(d, null, 1) + "\n");
  }

  /* ---- 4. A CARD'S HISTORY ------------------------------------------------------------------- */

  const hx = await S.cardHistory(dir, ids.bravo);
  check(hx.rows.length === 3 && hx.rows.map(r => r.rev).join() === "9,4,1"
        && hx.rows.map(r => r.kinds.join("+")).join() === "text,title,added",
    "cl4a a card changed in revs 4 and 9 of 14 shows exactly three rows, newest first (text 9, title 4,"
    + " added 1): " + JSON.stringify(hx.rows.map(r => [r.rev, r.kinds.join("+")])));
  check(hx.rows.every(r => r.edition === published[r.rev]) && hx.rows[0].note === "Note for revision 9."
        && hx.rows[2].note === "Note for revision 1.",
    "cl4b each row names its edition and carries the first line of that edition's notes, and no more");
  const ha = await S.cardHistory(dir, ids.alpha);
  check(ha.rows.map(r => r.rev + ":" + r.kinds.join("+")).join() === "11:restored,6:retired,1:added"
        && ha.retiredIn === null,
    "cl4c retired at 6 and restored at 11 reads restored, retired, added, and is not retired now: "
    + JSON.stringify(ha.rows.map(r => r.rev + ":" + r.kinds.join("+"))));
  const hc = await S.cardHistory(dir, ids.charlie);
  check(hc.rows.map(r => r.rev + ":" + r.kinds.join("+")).join() === "13:retired,1:added"
        && hc.retiredIn === published[13],
    "cl4d retired at 13 and still retired in the newest edition names that edition: " + hc.retiredIn);
  const hd = await S.cardHistory(dir, ids.delta);
  check(hd.rows.length === 14 && hd.rows[13].kinds.join() === "added"
        && hd.rows.slice(0, 13).every(r => r.kinds.join() === "text"),
    "cl4e a card that changed in every edition has a row for every edition, fourteen");
  const hn = await S.cardHistory(dir, "c-nobody");
  check(hn.rows.length === 0 && hn.last === null && hn.retiredIn === null,
    "cl4f CONTROL: a card no edition holds has no rows and no newest edition");
  check(ha.last && ha.last.edition === published[14] && ha.last.rev === 14,
    "cl4g the newest edition holding the card is named, for the strip: " + JSON.stringify(ha.last));
  /* a card changed only in its category: no title, text or flag moved, so it reads `changed` */
  const shelf2 = ((await S.addTag(dir, "shelf", { en: "Other", pl: "Inne" })).tag).id;
  await S.saveCard(dir, ids.alpha, { shelf: shelf2 });
  await publishFull({ project: dir, notes: "Moved a card.", now: "2026-09-25T10:00:00.000Z" });
  const hm = await S.cardHistory(dir, ids.alpha);
  check(hm.rows[0].kinds.join() === "changed" && hm.rows.length === 4,
    "cl4h a change to some other field is a row of its own, `changed`, and not a silent gap: "
    + JSON.stringify(hm.rows[0].kinds));
  const afterNew = await S.cardHistory(dir, ids.bravo);
  check(afterNew.rows.length === 3,
    "cl4i a new edition is read at the next ask, and a card it did not change keeps its three rows");

  /* ---- 5. RESTORE THIS TEXT ------------------------------------------------------------------ */

  const treeBefore = treeHash(path.join(dir, ARCHIVE));
  await S.saveCard(dir, ids.bravo, { note: { en: "A private note that is not title or body." }, replies: { shape: "steps", blocks: [{ text: { en: "First step." } }] } });
  const noteBefore = draftOf(dir).cards.find(c => c.id === ids.bravo).note;
  const rest = await S.restoreText(dir, ids.bravo, published[4]);
  const was4 = editionCard(4, ids.bravo), now = draftOf(dir).cards.find(c => c.id === ids.bravo);
  check(F.canonical(now.title) === F.canonical(was4.title) && F.canonical(now.body) === F.canonical(was4.body),
    "cl5a Restore this text from rev 4 makes the draft's card equal rev 4's for title and bodies");
  check(rest.card.id === ids.bravo && rest.restored === published[4]
        && F.canonical(rest.card.title) === F.canonical(was4.title),
    "cl5b the answer is the card as written, for the page to take");
  check(F.canonical(now.note) === F.canonical(noteBefore) && now.shelf === was4.shelf,
    "cl5c nothing but the title and the bodies moved: the card's note and category stand");
  check(now.bodyShape === was4.bodyShape && was4.bodyShape === "plain",
    "cl5e Restore this text restores bodyShape alongside title and body: " + now.bodyShape);
  check(treeHash(path.join(dir, ARCHIVE)) === treeBefore,
    "cl5d the archive's files are unchanged by it, every one by hash (" + treeBefore.split("\n").length + " files)");
  const un = await refusal(S.restoreText(dir, ids.bravo, "1999-01-01"));
  const nocard = await refusal(S.restoreText(dir, "c-nobody", published[4]));
  check(un && un.said && /has no edition/.test(un.said.frame) && nocard && nocard.said
        && /holds no card/.test(nocard.said.frame),
    "cl5e CONTROL: an edition that is not there, and a card the edition does not hold, are refused in frames");
  check(lintCatalog(draftOf(dir)).errors.length === 0, "cl5f the draft after it is a catalog the pinned lint reads");

  await S.retireCard(dir, ids.charlie);
  await S.restoreText(dir, ids.charlie, published[1]);
  check(draftOf(dir).cards.find(c => c.id === ids.charlie).retired === true,
    "cl5g Restore this text on a retired card leaves it retired: only the title and bodies come from the edition");
  await S.restoreCard(dir, ids.charlie);

  /* ---- 6. COMPARE, FILTERED TO THE CARD ------------------------------------------------------ */

  const cmp = await S.diffCardEditions(dir, ids.bravo, published[4], published[9]);
  const whole = await S.diffEditions(dir, published[4], published[9]);
  check(!cmp.same && cmp.rows.length >= 1
        && cmp.rows.every(r => r.what.indexOf(ids.bravo) >= 0) && cmp.rows.some(r => /body\.en/.test(r.what)),
    "cl6a the comparison of rev 4 and rev 9 for a card has rows for that card alone, the body among them: "
    + JSON.stringify(cmp.rows.map(r => r.what)));
  check(whole.rows.length > cmp.rows.length && whole.rows.some(r => r.what.indexOf(ids.delta) >= 0),
    "cl6b CONTROL: the Archive's own comparison of the same two editions also holds the other cards ("
    + whole.rows.length + " rows against " + cmp.rows.length + ")");
  const same = await S.diffCardEditions(dir, ids.bravo, published[10], published[12]);
  check(same.same === true && same.rows.length === 0,
    "cl6c two editions that differ for other cards and not for this one compare as the same");
  check(cmp.heads.a.rev === 4 && cmp.heads.b.rev === 9 && cmp.heads.b.note === "Note for revision 9.",
    "cl6d the answer names each edition's revision and the first line of its note, for the heading");
  const ar = treeHash(path.join(dir, ARCHIVE)).split("\n");
  check(archiveBefore.split("\n").every(l => ar.indexOf(l) >= 0),
    "cl6e every file of the fourteen editions is still there with the hash it had at the start");

  /* ---- 7. A WHOLE EDITION TAKEN BACK INTO THE DRAFT, FROM THE ARCHIVE ------------------------- */

  /* The draft carries changes no edition holds by now (section 5's), and three more of three kinds: a card, a
     language and quick facts. Each must leave with the rollback and come back with its Undo. */
  const tree7 = treeHash(path.join(dir, ARCHIVE));
  const golf = await S.addCard(dir, draftOf(dir).tags[0].id, "Golf", "A card no edition holds.");
  await S.addLang(dir, "de", "Deutsch");
  await S.saveFacts(dir, "Quick facts typed since the last edition.");
  const projectAt = path.join(dir, PROJECT_FILE);
  const sansEdited = (p) => { const o = JSON.parse(fs.readFileSync(p, "utf8")); delete o.edited; return JSON.stringify(o); };
  const project7 = sansEdited(projectAt);
  const bytes7 = fs.readFileSync(path.join(dir, DRAFT_FILE)), draft7 = draftOf(dir);
  const listed7 = (await S.changesSince(dir)).list.length;
  /* what an edition and a draft share: everything but the identity and the stamps (id, rev, date, the lead's note,
     the hash, the signature and the evaluation mark) */
  const content = (c) => { const o = Object.assign({}, c); ["id", "rev", "date", "notes", "hash", "sig", "evaluation"].forEach(k => delete o[k]);
    return F.canonical(o); };
  const restoreEdition = typeof S.restoreEdition === "function" ? S.restoreEdition : null;
  const roll = restoreEdition ? await restoreEdition(dir, published[4]) : null;
  const cat4 = archivedCatalog(dir, published[4]), after7 = draftOf(dir);
  check(!!roll && content(after7) === content(cat4) && after7.cards.every(c => c.id !== golf.card.id)
        && after7.langs.map(l => l.code).join() === "en,pl" && !("facts" in after7),
    "cl7a the rollback makes the draft rev 4's content whole: no card added since, rev 4's two languages and no quick"
    + " facts: " + (after7.langs || []).map(l => l.code).join());
  check(!!roll && after7.id === draft7.id && after7.rev === draft7.rev && after7.hash === F.contentHash(Object.assign({}, after7,
          { hash: undefined }))
        && sansEdited(projectAt) === project7,
    "cl7b the project keeps who it is: the draft's own id and rev, a hash of what it now holds, and project.json (id, file"
    + " name, folder, rev, team) as it was but for its edited stamp");
  const listed7a = roll ? (await S.changesSince(dir)).list : [];
  check(!!roll && roll.undoable === true && roll.did && roll.did.kind === "rollback" && roll.did.rev === 4
        && roll.did.edition === published[4] && listed7a.length === 1 && listed7a[0].did
        && listed7a[0].did.kind === "rollback" && (await S.changesCount(dir)) === 1,
    "cl7c it is one change: the rollback entry stands alone and pre-rollback entries are ended");
  check(treeHash(path.join(dir, ARCHIVE)) === tree7,
    "cl7d the archive's files are unchanged by it, every one by hash (" + tree7.split("\n").length + " files)");
  const back7 = roll ? await S.undoBulk(dir).catch(() => null) : null;
  check(!!back7 && Buffer.compare(fs.readFileSync(path.join(dir, DRAFT_FILE)), bytes7) === 0
        && (await S.changesSince(dir)).list.length === listed7,
    "cl7e Undo puts the draft back byte for byte, with the card, the language and the quick facts typed since the last"
    + " edition, and the Changes list loses the entry (" + bytes7.length + " bytes)");
  if (restoreEdition) await restoreEdition(dir, published[4]);
  const entry7 = restoreEdition ? (await S.changesSince(dir)).list.find(e => e.did && e.did.kind === "rollback") : null;
  const undone7 = entry7 ? await S.undoChange(dir, entry7.n).catch(() => null) : null;
  check(!!undone7 && content(draftOf(dir)) === content(draft7),
    "cl7f it can be undone from the Changes list too, later than the bar: the draft's content is back as it was");
  const listed7f = (await S.changesSince(dir)).list;
  const count7f = await S.changesCount(dir);
  const golf7 = listed7f.find(e => e.cards && e.cards.some(c => c.id === golf.card.id));
  const backGolf = golf7 ? await S.undoChange(dir, golf7.n).catch(() => null) : null;
  check(listed7f.length === listed7 && count7f === listed7 && !!backGolf
        && draftOf(dir).cards.every(c => c.id !== golf.card.id),
    "cl7f2 undone from the Changes list, earlier entries stand again and their Undo is live: " + listed7f.length + " changes, golf undone");
  const bytes7g = fs.readFileSync(path.join(dir, DRAFT_FILE));
  const noEd = restoreEdition ? await refusal(restoreEdition(dir, "1999-01-01")) : null;
  check(!!noEd && noEd.said && /has no edition/.test(noEd.said.frame)
        && Buffer.compare(fs.readFileSync(path.join(dir, DRAFT_FILE)), bytes7g) === 0,
    "cl7g CONTROL: an edition that is not there is refused, in a frame, and nothing is written");
  if (restoreEdition) await restoreEdition(dir, published[4]);
  const bytes7h = fs.readFileSync(path.join(dir, DRAFT_FILE));
  const twice = restoreEdition ? await restoreEdition(dir, published[4]) : null;
  check(!!twice && twice.refused === "no changes" && Buffer.compare(fs.readFileSync(path.join(dir, DRAFT_FILE)), bytes7h) === 0,
    "cl7h CONTROL: a draft that already holds the edition's content is told so, and nothing is written");
  const before7 = editionsIn(dir);
  const out7 = await publishFull({ project: dir, notes: "Back to rev 4.", now: "2026-09-26T10:00:00.000Z" });
  const ed7 = archivedCatalog(dir, out7.edition), tree7i = treeHash(path.join(dir, ARCHIVE)).split("\n");
  /* rev 4's content, its dates aside: a card the rollback changed is dated by the rollback since board 982 */
  const undatedContent = (c) => { const o = JSON.parse(JSON.stringify(c));
    (o.cards || []).forEach(k => { delete k.changedAt; }); (o.tags || []).forEach(t => { delete t.changedAt; }); return content(o); };
  check(out7.rev === 16 && before7.indexOf(out7.edition) < 0 && ed7.rev === 16 && undatedContent(ed7) === undatedContent(cat4)
        && tree7.split("\n").every(l => tree7i.indexOf(l) >= 0),
    "cl7i the next publish sends rev 4's content as a new edition, rev " + out7.rev + " after rev 15, and every earlier"
    + " edition's files stay as they were");

  process.stdout.write("\ncard-life  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  if (asserted !== EXPECTED) {
    process.stderr.write("card-life  expected " + EXPECTED + " assertions, ran " + asserted + "\n");
    failed++;
  }
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "card-life");
  else process.stdout.write("card-life  kept " + SCRATCH + "\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("card-life  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
