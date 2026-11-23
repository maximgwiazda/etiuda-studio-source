/* THE MENU'S LIST, THE ABOUT AND THE STATUS BAR: node tests/studio-about.mjs [--keep].
 *
 * Maxim, 2026-10-06 21:13: "Agreed on S1 The Menu becomes a list. As for Studio about screen - I choose S2, at least for
 * now. But keep the window size the same as in S3. As for Studio footer - I choose F3". The design is Claudia's sheet of
 * that day and the words are Claudette's (state/drafts/studio-about-2026-10-06.md in the office), whose rows DRAFT below
 * copies, id for id, so that a word changed in either place without the other reddens 3a.
 *
 * The page runs on tests/page-stand-in.mjs over the real verbs of src/studio.mjs on a scratch project, as
 * tests/bulk-page.mjs does. Markup, state and files only.
 *
 *   1  the Menu's About row wears the version, the tour's row says where it would resume, a row shuts the list and does
 *      its act, and the button shuts what it opened (S1)
 *   2  the About shows S2's rows, every fact read rather than typed; the Settings tab's About page is the About's door and
 *      not the credit (board 965, S1)
 *   3  every string the draft writes is painted where the draft puts it, in both languages
 *   4  Read the licence opens the agreement from a file the program ships, read with no network, in the screen's language,
 *      and Back returns to the About
 *   5  the status bar says each save state's words, and "draft saved" never while anything waits; a screen reader hears the
 *      two that need a person and not the traffic
 *   6  the engine the About names is the one every new draft is stamped with
 *
 * WHAT IT CANNOT SEE, said rather than implied: layout, the list's place under the button, focus and the arrow keys, the
 * click outside that shuts the list, the browser the maker's link opens, and how any of it looks, which is Maxim's eye.
 * A window leg for those is "argued after midnight" in the report that added this file, not run.
 *
 * Node only, no window, no Electron. Exit 0 when every check holds, 1 when any fails.
 */
import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import http from "node:http";
import https from "node:https";
import dns from "node:dns";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import * as S from "../src/studio.mjs";
import { DRAFT_FILE } from "../src/publish.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { loadPage } from "./page-stand-in.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "studio-about");
const require = createRequire(import.meta.url);
const EXPECTED = 36;
/* PROVED BY MAKING IT FAIL: STUDIO_ABOUT_APP=<a copy of ui/app.js> reads that copy instead; the report of the build that
   added this file lists the copies planted and what each reddened. */
const APP = process.env.STUDIO_ABOUT_APP ? fs.readFileSync(path.resolve(process.env.STUDIO_ABOUT_APP), "utf8") : undefined;

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
const fn = (P, n) => typeof P[n] === "function";
/** Markup as a reader hears it: a line break is a new line, every other tag goes, entities are read back. */
const text = (h) => String(h || "").split("<br>").join("\n").replace(/<[^>]*>/g, "")
  .split("&quot;").join('"').split("&#39;").join("'").split("&lt;").join("<").split("&gt;").join(">")
  .split("&amp;").join("&");
const rowsOf = (h) => {
  const out = [];
  const re = /<button type="button" role="menuitem" class="mi" data-act="([^"]+)"[^>]*>(.*?)<\/button>/g;
  for (let m; (m = re.exec(String(h || "")));) out.push({ act: m[1], said: text(m[2]) });
  return out;
};
/** The About's rows as painted: label, value, note and the act of a button beside them. */
const aboutRows = (h) => {
  const out = [];
  const re = /<div class="kv ab-kv"><span class="k">([^<]*)<\/span><span class="ab-v"><span class="v">(.*?)<\/span>(?:<span class="n">(.*?)<\/span>)?<\/span>(?:<button[^>]*data-act="([^"]+)"[^>]*>(.*?)<\/button>)?<\/div>/g;
  for (let m; (m = re.exec(String(h || "")));) out.push({ k: text(m[1]), v: text(m[2]), n: text(m[3] || ""), act: m[4] || "", btn: text(m[5] || "") });
  return out;
};

/* CLAUDETTE'S ROWS, as the draft writes them: [id, English, Polish]. A row whose words are data ({VERSION}, {PROJECT})
   or a brand is here too, so the list reads beside the draft line for line. */
const DRAFT = [
  ["M1", "Menu", "Menu"],
  ["M2", "Settings…", "Ustawienia…"],
  ["M3", "Show tour…", "Pokaż przewodnik…"],
  ["M3b", "Continue the tour ({N} of {OF})", "Wróć do przewodnika (krok {N} z {OF})"],
  ["M4", "About Etiuda Studio", "O Etiudzie Studio"],
  ["M5", "{VERSION}", "{VERSION}"],
  ["A1", "Etiuda Studio", "Etiuda Studio"],
  ["A2", "Version", "Wersja"],
  ["A3", "{VERSION}", "{VERSION}"],
  ["A4", "Released on {DATE}", "z {DATE}"],
  ["A5", "Publishes for", "Zgodność"],
  ["A6", "Etiuda {ENGINE} and later", "Etiuda od wersji {ENGINE}"],
  ["A7", "Every edition this Studio publishes opens on a desk running that version or a newer one.",
    "Każde wydanie z tego Studia otworzy się na stanowisku z tą wersją Etiudy lub nowszą."],
  ["A8", "Licence terms", "Warunki licencji"],
  ["A9", "Etiuda End-User Licence Agreement", "Umowa licencyjna Etiudy"],
  ["A10", "An organisation holds a subscription to Etiuda with Studio for each author it names. Publishing is open while the subscription is current, and the catalogs stay the organisation's own, to open, edit and export at any time.",
    "Organizacja ma subskrypcję Etiudy ze Studiem dla każdego ze swoich autorów. Publikowanie jest otwarte, dopóki subskrypcja jest aktualna, a własne katalogi można zawsze otwierać, edytować i eksportować."],
  ["A11", "Read the licence", "Przeczytaj umowę"],
  ["A12", "Source", "Kod źródłowy"],
  ["A13", "Etiuda Source-Available Licence 1.0", "Licencja Etiuda Source-Available 1.0"],
  ["A14", "Governs the published source of Etiuda, on which Studio is built.",
    "Obejmuje opublikowany kod źródłowy Etiudy, na którym zbudowane jest Studio."],
  ["A15", "© 2026 Max Gwiazda. Etiuda is a trademark of Max Gwiazda.",
    "© 2026 Max Gwiazda. Etiuda jest znakiem towarowym Maxa Gwiazdy."],
  ["A15b", "Licensor: Stardust Maxim Gwiazda, NIP\u00a05242711262, Poland.",
    "Licencjodawca: Stardust Maxim Gwiazda, NIP\u00a05242711262, Polska."],
  ["A16", "Made by Stardust.", "Etiuda Studio. Tworzy je Stardust."],
  ["A17", "Close", "Zamknij"],
  ["A18", "About Etiuda Studio", "O Etiudzie Studio"],
  ["B1", "{PROJECT}", "{PROJECT}"],
  ["B2", "draft saved", "szkic zapisany"],
  ["B3", "saving the draft…", "zapisywanie szkicu…"],
  ["B4", "changes waiting to be written to the folder", "zmiany czekają na zapis w folderze"],
  ["B5", "a change was not saved", "nie udało się zapisać zmiany"],
  ["B6", "Catalog folder: {FOLDER}", "Folder katalogu: {FOLDER}"],
  ["B7", "Etiuda Studio {VERSION}", "Etiuda Studio {VERSION}"],
  ["B8", "Made by Stardust", "Tworzy je Stardust"],
];

const HOST = { version: "0.1.0", minEngine: S.MIN_ENGINE, tour: { offered: true }, langs: S.builtLangs() };

async function main(argv) {
  clearScratch(SCRATCH);
  const root = path.join(SCRATCH, "projects");
  fs.mkdirSync(root, { recursive: true });
  const made = await S.newProject(root, "About page", [{ code: "en" }, { code: "pl" }]);
  const dir = made.dir;
  const shelf = (await S.addTag(dir, "shelf", { en: "Delivery", pl: "Dostawa" })).tag.id;
  const cardId = (await S.addCard(dir, shelf, "Card A", "Parcels leave on Monday.")).card.id;

  /* The verbs the bar's saves reach answer through `mode`: "ok" lands, "disk" is the disk refusing, "no" is a refusal
     that is not the disk's, and "slow" waits for `release` before landing. */
  let mode = "ok", release = null;
  const said = { agreement: [] };
  const answer = (real) => {
    if (mode === "disk") return Promise.resolve({ error: "Could not write to the folder", said: null, disk: true });
    if (mode === "no") return Promise.resolve({ error: "that change is not one this card can take", said: null, disk: false });
    if (mode === "slow") return new Promise((r) => { release = () => r(wire(real())); });
    return wire(real());
  };
  const api = {
    saveCard: (d, i, p) => answer(() => S.saveCard(d, i, p)),
    saveFacts: (d, t) => answer(() => S.saveFacts(d, t)),
    cardHistory: (d, i) => wire(S.cardHistory(d, i)),
    findPlaces: (d) => wire(S.findPlaces(d, { q: "parcels" })),
    signing: () => Promise.resolve({ error: null, signing: { keyId: "", problem: null } }),
    agreement: (l) => { said.agreement.push(l); return wire({ text: S.agreementText(l) }); },
    maker: () => { said.maker = (said.maker || 0) + 1; },
  };
  const pageIn = (uiLang, host) => {
    const home = loadPage({ api, uiLang, source: APP });
    const P = home.page;
    P.S.host = Object.assign({}, HOST, host || {});
    return { home, P };
  };

  /* ---- 1. THE MENU'S LIST (S1) ------------------------------------------------------------------------------------- */
  {
    const { home, P } = pageIn("en");
    P.paint();
    await P.ACTS.menu(el({ "data-act": "menu" }));
    const list = home.node("#menuList");
    check(/<small class="mono">0\.1\.0<\/small>/.test(list.innerHTML) && !/>v0\.1\.0</.test(list.innerHTML),
      "1b the badge is the number alone, no v (M5)");
    check(home.node("#btnMenu").getAttribute("aria-label") === "Menu" && home.node("#btnMenu").getAttribute("aria-expanded") === "true",
      "1c the button keeps its name, Menu (M1), and says the list is open");
    P.S.host.tour = { offered: true, taken: false, at: 3 };
    P.paintMenu && P.paintMenu();
    const resumed = rowsOf(home.node("#menuList").innerHTML)[1] || {};
    /* the frame binds "of" to its number with a no-break space (ui/lang.js fill), read here as a space */
    const nb = String(resumed.said || "").split(String.fromCharCode(160)).join(" ");
    check(resumed.act === "tour-show" && /^Continue the tour \(4 of \d+\)$/.test(nb),
      "1d a tour stopped part-way: the second row says where it opens (M3b): " + JSON.stringify(resumed.said));
    P.S.host.tour = { offered: true };
    await P.ACTS.menu(el({ "data-act": "menu" }));
    check(P.S.menu === false && home.node("#menuList").hidden === true && home.node("#menuList").innerHTML === "",
      "1e CONTROL: the button pressed again shuts the list it opened");
    /* a row is pressed through the page's own door, run(), as a click would: run() is what shuts the list on any
       press but the Menu's own, so the list being shut afterwards is the claim (M1 of the read: the line removed) */
    await P.ACTS.menu(el({ "data-act": "menu" }));
    const opened = P.S.menu === true;
    const pressedAbout = fn(P, "run") && fn(P.ACTS, "about") && P.run(el({ "data-act": "about" })) === true;
    check(opened && pressedAbout && P.S.cover === "about" && P.S.menu === false,
      "1f the About row, pressed through run(), opens the About and shuts the list: cover " + JSON.stringify(P.S.cover)
      + ", menu " + JSON.stringify(P.S.menu));
    P.ACTS["cover-close"]();
    if (fn(P.ACTS, "settings")) await P.ACTS.settings();
    check(P.S.screen === "settings" && !P.S.cover,
      "1g the Settings row opens Settings, in its own tab since board 965: screen " + JSON.stringify(P.S.screen)
      + ", cover " + JSON.stringify(P.S.cover));
    const pl = pageIn("pl").P;
    pl.paint();
    await pl.ACTS.menu(el({ "data-act": "menu" }));
    const plRows = rowsOf(pl.menuHtml ? pl.menuHtml() : "");
    check(plRows.map(r => r.said).join("|") === "Ustawienia…|Pokaż przewodnik…|O Etiudzie Studio0.1.0",
      "1h in Polish: " + JSON.stringify(plRows.map(r => r.said)));
  }

  /* ---- 2. THE ABOUT (S2's rows, S3's size) ------------------------------------------------------------------------- */
  let aboutEn = "", aboutPl = "", settingsEn = "", aboutDated = "", aboutDatedPl = "";
  {
    const { home, P } = pageIn("en");
    P.paint();
    if (fn(P.ACTS, "about")) P.ACTS.about();
    aboutEn = home.node("#dlg").innerHTML;
    const rows = aboutRows(aboutEn);
    const by = Object.fromEntries(rows.map(r => [r.k, r]));
    check((by["Version"] || {}).v === "0.1.0" && (by["Version"] || {}).n === ""
          && (by["Publishes for"] || {}).v === "Etiuda " + S.MIN_ENGINE + " and later" && S.MIN_ENGINE === "2.0.0",
      "2b the version is the host's and the engine is src/studio.mjs's MIN_ENGINE (" + S.MIN_ENGINE + "); with no release day"
      + " in the host the line under the version is left out, never filled from the clock");
    check((by["Licence terms"] || {}).v === "Etiuda End-User Licence Agreement" && (by["Licence terms"] || {}).act === "about-licence"
          && (by["Licence terms"] || {}).btn === "Read the licence"
          && (by["Source"] || {}).v === "Etiuda Source-Available Licence 1.0",
      "2c the terms row carries Read the licence, and the source row names the source licence");
    const head = /^<h2 class="ab-h"><svg[^>]*>.*?<\/svg>Etiuda Studio<\/h2>/.test(aboutEn.replace('<svg class="mark"', '<svg class="mark"'))
      || /^<h2 class="ab-h">Etiuda Studio<\/h2>/.test(aboutEn);
    const foot = text((/<div class="foot">(.*)<\/div>$/.exec(aboutEn) || [])[1] || "");
    check(head && foot.indexOf("© 2026 Max Gwiazda. Etiuda is a trademark of Max Gwiazda.\n" + DRAFT.find(r => r[0] === "A15b")[1]
            + "\nMade by Stardust.") === 0
          && /<a href="https:\/\/stardustcore\.com" data-act="maker">Stardust<\/a>/.test(aboutEn)
          && /data-act="cover-close">Close</.test(aboutEn),
      "2d the head is the mark and the name, and the foot the credit's three lines, the licensor second, Stardust the link, then Close: "
      + JSON.stringify(foot));
    /* The page's masks, standing and turning, sit in an svg of their own (board 441); the band's mark holds none and reaches
       url(#depth). The stand-in's band holds no markup, so the page's own is put there. Each copy (the About's head, the status
       bar, and the sign-in door, which takes the same standing copy) holds no mask and no id, and reaches the standing mask. */
    const page = fs.readFileSync(path.join(ROOT, "ui", "index.html"), "utf8");
    const bandMark = (/<svg class="mark"[^>]*>[\s\S]*?<\/svg>/.exec(page) || [""])[0];
    const shape = h => [(h.match(/<mask\b/g) || []).length, (h.match(/\bid="/g) || []).length, (/mask="url\(#([^)]+)\)"/.exec(h) || [])[1] || "", (h.match(/<path\b/g) || []).length];
    let copies = [];
    try {
      // the band caught mid-turn: its live path on the turn's mask, its standing markup kept as bandTurn keeps it
      home.node("#band .brand svg.mark").outerHTML = bandMark.replace('mask="url(#depth)"', 'mask="url(#depth-turn)"');
      P.__set("bandStanding", bandMark);
      const mh = P.__get("markHtml");
      const door = (/<span class="mk">([\s\S]*?)<\/span>/.exec(P.__get("doorHtml")()) || [])[1] || "";
      copies = [mh(), mh(), door].map(shape);
    } catch (e) { copies = [String(e)]; }
    check(!/<mask\b/.test(bandMark) && /<svg class="mark-masks"[^>]*>[\s\S]*?<mask id="depth"/.test(page) && copies.length === 3
          && copies.every(c => Array.isArray(c) && c[0] === 0 && c[1] === 0 && c[2] === "depth" && c[3] === 1),
      "2e the About's head, the status bar and the door copy the standing mark with no mask and no id, their path reaching url(#depth): " + JSON.stringify(copies));
    if (fn(P.ACTS, "cover-close")) P.ACTS["cover-close"]();
    P.S.host.released = "2026-10-05";
    if (fn(P.ACTS, "about")) P.ACTS.about();
    aboutDated = home.node("#dlg").innerHTML;
    const dated = Object.fromEntries(aboutRows(aboutDated).map(r => [r.k, r]));
    const plp = pageIn("pl", { released: "2026-10-05" }).P;
    plp.paint();
    if (fn(plp.ACTS, "about")) plp.ACTS.about();
    aboutDatedPl = plp.aboutCoverHtml ? plp.aboutCoverHtml() : "";
    const datedPl = Object.fromEntries(aboutRows(aboutDatedPl).map(r => [r.k, r]));
    check((dated["Version"] || {}).n === "Released on 5 October 2026" && (datedPl["Wersja"] || {}).n === "z 5 października 2026",
      "2g with the release day a packaged build carries, the line under the version, in each language: "
      + JSON.stringify((dated["Version"] || {}).n) + " and " + JSON.stringify((datedPl["Wersja"] || {}).n));
    const pp = pageIn("pl").P;
    pp.paint();
    aboutPl = pp.aboutCoverHtml ? pp.aboutCoverHtml() : "";
    /* The credit's lines as painted, a <br> apart, in each language; the licensor's NIP held to its number by a no-break space. */
    const crLines = h => {
      const open = '<span class="ab-cr">', a = h.indexOf(open), b = h.indexOf('</span><span class="spacer">', a);
      return a < 0 || b < 0 ? [] : h.slice(a + open.length, b).split("<br>").map(text);
    };
    const crEn = crLines(aboutEn), crPl = crLines(aboutPl), row = id => DRAFT.find(r => r[0] === id);
    check([[crEn, 1], [crPl, 2]].every(([c, i]) => c.length === 3 && c[0] === row("A15")[i] && c[1] === row("A15b")[i] && c[2] === row("A16")[i])
          && row("A15b").slice(1).every(w => w.indexOf("NIP" + String.fromCharCode(160) + "5242711262") > 0),
      "2h the credit is three lines in each language, copyright and trademark, the licensor, then the maker: " + JSON.stringify([crEn, crPl]));
    if (fn(P.ACTS, "settings")) await P.ACTS.settings();
    if (P.S.sx) { P.S.sx.sec = "about"; P.paint(); }
    settingsEn = home.node("#main").innerHTML;
    const sAbout = (/<div class="sx-row" data-row="about">(.*?)<\/div><\/div>/.exec(settingsEn) || [])[1] || "";
    check(/data-act="about">About Etiuda Studio<\/button>/.test(sAbout) && /<b>Etiuda Studio 0\.1\.0<\/b>/.test(sAbout)
          && settingsEn.indexOf("trademark") < 0 && settingsEn.indexOf('class="why mono ver"') < 0,
      "2h the Settings tab's About page holds the About's door beside the version, and the credit stays the About's own"
      + " (board 965, S1, from S2's third frame): " + JSON.stringify(text(sAbout)));
  }

  /* ---- 5. THE STATUS BAR (F3) ------------------------------------------------------------------------------------- */
  const states = {};
  let sbSaid = {};
  {
    const { home, P } = pageIn("en");
    const open = await wire(S.openProject(dir));
    Object.assign(P.S, { open, screen: "project", section: "cards", lang: "en" });
    P.paint();
    const left = () => text(home.node("#sbLeft").innerHTML);
    const said = () => home.node("#sbSaid").textContent;
    states.saved = left();
    check(states.saved.indexOf("About page · draft saved") === 0
          && home.node("#sbLeft").innerHTML.indexOf('title="Catalog folder: ' + dir.split("&").join("&amp;") + '"') >= 0
          && said() === "",
      "5a open, nothing waiting: the project and \"draft saved\" (B1, B2), the folder named for a reader and as the tooltip (B6): "
      + JSON.stringify(states.saved.slice(0, 40)));
    const right = text(home.node("#sbRight").innerHTML);
    check(right === "Etiuda Studio 0.1.0 · Made by Stardust" && /data-act="maker">Stardust<\/a>/.test(home.node("#sbRight").innerHTML),
      "5b on the right the program, its version and the maker, Stardust the link (B7, B8): " + JSON.stringify(right));
    /* typed: inside the debounce, then on its way, then landed */
    if (fn(P, "queueSave")) P.queueSave(cardId, { body: { en: "Parcels leave on Tuesday." } });
    states.typed = left();
    sbSaid.typed = said();
    mode = "slow";
    const going = fn(P, "flush") ? P.flush() : Promise.resolve();
    await sleep(5);
    states.going = left();
    sbSaid.going = said();
    if (release) release();
    await going;
    await sleep(5);
    states.landed = left();
    check(/saving the draft…/.test(states.typed) && /saving the draft…/.test(states.going) && /draft saved/.test(states.landed)
          && !/draft saved/.test(states.typed + states.going),
      "5c typed, the bar says \"saving the draft…\" (B3) inside the debounce and while the save is on its way, and \"draft saved\""
      + " only once it has landed: " + JSON.stringify([states.typed, states.going, states.landed].map(s => (s.split(" · ")[1] || "").split("Project folder")[0])));
    /* the disk refuses: the change is held and sent again */
    mode = "disk";
    if (fn(P, "queueSave")) P.queueSave(cardId, { body: { en: "Parcels leave on Wednesday." } });
    if (fn(P, "flush")) await P.flush();
    states.held = left();
    sbSaid.held = said();
    check(/changes waiting to be written to the folder/.test(states.held) && !/draft saved/.test(states.held)
          && sbSaid.held === "changes waiting to be written to the folder",
      "5d the disk refused: \"changes waiting to be written to the folder\" (B4), said once to a screen reader");
    mode = "ok";
    if (fn(P, "flush")) await P.flush();
    states.mended = left();
    check(/draft saved/.test(states.mended) && said() === "",
      "5e CONTROL: the held change sent again and landed, the bar says \"draft saved\" and the reader's line empties");
    /* a refusal that is not the disk's: the change snapped back */
    mode = "no";
    if (fn(P, "queueSave")) P.queueSave(cardId, { body: { en: "Parcels leave on Friday." } });
    if (fn(P, "flush")) await P.flush();
    states.refused = left();
    sbSaid.refused = said();
    check(/a change was not saved/.test(states.refused) && !/draft saved/.test(states.refused)
          && sbSaid.refused === "a change was not saved",
      "5f a change refused for another reason snapped back: \"a change was not saved\" (B5), said once to a screen reader");
    mode = "ok";
    if (fn(P, "queueSave")) P.queueSave(cardId, { body: { en: "Parcels leave on Saturday." } });
    if (fn(P, "flush")) await P.flush();
    states.cleared = left();
    check(/draft saved/.test(states.cleared) && said() === "",
      "5g the next save that lands clears it, as a disk's sentence clears");
    /* the quick facts held by the disk are held, not merely typed */
    mode = "disk";
    if (fn(P, "queueFacts")) P.queueFacts("Poland: courier 18 zł.");
    if (fn(P, "flushFacts")) await P.flushFacts();
    states.factsHeld = left();
    mode = "ok";
    if (fn(P, "flushFacts")) await P.flushFacts();
    states.factsLanded = left();
    check(/changes waiting to be written to the folder/.test(states.factsHeld) && /draft saved/.test(states.factsLanded),
      "5h the quick facts the disk refused read as held (B4) and, sent again, as saved");
    check(sbSaid.typed === "" && sbSaid.going === "" && said() === "" && /saving/.test(states.typed + states.going)
          && /draft saved/.test(states.factsLanded),
      "5i a screen reader is never told the traffic: \"saving the draft…\" and \"draft saved\" are not said");
    /* Polish, every state */
    const plb = pageIn("pl").P, plHome = plb;
    const open2 = await wire(S.openProject(dir));
    Object.assign(plb.S, { open: open2, screen: "project", section: "cards", lang: "en" });
    const plStates = {};
    if (fn(plb, "statusLeftHtml")) {
      plb.paint();
      plStates.saved = text(plb.statusLeftHtml());
      plb.queueSave(cardId, { body: { en: "Parcels leave on Sunday." } });
      plStates.saving = text(plb.statusLeftHtml());
      mode = "disk"; await plb.flush(); plStates.held = text(plb.statusLeftHtml());
      mode = "ok"; await plb.flush();
      mode = "no"; plb.queueSave(cardId, { body: { en: "Parcels leave on Monday." } }); await plb.flush();
      plStates.refused = text(plb.statusLeftHtml());
      mode = "ok";
      plStates.right = text(plb.statusRightHtml());
      plStates.folder = (/title="([^"]*)"/.exec(plb.statusLeftHtml()) || [])[1] || "";
    }
    states.pl = plStates;
    check(/· szkic zapisany/.test(plStates.saved || "") && /· zapisywanie szkicu…/.test(plStates.saving || "")
          && /· zmiany czekają na zapis w folderze/.test(plStates.held || "") && /· nie udało się zapisać zmiany/.test(plStates.refused || "")
          && plStates.right === "Etiuda Studio 0.1.0 · Tworzy je Stardust" && /^Folder katalogu: /.test(plStates.folder || ""),
      "5j in Polish, each state and the right half: "
      + JSON.stringify(Object.values(plStates).map(s => s.replace("About page · ", "").split("Folder projektu")[0])));
    void plHome;
    P.S.screen = "projects"; P.S.open = null;
    P.paint();
    check(home.node("#sbLeft").innerHTML === "" && text(home.node("#sbRight").innerHTML) === "Etiuda Studio 0.1.0 · Made by Stardust",
      "5k on Projects, with no project open, the left half has nothing to say and the right stays");
  }

  /* 3b: every row is painted where the draft puts it, in each language (rendered above and in section 5) */
  {
    const ep = pageIn("en").P, pp = pageIn("pl").P;
    ep.paint(); pp.paint();
    const mEn = ep.menuHtml ? ep.menuHtml() : "", mPl = pp.menuHtml ? pp.menuHtml() : "";
    const paintedEn = text([mEn, aboutEn, aboutDated, settingsEn].join("\n")) + "\n" + JSON.stringify(states)
      .split("\\n").join("\n") + "\n" + sbSaid.held + "\n" + sbSaid.refused;
    if (pp.S.sx) pp.S.sx.sec = "about";
    const paintedPl = text([mPl, aboutPl, aboutDatedPl, pp.settingsPageHtml ? pp.settingsPageHtml() : ""].join("\n")) + "\n"
      + JSON.stringify(states.pl || {});
    const fill = (s) => s.split("{N} of {OF}").join("4 of").split("krok {N} z {OF}").join("krok 4 z").split("{VERSION}").join("0.1.0")
      .split("{DATE}").join("5 October 2026").split("{ENGINE}").join(S.MIN_ENGINE).split("{FOLDER}").join("")
      .split("{PROJECT}").join("About page");
    const PAINTED_ELSEWHERE = new Set(["M1", "M3b", "B6"]);   /* the button's name (1c), the resumed row (1d), the folder (5a, 5j) */
    const plFill = (s) => fill(s).split("5 October 2026").join("5 października 2026");
    const missEn = DRAFT.filter(([id, e]) => !PAINTED_ELSEWHERE.has(id) && paintedEn.indexOf(fill(e).split(" (4 of")[0]) < 0);
    const missPl = DRAFT.filter(([id, , p]) => !PAINTED_ELSEWHERE.has(id) && paintedPl.indexOf(plFill(p)) < 0
      && !(id === "A4" && aboutDatedPl.indexOf("z 5 października 2026") >= 0));
    check(missEn.length === 0 && missPl.length === 0,
      "3b and each is painted on the Menu, the About, Settings' About page or the bar, in English and in Polish"
      + (missEn.length || missPl.length ? "; not found: EN " + missEn.map(r => r[0]).join(",") + " PL " + missPl.map(r => r[0]).join(",") : ""));
  }

  /* ---- 4. THE AGREEMENT, FROM THE PROGRAM'S OWN FILE, WITH NO NETWORK --------------------------------------------- */
  {
    const files = ["en", "pl"].map(l => fs.readFileSync(path.join(ROOT, "packaging", "license_" + l + ".txt"), "utf8").replace(/^\uFEFF/, ""));
    const builder = require(path.join(ROOT, "electron-builder.js"));
    const shipped = Array.isArray(builder.files) ? builder.files : [];
    check(shipped.indexOf("packaging/license_en.txt") >= 0 && shipped.indexOf("packaging/license_pl.txt") >= 0,
      "4a both agreements are in the program, on electron-builder.js's allowlist beside the installer's page");
    /* every way out of this process, trapped while the agreement is read; the control proves the trap is listening */
    const out = [];
    const keep = { connect: net.Socket.prototype.connect, http: http.request, https: https.request, lookup: dns.lookup, fetch: globalThis.fetch };
    net.Socket.prototype.connect = function () { out.push("net.connect"); throw new Error("no network here"); };
    http.request = () => { out.push("http.request"); throw new Error("no network here"); };
    https.request = () => { out.push("https.request"); throw new Error("no network here"); };
    dns.lookup = () => { out.push("dns.lookup"); throw new Error("no network here"); };
    globalThis.fetch = () => { out.push("fetch"); return Promise.reject(new Error("no network here")); };
    let texts = [], threw = "";
    try { texts = typeof S.agreementText === "function" ? ["en", "pl"].map(l => S.agreementText(l)) : []; }
    catch (e) { threw = String(e && e.message); }
    const during = out.length;
    try { await fetch("https://stardustcore.com/"); } catch (_) { /* the trap's own refusal */ }
    const control = out.length - during;
    Object.assign(net.Socket.prototype, { connect: keep.connect });
    http.request = keep.http; https.request = keep.https; dns.lookup = keep.lookup; globalThis.fetch = keep.fetch;
    check(texts.length === 2 && texts[0] === files[0] && texts[1] === files[1] && during === 0 && control === 1 && !threw,
      "4b src/studio.mjs reads each agreement as the file holds it, with " + during + " reach for a network (CONTROL: a fetch"
      + " made in the same trap was caught, " + control + ")" + (threw ? "; threw " + threw : ""));
    check(typeof S.agreementText === "function" && S.agreementText("../../x") === files[0] && S.agreementText(undefined) === files[0],
      "4c the page names a language and never a path: anything but pl reads the English");
    const main = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
    const pre = fs.readFileSync(path.join(ROOT, "shell", "preload.js"), "utf8");
    check(/^answer\("studio:agreement",/m.test(main) && /agreementText\(lang === "pl" \? "pl" : "en"\)/.test(main)
          && /agreement:\s*\(lang\)\s*=>\s*ipcRenderer\.invoke\("studio:agreement",\s*lang\)/.test(pre),
      "4d the shell answers it through its own door, the page's word narrowed to en or pl in the handler, and the preload passes that word through");
    for (const [lang, file] of [["en", files[0]], ["pl", files[1]]]) {
      const { home, P } = pageIn(lang);
      P.paint();
      if (fn(P.ACTS, "about")) P.ACTS.about();
      if (fn(P.ACTS, "about-licence")) await P.ACTS["about-licence"]();
      const page = home.node("#dlg").innerHTML;
      const paras = file.split(/\n\s*\n/).map(p => p.replace(/\s+/g, " ").trim()).filter(Boolean);
      const shown = (page.match(/<p>/g) || []).length;
      const title = text((/<h2[^>]*>(.*?)<\/h2>/.exec(page) || [])[1] || "");
      check(said.agreement.slice(-1)[0] === lang && P.S.aboutPage === "licence" && title === paras[0] && shown === paras.length - 1
            && text(page).indexOf(paras[paras.length - 1]) >= 0,
        "4e " + lang + ": Read the licence opens the agreement in the screen's language inside the About, titled "
        + JSON.stringify(title) + ", " + shown + " paragraphs of the file's " + (paras.length - 1));
      if (fn(P.ACTS, "about-back")) P.ACTS["about-back"]();
      check(P.S.cover === "about" && P.S.aboutPage === null && /data-act="about-licence"/.test(home.node("#dlg").innerHTML),
        "4f " + lang + ": Back returns to the About");
    }
  }

  /* ---- 6. THE ENGINE THE ABOUT NAMES ------------------------------------------------------------------------------- */
  {
    const lits = [];
    for (const f of fs.readdirSync(path.join(ROOT, "src")).filter(n => /\.(mjs|cjs|js)$/.test(n))) {
      const src = fs.readFileSync(path.join(ROOT, "src", f), "utf8");
      for (const m of src.matchAll(/minEngine[ ]*[:=][ ]*"([^"]+)"/g)) lits.push(f + ":" + m[1]);
    }
    const main = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
    check(S.MIN_ENGINE === "2.0.0" && lits.length >= 2 && lits.every(x => x.endsWith(":" + S.MIN_ENGINE))
          && /minEngine: \(await studio\(\)\)\.MIN_ENGINE,/.test(main),
      "6a the host's minEngine is src/studio.mjs's MIN_ENGINE, and every engine src/ stamps by literal equals it: "
      + JSON.stringify(lits));
    const made2 = await S.newProject(root, "Stamped", [{ code: "en" }]);
    const draft = JSON.parse(fs.readFileSync(path.join(made2.dir, DRAFT_FILE), "utf8"));
    check(draft.minEngine === S.MIN_ENGINE, "6b and a new project's draft is stamped with it: " + JSON.stringify(draft.minEngine));
  }

  if (!argv.includes("--keep")) dropScratch(SCRATCH, "tests/studio-about.mjs");
  check(asserted === EXPECTED, "z  " + asserted + " checks ran, as this file expects (" + EXPECTED + ")");
  process.stdout.write("#counts checks=" + asserted + " failed=" + failed + "\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch((e) => { process.stdout.write("tests/studio-about.mjs  " + (e && e.stack || e) + "\n"); process.exit(2); });
