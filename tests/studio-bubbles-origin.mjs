/* Studio's small questions are the desk's blue bubble, each hung from the control it comes from (board 1001).
 *
 *     node tests/studio-bubbles-origin.mjs
 *
 * Headless Chrome on ui/index.html, served over a local port so the page can import the pinned engine's bubble.js as
 * the packaged program does, with a stand-in window.STUDIO answering only what each case needs. The measure is the
 * desk's (engine tests/desk-bubbles-origin.mjs): the pointer's point, read from the laid-out box of #dlg's .bub-tip, lies
 * within the control's span along the edge it faces and no further than the bubble's gap and a pixel from that edge,
 * with the whole bubble inside the window; #dlg wears .bub and the scrim dims nothing.
 *   sb1  Clear local memory?, from Clear local memory in Settings, Data and defaults
 *   sb2  Join a team as a teammate, from its button in Settings, Teams
 *   sb3  Reset Studio?, from Reset Studio in Maintenance
 *   sb4  the reset left unfinished, met at the start, from Reset Studio, Maintenance having come forward; once the
 *        opening has gone, the point at the bubble's centre is the bubble's own, so nothing covers it
 *   sb5  saved data from a newer Studio, met at the start, from the Menu, on screen as sb4, over no row of the side list
 *   sb6  a larger cover (About) stays a cover: no .bub, the scrim dims
 *   sb7  the Undo after Local memory cleared is the desk's bubble, from Clear local memory, not a bar at the foot
 *   sb8  a company proxy's question is the blue bubble, from the account button where it shows, else the Menu
 *   sb9  the desk's order, light and dark: in Clear local memory? and the reset left unfinished the acting choice is
 *        first on the fill's dark and the way out (Cancel, Stop the reset) filled (white) and last
 *   sb10 one kind of field in the bubble's own line, light and dark: in Join a team as a teammate and Reset Studio? every
 *        field is the desk's white field and every label is said as written (no capitals put on, no tracking)
 *   sb11 a bubble that states something opens with its statement in bold, as the desk's notices: the reset left
 *        unfinished (its first paragraph, as the desk's) and saved data from a newer Studio (its first sentence), English
 *        and Polish; what follows is not bold
 * Node only, puppeteer-core, no Electron window.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const EXPECTED = 11;
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

/* The tree served read-only from its root: ui/ and engine/pinned/ as the asar lays them out. */
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

/* The measure, in the page, as the desk's leg reads it. */
const MEASURE = String.raw`window.__bubAt = function(bub, ctl){
  if(!bub) return {why:"no bubble"};
  if(!bub.classList.contains("bub")) return {why:"not the bubble", cls:bub.className};
  const side=bub.getAttribute("data-side");
  const tip=bub.querySelector(":scope > .bub-tip");
  if(!tip || !tip.getClientRects().length) return {why:"no pointer", side:side};
  if(!ctl || !ctl.getClientRects().length) return {why:"no control on screen", side:side};
  const t=tip.getBoundingClientRect(), c=ctl.getBoundingClientRect(), b=bub.getBoundingClientRect();
  let perp, along, lo, hi;
  if(side==="below"){ perp=t.top-c.bottom; along=t.left+t.width/2; lo=c.left; hi=c.right; }
  else if(side==="above"){ perp=c.top-t.bottom; along=t.left+t.width/2; lo=c.left; hi=c.right; }
  else if(side==="right"){ perp=t.left-c.right; along=t.top+t.height/2; lo=c.top; hi=c.bottom; }
  else if(side==="left"){ perp=c.left-t.right; along=t.top+t.height/2; lo=c.top; hi=c.bottom; }
  else return {why:"side "+side};
  const shown=b.top>=-1 && b.left>=-1 && b.bottom<=innerHeight+1 && b.right<=innerWidth+1;
  const dim=bub.id==="dlg" ? getComputedStyle(document.getElementById("scrim")).backgroundColor : "rgba(0, 0, 0, 0)";
  const ok=shown && perp>=-2 && perp<=11 && along>=lo-0.5 && along<=hi+0.5 && /rgba\(0, 0, 0, 0\)|transparent/.test(dim);
  return {ok:ok, shown:shown, side:side, perp:Math.round(perp*10)/10, along:Math.round(along), span:[Math.round(lo),Math.round(hi)], dim:dim};
};`;

async function open(browser, host, theme) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument((host) => {
    try { localStorage.setItem("studio.tourDone", "1"); } catch (e) {}
    const known = {
      host: async () => Object.assign({ version: "0.1.0" }, host || {}),
      projects: async () => [],
      maintenance: async () => ({}),
      clearLocalMemory: async () => ({ cleared: true }),
      proxyAsks: async () => (host && host.proxyAsk ? [{ id: 1, host: "proxy.example", port: 8080 }] : []),
      proxyAnswer: async () => null,
    };
    window.STUDIO = new Proxy(known, {
      get: (t, k) => (k in t ? t[k] : (typeof k === "string" && /^on[A-Z]/.test(k) ? () => {} : async () => null)),
    });
  }, Object.assign({}, host || {}, theme ? { theme } : {}));
  await page.goto(URL_PAGE, { waitUntil: "load" });
  await page.waitForSelector("#band", { timeout: 15000 });
  await sleep(600);
  await page.evaluate(MEASURE);
  return page;
}
/* Presses a control the way the page's own handlers receive it, and waits for the bubble to stand. */
async function press(page, sel) {
  const ok = await page.evaluate((sel) => {
    const el = Array.from(document.querySelectorAll(sel)).find((e) => e.getClientRects().length);
    if (!el) return false;
    el.scrollIntoView({ block: "center" });
    el.focus();
    el.click();
    return true;
  }, sel);
  await sleep(500);
  return ok;
}
/* Once the opening's veil has gone (up to 10 s), the point at #dlg's centre belongs to #dlg. */
async function onTop(page) {
  await page.waitForFunction(() => !document.querySelector(".e-launch-veil"), { timeout: 10000 }).catch(() => {});
  await sleep(200);
  return page.evaluate(() => {
    const d = document.getElementById("dlg"), b = d && d.getBoundingClientRect();
    if (!b || !b.width) return { onTop: false, why: "no box" };
    const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
    return { onTop: !!(hit && d.contains(hit)), veil: !!document.querySelector(".e-launch-veil"), hit: hit ? hit.tagName + "." + hit.className : null };
  });
}
/* The foot's visible buttons, in order, and which of them are filled white. */
const foot = (page) => page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll("#dlg .foot .btn")).filter((b) => b.getClientRects().length);
  const white = (b) => { const m = getComputedStyle(b).backgroundColor.match(/[\d.]+/g) || [];
    return +m[0] > 240 && +m[1] > 240 && +m[2] > 240 && (m[3] === undefined || +m[3] > 0.9); };
  return { acts: btns.map((b) => b.getAttribute("data-act")), filled: btns.filter(white).map((b) => b.getAttribute("data-act")) };
});
/* Every field in #dlg white, every label as written. */
const fields = (page) => page.evaluate(() => {
  const bad = [];
  document.querySelectorAll("#dlg input:not([type=checkbox]):not([type=radio]), #dlg textarea").forEach((e) => {
    if (!e.getClientRects().length) return;
    const bg = getComputedStyle(e).backgroundColor;
    if (!/^rgb\(255, 255, 255\)$/.test(bg)) bad.push({ field: e.id || e.tagName, bg });
  });
  const labels = Array.from(document.querySelectorAll("#dlg .kv .k")).filter((e) => e.getClientRects().length);
  labels.forEach((e) => {
    const cs = getComputedStyle(e);
    if (cs.textTransform !== "none" || (cs.letterSpacing !== "normal" && parseFloat(cs.letterSpacing) !== 0)) bad.push({ label: e.textContent, tt: cs.textTransform, ls: cs.letterSpacing });
  });
  return { bad, labels: labels.length };
});
const at = (page, ctl, bub) => page.evaluate((ctl, bub) => {
  const c = Array.from(document.querySelectorAll(ctl)).find((e) => e.getClientRects().length && !e.closest("#dlg"));
  return window.__bubAt(document.getElementById(bub || "dlg"), c);
}, ctl, bub || "dlg");
async function toSettings(page, sec) {
  await press(page, '[data-act="settings"]');
  await press(page, '.sx-nav [data-sx="' + sec + '"], .sx-nav a[data-v="' + sec + '"]');
}

let browser = null;
try {
  browser = await puppeteer.launch({ executablePath, headless: true, args: ["--hide-scrollbars", "--no-sandbox"] });

  let p = await open(browser);
  await toSettings(p, "data");
  const clearOk = await press(p, '[data-act="clear-ask"]');
  const sb1 = clearOk ? await at(p, '[data-act="clear-ask"]') : { why: "no Clear local memory on screen" };
  check(!!sb1.ok, "sb1 Clear local memory? hangs from Clear local memory", sb1);
  await press(p, '#dlg [data-act="cover-close"]');

  await press(p, '[data-act="clear-ask"]');
  await press(p, '#dlg [data-act="do-clear"]');
  const sb7 = await at(p, '[data-act="clear-ask"]', "undo");
  check(!!sb7.ok, "sb7 the Undo after Local memory cleared hangs from Clear local memory", sb7);

  await toSettings(p, "teams");
  const joinOk = await press(p, '[data-act="follow-join-cover"]');
  const sb2 = joinOk ? await at(p, '[data-act="follow-join-cover"]') : { why: "no Join a team as a teammate on screen" };
  check(!!sb2.ok, "sb2 Join a team as a teammate hangs from its button", sb2);
  await press(p, '#dlg [data-act="cover-close"]');

  await press(p, '[data-act="to-screen"][data-v="maintenance"]');
  const resetOk = await press(p, '[data-act="reset-studio-ask"]');
  const sb3 = resetOk ? await at(p, '[data-act="reset-studio-ask"]') : { why: "no Reset Studio on screen" };
  check(!!sb3.ok, "sb3 Reset Studio? hangs from Reset Studio", sb3);
  await press(p, '#dlg [data-act="cover-close"]');

  await p.close();
  p = await open(browser);
  await toSettings(p, "about");
  await press(p, '[data-act="about"]');
  const sb6 = await p.evaluate(() => {
    const d = document.getElementById("dlg"), s = document.getElementById("scrim");
    return { open: !s.hidden, bub: d.classList.contains("bub"), dim: getComputedStyle(s).backgroundColor };
  });
  check(sb6.open && !sb6.bub && !/rgba\(0, 0, 0, 0\)/.test(sb6.dim), "sb6 a larger cover (About) stays a cover over a dimming scrim", sb6);
  await p.close();

  p = await open(browser, { resetUnfinished: { blocked: ["a folder"] } });
  await sleep(500);
  const sb4 = Object.assign(await at(p, '[data-act="reset-studio-ask"]'), await onTop(p));
  check(!!sb4.ok && sb4.onTop, "sb4 the reset left unfinished hangs from Reset Studio, Maintenance come forward, on screen once the opening has gone", sb4);
  await p.close();

  p = await open(browser, { savedNewer: { version: "9.9.9" } });
  const sb5 = Object.assign(await at(p, "#btnMenu"), await onTop(p), await p.evaluate(() => {
    const b = document.getElementById("dlg").getBoundingClientRect();
    const rows = Array.from(document.querySelectorAll("#rail [data-act], #rail a, #rail button"))
      .filter((e) => e.getClientRects().length && !e.closest("#dlg") && !e.closest("#band"));
    const over = rows.filter((e) => { const c = e.getBoundingClientRect(); return c.right > b.left && c.left < b.right && c.bottom > b.top && c.top < b.bottom; });
    return { sideRows: rows.length, overSide: over.map((e) => e.textContent.trim().slice(0, 20)) };
  }));
  check(!!sb5.ok && sb5.onTop && sb5.sideRows > 0 && !sb5.overSide.length,
    "sb5 saved data from a newer Studio hangs from the Menu, on screen once the opening has gone, over no row of the side list", sb5);
  await p.close();

  p = await open(browser, { proxyAsk: true });
  await sleep(400);
  const sb8 = await p.evaluate(() => {
    const a = document.getElementById("btnAcct"), ctl = a && a.getClientRects().length ? a : document.getElementById("btnMenu");
    const q = document.getElementById("sProxyAsk");
    return Object.assign({ paper: !!(q && q.classList.contains("paper")) }, window.__bubAt(q, ctl));
  });
  check(!!sb8.ok && !sb8.paper, "sb8 a company proxy's question is the blue bubble, from the account button, else the Menu", sb8);
  await p.close();

  const sb9 = [], sb10 = [];
  for (const theme of ["light", "dark"]) {
    p = await open(browser, null, theme);
    await toSettings(p, "data");
    await press(p, '[data-act="clear-ask"]');
    const c = await foot(p);
    if (c.acts[c.acts.length - 1] !== "cover-close" || c.filled.join() !== "cover-close" || c.acts[0] !== "do-clear") sb9.push(Object.assign({ theme, cover: "clear" }, c));
    await press(p, '#dlg [data-act="cover-close"]');
    await toSettings(p, "teams");
    await press(p, '[data-act="follow-join-cover"]');
    const j = await fields(p);
    if (j.bad.length || j.labels < 1) sb10.push(Object.assign({ theme, cover: "follow-join" }, j));
    await press(p, '#dlg [data-act="cover-close"]');
    await press(p, '[data-act="to-screen"][data-v="maintenance"]');
    await press(p, '[data-act="reset-studio-ask"]');
    const r = await fields(p);
    if (r.bad.length || r.labels < 1) sb10.push(Object.assign({ theme, cover: "reset-studio" }, r));
    await p.close();
    p = await open(browser, { resetUnfinished: { blocked: ["a folder"] } }, theme);
    await sleep(500);
    const u = await foot(p);
    if (u.acts.join() !== "reset-unfinished-again,reset-unfinished-stop" || u.filled.join() !== "reset-unfinished-stop") sb9.push(Object.assign({ theme, cover: "reset-unfinished" }, u));
    await p.close();
  }
  check(!sb9.length, "sb9 Clear local memory? and the reset left unfinished in the desk's order, the way out filled and last, light and dark", sb9);
  check(!sb10.length, "sb10 Join a team as a teammate and Reset Studio? hold the desk's white field and labels as written, light and dark", sb10);

  const sb11 = [];
  const STATES = [
    ["reset-unfinished", { resetUnfinished: { blocked: ["a folder"] } }, { en: "The reset of Etiuda Studio did not finish.", pl: "Reset Etiudy Studio nie został dokończony." }],
    ["saved-newer", { savedNewer: { version: "9.9.9" } }, { en: "This Studio's saved data were written by", pl: "Dane tego Studia zapisało" }],
  ];
  for (const lang of ["en", "pl"]) for (const [name, host, lead] of STATES) {
    p = await open(browser, Object.assign({ uiLang: lang, lang }, host));
    await sleep(500);
    const r = await p.evaluate(() => {
      const d = document.getElementById("dlg");
      const parts = Array.from(d.querySelectorAll("h2, p")).filter((e) => e.getClientRects().length && e.textContent.trim());
      return parts.map((e) => ({ text: e.textContent.trim().slice(0, 60), weight: +getComputedStyle(e).fontWeight }));
    });
    const ok = r.length >= 2 && r[0].weight >= 600 && r[0].text.startsWith(lead[lang]) && r.slice(1).every((x) => x.weight < 600);
    if (!ok) sb11.push({ lang, name, parts: r });
    await p.close();
  }
  check(!sb11.length, "sb11 the reset left unfinished and saved data from a newer Studio open with their statement in bold and the rest plain, English and Polish", sb11);
} catch (e) {
  check(false, "run crashed: " + String(e && e.stack || e).split("\n").slice(0, 3).join(" | "));
} finally {
  if (browser) await browser.close();
  server.close();
}
console.log("RESULT checks=" + checks + " failed=" + fails);
console.log("#counts checks=" + checks + " skipped=0 failed=" + fails + " expected=" + EXPECTED);
process.exit(fails || checks !== EXPECTED ? 1 : 0);
