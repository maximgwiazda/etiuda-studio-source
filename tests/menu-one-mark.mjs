/* ONE ROW OF A LIST MARKED AT A TIME (Maxim's testing note 8, 2026-11-15 11:25: "only one position in Menu should be
 * markable at the time"; his picture had Settings still marked while the pointer marked another row).
 *
 *     node tests/menu-one-mark.mjs            MENU_MARK_UI=<a copy of ui/> reads that copy instead
 *
 * Headless Chrome on ui/index.html with window.STUDIO stubbed, no Electron window. A row is marked when its computed
 * background is not transparent; the pointer is the browser's own (real :hover), the keys are real key presses.
 *   om1 the Menu opened by the pointer marks no row until the pointer reaches one
 *   om2 the pointer on a row marks that row alone, and moving to another hands the mark over
 *   om3 the Menu opened by the keys marks its first row; the pointer then moving onto another row leaves one mark
 *   om4 an arrow key moves the one mark while the pointer rests on another row
 *   om5 the pointer leaving the list leaves no row marked, and the arrow key then starts from the top
 *   om6 an object's menu opened by the keys, then pointed at, keeps one mark (the same list's rule)
 *   or1 a rail (the work rail and Settings' rail): a row holding the keyboard's focus goes unmarked while the pointer marks
 *       another, and the hovered row goes unmarked once the keys are used again
 * Each was red on main 3f6f9294 or is named in the report that added this file as passing there and why.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const UI = process.env.MENU_MARK_UI ? path.resolve(process.env.MENU_MARK_UI) : path.join(ROOT, "ui");
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

const CATALOGS = [{ id: "harbour", name: "Harbour lamps", dir: "C:/studio/harbour", rev: 0, counts: { cards: 0 }, langs: ["en", "pl"],
  changes: 0, checks: 0, opened: "2026-11-11T10:00:00.000Z", edited: "2026-11-10T10:00:00.000Z" }];

/** Which rows of the list `sel` are marked, by index, and where each row sits. */
const marks = (page, sel) => page.evaluate((sel) => {
  const rows = Array.from(document.querySelectorAll(sel + ' [role="menuitem"]'));
  const on = [];
  rows.forEach((r, i) => {
    const bg = getComputedStyle(r).backgroundColor;
    const m = /rgba?\(([^)]+)\)/.exec(bg);
    const a = m ? (m[1].split(",")[3] == null ? 1 : parseFloat(m[1].split(",")[3])) : 0;
    if (bg !== "transparent" && a > 0) on.push(i);
  });
  return { on, n: rows.length, at: rows.map((r) => { const b = r.getBoundingClientRect(); return [Math.round(b.left + b.width / 2), Math.round(b.top + b.height / 2)]; }) };
}, sel);
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

async function main() {
  const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--hide-scrollbars", "--no-sandbox"] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 860 });
    await page.evaluateOnNewDocument((cats) => {
      window.STUDIO = { host: async () => ({ version: "0.1.0", tour: { offered: true, taken: false, at: 0 } }), projects: async () => ({ root: "C:/studio", projects: cats, sample: "" }),
        onMaximized: () => {}, onTrayGo: () => {}, onOpenDir: () => {}, onTask: () => {}, onTeamMoved: () => {},
        onRelayLapse: () => {}, onRelaySyncNote: () => {} };
    }, CATALOGS);
    await page.goto(URL_, { waitUntil: "load" });
    await page.waitForSelector("#btnMenu", { timeout: 5000 });
    /* The opening covers the window for a few seconds; a pointer reaches the band once it has gone. */
    await page.waitForFunction(() => !document.querySelector(".e-launch-veil"), { timeout: 10000 });
    await settle(page);

    /* om1, om2: opened by the pointer. */
    await page.mouse.move(5, 500);
    await page.click("#btnMenu");
    await settle(page);
    let m = await marks(page, "#menuList");
    check(m.n >= 3 && m.on.length === 0, "om1 the Menu opened by the pointer marks no row", m.on);
    await page.mouse.move(m.at[1][0], m.at[1][1]);
    await settle(page);
    const onTour = await marks(page, "#menuList");
    await page.mouse.move(m.at[2][0], m.at[2][1]);
    await settle(page);
    const onAbout = await marks(page, "#menuList");
    check(onTour.on.join() === "1" && onAbout.on.join() === "2",
      "om2 the pointer on a row marks that row alone, and moving to another hands the mark over", { onTour: onTour.on, onAbout: onAbout.on });

    /* om5: the pointer leaves the list; then the arrow key starts from the top. */
    await page.mouse.move(5, 500);
    await settle(page);
    const left = await marks(page, "#menuList");
    await page.keyboard.press("ArrowDown");
    await settle(page);
    const down = await marks(page, "#menuList");
    check(left.on.length === 0 && down.on.join() === "0",
      "om5 the pointer leaving the list leaves no row marked, and the arrow key then marks the first row alone", { left: left.on, down: down.on });
    await page.keyboard.press("Escape");
    await settle(page);

    /* om3, om4: opened by the keys. */
    await page.focus("#btnMenu");
    await page.keyboard.press("Enter");
    await settle(page);
    m = await marks(page, "#menuList");
    check(m.on.join() === "0", "om3a the Menu opened by the keys marks its first row alone", m.on);
    await page.mouse.move(m.at[1][0], m.at[1][1]);
    await settle(page);
    const pointed = await marks(page, "#menuList");
    check(pointed.on.join() === "1", "om3b the pointer then moving onto the second row leaves that row the one mark", pointed.on);
    await page.keyboard.press("ArrowDown");
    await settle(page);
    const keyed = await marks(page, "#menuList");
    check(keyed.on.join() === "2", "om4 an arrow key moves the one mark while the pointer rests on another row", keyed.on);
    await page.keyboard.press("Escape");
    await settle(page);

    /* om6: an object's menu, by the keys, then the pointer, on the Library's first catalog. */
    await page.evaluate(() => { const a = document.querySelector('#rail [data-act="home"][data-v="library"]'); if (a) a.click(); });
    await page.waitForSelector('#main [data-ctx="project"]', { timeout: 5000 }).catch(() => {});
    const ctxAt = await page.evaluate(() => {
      const o = document.querySelector('#main [data-ctx="project"]') || document.querySelector("#main [data-ctx]");
      if (!o) return null;
      if (!o.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT)$/.test(o.tagName)) o.setAttribute("tabindex", "-1");
      o.focus();
      return o.getAttribute("data-ctx");
    });
    if (!ctxAt) check(false, "om6 an object to open a menu on", "no [data-ctx] on the home screen");
    else {
      await page.keyboard.down("Shift"); await page.keyboard.press("F10"); await page.keyboard.up("Shift");
      await settle(page);
      const c0 = await marks(page, "#ctxMenu");
      if (c0.n < 2) check(false, "om6 an object's menu with two rows to point at", { kind: ctxAt, rows: c0.n });
      else {
        await page.mouse.move(c0.at[c0.n - 1][0], c0.at[c0.n - 1][1]);
        await settle(page);
        const c1 = await marks(page, "#ctxMenu");
        check(c0.on.join() === "0" && c1.on.join() === String(c0.n - 1),
          "om6 an object's menu opened by the keys, then pointed at, keeps one mark", { kind: ctxAt, opened: c0.on, pointed: c1.on });
      }
      await page.keyboard.press("Escape");
    }

    /* or1: the rails, whose rows keep the focus where it is; the hand used last owns the mark. */
    const railRows = (sel) => page.evaluate((sel) => Array.from(document.querySelectorAll(sel)).filter((r) => r.offsetParent !== null).map((r, i) => {
      const bg = getComputedStyle(r).backgroundColor, m = /rgba?(([^)]+))/.exec(bg), a = m ? (m[1].split(",")[3] == null ? 1 : parseFloat(m[1].split(",")[3])) : 0;
      const b = r.getBoundingClientRect();
      return { i, on: r.classList.contains("on"), marked: bg !== "transparent" && a > 0, x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) };
    }), sel);
    const railCase = async (sel, name) => {
      await page.mouse.move(640, 5);
      const rows = await railRows(sel), free = rows.filter((r) => !r.on);
      if (free.length < 2) return { name, rows: rows.length };
      const keyed = free[0], pointed = free[free.length - 1];
      await page.keyboard.press("Shift");
      await page.evaluate((sel, i) => { Array.from(document.querySelectorAll(sel)).filter((r) => r.offsetParent !== null)[i].focus(); }, sel, keyed.i);
      await settle(page);
      const byKeys = (await railRows(sel)).filter((r) => r.marked && !r.on).map((r) => r.i);
      await page.mouse.move(pointed.x, pointed.y); await settle(page);
      const byPointer = (await railRows(sel)).filter((r) => r.marked && !r.on).map((r) => r.i);
      await page.keyboard.press("Shift"); await settle(page);
      const back = (await railRows(sel)).filter((r) => r.marked && !r.on).map((r) => r.i);
      return { name, ok: byKeys.join() === String(keyed.i) && byPointer.join() === String(pointed.i) && back.join() === String(keyed.i), keyed: keyed.i, pointed: pointed.i, byKeys, byPointer, back };
    };
    const work = await railCase("#rail a", "the work rail");
    await page.evaluate(() => { const a = document.querySelector('[data-act="settings"]'); if (a) a.click(); });
    await page.waitForSelector(".sx-nav a", { timeout: 5000 }).catch(() => {});
    const sets = await railCase(".sx-nav a", "Settings' rail");
    check(!!work.ok && !!sets.ok, "or1 a rail's focused row goes unmarked while the pointer marks another, and the hovered row once the keys are used again", { work, sets });
  } finally {
    await browser.close();
  }
  process.stdout.write("#counts checks=" + checks + " failures=" + fails + "\n");
  process.exit(fails ? 1 : 0);
}

main().catch((err) => { process.stderr.write(String((err && err.stack) || err) + "\n"); process.exit(2); });
