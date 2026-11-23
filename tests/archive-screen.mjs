/* THE ARCHIVE ON THE SCREEN, AGAINST THE ARCHIVE AT THE COMMAND LINE.
 *
 *     node tests/archive-screen.mjs [--keep]
 *
 * THE CLAIM IS THAT THE DIFF ON THE SCREEN IS THE DIFF `node tools/diff.mjs` PRINTS, so the
 * measurement is both of them: a project is published three times with a known change between
 * each, two editions are picked in a real window, and the lines the pane shows are held against
 * the lines the command line writes to its own stdout - not against src/diff.mjs, which is what
 * both of them call and would therefore agree with either.
 *
 * THE EXPORT IS THE ROLLBACK PATH (spec 3.2: any rev exportable, the engine handles the rollback)
 * and a rollback that hands a desk nearly the right file is worse than none, so the exported
 * bytes are compared with the archived copy byte for byte AND read back through the pinned
 * engine's own loadCatalog. A file this repository can write and the engine cannot read would
 * pass a byte comparison with itself all day.
 *
 * WHAT THE ARCHIVE MUST NOT DO is change. Every edition's catalog is fingerprinted before the
 * window opens and again after everything below has run, because "immutable" is a property of
 * the folder rather than of the code that means well.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { openStudio } from "./shell-door.mjs";
import * as Engine from "../src/engine.mjs";
import { publishFull, json, editionsIn, PROJECT_FILE, DRAFT_FILE, ARCHIVE,
         CATALOG_IN_ARCHIVE } from "../src/publish.mjs";
import { parseDiffLine } from "../src/diff.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { pressWhen, settleOn } from "./press.mjs";
import * as S from "../src/studio.mjs";
import { loadPage } from "./page-stand-in.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "archive-screen");
const ID = "archive-catalog";

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sha = p => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex").slice(0, 16);

function catalogOf(F, n) {
  const shelf = { id: F.tagId("Greeting"), kind: "shelf", label: { en: "Greeting", pl: "Powitanie" } };
  const req = { id: F.tagId("Asked twice"), kind: "request",
                clause: { en: "asked twice", pl: "pytane dwa razy" } };
  const cards = [];
  for (let i = 1; i <= n; i++) cards.push({
    id: "c-" + i, shelf: shelf.id, requests: [req.id], bodyShape: "plain",
    title: { en: "Card " + i, pl: "Karta " + i },
    body: { en: "Widuma tosork sarnesk plasib " + i + ".",
            pl: "Widuma tosork sarnesk plasib " + i + "." },
  });
  const cat = {
    format: F.FORMAT, kind: F.KIND, id: ID, rev: 0,
    langs: [{ code: "en", label: "EN" }, { code: "pl", label: "PL" }],
    commentLang: "en", tags: [shelf, req], cards, minEngine: "2.0.0",
  };
  cat.hash = F.contentHash(cat);
  return cat;
}

function writeDraft(dir, catalog) {
  fs.writeFileSync(path.join(dir, DRAFT_FILE), json(catalog), "utf8");
}

/* COUNTS:PREDICATES
   Members that must be there, in order where the order is the claim.
   One more member still passes. A missing member is named. A floor stays
   where a scanner that saw nothing would otherwise pass. */
function missingMembers(seen, required, ordered) {
  const have = (seen || []).map(s => String(s));
  if (!ordered) return required.filter(name => have.indexOf(String(name)) < 0);
  let from = 0;
  const missing = [];
  for (const name of required) {
    const at = have.indexOf(String(name), from);
    if (at < 0) missing.push(name);
    else from = at + 1;
  }
  return missing;
}

const ARCHIVE_HEADS = ["What changes", "Was", "Becomes"];
function archiveHeadsHeld(heads) {
  const missing = missingMembers(heads, ARCHIVE_HEADS, true);
  if ((heads || []).length < ARCHIVE_HEADS.length) missing.push("columns under " + ARCHIVE_HEADS.length);
  return { ok: missing.length === 0, missing };
}
/* COUNTS:END */

/* UNDOING A RESTORE ASKS FIRST WHEN A LATER EDIT WOULD GO (the test architect's hold on S5).
   The count is the journal entries after the rollback. Yes drops them. No leaves the edit and
   its row. With none after the rollback, Undo acts at once, as it did. */
async function s5UndoHold() {
  let uN = 0, uFail = 0;
  const checkU = (cond, line) => {
    const was = failed;
    check(cond, line);
    uN++;
    if (failed !== was) uFail++;
  };
  try {
    const root = path.join(SCRATCH, "restore-ask");
    fs.mkdirSync(root, { recursive: true });
    const made = await S.newProject(root, "Restore ask");
    const dir = made.dir;
    const at = path.join(dir, DRAFT_FILE);
    await S.addTag(dir, "shelf", { en: "Shelf", pl: "Polka" });
    const shelf = JSON.parse(fs.readFileSync(at, "utf8")).tags[0].id;
    const card = await S.addCard(dir, shelf, "Card one", "Body at publish.");
    await publishFull({ project: dir, notes: "The first edition.", now: "2026-11-10T12:00:00.000Z" });
    await S.saveCard(dir, card.card.id, { body: { en: "Body typed before the restore." } });
    const eds = editionsIn(dir);
    const calls = [];
    const wire = (p) => Promise.resolve(p).then(
      (v) => JSON.parse(JSON.stringify(Object.assign({ error: null }, v))),
      (e) => ({ error: e && e.message ? e.message : String(e), said: (e && e.said) || null }));
    const api = {};
    for (const k of ["saveCard", "saveFacts", "changesSince", "undoChange"])
      api[k] = (...a) => { calls.push(k); return wire(S[k](...a)); };
    const home = loadPage({ api, uiLang: "en" });
    const P = home.page;
    const el = (attrs) => ({ getAttribute: (k) => (attrs[k] == null ? null : String(attrs[k])) });
    const plain = (html) => String(html || "").replace(/<[^>]*>/g, " ").replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
    const dlg = () => plain(home.node("#dlg").innerHTML);
    const bodyEn = () => {
      const d = JSON.parse(fs.readFileSync(at, "utf8"));
      const c = (d.cards || []).find((x) => x.id === card.card.id);
      return ((c && c.body) || {}).en || "";
    };
    const undos = () => calls.filter((k) => k === "undoChange").length;
    await S.restoreEdition(dir, eds[0]);
    Object.assign(P.S, {
      open: await wire(S.openProject(dir)), screen: "project", section: "changes",
      lang: "en", err: null, undo: null, cover: null, sent: "",
    });
    await P.chgLoad();
    const roll = (P.S.chg.list || []).find((e) => e.did && e.did.kind === "rollback");
    P.queueSave(card.card.id, { body: { en: "Body typed after the restore." } });
    await (P.ACTS["chg-undo"] || (() => null))(el({ "data-n": String(roll && roll.n) }));
    const asked = dlg();
    const sinceAsk = await S.changesSince(dir);
    const laterAsk = sinceAsk.list.filter((e) => roll && e.n > roll.n && e.n > 0);
    checkU(P.S.cover === "undo-restore"
      && asked.indexOf("Undoing this restore also drops the changes made after it: 1.") >= 0
      && asked.indexOf("Undo and drop the later changes") >= 0
      && asked.indexOf("Keep the later changes") >= 0
      && undos() === 0
      && bodyEn() === "Body typed after the restore."
      && laterAsk.length === 1,
      "s5ua restore, then one card edit, then Undo on the restore: a confirm names 1"
      + " and nothing is dropped: " + asked + " / " + bodyEn());
    const keep = P.ACTS["undo-restore-keep"];
    if (typeof keep === "function") await keep();
    const sinceNo = await S.changesSince(dir);
    const laterNo = sinceNo.list.filter((e) => roll && e.n > roll.n && e.n > 0);
    checkU(P.S.cover == null && dlg().indexOf("Undoing this restore") < 0
      && undos() === 0
      && bodyEn() === "Body typed after the restore."
      && laterNo.length === 1,
      "s5ub answered no, the later edit and its row stand");
    await (P.ACTS["chg-undo"] || (() => null))(el({ "data-n": String(roll && roll.n) }));
    checkU(undos() === 0 && dlg().indexOf("Undoing this restore also drops the changes made after it: 1.") >= 0
      && bodyEn() === "Body typed after the restore.",
      "s5uc the confirm is asked again, and still nothing is dropped");
    const go = P.ACTS["undo-restore-go"];
    if (typeof go === "function") await go();
    const sinceYes = await S.changesSince(dir);
    const laterYes = sinceYes.list.filter((e) => (e.cards || []).some((c) => c.now && c.now.body
      && c.now.body.en === "Body typed after the restore."));
    checkU(typeof go === "function" && undos() === 1
      && bodyEn() === "Body typed before the restore."
      && laterYes.length === 0
      && !sinceYes.list.some((e) => e.n === roll.n),
      "s5ud answered yes, the later edit and its row are dropped and the pre-restore draft is back: "
      + bodyEn());
    await S.restoreEdition(dir, eds[0]);
    Object.assign(P.S, { open: await wire(S.openProject(dir)) });
    await P.chgLoad();
    const roll2 = (P.S.chg.list || []).find((e) => e.did && e.did.kind === "rollback");
    const undosAt = undos();
    await (P.ACTS["chg-undo"] || (() => null))(el({ "data-n": String(roll2 && roll2.n) }));
    checkU(P.S.cover !== "undo-restore" && dlg().indexOf("Undoing this restore") < 0
      && undos() === undosAt + 1
      && bodyEn() === "Body typed before the restore.",
      "s5ue with no later edit, Undo acts at once and the draft is back: " + bodyEn()
      + " / cover " + P.S.cover);
    const Tbl = home.sandbox.STUDIO_T;
    Tbl.force("pl");
    const plSentence = Tbl.T("Undoing this restore also drops the changes made after it: {N}.", { N: 1 }).replace(/\u00a0/g, " ");
    const plYes = Tbl.T("Undo and drop the later changes");
    const plNo = Tbl.T("Keep the later changes");
    Tbl.force("en");
    checkU(plSentence === "Cofnięcie tego przywrócenia usuwa też zmiany wprowadzone po nim: 1."
      && plYes === "Cofnij i usuń późniejsze zmiany"
      && plNo === "Zostaw późniejsze zmiany"
      && !/\b(chcesz|twoje|twoją)\b/i.test(plSentence + " " + plYes + " " + plNo),
      "s5uf the Polish sentence and its two presses are Studio's imperative: " + plSentence
      + " | " + plYes + " | " + plNo);
  } catch (e) {
    checkU(false, "s5u the leg threw: " + (e && e.stack ? e.stack : e));
  }
  process.stdout.write("archive-screen-s5u  " + uN + " assertion(s), " + uFail + " failure(s)\n");
}

async function main(argv) {
  const keep = argv.indexOf("--keep") >= 0;
  clearScratch(SCRATCH);
  const projects = path.join(SCRATCH, "projects");
  const dir = path.join(projects, ID);
  fs.mkdirSync(dir, { recursive: true });
  const F = await Engine.format();

  /* Three editions of one project, each differing from the last in a way the diff has a word
     for: a card added, then a body changed and the card moved to another shelf. The clock is
     fixed so the editions are named by the engine's own rule and this leg can say which. */
  writeDraft(dir, catalogOf(F, 2));
  fs.writeFileSync(path.join(dir, PROJECT_FILE),
    json({ id: ID, rev: 0, edition: "", draft: DRAFT_FILE, folder: null }), "utf8");
  const NOW = "2026-09-17T10:00:00.000Z";
  await publishFull({ project: dir, notes: "The first one.", now: NOW });

  const second = catalogOf(F, 3);
  delete second.hash; second.hash = F.contentHash(second);
  writeDraft(dir, second);
  await publishFull({ project: dir, notes: "A third card.", now: NOW });

  const third = JSON.parse(JSON.stringify(second));
  third.tags.push({ id: F.tagId("Refunds"), kind: "shelf",
                    label: { en: "Refunds", pl: "Zwroty" } });
  third.cards[2].shelf = F.tagId("Refunds");
  third.cards[0].body.pl = "Widuma tosork sarnesk plasib jeden, i jeszcze jedno zdanie.";
  delete third.hash; third.hash = F.contentHash(third);
  writeDraft(dir, third);
  await publishFull({ project: dir, notes: "Moved one, and a longer Polish body.", now: NOW });

  const eds = editionsIn(dir);
  check(eds.length === 3, "0a three editions in the archive, named by the engine's own rule: "
    + eds.join(", "));
  const before = eds.map(e => sha(path.join(dir, ARCHIVE, e, CATALOG_IN_ARCHIVE)));

  /* ---- s5. a restore, then a later edit: Changes still reaches the pre-restore draft ---------
     Its own directory, so the window's archive fingerprint above is not this project's. The
     cover must not say the draft becomes exactly the edition, and a pending category rename is
     sent before the restore, so it is part of the draft Changes puts back and not part of the
     restored edition. */
  let s5n = 0, s5fail = 0;
  const checkS5 = (cond, line) => {
    const was = failed;
    check(cond, line);
    s5n++;
    if (failed !== was) s5fail++;
  };
  const wayRoot = path.join(SCRATCH, "restore-way");
  fs.mkdirSync(wayRoot, { recursive: true });
  const way = await S.newProject(wayRoot, "Restore way");
  const wayDir = way.dir;
  const wayAt = path.join(wayDir, DRAFT_FILE);
  await S.addTag(wayDir, "shelf", { en: "Shelf", pl: "Polka" });
  const wayShelf = JSON.parse(fs.readFileSync(wayAt, "utf8")).tags[0].id;
  const wayCard = await S.addCard(wayDir, wayShelf, "Card one", "Body before publish.");
  await publishFull({ project: wayDir, notes: "The first edition.", now: "2026-11-10T09:00:00.000Z" });
  await S.saveCard(wayDir, wayCard.card.id, { body: { en: "Body typed before the restore." } });
  const wayNoted = JSON.parse(fs.readFileSync(wayAt, "utf8"));
  wayNoted.notes = { en: "Lead note stays." };
  delete wayNoted.hash; delete wayNoted.sig;
  wayNoted.hash = F.contentHash(wayNoted);
  fs.writeFileSync(wayAt, json(wayNoted), "utf8");
  const wayPre = JSON.parse(fs.readFileSync(wayAt, "utf8"));
  const wayBare = (c) => {
    const o = Object.assign({}, c);
    ["id", "rev", "date", "notes", "hash", "sig", "evaluation"].forEach((k) => delete o[k]);
    return F.canonical(o);
  };
  const wayOwn = (c) => JSON.stringify({ id: c.id, rev: c.rev, date: c.date || null, notes: c.notes || null });
  const wayEds = editionsIn(wayDir);
  const wayCalls = [];
  const wayWire = (p) => Promise.resolve(p).then(
    (v) => JSON.parse(JSON.stringify(Object.assign({ error: null }, v))),
    (e) => ({ error: e && e.message ? e.message : String(e), said: (e && e.said) || null }));
  const wayApi = {
    restoreEdition: (...a) => { wayCalls.push("restoreEdition"); return wayWire(S.restoreEdition(...a)); },
    renameTag: (...a) => { wayCalls.push("renameTag"); return wayWire(S.renameTag(...a)); },
    saveCard: (...a) => { wayCalls.push("saveCard"); return wayWire(S.saveCard(...a)); },
    changesSince: (...a) => wayWire(S.changesSince(...a)),
    archiveTimeline: (...a) => wayWire(S.archiveTimeline(...a)),
  };
  const wayHome = loadPage({ api: wayApi, uiLang: "en" });
  const wayP = wayHome.page;
  const wayOpen = await wayWire(S.openProject(wayDir));
  const wayArch = await S.archiveTimeline(wayDir);
  Object.assign(wayP.S, {
    open: wayOpen, screen: "project", section: "archive", lang: "en", arch: wayArch,
    diff: null, pair: [], err: null, undo: null, cover: null, sent: "",
  });
  await (wayP.ACTS["arch-restore"] || (() => null))({ getAttribute: (k) => k === "data-e" ? wayEds[0] : null });
  const wayDlg = String(wayHome.node("#dlg").innerHTML).replace(/<[^>]*>/g, " ")
    .replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  checkS5(wayDlg.indexOf("exactly") < 0
        && wayDlg.indexOf("The catalog's id, rev, date and the lead's note stay as they are, and so does a category rename not yet published.") >= 0
        && wayDlg.indexOf("even after a later edit") >= 0,
    "s5a the cover promises only what stays true: id, rev, date and the lead's note stay as they are, and"
    + " Changes reaches the pre-restore draft after a later edit: " + wayDlg.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
  wayP.queueTagSave(wayShelf, "en", "Renamed shelf");
  await (wayP.ACTS["arch-restore-go"] || (() => null))();
  const wayRestored = JSON.parse(fs.readFileSync(wayAt, "utf8"));
  const wayEdition = JSON.parse(fs.readFileSync(path.join(wayDir, ARCHIVE, wayEds[0], CATALOG_IN_ARCHIVE), "utf8"));
  checkS5(wayCalls.indexOf("renameTag") >= 0 && wayCalls.indexOf("renameTag") < wayCalls.indexOf("restoreEdition")
        && wayBare(wayRestored) === wayBare(wayEdition)
        && wayOwn(wayRestored) === wayOwn(wayPre)
        && ((wayRestored.tags[0].label || {}).en) === "Shelf"
        && wayP.S.undo != null,
    "s5b the pending rename is sent first and does not land on the restored draft; id, rev, date"
    + " and the note stay, and the undo bar is up until a later edit: " + wayCalls.join(","));
  wayP.queueSave(wayCard.card.id, { body: { en: "Body typed after the restore." } });
  const wayFlushed = await wayP.flush();
  checkS5(wayFlushed === true && wayP.S.undo === null,
    "s5c a later edit drops the undo bar, which is deliberate");
  const waySince = await S.changesSince(wayDir);
  const wayRoll = waySince.list.find((e) => e.did && e.did.kind === "rollback");
  wayP.S.chg = Object.assign({}, waySince, { dir: wayDir });
  wayP.S.open = await wayWire(S.openProject(wayDir));
  wayP.paintChanges();
  const wayChanges = wayHome.node("#main").innerHTML;
  checkS5(!!wayRoll && wayChanges.indexOf('data-act="chg-undo"') >= 0
        && wayChanges.indexOf('data-n="' + wayRoll.n + '"') >= 0,
    "s5d Changes still shows Undo on the restore's row after that later edit");
  let wayUndone = null, wayUndoErr = "";
  try { wayUndone = await S.undoChange(wayDir, wayRoll && wayRoll.n); }
  catch (e) { wayUndoErr = e && e.message ? e.message : String(e); }
  const wayAfter = JSON.parse(fs.readFileSync(wayAt, "utf8"));
  const wayLabel = ((wayAfter.tags[0].label || {}).en) || "";
  const wayBody = ((wayAfter.cards.find((c) => c.id === wayCard.card.id) || {}).body || {}).en || "";
  checkS5(!wayUndoErr && !!wayUndone && wayOwn(wayAfter) === wayOwn(wayPre)
        && wayLabel === "Renamed shelf" && wayBody === "Body typed before the restore.",
    "s5e undoChange of that row puts the pre-restore draft back, the flushed rename included and"
    + " the later edit gone: " + (wayUndoErr || wayLabel + " / " + wayBody));
  process.stdout.write("archive-screen-s5  " + s5n + " assertion(s), " + s5fail + " failure(s)\n");
  await s5UndoHold();

  const sent = path.join(SCRATCH, "rolled-back.ec");
  const studio = await openStudio("tests/archive-screen.mjs", { words: true,
    projects, userDataDir: path.join(SCRATCH, "ud"),
    env: { STUDIO_TEST_SAVE: sent },
  });

  let timeline = null, onScreen = null, exported = null, summaryLine = "";
  try {
    const page = studio.page;
    const press = async (sel, ms) => {
      await pressWhen(page, sel, { who: "tests/archive-screen.mjs" });
      await sleep(ms || 350);
    };
    const state = async (js) => JSON.parse(await page.evaluate("JSON.stringify(" + js + ")"));

    await press('[data-act="open"][data-dir="' + dir.replace(/\\/g, "\\\\") + '"]', 900);
    await press('[data-act="section"][data-v="archive"]', 800);
    await settleOn(page, '(window.STUDIO_READY || {}).screen === "archive"', { bound: 30000 });

    timeline = await state(`Array.from(document.querySelectorAll('#main tr[data-act="arch-pick"]'))
      .map(tr => Array.from(tr.querySelectorAll("td")).slice(0, 4).map(td => td.textContent))`);
    check(timeline.length === 3
      && timeline[0][0] === "rev 3" && timeline[0][1] === eds[2] && timeline[2][1] === eds[0]
      && timeline[0][2] === "3"
      && timeline[2][3] === "The first one.",
      "1a the timeline lists every edition newest first, its rev before its dated edition (board 902), what it held and the"
      + " note written at the time: " + JSON.stringify(timeline));

    /* Two picked, in the wrong order on purpose: a diff reads from the older to the newer. */
    await press('tr[data-act="arch-pick"][data-e="' + eds[2] + '"]', 350);
    await press('tr[data-act="arch-pick"][data-e="' + eds[1] + '"]', 900);
    await settleOn(page, 'document.querySelectorAll("#main .pane:last-of-type tr td").length > 0', { bound: 30000 });
    const shown = await state(`{
      rows: Array.from(document.querySelectorAll("#main .pane:last-of-type tr"))
        .filter(tr => tr.querySelector("td"))
        /* a cut end fades on screen (.fo-l, .fo-r) where the command line prints three dots: read back as the dots */
        .map(tr => ({ cells: Array.from(tr.querySelectorAll("td")).map(td => (td.querySelector(":scope > .fo-l") ? "..." : "")
                        + td.textContent + (td.querySelector(":scope > .fo-r") ? "..." : "")),
                      title: tr.getAttribute("title") || "" })),
      heads: Array.from(document.querySelectorAll("#main .pane:last-of-type th"))
        .map(e => e.textContent),
      head: (document.querySelector("#main .pane:last-of-type h3") || {}).textContent || "",
      summary: (document.querySelector("#main .pad > .lede") || {}).textContent || "",
      sel: Array.from(document.querySelectorAll("#main tr.sel")).map(tr => tr.getAttribute("data-e")),
    }`);
    onScreen = shown.rows; summaryLine = shown.summary;
    check(shown.sel.length === 2 && shown.head === "What changes",
      "1b two rows picked and the pane is there without a button between: "
      + JSON.stringify(shown.sel));
    /* BOARD 479: the diff is shown in the Proposals renderer's three columns. The headings are
       that renderer's own words, and they are read off the screen rather than assumed. */
    const heads1 = archiveHeadsHeld(shown.heads);
    check(heads1.ok,
      "1c in the Proposals renderer's columns"
      + (heads1.missing.length ? ", missing " + heads1.missing.join(", ") : "")
      + ": " + JSON.stringify(shown.heads));

    /* ---- the export -------------------------------------------------------------------------- */
    await press('[data-act="arch-export"][data-e="' + eds[0] + '"]', 900);
    /* The export names a chip (board 976, item 11). The eye reads the last two steps; the whole
       path, which this holds to the file on disk, is the chip's data-path. */
    await settleOn(page, '((document.querySelector("#main .pad > .lede:last-of-type [data-ctx=path]") || {}).getAttribute("data-path") || "").trim() !== ""', { bound: 30000 });
    exported = await state(`(document.querySelector("#main .pad > .lede:last-of-type [data-ctx=path]") || {}).getAttribute("data-path") || ""`);
  } finally {
    await studio.shut();
  }
  await sleep(400);

  /* ---- the same diff at the command line ------------------------------------------------------ */

  const r = spawnSync(process.execPath, ["tools/diff.mjs", dir, eds[1], eds[2]],
    { cwd: ROOT, encoding: "utf8" });
  const out = String(r.stdout || "").split("\n");
  /* Its own two framing lines start at column 0 and every diff line is indented by two, which is
     how this reads the body out without knowing what is in it. */
  const cli = out.filter(l => /^ {2}\S/.test(l)).map(l => l.slice(2).replace(/\s+$/, ""));
  check(r.status === 1 && cli.length > 0,
    "2a node tools/diff.mjs printed " + cli.length + " line(s) and exited " + r.status
    + ", which is its code for \"they differ\"");
  /* THE COLUMNS ARE HELD TO THE LINES THEY WERE PARSED FROM, which is the whole claim of board
     479's second half: the screen shows the command line's own findings in three columns rather
     than a second account of the difference. Each row is put back together - what it changes,
     and where the line carried them, what it was and what it becomes - and compared with the
     command line's line under one collapse of whitespace, because the only thing the parse is
     allowed to lose is the column padding val() put in. */
  const flat = (v) => String(v).replace(/\s+/g, " ").trim();
  const rebuilt = onScreen.map(r => flat(r.cells[1]
    ? r.cells[0] + " " + r.cells[1] + " -> " + r.cells[2]
    : (r.cells[2] ? r.cells[0] + "  -> " + r.cells[2] : r.cells[0])));
  const want = cli.map(flat);
  const off = rebuilt.findIndex((l, i) => l !== want[i]);
  check(rebuilt.length === cli.length && off < 0,
    "2b and the pane's three columns put back together are those same lines, in that order ("
    + rebuilt.length + " row(s) against " + cli.length + " line(s))"
    + (off < 0 ? "" : "\n       screen: " + JSON.stringify(rebuilt[off])
      + "\n       cli:    " + JSON.stringify(want[off])));
  /* AND EVERY ROW CARRIES THE LINE IT CAME FROM, so a value the parser had to cut short - its
     one named ambiguity, a card's own text holding the separator - is still readable in full on
     the row itself. */
  const titles = onScreen.map(r => flat(r.title));
  const badTitle = titles.findIndex((t, i) => t !== want[i]);
  check(badTitle < 0, "2c with the line itself on every row as its tooltip"
    + (badTitle < 0 ? "" : ": " + JSON.stringify(titles[badTitle]) + " against "
      + JSON.stringify(want[badTitle])));
  /* THE PARSER, DRIVEN DIRECTLY OVER THE SAME LINES, so that what the screen showed and what
     the module does cannot be two different things: one parser, and this is it. */
  const parsed = cli.map(parseDiffLine);
  const mismatched = parsed.filter((p, i) => flat(p.line) !== want[i]
    || (p.was === null ? flat(p.what) !== want[i]
        : flat(p.what + " " + p.was + " -> " + p.becomes) !== want[i]));
  check(mismatched.length === 0 && parsed.some(p => p.was !== null)
        && parsed.some(p => p.was === null),
    "2d src/diff.mjs's own parser reads all " + parsed.length + " of the command line's lines"
    + " back into themselves, " + parsed.filter(p => p.was !== null).length + " of them carrying"
    + " values and " + parsed.filter(p => p.was === null).length + " not"
    + (mismatched.length ? ": " + JSON.stringify(mismatched[0]) : ""));

  check(/card\(s\) added/.test(summaryLine) && summaryLine === String(out.find(l => /^diff {2}\d+ card\(s\) added/.test(l)) || "").replace(/^diff {2}/, ""),
    "2e and the summary under it is the tool's own summary line: " + JSON.stringify(summaryLine));
  /* The two rows the fixture was built to produce, read off the SCREEN's own columns: the card
     that moved shelf, whose two sides are two shelf ids, and the body that changed, whose two
     sides are two excerpts of the text. */
  const moved = onScreen.filter(r => /^moved card/.test(flat(r.cells[0])));
  const changed = onScreen.filter(r => /^changed card c-1 body\.pl/.test(flat(r.cells[0])));
  check(moved.length === 1 && changed.length === 1
        && !!flat(moved[0].cells[1]) && !!flat(moved[0].cells[2])
        && !!flat(changed[0].cells[1]) && !!flat(changed[0].cells[2]),
    "2f including the card that moved shelf, from " + JSON.stringify(flat(moved[0].cells[1]))
    + " to " + JSON.stringify(flat(moved[0].cells[2])) + ", and the body that changed, with was"
    + " and becomes in their own columns: "
    + JSON.stringify(flat(changed[0].cells[1]).slice(0, 40)) + " -> "
    + JSON.stringify(flat(changed[0].cells[2]).slice(0, 40)));

  /* ---- the exported edition -------------------------------------------------------------------- */

  const archived = path.join(dir, ARCHIVE, eds[0], CATALOG_IN_ARCHIVE);
  check(exported === sent && fs.existsSync(sent),
    "3a the export wrote the file the picker named, and the screen says where it went: "
    + JSON.stringify(exported));
  check(Buffer.compare(fs.readFileSync(sent), fs.readFileSync(archived)) === 0,
    "3b byte for byte the archived catalog of " + eds[0] + " (sha256 " + sha(sent) + ")");
  const { loadCatalog, lintCatalog } = Engine.lint();
  let read = null, err = null;
  try { read = loadCatalog(sent); } catch (e) { err = e; }
  check(!!read && !err && read.cards.length === 2,
    "3c and the pinned engine reads it as the two-card catalog that edition was"
    + (err ? ": " + err.message : " (" + (read ? read.cards.length : 0) + " cards)"));
  check(lintCatalog(read).errors.length === 0,
    "3d with nothing for its lint to say about it");

  /* ---- the archive did not move ------------------------------------------------------------------ */

  const after = editionsIn(dir).map(e => sha(path.join(dir, ARCHIVE, e, CATALOG_IN_ARCHIVE)));
  check(after.join("|") === before.join("|"),
    "4a every archived edition is the bytes it was before the window opened, after a diff and an"
    + " export (" + after.join(", ") + ")");

  if (!keep) dropScratch(SCRATCH, "archive-screen");
  process.stdout.write("archive-screen  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("archive-screen  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
