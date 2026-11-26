/* THE TABS ARE THE OPEN PROJECTS: node tests/open-tabs.mjs [--keep].
 *
 * The page runs on tests/page-stand-in.mjs over the real verbs of src/studio.mjs on a scratch root, as tests/plus-tab.mjs
 * does; a tab is pressed by calling the act the band painted on it, and a key by handing tabKey the event a keydown would.
 *
 *   ot1  each tab keeps its place while another is on screen (section, card, search, language, scroll), the list keeps
 *        its own, a new tab opens on its cards, and what a table narrows by is cleared as at an open
 *   ot2  a wizard under way belongs to the tab it was opened in, and the list's to the list
 *   ot3  each project's tab carries a cross that closes it, after its edits are on disk; the one on screen gives way to
 *        the tab on its left, and left of the first is the list; a refused save keeps the tab; the folder stays
 *   ot4  Ctrl+Tab and Ctrl+Shift+Tab walk the band round, Ctrl+W and Ctrl+F4 close the project on screen, and nothing
 *        happens under a cover, the tour, without Ctrl, or on the list
 *   ot5  what is written for the next launch, and the launch that reads it back: the tab that was on screen opens, the
 *        others wait unopened, a folder gone is left out and a share that is down is held, and nothing is written then;
 *        opening the tab of a moved project leaves no other project on screen and says what is wrong (board 949 W6)
 *   ot6  CONTROLS: a fresh profile starts on the list with no tab and writes nothing; a project opened from the list
 *        lands on its cards exactly as before
 *   ot7  work started for one tab finishes in that tab: a draft landed, a plan made or refused, an import into a
 *        project and a section's read, each answered after the band has moved on
 *   ot8  the Desks screen is its tab's: its read, its two-second refresh, an opening and an admission answered after
 *        the band moved on are dropped, a code typed stays with its tab, and the refresh resumes on return; a team
 *        cover asked for one tab is never answered for another that lands under it; on the tab on screen an opening,
 *        the refresh and a refusal land, and a refusal or a refused Seal answered after the band moved on is dropped
 *  ot9  a tag, language or card cover belongs to the tab it was opened in: another project or the list hides it with what was
 *        typed kept, its tab shows it again, and its answer, in flight or refused while away, is for its own project
 *  ot11 a tab dragged a quarter into another takes its place, catalogs' and screen tabs alike, and the release switches
 *        nothing; the order is what is kept and what the next launch opens; a press, or one that slips under 5 px, is a
 *        click; a cross still closes; the + and the cross are drawings on one grid at one stroke (board 982, 16 and 17)
 *
 * WHAT IT CANNOT SEE, said rather than implied: the click and the keys themselves (the page's listeners), whether
 * Electron hands Ctrl+Tab to the page, the scroll a real layout allows, how the cross looks, and the shell's own
 * studio:tabs and studio:host glue, which only shell-guards loads. Those are Maxim's testing.
 *
 * PROVED BY MAKING IT FAIL: OPEN_TABS_APP=<a copy of ui/app.js> reads that copy instead; the report of the build that
 * added this file lists the copies planted and what each reddened.
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
const SCRATCH = path.join(ROOT, "scratch", "open-tabs");
const EXPECTED = 69; /* 77 less ot8c, d, e, f, g, i, m and n, retired with the code door (P2) */
const source = process.env.OPEN_TABS_APP ? fs.readFileSync(path.resolve(process.env.OPEN_TABS_APP), "utf8") : undefined;

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
/* A test-only slowdown of the stand-in's open, set by legs ot7e and ot7f from OT7D_SLOW_OPEN (ms); off by default. */
let slowOpen = 0;
/** Polls for a condition the page reaches by itself, up to `ms` (5 s): a fixed sleep guesses how long the work takes and
    loses on a loaded machine. On the deadline it says what never happened and carries on, so the leg's own check fails with it. */
const until = async (cond, what, ms = 5000) => {
  const end = Date.now() + ms;
  while (!cond()) { if (Date.now() > end) { process.stdout.write("  WAIT timed out after " + ms + " ms: " + what + "\n"); return false; } await sleep(10); }
  return true;
};
const el = (attrs) => ({ getAttribute: (k) => (attrs[k] == null ? null : attrs[k]) });
const read = (dir, f) => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch { return null; } };
const files = (dir) => { try { return fs.readdirSync(dir).sort().map((n) => n + ":" + fs.statSync(path.join(dir, n)).size).join("|"); } catch { return "gone"; } };
const has = (fn) => typeof fn === "function";
const key = (k, o) => Object.assign({ key: k, code: "", ctrlKey: true, shiftKey: false, altKey: false, metaKey: false,
  prevented: false, preventDefault() { this.prevented = true; } }, o || {});

/* The band as painted: each project tab's folder, whether it is on screen, and its cross's act, folder and title. */
function band(html) {
  const out = [];
  const re = /<span class="(tab[^"]*)"([^>]*)>([\s\S]*?)(?=<span class="tab|$)/g;
  for (let m; (m = re.exec(html));) {
    const a = (s, k) => (new RegExp(" " + k + '="([^"]*)"').exec(s) || [])[1] || null;
    const x = /<span class="x"([^>]*)>/.exec(m[3]);
    out.push({ cls: m[1], act: a(m[2], "data-act"), dir: a(m[2], "data-dir"), on: a(m[2], "aria-current") === "page",
      x: x ? { act: a(x[1], "data-act"), dir: a(x[1], "data-dir"), title: a(x[1], "title"), label: a(x[1], "aria-label") } : null });
  }
  return out;
}

/** A page over `root` with the verbs a tab reaches; `writes` is every studio:tabs it sends. */
function pageOver(root, uiLang) {
  const calls = [], writes = [];
  const api = {
    newProject: (n, l, o) => { calls.push("newProject"); return wire(S.newProject(root, n, l, o)); },
    open: (d) => { calls.push("open:" + path.basename(d)); return (slowOpen ? sleep(slowOpen) : Promise.resolve()).then(() => wire(S.openProject(d))); },
    projects: () => wire(S.listProjects(root)),
    proposals: (d) => (process.env.OT7D_SLOW ? sleep(Number(process.env.OT7D_SLOW)) : Promise.resolve()).then(() => wire(S.listProposals(d))),
    saveCard: (d, i, p) => { calls.push("saveCard"); return wire(S.saveCard(d, i, p)); },
    renameTag: (d, i, t) => { calls.push("renameTag"); return wire(S.renameTag(d, i, t)); },
    saveFacts: (d, t) => { calls.push("saveFacts"); return wire(S.saveFacts(d, t)); },
    renameProject: (d, n) => { calls.push("renameProject"); return wire(S.renameProject(d, n)); },
    cardHistory: (d, i) => wire(S.cardHistory(d, i)),
    findPlaces: (d, o) => wire(S.findPlaces(d, o || {})),
    discardUntouched: (d) => wire(S.discardUntouched(d)),
    changeFileName: (d, n) => { calls.push("changeFileName:" + n); return wire(S.changeFileName(d, n)); },
    tabs: (v) => { writes.push(JSON.parse(JSON.stringify(v))); return Promise.resolve({ error: null }); },
  };
  const home = loadPage({ api, uiLang, source });
  const P = home.page;
  P.S.host = { tour: { offered: true }, langs: S.builtLangs() };
  /* the scrolling panes inside #main, which the stand-in cannot lay out: two that keep what is written to them */
  const panes = [{ scrollTop: 0 }, { scrollTop: 0 }];
  const all = home.doc.querySelectorAll;
  home.doc.querySelectorAll = (sel) => (sel === "#main .sc" ? panes : all.call(home.doc, sel));
  const main = home.node("#main");
  const origQuery = home.doc.querySelector.bind(home.doc);
  home.doc.querySelector = (sel) => {
    if (sel === "#fileNameSet") {
      const m = /<input[^>]+id="fileNameSet"[^>]*value="([^"]*)"/i.exec(main.innerHTML);
      if (!m) return null;
      const el = origQuery(sel);
      if (el._lastHtml !== main.innerHTML) {
        el._lastHtml = main.innerHTML;
        el.value = m[1];
      }
      return el;
    }
    const actMatch = /^\[data-act="([^"]+)"\]$/.exec(sel);
    if (actMatch) {
      const act = actMatch[1];
      const re = new RegExp('<button[^>]+data-act="' + act + '"[^>]*>([\\s\\S]*?)<\\/button>', "i");
      const m = re.exec(main.innerHTML);
      if (!m) return null;
      const el = origQuery(sel);
      el.textContent = m[1].replace(/<[^>]+>/g, "").trim();
      return el;
    }
    return origQuery(sel);
  };
  const tabs = () => { P.paint(); return band(home.node("#tabs").innerHTML); };
  async function press(act, dir) {
    if (!P.ACTS[act]) return false;
    try { await P.ACTS[act](el({ "data-act": act, "data-dir": dir, "data-v": dir })); } catch (e) { P.__threw = e; return false; }
    await sleep(40);
    return true;
  }
  /** The launch: the list read, then the tabs the store kept. */
  async function boot(kept) {
    P.S.projects = S.listProjects(root).projects;
    return has(P.restoreTabs) ? P.restoreTabs(kept) : false;
  }
  return { P, home, api, calls, writes, panes, main, tabs, press, boot };
}

async function main(argv) {
  clearScratch(SCRATCH);
  const root = path.join(SCRATCH, "projects");
  fs.mkdirSync(root, { recursive: true });
  const L = [{ code: "en" }, { code: "pl" }];
  const A = await S.newProject(root, "Alpha project", L), B = await S.newProject(root, "Beta project", L);
  const C = await S.newProject(root, "Gamma project", L);
  const shelfA = (await S.addTag(A.dir, "shelf", { en: "Delivery", pl: "Dostawa" })).tag.id;
  const a1 = (await S.addCard(A.dir, shelfA, "Card A one", "Parcels leave on Monday.")).card.id;
  const a2 = (await S.addCard(A.dir, shelfA, "Card A two", "Parcels arrive on Friday.")).card.id;
  const shelfB = (await S.addTag(B.dir, "shelf", { en: "Returns", pl: "Zwroty" })).tag.id;
  const b1 = (await S.addCard(B.dir, shelfB, "Card B one", "Returns take a week.")).card.id;

  const { P, home, calls, writes, panes, main: mainPane, tabs, press, boot } = pageOver(root, "en");
  await boot(null);
  await press("to-projects");

  /* ---- 1. EACH TAB KEEPS ITS PLACE ----------------------------------------------------------- */

  await press("open", A.dir);
  P.S.section = "cards"; P.S.sel = a2; P.S.q = "parcels"; P.S.lang = "pl";
  P.S.undo = { dir: A.dir, title: "Card A three" };
  P.S.ticks = new Set([a1]); P.S.awaitOnly = true; P.S.cardView = "retired";
  mainPane.scrollTop = 420; panes[0].scrollTop = 300; panes[1].scrollTop = 80;
  await press("open", B.dir);
  check(P.S.open && P.S.open.dir === B.dir && P.S.section === "cards" && P.S.sel === null && P.S.q === ""
        && P.S.lang === "en" && P.S.undo === null && mainPane.scrollTop === 0 && panes[0].scrollTop === 0,
    "ot1a a project opened for the first time lands on its cards with nothing picked and its panes at the top: "
    + JSON.stringify({ section: P.S.section, sel: P.S.sel, q: P.S.q, lang: P.S.lang, scroll: mainPane.scrollTop }));
  P.S.sel = b1; mainPane.scrollTop = 50;
  await press("to-project", A.dir);
  check(P.S.open && P.S.open.dir === A.dir && P.S.section === "cards" && P.S.sel === a2 && P.S.q === "parcels" && P.S.lang === "pl",
    "ot1b back on its tab, a project has the section, card, search and language it was left with: "
    + JSON.stringify({ sel: P.S.sel === a2, q: P.S.q, lang: P.S.lang }));
  check(mainPane.scrollTop === 420 && panes[0].scrollTop === 300 && panes[1].scrollTop === 80,
    "ot1c and its scroll, the main pane and each pane inside it: " + [mainPane.scrollTop, panes[0].scrollTop, panes[1].scrollTop]);
  check(P.S.undo && P.S.undo.dir === A.dir,
    "ot1d and the delete it could still take back: " + JSON.stringify(P.S.undo && P.S.undo.title));
  check(P.S.ticks.size === 0 && P.S.awaitOnly === false && P.S.cardView === "active" && P.S.find === null,
    "ot1e what the table narrowed by is clear again, as at every open: ticks " + P.S.ticks.size
    + ", awaiting " + P.S.awaitOnly + ", view " + P.S.cardView);
  await press("to-project", B.dir);
  check(P.S.sel === b1 && mainPane.scrollTop === 50 && P.S.q === "",
    "ot1f and the other tab kept its own place, not the first one's: " + JSON.stringify({ sel: P.S.sel === b1, scroll: mainPane.scrollTop }));
  await S.deleteCard(A.dir, a2);
  await press("to-project", A.dir);
  check(P.S.sel === null && P.S.q === "parcels" && P.S.section === "cards",
    "ot1g a card picked there and deleted on the disk meanwhile is not picked on return, and the rest of the place is: "
    + JSON.stringify({ sel: P.S.sel, q: P.S.q }));
  await press("to-projects");
  P.S.q = "Beta"; mainPane.scrollTop = 30;
  await press("to-project", A.dir);
  await press("to-projects");
  check(P.S.screen === "projects" && P.S.q === "Beta" && mainPane.scrollTop === 30,
    "ot1h the list of projects keeps its own search and scroll the same way: " + JSON.stringify({ q: P.S.q, scroll: mainPane.scrollTop }));
  P.S.q = "";

  /* ---- 2. A WIZARD BELONGS TO ITS TAB -------------------------------------------------------- */

  await press("to-project", A.dir);
  const wizA = { file: path.join(SCRATCH, "a.csv"), base: "a.csv", plan: null, step: 0, no: null, override: { 1: "title" },
    landed: null, intoDir: A.dir, into: true };
  P.S.wiz = wizA;
  await press("to-project", B.dir);
  check(P.S.open.dir === B.dir && P.S.wiz === null && home.sandbox.STUDIO_READY && home.sandbox.STUDIO_READY.screen === "cards",
    "ot2a a wizard opened in one project does not paint over another's tab: " + JSON.stringify(home.sandbox.STUDIO_READY && home.sandbox.STUDIO_READY.screen));
  await press("to-project", A.dir);
  check(P.S.wiz === wizA && P.S.wiz.override[1] === "title",
    "ot2b and is there, as it was left, on its own project's tab again");
  await press("to-projects");
  const wizList = { file: path.join(SCRATCH, "b.csv"), base: "b.csv", plan: null, step: 0, no: null, override: {},
    landed: null, intoDir: "", into: false };
  P.S.wiz = wizList;
  await press("to-project", B.dir);
  const onB = P.S.wiz;
  await press("to-projects");
  check(onB === null && P.S.wiz === wizList,
    "ot2c a wizard opened on the list stays with the list");
  P.S.wiz = null;
  await press("to-project", A.dir);
  P.S.wiz = null;

  /* ---- 3. THE CROSS ----------------------------------------------------------------------------- */

  await press("open", C.dir);
  await press("to-project", A.dir);
  const t3 = tabs();
  const proj = t3.filter((t) => t.act === "to-project");
  check(proj.length === 3 && proj.every((t) => t.x && t.x.act === "close-tab" && t.x.dir === t.dir
        && t.x.title === "Close catalog" && t.x.label === "Close catalog")
        && t3.filter((t) => t.act !== "to-project").every((t) => !t.x),
    "ot3a every project's tab carries a cross that closes that project, titled and labelled, and the list's tab and \"+\""
    + " carry none: " + JSON.stringify(t3.map((t) => [t.act, t.x && t.x.act])));
  const cFiles = files(C.dir), w3 = writes.length;
  await press("close-tab", C.dir);
  check(P.S.tabs.map((t) => t.dir).join() === [A.dir, B.dir].join() && P.S.open.dir === A.dir && P.S.screen === "project"
        && P.S.q === "parcels" && files(C.dir) === cFiles && writes.length > w3
        && writes[writes.length - 1].open.map((t) => t.dir).join() === [A.dir, B.dir].join(),
    "ot3b closing a tab not on screen takes it from the band and from what the next launch opens, the screen stays as"
    + " it was, and the folder is untouched: " + P.S.tabs.map((t) => t.name).join(", "));
  /* A, the first tab, with a card, a category and the facts being typed: left of it is the list, which sends nothing */
  P.S.sel = a1;
  const nC = calls.length;
  P.queueSave(a1, { body: { en: "Typed before the cross." } });
  P.queueTagSave(shelfA, "en", "Delivery typed before the cross");
  P.queueFacts("Facts typed before the cross.");
  await press("close-tab", A.dir);
  const dA = read(A.dir, DRAFT_FILE) || {};
  const sent = ["saveCard", "renameTag", "saveFacts"].map((c) => calls.indexOf(c, nC));
  check(((dA.cards || []).find((c) => c.id === a1) || { body: {} }).body.en === "Typed before the cross."
        && ((dA.tags || []).find((t) => t.id === shelfA) || { label: {} }).label.en === "Delivery typed before the cross"
        && dA.facts === "Facts typed before the cross." && sent.every((i) => i >= 0)
        && P.S.screen === "projects" && P.S.tabs.map((t) => t.dir).join() === B.dir,
    "ot3c the card, the category and the facts being typed are on the project's disk when its tab has closed, and the"
    + " first tab gives way to the list, left of it: sent at " + sent + ", on " + P.S.screen);
  await press("to-project", B.dir);
  P.S.q = "returns";
  await press("open", A.dir);
  await press("close-tab", A.dir);
  check(P.S.screen === "project" && P.S.open.dir === B.dir && P.S.q === "returns"
        && P.S.tabs.map((t) => t.dir).join() === B.dir && fs.existsSync(path.join(A.dir, DRAFT_FILE)),
    "ot3d closing the tab on screen lands on the tab to its left, in its place, and the folder stays: on "
    + path.basename(P.S.open.dir) + ", tabs " + P.S.tabs.length);
  await press("close-tab", B.dir);
  check(P.S.screen === "projects" && P.S.tabs.length === 0 && !P.S.err && writes[writes.length - 1].open.length === 0
        && writes[writes.length - 1].on === "",
    "ot3e closing the last tab lands on the list, and the next launch opens none: " + P.S.screen);
  await press("open", A.dir);
  P.S.sel = a1;
  const api0 = home.sandbox.STUDIO, save0 = api0.saveCard;
  api0.saveCard = () => Promise.resolve({ error: "the disk refused", said: null, disk: true });
  P.queueSave(a1, { body: { en: "Refused." } });
  const kept3 = has(P.closeTab) ? await P.closeTab(A.dir) : true;
  api0.saveCard = save0;
  check(kept3 === false && P.S.tabs.some((t) => t.dir === A.dir) && P.S.open.dir === A.dir && P.S.screen === "project"
        && /refused/.test(JSON.stringify(P.S.err || "")),
    "ot3f a save the disk refuses keeps the tab open on screen, with the sentence: tabs " + P.S.tabs.length
    + ", err " + JSON.stringify(P.S.err));
  P.S.err = null;
  if (has(P.closeTab)) await P.closeTab(A.dir);       /* the refused edit is sent again, and goes now */
  const pl = loadPage({ api: {}, uiLang: "pl", source });
  pl.page.S.tabs = [{ dir: A.dir, name: "Alpha project", rev: 0 }];
  pl.page.paintTabs();
  const plX = (band(pl.node("#tabs").innerHTML).find((t) => t.act === "to-project") || {}).x || {};
  check(plX.title === "Zamknij katalog" && plX.label === "Zamknij katalog",
    "ot3g in Polish the cross is \"Zamknij katalog\": " + plX.title);

  /* ---- 4. THE KEYS -------------------------------------------------------------------------------- */

  await press("open", A.dir);
  await press("open", B.dir);
  const tk = (k, o) => { const e = key(k, o); const did = has(P.tabKey) ? P.tabKey(e) : ""; return { did, e }; };
  await press("to-project", A.dir);
  const k1 = tk("Tab"); await sleep(60);
  const at1 = P.S.screen === "project" ? path.basename(P.S.open.dir) : "list";
  const k2 = tk("Tab"); await sleep(60);
  const at2 = P.S.screen === "project" ? path.basename(P.S.open.dir) : "list";
  const k3 = tk("Tab"); await sleep(60);
  const at3 = P.S.screen === "project" ? path.basename(P.S.open.dir) : "list";
  check(k1.e.prevented && k2.e.prevented && k3.e.prevented && [at1, at2, at3].join() === "Beta project,list,Alpha project",
    "ot4a Ctrl+Tab walks the band to the right and round past the end, the list included: " + [at1, at2, at3].join(" > "));
  const k4 = tk("Tab", { shiftKey: true }); await sleep(60);
  const at4 = P.S.screen === "project" ? path.basename(P.S.open.dir) : "list";
  const k5 = tk("Tab", { shiftKey: true }); await sleep(60);
  const at5 = P.S.screen === "project" ? path.basename(P.S.open.dir) : "list";
  check(k4.e.prevented && k5.e.prevented && [at4, at5].join() === "list,Beta project",
    "ot4b Ctrl+Shift+Tab walks it to the left, round past the start: " + [at4, at5].join(" > "));
  const k6 = tk("w", { code: "KeyW" }); await sleep(80);
  const after6 = P.S.tabs.map((t) => path.basename(t.dir)).join();
  const on6 = P.S.screen === "project" ? path.basename(P.S.open.dir) : "list";
  const k7 = tk("F4", { code: "F4" }); await sleep(80);
  check(k6.e.prevented && k7.e.prevented && after6 === "Alpha project" && on6 === "Alpha project"
        && P.S.screen === "projects" && P.S.tabs.length === 0,
    "ot4c Ctrl+W closes the project on screen and Ctrl+F4 does the same: " + after6 + " left on " + on6
    + ", then " + P.S.screen);
  await press("open", A.dir);
  const quiet = [tk("Tab", { ctrlKey: false }), tk("w", { ctrlKey: false, code: "KeyW" }), tk("Tab", { altKey: true })];
  P.S.cover = "about"; quiet.push(tk("Tab"), tk("w", { code: "KeyW" })); P.S.cover = null;
  P.S.tour = 2; quiet.push(tk("F4")); P.S.tour = null;
  await press("to-projects");
  quiet.push(tk("w", { code: "KeyW" }));
  await sleep(60);
  check(has(P.tabKey) && quiet.every((q) => !q.did && !q.e.prevented) && P.S.tabs.length === 1 && P.S.screen === "projects",
    "ot4d nothing happens and the key is left alone without Ctrl, with Alt, under a cover, under the tour, or Ctrl+W on"
    + " the list: " + JSON.stringify(quiet.map((q) => q.did)));

  /* ---- 5. THE NEXT LAUNCH ------------------------------------------------------------------------- */

  await press("open", B.dir);
  await press("to-project", A.dir);
  const last = writes[writes.length - 1] || {};
  check(JSON.stringify(last) === JSON.stringify({ open: [{ dir: A.dir, name: "Alpha project", rev: 0 },
        { dir: B.dir, name: "Beta project", rev: 0 }], on: A.dir }),
    "ot5a each change writes the band in its order and the tab on screen: " + JSON.stringify(last && last.on && path.basename(last.on)));
  const w5 = writes.length;
  await press("to-project", A.dir);
  check(writes.length === w5,
    "ot5b pressing the tab already on screen changes nothing and writes nothing: " + (writes.length - w5));

  const gone = path.join(root, "Gone project");
  const awayDir = path.join(SCRATCH, "share-down", "Away project");
  const kept = S.openTabs({ open: [{ dir: A.dir, name: "Old name", rev: 0 }, { dir: gone, name: "Gone project", rev: 1 },
    { dir: awayDir, name: "Away project", rev: 2 }, { dir: B.dir, name: "Beta project", rev: 0 }], on: B.dir });
  check(kept.open.map((t) => t.dir).join() === [A.dir, B.dir].join() && kept.away.map((t) => t.dir).join() === awayDir
        && kept.on === B.dir,
    "ot5c a launch keeps the tabs whose folder holds a project, leaves out a folder that is gone, and holds aside one on a"
    + " share it cannot reach: open " + kept.open.length + ", away " + kept.away.length);
  const clean = S.keptTabs({ open: [{ dir: "relative\\x" }, { dir: A.dir, name: "A", rev: "3" }, { dir: A.dir },
    7, null, { dir: B.dir, name: { evil: 1 }, rev: 1 }].concat(Array.from({ length: 80 }, (_, i) => ({ dir: path.join(root, "n" + i) }))),
    on: "elsewhere" });
  check(clean.open.length === 64 && clean.open[0].dir === A.dir && clean.open[0].rev === 3 && clean.open[1].dir === B.dir
        && typeof clean.open[1].name === "string" && clean.on === "",
    "ot5d what is kept is folders named in full, each once, at most 64, with a name and a number, and an on-screen tab"
    + " that is one of them: " + clean.open.length);

  const second = pageOver(root, "en");
  const restored = await second.boot(kept);
  const Q = second.P;
  check(restored === true && Q.S.screen === "project" && Q.S.open && Q.S.open.dir === B.dir
        && Q.S.tabs.map((t) => t.dir).join() === [A.dir, B.dir].join() && Q.S.tabs[0].name === "Alpha project"
        && second.calls.filter((c) => /^open:/.test(c)).join() === "open:Beta project",
    "ot5e the launch opens the tab that was on screen, puts the others in the band unopened, named as the list names"
    + " them: " + Q.S.tabs.map((t) => t.name).join(", ") + ", opened " + second.calls.filter((c) => /^open:/.test(c)));
  check(second.writes.length === 0,
    "ot5f and writes nothing while it does: " + second.writes.length);
  await second.press("to-project", A.dir);
  const w5g = second.writes[second.writes.length - 1] || { open: [] };
  check(w5g.open.map((t) => t.dir).join() === [A.dir, B.dir, awayDir].join() && w5g.on === A.dir,
    "ot5g the first change after it writes the share's tab back with the rest, so a launch that reaches it opens it: "
    + w5g.open.map((t) => path.basename(t.dir)).join(", "));

  const lost = await S.newProject(root, "Lost project", L);
  const third = pageOver(root, "en");
  const lostKept = S.openTabs({ open: [{ dir: A.dir }, { dir: lost.dir }], on: lost.dir });
  fs.rmSync(path.join(lost.dir, DRAFT_FILE));
  const r3 = await third.boot(lostKept);
  check(r3 === false && third.P.S.screen === "projects" && !third.P.S.err && third.P.S.tabs.map((t) => t.dir).join() === A.dir
        && third.writes.length === 0,
    "ot5h a tab that was on screen and will not open now is left out, the launch is on the list, and nothing is said"
    + " or written: tabs " + third.P.S.tabs.length + ", err " + JSON.stringify(third.P.S.err));

  /* i: open the tab of a moved project: leaves no other project on screen and says what is wrong (board 949 W6) */
  const moved = await S.newProject(root, "Moved project", L);
  const fourth = pageOver(root, "en");
  await fourth.boot(null);
  await fourth.press("open", A.dir);
  await fourth.press("open", moved.dir);
  await fourth.press("to-project", A.dir);
  const awayMoved = path.join(SCRATCH, "moved-away-" + Date.now());
  fs.renameSync(moved.dir, awayMoved);
  await fourth.press("to-project", moved.dir);
  const mainHtml = fourth.home.node("#main").innerHTML;
  const enSaid = "To open Moved project, Studio needs its folder, which is no longer at " + moved.dir
    + " or is on a drive not connected now. Once the drive is connected, the catalog opens here again; a folder moved elsewhere opens with Open a folder as a catalog of its own, and this one can then be closed with Close catalog.";
  check(fourth.P.S.screen === "unopened" && fourth.P.S.open === null
        && fourth.P.S.unopened && fourth.P.S.unopened.dir === moved.dir && fourth.P.S.unopened.name === "Moved project"
        && mainHtml.indexOf(enSaid) >= 0 && !/Alpha project|Card A one|Parcels leave/.test(mainHtml)
        && fourth.home.node("#chrome").innerHTML === "" && fourth.home.node("#rail").innerHTML === ""
        && mainHtml.indexOf('data-act="pick-root"') >= 0,
    "ot5i open the tab of a moved project: leaves no other project's content under its name, its tab says what is wrong"
    + " and how to find the folder, with Open a folder offered and chrome and rail cleared (board 949 W6; red where the previous project stays on screen)");

  /* j: and on a Polish desk opening the tab of a moved project says it in Polish, the copywriter's sentence, with no English left (board 949 W6) */
  const plMoved = pageOver(root, "pl");
  plMoved.P.S.tabs = [{ dir: A.dir, name: "Alpha project", rev: 0 }, { dir: moved.dir, name: "Moved project", rev: 0 }];
  Object.assign(plMoved.P.S, { open: { dir: A.dir, name: "Alpha project" }, screen: "project", section: "cards" });
  await plMoved.press("to-project", moved.dir);
  const plHtml = plMoved.home.node("#main").innerHTML;
  const plSaid = "Aby otworzyć katalog Moved project, Studio potrzebuje jego folderu, a nie ma go już w miejscu " + moved.dir
    + " albo leży on na dysku, który nie jest teraz podłączony. Gdy dysk zostanie podłączony, katalog znów się tu otworzy; folder przeniesiony gdzie indziej otworzy się przez Otwórz folder jako osobny katalog, a ten można wtedy zamknąć przyciskiem Zamknij katalog.";
  check(plMoved.P.S.screen === "unopened" && plMoved.P.S.open === null && plHtml.indexOf(plSaid) >= 0
        && !/To open|needs its folder|Open a folder|Alpha project/.test(plHtml),
    "ot5j and on a Polish desk opening the tab of a moved project says it in Polish, the copywriter's sentence, with no English left (board 949 W6)");
  fs.renameSync(awayMoved, moved.dir);

  /* ---- 6. CONTROLS ------------------------------------------------------------------------------------ */

  const fresh = pageOver(root, "en");
  const r6 = await fresh.boot(undefined);
  await fresh.press("to-projects");
  check(r6 === false && fresh.P.S.screen === "projects" && fresh.P.S.tabs.length === 0
        && fresh.calls.filter((c) => /^open:/.test(c)).length === 0 && fresh.writes.length === 0,
    "ot6a CONTROL: a profile that kept no tabs starts on the list, opens nothing and writes nothing, even after a press"
    + " of the list's own tab");
  await fresh.press("open", C.dir);
  const F = fresh.P.S;
  check(F.screen === "project" && F.open.dir === C.dir && F.section === "cards" && F.sel === null && F.q === ""
        && F.awaitOnly === false && F.cardView === "active" && F.ticks.size === 0 && F.find === null && F.undo === null
        && F.wiz === null && F.lang === "en" && F.tabs.length === 1,
    "ot6b CONTROL: a project opened from the list lands on its cards, as before: " + JSON.stringify({ section: F.section, tabs: F.tabs.length }));
  await fresh.press("to-project", C.dir);
  check(F.tabs.length === 1 && F.open.dir === C.dir && fresh.calls.filter((c) => c === "newProject").length === 0,
    "ot6c CONTROL: its tab pressed again opens it again and adds no tab");

  /* ---- 7. WORK STARTED FOR ONE TAB FINISHES IN THAT TAB --------------------------------------------
     Each answer is held by a promise until the band has moved, as a slow file or a slow share holds it; the test
     architect's probes W1, W2 and P1 of the read of 6412866, made legs. */

  const NL = String.fromCharCode(13, 10);
  const csv = (name, n) => { const f = path.join(SCRATCH, name); fs.writeFileSync(f, ["Title,Body,Category"]
    .concat(Array.from({ length: n }, (_, i) => "Row " + i + ",Text " + i + ",shelf " + (i % 3))).join(NL) + NL); return f; };
  const D = await S.newProject(root, "Delta project", L), E = await S.newProject(root, "Epsilon project", L);
  /* Delta holds a card, so an import into it waits in Proposals (d): a project with no cards takes one directly (Argon's
     first-day review, F5; tests/drop.mjs fd5b). */
  await S.addCard(D.dir, (await S.addTag(D.dir, "shelf", { en: "Held", pl: "Trzymane" })).tag.id, "Held card", "Kept here.");
  const hold = () => { let open; const shut = new Promise((r) => (open = r)); return { shut, open }; };
  const seven = pageOver(root, "en");
  const W = seven.P, wapi = seven.home.sandbox.STUDIO;
  await seven.boot(null);
  let pick = "", planGate = null, landGate = null, planFor = "";
  wapi.importPick = async () => ({ error: null, file: pick });
  wapi.importPlan = async (f, o, i) => { if (planGate && f === planFor) await planGate.shut; return wire(S.importPlan(root, f, o || {}, i || "")); };
  wapi.importLand = async (f, o, i, fingerprint) => { if (landGate) await landGate.shut; return wire(S.importLand(root, f, o || {}, i || "", fingerprint)); };
  wapi.proposalOpen = (d, f, l) => wire(S.openProposal(d, f, { lang: l || "" }));
  const at = () => (W.S.screen === "project" ? path.basename(W.S.open.dir) : "list");

  /* a: a new project landed while another tab is on screen */
  W.__threw = null;
  await seven.press("open", D.dir);
  pick = csv("landed while away.csv", 5);
  await seven.press("wiz-pick");
  const wizD = W.S.wiz;
  if (wizD) wizD.into = false;
  await seven.press("wiz-next");
  landGate = hold();
  const landing = seven.press("wiz-land");
  await sleep(30);
  await seven.press("open", E.dir);
  landGate.open(); await landing; landGate = null; await sleep(80);
  const keptD = (W.S.tabs.find((t) => t.dir === D.dir) || {}).place;
  check(!W.__threw && W.S.tabs.length === 3 && W.S.wiz === wizD && wizD && wizD.step === 2 && !!wizD.landed
        && W.S.open.dir === wizD.landed.dir && !(keptD && keptD.wiz),
    "ot7a a draft landed while another tab is on screen lands in its own new tab, and the tab it was opened in keeps"
    + " no wizard: " + JSON.stringify({ threw: W.__threw && W.__threw.message, on: at(), tabs: W.S.tabs.length,
      step: wizD && wizD.step, keptWizard: !!(keptD && keptD.wiz) }));
  W.__threw = null;

  /* b: a plan arriving after the band moved to a tab with its own wizard */
  await seven.press("to-project", E.dir);
  pick = csv("seven rows.csv", 7);
  await seven.press("wiz-pick");
  const wizE = W.S.wiz, planE = wizE && wizE.plan;
  await seven.press("to-project", D.dir);
  pick = csv("four rows.csv", 4); planFor = pick; planGate = hold();
  const picking = seven.press("wiz-pick");
  await sleep(30);
  const wizD2 = W.S.wiz;
  await seven.press("to-project", E.dir);
  planGate.open(); await picking; planGate = null; await sleep(80);
  check(W.S.wiz === wizE && !!planE && wizE.plan === planE && wizD2 && wizD2 !== wizE && !!wizD2.plan && !W.S.err,
    "ot7b a plan that arrives after the band moved is its own wizard's, and the wizard on screen keeps its plan: "
    + JSON.stringify({ on: at(), ownPlanKept: !!planE && wizE.plan === planE, otherGotPlan: !!(wizD2 && wizD2.plan) }));
  await seven.press("to-project", D.dir);
  check(W.S.wiz === wizD2 && wizD2.plan && wizD2.base === "four rows.csv",
    "ot7c and the tab it was asked in has it on return: " + JSON.stringify(W.S.wiz && W.S.wiz.base));
  await seven.press("wiz-cancel");

  /* d: an import into this project, landed while another tab is on screen */
  pick = csv("into while away.csv", 3);
  await seven.press("wiz-pick");
  const wizInto = W.S.wiz;
  await seven.press("wiz-next");
  landGate = hold();
  const into = seven.press("wiz-land");
  await sleep(30);
  await seven.press("to-project", E.dir);
  /* Epsilon's quiet inbox read (rvPeek) fills its rv when it lands: take the snapshot after it, not 40 ms after the press */
  await until(() => at() === "Epsilon project" && !!W.S.rv, "Epsilon's inbox read never landed on its tab");
  const eSection = W.S.section, eRv = W.S.rv;
  landGate.open(); await into; landGate = null;
  /* the press returns once the land has handed the file to Delta's tab and left: nothing else is pending on Epsilon's */
  const inboxD = (await S.listProposals(D.dir)).proposals || [];
  const onE = { on: at(), section: W.S.section, rvSame: W.S.rv === eRv, wiz: W.S.wiz === wizE };
  await seven.press("to-project", D.dir);
  /* Delta's tab comes back on Proposals and reads its inbox on the way in: wait for the read, not for 40 ms */
  await until(() => at() === "Delta project" && W.S.section === "proposals" && !!W.S.rv && W.S.rv.list.length === 1,
    "Delta's Proposals never showed its one waiting file after its tab came back");
  check(!W.__threw && wizInto && wizInto.intoDir === D.dir && inboxD.length === 1 && onE.on === "Epsilon project"
        && onE.section === eSection && onE.rvSame && onE.wiz && W.S.section === "proposals" && !W.S.wiz
        && W.S.rv && W.S.rv.list.length === 1,
    "ot7d an import into this project landed while another tab is on screen leaves its file in that project's inbox,"
    + " touches nothing on the tab on screen, and its tab comes back on Proposals: " + JSON.stringify({ inbox: inboxD.length,
      onE, back: W.S.section, wiz: !!W.S.wiz, threw: W.__threw && W.__threw.message }));
  W.__threw = null;

  slowOpen = Number(process.env.OT7D_SLOW_OPEN || 0);
  /* e: a plan refused while its tab is away comes back with its sentence, and says nothing on the tab on screen */
  const plan0 = wapi.importPlan;
  pick = csv("refused while away.csv", 2); planFor = pick; planGate = hold();
  wapi.importPlan = async (f) => { if (f === planFor) { await planGate.shut; return { error: "the share refused the file", said: null, disk: true }; } return plan0(f); };
  const refusing = seven.press("wiz-pick");
  await until(() => !!W.S.wiz, "the wizard for the refused plan never came on screen");
  const wizR = W.S.wiz;
  await seven.press("to-project", E.dir);
  await until(() => at() === "Epsilon project", "Epsilon's tab never came on screen");
  planGate.open(); await refusing; planGate = null;
  await until(() => /share refused/.test(String(wizR && wizR.said)), "the refusal was never kept for its own tab");
  const errOnE = W.S.err;
  await seven.press("to-project", D.dir);
  await until(() => at() === "Delta project" && /share refused/.test(String(W.S.err)), "Delta's tab never came back with the refusal's sentence");
  check(!errOnE && W.S.wiz && W.S.wiz.base === "refused while away.csv" && /share refused/.test(String(W.S.err)),
    "ot7e a plan refused while its tab is away puts no sentence on the tab on screen, and its own tab says it on return: "
    + JSON.stringify({ onE: errOnE, back: W.S.err }));
  wapi.importPlan = plan0;
  await seven.press("wiz-cancel"); W.S.err = null;

  /* f: a section read that lands after the band moved on; both tabs left on Proposals, the first one's read slower */
  const prop0 = wapi.proposals; let slow = null, held = 0, delivered = 0;
  wapi.proposals = async (d) => { if (process.env.OT7D_SLOW) await sleep(Number(process.env.OT7D_SLOW));
    const gated = !!slow && d === D.dir; if (gated) { held++; await slow.shut; }
    const r = Object.assign(await wire(S.listProposals(d)), { inbox: "inbox of " + path.basename(d) });
    if (gated) delivered++;
    return r; };
  const readOf = (name) => () => W.S.section === "proposals" && !!W.S.rv && W.S.rv.inbox === "inbox of " + name;
  await seven.press("to-project", E.dir);
  await until(() => at() === "Epsilon project", "Epsilon's tab never came on screen");
  W.ACTS.section(el({ "data-v": "proposals" }));
  await until(readOf("Epsilon project"), "Epsilon's Proposals read never landed");
  seven.main.scrollTop = 70;
  await seven.press("to-project", D.dir);
  await until(() => at() === "Delta project", "Delta's tab never came on screen");
  W.ACTS.section(el({ "data-v": "proposals" }));
  await until(readOf("Delta project"), "Delta's Proposals read never landed");
  seven.main.scrollTop = 200;
  await seven.press("to-project", E.dir);
  await until(() => at() === "Epsilon project" && readOf("Epsilon project")(), "Epsilon's tab never came back on its Proposals");
  slow = hold();
  W.ACTS["to-project"](el({ "data-dir": D.dir }));
  await until(() => held >= 1, "Delta's slow read was never asked for");
  W.ACTS["to-project"](el({ "data-dir": E.dir }));
  await until(() => at() === "Epsilon project" && readOf("Epsilon project")(), "Epsilon's tab never came back on its Proposals");
  slow.open(); slow = null;
  await until(() => delivered >= 1, "Delta's slow read never answered");
  await sleep(0);                                      /* its continuation is microtasks: let them run before the check */
  check(at() === "Epsilon project" && W.S.section === "proposals" && W.S.rv && W.S.rv.inbox === "inbox of Epsilon project"
        && seven.main.scrollTop === 70,
    "ot7f a section's read that lands after the band moved on is dropped: the tab on screen keeps its own inbox and"
    + " its own scroll: " + JSON.stringify({ on: at(), section: W.S.section, inbox: W.S.rv && W.S.rv.inbox, scroll: seven.main.scrollTop }));
  wapi.proposals = prop0;
  slowOpen = 0;

  /* ---- 8. THE TEAM SCREEN KEEPS EACH TEAM'S READS, COVERS AND CODES TO ITS OWN TEAM -------------------------- */

  /* The folder's facts are invented per catalog/team, named by the folder they claim, so a roster painted on the wrong
     team shows by its name; a gate holds one folder's answer while the band or strip moves. */
  const eight = pageOver(root, "en");
  const G = eight.P, gapi = eight.home.sandbox.STUDIO;
  await eight.boot(null);
  const openD8 = await S.openProject(D.dir), openE8 = await S.openProject(E.dir);
  const share = (d) => "share of " + path.basename(d);
  const plainOf = {};
  const teamD = { id: "team-" + path.basename(D.dir), connection: "folder", folder: share(D.dir), sealed: true, led: true,
    catalogs: [openD8.project.id], project: { id: openD8.project.id, name: openD8.name, dir: D.dir, rev: 0 },
    projects: [{ id: openD8.project.id, name: openD8.name, dir: D.dir, rev: 0 }], teammates: [], count: 0 };
  const teamE = { id: "team-" + path.basename(E.dir), connection: "folder", folder: share(E.dir), sealed: true, led: true,
    catalogs: [openE8.project.id], project: { id: openE8.project.id, name: openE8.name, dir: E.dir, rev: 0 },
    projects: [{ id: openE8.project.id, name: openE8.name, dir: E.dir, rev: 0 }], teammates: [], count: 0 };
  gapi.teams = async () => ({ teams: [teamD, teamE] });
  const facts = (d, requests) => ({ error: null, folder: share(d), signing: true, keyHeld: true, canKeep: true,
    file: "ours", team: { id: "team-" + path.basename(d), epoch: 1, sealed: !plainOf[d], relay: true, roster: [] }, requests: requests || [] });
  const asks = (id, state) => [{ id, name: "Desk " + id, key: "ab12cd34ef56", state, asked: "2026-10-04T10:00:00Z" }];
  const reqs = {}, deskReads = [];
  let deskGate = null, deskGateFor = "";
  gapi.desks = async (d) => { deskReads.push(d); if (deskGate && d === deskGateFor) await deskGate.shut; return facts(d, reqs[d]); };
  const onG = () => (G.S.screen === "project" ? path.basename(G.S.open.dir)
    : G.S.screen === "projects" && G.S.home === "team" ? "team:" + G.S.teamTab : "list");
  const painted = () => eight.main.innerHTML;
  const toTeam = async () => { await G.ACTS["to-team"](); await sleep(60); };
  const teamTab = async (i) => { await G.ACTS["team-tab"](el({ "data-i": String(i) })); await sleep(60); };
  const deskSeen = () => ({ on: onG(), home: G.S.home, teamTab: G.S.teamTab, folder: G.S.desks && G.S.desks.folder,
    paintedD: painted().indexOf(share(D.dir)) >= 0, paintedE: painted().indexOf(share(E.dir)) >= 0 });
  /* E stays on its own Team tab throughout; whatever lands for D must leave it as it is */
  const eOwn = (s) => s.on === "team:1" && s.folder === share(E.dir) && s.paintedE && !s.paintedD;

  /* a: a catalog's Team link opens its team on the home tab, and switching back re-reads its folder */
  await eight.press("to-project", D.dir); await toTeam();
  const firstD = deskSeen();
  await eight.press("to-project", E.dir); await toTeam();
  const readsBefore = deskReads.filter((d) => d === D.dir).length;
  await teamTab(0);
  const backD = deskSeen();
  check(firstD.on === "team:0" && firstD.folder === share(D.dir) && firstD.paintedD
        && backD.on === "team:0" && backD.folder === share(D.dir) && backD.paintedD
        && deskReads.filter((d) => d === D.dir).length === readsBefore + 1,
    "ot8a Team reads and paints its own team's folder when opened from a catalog, and again on return: "
    + JSON.stringify({ firstD, backD, readsOnReturn: deskReads.filter((d) => d === D.dir).length - readsBefore }));

  /* b: a Team read that lands after the strip moved on */
  await teamTab(1);
  deskGate = hold(); deskGateFor = D.dir;
  G.ACTS["team-tab"](el({ "data-i": "0" })); await sleep(30);
  G.ACTS["team-tab"](el({ "data-i": "1" })); await sleep(80);
  deskGate.open(); deskGate = null; await sleep(80);
  const lateRead = deskSeen();
  check(eOwn(lateRead),
    "ot8b a Team read that lands after the strip moved on is dropped, and the team on screen keeps its own roster: "
    + JSON.stringify(lateRead));

  /* RETIRED, P2 (the code door is gone: no request is opened, no code is typed, no admission is pressed, and the Team screen no longer reads its folder
     every two seconds for a desk that has yet to answer): ot8c, "a refresh of the Team screen answered after the strip moved on is dropped, and the team on
     screen keeps its own roster"; ot8d, "CONTROL: back on its team the screen reads its folder again two seconds on, while the desk has yet to answer";
     ot8e, "a code typed on one team's screen stays with that team, and is in its field again on return"; ot8f, "an admission, sent with no cover, answered after
     the strip moved on says nothing on the team on screen"; ot8g, "an opening answered after the strip moved on puts nothing on the team on screen". What
     they held between two teams stays held for a roster read (ot8b, ot8l) and for a refusal (ot8j, ot8o). */
  reqs[D.dir] = asks("rR", "asks");
  await teamTab(1);

  /* h: a team cover asked on D while E's tab, pressed first, is still opening; E then lands under the cover. Whatever the
     cover was (Seal, Plain), it must not be answered for E: its solid button, pressed as it then reads, sends nothing. Admit
     has no cover since the key is kept by the operating system: its press is for D, the team it was made on, and says
     nothing on E. */
  const coverCases = [];
  /* MOVED 2026-11-26: the cover is a desk's export's (the Publishing switch's cover, Seal and Plain, has gone with the switch). */
  for (const want of ["sealed"]) {
    reqs[D.dir] = asks("rR", "asks"); plainOf[D.dir] = want === "sealed";
    await eight.press("to-project", D.dir); await toTeam();
    const sent = [];
    gapi.teamExports = async (d, on) => { sent.push("teamExports " + path.basename(d) + " " + on); return { error: null }; };
    const slowOpen = hold(), realOpen = gapi.open;
    gapi.open = async (d) => { if (d === E.dir) await slowOpen.shut; return realOpen(d); };
    const going = G.ACTS["to-project"](el({ "data-dir": E.dir })); await sleep(30);
    G.ACTS["team-exports"](el({ "data-v": want }));
    const asked = G.S.cover;
    slowOpen.open(); await going; await sleep(60);
    gapi.open = realOpen;
    const act = G.S.cover ? (/class="btn solid" data-act="([^"]+)"/.exec(eight.home.node("#dlg").innerHTML) || [])[1] : null;
    if (act && G.ACTS[act]) await G.ACTS[act]();
    await sleep(40);
    coverCases.push({ want, asked, on: onG(), coverLeft: G.S.cover, pressed: act || null, sent });
    G.S.cover = null;
  }
  plainOf[D.dir] = false;
  /* P2: ot8h also held "an Admit, which has no cover, is for the team it was pressed on"; no Admit is pressed now. */
  const seals = coverCases;
  check(seals.length === 1 && seals.every((c) => c.asked === "team" && c.on === "Epsilon project" && !c.coverLeft && !c.pressed && !c.sent.length) && !G.S.dkNote,
    "ot8h a team cover asked for one team is closed when another catalog lands under it, and nothing is sealed or unsealed"
    + " for the newcomer: " + JSON.stringify(coverCases));

  /* RETIRED, P2: ot8i, "on the team on screen an opening, the refresh and a refusal each land" (no opening and no refresh now). */
  reqs[D.dir] = asks("rI", "asks");
  await eight.press("to-project", D.dir); await toTeam();
  gapi.deskRefuse = async (d) => { reqs[d] = []; return facts(d, []); };

  /* j: Refuse, answered after the strip moved on */
  reqs[D.dir] = asks("rJ", "ready");
  await teamTab(0);
  const refuseGate = hold();
  gapi.deskRefuse = async (d) => { await refuseGate.shut; return facts(d, []); };
  const deskRefusing = G.ACTS["desk-refuse"](el({ "data-id": "rJ" })); await sleep(30);
  await teamTab(1);
  refuseGate.open(); await deskRefusing; await sleep(60);
  const lateRefuse = deskSeen();
  check(eOwn(lateRefuse),
    "ot8j a refusal answered after the strip moved on puts nothing on the team on screen: " + JSON.stringify(lateRefuse));

  /* k: a desk's export switch refused after its cover was closed and the strip moved on (was: the Sealed switch, gone 2026-11-26) */
  await teamTab(0);
  const sealGate = hold();
  gapi.teamExports = async () => { await sealGate.shut; return { error: "the share refused the team file", said: null, disk: true }; };
  G.ACTS["team-exports"](el({ "data-v": "sealed" }));
  const sealCover = G.S.cover;
  const sealing = G.ACTS["do-team-exports"](); await sleep(30);
  G.ACTS["cover-close"]();
  await teamTab(1);
  sealGate.open(); await sealing; await sleep(60);
  const lateSeal = Object.assign(deskSeen(), { err: G.S.err || null, cover: G.S.cover });
  check(sealCover === "team" && eOwn(lateSeal) && !lateSeal.err && !lateSeal.cover,
    "ot8k a Seal refused after its cover was closed and the strip moved on says nothing on the team on screen: "
    + JSON.stringify(lateSeal));

  /* l: a roster's late answer after the lead LEFT home Team. The Team screen is no tab of a catalog, so what ot8b to ot8k hold
     between two teams is held here for the two ways out: to a catalog's tab and to Overview. Each answer is held at the gate
     while the lead moves away, then let go; S.desks, the note and the screen must be what they were before it landed. */
  const leftTeam = {};
  for (const kind of ["read", "refuse"]) {
    const outs = [];
    for (const dest of ["catalog", "overview"]) {
      reqs[D.dir] = asks("rL", "asks");
      await eight.press("to-project", D.dir); await toTeam(); await teamTab(0);
      let pending = null, gate = hold();
      if (kind === "read") { deskGate = gate; deskGateFor = D.dir; pending = G.desksLoad(D.dir); await sleep(30); }
      else {
        gapi.deskRefuse = async (d) => { await gate.shut; return Object.assign(facts(d, []), { answerSaid: "a late refusal" }); };
        pending = G.ACTS["desk-refuse"](el({ "data-id": "rL" })); await sleep(30);
      }
      if (dest === "catalog") { await eight.press("to-project", E.dir); await sleep(80); }
      else { await G.ACTS.home(el({ "data-v": "overview" })); await sleep(60); }
      const before = { desks: G.S.desks, note: G.S.dkNote, screen: G.S.screen, home: G.S.home, open: G.S.open && G.S.open.dir };
      gate.open(); deskGate = null; if (pending) await pending; await sleep(100);
      outs.push(dest + ":" + (G.S.desks === before.desks && G.S.dkNote === before.note && G.S.screen === before.screen
        && G.S.home === before.home && (G.S.open && G.S.open.dir) === before.open
        && !(G.S.desks && G.S.desks.folder === share(D.dir) && before.desks !== G.S.desks) ? "held" : "CHANGED"));
    }
    leftTeam[kind] = outs;
  }
  gapi.deskRefuse = undefined;
  check(leftTeam.read.every((x) => /held$/.test(x)),
    "ot8l a roster read that lands after the lead left Team for a catalog's tab, or for Overview, changes neither S.desks, the note nor the screen: " + JSON.stringify(leftTeam.read));
  /* RETIRED, P2: ot8m, "the two-second refresh answered after the lead left Team ... changes neither S.desks, the note nor the screen", and ot8n, "an Open answered after the lead left Team ... changes neither"; the refresh and the Open are gone. */
  check(leftTeam.refuse.every((x) => /held$/.test(x)),
    "ot8o a Refuse answered after the lead left Team for a catalog's tab, or for Overview, changes neither S.desks, the note nor the screen: " + JSON.stringify(leftTeam.refuse));

  /* ---- 9. A COVER BELONGS TO THE TAB IT WAS OPENED IN ----------------------------------------------
     The tag, language and card covers ask about one project. Another project landing under one (a slow open that arrives
     after the press, as ot8h has it for the team cover) hides it with what was typed kept; its tab shows it again with the
     text back, and its answer is for its own project, however late it arrives. The stand-in has no fields: the three
     covers' are handed to the page as nodes, and an emptied #dlg empties them as a real one does. */
  const nineA = pageOver(root, "en");
  const N = nineA.P, napi = nineA.home.sandbox.STUDIO;
  const FOX = await S.newProject(root, "Foxtrot project", L), HOT = await S.newProject(root, "Hotel project", L);
  const KINDS = {
    tag: { open: "tag-new", answer: "do-tag-new", verb: "addTag", ids: ["newTag"],
      typed: { newTag: "Cover shelf" }, seen: (d) => (d.draft.tags || []).some((t) => JSON.stringify(t).indexOf("Cover shelf") >= 0) },
    lang: { open: "lang-new", answer: "do-lang-new", verb: "addLang", ids: ["newLang", "newLangName"],
      typed: { newLang: "de", newLangName: "Cover-Deutsch" }, seen: (d) => JSON.stringify(d.draft.langs).indexOf("Cover-Deutsch") >= 0 },
    card: { open: "card-new", answer: "do-card-new", verb: "addCard", ids: ["newCard", "newCardBody", "newCardCatName"],
      typed: { newCard: "Cover card", newCardBody: "Typed on the Foxtrot tab", newCardCatName: "Cover category" },
      seen: (d) => (d.draft.cards || []).some((c) => JSON.stringify(c).indexOf("Cover card") >= 0) },
  };
  const everyId = [].concat(...Object.keys(KINDS).map((k) => KINDS[k].ids));
  const fieldsOf9 = (pg, ids) => ids.map((id) => Object.assign(pg.home.node("#" + id), { id }));
  /** Gives a page the fields of whichever cover is up, a #dlg that empties them when it is rewritten, and getElementById. */
  function withFields(pg) {
    const dlg = pg.home.node("#dlg");
    dlg.querySelectorAll = () => (pg.P.S.cover && KINDS[pg.P.S.cover] ? fieldsOf9(pg, KINDS[pg.P.S.cover].ids) : []);
    Object.defineProperty(dlg, "innerHTML", { configurable: true, get() { return this._html; },
      set(v) { this._html = String(v); everyId.forEach((id) => { pg.home.node("#" + id).value = ""; }); } });
    pg.home.doc.getElementById = (id) => pg.home.node("#" + id);
  }
  /** The three verbs a cover answers through, over the real ones. */
  const withVerbs = (pg) => {
    const a = pg.home.sandbox.STUDIO;
    a.addTag = (d, kind, t) => wire(S.addTag(d, kind, t));
    a.addLang = (d, code, name) => wire(S.addLang(d, code, name));
    a.addCard = (d, shelf, title, body) => wire(S.addCard(d, shelf, title, body));
  };
  withFields(nineA); withVerbs(nineA);
  await nineA.boot(null);
  const typeInto = (pg, k) => { Object.keys(KINDS[k].typed).forEach((id) => { pg.home.node("#" + id).value = KINDS[k].typed[id]; }); };
  const typedNow = (pg, k) => JSON.stringify(KINDS[k].ids.map((id) => pg.home.node("#" + id).value));
  const typedWas = (k) => JSON.stringify(KINDS[k].ids.map((id) => KINDS[k].typed[id]));
  const solid = (pg) => (/class="btn solid" data-act="([^"]+)"/.exec(pg.home.node("#dlg").innerHTML) || [])[1] || null;
  const diskOf = async (d) => JSON.parse(JSON.stringify(await S.openProject(d)));
  const nineOn = () => (N.S.screen === "project" ? path.basename(N.S.open.dir) : "list");
  /* what the page holds for the project on screen, to see that nothing of another's lands in it */
  const hotDraft = () => JSON.stringify([N.S.open.draft.tags, N.S.open.draft.langs, (N.S.open.draft.cards || []).length, N.S.sel]);

  /* a, b: the cover is hidden when another project lands, and nothing is answered for it; back on its own tab it is shown
     again, with what was typed, and its answer lands in its own project and in no other */
  const hidden = [], back = [];
  for (const k of Object.keys(KINDS)) {
    const K = KINDS[k];
    await nineA.press("to-project", FOX.dir);
    N.ACTS[K.open](); typeInto(nineA, k);
    const asked = N.S.cover, hotBefore = JSON.stringify((await diskOf(HOT.dir)).draft);
    await nineA.press("to-project", HOT.dir);
    const act = N.S.cover ? solid(nineA) : null;                        /* what an answer on this tab would press */
    if (act && N.ACTS[act]) await N.ACTS[act]();
    await sleep(40);
    const hotAfter = JSON.stringify((await diskOf(HOT.dir)).draft);
    hidden.push({ k, asked, on: nineOn(), cover: N.S.cover, painted: nineA.home.node("#dlg").innerHTML === "", pressed: act, hotUntouched: hotBefore === hotAfter });
    await nineA.press("to-project", FOX.dir);
    const shown = { cover: N.S.cover, typed: typedNow(nineA, k) === typedWas(k), button: solid(nineA) };
    if (shown.button && N.ACTS[shown.button]) await N.ACTS[shown.button]();
    await sleep(60);
    back.push(Object.assign(shown, { k, closed: N.S.cover === null, foxHas: K.seen(await diskOf(FOX.dir)), hotHas: K.seen(await diskOf(HOT.dir)),
      foxPage: K.seen({ draft: N.S.open.draft }) }));
  }
  check(hidden.every((h) => h.asked === h.k && h.on === "Hotel project" && h.cover === null && h.painted && !h.pressed && h.hotUntouched),
    "ot9a a tag, language or card cover is hidden when another project lands under it, and nothing is answered for the newcomer: "
    + JSON.stringify(hidden));
  check(back.every((b) => b.cover === b.k && b.typed && !!b.button && b.closed && b.foxHas && !b.hotHas && b.foxPage),
    "ot9b its own tab shows the cover again with what was typed, and the answer lands in that tab's project and in no other: "
    + JSON.stringify(back));

  /* c: the answer in flight when the band moves on is its own project's: the tab on screen takes nothing of it, and its own
     tab, back, has no cover left to answer. The first run of each kind is on a project that has not got the item yet. */
  const late = [];
  /* the card cover makes its category first and its card second: it is held at each in turn */
  for (const [k, held, n] of [["tag", "addTag", 2], ["lang", "addLang", 3], ["card", "addTag", 4], ["card", "addCard", 5]]) {
    const K = KINDS[k];
    const FOX2 = await S.newProject(root, "Foxtrot " + n + " project", L);
    const verb = napi[held], gate = hold();
    await nineA.press("to-project", FOX2.dir);
    const seenBefore = K.seen(await diskOf(FOX2.dir));
    N.ACTS[K.open](); typeInto(nineA, k);
    napi[held] = async (...a) => { await gate.shut; return verb(...a); };
    const answering = N.ACTS[K.answer](); await sleep(30);
    await nineA.press("to-project", HOT.dir);
    const hotHeld = hotDraft();
    gate.open(); await answering; await sleep(80);
    napi[held] = verb;
    const onHot = { cover: N.S.cover, held: hotDraft() === hotHeld, err: N.S.err || null };
    await nineA.press("to-project", FOX2.dir);
    late.push(Object.assign(onHot, { k, gated: held, wasThere: seenBefore, foxHas: K.seen(await diskOf(FOX2.dir)), hotHas: K.seen(await diskOf(HOT.dir)),
      coverBack: N.S.cover }));
  }
  check(late.every((l) => !l.wasThere && l.cover === null && l.held && !l.err && l.foxHas && !l.hotHas && l.coverBack === null),
    "ot9c an answer in flight when another tab lands is its own project's: the tab on screen takes nothing of it, the project has it"
    + " on disk, and its tab comes back with no cover left: " + JSON.stringify(late));

  /* d: a refusal said while its tab was away is on its own tab on return, with the text, and not on the tab on screen */
  const verbTag = napi.addTag, refuseGate9 = hold();
  await nineA.press("to-project", FOX.dir);
  N.ACTS["tag-new"](); typeInto(nineA, "tag");
  napi.addTag = async () => { await refuseGate9.shut; return { error: "the share refused the tag", said: null, disk: true }; };
  const refusing9 = N.ACTS["do-tag-new"](); await sleep(30);
  await nineA.press("to-project", HOT.dir);
  refuseGate9.open(); await refusing9; await sleep(60);
  napi.addTag = verbTag;
  const errOnHot = N.S.err;
  await nineA.press("to-project", FOX.dir);
  check(!errOnHot && N.S.cover === "tag" && /share refused/.test(String(N.S.err)) && typedNow(nineA, "tag") === typedWas("tag"),
    "ot9d a refusal that arrives while its tab is away puts no sentence on the tab on screen, and its own tab shows the cover on"
    + " return with the sentence and the text: " + JSON.stringify({ onHot: errOnHot || null, cover: N.S.cover, err: N.S.err }));
  N.ACTS["cover-close"]();

  /* e: CONTROL, one project: a cover answers as before, and its own tab pressed under it leaves it as it is */
  const solo = pageOver(root, "en");
  withFields(solo); withVerbs(solo);
  await solo.boot(null);
  const SOLO = await S.newProject(root, "Solo project", L);
  await solo.press("open", SOLO.dir);
  const soloK = [];
  for (const k of Object.keys(KINDS)) {
    const K = KINDS[k];
    solo.P.ACTS[K.open](); typeInto(solo, k);
    await solo.press("to-project", SOLO.dir);                           /* its own tab */
    const stays = { cover: solo.P.S.cover, typed: typedNow(solo, k) === typedWas(k) };
    const btn = solid(solo);
    if (btn && solo.P.ACTS[btn]) await solo.P.ACTS[btn]();
    await sleep(60);
    soloK.push(Object.assign(stays, { k, closed: solo.P.S.cover === null, there: K.seen(await diskOf(SOLO.dir)) }));
  }
  check(soloK.every((c) => c.cover === c.k && c.typed && c.closed && c.there),
    "ot9e CONTROL: in one project a cover is answered as before, and pressing its own tab leaves it up with its text: " + JSON.stringify(soloK));

  /* f: the list hides a cover too, and the tab shows it again; a cover the person cancelled does not come back */
  const listed = [];
  for (const k of Object.keys(KINDS)) {
    await nineA.press("to-project", FOX.dir);
    N.ACTS[KINDS[k].open](); typeInto(nineA, k);
    await nineA.press("to-projects");
    const onList = { screen: N.S.screen, cover: N.S.cover };
    await nineA.press("to-project", FOX.dir);
    const shown = { cover: N.S.cover, typed: typedNow(nineA, k) === typedWas(k) };
    N.ACTS["cover-close"]();
    await nineA.press("to-project", HOT.dir);
    await nineA.press("to-project", FOX.dir);
    listed.push({ k, list: onList, shown, cancelledBack: N.S.cover });
  }
  check(listed.every((l) => l.list.screen === "projects" && l.list.cover === null && l.shown.cover === l.k && l.shown.typed && l.cancelledBack === null),
    "ot9f the list hides a cover as another project does, its tab shows it again with its text, and a cancelled cover is not shown"
    + " again: " + JSON.stringify(listed));

  /* g: a cover of the same kind on each of two tabs keeps its own text, and text typed after its tab has come back is not
     put over by a repaint of the cover */
  await nineA.press("to-project", FOX.dir);
  N.ACTS["tag-new"](); nineA.home.node("#newTag").value = "Fox text";
  await nineA.press("to-project", HOT.dir);
  N.ACTS["tag-new"](); nineA.home.node("#newTag").value = "Hot text";
  await nineA.press("to-project", FOX.dir);
  const foxText = nineA.home.node("#newTag").value;
  nineA.home.node("#newTag").value = "Fox text, and more";
  N.paint();
  const repainted = nineA.home.node("#newTag").value;
  await nineA.press("to-project", HOT.dir);
  const hotText = nineA.home.node("#newTag").value, hotCover = N.S.cover;
  N.ACTS["cover-close"]();
  await nineA.press("to-project", FOX.dir);
  N.ACTS["cover-close"]();
  check(foxText === "Fox text" && repainted === "Fox text, and more" && hotText === "Hot text" && hotCover === "tag",
    "ot9g a cover of the same kind on two tabs keeps each one's own text, and what is typed after a tab comes back survives a"
    + " repaint of the cover: " + JSON.stringify({ foxText, repainted, hotText, hotCover }));

  /* ---- ot10. Settings file name edit mode (board 960 item 4) ----------------------------- */
  /* Plant a published file name on FOX */
  const foxProjPath = path.join(FOX.dir, "project.json");
  const foxProj = JSON.parse(fs.readFileSync(foxProjPath, "utf8"));
  foxProj.fileName = "foxtrot.ec";
  fs.writeFileSync(foxProjPath, JSON.stringify(foxProj, null, 2), "utf8");

  await nineA.press("to-project", FOX.dir);
  await nineA.press("section", "settings");
  /* 10a: View mode: plain text in mono face with its .ec, no #fileNameSet, "Change file name" button */
  const viewInp = nineA.home.node("#fileNameSet");
  const viewBtn = nineA.home.node('[data-act="file-name"]');
  const viewHtml = nineA.main.innerHTML;
  const hasMonoFile = viewHtml.includes('<span class="mono">foxtrot.ec</span>');
  const hasExtraHintBefore = viewHtml.includes("The published file takes this name at once, without a publish.");
  check(!viewInp && viewBtn && viewBtn.textContent.trim() === "Change file name" && hasMonoFile && !hasExtraHintBefore,
    "ot10a Settings file name starts in view mode: plain text mono with .ec, Change file name button, no input and no edit hint");

  /* 10b: Pressing Change file name enters edit mode with input, commit button, cancel button, and extra hint */
  await nineA.press("file-name");
  const editInp = nineA.home.node("#fileNameSet");
  const commitBtn = nineA.home.node('[data-act="file-name"]');
  const cancelBtn = nineA.home.node('[data-act="file-name-cancel"]');
  const editHtml = nineA.main.innerHTML;
  const hasExtraHintDuring = editHtml.includes("The published file takes this name at once, without a publish.");
  check(editInp && editInp.value === "foxtrot" && commitBtn && commitBtn.textContent.trim() === "Use this name"
    && cancelBtn && cancelBtn.textContent.trim() === "Cancel" && hasExtraHintDuring,
    "ot10b edit mode displays input with stem, Use this name commit button, Cancel button, and extra hint line");

  /* 10c: Leaving section preserves typed text without saving (no save on blur) */
  if (editInp) editInp.value = "typed-stem";
  nineA.P.S.fileNameTyped = "typed-stem";
  await nineA.press("section", "cards");
  const diskAfterLeave = JSON.parse(fs.readFileSync(foxProjPath, "utf8")).fileName;
  await nineA.press("section", "settings");
  const backInp = nineA.home.node("#fileNameSet");
  check(diskAfterLeave === "foxtrot.ec" && backInp && backInp.value === "typed-stem",
    "ot10c leaving section keeps typed text without save on blur, and returning restores edit mode with typed text");

  /* 10d: Escape or Cancel cancels edit mode and restores view mode without saving */
  await nineA.press("file-name-cancel");
  const canceledInp = nineA.home.node("#fileNameSet");
  const canceledBtn = nineA.home.node('[data-act="file-name"]');
  check(!canceledInp && canceledBtn && canceledBtn.textContent.trim() === "Change file name" && nineA.P.S.open.fileName === "foxtrot.ec",
    "ot10d Cancel exits edit mode and restores view mode, leaving file name unchanged");

  /* 10e: Refusal keeps typed text in edit mode */
  await nineA.press("file-name");
  const refInp = nineA.home.node("#fileNameSet");
  if (refInp) refInp.value = "   ";
  nineA.P.S.fileNameTyped = "   ";
  await nineA.press("file-name");
  const stillInp = nineA.home.node("#fileNameSet");
  check(nineA.P.S.fileNameEditing === true && stillInp && stillInp.value === "   " && !!nineA.P.S.err,
    "ot10e a refusal keeps typed text in edit mode and sets error message");

  /* 10f: Escape key cancels edit mode */
  nineA.P.fileNameKey({ key: "Escape" });
  const escInp = nineA.home.node("#fileNameSet");
  check(!escInp && nineA.P.S.fileNameEditing === false && nineA.P.S.fileNameTyped == null,
    "ot10f Escape key cancels edit mode");

  /* 10g: Enter key in input commits file name */
  await nineA.press("file-name");
  const enterInp = nineA.home.node("#fileNameSet");
  if (enterInp) enterInp.value = "foxtrot-renamed";
  nineA.P.S.fileNameTyped = "foxtrot-renamed";
  nineA.P.fileNameKey({ key: "Enter", target: { id: "fileNameSet" } });
  await sleep(60);
  const diskAfterEnter = JSON.parse(fs.readFileSync(foxProjPath, "utf8")).fileName;
  check(diskAfterEnter === "foxtrot-renamed.ec" && nineA.P.S.fileNameEditing === false && nineA.P.S.open.fileName === "foxtrot-renamed.ec",
    "ot10g Enter key in input commits file name to disk and updates open state");

  /* ---- ot11. A TAB DRAGGED PAST ANOTHER, AND THE TWO MARKS AT THE STRIP'S ENDS (board 982, findings 16 and 17) --------
     Max, 2026-11-11 00:26: "tabs in Studio are not reorderable, like in Etiuda. They should be re-orderable by dragging."
     The hand is the page's own document listeners, fired in capture order with a pointer at a place on the strip: every
     tab painted in the strip is laid out 100 px wide from x 60, and what is under the pointer is the tab whose box holds
     it, read again after every paint. Nothing here calls a reorder by name, so the tree before the change answers too. */
  const eleven = pageOver(root, "en");
  await eleven.boot(null);
  await eleven.press("to-projects");
  for (const d of [A.dir, B.dir, C.dir]) await eleven.press("open", d);
  const TP = eleven.P, edoc = eleven.home.doc;
  const attrsOf = (s) => { const o = {}; for (let m, re = /\s([\w-]+)="([^"]*)"/g; (m = re.exec(s));) o[m[1]] = m[2]; return o; };
  /** A painted element as the page's listeners ask of it: its attributes, its box, and closest() over its own classes
   *  and attributes and its parent's. */
  function fake(attrs, rect, parent) {
    const fits = (c) => {
      if (/^#/.test(c)) return false;
      /* An attribute test holds its value where the selector gives one: [role="menuitem"] is not met by role="button"
         (the menu's pointer handler asks closest('.menu-list [role="menuitem"]') of whatever the pointer is over). */
      const want = (c.match(/\.[\w-]+/g) || []).map((x) => x.slice(1));
      const need = [...c.matchAll(/\[([\w-]+)(?:=["']?([^"'\]]*)["']?)?\]/g)].map((m) => ({ k: m[1], v: m[2] }));
      const mine = String(attrs.class || "").split(/\s+/);
      return want.length + need.length > 0 && want.every((k) => mine.includes(k))
        && need.every((n) => n.k in attrs && (n.v === undefined || String(attrs[n.k]) === n.v));
    };
    const me = { tagName: "SPAN", id: attrs.id || "", attrs, getAttribute: (k) => (k in attrs ? attrs[k] : null),
      hasAttribute: (k) => k in attrs, getBoundingClientRect: () => rect,
      matches: (sel) => sel.split(",").some((s) => fits(s.trim().split(/\s+/).pop())),
      closest: (sel) => (me.matches(sel) ? me : parent ? parent.closest(sel) : null) };
    return me;
  }
  /** The strip as painted now: each tab between the Library and "+", its key (a folder or a screen), its box and its cross. */
  function strip() {
    TP.paintTabs();
    const html = eleven.home.node("#tabs").innerHTML, out = [];
    const re = /<span class="(tab[^"]*)"([^>]*)>([\s\S]*?)(?=<span class="tab|<\/div>|$)/g;
    for (let m; (m = re.exec(html));) {
      const a = attrsOf(' class="' + m[1] + '"' + m[2]);
      if (a["data-act"] !== "to-project" && a["data-act"] !== "to-screen") continue;
      const i = out.length, rect = { left: 60 + 100 * i, right: 160 + 100 * i, top: 6, bottom: 40, width: 100, height: 34 };
      const tab = fake(a, rect, null);
      const xm = /<span class="x"([^>]*)>/.exec(m[3]);
      const x = xm ? fake(attrsOf(' class="x"' + xm[1]), { left: rect.right - 26, right: rect.right - 6, top: 13, bottom: 33, width: 20, height: 20 }, tab) : null;
      out.push({ key: a["data-dir"] || "screen:" + a["data-v"], tab, x, mid: rect.left + 50 });
    }
    return out;
  }
  const order = () => strip().map((t) => (t.key.indexOf("screen:") === 0 ? t.key.slice(7) : path.basename(t.key)));
  edoc.elementFromPoint = (x, y) => { const t = strip().find((s) => x >= s.tab.getBoundingClientRect().left && x < s.tab.getBoundingClientRect().right); return t && y >= 6 && y < 40 ? t.tab : null; };
  function fire(type, target, x, y) {
    const e = { type, target, clientX: x, clientY: y, button: 0, buttons: type === "pointerup" ? 0 : 1, pointerType: "mouse",
      pointerId: 1, shiftKey: false, ctrlKey: false, altKey: false, metaKey: false, stopped: false, defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true; }, stopPropagation() { this.stopped = true; }, stopImmediatePropagation() { this.stopped = true; } };
    const ls = edoc.heard.filter((h) => h.type === type);
    for (const h of ls.filter((h) => h.capture).concat(ls.filter((h) => !h.capture))) { if (e.stopped) break; h.fn(e); }
    return e;
  }
  const under = (x) => edoc.elementFromPoint(x, 23);
  /** A press as the hand makes it: down at `from`, the pointer through `moves`, up where it ends, and the click the browser
   *  then sends to what is under it, which the page may eat. */
  async function hand(target, from, moves, upTarget) {
    fire("pointerdown", target, from, 23);
    let x = from;
    for (const p of moves) { x = p; fire("pointermove", under(x) || target, x, 23); await sleep(130); }
    const up = upTarget || under(x) || target;
    fire("pointerup", up, x, 23);
    const clicked = fire("click", up, x, 23);
    await sleep(60);
    return clicked;
  }
  const before11 = order(), opens11 = eleven.calls.length, onBefore = TP.S.open && path.basename(TP.S.open.dir);
  let s0 = strip();
  await hand(s0[0].tab, s0[0].mid, [s0[0].mid + 5, s0[1].mid - 10]);
  const dragged = order();
  check(before11.join() === "Alpha project,Beta project,Gamma project" && dragged.join() === "Beta project,Alpha project,Gamma project",
    "ot11a a tab dragged past the next one, a quarter into it, takes its place: " + JSON.stringify({ before: before11, after: dragged }));
  check(TP.S.open && path.basename(TP.S.open.dir) === onBefore && eleven.calls.length === opens11,
    "ot11b the release that ends the drag switches nothing: the tab on screen stays " + JSON.stringify(onBefore)
    + " and nothing was opened (" + (eleven.calls.length - opens11) + " open(s))");
  const kept11 = eleven.writes[eleven.writes.length - 1] || { open: [] };
  const again = pageOver(root, "en");
  await again.boot(kept11);
  again.P.paintTabs();
  const relaunched = band(again.home.node("#tabs").innerHTML).filter((t) => t.act === "to-project").map((t) => path.basename(t.dir));
  check(kept11.open.map((t) => path.basename(t.dir)).join() === "Beta project,Alpha project,Gamma project" && relaunched.join() === dragged.join(),
    "ot11c the order the drag left is what is kept, and the next launch opens the band in it: "
    + JSON.stringify({ kept: kept11.open.map((t) => path.basename(t.dir)), relaunched }));
  s0 = strip();
  await hand(s0[1].tab, s0[1].mid, []);
  const pressedStill = TP.S.open && path.basename(TP.S.open.dir);
  s0 = strip();
  await hand(s0[0].tab, s0[0].mid, [s0[0].mid + 3]);
  check(pressedStill === "Alpha project" && TP.S.open && path.basename(TP.S.open.dir) === "Beta project" && order().join() === dragged.join(),
    "ot11d a press without movement, and one that slips 3 px, are clicks: each switches to its tab and the order stays: "
    + JSON.stringify({ first: pressedStill, second: TP.S.open && path.basename(TP.S.open.dir), order: order() }));
  if (has(TP.screenOpen)) TP.screenOpen("settings");
  s0 = strip();
  const st = s0.find((t) => t.key === "screen:settings") || s0[s0.length - 1];
  await hand(st.tab, st.mid, [st.mid - 5, s0[0].mid - 10]);
  const screenFirst = order();
  const ring = [];
  for (let i = 0; i < 4; i++) {
    TP.tabKey(key("Tab"));
    await sleep(40);
    ring.push(TP.S.screen === "project" ? path.basename(TP.S.open.dir) : TP.S.screen);
  }
  const kept11e = eleven.writes[eleven.writes.length - 1] || { open: [] };
  check(screenFirst.join() === "settings,Beta project,Alpha project,Gamma project"
        && ring.join() === "Beta project,Alpha project,Gamma project,projects"
        && kept11e.open.map((t) => path.basename(t.dir)).join() === "Beta project,Alpha project,Gamma project",
    "ot11e a screen tab drags as a catalog's does: Settings dragged to the front sits first, Ctrl+Tab walks the band in the order"
    + " it shows, and what is kept is still the catalogs alone, in theirs: " + JSON.stringify({ screenFirst, ring, kept: kept11e.open.map((t) => path.basename(t.dir)) }));
  await eleven.press("to-project", A.dir);
  s0 = strip();
  const beforeX = order().filter((n) => n !== "Alpha project");
  const alpha = s0.find((t) => path.basename(t.key) === "Alpha project");
  await hand(alpha.x, alpha.x.getBoundingClientRect().left + 10, [alpha.x.getBoundingClientRect().left + 40], alpha.x);
  await sleep(80);
  check(order().join() === beforeX.join() && order().indexOf("Alpha project") < 0,
    "ot11f control: a cross pressed with a 30 px slip still closes its tab and drags nothing: " + JSON.stringify(order()));

  /* Max, 00:26: "Both x button and + button should be svg glyphs, as in Desk." Read off the painted strip: the + carries a
     drawing and no typed sign, and the + and a tab's cross are drawn on one grid at one stroke, as the desk's two are. */
  const bandHtml = (TP.paintTabs(), eleven.home.node("#tabs").innerHTML);
  const plusHtml = (/<span class="tab add"[^>]*>([\s\S]*?)<\/span><button/.exec(bandHtml) || [])[1] || "";
  const crossHtml = (/<span class="x" data-act="close-tab"[^>]*>([\s\S]*?)<\/span><\/span>/.exec(bandHtml) || [])[1] || "";
  const drawn = (h) => ({ svg: /<svg\b/.test(h), box: (/viewBox="([^"]*)"/.exec(h) || [])[1] || "", stroke: (/stroke-width="([^"]*)"/.exec(h) || [])[1] || "",
    typed: h.replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]*>/g, "").trim() });
  const plusD = drawn(plusHtml), crossD = drawn(crossHtml);
  check(plusD.svg && crossD.svg && plusD.typed === "" && crossD.typed === "" && plusD.box && plusD.box === crossD.box && plusD.stroke === crossD.stroke,
    "ot11g the + and a tab's cross are both drawings with no typed sign, on one grid at one stroke: " + JSON.stringify({ plus: plusD, cross: crossD }));

  process.stdout.write("\nopen-tabs  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  if (asserted !== EXPECTED) {
    process.stdout.write("open-tabs  expected " + EXPECTED + " assertions, ran " + asserted + "\n");
    failed++;
  }
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "open-tabs");
  else process.stdout.write("open-tabs  kept " + SCRATCH + "\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stdout.write("open-tabs  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
