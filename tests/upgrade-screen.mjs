/* A FORMAT 1 CATALOG OPENED ON THE SCREEN, AGAINST THE COMMAND LINE'S OWN CONVERSION.
 *
 *     node tests/upgrade-screen.mjs [--keep]
 *
 * THE ORACLE IS `node tools/catalog-v2/convert.mjs`, run over the same file in the same scratch
 * folder, and the claim is byte equality between the draft the screen wrote and the .ec the
 * command line wrote. That is the whole point of the arrangement: Studio does not convert, the
 * pinned converter does, and a screen that had grown an opinion of its own about a format 1
 * file would show up here as two different files rather than as a difference nobody measured.
 *
 * THE SENTENCES ON THE COVER ARE HELD TO THE COMMAND LINE'S TOO. What the upgrade changed is
 * the converter's "declared" lines, so the cover's rows are compared with the lines the tool
 * printed, in order, rather than with a list this file retypes.
 *
 * THE INPUT IS A HAND-WRITTEN FILE WITH BARE KEYS, on purpose: the engine's own published
 * sample is one, and a format 1 catalog written by a person is not JSON. It is therefore the
 * path through the converter's own evaluation, which is the half a JSON fixture would never
 * reach.
 *
 * AND THE SECOND PRESS IS PART OF THE MEASUREMENT. Upgrading the same file twice must refuse
 * and write nothing, because the folder it would land in already holds a project; the draft's
 * bytes are read before and after that press.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { openStudio } from "./shell-door.mjs";
import * as Engine from "../src/engine.mjs";
import { PROJECT_FILE, DRAFT_FILE } from "../src/publish.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { pressWhen, settleOn } from "./press.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "upgrade-screen");

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sha = p => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex").slice(0, 16);

/* ---- the format 1 catalog, written as a person writes one ------------------------------------
 *
 * Bare keys, a comment header and one assignment, which is the shape every format 1 catalog in
 * existence has: the engine's importer found its payload by searching for the global's name and
 * the converter does the same. Invented words throughout, and both languages on every card, so
 * that the conversion has a Polish to declare and the pinned lint has nothing to say.
 */
const V1 = [
  "/* A catalog of the older shape, written by hand. */",
  "window.PB_SAMPLE={",
  '  format:1, kind:"playbook-catalog", name:"Ondrave plasule",',
  '  version:"2026-09-17",',
  '  categories:{ gr:"Greeting", rf:"Refunds" },',
  '  categoriesPl:{ gr:"Powitanie", rf:"Zwroty" },',
  '  icons:{ gr:"star" },',
  '  intents:{ en:["Asked twice","Baggage"], pl:["Pytane dwa razy","Bagaz"],',
  '            cmt:["a first ask","a bag"], cmtPl:["pierwsze pytanie","bagaz"] },',
  "  cards:[",
  '    { c:"gr", t:"Widuma tosork", en:"Sarnesk kelbun ondrave one.",',
  '      pl:"Sarnesk kelbun widuma jeden.", intents:[0] },',
  '    { c:"gr", t:"Ondrave plasib", en:"Sarnesk kelbun ondrave two.",',
  '      pl:"Sarnesk kelbun widuma dwa.", intents:[0,1] },',
  '    { c:"rf", t:"Kelbun sarnesk", en:"Sarnesk kelbun ondrave three.",',
  '      pl:"Sarnesk kelbun widuma trzy." }',
  "  ]",
  "};",
  "",
].join("\n");

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

const UPGRADE_ROWS = ["The file", "What came in", "What changes"];
function upgradeRowsHeld(heads) {
  const missing = missingMembers(heads, UPGRADE_ROWS, true);
  if ((heads || []).length < UPGRADE_ROWS.length) missing.push("rows under " + UPGRADE_ROWS.length);
  return { ok: missing.length === 0, missing };
}
/* COUNTS:END */

async function main(argv) {
  const keep = argv.indexOf("--keep") >= 0;
  clearScratch(SCRATCH);
  const projects = path.join(SCRATCH, "projects");
  fs.mkdirSync(projects, { recursive: true });
  const v1At = path.join(SCRATCH, "older-catalog.js");
  fs.writeFileSync(v1At, V1, "utf8");

  /* ---- the command line's own answer, first ------------------------------------------------- */
  const convertAt = path.join(Engine.PINNED, "tools", "catalog-v2", "convert.mjs");
  const cliEc = path.join(SCRATCH, "from-the-command-line.ec");
  const cli = spawnSync(process.execPath, [convertAt, v1At, "--out", cliEc, "--eval"],
    { encoding: "utf8" });
  check(cli.status === 0 && fs.existsSync(cliEc),
    "1a node tools/catalog-v2/convert.mjs converts the file at the command line (exit "
    + cli.status + ")" + (cli.status ? ": " + String(cli.stderr || "").trim() : ""));
  const declaredCli = String(cli.stdout || "").split("\n")
    .map(l => /^ {2}declared {2}(\d+) {2}(.*)$/.exec(l.trim().length ? l : ""))
    .filter(Boolean).map(m => m[1] + " " + m[2]);

  /* ---- a file that is not a catalog (bug hunt 3, item 16) -----------------------------------
     A table and a damaged catalog were answered with the reader's own parser message, in
     English on either screen. Each is now a frame with a Polish pair, and the table's names the
     door that reads tables. 2a, below, is the control that a catalog still plans. */
  const S = await import("../src/studio.mjs");
  const langText = fs.readFileSync(path.join(HERE, "..", "ui", "lang.js"), "utf8");
  const refusalOn = async (name, text) => {
    const at = path.join(SCRATCH, name);
    fs.writeFileSync(at, text, "utf8");
    try { await S.upgradePlan(projects, at); return null; } catch (e) { return e; }
  };
  const asTable = await refusalOn("cards.csv", "title,body\nTosan widil,Farlil zubork.\n");
  const asRuin = await refusalOn("cut-short.ec", '{"format":2,"kind":"etiuda-catalog","id":"ondr');
  const paired = (e) => !!(e && e.said) && langText.indexOf(JSON.stringify(e.said.frame) + ":") >= 0;
  check(paired(asTable) && /Import into this catalog/.test(asTable.message)
        && /^cards\.csv /.test(asTable.message)
        && paired(asRuin) && !/Import into/.test(asRuin.message) && /^cut-short\.ec /.test(asRuin.message),
    "1b a table and a damaged catalog are refused in frames with Polish pairs, the table's naming"
    + " the door that reads it: " + JSON.stringify([asTable && asTable.message, asRuin && asRuin.message]));

  const studio = await openStudio("tests/upgrade-screen.mjs", { words: true,
    projects, userDataDir: path.join(SCRATCH, "ud"),
    /* Projects' one door answers to STUDIO_TEST_FILE and sends a catalog to this cover (import-no-spreadsheet-door) */
    env: { STUDIO_TEST_V1: v1At, STUDIO_TEST_FILE: v1At },
  });

  let cover = null, landed = null, again = null, heldOnSecond = false;
  try {
    const page = studio.page;
    const press = async (sel, ms) => {
      await pressWhen(page, sel, { who: "tests/upgrade-screen.mjs" });
      await sleep(ms || 350);
    };
    const state = async (js) => JSON.parse(await page.evaluate("JSON.stringify(" + js + ")"));

    await press('[data-act="bring"]', 1200);
    await settleOn(page, '!document.querySelector("#scrim").hidden && !!(document.querySelector("#dlg h2") || {}).textContent', { bound: 30000 });
    cover = await state(`{
      h2: (document.querySelector("#dlg h2") || {}).textContent || "",
      heads: Array.from(document.querySelectorAll("#dlg .kv .k")).map(e => e.textContent),
      came: (() => { const e = Array.from(document.querySelectorAll("#dlg .kv")).find(r => (r.querySelector(".k") || {}).textContent === "What came in");
        return e ? Array.from(e.querySelectorAll(".v, .n")).map(x => x.textContent).join("|") : ""; })(),
      changed: (() => { const e = Array.from(document.querySelectorAll("#dlg .kv")).find(r => (r.querySelector(".k") || {}).textContent === "What changes");
        return e ? Array.from(e.querySelectorAll(".n")).map(x => x.textContent) : []; })(),
      open: !document.querySelector("#scrim").hidden,
    }`);
    const rows2 = upgradeRowsHeld(cover.heads);
    check(cover.open && cover.h2 === "A catalog file from an earlier Etiuda" && rows2.ok,
      "2a the cover opens on the picked file and no folder written yet"
      + (rows2.missing.length ? ", missing " + rows2.missing.join(", ") : "")
      + ": " + JSON.stringify(cover.heads));
    check(cover.came === "3 cards|2 categories|2 intents|en, pl",
      "2b what came in is the converter's own counts: " + JSON.stringify(cover.came));
    check(declaredCli.length > 0 && cover.changed.join("|") === declaredCli.join("|"),
      "2c and what changed is the command line's own declared lines, in its order: "
      + JSON.stringify(cover.changed) + " against " + JSON.stringify(declaredCli));

    await press('[data-act="do-upgrade"]', 1500);
    await settleOn(page, '(window.STUDIO_READY || {}).screen === "cards"', { bound: 30000 });
    landed = await state(`{
      screen: window.STUDIO_READY.screen,
      cover: !document.querySelector("#scrim").hidden,
      tabs: Array.from(document.querySelectorAll("#tabs .tab")).map(e => e.textContent),
      rows: document.querySelectorAll("#main tr[data-id]").length,
      rail: Array.from(document.querySelectorAll("#rail a")).map(e => e.textContent),
    }`);
    check(!landed.cover && landed.screen === "cards" && landed.rows === 3,
      "3a landing opens the upgraded catalog on its cards (" + landed.rows + " row(s), screen "
      + landed.screen + ")");
    check(landed.rail.slice(0, 3).join("|") === "Cards3|Intents2|Categories2",
      "3b with the rail counting what the file held: " + JSON.stringify(landed.rail.slice(0, 3)));
    check(landed.tabs.join("|").indexOf("ondrave-plasule") >= 0,
      "3c and a tab under its folder's name, which is the catalog's id: " + JSON.stringify(landed.tabs));

    /* ---- the same file a second time ---------------------------------------------------------- */
    const draftAt = path.join(projects, "ondrave-plasule", DRAFT_FILE);
    const before = fs.readFileSync(draftAt);
    /* THE COVER KNOWS BEFORE THE PRESS (bug hunt 3, item 3). It showed clean counts and an
       Import that could only be refused, with no name to change; now it names the project
       already there and asks for a free name, and the catalog lands beside it under its own id.
       2a, whose cover has no such row, is the control. */
    await press('[data-act="to-projects"]', 700);
    await press('[data-act="bring"]', 1200);
    await settleOn(page, '!document.querySelector("#scrim").hidden && !!document.querySelector("#upName")', { bound: 30000 });
    again = await state(`{
      heads: Array.from(document.querySelectorAll("#dlg .kv .k")).map(e => e.textContent),
      name: (document.querySelector("#upName") || {}).value || "",
      notes: Array.from(document.querySelectorAll("#dlg .kv .n")).map(e => e.textContent),
    }`);
    await press('[data-act="do-upgrade"]', 1500);
    heldOnSecond = Buffer.compare(before, fs.readFileSync(draftAt)) === 0;
    const secondAt = path.join(projects, "ondrave-plasule 2", DRAFT_FILE);
    const second = fs.existsSync(secondAt) ? JSON.parse(fs.readFileSync(secondAt, "utf8")) : {};
    const landedTwice = await state(`{ cover: !document.querySelector("#scrim").hidden,
      screen: window.STUDIO_READY.screen }`);
    check(again.heads.indexOf("Catalog") >= 0 && again.name === "ondrave-plasule 2"
          && again.notes.some(n => n.indexOf(path.join(projects, "ondrave-plasule")) >= 0),
      "4a the same file a second time: the cover names the project already there and offers a free"
      + " name before anything is pressed: " + JSON.stringify(again));
    check(heldOnSecond && second.id === "ondrave-plasule" && !("name" in second)
          && !landedTwice.cover && landedTwice.screen === "cards",
      "4b and Import lands it as a second project in a folder of that name, under the catalog's own id and no name,"
      + " leaving the first draft byte for byte: " + JSON.stringify({ id: second.id,
        named: "name" in second, first: heldOnSecond, screen: landedTwice.screen }));
  } finally {
    await studio.shut();
  }
  await sleep(400);

  /* ---- the two files ------------------------------------------------------------------------ */

  const dir = path.join(projects, "ondrave-plasule");
  const draftAt = path.join(dir, DRAFT_FILE);
  const a = sha(cliEc), b = sha(draftAt);
  check(a === b, "5a the draft the screen wrote and the file the command line wrote are the same"
    + " file, sha256 " + a + " against " + b);

  const proj = JSON.parse(fs.readFileSync(path.join(dir, PROJECT_FILE), "utf8"));
  const draft = JSON.parse(fs.readFileSync(draftAt, "utf8"));
  check(proj.id === "ondrave-plasule" && proj.rev === 1 && proj.edition === "2026-09-17",
    "5b the project starts at the revision and the edition the older file carried, so the next"
    + " publish is the next revision of the same catalog (rev " + proj.rev + ", "
    + JSON.stringify(proj.edition) + ")");
  const F = await Engine.format();
  const bare = Object.assign({}, draft); delete bare.hash; delete bare.sig;
  check(draft.hash === F.contentHash(bare) && draft.format === 2,
    "5c the draft is format 2 under the engine's own content hash (" + draft.hash + ")");

  const { loadCatalog, lintCatalog } = Engine.lint();
  let read = null, err = null;
  try { read = loadCatalog(draftAt); } catch (e) { err = e; }
  check(!!read && !err, "6a the pinned engine's own loadCatalog reads the upgraded draft"
    + (err ? ": " + err.message : ""));
  const l = lintCatalog(read);
  check(l.errors.length === 0,
    "6b with nothing the lint calls an error: " + l.errors.length + " error(s), "
    + l.warnings.length + " warning(s)"
    + (l.errors.length ? " " + JSON.stringify(l.errors) : ""));
  check(read.intents.en.join("|") === "Asked twice|Baggage"
    && read.categories.gr === undefined && read.cards.length === 3,
    "6c and the runtime shape carries the intents in file order under the format's own tag ids"
    + " rather than the older keys (" + JSON.stringify(Object.keys(read.categories)) + ")");

  if (!keep) dropScratch(SCRATCH, "upgrade-screen");
  process.stdout.write("upgrade-screen  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("upgrade-screen  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
