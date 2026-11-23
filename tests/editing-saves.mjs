/* AN EDIT A PERSON MAKES IN STUDIO IS SAVED, OR THEY ARE TOLD IT WAS NOT (the Studio editing review of 2026-11-22, four
 * findings of class B and two of class D, each verified on the real source by the test architect's junior u).
 *
 *     node tests/editing-saves.mjs [--keep]
 *
 * THE CRITERION, one sentence for every leg below: no save is reverted, dropped or written into the wrong place without a word.
 * The page runs on tests/page-stand-in.mjs over the real verbs of src/studio.mjs, answered one at a time as
 * src/studio-thread-body.mjs answers them, on scratch projects; the two Studios are two node processes.
 *
 *   esv1a two processes saving one project, one by a card and one by a tag, back to back, revert nothing of each other's
 *   esv1b writeWhole told what the caller read refuses, and leaves the file, when the file is no longer that
 *   esv1c another Studio holding the draft's lock for a moment makes a save wait and then land, never overwrite
 *   esv1d a lock that never lets go is a refusal the page holds the edit for, in a sentence with a Polish line; the file is untouched
 *   esv1e CONTROL: a lock left by a Studio that died is broken, and the save lands
 *   esv1f a stale lock that cannot be broken (something inside it) is a refusal naming the lock folder, not "another copy is saving"
 *   esv2a every fault a write can meet is marked as the disk's, so the page keeps the edit; a refusal and a plain error are not
 *   esv2b a card save the disk faulted on is kept for the next one, and a close holds for it
 *   esv2c a card save refused for another reason holds the close once, and the close after it goes through
 *   esv3  quick facts the disk refused in one project are kept beside the next project's, and both are saved
 *   esv3b quick facts typed in one project and then another, with nothing sent between (the page moved by a way that flushes nothing), are both saved
 *   esv4a a variable edited while its project's folder is being renamed (slower than the debounce) lands in the new folder
 *   esv4b a card edited the same way lands in the new folder
 *   esv4c a variable edited in one project and another opened inside the debounce is saved in both
 *   esv4d variables the disk refused in one project are kept beside the next project's, and both are saved
 *   esv4e the same for a variable
 *   esv4f (esv7) Undo of a bulk change in one Studio, after another Studio saved a card, puts back the bulk's cards and not the other's
 *   esv5a one place of "replace with nothing" cannot be undone once its field was rewritten; the whole-field undo and the
 *         ordinary place still can
 *   esv5b a draft name that is not one plain segment refuses every verb and writes nothing outside the folder
 *   esv6  every leg ran
 *
 * WHAT IT CANNOT SEE, said rather than implied: two Studios on two computers over a share (the lock is one directory made at
 * once, which a share keeps, and the leg is two processes on one disk), the window itself closing, and the screen.
 *
 * PROVED BY MAKING IT FAIL, in a scratch copy of the tree (tests/plant-copy.mjs): the compare before the rename taken out
 * (esv-stale) reddens esv1a and esv1b; the lock taken out (esv-lock) reddens esv1c; the retry taken out (esv-retry) reddens esv1a; and
 * so on down the list at the foot of main(). ETIUDA_PLANTS=off skips them and counts each.
 *
 * Node only, no window, no Electron. Exit 0 when every check holds, 1 when any fails.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import path from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as S from "../src/studio.mjs";
import { diskRefusal, refuse } from "../src/refusal.mjs";
import { DRAFT_FILE } from "../src/publish.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { loadPage } from "./page-stand-in.mjs";
import { copyPlants } from "./plant-copy.mjs";
import { writeWhole } from "../src/whole-write.cjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SELF = fileURLToPath(import.meta.url);
const SCRATCH = path.join(ROOT, "scratch", "editing-saves");
const EXPECTED = 43;
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const SAVES = 60;
const STUCK_FRAME = "Studio could not remove the folder {LOCK}, left behind by a copy of Studio that stopped while saving, so this change is not written yet. Nothing is lost: it stays here, and once that folder is deleted, it is written with the next change or on leaving this catalog.";
const STALE_FRAME = "Another copy of Studio is saving this catalog at the same moment, in {DIR}, so this change is not written yet. Nothing is lost: it stays here and is written with the next change, or on leaving this catalog.";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = JSON.stringify;
const readJson = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const draftOf = (dir) => readJson(path.join(dir, DRAFT_FILE));
const cardText = (dir, id) => ((draftOf(dir).cards.find((c) => c.id === id) || {}).body || {}).en;
const labelOf = (dir, id) => ((draftOf(dir).tags.find((t) => t.id === id) || {}).label || {}).en;

/* The answer a verb gets in the shell: a thrown fault goes through diskRefusal and comes back as plain data (shell/main.js guard, bad). */
const wire = (p) => Promise.resolve(p)
  .then((v) => JSON.parse(JSON.stringify(Object.assign({ error: null }, v))))
  .catch((e) => { const d = diskRefusal(e); return { error: d && d.message ? d.message : String(d), said: (d && d.said) || null, disk: !!(d && d.disk) }; });

/* ---- the second Studio: a child process saving its own field of the one project, checking its last value survived ----------- */
async function child(argv) {
  const [dir, kind, id, tag, n] = argv;
  let reverted = 0, errors = 0, last = "";
  const ownNow = () => {
    for (let i = 0; i < 20; i++) {
      try {
        const d = readJson(path.join(dir, DRAFT_FILE));
        return kind === "card" ? ((d.cards.find((c) => c.id === id) || {}).body || {}).en : ((d.tags.find((t) => t.id === id) || {}).label || {}).en;
      } catch { /* a read met the other Studio's rename: asked again */ }
    }
    return "?";
  };
  for (let i = 1; i <= +n; i++) {
    if (last && ownNow() !== last) reverted++;
    last = tag + "-" + i;
    try {
      if (kind === "card") await S.saveCard(dir, id, { body: { en: last } });
      else await S.saveTag(dir, id, { text: { en: last } });
    } catch { errors++; }
  }
  process.stdout.write(J({ reverted, errors, last, mine: ownNow() }) + "\n");
}
if (process.argv[2] === "--child") { await child(process.argv.slice(3)); process.exit(0); }
/* The other Studio saving one card, once, from a process of its own (the read of 2026-11-22, H1). */
if (process.argv[2] === "--save") {
  const [dir, id, text] = process.argv.slice(3);
  await S.saveCard(dir, id, { body: { en: text } });
  process.exit(0);
}
/* The other Studio holding the lock, from a process of its own: a wait inside this process would stop its timers too. It lets go once the
   save has reached the lock (its temporary file stands beside the draft) or has already landed over it (the draft changed), then reads the
   draft just before it lets go and says whether it changed while held: a lock that holds keeps it as it was, one that does not has it
   changed, in every run and whatever the machine's speed (the test architect's read of 2026-11-22, the timing of esv1c). It lets go at
   `ms` at the latest. */
if (process.argv[2] === "--hold") {
  const [lock, ms, draft] = process.argv.slice(3);
  const base = path.basename(draft), dir = path.dirname(draft);
  const first = fs.readFileSync(draft, "utf8");
  fs.mkdirSync(lock);
  process.stdout.write("held" + String.fromCharCode(10));
  const t0 = Date.now();
  let seen = 0;
  const tick = setInterval(() => {
    let moved = false, reached = false;
    try { moved = fs.readFileSync(draft, "utf8") !== first; } catch { moved = true; }
    try { reached = fs.readdirSync(dir).some((n) => n.startsWith(base + ".") && n.endsWith(".tmp")); } catch { /* listed again */ }
    if (reached || moved) seen = seen || Date.now();
    if ((seen && Date.now() - seen >= 300) || Date.now() - t0 >= +ms) {
      clearInterval(tick);
      let changed = false;
      try { changed = fs.readFileSync(draft, "utf8") !== first; } catch { changed = true; }
      process.stdout.write((changed ? "changed" : "unchanged") + String.fromCharCode(10));
      try { fs.rmdirSync(lock); } catch { /* gone */ }
      process.exit(0);
    }
  }, 5);
  await new Promise(() => {});
}

/* ---- a page over the real verbs, one answered at a time ----------------------------------------------------------------- */
function pageOver(root, knob) {
  const k = knob || {};
  let q = Promise.resolve();
  const serial = (fn) => (q = q.then(fn, fn));
  const log = [];
  let closed = 0;
  const api = {
    open: (d) => serial(() => wire(S.openProject(d))),
    projects: () => serial(() => wire(S.listProjects(root))),
    proposals: (d) => serial(() => wire(S.listProposals(d))),
    cardHistory: (d, i) => serial(() => wire(S.cardHistory(d, i))),
    saveCard: (d, i, p) => serial(async () => {
      if (k.card) { const r = k.card(d, i, p); if (r) return r; }
      return wire(S.saveCard(d, i, p));
    }),
    saveFacts: (d, t) => serial(async () => {
      if (k.facts) { const r = k.facts(d, t); if (r) { log.push("facts REFUSED " + path.basename(d)); return r; } }
      log.push("facts " + path.basename(d) + "=" + t);
      return wire(S.saveFacts(d, t));
    }),
    saveVariables: (d, v) => serial(async () => {
      if (k.vars) { const r = k.vars(d, v); if (r) { log.push("vars REFUSED " + path.basename(d)); return r; } }
      log.push("vars " + path.basename(d));
      return wire(S.saveVariables(d, v));
    }),
    renameProject: (d, n) => serial(async () => {
      if (k.renameMs) await sleep(k.renameMs);
      log.push("rename " + path.basename(d) + "->" + n);
      return wire(S.renameProject(d, n));
    }),
    renameTag: (d, i, t) => serial(() => wire(S.renameTag(d, i, t))),
    discardUntouched: (d) => serial(() => wire(S.discardUntouched(d))),
    tabs: () => Promise.resolve({ error: null }),
    close: () => { closed++; },
  };
  const home = loadPage({ api, uiLang: k.lang || "en" });
  const P = home.page;
  P.S.host = { tour: { offered: true }, langs: S.builtLangs() };
  P.S.projects = S.listProjects(root).projects;
  return { P, home, api, log, closed: () => closed };
}
const refusedDisk = { error: "Could not write to the folder, because the drive it is on is full.", said: null, disk: true };
const hoursA = { list: [{ name: "SHOP", about: "when the shop answers", rules: [{ when: [], write: { en: "within the hour" } }] }] };
const hoursB = { list: [{ name: "SHOP", about: "when the shop answers", rules: [{ when: [], write: { en: "by tomorrow" } }] }] };
const varsOf = (dir) => draftOf(dir).variables || null;

const EXIT = { prevented: false, returnValue: true, preventDefault() { this.prevented = true; } };
const closeEvent = () => Object.assign({}, EXIT, { prevented: false, preventDefault() { this.prevented = true; } });

async function main(argv) {
  clearScratch(SCRATCH);
  let asserted = 0, failed = 0, skipped = 0;
  const check = (cond, line) => {
    asserted++;
    if (cond) process.stdout.write("  ok   " + line + "\n");
    else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
  };
  const skip = (line) => { skipped++; process.stdout.write("  skip " + line + "\n"); };
  const root = path.join(SCRATCH, "projects");
  fs.mkdirSync(root, { recursive: true });
  const L = [{ code: "en" }, { code: "pl" }];
  const mk = async (name) => {
    const p = await S.newProject(root, name, L);
    const shelf = (await S.addTag(p.dir, "shelf", { en: "General", pl: "Ogólne" })).tag.id;
    const shelf2 = (await S.addTag(p.dir, "shelf", { en: "Other", pl: "Inne" })).tag.id;
    const card = (await S.addCard(p.dir, shelf, "First card", "First body.")).card.id;
    const card2 = (await S.addCard(p.dir, shelf, "Second card", "Second body.")).card.id;
    return { dir: p.dir, shelf, shelf2, card, card2 };
  };

  /* ---- 1. TWO STUDIOS ON ONE PROJECTS ROOT ------------------------------------------------------------------------------ */
  {
    const pr = await mk("Shared project");
    const run = (kind, id, tag) => new Promise((res) => {
      const c = spawn(process.execPath, [SELF, "--child", pr.dir, kind, id, tag, String(SAVES)], { stdio: ["ignore", "pipe", "inherit"], windowsHide: true });
      let out = "";
      c.stdout.on("data", (d) => { out += d; });
      c.on("close", (code) => { let v = null; try { v = JSON.parse(out.trim()); } catch { /* shown below */ } res({ code, v }); });
    });
    const [a, b] = await Promise.all([run("card", pr.card, "A"), run("tag", pr.shelf2, "B")]);
    check(a.v && b.v && a.code === 0 && b.code === 0 && a.v.reverted === 0 && b.v.reverted === 0 && a.v.errors === 0 && b.v.errors === 0
          && cardText(pr.dir, pr.card) === "A-" + SAVES && labelOf(pr.dir, pr.shelf2) === "B-" + SAVES,
      "esv1a two Studios saving one project " + SAVES + " times each, one a card and one a tag, revert nothing of each other's and"
      + " refuse nothing: " + J({ a: a.v, b: b.v, card: cardText(pr.dir, pr.card), tag: labelOf(pr.dir, pr.shelf2) }));

    const f = path.join(SCRATCH, "whole.json");
    fs.writeFileSync(f, "other");
    let said = null;
    try { writeWhole(f, "mine", { was: Buffer.from("old") }); } catch (e) { said = e; }
    const left = fs.readFileSync(f, "utf8");
    writeWhole(f, "again", { was: Buffer.from("other") });
    check(said && said.stale === true && left === "other" && fs.readFileSync(f, "utf8") === "again"
          && fs.readdirSync(SCRATCH).filter((n) => /^whole\.json\./.test(n)).length === 0,
      "esv1b writeWhole told the bytes the caller read refuses a file that is no longer those, leaves it and no temporary beside it,"
      + " and writes where it still is: " + J({ stale: said && said.stale, left, after: fs.readFileSync(f, "utf8") }));

    const lockAt = path.join(pr.dir, DRAFT_FILE) + ".lock";
    const holder = spawn(process.execPath, [SELF, "--hold", lockAt, "1700", path.join(pr.dir, DRAFT_FILE)], { stdio: ["ignore", "pipe", "inherit"], windowsHide: true });
    let holderSaid = "";
    holder.stdout.on("data", (d) => { holderSaid += d; });
    await new Promise((res) => holder.stdout.once("data", res));
    const t0 = Date.now();
    const held = await wire(S.saveCard(pr.dir, pr.card2, { body: { en: "Landed after the lock." } }));
    const waited = Date.now() - t0;
    await new Promise((res) => (holder.exitCode !== null ? res() : holder.on("close", res)));
    const draftWhileHeld = holderSaid.trim().split(String.fromCharCode(10)).pop();
    check(!held.error && draftWhileHeld === "unchanged" && waited >= 250 && cardText(pr.dir, pr.card2) === "Landed after the lock." && !fs.existsSync(lockAt),
      "esv1c another Studio holding the draft's lock makes a save wait for it (the draft is as it was when the other Studio lets go, read by"
      + " that Studio, whatever the speed of the machine), and the save then lands: " + J({ waited, draftWhileHeld, error: held.error }));

    fs.mkdirSync(lockAt);
    const before = fs.readFileSync(path.join(pr.dir, DRAFT_FILE));
    const t1 = Date.now();
    const stuck = await wire(S.saveCard(pr.dir, pr.card2, { body: { en: "Must not land." } }));
    const cut = Date.now() - t1;
    const sentence = stuck.said && stuck.said.frame;
    const pl = loadPage({ api: {}, uiLang: "pl" }).page;
    check(stuck.error && stuck.disk === true && sentence === STALE_FRAME && Buffer.compare(before, fs.readFileSync(path.join(pr.dir, DRAFT_FILE))) === 0
          && cut >= 1000 && cut < 8000 && pl.T(STALE_FRAME) !== STALE_FRAME,
      "esv1d a lock that never lets go is a refusal marked as the disk's, so the page keeps the edit, in a sentence that has a Polish line,"
      + " the file untouched: " + J({ cut, disk: stuck.disk, sentence }));
    fs.rmdirSync(lockAt);

    fs.mkdirSync(lockAt);
    const old = new Date(Date.now() - 10 * 60 * 1000);
    fs.utimesSync(lockAt, old, old);
    const broke = await wire(S.saveCard(pr.dir, pr.card2, { body: { en: "After a dead Studio's lock." } }));
    check(!broke.error && cardText(pr.dir, pr.card2) === "After a dead Studio's lock." && !fs.existsSync(lockAt),
      "esv1e CONTROL: a lock left ten minutes ago by a Studio that died is broken, and the save lands: " + J({ error: broke.error }));
  }

  {
    const pr = await mk("Stuck lock");
    const lockAt = path.join(pr.dir, DRAFT_FILE) + ".lock";
    fs.mkdirSync(lockAt);
    fs.writeFileSync(path.join(lockAt, "left-behind"), "x");
    const old = new Date(Date.now() - 10 * 60 * 1000);
    fs.utimesSync(lockAt, old, old);
    const before = fs.readFileSync(path.join(pr.dir, DRAFT_FILE));
    const stuck = await wire(S.saveCard(pr.dir, pr.card, { body: { en: "Must not land." } }));
    const sentence = stuck.said && stuck.said.frame;
    const pl = loadPage({ api: {}, uiLang: "pl" }).page;
    check(stuck.error && stuck.disk === true && sentence === STUCK_FRAME && stuck.said.vars.LOCK === lockAt
          && Buffer.compare(before, fs.readFileSync(path.join(pr.dir, DRAFT_FILE))) === 0 && pl.T(STUCK_FRAME) !== STUCK_FRAME,
      "esv1f a lock too old to be a live Studio's that cannot be removed (something inside it) is a refusal marked as the disk's that names"
      + " the lock folder, with a Polish line, and not the sentence that says another Studio is saving; the file is untouched: " + J({ disk: stuck.disk, sentence, vars: stuck.said && stuck.said.vars }));
    fs.rmSync(path.join(lockAt, "left-behind"));
    fs.rmdirSync(lockAt);
  }

  /* ---- 2. A FAULT THE THREE FAMILIES DO NOT NAME ----------------------------------------------------------------------- */
  {
    const codes = ["EIO", "ETIMEDOUT", "ECONNRESET", "EMFILE", "EBADF", "EINVAL", "UNKNOWN", "ENFILE", "ENXIO"];
    const marked = codes.map((code) => {
      const e = Object.assign(new Error(code + ": raw"), { code, path: "Z:\\share\\draft.json" });
      const r = diskRefusal(e);
      return r.disk === true && r === e && !r.said;
    });
    const said = refuse("a card needs a title in {LANG}, the primary language this catalog declares", { LANG: "en" });
    const plain = new Error("TypeError-like");
    const argErr = Object.assign(new Error("bad arg"), { code: "ERR_INVALID_ARG_TYPE" });
    const known = diskRefusal(Object.assign(new Error("EPERM: raw"), { code: "EPERM", path: "Z:\\x" }));
    check(marked.every(Boolean) && !diskRefusal(said).disk && !diskRefusal(plain).disk && !diskRefusal(argErr).disk
          && known.disk === true && known.said && /read-only/.test(known.said.frame),
      "esv2a a fault of the system that none of the three sentences names (" + codes.join(", ") + ") is marked as the disk's with its own"
      + " words, so the page keeps the edit; a refusal and a plain error are not, and the three known ones keep their sentences: " + J(marked));

    const pr = await mk("Faulted project");
    const eio = () => wire(Promise.reject(Object.assign(new Error("EIO: i/o error, write"), { code: "EIO", path: path.join(pr.dir, DRAFT_FILE) })));
    let fault = true;
    const { P, closed } = pageOver(root, { card: () => (fault ? eio() : null) });
    await P.openDir(pr.dir);
    P.S.sel = pr.card;
    P.queueSave(pr.card, { body: { en: "Typed while the disk faulted." } });
    const flushed = await P.flush();
    const kept = P.__get("unsaved").size;
    const e1 = closeEvent();
    P.__get("leaveWindow")(e1);
    await sleep(60);
    check(flushed === false && kept === 1 && P.__get("saveRefused") === false && e1.prevented && closed() === 0,
      "esv2b a card save the disk faulted on (EIO) is kept for the next one, the bar says so, and a close holds for it instead of letting it go: "
      + J({ flushed, kept, prevented: e1.prevented, closed: closed() }));
    fault = false;
    const e2 = closeEvent();
    P.__get("leaveWindow")(e2);
    await sleep(120);
    check(cardText(pr.dir, pr.card) === "Typed while the disk faulted." && closed() === 1,
      "esv2b' CONTROL: the disk back, the next close sends the kept edit and closes: " + J({ now: cardText(pr.dir, pr.card), closed: closed() }));

    const pr2 = await mk("Refused project");
    const refusal = { error: "a card needs a title in en", said: { frame: "a card needs a title in {LANG}, the primary language this catalog declares", vars: { LANG: "en" } }, disk: false };
    const w = pageOver(root, { card: () => refusal });
    await w.P.openDir(pr2.dir);
    w.P.S.sel = pr2.card;
    w.P.queueSave(pr2.card, { title: { en: "" } });
    await w.P.flush();
    const r1 = closeEvent();
    w.P.__get("leaveWindow")(r1);
    await sleep(60);
    const r2 = closeEvent();
    w.P.__get("leaveWindow")(r2);
    await sleep(60);
    check(w.P.__get("saveRefused") === true && r1.prevented && w.closed() === 0 && (!r2.prevented || w.closed() === 1),
      "esv2c a card save refused for another reason (the edit snapped back, and the bar says so) holds the close once, with the sentence"
      + " on screen, and the close after it goes through: " + J({ first: r1.prevented, second: r2.prevented, closed: w.closed() }));
  }

  /* ---- 3. QUICK FACTS: ONE SLOT, AND THE NEXT PROJECT TAKES IT ------------------------------------------------------------ */
  {
    const A = await mk("Facts A"), B = await mk("Facts B");
    let full = true;
    const { P, log } = pageOver(root, { facts: () => (full ? refusedDisk : null) });
    await P.openDir(A.dir);
    P.queueFacts("A hours");
    await sleep(450);
    await P.openDir(B.dir);
    P.queueFacts("B hours");
    full = false;
    await sleep(500);
    await P.flushFacts();
    check(draftOf(A.dir).facts === "A hours" && draftOf(B.dir).facts === "B hours",
      "esv3 quick facts the disk refused in one project are kept beside the next project's, and once the disk is back both are saved: "
      + J({ a: draftOf(A.dir).facts, b: draftOf(B.dir).facts, log }));
  }

  /* ---- 3b. A MOVE TO ANOTHER PROJECT THAT SENDS NOTHING FIRST ----------------------------------------------------------------- */
  {
    const C = await mk("Facts C"), D = await mk("Facts D");
    const w = pageOver(root, {});
    await w.P.openDir(C.dir);
    w.P.queueFacts("C hours");
    w.P.S.open = await wire(S.openProject(D.dir));  /* the page is on another project by a way that flushes nothing, as a restored tab is */
    w.P.queueFacts("D hours");
    await sleep(500);
    check(draftOf(C.dir).facts === "C hours" && draftOf(D.dir).facts === "D hours",
      "esv3b quick facts typed in one project and then in another, with nothing sent between, are both saved: " + J({ c: draftOf(C.dir).facts, d: draftOf(D.dir).facts, log: w.log }));
  }

  /* ---- 4. VARIABLES AND CARDS WHILE A PROJECT'S FOLDER MOVES, AND WHEN THE PROJECT CHANGES -------------------------------- */
  {
    const A = await mk("Rename A");
    const { P, log } = pageOver(root, { renameMs: 600 });
    await P.openDir(A.dir);
    const named = P.__get("saveName")({ dir: A.dir, name: "Rename A moved" });
    await sleep(100);
    P.vrPut(hoursA);
    await named;
    await sleep(900);
    const moved = path.join(root, "Rename A moved");
    check(fs.existsSync(moved) && J(varsOf(moved)) === J(hoursA) && P.__get("saveRefused") === false && !P.S.err,
      "esv4a a variable edited while the folder is being renamed, which takes longer than the debounce, lands in the new folder and nothing"
      + " is said to have failed: " + J({ vars: varsOf(moved), refused: P.__get("saveRefused"), err: P.S.err, log }));

    const A2 = await mk("Rename C");
    const w = pageOver(root, { renameMs: 600 });
    await w.P.openDir(A2.dir);
    w.P.S.sel = A2.card;
    const named2 = w.P.__get("saveName")({ dir: A2.dir, name: "Rename C moved" });
    await sleep(100);
    w.P.queueSave(A2.card, { body: { en: "Typed during the rename." } });
    w.P.queueTagSave(A2.shelf2, "en", "Named during the rename");
    await named2;
    await sleep(900);
    const moved2 = path.join(root, "Rename C moved");
    check(cardText(moved2, A2.card) === "Typed during the rename." && labelOf(moved2, A2.shelf2) === "Named during the rename" && w.P.__get("saveRefused") === false,
      "esv4b a card and a category edited while the folder is being renamed land in the new folder: "
      + J({ text: fs.existsSync(moved2) ? [cardText(moved2, A2.card), labelOf(moved2, A2.shelf2)] : "no folder", log: w.log }));

    const X = await mk("Vars X"), Y = await mk("Vars Y");
    const t = pageOver(root, {});
    await t.P.openDir(X.dir);
    t.P.vrPut(hoursA);
    await t.P.openDir(Y.dir);
    const atOpen = J(varsOf(X.dir)) === J(hoursA);
    t.P.vrPut(hoursB);
    await sleep(500);
    check(atOpen && J(varsOf(X.dir)) === J(hoursA) && J(varsOf(Y.dir)) === J(hoursB),
      "esv4c a variable edited in one project, and another project opened inside the debounce, is sent as the project changes and"
      + " saved in both: " + J({ atOpen, x: varsOf(X.dir), y: varsOf(Y.dir), log: t.log }));

    const U = await mk("Vars U"), V = await mk("Vars V");
    let full = true;
    const h = pageOver(root, { vars: () => (full ? refusedDisk : null) });
    await h.P.openDir(U.dir);
    h.P.vrPut(hoursA);
    await sleep(450);
    await h.P.openDir(V.dir);
    h.P.vrPut(hoursB);
    full = false;
    await sleep(500);
    await h.P.flushVars();
    check(J(varsOf(U.dir)) === J(hoursA) && J(varsOf(V.dir)) === J(hoursB),
      "esv4d variables the disk refused in one project are kept beside the next project's, and once the disk is back both are saved: "
      + J({ u: varsOf(U.dir), v: varsOf(V.dir), log: h.log }));
  }

  {
    const E = await mk("Vars E"), F = await mk("Vars F");
    const w = pageOver(root, {});
    await w.P.openDir(E.dir);
    w.P.vrPut(hoursA);
    w.P.S.open = await wire(S.openProject(F.dir));
    w.P.vrPut(hoursB);
    await sleep(500);
    check(J(varsOf(E.dir)) === J(hoursA) && J(varsOf(F.dir)) === J(hoursB),
      "esv4e a variable edited in one project and then in another, with nothing sent between, is saved in both: " + J({ e: varsOf(E.dir), f: varsOf(F.dir), log: w.log }));
  }

  /* ---- 4f. A BULK CHANGE'S UNDO MUST NOT PUT BACK THE OTHER STUDIO'S SAVE ------------------------------------------------------ */
  {
    const pr = await mk("Bulk undo");
    const target = (await S.addCard(pr.dir, pr.shelf, "Target", "the cat sat")).card.id;
    const rows = (await S.findPlaces(pr.dir, { find: "cat" })).rows.filter((r) => r.id === target);
    /* The bulk starts and reads the draft; the other Studio then saves a card, from a process of its own; the bulk finds the draft
       stale, reads again and lands on the other's save. Its Undo must then give back the bulk, and keep the other's card. */
    const bulk = S.replacePlaces(pr.dir, { find: "cat", replace: "dog" }, rows.map((r) => r.key));
    execFileSync(process.execPath, [SELF, "--save", pr.dir, pr.card2, "B SAVED BY THE OTHER STUDIO"], { stdio: "ignore", windowsHide: true });
    await bulk;
    const landed = cardText(pr.dir, pr.card2) === "B SAVED BY THE OTHER STUDIO" && cardText(pr.dir, target) === "the dog sat";
    const undone = await wire(S.undoBulk(pr.dir));
    check(landed && !undone.error && cardText(pr.dir, target) === "the cat sat" && cardText(pr.dir, pr.card2) === "B SAVED BY THE OTHER STUDIO",
      "esv7 a bulk change that landed on another Studio's save is undone without taking that save back: " + J({ landed, error: undone.error,
        target: cardText(pr.dir, target), other: cardText(pr.dir, pr.card2) }));
  }

  /* ---- 5. THE TWO OF CLASS D ------------------------------------------------------------------------------------------------- */
  {
    const pr = await mk("Spots");
    const spot = async (label, body, to, later) => {
      const id = (await S.addCard(pr.dir, pr.shelf, "T " + label, body)).card.id;
      const rows = (await S.findPlaces(pr.dir, { find: "cat" })).rows.filter((r) => r.id === id);
      await S.replacePlaces(pr.dir, { find: "cat", replace: to }, rows.map((r) => r.key));
      if (later != null) await S.saveCard(pr.dir, id, { body: { en: later } });
      const ch = await S.changesSince(pr.dir);
      const e = ch.list.find((x) => x.did && x.did.kind === "replace" && x.cards.some((c) => c.id === id));
      const r = await wire(S.undoChange(pr.dir, e.n, 0));
      return { refused: !!(r.error || r.refused), now: cardText(pr.dir, id) };
    };
    const empty = await spot("empty", "the cat sat", "", "hello there");
    const plain = await spot("plain", "the cat sat", "dog", null);
    const emptyAlone = await spot("empty alone", "the cat sat", "", null);
    check(empty.refused && empty.now === "hello there" && !plain.refused && plain.now === "the cat sat" && !emptyAlone.refused && emptyAlone.now === "the cat sat",
      "esv5a one place of a replace with nothing cannot be undone once its field was rewritten (the text is left as it is), and an ordinary place,"
      + " and the empty one with nothing typed since, still undo: " + J({ empty, plain, emptyAlone }));

    const north = await mk("North lamps"), south = await mk("South lamps");
    const pj = path.join(north.dir, "project.json");
    const was = readJson(pj);
    const southBefore = fs.readFileSync(path.join(south.dir, DRAFT_FILE), "utf8");
    const verdicts = [];
    for (const bad of ["..\\South lamps\\draft.json", "../South lamps/draft.json", "sub/draft.json", "..", "."]) {
      fs.writeFileSync(pj, J(Object.assign({}, was, { draft: bad }), null, 1));
      let saved = "ok", opened = "ok";
      try { await S.saveCard(north.dir, south.card, { body: { en: "WROTE-FROM-NORTH" } }); } catch (e) { saved = "refused"; }
      try { await S.openProject(north.dir); } catch (e) { opened = "refused"; }
      verdicts.push(saved + "/" + opened);
    }
    fs.writeFileSync(pj, J(was, null, 1));
    const own = path.join(north.dir, "mine.draft.json");
    fs.renameSync(path.join(north.dir, DRAFT_FILE), own);
    fs.writeFileSync(pj, J(Object.assign({}, was, { draft: "mine.draft.json" }), null, 1));
    const okPlain = await wire(S.saveCard(north.dir, north.card, { body: { en: "Plain name." } }));
    check(verdicts.every((v) => v === "refused/refused") && fs.readFileSync(path.join(south.dir, DRAFT_FILE), "utf8") === southBefore
          && !okPlain.error && readJson(own).cards.find((c) => c.id === north.card).body.en === "Plain name.",
      "esv5b a draft name that is not one plain segment (two ways of going up, a subfolder, .., .) refuses a save and an open and writes nothing"
      + " outside the folder, and a plain name of its own still saves: " + J(verdicts));
  }

  /* ---- 8. THE WINDOW HIDES TO THE TRAY: the shell asks the page to send what waits, then lets go of the projects folder ---------------- */
  {
    const pr = await mk("Hidden project");
    const { P } = pageOver(root, {});
    await P.openDir(pr.dir);
    P.S.sel = pr.card;
    P.queueSave(pr.card, { body: { en: "Typed just before the window hid." } });
    const hold = P.__get("window.STUDIO_HOLD");
    const sent = hold && typeof hold.flush === "function" ? await hold.flush() : null;
    check(sent === true && cardText(pr.dir, pr.card) === "Typed just before the window hid." && !P.__get("pending") && P.__get("unsaved").size === 0,
      "esv8a the shell asks the page to send what waits before the window hides to the tray: an edit typed a moment before is on disk when the page answers yes, nothing is left waiting: "
      + J({ sent, text: cardText(pr.dir, pr.card) }));

    let fault = true;
    const eio = () => wire(Promise.reject(Object.assign(new Error("EIO: i/o error, write"), { code: "EIO", path: path.join(pr.dir, DRAFT_FILE) })));
    const page2 = pageOver(root, { card: () => (fault ? eio() : null) });
    await page2.P.openDir(pr.dir);
    page2.P.S.sel = pr.card;
    page2.P.queueSave(pr.card, { body: { en: "Typed while the disk faulted." } });
    const hold2 = page2.P.__get("window.STUDIO_HOLD");
    const sent2 = hold2 && typeof hold2.flush === "function" ? await hold2.flush() : null;
    check(sent2 === false && page2.P.__get("unsaved").size === 1 && cardText(pr.dir, pr.card) === "Typed just before the window hid.",
      "esv8b an edit the disk refused while the window hides is still kept for the next save (the page answers no and the shell lets go all the same): " + J({ sent2, kept: page2.P.__get("unsaved").size }));
    fault = false;

    const page3 = pageOver(root, {});
    let lists = 0;
    const api3 = page3.P.__get("API"), was3 = api3.projects;
    api3.projects = () => { lists++; return was3(); };
    page3.P.S.screen = "projects";
    const hold3 = page3.P.__get("window.STUDIO_HOLD");
    if (hold3 && typeof hold3.shown === "function") await hold3.shown();
    check(lists === 1,
      "esv8c a window shown again on the list reads the projects folder again (the shell took the hold, or found another Studio holding it, and the list says which): " + J({ lists }));
  }

  /* ---- 9. THE WINDOW IS SHOWN AFTER ANOTHER STUDIO TOOK THE FOLDER: an open catalog says so at once ---------------------------------- */
  {
    const pr = await mk("Taken meanwhile");
    const { P } = pageOver(root, {});
    await P.openDir(pr.dir);
    const hold = P.__get("window.STUDIO_HOLD");
    if (hold && typeof hold.shown === "function") await hold.shown(null);
    const stays = P.S.screen === "project" && !!P.S.open;
    const refused = { error: "Etiuda Studio on DESK-OF-ANA already has the folder open", said: { frame: "Etiuda Studio on {COMPUTER} already has {ROOT} open", vars: { COMPUTER: "DESK-OF-ANA", ROOT: root } }, disk: true };
    if (hold && typeof hold.shown === "function") await hold.shown(refused);
    check(stays && P.S.screen === "unopened" && !P.S.open && P.S.unopened && P.S.unopened.dir === pr.dir && !!P.S.unopened.err && P.S.tabs.some((t) => t.dir === pr.dir),
      "esv9 a window shown after another Studio took the folder, with a catalog open, puts that catalog out of reach with the sentence on it at once (its tab kept), and shown with the folder held nothing changes: "
      + J({ stays, screen: P.S.screen, unopened: P.S.unopened && P.S.unopened.dir }));
  }

  /* ---- PLANTS ----------------------------------------------------------------------------------------------------------- */
  copyPlants({
    root: ROOT, self: SELF, label: "editing-saves", onlyVar: "EDITING_SAVES_ONLY", check, skip, timeout: 240000,
    plants: [
      { mark: "esv-stale", leg: "esv1a", rel: "src/whole-write.cjs", line: "        void 0;" },
      { mark: "esv-lock", leg: "esv1c", rel: "src/whole-write.cjs", line: "      const unlock = () => {};" },
      { mark: "esv-retry", leg: "esv1a", rel: "src/studio.mjs", line: "      if (true) throw busy();" },
      { mark: "esv-any-fault", leg: "esv2a", rel: "src/refusal.mjs", line: "  if (!r) return e;" },
      { mark: "esv-close-refused", leg: "esv2c", rel: "ui/app.js", line: "    if (closeSent || !waiting) return;" },
      { mark: "esv-facts-kept", leg: "esv3b", rel: "ui/app.js", line: "    if (factsPending && factsPending.dir !== dir) void 0;" },
      { mark: "esv-vars-kept", leg: "esv4e", rel: "ui/app.js", line: "    if (varsPending && varsPending.dir !== dir) void 0;" },
      { mark: "esv-follow-vars", leg: "esv4a", rel: "ui/app.js", line: "    if (false) void 0;" },
      { mark: "esv-follow-card", leg: "esv4b", rel: "ui/app.js", line: "    if (false) void 0;" },
      { mark: "esv-open-vars", leg: "esv4c", rel: "ui/app.js", line: "    await flush(); await flushTag(); await flushProject(); await flushFacts();" },
      { mark: "esv-spot-empty", leg: "esv5a", rel: "src/studio.mjs", line: "      if ((one.id && !card) || text.slice(one.at, one.at + to.length) !== to)" },
      { mark: "esv-undo-landed", leg: "esv7", rel: "src/studio.mjs", line: "    if (o && o.seen) o.seen.raw = o.seen.raw || seen.raw;" },
      { mark: "esv-lock-stuck", leg: "esv1f", rel: "src/whole-write.cjs", line: "        l.locked = true;" },
      { mark: "esv-draft-name", leg: "esv5b", rel: "src/studio.mjs", line: "    if (false) return null;" },
      { mark: "esv-hold-flush", leg: "esv8a", rel: "ui/app.js", line: "    flush: async () => true," },
      { mark: "esv-hold-shown-open", leg: "esv9", rel: "ui/app.js", line: "    if (false) return;" },
      { mark: "esv-hold-shown", leg: "esv8c", rel: "ui/app.js", line: "    shown: async () => {}," },
    ],
  });

  check(asserted + skipped + 1 === EXPECTED,
    "esv6 every leg ran: " + (asserted + skipped + 1) + " of " + EXPECTED + (skipped ? ", " + skipped + " skipped" : ""));
  process.stdout.write("editing-saves: " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)"
    + (PLANTS_OFF ? " (ETIUDA_PLANTS=off)" : "") + "\n");
  process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + "\n");
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "editing-saves");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch((e) => {
  process.stdout.write("  FAIL tests/editing-saves.mjs threw: " + (e && e.stack || e) + "\n");
  process.exit(1);
});
