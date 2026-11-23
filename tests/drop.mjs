/* DROP, THEN TRIAGE: A FILE DROPPED ON A PROJECT'S WINDOW (board 862): node tests/drop.mjs [--keep].
 *
 * A file held over a project's window raises the veil; let go, its path is kept by the shell as the import's choice
 * (studio:import-dropped, read off the File by the preload) and the wizard opens on it, into the project on screen.
 * An import into this project ends at one door, Go through them, sending the rows to Proposals and opening the stack on
 * them. The page runs on tests/page-stand-in.mjs over the real verbs of src/studio.mjs on a scratch root.
 *
 *   dr1  the veil names the project the file goes into and the promise, in English and in Polish
 *   dr2  a file taken opens the wizard on it, into the project on screen, and a screen reader hears what was read
 *   dr3  a drop the shell answered with no file opens nothing and leaves the screen as it was
 *   dr4  the window takes a drop only on a project's own screen: not the projects list, a cover, the tour, the places, or
 *        a wizard already under way
 *   dr5  the foot of an import into this project offers its one door with its key, never Accept all; a new project's import
 *        keeps its own
 *   dr6  the door sends the rows to Proposals and opens the stack on them, nothing answered and the draft untouched (a
 *        project with a card: one with none takes the rows directly, fd5)
 *   dr7  Enter is the door's key, and Shift A no longer opens anything
 *
 * MOVED WITH BOARD 1016 ITEM 7 (the stack is the one way to decide; the import's Accept all and the walk went), old and new:
 *   dr5a "the foot ... offers the two doors with their keys" - "offers its one door with its key, never Accept all".
 *   dr5b "and on its second cover, beside Back" - the same, of the one door.
 *   dr6a "Accept all sends the rows to Proposals and opens them" - "the door sends the rows to Proposals and opens the stack
 *        on them".
 *   dr6b "every waiting row is ticked" - "nothing is answered for the person: each row waits in the stack".
 *   dr7  "Go through them opens the rows with none decided" - that is dr6 now; dr7 is the door's keys.
 *   dr8  a project with no card says the two ways in: the corner's + and a dropped file; one with a card does not; a save's
 *        counts land on the counts line and leave that one
 *   fd5  "Import into this catalog" lands in this project (Argon's first-day review, F5): with a sample project in the list,
 *        the wizard opened on another project aims into it, and only the sample open aims at a new project (fd5a); a project
 *        with no cards takes the import directly, its foot the steps to Land, the rows in its draft at Land with nothing
 *        waiting in Proposals, and a project with a card still sends them there (fd5b). Its plants run in a scratch copy
 *        (tests/plant-copy.mjs), each child running fd5 alone (DROP_ONLY).
 *
 * WHAT IT CANNOT SEE: the drag events, the veil's motion and Electron's own webUtils, which only a window has (the shell's half of the path is
 * tests/shell-guards.mjs 2r, the preload's, off the File, 2s).
 *
 * PROVED BY MAKING IT FAIL: DROP_APP=<a copy of ui/app.js> reads that copy instead.
 *
 * Node only, no window, no Electron. Exit 0 when every check holds, 1 when any fails.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as S from "../src/studio.mjs";
import { DRAFT_FILE } from "../src/publish.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { loadPage } from "./page-stand-in.mjs";
import { copyPlants } from "./plant-copy.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "drop");
const EXPECTED = 23;
const SELF = fileURLToPath(import.meta.url);
const ONLY = process.env.DROP_ONLY || "";
/* ETIUDA_PLANTS=off (a merge's area run, and this file's own plant children) skips fd5's scratch-copy plants and counts each
   one skipped; the release profile runs with plants on, so they still run there. */
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
let skipped = 0;
function skip(line) {
  skipped++;
  process.stdout.write("  SKIP  " + line + "\n");
}
const source = process.env.DROP_APP ? fs.readFileSync(path.resolve(process.env.DROP_APP), "utf8") : undefined;

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
const bytes = (dir, f) => { try { return fs.readFileSync(path.join(dir, f)).toString("base64"); } catch { return ""; } };

function pageOver(root, uiLang, dropped) {
  const api = {
    newProject: (n, l, o) => wire(S.newProject(root, n, l, o)),
    open: (d) => wire(S.openProject(d)),
    projects: () => wire(S.listProjects(root)),
    proposals: (d) => wire(S.listProposals(d)),
    proposalOpen: (d, f, l) => wire(S.openProposal(d, f, { lang: l })),
    tabs: () => Promise.resolve({ error: null }),
    importPlan: (f, o, i) => wire(S.importPlan(root, f, o || {}, i || "")),
    importLand: (f, o, i, fingerprint) => wire(S.importLand(root, f, o || {}, i || "", fingerprint)),
    importDropped: (f) => Promise.resolve(dropped(f)),
    cardHistory: (d, i) => wire(S.cardHistory(d, i)),
    discardUntouched: (d) => wire(S.discardUntouched(d)),
    proposalDecide: (d, f, dec, from, note) => wire(S.decideProposal(d, f, dec, from, note)),
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
  const shelf = (await S.addTag(a.dir, "shelf", { en: "Delivery", pl: "Dostawa" })).tag.id;
  await S.addCard(a.dir, shelf, "Card A", "Parcels leave on Monday.");
  const empty = await S.newProject(root, "Empty shop", L);
  const csv = path.join(SCRATCH, "four rows.csv");
  fs.writeFileSync(csv, ["Title,Body,Category"].concat([0, 1, 2, 3].map((i) => "Row " + i + ",Text " + i + ",shelf " + (i % 2)))
    .join("\n") + "\n");

  if (ONLY) {
    try { await FD5[ONLY](root, L, csv); } catch (e) { check(false, ONLY + " threw: " + String(e && e.message || e).slice(0, 200)); }
    return finish(argv);
  }

  let answer = { error: null, file: csv };
  const { P, home } = pageOver(root, "en", () => answer);
  const has = ["dropTake", "veilShow", "dropOpen", "wizStart", "wizDoors"].every((n) => typeof P[n] === "function");
  await P.ACTS["to-projects"]();
  await P.ACTS.open(el({ "data-act": "open", "data-dir": a.dir }));
  await sleep(30);
  if (!has) {
    check(false, "dr1 the page takes no dropped file (dropTake, veilShow, dropOpen, wizStart, wizDoors)");
    return finish(argv);
  }

  /* ---- 1. THE VEIL ----------------------------------------------------------------------------- */

  home.node("#veil").hidden = true;          /* as index.html has it; a stand-in node starts shown */
  P.veilShow(true);
  check(home.node("#veil").hidden === false && home.node("#veilHead").textContent === "Import into North shop"
        && home.node("#veilLine").textContent === "Read first. Nothing is written until you land it."
        && /<svg/.test(home.node("#veilIc").innerHTML),
    "dr1a the veil names the project and the promise, under the set's import glyph: "
    + JSON.stringify(home.node("#veilHead").textContent));
  P.veilShow(false);
  const pl = pageOver(root, "pl", () => answer);
  await pl.P.ACTS.open(el({ "data-act": "open", "data-dir": a.dir }));
  await sleep(30);
  pl.home.node("#veil").hidden = true;
  pl.P.veilShow(true);
  check(pl.home.node("#veilHead").textContent === "Import do katalogu North shop"
        && pl.home.node("#veilLine").textContent === "Najpierw tylko odczyt. Nic nie trafia do katalogu przed zapisaniem.",
    "dr1b in Polish: " + JSON.stringify(pl.home.node("#veilHead").textContent));

  /* ---- 4. WHERE A DROP IS TAKEN (before the wizard is open) ------------------------------------- */

  const where = {};
  where.project = P.dropOpen();
  P.S.cover = "about"; where.cover = P.dropOpen(); P.S.cover = null;
  P.S.tour = 0; where.tour = P.dropOpen(); P.S.tour = null;
  P.S.places = { list: [] }; where.places = P.dropOpen(); P.S.places = null;
  P.S.wiz = { file: "x" }; where.wizard = P.dropOpen(); P.S.wiz = null;
  P.S.screen = "projects"; where.list = P.dropOpen(); P.S.screen = "project";
  check(where.project === true && !where.cover && !where.tour && !where.places && !where.wizard && !where.list,
    "dr4 a drop is taken on a project's own screen and nowhere else: " + JSON.stringify(where));

  /* ---- 3. A DROP WITH NO FILE ------------------------------------------------------------------- */

  answer = { error: null, file: null };
  await P.dropTake({ name: "a folder" });
  check(P.S.wiz === null && P.S.section === "cards" && home.node("#veil").hidden === true,
    "dr3 a drop the shell answered with no file opens nothing: wizard " + JSON.stringify(P.S.wiz) + ", section " + P.S.section);

  /* ---- 2. A FILE TAKEN -------------------------------------------------------------------------- */

  answer = { error: null, file: csv };
  await P.dropTake({ name: "four rows.csv" });
  const w = P.S.wiz || {};
  check(w.file === csv && w.intoDir === a.dir && w.into === true && P.S.section === "import" && w.plan && w.plan.rows === 4,
    "dr2a the wizard opens on the dropped file, into the project on screen: " + JSON.stringify({ base: w.base, into: w.into,
      rows: w.plan && w.plan.rows, section: P.S.section }));
  check(plain(home.node("#said").textContent) === "Read four rows.csv: 4 rows.",
    "dr2b said: " + JSON.stringify(plain(home.node("#said").textContent)));

  /* ---- 5. THE ONE DOOR -------------------------------------------------------------------------- */

  P.paint();
  const foot = home.node("#foot").innerHTML;
  check(/data-act="wiz-land" data-v="one"[^>]*>.*Go through them.*Enter/.test(plain(foot))
        && (foot.match(/data-act="wiz-land"/g) || []).length === 1 && !/data-v="all"/.test(foot) && !/Accept all/.test(plain(foot))
        && !/Next: send it to Proposals/.test(foot),
    "dr5a the foot of an import into this project offers its one door with its key, never Accept all");
  P.S.wiz.step = 1; P.paint();
  check(!/data-v="all"/.test(home.node("#foot").innerHTML) && /data-v="one"/.test(home.node("#foot").innerHTML)
        && /wiz-back/.test(home.node("#foot").innerHTML),
    "dr5b and on its second cover, beside Back");
  P.S.wiz.step = 0;
  const kept = P.S.wiz;
  P.S.wiz = Object.assign({}, kept, { into: false, intoDir: "", step: 1 });
  P.paint();
  check(/Next: land it as a draft/.test(home.node("#foot").innerHTML) && !/data-v="one"/.test(home.node("#foot").innerHTML),
    "dr5c CONTROL: an import that makes a new project keeps its own foot");
  P.S.wiz = kept;

  /* ---- 6. THE DOOR OPENS THE STACK -------------------------------------------------------------- */

  const draft0 = bytes(a.dir, DRAFT_FILE);
  await P.ACTS["wiz-land"](el({ "data-act": "wiz-land", "data-v": "one" }));
  await sleep(30);
  const inbox = fs.existsSync(path.join(a.dir, "inbox")) ? fs.readdirSync(path.join(a.dir, "inbox")) : [];
  const sent = ((P.S.rv && P.S.rv.list) || []).find((p) => p.ok && p.pending > 0);
  const cards6 = P.S.stack && sent ? P.S.stack.items.filter((x) => x.file === sent.file) : [];
  check(P.S.wiz === null && P.S.section === "proposals" && inbox.some((n) => /\.ec$/.test(n)) && !(P.S.rv && P.S.rv.open)
        && cards6.length >= 4,
    "dr6a the door sends the rows to Proposals and opens the stack on them: " + inbox.join(", ") + ", " + cards6.length + " cards");
  check(!!P.S.stack && Object.keys(P.S.stack.answers).length === 0,
    "dr6b nothing is answered for the person: each row waits in the stack");
  check(bytes(a.dir, DRAFT_FILE) === draft0, "dr6c and the draft is untouched: nothing is written before Apply");

  /* ---- 7. THE DOOR'S KEYS ----------------------------------------------------------------------- */

  const carded = await S.newProject(root, "West shop", L);
  await S.addCard(carded.dir, (await S.addTag(carded.dir, "shelf", { en: "Returns", pl: "Zwroty" })).tag.id, "Card W", "Returns close on Friday.");
  await P.ACTS.open(el({ "data-act": "open", "data-dir": carded.dir }));
  await sleep(30);
  answer = { error: null, file: csv };
  await P.dropTake({ name: "four rows.csv" });
  /* A key as the page hears it: every keydown listener it put on the document, as the window would call them. */
  const press = (key, shift) => home.doc.heard.filter((h) => h.type === "keydown").forEach((h) => {
    try { h.fn({ key, shiftKey: !!shift, ctrlKey: false, altKey: false, metaKey: false, target: { closest: () => null },
      preventDefault() {}, stopPropagation() {} }); } catch (_) { /* a listener that wants a real event is not this key's */ }
  });
  press("A", true);
  await sleep(60);
  const stayed = !!P.S.wiz;
  press("Enter");
  await sleep(90);
  check(stayed && !P.S.wiz && P.S.section === "proposals" && !!P.S.stack && P.S.stack.dir === carded.dir,
    "dr7 Enter is the door's key, and Shift A no longer opens anything: " + JSON.stringify({ stayed, section: P.S.section }));

  /* ---- 8. A PROJECT WITH NO CARD ---------------------------------------------------------------- */

  const empty2 = await S.newProject(root, "Bare shop", L);
  await P.ACTS.open(el({ "data-act": "open", "data-dir": empty2.dir }));
  await sleep(30);
  P.S.section = "cards"; P.paint();
  const line = "Write the first card with +, or drop a file anywhere on the window to bring its rows in for review.";
  check(home.node("#main").innerHTML.indexOf(line) >= 0, "dr8a a project with no card says the two ways in");
  /* AND A SAVE'S COUNTS LAND ON THE COUNTS LINE, NOT ON THAT ONE (the test architect's read of 2026-10-07): the first line
     is also a .pad>.lede, and touchRail wrote the counts over the first match. The stand-in gives each selector a node of
     its own, so what is read here is which selector touchRail asks: the counts line's own mark, which the page writes. */
  P.touchRail();
  const counts8 = home.node('#main .pad>.lede[data-lede="cards"]').textContent, first8 = home.node("#main .pad>.lede").textContent;
  check(counts8 === P.ledeText() && !first8 && /<p class="lede" data-lede="cards"/.test(home.node("#main").innerHTML),
    "dr8c the counts after a save go to the counts line by its own mark, and the first line is left: " + JSON.stringify([counts8, first8]));
  await P.ACTS.open(el({ "data-act": "open", "data-dir": a.dir }));
  await sleep(30);
  P.S.section = "cards"; P.paint();
  check(home.node("#main").innerHTML.indexOf(line) < 0, "dr8b CONTROL: one with a card does not");

  for (const id of Object.keys(FD5)) await FD5[id](root, L, csv);
  copyPlants({ root: ROOT, self: SELF, label: "drop", onlyVar: "DROP_ONLY", plants: FD5_PLANTS,
    check: (cond, line) => check(cond, line), skip });
  return finish(argv);
}

/* ---- fd5. "IMPORT INTO THIS PROJECT" LANDS IN THIS PROJECT (Argon's first-day review, F5; the test architect's condition,
   2026-11-01 01:19: ""Import into this catalog" lands in this project. wizAim chooses new only when the sample is the project
   open. A project with no cards takes the import directly.") ---------------------------------------------------------------- */
const FD5 = {
  async fd5a(root, L, csv) {
    const own = await S.newProject(root, "Own shop", L);
    await S.addCard(own.dir, (await S.addTag(own.dir, "shelf", { en: "Orders", pl: "Zamowienia" })).tag.id, "Card O", "Orders ship daily.");
    const { P } = pageOver(root, "en", () => ({ error: null, file: csv }));
    await P.ACTS["to-projects"]();
    await P.ACTS.open(el({ "data-act": "open", "data-dir": own.dir }));
    await sleep(30);
    await P.dropTake({ name: "four rows.csv" });
    const w = P.S.wiz || {};
    const into = w.target === "into" && w.into === true && w.intoDir === own.dir;
    P.S.wiz = null;
    await P.wizStart(csv, "");
    const w2 = P.S.wiz || {};
    const fromList = w2.target === "new" && w2.into === false && !w2.intoDir;
    check(into && fromList,
      "fd5a a file dropped onto an open project aims into that project, and from the list aims at a new project: "
      + JSON.stringify({ into: [w.target, w.into], list: [w2.target, w2.into] }));
  },
  async fd5b(root, L, csv) {
    const bare = await S.newProject(root, "Bare quay", L);
    const { P, home } = pageOver(root, "en", () => ({ error: null, file: csv }));
    await P.ACTS["to-projects"]();
    await P.ACTS.open(el({ "data-act": "open", "data-dir": bare.dir }));
    await sleep(30);
    await P.dropTake({ name: "four rows.csv" });
    P.paint();
    const foot0 = home.node("#foot").innerHTML, main0 = home.node("#main").innerHTML;
    const direct = /Next: languages and duplicates/.test(foot0) && !/data-v="one"/.test(foot0)
      && main0.indexOf("This catalog has no cards yet, so the import comes into it rather than making a new catalog, and its rows go straight in rather than waiting in Proposals.") >= 0;
    P.ACTS["wiz-next"]();
    const foot1 = home.node("#foot").innerHTML;
    await P.ACTS["wiz-land"](el({ "data-act": "wiz-land" }));
    await sleep(30);
    const opened = await S.openProject(bare.dir);
    const inbox = path.join(bare.dir, "inbox");
    const waiting = (await S.listProposals(bare.dir)).proposals || [];
    const left = waiting.filter((x) => x.ok && (x.pending | 0) > 0).length;
    const said = plain(home.node("#said").textContent);
    check(direct && /Next: land it as a draft/.test(foot1) && P.S.wiz === null && P.S.section === "cards" && P.S.err === null
      && (opened.counts.cards | 0) === 4 && (P.S.open.counts.cards | 0) === 4 && left === 0
      && /^Landed in the draft from four rows\.csv: /.test(said),
      "fd5b a project with no cards takes the import directly: the foot is the steps to Land, Land puts the rows in its draft and"
      + " shows its cards, and nothing waits in Proposals: " + JSON.stringify({ direct, cards: opened.counts.cards, left, said,
        section: P.S.section, inbox: fs.existsSync(inbox) ? fs.readdirSync(inbox) : [] }));
  },
};
const FD5_PLANTS = [
  { mark: "fd5-aim", leg: "fd5a", rel: "ui/app.js", line: '    const openedOn = "";' },
  { mark: "fd5-direct", leg: "fd5b", rel: "ui/app.js", line: '    return { intoDir: openedOn, target: openedOn ? "into" : "new", into: !!openedOn, direct: false };' },
  { mark: "fd5-foot", leg: "fd5b", rel: "ui/app.js", line: "    else if (S.wiz.step < 2 && S.wiz.into && S.wiz.intoDir)" },
  { mark: "fd5-land", leg: "fd5b", rel: "ui/app.js", line: "        const done = null;" },
];

function finish(argv) {
  process.stdout.write("\ndrop  " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)\n");
  process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + "\n");
  if (!ONLY && asserted + skipped !== EXPECTED) {
    process.stdout.write("drop  expected " + EXPECTED + " assertions, ran " + asserted + "\n");
    failed++;
  }
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "drop");
  else process.stdout.write("drop  kept " + SCRATCH + "\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stdout.write("drop  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
