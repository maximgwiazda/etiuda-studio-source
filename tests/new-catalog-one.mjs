/* NEW CATALOG IS ONE MECHANIC (board 1019 (12)): node tests/new-catalog-one.mjs [--keep].
 *
 * Max, in his list of 21 November, IMPORTANT in his word: two identical New catalog buttons sat side by side by the search
 * bar and opened a New catalog window, while the band's "+", also New catalog, opened a tab "New catalog rev 0" with no
 * window: one mechanic, felt as two. Claude alpha's decision: one New catalog button by the search bar; it and "+" open the
 * same New catalog page in a new tab, holding what the window held; nothing is written until a name is given.
 *
 * The page runs on tests/page-stand-in.mjs over the real verbs of src/studio.mjs on a scratch root, as tests/plus-tab.mjs
 * does; a press is the act the markup carries, called.
 *
 *   nco1  the Library's row carries no New catalog press (the band's "+" is the one; it was beside Search catalogs until 26 November), and its own bar none
 *   nco2  New catalog opens a tab named New catalog, in front, with no cover and nothing on disk
 *   nco3  "+" opens the same tab, and the two never make two: pressed one after the other there is one such tab
 *   nco4  the page offers what the window offered: the heading, the lede, the name, the declared languages with the pin's
 *         set, adding and removing one, and its press; a language added keeps the name typed
 *   nco5  an empty name writes nothing and the page stays
 *   nco6  the tab closed before a name leaves nothing on disk, no tab and no project, and the tab before it in front
 *   nco7  a name given makes the project the window made, and the tab becomes that catalog's tab where it stood
 *   nco8  the old window is not reachable: no act raises it and no painter draws it
 *   nco9  Enter in the name presses the page's New catalog, and Enter in the language field adds the language
 *   nco10 the places' empty place opens the same New catalog tab, the places taken down, and makes nothing itself
 *
 * WHAT IT CANNOT SEE, said rather than implied: layout, focus and the look of the page, which are Max's eye.
 *
 * PROVED BY MAKING IT FAIL: NEW_CATALOG_ONE_APP=<a copy of ui/app.js> reads that copy instead; the report of the build
 * that added this file names the copies planted and what each reddened.
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

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "new-catalog-one");
const EXPECTED = 10;
const SOURCE_AT = process.env.NEW_CATALOG_ONE_APP ? path.resolve(process.env.NEW_CATALOG_ONE_APP) : path.join(ROOT, "ui", "app.js");
const source = fs.readFileSync(SOURCE_AT, "utf8");

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
const read = (dir, f) => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch { return null; } };
const folders = (root) => fs.readdirSync(root).sort().join("|");
const text = (h) => String(h || "").replace(/<[^>]*>/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
  .replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const count = (h, re) => (String(h || "").match(re) || []).length;

/* The band as painted: every tab's class, act, folder or screen, whether it is in front, and its words. */
function band(html) {
  const out = [];
  const re = /<span class="(tab[^"]*)"([^>]*)>([\s\S]*?)(?=<span class="tab|<\/div>|$)/g;
  for (let m; (m = re.exec(html));) {
    const a = (s, k) => (new RegExp(" " + k + '="([^"]*)"').exec(s) || [])[1] || null;
    out.push({ cls: m[1], act: a(m[2], "data-act"), dir: a(m[2], "data-dir"), v: a(m[2], "data-v"),
      title: a(m[2], "title"), on: a(m[2], "aria-current") === "page", said: text(m[3]) });
  }
  return out;
}

function pageOver(root) {
  const calls = [];
  const api = {
    newProject: (n, l, o) => { calls.push("newProject"); return wire(S.newProject(root, n, l, o)); },
    open: (d) => { calls.push("open"); return wire(S.openProject(d)); },
    projects: () => wire(S.listProjects(root)),
    proposals: (d) => wire(S.listProposals(d)),
    saveCard: (d, i, p) => wire(S.saveCard(d, i, p)),
    cardHistory: (d, i) => wire(S.cardHistory(d, i)),
    discardUntouched: (d) => { calls.push("discardUntouched"); return wire(S.discardUntouched(d)); },
  };
  const home = loadPage({ api, uiLang: "en", source });
  const P = home.page;
  P.S.host = { tour: { offered: true }, langs: S.builtLangs() };
  const tabs = () => { P.paint(); return band(home.node("#tabs").innerHTML); };
  const plus = () => tabs().find((t) => /\badd\b/.test(t.cls)) || {};
  const newTabs = () => tabs().filter((t) => t.v === "new");
  async function press(act, attrs) {
    if (!act || !P.ACTS[act]) return false;
    try { await P.ACTS[act](el(Object.assign({ "data-act": act }, attrs || {}))); } catch (e) { P.__threw = e; return false; }
    await sleep(30);
    return true;
  }
  return { P, home, calls, tabs, plus, newTabs, press };
}

async function main(argv) {
  clearScratch(SCRATCH);
  const root = path.join(SCRATCH, "projects");
  fs.mkdirSync(root, { recursive: true });
  const a = await S.newProject(root, "Catalog A", [{ code: "en" }, { code: "pl" }]);
  const b = await S.newProject(root, "Catalog B", [{ code: "en" }, { code: "pl" }]);
  const { P, home, calls, tabs, plus, newTabs, press } = pageOver(root);
  await P.ACTS["to-projects"]();

  /* ---- 1. ONE PRESS BY THE SEARCH -------------------------------------------------------------- */

  P.S.home = "library";
  P.paint();
  const chrome = home.node("#chrome").innerHTML, main1 = home.node("#main").innerHTML;
  const libActs = (/<div class="lib-bar-acts">([\s\S]*?)<\/div>/.exec(main1) || [])[1] || "";
  const nNew = count(chrome + main1, /data-act="new"/g);
  check(nNew === 0 && /id="q"/.test(chrome) && !/data-act="new"/.test(libActs) && /data-act="bring"/.test(libActs),
    "nco1 the Library's row carries no New catalog press, the band's plus makes the catalog, and its own bar none: "
    + nNew + " in all, bar " + JSON.stringify((libActs.match(/data-act="[^"]+"/g) || []).join()));

  /* ---- 2. NEW CATALOG OPENS A TAB --------------------------------------------------------------- */

  const f0 = folders(root);
  await press("new");
  const t2 = tabs(), n2 = t2.filter((t) => t.v === "new");
  check(P.S.screen === "new" && !P.S.cover && n2.length === 1 && n2[0].on && n2[0].said.indexOf("New catalog") === 0
        && folders(root) === f0 && !calls.includes("newProject"),
    "nco2 New catalog opens a tab named New catalog, in front, with no cover and nothing on disk: screen " + P.S.screen
    + ", cover " + JSON.stringify(P.S.cover) + ", tabs " + JSON.stringify(n2.map((t) => t.said)));

  /* ---- 3. "+" OPENS THE SAME ------------------------------------------------------------------- */

  await press("close-screen", { "data-v": "new" });
  await press("to-project", { "data-dir": a.dir });
  await press("to-project", { "data-dir": b.dir });
  await press("to-project", { "data-dir": a.dir });
  const p3 = plus();
  await press(p3.act);
  const viaPlus = { screen: P.S.screen, cover: P.S.cover, n: newTabs().length };
  await press("new");
  const both = { screen: P.S.screen, n: newTabs().length };
  check(p3.act && viaPlus.screen === "new" && !viaPlus.cover && viaPlus.n === 1 && both.screen === "new" && both.n === 1
        && folders(root) === f0 && !calls.includes("newProject") && P.S.tabs.length === 2,
    "nco3 \"+\" opens the same tab, and the two never make two: " + JSON.stringify({ viaPlus, both, catalogs: P.S.tabs.length }));

  /* ---- 4. WHAT THE WINDOW OFFERED -------------------------------------------------------------- */

  P.paint();
  const page = home.node("#main").innerHTML;
  const pinSet = S.builtLangs().builtIn.map((c) => c.toUpperCase());
  const rows = (page.match(/<span class="lsk mono">([^<]*)<\/span>/g) || []).map((s) => text(s));
  home.node("#newName").value = "Typed and kept";
  home.node("#newProjLang").value = "de";
  P.ACTS["new-lang-add"]();
  const added = (home.node("#main").innerHTML.match(/<span class="lsk mono">([^<]*)<\/span>/g) || []).map((s) => text(s));
  const keptName = /id="newName"[^>]*value="Typed and kept"/.test(home.node("#main").innerHTML);
  P.ACTS["new-lang-rm"](el({ "data-v": "de" }));
  const removed = (home.node("#main").innerHTML.match(/<span class="lsk mono">([^<]*)<\/span>/g) || []).map((s) => text(s));
  check(/<h1>New catalog<\/h1>/.test(page) && /A catalog is one folder on disk: its draft, its published editions and its details\./.test(page)
        && /id="newName"/.test(page) && /Declared languages/.test(page) && rows.join() === pinSet.join()
        && /data-act="new-lang-add"/.test(page) && /data-act="do-new"/.test(page)
        && added.join() === pinSet.concat(["DE"]).join() && keptName && removed.join() === pinSet.join(),
    "nco4 the page offers what the window offered, and a language added keeps the name typed: rows " + rows.join()
    + ", added " + added.join() + ", name kept " + keptName + ", removed " + removed.join());

  /* ---- 5. NO NAME, NOTHING WRITTEN -------------------------------------------------------------- */

  home.node("#newName").value = "   ";
  await press("do-new");
  check(folders(root) === f0 && !calls.includes("newProject") && P.S.screen === "new" && newTabs().length === 1,
    "nco5 an empty name writes nothing and the page stays: screen " + P.S.screen);

  /* ---- 6. CLOSED BEFORE A NAME ------------------------------------------------------------------ */

  await press("close-screen", { "data-v": "new" });
  check(folders(root) === f0 && !calls.includes("newProject") && newTabs().length === 0 && P.S.tabs.length === 2
        && P.S.screen === "project" && P.S.open && P.S.open.dir === a.dir,
    "nco6 the tab closed before a name leaves nothing on disk, no tab and no project, and the tab before it in front: "
    + JSON.stringify({ folders: folders(root), tabs: P.S.tabs.map((t) => t.name), on: P.S.open && P.S.open.name }));

  /* ---- 7. A NAME GIVEN -------------------------------------------------------------------------- */

  await press(plus().act);
  /* the New catalog tab dragged between A and B, so that "where it stood" is not simply the end */
  if (P.S.screenAt) P.S.screenAt.new = 1;
  const before7 = tabs().map((t) => t.v === "new" ? "NEW" : t.dir ? path.basename(t.dir) : null).filter(Boolean);
  home.node("#newName").value = "Made from the page";
  await press("do-new");
  const madeDir = path.join(root, "Made from the page");
  const after7 = tabs().map((t) => t.v === "new" ? "NEW" : t.dir ? path.basename(t.dir) : null).filter(Boolean);
  const draft = read(madeDir, DRAFT_FILE) || {}, proj = read(madeDir, "project.json") || {};
  const ref = read(a.dir, DRAFT_FILE) || {}, refProj = read(a.dir, "project.json") || {};
  const shape = (d) => JSON.stringify(Object.keys(d).sort());
  check(fs.existsSync(madeDir) && calls.filter((c) => c === "newProject").length === 1 && shape(draft) === shape(ref)
        && !("born" in proj) && proj.displayName === "Made from the page" && shape(proj) === shape(refProj)
        && P.S.screen === "project" && P.S.open && P.S.open.dir === madeDir && newTabs().length === 0
        && before7.join() === "Catalog A,NEW,Catalog B" && after7.join() === "Catalog A,Made from the page,Catalog B",
    "nco7 a name given makes the project the window made, and the tab becomes that catalog's tab where it stood: "
    + before7.join() + " -> " + after7.join());

  /* ---- 8. THE OLD WINDOW IS GONE ---------------------------------------------------------------- */

  const covers = [];
  await press("new"); covers.push(P.S.cover);
  await press(plus().act); covers.push(P.S.cover);
  check(covers.every((c) => !c) && !/S\.cover\s*=\s*"new"/.test(source) && !/S\.cover\s*===\s*"new"/.test(source)
        && !/function newCoverHtml\b/.test(source),
    "nco8 the old window is not reachable: no act raises it and no painter draws it: covers " + JSON.stringify(covers));

  /* ---- 9. ENTER ------------------------------------------------------------------------------- */

  const pressed = [];
  const keep = { "do-new": P.ACTS["do-new"], "new-lang-add": P.ACTS["new-lang-add"] };
  P.ACTS["do-new"] = () => { pressed.push("do-new"); };
  P.ACTS["new-lang-add"] = () => { pressed.push("new-lang-add"); };
  const btn = (act) => ({ tagName: "BUTTON", disabled: false, getAttribute: (k) => (k === "data-act" ? act : null), closest: () => null });
  const pageBox = { querySelector: (sel) => (/btn\.solid/.test(sel) ? btn("do-new") : null) };
  const langRow = { querySelector: (sel) => (/^button/.test(sel) ? btn("new-lang-add") : null) };
  const field = (id, row) => ({ tagName: "INPUT", id, disabled: false, readOnly: false, getAttribute: () => null,
    closest: (sel) => (sel === "#dlg" ? null : sel === ".newcat" ? pageBox : sel === ".row2" ? row : null) });
  const key = (t) => (typeof P.confirmKey === "function" ? P.confirmKey({ key: "Enter", target: t, preventDefault() {} }) : "");
  const k1 = key(field("newName", null));
  const k2 = key(field("newProjLang", langRow));
  Object.assign(P.ACTS, keep);
  check(k1 === "do-new" && k2 === "new-lang-add" && pressed.join() === "do-new,new-lang-add",
    "nco9 Enter in the name presses the page's New catalog, and in the language field adds the language: "
    + JSON.stringify([k1, k2]));

  /* ---- 10. THE PLACES' EMPTY PLACE ----------------------------------------------------------------- */

  await press("close-screen", { "data-v": "new" });
  const f10 = folders(root), n10 = calls.filter((c) => c === "newProject").length;
  let opened10 = false;
  if (typeof P.placesOpen === "function") { await P.placesOpen(false); opened10 = !!P.S.places; }
  await press("place-new");
  await sleep(30);
  check(opened10 && P.S.places === null && P.S.screen === "new" && newTabs().length === 1 && !P.S.cover
        && folders(root) === f10 && calls.filter((c) => c === "newProject").length === n10
        && !/function placeMake\b/.test(source),
    "nco10 the places' empty place opens the same New catalog tab, the places taken down, and makes nothing itself: "
    + JSON.stringify({ opened: opened10, places: !!P.S.places, screen: P.S.screen, tabs: newTabs().length }));

  process.stdout.write("\nnew-catalog-one  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  if (asserted !== EXPECTED) {
    process.stdout.write("new-catalog-one  expected " + EXPECTED + " assertions, ran " + asserted + "\n");
    failed++;
  }
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "new-catalog-one");
  else process.stdout.write("new-catalog-one  kept " + SCRATCH + "\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stdout.write("new-catalog-one  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
