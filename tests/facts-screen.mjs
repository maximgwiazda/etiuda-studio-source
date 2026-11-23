/* THE CATALOG'S QUICK FACTS, EDITED ON THE SCREEN AND READ BACK BY THE PINNED ENGINE.
 *
 *     node tests/facts-screen.mjs [--keep]
 *
 * THE ORACLE IS THE ENGINE'S OWN READER. `facts` is one string on the catalog, and the thing
 * worth proving is not that Studio can write a string but that the string reaches the field the
 * engine paints its quick facts panel from: so the draft is read through the pinned
 * `loadCatalog` and the text is taken off the RUNTIME shape the engine maps the file into,
 * rather than off the key this program wrote.
 *
 * AND THAT NOTHING ELSE MOVED. A whole-draft rewrite is what every verb in src/studio.mjs does,
 * so the catalog either comes out of one with its cards, its tags and its header exactly as they
 * went in or the verb is wrong; the comparison is over the file with `facts` and `hash` taken
 * out of both sides.
 *
 * AN EMPTIED TEXT IS THE EMPTY STRING AND NOT AN ABSENT KEY, which is the engine's own
 * distinction: absence falls back to the built-in text, and a person who cleared the box on
 * purpose meant the opposite of that.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openStudio } from "./shell-door.mjs";
import * as Engine from "../src/engine.mjs";
import { json, PROJECT_FILE, DRAFT_FILE } from "../src/publish.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { pressWhen, settleOn } from "./press.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "facts-screen");
const ID = "factscreen-catalog";
const NAME = "Facts, EN and PL";

/* Two lines with a blank between them and a word in each language, so that what is compared is
   not a single token: a newline is the one character a field like this is most likely to lose. */
const FACTS = ["Ondrave plasule: 40 EUR.", "", "Widuma tosork: 24 h."].join("\n");

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

function startingCatalog(F) {
  const shelf = { id: F.tagId("Greeting"), kind: "shelf", label: { en: "Greeting", pl: "Powitanie" } };
  const cards = [1, 2].map(n => ({
    id: "c-" + n, shelf: shelf.id,
    title: { en: "Card " + n, pl: "Karta " + n },
    body: { en: "Sarnesk kelbun ondrave " + n + ".", pl: "Sarnesk kelbun widuma " + n + "." },
    bodyShape: "plain",
  }));
  const cat = {
    format: F.FORMAT, kind: F.KIND, id: ID, name: NAME, rev: 0,
    langs: [{ code: "en", label: "EN" }, { code: "pl", label: "PL" }],
    commentLang: "en", tags: [shelf], cards, minEngine: "2.0.0",
  };
  cat.hash = F.contentHash(cat);
  return cat;
}

async function main(argv) {
  const keep = argv.indexOf("--keep") >= 0;
  clearScratch(SCRATCH);
  const projects = path.join(SCRATCH, "projects");
  fs.mkdirSync(projects, { recursive: true });
  const F = await Engine.format();
  const start = startingCatalog(F);
  const dir = path.join(projects, ID);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, DRAFT_FILE), json(start), "utf8");
  fs.writeFileSync(path.join(dir, PROJECT_FILE),
    json({ id: ID, name: NAME, rev: 0, edition: "", draft: DRAFT_FILE, folder: null }), "utf8");
  const draftAt = path.join(dir, DRAFT_FILE);

  /* A SECOND PROJECT WITH A LANGUAGE AWAITING, for the rail's Lint number: one card has no
     Polish body, which the Lint table lists as an Awaiting row beside any error or warning. */
  const WAIT_ID = "factscreen-awaiting";
  const waitDir = path.join(projects, WAIT_ID);
  const waiting = Object.assign(startingCatalog(F), { id: WAIT_ID, name: "Facts, one awaiting" });
  delete waiting.cards[1].body.pl;
  delete waiting.hash; waiting.hash = F.contentHash(waiting);
  fs.mkdirSync(waitDir, { recursive: true });
  fs.writeFileSync(path.join(waitDir, DRAFT_FILE), json(waiting), "utf8");
  fs.writeFileSync(path.join(waitDir, PROJECT_FILE), json({ id: WAIT_ID, name: waiting.name,
    rev: 0, edition: "", draft: DRAFT_FILE, folder: null }), "utf8");

  const studio = await openStudio("tests/facts-screen.mjs", {
    projects, userDataDir: path.join(SCRATCH, "ud"),
  });

  let opened = null, after = null, reopened = null, emptied = null;
  try {
    const page = studio.page;
    const press = async (sel, ms) => {
      await pressWhen(page, sel, { who: "tests/facts-screen.mjs" });
      await sleep(ms || 350);
    };
    const type = async (sel, v) => {
      await page.evaluate((s, value) => {
        const e = document.querySelector(s);
        if (!e) throw new Error("nothing at " + s);
        e.value = value; e.dispatchEvent(new Event("input", { bubbles: true }));
      }, sel, v);
      await sleep(150);
    };
    const state = async (js) => JSON.parse(await page.evaluate("JSON.stringify(" + js + ")"));

    await press('[data-act="open"][data-dir="' + dir.replace(/\\/g, "\\\\") + '"]', 900);
    await press('[data-act="section"][data-v="facts"]', 500);
    await settleOn(page, '(window.STUDIO_READY || {}).screen === "facts"', { bound: 30000 });
    opened = await state(`{
      screen: window.STUDIO_READY.screen,
      h1: (document.querySelector("#main h1") || {}).textContent || "",
      rail: (document.querySelector('#rail a[data-v="facts"]') || {}).textContent || "",
      value: (document.querySelector("#main textarea[data-facts]") || {}).value || "",
      boxes: document.querySelectorAll("#main textarea").length,
    }`);
    check(opened.screen === "facts" && opened.h1 === "Quick facts" && opened.boxes === 1,
      "1a the rail's own row opens one box under the heading the engine gives this text: "
      + JSON.stringify(opened.h1));
    check(opened.rail === "Quick facts" && opened.value === "",
      "1b empty on a catalog that has never had any, and the row carries no count because it"
      + " is one text rather than a list: " + JSON.stringify(opened.rail));

    await type("#main textarea[data-facts]", FACTS);
    await sleep(900);
    after = await state(`{
      value: (document.querySelector("#main textarea[data-facts]") || {}).value || "",
      focus: document.activeElement === document.querySelector("#main textarea[data-facts]"),
    }`);

    /* Reopened from the project list, so what comes back is what the file holds rather than
       what the page still had in memory. */
    await press('[data-act="to-projects"]', 700);
    await press('[data-act="open"][data-dir="' + dir.replace(/\\/g, "\\\\") + '"]', 900);
    await press('[data-act="section"][data-v="facts"]', 500);
    await settleOn(page, '(window.STUDIO_READY || {}).screen === "facts"', { bound: 30000 });
    reopened = await state(`(document.querySelector("#main textarea[data-facts]") || {}).value || ""`);

    await type("#main textarea[data-facts]", "");
    await sleep(900);
    emptied = JSON.parse(fs.readFileSync(draftAt, "utf8")).facts;

    /* Put back, so that the assertions below run against the text rather than against the
       empty string the line above wrote. */
    await type("#main textarea[data-facts]", FACTS);
    await sleep(900);

    /* ---- 4. ONE NUMBER FOR THE LINT, WHICHEVER SAVE WROTE IT LAST -------------------------- */
    const railNum = () => state(`+((document.querySelector('#rail a[data-v="lint"] .num') || {}).textContent || "-1")`);
    await press('[data-act="to-projects"]', 700);
    await press('[data-act="open"][data-dir="' + waitDir.replace(/\\/g, "\\\\") + '"]', 900);
    await press('[data-act="section"][data-v="lint"]', 600);
    await settleOn(page, '(window.STUDIO_READY || {}).screen === "lint"', { bound: 30000 });
    const table = await state(`{ rows: document.querySelectorAll("#main tr .chip").length,
      awaiting: document.querySelectorAll("#main tr .chip.await").length }`);
    const before = await railNum();
    check(table.awaiting > 0 && before === table.rows,
      "4a CONTROL: before any save the rail's Lint number is the Lint table's rows, a language"
      + " awaiting among them (" + before + " on the rail, " + table.rows + " rows, "
      + table.awaiting + " awaiting)");
    await press('[data-act="section"][data-v="facts"]', 500);
    await type("#main textarea[data-facts]", "Ondrave plasule.");
    await sleep(900);
    const afterFacts = await railNum();
    check(afterFacts === table.rows,
      "4b a quick-facts save leaves the rail on the table's number: " + afterFacts);
    await press('[data-act="section"][data-v="categories"]', 500);
    await type('#main input[data-tag][data-l="en"]', "Greeting, renamed");
    await sleep(900);
    const afterTag = await railNum();
    check(afterTag === table.rows,
      "4c and so does a category rename: " + afterTag);
  } finally {
    await studio.shut();
  }
  await sleep(400);

  const onDisk = JSON.parse(fs.readFileSync(draftAt, "utf8"));
  check(after && after.value === FACTS && reopened === FACTS,
    "2a the two lines and the blank between them survive the save and the reopen"
    + (reopened === FACTS ? "" : ": " + JSON.stringify(reopened)));
  check(onDisk.facts === FACTS,
    "2b and the file carries them as one string, newlines and all: "
    + JSON.stringify(onDisk.facts));
  check(emptied === "",
    "2c a box cleared on purpose writes the empty string rather than dropping the key, which is"
    + " the engine's own distinction (" + JSON.stringify(emptied) + ")");

  const bare = Object.assign({}, onDisk); delete bare.hash; delete bare.sig;
  check(onDisk.hash === F.contentHash(bare) && onDisk.hash !== start.hash,
    "2d the draft carries the engine's own content hash over what it now holds, and it moved"
    + " with the edit (" + start.hash + " became " + onDisk.hash + ")");

  const strip = (c) => {
    const o = JSON.parse(JSON.stringify(c)); delete o.hash; delete o.facts; return JSON.stringify(o);
  };
  check(strip(onDisk) === strip(start),
    "2e and nothing else in the catalog moved: the cards, the tag and the header are byte for"
    + " byte what they were");

  const { loadCatalog, lintCatalog } = Engine.lint();
  let read = null, err = null;
  try { read = loadCatalog(draftAt); } catch (e) { err = e; }
  check(!!read && !err, "3a the pinned engine's own loadCatalog reads the edited draft"
    + (err ? ": " + err.message : ""));
  check(!!read && read.facts === FACTS,
    "3b and the text is on the runtime shape the engine maps the file into, which is the field"
    + " its quick facts panel is painted from: " + JSON.stringify(read && read.facts));
  const l = lintCatalog(read);
  check(l.errors.length === 0 && l.warnings.length === 0,
    "3c with nothing for the pinned lint to say about it: " + l.errors.length + " error(s), "
    + l.warnings.length + " warning(s)");

  if (!keep) dropScratch(SCRATCH, "facts-screen");
  process.stdout.write("facts-screen  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("facts-screen  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
