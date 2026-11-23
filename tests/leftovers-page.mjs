/* STUDIO'S LEFTOVERS AS PICKED (Maxim, 2026-10-06 22:20, on Claudia's sheet of that day): "Project tabs
 * when the band runs out of room (22b): We go with T3." "The Written to column (W1d): let's go with W3 The
 * file and its folder only (the page's option C)" "Active, Retired and All (W2a): Let's go with R2 In the
 * table's own head". The invite is left as it is.
 *
 * Node only, on the page stand-in (tests/page-stand-in.mjs): markup and state, and the tab strip's arithmetic
 * on numbers. What a window shows (the widths laid out, the fade, the list hung under its button) is the
 * window's, argued after midnight; tests/fade-off.mjs holds the fade.
 *   T  the strip's rungs: every name whole while it fits, then the wordmark folded where that keeps them
 *      whole, then the others give way, longest first and none below 132, the open one whole, then it
 *      scrolls; the list button wherever a name is not whole; the list holds every open project, the open
 *      one marked, each with its revision and its cross; the revision on every tab in the band, selected or not;
 *      Projects and + outside the strip; the arrows' and the button's words in both languages.
 *   W  the Written to cell: the file's name, the folder holding it beneath (on drive S: at a drive's root, the
 *      share at a share's root), the whole path on hover; a folder with nothing published named alone.
 *   R  the Active, Retired and All switch in the Card column's heading, named for a screen reader, absent
 *      while no card is retired, and the view never left on an empty Retired.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPage } from "./page-stand-in.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const APP = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
const BOOT = "  boot();\n})();";
let failures = 0, legs = 0;
function check(ok, what) { legs++; if (!ok) failures++; console.log((ok ? "  ok   " : "  FAIL ") + what); }
const has = (f) => typeof f === "function";

/* the closure's names this leg reads, exposed by one line before the closing boot() */
const MORE = ["tabPlan", "tabWidths", "TAB_MAX", "TAB_MIN", "tabListHtml", "paintTabs", "projectsHtmlFor", "writtenTo",
  "headHtml", "cardViewNow", "visibleCards", "paintCards"];
function page(uiLang, src) {
  const source = (src || APP).replace(BOOT, "  window.__more = {};\n  " + JSON.stringify(MORE)
    + ".forEach((n) => { try { window.__more[n] = eval(n); } catch (e) { /* absent here */ } });\n" + BOOT);
  const h = loadPage({ api: null, uiLang, source });
  return Object.assign(h, { M: h.sandbox.__more });
}
const text = (h) => String(h).replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

/* ---- T3: the tab strip --------------------------------------------------------------------------------- */

const en = page("en");
const M = en.M;
check(has(M.tabPlan) && M.TAB_MAX === 220 && M.TAB_MIN === 132, "T1 the strip's plan, with T2's 220 and 132 (Claudia's sheet)");
if (has(M.tabPlan)) {
  const plan = (raw, on, room) => M.tabPlan({ raw, on, room, gap: 2, listW: 42, wordW: 128 });
  const sum = (ws) => ws.reduce((a, b) => a + b, 0) + 2 * (ws.length - 1);
  const three = [105, 163, 195];
  const p1 = plan(three, 2, 600);
  check(JSON.stringify(p1) === JSON.stringify({ ws: three, list: false, fold: false, over: false }),
    "T2 room for every name: each tab its own width, nothing folded, no list button, no arrows: " + JSON.stringify(p1));
  const p2 = plan(three, 2, 400);
  check(JSON.stringify(p2) === JSON.stringify({ ws: three, list: false, fold: true, over: false }),
    "T3 where folding the wordmark keeps every name whole it folds first, with no list button: " + JSON.stringify(p2));
  const seven = [105, 190, 170, 210, 200, 201, 205], on = 5;
  const p3 = plan(seven, on, 1150);
  check(p3.list === true && p3.fold === false && !p3.over && p3.ws[on] === 201 && sum(p3.ws) <= 1150 - 42 && p3.ws[0] === 105
      && p3.ws.every((w, i) => i === on || w >= Math.min(seven[i], 132)) && p3.ws.some((w, i) => w < seven[i]),
    "T4 short of room: the others give way, the open one whole, none below 132, a short name kept whole, the list button"
    + " in: " + JSON.stringify(p3));
  const longest = p3.ws.map((w, i) => [w, seven[i]]).filter((x, i) => i !== on && x[0] < x[1]);
  check(longest.every((x) => x[0] === longest[0][0]),
    "T5 the longest give way first, to one width, rather than every tab losing the same share: " + JSON.stringify(longest));
  const p4 = plan(seven, on, 1100 - 128);
  check(p4.list && p4.fold && !p4.over && sum(p4.ws) <= 1100 - 128 - 42 + 128,
    "T6 shorter still: the wordmark folds as well, and the strip still fits: " + JSON.stringify(p4));
  const p5 = plan(seven, on, 600);
  check(p5.list && p5.fold && p5.over && p5.ws[on] === 201 && p5.ws.every((w, i) => i === on || w === Math.min(seven[i], 132)),
    "T7 at the end: the strip scrolls between the arrows, the others at 132 (a shorter one its own), the open one whole: "
    + JSON.stringify(p5));
  const p6 = plan([105, 300], 1, 2000);
  check(p6.list && p6.ws[1] === 220, "T8 a name longer than 220 is not whole even with room to spare, so the list button is in: " + JSON.stringify(p6));
}

/* the band's markup and the list's */
const S = en.page.S;
const dirs = ["C:\\p\\Mirabelka", "C:\\p\\Reklamacje", "C:\\p\\Hotel", "C:\\p\\Support", "C:\\p\\Onboarding", "C:\\p\\Faktury",
  "C:\\p\\Sklep"];
const names = ["Mirabelka", "Reklamacje i zwroty", "Hotel Pod Lipami", "Support, Northern Europe", "Onboarding partnerów",
  "Faktury i płatności", "Sklep internetowy, czat"];
Object.assign(S, { screen: "project", tabs: dirs.map((dir, i) => ({ dir, name: names[i], rev: i + 1 })),
  open: { dir: dirs[5], name: names[5], project: { rev: 6 } } });
if (has(en.page.paintTabs)) en.page.paintTabs();
const band = en.node("#tabs").innerHTML;
const barAt = band.indexOf('id="tabsBar"'), barEnd = band.indexOf("</div>", barAt);
const inBar = band.slice(barAt, barEnd);
check(barAt > 0 && (inBar.match(/data-act="to-project"/g) || []).length === 7 && !/to-projects|new-tab/.test(inBar)
    && band.indexOf('data-act="to-projects"') < barAt && band.indexOf('data-act="new-tab"') > barEnd,
  "T9 the seven project tabs are the strip; Projects stands before it and + after it, outside it");
check((band.match(/class="rev"/g) || []).length === 7 && /data-dir="C:\\p\\Faktury"[^>]*>(?:<svg[^]*?<[/]svg>)?<span class="nm">Faktury i płatności<\/span><span class="rev">rev\u00a06<\/span>/.test(band),
  "T10 the band shows a revision on every tab, selected or not (board 1019 (11); was on the open tab only): " + (band.match(/<span class="rev">[^<]*<\/span>/g) || []).join(" "));
const btn = /<button[^>]*id="btnTabs"[^>]*>/.exec(band);
check(!!btn && /data-act="tab-list"/.test(btn[0]) && /aria-haspopup="menu"/.test(btn[0]) && /title="Show every open catalog"/.test(btn[0])
    && /aria-label="Show every open catalog"/.test(btn[0])
    && /id="tabsPrev"[^>]*title="Scroll tabs left" aria-label="Scroll tabs left"/.test(band)
    && /id="tabsNext"[^>]*title="Scroll tabs right" aria-label="Scroll tabs right"/.test(band),
  "T11 the list button and the two arrows say what they do (Claudette's words, the arrows' the desk's)");
const list = has(M.tabListHtml) ? M.tabListHtml() : "";
const rows = [...list.matchAll(/<div class="mi[^"]*" role="menuitem"[^>]*data-dir="([^"]*)"><span class="nm">([^<]*)<\/span><span class="rev">([^<]*)<\/span><span class="x" role="button" data-act="close-tab" data-dir="([^"]*)"/g)];
check(rows.length === 7 && rows.every((r, i) => r[1] === dirs[i] && r[2] === names[i] && r[3] === "rev\u00a0" + (i + 1) && r[4] === dirs[i])
    && /<div class="tl-h" id="tabListHead">Open catalogs<\/div>/.test(list),
  "T12 the list holds every open project in the band's order, by its whole name, its revision and its cross, under Open projects");
const marked = [...list.matchAll(/class="mi on" role="menuitem" aria-current="page" tabindex="-1" data-act="to-project" data-dir="([^"]*)"/g)].map((m) => m[1]);
check(marked.length === 1 && marked[0] === dirs[5], "T13 the open project's row, and only it, is marked: " + JSON.stringify(marked));
S.screen = "projects";
const listHome = has(M.tabListHtml) ? M.tabListHtml() : "";
check((listHome.match(/role="menuitem"/g) || []).length === 7 && !/aria-current="page"/.test(listHome) && !/class="mi on"/.test(listHome),
  "T14 on the project list no row is marked and every project is still there");
const pl = page("pl");
Object.assign(pl.page.S, { screen: "project", tabs: S.tabs, open: S.open });
if (has(pl.page.paintTabs)) pl.page.paintTabs();
const plBand = pl.node("#tabs").innerHTML, plList = has(pl.M.tabListHtml) ? pl.M.tabListHtml() : "";
check(/title="Pokaż wszystkie otwarte katalogi"/.test(plBand) && /title="Przewiń katalogi w lewo"/.test(plBand)
    && /title="Przewiń katalogi w prawo"/.test(plBand) && />Otwarte katalogi</.test(plList) && /wer\.\u00a01/.test(plList),
  "T15 in Polish: Pokaż wszystkie otwarte katalogi, Przewiń katalogi w lewo and w prawo, Otwarte katalogi, wer.");

/* ---- W3: the file and its folder ------------------------------------------------------------------------ */

const B = String.fromCharCode(92);
const cell = (h) => {
  const td = /<td class="wt"(?: title="([^"]*)")?>([\s\S]*?)<\/td>/.exec(h) || [];
  return { title: td[1] === undefined ? null : text(td[1]), file: text((/<span class="mono wt-f"[^>]*>([^<]*)<\/span>/.exec(td[2] || "") || [])[1] || ""),
    where: text((/<span class="wt-in"[^>]*>([^<]*)<\/span>/.exec(td[2] || "") || [])[1] || ""), all: text(td[2] || "") };
};
const pub = { folder: "S:" + B + "Shared" + B + "Answers" + B + "Invoices", fileName: "invoices-and-payments.ec" };
const w1 = has(M.writtenTo) ? cell(M.writtenTo(pub)) : {};
check(w1.file === "invoices-and-payments.ec" && w1.where === "in Invoices"
    && w1.title === "S:" + B + "Shared" + B + "Answers" + B + "Invoices" + B + "invoices-and-payments.ec",
  "W1 a published project's cell gives the file's name, the folder holding it beneath, and the whole path on hover: "
  + JSON.stringify(w1));
const w2 = has(M.writtenTo) ? cell(M.writtenTo({ folder: "S:" + B, fileName: "hotel.ec" })) : {};
check(w2.file === "hotel.ec" && w2.where === "on drive S:" && w2.title === "S:" + B + "hotel.ec",
  "W2 a file at a drive's root says on drive S:, not in S:" + B + ": " + JSON.stringify(w2));
const w3 = has(M.writtenTo) ? cell(M.writtenTo({ folder: B + B + "server" + B + "share", fileName: "x.ec" })) : {};
check(w3.where === "in share" && w3.title === B + B + "server" + B + "share" + B + "x.ec",
  "W3 at a share's root the share is the folder named: " + JSON.stringify(w3));
const w4 = has(M.writtenTo) ? cell(M.writtenTo({ folder: "S:" + B + "Shared" + B + "Partners" + B, fileName: "" })) : {};
check(w4.file === "" && w4.where === "in Partners" && w4.title === "S:" + B + "Shared" + B + "Partners" + B,
  "W4 a folder chosen and nothing published names that folder alone, its path on hover: " + JSON.stringify(w4));
const w5 = has(M.writtenTo) ? cell(M.writtenTo({ folder: "" })) : {};
check(w5.all === "no folder chosen yet" && w5.title === null, "W5 no folder chosen says so, with no hover: " + JSON.stringify(w5));
const plw = has(pl.M.writtenTo) ? [cell(pl.M.writtenTo(pub)), cell(pl.M.writtenTo({ folder: "S:" + B, fileName: "hotel.ec" }))] : [{}, {}];
check(plw[0].where === "w folderze Invoices" && plw[1].where === "na dysku S:",
  "W6 in Polish: w folderze and na dysku (Claudette's), the folder's name as it stands: " + JSON.stringify(plw.map((x) => x.where)));
Object.assign(S, { screen: "projects", home: "library", pfilter: "all", q: "", err: null, rootMissing: false, root: "C:" + B + "p",
  projects: [Object.assign({ dir: dirs[0], name: names[0], counts: { cards: 3 }, rev: 2, published: "2026-10-05T14:12:00Z" }, pub),
    { dir: dirs[1], name: names[1], counts: { cards: 1 }, rev: 0, folder: "" }] });
if (has(en.page.paintMain)) en.page.paintMain();
const list2 = en.node("#main").innerHTML;
const pathMenu = has(en.page.ctxItems) ? en.page.ctxItems({
  getAttribute(k) {
    if (k === "data-ctx") return "project";
    if (k === "data-dir") return dirs[0];
    if (k === "data-where") return "row";
    return null;
  },
  querySelectorAll() { return []; },
}).map((it) => it && it.said).filter(Boolean) : [];
check(!/<td class="wt"/.test(list2) && !/<th>Written to<\/th>/.test(list2)
    && pathMenu.indexOf("Copy the path") >= 0 && pathMenu.indexOf("Show in folder") >= 0,
  "W7 the Library row has no Written to cell; the catalog's path stays on its menu: " + JSON.stringify(pathMenu));

/* ---- R2: the switch in the Card heading ------------------------------------------------------------------- */

const card = (id, retired) => ({ id, shelf: "t-a", title: { en: id }, body: { en: "x" }, retired: !!retired });
Object.assign(S, { screen: "project", section: "cards", lang: "en", sel: null, find: null, cardView: "active",
  open: { dir: dirs[0], name: names[0], project: { rev: 2 }, lint: { errors: 0, warnings: 0 }, editions: [], draft: { langs: [{ code: "en" }], tags: [{ id: "t-a", kind: "shelf", label: { en: "A" } }],
    cards: [card("one"), card("two"), card("three", true)] } } });
const head = has(M.headHtml) ? M.headHtml() : "";
const th = (/<th>Card(<span class="viewbar">[\s\S]*?<\/span>)?<\/th>/.exec(head) || [])[1] || "";
check(/<div class="seg" role="radiogroup" aria-label="Cards shown">/.test(th)
    && text(th).replace(/\u00a0/g, " ") === "Active 2Retired 1All 3"
    && /class="on" role="radio" aria-checked="true" data-act="card-view" data-v="active"/.test(th),
  "R1 with a card retired the switch is in the Card column's heading, named Cards shown for a screen reader, Active on: "
  + JSON.stringify(text(th)));
S.open.draft.cards[2].retired = false;
check(has(M.headHtml) && /<th>Card<\/th>/.test(M.headHtml()) && !/viewbar|card-view/.test(M.headHtml()),
  "R2 with none retired the heading reads Card and nothing more");
S.cardView = "retired";
if (has(en.page.paintCards)) en.page.paintCards();
check(S.cardView === "active" && en.page.visibleCards().length === 3,
  "R3 the last retired card restored with Retired chosen: the view returns to every card, never an empty Retired list: "
  + S.cardView + ", " + en.page.visibleCards().length + " shown");
S.open.draft.cards[2].retired = true; S.cardView = "all";
if (has(en.page.paintCards)) en.page.paintCards();
check(S.cardView === "all" && en.page.visibleCards().length === 3, "R4 CONTROL: with a card still retired the view chosen stays chosen");
const plCtx = pl.page.S;
Object.assign(plCtx, { screen: "project", section: "cards", lang: "pl", sel: null, find: null, cardView: "active", open: S.open });
const plHead = has(pl.M.headHtml) ? pl.M.headHtml() : "";
check(/aria-label="Pokazywane karty"/.test(plHead) && /<th>Karta<span class="viewbar">/.test(plHead)
    && /Aktywne\u00a02/.test(plHead) && /Wycofane\u00a01/.test(plHead) && /Wszystkie\u00a03/.test(plHead),
  "R5 in Polish: Karta, Aktywne, Wycofane, Wszystkie, and Pokazywane karty heard");
const appNow = APP;
check(!/const strip = viewBar\(\)/.test(appNow) && /esc\(T\("Card"\)\) \+ viewBar\(\)/.test(appNow),
  "R6 the strip over the table no longer carries the switch; the heading does");

console.log(legs + " leg(s), " + failures + " failure(s)");
process.exit(failures ? 1 : 0);
