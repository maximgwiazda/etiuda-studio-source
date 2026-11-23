/* THE PROXY PLANTING HOOK: harness-only planted reg query answers for shell/main.js's start-up proxy reader,
 * refused outside a harness launch and in a packaged Studio.
 *
 *     node tests/win-proxy-plant.mjs        exit code is the number of failed checks, capped at 63
 *
 * gate-kind: node
 *
 * No window opens and no real registry key is read: child_process is stood in with Symbol.for("etiuda.reg-stand"),
 * Electron is stood in for shell/main.js, and process.platform is set to "win32" around each start-up read.
 *
 *   wp1  src/win-proxy-plant.cjs answers each of the oracle's four states (policy, manual, none, automatic) with
 *        the switches the oracle expects, starting reg.exe zero times
 *   wp2  shell/main.js in an unpackaged harness launch with STUDIO_PROXY_PLANT appends the exact switches the oracle
 *        expects for each of the four states, starting reg.exe zero times
 *   wp3  an unanswered reg query or malformed plant file throws and never falls back to reg.exe
 *   wp7  a named plant file that does not exist stops the launch: no fallback, reg.exe not started
 *   wp4  outside a harness launch (no --user-data-dir, no STUDIO_GATE, no STUDIO_TEST_OFFSCREEN, no
 *        ETIUDA_TEST_DOCUMENTS), STUDIO_PROXY_PLANT is refused: the planted file is not opened and the reader behaves
 *        as on main
 *   wp5  in a packaged Studio (app.asar and app.isPackaged), STUDIO_PROXY_PLANT is refused even under a harness
 *        launch: the planted file is not opened and the reader behaves as on main
 *   wp6  on Linux with a planted state, shell/main.js appends no proxy switch and starts reg.exe zero times
 *
 * PLANTS. Each refusal and error guard is lifted once in a scratch copy (tests/plant-copy.mjs) and its leg must
 * go red; ETIUDA_PLANTS=off skips the phase. */
import "./reg-stand-on.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Module, { createRequire, syncBuiltinESMExports } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PROXY_STATES, plantedProxySwitches } from "./win-proxy-oracle.mjs";
import { copyPlants } from "./plant-copy.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SELF = fileURLToPath(import.meta.url);
const require = createRequire(import.meta.url);
const ONLY = process.env.WIN_PROXY_PLANT_ONLY || "";

const REG_KEY = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings";
const CONN_KEY = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\Connections";
const MACHINE_CONN_KEY = "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\Connections";
const POLICY_KEY = "HKLM\\SOFTWARE\\Policies\\Etiuda";   /* the one key src/ai-policy.cjs asks, where the shell has it */
const QUIET = ["", REG_KEY, "    ProxyEnable    REG_DWORD    0x0", "", REG_KEY + "\\Connections", ""].join("\r\n");
const QUIET_CONN = ["", CONN_KEY, "    DefaultConnectionSettings    REG_BINARY    460000000200000001" + "00".repeat(47), ""].join("\r\n");

let asserted = 0, failed = 0;
function check(ok, line) {
  asserted++;
  if (ok) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
function skip(line) { process.stdout.write("  skip " + line + "\n"); }

const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "win-proxy-plant-"));
function writePlant(name, doc) {
  const file = path.join(SCRATCH, name + ".json");
  fs.writeFileSync(file, typeof doc === "string" ? doc : JSON.stringify(doc, null, 2), "utf8");
  return file;
}

/* Loads shell/main.js (or a copy under app.asar) with Electron stood in and a marked child_process stand-in
 * that answers QUIET/QUIET_CONN and records any reg query or file open of `watchFile`. */
async function loadShellProxy(name, opts) {
  const o = opts || {};
  const ud = path.join(SCRATCH, "ud-" + name);
  fs.mkdirSync(ud, { recursive: true });
  const main = o.main || path.join(ROOT, "shell", "main.js");
  const ui = path.join(path.dirname(main), "..", "ui", "index.html");
  const switched = [], regCalls = [], policyCalls = [];
  let openedWatch = false;
  const winStub = class {
    constructor() {
      this.webContents = { id: 1, on() {}, once() {}, send() {}, setWindowOpenHandler() {}, getURL: () => pathToFileURL(ui).href,
        reload() {}, forcefullyCrashRenderer() {}, getZoomLevel: () => 0, setZoomLevel() {} };
    }
    on() {} once() {} isDestroyed() { return false; } isMaximized() { return false; }
    close() {} loadFile() {} show() {} showInactive() {} setMinimumSize() {}
  };
  const display = { bounds: { x: 0, y: 0, width: 1920, height: 1080 }, workAreaSize: { width: 1920, height: 1032 } };
  const electron = {
    app: {
      isPackaged: Boolean(o.appPackaged),
      commandLine: { appendSwitch: (k, v) => { switched.push(v === undefined ? [k] : [k, v]); }, hasSwitch: () => false, removeSwitch() {} },
      getPath: () => ud, getVersion: () => "0.0.0", getLocale: () => "en-GB", requestSingleInstanceLock: () => true,
      whenReady: () => new Promise(() => {}), on() {}, quit() {}, exit() {},
    },
    BrowserWindow: Object.assign(winStub, { fromWebContents: () => null, getAllWindows: () => [] }),
    Menu: { setApplicationMenu() {}, buildFromTemplate: () => ({ popup() {} }) },
    dialog: { showMessageBox: () => Promise.resolve({ response: 0 }), showOpenDialog: () => Promise.resolve({ canceled: true, filePaths: [] }), showSaveDialog: () => Promise.resolve({ canceled: true, filePath: "" }) },
    nativeTheme: { themeSource: "system" },
    clipboard: { writeText() {} },
    safeStorage: { isEncryptionAvailable: () => false, encryptString: (s) => Buffer.from(String(s)), decryptString: () => "" },
    screen: { getAllDisplays: () => [display], getPrimaryDisplay: () => display, on() {}, removeListener() {} },
    session: { defaultSession: { setPermissionRequestHandler() {}, setPermissionCheckHandler() {}, setDevicePermissionHandler() {}, setSpellCheckerLanguages() {}, setSpellCheckerDictionaryDownloadURL() {}, setSpellCheckerEnabled() {} } },
    shell: { openPath: () => Promise.resolve(""), openExternal() {}, trashItem: () => Promise.resolve() },
    ipcMain: { handle() {}, on() {} },
  };
  const quietChild = { on() {}, unref() {}, kill() {}, pid: 0, stdout: { on() {} }, stderr: { on() {} }, stdin: { end() {}, write() {} } };
  const cp = {
    execFileSync: (file, argv) => {
      if (file === "/usr/bin/dbus-send") throw new Error("no session bus");
      const key = Array.isArray(argv) ? String(argv[1] || "") : "";
      /* The licence line's shell reads its policy key once as it loads (src/ai-policy.cjs), through this same stand-in. It is
         counted apart, so that regCalls stays what the proxy reader asked; where the shell has no such read the list is empty. */
      if (key === POLICY_KEY) { policyCalls.push([file, argv]); return QUIET; }
      regCalls.push([file, argv]);
      if (key === CONN_KEY || key === MACHINE_CONN_KEY) return QUIET_CONN;
      return QUIET;
    },
    execSync: () => "",
    spawnSync: () => ({ status: 0, stdout: "", stderr: "" }),
    execFile: (file, argv, opt, cb) => {
      regCalls.push([file, argv]);
      const done = typeof opt === "function" ? opt : cb;
      if (typeof done === "function") done(null, "", "");
      return quietChild;
    },
    spawn: () => quietChild, exec: () => quietChild, fork: () => quietChild,
  };
  for (const n of ["execFileSync", "execFile"]) cp[n][Symbol.for("etiuda.reg-stand")] = true;
  const builtinCp = process.getBuiltinModule("node:child_process");
  const childNames = ["execFileSync", "execSync", "spawnSync", "execFile", "spawn", "exec", "fork"];
  const childWas = {};
  for (const n of childNames) { childWas[n] = builtinCp[n]; builtinCp[n] = cp[n]; }
  syncBuiltinESMExports();

  const envClear = ["STUDIO_GATE", "STUDIO_TEST_OFFSCREEN", "ETIUDA_TEST_DOCUMENTS", "STUDIO_PROXY_PLANT", "STUDIO_NO_PROXY_SERVER", "STUDIO_PROJECTS"];
  const envWas = {};
  for (const k of envClear) envWas[k] = process.env[k];
  for (const k of envClear) delete process.env[k];
  process.env.STUDIO_PROJECTS = path.join(ud, "projects");
  fs.mkdirSync(process.env.STUDIO_PROJECTS, { recursive: true });
  for (const [k, v] of Object.entries(o.env || {})) {
    if (v === null || v === undefined) delete process.env[k]; else process.env[k] = String(v);
  }

  const argvWas = process.argv.slice();
  if (Array.isArray(o.argv)) process.argv = o.argv.slice();
  const platformWas = Object.getOwnPropertyDescriptor(process, "platform");
  Object.defineProperty(process, "platform", { value: o.platform || "win32", configurable: true });

  const readSyncWas = fs.readFileSync;
  const openSyncWas = fs.openSync;
  const watchTarget = o.watchFile ? path.resolve(o.watchFile) : "";
  if (watchTarget) {
    fs.readFileSync = function (p, ...rest) {
      try { if (path.resolve(String(p)) === watchTarget) openedWatch = true; } catch { /* ignore */ }
      return readSyncWas.call(this, p, ...rest);
    };
    fs.openSync = function (p, ...rest) {
      try { if (path.resolve(String(p)) === watchTarget) openedWatch = true; } catch { /* ignore */ }
      return openSyncWas.call(this, p, ...rest);
    };
  }

  const load = Module._load;
  const thread = { call: (verb) => Promise.resolve({ verb }) };
  Module._load = function (req) {
    if (req === "electron") return electron;
    if (req === "node:child_process" || req === "child_process") return cp;
    if (/studio-thread\.cjs$/.test(String(req))) return thread;
    return load.apply(this, arguments);
  };

  let threw = null;
  const clearModules = () => {
    for (const rel of [
      main,
      path.join(path.dirname(main), "..", "src", "win-proxy-plant.cjs"),
      path.join(path.dirname(main), "..", "engine", "pinned", "shell", "win-proxy.cjs"),
      path.join(path.dirname(main), "..", "src", "keyring-bus.cjs"),
    ]) {
      try { delete require.cache[require.resolve(rel)]; } catch { /* not cached */ }
    }
  };
  try {
    clearModules();
    require(main);
  } catch (e) {
    threw = e;
  } finally {
    clearModules();
    Module._load = load;
    fs.readFileSync = readSyncWas;
    fs.openSync = openSyncWas;
    Object.defineProperty(process, "platform", platformWas);
    process.argv = argvWas;
    for (const k of envClear) { if (envWas[k] === undefined) delete process.env[k]; else process.env[k] = envWas[k]; }
    for (const n of childNames) builtinCp[n] = childWas[n];
    syncBuiltinESMExports();
  }
  return { switched, regCalls, policyCalls, openedWatch, threw };
}

/* Stand in node:child_process for direct module calls without shell/main.js, so no real reg.exe can ever run. */
function withMarkedQuietCp(watchFile, fn) {
  const cp = process.getBuiltinModule("node:child_process");
  const regCalls = [];
  let openedWatch = false;
  const was = { execFileSync: cp.execFileSync, execFile: cp.execFile };
  const stand = {
    execFileSync: (file, argv) => {
      regCalls.push([file, argv]);
      const key = Array.isArray(argv) ? String(argv[1] || "") : "";
      if (key === CONN_KEY || key === MACHINE_CONN_KEY) return QUIET_CONN;
      return QUIET;
    },
    execFile: (file, argv, opt, cb) => {
      regCalls.push([file, argv]);
      const done = typeof opt === "function" ? opt : cb;
      if (typeof done === "function") done(null, "", "");
      return {};
    },
  };
  for (const n of ["execFileSync", "execFile"]) stand[n][Symbol.for("etiuda.reg-stand")] = true;
  const readSyncWas = fs.readFileSync;
  const watchTarget = watchFile ? path.resolve(watchFile) : "";
  if (watchTarget) {
    fs.readFileSync = function (p, ...rest) {
      try { if (path.resolve(String(p)) === watchTarget) openedWatch = true; } catch { /* ignore */ }
      return readSyncWas.call(this, p, ...rest);
    };
  }
  const platformWas = Object.getOwnPropertyDescriptor(process, "platform");
  Object.defineProperty(process, "platform", { value: "win32", configurable: true });
  const winProxyAt = require.resolve(path.join(ROOT, "engine", "pinned", "shell", "win-proxy.cjs"));
  const cached = require.cache[winProxyAt];
  delete require.cache[winProxyAt];
  try {
    cp.execFileSync = stand.execFileSync;
    cp.execFile = stand.execFile;
    const out = fn();
    return { out, regCalls, openedWatch };
  } finally {
    fs.readFileSync = readSyncWas;
    Object.defineProperty(process, "platform", platformWas);
    cp.execFileSync = was.execFileSync;
    cp.execFile = was.execFile;
    if (cached) require.cache[winProxyAt] = cached; else delete require.cache[winProxyAt];
  }
}

const LEGS = {};

LEGS.wp1 = async () => {
  const modPath = path.join(ROOT, "src", "win-proxy-plant.cjs");
  let mod = null;
  try { mod = require(modPath); } catch (e) {
    check(false, "wp1 src/win-proxy-plant.cjs exists and loads: " + String(e && e.message || e));
    return;
  }
  const mismatches = [];
  for (const state of Object.keys(PROXY_STATES)) {
    const plant = writePlant("wp1-" + state, { answers: PROXY_STATES[state].answers });
    const oracle = plantedProxySwitches(ROOT, state);
    const res = withMarkedQuietCp(null, () => mod.startupProxySwitches({ plantFile: plant, harness: true, packaged: false }));
    if (JSON.stringify(res.out) !== JSON.stringify(oracle.switches) || res.regCalls.length !== 0) {
      mismatches.push(state + " got " + JSON.stringify(res.out) + " regCalls=" + res.regCalls.length + " want " + JSON.stringify(oracle.switches));
    }
  }
  check(mismatches.length === 0,
    "wp1 src/win-proxy-plant.cjs matches the oracle for all 4 states with 0 reg calls: "
    + (mismatches.length ? mismatches.join("; ") : Object.keys(PROXY_STATES).join(", ")));
};

LEGS.wp2 = async () => {
  const mismatches = [];
  for (const state of Object.keys(PROXY_STATES)) {
    const plant = writePlant("wp2-" + state, { answers: PROXY_STATES[state].answers });
    const oracle = plantedProxySwitches(ROOT, state);
    const res = await loadShellProxy("wp2-" + state, {
      env: { STUDIO_TEST_OFFSCREEN: "1", STUDIO_PROXY_PLANT: plant },
      argv: [process.execPath, path.join(ROOT, "shell", "main.js"), "--user-data-dir=" + path.join(SCRATCH, "ud-wp2-" + state)],
    });
    if (res.threw || JSON.stringify(res.switched) !== JSON.stringify(oracle.switches) || res.regCalls.length !== 0) {
      mismatches.push(state + " got " + JSON.stringify(res.switched) + " regCalls=" + res.regCalls.length
        + (res.threw ? " threw=" + res.threw.message : "") + " want " + JSON.stringify(oracle.switches));
    }
  }
  check(mismatches.length === 0,
    "wp2 shell/main.js in a harness launch appends the oracle's switches for all 4 states with 0 reg calls: "
    + (mismatches.length ? mismatches.join("; ") : Object.keys(PROXY_STATES).join(", ")));
};

LEGS.wp3 = async () => {
  const missingPlant = writePlant("wp3-missing", { answers: { "HKLM\\Software\\Policies\\Microsoft\\Windows\\CurrentVersion\\Internet Settings": "    ProxySettingsPerUser    REG_DWORD    0x0\r\n" } });
  const badPlant = writePlant("wp3-bad", "{ not json");
  const modPath = path.join(ROOT, "src", "win-proxy-plant.cjs");
  let modErr = "", shellErr = "", badErr = "", modReg = -1;
  try {
    const mod = require(modPath);
    try {
      const r = withMarkedQuietCp(null, () => mod.startupProxySwitches({ plantFile: missingPlant, harness: true, packaged: false }));
      modReg = r.regCalls.length;
    } catch (e) { modErr = String(e && e.message || e); }
    try {
      withMarkedQuietCp(null, () => mod.startupProxySwitches({ plantFile: badPlant, harness: true, packaged: false }));
    } catch (e) { badErr = String(e && e.message || e); }
  } catch (e) {
    modErr = "LOAD_FAIL:" + String(e && e.message || e);
  }
  const sh = await loadShellProxy("wp3-shell", {
    env: { STUDIO_TEST_OFFSCREEN: "1", STUDIO_PROXY_PLANT: missingPlant },
    argv: [process.execPath, path.join(ROOT, "shell", "main.js"), "--user-data-dir=" + path.join(SCRATCH, "ud-wp3")],
  });
  shellErr = sh.threw ? String(sh.threw.message || sh.threw) : "";
  check(!/^LOAD_FAIL:/.test(modErr) && /not a planted query/i.test(modErr) && /not a planted query/i.test(shellErr)
    && !!badErr && sh.regCalls.length === 0 && modReg === -1,
    "wp3 an unanswered query and a malformed plant throw and never call reg.exe: "
    + JSON.stringify({ modErr, shellErr, badErr, shellReg: sh.regCalls.length }));
};

LEGS.wp4 = async () => {
  const plant = writePlant("wp4-policy", { answers: PROXY_STATES.policy.answers });
  const modPath = path.join(ROOT, "src", "win-proxy-plant.cjs");
  let modRes = null, modErr = "";
  try {
    const mod = require(modPath);
    modRes = withMarkedQuietCp(plant, () => mod.startupProxySwitches({ plantFile: plant, harness: false, packaged: false }));
  } catch (e) { modErr = String(e && e.message || e); }
  const sh = await loadShellProxy("wp4-non-harness", {
    watchFile: plant,
    env: { STUDIO_PROXY_PLANT: plant },
    argv: [process.execPath, path.join(ROOT, "shell", "main.js")],
  });
  check(!modErr && !!modRes && !modRes.openedWatch && JSON.stringify(modRes.out) === '[["no-proxy-server"]]'
    && !sh.threw && !sh.openedWatch && JSON.stringify(sh.switched) === '[["no-proxy-server"]]' && sh.regCalls.length === 3,
    "wp4 outside a harness launch STUDIO_PROXY_PLANT is ignored, the file is not opened, and the reader runs as on main: "
    + JSON.stringify({ modErr, modOut: modRes && modRes.out, modOpened: modRes && modRes.openedWatch,
      shSwitched: sh.switched, shOpened: sh.openedWatch, shReg: sh.regCalls.length }));
};

LEGS.wp5 = async () => {
  const plant = writePlant("wp5-policy", { answers: PROXY_STATES.policy.answers });
  const asar = path.join(SCRATCH, "packaged", "resources", "app.asar");
  for (const d of ["shell", "src", "ui", "engine/pinned/shell"]) {
    const from = path.join(ROOT, d);
    if (fs.existsSync(from)) fs.cpSync(from, path.join(asar, d), { recursive: true });
  }
  fs.copyFileSync(path.join(ROOT, "package.json"), path.join(asar, "package.json"));

  let modRes = null, modErr = "";
  try {
    const asarMod = require(path.join(asar, "src", "win-proxy-plant.cjs"));
    modRes = withMarkedQuietCp(plant, () => asarMod.startupProxySwitches({ plantFile: plant, harness: true, packaged: false }));
  } catch (e) { modErr = String(e && e.message || e); }

  const sh = await loadShellProxy("wp5-packaged", {
    main: path.join(asar, "shell", "main.js"),
    appPackaged: true,
    watchFile: plant,
    env: { STUDIO_TEST_OFFSCREEN: "1", STUDIO_PROXY_PLANT: plant },
    argv: [process.execPath, path.join(asar, "shell", "main.js"), "--user-data-dir=" + path.join(SCRATCH, "ud-wp5")],
  });
  check(!modErr && !!modRes && !modRes.openedWatch && JSON.stringify(modRes.out) === '[["no-proxy-server"]]'
    && !sh.threw && !sh.openedWatch && JSON.stringify(sh.switched) === '[["no-proxy-server"]]' && sh.regCalls.length === 3,
    "wp5 in a packaged Studio STUDIO_PROXY_PLANT is ignored even under a harness launch, the file is not opened, and the reader runs as on main: "
    + JSON.stringify({ modErr, modOut: modRes && modRes.out, modOpened: modRes && modRes.openedWatch,
      shSwitched: sh.switched, shOpened: sh.openedWatch, shReg: sh.regCalls.length }));
};

LEGS.wp6 = async () => {
  const plant = writePlant("wp6-policy", { answers: PROXY_STATES.policy.answers });
  const sh = await loadShellProxy("wp6-linux", {
    platform: "linux",
    env: { STUDIO_TEST_OFFSCREEN: "1", STUDIO_PROXY_PLANT: plant },
    argv: [process.execPath, path.join(ROOT, "shell", "main.js"), "--user-data-dir=" + path.join(SCRATCH, "ud-wp6")],
  });
  check(!sh.threw && JSON.stringify(sh.switched) === "[]" && sh.regCalls.length === 0,
    "wp6 on Linux with a planted state shell/main.js passes no proxy switch and starts reg.exe 0 times: "
    + JSON.stringify({ switched: sh.switched, reg: sh.regCalls.length, threw: sh.threw && sh.threw.message }));
};

/* The one path the standing rule turns on (the test architect, 2026-11-16): a harness that names a plant which is not there
   must stop, never fall back to the real reader, or a test run would read this machine's registry while believing it did not. */
LEGS.wp7 = async () => {
  const gone = path.join(SCRATCH, "wp7-no-such-plant.json");
  const modPath = path.join(ROOT, "src", "win-proxy-plant.cjs");
  let modErr = "", fellBack = 0, modReturned = false;
  try {
    const mod = require(modPath);
    withMarkedQuietCp(null, () => mod.startupProxySwitches({ plantFile: gone, harness: true, packaged: false,
      fallback: () => { fellBack++; return [["no-proxy-server"]]; } }));
    modReturned = true;
  } catch (e) { modErr = String(e && e.message || e); }
  const sh = await loadShellProxy("wp7-shell", {
    env: { STUDIO_TEST_OFFSCREEN: "1", STUDIO_PROXY_PLANT: gone },
    argv: [process.execPath, path.join(ROOT, "shell", "main.js"), "--user-data-dir=" + path.join(SCRATCH, "ud-wp7")],
  });
  const shellErr = sh.threw ? String(sh.threw.message || sh.threw) : "";
  check(!fs.existsSync(gone) && !modReturned && /ENOENT/.test(modErr) && fellBack === 0
    && /ENOENT/.test(shellErr) && sh.regCalls.length === 0,
    "wp7 a named plant that does not exist stops the launch: the read throws, the fallback is not called and reg.exe is not started: "
    + JSON.stringify({ modErr: modErr.slice(0, 60), fellBack, shellErr: shellErr.slice(0, 60), shellReg: sh.regCalls.length }));
};

for (const name of Object.keys(LEGS)) {
  if (ONLY && name !== ONLY) continue;
  try { await LEGS[name](); }
  catch (e) { failed++; asserted++; process.stderr.write("  FAIL " + name + " threw: " + String(e && e.stack || e) + "\n"); }
}

const PLANTS = [
  { mark: "proxy-plant-packaged", leg: "wp5", rel: "src/win-proxy-plant.cjs", line: "  const isPackaged = false;" },
  { mark: "proxy-plant-harness", leg: "wp4", rel: "src/win-proxy-plant.cjs", line: "  const isHarness = true;" },
  { mark: "proxy-plant-unanswered", leg: "wp3", rel: "src/win-proxy-plant.cjs", line: "  /* unanswered query swallowed */" },
  { mark: "proxy-plant-unread", leg: "wp7", rel: "src/win-proxy-plant.cjs",
    line: "  let answers; try { answers = readPlantedAnswers(plantFile); } catch (e) { return typeof o.fallback === \"function\" ? o.fallback() : require(\"../engine/pinned/shell/win-proxy.cjs\").windowsProxySwitches(); }" },
];
if (!ONLY) copyPlants({ root: ROOT, self: SELF, label: "win-proxy-plant", onlyVar: "WIN_PROXY_PLANT_ONLY", plants: PLANTS, check, skip, timeout: 120000 });

fs.rmSync(SCRATCH, { recursive: true, force: true });
process.stdout.write("win-proxy-plant: " + (asserted - failed) + " of " + asserted + " held\n");
process.exit(Math.min(failed, 63));
