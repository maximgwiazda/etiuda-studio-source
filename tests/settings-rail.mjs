/* Visual language alignment between Settings rail and the work rail (Overview), finding 15a.
 *
 *     node tests/settings-rail.mjs
 *
 * Headless Chrome on ui/index.html and ui/app.js.
 * What the eye sees (computed styles and dimensions):
 *   15a1 at 1280 px window width, Settings rail and Overview rail have the same width
 *   15a2 at 1280 px window width, a row in Settings rail and a row in Overview rail have the same height
 *   15a3 at 1280 px window width, a row in Settings rail and a row in Overview rail have the same font size and weight
 *   15a4 at 1600 px window width, Settings rail and Overview rail have the same width
 *   15a5 at 1600 px window width, a row in Settings rail and a row in Overview rail have the same height
 *   15a6 at 1600 px window width, a row in Settings rail and a row in Overview rail have the same font size and weight
 *   15a7 Settings rail padding is 10px 8px matching Overview rail
 *   15a8 Settings rail title is a group head in the work rail's style and the search field side margin is 2px
 *   15a9 Maintenance row at the foot has the same row height and font size
 *
 * Node only, headless Chrome via puppeteer-core, no Electron window.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const HTML_FILE = path.join(ROOT, "ui", "index.html");

const CHROME_PATHS = [
  process.env.ETIUDA_CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

const executablePath = CHROME_PATHS.find(p => fs.existsSync(p));
if (!executablePath) {
  process.stderr.write("No Chrome browser found to drive\n");
  process.exit(1);
}

let checks = 0, fails = 0;
function check(ok, line, detail) {
  checks++;
  if (ok) {
    process.stdout.write("  ok   " + line + "\n");
  } else {
    fails++;
    process.stdout.write("  FAIL " + line + (detail ? ": " + JSON.stringify(detail) : "") + "\n");
  }
}

async function inspectAt(browser, width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900 });
  await page.evaluateOnNewDocument(() => {
    window.STUDIO = {
      host: async () => ({ version: "0.1.0" }),
      projects: async () => [],
      onMaximized: () => {},
      onTrayGo: () => {},
      onOpenDir: () => {},
      onTask: () => {},
      onTeamMoved: () => {},
      onRelayLapse: () => {},
      onRelaySyncNote: () => {},
    };
  });

  const url = "file:///" + HTML_FILE.replace(/\\/g, "/");
  await page.goto(url, { waitUntil: "load" });
  await page.waitForSelector("#rail a", { timeout: 5000 });

  const overview = await page.evaluate(() => {
    const rail = document.querySelector("#rail");
    const rRect = rail ? rail.getBoundingClientRect() : {};
    const rCs = rail ? getComputedStyle(rail) : {};
    /* The SELECTED home row, the same thing the Settings sample takes (its selected row): the row the page marks "on"
       (saidOn), falling back to Overview's own row. The rail's first row is not it since Team sits first, unselected. */
    const row = document.querySelector("#rail a.on") || document.querySelector('#rail a[data-act="home"][data-v="overview"]');
    const rowRect = row ? row.getBoundingClientRect() : {};
    const rowCs = row ? getComputedStyle(row) : {};
    return {
      railWidth: Math.round(rRect.width || 0),
      railPadding: rCs.padding || "",
      rowHeight: Math.round(rowRect.height || 0),
      fontSize: rowCs.fontSize || "",
      fontWeight: rowCs.fontWeight || "",
    };
  });

  // Switch to Settings tab
  await page.evaluate(() => {
    const btn = document.querySelector('[data-act="settings"]');
    if (btn) btn.click();
  });
  await page.waitForSelector(".sx-nav a", { timeout: 5000 });

  const settings = await page.evaluate(() => {
    const nav = document.querySelector(".sx-nav");
    const nRect = nav ? nav.getBoundingClientRect() : {};
    const nCs = nav ? getComputedStyle(nav) : {};
    const row = document.querySelector('.sx-nav a.on') || document.querySelector(".sx-nav a");
    const rowRect = row ? row.getBoundingClientRect() : {};
    const rowCs = row ? getComputedStyle(row) : {};
    const maint = document.querySelector('.sx-foot a');
    const mRect = maint ? maint.getBoundingClientRect() : {};
    const mCs = maint ? getComputedStyle(maint) : {};
    const h1 = document.querySelector(".sx-nav h1");
    const grp = document.querySelector(".sx-nav .grp");
    const grpCs = grp ? getComputedStyle(grp) : null;
    const search = document.querySelector(".sx-search");
    const searchCs = search ? getComputedStyle(search) : {};
    return {
      railWidth: Math.round(nRect.width || 0),
      railPadding: nCs.padding || "",
      rowHeight: Math.round(rowRect.height || 0),
      fontSize: rowCs.fontSize || "",
      fontWeight: rowCs.fontWeight || "",
      maintHeight: Math.round(mRect.height || 0),
      maintFontSize: mCs.fontSize || "",
      hasDisplayH1: !!h1,
      groupHeadText: grp ? grp.textContent.trim() : "",
      groupHeadStyle: grpCs ? {
        fontSize: grpCs.fontSize,
        textTransform: grpCs.textTransform,
        fontWeight: grpCs.fontWeight,
      } : null,
      searchMarginLeft: searchCs.marginLeft || "",
      searchMarginRight: searchCs.marginRight || "",
    };
  });

  await page.close();
  return { overview, settings };
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--hide-scrollbars", "--no-sandbox"],
  });

  try {
    const at1280 = await inspectAt(browser, 1280);
    check(at1280.settings.railWidth === at1280.overview.railWidth && at1280.settings.railWidth === 232,
      "15a1 at 1280 px window width, Settings rail and Overview rail have the same width",
      { settings: at1280.settings.railWidth, overview: at1280.overview.railWidth, expected: 232 });
    check(at1280.settings.rowHeight === at1280.overview.rowHeight,
      "15a2 at 1280 px window width, a row in Settings rail and a row in Overview rail have the same height",
      { settings: at1280.settings.rowHeight, overview: at1280.overview.rowHeight });
    check(at1280.settings.fontSize === at1280.overview.fontSize && at1280.settings.fontWeight === at1280.overview.fontWeight,
      "15a3 at 1280 px window width, a row in Settings rail and a row in Overview rail have the same font size and weight",
      { settings: { size: at1280.settings.fontSize, weight: at1280.settings.fontWeight },
        overview: { size: at1280.overview.fontSize, weight: at1280.overview.fontWeight } });

    const at1600 = await inspectAt(browser, 1600);
    check(at1600.settings.railWidth === at1600.overview.railWidth && at1600.settings.railWidth === 264,
      "15a4 at 1600 px window width, Settings rail and Overview rail have the same width",
      { settings: at1600.settings.railWidth, overview: at1600.overview.railWidth, expected: 264 });
    check(at1600.settings.rowHeight === at1600.overview.rowHeight,
      "15a5 at 1600 px window width, a row in Settings rail and a row in Overview rail have the same height",
      { settings: at1600.settings.rowHeight, overview: at1600.overview.rowHeight });
    check(at1600.settings.fontSize === at1600.overview.fontSize && at1600.settings.fontWeight === at1600.overview.fontWeight,
      "15a6 at 1600 px window width, a row in Settings rail and a row in Overview rail have the same font size and weight",
      { settings: { size: at1600.settings.fontSize, weight: at1600.settings.fontWeight },
        overview: { size: at1600.overview.fontSize, weight: at1600.overview.fontWeight } });

    check(at1280.settings.railPadding === "10px 8px" && at1280.settings.railPadding === at1280.overview.railPadding,
      "15a7 Settings rail padding is 10px 8px matching Overview rail",
      { settings: at1280.settings.railPadding, overview: at1280.overview.railPadding });

    check(!at1280.settings.hasDisplayH1 && at1280.settings.groupHeadText === "Settings" &&
          at1280.settings.searchMarginLeft === "2px" && at1280.settings.searchMarginRight === "2px",
      "15a8 Settings rail title is a group head in the work rail's style and the search field side margin is 2px",
      { hasH1: at1280.settings.hasDisplayH1, grpText: at1280.settings.groupHeadText,
        marginLeft: at1280.settings.searchMarginLeft, marginRight: at1280.settings.searchMarginRight });

    check(at1280.settings.maintHeight === at1280.overview.rowHeight && at1280.settings.maintFontSize === "13.5px",
      "15a9 Maintenance row at the foot has the same row height and font size",
      { height: at1280.settings.maintHeight, expectedHeight: at1280.overview.rowHeight,
        fontSize: at1280.settings.maintFontSize });

  } finally {
    await browser.close();
  }

  process.stdout.write("#counts checks=" + checks + " failures=" + fails + "\n");
  process.exit(fails ? 1 : 0);
}

main().catch(err => {
  process.stderr.write(String(err && err.stack || err) + "\n");
  process.exit(2);
});
