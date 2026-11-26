/* THE SIDE PANEL STAYS ON THE LEFT AT EVERY WIDTH STUDIO ALLOWS (Max's note 7, 2026-11-14).
 *
 *     node tests/rail-left.mjs [--shots <folder>]
 *
 * Max, testing the installed Studio: "When Studio's window is small, the left side panel for some reason transforms
 * into this unreadable top panel. That's absolutely wrong - left side panel should stay as left side panel." Below
 * 1100 px the Overview's rail had become one wrapped row of filters across the top of the work area, and a catalog's
 * rail, the Teams screen's and the import's two implicit grid rows above the page. The criterion is the panel, not one
 * screen: every screen with a side panel keeps it on the left, at Studio's smallest window (src/window-size.cjs MIN_W)
 * and at the old breakpoint's neighbours, with nothing hidden.
 *
 * Headless Chrome on ui/index.html and ui/app.js, a stub window.STUDIO, and one catalog made and opened by the real
 * verbs (src/studio.mjs newProject and openProject) into scratch, so the catalog's screens paint what a shell would hand
 * them. What the eye sees, at each width in WIDTHS and on each screen in SCREENS:
 *   rl1 the panel is shown (a box wider than 120 px, not display:none)
 *   rl2 it stands to the left of the content: its right edge at or before the content's left edge
 *   rl3 beside it, not above it: the two share their top, within 2 px (a panel stacked over the page is a band and the
 *       page starts under it), and a panel that is the work area's own side (the rail, Settings' list) is at least 80
 *       per cent of the content's height; the Variables list is a pane as tall as its rows, so only its top is asked
 *   rl4 nothing in the panel runs past its right edge (a cut label fades inside the box, never spills over the page)
 *   rl6 every row of the panel can be reached: it fits the window's height, or the panel scrolls (a catalog's rail is
 *       taller than Studio's 560 px minimum, and a rail that clipped its foot hid Archive, Statistics and Catalog details)
 *   rl7 the content beside the panel does not run sideways (Max's standing word: nothing scrolls sideways): its box's
 *       scrollWidth is within 1 px of its clientWidth, and no table runs past the box that holds it (the Teams table at
 *       900 put Statistics past its pane's edge; the product designer, 2026-11-15)
 * And on Teams at MIN_W, two the product designer saw there (2026-11-15):
 *   rl8 Back to Overview stands once (it stood in the chrome row and again at the page's head)
 *   rl9 the team's open button names its catalog, from the Library where the team's own entry carries no name (it read
 *       "Open the team in", its last words missing)
 * SCREENS: the Overview, the Library, Teams, a catalog's cards, its Variables (the list of variables beside the one
 * open), the import's paste step, and Settings. Maintenance has no side panel.
 * With --shots, a PNG per screen at MIN_W and at 1099, light and dark, goes into the folder named (the product
 * designer's pictures); the checks are the same either way.
 *
 * THE PLANT (tests/plant-copy.mjs): the line marked plant:rail-left in ui/index.html, the work area's two columns at
 * every width, is put back in a scratch copy to the one column it was below 1100, and the copy's run must print FAIL rl2;
 * the line marked plant:teams-wrap, the Teams table's cells at 8px a side, is taken out, and it must print FAIL rl7.
 * RAIL_LEFT_HTML=<a copy of ui/index.html> runs the checks on another sheet, without the plant.
 * What it cannot see: a screen nobody listed here (the rail's own painter, paintRail, names them), a dialog's own
 * column (the press cover is a dialog, not a side panel), and whether the panel is pleasant at 900: that is the
 * product designer's eye, on the pictures.
 *
 * Node only, headless Chrome via puppeteer-core, no Electron window.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import * as Studio from "../src/studio.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { createRequire } from "node:module";
import { copyPlants } from "./plant-copy.mjs";

const require = createRequire(import.meta.url);
const { MIN_W, MIN_H } = require("../src/window-size.cjs");
const SELF = fileURLToPath(import.meta.url);
const HERE = path.dirname(SELF);
const ROOT = path.resolve(HERE, "..");
const HTML_FILE = process.env.RAIL_LEFT_HTML ? path.resolve(process.env.RAIL_LEFT_HTML) : path.join(ROOT, "ui", "index.html");
const SCRATCH = path.join(ROOT, "scratch", "rail-left");
const shotsAt = process.argv.indexOf("--shots");
const SHOTS = shotsAt > 0 ? path.resolve(process.argv[shotsAt + 1] || "") : "";

/* Studio's smallest window, the old breakpoint's two sides, and one wide width where the panel always stood. */
const WIDTHS = [MIN_W, 1000, 1099, 1100, 1280];
/* Studio's shortest window, where a panel is most likely to run out of room downwards. */
const HEIGHT = MIN_H;
/* Six checks at each width, rl8 and rl9, two plants and the copy's put-back, and rl5 itself. */
const EXPECTED = 6 * 5 + 2 + 3 + 1;

const CHROME_PATHS = [
  process.env.ETIUDA_CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);
const executablePath = CHROME_PATHS.find((p) => fs.existsSync(p));
if (!executablePath) {
  process.stderr.write("No Chrome browser found to drive\n");
  process.exit(1);
}

let checks = 0, fails = 0, skipped = 0;
function skip(line) { skipped++; process.stdout.write("  SKIP  " + line + "\n"); }
function check(ok, line, detail) {
  checks++;
  if (ok) process.stdout.write("  ok   " + line + "\n");
  else {
    fails++;
    process.stdout.write("  FAIL " + line + (detail ? ": " + JSON.stringify(detail) : "") + "\n");
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const wire = (p) => Promise.resolve(p).then((v) => JSON.parse(JSON.stringify(Object.assign({ error: null }, v))));

/* Each screen: how to reach it from the page as booted, and which box is the panel and which the content. */
const SCREENS = [
  { key: "overview", go: `document.querySelector('#rail [data-act="home"][data-v="overview"]').click()`,
    ready: `/Overview/.test((document.querySelector("#main h1") || {}).textContent || "")`, panel: "#rail", content: "#main" },
  { key: "teams", go: `document.querySelector('#rail [data-act="home"][data-v="team"]').click()`,
    ready: `!!document.querySelector('#rail a[data-act="home"][data-v="team"][aria-current="page"]') && /Team/.test((document.querySelector("#main h1") || {}).textContent || "") && !!document.querySelector("#main .teams-screen table")`,
    panel: "#rail", content: "#main" },
  { key: "library", go: `document.querySelector('#rail [data-act="home"][data-v="library"]').click()`,
    ready: `/Library/.test((document.querySelector("#main h1") || {}).textContent || "")`, panel: "#rail", content: "#main" },
  { key: "settings", go: `document.querySelector('#rail [data-act="settings"]').click()`,
    ready: `!!document.querySelector(".sx-nav a") && !!document.querySelector("#sxPage")`, panel: ".sx-nav", content: "#sxPage" },
  /* Settings is a screen tab; the catalog opens from the Library behind it, so the tab is closed first. */
  { key: "catalog", go: `(document.querySelector('[data-act="close-screen"][data-v="settings"]') || {click(){}}).click();
      setTimeout(() => { const a = document.querySelector('#rail [data-act="home"][data-v="library"]'); if (a) a.click();
        setTimeout(() => document.querySelector('#main [data-act="open"]').click(), 300); }, 300)`,
    ready: `!!document.querySelector('#rail a[data-v="cards"]') && document.querySelectorAll("#main table tr").length > 1`,
    panel: "#rail", content: "#main" },
  { key: "variables", go: `document.querySelector('#rail a[data-v="variables"]').click()`,
    ready: `!!document.querySelector("#main .vr-list") && !!document.querySelector("#main .vr-open")`,
    panel: "#main .vr-list", content: "#main .vr-open", part: true },
  { key: "import", go: `(document.querySelector('#discImport') || document.querySelector('#rail a[data-v="import"]')).click()`,
    ready: `/Import/.test((document.querySelector("#rail .grp") || {}).textContent || "")`, panel: "#rail", content: "#main" },
];

async function boot(browser, catalogs, opened) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: HEIGHT });
  await page.evaluateOnNewDocument((catalogs, opened) => {
    const base = {
      host: async () => ({ version: "0.1.0", tour: { offered: true, taken: true, at: 0 } }),
      projects: async () => ({ root: "C:/studio", projects: catalogs, sample: "" }),
      teams: async () => ({ teams: [{ id: "North quay", projects: [{ id: "harbour", dir: catalogs[0].dir, name: "" }],
        catalogs: ["harbour"], teammates: [
          /* Teammates as a working team has them, every column filled, one name long: the table's width is the claim. */
          { id: "ada", name: "Ada", admitted: true, kind: "desk", version: "2.0.0", lastHeard: "2026-11-15T09:12:00.000Z",
            statistics: true, catalog: { title: "Harbour lamps", rev: 12, behind: true } },
          { id: "bartholomew-front-desk", name: "Bartholomew Wiśniewski", admitted: true, kind: "studio", version: "2.0.0",
            lastHeard: "2026-11-14T17:40:00.000Z", catalog: { title: "Harbour lamps", rev: 12 } },
          { id: "cora", name: "Cora", admitted: false }] }] }),
      open: async () => opened,
      onMaximized: () => {}, onTrayGo: () => {}, onOpenDir: () => {}, onTask: () => {},
      onTeamMoved: () => {}, onRelayLapse: () => {}, onRelaySyncNote: () => {},
    };
    /* A call the screens make that this stub does not name answers nothing, as a shell with nothing to say would;
       a listener registers nothing. */
    window.STUDIO = new Proxy(base, {
      get(t, k) {
        if (k in t) return t[k];
        if (typeof k !== "string" || k === "then") return undefined;
        return /^on[A-Z]/.test(k) ? () => {} : async () => ({ error: null });
      },
    });
  }, catalogs, opened);
  page.on("pageerror", (e) => { if (process.env.RAIL_LEFT_DEBUG) process.stderr.write("pageerror " + e.message + "\n"); });
  await page.goto("file:///" + HTML_FILE.replace(/\\/g, "/"), { waitUntil: "load" });
  await page.waitForSelector("#rail a", { timeout: 8000 });
  await page.waitForFunction(() => !document.querySelector(".e-launch-veil"), { timeout: 10000 });
  return page;
}

async function measure(page, sc) {
  return page.evaluate((panelSel, contentSel) => {
    const p = document.querySelector(panelSel), c = document.querySelector(contentSel);
    if (!p || !c) return { missing: !p ? panelSel : contentSel };
    const pr = p.getBoundingClientRect(), cr = c.getBoundingClientRect(), cs = getComputedStyle(p);
    let spill = 0;
    p.querySelectorAll("a, .grp, label, button, span").forEach((e) => {
      const r = e.getBoundingClientRect();
      if (r.width > 0 && r.right > pr.right + 1) spill = Math.max(spill, Math.round(r.right - pr.right));
    });
    /* The content's own sideways run, and each table's past the box that holds it. */
    const box = c.closest("#main") || c;
    let wide = Math.max(0, box.scrollWidth - box.clientWidth);
    c.querySelectorAll("table").forEach((t) => {
      const holder = t.parentElement, tr = t.getBoundingClientRect(), hr = holder.getBoundingClientRect();
      if (tr.width > 0) wide = Math.max(wide, Math.round(tr.right - hr.right), holder.scrollWidth - holder.clientWidth);
    });
    return {
      wide,
      display: cs.display, pw: Math.round(pr.width), ph: Math.round(pr.height), pl: Math.round(pr.left),
      pr: Math.round(pr.right), pt: Math.round(pr.top), cl: Math.round(cr.left), ct: Math.round(cr.top),
      ch: Math.round(cr.height), spill,
      over: p.scrollHeight - p.clientHeight, oy: cs.overflowY,
    };
  }, sc.panel, sc.content);
}

async function main() {
  clearScratch(SCRATCH);
  const root = path.join(SCRATCH, "projects");
  fs.mkdirSync(root, { recursive: true });
  const made = await Studio.newProject(root, "Harbour lamps", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }]);
  const dir = made.dir;
  const shelf = (await Studio.addTag(dir, "shelf", { en: "Delivery", pl: "Dostawa" })).tag.id;
  for (const t of ["Courier costs", "Parcel lockers", "Returns window"]) await Studio.addCard(dir, shelf, t, t + " in Poland.");
  const opened = await wire(Studio.openProject(dir));
  const catalogs = [{ id: "harbour", name: "Harbour lamps", dir, rev: 0, counts: { cards: 3 }, langs: ["en", "pl"],
    changes: 0, checks: 0, opened: "2026-11-11T10:00:00.000Z", edited: "2026-11-11T10:00:00.000Z" }];
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

  let teamsAt = null;
  const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--hide-scrollbars", "--no-sandbox", "--allow-file-access-from-files"] });
  try {
    for (const w of WIDTHS) {
      const page = await boot(browser, catalogs, opened);
      await page.setViewport({ width: w, height: HEIGHT });
      await sleep(80);
      const seen = [];
      for (const sc of SCREENS) {
        let m;
        try {
          await page.evaluate(sc.go);
          await page.waitForFunction(sc.ready, { timeout: 8000 });
          await sleep(120);
          m = await measure(page, sc);
        } catch (e) { m = { missing: "could not reach: " + String(e && e.message || e).split("\n")[0] }; }
        const shown = !m.missing && m.display !== "none" && m.pw > 120;
        const left = shown && m.pr <= m.cl + 1;
        const beside = shown && Math.abs(m.pt - m.ct) <= 2 && (sc.part || m.ph >= 0.8 * m.ch);
        const inside = shown && m.spill === 0;
        const reach = shown && (m.over <= 1 || m.oy === "auto" || m.oy === "scroll");
        const flat = !m.missing && m.wide <= 1;
        if (sc.key === "teams" && w === MIN_W) teamsAt = await page.evaluate(() => ({
          teamCurrent: !!document.querySelector('#rail a[data-act="home"][data-v="team"][aria-current="page"]'),
          backs: Array.from(document.querySelectorAll("#screen button, #screen a"))
            .filter((e) => e.getClientRects().length && /Back to Overview/.test(e.textContent)).length,
          receives: Array.from(document.querySelectorAll('#main .team-receives b')).map((e) => e.textContent.trim()),
          openBtns: Array.from(document.querySelectorAll('#main .team-receives [data-act="open"]')).map((e) => e.textContent.trim()),
        }));
        seen.push({ key: sc.key, ok: shown && left && beside && inside && reach && flat, shown, left, beside, inside, reach, flat, m });
        if (SHOTS && (w === MIN_W || w === 1099)) {
          for (const theme of ["light", "dark"]) {
            await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
            await sleep(150);
            await page.screenshot({ path: path.join(SHOTS, w + "-" + sc.key + "-" + theme + ".png") });
          }
          await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
        }
      }
      const pick = (f) => seen.filter((s) => !s[f]).map((s) => ({ screen: s.key, m: s.m }));
      check(seen.every((s) => s.shown), "rl1 at " + w + " px every screen's side panel is shown", pick("shown"));
      check(seen.every((s) => s.left), "rl2 at " + w + " px every side panel stands left of its content", pick("left"));
      check(seen.every((s) => s.beside), "rl3 at " + w + " px every side panel stands beside its content, not above it", pick("beside"));
      check(seen.every((s) => s.inside), "rl4 at " + w + " px nothing in a side panel runs past its right edge", pick("inside"));
      check(seen.every((s) => s.flat), "rl7 at " + w + " px no screen's content runs sideways", pick("flat"));
      check(seen.every((s) => s.reach), "rl6 at " + w + " px every row of a side panel can be reached, the panel scrolling where it is taller than the window", pick("reach"));
      await page.close();
    }
  } finally {
    await browser.close();
    dropScratch(SCRATCH, "tests/rail-left.mjs");
  }
  check(!!teamsAt && teamsAt.teamCurrent && teamsAt.backs === 0, "rl8 on Team the home rail highlights Team and has no Back to Overview", teamsAt);
  check(!!teamsAt && teamsAt.receives.length === 1 && teamsAt.receives[0] === "Harbour lamps"
    && teamsAt.openBtns.length === 1 && teamsAt.openBtns[0] === "Open",
    "rl9 on Team What the team receives names the team's catalog, from the Library where the team's entry has no name", teamsAt);
  /* THE PLANTS, in a scratch copy: the work area's one column put back below 1100 turns rl2 red (the rail above the page),
     and the Teams table's 8px cells taken out turn rl7 red (the table past its pane at 900). */
  const alone = !!(process.env.RAIL_LEFT_ONLY || process.env.RAIL_LEFT_HTML);
  if (!alone) {
    copyPlants({
      root: ROOT, self: SELF, label: "rail-left", onlyVar: "RAIL_LEFT_ONLY", check, skip, timeout: 240000,
      plants: [{ mark: "rail-left", leg: "rl2", rel: "ui/index.html", line: ".va .work{grid-template-columns:1fr}" },
        /* the Teams table's cells back at 14px a side: its seven columns run past the pane at 900 */
        { mark: "teams-wrap", leg: "rl7", rel: "ui/index.html", line: "" }],
    });
  }
  const want = alone ? EXPECTED - 3 : EXPECTED;
  check(checks + skipped + 1 === want, "rl5 every leg ran: " + (checks + skipped + 1) + " of " + want);
  process.stdout.write("#counts checks=" + checks + " skipped=" + skipped + " failed=" + fails + " expected=" + want + "\n");
  process.stdout.write(fails ? "rail-left: " + fails + " of " + checks + " FAILED\n" : "rail-left: all " + checks + " checks hold\n");
  process.exit(fails ? 1 : 0);
}

main().catch((e) => { process.stderr.write(String(e && e.stack || e) + "\n"); process.exit(2); });
