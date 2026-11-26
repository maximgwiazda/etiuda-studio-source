/* A SCREEN TURNS WHOLLY POLISH, AND NOTHING IS LEFT BEHIND IN ENGLISH. Item 463's leg, and
 * board 468's since 2026-09-18.
 *
 *     node tests/polish.mjs [--keep]
 *
 * THE CLAIM IS ABOUT THE SCREEN, SO IT IS MEASURED ON THE SCREEN. Every section of the authoring
 * window is visited in a real Electron window opened in Polish, every text node and every
 * placeholder it paints is collected, and the English table is then held against what was
 * collected: an English key that still appears anywhere is a string some path did not route
 * through T(). Reading ui/app.js for T( calls would prove that the calls exist and not that the
 * screens use them, and half the strings on this interface are built in one function and painted
 * by another.
 *
 * THE CONTROL IS THE SAME WALK IN ENGLISH. A check that looks for English and finds none passes
 * just as well against a window that painted nothing at all, so the same screens are walked a
 * second time with the language left alone, and the English the first walk must not contain is
 * the English the second walk must.
 *
 * THE SOURCE SCAN IS THE SECOND HALF, and it catches what a walk cannot: a string on a path this
 * leg never drove. Every literal ui/app.js hands to T() or C() is asserted to be a key of the
 * table or a member of the table's own NO_TWIN list, which is what `ready()` answers from - so a
 * screen that grows an untranslated word either translates it or admits it, and the interface
 * stays English while any such word stands.
 *
 * SECTION 6 IS THE PER-SCREEN RULE ITSELF, and it is a different measurement from the four
 * above it. They drive a FORCED window, where every screen is Polish by construction, so they
 * can prove that nothing is left in English and cannot prove that anything is left in English on
 * purpose. Section 6 opens a plain window, turns it Polish through the Settings cover as a
 * person would, and reads each screen in its own region: a screen whose list is empty must carry
 * Polish and no English, and a screen with a word missing must carry English and no Polish. The
 * expectation per screen is taken from the table rather than written out here, so the day
 * Claudette's words land and a screen changes sides this leg follows it.
 *
 * WHY NOT COMPARE THE TABLE WITH THE COPYWRITER'S SHEET. Her file is in the office repository and
 * this one may not reach into it; and a word is prose, which Maxim reads. What a test can hold is
 * the mechanism: that every string goes through the table, that the counted nouns inflect by the
 * engine's rule, and that nothing English survives on a Polish screen.
 */
/* Every publish here finds the licence a paying lead holds (tests/licensed-env.mjs): since S-1b a Studio with none publishes nothing,
   which is what this leg met as "this Studio holds no licence it can use" (the test architect, 2026-11-21). */
import "./licensed-env.mjs";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { openStudio } from "./shell-door.mjs";
import * as Engine from "../src/engine.mjs";
import { importCsv } from "../src/import.mjs";
import { json, PROJECT_FILE, DRAFT_FILE } from "../src/publish.mjs";
import { INBOX } from "../src/studio.mjs";
/* THE TWO STATEMENTS THE AUDIT PACK'S SCREEN PAINTS FROM VALUES RATHER THAN FROM
   LITERALS, imported so that 5b asks about the sentences those files actually write. A
   copy of them typed here would go stale the day either is reworded, and 5b would then
   pass about a sentence no screen paints. */
import { ACCOUNT_STATEMENT } from "../src/review.mjs";
import { LIMITS } from "../src/audit.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { pressWhen, settleOn } from "./press.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "polish");

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

function pile(name, seed, rows, faults) {
  const out = path.join(SCRATCH, "piles", name);
  const r = spawnSync(process.execPath, ["tools/fixtures/generate.mjs", "--seed", String(seed),
    "--rows", String(rows), "--out", out].concat((faults || []).map(f => "--" + f)),
    { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) throw new Error("the generator refused: " + (r.stderr || r.stdout));
  return path.join(out, "macros.csv");
}

async function plant(root, folder, csv, id, name) {
  const dir = path.join(root, folder);
  fs.mkdirSync(dir, { recursive: true });
  const made = await importCsv({ file: csv, id, name });
  fs.writeFileSync(path.join(dir, DRAFT_FILE), json(made.catalog), "utf8");
  fs.writeFileSync(path.join(dir, PROJECT_FILE),
    json({ id: made.catalog.id, name, rev: 0, edition: "", draft: DRAFT_FILE, folder: null }),
    "utf8");
  return dir;
}

/* TWO PROPOSALS IN ONE INBOX, BECAUSE THE QUEUE SAYS DIFFERENT THINGS ABOUT THE TWO KINDS AND
   BOTH ARE PAINTED AT THE HEAD OF THE SAME SCREEN (board 539's tail). One file is this
   project's own catalog come back from a desk, a revision behind the working copy; the other is
   another catalog's, and carries no export marker. Between them they paint four of the five
   notes checkOrigin builds, which until this walk existed were English strings on a Polish
   screen and no gate could see it. NOTHING IS DECIDED AND NOTHING IS LANDED here, so both
   language walks read the same two files and neither writes a byte. */
async function plantProposals(dir, F) {
  const head = JSON.parse(fs.readFileSync(path.join(dir, DRAFT_FILE), "utf8"));
  const inbox = path.join(dir, INBOX);
  fs.mkdirSync(inbox, { recursive: true });

  /* FROM A DESK: the same catalog, one body edited, made against the revision before this one.
     No `modified: true`, so the queue also says it was not written by an engine export. */
  const own = JSON.parse(JSON.stringify(head));
  own.rev = 0;
  const body = own.cards[0].body;
  Object.keys(body).forEach(k => { body[k] = String(body[k]) + " Wretilo."; });
  delete own.hash; own.hash = F.contentHash(own);
  fs.writeFileSync(path.join(inbox, "from-a-desk.ec"), json(own), "utf8");

  /* ANOTHER CATALOG: a different id, two cards this project has never seen, and one of its own
     left out - which a foreign file may not propose to remove, and the note says so. */
  const stranger = JSON.parse(JSON.stringify(head));
  stranger.id = "some-other-pile";
  stranger.name = "Another pile";
  stranger.cards = stranger.cards.slice(0, 3).concat([1, 2].map(n => ({
    id: "c-coming-in-" + n, shelf: head.cards[0].shelf,
    title: { en: "Thelork ustuma " + n, pl: "Thelork ustuma " + n },
    body: { en: "Widesk dovib glemira norvil.", pl: "Widesk dovib glemira norvil." },
    bodyShape: "plain" })));
  delete stranger.hash; stranger.hash = F.contentHash(stranger);
  fs.writeFileSync(path.join(inbox, "stranger.ec"), json(stranger), "utf8");
}

/* ---- the walk -------------------------------------------------------------------------------
 *
 * One function, run in the page, that empties a screen of everything a reader can read: the text
 * nodes, and the placeholders, which are text a reader reads and an attribute a text walk cannot
 * see. Collected per screen so that a failure names the screen it was on.
 */
const COLLECT = `(() => {
  const nodes = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let t;
  while ((t = w.nextNode())) {
    if (t.parentNode && t.parentNode.closest("#scrim[hidden]")) continue;
    const v = String(t.nodeValue).replace(/\\s+/g, " ").trim();
    if (v) nodes.push(v);
  }
  const attrs = Array.from(document.querySelectorAll("[placeholder]"))
    .map(e => e.getAttribute("placeholder")).filter(Boolean);
  /* The same text as a reader's line holds it, for section 8: each block's inline text joined
     and its spaces left as they are, since a no-break space is what that section looks for. */
  const blocks = new Map();
  const w2 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while ((t = w2.nextNode())) {
    if (t.parentNode && t.parentNode.closest("#scrim[hidden]")) continue;
    let b = t.parentElement;
    while (b && b !== document.body && getComputedStyle(b).display === "inline") b = b.parentElement;
    blocks.set(b, (blocks.get(b) || "") + t.nodeValue);
  }
  const runs = Array.from(blocks.values()).filter(v => v.trim());
  return JSON.stringify({ nodes: nodes, attrs: attrs, runs: runs });
})()`;

/* THE ROW IS OPENED FROM THE LIBRARY (board 982 E, 2026-11-11): Overview shows a catalog only once it has been opened, as one
   of its four recent cards, so a project this leg planted and never opened has its Open in the Library alone. The home tab
   first, from wherever the window stands, then the rail's Library, then the row by its folder. `seen`, where given, is handed
   what the Library painted once its Draft and Checks cells have filled in, as the screen "library": the table that was the
   projects screen's until board 982 E, with the built sentences 4f looks for. */
async function openFromLibrary(page, projectDir, seen) {
  await pressWhen(page, '#tabs [data-act="to-projects"]', { who: "tests/polish.mjs" });
  await settleOn(page, '(window.STUDIO_READY || {}).screen === "projects"', { bound: 30000 });
  await pressWhen(page, '#rail [data-act="home"][data-v="library"]', { who: "tests/polish.mjs" });
  await settleOn(page, 'document.querySelectorAll("#main tr[data-dir]").length > 0', { bound: 30000 });
  if (seen) {
    await settleOn(page, 'Array.from(document.querySelectorAll("#main tr[data-dir]")).every((tr) => !!tr.querySelector("[data-col=checks] .st-cell"))', { bound: 30000 });
    seen.library = JSON.parse(await page.evaluate(COLLECT));
  }
  await pressWhen(page, '[data-act="open"]', { who: "tests/polish.mjs", attr: ["data-dir", projectDir] });
}

/** Walk every section and both covers of one window, and hand back what each painted. */
async function walkEverything(page, projectDir) {
  const seen = {};
  const press = async (sel, ms) => {
    await pressWhen(page, sel, { who: "tests/polish.mjs" });
    await sleep(ms || 260);
  };
  const grab = async (name) => {
    seen[name] = JSON.parse(await page.evaluate(COLLECT));
  };

  await grab("projects");
  /* New catalog is a page in its own tab since board 1019 (12); the walk keeps the name it had as a cover. */
  await press('[data-act="new-tab"]', 350);
  await settleOn(page, '!!document.querySelector("#main .newcat")', { bound: 30000 });
  await grab("cover-new");
  await press('#main .newcat [data-act="close-screen"][data-v="new"]', 300);

  await openFromLibrary(page, projectDir, seen);
  await sleep(700);
  await grab("cards");

  /* One card picked, which is the only way the editor's own labels are painted, and one edit
     typed, which is the only way the Last edit column has anything in it to read. */
  await press("#main tr.pick", 350);
  await settleOn(page, '!!document.querySelector("#main tr.pick.sel") || !!document.querySelector(\'[data-f="title"]\')', { bound: 30000 });
  await grab("editor");
  await page.evaluate(() => {
    const e = document.querySelector('[data-f="title"]');
    e.value = e.value + "x";
    e.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await sleep(900);
  await grab("cards-edited");

  /* The cover that makes a card, which is the only way its two labels are painted. The
     upgrade cover is not here: it needs a format 1 file planted for the picker, and every word
     on it is a declared NO_TWIN rather than a pair this walk could catch in English. */
  await press('[data-act="card-new"]', 350);
  await settleOn(page, '!document.querySelector("#scrim").hidden', { bound: 30000 });
  await grab("cover-card");
  await press('[data-act="cover-close"]', 300);

  for (const s of ["intents", "categories", "lint", "archive", "import", "proposals",
                   "facts", "audit", "settings"]) {
    if (s === "audit") {
      await press('[data-act="section"][data-v="archive"]', 300);
      await settleOn(page, '(window.STUDIO_READY || {}).screen === "archive"', { bound: 30000 });
      await press('[data-act="arch-audit"]', 700);
      await settleOn(page, '(window.STUDIO_READY || {}).screen === "audit"', { bound: 30000 });
      await grab(s);
      continue;
    }
    await press('[data-act="section"][data-v="' + s + '"]',
      (s === "proposals") ? 700 : 300);
    await settleOn(page, '(window.STUDIO_READY || {}).screen === "' + s + '"', { bound: 30000 });
    await grab(s);
    /* THE QUEUE IS TWO SCREENS AND THE LIST IS THE ONE THAT WAS WALKED. The notes at the head
       of an open proposal are painted nowhere else, so a walk that stopped at the list said
       nothing about the four lines a person actually reads before deciding anything. The
       foreign file first, then this project's own one press later, which is the control: if
       only the note somebody happened to fix were Polish, the second screen would show it. */
    /* THE SECTION OPENS ON THE STACK since the review door's stage 3 (ed62ab8d, 2026-11-15), not on the list of files, so a
       file is opened from a card's source, the name of the file it came from (ui/app.js stk-src, which opens it as the list's
       Open did), and Back comes back to the stack. */
    if (s === "proposals") {
      await press('[data-act="stk-src"][data-file*="stranger"]', 800);
      await settleOn(page, '!!document.querySelector("#main [data-act=\\"rv-back\\"]")', { bound: 30000 });
      await grab("queue-foreign");
      await press('[data-act="rv-back"]', 400);
      await press('[data-act="stk-src"][data-file*="from-a-desk"]', 800);
      await settleOn(page, '!!document.querySelector("#main [data-act=\\"rv-back\\"]")', { bound: 30000 });
      await grab("queue-own");
      await press('[data-act="rv-back"]', 400);
    }
    /* THE PROJECT'S SETTINGS ARE TWO SCREENS TOO (board 579): the section, and the cover that
       declares a language, whose two labels are painted nowhere else. The removal's warning is
       NOT opened here - it is a block on the section rather than a screen of its own, and
       pressing Remove on a walk would leave a confirmation standing over every later press. */
    if (s === "settings") {
      await press('[data-act="lang-new"]', 400);
      await settleOn(page, '!document.querySelector("#scrim").hidden', { bound: 30000 });
      await grab("cover-lang");
      await press('[data-act="cover-close"]', 300);
    }
  }

  await press('[data-act="publish"]', 800);
  await settleOn(page, '!document.querySelector("#scrim").hidden', { bound: 30000 });
  await grab("cover-publish");
  await press('[data-act="cover-close"]', 300);

  return seen;
}

/* THE WIZARD'S THREE COVERS, WALKED IN A WINDOW OF THEIR OWN. Claudette's second pass put 44 of
   its 66 new pairs on this one screen and no walk painted it before 2026-09-18, so the words
   were declared and never read. It cannot join the walk above: the Import rail row IS the
   picker, so a window that answers the picker never paints the affordance the walk grabs as
   `import`, and the rail is the wizard's while the wizard is up, which leaves the loop's next
   press with nothing to click. Hence a second window per language, each with its own pile and
   its own project to land in - a landing writes a NEW project folder and refuses one already
   there, so the Polish walk and the English control may not share either. */
async function walkWizard(page, projectDir) {
  const seen = {};
  const press = async (sel, ms) => {
    await pressWhen(page, sel, { who: "tests/polish.mjs" });
    await sleep(ms || 400);
  };
  const grab = async (name) => { seen[name] = JSON.parse(await page.evaluate(COLLECT)); };

  await openFromLibrary(page, projectDir);
  await sleep(700);
  /* The chrome row opens the paste door. Choose a file is the pick the window answers. */
  await press('[data-act="import"]', 400);
  await press('[data-act="wiz-pick"]', 1800);
  await settleOn(page, '!!document.querySelector(\'[data-act="wiz-into"]\')', { bound: 30000 });
  await grab("wizard-columns");
  /* AS A NEW PROJECT, SAID OUT LOUD (board 539). Since the first step offers the choice and
     opens on "into this project", the walk has to answer it to reach a third cover at all: the
     other answer ends at the review queue and writes no draft. Pressing it also puts both words
     of the new control through the language walk, which is what this gate is for. */
  await press('[data-act="wiz-into"][data-v="new"]', 500);
  await settleOn(page, '!!document.querySelector(\'[data-act="wiz-next"]\')', { bound: 30000 });
  await grab("wizard-columns");
  await press('[data-act="wiz-next"]', 700);
  await settleOn(page, '!!document.querySelector(\'[data-act="wiz-land"]\')', { bound: 30000 });
  await grab("wizard-look");
  await press('[data-act="wiz-land"]', 2000);
  await settleOn(page, '(window.STUDIO_READY || {}).screen === "cards"', { bound: 30000 });
  await grab("wizard-landed");
  return seen;
}

/* ONE WINDOW IN ONE LANGUAGE. A null STUDIO_LANG is a REMOVAL rather than an empty string,
   which is what leg 3a asks about: what a desk with nothing set does can only be read off a
   launch that certainly has nothing set, and the door removes every STUDIO_ variable the
   call does not name. */
async function open(projects, lang, file, ud) {
  return openStudio("tests/polish.mjs", {
    projects, userDataDir: path.join(SCRATCH, "ud-" + (ud || lang || "en")),
    env: { STUDIO_LANG: lang || null, STUDIO_TEST_FILE: file || null },
  });
}

/* ---- the source scan -------------------------------------------------------------------------
 *
 * Every literal ui/app.js hands to T() or C(), matched over the source. A call whose argument is
 * not a literal would be missed, so the scan also refuses one: `T(` followed by anything but a
 * quote is a string this file cannot see and therefore a string the table cannot be held to.
 */
function callsIn(src, verb) {
  const out = [];
  /* The name, not preceded by anything a name can be made of, and its open bracket. A
     character class rather than a word boundary, so that no backslash has to survive
     being written into this file. */
  const re = new RegExp("[^A-Za-z0-9_$.]" + verb + "[(]", "g");
  let m;
  while ((m = re.exec(src))) {
    let i = m.index + m[0].length, depth = 1, q = null, arg = "";
    const args = [];
    while (i < src.length && depth > 0) {
      const ch = src[i];
      if (q) {
        if (ch === "\\\\") { arg += ch + src[i + 1]; i += 2; continue; }
        if (ch === q) q = null;
        arg += ch; i++; continue;
      }
      if (ch === '"' || ch === "'") { q = ch; arg += ch; i++; continue; }
      if (ch === "(" || ch === "[" || ch === "{") depth++;
      else if (ch === ")" || ch === "]" || ch === "}") depth--;
      if (depth === 0) break;
      if (ch === "," && depth === 1) { args.push(arg); arg = ""; i++; continue; }
      arg += ch; i++;
    }
    args.push(arg);
    out.push(args);
  }
  return out;
}

/* A KEY MAY BE BUILT BY CONCATENATION, because a sentence longer than the line is written in
   two halves, and the halves are joined here exactly as the parser joins them. An argument
   holding no literal at all is an INDIRECT key - the word comes from a list - and those are
   named rather than counted, because there are three and each list is checked below. */
function literalsOf(whole) {
  /* A COMMENT IS NOT A CALL. ui/app.js explains C(n, one, many) in prose above the line
     that binds it, and a scan that reads prose reported "one" and "many" as two untranslated
     keys. Block comments come out before anything is counted. */
  const src = whole.replace(/[/][*][^]*?[*][/]/g, " ");
  const out = { strings: [], indirect: [] };
  const join = (arg) => {
    const found = String(arg).match(/"((?:[^"\\]|\\.)*)"/g);
    return found ? found.map(q => JSON.parse(q)).join("") : null;
  };
  callsIn(src, "T").forEach(args => {
    const k = join(args[0]);
    if (k === null) out.indirect.push(String(args[0]).trim()); else out.strings.push(k);
  });
  callsIn(src, "C").forEach(args => {
    [args[1], args[2]].forEach(a => {
      const k = a == null ? null : join(a);
      if (k === null) out.indirect.push(String(a).trim()); else out.strings.push(k);
    });
  });
  return out;
}


/* ---- the refusal frames the node half builds -------------------------------------------------
 *
 * Read as TEXT, like the table itself and for the same reason: a second implementation of the
 * question. What is wanted is the FIRST argument of refuse(), refusalOf() or noted(), which is
 * either a string, several strings joined by +, a ternary of two of those, or the name of a
 * const holding one. A string that is part of a COMPARISON inside that ternary - kind === "shelf"
 * ? a : b - is not a frame, and is skipped by looking back at the character before it.
 *
 * THE BACKSLASH AND THE QUOTE ARE BUILT, NEVER TYPED, here as everywhere in this repository: a
 * scanner of string literals written with string literals is where an escape level goes missing.
 */
const QUOTE = String.fromCharCode(34);
const BACK = String.fromCharCode(92);
/* BUILT INSIDE framesIn AND NOT HERE. It is a /g regex and this function recurses into itself
   for a named frame; one shared regex has one lastIndex, so the recursion reset the outer
   walk's cursor to nought and the scan ran until the heap gave out (measured 2026-09-18). */
/* noteOf SINCE 539's TAIL: the review queue's notes are not refusals - nothing is stopped -
   and they are painted on the same screens and have to be in the table for the same reason. */
const CALL_SRC = "(?:refuse|refusalOf|noteOf|noted)[ ]*[(]";
const NAMED = new RegExp("^[A-Z][A-Z0-9_]*$");
const WORDCH = new RegExp("[A-Za-z0-9_$]");

/* THE TEXT OF `const NAME = ...;`, up to the semicolon that ENDS it: a semicolon inside a string is
   part of the frame (the sheet's three refusals in src/studio.mjs say "...has none; every sheet..."),
   and a cut at the first one read half a sentence that no pair of the table answers. */
function constText(src, name) {
  const m = new RegExp("const[ ]+" + name + "[ ]*=").exec(src);
  if (!m) return null;
  const from = m.index + m[0].length;
  let q = false, i = from;
  for (; i < src.length; i++) {
    const c = src[i];
    if (q) { if (c === BACK) i++; else if (c === QUOTE) q = false; continue; }
    if (c === QUOTE) q = true;
    else if (c === ";") break;
  }
  return src.slice(from, i);
}

function framesIn(src) {
  const out = [];
  const CALL = new RegExp(CALL_SRC, "g");
  let m;
  while ((m = CALL.exec(src))) {
    const before = src.charAt(m.index - 1);
    if (before && WORDCH.test(before)) continue;      /* part of a longer name */
    let i = m.index + m[0].length, depth = 0, cur = null, join = false;
    /* WHICH OPEN BRACKETS ARE CALLS. A literal handed to a call that sits inside the frame - licenceSaid("untrusted"),
       whose argument is the reason a table is keyed by - is that call's argument and not the frame, and was read as
       one (shell/main.js, 2026-10-29). A bracket is a call's when a name stands against it; the licence's own
       sentences are read out of their table where section 7 adds them. */
    const calls = [];
    for (; i < src.length; i++) {
      const c = src[i];
      if (c === "(") { calls.push(WORDCH.test(src.charAt(i - 1))); depth++; continue; }
      if (c === ")") { if (depth === 0) break; depth--; calls.pop(); continue; }
      if (c === "," && depth === 0) break;
      if (c === QUOTE) {
        let j = i + 1, v = "";
        for (; j < src.length; j++) {
          if (src[j] === BACK) { v += JSON.parse(QUOTE + src.slice(j, j + 2) + QUOTE); j++; continue; }
          if (src[j] === QUOTE) break;
          v += src[j];
        }
        const prev = src.slice(0, i).replace(/[\s]+$/, "").slice(-1);
        if (prev !== "=" && prev !== "!" && !(calls.length && calls[calls.length - 1])) {
          if (join && cur !== null) cur += v; else { if (cur !== null) out.push(cur); cur = v; }
        }
        join = false;
        i = j;
        continue;
      }
      if (c === "+") { join = true; continue; }
      if (/[\s]/.test(c)) continue;
      let j = i, name = "";
      while (j < src.length && WORDCH.test(src[j])) { name += src[j]; j++; }
      if (name && NAMED.test(name)) {
        const d = constText(src, name);
        if (d !== null) framesIn("refuse(" + d + ")").forEach(f => out.push(f));
        i = j - 1;
      }
      join = false;
    }
    if (cur !== null) out.push(cur);
  }
  return out;
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

const SCREEN_KEYS = ["chrome","projects","paths","cards","tags","lint","facts","import","archive","stats","queue","wizard","publish","new","tag","card","upgrade","settings","about","audit","langs","tour","desks","team","key","variables","changes"];
function screensHeld(plScreens, enScreens) {
  const missing = missingMembers(plScreens, SCREEN_KEYS, true);
  const untranslated = (enScreens || []).map(s => String(s));
  if ((plScreens || []).length < SCREEN_KEYS.length) missing.push("screens under " + SCREEN_KEYS.length);
  return { ok: missing.length === 0 && untranslated.length === 0, missing, untranslated };
}
const FEW_KEYS = ["{N} days ago","{N} weeks ago","{N} months ago","{N} years ago","{N} revs","{N} files","{N} cards","{N} places","{N} cards ticked","{N} findings","{N} errors","{N} warnings","{N} suggestions","{N} rows","{N} columns","{N} uses","{N} categories","{N} intents","{N} changes","{N} problems","{N} unexpected differences","{N} pairs","{N} cells","{N} times","{N} more cards","{N} asks","{N} characters","{N} editions kept","{N} new cards","{N} labels","{N} removals","{N} catalog fields","{N} fields","{N} names","{N} more paths on the map","{N} findings","{N} kinds","{N} words","{N} cards changed","{N} cards retired","{N} cards as in rev {REV}","{N} cards go out in rev {REV}","{N} cards, every one new","{N} teammates admitted read this folder.","{N} teammates","{N} more are named and not admitted yet."];
function fewFormsHeld(few, plainLen) {
  const missing = missingMembers(few, FEW_KEYS, false);
  if ((few || []).length < FEW_KEYS.length) missing.push("few-forms under " + FEW_KEYS.length);
  if (!(plainLen > 100)) missing.push("pairs at or under 100");
  return { ok: missing.length === 0, missing };
}
const WALK_SCREENS = ["projects","cover-new","library","cards","editor","cards-edited","cover-card","intents","categories","lint","archive","import","proposals","queue-foreign","queue-own","facts","audit","settings","cover-lang","cover-publish"];
function walkHeld(names) {
  const missing = missingMembers(names, WALK_SCREENS, true);
  if ((names || []).length < WALK_SCREENS.length) missing.push("screens under " + WALK_SCREENS.length);
  return { ok: missing.length === 0, missing };
}
const WIZARD_KEYS = ["wizard-columns","wizard-look","wizard-landed"];
function wizardWalkHeld(plKeys, enKeys, plNodes, enNodes) {
  const missing = missingMembers(plKeys, WIZARD_KEYS, true)
    .concat(missingMembers(enKeys, WIZARD_KEYS, true).map(k => "en " + k));
  if ((plNodes || []).indexOf("Zapisane jako szkic") < 0) missing.push("Zapisane jako szkic");
  if ((enNodes || []).indexOf("Landed as a draft") < 0) missing.push("Landed as a draft");
  if ((plKeys || []).length < WIZARD_KEYS.length) missing.push("pl covers under " + WIZARD_KEYS.length);
  if ((enKeys || []).length < WIZARD_KEYS.length) missing.push("en covers under " + WIZARD_KEYS.length);
  return { ok: missing.length === 0, missing };
}
const DESK_SCREENS = ["settings","projects","chrome","cards","lint","archive","facts","queue","publish"];
function deskWalkHeld(names) {
  const missing = missingMembers(names, DESK_SCREENS, true);
  if ((names || []).length < DESK_SCREENS.length) missing.push("screens under " + DESK_SCREENS.length);
  return { ok: missing.length === 0, missing };
}
const ORIGIN_NOTES = ["the proposal was made against rev {THEIRS} and the working copy is at rev {OURS}, so its author had not seen the later rev","this file is from a different catalog: it says id {THEIRS} and this catalog is {OURS}, so every row below is a card, an intent or a category coming IN. Nothing it leaves out is offered for removal and nothing about the catalog's own name or languages is offered at all","it does not carry modified: true, so it is not an engine export: it is a document built somewhere else","the proposal does not carry modified: true, so it was not written by an engine export of this catalog; its id says it is this catalog all the same","the proposal was made against rev {THEIRS} and the working copy is at rev {OURS}, so its author had not seen the later rev","the proposal claims rev {THEIRS}, ahead of this catalog's {OURS}; only the origin bumps rev, so this file has been through another publisher"];
function originNotesHeld(frames) {
  const have = (frames || []).map(s => String(s));
  const need = new Map();
  ORIGIN_NOTES.forEach(name => need.set(name, (need.get(name) || 0) + 1));
  const missing = [];
  need.forEach((n, name) => {
    const got = have.filter(x => x === name).length;
    if (got < n) missing.push(got === 0 ? name : name + " (" + got + " of " + n + ")");
  });
  if (have.length < ORIGIN_NOTES.length) missing.push("notes under " + ORIGIN_NOTES.length);
  return { ok: missing.length === 0, missing };
}
function screenKeysHeld(keys) {
  const missing = missingMembers(keys, SCREEN_KEYS, true);
  if ((keys || []).length < SCREEN_KEYS.length) missing.push("screens under " + SCREEN_KEYS.length);
  return { ok: missing.length === 0, missing };
}
const FRAME_NAMES = ["this export could not be read: it has no {FIELD} where one is needed","the archive at {P} has no edition {E}; it has {LIST}","no archived catalog file at {P}","an audit pack needs a folder to write","{P} already holds an audit pack; a pack is written into a folder of its own","there is no audit pack at {P}: a pack carries a {F}","an audit pack holds one catalog-<edition>.json and {P} holds {N}","the CSV has no rows at all","{ROWS} is {PAIRS}, past this rule's stated ceiling of {N}; a pile this size needs a blocking index rather than a longer wait","the file is empty, so there is nothing to import","the provider's answer is not the JSON this import asked for, so nothing could be read out of it: {CHARS}","nothing usable came back, so there is nothing to propose: {CALLS}","nothing in the answer survived the check that every proposed span is in the file it came from, so no proposal was written","the catalog id {ID} is not 3 to 64 characters of a to z, 0 to 9 and the hyphen; an id of your own can be typed in its place","{FILE}, beside the file being imported, is empty. Once it is filled in or moved to another folder, a second import goes ahead; without it, the file being imported is read on its own.","the file is not valid UTF-8 and was read as {ENC}; byte sequences a UTF-8 reader would have replaced: {N}. Check the letters of any card that looked wrong before this catalog goes out","the CSV has a header and no rows","More than one column is headed {NAME}, and only the last of them was read. Once each has a name of its own in the file, a second import reads them all.","The columns {COLUMNS} went under the same field, \"{FIELD}\", which holds only one; for now, {FIRST} is the one read. On the screen \"What is in this file\", each can be given a field of its own on its row, or left out with \"Do not import\".","The column {NAME} stays out of the import, as Studio could not tell which field it belongs to. If it holds catalog content, the screen \"What is in this file\" offers a field for it on its row. If not, nothing needs doing.","The column {COLUMN} went under \"{FIELD}\" because of the headings beside it; its text alone could not confirm that. If the language is right, nothing needs doing. If not, the screen \"What is in this file\" offers the right one on this column's row, or \"Do not import\".","the column {NAME} is headed {CODE} and reads as {READS}; the header was kept, so either the heading or the content is wrong and only a person can say which","rows with no {CODE} text in {NAME}: {MISSING} of {TOTAL}; the engine refuses a card with no text in a language the catalog declares, so those cards will fail the checks until they are filled or {CODE} is dropped","No column holds text in the primary language, {CODE}. Choose the column that holds it, or give a column that language, in the table of headings","no column names a category, so every card lands on one shelf","two category keys slug to one id; {KEY} was given {ID} so that {TAKEN} stays with the first","cards are filed under the category key {KEY}, which categories.csv does not declare; the shelf was minted and labelled with the key itself, so it will read as {KEY} on the pill until somebody names it","row {ROW} claims the id {TAKEN}, which is taken; it was given {ID} so the file still loads, but two rows asking for one identity is a merge somebody has to make","rows whose id is not 3 to 64 of a-z, 0-9 and the hyphen, each given a new one under which every desk files that card from now on: {N}. The first of them: {FIRST}","card {TWIN} carries the same text as {OF}, once letter case, accents and punctuation are set aside; the import keeps both as cards of their own, and if they are one answer, one card is enough, and if two, each can have words of its own","cards {TWIN} and {OF} share one title in one category, once letter case, accents and punctuation are set aside; the import keeps both as cards of their own, and at the desk they look alike until one is given another title or the two become one card","near duplicate: {TWIN} and {OF} score title {TITLE}, body {BODY} against thresholds {T1} and {T2} ({ON})","the platform placeholder {TOKEN} has no engine equivalent and was left in the text exactly as it stands, {USES}; a card carrying it shows it to the customer","Etiuda's checks: {LINE}","this file carries a key named {KEY}, which no catalog or statistics file has, so it is not read","this file nests deeper than any catalog or statistics file does, so it is not read","{DIR} has no project.json: a catalog folder holds project.json and draft.json, and an import makes the draft","the catalog names its draft as {NAME} and there is nothing at {P}","{TEXT} leaves no letter from a to z or digit for a file name","{FOLDER} already holds {FILE}, which is another catalog's file, so nothing was published. Under another file name this one can go out.","{FOLDER} already holds {FILE}, which is this catalog's file under another name, so nothing was published. Choosing {FILE} under Change file name in Catalog details, or taking that file away, lets the next publish go out.","the archive already holds {E} at {P}; an archived edition is immutable and this one would have been written over","Could not reach {P}, perhaps because the drive or share it is on is not connected. Once it is, try again.","Could not write to {P}, perhaps because it is read-only or another program has it open. Once it is free, try again.","Could not write to {P}, because the drive it is on is full. Once there is room on it, try again.","this file does not say which catalog it belongs to, so there is nothing to review it against. A file exported from a desk, or made by Studio's import, always says; exporting it again from the desk is enough.","imported here from {FILE}, so every row below is a card or a tag coming in from that file. Nothing it leaves out is offered for removal and nothing about the catalog's own name or languages is offered at all","the proposal was made against rev {THEIRS} and the working copy is at rev {OURS}, so its author had not seen the later rev","this file is from a different catalog: it says id {THEIRS} and this catalog is {OURS}, so every row below is a card, an intent or a category coming IN. Nothing it leaves out is offered for removal and nothing about the catalog's own name or languages is offered at all","it does not carry modified: true, so it is not an engine export: it is a document built somewhere else","the proposal does not carry modified: true, so it was not written by an engine export of this catalog; its id says it is this catalog all the same","the proposal claims rev {THEIRS}, ahead of this catalog's {OURS}; only the origin bumps rev, so this file has been through another publisher","this is not a catalog file, so there is nothing in it to review","{ROWS} changed here as well since the copy this file was made from, so Accept all leaves such rows for you to decide","nothing here shows which copy this file was made from, so {ROWS} may undo a change made here; Accept all leaves such rows for you to decide","a decision has to be attributable: write whose proposal this is. {ACCEPTED} would have been accepted and {REJECTED} rejected, and nothing was written.","Some rows have more fields than the heading row, and fields with no heading were not imported: {FIELDS} left out, from {ROWS}.","Some fields sit under a heading with no name, so they were not imported: {FIELDS}. A name added in the file, and a second import, brings them in.","Some names appear more than once in the heading row, and of the columns sharing a name only the last was read: {NAMES} repeated, {FIELDS} left out.","The file's rows all have the same number of fields, but the first row gives no name to a column that holds content, so Studio read the file as one column rather than as a table. Nothing in it was lost. Once every column that holds content has a name in the first row, Studio reads the file as a table.","The file has commas in it, but not the same number on every line, so Studio read it as one column rather than as a table. Nothing after a comma was lost.","The file's one column repeats the same pattern, so each repeat became one row of a table, {ROWS} in all. The pattern is very clear.","The file's one column repeats the same pattern, so each repeat became one row of a table, {ROWS} in all. The pattern is clear, if looser in places, so it is worth a glance to see that each row holds what belongs together.","The file's one column repeats the same pattern, so each repeat became one row of a table, {ROWS} in all. The pattern is a subtle one, so it is worth checking carefully that each row holds what belongs together. A sheet with a heading over each column is read as it stands.","The last repeat is shorter than the others, as in an export that ends where its content ends, so the last row's missing fields were left empty.","The column opens with something that belongs to no repeat, a heading or a title perhaps, so it was left out of the table: {CELLS}.","this file is blocks of text with blank lines between them, of different lengths, so each block was read as one cell and no pattern was looked for; nothing in a block was dropped","this file is one column with no repeating pattern in it, so it was read as one column: {CELLS}","this JSON file is none of the exports Studio reads: a list of macros, of folders of responses, or of templates","{FILE} is damaged and cannot be read, so this catalog cannot open. Studio has left the file as it is; every published rev is kept whole in {ARCHIVE}.","{FILE} is damaged and cannot be read, so this catalog cannot open. Studio has left the file as it is.","{DIR} holds no catalog: a catalog folder holds project.json, or the one draft an import wrote","a catalog needs a name","there is already a folder at {DIR}","no catalog in {DIR}","a card holds one reply, alternatives or steps","a card needs at least one reply with text in it","the version of Etiuda this Studio is built on does not read {MARK} as a marker","no card {ID} in {FILE}","no category {ID} in this catalog","no intent {ID} in this catalog","no card {ID} in this catalog","there is no catalog at {DIR}, so an import cannot land in it","no file at {P}","there is already a file at {DIR} with {ROWS} still waiting; an import never writes over a proposal that is waiting","there is already a folder at {DIR}; an import never writes over a catalog that is already there","the archive at {P} has no edition {E}","an export needs a file to write, and not the archived copy itself","{FOLDER} is where this catalog publishes sealed, and a plain copy there would be read by anyone; nothing was written.","nothing has been published from {P} yet, so there is no edition to account for","a thousand intents and categories already have an id made from {BASE}; a name with different letters makes a new one, since capitals, accents and punctuation do not count","a category needs a name in {LANG}, the primary language this catalog declares","an intent needs a name in {LANG}, the primary language this catalog declares","{TEXT} gives the id {ID}, which the format refuses: an id is 3 to 64 characters of a to z, 0 to 9 and the hyphen","no tag {ID} in this catalog","{TAG} is on {CARDS}. Move or delete cards in this category first.","{TAG} is on {CARDS}. Take it off them first.","a card needs a title in {LANG}, the primary language this catalog declares","Studio no longer holds this change, so it cannot be undone","this place is no longer in the change, so it cannot be undone","this place has changed since, so it can no longer be undone on its own","the card has changed since, so this change can no longer be undone on its own","the quick facts have changed since, so this change can no longer be undone on its own","the catalog has changed there since, so this change can no longer be undone on its own","a card is in a category this change made, so the change can no longer be undone on its own","Studio no longer remembers the deleted card, so the deletion cannot be undone","the catalog has changed since the card was deleted, so the deletion can no longer be undone","Studio no longer remembers this change, so it cannot be undone","the catalog has changed since, so this change can no longer be undone","the sheet has changed since it was shown, so nothing from it has gone into the draft; chosen again, it shows what it holds now","Rows are matched to cards by an id column, and this sheet has none; every sheet exported from Studio has one, headed id","the catalog has changed since the sheet was shown, so nothing from the sheet has gone into the draft; chosen again, the sheet is compared with the catalog as it is now","edition {E} holds no card {ID}, so there is no text in it to restore","{FILE} is a table rather than a catalog file: Import into this catalog, in any open catalog, reads tables and can make one a new catalog","{FILE} could not be read as a catalog file, perhaps because it is damaged or is not a catalog file at all","{PROBLEMS}, nothing written: {LIST}","{DIFFERENCES} on the way back, nothing written: {LIST}","there is already a folder at {DIR}; an upgrade never writes over a catalog that is already there","The team reads this catalog from {DIR}, which is inside the catalog's own folder, so renaming it would move that folder out of its reach. Change folder beside Writes to chooses one outside the catalog, and the rename can follow.","The name could not be written, and the folder could not be put back either: the catalog now lies in {NOW}, and was in {WAS}. Nothing is lost. Open it where it lies, or move the folder back by hand.","{FILE} in {FOLDER} is another catalog's file, so it stays where it is and this catalog's file keeps its name.","{FOLDER} already holds a file named {FILE}, so the catalog keeps {NAME}. Any name not yet in that folder will do.","The name could not be recorded, and the file could not be put back either: the catalog file now lies in {FOLDER} as {NOW}, and its record still says {WAS}. Choosing {NOW} under Change file name repairs the record, and until then a publish is refused.","{CODE} is not a language code: a code is two or three letters, as en and pl are","this catalog already declares {CODE}","a catalog speaks at least one language, and none was declared","every card must carry the primary language, and some have no {CODE} text: {CARDS}. Ask again to make it the primary.","{CODE} is the only language this catalog declares, and a catalog speaks at least one","removing {CODE} discards its text and nothing else holds a copy: {CARDS}, {INTENTS}, {CATS}. Cards pinned to it: {PINS}. Ask again to remove it.","{DIR} is a file, not a folder.","Studio cannot write to {DIR}, so it cannot publish an edition there.","Publishing needs the folder the team reads from, and Change beside Writes to chooses it.","A team file is signed with this Studio's signing key, and Settings shows there is none yet.","This catalog is kept inside {FOLDER}, so a sealed copy there would sit beside the catalog in the clear; nothing was changed.","The team file in {FOLDER} does not read whole, so it is left as it is.","The team file in {FOLDER} is not this Studio's own, so it is left as it is.","this catalog has no folder yet: choose the folder the team reads from first","The signing key did not open on this computer, so nothing was written.","A backup copy needs a passphrase; nothing was written.","To restore the signing key, pick the file Studio wrote with Make a backup copy…, whose name begins etiuda-studio-key- unless it was renamed; {FILE} is not such a copy.","The passphrase does not open this copy. Nothing was changed.","there is no team here this Studio leads, so there is nothing to open","there is no team here this Studio leads, so there is nothing to refuse","there is no team here this Studio leads, so there is nothing to admit into","This Studio does not hold the team's current key, so nobody was removed.","A file sealed for the team does not open with the key this Studio holds, so nobody was removed.","Nobody was removed, as the removal was not confirmed.","there is no team here led from this Studio, so there is nobody to remove","This folder holds a different team, so nobody was removed.","This member is not on the team's list, so nothing changed.","this file is an old .xls workbook or a password-protected one, which are both a different format from .xlsx; open it, save a copy as .xlsx without a password, and import that","this file is not a workbook: a .xlsx is a zip and this does not begin like one","this workbook is in the zip64 format, which this reader does not read","this workbook's directory is damaged and it cannot be opened","this workbook unpacks to more than {MB} MB, which this reader does not read","this workbook's entry {NAME} is damaged and it cannot be opened","this workbook's entry {NAME} is packed by a method this reader does not read (method {METHOD})","this workbook is password-protected; open it, save a copy without the password and import that","this file is a zip but not a workbook: it has no xl/workbook.xml in it","this workbook declares no sheet at all","This computer cannot keep a signing key for this account: no keyring is open to seal it. To have one, install GNOME Keyring (the gnome-keyring package) or KDE Wallet, sign in again and reopen Studio.","This computer cannot keep a signing key for this Windows account.","This Studio has a signing key already, so no other was made.","This Studio keeps another signing key, so the copy was not restored.","This computer cannot keep a team key for this account: no keyring is open to seal it. To have one, install GNOME Keyring (the gnome-keyring package) or KDE Wallet, sign in again and reopen Studio.","This computer cannot keep a team key for this Windows account.","no folder at {P}","{FOLDER} already holds {FILE}, which is this catalog's file under another name, so nothing was published. Putting {FILE} back as the file name on this screen, or taking that file out of the folder, lets the publish go out.","There is no team here led from this Studio, so nobody can be invited.","A desk would read {FOLDER} differently from how it is written here, so no invitation was made.","This computer cannot keep an invitation sealed for the signed-in account, so none was made.","This invitation has ended, so it was not copied.","the paste has no reply in it"];
function framesHeld(list, sites, declaredHas) {
  const uniqFrames = Array.isArray(list) ? list : Array.from(list || []);
  const missing = missingMembers(uniqFrames, FRAME_NAMES, false);
  const untranslated = FRAME_NAMES.filter(f => !declaredHas(f));
  if (uniqFrames.length < FRAME_NAMES.length) missing.push("frames under " + FRAME_NAMES.length);
  if (!(sites >= 110)) missing.push("sites under 110");
  return { ok: missing.length === 0 && untranslated.length === 0, missing, untranslated };
}
/* COUNTS:END */

async function main(argv) {
  const keep = argv.indexOf("--keep") >= 0;
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const projects = path.join(SCRATCH, "projects");

  const clean = await plant(projects, "retail", pile("clean", 61, 18, []),
    "polish-catalog", "Retail, EN and PL");
  await plant(projects, "travel", pile("broken", 62, 9, ["missing-second-language"]),
    "travel-catalog", "Travel desk");
  /* Two projects to import INTO and two piles to import FROM, one per walk: the wizard's third
     cover is only painted by a landing, and a landing refuses a project folder that is already
     there, so the Polish walk and the English control cannot share either. */
  const wizPl = await plant(projects, "wiz-pl", pile("wizpl", 63, 12, []), "wiz-pl", "Wizard, PL");
  const wizEn = await plant(projects, "wiz-en", pile("wizen", 64, 12, []), "wiz-en", "Wizard, EN");
  /* A DIFFERENT FILE NAME PER WALK, not merely a different pile: the wizard names the project
     folder after the file, so two piles both called macros.csv land in one folder and the
     second walk meets "there is already a folder at ..." instead of the third cover. */
  const pilePl = path.join(SCRATCH, "piles", "intake-pl.csv");
  const pileEn = path.join(SCRATCH, "piles", "intake-en.csv");
  fs.copyFileSync(pile("intake-pl", 65, 14, []), pilePl);
  fs.copyFileSync(pile("intake-en", 66, 14, []), pileEn);

  /* Published once from the command line, so that the project list has a date to print in Last
     publish, the Archive section has a row, and the publish cover has a previous revision to
     name - three strings that are otherwise never painted. */
  const pub = spawnSync(process.execPath, ["tools/publish.mjs", clean, "--notes", "Zubynt."],
    { cwd: ROOT, encoding: "utf8" });
  if (pub.status !== 0) throw new Error("the fixture would not publish: " + pub.stderr);

  /* AFTER THE PUBLISH AND NOT BEFORE IT: the rev note compares the proposal's revision with the
     project's, and the project has no revision to be behind until it has published one. */
  await plantProposals(clean, await Engine.format());

  /* ---- 1. THE TABLE AND THE RULE, IN THE PAGE ------------------------------------------------ */

  /* THE FRAMES THE QUEUE SAYS ABOUT A FILE IT ACCEPTED, read out of src/review.mjs by the
     same scanner section 7 uses and carried into the window below, so that section 4 can ask
     the table itself what each one says in Polish. Nothing here is typed twice. */
  const originFrames = framesIn(fs.readFileSync(path.join(ROOT, "src", "review.mjs"), "utf8"))
    .filter(f => /different catalog|modified: true|rev \{/.test(f));

  const w = await open(projects, "pl");
  let plSeen = null, screenKeys = [], screenReady = [], plNotes = [];
  try {
    const t = await page0(w, `JSON.stringify({
      lang: window.STUDIO_T.lang(),
      ready: window.STUDIO_T.ready(),
      missing: window.STUDIO_T.missing(),
      screens: window.STUDIO_T.screens(),
      per: window.STUDIO_T.screens()
        .map(s => s + ":" + (window.STUDIO_T.ready(s) ? "pl" : "en")),
      table: window.STUDIO_T.table(),
      /* Each origin note as the table says it, placeholders and all: the words between the
         variables are what a screen paints, and 4h looks for exactly those. */
      notes: ${JSON.stringify(originFrames)}.map(f => window.STUDIO_T.T(f)),
      forms: [0,1,2,3,4,5,11,12,13,14,15,21,22,25,101,102,112,122]
        .map(n => [n, window.STUDIO_T.C(n, "{N} card", "{N} cards")]),
      en: (function () {
        window.STUDIO_T.force("en");
        const o = [0,1,2,5].map(n => [n, window.STUDIO_T.C(n, "{N} card", "{N} cards")]);
        window.STUDIO_T.force("pl");
        return o;
      })(),
      /* The publish cover's awaiting line, built through the same door with the same arguments
         ui/app.js gives it. {LANG} IS THE CODE IN CAPITALS SINCE 2026-09-19 (boards 532 and
         549): it was langName(), T("Polish"), and Maxim ruled that a language is named by its
         code in both products. The frame is unchanged and so is Claudette's Polish for it - the
         language is a label at the head behind a colon either way, and a code is the one kind
         of label that cannot be asked to inflect. Four numbers, one per Polish form and one for
         the number the frame had to be written around. */
      await1: [1, 3, 12, 22].map(n => window.STUDIO_T.T("Awaiting its {LANG} text on {CARDS}.",
        { LANG: "PL", CARDS: window.STUDIO_T.C(n, "{N} card", "{N} cards") })),
      await0: window.STUDIO_T.T("Awaiting its {LANG} text.", { LANG: "PL" }),
    })`);
    const T = JSON.parse(t);
    plNotes = T.notes || [];
    screenKeys = T.screens;
    screenReady = T.per.filter(x => x.endsWith(":pl")).map(x => x.split(":")[0]);
    check(T.lang === "pl", "1a STUDIO_LANG=pl opens the window in Polish (lang=" + T.lang + ")");
    /* WHAT HAS NO POLISH YET, AND WHICH SCREENS IT KEEPS ENGLISH. The number is asserted
       rather than its absence, so that a string falling quietly off the list is a failure and
       so that the cost of an untranslated screen is a figure in the record rather than a shrug.
       Since board 468 the second half matters more than the first: a screen at a time. It
       reached nought on 2026-09-18 with the copywriter's third pass (board 538), and the
       assertion stays the same shape: a string added later with no twin fails here. */
    /* The tour (board 720) took it off nought with twenty-one strings and the copywriter's
       pass (board 744) put it back. */
    check(T.ready === true && T.missing.length === 0,
      "1b " + T.missing.length + " strings have no Polish - ready() over the whole interface"
      + " is " + T.ready);
    const plScreens = T.per.filter(x => x.endsWith(":pl")).map(x => x.split(":")[0]);
    const enScreens = T.per.filter(x => x.endsWith(":en")).map(x => x.split(":")[0]);
    const screens1 = screensHeld(plScreens, enScreens);
    check(screens1.ok,
      "1b1 every screen the table knows can be spoken whole, in the table's order"
      + (screens1.missing.length ? ", missing " + screens1.missing.join(", ") : "")
      + (screens1.untranslated.length ? ", untranslated " + screens1.untranslated.join(", ") : "")
      + ": " + plScreens.join(", ") + " " + JSON.stringify(T.per));

    /* THE ONE SENTENCE OF THE THIRD PASS THAT COULD BE WRONG AT A NUMBER. The language is a
       label at the head, behind the colon, and the count falls after a comma as a bare
       quantity; a frame that put the count behind a preposition would read well at 3 and at 12
       and wrong at 1. The four expected lines are the copywriter's own, from
       copywriter-studio-pass-3.md, with the no-break space built from its code point rather
       than typed.
       THE HEAD IS THE CODE SINCE 2026-09-19 (532 and 549) where it was Polski, and the sentence
       after it is hers unchanged: her reason for the shape was that langName() hands the
       language over nominative and capitalised and so cannot inflect inside a clause, and two
       capitals cannot either, which is the same sentence with a shorter label in front of it. */
    const NB1 = String.fromCharCode(160);
    const wantAwait = [1, 3, 12, 22].map((n, i) =>
      "PL: tekst jeszcze do uzupełnienia, " + n + NB1
      + ["karta", "karty", "kart", "karty"][i] + ".");
    const badAwait = T.await1.filter((s, i) => s !== wantAwait[i]);
    check(badAwait.length === 0 && T.await0 === "PL: tekst jeszcze do uzupełnienia.",
      "1b2 the publish cover's awaiting line reads as written at every form of the count - "
      + T.await1.map(JSON.stringify).join(", ") + " - and without one "
      + JSON.stringify(T.await0));
    const few1 = fewFormsHeld(T.table.few, T.table.plain.length);
    check(few1.ok,
      "1c the table holds " + T.table.plain.length + " pairs and a few-form for every counted noun"
      + (few1.missing.length ? ", missing " + few1.missing.join(", ") : ""));

    /* THE THREE FORMS, AGAINST A SECOND IMPLEMENTATION OF THE RULE written here from the
       copywriter's statement of it rather than from the code under test. */
    const want = (n) => {
      if (n === 1) return "one";
      const ten = n % 10, hundred = n % 100;
      return (ten >= 2 && ten <= 4 && !(hundred >= 12 && hundred <= 14)) ? "few" : "many";
    };
    const form = (s) => s.endsWith("karta") ? "one" : s.endsWith("karty") ? "few"
      : s.endsWith("kart") ? "many" : "?";
    const wrong = T.forms.filter(([n, s]) => form(s) !== want(n));
    check(wrong.length === 0, "1d all 18 counts inflect as the rule says (" + wrong.length
      + " wrong; 0 " + T.forms[0][1] + ", 1 " + T.forms[1][1] + ", 2 " + T.forms[2][1]
      + ", 5 " + T.forms[5][1] + ", 12 " + T.forms[7][1] + ", 22 " + T.forms[12][1] + ")");

    const nb = T.forms[2][1].charCodeAt(String(2).length);
    check(nb === 160, "1e the space between the count and the Polish noun is a no-break space,"
      + " charCode " + nb);
    const enSpace = T.en[2][1].charCodeAt(1);
    check(T.en[2][1] === "2" + String.fromCharCode(160) + "cards" && enSpace === 160,
      "1f and so is the English one, charCode " + enSpace);

    /* ---- 2. THE WALK, IN POLISH -------------------------------------------------------------- */

    plSeen = await walkEverything(w.page, clean);
  } finally { await w.shut(); }

  const screens = Object.keys(plSeen);
  const walk = walkHeld(screens);
  check(walk.ok,
    "2a the walk read every screen and cover it sets out to"
    + (walk.missing.length ? ", missing " + walk.missing.join(", ") : "")
    + ": " + screens.join(", "));

  /* ---- 3. THE SAME WALK IN ENGLISH, WHICH IS THE CONTROL ---------------------------------------- */

  const w2 = await open(projects, null);
  let enSeen = null;
  try {
    const lang = await page0(w2, "window.STUDIO_READY.lang");
    check(lang === "en", "3a with STUDIO_LANG unset the window opens in English on this desk"
      + " (lang=" + lang + ")");
    enSeen = await walkEverything(w2.page, clean);
  } finally { await w2.shut(); }

  /* ---- 2b AND 3b. THE WIZARD, IN BOTH LANGUAGES ------------------------------------------- */

  const w4 = await open(projects, "pl", pilePl, "wiz-pl");
  let plWiz = null;
  try { plWiz = await walkWizard(w4.page, wizPl); } finally { await w4.shut(); }
  const w5 = await open(projects, null, pileEn, "wiz-en");
  let enWiz = null;
  try { enWiz = await walkWizard(w5.page, wizEn); } finally { await w5.shut(); }
  Object.keys(plWiz).forEach(k => { plSeen[k] = plWiz[k]; });
  Object.keys(enWiz).forEach(k => { enSeen[k] = enWiz[k]; });
  /* THE SENTENCE THIS LEG PRINTS IS THE MEASURE. The third cover's opening line carries three
     counted nouns at once, so a reader of the record sees the Polish forms the rule produced
     beside the English the same import wrote, on a real screen rather than in the table. */
  const landedLine = (w, re) => (((w["wizard-landed"] || {}).nodes) || []).find(n => re.test(n)) || "";
  const plLine = landedLine(plWiz, /^\d+ kart/), enLine = landedLine(enWiz, /^\d+ cards/);
  const wiz = wizardWalkHeld(Object.keys(plWiz || {}), Object.keys(enWiz || {}),
    ((plWiz || {})["wizard-landed"] || {}).nodes, ((enWiz || {})["wizard-landed"] || {}).nodes);
  check(wiz.ok && plLine && enLine,
    "2b the wizard's covers were walked in each language and the third landed a draft in"
    + " both, its counts inflected on the screen"
    + (wiz.missing.length ? ", missing " + wiz.missing.join(", ") : "")
    + ": pl " + JSON.stringify((plLine || "").split(".")[0])
    + ", en " + JSON.stringify((enLine || "").split(".")[0]));

  /* ---- 4. NO ENGLISH SURVIVES ------------------------------------------------------------------ */

  const src = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
  const langSrc = fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8");
  const lit = literalsOf(src);
  /* THE REFUSAL'S THREE ARE SUPPOSED TO BE INDIRECT. A refusal's frame and the two English
     forms of a count inside it are built in the node half and travel as values
     (src/refusal.mjs), so no literal of any of them can be in this file at all; section 7 below
     is what holds them to the table instead. */
  /* `p.person.statement` and `l` are the audit pack's two (606): the account statement and
     each of board 607's three limits are written in the node half and travel on the pack, so
     ui/app.js holds no literal of either and 5b below is what holds them to the table. */
  /* `step.title` and `step.body` are the tour's ten steps (board 720). They cannot be literals
     at their call: one function paints whichever step is showing, out of a table. So the tour
     publishes its own strings on window.STUDIO_TOUR and tests/tour.mjs holds every one of them
     against ui/lang.js's text, which is the same check 5a below makes and made the same way -
     an exemption here without that leg would be twenty strings nothing looked at. */
  /* THE FIVE THAT CAME AFTER THE LIST, each a sentence written once elsewhere and handed over as a value, as
     `e.frame` is: `M.SAID[level]` is ui/strength.js's three lines under the passphrase (2026-10-16),
     `d.handoverEnded` is the relay's answer to a key handover that was refused for good (2026-10-30; the
     shell keeps it and the Desks screen says it once), `r.answerSaid` is the line after a refusal whose answer
     the relay did not take, and `r.catchUpSaid` is the offline line before an epoch move, which two doors say
     (2026-10-18 and 2026-10-19). None can be a literal at its call. 5b below holds every word each can take to
     the table, read out of the files that write them, so that an exemption here is never a string nothing
     looked at. */
  const INDIRECT = ["FIELD_WORD[field]", "MONTHS[d.getMonth()]",
    "step", "step", "e.frame", "v.one", "v.many", "p.person.statement", "l",
    "step.title", "step.body",
    "M.SAID[level]", "d.handoverEnded", "r.answerSaid", "r.catchUpSaid", "r.catchUpSaid", "r.catchUpSaid",
    /* The shortcut registry's rows in Settings (2026-11-09): each label, hint and chip is written in ui/keys.js, and 5b
       holds every one of them to the table. */
    "d.chip", "d.label", "d.hint"];
  /* THE PROJECT'S SETTINGS SCREEN ADDED NONE OF ITS OWN and that was a deliberate rewrite
     (board 579): its four helpers - the row's arrows, the counts, the kv labels and the little
     buttons - first took the English word and called T() inside, which put six more names on
     this list and hid six strings from 5a below. They take the SAID string now and every word
     is a literal at its own call. */
  check(lit.indirect.slice().sort().join("|") === INDIRECT.slice().sort().join("|"),
    "4a " + lit.indirect.length + " arguments in ui/app.js come from somewhere other than a"
    + " literal, and they are these: " + JSON.stringify(lit.indirect));

  /* The keys whose Polish differs from their English. A key whose twin is the same word - Menu,
     Import, and the frame that only reorders - cannot be looked for on a Polish screen. */
  const pairs = [];
  const re = /"((?:[^"\\]|\\.)*)":\s*\n?\s*"((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = re.exec(langSrc))) pairs.push([JSON.parse('"' + m[1] + '"'), JSON.parse('"' + m[2] + '"')]);
  const differing = pairs.filter(([en, pl]) => en !== pl).map(([en]) => en);
  check(differing.length > 110, "4b " + differing.length + " of the " + pairs.length
    + " pairs the table declares are a different word in Polish, by a regex over ui/lang.js");

  const flat = (seen) => {
    const out = [];
    Object.keys(seen).forEach(k => seen[k].nodes.concat(seen[k].attrs)
      .forEach(v => out.push([k, v])));
    return out;
  };
  const plFlat = flat(plSeen), enFlat = flat(enSeen);
  check(plFlat.length > 200 && enFlat.length > 200,
    "4c the two walks read " + plFlat.length + " and " + enFlat.length + " pieces of text");

  /* A KEY IS LOOKED FOR AS A WHOLE PIECE OF TEXT, not as a substring, because a short English
     word can sit inside a card's own words and a card's words are the customer's, not the
     interface's. Every label on these screens is its own element, so equality is the right
     test; the long sentences are also looked for inside a piece, since a frame sets one into
     a larger one. */
  const hits = (list, keys) => {
    const out = [];
    list.forEach(([screen, v]) => keys.forEach(k => {
      if (v === k || (k.length > 20 && v.indexOf(k) >= 0)) out.push(screen + ": " + k);
    }));
    return out;
  };
  /* A LANGUAGE NAMED IN ITSELF IS NOT AN UNTRANSLATED LABEL (board 579). The settings screen,
     the New project cover and the desk's own Settings cover all say English and Polski, because
     the engine says English and Polski in the same control (`langEndonym`; tests/settings-screen.mjs
     1f holds that rule and says why). Those same two words are also keys of the table, where
     they are the cards TABLE'S column headings and read Angielski and Polski - one string, two
     senses, and only the second may be translated. The list is the PIN'S own, so a fourth
     endonym the engine learns is excused here at the next fetch rather than at the next time
     somebody remembers. */
  const ENDONYMS = Object.keys(Engine.langEndonyms()).map(k => Engine.langEndonyms()[k]);
  const leftEnglish = hits(plFlat, differing.filter(k => ENDONYMS.indexOf(k) < 0));
  check(leftEnglish.length === 0, "4d no English label survives anywhere on the Polish screens"
    + (leftEnglish.length ? ": " + leftEnglish.slice(0, 6).join(" | ") : ""));

  const foundEnglish = hits(enFlat, differing);
  const distinct = Array.from(new Set(foundEnglish.map(x => x.split(": ")[1])));
  check(distinct.length >= 45, "4e and the same walk in English finds " + distinct.length
    + " of them, so the check can see what it is looking for");

  /* The sentences a frame builds, which carry no key of their own and would pass 4d untouched. */
  /* "lint findings" left the list on 2026-11-22: no frame in ui/app.js builds it any longer. The Library's Draft and Checks
     sentences took its place (and one more), being the frames the walk now paints where the projects table painted its own. */
  const FRAGMENTS = ["unfixed since the last publish", "kept so far", "edits not published", "to look at",
    " cards.", "days ago", "weeks ago", "a moment ago", "never published", "no folder chosen"];
  const frag = [];
  plFlat.forEach(([screen, v]) => FRAGMENTS.forEach(f => {
    if (v.indexOf(f) >= 0) frag.push(screen + ": " + JSON.stringify(v));
  }));
  check(frag.length === 0, "4f and no English fragment of a built sentence either"
    + (frag.length ? ": " + frag.slice(0, 4).join(" | ") : ""));
  const fragEn = [];
  enFlat.forEach(([screen, v]) => FRAGMENTS.forEach(f => { if (v.indexOf(f) >= 0) fragEn.push(f); }));
  check(new Set(fragEn).size >= 5, "4g against " + new Set(fragEn).size
    + " of the " + FRAGMENTS.length + " found by the English control");

  /* THE QUEUE'S NOTES, WHICH ARE THE FRAMES THE NODE HALF BUILDS ABOUT A FILE IT ACCEPTED.
     They carry variables, so neither 4d nor 4e can see them: an English key holding {THEIRS} is
     never painted whole in either language. What is painted is the words BETWEEN the variables,
     so those are what is looked for - taken out of src/review.mjs by the same scanner section 7
     uses, and out of the table for the Polish, so nothing is typed here twice. */
  const segs = (str) => String(str || "").split(/\{[A-Za-z0-9_]+\}/)
    .map(x => x.replace(/\s+/g, " ").trim()).filter(x => x.length >= 14);
  const qText = (seen) => ["queue-foreign", "queue-own"]
    .map(k => (seen[k] ? seen[k].nodes.join(" ") : "")).join(" ").replace(/\s+/g, " ");
  const qPl = qText(plSeen), qEn = qText(enSeen);
  const enSegs = [], plSegs = [];
  originFrames.forEach((f, i) => {
    segs(f).forEach(x => enSegs.push(x));
    segs(plNotes[i]).forEach(x => plSegs.push(x));
  });
  const plHasEn = enSegs.filter(x => qPl.indexOf(x) >= 0);
  const plHasPl = plSegs.filter(x => qPl.indexOf(x) >= 0);
  /* The rev note is said twice: once for this catalog's own file and once for a desk's file grown from it. */
  const originHeld = originNotesHeld(originFrames);
  check(originHeld.ok && plHasEn.length === 0 && plHasPl.length >= 4,
    "4h the notes the queue says about a file it accepted are said"
    + " in Polish on the Polish screens"
    + (originHeld.missing.length ? ", missing " + originHeld.missing.map(s => JSON.stringify(String(s).slice(0, 70))).join(", ") : "")
    + ": " + plHasPl.length + " of " + plSegs.length
    + " Polish pieces found on the two open proposals, " + plHasEn.length + " English"
    + (plHasEn.length ? " - " + JSON.stringify(plHasEn[0]) : ""));

  const enHasEn = enSegs.filter(x => qEn.indexOf(x) >= 0);
  check(enHasEn.length >= 4 && qEn.length > 200,
    "4i and the same two screens in English carry " + enHasEn.length + " of the " + enSegs.length
    + " English pieces, so the check can see what it is looking for: "
    + JSON.stringify(enHasEn.slice(0, 2)));

  /* ---- 5. EVERY STRING IS DECLARED --------------------------------------------------------------- */

  const declared = new Set(pairs.map(([en]) => en));
  /* THE LIST IS READ AS JAVASCRIPT, NOT SPLIT ON COMMAS. Several of its entries hold a comma
     of their own and one is written as two halves joined by a plus, so a split would report
     nonsense and the assertion below would be measuring the parser instead of the list. */
  function listIn(text, name, open, close) {
    const at = text.indexOf("const " + name + " = " + (open || "["));
    const block = text.slice(at, text.indexOf(close || "\n  ];", at))
      .replace(/[/][*][^]*?[*][/]/g, " ");
    const re = /("(?:[^"\\\\]|\\\\.)*")|([,+])/g;
    const out = [];
    let m, cur = null, joining = false;
    while ((m = re.exec(block))) {
      if (m[1]) {
        const v = JSON.parse(m[1]);
        if (joining && cur !== null) cur += v;
        else { if (cur !== null) out.push(cur); cur = v; }
        joining = false;
      } else joining = m[2] === "+";
    }
    if (cur !== null) out.push(cur);
    return out;
  }

  /* THE TABLE IS AN OBJECT OF SCREENS SINCE BOARD 468, so what is read out of it is every
     string under every screen, each counted once: a string that keeps two screens English is
     written twice there and is one untranslated string here. The keys are bare identifiers and
     not quoted, so the same scanner reads the strings and nothing else. */
  /* The PL_FEW keys, by the same textual reading: a counted noun with no few form inflects
     wrongly for 2 to 4 and nothing else in this file would notice. */
  const fewAt = langSrc.indexOf("const PL_FEW = {");
  const fewBlock = langSrc.slice(fewAt, langSrc.indexOf("\n  };", fewAt));
  const fewKeys = [];
  const fewRe = new RegExp(QUOTE + "([^" + QUOTE + "]*)" + QUOTE + "[ ]*:", "g");
  let fm;
  while ((fm = fewRe.exec(fewBlock))) fewKeys.push(fm[1]);

  const noTwinAll = listIn(langSrc, "NO_TWIN", "{", "\n  };");
  const noTwin = Array.from(new Set(noTwinAll));
  noTwin.forEach(s => declared.add(s));
  const undeclared = Array.from(new Set(lit.strings.filter(s => !declared.has(s))));
  check(undeclared.length === 0, "5a every one of the " + new Set(lit.strings).size
    + " literals ui/app.js passes to T() or C() is a pair in the table or a declared NO_TWIN"
    + (undeclared.length ? ": " + undeclared.slice(0, 6).map(JSON.stringify).join(", ") : ""));
  /* THE WORDS OF THE FIVE INDIRECT KEYS 4a NAMES THAT THE NODE HALF AND ui/strength.js WRITE, read out of those files
     by section 7's own reader (constText, framesIn) so that nothing is typed twice. A name that yields nothing fails
     here rather than passing over an empty list. */
  const wordsOfConst = (rel, name, several) => {
    const text = constText(fs.readFileSync(path.join(ROOT, rel), "utf8"), name) || "";
    /* A table of lines, as the meter's and the licence's are, is the value of every entry in it; one sentence, which
       may be written as halves joined by a plus, is read as a frame is. */
    const found = several
      ? Array.from(text.matchAll(/(?:[A-Za-z_]+|"[^"\\]*")\s*:\s*("(?:[^"\\]|\\.)*")/g)).map(m => JSON.parse(m[1]))
      : framesIn("refuse(" + text + ")");
    if (!found.length) throw new Error("tests/polish.mjs 5b: " + name + " in " + rel + " holds no sentence this reader can see");
    return found;
  };
  const SAID_WORDS = wordsOfConst(path.join("ui", "strength.js"), "SAID", true)
    .concat(["HANDOVER_GONE_SAID", "HANDOVER_NOGRANT_SAID", "HANDOVER_COUNT_SAID", "HANDOVER_CATCHALL_SAID",
      "HANDOVER_OLD_KEY_SAID", "ANSWER_UNSENT", "CATCH_UP_SAID"].flatMap(n => wordsOfConst(path.join("src", "relay.mjs"), n)));
  /* The shortcut registry's words, read out of ui/keys.js, which 4a's d.label, d.hint and d.chip carry to T(). */
  const KEY_WORDS = Array.from(fs.readFileSync(path.join(ROOT, "ui", "keys.js"), "utf8")
    .matchAll(/\b(?:label|hint|chip)\s*:\s*("(?:[^"\\]|\\.)*")/g)).map(m => JSON.parse(m[1]));
  if (KEY_WORDS.length < 10) throw new Error("tests/polish.mjs 5b: ui/keys.js yields " + KEY_WORDS.length + " words, too few to be the registry");
  const LISTS = ["full", "empty", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug",
    "Sep", "Oct", "Nov", "Dec", "Title", "Text", "Categories", "Intents", "Who",
    "What is in this file", "Languages and duplicates", "Land it as a draft"]
    .concat([ACCOUNT_STATEMENT]).concat(LIMITS).concat(SAID_WORDS).concat(KEY_WORDS);
  const missedList = LISTS.filter(s => !declared.has(s));
  check(missedList.length === 0 && SAID_WORDS.length === 10, "5b every word the indirect keys can take - the two states"
    + " of a text cell, the twelve months, the mapping select's field words, the wizard's"
    + " three step names, the audit pack's account statement and three limits, the passphrase meter's three"
    + " lines, the shortcut registry's labels, hints and chips, the four refusals of a key handover, the line that asks for the old key, the unsent answer's line and the offline line - is declared"
    + " as well, " + LISTS.length + " checked"
    + (missedList.length ? ", missing " + missedList.map(x => JSON.stringify(x.slice(0, 40)))
       .join(", ") : ""));
  /* A string with no Polish has somewhere to go, and none of those strings is also a pair. */
  const keyHeld = screenKeysHeld(screenKeys);
  check(noTwinAll.length === 0 && keyHeld.ok
        && noTwinAll.every(s => !pairs.some(([en]) => en === s)),
    "5c and NO_TWIN holds " + noTwinAll.length + " strings under the screens the table knows"
    + (keyHeld.missing.length ? ", missing " + keyHeld.missing.join(", ") : "")
    + ", no one of them also a pair in the table, and the table is still answered a"
    + " screen at a time");

  /* EVERY SCREEN ui/app.js DECLARES IS A SCREEN ui/lang.js KNOWS. A name that is not a key is
     treated as not ready, so a misspelt one would leave a screen quietly English for ever
     rather than failing; this is the check that turns that silence into a failure. */
  const Q = String.fromCharCode(34);
  const onCall = new RegExp("onScreen[(]" + Q + "([a-z]+)" + Q + "[)]", "g");
  const declaredScreens = Array.from(new Set(
    Array.from(src.matchAll(onCall)).map(m => m[1])));
  const strays = declaredScreens.filter(n => screenKeys.indexOf(n) < 0);
  check(declaredScreens.length >= 15 && strays.length === 0,
    "5e all " + declaredScreens.length + " screen names ui/app.js declares are keys of"
    + " ui/lang.js's own table" + (strays.length ? ": " + strays.join(", ") : ""));

  /* ---- 6. A POLISH DESK, SCREEN BY SCREEN ------------------------------------------------------
   *
   * THE CLAIM BOARD 468 ADDED, AND IT IS TWO CLAIMS AT ONCE: a screen whose words are all there
   * is Polish, and a screen with a word missing is English - WHOLE. The second is the one that
   * matters and the one no earlier section could see, because sections 2 to 4 drive a forced
   * window, where every screen is Polish by construction.
   *
   * THE LANGUAGE IS CHOSEN THE WAY A PERSON CHOOSES IT, through the Settings cover, rather than
   * by setting a variable: what is being measured is what a Polish desk does, and STUDIO_LANG
   * would bypass the very rule under test.
   *
   * EACH SCREEN IS READ IN ITS OWN REGION. The whole page would mix the chrome's words with the
   * screen's, and the chrome is a screen here like any other - it has the rail on it, and the
   * rail names every section, so one section's name with no twin keeps the frame English.
   */
  const REGION = (sel) => `(() => {
    const out = [];
    document.querySelectorAll(${JSON.stringify(sel)}).forEach(root => {
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let t;
      while ((t = w.nextNode())) {
        const v = String(t.nodeValue).replace(/\\s+/g, " ").trim();
        if (v) out.push(v);
      }
      Array.from(root.querySelectorAll("[placeholder]"))
        .forEach(e => { if (e.getAttribute("placeholder")) out.push(e.getAttribute("placeholder")); });
    });
    return JSON.stringify(out);
  })()`;

  const w3 = await open(projects, null);
  const desk = {};
  let deskLang = "", deskChose = "", refusalSeen = "", deskBefore = [];
  try {
    const page = w3.page;
    const press = async (sel, ms) => {
      await pressWhen(page, sel, { who: "tests/polish.mjs" });
      await sleep(ms || 300);
    };
    const grab = async (name, sel) => { desk[name] = JSON.parse(await page.evaluate(REGION(sel))); };

    /* THIS LAUNCH SHARES w2's PROFILE, and a launch reopens the project its profile last had on screen: the list's own
       tab first, so the walk below starts where it always did. */
    await press('[data-act="to-projects"]', 500);
    /* The home tab's own screen, Overview, which has had no table since board 982 E: what is waited for is that it is on screen. */
    await settleOn(page, '(window.STUDIO_READY || {}).screen === "projects"', { bound: 30000 });
    deskLang = await page.evaluate("window.STUDIO_T.lang()");
    /* THE CONTROL FOR THIS SECTION, READ BEFORE THE SWITCH. Every screen walked below is
       Polish since board 538, so the section can no longer show that it can see a difference
       by naming a screen that stayed English. This is the same region, read by the same
       reader, on the same window, one press earlier. */
    deskBefore = JSON.parse(await page.evaluate(REGION("#main")));
    /* the Menu is a list since 2026-10-06 (S1), Settings its first row; Settings is a tab of
       sections since board 965, opening since 2026-11-16 on All settings, the one page that holds every section, the
       interface language among them */
    await press("#btnMenu", 300);
    await press('#menuList [data-act="settings"]', 400);
    await settleOn(page, '(window.STUDIO_READY || {}).screen === "settings-tab"', { bound: 30000 });
    await press('#main [data-act="set-lang"][data-v="pl"]', 600);
    await settleOn(page, 'window.STUDIO_T && window.STUDIO_T.lang() === "pl"', { bound: 30000 });
    deskChose = await page.evaluate("window.STUDIO_T.lang()");
    await grab("settings", "#main");
    await press('#tabs [data-act="to-projects"]', 400);
    await settleOn(page, '(window.STUDIO_READY || {}).screen === "projects"', { bound: 30000 });
    await grab("projects", "#main");

    await openFromLibrary(page, clean);
    await sleep(800);
    await grab("chrome", "#rail, #chrome");
    await grab("cards", "#main");
    for (const s of ["lint", "archive", "facts", "proposals"]) {
      await press('[data-act="section"][data-v="' + s + '"]', s === "proposals" ? 700 : 400);
      await settleOn(page, '(window.STUDIO_READY || {}).screen === "' + s + '"', { bound: 30000 });
      await grab(s === "proposals" ? "queue" : s, "#main");
    }
    await press('[data-act="publish"]', 800);
    await settleOn(page, '!document.querySelector("#scrim").hidden', { bound: 30000 });
    await grab("publish", "#dlg");
    await press('[data-act="cover-close"]', 300);

    /* A REFUSAL, DRIVEN ON THE SAME POLISH DESK (board 523). The forty-one refusals live in the
       node half and the page paints what it is handed, so nothing in the table scan can show
       that one of them ever reaches a screen in Polish. This presses Delete on a category that
       still has cards on it, which is the refusal Maxim ruled keeps its English wording, and
       reads the dashed box the shell puts it in. The English side of the same press is
       tests/tags-screen.mjs 7a and 7c. */
    await press('[data-act="section"][data-v="categories"]', 500);
    await pressWhen(page, "Delete on a category with cards on it", { who: "tests/polish.mjs 6",
      find: `(() => {
        const row = Array.from(document.querySelectorAll("#main table tr")).find(r => {
          const c = r.querySelector("td.mono");
          return c && Number(c.textContent) > 0 && r.querySelector('[data-act="tag-del"]');
        });
        return row ? row.querySelector('[data-act="tag-del"]') : null;
      })()` });
    await settleOn(page, '((document.querySelector("#main .dashed") || {}).textContent || "").trim() !== ""', { bound: 30000 });
    refusalSeen = await page.evaluate(
      `(document.querySelector("#main .dashed") || {}).textContent || ""`);
  } finally { await w3.shut(); }
  await sleep(300);

  check(deskLang === "en" && deskChose === "pl",
    "6a a window with nothing set opens English on this desk and the Settings cover turns it"
    + " Polish, which is the path a person takes (" + deskLang + " then " + deskChose + ")");

  /* WHICH WAY EACH SCREEN SHOULD HAVE GONE, taken from the table itself rather than written out
     here a second time: a screen whose list is empty is expected Polish and the rest English, so
     this stays true the day Claudette's words land and a screen changes sides. */
  /* THE TWO LANGUAGE NAMES ARE NOT EVIDENCE OF ANYTHING HERE. The Settings cover writes English
     and Polski each in its own language, which is the engine's own practice in the same control,
     so neither moves when the interface does; and the cards table's column headings are a pair
     of the same four words. Leaving them in read "Polski" on an English cover as Polish having
     leaked onto it, which it is not. Every other pair still counts, and the screens that matter
     carry six to fifteen of them each. */
  const LANGUAGE_NAMES = ["English", "Polish", "Angielski", "Polski"];
  const englishKeys = differing.filter(k => LANGUAGE_NAMES.indexOf(k) < 0);
  const polishWords = pairs.filter(([en, pl]) => en !== pl).map(([, pl]) => pl)
    .filter(k => LANGUAGE_NAMES.indexOf(k) < 0);
  const seenIn = (list, keys) => {
    const out = [];
    list.forEach(v => keys.forEach(k => {
      if (v === k || (k.length > 20 && v.indexOf(k) >= 0)) out.push(k);
    }));
    return Array.from(new Set(out));
  };
  const table = Object.keys(desk).map(name => ({
    name,
    want: screenReady.indexOf(name) >= 0 ? "pl" : "en",
    en: seenIn(desk[name], englishKeys),
    pl: seenIn(desk[name], polishWords),
  }));
  const wrong = table.filter(r => r.want === "pl" ? r.en.length > 0 : r.pl.length > 0);
  const deskHeld = deskWalkHeld(table.map(r => r.name));
  check(deskHeld.ok && wrong.length === 0,
    "6b every screen walked on that desk is in ONE language,"
    + " and the one its own list asks for"
    + (deskHeld.missing.length ? ", missing " + deskHeld.missing.join(", ") : "")
    + ": "
    + table.map(r => r.name + " " + r.want + " (" + r.pl.length + " pl, " + r.en.length
      + " en)").join(", ")
    + (wrong.length ? " - wrong: " + JSON.stringify(wrong[0]) : ""));
  const spoke = table.filter(r => r.want === "pl" && r.pl.length > 0);
  const kept = table.filter(r => r.want === "en" && r.en.length > 0);
  /* THE ENGLISH FLOOR WAS NOUGHT FROM BOARD 538 TO BOARD 720 and this leg follows it either
     way, because both halves are read off the table rather than written out: every screen the
     table says speaks Polish painted Polish words, and every screen it says stays English
     painted English ones. The second half stopped being vacuous the day the tour landed - the
     Settings cover is the screen paying for the tour's row and this is where that cost is
     measured rather than asserted. The control is the projects list read on the same window
     before the person turned it Polish, so a window that painted nothing at all still fails. */
  const controlEn = seenIn(deskBefore, englishKeys);
  const wantPl = table.filter(r => r.want === "pl").length;
  const wantEn = table.filter(r => r.want === "en").length;
  check(spoke.length === wantPl && kept.length === wantEn && controlEn.length >= 3,
    "6c and the check can see what it is looking for: " + spoke.length + " of " + wantPl
    + " screens painted"
    + " Polish words (" + spoke.map(r => r.name).join(", ") + ") and none painted English,"
    + " against " + controlEn.length + " English labels on the same projects list read one"
    + " press before the switch (" + controlEn.slice(0, 4).join(", ") + ")");

  /* THE REFUSAL, AS THE PERSON AT THE POLISH DESK MET IT. The count is read as a counted noun
     with the no-break space the rule puts in, so this cannot pass against a bare number. */
  const NB = String.fromCharCode(160);
  const plCount = new RegExp("[0-9]+" + NB + "kart");
  check(/jest jeszcze w u/.test(refusalSeen) && plCount.test(refusalSeen),
    "6d and a refusal driven on that desk is Polish too, its count inflected: "
    + JSON.stringify(refusalSeen));

  /* ---- 7. EVERY REFUSAL THE NODE HALF BUILDS IS A PAIR ------------------------------------- */

  /* WHY THIS IS A SCAN OF ITS OWN. Sections 4 and 5 read ui/app.js, and not one of the forty-seven
     frames is written there: they are thrown in src/*.mjs and shell/main.js and arrive at the
     page as a frame and its variables. So the same question section 5 asks of the screens -
     is every string this program can paint in the table - has to be asked of that half too, or
     a refusal added next month would paint English in the middle of a Polish screen and no gate
     would know. A frame with no Polish is a failure here rather than a silent fallback. */
  const nodeFiles = fs.readdirSync(path.join(ROOT, "src")).filter(n => n.endsWith(".mjs"))
    .map(n => path.join("src", n)).concat([path.join("shell", "main.js")]);
  const frames = [];
  nodeFiles.forEach(rel => {
    framesIn(fs.readFileSync(path.join(ROOT, rel), "utf8")).forEach(f => frames.push([rel, f]));
  });
  /* THE LICENCE'S SENTENCES, which reach refuse() through licenceSaid(reason) and so are no frame of any call this
     scan can read: they are the values of one table in shell/main.js, and each is a frame all the same. */
  wordsOfConst(path.join("shell", "main.js"), "LICENCE_SAID", true).forEach(f => frames.push([path.join("shell", "main.js"), f]));
  const uniqFrames = Array.from(new Set(frames.map(([, f]) => f)));
  const noPolish = uniqFrames.filter(f => !declared.has(f));
  check(noPolish.length === 0,
    "7a every one of the " + uniqFrames.length + " refusal frames the node half builds, over "
    + frames.length + " call sites in " + new Set(frames.map(([r]) => r)).size + " files, is a"
    + " pair in the table"
    + (noPolish.length ? ": " + noPolish.slice(0, 3).map(JSON.stringify).join(", ") : ""));

  /* A scanner that found nothing fails the sites floor. Each frame known today is named. */
  const frameHeld = framesHeld(uniqFrames, frames.length, f => declared.has(f));
  const shortest = uniqFrames.slice().sort((a, b) => a.length - b.length)[0];
  check(frameHeld.ok,
    "7b and the scan can see what it is looking for: " + uniqFrames.length + " frames over "
    + frames.length + " sites"
    + (frameHeld.missing.length ? ", missing " + frameHeld.missing.slice(0, 3).map(s => JSON.stringify(String(s).slice(0, 80))).join(", ") : "")
    + (frameHeld.untranslated.length ? ", untranslated " + frameHeld.untranslated.slice(0, 3).map(s => JSON.stringify(String(s).slice(0, 80))).join(", ") : "")
    + ", the shortest " + JSON.stringify(shortest));

  /* THE COUNTED NOUNS THE REFUSALS USE are counted by the page's own C(), so both English forms
     and the Polish few form have to be in the table exactly as a screen's are. Read out of the
     calls rather than listed here. */
  const nouns = [];
  nodeFiles.forEach(rel => {
    const src2 = fs.readFileSync(path.join(ROOT, rel), "utf8");
    const re2 = /counted\([^,]+,\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"/g;
    let m2;
    while ((m2 = re2.exec(src2))) nouns.push([JSON.parse('"' + m2[1] + '"'),
                                              JSON.parse('"' + m2[2] + '"')]);
  });
  const lackPair = nouns.filter(([one, many]) => !declared.has(one) || !declared.has(many));
  const lackFew = Array.from(new Set(nouns.map(([, many]) => many)))
    .filter(many => fewKeys.indexOf(many) < 0);
  check(nouns.length > 0 && lackPair.length === 0 && lackFew.length === 0,
    "7c and each of the " + new Set(nouns.map(([, m]) => m)).size + " counted nouns they use has"
    + " both English forms and a Polish few form: "
    + Array.from(new Set(nouns.map(([, m]) => m))).join(", ")
    + (lackFew.length ? " - no few form for " + lackFew.join(", ") : ""));

  /* ---- 8. A NUMBER NEVER STANDS APART FROM ITS WORD, ON ANY SCREEN, IN EITHER LANGUAGE ----------
     tests/few-forms.mjs section 2 holds the doors (C(), T(), a literal beside a value) and cannot
     see n + " " + word. Here every block both walks painted is read for a number with an ordinary
     space to a word after it, or to a word or a colon before it; a date, a time or a decimal after
     a word is not a count. A match in the fixtures' own words is the customer's, not ours. */
  const corpus = (function read(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).map(e => e.isDirectory()
      ? read(path.join(dir, e.name))
      : /\.(ec|json|csv)$/.test(e.name) ? fs.readFileSync(path.join(dir, e.name), "utf8") : "").join("\n");
  })(SCRATCH).replace(/\s+/g, " ");
  const LOOSE = [/(?<![\p{L}\d.:_\/-])\d+[ \t\r\n]+\p{L}+/gu, /[\p{L}:]+[ \t\r\n]+\d+(?![\p{L}\d]|[-.:]\d)/gu];
  const BOUND = /\d\u00a0\p{L}|[\p{L}:]\u00a0\d/gu;
  const census = (seen) => {
    const out = [];
    let bound = 0;
    Object.keys(seen).forEach(k => (seen[k].runs || []).forEach(run => {
      bound += (run.match(BOUND) || []).length;
      LOOSE.forEach(re => Array.from(run.matchAll(re)).forEach(m => {
        if (corpus.indexOf(m[0].replace(/\s+/g, " ")) >= 0) return;
        out.push(k + ": " + JSON.stringify(m[0]) + " in " + JSON.stringify(run.slice(Math.max(0, m.index - 24),
          m.index + m[0].length + 24).replace(/\s+/g, " ")));
      }));
    }));
    return { loose: Array.from(new Set(out)), bound };
  };
  const plC = census(plSeen), enC = census(enSeen);
  const planted = census({ x: { runs: ["18 cards", "Cards: 3", "rev 4", "18\u00a0cards",
    "desk-3 x", "12:05 x", "published 2026-09-24", "at 08:35"] } }).loose.length;
  check(planted === 3, "8a the census finds a number loose after, before and after a colon in"
    + " planted text, and not once bound, nor inside a name, nor a date or a time: " + planted + " of 3");
  /* Each phrase once, with one screen it was on: the list is what gets fixed. */
  const named = (c) => c.loose.length + " on screen, "
    + Array.from(new Map(c.loose.map(x => [x.split(": ").slice(1).join(": ").split(" in ")[0], x])).values())
      .slice(0, 40).join(" | ");
  check(plC.loose.length === 0, "8b no number on the Polish screens stands apart from its word"
    + (plC.loose.length ? ": " + named(plC) : ""));
  check(enC.loose.length === 0, "8c nor on the English ones" + (enC.loose.length ? ": " + named(enC) : ""));
  check(plC.bound >= 20 && enC.bound >= 20, "8d and the walks read " + plC.bound + " and "
    + enC.bound + " numbers bound to their words, so the census could see what it looks for");

  if (!keep) dropScratch(SCRATCH, "polish");
  process.stdout.write("polish  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

/** One evaluation against the window's first page. */
async function page0(w, js) { return w.page.evaluate(js); }

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("polish  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
