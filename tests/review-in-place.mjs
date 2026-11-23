/* REVIEW IN PLACE (board 862): node tests/review-in-place.mjs [--keep].
 *
 * A file arriving in the inbox while Studio is open is noticed and said: the rail's count, a line in the status bar and,
 * for a desk's file, the blue bubble beside the Proposals row. Its review opens beside the list it came from and an edit
 * reads as one. The page runs on tests/page-stand-in.mjs over the real verbs of src/studio.mjs.
 *
 *   rp1  opened, the review stands beside the list, and every first reading of #main (h1, table) is still the review's
 *   rp3  an edit reads as one: the words that went struck, the words that came in; a row with the marker pen's marks keeps them
 *   rp4  a desk's file waiting that was not waiting at the last reading raises the bubble, says so and puts a line in the
 *        status bar; the first reading of a project and a reading with nothing new raise nothing; a file no desk sent is
 *        counted and said in the status bar with no bubble
 *   rp5  the bubble's Review opens that file beside the list; Later takes the bubble down and leaves the line
 *   rp7  in Polish
 *
 * RETIRED WITH BOARD 1016 ITEM 7 (the stack is the one way to decide, and the proposal's table a view), old and then new:
 *   rp1a "the review stands first, its own h1 and lede leading" - the lede said how many rows were decided here, and nothing
 *        is decided here now: "its own h1 leading, then its facts".
 *   rp2a "a decided row folds to one line saying what was decided, with Undo" and rp2b "Undo takes it back to undecided" - a
 *        row decides nothing, so nothing folds; tests/triage.mjs wy2b holds that no control on the table decides.
 *   rp6a "Land in place writes what was accepted and says it over the list" and rp6b "the file with nothing left reads
 *        Decided" - the table has no Land; the stack's Apply writes, tests/triage.mjs wy4 and tests/review-door.mjs rd24, and
 *        a file applied whole says so there, rd47.
 *
 * WHAT IT CANNOT SEE: the timer that reads the inbox (the stand-in's timers are the leg's own), the bubble's placement (the
 * engine's placer is not imported into the vm), and every motion. Maxim's eye on the preview is the oracle for those.
 *
 * PROVED BY MAKING IT FAIL: INPLACE_APP=<a copy of ui/app.js> reads that copy instead.
 *
 * Node only, no window, no Electron. Exit 0 when every check holds, 1 when any fails.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as S from "../src/studio.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { loadPage } from "./page-stand-in.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "review-in-place");
const EXPECTED = 13;
const source = process.env.INPLACE_APP ? fs.readFileSync(path.resolve(process.env.INPLACE_APP), "utf8") : undefined;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}
const wire = (p) => Promise.resolve(p)
  .then(v => JSON.parse(JSON.stringify(Object.assign({ error: null }, v))))
  .catch(e => ({ error: e && e.message ? e.message : String(e), said: (e && e.said) || null, disk: !!(e && e.disk) }));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const el = (attrs) => ({ getAttribute: (k) => (attrs[k] == null ? null : attrs[k]) });
const NB = String.fromCharCode(160);
const plain = (s) => String(s == null ? "" : s).split(NB).join(" ");
const textOf = (html) => plain(String(html || "").replace(/<[^>]*>/g, ""));

function pageOver(root, uiLang) {
  const api = {
    newProject: (n, l, o) => wire(S.newProject(root, n, l, o)),
    open: (d) => wire(S.openProject(d)),
    projects: () => wire(S.listProjects(root)),
    proposals: (d) => wire(S.listProposals(d)),
    proposalOpen: (d, f, l) => wire(S.openProposal(d, f, { lang: l })),
    proposalDecide: (d, f, dec, from, note) => wire(S.decideProposal(d, f, dec, from, note)),
    proposalRevert: (d, f, r) => wire(S.revertProposalMarks(d, f, r)),
    tabs: () => Promise.resolve({ error: null }),
    importPlan: (f, o, i) => wire(S.importPlan(root, f, o || {}, i || "")),
    importLand: (f, o, i, fingerprint) => wire(S.importLand(root, f, o || {}, i || "", fingerprint)),
    cardHistory: (d, i) => wire(S.cardHistory(d, i)),
    discardUntouched: (d) => wire(S.discardUntouched(d)),
  };
  const home = loadPage({ api, uiLang, source });
  home.page.S.host = { tour: { offered: true }, langs: S.builtLangs() };
  return { P: home.page, home };
}

async function main(argv) {
  clearScratch(SCRATCH);
  const root = path.join(SCRATCH, "projects");
  fs.mkdirSync(root, { recursive: true });
  const L = [{ code: "en" }, { code: "pl" }];
  const a = await S.newProject(root, "North shop", L);
  await S.addTag(a.dir, "shelf", { en: "Delivery", pl: "Dostawa" });
  const csv = path.join(SCRATCH, "rows.csv");
  fs.writeFileSync(csv, ["Title,Body EN,Body PL,Category", "Row 0,Text 0,Tekst 0,Delivery", "Row 1,Text 1,Tekst 1,Delivery"]
    .join("\n") + "\n");
  const landed = await S.importLand(root, csv, {}, a.dir);

  const { P, home } = pageOver(root, "en");
  const names = ["rvRow", "rvAsideHtml", "inboxBase", "inboxTook", "arriveShow", "arriveHide"];
  await P.ACTS["to-projects"]();
  if (!names.every((n) => typeof P[n] === "function")) {
    check(false, "rp1 the page has no review in place (" + names.join(", ") + ")");
    return finish(argv);
  }
  await P.ACTS.open(el({ "data-act": "open", "data-dir": a.dir }));
  await sleep(30);

  /* ---- 1. BESIDE THE LIST ----------------------------------------------------------------------- */

  await P.ACTS.section(el({ "data-act": "section", "data-v": "proposals" }));
  await sleep(30);
  await P.ACTS["rv-open"](el({ "data-act": "rv-open", "data-file": landed.file }));
  const page = () => home.node("#main").innerHTML;
  const h = page(), main = h.indexOf('class="rv-main"'), aside = h.indexOf('class="rv-aside"');
  check(/^<div class="pad rv-in"><div class="rv-main"><h1>rows\.ec<\/h1><div class="pane"[^>]*><div class="facts">/.test(h) && main > 0 && aside > main,
    "rp1a the review stands first, its own h1 leading, then its facts, and the list after it as an aside");
  const side = h.slice(aside);
  check(!/<h1|<table|class="lede"|class="dashed"/.test(side) && /class="rv-file cur" aria-current="true"><span class="nm">rows\.ec/.test(side),
    "rp1b the aside holds the list with the open file marked, and no h1, table, lede or dashed box a reading of #main would take first");

  /* ---- 3. AN EDIT --------------------------------------------------------------------------------- */

  const edit = { key: "card:c-x:body.en", op: "change", scope: "card", kind: "card", id: "c-x", path: "body.en", title: "Holding",
    was: "I will be back with you in two or three minutes.", becomes: "I will be back with you in a few minutes.",
    decided: false, conflict: false, also: null, lang: "en", segs: null };
  const r3 = P.rvRow(edit);
  check(/<p class="ed" aria-hidden="true">I will be back with you in <del>two or three<\/del> <ins>a few<\/ins> minutes\.<\/p>/.test(r3)
        && /<div class="stack sr">/.test(r3),
    "rp3a an edit reads as one, and its two sides stay for a screen reader");
  const marked = Object.assign({}, edit, { segs: [{ i: null, text: "I will be back with you in " }, { i: 0, text: "a few", was: "two or three" },
    { i: null, text: " minutes." }] });
  check(!/class="ed"/.test(P.rvRow(marked)) && /class="mk"/.test(P.rvRow(marked)),
    "rp3b CONTROL: a row with the marker pen's marks keeps them and is not read a second way");

  /* ---- 4. A FILE ARRIVES --------------------------------------------------------------------------- */

  await P.ACTS.section(el({ "data-act": "section", "data-v": "cards" }));
  const anna = { ok: true, pending: 3, file: path.join(a.dir, "inbox", "anna.ec"), name: "anna.ec", desk: { name: "Anna" },
    proposes: { changes: 3 } };
  const listed = (await S.listProposals(a.dir)).proposals;
  const first = P.inboxTook(a.dir, { proposals: listed.concat([anna]), inbox: "x" });
  P.inboxBase("elsewhere", { proposals: [] });
  check(first.length === 1, "rp4a (control setup) a reading against a baseline of this project finds the new file");
  P.inboxBase(a.dir, { proposals: listed });
  P.S.arrived = false; home.node("#arrive").hidden = true;
  const none = P.inboxTook("C:/another", { proposals: [anna] });
  check(none.length === 0 && P.S.arrived === false && home.node("#arrive").hidden === true,
    "rp4b the first reading of another project raises nothing");
  P.inboxBase(a.dir, { proposals: listed });
  const come = P.inboxTook(a.dir, { proposals: listed.concat([anna]), inbox: "x" });
  check(come.length === 1 && home.node("#arrive").hidden === false && home.node("#arriveTitle").textContent === "A file from a teammate"
        && plain(home.node("#arriveBody").textContent) === "Anna proposes changes to North shop: 3 changes."
        && home.node("#arriveLine").textContent === "Nothing is written until you land them."
        && home.node("#arriveReview").textContent === "Review" && home.node("#arriveLater").textContent === "Later",
    "rp4c a desk's file raises the bubble: " + JSON.stringify(plain(home.node("#arriveBody").textContent)));
  const said4 = plain(home.node("#said").textContent);
  P.paint();
  check(said4 === "Anna proposes changes to North shop: 3 changes."
        && /Proposals: \d+ files?/.test(textOf(home.node("#sbLeft").innerHTML)),
    "rp4d it is said, and the status bar holds a line for it: " + JSON.stringify(textOf(home.node("#sbLeft").innerHTML).slice(-24)));
  const again = P.inboxTook(a.dir, { proposals: listed.concat([anna]), inbox: "x" });
  check(again.length === 0, "rp4e CONTROL: the same reading again raises nothing");
  P.arriveHide(); P.S.arrived = false;
  const agent = { ok: true, pending: 2, file: path.join(a.dir, "inbox", "agent.ec"), name: "agent.ec", desk: null };
  const plainFile = P.inboxTook(a.dir, { proposals: listed.concat([anna, agent]), inbox: "x" });
  check(plainFile.length === 1 && home.node("#arrive").hidden === true && P.S.arrived === true,
    "rp4f a file no desk sent is counted and given the status bar's line, and no bubble");

  /* ---- 5. THE BUBBLE'S ANSWERS ---------------------------------------------------------------------- */

  P.inboxBase(a.dir, { proposals: [] });
  const real = (await S.listProposals(a.dir)).proposals.map((p) => Object.assign({}, p, { desk: { name: "Anna" } }));
  P.inboxTook(a.dir, { proposals: real, inbox: "x" });
  await P.ACTS["arrive-later"](el({ "data-act": "arrive-later" }));
  check(home.node("#arrive").hidden === true && P.S.arrived === true, "rp5a Later takes the bubble down and leaves the line");
  P.arriveShow(real[0]);
  await P.ACTS["arrive-review"](el({ "data-act": "arrive-review", "data-file": landed.file }));
  await sleep(30);
  check(P.S.section === "proposals" && P.S.rv && P.S.rv.open && P.S.rv.open.file === landed.file
        && /class="rv-aside"/.test(page()) && home.node("#arrive").hidden === true && P.S.arrived === false,
    "rp5b Review opens that file beside the list and the line goes");

  /* ---- 7. IN POLISH ---------------------------------------------------------------------------------- */

  const pl = pageOver(root, "pl");
  await pl.P.ACTS["to-projects"]();
  await pl.P.ACTS.open(el({ "data-act": "open", "data-dir": a.dir }));
  await sleep(30);
  pl.P.inboxBase(a.dir, { proposals: [] });
  pl.P.inboxTook(a.dir, { proposals: [anna], inbox: "x" });
  check(pl.home.node("#arriveTitle").textContent === "Nowy plik od członka zespołu"
        && plain(pl.home.node("#arriveBody").textContent) === "Anna proponuje zmiany w katalogu North shop: 3 zmiany."
        && pl.home.node("#arriveReview").textContent === "Przejrzyj" && pl.home.node("#arriveLater").textContent === "Później",
    "rp7 in Polish: " + JSON.stringify(plain(pl.home.node("#arriveBody").textContent)));

  return finish(argv);
}

function finish(argv) {
  process.stdout.write("\nreview-in-place  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  if (asserted !== EXPECTED) {
    process.stdout.write("review-in-place  expected " + EXPECTED + " assertions, ran " + asserted + "\n");
    failed++;
  }
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "review-in-place");
  else process.stdout.write("review-in-place  kept " + SCRATCH + "\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stdout.write("review-in-place  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
