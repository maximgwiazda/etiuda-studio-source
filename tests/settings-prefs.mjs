/* SETTINGS S3: RESET DEFAULTS, ANIMATIONS, DENSITY, OPENING A CATALOG, REOPEN LAST CATALOGS.
 *
 * gate-kind: node
 *
 *     node tests/settings-prefs.mjs [--keep]
 *
 * Proves the six legs of run S3 (office brief settings-965-967-969-plan-2026-11-08.md):
 *   sp1  each pref survives a restart (stored in studio.json, read back on restart)
 *   sp2  Reset defaults clears exactly the whitelist and never tabs, tour, recent, key or licence
 *   sp3  Animations off stills every site the system's reduced motion stills
 *   sp4  Compact shortens table rows
 *   sp5  "This tab" replaces the catalog in front
 *   sp6  Reopen off starts on the Library
 *
 * Node only, no Electron window.
 */
import "./reg-stand-on.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import Module, { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as S from "../src/studio.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { loadPage } from "./page-stand-in.mjs";
import { useRunKey, startsAtSignIn, studioOn } from "./login-run-stub.mjs";
import OffWindows from "./off-windows.cjs";
import { seatEnv } from "./seated.mjs";

let labApp = null;
const nodeRequire = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const MAIN = path.join(ROOT, "shell", "main.js");
const UI = path.join(ROOT, "ui", "index.html");
const SCRATCH = path.join(ROOT, "scratch", "settings-prefs");

let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}
/* A skip is not a pass, and it is said and counted. Only sp2f uses it, off Windows (tests/off-windows.cjs). */
function skip(line) { skipped++; process.stdout.write("  SKIP  " + line + "\n"); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const wire = (p) => Promise.resolve(p)
  .then(v => JSON.parse(JSON.stringify(Object.assign({ error: null }, v))))
  .catch(e => ({ error: e && e.message ? e.message : String(e), said: (e && e.said) || null }));

const TEST_VAULT = {
  available: () => true,
  seal: (b) => Buffer.from("sealed:" + Buffer.from(b).toString("base64")),
  open: (b) => {
    const s = Buffer.from(b).toString("utf8");
    if (!s.startsWith("sealed:")) throw new Error("bad seal");
    return Buffer.from(s.slice(7), "base64");
  },
};

async function loadShellLab(ud) {
  const got = { handlers: {}, windows: [] };

  class Win {
    constructor() {
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
    on() {}
    once() {}
    isDestroyed() { return false; }
    isMaximized() { return false; }
    isMinimized() { return false; }
    close() {}
    focus() {}
    restore() {}
    loadFile() {}
    show() {}
    showInactive() {}
    setMinimumSize() {}
  }

  const electron = {
    app: {
      commandLine: { appendSwitch() {}, hasSwitch: () => false, removeSwitch() {} },
      getPath: (name) => (name === "userData" ? ud : (name === "documents" ? path.join(ud, "docs") : path.join(ud, name))),
      getVersion: () => "0.1.0",
      getLocale: () => "en-GB",
      requestSingleInstanceLock: () => true,
      isPackaged: false,
      whenReady: () => Promise.resolve(),
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
    safeStorage: TEST_VAULT,
    screen: { getAllDisplays: () => [], getPrimaryDisplay: () => ({}), on() {}, removeListener() {} },
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
    shell: {
      openPath: () => Promise.resolve(""),
      trashItem: async () => {},
    },
    ipcMain: { handle: (ch, fn) => { got.handlers[ch] = fn; }, on() {} },
    net: { fetch: () => Promise.reject(new Error("network forbidden")) },
  };
  useRunKey(electron.app); /* the Run key as Electron keeps it, by name and arguments */
  labApp = electron.app; /* the login-item leg sets packaged and the stored state on it */

  const thread = { call: async () => ({}) };
  const quiet = { on() {}, unref() {}, kill() {}, pid: 0, stdout: { on() {} }, stderr: { on() {} }, stdin: { end() {}, write() {} } };
  const cp = {
    execFileSync: () => "",
    execSync: () => "",
    spawnSync: () => ({ status: 0, stdout: "", stderr: "" }),
    execFile: () => quiet,
    spawn: () => quiet,
    exec: () => quiet,
    fork: () => quiet,
  };

  const env = {
    STUDIO_NO_PROXY_SERVER: "off",
    STUDIO_TEST_OFFSCREEN: "1",
    STUDIO_PROJECTS: path.join(ud, "projects"),
  };
  /* A Studio that works, as a lead's does (the gate refuses a closed channel of one that does not). */
  Object.assign(env, await seatEnv(ud, true, env), env);
  const was = {};
  for (const k of Object.keys(env)) { was[k] = process.env[k]; process.env[k] = env[k]; }

  delete nodeRequire.cache[nodeRequire.resolve(path.join(ROOT, "src", "wire.cjs"))];
  const load = Module._load, write = process.stderr.write, before = new Set(Object.keys(nodeRequire.cache));

  Module._load = function (req) {
    if (req === "electron") return electron;
    if (req === "node:child_process" || req === "child_process") return cp;
    if (/studio-thread\.cjs$/.test(req)) return thread;
    return load.apply(this, arguments);
  };

  const dropCache = () => {
    delete nodeRequire.cache[MAIN];
    for (const k of Object.keys(nodeRequire.cache)) if (!before.has(k)) delete nodeRequire.cache[k];
  };

  const restore = () => {
    Module._load = load;
    process.stderr.write = write;
    dropCache();
    for (const k of Object.keys(was)) {
      if (was[k] === undefined) delete process.env[k];
      else process.env[k] = was[k];
    }
  };

  try {
    dropCache();
    nodeRequire(MAIN);
    const wire = nodeRequire(path.join(ROOT, "src", "wire.cjs"));
    wire.relayConnect = () => null;
  } catch (e) {
    restore();
    throw e;
  }

  got.event = { senderFrame: { parent: null, url: pathToFileURL(UI).href }, sender: got.windows[0] && got.windows[0].webContents };
  got.ask = (ch, ...a) => {
    if (!got.handlers[ch]) throw new Error("no handler for " + ch);
    return got.handlers[ch](got.event, ...a);
  };
  got.restore = restore;
  return got;
}

function pageOver(root, opts = {}) {
  const calls = [], prefsWritten = [];
  let prefsStored = Object.assign({
    animations: true,
    density: "comfortable",
    openCatalog: "new",
    reopenTabs: true,
  }, opts.initialPrefs || {});

  const api = {
    newProject: (n, l, o) => wire(S.newProject(root, n, l, o)),
    open: (d) => wire(S.openProject(d)),
    projects: () => wire(S.listProjects(root)),
    proposals: (d) => wire(S.listProposals(d)),
    host: async () => ({
      version: "0.1.0",
      theme: "system",
      uiLang: opts.uiLang || "en",
      tour: { offered: true },
      tabs: opts.tabs || { open: [], away: [], on: "" },
      prefs: Object.assign({}, prefsStored),
      signing: { keyId: "test" },
      langs: S.builtLangs(),
    }),
    tabs: () => Promise.resolve({ error: null }),
    signing: () => Promise.resolve({ error: null, signing: { keyId: "test", kept: "os" } }),
    licence: () => Promise.resolve({ error: null, licence: { status: "none" } }),
    prefs: async (patch) => {
      calls.push("prefs");
      prefsWritten.push(patch);
      if (opts.failPrefs) {
        return {
          error: "Studio's settings file could not be written, so this change was not saved.",
          said: { frame: "Studio's settings file could not be written, so this change was not saved.", vars: {} }
        };
      }
      Object.assign(prefsStored, patch);
      return { error: null, prefs: Object.assign({}, prefsStored) };
    },
    resetDefaults: async () => {
      calls.push("resetDefaults");
      prefsStored = { animations: true, density: "comfortable", openCatalog: "new", reopenTabs: true };
      return { error: null, reset: true, theme: "system", lang: "en", prefs: prefsStored };
    },
  };

  const home = loadPage({ api, uiLang: opts.uiLang || "en" });
  const P = home.page;
  const rootCls = new Set();
  home.doc.documentElement.classList = {
    add: (...c) => c.forEach((x) => rootCls.add(x)),
    remove: (...c) => c.forEach((x) => rootCls.delete(x)),
    toggle: (c, on) => {
      const want = on === undefined ? !rootCls.has(c) : !!on;
      if (want) rootCls.add(c); else rootCls.delete(c);
      return want;
    },
    contains: (c) => rootCls.has(c),
  };
  P.S.host = {
    tour: { offered: true },
    langs: S.builtLangs(),
    version: "0.1.0",
    signing: { keyId: "test" },
    prefs: Object.assign({}, prefsStored),
    tabs: opts.tabs || { open: [], away: [], on: "" },
  };
  P.S.prefs = Object.assign({}, prefsStored);

  const el = (attrs) => ({ getAttribute: (k) => (attrs[k] == null ? null : attrs[k]) });
  async function press(act, attrs) {
    if (!P.ACTS[act]) return false;
    try { await P.ACTS[act](el(Object.assign({ "data-act": act }, attrs || {}))); } catch (e) { P.__threw = e; return false; }
    await sleep(20);
    return true;
  }

  return { P, home, api, press, calls, prefsWritten, getPrefs: () => prefsStored };
}

async function main(argv) {
  clearScratch(SCRATCH);
  const ud = path.join(SCRATCH, "userdata");
  const root = path.join(SCRATCH, "projects");
  fs.mkdirSync(ud, { recursive: true });
  fs.mkdirSync(root, { recursive: true });

  /* ---- 1. EACH PREF SURVIVES A RESTART (shell studio:prefs handler & store) ---- */
  {
    const lab = await loadShellLab(ud);
    try {
      const initial = await lab.ask("studio:host");
      check(initial && initial.prefs && typeof initial.prefs === "object",
        "sp1a host answer at boot returns prefs object: " + JSON.stringify(initial && initial.prefs));

      const updated = await lab.ask("studio:prefs", {
        animations: false,
        density: "compact",
        openCatalog: "this",
        reopenTabs: false,
      });
      check(updated && updated.prefs && updated.prefs.animations === false
            && updated.prefs.density === "compact" && updated.prefs.openCatalog === "this"
            && updated.prefs.reopenTabs === false,
        "sp1b studio:prefs updates all four preferences: " + JSON.stringify(updated && updated.prefs));
    } finally {
      lab.restore();
    }

    /* Restart shell on same userdata to prove persistence */
    const lab2 = await loadShellLab(ud);
    try {
      const reboot = await lab2.ask("studio:host");
      check(reboot && reboot.prefs && reboot.prefs.animations === false
            && reboot.prefs.density === "compact" && reboot.prefs.openCatalog === "this"
            && reboot.prefs.reopenTabs === false,
        "sp1c prefs survive restart across shell instances: " + JSON.stringify(reboot && reboot.prefs));
    } finally {
      lab2.restore();
    }

    /* When writeStore fails, studio:prefs refuses and stored value is unchanged */
    const lab3 = await loadShellLab(ud);
    try {
      const before = await lab3.ask("studio:host");
      const Saved = nodeRequire(path.join(ROOT, "src", "saved-format.cjs"));
      const origWriteSaved = Saved.writeSaved;
      Saved.writeSaved = () => false;
      let refused;
      try {
        refused = await lab3.ask("studio:prefs", { animations: true, density: "comfortable" });
      } finally {
        Saved.writeSaved = origWriteSaved;
      }
      check(refused && refused.error && refused.said && refused.said.frame === "Studio's settings file could not be written, so this change was not saved.",
        "sp1d with writeStore made to fail, studio:prefs refuses: " + JSON.stringify(refused));

      const after = await lab3.ask("studio:host");
      check(after && after.prefs && after.prefs.animations === before.prefs.animations
            && after.prefs.density === before.prefs.density,
        "sp1e with writeStore made to fail, stored prefs are unchanged: " + JSON.stringify(after && after.prefs));
    } finally {
      lab3.restore();
    }
  }

  /* ---- 2. RESET DEFAULTS CLEARS EXACTLY THE WHITELIST AND NEVER TABS, TOUR, RECENT, KEY OR LICENCE ---- */
  {
    const lab = await loadShellLab(ud);
    try {
      const storeFile = path.join(ud, "studio.json");
      const savedDoc = {
        format: 1,
        writtenBy: "0.1.0",
        /* Whitelist items that should be cleared */
        theme: "dark",
        lang: "pl",
        animations: false,
        density: "compact",
        openCatalog: "this",
        reopenTabs: false,
        quitOnClose: true,
        trayNotes: false,
        trayBadge: false,
        notifyProposals: false,
        notifyRequests: false,
        /* Protected items that MUST NOT be cleared */
        tabs: [{ dir: "C:\\proj1", name: "Project 1", rev: 1 }],
        tour: { offered: true, taken: true, at: 3 },
        recentCleared: "2026-11-08T12:00:00.000Z",
        keyMade: { pub: "abc", relay: "def" },
        keyBackup: { keyId: "test-id", made: "2026-11-08", where: "C:\\backup" },
        keyNudge: "nudge-id",
        licence: { status: "none", trialFrom: "2026-11-01" },
        root: "C:\\custom-root",
      };
      fs.writeFileSync(storeFile, JSON.stringify(savedDoc, null, 2), "utf8");

      const res = await lab.ask("studio:reset-defaults");
      check(res && res.reset === true, "sp2a studio:reset-defaults succeeds");

      const after = JSON.parse(fs.readFileSync(storeFile, "utf8"));
      check(after.theme === undefined && after.lang === undefined
            && after.animations === undefined && after.density === undefined
            && after.openCatalog === undefined && after.reopenTabs === undefined
            && after.prefs === undefined
            && after.quitOnClose === undefined && after.trayNotes === undefined
            && after.trayBadge === undefined && after.notifyProposals === undefined
            && after.notifyRequests === undefined,
        "sp2b Reset defaults clears exactly the settings whitelist: theme/lang/prefs/tray deleted");
      check(res.quitOnClose === false, "sp2d res.quitOnClose is false");
      /* The login item is written only by a packaged Studio, and only when it differs (the test architect's floor). It stands
         aside off Windows (Claude gamma's Linux sweep, 2026-11-14): Studio keeps no start-at-login entry there. A Linux autostart
         leg waits on a ruling. */
      const sp2fAside = OffWindows.standAside("sp2f", "Studio keeps no start-at-login entry off Windows (the Run key is Windows'), so there is no login item to write or clear");
      if (sp2fAside) skip(sp2fAside);
      else {
        const A = labApp;
        const fresh = (on) => { A._login = { run: {}, calls: 0 }; if (on) studioOn(A); };
        A.isPackaged = false; fresh(true);
        await lab.ask("studio:reset-defaults");
        const unpackaged = A._login.calls;
        A.isPackaged = true; fresh(false);
        await lab.ask("studio:reset-defaults");
        const same = A._login.calls;
        fresh(true);
        await lab.ask("studio:reset-defaults");
        const changed = A._login.calls, still = startsAtSignIn(A);
        A.isPackaged = false; fresh(false);
        check(unpackaged === 0 && same === 0 && changed === 1 && still === false,
          "sp2f an unpackaged Studio's reset writes no login item, nor a packaged one already off; a packaged one that is on is switched off once: "
          + JSON.stringify({ unpackaged, same, changed, still }));
      }
      check(res.notifications && res.notifications.trayNotes === true && res.notifications.notifyProposals === true,
        "sp2e res.notifications reset to defaults (all true)");

      check(Array.isArray(after.tabs) && after.tabs.length === 1
            && after.tour && after.tour.taken === true
            && after.recentCleared === "2026-11-08T12:00:00.000Z"
            && after.keyMade && after.keyMade.pub === "abc"
            && after.keyBackup && after.keyBackup.keyId === "test-id"
            && after.keyNudge === "nudge-id"
            && after.licence && after.licence.trialFrom === "2026-11-01"
            && after.root === "C:\\custom-root",
        "sp2c Reset defaults preserves tabs, tour, recent, key, licence, and root: " + JSON.stringify({
          hasTabs: !!after.tabs, hasTour: !!after.tour, hasRecent: !!after.recentCleared,
          hasKey: !!after.keyMade, hasLicence: !!after.licence
        }));
    } finally {
      lab.restore();
    }
  }

  /* ---- 3. ANIMATIONS OFF STILLS EVERY SITE THE SYSTEM'S REDUCED MOTION STILLS ---- */
  {
    const { P, home, press } = pageOver(root, { initialPrefs: { animations: true } });
    await press("settings");
    await press("sx-sec", { "data-v": "appearance" });

    check(!home.doc.documentElement.classList.contains("e-still"),
      "sp3a document element has no e-still class when animations are on");

    await press("set-animations", { "data-v": "no" });
    check(home.doc.documentElement.classList.contains("e-still") && P.S.prefs && P.S.prefs.animations === false,
      "sp3b turning animations off sets e-still on document element: " + home.doc.documentElement.className);

    /* When prefs write fails, page shows refusal and pref control reverts to stored value */
    const pageFail = pageOver(root, { initialPrefs: { animations: true }, failPrefs: true });
    await pageFail.press("settings");
    await pageFail.press("sx-sec", { "data-v": "appearance" });
    await pageFail.press("set-animations", { "data-v": "no" });
    check(pageFail.P.S.err && (pageFail.P.S.err.frame === "Studio's settings file could not be written, so this change was not saved." || pageFail.P.S.err === "Studio's settings file could not be written, so this change was not saved."),
      "sp3c page shows refusal where a pref was changed on failed write: " + JSON.stringify(pageFail.P.S.err));
    check(!pageFail.home.doc.documentElement.classList.contains("e-still") && pageFail.P.S.prefs.animations === true,
      "sp3d pref control reverts to stored value when write fails: animations=" + pageFail.P.S.prefs.animations);
  }

  /* ---- 4. COMPACT SHORTENS TABLE ROWS ---- */
  {
    const { P, home, press } = pageOver(root, { initialPrefs: { density: "comfortable" } });
    await press("settings");
    await press("sx-sec", { "data-v": "layout" });

    check(home.doc.documentElement.getAttribute("data-density") !== "compact"
          && !home.doc.documentElement.classList.contains("density-compact"),
      "sp4a document element starts without compact density");

    await press("set-density", { "data-v": "compact" });
    check(home.doc.documentElement.getAttribute("data-density") === "compact"
          && home.doc.documentElement.classList.contains("density-compact")
          && P.S.prefs && P.S.prefs.density === "compact",
      "sp4b turning density to compact applies density-compact / data-density=compact");

    const indexHtml = fs.readFileSync(path.join(ROOT, "ui", "index.html"), "utf8");
    check(indexHtml.includes("density-compact") || indexHtml.includes("[data-density="),
      "sp4c ui/index.html defines styles for compact density");
  }

  /* ---- 5. 'THIS TAB' REPLACES THE CATALOG IN FRONT ---- */
  {
    const L = [{ code: "en" }, { code: "pl" }];
    const p1 = await S.newProject(root, "Catalog One", L);
    const p2 = await S.newProject(root, "Catalog Two", L);

    /* Case A: In a new tab (default) */
    const pageNew = pageOver(root, { initialPrefs: { openCatalog: "new" } });
    pageNew.P.S.projects = S.listProjects(root).projects;
    await pageNew.press("open", { "data-dir": p1.dir });
    check(pageNew.P.S.tabs.length === 1 && pageNew.P.S.tabs[0].dir === p1.dir,
      "sp5a first catalog opens in a tab: " + pageNew.P.S.tabs.map(t => t.name).join(", "));
    await pageNew.press("open", { "data-dir": p2.dir });
    check(pageNew.P.S.tabs.length === 2 && pageNew.P.S.tabs[1].dir === p2.dir,
      "sp5b under 'new tab', second catalog adds a second tab: " + pageNew.P.S.tabs.map(t => t.name).join(", "));

    /* Case B: In this tab */
    const pageThis = pageOver(root, { initialPrefs: { openCatalog: "this" } });
    pageThis.P.S.projects = S.listProjects(root).projects;
    await pageThis.press("open", { "data-dir": p1.dir });
    check(pageThis.P.S.tabs.length === 1 && pageThis.P.S.tabs[0].dir === p1.dir,
      "sp5c catalog One opens in front tab");
    await pageThis.press("open", { "data-dir": p2.dir });
    check(pageThis.P.S.tabs.length === 1 && pageThis.P.S.tabs[0].dir === p2.dir && pageThis.P.S.open.dir === p2.dir,
      "sp5d under 'this tab', opening catalog Two replaces catalog One in front: " + pageThis.P.S.tabs.map(t => t.name).join(", "));
  }

  /* ---- 6. REOPEN OFF STARTS ON THE LIBRARY ---- */
  {
    const L = [{ code: "en" }];
    const p1 = await S.newProject(root, "Kept Catalog", L);
    const keptTabs = { open: [{ dir: p1.dir, name: "Kept Catalog", rev: 1 }], on: p1.dir, away: [] };

    /* When reopenTabs is true, restoreTabs opens the kept catalog */
    const pageOn = pageOver(root, { initialPrefs: { reopenTabs: true }, tabs: keptTabs });
    pageOn.P.S.projects = S.listProjects(root).projects;
    const restoredOn = await pageOn.P.restoreTabs(keptTabs);
    check(restoredOn === true && pageOn.P.S.screen === "project" && pageOn.P.S.tabs.length === 1,
      "sp6a with Reopen on, launch restores tabs and lands on catalog: " + pageOn.P.S.screen);

    /* When reopenTabs is false, starts on Library */
    const pageOff = pageOver(root, { initialPrefs: { reopenTabs: false }, tabs: keptTabs });
    pageOff.P.S.projects = S.listProjects(root).projects;
    const restoredOff = await pageOff.P.restoreTabs(keptTabs);
    check(restoredOff === false && pageOff.P.S.screen === "projects" && pageOff.P.S.tabs.length === 0,
      "sp6b with Reopen off, launch starts on the Library with no tabs: " + pageOff.P.S.screen);
  }

  /* ---- 7. SETTINGS DOES NOT CLEAR COVER BEFORE LEAVE (Finding 2) ---- */
  {
    const L = [{ code: "en" }];
    const p1 = await S.newProject(root, "Cover Keep Catalog", L);
    const page = pageOver(root, {});
    page.P.S.projects = S.listProjects(root).projects;
    await page.press("open", { "data-dir": p1.dir });

    // Open a tab cover (card) and set typed content
    page.P.S.cover = "card";
    const dlg = page.home.doc.querySelector("#dlg");
    if (dlg) {
      dlg.querySelectorAll = () => [{ id: "cardTitle", value: "My Typed Card Title" }];
    }
    await page.press("settings");

    const tab = page.P.S.tabs.find((t) => t.dir === p1.dir);
    const keptCover = tab && tab.place && tab.place.cover;
    check(page.P.S.screen === "settings", "sp7a navigating via settings act opens settings screen");
    check(!!keptCover && keptCover.kind === "card" && keptCover.typed && keptCover.typed.cardTitle === "My Typed Card Title",
      "sp7b settings does not clear cover before leave: typed pop-up text parked in tab place");
  }

  process.stdout.write("\nsettings-prefs  " + asserted + " assertion(s), " + (skipped ? skipped + " skipped, " : "") + failed + " failure(s)\n");
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "settings-prefs");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch((e) => {
  process.stderr.write("settings-prefs  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
