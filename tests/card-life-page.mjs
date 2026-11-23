/* The same, as the page paints it (board 834, step 6, C07): node tests/card-life-page.mjs [--keep]. The page's own code runs on
 * tests/page-stand-in.mjs against the real verbs and a real project; every leg reads markup and files, never layout, and
 * the Archive's table is held by its own markup (step 8). It reads no git history: the byte for byte hold against the tree
 * before this build (git show of the commit it began from) was retired with the audit's checks of 2026-11-11, and the constant
 * and import it left went on 2026-11-23, when the tree came to be published without its history. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import * as S from "../src/studio.mjs";
import { DRAFT_FILE, ARCHIVE, CATALOG_IN_ARCHIVE, publishFull, editionsIn } from "../src/publish.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { buildProject } from "./card-life-fixture.mjs";
import { loadPage } from "./page-stand-in.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "card-life-page");
const EXPECTED = 55;
const NB = String.fromCharCode(160);

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const draftAt = (dir) => path.join(dir, DRAFT_FILE);
const draftOf = (dir) => JSON.parse(fs.readFileSync(draftAt(dir), "utf8"));
function treeHash(dir) {
  const out = [];
  const walk = (d) => fs.readdirSync(d).sort().forEach(n => {
    const p = path.join(d, n);
    if (fs.statSync(p).isDirectory()) walk(p); else out.push(path.relative(dir, p) + " " + sha(p));
  });
  walk(dir);
  return out.join("\n");
}
/** The shell's own wrapping of a verb: `error: null` on success, `{error, said, disk}` on a throw. */
const wire = (p) => Promise.resolve(p)
  .then(v => JSON.parse(JSON.stringify(Object.assign({ error: null }, v))))
  .catch(e => ({ error: e && e.message ? e.message : String(e), said: (e && e.said) || null, disk: !!(e && e.disk) }));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const text = (html) => String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").replace(/&middot;/g, "·").trim();
const count = (html, needle) => String(html).split(needle).length - 1;

function apiOver(dir) {
  const calls = [];
  const api = {};
  for (const k of ["retireCard", "restoreCard", "undoDelete", "cardHistory", "restoreText",
    "diffCardEditions", "deleteCard", "duplicateCard", "addCard", "saveCard", "diffEditions", "restoreEdition", "undoBulk"]) {
    api[k] = (...a) => { calls.push(k); return wire(S[k](...a)); };
  }
  api.calls = calls;
  return api;
}

async function main(argv) {
  clearScratch(SCRATCH);
  const root = path.join(SCRATCH, "projects");
  fs.mkdirSync(root, { recursive: true });
  const { dir, ids, published } = await buildProject(root);
  const archiveBefore = treeHash(path.join(dir, ARCHIVE));
  const cardsOnDisk = () => draftOf(dir).cards;

  const api = apiOver(dir);
  const home = loadPage({ api, uiLang: "en" });
  const P = home.page;
  const open = await wire(S.openProject(dir));
  Object.assign(P.S, { open, screen: "project", section: "cards", lang: "en" });
  const mainHtml = () => home.node("#main").innerHTML;
  /* the table the page built last: its rows are the markup rowHtml wrote, in order */
  const rowsOf = () => (home.sandbox.__tables.slice(-1)[0] || {}).__rows || [];

  /* ---- 1. THE FILTER ------------------------------------------------------------------------- */

  P.paint();
  /* the switch sits in the Card column's heading since R2 (2026-10-06), which the stand-in does not put in #main */
  const bar = P.headHtml();
  const nums = (html) => [...String(html).matchAll(/data-v="(\w+)"[^>]*>[A-Za-z]+(?: | )(\d+)</g)].reduce((o, m) => { o[m[1]] = +m[2]; return o; }, {});
  const onDisk = cardsOnDisk();
  const retiredOnDisk = onDisk.filter(c => c.retired).length;
  check(JSON.stringify(nums(bar)) === JSON.stringify({ active: onDisk.length - retiredOnDisk, retired: retiredOnDisk, all: onDisk.length })
        && retiredOnDisk === 1,
    "pg1a markup: the table's filter reads Active, Retired and All, and Active is the cards on disk minus the"
    + " retired ones: " + JSON.stringify(nums(bar)) + " against " + onDisk.length + " cards, " + retiredOnDisk + " retired");
  check(/class="on" role="radio" aria-checked="true" data-act="card-view" data-v="active"/.test(bar),
    "pg1b markup: the table opens on Active, set through the page's one door for a chosen segment");
  check(rowsOf().length === 3 && rowsOf().every(r => !/ ret"/.test(r)),
    "pg1c markup: on Active the table lists the three cards that are not retired, none of them marked");
  P.S.cardView = "retired"; P.paintCards();
  check(rowsOf().length === 1 && / ret"[^>]* data-act="pick"/.test(rowsOf()[0]) && /class="chip ret">retired</.test(rowsOf()[0]),
    "pg1d markup: on Retired the one retired card, its row marked and wearing the dashed chip");
  P.S.cardView = "all"; P.paintCards();
  check(rowsOf().length === 4 && rowsOf().filter(r => / ret"[^>]* data-act="pick"/.test(r)).length === 1,
    "pg1e markup: on All the four cards, the retired one in its place and the only one marked");
  P.S.cardView = "active";

  /* ---- 2. THE EDITOR OF A RETIRED CARD ------------------------------------------------------- */

  const charlie = P.cardById(ids.charlie), bravo = P.cardById(ids.bravo);
  P.S.sel = ids.charlie;
  let ed = P.editorHtml(charlie);
  check(/id="retiredBox"/.test(ed) && /data-act="card-restore"/.test(ed)
        && /<h3 class="t">Charlie<span class="chip ret">retired<\/span>/.test(ed),
    "pg2a markup: the editor of a retired card opens with the dashed box and a Restore button, and its"
    + " heading wears the chip");
  check(!/retiredBox/.test(P.editorHtml(bravo)) && !/chip ret/.test(P.editorHtml(bravo)),
    "pg2b CONTROL: the editor of a card that is not retired has neither");
  check(text(P.retBox(charlie)) === "Restore",
    "pg2c until the history has answered the box says nothing about an edition, only the way back: "
    + JSON.stringify(text(P.retBox(charlie))));
  await P.histFor(ids.charlie);
  await sleep(40);
  const said = text(P.retBox(charlie));
  check(said.indexOf(published[13]) === "Retired in rev 13 (".length && /^Retired in rev 13 \(2026-09-23\)\. The desks keep it out of sight, together with its stars, own edits and counts, until it is restored\. Restore$/.test(said),
    "pg2d markup: once the history has answered, the box names the rev that retired it and its dated edition (board 902): " + JSON.stringify(said));
  const acts = P.cardActs(charlie), actsB = P.cardActs(bravo);
  const order = (h) => ["card-dup", "card-retire", "card-restore", "card-del"].map(a => [h.indexOf('data-act="' + a + '"'), a]).filter(x => x[0] >= 0).sort((a, b) => a[0] - b[0]).map(x => x[1]).join();
  check(order(acts) === "card-dup,card-restore,card-del" && order(actsB) === "card-dup,card-retire,card-del",
    "pg2e markup: the acts are Duplicate, Retire, Delete card on an active card, and Restore takes Retire's place"
    + " on a retired one: " + order(actsB) + " / " + order(acts));

  /* ---- 3. RETIRE AND RESTORE, PRESSED --------------------------------------------------------- */

  P.S.sel = ids.bravo; P.S.cardView = "active";
  const before = JSON.stringify(cardsOnDisk().filter(c => c.id !== ids.bravo));
  await P.ACTS["card-retire"]();
  const diskBravo = cardsOnDisk().find(c => c.id === ids.bravo);
  check(diskBravo.retired === true && P.cardById(ids.bravo).retired === true
        && JSON.stringify(cardsOnDisk().filter(c => c.id !== ids.bravo)) === before
        && api.calls.indexOf("retireCard") >= 0,
    "pg3a pressing Retire sets the flag on the file and on the page's card, and on no other card");
  const nums2 = nums(P.headHtml());
  check(nums2.active === cardsOnDisk().filter(c => !c.retired).length && nums2.retired === 2 && nums2.all === 4,
    "pg3b markup: the filter now reads " + JSON.stringify(nums2) + ", Active still the cards on disk minus the retired");
  check(!rowsOf().some(r => r.indexOf('data-id="' + ids.bravo + '"') >= 0),
    "pg3c markup: on Active the card that was just retired has left the table, and its editor stays open: "
    + /id="cardEditor"/.test(mainHtml()));
  await P.histFor(ids.bravo); await sleep(40);
  check(/^Retired in this draft\./.test(text(P.retBox(P.cardById(ids.bravo)))),
    "pg3d markup: a card retired in the draft and in no edition says so, and not that an edition retired it: "
    + JSON.stringify(text(P.retBox(P.cardById(ids.bravo))).slice(0, 60)));
  await P.ACTS["card-restore"]();
  check(!("retired" in cardsOnDisk().find(c => c.id === ids.bravo)) && !P.cardById(ids.bravo).retired
        && nums(P.headHtml()).active === 3,
    "pg3e pressing Restore takes the flag off the file and the page, and the filter reads three active again");

  /* ---- 4. DELETE, THE BAR AND UNDO ----------------------------------------------------------- */

  const bytes0 = fs.readFileSync(draftAt(dir));
  const at0 = cardsOnDisk().findIndex(c => c.id === ids.bravo);
  P.S.sel = ids.bravo;
  await P.ACTS["card-del"]();
  check(P.S.undo && P.S.undo.title === "Bravo, shorter" && !P.cardById(ids.bravo)
        && cardsOnDisk().every(c => c.id !== ids.bravo),
    "pg4a pressing Delete card removes the card from the file and the page and opens the undo state with its title");
  const bar4 = home.node("#undo");
  check(bar4.hidden === false && /Deleted the card “Bravo, shorter”\./.test(text(bar4.innerHTML))
        && /data-act="card-undo"/.test(bar4.innerHTML) && />Ctrl\+Z</.test(bar4.innerHTML),
    "pg4b markup: the bar at the foot says what was deleted, offers Undo and names the key: " + JSON.stringify(text(bar4.innerHTML)));
  await P.ACTS["card-undo"]();
  check(Buffer.compare(fs.readFileSync(draftAt(dir)), bytes0) === 0 && P.S.undo === null && bar4.hidden === true
        && P.S.open.draft.cards.findIndex(c => c.id === ids.bravo) === at0 && P.S.sel === ids.bravo,
    "pg4c pressing Undo: the draft is byte for byte what it was, the card is back at its place on the page"
    + " and selected, and the bar has gone");
  await P.ACTS["card-del"]();
  const bytes1 = fs.readFileSync(draftAt(dir));
  P.S.sel = ids.delta;
  P.queueSave(ids.delta, { note: { en: "typed after the delete" } });
  check(P.S.undo === null && home.node("#undo").hidden === true,
    "pg4d the bar goes at the next change: the first keystroke of an edit (queueSave) closes it, before it is saved");
  await P.flush();
  check(Buffer.compare(fs.readFileSync(draftAt(dir)), bytes1) !== 0,
    "pg4e CONTROL: that edit did change the draft, which is what Undo would have had to refuse");
  P.S.undo = { title: "x", dir: "another" }; P.paintUndo();
  check(home.node("#undo").hidden === true,
    "pg4f CONTROL: a bar left over from another project is never shown over this one");
  P.S.undo = null;
  /* the project as it was before the delete and the edit, for what follows */
  fs.writeFileSync(draftAt(dir), bytes0);
  P.S.open = await wire(S.openProject(dir));
  Object.assign(P.S, { screen: "project", section: "cards" });
  check(P.S.open.draft.cards.length === 4 && P.cardById(ids.bravo) && Buffer.compare(fs.readFileSync(draftAt(dir)), bytes0) === 0,
    "pg4g the draft is put back as it was, for the legs that follow: " + P.S.open.draft.cards.length + " cards");

  /* ---- 5. THE HISTORY IN THE EDITOR ----------------------------------------------------------- */

  P.S.sel = ids.bravo;
  P.S.hist = null;
  await P.histFor(ids.bravo); await sleep(40);
  const hist = P.histHtml(P.cardById(ids.bravo));
  const rowsH = [...hist.matchAll(/<div class="hrow( now)?">([^]*?)<\/div>/g)].map(m => text(m[2]));
  check(rowsH.length === 3 && rowsH[0].indexOf("rev 9 " + published[9]) === 0 && rowsH[1].indexOf("rev 4 " + published[4]) === 0 && rowsH[2].indexOf("rev 1 " + published[1]) === 0
        && /rev 9 \S+ text “Note for revision 9\.”/.test(rowsH[0]) && /rev 4 \S+ title “Note for revision 4\.”/.test(rowsH[1])
        && /rev 1 \S+ added “Note for revision 1\.”/.test(rowsH[2]),
    "pg5a markup: a card changed in revs 4 and 9 shows three rows, newest first, each with its rev, then its date (board 902), kind and"
    + " the first line of the note: " + JSON.stringify(rowsH));
  const segs = hist.split('<div class="hrow').slice(1);
  check(segs.length === 3 && / now"/.test(segs[0].slice(0, 6)) && !/hist-(compare|restore)/.test(segs[0])
        && segs.slice(1).every(g => count(g, 'data-act="hist-compare"') === 1 && count(g, 'data-act="hist-restore"') === 1),
    "pg5b markup: every older row has Compare and Restore this text and the newest row, marked, has neither");
  await P.histFor(ids.charlie); await sleep(40);
  const rowsC = [...P.histHtml(P.cardById(ids.charlie)).matchAll(/<div class="hrow( now)?">([^]*?)<\/div>/g)].map(m => text(m[2]));
  check(rowsC.length === 2 && /rev 13 \S+ retired/.test(rowsC[0]) && /rev 1 \S+ added/.test(rowsC[1]),
    "pg5c markup: the history is asked for per card, and a card retired at 13 shows retired above added: " + JSON.stringify(rowsC));
  const fresh = await wire(S.addCard(dir, open.draft.tags[0].id, "Fresh card", "A body."));
  P.S.open.draft.cards.push(fresh.card);
  P.S.hist = null;
  await P.histFor(fresh.card.id); await sleep(40);
  check(P.histHtml(P.cardById(fresh.card.id)) === "",
    "pg5d markup: a card no edition holds shows no History block at all");
  await wire(S.deleteCard(dir, fresh.card.id));
  P.S.open.draft.cards = P.S.open.draft.cards.filter(c => c.id !== fresh.card.id);

  /* ---- 6. RESTORE THIS TEXT, PRESSED --------------------------------------------------------- */

  P.S.sel = ids.bravo; P.S.hist = null;
  await P.histFor(ids.bravo); await sleep(40);
  const archive6 = treeHash(path.join(dir, ARCHIVE));
  await P.ACTS["hist-restore"]({ getAttribute: (k) => k === "data-e" ? published[4] : null });
  const was4 = JSON.parse(fs.readFileSync(path.join(dir, ARCHIVE, published[4], CATALOG_IN_ARCHIVE), "utf8")).cards.find(c => c.id === ids.bravo);
  const diskNow = cardsOnDisk().find(c => c.id === ids.bravo);
  check(JSON.stringify(diskNow.title) === JSON.stringify(was4.title) && JSON.stringify(diskNow.body) === JSON.stringify(was4.body)
        && JSON.stringify(P.cardById(ids.bravo).title) === JSON.stringify(was4.title)
        && JSON.stringify(P.cardById(ids.bravo).body) === JSON.stringify(was4.body),
    "pg6a pressing Restore this text puts rev 4's title and bodies into the file and into the page's card");
  check(treeHash(path.join(dir, ARCHIVE)) === archive6 && treeHash(path.join(dir, ARCHIVE)) === archiveBefore,
    "pg6b the archive is the same by hash, file for file, after it");

  /* ---- 7. THE PAGE OF ITS OWN ---------------------------------------------------------------- */

  P.S.sel = ids.bravo;
  await P.ACTS["hist-compare"]({ getAttribute: (k) => k === "data-e" ? published[4] : null });
  check(P.S.section === "cardhist" && P.S.cardPage.pair.join() === [published[4], published[9]].join()
        && P.S.cardPage.diff && P.S.cardPage.diff.rows.length >= 1,
    "pg7a Compare on rev 4's row opens the page of its own with rev 4 and the newest row's rev 9 picked, and the"
    + " card's comparison loaded");
  P.paint();
  const pg = home.node("#main").innerHTML;
  check(/<h1 class="hist-h1">Card history:&nbsp;<span class="nw">Bravo, shorter<\/span><\/h1>/.test(pg) &&/Pick any two revs to compare them in the Archive&#39;s table\./.test(pg),
    "pg7b markup: the page is headed Card history with the card's title and says to pick two revisions");
  const nodesPg = [...pg.matchAll(/<span class="hnode( on)?" role="radio" aria-checked="(\w+)" data-act="hist-pick" data-e="([^"]+)"[^>]*><b>rev (\d+)</g)];
  check(nodesPg.map(m => m[4]).join() === "1,4,9,14" && nodesPg.filter(m => m[2] === "true").map(m => m[4]).join() === "4,9",
    "pg7c markup: the strip holds the card's editions oldest first, rev 1, 4, 9 and the newest edition 14, with 4 and"
    + " 9 picked: " + JSON.stringify(nodesPg.map(m => [m[4], m[2]])));
  check(pg.includes("<h3>What changes · rev" + NB + "4 (" + published[4] + ") → rev" + NB + "9 (" + published[9] + ") “Note for revision 9.”</h3>")
        && /<th>What changes<\/th><th>Was<\/th><th>Becomes<\/th>/.test(pg) && pg.includes("changed card " + ids.bravo + " body.en")
        && !pg.includes(ids.delta),
    "pg7d markup: the Archive's own table, headed with the two revisions and the note, over this card's change alone");
  check(new RegExp('data-act="hist-restore" data-e="' + published[4] + '" title="rev' + NB + '4 \\(' + published[4] + '\\)">[^]*?Restore the text of rev 4').test(pg)
        && /It comes back as a new change in the draft\. Nothing in the archive changes\./.test(pg),
    "pg7e markup: one button restores the older text of the pair, and the page says what it does");
  P.paintRail();
  check(/<a class="on" role="link" aria-current="page" data-act="section" data-v="archive"/.test(home.node("#rail").innerHTML),
    "pg7f markup: the rail keeps the Archive lit while the card's page is up");
  await P.ACTS["hist-pick"]({ getAttribute: (k) => k === "data-e" ? published[14] : null });
  check(P.S.cardPage.pair.join() === [published[9], published[14]].join() && P.S.cardPage.diff && P.S.cardPage.diff.same === true,
    "pg7g picking a third edition drops the oldest pick and compares the two left (rev 9 and 14, the same for this card)");
  await P.ACTS["hist-pick"]({ getAttribute: (k) => k === "data-e" ? published[14] : null });
  P.paint();
  check(P.S.cardPage.pair.join() === published[9] && P.S.cardPage.diff === null
        && !home.node("#main").innerHTML.includes("Restore the text of rev"),
    "pg7h picking a picked edition again lets it go, and one pick has no table and no restore button to show");
  await P.ACTS["hist-pick"]({ getAttribute: (k) => k === "data-e" ? published[4] : null });
  await P.ACTS["hist-restore"]({ getAttribute: (k) => k === "data-e" ? published[4] : null });
  check(P.S.section === "cards" && P.S.cardPage === null && /id="cardEditor"/.test(home.node("#main").innerHTML),
    "pg7i restoring from the page returns to the card's editor, which shows the card as it now stands");
  check(treeHash(path.join(dir, ARCHIVE)) === archiveBefore,
    "pg7j the archive is the same by hash after the page's comparisons and restores");

  /* ---- 8. THE ARCHIVE'S OWN TABLE, UNCHANGED ------------------------------------------------- */

  const d = await wire(S.diffEditions(dir, published[4], published[9]));
  const dSame = await wire(S.diffEditions(dir, published[4], published[4]));
  /* a fifteenth edition that adds a card, so the table has a row with nothing on one side */
  await wire(S.addCard(dir, open.draft.tags[0].id, "Echo", "An echo."));
  await publishFull({ project: dir, notes: "Added a card.", now: "2026-09-25T10:00:00.000Z" });
  const dAdded = await wire(S.diffEditions(dir, published[14], editionsIn(dir).slice(-1)[0]));
  const arch = await wire(S.archiveTimeline(dir));
  const archiveMarkup = (pageOf, diff) => {
    Object.assign(pageOf.page.S, { open, screen: "project", section: "archive", lang: "en", arch, diff,
      pair: [published[4], published[9]] });
    pageOf.page.paintArchive();
    return pageOf.node("#main").innerHTML;
  };
  const aNow = archiveMarkup(home, d);
  /* SINCE 2026-10-06 A CUT END FADES where the line prints three dots (tests/fade-off.mjs): the control puts the dots back,
     so it still holds every other byte of the screen to what it was. */
  /* AND SINCE BOARD 901 AN EDITION'S ROW IS AN OBJECT, marked data-ctx: the control takes the mark out with the fade. */
  check(aNow.includes("<th>What changes</th><th>Was</th><th>Becomes</th>") && count(aNow, '<tr title="') === d.rows.length,
    "pg8a markup: the Archive's table has its three columns and a row for each of the " + d.rows.length + " lines");

  /* ---- 10. THE HISTORY UNDER THE TEXT, AND A REFUSED UNDO (Claudia's and Claudius's rulings of 2026-10-01) ---- */

  P.S.open = await wire(S.openProject(dir));
  Object.assign(P.S, { screen: "project", section: "cards", lang: "en", sel: ids.bravo, hist: null, cardView: "all" });
  await P.histFor(ids.bravo); await sleep(40);
  const ed10 = P.editorHtml(P.cardById(ids.bravo));
  const at10 = (needle) => ed10.indexOf(needle);
  check(at10('data-f="note"') > 0 && at10('id="cardHist"') > ed10.lastIndexOf('data-f="note"')
        && at10('id="cardHist"') < at10('id="cardBag"') && at10('data-f="shelf"') < at10('data-f="title"'),
    "pg10a markup: the History block sits under the language blocks and above Keywords, and Category and Intent sit above the language blocks (board 960)");
  const fresh10 = await wire(S.addCard(dir, open.draft.tags[0].id, "Foxtrot", "A body."));
  P.S.open.draft.cards.push(fresh10.card);
  const ed10b = P.editorHtml(P.cardById(fresh10.card.id));
  check(!ed10b.includes('id="cardHist"') && ed10b.indexOf('id="cardBag"') > ed10b.lastIndexOf('data-f="note"'),
    "pg10b CONTROL: a card no edition holds has no History block, and Keywords still follow its language blocks");
  await wire(S.deleteCard(dir, fresh10.card.id));
  P.S.open = await wire(S.openProject(dir));
  home.doc.absent = new Set(["#cardHist"]);
  const bag10 = home.node("#cardBag");
  bag10.inserts = [];
  P.S.hist = null;
  await P.histFor(ids.bravo); await sleep(40);
  check(bag10.inserts.length === 1 && bag10.inserts[0][0] === "beforebegin" && bag10.inserts[0][1].includes('id="cardHist"'),
    "pg10c markup: a history that arrives for an editor with no block yet is put in just before the Keywords row");
  home.doc.absent = null;
  const old10 = home.node("#cardHist");
  P.histPaint();
  check(bag10.inserts.length === 1 && old10.outerHTML.includes('id="cardHist"'),
    "pg10d CONTROL: with a block already there it is replaced in place and nothing is inserted before Keywords");

  const bytes10 = fs.readFileSync(draftAt(dir));
  P.S.sel = ids.bravo;
  await P.ACTS["card-del"]();
  const moved = P.S.undo !== null;
  await wire(S.saveCard(dir, ids.delta, { note: { en: "changed behind the page's back" } }));
  const bytes10b = fs.readFileSync(draftAt(dir));
  await P.ACTS["card-undo"]();
  check(moved && P.S.undo === null && home.node("#undo").hidden === true && /has changed since/.test(P.errText())
        && Buffer.compare(fs.readFileSync(draftAt(dir)), bytes10b) === 0,
    "pg10e an Undo refused because the draft moved closes the bar with the refusal, and writes nothing: " + P.errText());
  fs.writeFileSync(draftAt(dir), bytes10);
  P.S.open = await wire(S.openProject(dir)); P.S.err = null;
  P.S.undo = { title: "Bravo, shorter", dir: P.S.open.dir }; P.paintUndo();
  const shown10 = home.node("#undo").hidden === false;
  await P.ACTS["card-undo"]();
  check(shown10 && P.S.undo === null && home.node("#undo").hidden === true && /no longer remembers the deleted card/.test(P.errText())
        && Buffer.compare(fs.readFileSync(draftAt(dir)), bytes10) === 0,
    "pg10f an Undo refused because the worker has no record (it restarted) closes the bar too, after it was on offer: "
    + P.errText());

  /* ---- 11. ANY OTHER CHANGE CLOSES THE BAR (the spec: "until the next change"; Clément α's leg) ---- */

  for (const [name, press] of [
    ["Retire", () => P.ACTS["card-retire"]()],
    ["Restore", () => P.ACTS["card-restore"]()],
    ["Restore this text", () => P.ACTS["hist-restore"]({ getAttribute: (k) => k === "data-e" ? published[1] : null })],
  ]) {
    fs.writeFileSync(draftAt(dir), bytes10);
    P.S.open = await wire(S.openProject(dir)); P.S.err = null;
    Object.assign(P.S, { screen: "project", section: "cards", lang: "en", cardView: "all", sel: ids.bravo });
    await P.ACTS["card-del"]();
    const up11 = P.S.undo !== null && home.node("#undo").hidden === false;
    P.S.sel = ids.delta; P.S.cardPage = null;
    if (name === "Restore") { await P.ACTS["card-retire"](); P.S.sel = ids.bravo; await P.ACTS["card-del"](); P.S.sel = ids.delta; }
    await press();
    check(up11 && P.S.undo === null && home.node("#undo").hidden === true,
      "pg11" + (name === "Retire" ? "a" : name === "Restore" ? "b" : "c") + " the bar goes at the next change that is not typing too: " + name + " on another card closes it");
  }
  fs.writeFileSync(draftAt(dir), bytes10);

  /* ---- 12. THE EDITOR'S CHIPS ---- */

  P.S.open = await wire(S.openProject(dir));
  const word = (P.S.open.tokens || [])[0], odd = "nic";
  const chips12 = P.chipsFor("{" + word + "} {" + odd + "}");
  check(!!word && (P.S.open.tokens || []).indexOf(odd) < 0
        && chips12.includes('<span class="chip">{' + word + '}</span>') && chips12.includes('<span class="chip err">{' + odd + '}</span>')
        && !chips12.includes('<span class="chip err">{' + word + '}</span>'),
    "pg12a the card editor's chips show a token the engine knows plain and a brace pair it does not know in the error class: "
    + chips12.replace(/<\/?div[^>]*>/g, ""));

  /* ---- 13. A WHOLE EDITION BACK INTO THE DRAFT, FROM THE ARCHIVE ---- */

  await wire(S.saveCard(dir, ids.delta, { note: { en: "typed since the last edition" } }));
  P.S.open = await wire(S.openProject(dir));
  const arch13 = await wire(S.archiveTimeline(dir));
  Object.assign(P.S, { screen: "project", section: "archive", lang: "en", arch: arch13, diff: null, pair: [], err: null,
    undo: null, cover: null, sent: "" });
  P.paintArchive();
  const a13 = home.node("#main").innerHTML;
  check(count(a13, 'data-act="arch-restore"') === arch13.editions.length && arch13.editions.length === 15
        && new RegExp('data-act="arch-export" data-e="' + published[4] + '">[^]*?</button><button class="btn sm" data-act="arch-restore" data-e="'
          + published[4] + '"><svg [^]*?</svg>Restore to the draft…</button></td>').test(a13),
    "pg13a markup: every edition's row offers Restore to the draft… beside Export, " + count(a13, 'data-act="arch-restore"') + " rows");
  const bytes13 = fs.readFileSync(draftAt(dir)), archive13 = treeHash(path.join(dir, ARCHIVE));
  const next13 = Math.max(...arch13.editions.map(e => e.rev)) + 1;
  await (P.ACTS["arch-restore"] || (() => null))({ getAttribute: (k) => k === "data-e" ? published[4] : null });
  const dlg13 = text(home.node("#dlg").innerHTML);
  check(P.S.cover === "restore-edition" && Buffer.compare(fs.readFileSync(draftAt(dir)), bytes13) === 0
        && dlg13 === "Restore rev 4 (" + published[4] + ") to the draft? The draft&#39;s cards, languages and other content"
          + " become this edition&#39;s. The catalog&#39;s id, rev, date and the lead&#39;s note stay as they are, and so does a"
          + " category rename not yet published. The next Publish"
          + " sends it out as a new edition, rev " + next13 + ". Nothing in the archive changes, and every edition already"
          + " published stays as it is. The restore can be undone from Changes, even after a later edit: the draft comes back"
          + " as it was just before the restore, its unpublished changes included. Restore to the draft Cancel"
        && /data-act="cover-close"/.test(home.node("#dlg").innerHTML) && /class="btn" data-act="arch-restore-go"[^]*class="btn solid" data-act="cover-close"/.test(home.node("#dlg").innerHTML),
    "pg13b markup: pressing it opens a cover saying what happens, the rev first and its edition after, and nothing is written"
    + " yet: " + JSON.stringify(dlg13));
  await (P.ACTS["arch-restore-go"] || (() => null))();
  const content = (c) => { const o = Object.assign({}, c); ["id", "rev", "date", "notes", "hash", "sig", "evaluation"].forEach(k => delete o[k]);
    return JSON.stringify(o); };
  const cat13 = JSON.parse(fs.readFileSync(path.join(dir, ARCHIVE, published[4], CATALOG_IN_ARCHIVE), "utf8"));
  const bar13 = text(home.node("#undo").innerHTML);
  check(content(draftOf(dir)) === content(cat13) && api.calls.indexOf("restoreEdition") >= 0 && P.S.cover === null
        && P.S.open.draft.cards.length === cat13.cards.length && P.S.undo && P.S.undo.bulk === true
        && home.node("#undo").hidden === false && bar13 === "Restored rev 4 (" + published[4] + ") to the draft. Undo Ctrl+Z",
    "pg13c confirming makes the draft rev 4's content on disk and on the page, closes the cover, and the undo bar says what"
    + " was done: " + JSON.stringify(bar13));
  check(treeHash(path.join(dir, ARCHIVE)) === archive13 && P.S.section === "archive",
    "pg13d the archive is the same by hash after it, and the screen stays on the Archive");
  await P.ACTS["card-undo"]();
  check(Buffer.compare(fs.readFileSync(draftAt(dir)), bytes13) === 0 && P.S.undo === null
        && P.S.open.draft.cards.find(c => c.id === ids.delta).note.en === "typed since the last edition",
    "pg13e pressing Undo puts the draft back byte for byte, the change typed since the last edition with it");
  const moved13 = (id) => ({ id, at: 0, was: { id, title: { en: "Was" } }, now: { id, title: { en: "Now" } } });
  const line13 = P.chgLine({ did: { kind: "rollback", edition: published[4], rev: 4 }, cards: [moved13(ids.delta), moved13(ids.bravo)] });
  const line13b = P.chgLine({ did: { kind: "rollback", edition: published[4], rev: null }, cards: [], other: { keys: ["langs"], was: {}, now: {} } });
  /* text() reads the page's no-break spaces (between a number and its word) as spaces */
  check(text(line13.line) === "Restored rev 4 (" + published[4] + ") to the draft." && text(line13.size) === "2 cards"
        && text(line13b.line) === "Restored edition " + published[4] + " to the draft." && line13b.size === "",
    "pg13f the Changes list names it by its rev and edition, or its edition where there is no rev, with the cards it moved: "
    + JSON.stringify([line13, line13b]));

  process.stdout.write("\ncard-life-page  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  if (asserted !== EXPECTED) {
    process.stderr.write("card-life-page  expected " + EXPECTED + " assertions, ran " + asserted + "\n");
    failed++;
  }
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "card-life-page");
  else process.stdout.write("card-life-page  kept " + SCRATCH + "\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("card-life-page  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
