/* Studio's Undo can be put away (board 1019, the desk's undo-bubbles item).
 *
 *     node tests/studio-undo-close.mjs
 *
 * Headless Chrome on ui/index.html over a local port, a stand-in window.STUDIO answering only what each case needs.
 *   su1  the Undo after Local memory cleared carries a close control, labelled Close (Zamknij in Polish); pressing it
 *        puts the bubble away and never asks the shell to put the memory back
 *   su2  Escape, with nothing else wanting it, puts the same bubble away and takes nothing back
 *   su3  Escape in a field is the field's own: the bubble stands
 *   su4  Ctrl+Z still takes the Undo, so the shell is asked once
 * Node only, puppeteer-core, no Electron window.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const EXPECTED = 5;
const executablePath = [process.env.ETIUDA_CHROME, "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe", "/usr/bin/google-chrome", "/usr/bin/chromium"]
  .filter(Boolean).find((p) => fs.existsSync(p));
if (!executablePath) { process.stderr.write("No Chrome browser found to drive\n"); process.exit(1); }
if (!fs.existsSync(path.join(ROOT, "engine", "pinned", "src", "modules", "bubble.js"))) {
  process.stderr.write("engine/pinned is missing: run tools/engine-fetch.mjs first\n"); process.exit(78);
}
let checks = 0, fails = 0;
function check(ok, line, detail) {
  checks++;
  if (!ok) fails++;
  process.stdout.write((ok ? "  ok   " : "  FAIL ") + line + (ok || detail === undefined ? "" : ": " + JSON.stringify(detail)) + "\n");
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css",
  ".svg": "image/svg+xml", ".json": "application/json", ".png": "image/png", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(String(req.url || "/").split("?")[0]).replace(/^\/+/, "");
  const file = path.resolve(ROOT, rel);
  if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.statusCode = 404; res.end(); return; }
  res.setHeader("content-type", TYPES[path.extname(file)] || "application/octet-stream");
  res.end(fs.readFileSync(file));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const URL_PAGE = "http://127.0.0.1:" + server.address().port + "/ui/index.html";

async function open(browser, lang) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument((lang) => {
    try { localStorage.setItem("studio.tourDone", "1"); } catch (e) {}
    window.__undone = 0;
    const known = {
      host: async () => (lang ? { version: "0.1.0", lang } : { version: "0.1.0" }),
      projects: async () => [],
      maintenance: async () => ({}),
      clearLocalMemory: async () => ({ cleared: true }),
      clearLocalMemoryUndo: async () => { window.__undone++; return { undone: true, store: {} }; },
      proxyAsks: async () => [],
      proxyAnswer: async () => null,
    };
    window.STUDIO = new Proxy(known, {
      get: (t, k) => (k in t ? t[k] : (typeof k === "string" && /^on[A-Z]/.test(k) ? () => {} : async () => null)),
    });
  }, lang || "");
  await page.goto(URL_PAGE, { waitUntil: "load" });
  await page.waitForSelector("#band", { timeout: 15000 });
  await sleep(600);
  return page;
}
async function press(page, sel) {
  const ok = await page.evaluate((sel) => {
    const el = Array.from(document.querySelectorAll(sel)).find((e) => e.getClientRects().length);
    if (!el) return false;
    el.scrollIntoView({ block: "center" }); el.focus(); el.click();
    return true;
  }, sel);
  await sleep(500);
  return ok;
}
/* Clear local memory in Settings, Data and defaults, as the bubble leg does, leaving the Undo standing. */
async function standUndo(page) {
  await press(page, '[data-act="settings"]');
  await press(page, '.sx-nav [data-sx="data"], .sx-nav a[data-v="data"]');
  await press(page, '[data-act="clear-ask"]');
  await press(page, '#dlg [data-act="do-clear"]');
  await sleep(300);
}
const state = (page) => page.evaluate(() => {
  const u = document.getElementById("undo"), x = u && u.querySelector('[data-act="undo-close"]');
  return { up: !!(u && !u.hidden && u.getClientRects().length), x: x ? x.getAttribute("aria-label") : null, undone: window.__undone };
});

let browser = null;
try {
  browser = await puppeteer.launch({ executablePath, headless: true, args: ["--hide-scrollbars", "--no-sandbox"] });
  let p = await open(browser);
  await standUndo(p);
  const s0 = await state(p);
  await press(p, '#undo [data-act="undo-close"]');
  const s1 = await state(p);
  check(s0.up && s0.x === "Close" && !s1.up && s1.undone === 0, "su1 the Undo carries a close control, which puts the bubble away without taking the Undo", { s0, s1 });

  await standUndo(p);
  await p.evaluate(() => { document.activeElement && document.activeElement.blur && document.activeElement.blur(); });
  await p.keyboard.press("Escape"); await sleep(300);
  const s2 = await state(p);
  check(!s2.up && s2.undone === 0, "su2 Escape with nothing else wanting it puts the bubble away without taking the Undo", s2);

  await standUndo(p);
  await p.evaluate(() => { const i = document.createElement("input"); i.id = "probe"; document.body.appendChild(i); i.focus(); });
  await p.keyboard.press("Escape"); await sleep(300);
  const s3 = await state(p);
  check(s3.up && s3.undone === 0, "su3 Escape in a field is the field's own, the bubble stands", s3);

  await p.evaluate(() => { const i = document.getElementById("probe"); i.blur(); i.remove(); });
  await p.keyboard.down("Control"); await p.keyboard.press("KeyZ"); await p.keyboard.up("Control"); await sleep(400);
  const s4 = await state(p);
  check(s4.undone === 1, "su4 Ctrl+Z still takes the Undo, once", s4);
  await p.close();

  p = await open(browser, "pl");
  await standUndo(p);
  const s5 = await state(p);
  check(s5.up && s5.x === "Zamknij", "su5 in Polish the close control reads Zamknij", s5);
  await p.close();
} catch (e) {
  check(false, "run crashed: " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join(" | ") : e));
} finally {
  if (browser) await browser.close();
  server.close();
}
process.stdout.write("RESULT checks=" + checks + " failed=" + fails + "\n");
process.exit(fails || checks !== EXPECTED ? 1 : 0);
