/* THE FADE REACHES THE DOTS AND NOTHING ELSE (board 1019 (9), Max, 2026-11-21: "the dots' fading near text sometimes hides real interface elements").
 *
 *     node tests/dots-ground-only.mjs [--shots <folder>]
 *
 * gate-kind: node
 *
 * THE CRITERION. The clearing the pass lays round words, icons and controls (.dg-hug, .dg-ic, .dg-ctrl) belongs to the backdrop's dots and
 * only to them: no heading, label, control or text is ever faded, clipped or masked by it, in either theme.
 * HOW IT IS HELD, so a second tool can redo it. Each screen the walk finds is shot twice at one device pixel to a CSS pixel with the dot
 * field off in both: as it is, and with the clearing taken out (.dg-hug and .dg-ic without ground or spread, .dg-ctrl without its layer).
 * With no dots to clear, the clearing is the page's own colour on the page's own colour, so the two shots are the same picture: a pixel
 * whose channel differs by 6 or more is a pixel the clearing painted over something that is not the dots. Counted as clusters of such
 * pixels (within 3 px of each other), per screen, width and theme. Headless Chrome via puppeteer-core, no Electron window.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import * as Studio from "../src/studio.mjs";
import * as Engine from "../src/engine.mjs";
import { copyPlants } from "./plant-copy.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
const SELF = fileURLToPath(import.meta.url);
const HERE = path.dirname(SELF);
const ROOT = path.resolve(HERE, "..");
const HTML_FILE = process.env.DOTS_GROUND_HTML ? path.resolve(process.env.DOTS_GROUND_HTML) : path.join(ROOT, "ui", "index.html");
const SCRATCH = path.join(ROOT, "scratch", "dots-ground-only");
const shotsAt = process.argv.indexOf("--shots");
const SHOTS = shotsAt > 0 ? path.resolve(process.argv[shotsAt + 1] || "") : "";
const ONLY = process.env.DOTS_GROUND_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const GR1 = ONLY === "gr1";   /* the planted-fault run: the screens that show it, light, 1280 */
const WIDTHS = GR1 ? [1280] : process.env.DOTS_GROUND_W ? [Number(process.env.DOTS_GROUND_W)] : [1280, 900], THEMES = GR1 ? ["light"] : ["light", "dark"], HEIGHT = 1400;
const executablePath = [process.env.ETIUDA_CHROME, "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe", "/usr/bin/google-chrome", "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].filter(Boolean).find((p) => fs.existsSync(p));
if (!executablePath) { process.stderr.write("No Chrome browser found to drive\n"); process.exit(1); }
const DEBUG = !!process.env.DOTS_GROUND_DEBUG;
let checks = 0, fails = 0, skipped = 0;
function skip(line) { skipped++; process.stdout.write("  SKIP  " + line + "\n"); }
function check(ok, line, detail) {
  checks++;
  if (ok) process.stdout.write("  ok   " + line + "\n");
  else { fails++; process.stdout.write("  FAIL " + line + (detail ? ": " + JSON.stringify(detail).slice(0, 1600) : "") + "\n"); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const wire = (p) => Promise.resolve(p).then((v) => JSON.parse(JSON.stringify(Object.assign({ error: null }, v))));

async function fixtures() {
  clearScratch(SCRATCH);
  const root = path.join(SCRATCH, "projects");
  fs.mkdirSync(root, { recursive: true });
  const made = await Studio.newProject(root, "Harbour lamps", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }]);
  const dir = made.dir;
  const tag = async (en, pl) => (await Studio.addTag(dir, "shelf", { en, pl })).tag.id;
  const delivery = await tag("Delivery", "Dostawa"), returns = await tag("Returns", "Zwroty"), care = await tag("Care", "Pielęgnacja");
  const CARDS = [[delivery, "Courier costs", "Delivery by courier costs 14 zł, and is free above 200 zł."], [delivery, "Parcel lockers", "A parcel locker holds the lamp for 48 hours."],
    [delivery, "Delivery abroad", "We send to every country of the European Union within 7 working days."], [returns, "Returns window", "A lamp can be returned within 30 days of delivery."],
    [returns, "Return label", "The return label comes by email within one working day."], [care, "Cleaning brass", "Brass is cleaned with a dry cloth, never with water."],
    [care, "Changing the bulb", "The bulb is an E27, up to 40 W."]];
  for (const [t, title, body] of CARDS) await Studio.addCard(dir, t, title, body);
  /* a few hundred more cards, for the pass's cost on the largest screen */
  const F = await Engine.format();
  const draft = JSON.parse(fs.readFileSync(path.join(dir, "draft.json"), "utf8"));
  const proposal = (name, change) => {
    const p = JSON.parse(JSON.stringify(draft)); p.modified = true; change(p); delete p.hash; delete p.sig; p.hash = F.contentHash(p);
    const inbox = path.join(dir, "inbox"); fs.mkdirSync(inbox, { recursive: true });
    const file = path.join(inbox, name); fs.writeFileSync(file, JSON.stringify(p, null, 1) + "\n", "utf8"); return file;
  };
  const card = (p, title) => p.cards.find((c) => JSON.stringify(c).includes(title));
  const f1 = proposal("desk-4.ec", (p) => { card(p, "Courier costs").body.en = "Delivery by courier costs 16 zł, and is free above 200 zł.";
    card(p, "Returns window").body.en = "A lamp can be returned within 30 days of delivery, in its box."; card(p, "Cleaning brass").body.en = "Brass is cleaned with a dry, soft cloth, never with water or polish.";
    const d = card(p, "Changing the bulb"); p.cards = p.cards.filter((x) => x !== d); });
  const f2 = proposal("desk-7.ec", (p) => { card(p, "Parcel lockers").body.en = "A parcel locker holds the lamp for 72 hours."; });
  const list = await wire(Studio.listProposals(dir, {}));
  const opens = {};
  for (const f of [f1, f2]) opens[path.basename(f)] = await wire(Studio.openProposal(dir, f, {}));
  const opened = await wire(Studio.openProject(dir));
  const catalogs = [{ id: "harbour", name: "Harbour lamps", dir, rev: 0, counts: { cards: CARDS.length }, langs: ["en", "pl"],
    changes: 0, checks: 0, opened: "2026-11-11T10:00:00.000Z", edited: "2026-11-11T10:00:00.000Z" }];
  /* a second catalog of a few hundred cards: the Cards screen the pass's cost is read on */
  const bigMade = await Studio.newProject(root, "Big lamps", [{ code: "en", name: "English" }]);
  const bigTag = (await Studio.addTag(bigMade.dir, "shelf", { en: "Questions" })).tag.id;
  for (let i = 0; i < 260; i++) await Studio.addCard(bigMade.dir, bigTag, "Lamp question " + (i + 1), "Answer " + (i + 1) + " about a lamp, its bulb and its brass.");
  const bigOpened = await wire(Studio.openProject(bigMade.dir));
  const big = { catalogs: [{ id: "big", name: "Big lamps", dir: bigMade.dir, rev: 0, counts: { cards: 260 }, langs: ["en"], changes: 0, checks: 0,
    opened: "2026-11-11T10:00:00.000Z", edited: "2026-11-11T10:00:00.000Z" }], opened: bigOpened, list: { error: null, inbox: "", proposals: [] }, opens: {} };
  return { dir, catalogs, opened, list, opens, big };
}

const SIGN_HELD = { licence: { status: "none", trial: null, unusable: null }, grant: null, by: null, checked: null, keyChanged: false, hasKey: true,
  signing: { keyId: "", problem: null }, signIn: ["microsoft", "google"], provider: null, signinAsk: false, signinCode: null, signinOwner: false };

async function boot(browser, fx, o) {
  const page = await browser.newPage();
  await page.bringToFront();
  await page.setViewport({ width: o.width, height: HEIGHT });
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
  await page.evaluateOnNewDocument((fx, door, held) => {
    const base = {
      host: async () => Object.assign({ version: "0.1.0", tour: { offered: true, taken: true, at: 0 } }, door ? { signIn: held.signIn } : {}),
      projects: async () => ({ root: "C:/studio", projects: fx.catalogs, sample: "" }),
      teams: async () => ({ teams: [{ id: "North quay", projects: [{ id: "harbour", dir: fx.catalogs[0].dir, name: "" }], catalogs: ["harbour"], teammates: [
        { id: "ada", name: "Ada", admitted: true, kind: "desk", version: "2.0.0", lastHeard: "2026-11-15T09:12:00.000Z", statistics: true, catalog: { title: "Harbour lamps", rev: 12, behind: true } },
        { id: "bartholomew-front-desk", name: "Bartholomew Wiśniewski", admitted: true, kind: "studio", version: "2.0.0", lastHeard: "2026-11-14T17:40:00.000Z", catalog: { title: "Harbour lamps", rev: 12 } },
        { id: "cora", name: "Cora", admitted: false }] }] }),
      open: async () => fx.opened, proposals: async () => fx.list,
      proposalOpen: async (dir, file) => fx.opens[String(file).split(/[\\/]/).pop()] || { error: "not found" },
      licence: async () => Object.assign({ error: null }, door ? held : { licence: { status: "none", trial: null, unusable: null }, signIn: [] }),
      onMaximized: () => {}, onTrayGo: () => {}, onOpenDir: () => {}, onTask: () => {}, onTeamMoved: () => {}, onRelayLapse: () => {}, onRelaySyncNote: () => {},
    };
    window.STUDIO = new Proxy(base, { get(t, k) {
      if (k in t) return t[k];
      if (typeof k !== "string" || k === "then") return undefined;
      return /^on[A-Z]/.test(k) ? () => {} : async () => ({ error: null });
    } });
  }, fx, !!o.door, SIGN_HELD);
  page.on("pageerror", (e) => { if (DEBUG) process.stderr.write("pageerror " + e.message + "\n"); });
  await page.goto("file:///" + HTML_FILE.replace(/\\/g, "/"), { waitUntil: "load" });
  await page.waitForSelector(o.door ? ".si-door" : "#rail a", { timeout: 10000 });
  await page.waitForFunction(() => !document.querySelector(".e-launch-veil"), { timeout: 12000 }).catch(() => {});
  /* the two shots of a case differ by the dots alone: a colour that is still turning after a theme change would differ as well */
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none !important;animation:none !important}" });
  await sleep(300);
  return page;
}

const press = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); if (e) e.click(); return !!e; }, sel);

/* The screens, each reached by the rail's own links; a catalog's own links are read off its rail. */
async function walkScreens(page, visit) {
  const go = async (key, sel, extra) => { const ok = await press(page, sel); await sleep(extra || 750); if (ok) await visit(key); return ok; };
  await go("overview", '#rail [data-act="home"][data-v="overview"]');
  await go("settings", '#rail [data-act="settings"]', 1000);
  await go("maintenance", '[data-act="to-screen"][data-v="maintenance"]', 1200);
  await press(page, '[data-act="close-screen"][data-v="maintenance"]'); await sleep(300);
  await press(page, '[data-act="close-screen"][data-v="settings"]'); await sleep(500);
  await go("library", '#rail [data-act="home"][data-v="library"]');
  await page.evaluate(() => { const b = document.createElement("button"); b.setAttribute("data-act", "to-teams"); b.hidden = true; document.querySelector("#main").appendChild(b); b.click(); });
  await sleep(800); await visit("teams");
  await press(page, '#rail [data-act="home"][data-v="library"]'); await sleep(700);
  await press(page, '#main [data-act="open"]'); await sleep(1500);
  const links = await page.evaluate(() => [...document.querySelectorAll("#rail a[data-v]")].map((a) => a.getAttribute("data-v")));
  for (const v of links) if (v !== "proposals") await go("rail:" + v, '#rail a[data-v="' + v + '"]');
  await go("proposals", '#rail a[data-v="proposals"]', 1200);
  await go("proposal-open", '#main [data-act="rv-open"]', 1200);
  await go("one-at-a-time", '#main [data-act="rv-one"]', 1000);
  await page.keyboard.press("Escape"); await sleep(400);
}
async function setTheme(page, theme) {
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
  await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
  /* a screen that slides in again after a theme change (the review's aside does, at 900 px) has to have settled before the two shots */
  await sleep(500);
}


/* the dot field off in both shots; the clearing out in the second */
const MIN_GAP = Number(process.env.DOTS_GROUND_GAP) || 6;
const OFF = "#main,.si-door .l{background-image:none !important}";
const CLEAR = ".dg-hug{background:none !important;box-shadow:none !important}.dg-ic:not(.empty-ic){background:none !important;box-shadow:none !important}.dg-ctrl::after{display:none !important}";
const PIXELS = async (MIN, a64, b64, R) => {
  const load = (x) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = "data:image/png;base64," + x; });
  const [ia, ib] = await Promise.all([load(a64), load(b64)]);
  const px = (img) => { const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const q = c.getContext("2d"); q.drawImage(img, 0, 0); return q.getImageData(0, 0, img.width, img.height); };
  const A = px(ia), B = px(ib), W = A.width, H = A.height, seen = new Uint8Array(W * H), out = [];
  const inR = (k) => { const x = k % W, y = (k - x) / W; return x >= R[0] && x < R[2] && y >= R[1] && y < R[3]; };
  const gap = (k) => Math.max(Math.abs(A.data[k * 4] - B.data[k * 4]), Math.abs(A.data[k * 4 + 1] - B.data[k * 4 + 1]), Math.abs(A.data[k * 4 + 2] - B.data[k * 4 + 2]));
  const differs = (k) => inR(k) && gap(k) >= MIN;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (seen[i] || !differs(i)) continue;
    const box = { x0: x, y0: y, x1: x, y1: y, n: 0, max: 0 }, st = [i]; seen[i] = 1;
    while (st.length) {
      const j = st.pop(), jx = j % W, jy = (j - jx) / W; box.n++; box.max = Math.max(box.max, gap(j));
      box.x0 = Math.min(box.x0, jx); box.x1 = Math.max(box.x1, jx); box.y0 = Math.min(box.y0, jy); box.y1 = Math.max(box.y1, jy);
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
        const nx = jx + dx, ny = jy + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const k = ny * W + nx; if (seen[k] || !differs(k)) continue;
        seen[k] = 1; st.push(k);
      }
    }
    out.push(box);
  }
  return out;
};
async function diffOf(helper, page, ground) {
  const R = await page.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return [Math.max(0, Math.floor(r.left)), Math.max(0, Math.floor(r.top)), Math.floor(r.right), Math.floor(r.bottom)]; }, ground);
  const off = await page.addStyleTag({ content: OFF });
  let a = await page.screenshot({ encoding: "base64" });
  for (let i = 0; i < 8; i++) { await sleep(250); const a2 = await page.screenshot({ encoding: "base64" }); const same = a2 === a; a = a2; if (same) break; }
  const clear = await page.addStyleTag({ content: CLEAR });
  const b = await page.screenshot({ encoding: "base64" });
  await page.evaluate((x) => x.remove(), clear);
  await page.evaluate((x) => x.remove(), off);
  const boxes = await helper.evaluate(PIXELS, MIN_GAP, a, b, R);
  const named = await page.evaluate((boxes) => boxes.slice(0, 12).map((b) => {
    const e = document.elementFromPoint((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2);
    return { box: [b.x0, b.y0, b.x1, b.y1], px: b.n, max: b.max, under: e ? e.tagName.toLowerCase() + "." + String(e.className).trim().split(/\s+/).join(".") + " " + (e.textContent || "").trim().slice(0, 30) : "" };
  }), boxes);
  return { n: boxes.length, px: boxes.reduce((s, b) => s + b.n, 0), named, a64: a, b64: b };
}

async function main() {
  const fx = await fixtures();
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--hide-scrollbars", "--no-sandbox", "--allow-file-access-from-files", "--disable-lcd-text"] });
  try {
    const helper = await browser.newPage();
    await helper.goto("about:blank");
    for (const width of WIDTHS) {
      const door = await boot(browser, fx, { width, door: true });
      for (const theme of THEMES) {
        await setTheme(door, theme);
        const d = await diffOf(helper, door, ".si-door .l");
        check(d.n === 0, "gr1 door " + width + " " + theme + ": the clearing paints only the ground (" + d.n + " clusters, " + d.px + " pixels over something else)", d.named);
      }
      await door.close();
      const page = await boot(browser, fx, { width, door: false });
      const visit = async (key) => {
        if (GR1 ? !/paths|proposals|library/.test(key) : (ONLY && !key.includes(ONLY))) return;
        if (process.env.DOTS_GROUND_DUMP) process.stdout.write(key + ": " + await page.evaluate((q) => { const e = document.querySelector(q); return e ? e.outerHTML : "none"; }, process.env.DOTS_GROUND_DUMP) + "\n");
        for (const theme of THEMES) {
          await setTheme(page, theme);
          const d = await diffOf(helper, page, "#main");
          check(d.n === 0, "gr1 " + key + " " + width + " " + theme + ": the clearing paints only the ground (" + d.n + " clusters, " + d.px + " pixels over something else)", d.named);
          if (SHOTS && d.n) { const nm = path.join(SHOTS, key.replace(/[^a-z0-9-]+/gi, "_") + "-" + width + "-" + theme); fs.writeFileSync(nm + "-A.png", Buffer.from(d.a64, "base64")); fs.writeFileSync(nm + "-B.png", Buffer.from(d.b64, "base64")); }
        }
        await setTheme(page, "light");
      };
      await walkScreens(page, visit);
      await page.close();
    }
  } finally {
    await browser.close();
    dropScratch(SCRATCH, "tests/dots-ground-only.mjs");
  }
}
function plantPhase() {
  if (ONLY) return;
  copyPlants({
    root: ROOT, self: SELF, label: "dots-ground-only", onlyVar: "DOTS_GROUND_ONLY", check, skip, timeout: 240000,
    plants: [
      /* the clearing back in the page's flow: it paints over the border of the box below a heading */
      { mark: "dots-under-all", leg: "gr1", rel: "ui/index.html", line: "  position:relative;z-index:auto; /* plant:dots-under-all */" },
      /* the words back in the patch's own layer: a line's patch paints over the descenders of the line above */
      { mark: "dots-words-above", leg: "gr1", rel: "ui/index.html", line: ".dg-t{position:static; /* plant:dots-words-above */}" },
    ],
  });
}
main().then(() => {
  plantPhase();
  process.stdout.write("#counts checks=" + checks + " skipped=" + skipped + " failed=" + fails + "\n");
  process.stdout.write(fails ? "dots-ground-only: " + fails + " of " + checks + " FAILED\n" : "dots-ground-only: all " + checks + " checks hold\n");
  process.exit(fails ? 1 : 0);
}).catch((e) => { process.stderr.write(String(e && e.stack || e) + "\n"); process.exit(2); });
