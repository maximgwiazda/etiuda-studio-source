/* STUDIO REMEMBERS ITS WINDOW'S PLACE AND SIZE, CLAMPED TO LIVE DISPLAYS.
 *
 * gate-kind: node
 *
 *     node tests/window-place.mjs
 *
 * Node only, no Electron window opens.
 * Claims:
 *   wp1  windowPlace restores a saved rectangle on a live display, keeps maximised, pulls a
 *        rectangle from a vanished display onto the primary, clamps corners and keeps roomFor
 *        as the minimum
 *   wp2  readWindowPlace and saveWindowPlace round-trip window.json, preserve other keys, and
 *        write nothing when skip is set (a test or hidden launch)
 *   wp3  shell/main.js restores window.json at launch (including maximised and unmaximise bounds)
 *        and saves on move, resize, maximise and close
 *   wp4  shell/main.js under STUDIO_TEST_OFFSCREEN=1 ignores window.json and writes nothing
 *   wp5  shell/main.js launched with --hidden writes nothing while hidden
 *
 * Proved by making each claim fail on a scratch copy of the tree (ETIUDA_PLANTS=off skips).
 */
import "./reg-stand-on.mjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Module, { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { plantText } from "./plant-copy.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SELF = fileURLToPath(import.meta.url);
const SCRATCH = path.join(ROOT, "scratch", "window-place");
const UI = path.join(ROOT, "ui", "index.html");
const ONLY = process.env.WINDOW_PLACE_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const IDS = ["wp1", "wp2", "wp3", "wp4", "wp5"];
const require = createRequire(import.meta.url);
let plantsCopy = null;

function no(id, why) { console.error(id + " " + why); return false; }

async function loadShellLab(ud, opts = {}) {
  const got = { ctorOpts: [], handlers: {}, windows: [] };
  const displays = opts.displays || [
    { workArea: { x: 0, y: 0, width: 1920, height: 1032 }, workAreaSize: { width: 1920, height: 1032 }, bounds: { x: 0, y: 0, width: 1920, height: 1080 } },
    { workArea: { x: -1600, y: 100, width: 1600, height: 860 }, workAreaSize: { width: 1600, height: 860 }, bounds: { x: -1600, y: 0, width: 1600, height: 900 } },
  ];
  const primary = opts.primary || displays[0];

  class Win {
    constructor(o) {
      got.ctorOpts.push(o);
      this._bounds = {
        x: Number.isFinite(o.x) ? o.x : 0,
        y: Number.isFinite(o.y) ? o.y : 0,
        width: o.width || 1280,
        height: o.height || 880,
      };
      this._normalBounds = Object.assign({}, this._bounds);
      this._maximized = false;
      this._minimized = false;
      this._destroyed = false;
      this._events = {};
      this._once = {};
      this.shown = false;
      this.shownInactive = false;
      this.maximizeCalls = 0;
      this.webContents = {
        id: 1,
        on() {},
        once() {},
        send() {},
        setWindowOpenHandler() {},
        getURL: () => pathToFileURL(UI).href,
      };
      got.windows.push(this);
    }
    on(ev, fn) { (this._events[ev] = this._events[ev] || []).push(fn); }
    once(ev, fn) { (this._once[ev] = this._once[ev] || []).push(fn); }
    emit(ev, ...args) {
      const onceList = (this._once[ev] || []).splice(0);
      for (const fn of onceList) fn(...args);
      for (const fn of (this._events[ev] || [])) fn(...args);
    }
    isDestroyed() { return this._destroyed; }
    isMaximized() { return this._maximized; }
    isMinimized() { return this._minimized; }
    getBounds() { return Object.assign({}, this._bounds); }
    getNormalBounds() { return Object.assign({}, this._normalBounds); }
    setBounds(b) {
      this._bounds = Object.assign({}, this._bounds, b);
      if (!this._maximized) this._normalBounds = Object.assign({}, this._bounds);
    }
    setMinimumSize() {}
    maximize() {
      this._maximized = true;
      this.maximizeCalls++;
      const d = electron.screen.getDisplayMatching(this._bounds);
      this._bounds = Object.assign({}, (d && d.workArea) || primary.workArea);
      this.emit("maximize");
    }
    unmaximize() {
      this._maximized = false;
      this.emit("unmaximize");
    }
    show() { this.shown = true; }
    showInactive() { this.shownInactive = true; }
    focus() {}
    restore() { this._minimized = false; }
    hide() {}
    close() { this.emit("close", { preventDefault() {} }); }
    loadFile() {}
  }

  const electron = {
    app: {
      commandLine: { appendSwitch() {}, hasSwitch: () => false, removeSwitch() {} },
      getPath: (name) => (name === "userData" ? ud : (name === "documents" ? path.join(ud, "docs") : path.join(ud, name))),
      getVersion: () => "0.1.0",
      getLocale: () => "en-GB",
      requestSingleInstanceLock: () => true,
      isPackaged: false,
      whenReady: () => new Promise(() => {}),
      on() {},
      quit() {},
      exit() {},
    },
    BrowserWindow: Object.assign(Win, { fromWebContents: () => got.windows[0] || null, getAllWindows: () => got.windows }),
    Menu: { setApplicationMenu() {}, buildFromTemplate: () => ({ popup() {} }) },
    dialog: {
      showMessageBox: () => Promise.resolve({ response: 0 }),
      showOpenDialog: () => Promise.resolve({ canceled: true, filePaths: [] }),
      showSaveDialog: () => Promise.resolve({ canceled: true, filePath: "" }),
    },
    nativeTheme: { themeSource: "system", shouldUseDarkColors: false },
    clipboard: { writeText() {} },
    safeStorage: { isEncryptionAvailable: () => false },
    screen: {
      getAllDisplays: () => displays,
      getPrimaryDisplay: () => primary,
      getDisplayMatching: (r) => {
        let best = primary, bestOverlap = -1;
        for (const d of displays) {
          const a = d.workArea;
          const n = Math.max(0, Math.min(r.x + r.width, a.x + a.width) - Math.max(r.x, a.x))
            * Math.max(0, Math.min(r.y + r.height, a.y + a.height) - Math.max(r.y, a.y));
          if (n > bestOverlap) { bestOverlap = n; best = d; }
        }
        return best;
      },
      on() {},
      removeListener() {},
    },
    session: {
      defaultSession: {
        setPermissionRequestHandler() {},
        setPermissionCheckHandler() {},
        setDevicePermissionHandler() {},
        setSpellCheckerLanguages() {},
        setSpellCheckerDictionaryDownloadURL() {},
        setSpellCheckerEnabled() {},
      },
    },
    shell: { openExternal() {}, showItemInFolder() {}, trashItem: async () => {} },
    Notification: function () { return { on() {}, show() {} }; },
    Tray: null,
    ipcMain: {
      handle(ch, fn) { got.handlers[ch] = fn; },
      on() {},
    },
  };

  const prevLoad = Module._load;
  const prevOffscreen = process.env.STUDIO_TEST_OFFSCREEN;
  const prevArgv = process.argv.slice();
  const mainPath = path.join(ROOT, "shell", "main.js");
  const placePath = path.join(ROOT, "src", "window-place.cjs");
  const sizePath = path.join(ROOT, "src", "window-size.cjs");
  delete require.cache[mainPath];
  delete require.cache[placePath];
  delete require.cache[sizePath];

  if (opts.offscreen !== undefined) process.env.STUDIO_TEST_OFFSCREEN = opts.offscreen;
  else delete process.env.STUDIO_TEST_OFFSCREEN;
  if (opts.argv) process.argv = opts.argv;

  Module._load = function (req, parent, isMain) {
    if (req === "electron") return electron;
    return prevLoad.call(this, req, parent, isMain);
  };
  let exportsMain = null;
  const restoreEnv = () => {
    Module._load = prevLoad;
    if (prevOffscreen !== undefined) process.env.STUDIO_TEST_OFFSCREEN = prevOffscreen;
    else delete process.env.STUDIO_TEST_OFFSCREEN;
    process.argv = prevArgv;
  };
  try {
    exportsMain = require(mainPath);
    if (typeof opts.run === "function") {
      return await opts.run({ got, electron, exportsMain });
    }
  } finally {
    restoreEnv();
  }
  return { got, electron, exportsMain };
}

const CHECKS = {
  async wp1() {
    let WP, WS;
    try {
      WP = require(path.join(ROOT, "src", "window-place.cjs"));
      WS = require(path.join(ROOT, "src", "window-size.cjs"));
    } catch (e) {
      return no("wp1", "missing src/window-place.cjs: " + (e && e.message));
    }
    if (typeof WP.windowPlace !== "function") return no("wp1", "windowPlace missing");
    const main = { x: 0, y: 0, width: 1920, height: 1032 };
    const left = { x: -1600, y: 100, width: 1600, height: 860 };
    const areas = [main, left];
    const room = WS.roomFor([{ workAreaSize: main }, { workAreaSize: left }], { workAreaSize: main });
    const J = JSON.stringify;

    const first = WP.windowPlace(null, areas, main, room);
    if (J(first) !== J({ x: 320, y: 76, width: 1280, height: 880, maximized: false })) {
      return no("wp1", "first launch: " + J(first));
    }

    const maxSaved = WP.windowPlace({ x: 40, y: 30, width: 1000, height: 700, maximized: true }, areas, main, room);
    if (J(maxSaved) !== J({ x: 40, y: 30, width: 1000, height: 700, maximized: true })) {
      return no("wp1", "maximised restore: " + J(maxSaved));
    }

    const second = WP.windowPlace({ x: -1500, y: 200, width: 960, height: 600, maximized: false }, areas, main, room);
    if (J(second) !== J({ x: -1500, y: 200, width: 960, height: 600, maximized: false })) {
      return no("wp1", "second monitor: " + J(second));
    }

    const gone = WP.windowPlace({ x: 6000, y: 6000, width: 1000, height: 700, maximized: true }, areas, main, room);
    if (J(gone) !== J({ x: 320, y: 76, width: 1280, height: 880, maximized: false })) {
      return no("wp1", "vanished display: " + J(gone));
    }

    const hanging = WP.windowPlace({ x: 1700, y: 900, width: 1000, height: 700, maximized: false }, areas, main, room);
    if (hanging.x + hanging.width > main.x + main.width || hanging.y + hanging.height > main.y + main.height
        || hanging.x < main.x || hanging.y < main.y || hanging.width !== 1000 || hanging.height !== 700) {
      return no("wp1", "corner clamp: " + J(hanging));
    }

    const big = WP.windowPlace({ x: -1700, y: 50, width: 2400, height: 1400, maximized: false }, areas, main, room);
    if (J(big) !== J({ x: -1600, y: 100, width: 1600, height: 860, maximized: false })) {
      return no("wp1", "too large clamp: " + J(big));
    }

    const tiny = WP.windowPlace({ x: 40, y: 30, width: 300, height: 200, maximized: false }, areas, main, room);
    if (tiny.width !== room.minWidth || tiny.height !== room.minHeight) {
      return no("wp1", "roomFor minimum not kept: " + J(tiny) + " vs " + J(room));
    }

    const bad = WP.windowPlace({ x: "a", y: 0, width: 1000, height: 700 }, areas, main, room);
    const badMax = WP.windowPlace({ x: 40, y: 30, width: 1000, height: 700, maximized: "yes" }, areas, main, room);
    if (bad.x !== 320 || badMax.maximized !== false) {
      return no("wp1", "malformed handling: " + J({ bad, badMax }));
    }
    return true;
  },

  async wp2() {
    let WP;
    try { WP = require(path.join(ROOT, "src", "window-place.cjs")); }
    catch (e) { return no("wp2", "missing src/window-place.cjs: " + (e && e.message)); }
    if (typeof WP.readWindowPlace !== "function" || typeof WP.saveWindowPlace !== "function" || typeof WP.windowFile !== "function") {
      return no("wp2", "missing readWindowPlace/saveWindowPlace/windowFile");
    }
    const dir = path.join(SCRATCH, "wp2");
    fs.mkdirSync(dir, { recursive: true });
    const file = WP.windowFile(dir);
    if (path.basename(file) !== "window.json") return no("wp2", "windowFile basename " + file);

    const main = { workArea: { x: 0, y: 0, width: 1920, height: 1032 }, workAreaSize: { width: 1920, height: 1032 } };
    const screen = { getAllDisplays: () => [main], getPrimaryDisplay: () => main };

    fs.writeFileSync(file, JSON.stringify({ note: "keep-me" }), "utf8");
    const fakeWin = {
      isDestroyed: () => false,
      isMinimized: () => false,
      getNormalBounds: () => ({ x: 110, y: 90, width: 1120, height: 760 }),
      getBounds: () => ({ x: 0, y: 0, width: 1920, height: 1032 }),
    };
    const saved = WP.saveWindowPlace(file, fakeWin, { maximized: true });
    if (!saved) return no("wp2", "saveWindowPlace returned false");
    const raw = JSON.parse(fs.readFileSync(file, "utf8"));
    if (raw.note !== "keep-me" || raw.x !== 110 || raw.y !== 90 || raw.width !== 1120 || raw.height !== 760 || raw.maximized !== true) {
      return no("wp2", "written json wrong: " + JSON.stringify(raw));
    }
    const read = WP.readWindowPlace(file, screen);
    if (!read || read.x !== 110 || read.y !== 90 || read.width !== 1120 || read.height !== 760 || read.maximized !== true) {
      return no("wp2", "readWindowPlace mismatch: " + JSON.stringify(read));
    }

    if (WP.readWindowPlace(file, screen, { skip: true }) !== null) {
      return no("wp2", "readWindowPlace with skip:true did not return null");
    }
    const skipFile = path.join(dir, "skip-new.json");
    const wroteSkip = WP.saveWindowPlace(skipFile, fakeWin, { maximized: false, skip: true });
    if (wroteSkip !== false || fs.existsSync(skipFile)) {
      return no("wp2", "saveWindowPlace with skip:true wrote new file");
    }
    const before = fs.readFileSync(file, "utf8");
    WP.saveWindowPlace(file, {
      isDestroyed: () => false,
      isMinimized: () => false,
      getNormalBounds: () => ({ x: 1, y: 2, width: 999, height: 777 }),
    }, { maximized: false, skip: true });
    if (fs.readFileSync(file, "utf8") !== before) {
      return no("wp2", "saveWindowPlace with skip:true overwrote existing file");
    }
    return true;
  },

  async wp3() {
    const ud = path.join(SCRATCH, "wp3");
    fs.mkdirSync(ud, { recursive: true });
    const file = path.join(ud, "window.json");
    fs.writeFileSync(file, JSON.stringify({ x: -1450, y: 150, width: 1100, height: 720, maximized: true }), "utf8");
    fs.writeFileSync(path.join(ud, "studio.json"), JSON.stringify({ format: 1, writtenBy: "0.1.0", quitOnClose: true }), "utf8");

    const { got, exportsMain } = await loadShellLab(ud, { offscreen: undefined, argv: ["node", "studio"] });
    const win = exportsMain && typeof exportsMain.createWindow === "function"
      ? exportsMain.createWindow()
      : (got.windows[0] || null);
    if (!win) return no("wp3", "createWindow did not build a window");
    const opt = got.ctorOpts[got.ctorOpts.length - 1];
    if (opt.x !== -1600 || opt.y !== 100 || opt.width !== 1600 || opt.height !== 860) {
      return no("wp3", "maximised window not built at target display workArea: " + JSON.stringify(opt));
    }
    win.emit("ready-to-show");
    if (win.maximizeCalls !== 1) return no("wp3", "ready-to-show did not call maximize() for saved maximized:true");

    /* First unmaximize returns to the held normal rectangle on the second display. */
    win.unmaximize();
    const afterUnmax = win.getBounds();
    if (afterUnmax.x !== -1450 || afterUnmax.y !== 150 || afterUnmax.width !== 1100 || afterUnmax.height !== 720) {
      return no("wp3", "unmaximize did not restore normal rectangle: " + JSON.stringify(afterUnmax));
    }

    /* Moving and closing saves the new normal place and maximized=false. */
    win.setBounds({ x: 120, y: 80, width: 1020, height: 680 });
    win.emit("moved");
    win.close();
    const afterClose = JSON.parse(fs.readFileSync(file, "utf8"));
    if (afterClose.x !== 120 || afterClose.y !== 80 || afterClose.width !== 1020 || afterClose.height !== 680 || afterClose.maximized !== false) {
      return no("wp3", "close did not save new bounds: " + JSON.stringify(afterClose));
    }

    /* Moved/resized debounce also saves without close. */
    win.setBounds({ x: 240, y: 140, width: 1040, height: 700 });
    win.emit("resized");
    await new Promise(r => setTimeout(r, 650));
    const afterDebounce = JSON.parse(fs.readFileSync(file, "utf8"));
    if (afterDebounce.x !== 240 || afterDebounce.y !== 140 || afterDebounce.width !== 1040 || afterDebounce.height !== 700) {
      return no("wp3", "resized debounce did not save: " + JSON.stringify(afterDebounce));
    }
    return true;
  },

  async wp4() {
    const ud = path.join(SCRATCH, "wp4");
    fs.mkdirSync(ud, { recursive: true });
    const file = path.join(ud, "window.json");
    const sentinel = JSON.stringify({ x: 55, y: 66, width: 1050, height: 710, maximized: true });
    fs.writeFileSync(file, sentinel, "utf8");
    fs.writeFileSync(path.join(ud, "studio.json"), JSON.stringify({ format: 1, writtenBy: "0.1.0", quitOnClose: true }), "utf8");

    const { got, exportsMain } = await loadShellLab(ud, { offscreen: "1", argv: ["node", "studio"] });
    const win = exportsMain && typeof exportsMain.createWindow === "function"
      ? exportsMain.createWindow()
      : (got.windows[0] || null);
    if (!win) return no("wp4", "createWindow did not build a window");
    const opt = got.ctorOpts[got.ctorOpts.length - 1];
    if (opt.x < 1920 || opt.y < 1032) {
      return no("wp4", "offscreen mode did not place window offscreen: " + JSON.stringify(opt));
    }
    win.emit("ready-to-show");
    if (win.maximizeCalls !== 0) return no("wp4", "offscreen mode called maximize()");

    win.setBounds({ x: 500, y: 400, width: 1000, height: 700 });
    win.emit("moved");
    win.emit("resized");
    win.maximize();
    await new Promise(r => setTimeout(r, 650));
    win.close();

    if (fs.readFileSync(file, "utf8") !== sentinel) {
      return no("wp4", "offscreen mode wrote over window.json: " + fs.readFileSync(file, "utf8"));
    }
    const freshUd = path.join(SCRATCH, "wp4-fresh");
    fs.mkdirSync(freshUd, { recursive: true });
    const lab2 = await loadShellLab(freshUd, { offscreen: "1", argv: ["node", "studio"] });
    const win2 = lab2.exportsMain && typeof lab2.exportsMain.createWindow === "function"
      ? lab2.exportsMain.createWindow()
      : (lab2.got.windows[0] || null);
    win2.emit("moved");
    win2.close();
    if (fs.existsSync(path.join(freshUd, "window.json"))) {
      return no("wp4", "offscreen mode created window.json");
    }
    return true;
  },

  async wp5() {
    const ud = path.join(SCRATCH, "wp5");
    fs.mkdirSync(ud, { recursive: true });
    const file = path.join(ud, "window.json");
    const sentinel = JSON.stringify({ x: 77, y: 88, width: 1080, height: 730, maximized: true });
    fs.writeFileSync(file, sentinel, "utf8");
    fs.writeFileSync(path.join(ud, "studio.json"), JSON.stringify({ format: 1, writtenBy: "0.1.0", quitOnClose: true }), "utf8");

    return await loadShellLab(ud, {
      offscreen: undefined,
      argv: ["node", "studio", "--hidden"],
      async run({ got, exportsMain }) {
        const win = exportsMain && typeof exportsMain.createWindow === "function"
          ? exportsMain.createWindow()
          : (got.windows[0] || null);
        if (!win) return no("wp5", "createWindow did not build a window");
        win.emit("ready-to-show");
        if (win.shown || win.maximizeCalls !== 0) return no("wp5", "hidden launch showed or maximised window");

        win.setBounds({ x: 333, y: 222, width: 950, height: 650 });
        win.emit("moved");
        win.emit("resized");
        await new Promise(r => setTimeout(r, 650));
        win.close();

        if (fs.readFileSync(file, "utf8") !== sentinel) {
          return no("wp5", "hidden launch wrote over window.json: " + fs.readFileSync(file, "utf8"));
        }
        const freshUd = path.join(SCRATCH, "wp5-fresh");
        fs.mkdirSync(freshUd, { recursive: true });
        return await loadShellLab(freshUd, {
          offscreen: undefined,
          argv: ["node", "studio", "--hidden"],
          async run({ got: got2, exportsMain: exp2 }) {
            const win2 = exp2 && typeof exp2.createWindow === "function"
              ? exp2.createWindow()
              : (got2.windows[0] || null);
            win2.emit("moved");
            win2.close();
            if (fs.existsSync(path.join(freshUd, "window.json"))) {
              return no("wp5", "hidden launch created window.json");
            }
            return true;
          },
        });
      },
    });
  },
};

const PLANTS = [
  ["wp1", "src/window-place.cjs", "  const r = area ? saved : Object.assign({", "  const r = ok ? saved : Object.assign({"],
  ["wp1", "src/window-place.cjs", "    maximized: !!area && saved.maximized === true,", "    maximized: false,"],
  ["wp2", "src/window-place.cjs", "  if (o.skip || !file || !win", "  if (!file || !win"],
  ["wp3", "shell/main.js", "  const place = OFFSCREEN ? null : readWindowPlace(placeFile, screen); /* plant:wp-read */", "  const place = null;"],
  ["wp4", "shell/main.js", "  const canSavePlace = () => !OFFSCREEN && !win.studioHiddenPending && !win.isDestroyed(); /* plant:wp-can-save */",
    "  const canSavePlace = () => !win.studioHiddenPending && !win.isDestroyed();"],
  ["wp5", "shell/main.js", "  const canSavePlace = () => !OFFSCREEN && !win.studioHiddenPending && !win.isDestroyed(); /* plant:wp-can-save */",
    "  const canSavePlace = () => !OFFSCREEN && !win.isDestroyed();"],
];

function sha(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }
function plantOnce(id, rel, from, to) {
  const tree = plantsCopy;
  const file = path.join(tree, rel);
  const buf = fs.readFileSync(file);
  const was = sha(buf);
  const next = plantText(buf.toString("utf8"), from, to, rel);
  let child = null;
  try {
    fs.writeFileSync(file, next, "utf8");
    child = spawnSync(process.execPath, [path.join(tree, path.relative(ROOT, SELF))], {
      cwd: tree,
      env: Object.assign({}, process.env, { WINDOW_PLACE_ONLY: id, ETIUDA_PLANTS: "off" }),
      encoding: "utf8",
      timeout: 120000,
    });
  } finally {
    fs.writeFileSync(file, buf);
    if (sha(fs.readFileSync(file)) !== was) throw new Error(id + " restore mismatch in " + rel);
  }
  const red = !!(child && child.status === 1 && String(child.stdout || "").includes("PLANT-RED"));
  if (!red) {
    console.error(id + " plant did not bite: status " + (child && child.status));
    console.error(String((child && child.stdout) || "") + String((child && child.stderr) || ""));
  }
  return red;
}

async function main() {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const planted = IDS.every((id) => PLANTS.some((p) => p[0] === id));
  if (!planted) {
    console.log("FAIL a check with no plant");
    dropScratch(SCRATCH, "window-place");
    process.exit(1);
  }
  if (PLANTS_OFF) {
    console.log("SKIP the plants phase: " + PLANTS.length + " plants each turn their check red in a scratch copy (ETIUDA_PLANTS=off)");
  } else {
    const { plantsTree, treeSha, dropPlantsTree } = await import("./plants-tree.mjs");
    const before = treeSha(ROOT);
    const files = ["src/window-place.cjs", "shell/main.js"];
    const shas = files.map((rel) => sha(fs.readFileSync(path.join(ROOT, rel))));
    let red = 0;
    let held = false;
    let same = false;
    try {
      plantsCopy = plantsTree(ROOT, "window-place");
      for (const [id, rel, from, to] of PLANTS) {
        const ok = plantOnce(id, rel, from, to);
        console.log((ok ? "plant " : "PLANT FAIL ") + id + (ok ? " red" : ""));
        if (ok) red++;
      }
      held = treeSha(ROOT) === before;
      console.log((held ? "ok   " : "FAIL ") + "the checkout's sha256 over src/, shell/ and ui/ is unchanged after the plants phase");
      same = files.every((rel, i) => sha(fs.readFileSync(path.join(ROOT, rel))) === shas[i]);
      console.log((same ? "ok   " : "FAIL ") + "the planted files are byte for byte as they were (sha256)");
    } finally {
      dropPlantsTree(plantsCopy, ROOT);
    }
    if (red !== PLANTS.length || !held || !same) {
      dropScratch(SCRATCH, "window-place");
      process.exit(1);
    }
  }

  let n = 0;
  for (const id of IDS) {
    let ok = false;
    try { ok = await CHECKS[id](); }
    catch (e) { console.error(id + " " + ((e && e.stack) || e)); ok = false; }
    console.log((ok ? "ok   " : "FAIL ") + id);
    if (ok) n++;
  }
  console.log("window-place " + (n + (PLANTS_OFF ? 0 : 1)) + "/" + (IDS.length + 1)
    + (PLANTS_OFF ? ", 1 skipped" : ", plants " + PLANTS.length + "/" + PLANTS.length + " red"));
  console.log("#counts checks=" + (IDS.length + (PLANTS_OFF ? 0 : 1)) + " skipped=" + (PLANTS_OFF ? 1 : 0)
    + " failed=" + (IDS.length - n) + " expected=" + (IDS.length + 1));
  dropScratch(SCRATCH, "window-place");
  process.exit(n === IDS.length ? 0 : 1);
}

if (ONLY) {
  const fn = CHECKS[ONLY];
  if (!fn) { console.error("unknown " + ONLY); process.exit(2); }
  fs.mkdirSync(SCRATCH, { recursive: true });
  Promise.resolve(fn()).then((ok) => {
    console.log(ok ? "PLANT-GREEN" : "PLANT-RED");
    process.exit(ok ? 0 : 1);
  }).catch((e) => {
    console.error((e && e.stack) || e);
    process.exit(2);
  });
} else {
  main().catch((e) => {
    console.error((e && e.stack) || e);
    try { dropScratch(SCRATCH, "window-place"); } catch { /* verdict is error above */ }
    process.exit(1);
  });
}
