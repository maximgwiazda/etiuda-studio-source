/* THE DOTS GIVE WAY ONLY WHERE THE WORDS ARE (the product owner's two notes of 2026-11-15, on the built screens).
 *
 *     node tests/dots-hug.mjs [--shots <folder>]
 *
 * gate-kind: node
 *
 * THE CRITERION. Max, 2026-11-15: "I really like how backgrounds dots disappear when there is something in front." Then: "Dots
 * should only disappear when in the direct vicinity of the text. I think it would be sufficient if the rectangle which blocks
 * dots behind the text was the size of the text and no wider." Claude alpha's test for it: no dot crosses or crowds a letter,
 * an icon or a control on a dotted ground, in both themes, at any window size, for text that arrives later too; and the dots
 * give way only where the words are: the cleared ground under a text is as wide as each line of its words and no wider.
 *
 * HOW A THING IS COUNTED, so a second tool can redo it. The ground is #main (the work area's dots) and, on the sign-in door, its
 * left half (.si-door .l). A THING ON THE GROUND is each non-blank text node whose parent element is visible, each svg and img,
 * and each control (button, a, input, select, textarea, .chip, kbd, .btn, .seg, [role=button], .cell-chip, .count) that is
 * visible and inside the window, with no element between it and the ground (itself and the ground's own box excluded) whose
 * computed background-color has an alpha of 0.95 or more. A control that holds a text counts once, as the control. A text is a
 * line per Range rectangle group (rectangles whose tops lie within 4 px and which touch within 8 px join). This is the product
 * designer's scan (etiuda-dots-2026-11-15/source/lib.js) unchanged in what it counts.
 *   dh1 MISSES: the things on the ground in the sense above. A hugged word has the cleared ground as its parent, which is
 *       opaque, so it is no longer on the ground; a thing left on it is a miss. Counted per screen.
 *   dh2 NO WIDER THAN THE WORDS: for each element in the work area whose computed background is the page's own colour (the
 *       probe's var(--bg)) with a box-shadow spread above 0 (a cleared ground), and for each line of the words under it (the
 *       text nodes' Range lines, as above), the cleared box that holds the line (one of getClientRects() of the element whose
 *       vertical extent holds the line's middle) ends within 1.5 px of the line's last letter, and starts within 1.5 px of its
 *       first. A block patch is one box for every line of a wrapped paragraph, so a short last line is over by the rest of the
 *       width. Counted as offending lines.
 *   dh3 NO DOT CROSSES OR CROWDS A LETTER, read from the screen: the window is shot twice, as it is and with the dot field
 *       taken off (background-image none on the ground), headless at one device pixel to a CSS pixel. A dot of the 16 px lattice
 *       (centre 8 px into each tile of the ground's padding box) is SHOWN where, in the 3 by 3 pixels round its centre, any
 *       channel differs by 6 or more between the two shots. A shown dot CROWDS a thing when its centre is within 2.7 px (the dot's
 *       1.2 px radius and 1.5 px of air) of a line of words or of an icon, and CROSSES it when inside. Counted as shown dots.
 *   dh4 WHAT THE EYE SEES: on the door's left half and on a two-line case, in each theme, the dots in a strip directly right of a
 *       short last line (one row of the lattice whose centre lies in the line's height, 6 dots wide, from 4 px past the line's last
 *       letter's cleared edge) are all shown, as many as in an untouched strip of the same size on the empty ground beside it.
 * THE SCREENS are listed in SCREENS below and found by walking the rail; the walk lists the ones it finds, at 1280 and at 900
 * px wide, each in both themes. THE PLANTS (tests/plant-copy.mjs) are in a scratch copy of the tree: the block patch put back
 * turns dh2 and dh4 red, and the pass's wiring taken out turns dh1 red.
 *
 * Node only, headless Chrome via puppeteer-core, no Electron window.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import * as Studio from "../src/studio.mjs";
import * as Engine from "../src/engine.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { copyPlants } from "./plant-copy.mjs";

const SELF = fileURLToPath(import.meta.url);
const HERE = path.dirname(SELF);
const ROOT = path.resolve(HERE, "..");
const HTML_FILE = process.env.DOTS_HUG_HTML ? path.resolve(process.env.DOTS_HUG_HTML) : path.join(ROOT, "ui", "index.html");
const SCRATCH = path.join(ROOT, "scratch", "dots-hug");
const ONLY = process.env.DOTS_HUG_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const shotsAt = process.argv.indexOf("--shots");
const SHOTS = shotsAt > 0 ? path.resolve(process.argv[shotsAt + 1] || "") : "";
const DEBUG = !!process.env.DOTS_HUG_DEBUG;

const WIDTHS = [1280, 900];
const THEMES = ["light", "dark"];
const HEIGHT = 1400;
const SPREAD = 3;
/* Per width and theme: dh1, dh2, dh3 (3 x 4); dh4 per theme on two cases (4); dh5 the late text per theme (2); dh6 the cost; dh7 the
   source guard; the three plants and the checkout after them (4); and dh0 that every leg ran. */
const EXPECTED = 12 + 4 + 2 + 1 + 1 + 4 + 1 + 4 + 2 + 3 + 3;

const executablePath = [process.env.ETIUDA_CHROME, "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe", "/usr/bin/google-chrome", "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].filter(Boolean).find((p) => fs.existsSync(p));
if (!executablePath) { process.stderr.write("No Chrome browser found to drive\n"); process.exit(1); }

let checks = 0, fails = 0, skipped = 0;
function skip(line) { skipped++; process.stdout.write("  SKIP  " + line + "\n"); }
function check(ok, line, detail) {
  checks++;
  if (ok) process.stdout.write("  ok   " + line + "\n");
  else { fails++; process.stdout.write("  FAIL " + line + (detail ? ": " + JSON.stringify(detail).slice(0, 1600) : "") + "\n"); }
}
const want = (id) => !ONLY || ONLY === id || (ONLY === "dh89" && (id === "dh8" || id === "dh9"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const wire = (p) => Promise.resolve(p).then((v) => JSON.parse(JSON.stringify(Object.assign({ error: null }, v))));

/* ---- the page's side: measures, injected into every page before the page's own script ---------------------------------- */
function pageLib() {
  const alphaOf = (c) => {
    if (!c || c === "transparent") return 0;
    let m = c.match(/\/\s*([\d.]+%?)\s*\)/);
    if (m) return m[1].endsWith("%") ? parseFloat(m[1]) / 100 : parseFloat(m[1]);
    m = c.match(/^rgba\(([^)]+)\)/);
    if (m) return parseFloat(m[1].split(",")[3]);
    return 1;
  };
  /* a thing with the page's colour laid under its tint (.dg-ctrl, whose ::after is the ground) counts as a ground of its own */
  const opaque = (e) => alphaOf(getComputedStyle(e).backgroundColor) >= 0.95 || (e.classList.contains("dg-ctrl") && alphaOf(getComputedStyle(e, "::after").backgroundColor) >= 0.95);
  const vis = (e) => {
    if (!e.getClientRects().length) return false;
    const cs = getComputedStyle(e);
    if (cs.visibility === "hidden" || +cs.opacity === 0) return false;
    const r = e.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && r.width > 0 && r.height > 0;
  };
  const onGround = (el, root) => { for (let e = el; e && e !== root; e = e.parentElement) if (opaque(e)) return false; return true; };
  /* an icon is a glyph of 96 px or less each way: a drawing as large as a map is no icon */
  const isIcon = (e) => { const r = e.getBoundingClientRect(); return r.width <= 96 && r.height <= 96; };
  const CTRL = "button,a,input,select,textarea,.chip,kbd,.btn,.seg,[role=button],.cell-chip,.count";
  const lines = (rects) => {
    const out = [];
    for (const r of rects) {
      if (r.width < 1 || r.height < 1) continue;
      const o = out.find((q) => Math.abs(q.y - r.top) < 4 && r.left <= q.x + q.w + 8 && r.right >= q.x - 8);
      if (o) { const x2 = Math.max(o.x + o.w, r.right), y2 = Math.max(o.y + o.h, r.bottom); o.x = Math.min(o.x, r.left); o.y = Math.min(o.y, r.top); o.w = x2 - o.x; o.h = y2 - o.y; }
      else out.push({ x: r.left, y: r.top, w: r.width, h: r.height });
    }
    return out;
  };
  const textNodes = (root) => { const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), out = []; let n; while ((n = tw.nextNode())) if (n.nodeValue.trim()) out.push(n); return out; };
  const linesOf = (nodes) => { const all = []; for (const n of nodes) { const rg = document.createRange(); rg.selectNodeContents(n); all.push(...rg.getClientRects()); } return lines(all); };
  const label = (e) => (/^svg$/i.test(e.tagName) && e.parentElement ? "in " + e.parentElement.tagName.toLowerCase() + "." + String(e.parentElement.className).trim().split(/\s+/).join(".") + " > " : "") + e.tagName.toLowerCase() + (e.className && typeof e.className === "string" ? "." + e.className.trim().split(/\s+/).join(".") : "") + ":" + (e.textContent || "").trim().slice(0, 24);
  /* the product designer's scan: what stands on the ground with nothing opaque between it and the dots */
  const scan = (root) => {
    const out = [], seen = new Set();
    const ctrlOf = (el) => { const c = el.closest(CTRL); return c && c !== root && root.contains(c) ? c : null; };
    const addCtrl = (c) => { if (seen.has(c) || !vis(c)) return; seen.add(c); out.push({ kind: "control", el: c }); };
    for (const n of textNodes(root)) {
      const el = n.parentElement;
      if (!el || !vis(el) || !onGround(el, root)) continue;
      const c = ctrlOf(el);
      if (c) { addCtrl(c); continue; }
      const rg = document.createRange(); rg.selectNodeContents(n);
      if (lines([...rg.getClientRects()]).length) out.push({ kind: "text", el });
    }
    root.querySelectorAll("svg,img").forEach((e) => { if (!vis(e) || !onGround(e, root) || !isIcon(e)) return; const c = ctrlOf(e); if (c) return addCtrl(c); out.push({ kind: "icon", el: e }); });
    root.querySelectorAll(CTRL).forEach((c) => { if (seen.has(c) || !vis(c) || !onGround(c, root)) return; if (alphaOf(getComputedStyle(c).backgroundColor) > 0) addCtrl(c); });
    return out;
  };
  const pageBg = () => { const p = document.createElement("div"); p.style.cssText = "background:var(--bg);position:absolute;width:1px;height:1px"; document.body.appendChild(p); const c = getComputedStyle(p).backgroundColor; p.remove(); return c; };
  const spreadOf = (shadow) => { let best = 0; for (const m of String(shadow || "").matchAll(/(-?[\d.]+)px (-?[\d.]+)px (-?[\d.]+)px (-?[\d.]+)px/g)) best = Math.max(best, parseFloat(m[4]) + Math.abs(parseFloat(m[1]))); return best; };
  /* the cleared grounds: an element of the page's own colour with a spread, and each line of its words against the box that holds it */
  const wide = (root) => {
    const bg = pageBg(), bad = [], grounds = [];
    root.querySelectorAll("*").forEach((p) => {
      const cs = getComputedStyle(p);
      if (cs.backgroundColor !== bg || !(spreadOf(cs.boxShadow) > 0) || !vis(p)) return;
      const frags = [...p.getClientRects()].filter((r) => r.width > 1 && r.height > 1);
      const ls = linesOf(textNodes(p).filter((n) => n.parentElement && vis(n.parentElement)));
      if (!ls.length) return;
      grounds.push(p);
      for (const L of ls) {
        const cy = L.y + L.h / 2, f = frags.find((q) => cy >= q.top && cy <= q.bottom);
        if (!f) continue;
        const over = Math.max(f.right - (L.x + L.w), L.x - f.left);
        if (over > 1.5) bad.push({ el: label(p), over: Math.round(over), line: Math.round(L.w), box: Math.round(f.width) });
      }
    });
    return { n: grounds.length, bad };
  };
  /* the things dots must not cross: every line of words and every icon in the window under root, whatever stands over them,
     cut to what a scrolling or clipping ancestor shows of it */
  const clipped = (el, r, root) => {
    let x0 = r.x, y0 = r.y, x1 = r.x + r.w, y1 = r.y + r.h;
    for (let e = el; e && e !== root; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.overflowX === "visible" && cs.overflowY === "visible") continue;
      const b = e.getBoundingClientRect();
      if (cs.overflowX !== "visible") { x0 = Math.max(x0, b.left + e.clientLeft); x1 = Math.min(x1, b.left + e.clientLeft + e.clientWidth); }
      if (cs.overflowY !== "visible") { y0 = Math.max(y0, b.top + e.clientTop); y1 = Math.min(y1, b.top + e.clientTop + e.clientHeight); }
    }
    return x1 > x0 && y1 > y0 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
  };
  /* what stands on a surface of its own (a pane, a table, a button: an opaque ground that is not a cleared patch) has no dots behind it
     and is not the dots' business; a dot beside the surface's edge is beside the surface */
  const onSurface = (el, root, bg) => { for (let e = el; e && e !== root; e = e.parentElement) { const cs = getComputedStyle(e); if (alphaOf(cs.backgroundColor) >= 0.95 && cs.backgroundColor !== bg) return true; } return false; };
  const things = (root) => {
    const out = [], bg = pageBg();
    for (const n of textNodes(root)) {
      const el = n.parentElement;
      if (!el || !vis(el) || onSurface(el, root, bg)) continue;
      for (const l of linesOf([n])) { const c = clipped(el, l, root); if (c) out.push({ x: c.x, y: c.y, w: c.w, h: c.h, k: "text", t: n.nodeValue.trim().slice(0, 20) }); }
    }
    root.querySelectorAll("svg,img").forEach((e) => {
      if (!vis(e) || onSurface(e, root, bg) || !isIcon(e)) return;
      const r = e.getBoundingClientRect(), c = clipped(e, { x: r.left, y: r.top, w: r.width, h: r.height }, root);
      if (c) out.push({ x: c.x, y: c.y, w: c.w, h: c.h, k: "icon", t: e.tagName + " in " + (e.parentElement ? e.parentElement.tagName.toLowerCase() + "." + String(e.parentElement.className).trim().split(/\s+/).join(".") : "") });
    });
    return out;
  };
  const lattice = (ground) => {
    const r = ground.getBoundingClientRect(), ox = r.left + ground.clientLeft, oy = r.top + ground.clientTop, pts = [];
    const x1 = Math.min(ox + ground.clientWidth, innerWidth), y1 = Math.min(oy + ground.clientHeight, innerHeight);
    for (let y = oy + 8; y < y1; y += 16) for (let x = ox + 8; x < x1; x += 16) if (x > 0 && y > 0) pts.push([x, y]);
    return { pts, ox, oy };
  };
  const sig = (e) => e.tagName.toLowerCase() + (typeof e.className === "string" && e.className.trim() ? "." + e.className.trim().split(/\s+/).slice(0, 3).join(".") : "");
  /* dh8: what stands between a ground-holding thing and the dot ground: ancestors with a tint (an alpha above 0 at rest), and the
     distinct alpha-0 ones, marked for the pointer to be put over */
  const ancestors = (root) => {
    const rest = [], seen = new Map(), things = [...root.querySelectorAll(".dg-hug,.dg-ic,.dg-ctrl")].filter(vis);
    for (const t of things) for (let e = t.parentElement; e && e !== root; e = e.parentElement) {
      if (e.classList.contains("dg-hug") || e.classList.contains("dg-item")) continue;
      const a = alphaOf(getComputedStyle(e).backgroundColor);
      if (a >= 0.95) break;
      if (a > 0) rest.push(sig(e) + " " + a.toFixed(2)); else if (!seen.has(sig(e)) && seen.size < 40) seen.set(sig(e), e);
    }
    const marked = [];
    let i = 0;
    for (const [k, e] of seen) {
      e.setAttribute("data-dgq", "a" + i);
      const r = e.getBoundingClientRect(), x0 = Math.max(r.left, 0), x1 = Math.min(r.right, innerWidth), y0 = Math.max(r.top, 0), y1 = Math.min(r.bottom, innerHeight);
      if (x1 > x0 && y1 > y0) marked.push({ q: "a" + i, sig: k, x: (x0 + x1) / 2, y: (y0 + y1) / 2 });
      i++;
    }
    return { things: things.length, rest: [...new Set(rest)], marked };
  };
  /* dh9: the controls that carry a ground of their own, one of each kind, with their words' lines */
  const controls = (root) => {
    const out = [], seen = new Set();
    root.querySelectorAll(".dg-ctrl").forEach((e, i) => {
      if (!vis(e)) return;
      const k = sig(e); if (seen.has(k)) return; seen.add(k);
      e.setAttribute("data-dgq", "c" + i);
      const r = e.getBoundingClientRect();
      out.push({ q: "c" + i, sig: k, x: r.left, y: r.top, w: r.width, h: r.height, texts: linesOf(textNodes(e)).map((l) => ({ x: l.x - 1, y: l.y - 1, w: l.w + 2, h: l.h + 2 })) });
    });
    return out;
  };
  window.__dots = { sig, ancestors, controls, scan, wide, things, lattice, label, vis, lines, textNodes, linesOf, alphaOf, pageBg };
}

/* ---- the fixtures: a real catalog by the real verbs, proposals as the engine writes them --------------------------------- */
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
  await page.evaluateOnNewDocument(pageLib);
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

/* ---- the screen's pixels: the field as it is and with the field off; what differs is a dot ------------------------------------ */
const PIXELS = async (a64, b64, g, rects, bg, boxes) => {
  const load = (x) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = "data:image/png;base64," + x; });
  const [ia, ib] = await Promise.all([load(a64), load(b64)]);
  const px = (img) => { const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const q = c.getContext("2d"); q.drawImage(img, 0, 0); return q.getImageData(0, 0, img.width, img.height); };
  const A = px(ia), B = px(ib), W = A.width, H = A.height;
  const diff = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return 0; const i = (y * W + x) * 4; return Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2])); };
  /* a shown dot of the lattice: any channel 6 or more apart in the 3 by 3 pixels round its centre */
  const on = g.pts.map(([x, y]) => { let d = 0; for (let yy = Math.floor(y) - 1; yy <= Math.floor(y) + 1; yy++) for (let xx = Math.floor(x) - 1; xx <= Math.floor(x) + 1; xx++) d = Math.max(d, diff(xx, yy)); return d >= 6 ? 1 : 0; });
  /* the pixels of a dot (within 2 px of a lattice centre) that show inside a thing's box grown by 1.5 px */
  const nearDot = (x, y) => { const fx = (((x + 0.5 - g.ox) % 16) + 16) % 16, fy = (((y + 0.5 - g.oy) % 16) + 16) % 16; return Math.abs(fx - 8) <= 2 && Math.abs(fy - 8) <= 2; };
  /* a dot's pixel is one that is the page's plain colour once the dots are off: a glyph's own antialiasing, which two shots may draw a
     shade apart, is not a dot */
  const onBg = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return false; const i = (y * W + x) * 4; return Math.abs(B.data[i] - bg[0]) <= 2 && Math.abs(B.data[i + 1] - bg[1]) <= 2 && Math.abs(B.data[i + 2] - bg[2]) <= 2; };
  const bad = [];
  for (const r of rects) {
    let n = 0, at = null;
    for (let y = Math.floor(r.y - 1.5); y < Math.ceil(r.y + r.h + 1.5); y++) for (let x = Math.floor(r.x - 1.5); x < Math.ceil(r.x + r.w + 1.5); x++) {
      if (nearDot(x, y) && diff(x, y) >= 6 && onBg(x, y)) { n++; if (!at) at = x + "," + y; }
    }
    if (n) bad.push({ k: r.k, t: r.t, px: n, at });
  }
  /* dh9: the pixels of a dot inside a control's box, its words' lines left out (a glyph's antialiasing is not a dot) */
  const inBox = (boxes || []).map((b) => {
    let n = 0;
    for (let y = Math.floor(b.y); y < Math.ceil(b.y + b.h); y++) for (let x = Math.floor(b.x); x < Math.ceil(b.x + b.w); x++) {
      if (!nearDot(x, y) || diff(x, y) < 6) continue;
      if (b.texts.some((t) => x >= t.x && x < t.x + t.w && y >= t.y && y < t.y + t.h)) continue;
      n++;
    }
    return n;
  });
  return { on, bad, inBox };
};

async function shots(helper, page, ground, rects, boxes) {
  const g = await page.evaluate((sel) => window.__dots.lattice(document.querySelector(sel)), ground);
  /* a screen still moving (an aside sliding in) is shot again until two shots agree, byte for byte */
  let a = await page.screenshot({ encoding: "base64" });
  for (let i = 0; i < 8; i++) { await sleep(250); const a2 = await page.screenshot({ encoding: "base64" }); const same = a2 === a; a = a2; if (same) break; }
  const tag = await page.addStyleTag({ content: ground + "{background-image:none !important}" });
  const b = await page.screenshot({ encoding: "base64" });
  await page.evaluate((el) => el.remove(), tag);
  const bg = (await page.evaluate(() => window.__dots.pageBg())).match(/\d+/g).slice(0, 3).map(Number);
  const r = await helper.evaluate(PIXELS, a, b, g, rects, bg, boxes || []);
  if (process.env.DOTS_HUG_KEEP && r.bad.length) { const k = process.env.DOTS_HUG_KEEP + "-" + Date.now(); fs.writeFileSync(k + "-a.png", Buffer.from(a, "base64")); fs.writeFileSync(k + "-b.png", Buffer.from(b, "base64")); }
  return { dots: g.pts.map((p, i) => ({ x: p[0], y: p[1], on: r.on[i] === 1 })), bad: r.bad, inBox: r.inBox, a64: a };
}

/* dh8 and dh9 on the screen as it stands: tinted ancestors of a ground-holding thing, at rest and with the pointer over them; and every kind
   of control carrying a ground, in each state the pointer or the keyboard can put it in, the dots shown inside its box */
async function stateCases(helper, page, theme) {
  const known = await page.evaluate(() => document.querySelectorAll(":is(.disc.nudge,.si-run,.si-av.off,.e-still).dg-ctrl").length);
  const out = { known, things: 0, restTint: [], hoverTint: [], ctrls: 0, states: { rest: 0, hover: 0, press: 0, focus: 0 }, fvOk: 0, fvTried: 0, at: [] };
  const anc = await page.evaluate(() => window.__dots.ancestors(document.querySelector("#main")));
  out.things = anc.things; out.restTint = anc.rest;
  for (const m of anc.marked) {
    await page.mouse.move(m.x, m.y); await sleep(60);
    const a = await page.evaluate((q) => window.__dots.alphaOf(getComputedStyle(document.querySelector('[data-dgq="' + q + '"]')).backgroundColor), m.q);
    if (a > 0) out.hoverTint.push(m.sig + " " + a.toFixed(2));
  }
  await page.mouse.move(2, 2);
  const cs = await page.evaluate(() => window.__dots.controls(document.querySelector("#main")));
  out.ctrls = cs.length;
  for (const c of cs) {
    const sel = '[data-dgq="' + c.q + '"]', cx = c.x + c.w / 2, cy = c.y + c.h / 2;
    for (const st of ["rest", "hover", "press", "focus"]) {
      if (st === "hover" || st === "press") await page.mouse.move(cx, cy);
      if (st === "press") await page.mouse.down();
      if (st === "focus") { await page.keyboard.press("Shift"); const ok = await page.evaluate((s) => { const e = document.querySelector(s); e.focus(); return e.matches(":focus-visible"); }, sel); out.fvTried++; if (ok) out.fvOk++; }
      await sleep(80);
      const sh = await shots(helper, page, "#main", [], [c]);
      const n = sh.inBox[0];
      out.states[st] += n;
      if (n) out.at.push(c.sig + " " + st + " " + n);
      if (st === "hover" && process.env.DOTS_HUG_HOVERSHOT && c.sig.indexOf("button.lw-rc.more") === 0 && !stateCases.shot[theme]) {
        stateCases.shot[theme] = 1;
        await page.screenshot({ path: process.env.DOTS_HUG_HOVERSHOT + "-" + theme + ".png", clip: { x: Math.max(0, c.x - 24), y: Math.max(0, c.y - 24), width: Math.min(c.w + 48, 560), height: c.h + 48 } });
      }
      if (st === "press") { await page.mouse.move(2, 2); await page.mouse.up(); }
      if (st === "focus") await page.evaluate((s) => document.querySelector(s).blur(), sel);
      if (st === "hover") await page.mouse.move(2, 2);
    }
  }
  await sleep(100);
  return out;
}

stateCases.shot = {};

/* dh11: a tinted control given an ::after of its own, in a rule lighter than the layer's (:where), on the page's ground */
async function ownAfter(page) {
  await press(page, '#rail [data-act="home"][data-v="library"]'); await sleep(700);
  await page.addStyleTag({ content: "button.dgx{display:inline-block;padding:4px 10px;border:0;background:rgba(20,20,20,.06);color:inherit}"
    + ' :where(.dgx)::after{content:"x";position:absolute;right:-6px;top:0;z-index:3}' });
  await page.evaluate(() => { document.querySelector("#main").innerHTML = '<div class="pad"><h1>Own after</h1><button class="dgx" data-case="own">Badge</button></div>'; });
  await sleep(400);
  return page.evaluate(() => {
    const b = document.querySelector('[data-case="own"]'), a = getComputedStyle(b, "::after");
    return { content: a.content, zIndex: a.zIndex, top: a.top, right: a.right, layered: b.classList.contains("dg-ctrl"), named: ((window.STUDIO_DOTS || {}).skipped || []).some((x) => /^button\.dgx/.test(x)) };
  });
}

async function setTheme(page, theme) {
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
  await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
  /* a screen that slides in again after a theme change (the review's aside does, at 900 px) has to have settled before the two shots */
  await sleep(500);
}

async function measureCase(helper, page, ground, o) {
  const m = await page.evaluate((sel) => {
    const g = document.querySelector(sel), D = window.__dots;
    return { miss: D.scan(g).map((t) => ({ kind: t.kind, el: D.label(t.el) })), wide: D.wide(g), things: D.things(g) };
  }, ground);
  const out = { miss: m.miss, wideBad: m.wide.bad, wideN: m.wide.n, crowd: [], onN: 0, total: 0 };
  if (o.pixels) {
    const s = await shots(helper, page, ground, m.things);
    out.crowd = s.bad; out.onN = s.dots.filter((d) => d.on).length; out.total = s.dots.length;
    if (SHOTS && o.shot) fs.writeFileSync(path.join(SHOTS, o.shot + ".png"), Buffer.from(s.a64, "base64"));
  }
  return out;
}

/* dh4: the dots in a strip right of the short last line of `sel`'s words, and in an untouched strip of the same size beside it */
async function eyesStrip(helper, page, ground, sel) {
  const line = await page.evaluate((sel) => {
    const e = document.querySelector(sel); if (!e) return null;
    const D = window.__dots, ls = D.linesOf(D.textNodes(e)).sort((a, b) => a.y - b.y);
    return ls.length ? { n: ls.length, last: ls[ls.length - 1] } : null;
  }, sel);
  if (!line) return { found: false };
  const s = await shots(helper, page, ground, []);
  const dots = s.dots, L = line.last, cy = L.y + L.h / 2;
  const rowY = dots.reduce((best, d) => (Math.abs(d.y - cy) < Math.abs(best - cy) ? d.y : best), dots[0].y);
  const x0 = L.x + L.w + SPREAD + 4;
  const strip = (y) => dots.filter((d) => d.y === y && d.x >= x0 && d.x < x0 + 96);
  const right = strip(rowY);
  const maxY = await page.evaluate((g) => { let y = 0; for (const t of window.__dots.things(document.querySelector(g))) y = Math.max(y, t.y + t.h); return y; }, ground);
  const emptyY = dots.filter((d) => d.y > maxY + 40).map((d) => d.y)[0];
  const free = emptyY == null ? [] : strip(emptyY);
  return { found: true, lines: line.n, rightOn: right.filter((d) => d.on).length, rightCells: right.length, freeOn: free.filter((d) => d.on).length, freeCells: free.length, row: rowY, x0: Math.round(x0) };
}

/* dh5: text the screen's own code adds after the paint is hugged as the paint is: a refusal sentence under the Variables screen's name
   field, and a lede and a heading written into the page */
async function lateText(page) {
  const out = { refusal: null, written: null };
  await press(page, '#rail [data-act="home"][data-v="library"]'); await sleep(700);
  await press(page, '#main [data-act="open"]'); await sleep(1500);
  await press(page, '#rail a[data-v="variables"]'); await sleep(900);
  await press(page, '#main [data-act="vr-new"]'); await sleep(500);
  out.refusal = await page.evaluate(async () => {
    const f = document.querySelector('#main input[data-vr="name"]'); if (!f) return { found: false };
    f.value = "bad name"; f.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 120));
    const bad = document.querySelector("#main .vr-bad"); if (!bad) return { found: false };
    const D = window.__dots, g = document.querySelector("#main"), mine = (s) => /Capital letters/.test(s);
    return { found: true, text: bad.textContent.slice(0, 30), missed: D.scan(g).filter((t) => mine(t.el.textContent || "")).length, wide: D.wide(g).bad.filter((b) => mine(b.el)).length };
  });
  await press(page, '#rail [data-act="home"][data-v="library"]'); await sleep(700);
  out.written = await page.evaluate(async () => {
    const m = document.querySelector("#main .pad") || document.querySelector("#main");
    m.insertAdjacentHTML("beforeend", '<p class="lede" data-late="1" style="max-width:360px">A refusal sentence that arrived after the screen was painted and runs onto two lines.</p><h2>A heading that came late</h2>');
    await new Promise((r) => setTimeout(r, 120));
    const D = window.__dots, g = document.querySelector("#main"), mine = (s) => /arrived after|came late/.test(s);
    return { found: !!document.querySelector('[data-late="1"]'), missed: D.scan(g).filter((t) => mine(t.el.textContent || "")).length, wide: D.wide(g).bad.filter((b) => mine(b.el)).length };
  });
  return out;
}

/* dh6: the pass's cost on the Cards screen of a catalog of a few hundred cards, from the page's own record of each pass */
async function passCost(browser, fx) {
  const page = await boot(browser, fx, { width: 1280, door: false });
  await press(page, '#rail [data-act="home"][data-v="library"]'); await sleep(700);
  await press(page, '#main [data-act="open"]'); await sleep(2000);
  await press(page, '#rail a[data-v="cards"]'); await sleep(1500);
  const rows = await page.evaluate(() => document.querySelectorAll("#main table tr").length);
  if (DEBUG) process.stderr.write("CARDS " + JSON.stringify(await page.evaluate(() => { const m = document.querySelector("#main"); const hugs = m.querySelectorAll(".dg-hug"); const tbl = m.querySelector("table");
    const chain = []; for (let e = tbl; e && e !== m; e = e.parentElement) chain.push(e.tagName + "." + e.className + ":" + getComputedStyle(e).backgroundColor);
    return { all: m.querySelectorAll("*").length, hugs: hugs.length, chain, sample: [...hugs].slice(0, 6).map((h) => h.parentElement.tagName + "." + h.parentElement.className + ">" + h.textContent.slice(0, 16)),
      td: tbl ? getComputedStyle(tbl.querySelector("td")).backgroundColor : null, tr: tbl ? getComputedStyle(tbl.querySelector("tbody tr, tr")).backgroundColor : null }; })) + "\n");
  const take = () => page.evaluate(() => Object.assign({}, window.STUDIO_DOTS));
  const runs = [];
  for (let i = 0; i < 12; i++) {
    await press(page, '#rail a[data-v="lint"]'); await sleep(350);
    const a = await take();
    await press(page, '#rail a[data-v="cards"]'); await sleep(600);
    const b = await take();
    runs.push({ ms: b.ms - a.ms, passes: b.runs - a.runs });
  }
  await page.close();
  const per = runs.map((r) => r.ms).sort((x, y) => x - y);
  return { rows, paints: runs.length, medianMs: +per[Math.floor(per.length / 2)].toFixed(2), maxMs: +per[per.length - 1].toFixed(2), passes: runs.reduce((s, r) => s + r.passes, 0) };
}

async function main() {
  const fx = await fixtures();
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const px = !ONLY || ONLY === "dh3" || ONLY === "dh4" || ONLY === "dh9" || ONLY === "dh89";
  const walk = !ONLY || ["dh1", "dh2", "dh3", "dh8", "dh9", "dh89"].includes(ONLY);
  const widths = ONLY ? [Number(process.env.DOTS_HUG_W) || 1280] : WIDTHS, themes = ONLY ? [process.env.DOTS_HUG_THEME || "light"] : THEMES;
  const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--hide-scrollbars", "--no-sandbox", "--allow-file-access-from-files"] });
  const result = {}, eyes = {}, late = {}, mark = {};
  let own = null;
  let cost = null;
  try {
    const helper = await browser.newPage();
    await helper.goto("about:blank");
    for (const width of widths) {
      result[width] = {};
      for (const t of themes) result[width][t] = [];
      if (walk || ONLY === "dh4" || ONLY === "dh10") {
        const page = await boot(browser, fx, { width, door: true });
        for (const theme of themes) {
          await setTheme(page, theme);
          if (walk) {
            const m = await measureCase(helper, page, ".si-door .l", { pixels: px, shot: "door-" + width + "-" + theme });
            result[width][theme].push({ screen: "door", miss: m.miss, wideBad: m.wideBad, crowd: m.crowd, onN: m.onN });
          }
        }
        if (width === 1280 && (!ONLY || ONLY === "dh10")) for (const theme of THEMES) {
          await setTheme(page, theme);
          mark[theme] = await page.evaluate(() => { const e = document.querySelector(".si-door .mk"), c = e && getComputedStyle(e); return e ? { image: c.backgroundImage, pad: c.paddingBottom } : null; });
        }
        if (width === 1280 && (!ONLY || ONLY === "dh4")) for (const theme of THEMES) { await setTheme(page, theme); eyes["door-" + theme] = await eyesStrip(helper, page, ".si-door .l", ".si-door .l .lede"); }
        await page.close();
      }
      if (!walk) continue;
      const page = await boot(browser, fx, { width, door: false });
      const visit = async (key) => {
        for (const theme of themes) {
          await setTheme(page, theme);
          const m = await measureCase(helper, page, "#main", { pixels: px, shot: key.replace(/[^a-z0-9-]+/gi, "_") + "-" + width + "-" + theme });
          const row = { screen: key, miss: m.miss, wideBad: m.wideBad, crowd: m.crowd, onN: m.onN };
          if (width === 1280 && (!ONLY || ONLY === "dh8" || ONLY === "dh9" || ONLY === "dh89")) row.state = await stateCases(helper, page, theme);
          result[width][theme].push(row);
        }
        await setTheme(page, "light");
      };
      await walkScreens(page, visit);
      await page.close();
    }
    if (!ONLY || ONLY === "dh4" || ONLY === "dh5" || ONLY === "dh11") {
      const page = await boot(browser, fx, { width: 1280, door: false });
      for (const theme of THEMES) {
        await setTheme(page, theme);
        if (!ONLY || ONLY === "dh4") {
          await press(page, '#rail [data-act="home"][data-v="library"]'); await sleep(700);
          await page.evaluate(() => {
            document.querySelector("#main").innerHTML = '<div class="pad"><h1>Two lines</h1><p class="lede" data-case="twoline" style="max-width:420px">'
              + "A lede long enough to wrap onto a second line, whose last line is short, as a sentence of a screen's own often is.</p></div>";
          });
          await sleep(250);
          eyes["twoline-" + theme] = await eyesStrip(helper, page, "#main", '#main [data-case="twoline"]');
        }
        if (!ONLY || ONLY === "dh5") late[theme] = await lateText(page);
        if ((!ONLY || ONLY === "dh11") && theme === "light") own = await ownAfter(page);
      }
      await page.close();
    }
    if (!ONLY || ONLY === "dh6") cost = await passCost(browser, fx.big);
  } finally {
    await browser.close();
    dropScratch(SCRATCH, "tests/dots-hug.mjs");
  }
  report(result, eyes, late, cost, widths, themes, mark, own);
}

function report(result, eyes, late, cost, widths, themes, mark, own) {
  if (want("dh11")) {
    const ok = !!own && own.content === '"x"' && own.zIndex === "3" && own.top === "0px" && own.right === "-6px" && !own.layered && own.named;
    check(ok, "dh11 a tinted control that already draws an ::after of its own is left as it was, and named: the layer does not take the pseudo-element (content, z-index, top and right kept), and the pass lists the control as skipped: " + JSON.stringify(own), own);
  }
  if (want("dh12")) {
    const rows = [].concat(...THEMES.map((t) => (result[1280] && result[1280][t] || []).filter((r) => r.state)));
    const n = rows.reduce((a, r) => a + r.state.known, 0);
    check(rows.length > 0 && n === 0, "dh12 none of the four ::after users that sit on opaque grounds (.disc.nudge, .si-run, .si-av.off, .e-still) carries .dg-ctrl on the walked screens, so the day one turns translucent it is seen: " + n + " of them tagged, on " + rows.length + " screen readings", { n });
  }
  if (want("dh10")) for (const theme of THEMES) {
    const m = mark[theme];
    check(!!m && m.image === "none" && m.pad === "0px", "dh10 in the " + theme + " theme the door's mark, a span of the class mk, has no background image and no padding under it (computed): " + JSON.stringify(m), m);
  }
  for (const width of widths) for (const theme of themes) {
    const rows = result[width][theme];
    if (!rows.length) continue;
    const screens = rows.map((r) => r.screen).join(", ");
    const miss = rows.filter((r) => r.miss.length).map((r) => ({ screen: r.screen, n: r.miss.length, els: r.miss.slice(0, 6).map((x) => x.kind + ":" + x.el) }));
    const wide = rows.filter((r) => r.wideBad.length).map((r) => ({ screen: r.screen, n: r.wideBad.length, first: r.wideBad.slice(0, 3) }));
    const crowd = rows.filter((r) => r.crowd.length).map((r) => ({ screen: r.screen, n: r.crowd.length, first: r.crowd.slice(0, 3) }));
    const tot = (f) => rows.reduce((a, r) => a + f(r), 0);
    if (want("dh1")) check(!miss.length, "dh1 at " + width + " px in the " + theme + " theme no text, icon or control is left on the dotted ground, on " + rows.length + " screens (" + screens + "): "
      + tot((r) => r.miss.length) + " misses", miss);
    if (want("dh2")) check(!wide.length, "dh2 at " + width + " px in the " + theme + " theme every cleared ground ends within 1.5 px of each line of its words: " + tot((r) => r.wideBad.length) + " lines over", wide);
    if (want("dh3")) check(!crowd.length, "dh3 at " + width + " px in the " + theme + " theme no dot shows within 1.5 px of a line of words or an icon: " + tot((r) => r.crowd.length)
      + " things crowded, " + tot((r) => r.onN) + " dots shown", crowd);
  }
  for (const theme of themes) {
    const rows = (result[1280] && result[1280][theme] || []).filter((r) => r.state);
    if (!rows.length) continue;
    const sum = (f) => rows.reduce((a, r) => a + f(r.state), 0);
    const tint = rows.filter((r) => r.state.restTint.length || r.state.hoverTint.length).map((r) => ({ screen: r.screen, rest: r.state.restTint, hover: r.state.hoverTint }));
    if (want("dh8")) check(!tint.length, "dh8 in the " + theme + " theme every hug, icon and control on the dotted ground has only alpha-0 grounds between it and the dots, at rest and with the pointer over each kind of ancestor: "
      + sum((s) => s.things) + " things on " + rows.length + " screens, " + tint.length + " screens with a tinted ancestor", tint);
    const st = { rest: sum((s) => s.states.rest), hover: sum((s) => s.states.hover), press: sum((s) => s.states.press), focus: sum((s) => s.states.focus) };
    const where = rows.filter((r) => r.state.at.length).map((r) => ({ screen: r.screen, at: r.state.at.slice(0, 6) }));
    if (want("dh9")) check(!st.rest && !st.hover && !st.press && !st.focus && sum((s) => s.ctrls) > 0, "dh9 in the " + theme + " theme no dot shows inside a control that carries a ground, at rest, under the pointer, pressed and focused (focus-visible took on "
      + sum((s) => s.fvOk) + " of " + sum((s) => s.fvTried) + "): " + sum((s) => s.ctrls) + " kinds of control, dot pixels rest " + st.rest + " hover " + st.hover + " press " + st.press + " focus " + st.focus, where);
  }
  if (!ONLY || ONLY === "dh1") {
    const w = widths[0], t = themes[0];
    process.stdout.write("#screens " + JSON.stringify(result[w][t].map((r) => r.screen)) + "\n");
    process.stdout.write("#misses " + JSON.stringify(Object.fromEntries(widths.map((x) => [x, Object.fromEntries(themes.map((y) => [y, Object.fromEntries(result[x][y].filter((r) => r.miss.length).map((r) => [r.screen, r.miss.length]))]))]))) + "\n");
  }
  for (const k of Object.keys(eyes)) process.stdout.write("#eyes " + k + " " + JSON.stringify(eyes[k]) + "\n");
  if (want("dh4")) for (const theme of THEMES) for (const c of ["door", "twoline"]) {
    const e = eyes[c + "-" + theme];
    const ok = !!e && e.found && e.lines >= 2 && e.freeCells >= 4 && e.rightCells === e.freeCells && e.rightOn === e.freeOn;
    check(ok, "dh4 in the " + theme + " theme beside the " + c + "'s short last line the dots in the strip are as many as in an untouched strip: "
      + (e && e.found ? e.rightOn + " of " + e.rightCells + " beside, " + e.freeOn + " of " + e.freeCells + " untouched" : "not found"), e);
  }
  if (want("dh5")) for (const theme of THEMES) {
    const l = late[theme] || {};
    const ok = !!l.refusal && l.refusal.found && l.refusal.missed === 0 && l.refusal.wide === 0 && !!l.written && l.written.found && l.written.missed === 0 && l.written.wide === 0;
    check(ok, "dh5 in the " + theme + " theme text that arrives after the paint is hugged as the paint is: the Variables name refusal and a written lede and heading, none left on the ground, none too wide", l);
  }
  if (want("dh6")) check(!!cost && cost.rows >= 200 && cost.medianMs < 2, "dh6 the pass costs under 2 ms a paint on the Cards screen of a catalog of "
    + (cost ? cost.rows : 0) + " rows: median " + (cost && cost.medianMs) + " ms, worst " + (cost && cost.maxMs) + " ms over " + (cost && cost.paints) + " repaints (" + (cost && cost.passes) + " passes)", cost);
  if (want("dh7")) {
    const css = fs.readFileSync(HTML_FILE, "utf8"), app = fs.readFileSync(path.join(path.dirname(HTML_FILE), "app.js"), "utf8");
    const named = (/const DG_GROUND = "([^"]+)"/.exec(app) || [])[1];
    const grounds = named ? named.split(",").length : -1;
    const painted = (css.match(/radial-gradient\(circle at center,var\(--dots-ink\) 0 \.7px/g) || []).length;
    check(grounds > 0 && grounds === painted, "dh7 the dot field is painted on exactly the grounds the pass names: " + painted + " painted, " + grounds + " named (" + named + ")");
  }
}

function plantPhase() {
  delete process.env.DOTS_HUG_HOVERSHOT;
  if (ONLY) return;
  const block = ".dg-hug{display:block;background:var(--bg); /* plant:dots-hug */";
  copyPlants({
    root: ROOT, self: SELF, label: "dots-hug", onlyVar: "DOTS_HUG_ONLY", check, skip, timeout: 240000,
    plants: [
      /* the block patch put back: the hug is a block again, the patch's old 5 px spread */
      { mark: "dots-hug", leg: "dh2", rel: "ui/index.html", line: block },
      { mark: "dots-hug", leg: "dh4", rel: "ui/index.html", line: block },
      /* the pass never wired: nothing is hugged, so words stand on the ground */
      { mark: "dots-pass", leg: "dh1", rel: "ui/app.js", line: "    void ob; /* plant:dots-pass */" },
      /* the page's colour left out from under a control: a hover tint shows the dots again */
      { mark: "dots-under", leg: "dh9", rel: "ui/index.html", line: ".dg-ctrl::after{content:\"\";position:absolute;inset:-3px;z-index:-1;border-radius:inherit;background:transparent;pointer-events:none} /* plant:dots-under */" },
      /* a tinted box entered like bare ground: its words get page-coloured patches inside the tint */
      { mark: "dots-tint", leg: "dh8", rel: "ui/app.js", line: "        if (false) { tints.push(el); return; } /* plant:dots-tint */" },
      /* the layer taking over a control's own ::after: the skip taken out */
      { mark: "dots-own-after", leg: "dh11", rel: "ui/app.js", line: "      if (false) { skipped.push(e); continue; } /* plant:dots-own-after */" },
      /* the door's mark with the marker's swash back */
      { mark: "door-mark-line", leg: "dh10", rel: "ui/index.html", line: ".si-door .mk,.si-door .mk:hover{width:52px;height:52px;color:var(--mark);margin-bottom:26px} /* plant:door-mark-line */" },
    ],
  });
}

main().then(() => {
  plantPhase();
  const expected = ONLY ? checks + skipped : EXPECTED;
  if (!ONLY) check(checks + skipped + 1 === expected, "dh0 every leg ran: " + (checks + skipped + 1) + " of " + expected);
  process.stdout.write("#counts checks=" + checks + " skipped=" + skipped + " failed=" + fails + " expected=" + expected + "\n");
  process.stdout.write(fails ? "dots-hug: " + fails + " of " + checks + " FAILED\n" : "dots-hug: all " + checks + " checks hold" + (skipped ? ", " + skipped + " NOT RUN" : "") + "\n");
  process.exit(fails ? 1 : 0);
}).catch((e) => { process.stderr.write(String(e && e.stack || e) + "\n"); process.exit(2); });
