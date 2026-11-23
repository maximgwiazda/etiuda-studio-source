/* ACCEPTING FROM THE SCREEN IS ACCEPTING FROM THE COMMAND LINE. Course node 9's screen.
 *
 *     node tests/review-screen.mjs [--keep]
 *
 * THE CLAIM IS THE WORKING COPY, BYTE FOR BYTE. Two identical projects each hold the same
 * proposal in their inbox; one is decided by answering its rows in the stack in a real window
 * (board 1016 item 7: the stack is the one way to decide, and the proposal's table a view with
 * one line that opens it) and the other by
 * `node tools/review.mjs --accept --reject` with the same keys, and the draft that comes out
 * has to be the same sha256 on both sides. The review log is compared too, with the clock
 * normalised: the log records WHEN a decision was taken and the two doors are minutes apart,
 * so every `at` is replaced by a fixed string before the two are held against each other and
 * nothing else in either file is touched.
 *
 * THE REFUSAL WAS THE OTHER HALF, and it went with the table's Land (board 1016 item 7): the
 * stack attributes a file's rows to its desk or its import unless a name is typed under Apply
 * (stkFrom), so the screen can no longer ask for a decision with nobody's name on it. The
 * module's refusal is tests/review.mjs's (the nameless command line).
 *
 * THE PROPOSAL IS MADE HERE, doing to the draft what an engine export does to a catalog it was
 * handed: the origin's id and rev kept, `modified: true` set, the content hash recomputed last
 * over the finished payload (engine spec 5). Nothing in this file asks the review queue whether
 * it agrees with itself: the keys are taken from the queue's own module on the command line's
 * side of the fixture, and the screen is then required to produce the same file.
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
import { reviewProposal, REVIEW_LOG, DECIDED } from "../src/review.mjs";
import { INBOX, listProposals, openProposal, lintProject,
         revertProposalMarks } from "../src/studio.mjs";
/* THE FIXTURE PROVES ITSELF WITH THE IMPORTER'S OWN ARITHMETIC rather than with a second
   copy of it written here: a fixture whose marks were wrong would make section 8 pass
   against nonsense. */
import { revertBody, importText, writeTextImport } from "../src/import-text.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { pressWhen, settleOn } from "./press.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "review-screen");
const WHO = "the agent at desk 4";

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sha = p => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const readJson = p => JSON.parse(fs.readFileSync(p, "utf8"));

/** Every file under a folder with its sha256, so "nothing was written" is a claim about bytes. */
function fingerprint(dir) {
  const out = [];
  (function walk(at, rel) {
    fs.readdirSync(at, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
      .forEach(e => {
        const p = path.join(at, e.name), r = rel ? rel + "/" + e.name : e.name;
        if (e.isDirectory()) walk(p, r); else out.push(r + " " + sha(p));
      });
  })(dir, "");
  return out.join("\n");
}

/* THE STACK DECIDES (board 1016 item 7). From a proposal's view its one line opens the stack on that file's first row; each
   of the file's rows in hand is answered by its key, A where `want` says accept and R where it says reject, and any other
   card is put Later (S); then the name typed under Apply for that file, and Apply. Each answer waits out the 340 ms the
   keys rest after one. Returns how many of `want` were answered. */
async function stackDecide(page, press, base, want, who) {
  await press('[data-act="rv-stack"]', 900);
  await settleOn(page, '!!document.querySelector("#stk .stk-card.hand")', { bound: 30000 });
  const keys = Object.keys(want);
  let answered = 0;
  for (let i = 0; i < 120 && answered < keys.length; i++) {
    const hand = await page.evaluate(() => {
      const h = document.querySelector("#stk .stk-card.hand");
      if (!h) return null;
      const src = h.querySelector(".stk-src");
      return { key: h.getAttribute("data-key") || "", file: src ? src.getAttribute("data-file") || "" : "" };
    });
    if (!hand) break;
    const k = hand.file.indexOf(base) >= 0 ? keys.find((x) => hand.key.endsWith(":" + x)) : null;
    const v = k ? want[k] : null;
    await page.evaluate(() => { const st = document.querySelector("#stkStage"); if (st) st.focus(); });
    await page.keyboard.press(v === "accept" ? "a" : v === "reject" ? "r" : "s");
    if (v) answered++;
    await sleep(420);
  }
  await page.evaluate((a) => {
    const f = Array.from(document.querySelectorAll("#stkTray .stk-from")).find((e) => (e.getAttribute("data-file") || "").indexOf(a.base) >= 0);
    if (f) { f.value = a.who; f.dispatchEvent(new Event("input", { bubbles: true })); }
  }, { base, who });
  await sleep(150);
  await press("#stkApply", 1800);
  await settleOn(page, '!document.querySelector("#stkApply.busy")', { bound: 60000 });
  return answered;
}

function pile(seed) {
  const out = path.join(SCRATCH, "pile");
  const r = spawnSync(process.execPath, ["tools/fixtures/generate.mjs", "--seed", String(seed),
    "--rows", "14", "--out", out], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) throw new Error("the generator refused: " + (r.stderr || r.stdout));
  return path.join(out, "macros.csv");
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

const REVIEW_DISCS = ["key-backup", "disc-review", "card-new"];
function reviewDiscsHeld(discs) {
  const acts = (discs || []).map(d => d.act);
  const missing = missingMembers(acts, REVIEW_DISCS, true);
  const vis = name => (discs || []).find(d => d.act === name) || {};
  if (vis("key-backup").act && vis("key-backup").vis !== "hidden") missing.push("key-backup not hidden");
  if (vis("disc-review").vis !== "visible") missing.push("disc-review not visible");
  if (vis("disc-review").tab !== 0) missing.push("disc-review tab " + vis("disc-review").tab);
  if (acts.length < REVIEW_DISCS.length) missing.push("discs under " + REVIEW_DISCS.length);
  return { ok: missing.length === 0, missing };
}
/* COUNTS:END */

async function main(argv) {
  const keep = argv.indexOf("--keep") >= 0;
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const projects = path.join(SCRATCH, "projects");
  const F = await Engine.format();

  /* ---- two identical projects, and one proposal in each inbox ------------------------------ */

  const made = await importCsv({ file: pile(44), id: "queue-catalog", name: "Queue" });
  const head = made.catalog;

  const ids = head.cards.map(c => c.id);
  const TAKEN = ids[2], REFUSED = ids[4], SECOND = ids[6];
  const proposal = JSON.parse(JSON.stringify(head));
  proposal.cards.find(c => c.id === TAKEN).body.en += "\nGrelira thelork ustuma widesk.";
  proposal.cards.find(c => c.id === REFUSED).title.pl = "Norvira zubalt ondrek";
  proposal.cards.find(c => c.id === SECOND).body.pl += " Sarnux plasib.";
  proposal.modified = true;
  delete proposal.hash; delete proposal.sig;
  proposal.hash = F.contentHash(proposal);

  /* A SECOND FILE THAT IS A DIFFERENT CATALOG, which since board 539 is not a refusal but the
     other kind of proposal: a pile coming in. It carries two cards this project has not got and
     is missing one that it has, so the queue it opens has to show the two and not the one. */
  const stranger = JSON.parse(JSON.stringify(proposal));
  stranger.id = "another-catalog";
  stranger.name = "a catalog from somewhere else";
  const ABSENT = ids[8];
  stranger.cards = stranger.cards.filter(c => c.id !== ABSENT);
  [1, 2].forEach(n => stranger.cards.push({
    id: "c-coming-in-" + n, shelf: head.cards[0].shelf,
    title: { en: "Thelork ustuma " + n }, body: { en: "Widesk dovib glemira norvil." },
    bodyShape: "plain" }));
  delete stranger.hash; stranger.hash = F.contentHash(stranger);

  const plant = (folder) => {
    const dir = path.join(projects, folder);
    fs.mkdirSync(path.join(dir, INBOX), { recursive: true });
    fs.writeFileSync(path.join(dir, DRAFT_FILE), json(head), "utf8");
    fs.writeFileSync(path.join(dir, PROJECT_FILE), json({ id: head.id, name: "Queue", rev: 0,
      edition: "", draft: DRAFT_FILE, folder: null }), "utf8");
    fs.writeFileSync(path.join(dir, INBOX, "desk-four.ec"), json(proposal), "utf8");
    fs.writeFileSync(path.join(dir, INBOX, "stranger.ec"), json(stranger), "utf8");
    return dir;
  };
  const screenDir = plant("on-screen");
  const cliDir = plant("on-the-command-line");
  check(sha(path.join(screenDir, DRAFT_FILE)) === sha(path.join(cliDir, DRAFT_FILE))
    && sha(path.join(screenDir, INBOX, "desk-four.ec"))
      === sha(path.join(cliDir, INBOX, "desk-four.ec")),
    "0a the two projects and the two proposals start as the same bytes");

  /* The keys, taken from the queue's own module rather than written out here: a key this leg
     invented would test that the leg and the module agree about strings, not that the two doors
     agree about a catalog. */
  const queue = await reviewProposal({ project: cliDir,
    file: path.join(cliDir, INBOX, "desk-four.ec"), rules: [], write: false });
  const keyFor = (id, p) => queue.changes.find(c => c.id === id && c.path === p).key;
  const ACCEPT = [keyFor(TAKEN, "body.en"), keyFor(SECOND, "body.pl")];
  const REJECT = [keyFor(REFUSED, "title.pl")];
  check(queue.changes.length === 3 && ACCEPT.length === 2,
    "0b the proposal makes " + queue.changes.length + " changes, keyed "
    + JSON.stringify(queue.changes.map(c => c.key)));

  /* ---- 1. THE SCREEN ------------------------------------------------------------------------ */

  const studio = await openStudio("tests/review-screen.mjs", { words: true,
    projects, userDataDir: path.join(SCRATCH, "ud"),
  });
  try {
    const page = studio.page;
    const press = async (sel, ms) => {
      await pressWhen(page, sel, { who: "tests/review-screen.mjs" });
      await sleep(ms || 400);
    };

    /* From the Library (board 982 E): Overview shows a catalog only once it has been opened. */
    await press('#rail [data-act="home"][data-v="library"]', 400);
    await pressWhen(page, '[data-act="open"]', { who: "tests/review-screen.mjs", attr: ["data-dir", screenDir] });
    await sleep(700);

    /* THE SECTION OPENS ON THE STACK since the review door's stage 3 (ed62ab8d, 2026-11-15), not on the list of files this
       section read until then: every card says the file it came from (stk-src), which opens that file as the list's Open did,
       and an open file's aside lists the inbox's files and names the folder. What the list's row said of each file, its kind
       and what it proposes, the open file's head pane says (rvFacts). So section 1 reads the stack, then opens each file from
       it and reads its pane and aside, and comes back. Nothing is decided or written. */
    await press('[data-act="section"][data-v="proposals"]', 1200);
    await settleOn(page, '(window.STUDIO_READY || {}).screen === "proposals" && !!document.querySelector("#main #stk")', { bound: 30000 });
    const list = JSON.parse(await page.evaluate(`JSON.stringify({
      screen: window.STUDIO_READY.screen,
      sources: Array.from(new Set(Array.from(document.querySelectorAll('#main [data-act="stk-src"]'))
        .map(e => e.getAttribute("data-file").split(/[\\\\/]/).pop()))).sort(),
      rail: (document.querySelector('#rail a[data-v="proposals"] .num') || {}).textContent,
    })`));
    const paneOf = async (name) => {
      await press('[data-act="stk-src"][data-file*="' + name + '"]', 900);
      await settleOn(page, '((document.querySelector("#main h1") || {}).textContent || "").indexOf(' + JSON.stringify(name) + ') === 0', { bound: 30000 });
      /* THE BACKSLASH IS DOUBLED BECAUSE THIS IS A TEMPLATE LITERAL: an unrecognised escape in one is dropped, so a
         single-backslash \s here reached the page as /s+/g and ate the s out of "3 changes" (measured 2026-09-20). */
      const seen = JSON.parse(await page.evaluate(`JSON.stringify({
        h1: (document.querySelector("#main h1") || {}).textContent || "",
        facts: Array.from(document.querySelectorAll("#main .facts .kv"))
          .map(k => k.querySelector(".k").textContent + ": " + k.querySelector(".v").textContent.replace(/\\s+/g, " ").trim()),
        files: Array.from(document.querySelectorAll("#main .rv-aside .rv-file .nm")).map(e => e.textContent),
        inbox: Array.from(document.querySelectorAll("#main .rv-aside .rv-note.mono")).map(e => e.textContent).join(" "),
        opens: document.querySelectorAll('#main .rv-aside [data-act="rv-open"]').length,
      })`));
      await press('[data-act="rv-back"]', 700);
      await settleOn(page, '!!document.querySelector("#main #stk")', { bound: 30000 });
      return seen;
    };
    const paneDesk = await paneOf("desk-four"), paneStranger = await paneOf("stranger");
    const factOf = (pane, k) => (pane.facts.find(f => f.indexOf(k + ": ") === 0) || "").slice(k.length + 2);
    list.proposes = [factOf(paneDesk, "What it proposes"), factOf(paneStranger, "What it proposes")];
    check(list.screen === "proposals" && JSON.stringify(list.sources) === JSON.stringify(["desk-four.ec", "stranger.ec"])
      && paneDesk.files.slice().sort().join("|") === "desk-four.ec|stranger.ec",
      "1a the Review screen lists what is in the inbox: its cards name the two files they came from, and an open file's"
      + " aside lists both: " + JSON.stringify([list.sources, paneDesk.files]));
    check(paneDesk.inbox.indexOf(path.join(screenDir, INBOX)) >= 0,
      "1b and names the folder it read, so nobody has to guess where to drop a file: " + JSON.stringify(paneDesk.inbox));
    check(paneDesk.h1 === "desk-four.ec" && paneStranger.h1 === "stranger.ec" && paneDesk.opens === 1 && paneStranger.opens === 1
      && factOf(paneDesk, "Where it came from") === "this catalog, from a teammate"
      && /^another catalog, /.test(factOf(paneStranger, "Where it came from")),
      "1c both files open, and each says which kind it is rather than one of them being refused (board 539): "
      + JSON.stringify([factOf(paneDesk, "Where it came from"), factOf(paneStranger, "Where it came from")]));
    /* THE RAIL'S REVIEW ROW COUNTS EVERYTHING THAT WAITS, the Review disc's own number: here the rows waiting in both
       files and the findings that wait (errors and warnings), with no model's drafts and no requests to join. */
    const waiting1 = (await listProposals(screenDir)).proposals.filter(p => p.ok).reduce((n, p) => n + p.pending, 0);
    const lint1 = await lintProject(screenDir);
    check(list.rail === String(waiting1 + lint1.errors + lint1.warnings),
      "1d the rail's Review row counts every row waiting in both files and every finding that waits ("
      + list.rail + ")");

    /* WHAT EACH FILE PROPOSES. The two files hold the same three field changes and one of them brings two cards in as well,
       so the words have to distinguish them; before board 539 the list's column was the row count and said "3" and "5".
       Read on each file's own head pane, where the section now says it on the way to a file (see section 1's head). */
    check(list.proposes.length === 2 && list.proposes[0] !== list.proposes[1]
      && list.proposes.every(v => /change/.test(v)),
      "1e each file says what it proposes rather than how many rows it has: "
      + JSON.stringify(list.proposes));

    /* THE ROW IS READ THE WAY THE FRAME DRAWS IT (board 539, queue frame E): the key is the
       mono line under the card's own title, and was and becomes are two lines of one cell at
       the pane's full width rather than two columns. */
    const QROWS = `Array.from(document.querySelectorAll("#main table tr")).slice(1)`;

    /* ---- 12. A HELD ROW IS MARKED (sense pass 3, item 1) ------------------------------------
     * The pile from another catalog has nothing earlier to be read against, so its three rows
     * meeting cards here are held and its two new cards are not. MOVED WITH BOARD 1016 ITEM 7,
     * old: "12a Accept all ticks the two cards coming in and leaves the three held rows, each
     * marked, with the reason at the head"; new: the table has no Accept all, the held rows are
     * still marked with the reason at the head, and the stack's Shift A never takes one
     * (tests/review-door.mjs rd18). */
    const beforeHeld = fingerprint(screenDir);
    await press('[data-act="stk-src"][data-file*="stranger"]', 900);
    await settleOn(page, 'document.querySelectorAll("#main table.rvq tr").length > 1', { bound: 30000 });
    const held = JSON.parse(await page.evaluate(`JSON.stringify(${QROWS}.map(tr => ({
      held: !!tr.cells[0].querySelector('[data-held]') })))`));
    const heldNote = await page.evaluate(() => Array.from(document.querySelectorAll("#main .dashed"))
      .map(e => e.textContent).join(" | "));
    check(held.length === 5 && held.filter(r => r.held).length === 3 && /look at each such row before accepting it/.test(heldNote),
      "12a the pile marks its three held rows and not the two cards coming in, with the reason at the head: "
      + JSON.stringify(held));
    await press('[data-act="rv-back"]', 700);
    check(fingerprint(screenDir) === beforeHeld,
      "12b and nothing was written by looking");

    await press('[data-act="stk-src"][data-file*="desk-four"]', 700);
    await settleOn(page, '((document.querySelector("#main h1") || {}).textContent || "") === "desk-four.ec"', { bound: 30000 });
    const q = JSON.parse(await page.evaluate(`JSON.stringify({
      h1: document.querySelector("#main h1").textContent,
      facts: Array.from(document.querySelectorAll("#main .facts .kv"))
        .map(k => k.querySelector(".k").textContent + ": " + k.querySelector(".v").textContent),
      keys: ${QROWS}.map(tr => tr.cells[0].querySelector(".mono").textContent),
      titles: ${QROWS}.map(tr => tr.cells[0].querySelector("b").textContent),
      chips: ${QROWS}.map(tr => tr.cells[0].querySelector(".chip").textContent),
      was: ${QROWS}.map(tr => tr.cells[1].querySelectorAll(".stack span")[0].textContent),
      becomes: ${QROWS}.map(tr => tr.cells[1].querySelectorAll(".stack span")[1].textContent),
      doors: document.querySelectorAll(".doors .door").length,
      deciders: document.querySelectorAll('#main [data-act="rv-decide"], #main [data-act="rv-all"], #main [data-act="rv-one"], #main [data-act="rv-land"]').length,
      line: document.querySelectorAll('#main [data-act="rv-stack"]').length,
    })`));
    /* MOVED WITH BOARD 1016 ITEM 7, old: "the proposal opens as its changes" read off the lede, which said how many were
       decided here; new: the same count off the head pane's own words. */
    check(q.h1 === "desk-four.ec" && q.facts.some(f => /^What it proposes: 3 changes$/.test(f.replace(/\s+/g, " "))),
      "2a the proposal opens as its changes: " + JSON.stringify(q.facts));
    check(q.keys.slice().sort().join("|") === queue.changes.map(c => c.key).sort().join("|"),
      "2b one row per change, keyed as the command line keys them: " + JSON.stringify(q.keys));
    const at = q.keys.indexOf(ACCEPT[0]);
    check(q.was[at] !== q.becomes[at] && q.becomes[at].indexOf("Grelira") >= 0,
      "2c each row is the field's own before and after, and they differ: "
      + JSON.stringify(q.becomes[at].slice(-40)));
    /* MOVED WITH BOARD 1016 ITEM 7, old: "2d and each carries an accept and a reject"; new: no row carries a control that
       decides, and one line opens the stack. */
    check(q.deciders === 0 && q.line === 1, "2d no row carries a control that decides, and one line opens the stack ("
      + q.deciders + " deciding controls, " + q.line + " line for " + q.keys.length + " rows)");
    check(q.facts.length === 4
      && q.facts.some(f => /^Where it came from: this catalog, from a teammate$/.test(f))
      && q.facts.some(f => /^The file: desk-four\.ec$/.test(f)),
      "2e the head pane says the file once, in four facts, and this one came back from a desk"
      + " rather than from another catalog: " + JSON.stringify(q.facts));
    check(q.doors === 0 && q.chips.every(c => c === "Changed")
      && q.titles.every((t, i) => t && t.indexOf(q.keys[i].split(":")[1]) < 0),
      "2f each row wears its kind and the card's own title rather than the key alone, and no"
      + " door is over the table (board 1016 item 7): " + JSON.stringify(q.titles.slice(0, 2)));

    /* THE ROW AND THE HEAD PANE ARE ONE SET OF WORDS, which is the whole of this item: the
       list's column was the number of rows and the pane was these phrases, and a person had to
       open a file to learn which of two was the afternoon's work. Read off the screen on both
       screens rather than computed here, so a second implementation cannot creep back in. */
    /* 2g, the list's row and the head pane in one set of words, is retired (2026-11-22): since the review door's stage 3 the
       list of files is not on the section's way in (rvLoad paints it after an import lands in the queue, or from a newly
       arrived file's bubble), so a row read
       here would be the pane read twice. 1e reads what each file proposes on the pane, the one place the section says it. */

    /* ---- the decisions, in the stack ---------------------------------------------------------
     * RETIRED WITH BOARD 1016 ITEM 7: "3a pressing Land with nobody's name on it wrote nothing at
     * all in the project folder" and "3b and the screen shows the module's own refusal" - the
     * table has no Land, and the stack attributes a file to its desk unless a name is typed
     * (stkFrom); the module's refusal stays held at the command line (tests/review.mjs).
     * MOVED, old: "3c with a name it lands and the screen goes back to the folder"; new: the
     * same rows answered in the stack, the name typed under Apply, and Apply writes. */
    const before = fingerprint(screenDir);
    const want3 = {};
    ACCEPT.forEach((k) => { want3[k] = "accept"; });
    want3[REJECT[0]] = "reject";
    const answered3 = await stackDecide(page, press, "desk-four", want3, WHO);
    const after = JSON.parse(await page.evaluate(`JSON.stringify({
      screen: window.STUDIO_READY.screen,
      text: document.querySelector("#main").textContent,
    })`));
    check(answered3 === 3 && after.screen === "proposals" && fingerprint(screenDir) !== before,
      "3c with a name typed under Apply the stack's answers land, and the screen stays in the section: " + answered3 + " answered");

    /* ---- 9. THE DISCS IN THE CORNER (board 616) ----------------------------------------------
     *
     * THE STATE THIS NEEDS IS THE ONE THE RUN IS NOW IN: one file landed and one still waiting,
     * so the corner has to count what is LEFT rather than what arrived. */

    await press('[data-act="section"][data-v="cards"]', 700);
    const left = await listProposals(screenDir);
    const rowsWaiting = left.proposals.filter(p => p.ok).reduce((n, p) => n + p.pending, 0);
    const lint9 = await lintProject(screenDir);
    const allWaiting = rowsWaiting + lint9.errors + lint9.warnings;
    const corner = JSON.parse(await page.evaluate(`JSON.stringify({
      discs: Array.from(document.querySelectorAll("#discs .disc")).map(e => ({
        act: e.getAttribute("data-act"), vis: getComputedStyle(e).visibility,
        tab: e.tabIndex, title: e.title,
        n: (e.querySelector(".dn") || {}).textContent || "",
        glyph: e.querySelector(".ic") ? getComputedStyle(e.querySelector(".ic")).display : "" })),
      rail: (document.querySelector('#rail a[data-v="proposals"] .num') || {}).textContent,
      screen: window.STUDIO_READY.screen,
    })`));
    const disc = (a) => corner.discs.find(d => d.act === a) || {};
    const discs9 = reviewDiscsHeld(corner.discs);
    check(corner.screen === "cards" && discs9.ok,
      "9a with a file still waiting the corner carries the review from the cards screen, in"
      + " reach and in the tab order"
      + (discs9.missing.length ? ", missing " + discs9.missing.join(", ") : ""));
    /* ONE NUMBER ON THE DISC AND THE RAIL, everything that waits: the rows left in the inbox and the findings that wait.
       The oracle is the queue's own listProposals and the project's own lint on this side of the fixture. */
    check(rowsWaiting > 1,
      "9b the fixture leaves " + rowsWaiting + " row(s) waiting, so the disc shows its number");
    check(disc("disc-review").n === String(allWaiting)
      && disc("disc-review").glyph === "none"
      && corner.rail === String(allWaiting),
      "9c the disc and the rail's Review row say one number, the rows waiting and the findings that wait: "
      + JSON.stringify(disc("disc-review").n) + " on the disc, " + JSON.stringify(corner.rail)
      + " on the rail");
    check(disc("disc-review").title.replace(/\s+/g, " ") === "Review: " + allWaiting,
      "9d and the disc says its number when it is asked: "
      + JSON.stringify(disc("disc-review").title));

    /* THE REVIEW DISC IS PRESSED AND NOT ONLY READ. Every leg above reads attributes off a
       button, and a disc whose data-act named nothing would satisfy all of them while doing
       nothing at all; the first disc is pressed by tests/polish.mjs, which reaches the cover
       through `[data-act="card-new"]` now that the corner holds it. */
    await press("#discReview", 1200);
    await settleOn(page, '(window.STUDIO_READY || {}).screen === "proposals"', { bound: 30000 });
    /* The section's front is the stack since the review door's stage 3 (ed62ab8d): its heading is Review, and its cards name
       the files they came from. */
    const qList = JSON.parse(await page.evaluate(`JSON.stringify({
      screen: window.STUDIO_READY.screen,
      h1: (document.querySelector("#main h1") || {}).textContent || "",
      files: Array.from(new Set(Array.from(document.querySelectorAll('#main [data-act="stk-src"]'))
        .map(e => e.getAttribute("data-file").split(/[\\\\/]/).pop()))),
    })`));
    check(qList.screen === "proposals" && qList.h1 === "Review"
      && qList.files.indexOf("stranger.ec") >= 0,
      "9e the Review disc opens the section itself from the cards screen, on its stack rather"
      + " than on a file: " + JSON.stringify(qList.h1) + " over " + JSON.stringify(qList.files));
    /* ---- the other kind of proposal, decided with Accept all (board 539, frame F) ---------- */

    await press('[data-act="stk-src"][data-file*="stranger"]', 900);
    await settleOn(page, 'document.querySelectorAll("#main .facts .kv").length > 0', { bound: 30000 });
    const inQ = JSON.parse(await page.evaluate(`JSON.stringify({
      facts: Array.from(document.querySelectorAll("#main .facts .kv"))
        .map(k => k.querySelector(".k").textContent + ": " + k.querySelector(".v").textContent),
      chips: ${QROWS}.map(tr => tr.cells[0].querySelector(".chip").textContent),
      doorHead: Array.from(document.querySelectorAll(".doors .door h3")).map(h => h.textContent),
    })`));
    check(inQ.facts.some(f => /^Where it came from: another catalog, "another-catalog"$/.test(f))
      && inQ.chips.filter(c => c === "Added").length === 2
      && inQ.chips.indexOf("Removed") < 0,
      "5a the pile from another catalog opens as a queue rather than a refusal, naming the"
      + " catalog at the head and wearing Added on the two cards coming in with no Removed"
      + " anywhere: " + JSON.stringify(inQ.chips));

    /* WHAT THE TWO ARRIVING CARDS SAY, ON THE SCREEN. The red was photographed on 2026-09-20:
       `- (absent)` against eighty characters of `{"id":"row-0001-...` on every one of a
       thirty-three row import. The body is the fixture's own, read out of the file rather than
       written here, so a change to the pile cannot leave this leg asserting a stale sentence. */
    const arriving = JSON.parse(await page.evaluate(`JSON.stringify({
      was: ${QROWS}.filter(tr => tr.cells[0].querySelector(".chip").textContent === "Added")
        .map(tr => tr.cells[1].querySelectorAll(".stack span")[0].textContent),
      becomes: ${QROWS}.filter(tr => tr.cells[0].querySelector(".chip").textContent === "Added")
        .map(tr => tr.cells[1].querySelectorAll(".stack span")[1].textContent),
    })`));
    const comingIn = stranger.cards.filter(c => /^c-coming-in-/.test(c.id)).map(c => c.body.en);
    check(arriving.becomes.slice().sort().join("|") === comingIn.slice().sort().join("|")
      && arriving.was.every(w => w === "nothing")
      && arriving.becomes.every(b => b.indexOf("{") < 0 && b.indexOf('"id"') < 0),
      "5f a card coming in says the card and not the document it is made of - its body in the"
      + " reading language, against a side that was never here: "
      + JSON.stringify(arriving.becomes) + " against " + JSON.stringify(arriving.was));

    /* RETIRED WITH BOARD 1016 ITEM 7: "5b Accept all ticks every WAITING row ... and the doors give
       way to what the screen says after it", "5c and the button that writes still counts what was
       actually ticked" and "5d Undo puts every tick back and the doors with them" - the table has
       no Accept all and no Land. The stack's own answers, Take back and Apply are
       tests/review-door.mjs rd16 to rd24. The import is decided row by row in the stack: every
       row still waiting, as the command line's twin accepts every pending key below. */
    const strangerOpen = await openProposal(screenDir, path.join(screenDir, INBOX, "stranger.ec"));
    const want5 = {};
    strangerOpen.changes.filter((c) => !c.decided).forEach((c) => { want5[c.key] = "accept"; });
    await stackDecide(page, press, "stranger", want5, WHO);
  } finally {
    await studio.shut();
  }
  await sleep(400);

  /* ---- 2. THE SAME DECISIONS AT THE COMMAND LINE -------------------------------------------- */

  const args = [path.join(ROOT, "tools", "review.mjs"), cliDir,
    path.join(cliDir, INBOX, "desk-four.ec"), "--from", WHO];
  ACCEPT.forEach(k => args.push("--accept", k));
  REJECT.forEach(k => args.push("--reject", k));
  const cli = spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8" });
  check(cli.status === 0 || cli.status === 1,
    "4a node tools/review.mjs decided the twin, exit " + cli.status
    + (cli.status > 1 ? ": " + cli.stderr : ""));

  /* THE SAME IMPORT AT THE COMMAND LINE, key by key. Accept all is not a flag of its own here
     and must not become one: it is a tick on every waiting row, so the twin is
     `--accept <key>` repeated, and the two working copies have to agree afterwards. */
  const strangerAt = path.join(cliDir, INBOX, "stranger.ec");
  const inQueue = await reviewProposal({ project: cliDir, file: strangerAt, rules: [],
                                          write: false });
  const args2 = [path.join(ROOT, "tools", "review.mjs"), cliDir, strangerAt, "--from", WHO];
  inQueue.pending.forEach(c => args2.push("--accept", c.key));
  const cli2 = spawnSync(process.execPath, args2, { cwd: ROOT, encoding: "utf8" });
  check((cli2.status === 0 || cli2.status === 1) && inQueue.pending.length > 0,
    "5e node tools/review.mjs decided the twin's import, " + inQueue.pending.length
    + " key(s), exit " + cli2.status + (cli2.status > 1 ? ": " + cli2.stderr : ""));

  const a = path.join(screenDir, DRAFT_FILE), b = path.join(cliDir, DRAFT_FILE);
  check(sha(a) === sha(b), "4b the working copy is the same bytes from the screen and from the"
    + " command line, after an agent's export decided row by row AND an import decided row by"
    + " row, both in the stack (" + sha(a).slice(0, 16) + ")");
  /* BOTH DOORS PUT A SETTLED INBOX FILE AWAY since the sense pass of 2026-09-22 (item 19), so
     the file every row of which was decided is now in decided/ beside the inbox, on both sides;
     `nowAt` is where a file is after a land, and 4h holds the two doors to the same folders. */
  const nowAt = (dir, name) => fs.existsSync(path.join(dir, INBOX, name))
    ? path.join(dir, INBOX, name) : path.join(dir, DECIDED, name);
  check(sha(a) !== sha(nowAt(screenDir, "desk-four.ec")),
    "4c and it is not simply the proposal copied over the draft");
  const folders = (dir) => [INBOX, DECIDED].map(f => f + ": " + (fs.existsSync(path.join(dir, f))
    ? fs.readdirSync(path.join(dir, f)).sort().join(",") : "-")).join(" | ");
  check(folders(screenDir) === folders(cliDir) && fs.existsSync(path.join(screenDir, DECIDED)),
    "4h and the two doors leave the same files in the same folders, the settled ones put away"
    + " in " + DECIDED + "/: " + folders(screenDir));

  /* The log, with the clock taken out of it: the two doors were minutes apart and nothing else
     in the record is allowed to differ. */
  const flat = (p) => JSON.stringify(readJson(p), (k, v) => k === "at" ? "<when>" : v, 1);
  check(flat(path.join(screenDir, REVIEW_LOG)) === flat(path.join(cliDir, REVIEW_LOG)),
    "4d and the review log matches once the clock is normalised, so the attribution, the"
    + " accepted keys, the rejected ones and the file's own hash all agree");

  const landed = readJson(a);
  const card = (cat, id) => cat.cards.find(c => c.id === id);
  check(card(landed, TAKEN).body.en.indexOf("Grelira") >= 0
    && card(landed, REFUSED).title.pl !== "Norvira zubalt ondrek",
    "4e the accepted change is in the working copy and the rejected one is not");
  const bare = Object.assign({}, landed); delete bare.hash; delete bare.sig;
  check(landed.hash === F.contentHash(bare),
    "4f and the draft carries the engine's hash of what it now holds");

  const again = await reviewProposal({ project: screenDir,
    file: nowAt(screenDir, "desk-four.ec"), rules: [], write: false });
  /* The two accepted changes are no longer changes at all - the working copy now says what the
     proposal says - and the rejected one is still a difference and is not offered again. */
  /* THE SAME-ID PATH, UNCHANGED, WHICH IS THE CONTROL BOARD 539 ASKS FOR. Two of this file's
     three changes are in the working copy now and are no longer differences; the third was
     rejected and is not offered again. The two rows it DOES have are the cards the import
     brought in, which this export predates - and they are REMOVALS, which is exactly what a
     proposal carrying this catalog's own id may still offer and a file from another catalog
     may not. */
  const decidedKeys = ACCEPT.concat(REJECT);
  const oldRows = again.changes.filter(c => decidedKeys.indexOf(c.key) >= 0);
  const freshRows = again.changes.filter(c => decidedKeys.indexOf(c.key) < 0);
  check(oldRows.length === 1 && again.known.length === 1
    && !again.pending.some(c => decidedKeys.indexOf(c.key) >= 0)
    && freshRows.length === 2 && freshRows.every(c => c.op === "remove"),
    "4g reopening the same file offers none of its own changes again - " + oldRows.length
    + " left of the three, " + again.known.length + " decided before, 0 of them waiting - and"
    + " the " + freshRows.length + " rows it now has are REMOVALS of the cards the import"
    + " brought in, which a proposal carrying this catalog's own id may still offer and one"
    + " from another catalog may not");

  /* ---- 6. A FILE WITH NOTHING LEFT TO DECIDE STILL SAYS HOW BIG IT IS --------------------
   *
   * THE CONTROL THIS ITEM NEEDS, and it is planted in a FOLDER OF ITS OWN: every section above
   * has reviewed the two projects it made, so a count read there would be a count of what those
   * reviews left behind. Here one file is rejected row by row - rejected and not accepted, so
   * the working copy does not move and every row is still a difference - and what the list then
   * says about it is that nothing is waiting and that it is nonetheless a file of three
   * changes. A column that counted rows could not tell those two things apart, and a list that
   * showed only what is left to do would say nothing at all about a file somebody has to decide
   * whether to delete.
   */
  const settledDir = plant("every-row-decided");
  const beforeReview = (await listProposals(settledDir)).proposals
    .find(x => x.name === "desk-four.ec");
  const rejected = await reviewProposal({ project: settledDir,
    file: path.join(settledDir, INBOX, "desk-four.ec"),
    rules: [{ verb: "reject", pattern: "*" }], from: WHO, write: true });
  const settled = (await listProposals(settledDir)).proposals
    .find(x => x.name === "desk-four.ec");
  check(beforeReview.pending === 3 && beforeReview.proposes.changes === 3
    && rejected.rejected.length === 3,
    "6a the file starts with " + beforeReview.pending + " rows waiting of the "
    + beforeReview.changes + " it holds, and all " + rejected.rejected.length
    + " are rejected in one review");
  check(settled.pending === 0 && settled.changes === 3 && settled.proposes.changes === 3
    && rejected.applied.length === 0,
    "6b and afterwards it counts " + settled.pending + " waiting while still saying it is "
    + settled.proposes.changes + " change(s): the two numbers on the row answer two questions,"
    + " and it is among no files waiting");
  const railWorthy = (await listProposals(settledDir)).proposals
    .filter(x => x.ok && x.pending > 0).length;
  check(railWorthy === 1,
    "6c so the files with a row still waiting are " + railWorthy
    + " of the 2 files in that inbox, and the one it drops is the one nobody has to look at");

  /* ---- 7. THE THREE KINDS OF ROW, AND THE ONE THAT MUST STILL SHOW A DOCUMENT ------------
   *
   * Planted in a folder of its own, because every section above has reviewed the projects it
   * made. One file carries all three at once: a card arriving, a field of a card changing, and
   * a field whose value really IS a document - a card's list of intents, which is the control.
   * A fix that made every row say a title would pass the two legs above and break that one,
   * and it is asserted at the module rather than on the screen because it is the module that
   * decides what a side says.
   */
  const sayDir = path.join(projects, "what-a-row-says");
  fs.mkdirSync(path.join(sayDir, INBOX), { recursive: true });
  const intents = head.tags.filter(t => t.kind === "request").map(t => t.id);
  if (intents.length < 2) throw new Error("the pile has " + intents.length + " intent(s) and"
    + " this section needs two to move a card between them");
  const sayHead = JSON.parse(JSON.stringify(head));
  sayHead.cards[0].requests = [intents[0]];
  /* THE TWO LANGUAGES DIFFER, which is what gives the leg teeth: a side built from whichever
     language happens to come first in the card would pass with them equal. */
  const ARRIVING = "Widesk dovib glemira norvil, plasule zubynt.";
  const ARRIVING_PL = "Norvan ustave brumor greleth, plasib zubess.";
  const sayProposal = JSON.parse(JSON.stringify(sayHead));
  sayProposal.cards.push({ id: "c-arriving-one", shelf: sayHead.cards[0].shelf,
    title: { en: "Thelork ustuma", pl: "Thelork ustuma" },
    body: { en: ARRIVING, pl: ARRIVING_PL }, bodyShape: "plain" });
  sayProposal.cards[0].requests = [intents[0], intents[1]];
  sayProposal.cards.find(c => c.id === TAKEN).body.en += "\nGrelira thelork ustuma widesk.";
  sayProposal.modified = true;
  delete sayProposal.hash; delete sayProposal.sig;
  sayProposal.hash = F.contentHash(sayProposal);
  fs.writeFileSync(path.join(sayDir, DRAFT_FILE), json(sayHead), "utf8");
  fs.writeFileSync(path.join(sayDir, PROJECT_FILE), json({ id: sayHead.id, name: "Queue",
    rev: 0, edition: "", draft: DRAFT_FILE, folder: null }), "utf8");
  fs.writeFileSync(path.join(sayDir, INBOX, "arriving.ec"), json(sayProposal), "utf8");

  const said = await openProposal(sayDir, path.join(sayDir, INBOX, "arriving.ec"));
  const rowFor = (f) => (said.changes || []).find(f);
  const addRow = rowFor(c => c.op === "add" && c.scope === "card");
  const fieldRow = rowFor(c => c.scope === "card" && c.path === "body.en");
  const listRow = rowFor(c => c.scope === "card" && c.path === "requests");
  check(!!addRow && addRow.was === null && addRow.becomes === ARRIVING
    && sayHead.langs[0].code === "en" && ARRIVING !== ARRIVING_PL,
    "7a the card arriving says its body in the reading language - this catalog declares "
    + JSON.stringify(sayHead.langs.map(l => l.code)) + " and the card says something else in"
    + " the other one - against a side that is not there at all: "
    + JSON.stringify(addRow && addRow.was) + " -> " + JSON.stringify(addRow && addRow.becomes));
  check(!!fieldRow && fieldRow.was !== null && /Grelira/.test(fieldRow.becomes)
    && fieldRow.becomes !== fieldRow.was,
    "7b a field of a card keeps the diff's own window on the difference: "
    + JSON.stringify(fieldRow && fieldRow.becomes.slice(-40)));
  check(!!listRow && listRow.becomes.indexOf("[") === 0
    && listRow.becomes.indexOf(intents[1]) >= 0 && listRow.was.indexOf("[") === 0,
    "7c AND THE CONTROL: a field whose value really is a document still shows the document,"
    + " because there is nothing else it could show - " + JSON.stringify(listRow && listRow.was)
    + " -> " + JSON.stringify(listRow && listRow.becomes));
  /* A ROW IS ACCEPTED WHOLE, SO IT IS SHOWN WHOLE (polish 03, item 1): the changed field's two
     sides are the two bodies, and the card arriving carries its other language beside it. */
  const takenHead = sayHead.cards.find(c => c.id === TAKEN).body.en;
  const takenNow = sayProposal.cards.find(c => c.id === TAKEN).body.en;
  check(!!fieldRow && fieldRow.was === takenHead && fieldRow.becomes === takenNow
    && takenHead.length > 80,
    "7d a changed body is shown whole on both sides, " + String(fieldRow && fieldRow.was).length
    + " and " + String(fieldRow && fieldRow.becomes).length + " characters");
  const alsoPl = (addRow && addRow.also) || [];
  check(alsoPl.some(a => a.field === "body" && a.lang === "pl" && a.text === ARRIVING_PL)
    && alsoPl.some(a => a.field === "title" && a.lang === "pl")
    && !alsoPl.some(a => a.lang === "en" && (a.field === "body" || a.field === "title"))
    && said.waiting && said.waiting.cards === 1,
    "7e the card arriving carries its Polish title and body beside the English side, and the"
    + " Accept all door counts it: " + JSON.stringify(alsoPl.map(a => a.field + "." + a.lang)));
  /* THE READING LANGUAGE IS THE SCREEN'S WHERE IT NAMES ONE (polish 03, item 23): the EN / PL
     control reads the queue in Polish, and a code the catalog does not declare is the control. */
  const inPl = await openProposal(sayDir, path.join(sayDir, INBOX, "arriving.ec"), { lang: "pl" });
  const inXx = await openProposal(sayDir, path.join(sayDir, INBOX, "arriving.ec"), { lang: "xx" });
  const plAdd = inPl.changes.find(c => c.op === "add" && c.scope === "card");
  const xxAdd = inXx.changes.find(c => c.op === "add" && c.scope === "card");
  check(plAdd.becomes === ARRIVING_PL && plAdd.also.some(a => a.lang === "en" && a.text === ARRIVING)
    && xxAdd.becomes === ARRIVING,
    "7f read in Polish the arriving card says its Polish body with the English beside it, and an"
    + " undeclared code reads in the catalog's own first language: "
    + JSON.stringify([plAdd.becomes, xxAdd.becomes]));

  /* ---- 8. THE MARKER PEN: A REWORDED PASSAGE, MARKED AND PUT BACK (604) ------------------
   *
   * MAXIM RULED IT ON 2026-09-19 21:37: every span a model reworded is highlighted in the
   * post-import review and reversible there in one press, the original words carried with the
   * proposal. The marks are written by src/import-text.mjs into the `.lint.json` beside the
   * proposal and the arithmetic on them is proved in tests/import-model.mjs; what this section
   * holds is the ROAD - that a mark reaches the row, that the row shows the body it marks
   * rather than eighty characters of it, that a press puts the file's own words back, and that
   * a row accepted afterwards lands those bytes in the working copy.
   *
   * THE FIXTURE PROVES ITSELF FIRST. The proposal is built by replacing two named passages of
   * an invented source file, so the marks' offsets are arithmetic rather than a guess, and leg
   * 8a asserts that reverting every mark gives the source back before anything else is asked.
   * A fixture whose marks were wrong would make every leg below pass against nonsense.
   */
  const penDir = path.join(projects, "the-marker-pen");
  const penScreenDir = path.join(projects, "the-marker-pen-on-screen");

  /* The source file the model was given, invented, and the two passages it changed. The first
     is long on purpose: a mark of two hundred characters wraps in the pane, and a run that
     wraps is the whole reason it cannot be a <button>. */
  const SOURCE = "Norvira zubalt ondrek plasule. "
    + "Widesk dovib glemira norvil, plasule zubynt brumor greleth ustave. "
    + "Thelork ustuma widesk dovib glemira norvil plasule zubynt brumor greleth ustave "
    + "norvira zubalt ondrek plasule widesk dovib glemira norvil plasule zubynt brumor "
    + "greleth ustave thelork ustuma widesk dovib. "
    + "Zubess plasib norvan ustave brumor greleth.";
  const WAS_LONG = "Thelork ustuma widesk dovib glemira norvil plasule zubynt brumor greleth "
    + "ustave norvira zubalt ondrek plasule widesk dovib glemira norvil plasule zubynt brumor "
    + "greleth ustave thelork ustuma widesk dovib.";
  const NOW_LONG = "Grelira thelork ustuma widesk dovib glemira norvil plasule zubynt brumor "
    + "greleth ustave norvira zubalt ondrek plasule widesk dovib glemira norvil plasule zubynt "
    + "brumor greleth ustave thelork ustuma widesk dovib ondrek.";
  const WAS_SHORT = "Zubess plasib norvan ustave brumor greleth.";
  const NOW_SHORT = "Zubess plasib norvan ustave brumor greleth zubynt.";

  /** A body built out of the source by replacing named passages, with the marks that says so.
   *  Left to right, so the offsets are into the body as it grows. */
  function marked(source, swaps) {
    let body = "", read = 0;
    const marks = [];
    swaps.forEach(s => {
      const i = source.indexOf(s.was, read);
      if (i < 0) throw new Error("the fixture's own passage is not in its source: " + s.was);
      body += source.slice(read, i);
      marks.push({ at: body.length, len: s.to.length, was: s.was, kind: s.kind || "reword" });
      body += s.to;
      read = i + s.was.length;
    });
    return { body: body + source.slice(read), marks };
  }

  const pen = marked(SOURCE, [{ was: WAS_LONG, to: NOW_LONG },
                              { was: WAS_SHORT, to: NOW_SHORT }]);
  /* THE CONTROL CARD. Longer than eighty characters and carrying no mark at all, so the leg
     that says a marked body opens is held against a body that stays the line it was. */
  const CLEAN = "Ustave brumor greleth norvan plasib zubess, thelork ustuma widesk dovib "
    + "glemira norvil plasule zubynt ondrek.";

  const PEN_CARD = "c-reworded-one", CLEAN_CARD = "c-verbatim-one";
  const penProposal = JSON.parse(JSON.stringify(head));
  penProposal.id = "text-import-catalog";
  penProposal.name = "replies from a text file";
  penProposal.cards = [
    { id: PEN_CARD, shelf: head.cards[0].shelf, title: { en: "Thelork ustuma" },
      body: { en: pen.body }, bodyShape: "plain" },
    { id: CLEAN_CARD, shelf: head.cards[0].shelf, title: { en: "Ustave brumor" },
      body: { en: CLEAN }, bodyShape: "plain" },
  ];
  delete penProposal.hash; delete penProposal.sig;
  penProposal.hash = F.contentHash(penProposal);

  /* THE REPORT THE TEXT IMPORTER WRITES BESIDE THE PROPOSAL, in its own shape: the kind it goes
     out under, and one entry per body that carries marks. Everything else in a real report is
     the import's own accounting and the queue reads none of it. */
  const penReport = {
    kind: "etiuda-studio-text-import-report", schema: 1, source: "replies.txt",
    counts: { cards: 2, bodies: 2, reword: 2, placeholder: 0 },
    marks: [{ card: PEN_CARD, lang: "en", marks: pen.marks }],
  };
  const plantPen = (dir) => {
    fs.mkdirSync(path.join(dir, INBOX), { recursive: true });
    fs.writeFileSync(path.join(dir, DRAFT_FILE), json(head), "utf8");
    fs.writeFileSync(path.join(dir, PROJECT_FILE), json({ id: head.id, name: "Queue", rev: 0,
      edition: "", draft: DRAFT_FILE, folder: null }), "utf8");
    fs.writeFileSync(path.join(dir, INBOX, "from-text.ec"), json(penProposal), "utf8");
    fs.writeFileSync(path.join(dir, INBOX, "from-text.lint.json"), json(penReport), "utf8");
    return path.join(dir, INBOX, "from-text.ec");
  };
  const penAt = plantPen(penDir);
  plantPen(penScreenDir);

  check(revertBody(pen.body, pen.marks) === SOURCE && pen.marks.length === 2
    && pen.body !== SOURCE && WAS_LONG.length > 150,
    "8a the fixture proves itself: the proposed body with both marks reverted is the source"
    + " file byte for byte, " + pen.body.length + " characters against " + SOURCE.length
    + ", the longer passage " + WAS_LONG.length + " characters");

  const penQ = await openProposal(penDir, penAt);
  const penRow = penQ.changes.find(c => c.id === PEN_CARD);
  const cleanRow = penQ.changes.find(c => c.id === CLEAN_CARD);
  check(penRow.becomes === pen.body && pen.body.length > 80
    && penRow.becomes.indexOf("...") < 0,
    "8b a card arriving with marked passages shows its body WHOLE, all " + pen.body.length
    + " characters of it: there is nowhere else on this screen for a marker pen to be");
  check(cleanRow.becomes === CLEAN && CLEAN.length > 80
    && cleanRow.segs === null && cleanRow.marks === null,
    "8c AND THE CONTROL: a card arriving with no marks is shown whole too, "
    + cleanRow.becomes.length + " characters of " + CLEAN.length + ", and is not cut into"
    + " segments: a row is accepted whole, so nothing in it is cut (polish 03, item 1)");
  check(!!penRow.segs && penRow.segs.map(s => s.text).join("") === pen.body
    && penRow.segs.filter(s => s.i !== null).length === 2
    && penRow.segs.filter(s => s.i !== null).map(s => s.was).join("|")
       === [WAS_LONG, WAS_SHORT].join("|")
    && penRow.lang === "en",
    "8d the row carries the body cut at its marks, the runs joined being the body again, each"
    + " marked run holding the words it replaced: "
    + JSON.stringify(penRow.segs && penRow.segs.map(s => s.text.length)));

  const penList = (await listProposals(penDir)).proposals;
  check(penList.find(x => x.name === "from-text.ec").reworded === 2
    && penQ.reworded === 2
    && penList.filter(x => x.reworded).length === 1,
    "8e and the folder says how many reworded passages wait in each file before anybody opens"
    + " one: " + JSON.stringify(penList.map(x => x.name + "=" + x.reworded)));

  /* ---- the press, at the module, and the arithmetic under it ------------------------------ */

  const backOne = await revertProposalMarks(penDir, penAt, [{ card: PEN_CARD, lang: "en",
    marks: [1] }]);
  const penNow = readJson(penAt);
  const reportNow = readJson(penAt.replace(/\.ec$/, ".lint.json"));
  const bodyNow = penNow.cards.find(c => c.id === PEN_CARD).body.en;
  check(backOne.reverted === 1 && bodyNow.indexOf(WAS_SHORT) >= 0
    && bodyNow.indexOf(NOW_SHORT) < 0 && bodyNow.indexOf(NOW_LONG) >= 0,
    "8f one press puts one passage back and leaves the other alone: the file's own words are in"
    + " the proposal and the model's are gone, while the passage nobody pressed still says what"
    + " the model proposed");
  const bare8 = Object.assign({}, penNow); delete bare8.hash; delete bare8.sig;
  check(penNow.hash === F.contentHash(bare8)
    && reportNow.marks[0].marks.length === 1 && reportNow.reverted === 1
    && reportNow.marks[0].marks[0].was === WAS_LONG,
    "8g and the proposal carries the engine's hash of what it now holds, with the mark that was"
    + " put back gone from the report beside it and the one that was not still there");
  const after8 = await openProposal(penDir, penAt);
  check(after8.reworded === 1
    && (after8.changes.find(c => c.id === PEN_CARD).segs || [])
       .filter(s => s.i !== null).length === 1,
    "8h so the row reopened carries one mark where it carried two, and the count on the folder"
    + " row with it (" + after8.reworded + ")");

  /* THE WHOLE OF THEM, AND THE ORDER THAT MAKES IT SAFE. A mark put back moves every mark after
     it, so a set of presses taken from the end is a set; taken from the start it would be a
     sequence and the second index would name the wrong passage. Driven on a fresh copy of the
     fixture rather than on the one above, which now has one mark. */
  const bothDir = path.join(projects, "the-marker-pen-both");
  const bothAt = plantPen(bothDir);
  await revertProposalMarks(bothDir, bothAt, [{ card: PEN_CARD, lang: "en", marks: [0, 1] }]);
  check(readJson(bothAt).cards.find(c => c.id === PEN_CARD).body.en === SOURCE,
    "8i and both presses together give the file's own words back, byte for byte, which is the"
    + " order the marks are taken in doing its work");

  /* ---- the press, on the screen, and what it lands ------------------------------------------ */

  const pen2 = await openStudio("tests/review-screen.mjs 604", { words: true,
    projects, userDataDir: path.join(SCRATCH, "ud-604"),
  });
  try {
    const page = pen2.page;
    const press = async (sel, ms) => {
      await pressWhen(page, sel, { who: "tests/review-screen.mjs" });
      await sleep(ms || 400);
    };
    await pressWhen(page, '#rail [data-act="home"][data-v="library"]', { who: "tests/review-screen.mjs" });
    await pressWhen(page, '[data-act="open"]', { who: "tests/review-screen.mjs", attr: ["data-dir", penScreenDir] });
    await sleep(700);
    await press('[data-act="section"][data-v="proposals"]', 1200);
    await press('[data-act="stk-src"][data-file*="from-text"]', 800);
    await settleOn(page, 'document.querySelectorAll("#main .mk").length === 2', { bound: 30000 });

    /* THE MECHANICAL FACT, MEASURED ON THE SCREEN AND NOT ASSUMED. A <button> is block-ified by
       Chrome whatever display it is given, so a passage longer than one line takes a box of its
       own and getClientRects() returns ONE rectangle for it; the marker was painted as a single
       blob across two lines on 2026-09-21 because of it. A span with a role is inline and gives
       one rectangle per line. The long passage here wraps, so its count is the measurement. */
    const marks = JSON.parse(await page.evaluate(`JSON.stringify(
      Array.from(document.querySelectorAll("#main .mk")).map(e => ({
        tag: e.tagName, role: e.getAttribute("role"), tab: e.getAttribute("tabindex"),
        display: getComputedStyle(e).display, rects: e.getClientRects().length,
        text: e.textContent, off: e.className.indexOf("off") >= 0,
      })))`));
    check(marks.length === 2 && marks.every(m => m.tag === "SPAN" && m.role === "button"
      && m.tab === "0" && m.display === "inline"),
      "8j the two marked passages on the screen are spans with a role and a tab stop, not"
      + " buttons: " + JSON.stringify(marks.map(m => m.tag + "/" + m.display)));
    check(marks.length === 2 && marks[0].rects >= 2,
      "8k and the long one gives " + (marks[0] || {}).rects + " client rectangles rather than one,"
      + " which is what an inline run does and what a button cannot do at any display value");
    check(marks.length === 2 && marks.map(m => m.text).join("") === NOW_LONG + NOW_SHORT
      && marks.every(m => !m.off),
      "8l each says the words the model proposed, and none of them is pressed yet");

    /* THE PRESS, AND THE PRESS AGAIN. Pressed by the mouse from the rectangle's own centre
       rather than by a synthesised click, because a press is what a person does. */
    const hit = async (n) => {
      const box = JSON.parse(await page.evaluate(`JSON.stringify((function () {
        const e = document.querySelectorAll("#main .mk")[${n}];
        if (!e) return null;
        const r = e.getClientRects()[0];
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      })())`));
      if (!box) throw new Error("no marked passage " + n + " on the screen");
      await page.mouse.click(box.x, box.y);
      await sleep(300);
    };
    await hit(1);
    await settleOn(page, '((document.querySelectorAll("#main .mk")[1] || {}).textContent || "") === ' + JSON.stringify(WAS_SHORT), { bound: 30000 });
    const pressed = JSON.parse(await page.evaluate(`JSON.stringify(
      Array.from(document.querySelectorAll("#main .mk"))
        .map(e => ({ text: e.textContent, off: e.className.indexOf("off") >= 0 })))`));
    check(pressed.length === 2 && pressed[1].text === WAS_SHORT && pressed[1].off === true
      && pressed[0].text === NOW_LONG && pressed[0].off === false,
      "8m one press and the file's own words are in the passage's place, the passage keeping its"
      + " mark so the body never loses its history; the other passage is untouched");
    await hit(1);
    await settleOn(page, '((document.querySelectorAll("#main .mk")[1] || {}).textContent || "") === ' + JSON.stringify(NOW_SHORT), { bound: 30000 });
    const again8 = JSON.parse(await page.evaluate(
      `JSON.stringify(document.querySelectorAll("#main .mk")[1].textContent)`));
    check(again8 === NOW_SHORT,
      "8n and pressing it again puts the proposal's words back, which is the ruling's one press"
      + " in both directions and the queue's own idiom");

    /* REACHABLE BY KEYBOARD. Focused with Tab's own verb and pressed with Enter, through the
       page's keydown handler rather than through a click nobody made. */
    await page.evaluate(`document.querySelectorAll("#main .mk")[1].focus()`);
    await page.keyboard.press("Enter");
    await settleOn(page, '((document.querySelectorAll("#main .mk")[1] || {}).textContent || "") === ' + JSON.stringify(WAS_SHORT), { bound: 30000 });
    const byKey = JSON.parse(await page.evaluate(`JSON.stringify({
      text: document.querySelectorAll("#main .mk")[1].textContent,
      focused: document.activeElement === document.querySelectorAll("#main .mk")[1],
    })`));
    check(byKey.text === WAS_SHORT,
      "8o a mark is reachable and pressable by the keyboard alone: focused and pressed with"
      + " Enter, it says the file's own words");

    /* ---- 10. THE DRAWN STROKE AND THE PANEL IT RAISES (604, variant F) ---------------------
     *
     * MAXIM RULED F ON 2026-09-21 12:26, over Claudia's own recommendation of A: the mark is a
     * drawn stroke, and hovering a marked fragment raises a filled panel carrying the old
     * wording and a fast way to put it back. She answered the three things the ruling left
     * open - the keyboard, a desk with no hover, and where the panel opens - and measured the
     * one that constrains the build: a panel positioned inside the body's own scroller does not
     * float, it lengthens the scroll by 3px and its foot lands past the edge where overflow:auto
     * clips it. What this section holds is those answers, driven, and that trap held shut.
     */

    /* THE ONE HAZARD OF A DRAWN STROKE, and the only leg here that is arithmetic rather than
       behaviour: the ink is --mark's value SPELLED AGAIN inside a data URI, because no CSS
       construction lets an SVG in a url() read a custom property. So both halves are read off
       the page, in both themes, and compared. Restepping the token and forgetting the drawing
       would leave the mark a colour belonging to no theme, and nothing else in this tree - no
       gate, no census, no eye at one theme - would notice. */
    const inkOf = () => page.evaluate(() => {
      const el = document.querySelector("#main .mk");
      const cs = getComputedStyle(el);
      const img = cs.backgroundImage;
      const at = img.indexOf("stroke=");
      let rest = img.slice(at + 7);
      const quote = rest[0];
      rest = rest.slice(1);
      return {
        hex: decodeURIComponent(rest.slice(0, rest.indexOf(quote))).toLowerCase(),
        token: getComputedStyle(document.documentElement)
          .getPropertyValue("--mark").trim().toLowerCase(),
        theme: document.documentElement.getAttribute("data-theme") || "light",
        slice: cs.getPropertyValue("box-decoration-break")
          || cs.getPropertyValue("-webkit-box-decoration-break"),
        rects: el.getClientRects().length,
        size: cs.backgroundSize,
      };
    });
    /* THE OTHER THEME AND NOT "dark": the shell door's window opens dark on this desk, so a leg
       that set dark and called it the second reading would compare a theme with itself and pass
       on one hex. It is put back to whatever it was, because everything below is measured on
       the window as the person's own settings left it. */
    const ink1 = await inkOf();
    const had = await page.evaluate((other) => {
      const was = document.documentElement.getAttribute("data-theme");
      document.documentElement.setAttribute("data-theme", other);
      return was;
    }, ink1.theme === "dark" ? "light" : "dark");
    const ink2 = await inkOf();
    await page.evaluate((back) => {
      if (back) document.documentElement.setAttribute("data-theme", back);
      else document.documentElement.removeAttribute("data-theme");
    }, had);
    check(ink1.hex === ink1.token && ink2.hex === ink2.token && ink1.hex !== ink2.hex,
      "10a the drawn stroke's ink IS --mark in both themes, read off the page and compared: "
      + ink1.theme + " " + ink1.hex + "=" + ink1.token + ", "
      + ink2.theme + " " + ink2.hex + "=" + ink2.token);
    check(ink1.slice === "slice" && ink1.rects >= 2 && ink1.size === "100% 9px",
      "10b and it is ONE drawing sliced by the line breaks rather than one stamped per line: "
      + "box-decoration-break " + ink1.slice + " over " + ink1.rects
      + " client rectangles at a background-size of " + ink1.size);

    /* HOVER RAISES IT, AND IT DOES NOT LENGTHEN THE SCROLL. The second half is Claudia's own
       measurement turned into a guarantee: her panel inside the scroller grew scrollHeight by
       3px and landed 3px past the edge, so this reads the scroller before and after and holds
       the difference at nought. A panel that crept back inside #main would fail here and
       nowhere else, and on a long proposal it would be a mark near the foot losing half its
       panel - which no fixture of two marks in one short body would ever show. */
    /* Leg 8o left a mark focused and therefore its panel up, which is the behaviour and not an
       accident; the rest state this leg reads has to be a rest state. */
    await page.keyboard.press("Escape");
    await sleep(200);
    const restAt = await page.evaluate(() => ({
      hidden: document.querySelector("#mkTip").hidden,
      scrollHeight: document.querySelector("#main").scrollHeight,
    }));
    const spot = await page.evaluate(() => {
      const e = document.querySelectorAll("#main .mk")[0];
      const r = e.getClientRects();
      const last = r[r.length - 1];
      return { x: last.left + last.width / 2, y: last.top + last.height / 2 };
    });
    await page.mouse.move(spot.x, spot.y);
    await settleOn(page, '!document.querySelector("#mkTip").hidden', { bound: 30000 });
    const up = await page.evaluate(() => {
      const t = document.querySelector("#mkTip");
      const e = document.querySelectorAll("#main .mk")[0];
      const rs = Array.from(e.getClientRects());
      const last = rs[rs.length - 1];
      const tr = t.getBoundingClientRect();
      return {
        hidden: t.hidden, side: t.getAttribute("data-side"),
        insideMain: !!t.closest("#main"),
        scrollHeight: document.querySelector("#main").scrollHeight,
        top: Math.round(tr.top), bottom: Math.round(tr.bottom),
        right: Math.round(tr.right), left: Math.round(tr.left),
        runBottom: Math.round(last.bottom), runRight: Math.round(last.right),
        overRun: rs.some(r => tr.top < r.bottom && tr.bottom > r.top
                           && tr.left < r.right && tr.right > r.left),
        inWindow: tr.top >= 0 && tr.left >= 0
          && tr.bottom <= innerHeight && tr.right <= innerWidth,
        head: (document.querySelector("#mkTipK") || {}).textContent,
        was: (document.querySelector("#mkTipWas") || {}).textContent,
      };
    });
    check(restAt.hidden === true && up.hidden === false && up.insideMain === false
      && up.scrollHeight === restAt.scrollHeight,
      "10c hovering a marked fragment raises the panel, and it is a layer outside #main that"
      + " adds nothing to the body's scroll: " + restAt.scrollHeight + " before and "
      + up.scrollHeight + " after, where a panel inside the scroller grew it by 3");
    check(up.inWindow && up.side === "below" && up.top >= up.runBottom && !up.overRun,
      "10d it opens DOWNWARD from the end of the run, so the passage it explains stays readable"
      + " above it and nothing is clipped: side " + up.side + ", panel top " + up.top
      + " against the run's foot " + up.runBottom + ", over the run: " + up.overRun);
    check(up.was === WAS_LONG && /file/i.test(String(up.head)),
      "10e and it carries the file's own words for that passage, which is the whole of what a"
      + " mark is for: " + JSON.stringify(String(up.was).slice(0, 40)));

    /* THE TAB ORDER, PUT BACK BY HAND. It came free while the panel could be the DOM node after
       its mark; the fixed layer costs it, so ui/app.js rebuilds mark -> its revert -> next mark
       and this reads that order off the document with Tab's own key rather than asserting it.
       The panel's button is tabindex -1, so a walk that reached it by accident would be a walk
       through a stray at the end of the document, not through this. */
    await page.evaluate(() => document.querySelectorAll("#main .mk")[0].focus());
    await sleep(150);
    await page.keyboard.press("Tab");
    await sleep(150);
    const onPut = await page.evaluate(() => ({
      id: document.activeElement.id, tab: document.activeElement.tabIndex,
      hidden: document.querySelector("#mkTip").hidden,
      belongs: document.querySelector("#mkTipPut").getAttribute("data-i"),
    }));
    await page.keyboard.press("Tab");
    await sleep(200);
    const onNext = await page.evaluate(() => {
      const marks = Array.from(document.querySelectorAll("#main .mk"));
      return { at: marks.indexOf(document.activeElement),
        hidden: document.querySelector("#mkTip").hidden,
        ring: document.activeElement.matches(":focus-visible"),
        was: (document.querySelector("#mkTipWas") || {}).textContent };
    });
    check(onPut.id === "mkTipPut" && onPut.tab === -1 && onPut.hidden === false
      && onPut.belongs === "0",
      "10f Tab from a mark reaches ITS revert and nothing else, though the button is tabindex "
      + onPut.tab + " and no natural walk can arrive there");
    /* THE SECOND MARK ARRIVES HERE ALREADY PUT BACK, from leg 8o, so its panel carries the
       PROPOSAL's words: the panel always says what the run is not saying, and reading that here
       is the cheapest place the mirror is proved at all. */
    check(onNext.at === 1 && onNext.hidden === false && onNext.was === NOW_SHORT,
      "10g and Tab again reaches the NEXT mark, which is the order read off Claudia's drawing -"
      + " mark, its revert, next mark - rebuilt by hand (landed on mark " + onNext.at
      + ", panel says " + JSON.stringify(String(onNext.was).slice(0, 30)) + ")");
    check(onNext.ring === true,
      "10h and the focus ring is drawn AS WELL AS the panel, because a person tabbing has to see"
      + " where they are at the moment it is up (:focus-visible on the mark)");

    /* ESCAPE, AND THE KEY ON THE MARK ITSELF. The second is what makes a keyboard person never
       need to enter the panel at all, which is why Claudia called it load-bearing rather than a
       nicety once the panel had to be a fixed layer. */
    await page.keyboard.press("Escape");
    await sleep(150);
    const afterEsc = await page.evaluate(() => ({
      hidden: document.querySelector("#mkTip").hidden,
      at: Array.from(document.querySelectorAll("#main .mk")).indexOf(document.activeElement),
    }));
    check(afterEsc.hidden === true && afterEsc.at === 1,
      "10i Escape closes the panel and leaves focus on the mark (" + afterEsc.at + ")");

    await page.keyboard.press("Backspace");
    await settleOn(page, '((document.querySelectorAll("#main .mk")[1] || {}).textContent || "") === ' + JSON.stringify(NOW_SHORT), { bound: 30000 });
    const afterBack = await page.evaluate(() => {
      const marks = Array.from(document.querySelectorAll("#main .mk"));
      return { text: marks[1].textContent, off: marks[1].className.indexOf("off") >= 0,
        at: marks.indexOf(document.activeElement),
        hidden: document.querySelector("#mkTip").hidden,
        was: (document.querySelector("#mkTipWas") || {}).textContent };
    });
    check(afterBack.text === NOW_SHORT && afterBack.off === false && afterBack.at === 1,
      "10j Backspace on a focused mark is the revert, and the hand keeps its place across the"
      + " repaint that follows: focus is back on mark " + afterBack.at + " and not on the body");
    /* AND THE POINTER IS STILL PARKED ON THE OTHER MARK from leg 10c, which is the whole reason
       this leg is here: the repaint makes Chrome fire a fresh mouseover for whatever now sits
       under a pointer nobody moved, and before the keyboard hand was given the panel it jumped
       to the long passage and said its words. That failure looked exactly like the mirror being
       wrong, and it was the hover stealing the panel from the hand that was tabbing. */
    check(afterBack.hidden === false && afterBack.was === WAS_SHORT,
      "10k and the panel comes back saying the OTHER side, still belonging to the mark the"
      + " keyboard is on rather than to the one the parked pointer is over (hidden "
      + afterBack.hidden + ", panel says "
      + JSON.stringify(String(afterBack.was).slice(0, 30)) + ")");

    /* THE THIRD DESK: NO HOVER AT ALL. Claudia's answer is that the old wording is never ONLY
       in a thing that floats - every mark is also a row below the table, which is what a touch
       desk, a screen reader and a body with eleven marks in it all get. The count cell is the
       same reading as the rows, so a list that showed one of two would fail on its own head. */
    const list = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("#main .mkl"));
      const tables = document.querySelectorAll("#main table");
      const heads = tables.length
        ? Array.from(tables[tables.length - 1].querySelectorAll("th")) : [];
      return {
        rows: rows.map(r => Array.from(r.children).map(c => c.textContent)),
        count: heads.length ? heads[heads.length - 1].textContent : "",
        buttons: document.querySelectorAll('#main .pane button[data-act="rv-mark"]').length,
      };
    });
    check(list.rows.length === 2 && list.count === "2" && list.buttons === 2,
      "10l every mark is ALSO a row below the table, with the count on the head reading the"
      + " same list: " + list.rows.length + " rows, head says " + JSON.stringify(list.count));
    check(list.rows.length === 2
      && list.rows[0][1] === WAS_LONG && list.rows[0][3] === NOW_LONG
      && list.rows[1][1] === WAS_SHORT && list.rows[1][3] === NOW_SHORT,
      "10m and each row carries the file's words and the proposal's, both in full, which is what"
      + " the queue's eighty-character excerpt has nowhere to put");

    /* THE THIRD ROUTE INTO ONE ACT. The mark, the panel's button and the list's button all
       reach rv-mark, so a press here has to do exactly what a press on the mark did. */
    await press('#main button[data-act="rv-mark"][data-i="1"]', 400);
    await settleOn(page, '((document.querySelectorAll("#main .mk")[1] || {}).textContent || "") === ' + JSON.stringify(WAS_SHORT), { bound: 30000 });
    const afterList = await page.evaluate(() => {
      const marks = Array.from(document.querySelectorAll("#main .mk"));
      return { text: marks[1].textContent, off1: marks[1].className.indexOf("off") >= 0,
        text0: marks[0].textContent, off0: marks[0].className.indexOf("off") >= 0 };
    });
    check(afterList.text === WAS_SHORT && afterList.off1 === true,
      "10n the list's own button is the third route into the same act and does the same thing:"
      + " the passage says the file's words again");
    /* AND THE STATE THIS SECTION HANDS BACK, said rather than assumed: everything below lands
       the file's bytes for the short passage and the model's for the long one, so a section
       that left the presses anywhere else would make those legs pass or fail for its reasons. */
    check(afterList.off0 === false && afterList.text0 === NOW_LONG,
      "10o and the long passage is untouched by any of it, which is the state the legs below"
      + " are written against");

    /* AND NOTHING THE LIST ADDED IS TRAPPED UNDER THE CORNER. The three discs are fixed at the
       bottom right, so a control pinned there is taken by them - measured on the cards screen,
       where Delete card lost its own centre to a disc (616). This screen was clear because it
       ends in a pane whose Back and Land sit at the LEFT of their row; the list put a column of
       buttons at the RIGHT, so the question is asked again rather than assumed to have kept its
       answer. The browser is asked what is at each button's centre, not arithmetic. */
    /* THE FIRST RUN'S INVITE IS ANSWERED FIRST: the profile is fresh, so "New here?" hangs off the Menu
       button over #main's top right, and at the end of the scroll the last card's Accept and Reject sat
       under it (2026-10-07, reproduced in headless Chrome). A cover at the TOP is cleared by scrolling
       up, and it is not the corner this leg asks about. */
    await page.evaluate(() => {
      const b = document.querySelector("#tourInvite:not([hidden]) #tourNotNow");
      if (b) b.click();
    });
    await sleep(300);
    const trapped = await page.evaluate(() => {
      const main = document.querySelector("#main");
      main.scrollTop = main.scrollHeight;
      const took = [];
      /* A control scrolled up under the band is out of #main's view, not under the corner. */
      const view = main.getBoundingClientRect();
      /* ASKED AT EACH PIECE'S OWN CENTRE (getClientRects), not the bounding box's: a mark that wraps onto
         two lines has a box whose centre can land on another control beside it, a cover that is not there
         (the test architect tau's read, 2026-10-07, measured at 1340 and 1380 wide). A control is taken when
         any piece of it is. */
      document.querySelectorAll("#main button, #main [data-act]").forEach((b) => {
        for (const r of b.getClientRects()) {
          if (!r.width || !r.height) continue;
          const cy = r.top + r.height / 2;
          if (cy < view.top || cy > view.bottom) continue;
          const at = document.elementFromPoint(r.left + r.width / 2, cy);
          if (at && b !== at && !b.contains(at)) { took.push(b.textContent.slice(0, 24)); break; }
        }
      });
      /* THE CONTROL IN THE SAME BREATH: what the browser answers at a disc's OWN centre. A
         probe that could not see the corner at all would report nothing taken however badly the
         screen behaved, which is a leg with no teeth reading as a pass. */
      const disc = document.querySelector("#discNew").getBoundingClientRect();
      const over = document.elementFromPoint(disc.left + disc.width / 2,
                                             disc.top + disc.height / 2);
      /* Up from whatever is topmost, because a disc's glyph is an inline SVG and the point lands
         on a <path> that carries no id of its own. */
      const owner = over && over.closest ? over.closest("[id]") : null;
      return { took, sees: owner ? owner.id : "" };
    });
    check(trapped.took.length === 0 && trapped.sees === "discNew",
      "10p and at the end of the scroll nothing the list added is taken by the fixed corner,"
      + " asked of the browser at each control's own centre - and the same question at a disc's"
      + " own centre answers " + JSON.stringify(trapped.sees) + ", so the probe can see a cover"
      + (trapped.took.length ? ": " + JSON.stringify(trapped.took) : ""));

    /* ---- and what lands ---------------------------------------------------------------- */

    /* THE PRESSES ARE WRITTEN AS THE VIEW IS LEFT (rvFlush), here by its one line to the stack, and the row is accepted
       there (board 1016 item 7: it was the row's Accept and the table's Land). */
    const rowKey = penQ.changes.find(c => c.id === PEN_CARD).key;
    await stackDecide(page, press, "from-text", { [rowKey]: "accept" }, WHO);
  } finally {
    await pen2.shut();
  }
  await sleep(400);

  const landedPen = readJson(path.join(penScreenDir, DRAFT_FILE));
  const landedBody = (landedPen.cards.find(c => c.id === PEN_CARD) || {}).body || {};
  check(landedBody.en && landedBody.en.indexOf(WAS_SHORT) >= 0
    && landedBody.en.indexOf(NOW_SHORT) < 0,
    "8p THE WHOLE ROAD: a row accepted after its passage was pressed lands the FILE'S OWN"
    + " BYTES in the working copy, not the model's");
  check(landedBody.en.indexOf(NOW_LONG) >= 0 && landedBody.en !== SOURCE,
    "8q and the control: the passage nobody pressed landed as the model proposed it, so the"
    + " press put back one passage rather than the card");
  check(landedBody.en === readJson(path.join(penScreenDir, INBOX, "from-text.ec"))
      .cards.find(c => c.id === PEN_CARD).body.en,
    "8r and the proposal in the inbox says exactly what landed, which is what makes the queue"
    + " offer what a person chose rather than what a model wrote");

  /* ---- 11. A SPLICED BODY IS SAID ON ITS ROW (sense pass item 22) ------------------------
   *
   * Two sentences from two places in the file, each sourced and so each let through, make a body
   * that is in the file nowhere. The importer counted it and named no card; the report now lists
   * it and the queue says it on the row. The proposal is written by the importer itself from a
   * stub answer, so the leg holds the whole road rather than a hand-built report.
   */
  const SPL_A = "Grelud plasib ondrork norvira.";
  const SPL_B = "Widesk brumor ustave zubalt thelork.";
  const SPL_C = "Sarnux ondrek glemira plasule.";
  const SPL_SOURCE = SPL_A + "\n\n" + SPL_B + "\n\n" + SPL_C + "\n";
  const splAnswer = JSON.stringify({ cards: [
    { title: { en: "Grelud joined" }, bodies: [{ lang: "en", spans: [{ text: SPL_A + "\n" },
      { text: SPL_C }] }] },
    { title: { en: "Widesk whole" }, bodies: [{ lang: "en", spans: [{ text: SPL_B }] }] },
  ] });
  const splOut = await importText({ text: SPL_SOURCE, join: false, placeholders: false,
    ask: async () => ({ ok: true, text: splAnswer, model: "stub" }),
    id: "spliced-replies", name: "spliced replies" });
  const splCard = splOut.catalog.cards.find(c => c.title.en === "Grelud joined");
  const wholeCard = splOut.catalog.cards.find(c => c.title.en === "Widesk whole");
  check(splOut.report.counts.spliced === 1 && splOut.report.splices.length === 1
    && splOut.report.splices[0].card === splCard.id && splOut.report.splices[0].lang === "en",
    "11a the importer names the spliced body in its report, card and language, and only it: "
    + JSON.stringify(splOut.report.splices));

  const splDir = path.join(projects, "the-splice");
  fs.mkdirSync(path.join(splDir, INBOX), { recursive: true });
  fs.writeFileSync(path.join(splDir, DRAFT_FILE), json(head), "utf8");
  fs.writeFileSync(path.join(splDir, PROJECT_FILE), json({ id: head.id, name: "Splice", rev: 0,
    edition: "", draft: DRAFT_FILE, folder: null }), "utf8");
  const splAt = writeTextImport(path.join(splDir, INBOX), "joined.ec", splOut.catalog,
    splOut.report).at;
  const splQ = await openProposal(splDir, splAt);
  const splRow = splQ.changes.find(c => c.id === splCard.id);
  const wholeRow = splQ.changes.find(c => c.id === wholeCard.id);
  check(JSON.stringify(splRow && splRow.spliced) === '["en"]',
    "11b the row of the spliced card carries the language it is spliced in: "
    + JSON.stringify(splRow && splRow.spliced));
  check(!!wholeRow && wholeRow.spliced === null,
    "11c AND THE CONTROL: a card whose body is one passage of the file carries nothing");

  const spl2 = await openStudio("tests/review-screen.mjs splice", { words: true,
    projects, userDataDir: path.join(SCRATCH, "ud-splice"),
  });
  try {
    const page = spl2.page;
    await pressWhen(page, '#rail [data-act="home"][data-v="library"]', { who: "tests/review-screen.mjs" });
    await pressWhen(page, '[data-act="open"]', { who: "tests/review-screen.mjs", attr: ["data-dir", splDir] });
    await sleep(700);
    await pressWhen(page, '[data-act="section"][data-v="proposals"]', { who: "tests/review-screen.mjs" });
    await sleep(1200);
    await pressWhen(page, '[data-act="stk-src"][data-file*="joined"]', { who: "tests/review-screen.mjs" });
    await settleOn(page, 'document.querySelectorAll("#main [data-splice]").length > 0', { bound: 30000 });
    const said = await page.evaluate((ids) => ids.map((id) => {
      const k = Array.from(document.querySelectorAll("#main table.rvq tr .rvwhat .mono"))
        .find(b => b.textContent.indexOf(id) >= 0);
      const row = k ? k.closest("tr") : null;
      return row ? Array.from(row.querySelectorAll("[data-splice]")).map(e => e.textContent) : null;
    }), [splCard.id, wholeCard.id]);
    check(JSON.stringify(said[0]) === '["EN: joined from separate passages"]',
      "11d the queue says it on the spliced card's row, in the reviewer's sight: "
      + JSON.stringify(said[0]));
    check(JSON.stringify(said[1]) === "[]",
      "11e and the whole card's row says nothing of the kind: " + JSON.stringify(said[1]));
  } finally {
    await spl2.shut();
  }

  /* ---- 13. A CUT MADE BLIND IS SAID ON THE CARDS EITHER SIDE (board 770) --------------------
   *
   * A piece refused twice is cut blind, and the cards beside the stretch nobody read may be cut
   * short or begin halfway. The importer names them and the queue says it on their rows.
   */
  const UNR_WORDS = ["velund", "ondrask", "plimour", "tavesk", "brunel", "quisat", "morvane",
    "selduk", "arvin", "tolep", "gaskor", "imrelle"];
  const UNR_REPLIES = Array.from({ length: 12 }, (_, n) => "Reply " + (n + 1) + ". "
    + Array.from({ length: 30 }, (_, k) => UNR_WORDS[(n * 7 + k * 5) % UNR_WORDS.length]).join(" ")
    + ".");
  const UNR_SOURCE = UNR_REPLIES.join("\n\n") + "\n";
  let unrFirst = -1;
  const unrOut = await importText({ text: UNR_SOURCE, join: false, placeholders: false,
    chunkChars: 1000, id: "unread-replies", name: "unread replies",
    ask: async (q) => {
      const at = UNR_SOURCE.indexOf(q.body);
      if (at > 0 && unrFirst < 0) unrFirst = at;
      if (at === unrFirst) return { ok: false, refusal: "the stub refused this piece" };
      const cards = UNR_REPLIES.filter(r => q.body.indexOf(r) >= 0).map(r => ({
        title: { en: r.slice(0, 8) }, bodies: [{ lang: "en", spans: [{ text: r }] }] }));
      return { ok: true, text: JSON.stringify({ cards }), model: "stub" };
    } });
  const unr = (unrOut.report.unread || [])[0] || {};
  const unrOther = unrOut.catalog.cards.find(c => c.id !== unr.before && c.id !== unr.after);
  check(unrOut.report.unread.length === 1 && !!unr.before && !!unr.after && !!unrOther,
    "13a the importer names the cards either side of the stretch it could not read: "
    + JSON.stringify(unrOut.report.unread));

  const unrDir = path.join(projects, "the-unread");
  fs.mkdirSync(path.join(unrDir, INBOX), { recursive: true });
  fs.writeFileSync(path.join(unrDir, DRAFT_FILE), json(head), "utf8");
  fs.writeFileSync(path.join(unrDir, PROJECT_FILE), json({ id: head.id, name: "Unread", rev: 0,
    edition: "", draft: DRAFT_FILE, folder: null }), "utf8");
  const unrAt = writeTextImport(path.join(unrDir, INBOX), "unread.ec", unrOut.catalog,
    unrOut.report).at;
  const unrQ = await openProposal(unrDir, unrAt);
  const unrRow = id => unrQ.changes.find(c => c.id === id);
  check(JSON.stringify(unrRow(unr.before) && unrRow(unr.before).unread) === '["end"]'
        && JSON.stringify(unrRow(unr.after) && unrRow(unr.after).unread) === '["start"]'
        && !!unrRow(unrOther.id) && unrRow(unrOther.id).unread === null,
    "13b the row before carries its ending, the row after its opening, and another row nothing");

  const unr2 = await openStudio("tests/review-screen.mjs unread", { words: true,
    projects, userDataDir: path.join(SCRATCH, "ud-unread"),
  });
  try {
    const page = unr2.page;
    await pressWhen(page, '#rail [data-act="home"][data-v="library"]', { who: "tests/review-screen.mjs" });
    await pressWhen(page, '[data-act="open"]', { who: "tests/review-screen.mjs", attr: ["data-dir", unrDir] });
    await sleep(700);
    await pressWhen(page, '[data-act="section"][data-v="proposals"]', { who: "tests/review-screen.mjs" });
    await sleep(1200);
    await pressWhen(page, '[data-act="stk-src"][data-file*="unread"]', { who: "tests/review-screen.mjs" });
    await settleOn(page, 'document.querySelectorAll("#main [data-unread]").length > 0', { bound: 30000 });
    const said = await page.evaluate((ids) => ids.map((id) => {
      const k = Array.from(document.querySelectorAll("#main table.rvq tr .rvwhat .mono"))
        .find(b => b.textContent.indexOf(id) >= 0);
      const row = k ? k.closest("tr") : null;
      return row ? Array.from(row.querySelectorAll("[data-unread]")).map(e => e.textContent) : null;
    }), [unr.before, unr.after, unrOther.id]);
    check(JSON.stringify(said[0]) === '["Check its ending: the text after it went unread"]'
          && JSON.stringify(said[1]) === '["Check its opening: the text before it went unread"]',
      "13c the queue says it on both rows, in the reviewer's sight: " + JSON.stringify(said));
    check(JSON.stringify(said[2]) === "[]",
      "13d and a card away from the cut says nothing of the kind: " + JSON.stringify(said[2]));
  } finally {
    await unr2.shut();
  }

  if (!keep) dropScratch(SCRATCH, "review-screen");
  process.stdout.write("review-screen  " + asserted + " assertion(s), " + failed
    + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("review-screen  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
