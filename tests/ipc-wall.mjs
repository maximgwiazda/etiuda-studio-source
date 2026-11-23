/* A COMPROMISED PAGE CANNOT NAME A FOLDER STUDIO HAS NOT LISTED (review 26).
 *
 *     node tests/ipc-wall.mjs
 *
 * Each leg loads shell/main.js under a stub of Electron, as tests/shell-guards.mjs does, and
 * asks the handler the way a hostile page would. A path outside every listed project, a path
 * with `..`, and a UNC string are refused. The UNC string is handed only to a stand-in, which
 * records the call and does not touch the real filesystem. The refusal names no path. A catalog
 * the shell lists still opens.
 *
 *   iw1  studio:open confines the directory to a direct child of the projects root
 *   iw3  studio:proposal-open, proposal-decide and proposal-revert take a file only in that
 *        catalog's inbox, and open and decide also a file in its desks folder
 *   iw4  studio:import-plan and import-land take an empty into, or a listed catalog
 *   iw5  studio:show and studio:reveal take a listed catalog, a pick, a file inside one of
 *        those, or a file in that catalog's stored team folder; run again as iw5j with the projects
 *        folder behind a junction, so its spelling is not its real path
 *   iw6  studio:people-list and studio:person-admit read a catalog only when this Studio lists it
 *   iw7  a projects root on a UNC path: a catalog under it opens, shows, reveals, and its
 *        proposals open and decide; a UNC path outside that root, and a `..` path that leaves
 *        it, are refused before the stand-in is called
 *   iw8  studio:team-leave takes an empty or absent dir (by team id and catalog id), or a listed
 *        catalog, and refuses an outside, `..`, UNC, dot or blank dir
 *   iw9  studio:flag-keep answers the page's own frame only: a page elsewhere and a frame inside the page get null and the
 *        thread is not asked (its plant registers the channel without the own-frame wall)
 *
 * PROVED BY MAKING IT FAIL. iw1 lifts plant:txic-open, so studio:open takes the page's directory
 * raw, and the outside directory is opened. iw2 lifts plant:txic-movefolder, so the move takes
 * the page's folder with no pick, and the act runs. iw3 lifts plant:txic-proposal, so the open
 * reads the page's file. iw4 lifts plant:txic-import, so the import lands in the page's folder.
 * iw5 lifts plant:txic-show, so show selects the page's file. iw6 lifts plant:txic-people, so
 * the list reads the page's directory. iw7 lifts plant:txic-uncroot, so the parent check is
 * gone and the outside UNC catalog is opened. iw8 lifts plant:txic-leave, so the unconditional
 * projectDir call returns and refuses an empty directory.
 * ETIUDA_PLANTS=off prints a NOT RUN line for each and still runs the
 * green checks. The tally prints #counts and exits 78 when fewer checks ran than expected.
 * Node only. It does not launch the program.
 */
import "./reg-stand-on.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Module, { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { plantText } from "./plant-copy.mjs";
import * as Sign from "../src/sign.mjs";
import * as Store from "../src/team-store.mjs";
import { seatEnv } from "./seated.mjs";

const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const MAIN = path.join(ROOT, "shell", "main.js");
const UI = path.join(ROOT, "ui", "index.html");
const OUTSIDE = "That catalog is not one Studio lists.";
const OPEN_MARK = "const home = projectDir(dir); /* plant:txic-open */";
const OPEN_LIFTED = "const home = dir; /* plant:txic-open */";
const NOT_PROPOSAL = "That file is not one of this catalog's proposals.";
const PROPOSAL_MARK = "if (uncBarred(at, root) || !proposalKept(home, at, desks)) throw notProposal(); /* plant:txic-proposal */";
const PROPOSAL_LIFTED = "if (false) throw notProposal(); /* plant:txic-proposal */";
const IMPORT_MARK = "return projectDir(into); /* plant:txic-import */";
const IMPORT_LIFTED = "return String(into == null ? \"\" : into); /* plant:txic-import */";
const NOT_SHOWN = "That path is not one Studio can show.";
const SHOW_MARK = "if (!mayShow(at)) throw notShown(); /* plant:txic-show */";
const SHOW_LIFTED = "if (false) throw notShown(); /* plant:txic-show */";
const SPELL_MARK = "if (!underPath(spelled(parent), spelled(child))) return false; /* plant:lps-spelling */";
const SPELL_LIFTED = "if (!underPath(parent, child)) return false; /* plant:lps-spelling */";
const LINK_MARK = "return within(child, parent); /* plant:lps-link */";
const LINK_LIFTED = "return true; /* plant:lps-link */";
const PEOPLE_MARK = "const home = projectDir(project); /* plant:txic-people */";
const PEOPLE_LIFTED = "const home = String(project || \"\"); /* plant:txic-people */";
const UNC_MARK = "if (uncBarred(home, root) || !pathsSame(path.dirname(home), root)) throw outsideCatalog(); /* plant:txic-uncroot */";
const UNC_LIFTED = "if (false) throw outsideCatalog(); /* plant:txic-uncroot */";
const LEAVE_MARK = 'const project = dir == null || dir === "" ? "" : projectDir(dir), cat = String(catalog || ""); /* plant:txic-leave */';
const LEAVE_LIFTED = 'const project = projectDir(dir), cat = String(catalog || ""); /* plant:txic-leave */';
/* A folder on a share, not the share root: `..` can leave it. Node will not resolve `..` above
   the share itself, so a root at `\\server\share` could not host this leg's leaving path. */
const UNC_ROOT = "\\\\server\\share\\projects";
const UNC_OUTSIDE = "\\\\other\\share\\catalog";
const require = createRequire(import.meta.url);

/* The floor is every keep() on a full run, plants included. ETIUDA_PLANTS=off skips each of the
   ten plants and counts that skip toward the floor, so a run that stops early still exits 78. */
const EXPECTED = 113;
const fails = [];
let asserted = 0, failed = 0, skipped = 0;
function fail(name, why) {
  fails.push(name);
  failed++;
  asserted++;
  console.log("FAIL " + name + " " + why);
}
function keep(name) {
  asserted++;
  console.log("ok " + name);
}
function notRun(line) {
  skipped++;
  console.log("NOT RUN " + line);
}

function isUnc(p) {
  const s = String(p);
  return s.startsWith("\\\\") || s.startsWith("//");
}

/* One load of the shell. `watch` names the hostile paths: a filesystem call that carries one,
   or any UNC string, is recorded. A UNC string is answered by the stand-in and never reaches
   the real filesystem. */
async function loadShell(label, watch) {
  const unc = arguments[3] || null;
  /* `through` roots the projects folder behind a directory junction of this leg's own, so the root's
     own spelling (what the page is handed) is not its real path. The real spelling is `realRoot`. */
  const through = !!arguments[4];
  const ud = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-ipc-wall-" + label + "-"));
  const lab = path.join(ud, "lab");
  const jump = path.join(ud, "jump");
  if (through) {
    fs.mkdirSync(lab, { recursive: true });
    fs.symlinkSync(lab, jump, "junction");
  }
  const projects = unc ? unc.root : path.join(through ? jump : ud, "projects");
  if (!unc) fs.mkdirSync(projects, { recursive: true });
  /* The folder's real path, as the filesystem names it: behind a junction it is not the lab's own spelling when the temp
     folder is itself behind a link, so it is asked of the filesystem and never built from the leg's own names. */
  const realRoot = unc ? projects : fs.realpathSync.native(projects);
  const calls = [];
  const hits = [];
  const shown = [];
  const opened = [];
  const watched = (x) => {
    if (typeof x !== "string" || !x) return false;
    if (isUnc(x)) return true;
    return watch.some((w) => x === w || x.startsWith(w + path.sep) || x.startsWith(w + "/"));
  };
  const noteFs = (name, args) => {
    if (args.some(watched)) hits.push({ name, args: args.filter((a) => typeof a === "string") });
  };
  const realFs = fs;
  const wrap = (name, fn) => (...a) => {
    noteFs(name, a);
    if (a.some((x) => typeof x === "string" && isUnc(x))) {
      if (unc) return unc.call(name, a);
      const err = new Error("unc stand-in");
      err.code = "ENOENT";
      throw err;
    }
    return fn.apply(realFs, a);
  };
  const wrappedFs = new Proxy(realFs, {
    get(t, k, r) {
      const v = Reflect.get(t, k, r);
      if (k === "realpathSync" && typeof v === "function") {
        const wrapped = wrap("realpathSync", v);
        wrapped.native = wrap("realpathSync.native", v.native);
        return wrapped;
      }
      /* A promise method keeps the real binding. A UNC argument is refused here, or the call
         would reach a network path the stand-in exists to keep untouched. */
      if (k === "promises" && v && typeof v === "object") {
        return new Proxy(v, {
          get(t2, k2, r2) {
            const fn = Reflect.get(t2, k2, r2);
            if (typeof fn !== "function") return fn;
            return (...a) => {
              noteFs("promises." + String(k2), a);
              if (a.some((x) => typeof x === "string" && isUnc(x))) {
                if (unc) return Promise.resolve().then(() => unc.call(String(k2), a));
                return Promise.reject(Object.assign(new Error("unc stand-in"), { code: "ENOENT" }));
              }
              return fn.apply(t2, a);
            };
          },
        });
      }
      if (typeof v !== "function") return v;
      return wrap(String(k), v);
    },
  });
  const handlers = {};
  let zoom = 0;
  const windows = [];
  class Win {
    constructor() {
      this.webContents = {
        id: 1, on() {}, once() {}, send() {}, setWindowOpenHandler() {},
        getURL: () => pathToFileURL(UI).href, reload() {}, forcefullyCrashRenderer() {},
        getZoomLevel: () => zoom, setZoomLevel: (n) => { zoom = n; },
      };
      windows.push(this);
    }
    on() {} once() {} isDestroyed() { return false; } isMaximized() { return false; }
    close() {} loadFile() {} show() {} showInactive() {} setMinimumSize() {}
    minimize() {} maximize() {} unmaximize() {} isVisible() { return true; }
    isMinimized() { return false; } isFocused() { return true; }
  }
  const display = { bounds: { x: 0, y: 0, width: 1920, height: 1080 }, workAreaSize: { width: 1920, height: 1032 } };
  const electron = {
    app: {
      commandLine: { appendSwitch() {}, hasSwitch: () => false, removeSwitch() {} },
      getPath: () => ud, getVersion: () => "0.0.0", getLocale: () => "en-GB",
      requestSingleInstanceLock: () => true,
      whenReady: () => Promise.resolve(),
      on() {}, quit() {}, exit() {},
    },
    BrowserWindow: Object.assign(Win, {
      fromWebContents: () => windows[0] || new Win(),
      getAllWindows: () => windows,
    }),
    Menu: { setApplicationMenu() {}, buildFromTemplate: () => ({ popup() {} }) },
    dialog: {
      showMessageBox: () => Promise.resolve({ response: 0 }),
      showOpenDialog: () => Promise.resolve({ canceled: true, filePaths: [] }),
      showSaveDialog: () => Promise.resolve({ canceled: true, filePath: "" }),
    },
    nativeTheme: { themeSource: "system", shouldUseDarkColors: false },
    clipboard: { writeText() {} },
    safeStorage: { isEncryptionAvailable: () => false, encryptString: (s) => Buffer.from(String(s)), decryptString: () => "" },
    screen: { getAllDisplays: () => [display], getPrimaryDisplay: () => display, on() {}, removeListener() {} },
    session: { defaultSession: { setPermissionRequestHandler() {}, setPermissionCheckHandler() {}, setDevicePermissionHandler() {}, setSpellCheckerLanguages() {}, setSpellCheckerDictionaryDownloadURL() {}, setSpellCheckerEnabled() {} } },
    shell: {
      openPath: (p) => { opened.push(String(p)); return Promise.resolve(""); },
      openExternal() {},
      showItemInFolder: (p) => { shown.push(String(p)); },
      trashItem: () => Promise.resolve(),
    },
    ipcMain: { handle: (ch, fn) => { handlers[ch] = fn; }, on() {} },
    Notification: function Notification() {},
    Tray: function Tray() { this.setToolTip = function () {}; this.setContextMenu = function () {}; this.on = function () {}; },
    nativeImage: { createFromPath: () => ({}) },
  };
  const thread = { call: (verb, ...a) => { calls.push([verb].concat(a)); return Promise.resolve({ verb }); } };
  const was = {
    STUDIO_PROJECTS: process.env.STUDIO_PROJECTS,
    STUDIO_NO_PROXY_SERVER: process.env.STUDIO_NO_PROXY_SERVER,
    STUDIO_TEST_OFFSCREEN: process.env.STUDIO_TEST_OFFSCREEN,
  };
  process.env.STUDIO_NO_PROXY_SERVER = "off";
  process.env.STUDIO_PROJECTS = projects;
  /* A Studio that works, as a lead's does (the gate refuses a closed channel of one that does not). */
  for (const [k, v] of Object.entries(await seatEnv(ud, true, {}))) { if (v === null) delete process.env[k]; else process.env[k] = v; }
  /* The jump list lists the projects root as the shell comes up. On a UNC root that list is a
     stand-in call, and it would land in the middle of a later ask. A harness launch skips it. */
  if (unc) process.env.STUDIO_TEST_OFFSCREEN = "1";
  const load = Module._load;
  Module._load = function (req) {
    if (req === "electron") return electron;
    if (req === "node:fs" || req === "fs") return wrappedFs;
    if (/studio-thread\.cjs$/.test(String(req))) return thread;
    return load.apply(this, arguments);
  };
  const mainPath = arguments[2] || MAIN;
  /* Modules required by the shell keep the fs they first saw. chosen.cjs's folderAt is one:
     a later load's stand-in never reaches it unless those modules are read again. */
  if (unc) {
    const srcRoot = path.join(ROOT, "src") + path.sep;
    const shellRoot = path.join(ROOT, "shell") + path.sep;
    for (const key of Object.keys(require.cache)) {
      if (key.startsWith(srcRoot) || key.startsWith(shellRoot)) delete require.cache[key];
    }
  }
  delete require.cache[mainPath];
  require(mainPath);
  for (let i = 0; i < 1000 && !windows.length; i++) await new Promise((r) => setTimeout(r, 25));
  const event = () => ({
    senderFrame: { parent: null, url: pathToFileURL(UI).href },
    sender: { getZoomLevel: () => zoom, setZoomLevel: (n) => { zoom = n; } },
  });
  const ask = async (ch, ...a) => {
    if (!handlers[ch]) throw new Error("no door for " + ch);
    return await handlers[ch](event(), ...a);
  };
  const done = () => {
    Module._load = load;
    delete require.cache[mainPath];
    /* The junction goes by rmdir, which removes the link and never what it points at. */
    if (through) { try { realFs.rmdirSync(jump); } catch { /* left for the temp sweep */ } }
    for (const k of Object.keys(was)) {
      if (was[k] === undefined) delete process.env[k];
      else process.env[k] = was[k];
    }
  };
  return { ud, projects, realRoot, calls, hits, ask, done, handlers, shown, opened };
}

/* loadShell's main path is the third argument, so a plant can load a scratch copy. */
async function loadAt(label, watch, mainPath, through) {
  const shell = await loadShell(label, watch, mainPath, null, through);
  return shell;
}

function hostileOf(projects) {
  const away = path.join(path.dirname(projects), "not-listed");
  fs.mkdirSync(away, { recursive: true });
  const dotdot = path.join(projects, "..", "not-listed");
  const unc = "\\\\not-a-server\\share\\catalog";
  return { away, dotdot, unc };
}

async function askOpen(shell, dir) {
  const n = shell.calls.length;
  const h = shell.hits.length;
  const r = await shell.ask("studio:open", dir);
  const opened = shell.calls.slice(n).filter((c) => c[0] === "openProject");
  const touched = shell.hits.slice(h);
  return { r, opened, touched };
}

function refused(got, dir) {
  const text = JSON.stringify(got.r || {});
  return !!(got.r && got.r.error === OUTSIDE && got.r.said && got.r.said.frame === OUTSIDE
    && !text.includes(dir) && got.opened.length === 0 && got.touched.length === 0);
}

async function iw1(mainPath) {
  const watch = [];
  const shell = await loadAt("iw1", watch, mainPath);
  try {
    const hostile = hostileOf(shell.projects);
    watch.push(hostile.away, path.resolve(hostile.dotdot), hostile.unc);
    const outside = await askOpen(shell, hostile.away);
    const dotdot = await askOpen(shell, hostile.dotdot);
    const unc = await askOpen(shell, hostile.unc);
    const listed = path.join(shell.projects, "Harbour lamps");
    fs.mkdirSync(listed, { recursive: true });
    const honest = await askOpen(shell, listed);
    const byName = await askOpen(shell, "Harbour lamps");
    return { outside, dotdot, unc, honest, byName, listed: path.resolve(listed) };
  } finally {
    shell.done();
  }
}

async function plantIw1() {
  if (PLANTS_OFF) {
    notRun("iw1 plant:txic-open lifted (ETIUDA_PLANTS=off)");
    return true;
  }
  const checkout = fs.readFileSync(MAIN, "utf8");
  if (!checkout.includes(OPEN_MARK)) {
    fail("iw1 plant", "marker absent, so the outside directory cannot be let through");
    return false;
  }
  /* The planted file sits beside shell/main.js so its own requires still resolve, and it is
     removed before this returns. The checkout's main.js is not written. */
  const plantedPath = path.join(ROOT, "shell", "main.ipc-wall-plant.js");
  const before = fs.readFileSync(MAIN);
  let held = false;
  try {
    fs.writeFileSync(plantedPath, plantText(checkout, OPEN_MARK, OPEN_LIFTED, "shell/main.js"));
    const got = await iw1(plantedPath);
    const arg = got.outside.opened.length === 1 ? path.resolve(String(got.outside.opened[0][1])) : "";
    const letThrough = got.outside.opened.length === 1 && !got.outside.r.error && arg.endsWith(path.join("not-listed"));
    if (!letThrough) fail("iw1 plant", "lifting projectDir still refused the outside directory: " + JSON.stringify({
      error: got.outside.r && got.outside.r.error,
      said: got.outside.r && got.outside.r.said,
      opened: got.outside.opened.map((c) => c[1]),
    }));
    else keep("iw1 plant the outside directory is opened once projectDir is lifted");
    held = letThrough;
  } finally {
    try { fs.unlinkSync(plantedPath); } catch { /* already gone */ }
  }
  const same = fs.readFileSync(MAIN).equals(before);
  if (!same) fail("iw1 plant", "shell/main.js changed");
  return held && same;
}

const PROPOSAL_VERBS = ["openProposal", "decideProposal", "revertProposalMarks"];

async function askProposal(shell, channel, args) {
  const n = shell.calls.length;
  const h = shell.hits.length;
  const r = await shell.ask(channel, ...args);
  return {
    r,
    calls: shell.calls.slice(n).filter((c) => PROPOSAL_VERBS.indexOf(c[0]) >= 0),
    touched: shell.hits.slice(h),
  };
}

function proposalQuiet(got, needle) {
  const text = JSON.stringify(got.r || {});
  return !!(got.r && got.r.error === NOT_PROPOSAL && got.r.said && got.r.said.frame === NOT_PROPOSAL
    && !text.includes(needle) && got.calls.length === 0 && got.touched.length === 0);
}

function proposalTook(got, file) {
  return got.calls.length === 1 && path.resolve(String(got.calls[0][2])) === path.resolve(file);
}

async function iw3(mainPath) {
  const watch = [];
  const shell = await loadAt("iw3", watch, mainPath);
  try {
    fs.writeFileSync(path.join(shell.ud, "licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft" }));
    const listed = path.join(shell.projects, "Harbour lamps");
    fs.mkdirSync(path.join(listed, "inbox"), { recursive: true });
    const desk = path.join(listed, "desks", "k-0123456789abcdef");
    fs.mkdirSync(desk, { recursive: true });
    const inboxFile = path.join(listed, "inbox", "p.json");
    const deskFile = path.join(desk, "note.ec");
    fs.writeFileSync(inboxFile, "{}\n");
    fs.writeFileSync(deskFile, "{}\n");
    const away = path.join(path.dirname(shell.projects), "not-listed.ec");
    fs.writeFileSync(away, "{}\n");
    const dotdot = path.join(listed, "inbox", "..", "not-listed.ec");
    const unc = "\\\\not-a-server\\share\\p.json";
    const badDesk = path.join(listed, "desks", "not-a-key", "note.ec");
    const leakDir = path.join(path.dirname(shell.projects), "leaked-desk");
    fs.mkdirSync(leakDir, { recursive: true });
    fs.writeFileSync(path.join(leakDir, "note.ec"), "{}\n");
    const leakKey = path.join(listed, "desks", "k-aaaaaaaaaaaaaaaa");
    fs.symlinkSync(leakDir, leakKey, "junction");
    const leakFile = path.join(leakKey, "note.ec");
    watch.push(away, path.resolve(dotdot), unc, leakDir);
    const outside = await askProposal(shell, "studio:proposal-open", [listed, away, "en"]);
    const dot = await askProposal(shell, "studio:proposal-decide", [listed, dotdot, {}, "Ola", null]);
    const uncGot = await askProposal(shell, "studio:proposal-open", [listed, unc, "en"]);
    const bad = await askProposal(shell, "studio:proposal-open", [listed, badDesk, "en"]);
    const leak = await askProposal(shell, "studio:proposal-open", [listed, leakFile, "en"]);
    const deskRevert = await askProposal(shell, "studio:proposal-revert", [listed, deskFile, []]);
    const honest = await askProposal(shell, "studio:proposal-open", [listed, inboxFile, "en"]);
    const byName = await askProposal(shell, "studio:proposal-decide", [listed, path.join("inbox", "p.json"), {}, "Ola", null]);
    const deskOpen = await askProposal(shell, "studio:proposal-open", [listed, deskFile, "en"]);
    const revert = await askProposal(shell, "studio:proposal-revert", [listed, inboxFile, []]);
    return { outside, dot, uncGot, bad, leak, deskRevert, honest, byName, deskOpen, revert, inboxFile, deskFile };
  } finally {
    shell.done();
  }
}

const IMPORT_VERBS = new Set(["importPlan", "importLand"]);

function importQuiet(got, needle) {
  const text = JSON.stringify(got.r || {});
  return !!(got.r && got.r.error === OUTSIDE && got.r.said && got.r.said.frame === OUTSIDE
    && (!needle || !text.includes(needle)) && got.calls.length === 0 && got.touched.length === 0);
}

function importTook(got, verb, intoWant) {
  return got.r && got.r.error == null && got.calls.length === 1 && got.calls[0][0] === verb
    && String(got.calls[0][4]) === intoWant;
}

async function askImport(shell, channel, file, into) {
  const n = shell.calls.length;
  const h = shell.hits.length;
  const r = await shell.ask(channel, file, {}, into);
  const calls = shell.calls.slice(n).filter((c) => IMPORT_VERBS.has(c[0]));
  const touched = shell.hits.slice(h);
  return { r, calls, touched };
}

async function iw4(mainPath) {
  const watch = [];
  const shell = await loadAt("iw4", watch, mainPath);
  const prev = process.env.STUDIO_TEST_FILE;
  try {
    const file = path.join(shell.ud, "rows.csv");
    fs.writeFileSync(file, "a,b\n");
    process.env.STUDIO_TEST_FILE = file;
    const pick = await shell.ask("studio:import-pick", "t", {});
    const hostile = hostileOf(shell.projects);
    watch.push(hostile.away, path.resolve(hostile.dotdot), hostile.unc);
    const outside = await askImport(shell, "studio:import-plan", file, hostile.away);
    const dot = await askImport(shell, "studio:import-land", file, hostile.dotdot);
    const unc = await askImport(shell, "studio:import-plan", file, hostile.unc);
    const dotName = await askImport(shell, "studio:import-plan", file, ".");
    const blank = await askImport(shell, "studio:import-land", file, "   ");
    const emptyPlan = await askImport(shell, "studio:import-plan", file, "");
    const emptyLand = await askImport(shell, "studio:import-land", file, null);
    const listed = path.join(shell.projects, "Harbour lamps");
    fs.mkdirSync(listed, { recursive: true });
    const named = await askImport(shell, "studio:import-land", file, "Harbour lamps");
    const stranger = path.join(shell.ud, "other.csv");
    const unpicked = await askImport(shell, "studio:import-plan", stranger, hostile.away);
    return {
      pick, outside, dot, unc, dotName, blank, emptyPlan, emptyLand, named, unpicked,
      file, away: hostile.away, listed: path.resolve(listed),
    };
  } finally {
    if (prev === undefined) delete process.env.STUDIO_TEST_FILE;
    else process.env.STUDIO_TEST_FILE = prev;
    shell.done();
  }
}

async function plantIw4() {
  if (PLANTS_OFF) {
    notRun("iw4 plant:txic-import lifted (ETIUDA_PLANTS=off)");
    return true;
  }
  const checkout = fs.readFileSync(MAIN, "utf8");
  if (!checkout.includes(IMPORT_MARK)) {
    fail("iw4 plant", "marker absent, so the page's folder cannot be let through");
    return false;
  }
  const plantedPath = path.join(ROOT, "shell", "main.ipc-wall-plant.js");
  const before = fs.readFileSync(MAIN);
  let held = false;
  try {
    fs.writeFileSync(plantedPath, plantText(checkout, IMPORT_MARK, IMPORT_LIFTED, "shell/main.js"));
    const got = await iw4(plantedPath);
    const arg = got.outside.calls.length === 1 ? String(got.outside.calls[0][4]) : "";
    const letThrough = got.outside.calls.length === 1 && got.outside.calls[0][0] === "importPlan"
      && path.resolve(arg) === path.resolve(got.away);
    if (!letThrough) fail("iw4 plant", "lifting the target check still refused the page's folder: " + JSON.stringify({
      error: got.outside.r && got.outside.r.error, arg,
    }));
    else keep("iw4 plant the page's folder is where the import lands once the check is lifted");
    held = letThrough;
  } finally {
    try { fs.unlinkSync(plantedPath); } catch { /* already gone */ }
  }
  const same = fs.readFileSync(MAIN).equals(before);
  if (!same) fail("iw4 plant", "shell/main.js changed");
  return held && same;
}

async function plantIw3() {
  if (PLANTS_OFF) {
    notRun("iw3 plant:txic-proposal lifted (ETIUDA_PLANTS=off)");
    return true;
  }
  const checkout = fs.readFileSync(MAIN, "utf8");
  if (!checkout.includes(PROPOSAL_MARK)) {
    fail("iw3 plant", "marker absent, so the page's file cannot be let through");
    return false;
  }
  const plantedPath = path.join(ROOT, "shell", "main.ipc-wall-plant.js");
  const before = fs.readFileSync(MAIN);
  let held = false;
  try {
    fs.writeFileSync(plantedPath, plantText(checkout, PROPOSAL_MARK, PROPOSAL_LIFTED, "shell/main.js"));
    const got = await iw3(plantedPath);
    const arg = got.outside.calls.length === 1 ? path.resolve(String(got.outside.calls[0][2])) : "";
    const letThrough = got.outside.calls.length === 1 && arg.endsWith("not-listed.ec");
    if (!letThrough) fail("iw3 plant", "lifting the file check still refused the page's file: " + JSON.stringify({
      error: got.outside.r && got.outside.r.error, arg,
    }));
    else keep("iw3 plant the page's file is read once the check is lifted");
    held = letThrough;
  } finally {
    try { fs.unlinkSync(plantedPath); } catch { /* already gone */ }
  }
  const same = fs.readFileSync(MAIN).equals(before);
  if (!same) fail("iw3 plant", "shell/main.js changed");
  return held && same;
}

function showQuiet(got, needle) {
  const text = JSON.stringify(got.r || {});
  const acted = (got.shown || []).length + (got.opened || []).length;
  return !!(got.r && got.r.error === NOT_SHOWN && got.r.said && got.r.said.frame === NOT_SHOWN
    && !text.includes(needle) && acted === 0 && got.touched.length === 0);
}

async function askShow(shell, p) {
  const n = shell.shown.length;
  const h = shell.hits.length;
  const r = await shell.ask("studio:show", p);
  return { r, shown: shell.shown.slice(n), opened: [], touched: shell.hits.slice(h) };
}

async function askReveal(shell, dir) {
  const n = shell.opened.length;
  const h = shell.hits.length;
  const r = await shell.ask("studio:reveal", dir);
  return { r, shown: [], opened: shell.opened.slice(n), touched: shell.hits.slice(h) };
}

async function iw5(mainPath, through) {
  const watch = [];
  const shell = await loadAt(through ? "iw5j" : "iw5", watch, mainPath, through);
  const prev = process.env.STUDIO_TEST_FOLDER;
  try {
    const listed = path.join(shell.projects, "Harbour lamps");
    fs.mkdirSync(listed, { recursive: true });
    const share = path.join(path.dirname(shell.projects), "share");
    fs.mkdirSync(share, { recursive: true });
    const edition = path.join(share, "harbour-lamps.ec");
    fs.writeFileSync(edition, "an invented edition\n");
    fs.writeFileSync(path.join(listed, "note.ec"), "a note\n");
    fs.writeFileSync(path.join(listed, "project.json"), JSON.stringify({ folder: share }) + "\n");
    const hostile = hostileOf(shell.projects);
    const awayFile = path.join(hostile.away, "secret.ec");
    fs.writeFileSync(awayFile, "no\n");
    const missing = path.join(hostile.away, "gone.ec");
    const keyFile = path.join(shell.ud, "signing-key.json");
    fs.writeFileSync(keyFile, "{}\n");
    const leakDir = path.join(path.dirname(shell.projects), "leaked-show");
    fs.mkdirSync(leakDir, { recursive: true });
    fs.writeFileSync(path.join(leakDir, "note.ec"), "out\n");
    const leakKey = path.join(listed, "k-link");
    fs.symlinkSync(leakDir, leakKey, "junction");
    const leakFile = path.join(leakKey, "note.ec");
    const picked = path.join(path.dirname(shell.projects), "picked-folder");
    fs.mkdirSync(picked, { recursive: true });
    const pickedFile = path.join(picked, "rows.csv");
    fs.writeFileSync(pickedFile, "a,b\n");
    /* LOOK-ALIKES OF A LISTED PLACE, none of them listed: a sibling that shares the projects folder's name
       as a prefix, a sibling that shares the team folder's, a file straight under the projects folder
       (a catalog is a folder), and the away folder under a case variant of its name. */
    const likeRoot = shell.projects + "2";
    fs.mkdirSync(likeRoot, { recursive: true });
    fs.writeFileSync(path.join(likeRoot, "x.ec"), "no\n");
    const likeShare = share + "2";
    fs.mkdirSync(likeShare, { recursive: true });
    fs.writeFileSync(path.join(likeShare, "x.ec"), "no\n");
    const stray = path.join(shell.projects, "stray.ec");
    fs.writeFileSync(stray, "no\n");
    const likeAway = path.join(path.dirname(shell.projects), "NOT-LISTED", "secret.ec");
    const upAndOut = listed + path.sep + ".." + path.sep + ".." + path.sep + "not-listed" + path.sep + "secret.ec";
    watch.push(hostile.away, path.resolve(hostile.dotdot), hostile.unc, keyFile, leakDir, likeRoot, likeShare,
      path.join(path.dirname(shell.realRoot), "not-listed"));
    process.env.STUDIO_TEST_FOLDER = picked;
    const choice = await shell.ask("studio:pick-folder", "t");
    const outside = await askShow(shell, awayFile);
    const dot = await askShow(shell, path.join(hostile.dotdot, "secret.ec"));
    const unc = await askShow(shell, hostile.unc);
    const key = await askShow(shell, keyFile);
    const absent = await askShow(shell, missing);
    const leak = await askShow(shell, leakFile);
    const revealOut = await askReveal(shell, hostile.away);
    const revealKey = await askReveal(shell, shell.ud);
    const shownFile = await askShow(shell, path.join(listed, "note.ec"));
    const shownShare = await askShow(shell, edition);
    const shownGone = await askShow(shell, path.join(share, "gone.ec"));
    const shownPick = await askShow(shell, pickedFile);
    const revealed = await askReveal(shell, listed);
    /* The folder's real spelling is a spelling too: where the root is behind a junction, the page may hold either. */
    const realListed = path.join(shell.realRoot, "Harbour lamps");
    const realNote = await askShow(shell, path.join(realListed, "note.ec"));
    const realReveal = await askReveal(shell, realListed);
    const realAway = await askShow(shell, path.join(shell.realRoot, "..", "not-listed", "secret.ec"));
    const realStray = await askShow(shell, path.join(shell.realRoot, "stray.ec"));
    const likeR = await askShow(shell, path.join(likeRoot, "x.ec"));
    const likeRReal = await askShow(shell, path.join(shell.realRoot + "2", "x.ec"));
    const likeS = await askShow(shell, path.join(likeShare, "x.ec"));
    const likeStray = await askShow(shell, stray);
    const likeCase = await askShow(shell, likeAway);
    const likeUp = await askShow(shell, upAndOut);
    return {
      choice, outside, dot, unc, key, absent, leak, revealOut, revealKey,
      shownFile, shownShare, shownGone, shownPick, revealed,
      realNote, realReveal, realAway, realStray, likeR, likeRReal, likeS, likeStray, likeCase, likeUp,
      realListedPath: realListed, realNotePath: path.join(realListed, "note.ec"),
      awayFile, keyFile, edition, pickedFile, listed: path.resolve(listed),
      note: path.resolve(path.join(listed, "note.ec")),
      gone: path.resolve(path.join(share, "gone.ec")),
    };
  } finally {
    if (prev === undefined) delete process.env.STUDIO_TEST_FOLDER;
    else process.env.STUDIO_TEST_FOLDER = prev;
    shell.done();
  }
}

async function plantIw5() {
  if (PLANTS_OFF) {
    notRun("iw5 plant:txic-show lifted (ETIUDA_PLANTS=off)");
    return true;
  }
  const checkout = fs.readFileSync(MAIN, "utf8");
  if (!checkout.includes(SHOW_MARK)) {
    fail("iw5 plant", "marker absent, so the page's file cannot be let through");
    return false;
  }
  const plantedPath = path.join(ROOT, "shell", "main.ipc-wall-plant.js");
  const before = fs.readFileSync(MAIN);
  let held = false;
  try {
    fs.writeFileSync(plantedPath, plantText(checkout, SHOW_MARK, SHOW_LIFTED, "shell/main.js"));
    const got = await iw5(plantedPath);
    const arg = got.outside.shown.length === 1 ? path.resolve(got.outside.shown[0]) : "";
    const letThrough = arg === path.resolve(got.awayFile) && got.outside.r && got.outside.r.error == null;
    if (!letThrough) fail("iw5 plant", "lifting the check still refused the page's file: " + JSON.stringify({
      error: got.outside.r && got.outside.r.error, shown: got.outside.shown,
    }));
    else keep("iw5 plant the page's file is shown once the check is lifted");
    held = letThrough;
  } finally {
    try { fs.unlinkSync(plantedPath); } catch { /* already gone */ }
  }
  const same = fs.readFileSync(MAIN).equals(before);
  if (!same) fail("iw5 plant", "shell/main.js changed");
  return held && same;
}

/* iw5's checks. `through` roots the projects folder behind a junction of the leg's own: the page is then
   handed paths in the junction's spelling, which is not the folder's real path. The check names carry
   "iw5" plain, or "iw5j" for the junction. */
async function showLeg(through) {
  const tag = through ? "iw5j" : "iw5";
  try {
    const got = await iw5(MAIN, through);
    const bits = [
      [tag + " outside", showQuiet(got.outside, "secret.ec"), got.outside],
      [tag + " dotdot", showQuiet(got.dot, "secret.ec"), got.dot],
      [tag + " unc", showQuiet(got.unc, "not-a-server"), got.unc],
      [tag + " the signing key", showQuiet(got.key, "signing-key"), got.key],
      [tag + " a missing path outside", showQuiet(got.absent, "gone.ec"), got.absent],
      [tag + " a link out of the catalog", showQuiet(got.leak, "leaked-show"), got.leak],
      [tag + " reveal outside", showQuiet(got.revealOut, "not-listed"), got.revealOut],
      [tag + " reveal the key's folder", showQuiet(got.revealKey, "etiuda-ipc-wall"), got.revealKey],
      /* Look-alikes of a listed place, none listed: a sibling that shares the projects folder's name or the team
         folder's as a prefix, a file straight under the projects folder, the away folder under a case variant of
         its name, a path that goes up out of the catalog and down again, and the away folder by real spelling. */
      [tag + " the away folder by the real spelling", showQuiet(got.realAway, "secret.ec"), got.realAway],
      [tag + " a file straight under the projects folder, by the real spelling", showQuiet(got.realStray, "stray.ec"), got.realStray],
      [tag + " a sibling sharing the projects folder's name as a prefix", showQuiet(got.likeR, "x.ec"), got.likeR],
      [tag + " that sibling by the real spelling", showQuiet(got.likeRReal, "x.ec"), got.likeRReal],
      [tag + " a sibling sharing the team folder's name as a prefix", showQuiet(got.likeS, "x.ec"), got.likeS],
      [tag + " a file straight under the projects folder", showQuiet(got.likeStray, "stray.ec"), got.likeStray],
      [tag + " the away folder under a case variant of its name", showQuiet(got.likeCase, "secret.ec"), got.likeCase],
      [tag + " a path that goes up out of the catalog and down to the away folder", showQuiet(got.likeUp, "secret.ec"), got.likeUp],
    ];
    for (const [name, okBit, gotOne] of bits) {
      if (okBit) keep(name);
      else fail(name, JSON.stringify({
        error: gotOne.r && gotOne.r.error,
        frame: gotOne.r && gotOne.r.said && gotOne.r.said.frame,
        shown: gotOne.shown, opened: gotOne.opened,
        fs: gotOne.touched.map((h) => h.name).slice(0, 6),
      }));
    }
    const fileOk = got.shownFile.r && got.shownFile.r.error == null
      && got.shownFile.shown.length === 1 && path.resolve(got.shownFile.shown[0]) === got.note;
    const shareOk = got.shownShare.r && got.shownShare.r.error == null
      && got.shownShare.shown.length === 1 && path.resolve(got.shownShare.shown[0]) === path.resolve(got.edition);
    const goneText = JSON.stringify(got.shownGone.r || {});
    const goneOk = got.shownGone.r && got.shownGone.r.said && got.shownGone.r.said.frame === "{P} is not there any more."
      && goneText.includes("gone.ec") && got.shownGone.shown.length === 0;
    const pickOk = got.choice && got.choice.folder && path.resolve(got.choice.folder) === path.resolve(path.dirname(got.pickedFile))
      && got.shownPick.r && got.shownPick.r.error == null
      && got.shownPick.shown.length === 1 && path.resolve(got.shownPick.shown[0]) === path.resolve(got.pickedFile);
    const revealOk = got.revealed.r && got.revealed.r.error == null
      && got.revealed.opened.length === 1 && path.resolve(got.revealed.opened[0]) === got.listed;
    /* The folder's real spelling is a spelling too: where the root is behind a junction, the page may hold either. */
    const realOk = got.realNote.r && got.realNote.r.error == null && got.realNote.shown.length === 1
      && path.resolve(got.realNote.shown[0]) === path.resolve(got.realNotePath);
    const realRevealOk = got.realReveal.r && got.realReveal.r.error == null && got.realReveal.opened.length === 1
      && path.resolve(got.realReveal.opened[0]) === path.resolve(got.realListedPath);
    if (fileOk) keep(tag + " a file in the catalog is shown");
    else fail(tag + " a file in the catalog is shown", JSON.stringify({
      error: got.shownFile.r && got.shownFile.r.error, shown: got.shownFile.shown,
    }));
    if (shareOk) keep(tag + " a file in the catalog's team folder is shown");
    else fail(tag + " a file in the catalog's team folder is shown", JSON.stringify({
      error: got.shownShare.r && got.shownShare.r.error, shown: got.shownShare.shown,
    }));
    if (goneOk) keep(tag + " a missing file in that team folder is said, and not shown");
    else fail(tag + " a missing file in that team folder is said, and not shown", JSON.stringify(got.shownGone.r));
    if (pickOk) keep(tag + " a file in the folder the pick answered is shown");
    else fail(tag + " a file in the folder the pick answered is shown", JSON.stringify({
      choice: got.choice && got.choice.folder, shown: got.shownPick.shown,
      error: got.shownPick.r && got.shownPick.r.error,
    }));
    if (revealOk) keep(tag + " the catalog's folder is opened");
    else fail(tag + " the catalog's folder is opened", JSON.stringify({
      error: got.revealed.r && got.revealed.r.error, opened: got.revealed.opened,
    }));
    if (realOk) keep(tag + " a file in the catalog is shown by the folder's real spelling too");
    else fail(tag + " a file in the catalog is shown by the folder's real spelling too", JSON.stringify({
      error: got.realNote.r && got.realNote.r.error, shown: got.realNote.shown,
    }));
    if (realRevealOk) keep(tag + " the catalog's folder is opened by the folder's real spelling too");
    else fail(tag + " the catalog's folder is opened by the folder's real spelling too", JSON.stringify({
      error: got.realReveal.r && got.realReveal.r.error, opened: got.realReveal.opened,
    }));
    return bits.every((b) => b[1]) && fileOk && shareOk && goneOk && pickOk && revealOk && realOk && realRevealOk;
  } catch (err) {
    fail(tag + " load", String(err && err.stack || err));
    return false;
  }
}

/* The two lines that decide iw5's listed places, each lifted alone in a scratch copy of shell/main.js. Lifting the spelling
   line puts the comparison back on the page's text against the real path, so the junction run refuses a listed catalog;
   lifting the real-path line lets a link out of a catalog through, so the plain run shows what the link leads to. */
async function plantShowLine(name, mark, lifted, through, bites, why) {
  if (PLANTS_OFF) {
    notRun(name + " plant lifted (ETIUDA_PLANTS=off)");
    return true;
  }
  const checkout = fs.readFileSync(MAIN, "utf8");
  if (!checkout.includes(mark)) {
    fail(name + " plant", "marker absent, so the line cannot be lifted");
    return false;
  }
  const plantedPath = path.join(ROOT, "shell", "main.ipc-wall-plant.js");
  const before = fs.readFileSync(MAIN);
  let held = false;
  try {
    fs.writeFileSync(plantedPath, plantText(checkout, mark, lifted, "shell/main.js"));
    const got = await iw5(plantedPath, through);
    held = !!bites(got);
    if (!held) fail(name + " plant", "lifting the line still left the check green: " + why);
    else keep(name + " plant " + why);
  } finally {
    try { fs.unlinkSync(plantedPath); } catch { /* already gone */ }
  }
  const same = fs.readFileSync(MAIN).equals(before);
  if (!same) fail(name + " plant", "shell/main.js changed");
  return held && same;
}

async function askPeople(shell, channel, dir) {
  const n = shell.calls.length;
  const h = shell.hits.length;
  const args = channel === "studio:person-admit" ? [dir, "ABCD2345EFGH6789", "list"] : [dir];
  const r = await shell.ask(channel, ...args);
  return { r, calls: shell.calls.slice(n), touched: shell.hits.slice(h) };
}

/* A signed-in ask of a directory this Studio does not list is the catalog sentence, and teamFacts
   is not called. The sentence names no path. */
function peopleQuiet(got, needle) {
  const text = JSON.stringify(got.r || {});
  const facts = got.calls.filter((c) => c[0] === "teamFacts");
  return !!(got.r && got.r.error === OUTSIDE && got.r.said && got.r.said.frame === OUTSIDE
    && !text.includes(needle) && facts.length === 0 && got.touched.length === 0);
}

function peopleTook(got, listed) {
  const facts = got.calls.filter((c) => c[0] === "teamFacts");
  return facts.length === 1 && path.resolve(String(facts[0][1])) === path.resolve(listed);
}

async function iw6(mainPath) {
  const watch = [];
  const shell = await loadAt("iw6", watch, mainPath);
  try {
    const hostile = hostileOf(shell.projects);
    const away = path.resolve(hostile.away);
    const dot = path.resolve(hostile.dotdot);
    watch.push(away, dot, hostile.unc);
    /* A Studio that does not work: no seat certificate (licence-service.json gone) and no licence the root signed (the licence
       file seatEnv handed it moved aside), since the gate rests on either (the licence file mends, review xi). WAS: the sign-in
       state alone, which the gate no longer reads. */
    fs.rmSync(path.join(shell.ud, "licence-service.json"), { force: true });
    const licFile = process.env.STUDIO_LICENSE_FILE, licAside = licFile ? licFile + ".aside" : "";
    if (licFile && fs.existsSync(licFile)) fs.renameSync(licFile, licAside);
    const unsigned = await askPeople(shell, "studio:people-list", hostile.away);
    if (licAside && fs.existsSync(licAside)) fs.renameSync(licAside, licFile);
    fs.writeFileSync(path.join(shell.ud, "licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft" }));
    const listed = path.join(shell.projects, "Harbour lamps");
    fs.mkdirSync(listed, { recursive: true });
    const outside = await askPeople(shell, "studio:people-list", hostile.away);
    const dotdot = await askPeople(shell, "studio:people-list", hostile.dotdot);
    const unc = await askPeople(shell, "studio:people-list", hostile.unc);
    const admitOut = await askPeople(shell, "studio:person-admit", hostile.away);
    const honest = await askPeople(shell, "studio:people-list", listed);
    const byName = await askPeople(shell, "studio:people-list", "Harbour lamps");
    const admit = await askPeople(shell, "studio:person-admit", listed);
    return { unsigned, outside, dotdot, unc, admitOut, honest, byName, admit, listed: path.resolve(listed), away };
  } finally {
    shell.done();
  }
}

async function plantIw6() {
  if (PLANTS_OFF) {
    notRun("iw6 plant:txic-people lifted (ETIUDA_PLANTS=off)");
    return true;
  }
  const checkout = fs.readFileSync(MAIN, "utf8");
  if (!checkout.includes(PEOPLE_MARK)) {
    fail("iw6 plant", "marker absent, so the outside directory cannot be let through");
    return false;
  }
  const plantedPath = path.join(ROOT, "shell", "main.ipc-wall-plant.js");
  const before = fs.readFileSync(MAIN);
  let held = false;
  try {
    fs.writeFileSync(plantedPath, plantText(checkout, PEOPLE_MARK, PEOPLE_LIFTED, "shell/main.js"));
    const got = await iw6(plantedPath);
    const facts = got.outside.calls.filter((c) => c[0] === "teamFacts");
    const arg = facts.length === 1 ? path.resolve(String(facts[0][1])) : "";
    const letThrough = facts.length === 1 && arg === path.resolve(got.away) && got.outside.r && got.outside.r.error == null;
    if (!letThrough) fail("iw6 plant", "lifting projectDir still refused the outside directory: " + JSON.stringify({
      error: got.outside.r && got.outside.r.error,
      verbs: got.outside.calls.map((c) => c[0] + " " + String(c[1] || "").slice(-80)),
    }));
    else keep("iw6 plant the outside directory is read once projectDir is lifted");
    held = letThrough;
  } finally {
    try { fs.unlinkSync(plantedPath); } catch { /* already gone */ }
  }
  const same = fs.readFileSync(MAIN).equals(before);
  if (!same) fail("iw6 plant", "shell/main.js changed");
  return held && same;
}

/* The share's tree, in memory. A UNC string is answered here and never handed to the real
   filesystem. `call` is what the stand-in runs for every UNC argument. */
function uncVolume(root) {
  const rows = [];
  const add = (at, kind, data) => {
    const resolved = path.resolve(at);
    const key = process.platform === "win32" ? resolved.toLowerCase() : resolved;
    rows.push({ key, kind, data: data || "", display: path.basename(resolved) });
  };
  const catalog = path.join(root, "Harbour lamps");
  add(root, "dir");
  add(catalog, "dir");
  add(path.join(catalog, "inbox"), "dir");
  add(path.join(catalog, "note.ec"), "file", "a note\n");
  add(path.join(catalog, "inbox", "p.json"), "file", "{}\n");
  add(path.join(catalog, "project.json"), "file", "{}\n");
  const find = (p) => {
    const resolved = path.resolve(String(p));
    const key = process.platform === "win32" ? resolved.toLowerCase() : resolved;
    return rows.find((r) => r.key === key) || null;
  };
  const missing = () => Object.assign(new Error("unc stand-in"), { code: "ENOENT" });
  const statOf = (kind) => ({
    isFile: () => kind === "file",
    isDirectory: () => kind === "dir",
    isSymbolicLink: () => false,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
  });
  const call = (name, args) => {
    const p = args.find((x) => typeof x === "string");
    const bare = String(name).replace(/\.native$/, "");
    if (bare === "existsSync" || bare === "exists") return !!find(p);
    const row = find(p);
    if (bare === "readdirSync" || bare === "readdir") {
      if (!row || row.kind !== "dir") throw missing();
      const prefix = row.key.endsWith("\\") ? row.key : row.key + "\\";
      const names = [];
      for (const r of rows) {
        if (!r.key.startsWith(prefix)) continue;
        const rest = r.key.slice(prefix.length);
        if (!rest || rest.includes("\\")) continue;
        names.push(r.display);
      }
      const opts = args[1];
      if (opts && typeof opts === "object" && opts.withFileTypes) {
        return names.map((n) => {
          const child = find(path.join(path.resolve(String(p)), n));
          const kind = child ? child.kind : "file";
          return {
            name: n,
            isFile: () => kind === "file",
            isDirectory: () => kind === "dir",
            isSymbolicLink: () => false,
          };
        });
      }
      return names;
    }
    if (bare === "readFileSync" || bare === "readFile") {
      if (!row || row.kind !== "file") throw missing();
      const enc = args[1];
      const asText = enc === "utf8" || (enc && enc.encoding === "utf8");
      return asText ? row.data : Buffer.from(row.data);
    }
    if (bare === "realpathSync" || bare === "realpath") {
      if (!row) throw missing();
      return path.resolve(String(p));
    }
    if (bare === "lstatSync" || bare === "statSync" || bare === "lstat" || bare === "stat") {
      if (!row) throw missing();
      return statOf(row.kind);
    }
    throw missing();
  };
  return { root, catalog, call };
}

/* The shell lists the projects root as it starts. Those calls are not the ask's. Wait until the
   stand-in has gone quiet, then the next ask's own calls are the ones that count. */
async function settleHits(shell) {
  let last = -1;
  let stable = 0;
  for (let i = 0; i < 40 && stable < 4; i++) {
    await new Promise((r) => setTimeout(r, 50));
    if (shell.hits.length === last) stable++;
    else { last = shell.hits.length; stable = 0; }
  }
}

function uncQuiet(got, sentence, needle) {
  const text = JSON.stringify(got.r || {});
  const acted = (got.opened ? got.opened.length : 0) + (got.shown ? got.shown.length : 0)
    + (got.calls ? got.calls.length : 0);
  return !!(got.r && got.r.error === sentence && got.r.said && got.r.said.frame === sentence
    && !text.includes(needle) && acted === 0 && got.touched.length === 0);
}

async function iw7(mainPath) {
  const vol = uncVolume(UNC_ROOT);
  const shell = await loadShell("iw7", [], mainPath, vol);
  try {
    await settleHits(shell);
    /* A projects root that can be shared (a UNC path) has a hold, taken at the page's first look at the list (shell/main.js holdCheck,
       src/root-hold.cjs); that look is made here, as the page makes it, so that what the asks below touch is theirs. */
    await shell.ask("studio:projects");
    await settleHits(shell);
    fs.writeFileSync(path.join(shell.ud, "licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft" }));
    const catalog = vol.catalog;
    const note = path.join(catalog, "note.ec");
    const inboxFile = path.join(catalog, "inbox", "p.json");
    const left = catalog + "\\..\\..\\left-out";
    const outside = await askOpen(shell, UNC_OUTSIDE);
    const dotdot = await askOpen(shell, left);
    const showOut = await askShow(shell, UNC_OUTSIDE + "\\secret.ec");
    const showDot = await askShow(shell, left + "\\secret.ec");
    const revealOut = await askReveal(shell, UNC_OUTSIDE);
    const revealDot = await askReveal(shell, left);
    const propOut = await askProposal(shell, "studio:proposal-open", [UNC_OUTSIDE, "p.json", "en"]);
    const propDot = await askProposal(shell, "studio:proposal-decide", [left, "p.json", {}, "Ola", null]);
    const honest = await askOpen(shell, catalog);
    const byName = await askOpen(shell, "Harbour lamps");
    const shownFile = await askShow(shell, note);
    const revealed = await askReveal(shell, catalog);
    const propOpen = await askProposal(shell, "studio:proposal-open", [catalog, inboxFile, "en"]);
    const propDecide = await askProposal(shell, "studio:proposal-decide", [catalog, path.join("inbox", "p.json"), {}, "Ola", null]);
    return {
      outside, dotdot, showOut, showDot, revealOut, revealDot, propOut, propDot,
      honest, byName, shownFile, revealed, propOpen, propDecide,
      catalog: path.resolve(catalog), note: path.resolve(note), inboxFile: path.resolve(inboxFile),
    };
  } finally {
    shell.done();
  }
}

async function plantIw7() {
  if (PLANTS_OFF) {
    notRun("iw7 plant:txic-uncroot lifted (ETIUDA_PLANTS=off)");
    return true;
  }
  const checkout = fs.readFileSync(MAIN, "utf8");
  if (!checkout.includes(UNC_MARK)) {
    fail("iw7 plant", "marker absent, so the outside UNC catalog cannot be let through");
    return false;
  }
  const plantedPath = path.join(ROOT, "shell", "main.ipc-wall-plant.js");
  const before = fs.readFileSync(MAIN);
  let held = false;
  try {
    fs.writeFileSync(plantedPath, plantText(checkout, UNC_MARK, UNC_LIFTED, "shell/main.js"));
    const got = await iw7(plantedPath);
    const arg = got.outside.opened.length === 1 ? path.resolve(String(got.outside.opened[0][1])) : "";
    const letThrough = got.outside.opened.length === 1 && arg === path.resolve(UNC_OUTSIDE)
      && got.outside.r && got.outside.r.error == null;
    if (!letThrough) fail("iw7 plant", "lifting the parent check still refused the outside UNC catalog: " + JSON.stringify({
      error: got.outside.r && got.outside.r.error, arg, opened: got.outside.opened.map((c) => c[0]),
    }));
    else keep("iw7 plant the outside UNC catalog is opened once the parent check is lifted");
    held = letThrough;
  } finally {
    try { fs.unlinkSync(plantedPath); } catch { /* already gone */ }
  }
  const same = fs.readFileSync(MAIN).equals(before);
  if (!same) fail("iw7 plant", "shell/main.js changed");
  return held && same;
}

const LEAVE_VERBS = new Set(["leaveTeam"]);

async function askLeave(shell, dir, teamId, catalog) {
  const n = shell.calls.length;
  const h = shell.hits.length;
  const r = await shell.ask("studio:team-leave", dir, teamId, catalog);
  return {
    r,
    calls: shell.calls.slice(n).filter((c) => LEAVE_VERBS.has(c[0])),
    touched: shell.hits.slice(h),
  };
}

function leaveQuiet(got, needle) {
  const text = JSON.stringify(got.r || {});
  return !!(got.r && got.r.error === OUTSIDE && got.r.said && got.r.said.frame === OUTSIDE
    && (!needle || !text.includes(needle)) && got.calls.length === 0 && got.touched.length === 0);
}

function leaveTook(got, dirWant, catWant) {
  const left = got.calls.filter((c) => c[0] === "leaveTeam");
  if (!(got.r && got.r.error == null && left.length === 1)) return false;
  const argDir = left[0][1];
  const dirOk = dirWant === null ? argDir === null : (argDir != null && path.resolve(String(argDir)) === path.resolve(dirWant));
  const catOk = catWant == null ? true : (left[0][2] && left[0][2].catalog === catWant);
  return dirOk && catOk;
}

async function iw8(mainPath) {
  const watch = [];
  const shell = await loadAt("iw8", watch, mainPath);
  const prevPass = process.env.STUDIO_KEY_PASSPHRASE;
  try {
    process.env.STUDIO_KEY_PASSPHRASE = "pass";
    const keyPath = path.join(shell.ud, Sign.KEY_FILE);
    const keyDoc = await Sign.makeKeyFile({ passphrase: "pass" });
    fs.writeFileSync(keyPath, JSON.stringify(keyDoc, null, 1) + "\n");
    const teamId = "t-0123456789abcdef";
    const share = path.join(shell.ud, "share");
    fs.mkdirSync(share, { recursive: true });
    Store.chooseSealed(Store.teamsFile(shell.ud), teamId, true, share, {
      id: teamId, epoch: 1, sealed: true,
      lead: { keyId: keyDoc.keyId, public: keyDoc.public },
      catalogs: ["cat-orphan", "cat-listed"],
    });
    const hostile = hostileOf(shell.projects);
    fs.writeFileSync(path.join(hostile.away, "project.json"), JSON.stringify({ id: "cat-away", sealedTeam: teamId, folder: share }) + "\n");
    fs.writeFileSync(path.join(shell.projects, "project.json"), JSON.stringify({ id: "cat-root", sealedTeam: teamId, folder: share }) + "\n");
    watch.push(hostile.away, path.resolve(hostile.dotdot), hostile.unc);
    const listed = path.join(shell.projects, "Harbour lamps");
    fs.mkdirSync(listed, { recursive: true });
    fs.writeFileSync(path.join(listed, "project.json"), JSON.stringify({ id: "cat-listed", sealedTeam: teamId, folder: share }) + "\n");
    const outside = await askLeave(shell, hostile.away, teamId, "cat-orphan");
    const dotdot = await askLeave(shell, hostile.dotdot, teamId, "cat-orphan");
    const unc = await askLeave(shell, hostile.unc, teamId, "cat-orphan");
    const dot = await askLeave(shell, ".", teamId, "cat-orphan");
    const blank = await askLeave(shell, "   ", teamId, "cat-orphan");
    const empty = await askLeave(shell, "", teamId, "cat-orphan");
    const absent = await askLeave(shell, null, teamId, "cat-orphan");
    const honest = await askLeave(shell, listed, "", "");
    const byName = await askLeave(shell, "Harbour lamps", "", "");
    return {
      outside, dotdot, unc, dot, blank, empty, absent, honest, byName,
      listed: path.resolve(listed),
    };
  } finally {
    if (prevPass === undefined) delete process.env.STUDIO_KEY_PASSPHRASE;
    else process.env.STUDIO_KEY_PASSPHRASE = prevPass;
    shell.done();
  }
}

async function plantIw8() {
  if (PLANTS_OFF) {
    notRun("iw8 plant:txic-leave lifted (ETIUDA_PLANTS=off)");
    return true;
  }
  const checkout = fs.readFileSync(MAIN, "utf8");
  if (!checkout.includes(LEAVE_MARK)) {
    fail("iw8 plant", "marker absent, so the unconditional projectDir call cannot be put back");
    return false;
  }
  const plantedPath = path.join(ROOT, "shell", "main.ipc-wall-plant.js");
  const before = fs.readFileSync(MAIN);
  let held = false;
  try {
    fs.writeFileSync(plantedPath, plantText(checkout, LEAVE_MARK, LEAVE_LIFTED, "shell/main.js"));
    const got = await iw8(plantedPath);
    const refusedEmpty = !!(got.empty.r && got.empty.r.error === OUTSIDE && got.empty.calls.length === 0);
    if (!refusedEmpty) fail("iw8 plant", "putting unconditional projectDir back still let empty dir through: " + JSON.stringify({
      error: got.empty.r && got.empty.r.error, verbs: got.empty.calls.map((c) => c[0]),
    }));
    else keep("iw8 plant an empty directory is refused once unconditional projectDir is put back");
    held = refusedEmpty;
  } finally {
    try { fs.unlinkSync(plantedPath); } catch { /* already gone */ }
  }
  const same = fs.readFileSync(MAIN).equals(before);
  if (!same) fail("iw8 plant", "shell/main.js changed");
  return held && same;
}

const FLAG_MARK = 'answer("studio:flag-keep", async (e, dir, id) => guard(async () => {';
const FLAG_LIFTED = 'IPC.handle("studio:flag-keep", async (e, dir, id) => guard(async () => {';

/* iw9: the flag channel is answered to the page's own frame only. A page elsewhere, and a frame inside the page, are answered null
   and the thread is never asked; the page's own frame is answered, so the refusal is not a channel that answers nobody. */
async function iw9(mainPath) {
  const shell = await loadAt("iw9", [], mainPath);
  try {
    /* The wall is judged here, not the sign-in gate: this Studio is signed in under a trial, as iw3's and iw7's are. */
    fs.writeFileSync(path.join(shell.ud, "licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft" }));
    const listed = path.join(shell.projects, "Harbour lamps");
    fs.mkdirSync(listed, { recursive: true });
    fs.writeFileSync(path.join(listed, "project.json"), JSON.stringify({ id: "cat-listed" }));
    const door = shell.handlers["studio:flag-keep"];
    if (!door) throw new Error("no door for studio:flag-keep");
    const as = async (frame) => {
      const n = shell.calls.length;
      const r = await door({ senderFrame: frame, sender: {} }, listed, "flag-1");
      return { r, calls: shell.calls.slice(n).filter((c) => c[0] === "flagKeep") };
    };
    const own = pathToFileURL(UI).href;
    return {
      foreign: await as({ parent: null, url: "https://example.com/" }),
      inside: await as({ parent: { parent: null, url: own }, url: own }),
      honest: await as({ parent: null, url: own }),
    };
  } finally { shell.done(); }
}

async function plantIw9() {
  if (PLANTS_OFF) {
    notRun("iw9 plant: studio:flag-keep registered without the own-frame wall (ETIUDA_PLANTS=off)");
    return true;
  }
  const checkout = fs.readFileSync(MAIN, "utf8");
  if (!checkout.includes(FLAG_MARK)) {
    fail("iw9 plant", "the flag channel's registration is absent, so the wall cannot be taken off it");
    return false;
  }
  const plantedPath = path.join(ROOT, "shell", "main.ipc-wall-plant.js");
  const before = fs.readFileSync(MAIN);
  let held = false;
  try {
    /* The channel's line carries no plant mark in the shell, so the scratch copy is a plain one-occurrence substitution. */
    if (checkout.split(FLAG_MARK).length !== 2) { fail("iw9 plant", "the flag channel's registration is not on exactly one line"); return false; }
    fs.writeFileSync(plantedPath, checkout.split(FLAG_MARK).join(FLAG_LIFTED));
    const got = await iw9(plantedPath);
    const answered = got.foreign.r !== null && got.foreign.calls.length === 1;
    if (!answered) fail("iw9 plant", "a channel registered without the wall still refused a foreign frame: " + JSON.stringify({ r: got.foreign.r, calls: got.foreign.calls.length }));
    else keep("iw9 plant a foreign frame is answered, and the thread asked, once the channel has no own-frame wall");
    held = answered;
  } finally {
    try { fs.unlinkSync(plantedPath); } catch { /* already gone */ }
  }
  const same = fs.readFileSync(MAIN).equals(before);
  if (!same) fail("iw9 plant", "shell/main.js changed");
  return held && same;
}

async function main() {
  const planted = await plantIw1();
  let green = false;
  try {
    const got = await iw1(MAIN);
    const bits = [
      ["iw1 outside", refused(got.outside, path.resolve(got.outside.r && "") || "x"), got.outside],
      ["iw1 dotdot", refused(got.dotdot, ".."), got.dotdot],
      ["iw1 unc", refused(got.unc, "not-a-server"), got.unc],
    ];
    /* The refusal must not carry the hostile path. `refused` already requires the fixed sentence.
       The directory compared above is a dummy for the outside case, so check the real paths here. */
    const away = got.outside;
    const awayText = JSON.stringify(away.r || {});
    if (awayText.includes("not-listed")) {
      bits[0][1] = false;
    }
    for (const [name, ok, gotOne] of bits) {
      if (ok) keep(name);
      else fail(name, JSON.stringify({
        error: gotOne.r && gotOne.r.error,
        frame: gotOne.r && gotOne.r.said && gotOne.r.said.frame,
        opened: gotOne.opened.map((c) => c[0] + " " + String(c[1]).slice(0, 120)),
        fs: gotOne.touched.map((h) => h.name + " " + h.args.join("|")).slice(0, 6),
      }));
    }
    const honestOk = got.honest.r && got.honest.r.error == null && got.honest.opened.length === 1
      && path.resolve(String(got.honest.opened[0][1])) === got.listed;
    const nameOk = got.byName.r && got.byName.r.error == null && got.byName.opened.length === 1
      && path.resolve(String(got.byName.opened[0][1])) === got.listed;
    if (honestOk) keep("iw1 listed catalog opens");
    else fail("iw1 listed catalog opens", JSON.stringify({
      error: got.honest.r && got.honest.r.error, arg: got.honest.opened.map((c) => c[1]), want: got.listed,
    }));
    if (nameOk) keep("iw1 a name under the projects root opens");
    else fail("iw1 a name under the projects root opens", JSON.stringify({
      error: got.byName.r && got.byName.r.error, arg: got.byName.opened.map((c) => c[1]), want: got.listed,
    }));
    green = bits.every((b) => b[1]) && honestOk && nameOk;
  } catch (err) {
    fail("iw1 load", String(err && err.stack || err));
  }
  const plantedFile = await plantIw3();
  let fileGreen = false;
  try {
    const got = await iw3(MAIN);
    const bits = [
      ["iw3 outside", proposalQuiet(got.outside, "not-listed"), got.outside],
      ["iw3 dotdot", proposalQuiet(got.dot, "not-listed"), got.dot],
      ["iw3 unc", proposalQuiet(got.uncGot, "not-a-server"), got.uncGot],
      ["iw3 a desk folder that is not a key", proposalQuiet(got.bad, "not-a-key"), got.bad],
      ["iw3 a desk junction to another folder", proposalQuiet(got.leak, "leaked-desk"), got.leak],
      ["iw3 revert stays in the inbox", proposalQuiet(got.deskRevert, "note.ec"), got.deskRevert],
    ];
    for (const [name, okBit, gotOne] of bits) {
      if (okBit) keep(name);
      else fail(name, JSON.stringify({
        error: gotOne.r && gotOne.r.error,
        frame: gotOne.r && gotOne.r.said && gotOne.r.said.frame,
        verbs: gotOne.calls.map((c) => c[0] + " " + String(c[2] || "").slice(-80)),
        fs: gotOne.touched.map((h) => h.name).slice(0, 6),
      }));
    }
    const honestOk = proposalTook(got.honest, got.inboxFile);
    const nameOk = proposalTook(got.byName, got.inboxFile);
    const deskOk = proposalTook(got.deskOpen, got.deskFile);
    const revertOk = proposalTook(got.revert, got.inboxFile);
    if (honestOk) keep("iw3 a file in the inbox is opened");
    else fail("iw3 a file in the inbox is opened", JSON.stringify({
      error: got.honest.r && got.honest.r.error, arg: got.honest.calls.map((c) => c[2]),
    }));
    if (nameOk) keep("iw3 a file named under the inbox is decided");
    else fail("iw3 a file named under the inbox is decided", JSON.stringify({
      error: got.byName.r && got.byName.r.error, arg: got.byName.calls.map((c) => c[2]),
    }));
    if (deskOk) keep("iw3 a file in the catalog's desks folder is opened");
    else fail("iw3 a file in the catalog's desks folder is opened", JSON.stringify({
      error: got.deskOpen.r && got.deskOpen.r.error, arg: got.deskOpen.calls.map((c) => c[2]),
    }));
    if (revertOk) keep("iw3 a file in the inbox can have its marks put back");
    else fail("iw3 a file in the inbox can have its marks put back", JSON.stringify({
      error: got.revert.r && got.revert.r.error, arg: got.revert.calls.map((c) => c[2]),
    }));
    fileGreen = bits.every((b) => b[1]) && honestOk && nameOk && deskOk && revertOk;
  } catch (err) {
    fail("iw3 load", String(err && err.stack || err));
  }
  const plantedInto = await plantIw4();
  let intoGreen = false;
  try {
    const got = await iw4(MAIN);
    const bits = [
      ["iw4 outside", importQuiet(got.outside, "not-listed"), got.outside],
      ["iw4 dotdot", importQuiet(got.dot, "not-listed"), got.dot],
      ["iw4 unc", importQuiet(got.unc, "not-a-server"), got.unc],
      ["iw4 dot", importQuiet(got.dotName, ""), got.dotName],
      ["iw4 blank", importQuiet(got.blank, ""), got.blank],
    ];
    for (const [name, okBit, gotOne] of bits) {
      if (okBit) keep(name);
      else fail(name, JSON.stringify({
        error: gotOne.r && gotOne.r.error,
        frame: gotOne.r && gotOne.r.said && gotOne.r.said.frame,
        verbs: gotOne.calls.map((c) => c[0] + " " + String(c[4] || "").slice(-80)),
        fs: gotOne.touched.map((h) => h.name).slice(0, 6),
      }));
    }
    const emptyPlanOk = importTook(got.emptyPlan, "importPlan", "");
    const emptyLandOk = importTook(got.emptyLand, "importLand", "");
    const namedOk = importTook(got.named, "importLand", got.listed);
    const unpickedOk = got.unpicked.r == null && got.unpicked.calls.length === 0
      && got.unpicked.touched.length === 0;
    const pickOk = !!(got.pick && got.pick.file && path.resolve(String(got.pick.file)) === path.resolve(got.file));
    if (pickOk && emptyPlanOk && emptyLandOk) keep("iw4 an empty target still plans and lands the file the pick answered");
    else fail("iw4 an empty target still plans and lands the file the pick answered", JSON.stringify({
      pick: got.pick && got.pick.file,
      plan: got.emptyPlan.calls.map((c) => c[4]),
      land: got.emptyLand.calls.map((c) => [c[0], c[4]]),
      planError: got.emptyPlan.r && got.emptyPlan.r.error,
    }));
    if (namedOk) keep("iw4 a listed catalog is where the import lands");
    else fail("iw4 a listed catalog is where the import lands", JSON.stringify({
      error: got.named.r && got.named.r.error, arg: got.named.calls.map((c) => c[4]), want: got.listed,
    }));
    if (unpickedOk) keep("iw4 a file no pick answered is refused before the target is read");
    else fail("iw4 a file no pick answered is refused before the target is read", JSON.stringify({
      error: got.unpicked.r && got.unpicked.r.error, verbs: got.unpicked.calls.map((c) => c[0]),
    }));
    intoGreen = bits.every((b) => b[1]) && pickOk && emptyPlanOk && emptyLandOk && namedOk && unpickedOk;
  } catch (err) {
    fail("iw4 load", String(err && err.stack || err));
  }
  const plantedShow = await plantIw5();
  /* The same ask twice: with the projects folder under its own spelling, and behind a junction. */
  const showPlain = await showLeg(false);
  const showJunction = await showLeg(true);
  const showGreen = showPlain && showJunction;
  const plantedSpelling = await plantShowLine("iw5j", SPELL_MARK, SPELL_LIFTED, true,
    (got) => got.shownFile.r && got.shownFile.r.error != null && got.shownFile.shown.length === 0,
    "a catalog behind a junction is refused once the spellings are no longer put on one form");
  const plantedLink = await plantShowLine("iw5", LINK_MARK, LINK_LIFTED, false,
    (got) => got.leak.r && got.leak.r.error == null && got.leak.shown.length === 1,
    "a link out of the catalog is shown once the real-path check is lifted");
  const plantedPeople = await plantIw6();
  let peopleGreen = false;
  try {
    const got = await iw6(MAIN);
    const bits = [
      ["iw6 outside", peopleQuiet(got.outside, "not-listed"), got.outside],
      ["iw6 dotdot", peopleQuiet(got.dotdot, "not-listed"), got.dotdot],
      ["iw6 unc", peopleQuiet(got.unc, "not-a-server"), got.unc],
      ["iw6 admit outside", peopleQuiet(got.admitOut, "not-listed"), got.admitOut],
    ];
    for (const [name, okBit, gotOne] of bits) {
      if (okBit) keep(name);
      else fail(name, JSON.stringify({
        error: gotOne.r && gotOne.r.error,
        frame: gotOne.r && gotOne.r.said && gotOne.r.said.frame,
        verbs: gotOne.calls.map((c) => c[0] + " " + String(c[1] || "").slice(-80)),
        fs: gotOne.touched.map((h) => h.name).slice(0, 6),
      }));
    }
    /* A Studio nobody signed in to does not work, so the list is refused as a stop and asks nothing (was: answered an empty list). */
    const unsignedOk = !!got.unsigned.r && !!got.unsigned.r.error && !!got.unsigned.r.said && got.unsigned.r.said.why === "stopped"
      && got.unsigned.calls.length === 0 && got.unsigned.touched.length === 0;
    const honestOk = got.honest.r && got.honest.r.error == null && peopleTook(got.honest, got.listed);
    const nameOk = got.byName.r && got.byName.r.error == null && peopleTook(got.byName, got.listed);
    const admitOk = peopleTook(got.admit, got.listed);
    if (unsignedOk) keep("iw6 a Studio nobody signed in to asks nothing");
    else fail("iw6 a Studio nobody signed in to asks nothing", JSON.stringify({
      error: got.unsigned.r && got.unsigned.r.error, verbs: got.unsigned.calls.map((c) => c[0]),
    }));
    if (honestOk) keep("iw6 a listed catalog is the one the list reads");
    else fail("iw6 a listed catalog is the one the list reads", JSON.stringify({
      error: got.honest.r && got.honest.r.error, verbs: got.honest.calls.map((c) => c[0] + " " + String(c[1] || "")),
    }));
    if (nameOk) keep("iw6 a name under the projects root is the one the list reads");
    else fail("iw6 a name under the projects root is the one the list reads", JSON.stringify({
      error: got.byName.r && got.byName.r.error, verbs: got.byName.calls.map((c) => String(c[1] || "")),
    }));
    if (admitOk) keep("iw6 an admission reads the same listed catalog");
    else fail("iw6 an admission reads the same listed catalog", JSON.stringify({
      error: got.admit.r && got.admit.r.error, verbs: got.admit.calls.map((c) => c[0] + " " + String(c[1] || "")),
    }));
    peopleGreen = bits.every((b) => b[1]) && unsignedOk && honestOk && nameOk && admitOk;
  } catch (err) {
    fail("iw6 load", String(err && err.stack || err));
  }
  const plantedUnc = await plantIw7();
  let uncGreen = false;
  try {
    const got = await iw7(MAIN);
    const bits = [
      ["iw7 open outside", uncQuiet(got.outside, OUTSIDE, "other"), got.outside],
      ["iw7 open dotdot", uncQuiet(got.dotdot, OUTSIDE, "left-out"), got.dotdot],
      ["iw7 show outside", uncQuiet(got.showOut, NOT_SHOWN, "other"), got.showOut],
      ["iw7 show dotdot", uncQuiet(got.showDot, NOT_SHOWN, "left-out"), got.showDot],
      ["iw7 reveal outside", uncQuiet(got.revealOut, NOT_SHOWN, "other"), got.revealOut],
      ["iw7 reveal dotdot", uncQuiet(got.revealDot, NOT_SHOWN, "left-out"), got.revealDot],
      ["iw7 proposal outside", uncQuiet(got.propOut, OUTSIDE, "other"), got.propOut],
      ["iw7 proposal dotdot", uncQuiet(got.propDot, OUTSIDE, "left-out"), got.propDot],
    ];
    for (const [name, okBit, gotOne] of bits) {
      if (okBit) keep(name);
      else fail(name, JSON.stringify({
        error: gotOne.r && gotOne.r.error,
        frame: gotOne.r && gotOne.r.said && gotOne.r.said.frame,
        shown: gotOne.shown, opened: gotOne.opened,
        verbs: (gotOne.calls || gotOne.opened || []).map((c) => c[0] + " " + String(c[1] || c[2] || "")).slice(0, 4),
        fs: gotOne.touched.map((h) => h.name).slice(0, 6),
      }));
    }
    const openOk = got.honest.r && got.honest.r.error == null && got.honest.opened.length === 1
      && path.resolve(String(got.honest.opened[0][1])) === got.catalog;
    const nameOk = got.byName.r && got.byName.r.error == null && got.byName.opened.length === 1
      && path.resolve(String(got.byName.opened[0][1])) === got.catalog;
    const showOk = got.shownFile.r && got.shownFile.r.error == null && got.shownFile.shown.length === 1
      && path.resolve(got.shownFile.shown[0]) === got.note;
    const revealOk = got.revealed.r && got.revealed.r.error == null && got.revealed.opened.length === 1
      && path.resolve(got.revealed.opened[0]) === got.catalog;
    const propOpenOk = got.propOpen.calls.length === 1 && got.propOpen.calls[0][0] === "openProposal"
      && path.resolve(String(got.propOpen.calls[0][2])) === got.inboxFile
      && got.propOpen.r && got.propOpen.r.error == null;
    const propDecideOk = got.propDecide.calls.length === 1 && got.propDecide.calls[0][0] === "decideProposal"
      && path.resolve(String(got.propDecide.calls[0][2])) === got.inboxFile
      && got.propDecide.r && got.propDecide.r.error == null;
    if (openOk) keep("iw7 a catalog under the UNC root opens");
    else fail("iw7 a catalog under the UNC root opens", JSON.stringify({
      error: got.honest.r && got.honest.r.error, arg: got.honest.opened.map((c) => c[1]), want: got.catalog,
    }));
    if (nameOk) keep("iw7 a name under the UNC root opens");
    else fail("iw7 a name under the UNC root opens", JSON.stringify({
      error: got.byName.r && got.byName.r.error, arg: got.byName.opened.map((c) => c[1]), want: got.catalog,
    }));
    if (showOk) keep("iw7 a file in that catalog is shown");
    else fail("iw7 a file in that catalog is shown", JSON.stringify({
      error: got.shownFile.r && got.shownFile.r.error, shown: got.shownFile.shown,
    }));
    if (revealOk) keep("iw7 that catalog's folder is opened");
    else fail("iw7 that catalog's folder is opened", JSON.stringify({
      error: got.revealed.r && got.revealed.r.error, opened: got.revealed.opened,
    }));
    if (propOpenOk) keep("iw7 a proposal in that catalog is opened");
    else fail("iw7 a proposal in that catalog is opened", JSON.stringify({
      error: got.propOpen.r && got.propOpen.r.error, arg: got.propOpen.calls.map((c) => c[2]),
    }));
    if (propDecideOk) keep("iw7 a proposal in that catalog is decided");
    else fail("iw7 a proposal in that catalog is decided", JSON.stringify({
      error: got.propDecide.r && got.propDecide.r.error, arg: got.propDecide.calls.map((c) => c[2]),
    }));
    uncGreen = bits.every((b) => b[1]) && openOk && nameOk && showOk && revealOk && propOpenOk && propDecideOk;
  } catch (err) {
    fail("iw7 load", String(err && err.stack || err));
  }
  const plantedLeave = await plantIw8();
  let leaveGreen = false;
  try {
    const got = await iw8(MAIN);
    const bits = [
      ["iw8 outside", leaveQuiet(got.outside, "not-listed"), got.outside],
      ["iw8 dotdot", leaveQuiet(got.dotdot, "not-listed"), got.dotdot],
      ["iw8 unc", leaveQuiet(got.unc, "not-a-server"), got.unc],
      ["iw8 dot", leaveQuiet(got.dot, ""), got.dot],
      ["iw8 blank", leaveQuiet(got.blank, ""), got.blank],
    ];
    for (const [name, okBit, gotOne] of bits) {
      if (okBit) keep(name);
      else fail(name, JSON.stringify({
        error: gotOne.r && gotOne.r.error,
        frame: gotOne.r && gotOne.r.said && gotOne.r.said.frame,
        verbs: gotOne.calls.map((c) => c[0] + " " + String(c[1] || "").slice(-80)),
        fs: gotOne.touched.map((h) => h.name).slice(0, 6),
      }));
    }
    const emptyOk = leaveTook(got.empty, null, "cat-orphan");
    const absentOk = leaveTook(got.absent, null, "cat-orphan");
    const honestOk = leaveTook(got.honest, got.listed, null);
    const nameOk = leaveTook(got.byName, got.listed, null);
    if (emptyOk) keep("iw8 an empty directory still takes an orphan catalog off its team");
    else fail("iw8 an empty directory still takes an orphan catalog off its team", JSON.stringify({
      error: got.empty.r && got.empty.r.error, calls: got.empty.calls,
    }));
    if (absentOk) keep("iw8 a null directory still takes an orphan catalog off its team");
    else fail("iw8 a null directory still takes an orphan catalog off its team", JSON.stringify({
      error: got.absent.r && got.absent.r.error, calls: got.absent.calls,
    }));
    if (honestOk) keep("iw8 a listed catalog is taken off its team");
    else fail("iw8 a listed catalog is taken off its team", JSON.stringify({
      error: got.honest.r && got.honest.r.error, calls: got.honest.calls, want: got.listed,
    }));
    if (nameOk) keep("iw8 a name under the projects root is taken off its team");
    else fail("iw8 a name under the projects root is taken off its team", JSON.stringify({
      error: got.byName.r && got.byName.r.error, calls: got.byName.calls, want: got.listed,
    }));
    leaveGreen = bits.every((b) => b[1]) && emptyOk && absentOk && honestOk && nameOk;
  } catch (err) {
    fail("iw8 load", String(err && err.stack || err));
  }
  const plantedFlag = await plantIw9();
  let flagGreen = false;
  try {
    const got = await iw9(MAIN);
    const refused = (g) => g.r === null && g.calls.length === 0;
    const bits = [["iw9 a foreign frame is answered null and the thread is not asked", refused(got.foreign), got.foreign],
      ["iw9 a frame inside the page is answered null and the thread is not asked", refused(got.inside), got.inside],
      ["iw9 the page's own frame is answered, the thread asked once", got.honest.r != null && got.honest.calls.length === 1, got.honest]];
    for (const [name, okBit, g] of bits) {
      if (okBit) keep(name);
      else fail(name, JSON.stringify({ r: g.r, calls: g.calls.length }));
    }
    flagGreen = bits.every((b) => b[1]);
  } catch (err) {
    fail("iw9 load", String(err && err.stack || err));
  }
  const ok = planted && plantedFile && plantedInto && plantedShow && plantedSpelling && plantedLink && plantedPeople && plantedUnc && plantedLeave && plantedFlag
    && green && fileGreen && intoGreen && showGreen && peopleGreen && uncGreen && leaveGreen && flagGreen && fails.length === 0;
  console.log("ipc-wall " + (ok ? "ok" : "FAIL") + " fails " + fails.length);
  console.log("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED);
  if (asserted + skipped < EXPECTED) {
    console.log("SUITE DID NOT COMPLETE: " + (asserted + skipped) + " of " + EXPECTED);
    process.exit(78);
  }
  process.exit(ok ? 0 : 1);
}

main();
