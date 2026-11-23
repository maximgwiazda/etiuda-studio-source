/* IMPORTING FROM THE SCREEN IS IMPORTING FROM THE COMMAND LINE. Course node 6's screens.
 *
 *     node tests/import-screen.mjs [--keep]
 *
 * THE CLAIM IS BYTE FOR BYTE, on both files an import writes. A seeded pile is taken through the
 * three covers in a real window - the rail row, the mapping table, Next, Land - and the draft and
 * the report it leaves behind must have the same sha256 as `node tools/import.mjs` gives for the
 * same pile. Anything less would pass with the wizard writing a different indent, guessing a
 * different id, or quietly mapping a column the command line does not, and a draft is the file
 * every later act of Studio reads.
 *
 * THE SECOND HALF IS THE MAPPING, because a wizard whose selects do nothing would satisfy the
 * first half perfectly. One column is sent to Do not import on the screen, and the draft that
 * lands is then held against `node tools/import.mjs --drop`, the same decision taken at the
 * command line - so the screen's control is proved to be the command line's flag rather than
 * proved to exist.
 *
 * WHY THE PICKER IS ANSWERED BY AN ENVIRONMENT VARIABLE. A native file dialog is the system's
 * window, not the page's, and it blocks the main process while it is up: a leg that opened one
 * would hang rather than fail. STUDIO_TEST_FILE answers that one step; every step after it is
 * the shipped code.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { openStudio } from "./shell-door.mjs";
import * as Engine from "../src/engine.mjs";
import { importCsv } from "../src/import.mjs";
import { json, PROJECT_FILE, DRAFT_FILE } from "../src/publish.mjs";
import { reviewProposal } from "../src/review.mjs";
import { INBOX, DECIDED } from "../src/studio.mjs";
import { examine } from "../src/source.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { pressWhen, settleOn } from "./press.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "import-screen");

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sha = p => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");

/* The pile: placeholders the engine has a field for and two it has not, near duplicates, and a
   category nobody stands on - so that all three covers have something to show. No fault that
   the lint calls an error, because the draft is also read back by the engine's own reader. */
function pile(name, seed) {
  const out = path.join(SCRATCH, "piles", name);
  const r = spawnSync(process.execPath, ["tools/fixtures/generate.mjs", "--seed", String(seed),
    "--rows", "20", "--out", out, "--platform-placeholders", "--near-duplicates",
    "--orphan-category"], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) throw new Error("the generator refused: " + (r.stderr || r.stdout));
  return path.join(out, "macros.csv");
}

async function plant(root, folder, csv, id) {
  const dir = path.join(root, folder);
  fs.mkdirSync(dir, { recursive: true });
  const made = await importCsv({ file: csv, id });
  fs.writeFileSync(path.join(dir, DRAFT_FILE), json(made.catalog), "utf8");
  fs.writeFileSync(path.join(dir, PROJECT_FILE),
    json({ id: made.catalog.id, rev: 0, edition: "", draft: DRAFT_FILE, folder: null }),
    "utf8");
  return dir;
}

/* A PROFILE PER LAUNCH: a launch reopens the project its profile last had on screen, and two piles share a file name. */
let launches = 0;
async function window(projects, file) {
  const studio = await openStudio("tests/import-screen.mjs", { words: true,
    projects, userDataDir: path.join(SCRATCH, "ud-" + (++launches) + "-" + path.basename(file)),
    env: { STUDIO_TEST_FILE: file },
  });
  const page = studio.page;
  const press = async (sel, ms) => {
    await pressWhen(page, sel, { who: "tests/import-screen.mjs" });
    await sleep(ms || 400);
  };
  return { page, press, shut: studio.shut };
}

/* Open a project, then the chrome row's Import into this catalog. That row opens the paste
 * door (board 956). Choose a file is the pick, which STUDIO_TEST_FILE answers, and that is
 * what starts the covers. The rail's Import row is a page of its own since C09, the sheet's
 * frame C09-6.
 *
 * `asNew` ANSWERS THE FIRST STEP'S NEW QUESTION (board 539). The wizard opens on "into this
 * project" now, which is the door the chrome row promises and the one that ends at the review
 * queue; a leg about the three covers has to say the other answer out loud to reach a third
 * cover at all. Section 6 below is the one that leaves it alone. */
/* THE ROW IS OPENED FROM THE LIBRARY (board 982 E, 2026-11-11), the pattern of tests/polish.mjs (17d97d46) and
   tests/bad-day.mjs (628c4835): Overview shows a catalog only once it has been opened, as one of its four recent cards, so a
   project this leg planted and never opened has its Open in the Library alone. The home tab first, from wherever the window
   stands, then the rail's Library, then the row by its folder. */
async function openFromLibrary(page, projectDir, who) {
  await pressWhen(page, '#tabs [data-act="to-projects"]', { who });
  await settleOn(page, '(window.STUDIO_READY || {}).screen === "projects"', { bound: 30000 });
  await pressWhen(page, '#rail [data-act="home"][data-v="library"]', { who });
  await settleOn(page, 'document.querySelectorAll("#main tr[data-dir]").length > 0', { bound: 30000 });
  await pressWhen(page, '[data-act="open"]', { who, attr: ["data-dir", projectDir] });
}

async function intoWizard(w, dir, asNew) {
  await openFromLibrary(w.page, dir, "tests/import-screen.mjs");
  await sleep(700);
  await w.press('[data-act="import"]', 400);
  await w.press('[data-act="wiz-pick"]', 1600);
  if (asNew !== false) await w.press('[data-act="wiz-into"][data-v="new"]', 500);
}

const READY = () => "JSON.stringify(window.STUDIO_READY)";

/** The English counted noun the screen builds, so an expectation reads as the screen reads. */
const C = (n, noun) => n + " " + noun + (n === 1 ? "" : "s");

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

const IMPORT_HEADS = ["Column in the file", "Becomes", "First row reads"];
function importHeadsHeld(heads) {
  const missing = missingMembers(heads, IMPORT_HEADS, true);
  if ((heads || []).length < IMPORT_HEADS.length) missing.push("headings under " + IMPORT_HEADS.length);
  return { ok: missing.length === 0, missing };
}
const WIZARD_STEP_PHRASES = ["What is in this file", "Languages and duplicates", "Land it as a draft"];
const WIZARD_FOOT = ["Cancel", "Next: languages and duplicates"];
function wizardChromeHeld(steps, foot, footUp) {
  const stepText = (steps || []).map(s => String(s));
  const missing = [];
  let from = 0;
  for (const phrase of WIZARD_STEP_PHRASES) {
    let at = -1;
    for (let i = from; i < stepText.length; i++) {
      if (stepText[i].indexOf(phrase) >= 0) { at = i; break; }
    }
    if (at < 0) missing.push(phrase);
    else from = at + 1;
  }
  missing.push.apply(missing, missingMembers(foot, WIZARD_FOOT, true));
  if (!footUp) missing.push("foot hidden");
  if (stepText.length < WIZARD_STEP_PHRASES.length) missing.push("steps under " + WIZARD_STEP_PHRASES.length);
  return { ok: missing.length === 0, missing };
}
function importLookHeld(panes) {
  const p = (panes || []).map(s => String(s));
  const missing = [];
  const langAt = p.indexOf("Languages");
  const holdAt = p.indexOf("Placeholders");
  const dupAt = p.findIndex(x => /^Duplicates/.test(x));
  if (langAt < 0) missing.push("Languages");
  if (holdAt < 0) missing.push("Placeholders");
  if (dupAt < 0) missing.push("Duplicates");
  if (langAt >= 0 && holdAt >= 0 && dupAt >= 0 && !(langAt < holdAt && holdAt < dupAt)) missing.push("pane order");
  if (p.length < 3) missing.push("panes under 3");
  return { ok: missing.length === 0, missing };
}
const LANDED_PANES = ["What came in", "What the checks found", "What is left out"];
function importLandedHeld(panes) {
  const missing = missingMembers(panes, LANDED_PANES, true);
  if ((panes || []).length < LANDED_PANES.length + 1) missing.push("panes under " + (LANDED_PANES.length + 1));
  return { ok: missing.length === 0, missing };
}
function importPreviewHeld(rows, panes) {
  const missing = [];
  if (!(panes || []).some(p => /The first of the 23 cards/.test(p))) missing.push("The first of the 23 cards");
  if ((rows || 0) < 10) missing.push("preview rows under 10");
  return { ok: missing.length === 0, missing };
}
function mappingFootHeld(foot, held) {
  const missing = missingMembers(foot, WIZARD_FOOT, true);
  if ((held || []).indexOf("Next: languages and duplicates") < 0) missing.push("held Next: languages and duplicates");
  if (!(held || []).every(h => /^Next/.test(h))) {
    (held || []).filter(h => !/^Next/.test(String(h))).forEach(h => missing.push(String(h)));
  }
  return { ok: missing.length === 0, missing };
}
function cancelFootHeld(foot) {
  const missing = missingMembers(foot, ["Cancel"], false);
  return { ok: missing.length === 0, missing };
}
function refusalBoxesHeld(dashed, first, second) {
  const missing = missingMembers(dashed, [first, second], true);
  if ((dashed || []).length < 2) missing.push("boxes under 2");
  return { ok: missing.length === 0, missing };
}
/* COUNTS:END */

async function main(argv) {
  const keep = argv.indexOf("--keep") >= 0;
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const projects = path.join(SCRATCH, "projects");
  const home = await plant(projects, "home", pile("home", 80), "home-catalog");

  /* Two names for one pile, because an import lands in a folder named by the catalog's id and
     the second half of this leg imports the same rows a second time. The bytes are identical
     and the two ids are not. */
  const one = pile("one", 71);
  /* THE ORACLE IS THE IMPORTER ITSELF, called here rather than described: every number this leg
     expects on a cover is the number the import produces, so a change to the pile or to the
     generator moves the expectation with it and a wrong screen still fails. */
  const oracle = (await importCsv({ file: one })).report;
  const two = path.join(SCRATCH, "piles", "one", "macros-two.csv");
  fs.copyFileSync(one, two);

  /* ---- 1. THE THREE COVERS, WITH THE MAPPING LEFT ALONE ---------------------------------- */

  let w = await window(projects, one);
  try {
    await intoWizard(w, home);
    const cover1 = JSON.parse(await w.page.evaluate(`JSON.stringify({
      ready: window.STUDIO_READY,
      h1: (document.querySelector("#main h1") || {}).textContent || "",
      lede: (document.querySelector("#main .lede") || {}).textContent || "",
      /* THE MAPPING TABLE BY THE CONTROL IT HOLDS, not by being the only table on the cover:
         board 642 put the top of the person's own file beside it, so "every tr in #main" is now
         the file's rows and the mapping's together and this leg counted twelve of nine. The
         table with the selects in it is the mapping table, whatever else is drawn. */
      heads: Array.from((Array.from(document.querySelectorAll("#main table"))
        .find(t => t.querySelector("select")) || document.createElement("table"))
        .querySelectorAll("th")).map(e => e.textContent),
      cols: Array.from((Array.from(document.querySelectorAll("#main table"))
        .find(t => t.querySelector("select")) || document.createElement("table"))
        .querySelectorAll("tr"))
        .slice(1).map(tr => ({
          header: tr.cells[0].textContent,
          becomes: (tr.querySelector("select") || {}).value,
          shown: (tr.querySelector("select option[selected]") || {}).textContent || "",
          first: tr.cells[2].textContent,
        })),
      rail: Array.from(document.querySelectorAll("#rail a, #rail .grp, #rail .num"))
        .map(e => e.textContent),
      steps: Array.from(document.querySelectorAll("#chrome .step")).map(e => e.textContent),
      foot: Array.from(document.querySelectorAll("#foot button")).map(e => e.textContent),
      footUp: !document.querySelector("#foot").hidden,
      said: Array.from(document.querySelectorAll("#main .dashed")).map(e => e.textContent),
      bold: Array.from(document.querySelectorAll("#main .dashed b")).map(e => e.textContent),
      /* Each select's width against the width its shown word needs, measured in its own font. */
      short: Array.from(document.querySelectorAll("#main select[data-col]")).filter(s => {
        const cs = getComputedStyle(s), o = s.options[s.selectedIndex];
        const c = document.createElement("canvas").getContext("2d"); c.font = cs.font;
        return s.getBoundingClientRect().width + 0.5 < c.measureText(o ? o.text : "").width
          + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      }).map(s => s.getAttribute("data-col")),
    })`));

    check(cover1.ready.screen === "import1" && cover1.h1 === "What is in this file",
      "1a the Import rail row opens the first cover (screen=" + cover1.ready.screen + ")");
    const heads1 = importHeadsHeld(cover1.heads);
    check(cover1.cols.length === 9 && heads1.ok,
      "1b it holds one row per column of the file, " + cover1.cols.length + " of them, under the"
      + " canvas's headings"
      + (heads1.missing.length ? ", missing " + heads1.missing.join(", ") : ""));
    const byHeader = {};
    cover1.cols.forEach(c => { byHeader[c.header] = c; });
    check(byHeader.body_pl && byHeader.body_pl.becomes === "body.pl"
      && byHeader.body_pl.shown === "Text (Polish)",
      "1c each Becomes select carries the mapper's own verdict: body_pl reads "
      + JSON.stringify(byHeader.body_pl && byHeader.body_pl.shown));
    const csvFirst = fs.readFileSync(one, "utf8").split("\n")[1] || "";
    check(byHeader.id && csvFirst.indexOf(byHeader.id.first) === 0 && byHeader.id.first.length > 3,
      "1d and the first row of the file beside it, unaltered: " + JSON.stringify(byHeader.id.first));
    check(cover1.short.length === 0,
      "1d2 every Becomes select is as wide as the word it shows (polish 04, item 8): "
      + cover1.short.length + " cut " + JSON.stringify(cover1.short));
    const chrome1 = wizardChromeHeld(cover1.steps, cover1.foot, cover1.footUp);
    check(chrome1.ok,
      "1e the chrome row is the steps and the foot is up"
      + (chrome1.missing.length ? ", missing " + chrome1.missing.join(", ") : "")
      + ": " + JSON.stringify(cover1.foot));
    const shape = C(oracle.counts.cards, "row") + ", " + C(9, "column") + ", UTF-8";
    check(cover1.rail.join(" ").indexOf("macros.csv") >= 0
      && cover1.rail.join(" ").indexOf(shape) >= 0,
      "1f the rail names the file and its shape, " + JSON.stringify(shape) + ": "
      + JSON.stringify(cover1.rail.filter(x => /rows/.test(x))[0]));

    /* WHAT THE READER FOUND, ON THE COVER AND NOT ONLY IN THE .lint.json BESIDE THE IMPORT
       (642). This showed the findings the importer calls errors and nothing else, and three
       rounds on src/source.mjs turned what used to be silent loss into warnings - a wall of
       prose demoted to one column, a header whose empty name swallowed the cells under it,
       fields past the header, a cycle position no field claimed. Every one of those changes
       what lands in somebody's catalog. The oracle is the importer's own findings for the same
       file, taken from the report rather than from the screen, so a box that dropped one or
       invented one fails; and the CONTROL is that what stops the import is bold and what
       changed the reading is not, which is how this canvas carries severity - it has no hue for
       it anywhere. */
    const oracleWarn = (oracle.findings || []).filter(f => f.severity === "warning");
    const oracleBad = (oracle.findings || []).filter(f => f.severity === "error");
    const saidAll = cover1.said.join(" ");
    check(oracleWarn.length > 0 && oracleWarn.every(f => saidAll.indexOf(f.what) >= 0)
      && oracleBad.every(f => saidAll.indexOf(f.what) >= 0),
      "1g every finding the importer raised is said on the cover, not only the ones that stop"
      + " it: " + oracleWarn.length + " warning(s) and " + oracleBad.length + " error(s), all"
      + " found in " + cover1.said.length + " box(es)");
    check(cover1.bold.length === oracleBad.length
      && oracleBad.every(f => cover1.bold.indexOf(f.what) >= 0),
      "1h THE CONTROL: severity is weight and not a hue on this canvas, so what stops the import"
      + " is the " + cover1.bold.length + " bold sentence(s) and the warnings are not");

    await w.press('[data-act="wiz-next"]', 500);
    await settleOn(w.page, '(window.STUDIO_READY || {}).screen === "import2"', { bound: 30000 });
    const cover2 = JSON.parse(await w.page.evaluate(`JSON.stringify({
      screen: window.STUDIO_READY.screen,
      h1: (document.querySelector("#main h1") || {}).textContent || "",
      panes: Array.from(document.querySelectorAll("#main .pane h3")).map(e => e.textContent),
      text: document.querySelector("#main").textContent,
      /* THE LAST .pane AND NOT :last-of-type. The pseudo-class matches the last DIV among its
         siblings that also carries the class, so the day board 642 put a dashed box of the
         reader's own warnings after the panes, it matched nothing at all and this leg read
         zero rows on a screen that had four. Taken as an array, it is the last pane. */
      dupRows: (Array.from(document.querySelectorAll("#main .pane")).find(p => /^Duplicates/.test((p.querySelector("h3") || {}).textContent || ""))
        || { querySelectorAll: () => [] }).querySelectorAll("table tr").length,
      dupSelects: (Array.from(document.querySelectorAll("#main .pane")).find(p => /^Duplicates/.test((p.querySelector("h3") || {}).textContent || ""))
        || { querySelectorAll: () => [] }).querySelectorAll("select").length,
      boxes: document.querySelectorAll("#main .boxes .box").length,
    })`));
    check(cover2.screen === "import2" && cover2.h1 === "What the file looks like",
      "2a Next goes to the second cover (screen=" + cover2.screen + ")");
    const look2 = importLookHeld(cover2.panes);
    check(look2.ok,
      "2b with the canvas's panes"
      + (look2.missing.length ? ", missing " + look2.missing.join(", ") : "")
      + ": " + JSON.stringify(cover2.panes));
    const dupPane = (cover2.panes || []).find(p => /^Duplicates/.test(p)) || "";
    check(/0 the same, 3 close/.test(dupPane) && cover2.dupRows === 4,
      "2c the duplicates the importer found, and no others: " + JSON.stringify(cover2.panes[2])
      + ", " + (cover2.dupRows - 1) + " row(s)");
    check(cover2.dupSelects === 0 && /Keep both/.test(cover2.text),
      "2d and the Do what column states what happened rather than offering a choice this"
      + " importer has not got (" + cover2.dupSelects + " selects in that pane)");
    /* The expected lines are built from the importer's own report, computed here by calling
       it directly: an expectation written as a literal would be this leg agreeing with itself
       about what the pile contains. */
    const want = oracle.placeholders.mapped.map(x => x.token).concat(
      oracle.placeholders.flagged.map(x => x.token));
    const missed = want.filter(t => cover2.text.indexOf(t) < 0);
    const uses = oracle.placeholders.flagged
      .map(x => "in " + C(x.n, "use") + ".").filter(l => cover2.text.indexOf(l) < 0);
    check(missed.length === 0 && uses.length === 0 && cover2.boxes === 2
      && /has no equivalent here/.test(cover2.text),
      "2e every one of the " + want.length + " tokens the importer met is named with its count,"
      + " and there is one bar per language (" + missed.length + " token(s) and "
      + uses.length + " count(s) missing)");

    await w.press('[data-act="wiz-land"]', 1600);
    await settleOn(w.page, '(window.STUDIO_READY || {}).screen === "import3"', { bound: 30000 });
    const cover3 = JSON.parse(await w.page.evaluate(`JSON.stringify({
      screen: window.STUDIO_READY.screen,
      h1: (document.querySelector("#main h1") || {}).textContent || "",
      panes: Array.from(document.querySelectorAll("#main .pane h3")).map(e => e.textContent),
      text: document.querySelector("#main").textContent,
      rows: (function () {
        const ts = document.querySelectorAll("#main table");
        return ts.length ? ts[ts.length - 1].rows.length : 0;
      })(),
      tabs: Array.from(document.querySelectorAll("#tabs .tab")).map(e => e.textContent),
      foot: Array.from(document.querySelectorAll("#foot button")).map(e => e.textContent),
    })`));
    check(cover3.screen === "import3" && cover3.h1 === "Landed as a draft",
      "3a Land goes to the third cover (screen=" + cover3.screen + ")");
    const landed3 = importLandedHeld(cover3.panes);
    check(landed3.ok,
      "3b with the canvas's panes and the table under them"
      + (landed3.missing.length ? ", missing " + landed3.missing.join(", ") : "")
      + ": " + JSON.stringify(cover3.panes));
    check(/23 cards/.test(cover3.text) && /6 categories/.test(cover3.text)
      && /4 intents/.test(cover3.text),
      "3c naming what came in, by the importer's own counts");
    const preview3 = importPreviewHeld(cover3.rows, cover3.panes);
    check(preview3.ok,
      "3d and showing the first nine of them as they landed (" + (cover3.rows - 1) + " rows)"
      + (preview3.missing.length ? ", missing " + preview3.missing.join(", ") : ""));
    check(cover3.tabs.some(t => /macros/.test(t)),
      "3e the landed draft is a tab in the band: " + JSON.stringify(cover3.tabs));

    await w.press('[data-act="wiz-cards"]', 700);
    await settleOn(w.page, '(window.STUDIO_READY || {}).screen === "cards"', { bound: 30000 });
    const after = JSON.parse(await w.page.evaluate(READY()));
    check(after.screen === "cards",
      "3f and Go to the cards ends in the editor with the draft open (screen=" + after.screen + ")");
  } finally { await w.shut(); }

  /* ---- 2. THE SAME PILE THROUGH THE COMMAND LINE ------------------------------------------ */

  /* A NEW CATALOG'S ID IS RANDOM (ac137e4), made once when the covers landed it, so the command
     line is handed that id with --id: the same bytes then mean the same import, where two random
     ids would make them differ by the id alone. The screen names its files after the folder and
     the command line after the id, which is why the two paths below are not one name. */
  const screenDir = path.join(projects, "macros");
  const screenId = fs.existsSync(path.join(screenDir, PROJECT_FILE))
    ? JSON.parse(fs.readFileSync(path.join(screenDir, PROJECT_FILE), "utf8")).id : "absent";
  const cli = path.join(SCRATCH, "cli");
  const r1 = spawnSync(process.execPath, ["tools/import.mjs", one, cli, "--id", screenId],
    { cwd: ROOT, encoding: "utf8" });
  check(r1.status === 0, "4a node tools/import.mjs imported the same pile under the covers' id, exit "
    + r1.status);

  const cliDraft = path.join(cli, screenId + ".draft.json");
  const pairs = [
    ["the draft", path.join(screenDir, "macros.draft.json"), cliDraft],
    ["the report beside it", path.join(screenDir, "macros.lint.json"),
     path.join(cli, screenId + ".lint.json")],
  ];
  for (const [what, a, b] of pairs) {
    const sa = fs.existsSync(a) ? sha(a) : "absent", sb = fs.existsSync(b) ? sha(b) : "absent";
    check(sa === sb && sa !== "absent", "4b " + what + " is the same bytes from the three covers"
      + " and from the command line (" + sa.slice(0, 16) + ")");
  }

  /* Identical bytes prove nothing on their own if both are rubbish, so the file the covers wrote
     is read back by the pinned engine's own reader. */
  const { loadCatalog } = Engine.lint();
  let read = null, refusal = null;
  try { read = loadCatalog(path.join(screenDir, "macros.draft.json")); }
  catch (e) { refusal = e; }
  check(!!read && !refusal, "4c and the draft the covers wrote is one the pinned engine reads"
    + (refusal ? ": " + refusal.message : ""));

  /* ---- 3. THE MAPPING SELECT IS THE COMMAND LINE'S FLAG ------------------------------------- */

  w = await window(projects, two);
  try {
    await intoWizard(w, home);
    /* THE MAPPING PANE'S OWN LEDE and not the first on the cover: since 642 the first says what
       kind of file this is, which does not change when a column is dropped. */
    const LEDE = `JSON.stringify({ lede: ((Array.from(document.querySelectorAll("#main .pane"))
      .find(n => n.querySelector("select")) || document.createElement("div"))
      .querySelector(".lede") || {}).textContent || "" })`;
    const before = JSON.parse(await w.page.evaluate(LEDE));
    await w.page.evaluate(() => {
      const s = document.querySelector('select[data-col="note_en"]');
      s.value = "";
      s.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await settleOn(w.page, '/: 1\\./.test(((Array.from(document.querySelectorAll("#main .pane")).find(n => n.querySelector("select")) || document.createElement("div")).querySelector(".lede") || {}).textContent || "")', { bound: 30000 });
    const dropped = JSON.parse(await w.page.evaluate(LEDE));
    dropped.becomes = await w.page.evaluate(
      () => (document.querySelector('select[data-col="note_en"]') || {}).value);
    check(/: 0\./.test(before.lede) && /: 1\./.test(dropped.lede),
      "5a sending a column to Do not import runs the import again and the count follows: "
      + JSON.stringify(before.lede) + " became " + JSON.stringify(dropped.lede));
    check(dropped.becomes === "",
      "5b and the select holds the decision across the repaint");

    /* AND THE OTHER HALF OF 1h, WHICH THAT FIXTURE COULD NOT SHOW: a file with no error in it
       proves only that a warning is not bold. So a mapping is made to fight - two columns both
       claiming the English title - and what comes back has to be bold, because on this canvas
       weight is the whole of severity. The select is put back before the wizard goes on, so the
       legs below are still about the file they were written for. */
    await w.page.evaluate(() => {
      const s = document.querySelector('select[data-col="note_en"]');
      s.value = "title.en";
      s.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await settleOn(w.page, 'document.querySelectorAll("#main .dashed b").length > 0', { bound: 30000 });
    const clash = JSON.parse(await w.page.evaluate(`JSON.stringify({
      said: Array.from(document.querySelectorAll("#main .dashed")).map(e => e.textContent),
      bold: Array.from(document.querySelectorAll("#main .dashed b")).map(e => e.textContent),
    })`));
    check(clash.bold.length > 0
      && clash.bold.every(t => clash.said.join(" ").indexOf(t) >= 0),
      "5h THE OTHER HALF OF THE CONTROL: a mapping two columns fight over stops the import and"
      + " is said in bold, " + clash.bold.length + " sentence(s): "
      + JSON.stringify(String(clash.bold[0] || "").slice(0, 70)));
    await w.page.evaluate(() => {
      const s = document.querySelector('select[data-col="note_en"]');
      s.value = "";
      s.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await sleep(1400);

    await w.press('[data-act="wiz-next"]', 500);
    await w.press('[data-act="wiz-land"]', 1600);
    await settleOn(w.page, '(window.STUDIO_READY || {}).screen === "import3"', { bound: 30000 });
    const landed = JSON.parse(await w.page.evaluate(READY()));
    check(landed.screen === "import3", "5c it lands (screen=" + landed.screen + ")");
  } finally { await w.shut(); }

  const dropDir = path.join(projects, "macros-two");
  const dropId = JSON.parse(fs.readFileSync(path.join(dropDir, PROJECT_FILE), "utf8")).id;
  const cliDrop = path.join(SCRATCH, "cli-drop");
  const r2 = spawnSync(process.execPath,
    ["tools/import.mjs", two, cliDrop, "--drop", "note_en", "--id", dropId],
    { cwd: ROOT, encoding: "utf8" });
  check(r2.status === 0, "5d node tools/import.mjs --drop note_en ran, exit " + r2.status);

  const sScreen = sha(path.join(dropDir, "macros-two.draft.json"));
  const sCli = sha(path.join(cliDrop, dropId + ".draft.json"));
  check(sScreen === sCli, "5e the draft the select wrote is the draft --drop wrote, byte for"
    + " byte (" + sScreen.slice(0, 16) + " and " + sCli.slice(0, 16) + ")");
  check(sha(path.join(dropDir, "macros-two.lint.json"))
    === sha(path.join(cliDrop, dropId + ".lint.json")),
    "5f and so is the report, which is where the dropped column's verdict is recorded");
  check(sScreen !== sha(cliDraft).slice(0, 64) && sScreen.length === 64,
    "5g and it is not the draft the untouched mapping wrote");

  /* ---- 6. INTO THIS PROJECT, WHICH IS THE OTHER DOOR (board 539) ---------------------------
   *
   * The wizard's first step offers a choice its third cover used to make silently: a new
   * project, or this one. Answered the second way the pile is not a draft at all - it is a file
   * in the project's inbox and a queue of proposals, additions for the cards this catalog has
   * not got and changes for the ones it has.
   *
   * THE CONTROL IS THE ONE THE RULING ASKS FOR: the same pile through the screen and through
   * `node tools/import.mjs` plus `node tools/review.mjs` has to leave the working copy at the
   * same sha256. Two identical projects are planted from one catalog and one pile goes into
   * each by its own door.
   */

  const axleCsv = pile("axle", 91);
  const axleScreen = await plant(projects, "axle-screen", pile("axle-head", 92),
                                 "axle-catalog");
  const axleCli = await plant(projects, "axle-cli", pile("axle-head", 92),
                              "axle-catalog");
  check(sha(path.join(axleScreen, DRAFT_FILE)) === sha(path.join(axleCli, DRAFT_FILE)),
    "6a the two projects start as the same bytes, one for each door");

  const projectsBefore = fs.readdirSync(projects).length;
  w = await window(projects, axleCsv);
  let landedAt = "";
  try {
    await intoWizard(w, axleScreen, false);
    const step1 = JSON.parse(await w.page.evaluate(`JSON.stringify({
      target: (document.querySelector("#main .kv .v") || {}).textContent || "",
      note: (document.querySelector("#main .kv .n") || {}).textContent || "",
      on: Array.from(document.querySelectorAll('[data-act="wiz-into"]'))
        .filter(e => e.className.indexOf("on") >= 0).map(e => e.textContent),
      steps: Array.from(document.querySelectorAll("#chrome .step")).map(e => e.textContent),
      foot: Array.from(document.querySelectorAll("#foot button")).map(e => e.textContent),
    })`));
    check(step1.on.join("") === "Into this catalog" && step1.target === "axle-screen"
      && /arrives in Proposals/.test(step1.note),
      "6b the first step opens on Into this catalog, names the project by its own name and says"
      + " what will happen: " + JSON.stringify(step1.note));
    await w.press('[data-act="wiz-next"]', 700);
    await settleOn(w.page, 'Array.from(document.querySelectorAll("#foot button")).some(f => /Go through them/.test(f.textContent))', { bound: 30000 });
    const foot2 = JSON.parse(await w.page.evaluate(
      `JSON.stringify(Array.from(document.querySelectorAll("#foot button")).map(e => e.textContent))`));
    /* THE FOOT OF AN IMPORT INTO THIS PROJECT IS ONE DOOR, Go through them, sending the pile to Proposals and opening the
       stack on it (board 862, Drop then triage; its Accept all went with board 1016 item 7); tests/drop.mjs holds it in node.
       MOVED, old: "... the foot of the second follow the answer" with Accept all and Go through them; new: Go through them
       alone. */
    check(step1.steps[2] === "3Send it to Proposals"
      && !foot2.some(f => /^Accept all/.test(f.replace(/\s+/g, " ").trim())) && foot2.some(f => /Go through them/.test(f)),
      "6c and the third step and the foot of the second follow the answer rather than promising"
      + " a draft: " + JSON.stringify(step1.steps[2]) + ", " + JSON.stringify(foot2));
    await w.press('[data-act="wiz-land"][data-v="one"]', 2200);
    await settleOn(w.page, '!!document.querySelector("#stk .stk-card.hand")', { bound: 30000 });
    const queue = JSON.parse(await w.page.evaluate(`JSON.stringify({
      screen: window.STUDIO_READY.screen,
      h1: (document.querySelector("#main h1") || {}).textContent || "",
      src: ((document.querySelector("#stk .stk-card.hand .stk-src") || {}).textContent || "").trim(),
    })`));
    /* The file is named by the one the person chose a moment ago (item 42), now on the stack's card. MOVED, old: "it opens
       on its rows one at a time, naming the file the person chose" in the walk's lede; new: the stack, its card's source. */
    check(queue.screen === "proposals" && queue.h1 === "Review" && queue.src === "macros.csv",
      "6d Land sends it to the review queue rather than to a third cover, and the stack opens on its rows,"
      + " naming the file the person chose: " + JSON.stringify(queue.src));

    landedAt = path.join(axleScreen, INBOX, "macros.ec");
    check(fs.existsSync(landedAt) && fs.readdirSync(projects).length === projectsBefore,
      "6e the pile is a file waiting in this project's inbox and no new project was made beside"
      + " it: " + path.basename(landedAt) + ", " + fs.readdirSync(projects).length
      + " project folder(s) before and after");

    /* NOTHING IS TYPED INTO THE ATTRIBUTION FIELD (sense pass 2026-09-22, item 18): the stack attributes an import's rows to
       the file they came from unless a name is typed under Apply (stkFrom), and Apply is pressed on what the screen offers.
       Every imported row is answered yes in the stack (its chip filters out anything else waiting), one key at a time with
       the 340 ms the keys rest after an answer, and then Apply. MOVED with board 1016 item 7, old: "one at a time an import
       asks for no attribution, and Land logs the imported file's name"; new: the stack's A and Apply, the same log. */
    await w.page.evaluate(() => { const b = document.querySelector('#stkKinds [data-k="import"]'); if (b) b.click(); });
    await sleep(120);
    for (let i = 0; i < 200; i++) {
      const more = await w.page.evaluate(() => !!document.querySelector("#stk .stk-card.hand"));
      if (!more) break;
      await w.page.evaluate(() => { const s = document.querySelector("#stkStage"); if (s) s.focus(); });
      await w.page.keyboard.press("a");
      await sleep(380);
    }
    const typedFrom = await w.page.evaluate(() => Array.from(document.querySelectorAll("#stkTray .stk-from")).map((f) => f.value).join("|"));
    const logAt = path.join(axleScreen, "review-log.json");
    await w.press("#stkApply", 2000);
    await settleOn(w.page, '((document.querySelector("#stkApply") || {}).textContent || "").replace(/\\s+/g, " ").trim() === "Apply decided: 0"', { bound: 60000 });
    const landErr = await w.page.evaluate(() =>
      Array.from(document.querySelectorAll("#main .dashed, #stkTray .stk-refused")).map(e => e.textContent).join(" | "));
    const logged = fs.existsSync(logAt) ? JSON.parse(fs.readFileSync(logAt, "utf8")) : null;
    const lastFrom = logged && logged.reviews && logged.reviews.length
      ? logged.reviews[logged.reviews.length - 1].from : null;
    check(typedFrom === "" && lastFrom === "macros.csv" && !/attributable/.test(landErr),
      "6k the stack asks no attribution typed for an import, and Apply logs the imported file's name as where the rows"
      + " came from: typed " + JSON.stringify(typedFrom) + ", logged from "
      + JSON.stringify(lastFrom) + (landErr ? ", said " + JSON.stringify(landErr.slice(0, 80)) : ""));
    /* AND WITH NOTHING IN IT LEFT TO DECIDE IT LEAVES THE INBOX (sense pass item 19), so the
       bytes the legs below compare are where it went. */
    const putAwayAt = path.join(axleScreen, DECIDED, "macros.ec");
    check(!fs.existsSync(landedAt) && fs.existsSync(putAwayAt),
      "6l and with every row decided the file has left the inbox for " + DECIDED + "/");
    landedAt = putAwayAt;
  } finally { await w.shut(); }

  /* ---- the same pile into the twin, at the command line ------------------------------------ */

  const axleOut = path.join(SCRATCH, "axle-cli-import");
  const r6 = spawnSync(process.execPath, ["tools/import.mjs", axleCsv, axleOut],
    { cwd: ROOT, encoding: "utf8" });
  /* Exit 1 is the importer's "nothing is published, read the report" and not a failure; the
     pile is generated with findings on purpose, which is what the three covers are for. */
  check(r6.status === 0 || r6.status === 1,
    "6f node tools/import.mjs imported the same pile, exit " + r6.status
    + (r6.status ? ": " + String(r6.stderr || r6.stdout).trim().slice(-200) : ""));

  const cliProposal = path.join(axleCli, INBOX, "macros.ec");
  fs.mkdirSync(path.join(axleCli, INBOX), { recursive: true });
  fs.copyFileSync(path.join(axleOut, "macros.draft.json"), cliProposal);
  check(sha(cliProposal) === sha(landedAt),
    "6g and the file the screen left in the inbox IS the importer's own output, byte for byte -"
    + " the wizard writes no document of its own (" + sha(landedAt).slice(0, 16) + ")");

  const axleQueue = await reviewProposal({ project: axleCli, file: cliProposal, rules: [],
                                           write: false });
  const args6 = [path.join(ROOT, "tools", "review.mjs"), axleCli, cliProposal,
                 "--from", "the pile from the other team"];
  axleQueue.pending.forEach(c => args6.push("--accept", c.key));
  const r7 = spawnSync(process.execPath, args6, { cwd: ROOT, encoding: "utf8" });
  check((r7.status === 0 || r7.status === 1) && axleQueue.pending.length > 0,
    "6h node tools/review.mjs accepted the same " + axleQueue.pending.length
    + " row(s), exit " + r7.status + (r7.status > 1 ? ": " + r7.stderr : ""));

  const axleA = path.join(axleScreen, DRAFT_FILE), axleB = path.join(axleCli, DRAFT_FILE);
  check(sha(axleA) === sha(axleB) && sha(axleA) !== sha(landedAt),
    "6i THE CONTROL: the working copy is the same bytes after the import through the screen and"
    + " after the same import through tools/import.mjs and tools/review.mjs ("
    + sha(axleA).slice(0, 16) + "), and it is not simply the pile copied over the draft");
  const axleLanded = JSON.parse(fs.readFileSync(axleA, "utf8"));
  const axleHead = JSON.parse(fs.readFileSync(path.join(axleOut, "macros.draft.json"), "utf8"));
  check(axleLanded.id === "axle-catalog" && !("name" in axleLanded)
    && axleLanded.cards.length > axleQueue.pending.length,
    "6j and what came out is still THIS catalog - its own id and no name - with the other"
    + " pile's cards inside it: " + axleLanded.cards.length + " card(s) against the "
    + axleHead.cards.length + " the pile carried");

  /* ---- 7. A FILE NO ALIAS KNOWS, AT THE SCREEN (642; sense pass 2026-09-22, items 3 and 4) --
   *
   * importPlan used to THROW for a file it could make no plan from, and since 642 it answers
   * with the reading and the refusal instead. Until the sense pass the screen then showed the
   * no-plan screen: the importer's sentence, the reader's notes and Cancel alone, pointing at a
   * mapping table that was not on it. A file whose one refusal is that no column was read as
   * text is exactly the file that table exists for, so it is now painted, with the refusal as
   * its error in its own first box and the reader's notes in a second, as before; Cancel alone
   * in the foot until a choice in the table makes a plan. A refusal no mapping can answer still
   * ends at the no-plan screen, which is 7h.
   *
   * The file is one column of twelve unrelated lines, written here: no cycle for the periodic
   * reader to find and no header any field will claim, which is the case importPlan refuses at
   * src/import.mjs's primary-language rule. */
  const shapeless = path.join(SCRATCH, "piles", "shapeless.csv");
  fs.writeFileSync(shapeless, [
    "Notes I kept in one column", "Ring the depot before nine", "Ask for the blue form",
    "Nothing else was written down", "The second box is heavier", "Left the key with the porter",
    "No answer on the third try", "Send it back the same week", "Two spare labels in the drawer",
    "Check the meter on Friday", "Signed for by somebody else", "Put the rest in the cupboard",
  ].join("\n"), "utf8");
  let refused = null;
  try { await importCsv({ file: shapeless }); }
  catch (e) { refused = e; }

  w = await window(projects, shapeless);
  try {
    /* asNew FALSE: pressing for the answer before the cover is known would fail the step
       rather than the leg. The open project rides as the target regardless. */
    await intoWizard(w, home, false);
    const COVER = `JSON.stringify({
      ready: window.STUDIO_READY,
      dashed: Array.from(document.querySelectorAll("#main .dashed")).map(e => e.textContent),
      main: (document.querySelector("#main") || {}).textContent || "",
      foot: Array.from(document.querySelectorAll("#foot button")).map(e => e.textContent),
      held: Array.from(document.querySelectorAll("#foot button[disabled]")).map(e => e.textContent),
      why: (document.querySelector("#foot .why") || {}).textContent || "",
      /* Where the refusal sits against the table it names, and against the fold. */
      order: (() => { const d = document.querySelector("#main .dashed");
        const t = document.querySelector("#main table.map");
        const m = document.querySelector("#main").getBoundingClientRect();
        return d && t ? { above: d.getBoundingClientRect().bottom <= t.getBoundingClientRect().top,
          seen: d.getBoundingClientRect().bottom <= m.bottom } : null; })(),
      steps: Array.from(document.querySelectorAll("#chrome .step")).map(e => e.textContent),
      rail: Array.from(document.querySelectorAll("#rail > *")).map(e => e.textContent),
      options: Array.from(document.querySelectorAll("#main select[data-col] option"))
        .map(o => o.value + "=" + o.textContent),
    })`;
    const cover = JSON.parse(await w.page.evaluate(COVER));
    const foot7 = mappingFootHeld(cover.foot, cover.held);
    check(cover.ready.screen === "import1"
          && foot7.ok && cover.why.length > 0,
      "7a a file whose headings no alias knows reaches the MAPPING cover, with Next held in the"
      + " foot and the reason beside it while no plan can be made (polish 04, item 7)"
      + (foot7.missing.length ? ", missing " + foot7.missing.join(", ") : "")
      + ": screen "
      + cover.ready.screen + ", foot " + JSON.stringify(cover.foot) + ", held "
      + JSON.stringify(cover.held) + ", " + JSON.stringify(cover.why));
    check(!!cover.order && cover.order.above && cover.order.seen
          && /^[A-Z]/.test(cover.dashed[0] || ""),
      "7a2 and the refusal stands above the table it names, in sight without scrolling, and"
      + " opens with a capital: " + JSON.stringify(cover.order) + " "
      + JSON.stringify(String(cover.dashed[0] || "").slice(0, 40)));
    check(!!refused && cover.dashed[0] === refused.message,
      "7b and the sentence in the FIRST box is the importer's own, character for character"
      + " against the one importCsv throws for the same file here: "
      + JSON.stringify(cover.dashed[0] || ""));
    const readerSaid = examine({ file: shapeless }).notes.map(n => n.what);
    const boxes7 = refusalBoxesHeld(cover.dashed, refused.message, readerSaid.join(""));
    check(readerSaid.length > 0 && boxes7.ok,
      "7d and what the READER found is said beside it"
      + (boxes7.missing.length ? ", missing " + boxes7.missing.map(s => JSON.stringify(String(s).slice(0, 60))).join(", ") : "")
      + ": " + readerSaid.length
      + " note(s) of its own, against " + cover.dashed.length + " box(es) on the screen - "
      + JSON.stringify(String(cover.dashed[1] || "").slice(0, 60)));
    check(cover.rail.join(" ").indexOf(C(12, "cell")) >= 0
      && cover.rail.join(" ").indexOf("UTF-8") >= 0,
      "7e and the rail says what the READER found: " + JSON.stringify(cover.rail.join(" | ")));
    check(cover.main.indexOf("Becomes") >= 0 && cover.main.indexOf("First row reads") >= 0
      && cover.options.indexOf("body=Text") >= 0,
      "7c the mapping table is painted under the refusal, the table the sentence names, and its"
      + " one select offers Text: " + cover.options.length + " option(s)");
    check(cover.options.indexOf("body.pl=Text (Polish)") >= 0
      && cover.options.indexOf("title.pl=Title (Polish)") >= 0,
      "7f and every language the engine reads is a choice in it, Polish included, although the"
      + " file names none (item 3): " + JSON.stringify(cover.options.filter(o => /\.pl=/.test(o))));
    check(cover.options.indexOf("note=Note") < 0
      && cover.options.indexOf("note.en=Note (English)") >= 0,
      "7i beside Note (English) the mapping select offers no bare Note: "
      + JSON.stringify(cover.options.filter(o => /note/i.test(o))));

    /* The person says which column is the text, and the plan is made. */
    const col = await w.page.evaluate(() =>
      (document.querySelector("#main select[data-col]") || {}).getAttribute("data-col"));
    await w.page.evaluate(() => {
      const s = document.querySelector("#main select[data-col]");
      s.value = "body";
      s.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await settleOn(w.page, 'Array.from(document.querySelectorAll("#foot button:not([disabled])")).some(e => e.textContent.indexOf("Next: languages and duplicates") >= 0)', { bound: 30000 });
    const chosen = JSON.parse(await w.page.evaluate(COVER));
    check(chosen.foot.indexOf("Next: languages and duplicates") >= 0 && chosen.held.length === 0
      && chosen.dashed.join(" ").indexOf(refused.message) < 0,
      "7g choosing Text for the column " + JSON.stringify(col) + " makes the plan: the refusal"
      + " is gone and Next is in the foot and no longer held, " + JSON.stringify(chosen.foot));
  } finally { await w.shut(); }

  /* 7h THE CONTROL: a refusal no mapping answers - a heading and no rows - carries no table and
     ends where it always did, on the no-plan screen with Cancel alone. */
  const headOnly = path.join(SCRATCH, "piles", "head-only.csv");
  fs.writeFileSync(headOnly, "Title,Body\r\n", "utf8");
  w = await window(projects, headOnly);
  try {
    await intoWizard(w, home, false);
    const none = JSON.parse(await w.page.evaluate(`JSON.stringify({
      ready: window.STUDIO_READY,
      foot: Array.from(document.querySelectorAll("#foot button")).map(e => e.textContent),
      selects: document.querySelectorAll("#main select").length })`));
    const cancel7 = cancelFootHeld(none.foot);
    check(none.ready.screen === "import0" && cancel7.ok
      && none.selects === 0,
      "7h THE CONTROL: a file with a heading and no rows still ends at the no-plan screen"
      + (cancel7.missing.length ? ", missing " + cancel7.missing.join(", ") : "")
      + ", screen " + none.ready.screen + ", " + none.selects + " select(s)");
  } finally { await w.shut(); }

  /* ---- 8. THE COVER SHOWS THE FILE (642, variant B) ---------------------------------------
   *
   * Maxim ruled B on 2026-09-21 12:26, for a table and for a column alike: the top of the
   * person's own file is drawn beside the reading, so the reader's guess is checkable in one
   * glance rather than trusted. A cycle is the case it exists for - one column of thirty-six
   * cells becomes twelve cards, and nothing on this screen used to admit that had happened.
   *
   * THE ORACLE IS THE FILE'S OWN BYTES, split here, never the sample the module built or the
   * text the screen shows. A cover drawing the importer's mapped rows back at a person would
   * pass a leg that compared it with the sample and would be showing them the reader's opinion.
   */
  const cyclic = path.join(SCRATCH, "piles", "cyclic.csv");
  const CYC_NOTE = "Written by the depot office; do not reply to this line.";
  const cycLines = [];
  for (let i = 1; i <= 12; i++) {
    cycLines.push("gate-" + String(i).padStart(2, "0"));
    cycLines.push("The north gate is closed while the path is cleared, and walkers should use"
      + " the lane by the pond until the notice comes down. Reference " + i + ".");
    cycLines.push(CYC_NOTE);
  }
  fs.writeFileSync(cyclic, cycLines.join("\n") + "\n", "utf8");
  const cycRead = examine({ file: cyclic });

  w = await window(projects, cyclic);
  try {
    await intoWizard(w, home, false);
    const cov = JSON.parse(await w.page.evaluate(`JSON.stringify({
      screen: window.STUDIO_READY.screen,
      h1: (document.querySelector("#main h1") || {}).textContent || "",
      panes: Array.from(document.querySelectorAll("#main .pane > h3")).map(e => e.textContent),
      repeats: Array.from(document.querySelectorAll("#main .cyc-r")).map(r => ({
        n: (r.querySelector(".cyc-n") || {}).textContent,
        keys: Array.from(r.querySelectorAll(".cyc-k")).map(e => e.textContent),
        cells: Array.from(r.querySelectorAll(".cyc-v")).map(e => e.textContent),
        faded: r.querySelectorAll(".cyc-v > .fo-r").length,
      })),
      kv: Array.from(document.querySelectorAll("#main .kv")).map(e => ({
        k: (e.querySelector(".k") || {}).textContent,
        v: (e.querySelector(".v") || {}).textContent,
        n: (e.querySelector(".n") || {}).textContent || "",
      })),
      selects: document.querySelectorAll("#main select").length,
      hues: Array.from(document.querySelectorAll("#main .cyc-v"))
        .map(e => getComputedStyle(e).borderLeftColor),
    })`));

    check(cov.screen === "import1" && cov.h1 === "What is in this file"
      && cov.repeats.length === 3,
      "8a a column that comes round in a cycle opens the cover that SHOWS it: "
      + JSON.stringify(cov.h1) + " with " + cov.repeats.length + " repeat(s) drawn");
    /* The cells against the file, split here, and CUT here: a cell wider than the column is cut
       at 118 characters and its last three fade (no ellipsis since 2026-10-06), rather than
       clamped by CSS, because -webkit-line-clamp computes display to flow-root in this Chrome and
       lets the next line's ascenders bleed under the cut (Claudia, measured on a 2x crop, 2026-09-21). Writing the cut out a
       second time is what makes this leg hold both claims at once - the cells are the file's,
       and the cut is a character cut. The long position here is 146 characters, so it is cut
       and the two short ones are not. */
    const cut = (v) => v.length > 118 ? v.slice(0, 118) : v;
    const want = [0, 1, 2].map(k => cycLines.slice(k * 3, k * 3 + 3).map(cut));
    check(JSON.stringify(cov.repeats.map(r => r.cells)) === JSON.stringify(want)
      && cycLines[1].length > 118 && want[0][1].length === 118 && want[0][0] === cycLines[0]
      && cov.repeats[0].faded === 1,
      "8b and the cells are the FILE'S, cell for cell against the same bytes split and cut in"
      + " this file: " + JSON.stringify(String((cov.repeats[0] || { cells: [] }).cells[0] || ""))
      + " first, and the " + cycLines[1].length + "-character one cut to "
      + (want[0][1] || "").length);
    check(cov.repeats.every(r => r.keys.length === 3)
      && cov.repeats[0].keys.join("|") === cov.repeats[2].keys.join("|")
      && cov.repeats[0].keys.some(k => /Text|Title/.test(k)),
      "8c each cell stands under the name of the field its POSITION was given, the same three"
      + " on every repeat: " + JSON.stringify(cov.repeats[0].keys));
    /* THE CONTROL ON THE ONE DEVIATION FROM CLAUDIA'S FRAMES. Hers tint each position by its
       role; this canvas has no hue for anything but the band and the desk's cobalt, and a first
       hue is Maxim's eye. So the role is carried by its label, and the edges must all be the
       same colour - a leg that let three colours through would be letting a palette in through
       a build nobody drew. */
    check(cov.hues.length > 0 && new Set(cov.hues).size === 1,
      "8d THE CONTROL: the role is a label and not a colour, so all " + cov.hues.length
      + " cell edges are one value (" + Array.from(new Set(cov.hues)).join(", ") + ")");

    const by = {};
    cov.kv.forEach(x => { by[x.k] = x; });
    const per = cycRead.periodic;
    /* C() here is this file's own English plural rule, written at the top of it: a second
       implementation, so the sentence is checked against the numbers rather than against the
       frame that built it. */
    check(!!by["The pattern"] && by["The pattern"].v
      === C(per.period, "cell") + " over and over, " + C(per.cycles, "time") + ".",
      "8e the reading says the pattern in the reader's own numbers: "
      + JSON.stringify((by["The pattern"] || {}).v));
    check(!!by["Where it was read"]
      && /this (?:desk|computer)/.test(by["Where it was read"].v)
      && /Nothing was sent anywhere/.test(by["Where it was read"].n),
      "8f and the fork is STATED rather than asked where structure was found, which is the"
      + " ruling: " + JSON.stringify((by["Where it was read"] || {}).n));
    check(cov.selects > 0 && cov.panes.indexOf("Each position, and what it becomes") >= 0,
      "8g THE SECOND CONTROL: showing the file did not take the mapping away - "
      + cov.selects + " select(s) are still on the cover, under their own heading");
  } finally { await w.shut(); }

  /* ---- 8h. THE FILE PANE AFTER A CYCLE POSITION IS GIVEN A FIELD (board 783) ---------------
   *
   * An unclaimed cycle position starts as "Do not import". When the person gives that position
   * a field in the mapping table, the file pane must show the chosen field rather than
   * remaining "Do not import". */
  const cyc4 = path.join(SCRATCH, "piles", "cyclic4.csv");
  const cyc4Lines = [];
  for (let i = 1; i <= 12; i++) {
    cyc4Lines.push("gate-" + i);
    cyc4Lines.push("Short title " + i);
    cyc4Lines.push("This is a longer body text for card number " + i + " which has plenty of detail and words.");
    cyc4Lines.push("extra words " + i);
  }
  fs.writeFileSync(cyc4, cyc4Lines.join("\n") + "\n", "utf8");
  w = await window(projects, cyc4);
  try {
    await intoWizard(w, home, false);
    const keysBefore = await w.page.evaluate(() =>
      Array.from(document.querySelectorAll(".cyc-r:first-child .cyc-k")).map(e => e.textContent));
    check(keysBefore[3] === "Do not import",
      "8h unclaimed cycle position initially labels Do not import: " + JSON.stringify(keysBefore));
    await w.page.evaluate(() => {
      const sel = document.querySelector('select[data-col="cell 4 of the cycle"]');
      sel.value = "note.en";
      sel.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await settleOn(w.page, '((Array.from(document.querySelectorAll(".cyc-r:first-child .cyc-k"))[3] || {}).textContent || "") === "Note (English)"', { bound: 30000 });
    const keysAfter = await w.page.evaluate(() =>
      Array.from(document.querySelectorAll(".cyc-r:first-child .cyc-k")).map(e => e.textContent));
    check(keysAfter[3] === "Note (English)",
      "8h the file pane after a cycle position is given a field shows what was chosen: "
      + JSON.stringify(keysAfter));
  } finally { await w.shut(); }

  /* ---- 9. THE POLISH WIZARD SAYS ITS NOTES AND ITS FIELDS IN POLISH (sense pass item 21) ---
   *
   * Every note the importer made was an English string, so a Polish cover showed English under
   * a Polish heading, and three field words were format keys: "id", "keys", "note, Angielski".
   * No gate could see it, because tests/polish.mjs reads T() literals and refusal frames and a
   * note was neither. The file here makes two framed notes - a column no field claims and no
   * category column - and the window opens in Polish. The oracle for the Polish is the table in
   * ui/lang.js, read here as text for the two frames, so a screen that fell back to English
   * fails and one that invented a sentence fails too. */
  const plNotes = path.join(SCRATCH, "piles", "pl-notes.csv");
  fs.writeFileSync(plNotes, "Title,Body,Leftover\r\nOrder shipped,The parcel left today.,x\r\n"
    + "Refund started,The refund is on its way.,y\r\n", "utf8");
  const plStudio = await openStudio("tests/import-screen.mjs", { words: true,
    projects, userDataDir: path.join(SCRATCH, "ud-pl-notes"),
    env: { STUDIO_TEST_FILE: plNotes, STUDIO_LANG: "pl" },
  });
  w = { page: plStudio.page, shut: plStudio.shut,
        press: async (sel, ms) => {
          await pressWhen(plStudio.page, sel, { who: "tests/import-screen.mjs" });
          await sleep(ms || 400);
        } };
  try {
    await intoWizard(w, home, false);
    const pl = JSON.parse(await w.page.evaluate(`JSON.stringify({
      lang: window.STUDIO_T.lang(),
      dashed: Array.from(document.querySelectorAll("#main .dashed")).map(e => e.textContent),
      options: Array.from(new Set(Array.from(document.querySelectorAll("#main select[data-col] option"))
        .map(o => o.textContent))),
    })`));
    const said = pl.dashed.join(" ");
    const langText = fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8");
    const polishOf = (start) => {
      const at = langText.indexOf('"' + start);
      const tail = at < 0 ? "" : langText.slice(at, at + 600);
      const m = tail.match(/":\s*\n?\s*"((?:\\.|[^"\\])+)"/);
      return m ? m[1].replace(/\\"/g, '"') : "";
    };
    /* The longest run between the placeholders, because the Polish may open on one. */
    const unclaimed = polishOf("The column {NAME} stays out of the import").split("{NAME}")
      .sort((x, y) => y.length - x.length)[0];
    const noShelf = polishOf("no column names a category");
    check(pl.lang === "pl" && unclaimed.length > 10 && said.indexOf(unclaimed) >= 0
      && said.indexOf(noShelf) >= 0 && !/stays out of the import|no column names a category/.test(said),
      "9a on a Polish cover the importer's notes are Polish, as the table writes them: "
      + JSON.stringify(said.slice(0, 90)));
    const wantUnclaimedPl = 'Kolumna "Leftover" zostaje pominięta, bo Studio nie rozpoznało, do którego pola należy. Jeśli jest w niej treść katalogu, na ekranie "Co jest w tym pliku", w wierszu tej kolumny, można wybrać dla niej pole. Jeśli nie, nic nie trzeba robić.';
    check(said.indexOf(wantUnclaimedPl) >= 0,
      "9o on a Polish cover the unclaimed-column note is Claudette's exact Polish literal: "
      + JSON.stringify(said.slice(0, 90)));
    const keys = ["id", "keys", "note", "role", "requests", "shelf"];
    check(pl.options.every(o => keys.indexOf(o.split(",")[0]) < 0)
      && pl.options.indexOf("Identyfikator") >= 0 && pl.options.indexOf("Notatka (angielski)") >= 0,
      "9b and every field in the selects has a word, none a format key: "
      + JSON.stringify(pl.options.slice(0, 8)));
  } finally { await w.shut(); }

  /* ---- 9c. ON A POLISH COVER, TWO-CLAIM NOTE IS POLISH (board 780) -------------------------
   *
   * Body, body_en collision shows the two-claim note in Polish with both column names,
   * replacing the raw English '2 columns claim ...' and 'override table'. */
  const plTwoClaim = path.join(SCRATCH, "piles", "pl-twoclaim.csv");
  fs.writeFileSync(plTwoClaim, "Title,Body,body_en\r\n"
    + "Order shipped,The parcel left today.,The parcel left today.\r\n"
    + "Refund started,The refund is on its way.,The refund is on its way.\r\n", "utf8");
  const plTwoStudio = await openStudio("tests/import-screen.mjs", { words: true,
    projects, userDataDir: path.join(SCRATCH, "ud-pl-twoclaim"),
    env: { STUDIO_TEST_FILE: plTwoClaim, STUDIO_LANG: "pl" },
  });
  w = { page: plTwoStudio.page, shut: plTwoStudio.shut,
        press: async (sel, ms) => {
          await pressWhen(plTwoStudio.page, sel, { who: "tests/import-screen.mjs" });
          await sleep(ms || 400);
        } };
  try {
    await intoWizard(w, home, false);
    const pl = JSON.parse(await w.page.evaluate(`JSON.stringify({
      lang: window.STUDIO_T.lang(),
      dashed: Array.from(document.querySelectorAll("#main .dashed")).map(e => e.textContent),
      bold: Array.from(document.querySelectorAll("#main .dashed b")).map(e => e.textContent),
    })`));
    const said = pl.dashed.join(" ");
    const wantTwoClaim = 'Kolumny "Body" i "body_en" trafiły do tego samego pola, "Treść (angielski)", a jedno pole mieści tylko jedną kolumnę; na razie wczytywana jest kolumna "Body". Na ekranie "Co jest w tym pliku", w wierszu każdej z nich, można wybrać osobne pole albo "Nie importuj".';
    check(pl.lang === "pl" && said.indexOf(wantTwoClaim) >= 0 && !/override table|columns claim/.test(said),
      "9c on a Polish cover Body, body_en shows the two-claim note in Polish with both column names: "
      + JSON.stringify(said.slice(0, 95)));
  } finally { await w.shut(); }

  /* ---- 9d. ON A POLISH COVER, CYCLING FILE NOTE IS POLISH (board 783, part 2) --------------
   *
   * A cycling file on a Polish cover renders Claudette's real Polish sentence chosen by the
   * detector's score, with no [PL] marker and no leaked English. */
  const plCycStudio = await openStudio("tests/import-screen.mjs", { words: true,
    projects, userDataDir: path.join(SCRATCH, "ud-pl-cyc"),
    env: { STUDIO_TEST_FILE: cyclic, STUDIO_LANG: "pl" },
  });
  w = { page: plCycStudio.page, shut: plCycStudio.shut,
        press: async (sel, ms) => {
          await pressWhen(plCycStudio.page, sel, { who: "tests/import-screen.mjs" });
          await sleep(ms || 400);
        } };
  try {
    await intoWizard(w, home, false);
    const cycNote = (await w.page.evaluate(() => {
      const el = document.querySelector("#main .dashed");
      if (!el) return "";
      const lines = el.innerText.split(/\r?\n+/).map(s => s.trim()).filter(Boolean);
      return lines.find(s => s.indexOf("W jedynej kolumnie pliku") >= 0 || s.indexOf("one column repeats") >= 0) || "";
    })).replace(/\u00a0/g, " ");
    const wantCycPl = "W jedynej kolumnie pliku powtarza się ten sam wzór, więc każde powtórzenie stało się osobnym wierszem tabeli. W sumie: 12 wierszy. Wzór jest bardzo wyraźny.";
    check(cycNote === wantCycPl && cycNote.indexOf("[PL]") < 0,
      "9d on a Polish cover the cycling file note is the real Polish sentence: "
      + JSON.stringify(cycNote.slice(0, 95)));
  } finally { await w.shut(); }

  /* ---- 9e. EACH SCORE BAND'S SENTENCE APPEARS FOR A SCORE IN ITS BAND (board 783, part 2) -
   *
   * High (>= 0.90), mid (0.75..0.90), and low (< 0.75) cycle clarity scores select Claudette's
   * corresponding sentence, in English and in Polish. */
  const highLines = [];
  for (let i = 0; i < 15; i++) highLines.push("title " + i, "body text here and there", "constant note");
  const rHigh = examine({ text: highLines.join("\n") + "\n" });
  const highNote = (rHigh.notes || []).find(n => n.said && /repeats the same pattern/.test(n.said.frame));

  const midLines = [];
  for (let i = 0; i < 20; i++) midLines.push("t " + "x".repeat(5 + (i % 3) * 8), "body text " + "y".repeat(50 + (i % 4)), "constant note");
  const rMid = examine({ text: midLines.join("\n") + "\n" });
  const midNote = (rMid.notes || []).find(n => n.said && /repeats the same pattern/.test(n.said.frame));

  const lowLines = [];
  for (let i = 0; i < 20; i++) lowLines.push("title " + "x".repeat(i), "body " + "y".repeat(40 - i), "note " + "z".repeat((i % 5) * 2 + 10));
  const rLow = examine({ text: lowLines.join("\n") + "\n" });
  const lowNote = (rLow.notes || []).find(n => n.said && /repeats the same pattern/.test(n.said.frame));

  const langText = fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8");
  const polishTwinOf = (en) => {
    const at = langText.indexOf(JSON.stringify(en));
    if (at < 0) return "";
    const tail = langText.slice(at + JSON.stringify(en).length, at + JSON.stringify(en).length + 600);
    const m = tail.match(/:\s*\n?\s*"([^"]+)"/);
    return m ? m[1] : "";
  };

  const highOk = rHigh.periodic && rHigh.periodic.score >= 0.90 && highNote
    && /The pattern is very clear\.$/.test(highNote.what)
    && polishTwinOf(highNote.said.frame) === "W jedynej kolumnie pliku powtarza się ten sam wzór, więc każde powtórzenie stało się osobnym wierszem tabeli. W sumie: {ROWS}. Wzór jest bardzo wyraźny.";
  const midOk = rMid.periodic && rMid.periodic.score >= 0.75 && rMid.periodic.score < 0.90 && midNote
    && /The pattern is clear, if looser in places, so it is worth a glance to see that each row holds what belongs together\.$/.test(midNote.what)
    && polishTwinOf(midNote.said.frame) === "W jedynej kolumnie pliku powtarza się ten sam wzór, więc każde powtórzenie stało się osobnym wierszem tabeli. W sumie: {ROWS}. Wzór jest wyraźny, choć miejscami luźniejszy, więc warto rzucić okiem, czy w każdym wierszu jest to, co do siebie należy.";
  const lowOk = rLow.periodic && rLow.periodic.score >= 0.55 && rLow.periodic.score < 0.75 && lowNote
    && /The pattern is a subtle one, so it is worth checking carefully that each row holds what belongs together\. A sheet with a heading over each column is read as it stands\.$/.test(lowNote.what)
    && polishTwinOf(lowNote.said.frame) === "W jedynej kolumnie pliku powtarza się ten sam wzór, więc każde powtórzenie stało się osobnym wierszem tabeli. W sumie: {ROWS}. Wzór jest dość subtelny, więc warto uważnie sprawdzić, czy w każdym wierszu jest to, co do siebie należy. Arkusz, w którym każda kolumna ma nagłówek, Studio odczyta wprost.";

  check(Boolean(highOk && midOk && lowOk),
    "9e each band's sentence appears for a score in its band: high "
    + (rHigh.periodic ? rHigh.periodic.score : "none") + ", mid "
    + (rMid.periodic ? rMid.periodic.score : "none") + ", low "
    + (rLow.periodic ? rLow.periodic.score : "none"));

  /* ---- 9f. ON THE SECOND COVER, GUESSED AND TWO-CLAIM NOTES NAME NO PLACE (board 784/785) ---
   *
   * On cover 2 ("Jak wygląda plik"), which has no mapping table, the guessed and two-claim notes
   * appear in the dashed errors box and refer to the screen by its heading ("Co jest w tym pliku")
   * without saying "above" or "powyżej". The screen is asserted as well as the words: the same
   * notes paint on cover 1, so without it the leg passed with the Next press deleted. */
  const plBothClaim = path.join(SCRATCH, "piles", "pl-both-claim.csv");
  fs.writeFileSync(plBothClaim, "Tytuł,Text,Body,body_en\r\n"
    + "Order shipped,Das ist ein deutsches Haus ohne Zweifel hier,The parcel left today.,The parcel left today.\r\n"
    + "Refund started,Das zweite Haus ist auch ganz bestimmt deutsch,The refund is on its way.,The refund is on its way.\r\n", "utf8");
  const plBothStudio = await openStudio("tests/import-screen.mjs", { words: true,
    projects, userDataDir: path.join(SCRATCH, "ud-pl-both-claim"),
    env: { STUDIO_TEST_FILE: plBothClaim, STUDIO_LANG: "pl" },
  });
  w = { page: plBothStudio.page, shut: plBothStudio.shut,
        press: async (sel, ms) => {
          await pressWhen(plBothStudio.page, sel, { who: "tests/import-screen.mjs" });
          await sleep(ms || 400);
        } };
  try {
    await intoWizard(w, home, false);
    await w.press('[data-act="wiz-next"]', 1000);
    await settleOn(w.page, 'document.querySelectorAll("#main .dashed").length > 0', { bound: 30000 });
    const pl2 = JSON.parse(await w.page.evaluate(`JSON.stringify({
      screen: window.STUDIO_READY.screen,
      dashed: Array.from(document.querySelectorAll("#main .dashed")).map(e => e.textContent),
    })`));
    const said2 = pl2.dashed.join(" ");
    const wantTwoClaim2 = 'Kolumny "Text" i "Body" trafiły do tego samego pola, "Treść (polski)", a jedno pole mieści tylko jedną kolumnę; na razie wczytywana jest kolumna "Text". Na ekranie "Co jest w tym pliku", w wierszu każdej z nich, można wybrać osobne pole albo "Nie importuj".';
    const wantGuessed2 = 'Kolumna "Text" trafiła do pola "Treść (polski)" na podstawie sąsiednich nagłówków, choć po samym tekście nie da się tego potwierdzić. Jeśli język się zgadza, nic nie trzeba robić. Jeśli nie, na ekranie "Co jest w tym pliku", w wierszu tej kolumny, można wybrać właściwy język albo "Nie importuj".';
    check(pl2.screen === "import2" && said2.indexOf(wantTwoClaim2) >= 0 && said2.indexOf(wantGuessed2) >= 0
          && said2.indexOf("powyżej") < 0 && said2.indexOf("above") < 0,
      "9f on the second cover guessed and two-claim notes appear and contain neither above nor powyżej: "
      + JSON.stringify(said2.slice(0, 95)));
  } finally { await w.shut(); }

  /* ---- 9g. ON A POLISH COVER, COMMAS NOTE IS POLISH (board 785) ----------------------------
   *
   * A CSV with commas whose rows disagree on width triggers the commas note in Polish with
   * no leaked English. */
  const plCommas = path.join(SCRATCH, "piles", "pl-commas.csv");
  fs.writeFileSync(plCommas, "a,b\r\nc,d,e\r\nf\r\n", "utf8");
  const plCommasStudio = await openStudio("tests/import-screen.mjs", { words: true,
    projects, userDataDir: path.join(SCRATCH, "ud-pl-commas"),
    env: { STUDIO_TEST_FILE: plCommas, STUDIO_LANG: "pl" },
  });
  w = { page: plCommasStudio.page, shut: plCommasStudio.shut,
        press: async (sel, ms) => {
          await pressWhen(plCommasStudio.page, sel, { who: "tests/import-screen.mjs" });
          await sleep(ms || 400);
        } };
  try {
    await intoWizard(w, home, false);
    const text = (await w.page.evaluate(() => Array.from(document.querySelectorAll("#main .dashed")).map(e => e.textContent).join(" "))).replace(/\u00a0/g, " ");
    const wantCommas = "W pliku są przecinki, ale nie w każdej linijce jest ich tyle samo, więc Studio odczytało go jako jedną kolumnę, a nie jako tabelę. Nic, co stało po przecinku, nie przepadło.";
    check(text.indexOf(wantCommas) >= 0 && !/file has commas/i.test(text),
      "9g on a Polish cover the commas note is Polish with no leaked English: " + JSON.stringify(text.slice(0, 95)));
  } finally { await w.shut(); }

  /* ---- 9h. ON A POLISH COVER, NOHEADER NOTE IS POLISH (board 785) --------------------------
   *
   * A table whose first row omits the name of a content-bearing column triggers noheader in Polish. */
  const plNoHeader = path.join(SCRATCH, "piles", "pl-noheader.csv");
  fs.writeFileSync(plNoHeader, "Title,\r\nT1,B1\r\nT2,B2\r\n", "utf8");
  const plNoHeaderStudio = await openStudio("tests/import-screen.mjs", { words: true,
    projects, userDataDir: path.join(SCRATCH, "ud-pl-noheader"),
    env: { STUDIO_TEST_FILE: plNoHeader, STUDIO_LANG: "pl" },
  });
  w = { page: plNoHeaderStudio.page, shut: plNoHeaderStudio.shut,
        press: async (sel, ms) => {
          await pressWhen(plNoHeaderStudio.page, sel, { who: "tests/import-screen.mjs" });
          await sleep(ms || 400);
        } };
  try {
    await intoWizard(w, home, false);
    const text = (await w.page.evaluate(() => Array.from(document.querySelectorAll("#main .dashed")).map(e => e.textContent).join(" "))).replace(/\u00a0/g, " ");
    const wantNoHeader = "Wiersze pliku mają po tyle samo pól, ale w pierwszym z nich brakuje nazwy nad kolumną, w której jest treść, więc Studio odczytało plik jako jedną kolumnę, a nie jako tabelę. Nic z pliku nie przepadło. Gdy każda kolumna z treścią będzie miała nazwę w pierwszym wierszu, Studio odczyta plik jako tabelę.";
    check(text.indexOf(wantNoHeader) >= 0 && !/first row is not a header/i.test(text),
      "9h on a Polish cover the no-header note is Polish with no leaked English: " + JSON.stringify(text.slice(0, 95)));
  } finally { await w.shut(); }

  /* ---- 9i. ON A POLISH COVER, TABLE.EXTRA NOTE IS POLISH (board 785) -----------------------
   *
   * A table where a row has more fields than the heading row triggers table.extra in Polish. */
  const plTableExtra = path.join(SCRATCH, "piles", "pl-table-extra.csv");
  fs.writeFileSync(plTableExtra, "Title,Body\r\nT1,B1\r\nT2,B2,Extra1\r\n", "utf8");
  const plTableExtraStudio = await openStudio("tests/import-screen.mjs", { words: true,
    projects, userDataDir: path.join(SCRATCH, "ud-pl-table-extra"),
    env: { STUDIO_TEST_FILE: plTableExtra, STUDIO_LANG: "pl" },
  });
  w = { page: plTableExtraStudio.page, shut: plTableExtraStudio.shut,
        press: async (sel, ms) => {
          await pressWhen(plTableExtraStudio.page, sel, { who: "tests/import-screen.mjs" });
          await sleep(ms || 400);
        } };
  try {
    await intoWizard(w, home, false);
    const text = (await w.page.evaluate(() => Array.from(document.querySelectorAll("#main .dashed")).map(e => e.textContent).join(" "))).replace(/\u00a0/g, " ");
    const wantTableExtra = "Część wierszy ma więcej pól niż wiersz nagłówków, a pól bez nagłówka nie zaimportowano. Dotyczy to: 1 wiersz. Pominięto: 1 pole.";
    check(text.indexOf(wantTableExtra) >= 0 && !/more fields than/i.test(text),
      "9i on a Polish cover the extra-fields note is Polish with no leaked English: " + JSON.stringify(text.slice(0, 95)));
  } finally { await w.shut(); }

  /* ---- 9j. ON A POLISH COVER, A LEADING BLANK LINE IS PRESERVED AS A TABLE (board 787) ----
   *
   * A CSV whose first line is blank keeps its header row and does not lose fields to an
   * unnamed header note. */
  const plTableUnnamed = path.join(SCRATCH, "piles", "pl-table-unnamed.csv");
  fs.writeFileSync(plTableUnnamed, " \r\nTitle,Body\r\nT1,B1\r\nT2,B2\r\n", "utf8");
  const plTableUnnamedStudio = await openStudio("tests/import-screen.mjs", { words: true,
    projects, userDataDir: path.join(SCRATCH, "ud-pl-table-unnamed"),
    env: { STUDIO_TEST_FILE: plTableUnnamed, STUDIO_LANG: "pl" },
  });
  w = { page: plTableUnnamedStudio.page, shut: plTableUnnamedStudio.shut,
        press: async (sel, ms) => {
          await pressWhen(plTableUnnamedStudio.page, sel, { who: "tests/import-screen.mjs" });
          await sleep(ms || 400);
        } };
  try {
    await intoWizard(w, home, false);
    const text = (await w.page.evaluate(() => Array.from(document.querySelectorAll("#main .dashed")).map(e => e.textContent).join(" "))).replace(/\u00a0/g, " ");
    const wantTableUnnamed = "Nad częścią pól w wierszu nagłówków nie ma nazwy";
    check(text.indexOf(wantTableUnnamed) < 0 && !/sit under a head/i.test(text),
      "9j on a Polish cover a leading blank line does not trigger unnamed header note: " + JSON.stringify(text.slice(0, 95)));
  } finally { await w.shut(); }

  /* ---- 9k. ON A POLISH COVER, SAMENAME NOTE IS POLISH, TABLE.TWICE WITHDRAWN (board 786) --
   *
   * A table with duplicate header names triggers samename in Polish, with table.twice withdrawn. */
  const plTableTwice = path.join(SCRATCH, "piles", "pl-table-twice.csv");
  fs.writeFileSync(plTableTwice, "Title,Body,Title\r\nT1,B1,T2\r\nT3,B2,T4\r\n", "utf8");
  const plTableTwiceStudio = await openStudio("tests/import-screen.mjs", { words: true,
    projects, userDataDir: path.join(SCRATCH, "ud-pl-table-twice"),
    env: { STUDIO_TEST_FILE: plTableTwice, STUDIO_LANG: "pl" },
  });
  w = { page: plTableTwiceStudio.page, shut: plTableTwiceStudio.shut,
        press: async (sel, ms) => {
          await pressWhen(plTableTwiceStudio.page, sel, { who: "tests/import-screen.mjs" });
          await sleep(ms || 400);
        } };
  try {
    await intoWizard(w, home, false);
    const text = (await w.page.evaluate(() => Array.from(document.querySelectorAll("#main .dashed")).map(e => e.textContent).join(" "))).replace(/\u00a0/g, " ");
    const wantSameName = 'Więcej niż jedna kolumna ma nagłówek "Title", a wczytano tylko ostatnią z nich. Gdy każda dostanie w pliku własną nazwę, ponowny import wczyta je wszystkie.';
    check(text.indexOf(wantSameName) >= 0 && text.indexOf("powtarzają się") < 0 && !/more than one column is headed/i.test(text),
      "9k on a Polish cover samename note is Polish and table.twice is not shown: " + JSON.stringify(text.slice(0, 95)));
  } finally { await w.shut(); }

  /* ---- 9n. ON A REFUSED POLISH COVER, SAMENAME NOTE IS POLISH, TABLE.TWICE WITHDRAWN (board 786 / 791) --
   *
   * A table with duplicate headers that is refused (no body column) shows samename in Polish
   * with table.twice withdrawn on its refused cover. */
  const plRefusedTwice = path.join(SCRATCH, "piles", "pl-refused-twice.csv");
  fs.writeFileSync(plRefusedTwice, "Title,Keywords,Title\r\nT1,K1,T2\r\nT3,K2,T4\r\n", "utf8");
  const plRefusedTwiceStudio = await openStudio("tests/import-screen.mjs", { words: true,
    projects, userDataDir: path.join(SCRATCH, "ud-pl-refused-twice"),
    env: { STUDIO_TEST_FILE: plRefusedTwice, STUDIO_LANG: "pl" },
  });
  w = { page: plRefusedTwiceStudio.page, shut: plRefusedTwiceStudio.shut,
        press: async (sel, ms) => {
          await pressWhen(plRefusedTwiceStudio.page, sel, { who: "tests/import-screen.mjs" });
          await sleep(ms || 400);
        } };
  try {
    await intoWizard(w, home, false);
    const text = (await w.page.evaluate(() => Array.from(document.querySelectorAll("#main .dashed")).map(e => e.textContent).join(" "))).replace(/\u00a0/g, " ");
    const wantSameName = 'Więcej niż jedna kolumna ma nagłówek "Title", a wczytano tylko ostatnią z nich. Gdy każda dostanie w pliku własną nazwę, ponowny import wczyta je wszystkie.';
    check(text.indexOf(wantSameName) >= 0 && text.indexOf("powtarzają się") < 0 && !/more than one column is headed/i.test(text),
      "9n on a refused Polish cover samename note is Polish and table.twice is not shown: [" +
      (text.indexOf(wantSameName) >= 0 ? "samename present" : "samename missing") + ", " +
      (text.indexOf("powtarzają się") >= 0 ? "table.twice present" : "table.twice clean") + ", " +
      (/more than one column is headed/i.test(text) ? "English present" : "no English") + "]");
  } finally { await w.shut(); }

  /* ---- 9l. ON A POLISH COVER, CYCLE.SHORT NOTE IS POLISH (board 785) -----------------------
   *
   * A ragged periodic cycle triggers cycle.short in Polish. */
  const plCycShort = path.join(SCRATCH, "piles", "pl-cyc-short.csv");
  const cycShortLines = [];
  for (let i = 0; i < 12; i++) {
    cycShortLines.push("Title " + i);
    cycShortLines.push("Long body text with plenty of words " + i);
    if (i < 11) cycShortLines.push("constant note");
  }
  fs.writeFileSync(plCycShort, cycShortLines.join("\n") + "\n", "utf8");
  const plCycShortStudio = await openStudio("tests/import-screen.mjs", { words: true,
    projects, userDataDir: path.join(SCRATCH, "ud-pl-cyc-short"),
    env: { STUDIO_TEST_FILE: plCycShort, STUDIO_LANG: "pl" },
  });
  w = { page: plCycShortStudio.page, shut: plCycShortStudio.shut,
        press: async (sel, ms) => {
          await pressWhen(plCycShortStudio.page, sel, { who: "tests/import-screen.mjs" });
          await sleep(ms || 400);
        } };
  try {
    await intoWizard(w, home, false);
    const text = (await w.page.evaluate(() => Array.from(document.querySelectorAll("#main .dashed")).map(e => e.textContent).join(" "))).replace(/\u00a0/g, " ");
    const wantCycShort = "Ostatnie powtórzenie jest krótsze od pozostałych, jak w eksporcie, który kończy się razem z treścią, więc w ostatnim wierszu brakujące pola zostały puste.";
    check(text.indexOf(wantCycShort) >= 0 && !/last cycle is short/i.test(text),
      "9l on a Polish cover the short-cycle note is Polish with no leaked English: " + JSON.stringify(text.slice(0, 95)));
  } finally { await w.shut(); }

  /* ---- 9m. ON A POLISH COVER, CYCLE.LEAD NOTE IS POLISH (board 785) ------------------------
   *
   * A periodic cycle with skipped leading rows triggers cycle.lead in Polish. */
  const plCycLead = path.join(SCRATCH, "piles", "pl-cyc-lead.csv");
  const cycLeadLines = ["A heading of five words"];
  for (let i = 0; i < 12; i++) {
    cycLeadLines.push("slug-" + i);
    cycLeadLines.push("This is a longer body text sentence for cycle number " + i + " with various words");
    cycLeadLines.push("constant note");
  }
  fs.writeFileSync(plCycLead, cycLeadLines.join("\n") + "\n", "utf8");
  const plCycLeadStudio = await openStudio("tests/import-screen.mjs", { words: true,
    projects, userDataDir: path.join(SCRATCH, "ud-pl-cyc-lead"),
    env: { STUDIO_TEST_FILE: plCycLead, STUDIO_LANG: "pl" },
  });
  w = { page: plCycLeadStudio.page, shut: plCycLeadStudio.shut,
        press: async (sel, ms) => {
          await pressWhen(plCycLeadStudio.page, sel, { who: "tests/import-screen.mjs" });
          await sleep(ms || 400);
        } };
  try {
    await intoWizard(w, home, false);
    const text = (await w.page.evaluate(() => Array.from(document.querySelectorAll("#main .dashed")).map(e => e.textContent).join(" "))).replace(/\u00a0/g, " ");
    const wantCycLead = "Na początku kolumny jest coś, co nie należy do żadnego powtórzenia, na przykład nagłówek albo tytuł, więc nie trafiło do tabeli. Pominięto: 1 komórka.";
    check(text.indexOf(wantCycLead) >= 0 && !/belong to no cycle/i.test(text) && !/opens with something that belongs to no repeat/i.test(text),
      "9m on a Polish cover the leading-cycle-row note is Polish with no leaked English: " + JSON.stringify(text.slice(0, 95)));
  } finally { await w.shut(); }

  /* ---- 9p. ON A POLISH COVER, A ZERO-BYTE SIBLING REFUSES NAMING THE FILE (board 791, item 2) --
   *
   * A zero-byte categories.csv beside the imported file refuses the import in Claudette's words,
   * naming the sibling file and not blaming the main file. */
  const sibZeroDir = path.join(SCRATCH, "piles", "pl-sib-zero");
  fs.mkdirSync(sibZeroDir, { recursive: true });
  const plSibZero = path.join(sibZeroDir, "macros.csv");
  fs.writeFileSync(plSibZero, ["Title,Body,Category", "T1,B1,c1", "T2,B2,c2"].join("\n") + "\n", "utf8");
  fs.writeFileSync(path.join(sibZeroDir, "categories.csv"), "", "utf8");
  const plSibZeroStudio = await openStudio("tests/import-screen.mjs", { words: true,
    projects, userDataDir: path.join(SCRATCH, "ud-pl-sib-zero"),
    env: { STUDIO_TEST_FILE: plSibZero, STUDIO_LANG: "pl" },
  });
  w = { page: plSibZeroStudio.page, shut: plSibZeroStudio.shut,
        press: async (sel, ms) => {
          await pressWhen(plSibZeroStudio.page, sel, { who: "tests/import-screen.mjs" });
          await sleep(ms || 400);
        } };
  try {
    await intoWizard(w, home, false);
    const text = (await w.page.evaluate(() => Array.from(document.querySelectorAll("#main .dashed")).map(e => e.textContent).join(" "))).replace(/\u00a0/g, " ");
    const wantSibZero = "obok importowanego pliku leży pusty plik categories.csv. Wystarczy go uzupełnić albo przenieść do innego folderu i zaimportować jeszcze raz; bez niego Studio przeczyta sam importowany plik.";
    check(text.indexOf(wantSibZero) >= 0 && text.indexOf("nie ma żadnych wierszy") < 0 && text.indexOf("no rows at all") < 0,
      "9p on a Polish cover zero-byte categories.csv refuses naming the file and does not blame the main file: " + JSON.stringify(text.slice(0, 95)));
  } finally { await w.shut(); }

  /* ---- 9q. ON A POLISH COVER, A BLANK-LINES SIBLING REFUSES NAMING THE FILE (board 791, item 2) -
   *
   * A companion intents.csv of nothing but blank lines refuses the import in Claudette's words,
   * naming the sibling file rather than passing silently. */
  const sibBlankDir = path.join(SCRATCH, "piles", "pl-sib-blank");
  fs.mkdirSync(sibBlankDir, { recursive: true });
  const plSibBlank = path.join(sibBlankDir, "macros.csv");
  fs.writeFileSync(plSibBlank, ["Title,Body,Category", "T1,B1,c1", "T2,B2,c2"].join("\n") + "\n", "utf8");
  fs.writeFileSync(path.join(sibBlankDir, "intents.csv"), "\r\n   \r\n\t\r\n", "utf8");
  const plSibBlankStudio = await openStudio("tests/import-screen.mjs", { words: true,
    projects, userDataDir: path.join(SCRATCH, "ud-pl-sib-blank"),
    env: { STUDIO_TEST_FILE: plSibBlank, STUDIO_LANG: "pl" },
  });
  w = { page: plSibBlankStudio.page, shut: plSibBlankStudio.shut,
        press: async (sel, ms) => {
          await pressWhen(plSibBlankStudio.page, sel, { who: "tests/import-screen.mjs" });
          await sleep(ms || 400);
        } };
  try {
    await intoWizard(w, home, false);
    const text = (await w.page.evaluate(() => Array.from(document.querySelectorAll("#main .dashed")).map(e => e.textContent).join(" "))).replace(/\u00a0/g, " ");
    const wantSibBlank = "obok importowanego pliku leży pusty plik intents.csv. Wystarczy go uzupełnić albo przenieść do innego folderu i zaimportować jeszcze raz; bez niego Studio przeczyta sam importowany plik.";
    check(text.indexOf(wantSibBlank) >= 0 && text.indexOf("nie ma żadnych wierszy") < 0 && text.indexOf("no rows at all") < 0,
      "9q on a Polish cover blank-lines intents.csv refuses naming the file and does not pass silently: " + JSON.stringify(text.slice(0, 95)));
  } finally { await w.shut(); }

  /* ---- 9r, 9s, 9t. ON A POLISH COVER, DUPLICATE NOTES IN CLAUDETTE'S WORDS (board 801 c) --
   *
   * Exact duplicate rows on shelf+title and on body each render Claudette's distinct Polish
   * sentence, stating that both are kept as cards of their own, without claiming the engine
   * refuses colliding cards and without showing raw format keys or 'collide' anywhere on screen. */
  const plDupDir = path.join(SCRATCH, "piles", "pl-dups");
  fs.mkdirSync(plDupDir, { recursive: true });
  const plDupFile = path.join(plDupDir, "macros.csv");
  fs.writeFileSync(plDupFile, [
    "id,shelf,title,body",
    "card-01,refunds,Order status,Where is my parcel?",
    "card-02,refunds,order status.,Something different about order.",
    "card-03,billing,Payment issue,Please wait three to five business days for bank processing.",
    'card-04,shipping,Delivery delay,"Please wait three to five business days, for bank processing!"',
  ].join("\r\n") + "\r\n", "utf8");
  const plDupStudio = await openStudio("tests/import-screen.mjs", { words: true,
    projects, userDataDir: path.join(SCRATCH, "ud-pl-dups"),
    env: { STUDIO_TEST_FILE: plDupFile, STUDIO_LANG: "pl" },
  });
  /* THE PRESS WAITS FOR WHAT IT PRESSES and each read for the cover it reads (board 801): this
     block was the last to press a fixed time after the step that paints, and with a project's
     open answering 2500 ms late it died "nothing at" with exit 2 and no verdict. The covers are
     waited for by the screen the page says it is on; a cover that never comes is read anyway and
     9r to 9t fail on it. */
  w = { page: plDupStudio.page, shut: plDupStudio.shut,
        press: async (sel, ms) => {
          await pressWhen(plDupStudio.page, sel, { who: "tests/import-screen.mjs 9r" });
          await sleep(ms || 400);
        } };
  try {
    await intoWizard(w, home, false);
    await settleOn(w.page, `(window.STUDIO_READY || {}).screen === "import1"`);
    const text1 = (await w.page.evaluate(() => Array.from(document.querySelectorAll("#main .dashed")).map(e => e.textContent).join(" "))).replace(/\u00a0/g, " ");
    await w.press('[data-act="wiz-next"]', 1);
    await settleOn(w.page, `(window.STUDIO_READY || {}).screen === "import2"`);
    const text2 = (await w.page.evaluate(() => document.querySelector("#main").textContent)).replace(/\u00a0/g, " ");
    const fullText = text1 + " " + text2;
    /* A LEG QUOTES THE NOTE IT LOOKED FOR, not the head of the screen: both lines used to print
       the first 95 characters, which is the title note, so 9s quoted a sentence that was not the
       one it asserts. Each now quotes its own note, as long as the note it wants, from where the
       note names its card; when no note does, from the first place either cover names the card;
       and when neither cover names it, it says so. */
    const noteOn = (lead, id, want) => {
      let at = fullText.indexOf(lead);
      if (at < 0) at = fullText.indexOf(id);
      return at < 0 ? "(nothing on either cover names " + id + ")"
        : JSON.stringify(fullText.slice(at, at + want.length));
    };

    const wantTitlePl = "karty card-02 i card-01 mają w jednej kategorii ten sam tytuł, jeśli nie liczyć wielkości liter, znaków diakrytycznych i interpunkcji; import zachowuje obie jako osobne karty, a na stanowisku będą łudząco podobne, dopóki jedna nie dostanie innego tytułu albo obie nie staną się jedną kartą";
    check(fullText.indexOf(wantTitlePl) >= 0,
      "9r on a Polish cover same-title rows show Claudette's words for title in one category: "
      + noteOn("karty card-02", "card-02", wantTitlePl));

    const wantBodyPl = "karta card-04 ma ten sam tekst co card-03, jeśli nie liczyć wielkości liter, znaków diakrytycznych i interpunkcji; import zachowuje obie jako osobne karty. Jeśli to jedna odpowiedź, wystarczy jedna karta, a jeśli dwie, każda może mieć własne słowa";
    check(fullText.indexOf(wantBodyPl) >= 0,
      "9s on a Polish cover same-text rows show Claudette's words for same body text: "
      + noteOn("karta card-04", "card-04", wantBodyPl));

    check(!/collide|koliduj/i.test(fullText) && fullText.indexOf("nie przyjmuje katalogu") < 0,
      "9t on a Polish cover no screen shows collide for these rows: "
      + (/collide|koliduj/i.test(fullText) ? "found collision wording" : "clean"));
  } finally { await w.shut(); }

  if (!keep) dropScratch(SCRATCH, "import-screen");
  process.stdout.write("import-screen  " + asserted + " assertion(s), " + failed
    + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("import-screen  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
