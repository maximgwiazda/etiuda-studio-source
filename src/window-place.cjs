"use strict";
/* THE WINDOW'S PLACE BETWEEN SESSIONS, ported from the desk's shell/main.js
 * (windowPlace, readWindowPlace, saveWindowPlace, maximizedArea) beside src/window-size.cjs,
 * keeping roomFor as the minimum. CommonJS so shell/main.js can require it.
 */
const fs = require("node:fs");
const path = require("node:path");
const { roomFor, OPEN_W, OPEN_H } = require("./window-size.cjs");
const { writeWhole } = require("./whole-write.cjs");

const PLACE_FILE = "window.json";

function windowFile(userData) {
  return path.join(String(userData || ""), PLACE_FILE);
}

function readWindowMeta(file) {
  try {
    const o = JSON.parse(fs.readFileSync(file, "utf8"));
    return (o && typeof o === "object" && !Array.isArray(o)) ? o : {};
  } catch {
    return {};
  }
}

function validArea(a) {
  return !!a && ["x", "y", "width", "height"].every((k) => Number.isFinite(a[k])) && a.width > 0 && a.height > 0;
}

/** Pure. The saved rectangle on the work area it overlaps most, clamped inside it and never
 *  smaller than `size.minWidth` / `size.minHeight`; where it overlaps none, `size` centred on
 *  the primary work area. */
function windowPlace(saved, areas, primary, size) {
  const open = size || { width: OPEN_W, height: OPEN_H };
  const openW = Number.isFinite(open.width) && open.width > 0 ? open.width : OPEN_W;
  const openH = Number.isFinite(open.height) && open.height > 0 ? open.height : OPEN_H;
  const minW = Number.isFinite(open.minWidth) && open.minWidth > 0 ? open.minWidth : 0;
  const minH = Number.isFinite(open.minHeight) && open.minHeight > 0 ? open.minHeight : 0;
  const home = validArea(primary) ? primary : { x: 0, y: 0, width: openW, height: openH };
  const liveAreas = (Array.isArray(areas) ? areas : []).filter(validArea);

  const overlap = (a, b) => Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x))
    * Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  const ok = !!saved && !Array.isArray(saved) && validArea(saved);
  let area = null, best = 0;
  if (ok) {
    for (const a of liveAreas) {
      const n = overlap(saved, a);
      if (n > best) { best = n; area = a; }
    }
  }
  const r = area ? saved : Object.assign({ /* plant:wp-area */
    x: home.x + (home.width - openW) / 2,
    y: home.y + (home.height - openH) / 2,
    width: openW,
    height: openH,
  });
  const on = area || home;
  const width = Math.round(Math.min(on.width, Math.max(minW, r.width)));
  const height = Math.round(Math.min(on.height, Math.max(minH, r.height)));
  return {
    x: Math.round(Math.min(Math.max(r.x, on.x), on.x + on.width - width)),
    y: Math.round(Math.min(Math.max(r.y, on.y), on.y + on.height - height)),
    width: width,
    height: height,
    maximized: !!area && saved.maximized === true, /* plant:wp-max */
  };
}

/** Reads `file` and resolves the window's place against `screen`, keeping `roomFor` as the minimum. */
function readWindowPlace(file, screen, opts) {
  if (opts && opts.skip) return null;
  let saved = null;
  try { saved = JSON.parse(fs.readFileSync(file, "utf8")); } catch { /* first launch, or unreadable */ }
  try {
    const displays = screen && typeof screen.getAllDisplays === "function" ? screen.getAllDisplays() : [];
    const primary = screen && typeof screen.getPrimaryDisplay === "function" ? screen.getPrimaryDisplay() : null;
    const room = roomFor(displays, primary);
    return windowPlace(saved, displays.map((d) => d && d.workArea), primary && primary.workArea, room);
  } catch (e) {
    console.error("studio: the displays could not be read - " + e.message);
    return { x: 0, y: 0, width: OPEN_W, height: OPEN_H, maximized: false };
  }
}

/** Saves `win`'s normal rectangle and maximised state to `file`, unless `opts.skip` is set. */
function saveWindowPlace(file, win, opts) {
  const o = opts || {};
  if (o.skip || !file || !win || (typeof win.isDestroyed === "function" && win.isDestroyed())) return false; /* plant:wp-skip */
  const maximized = !!o.maximized;
  const minimized = typeof win.isMinimized === "function" && win.isMinimized();
  const snapped = !maximized && !minimized && typeof win.isSnapped === "function" && win.isSnapped();
  const b = o.normal || (snapped && typeof win.getBounds === "function" ? win.getBounds()
    : (typeof win.getNormalBounds === "function" ? win.getNormalBounds()
      : (typeof win.getBounds === "function" ? win.getBounds() : null)));
  if (!validArea(b)) return false;
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    writeWhole(file, JSON.stringify(Object.assign({}, readWindowMeta(file), {
      x: b.x, y: b.y, width: b.width, height: b.height, maximized: maximized,
    })));
    return true;
  } catch (e) {
    console.error("studio: the window's place could not be written - " + e.message);
    return false;
  }
}

/** The work area a window reopened maximised fills: the display its saved rectangle lies on. */
function maximizedArea(r, screen) {
  try {
    if (!r || !screen || typeof screen.getDisplayMatching !== "function") return null;
    const d = screen.getDisplayMatching({ x: r.x, y: r.y, width: r.width, height: r.height });
    const a = d && d.workArea;
    if (!validArea(a)) return null;
    return { x: a.x, y: a.y, width: a.width, height: a.height };
  } catch {
    return null;
  }
}

module.exports = {
  PLACE_FILE,
  windowFile,
  readWindowMeta,
  windowPlace,
  readWindowPlace,
  saveWindowPlace,
  maximizedArea,
};
