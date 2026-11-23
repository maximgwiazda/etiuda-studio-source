/* The switch to Shelves, the cards table's rows, and the cut pass (node tests/shelves-switch.mjs).
 *
 * A fake shelf of 400 tiles and 15 remembered rects, and a cut pass over feet in and out of the
 * row. No window. Exit 0 when every check holds, 1 when any fails.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPage } from "./page-stand-in.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const BOOT = "  boot();\n})();";
const EXPECTED = 9;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}

const app = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
const html = fs.readFileSync(path.join(ROOT, "ui", "index.html"), "utf8");
const at = app.indexOf('"cards-as":');
const end = app.indexOf('"card-retire"', at);
const handler = at >= 0 && end > at ? app.slice(at, end) : "";

check(at >= 0 && !/\bpaint\(\s*\)/.test(handler) && /\bpaintMain\(\s*\)/.test(handler),
  "s1 the Table or Shelves handler paints the main pane and does not paint the window: "
  + (/\bpaint\(\s*\)/.test(handler) ? "calls paint()" : "no paint()"));
check(/\.tile\{[^}]*content-visibility:\s*auto/.test(html)
  && /\.tile\{[^}]*contain-intrinsic-size:\s*auto\s+\d+px/.test(html),
  "s2 a tile skips layout off screen, with a first guess of its height");
check(/translateX\(-10px\)/.test(handler) && /shvSettle\(/.test(handler),
  "s3 the shelves still arrive by opacity and translateX, and a tile that was on screen still travels");

if (!app.endsWith(BOOT + "\n") && !app.endsWith(BOOT)) throw new Error("shelves-switch: boot() has moved");
const source = app.replace(BOOT, "  window.__fast = { shvSettle, cutPass, CUT_SEL, CUT_FOOT,"
  + " setRange: (r) => { cutRange = r; } };\n" + BOOT);
const home = loadPage({
  api: { saveCard() { return Promise.resolve({ error: null }); } },
  uiLang: "en",
  source,
});
const fast = home.sandbox.__fast;
check(!!fast && typeof fast.shvSettle === "function" && typeof fast.cutPass === "function",
  "s4 the page exposes the shelf settle and the cut pass");

/* 400 tiles, 15 of them remembered from the table. Only those 15 are measured. */
const tiles = [];
let rects = 0;
for (let i = 0; i < 400; i++) {
  const id = "c" + i;
  tiles.push({
    getAttribute: (k) => (k === "data-id" ? id : null),
    getBoundingClientRect() { rects++; return { left: 8, top: 8, right: 40, bottom: 40, width: 32, height: 32 }; },
    isConnected: true,
  });
}
const from = new Map();
for (let i = 0; i < 15; i++) from.set("c" + i, { left: 0, top: 0, right: 20, bottom: 16, width: 20, height: 16 });
const shv = {
  scrollLeft: 0,
  querySelectorAll: (sel) => (sel === ".tile" ? tiles : []),
};
home.doc.getElementById = (id) => (id === "shv" ? shv : null);
fast.shvSettle({ left: 0, lists: new Map(), tiles: new Map() }, from);
check(rects === 15, "s5 400 tiles and 15 remembered rects measure 15 tiles: " + rects);

/* Feet in a shelf that sits in the row are measured. Feet in a shelf past the row are not. */
const port = {
  getBoundingClientRect: () => ({ left: 0, right: 900, top: 0, bottom: 640, width: 900, height: 640 }),
};
function shelfAt(left) {
  return {
    parentElement: port,
    getBoundingClientRect: () => ({ left, right: left + 220, top: 0, bottom: 520, width: 220, height: 520 }),
  };
}
function foot(shelf) {
  let n = 0;
  return {
    closest: (sel) => (sel === ".shelf" ? shelf : null),
    get scrollHeight() { n++; return 48; },
    clientHeight: 20,
    classList: { toggle() {}, contains() { return false; } },
    hasAttribute() { return false; },
    setAttribute() {},
    textContent: "A title",
    get title() { return this._title || ""; },
    set title(v) { this._title = v; },
    get reads() { return n; },
  };
}
const onShelf = shelfAt(24);
const offShelf = shelfAt(2400);
const onFeet = [foot(onShelf), foot(onShelf)];
const offFeet = [foot(offShelf), foot(offShelf)];
const feet = onFeet.concat(offFeet);
fast.setRange({ selectNodeContents() {}, getBoundingClientRect: () => ({ left: 0, right: 0, top: 0, bottom: 0 }) });
const qsa = home.doc.querySelectorAll.bind(home.doc);
home.doc.querySelectorAll = (s) => (s === fast.CUT_FOOT ? feet : s === fast.CUT_SEL ? [] : qsa(s));
fast.cutPass();
const onReads = onFeet.reduce((n, el) => n + el.reads, 0);
const offReads = offFeet.reduce((n, el) => n + el.reads, 0);
check(onReads === 2 && offReads === 0,
  "s6 two titles in a shelf on screen are measured, two in a shelf past the row are not: on " + onReads + ", off " + offReads);

/* A tile in the shelf's own band is measured. A tile far below that band is not. */
const band = {
  getBoundingClientRect: () => ({ left: 0, right: 220, top: 80, bottom: 480, width: 220, height: 400 }),
};
function tileFoot(top, bottom) {
  let n = 0;
  const tile = {
    parentElement: band,
    getBoundingClientRect: () => ({ left: 8, right: 200, top, bottom, width: 192, height: bottom - top }),
  };
  return {
    closest: (sel) => (sel === ".shelf" ? onShelf : sel === ".tile" ? tile : null),
    get scrollHeight() { n++; return 48; },
    clientHeight: 20,
    classList: { toggle() {}, contains() { return false; } },
    hasAttribute() { return false; },
    setAttribute() {},
    textContent: "A title",
    get title() { return this._title || ""; },
    set title(v) { this._title = v; },
    get reads() { return n; },
  };
}
const seenTile = tileFoot(100, 180);
const lowTile = tileFoot(2000, 2080);
home.doc.querySelectorAll = (s) => (s === fast.CUT_FOOT ? [seenTile, lowTile] : s === fast.CUT_SEL ? [] : qsa(s));
fast.cutPass();
check(seenTile.reads === 1 && lowTile.reads === 0,
  "s8 a tile in the shelf's band is measured, a tile below that band is not: in " + seenTile.reads + ", below " + lowTile.reads);

/* Three keys in one frame write the mirror once, with the last text. The lead-dots listener is the other input. */
const frames = [];
home.sandbox.requestAnimationFrame = (fn) => { frames.push(fn); return frames.length; };
home.page.S.open = { dir: "d", draft: { cards: [{ id: "c1", title: { en: "T" }, body: { en: "" }, shelf: "s" }] } };
home.page.S.sel = "c1";
let writes = 0, written = "";
const mirror = {
  classList: { contains: (c) => c === "mg-mirror" },
  isConnected: true,
  set innerHTML(v) { writes++; written = String(v); },
  get innerHTML() { return written; },
};
const field = {
  value: "",
  getAttribute: (k) => (k === "data-f" ? "body" : k === "data-l" ? "en" : null),
  previousElementSibling: mirror,
};
/* The body field's listener writes the mirror through boxTyped, which each reply's box shares (E3). */
const inputs = home.doc.heard.filter((h) => h.type === "input" && String(h.fn).indexOf("boxTyped(") >= 0);
check(inputs.length === 1, "s9 the body field has one listener that writes the mirror: " + inputs.length);
let threw = "";
const bodyInput = inputs[0];
if (bodyInput) {
  try {
    for (const word of ["one", "two", "three"]) {
      field.value = word;
      bodyInput.fn({ target: field, data: "x", inputType: "insertText" });
    }
  } catch (e) { threw = String(e && e.message || e); }
}
const queued = frames.length;
const before = writes;
frames.splice(0).forEach((fn) => fn());
check(!threw && before === 0 && writes === 1 && queued === 1 && written.indexOf("three") >= 0,
  "s10 three keys in one frame write the mirror once, after the frame, with the last text: before "
  + before + ", writes " + writes + ", queued " + queued + ", text " + JSON.stringify(written)
  + (threw ? ", threw " + threw : ""));

if (asserted !== EXPECTED) {
  failed++;
  process.stdout.write("  FAIL expected " + EXPECTED + " checks, ran " + asserted + "\n");
}
process.stdout.write("\nshelves-switch  " + asserted + " assertion(s), " + failed + " failure(s)\n");
process.exit(failed ? 1 : 0);
