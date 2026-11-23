/* SETTINGS IN A TAB OF ITS OWN, AND THE SCREEN TABS IT OPENS IN: node tests/screen-tabs.mjs [--keep].
 *
 * Max, 2026-11-08 01:23: "tab should say "Settings" when Settings are open. Opening new tab should open new regular
 * conversation screen, and it should be possible to return to the Settings tab until it's closed." 01:20: "I prefer B",
 * section pages with the section list beside them. A screen tab holds a place rather than a catalog; Maintenance joins
 * the same mechanism in a later run (board 967), the tray after that (board 969).
 *
 * The page runs on tests/page-stand-in.mjs over the real verbs of src/studio.mjs on a scratch root, as tests/open-tabs.mjs
 * does; a tab is pressed by calling the act the band painted on it, a key by handing tabKey the event a keydown would.
 *
 *   st1  the Menu's Settings opens a tab named Settings, in front, after the catalogs' tabs, and no cover; Ustawienia in
 *        Polish
 *   st2  a second open fronts it: from a catalog, and with it already in front, there is still one
 *   st3  "+" on the Settings tab opens the New catalog tab, and the catalog named there is in front where that tab stood,
 *        after Settings, which stays to return to (it made a numbered catalog at once until board 1019 (12))
 *   st4  Ctrl+Tab and Ctrl+Shift+Tab walk it with the rest; Ctrl+W, Ctrl+F4 and its cross close it and land on the tab
 *        that was in front before it; Ctrl+W on a catalog never closes it
 *   st5  what is kept for the next launch never holds it: no kept tab is a screen, the one on screen is a catalog or none,
 *        and a launch from what was kept shows no Settings tab
 *   st6  the places (Ctrl+Up) list the catalogs' tabs only
 *   st7  every row of today's Settings cover, and Clear local memory from the Menu, is on the Settings tab exactly once,
 *        and the Menu no longer lists Clear local memory
 *   st8  the key's, the licence's, the About's and Clear local memory's covers close back to the Settings tab, and a
 *        memory cleared from it stays there
 *   st10 the copywriter's rows this run applies are painted, in both languages
 *   st11 the search finds a row by its words in any section, and says the empty line for a text nothing matches
 *
 * WHAT IT CANNOT SEE, said rather than implied: layout, the look of the selected section (Tint), focus, the click and the
 * keys themselves, and both themes at both window sizes, which are the window leg named in the report and Max's eye.
 *
 * PROVED BY MAKING IT FAIL: SCREEN_TABS_APP=<a copy of ui/app.js> reads that copy instead; the report of the build that
 * added this file names the copy planted (keepTabs' filter to the catalogs' tabs removed) and what it reddened.
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
const SCRATCH = path.join(ROOT, "scratch", "screen-tabs");
const EXPECTED = 22;
const source = process.env.SCREEN_TABS_APP ? fs.readFileSync(path.resolve(process.env.SCREEN_TABS_APP), "utf8") : undefined;

/* THE COPYWRITER'S ROWS THIS RUN APPLIES (office brief words-settings-2026-11-08.md, rows by their 0-based place in its
   JSON array): [row, English, Polish], as she wrote them. */
const WORDS = [
  [0, "General", "Ogólne"],
  [1, "Appearance", "Wygląd"],
  [2, "Layout", "Układ"],
  [3, "Keyboard shortcuts", "Skróty klawiszowe"],
  [4, "Notifications", "Powiadomienia"],
  [5, "Teams and keys", "Zespoły i klucze"],
  [6, "Data and defaults", "Dane i ustawienia domyślne"],
  [7, "About", "O programie"],
  [9, "Settings", "Ustawienia"],
  [10, "Search settings", "Szukaj w ustawieniach"],
  [12, "No setting matches this search.", "Żadne ustawienie nie pasuje do tego wyszukiwania."],
  [14, "The language, the Library's folder, and how Studio starts and closes.", "Język, folder Biblioteki oraz sposób uruchamiania i zamykania Studia."],
  [15, "How the app looks and moves.", "Jak program wygląda i jak się porusza."],
  [16, "How the screen is laid out.", "Jak rozłożony jest ekran."],
  [17, "Every shortcut, and how to change it.", "Wszystkie skróty i sposób ich zmiany."],
  [18, "What the app tells you, also while its window is closed.", "O czym program powiadamia, także gdy jego okno jest zamknięte."],
  [20, "This Studio's signing key and its licence.", "Klucz podpisu tego Studia i jego licencja."],
  [21, "Putting settings back, and what the app keeps on this computer.", "Przywracanie ustawień i to, co program przechowuje na tym komputerze."],
  [22, "The version, the licence and the tour.", "Wersja, licencja i przewodnik."],
  [23, "A catalog's own team and invitations are on its Team screen, and its name, folder and languages in its Catalog details.", "Zespół i zaproszenia katalogu są na jego ekranie Zespół, a nazwa, folder i języki w Szczegółach katalogu."],
  [80, "Library folder", "Folder Biblioteki"],
  [81, "Where new catalogs are made.", "Tu powstają nowe katalogi."],
];
/* The rows the Settings tab paints in this run; 16 to 18 are the ledes of sections with no row yet, kept for the runs
   that fill them, and 12 is said by the search's empty line (st11). */
const PAINTED_NOW = [0, 1, 5, 6, 7, 9, 10, 14, 15, 20, 21, 22, 23, 80, 81];

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
const has = (fn) => typeof fn === "function";
const key = (k, o) => Object.assign({ key: k, code: "", ctrlKey: true, shiftKey: false, altKey: false, metaKey: false,
  prevented: false, preventDefault() { this.prevented = true; } }, o || {});
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
      on: a(m[2], "aria-current") === "page", said: text(m[3]), x: (/<span class="x"([^>]*)>/.exec(m[3]) || [])[1] || "" });
  }
  return out;
}

const made = { file: "C:\\ud\\signing-key.json", name: "signing-key.json", keyId: "studio-9a3a782d7f8ff25b", public: "",
  print: "9a3a782d7f8ff25b", kept: "os", backup: null, admitted: 0, problem: null };

function pageOver(root, uiLang) {
  const calls = [], writes = [];
  const api = {
    newProject: (n, l, o) => { calls.push("newProject"); return wire(S.newProject(root, n, l, o)); },
    open: (d) => { calls.push("open:" + path.basename(d)); return wire(S.openProject(d)); },
    projects: () => wire(S.listProjects(root)),
    proposals: (d) => wire(S.listProposals(d)),
    saveCard: (d, i, p) => wire(S.saveCard(d, i, p)),
    cardHistory: (d, i) => wire(S.cardHistory(d, i)),
    discardUntouched: (d) => wire(S.discardUntouched(d)),
    tabs: (v) => { writes.push(JSON.parse(JSON.stringify(v))); return Promise.resolve({ error: null }); },
    signing: () => Promise.resolve({ error: null, signing: made }),
    licence: () => Promise.resolve({ error: null, licence: { status: "none" } }),
    clearLocalMemory: async () => { calls.push("clearLocalMemory"); return { error: null, cleared: true, recentCleared: null, theme: "system", lang: uiLang || "en" }; },
  };
  const home = loadPage({ api, uiLang, source });
  const P = home.page;
  P.S.host = { tour: { offered: true }, langs: S.builtLangs(), version: "0.1.0", signing: made };
  const tabs = () => { P.paint(); return band(home.node("#tabs").innerHTML); };
  async function press(act, attrs) {
    if (!P.ACTS[act]) return false;
    try { await P.ACTS[act](el(Object.assign({ "data-act": act }, attrs || {}))); } catch (e) { P.__threw = e; return false; }
    await sleep(40);
    return true;
  }
  /** A press through the page's own door, run(), as a click on the Menu's row would be. */
  async function run(act, attrs) {
    if (!has(P.run)) return false;
    let ok = false;
    try { ok = P.run(el(Object.assign({ "data-act": act }, attrs || {}))); } catch (e) { P.__threw = e; return false; }
    await sleep(60);
    return ok;
  }
  const tk = (k, o) => { const e = key(k, o); const did = has(P.tabKey) ? P.tabKey(e) : ""; return { did, e }; };
  const where = () => P.S.screen === "project" && P.S.open ? path.basename(P.S.open.dir) : P.S.screen;
  return { P, home, calls, writes, tabs, press, run, tk, where };
}

async function main(argv) {
  clearScratch(SCRATCH);
  const root = path.join(SCRATCH, "projects");
  fs.mkdirSync(root, { recursive: true });
  const L = [{ code: "en" }, { code: "pl" }];
  const A = await S.newProject(root, "Alpha project", L), B = await S.newProject(root, "Beta project", L);

  const { P, home, writes, tabs, press, run, tk, where } = pageOver(root, "en");
  P.S.projects = S.listProjects(root).projects;
  await press("to-projects");
  await press("open", { "data-dir": A.dir });
  await press("open", { "data-dir": B.dir });
  await press("to-project", { "data-dir": A.dir });

  /* ---- 1. THE MENU'S SETTINGS OPENS A TAB NAMED SETTINGS --------------------------------------------------------- */
  await press("menu");
  await run("settings");
  const b1 = tabs();
  const st = b1.filter((t) => /\bscreen\b/.test(t.cls));
  check(st.length === 1 && st[0].said === "Settings" && st[0].on && st[0].v === "settings" && P.S.screen === "settings"
        && !P.S.cover && P.S.menu === false && b1.indexOf(st[0]) === b1.length - 2 && b1[b1.length - 1].act === "new-tab"
        && b1.filter((t) => t.on).length === 1,
    "st1a the Menu's Settings opens a tab named Settings, in front and alone in front, after the catalogs' tabs and before"
    + " \"+\", and no cover: " + JSON.stringify(b1.map((t) => t.said + (t.on ? "*" : ""))));
  check(/data-act="close-screen"/.test(st[0] ? st[0].x : "") && /title="Close"/.test(st[0] ? st[0].x : ""),
    "st1b it carries a cross that closes it: " + JSON.stringify(st[0] && st[0].x));
  const pl = pageOver(root, "pl");
  await pl.press("settings");
  const plTab = pl.tabs().find((t) => /\bscreen\b/.test(t.cls)) || {};
  check(plTab.said === "Ustawienia" && pl.P.S.screen === "settings",
    "st1c in Polish the tab says Ustawienia: " + JSON.stringify(plTab.said));

  /* ---- 2. A SECOND OPEN FRONTS IT ----------------------------------------------------------------------------- */
  await press("settings");
  const again = tabs().filter((t) => /\bscreen\b/.test(t.cls));
  await press("to-project", { "data-dir": B.dir });
  await press("settings");
  const fronted = tabs().filter((t) => /\bscreen\b/.test(t.cls));
  check(again.length === 1 && fronted.length === 1 && fronted[0].on && P.S.screen === "settings"
        && P.S.tabs.map((t) => path.basename(t.dir)).join() === "Alpha project,Beta project",
    "st2 Settings asked for again, with it in front and from a catalog, fronts the one tab and never makes a second: "
    + again.length + " then " + fronted.length);

  /* ---- 3. "+" STILL MAKES A NEW CATALOG, THROUGH ITS PAGE ---------------------------------------------------- */
  await press("new-tab");
  const page3 = P.S.screen;
  home.node("#newName").value = "New catalog";
  await press("do-new");
  const b3 = tabs();
  const fresh = P.S.tabs[P.S.tabs.length - 1] || {};
  check(page3 === "new" && P.S.screen === "project" && P.S.open && P.S.open.dir === fresh.dir && /^New catalog/.test(fresh.name || "")
        && P.S.tabs.length === 3 && b3.filter((t) => /\bscreen\b/.test(t.cls)).length === 1
        && b3.map((t) => t.said.replace(/\s*rev \d+$/, "")).join() === "Overview,Alpha project,Beta project,Settings,New catalog,",
    "st3a \"+\" on the Settings tab opens the New catalog tab, and the catalog named there is in front where that tab stood,"
    + " the Settings tab staying in the band: " + JSON.stringify(b3.map((t) => t.said + (t.on ? "*" : ""))));
  const C = fresh.dir;
  await press("to-screen", { "data-v": "settings" });
  check(P.S.screen === "settings" && tabs().filter((t) => t.on).map((t) => t.said).join() === "Settings",
    "st3b and pressing it returns to Settings: " + where());

  /* ---- 4. THE KEYS --------------------------------------------------------------------------------------------- */
  await press("to-projects");
  const walk = [];
  for (let i = 0; i < 5; i++) { const k = tk("Tab"); await sleep(70); walk.push(where() + (k.e.prevented ? "" : "!")); }
  check(walk.join(" > ") === "Alpha project > Beta project > settings > " + path.basename(C) + " > projects",
    "st4a Ctrl+Tab walks the band round, the Settings tab in its place: " + walk.join(" > "));
  const back = [];
  for (let i = 0; i < 2; i++) { const k = tk("Tab", { shiftKey: true }); await sleep(70); back.push(where() + (k.e.prevented ? "" : "!")); }
  check(back.join(" > ") === path.basename(C) + " > settings",
    "st4b Ctrl+Shift+Tab walks it backwards: " + back.join(" > "));
  await press("to-project", { "data-dir": A.dir });
  const onCatalog = tk("w", { code: "KeyW" }); await sleep(80);
  check(onCatalog.did === "close" && P.S.tabs.every((t) => t.dir !== A.dir) && P.S.screens && P.S.screens.indexOf("settings") >= 0,
    "st4c Ctrl+W on a catalog closes that catalog and leaves the Settings tab: " + JSON.stringify(P.S.screens));
  await press("to-project", { "data-dir": B.dir });
  await press("settings");
  const kw = tk("w", { code: "KeyW" }); await sleep(80);
  check(kw.did === "close" && kw.e.prevented && where() === "Beta project" && tabs().every((t) => !/\bscreen\b/.test(t.cls)),
    "st4d Ctrl+W on the Settings tab closes it and lands on the tab in front before it: " + where());
  await press("to-projects");
  await press("settings");
  const kf = tk("F4", { code: "F4" }); await sleep(80);
  const afterF4 = where();
  await press("to-project", { "data-dir": C });
  await press("settings");
  await press("close-screen", { "data-v": "settings" });
  check(kf.did === "close" && afterF4 === "projects" && where() === path.basename(C) && tabs().every((t) => !/\bscreen\b/.test(t.cls)),
    "st4e Ctrl+F4 does the same, landing on the Library it was opened from, and its cross on the catalog it was opened from: "
    + afterF4 + ", " + where());
  P.S.cover = "about";
  await press("settings");
  P.S.cover = null;
  await press("settings");
  P.S.cover = "about";
  const quiet = [tk("w", { code: "KeyW" }), tk("Tab")];
  P.S.cover = null;
  check(quiet.every((q) => !q.did && !q.e.prevented) && P.S.screen === "settings",
    "st4f under a cover the keys leave the Settings tab alone: " + JSON.stringify(quiet.map((q) => q.did)));

  /* ---- 5. NEVER KEPT ------------------------------------------------------------------------------------------- */
  await press("to-project", { "data-dir": B.dir });
  await press("settings");
  await press("close-tab", { "data-dir": C });
  await press("to-projects");
  await press("settings");
  const dirs = new Set([A.dir, B.dir, C]);
  const bad = writes.filter((w) => !Array.isArray(w.open) || w.open.some((t) => !t || !dirs.has(t.dir) || /settings/i.test(JSON.stringify(t)))
    || (w.on !== "" && !dirs.has(w.on)));
  const last = writes[writes.length - 1] || {};
  check(writes.length > 0 && bad.length === 0 && (P.S.screens || []).indexOf("settings") >= 0,
    "st5a of " + writes.length + " writes of what the next launch opens, none holds the Settings tab or a tab with no folder,"
    + " and none names it as the one on screen: " + JSON.stringify(bad.slice(0, 2)));
  const second = pageOver(root, "en");
  second.P.S.projects = S.listProjects(root).projects;
  if (has(second.P.restoreTabs)) await second.P.restoreTabs(last);
  check(second.tabs().every((t) => !/\bscreen\b/.test(t.cls)) && (second.P.S.screens || []).length === 0
        && second.P.S.screen !== "settings",
    "st5b a launch from what was kept opens no Settings tab: " + second.where());

  /* ---- 6. THE PLACES ------------------------------------------------------------------------------------------- */
  await press("settings");
  if (has(P.placesOpen)) await P.placesOpen(false);
  const places = (P.S.places || {}).list || [];
  check(places.length === P.S.tabs.length && places.every((p) => P.S.tabs.some((t) => t.dir === p.dir)) && places.every((p) => !p.here),
    "st6 the places list the catalogs' tabs only, none of them as here while Settings is in front: "
    + JSON.stringify(places.map((p) => p.name)));
  if (has(P.placesShut)) P.placesShut(false);
  P.S.places = null;

  /* ---- 7. EVERY ROW OF TODAY'S COVER, ONCE ---------------------------------------------------------------------- */
  await press("settings");
  const pages = {};
  const navHtml = () => { const m = /<nav class="sx-nav"[\s\S]*?<\/nav>/.exec(home.node("#main").innerHTML); return m ? m[0] : ""; };
  const shown = (navHtml().match(/data-act="sx-sec" data-v="([a-z]+)"/g) || []).map((s) => s.split('data-v="')[1].slice(0, -1));
  for (const id of shown) { await press("sx-sec", { "data-v": id }); pages[id] = home.node("#main").innerHTML.replace(/<nav class="sx-nav"[\s\S]*?<\/nav>/, ""); }
  const all = Object.values(pages).join("\n");
  const ROWS = { root: /data-row="root"/g, theme: /data-row="theme"/g, lang: /data-row="lang"/g, key: /data-row="key"/g,
    tour: /data-row="tour"/g, about: /data-row="about"/g, licence: /data-row="licence"/g, clear: /data-row="clear"/g };
  const counts = Object.fromEntries(Object.entries(ROWS).map(([k, re]) => [k, count(all, re)]));
  check(Object.values(counts).every((n) => n === 1),
    "st7a each of today's rows, the folder, the theme, the language, the signing key, the tour, the About, the licence and"
    + " Clear local memory, is on exactly one section page once: " + JSON.stringify(counts));
  const ACTS7 = { "pick-root": 1, "set-theme": 3, "set-lang": 2, "tour-show": 1, about: 1, licence: 1, "clear-ask": 1, "key-show": 1, "key-aside": 1 };
  const acts = Object.fromEntries(Object.keys(ACTS7).map((a) => [a, count(all, new RegExp('data-act="' + a + '"', "g"))]));
  check(Object.entries(ACTS7).every(([a, n]) => acts[a] === n),
    "st7b and each of its presses once (the theme's three, the language's two): " + JSON.stringify(acts));
  await press("menu");
  const menu = home.node("#menuList").innerHTML;
  await press("menu");
  check(!/clear-ask/.test(menu) && /data-act="settings"/.test(menu) && /data-act="tour-show"/.test(menu) && /data-act="about"/.test(menu)
        && !has(P.settingsCoverHtml),
    "st7d the Menu is Settings…, the tour and the About again, with no Clear local memory, and the cover is gone");

  /* ---- 8. COVERS CLOSE BACK TO THE SETTINGS TAB ----------------------------------------------------------------- */
  const back8 = {};
  for (const [act, cover] of [["key-backup", "key"], ["licence", "licence"], ["about", "about"], ["clear-ask", "clear"]]) {
    await press("settings");
    await press(act);
    const up = P.S.cover;
    await press("cover-close");
    back8[act] = up === cover && !P.S.cover && P.S.screen === "settings" && tabs().filter((t) => t.on).map((t) => t.said).join() === "Settings";
  }
  check(Object.values(back8).every(Boolean),
    "st8a the key's, the licence's, the About's and Clear local memory's covers close back to the Settings tab: " + JSON.stringify(back8));
  await press("clear-ask");
  await press("do-clear");
  check(P.S.screen === "settings" && !P.S.cover && P.S.tabs.length === 0 && P.S.clearedMemory === true
        && tabs().filter((t) => t.on).map((t) => t.said).join() === "Settings" && /data-act="clear-undo"/.test(home.node("#undo").innerHTML),
    "st8b a memory cleared from it clears the catalogs' tabs and stays on the Settings tab, with its Undo: " + where());

  /* ---- 10. THE COPYWRITER'S WORDS -------------------------------------------------------------------------------- */
  await press("sx-sec", { "data-v": "general" });
  const enAll = text(Object.values(pages).join("\n") + navHtml() + tabs().map((t) => t.said).join(" "));
  await pl.press("settings");
  const plPages = [];
  for (const id of shown) { await pl.press("sx-sec", { "data-v": id }); plPages.push(pl.home.node("#main").innerHTML); }
  const plAll = text(plPages.join("\n") + pl.tabs().map((t) => t.said).join(" "));
  const enMiss = WORDS.filter(([n, en]) => PAINTED_NOW.indexOf(n) >= 0 && enAll.indexOf(text(en)) < 0 && n !== 10);
  const plMiss = WORDS.filter(([n, , plw]) => PAINTED_NOW.indexOf(n) >= 0 && plAll.indexOf(text(plw)) < 0 && n !== 10);
  const search = /placeholder="Search settings"/.test(navHtml()) && /placeholder="Szukaj w ustawieniach"/.test(plPages.join(""));
  check(enMiss.length === 0 && plMiss.length === 0 && search,
    "st10b and those it paints now are on the tab, its nav and its pages, in each language: "
    + JSON.stringify({ en: enMiss.map((r) => r[0]), pl: plMiss.map((r) => r[0]), search }));

  /* ---- 11. THE SEARCH ------------------------------------------------------------------------------------------- */
  const find = async (q) => { P.S.sx.q = q; P.paint(); return home.node("#main").innerHTML.replace(/<nav class="sx-nav"[\s\S]*?<\/nav>/, ""); };
  const hTheme = has(P.paint) && P.S.sx ? await find("theme") : "";
  const hClear = P.S.sx ? await find("memory") : "";
  const hNone = P.S.sx ? await find("zzz") : "";
  if (P.S.sx) P.S.sx.q = "";
  check(/data-row="theme"/.test(hTheme) && !/data-row="lang"/.test(hTheme) && /data-row="clear"/.test(hClear)
        && text(hNone).indexOf("No setting matches this search.") >= 0 && !/data-row="/.test(hNone),
    "st11 the search finds Theme by its word and Clear local memory by its button's, across sections, and says the empty"
    + " line for zzz: " + JSON.stringify(text(hNone).slice(0, 60)));

  process.stdout.write("\nscreen-tabs  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  if (asserted !== EXPECTED) {
    process.stdout.write("screen-tabs  expected " + EXPECTED + " assertions, ran " + asserted + "\n");
    failed++;
  }
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "screen-tabs");
  else process.stdout.write("screen-tabs  kept " + SCRATCH + "\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stdout.write("screen-tabs  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
