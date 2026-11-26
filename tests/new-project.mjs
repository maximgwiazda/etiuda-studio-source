/* A PROJECT FROM NOTHING, AND THE ENGINE READS WHAT IT MADE. Course node 10's last cover.
 *
 *     node tests/new-project.mjs [--keep]
 *
 * THE ORACLE IS THE PINNED ENGINE'S OWN READER, not Studio's opinion of its own file. A draft
 * Studio writes is meant to be bytes the engine would have written, so the leg hands the new
 * project's draft to `loadCatalog` out of the pinned `tests/test.js` and then to the pinned
 * `lintCatalog`, and reads the verdict back. Studio's own lint would agree with Studio by
 * construction and prove nothing.
 *
 * WHAT "LINTS CLEAN" CAN MEAN FOR AN EMPTY CATALOG, measured rather than assumed: the pinned
 * lint calls a catalog with no cards an error and one with no categories a warning. Both are
 * true of every empty catalog there has ever been and neither is about the file's shape, so the
 * claim this leg makes is the exact one that is available - the reader accepts it, and the lint
 * says those two things and nothing else. The half that makes that worth asserting is at the
 * foot: one card written into the same draft and the lint goes silent, which is what says the
 * two findings were about emptiness rather than about anything Studio wrote.
 *
 * THE REFUSALS ARE HALF THE PAGE. An empty name, and a name whose folder is already there, are
 * both refused, and both are asserted by looking at the projects folder afterwards rather than
 * at the message on the screen.
 *
 * New catalog was a cover until board 1019 (12) and is a page in its own tab since; the legs read
 * that page (#main .newcat) where they read the cover (#dlg), and close its tab where they closed it.
 */
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openStudio } from "./shell-door.mjs";
import * as Engine from "../src/engine.mjs";
import { PROJECT_FILE, DRAFT_FILE } from "../src/publish.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { pressWhen, settleOn } from "./press.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "new-project");
const NAME = "Zubynt ondrave";
const FOLDER = "Zubynt ondrave";

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const readJson = p => JSON.parse(fs.readFileSync(p, "utf8"));

async function main(argv) {
  const keep = argv.indexOf("--keep") >= 0;
  clearScratch(SCRATCH);
  const projects = path.join(SCRATCH, "projects");
  fs.mkdirSync(projects, { recursive: true });
  const F = await Engine.format();

  const studio = await openStudio("tests/new-project.mjs", { words: true,
    projects, userDataDir: path.join(SCRATCH, "ud"),
  });

  try {
    const page = studio.page;
    const press = async (sel, ms) => {
      await pressWhen(page, sel, { who: "tests/new-project.mjs" });
      await sleep(ms || 400);
    };
    const type = async (sel, v) => {
      await page.evaluate((s, value) => {
        const e = document.querySelector(s);
        e.value = value; e.dispatchEvent(new Event("input", { bubbles: true }));
      }, sel, v);
      await sleep(120);
    };

    const start = JSON.parse(await page.evaluate("JSON.stringify(window.STUDIO_READY)"));
    const none = await page.evaluate(() => !!document.querySelector("#main .none"));
    check(start.screen === "projects" && start.rows === 0 && none,
      "0a the window opens on an empty projects folder, naming it in place of a table ("
      + start.rows + " row)");

    await press('[data-act="new-tab"]', 500);
    await settleOn(page, '!!(document.querySelector("#main .newcat h1") || {}).textContent', { bound: 30000 });
    const cover = JSON.parse(await page.evaluate(`JSON.stringify({
      up: document.querySelector("#scrim").hidden && !!document.querySelector("#main .newcat"),
      h2: (document.querySelector("#main .newcat h1") || {}).textContent || "",
      lede: (document.querySelector("#main .newcat .lede") || {}).textContent || "",
      label: (document.querySelector("#main .newcat .kv .k") || {}).textContent || "",
      focused: document.activeElement ? document.activeElement.id : "",
      buttons: Array.from(document.querySelectorAll("#main .newcat .nc-acts button")).map(e => e.textContent),
    })`));
    check(cover.up && cover.h2 === "New catalog" && cover.label === "Catalog",
      "1a the New catalog page comes up in its tab, no cover, with the canvas's own heading and field label");
    check(/A catalog is one folder on disk/.test(cover.lede) && cover.focused === "newName",
      "1b saying what a project is, with the one field ready to type into");

    await press('[data-act="do-new"]', 400);
    check(fs.readdirSync(projects).length === 0,
      "1c pressing it with the field empty made no folder at all ("
      + fs.readdirSync(projects).length + " in the projects folder)");

    /* A NAME NO LONGER MINTS THE ID, so the one refusal a name can still meet is a folder already
       there; one is planted for it and taken away after 1e. */
    fs.mkdirSync(path.join(projects, "z"));
    await type("#newName", "Z");
    await press('[data-act="do-new"]', 500);
    await settleOn(page, '((document.querySelector("#main .newcat .kv .n") || {}).textContent || "").indexOf("already a folder") >= 0', { bound: 30000 });
    const refused = await page.evaluate(
      "(document.querySelector('#main .newcat .kv .n') || {}).textContent || ''");
    check(fs.readdirSync(projects).join(",") === "z" && /already a folder/.test(refused),
      "1d a name whose folder is already there is refused, and no other folder is made: "
      + JSON.stringify(String(refused).slice(0, 70)));

    /* WHAT WAS TYPED OUTLIVES A REPAINT of the page (sense pass item 14): the refusal above
       rebuilt it, and so does every press of the language row. */
    const field = async () => JSON.parse(await page.evaluate(`JSON.stringify({
      name: (document.querySelector("#newName") || {}).value,
      code: (document.querySelector("#newProjLang") || {}).value,
      langs: Array.from(document.querySelectorAll("#main .newcat .ls .lsk")).map(e => e.textContent) })`));
    const afterRefusal = await field();
    check(afterRefusal.name === "Z",
      "1e the refused name is still in its field to be corrected: " + JSON.stringify(afterRefusal.name));
    fs.rmdirSync(path.join(projects, "z"));
    await type("#newName", NAME);
    await type("#newProjLang", "uk");
    await press('[data-act="new-lang-add"]', 400);
    await settleOn(page, 'Array.from(document.querySelectorAll("#main .newcat .ls .lsk")).some(p => p.textContent.indexOf("UK") >= 0)', { bound: 30000 });
    const added = await field();
    await press('[data-act="new-lang-rm"][data-v="uk"]', 400);
    const removed = await field();
    check(added.name === NAME && added.langs.join(",") === "EN,PL,UK" && added.code === ""
          && removed.name === NAME && removed.langs.join(",") === "EN,PL",
      "1f adding a language and removing it keep the name, and the added code leaves its field: "
      + JSON.stringify([added, removed]));

    /* A CLOSED PAGE TAKES ITS LANGUAGES WITH IT (bug hunt 3, item 12, when it was a cover). */
    await type("#newProjLang", "uk");
    await press('[data-act="new-lang-add"]', 400);
    await settleOn(page, 'Array.from(document.querySelectorAll("#main .newcat .ls .lsk")).some(p => p.textContent.indexOf("UK") >= 0)', { bound: 30000 });
    const beforeCancel = await field();
    await press('#main .newcat [data-act="close-screen"][data-v="new"]', 400);
    await press('[data-act="new-tab"]', 500);
    const reopened = await field();
    check(beforeCancel.langs.join(",") === "EN,PL,UK" && reopened.langs.join(",") === "EN,PL",
      "1g a language added on a page closed by Cancel is gone when the page opens again: "
      + JSON.stringify([beforeCancel.langs, reopened.langs]));
    await type("#newName", NAME);

    await press('[data-act="do-new"]', 1200);
    await settleOn(page, '(window.STUDIO_READY || {}).screen === "cards"', { bound: 30000 });

    const ready = JSON.parse(await page.evaluate("JSON.stringify(window.STUDIO_READY)"));
    const band = JSON.parse(await page.evaluate(`JSON.stringify({
      tabs: Array.from(document.querySelectorAll("#tabs .tab")).map(e => e.textContent),
      rail: Array.from(document.querySelectorAll("#rail a")).map(e => e.textContent),
      cover: !document.querySelector("#scrim").hidden,
      /* the counts line by its own mark: on a project with no card the first .lede is the line that says the two ways
         in (board 862, P11), so the first match is no longer the count (the night merge's board 861 list) */
      lede: (document.querySelector('#main .lede[data-lede="cards"]') || {}).textContent || "",
    })`));
    check(ready.screen === "cards" && !band.cover && !band.tabs.some(t => t === "New catalog"),
      "2a the page gives way and the new project opens in the editor in its tab (screen=" + ready.screen + ")");
    check(band.tabs.some(t => t.indexOf(NAME) === 0 && /rev 0/.test(t)),
      "2b it is a tab in the band at rev 0: " + JSON.stringify(band.tabs));
    check(band.rail.slice(0, 3).join("|") === "Cards0|Intents0|Categories0",
      "2c and the rail counts nothing in it yet: " + JSON.stringify(band.rail.slice(0, 3)));
    check(/^0 cards\./.test(band.lede),
      "2d with the same count under the table: " + JSON.stringify(band.lede));
    check(!/since the last publish/.test(band.lede),
      "2d2 and it does not speak of a last publish on a project never published (item 29)");

    /* The same name a second time. The refusal names the folder, and the leg reads the first
       project's own bytes afterwards to say that nothing was written over it. */
    const was = fs.readFileSync(path.join(projects, FOLDER, DRAFT_FILE));
    await press('[data-act="to-projects"]', 500);
    await press('[data-act="new-tab"]', 400);
    await type("#newName", NAME);
    await press('[data-act="do-new"]', 700);
    await settleOn(page, '((document.querySelector("#main .newcat .kv .n") || {}).textContent || "").indexOf("already a folder") >= 0', { bound: 30000 });
    const twice = await page.evaluate(
      "(document.querySelector('#main .newcat .kv .n') || {}).textContent || ''");
    check(/already a folder/.test(twice)
      && Buffer.compare(was, fs.readFileSync(path.join(projects, FOLDER, DRAFT_FILE))) === 0,
      "2e the same name a second time is refused by the folder that is already there, and the"
      + " first project's draft is untouched");

    /* CANCEL TAKES THE REFUSAL WITH IT (bug hunt 3, item 15, when Escape closed the cover and left
       the refusal printed underneath): the page's Cancel closes its tab, and the next page is clean. */
    await press('#main .newcat [data-act="close-screen"][data-v="new"]', 400);
    const escaped = await page.evaluate(() => ({ up: !!document.querySelector("#main .newcat"),
      said: /already a folder/.test(document.body.innerText) }));
    await press('[data-act="new-tab"]', 400);
    const fresh = await page.evaluate(() => document.querySelectorAll("#main .newcat .kv .n").length);
    check(!escaped.up && !escaped.said && fresh === 0,
      "2e2 Cancel closes the page and the refusal with it, on the screen and on the next page: "
      + JSON.stringify({ escaped, refusalsOnNextPage: fresh }));

    /* A NEW PROJECT'S FIRST CARD IS NOT A DEAD END (sense pass item 29): with no category in the
       catalog the New card cover names the first one, and Create makes both. A second project,
       so the first one's draft stays what sections 3 and 4 read. */
    await type("#newName", NAME + " dwa");
    await press('[data-act="do-new"]', 1200);
    await press('[data-act="card-new"]', 500);
    await settleOn(page, '!!document.querySelector("#newCardCatName")', { bound: 30000 });
    const firstCover = await page.evaluate(() => ({
      name: !!document.querySelector("#newCardCatName"), select: !!document.querySelector("#newCardCat") }));
    await type("#newCard", "Plasule widuma");
    await type("#newCardCatName", "Zubynt");
    await type("#newCardBody", "Sarnesk kelbun ondrave.");
    await press('[data-act="do-card-new"]', 1200);
    const twoAt = path.join(projects, FOLDER + " dwa", DRAFT_FILE);
    const two = fs.existsSync(twoAt) ? readJson(twoAt) : { tags: [], cards: [] };
    const twoShelves = (two.tags || []).filter(t => t.kind === "shelf");
    check(firstCover.name && !firstCover.select && twoShelves.length === 1
          && (two.cards || []).length === 1 && two.cards[0].shelf === twoShelves[0].id,
      "2f with no category yet the card cover asks for the first one by name, and Create makes"
      + " the category and the card in it: " + JSON.stringify({ cover: firstCover,
        shelves: twoShelves.map(t => t.id), cards: (two.cards || []).map(c => c.id + "@" + c.shelf) }));
  } finally {
    await studio.shut();
  }
  await sleep(300);

  /* ---- what is on the disk ------------------------------------------------------------------ */

  const dir = path.join(projects, FOLDER);
  const files = fs.readdirSync(dir).sort();
  check(files.join(",") === DRAFT_FILE + "," + PROJECT_FILE,
    "3a the folder is the name as typed and holds the draft and the project record and nothing"
    + " else: " + JSON.stringify(files));

  const draft = readJson(path.join(dir, DRAFT_FILE));
  check(draft.format === F.FORMAT && draft.kind === F.KIND && F.idOk(draft.id) && draft.id !== FOLDER
    && !("name" in draft) && draft.rev === 0,
    "3b the draft is a format " + draft.format + " " + draft.kind + " with no name inside it"
    + ", id " + JSON.stringify(draft.id) + " (random, not the name's slug), rev " + draft.rev);
  check(draft.langs.map(l => l.code).join(",") === "en,pl"
    && (draft.cards || []).length === 0 && (draft.tags || []).length === 0,
    "3c carrying the two languages and no cards: "
    + JSON.stringify(draft.langs.map(l => l.code)));
  const bare = Object.assign({}, draft); delete bare.hash; delete bare.sig;
  check(draft.hash === F.contentHash(bare),
    "3d and the engine's own content hash over what it holds (" + draft.hash + ")");

  /* ---- the pinned engine's own reader and lint ----------------------------------------------- */

  const { loadCatalog, lintCatalog } = Engine.lint();
  let read = null, refusal = null;
  try { read = loadCatalog(path.join(dir, DRAFT_FILE)); } catch (e) { refusal = e; }
  check(!!read && !refusal, "4a the pinned engine's own loadCatalog reads the new draft"
    + (refusal ? ": " + refusal.message : ""));

  const l = lintCatalog(read);
  check(l.errors.join("|") === "no cards" && l.warnings.join("|") === "no categories declared",
    "4b and its lint says the two things an empty catalog must say and nothing else: "
    + JSON.stringify(l.errors) + " " + JSON.stringify(l.warnings));

  /* ONE CARD AND THE LINT GOES SILENT, which is what makes 4b a statement about emptiness
     rather than about anything Studio wrote into the file. The card is built here the way the
     importer builds one: both languages filled, because the pinned lint demands Polish on every
     card whatever the catalog's langs say. */
  const full = JSON.parse(JSON.stringify(draft));
  full.tags = [{ id: F.tagId("greeting"), kind: "shelf", label: { en: "Greeting", pl: "Greeting" } }];
  full.cards = [{
    id: "c-one", shelf: full.tags[0].id, bodyShape: "plain",
    title: { en: "Ondrave plasule", pl: "Ondrave plasule" },
    body: { en: "Widuma tosork sarnesk plasib.", pl: "Widuma tosork sarnesk plasib." },
  }];
  delete full.hash; delete full.sig;
  full.hash = F.contentHash(full);
  const at = path.join(SCRATCH, "with-one-card.json");
  fs.writeFileSync(at, JSON.stringify(full, null, 1) + "\n", "utf8");
  const l2 = lintCatalog(loadCatalog(at));
  check(l2.errors.length === 0 && l2.warnings.length === 0,
    "4c one card written into the same draft and the pinned lint goes silent: "
    + l2.errors.length + " error(s), " + l2.warnings.length + " warning(s)"
    + (l2.errors.length ? " " + JSON.stringify(l2.errors) : "")
    + (l2.warnings.length ? " " + JSON.stringify(l2.warnings) : ""));

  /* ---- a Windows device name (bug hunt 3, item 13) ------------------------------------------
     A project called CON was made in a folder PowerShell says is not there. The folder
     takes a suffix, and PowerShell is asked, since node opens the bare name. */
  const S = await import("../src/studio.mjs");
  const con = await S.newProject(projects, "CON");
  const csvAt = path.join(SCRATCH, "nul.csv");
  fs.writeFileSync(csvAt, "title,body\nTosan widil,Farlil zubork.\n", "utf8");
  const nulPlan = await S.importPlan(projects, csvAt);
  const seen = process.platform !== "win32" ? "True" : execFileSync("powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", "Test-Path -LiteralPath '" + con.dir + "'"],
    { encoding: "utf8", timeout: 60000 }).trim();
  check(path.basename(con.dir) === "CON-project" && F.idOk(con.draft.id) && con.draft.id !== "con" && seen === "True"
        && path.basename(nulPlan.dir) === "nul-project" && nulPlan.id === null,
    "5a a project named CON lands in a folder Windows opens, under an id of its own, and an import named nul"
    + " would land beside it the same way: " + JSON.stringify({ folder: path.basename(con.dir),
      id: con.draft.id, powershell: seen, importFolder: path.basename(nulPlan.dir), importId: nulPlan.id }));

  if (!keep) dropScratch(SCRATCH, "new-project");
  process.stdout.write("new-project  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("new-project  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
