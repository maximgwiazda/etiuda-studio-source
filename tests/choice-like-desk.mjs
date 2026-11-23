/* A CHOICE READS AS THE DESK'S DOES (the product designer's in-line sheet 04, Max 2026-11-15: "As for 15 choices - I agree
 * with all"). Two of her rows, in her words: which choice is in force, "the chosen part filled in the accent", because "at a
 * glance the filled part cannot be misread; Studio's underline asks for a second look, most of all on On / Off"; and the
 * order of On and Off, "One order in both, the desk's (Off, then On); that the two differ is the fault."
 *
 *     node tests/choice-like-desk.mjs
 *
 * Headless Chrome on ui/index.html and ui/app.js, no Electron window. What the eye sees, read from computed style:
 *   c1  in every section of Settings, in both themes and both languages, the chosen part of every segmented choice is filled
 *       with Studio's accent (--mark-fill, #5729a6 light, #6d3fc4 dark) and lettered in white, with no underline; an unchosen part has no fill
 *   c2  the white lettering on that fill clears 4.5:1, computed from the two painted colours
 *   c3  under the pointer the chosen part keeps its white lettering (the desk's: hover never recolours the chosen face)
 *   c4  every On / Off pair Settings shows reads Off, then On, in English and in Polish
 *   c5  a segmented choice anywhere in the page's content takes the same fill: one placed in a pane's row, in the cards
 *       table's view bar, as the statistics' view switch, and the publish note's edition switch
 *   c6  in the source, every segment written with both On and Off names Off first, so a screen this leg does not drive
 *       (a team's admission, for one) cannot carry the old order
 * Each count is printed and held to a floor, so a selector that matches nothing cannot read as a pass.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const HTML_FILE = path.join(ROOT, "ui", "index.html");
const APP_FILE = path.join(ROOT, "ui", "app.js");

/* The fill per theme: #5729a6 light, #6d3fc4 dark (the dark bubble's violet, Max 2026-11-15: "I prefer option B."). */
const FILLS = { light: "rgb(87, 41, 166)", dark: "rgb(109, 63, 196)" }, FILL = FILLS.light, WHITE = "rgb(255, 255, 255)", CLEAR = "rgba(0, 0, 0, 0)";
const WORDS = { en: { off: "Off", on: "On" }, pl: { off: "Wyłączone", on: "Włączone" } };

const CHROME_PATHS = [
  process.env.ETIUDA_CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

let checks = 0, fails = 0;
function check(ok, line, detail) {
  checks++;
  if (ok) process.stdout.write("  ok   " + line + "\n");
  else { fails++; process.stdout.write("  FAIL " + line + (detail ? ": " + JSON.stringify(detail).slice(0, 900) : "") + "\n"); }
}

/* c6 first: the source alone, so it runs where no browser does. A line that names both words is one segment's items. */
{
  const src = fs.readFileSync(APP_FILE, "utf8").split(/\r?\n/);
  const pairs = [], wrong = [];
  src.forEach((l, i) => {
    const on = l.indexOf('T("On")'), off = l.indexOf('T("Off")');
    if (on < 0 || off < 0) return;
    pairs.push(i + 1);
    if (on < off) wrong.push(i + 1 + ": " + l.trim().slice(0, 120));
  });
  check(pairs.length >= 7 && wrong.length === 0,
    "c6 every one of the " + pairs.length + " segments ui/app.js writes with both On and Off names Off first (floor 7)", wrong);
}

const executablePath = CHROME_PATHS.find(p => fs.existsSync(p));
if (!executablePath) {
  process.stdout.write("  FAIL no Chrome browser found to drive\n");
  process.exit(1);
}

const W = (ms) => new Promise((r) => setTimeout(r, ms));
const lum = (rgb) => {
  const [r, g, b] = (String(rgb).match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number).map((v) => {
    const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

/* No userDataDir: puppeteer's own temporary profile goes with the browser, where a named one would stay behind. */
const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--hide-scrollbars", "--allow-file-access-from-files"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  await page.evaluateOnNewDocument(() => {
    const no = () => {};
    window.STUDIO = new Proxy({
      host: async () => ({ version: "0.1.0", platform: "win32", loginItem: { openAtLogin: false }, tour: { offered: true, taken: true, at: 0 } }),
      projects: async () => ({ root: "C:/studio", projects: [], sample: "" }),
      teams: async () => ({ teams: [] }),
    }, { get: (t, k) => (k in t ? t[k] : typeof k !== "string" || k === "then" ? undefined : /^on[A-Z]/.test(k) ? no : async () => ({ error: null })) });
  });
  await page.goto("file:///" + HTML_FILE.replace(/\\/g, "/"), { waitUntil: "load" });
  await page.waitForSelector('#rail [data-act="settings"]', { timeout: 15000 });
  await page.evaluate(() => { document.body.classList.remove("e-launch", "e-launch-out"); document.querySelectorAll(".e-launch-veil").forEach((v) => v.remove()); });
  const press = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (e) e.click(); return !!e; }, sel);
  await press('#rail [data-act="settings"]'); await W(500);

  /* Every segmented choice in the content, read in every Settings section: its parts' words, fills, inks and shadows. */
  const sweep = async () => {
    const secs = await page.evaluate(() => [...document.querySelectorAll('.sx-nav a[data-act="sx-sec"]')].map((a) => a.getAttribute("data-v")));
    const segs = [];
    for (const sec of secs) {
      await press('.sx-nav a[data-act="sx-sec"][data-v="' + sec + '"]'); await W(150);
      segs.push(...await page.evaluate((sec) => [...document.querySelectorAll("#main .seg")].filter((s) => s.getClientRects().length).map((s) => ({
        sec, act: (s.querySelector("span[data-act]") || {}).getAttribute ? s.querySelector("span[data-act]").getAttribute("data-act") : "",
        parts: [...s.querySelectorAll(":scope > span")].map((p) => { const cs = getComputedStyle(p);
          return { w: p.textContent.trim(), on: p.classList.contains("on"), bg: cs.backgroundColor, ink: cs.color, sh: cs.boxShadow }; }),
      })), sec));
    }
    return { secs, segs };
  };

  const seen = { segs: 0, chosen: 0, pairs: 0, secs: 0 };
  for (const lang of ["en", "pl"]) {
    await press('.sx-nav a[data-act="sx-sec"][data-v="general"]'); await W(200);
    await press('[data-act="set-lang"][data-v="' + lang + '"]'); await W(400);
    const said = await page.evaluate(() => (document.querySelector('#main .seg span.on[data-act="set-lang"]') || {}).textContent || "");
    check(said === (lang === "en" ? "English" : "Polski"), "the interface language is " + lang + " before its passes", said);
    for (const theme of ["light", "dark"]) {
      await press('.sx-nav a[data-act="sx-sec"][data-v="appearance"]'); await W(200);
      await press('[data-act="set-theme"][data-v="' + theme + '"]'); await W(400);
      const painted = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
      const { secs, segs } = await sweep();
      seen.secs = Math.max(seen.secs, secs.length);
      const where = theme + " " + lang;
      const bad = [], badOff = [];
      let chosen = 0, pairs = 0, low = Infinity;
      for (const s of segs) {
        for (const p of s.parts) {
          if (p.on) {
            chosen++;
            low = Math.min(low, ratio(p.ink, p.bg));
            if (p.bg !== FILLS[theme] || p.ink !== WHITE || /inset/.test(p.sh)) bad.push(s.sec + "/" + s.act + "/" + p.w + " " + p.bg + " " + p.ink + " " + p.sh);
          } else if (p.bg !== CLEAR) bad.push(s.sec + "/" + s.act + "/" + p.w + " unchosen " + p.bg);
        }
        const words = s.parts.map((p) => p.w);
        if (words.length === 2 && words.includes(WORDS[lang].on) && words.includes(WORDS[lang].off)) {
          pairs++;
          if (words.indexOf(WORDS[lang].off) > words.indexOf(WORDS[lang].on)) badOff.push(s.sec + "/" + s.act + ": " + words.join(" | "));
        }
      }
      seen.segs += segs.length; seen.chosen += chosen; seen.pairs += pairs;
      check(painted === theme && segs.length >= 10 && chosen >= 10 && bad.length === 0,
        "c1 " + where + ": the chosen part of all " + segs.length + " choices over " + secs.length + " sections is filled with the accent, lettered white, no underline (floor 10)",
        { painted, bad });
      check(chosen > 0 && low >= 4.5, "c2 " + where + ": white on the fill at " + (isFinite(low) ? low.toFixed(2) : "none") + ":1, floor 4.5");
      check(pairs >= 7 && badOff.length === 0, "c4 " + where + ": all " + pairs + " On / Off pairs read Off, then On (floor 7)", badOff);
    }
  }

  /* c3: under the pointer, light theme, the theme row's chosen part. */
  await press('.sx-nav a[data-act="sx-sec"][data-v="general"]'); await W(200);
  await press('[data-act="set-lang"][data-v="en"]'); await W(300);
  await press('.sx-nav a[data-act="sx-sec"][data-v="appearance"]'); await W(200);
  await press('[data-act="set-theme"][data-v="light"]'); await W(300);
  const onSel = '#main .seg span.on[data-act="set-theme"]';
  const box = await page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, onSel);
  if (box) { await page.mouse.move(box.x, box.y); await W(250); }
  const hov = await page.evaluate((s) => { const e = document.querySelector(s); return e ? { m: e.matches(":hover"), ink: getComputedStyle(e).color, bg: getComputedStyle(e).backgroundColor } : null; }, onSel);
  check(!!hov && hov.m && hov.ink === WHITE && hov.bg === FILL, "c3 the chosen part under the pointer keeps white on the fill", hov);
  await page.mouse.move(2, 2);

  /* c5: the same face wherever a choice stands in the content, placed as the screens that draw them place it. */
  const placed = await page.evaluate(() => {
    const main = document.querySelector("#main");
    const host = document.createElement("div");
    host.innerHTML = '<div class="pane"><div class="row2"><div class="seg" role="radiogroup"><span class="on">A</span><span>B</span></div></div></div>'
      + '<span class="viewbar"><div class="seg" role="radiogroup"><span class="on">A</span><span>B</span></div></span>'
      + '<div class="st-head"><div class="seg st-views" role="radiogroup"><span class="on">A</span><span>B</span></div></div>'
      + '<div class="pwc-pane"><div class="blk"><div class="top"><span class="pw-seg" role="radiogroup"><span class="on"><i></i>A</span><span><i class="no"></i>B</span></span></div></div></div>';
    main.appendChild(host);
    const out = [...host.querySelectorAll(".seg, .pw-seg")].map((s) => { const on = s.querySelector("span.on"), off = s.querySelector("span:not(.on)");
      const a = getComputedStyle(on), b = getComputedStyle(off);
      return { where: (s.parentElement.className || "") + " > " + s.className, bg: a.backgroundColor, ink: a.color, sh: a.boxShadow, offBg: b.backgroundColor }; });
    host.remove();
    return out;
  });
  const wrongPlaced = placed.filter((p) => p.bg !== FILL || p.ink !== WHITE || /inset/.test(p.sh) || p.offBg !== CLEAR);
  check(placed.length === 4 && wrongPlaced.length === 0, "c5 a choice in a pane's row, the view bar, the statistics' switch and the edition switch takes the fill (" + placed.length + " placed)", wrongPlaced);

  check(errors.length === 0, "the page raised no error while driven", errors);
  process.stdout.write("  seen: " + seen.secs + " sections, " + seen.segs + " choices and " + seen.chosen + " chosen parts over four passes, " + seen.pairs + " On / Off pairs\n");
} finally {
  await browser.close();
}
process.stdout.write("#counts checks=" + checks + " failures=" + fails + "\n");
process.stdout.write(fails ? "choice-like-desk: " + fails + " of " + checks + " FAILED\n" : "choice-like-desk: all " + checks + " passed\n");
process.exit(fails ? 1 : 0);
