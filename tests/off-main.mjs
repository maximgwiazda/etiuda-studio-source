/* THE WINDOW NEVER WAITS ON THE DISK, AND A QUEUE READ TWICE IS READ ONCE (sense pass 3, items
 * 19 and 20).
 *
 *     node tests/off-main.mjs [--keep]
 *
 * Studio's node half ran inside the window's own process, so a listing of a long inbox or a save
 * on a slow share held every other call and the window with it. Three claims, each of which
 * could be wrong:
 *
 *   1. src/studio.mjs's listProposals answers a second reading of an unchanged inbox from what
 *      it read the first time, answers exactly what a fresh reading would, and reads a file
 *      again when the file, the working copy or the review log has moved. Two listings asked
 *      at once read each file once, and the second still sees a file dropped between the asks.
 *   2. src/studio-thread.cjs, the door shell/main.js calls through, answers what the module
 *      answers, carries a refusal and a fault of the disk across whole, keeps the calls in the
 *      order they were made, and leaves the calling thread free while it works.
 *   3. In the window, a trivial call is answered while a long plan runs, and the cards of a
 *      project with a long inbox are on the screen before the inbox has been read. And the
 *      cards table is built once for a burst of typing and not at all for a pick between two
 *      cards (sense pass 3, item 31).
 *
 * THE FIXTURE IS THE GENERATOR'S: a seeded pile imported and published, and sixty desk files
 * made here, each changing three card bodies of the published edition.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as Engine from "../src/engine.mjs";
import { importCsv } from "../src/import.mjs";
import { publishFull, json, PROJECT_FILE, DRAFT_FILE } from "../src/publish.mjs";
import * as S from "../src/studio.mjs";
import { reviewProposal } from "../src/review.mjs";
import { openStudio } from "./shell-door.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "off-main");
const WHO = "the agent at desk 9";
const FILES = 60;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const readJson = p => JSON.parse(fs.readFileSync(p, "utf8"));
const ms = (t0) => Number((process.hrtime.bigint() - t0) / 1000000n);

/** A second instance of the module, with nothing read before: what a reading from scratch says. */
async function fresh() {
  return import(pathToFileURL(path.join(ROOT, "src", "studio.mjs")).href + "?fresh=" + Date.now()
    + Math.random());
}

async function main(argv) {
  const keep = argv.indexOf("--keep") >= 0;
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const F = await Engine.format();

  const pileAt = path.join(SCRATCH, "pile");
  const gen = spawnSync(process.execPath, ["tools/fixtures/generate.mjs", "--seed", "19",
    "--rows", "900", "--out", pileAt], { cwd: ROOT, encoding: "utf8" });
  if (gen.status !== 0) throw new Error("the generator refused: " + (gen.stderr || gen.stdout));
  const made = await importCsv({ file: path.join(pileAt, "macros.csv"), id: "long-inbox",
                                 name: "Long inbox" });

  /** A project with the pile published once and FILES desk files waiting in its inbox. */
  async function plant(name) {
    const dir = path.join(SCRATCH, "projects", name);
    fs.mkdirSync(path.join(dir, S.INBOX), { recursive: true });
    fs.writeFileSync(path.join(dir, DRAFT_FILE), json(made.catalog), "utf8");
    fs.writeFileSync(path.join(dir, PROJECT_FILE), json({ id: made.catalog.id, name: "Long inbox "
      + name, rev: 0, edition: "", draft: DRAFT_FILE, folder: null }), "utf8");
    const pub = await publishFull({ project: dir, folder: path.join(SCRATCH, "share-" + name),
                                    notes: "first", now: "2026-09-24T09:00:00" });
    const edition = readJson(pub.ec);
    for (let i = 0; i < FILES; i++) writeDesk(dir, i, edition, 3);
    return { dir, edition };
  }
  /** Desk i's export of `edition`, changing `n` bodies, as the engine's export wrote one before
      ecd66dd, keeping the origin's id and rev. The pinned engine's export mints a new id and is
      read as a different catalog; whether it should be is open ruling R1. */
  function writeDesk(dir, i, edition, n) {
    const p = JSON.parse(JSON.stringify(edition));
    for (let j = 0; j < n; j++) {
      const c = p.cards[(i * 7 + j * 13) % p.cards.length];
      c.body = Object.assign({}, c.body, { en: c.body.en + " Edited at desk " + i + "." });
    }
    p.modified = true;
    delete p.hash; delete p.sig; p.hash = F.contentHash(p);
    const at = path.join(dir, S.INBOX, "desk-" + String(i).padStart(3, "0") + ".ec");
    fs.writeFileSync(at, JSON.stringify(p), "utf8");
    return { at, doc: p };
  }
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  /* ---- 1. THE LISTING, READ ONCE ------------------------------------------------------------ */

  const one = await plant("node");
  let t = process.hrtime.bigint();
  const first = await S.listProposals(one.dir);
  const firstMs = ms(t);
  t = process.hrtime.bigint();
  const second = await S.listProposals(one.dir);
  const secondMs = ms(t);
  check(first.proposals.length === FILES && first.proposals.every(p => p.ok && p.changes === 3),
    "1 CONTROL: the inbox lists " + first.proposals.length + " files of three changes each");
  check(secondMs * 4 <= firstMs,
    "1a a second reading of an unchanged inbox takes a quarter of the first or less: "
    + secondMs + " ms against " + firstMs + " ms");
  const again1 = await fresh();
  check(same(second, await again1.listProposals(one.dir)),
    "1b and says exactly what a reading from scratch says");
  /* THE ORACLE IS THE REVIEW OF EACH FILE ON ITS OWN, which is what a listing was before it
     kept anything: every count on every row, file by file. */
  const alone = [];
  for (const p of second.proposals) {
    const r = await reviewProposal({ project: one.dir, file: p.file, rules: [], write: false });
    alone.push([p.name, r.ok, r.changes.length, r.pending.length, r.known.length, r.reworded,
                !!r.foreign, r.proposal.rev]);
  }
  check(same(alone, second.proposals.map(p => [p.name, p.ok, p.changes, p.pending, p.known,
    p.reworded, p.foreign, p.rev])),
    "1g and each row counts what reviewing its file on its own counts, over "
    + alone.length + " files");

  const again = writeDesk(one.dir, 7, one.edition, 4);
  const moved = await S.listProposals(one.dir);
  const seven = moved.proposals.find(p => p.name === "desk-007.ec");
  check(seven && seven.changes === 4 && same(moved, await (await fresh()).listProposals(one.dir)),
    "1c a file rewritten between two readings is read again: desk-007 now proposes "
    + (seven && seven.changes) + " changes");

  /* The working copy takes desk 10's first change exactly, so that row is no longer a change. */
  const ten = readJson(path.join(one.dir, S.INBOX, "desk-010.ec"));
  const tenCard = ten.cards[(10 * 7) % ten.cards.length];
  await S.saveCard(one.dir, tenCard.id, { body: { en: tenCard.body.en } });
  t = process.hrtime.bigint();
  const saved = await S.listProposals(one.dir);
  const savedMs = ms(t);
  const tenRow = saved.proposals.find(p => p.name === "desk-010.ec");
  check(tenRow && tenRow.changes === 2 && same(saved, await (await fresh()).listProposals(one.dir)),
    "1d a save in the working copy is read: desk-010 now proposes " + (tenRow && tenRow.changes)
    + " changes, as a reading from scratch says");
  check(savedMs * 3 <= firstMs,
    "1e and the reading after a save takes a third of the first or less: " + savedMs
    + " ms against " + firstMs + " ms");

  /* Desk 21 proposes what desk 20 proposes; a verdict on one row of desk 20 is remembered. */
  fs.copyFileSync(path.join(one.dir, S.INBOX, "desk-020.ec"),
                  path.join(one.dir, S.INBOX, "desk-020-twin.ec"));
  await S.listProposals(one.dir);
  const opened = await S.openProposal(one.dir, path.join(one.dir, S.INBOX, "desk-020.ec"), {});
  const decided = await S.decideProposal(one.dir, path.join(one.dir, S.INBOX, "desk-020.ec"),
    { [opened.changes[0].key]: "reject" }, WHO, null);
  const logged = await S.listProposals(one.dir);
  const twin = logged.proposals.find(p => p.name === "desk-020-twin.ec");
  check(decided.ok && twin && twin.known === 1 && twin.pending === 2
    && same(logged, await (await fresh()).listProposals(one.dir)),
    "1f a verdict in the review log is read: the twin file now has " + (twin && twin.known)
    + " row decided before and " + (twin && twin.pending) + " waiting");
  void again;

  /* TWO LISTINGS ASKED AT ONCE READ EACH FILE ONCE: the queue screen pressed while the corner's
     count is still being read. Reads are fs.promises.readFile calls on a path in the inbox. */
  const twice = await plant("twice");
  const inboxAt = path.join(twice.dir, S.INBOX);
  const reads = new Map();
  const readFile = fs.promises.readFile;
  fs.promises.readFile = function (f, ...rest) {
    if (typeof f === "string" && path.dirname(f) === inboxAt)
      reads.set(path.basename(f), (reads.get(path.basename(f)) || 0) + 1);
    return readFile.call(this, f, ...rest);
  };
  let early = null, late = null;
  try {
    const cold2 = await fresh();
    const asked = cold2.listProposals(twice.dir);
    const until = Date.now() + 30000;
    while (reads.size === 0 && Date.now() < until) await sleep(1);
    writeDesk(twice.dir, 900, twice.edition, 2);
    [early, late] = await Promise.all([asked, cold2.listProposals(twice.dir)]);
  } finally {
    fs.promises.readFile = readFile;
  }
  const has = (r, n) => r.proposals.some(p => p.name === n);
  check(reads.size > 0 && !has(early, "desk-900.ec") && early.proposals.length === FILES,
    "1h CONTROL: desk-900 is dropped after the first listing has read the folder, and it is not"
    + " on that listing");
  const readTwice = Array.from(reads).filter(([, n]) => n > 1).map(([f, n]) => f + " x" + n);
  check(reads.size === FILES + 1 && readTwice.length === 0,
    "1h the two listings read " + reads.size + " files between them and none twice: "
    + (readTwice.slice(0, 3).join(", ") || "none") + (readTwice.length > 3 ? ", ..." : ""));
  check(has(late, "desk-900.ec") && same(late, await (await fresh()).listProposals(twice.dir)),
    "1i the second listing holds desk-900, and says exactly what a reading from scratch says");

  /* ---- 2. THE THREAD ------------------------------------------------------------------------ */

  let thread = null;
  try { thread = createRequire(import.meta.url)("../src/studio-thread.cjs"); }
  catch (e) { thread = null; }
  check(!!thread && typeof thread.call === "function",
    "2 CONTROL: src/studio-thread.cjs is the door and it has a call()");
  if (thread) {
    const root = path.join(SCRATCH, "projects");
    check(same(await thread.call("listProjects", root), S.listProjects(root)),
      "2a a call through the thread answers what the module answers");
    const missing = path.join(SCRATCH, "no-such-project");
    let direct = null, across = null;
    try { await S.openProject(missing); } catch (e) { direct = e; }
    try { await thread.call("openProject", missing); } catch (e) { across = e; }
    check(direct && across && across instanceof Error && across.message === direct.message
      && same(across.said, direct.said),
      "2b a refusal crosses whole, frame and variables: " + JSON.stringify(across && across.said
        && across.said.frame));
    const ro = await plant("read-only");
    const draftAt = path.join(ro.dir, DRAFT_FILE);
    const card = made.catalog.cards[1];
    fs.chmodSync(draftAt, 0o444);
    let fault = null;
    try { await thread.call("saveCard", ro.dir, card.id, { body: { en: "Ustuma." } }); }
    catch (e) { fault = e; }
    fs.chmodSync(draftAt, 0o666);
    check(fault && typeof fault.code === "string" && fault.path === draftAt,
      "2c a fault of the disk keeps its code and its path, which the shell says it by: "
      + (fault && fault.code) + " at " + (fault && fault.path));
    const order = [];
    const saving = thread.call("saveCard", ro.dir, card.id, { body: { en: "Ustuma thelork." } })
      .then(() => order.push("save"));
    const reading = thread.call("openProject", ro.dir).then((r) => {
      order.push("open");
      return r.draft.cards.find(c => c.id === card.id).body.en;
    });
    const body = await reading; await saving;
    check(order.join(",") === "save,open" && body === "Ustuma thelork.",
      "2d calls are answered in the order they were made: " + order.join(",") + ", and the"
      + " open sees the save");
    /* A reading nobody has cached: a copy of the project, so the listing starts from nothing. */
    const cold = await plant("cold");
    const slow = await plant("slow");
    const done = [];
    const listing = thread.call("listProposals", slow.dir).then(() => done.push("list"));
    await sleep(40);
    await thread.call("saveCard", ro.dir, card.id, { body: { en: "Ustuma glemor." } })
      .then(() => done.push("save"));
    await listing;
    check(done.join(",") === "save,list",
      "2f a save asked for while a long listing reads is answered first: " + done.join(","));
    let gap = 0, last = Date.now();
    const tick = setInterval(() => { const n = Date.now(); gap = Math.max(gap, n - last); last = n; }, 5);
    t = process.hrtime.bigint();
    await thread.call("listProposals", cold.dir);
    const coldMs = ms(t);
    clearInterval(tick);
    check(coldMs > 150 && gap < 60,
      "2e while the thread reads " + FILES + " files for " + coldMs + " ms, the calling thread"
      + " is never held longer than " + gap + " ms");
  }

  /* ---- 3. THE WINDOW ----------------------------------------------------------------------- */

  /* A plan of two thousand rows is the longest single act the importer has: seconds of work
     with no pause in it, which is what held the window while it ran in the window's process. */
  const bigAt = path.join(SCRATCH, "big-pile");
  const big = spawnSync(process.execPath, ["tools/fixtures/generate.mjs", "--seed", "20",
    "--rows", "2000", "--out", bigAt], { cwd: ROOT, encoding: "utf8" });
  if (big.status !== 0) throw new Error("the generator refused: " + (big.stderr || big.stdout));
  const win = await plant("window");
  /* The plan takes only the file the picker answered (src/chosen.cjs), so the file is picked
     first, through STUDIO_TEST_FILE, as the wizard picks it. */
  const studio = await openStudio("tests/off-main.mjs", { words: true,
    projects: path.join(SCRATCH, "projects"), userDataDir: path.join(SCRATCH, "ud"),
    env: { STUDIO_TEST_FILE: path.join(bigAt, "macros.csv") } });
  try {
    const page = studio.page;
    const planned = await page.evaluate(async () => {
      const file = (await window.STUDIO.importPick("3a")).file;
      const t0 = performance.now();
      const plan = window.STUDIO.importPlan(file, {}, "");
      await new Promise(r => setTimeout(r, 60));
      const s = performance.now();
      /* A CALL THE WINDOW'S PROCESS ANSWERS ALONE. host() was that until 6412866 (2026-10-04) put the open
         tabs into it, read by openTabs on the thread, so it now waits behind the plan in the thread's queue
         by design (calls are answered in order, 2d) while this process stays free; the page asks host() once,
         at boot. The signing key's row is read by this process alone, so it still asks the question 3a is
         for: whether the window's process is held while the plan runs (found by the window run of
         2026-10-07 13:23, Claude α). */
      await window.STUDIO.signing();
      const hostMs = Math.round(performance.now() - s);
      const r = await plan;
      return { hostMs, planMs: Math.round(performance.now() - t0), rows: r && r.rows,
               error: r && r.error };
    });
    check(!planned.error && planned.planMs > 400 && planned.hostMs < 250,
      "3a a trivial call made while a " + planned.rows + "-row plan runs for " + planned.planMs
      + " ms is answered in " + planned.hostMs + " ms");
    const seen = await page.evaluate(async (dir) => {
      const row = Array.from(document.querySelectorAll('[data-act="open"]'))
        .find(x => x.getAttribute("data-dir") === dir);
      if (!row) return { none: true };
      const t0 = performance.now();
      let cardsAt = null, countAt = null, count = "";
      row.click();
      while (performance.now() - t0 < 60000 && countAt === null) {
        if (cardsAt === null && document.querySelectorAll("#main tr").length > 10)
          cardsAt = Math.round(performance.now() - t0);
        const n = document.querySelector('#rail a[data-v="proposals"] .num');
        if (n && n.textContent.trim()) { countAt = Math.round(performance.now() - t0); count = n.textContent; }
        await new Promise(r => setTimeout(r, 10));
      }
      return { cardsAt, countAt, count };
    }, win.dir);
    check(!seen.none && seen.cardsAt !== null && seen.countAt !== null
      && seen.cardsAt < seen.countAt,
      "3b opening a project with " + FILES + " files waiting, the cards are on the screen at "
      + seen.cardsAt + " ms, before the inbox is read at " + seen.countAt + " ms");
    check(seen.count === FILES + " files",
      "3c and the rail then counts the inbox: " + JSON.stringify(seen.count));

    /* A TABLE BUILT is counted as a <table> put into #main, by an observer set before the keys. */
    await page.evaluate(() => {
      window.__tables = 0;
      new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.nodeType === 1 && (n.tagName === "TABLE" || n.querySelector("table")))
          window.__tables++;
      }))).observe(document.querySelector("#main"), { childList: true, subtree: true });
    });
    await page.focus("#q");
    await page.keyboard.type("ustuma", { delay: 40 });
    await sleep(600);
    const typed = await page.evaluate(() => ({ tables: window.__tables,
      rows: document.querySelectorAll("#main tr.pick").length }));
    check(typed.tables <= 1,
      "3d six keys typed 40 ms apart build the cards table " + typed.tables + " time(s), and it"
      + " then holds " + typed.rows + " rows");
    await page.evaluate(() => { const q = document.querySelector("#q"); q.value = "";
      q.dispatchEvent(new Event("input", { bubbles: true })); });
    await sleep(600);
    const picked = await page.evaluate(async () => {
      const rows = () => Array.from(document.querySelectorAll("#main tr.pick"));
      rows()[1].click();
      await new Promise(r => setTimeout(r, 300));
      const table = document.querySelector("#main table");
      window.__tables = 0;
      const second = rows()[4];
      second.click();
      await new Promise(r => setTimeout(r, 300));
      const title = (document.querySelector("#cardEditor h3") || {}).textContent || "";
      return { same: document.querySelector("#main table") === table, tables: window.__tables,
               sel: rows().filter(r => r.classList.contains("sel")).map(r => r.getAttribute("data-id")),
               want: second.getAttribute("data-id"),
               title, cell: second.querySelector(".t-title").textContent };
    });
    check(picked.same && picked.tables === 0 && picked.sel.length === 1
      && picked.sel[0] === picked.want && picked.title.indexOf(picked.cell) === 0,
      "3e a pick from one card to another leaves the table as it was, moves the mark and opens"
      + " the card: " + JSON.stringify(picked));
  } finally {
    await studio.shut();
  }

  if (!keep) dropScratch(SCRATCH, "off-main");
  process.stdout.write("off-main  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("off-main  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
