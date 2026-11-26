/* ONE-LINE GLASS RIM ON THE FIVE DARK SURFACES + NATIVE COLOR-SCHEME
 * Refuses:
 *   1. Missing or double-line top edge / 45-deg corner on .dlg (non-.bub, non-.press), .menu-list, .si-pop, .vr-menu, .pm-panel at 1x and 2x in dark theme.
 *   2. Missing 1/5 bottom fade (footRatio > 0.25) or wrong ground colour (must be rgb(29, 31, 36)).
 *   3. Any change to bounding box size, overflow-x/y, resize, scrolling, or light-theme borders/grounds/shadows compared with main.
 *   4. Missing corners/shadow parity for .menu-list and .vr-menu (10px radius, dlg shadow) or accidental rim on excluded surfaces (.bub, .dlg.press, .sp, .pane).
 *   5. Root color-scheme failing to match Studio's theme under opposite OS prefers-color-scheme.
 *   6. Plant proofs (skipped cleanly with "NOT RUN" when ETIUDA_PLANTS=off).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import zlib from "node:zlib";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const INDEX_PATH = path.join(ROOT, "ui", "index.html");
const CHROME = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  (process.env.LOCALAPPDATA || "") + "/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find((p) => p && fs.existsSync(p));

if (!CHROME) {
  console.error("No Chromium/Chrome executable found.");
  process.exit(1);
}

const STILLS_DIR = (process.env.STUDIO_EDGE_STILLS || "").trim();
const PLANTS_OFF = String(process.env.ETIUDA_PLANTS || "").toLowerCase() === "off";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json",
};

/* Baseline measurements captured from main (commit d8a00351) at 1280x820 on the synthetic catalog below. */
const MAIN_DARK = {
  menu: { width: 230, height: 101.75, overflowX: "visible", overflowY: "visible", resize: "none", shadow: "rgba(0, 0, 0, 0.28) 0px 18px 48px 0px", radius: "10px" },
  dlg: { width: 620, height: 470.25, overflowX: "hidden", overflowY: "hidden", resize: "none", shadow: "rgba(0, 0, 0, 0.28) 0px 18px 48px 0px", radius: "12px" },
  sipop: { width: 372, height: 156.890625, overflowX: "visible", overflowY: "visible", resize: "none", shadow: "rgba(0, 0, 0, 0.24) 0px 12px 34px 0px", radius: "12px" },
  vrmenu: { width: 280, height: 420, overflowX: "auto", overflowY: "auto", resize: "none", shadow: "rgba(0, 0, 0, 0.28) 0px 18px 48px 0px", radius: "10px" },
  pmpanel: { width: 360, height: 283.75, overflowX: "auto", overflowY: "auto", resize: "none", shadow: "rgba(15, 23, 42, 0.14) 0px 8px 28px 0px", radius: "12px" },
};

const MAIN_LIGHT = {
  menu: { borderTopWidth: "1px", borderTopStyle: "solid", borderTopColor: "rgb(207, 214, 224)", borderRadius: "8px", backgroundColor: "rgb(255, 255, 255)", backgroundImage: "none", boxShadow: "rgba(0, 0, 0, 0.24) 0px 12px 32px 0px", overflowX: "visible", overflowY: "visible", resize: "none" },
  dlg: { borderTopWidth: "0px", borderTopStyle: "none", borderTopColor: "rgb(15, 23, 42)", borderRadius: "12px", backgroundColor: "rgb(255, 255, 255)", backgroundImage: "none", boxShadow: "rgba(0, 0, 0, 0.28) 0px 18px 48px 0px", overflowX: "hidden", overflowY: "hidden", resize: "none" },
  sipop: { borderTopWidth: "1px", borderTopStyle: "solid", borderTopColor: "rgb(207, 214, 224)", borderRadius: "12px", backgroundColor: "rgb(255, 255, 255)", backgroundImage: "none", boxShadow: "rgba(0, 0, 0, 0.24) 0px 12px 34px 0px", overflowX: "visible", overflowY: "visible", resize: "none" },
  vrmenu: { borderTopWidth: "1px", borderTopStyle: "solid", borderTopColor: "rgb(207, 214, 224)", borderRadius: "8px", backgroundColor: "rgb(255, 255, 255)", backgroundImage: "none", boxShadow: "rgba(0, 0, 0, 0.16) 0px 8px 24px 0px", overflowX: "auto", overflowY: "auto", resize: "none" },
  pmpanel: { borderTopWidth: "1px", borderTopStyle: "solid", borderTopColor: "rgb(228, 232, 238)", borderRadius: "12px", backgroundColor: "rgb(255, 255, 255)", backgroundImage: "none", boxShadow: "rgba(15, 23, 42, 0.14) 0px 8px 28px 0px", overflowX: "auto", overflowY: "auto", resize: "none" },
};

/* ---- minimal PNG decoder (8-bit RGB/RGBA) ---- */
function decodePng(buf) {
  const sig = "89504e470d0a1a0a";
  if (buf.subarray(0, 8).toString("hex") !== sig) throw new Error("Not a PNG");
  let off = 8, w = 0, h = 0, bpp = 4, idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.subarray(off + 4, off + 8).toString("ascii");
    const data = buf.subarray(off + 8, off + 8 + len);
    off += 12 + len;
    if (type === "IHDR") {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      const ct = data[9];
      bpp = ct === 2 ? 3 : ct === 6 ? 4 : 0;
      if (!bpp) throw new Error("Unsupported PNG color type " + ct);
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") break;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * bpp;
  const px = Buffer.alloc(w * h * 4);
  const paeth = (a, b, c) => {
    const p = a + b - c;
    const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const row = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const recon = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? recon[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      const v = row[x];
      recon[x] = (f === 0 ? v : f === 1 ? v + a : f === 2 ? v + b : f === 3 ? v + ((a + b) >> 1) : v + paeth(a, b, c)) & 0xff;
    }
    for (let x = 0; x < w; x++) {
      const s = x * bpp, d = (y * w + x) * 4;
      px[d] = recon[s];
      px[d + 1] = recon[s + 1];
      px[d + 2] = recon[s + 2];
      px[d + 3] = bpp === 4 ? recon[s + 3] : 255;
    }
    prev = recon;
  }
  return { w, h, px };
}

const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
function pixelAt(img, x, y) {
  const cx = Math.max(0, Math.min(img.w - 1, Math.round(x)));
  const cy = Math.max(0, Math.min(img.h - 1, Math.round(y)));
  const i = (cy * img.w + cx) * 4;
  return [img.px[i], img.px[i + 1], img.px[i + 2]];
}
function lumAt(img, x, y) {
  const [r, g, b] = pixelAt(img, x, y);
  return lum(r, g, b);
}
function countRuns(vals, threshold) {
  let runs = 0, on = false;
  for (const v of vals) {
    if (v > threshold) { if (!on) { runs++; on = true; } }
    else on = false;
  }
  return runs;
}

function startServer(getOverrideHtml) {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
      const rel = urlPath.replace(/^\/+/, "") || "ui/index.html";
      if (rel === "ui/index.html" && getOverrideHtml()) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(getOverrideHtml());
        return;
      }
      const file = path.join(ROOT, rel);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.statusCode = 404; res.end("not found"); return;
      }
      res.setHeader("Content-Type", MIME[path.extname(file).toLowerCase()] || "application/octet-stream");
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(0, "127.0.0.1", () => resolve({ srv, url: `http://127.0.0.1:${srv.address().port}/ui/index.html` }));
  });
}

function bridgeScript(theme) {
  return `(() => {
    const CARDS = [
      { id: "c1", intents: ["greeting"], shelf: "intro", title: { en: "First card" }, body: { en: "Hello from Studio." }, next: [{ to: "c2" }] },
      { id: "c2", intents: ["follow_up"], shelf: "intro", title: { en: "Second card" }, body: { en: "Next step here." } }
    ];
    const CATALOG = {
      dir: "C:/synth/sample-cat",
      name: "Sample Catalog",
      fileName: "sample-cat",
      project: { id: "sample", rev: 1, langs: ["en"], name: "Sample Catalog", endsMeant: [] },
      draft: {
        id: "sample",
        name: "Sample Catalog",
        lang: "en",
        langs: [{ code: "en", name: "English" }],
        tags: [
          { id: "greeting", kind: "intent", label: { en: "Greeting" } },
          { id: "follow_up", kind: "intent", label: { en: "Follow up" } },
          { id: "intro", kind: "shelf", label: { en: "Intro" } },
        ],
        cards: CARDS,
        facts: "",
        variables: { list: [{ name: "TIER", about: "Customer tier", rules: [{ when: [{ fact: "channel", op: "is", value: "email" }], write: { en: "Gold" } }, { when: [], write: { en: "Standard" } }] }] },
      },
      langs: { rows: [{ code: "en", name: "English", active: true }], primary: "en" },
      counts: { cards: 2, intents: 2, cats: 1, trash: 0 },
      editions: [],
      lint: { errors: 0, warnings: 0, awaiting: 0, suggestions: 0, list: [] },
      awaiting: [],
      tokens: [],
      likely: [],
      looks: { intro: { hue: "blue", icon: "cards" } },
      changes: 0,
      linked: null,
    };
    const handlers = {
      prefs: async () => ({ theme: ${JSON.stringify(theme)}, lang: "en", tourSeen: true }),
      projects: async () => ({ root: "C:/synth", made: true, projects: [{ dir: CATALOG.dir, name: CATALOG.name, counts: CATALOG.counts }] }),
      open: async () => JSON.parse(JSON.stringify(CATALOG)),
      tabs: async () => [],
      host: async () => ({ theme: ${JSON.stringify(theme)}, signIn: ["google"], providers: ["google"], tour: { offered: true, taken: true } }),
      licence: async () => ({ ok: true, by: "signin", provider: "google", email: "alex@example.invalid", name: "Alex" }),
      teams: async () => ({ ok: true, teams: [] }),
      proposals: async () => [],
      aiDrafts: async () => [],
      aiSettings: async () => ({}),
      tour: async () => ({ offered: true, taken: true }),
      maker: async () => ({ ok: true }),
      signing: async () => ({ ok: true }),
      seatNames: async () => [],
      lintProject: async () => [],
      shortcuts: async () => ({}),
    };
    window.STUDIO = new Proxy({}, {
      get(_t, k) {
        if (k in handlers) return handlers[k];
        if (typeof k === "string" && k.startsWith("on")) return () => {};
        return async () => ({ ok: true });
      },
    });
  })();`;
}

async function openCatalogPage(browser, url, theme, dpr) {
  const page = await browser.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme === "dark" ? "light" : "dark" }]);
  await page.setViewport({ width: 1280, height: 820, deviceScaleFactor: dpr });
  await page.evaluateOnNewDocument(bridgeScript(theme));
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForFunction((t) => document.documentElement.dataset.theme === t && document.querySelector("#btnMenu"), { timeout: 10000 }, theme);
  const lib = await page.$('a[data-act="home"][data-v="library"]');
  if (lib) await lib.click();
  await page.waitForSelector('[data-act="open"][data-dir], [data-act="to-project"][data-dir]', { timeout: 10000 });
  await page.click('[data-act="open"][data-dir], [data-act="to-project"][data-dir]');
  await page.waitForSelector('a[data-act="section"][data-v="paths"]', { timeout: 10000 });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  if (errs.length) throw new Error("Page errors: " + errs.join("; "));
  return page;
}

const INSPECT_SCRIPT = (sel) => {
  const el = document.querySelector(sel);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  return {
    box: { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height },
    overflowX: cs.overflowX,
    overflowY: cs.overflowY,
    resize: cs.resize,
    borderTopWidth: cs.borderTopWidth,
    borderTopStyle: cs.borderTopStyle,
    borderTopColor: cs.borderTopColor,
    borderRadius: cs.borderRadius,
    backgroundColor: cs.backgroundColor,
    backgroundImage: cs.backgroundImage,
    boxShadow: cs.boxShadow,
    rootColorScheme: getComputedStyle(document.documentElement).colorScheme,
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
  };
};

async function settle(page) {
  await page.evaluate(async () => {
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {})));
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
}

async function captureSurface(page, name, sel, theme, dpr) {
  await settle(page);
  const info = await page.evaluate(INSPECT_SCRIPT, sel);
  assert.ok(info, `${name}: element ${sel} not found`);
  const PAD = 10;
  const x = Math.max(0, Math.floor(info.box.left - PAD));
  const y = Math.max(0, Math.floor(info.box.top - PAD));
  const right = Math.min(1280, Math.ceil(info.box.right + PAD));
  const bottom = Math.min(820, Math.ceil(info.box.bottom + PAD));
  const clip = { x, y, width: right - x, height: bottom - y };
  const buf = await page.screenshot({ clip });
  if (STILLS_DIR && dpr === 1) {
    fs.mkdirSync(STILLS_DIR, { recursive: true });
    fs.writeFileSync(path.join(STILLS_DIR, `${name}-${theme}.png`), buf);
  }
  return { info, img: decodePng(buf), ox: info.box.left - clip.x, oy: info.box.top - clip.y };
}

function checkDarkEdge(name, { info, img, ox, oy }, dpr, extra = {}, fails = []) {
  const rec = (ok, msg) => { if (!ok) fails.push(msg); };
  const m = MAIN_DARK[name];
  rec(Math.abs(info.box.width - m.width) <= 0.5, `${name} (${dpr}x): width ${info.box.width} != main ${m.width}`);
  rec(Math.abs(info.box.height - m.height) <= 0.5, `${name} (${dpr}x): height ${info.box.height} != main ${m.height}`);
  rec(info.overflowX === m.overflowX, `${name} (${dpr}x): overflowX ${info.overflowX} != ${m.overflowX}`);
  rec(info.overflowY === m.overflowY, `${name} (${dpr}x): overflowY ${info.overflowY} != ${m.overflowY}`);
  rec(info.resize === m.resize, `${name} (${dpr}x): resize ${info.resize} != ${m.resize}`);
  rec(info.borderRadius === m.radius, `${name} (${dpr}x): borderRadius ${info.borderRadius} != ${m.radius}`);
  rec(info.boxShadow === m.shadow, `${name} (${dpr}x): boxShadow ${info.boxShadow} != ${m.shadow}`);
  rec(info.backgroundColor === "rgb(29, 31, 36)", `${name} (${dpr}x): backgroundColor ${info.backgroundColor} != rgb(29, 31, 36)`);

  // Sample interior ground pixel well inside padding, clear of corner curves and text
  const gxOff = name === "pmpanel" ? info.box.width - 8 : name === "menu" ? 25 : info.box.width * 0.5;
  const gyOff = name === "menu" ? 2.5 : name === "vrmenu" ? 3 : 8;
  const gx = (ox + gxOff) * dpr;
  const gy = (oy + gyOff) * dpr;
  const [gr, gg, gb] = pixelAt(img, gx, gy);
  rec(Math.abs(gr - 29) <= 2 && Math.abs(gg - 31) <= 2 && Math.abs(gb - 36) <= 2,
    `${name} (${dpr}x): interior ground pixel rgb(${gr},${gg},${gb}) != rgb(29,31,36)`);
  const gLum = lum(gr, gg, gb);

  const R = parseFloat(info.borderRadius);
  // Top-middle scan across [oy - 1.0, oy + 4.5]: stays in the shadow gap clear of the band hairline above while catching inset 2nd lines
  const topVals = [];
  const xMid = Math.round((ox + R + 6) * dpr);
  const yStart = Math.max(0, Math.round((oy - 1.0) * dpr));
  const yEnd = Math.min(img.h - 1, Math.round((oy + 4.5) * dpr));
  for (let py = yStart; py <= yEnd; py++) {
    const row = [];
    for (let dx = -3; dx <= 3; dx++) row.push(lumAt(img, xMid + dx, py));
    row.sort((a, b) => a - b);
    topVals.push(row[Math.floor(row.length / 2)]);
  }
  const topPeak = Math.max(...topVals);
  const thresh = gLum + 10;
  const topRuns = countRuns(topVals, thresh);
  rec(topRuns === 1, `${name} (${dpr}x): top-middle lit runs = ${topRuns} (expected 1); peak=${topPeak.toFixed(1)} ground=${gLum.toFixed(1)} vals=[${topVals.map((v) => v.toFixed(0)).join(",")}]`);
  rec(topPeak >= gLum + 55, `${name} (${dpr}x): top rim highlight too dim (${topPeak.toFixed(1)} vs ground ${gLum.toFixed(1)})`);

  // 45-degree corner scan through top-left rounded corner (radius R)
  const cx = (ox + R) * dpr, cy = (oy + R) * dpr;
  const cornerDist = R * dpr;
  const diagVals = [];
  for (let t = cornerDist - 3 * dpr; t <= cornerDist + 3 * dpr; t += 1) {
    const px = cx - t * Math.SQRT1_2;
    const py = cy - t * Math.SQRT1_2;
    diagVals.push(lumAt(img, px, py));
  }
  const cornerPeak = Math.max(...diagVals);
  const cornerRuns = countRuns(diagVals, thresh);
  rec(cornerRuns === 1, `${name} (${dpr}x): 45-deg corner lit runs = ${cornerRuns} (expected 1); peak=${cornerPeak.toFixed(1)}`);

  // Foot luminance vs top luminance (bottom-middle rim highlight on the 1px bottom border above base --line #262a31 L=41.65)
  const LINE_LUM = 41.65;
  const botVals = [];
  const xFoot = Math.round((ox + info.box.width * 0.5) * dpr);
  const yBotStart = Math.max(0, Math.floor((oy + info.box.height - 1.25) * dpr));
  const yBotEnd = Math.min(img.h - 1, Math.floor((oy + info.box.height - 0.25) * dpr));
  for (let py = yBotStart; py <= yBotEnd; py++) {
    const row = [];
    for (let dx = -3; dx <= 3; dx++) row.push(lumAt(img, xFoot + dx, py));
    row.sort((a, b) => a - b);
    botVals.push(row[Math.floor(row.length / 2)]);
  }
  const footPeak = Math.max(...botVals);
  const topHighlight = Math.max(1, Math.max(topPeak, cornerPeak) - LINE_LUM);
  const footRatio = (footPeak - LINE_LUM) / topHighlight;
  rec(footRatio <= 0.25, `${name} (${dpr}x): foot ratio ${footRatio.toFixed(3)} > 0.25 (footPeak=${footPeak.toFixed(1)}, topPeak=${Math.max(topPeak, cornerPeak).toFixed(1)}, gLum=${gLum.toFixed(1)})`);

  // Extra visual checks from designer spec
  if (extra.dotBackdropMaxLum != null) {
    rec(topPeak > extra.dotBackdropMaxLum + 8,
      `${name} (${dpr}x): top ring peak ${topPeak.toFixed(1)} does not clear Paths dot backdrop ${extra.dotBackdropMaxLum.toFixed(1)}`);
  }
  if (extra.scrimCheck) {
    const scrimOutL = lumAt(img, xFoot, Math.min(img.h - 1, Math.round((oy + info.box.height + 5) * dpr)));
    rec(footPeak > scrimOutL + 4 && footPeak > gLum + 4,
      `${name} (${dpr}x): dlg foot ${footPeak.toFixed(1)} too faint over scrim ${scrimOutL.toFixed(1)} / ground ${gLum.toFixed(1)}`);
  }
  return { topRuns, cornerRuns, footRatio, topPeak, footPeak, gLum };
}

async function runSuiteOnPage(browser, url, dpr) {
  const fails = [];
  // ---- DARK THEME ----
  const page = await openCatalogPage(browser, url, "dark", dpr);
  try {
    const csDark = await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme);
    if (csDark !== "dark") fails.push(`dark (${dpr}x): root color-scheme ${csDark} != dark`);

    // Exclusions: pane / sp / bub / dlg.press in dark must NOT get #1d1f24 or rim
    const exCheck = await page.evaluate(() => {
      const pane = document.querySelector(".pane");
      const sp = document.querySelector(".sbar .sp");
      const bub = document.querySelector("#tourInvite.bub");
      const probePress = document.createElement("div");
      probePress.className = "dlg press";
      probePress.hidden = true;
      document.body.appendChild(probePress);
      const pressBg = getComputedStyle(probePress).backgroundColor;
      const pressImg = getComputedStyle(probePress).backgroundImage;
      probePress.remove();
      const probeBub = document.createElement("div");
      probeBub.className = "dlg bub";
      probeBub.hidden = true;
      document.body.appendChild(probeBub);
      const dlgBubImg = getComputedStyle(probeBub).backgroundImage;
      probeBub.remove();
      return {
        paneImg: pane ? getComputedStyle(pane).backgroundImage : null,
        spBg: sp ? getComputedStyle(sp).backgroundColor : null,
        bubImg: bub ? getComputedStyle(bub).backgroundImage : null,
        pressBg,
        pressImg,
        dlgBubImg,
      };
    });
    if (exCheck.paneImg && exCheck.paneImg !== "none") fails.push(`.pane carried backgroundImage=${exCheck.paneImg}`);
    if (exCheck.spBg === "rgb(29, 31, 36)") fails.push(`.sp got #1d1f24 instead of --panel-raised`);
    if (exCheck.bubImg && exCheck.bubImg !== "none") fails.push(`.bub carried backgroundImage=${exCheck.bubImg}`);
    if (exCheck.pressImg !== "none" || exCheck.pressBg === "rgb(29, 31, 36)") fails.push(`.dlg.press leaked rim or #1d1f24`);
    if (exCheck.dlgBubImg !== "none") fails.push(`.dlg.bub carried backgroundImage=${exCheck.dlgBubImg}`);

    // 1. .menu-list
    await page.click("#btnMenu");
    await page.waitForSelector("#menuList:not([hidden])");
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const menuCap = await captureSurface(page, "menu", "#menuList", "dark", dpr);
    checkDarkEdge("menu", menuCap, dpr, {}, fails);

    // 2. .dlg (About cover: not .bub, not .press)
    await page.evaluate(() => document.querySelector('#menuList [data-act="about"]').click());
    await page.waitForSelector("#scrim:not([hidden]) #dlg");
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const dlgCap = await captureSurface(page, "dlg", "#dlg", "dark", dpr);
    checkDarkEdge("dlg", dlgCap, dpr, { scrimCheck: true }, fails);
    await page.keyboard.press("Escape");
    await page.waitForSelector("#scrim[hidden]");

    // 3. .si-pop (#acctPop)
    await page.click("#btnAcct");
    await page.waitForSelector("#acctPop:not([hidden])");
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    /* The account panel hangs under its button in the toolbar row, over the page's own work (the row moved from the title band on
       26 November). The rim's corner is a one-pixel line whose antialiased pixels blend with what lies behind it, so the scan reads
       the panel over the page's plain ground, as it hung over the band's flat colour before. */
    await page.evaluate(() => { document.getElementById("screen").style.visibility = "hidden"; });
    const sipopCap = await captureSurface(page, "sipop", "#acctPop", "dark", dpr);
    await page.evaluate(() => { document.getElementById("screen").style.visibility = ""; });
    checkDarkEdge("sipop", sipopCap, dpr, {}, fails);
    await page.keyboard.press("Escape");

    // 4. .vr-menu (+ scroll check)
    await page.click('a[data-act="section"][data-v="variables"]');
    await page.waitForSelector('[data-act="vr-open"][data-v="TIER"]');
    await page.click('[data-act="vr-open"][data-v="TIER"]');
    await page.waitForSelector('[data-act="vr-fact-menu"]');
    await page.click('[data-act="vr-fact-menu"]');
    await page.waitForSelector(".vr-menu");
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const vrmenuCap = await captureSurface(page, "vrmenu", ".vr-menu", "dark", dpr);
    checkDarkEdge("vrmenu", vrmenuCap, dpr, {}, fails);
    if (!(vrmenuCap.info.scrollHeight > vrmenuCap.info.clientHeight)) fails.push(`.vr-menu (${dpr}x) did not overflow for scroll check`);
    const vrScrolled = await page.evaluate(() => {
      const el = document.querySelector(".vr-menu");
      el.scrollTop = 60;
      return el.scrollTop;
    });
    if (!(vrScrolled > 0)) fails.push(`.vr-menu (${dpr}x) failed to scroll`);
    await page.click("h1");

    // 5. .pm-panel (+ Paths dotted backdrop contrast + scroll check at compact height)
    await page.click('a[data-act="section"][data-v="paths"]');
    await page.waitForSelector('tr[data-act="paths-show"][data-id="c1"]');
    await page.click('tr[data-act="paths-show"][data-id="c1"]');
    await page.waitForSelector("#pmCanvas .pm-node");
    await page.click("#pmCanvas .pm-node");
    await page.waitForSelector("#pmPanel:not([hidden])");
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const pmCap = await captureSurface(page, "pmpanel", "#pmPanel", "dark", dpr);
    let dotMax = 0;
    for (let y = 0; y < Math.max(2, Math.floor((pmCap.oy - 4) * dpr)); y++) {
      for (let x = Math.round(pmCap.ox * dpr); x < Math.min(pmCap.img.w, Math.round((pmCap.ox + 80) * dpr)); x++) {
        const l = lumAt(pmCap.img, x, y);
        if (l > dotMax) dotMax = l;
      }
    }
    checkDarkEdge("pmpanel", pmCap, dpr, { dotBackdropMaxLum: dotMax }, fails);
    if (dpr === 1) {
      const pmScrolled = await page.evaluate(() => {
        const el = document.querySelector("#pmPanel");
        const filler = document.createElement("div");
        filler.style.height = "600px";
        el.appendChild(filler);
        const can = el.scrollHeight > el.clientHeight;
        el.scrollTop = 40;
        const scrolled = el.scrollTop;
        filler.remove();
        return { can, scrolled };
      });
      if (!(pmScrolled.can && pmScrolled.scrolled > 0)) fails.push(`.pm-panel failed to scroll when overflowing`);
    }
  } finally {
    await page.close();
  }

  // ---- LIGHT THEME (parity + color-scheme) ----
  if (dpr === 1) {
    const lpage = await openCatalogPage(browser, url, "light", 1);
    try {
      const csLight = await lpage.evaluate(() => getComputedStyle(document.documentElement).colorScheme);
      if (csLight !== "light") fails.push(`light: root color-scheme ${csLight} != light`);

      const checkLight = async (name, sel) => {
        await lpage.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
        const cap = await captureSurface(lpage, name, sel, "light", 1);
        const m = MAIN_LIGHT[name];
        for (const k of Object.keys(m)) {
          if (cap.info[k] !== m[k]) fails.push(`light ${name}.${k}: ${cap.info[k]} != main ${m[k]}`);
        }
      };

      await lpage.click("#btnMenu");
      await lpage.waitForSelector("#menuList:not([hidden])");
      await checkLight("menu", "#menuList");
      await lpage.evaluate(() => document.querySelector('#menuList [data-act="about"]').click());
      await lpage.waitForSelector("#scrim:not([hidden]) #dlg");
      await checkLight("dlg", "#dlg");
      await lpage.keyboard.press("Escape");
      await lpage.waitForSelector("#scrim[hidden]");

      await lpage.click("#btnAcct");
      await lpage.waitForSelector("#acctPop:not([hidden])");
      await checkLight("sipop", "#acctPop");
      await lpage.keyboard.press("Escape");

      await lpage.click('a[data-act="section"][data-v="variables"]');
      await lpage.waitForSelector('[data-act="vr-open"][data-v="TIER"]');
      await lpage.click('[data-act="vr-open"][data-v="TIER"]');
      await lpage.waitForSelector('[data-act="vr-fact-menu"]');
      await lpage.click('[data-act="vr-fact-menu"]');
      await lpage.waitForSelector(".vr-menu");
      await checkLight("vrmenu", ".vr-menu");
      await lpage.click("h1");

      await lpage.click('a[data-act="section"][data-v="paths"]');
      await lpage.waitForSelector('tr[data-act="paths-show"][data-id="c1"]');
      await lpage.click('tr[data-act="paths-show"][data-id="c1"]');
      await lpage.waitForSelector("#pmCanvas .pm-node");
      await lpage.click("#pmCanvas .pm-node");
      await lpage.waitForSelector("#pmPanel:not([hidden])");
      await checkLight("pmpanel", "#pmPanel");
    } finally {
      await lpage.close();
    }
  }
  if (fails.length) throw new assert.AssertionError({ message: `${fails.length} failure(s):\n  - ` + fails.join("\n  - ") });
}

/* A plant counts only when the suite fails AND its failure names what was planted (`names`: a pattern the message must
   match), so a red from something else cannot pass for the plant. */
async function runPlant(browser, url, label, names, setHtml, fn) {
  const html = fs.readFileSync(INDEX_PATH, "utf8");
  const mutated = fn(html);
  assert.notEqual(mutated, html, `plant ${label}: mutation did not change ui/index.html`);
  setHtml(mutated);
  let said = null;
  try {
    await runSuiteOnPage(browser, url, 1);
  } catch (e) {
    said = String((e && e.message) || e);
  } finally {
    setHtml(null);
  }
  assert.ok(said !== null, `plant ${label} unexpectedly passed!`);
  assert.ok(names.test(said), `plant ${label}: the suite failed, but not for the plant: ${said.slice(0, 400)}`);
  console.log(`  plant ${label}: caught, and the failure names it (${(said.match(names) || [""])[0].split("\n")[0].slice(0, 90)})`);
}

let overrideHtml = null;
const { srv, url } = await startServer(() => overrideHtml);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
try {
  for (const dpr of [1, 2]) {
    await runSuiteOnPage(browser, url, dpr);
    console.log(`studio-one-line: ${dpr}x dark (5 surfaces) + light checks passed`);
  }
  if (PLANTS_OFF) {
    console.log("plants: NOT RUN (ETIUDA_PLANTS=off)");
  } else {
    await runPlant(browser, url, "remove-rim-pm-panel", /pmpanel [(]1x[)]: top rim highlight too dim/, (h) => overrideHtml = h, (html) =>
      html.replaceAll(":root[data-theme=dark] .pm-panel", ":root[data-theme=dark] .never-pm-panel"));
    await runPlant(browser, url, "overflow-clip", /pmpanel [(]1x[)]: overflowX clip != auto/, (h) => overrideHtml = h, (html) =>
      html.replace(".pm-panel{position:absolute;right:14px;bottom:14px;width:360px;max-height:calc(100% - 28px);overflow:auto;",
        ".pm-panel{position:absolute;right:14px;bottom:14px;width:360px;max-height:calc(100% - 28px);overflow:clip;"));
    /* The likely slip: the surface's own border left opaque under the ring, so the old line shows where the ring should. */
    await runPlant(browser, url, "second-line-border", /menu [(]1x[)]: top rim highlight too dim[^]*pmpanel [(]1x[)]: top rim highlight too dim/, (h) => overrideHtml = h, (html) =>
      html.replace("    border-color:transparent;\n    background-image:linear-gradient(var(--win-raised),var(--win-raised)),var(--rim),",
        "    background-image:linear-gradient(var(--win-raised),var(--win-raised)),var(--rim),"));
    await runPlant(browser, url, "drop-light-color-scheme", /light: root color-scheme normal != light/, (h) => overrideHtml = h, (html) =>
      html.replace("color-scheme:light", "color-scheme:normal"));
  }
  console.log("studio-one-line: OK");
} finally {
  await browser.close();
  srv.close();
}
