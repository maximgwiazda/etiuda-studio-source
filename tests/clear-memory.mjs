/* CLEAR LOCAL MEMORY AND REMOVE THE SIGNING KEY (board 960).
 *
 * gate-kind: node
 *
 *     node tests/clear-memory.mjs
 *
 * Drives the shell's clear and remove through the handlers on a sandbox userData (never the real profile):
 * what goes goes; each named thing that stays is byte-identical; Undo restores; a refused flush clears nothing;
 * a key removal under way with a handover is refused; and the page's cover shows the right body for each backup state.
 */
import "./reg-stand-on.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import Module, { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadPage } from "./page-stand-in.mjs";
import * as Sign from "../src/sign.mjs";
import * as Saved from "../src/saved-format.cjs";
import { seatEnv } from "./seated.mjs";

const nodeRequire = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const MAIN = path.join(ROOT, "shell", "main.js");
const UI = path.join(ROOT, "ui", "index.html");
const APP = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

const TEST_VAULT = {
  available: () => true,
  seal: (b) => Buffer.from("sealed:" + Buffer.from(b).toString("base64")),
  open: (b) => {
    const s = Buffer.from(b).toString("utf8");
    if (!s.startsWith("sealed:")) throw new Error("bad seal");
    return Buffer.from(s.slice(7), "base64");
  },
};

async function loadShellLab(ud, opts = {}) {
  const got = { handlers: {}, windows: [], said: [], trashed: [] };

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
      trashItem: async (p) => {
        got.trashed.push(p);
        if (opts.trashFails) throw new Error("trashItem failed");
        if (opts.trashLeavesFile) return;
        try { fs.unlinkSync(p); } catch {}
      },
    },
    ipcMain: { handle: (ch, fn) => { got.handlers[ch] = fn; }, on() {} },
    net: { fetch: () => Promise.reject(new Error("network forbidden")) },
  };

  const thread = {
    call: async (verb, ...a) => {
      if (opts.thread) return opts.thread(verb, ...a);
      return {};
    },
  };

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
  /* A Studio that works, as a lead's does (the gate refuses key-remove of one that does not); a licence or a service state the leg wrote stays as it is. */
  Object.assign(env, await seatEnv(ud, true, env), env);
  const was = {};
  for (const k of Object.keys(env)) { was[k] = process.env[k]; process.env[k] = env[k]; }

  delete nodeRequire.cache[nodeRequire.resolve(path.join(ROOT, "src", "wire.cjs"))];
  const load = Module._load, write = process.stderr.write, before = new Set(Object.keys(nodeRequire.cache));
  process.stderr.write = (chunk, ...rest) => {
    got.said.push(Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk));
    return write.call(process.stderr, chunk, ...rest);
  };

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

async function main() {
  const scratchBase = path.join(ROOT, "scratch", "test-clear-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6));
  fs.mkdirSync(scratchBase, { recursive: true });

  try {
    /* ---- 1. CLEAR LOCAL MEMORY: WHAT GOES GOES, WHAT STAYS IS BYTE-IDENTICAL -------------------- */
    const ud1 = path.join(scratchBase, "ud1");
    fs.mkdirSync(ud1, { recursive: true });
    fs.mkdirSync(path.join(ud1, "Dictionaries"), { recursive: true });

    const initialStore = {
      theme: "dark",
      lang: "pl",
      animations: false,
      density: "compact",
      openCatalog: "this",
      reopenTabs: false,
      quitOnClose: true,
      trayNotes: false,
      shortcuts: { "zoom-in": { chord: "Ctrl+=" } },
      tour: { offered: true, taken: true, at: 2 },
      tabs: [{ dir: "p1", open: true }],
      keyNudge: "key-123",
      root: path.join(ud1, "projects"),
      planted: "starter",
      sample: path.join(ud1, "projects", "sample"),
      sampleId: "sample-uuid-1",
      keyMade: { pub: "pub-lead-1", relay: ["rt-1"] },
      keyBackup: { keyId: "key-123", made: "2026-11-01", where: "C:\\backup" },
      freshBox: [{ team: "t1", desk: "d1" }],
      oldSigningKeys: [{ file: "old.json", keyId: "key-old", public: "pub-old" }],
      trialFrom: "2026-10-15",
    };
    Saved.writeSaved(path.join(ud1, "studio.json"), initialStore, (f, t) => fs.writeFileSync(f, t, "utf8"), "0.1.0");

    const stayingFiles = {
      "teams.json": JSON.stringify({ teams: [{ id: "t1", name: "Alpha Team" }] }, null, 2),
      "signing-key.json": JSON.stringify({ keyId: "key-123", public: "pub-lead-1", kept: "os", doc: { private: "c2VjcmV0" } }, null, 2),
      "etiuda-studio-license.js": "/* licence file */\nmodule.exports = { status: 'active' };\n",
      "licence-service.json": JSON.stringify({ lastCheck: 1000 }, null, 2),
      "catalog-landed.json": JSON.stringify({ landed: ["c1", "c2"] }, null, 2),
      "relay-grant.json": JSON.stringify({ grant: "g1", until: "2026-12-01" }, null, 2),
      [path.join("Dictionaries", "pl-PL.dic")]: "dictionary words\n",
    };
    for (const [rel, content] of Object.entries(stayingFiles)) {
      const abs = path.join(ud1, rel);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, content, "utf8");
    }

    const hashesBefore = {};
    for (const rel of Object.keys(stayingFiles)) hashesBefore[rel] = sha256(path.join(ud1, rel));

    const lab1 = await loadShellLab(ud1);
    let clearRes = null, undoRes = null, refusedUndo = null;
    try {
      clearRes = await lab1.ask("studio:clear-local-memory");

      check(clearRes && clearRes.cleared === true, "1a clearLocalMemory answers successfully");

      const afterStore = Saved.readSaved(path.join(ud1, "studio.json")).doc;
      check(afterStore.theme === undefined, "1b theme goes");
      check(afterStore.lang === undefined, "1c lang goes");
      check(afterStore.tour === undefined, "1d tour goes");
      check(afterStore.tabs === undefined, "1e tabs goes");
      check(afterStore.keyNudge === undefined, "1f keyNudge goes");
      check(afterStore.animations === undefined, "1h1 animations goes");
      check(afterStore.density === undefined, "1h2 density goes");
      check(afterStore.openCatalog === undefined, "1h3 openCatalog goes");
      check(afterStore.reopenTabs === undefined, "1h4 reopenTabs goes");
      check(afterStore.quitOnClose === undefined, "1h5 quitOnClose goes");
      check(afterStore.trayNotes === undefined, "1h6 trayNotes goes");
      check(afterStore.shortcuts === undefined, "1h7 shortcuts goes");
      check(typeof afterStore.recentCleared === "string" && afterStore.recentCleared.length > 0, "1g recentCleared is stamped in store");

      const stayingKeys = ["root", "planted", "sample", "sampleId", "keyMade", "keyBackup", "freshBox", "oldSigningKeys", "trialFrom"];
      let storeStaysIdentical = true;
      for (const k of stayingKeys) {
        if (JSON.stringify(afterStore[k]) !== JSON.stringify(initialStore[k])) {
          storeStaysIdentical = false;
        }
      }
      check(storeStaysIdentical, "1h each named store key that stays is identical");

      let filesIdentical = true;
      for (const rel of Object.keys(stayingFiles)) {
        if (sha256(path.join(ud1, rel)) !== hashesBefore[rel]) {
          filesIdentical = false;
        }
      }
      check(filesIdentical, "1i each named file on disk that stays is byte-identical");

      /* ---- 2. UNDO RESTORES LOCAL MEMORY --------------------------------------------------------- */
      /* A handover begun after the clear is not the clear's to take back. */
      const between = Saved.readSaved(path.join(ud1, "studio.json")).doc;
      between.handover = { team: "t-0000000000000001", step: "after-the-clear" };
      /* A store a newer Studio wrote refuses the write: nothing is restored, and the way back stays open. */
      fs.writeFileSync(path.join(ud1, "studio.json"), JSON.stringify(Object.assign({}, between, { format: 9999 })));
      refusedUndo = await lab1.ask("studio:clear-local-memory-undo");
      fs.writeFileSync(path.join(ud1, "studio.json"), JSON.stringify(between));
      undoRes = await lab1.ask("studio:clear-local-memory-undo");
    } finally {
      lab1.restore();
    }

    check(!!refusedUndo && refusedUndo.undone !== true && !!refusedUndo.error,
      "2a2 a refused write answers no undo, with its refusal, and Undo asked again then works: " + JSON.stringify(refusedUndo));
    check(undoRes && undoRes.undone === true, "2a clearLocalMemoryUndo answers successfully");
    const restoredStore = Saved.readSaved(path.join(ud1, "studio.json")).doc;
    delete restoredStore.format;
    delete restoredStore.writtenBy;
    const handedSince = restoredStore.handover;
    delete restoredStore.handover;
    const sorted = (o) => JSON.stringify(Object.keys(o).sort().map((k) => [k, o[k]]));
    const before2b = Object.assign({}, initialStore);
    delete before2b.handover;
    check(sorted(restoredStore) === sorted(before2b), "2b Undo restores what the clear took, every other key as it was");
    check(!!handedSince && handedSince.step === "after-the-clear", "2b2 and a handover begun after the clear stays: " + JSON.stringify(handedSince));

    /* ---- 3. REFUSED FLUSH CLEARS NOTHING ------------------------------------------------------- */
    let flushed = false, saveAttempted = false;
    const mockApi = {
      clearLocalMemory: async () => { flushed = true; return { cleared: true }; },
      saveCard: async () => { saveAttempted = true; return { error: "disk full", disk: true }; },
    };
    const { page: pageP } = loadPage({ api: mockApi, uiLang: "en" });
    pageP.paint();
    pageP.S.open = { dir: "proj1", counts: {}, lint: {} };
    pageP.queueSave("card1", { title: "New title" });
    check(pageP.__get("pending") != null, "3a an edit is pending in debounce");

    const doClearResult = await pageP.ACTS["do-clear"]();
    check(flushed === false, "3b a refused flush stops the clear: clearLocalMemory was not called");
    check(pageP.S.err != null, "3c the refused flush sets S.err to display the failure on screen");

    /* ---- 3d. SUCCESSFUL CLEAR AND UNDO ON PAGE ------------------------------------------------- */
    let pageCleared = false, pageUndone = false;
    const storeSnapshot = {
      theme: "dark",
      lang: "pl",
      tabs: [{ dir: "proj1", name: "Project 1", rev: 1 }],
      shortcuts: { "test": {} },
      recentCleared: null,
    };
    const mockSuccessApi = {
      clearLocalMemory: async () => {
        pageCleared = true;
        return { cleared: true, recentCleared: "2026-11-04T12:00:00.000Z", theme: "system", lang: "en" };
      },
      clearLocalMemoryUndo: async () => {
        pageUndone = true;
        return { undone: true, store: storeSnapshot };
      },
    };
    const { page: pageSuccess, sandbox } = loadPage({ api: mockSuccessApi, uiLang: "pl" });
    let resetShortcutsCalled = false, loadShortcutsCalled = false;
    if (sandbox && sandbox.StudioKeys) {
      const origReset = sandbox.StudioKeys.resetShortcuts;
      const origLoad = sandbox.StudioKeys.loadShortcuts;
      sandbox.StudioKeys.resetShortcuts = () => { resetShortcutsCalled = true; if (origReset) origReset(); };
      sandbox.StudioKeys.loadShortcuts = (s) => { loadShortcutsCalled = true; if (origLoad) origLoad(s); };
    }
    pageSuccess.S.tour = { offered: true, taken: true, at: 0 };
    pageSuccess.paint();
    pageSuccess.S.open = { dir: "proj1", counts: {}, lint: {} };
    pageSuccess.S.screen = "project";
    pageSuccess.S.tabs = [{ dir: "proj1", name: "Project 1" }];
    pageSuccess.S.theme = "dark";
    pageSuccess.S.uiLang = "pl";
    await pageSuccess.ACTS["do-clear"]();
    check(pageCleared === true, "3d successful do-clear calls clearLocalMemory");
    check(pageSuccess.S.screen === "projects", "3e do-clear lands on projects screen");
    check(pageSuccess.S.tabs.length === 0, "3f do-clear empties tabs in page state");
    check(pageSuccess.S.clearedMemory === true, "3g do-clear sets clearedMemory flag for undo bar");
    check(pageSuccess.S.recentCleared === "2026-11-04T12:00:00.000Z", "3h do-clear sets recentCleared");
    check(resetShortcutsCalled === true, "3l do-clear resets live shortcuts");

    await pageSuccess.ACTS["clear-undo"]();
    check(pageUndone === true, "3i clear-undo calls clearLocalMemoryUndo");
    check(pageSuccess.S.clearedMemory === false, "3j clear-undo resets clearedMemory flag");
    check(pageSuccess.S.tabs.length === 1 && pageSuccess.S.tabs[0].dir === "proj1", "3k clear-undo restores tabs");
    check(loadShortcutsCalled === true, "3m clear-undo reloads shortcuts");

    /* ---- 4. KEY REMOVAL WHILE HANDOVER OR MOVE IS UNDER WAY IS REFUSED -------------------------- */
    const ud4 = path.join(scratchBase, "ud4");
    fs.mkdirSync(ud4, { recursive: true });
    const keyContent = JSON.stringify({ keyId: "key-123", public: "pub-lead-1", kept: "os", doc: { private: "c2VjcmV0" } }, null, 2);
    fs.writeFileSync(path.join(ud4, "signing-key.json"), keyContent, "utf8");

    Saved.writeSaved(path.join(ud4, "studio.json"), { handover: { dir: "p1" } }, (f, t) => fs.writeFileSync(f, t, "utf8"), "0.1.0");
    const lab4a = await loadShellLab(ud4);
    let handoverRefused = false, handoverMsg = "";
    try {
      const res = await lab4a.ask("studio:key-remove");
      if (res && res.error) { handoverRefused = true; handoverMsg = res.error; }
    } catch (e) {
      handoverRefused = true;
      handoverMsg = e.message || String(e);
    } finally {
      lab4a.restore();
    }
    check(handoverRefused && handoverMsg.indexOf("once the move or handover already under way ends") >= 0,
      "4a key removal is refused while handover is under way: " + handoverMsg);
    check(fs.existsSync(path.join(ud4, "signing-key.json")), "4b the key file stays in place when refused");

    /* A leftover move record from an older Studio is removed at start with one line in the log and nothing else done. */
    const threadCalls = [];
    Saved.writeSaved(path.join(ud4, "studio.json"), { move: { team: "t-0000000000000001", step: "(i)" }, theme: "dark" },
      (f, t) => fs.writeFileSync(f, t, "utf8"), "0.1.0");
    const lab4b = await loadShellLab(ud4, { thread: async (v) => { threadCalls.push(v); return {}; } });
    try {
      await new Promise((r) => setTimeout(r, 50));
    } finally {
      lab4b.restore();
    }
    const afterLeftover = Saved.readSaved(path.join(ud4, "studio.json")).doc;
    const moveLogs = lab4b.said.filter((s) => /leftover move/i.test(s));
    check(!("move" in afterLeftover) && afterLeftover.theme === "dark" && moveLogs.length === 1 && threadCalls.length === 0,
      "4c a leftover move record is removed at start with one log line and nothing else done: "
      + JSON.stringify({ hasMove: "move" in afterLeftover, theme: afterLeftover.theme, logs: moveLogs.length, threadCalls }));

    /* ---- 5. SUCCESSFUL KEY REMOVAL SENDS KEY TO RECYCLE BIN ----------------------------------- */
    Saved.writeSaved(path.join(ud4, "studio.json"), {}, (f, t) => fs.writeFileSync(f, t, "utf8"), "0.1.0");
    const lab5 = await loadShellLab(ud4);
    let removeRes = null;
    try {
      removeRes = await lab5.ask("studio:key-remove");
    } finally {
      lab5.restore();
    }
    check(removeRes && removeRes.removed === true, "5a key removal succeeds when no handover/move");
    check(lab5.trashed.length === 1 && path.basename(lab5.trashed[0]) === "signing-key.json",
      "5b trashItem was called on signing-key.json: " + lab5.trashed[0]);
    check(!fs.existsSync(path.join(ud4, "signing-key.json")), "5c signing-key.json is removed from userData");

    /* ---- 6. REFUSED TRASH LEAVES KEY AND SAYS SO ---------------------------------------------- */
    const ud6 = path.join(scratchBase, "ud6");
    fs.mkdirSync(ud6, { recursive: true });
    fs.writeFileSync(path.join(ud6, "signing-key.json"), keyContent, "utf8");
    Saved.writeSaved(path.join(ud6, "studio.json"), {}, (f, t) => fs.writeFileSync(f, t, "utf8"), "0.1.0");

    const lab6 = await loadShellLab(ud6, { trashFails: true });
    let trashFailedRes = null;
    try {
      trashFailedRes = await lab6.ask("studio:key-remove");
    } catch (e) {
      trashFailedRes = { error: e.message, removed: false };
    } finally {
      lab6.restore();
    }
    check(trashFailedRes && trashFailedRes.removed === false && trashFailedRes.error
      && trashFailedRes.error.indexOf("could not be moved to the Recycle Bin") >= 0,
      "6a refused trash says so: " + JSON.stringify(trashFailedRes && trashFailedRes.error));
    check(fs.existsSync(path.join(ud6, "signing-key.json")), "6b refused trash leaves the key file intact");

    /* ---- 7. PAGE COVERS FOR EACH BACKUP STATE ------------------------------------------------- */
    const pageLabEn = loadPage({ api: {}, uiLang: "en" }).page;
    pageLabEn.S.host = { signing: { keyId: "key-123", leads: true, backup: { where: "D:\\backup", made: "2026-11-01" } } };
    pageLabEn.S.cover = "key-remove";
    const coverWithBackup = pageLabEn.keyRemoveCoverHtml ? pageLabEn.keyRemoveCoverHtml() : "";
    check(coverWithBackup.indexOf("A backup copy of the key has been made: restoring it from the Menu, under Settings, then Signing key, brings all of that back.") >= 0,
      "7a backup known shows the restoring instruction in EN");
    check(coverWithBackup.indexOf('id="keyRemoveCancel"') >= 0, "7b Cancel button has id keyRemoveCancel for default focus");

    pageLabEn.S.host = { signing: { keyId: "key-123", leads: true, backup: null } };
    const coverNoBackup = pageLabEn.keyRemoveCoverHtml ? pageLabEn.keyRemoveCoverHtml() : "";
    check(coverNoBackup.indexOf("Studio knows of no backup copy, so once the Recycle Bin is emptied the key is gone for good. Making one first, from the Menu, under Settings, then Signing key, keeps the way back open.") >= 0,
      "7c no backup known shows the keep the way back open instruction in EN");
    check(coverNoBackup.indexOf("A new key works too, and every desk is let in again") < 0,
      "7d no backup known omits the false sentence 'A new key works too, and every desk is let in again'");

    /* A lead with no team reads no word of a team, and the licence sentence stands in every body. */
    pageLabEn.S.host = { signing: { keyId: "key-123", leads: false, backup: null } };
    const coverNoTeam = pageLabEn.keyRemoveCoverHtml();
    pageLabEn.S.host = { signing: { keyId: "key-123", leads: false, backup: { keyId: "key-123" } } };
    const coverNoTeamB = pageLabEn.keyRemoveCoverHtml();
    const LIC = "A licence held here is tied to this key; with a new key, signing in again moves it there.";
    check(!/team/i.test(coverNoTeam) && !/team/i.test(coverNoTeamB) && coverNoTeamB.indexOf("brings it back.") >= 0
          && [coverNoTeam, coverNoTeamB, coverWithBackup, coverNoBackup].every((c) => c.indexOf(LIC) >= 0),
      "7g no team: neither body names one, and all four carry the licence sentence");

    const pageLabPl = loadPage({ api: {}, uiLang: "pl" }).page;
    pageLabPl.S.host = { signing: { keyId: "key-123", leads: true, backup: { where: "D:\\backup", made: "2026-11-01" } } };
    pageLabPl.S.cover = "key-remove";
    const coverWithBackupPl = pageLabPl.keyRemoveCoverHtml ? pageLabPl.keyRemoveCoverHtml() : "";
    check(coverWithBackupPl.indexOf("Kopia zapasowa klucza została już utworzona: wystarczy ją przywrócić z menu, w Ustawieniach, w części Klucz podpisu, aby wszystko wróciło.") >= 0,
      "7e backup known shows the restoring instruction in PL");

    pageLabPl.S.host = { signing: { keyId: "key-123", leads: true, backup: null } };
    const coverNoBackupPl = pageLabPl.keyRemoveCoverHtml ? pageLabPl.keyRemoveCoverHtml() : "";
    check(coverNoBackupPl.indexOf("Studio nie zna żadnej kopii zapasowej, więc po opróżnieniu Kosza klucz przepadnie bezpowrotnie. Utworzenie kopii z menu, w Ustawieniach, w części Klucz podpisu, zostawia drogę powrotu.") >= 0,
      "7f no backup known shows the keep the way back open instruction in PL");
    check(coverNoBackupPl.indexOf("Nowy klucz też zadziała, a każde stanowisko zostanie wpuszczone na nowo") < 0,
      "7g no backup known omits the false sentence in Polish");

    /* ---- 8. CLEAR COVER SECONDARY ACT FOR KEY ------------------------------------------------- */
    pageLabEn.S.host = { signing: { keyId: "key-123" } };
    pageLabEn.S.cover = "clear";
    const clearWithKey = pageLabEn.clearCoverHtml ? pageLabEn.clearCoverHtml() : "";
    check(clearWithKey.indexOf("Remove the signing key…") >= 0, "8a clear cover offers Remove the signing key… when Studio has a key");

    pageLabEn.S.host = { signing: { keyId: "" } };
    const clearNoKey = pageLabEn.clearCoverHtml ? pageLabEn.clearCoverHtml() : "";
    check(clearNoKey.indexOf("Remove the signing key…") < 0, "8b clear cover omits Remove the signing key… when Studio has no key");
    check(clearNoKey.replace(/&#39;/g, "'").indexOf("Goes from this computer: Studio's other settings, the Opened recently list and the open catalog tabs.") >= 0,
      "8c clear cover shows the Goes paragraph");
    check(clearNoKey.replace(/&#39;/g, "'").indexOf("Stays: every catalog and its folder, the licence, the teams and the relay, the signing key and its backup copies, and the AI service with its key, which Forget the key removes, from the Menu, under Settings, then AI service.") >= 0,
      "8d clear cover shows the Stays paragraph");

  } finally {
    try { fs.rmSync(scratchBase, { recursive: true, force: true }); } catch {}
  }

  process.stdout.write("clear-memory  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  process.stderr.write("clear-memory error: " + (err && err.stack ? err.stack : String(err)) + "\n");
  process.exit(1);
});
