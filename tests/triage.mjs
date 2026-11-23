/* THE REVIEW STACK IS THE ONE WAY TO DECIDE (board 1016, item 7): node tests/triage.mjs [--keep].
 *
 * Max, as the record holds it: "I hate when the same mechanics is written underneath more than once"; and of a third
 * "Accept all" button, 15 November: "it's not needed". Claude alpha's rule (2026-11-22 01:57, restated 09:55): no Accept all at
 * the table, the stack is the one way, and the table becomes a view with one line that opens the stack.
 *
 * The page runs on tests/page-stand-in.mjs over the real verbs of src/studio.mjs on a scratch root: an import into a project
 * with a card of its own, so its rows wait as a proposal.
 *   wy1  no second way to decide: the page has no act that decides a row outside the stack (the rows' own Accept and Reject,
 *        Accept all, the one-at-a-time walk and its keys, the table's Land), and none of the walk's functions
 *   wy2  the proposal's table is a view: every row shown, with its words, and no control on it that decides or lands, no
 *        attribution field, and exactly one line that opens the stack
 *   wy3  that line opens the stack, the proposal's own row in hand, and a reworded passage put back in the view is written
 *        into the proposal on the way, never dropped
 *   wy4  the stack still decides: A and R answer, Apply writes what was accepted into the draft and nothing rejected
 *   wy5  the import's own end has one door, never Accept all, and it opens the stack on the rows it sent, the card naming the
 *        file they came from
 *   wy6  an edit reads as one (moved from tg7): the words that went struck, the words that came in beside them, the rest once
 *   wy7  in Polish, the line's words
 *   wy8  a passage put back in the view is written on every other way out of it too (the test architect's read, class B):
 *        the rail (wy8a), another tab (wy8b), the list of catalogs (wy8c), closing the tab on screen (wy8d) and the window's
 *        close (wy8e), each sending the press for its own file and dropping the view; and the Review disc (wy8f), Open on
 *        another file in the list beside the view (wy8g), the blue bubble's Review (wy8h), a file dropped into the same
 *        project (wy8i) and Back (wy8j), the test architect's second read (F1, F2, T3)
 *   wy9  a row answered in the stack and then changed by the person's own press in its file's view is said as their edit,
 *        never as a desk's sending it again (F6)
 *   wy10 an import's one press takes exactly its rows needing no check and no row held for checking first (wy10a), says how
 *        many it takes and how many it leaves (wy10b), and is never offered on a teammate's proposal (wy10c) (Claude alpha's
 *        decision on F7)
 *   wy11 the presses are written once (the test architect's N1, class B; revertProposalMarks is not idempotent): Back pressed
 *        twice while its write is out sends one write (wy11a), and the rail pressed while Back's write is out sends none of
 *        its own (wy11b)
 *   wy12 the verb itself is idempotent (src/studio.mjs revertProposalMarks): the same call made twice, by any route, leaves the
 *        body and its marks as one call does, on a body with two identical reworded passages where an index would move
 *        onto the second (the second call refused in words since wy21, being a press the file has moved on from, where
 *        a twin is still marked); a bare index, the command line's older form, still puts back the passage it names
 *   wy13 the test architect's probe (P1), with the real verb: a passage put back, Back's write held out, another passage pressed
 *        and the rail pressed; the body ends with exactly the two chosen passages put back, never a third
 *   wy14 a shared card kept by several desks (board 1013) carries its held flag into every keeper's part at Apply (P5)
 *   wy15 a press made while Back's write is out is written too before the view is left (P3)
 *   wy16 a passage pressed twice while a write is out, the write refused, stays as the person last chose it (P4)
 *   wy18 a decision the log refuses leaves the draft as it was and the file waiting, so a retry cannot take a rejected change
 *        (Grok review kappa, finding 3, verified B by the test architect)
 *   wy19 an inbox file past 64 MB is listed as refused by its name and not read (kappa, D)
 *   wy20 Bring in's format 1 reader reads a hand-written catalog as data and refuses one that would have to run (kappa, D)
 *   wy21 a press in a view another window has moved on from is never lost silently (the test architect's R2): refused in words,
 *        nothing written, where its passage is still marked (wy21a); answered as before where the other window put it back
 *        (wy21b); lands when pressed again against the newer state (wy21c); the page says it, reads the view again and keeps no
 *        press to be refused again (wy21d), and the press made in that view goes through (wy21e)
 * THE PLANTS (tests/plant-copy.mjs), each in a scratch copy: wy-line (the line left out of the view) turns wy2 red, wy-seg (a
 * decide control put back on a row) wy2, wy-want (the stack opening on its first card, not the proposal's) wy3, wy-flush (the
 * view's presses dropped, not written) wy3, wy-apply (Apply writing nothing) wy4, wy-door (the import's end opening the
 * proposal's table, not the stack) wy5, wy-rail (the rail leaving the presses unwritten) wy8a, wy-leave (a tab or screen
 * change leaving them, which closing the tab on screen reaches through) wy8b, wy8c and wy8d, wy-close (the window's close
 * leaving them) wy8e, wy-load (the stack's load leaving them) wy8f and wy8i, wy-opened (opening a proposal leaving them) wy8g,
 * wy-rvload (the queue's read leaving them) wy8h, wy-back (Back leaving them) wy8j, wy-own (the person's edit not known as
 * theirs) wy9, wy-clean-held (the press taking a held row) wy10a, wy-clean-words (the press not saying what it leaves) wy10b,
 * wy-clean-kind (the press offered on a teammate's proposal) wy10c, wy-once (the held presses left in place while their write
 * is out) wy11a and wy11b, rv-seen in src/studio.mjs (a call whose body has moved on taken as new) wy12, wy-applied (the view not told what landed)
 * wy13, wy-held-part (a part built without the group's held flag) wy14, wy-all (Back leaving after one write) wy15, wy-newest
 * (a second press deleting the choice) wy16, k-commit (src/review.mjs: the draft kept after the log refused) wy18, k-cap
 * (src/studio.mjs: no size read) wy19, k-data (src/engine.mjs: the converter's evaluator) wy20, rv-said (src/studio.mjs: a press the file has
 * moved on from, its passage still marked, answered ok) wy21a, wy-reread (ui/app.js: the refused press kept and the view not read
 * again) wy21d.
 *
 * RETIRED WITH THE WALK, each sentence old and then new:
 *   tg1  "the review's second door is a press, and it opens the first waiting row as a card with its keys" - the door and the
 *        walk are gone (board 1016 item 7); the stack's card and its keys are tests/review-door.mjs rd16 to rd19.
 *   tg2  "Accept decides the row, moves on and says so; Reject the same" - now the stack's A and R, rd16 and wy4 here.
 *   tg3  "Undo takes the last decision back" - now the stack's Ctrl Z, rd19.
 *   tg4a, tg4 "Accept the rest ... leaves a row marked Check first" - now the stack's Shift A on a teammate's file, rd18.
 *   tg5  "Start over takes every decision back" - now Take everything back, rd21.
 *   tg6  "Land writes the accepted rows into the draft and no rejected one" - now Apply, wy4 here and rd24.
 *   tg7  "an edit reads as one" - moved to wy6 unchanged.
 *   tg8  "the import's Accept all door opens the rows one at a time already decided" - the import's end is one door, wy5.
 *   tg9  the walk in Polish - the line's Polish is wy7; the stack's Polish is rd49.
 *   tg10, tg11, tg12 the walk's way back, its Escape and its Back control - no walk, so no way back from it; the stack's Esc is
 *        rd10 and the view's Back to the stack rd12.
 * RETIRED WITH IT, two files taken out of the tree:
 *   tests/triage-source-screen.mjs (a window leg): "triage for an imported file proposal shows 'Imported from items.csv' with
 *        no attribution field", the same for a paste, and "triage for a desk proposal shows 'Whose proposal this is' with the
 *        attribution field" - the stack's card names an import's file (wy5b here), a paste in words (tests/paste-back.mjs
 *        pb5b), and its attribution fields are under Apply (tests/review-door.mjs rd45).
 *   tests/corner-room.mjs: "the rows one at a time end with room for the corner" and "paintTriage writes its screen inside
 *        the pad the rule names" - the screen is gone; the stack keeps its own foot free of cards, rd5.
 *
 * PROVED BY MAKING IT FAIL: TRIAGE_APP=<a copy of ui/app.js> reads that copy instead, and the plants above.
 *
 * Node only, no window, no Electron. Exit 0 when every check holds, 1 when any fails.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as S from "../src/studio.mjs";
import * as Engine from "../src/engine.mjs";
import { writeTextImport } from "../src/import-text.mjs";
import { DRAFT_FILE } from "../src/publish.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { loadPage } from "./page-stand-in.mjs";
import { copyPlants } from "./plant-copy.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "triage");
const EXPECTED = 77;
const source = process.env.TRIAGE_APP ? fs.readFileSync(path.resolve(process.env.TRIAGE_APP), "utf8") : undefined;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}
function skip(line) { asserted++; process.stdout.write("  skip " + line + "\n"); }
const wire = (p) => Promise.resolve(p)
  .then(v => JSON.parse(JSON.stringify(Object.assign({ error: null }, v))))
  .catch(e => ({ error: e && e.message ? e.message : String(e), said: (e && e.said) || null, disk: !!(e && e.disk) }));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const el = (attrs) => ({ getAttribute: (k) => (attrs[k] == null ? null : attrs[k]), closest: () => null,
  classList: { contains: () => false } });
const NB = String.fromCharCode(160);
const plain = (s) => String(s == null ? "" : s).split(NB).join(" ");
const textOf = (html) => plain(String(html || "").replace(/<[^>]*>/g, ""));
const read = (dir, f) => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch { return null; } };

/* Every act that decided a proposal outside the stack before board 1016 item 7. */
const SECOND_WAYS = ["rv-decide", "rv-undecide", "rv-all", "rv-undo", "rv-one", "rv-land", "rv-above-no",
  "tri-accept", "tri-reject", "tri-rest", "tri-undo", "tri-back", "tri-over"];
const WALK = ["paintTriage", "triDecide", "triRest", "triUndo", "rvOneStart", "triQueue", "tickAll", "rvLand", "rvDoors"];

const DROPPED = { at: "" };
const CLOSED = { n: 0 };
/* While on, a press the page sends is put into the proposal as the real verb would leave it: the card's words changed and the
   hash recomputed (src/studio.mjs revertProposalMarks), so the stack's next read sees the row change. */
const REWRITE = { on: false };
/* While `p` is set, a press the page sends waits for it, as a write still on its way to a slow share does. */
const GATE = { p: null };
/* While on, a press the page sends is refused, as a share that is away refuses it. */
const REFUSE = { on: false };
/* While on, a press goes to the real verb (src/studio.mjs revertProposalMarks), still recorded first. */
const REAL = { on: false };
async function rewrite(f, r) {
  const F = await Engine.format();
  const cat = JSON.parse(fs.readFileSync(f, "utf8"));
  (r || []).forEach((w) => {
    const card = (cat.cards || []).find((c) => c && String(c.id) === String(w.card));
    if (card && card.body) card.body[w.lang] = String(card.body[w.lang] || "") + " (put back)";
  });
  delete cat.hash; delete cat.sig;
  cat.hash = F.contentHash(cat);
  fs.writeFileSync(f, JSON.stringify(cat, null, 1), "utf8");
}
function pageOver(root, uiLang, file, reverts) {
  const api = {
    newProject: (n, l, o) => wire(S.newProject(root, n, l, o)),
    open: (d) => wire(S.openProject(d)),
    projects: () => wire(S.listProjects(root)),
    proposals: (d) => wire(S.listProposals(d)),
    proposalOpen: (d, f, l) => wire(S.openProposal(d, f, { lang: l })),
    proposalDecide: (d, f, dec, from, note) => wire(S.decideProposal(d, f, dec, from, note)),
    /* A press is recorded as the page sends it: a CSV import carries no reworded passage for the real verb to put back. */
    proposalRevert: async (d, f, r) => {
      if (reverts) reverts.push({ file: f, reverts: r });
      if (GATE.p) await GATE.p;
      if (REFUSE.on) return { error: "the share is away" };
      if (REAL.on) return wire(S.revertProposalMarks(d, f, r));
      if (REWRITE.on) await rewrite(f, r);
      return { error: null, ok: true, reverted: 1 };
    },
    tabs: () => Promise.resolve({ error: null }),
    importPlan: (f, o, i) => wire(S.importPlan(root, f, o || {}, i || "")),
    importLand: (f, o, i, fingerprint) => wire(S.importLand(root, f, o || {}, i || "", fingerprint)),
    /* The file the shell says was dropped: `file`, or the one a leg names in DROPPED.at. */
    importDropped: () => Promise.resolve({ error: null, file: DROPPED.at || file }),
    cardHistory: (d, i) => wire(S.cardHistory(d, i)),
    discardUntouched: (d) => wire(S.discardUntouched(d)),
    close: () => { CLOSED.n++; return Promise.resolve({ error: null }); },
    desks: () => Promise.resolve({ error: null, desks: [] }),
    aiDrafts: () => Promise.resolve({ error: null, drafts: [] }),
  };
  const home = loadPage({ api, uiLang, source });
  home.page.S.host = { tour: { offered: true }, langs: S.builtLangs() };
  return { P: home.page, home };
}

async function imported(P, dir, door) {
  await P.ACTS.open(el({ "data-act": "open", "data-dir": dir }));
  await sleep(30);
  await P.dropTake({ name: "rows.csv" });
  await P.ACTS["wiz-land"](el({ "data-act": "wiz-land", "data-v": door || "" }));
  await sleep(60);
}

/* The stack's functions are the closure's own, reached through the stand-in's eval. */
const get = (P, n) => { try { return P.__get(n); } catch (e) { return undefined; } };
const hand = (P) => { const pile = get(P, "stkPile"); const st = P.S.stack; return pile && st ? pile()[st.at] || null : null; };

async function main(argv) {
  clearScratch(SCRATCH);
  const root = path.join(SCRATCH, "projects");
  fs.mkdirSync(root, { recursive: true });
  const L = [{ code: "en" }, { code: "pl" }];
  const csv = path.join(SCRATCH, "rows.csv");
  fs.writeFileSync(csv, ["Title,Body EN,Body PL,Category", "Row 0,Text 0,Tekst 0,Delivery", "Row 1,Text 1,Tekst 1,Delivery",
    "Row 2,Text 2,Tekst 2,Delivery", "Row 3,Text 3,Tekst 3,Delivery"].join("\n") + "\n");
  /* A card of its own in each project, so the rows wait in Proposals: a project with no cards takes an import directly
     (Argon's first-day review, F5; tests/drop.mjs fd5b). */
  const HELD = "Opening hours";
  const carded = async (dir) => S.addCard(dir, (await S.addTag(dir, "shelf", { en: "Delivery", pl: "Dostawa" })).tag.id, HELD, "We open at nine.");
  const a = await S.newProject(root, "North shop", L);
  await carded(a.dir);

  const reverts = [];
  const { P, home } = pageOver(root, "en", csv, reverts);
  await P.ACTS["to-projects"]();
  const page = () => home.node("#main").innerHTML;

  /* ---- 1. NO SECOND WAY ------------------------------------------------------------------------- */

  const acts = SECOND_WAYS.filter((k) => typeof P.ACTS[k] === "function");
  const walk = WALK.filter((n) => typeof get(P, n) === "function");
  check(acts.length === 0 && walk.length === 0,
    "wy1 no act decides a row outside the stack, and the walk's functions are gone: " + JSON.stringify({ acts, walk }));

  /* ---- 5. THE IMPORT'S END: one door, into the stack --------------------------------------------- */

  await P.ACTS.open(el({ "data-act": "open", "data-dir": a.dir }));
  await sleep(30);
  await P.dropTake({ name: "rows.csv" });
  const foot = typeof P.paintFoot === "function" ? (P.paintFoot(), home.node("#foot").innerHTML) : "";
  const doors = (foot.match(/data-act="wiz-land"/g) || []).length;
  check(doors === 1 && foot.indexOf('data-v="all"') < 0 && textOf(foot).indexOf("Accept all") < 0,
    "wy5a the import's end offers one door and never Accept all: " + JSON.stringify(textOf(foot)));
  await P.ACTS["wiz-land"](el({ "data-act": "wiz-land", "data-v": "one" }));
  await sleep(60);
  const sent = ((P.S.rv && P.S.rv.list) || []).find((p) => p.ok && p.pending > 0);
  const h5 = hand(P);
  check(!P.S.wiz && P.S.section === "proposals" && !!P.S.rv && !P.S.rv.open && !P.S.rv.table && !!P.S.stack
        && !!sent && !!h5 && h5.file === sent.file && h5.src === "rows.csv" && /id="stk"/.test(page()),
    "wy5b and it opens the stack, a row of the file it sent in hand, naming its source: " + JSON.stringify({ section: P.S.section, file: sent && sent.file,
      hand: h5 && h5.file, src: h5 && h5.src, open: !!(P.S.rv && P.S.rv.open) }));

  /* A SECOND FILE WAITING, read before the first in the stack's pile, so that a stack opened anywhere but on the proposal's
     own row would show it (the plant wy-want). */
  const early = path.join(SCRATCH, "aaa.csv");
  fs.writeFileSync(early, ["Title,Body EN,Body PL,Category", "Row A0,Text A0,Tekst A0,Delivery", "Row A1,Text A1,Tekst A1,Delivery"].join("\n") + "\n");
  DROPPED.at = early;
  await P.dropTake({ name: "aaa.csv" });
  await P.ACTS["wiz-land"](el({ "data-act": "wiz-land", "data-v": "one" }));
  await sleep(60);
  DROPPED.at = "";

  /* ---- 2. THE TABLE IS A VIEW --------------------------------------------------------------------- */

  const file = sent ? sent.file : "";
  if (P.ACTS["rv-open"]) await P.ACTS["rv-open"](el({ "data-act": "rv-open", "data-file": file }));
  await sleep(30);
  const o = P.S.rv && P.S.rv.open;
  const v = page();
  const rows = (v.match(/<tr[ >]/g) || []).length - 1;
  const titles = o ? o.changes.map((c) => c.title || c.id) : [];
  check(!!o && /class="rvq"/.test(v) && titles.length === 4 && titles.every((t) => textOf(v).indexOf(t) >= 0) && rows >= 4,
    "wy2a the proposal's table still shows every row with its words: " + JSON.stringify(titles));
  const deciders = SECOND_WAYS.filter((k) => v.indexOf('data-act="' + k + '"') >= 0);
  check(deciders.length === 0 && v.indexOf('id="rvFrom"') < 0 && !/class="(door|doors|seg)[ "]/.test(v)
        && !/<span[^>]*data-v="(accept|reject)"/.test(v),
    "wy2b no control on it decides or lands, and no attribution field: " + JSON.stringify(deciders));
  const lines = (v.match(/data-act="rv-stack"/g) || []).length;
  check(lines === 1, "wy2c and exactly one line opens the stack: " + lines);
  const lineText = (/<button[^>]*data-act="rv-stack"[^>]*>([\s\S]*?)<\/button>/.exec(v) || [])[1] || "";
  check(textOf(lineText).trim() === "Decide the waiting rows in Review", "wy2d the line's words: " + JSON.stringify(textOf(lineText).trim()));

  /* ---- 3. THE LINE OPENS THE STACK ----------------------------------------------------------------- */

  /* A reworded passage on the first row, put back in the view: the press is held until the view is left (604). */
  const c0 = o ? o.changes[0] : null;
  if (c0) {
    c0.segs = [{ text: "Text ", i: null }, { text: "0", was: "Zero", kind: "reword", i: 0 }];
    c0.lang = "en";
    P.paint();
  }
  const marked = page().indexOf('data-act="rv-mark"') >= 0;
  if (P.ACTS["rv-mark"] && c0) await P.ACTS["rv-mark"](el({ "data-act": "rv-mark", "data-k": c0.key, "data-i": "0" }));
  const putBack = page().indexOf('class="mk off"') >= 0 && reverts.length === 0;
  /* The sitting's hand set back to the top of the pile, where another file's row stands first. */
  const pileNow = get(P, "stkPile");
  const otherFirst = !!(pileNow && P.S.stack && pileNow()[0] && pileNow()[0].file !== file);
  if (P.S.stack) { P.S.stack.hand = null; P.S.stack.at = 0; }
  if (P.ACTS["rv-stack"]) await P.ACTS["rv-stack"](el({ "data-act": "rv-stack" }));
  await sleep(60);
  const h3 = hand(P);
  check(P.S.section === "proposals" && !!P.S.rv && !P.S.rv.open && !P.S.rv.table && /id="stk"/.test(page())
        && !!h3 && h3.file === file && otherFirst,
    "wy3a the line opens the stack with the proposal's own row in hand, another file's row first in the pile: "
    + JSON.stringify({ open: !!(P.S.rv && P.S.rv.open), hand: h3 && h3.file, file, otherFirst }));
  const w = reverts[0];
  check(marked && putBack && reverts.length === 1 && w.file === file && JSON.stringify(w.reverts) === JSON.stringify([{ card: c0.id, lang: "en", marks: [{ text: "0", was: "Zero", n: 0 }], seen: "Text 0" }]),
    "wy3b a passage put back in the view is written into the proposal as the view is left: " + JSON.stringify({ marked, putBack, reverts }));

  /* ---- 4. THE STACK STILL DECIDES ------------------------------------------------------------------ */

  const draft0 = ((read(a.dir, DRAFT_FILE) || {}).cards || []).filter((c) => (c.title || {}).en !== HELD);
  const first = hand(P);
  if (P.ACTS["stk-a"]) P.ACTS["stk-a"](el({ "data-act": "stk-a", "data-a": "yes" }));
  const second = hand(P);
  if (P.ACTS["stk-a"]) P.ACTS["stk-a"](el({ "data-act": "stk-a", "data-a": "no" }));
  const answered = P.S.stack ? Object.keys(P.S.stack.answers).length : 0;
  check(!!first && !!second && first.key !== second.key && answered === 2,
    "wy4a A and R each answer the card in hand, and nothing is written yet: " + answered);
  const draftMid = ((read(a.dir, DRAFT_FILE) || {}).cards || []).filter((c) => (c.title || {}).en !== HELD);
  const apply = get(P, "stkApply");
  if (typeof apply === "function") await apply();
  await sleep(60);
  const after = ((read(a.dir, DRAFT_FILE) || {}).cards || []).map((c) => (c.title || {}).en).filter((t) => t !== HELD).sort();
  check(draft0.length === 0 && draftMid.length === 0 && !!first && after.join("|") === first.title,
    "wy4b Apply writes the accepted row into the draft and not the rejected one: " + JSON.stringify(after));

  /* ---- 6. AN EDIT ---------------------------------------------------------------------------------- */

  const editHtml = get(P, "editHtml");
  const e6 = typeof editHtml === "function" ? editHtml("Wrap the piece in paper as it came to you, and it will travel safely.",
    "Wrap the piece in the paper it came in, and it will travel safely.") : "";
  check(e6 === "Wrap the piece in <del>paper as it came to you,</del> <ins>the paper it came in,</ins> and it will travel safely.",
    "wy6 an edit reads as one: " + JSON.stringify(e6));

  /* ---- 7. IN POLISH -------------------------------------------------------------------------------- */

  const b = await S.newProject(root, "West shop", L);
  await carded(b.dir);
  const pl = pageOver(root, "pl", csv, []);
  await pl.P.ACTS["to-projects"]();
  await imported(pl.P, b.dir, "one");
  const plFile = ((pl.P.S.rv && pl.P.S.rv.list) || []).find((p) => p.ok && p.pending > 0);
  if (pl.P.ACTS["rv-open"] && plFile) await pl.P.ACTS["rv-open"](el({ "data-act": "rv-open", "data-file": plFile.file }));
  const tPl = pl.home.node("#main").innerHTML;
  const plLine = (/<button[^>]*data-act="rv-stack"[^>]*>([\s\S]*?)<\/button>/.exec(tPl) || [])[1] || "";
  check(textOf(plLine).trim() === "Rozstrzygnij oczekujące wiersze w Przeglądzie", "wy7 in Polish, the line's words: " + JSON.stringify(textOf(plLine).trim()));

  /* ---- 8. EVERY OTHER WAY OUT OF THE VIEW WRITES ITS PRESSES ------------------------------------------ */

  /* The view of a file still waiting in `dir`, a reworded passage on its first waiting row put back by a press, held. */
  const markIn = async (dir) => {
    const waitingNow = ((await wire(S.listProposals(dir))).proposals || []).filter((p) => p.ok && p.pending > 0);
    const f = waitingNow.length ? waitingNow[0].file : "";
    P.S.section = "proposals";
    if (f) await P.ACTS["rv-open"](el({ "data-act": "rv-open", "data-file": f }));
    const c = P.S.rv && P.S.rv.open ? P.S.rv.open.changes.find((x) => !x.decided) : null;
    if (c) {
      c.segs = [{ text: "Text ", i: null }, { text: "x", was: "Ex", kind: "reword", i: 0 }];
      c.lang = "en";
      P.paint();
      await P.ACTS["rv-mark"](el({ "data-act": "rv-mark", "data-k": c.key, "data-i": "0" }));
    }
    return { f, c, sent: reverts.length };
  };
  /* The press went out once, for its own file and card, and the view holding it is gone. */
  const wrote = (m) => !!m.c && reverts.length === m.sent + 1 && reverts[reverts.length - 1].file === m.f
    && JSON.stringify(reverts[reverts.length - 1].reverts) === JSON.stringify([{ card: m.c.id, lang: "en", marks: [{ text: "x", was: "Ex", n: 0 }], seen: "Text x" }]);
  const south = await S.newProject(root, "South shop", L);
  await carded(south.dir);
  const backTo = async () => { await P.ACTS.open(el({ "data-act": "open", "data-dir": a.dir })); await sleep(30); };
  await backTo();

  const m8a = await markIn(a.dir);
  await P.ACTS.section(el({ "data-act": "section", "data-v": "cards" }));
  await sleep(30);
  check(wrote(m8a) && !(P.S.rv && P.S.rv.open), "wy8a by the rail: " + JSON.stringify({ sent: reverts.length - m8a.sent }));

  const m8b = await markIn(a.dir);
  await P.ACTS.open(el({ "data-act": "open", "data-dir": south.dir }));
  await sleep(30);
  const keptA = (P.S.tabs.find((t) => t.dir === a.dir) || {}).place || {};
  check(wrote(m8b) && !keptA.rv, "wy8b by another tab, the tab left keeping no stale view: " + JSON.stringify({ sent: reverts.length - m8b.sent }));
  await backTo();

  const m8c = await markIn(a.dir);
  await P.ACTS["to-projects"]();
  await sleep(30);
  check(wrote(m8c), "wy8c by the list of catalogs: " + JSON.stringify({ sent: reverts.length - m8c.sent }));
  await backTo();

  const m8d = await markIn(a.dir);
  const closeTab = get(P, "closeTab");
  if (typeof closeTab === "function") await closeTab(a.dir);
  await sleep(30);
  check(wrote(m8d), "wy8d by closing the tab on screen: " + JSON.stringify({ sent: reverts.length - m8d.sent }));
  await backTo();

  const m8e = await markIn(a.dir);
  const closed0 = CLOSED.n;
  const unload = (home.sandbox.heardWindow || []).filter((h) => h.type === "beforeunload");
  unload.forEach((h) => { try { h.fn({ preventDefault() {}, returnValue: true }); } catch (_) { /* not the close's */ } });
  await sleep(120);
  check(wrote(m8e) && CLOSED.n === closed0 + 1, "wy8e by the window's close, which waits for the write and then closes: "
    + JSON.stringify({ sent: reverts.length - m8e.sent, closed: CLOSED.n - closed0 }));

  /* ---- 8, continued: the disc, the list beside the view, the bubble, a drop, Back --------------------------- */

  const m8f = await markIn(a.dir);
  await P.ACTS["disc-review"](el({ "data-act": "disc-review" }));
  await sleep(30);
  check(wrote(m8f), "wy8f by the Review disc: " + JSON.stringify({ sent: reverts.length - m8f.sent }));

  const m8g = await markIn(a.dir);
  const other = ((await wire(S.listProposals(a.dir))).proposals || []).find((p) => p.ok && p.pending > 0 && p.file !== m8g.f);
  if (other) await P.ACTS["rv-open"](el({ "data-act": "rv-open", "data-file": other.file }));
  await sleep(30);
  check(!!other && wrote(m8g) && P.S.rv && P.S.rv.open && P.S.rv.open.file === other.file,
    "wy8g by Open on another file in the list beside the view: " + JSON.stringify({ sent: reverts.length - m8g.sent }));

  const m8h = await markIn(a.dir);
  if (P.ACTS["arrive-review"]) await P.ACTS["arrive-review"](el({ "data-act": "arrive-review", "data-file": m8h.f }));
  await sleep(30);
  check(wrote(m8h), "wy8h by the blue bubble's Review: " + JSON.stringify({ sent: reverts.length - m8h.sent }));

  const m8i = await markIn(a.dir);
  const late = path.join(SCRATCH, "late.csv");
  fs.writeFileSync(late, ["Title,Body EN,Body PL,Category", "Row L0,Text L0,Tekst L0,Delivery", "Row L1,Text L1,Tekst L1,Delivery",
    "Row L2,Text L2,Tekst L2,Delivery", "Row L3,Text L3,Tekst L3,Delivery"].join("\n") + "\n");
  DROPPED.at = late;
  await P.dropTake({ name: "late.csv" });
  await P.ACTS["wiz-land"](el({ "data-act": "wiz-land", "data-v": "one" }));
  await sleep(60);
  DROPPED.at = "";
  check(wrote(m8i), "wy8i by a file dropped into the same project: " + JSON.stringify({ sent: reverts.length - m8i.sent }));

  const m8j = await markIn(a.dir);
  await P.ACTS["rv-back"](el({ "data-act": "rv-back" }));
  await sleep(30);
  check(wrote(m8j) && !(P.S.rv && P.S.rv.open), "wy8j by Back: " + JSON.stringify({ sent: reverts.length - m8j.sent }));

  /* ---- 9. THE PERSON'S OWN EDIT IS SAID AS THEIRS ---------------------------------------------------------- */

  await P.ACTS["disc-review"](el({ "data-act": "disc-review" }));
  await sleep(60);
  const h9 = hand(P);
  if (h9) P.ACTS["stk-a"](el({ "data-act": "stk-a", "data-a": "yes" }));
  const answered9 = !!(h9 && P.S.stack.answers[h9.key]);
  if (h9) await P.ACTS["stk-src"](el({ "data-act": "stk-src", "data-file": h9.file }));
  await sleep(30);
  const c9 = P.S.rv && P.S.rv.open && h9 ? P.S.rv.open.changes.find((c) => c.key === h9.row) : null;
  if (c9) {
    c9.segs = [{ text: "Text ", i: null }, { text: "x", was: "Ex", kind: "reword", i: 0 }];
    c9.lang = "en";
    P.paint();
    await P.ACTS["rv-mark"](el({ "data-act": "rv-mark", "data-k": c9.key, "data-i": "0" }));
  }
  REWRITE.on = true;
  await P.ACTS["rv-back"](el({ "data-act": "rv-back" }));
  await sleep(90);
  REWRITE.on = false;
  const it9 = P.S.stack && h9 ? P.S.stack.items.find((x) => x.key === h9.key) : null;
  const card9 = it9 ? get(P, "stkCardHtml")(it9) : "";
  check(answered9 && !!c9 && !!it9 && !!it9.changed && it9.changed.own && it9.changed.dropped && !P.S.stack.answers[h9.key]
        && textOf(card9).indexOf("You changed this row after answering it, so the earlier answer was dropped.") >= 0
        && textOf(card9).indexOf("sent this again") < 0,
    "wy9 the person's own edit to an answered row drops the answer and says it was theirs: "
    + JSON.stringify({ answered9, changed: it9 && it9.changed }));

  /* ---- 10. AN IMPORT'S ROWS NEEDING NO CHECK, IN ONE PRESS ------------------------------------------------- */

  const st10 = P.S.stack, pile10 = get(P, "stkPile"), restHtml = get(P, "stkRestHtml");
  if (st10) { st10.filter = "import"; st10.hand = null; st10.at = 0; }
  /* The hand on the first row of the import with the most rows waiting. */
  const all10 = pile10 && st10 ? pile10() : [];
  const count10 = (f) => all10.filter((y) => y.file === f).length;
  const x10 = all10.slice().sort((p, q) => count10(q.file) - count10(p.file))[0] || null;
  if (x10) { st10.at = all10.indexOf(x10); st10.hand = x10.key; }
  const same10 = x10 ? pile10().filter((y) => y.kind === "import" && y.file === x10.file) : [];
  /* Two of its rows held for checking first, as a row meeting a card changed here since is (src/review.mjs). */
  same10.slice(0, 2).forEach((y) => { y.held = true; });
  const clean10 = same10.filter((y) => !y.held).map((y) => y.key).sort();
  const words10 = x10 && typeof restHtml === "function" ? textOf(restHtml(x10)) : "";
  if (x10) P.ACTS["stk-a"](el({ "data-act": "stk-a", "data-a": "clean" }));
  const took10 = st10 ? Object.keys(st10.answers).filter((k) => same10.some((y) => y.key === k)).sort() : [];
  check(same10.length >= 3 && clean10.length >= 1 && JSON.stringify(took10) === JSON.stringify(clean10)
        && same10.filter((y) => y.held).every((y) => !st10.answers[y.key]),
    "wy10a the one press takes exactly the import's rows needing no check and leaves every row held for checking first: "
    + JSON.stringify({ took: took10.length, clean: clean10.length, held: same10.length - clean10.length }));
  check(words10.indexOf("Accept clear rows: " + clean10.length + "; to check: 2") >= 0,
    "wy10b it says how many it takes and how many it leaves: " + JSON.stringify(words10));
  /* A teammate's card in the pile, in hand, with no row held: the import's press is neither offered nor taken. */
  const team10 = { key: "row:desk:d1:k", kind: "team", file: "desk-one.ec", row: "k", who: "Desk one", title: "Desk row",
    tag: "Changed", src: "from Desk one", where: "", body: "", held: false, sig: "t" };
  const teamWords = typeof restHtml === "function" ? restHtml(team10) : "";
  let teamTook = -1;
  if (st10) {
    st10.items.unshift(team10); st10.filter = ""; st10.at = 0; st10.hand = team10.key;
    P.ACTS["stk-a"](el({ "data-act": "stk-a", "data-a": "clean" }));
    teamTook = st10.answers[team10.key] ? 1 : 0;
    st10.items.splice(st10.items.indexOf(team10), 1);
  }
  check(teamWords.indexOf('data-a="clean"') < 0 && teamTook === 0,
    "wy10c and it is never offered on a teammate's proposal, nor taken there: " + JSON.stringify({ words: textOf(teamWords), teamTook }));

  /* ---- 11. THE PRESSES ARE WRITTEN ONCE ------------------------------------------------------------------ */

  const gate = () => { let open; GATE.p = new Promise((r) => { open = r; }); return () => { GATE.p = null; open(); }; };
  await backTo();
  const m11a = await markIn(a.dir);
  let release = gate();
  const back1 = P.ACTS["rv-back"](el({ "data-act": "rv-back" }));
  const back2 = P.ACTS["rv-back"](el({ "data-act": "rv-back" }));
  await sleep(30);
  release();
  await Promise.all([back1, back2]);
  await sleep(30);
  check(wrote(m11a), "wy11a Back pressed twice while its write is out sends one write: " + JSON.stringify({ sent: reverts.length - m11a.sent }));

  await backTo();
  const m11b = await markIn(a.dir);
  release = gate();
  const back3 = P.ACTS["rv-back"](el({ "data-act": "rv-back" }));
  await sleep(10);
  await P.ACTS.section(el({ "data-act": "section", "data-v": "cards" }));
  await sleep(30);
  release();
  await back3;
  await sleep(30);
  check(wrote(m11b), "wy11b the rail pressed while Back's write is out sends nothing more: " + JSON.stringify({ sent: reverts.length - m11b.sent }));

  /* ---- 12. THE VERB ITSELF IS IDEMPOTENT ------------------------------------------------------------------ */

  const twin = await S.newProject(root, "Twin shop", L);
  const twinBody = "AAA one BBB one CCC";
  const twinWrite = () => {
    const cat = { id: "twin-catalog", name: "twin", langs: [{ code: "en" }],
      cards: [{ id: "c-twin", title: { en: "Twin" }, body: { en: twinBody }, bodyShape: "plain" }] };
    const report = { marks: [{ card: "c-twin", lang: "en", marks: [{ at: 4, len: 3, was: "uno", kind: "reword" },
      { at: 12, len: 3, was: "uno", kind: "reword" }] }] };
    return writeTextImport(path.join(twin.dir, "inbox"), "twin.ec", cat, report).at;
  };
  const call = [{ card: "c-twin", lang: "en", marks: [{ text: "one", was: "uno", n: 0 }], seen: twinBody }];
  const twinAt = twinWrite();
  await S.revertProposalMarks(twin.dir, twinAt, call);
  const once1 = read(path.dirname(twinAt), "twin.ec").cards[0].body.en;
  let again12 = "";
  try { await S.revertProposalMarks(twin.dir, twinAt, call); } catch (e) { again12 = String(e && e.message || e); }
  const twice = read(path.dirname(twinAt), "twin.ec").cards[0].body.en;
  const marksLeft = (read(path.dirname(twinAt), "twin.lint.json").marks || []).reduce((n, m) => n + m.marks.length, 0);
  /* The same call a second time is refused in words where a twin of the passage is still marked (wy21), as it is a press in a view the file
     has moved on from; the body and its marks are what wy12a holds. */
  check(once1 === "AAA uno BBB one CCC" && twice === once1 && /changed in another window after it was shown here/.test(again12) && marksLeft === 1,
    "wy12a the same call twice leaves the body and its marks as one call does, the second refused in words where a twin is still marked: " + JSON.stringify({ once1, twice, again12, marksLeft }));
  twinWrite();
  await S.revertProposalMarks(twin.dir, twinAt, [{ card: "c-twin", lang: "en", marks: [1] }]);
  const byIndex = read(path.dirname(twinAt), "twin.ec").cards[0].body.en;
  check(byIndex === "AAA one BBB uno CCC", "wy12b a bare index still puts back the passage it names: " + JSON.stringify(byIndex));

  /* ---- 13. THE PROBE: A PRESS MADE WHILE BACK'S WRITE IS OUT, WITH THE REAL VERB ---------------------------------- */

  const penBody = "AAA one BBB two CCC three DDD";
  const penDir = path.join(twin.dir, "inbox");
  const penCat = { id: "pen-catalog", name: "pen", langs: [{ code: "en" }],
    cards: [{ id: "c-pen", title: { en: "Pen" }, body: { en: penBody }, bodyShape: "plain" }] };
  penCat.hash = (await Engine.format()).contentHash(penCat);
  writeTextImport(penDir, "pen.ec", penCat,
    { kind: "etiuda-studio-text-import-report", marks: [{ card: "c-pen", lang: "en", marks: [{ at: 4, len: 3, was: "uno", kind: "reword" },
      { at: 12, len: 3, was: "dos", kind: "reword" }, { at: 20, len: 5, was: "tres", kind: "reword" }] }] });
  const penAt = path.join(penDir, "pen.ec");
  await P.ACTS.open(el({ "data-act": "open", "data-dir": twin.dir }));
  await sleep(30);
  await P.ACTS.section(el({ "data-act": "section", "data-v": "proposals" }));
  await sleep(60);
  await P.ACTS["rv-open"](el({ "data-act": "rv-open", "data-file": penAt }));
  const cPen = P.S.rv && P.S.rv.open ? P.S.rv.open.changes.find((c) => c.id === "c-pen" && c.segs) : null;
  const press = (i) => P.ACTS["rv-mark"](el({ "data-act": "rv-mark", "data-k": cPen.key, "data-i": String(i) }));
  REAL.on = true;
  if (cPen) {
    await press(0);
    release = gate();
    const back13 = P.ACTS["rv-back"](el({ "data-act": "rv-back" }));
    await sleep(10);
    await press(1);
    await P.ACTS.section(el({ "data-act": "section", "data-v": "cards" }));
    await sleep(10);
    release();
    await back13;
    await sleep(60);
  }
  REAL.on = false;
  const penNow = (read(penDir, "pen.ec") || { cards: [{ body: {} }] }).cards[0].body.en;
  check(!!cPen && penNow === "AAA uno BBB dos CCC three DDD",
    "wy13 the probe: two passages chosen, Back's write held out between them, and the body holds exactly those two put back: "
    + JSON.stringify({ penNow, open: !!(P.S.rv && P.S.rv.open), err: P.S.err && (P.S.err.error || P.S.err), lang: cPen ? cPen.lang || "-" : "-",
      segs: cPen && cPen.segs ? cPen.segs.length : 0 }));

  /* ---- 14. A SHARED CARD'S PARTS CARRY ITS HELD FLAG ------------------------------------------------------------ */

  const stkParts = get(P, "stkParts");
  const group = { key: "kept:g", kind: "team", verdict: "yes", card: { title: "Shared", held: true, sig: "s" },
    members: [{ file: "a.ec", row: "r1", sig: "s1" }, { file: "b.ec", row: "r2", sig: "s2" }] };
  if (!P.S.stack) P.S.stack = { files: {}, answers: {}, items: [] };
  const parts14 = typeof stkParts === "function" ? stkParts([group]) : [];
  check(parts14.length === 2 && parts14.every((x) => x.card && x.card.held === true && x.group === group),
    "wy14 every keeper's part of a held shared card carries the held flag: " + JSON.stringify(parts14.map((x) => x.card)));

  /* ---- 15. A PRESS MADE WHILE BACK'S WRITE IS OUT IS WRITTEN TOO ------------------------------------------------ */

  await backTo();
  const m15 = await markIn(a.dir);
  m15.c.segs = [{ text: "Text ", i: null }, { text: "x", was: "Ex", kind: "reword", i: 0 }, { text: " and ", i: null },
    { text: "y", was: "Why", kind: "reword", i: 1 }];
  release = gate();
  const back15 = P.ACTS["rv-back"](el({ "data-act": "rv-back" }));
  await sleep(10);
  await P.ACTS["rv-mark"](el({ "data-act": "rv-mark", "data-k": m15.c.key, "data-i": "1" }));
  release();
  await back15;
  await sleep(30);
  const last15 = reverts[reverts.length - 1];
  check(reverts.length === m15.sent + 2 && last15 && JSON.stringify(last15.reverts[0].marks) === JSON.stringify([{ text: "y", was: "Why", n: 0 }]),
    "wy15 the press made while Back's write was out is written too before the view goes: "
    + JSON.stringify({ sent: reverts.length - m15.sent, last: last15 && last15.reverts }));

  /* ---- 16. A REFUSED WRITE NEVER UNDOES A LATER CHOICE ---------------------------------------------------------- */

  await backTo();
  const m16 = await markIn(a.dir);
  REFUSE.on = true;
  release = gate();
  const back16 = P.ACTS["rv-back"](el({ "data-act": "rv-back" }));
  await sleep(10);
  await P.ACTS["rv-mark"](el({ "data-act": "rv-mark", "data-k": m16.c.key, "data-i": "0" }));
  await P.ACTS["rv-mark"](el({ "data-act": "rv-mark", "data-k": m16.c.key, "data-i": "0" }));
  release();
  await back16;
  await sleep(30);
  REFUSE.on = false;
  const kept16 = P.S.rv && P.S.rv.reverted && P.S.rv.reverted[m16.c.key];
  check(!!(P.S.rv && P.S.rv.open) && !!kept16 && kept16["0"] === false && !!P.S.err,
    "wy16 pressed twice during a refused write, the passage stays as last chosen, its proposed words, and the refusal is said: "
    + JSON.stringify({ kept: kept16, err: !!P.S.err }));
  P.S.err = null;

  /* ---- 18 to 20. THE GROK REVIEW KAPPA, AS VERIFIED ------------------------------------------------------------ */

  /* 18. The log refuses the decision: the draft goes back, the file waits. The log is there and read, and read-only, so the
     write that replaces it is refused (Windows refuses a rename over a read-only file) after the draft has been written. */
  const logged = await S.newProject(root, "Log shop", L);
  await carded(logged.dir);
  const l18 = await S.importLand(root, csv, {}, logged.dir);
  const draftAt18 = path.join(logged.dir, DRAFT_FILE);
  const draft18 = fs.readFileSync(draftAt18, "utf8");
  const o18 = await wire(S.openProposal(logged.dir, l18.file, {}));
  const dec18 = {};
  ((o18 && o18.changes) || []).forEach((c, n) => { dec18[c.key] = n === 0 ? "reject" : "accept"; });
  const logAt18 = path.join(logged.dir, "review-log.json");
  fs.writeFileSync(logAt18, JSON.stringify({ kind: "etiuda-studio-review-log", schema: 1, reviews: [], decided: [] }), "utf8");
  fs.chmodSync(logAt18, 0o444);
  const r18 = await wire(S.decideProposal(logged.dir, l18.file, dec18, "rows.csv", null));
  fs.chmodSync(logAt18, 0o666);
  check(!!(o18 && o18.ok) && Object.keys(dec18).length > 1 && !!(r18 && (r18.error || !r18.ok))
        && fs.readFileSync(draftAt18, "utf8") === draft18 && fs.existsSync(l18.file),
    "wy18 a decision the log refuses leaves the draft as it was and the file waiting: " + JSON.stringify({ refused: !!(r18 && (r18.error || !r18.ok)),
      same: fs.readFileSync(draftAt18, "utf8") === draft18, waiting: fs.existsSync(l18.file) }));

  /* 19. A file past 64 MB in the inbox is refused by its name. */
  const hugeAt = path.join(twin.dir, "inbox", "huge.json");
  fs.writeFileSync(hugeAt, Buffer.alloc(64 * 1024 * 1024 + 1024, 32));
  const l19 = await wire(S.listProposals(twin.dir));
  const row19 = ((l19 && l19.proposals) || []).find((x) => x.name === "huge.json");
  check(!!row19 && !row19.ok && /huge\.json is larger than 64 MB, so Etiuda does not read it/.test(String(row19.refusal)),
    "wy19 an inbox file past 64 MB is listed as refused, by its name: " + JSON.stringify(row19 && row19.refusal));
  fs.writeFileSync(hugeAt, "");

  /* 20. Bring in's format 1 reader (src/engine.mjs readCatalogV1), which its door and its upgrade ask. */
  const literalAt = path.join(SCRATCH, "hand.js"), programAt = path.join(SCRATCH, "program.js");
  fs.writeFileSync(literalAt, "/* by hand */ window.PB_CATALOG = {format: 1, kind: 'playbook-catalog', cards: [{id: 'a', title: {en: 'A'},},], };");
  fs.writeFileSync(programAt, "window.PB_CATALOG = {format: 1, kind: 'playbook-catalog', cards: [], n: 1 + 1};");
  const v1 = Engine.readCatalogV1();
  let k20a = null, k20b = "";
  try { k20a = v1(literalAt); } catch (e) { k20a = null; }
  try { v1(programAt); k20b = "read"; } catch (e) { k20b = "refused"; }
  check(!!k20a && k20a.cards && k20a.cards[0].id === "a" && k20b === "refused",
    "wy20 Bring in reads a hand-written catalog as data and refuses a file that would have to run: " + JSON.stringify([k20a && k20a.cards, k20b]));

  /* ---- 21. A PRESS IN AN OLDER WINDOW IS NEVER LOST SILENTLY (the test architect's R2) ---------------------------------- */

  /* Two windows on one proposal. This one read the body before the other put back a different passage; its press on a passage
     still marked is refused in words (nothing written, the file as the other window left it), a press on a passage already put
     back is the same as the other's and stays answered, and a press made again against the newer state lands. */
  const oldBody = "AAA one BBB two CCC";
  const oldWrite = async () => {
    const cat = { id: "old-catalog", name: "old", langs: [{ code: "en" }],
      cards: [{ id: "c-old", title: { en: "Old" }, body: { en: oldBody }, bodyShape: "plain" }] };
    cat.hash = (await Engine.format()).contentHash(cat);
    const report = { kind: "etiuda-studio-text-import-report", marks: [{ card: "c-old", lang: "en", marks: [{ at: 4, len: 3, was: "uno", kind: "reword" },
      { at: 12, len: 3, was: "dos", kind: "reword" }] }] };
    return writeTextImport(penDir, "old.ec", cat, report).at;
  };
  const oldAt = await oldWrite();
  const pressOf = (text, was, seen) => [{ card: "c-old", lang: "en", marks: [{ text, was, n: 0 }], seen }];
  const bodyOf = () => read(penDir, "old.ec").cards[0].body.en;
  const marksOf = () => (read(penDir, "old.lint.json").marks || []).reduce((n, m) => n + m.marks.length, 0);
  await S.revertProposalMarks(twin.dir, oldAt, pressOf("two", "dos", oldBody));
  const mid21 = bodyOf();
  const late21 = await wire(S.revertProposalMarks(twin.dir, oldAt, pressOf("one", "uno", oldBody)));
  check(mid21 === "AAA one BBB dos CCC" && !!late21.error && !!late21.said && /changed in another window after it was shown here/.test(String(late21.error))
        && bodyOf() === mid21 && marksOf() === 1,
    "wy21a a press on a passage still marked, in a view read before another window wrote, is refused in words and writes nothing: "
    + JSON.stringify({ mid21, error: late21.error, said: !!late21.said, body: bodyOf(), marks: marksOf() }));
  const gone21 = await wire(S.revertProposalMarks(twin.dir, oldAt, pressOf("two", "dos", oldBody)));
  check(!gone21.error && gone21.ok && gone21.reverted === 0 && bodyOf() === mid21,
    "wy21b CONTROL: a press on a passage the other window already put back is answered, as it was, and changes nothing: " + JSON.stringify(gone21));
  const fresh21 = await wire(S.revertProposalMarks(twin.dir, oldAt, pressOf("one", "uno", mid21)));
  check(!fresh21.error && fresh21.reverted === 1 && bodyOf() === "AAA uno BBB dos CCC" && marksOf() === 0,
    "wy21c pressed again against the newer state, the passage is put back: " + JSON.stringify({ fresh21, body: bodyOf(), marks: marksOf() }));

  /* The page: the refusal is said, the view is read again from the file, and the held press is not kept to be refused again. */
  await oldWrite();
  await P.ACTS.open(el({ "data-act": "open", "data-dir": twin.dir }));
  await sleep(30);
  await P.ACTS.section(el({ "data-act": "section", "data-v": "proposals" }));
  await sleep(60);
  await P.ACTS["rv-open"](el({ "data-act": "rv-open", "data-file": oldAt }));
  const cOld = () => (P.S.rv && P.S.rv.open ? P.S.rv.open.changes.find((c) => c.id === "c-old" && c.segs) : null);
  const c21 = cOld();
  if (c21) await P.ACTS["rv-mark"](el({ "data-act": "rv-mark", "data-k": c21.key, "data-i": "0" }));
  await S.revertProposalMarks(twin.dir, oldAt, pressOf("two", "dos", oldBody));
  REAL.on = true;
  await P.ACTS["rv-back"](el({ "data-act": "rv-back" }));
  await sleep(60);
  REAL.on = false;
  const view21 = cOld();
  const said21 = P.errText ? P.errText() : "";
  check(!!c21 && /changed in another window after it was shown here/.test(said21) && !!view21 && bodyOf() === "AAA one BBB dos CCC"
        && !!P.S.rv.open && Object.keys(P.S.rv.reverted || {}).length === 0
        && view21.segs.filter((x) => x.i !== null && x.i !== undefined).length === 1,
    "wy21d the page says it, shows the passage as the file now holds it, and keeps no press to be refused again: "
    + JSON.stringify({ said21, open: !!P.S.rv.open, held: P.S.rv.reverted, segs: view21 && view21.segs }));
  if (view21) await P.ACTS["rv-mark"](el({ "data-act": "rv-mark", "data-k": view21.key, "data-i": String(view21.segs.find((x) => x.i !== null && x.i !== undefined).i) }));
  REAL.on = true;
  await P.ACTS["rv-back"](el({ "data-act": "rv-back" }));
  await sleep(60);
  REAL.on = false;
  check(bodyOf() === "AAA uno BBB dos CCC" && !P.S.err,
    "wy21e and pressed again in that view, the passage is put back and Back goes through: " + JSON.stringify({ body: bodyOf(), err: P.S.err && (P.S.err.frame || P.S.err.error || P.S.err) }));
  P.S.err = null;

  /* In Polish, the refusal's sentence is the table's, and an English page says the frame as it stands. */
  const frame21 = late21 && late21.said ? late21.said.frame : "";
  const pl21 = loadPage({ api: {}, uiLang: "pl", source }).page, en21 = loadPage({ api: {}, uiLang: "en", source }).page;
  pl21.S.err = late21.said; en21.S.err = late21.said;
  check(!!frame21 && en21.errText() === frame21 && /^Niczego nie przywrócono: ten fragment zmienił się w innym oknie/.test(pl21.errText()),
    "wy21f in Polish the refusal reads as the table's sentence, in English as the frame: " + JSON.stringify([en21.errText(), pl21.errText()]));

  /* ---- THE PLANTS -------------------------------------------------------------------------------- */

  if (process.env.TRIAGE_LEG) return finish(argv, true);
  copyPlants({
    root: ROOT, self: fileURLToPath(import.meta.url), label: "triage", onlyVar: "TRIAGE_LEG",
    plants: [
      { mark: "wy-line", leg: "wy2c", rel: "ui/app.js", line: "" },
      { mark: "wy-seg", leg: "wy2b", rel: "ui/app.js", line: "      + '<td style=\"text-align:right\"><span data-act=\"rv-decide\" data-v=\"accept\">' + (c.decided" },
      { mark: "wy-want", leg: "wy3a", rel: "ui/app.js", line: "" },
      { mark: "wy-flush", leg: "wy3b", rel: "ui/app.js", line: "" },
      { mark: "wy-apply", leg: "wy4b", rel: "ui/app.js", line: "      const r = { ok: true, accepted: [], rejected: [] };" },
      { mark: "wy-door", leg: "wy5b", rel: "ui/app.js", line: "" },
      { mark: "wy-rail", leg: "wy8a", rel: "ui/app.js", line: "" },
      { mark: "wy-leave", leg: "wy8b", rel: "ui/app.js", line: "" },
      { mark: "wy-leave", leg: "wy8c", rel: "ui/app.js", line: "" },
      { mark: "wy-leave", leg: "wy8d", rel: "ui/app.js", line: "" },
      { mark: "wy-close", leg: "wy8e", rel: "ui/app.js", line: "    const presses = false;" },
      { mark: "wy-load", leg: "wy8f", rel: "ui/app.js", line: "" },
      { mark: "wy-opened", leg: "wy8g", rel: "ui/app.js", line: "" },
      { mark: "wy-rvload", leg: "wy8h", rel: "ui/app.js", line: "" },
      { mark: "wy-load", leg: "wy8i", rel: "ui/app.js", line: "" },
      { mark: "wy-back", leg: "wy8j", rel: "ui/app.js", line: "      if (false) return;" },
      { mark: "wy-own", leg: "wy9", rel: "ui/app.js", line: "        st.changed[x.key] = { who: x.who, at: x.at, dropped: !!held, own: false };" },
      { mark: "wy-clean-held", leg: "wy10a", rel: "ui/app.js", line: "      );" },
      { mark: "wy-clean-words", leg: "wy10b", rel: "ui/app.js", line: "        + esc(T(\"Accept clear rows: {N}\", { N: clean.length }))" },
      { mark: "wy-clean-kind", leg: "wy10c", rel: "ui/app.js", line: "    if (!x) return [];" },
      { mark: "wy-once", leg: "wy11a", rel: "ui/app.js", line: "" },
      { mark: "wy-once", leg: "wy11b", rel: "ui/app.js", line: "" },
      { mark: "rv-seen", leg: "wy12a", rel: "src/studio.mjs", line: "    const stale = false;" },
      { mark: "wy-applied", leg: "wy13", rel: "ui/app.js", line: "      if (back && !back.error) { stkOwnEdit(file); return true; }" },
      { mark: "wy-held-part", leg: "wy14", rel: "ui/app.js", line: "    recs.forEach((r) => (r.members || []).forEach((m) => parts.push(Object.assign({}, r, { key: r.key + \"|\" + m.file, file: m.file, row: m.row, open: S.stack.files[m.file] || null, card: { sig: m.sig }, group: r }))));" },
      { mark: "wy-all", leg: "wy15", rel: "ui/app.js", line: "" },
      { mark: "wy-newest", leg: "wy16", rel: "ui/app.js", line: "      if (on[i]) delete on[i]; else on[i] = true;" },
      { mark: "k-commit", leg: "wy18", rel: "src/review.mjs", line: "" },
      { mark: "k-cap", leg: "wy19", rel: "src/studio.mjs", line: "    return fs.promises.stat(f).then((st) => (false ? TOO_BIG" },
      { mark: "rv-said", leg: "wy21a", rel: "src/studio.mjs", line: "    const stillMarked = false;" },
      { mark: "wy-reread", leg: "wy21d", rel: "ui/app.js", line: "" },
      { mark: "k-data", leg: "wy20", rel: "src/engine.mjs", line: "    fs.readFileSync, (code) => createRequire(import.meta.url)(\"node:vm\").runInNewContext(code, Object.create(null), { timeout: 5000 }), true," },
    ],
    check, skip,
  });
  return finish(argv);
}

function finish(argv, child) {
  process.stdout.write("\ntriage  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  if (!child && asserted !== EXPECTED) {
    process.stdout.write("triage  expected " + EXPECTED + " assertions, ran " + asserted + "\n");
    failed++;
  }
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "triage");
  else process.stdout.write("triage  kept " + SCRATCH + "\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stdout.write("triage  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
