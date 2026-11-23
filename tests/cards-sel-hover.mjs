/* A SELECTED CARD ROW UNDER THE CURSOR KEEPS ITS THEME'S SELECTED LOOK (Maxim, board 1019 (8): in dark mode a selected card
 * under the cursor turned high-contrast white and unreadable).
 *
 *     node tests/cards-sel-hover.mjs
 *
 * Headless Chrome on ui/index.html with window.STUDIO stubbed; a table of the Cards rows' own classes is put in the page and the
 * computed background read with the pointer on the selected row.
 *   cdh1 dark: a selected row under the pointer is dark (luminance under 0.1), the same as the selected row at rest
 *   cdh2 light: a selected row under the pointer is #eef1f6, unchanged
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const UI = path.join(path.resolve(HERE, ".."), "ui");
const URL_ = "file:///" + path.join(UI, "index.html").split(path.sep).join("/");
const executablePath = [process.env.ETIUDA_CHROME, "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe", "/usr/bin/google-chrome", "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].filter(Boolean).find((p) => fs.existsSync(p));
if (!executablePath) { process.stderr.write("No Chrome browser found to drive\n"); process.exit(1); }

let checks = 0, fails = 0;
function check(ok, line, detail) {
  checks++;
  if (!ok) fails++;
  process.stdout.write((ok ? "  ok   " : "  FAIL ") + line + (!ok && detail !== undefined ? ": " + JSON.stringify(detail) : "") + "\n");
}
const lum = (c) => c.map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
  .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);

async function main() {
  const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--hide-scrollbars", "--no-sandbox"] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 860 });
    await page.evaluateOnNewDocument(() => {
      window.STUDIO = { host: async () => ({ version: "0.1.0", tour: { offered: true, taken: false, at: 0 } }),
        projects: async () => ({ root: "C:/studio", projects: [], sample: "" }),
        onMaximized: () => {}, onTrayGo: () => {}, onOpenDir: () => {}, onTask: () => {}, onTeamMoved: () => {},
        onRelayLapse: () => {}, onRelaySyncNote: () => {} };
    });
    await page.goto(URL_, { waitUntil: "load" });
    await page.waitForSelector(".band", { timeout: 5000 });
    await page.evaluate(() => {
      const t = document.createElement("table");
      t.id = "cdhT"; t.style.cssText = "position:fixed;left:40px;top:120px;z-index:99999;background:inherit";
      t.innerHTML = '<tbody><tr class="pick"><td>One</td></tr><tr class="pick sel" id="cdhSel"><td>Two</td></tr></tbody>';
      document.body.appendChild(t);
    });
    const read = async (theme, hover) => {
      await page.evaluate((th) => document.documentElement.setAttribute("data-theme", th), theme);
      if (hover) await page.hover("#cdhSel td"); else await page.mouse.move(900, 700);
      return page.evaluate(() => {
        const cx = Object.assign(document.createElement("canvas"), { width: 1, height: 1 }).getContext("2d", { willReadFrequently: true });
        cx.fillStyle = getComputedStyle(document.querySelector("#cdhSel td")).backgroundColor; cx.fillRect(0, 0, 1, 1);
        return Array.from(cx.getImageData(0, 0, 1, 1).data.slice(0, 3));
      });
    };
    const dRest = await read("dark", false), dHover = await read("dark", true);
    check(lum(dHover) < 0.1 && dHover.join() === dRest.join(), "cdh1 dark: a selected row under the pointer is dark and as at rest", { dRest, dHover });
    const lHover = await read("light", true);
    check(lHover.join() === "238,241,246", "cdh2 light: a selected row under the pointer is #eef1f6, unchanged", lHover);
  } finally {
    await Promise.race([browser.close(), new Promise((r) => setTimeout(r, 10000))]);
  }
  process.stdout.write("#counts checks=" + checks + " failures=" + fails + "\n");
  process.exit(fails ? 1 : 0);
}
main().catch((err) => { process.stderr.write(String((err && err.stack) || err) + "\n"); process.exit(2); });
