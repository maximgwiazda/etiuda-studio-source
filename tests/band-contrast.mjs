/* WHITE ON THE BAND CLEARS 4.5:1 WITHOUT THE MATERIAL (the product designer, 2026-11-15, after the test architect's read: "with
 * no material, the LIGHT theme's band is a deeper mix that clears 4.5 to 1 with room: the band's colour at 78 per cent over the
 * page colour [...] Studio follows, the same rule: #7a57b8 (white 5.41 to 1) [...] WITH the material nothing changes: 62 per cent").
 *
 *     node tests/band-contrast.mjs            BAND_UI=<a copy of ui/> reads that copy instead
 *
 * Headless Chrome on ui/index.html with window.STUDIO stubbed, no Electron window. The painted colour is the band's computed
 * background laid over the page's own (section.screen) as the browser composites it; the ratio is WCAG's, against white.
 *   bc1 light, no material: the band is the violet at 78 per cent over the page (#7a57b8), white on it at 4.5:1 or more
 *   bc2 dark, no material: white on the band at 4.5:1 or more, the 62 per cent mix as built
 *   bc3 with the material (body.s-backdrop), both themes: the band is the violet at 62 per cent over the material, unchanged
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const UI = process.env.BAND_UI ? path.resolve(process.env.BAND_UI) : path.join(ROOT, "ui");
const URL_ = "file:///" + path.join(UI, "index.html").replace(/\\/g, "/");
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
const lum = (c) => c.slice(0, 3).map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
  .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
const whiteOn = (c) => 1.05 / (lum(c) + 0.05);
const near = (a, b) => a && b.every((v, i) => Math.abs(a[i] - v) <= 1);

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
    const read = (theme, backdrop) => page.evaluate((theme, backdrop) => {
      document.documentElement.setAttribute("data-theme", theme);
      document.body.classList.toggle("s-backdrop", backdrop);
      const cx = Object.assign(document.createElement("canvas"), { width: 1, height: 1 }).getContext("2d", { willReadFrequently: true });
      const px = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = "#000"; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], Math.round(d[3] / 255 * 100) / 100]; };
      const band = document.querySelector(".band"), screen = band.closest("section.screen") || document.body;
      const bg = px(getComputedStyle(band).backgroundColor), under = px(getComputedStyle(screen).backgroundColor);
      /* The band as painted over the page's own ground (the material, under s-backdrop, is not the page's). */
      const painted = bg.slice(0, 3).map((v, i) => Math.round(v * bg[3] + under[i] * (1 - bg[3])));
      return { bg, under, painted };
    }, theme, backdrop);
    const light = await read("light", false), dark = await read("dark", false);
    const lightM = await read("light", true), darkM = await read("dark", true);
    check(near(light.painted, [122, 87, 184]) && whiteOn(light.painted) >= 4.5,
      "bc1 light, no material: the band is the violet at 78 per cent over the page, white on it at " + whiteOn(light.painted).toFixed(2) + ":1", light);
    check(whiteOn(dark.painted) >= 4.5, "bc2 dark, no material: white on the band at " + whiteOn(dark.painted).toFixed(2) + ":1", dark);
    check(near(lightM.bg, [87, 41, 166]) && lightM.bg[3] === 0.62 && near(darkM.bg, [87, 41, 166]) && darkM.bg[3] === 0.62,
      "bc3 with the material, both themes: the band is the violet at 62 per cent, unchanged", { lightM, darkM });
  } finally {
    await Promise.race([browser.close(), new Promise((r) => setTimeout(r, 10000))]);
  }
  process.stdout.write("#counts checks=" + checks + " failures=" + fails + "\n");
  process.exit(fails ? 1 : 0);
}

main().catch((err) => { process.stderr.write(String((err && err.stack) || err) + "\n"); process.exit(2); });
