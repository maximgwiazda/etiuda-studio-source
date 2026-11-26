/* A PROJECT ROW OPENS ITS PROJECT, AND A PROJECT CAN BE MOVED TO THE RECYCLE BIN WITH UNDO (board 901, the sense pass's
 * findings 27 and 28).
 *
 *     node tests/project-rows.mjs
 *
 * The page is ui/app.js on the stand-in (tests/page-stand-in.mjs), its rows read out of the Projects screen's own markup;
 * the shell is shell/main.js loaded under a stand-in of Electron, as tests/shell-guards.mjs loads it, whose Recycle Bin
 * renames a folder into a scratch bin and never touches the real one. Every project, folder and word is invented.
 *
 *   pr1  a click anywhere on a project's row opens the project
 *   pr2  Enter on a row the hand is on opens it
 *   pr3  the name on the row is text, not a field, and the row needs no Open button
 *   pr4  Remove takes the row out of the list at once and puts Undo at the foot; the folder has not moved yet
 *   pr5  Undo, by its button or by Ctrl+Z, brings the row back, and nothing was sent to the shell
 *   pr6  the next act sends the removed project's folder to the Recycle Bin, that folder and no other
 *   pr7  Opened recently is the last four opened, the latest first
 *   pr8  Put away, which nothing ever filled, is gone from the rail
 *   pr9  the shell moves only the project's own folder: the team's folder outside it, the other projects and the
 *        projects folder itself are where they were
 *   pr10 the shell refuses a folder outside the projects folder, a folder holding no project, a link, and a project
 *        whose team folder is inside it, moving nothing
 *   pr11 a Recycle Bin that refuses leaves the project where it is, and says so
 *   pr12 the clipboard and Show in folder are the shell's: the text reaches the clipboard, and a path not there is said
 *   pr13 only a project directly in the projects folder moves: one nested a folder down, one outside the folder, and one
 *        reached through a junction to the folder are each refused, moving nothing (the test architect's condition 3)
 *   pr14 a project holding another project's team folder stays, whether that project is in the projects folder or only
 *        open in a tab, and the answer names the other project (his condition 1)
 *   pr15 a project whose own team folder is named through a junction to it stays: the paths are compared as the disk has
 *        them (his condition 2)
 *   pr17 on All, a row whose journal count fills in after the paint moves the With changes to publish pill's number at
 *        once, and the pill counts catalogs while the Draft cell counts edits, in words the pill does not use (the Grok
 *        read of 2026-11-11, finding 2)
 *   pr18 Overview's editions kept adds each catalog's archive editions, not its rev (finding 3)
 *   pr19 the Library's and Overview's search fold accents as the desk's library search does: a Polish name typed without
 *        its marks finds the catalog (the read's note at its foot)
 *   pr20 Overview's channel line says the same lapse step the Settings row says, for grace, read-only, lapsed and gone,
 *        in both languages, and a team in good standing still says "the relay"; after the notice is closed the map
 *        still says the step (the Grok read of 2026-11-11, finding 7)
 *   pr21 the Library's and Overview's search folds Polish "ł" and "Ł" to "l" on both sides (board 1005)
 *
 * PROVED BY MAKING IT FAIL, as tests/object-menus.mjs is: each check's plant is written over its file, a child runs that
 * one check and must print PLANT-RED, and the file is put back by its sha256 before the next plant.
 *
 * Node only, no window. Exit 0 when every plant bites and every check holds, 1 otherwise.
 */
import "./reg-stand-on.mjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Module, { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { plantText } from "./plant-copy.mjs";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as Studio from "../src/studio.mjs";
import { loadPage } from "./page-stand-in.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { seatEnv } from "./seated.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SELF = fileURLToPath(import.meta.url);
/* The plants copy. Named apart from the directory walker `tree` below. */
let plantsCopy = null;
const MAIN = path.join(ROOT, "shell", "main.js");
const UI = path.join(ROOT, "ui", "index.html");
const SCRATCH = path.join(ROOT, "scratch", "project-rows");
const ONLY = process.env.PROJECT_ROWS_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const IDS = ["pr1", "pr2", "pr3", "pr4", "pr5", "pr6", "pr7", "pr8", "pr9", "pr10", "pr11", "pr12", "pr13", "pr14", "pr15", "pr16", "pr17", "pr18", "pr19", "pr20", "pr21"];
const require = createRequire(import.meta.url);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function no(id, why) { console.error(id + " " + why); return false; }
const LANGS = [{ code: "en" }, { code: "pl" }];

/* ---- stand-in nodes, read from the page's own markup ------------------------------------------ */
let DOC = null;
/* pr17's row facts by folder: when set before page(), the page's API answers rowFacts from it, as the shell would after the paint. */
let ROW_FACTS = null;
function matchOne(n, one) {
  const m = /^([a-zA-Z][\w-]*)?((?:#[\w-]+|\.[\w-]+|\[[^\]]+\]|:not\([^)]*\))*)$/.exec(one.trim());
  if (!m) return false;
  if (m[1] && String(n.tagName || "") !== m[1].toUpperCase()) return false;
  return (m[2].match(/#[\w-]+|\.[\w-]+|\[[^\]]+\]|:not\([^)]*\)/g) || []).every((p) => {
    if (p[0] === "#") return n.id === p.slice(1);
    if (p[0] === ".") return !!(n.classes && n.classes.has(p.slice(1)));
    if (p.startsWith(":not(")) return !matchOne(n, p.slice(5, -1));
    const a = /^\[([\w-]+)(?:="([^"]*)")?\]$/.exec(p);
    if (!a) return false;
    const has = n.attrs && Object.prototype.hasOwnProperty.call(n.attrs, a[1]);
    return a[2] === undefined ? has : has && String(n.attrs[a[1]]) === a[2];
  });
}
const matches = (n, sel) => String(sel).split(",").some((one) => matchOne(n, one));
function node(tag, attrs, kids, text) {
  const a = Object.assign({}, attrs || {});
  const n = {
    tagName: String(tag).toUpperCase(), attrs: a, children: [], parentNode: null, id: a.id || "",
    classes: new Set(String(a.class || "").split(/\s+/).filter(Boolean)), textContent: text || "", value: "",
    disabled: false, readOnly: false, isConnected: true,
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attrs, k) ? String(this.attrs[k]) : null; },
    hasAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attrs, k); },
    setAttribute(k, v) { this.attrs[k] = String(v); }, removeAttribute(k) { delete this.attrs[k]; },
    closest(sel) { for (let x = this; x; x = x.parentNode) if (x.attrs && matches(x, sel)) return x; return null; },
    matches(sel) { return matches(this, sel); },
    querySelectorAll(sel) { const out = []; const walk = (x) => x.children.forEach((c) => { if (matches(c, sel)) out.push(c); walk(c); }); walk(this); return out; },
    querySelector(sel) { return this.querySelectorAll(sel)[0] || null; },
    focus() { DOC.focused = this; }, blur() {}, select() {},
    getBoundingClientRect() { return { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 }; },
  };
  n.classList = { contains: (c) => n.classes.has(c), add() {}, remove() {}, toggle() {} };
  (kids || []).forEach((k) => { k.parentNode = n; n.children.push(k); });
  return n;
}
const ENT = { "&#39;": "'", "&quot;": "\"", "&lt;": "<", "&gt;": ">", "&amp;": "&" };
const unesc = (s) => String(s).replace(/&#39;|&quot;|&lt;|&gt;|&amp;/g, (m) => ENT[m]);
/** Each project's row as the Projects screen painted it: its own attributes, and a cell to press in. */
function rowsOf(html) {
  return Array.from(String(html).matchAll(/<tr([^>]*)>/g)).map((m) => {
    const attrs = {};
    for (const a of m[1].matchAll(/([\w-]+)(?:="([^"]*)")?/g)) attrs[a[1]] = a[2] == null ? "" : unesc(a[2]);
    return attrs;
  }).filter((a) => a["data-dir"] != null || a["data-ctx"] === "project")
    .map((attrs) => node("tr", attrs, [node("td", { class: "t-title" }), node("td", { class: "mono" })]));
}
function ev(type, target, o) {
  return Object.assign({
    type, target, key: "", altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, isComposing: false, button: 0,
    defaultPrevented: false, stopped: false, halted: false,
    preventDefault() { this.defaultPrevented = true; }, stopPropagation() { this.stopped = true; },
    stopImmediatePropagation() { this.stopped = true; this.halted = true; },
  }, o || {});
}

/* ---- the page's world ------------------------------------------------------------------------- */
const wire = (p) => Promise.resolve(p)
  .then((v) => JSON.parse(JSON.stringify(Object.assign({ error: null }, v))))
  .catch((e) => ({ error: e && e.message ? e.message : String(e), said: (e && e.said) || null, disk: !!(e && e.disk) }));
async function page(name) {
  const base = path.join(SCRATCH, name + "-" + process.pid + "-" + crypto.randomBytes(3).toString("hex"));
  const root = path.join(base, "projects"), bin = path.join(base, "bin");
  fs.mkdirSync(root, { recursive: true }); fs.mkdirSync(bin, { recursive: true });
  const lamps = await Studio.newProject(root, "Harbour lamps", LANGS);
  const ropes = await Studio.newProject(root, "Quay ropes", LANGS);
  const calls = [];
  const api = {
    open: (d) => { calls.push(["open", d]); return wire(Studio.openProject(d)); },
    projects: () => wire(Studio.listProjects(root)),
    proposals: (d) => wire(Studio.listProposals(d)),
    discardUntouched: (d) => wire(Studio.discardUntouched(d)),
    saveFacts: (d, t) => wire(Studio.saveFacts(d, t)),
    renameProject: (d, n) => wire(Studio.renameProject(d, n)),
    /* the shell's verb, stood in for: the folder renamed into this world's bin */
    removeProject: (d) => {
      calls.push(["removeProject", d]);
      fs.renameSync(d, path.join(bin, path.basename(d)));
      return Promise.resolve({ error: null, removed: true, dir: d });
    },
  };
  if (ROW_FACTS) { const facts = ROW_FACTS; api.rowFacts = (d) => Promise.resolve(facts[d] || { error: "no facts" }); }
  const pg = loadPage({ api, uiLang: "en" });
  const P = pg.page;
  DOC = pg.doc;
  P.S.host = { tour: { offered: true }, langs: Studio.builtLangs() };
  Object.assign(P.S, { projects: (await Studio.listProjects(root)).projects, root, screen: "projects", home: "library", pfilter: "all", q: "", err: null });
  function fire(type, e) {
    const all = pg.doc.heard.filter((h) => h.type === type);
    for (const h of all.filter((x) => x.capture).concat(all.filter((x) => !x.capture))) {
      if (e.halted || (e.stopped && !h.capture)) break;
      h.fn(e);
    }
    return e;
  }
  const painted = () => { P.paintProjects(); return pg.node("#main").innerHTML; };
  const rowFor = (dir) => rowsOf(painted()).find((r) => r.getAttribute("data-dir") === dir) || null;
  return { base, root, bin, lamps, ropes, calls, pg, P, fire, painted, rowFor };
}
const sent = (calls, verb) => calls.filter((c) => c[0] === verb);

/* ---- the shell's world -------------------------------------------------------------------------
 * shell/main.js under a stand-in of Electron: its handlers are recorded and asked as the page's own frame asks them; the
 * Recycle Bin renames a folder into the scratch bin, or refuses when told to; the clipboard and the file manager record. */
let SHELL = null;
async function shell() {
  if (SHELL) return SHELL;
  const ud = path.join(SCRATCH, "shell-" + process.pid + "-" + crypto.randomBytes(3).toString("hex"));
  fs.mkdirSync(ud, { recursive: true });
  const got = { handlers: {}, windows: [], trashed: [], shown: [], clipboard: [], refuse: false, bin: path.join(ud, "bin"), moved: 0 };
  fs.mkdirSync(got.bin, { recursive: true });
  const bag = (into) => (t, fn) => { (into[t] = into[t] || []).push(fn); };
  class Win {
    constructor(opts) {
      this.opts = opts || {}; this.wcOn = {}; this.winOn = {};
      this.webContents = { id: 1, on: bag(this.wcOn), once: bag(this.wcOn), send() {}, setWindowOpenHandler() {},
        getURL: () => pathToFileURL(UI).href, reload() {}, forcefullyCrashRenderer() {}, getZoomLevel: () => 0, setZoomLevel() {} };
      got.windows.push(this);
    }
    on(t, fn) { bag(this.winOn)(t, fn); } once(t, fn) { bag(this.winOn)(t, fn); }
    isDestroyed() { return false; } isMaximized() { return false; } close() {} loadFile() {}
    show() {} showInactive() {} setMinimumSize() {}
  }
  const display = { bounds: { x: 0, y: 0, width: 1920, height: 1080 }, workAreaSize: { width: 1920, height: 1032 } };
  const electron = {
    app: { commandLine: { appendSwitch() {}, hasSwitch: () => false, removeSwitch() {} },
      getPath: () => ud, getVersion: () => "0.0.0", getLocale: () => "en-GB", requestSingleInstanceLock: () => true,
      whenReady: () => Promise.resolve(), on() {}, quit() {}, exit() {} },
    BrowserWindow: Object.assign(Win, { fromWebContents: () => got.windows[0] || null, getAllWindows: () => got.windows }),
    Menu: { setApplicationMenu() {}, buildFromTemplate: () => ({ popup() {} }) },
    dialog: { showMessageBox: () => Promise.resolve({ response: 0 }), showOpenDialog: () => Promise.resolve({ canceled: true, filePaths: [] }),
      showSaveDialog: () => Promise.resolve({ canceled: true, filePath: "" }) },
    nativeTheme: { themeSource: "system", shouldUseDarkColors: false },
    clipboard: { writeText: (t) => { got.clipboard.push(String(t)); } },
    safeStorage: { isEncryptionAvailable: () => false, encryptString: (s) => Buffer.from(String(s)), decryptString: () => "" },
    screen: { getAllDisplays: () => [display], getPrimaryDisplay: () => display, on() {}, removeListener() {} },
    session: { defaultSession: { setPermissionRequestHandler() {}, setPermissionCheckHandler() {}, setDevicePermissionHandler() {},
      setSpellCheckerLanguages() {}, setSpellCheckerDictionaryDownloadURL() {}, setSpellCheckerEnabled() {} } },
    shell: {
      openPath: () => Promise.resolve(""),
      showItemInFolder: (p) => { got.shown.push(String(p)); },
      trashItem: (p) => {
        got.trashed.push(String(p));
        if (got.refuse) return Promise.reject(new Error("the Recycle Bin refused"));
        fs.renameSync(String(p), path.join(got.bin, path.basename(String(p)) + "-" + (++got.moved)));
        return Promise.resolve();
      },
    },
    ipcMain: { handle: (ch, fn) => { got.handlers[ch] = fn; }, on() {} },
  };
  const thread = { call: () => Promise.resolve({}) };
  const quiet = { on() {}, unref() {}, kill() {}, pid: 0, stdout: { on() {} }, stderr: { on() {} }, stdin: { end() {}, write() {} } };
  const cp = { execFileSync: () => "", execSync: () => "", spawnSync: () => ({ status: 0, stdout: "", stderr: "" }),
    execFile: (f, a, o, cb) => { const done = [a, o, cb].find((x) => typeof x === "function"); if (done) done(null, "", ""); return quiet; },
    spawn: () => quiet, exec: (c, o, cb) => { const done = [o, cb].find((x) => typeof x === "function"); if (done) done(null, "", ""); return quiet; },
    fork: () => quiet };
  const load = Module._load;
  Module._load = function (req) {
    if (req === "electron") return electron;
    if (req === "node:child_process" || req === "child_process") return cp;
    if (/studio-thread\.cjs$/.test(req)) return thread;
    return load.apply(this, arguments);
  };
  /* A Studio that works, as a lead's does (the gate refuses a closed channel of one that does not). */
  for (const [k, v] of Object.entries(await seatEnv(ud, true, {}))) { if (v === null) delete process.env[k]; else process.env[k] = v; }
  try {
    delete require.cache[MAIN];
    require(MAIN);
    for (let i = 0; i < 2500 && !got.windows.length; i++) await sleep(10);
  } finally { Module._load = load; }
  const event = { senderFrame: { parent: null, url: pathToFileURL(UI).href }, sender: got.windows[0] && got.windows[0].webContents };
  got.ask = (ch, ...a) => got.handlers[ch](event, ...a);
  SHELL = got;
  return got;
}
/** A projects folder for the shell, with a team folder beside it; STUDIO_PROJECTS names it, as a gate points the shell. */
async function shellWorld(name) {
  const s = await shell();
  const base = path.join(SCRATCH, name + "-" + process.pid + "-" + crypto.randomBytes(3).toString("hex"));
  const root = path.join(base, "projects"), share = path.join(base, "share");
  fs.mkdirSync(root, { recursive: true }); fs.mkdirSync(share, { recursive: true });
  fs.writeFileSync(path.join(share, "harbour-lamps.ec"), "an invented edition\n");
  process.env.STUDIO_PROJECTS = root;
  const lamps = await Studio.newProject(root, "Harbour lamps", LANGS);
  const ropes = await Studio.newProject(root, "Quay ropes", LANGS);
  const pj = path.join(lamps.dir, "project.json");
  fs.writeFileSync(pj, JSON.stringify(Object.assign(JSON.parse(fs.readFileSync(pj, "utf8")), { folder: share })));
  s.trashed.length = 0; s.refuse = false;
  writeStoreOf(s, {});
  return { s, base, root, share, lamps, ropes };
}
/** The shell's store, written as Studio writes it, for a world that keeps a project open in a tab. */
function writeStoreOf(s, store) { fs.writeFileSync(path.join(path.dirname(s.bin), "studio.json"), JSON.stringify(store)); }
/** A project.json's team folder set to `folder`. */
function teamTo(dir, folder) {
  const pj = path.join(dir, "project.json");
  fs.writeFileSync(pj, JSON.stringify(Object.assign(JSON.parse(fs.readFileSync(pj, "utf8")), { folder })));
}
const tree = (dir) => {
  const out = [];
  const walk = (d, rel) => { for (const n of fs.readdirSync(d).sort()) { const at = path.join(d, n), r = rel ? rel + "/" + n : n;
    out.push(r); if (fs.lstatSync(at).isDirectory()) walk(at, r); } };
  walk(dir, "");
  return out.join("|");
};

/* ---- the checks -------------------------------------------------------------------------------- */
const CHECKS = {
  async pr1() {
    const w = await page("pr1");
    const row = w.rowFor(w.ropes.dir);
    if (!row) return no("pr1", "no row for the project");
    w.fire("click", ev("click", row.children[1]));
    await sleep(150);
    if (JSON.stringify(sent(w.calls, "open")) !== JSON.stringify([["open", w.ropes.dir]])) return no("pr1", "opened " + JSON.stringify(sent(w.calls, "open")));
    if (w.P.S.screen !== "project" || !w.P.S.open || w.P.S.open.dir !== w.ropes.dir) return no("pr1", "on " + w.P.S.screen);
    return true;
  },
  async pr2() {
    const w = await page("pr2");
    const row = w.rowFor(w.lamps.dir);
    if (!row) return no("pr2", "no row for the project");
    row.focus();
    const e = w.fire("keydown", ev("keydown", row, { key: "Enter" }));
    await sleep(150);
    if (!e.defaultPrevented || w.P.S.screen !== "project" || !w.P.S.open || w.P.S.open.dir !== w.lamps.dir) return no("pr2", "Enter left the list: " + w.P.S.screen);
    return true;
  },
  async pr3() {
    const w = await page("pr3");
    const html = w.painted();
    if (/<input[^>]*data-proj=/.test(html)) return no("pr3", "a name on the list is a field");
    if ((html.match(/<span class="pn" data-proj="[^"]+" title="[^"]+">(Harbour lamps|Quay ropes)<\/span>/g) || []).length !== 2) return no("pr3", "the names are not text");
    if (!/<button[^>]*data-act="open"/.test(html)) return no("pr3", "the row has no Open");
    return true;
  },
  async pr4() {
    const w = await page("pr4");
    await w.P.projectRemove(w.ropes.dir);
    const html = w.painted(), bar = w.pg.node("#undo").innerHTML;
    if (w.P.listedProjects().map((p) => p.name).join() !== "Harbour lamps") return no("pr4", "listed " + w.P.listedProjects().map((p) => p.name));
    if (/Quay ropes/.test(html)) return no("pr4", "the removed row is still painted");
    if (!/Removed “Quay ropes”\. Its folder goes to the Recycle Bin\./.test(bar) || !/data-act="project-undo"/.test(bar)) return no("pr4", "no Undo: " + bar.slice(0, 200));
    if (sent(w.calls, "removeProject").length || !fs.existsSync(w.ropes.dir)) return no("pr4", "the folder went before its Undo");
    return true;
  },
  async pr5() {
    const w = await page("pr5");
    await w.P.projectRemove(w.ropes.dir);
    w.P.ACTS["project-undo"]();
    const back1 = w.P.listedProjects().length === 2 && /Quay ropes/.test(w.painted());
    await w.P.projectRemove(w.ropes.dir);
    w.fire("keydown", ev("keydown", node("div", { class: "pad" }), { key: "z", ctrlKey: true }));
    const back2 = w.P.listedProjects().length === 2 && !w.P.S.removing;
    await sleep(50);
    if (!back1) return no("pr5", "Undo did not bring the row back");
    if (!back2) return no("pr5", "Ctrl+Z did not bring the row back");
    if (sent(w.calls, "removeProject").length || !fs.existsSync(w.ropes.dir)) return no("pr5", "the shell was asked: " + JSON.stringify(w.calls));
    return true;
  },
  async pr6() {
    const w = await page("pr6");
    await w.P.projectRemove(w.ropes.dir);
    w.fire("click", ev("click", node("a", { "data-act": "section", "data-v": "recent", tabindex: "0" })));
    await sleep(200);
    const asked = sent(w.calls, "removeProject").map((c) => c[1]);
    if (JSON.stringify(asked) !== JSON.stringify([w.ropes.dir])) return no("pr6", "the shell was asked for " + JSON.stringify(asked));
    if (fs.existsSync(w.ropes.dir) || !fs.existsSync(w.lamps.dir)) return no("pr6", "the wrong folder moved");
    if (w.P.S.removing || w.P.S.projects.some((p) => p.dir === w.ropes.dir)) return no("pr6", "the list still holds it");
    return true;
  },
  async pr7() {
    const w = await page("pr7");
    const at = (h) => "2026-10-" + String(h).padStart(2, "0") + "T09:00:00.000Z";
    const names = ["Anchor", "Bollard", "Cleat", "Davit", "Eyebolt", "Fender", "Gangway", "Hawser", "Jetty", "Keel"];
    w.P.S.projects = names.map((n, i) => ({ dir: path.join(w.root, n), name: n, id: "", rev: 0, counts: { cards: 0 }, folder: null,
      published: null, requested: null, opened: at([4, 9, 1, 7, 3, 10, 2, 8, 6, 5][i]) }))
      .concat([{ dir: path.join(w.root, "Lantern"), name: "Lantern", id: "", rev: 0, counts: { cards: 0 }, folder: null, published: null, requested: null, opened: null }]);
    w.P.S.home = "overview";
    w.P.S.pfilter = "all";
    const html = w.painted();
    const shown = Array.from(html.matchAll(/<b data-proj="[^"]*">([^<]+)<\/b>/g)).map((m) => m[1]);
    const want = ["Fender", "Bollard", "Hawser", "Davit"];
    if (JSON.stringify(shown) !== JSON.stringify(want)) return no("pr7", "shown " + JSON.stringify(shown));
    if (shown.indexOf("Jetty") >= 0) return no("pr7", "the fifth opened catalog is still a card");
    return true;
  },
  async pr8() {
    const w = await page("pr8");
    w.P.S.home = "library";
    w.P.paintProjects();
    w.P.__get("paintRail")();
    const both = w.pg.node("#rail").innerHTML + w.pg.node("#main").innerHTML;
    if (/Put away|data-v="away"/.test(both)) return no("pr8", "Put away is still on the screen");
    if (!/data-v="all"/.test(both)) return no("pr8", "All is not on the Library: " + both.slice(0, 300));
    return true;
  },
  async pr9() {
    const w = await shellWorld("pr9");
    const before = { share: tree(w.share), ropes: tree(w.ropes.dir) };
    const r = await w.s.ask("studio:project-remove", w.lamps.dir);
    if (!r || r.removed !== true || r.error) return no("pr9", "refused: " + JSON.stringify(r));
    if (JSON.stringify(w.s.trashed) !== JSON.stringify([w.lamps.dir])) return no("pr9", "trashed " + JSON.stringify(w.s.trashed));
    if (fs.existsSync(w.lamps.dir)) return no("pr9", "the folder is still there");
    if (tree(w.share) !== before.share || tree(w.ropes.dir) !== before.ropes || !fs.existsSync(w.root)) return no("pr9", "something else moved");
    return true;
  },
  async pr10() {
    const w = await shellWorld("pr10");
    const bare = path.join(w.root, "Loose notes");
    fs.mkdirSync(bare); fs.writeFileSync(path.join(bare, "notes.txt"), "nothing here is a project\n");
    const link = path.join(w.root, "Quay ropes link");
    fs.symlinkSync(w.ropes.dir, link, "junction");
    const inner = await Studio.newProject(w.root, "Pier signs", LANGS);
    const own = path.join(inner.dir, "for the desks");
    fs.mkdirSync(own);
    const pj = path.join(inner.dir, "project.json");
    fs.writeFileSync(pj, JSON.stringify(Object.assign(JSON.parse(fs.readFileSync(pj, "utf8")), { folder: own })));
    const out = [];
    for (const d of [w.share, bare, link, inner.dir, path.join(w.root, "No such project"), w.root]) out.push(await w.s.ask("studio:project-remove", d));
    if (w.s.trashed.length) return no("pr10", "trashed " + JSON.stringify(w.s.trashed));
    if (!out.every((r) => r && r.removed === false && r.said && r.said.frame)) return no("pr10", "answers " + JSON.stringify(out.map((r) => r && r.said)));
    if (out[3].said.frame !== "The folder the team reads from is inside {NAME}, so the catalog stays where it is.") return no("pr10", "the team-inside answer: " + out[3].said.frame);
    if (![w.share, bare, link, inner.dir, own, w.ropes.dir].every((d) => fs.existsSync(d))) return no("pr10", "a folder moved");
    return true;
  },
  async pr11() {
    const w = await shellWorld("pr11");
    w.s.refuse = true;
    const r = await w.s.ask("studio:project-remove", w.ropes.dir);
    w.s.refuse = false;
    if (!r || r.removed !== false || !r.said || r.said.frame !== "{NAME} could not be moved to the Recycle Bin, so it stays where it is.")
      return no("pr11", "answered " + JSON.stringify(r));
    if (!fs.existsSync(w.ropes.dir)) return no("pr11", "the folder went");
    return true;
  },
  async pr12() {
    const w = await shellWorld("pr12");
    const a = await w.s.ask("studio:copy", "Harbour lamps");
    const b = await w.s.ask("studio:copy", "");
    const file = path.join(w.share, "harbour-lamps.ec");
    const c = await w.s.ask("studio:show", file);
    const d = await w.s.ask("studio:show", path.join(w.share, "gone.ec"));
    if (!a || a.copied !== true || JSON.stringify(w.s.clipboard) !== JSON.stringify(["Harbour lamps"])) return no("pr12", "copy " + JSON.stringify([a, w.s.clipboard]));
    if (!b || b.copied !== false) return no("pr12", "an empty copy was written");
    if (!c || c.error || JSON.stringify(w.s.shown) !== JSON.stringify([file])) return no("pr12", "show " + JSON.stringify([c, w.s.shown]));
    if (!d || !d.said || d.said.frame !== "{P} is not there any more." || w.s.shown.length !== 1) return no("pr12", "a missing path: " + JSON.stringify(d));
    return true;
  },
  async pr13() {
    const w = await shellWorld("pr13");
    const shed = path.join(w.root, "Shed");
    fs.mkdirSync(shed);
    const nested = await Studio.newProject(shed, "Inner moorings", LANGS);
    const away = path.join(w.base, "elsewhere");
    fs.mkdirSync(away);
    const outside = await Studio.newProject(away, "Pier signs", LANGS);
    const alias = path.join(w.base, "projects alias");
    fs.symlinkSync(w.root, alias, "junction");
    const viaAlias = path.join(alias, "Quay ropes");
    const out = [];
    for (const d of [nested.dir, outside.dir, viaAlias]) out.push(await w.s.ask("studio:project-remove", d));
    if (w.s.trashed.length) return no("pr13", "trashed " + JSON.stringify(w.s.trashed));
    const frames = out.map((r) => r && r.said && r.said.frame);
    if (!out.every((r) => r && r.removed === false)
        || !frames.every((f) => f === "{NAME} is not a catalog in Studio's catalogs folder, so it stays where it is."))
      return no("pr13", "answers " + JSON.stringify(frames));
    if (![nested.dir, outside.dir, w.ropes.dir].every((d) => fs.existsSync(path.join(d, "project.json")))) return no("pr13", "a project moved");
    return true;
  },
  async pr14() {
    const w = await shellWorld("pr14");
    /* Quay ropes publishes to a folder inside Harbour lamps; Harbour lamps' own team folder is the share outside */
    const inLamps = path.join(w.lamps.dir, "desk-share");
    fs.mkdirSync(inLamps);
    teamTo(w.ropes.dir, inLamps);
    const r1 = await w.s.ask("studio:project-remove", w.lamps.dir);
    /* and a project kept open in a tab, from another folder, that publishes into Quay ropes */
    teamTo(w.ropes.dir, w.share);
    const away = path.join(w.base, "elsewhere");
    fs.mkdirSync(away);
    const tabbed = await Studio.newProject(away, "Pier signs", LANGS);
    const inRopes = path.join(w.ropes.dir, "for the pier");
    fs.mkdirSync(inRopes);
    teamTo(tabbed.dir, inRopes);
    writeStoreOf(w.s, { tabs: { open: [{ dir: tabbed.dir, name: "Pier signs", rev: 0 }], on: "" } });
    const r2 = await w.s.ask("studio:project-remove", w.ropes.dir);
    writeStoreOf(w.s, {});
    const want = "The folder the team of {OTHER} reads from is inside {NAME}, so the catalog stays where it is.";
    if (w.s.trashed.length) return no("pr14", "trashed " + JSON.stringify(w.s.trashed));
    if (!r1 || r1.removed !== false || !r1.said || r1.said.frame !== want || r1.said.vars.OTHER !== "Quay ropes")
      return no("pr14", "a sibling's team folder: " + JSON.stringify(r1 && r1.said));
    if (!r2 || r2.removed !== false || !r2.said || r2.said.frame !== want || r2.said.vars.OTHER !== "Pier signs")
      return no("pr14", "a tab's team folder: " + JSON.stringify(r2 && r2.said));
    if (!fs.existsSync(inLamps) || !fs.existsSync(inRopes)) return no("pr14", "a team folder moved");
    return true;
  },
  async pr15() {
    const w = await shellWorld("pr15");
    const own = path.join(w.ropes.dir, "for the desks");
    fs.mkdirSync(own);
    const alias = path.join(w.base, "ropes alias");
    fs.symlinkSync(w.ropes.dir, alias, "junction");
    teamTo(w.ropes.dir, path.join(alias, "for the desks"));
    const r = await w.s.ask("studio:project-remove", w.ropes.dir);
    if (w.s.trashed.length) return no("pr15", "trashed " + JSON.stringify(w.s.trashed));
    if (!r || r.removed !== false || !r.said || r.said.frame !== "The folder the team reads from is inside {NAME}, so the catalog stays where it is.")
      return no("pr15", "answered " + JSON.stringify(r && r.said));
    if (!fs.existsSync(own)) return no("pr15", "the team folder moved");
    return true;
  },
  async pr16() {
    const w = await page("pr16");
    const at = (h) => "2026-10-" + String(h).padStart(2, "0") + "T09:00:00.000Z";
    const dirA = path.join(w.root, "ProjA");
    const dirB = path.join(w.root, "ProjB");
    const dirC = path.join(w.root, "ProjC");
    const dirD = path.join(w.root, "ProjD");
    const dirE = path.join(w.root, "ProjSample");
    const dirF = path.join(w.root, "ProjF");

    w.P.S.projects = [
      { dir: dirA, name: "ProjA", id: "id-a", rev: 2, counts: { cards: 10 }, folder: null, published: at(1), opened: at(1) },
      { dir: dirB, name: "ProjB", id: "id-b", rev: 0, counts: { cards: 5 }, folder: null, published: null, opened: at(2), changes: 2 },
      { dir: dirC, name: "ProjC", id: "id-c", rev: 1, counts: { cards: 8 }, folder: null, published: at(3), opened: at(3) },
      { dir: dirD, name: "ProjD", id: "id-d", rev: 0, counts: { cards: 3 }, folder: null, published: null, opened: at(4), changes: 1 },
      { dir: dirE, name: "ProjSample", id: "id-e", rev: 0, counts: { cards: 2 }, folder: null, published: null, opened: null },
      { dir: dirF, name: "ProjF", id: "id-f", rev: 4, counts: { cards: 12 }, folder: null, published: at(5), opened: null },
    ];
    w.P.S.recentCleared = null;

    const team1 = {
      id: "team-1",
      project: { id: "id-c", name: "ProjC", dir: dirC, rev: 1 },
      catalogs: ["id-c"],
      teammates: [{ id: "desk-1", name: "Alice", admitted: true }]
    };
    const team2 = {
      id: "team-2",
      project: { id: "id-d", name: "ProjD", dir: dirD, rev: 0 },
      catalogs: ["id-d"],
      teammates: [{ id: "desk-2", name: "Bob", admitted: true }]
    };

    // 1. Teams data not loaded yet. The counts live on the Library, which is where the filters moved.
    w.P.S.home = "library";
    w.P.S.teams = null;
    w.P.S.pfilter = "all";
    w.P.paintProjects();
    let html = w.pg.node("#main").innerHTML;
    const deskMatchNotLoaded = html.match(/data-v="desks"[^>]*>.*?<span class="num">(\d+)<\/span>/);
    if (!deskMatchNotLoaded || deskMatchNotLoaded[1] !== "0")
      return no("pr16", "desks count when teams not loaded is not 0: " + html.slice(0, 400));

    w.P.S.pfilter = "desks";
    html = w.painted();
    let rows = Array.from(html.matchAll(/<tr class="[^"]*pick[^"]*"[^>]*>/g));
    if (rows.length !== 0) return no("pr16", "desks filter when teams not loaded shows rows: " + rows.length);

    // 2. Teams data loaded
    w.P.S.teams = [team1, team2];
    w.P.S.home = "library";
    w.P.S.pfilter = "all";
    html = w.painted();

    const allCount = (html.match(/data-v="all"[^>]*>.*?<span class="num">(\d+)<\/span>/) || [])[1];
    rows = Array.from(html.matchAll(/<tr class="[^"]*pick[^"]*"[^>]*>/g));
    if (allCount !== "6" || rows.length !== 6) return no("pr16", "all count mismatch: bar=" + allCount + " rows=" + rows.length);

    w.P.S.home = "overview";
    w.P.S.q = "";
    html = w.painted();
    const cardNames = Array.from(html.matchAll(/<b data-proj="[^"]*">([^<]+)<\/b>/g)).map((m) => m[1]);
    if (JSON.stringify(cardNames) !== JSON.stringify(["ProjD", "ProjC", "ProjB", "ProjA"]))
      return no("pr16", "opened recently cards: " + JSON.stringify(cardNames));
    if (!/All catalogs in the Library:/.test(html)) return no("pr16", "the dashed card is missing");

    w.P.S.home = "library";
    const pubCount = (w.painted().match(/data-v="published"[^>]*>.*?<span class="num">(\d+)<\/span>/) || [])[1];
    w.P.S.pfilter = "published";
    html = w.painted();
    rows = Array.from(html.matchAll(/<tr class="[^"]*pick[^"]*"[^>]*>/g));
    if (pubCount !== "3" || rows.length !== 3) return no("pr16", "published count mismatch: bar=" + pubCount + " rows=" + rows.length);

    const changeCount = (html.match(/data-v="changes"[^>]*>.*?<span class="num">(\d+)<\/span>/) || [])[1];
    w.P.S.pfilter = "changes";
    html = w.painted();
    rows = Array.from(html.matchAll(/<tr class="[^"]*pick[^"]*"[^>]*>/g));
    if (changeCount !== "2" || rows.length !== 2) return no("pr16", "changes count mismatch: bar=" + changeCount + " rows=" + rows.length);

    const deskCount = (html.match(/data-v="desks"[^>]*>.*?<span class="num">(\d+)<\/span>/) || [])[1];
    w.P.S.pfilter = "desks";
    html = w.painted();
    rows = Array.from(html.matchAll(/<tr class="[^"]*pick[^"]*"[^>]*>/g));
    if (deskCount !== "2" || rows.length !== 2) return no("pr16", "desks count mismatch: bar=" + deskCount + " rows=" + rows.length);

    // No project wears a Sample chip under build A. With changes to publish reads the journal.
    w.P.S.pfilter = "all";
    html = w.painted();
    if (html.includes('<span class="chip">Sample</span>')) return no("pr16", "sample chip shown under All");

    // 3. Filter press via ACTS.section
    const mockEl = (val) => ({ getAttribute: (k) => k === "data-v" ? val : null });
    w.P.ACTS.section(mockEl("published"));
    if (w.P.S.pfilter !== "published") return no("pr16", "filter press did not set S.pfilter to published");

    // Search combines with filter
    w.P.S.q = "ProjC";
    html = w.painted();
    rows = Array.from(html.matchAll(/<tr class="[^"]*pick[^"]*"[^>]*>/g));
    if (rows.length !== 1) return no("pr16", "search + published filter did not yield 1 row: " + rows.length);
    w.P.S.q = "";

    // S.pfilter survives leaving and returning
    w.P.S.home = "team";
    w.P.__get("paintRail")();
    w.P.S.home = "library";
    w.P.__get("paintRail")();
    if (w.P.S.pfilter !== "published") return no("pr16", "S.pfilter did not survive screen switch");

    // Zero-count filter stays pressable
    w.P.S.home = "library";
    w.P.S.projects = [];
    w.P.S.pfilter = "published";
    w.P.paintProjects();
    html = w.pg.node("#main").innerHTML;
    if (!html.includes('data-v="published"')) return no("pr16", "zero-count published filter not on the Library");

    // 4. Settings in the panel opens its tab (board 965, S1)
    w.P.S.cover = null;
    await w.P.ACTS.settings();
    if (w.P.S.screen !== "settings" || w.P.S.cover) return no("pr16", "Settings did not open the Settings tab");
    w.P.S.screen = "projects";

    // 5. Top bar no longer holds the two moved buttons, rail holds them
    w.P.paintChrome();
    const chrome = w.pg.node("#chrome").innerHTML;
    if (chrome.includes('data-act="pick-root"')) return no("pr16", "pick-root still in chrome");
    if (chrome.includes('data-act="bring"')) return no("pr16", "bring still in chrome");
    if (!chrome.includes('id="q"') || chrome.includes('data-act="new"')) return no("pr16", "chrome missing q, or still holding New catalog (the band's plus makes one)");

    w.P.__get("paintRail")();
    const rail = w.pg.node("#rail").innerHTML;
    if (!rail.includes('data-act="pick-root"')) return no("pr16", "pick-root not in rail");
    if (!rail.includes('data-act="bring"')) return no("pr16", "bring not in rail");
    if (!rail.includes('data-act="settings"')) return no("pr16", "settings not in rail");
    if (!rail.includes('data-act="tour-show"')) return no("pr16", "tour-show not in rail");
    if (!rail.includes('data-act="about"')) return no("pr16", "about not in rail");

    return true;
  },
  async pr17() {
    const dirA = "C:/lib/Harbour", dirB = "C:/lib/Quay";
    /* the shell's answer once the table is on screen: Harbour's journal holds three edits, Quay's none */
    ROW_FACTS = { [dirA]: { error: null, changes: 3, checks: 0 }, [dirB]: { error: null, changes: 0, checks: 0 } };
    let w;
    try { w = await page("pr17"); } finally { ROW_FACTS = null; }
    w.P.S.projects = [
      { dir: dirA, name: "Harbour", id: "id-a", rev: 1, counts: { cards: 4 }, folder: null, published: null, opened: null, changes: null, checks: null },
      { dir: dirB, name: "Quay", id: "id-b", rev: 0, counts: { cards: 2 }, folder: null, published: null, opened: null, changes: null, checks: null },
    ];
    w.P.S.home = "library"; w.P.S.screen = "projects"; w.P.S.pfilter = "all"; w.P.S.q = "";
    const html = w.painted();
    const at = (h) => (String(h).match(/data-v="changes"[^>]*>(.*?)<span class="num">(\d+)<\/span>/) || []);
    const before = at(html);
    if (before[1] !== "With changes to publish" || before[2] !== "0")
      return no("pr17", "the pill as painted: " + JSON.stringify(before.slice(1)));
    for (let i = 0; i < 50 && w.P.S.projects[0].changes == null; i++) await sleep(5);
    await sleep(20);
    if (w.P.S.projects[0].changes !== 3) return no("pr17", "the row facts never filled: " + JSON.stringify(w.P.S.projects[0]));
    const num = w.pg.node('#main .lib-filters [data-v="changes"] .num');
    if (String(num.textContent) !== "1") return no("pr17", "the pill's number after the fill on All: " + JSON.stringify(num.textContent));
    /* the next paint agrees with the number the fill wrote */
    const again = at(w.painted());
    if (again[2] !== "1") return no("pr17", "the next paint's pill: " + JSON.stringify(again.slice(1)));
    /* T() binds a number to its word with a no-break space; the words are what is held here */
    const cell = String(w.P.__get("draftWords")(w.P.S.projects[0])).replace(/ /g, " ");
    if (cell !== "edits not published: 3") return no("pr17", "the Draft cell: " + JSON.stringify(cell));
    if (String(w.P.__get("draftWords")(w.P.S.projects[1])) !== "as published") return no("pr17", "an empty journal's cell");
    return true;
  },
  async pr18() {
    const w = await page("pr18");
    w.P.S.projects = [
      { dir: "C:/lib/A", name: "A", id: "id-a", rev: 14, editions: 3, counts: { cards: 4 }, folder: null, published: "2026-10-01T09:00:00.000Z", opened: null },
      { dir: "C:/lib/B", name: "B", id: "id-b", rev: 2, editions: 2, counts: { cards: 2 }, folder: null, published: "2026-10-02T09:00:00.000Z", opened: null },
      { dir: "C:/lib/C", name: "C", id: "id-c", rev: 0, editions: 0, counts: { cards: 1 }, folder: null, published: null, opened: null },
    ];
    w.P.S.home = "overview"; w.P.S.q = ""; w.P.S.teams = [];
    const html = w.painted();
    const tile = (html.match(/<b>(\d+)<\/b><span>editions kept<\/span>/) || [])[1];
    if (tile !== "5") return no("pr18", "editions kept reads " + JSON.stringify(tile) + ", the archives hold 5 and the revs add to 16");
    return true;
  },
  async pr19() {
    const w = await page("pr19");
    w.P.S.projects = [
      { dir: "C:/lib/p1", name: "Żółw i łódź", id: "id-a", rev: 0, counts: { cards: 4 }, folder: null, published: null, opened: "2026-10-01T09:00:00.000Z" },
      { dir: "C:/lib/p2", name: "Quay ropes", id: "id-b", rev: 0, counts: { cards: 2 }, folder: null, published: null, opened: "2026-10-02T09:00:00.000Z" },
    ];
    w.P.S.teams = [];
    /* lower case, NFD, combining marks dropped, and Polish ł/Ł folded to l */
    for (const [q, want] of [["zołw", 1], ["ŻÓŁW", 1], ["łodz", 1], ["lodz", 1], ["zolw", 1], ["quay", 1], ["łódka", 0]]) {
      w.P.S.home = "library"; w.P.S.pfilter = "all"; w.P.S.q = q;
      const lib = Array.from(w.painted().matchAll(/<tr class="[^"]*pick[^"]*"[^>]*>/g)).length;
      w.P.S.home = "overview";
      const ov = Array.from(w.painted().matchAll(/<b data-proj="[^"]*">([^<]+)<\/b>/g)).length;
      if (lib !== want || ov !== want) return no("pr19", JSON.stringify(q) + " finds " + lib + " in the Library and " + ov + " on Overview, " + want + " wanted");
    }
    w.P.S.q = "";
    return true;
  },
  /* The map's channel and the Settings row for a team this Studio joined. The row's first line is the step; the dates
     are further lines, and the channel is one line, so the step is what the two must share. */
  async pr20() {
    const STEPS = ["grace", "read-only", "lapsed", "gone"];
    const GOOD = { en: "the relay", pl: "przekaźnik" };
    /* The map says the copywriter's short phrase per step; the Settings row's sentence is the fold's hover. */
    const PHRASE = {
      "grace": { en: "the relay, licence ended", pl: "przekaźnik, licencja wygasła" },
      "read-only": { en: "the relay, read-only", pl: "przekaźnik, tylko do odczytu" },
      "lapsed": { en: "the relay, stopped", pl: "przekaźnik wstrzymany" },
      "gone": { en: "the relay's copy deleted", pl: "kopia na przekaźniku usunięta" },
    };
    const tipOf = (html) => {
      const found = Array.from(String(html).matchAll(/<div class="dm-fold[^"]*"(?: title="([^"]*)")? style=/g));
      return found.length >= 2 && found[1][1] != null ? unesc(found[1][1]) : "";
    };
    let standReply = { teams: [], due: [] };
    const open = (lang) => loadPage({
      uiLang: lang,
      api: {
        relayLapse: () => Promise.resolve(standReply),
        projects: async () => ({ projects: [], root: "C:/P", made: true }),
        teams: async () => ({ teams: [] }),
      },
    });
    const teamOf = (lapse) => ({
      id: "t-0011223344556677",
      connection: "relay",
      folder: "",
      projects: [{ id: "harbour", name: "Harbour lamps", dir: "C:/lib/H" }],
      teammates: [{ id: "d1", name: "Ada", admitted: true }],
      ...(lapse ? { lapse: { step: lapse, until: null, readOnly: null, swept: null } } : {}),
    });
    const followOf = (step) => ({
      state: "following", channel: "relay", leadName: "Ada", catalogs: [],
      lapse: { step, until: null, readOnly: null, swept: null },
    });
    const firstLine = (html) => {
      const m = String(html).match(/<div class="sx-line">([^<]*)<\/div>/);
      return m ? unesc(m[1]) : "";
    };
    const channelOf = (html) => {
      const found = Array.from(String(html).matchAll(/<span class="nm">([^<]*)<\/span><span class="sub"><span class="v">([^<]*)<\/span>/g));
      return found.length >= 2 ? unesc(found[1][2]) : "";
    };
    for (const lang of ["en", "pl"]) {
      const pg = open(lang);
      const P = pg.page;
      P.S.projects = [];
      P.S.q = "";
      P.S.err = null;
      P.S.cover = null;
      P.S.home = "overview";
      P.S.screen = "projects";
      P.S.relayStand = [];
      const say = (step) => {
        P.S.follow = followOf(step);
        P.S.sx = { sec: "teams", q: "" };
        return firstLine(P.settingsPageHtml());
      };
      const channel = (lapse) => {
        P.S.teams = [teamOf(lapse)];
        P.S.home = "overview";
        P.S.screen = "projects";
        P.S.relayStand = [];
        P.paintProjects();
        return channelOf(pg.node("#main").innerHTML);
      };
      for (const step of STEPS) {
        const row = say(step);
        const map = channel(step);
        const tip = tipOf(pg.node("#main").innerHTML);
        if (!row || map !== PHRASE[step][lang] || tip !== row) return no("pr20", lang + " " + step + " map " + JSON.stringify(map) + " hover " + JSON.stringify(tip) + " settings " + JSON.stringify(row));
      }
      const good = channel("");
      if (good !== GOOD[lang]) return no("pr20", lang + " good standing " + JSON.stringify(good));
      /* RETIRED (the shared-folder team's removal, db433b79): the Overview's channel line for a team kept at a shared folder, which showed the folder's path; the team is held now and
         the Overview says the held-folder line instead (tests/team-overview.mjs, tests/folder-team-held). */
    }
    const pg = open("en");
    const P = pg.page;
    P.S.projects = [];
    P.S.q = "";
    P.S.err = null;
    P.S.cover = null;
    P.S.home = "overview";
    P.S.screen = "projects";
    P.S.teams = [teamOf("")];
    P.S.follow = followOf("grace");
    P.S.sx = { sec: "teams", q: "" };
    const grace = firstLine(P.settingsPageHtml());
    standReply = { teams: [{ team: "t-0011223344556677", step: "grace", until: "2026-11-02", readOnly: "2026-12-02", swept: "2027-01-31" }], due: [] };
    await P.relayLapseAsk();
    const afterClose = channelOf(pg.node("#main").innerHTML);
    const afterTip = tipOf(pg.node("#main").innerHTML);
    if (afterClose !== PHRASE.grace.en || afterTip !== grace) return no("pr20", "after the notice is closed " + JSON.stringify(afterClose) + " hover " + JSON.stringify(afterTip) + " settings " + JSON.stringify(grace));
    standReply = { teams: [], due: [] };
    await P.relayLapseAsk();
    const restored = channelOf(pg.node("#main").innerHTML);
    if (restored !== GOOD.en) return no("pr20", "back in good standing " + JSON.stringify(restored));
    return true;
  },
  async pr21() {
    const w = await page("pr21");
    w.P.S.projects = [
      { dir: "C:/lib/p1", name: "Łóżko z Łodzi", id: "id-a", rev: 0, counts: { cards: 4 }, folder: null, published: null, opened: "2026-10-01T09:00:00.000Z" },
      { dir: "C:/lib/p2", name: "Quay lines", id: "id-b", rev: 0, counts: { cards: 2 }, folder: null, published: null, opened: "2026-10-02T09:00:00.000Z" },
    ];
    w.P.S.teams = [];
    for (const [q, want] of [["lozko", 1], ["Lodz", 1], ["łóżko", 1], ["ŁÓDŹ", 1], ["lines", 1], ["l", 2], ["brak", 0]]) {
      w.P.S.home = "library"; w.P.S.pfilter = "all"; w.P.S.q = q;
      const lib = Array.from(w.painted().matchAll(/<tr class="[^"]*pick[^"]*"[^>]*>/g)).length;
      w.P.S.home = "overview";
      const ov = Array.from(w.painted().matchAll(/<b data-proj="[^"]*">([^<]+)<\/b>/g)).length;
      if (lib !== want || ov !== want) return no("pr21", JSON.stringify(q) + " finds " + lib + " in the Library and " + ov + " on Overview, " + want + " wanted");
    }
    w.P.S.q = "";
    return true;
  },
};

/* ---- the plants ---------------------------------------------------------------------------------- */
const PLANTS = [
  ["pr1", "ui/app.js", "data-ctx=\"project\" data-where=\"row\" data-act=\"open\"'", "data-ctx=\"project\" data-where=\"row\"'"],
  ["pr2", "ui/app.js", "data-ctx=\"project\" data-where=\"row\" data-act=\"open\"'", "data-ctx=\"project\" data-where=\"row\"'"],
  ["pr3", "ui/app.js", "(naming(\"row\", p.dir) && !p.unreadable", "(true"],
  ["pr4", "ui/app.js", "  async function projectRemove(dir) {\n    if (S.removing) await removeCommit();", "  async function projectRemove(dir) {\n    return false;"],
  ["pr5", "ui/app.js", "      S.removing = null; S.err = null;\n      paint();\n      const row", "      S.err = null;\n      paint();\n      const row"],
  ["pr6", "ui/app.js", "    if (S.removing && act !== \"project-undo\") removeCommit();\n", ""],
  ["pr7", "ui/app.js", ".sort((a, b) => String(b.opened).localeCompare(String(a.opened))).slice(0, OVERVIEW_CARDS);",
    ".sort((a, b) => String(b.opened).localeCompare(String(a.opened))).slice(0, 99);"],
  /* The rail rows became the Library's filter pills (board 982 E, 0f888a17); the plants follow their lines (the test architect, 2026-11-11). */
  ["pr8", "ui/app.js", "      + pill(\"all\", T(\"All\"), kept.length, S.pfilter === \"all\")",
    "      + pill(\"all\", T(\"All\"), kept.length, S.pfilter === \"all\")\n      + pill(\"away\", T(\"Put away\"), 0, S.pfilter === \"away\")"],
  /* the Grok read's three (2026-11-11): the fill's pill update taken out, the rev summed again, the search unfolded */
  ["pr17", "ui/app.js", "        else if (wasIn !== nowIn) pillChanges();\n", "\n"],
  ["pr18", "ui/app.js", "all.reduce((acc, p) => acc + (p.editions | 0), 0);", "all.reduce((acc, p) => acc + (p.rev | 0), 0);"],
  ["pr19", "ui/app.js", "const searchFold = (s) => String(s || \"\").replace(/[\\u0141\\u0142]/g, \"l\").toLocaleLowerCase().normalize(\"NFD\").replace(/[\\u0300-\\u036f]/g, \"\").trim();",
    "const searchFold = (s) => String(s || \"\").toLowerCase().trim();"],
  ["pr21", "ui/app.js", "const searchFold = (s) => String(s || \"\").replace(/[\\u0141\\u0142]/g, \"l\").toLocaleLowerCase().normalize(\"NFD\").replace(/[\\u0300-\\u036f]/g, \"\").trim();",
    "const searchFold = (s) => String(s || \"\").toLocaleLowerCase().normalize(\"NFD\").replace(/[\\u0300-\\u036f]/g, \"\").trim();"],
  ["pr20", "ui/app.js", "const chanSub = lapseMapPhrase(chanStep) || (", "const chanSub = ("],
  ["pr16", "ui/app.js", "      + pill(\"published\", T(\"Published\"), kept.filter(isPublished).length, S.pfilter === \"published\")", ""],
  ["pr9", "shell/main.js", "  try { await shell.trashItem(gone); }", "  try { await shell.trashItem(path.dirname(gone)); }"],
  ["pr10", "shell/main.js", "  if (team) return pathsSame(team.dir, gone) ? projectStays(PROJECT_HOLDS_TEAM, gone)\n    : projectStays(PROJECT_HOLDS_OTHERS, gone, { OTHER: team.name });\n", ""],
  ["pr11", "shell/main.js", "  catch { return projectStays(PROJECT_STAYED, gone); }\n  if (fs.existsSync(gone)) return projectStays(PROJECT_STAYED, gone);",
    "  catch { /* planted: the refusal forgotten */ }"],
  ["pr12", "shell/main.js", "  clipboard.writeText(said);\n", ""],
  ["pr13", "shell/main.js", "  const home = projectPlace(dir);\n  if (!home) return projectStays(PROJECT_OUTSIDE, named);",
    "  const home = path.resolve(String(dir == null ? \"\" : dir));\n  if (!home) return projectStays(PROJECT_OUTSIDE, named);"],
  /* two plants: the projects folder's other projects left unread, then the tabs' */
  ["pr14", "shell/main.js", "  try { for (const n of fs.readdirSync(root)) dirs.push(path.join(root, n)); } catch { /* no folder to read */ }\n", ""],
  ["pr14", "shell/main.js", "  for (const t of kept && Array.isArray(kept.open) ? kept.open : []) if (t && typeof t.dir === \"string\" && t.dir) dirs.push(t.dir);\n", ""],
  ["pr15", "shell/main.js", "  try { return fs.realpathSync.native(p); } catch { return path.resolve(p); }", "  return path.resolve(p);"],
];

function sha(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }
function plantOnce(id, rel, from, to) {
  const tree = plantsCopy;
  const file = path.join(tree, rel);
  const buf = fs.readFileSync(file);
  const was = sha(buf);
  const text = buf.toString("utf8");
  const next = plantText(text, from, to, rel);
  let child = null;
  try {
    fs.writeFileSync(file, next, "utf8");
    child = spawnSync(process.execPath, [path.join(tree, path.relative(ROOT, SELF))], { cwd: tree, env: Object.assign({}, process.env, { PROJECT_ROWS_ONLY: id, ETIUDA_PLANTS: "off" }),
      encoding: "utf8", timeout: 120000 });
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
    dropScratch(SCRATCH, "project-rows");
    process.exit(1);
  }
  /* ETIUDA_PLANTS=off (a merge's area run) skips the plants phase and counts it as the one check it is.
     The byte-for-byte check is part of that phase. */
  if (PLANTS_OFF) {
    console.log("SKIP the plants phase: " + PLANTS.length + " plants each turn their check red in a scratch copy, and the checkout's sha256 is unchanged after it (ETIUDA_PLANTS=off)");
  } else {
    const { plantsTree, treeSha, dropPlantsTree } = await import("./plants-tree.mjs");
    const before = treeSha(ROOT);
    const files = ["ui/app.js", "shell/main.js"];
    const shas = files.map((rel) => sha(fs.readFileSync(path.join(ROOT, rel))));
    let red = 0;
    let held = false;
    let same = false;
    try {
      const tree = plantsTree(ROOT, "project-rows");
      plantsCopy = tree;
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
      dropScratch(SCRATCH, "project-rows");
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
  console.log("project-rows " + (n + (PLANTS_OFF ? 0 : 1)) + "/" + (IDS.length + 1) + (PLANTS_OFF ? ", 1 skipped" : ", plants " + PLANTS.length + "/" + PLANTS.length + " red"));
  console.log("#counts checks=" + (IDS.length + (PLANTS_OFF ? 0 : 1)) + " skipped=" + (PLANTS_OFF ? 1 : 0)
    + " failed=" + (IDS.length - n) + " expected=" + (IDS.length + 1));
  dropScratch(SCRATCH, "project-rows");
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
    try { dropScratch(SCRATCH, "project-rows"); } catch { /* the verdict is the error above */ }
    process.exit(1);
  });
}
