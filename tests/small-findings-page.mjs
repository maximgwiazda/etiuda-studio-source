/* THE SMALL FINDINGS OF 24 TO 26 NOVEMBER, AS THE PAGE DRAWS THEM (Max's items 16, 18, 19, 20, 22, 23, 24, 30).
 *
 *     node tests/small-findings-page.mjs
 *
 * gate-kind: node
 *
 * Headless Chrome on ui/index.html and ui/app.js with a stub window.STUDIO and one two-language catalog; what the eye sees
 * is read as computed styles and boxes, never as source text.
 *   sm16 Settings, All settings: one column below 1100 px of window, two from there, three from 1700, as the desk's does
 *   sm18 the status bar's free width is empty: nothing in the bar paints a ground or an edge (a spacer wore the counting
 *        period's panel, a white rounded band across the bar)
 *   sm19 the account, theme and menu buttons stand in the row that holds the search, at its right end, and not in the title
 *        band; the row has no New catalog button (the tabs' plus makes one)
 *   sm22 those buttons are the desk's toolbar buttons: 8 px corners, a faint grey ground, and under the pointer the accent
 *        in the lettering on its soft ground
 *   sm20 Import into this catalog and Publish are action buttons, round discs in the corner, joining from the left of New card
 *   sm23 the language segment has a part for each language and no Both or All
 *   sm24 a language cell says full or not by a glyph, the word kept for the reader that cannot see
 *   sm25 on the Team screen What the team receives stands above Who can read what you publish (it stood last)
 *   sm30 the home tab is named Overview whatever category is chosen, and Overview is the first row of the home rail
 *
 * PLANTS (tests/plant-copy.mjs): sm16, sm18, sm23, sm24, sm25 and sm30 each have the line that decides them put back in a scratch copy.
 * ETIUDA_PLANTS=off skips them. SMALL_FINDINGS_ONLY=<id> runs one leg (the plants' children).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { copyPlants } from "./plant-copy.mjs";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const URL_ = "file:///" + path.join(ROOT, "ui", "index.html").split(path.sep).join("/");
const ONLY = process.env.SMALL_FINDINGS_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const executablePath = [process.env.ETIUDA_CHROME, "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe", "/usr/bin/google-chrome", "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].filter(Boolean).find((p) => fs.existsSync(p));
if (!executablePath) { process.stderr.write("No Chrome browser found to drive\n"); process.exit(1); }

let checks = 0, fails = 0, skipped = 0;
const want = (id) => !ONLY || ONLY === id;
function check(id, ok, line, detail) {
  if (!want(id)) return;
  checks++;
  if (!ok) { fails++; process.stdout.write("  FAIL " + id + " " + line + (detail !== undefined ? ": " + JSON.stringify(detail) : "") + "\n"); }
  else process.stdout.write("  ok   " + id + " " + line + "\n");
}
function skip(line) { skipped++; process.stdout.write("  NOT RUN " + line + "\n"); }

const bridge = (langs) => `(() => {
  const L = ${JSON.stringify(langs)};
  const CARDS = [
    { id: "c1", intents: ["greeting"], shelf: "intro", title: { en: "First card" }, body: { en: "Hello.", pl: "Witaj." }, next: [{ to: "c2" }] },
    { id: "c2", intents: ["follow_up"], shelf: "intro", title: { en: "Second card" }, body: { en: "Next step." } }
  ];
  const CATALOG = {
    dir: "C:/synth/sample-cat", name: "Sample Catalog", fileName: "sample-cat",
    project: { id: "sample", rev: 1, langs: L, name: "Sample Catalog", endsMeant: [] },
    draft: { id: "sample", name: "Sample Catalog", lang: L[0], langs: L.map((c) => ({ code: c, name: c.toUpperCase() })),
      tags: [ { id: "greeting", kind: "intent", label: { en: "Greeting" } }, { id: "follow_up", kind: "intent", label: { en: "Follow up" } }, { id: "intro", kind: "shelf", label: { en: "Intro" } } ],
      cards: CARDS, facts: "", variables: { list: [] } },
    langs: { rows: L.map((c) => ({ code: c, name: c.toUpperCase(), active: true })), primary: L[0] },
    counts: { cards: 2, intents: 2, cats: 1, trash: 0 }, editions: [],
    lint: { errors: 0, warnings: 0, awaiting: 0, suggestions: 0, list: [] }, awaiting: [], tokens: [], likely: [],
    looks: { intro: { hue: "blue", icon: "cards" } }, changes: 0, linked: null,
  };
  const handlers = {
    prefs: async () => ({ theme: "light", lang: "en", tourSeen: true }),
    projects: async () => ({ root: "C:/synth", made: true, projects: [{ dir: CATALOG.dir, name: CATALOG.name, counts: CATALOG.counts }] }),
    open: async () => JSON.parse(JSON.stringify(CATALOG)),
    tabs: async () => [],
    host: async () => ({ version: "0.1.0", theme: "light", signIn: ["google"], providers: ["google"], tour: { offered: true, taken: true } }),
    licence: async () => ({ ok: true, by: "signin", provider: "google", email: "alex@example.invalid", name: "Alex" }),
    teams: async () => ({ ok: true, teams: [] }),
    proposals: async () => [], aiDrafts: async () => [], aiSettings: async () => ({}),
    tour: async () => ({ offered: true, taken: true }), maker: async () => ({ ok: true }), signing: async () => ({ ok: true }),
    seatNames: async () => [], lintProject: async () => [], shortcuts: async () => ({}),
  };
  window.STUDIO = new Proxy({}, { get(_t, k) { if (k in handlers) return handlers[k]; if (typeof k === "string" && k.startsWith("on")) return () => {}; return async () => ({ ok: true }); } });
})();`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function boot(browser, langs, w, h) {
  const page = await browser.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.setViewport({ width: w || 1280, height: h || 820 });
  await page.evaluateOnNewDocument(bridge(langs));
  await page.goto(URL_, { waitUntil: "load" });
  await page.waitForFunction(() => document.documentElement.dataset.theme && document.querySelector("#btnMenu"), { timeout: 15000 });
  page.__errs = errs;
  return page;
}
async function openCatalog(page) {
  await page.waitForSelector('a[data-act="home"][data-v="library"]', { timeout: 10000 });
  await page.click('a[data-act="home"][data-v="library"]');
  await page.waitForSelector('[data-act="open"][data-dir], [data-act="to-project"][data-dir]', { timeout: 10000 });
  await page.click('[data-act="open"][data-dir], [data-act="to-project"][data-dir]');
  await page.waitForSelector('a[data-act="section"][data-v="paths"]', { timeout: 10000 });
  await sleep(250);
}

async function main() {
  const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--hide-scrollbars", "--no-sandbox", "--allow-file-access-from-files"] });
  try {
    /* sm16: the columns of All settings */
    if (want("sm16")) {
      const cols = {};
      for (const w of [1000, 1300, 1900]) {
        const page = await boot(browser, ["en", "pl"], w, 900);
        await page.click("#btnMenu"); await page.click('[data-act="settings"]');
        await page.waitForSelector(".sx-nav", { timeout: 8000 });
        await page.click('.sx-nav [data-act="sx-all"]');
        await page.waitForSelector(".sx-all .sx-block", { timeout: 8000 });
        await sleep(200);
        cols[w] = await page.evaluate(() => {
          const lefts = Array.from(document.querySelectorAll(".sx-all .sx-block")).map((b) => Math.round(b.getBoundingClientRect().left));
          const page_ = document.querySelector(".sx-page");
          return { n: new Set(lefts).size, wide: page_.scrollWidth - page_.clientWidth };
        });
        await page.close();
      }
      check("sm16", cols[1000].n === 1 && cols[1300].n === 2 && cols[1900].n === 3 && Object.values(cols).every((c) => c.wide <= 1),
        "All settings stands in one column at 1000 px, two at 1300 and three at 1900, and runs sideways at none", cols);
    }

    const page = await boot(browser, ["en", "pl"]);
    await openCatalog(page);

    /* sm18: the status bar's free width */
    if (want("sm18")) {
      const bar = await page.evaluate(() => Array.from(document.querySelectorAll("#sbar > *")).map((e) => {
        const cs = getComputedStyle(e), r = e.getBoundingClientRect();
        return { cls: e.className, bg: cs.backgroundColor, edge: cs.borderTopWidth, radius: cs.borderTopLeftRadius, w: Math.round(r.width) };
      }));
      check("sm18", bar.length > 0 && bar.every((b) => b.bg === "rgba(0, 0, 0, 0)" && b.edge === "0px"),
        "nothing in the status bar paints a ground or an edge, so its free width is empty", bar);
    }

    /* sm19, sm22: the buttons' row */
    const top = await page.evaluate(() => {
      const row = document.querySelector("#topline"), q = document.querySelector("#q");
      const band = document.querySelector("#band");
      const at = (id) => { const e = document.getElementById(id); if (!e) return null; const r = e.getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), h: Math.round(r.height), inRow: !!row && row.contains(e), inBand: band.contains(e) }; };
      return { row: !!row, acct: at("btnAcct"), theme: at("btnTheme"), menu: at("btnMenu"), q: q ? Math.round(q.getBoundingClientRect().right) : null,
        winctl: Math.round(document.querySelector(".wctl").getBoundingClientRect().left),
        newBtn: !!document.querySelector('#screen [data-act="new"]'), plus: !!document.querySelector('.tab.add[data-act="new-tab"]') };
    });
    check("sm19", top.row && ["acct", "theme", "menu"].every((k) => top[k] && top[k].inRow && !top[k].inBand && top[k].left >= top.q)
      && top.acct.right <= top.theme.left && top.theme.right <= top.menu.left && top.menu.right > 1200 && !top.newBtn && top.plus,
      "the account, theme and menu buttons stand in the search's row, at its right end, out of the title band, with no New catalog button", top);

    const look = async (theme, hover) => {
      await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
      if (hover) await page.hover("#btnMenu"); else await page.mouse.move(640, 700);
      await sleep(120);
      return page.evaluate(() => {
        const cx = Object.assign(document.createElement("canvas"), { width: 1, height: 1 }).getContext("2d", { willReadFrequently: true });
        const px = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = "#000"; cx.fillRect(0, 0, 1, 1); cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); return Array.from(cx.getImageData(0, 0, 1, 1).data.slice(0, 3)); };
        const e = document.getElementById("btnMenu"), cs = getComputedStyle(e);
        return { radius: cs.borderTopLeftRadius, h: Math.round(e.getBoundingClientRect().height), border: cs.borderTopWidth, bg: px(cs.backgroundColor), ink: px(cs.color),
          mark: px(getComputedStyle(document.documentElement).getPropertyValue("--mark")) };
      });
    };
    const rest = await look("light", false), over = await look("light", true), restD = await look("dark", false), overD = await look("dark", true);
    const near = (a, b, t) => a.every((v, i) => Math.abs(v - b[i]) <= t);
    check("sm22", top.menu && rest.radius === "8px" && rest.h === 32 && rest.border === "1px" && near(over.ink, over.mark, 3) && !near(rest.ink, rest.mark, 3)
      && over.bg.join() !== rest.bg.join() && overD.bg.join() !== restD.bg.join() && near(overD.ink, overD.mark, 3),
      "the buttons are the desk's: 8 px corners, a quiet ground, and under the pointer the accent's lettering on its soft ground, in both themes", { rest, over, restD, overD });

    /* sm20: the action buttons */
    const discs = await page.evaluate(() => {
      const g = (id) => { const e = document.getElementById(id); if (!e) return null; const r = e.getBoundingClientRect(); return { l: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height), act: e.getAttribute("data-act"), radius: getComputedStyle(e).borderTopLeftRadius, title: e.title }; };
      return { imp: g("discImport"), pub: g("discPublish"), neu: g("discNew"), rev: g("discReview"), bak: g("discBackup"),
        inChrome: !!document.querySelector('#chrome [data-act="import"], #chrome [data-act="publish"]') };
    });
    check("sm20", !!discs.imp && !!discs.pub && !!discs.neu && discs.imp.act === "import" && discs.pub.act === "publish" && discs.imp.w === 44 && discs.pub.w === 44
      && discs.imp.radius === "50%" && discs.pub.radius === "50%" && discs.imp.l < discs.pub.l && discs.pub.l < discs.neu.l && !discs.inChrome
      && /Import into this catalog/.test(discs.imp.title) && /Publish/.test(discs.pub.title),
      "Import into this catalog and Publish are round discs in the corner, joining from the left of New card, and are no longer in the toolbar row", discs);

    /* sm24 */
    await page.click('a[data-act="section"][data-v="cards"]'); await sleep(250);
    const chips = await page.evaluate(() => Array.from(document.querySelectorAll("#main tr.pick td[data-lang]")).map((td) => {
      const c = td.querySelector(".cell-chip"); const vis = Array.from(c.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join("");
      return { lang: td.dataset.lang, svg: !!c.querySelector("svg"), visibleWords: vis, said: c.textContent.trim() };
    }));
    check("sm24", chips.length >= 4 && chips.every((c) => c.svg && c.visibleWords === "" && c.said !== ""),
      "a language cell says full or not by a glyph, the word kept for a reader that cannot see", chips);

    /* sm23 */
    const segs = async (langs) => {
      const p = await boot(browser, langs); await openCatalog(p);
      const r = await p.evaluate(() => Array.from(document.querySelectorAll('#chrome .seg.langs span')).map((s) => s.textContent.trim() + "/" + (s.dataset.v || "")));
      await p.close(); return r;
    };
    const two = await segs(["en", "pl"]), three = await segs(["en", "pl", "de"]);
    check("sm23", two.join() === "EN/en,PL/pl" && three.join() === "EN/en,PL/pl,DE/de", "the language segment has a part for each language and no Both or All", { two, three });

    /* sm30 */
    const home = async (v) => {
      await page.click('[data-act="to-projects"]'); await sleep(250);
      await page.click('#rail a[data-act="home"][data-v="' + v + '"]'); await sleep(250);
      return page.evaluate(() => ({ tab: document.querySelector('.tab[data-act="to-projects"], [data-act="to-projects"]').textContent.trim(),
        rail: Array.from(document.querySelectorAll('#rail a[data-act="home"]')).map((a) => a.dataset.v) }));
    };
    const hOv = await home("overview"), hTeam = await home("team"), hLib = await home("library");
    check("sm30", [hOv, hTeam, hLib].every((h) => h.tab === "Overview") && [hOv, hTeam, hLib].every((h) => h.rail[0] === "overview"),
      "the home tab keeps the name Overview on every category, and Overview is the first row of the rail", { hOv, hTeam, hLib });
    if (page.__errs.length) check("sm19", false, "the page threw", page.__errs);

    /* sm25: the Team screen, on the page's own stand-in (tests/page-stand-in.mjs) with one relay team, as tests/team-desks.mjs draws it */
    if (want("sm25")) {
      const { loadPage } = await import("./page-stand-in.mjs");
      const proj = { id: "c-harbour", name: "Harbour lamps", dir: "C:/Projects/harbour", rev: 1, counts: { cards: 1 } };
      const team = { id: "t-1111111111111111", connection: "relay", sealed: true, led: true, leadPrint: "aaaa111122223333", catalogs: [proj.id], project: proj, projects: [proj],
        teammates: [{ id: "k-1", name: "Ada", kind: "desk", admitted: true }], count: 1 };
      const withTeam = { error: null, folder: "C:/ud/relay/0123456789abcdef0123456789abcdef", file: "ours", signing: "studio-aaaa111122223333", inside: false, keyHeld: true, canKeep: true,
        team: { id: team.id, epoch: 1, sealed: true, exportsSealed: true, relay: true, leadPrint: team.leadPrint,
          roster: [{ id: "k-1", name: "Ada", own: "", key: "1111222233334444", admitted: true }] }, requests: [], invites: [] };
      const h = loadPage({ api: {
        projects: async () => ({ root: "C:/Projects", projects: [proj] }), teams: async () => ({ teams: [team] }),
        desks: async () => JSON.parse(JSON.stringify(withTeam)), archive: async () => ({ editions: [] }),
        peopleList: async () => ({ error: null, people: [] }), seatNames: async () => ({ error: null, names: {} }),
      }, uiLang: "en" });
      const P = h.page;
      Object.assign(P.S, { open: null, screen: "projects", home: "overview", projects: [proj], teams: [team], teamTab: 0, teamPickDir: "", teamDir: "",
        desks: null, desksLoadedFor: "", host: { tour: { offered: true } } });
      await P.ACTS.home({ getAttribute: (k) => (k === "data-v" ? "team" : null) });
      await sleep(60);
      const html = h.node("#main").innerHTML;
      const at = { recv: html.indexOf("What the team receives"), who: html.indexOf("Who can read what you publish"), roster: html.indexOf(">Roster<") };
      check("sm25", at.recv > 0 && at.who > 0 && at.recv < at.who && at.recv < at.roster,
        "on the Team screen What the team receives stands above the roster and above Who can read what you publish", at);
    }
  } finally {
    await Promise.race([browser.close(), new Promise((r) => setTimeout(r, 10000))]);
  }

  if (!ONLY) {
    if (PLANTS_OFF) { skip("the plants of sm16, sm18, sm23, sm24, sm25 and sm30 (ETIUDA_PLANTS=off)"); }
    else {
      copyPlants({
        root: ROOT, self: SELF, label: "small-findings", onlyVar: "SMALL_FINDINGS_ONLY", check: (ok, line) => check("plant", ok, line), skip, timeout: 240000,
        plants: [
          { mark: "sm16-cols", leg: "sm16", rel: "ui/index.html", line: ".sx-all{display:flex;flex-direction:column;gap:26px}" },
          { mark: "sm18-panel", leg: "sm18", rel: "ui/index.html", line: ".sp{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:12px 18px 10px;margin:12px 0 0;" },
          { mark: "sm23-both", leg: "sm23", rel: "ui/app.js", line: "      ? seg(\"lang\", all.map((c) => [c, c.toUpperCase()]).concat([[\"both\", T(\"Both\")]]), S.lang, \"langs\")" },
          { mark: "sm24-glyph", leg: "sm24", rel: "ui/app.js", line: "          + '<span class=\"cell-chip ' + (full ? \"full\" : \"empty\") + '\">' + esc(full ? ctx.full : ctx.empty) + \"</span></td>\";" },
          { mark: "sm25-receives", leg: "sm25", rel: "ui/app.js", line: '          + ""' },
          { mark: "sm30-name", leg: "sm30", rel: "ui/app.js", line: "      + ' data-act=\"to-projects\" tabindex=\"0\">' + I(\"home\") + esc(S.home === \"team\" ? T(\"Team\") : T(\"Overview\")) + \"</span>\");" },
        ],
      });
    }
  }
  process.stdout.write("#counts checks=" + checks + " skipped=" + skipped + " failures=" + fails + "\n");
  process.exit(fails ? 1 : 0);
}
main().catch((err) => { process.stderr.write(String((err && err.stack) || err) + "\n"); process.exit(2); });
