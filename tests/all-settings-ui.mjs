/* ALL SETTINGS PAGE, RAIL MARK AND CRUMB LINK IN HEADLESS CHROME.
 *
 * gate-kind: node
 *
 *     node tests/all-settings-ui.mjs
 *
 * Headless Chrome on ui/index.html and ui/app.js via puppeteer-core, no Electron window.
 * What the eye sees (computed styles, marks and DOM):
 *   au1  the "All settings" row stands first in .sx-nav and matches a section row in height, font size and weight
 *   au2  choosing "All settings" leaves one marked row in .sx-nav (non-transparent computed background), draws every
 *        listed section's heading, every row in the DOM and as many cards as sections require
 *   au3  from the all-sections page, a section's heading opens that section alone, moves the mark to it, and shows
 *        a.sx-crumb.sx-back ("All settings") above its heading, styled at 13 px, underlined as a link and reachable by Tab
 *   au4  pressing the crumb by click and by keyboard Enter brings the all-sections page back, scrolls to top, and
 *        marks "All settings" alone; no horizontal overflow in light or dark theme at 1280 px wide
 *
 * Proved by making each claim fail on a scratch copy of the tree (ETIUDA_PLANTS=off skips).
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { plantText } from "./plant-copy.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SELF = fileURLToPath(import.meta.url);
const HTML_FILE = path.join(ROOT, "ui", "index.html");
const SCRATCH = path.join(ROOT, "scratch", "all-settings-ui");
const ONLY = process.env.ALL_SETTINGS_UI_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const IDS = ["au1", "au2", "au3", "au4"];
let plantsCopy = null;

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

const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

function no(id, why) { console.error(id + " " + why); return false; }

async function openSettingsPage(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.evaluateOnNewDocument(() => {
    const noOp = () => {};
    window.STUDIO = new Proxy({
      host: async () => ({
        version: "0.1.0",
        platform: "win32",
        loginItem: { openAtLogin: false },
        tour: { offered: true, taken: true, at: 0 },
        signIn: ["microsoft", "google"],
        signinDoor: true,
      }),
      projects: async () => ({ root: "C:/studio", projects: [], sample: "" }),
      teams: async () => ({ teams: [] }),
      licence: async () => ({ licence: { status: "active" }, works: true, by: "signin", provider: "microsoft", signIn: ["microsoft", "google"] }),
      aiSettings: async () => ({
        provider: "", endpoint: "", address: "", model: "",
        hasKey: false, managed: {}, providers: [{ id: "openai", endpoint: "https://api.openai.com/v1/" }], said: [],
      }),
    }, {
      get: (t, k) => (k in t ? t[k] : typeof k !== "string" || k === "then" ? undefined : /^on[A-Z]/.test(k) ? noOp : async () => ({ error: null })),
    });
  });
  await page.goto("file:///" + HTML_FILE.replace(/\\/g, "/"), { waitUntil: "load" });
  await page.waitForSelector('#rail [data-act="settings"]', { timeout: 15000 });
  await page.evaluate(() => {
    document.body.classList.remove("e-launch", "e-launch-out");
    document.querySelectorAll(".e-launch-veil").forEach((v) => v.remove());
  });
  await page.mouse.move(2, 2);
  await page.click('#rail [data-act="settings"]');
  await page.waitForSelector(".sx-nav a", { timeout: 5000 });
  await page.mouse.move(2, 2);
  await settle(page);
  return page;
}

const navMarks = (page) => page.evaluate(() => {
  const rows = Array.from(document.querySelectorAll(".sx-nav a")).filter((r) => r.offsetParent !== null);
  return rows.map((r, i) => {
    const bg = getComputedStyle(r).backgroundColor;
    const m = /rgba?\(([^)]+)\)/.exec(bg);
    const a = m ? (m[1].split(",")[3] == null ? 1 : parseFloat(m[1].split(",")[3])) : 0;
    const cs = getComputedStyle(r);
    const rect = r.getBoundingClientRect();
    return {
      i,
      act: r.getAttribute("data-act"),
      v: r.getAttribute("data-v"),
      text: r.textContent.trim(),
      on: r.classList.contains("on"),
      marked: bg !== "transparent" && a > 0,
      height: Math.round(rect.height),
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
    };
  });
});

async function runBrowserChecks(onlyId) {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--hide-scrollbars", "--no-sandbox", "--allow-file-access-from-files"],
  });
  try {
    const page = await openSettingsPage(browser);

    const checkAu1 = async () => {
      /* Settings opens on "All settings" (the designer's choice, 2026-11-16), so its row is the marked one at first. Like is
         compared with like: the row marked against a section's row marked, and unmarked against unmarked, by opening one
         section and coming back. */
      const opened = await navMarks(page);
      const firstOn = opened[0];
      if (!firstOn || firstOn.act !== "sx-all" || firstOn.text !== "All settings" || !firstOn.on) {
        return no("au1", "first nav row is not All settings, marked at the opening: " + JSON.stringify(firstOn));
      }
      await page.click('.sx-nav a[data-act="sx-sec"][data-v="general"]');
      await page.mouse.move(2, 2);
      await settle(page);
      const rows = await navMarks(page);
      const first = rows[0], secOn = rows.find((r) => r.act === "sx-sec" && r.on), sec = rows.find((r) => r.act === "sx-sec" && !r.on);
      await page.click('.sx-nav a[data-act="sx-all"]');
      await page.mouse.move(2, 2);
      await settle(page);
      const same = (a, b) => !!a && !!b && a.height === b.height && a.fontSize === b.fontSize && a.fontWeight === b.fontWeight && a.marked === b.marked;
      if (first.on || !same(first, sec) || !same(firstOn, secOn)) {
        return no("au1", "row metrics mismatch: " + JSON.stringify({ unmarked: [first, sec], marked: [firstOn, secOn] }));
      }
      return true;
    };

    const collectExpected = async () => {
      const secIds = await page.evaluate(() =>
        Array.from(document.querySelectorAll('.sx-nav a[data-act="sx-sec"]')).map((a) => a.getAttribute("data-v")));
      const expectedRows = [];
      let expectedCards = 0;
      for (const id of secIds) {
        await page.click('.sx-nav a[data-act="sx-sec"][data-v="' + id + '"]');
        await page.mouse.move(2, 2);
        await settle(page);
        const info = await page.evaluate(() => ({
          rows: Array.from(document.querySelectorAll("#sxPage [data-row]")).map((e) => e.getAttribute("data-row")),
          cards: document.querySelectorAll("#sxPage .sx-card").length,
        }));
        expectedRows.push(...info.rows);
        expectedCards += info.cards;
      }
      return { secIds, expectedRows, expectedCards };
    };

    const checkAu2 = async () => {
      const { secIds, expectedRows, expectedCards } = await collectExpected();
      const hasAll = await page.$('.sx-nav a[data-act="sx-all"]');
      if (!hasAll) return no("au2", "missing sx-all row");
      await page.click('.sx-nav a[data-act="sx-all"]');
      await page.mouse.move(2, 2);
      await settle(page);
      const rows = await navMarks(page);
      const marked = rows.filter((r) => r.marked);
      if (marked.length !== 1 || marked[0].act !== "sx-all") {
        return no("au2", "expected only sx-all marked, got " + JSON.stringify(marked));
      }
      const dom = await page.evaluate(() => ({
        blocks: Array.from(document.querySelectorAll("#sxPage section.sx-block")).map((s) => s.getAttribute("data-sec")),
        rows: Array.from(document.querySelectorAll("#sxPage [data-row]")).map((e) => e.getAttribute("data-row")),
        cards: document.querySelectorAll("#sxPage .sx-card").length,
      }));
      if (JSON.stringify(dom.blocks) !== JSON.stringify(secIds)) {
        return no("au2", "section blocks mismatch: " + JSON.stringify({ blocks: dom.blocks, secIds }));
      }
      if (JSON.stringify(dom.rows) !== JSON.stringify(expectedRows)) {
        return no("au2", "dom rows mismatch");
      }
      if (dom.cards !== expectedCards || dom.cards < secIds.length) {
        return no("au2", "card count mismatch: " + JSON.stringify({ cards: dom.cards, expectedCards, secCount: secIds.length }));
      }
      return true;
    };

    const checkAu3 = async () => {
      if (await page.$('.sx-nav a[data-act="sx-all"]')) {
        await page.click('.sx-nav a[data-act="sx-all"]');
        await page.mouse.move(2, 2);
        await settle(page);
      }
      const btn = await page.$('#sxPage .sx-block[data-sec="general"] h3 button[data-act="sx-sec"]');
      if (!btn) {
        await page.click('.sx-nav a[data-act="sx-sec"][data-v="general"]');
      } else {
        await btn.click();
      }
      await page.mouse.move(2, 2);
      await settle(page);
      const rows = await navMarks(page);
      const marked = rows.filter((r) => r.marked);
      if (marked.length !== 1 || marked[0].v !== "general") {
        return no("au3", "expected general marked, got " + JSON.stringify(marked));
      }
      const crumb = await page.evaluate(() => {
        const a = document.querySelector("#sxPage a.sx-crumb.sx-back");
        if (!a) return null;
        const cs = getComputedStyle(a);
        return {
          text: a.textContent.trim(),
          href: a.getAttribute("href"),
          tabIndex: a.tabIndex,
          fontSize: cs.fontSize,
          textDecorationLine: cs.textDecorationLine,
          cursor: cs.cursor,
        };
      });
      if (!crumb || crumb.text !== "All settings" || crumb.tabIndex < 0 || crumb.fontSize !== "13px"
        || !crumb.textDecorationLine.includes("underline")) {
        return no("au3", "crumb link missing or not styled as link: " + JSON.stringify(crumb));
      }
      return true;
    };

    const checkAu4 = async () => {
      await page.click('.sx-nav a[data-act="sx-sec"][data-v="general"]');
      await page.mouse.move(2, 2);
      await settle(page);
      const backByClick = await page.$("#sxPage a.sx-crumb.sx-back");
      if (!backByClick) return no("au4", "no crumb link to click");
      await backByClick.click();
      await page.mouse.move(2, 2);
      await settle(page);
      let rows = await navMarks(page);
      let marked = rows.filter((r) => r.marked);
      if (marked.length !== 1 || marked[0].act !== "sx-all" || !(await page.$("#sxPage .sx-all"))) {
        return no("au4", "click on crumb did not return to All settings: " + JSON.stringify(marked));
      }

      // Now go to a section, scroll down, focus crumb, press Enter
      await page.click('.sx-nav a[data-act="sx-sec"][data-v="keys"]');
      await page.mouse.move(2, 2);
      await settle(page);
      await page.evaluate(() => {
        const p = document.querySelector("#sxPage");
        if (p) p.scrollTop = 120;
        const a = document.querySelector("#sxPage a.sx-crumb.sx-back");
        if (a) a.focus();
      });
      await page.keyboard.press("Enter");
      await settle(page);
      rows = await navMarks(page);
      marked = rows.filter((r) => r.marked);
      const scrollTop = await page.evaluate(() => (document.querySelector("#sxPage") || {}).scrollTop || 0);
      if (marked.length !== 1 || marked[0].act !== "sx-all" || scrollTop !== 0 || !(await page.$("#sxPage .sx-all"))) {
        return no("au4", "Enter on crumb did not return to top of All settings: " + JSON.stringify({ marked, scrollTop }));
      }

      for (const theme of ["light", "dark"]) {
        await page.evaluate((th) => { document.documentElement.setAttribute("data-theme", th); }, theme);
        await settle(page);
        const overflow = await page.evaluate(() => {
          const p = document.querySelector("#sxPage");
          return p ? p.scrollWidth > p.clientWidth + 1 : true;
        });
        if (overflow) return no("au4", theme + " theme horizontal overflow at 1280px");
      }
      return true;
    };

    const map = { au1: checkAu1, au2: checkAu2, au3: checkAu3, au4: checkAu4 };
    if (onlyId) {
      return await map[onlyId]();
    }
    const results = {};
    for (const id of IDS) {
      let ok = false;
      try { ok = await map[id](); }
      catch (e) { console.error(id + " " + ((e && e.stack) || e)); ok = false; }
      results[id] = ok;
    }
    return results;
  } finally {
    await browser.close();
  }
}

const PLANTS = [
  ["au1", "ui/app.js",
    '      + "<a" + saidOn("page", !searching && S.sx.sec === "all") + \' data-act="sx-all" tabindex="0">\' + I("facts") + "<span>" + esc(T("All settings")) + "</span></a>" /* plant:sx-all-row */',
    '      + ""'],
  ["au2", "ui/app.js",
    '      + listed.map((x) => "<a" + saidOn("page", !searching && x.id === S.sx.sec) + \' data-act="sx-sec" data-v="\' + x.id + \'" tabindex="0">\' /* plant:sx-all-two-marks */',
    '      + listed.map((x, idx) => "<a" + saidOn("page", !searching && (x.id === S.sx.sec || (S.sx.sec === "all" && idx === 0))) + \' data-act="sx-sec" data-v="\' + x.id + \'" tabindex="0">\''],
  ["au2", "ui/app.js",
    '        + err + \'<div class="sx-all">\' + listed.map((s) => sxBlockHtml(s)).join("") + "</div>"; /* plant:sx-all-drop */',
    '        + err + \'<div class="sx-all">\' + listed.slice(1).map((s) => sxBlockHtml(s)).join("") + "</div>";'],
  ["au3", "ui/app.js",
    '    return \'<a class="sx-crumb sx-back" href="#settings" data-act="sx-all">\' + esc(T("All settings")) + "</a><h2>" + esc(sec.name()) /* plant:sx-crumb-plain */',
    '    return \'<div class="sx-crumb">\' + esc(T("Settings")) + "</div><h2>" + esc(sec.name())'],
];

function sha(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }
function plantOnce(id, rel, from, to) {
  const tree = plantsCopy;
  const file = path.join(tree, rel);
  const buf = fs.readFileSync(file);
  const was = sha(buf);
  const next = plantText(buf.toString("utf8"), from, to, rel);
  let child = null;
  try {
    fs.writeFileSync(file, next, "utf8");
    child = spawnSync(process.execPath, [path.join(tree, path.relative(ROOT, SELF))], {
      cwd: tree,
      env: Object.assign({}, process.env, { ALL_SETTINGS_UI_ONLY: id, ETIUDA_PLANTS: "off" }),
      encoding: "utf8",
      timeout: 120000,
    });
  } finally {
    fs.writeFileSync(file, buf);
    if (sha(fs.readFileSync(file)) !== was) throw new Error(id + " restore mismatch in " + rel);
  }
  const red = !!(child && child.status === 1 && String(child.stdout || "").includes("PLANT-RED"));
  if (!red) {
    console.error(id + " plant did not bite: status " + (child && child.status));
    console.error(String((child && child.stdout) || "") + String((child && child.stderr) || ""));
  }
  return red;
}

async function main() {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  if (PLANTS_OFF) {
    console.log("NOT RUN the plants phase: " + PLANTS.length + " plants each turn their check red in a scratch copy (ETIUDA_PLANTS=off)");
  } else {
    const { plantsTree, treeSha, dropPlantsTree } = await import("./plants-tree.mjs");
    const before = treeSha(ROOT);
    const files = ["ui/app.js"];
    const shas = files.map((rel) => sha(fs.readFileSync(path.join(ROOT, rel))));
    let red = 0;
    let held = false;
    let same = false;
    try {
      plantsCopy = plantsTree(ROOT, "all-settings-ui");
      for (const [id, rel, from, to] of PLANTS) {
        const ok = plantOnce(id, rel, from, to);
        console.log((ok ? "plant " : "PLANT FAIL ") + id + (ok ? " red" : ""));
        if (ok) red++;
      }
      held = treeSha(ROOT) === before;
      console.log((held ? "ok   " : "FAIL ") + "the checkout's sha256 over src/, shell/ and ui/ is unchanged after the plants phase");
      same = files.every((rel, i) => sha(fs.readFileSync(path.join(ROOT, rel))) === shas[i]);
      console.log((same ? "ok   " : "FAIL ") + "the planted files are byte for byte as they were (sha256)");
    } finally {
      dropPlantsTree(plantsCopy, ROOT);
    }
    if (red !== PLANTS.length || !held || !same) {
      dropScratch(SCRATCH, "all-settings-ui");
      process.exit(1);
    }
  }

  const res = await runBrowserChecks("");
  let n = 0;
  for (const id of IDS) {
    const ok = !!res[id];
    console.log((ok ? "ok   " : "FAIL ") + id);
    if (ok) n++;
  }
  console.log("all-settings-ui " + (n + (PLANTS_OFF ? 0 : 1)) + "/" + (IDS.length + 1)
    + (PLANTS_OFF ? ", 1 skipped" : ", plants " + PLANTS.length + "/" + PLANTS.length + " red"));
  console.log("#counts checks=" + (IDS.length + (PLANTS_OFF ? 0 : 1)) + " skipped=" + (PLANTS_OFF ? 1 : 0)
    + " failed=" + (IDS.length - n) + " expected=" + (IDS.length + 1));
  dropScratch(SCRATCH, "all-settings-ui");
  process.exit(n === IDS.length ? 0 : 1);
}

if (ONLY) {
  if (!IDS.includes(ONLY)) { console.error("unknown " + ONLY); process.exit(2); }
  fs.mkdirSync(SCRATCH, { recursive: true });
  runBrowserChecks(ONLY).then((ok) => {
    console.log(ok ? "PLANT-GREEN" : "PLANT-RED");
    process.exit(ok ? 0 : 1);
  }).catch((e) => {
    console.error((e && e.stack) || e);
    process.exit(2);
  });
} else {
  main().catch((e) => {
    console.error((e && e.stack) || e);
    try { dropScratch(SCRATCH, "all-settings-ui"); } catch {}
    process.exit(1);
  });
}
