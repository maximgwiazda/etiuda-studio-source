/* NO DOT CROSSES THE PROPOSALS LIST'S WORDS BESIDE A REVIEW (the product designer's dots round, 2026-11-15).
 *
 *     node tests/proposals-dots.mjs
 *
 * The work area's dots stop at a word through the build's patch in ui/index.html (board 982, finding 13): each listed kind of
 * text on the dotted page stands on the page's own ground, with a 3 px spread, put on by the pass in ui/app.js. On the Proposals screen with a file open, the list
 * beside the review says its hint and its folder path as .rv-note, which the list did not name, so in the light theme dots
 * crossed both (the designer found them by a scan of the built page). Headless Chrome on ui/index.html with a stub
 * window.STUDIO; the aside is the page's own rvAsideHtml (made in tests/page-stand-in.mjs from ui/app.js), set into #main
 * inside paintProposal's own two columns, and what the eye would see is read as the computed ground under each text:
 *   pd1 in the light theme, the hint and the folder path each stand on the page's ground, opaque, with the hug's 3 px spread
 *   pd2 the same in the dark theme
 *   pd3 CONTROL: the review's own heading and lede beside them, already on the list, stand on the same ground
 * THE PLANT (tests/plant-copy.mjs): the line marked plant:dots-hug in ui/index.html is put back, in a scratch copy, to the
 * list without .rv-note, and the copy's run must print FAIL pd1.
 * What it cannot see: a dotted text of any other class (the designer's variants are the wider answer, Max's to choose).
 *
 * Node only, headless Chrome via puppeteer-core, no Electron window.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { copyPlants } from "./plant-copy.mjs";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const HTML_FILE = path.join(ROOT, "ui", "index.html");
const ONLY = process.env.PROPOSALS_DOTS_ONLY || "";
const EXPECTED = 3 + 2;

const executablePath = [process.env.ETIUDA_CHROME, "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe", "/usr/bin/google-chrome", "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].filter(Boolean).find((p) => fs.existsSync(p));
if (!executablePath) { process.stderr.write("No Chrome browser found to drive\n"); process.exit(1); }

let checks = 0, fails = 0, skipped = 0;
function skip(line) { skipped++; process.stdout.write("  SKIP  " + line + "\n"); }
function check(ok, line, detail) {
  checks++;
  process.stdout.write((ok ? "  ok   " : "  FAIL ") + line + (detail ? ": " + JSON.stringify(detail) : "") + "\n");
  if (!ok) fails++;
}
const want = (id) => !ONLY || ONLY === id;

/* The aside as the page makes it: two files of a queue, the first open, and an inbox path long enough to wrap. */
async function asideMarkup() {
  const { loadPage } = await import("./page-stand-in.mjs");
  const { page } = loadPage({ api: {}, uiLang: "en" });
  page.S.rv = page.rvState({ inbox: "C:\\Users\\lead\\Studio\\projects\\Harbour lamps\\inbox",
    proposals: [{ name: "desk-4.ec", file: "C:\\inbox\\desk-4.ec", ok: true, pending: 4 }, { name: "desk-7.ec", file: "C:\\inbox\\desk-7.ec", ok: true, pending: 1 }] });
  page.S.rv.open = { file: "C:\\inbox\\desk-4.ec", name: "desk-4.ec" };
  return page.rvAsideHtml();
}

async function main() {
  const aside = await asideMarkup();
  const main = '<div class="pad rv-in"><div class="rv-main"><h1>desk-4.ec</h1><p class="lede">4 changes in the proposal. 0 decided here so far.</p></div>'
    + aside + "</div>";
  const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--hide-scrollbars", "--no-sandbox", "--allow-file-access-from-files"] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.evaluateOnNewDocument(() => {
      const base = { host: async () => ({ version: "0.1.0", tour: { offered: true, taken: true, at: 0 } }),
        projects: async () => ({ root: "C:/studio", projects: [], sample: "" }) };
      window.STUDIO = new Proxy(base, { get(t, k) {
        if (k in t) return t[k];
        if (typeof k !== "string" || k === "then") return undefined;
        return /^on[A-Z]/.test(k) ? () => {} : async () => ({ error: null });
      } });
    });
    await page.goto("file:///" + HTML_FILE.replace(/\\/g, "/"), { waitUntil: "load" });
    await page.waitForSelector("#main", { timeout: 8000 });
    await page.waitForFunction(() => !document.querySelector(".e-launch-veil"), { timeout: 10000 }).catch(() => {});
    /* The ground under each text, in `theme`: its own background against the page's --bg, and its spread. */
    const read = (theme) => page.evaluate(async (html, t) => {
      document.documentElement.setAttribute("data-theme", t);
      const m = document.querySelector("#main");
      m.innerHTML = html;
      /* the page's own pass (ui/app.js dgPass) puts each text's words into its inline ground in the frame after the write */
      await new Promise((r) => setTimeout(r, 300));
      const probe = document.createElement("div");
      probe.style.background = "var(--bg)";
      document.body.appendChild(probe);
      const ground = getComputedStyle(probe).backgroundColor;
      probe.remove();
      const dotted = getComputedStyle(m).backgroundImage.indexOf("radial-gradient") >= 0;
      const of = (el0) => { const el = el0.querySelector(".dg-hug") || el0, cs = getComputedStyle(el);
        return { text: el0.textContent.slice(0, 40), bg: cs.backgroundColor, onGround: cs.backgroundColor === ground, spread: /\b3px\b/.test(cs.boxShadow) }; };
      return { ground, dotted, notes: Array.from(m.querySelectorAll(".rv-aside .rv-note")).map(of),
        control: [m.querySelector(".rv-main h1"), m.querySelector(".rv-main .lede")].filter(Boolean).map(of) };
    }, main, theme);
    const light = await read("light"), dark = await read("dark");
    const stands = (r) => r.dotted && r.notes.length === 2 && r.notes.every((n) => n.onGround && n.spread);
    if (want("pd1")) check(stands(light), "pd1 in the light theme the Proposals list's hint and folder path, beside a review, each stand on the page's ground with the hug's 3 px spread, so no dot crosses them", light);
    if (want("pd2")) check(stands(dark), "pd2 the same in the dark theme", dark);
    if (want("pd3")) check(light.control.length === 2 && light.control.every((n) => n.onGround && n.spread),
      "pd3 CONTROL: the review's heading and lede beside them, on the list already, stand on the same ground", light.control);
  } finally { await browser.close(); }

  /* The plant proof is tests/plant-copy.mjs's, which skips itself and counts the skip when plants are off; said here too. */
  if (!ONLY && process.env.ETIUDA_PLANTS === "off") process.stdout.write("NOT RUN plant:dots-hug (ETIUDA_PLANTS=off)\n");
  if (!ONLY) copyPlants({ root: ROOT, self: SELF, label: "proposals-dots", onlyVar: "PROPOSALS_DOTS_ONLY", check, skip, timeout: 120000,
    plants: [{ mark: "dots-hug", leg: "pd1", rel: "ui/index.html",
      line: ".dg-hug{display:inline;background:transparent;box-shadow:none; /* plant:dots-hug */" }] });
  const expected = ONLY ? 1 : EXPECTED;
  process.stdout.write("#counts checks=" + checks + " skipped=" + skipped + " failed=" + fails + " expected=" + expected + "\n");
  if (checks + skipped !== expected) { process.stdout.write("FAIL the run made " + (checks + skipped) + " of " + expected + " checks\n"); process.exit(1); }
  process.stdout.write(fails ? "proposals-dots: " + fails + " of " + checks + " FAILED\n" : "proposals-dots: all " + checks + " checks hold\n");
  process.exit(fails ? 1 : 0);
}
main().catch((e) => { process.stderr.write(String(e && e.stack || e) + "\n"); process.exit(2); });
