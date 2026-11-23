/* PROJECTS AS PLACES (board 862): node tests/places.mjs [--keep].
 *
 * The button left of the tabs, or Ctrl+Up, lays every open project out beside the others as the window it is; one is
 * gone into with a press, Esc comes back, and the empty place makes a project where it stands. The page runs on
 * tests/page-stand-in.mjs over the real verbs of src/studio.mjs on a scratch root, as tests/plus-tab.mjs does.
 * Markup, state, words and files only.
 *
 *   pl1  the band's button says what one press does and its key, in English and in Polish
 *   pl2  opened, the places are the open tabs in their order, the one on screen marked, a tab left keeping the copy of
 *        its window that leave() took, and each place saying its cards and its last publish; the desk's bubble goes down
 *   pl3  a screen reader is told how many there are and the keys
 *   pl4  the empty place, pressed, takes the places down and opens the New catalog tab, making nothing (it became a name
 *        field until board 1019 (12) made New catalog one way in)
 *   pl5  named there and pressed, the project is made on disk, its tab added after the others and remembered, and it is
 *        on screen (the places stayed up with it among them while the place named it)
 *   pl6  CONTROL: a name of spaces on that page makes nothing
 *   pl7  a place pressed opens its project and takes the places down
 *   pl8  Esc takes them down and opens nothing; any other act pressed takes them down first
 *   pl9  the grid: every place and its caption inside the overlay, none over another, all one size, the window's shape
 *
 * WHAT IT CANNOT SEE, said rather than implied: the motion, the lift, focus and the keys' own listeners (the stand-in
 * has no layout, no events and no animation), and how the copies of the windows look, which is Maxim's eye.
 *
 * PROVED BY MAKING IT FAIL: PLACES_APP=<a copy of ui/app.js> reads that copy instead; the report of the build that
 * added this file lists the copies planted and what each reddened.
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
const SCRATCH = path.join(ROOT, "scratch", "places");
const EXPECTED = 20;
const source = process.env.PLACES_APP ? fs.readFileSync(path.resolve(process.env.PLACES_APP), "utf8") : undefined;

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
const folders = (root) => fs.readdirSync(root).sort().join("|");
const NB = String.fromCharCode(160);
const plain = (s) => String(s == null ? "" : s).split(NB).join(" ");

function pageOver(root, uiLang) {
  const calls = [];
  const api = {
    newProject: (n, l, o) => { calls.push(["newProject", n]); return wire(S.newProject(root, n, l, o)); },
    open: (d) => { calls.push(["open", d]); return wire(S.openProject(d)); },
    projects: () => wire(S.listProjects(root)),
    proposals: (d) => wire(S.listProposals(d)),
    tabs: (v) => { calls.push(["tabs", JSON.parse(JSON.stringify(v))]); return Promise.resolve({ error: null }); },
    saveCard: (d, i, p) => wire(S.saveCard(d, i, p)),
    cardHistory: (d, i) => wire(S.cardHistory(d, i)),
    discardUntouched: (d) => wire(S.discardUntouched(d)),
  };
  const home = loadPage({ api, uiLang, source });
  const P = home.page;
  P.S.host = { tour: { offered: true }, langs: S.builtLangs() };
  return { P, home, calls };
}
const has = (P, ...names) => names.every((n) => typeof P[n] === "function");
const kids = (node) => (node.children || []);

async function main(argv) {
  clearScratch(SCRATCH);
  const root = path.join(SCRATCH, "projects");
  fs.mkdirSync(root, { recursive: true });
  const a = await S.newProject(root, "North shop", [{ code: "en" }, { code: "pl" }]);
  const shelf = (await S.addTag(a.dir, "shelf", { en: "Delivery", pl: "Dostawa" })).tag.id;
  await S.addCard(a.dir, shelf, "Card A", "Parcels leave on Monday.");
  const b = await S.newProject(root, "South shop", [{ code: "en" }, { code: "pl" }]);

  /* ---- 1. THE BUTTON ------------------------------------------------------------------------- */

  const { P, home, calls } = pageOver(root, "en");
  await P.ACTS["to-projects"]();
  P.paint();
  const btn = home.node("#btnPlaces");
  check(btn.title === "See the open catalogs side by side (Ctrl+Up)" && btn.attrs["aria-label"] === btn.title
        && /<svg/.test(btn.innerHTML) && typeof P.ACTS.places === "function",
    "pl1a the band's button is titled and labelled with what it does and its key, wears a glyph and has an act: "
    + JSON.stringify(btn.title));
  const pl = pageOver(root, "pl");
  pl.P.paint();
  const plBtn = pl.home.node("#btnPlaces");
  check(plBtn.title === "Pokaż otwarte katalogi obok siebie (Ctrl+strzałka w górę)",
    "pl1b in Polish: " + JSON.stringify(plBtn.title));

  if (!has(P, "placesOpen", "placesShut", "placeGo", "placesKey", "placesGrid")) {
    check(false, "pl2 the page has no places to open (placesOpen, placeGo, placesKey, placesGrid)");
    return finish(argv);
  }

  /* ---- 2. OPENED ----------------------------------------------------------------------------- */

  await P.ACTS.open(el({ "data-act": "open", "data-dir": a.dir }));
  await sleep(30);
  await P.ACTS.open(el({ "data-act": "open", "data-dir": b.dir }));
  await sleep(30);
  const leftA = (P.S.tabs.find((t) => t.dir === a.dir) || {}).place || {};
  check(leftA.face && /\bface\b/.test(leftA.face.className) && leftA.face.inert === true,
    "pl2a the tab left keeps a copy of its window, inert: " + JSON.stringify(leftA.face && leftA.face.className));
  P.S.projects = P.S.projects.map((p) => (p.dir === a.dir ? Object.assign({}, p, { published: "2026-10-06T08:30:00Z" }) : p));
  /* the desk's bubble up as the places open (the test architect's read of 2026-10-07) */
  home.node("#arrive").hidden = false;
  await P.placesOpen(false);
  const L = (P.S.places || {}).list || [];
  check(L.map((p) => p.name).join("|") === "North shop|South shop" && L.map((p) => p.here).join() === "false,true",
    "pl2b the places are the tabs in their order, the one on screen marked: "
    + L.map((p) => p.name + (p.here ? " (current)" : "")).join(", "));
  check(L[0] && L[0].face === leftA.face && L[1] && L[1].face && L[1].face !== leftA.face,
    "pl2c the place away shows the copy kept when it was left, the one on screen a fresh copy");
  check(L[0] && /^1 card, published \d+ Oct 2026, \d\d:\d\d$/.test(plain(L[0].meta))
        && L[1] && plain(L[1].meta) === "0 cards, never published",
    "pl2d each says its cards and its last publish: " + L.map((p) => JSON.stringify(plain(p.meta))).join(", "));
  const box = home.node("#places");
  check(box.hidden === false && P.S.places && P.S.places.busy === false && home.node("#arrive").hidden === true,
    "pl2e the overlay is up and done arriving, and the desk's bubble is down, never left over it");

  /* ---- 3. SAID ------------------------------------------------------------------------------- */

  check(plain(home.node("#said").textContent) === "Open catalogs side by side: 2. Arrow keys move, Enter goes in, Esc goes back.",
    "pl3 a screen reader hears how many and the keys: " + JSON.stringify(home.node("#said").textContent));

  /* ---- 4. THE EMPTY PLACE ---------------------------------------------------------------------- */

  const before = folders(root), made0 = calls.filter((c) => c[0] === "newProject").length;
  await P.ACTS["place-new"](el({ "data-act": "place-new" }));
  await sleep(30);
  check(P.S.places === null && box.hidden === true && P.S.screen === "new" && folders(root) === before
        && calls.filter((c) => c[0] === "newProject").length === made0,
    "pl4 pressed, the empty place takes the places down and opens the New catalog tab, making nothing: screen " + P.S.screen);

  /* ---- 5. MADE ON THAT PAGE ------------------------------------------------------------------------ */

  home.node("#newName").value = "Harbour shop";
  await P.ACTS["do-new"]();
  await sleep(30);
  const made = path.join(root, "Harbour shop");
  const lastTabs = (calls.filter((c) => c[0] === "tabs").pop() || [null, { open: [] }])[1];
  check(fs.existsSync(path.join(made, "project.json")) && folders(root) !== before,
    "pl5a the project is made on disk: " + fs.existsSync(path.join(made, "project.json")));
  check(P.S.tabs.map((t) => t.name).join("|") === "North shop|South shop|Harbour shop"
        && lastTabs.open.map((t) => t.name).join("|") === "North shop|South shop|Harbour shop",
    "pl5b its tab is added after the others and remembered for the next launch: " + lastTabs.open.map((t) => t.name).join(", "));
  check(P.S.screen === "project" && P.S.open && P.S.open.dir === made && P.S.places === null,
    "pl5c and it is the catalog on screen: " + (P.S.open && P.S.open.name));

  /* ---- 6. CONTROL ------------------------------------------------------------------------------- */

  await P.placesOpen(false);
  await P.ACTS["place-new"](el({ "data-act": "place-new" }));
  await sleep(30);
  const before6 = folders(root), made6 = calls.filter((c) => c[0] === "newProject").length;
  home.node("#newName").value = "   ";
  await P.ACTS["do-new"]();
  check(folders(root) === before6 && calls.filter((c) => c[0] === "newProject").length === made6 && P.S.screen === "new",
    "pl6 CONTROL: a name of spaces on that page makes nothing");
  await P.ACTS["close-screen"](el({ "data-v": "new" }));
  await sleep(30);
  await P.ACTS.open(el({ "data-act": "open", "data-dir": b.dir }));
  await sleep(30);
  await P.placesOpen(false);

  /* ---- 7. GOING IN ------------------------------------------------------------------------------- */

  const opens = calls.filter((c) => c[0] === "open").length;
  await P.placeGo(2);
  await sleep(30);
  check(P.S.places === null && P.S.open && P.S.open.dir === made && box.hidden === true
        && calls.filter((c) => c[0] === "open").length === opens + 1,
    "pl7a a place pressed opens its project and takes the places down: on " + (P.S.open && P.S.open.name));
  check(home.node("#said").textContent === "Harbour shop is open.",
    "pl7b said: " + JSON.stringify(home.node("#said").textContent));

  /* ---- 8. BACK OUT --------------------------------------------------------------------------------- */

  await P.placesOpen(true);
  const opens8 = calls.filter((c) => c[0] === "open").length;
  const esc = { key: "Escape", target: {}, preventDefault() {}, stopPropagation() {} };
  P.placesKey(esc);
  await sleep(10);
  check(P.S.places === null && P.S.open.dir === made && calls.filter((c) => c[0] === "open").length === opens8,
    "pl8a Esc takes the places down and opens nothing");
  await P.placesOpen(false);
  P.run(el({ "data-act": "section", "data-v": "lint" }));
  check(P.S.places === null && box.hidden === true,
    "pl8b any other act pressed takes them down first");

  /* ---- 9. THE GRID --------------------------------------------------------------------------------- */

  const shapes = [[1280, 760], [900, 520], [1920, 1040]];
  const bad = [];
  for (const [W, H] of shapes) for (let n = 1; n <= 9; n++) {
    const g = P.placesGrid(n, W, H);
    const s = g.slots;
    if (s.length !== n) bad.push(W + "x" + H + " n" + n + ": " + s.length + " slots");
    s.forEach((q, i) => {
      if (q.x < 0 || q.y < 0 || q.x + q.w > W + 0.5 || q.y + q.h + g.cap > H + 0.5)
        bad.push(W + "x" + H + " n" + n + " #" + i + " outside");
      if (q.w !== s[0].w || q.h !== s[0].h) bad.push(W + "x" + H + " n" + n + " #" + i + " another size");
      if (Math.abs(q.w / q.h - W / H) > 0.02 * (W / H)) bad.push(W + "x" + H + " n" + n + " #" + i + " another shape");
      s.forEach((r, j) => {
        if (j <= i) return;
        const apart = q.x + q.w <= r.x || r.x + r.w <= q.x || q.y + q.h + g.cap <= r.y || r.y + r.h + g.cap <= q.y;
        if (!apart) bad.push(W + "x" + H + " n" + n + " #" + i + " over #" + j);
      });
    });
  }
  check(bad.length === 0, "pl9a over 27 grids, every place and its caption inside, none over another, one size, the "
    + "window's shape" + (bad.length ? ": " + bad.slice(0, 4).join("; ") : ""));
  const one = P.placesGrid(1, 1280, 760).slots[0], four = P.placesGrid(4, 1280, 760);
  check(one.w > 1000 && four.cols === 2,
    "pl9b one place takes most of the width (" + one.w + " of 1280), four sit two by two (" + four.cols + " columns)");

  /* ---- 10. IN POLISH ------------------------------------------------------------------------------- */

  await pl.P.ACTS["to-projects"]();
  await pl.P.ACTS.open(el({ "data-act": "open", "data-dir": a.dir }));
  await sleep(30);
  await pl.P.placesOpen(false);
  const plL = (pl.P.S.places || {}).list || [];
  check(plL[0] && plain(plL[0].meta) === "1 karta, jeszcze nie opublikowano"
        && plain(pl.home.node("#said").textContent) === "Otwarte katalogi obok siebie: 1. Strzałki wybierają, Enter otwiera, Esc wraca.",
    "pl10 in Polish: " + JSON.stringify(plL[0] && plain(plL[0].meta)) + ", " + JSON.stringify(pl.home.node("#said").textContent));
  pl.P.placesShut(false);

  return finish(argv);
}

function finish(argv) {
  process.stdout.write("\nplaces  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  if (asserted !== EXPECTED) {
    process.stdout.write("places  expected " + EXPECTED + " assertions, ran " + asserted + "\n");
    failed++;
  }
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "places");
  else process.stdout.write("places  kept " + SCRATCH + "\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stdout.write("places  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
