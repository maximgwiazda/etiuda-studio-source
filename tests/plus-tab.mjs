/* THE BAND'S "+" OPENS THE NEW CATALOG TAB, AND A NAME THERE MAKES THE PROJECT: node tests/plus-tab.mjs [--keep].
 *
 * It used to carry the Projects tab's own act, so pressing it went back to the list and opened nothing; then it made a
 * project named "New catalog" at once (Maxim 2026-10-04 12:05). Since board 1019 (12) it opens the New catalog tab, the
 * one New catalog opens, and nothing is written until a name is given there (tests/new-catalog-one.mjs). The page runs on
 * tests/page-stand-in.mjs over the real verbs of src/studio.mjs on a scratch root, as tests/bulk-page.mjs does; "+" is
 * pressed by reading the act the band painted on it and calling that act. Markup, state and files only.
 *
 *   pt1  "+" carries an act of its own, and says what it does to someone who cannot see the sign
 *   pt2  pressed from the list and named "New catalog": one more tab, on screen, holding a new folder with an empty draft
 *   pt3  pressed inside a project: the view of the one before is dropped as a tab switch drops it, its tab stays, and
 *        what was being typed there is on its disk before the new project is made
 *   pt4  a name whose folder is there already, a project's or a plain folder's, is refused on the page and nothing is
 *        written (it took the next free "New catalog 2" while "+" named the project itself)
 *   pt5  in Polish "+" and its page say "Nowy katalog", and the project is Polish-primary
 *   pt6  New catalog opens the same page, and with its fields left as they open makes the same project, bar the name and
 *        the id
 *   pt7  a refused name leaves the band as it was, the page on screen, and says why
 *   pt8  CONTROLS: the Projects tab still goes to the list, a project's tab still opens it, neither makes anything, an
 *        existing project's folder gains nothing, and the page with no name still writes nothing
 *   pt9  pressed with a category's name, the facts and the project's own name being typed: each is on its disk, the
 *        renamed folder followed by its tab, before the new project is made
 *   pt10 its tab closed with nothing done, a project an older "+" made goes, folder and row, from the project on screen
 *        or from the list (22a-A); one given a card, a new name, another file, a publish folder or Sealed stays, and so
 *        does a project whose name a person typed
 *   pt11 a page that added a language and was closed without creating opens again on the pin's languages, and a page
 *        named and pressed leaves no New catalog tab behind
 *
 * WHAT IT CANNOT SEE, said rather than implied: the click itself (the page's one listener), the middle-button close, and
 * how the band looks, wraps or shrinks "+" as tabs multiply, which is Maxim's eye.
 *
 * PROVED BY MAKING IT FAIL: PLUS_TAB_APP=<a copy of ui/app.js> reads that copy instead; the report of the build that added
 * this file lists the copies planted and what each reddened.
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
import { olderFolderTeam } from "./older-folder-team.mjs"; /* the folder team is made by the fixture, not by Studio (the folder team's removal) */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "plus-tab");
const EXPECTED = 35;
const source = process.env.PLUS_TAB_APP ? fs.readFileSync(path.resolve(process.env.PLUS_TAB_APP), "utf8") : undefined;

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
const bytes = (dir, f) => { try { return fs.readFileSync(path.join(dir, f)).toString("base64"); } catch { return ""; } };
const folders = (root) => fs.readdirSync(root).sort().join("|");
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** The band's spans as painted: each tab's class, act, folder, title, label and text. */
function band(html) {
  html = html.replace(/<svg[^]*?<[/]svg>/g, ""); /* a tab's glyph (board 1019 (10)) is not its text: was read as the text's end */
  const out = [];
  const re = /<span class="(tab[^"]*)"([^>]*)>([^<]*)/g;
  for (let m; (m = re.exec(html));) {
    const a = (k) => (new RegExp(" " + k + '="([^"]*)"').exec(m[2]) || [])[1] || null;
    out.push({ cls: m[1], act: a("data-act"), dir: a("data-dir"), title: a("title"), label: a("aria-label"),
      current: a("aria-current"), text: m[3] });
  }
  return out;
}

/** A page over `root`, with the verbs the band, the cover and a tab switch reach. */
function pageOver(root, uiLang) {
  const calls = [];
  const api = {
    newProject: (n, l, o) => { calls.push("newProject"); return wire(S.newProject(root, n, l, o)); },
    open: (d) => { calls.push("open"); return wire(S.openProject(d)); },
    projects: () => { calls.push("projects"); return wire(S.listProjects(root)); },
    proposals: (d) => wire(S.listProposals(d)),
    saveCard: (d, i, p) => { calls.push("saveCard"); return wire(S.saveCard(d, i, p)); },
    /* a find left open by a landing that kept it runs on the next paint; it answers here so that fault reads red, not a crash */
    findPlaces: (d) => wire(S.findPlaces(d, { q: "parcels" })),
    /* a tab comes back to the card it had picked (tests/open-tabs.mjs), and that card's history is read */
    cardHistory: (d, i) => wire(S.cardHistory(d, i)),
    renameTag: (d, i, t) => { calls.push("renameTag"); return wire(S.renameTag(d, i, t)); },
    renameProject: (d, n) => { calls.push("renameProject"); return wire(S.renameProject(d, n)); },
    saveFacts: (d, t) => { calls.push("saveFacts"); return wire(S.saveFacts(d, t)); },
    discardUntouched: (d) => { calls.push("discardUntouched"); return wire(S.discardUntouched(d)); },
  };
  const home = loadPage({ api, uiLang, source });
  const P = home.page;
  /* the tour's invite is taken as offered, or a paint with a tab present imports the engine's bubble into the vm */
  P.S.host = { tour: { offered: true }, langs: S.builtLangs() };
  const tabs = () => { P.paint(); return band(home.node("#tabs").innerHTML); };
  const plus = () => tabs().find((t) => /\badd\b/.test(t.cls)) || {};
  async function press(t) {
    const act = t && t.act;
    if (!act || !P.ACTS[act]) return false;
    try { await P.ACTS[act](el({ "data-act": act, "data-dir": t.dir })); } catch (e) { P.__threw = e; return false; }
    await sleep(30);                      /* rvPeek, which a landing starts and does not wait for */
    return true;
  }
  /* "+" pressed, the name typed on the New catalog page, and its New catalog pressed (board 1019 (12)). */
  async function make(name, t) {
    if (!(await press(t || plus())) || P.S.screen !== "new") return false;
    home.node("#newName").value = name;
    try { await P.ACTS["do-new"](); } catch (e) { P.__threw = e; return false; }
    await sleep(30);
    return true;
  }
  return { P, home, api, calls, tabs, plus, press, make };
}

async function main(argv) {
  clearScratch(SCRATCH);
  const root = path.join(SCRATCH, "projects");
  fs.mkdirSync(root, { recursive: true });
  const kept = await S.newProject(root, "Kept project", [{ code: "en" }, { code: "pl" }]);
  const shelf = (await S.addTag(kept.dir, "shelf", { en: "Delivery", pl: "Dostawa" })).tag.id;
  const cardId = (await S.addCard(kept.dir, shelf, "Card A", "Parcels leave on Monday.")).card.id;

  const { P, home, api, calls, tabs, plus, press, make } = pageOver(root, "en");
  await P.ACTS["to-projects"]();

  /* ---- 1. THE SIGN --------------------------------------------------------------------------- */

  const p0 = plus();
  check(p0.act && p0.act !== "to-projects" && typeof P.ACTS[p0.act] === "function",
    'pt1a "+" carries an act of its own: data-act=' + p0.act);
  check(p0.title === "New catalog" && p0.label === "New catalog",
    'pt1b "+" is titled and labelled "New catalog": title=' + p0.title + " aria-label=" + p0.label);

  /* ---- 2. FROM THE LIST ---------------------------------------------------------------------- */

  const before2 = folders(root);
  await make("New catalog");
  const t2 = tabs();
  const one = P.S.tabs[0] || {};
  const oneDir = one.dir || "";
  check(P.S.tabs.length === 1 && P.S.screen === "project" && P.S.open && P.S.open.dir === oneDir
        && t2.filter((t) => t.current === "page").length === 1 && (t2.find((t) => t.current === "page") || {}).dir === oneDir,
    "pt2a one more tab, and it is the one on screen: tabs " + P.S.tabs.length + ", screen " + P.S.screen
    + ", on " + JSON.stringify((t2.find((t) => t.current === "page") || {}).text));
  const d1 = read(oneDir, DRAFT_FILE) || {}, j1 = read(oneDir, "project.json") || {};
  check(oneDir && path.dirname(oneDir) === root && path.basename(oneDir) === "New catalog" && folders(root) !== before2
        && Array.isArray(d1.cards) && d1.cards.length === 0 && d1.rev === 0 && UUID.test(d1.id || "") && d1.id !== kept.project.id
        && j1.displayName === "New catalog" && j1.id === d1.id && one.name === "New catalog" && one.rev === 0,
    'pt2b its folder is new under the root, "New catalog", with an empty draft at rev 0 and a random id of its own: '
    + path.basename(oneDir) + ", cards " + (d1.cards || []).length + ", id " + d1.id);
  check(JSON.stringify((d1.langs || []).map((l) => l.code)) === JSON.stringify(S.builtLangs().builtIn),
    "pt2c it declares the pin's built-in languages, the set the cover opens on: " + (d1.langs || []).map((l) => l.code));
  check(P.S.section === "cards" && P.S.sel === null && P.S.q === "",
    "pt2d it opens on its cards: section " + P.S.section);

  /* ---- 3. FROM INSIDE A PROJECT -------------------------------------------------------------- */

  await press({ act: "to-project", dir: kept.dir });
  const plus3 = plus();
  P.S.section = "tags"; P.S.sel = cardId; P.S.q = "parcels";
  P.queueSave(cardId, { body: { en: "Typed before the plus." } });
  P.S.ticks = new Set([cardId]); P.S.find = { whole: true, matchCase: false, to: "", rows: null, places: 0, off: new Set(), asked: null }; P.S.undo = { dir: kept.dir, said: "x" }; P.S.cardView = "retired";
  const nCalls = calls.length;
  await make("Second catalog", plus3);
  const t3 = tabs();
  const two = P.S.tabs[2] || {};
  check(P.S.tabs.length === 3 && P.S.tabs[0].dir === oneDir && P.S.tabs[1].dir === kept.dir && P.S.open && P.S.open.dir === two.dir
        && t3.filter((t) => t.current === "page").map((t) => t.dir).join() === two.dir,
    "pt3a the tab before stays and the new one is added after it, on screen: " + P.S.tabs.map((t) => t.name).join(", "));
  check(P.S.section === "cards" && P.S.sel === null && P.S.q === "" && P.S.ticks.size === 0 && P.S.find === null
        && P.S.undo === null && P.S.cardView === "active",
    "pt3b the view of the project before is dropped: section " + P.S.section + ", ticks " + P.S.ticks.size
    + ", find " + JSON.stringify(P.S.find) + ", undo " + JSON.stringify(P.S.undo) + ", view " + P.S.cardView);
  const keptCard = ((read(kept.dir, DRAFT_FILE) || {}).cards || []).find((c) => c.id === cardId) || {};
  const saveAt = calls.indexOf("saveCard", nCalls), newAt = calls.indexOf("newProject", nCalls);
  check(keptCard.body && keptCard.body.en === "Typed before the plus." && saveAt >= 0 && saveAt < newAt
        && ((read(two.dir, DRAFT_FILE) || {}).cards || [1]).length === 0,
    "pt3c what was being typed is saved into its own project before the new one is made: "
    + JSON.stringify(keptCard.body && keptCard.body.en) + ", save at " + saveAt + ", made at " + newAt);
  const keptFiles = fs.readdirSync(kept.dir).sort().join("|"), keptDraft = bytes(kept.dir, DRAFT_FILE);

  /* ---- 4. A NAME ALREADY TAKEN ---------------------------------------------------------------- */

  const one1 = bytes(oneDir, DRAFT_FILE), f4 = folders(root), n4 = P.S.tabs.length;
  await make("New catalog");
  const said4 = P.S.err ? JSON.stringify(P.S.err) : "";
  check(P.S.screen === "new" && P.S.tabs.length === n4 && folders(root) === f4 && bytes(oneDir, DRAFT_FILE) === one1
        && /already a folder/.test(said4),
    'pt4a "New catalog" again is refused on the page, nothing written and the first draft as it was: screen '
    + P.S.screen + ", " + said4);
  const plain = path.join(root, "Plain folder");
  fs.mkdirSync(plain); fs.writeFileSync(path.join(plain, "notes.txt"), "not a project");
  home.node("#newName").value = "Plain folder";
  await P.ACTS["do-new"]();
  check(P.S.screen === "new" && P.S.tabs.length === n4 && fs.readdirSync(plain).join() === "notes.txt"
        && fs.readFileSync(path.join(plain, "notes.txt"), "utf8") === "not a project",
    "pt4b a plain folder holding the name typed is refused too and left as it was: " + fs.readdirSync(plain).join());
  P.S.err = null;
  await P.ACTS["close-screen"](el({ "data-v": "new" }));

  /* ---- 5. IN POLISH -------------------------------------------------------------------------- */

  const plRoot = path.join(SCRATCH, "projects-pl");
  fs.mkdirSync(plRoot, { recursive: true });
  const pl = pageOver(plRoot, "pl");
  await pl.P.ACTS["to-projects"]();
  const plPlus = pl.plus();
  check(plPlus.title === "Nowy katalog" && plPlus.label === "Nowy katalog",
    'pt5a in Polish "+" is titled "Nowy katalog": ' + plPlus.title);
  await pl.press(plPlus);
  pl.P.paint();
  const plHead = /<h1>Nowy katalog<\/h1>/.test(pl.home.node("#main").innerHTML) && pl.P.S.screen === "new";
  pl.home.node("#newName").value = "Nowy katalog";
  await pl.P.ACTS["do-new"]();
  await sleep(30);
  const plTab = pl.P.S.tabs[0] || {};
  check(plHead && path.basename(plTab.dir || "") === "Nowy katalog" && (read(plTab.dir || "", "project.json") || {}).displayName === "Nowy katalog",
    'pt5b and its page is "Nowy katalog", and so is the project named so there: ' + path.basename(plTab.dir || ""));
  const plDraft = read(plTab.dir || "", DRAFT_FILE) || {};
  const plLangs = (plDraft.langs || []).map((l) => l.code).join();
  check(plLangs === "pl,en", "pt5c in Polish the project is Polish-primary, taking the interface language first: " + plLangs);

  /* ---- 6. NEW CATALOG OPENS THE SAME PAGE ---------------------------------------------------- */

  await P.ACTS.new();
  const sameTab = P.S.screen === "new" && tabs().some((t) => / screen/.test(t.cls));
  home.node("#newName").value = "Cover made";
  await P.ACTS["do-new"]();
  await sleep(30);
  const cov = P.S.tabs[P.S.tabs.length - 1] || {};
  const dc = read(cov.dir || "", DRAFT_FILE) || {}, jc = read(cov.dir || "", "project.json") || {};
  const shape = (d) => JSON.stringify(Object.keys(d).sort().map((k) => [k, ["id", "hash"].includes(k) ? typeof d[k] : d[k]]));
  check(sameTab && cov.name === "Cover made" && P.S.open && P.S.open.dir === cov.dir && shape(dc) === shape(d1)
        && JSON.stringify(Object.keys(jc).sort()) === JSON.stringify(Object.keys(j1).filter((k) => k !== "born").sort()),
    "pt6a New catalog opens the same page, and with its languages left as they open writes the draft \"+\" writes, bar"
    + " the id: " + sameTab + ", " + (shape(dc) === shape(d1)));
  check(P.S.tabs.length === 4 && P.S.section === "cards" && P.S.ticks.size === 0 && P.S.undo === null && P.S.cover === null,
    "pt6b and lands the same way, as one more tab on its cards: tabs " + P.S.tabs.length);

  /* ---- 7. A REFUSED "+" ---------------------------------------------------------------------- */

  const real = api.newProject;
  api.newProject = () => Promise.resolve({ error: "the folder could not be made", said: null, disk: true });
  const n7 = P.S.tabs.length, open7 = P.S.open && P.S.open.dir;
  await make("Refused name");
  api.newProject = real;
  check(P.S.tabs.length === n7 && P.S.screen === "new" && open7 && /could not be made/.test(P.S.err ? JSON.stringify(P.S.err) : ""),
    "pt7a a refused name adds no tab, leaves the page on screen and says why: tabs " + P.S.tabs.length
    + ", err " + JSON.stringify(P.S.err));
  P.S.err = null;
  await P.ACTS["close-screen"](el({ "data-v": "new" }));

  /* ---- 8. CONTROLS ---------------------------------------------------------------------------- */

  const n8 = P.S.tabs.length, f8 = folders(root), c8 = calls.filter((c) => c === "newProject").length;
  const first = tabs()[0] || {};
  await press(first);
  check(first.act === "to-projects" && first.text === "Overview" && P.S.screen === "projects" && P.S.tabs.length === n8,
    "pt8a CONTROL: the first tab is still the Overview and goes to the list, adding no tab: " + first.act + ", " + P.S.screen);
  await press(tabs().find((t) => t.dir === kept.dir));
  check(P.S.open && P.S.open.dir === kept.dir && P.S.screen === "project" && P.S.tabs.length === n8,
    "pt8b CONTROL: a project's tab opens that project and adds no tab: tabs " + P.S.tabs.length);
  check(folders(root) === f8 && calls.filter((c) => c === "newProject").length === c8,
    "pt8c CONTROL: neither press makes a project");
  check(fs.readdirSync(kept.dir).sort().join("|") === keptFiles && bytes(kept.dir, DRAFT_FILE) === keptDraft
        && ((read(kept.dir, DRAFT_FILE) || {}).cards || []).length === 1,
    "pt8d CONTROL: every press after its own save, \"+\" and New catalog alike, left the existing project's files byte for byte");
  await P.ACTS["to-projects"]();
  await P.ACTS.new();
  home.node("#newName").value = "   ";
  await P.ACTS["do-new"]();
  check(folders(root) === f8 && P.S.tabs.length === n8 && P.S.screen === "new",
    "pt8e CONTROL: the page with no name writes nothing and stays");
  await P.ACTS["close-screen"](el({ "data-v": "new" }));

  /* ---- 9. A TAG, THE FACTS AND THE PROJECT'S NAME BEING TYPED -------------------------------- */

  const ed = await S.newProject(root, "Edited project", [{ code: "en" }, { code: "pl" }]);
  const edShelf = (await S.addTag(ed.dir, "shelf", { en: "Returns", pl: "Zwroty" })).tag.id;
  await press({ act: "to-project", dir: ed.dir });
  const n9 = calls.length;
  P.queueTagSave(edShelf, "en", "Returns typed before the plus");
  P.queueFacts("Facts typed before the plus.");
  P.queueProjectSave(ed.dir, "Renamed before the plus");
  await make("Ninth catalog");
  const made9 = calls.indexOf("newProject", n9);
  const moved = path.join(root, "Renamed before the plus");
  const edDraft = read(moved, DRAFT_FILE) || {};
  const edTag = (edDraft.tags || []).find((t) => t.id === edShelf) || {};
  check(edTag.label && edTag.label.en === "Returns typed before the plus" && calls.indexOf("renameTag", n9) >= 0
        && calls.indexOf("renameTag", n9) < made9,
    "pt9a a category being renamed is on its disk before \"+\" makes the next project: "
    + JSON.stringify(edTag.label && edTag.label.en) + ", sent at " + calls.indexOf("renameTag", n9) + ", made at " + made9);
  check(edDraft.facts === "Facts typed before the plus." && calls.indexOf("saveFacts", n9) >= 0
        && calls.indexOf("saveFacts", n9) < made9,
    "pt9b the facts being typed are on the disk first: " + JSON.stringify(edDraft.facts)
    + ", sent at " + calls.indexOf("saveFacts", n9));
  check(!fs.existsSync(ed.dir) && (read(moved, "project.json") || {}).displayName === "Renamed before the plus"
        && calls.indexOf("renameProject", n9) >= 0 && calls.indexOf("renameProject", n9) < made9
        && P.S.tabs.some((t) => t.dir === moved && t.name === "Renamed before the plus"),
    "pt9c the project's new name is written, its folder moved and its tab following it, before \"+\" makes the next: "
    + path.basename(moved) + ", sent at " + calls.indexOf("renameProject", n9));

  /* ---- 10. CLOSING A PROJECT AN OLDER "+" MADE, NOBODY TOUCHED (22a-A) ------------------------- */

  /* "+" no longer makes a project, so one is made as it made them, a name nobody chose marked born, and opened in a tab:
     such projects stand in Libraries from before board 1019 (12), and still go when closed untouched. */
  const rows = () => (P.S.projects || []).map((p) => p.dir);
  const close = (dir) => press({ act: "close-tab", dir });
  const lastDir = () => (P.S.tabs[P.S.tabs.length - 1] || {}).dir || "";
  const older = async () => {
    const r = await S.newProject(root, "New catalog", S.builtLangs().builtIn.map((code) => ({ code })), { numbered: true });
    await P.ACTS["to-projects"]();
    await press({ act: "to-project", dir: r.dir });
    return r.dir;
  };
  const oldOne = await older();
  await older();
  const onScreen = lastDir();
  const onScreenFiles = fs.existsSync(onScreen) ? fs.readdirSync(onScreen).sort().join("|") : "";
  await close(onScreen);
  await P.ACTS["to-projects"]();
  check(onScreenFiles === "draft.json|project.json" && !fs.existsSync(onScreen) && !P.S.tabs.some((t) => t.dir === onScreen)
        && !rows().includes(onScreen) && calls.includes("discardUntouched"),
    "pt10a a \"+\" project closed from its own tab with nothing done goes, its folder, its tab and its row: "
    + path.basename(onScreen) + " exists " + fs.existsSync(onScreen));
  await press({ act: "to-project", dir: oldOne });
  await P.ACTS["to-projects"]();
  const listed = rows().includes(oldOne);
  await close(oldOne);
  check(listed && !fs.existsSync(oldOne) && !rows().includes(oldOne) && P.S.screen === "projects"
        && !P.S.tabs.some((t) => t.dir === oldOne),
    "pt10b one opened again and closed from the list goes too, and its row leaves the list on screen: "
    + path.basename(oldOne) + " exists " + fs.existsSync(oldOne));
  const carded = await older();
  const cardShelf = (await S.addTag(carded, "shelf", { en: "Kept" })).tag.id;
  await S.addCard(carded, cardShelf, "A card", "Written before the close.");
  await close(carded);
  check(fs.existsSync(carded) && ((read(carded, DRAFT_FILE) || {}).cards || []).length === 1,
    "pt10c CONTROL: one given a card stays, card and all: " + path.basename(carded));
  const toName = await older();
  const renamed = await S.renameProject(toName, "Named after the plus");
  const namedDir = (renamed && renamed.dir) || path.join(root, "Named after the plus");
  P.S.tabs = P.S.tabs.map((t) => (t.dir === toName ? Object.assign({}, t, { dir: namedDir }) : t));
  await close(namedDir);
  check(fs.existsSync(namedDir) && (read(namedDir, "project.json") || {}).displayName === "Named after the plus",
    "pt10d CONTROL: one given a new name stays: " + path.basename(namedDir));
  const withFile = await older();
  fs.writeFileSync(path.join(withFile, "notes.txt"), "a file of its own");
  /* The file index, not the bytes: a project deleted and written back would hold the same bytes in new files. */
  const ino = () => [DRAFT_FILE, "project.json"].map((n) => { try { return String(fs.statSync(path.join(withFile, n), { bigint: true }).ino); } catch { return ""; } }).join();
  const inoBefore = ino();
  await close(withFile);
  check(fs.existsSync(withFile) && fs.readFileSync(path.join(withFile, "notes.txt"), "utf8") === "a file of its own"
        && fs.existsSync(path.join(withFile, DRAFT_FILE)) && fs.existsSync(path.join(withFile, "project.json"))
        && inoBefore !== "," && ino() === inoBefore,
    "pt10e CONTROL: one holding any other file stays, every file as it was: " + path.basename(withFile));
  await press({ act: "to-project", dir: cov.dir });
  await close(cov.dir);
  await press({ act: "to-project", dir: kept.dir });
  await close(kept.dir);
  await press({ act: "to-project", dir: oneDir });
  await close(oneDir);
  check(fs.existsSync(cov.dir) && fs.readdirSync(cov.dir).sort().join("|") === "draft.json|project.json"
        && fs.existsSync(oneDir) && fs.readdirSync(oneDir).sort().join("|") === "draft.json|project.json"
        && fs.existsSync(kept.dir) && fs.readdirSync(kept.dir).sort().join("|") === keptFiles,
    "pt10f CONTROL: an untouched project whose name a person typed, \"New catalog\" on the page included, and one made"
    + " elsewhere, stay when their tabs close");
  const swapped = await older();
  const born = (read(swapped, "project.json") || {}).born || {};
  fs.writeFileSync(path.join(swapped, DRAFT_FILE),
    fs.readFileSync(path.join(swapped, DRAFT_FILE), "utf8").replace('"cards": []', '"cards": [ ]'));
  await close(swapped);
  check(born.name === path.basename(swapped) && /^[0-9a-f]{64}$/.test(born.draft || "") && fs.existsSync(swapped),
    "pt10g CONTROL: one whose draft differs by a single byte from the one \"+\" wrote stays: " + path.basename(swapped));
  /* Each differs from what "+" wrote in project.json alone, which only discardUntouched's project.json comparison sees. */
  const foldered = await older(), folderAt = path.join(SCRATCH, "share-folder");
  S.setPublishFolder(foldered, folderAt);
  await close(foldered);
  const sealedOnly = await older(), sealAt = path.join(SCRATCH, "share-sealed");
  const { makeKeyFile } = await import("../src/sign.mjs");
  const keyAt = path.join(SCRATCH, "lead-key.json"), PASS = "a passphrase for the lead's key in this gate";
  fs.writeFileSync(keyAt, JSON.stringify(await makeKeyFile({ passphrase: PASS }), null, 1));
  fs.mkdirSync(sealAt, { recursive: true });
  S.setPublishFolder(sealedOnly, sealAt);
  await olderFolderTeam(sealedOnly, { key: keyAt, passphrase: PASS, teamId: "t-0123456789abcdef" });
  S.setPublishFolder(sealedOnly, null);
  const sealedJson = read(sealedOnly, "project.json") || {};
  await close(sealedOnly);
  check((read(foldered, "project.json") || {}).folder === path.resolve(folderAt) && fs.existsSync(foldered)
        && sealedJson.sealedTeam === "t-0123456789abcdef" && sealedJson.folder === null && fs.existsSync(sealedOnly),
    "pt10h CONTROL: one given only a publish folder stays, and so does one only Sealed, its folder then taken back: "
    + path.basename(foldered) + " exists " + fs.existsSync(foldered) + ", " + path.basename(sealedOnly) + " exists "
    + fs.existsSync(sealedOnly));

  /* ---- 11. A PAGE CLOSED WITH A LANGUAGE ADDED DOES NOT KEEP IT ------------------------------ */

  await press(plus());
  home.node("#newProjLang").value = "de";
  P.ACTS["new-lang-add"]();
  const held11 = (P.S.newLangs || []).map((l) => l.code).join();
  await P.ACTS["close-screen"](el({ "data-v": "new" }));
  const n11 = P.S.tabs.length;
  await make("Eleventh catalog");
  const dir11 = (P.S.tabs.length === n11 + 1 && P.S.tabs[P.S.tabs.length - 1].dir) || "";
  const got11 = ((read(dir11, DRAFT_FILE) || {}).langs || []).map((l) => l.code);
  check(held11.split(",").indexOf("de") >= 0 && P.S.cover === null
        && JSON.stringify(got11) === JSON.stringify(S.builtLangs().builtIn),
    "pt11a a page that added a language and was closed opens again on the pin's built-in languages, as pt2c reads them: held "
    + held11 + ", made " + got11.join());
  check(P.S.screen === "project" && !tabs().some((t) => / screen/.test(t.cls)),
    "pt11b and the page named and pressed leaves no New catalog tab behind: screen " + P.S.screen);

  process.stdout.write("\nplus-tab  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  if (asserted !== EXPECTED) {
    process.stdout.write("plus-tab  expected " + EXPECTED + " assertions, ran " + asserted + "\n");
    failed++;
  }
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "plus-tab");
  else process.stdout.write("plus-tab  kept " + SCRATCH + "\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stdout.write("plus-tab  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
