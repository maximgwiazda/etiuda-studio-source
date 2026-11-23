/* A PROJECT RENAMED RENAMES ITS FOLDER AND STORES ITS NAME, AND KEEPS ITS ID, ITS ARCHIVE AND ITS FILE NAME.
 *
 *     node tests/rename-project.mjs [--keep]
 *
 * THE NAME IS PROJECT.JSON'S, THE FOLDER FOLLOWS IT AND THE ID IS THE THING: the engine namespaces a
 * desk's personal layer by the catalog's id and the archive's diffs match on it, while the name a
 * project shows is the record's and no other file inside carries one. So a rename typed into the
 * row is measured by the folder it moved to and the name stored, and by what it did NOT move: the
 * id in the draft and in the project record, every byte of every archived edition, and the
 * published file's name, which only the Change file name row alters (board 18).
 *
 * THE SECOND HALF IS THE PUBLISH AFTER IT, from the renamed folder: the .ec a desk would read
 * carries the same id and no name, and the release notes are headed by the new name.
 *
 * THE FILE NAME'S WINDOW LEGS (section 5) run on a second project planted unpublished: its first
 * publish cover offers the suggested name in a field, the Settings row moves the file on disk, the
 * next cover names the moved file (the list has had no Written to cell since board 982 E), and a Polish
 * window reads the row's label and button.
 *
 * THE ROW'S OWN EDITION is the other half of this piece. A row that says rev 14 says nothing a
 * person can hold against the file in front of them, because a desk's copy calls itself by its
 * EDITION; so the row is read off the screen and held against the archive's own folder names.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { openStudio } from "./shell-door.mjs";
import * as Engine from "../src/engine.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { pressWhen, settleOn } from "./press.mjs";
import { publishFull, json, editionsIn, PROJECT_FILE, DRAFT_FILE, ARCHIVE,
         CATALOG_IN_ARCHIVE, RELEASE_IN_ARCHIVE } from "../src/publish.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "rename-project");
const ID = "rename-catalog";
const WAS = "Sarnesk pile";
const NOW_NAME = "Ondrave plasule, EN and PL";
const SECOND = "Tolvane draft", SECOND_ID = "second-catalog";

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sha = p => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex").slice(0, 16);
const readJson = p => JSON.parse(fs.readFileSync(p, "utf8"));
const ecs = d => fs.existsSync(d) ? fs.readdirSync(d).filter(n => /\.ec$/.test(n)).sort() : [];

function catalogOf(F, id) {
  const shelf = { id: F.tagId("Greeting"), kind: "shelf", label: { en: "Greeting", pl: "Powitanie" } };
  const cat = {
    format: F.FORMAT, kind: F.KIND, id: id || ID, rev: 0,
    langs: [{ code: "en", label: "EN" }, { code: "pl", label: "PL" }],
    commentLang: "en", tags: [shelf], minEngine: "2.0.0",
    cards: [1, 2].map(i => ({
      id: "c-" + i, shelf: shelf.id, bodyShape: "plain",
      title: { en: "Card " + i, pl: "Karta " + i },
      body: { en: "Widuma tosork sarnesk plasib " + i + ".",
              pl: "Widuma tosork sarnesk plasib " + i + "." },
    })),
  };
  cat.hash = F.contentHash(cat);
  return cat;
}

async function main(argv) {
  const keep = argv.indexOf("--keep") >= 0;
  clearScratch(SCRATCH);
  const projects = path.join(SCRATCH, "projects");
  const dir = path.join(projects, WAS), moved = path.join(projects, NOW_NAME);
  const share = path.join(SCRATCH, "share");
  fs.mkdirSync(dir, { recursive: true });
  const F = await Engine.format();

  fs.writeFileSync(path.join(dir, DRAFT_FILE), json(catalogOf(F)), "utf8");
  fs.writeFileSync(path.join(dir, PROJECT_FILE),
    json({ id: ID, rev: 0, edition: "", draft: DRAFT_FILE, folder: share }), "utf8");
  await publishFull({ project: dir, folder: share, notes: "Before the rename.",
                      now: "2026-09-17T10:00:00.000Z" });
  /* The second project, unpublished and writing to a share of its own. */
  const dir2 = path.join(projects, SECOND), share2 = path.join(SCRATCH, "share2");
  fs.mkdirSync(dir2, { recursive: true });
  fs.writeFileSync(path.join(dir2, DRAFT_FILE), json(catalogOf(F, SECOND_ID)), "utf8");
  fs.writeFileSync(path.join(dir2, PROJECT_FILE),
    json({ id: SECOND_ID, rev: 0, edition: "", draft: DRAFT_FILE, folder: share2 }), "utf8");

  const firstEdition = editionsIn(dir)[0];
  const archiveWas = sha(path.join(dir, ARCHIVE, firstEdition, CATALOG_IN_ARCHIVE));

  const studio = await openStudio("tests/rename-project.mjs", {
    projects, userDataDir: path.join(SCRATCH, "ud"),
  });

  let row = null, band = null, cover = null;
  let listRows = null, firstCover = null, fixedCover = null, setRow = null, other = null, refused = null,
    filesAfterRefusal = null, movedRow = null, listAfter = null, firstEcs = null, otherSha = null, firstName = null;
  try {
    const page = studio.page;
    const press = async (sel, ms) => {
      await pressWhen(page, sel, { who: "tests/rename-project.mjs" });
      /* the press draws the edition going out once the file is written: Escape finishes it, as a person's would */
      if (sel === '[data-act="do-publish"]') await page.evaluate(() => { if (document.querySelector("#prGo[aria-busy]"))
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
      await sleep(ms || 350);
    };
    const state = async (js) => JSON.parse(await page.evaluate("JSON.stringify(" + js + ")"));

    /* THE ROWS ARE THE LIBRARY'S (board 982 E, 2026-11-11): Overview keeps up to four opened catalogs as cards and no table, and
       neither project here has been opened. Once chosen, the Library stays the home tab's screen for every return below. */
    await press('#rail [data-act="home"][data-v="library"]', 400);
    await settleOn(page, 'document.querySelectorAll("#main tr[data-dir]").length > 1', { bound: 30000 });
    /* The edition is looked for anywhere the row carries it: its text, or a title on the row or inside it, which is where
       a label short enough to carry the rev alone puts the dated edition (ui/app.js revTitle, board 902). */
    row = await state(`(() => {
      const tr = document.querySelector("#main table tr:nth-child(2)");
      const titles = [tr.getAttribute("title") || ""].concat(Array.from(tr.querySelectorAll("[title]")).map(e => e.getAttribute("title")));
      return {
        name: (tr.querySelector(".pn[data-proj]") || {}).textContent || "",
        cells: Array.from(tr.querySelectorAll("td")).map(td => td.textContent),
        said: tr.textContent + " " + titles.join(" "),
      };
    })()`);
    check(row.name === WAS && row.said.indexOf(firstEdition) >= 0,
      "1a the project's row carries its folder's name and the edition of its last publish: "
      + JSON.stringify(row.name) + " " + JSON.stringify(row.cells)
      + " against the archive's " + JSON.stringify(firstEdition));

    /* F2 starts the rename where the name stands, Enter keeps it (board 901). The field is absent until then. */
    await page.evaluate(() => {
      const tr = document.querySelector("#main table tr:nth-child(2)");
      if (tr) tr.focus();
    });
    await page.keyboard.press("F2");
    await settleOn(page, '!!document.querySelector("#main input[data-naming][data-proj]")', { bound: 30000 });
    await page.evaluate((v) => {
      const e = document.querySelector("#main input[data-naming][data-proj]");
      e.value = v; e.dispatchEvent(new Event("input", { bubbles: true }));
    }, NOW_NAME);
    await page.keyboard.press("Enter");
    await sleep(1200);

    /* Opened after the rename, which is also the thing that proves the rename reached the disk
       rather than the copy on the screen: openProject reads the folder again, at its new path. */
    await press('[data-act="open"]', 1000);
    await settleOn(page, '(window.STUDIO_READY || {}).screen === "cards"', { bound: 30000 });
    band = await state(`{
      tabs: Array.from(document.querySelectorAll("#tabs .tab")).map(e => e.textContent),
      screen: window.STUDIO_READY.screen,
    }`);
    await press('[data-act="publish"]', 900);
    await settleOn(page, '!document.querySelector("#scrim").hidden && !!(document.querySelector("#dlg h2") || {}).textContent', { bound: 30000 });
    cover = await state(`{
      h2: (document.querySelector("#dlg h2") || {}).textContent || "",
      up: !document.querySelector("#scrim").hidden,
      field: !!document.querySelector("#fileName"),
      file: Array.from(document.querySelectorAll('#dlg .pwc-gate[data-gate="file"]')).map(k => k.textContent),
    }`);
    await page.evaluate(() => {
      const e = document.querySelector("#notes");
      e.value = "After the rename."; e.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await press('[data-act="do-publish"]', 1600);

    /* ---- 5. THE FILE NAME, ON A SECOND PROJECT PLANTED UNPUBLISHED --------------------------- */
    await press('[data-act="to-projects"]', 900);
    await press('#rail [data-act="home"][data-v="library"]', 400);
    await settleOn(page, 'document.querySelectorAll("#main table tr").length > 1', { bound: 30000 });
    listRows = await state(`({
      wt: document.querySelectorAll("#main td.wt").length,
      writtenHead: Array.from(document.querySelectorAll("#main th")).some(th => th.textContent.trim() === "Written to"),
      dirs: Array.from(document.querySelectorAll("#main tr[data-dir]")).map(tr => tr.getAttribute("data-dir"))
    })`);
    await pressWhen(page, '[data-act="open"]', { who: "tests/rename-project.mjs", attr: ["data-dir", dir2] });
    await sleep(1000);
    await press('[data-act="publish"]', 900);
    await settleOn(page, '!document.querySelector("#scrim").hidden && !!document.querySelector("#fileName")', { bound: 30000 });
    firstCover = await state(`{
      value: (document.querySelector("#fileName") || {}).value === undefined
        ? null : document.querySelector("#fileName").value,
      labels: Array.from(document.querySelectorAll("#dlg #fileName")).map(e => e.getAttribute("aria-label")),
    }`);
    await page.evaluate(() => {
      const e = document.querySelector("#fileName");
      e.value = "Edited Name"; e.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await press('[data-act="do-publish"]', 1600);
    firstEcs = ecs(share2); firstName = readJson(path.join(dir2, PROJECT_FILE)).fileName;
    await press('[data-act="publish"]', 900);
    await settleOn(page, '!document.querySelector("#scrim").hidden && !document.querySelector("#fileName") && !!document.querySelector(\'#dlg .pwc-gate[data-gate="file"]\')', { bound: 30000 });
    fixedCover = await state(`{
      field: !!document.querySelector("#fileName"),
      shown: Array.from(document.querySelectorAll('#dlg .pwc-gate[data-gate="file"]')).map(k => k.textContent),
    }`);
    await press('[data-act="cover-close"]', 500);

    await press('[data-act="section"][data-v="settings"]', 600);
    await settleOn(page, '!!document.querySelector(\'[data-act="file-name"]\')', { bound: 30000 });
    setRow = await state(`{
      value: (document.querySelector("#fileNameSet") ? document.querySelector("#fileNameSet").value
        : (document.querySelector(".kv:has([data-act=\\"file-name\\"]) .mono") || {}).textContent || "").replace(/\\.ec$/, ""),
      button: !!document.querySelector('[data-act="file-name"]'),
    }`);
    await press('[data-act="file-name"]', 600);
    await settleOn(page, '!!document.querySelector("#fileNameSet")', { bound: 30000 });
    /* A refusal first: a file of another catalog already holds the name asked for. */
    other = path.join(share2, "taken.ec");
    fs.writeFileSync(other, json(catalogOf(F, "another-catalog")), "utf8");
    otherSha = sha(other);
    await page.evaluate(() => {
      const e = document.querySelector("#fileNameSet");
      e.value = "Taken"; e.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await press('[data-act="file-name"]', 900);
    await settleOn(page, '((document.querySelector("#main .lss.hard") || {}).textContent || "").trim() !== ""', { bound: 30000 });
    refused = await state(`{
      said: (document.querySelector("#main .lss.hard") || {}).textContent || "",
      value: (document.querySelector("#fileNameSet") || {}).value || "",
    }`);
    filesAfterRefusal = ecs(share2);
    await page.evaluate(() => {
      const e = document.querySelector("#fileNameSet");
      e.value = "Moved Name"; e.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await press('[data-act="file-name"]', 900);
    await settleOn(page, '((document.querySelector("#fileNameSet") ? document.querySelector("#fileNameSet").value : (document.querySelector(".kv:has([data-act=\\"file-name\\"]) .mono") || {}).textContent || "").replace(/\\.ec$/, "") === "moved-name"', { bound: 30000 });
    movedRow = await state(`{
      value: (document.querySelector("#fileNameSet") ? document.querySelector("#fileNameSet").value
        : (document.querySelector(".kv:has([data-act=\\"file-name\\"]) .mono") || {}).textContent || "").replace(/\\.ec$/, ""),
      said: (document.querySelector("#main .lss.hard") || {}).textContent || "",
    }`);
    /* THE NEXT COVER FOLLOWS THE MOVE. The list's Written to cell, which 5h read until then, left the Library with board 982 E
       (5a holds its absence); the cover is the other place the file a desk reads is named. Nothing is pressed on it. */
    await press('[data-act="publish"]', 900);
    await settleOn(page, '!document.querySelector("#scrim").hidden && !!document.querySelector(\'#dlg .pwc-gate[data-gate="file"]\')', { bound: 30000 });
    listAfter = await state(`{
      field: !!document.querySelector("#fileName"),
      shown: Array.from(document.querySelectorAll('#dlg .pwc-gate[data-gate="file"]')).map(k => k.textContent),
    }`);
    await press('[data-act="cover-close"]', 500);
  } finally {
    await studio.shut();
  }
  await sleep(400);

  /* ---- what did not move ----------------------------------------------------------------- */

  const project = readJson(path.join(moved, PROJECT_FILE));
  const draft = readJson(path.join(moved, DRAFT_FILE));
  check(project.id === ID && draft.id === ID && fs.existsSync(moved) && !fs.existsSync(dir),
    "2a the folder is now the name typed into the row, and the id is the one it was made with, in"
    + " the draft and in the project record (" + draft.id + ")");
  check(!("name" in draft) && project.displayName === NOW_NAME,
    "2b and the record carries the name typed, verbatim, where the draft carries none: "
    + JSON.stringify(["name" in draft, project.displayName]));
  const bare = Object.assign({}, draft); delete bare.hash; delete bare.sig;
  check(draft.hash === F.contentHash(bare),
    "2c the draft carries the engine's own content hash over what it now holds (" + draft.hash + ")");
  check(sha(path.join(moved, ARCHIVE, firstEdition, CATALOG_IN_ARCHIVE)) === archiveWas,
    "2d the edition published before the rename moved with the folder byte for byte ("
    + archiveWas + ")");
  const old = readJson(path.join(moved, ARCHIVE, firstEdition, CATALOG_IN_ARCHIVE));
  check(old.id === ID && !("name" in old),
    "2e and it is the same catalog, by its id, with no name inside it: an archived edition is what"
    + " was published, and a name is its folder's");

  /* ---- what the screen showed ------------------------------------------------------------- */

  check(band.tabs.some(t => t.indexOf(NOW_NAME) === 0),
    "3a the band's tab carries the new name after the project is opened: "
    + JSON.stringify(band.tabs));
  check(cover.up && cover.h2 === "Publish " + NOW_NAME,
    "3b and the publish cover is headed by it: " + JSON.stringify(cover.h2));

  check(cover.field === false && cover.file.length === 1 && cover.file[0].indexOf("sarnesk-pile.ec") >= 0,
    "3c and it shows the file name fixed at the first publish, as text, from before the rename: "
    + JSON.stringify(cover.file));

  /* ---- the file a desk would read ---------------------------------------------------------- */

  const eds = editionsIn(moved);
  check(eds.length === 2, "4a the publish that followed added an edition rather than replacing"
    + " one: " + eds.join(", "));
  /* THE FILE NAME WAS FIXED AT THE FIRST PUBLISH, from the folder it had then, and the rename left it. */
  const ec = path.join(share, "sarnesk-pile.ec");
  check(JSON.stringify(ecs(share)) === JSON.stringify(["sarnesk-pile.ec"]) && project.fileName === "sarnesk-pile.ec",
    "4a2 the share still holds the one file, named as at its first publish, and the record says so: "
    + JSON.stringify(ecs(share)));
  const published = readJson(ec);
  check(!("name" in published) && published.id === ID && published.rev === 2,
    "4b the .ec a desk reads carries no name, the same id and rev 2 (" + published.id + ")");
  const { loadCatalog, lintCatalog } = Engine.lint();
  const read = loadCatalog(ec);
  check(read.id === ID && lintCatalog(read).errors.length === 0,
    "4c and the pinned engine reads it with nothing to say about it");
  const notes = fs.readFileSync(path.join(moved, ARCHIVE, eds[1], RELEASE_IN_ARCHIVE), "utf8");
  check(notes.split("\n")[0] === "# " + NOW_NAME + " rev 2 (" + eds[1] + ")",
    "4d with release notes headed by the new name, the rev and its dated edition (board 902): " + JSON.stringify(notes.split("\n")[0]));
  check(/catalog id `rename-catalog`/.test(notes),
    "4e and the same catalog id inside them, which is what a desk matches an edition by");

  /* ---- 5. the file name, as the windows showed it and as the disk holds it ---------------- */

  check(listRows.wt === 0 && !listRows.writtenHead
        && listRows.dirs.indexOf(moved) >= 0 && listRows.dirs.indexOf(dir2) >= 0,
    "5a the list has no Written to column, and both catalogs keep a row; the path stays on the row's menu: "
    + JSON.stringify(listRows));
  check(firstCover.value === "tolvane-draft" && firstCover.labels.indexOf("File name") >= 0,
    "5b the first publish cover of an unpublished project holds the display name's suggestion in a"
    + " File name field: " + JSON.stringify(firstCover));
  check(JSON.stringify(firstEcs) === JSON.stringify(["edited-name.ec"])
        && firstName === "edited-name.ec",
    "5c edited and published, the disk holds the edited name and the record says so: "
    + JSON.stringify(firstEcs));
  check(fixedCover.field === false && fixedCover.shown.length === 1
        && fixedCover.shown[0].indexOf("edited-name.ec") >= 0,
    "5d the next cover shows the fixed name as text with no field: " + JSON.stringify(fixedCover));
  check(setRow.value === "edited-name" && setRow.button === true,
    "5e Settings' File name row holds the fixed name's stem beside a Change file name button: "
    + JSON.stringify(setRow));
  check(refused.said.indexOf("already holds a file named taken.ec") >= 0
        && JSON.stringify(filesAfterRefusal) === JSON.stringify(["edited-name.ec", "taken.ec"])
        && sha(other) === otherSha,
    "5f a name another catalog's file holds is refused on the error line, and nothing moved: "
    + JSON.stringify(refused.said.slice(0, 90)));
  const ending = ecs(share2);
  check(JSON.stringify(ending) === JSON.stringify(["moved-name.ec", "taken.ec"])
        && movedRow.value === "moved-name" && movedRow.said === ""
        && readJson(path.join(dir2, PROJECT_FILE)).fileName === "moved-name.ec"
        && readJson(path.join(share2, "moved-name.ec")).id === SECOND_ID,
    "5g given a new name and pressed, Settings' row moves the file on disk and then shows it: "
    + JSON.stringify([ending, movedRow.value]));
  check(listAfter.field === false && listAfter.shown.length === 1 && listAfter.shown[0].indexOf("moved-name.ec") >= 0
        && listAfter.shown[0].indexOf("edited-name.ec") < 0,
    "5h and the next publish cover follows, naming the moved file as text: " + JSON.stringify(listAfter));
  /* 5i, the W3 shape of the list's Written to cell, went with the cell (board 982 E, 2026-11-11); 5a holds that it is gone. */

  /* ---- 6. UNDER --lang pl: the Settings row's label and button ------------------------------- */

  const pl = await openStudio("tests/rename-project.mjs", {
    projects, userDataDir: path.join(SCRATCH, "ud-pl"), env: { STUDIO_LANG: "pl" },
  });
  let plRow = null;
  try {
    await pressWhen(pl.page, '#rail [data-act="home"][data-v="library"]', { who: "tests/rename-project.mjs" });
    await pressWhen(pl.page, '[data-act="open"]', { who: "tests/rename-project.mjs", attr: ["data-dir", dir2] });
    await sleep(1000);
    await pressWhen(pl.page, '[data-act="section"][data-v="settings"]', { who: "tests/rename-project.mjs" });
    await settleOn(pl.page, '((document.querySelector(\'#main [data-act="file-name"]\') || {}).textContent || "").trim() !== ""', { bound: 30000 });
    plRow = JSON.parse(await pl.page.evaluate(`JSON.stringify({
      labels: Array.from(document.querySelectorAll("#main .kv .k")).map(e => e.textContent),
      button: ((document.querySelector('[data-act="file-name"]') || {}).textContent || "").trim(),
      note: Array.from(document.querySelectorAll("#main .kv .n")).map(e => e.textContent),
    })`));
  } finally {
    await pl.shut();
  }
  check(plRow.labels.indexOf("Nazwa pliku") >= 0 && plRow.button === "Zmień nazwę pliku"
        && plRow.note.indexOf("Tak katalog nazywa się na każdym stanowisku. Nowa nazwa zachowuje to, co"
          + " każde stanowisko dostosowało u siebie.") >= 0,
    "6a under --lang pl the Settings row reads Nazwa pliku with a Zmień nazwę pliku button and its"
    + " note in Polish: " + JSON.stringify([plRow.button, plRow.labels.slice(0, 4)]));

  if (!keep) dropScratch(SCRATCH, "rename-project");
  process.stdout.write("rename-project  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("rename-project  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
