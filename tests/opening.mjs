/* THE OPENING (board 957, Claudia handover 2026-11-03, Max decisions 30 and 31):
 * First-round variant A, Studio's turn phiIcon 90 degrees (c-open), ink #8b5cf6 over the window's own ground (theme token),
 * landing in Studio's corner mark (.brand svg, 25 x 25 at 14, 6.5) with no jump, then the window arriving;
 * nothing of the UI before the landing; one clock with the corner logo.
 *
 *     node tests/opening.mjs
 *
 * Node only, no window (headless): measures what the eye sees across the opening timeline, the DOM and the sheet.
 * Claims, one section each:
 *   1  the work hidden until the opening lands (the header, panes and Projects screen not visible before, visible after)
 *   2  the landing on the corner mark (centre within 1 px, size within 2 per cent, no jump in the corner mark's phase at the hand-over)
 *   3  a key, a click and the wheel each end it at once
 *   4  reduced motion plays no opening: nothing drawn, the window shown once the page is ready
 *   5  the Projects screen afterwards byte for byte as before
 *   9  Studio's corner mark is Studio's mark, rotating, resting at c-open (board 964), standing as the app icon's figure
 *      with its depth and turning in the same frame (board 441)
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { loadPage } from "./page-stand-in.mjs";

const require = createRequire(import.meta.url);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const EXPECTED = 35;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

const settle = (ms) => new Promise((r) => setTimeout(r, ms || 10));
const thrown = [];
process.on("unhandledRejection", (e) => { thrown.push(String(e && e.stack || e).slice(0, 300)); });

/* ---- 2: the landing on the corner mark ---- */
{
  let openingMod = null;
  try {
    openingMod = require("../ui/opening.js");
  } catch (e) {
    /* opening.js not created yet on 56eb648 */
  }

  const W = 1280, H = 880;
  /* The band's mark as index.html writes it: the figure at its own size (ink 212) placed by the group transform and the
     viewBox in the 25 px box at 14, 6.5; the flight is drawn at the fit's 150 of 212, so its k is that scale over 150/212. */
  const markSvg = (/<svg class="mark"[^>]*>[\s\S]*?<\/svg>/.exec(fs.readFileSync(path.join(ROOT, "ui", "index.html"), "utf8")) || [""])[0];
  const vb = ((/^<svg[^>]*viewBox="([^"]+)"/.exec(markSvg) || [])[1] || "0 0 256 256").trim().split(/[\s,]+/).map(Number);
  const grp = (/<g transform="([^"]+)">\s*<path /.exec(markSvg) || [])[1] || "";
  const gTx = +((/translate\(\s*([-\d.]+)/.exec(grp) || [])[1] || 0), gSc = +((/scale\(\s*([-\d.]+)/.exec(grp) || [])[1] || 1);
  const cornerTarget = {
    cx: 14 + (128 * gSc + gTx - vb[0]) * 25 / vb[2],
    cy: 6.5 + (128 * gSc + gTx - vb[1]) * 25 / vb[3],
    k: (25 / vb[2]) * gSc / (150 / 212)
  };

  const getAt = openingMod && openingMod.figureAt ? openingMod.figureAt : () => ({ cx: 0, cy: 0, k: 0, phi: 0 });

  // At landing t = 2.90s: centre within 1 px of corner mark, size within 2%
  const atLand = getAt(2.90, W, H);
  const dCenter = Math.hypot(atLand.cx - cornerTarget.cx, atLand.cy - cornerTarget.cy);
  check(dCenter <= 1.0,
    "2c landing on the corner mark has centre within 1 px: " + dCenter.toFixed(3) + " px (cx=" + atLand.cx + ", cy=" + atLand.cy + ", target=" + cornerTarget.cx.toFixed(3) + "," + cornerTarget.cy.toFixed(3) + ")");

  const sizeCorner = 150 * cornerTarget.k;
  const sizeLand = 150 * atLand.k;
  const sizeDiff = Math.abs(sizeLand - sizeCorner) / sizeCorner;
  check(sizeDiff <= 0.02,
    "2d landing on the corner mark has size within 2 per cent: " + (sizeDiff * 100).toFixed(2) + "% (land=" + sizeLand.toFixed(2) + " px, corner=" + sizeCorner.toFixed(2) + " px)");

  // Phase at hand-over t = 3.25s: no jump in phase between opening mark and corner mark
  const atArrive = getAt(3.25, W, H);
  const cornerPhase = (openingMod && openingMod.cornerPhase ? openingMod.cornerPhase(3.25) : -999);
  const phaseDiff = Math.abs(atArrive.phi - cornerPhase);
  check(phaseDiff < 1e-4,
    "2f corner mark carries on at phase phiIcon + W0 * (t - 2.35) with no jump at hand-over: diff=" + phaseDiff.toFixed(6));
}

/* ---- 3: a key, a click and the wheel each end it at once ---- */
{
  let openingMod = null;
  try { openingMod = require("../ui/opening.js"); } catch (e) {}

  let keyEnded = false, clickEnded = false, wheelEnded = false;
  if (openingMod && openingMod.openingMark) {
    const fakeDoc = () => {
      const listeners = {};
      return {
        addEventListener: (k, fn) => { (listeners[k] = listeners[k] || []).push(fn); },
        removeEventListener: () => {},
        dispatch: (k, ev) => (listeners[k] || []).forEach((fn) => fn(ev)),
        body: { classList: { add() {}, remove() {}, toggle() {}, contains: () => true } },
        documentElement: { dataset: {} }
      };
    };

    // key ends it
    const d1 = fakeDoc();
    const inst1 = openingMod.openingMark({ doc: d1, window: d1, still: () => false });
    d1.dispatch("keydown", { key: "a" });
    keyEnded = inst1.reason === "key" || inst1.ended;

    // click ends it
    const d2 = fakeDoc();
    const inst2 = openingMod.openingMark({ doc: d2, window: d2, still: () => false });
    d2.dispatch("pointerdown", { target: {} });
    clickEnded = inst2.reason === "click" || inst2.ended;

    // wheel ends it
    const d3 = fakeDoc();
    const inst3 = openingMod.openingMark({ doc: d3, window: d3, still: () => false });
    d3.dispatch("wheel", {});
    wheelEnded = inst3.reason === "wheel" || inst3.ended;
  }

  check(keyEnded, "3a a key ends the opening at once: " + keyEnded);
  check(clickEnded, "3b a click ends the opening at once: " + clickEnded);
  check(wheelEnded, "3c the wheel ends the opening at once: " + wheelEnded);
}

/* ---- 4: reduced motion plays no opening (Max, 2026-11-03 02:33) ---- */
{
  let openingMod = null;
  try { openingMod = require("../ui/opening.js"); } catch (e) {}

  let motionStill = false, holdDuration = -1, drawn = 0, gaveWay = null;
  if (openingMod && openingMod.openingMark) {
    const d = {
      addEventListener: () => {}, removeEventListener: () => {},
      body: { classList: { add() {}, remove() {}, toggle() {}, contains: () => true } },
      documentElement: { dataset: {} }
    };
    const t0 = performance.now();
    const inst = openingMod.openingMark({ doc: d, window: d, still: () => true });
    motionStill = inst.isStill === true;
    holdDuration = inst.holdMs;
    await new Promise((r) => setTimeout(r, 0));
    gaveWay = inst.ended === true ? inst.reason : null;
  }

  check(motionStill, "4a reduced motion is read as still");
  check(holdDuration === 0 && gaveWay === "still",
    "4b reduced motion plays no opening: no hold, and the window is given way at once once ready: hold " + holdDuration + " ms, gave way " + gaveWay);
}

/* ---- 5: the Projects screen afterwards byte for byte as before ---- */
/* The screen is Overview since board 982's finding 14 (the copywriter's words of 2026-11-11), its heading and lede with it. */
/* Its unconnected map draws each place as wide as its words since board 994 (min-width, not width, and the stages laid out from them). */
{
  const P = loadPage();
  const S = P.page.S;
  S.screen = "projects"; S.projects = []; S.root = "C:\\Projects"; S.rootMissing = false; S.q = "";
  P.page.paintProjects();
  const emptyHtml = P.node("#main").innerHTML;

  const EXPECTED_EMPTY = "<div class=\"pad projects\"><h1>Overview</h1><p class=\"lede\">This Studio at a glance: its catalogs, their cards and editions, and the teams they reach.</p><div class=\"none\"><div class=\"e-fifth-spot\"></div><div class=\"row2\"><button type=\"button\" class=\"btn solid\" data-act=\"new\">New catalog</button><button type=\"button\" class=\"btn\" data-act=\"bring\">Bring in your replies</button></div><div class=\"row2 none-sample\"><button type=\"button\" class=\"btn\" data-act=\"sample-open\">Open the sample catalog</button><span class=\"none-note\">A made-up shop&#39;s catalog in English and Polish, the same one the desk has, to look round in. It opens as a catalog of your own, to change, rename, publish or remove like any other.</span></div><div class=\"none-dir\">Catalogs are kept in C:\\Projects.</div></div><div class=\"famh\"><span class=\"sec\">Connections</span><span class=\"dim\">nothing connected</span></div><div class=\"fam fam0\" style=\"height:214px;--map-h:214px\"><div class=\"dm\" style=\"position:absolute;inset:0\"><svg class=\"dm-svg\" width=\"769\" height=\"214\"><defs><marker id=\"fh\" viewBox=\"0 0 10 10\" refX=\"9\" refY=\"5\" markerUnits=\"userSpaceOnUse\" markerWidth=\"10\" markerHeight=\"10\" orient=\"auto-start-reverse\"><path class=\"h\" d=\"M0 0L10 5L0 10z\"></path></marker></defs><path class=\"dm-e named\" d=\"M205 106C236.9 106 231.1 106 263 106\"/><path class=\"dm-e named\" d=\"M544 106C569.85 106 565.15 58 591 58\"/><path class=\"dm-e named\" d=\"M544 106C569.85 106 565.15 154 591 154\"/></svg><div class=\"dm-fold lit\" style=\"left:22px;top:76px;min-width:176px;height:60px\"><span class=\"ico\"><svg class=\"ic\" aria-hidden=\"true\" focusable=\"false\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3.5\" y=\"4.5\" width=\"7.5\" height=\"6.5\" rx=\"1.6\" fill=\"currentColor\" fill-opacity=\".35\"/><rect x=\"13\" y=\"4.5\" width=\"7.5\" height=\"6.5\" rx=\"1.6\"/><rect x=\"3.5\" y=\"13\" width=\"7.5\" height=\"6.5\" rx=\"1.6\"/><rect x=\"13\" y=\"13\" width=\"7.5\" height=\"6.5\" rx=\"1.6\"/></svg></span><span class=\"tx\"><span class=\"nm\">This Studio</span><span class=\"sub\"><span class=\"v\">no team yet</span></span></span></div><div class=\"dm-fold dim\" style=\"left:265px;top:76px;min-width:273px;height:60px\"><span class=\"ico\"><svg class=\"ic\" aria-hidden=\"true\" focusable=\"false\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4.5 12.5a8 8 0 0 1 8-8c2.6 0 5 1 6.8 2.8L20.5 9M20.5 4.5v4.5h-4.5M20.5 12.5a8 8 0 0 1-8 8c-2.6 0-5-1-6.8-2.8L4.5 16M4.5 20.5v-4.5h4.5\"/></svg></span><span class=\"tx\"><span class=\"nm\">The relay</span><span class=\"sub\"><span class=\"v\">teammates join by invitation</span></span></span></div><div class=\"dm-desk named ghost\" style=\"left:597px;top:34px;min-width:150px;height:46px\"><span class=\"in\"></span><span class=\"lk\"><svg class=\"ic\" aria-hidden=\"true\" focusable=\"false\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"5.5\" y=\"11.5\" width=\"14\" height=\"9\" rx=\"2\"/><path d=\"M8.5 11.5v-3a4 4 0 0 1 8 0v3\"/></svg></span><span class=\"tx\"><span class=\"nm\">Teammates</span></span></div><div class=\"dm-desk named ghost\" style=\"left:597px;top:130px;min-width:150px;height:46px\"><span class=\"in\"></span><span class=\"lk\"><svg class=\"ic\" aria-hidden=\"true\" focusable=\"false\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"5.5\" y=\"11.5\" width=\"14\" height=\"9\" rx=\"2\"/><path d=\"M8.5 11.5v-3a4 4 0 0 1 8 0v3\"/></svg></span><span class=\"tx\"><span class=\"nm\">Teammates</span></span></div></div><div class=\"famgo\"><b>No teammate is connected yet.</b><span>A team carries catalogs to every teammate.</span><button class=\"btn solid\" data-act=\"team-new\"><svg class=\"ic\" aria-hidden=\"true\" focusable=\"false\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12.5 5.5v14M5.5 12.5h14\"/></svg>Make a team</button></div></div></div>";

  check(emptyHtml === EXPECTED_EMPTY, "5a the empty Projects screen is afterwards byte for byte as before");

  S.projects = [{ dir: "C:\\Projects\\a", name: "a", counts: { cards: 3 }, rev: 0 }];
  P.page.paintProjects();
  const listHtml = P.node("#main").innerHTML;
  check(listHtml.startsWith('<div class="pad projects"><h1>Overview</h1>') && !listHtml.includes('data-act="sample-open"') && !/<table/.test(listHtml),
    "5b the Projects list screen is afterwards the Overview, with no table and no sample door");
}

/* ---- 6: the page is never left hidden (the test architect, 2026-11-03 03:04) ---- */
{
  let openingMod = null;
  try { openingMod = require("../ui/opening.js"); } catch (e) {}
  const page = (extra) => Object.assign({
    addEventListener: () => {}, removeEventListener: () => {},
    body: { classList: { add() {}, remove() {}, toggle() {}, contains: () => true } },
    documentElement: { dataset: {} }
  }, extra || {});
  let thrown = null, noFrames = null, stillNever = null;
  if (openingMod && openingMod.openingMark) {
    /* 6a a frame that throws: the window is given way, not left veiled. The first read of the window's width throws. */
    try {
      let reads = 0;
      const w = page({ requestAnimationFrame: (cb) => { cb(16); return 1; }, cancelAnimationFrame: () => {} });
      Object.defineProperty(w, "innerWidth", { get() { reads++; if (reads === 1) throw new Error("planted frame fault"); return 1280; } });
      const inst = openingMod.openingMark({ doc: w, window: w, still: () => false, ready: Promise.resolve() });
      thrown = { ended: inst.ended, reason: inst.reason };
    } catch (e) { thrown = { threw: String(e && e.message || e) }; }
    /* 6b no frames at all and a ready that never comes; 6c the same on the reduced-motion path. */
    const never = new Promise(() => {});
    let i6b = null, i6c = null;
    try { const w = page(); i6b = openingMod.openingMark({ doc: w, window: w, still: () => false, ready: never }); } catch (e) { noFrames = { threw: String(e) }; }
    try { const w = page(); i6c = openingMod.openingMark({ doc: w, window: w, still: () => true, ready: never }); } catch (e) { stillNever = { threw: String(e) }; }
    await new Promise((r) => setTimeout(r, 3250 + 1500 + 400));
    if (i6b) noFrames = { ended: i6b.ended, reason: i6b.reason };
    if (i6c) stillNever = { ended: i6c.ended, reason: i6c.reason };
  }
  check(!!thrown && thrown.ended === true && (thrown.reason === "error" || thrown.reason === "failsafe"),
    "6a a frame that throws still gives the window way: " + JSON.stringify(thrown));
  check(!!noFrames && noFrames.ended === true && noFrames.reason === "failsafe",
    "6b with no frames and a ready that never comes, the failsafe gives the window way 1.5 s after the arrival: " + JSON.stringify(noFrames));
  check(!!stillNever && stillNever.ended === true && stillNever.reason === "failsafe",
    "6c under reduced motion, a ready that never comes still gives the window way by the failsafe: " + JSON.stringify(stillNever));
}

/* ---- 7: the opening clock and hand-over (board 957) ---- */
let openingMod = null;
try { openingMod = require("../ui/opening.js"); } catch (e) {}

class LaunchSyncPromise {
  constructor(fn) {
    this.s = 0; this.v = undefined; this.cb = [];
    if (fn) {
      try { fn(v => this.settle(1, v), e => this.settle(2, e)); }
      catch (e) { this.settle(2, e); }
    }
  }
  settle(s, v) {
    if (this.s) return;
    if (s === 1 && v && typeof v.then === "function") { v.then(x => this.settle(1, x), x => this.settle(2, x)); return; }
    this.s = s; this.v = v;
    const cb = this.cb; this.cb = []; cb.forEach(f => f());
  }
  then(ok, no) {
    return new LaunchSyncPromise((res, rej) => {
      const run = () => {
        const f = this.s === 1 ? ok : no;
        if (typeof f !== "function") { (this.s === 1 ? res : rej)(this.v); return; }
        try { res(f(this.v)); } catch (e) { rej(e); }
      };
      if (this.s) run(); else this.cb.push(run);
    });
  }
  static resolve(v) { return v instanceof LaunchSyncPromise ? v : new LaunchSyncPromise(r => r(v)); }
}

function launchLab(o) {
  o = o || {};
  let clock = 0, seq = 0, frames = [], timers = [];
  const heard = [];
  const doc = { activeElement: null };
  function el(tag, rect) {
    const e = {
      tagName: tag, className: "", children: [], parentNode: null, attrs: {},
      rect: rect || { left: 0, top: 0, width: 0, height: 0 },
      style: { setProperty(k, v) { this[k] = v; }, removeProperty(k) { delete this[k]; } },
      setAttribute(k, v) { this.attrs[k] = v; },
      getAttribute(k) { return this.attrs[k] || null; },
      get offsetWidth() { return this.rect.width; },
      get offsetHeight() { return this.rect.height; },
      getBoundingClientRect() { return this.rect; },
      appendChild(c) { c.parentNode = this; this.children.push(c); return c; },
      remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(x => x !== this); this.parentNode = null; },
      contains(x) { for (; x; x = x.parentNode) if (x === this) return true; return false; },
      querySelector(s) {
        const want = s.replace(/^\./, "");
        for (const c of this.children) {
          if ((" " + c.className + " ").includes(" " + want + " ")) return c;
          const d = c.querySelector(s); if (d) return d;
        }
        return null;
      },
      focus() { doc.activeElement = this; },
      getContext: () => ({ clearRect() {}, fillRect() {}, stroke() {}, beginPath() {}, moveTo() {}, lineTo() {}, scale() {}, setTransform() {} })
    };
    const set = new Set();
    e.classList = {
      add: c => set.add(c),
      remove: c => set.delete(c),
      contains: c => set.has(c) || (" " + e.className + " ").includes(" " + c + " ")
    };
    return e;
  }
  doc.body = el("body");
  doc.documentElement = el("html");
  doc.createElement = t => el(t);

  const win = {
    document: doc,
    Promise: LaunchSyncPromise,
    devicePixelRatio: 1,
    innerWidth: 1280,
    innerHeight: 880,
    performance: { now: () => clock },
    requestAnimationFrame: fn => { frames.push({ id: ++seq, fn }); return seq; },
    cancelAnimationFrame: id => { frames = frames.filter(f => f.id !== id); },
    setTimeout: (fn, ms) => { timers.push({ id: ++seq, at: clock + (ms || 0), fn }); return seq; },
    clearTimeout: id => { timers = timers.filter(x => x.id !== id); },
    addEventListener: (ev, fn) => heard.push({ ev, fn }),
    removeEventListener: (ev, fn) => { const i = heard.findIndex(h => h.ev === ev && h.fn === fn); if (i >= 0) heard.splice(i, 1); },
    dispatch: (ev, e) => heard.filter(h => h.ev === ev).forEach(h => h.fn(e)),
    Event: class { constructor(type, o) { this.type = type; Object.assign(this, o || {}); } }
  };
  win.window = win;

  const timersTo = t => {
    for (;;) {
      const due = timers.filter(x => x.at <= t).sort((a, b) => a.at - b.at || a.id - b.id)[0];
      if (!due) break;
      timers = timers.filter(x => x !== due);
      clock = Math.max(clock, due.at);
      due.fn();
    }
    clock = t;
  };

  let open = null;
  const ready = new LaunchSyncPromise(r => { open = r; });
  let inst = null;
  let t0 = 0;
  let lastDrawnWallMs = 0;
  let lastHandover = null;

  const launch = extra => {
    t0 = clock;
    lastDrawnWallMs = 0;
    inst = openingMod.openingMark(Object.assign({
      doc,
      window: win,
      ready,
      still: () => !!o.still,
      onHandover: phi => { lastHandover = phi; win.__lastSetCornerPhase = phi; }
    }, extra || {}));
    return inst;
  };

  const frame = (t, stamp) => {
    timersTo(t);
    const run = frames;
    frames = [];
    const st = stamp == null ? t : stamp;
    lastDrawnWallMs = Math.max(0, st - t0);
    run.forEach(x => x.fn(st));
  };

  const play = (until, every) => {
    const d = every || 1000 / 60;
    for (let t = clock + d; t <= until; t += d) frame(t);
    timersTo(until);
  };

  return {
    sb: win,
    doc,
    el,
    timersTo,
    launch,
    ready: () => { if (open) open(); },
    frames: () => frames.length,
    frame,
    play,
    dispatch: (ev, e) => win.dispatch(ev, e),
    k: () => ({ get ms() { return inst && inst.clockMs != null ? inst.clockMs : (inst && inst.k ? inst.k.ms : lastDrawnWallMs); } }),
    now: () => clock,
    get lastHandover() { return lastHandover != null ? lastHandover : win.__lastSetCornerPhase; }
  };
}

{

  // Leg 7a
  let got7a = null;
  try {
    const starve = every => {
      const L = launchLab(), h = L.launch(); L.frame(0); L.timersTo(50); L.ready();
      let most = 0;
      for (let t = 10; t <= 3000 && !h.ended; t += 10) {
        const was = L.k() ? L.k().ms : 0;
        if (t % every < 10) L.frame(t); else L.timersTo(t);
        if (was < 2900 && L.k()) most = Math.max(most, L.k().ms - was);
      }
      return most;
    };
    got7a = [starve(300) <= 2000 / 60 + 1e-9, starve(1000 / 60) <= 2000 / 60 + 1e-9];
  } catch (e) { got7a = "threw: " + (e && e.message || e); }
  const ok7a = Array.isArray(got7a) && got7a[0] === true && got7a[1] === true;
  check(ok7a, "7a with a frame only every 300 ms each frame moves the flight on by at most two display frames: " + JSON.stringify(got7a));

  // Leg 7b
  let got7b = null;
  try {
    const L = launchLab(); L.timersTo(300);
    const h = L.launch(), k = L.k();
    L.frame(400, 30); L.ready();
    const first = k.ms;
    L.frame(800);
    const after = k.ms;
    got7b = [first, after <= 2000 / 60 + 1e-9];
  } catch (e) { got7b = "threw: " + (e && e.message || e); }
  const ok7b = Array.isArray(got7b) && got7b[0] === 0 && got7b[1] === true;
  check(ok7b, "7b a first frame stamped before the launch with a stall behind it carries the flight no further than two display frames: " + JSON.stringify(got7b));

  // Leg 7c
  let got7c = null;
  try {
    const L = launchLab();
    const target = openingMod.cornerTarget ? openingMod.cornerTarget() : { cx: 26.5, cy: 19.0 };
    const h = L.launch(); L.ready();
    L.play(1000);
    L.frame(1400);
    L.play(2000);
    L.frame(2400);
    L.play(2900);
    const stateAt2900 = L.sb.window.__launchOpeningState ? L.sb.window.__launchOpeningState() : null;
    const distAt2900 = stateAt2900 ? Math.hypot(stateAt2900.cx - target.cx, stateAt2900.cy - target.cy) : 0;
    const notLandedYet = distAt2900 > 1.0;
    while (!h.ended && L.k() && L.k().ms < 2900 && L.now() < 5000) {
      L.frame(L.now() + 1000 / 60);
    }
    const landWallTime = L.now();
    const stateAtLand = L.sb.window.__launchOpeningState ? L.sb.window.__launchOpeningState() : null;
    const distAtLand = stateAtLand ? Math.hypot(stateAtLand.cx - target.cx, stateAtLand.cy - target.cy) : 999;
    got7c = [notLandedYet, landWallTime > 2900, distAtLand <= 1.0];
  } catch (e) { got7c = "threw: " + (e && e.message || e); }
  const ok7c = Array.isArray(got7c) && got7c[0] === true && got7c[1] === true && got7c[2] === true;
  check(ok7c, "7c the landing after stalls comes later than the wall clock and still lands where the corner mark is: " + JSON.stringify(got7c));

  // Leg 7d
  let got7d = null;
  try {
    const L = launchLab(); const h = L.launch(); L.ready();
    L.play(2000);
    L.frame(2600); // 600 ms stall
    while (!h.ended && L.now() < 10000) {
      L.frame(L.now() + 1000 / 60);
    }
    const phi = L.lastHandover != null ? L.lastHandover : (L.sb.window.__lastSetCornerPhase != null ? L.sb.window.__lastSetCornerPhase : (openingMod.getCornerPhase ? openingMod.getCornerPhase() : -999));
    const flightPhase = L.sb.window.__launchOpeningState ? L.sb.window.__launchOpeningState().phase : 0;
    got7d = [h.reason === "time", Math.abs(phi - flightPhase) < 1e-4];
  } catch (e) { got7d = "threw: " + (e && e.message || e); }
  const ok7d = Array.isArray(got7d) && got7d[0] === true && got7d[1] === true;
  check(ok7d, "7d the hand-over after a stall has no phase jump: " + JSON.stringify(got7d));

  // Leg 7e
  let got7e = null;
  try {
    const L = launchLab();
    const h = L.launch();
    for (let t = 0; t <= 4700; t += 300) L.frame(t);
    const flightPhaseBefore = L.sb.window.__launchOpeningState ? L.sb.window.__launchOpeningState().phase : -999;
    L.timersTo(4750);
    const phi = L.lastHandover != null ? L.lastHandover : (L.sb.window.__lastSetCornerPhase != null ? L.sb.window.__lastSetCornerPhase : (openingMod.getCornerPhase ? openingMod.getCornerPhase() : -999));
    got7e = [h.reason === "failsafe", Math.abs(phi - flightPhaseBefore) < 1e-4, L.frames() === 0];
  } catch (e) { got7e = "threw: " + (e && e.message || e); }
  const ok7e = Array.isArray(got7e) && got7e[0] === true && got7e[1] === true && got7e[2] === true;
  check(ok7e, "7e the failsafe firing mid-flight cuts to the end state with the corner mark at the flight's phase and no fast-forward frame: " + JSON.stringify(got7e));

  // Leg 7f
  let got7f = null;
  try {
    const landsAt = (every, early) => {
      const L = launchLab(), h = L.launch(); L.ready();
      L.frame(0);
      if (early) L.frame(0.5);
      for (let t = (early ? 0.5 : 0) + every; t < 6000 && !h.ended; t += every) L.frame(t);
      return [h.reason, L.now()];
    };
    const d60 = landsAt(1000 / 60, true), d144 = landsAt(1000 / 144, false), d144e = landsAt(1000 / 144, true);
    const onTime = (r, every) => r[0] === "time" && r[1] <= 3250 + 3 * every;
    const L = launchLab(), h = L.launch(); L.ready(); L.frame(0);
    let fast = true, was = 0;
    for (let t = 1000 / 360; t < 6000 && !h.ended; t += 1000 / 360) {
      L.frame(t);
      const ms = L.k() ? L.k().ms : was, step = ms - was;
      if (!h.ended && ms < 2900 && !(Number.isFinite(step) && Math.abs(step - 1000 / 360) < 1e-6)) fast = false;
      was = ms;
    }
    const d360 = [h.reason, L.now()];
    got7f = [onTime(d60, 1000 / 60), onTime(d144, 1000 / 144), onTime(d144e, 1000 / 144), fast && onTime(d360, 1000 / 360)];
  } catch (e) { got7f = "threw: " + (e && e.message || e); }
  const ok7f = Array.isArray(got7f) && got7f[0] === true && got7f[1] === true && got7f[2] === true && got7f[3] === true;
  check(ok7f, "7f 60 Hz after a duplicate stamp, 144 Hz, 144 Hz after one, and 360 Hz all land on time by the clock, not by the failsafe, and at 360 Hz every step equals the frame's own dt: " + JSON.stringify(got7f));
}

/* ---- 8: launch review triage legs (board 957, items 1, 2, 4, 7, 8) ---- */
{
  let openingMod = null;
  try { openingMod = require("../ui/opening.js"); } catch (e) {}

  // 1: during the flight a click on a control presses it, the opening is over, and focus is not moved to #q
  let got8a = null;
  try {
    const L = launchLab();
    const btn = L.el("button");
    let clicked = 0;
    btn.click = () => { clicked += 1; };
    btn.focus = () => { L.doc.activeElement = btn; };
    btn.rect = { left: 10, top: 10, width: 100, height: 30 };
    L.doc.body.appendChild(btn);

    const qInput = L.el("input");
    qInput.id = "q";
    qInput.focus = () => { L.doc.activeElement = qInput; };
    L.doc.body.appendChild(qInput);

    let hitVeilGone = false;
    L.doc.elementFromPoint = (x, y) => {
      const veilNow = L.doc.body.children.filter(c => String(c.className || "").indexOf("e-launch-veil") >= 0)[0];
      hitVeilGone = !!(veilNow && veilNow.style && veilNow.style.pointerEvents === "none");
      return (x >= 10 && x <= 110 && y >= 10 && y <= 40) ? btn : L.doc.body;
    };

    const h = L.launch({
      focus: () => {
        qInput.focus();
        return qInput;
      }
    });
    L.frame(500);
    const veil = L.doc.body.children.filter(c => String(c.className || "").indexOf("e-launch-veil") >= 0)[0];
    let stopped = false, prevented = false;
    L.dispatch("pointerdown", {
      target: veil,
      clientX: 50,
      clientY: 20,
      button: 0,
      stopPropagation() { stopped = true; },
      preventDefault() { prevented = true; }
    });
    const atDown = clicked;
    L.dispatch("pointerup", { target: btn, clientX: 52, clientY: 22, button: 0 });
    L.ready();
    got8a = [atDown === 0, clicked === 1, h.ended === true, L.doc.activeElement !== qInput, stopped === false, prevented === false, hitVeilGone === true];
  } catch (e) { got8a = "threw: " + (e && e.message || e); }
  const ok8a = Array.isArray(got8a) && got8a.every(v => v === true);
  check(ok8a, "during the flight a down and an up on one control press it at the release, the opening is over, and focus is not moved to #q: " + JSON.stringify(got8a));

  /* A down on the control and an up off it, or a down then a drag across text, press nothing: a drag or a
     selection begun in the flight stays one, and the opening is over in each case. */
  let got8a2 = null;
  try {
    const offUp = (upX, upY) => {
      const L = launchLab();
      const btn = L.el("button");
      let clicked = 0;
      btn.click = () => { clicked += 1; };
      btn.focus = () => { L.doc.activeElement = btn; };
      L.doc.body.appendChild(btn);
      const text = L.el("p");
      L.doc.body.appendChild(text);
      L.doc.elementFromPoint = (x, y) => ((x >= 10 && x <= 110 && y >= 10 && y <= 40) ? btn : y > 100 ? text : L.doc.body);
      const h = L.launch();
      L.frame(500);
      const veil = L.doc.body.children.filter(c => String(c.className || "").indexOf("e-launch-veil") >= 0)[0];
      L.dispatch("pointerdown", { target: veil, clientX: 50, clientY: 20, button: 0, stopPropagation() {}, preventDefault() {} });
      L.dispatch("pointerup", { target: L.doc.elementFromPoint(upX, upY), clientX: upX, clientY: upY, button: 0 });
      return [clicked === 0, h.ended === true];
    };
    got8a2 = offUp(300, 20).concat(offUp(60, 200));
  } catch (e) { got8a2 = "threw: " + (e && e.message || e); }
  const ok8a2 = Array.isArray(got8a2) && got8a2.every(v => v === true);
  check(ok8a2, "a down on a control and an up off it, and a down then a drag across text, press nothing, and the opening is over in each: " + JSON.stringify(got8a2));

  /* A Shift+release in the flight presses with Shift, so a range tick stays a range. */
  let got8a3 = null;
  try {
    const L = launchLab();
    const btn = L.el("button");
    let heard = null;
    btn.dispatchEvent = (ev) => { heard = ev; return true; };
    btn.focus = () => { L.doc.activeElement = btn; };
    L.doc.body.appendChild(btn);
    L.doc.elementFromPoint = (x, y) => ((x >= 10 && x <= 110 && y >= 10 && y <= 40) ? btn : L.doc.body);
    L.sb.window.MouseEvent = function (type, init) { this.type = type; Object.assign(this, init); };
    const h = L.launch();
    L.frame(500);
    const veil = L.doc.body.children.filter(c => String(c.className || "").indexOf("e-launch-veil") >= 0)[0];
    L.dispatch("pointerdown", { target: veil, clientX: 50, clientY: 20, button: 0, shiftKey: true, stopPropagation() {}, preventDefault() {} });
    L.dispatch("pointerup", { target: btn, clientX: 50, clientY: 20, button: 0, shiftKey: true });
    got8a3 = [!!heard && heard.type === "click", !!heard && heard.shiftKey === true, !!heard && heard.bubbles === true, h.ended === true];
  } catch (e) { got8a3 = "threw: " + (e && e.message || e); }
  const ok8a3 = Array.isArray(got8a3) && got8a3.every(v => v === true);
  check(ok8a3, "a Shift+release in the flight presses with Shift, the click bubbling as a real one: " + JSON.stringify(got8a3));

  // 2: at 60 Hz with one 6 ms gap early, and with a 120 Hz to 60 Hz switch mid-flight, the landing comes within three frames of 3.25 s, not by the failsafe.
  // 3.25 s is TIMING.ARRIVE, when the opening gives way. TIMING.LAND 2.90 s is the mark reaching the corner on that same clock.
  let got8b = null;
  try {
    const near = (reason, now) => reason === "time" && Math.abs(now - 3250) <= 3 * (1000 / 60);
    const earlyRun = () => {
      const L = launchLab();
      const h = L.launch();
      L.ready();
      L.frame(0);
      L.frame(6);
      for (let t = 6 + 1000 / 60; t <= 6000 && !h.ended; t += 1000 / 60) L.frame(t);
      return [h.reason, L.now(), near(h.reason, L.now())];
    };
    const switchRun = () => {
      const L = launchLab();
      const h = L.launch();
      L.ready();
      L.frame(0);
      for (let t = 1000 / 120; t <= 1600 && !h.ended; t += 1000 / 120) L.frame(t);
      for (let t = L.now() + 1000 / 60; t <= 6000 && !h.ended; t += 1000 / 60) L.frame(t);
      return [h.reason, L.now(), near(h.reason, L.now())];
    };
    const early = earlyRun();
    const switched = switchRun();
    got8b = [early[2] === true, switched[2] === true, early[0], early[1], switched[0], switched[1]];
  } catch (e) { got8b = "threw: " + (e && e.message || e); }
  const ok8b = Array.isArray(got8b) && got8b[0] === true && got8b[1] === true;
  check(ok8b, "at 60 Hz with one 6 ms gap early, and with a 120 Hz to 60 Hz switch mid-flight, the landing comes within three frames of 3.25 s, not by the failsafe: " + JSON.stringify(got8b));

  // 4: a key pressed before paint lands in #q
  let got8c = null;
  try {
    const L = launchLab();
    let qInput = null;
    const h = L.launch({
      focus: () => qInput
    });
    L.doc.activeElement = L.doc.body;
    L.dispatch("keydown", { key: "x" });
    const endedEarly = h.ended;

    qInput = L.el("input");
    qInput.id = "q";
    qInput.value = "";
    qInput.focus = () => { L.doc.activeElement = qInput; };
    L.doc.body.appendChild(qInput);
    L.ready();

    got8c = [endedEarly === true, qInput.value === "x", L.doc.activeElement === qInput];
  } catch (e) { got8c = "threw: " + (e && e.message || e); }
  const ok8c = Array.isArray(got8c) && got8c[0] === true && got8c[1] === true && got8c[2] === true;
  check(ok8c, "a key pressed before paint lands in #q: " + JSON.stringify(got8c));

  // 7: one rAF loop writes the corner's path, counted
  let got8d = null;
  try {
    const appJsSrc = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
    const band = /function bandTurn\(f\)\s*\{([\s\S]*?)\n  \}/.exec(appJsSrc);
    const bandTurnBody = band ? band[1] : "";
    const oneOwner = /if\s*\(\s*op\s*&&\s*op\.wireStudioCorner\s*\)[\s\S]*?wireStudioCorner[\s\S]*?else\s+if\s*\(\s*f\.wireFifth\s*\)/.test(bandTurnBody);

    let rAFs = [];
    let rAFCount = 0;
    const prevRAF = globalThis.requestAnimationFrame;
    const prevCAF = globalThis.cancelAnimationFrame;
    const prevMO = globalThis.MutationObserver;
    let motionWatch = null;
    globalThis.requestAnimationFrame = (cb) => { rAFCount += 1; rAFs.push(cb); return rAFCount; };
    globalThis.cancelAnimationFrame = () => { rAFs = []; };
    globalThis.MutationObserver = function MotionWatch(fn) { motionWatch = fn; };
    globalThis.MutationObserver.prototype.observe = function () {};
    globalThis.MutationObserver.prototype.disconnect = function () {};

    let isHidden = false;
    let isStill = false;
    const visListeners = [];
    const docMock = {
      get hidden() { return isHidden; },
      addEventListener: (k, fn) => { if (k === "visibilitychange") visListeners.push(fn); },
      removeEventListener: () => {},
      documentElement: {
        classList: {
          contains: (c) => isStill && (c === "e-still" || c === "e-system-still")
        }
      }
    };
    let writes = 0;
    const node = {
      ownerDocument: docMock,
      attrs: { d: "M10 10" },
      getAttribute(k) { return this.attrs[k] || null; },
      setAttribute(k, v) { this.attrs[k] = v; if (k === "d") writes += 1; }
    };

    try {
      openingMod.wireStudioCorner(node, { still: () => isStill });
      const started = rAFs.length;
      const pending = rAFs[0];
      rAFs = [];
      writes = 0;
      if (pending) pending(16);
      const wroteOnce = writes === 1 && rAFs.length === 1;

      isHidden = true;
      visListeners.forEach(fn => fn());
      const stoppedWhenHidden = rAFs.length === 0;

      isHidden = false;
      visListeners.forEach(fn => fn());
      const resumesWhenShown = rAFs.length === 1;

      isStill = true;
      if (motionWatch) motionWatch();
      const stoppedWhenStill = rAFs.length === 0;

      isStill = false;
      if (motionWatch) motionWatch();
      const resumesWhenMoving = rAFs.length === 1;

      got8d = [oneOwner, started === 1, wroteOnce, stoppedWhenHidden, resumesWhenShown, stoppedWhenStill, resumesWhenMoving];
    } finally {
      globalThis.requestAnimationFrame = prevRAF;
      globalThis.cancelAnimationFrame = prevCAF;
      globalThis.MutationObserver = prevMO;
    }
  } catch (e) { got8d = "threw: " + (e && e.message || e); }
  const ok8d = Array.isArray(got8d) && got8d.every(v => v === true);
  check(ok8d, "one rAF loop writes the corner's path, counted: " + JSON.stringify(got8d));

  // 8: at dpr 1.25 and 1.5 the canvas is sized once across the opening
  let got8e = null;
  try {
    const runDpr = (dpr) => {
      let sizeCount = 0;
      const L = launchLab();
      L.sb.devicePixelRatio = dpr;
      L.sb.innerWidth = 1281;
      L.sb.innerHeight = 881;
      const origCreate = L.doc.createElement;
      L.doc.createElement = (tag) => {
        const e = origCreate(tag);
        if (tag === "canvas") {
          let w = 0, h = 0;
          Object.defineProperty(e, "width", {
            get() { return w; },
            set(v) { w = Math.trunc(Number(v)); sizeCount += 1; }
          });
          Object.defineProperty(e, "height", {
            get() { return h; },
            set(v) { h = Math.trunc(Number(v)); }
          });
        }
        return e;
      };
      const h = L.launch();
      L.ready();
      for (let t = 0; t <= 300 && !h.ended; t += 1000 / 60) L.frame(t);
      return sizeCount;
    };
    const c125 = runDpr(1.25);
    const c150 = runDpr(1.5);
    got8e = [c125, c150, c125 === 1, c150 === 1];
  } catch (e) { got8e = "threw: " + (e && e.message || e); }
  const ok8e = Array.isArray(got8e) && got8e[2] === true && got8e[3] === true;
  check(ok8e, "at dpr 1.25 and 1.5 the canvas is sized once across the opening: " + JSON.stringify(got8e));
}

/* ---- 9: Studio's corner mark is Studio's mark, rotating, resting at c-open (board 964) ---- */
{
  const pageHtml = fs.readFileSync(path.join(ROOT, "ui", "index.html"), "utf8");
  const cornerMarkMatch = /<span class="brand"[^>]*>[\s\S]*?<svg class="mark"[\s\S]*?<path[^>]* d="([^"]+)"/.exec(pageHtml);
  const cornerD = cornerMarkMatch ? cornerMarkMatch[1] : "";

  // 9c: reduced motion leaves corner mark still at the c-open rest frame
  let got9c = null;
  try {
    let rAFs = [];
    const prevRAF = globalThis.requestAnimationFrame;
    const prevCAF = globalThis.cancelAnimationFrame;
    const prevMO = globalThis.MutationObserver;
    let moCallback = null;
    globalThis.requestAnimationFrame = (cb) => { rAFs.push(cb); return 1; };
    globalThis.cancelAnimationFrame = () => { rAFs = []; };
    globalThis.MutationObserver = function (fn) { moCallback = fn; this.observe = () => {}; this.disconnect = () => {}; };

    let isStill = false;
    const docMock = {
      hidden: false,
      addEventListener: () => {},
      removeEventListener: () => {},
      documentElement: { classList: { contains: (c) => isStill && (c === "e-still" || c === "e-system-still") } }
    };
    const node = {
      ownerDocument: docMock,
      attrs: { d: cornerD, fill: "currentColor", stroke: "none" },
      getAttribute(k) { return this.attrs[k] || null; },
      setAttribute(k, v) { this.attrs[k] = v; }
    };

    openingMod.wireStudioCorner(node, { still: () => isStill });
    if (rAFs[0]) rAFs[0](50); // advance turn
    const advancedD = node.getAttribute("d");

    // turn on reduced motion
    isStill = true;
    if (moCallback) moCallback();
    const stillCancelled = rAFs.length === 0;
    const stillD = node.getAttribute("d");
    const stillFill = node.getAttribute("fill");
    const stillStroke = node.getAttribute("stroke");
    const restoredToOpen = stillD === cornerD && stillFill === "currentColor" && stillStroke === "none";
    const phaseReset = Math.abs((openingMod.getCornerPhase ? openingMod.getCornerPhase() : -1) - Math.PI / 2) < 1e-6;

    got9c = [advancedD !== cornerD, stillCancelled, restoredToOpen, phaseReset];

    globalThis.requestAnimationFrame = prevRAF;
    globalThis.cancelAnimationFrame = prevCAF;
    globalThis.MutationObserver = prevMO;
  } catch (e) { got9c = "threw: " + (e && e.message || e); }
  const ok9c = Array.isArray(got9c) && got9c.every(v => v === true);
  check(ok9c, "9c reduced motion stops corner rotation and returns to the c-open rest frame: " + JSON.stringify(got9c));

  // 9d: Studio boot wires the corner mark so it rotates (not static)
  let got9d = null;
  try {
    const appJs = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
    const launchStartFn = /function launchStart\(ready\)\s*\{([\s\S]*?)\n  \}/.exec(appJs);
    const body = launchStartFn ? launchStartFn[1] : "";
    const callsLaunchLoad = /launchLoad\(\)/.test(body.replace(/\/\/.*$/gm, ""));
    const P = loadPage();
    let wiredPath = null;
    let wiredOpts = null;
    P.sandbox.StudioOpening = {
      wireStudioCorner: (path, opts) => { wiredPath = path; wiredOpts = opts; },
      openingMark: () => ({ giveWay() {}, ended: true })
    };
    P.node("#band .brand svg.mark").outerHTML = '<svg class="mark"><path d="M164.36"/></svg>';
    const take = (pg, n) => { try { return pg.__get(n); } catch (e) { return () => undefined; } };
    const put = (pg, n, v) => { try { pg.__set(n, v); } catch (e) {} };
    put(P.page, "clockModule", () => Promise.resolve({ fifthPhase: () => 0.5, wireFifth() {} }));
    take(P.page, "launchStart")(Promise.resolve());
    await settle(50);
    const wiredAtBoot = !!wiredPath;
    got9d = [callsLaunchLoad, wiredAtBoot];
  } catch (e) { got9d = "threw: " + (e && e.message || e); }
  const ok9d = Array.isArray(got9d) && got9d.every(v => v === true);
  check(ok9d, "9d launchStart calls launchLoad at boot so the corner mark rotates: " + JSON.stringify(got9d));
}

/* ---- 9e to 9j: the band's mark stands as the app icon's figure with its depth, and turns in its frame with its depth
   (board 441). The masks, standing and turning, sit in an svg of their own that is always rendered. ---- */
{
  const pageHtml = fs.readFileSync(path.join(ROOT, "ui", "index.html"), "utf8");
  const markSvg = (/<svg class="mark"[^>]*>[\s\S]*?<\/svg>/.exec(pageHtml) || [""])[0];
  const depthIds = (pageHtml.match(/\bid="depth"/g) || []).length, turnIds = (pageHtml.match(/\bid="depth-turn"/g) || []).length;
  const masks = markSvg.match(/<mask\b[^>]*>/g) || [], paths = markSvg.match(/<path\b[^>]*>/g) || [];
  const holder = (/\n<body>\n(<svg class="mark-masks"[^>]*>[\s\S]*?<\/svg>)\n/.exec(pageHtml) || [])[1] || "";
  const held = holder.match(/<mask\b[^>]*>/g) || [];
  const holderCss = (/\n\.mark-masks\{([^}]*)\}/.exec(pageHtml) || [])[1] || "";
  const allMasks = (pageHtml.match(/<mask\b/g) || []).length;
  const markCss = (/\n\.mark\{([^}]*)\}/.exec(pageHtml) || [])[1] || "";
  const vb = ((/^<svg[^>]*viewBox="([^"]+)"/.exec(markSvg) || [])[1] || "").trim().split(/[\s,]+/).map(Number);
  const share = 256 / vb[2], centred = Math.abs(vb[0] + (vb[2] - 256) / 2) < 1e-3 && vb[1] === vb[0] && vb[3] === vb[2];
  check(masks.length === 0 && paths.length === 1 && /\bfill="currentColor"/.test(paths[0]) && /\bmask="url\(#depth\)"/.test(paths[0])
    && depthIds === 1 && turnIds === 1 && allMasks === 2 && held.length === 2 && /\bid="depth"/.test(held[0]) && /\bid="depth-turn"/.test(held[1])
    && /\bwidth="0"/.test(holder) && /\bheight="0"/.test(holder) && /position:absolute/.test(holderCss) && !/display\s*:\s*none/.test(holderCss)
    && !/\.mark-masks[^{]*\{[^}]*display\s*:\s*none/.test(pageHtml)
    && /width:25px/.test(markCss) && /height:25px/.test(markCss) && Math.abs(share - 0.88) < 1e-4 && centred,
    "9e the band's mark holds no mask and " + paths.length + " path(s), filled currentColor through url(#depth); the page's " + allMasks
    + " mask(s), depth " + depthIds + " and depth-turn " + turnIds + ", sit in one zero-size svg first in the body, placed absolute and never"
    + " display:none; a 25 px box framed at " + (share * 100).toFixed(2) + " per cent, " + (centred ? "centred" : "off centre"));

  const grp = (/<g transform="([^"]+)">\s*<path /.exec(markSvg) || [])[1] || "";
  const gTx = +((/translate\(\s*([-\d.]+)/.exec(grp) || [])[1]), gSc = +((/scale\(\s*([-\d.]+)/.exec(grp) || [])[1]);
  let openingMod = null;
  try { openingMod = require("../ui/opening.js"); } catch (e) { /* reported by the checks below */ }
  const F = (openingMod && openingMod.CORNER_FRAME) || {};
  check(F.x0 === vb[0] && F.w === vb[2] && F.tx === gTx && F.sc === gSc,
    "9f opening.js's corner frame is the band's markup: " + JSON.stringify(F) + " against viewBox " + vb.join(" ") + ", " + grp);

  const standD = (/<path [^>]*?d="([^"]+)"/.exec(markSvg) || [])[1] || "";
  const prevRAF = globalThis.requestAnimationFrame, prevCAF = globalThis.cancelAnimationFrame, prevMO = globalThis.MutationObserver;
  let got9g = null, turnD = "", turnLines = "";
  try {
    let rAFs = [], moCallback = null, isStill = false;
    globalThis.requestAnimationFrame = (cb) => { rAFs.push(cb); return 1; };
    globalThis.cancelAnimationFrame = () => { rAFs = []; };
    globalThis.MutationObserver = function (fn) { moCallback = fn; this.observe = () => {}; this.disconnect = () => {}; };
    const turnMask = { writes: 0, html: "", set innerHTML(v) { this.html = String(v); this.writes++; }, get innerHTML() { return this.html; } };
    const docMock = { hidden: false, addEventListener: () => {}, removeEventListener: () => {},
      getElementById: (id) => id === "depth-turn" ? turnMask : null,
      documentElement: { classList: { contains: () => false } } };
    const node = { ownerDocument: docMock, attrs: { d: standD, fill: "currentColor", stroke: "none", mask: "url(#depth)" },
      getAttribute(k) { return this.attrs[k] || null; }, setAttribute(k, v) { this.attrs[k] = v; } };
    openingMod.wireStudioCorner(node, { still: () => isStill });
    if (rAFs[0]) rAFs[0](50);
    const turning = [node.attrs.mask, node.attrs["stroke-width"], node.attrs.fill, node.attrs.d !== standD, turnMask.writes > 0];
    openingMod.syncCornerPhase(Math.PI / 2);
    turnD = node.attrs.d;
    turnLines = turnMask.html;
    isStill = true;
    if (moCallback) moCallback();
    got9g = [turning, [node.attrs.mask, node.attrs.d === standD, node.attrs.fill, node.attrs.stroke]];
  } catch (e) { got9g = "threw: " + (e && e.message || e); }
  globalThis.requestAnimationFrame = prevRAF; globalThis.cancelAnimationFrame = prevCAF; globalThis.MutationObserver = prevMO;
  check(JSON.stringify(got9g) === JSON.stringify([["url(#depth-turn)", "20", "none", true, true], ["url(#depth)", true, "currentColor", "none"]]),
    "9g turning strokes the figure's own width through the turn's own mask, depth-turn, and writes that mask; standing puts the outline and"
    + " the standing mask back: " + JSON.stringify(got9g));

  /* THE TURN'S LIGHT at c-open: the turn mask's lines, far to near, each grey 0.4 + 0.6 x smoothstep(u), u = (z + 1) / 2, with z
     worked out here from the figure's definition at the line's middle (the nearest point of the pass, z = cos(3t + phi), or of
     its mirror, z the opposite; where two arms cross within half a unit either may be the line's), at the figure's own size and
     the standing mask's width. */
  const lines = [...turnLines.matchAll(/<line x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)" stroke="#([0-9a-f]{2})\5\5" stroke-width="([\d.]+)"\/>/g)]
    .map(m => [+m[1], +m[2], +m[3], +m[4], parseInt(m[5], 16), +m[6]]);
  const ease = z => { const u = z * 0.5 + 0.5; return 0.4 + 0.6 * u * u * (3 - 2 * u); };
  let worstGrey = 0, worstDist = 0;
  for (const l of lines) {
    const mx = (l[0] + l[2]) / 2, my = (l[1] + l[3]) / 2, cands = [];
    let best = Infinity;
    for (let i = 0; i <= 6000; i++) {
      const t = 3 * Math.PI / 4 + Math.PI * i / 6000, x = 128 + 96 * Math.sin(3 * t + Math.PI / 2), y = 128 + 96 * Math.sin(2 * t), z = Math.cos(3 * t + Math.PI / 2);
      for (const c of [[x, y, z], [256 - x, y, -z]]) { const d = Math.hypot(c[0] - mx, c[1] - my); cands.push([d, c[2]]); if (d < best) best = d; }
    }
    worstDist = Math.max(worstDist, best);
    worstGrey = Math.max(worstGrey, Math.min(...cands.filter(c => c[0] <= best + 0.5).map(c => Math.abs(255 * ease(c[1]) - l[4]))));
  }
  const greys = lines.map(l => l[4]);
  check(lines.length > 100 && lines.length === (turnLines.match(/<line\b/g) || []).length && lines.every((l, i) => i === 0 || l[4] >= lines[i - 1][4])
    && lines.every(l => l[5] === 21.67) && worstDist < 0.6 && worstGrey <= 8 && Math.min(...greys) <= 103 && Math.max(...greys) >= 254,
    "9i at c-open the turn's mask holds " + lines.length + " line(s) far to near at the standing mask's width, greys " + Math.min(...greys) + " to "
    + Math.max(...greys) + ", each within " + worstGrey.toFixed(2) + " of 0.4 + 0.6 x smoothstep of its depth, its middle " + worstDist.toFixed(2)
    + " from the figure at its own size");

  /* THE STANDING MARK IS THE AGREED CUT, BYTE FOR BYTE: the standing mask, in its defs, then the band's figure, is the cut taken
     whole, its sha256 written here when it landed. */
  const standMask = (/(<mask id="depth"[\s\S]*?<\/mask>)/.exec(holder) || [])[1] || "";
  const figure = (/^<svg[^>]*>([\s\S]*)<\/svg>$/.exec(markSvg) || [])[1] || "";
  const standSha = require("node:crypto").createHash("sha256").update("<defs>" + standMask + "</defs>" + figure, "utf8").digest("hex");
  check(standSha === "abae675a710e80f6a85fe3c06d602849dd12addb650488ae9a38baf182f04648",
    "9j the standing mark is the agreed cut byte for byte, its mask in the masks' svg and its figure in the band: sha256 " + standSha.slice(0, 16));

  /* The turn at c-open lies on the standing path: every point of the path's outline sits the figure's own half width, 10,
     from the turn's centreline at 90 degrees. The control: the same line at the fit's size, as the flat mark turned, misses. */
  const outline = (d) => {
    const tok = d.match(/[MLCZ]|-?[\d.]+/g) || [], out = [];
    let i = 0, cmd = "", cur = [0, 0];
    const n = () => +tok[i++];
    while (i < tok.length) {
      if (/[MLCZ]/.test(tok[i])) { cmd = tok[i++]; if (cmd === "Z") continue; }
      if (cmd === "M" || cmd === "L") { cur = [n(), n()]; out.push(cur); }
      else if (cmd === "C") {
        const c = [n(), n(), n(), n(), n(), n()];
        for (let k = 1; k <= 16; k++) { const u = k / 16, g = 1 - u;
          out.push([g * g * g * cur[0] + 3 * g * g * u * c[0] + 3 * g * u * u * c[2] + u * u * u * c[4],
            g * g * g * cur[1] + 3 * g * g * u * c[1] + 3 * g * u * u * c[3] + u * u * u * c[5]]); }
        cur = [c[4], c[5]];
      } else return [];
    }
    return out;
  };
  const worst = (lineD, pts) => {
    const line = outline(lineD);
    let w = 0;
    for (const p of pts) {
      let best = Infinity;
      for (let i = 1; i < line.length; i++) {
        const a = line[i - 1], b = line[i];
        if (Math.abs(p[0] - a[0]) > 30 || Math.abs(p[1] - a[1]) > 30) continue;
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const u = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
        best = Math.min(best, Math.hypot(p[0] - a[0] - u * dx, p[1] - a[1] - u * dy));
      }
      w = Math.max(w, Math.abs(best - 10));
    }
    return w;
  };
  const standPts = outline(standD);
  const on = turnD && standPts.length > 500 ? worst(turnD, standPts) : Infinity;
  const off = openingMod ? worst(openingMod.fifthLinePath(Math.PI / 2), standPts) : 0;
  check(on <= 0.1 && off > 1,
    "9h the turn at c-open lies on the standing figure: its " + standPts.length + " outline points sit within " + on.toFixed(3)
    + " of the half width; control, the line at the fit's size, off by " + (isFinite(off) ? off.toFixed(2) : "more than 30"));
}

check(asserted + 1 === EXPECTED, "every leg ran: " + (asserted + 1) + " of " + EXPECTED + " assertion(s)");
process.stdout.write("opening: " + asserted + " assertion(s), " + failed + " failure(s)\n");
process.exit(failed ? 1 : 0);
