/* THE SHELL'S OWN GUARDS, driven in node with Electron stood in for: no window opens.
 *
 * gate-kind: node
 *
 *     node tests/shell-guards.mjs
 *
 * shell/main.js is loaded under a stub of the electron module and of the thread, so every channel
 * it opens and every listener it puts on its window can be called as Electron would call it.
 * Claims, one section each:
 *   1  a page that stops is reloaded, and a second stop within a minute or a page that stops
 *      answering asks in a box with its own frame (the pinned engine's shell/page-watch.cjs with Studio's
 *      src/recovery.cjs, wired in createWindow)
 *   2  an act on a path the page names (export, audit pack, the folder the desks read from, an
 *      import, a dropped file, a format 1 upgrade, the CSV export and the sheet's plan and land) takes only the path its
 *      picker answered (src/chosen.cjs)
 *      (2i and 2j: the publish channel hands the thread the lead's note as sent, and no licence, key or release date from the page;
 *      2k and 2l: the publish and the review queue get the team keys from this process's own teams.json;
 *      2m and 2n: a new team's key is kept before the file naming it is written, and taken out where that fails;
 *      2o and 2p: an admission gets the team key from teams.json, and keeps the file it wrote only where a choice was made here;
 *      2x, 2y, 2z and 2za: a removal keeps the new key beside the old one and never hands the page a key, and the statistics
 *      channel hands the thread the keys from teams.json; 2zb: a removal on a computer that cannot keep the new key is
 *      refused before the thread is asked; 2zc: the new key is kept before the thread is asked to move the share, a write
 *      that fails leaves that key kept, and the retry reuses it; 2zd: a reply lost after a removal that wrote leaves
 *      the share's next key kept and the invitation spent; 2ze: a reseal refused after the removal's team file landed is
 *      completed by the next look, with no publish (board 974, C2); 2zf: a newer revision sealed at the old key number by
 *      the lead's other Studio, reaching the share after the removal, is sealed at the new one by the next look;
 *      2q, 2r and 2t: the signing key made under the vault and handed to the thread only as what the vault opened, its backup
 *      copy under a passphrase, and its restore on another profile;
 *      904: a backup made before the first team file carries no box, and restoring it over the same key keeps the box
 *      the team write added, so statistics sealed to it still open; a backup made once the box exists restores that box;
 *      904a: another key's passphrase file with its own box is in the place, the restore takes none of it, and says nothing new;
 *      904b: this key's file holds a box sealed under another key, the restore takes it only where this key opens it,
 *      and says nothing new;
 *      904c: a boxless copy restored where no key stands answers with the flag and writes no box, and a copy that
 *      carries its box, a restore that keeps the place's box, or the same key with no box, says nothing new;
 *      904d: the page says that sentence on the restore cover, in English and in Polish, and says nothing new otherwise;
 *      904e: the second clause names this Studio's next change of the team, then each desk's next write, and an
 *      envelope sealed to the team file's box opens with the restored key only after that write)
 *   3  Open the folder hands the system a folder, never a file, which the system would launch
 *   4  electron-builder.js asks for the six fuses, and tools/fuses.mjs, which tools/package.mjs
 *      refuses a build by, reads a binary's wire rightly both ways, and refuses two wires, an empty
 *      ask and a missing program, as the engine's does; with plant:fuse-cookie lifted from a copy of
 *      electron-builder.js the cookie fuse goes unasked, so a program built without it passes
 *   5  every word in every dialog the shell opens is one the page handed over, through the
 *      preload's own functions, so a Polish Studio's dialogs say nothing in English (survey
 *      finding 26; tests/chosen-said.mjs holds the page's half)
 *   6  an installed copy removes Chromium's debugging switches before ready and takes no variable
 *      that points it at another file or folder, where the tree's own shell takes every one
 *      (6e and 6f: the same again with the US spelling of the licence variable, in a second pass; 6g: 6d again with it)
 *   7  a launch the door refuses has written nothing: the profile's store is pinned only after
 *      the refusal has passed, in runStudio and in the installer gate's launch()
 *   8  the proxy is chosen before ready from Windows' own setting, planted and never read from the
 *      machine: a configured server or setup script is followed, anything else is no proxy, and the
 *      one program started is the reg tool (the pinned engine's shell/win-proxy.cjs; tests/no-model.mjs 8
 *      holds its shape)
 *      (8n: on Linux the reg tool is not started and no proxy switch is passed, so Chromium follows the system)
 *   11 on Linux no spelling dictionary is fetched: the session has no languages and its checker off before the
 *      window, and the window asks for no checking; on Windows neither is touched
 *   10 on Linux a team key is sealed only through a keyring: safeStorage's "basic_text" fallback, a
 *      password built into Chromium, counts as no vault, the desks screen says so, and Sealed keeps
 *      nothing; a real keyring, and Windows (which has no backend to ask), are as they were
 *   12 every member of the preload's bridge is one the page's own scripts call, and every key of the host answer one it reads
 *      (12a to 12f), and the preload wires the proxy's three to their own channels (12g, 12h)
 *   14 on Linux, where Chromium would choose its own password ("basic_text") and a keyring answers unlocked on the session
 *      bus, Studio asks for it by name before ready; where none answers, where Chromium names a keyring, where the command
 *      line names a store, and on Windows nothing is asked; the bus is asked through src/keyring-bus.cjs, whose shape
 *      tests/no-model.mjs 10 holds
 *      (10f and 10g: a keyring asked for that does not answer is no vault, and the refusal says how to have one)
 *   15 a right-click opens the field's edit menu (src/edit-menu.cjs): Undo, Cut, Copy, Paste and Select all enabled
 *      as the field says it can, up to five suggestions and Add to dictionary over a misspelt word, Copy over selected
 *      text, in the page's language; nothing on interface text; and not while a gate drives the window
 *   16 the card-add channel carries a new card's reply shape as a fifth string, alts included, "" where the page
 *      names none, and never an object, beside the four strings it always carried; the preload passes the five through
 *      (the New card cover, E2)
 *   17 no planted sample: a fresh profile has no project after a first start, nothing in src/, shell/ or ui/ exports
 *      a catalog builder for planting, and the fetched engine sample opens through studio:sample-pick -> studio:v1-plan ->
 *      studio:v1-land into a project holding the file's cards (pressed twice makes a second project); a planted starter
 *      is caught by both the builder scan and the non-empty folder (17p)
 *   18 invitations and auto-admit (board 885, S2): the page never gets an invitation's secret or its blob, which goes to the
 *      clipboard from the shell and is sealed in teams.json, and each live invitation's check code is the desk's own; the
 *      watch looks every five minutes and on focus, reads nothing in a folder that has not changed, lets a request that
 *      proves a live invitation in with nobody pressing anything, never one whose invitation fails, and one desk per
 *      invitation, lets a request that names none in only where the lead switched auto-admit on, tells the page a folder
 *      moved, lets in what the screen's read sees, and with a key that needs its passphrase lets nobody in until the key
 *      opens, then does with no change in the folder
 *   19 the first key (the sense pass of 2026-10-14, finding 9): with no signing key and nothing at the folder trusting
 *      another, the first publish makes the key under the vault and signs that edition, and the first seal makes it too; the
 *      publish after the key is made asks the page for the backup nudge once; a folder whose team trusts another key gets
 *      none made and the plan names that key for Restore; a computer with no vault publishes unsigned as before
 *      (19a1: the made key's secret is in no file but its key file and on no surface; 19e: a Make press racing the first
 *      publish leaves one key, which signed the edition, while a restore still replaces a passphrase-wrapped key; 19f to 19j:
 *      no key is made over a team file that does not read whole, a seal the project remembers, a team this Studio kept for
 *      the folder, by Plain, or by Sealed on a folder inside the project; 19k: a restore and the first publish together
 *      never write one key over another, whichever lands first; 19l: Make a signing key over a key file that does not read
 *      says where it is and that moving it out of the folder lets Studio make a new key, and leaves the file as it was)
 *   a3 a lead's key backup carries every epoch's team key. Restored on a fresh profile, an earlier
 *      sealed edition and a desk proposal open, a statistics envelope sealed to the lead's box opens,
 *      and a publish goes out under the current epoch. A pending epoch stays pending. The box already
 *      travels in the key file; this leg holds that too.
 *   20 the shell's maintenance readings report "not recorded" for both start and crash when nothing
 *      was recorded (the test architect's read of 2026-11-08)
 *   21 studioWorks, sliced from the shell, is true only on this Studio's own seat certificate or under a licence the root signed
 *      (a trial, a licence, a held file over one verified), for every state licenceState answers (21a, review xi); the licence answer carries it as works in each (21b), and the page reads none
 *      of it (21c, 21d); every channel the shell opens is named in exactly one of OPEN_STOPPED and CLOSED_STOPPED, and neither
 *      names one it does not open (21e), each fault planted once into the table (21f to 21h)
 *   22 the gate: a Studio that does not work refuses what the table closes and reaches nothing to do it (22b), serves what it opens
 *      (22c), exports each project (22d), still lets an act that only takes away work (22e), starts no background act (22f) and
 *      names no open project in the page's start (22g); a working Studio answers the same asks (22b2, 22f2)
 */
import "./reg-stand-on.mjs";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { spawnSync, execFileSync } from "node:child_process";
import Module, { createRequire, syncBuiltinESMExports } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as Engine from "../src/engine.mjs";
import * as Studio from "../src/studio.mjs";
import { readCatalogDocument } from "../src/diff.mjs";
import { dropScratch } from "./scratch.mjs";
import { seatEnv, standGateOpen } from "./seated.mjs";
import { licensedOpts } from "./licensed.mjs";
import { withoutComments } from "./source-text.mjs";
import { WINDOWS_VAR, WINDOWS_DAY } from "./window-wall.mjs";
import { olderFolderTeam } from "./older-folder-team.mjs"; /* a team at a folder is made by the fixture; Studio makes none (the folder team's removal) */
import { denyBinds, LIST } from "./deny-binds.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const MAIN = path.join(ROOT, "shell", "main.js");
const PRELOAD = path.join(ROOT, "shell", "preload.js");
const PINNED_SHELL = path.join(ROOT, "engine", "pinned", "shell");
const UI = path.join(ROOT, "ui", "index.html");
const require = createRequire(import.meta.url);
/* Off in a merge's area run, which runs no planted fault: 4h, the one plant here, is then not run. */
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const EXPECTED = PLANTS_OFF ? 211 - 6 : 240 - 6; /* 212 and 241, less 2o and 2p (the code door, P2), 2c (the chosen folder), 2m, 2n, 19a1, 19c, 19i and 19j (studio:team-sealed and the key the first publish made, 2026-11-26), and 12i and 12j added */
let LR_PROBE = null; /* 21b probe of the refused licence file name, kept for 22h10 */
const REG_TOOL = "C:\\Windows\\System32\\reg.exe";
const REG_KEY = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings";
const CONN_KEY = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\Connections";
const POLICY_KEY = "HKLM\\Software\\Policies\\Microsoft\\Windows\\CurrentVersion\\Internet Settings";
const MACHINE_KEY = "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings";
const MACHINE_CONN_KEY = "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\Connections";
function connectionsBlob(flags) {
  const f = (flags !== undefined ? flags : 9) & 0xff;
  return "4600000002000000" + f.toString(16).padStart(2, "0").toUpperCase() + "00".repeat(47);
}
function connDump(flags, key) {
  const k = key || CONN_KEY;
  return ["", k, "    DefaultConnectionSettings    REG_BINARY    " + connectionsBlob(flags), ""].join("\r\n");
}
/* The key's values, a blank line, then its subkeys, in the shape and the line endings reg prints. */
const regDump = (values, key) => {
  const k = key || REG_KEY;
  return ["", k, ...values.map(([n, ty, v]) => "    " + n + "    " + ty + "    " + v), "",
    k + "\\Connections", k + "\\Wpad", ""].join("\r\n");
};
const QUIET = regDump([["CertificateRevocation", "REG_DWORD", "0x1"], ["ProxyEnable", "REG_DWORD", "0x0"],
  ["User Agent", "REG_SZ", "Mozilla/4.0 (compatible; MSIE 8.0; Win32)"]]);
const QUIET_CONN = connDump(1, CONN_KEY);
/* safeStorage stood in: a reversible seal that is not the key's own spelling, so a key kept through it is found by no scan. */
const FAKE_VAULT_STORAGE = {
  isEncryptionAvailable: () => true,
  encryptString: (s) => Buffer.from("sealed:" + Buffer.from(String(s), "utf8").reverse().toString("hex"), "utf8"),
  decryptString: (b) => { const t = Buffer.from(b).toString("utf8");
    if (!t.startsWith("sealed:")) throw new Error("not sealed here");
    return Buffer.from(t.slice(7), "hex").reverse().toString("utf8"); },
};
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-studio-shell-guards-"));

let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
/* A check this machine cannot make (a deny that does not bind its account, tests/deny-binds.mjs) is said and not counted. */
function skip(line) {
  skipped++;
  process.stdout.write("  SKIP " + line + "\n");
}
const settle = () => new Promise(r => setTimeout(r, 20));
const storeOfName = (name) => path.join(SCRATCH, name, "studio.json");

/* ---- the stand-in ------------------------------------------------------------------------------
 * One load of shell/main.js per call, with its own user-data folder and environment. `answers`
 * feeds the message box, `picks` the file and folder dialogs. Everything the shell does to the
 * world is written into `got`. */
async function loadShell(name, o) {
  const opts = o || {};
  const ud = path.join(SCRATCH, name);
  fs.mkdirSync(ud, { recursive: true });
  if (opts.store) fs.writeFileSync(path.join(ud, "studio.json"), JSON.stringify(opts.store));
  /* A lead signed in, the path a customer walks: with a provider offered, a Studio nobody signed in to holds publishing to a team,
     statistics and proposals (night decision 16; sign-in.mjs si77 and licence-studio ls16a hold that state). */
  if (opts.signedIn) fs.writeFileSync(path.join(ud, "licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft" }));
  const seated = opts.works === "own" ? {} : await seatEnv(ud, opts.works === undefined ? true : opts.works, opts.env);
  const got = { handlers: {}, heard: {}, windows: [], boxes: [], calls: [], opened: [], trashed: [], held: [], said: [], dialogs: [],
               switched: [], removed: [], spell: [], menus: [], sent: [], children: [], logged: [], clipboard: [], js: [] };
  /* `main` loads a copy of the shell from elsewhere (section 6); `switches` are on its command line. */
  const main = opts.main || MAIN, ui = path.join(path.dirname(main), "..", "ui", "index.html");
  const onLine = new Set(opts.switches || []);
  const answers = opts.answers || [], picks = opts.picks || [];
  const bag = (into) => (t, fn) => { (into[t] = into[t] || []).push(fn); };
  const loadOpts = opts;
  class Win {
    constructor(opts) {
      const self = this;
      this.opts = opts || {}; this.file = "";
      this.log = []; this.wcOn = {}; this.winOn = {};
      this.webContents = { id: 1, on: bag(this.wcOn), once: bag(this.wcOn), send(...a) { got.sent.push(a); },
        setWindowOpenHandler() {}, getURL: () => pathToFileURL(UI).href,
        reload() { self.log.push("reload"); },
        forcefullyCrashRenderer() { self.log.push("kill"); } };
      /* `opts.page` is the page's answer to a script the shell runs in it (section 24: the page flushes what waits before the window hides). */
      if (loadOpts.page) this.webContents.executeJavaScript = (src) => { got.js.push(String(src)); return Promise.resolve(loadOpts.page(String(src))); };
      got.windows.push(this);
    }
    on(t, fn) { bag(this.winOn)(t, fn); }
    once(t, fn) { bag(this.winOn)(t, fn); }
    isDestroyed() { return false; }
    isMaximized() { return false; }
    close() { this.log.push("close"); }
    loadFile(f) { this.file = f; }
    /* Section 24 (the hold and the tray): a window that hides, shows and fires its 'show', and a page that answers what the shell asks of it. */
    show() { if (!loadOpts.tray) return; this.visible = true; this.log.push("show"); (this.winOn.show || []).forEach((fn) => fn()); }
    hide() { this.visible = false; this.log.push("hide"); }
    /* Electron fires no 'show' when a hidden window is maximised, as far as is known (section 24, the hold's maximised start). */
    maximize() { if (loadOpts.tray) this.log.push("maximize"); }
    isVisible() { return this.visible !== false; }
    showInactive() {} setMinimumSize() {}
  }
  const display = { bounds: { x: 0, y: 0, width: 1920, height: 1080 },
                    workAreaSize: { width: 1920, height: 1032 } };
  const electron = {
    app: { commandLine: { appendSwitch: (k, v) => { got.switched.push((got.ready ? "AFTER-READY " : "") + (v === undefined ? k : k + "=" + v)); },
                          hasSwitch: (k) => onLine.has(k),
                          removeSwitch: (k) => { if (onLine.delete(k)) got.removed.push(k); } },
           getPath: () => ud, getVersion: () => "0.0.0",
           getLocale: () => opts.locale || "en-GB", requestSingleInstanceLock: () => true,
           whenReady: () => Promise.resolve().then(() => { got.ready = true; }), on() {}, quit() {}, exit() {} },
    BrowserWindow: Object.assign(Win, { fromWebContents: () => got.windows[0] || null,
                                        getAllWindows: () => got.windows }),
    Menu: { setApplicationMenu() {},
            /* Section 15 drives the context-menu listener and reads the menu it built, which the shell pops up. */
            buildFromTemplate: (items) => {
              const rec = { items, popped: null };
              got.menus.push(rec);
              return { popup: (o) => { rec.popped = o; } };
            } },
    dialog: {
      showMessageBox: (w, box) => { got.boxes.push(box); return Promise.resolve({ response: answers.shift() }); },
      showOpenDialog: (w, o) => { got.dialogs.push(o); return Promise.resolve(picks.shift() || { canceled: true, filePaths: [] }); },
      showSaveDialog: (w, o) => { got.dialogs.push(o); return Promise.resolve(picks.shift() || { canceled: true, filePath: "" }); },
    },
    nativeTheme: { themeSource: "system" },
    /* A tray, for the legs that close to it (opts.tray); without it the shell finds none and a close is not held. */
    Tray: opts.tray ? class { constructor() { got.tray = (got.tray || 0) + 1; } setToolTip() {} setContextMenu() {} setImage() {} on() {} destroy() {} } : undefined,
    nativeImage: opts.tray ? { createFromPath: () => ({ isEmpty: () => false }) } : undefined,
    clipboard: { writeText: (t) => { got.clipboard.push(String(t)); } },
    safeStorage: opts.safeStorage || FAKE_VAULT_STORAGE,
    screen: { getAllDisplays: () => [display], getPrimaryDisplay: () => display, on() {},
              removeListener() {} },
    session: { defaultSession: { setPermissionRequestHandler() {}, setPermissionCheckHandler() {},
                                 setDevicePermissionHandler() {},
                                 setSpellCheckerLanguages: (l) => { got.spell.push((got.windows.length ? "AFTER-WINDOW " : "") + "languages " + JSON.stringify(l)); },
                                 setSpellCheckerDictionaryDownloadURL: (u) => { got.spell.push((got.windows.length ? "AFTER-WINDOW " : "") + "address " + u); },
                                 setSpellCheckerEnabled: (on) => { got.spell.push((got.windows.length ? "AFTER-WINDOW " : "") + "enabled " + on); } } },
    shell: { openPath: (p) => { got.opened.push(p); return Promise.resolve(""); },
      /* The Recycle Bin, stood in for: the folder is renamed into this profile's scratch, never
         removed, so a later plant can reuse the name and the test can still read the old bytes. */
      trashItem: (p) => {
        got.trashed.push(String(p));
        if (opts.trashReject) return Promise.reject(new Error("the Recycle Bin refused"));
        /* Resolves and leaves the folder where it is, so a removal that trusts the promise
           alone can be told from one that looks afterwards. */
        if (opts.trashStay) return Promise.resolve();
        const dest = path.join(ud, "held-" + path.basename(String(p)) + "-" + got.trashed.length);
        fs.renameSync(String(p), dest);
        got.held.push(dest);
        return Promise.resolve();
      } },
    ipcMain: { handle: (ch, fn) => { got.handlers[ch] = fn; }, on: (ch, fn) => { got.heard[ch] = fn; } },
  };
  const thread = { call: (verb, ...a) => { got.calls.push([verb].concat(a));
    return opts.thread ? opts.thread(verb, ...a) : Promise.resolve({ verb }); } };
  /* XDG_CURRENT_DESKTOP=GNOME unless a leg names another, so section 14's keyring switch is asked for only where it wants
     it, on any machine; null removes a variable. */
  const env = Object.assign({ STUDIO_TEST_OFFSCREEN: "", XDG_CURRENT_DESKTOP: "GNOME" }, seated, opts.env || {});
  const was = {};
  for (const k of Object.keys(env)) { was[k] = process.env[k]; if (env[k] === null) delete process.env[k]; else process.env[k] = env[k]; }
  /* WINDOWS' PROXY KEY, planted where the pinned shell/win-proxy.cjs asks: `opts.reg` is the text reg would print (or an
     Error for a tool that fails), and QUIET is a key with the proxy switched off. Nothing here reads or
     writes this machine's own settings, and `got.regCalls` is what the shell asked of the tool. */
  got.regCalls = []; got.busCalls = [];
  /* Every child call is recorded and none is spawned: a publish that put the secret on a command line or in an
     environment the child would inherit is visible to the leg, and the process is not started. The recorder sits on
     the builtin. Module._load never sees an ESM import or import(), and syncBuiltinESMExports makes those bindings
     the same recorder. The record is the program, its argv, every value of options.env, and the options object whole
     (the read of a0a2fda: env values alone let spawnSync(file, { input: secret }), a secret as an env key and one in
     fork's execArgv go unseen, where the parent's record of the whole second argument caught the first), a Buffer or a
     typed array in it written as hex. */
  const isOpt = (v) => !!v && typeof v === "object" && !Array.isArray(v) && typeof v !== "function";
  const shown = (v) => v == null ? "" : Buffer.isBuffer(v) ? v.toString("utf8") : String(v);
  const envValues = (o) => !isOpt(o) || !o.env || typeof o.env !== "object" ? [] : Object.keys(o.env).map((k) => shown(o.env[k]));
  const optWhole = (o) => {
    if (!isOpt(o)) return "";
    try {
      return JSON.stringify(o, (k, v) => Buffer.isBuffer(v) || ArrayBuffer.isView(v)
        ? Buffer.from(v.buffer || v, v.byteOffset, v.byteLength).toString("hex") : v);
    } catch (err) { return "unrecordable options: " + String(err && err.message); }
  };
  const noteChild = (kind, file, argv, opt) => {
    got.children.push([kind, shown(file), Array.isArray(argv) ? argv.map(shown) : [], envValues(opt), optWhole(opt)]);
  };
  const argvAnd = (second, third) => ({
    argv: Array.isArray(second) ? second : [],
    opt: Array.isArray(second) ? (isOpt(third) ? third : null) : (isOpt(second) ? second : null),
  });
  const quietChild = { on() {}, unref() {}, kill() {}, pid: 0, stdout: { on() {} }, stderr: { on() {} }, stdin: { end() {}, write() {} } };
  const cp = { execFileSync: (file, second, third) => {
    const part = argvAnd(second, third);
    noteChild("execFileSync", file, part.argv, part.opt);
    /* The session bus as opts.bus answers it (a function of dbus-send's arguments, section 14, at the fixed path
       src/keyring-bus.cjs names); none throws. */
    if (file === "/usr/bin/dbus-send") { got.busCalls.push(part.argv); if (!opts.bus) throw new Error("no session bus"); return opts.bus(part.argv); }
    got.regCalls.push([file, part.argv]);
    const key = String(part.argv && part.argv[1] || "");
    const planted = typeof opts.reg === "function" ? opts.reg(part.argv) : opts.reg;
    if (planted instanceof Error) throw planted;
    if (planted === undefined) return (key === CONN_KEY || key === MACHINE_CONN_KEY) ? QUIET_CONN : QUIET;
    if (typeof planted === "string" && (key === CONN_KEY || key === MACHINE_CONN_KEY) && !planted.includes("DefaultConnectionSettings")) {
      return connDump(1, key);
    }
    return planted;
  },
  execSync: (cmd, opt) => { noteChild("execSync", cmd, [shown(cmd)], isOpt(opt) ? opt : null); return ""; },
  spawnSync: (file, second, third) => {
    const part = argvAnd(second, third);
    noteChild("spawnSync", file, part.argv, part.opt);
    return { status: 0, stdout: "", stderr: "" };
  },
  execFile: (file, second, third, cb) => {
    const part = argvAnd(second, third);
    noteChild("execFile", file, part.argv, part.opt);
    const done = typeof second === "function" ? second : typeof third === "function" ? third : cb;
    if (typeof done === "function") done(null, "", "");
    return quietChild;
  },
  spawn: (file, second, third) => {
    const part = argvAnd(second, third);
    noteChild("spawn", file, part.argv, part.opt);
    return quietChild;
  },
  exec: (cmd, second, cb) => {
    noteChild("exec", cmd, [shown(cmd)], isOpt(second) ? second : null);
    const done = typeof second === "function" ? second : cb;
    if (typeof done === "function") done(null, "", "");
    return quietChild;
  },
  fork: (file, second, third) => {
    const part = argvAnd(second, third);
    noteChild("fork", file, part.argv, part.opt);
    return quietChild;
  } };
  /* THE ENGINE'S REG GUARD (engine 9619e6e6): outside Electron the pinned win-proxy.cjs lets a reg call go ahead only where
     the function that runs it is a stand-in marked as the engine's tests/reg-stand.cjs marks its own, and refuses it before
     reg.exe starts otherwise. These two recorders are the functions it hands its calls to, and they start nothing, so they
     carry the mark; unmarked, every read is refused and section 8 sees no key at all. */
  for (const n of ["execFileSync", "execFile"]) cp[n][Symbol.for("etiuda.reg-stand")] = true;
  const load = Module._load, write = process.stderr.write, outWrite = process.stdout.write, errWas = console.error;
  const builtinCp = process.getBuiltinModule("node:child_process");
  const childNames = ["execFileSync", "execSync", "spawnSync", "execFile", "spawn", "exec", "fork"];
  const childWas = {};
  for (const n of childNames) childWas[n] = builtinCp[n];
  for (const n of childNames) builtinCp[n] = cp[n];
  syncBuiltinESMExports();
  /* `opts.platform` stands in for process.platform while the shell loads, which is when the proxy is chosen (section 8): the
     reader asks Windows only on Windows, so its legs name the platform they are about rather than reading this machine's. */
  const platformWas = Object.getOwnPropertyDescriptor(process, "platform");
  if (opts.platform) Object.defineProperty(process, "platform", { value: opts.platform, configurable: true });
  /* `opts.resources` stands in for process.resourcesPath, the packaged app's resources folder, which bare node has not. */
  const resourcesWas = process.resourcesPath;
  if (opts.resources) process.resourcesPath = opts.resources;
  Module._load = function (req) {
    if (req === "electron") return electron;
    if (req === "node:child_process" || req === "child_process") return cp;
    if (/studio-thread\.cjs$/.test(req)) return thread;
    return load.apply(this, arguments);
  };
  process.stderr.write = (s) => {
    const line = String(s);
    if (/^studio {2}/.test(line)) { got.said.push(line.trim()); return true; }
    got.logged.push(line);
    return write.call(process.stderr, s);
  };
  /* console.log, info and debug go through stdout.write, so one wrapper covers them. */
  process.stdout.write = function (chunk, enc, cb) {
    got.logged.push(Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk));
    if (typeof enc === "function") return outWrite.call(process.stdout, chunk, enc);
    if (enc === undefined && cb === undefined) return outWrite.call(process.stdout, chunk);
    return outWrite.call(process.stdout, chunk, enc, cb);
  };
  console.error = (...a) => {
    got.logged.push(a.map((x) => { if (typeof x === "string") return x; try { return JSON.stringify(x); } catch (e) { return String(x); } }).join(" "));
    return errWas.apply(console, a);
  };
  /* The child stand-in stays after the shell has loaded, so a require or an import during a publish is the same
     recorder and still does not spawn. Electron's own stub is only needed while the shell loads. */
  const restoreChildren = () => {
    for (const n of childNames) builtinCp[n] = childWas[n];
    syncBuiltinESMExports();
  };
  let holdChildren = true, opened = false;
  const argvWas = process.argv.slice();
  if (opts.argv) process.argv.push(...opts.argv); /* a start with Windows: --hidden (section 24) */
  try {
    delete require.cache[main];
    delete require.cache[path.join(path.dirname(main), "..", "engine", "pinned", "shell", "win-proxy.cjs")];
    delete require.cache[path.join(path.dirname(main), "..", "src", "keyring-bus.cjs")];
    got.mod = require(main);
    for (let i = 0; i < 1250 && !got.windows.length; i++) await settle();
    opened = true;
  } finally {
    process.argv.length = 0; process.argv.push(...argvWas);
    Object.defineProperty(process, "platform", platformWas);
    if (resourcesWas === undefined) delete process.resourcesPath; else process.resourcesPath = resourcesWas;
    if (opened) {
      Module._load = function (req) {
        if (holdChildren && (req === "node:child_process" || req === "child_process")) return cp;
        return load.apply(this, arguments);
      };
    } else {
      holdChildren = false;
      Module._load = load;
      process.stderr.write = write;
      process.stdout.write = outWrite;
      console.error = errWas;
      restoreChildren();
    }
  }
  got.done = () => {
    holdChildren = false;
    Module._load = load;
    process.stderr.write = write;
    process.stdout.write = outWrite;
    console.error = errWas;
    restoreChildren();
    for (const k of Object.keys(was)) { if (was[k] === undefined) delete process.env[k]; else process.env[k] = was[k]; }
  };
  got.win = got.windows[0] || null;
  got.fire = async (on, t, ...a) => { for (const fn of (got.win[on][t] || [])) fn(...a); await settle(); };
  got.event = { senderFrame: { parent: null, url: pathToFileURL(ui).href },
                sender: got.win && got.win.webContents };
  got.ask = (ch, ...a) => got.handlers[ch](got.event, ...a);
  return got;
}

/* A catalog these legs build sits beside the profile, not under Documents. The shell lists only
   a direct child of its projects root, so that root is the catalog's parent. */
function projectsBeside(dir, env) {
  return Object.assign({}, env || {}, { STUDIO_PROJECTS: path.dirname(dir) });
}

async function main() {
  /* ---- 1. A PAGE THAT STOPS ---------------------------------------------------------------- */
  let W = null, RW = null;
  try { W = require(path.join(PINNED_SHELL, "page-watch.cjs")); } catch { W = null; }
  try { RW = require("../src/recovery.cjs"); } catch { RW = null; }
  check(!!W && typeof W.watchPage === "function" && typeof W.askInWindow === "function" && !!RW && !!RW.LOOK,
    "1 CONTROL: the pinned shell/page-watch.cjs has watchPage() and askInWindow(), and src/recovery.cjs Studio's words and look");
  if (W && typeof W.askInWindow === "function" && RW && RW.LOOK) {
    /* The desk's legs over a window model whose recovery window answers as it loads, with a clock
       of its own; the window and its page are the real module's. */
    const log = [], answers = [], wcOn = {}, winOn = {}, made = [];
    const tmp = path.join(SCRATCH, "recovery");
    fs.mkdirSync(tmp, { recursive: true });
    let clock = 1000000;
    class Box {
      constructor(opts) {
        const self = this;
        this.opts = opts; this.wcOn = {}; this.winOn = {}; this.closed = false; this.shown = ""; this.file = "";
        this.webContents = { on: (t, fn) => { self.wcOn[t] = fn; }, setWindowOpenHandler: (fn) => { self.opener = fn; } };
        made.push(this);
      }
      on(t, fn) { this.winOn[t] = fn; }
      once(t, fn) { this.winOn[t] = fn; }
      isDestroyed() { return this.closed; }
      close() { if (this.closed) return; this.closed = true; if (this.winOn.closed) this.winOn.closed(); }
      show() { this.shown = "show"; }
      showInactive() { this.shown = "inactive"; }
      loadFile(f) {
        this.file = f;
        const r = answers.shift();
        if (r != null) this.wcOn["will-navigate"]({ preventDefault() {} }, pathToFileURL(f).href + "?answer-" + r);
      }
    }
    const win = { webContents: { on: (t, fn) => { wcOn[t] = fn; }, reload() { log.push("reload"); },
                                 forcefullyCrashRenderer() { log.push("kill"); } },
                  on: (t, fn) => { winOn[t] = fn; }, isDestroyed: () => false, close() { log.push("close"); },
                  getBounds: () => ({ x: 100, y: 100, width: 1200, height: 800 }) };
    const o = { ...RW.LOOK, BrowserWindow: Box, dark: () => false, aside: false, asideAt: () => ({ x: 9000, y: 9000 }),
                tmpdir: () => tmp, words: () => RW.wordsFor("en"), now: () => clock,
                log(line) { const m = /the recovery window asks: (.*)$/.exec(line); if (m) log.push("asks " + m[1]); } };
    W.watchPage(win, o);
    const step = async (fn) => { log.length = 0; fn(); await settle(); return log.slice().join(", "); };
    const gone = (reason) => () => wcOn["render-process-gone"]({}, { reason, exitCode: 1 });
    const said = RW.WORDS.en;
    check(await step(gone("crashed")) === "reload", "1a the first loss reloads the page at once");
    clock += 10000; answers.push(0);
    check(await step(gone("crashed")) === "asks " + said.gone + ", reload",
      "1b a second loss within a minute asks in the recovery window, and its Restart reloads");
    clock += 10000; answers.push(1);
    check(await step(gone("crashed")) === "asks " + said.gone + ", close", "1c and its Close closes the window");
    check(await step(gone("clean-exit")) === "", "1d a page that closed on its own is left alone");
    answers.push(0);
    check(await step(() => winOn.unresponsive()) === "asks " + said.hung, "1e the hang window's Wait leaves the page alone");
    answers.push(1);
    check(await step(() => winOn.unresponsive()) === "asks " + said.hung + ", kill",
      "1f the hang window's Restart ends the page and sends no reload while the old page is still going");
    check(await step(gone("killed")) === "reload", "1g the reload comes once the old page has gone, and that loss asks nothing");
    clock += 120000;
    check(await step(gone("crashed")) === "reload", "1h a loss a minute after the last counts as a first again");

    /* The window itself and the page it carries, asked directly. */
    const ask = (message, buttons, signal, over) => {
      made.length = 0;
      let value;
      const p = W.askInWindow(win, RW.wordsFor("pl"), message, buttons, signal || null, Object.assign({}, o, over || {}));
      p.then((v) => { value = v; });
      return { box: made[0], value: () => value };
    };
    const pl = RW.WORDS.pl;
    const a = ask(pl.gone, [pl.restart, pl.close]);
    const ao = (a.box && a.box.opts) || {}, wp = ao.webPreferences || {};
    const page = a.box && a.box.file ? fs.readFileSync(a.box.file, "utf8") : "";
    const links = [...page.matchAll(/<a href="\?answer-(\d)"( class="go" autofocus)?>([^<]*)<\/a>/g)].map((m) => [+m[1], !!m[2], m[3]]);
    check(made.length === 1 && ao.parent === win && ao.modal === true && ao.frame === false && ao.resizable === false
          && ao.x === 490 && ao.y === 444 && ao.width === 420 && ao.height === 112 && wp.javascript === false && wp.sandbox === true
          && ao.backgroundColor === "#ffffff",
      "1l a second stop opens a window of its own over Studio's: modal to it, centred on it, frameless and fixed in size,"
      + " on the light panel, with no script and a sandbox: " + JSON.stringify([made.length, ao.x, ao.y, ao.width, ao.height, wp.javascript]));
    check(/^<!DOCTYPE html>\n<html lang="pl">\n<meta charset="utf-8">/.test(page) && /script-src 'none'/.test(page)
          && !/<script/i.test(page) && (/<h1>([^<]*)<\/h1>/.exec(page) || [])[1] === pl.gone
          && (/<title>([^<]*)<\/title>/.exec(page) || [])[1] === pl.title
          && JSON.stringify(links) === JSON.stringify([[1, false, pl.close], [0, true, pl.restart]])
          && /body\{[^}]*cursor:default/.test(page) && /a\{[^}]*cursor:default/.test(page)
          && /@media \(prefers-color-scheme:dark\)/.test(page) && /@media \(forced-colors:active\)/.test(page),
      "1m its page is a file in the page's language with no script under a policy refusing any, asking in one line with"
      + " the two choices as links, the leading one filled, focused and last, the arrow kept and a dark face: "
      + JSON.stringify(links));
    a.box.winOn["ready-to-show"]();
    const base = a.box.file ? pathToFileURL(a.box.file).href : "";
    const nav = (url) => { let stopped = false; a.box.wcOn["will-navigate"]({ preventDefault() { stopped = true; } }, url); return stopped; };
    const stopped = [nav("https://example.com/"), nav(base + "?answer-7")];
    await settle();
    const before = a.value();
    nav(base + "?answer-1");
    await settle();
    check(a.box.shown === "show" && stopped.join() === "true,true" && a.box.opener().action === "deny" && before === undefined
          && JSON.stringify(a.value()) === '{"response":1}' && a.box.closed && !fs.existsSync(a.box.file),
      "1n it shows when drawn, refuses every navigation and new window, passes over a query that is no choice, answers"
      + " the chosen link's index, closes and takes its file away: " + JSON.stringify([a.box.shown, stopped, before, a.value()]));
    const b = ask(pl.gone, [pl.restart, pl.close]);
    b.box.wcOn["before-input-event"]({ preventDefault() {} }, { type: "keyDown", key: "Escape" });
    const c = ask(pl.gone, [pl.restart, pl.close]);
    c.box.close();
    const ac = new AbortController(), h = ask(pl.hung, [pl.wait, pl.restart], ac.signal);
    ac.abort();
    await settle();
    check(JSON.stringify([b.value(), c.value(), h.value(), b.box.closed, h.box.closed])
          === '[{"response":0},{"response":0},{"response":-1},true,true]',
      "1o Escape and a close both answer the first choice, and an abort closes the window unanswered");
    const s = ask(pl.gone, [pl.restart, pl.close], null, { aside: true, dark: () => true });
    s.box.winOn["ready-to-show"]();
    check(s.box.opts.focusable === false && s.box.opts.x === 9000 && s.box.shown === "inactive"
          && s.box.opts.backgroundColor === "#1d1f24",
      "1p the harness's window beyond the far corner gets its recovery window there too, unfocused and shown without"
      + " the focus, and a dark Studio a dark one: " + JSON.stringify([s.box.opts.x, s.box.shown, s.box.opts.backgroundColor]));
    s.box.close();
    const n = ask(pl.gone, [pl.restart, pl.close], null, { tmpdir: () => path.join(SCRATCH, "no-such-folder") });
    await settle();
    check(made.length === 0 && JSON.stringify(n.value()) === '{"response":0}',
      "1q where its page cannot be written no window opens and the first choice is taken at once");
  }

  /* The wiring: the window shell/main.js makes carries the watch, speaks the page's language, and
     under the harness's flag puts its recovery window beyond the far corner too. */
  const recovery = (s) => s.windows[1] || null;
  const pageOf = (w) => { try { return fs.readFileSync(w.file, "utf8"); } catch { return ""; } };
  const shut = (w) => { if (w && w.winOn.closed) w.winOn.closed.forEach((fn) => fn()); };
  {
    const s = await loadShell("watch");
    const before = s.win ? s.win.log.length : -1;
    if (s.win) {
      await s.fire("wcOn", "render-process-gone", {}, { reason: "crashed", exitCode: 1 });
      await s.fire("wcOn", "render-process-gone", {}, { reason: "oom", exitCode: 1 });
    }
    const r = recovery(s), page = r ? pageOf(r) : "";
    if (r && r.wcOn["will-navigate"]) r.wcOn["will-navigate"].forEach((fn) => fn({ preventDefault() {} }, pathToFileURL(r.file).href + "?answer-0"));
    await settle();
    s.done();
    check(!!s.win && before === 0 && s.win.log.join(",") === "reload,reload" && s.boxes.length === 0
          && (/<h1>([^<]*)<\/h1>/.exec(page) || [])[1] === "Etiuda Studio stopped unexpectedly."
          && !!r && r.opts.parent === s.win && !fs.existsSync(r.file)
          && r.opts.width === 420 && (page.match(/--fill:#2563eb;/g) || []).length === 2 && path.basename(r.file).indexOf("etiuda-studio-recovery-") === 0,
      "1i Studio's own window reloads a page that stops and asks, in English on an English desk, in a recovery window"
      + " of its own when it stops again, in Studio's look (420 px, its blue in both themes, its page file), whose Restart reloads: "
      + JSON.stringify(s.win && s.win.log) + ", system boxes " + s.boxes.length
      + (r ? ", width " + r.opts.width + ", file " + path.basename(r.file) : ""));
  }
  {
    const s = await loadShell("watch-pl", { store: { lang: "pl" } });
    if (s.win) await s.fire("winOn", "unresponsive");
    const r = recovery(s), page = r ? pageOf(r) : "";
    shut(r);
    s.done();
    const links = [...page.matchAll(/<a href="[^"]*"[^>]*>([^<]*)<\/a>/g)].map((m) => m[1]);
    check(s.boxes.length === 0 && (/<h1>([^<]*)<\/h1>/.exec(page) || [])[1] === "Etiuda Studio nie odpowiada."
          && links.join("|") === "Uruchom ponownie|Czekaj",
      "1j with Polish chosen in Settings the hang window is Polish: " + JSON.stringify(links));
  }
  {
    const s = await loadShell("watch-aside", { env: { STUDIO_TEST_OFFSCREEN: "1" } });
    if (s.win) {
      await s.fire("wcOn", "render-process-gone", {}, { reason: "crashed", exitCode: 1 });
      await s.fire("wcOn", "render-process-gone", {}, { reason: "crashed", exitCode: 1 });
    }
    const r = recovery(s);
    shut(r);
    s.done();
    check(!!s.win && s.boxes.length === 0 && !!r && r.opts.focusable === false && r.opts.x >= 1920 + 200
          && s.said.some((l) => /the recovery window asks: Etiuda Studio stopped/.test(l)),
      "1k the harness's window beyond the far corner raises no system box, puts its recovery window beyond the corner"
      + " too, and says in its log what it asks: " + JSON.stringify(s.said));
  }

  /* ---- 2. AN ACT ON A PATH TAKES ONLY THE ONE ITS PICKER ANSWERED ------------------------------ */
  {
    const P = (n) => path.join(SCRATCH, "picked", n), Q = path.join(SCRATCH, "elsewhere", "x.ec");
    const open = (p) => ({ canceled: false, filePaths: [p] });
    const s = await loadShell("paths", { picks: [
      { canceled: false, filePath: P("a.ec") }, open(P("pack")),
      open(P("rows.csv")), { canceled: true, filePaths: [] }, open("relative-v1.js")] });
    const verbs = () => s.calls.map(c => c[0] + ":" + c[c[0] === "exportAuditPack" ? 3 : c[0] === "setPublishFolder" ? 2 : c[0] === "exportEdition" ? 3 : 2]);
    const run = async (steps) => { s.calls.length = 0; const out = [];
      for (const [ch, ...a] of steps) { const r = await s.ask(ch, ...a); out.push(r === null ? "null" : "ok"); }
      return out.join(",") + " " + JSON.stringify(verbs()); };

    const exp = await run([["studio:export-edition", "d", "e1", Q], ["studio:export-pick", "t", "n"],
      ["studio:export-edition", "d", "e1", P("a.ec")], ["studio:export-edition", "d", "e1", P("a.ec")]]);
    check(exp === "null,ok,ok,null " + JSON.stringify(["exportEdition:" + P("a.ec")]),
      "2a an export writes only to the file the save dialog answered, once: " + exp);
    const pack = await run([["studio:audit-pack", "d", "e1", Q], ["studio:audit-pack-pick", "t"],
      ["studio:audit-pack", "d", "e1", P("pack")], ["studio:audit-pack", "d", "e1", P("pack")]]);
    check(pack === "null,ok,ok,null " + JSON.stringify(["exportAuditPack:" + P("pack")]),
      "2b an audit pack goes only into the folder its picker answered, once: " + pack);
    /* 2c retired 2026-11-26 with the folder a person chose for a team to read from (Max, 00:37: "Retire it."): the folder the desks read from was only one its
       picker answered, and clearing it needed no pick; studio:set-folder and studio:pick-folder are gone. */
    const imp = await run([["studio:import-plan", Q, {}, ""], ["studio:import-pick", "t", {}],
      ["studio:import-plan", P("rows.csv"), {}, ""], ["studio:import-plan", P("rows.csv"), {}, ""],
      ["studio:import-pick", "t", {}], ["studio:import-land", P("rows.csv"), {}, ""],
      ["studio:import-land", Q, {}, ""]]);
    check(imp === "null,ok,ok,ok,ok,ok,null " + JSON.stringify(["importPlan:" + P("rows.csv"),
      "importPlan:" + P("rows.csv"), "importLand:" + P("rows.csv")]),
      "2d an import plans and lands only the file its picker answered, as often as the wizard asks,"
      + " and a pick cancelled mid-wizard leaves that file standing: " + imp);
    const v1 = await run([["studio:v1-plan", Q], ["studio:v1-pick", "t"], ["studio:v1-plan", "relative-v1.js"],
      ["studio:v1-land", path.resolve("relative-v1.js"), "n"], ["studio:v1-land", Q, "n"]]);
    check(v1 === "null,ok,ok,ok,null " + JSON.stringify(["upgradePlan:relative-v1.js", "upgradeLand:" + path.resolve("relative-v1.js")]),
      "2e a format 1 catalog is upgraded only from the file its picker answered, the plan's resolved"
      + " form of it included: " + v1);
    s.done();
    check(s.said.filter(l => /which no picker answered/.test(l)).length === 8, /* 10 less the two refusals of studio:set-folder, retired 2026-11-26 */
      "2f each refusal is said in the shell's log: " + s.said.filter(l => /no picker/.test(l)).length + " line(s)");
  }
  {
    const at = path.join(SCRATCH, "harness-save.ec");
    const s = await loadShell("paths-env", { env: { STUDIO_TEST_SAVE: at } });
    const picked = await s.ask("studio:export-pick", "t", "n");
    const r = await s.ask("studio:export-edition", "d", "e1", at);
    s.done();
    check(picked && picked.file === at && r !== null && s.calls.length === 1,
      "2g the harness's answer to a picker counts as the pick: " + JSON.stringify([picked && picked.file, r]));
  }

  /* 2h THE THREE CHANNELS OF C09, at run time and not by the text of their guards (the test architect's M16 and M16b): the CSV
     export writes only into the folder its own picker answered, once; the sheet is planned, as often as asked, and landed only from the
     file the import picker answered. A guard inverted with its words kept answers the stranger and refuses the pick. */
  {
    const P = (n) => path.join(SCRATCH, "picked", n), Q = path.join(SCRATCH, "elsewhere", "sheet.csv");
    const s = await loadShell("paths-sheet", { picks: [{ canceled: false, filePaths: [P("csv-out")] }, { canceled: false, filePaths: [P("sheet.csv")] }] });
    const run = async (steps) => { s.calls.length = 0; const out = [];
      for (const [ch, ...a] of steps) { const r = await s.ask(ch, ...a); out.push(r === null ? "null" : "ok"); }
      return out.join(",") + " " + JSON.stringify(s.calls.map(c => c[0] + ":" + c[c[0] === "exportCards" ? 3 : 2])); };
    const csv = await run([["studio:csv-export", "d", null, Q], ["studio:csv-pick", "t"], ["studio:csv-export", "d", ["c-1"], P("csv-out")],
      ["studio:csv-export", "d", null, P("csv-out")]]);
    const sheet = await run([["studio:sheet-plan", "d", Q], ["studio:sheet-land", "d", Q, "fp"], ["studio:import-pick", "t", {}],
      ["studio:sheet-plan", "d", P("sheet.csv")], ["studio:sheet-plan", "d", P("sheet.csv")], ["studio:sheet-land", "d", P("sheet.csv"), "fp"],
      ["studio:sheet-land", "d", Q, "fp"]]);
    s.done();
    check(csv === "null,ok,ok,null " + JSON.stringify(["exportCards:" + P("csv-out")])
          && sheet === "null,null,ok,ok,ok,ok,null " + JSON.stringify(["sheetPlan:" + P("sheet.csv"), "sheetPlan:" + P("sheet.csv"), "sheetLand:" + P("sheet.csv")]),
      "2h the CSV export goes only into the folder its picker answered, once, and a sheet is planned and landed only from the file the import picker answered: "
      + csv + " / " + sheet);
  }

  /* 2r A FILE DROPPED ON THE WINDOW (board 862): the path the preload read off the File is kept as the import's pick, so the
     plan takes it; a folder, a relative path, a path to nothing and no path at all are no pick, and the plan refuses them. */
  {
    const dir = path.join(SCRATCH, "dropped"), dropped = path.join(dir, "rows.csv");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dropped, "Title,Body\nA,B\n");
    const s = await loadShell("paths-dropped");
    const none = [];
    for (const p of [dir, "rows.csv", path.join(dir, "absent.csv"), ""]) {
      const r = await s.ask("studio:import-dropped", p);
      none.push(r && r.file === null ? "none" : JSON.stringify(r));
    }
    const refused = await s.ask("studio:import-plan", dir, {}, "");
    const took = await s.ask("studio:import-dropped", dropped);
    const plan = await s.ask("studio:import-plan", dropped, {}, "");
    s.done();
    check(none.join() === "none,none,none,none" && refused === null && took && took.file === dropped && plan !== null
          && s.calls.filter((c) => c[0] === "importPlan").length === 1,
      "2r a dropped file is kept as the import's pick and planned, and a folder, a relative path, a path to nothing and none"
      + " are no pick: " + none.join() + ", plan of the folder " + (refused === null ? "refused" : "TAKEN") + ", dropped "
      + JSON.stringify(took && took.file === dropped) + ", planned " + (plan !== null));
  }

  /* 2s THE PRELOAD'S HALF OF THE DROP (the test architect's read of 2026-10-07): 2r holds the shell's half, and the guard
     that matters is here, that the path comes from webUtils off the File and never from the page. Electron's webUtils
     answers a File's path and throws for anything else; stubbed so, the channel must hear the File's path, then "" for a
     page's string and "" for a page's object carrying a `path`. */
  {
    const files = new WeakMap(), heard = [];
    const real = new File(["Title,Body\n"], "rows.csv");
    files.set(real, path.join(SCRATCH, "dropped", "rows.csv"));
    const stub = { contextBridge: { exposeInMainWorld: (k, api) => { stub.api = api; } },
      webUtils: { getPathForFile: (f) => { if (!(f instanceof File)) throw new TypeError("not a File"); return files.get(f) || ""; } },
      ipcRenderer: { invoke: async (ch, ...a) => { heard.push([ch].concat(a)); return null; }, send() {}, on() {} } };
    const load = Module._load;
    Module._load = function (req) { return req === "electron" ? stub : load.apply(this, arguments); };
    try { delete require.cache[PRELOAD]; require(PRELOAD); } finally { Module._load = load; }
    for (const given of [real, "C:/Users/someone/elsewhere.csv", { path: "C:/Users/someone/elsewhere.csv" }])
      await stub.api.importDropped(given);
    check(JSON.stringify(heard) === JSON.stringify([["studio:import-dropped", files.get(real)], ["studio:import-dropped", ""],
      ["studio:import-dropped", ""]]),
      "2s the preload hands the shell the dropped File's own path, and nothing for a page's string or a page's {path}: "
      + JSON.stringify(heard.map(h => h[1])));
  }

  /* 2i, 2j THE PUBLISH CHANNEL'S WHITELIST, at run time (C08's read): the page may say its archive notes, the lead's note for the
     edition, an override and a first file name, and nothing else. The licence, a key to trust and a release date are this process's
     to decide (board 745). The page here also offers a licence, a trusted key, a release date and a licence file of its own; the
     thread must get the four it may say, as sent (2i), and none of the rest (2j). pendingKeys is this process's,
     the epochs kept ahead of a team file, as teamKeys is. A page that names a trialFrom, the day an evaluation period once counted
     from, is heard by nothing: the shell keeps no such day, and hands the thread none. */
  {
    const root = path.join(SCRATCH, "publish-root");
    const s = await loadShell("publish-pass", { env: { STUDIO_PROJECTS: root } });
    const said = { notes: "archive words", leadNotes: { en: "x", pl: "y" }, override: "an override", fileName: "first.ec",
                   licence: { state: "licensed" }, trustedKey: "page-key", released: "2099-01-01", licenceFile: "C:/page/own.js",
                   trialFrom: "1999-01-01" };
    await s.ask("studio:publish", "d", said);
    s.done();
    const got = s.calls.filter((c) => c[0] === "publishProject");
    const o = (got[0] && got[0][2]) || {};
    check(got.length === 1 && got[0][1] === path.join(root, "d") && JSON.stringify(o.leadNotes) === JSON.stringify({ en: "x", pl: "y" })
          && o.notes === "archive words" && o.override === "an override" && o.fileName === "first.ec",
      "2i the publish channel hands the thread the lead's note for the edition as sent, beside the notes, the override and the file name: "
      + JSON.stringify([o.notes, o.leadNotes, o.override, o.fileName]));
    /* No `mirrors` since Studio's shared-folder syncer went (A-S5): every team's place is read where it is. */
    /* seat and seen joined (review xi): this Studio's own seat certificate and what it has seen, both the process's, never the page's. */
    check(got.length === 1 && Object.keys(o).filter((k) => o[k] !== undefined).sort().join() === "fileName,leadKey,leadNotes,licenceFile,notes,override,pendingKeys,seen,teamKeys,unsealed,userData"
          && o.licenceFile !== "C:/page/own.js" && !("licence" in o) && !("trustedKey" in o) && !("released" in o)
          && !("trialFrom" in o),
      "2j the same publish hands it no licence, no key to trust, no release date and no first-run day from the page, and the licence file is the process's own: "
      + JSON.stringify(Object.keys(o).sort()) + " " + JSON.stringify(o.licenceFile));
  }

  /* 2w THE ONE DOOR'S SHELL HALF (studio-import, Clément's read, condition 3): the file picked is asked of the thread's
     bringKind and kept for the door its answer names, so a catalog is planned by the upgrade's channel and refused by the
     import's, and a sheet the reverse. The picker is answered by STUDIO_TEST_FILE, as the door's window leg answers it. */
  {
    const f = path.join(SCRATCH, "bring", "picked.txt");
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, "x");
    const door = async (kind) => {
      const s = await loadShell("bring-" + kind, { env: { STUDIO_TEST_FILE: f },
        thread: (verb) => Promise.resolve(verb === "bringKind" ? { kind } : { verb }) });
      const picked = await s.ask("studio:bring-pick", "t", "All files");
      await s.ask("studio:v1-plan", f);
      await s.ask("studio:import-plan", f, {}, "");
      s.done();
      const verbs = s.calls.map((c) => c[0]);
      return { kind: picked && picked.kind, file: picked && picked.file, asked: verbs.filter((v) => v === "bringKind").length,
               up: verbs.indexOf("upgradePlan") >= 0, imp: verbs.indexOf("importPlan") >= 0 };
    };
    const c = await door("catalog"), i = await door("import");
    check(c.kind === "catalog" && c.asked === 1 && c.up && !c.imp && path.resolve(c.file) === path.resolve(f)
          && i.kind === "import" && i.asked === 1 && i.imp && !i.up,
      "2w the door asks bringKind of the file picked and keeps it for that door alone: a catalog is planned by the upgrade"
      + " and refused by the import, a sheet the reverse: " + JSON.stringify([c, i]));
  }

  /* 2u THE SCREEN'S PUBLISH SIGNS (publish-screen-never-signs, the Studio batch of 2026-10-12): with a key this computer keeps
     under its vault, the publish hands the thread the key file and the secret the vault opened, and the plan the cover reads
     says the edition will be signed, naming the key and never carrying the secret. 2j is the same channel with no key.
     The thread is Studio's own verbs over a real project, so the replies hunted are the ones the page gets. The secret is
     looked for in 2q's four spellings in the plan, the publish reply, every "studio  " line, stdout (console.log, info and
     debug write through it) and every other stderr line and console.error, every webContents.send, every child call's argv
     and every value of its options.env, any environment value the publish added, and every file under the edition's archive
     folder and in the share folder. The hunt waits until the event loop has drained, so a send that follows the reply is
     already in the record.
     2v is the same door where signing cannot happen, or the publish fails with the secret in hand. Two failures are driven
     after the project has been read and the key has opened: the archive's name taken by a file, and the share's name taken
     by another catalog. The missing project is thrown before that try. */
  const St2 = await import(pathToFileURL(path.join(ROOT, "src", "studio.mjs")).href);
  const Sg2 = await import(pathToFileURL(path.join(ROOT, "src", "sign.mjs")).href);
  const spelt = (hex) => { const b = Buffer.from(String(hex), "hex"); return [String(hex), String(hex).toUpperCase(), b.toString("base64"), b.toString("base64url")]; };
  /* A hunt that cannot be computed is a leak, not a pass: a throw here would skip the check. */
  const holds = (needles, ...where) => {
    let text = "";
    try { text = where.map((w) => (typeof w === "string" ? w : JSON.stringify(w))).join("\n"); }
    catch (e) { return needles.length + 1; }
    return needles.filter((x) => x && text.indexOf(x) >= 0).length;
  };
  const envCopy = () => Object.assign({}, process.env);
  const drifted = (before) => Object.keys(process.env).filter((k) => process.env[k] !== before[k]).map((k) => String(process.env[k]));
  const ARCH_NAMES = ["report.json", "notes.md", "release-notes.md"];
  const archiveThere = (reply) => !!(reply && typeof reply.archive === "string") && ARCH_NAMES.every((n) => fs.existsSync(path.join(reply.archive, n)));
  /* Two turns, then half a second, so a send queued after the reply is in the record before the hunt. */
  const drained = async () => {
    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setTimeout(r, 500));
  };
  const readTree = (dir) => {
    if (!dir || typeof dir !== "string" || !fs.existsSync(dir)) return { text: "", ok: true, present: false, n: 0 };
    const parts = [];
    let ok = true, n = 0;
    const walk = (d, depth) => {
      if (depth > 8) { ok = false; return; }
      let names;
      try { names = fs.readdirSync(d); }
      catch (e) { ok = false; return; }
      for (const name of names) {
        const p = path.join(d, name);
        let st;
        try { st = fs.statSync(p); }
        catch (e) { ok = false; continue; }
        if (st.isDirectory()) walk(p, depth + 1);
        else {
          n += 1;
          try { parts.push(fs.readFileSync(p).toString("utf8")); }
          catch (e) { ok = false; }
        }
      }
    };
    try {
      const st = fs.statSync(dir);
      if (st.isDirectory()) walk(dir, 0);
      else { n = 1; parts.push(fs.readFileSync(dir).toString("utf8")); }
    } catch (e) { ok = false; }
    return { text: parts.join("\n"), ok, present: true, n };
  };
  const written = (reply) => {
    const arch = readTree(reply && typeof reply.archive === "string" ? reply.archive : "");
    const shareDir = reply && typeof reply.folder === "string" ? reply.folder
      : (reply && typeof reply.ec === "string" ? path.dirname(reply.ec) : "");
    const share = readTree(shareDir);
    return { text: arch.text + "\n" + share.text, ok: arch.ok && share.ok,
             arch: arch.present, share: share.present, archN: arch.n, shareN: share.n };
  };
  const childText = (s) => (s.children || []).map((row) => {
    const argv = Array.isArray(row) && Array.isArray(row[2]) ? row[2].join("\n") : "";
    const env = Array.isArray(row) && Array.isArray(row[3]) ? row[3].join("\n") : "";
    const whole = Array.isArray(row) && typeof row[4] === "string" ? row[4] : "";
    return argv + "\n" + env + "\n" + whole;
  }).join("\n");
  const sentText = (s) => (s.sent || []).map((a) => Array.isArray(a)
    ? a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join("\n") : String(a)).join("\n");
  const surfaces = (s) => [s.said.join("\n"), (s.logged || []).join("\n"), childText(s), sentText(s), s.sent || [], s.children || []];
  const realThread = (verb, ...a) => St2[verb](...a);
  const signProject = async (name) => {
    const made = await St2.newProject(path.join(SCRATCH, name, "projects"), "Signed", [{ code: "en", name: "English" }]);
    const shelf = (await St2.addTag(made.dir, "shelf", { en: "General" })).tag.id;
    await St2.addCard(made.dir, shelf, "Widuma tosork", "Sarnesk kelbun.");
    const share = path.join(SCRATCH, name, "share");
    fs.mkdirSync(share, { recursive: true });
    await St2.setPublishFolder(made.dir, share);
    return made.dir;
  };
  {
    const ud = path.join(SCRATCH, "publish-signed");
    const at = St2.defaultKeyFile(ud), pair = await Sg2.makePair();
    fs.mkdirSync(path.dirname(at), { recursive: true });
    fs.writeFileSync(at, JSON.stringify(Sg2.osFile(pair, FAKE_VAULT_STORAGE.encryptString(pair.der)), null, 1));
    const dir = await signProject("publish-signed-project");
    const s = await loadShell("publish-signed", { thread: realThread, env: projectsBeside(dir) });
    const envBefore = envCopy();
    const reply = await s.ask("studio:publish", dir, { notes: "n", key: "C:/page/key.json", passphrase: "page" });
    const plan = await s.ask("studio:publish-plan", dir);
    await drained();
    const envAdded = drifted(envBefore);
    const files = written(reply);
    s.done();
    const o = (s.calls.find((c) => c[0] === "publishProject") || [])[2] || {};
    const sg = (plan && plan.signing) || {};
    const ec = reply && !reply.error && reply.ec ? JSON.parse(fs.readFileSync(reply.ec, "utf8")) : null;
    const kept = archiveThere(reply);
    const leaks = holds(spelt(pair.der), plan, reply, files.text, envAdded.join("\n"), ...surfaces(s)) + (files.ok ? 0 : 1);
    check(o.key === at && o.passphrase === String(pair.der) && sg.opens === true && sg.keyId === Sg2.readKeyFile(at).keyId
          && !!ec && !!ec.sig && ec.sig.keyId === sg.keyId && kept && files.arch && files.share && leaks === 0,
      "2u with a key this computer keeps, the publish hands the thread its own key file and the secret its vault opened, not"
      + " the page's, the edition is signed with it, and the cover's plan says so; the secret is in none of four spellings in"
      + " the plan, the reply, stdout, the log, a send, a child's argv or environment, this process's environment, or any file"
      + " of the edition (" + files.archN + ") or the share (" + files.shareN + "): "
      + JSON.stringify([o.key === at, o.passphrase === String(pair.der), sg.opens, !!sg.keyId, !!(ec && ec.sig), kept, files.arch && files.share, leaks]));
    /* Four spellings of one fixed secret, chosen so base64 and base64url differ. A random key can
       have those two equal, and then dropping one spelling still leaves leaks at 0. */
    const raw = Buffer.from([0xfb, 0xef, 0xff]);
    const four = spelt(raw.toString("hex"));
    const each = four.map((s) => holds(four, "pad " + s + " pad"));
    check(new Set(four).size === 4 && each.every((n) => n === 1) && holds(four, "no secret") === 0,
      "2u1 a fixed secret has four different spellings, and a surface that carries any one of them is a leak: "
      + JSON.stringify({ n: four.length, distinct: new Set(four).size, each }));
  }

  /* 2v THE SAME DOOR WHERE SIGNING CANNOT HAPPEN, OR THE PUBLISH FAILS WITH THE SECRET IN HAND. Bytes the vault opens that are
     not the key go out unsigned and the cover says the key did not open, never Signed; a key file that cannot be read says
     so, not "no key yet". A missing project throws before publishProject's try. The fourth case is inside that try: the
     project is read, the secret is handed on because the key opens, and the publisher then refuses because that edition's
     name is already taken in the archive. The name is taken by a file: a directory is an edition, and stampEdition steps
     past it, so the refusal would land before the key is opened. The fifth is the share's own taken name, also after the
     key has opened. The error the page gets carries none of the secret, and neither do stdout, the log, a send, a child's
     argv or environment, or any file the publish wrote. */
  {
    const ud = path.join(SCRATCH, "publish-unsigned");
    const at = St2.defaultKeyFile(ud), pair = await Sg2.makePair(), garbage = "0badc0ffee";
    fs.mkdirSync(path.dirname(at), { recursive: true });
    fs.writeFileSync(at, JSON.stringify(Sg2.osFile(pair, FAKE_VAULT_STORAGE.encryptString(garbage)), null, 1));
    const dir = await signProject("publish-unsigned-project");
    const s1 = await loadShell("publish-unsigned", { thread: realThread, env: projectsBeside(dir) });
    const env1 = envCopy();
    const r1 = await s1.ask("studio:publish", dir, {});
    const p1 = await s1.ask("studio:publish-plan", dir);
    await drained();
    const added1 = drifted(env1);
    const files1 = written(r1);
    s1.done();
    const o1 = (s1.calls.find((c) => c[0] === "publishProject") || [])[2] || {};
    const g1 = (p1 && p1.signing) || {};
    const ec1 = r1 && !r1.error && r1.ec ? JSON.parse(fs.readFileSync(r1.ec, "utf8")) : null;
    fs.writeFileSync(at, "{ not a key file");
    const s2 = await loadShell("publish-unsigned", { thread: realThread, env: projectsBeside(dir) });
    const p2 = await s2.ask("studio:publish-plan", dir);
    const r2 = await s2.ask("studio:publish", dir, {});
    await drained();
    s2.done();
    const o2 = (s2.calls.find((c) => c[0] === "publishProject") || [])[2] || {};
    const g2 = (p2 && p2.signing) || {};
    fs.writeFileSync(at, JSON.stringify(Sg2.osFile(pair, FAKE_VAULT_STORAGE.encryptString(pair.der)), null, 1));
    const s3 = await loadShell("publish-unsigned", { thread: realThread, env: projectsBeside(dir) });
    const env3 = envCopy();
    const r3 = await s3.ask("studio:publish", path.join(path.dirname(dir), "no-such-project"), {});
    await drained();
    const added3 = drifted(env3);
    const files3 = written(r3);
    s3.done();
    const o3 = (s3.calls.find((c) => c[0] === "publishProject") || [])[2] || {};
    const Pub = await import(pathToFileURL(path.join(ROOT, "src", "publish.mjs")).href);
    const dir4 = await signProject("publish-inner");
    const read4 = Pub.readProject(dir4);
    const edition4 = Pub.stampEdition(Pub.editionRules(null), read4.project.edition || read4.draft.date || "", Pub.editionsIn(dir4));
    fs.mkdirSync(path.join(dir4, Pub.ARCHIVE), { recursive: true });
    fs.writeFileSync(path.join(dir4, Pub.ARCHIVE, edition4), "");
    const s4 = await loadShell("publish-unsigned", { thread: realThread, env: projectsBeside(dir4) });
    const env4 = envCopy();
    const r4 = await s4.ask("studio:publish", dir4, {});
    await drained();
    const added4 = drifted(env4);
    const files4 = written(r4);
    s4.done();
    const o4 = (s4.calls.find((c) => c[0] === "publishProject") || [])[2] || {};
    /* The share already holds this file name for a different catalog. The name is fixed on the project, so the publisher
       cannot step aside to a free one, and the refusal is after the key has opened. */
    const dir5 = await signProject("publish-taken");
    const share5 = path.join(SCRATCH, "publish-taken", "share");
    const projAt = path.join(dir5, Pub.PROJECT_FILE);
    const proj = JSON.parse(fs.readFileSync(projAt, "utf8"));
    proj.fileName = "taken-name.ec";
    fs.writeFileSync(projAt, JSON.stringify(proj));
    fs.writeFileSync(path.join(share5, "taken-name.ec"), "{\"id\":\"c-not-this-catalog\"}\n");
    const s5 = await loadShell("publish-unsigned", { thread: realThread, env: projectsBeside(dir5) });
    const env5 = envCopy();
    const r5 = await s5.ask("studio:publish", dir5, {});
    await drained();
    const added5 = drifted(env5);
    const files5 = written(r5);
    s5.done();
    const o5 = (s5.calls.find((c) => c[0] === "publishProject") || [])[2] || {};
    const taken = o5.passphrase === String(pair.der) && !!(r5 && r5.error) && /another catalog/.test(String(r5.error));
    const readable = files1.ok && files3.ok && files4.ok && files5.ok;
    const leaks = holds(spelt(garbage), p1, r1, files1.text, added1.join("\n"), ...surfaces(s1))
      + holds(spelt(pair.der), r3, files3.text, added3.join("\n"), ...surfaces(s3))
      + holds(spelt(pair.der), r4, files4.text, added4.join("\n"), ...surfaces(s4))
      + holds(spelt(pair.der), r5, files5.text, added5.join("\n"), ...surfaces(s5))
      + (readable ? 0 : 1);
    check(g1.opens === false && !!g1.keyId && !("passphrase" in o1) && !!ec1 && !ec1.sig
          && g2.opens === false && g2.unreadable === true && !g2.keyId && !("passphrase" in o2) && !!(r2 && !r2.error)
          && o3.passphrase === String(pair.der) && !!r3 && !!r3.error
          && o4.passphrase === String(pair.der) && !!(r4 && r4.error) && taken && leaks === 0,
      "2v bytes that do not open the key go out unsigned and the plan says it did not open; an unreadable key file says so and"
      + " goes out unsigned; a missing project, the archive's taken name and the share's taken name each reply with an error"
      + " after the secret was in hand, and none of the replies, stdout, the log, a send, a child's argv or environment, or a"
      + " file the publish wrote carries a spelling of what the vault opened: "
      + JSON.stringify([g1.opens, !!g1.keyId, "passphrase" in o1, !!(ec1 && ec1.sig), g2.unreadable, !!(r2 && !r2.error), !!(r3 && r3.error), !!(r4 && r4.error), taken, leaks]));
    /* The missing project throws before publishProject's try, and the shell's guard turns that throw into an error
       the page can read, so deleting the try stays green on 2v. A lint refusal is returned only from inside the try. */
    const dirL = await signProject("publish-lint");
    const draftAt = path.join(dirL, "draft.json");
    const draft = JSON.parse(fs.readFileSync(draftAt, "utf8"));
    draft.cards[0].title.en = "";
    fs.writeFileSync(draftAt, JSON.stringify(draft));
    let back;
    try { back = await St2.publishProject(dirL, await licensedOpts()); }
    catch (e) { back = { threw: String(e && (e.refusal || e.message) || e) }; }
    check(back && back.refused === "lint" && Array.isArray(back.errors) && back.errors.length > 0 && !back.threw,
      "2v1 a catalog the lint refuses comes back from publishProject as a refusal, which is the try, and is not thrown past it: "
      + JSON.stringify(back && { refused: back.refused, errors: back.errors && back.errors.length, threw: back.threw || "" }));
  }

  /* 2k, 2l THE TEAM KEYS (board 834, the sealed team): kept in the process's own teams.json, sealed by safeStorage and opened
     here for one call. The publish and the review queue's three doors are handed them, with the lead's key file and Plain
     teams; what the page sends under those names is not taken. */
  {
    const K = await import(pathToFileURL(path.join(ROOT, "src", "team-store.mjs")).href);
    const St = await import(pathToFileURL(path.join(ROOT, "src", "studio.mjs")).href);
    const vault = { available: () => true, seal: (t) => FAKE_VAULT_STORAGE.encryptString(t), open: (b) => FAKE_VAULT_STORAGE.decryptString(b) };
    const TEAM = "t-0123456789abcdef", PLAIN = "t-fedcba9876543210", key = Buffer.alloc(32, 7);
    const ud = path.join(SCRATCH, "team-keys");
    fs.mkdirSync(ud, { recursive: true });
    K.keepTeamKey(K.teamsFile(ud), vault, TEAM, 2, key);
    K.chooseSealed(K.teamsFile(ud), PLAIN, false, ud);
    const s = await loadShell("team-keys", { signedIn: true });
    await s.ask("studio:publish", "d", { notes: "n", teamKeys: { [TEAM]: { 2: Buffer.alloc(32, 9) } }, leadKey: "C:/page/key.json",
                                          unsealed: [TEAM] });
    await s.ask("studio:proposals", "d");
    const proposal = path.join(ud, "Etiuda Studio", "d", "inbox", "f");
    await s.ask("studio:proposal-open", "d", proposal, "en");
    await s.ask("studio:proposal-decide", "d", proposal, {}, "", null);
    s.done();
    const call = (v) => s.calls.find((c) => c[0] === v) || [];
    const keyIn = (o) => !!o && !!o.teamKeys && !!o.teamKeys[TEAM] && !!o.teamKeys[TEAM][2] && Buffer.from(o.teamKeys[TEAM][2]).equals(key);
    const p = call("publishProject")[2] || {};
    check(keyIn(p) && JSON.stringify(p.unsealed) === JSON.stringify([PLAIN]) && p.leadKey === St.defaultKeyFile(ud),
      "2k the publish channel hands the thread the team key opened from this process's teams.json, its Plain teams and its own"
      + " key file, and none of the three the page sent: " + JSON.stringify([keyIn(p), p.unsealed, p.leadKey === St.defaultKeyFile(ud)]));
    check(keyIn(call("listProposals")[2]) && keyIn(call("openProposal")[3]) && keyIn(call("decideProposal")[6]),
      "2l the review queue's listing, opening and deciding are each handed the same key, so a desk's sealed file is a row: "
      + JSON.stringify([keyIn(call("listProposals")[2]), keyIn(call("openProposal")[3]), keyIn(call("decideProposal")[6])]));
  }

  /* RETIRED 2026-11-26 with studio:team-sealed (the pass over the retired folder mechanics), 2m and 2n, THE SWITCH'S ORDER (board 834, the sealed team): "2m Sealed on a
     folder with no team keeps the new team's key before the thread writes the file, records the lead's choice after, hands the thread that key to keep the recovery copy, and
     takes no passphrase from the page" and "2n where the thread's write fails, the key kept for it is taken out again and the refusal reaches the page". The same order
     for the team the press makes now, the relay's, is held by relay-studio rs926 (the key kept before the thread is asked, forgotten with the team file on a throw). */

  /* RETIRED, P2 (an admission is no longer made by a code typed in a row, so there is no studio:desk-admit): 2o, "an admission hands the thread the team key opened from this process's teams.json and not the one the page sent, keeps no passphrase from the page, and the team file it wrote becomes the kept copy, the lead's Sealed unchanged"; and 2p, "for a team this Studio keeps a key for but whose Sealed or Plain was never chosen here, the admission records no choice, so no publish reads it as Plain". The watch's admission (admitWaiting) is held where its own legs hold it. */
  /* 2x, 2y, 2z, 2za A REMOVAL (board 885, S1): without the confirm the thread is not asked; with it the thread is handed
     the team key this process keeps, never one the page stuffed beside the confirm, and the new key is kept beside the
     old one. The reply carries neither key. The statistics channel is the same door: the page cannot name the keys. */
  {
    const K = await import(pathToFileURL(path.join(ROOT, "src", "team-store.mjs")).href);
    const vault = { available: () => true, seal: (t) => FAKE_VAULT_STORAGE.encryptString(t), open: (b) => FAKE_VAULT_STORAGE.decryptString(b) };
    const TEAM = "t-00112233445566aa", MEMBER = "k-0011223344556677";
    const key = Buffer.alloc(32, 5), pageKey = Buffer.alloc(32, 9), fresh = Buffer.alloc(32, 7);
    const name = "member-remove";
    fs.mkdirSync(path.join(SCRATCH, name), { recursive: true });
    const at = K.teamsFile(path.join(SCRATCH, name));
    K.keepTeamKey(at, vault, TEAM, 1, key);
    K.chooseSealed(at, TEAM, true, path.join(SCRATCH, name, "share"), { id: TEAM, epoch: 1, roster: [] });
    const was = fs.readFileSync(at, "utf8");
    const spell = (buf) => [buf.toString("hex"), buf.toString("hex").toUpperCase(), buf.toString("base64"), buf.toString("base64url")];
    const spells = spell(key).concat(spell(pageKey), spell(fresh));
    const s = await loadShell(name, { signedIn: true, thread: (verb) => {
      if (verb === "removeMember") return Promise.resolve({
        folder: path.join(SCRATCH, name, "share"), team: { id: TEAM, epoch: 2, roster: [] },
        removed: MEMBER, written: { id: TEAM, epoch: 2, roster: [] }, teamKey: Buffer.from(fresh), resealed: [], epoch: 2 });
      if (verb === "statsFor") return Promise.resolve({ folder: "f", head: [], rows: [], refused: [], unopened: [] });
      return Promise.resolve({ verb });
    } });
    const quiet = await s.ask("studio:member-remove", "d", TEAM, MEMBER, false, { teamKeys: { [TEAM]: { 1: pageKey } } });
    const omitted = await s.ask("studio:member-remove", "d", TEAM, MEMBER);
    const quietCalls = s.calls.filter((c) => c[0] === "removeMember").length;
    const quietText = JSON.stringify(quiet) + JSON.stringify(omitted);
    check(quiet.removed === false && quiet.refused === "not confirmed" && !quiet.error
          && omitted.removed === false && omitted.refused === "not confirmed"
          && quietCalls === 0 && fs.readFileSync(at, "utf8") === was
          && !("teamKey" in quiet) && !spells.some((x) => quietText.indexOf(x) >= 0),
      "2x without the confirm the thread is not asked, teams.json is unchanged, and the reply carries no key: "
      + JSON.stringify([quiet.removed, quiet.refused, quietCalls, fs.readFileSync(at, "utf8") === was]));
    const r = await s.ask("studio:member-remove", "d", TEAM, MEMBER, true, { teamKeys: { [TEAM]: { 1: pageKey } } });
    const call = s.calls.find((c) => c[0] === "removeMember") || [];
    const handed = call[6] && call[6].teamKeys && call[6].teamKeys[TEAM] && Buffer.from(call[6].teamKeys[TEAM][1]).equals(key);
    const notPage = !(call[6] && call[6].teamKeys && call[6].teamKeys[TEAM]
      && Buffer.from(call[6].teamKeys[TEAM][1]).equals(pageKey));
    const reply = JSON.stringify(r);
    check(!!handed && notPage && call[6].confirm === true && r.removed === MEMBER && !r.error
          && !("teamKey" in r) && !("written" in r) && !spells.some((x) => reply.indexOf(x) >= 0),
      "2y the confirm hands the thread the key opened from teams.json and not the one the page sent, and the reply"
      + " carries neither key: " + JSON.stringify([!!handed, notPage, !("teamKey" in r), r.removed]));
    const got = K.teamKeysOf(at, vault), kept = K.keptTeam(at, TEAM);
    check(JSON.stringify(kept.epochs) === "[1,2]" && Buffer.isBuffer(got[TEAM][1]) && got[TEAM][1].equals(key)
          && Buffer.isBuffer(got[TEAM][2]) && got[TEAM][2].equals(fresh),
      "2z the epoch just closed keeps its key, and the new epoch keeps the key the thread returned: "
      + JSON.stringify(kept.epochs));
    const st = await s.ask("studio:stats", "d", { teamKeys: { [TEAM]: { 1: pageKey } } });
    const sc = s.calls.find((c) => c[0] === "statsFor") || [];
    const statsHanded = sc[2] || {};
    const pageHex = pageKey.toString("hex");
    check(sc.length === 3 && typeof statsHanded.key === "string" && statsHanded.key.endsWith("signing-key.json")
          && statsHanded.passphrase === "" && !statsHanded.teamKeys
          && JSON.stringify(statsHanded).indexOf(pageHex) < 0 && !("teamKey" in (st || {})),
      "2za statistics are read with this process's signing key, and a team key the page sent is not handed over: "
      + JSON.stringify([statsHanded.key, statsHanded.passphrase, !!statsHanded.teamKeys, sc.length]));
    s.done();
  }

  /* 2zb A REMOVAL ON A COMPUTER THAT CANNOT KEEP THE NEW KEY (board 885, S1, the read's E6): refused before the thread is
     asked, so the epoch never moves to a key nothing here could hold, and teams.json is as it was. */
  {
    const K = await import(pathToFileURL(path.join(ROOT, "src", "team-store.mjs")).href);
    const vault = { available: () => true, seal: (t) => FAKE_VAULT_STORAGE.encryptString(t), open: (b) => FAKE_VAULT_STORAGE.decryptString(b) };
    const TEAM = "t-00112233445566ab", MEMBER = "k-0011223344556677", name = "member-remove-no-vault";
    fs.mkdirSync(path.join(SCRATCH, name), { recursive: true });
    const at = K.teamsFile(path.join(SCRATCH, name));
    K.keepTeamKey(at, vault, TEAM, 1, Buffer.alloc(32, 5));
    const was = fs.readFileSync(at);
    const s = await loadShell(name, { safeStorage: Object.assign({}, FAKE_VAULT_STORAGE, { isEncryptionAvailable: () => false }),
      thread: (verb) => verb === "removeMember"
        ? Promise.resolve({ removed: MEMBER, team: { id: TEAM, epoch: 2, roster: [] }, teamKey: Buffer.alloc(32, 7), epoch: 2 })
        : Promise.resolve({ verb }) });
    const r = await s.ask("studio:member-remove", "d", TEAM, MEMBER, true);
    s.done();
    const asked = s.calls.filter((c) => c[0] === "removeMember").length;
    check(!!r && /cannot keep a team key/.test(String(r.error || "")) && r.removed === undefined && asked === 0
          && fs.readFileSync(at).equals(was),
      "2zb with the confirm, on a computer whose safeStorage cannot encrypt, the removal is refused as a computer that cannot keep"
      + " a team key, the thread is not asked and teams.json is as it was: " + JSON.stringify([r && r.error, asked]));
  }

  /* 2zc THE ORDER OF A REMOVAL (finding 4, sequence A): the new key is in teams.json before removeMember is asked, so a
     stop between the ask and the reply cannot leave the share on a key this Studio does not hold. A write the thread
     refuses leaves that key kept, and the retry hands the same key again. */
  {
    const K = await import(pathToFileURL(path.join(ROOT, "src", "team-store.mjs")).href);
    const vault = { available: () => true, seal: (t) => FAKE_VAULT_STORAGE.encryptString(t), open: (b) => FAKE_VAULT_STORAGE.decryptString(b) };
    const TEAM = "t-00112233445566ac", MEMBER = "k-0011223344556678", name = "member-remove-order";
    fs.mkdirSync(path.join(SCRATCH, name), { recursive: true });
    const at = K.teamsFile(path.join(SCRATCH, name));
    const key = Buffer.alloc(32, 5);
    K.keepTeamKey(at, vault, TEAM, 1, key);
    K.chooseSealed(at, TEAM, true, path.join(SCRATCH, name, "share"), { id: TEAM, epoch: 1, roster: [] });
    const seen = { failKept: false, retryKept: false };
    let phase = "fail", handed = null, firstKey = null;
    const s = await loadShell(name, { thread: (verb, ...args) => {
      if (verb === "teamFacts") return Promise.resolve({ folder: path.join(SCRATCH, name, "share"), file: "ours",
        team: { id: TEAM, epoch: 1, roster: [{ id: MEMBER }] }, signing: "k", inside: false, mark: null, id: "c" });
      if (verb === "removeMember") {
        const o = args[5] || {};
        const keptNow = (K.teamKeysOf(at, vault)[TEAM] || {})[2];
        const same = !!(keptNow && o.nextKey && Buffer.from(o.nextKey).equals(Buffer.from(keptNow)) && o.nextEpoch === 2);
        if (phase === "fail") {
          seen.failKept = same;
          if (o.nextKey) firstKey = Buffer.from(o.nextKey);
          phase = "retry";
          return Promise.reject(new Error("the share refused the write"));
        }
        if (o.nextKey) handed = Buffer.from(o.nextKey);
        seen.retryKept = same && !!(firstKey && handed && handed.equals(firstKey));
        return Promise.resolve({ folder: path.join(SCRATCH, name, "share"), team: { id: TEAM, epoch: 2, roster: [] },
          removed: MEMBER, written: { id: TEAM, epoch: 2, roster: [] },
          teamKey: o.nextKey ? Buffer.from(o.nextKey) : Buffer.alloc(32, 7), resealed: [], epoch: 2 });
      }
      if (verb === "statsFor") return Promise.resolve({ folder: "f", head: [], rows: [], refused: [], unopened: [] });
      return Promise.resolve({ verb });
    } });
    const first = await s.ask("studio:member-remove", "d", TEAM, MEMBER, true);
    const mid = K.keptTeam(at, TEAM);
    const second = await s.ask("studio:member-remove", "d", TEAM, MEMBER, true);
    s.done();
    const got = K.teamKeysOf(at, vault)[TEAM] || {};
    check(seen.failKept === true && !!first && /share refused/.test(String(first.error || ""))
          && !!mid && JSON.stringify(mid.epochs) === "[1,2]"
          && seen.retryKept === true && !!second && second.removed === MEMBER && !second.error && !("teamKey" in second)
          && Buffer.isBuffer(got[1]) && got[1].equals(key) && Buffer.isBuffer(got[2]) && !!handed && got[2].equals(handed)
          && !!firstKey && got[2].equals(firstKey),
      "2zc the new team key is kept before the thread is asked to move the share; a refused write leaves that key kept, and"
      + " the retry reuses it: " + JSON.stringify([seen.failKept, first && first.error,
        mid && mid.epochs, seen.retryKept, second && second.removed, "teamKey" in (second || {})]));
  }

  /* 2zd A REPLY LOST AFTER THE WRITE (finding 4, the edit named before trust F4 merges): removeMember runs for real and
     writes, the share moves under the key this Studio kept, and the invitation is spent, and then the thread's reply
     never arrives. The key stays kept and the invitation stays spent. */
  {
    const St = await import(pathToFileURL(path.join(ROOT, "src", "studio.mjs")).href);
    const T = await import(pathToFileURL(path.join(ROOT, "src", "team.mjs")).href);
    const K = await import(pathToFileURL(path.join(ROOT, "src", "team-store.mjs")).href);
    const Sg = await import(pathToFileURL(path.join(ROOT, "src", "sign.mjs")).href);
    const { jsonText } = await import(pathToFileURL(path.join(ROOT, "src", "plain-json.mjs")).href);
    const vault = { available: () => true, seal: (t) => FAKE_VAULT_STORAGE.encryptString(t), open: (b) => FAKE_VAULT_STORAGE.decryptString(b) };
    const rawPublic = (k) => crypto.createPublicKey(k).export({ type: "spki", format: "der" }).subarray(-32);
    const newDesk = (deskName) => {
      const sign = crypto.generateKeyPairSync("ed25519"), box = crypto.generateKeyPairSync("x25519");
      const pub = rawPublic(sign.privateKey).toString("hex");
      const id = "k-" + crypto.createHash("sha256").update(Buffer.from(pub, "hex")).digest("hex").slice(0, 16);
      return { id, block: { id, key: pub, box: rawPublic(box.privateKey).toString("hex"), name: deskName }, signKey: sign.privateKey };
    };
    const ownFile = (by) => {
      const doc = { desk: JSON.parse(JSON.stringify(by.block)) };
      doc.sig = { alg: "Ed25519", keyId: doc.desk.id };
      doc.sig.value = crypto.sign(null, Engine.deskRules().branchSignedBytes(doc), by.signKey).toString("hex");
      return doc;
    };
    const name = "member-remove-reply";
    const ud = path.join(SCRATCH, name), share = path.join(ud, "share");
    fs.mkdirSync(share, { recursive: true });
    const pair = await Sg.makePair();
    const keyAt = Sg.defaultKeyFile(ud);
    fs.writeFileSync(keyAt, JSON.stringify(Sg.osFile(pair, FAKE_VAULT_STORAGE.encryptString(pair.der)), null, 1) + "\n");
    const opened = await St.newProject(path.join(ud, "projects"), "Cedar press", [{ code: "en", name: "English" }]);
    St.setPublishFolder(opened.dir, share);
    const nia = newDesk("Nia");
    const TEAM = "t-" + crypto.randomBytes(8).toString("hex");
    const key1 = crypto.randomBytes(32);
    const invite = crypto.randomBytes(8).toString("hex");
    let team = T.newTeam({ id: TEAM, catalogs: [opened.draft.id], lead: { keyId: pair.keyId, public: pair.public },
      sealed: true, exportsSealed: true });
    team = T.admit(team, ownFile(nia), nia.id, key1);
    team.roster.find((e) => e.desk.id === nia.id).invite = invite;
    await T.writeTeam(share, team, { key: keyAt, passphrase: pair.der });
    /* A catalog the lead signed, as a folder team's mirror takes only a genuine edition (board 945 stage 3 (b)). */
    const edition = await Sg.signDocument({ format: 2, kind: "etiuda-catalog", id: "c-cedar-press", rev: 1, edition: "2026-10-04" },
      Sg.unlockKey(Sg.readKeyFile(keyAt), pair.der));
    fs.writeFileSync(path.join(share, "cedar-press.ec"), jsonText(Engine.sealRules().sealCatalog(key1, TEAM, 1, JSON.stringify(edition))));
    const at = K.teamsFile(ud);
    K.keepTeamKey(at, vault, TEAM, 1, key1);
    K.chooseSealed(at, TEAM, true, share, { id: TEAM, epoch: 1, roster: [] });
    K.keepInvite(at, vault, TEAM, { id: invite, secret: crypto.randomBytes(16).toString("hex"),
      made: "2026-10-04T00:00:00.000Z", expires: "2026-11-04T00:00:00.000Z", name: "bench pass" });
    let handed = null;
    const s = await loadShell(name, { env: projectsBeside(opened.dir), thread: async (verb, ...args) => {
      if (verb === "teamFacts") return St.teamFacts(args[0], args[1]);
      if (verb === "removeMember") {
        const o = args[5] || {};
        if (o.nextKey) handed = Buffer.from(o.nextKey);
        await St.removeMember(...args);
        throw new Error("the reply did not come back");
      }
      return { verb };
    } });
    const first = await s.ask("studio:member-remove", opened.dir, TEAM, nia.id, true);
    /* A folder team's removal writes its mirror, and the share takes it from the outbox (board 945 stage 3 (b)): waited out. */
    for (let i = 0; i < 500; i++) {
      let e2 = false;
      try { e2 = JSON.parse(fs.readFileSync(path.join(share, "etiuda-team.json"), "utf8")).epoch === 2
        && JSON.parse(fs.readFileSync(path.join(share, "cedar-press.ec"), "utf8")).epoch === 2; } catch { e2 = false; }
      if (e2) break;
      await new Promise((r) => setTimeout(r, 50));
    }
    s.done();
    const got = K.teamKeysOf(at, vault)[TEAM] || {};
    const held2 = Buffer.isBuffer(got[2]) ? got[2] : null;
    let openedText = null;
    try { openedText = Engine.sealRules().openSealed(held2, JSON.parse(fs.readFileSync(path.join(share, "cedar-press.ec"), "utf8"))); }
    catch { openedText = null; }
    const heldNow = await T.heldTeam(share, { key: keyAt });
    const epoch2 = !!(heldNow.team && heldNow.team.epoch === 2);
    const inv = K.invitesOf(at, TEAM).find((i) => i.id === invite) || null;
    const spent = !!inv && inv.state === "spent" && !K.inviteSecretOf(at, vault, TEAM, invite);
    const keyHeld = !!(held2 && handed && held2.equals(handed) && openedText && openedText.indexOf("c-cedar-press") >= 0);
    check(!!first && /reply did not come back/.test(String(first.error || "")) && epoch2 && keyHeld && spent,
      "2zd a reply lost after the removal has written leaves the share's next key kept and the invitation spent: "
      + JSON.stringify([first && first.error, epoch2, keyHeld, spent, inv && inv.state]));
  }

  /* 2ze A RESEAL REFUSED AFTER THE TEAM FILE LANDED IS COMPLETED BY THE WATCH (board 974, C2): the removal runs for real on a
     folder team, and the write of the edition it reseals is refused EBUSY at its sibling (src/whole-write.cjs writeWhole) for as
     long as the press runs, so the press answers with the refusal while the team file at key number 2 has landed. With the
     refusal gone, one focus, and no publish, puts that edition on the share sealed at key number 2: the key this Studio kept
     opens it and key number 1, which the removed desk still holds, does not. */
  {
    const St = await import(pathToFileURL(path.join(ROOT, "src", "studio.mjs")).href);
    const T = await import(pathToFileURL(path.join(ROOT, "src", "team.mjs")).href);
    const K = await import(pathToFileURL(path.join(ROOT, "src", "team-store.mjs")).href);
    const Sg = await import(pathToFileURL(path.join(ROOT, "src", "sign.mjs")).href);
    const { jsonText } = await import(pathToFileURL(path.join(ROOT, "src", "plain-json.mjs")).href);
    const vault = { available: () => true, seal: (t) => FAKE_VAULT_STORAGE.encryptString(t), open: (b) => FAKE_VAULT_STORAGE.decryptString(b) };
    const rawPublic = (k) => crypto.createPublicKey(k).export({ type: "spki", format: "der" }).subarray(-32);
    const newDesk = (deskName) => {
      const sign = crypto.generateKeyPairSync("ed25519"), box = crypto.generateKeyPairSync("x25519");
      const pub = rawPublic(sign.privateKey).toString("hex");
      const id = "k-" + crypto.createHash("sha256").update(Buffer.from(pub, "hex")).digest("hex").slice(0, 16);
      return { id, block: { id, key: pub, box: rawPublic(box.privateKey).toString("hex"), name: deskName }, signKey: sign.privateKey };
    };
    const ownFile = (by) => {
      const doc = { desk: JSON.parse(JSON.stringify(by.block)) };
      doc.sig = { alg: "Ed25519", keyId: doc.desk.id };
      doc.sig.value = crypto.sign(null, Engine.deskRules().branchSignedBytes(doc), by.signKey).toString("hex");
      return doc;
    };
    const name = "member-remove-reseal";
    const ud = path.join(SCRATCH, name), share = path.join(ud, "share");
    fs.mkdirSync(share, { recursive: true });
    const pair = await Sg.makePair();
    const keyAt = Sg.defaultKeyFile(ud);
    fs.writeFileSync(keyAt, JSON.stringify(Sg.osFile(pair, FAKE_VAULT_STORAGE.encryptString(pair.der)), null, 1) + "\n");
    const opened = await St.newProject(path.join(ud, "projects"), "Juniper press", [{ code: "en", name: "English" }]);
    St.setPublishFolder(opened.dir, share);
    const ivo = newDesk("Ivo"), ema = newDesk("Ema");
    const TEAM = "t-" + crypto.randomBytes(8).toString("hex");
    const key1 = crypto.randomBytes(32);
    let team = T.newTeam({ id: TEAM, catalogs: [opened.draft.id], lead: { keyId: pair.keyId, public: pair.public },
      sealed: true, exportsSealed: true });
    team = T.withChannel(team, { kind: "relay", rt: "6d".repeat(16), url: "https://etiuda.dev" }, { format: 1, kind: "etiuda-ring", keys: [] }); /* on the relay (was: a team kept for a shared folder, which the watch no longer looks at; the folder team's removal) */
    team = T.admit(T.admit(team, ownFile(ivo), ivo.id, key1), ownFile(ema), ema.id, key1);
    await T.writeTeam(share, team, { key: keyAt, passphrase: pair.der });
    const edition = await Sg.signDocument({ format: 2, kind: "etiuda-catalog", id: "c-juniper-press", rev: 1, edition: "2026-10-04" },
      Sg.unlockKey(Sg.readKeyFile(keyAt), pair.der));
    const EC = "juniper-press.ec";
    fs.writeFileSync(path.join(share, EC), jsonText(Engine.sealRules().sealCatalog(key1, TEAM, 1, JSON.stringify(edition))));
    const at = K.teamsFile(ud);
    K.keepTeamKey(at, vault, TEAM, 1, key1);
    K.chooseSealed(at, TEAM, true, share, { id: TEAM, epoch: 1, roster: [] });
    { const doc = JSON.parse(fs.readFileSync(at, "utf8")); doc.teams[TEAM].relay = { rt: "6d".repeat(16), url: "https://etiuda.dev" }; fs.writeFileSync(at, JSON.stringify(doc, null, 1) + String.fromCharCode(10)); }
    const readEnv = (file) => { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; } };
    const opens = (file, k) => { try { return k ? Engine.sealRules().openSealed(k, readEnv(file)) : null; } catch { return null; } };
    /* The team is on the relay and no relay is reached: the switch counts the catch-up as run and the move as held, so the removal goes ahead
       and stands, as it did on the shared folder this leg was written on (a Remove on a relay team waits otherwise). */
    const s = await loadShell(name, { thread: realThread, env: Object.assign({ STUDIO_TEST_RELAY_CAUGHT_UP: "1" }, projectsBeside(opened.dir)) });
    const realOpen = fs.openSync;
    let refusedAt = "";
    fs.openSync = function (p, ...a) {
      if (typeof p === "string" && path.basename(p).indexOf(EC + ".") === 0 && /\.tmp$/i.test(p)) {
        refusedAt = path.dirname(p);
        const err = new Error("EBUSY: resource busy or locked, open '" + p + "'");
        err.code = "EBUSY";
        throw err;
      }
      return realOpen.call(this, p, ...a);
    };
    let first = null;
    try { first = await s.ask("studio:member-remove", opened.dir, TEAM, ivo.id, true); }
    finally { fs.openSync = realOpen; }
    const work = refusedAt || share;
    const mid = { team: (readEnv(path.join(work, "etiuda-team.json")) || {}).epoch, ec: (readEnv(path.join(work, EC)) || {}).epoch };
    const calls0 = s.calls.length;
    await s.fire("winOn", "focus");
    /* The watch reseals the mirror and the share takes it from the outbox. What is waited on is the condition the check judges
       (the edition at key number 2, opening with the key kept for it and not with key number 1), not a fixed number of looks:
       it ends the moment that holds, and gives up after ninety seconds, a load's allowance (a fixed twenty-five seconds went red
       once beside other runs and green alone), saying below which of the two was still false and what the share held. */
    const held2Now = () => (K.teamKeysOf(at, vault)[TEAM] || {})[2];
    const sealed2Now = () => (readEnv(path.join(share, EC)) || {}).epoch === 2 && Buffer.isBuffer(held2Now())
      && String(opens(path.join(share, EC), held2Now()) || "").indexOf("c-juniper-press") >= 0;
    const oldShutNow = () => opens(path.join(share, EC), key1) == null;
    const BOUND_MS = 90000, waitStart = Date.now();
    while (Date.now() - waitStart < BOUND_MS && !(sealed2Now() && oldShutNow())) await new Promise((r) => setTimeout(r, 50));
    const waitedMs = Date.now() - waitStart;
    await drained();
    s.done();
    const held2 = held2Now();
    const ec = readEnv(path.join(share, EC)) || {};
    const asked = s.calls.slice(calls0).map((c) => c[0]);
    const f = {
      refused: !!first && /another program has it open|EBUSY/.test(String(first.error || "")) && !!refusedAt,
      landed: mid.team === 2 && mid.ec === 1,
      sealed2: ec.epoch === 2 && Buffer.isBuffer(held2) && String(opens(path.join(share, EC), held2) || "").indexOf("c-juniper-press") >= 0,
      oldShut: opens(path.join(share, EC), key1) == null,
      noPublish: asked.indexOf("publishProject") < 0,
    };
    check(Object.keys(f).every((k) => f[k] === true),
      "2ze a removal whose reseal is refused after its team file landed is completed by the next look with no publish: the"
      + " edition on the share opens with the key kept for key number 2 and not with key number 1: "
      + JSON.stringify({ f, mid, epoch: ec.epoch, asked: asked.slice(0, 12),
        waitedMs, stillFalseAtBound: ["sealed2", "oldShut"].filter((k) => f[k] !== true), shareEpochRead: ec.epoch === undefined ? null : ec.epoch }));
  }

  /* 2zf A STRAY EDITION SEALED AT THE OLD KEY NUMBER IS SEALED AGAIN AT THE NEXT LOOK, NOT THE NEXT START (board 974, C2, the
     test architect's E1 on 586d4a2b): the removal completes on a folder team, and then a newer revision sealed at key number 1
     by this lead's other Studio reaches the share, as that Studio's syncer would put it there. Nothing about the team file or
     the desks changes, so before this only a restart looked at it, and the removed desk's key opened the newest edition. One
     focus now lands it in the mirror, sees the root edition change, and puts it on the share at key number 2. */
  {
    const St = await import(pathToFileURL(path.join(ROOT, "src", "studio.mjs")).href);
    const T = await import(pathToFileURL(path.join(ROOT, "src", "team.mjs")).href);
    const K = await import(pathToFileURL(path.join(ROOT, "src", "team-store.mjs")).href);
    const Sg = await import(pathToFileURL(path.join(ROOT, "src", "sign.mjs")).href);
    const { jsonText } = await import(pathToFileURL(path.join(ROOT, "src", "plain-json.mjs")).href);
    const vault = { available: () => true, seal: (t) => FAKE_VAULT_STORAGE.encryptString(t), open: (b) => FAKE_VAULT_STORAGE.decryptString(b) };
    const rawPublic = (k) => crypto.createPublicKey(k).export({ type: "spki", format: "der" }).subarray(-32);
    const newDesk = (deskName) => {
      const sign = crypto.generateKeyPairSync("ed25519"), box = crypto.generateKeyPairSync("x25519");
      const pub = rawPublic(sign.privateKey).toString("hex");
      const id = "k-" + crypto.createHash("sha256").update(Buffer.from(pub, "hex")).digest("hex").slice(0, 16);
      return { id, block: { id, key: pub, box: rawPublic(box.privateKey).toString("hex"), name: deskName }, signKey: sign.privateKey };
    };
    const ownFile = (by) => {
      const doc = { desk: JSON.parse(JSON.stringify(by.block)) };
      doc.sig = { alg: "Ed25519", keyId: doc.desk.id };
      doc.sig.value = crypto.sign(null, Engine.deskRules().branchSignedBytes(doc), by.signKey).toString("hex");
      return doc;
    };
    const name = "member-remove-stray";
    const ud = path.join(SCRATCH, name), share = path.join(ud, "share");
    fs.mkdirSync(share, { recursive: true });
    const pair = await Sg.makePair();
    const keyAt = Sg.defaultKeyFile(ud);
    fs.writeFileSync(keyAt, JSON.stringify(Sg.osFile(pair, FAKE_VAULT_STORAGE.encryptString(pair.der)), null, 1) + "\n");
    const opened = await St.newProject(path.join(ud, "projects"), "Rowan press", [{ code: "en", name: "English" }]);
    St.setPublishFolder(opened.dir, share);
    const ivo = newDesk("Ivo"), ema = newDesk("Ema");
    const TEAM = "t-" + crypto.randomBytes(8).toString("hex");
    const key1 = crypto.randomBytes(32);
    let team = T.newTeam({ id: TEAM, catalogs: [opened.draft.id], lead: { keyId: pair.keyId, public: pair.public },
      sealed: true, exportsSealed: true });
    team = T.withChannel(team, { kind: "relay", rt: "6d".repeat(16), url: "https://etiuda.dev" }, { format: 1, kind: "etiuda-ring", keys: [] }); /* on the relay (was: a team kept for a shared folder, which the watch no longer looks at; the folder team's removal) */
    team = T.admit(T.admit(team, ownFile(ivo), ivo.id, key1), ownFile(ema), ema.id, key1);
    await T.writeTeam(share, team, { key: keyAt, passphrase: pair.der });
    const signed = (rev, edition) => Sg.signDocument({ format: 2, kind: "etiuda-catalog", id: "c-rowan-press", rev, edition },
      Sg.unlockKey(Sg.readKeyFile(keyAt), pair.der));
    const EC = "rowan-press.ec";
    fs.writeFileSync(path.join(share, EC), jsonText(Engine.sealRules().sealCatalog(key1, TEAM, 1, JSON.stringify(await signed(1, "2026-10-04")))));
    const at = K.teamsFile(ud);
    K.keepTeamKey(at, vault, TEAM, 1, key1);
    K.chooseSealed(at, TEAM, true, share, { id: TEAM, epoch: 1, roster: [] });
    { const doc = JSON.parse(fs.readFileSync(at, "utf8")); doc.teams[TEAM].relay = { rt: "6d".repeat(16), url: "https://etiuda.dev" }; fs.writeFileSync(at, JSON.stringify(doc, null, 1) + String.fromCharCode(10)); }
    const readEnv = (file) => { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; } };
    const opens = (file, k) => { try { return k ? Engine.sealRules().openSealed(k, readEnv(file)) : null; } catch { return null; } };
    const revOf = (text) => { try { return JSON.parse(text).rev; } catch { return null; } };
    /* Waited on the condition itself, up to ninety seconds (a load's allowance; a fixed twenty-five went red once for 2ze, the same watch). */
    const waitFor = async (done) => { for (let i = 0; i < 1800 && !done(); i++) await new Promise((r) => setTimeout(r, 50)); return done(); };
    /* As 2ze: no relay is reached, the removal stands. */
    const s = await loadShell(name, { thread: realThread, env: Object.assign({ STUDIO_TEST_RELAY_CAUGHT_UP: "1" }, projectsBeside(opened.dir)) });
    const removed = await s.ask("studio:member-remove", opened.dir, TEAM, ivo.id, true);
    const settledFirst = await waitFor(() => (readEnv(path.join(share, EC)) || {}).epoch === 2
      && (readEnv(path.join(share, "etiuda-team.json")) || {}).epoch === 2);
    await s.fire("winOn", "focus"); await drained();
    /* The other Studio's newer revision, sealed at key number 1, lands on the share whole, as its syncer writes it. */
    const strayText = jsonText(Engine.sealRules().sealCatalog(key1, TEAM, 1, JSON.stringify(await signed(2, "2026-10-05"))));
    fs.writeFileSync(path.join(share, EC + ".stray.tmp"), strayText);
    fs.renameSync(path.join(share, EC + ".stray.tmp"), path.join(share, EC));
    const strayOpensOld = revOf(opens(path.join(share, EC), key1)) === 2;
    const calls0 = s.calls.length;
    await s.fire("winOn", "focus");
    const held2 = () => (K.teamKeysOf(at, vault)[TEAM] || {})[2];
    await waitFor(() => (readEnv(path.join(share, EC)) || {}).epoch === 2 && revOf(opens(path.join(share, EC), held2())) === 2);
    await drained();
    s.done();
    const ec = readEnv(path.join(share, EC)) || {};
    const asked = s.calls.slice(calls0).map((c) => c[0]);
    const f = {
      removed: !!removed && !removed.error && settledFirst,
      strayOpensOld,
      sealed2: ec.epoch === 2 && Buffer.isBuffer(held2()) && revOf(opens(path.join(share, EC), held2())) === 2,
      oldShut: opens(path.join(share, EC), key1) == null,
      noPublish: asked.indexOf("publishProject") < 0,
    };
    check(Object.keys(f).every((k) => f[k] === true),
      "2zf a newer revision sealed at key number 1 that reaches the share after the removal is sealed at key number 2 by the"
      + " next look, with no restart and no publish, and key number 1 no longer opens it: "
      + JSON.stringify({ f, epoch: ec.epoch, asked: asked.slice(0, 12), error: removed && removed.error,
        stillFalseAtBound: Object.keys(f).filter((k) => f[k] !== true) }));
  }

  /* 2q, 2r, 2t THE SIGNING KEY KEPT BY THE OPERATING SYSTEM (Maxim 2026-10-07 20:42): made at one press under the vault, its
     private half handed to the thread only as the secret the vault opened; a backup copy under a passphrase typed for it; a
     restore on another profile. The thread's key verbs are src/studio.mjs's own, run here in process. */
  {
    const Sg = await import(pathToFileURL(path.join(ROOT, "src", "sign.mjs")).href);
    const St = await import(pathToFileURL(path.join(ROOT, "src", "studio.mjs")).href);
    const real = (verb, ...a) => ["backupKey", "readBackup", "openBackup"].indexOf(verb) >= 0
      ? Promise.resolve().then(() => St[verb](...a)) : null;
    const spellings = (hex) => { const b = Buffer.from(hex, "hex"); return [hex, hex.toUpperCase(), b.toString("base64"), b.toString("base64url")]; };
    const seen = {};
    const s = await loadShell("key-made", { thread: (verb, ...a) => real(verb, ...a) || (verb === "teamFacts"
      ? Promise.resolve({ folder: path.join(SCRATCH, "key-made", "share"), file: "none", team: null, signing: "k", inside: false, mark: null, id: "c" })
      : verb === "setTeamExports" ? (seen.secret = a[3], Promise.resolve({ folder: "f" }))
      : Promise.resolve({ verb })) });
    const keyAt = Sg.defaultKeyFile(path.join(SCRATCH, "key-made"));
    const made = await s.ask("studio:key-make");
    const fileText = fs.existsSync(keyAt) ? fs.readFileSync(keyAt, "utf8") : "", doc = fileText ? JSON.parse(fileText) : {};
    const again = await s.ask("studio:key-make");
    const same = fs.readFileSync(keyAt, "utf8") === fileText;
    await s.ask("studio:team-exports", "d", true);
    const secret = typeof seen.secret === "string" ? seen.secret : "";
    let opened = null;
    try { opened = Sg.unlockKey(Sg.readKeyFile(keyAt), secret); } catch { opened = null; }
    const plain = !!secret && spellings(secret).some((x) => fileText.indexOf(x) >= 0);
    check(!made.error && made.keyId === doc.keyId && made.kept === "os" && /^[0-9a-f]{16}$/.test(made.print)
          && doc.wrap && doc.wrap.kdf === "os" && !plain && !!again.error && /already/.test(again.error) && same
          && !!opened && opened.public === doc.public,
      "2q Make a signing key writes the key file with its private half sealed by the vault, in none of four spellings, and"
      + " answers the key as the rows print it; a second press refuses and leaves the file as it was; a team verb then hands the"
      + " thread the secret the vault opened, which opens that file (was: the Sealed switch, retired 2026-11-26, and not the passphrase the page typed): "
      + JSON.stringify([!made.error, made.kept, doc.wrap, plain, !!again.error, same, !!opened]));

    const backupAt = path.join(SCRATCH, "key-backup.json");
    process.env.STUDIO_TEST_BACKUP = backupAt;
    const wrongTwice = await s.ask("studio:key-backup", "", "t", "k");
    const backed = await s.ask("studio:key-backup", "a passphrase for the copy", "t", "k");
    delete process.env.STUDIO_TEST_BACKUP;
    s.done();
    const copy = fs.existsSync(backupAt) ? Sg.readKeyFile(backupAt) : null;
    let copyOpen = null;
    try { copyOpen = Sg.unlockKey(copy, "a passphrase for the copy"); } catch { copyOpen = null; }
    const store = JSON.parse(fs.readFileSync(path.join(SCRATCH, "key-made", "studio.json"), "utf8"));
    check(!!wrongTwice.error && !!copy && copy.kept === "passphrase" && copy.public === doc.public && !!copyOpen
          && store.keyBackup && store.keyBackup.keyId === doc.keyId && store.keyBackup.where === SCRATCH
          && /^\d{4}-\d{2}-\d{2}$/.test(store.keyBackup.made) && backed.signing && backed.signing.backup
          && backed.signing.backup.keyId === doc.keyId,
      "2r a backup copy with no passphrase refuses; with one it is the key's own passphrase file, opening to the same key,"
      + " and the store keeps the day and the folder, never a key, which the key's answer then carries: "
      + JSON.stringify([!!wrongTwice.error, copy && copy.kept, !!copyOpen, store.keyBackup]));

    /* A second profile, a new computer: the copy picked is read for its key, refused by a wrong passphrase with no key file
       written, and restored by the right one under that profile's vault. A third profile whose key was made in Settings and
       has signed nothing sets that key aside, never deleted, and restores the copy. */
    const t = await loadShell("key-restored", { env: { STUDIO_TEST_RESTORE: backupAt }, thread: (verb, ...a) => real(verb, ...a)
      || Promise.resolve({ verb }) });
    const newAt = Sg.defaultKeyFile(path.join(SCRATCH, "key-restored"));
    const picked = await t.ask("studio:key-restore-pick", "t", "k");
    const wrong = await t.ask("studio:key-restore", picked.file, "not the passphrase");
    const noneYet = !fs.existsSync(newAt);
    const back = await t.ask("studio:key-restore", picked.file, "a passphrase for the copy");
    t.done();
    const now = fs.existsSync(newAt) ? Sg.readKeyFile(newAt) : null;
    const u = await loadShell("key-other", { env: { STUDIO_TEST_RESTORE: backupAt }, thread: (verb, ...a) => real(verb, ...a)
      || Promise.resolve({ verb }) });
    const madeOther = await u.ask("studio:key-make");
    const otherAt = Sg.defaultKeyFile(path.join(SCRATCH, "key-other"));
    const otherBefore = Sg.readKeyFile(otherAt);
    const p2 = await u.ask("studio:key-restore-pick", "t", "k");
    const over = await u.ask("studio:key-restore", p2.file, "a passphrase for the copy");
    u.done();
    const overNow = fs.existsSync(otherAt) ? Sg.readKeyFile(otherAt) : null;
    const asideNames = fs.readdirSync(path.dirname(otherAt)).filter((f) => /\.made-at-activation-/.test(f));
    const asideKey = asideNames.length === 1 ? Sg.readKeyFile(path.join(path.dirname(otherAt), asideNames[0])) : null;

    /* W10: picking a file that is not a backup copy says what a backup copy is and what to pick instead. */
    const NOT_BACKUP = "To restore the signing key, pick the file Studio wrote with Make a backup copy…, whose name begins etiuda-studio-key- unless it was renamed; {FILE} is not such a copy.";
    const NOT_BACKUP_PL = "Aby przywrócić klucz podpisu, wystarczy wybrać plik zapisany przez Studio przyciskiem Utwórz kopię zapasową…; jeśli nie zmieniono mu nazwy, zaczyna się od etiuda-studio-key-. Plik {FILE} nie jest taką kopią.";
    const w = await loadShell("key-not-backup", { env: { STUDIO_TEST_RESTORE: keyAt }, thread: (verb, ...a) => real(verb, ...a)
      || Promise.resolve({ verb }) });
    const wrongPick = await w.ask("studio:key-restore-pick", "t", "k");
    const { loadPage } = await import("./page-stand-in.mjs");
    const pageEn = loadPage({ api: { keyRestorePick: (...a) => w.ask("studio:key-restore-pick", ...a) }, uiLang: "en" }).page;
    await pageEn.ACTS["key-restore"]();
    const saidEn = pageEn.errText();
    const pagePl = loadPage({ api: { keyRestorePick: (...a) => w.ask("studio:key-restore-pick", ...a) }, uiLang: "pl" }).page;
    await pagePl.ACTS["key-restore"]();
    const saidPl = pagePl.errText();
    w.done();
    const wantEn = NOT_BACKUP.replace("{FILE}", path.basename(keyAt));
    const wantPl = NOT_BACKUP_PL.replace("{FILE}", path.basename(keyAt));
    const wrongPickSaid = wrongPick.error === wantEn && wrongPick.said && wrongPick.said.frame === NOT_BACKUP
      && saidEn === wantEn && saidPl === wantPl;

    check(picked.print === made.print && !!wrong.error && noneYet && !back.error && !!now && now.kept === "os"
          && now.public === doc.public && back.backup && back.backup.restored === true
          && !over.error && !!overNow && overNow.public === doc.public && overNow.kept === "os"
          && !!asideKey && asideKey.public === otherBefore.public && asideKey.public === madeOther.public
          && asideKey.kept === "os" && asideNames.length === 1 && wrongPickSaid,
      "2t on another profile the copy is read for its key before anything is typed, a wrong passphrase writes no key, and the"
      + " right one keeps the same key under that profile's vault, said as restored; a profile whose key has signed nothing"
      + " sets that key aside and restores the copy; picking a file that is not a backup copy says what to pick instead: "
      + JSON.stringify([picked.print === made.print, !!wrong.error, noneYet, now && now.kept,
        back.backup && back.backup.restored, !over.error, !!asideKey, overNow && overNow.public === doc.public, wrongPickSaid, saidEn, saidPl]));
  }

  /* 904 A BACKUP MADE BEFORE THE FIRST TEAM FILE CARRIES NO BOX (board 904). The nudge offers that copy at the first
     publish, before any team file, so the copy has no box. Restoring it over the same key must keep the box the first
     team write added: the next team write must not mint another, or a statistics answer sealed to the first stops
     opening and nothing says so. A backup made once the box exists restores that box, including over a key that has
     since grown a different one. */
  {
    const Sg = await import(pathToFileURL(path.join(ROOT, "src", "sign.mjs")).href);
    const St = await import(pathToFileURL(path.join(ROOT, "src", "studio.mjs")).href);
    const Tm = await import(pathToFileURL(path.join(ROOT, "src", "team.mjs")).href);
    const R = Engine.statsRules();
    const PASS_EARLY = "a passphrase for the early copy";
    const PASS_LATER = "a passphrase for the later copy";
    const deskId = "k-9040000000000904";
    const payload = "{\"desk\":\"Harbour lamp\"}";
    const seen = {};
    const real = (verb, ...a) => {
      if (verb === "backupKey") seen.secret = a[2];
      return ["backupKey", "readBackup", "openBackup"].indexOf(verb) >= 0
        ? Promise.resolve().then(() => St[verb](...a)) : Promise.resolve({ verb });
    };
    const name = "boxless-904";
    const s = await loadShell(name, { thread: (verb, ...a) => real(verb, ...a) });
    const keyAt = Sg.defaultKeyFile(path.join(SCRATCH, name));
    const earlyAt = path.join(SCRATCH, "boxless-904-early.json");
    const laterAt = path.join(SCRATCH, "boxless-904-later.json");
    const share = path.join(SCRATCH, name, "share");
    let detail = {};
    try {
      fs.mkdirSync(share, { recursive: true });
      const made = await s.ask("studio:key-make");
      process.env.STUDIO_TEST_BACKUP = earlyAt;
      const backed = await s.ask("studio:key-backup", PASS_EARLY, "t", "k");
      delete process.env.STUDIO_TEST_BACKUP;
      const earlyDoc = fs.existsSync(earlyAt) ? JSON.parse(fs.readFileSync(earlyAt, "utf8")) : null;
      const team = Tm.newTeam({ catalogs: ["harbour-lamp"], lead: { keyId: made.keyId, public: made.public } });
      const wrote = await Tm.writeTeam(share, team, { key: keyAt, passphrase: seen.secret });
      const boxPub = wrote.team.lead.box;
      const sealed = R.sealStatsLead(boxPub, wrote.team.id, wrote.team.lead.keyId, deskId, payload);
      const openNow = () => {
        const read = Sg.readKeyFile(keyAt);
        const open = Sg.unlockKey(read, seen.secret);
        const box = Sg.openLeadBox(read, open);
        return { public: box && box.public, text: box ? R.openStatsSealed(box.secretKey, sealed, deskId) : null };
      };
      const before = openNow();
      process.env.STUDIO_TEST_BACKUP = laterAt;
      const later = await s.ask("studio:key-backup", PASS_LATER, "t", "k");
      delete process.env.STUDIO_TEST_BACKUP;
      const laterDoc = fs.existsSync(laterAt) ? JSON.parse(fs.readFileSync(laterAt, "utf8")) : null;
      process.env.STUDIO_TEST_RESTORE = earlyAt;
      const picked = await s.ask("studio:key-restore-pick", "t", "k");
      const restored = await s.ask("studio:key-restore", picked.file, PASS_EARLY);
      delete process.env.STUDIO_TEST_RESTORE;
      const again = await Tm.writeTeam(share, wrote.team, { key: keyAt, passphrase: seen.secret });
      const after = openNow();
      const live = JSON.parse(fs.readFileSync(keyAt, "utf8"));
      delete live.box;
      fs.writeFileSync(keyAt, JSON.stringify(live, null, 1) + "\n");
      const minted = await Tm.writeTeam(share, again.team, { key: keyAt, passphrase: seen.secret });
      process.env.STUDIO_TEST_RESTORE = laterAt;
      const pickedLater = await s.ask("studio:key-restore-pick", "t", "k");
      const restoredLater = await s.ask("studio:key-restore", pickedLater.file, PASS_LATER);
      delete process.env.STUDIO_TEST_RESTORE;
      const kept = openNow();
      detail = {
        made: !made.error && made.kept === "os",
        earlyBox: !!(earlyDoc && earlyDoc.box),
        backed: !backed.error,
        before: before.text === payload && before.public === boxPub,
        laterBox: !!(laterDoc && laterDoc.box && laterDoc.box.public === boxPub),
        later: !later.error,
        restored: !restored.error,
        after: after.text === payload && after.public === boxPub && again.team.lead.box === boxPub,
        minted: minted.team.lead.box !== boxPub,
        restoredLater: !restoredLater.error,
        kept: kept.text === payload && kept.public === boxPub,
      };
    } catch (e) {
      detail = { threw: String(e && e.stack || e).slice(0, 500) };
    } finally {
      delete process.env.STUDIO_TEST_BACKUP;
      delete process.env.STUDIO_TEST_RESTORE;
      s.done();
    }
    check(detail.made === true && detail.earlyBox === false && detail.backed === true && detail.before === true
          && detail.laterBox === true && detail.later === true && detail.restored === true && detail.after === true
          && detail.minted === true && detail.restoredLater === true && detail.kept === true,
      "904 a backup made before the first team file carries no box, and restoring it over the same key keeps the box"
      + " the team write added, so the statistics answer sealed to it still opens after the next team write; a backup"
      + " made once the box exists restores that box over a key that has since grown another: " + JSON.stringify(detail));
  }

  /* THE TWO CLAUSES 904 DID NOT GUARD. Both restore the same kind of boxless copy. 904a puts another key's
     passphrase file, carrying that key's own box, in the place: the public-half match is what leaves the box
     behind. 904b puts a box sealed under another key into this key's own file: the shape is right and the
     public half matches, and the restore takes the box only where this key opens it. */
  async function overBoxless(name, plant) {
    const Sg = await import(pathToFileURL(path.join(ROOT, "src", "sign.mjs")).href);
    const St = await import(pathToFileURL(path.join(ROOT, "src", "studio.mjs")).href);
    const Tm = await import(pathToFileURL(path.join(ROOT, "src", "team.mjs")).href);
    const PASS = "a passphrase for the boxless copy";
    const seen = {};
    const real = (verb, ...a) => {
      if (verb === "backupKey") seen.secret = a[2];
      return ["backupKey", "readBackup", "openBackup"].indexOf(verb) >= 0
        ? Promise.resolve().then(() => St[verb](...a)) : Promise.resolve({ verb });
    };
    const s = await loadShell(name, { thread: (verb, ...a) => real(verb, ...a) });
    const keyAt = Sg.defaultKeyFile(path.join(SCRATCH, name));
    const earlyAt = path.join(SCRATCH, name + "-early.json");
    const share = path.join(SCRATCH, name, "share");
    let detail = {};
    try {
      fs.mkdirSync(share, { recursive: true });
      const made = await s.ask("studio:key-make");
      process.env.STUDIO_TEST_BACKUP = earlyAt;
      const backed = await s.ask("studio:key-backup", PASS, "t", "k");
      delete process.env.STUDIO_TEST_BACKUP;
      const earlyDoc = fs.existsSync(earlyAt) ? JSON.parse(fs.readFileSync(earlyAt, "utf8")) : null;
      const planted = await plant(Sg, keyAt, seen.secret);
      process.env.STUDIO_TEST_RESTORE = earlyAt;
      const picked = await s.ask("studio:key-restore-pick", "t", "k");
      const restored = await s.ask("studio:key-restore", picked.file, PASS);
      delete process.env.STUDIO_TEST_RESTORE;
      const live = fs.existsSync(keyAt) ? JSON.parse(fs.readFileSync(keyAt, "utf8")) : null;
      const boxPub = live && live.box && typeof live.box.public === "string" ? live.box.public : "";
      let teamWrote = null, writeError = "";
      try {
        const team = Tm.newTeam({ catalogs: ["harbour-lamp"], lead: { keyId: made.keyId, public: made.public } });
        teamWrote = await Tm.writeTeam(share, team, { key: keyAt, passphrase: seen.secret });
      } catch (e) { writeError = String(e && e.message || e); }
      const leadBox = teamWrote && teamWrote.team && teamWrote.team.lead && teamWrote.team.lead.box;
      detail = {
        made: !made.error && made.kept === "os" && !!earlyDoc && made.public === earlyDoc.public,
        earlyBox: !!(earlyDoc && earlyDoc.box),
        backed: !backed.error,
        other: planted.other === true,
        sealedElsewhere: planted.sealedElsewhere === true,
        restored: !restored.error,
        told: !!(restored && restored.boxless === true),
        keptOs: !!(live && live.wrap && live.wrap.kdf === "os" && live.public === made.public),
        took: boxPub !== "" && boxPub === planted.boxPublic,
        wrote: typeof leadBox === "string" && leadBox !== "" && leadBox !== planted.boxPublic,
        writeError: writeError.slice(0, 120),
      };
    } catch (e) {
      detail = { threw: String(e && e.stack || e).slice(0, 500) };
    } finally {
      delete process.env.STUDIO_TEST_BACKUP;
      delete process.env.STUDIO_TEST_RESTORE;
      s.done();
    }
    return detail;
  }
  {
    const otherPass = "a passphrase for the other key";
    const detail = await overBoxless("boxless-904a", async (Sg, keyAt) => {
      const mine = Sg.readKeyFile(keyAt);
      const other = await Sg.makePair();
      const at = path.join(SCRATCH, "904a-other.json");
      fs.writeFileSync(at, JSON.stringify(Sg.passphraseFile(other, otherPass), null, 1) + "\n");
      const read = Sg.readKeyFile(at);
      const box = Sg.ensureLeadBox(read, Sg.unlockKey(read, otherPass));
      fs.copyFileSync(at, keyAt);
      const place = Sg.readKeyFile(keyAt);
      const packed = place.doc && place.doc.box;
      return {
        other: place.kept === "passphrase" && place.public === other.public && place.public !== mine.public
          && !!packed && packed.public === box.public,
        boxPublic: box.public,
      };
    });
    check(detail.made === true && detail.earlyBox === false && detail.backed === true && detail.other === true
          && detail.restored === true && detail.told === false && detail.keptOs === true && detail.took === false
          && detail.wrote === true,
      "904a another key's passphrase file, with its own box, sits in the place, and restoring the boxless copy of this"
      + " key takes no box from it and says nothing new, so the next team write mints one: " + JSON.stringify(detail));
  }
  {
    const otherPass = "a passphrase for the other key";
    const detail = await overBoxless("boxless-904b", async (Sg, keyAt, secret) => {
      const other = await Sg.makePair();
      const at = path.join(SCRATCH, "904b-other.json");
      fs.writeFileSync(at, JSON.stringify(Sg.passphraseFile(other, otherPass), null, 1) + "\n");
      const read = Sg.readKeyFile(at);
      const box = Sg.ensureLeadBox(read, Sg.unlockKey(read, otherPass));
      const packed = JSON.parse(fs.readFileSync(at, "utf8")).box;
      const live = JSON.parse(fs.readFileSync(keyAt, "utf8"));
      const mine = live.public;
      live.box = { public: packed.public, iv: packed.iv, ct: packed.ct };
      fs.writeFileSync(keyAt, JSON.stringify(live, null, 1) + "\n");
      const now = Sg.readKeyFile(keyAt);
      let opens = false;
      try { opens = !!Sg.openLeadBox(now, Sg.unlockKey(now, secret)); } catch { opens = false; }
      return {
        sealedElsewhere: now.kept === "os" && now.public === mine && now.public !== other.public
          && !opens && packed.public === box.public,
        boxPublic: packed.public,
      };
    });
    check(detail.made === true && detail.earlyBox === false && detail.backed === true && detail.sealedElsewhere === true
          && detail.restored === true && detail.told === false && detail.keptOs === true && detail.took === false
          && detail.wrote === true,
      "904b this key's file holds a box sealed under another key, and the restore takes it only where this key opens"
      + " it and says nothing new, so the next team write mints one: " + JSON.stringify(detail));
  }

  /* 904c A BOX-LESS COPY RESTORED WHERE NO KEY STANDS SAYS SO (board 905). The copy made before any team write
     carries no box. Restored onto a computer that keeps no key, the answer carries the flag and the key file is
     written with no box. The same copy restored over the key whose place already holds a box this key opens says
     nothing new and keeps that box. Restored over the same key where the place holds no box, it says nothing new
     either: a key already stood, and statistics are unchanged. A later copy that carries the box, restored where
     no key stands, says nothing new and writes that box. The flag is the restore's own answer: making the key
     does not carry it. */
  {
    const Sg = await import(pathToFileURL(path.join(ROOT, "src", "sign.mjs")).href);
    const St = await import(pathToFileURL(path.join(ROOT, "src", "studio.mjs")).href);
    const Tm = await import(pathToFileURL(path.join(ROOT, "src", "team.mjs")).href);
    const PASS_QUIET = "a passphrase for the quiet copy";
    const PASS_BOX = "a passphrase for the copy that carries its box";
    const seen = {};
    const real = (verb, ...a) => {
      if (verb === "backupKey") seen.secret = a[2];
      return ["backupKey", "readBackup", "openBackup"].indexOf(verb) >= 0
        ? Promise.resolve().then(() => St[verb](...a)) : Promise.resolve({ verb });
    };
    const quiet = (r) => !!(r && !r.error && !Object.prototype.hasOwnProperty.call(r, "boxless"));
    const boxOf = (at) => {
      if (!fs.existsSync(at)) return null;
      const d = JSON.parse(fs.readFileSync(at, "utf8"));
      return d.box && typeof d.box.public === "string" ? d.box.public : "";
    };
    const name = "boxless-905";
    const s = await loadShell(name, { thread: (verb, ...a) => real(verb, ...a) });
    const keyAt = Sg.defaultKeyFile(path.join(SCRATCH, name));
    const earlyAt = path.join(SCRATCH, "boxless-905-early.json");
    const laterAt = path.join(SCRATCH, "boxless-905-later.json");
    const share = path.join(SCRATCH, name, "share");
    let none = null, copy = null, closed = false, detail = {};
    try {
      fs.mkdirSync(share, { recursive: true });
      const made = await s.ask("studio:key-make");
      process.env.STUDIO_TEST_BACKUP = earlyAt;
      const backed = await s.ask("studio:key-backup", PASS_QUIET, "t", "k");
      delete process.env.STUDIO_TEST_BACKUP;
      const earlyDoc = fs.existsSync(earlyAt) ? JSON.parse(fs.readFileSync(earlyAt, "utf8")) : null;
      /* The same key, with no box yet: restoring the boxless copy over it changes nothing about statistics. */
      process.env.STUDIO_TEST_RESTORE = earlyAt;
      const samePick = await s.ask("studio:key-restore-pick", "t", "k");
      const same = await s.ask("studio:key-restore", samePick.file, PASS_QUIET);
      delete process.env.STUDIO_TEST_RESTORE;
      const samePub = boxOf(keyAt);
      const team = Tm.newTeam({ catalogs: ["harbour-lamp"], lead: { keyId: made.keyId, public: made.public } });
      const wrote = await Tm.writeTeam(share, team, { key: keyAt, passphrase: seen.secret });
      const boxPub = wrote.team.lead.box;
      process.env.STUDIO_TEST_BACKUP = laterAt;
      const later = await s.ask("studio:key-backup", PASS_BOX, "t", "k");
      delete process.env.STUDIO_TEST_BACKUP;
      const laterDoc = fs.existsSync(laterAt) ? JSON.parse(fs.readFileSync(laterAt, "utf8")) : null;
      process.env.STUDIO_TEST_RESTORE = earlyAt;
      const picked = await s.ask("studio:key-restore-pick", "t", "k");
      const over = await s.ask("studio:key-restore", picked.file, PASS_QUIET);
      delete process.env.STUDIO_TEST_RESTORE;
      const keptPub = boxOf(keyAt);
      s.done();
      closed = true;
      none = await loadShell("boxless-905-none", { env: { STUDIO_TEST_RESTORE: earlyAt },
        thread: (verb, ...a) => real(verb, ...a) });
      const noneAt = Sg.defaultKeyFile(path.join(SCRATCH, "boxless-905-none"));
      const nonePick = await none.ask("studio:key-restore-pick", "t", "k");
      const bare = await none.ask("studio:key-restore", nonePick.file, PASS_QUIET);
      const barePub = boxOf(noneAt);
      none.done();
      none = null;
      copy = await loadShell("boxless-905-copy", { env: { STUDIO_TEST_RESTORE: laterAt },
        thread: (verb, ...a) => real(verb, ...a) });
      const copyAt = Sg.defaultKeyFile(path.join(SCRATCH, "boxless-905-copy"));
      const copyPick = await copy.ask("studio:key-restore-pick", "t", "k");
      const carried = await copy.ask("studio:key-restore", copyPick.file, PASS_BOX);
      const carriedPub = boxOf(copyAt);
      copy.done();
      copy = null;
      detail = {
        made: !made.error && made.kept === "os" && quiet(made),
        earlyBox: !!(earlyDoc && earlyDoc.box),
        backed: !backed.error,
        boxPub: typeof boxPub === "string" && boxPub.length > 0,
        laterBox: !!(laterDoc && laterDoc.box && laterDoc.box.public === boxPub),
        later: !later.error,
        over: quiet(over) && keptPub === boxPub,
        same: quiet(same) && samePub === "",
        bare: !!(bare && bare.boxless === true && !bare.error) && barePub === "",
        carried: quiet(carried) && carriedPub === boxPub,
      };
    } catch (e) {
      detail = { threw: String(e && e.stack || e).slice(0, 500) };
    } finally {
      delete process.env.STUDIO_TEST_BACKUP;
      delete process.env.STUDIO_TEST_RESTORE;
      if (!closed) s.done();
      if (none) none.done();
      if (copy) copy.done();
    }
    check(detail.made === true && detail.earlyBox === false && detail.backed === true && detail.boxPub === true
          && detail.laterBox === true && detail.later === true && detail.over === true && detail.same === true
          && detail.bare === true && detail.carried === true,
      "904c a boxless copy restored where no key stands answers with the flag and writes no box; the same copy"
      + " restored over a key whose place holds a box this key opens, over the same key with no box, and a copy"
      + " that carries its box restored where no key stands, say nothing new: " + JSON.stringify(detail));
  }

  /* 904d THE PAGE SAYS THE SENTENCE ON THAT RESTORE ALONE (board 905). The restore cover stays up and says it,
     in the language on screen. A restore whose answer carries no flag closes as before and the settings row
     keeps the line it already had, with nothing added. */
  {
    const EN = "Statistics sealed earlier stay shut on this computer, since this copy carries no seal for them. Once this Studio next changes the team, each teammate's statistics start again from that teammate's next write.";
    const PL = "Statystyki zapieczętowane wcześniej pozostaną na tym komputerze zamknięte, bo ta kopia nie zawiera ich pieczęci. Gdy to Studio następnym razem zmieni zespół, statystyki każdego członka zespołu ruszą znowu od jego najbliższego zapisu.";
    const { loadPage } = await import("./page-stand-in.mjs");
    const kept = { error: null, keyId: "studio-9a3a782d7f8ff25b", print: "9a3a782d7f8ff25b", kept: "os",
      backup: { keyId: "studio-9a3a782d7f8ff25b", made: "2026-10-08", where: "E:\\", restored: true } };
    const bare = Object.assign({}, kept, { boxless: true });
    const shown = (html) => String(html || "").replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'")
      .replace(/&quot;/g, "\"").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/\s+/g, " ");
    const drive = async (answer, uiLang) => {
      let threw = "";
      const home = loadPage({ api: { keyRestore: async () => answer }, uiLang });
      const P = home.page;
      try {
        P.S.host = { signing: {} };
        P.S.cover = "key";
        P.S.keyWant = "restore";
        P.S.keyCopy = { file: "E:\\copy.json", print: "9a3a782d7f8ff25b" };
        P.S.screen = "projects";
        P.S.projects = [];
        await P.ACTS["do-key-restore"]();
      } catch (e) { threw = String(e && e.message || e).slice(0, 240); }
      return {
        cover: P.S.cover, keyBoxless: P.S.keyBoxless === true,
        dlg: shown(home.node("#dlg").innerHTML), row: shown(P.signingRowHtml()), threw,
      };
    };
    let detail = {};
    try {
      const en = await drive(bare);
      const pl = await drive(bare, "pl");
      const quiet = await drive(kept);
      detail = {
        enCover: en.cover === "key" && en.keyBoxless && en.dlg.indexOf(EN) >= 0,
        plCover: pl.cover === "key" && pl.keyBoxless && pl.dlg.indexOf(PL) >= 0 && pl.dlg.indexOf(EN) < 0,
        quiet: quiet.cover === null && quiet.keyBoxless !== true && quiet.dlg.indexOf(EN) < 0
          && quiet.dlg.indexOf(PL) < 0 && quiet.row.indexOf("Restored. This computer keeps it") >= 0
          && quiet.row.indexOf(EN) < 0,
        covers: [en.cover, pl.cover, quiet.cover],
        threw: [en.threw, pl.threw, quiet.threw].filter(Boolean).join(" | "),
      };
    } catch (e) {
      detail = { threw: String(e && e.stack || e).slice(0, 500) };
    }
    check(detail.enCover === true && detail.plCover === true && detail.quiet === true,
      "904d a boxless restore keeps the cover up and says the sentence, in English and in Polish; a restore"
      + " that kept its box closes the cover and says nothing new: " + JSON.stringify(detail));
  }

  /* 904e THE SECOND CLAUSE, MADE TRUE (board 905, the test architect's E1). A boxless copy restored where no
     key stands leaves the team file's box as it was, and the restored key carries no seal, so an envelope a
     desk seals to that box does not open here. The sentence says each desk's statistics start again once this
     Studio next changes the team, from that desk's next write. That change is the team write, the one
     act that mints a box and names it in the team file. An envelope sealed to the new box opens with the
     restored key; the one sealed before the write still does not. */
  {
    const EN = "Statistics sealed earlier stay shut on this computer, since this copy carries no seal for them. Once this Studio next changes the team, each teammate's statistics start again from that teammate's next write.";
    const PL = "Statystyki zapieczętowane wcześniej pozostaną na tym komputerze zamknięte, bo ta kopia nie zawiera ich pieczęci. Gdy to Studio następnym razem zmieni zespół, statystyki każdego członka zespołu ruszą znowu od jego najbliższego zapisu.";
    const Sg = await import(pathToFileURL(path.join(ROOT, "src", "sign.mjs")).href);
    const St = await import(pathToFileURL(path.join(ROOT, "src", "studio.mjs")).href);
    const Tm = await import(pathToFileURL(path.join(ROOT, "src", "team.mjs")).href);
    const R = Engine.statsRules();
    const PASS = "a passphrase for the early copy";
    const deskId = "k-905e000000000905";
    const earlyText = "{\"desk\":\"South pier\"}";
    const midText = "{\"desk\":\"North quay\"}";
    const nextText = "{\"desk\":\"North quay again\"}";
    const seen = {};
    const real = (verb, ...a) => {
      if (verb === "backupKey") seen.secret = a[2];
      return ["backupKey", "readBackup", "openBackup"].indexOf(verb) >= 0
        ? Promise.resolve().then(() => St[verb](...a)) : Promise.resolve({ verb });
    };
    const boxPubOf = (at) => {
      if (!fs.existsSync(at)) return "";
      const d = JSON.parse(fs.readFileSync(at, "utf8"));
      return d.box && typeof d.box.public === "string" ? d.box.public : "";
    };
    const leadBoxOf = (folder) => {
      const at = Tm.teamPath(folder);
      if (!fs.existsSync(at)) return "";
      const d = JSON.parse(fs.readFileSync(at, "utf8"));
      return d.lead && typeof d.lead.box === "string" ? d.lead.box : "";
    };
    /* What the restored key opens. Null is a key with no box, or an envelope sealed to another box. */
    const opens = (keyAt, sealed) => {
      const read = Sg.readKeyFile(keyAt);
      if (!read) return null;
      const open = Sg.unlockKey(read, seen.secret);
      const box = Sg.openLeadBox(read, open);
      return box ? R.openStatsSealed(box.secretKey, sealed, deskId) : null;
    };
    const lang = fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8");
    const app = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
    const said = lang.indexOf(EN) >= 0 && lang.indexOf(PL) >= 0 && app.indexOf(EN) >= 0
      && app.indexOf(PL) < 0;
    const name = "boxless-905e";
    const s = await loadShell(name, { thread: (verb, ...a) => real(verb, ...a) });
    const keyAt = Sg.defaultKeyFile(path.join(SCRATCH, name));
    const earlyAt = path.join(SCRATCH, "boxless-905e-early.json");
    const share = path.join(SCRATCH, name, "share");
    let none = null, closed = false, detail = {};
    try {
      fs.mkdirSync(share, { recursive: true });
      const made = await s.ask("studio:key-make");
      process.env.STUDIO_TEST_BACKUP = earlyAt;
      const backed = await s.ask("studio:key-backup", PASS, "t", "k");
      delete process.env.STUDIO_TEST_BACKUP;
      const earlyDoc = fs.existsSync(earlyAt) ? JSON.parse(fs.readFileSync(earlyAt, "utf8")) : null;
      const team = Tm.newTeam({ catalogs: ["north-quay"], lead: { keyId: made.keyId, public: made.public } });
      const wrote = await Tm.writeTeam(share, team, { key: keyAt, passphrase: seen.secret });
      const oldBox = wrote.team.lead.box;
      const earlySealed = R.sealStatsLead(oldBox, wrote.team.id, wrote.team.lead.keyId, deskId, earlyText);
      const earlyOnA = opens(keyAt, earlySealed);
      s.done();
      closed = true;
      none = await loadShell("boxless-905e-none", { env: { STUDIO_TEST_RESTORE: earlyAt },
        thread: (verb, ...a) => real(verb, ...a) });
      const noneAt = Sg.defaultKeyFile(path.join(SCRATCH, "boxless-905e-none"));
      const nonePick = await none.ask("studio:key-restore-pick", "t", "k");
      const bare = await none.ask("studio:key-restore", nonePick.file, PASS);
      const barePub = boxPubOf(noneAt);
      const diskBox = leadBoxOf(share);
      const disk = JSON.parse(fs.readFileSync(Tm.teamPath(share), "utf8"));
      const midSealed = R.sealStatsLead(diskBox, disk.id, disk.lead.keyId, deskId, midText);
      const midOnB = opens(noneAt, midSealed);
      const earlyOnB = opens(noneAt, earlySealed);
      const changed = await Tm.writeTeam(share, wrote.team, { key: noneAt, passphrase: seen.secret });
      const newBox = changed.team.lead.box;
      const nextSealed = R.sealStatsLead(newBox, changed.team.id, changed.team.lead.keyId, deskId, nextText);
      const nextOnB = opens(noneAt, nextSealed);
      const earlyStill = opens(noneAt, earlySealed);
      const midStill = opens(noneAt, midSealed);
      detail = {
        said,
        made: !made.error && made.kept === "os",
        earlyBox: !!(earlyDoc && earlyDoc.box),
        backed: !backed.error,
        oldOpens: earlyOnA === earlyText && oldBox !== "",
        bare: !!(bare && bare.boxless === true && !bare.error) && barePub === "" && bare.public === made.public,
        unchanged: diskBox === oldBox && diskBox !== "",
        before: midOnB === null && earlyOnB === null,
        wrote: typeof newBox === "string" && newBox !== "" && newBox !== oldBox,
        after: nextOnB === nextText,
        still: earlyStill === null && midStill === null,
      };
    } catch (e) {
      detail = { said, threw: String(e && e.stack || e).slice(0, 500) };
    } finally {
      delete process.env.STUDIO_TEST_BACKUP;
      delete process.env.STUDIO_TEST_RESTORE;
      if (!closed) s.done();
      if (none) none.done();
    }
    check(detail.said === true && detail.oldOpens === true && detail.bare === true
          && detail.unchanged === true && detail.before === true && detail.wrote === true
          && detail.after === true && detail.still === true && detail.made === true
          && detail.earlyBox === false && detail.backed === true,
      "904e a boxless copy restored where no key stands leaves earlier statistics shut, and an envelope a desk"
      + " seals to the team file's box opens with the restored key only after this Studio's next team write,"
      + " which is the change the sentence names: " + JSON.stringify(detail));
  }

  /* ---- 3. OPEN THE FOLDER OPENS A LISTED CATALOG ---------------------------------------------- */
  {
    const ud = path.join(SCRATCH, "reveal");
    const root = path.join(ud, "Etiuda Studio");
    const dir = path.join(root, "Harbour lamps");
    const file = path.join(dir, "run.cmd");
    const outside = path.join(SCRATCH, "a folder");
    const missing = path.join(SCRATCH, "not here");
    fs.mkdirSync(dir, { recursive: true });
    fs.mkdirSync(outside, { recursive: true });
    fs.writeFileSync(file, "rem nothing\r\n");
    fs.writeFileSync(path.join(outside, "run.cmd"), "rem nothing\r\n");
    const s = await loadShell("reveal");
    const onFile = await s.ask("studio:reveal", file);
    const onNone = await s.ask("studio:reveal", missing);
    const onOut = await s.ask("studio:reveal", outside);
    const onDir = await s.ask("studio:reveal", dir);
    s.done();
    const quiet = (r) => !!(r && r.said && r.said.frame === "That path is not one Studio can show."
      && !JSON.stringify(r).includes("not here") && !JSON.stringify(r).includes("a folder"));
    check(onFile && onFile.said && onFile.said.frame === "no folder at {P}" && quiet(onNone) && quiet(onOut)
          && onDir && onDir.shown === dir && JSON.stringify(s.opened) === JSON.stringify([dir]),
      "3a Open the folder hands the system a listed catalog and nothing else: a file in it is not a folder,"
      + " a folder outside and a missing path are refused without the path, and the catalog is opened: "
      + JSON.stringify({ file: onFile && onFile.error, none: onNone && onNone.error, out: onOut && onOut.error, opened: s.opened }));
  }

  /* ---- 4. THE FUSES ----------------------------------------------------------------------------
     What electron-builder.js asks for, and the reader tools/package.mjs refuses a build by: on the
     stock Electron binary, which ships every one of them the other way, and on a copy of that
     binary's own wire flipped by @electron/fuses itself, as electron-builder flips it. */
  {
    const F = await import(pathToFileURL(path.join(ROOT, "tools", "fuses.mjs")).href);
    const want = F.wantedFuses();
    check(JSON.stringify(want) === JSON.stringify({ runAsNode: false, enableCookieEncryption: true,
      enableNodeOptionsEnvironmentVariable: false, enableNodeCliInspectArguments: false,
      enableEmbeddedAsarIntegrityValidation: true, onlyLoadAppFromAsar: true }),
      "4a electron-builder.js turns off node, NODE_OPTIONS and --inspect and turns on cookie encryption, the asar's"
      + " integrity and the asar alone: " + JSON.stringify(want));
    /* The binary is electron.exe on Windows and electron on Linux; the wire is the same in both. */
    const stock = path.join(ROOT, "node_modules", "electron", "dist", process.platform === "win32" ? "electron.exe" : "electron");
    let onStock = null;
    try { onStock = await F.fuseProblems(stock, want); } catch (e) { onStock = [String(e && e.message)]; }
    check(Array.isArray(onStock) && onStock.length === 6
          && Object.keys(want).every(k => onStock.some(l => l.indexOf(k + " is ") === 0)),
      "4b CONTROL: the stock Electron binary, which ships all six the other way, is read as wrong"
      + " on each: " + JSON.stringify(onStock));
    const { flipFuses, FuseVersion, FuseV1Options } = require("@electron/fuses");
    const bytes = fs.readFileSync(stock), SENTINEL = "dL7pKGdnNz796PbbjQWNKmHXBZaB9tsX";
    const at = bytes.indexOf(SENTINEL);
    const wireAt = path.join(SCRATCH, "wire.bin");
    fs.writeFileSync(wireAt, Buffer.concat([Buffer.from("MZ padding "),
      bytes.subarray(at, at + SENTINEL.length + 2 + bytes[at + SENTINEL.length + 1])]));
    const flip = (o) => flipFuses(wireAt, Object.assign({ version: FuseVersion.V1 }, o));
    const byIndex = {};
    for (const [k, v] of Object.entries(want)) byIndex[FuseV1Options[k.charAt(0).toUpperCase() + k.slice(1)]] = v;
    await flip(byIndex);
    const flipped = await F.fuseProblems(wireAt, want);
    await flip({ [FuseV1Options.RunAsNode]: true });
    const one = await F.fuseProblems(wireAt, want);
    check(at > 0 && flipped.length === 0 && one.length === 1 && one[0].indexOf("runAsNode is on") === 0,
      "4c the same wire flipped as electron-builder flips it reads as asked, and with node turned"
      + " back on names that one fuse: " + JSON.stringify([flipped, one]));
    /* THE ENGINE'S THREE REFUSALS, which this fork lacked until board 858 (H3): a binary holding two
       wires, an ask of no fuses, and a build with no program where the step looks. The twin is what
       electron-builder's flipper makes of two blocks (it flips the first and the last); the decoy is a
       good first wire ahead of a last one with node turned back on, which the library, reading the
       first, would call good. */
    await flip(byIndex);
    const lifted = fs.readFileSync(wireAt);
    const twin = path.join(SCRATCH, "twin.bin");
    fs.writeFileSync(twin, Buffer.concat([lifted, Buffer.from("MZ second "), lifted.subarray(11)]));
    const decoyBytes = fs.readFileSync(twin);
    decoyBytes[decoyBytes.lastIndexOf(SENTINEL) + SENTINEL.length + 2 + FuseV1Options.RunAsNode] = 49;
    const decoy = path.join(SCRATCH, "decoy.bin");
    fs.writeFileSync(decoy, decoyBytes);
    const reads = async f => { try { return await F.fuseProblems(f, want); } catch (e) { return ["threw " + (e && e.message)]; } };
    const onTwin = await reads(twin), onDecoy = await reads(decoy), onOne = await reads(wireAt);
    check(onTwin.length === 1 && /2 fuse blocks/.test(onTwin[0]) && onDecoy.length === 1 && /2 fuse blocks/.test(onDecoy[0])
          && onOne.length === 0,
      "4d a binary holding two fuse blocks is refused, the two good and the second one wrong alike, and the"
      + " single wire beside them still reads as asked: " + JSON.stringify([onTwin, onDecoy, onOne]));
    let onEmpty;
    try { onEmpty = await F.fuseProblems(wireAt, {}); } catch (e) { onEmpty = ["threw " + (e && e.message)]; }
    check(Array.isArray(onEmpty) && onEmpty.length === 1 && /asks for no fuse/.test(onEmpty[0]),
      "4e an ask of no fuses is refused rather than passing every binary: " + JSON.stringify(onEmpty));
    const missing = path.join(SCRATCH, "no-such-program.exe");
    let onMissing, onGood;
    try { onMissing = await F.packagedFuseProblems(missing, want); onGood = await F.packagedFuseProblems(wireAt, want); }
    catch (e) { onMissing = ["threw " + (e && e.message)]; }
    check(Array.isArray(onMissing) && onMissing.length === 1 && /is not there/.test(onMissing[0])
          && Array.isArray(onGood) && onGood.length === 0,
      "4f the packaging step's question refuses a build with no program where it looks, and passes the good"
      + " wire: " + JSON.stringify([onMissing, onGood]));
    /* 4g, THE CALL SITE. 4d to 4f hold the question; nothing held that tools/package.mjs 3b asks it.
       Reverting 3b alone (the silent `existsSync(exeAt)` skip) left every leg green (the test
       architect's read of harness-858, 2026-10-07). Read from the source with its comments out: the
       condition guarding the fuse read is the build's status alone, and its block asks
       packagedFuseProblems of exeAt. */
    const pkg = withoutComments(fs.readFileSync(path.join(ROOT, "tools", "package.mjs"), "utf8"), "package.mjs");
    const siteAt = pkg.indexOf("packagedFuseProblems(exeAt");
    const ifAt = siteAt < 0 ? -1 : pkg.lastIndexOf("if (", siteAt);
    const cond = ifAt < 0 ? "" : pkg.slice(ifAt + 4, pkg.indexOf("{", ifAt)).replace(/\s+/g, "");
    check(siteAt > 0 && cond === "r.status===0)" && !/existsSync\(exeAt\)/.test(pkg)
          && (pkg.match(/packagedFuseProblems\(exeAt/g) || []).length === 1,
      "4g tools/package.mjs 3b asks packagedFuseProblems of the built program whenever the build succeeded,"
      + " with no existsSync(exeAt) skip: condition " + JSON.stringify(cond));
    /* 4h, THE PLANT: electron-builder.js's text with plant:fuse-cookie's line put in another form, evaluated as the build
       reads it, every signing variable cleared; its ask then lacks the cookie fuse, and the wire with that fuse turned
       back, refused under the real ask, passes under the lifted one. */
    if (PLANTS_OFF) console.log("  NOT RUN 4h, plant:fuse-cookie lifted (ETIUDA_PLANTS=off)");
    else {
      const EBT = fs.readFileSync(path.join(ROOT, "electron-builder.js"), "utf8");
      const EBL = EBT.split("\n").map(l => l.includes("plant:fuse-cookie") ? "    /* plant:fuse-cookie */" : l).join("\n");
      const quiet = (await import(pathToFileURL(path.join(ROOT, "tools", "sellable.mjs")).href)).SIGNING_VARS, was = {};
      let liftedAsk = {};
      for (const k of quiet) { was[k] = process.env[k]; delete process.env[k]; }
      try { const m = { exports: {} };
        new Function("require", "__dirname", "module", "exports", EBL)(createRequire(path.join(ROOT, "electron-builder.js")), ROOT, m, m.exports);
        liftedAsk = m.exports.electronFuses || {}; }
      finally { for (const k of quiet) if (was[k] != null) process.env[k] = was[k]; }
      await flip(byIndex);
      await flip({ [FuseV1Options.EnableCookieEncryption]: false });
      const realOn = await F.fuseProblems(wireAt, want), liftedOn = await F.fuseProblems(wireAt, liftedAsk);
      check(EBL !== EBT && !("enableCookieEncryption" in liftedAsk) && liftedOn.length === 0
            && realOn.length === 1 && /^enableCookieEncryption is off where electron-builder\.js asks for it on/.test(realOn[0]),
        "4h with plant:fuse-cookie lifted the ask has no cookie fuse and a wire without it passes, which the real ask refuses: "
        + JSON.stringify(realOn));
    }
  }

  /* ---- 5. A DIALOG SPEAKS THE PAGE'S WORDS -----------------------------------------------------
     The export's file-type list was named by this process, in English, so a Polish Studio's save
     dialog said "Etiuda catalog" under a Polish title (survey finding 26). Held as a class: every
     channel whose handler opens a dialog, read out of shell/main.js by its pick( call, is pressed
     through the preload's own function for it, every value the page could hand over a word of its
     own, and every word the dialogs then show must be one of those. The dialogs are counted
     against the pick( sites, so a picker this leg did not reach fails rather than passes. */
  {
    const mainText = fs.readFileSync(MAIN, "utf8");
    const sites = (mainText.match(/await pick\(/g) || []).length;
    const channels = mainText.split(/\nanswer\(/).slice(1)
      .filter(b => /await pick\(/.test(b)).map(b => (/^"([^"]+)"/.exec(b) || [])[1]);
    const s = await loadShell("words", { env: { STUDIO_TEST_ROOT: "",
      STUDIO_TEST_FILE: "", STUDIO_TEST_V1: "", STUDIO_TEST_SAVE: "", STUDIO_TEST_PACK: "" } });
    let bridge = null;
    const stub = { contextBridge: { exposeInMainWorld: (k, api) => { bridge = api; } },
                   ipcRenderer: { invoke: (ch, ...a) => s.ask(ch, ...a), send() {}, on() {} } };
    const load = Module._load;
    Module._load = function (req) { return req === "electron" ? stub : load.apply(this, arguments); };
    try { delete require.cache[PRELOAD]; require(PRELOAD); } finally { Module._load = load; }
    /* A PAGE'S VALUE IS A STRING THAT ALSO ANSWERS AS AN OBJECT, so one value serves a title, a
       name and the import's pair of names alike without this leg knowing which picker takes
       which: String() of it is its word, and .files and .all are two more. */
    const given = new Set();
    let n = 0;
    const word = () => { const w = "[page word " + (++n) + "]"; given.add(w); return w; };
    const value = () => Object.assign(new String(word()), { files: word(), all: word() });
    const pressed = [];
    for (const m of fs.readFileSync(PRELOAD, "utf8")
      .matchAll(/(\w+):\s*\(([^)]*)\)\s*=>\s*ipcRenderer\.invoke\("([^"]+)"/g)) {
      if (channels.indexOf(m[3]) < 0 || !bridge || typeof bridge[m[1]] !== "function") continue;
      const takes = m[2].split(",").map(x => x.trim()).filter(Boolean).length;
      await bridge[m[1]](...Array.from({ length: takes }, value));
      pressed.push(m[1]);
    }
    s.done();
    const shown = s.dialogs.flatMap(o => [o.title, o.buttonLabel, o.message, o.nameFieldLabel]
      .concat((o.filters || []).map(f => f.name)).filter(w => w !== undefined));
    const own = shown.filter(w => !given.has(w));
    check(sites >= 6 && channels.length === sites && pressed.length === sites
          && s.dialogs.length === sites && own.length === 0,
      "5a every word in the " + s.dialogs.length + " dialogs the shell opens, one per pick( site of "
      + sites + ", pressed through the preload's " + JSON.stringify(pressed) + ", is one the page"
      + " handed over" + (own.length ? "; the shell's own: " + JSON.stringify(own) : ""));
  }

  /* ---- 6. AN INSTALLED STUDIO TAKES NO DEBUGGING SWITCH AND NO VARIABLE THAT POINTS IT ELSEWHERE
   * One shell, two places, one environment: the tree's own, and a copy under a folder named
   * app.asar, which is how shell/main.js and src/licence.mjs know an installed copy. The tree taking
   * every variable is the control that proves the installed half was asked and not merely quiet. */
  {
    const inst = path.join(SCRATCH, "installed", "resources", "app.asar");
    for (const d of ["shell", "src", "ui", "engine/pinned/shell"]) fs.cpSync(path.join(ROOT, d), path.join(inst, d), { recursive: true });
    fs.copyFileSync(path.join(ROOT, "package.json"), path.join(inst, "package.json"));
    standGateOpen(path.join(inst, "shell", "main.js"));
    const V = (n) => path.join(SCRATCH, "planted", n);
    for (const d of ["projects", "root", "share", "pack"]) fs.mkdirSync(V(d), { recursive: true });
    for (const f of ["rows.csv", "old.js", "key.json", "licence.js"]) fs.writeFileSync(V(f), "");
    const env = { STUDIO_NET_LOG: V("net.json"), STUDIO_NO_PROXY_SERVER: "off", STUDIO_PROJECTS: V("projects"),
      STUDIO_SIGNING_KEY: V("key.json"), STUDIO_LICENCE_FILE: V("licence.js"), STUDIO_TEST_ROOT: V("root"),
      STUDIO_TEST_FILE: V("rows.csv"), STUDIO_TEST_V1: V("old.js"),
      STUDIO_TEST_SAVE: V("out.ec"), STUDIO_TEST_PACK: V("pack") };
    const planted = Object.values(env).filter((v) => v !== "off");
    const DEBUG = ["remote-debugging-port", "remote-debugging-pipe"];
    const strings = (x, acc) => { if (typeof x === "string") acc.push(x);
      else if (x && typeof x === "object") Object.values(x).forEach((v) => strings(v, acc)); return acc; };
    /* THE SECOND PASS is the same environment with the US spelling of the licence variable in place
       of the British one. Both together would hide one: the shell reads STUDIO_LICENSE_FILE first, so
       the British path is never taken beside it and 6a would fail for the wrong reason. */
    const env2 = Object.assign({}, env, { STUDIO_LICENSE_FILE: V("licence-us.js") });
    delete env2.STUDIO_LICENCE_FILE;
    fs.writeFileSync(V("licence-us.js"), "");
    const planted2 = Object.values(env2).filter((v) => v !== "off");
    const read = async (main, e, list, tag) => {
      e = e || env; list = list || planted;
      const s = await loadShell((main ? "installed" : "tree-env") + (tag || ""), { env: e, main, switches: DEBUG });
      const answers = [];
      for (const [ch, ...a] of [["studio:projects"], ["studio:pick-root", "t"],
        ["studio:import-pick", "t", {}], ["studio:v1-pick", "t"], ["studio:bring-pick", "t", "All files"], ["studio:export-pick", "t", "n"],
        ["studio:audit-pack-pick", "t"], ["studio:audit", "d", "e1"],
        ["studio:publish-plan", "d"]]) answers.push(await s.ask(ch, ...a));
      s.done();
      const seen = strings([answers, s.calls, s.switched], []).map((v) => path.resolve(v.replace(/^log-net-log=/, "")));
      return { s, took: list.filter((p) => seen.indexOf(path.resolve(p)) > -1) };
    };
    const tree = await read(null), installed = await read(path.join(inst, "shell", "main.js"));
    check(tree.took.length === planted.length && tree.s.dialogs.length === 0
          && tree.s.switched.indexOf("no-proxy-server") < 0 && tree.s.removed.length === 0,
      "6a CONTROL: the tree's shell takes all " + tree.took.length + " of " + planted.length + " planted paths"
      + (tree.took.length < planted.length ? " (not " + JSON.stringify(planted.filter((p) => tree.took.indexOf(p) < 0)) + ")" : "") + ","
      + " opens " + tree.s.dialogs.length + " dialog(s), keeps its proxy lookup on STUDIO_NO_PROXY_SERVER=off"
      + " and removes " + tree.s.removed.length + " debugging switch(es)");
    /* The installed copy's switches are the proxy reader's, and that reader is the pin's. On Windows, with the key planted
       as direct (QUIET, never this machine's), it is ["no-proxy-server"]. Off Windows the pin decides, by Claude gamma's ruling
       of 2026-11-13 03:22 (cloud-answers.md, entry 65): "My ruling: return no switch off Windows", and its
       windowsProxySwitches answers before it starts any program, so the leg reads it rather than holding Windows' list
       everywhere (it read red on Linux for the leg, not the product; his sweep of 2026-11-14). 8a to 8m already name
       their platform as win32 through loadShell, and 8n holds Linux, so they stay as they are. */
    const wantSwitched = process.platform === "win32" ? ["no-proxy-server"]
      : require(path.join(PINNED_SHELL, "win-proxy.cjs")).windowsProxySwitches().map((s) => s.join("="));
    check(installed.took.length === 0 && installed.s.dialogs.length === 6
          && JSON.stringify(installed.s.switched) === JSON.stringify(wantSwitched),
      "6b an installed copy under the same environment takes " + installed.took.length + " planted path(s)"
      + (installed.took.length ? " " + JSON.stringify(installed.took) : "") + ", opens a dialog at each of"
      + " the six pickers (" + installed.s.dialogs.length + "), and its switches are "
      + JSON.stringify(installed.s.switched));
    const tree2 = await read(null, env2, planted2, "-us"), installed2 = await read(path.join(inst, "shell", "main.js"), env2, planted2, "-us");
    check(tree2.took.length === planted2.length && tree2.s.dialogs.length === 0,
      "6e CONTROL of the second pass: with the US spelling STUDIO_LICENSE_FILE planted in place of the British one, the tree's shell takes all "
      + tree2.took.length + " of " + planted2.length + " planted paths"
      + (tree2.took.length < planted2.length ? " (not " + JSON.stringify(planted2.filter((p) => tree2.took.indexOf(p) < 0)) + ")" : ""));
    check(installed2.took.length === 0 && installed2.s.dialogs.length === 6,
      "6f an installed copy under the second pass takes " + installed2.took.length + " planted path(s)"
      + (installed2.took.length ? " " + JSON.stringify(installed2.took) : "") + " and opens a dialog at each of the six pickers ("
      + installed2.s.dialogs.length + ")");
    check(JSON.stringify(installed.s.removed) === JSON.stringify(DEBUG)
          && installed.s.said.filter((l) => /is not taken by an installed Studio/.test(l)).length === 2,
      "6c an installed copy removes " + JSON.stringify(installed.s.removed) + " before ready and says so in "
      + installed.s.said.filter((l) => /is not taken/.test(l)).length + " line(s)");
    /* The publish's own fallback, which the command line reaches without the shell. */
    const pub = async (root) => { try { return (await import(pathToFileURL(path.join(root, "src", "publish.mjs")).href)).licenceFileFor; }
                                  catch (e) { return null; } };
    const was = process.env.STUDIO_LICENCE_FILE, ud = path.join(SCRATCH, "publish-user-data");
    process.env.STUDIO_LICENCE_FILE = env.STUDIO_LICENCE_FILE;
    const fromTree = await pub(ROOT), fromInst = await pub(inst);
    const t = fromTree && fromTree({ userData: ud }), i = fromInst && fromInst({ userData: ud });
    if (was === undefined) delete process.env.STUDIO_LICENCE_FILE; else process.env.STUDIO_LICENCE_FILE = was;
    check(t === env.STUDIO_LICENCE_FILE && typeof i === "string" && path.dirname(i) === ud,
      "6d a publish with no licence file named takes STUDIO_LICENCE_FILE in the tree (" + (t === env.STUDIO_LICENCE_FILE)
      + ") and the profile's own file when installed: " + (fromInst ? JSON.stringify(i) : "no licenceFileFor in src/publish.mjs"));
    /* 6d AGAIN with the US spelling, which the fallback reads first: the shell's 6e and 6f closed the shell's half of it. */
    const wasUs = process.env.STUDIO_LICENSE_FILE, wasGb = process.env.STUDIO_LICENCE_FILE;
    process.env.STUDIO_LICENSE_FILE = env2.STUDIO_LICENSE_FILE; delete process.env.STUDIO_LICENCE_FILE;
    const tUs = fromTree && fromTree({ userData: ud }), iUs = fromInst && fromInst({ userData: ud });
    if (wasUs === undefined) delete process.env.STUDIO_LICENSE_FILE; else process.env.STUDIO_LICENSE_FILE = wasUs;
    if (wasGb === undefined) delete process.env.STUDIO_LICENCE_FILE; else process.env.STUDIO_LICENCE_FILE = wasGb;
    check(tUs === env2.STUDIO_LICENSE_FILE && typeof iUs === "string" && path.dirname(iUs) === ud,
      "6g 6d again with the US spelling STUDIO_LICENSE_FILE: a publish takes it in the tree (" + (tUs === env2.STUDIO_LICENSE_FILE)
      + ") and the profile's own file when installed: " + (fromInst ? JSON.stringify(iUs) : "no licenceFileFor in src/publish.mjs"));
  }

  /* ---- 6h, 6i. THE ROOT A RELAY GRANT TRACES TO IS THE VENDOR'S IN AN INSTALLED STUDIO (board 935, slice G3)
   * studio:team-new judges the grant beside the signing key under the pinned relay's own root, and the tree's gates name an
   * invented one with STUDIO_RELAY_ROOT. One lead, one grant signed by the pinned grant kit's test root and placed beside the key,
   * one environment, two places: the tree's shell takes the root and the press goes on to the thread (the control), an installed
   * copy ignores it and refuses in the licence sentence without asking the thread to make anything. */
  {
    const kit = require(path.join(ROOT, "engine", "pinned", "relay", "test", "grant-kit.cjs"));
    const Sg = await import(pathToFileURL(path.join(ROOT, "src", "sign.mjs")).href);
    const Rl = await import(pathToFileURL(path.join(ROOT, "src", "relay.mjs")).href);
    const made = await Sg.makeKeyFile({ passphrase: "a passphrase for the relay root gate" });
    const inst = path.join(SCRATCH, "relay-root-installed", "resources", "app.asar");
    for (const d of ["shell", "src", "ui", "engine/pinned/shell", "engine/pinned/relay"]) fs.cpSync(path.join(ROOT, d), path.join(inst, d), { recursive: true });
    fs.copyFileSync(path.join(ROOT, "package.json"), path.join(inst, "package.json"));
    standGateOpen(path.join(inst, "shell", "main.js"));
    /* The key and its grant sit in the profile's own folder, where an installed Studio looks and where the tree is pointed. */
    const plant = (name) => {
      const ud = path.join(SCRATCH, name);
      fs.mkdirSync(ud, { recursive: true });
      const keyFile = path.join(ud, "signing-key.json");
      fs.writeFileSync(keyFile, JSON.stringify(made, null, 1) + "\n");
      fs.writeFileSync(path.join(ud, "relay-grant.json"), JSON.stringify(kit.grantFor(made.public, Date.now()), null, 1) + "\n");
      return keyFile;
    };
    const thread = (verb) => verb === "teamFacts" ? { file: "none", folder: null, mark: null }
      : verb === "startRelayTeam" ? Promise.reject(new Error("the press reached the thread")) : {};
    const press = async (name, main) => {
      const keyFile = plant(name);
      const s = await loadShell(name, { main, thread, env: { STUDIO_SIGNING_KEY: keyFile, STUDIO_KEY_PASSPHRASE: "x", STUDIO_RELAY_ROOT: kit.ROOT.pub } });
      const reply = await s.ask("studio:team-new"); /* was studio:team-relay on a catalog, retired 2026-11-26: the same judge, with no catalog */
      s.done();
      return { s, reply, reached: s.calls.some((c) => c[0] === "startRelayTeam") };
    };
    const tree = await press("relay-root-tree", null), installed = await press("relay-root-installed", path.join(inst, "shell", "main.js"));
    check(tree.reached && !!tree.reply && tree.reply.error === "the press reached the thread",
      "6h CONTROL: the tree's shell takes STUDIO_RELAY_ROOT, so a grant signed by the invented root holds and the press goes on to the thread: reached "
      + tree.reached + ", reply " + JSON.stringify(tree.reply && tree.reply.error));
    check(!installed.reached && !!installed.reply && installed.reply.error === Rl.GRANT_SAID.other && !!installed.reply.said && installed.reply.said.frame === Rl.GRANT_SAID.other
          && installed.s.calls.every((c) => c[0] === "teamFacts"),
      "6i an installed copy under the same environment ignores STUDIO_RELAY_ROOT, judges the grant under the vendor's root and refuses in the sentence for a licence not issued by Etiuda,"
      + " asking the thread for nothing but the project's facts: reached " + installed.reached + ", reply " + JSON.stringify(installed.reply && installed.reply.error)
      + ", calls " + JSON.stringify(installed.s.calls.map((c) => c[0])));
  }

  /* ---- 7. A LAUNCH THE DOOR REFUSES HAS WRITTEN NOTHING ---------------------------------------
   * A packaged Studio takes its projects folder from the profile's store, so a harness launch pins
   * the store first, and the door's refusal exists because two labs once wrote the real profile.
   * The order is the whole claim: the store is written only after the refusal has passed. Driven,
   * not read: runStudio is handed the real profile's path (APPDATA moved into scratch before
   * shell-door.mjs is loaded, which is when it reads it), and the installer gate's launch() is
   * taken out of its file and run against a door that refuses. 7b and 7d are the controls: the
   * same calls, let through, do pin the folder, so 7a and 7c are the order's doing. */
  {
    const seed = JSON.stringify({ root: "C:/the person's own projects", lang: "pl" });
    const real = path.join(SCRATCH, "real-appdata"), profile = path.join(real, "etiuda-studio");
    const projects = path.join(SCRATCH, "door-projects");
    fs.mkdirSync(profile, { recursive: true });
    fs.writeFileSync(path.join(profile, "studio.json"), seed);
    const keep = { APPDATA: process.env.APPDATA, XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME };
    process.env.APPDATA = real; process.env.XDG_CONFIG_HOME = real;
    let door, go;
    try { door = await import(pathToFileURL(path.join(HERE, "shell-door.mjs")).href + "?real-profile"); }
    finally { for (const [k, v] of Object.entries(keep)) if (v === undefined) delete process.env[k]; else process.env[k] = v; }
    go = door.runStudio;
    const noExe = path.join(SCRATCH, "no-such-app", "Etiuda Studio.exe");
    let said = "";
    try { go("tests/shell-guards.mjs", { exe: noExe, userDataDir: profile, projects }); }
    catch (e) { said = String(e && e.message || e); }
    const after = fs.readFileSync(path.join(profile, "studio.json"), "utf8");
    check(/is this machine's own Studio profile/.test(said) && after === seed
          && fs.readdirSync(profile).join() === "studio.json",
      "7a runStudio handed the real profile's folder is refused (" + JSON.stringify(said.split("\n")[0].slice(0, 60))
      + ") and its store is byte for byte what it was (" + (after === seed) + "), with nothing else written beside it");
    const lab = path.join(SCRATCH, "lab-profile");
    fs.mkdirSync(lab, { recursive: true });
    fs.writeFileSync(path.join(lab, "studio.json"), JSON.stringify({ lang: "pl" }));
    let letThrough = "";
    /* A launch let through carries the window wall's word; its exe does not exist, so nothing opens. */
    const wordWas = process.env[WINDOWS_VAR];
    process.env[WINDOWS_VAR] = WINDOWS_DAY;
    try { go("tests/shell-guards.mjs", { exe: noExe, userDataDir: lab, projects }); }
    catch (e) { letThrough = String(e && e.message || e); }
    finally { if (wordWas === undefined) delete process.env[WINDOWS_VAR]; else process.env[WINDOWS_VAR] = wordWas; }
    let pinned = {};
    try { pinned = JSON.parse(fs.readFileSync(path.join(lab, "studio.json"), "utf8")); } catch (e) { pinned = {}; }
    check(letThrough === "" && pinned.root === projects && pinned.lang === "pl",
      "7b control: the same call into a profile of the run's own passes the door and pins the folder, keeping the rest of the store: "
      + JSON.stringify(pinned) + (letThrough ? "; refused: " + letThrough.split("\n")[0] : ""));

    const text = fs.readFileSync(path.join(HERE, "installer.mjs"), "utf8");
    const from = text.indexOf("\nfunction launch(E, exe, projects, userData, ms) {");
    const upto = from < 0 ? -1 : text.indexOf("\n}\n", from);
    let spawned = 0;
    const stand = () => { spawned++; return { status: 0, stdout: "studio-launch ok=1\n", stderr: "" }; };
    const build = () => new Function("fs", "path", "spawnSync", "DOCS", text.slice(from, upto + 3) + "\nreturn launch;")(fs, path, stand, path.join(SCRATCH, "docs"));
    const ud = path.join(SCRATCH, "installer-real-profile");
    fs.mkdirSync(ud, { recursive: true });
    fs.writeFileSync(path.join(ud, "studio.json"), seed);
    const shut = from > -1 && build()({ shellLaunchRefusal: () => ["would launch the real profile"] }, noExe, projects, ud);
    check(from > -1 && upto > from && !!shut && Array.isArray(shut.refused) && spawned === 0
          && fs.readFileSync(path.join(ud, "studio.json"), "utf8") === seed,
      "7c the installer gate's launch(), taken from tests/installer.mjs and run against a door that refuses, spawns "
      + spawned + " time(s), returns the refusal and leaves the store byte for byte as it was ("
      + (fs.readFileSync(path.join(ud, "studio.json"), "utf8") === seed) + ")");
    const ud2 = path.join(SCRATCH, "installer-lab-profile");
    fs.mkdirSync(ud2, { recursive: true });
    const went = from > -1 && build()({ shellLaunchRefusal: () => null }, noExe, projects, ud2);
    let store2 = {};
    try { store2 = JSON.parse(fs.readFileSync(path.join(ud2, "studio.json"), "utf8")); } catch (e) { store2 = {}; }
    check(!!went && went.refused === null && spawned === 1 && store2.root === projects,
      "7d control: against a door that lets it through the same launch() pins the folder (" + JSON.stringify(store2.root)
      + ") and spawns once (" + spawned + ")");

    /* 7e: realProfileGuard refuses on real profile path (exit 78) and real folder listing is identical before and after */
    const roots = door.realProfileFolders();
    const realUd = roots[0];
    const snapshotDir = dir => {
      if (!fs.existsSync(dir)) return null;
      const map = {};
      for (const ent of fs.readdirSync(dir).sort()) {
        try {
          const st = fs.statSync(path.join(dir, ent));
          map[ent] = { size: st.size, mtimeMs: st.mtimeMs };
        } catch (e) { map[ent] = { error: e.code }; }
      }
      return map;
    };
    const appAtStart7e = door.isInstalledAppRunning ? door.isInstalledAppRunning() : false;
    const snapBefore = snapshotDir(realUd);
    const runNode = code => spawnSync(process.execPath, ["--input-type=module", "-e", code], { cwd: ROOT, encoding: "utf8", windowsHide: true });
    const r7e = runNode('import { realProfileGuard } from "./tests/shell-door.mjs"; realProfileGuard(' + JSON.stringify(realUd) + ');');
    const snapAfter = snapshotDir(realUd);
    const appAtEnd7e = door.isInstalledAppRunning ? door.isInstalledAppRunning() : false;
    const appRan7e = appAtStart7e || appAtEnd7e;
    const snapSame = JSON.stringify(snapBefore) === JSON.stringify(snapAfter);
    const refused7e = r7e.status === 78 && r7e.stdout.indexOf("#refused real-profile") > -1;
    if (appRan7e) {
      check(refused7e,
        "7e realProfileGuard refuses on real profile path (exit 78) (the real profile changed while the installed app ran, so it cannot be attributed): status=" + r7e.status);
    } else {
      check(refused7e && snapSame,
        "7e realProfileGuard refuses on real profile path (exit 78) and real profile is untouched: status=" + r7e.status + ", same=" + snapSame);
    }

    /* 7f: realProfileGuard lets lab path through */
    const labWallDir = path.join(SCRATCH, "wall-lab-dir");
    fs.mkdirSync(labWallDir, { recursive: true });
    const r7f = runNode('import { realProfileGuard } from "./tests/shell-door.mjs"; realProfileGuard(' + JSON.stringify(labWallDir) + '); console.log("OK_LAB");');
    check(r7f.status === 0 && r7f.stdout.indexOf("OK_LAB") > -1,
      "7f realProfileGuard lets a lab path through: status=" + r7f.status);

    /* 7g: safeListing on unreadable folder refuses with exit 78 rather than returning [] */
    const unreadDir = path.join(SCRATCH, "unreadable-standin");
    fs.mkdirSync(unreadDir, { recursive: true });
    let unreadTested = false;
    const unreadBinds = denyBinds(SCRATCH, process.env.USERNAME || "Everyone", ["(RD)"], LIST);
    if (!unreadBinds.binds) {
      skip("7g safeListing on unreadable folder refuses with exit 78 rather than returning []: " + unreadBinds.why);
      try { fs.rmdirSync(unreadDir); } catch (e) {}
    } else try {
      if (process.platform === "win32") {
        execFileSync("icacls", [unreadDir, "/deny", (process.env.USERNAME || "Everyone") + ":(RD)"], { windowsHide: true });
      } else {
        fs.chmodSync(unreadDir, 0);
      }
      const r7g = runNode('import { safeListing } from "./tests/shell-door.mjs"; const list = safeListing(' + JSON.stringify(unreadDir) + '); console.log("EMPTY=" + list.length);');
      unreadTested = r7g.status === 78 && r7g.stdout.indexOf("EMPTY") === -1 && r7g.stdout.indexOf("#refused unreadable-folder") > -1;
    } finally {
      if (process.platform === "win32") {
        try { execFileSync("icacls", [unreadDir, "/remove:d", (process.env.USERNAME || "Everyone")], { windowsHide: true }); } catch (e) {}
      } else {
        try { fs.chmodSync(unreadDir, 0o755); } catch (e) {}
      }
      try { fs.rmdirSync(unreadDir); } catch (e) {}
    }
    if (unreadBinds.binds) check(unreadTested, "7g safeListing on unreadable folder refuses with exit 78 rather than returning []");

    /* 7h: safeMove verifies move (source gone, destination matches size and mtime) */
    const mSrc = path.join(SCRATCH, "move-src.txt"), mDst = path.join(SCRATCH, "move-dst.txt");
    fs.writeFileSync(mSrc, "content to move", "utf8");
    const r7h = runNode('import { safeMove } from "./tests/shell-door.mjs"; safeMove(' + JSON.stringify(mSrc) + ', ' + JSON.stringify(mDst) + '); console.log("MOVE_OK");');
    const moveOk = r7h.status === 0 && !fs.existsSync(mSrc) && fs.existsSync(mDst) && fs.readFileSync(mDst, "utf8") === "content to move";
    check(moveOk, "7h safeMove verifies move: source gone and destination holds content: " + moveOk);
  }

  /* ---- 8. THE PROXY IS CHOSEN FROM WINDOWS' OWN SETTING, BEFORE READY ---------------------------
   * The key is planted (QUIET and regDump above), never read from this machine. 8a to 8c are the
   * quiet start and the one program it asks, 8d to 8j what a start does with each answer, 8e and 8k
   * the controls that show those can fail, 8l and 8m the reader on its own. A copy of the shell with
   * its proxy line cut, or replaced by a stub that ignores the reader, is made in scratch. */
  {
    const LINE = "for (const s of windowsProxySwitches()) app.commandLine.appendSwitch(...s);";
    const MAIN_TEXT = fs.readFileSync(MAIN, "utf8");
    const copyWith = (name, text) => {
      const at = path.join(SCRATCH, name);
      for (const d of ["shell", "src", "ui", "engine/pinned/shell"]) fs.cpSync(path.join(ROOT, d), path.join(at, d), { recursive: true });
      fs.copyFileSync(path.join(ROOT, "package.json"), path.join(at, "package.json"));
      fs.writeFileSync(path.join(at, "shell", "main.js"), text);
      return path.join(at, "shell", "main.js");
    };
    const asked = (s) => JSON.stringify(s.switched);
    const run = async (name, o) => { const s = await loadShell(name, Object.assign({ platform: "win32" }, o)); s.done(); return s; };
    const SERVER = regDump([["ProxyEnable", "REG_DWORD", "0x1"], ["ProxyServer", "REG_SZ", "proxy.example.test:3128"],
      ["ProxyOverride", "REG_SZ", "<local>"]]);
    /* The server and its bypass list together: since the pin's 3b4dde61 an enabled server carries ProxyOverride as Chromium's
       bypass list, so the planted key's "<local>" is asked beside it. */
    const SERVER_ASKED = '["proxy-server=proxy.example.test:3128","proxy-bypass-list=<local>"]';

    const quiet = await run("proxy-quiet");
    check(asked(quiet) === '["no-proxy-server"]',
      "8a where Windows' flags say direct alone and nothing is named, Studio asks Chromium for --no-proxy-server, once, so"
      + " an idle Studio does no proxy discovery and no IPv6 probe: " + asked(quiet));
    /* 8a2 THE BUMP'S OWN CASE (the pin at 2916825f brought the engine's A8): automatic detection on, as Windows writes it,
       flags 0x09 in the Connections key, with nothing named, leaves Chromium's resolver to find an office's proxy. */
    const detect = await run("proxy-detect", { reg: (argv) => (String(argv[1]) === CONN_KEY ? connDump(9, CONN_KEY) : QUIET) });
    check(asked(detect) === "[]",
      "8a2 where Windows' flags say automatic detection and nothing is named, Studio asks for no switch: " + asked(detect));
    const PROXY_ASKS = [["query", POLICY_KEY], ["query", REG_KEY], ["query", CONN_KEY]];
    check(quiet.regCalls.length === PROXY_ASKS.length && quiet.regCalls.every((c, i) => c[0] === REG_TOOL
          && JSON.stringify(c[1]) === JSON.stringify(PROXY_ASKS[i])),
      "8b the one program it starts for that is Windows' reg tool at its fixed system path, asking for machine"
      + " policy, the user's Internet Settings and its Connections key, each once: "
      + JSON.stringify(quiet.regCalls));
    check(MAIN_TEXT.split(LINE).length === 2, "8c the shell holds its proxy line exactly once, so the control copy can cut it");
    const cut = await run("proxy-cut", { main: copyWith("proxy-cut", MAIN_TEXT.split(LINE).join("")) });
    check(cut.switched.length === 0,
      "8d THE CONTROL: a copy of the shell with that one line removed asks for no proxy switch, so 8a can fail: " + asked(cut));
    const server = await run("proxy-server", { reg: SERVER });
    check(asked(server) === SERVER_ASKED,
      "8e a configured proxy server is followed, and the no-proxy switch is not asked: " + asked(server));
    const script = await run("proxy-script", { reg: regDump([["ProxyEnable", "REG_DWORD", "0x0"],
      ["AutoConfigURL", "REG_SZ", "http://wpad.example.test/proxy.pac"]]) });
    check(asked(script) === '["proxy-pac-url=http://wpad.example.test/proxy.pac"]',
      "8f a configured setup-script address is followed: " + asked(script));
    const stale = await run("proxy-stale", { reg: regDump([["ProxyEnable", "REG_DWORD", "0x0"],
      ["ProxyServer", "REG_SZ", "proxy.example.test:3128"]]) });
    check(asked(stale) === '["no-proxy-server"]',
      "8g a server left in the key while Windows has the proxy switched off is not followed: " + asked(stale));
    const failing = await run("proxy-fails", { reg: new Error("reg.exe did not answer") });
    check(asked(failing) === "[]",
      "8h a reg tool that fails leaves Chromium's resolver: " + asked(failing));
    const off = await run("proxy-off", { reg: SERVER, env: { STUDIO_NO_PROXY_SERVER: "off" } });
    check(off.switched.length === 0 && off.regCalls.length === 0,
      "8i the harness's STUDIO_NO_PROXY_SERVER=off in the tree asks for no proxy switch and does not start the tool: "
      + asked(off) + ", " + off.regCalls.length + " call(s)");
    const inst = path.join(SCRATCH, "installed", "resources", "app.asar", "shell", "main.js");
    const installed = await run("proxy-installed", { main: inst, reg: SERVER, env: { STUDIO_NO_PROXY_SERVER: "off" } });
    check(fs.existsSync(inst) && asked(installed) === SERVER_ASKED,
      "8j an installed copy ignores that variable and follows the configured server: " + asked(installed));
    const stub = await run("proxy-stub", { reg: SERVER,
      main: copyWith("proxy-stub", MAIN_TEXT.split(LINE).join('app.commandLine.appendSwitch("no-proxy-server");')) });
    check(asked(stub) !== SERVER_ASKED && asked(stub) === '["no-proxy-server"]',
      "8k THE CONTROL: a shell that ignores the reader and always asks for no proxy, handed the planted server, does not give"
      + " the server, so 8e goes red on it: " + asked(stub));
    const P = require(path.join(PINNED_SHELL, "win-proxy.cjs"));
    const out = (x) => JSON.stringify(P.proxySwitchesFrom(x));
    const NONE = '[["no-proxy-server"]]';
    check(out(regDump([["ProxyEnable", "REG_DWORD", "0x1"], ["ProxyServer", "REG_SZ", ""], ["Next", "REG_SZ", "other.example.test:1"]])) === NONE
          && out(regDump([["ProxyEnable", "REG_DWORD", "0x1"], ["AutoConfigURL", "REG_SZ", ""], ["ProxyServer", "REG_SZ", ""]])) === NONE,
      "8l the reader on its own: a switched-on proxy with no address, whether the value is empty or missing, is none");
    check(out(regDump([["ProxyEnable", "REG_DWORD", "0x1"], ["ProxyServer", "REG_SZ", "http=a.example.test:1;https=b.example.test:2"],
            ["AutoConfigURL", "REG_EXPAND_SZ", "https://pac.example.test/a.pac"]])) === '[["proxy-pac-url","https://pac.example.test/a.pac"]]'
          && out(regDump([["ProxyEnable", "REG_DWORD", "0x1"], ["ProxyServer", "REG_SZ", "http=a.example.test:1;https=b.example.test:2"]]))
            === '[["proxy-server","http=a.example.test:1;https=b.example.test:2"]]'
          && out(regDump([["AutoConfigURL", "REG_SZ", "ftp://pac.example.test/a.pac"]])) === NONE
          && out(regDump([["AutoConfigURL", "REG_SZ", "not an address"]])) === NONE
          && out("") === NONE && out(undefined) === NONE,
      "8m the reader on its own: a script outranks a server, a per-scheme server list passes whole, an address that is not http,"
      + " https or file is none, and no text at all is none");
    const linux = await run("proxy-linux", { platform: "linux", reg: SERVER });
    check(asked(linux) === '[]' && linux.regCalls.length === 0,
      "8n on Linux, with the same configured server planted, the shell starts no program and passes no proxy switch, so Chromium's"
      + " own resolver follows the environment and the desktop (the engine's win-proxy.cjs since f8d72888, Claude gamma's measure on"
      + " Ubuntu with a local proxy, 2026-11-13; GNOME's automatic mode without a script, KDE and macOS unmeasured): "
      + asked(linux) + ", " + linux.regCalls.length + " call(s)");
  }

  /* ---- 10. ON LINUX A TEAM NEEDS A KEYRING ------------------------------------------------------
     safeStorage on Linux says encryption is available even where no secret service answered and it
     fell back to "basic_text", whose password is Chromium's own; the shell counts that, and
     "unknown", as no vault. Driven through the desks screen and Make a team (studio:team-new), with the thread stood in,
     under four storages: a keyring, the fallback, an unknown backend, and Windows' shape. MOVED 2026-11-26 (the pass over
     the retired folder mechanics): was driven through Sealed (studio:team-sealed, retired), and the control read that the
     press kept a key and asked the thread; Make a team is refused for want of a grant before it keeps one, so the control
     now reads that the press was not refused for want of a keyring, which is the refusal it is the first to meet. */
  {
    const K = await import(pathToFileURL(path.join(ROOT, "src", "team-store.mjs")).href);
    const storage = (backend) => Object.assign({}, FAKE_VAULT_STORAGE,
      backend === undefined ? {} : { getSelectedStorageBackend: () => backend });
    const run = async (name, backend, platform) => {
      const s = await loadShell(name, { safeStorage: storage(backend), platform, thread: (verb, dir, a, o) => {
        if (verb === "teamFacts") return Promise.resolve({ folder: path.join(SCRATCH, name, "share"), file: "none", team: null,
          signing: "k-lead", inside: false, mark: null, id: "c" });
        return Promise.resolve({ verb });
      } });
      const desks = await s.ask("studio:desks", "d");
      const made = await s.ask("studio:team-new");
      const asked = s.calls.some((c) => c[0] === "startRelayTeam");
      s.done();
      const at = K.teamsFile(path.join(SCRATCH, name));
      return { canKeep: desks.canKeep, noKeyring: desks.noKeyring, error: String(made.error || ""), noKeyringSaid: /no keyring is open to seal it/.test(String(made.error || "")),
               windowsSaid: /cannot keep a team key for this Windows account/.test(String(made.error || "")), asked,
               kept: fs.existsSync(at) ? Object.keys(JSON.parse(fs.readFileSync(at, "utf8")).teams || {}).length : 0 };
    };
    const ring = await run("vault-keyring", "gnome_libsecret", "linux");
    check(ring.canKeep === true && ring.noKeyring === undefined && !!ring.error && !ring.noKeyringSaid && !ring.windowsSaid && !ring.asked && ring.kept === 0,
      "10a CONTROL: with a keyring behind safeStorage the desks screen can keep a key and Make a team is not refused for want of one (it meets the grant's refusal first): " + JSON.stringify(ring));
    const basic = await run("vault-basic", "basic_text", "linux");
    check(basic.canKeep === false && basic.noKeyring === true && basic.noKeyringSaid && !basic.asked && basic.kept === 0,
      "10b with safeStorage fallen back to basic_text the desks screen says no keyring, and Make a team is refused before the"
      + " thread is asked, keeping nothing: " + JSON.stringify(basic));
    const unknown = await run("vault-unknown", "unknown", "linux");
    check(unknown.canKeep === false && unknown.noKeyring === true && unknown.noKeyringSaid && unknown.kept === 0,
      "10c an unknown backend is no keyring either: " + JSON.stringify(unknown));
    const win = await run("vault-windows", undefined, "win32");
    check(win.canKeep === true && win.noKeyring === undefined && !!win.error && !win.noKeyringSaid && !win.windowsSaid && win.kept === 0,
      "10d CONTROL: a safeStorage with no backend to ask, which is Windows', is answered by isEncryptionAvailable alone, as"
      + " before: " + JSON.stringify(win));
    const winUnknown = await run("vault-windows-unknown", "unknown", "win32");
    check(winUnknown.canKeep === true && winUnknown.noKeyring === undefined && !!winUnknown.error && !winUnknown.noKeyringSaid && !winUnknown.windowsSaid && winUnknown.kept === 0,
      "10e CONTROL: on Windows the backend is never asked, so even a safeStorage answering \"unknown\" is not refused for want of a keyring: "
      + JSON.stringify(winUnknown));
    /* A keyring asked for by name (section 14) that does not answer: the backend reads gnome_libsecret, and encryption is
       unavailable. That is no vault, the screen says no keyring and how to have one, and Make a signing key refuses so. */
    const dumb = (name, platform) => loadShell(name, { platform,
      safeStorage: Object.assign({}, FAKE_VAULT_STORAGE, { isEncryptionAvailable: () => false, getSelectedStorageBackend: () => "gnome_libsecret" }) });
    const HOW = "To have one, install GNOME Keyring (the gnome-keyring package) or KDE Wallet, sign in again and reopen Studio.";
    const deaf = await dumb("vault-deaf", "linux");
    const deafSigning = (await deaf.ask("studio:signing")).signing || {}, deafMake = await deaf.ask("studio:key-make");
    const deafSaid = deaf.said.filter((l) => /keyring backend/.test(l));
    deaf.done();
    check(deafSigning.canKeep === false && deafSigning.noKeyring === true && String(deafMake.error).endsWith("no keyring is open to seal it. " + HOW)
      && JSON.stringify(deafSaid) === JSON.stringify(["studio  keyring backend gnome_libsecret, encryption available false"]),
      "10f a keyring asked for that does not answer is no vault: no keyring on the screen, Make a signing key refused with how"
      + " to have one, and the backend and availability said once: " + JSON.stringify([deafSigning.canKeep, deafSigning.noKeyring, deafMake.error, deafSaid]));
    const deafWin = await dumb("vault-deaf-windows", "win32");
    const winMake = await deafWin.ask("studio:key-make"), winSigning = (await deafWin.ask("studio:signing")).signing || {};
    const winSaid = deafWin.said.filter((l) => /keyring/.test(l));
    deafWin.done();
    check(winSigning.canKeep === false && winSigning.noKeyring === undefined
      && winMake.error === "This computer cannot keep a signing key for this Windows account." && winSaid.length === 0,
      "10g CONTROL: the same storage on Windows refuses as it did, in the Windows account's words, and says nothing of a keyring: "
      + JSON.stringify([winSigning.noKeyring, winMake.error, winSaid]));
  }

  /* ---- 11. SPELLING ON LINUX COMES FROM THE PACKAGE, BEFORE THE WINDOW, AND WINDOWS IS NOT TOUCHED ------------------
     Until 2026-10-06 this leg held the opposite: on Linux no languages, the checker off and the window asking for none,
     because Chromium there downloads its dictionaries from Google's servers. Now the package carries the English and
     Polish files and the shell copies them into the profile, where Chromium reads them before it would download; the
     address it is given is the package's own folder, which its loader cannot fetch from, so a language without a file
     asks nothing of the network. The installed package's net log is tests/linux-studio.mjs's. The resources folder is
     planted with invented bytes under the two names; the platform is stood in at load, which is when the shell decides. */
  {
    const NAMES = ["en-US-10-1.bdic", "pl-PL-3-0.bdic"];
    const RES = path.join(SCRATCH, "spell-resources"), DICT = path.join(RES, "dictionaries");
    fs.mkdirSync(DICT, { recursive: true });
    NAMES.forEach((n, i) => fs.writeFileSync(path.join(DICT, n), "planted dictionary " + i + " " + n));
    const into = (name) => path.join(SCRATCH, name, "Dictionaries");
    const same = (name, n) => { try { return fs.readFileSync(path.join(into(name), n)).equals(fs.readFileSync(path.join(DICT, n))); } catch { return false; } };
    const listed = (name) => (fs.existsSync(into(name)) ? fs.readdirSync(into(name)).sort() : []);
    const want = '["address ' + pathToFileURL(DICT).href + '/","languages [\\"en-US\\",\\"pl\\"]"]';
    const linux = await loadShell("spell-linux", { platform: "linux", resources: RES }); linux.done();
    const lw = linux.win ? linux.win.opts.webPreferences || {} : {};
    check(JSON.stringify(linux.spell) === want && !("spellcheck" in lw),
      "11a on Linux, before the window, the session's dictionary address is the package's own folder and its languages are"
      + " English and Polish, the checker is not turned off and the window carries no spellcheck key: " + JSON.stringify([linux.spell, Object.keys(lw)]));
    check(JSON.stringify(listed("spell-linux")) === JSON.stringify(NAMES) && NAMES.every(n => same("spell-linux", n)),
      "11c the two files are copied byte for byte into the profile's Dictionaries folder under Chromium's own casing: "
      + JSON.stringify(listed("spell-linux")));
    const inode = fs.statSync(path.join(into("spell-linux"), NAMES[0])).ino;
    fs.writeFileSync(path.join(into("spell-linux"), NAMES[1]), "a damaged copy");
    const again = await loadShell("spell-linux", { platform: "linux", resources: RES }); again.done();
    check(fs.statSync(path.join(into("spell-linux"), NAMES[0])).ino === inode && NAMES.every(n => same("spell-linux", n)),
      "11d a second start keeps a whole copy as it is and replaces one with other bytes");
    const bare = await loadShell("spell-bare", { platform: "linux", resources: path.join(SCRATCH, "spell-nothing") }); bare.done();
    const notPlaced = bare.said.filter(l => /the spelling dictionary .* was not placed: ENOENT/.test(l)).length;
    check(listed("spell-bare").length === 0 && notPlaced === 2 && bare.spell.length === 2 && !/AFTER-WINDOW/.test(bare.spell.join()),
      "11e a package without the files places nothing, says so once a file, and still gives the address and the languages"
      + " before the window: " + JSON.stringify([bare.spell, notPlaced]));
    const win = await loadShell("spell-windows", { platform: "win32", resources: RES }); win.done();
    const ww = win.win ? win.win.opts.webPreferences || {} : {};
    check(win.spell.length === 0 && !("spellcheck" in ww) && !fs.existsSync(into("spell-windows")),
      "11b CONTROL: on Windows the spellchecker is not touched, the window's preferences carry no spellcheck key and no"
      + " Dictionaries folder is made, as before: " + JSON.stringify([win.spell, Object.keys(ww)]));
    const TEXT = fs.readFileSync(MAIN, "utf8"), CASED = 'files: ["en-US-10-1.bdic", "pl-PL-3-0.bdic"]';
    const at = path.join(SCRATCH, "spell-lower");
    for (const d of ["shell", "src", "ui", "engine/pinned/shell"]) fs.cpSync(path.join(ROOT, d), path.join(at, d), { recursive: true });
    fs.copyFileSync(path.join(ROOT, "package.json"), path.join(at, "package.json"));
    fs.writeFileSync(path.join(at, "shell", "main.js"), TEXT.split(CASED).join('files: ["en-us-10-1.bdic", "pl-pl-3-0.bdic"]'));
    const lower = await loadShell("spell-lower", { platform: "linux", resources: RES, main: path.join(at, "shell", "main.js") }); lower.done();
    check(TEXT.split(CASED).length === 2 && !(JSON.stringify(listed("spell-lower")) === JSON.stringify(NAMES) && NAMES.every(n => same("spell-lower", n))),
      "11F CONTROL: the shell copying under the lowercased names, the measured trap, fails 11c: " + JSON.stringify(listed("spell-lower")));
  }

  /* ---- 12. EVERY MEMBER OF THE BRIDGE IS ONE THE PAGE CALLS ------------------------------------
     A member the page never calls is a door into this process that nothing uses, and the worker
     thread dispatches by the verb's name, so a dead member can carry a dead verb down with it
     (board 858: tagUses, lint and onMaximized sat unused, the last behind a comment promising a
     glyph the page never drew). The bridge's members are read off the preload as Electron would
     take them; a member counts as called where the page's own scripts name it as API.<member>
     or STUDIO.<member>. The page never indexes the bridge, and 12a holds that too, or a member
     reached by a computed name would read as dead here. */
  {
    let bridge = null;
    const stub = { contextBridge: { exposeInMainWorld: (k, api) => { bridge = api; } },
                   ipcRenderer: { invoke() {}, send() {}, on() {} } };
    const load = Module._load;
    Module._load = function (req) { return req === "electron" ? stub : load.apply(this, arguments); };
    try { delete require.cache[PRELOAD]; require(PRELOAD); } finally { Module._load = load; }
    /* READ WITH ITS COMMENTS TAKEN OUT (board 858, Claudius δ's carve): a call kept only in a
       comment is not a call, and 12e and 12f plant one each. Strings stay, by tests/source-text.mjs. */
    const page = fs.readdirSync(path.join(ROOT, "ui")).filter(f => /\.(js|html)$/.test(f))
      .map(f => withoutComments(fs.readFileSync(path.join(ROOT, "ui", f), "utf8"), f)).join("\n");
    const uncalled = (text) => Object.keys(bridge || {})
      .filter(k => !new RegExp("\\b(?:API|STUDIO)\\." + k + "\\b").test(text));
    const indexed = /\b(?:API|STUDIO)\s*\[/.test(page);
    const dead = uncalled(page).filter(k => k !== "signinDoorClose");
    check(!!bridge && Object.keys(bridge).length > 40 && !indexed && dead.length === 0,
      "12a every one of the bridge's " + Object.keys(bridge || {}).length + " members (save retired signinDoorClose) is called by the page, which"
      + " never indexes it" + (dead.length ? "; called by nothing: " + JSON.stringify(dead) : ""));
    const planted = uncalled(page.split(/\bAPI\.projects\b/).join("API.elsewhere")).filter(k => k !== "signinDoorClose");
    check(JSON.stringify(planted) === JSON.stringify(dead.concat(["projects"]).sort((a, b) =>
      Object.keys(bridge).indexOf(a) - Object.keys(bridge).indexOf(b))),
      "12b CONTROL: the page's calls of projects taken out, 12a names it: " + JSON.stringify(planted));
    /* The host answer is the same question one level down: each key the shell puts into it is read
       by the page off the answer (h.<key>, host.<key> or S.host.<key>); it once carried trialFrom, for a store write that is gone,
       and signinDoor for the door's retired first-time memory. */
    const hostSrc = (/answer\("studio:host", async \(\) => \(\{([\s\S]*?)\n\}\)\);/.exec(fs.readFileSync(MAIN, "utf8")) || [])[1] || "";
    const hostKeys = Array.from(hostSrc.matchAll(/^ {2}(\w+):/gm), m => m[1]);
    const unread = (text) => hostKeys.filter(k => k !== "signinDoor" && !new RegExp("\\b(?:h|host|S\\.host)\\." + k + "\\b").test(text));
    const idle = unread(page);
    check(hostKeys.length >= 10 && hostKeys.indexOf("trialFrom") < 0 && idle.length === 0,
      "12c every key of the host answer, " + JSON.stringify(hostKeys) + " (none of them trialFrom; retired signinDoor excepted), is read by the page"
      + (idle.length ? "; read by nothing: " + JSON.stringify(idle) : ""));
    const hostPlanted = unread(page.split(/\bh\.backdrop\b/).join("h.elsewhere"));
    check(hostPlanted.slice().sort().join() === idle.concat(["backdrop"]).sort().join(),
      "12d CONTROL: the page's read of backdrop taken out, 12c names it: " + JSON.stringify(hostPlanted));
    const commentOnly = (text, from, to, note) => withoutComments(text.split(from).join(to) + note, "app.js");
    const memberInComment = uncalled(commentOnly(page, /\bAPI\.projects\b/, "API.elsewhere",
      "\n// the list once came from API.projects()\n/* STUDIO.projects() */\n"));
    check(memberInComment.indexOf("projects") > -1,
      "12e CONTROL: the page's calls of projects kept only in a line and a block comment, 12a names it: "
      + JSON.stringify(memberInComment));
    const keyInComment = unread(commentOnly(page, /\bh\.backdrop\b/, "h.elsewhere", "\n/* the cover read h.backdrop here */\n"));
    check(keyInComment.indexOf("backdrop") > -1,
      "12f CONTROL: the page's read of backdrop kept only in a comment, 12c names it: " + JSON.stringify(keyInComment));
    /* 12g THE PROXY'S THREE ARE WIRED IN THE PRELOAD (fold 59, the test architect's read of 3f72c7d7): the page stays quiet in a
       host without onProxyAsk, proxyAsks and proxyAnswer, so a preload that lost one would leave a person behind a Basic proxy
       never asked, without a word; 12a holds only that the page calls them. The preload is compiled as Electron would take it
       with a recording ipcRenderer, and each of the three must reach its own channel. 12h plants a preload with proxyAsks dropped. */
    const PRELOAD_TEXT = fs.readFileSync(PRELOAD, "utf8");
    const bridgeOf = (text) => {
      let api = null; const calls = [];
      const rec = { contextBridge: { exposeInMainWorld: (k, a) => { api = a; } }, webUtils: { getPathForFile: () => "" },
                    ipcRenderer: { invoke: (ch, ...a) => { calls.push(["invoke", ch, a]); return Promise.resolve(null); },
                                   send: (ch, ...a) => { calls.push(["send", ch, a]); }, on: (ch) => { calls.push(["on", ch]); } } };
      const m = new Module(PRELOAD, null); m.filename = PRELOAD; m.paths = Module._nodeModulePaths(path.dirname(PRELOAD));
      const load = Module._load;
      Module._load = function (req) { return req === "electron" ? rec : load.apply(this, arguments); };
      try { m._compile(text, PRELOAD); } finally { Module._load = load; }
      return { api, calls };
    };
    const proxyWired = ({ api, calls }) => {
      if (!api || ["onProxyAsk", "proxyAsks", "proxyAnswer"].some(k => typeof api[k] !== "function")) return false;
      calls.length = 0;
      api.onProxyAsk(() => {}); api.proxyAsks(); api.proxyAnswer("q1", "u", "p");
      return JSON.stringify(calls) === JSON.stringify([["on", "studio:proxy-ask"], ["invoke", "studio:proxy-asks", []],
        ["invoke", "studio:proxy-answer", ["q1", "u", "p"]]]);
    };
    check(proxyWired(bridgeOf(PRELOAD_TEXT)),
      "12g the preload exposes onProxyAsk, proxyAsks and proxyAnswer, wired to studio:proxy-ask, studio:proxy-asks and studio:proxy-answer");
    const PROXY_ASKS_LINE = /^[ \t]*proxyAsks:[^\n]*\n/m;
    const dropped = PRELOAD_TEXT.replace(PROXY_ASKS_LINE, "");
    check(PROXY_ASKS_LINE.test(PRELOAD_TEXT) && dropped !== PRELOAD_TEXT && !proxyWired(bridgeOf(dropped)),
      "12h CONTROL: a preload with proxyAsks dropped fails 12g");
    /* 12i EVERY TEAM VERB THE SHELL ANSWERS HAS A MEMBER ON THE BRIDGE (the pass over the retired folder mechanics, 2026-11-26): 12a holds that the page
       calls every member, and this holds the other way for the verbs that make and change a team, so a team verb that only a leg reaches cannot stay
       behind as a second way to make a team. studio:team-sealed and studio:team-relay stood so, with their bridge members gone since the
       chosen folder was retired. */
    const MAIN_TEXT = fs.readFileSync(MAIN, "utf8");
    const teamVerbs = (text) => Array.from(text.matchAll(/\banswer\("(studio:team-[a-z-]+)"/g), (m) => m[1]);
    const bridgedVerbs = new Set(Array.from(PRELOAD_TEXT.matchAll(/invoke\("(studio:team-[a-z-]+)"/g), (m) => m[1]));
    const orphans = (text) => teamVerbs(text).filter((v) => !bridgedVerbs.has(v));
    check(teamVerbs(MAIN_TEXT).length >= 8 && orphans(MAIN_TEXT).length === 0,
      "12i every one of the shell's " + teamVerbs(MAIN_TEXT).length + " team verbs has a member on the bridge" + (orphans(MAIN_TEXT).length ? "; no member: " + JSON.stringify(orphans(MAIN_TEXT)) : ""));
    const orphaned = orphans(MAIN_TEXT + '\nanswer("studio:team-orphan", async () => null);\n');
    check(JSON.stringify(orphaned) === JSON.stringify(orphans(MAIN_TEXT).concat(["studio:team-orphan"])),
      "12j CONTROL: a team verb added to the shell with no bridge member is named by 12i: " + JSON.stringify(orphaned));
  }

  /* ---- 13. THE WINDOW TELLS THE PAGE IT IS MAXIMISED, as the desk's does (Maxim, 2026-10-08 12:56: "With Studio tour and
     maximize button, follow the desk."). The window reaches that state without the button (a double-click on the band, a
     snap, Windows key and an arrow), so the shell says so on each change and the host answer carries it at the start; the
     page's half is tests/follow-desk.mjs 4. */
  {
    const s = await loadShell("maximise");
    const sent = [];
    let max = false;
    if (s.win) { s.win.isMaximized = () => max; s.win.webContents.send = (ch, v) => { sent.push([ch, v]); }; }
    const host0 = s.handlers["studio:host"] ? await s.ask("studio:host") : {};
    max = true; if (s.win) await s.fire("winOn", "maximize");
    max = false; if (s.win) await s.fire("winOn", "unmaximize");
    check(JSON.stringify(sent) === JSON.stringify([["studio:maximized", true], ["studio:maximized", false]]),
      "13a maximise and restore each send the window's state to the page: " + JSON.stringify(sent));
    max = true;
    const host1 = s.handlers["studio:host"] ? await s.ask("studio:host") : {};
    check(host0.maximized === false && host1.maximized === true,
      "13b the host answer carries the state the page starts from: " + JSON.stringify([host0.maximized, host1.maximized]));
    sent.length = 0;
    if (s.win) await s.fire("winOn", "resize");
    check(sent.length === 0, "13C CONTROL: a resize that is neither sends nothing: " + JSON.stringify(sent));
    s.done();
  }

  /* ---- 14. ON LINUX THE KEYRING IS ASKED FOR BY NAME WHERE CHROMIUM WOULD CHOOSE ITS OWN PASSWORD ------------------------
     Before ready Chromium names the desktop (base/nix/xdg_util.cc) and picks its store from that (SelectBackend,
     key_storage_util_linux.cc): KDE 3, LXQt and a desktop it cannot name get "basic_text". The engine's
     tests/shell-office.mjs 14 holds the naming case by case; here the switch Studio asks for on each side of the line, 14f
     none where no keyring answers unlocked on the bus, 14D the Windows control and 14E the shell without its one append. */
  {
    const CLEAR = { XDG_CURRENT_DESKTOP: null, DESKTOP_SESSION: null, GNOME_DESKTOP_SESSION_ID: null, KDE_FULL_SESSION: null, KDE_SESSION_VERSION: null };
    const bus = (owner, alias, locked) => (args) => {
      if (args.indexOf("org.freedesktop.DBus.NameHasOwner") > -1) return "   boolean " + owner + "\n";
      if (args.indexOf("org.freedesktop.Secret.Service.ReadAlias") > -1) return "   " + alias + "\n";
      if (args.indexOf("org.freedesktop.DBus.Properties.Get") > -1) return "   variant       boolean " + locked + "\n";
      throw new Error("asked " + args.join(" "));
    };
    const RING = bus(true, "/org/freedesktop/secrets/collection/login", false);
    const as = async (name, platform, env, o) => {
      const s = await loadShell(name, Object.assign({ platform, env: Object.assign({}, CLEAR, env), bus: RING }, o || {})); s.done(); return s; };
    const store = (s) => s.switched.filter((w) => /password-store/.test(w));
    const told = (s) => s.said.filter((l) => /keyring/.test(l));
    const SAID = "studio  this desktop names no keyring Chromium knows, so Studio asks for one by name: --password-store=gnome-libsecret";
    const basic = [];
    for (const [i, env] of [{}, { XDG_CURRENT_DESKTOP: "LXQt" }, { XDG_CURRENT_DESKTOP: "sway" }, { DESKTOP_SESSION: "kde" }].entries())
      basic.push(await as("ring-basic-" + i, "linux", env));
    check(basic.every((s) => JSON.stringify(store(s)) === '["password-store=gnome-libsecret"]' && JSON.stringify(told(s)) === JSON.stringify([SAID])),
      "14a on Linux where Chromium would pick basic_text (no desktop named, LXQt, one it cannot name, KDE 3), with a keyring"
      + " answering unlocked, Studio asks for libsecret before ready and says so once: " + JSON.stringify(basic.map((s) => [store(s), told(s).length])));
    const kept = [];
    for (const [i, env] of [{ XDG_CURRENT_DESKTOP: "GNOME" }, { XDG_CURRENT_DESKTOP: "ubuntu:GNOME" }, { XDG_CURRENT_DESKTOP: "KDE", KDE_SESSION_VERSION: "6" },
      { XDG_CURRENT_DESKTOP: "KDE" }, { XDG_CURRENT_DESKTOP: "X-Cinnamon" }, { XDG_CURRENT_DESKTOP: "XFCE" },
      { XDG_CURRENT_DESKTOP: "MATE", DESKTOP_SESSION: "mate" }, { XDG_CURRENT_DESKTOP: "COSMIC" }].entries())
      kept.push(await as("ring-kept-" + i, "linux", env));
    check(kept.every((s) => store(s).length === 0 && told(s).length === 0 && s.busCalls.length === 0),
      "14b where Chromium names a keyring for the desktop (GNOME, KDE 4 and 6, Cinnamon, XFCE, MATE, COSMIC) Studio changes"
      + " nothing and asks the bus nothing, so a key sealed there stays open: " + JSON.stringify(kept.map((s) => [store(s).length, s.busCalls.length])));
    const NONE = "studio  this desktop names no keyring Chromium knows, and none answers unlocked on the session bus, so none is asked for";
    const deaf = [];
    for (const [i, b] of [bus(false, "/", true), bus(true, "/", false), bus(true, "/org/freedesktop/secrets/collection/login", true), null].entries())
      deaf.push(await as("ring-deaf-" + i, "linux", { XDG_CURRENT_DESKTOP: "LXQt" }, { bus: b }));
    check(deaf.every((s) => store(s).length === 0 && JSON.stringify(told(s)) === JSON.stringify([NONE]))
      && deaf[0].busCalls.length === 1 && deaf[0].busCalls[0].indexOf("org.freedesktop.DBus.NameHasOwner") > -1,
      "14f on LXQt where no keyring answers unlocked (none running, where only its name is asked, so none is started; one with"
      + " no default collection; one locked; no bus at all) nothing is asked for and Studio says so: "
      + JSON.stringify(deaf.map((s) => [store(s).length, s.busCalls.length])));
    const named = [await as("ring-named", "linux", { XDG_CURRENT_DESKTOP: "LXQt" }, { switches: ["password-store"] }),
      await as("ring-selection", "linux", { XDG_CURRENT_DESKTOP: "LXQt" }, { switches: ["enable-encryption-selection"] })];
    check(named.every((s) => store(s).length === 0),
      "14c a store the command line names, or Chromium's own choice asked for, is left as given: " + JSON.stringify(named.map(store)));
    const win = await as("ring-windows", "win32", {});
    check(JSON.stringify(win.switched) === '["no-proxy-server"]' && told(win).length === 0 && win.busCalls.length === 0,
      "14D CONTROL: on Windows, with no desktop named, Studio's switches are the proxy's alone, as before: " + JSON.stringify(win.switched));
    const APPEND = "app.commandLine.appendSwitch(...KEYRING_SWITCH);", TEXT = fs.readFileSync(MAIN, "utf8");
    const at = path.join(SCRATCH, "ring-cut");
    for (const d of ["shell", "src", "ui", "engine/pinned/shell"]) fs.cpSync(path.join(ROOT, d), path.join(at, d), { recursive: true });
    fs.copyFileSync(path.join(ROOT, "package.json"), path.join(at, "package.json"));
    fs.writeFileSync(path.join(at, "shell", "main.js"), TEXT.split(APPEND).join(""));
    const cut = await as("ring-cut-run", "linux", { XDG_CURRENT_DESKTOP: "LXQt" }, { main: path.join(at, "shell", "main.js") });
    check(TEXT.split(APPEND).length === 2 && store(cut).length === 0,
      "14E CONTROL: the same shell without its one append asks for no store on LXQt, so 14a can fail: " + JSON.stringify(store(cut)));
  }

  /* ---- 15. A RIGHT-CLICK IN A FIELD OPENS ITS EDIT MENU (studio-chrome-no-text-context-menu, 2026-10-12) -------------
     src/edit-menu.cjs over the context-menu event's params, a stand-in for the webContents keeping what is asked of it. */
  {
    const EM = require("../src/edit-menu.cjs");
    const asked = [];
    const wc = { replaceMisspelling: s => asked.push("replace:" + s),
      session: { addWordToSpellCheckerDictionary: s => asked.push("add:" + s) } };
    const flags = { canUndo: true, canCut: false, canCopy: false, canPaste: true, canSelectAll: true };
    const items = EM.editMenuFor(wc, { isEditable: true, misspelledWord: "dzienkujemy", editFlags: flags,
      dictionarySuggestions: ["dziękujemy", "dziękujesz", "a", "b", "c", "sixth"] }, EM.editWordsFor("pl"));
    const shape = items.map(i => i.type === "separator" ? "-" : i.role ? i.label + "(" + i.role + (i.enabled ? "" : ",off") + ")" : i.label);
    items[0].click(); items[5].click();
    check(shape.join("|") === "dziękujemy|dziękujesz|a|b|c|Dodaj do słownika|-|Cofnij(undo)|-|Wytnij(cut,off)|Kopiuj(copy,off)|Wklej(paste)|-|Zaznacz wszystko(selectAll)"
          && asked.join() === "replace:dziękujemy,add:dzienkujemy",
      "15a a misspelt word in a field offers five suggestions and Add to dictionary over the field's commands, each as the field says it can, in the page's language, and each acts: "
      + shape.join("|") + " " + asked.join());
    /* 15a's flags are the true ones for Undo, Paste and Select all, so a command wired always-on still passed. The
       other way round holds that polarity. Those two inputs share a value across Undo, Paste and Select all, and
       across Cut and Copy, so the loop below is what shows a role following another role's flag. */
    const inv = { canUndo: false, canCut: true, canCopy: true, canPaste: false, canSelectAll: false };
    const invOn = Object.fromEntries(EM.editMenuFor(wc, { isEditable: true, editFlags: inv }, EM.editWordsFor("en"))
      .filter(i => i.role).map(i => [i.role, i.enabled]));
    check(invOn.undo === false && invOn.cut === true && invOn.copy === true && invOn.paste === false && invOn.selectAll === false,
      "15a Undo, Paste and Select all off, and Cut and Copy on, each as that flag says: " + JSON.stringify(invOn));
    const ROLES = [["undo", "canUndo"], ["cut", "canCut"], ["copy", "canCopy"], ["paste", "canPaste"], ["selectAll", "canSelectAll"]];
    const crossed = [];
    for (const [role, flag] of ROLES) {
      const editFlags = { canUndo: false, canCut: false, canCopy: false, canPaste: false, canSelectAll: false };
      editFlags[flag] = true;
      const on = Object.fromEntries(EM.editMenuFor(wc, { isEditable: true, editFlags }, EM.editWordsFor("en"))
        .filter(i => i.role).map(i => [i.role, i.enabled]));
      for (const [r] of ROLES) if (on[r] !== (r === role)) crossed.push(flag + "->" + r);
    }
    check(crossed.length === 0,
      "15a each role follows its own flag and nothing else's, one flag at a time: " + (crossed.join(", ") || "all five"));
    const sel = EM.editMenuFor(wc, { isEditable: false, selectionText: " a path ", editFlags: { canCopy: true } }, EM.editWordsFor("en"));
    const none = EM.editMenuFor(wc, { isEditable: false, selectionText: "  ", editFlags: {} }, EM.editWordsFor("en"));
    check(sel.length === 1 && sel[0].role === "copy" && sel[0].label === "Copy" && sel[0].enabled === true && none.length === 0
          && EM.editWordsFor("xx") === EM.WORDS.en,
      "15b selected text outside a field gets Copy alone, and anywhere else nothing opens; a language without a table speaks English");
    const quiet = EM.editMenuFor(wc, { isEditable: true, editFlags: {}, dictionarySuggestions: ["x"] }, EM.editWordsFor("en"));
    check(quiet.length === 7 && quiet[0].role === "undo" && !quiet.some(i => i.label === "Add to dictionary" || i.label === "x"),
      "15b a field with no misspelt word offers the seven field entries and no suggestion or Add to dictionary: "
      + quiet.map(i => i.label || "-").join("|"));
    const outside = EM.editMenuFor(wc, { isEditable: false, misspelledWord: "teh", dictionarySuggestions: ["the"], selectionText: "" }, EM.editWordsFor("en"));
    check(outside.length === 0,
      "15b a misspelt word outside a field opens nothing: " + outside.map(i => i.label || "-").join("|"));
    const copyOff = EM.editMenuFor(wc, { isEditable: false, selectionText: "a path", editFlags: { canCopy: false } }, EM.editWordsFor("en"));
    check(copyOff.length === 1 && copyOff[0].role === "copy" && copyOff[0].enabled === false,
      "15b Copy over selected text is enabled only as the selection says it can copy: " + JSON.stringify(copyOff.map(i => i.enabled)));
    /* Drive the listener the shell registered. A gate's own value "1" also starts the paint probe, which waits half a
       minute for a page this stub never loads, so the guard is asked with STUDIO_GATE set to a value that is not that
       probe: the handler returns on any set value. */
    const menuShape = (items) => (items || []).map(i => i.type === "separator" ? "-" : i.role ? i.label + "(" + i.role + (i.enabled ? "" : ",off") + ")" : i.label).join("|");
    const PL = "dziękujemy|Dodaj do słownika|-|Cofnij(undo)|-|Wytnij(cut)|Kopiuj(copy)|Wklej(paste)|-|Zaznacz wszystko(selectAll)";
    const click = { isEditable: true, misspelledWord: "dzienkujemy", dictionarySuggestions: ["dziękujemy"],
      editFlags: { canUndo: true, canCut: true, canCopy: true, canPaste: true, canSelectAll: true } };
    const open = await loadShell("edit-menu-pl", { locale: "pl-PL", env: { STUDIO_LANG: null, STUDIO_GATE: null } });
    await open.fire("wcOn", "context-menu", {}, click);
    const shown = open.menus.filter(m => m.popped && m.popped.window === open.win);
    const shownShape = shown.length === 1 ? menuShape(shown[0].items) : "";
    open.done();
    const shut = await loadShell("edit-menu-gate", { locale: "pl-PL", env: { STUDIO_LANG: null, STUDIO_GATE: "held" } });
    await shut.fire("wcOn", "context-menu", {}, click);
    const gated = shut.menus.filter(m => m.popped).length;
    shut.done();
    check(shown.length === 1 && shownShape === PL && gated === 0,
      "15c the window's right-click builds that menu in the page's language and pops it up over the window, except while a gate drives it: "
      + shownShape + " popups " + shown.length + " gated " + gated);
    /* The drive answers at the points it drives. The parent's text, over the handler with comments taken out, still
       pins recoveryLang(), the return on any GATE_ASKED, the clicks on the window's webContents, and no empty popup. */
    const HANDLER = /win\.webContents\.on\("context-menu", \(e, p\) => \{\s*if \(GATE_ASKED\) return;\s*const items = editMenuFor\(win\.webContents, p, editWordsFor\(recoveryLang\(\)\)\);\s*if \(items\.length\) Menu\.buildFromTemplate\(items\)\.popup\(\{ window: win \}\);/;
    check(HANDLER.test(withoutComments(fs.readFileSync(MAIN, "utf8"), "main.js")),
      "15c the handler, comments aside, asks recoveryLang(), returns while GATE_ASKED, binds the clicks to the window's webContents and pops a menu only when it has items");
  }

  /* ---- 16. A NEW CARD'S SHAPE CROSSES AS A STRING (the Studio batch of 2026-10-12, E2) ------------------------------------
     The card-add channel carried four strings, a project, a category, a title and a text; the New card cover now names the
     reply's shape too, as a fifth. It crosses as the word sent, as "" where the page names none (src/studio.mjs makes that
     the card it always made, tests/card-new-shape.mjs ns3), and an object offered in its place crosses as a string, so no
     payload reaches the verb under that name (the verb refuses the string, ns4). The channel is asked for alts as well as
     for steps: a shell that dropped only that word would still pass the three asks above. The preload's addCard passes
     the five arguments through, so an omitted shape stays omitted and an object stays an object; the channel, above, is
     what makes them strings. */
  {
    const cardRoot = path.join(SCRATCH, "card-root");
    const s = await loadShell("card-add-shape", { env: { STUDIO_PROJECTS: cardRoot } });
    const offered = { shape: "steps", body: { en: "Written past the verb." } };
    await s.ask("studio:card-add", "d", "sh", "Widuma", "Sarnesk.", "steps");
    await s.ask("studio:card-add", "d", "sh", "Widuma", "Sarnesk.");
    await s.ask("studio:card-add", "d", "sh", "Widuma", "Sarnesk.", offered);
    await s.ask("studio:card-add", "d", "sh", "Widuma", "Sarnesk.", "alts");
    s.done();
    const got = s.calls.filter((c) => c[0] === "addCard").map((c) => c.slice(1));
    const cardDir = path.join(cardRoot, "d");
    check(got.length === 4 && JSON.stringify(got.slice(0, 2)) === JSON.stringify([[cardDir, "sh", "Widuma", "Sarnesk.", "steps"],
          [cardDir, "sh", "Widuma", "Sarnesk.", ""]]) && got.every((a) => a.length === 5 && a.every((v) => typeof v === "string"))
          && JSON.stringify(got[2].slice(0, 4)) === JSON.stringify([cardDir, "sh", "Widuma", "Sarnesk."])
          && JSON.stringify(got[3]) === JSON.stringify([cardDir, "sh", "Widuma", "Sarnesk.", "alts"]),
      "16a the card-add channel hands the thread the shape as the word sent, \"\" for none, a string for an object, and"
      + " \"alts\" last when Alternatives is named, beside the four strings it always carried: " + JSON.stringify(got));
    const heard = [];
    const stub = { contextBridge: { exposeInMainWorld: (k, api) => { stub.api = api; } },
      ipcRenderer: { invoke: async (ch, ...a) => { heard.push([ch].concat(a)); return null; }, send() {}, on() {} } };
    const load = Module._load;
    Module._load = function (req) { return req === "electron" ? stub : load.apply(this, arguments); };
    try { delete require.cache[PRELOAD]; require(PRELOAD); } finally { Module._load = load; }
    await stub.api.addCard("d", "sh", "Widuma", "Sarnesk.", "alts");
    await stub.api.addCard("d", "sh", "Widuma", "Sarnesk.");
    await stub.api.addCard("d", "sh", "Widuma", "Sarnesk.", offered);
    check(heard.length === 3 && heard.every((a) => a[0] === "studio:card-add" && a.length === 6)
          && JSON.stringify(heard[0]) === JSON.stringify(["studio:card-add", "d", "sh", "Widuma", "Sarnesk.", "alts"])
          && heard[1][1] === "d" && heard[1][2] === "sh" && heard[1][3] === "Widuma" && heard[1][4] === "Sarnesk."
          && heard[1][5] === undefined && heard[2][5] === offered
          && JSON.stringify(heard[2].slice(0, 5)) === JSON.stringify(["studio:card-add", "d", "sh", "Widuma", "Sarnesk."]),
      "16b the preload's addCard passes the five arguments through, an omitted shape included, and an object stays that object: "
      + JSON.stringify(heard));
  }

  /* ---- 17. NO PLANTED SAMPLE; THE FETCHED FILE OPENS BY THE PRESS'S ROAD -----------------------
     A fresh profile over an empty projects folder starts with no project, nothing in src/, shell/
     or ui/ exports a catalog builder for planting, and opening the sample reads the pinned engine's
     fetched file through studio:sample-pick -> studio:v1-plan -> studio:v1-land. */
  {
    const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
    const storeOf = (name) => path.join(SCRATCH, name, "studio.json");
    const walkJs = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : [])
      .flatMap((d) => d.isDirectory() ? walkJs(path.join(dir, d.name))
        : /\.(?:m?js|cjs|html)$/.test(d.name) ? [path.join(dir, d.name)] : []);
    const scanCatalogBuilders = (treeRoot) => {
      const hits = [];
      if (fs.existsSync(path.join(treeRoot, "src", "starter.mjs"))) hits.push("src/starter.mjs exists");
      for (const relDir of ["src", "shell", "ui"]) {
        for (const f of walkJs(path.join(treeRoot, relDir))) {
          const text = fs.readFileSync(f, "utf8");
          const rel = path.relative(treeRoot, f).split(path.sep).join("/");
          if (/\b(?:export\s*\{[^}]*\b(?:plantStarter|starterSet|starterShape)\b|export\s+(?:async\s+)?function\s+(?:plantStarter|starterSet|starterShape)\b)/.test(text))
            hits.push("builder export in " + rel);
          if (/\b(?:function|async\s+function)\s+plantFirstProject\b/.test(text))
            hits.push("plantFirstProject in " + rel);
          if (/Wrenfield/i.test(text))
            hits.push("Wrenfield in " + rel);
        }
      }
      return hits;
    };

    const root17 = path.join(SCRATCH, "sample-empty-root");
    fs.mkdirSync(root17, { recursive: true });
    const s17 = await loadShell("sample-first-start", {
      env: { STUDIO_PROJECTS: root17 },
      thread: (verb, ...a) => typeof Studio[verb] === "function" ? Studio[verb](...a) : Promise.resolve({ verb }),
    });
    let st17 = {}, listed17 = null, builderHits = [];
    try {
      builderHits = scanCatalogBuilders(ROOT);
      st17 = fs.existsSync(storeOf("sample-first-start")) ? readJson(storeOf("sample-first-start")) : {};
      listed17 = await s17.ask("studio:projects");
      check(builderHits.length === 0
            && fs.readdirSync(root17).length === 0
            && !("planted" in st17) && !("sample" in st17) && !("sampleId" in st17)
            && listed17 && !listed17.error && Array.isArray(listed17.projects) && listed17.projects.length === 0
            && !("sample" in listed17),
        "17a a fresh profile has no project after a first start and nothing in the product tree builds a catalog: "
        + JSON.stringify({ builderHits, rootEntries: fs.readdirSync(root17), storeKeys: Object.keys(st17),
          listedProjects: listed17 && listed17.projects && listed17.projects.length, hasSampleProp: !!(listed17 && "sample" in listed17) }));

      let sampleAt = "", wantCards = -1, beforeSampleSha = "";
      try {
        sampleAt = typeof Engine.sampleCatalog === "function" ? Engine.sampleCatalog() : "";
        if (sampleAt && fs.existsSync(sampleAt)) {
          wantCards = readCatalogDocument(sampleAt).cards.length;
          beforeSampleSha = crypto.createHash("sha256").update(fs.readFileSync(sampleAt)).digest("hex");
        }
      } catch (e) { sampleAt = ""; }

      const unchosenPlan = sampleAt ? await s17.ask("studio:v1-plan", sampleAt) : "not-null";
      const picked1 = s17.handlers["studio:sample-pick"] ? await s17.ask("studio:sample-pick") : null;
      const plan1 = picked1 && picked1.file ? await s17.ask("studio:v1-plan", picked1.file) : null;
      const landed1 = plan1 && !plan1.error ? await s17.ask("studio:v1-land", plan1.file, "") : null;
      const afterSampleSha = sampleAt && fs.existsSync(sampleAt)
        ? crypto.createHash("sha256").update(fs.readFileSync(sampleAt)).digest("hex") : "";
      const hasRemoveChannel = !!s17.handlers["studio:sample-remove"];
      check(!!sampleAt && wantCards > 0 && unchosenPlan === null
            && picked1 && !picked1.error && picked1.file === sampleAt
            && plan1 && !plan1.error && plan1.counts && plan1.counts.cards === wantCards
            && landed1 && !landed1.error && landed1.counts && landed1.counts.cards === wantCards
            && beforeSampleSha === afterSampleSha && !hasRemoveChannel,
        "17b the fetched sample opens through the press's road into a project holding the file's cards, leaving the fetched file unchanged: "
        + JSON.stringify({ sampleAt: path.basename(sampleAt || ""), wantCards,
          unchosenRefused: unchosenPlan === null,
          picked: picked1 && !picked1.error, planCards: plan1 && plan1.counts && plan1.counts.cards,
          landCards: landed1 && landed1.counts && landed1.counts.cards, hasRemoveChannel }));

      const picked2 = s17.handlers["studio:sample-pick"] ? await s17.ask("studio:sample-pick") : null;
      const plan2 = picked2 && picked2.file ? await s17.ask("studio:v1-plan", picked2.file) : null;
      const landed2 = plan2 && !plan2.error && plan2.free
        ? await s17.ask("studio:v1-land", plan2.file, plan2.free.name) : null;
      const afterTwo = await s17.ask("studio:projects");
      check(plan2 && !plan2.error && plan2.exists === true && plan2.free && !!plan2.free.name
            && landed2 && !landed2.error && landed2.counts && landed2.counts.cards === wantCards
            && landed1 && landed2.dir !== landed1.dir
            && afterTwo && Array.isArray(afterTwo.projects) && afterTwo.projects.length === 2,
        "17c pressed twice, the road makes a second project holding the file's cards: "
        + JSON.stringify({ exists: plan2 && plan2.exists, free: plan2 && plan2.free && plan2.free.name,
          projects: afterTwo && afterTwo.projects && afterTwo.projects.map(p => p.name) }));
    } finally { s17.done(); }

    if (PLANTS_OFF) console.log("  NOT RUN 17p, planted starter and builder caught by 17a (ETIUDA_PLANTS=off)");
    else {
      const plantCopy = path.join(SCRATCH, "sample-plant-copy");
      for (const d of ["shell", "src", "ui", "engine/pinned"]) fs.cpSync(path.join(ROOT, d), path.join(plantCopy, d), { recursive: true });
      fs.copyFileSync(path.join(ROOT, "package.json"), path.join(plantCopy, "package.json"));
      fs.writeFileSync(path.join(plantCopy, "src", "starter.mjs"),
        'import fs from "node:fs"; import path from "node:path";\n'
        + 'export async function plantStarter(root) {\n'
        + '  const dir = path.join(root, "planted-sample");\n'
        + '  fs.mkdirSync(dir, { recursive: true });\n'
        + '  fs.writeFileSync(path.join(dir, "project.json"), JSON.stringify({ id: "planted-sample" }));\n'
        + '  return { dir };\n'
        + '}\n', "utf8");
      const plantMain = path.join(plantCopy, "shell", "main.js");
      let mainText = fs.readFileSync(plantMain, "utf8");
      mainText = mainText.replace("if (studioRuns) app.whenReady().then(async () => {",
        "async function plantFirstProject() { const S = await import(pathToFileURL(path.join(ROOT, 'src', 'starter.mjs')).href); return S.plantStarter(projectsRoot()); }\n"
        + "if (studioRuns) app.whenReady().then(async () => {\n  await plantFirstProject();");
      fs.writeFileSync(plantMain, mainText, "utf8");
      const plantedRoot = path.join(SCRATCH, "sample-planted-root");
      fs.mkdirSync(plantedRoot, { recursive: true });
      const sp = await loadShell("sample-planted-check", { main: plantMain, env: { STUDIO_PROJECTS: plantedRoot } });
      try {
        const caughtHits = scanCatalogBuilders(plantCopy);
        const plantedDirs = fs.readdirSync(plantedRoot);
        check(caughtHits.length > 0 && plantedDirs.length > 0,
          "17p PLANT: a planted starter module and first-launch folder are caught by 17a's checks: "
          + JSON.stringify({ caughtHits, plantedDirs }));
      } finally { sp.done(); }
    }
  }

  /* ---- 18. INVITATIONS AND AUTO-ADMIT (board 885, S2) --------------------------------------------------------------------
     The shell over Studio's own verbs run in process, on a real project and its share, the signing key kept under the vault
     stood in, a desk's request written as the pinned shell writes one. 18a and 18b: an invitation made, copied, proved by a
     desk and let in, another made and withdrawn, auto-admit thrown on and off. Each invitation's secret, read from
     teams.json, is hunted in 2q's four spellings, and each blob the clipboard got, whole and as its payload, in every reply,
     every send, stdout, the log, and every child's argv and environment; and in teams.json's own text the secret is in none
     of its spellings. The hunt waits until the event loop has drained. 18c to 18f: the watch. */
  {
    const Kst = await import(pathToFileURL(path.join(ROOT, "src", "team-store.mjs")).href);
    const Ei = await import(pathToFileURL(path.join(ROOT, "src", "engine.mjs")).href);
    const Ji = Ei.joinRules(), Pi = Ei.inviteRules();
    const vault = { available: () => true, seal: (t) => FAKE_VAULT_STORAGE.encryptString(t), open: (b) => FAKE_VAULT_STORAGE.decryptString(b) };
    const osKey = async (ud) => {
      const at = St2.defaultKeyFile(ud), pair = await Sg2.makePair();
      fs.mkdirSync(path.dirname(at), { recursive: true });
      fs.writeFileSync(at, JSON.stringify(Sg2.osFile(pair, FAKE_VAULT_STORAGE.encryptString(pair.der)), null, 1));
      return { at, pub: Sg2.readKeyFile(at).public, secret: String(pair.der) };
    };
    /* A desk's genuine request to join, signed under the pinned join rule, carrying an invitation's proof where given. */
    const asks = (share, teamId, inv) => {
      const k = crypto.generateKeyPairSync("ed25519"), raw = (x) => x.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
      const pub = raw(k.publicKey), id = Ji.branchIdOf(pub), box = raw(crypto.generateKeyPairSync("x25519").publicKey);
      const commit = Ji.joinCommit(teamId, pub, box, crypto.randomBytes(32).toString("hex"));
      const doc = { format: 1, kind: Ji.JOIN_KIND, team: teamId, desk: { id, key: pub, box, name: "Nela" }, date: new Date().toISOString(), commit };
      if (inv) { doc.desk.kind = "desk"; doc.invite = { id: inv.id, proof: Pi.memberProof(inv.secret, commit) }; }
      doc.sig = { alg: "Ed25519", keyId: id };
      doc.sig.value = crypto.sign(null, Ji.joinSignedBytes(doc), k.privateKey).toString("hex");
      fs.mkdirSync(path.join(share, "desks", id), { recursive: true });
      fs.writeFileSync(path.join(share, "desks", id, "join.json"), JSON.stringify(doc));
      return id;
    };
    const rosterOf = (share) => { try { return JSON.parse(fs.readFileSync(path.join(share, Ei.teamRules().V2_TEAM_FILE), "utf8")).roster || []; } catch (e) { return []; } };
    const moved = (sh, share) => (sh.sent || []).filter((a) => Array.isArray(a) && a[0] === "studio:team-moved" && a[1] === path.resolve(share)).length;

    /* A team kept in a teams file with its key, made by the fixture (was: made by the shell's Sealed press at the plain folder, which Studio no longer
       does, tests/team-seal.mjs fh4); `o.relay` puts it on the relay, which is where the watch looks. */
    const mint = async (project, who, teamsAt, o) => {
      const id = "t-" + crypto.randomBytes(8).toString("hex"), tk = crypto.randomBytes(32);
      Kst.keepTeamKey(teamsAt, vault, id, 1, tk);
      return olderFolderTeam(project, Object.assign({ key: who.at, passphrase: who.secret, teamId: id, teamKeys: { [id]: { 1: tk } }, teamsFile: teamsAt }, o || {}));
    };
    const ud = path.join(SCRATCH, "invite-page"), key = await osKey(ud);
    const dir = await signProject("invite-page-project"), share = path.join(SCRATCH, "invite-page-project", "share");
    const at = Kst.teamsFile(ud);
    const s = await loadShell("invite-page", { thread: realThread, env: projectsBeside(dir) });
    const sealed = await mint(dir, key, at, { relay: true });
    const tid = sealed.team.id;
    /* A team kept for a folder, in a project of its own, refuses an invitation (18a's claim, held on its own folder team: the team above is on the relay). */
    const shareF = path.join(SCRATCH, "invite-page-folder-share");
    fs.mkdirSync(shareF, { recursive: true });
    const dirF = (await St2.newProject(path.dirname(dir), "Invite folder", [{ code: "en", name: "English" }])).dir;
    await St2.setPublishFolder(dirF, shareF);
    await mint(dirF, key, at, {});
    const folderRefused = await s.ask("studio:invite-make", dirF, "Mira Lantern");
    const sec1 = "1a".repeat(16), id1 = Pi.inviteIdOf(sec1);
    const sec2 = "2b".repeat(16), id2 = Pi.inviteIdOf(sec2);
    const expAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    Kst.keepInvite(at, vault, tid, { id: id1, secret: sec1, made: new Date().toISOString(), expires: expAt, name: "Mira Lantern" });
    Kst.keepInvite(at, vault, tid, { id: id2, secret: sec2, made: new Date().toISOString(), expires: expAt, name: "Mira Lantern" });
    Kst.endInvite(at, tid, id2, "withdrawn");
    const desk = asks(share, tid, { id: id1, secret: sec1 });
    const r3 = await s.ask("studio:desks", dir);
    await s.fire("winOn", "focus"); await drained();
    const r4 = await s.ask("studio:desks", dir);
    await drained();
    s.done();
    const needles = spelt(sec1).concat(spelt(sec2));
    const replies = [r3, r4];
    const leaks = holds(needles, ...replies, ...surfaces(s));
    const inTeams = holds(needles, fs.readFileSync(at, "utf8"));
    check(leaks === 0 && inTeams === 0 && !!(folderRefused && /nobody can be invited/.test(String(folderRefused.error || "")))
      && replies.every((r) => r && !r.error && !("written" in r) && !("spent" in r) && !("blob" in r)),
      "18a a folder team refuses invite-make, and an invitation kept, proved and let in beside a withdrawn one keeps both secrets"
      + " out of every reply, send, stdout, log, child argv/env and plaintext teams.json: "
      + JSON.stringify([leaks, inTeams, folderRefused && folderRefused.error, replies.map((r) => (r && r.error) || "")]));
    const shown = (r, id) => ((r && r.invites) || []).find((i) => i.id === id) || {};
    const rowOf = (r, id) => ((r && r.requests) || []).find((x) => x.id === id) || {};
    const entry = rosterOf(share).find((e) => e.desk && e.desk.id === desk) || {};
    const states = Kst.invitesOf(at, tid).reduce((o, i) => Object.assign(o, { [i.id]: i.state }), {});
    const f = { noOldHandlers: !s.handlers["studio:invite-withdraw"] && !s.handlers["studio:team-auto"],
      seen: !rowOf(r3, desk).id && ((r3.team && r3.team.roster) || []).some((x) => x.id === desk && x.door === "invitation"),
      admitted: !rowOf(r4, desk).id && entry.door === "invitation" && entry.invite === id1 && states[id1] === "spent",
      withdrawn: states[id2] === "withdrawn" && !shown(r4, id2).id,
      handed: s.calls.some((c) => c[0] === "watchAdmit" && c[4] && c[4].invites && c[4].invites[id1]
        && c[4].invites[id1].secret === sec1) };
    check(Object.keys(f).every((k) => f[k] === true),
      "18b the removed folder-invite/auto handlers are absent, the screen's read sees the desk that proves a live invitation, and the"
      + " watch, handed the book, lets it in with no press, the invitation spent; a withdrawn one stays off the list: " + JSON.stringify(f));

    const settled = async (done, limit = 500) => { for (let i = 0; i < limit && !done(); i++) await new Promise((r) => setTimeout(r, 50)); };
    /* 18c to 18e: THE WATCH, on a second shell, its interval recorded as it is set. */
    const ud2 = path.join(SCRATCH, "invite-watch");
    const key2 = await osKey(ud2);
    const dir2 = await signProject("invite-watch-project"), share2 = path.join(SCRATCH, "invite-watch-project", "share");
    const ticks = [], setI = global.setInterval;
    global.setInterval = function (fn, ms, ...a) { ticks.push(ms); return setI.call(this, fn, ms, ...a); };
    let w = null;
    try {
      w = await loadShell("invite-watch", { thread: realThread, env: projectsBeside(dir2) });
      for (let i = 0; i < 1250 && ticks.indexOf(300000) < 0; i++) await settle();
    } finally { global.setInterval = setI; }
    const sealed2 = await mint(dir2, key2, Kst.teamsFile(ud2), { relay: true });
    const tid2 = sealed2.team.id;
    const at2 = Kst.teamsFile(ud2);
    const autoCalls = () => w.calls.filter((c) => c[0] === "watchAdmit").length;
    const inviteAdmits = () => rosterOf(share2).filter((e) => e.desk && e.door === "invitation").length;
    const bare1 = asks(share2, tid2);
    await w.fire("winOn", "focus"); await drained();
    const offCalls = autoCalls(), offIn = rosterOf(share2).some((e) => e.desk && e.desk.id === bare1);
    const secC = "3c".repeat(16), idC = Pi.inviteIdOf(secC);
    Kst.keepInvite(at2, vault, tid2, { id: idC, secret: secC, made: new Date().toISOString(), expires: expAt, name: "Mira Lantern" });
    const d1 = asks(share2, tid2, { id: idC, secret: secC });
    await w.fire("winOn", "focus"); await drained();
    await settled(() => rosterOf(share2).some((e) => e.desk && e.desk.id === d1));
    await drained();
    const e1 = rosterOf(share2).find((e) => e.desk && e.desk.id === d1) || {};
    check(ticks.indexOf(300000) >= 0 && offCalls === 0 && !offIn && inviteAdmits() === 1 && e1.door === "invitation" && !!e1.wrap,
      "18c the watch is set to look every five minutes and on focus; with only a bare request it is left asking and the thread is"
      + " never asked; once a live invitation's request arrives, focus admits it by its invitation: "
      + JSON.stringify([ticks.indexOf(300000) >= 0, offCalls, offIn, inviteAdmits(), e1.door || null]));
    /* 18c's admission look may still be running when its check passes (it asks seatProofs where the lead is signed in, which outlasts
       drained's half second), and its reads would land in this tap (traced 2026-11-19 on the gate fold). The watch is let finish first:
       no look running, up to thirty seconds. */
    for (let i = 0; i < 300 && w.mod && typeof w.mod.teamWatchNow === "function" && w.mod.teamWatchNow(); i++) await new Promise((r) => setTimeout(r, 100));
    await drained();
    /* Nothing under the team's folder is read on a focus where nothing in it changed: every read of a file or a folder under it is
       counted, through the fs builtin the shell and the verbs share, and so are the thread's verbs. The one read the watch's stamp
       makes by design is a listing of each desk's own folder, for the working copies a desk names by catalog (src/team-watch.mjs
       copiesOf, board 962 stage 3). The waiting check's own reads are told apart by name on the stack (checkWaiting, and the reads
       it starts in callbacks whose stacks no longer reach it: desksNow, teamFactsRead, readInbox, and the three verbs it may ask).
       The name is only a filter. Each read it lets through is kept, and the path has to be one measured for that check: the team
       file and the file of openings, the desks folder, each desk's join, statistics and catalog files, and the ask folder beside
       them. A path outside that set is red, as is a read from anything else, and so is any other verb. While Studio kept a mirror
       of a folder team (until A-S5) both went to the mirror, which this tap did not count; now they go to the team's folder, as
       they do to a relay team's mirror. */
    const under = path.resolve(share2), reads = [], exempted = [], tapped = ["readFileSync", "readdirSync", "openSync", "readFile", "readdir", "opendirSync"];
    const inside = (at) => at === under || at.indexOf(under + path.sep) === 0;
    const deskListing = (n, p) => n === "readdirSync" && path.dirname(p) === path.join(under, "desks") && /^k-[0-9a-f]{16}$/.test(path.basename(p));
    /* By name, as a filter only. The watch calls none of these. A read under one of them is still counted, below. */
    const waitingCheck = () => /\b(checkWaiting|desksNow|teamFactsRead|readInbox|teamFacts|listProposals|listProjects)\b/.test(String(new Error().stack));
    /* Paths measured for those names on a quiet focus. A catalog file is an .ec in a desk's folder (deskFilesIn, and a working
       copy). A path outside this set, read under one of the names, is a new read. */
    const waitingPath = (rel) => {
      const s = String(rel).split(/[/\\]/).join("/");
      if (s === "" || s === "desks" || s === "catalog-asks" || s === "etiuda-team.json" || s === "etiuda-team-joins.json") return true;
      if (/^desks\/k-[0-9a-f]{16}\/(?:join\.json|stats\.estat|[^/]+\.ec)$/.test(s)) return true;
      return false;
    };
    const kept = {}, stackWas = Error.stackTraceLimit;
    Error.stackTraceLimit = 60;
    tapped.forEach((n) => { kept[n] = fs[n]; fs[n] = function (p, ...a) {
      const at = path.resolve(String(p));
      if (inside(at) && !deskListing(n, at)) {
        const rel = path.relative(under, at);
        if (waitingCheck()) exempted.push(rel); else reads.push(n + " " + rel);
      }
      return kept[n].call(this, p, ...a);
    }; });
    syncBuiltinESMExports();
    const callsBefore = w.calls.length;
    try {
      await w.fire("winOn", "focus"); await drained();
      /* SHELL_GUARDS_PLANT=18d, alone: one new file under the folder, read from a function named checkWaiting. The name
         would have hidden it. 18d goes red on that path, and the other plants stay off when ETIUDA_PLANTS=off. */
      if (process.env.SHELL_GUARDS_PLANT === "18d") {
        const plantRead = function checkWaiting() {
          try { fs.readFileSync(path.join(under, "plant-18d.txt")); }
          catch (e) { /* the file is not there: the read is what is counted */ }
        };
        plantRead();
      }
    }
    finally { tapped.forEach((n) => { fs[n] = kept[n]; }); syncBuiltinESMExports(); Error.stackTraceLimit = stackWas; }
    /* A listed catalog is read by the shell's own waiting check (listProposals, teamFacts, listProjects).
       That read is not the watch looking at the share. */
    const added = w.calls.slice(callsBefore).map((c) => c[0]);
    const watchOnly = added.filter((v) => v !== "listProposals" && v !== "teamFacts" && v !== "listProjects");
    const stray = exempted.filter((rel) => !waitingPath(rel));
    check(reads.length === 0 && stray.length === 0 && watchOnly.length === 0,
      "18d a focus with nothing changed in the folder: the watch reads nothing under it but each desk folder's listing; each read the waiting check makes stays within the listed catalogs and the desk files it reads, and it may ask"
      + " listProposals, teamFacts and listProjects, and the watch asks the thread nothing: "
      + JSON.stringify([reads.slice(0, 4), stray.slice(0, 6), watchOnly, added]));
    const told0 = moved(w, share2);
    /* A folder team's look reads its mirror after a fresh listing, and its admission reaches the share from the outbox (board
       945 stage 3 (b)): each step is waited out, up to twenty-five seconds, before it is counted. A step that sees the condition stops. */
    const secE = "4d".repeat(16), idE = Pi.inviteIdOf(secE);
    Kst.keepInvite(at2, vault, tid2, { id: idE, secret: secE, made: new Date().toISOString(), expires: expAt, name: "Mira Lantern" });
    const d2 = asks(share2, tid2, { id: idE, secret: secE });
    await w.fire("winOn", "focus"); await drained();
    await settled(() => moved(w, share2) > told0 && rosterOf(share2).some((e) => e.desk && e.desk.id === d2));
    await drained();
    const in2 = rosterOf(share2).some((e) => e.desk && e.desk.id === d2 && e.door === "invitation"), calls2 = inviteAdmits(), told2 = moved(w, share2);
    /* A WATCHADMIT ASKED AGAIN WITH NOTHING NEW ADMITS NOTHING AND TELLS THE PAGE NOTHING MORE: the last call the shell made is
       made again on the thread, then one focus; the team file, the joins file and the roster are the same bytes, the answer
       admitted nobody and the page was told nothing further. */
    const shareBytes = () => [Ei.teamRules().V2_TEAM_FILE, Ji.JOINS_NAME].map((n) => { try { return fs.readFileSync(path.join(share2, n)).toString("base64"); } catch (e) { return null; } }).join("|");
    const lastAdmit = w.calls.filter((c) => c[0] === "watchAdmit").pop();
    const bytes0 = shareBytes(), roster0 = JSON.stringify(rosterOf(share2));
    const again = lastAdmit ? await realThread(...lastAdmit) : null;
    await w.fire("winOn", "focus"); await drained();
    const repeat = { asked: !!lastAdmit, admittedNone: !!again && Array.isArray(again.admitted) && again.admitted.length === 0 && (!again.written),
      sameBytes: shareBytes() === bytes0, sameRoster: JSON.stringify(rosterOf(share2)) === roster0, told: moved(w, share2) - told2 };
    const d3 = asks(share2, tid2);
    await w.fire("winOn", "focus"); await drained();
    check(in2 && calls2 === 2 && told2 >= told0 + 1 && told2 <= told0 + 2 && !rosterOf(share2).some((e) => e.desk && e.desk.id === d3) && inviteAdmits() === 2,
      "18e a new request proving an invitation is seen at the next focus and let in, and the page is told the folder moved; a bare"
      + " request is left asking: " + JSON.stringify([in2, calls2, told2 - told0, inviteAdmits()]));
    check(repeat.asked && repeat.admittedNone && repeat.sameBytes && repeat.sameRoster && repeat.told === 0,
      "18e2 a watchAdmit asked again with nothing new admits nobody, writes nothing (the team file, the joins file and the roster are"
      + " the same bytes) and the page is told nothing more: " + JSON.stringify(repeat));

    /* 18g AN INVITATION LETS ITS DESK IN WITH NOBODY PRESSING ANYTHING: a focus, and no screen read, lets in the request that
       proves a live invitation, spends it and labels it; a proof under another secret, a withdrawn invitation's request and a
       second desk on the spent invitation are left asking, and so is the request that names none. */
    const secG = "5e".repeat(16), idG = Pi.inviteIdOf(secG);
    const secW = "6f".repeat(16), idW = Pi.inviteIdOf(secW);
    Kst.keepInvite(at2, vault, tid2, { id: idG, secret: secG, made: new Date().toISOString(), expires: expAt, name: "Mira Lantern" });
    Kst.keepInvite(at2, vault, tid2, { id: idW, secret: secW, made: new Date().toISOString(), expires: expAt, name: "Mira Lantern" });
    Kst.endInvite(at2, tid2, idW, "withdrawn");
    const dv = asks(share2, tid2, { id: idG, secret: secG });
    const df = asks(share2, tid2, { id: idG, secret: "0".repeat(32) });
    const dw = asks(share2, tid2, { id: idW, secret: secW });
    let screenReads = 0;
    const deskScreen = w.handlers["studio:desks"];
    w.handlers["studio:desks"] = (...a) => { screenReads++; return deskScreen(...a); };
    await w.fire("winOn", "focus");
    await settled(() => (Kst.invitesOf(at2, tid2).find((i) => i.id === idG) || {}).state === "spent"
                        && rosterOf(share2).some((e) => e.desk && e.desk.id === dv && e.door === "invitation"), 600);
    const dv2 = asks(share2, tid2, { id: idG, secret: secG });
    await w.fire("winOn", "focus"); await drained();
    const rosterG = rosterOf(share2), inG = (id) => rosterG.some((e) => e.desk && e.desk.id === id);
    const eG = rosterG.find((e) => e.desk && e.desk.id === dv) || {};
    const stateG = (Kst.invitesOf(at2, tid2).find((i) => i.id === idG) || {}).state;
    const screensInWindow = screenReads;
    await w.ask("studio:desks", dir2);
    const plantCounted = screenReads === screensInWindow + 1;
    w.handlers["studio:desks"] = deskScreen;
    const gf = { dv: inG(dv) && eG.door === "invitation" && eG.invite === idG && !!eG.wrap, spent: stateG === "spent",
      noScreen: screensInWindow === 0 && plantCounted,
      left: !inG(df) && !inG(dw) && !inG(dv2) && !inG(d3), one: rosterG.filter((e) => e.invite === idG).length === 1 };
    check(Object.keys(gf).every((k) => gf[k] === true),
      "18g a focus and no screen read let in the desk whose request proves a live invitation, spend it and"
      + " label the entry by invitation; a proof under another secret, a withdrawn invitation's request, a second desk on"
      + " the spent invitation and a request naming none are left asking: " + JSON.stringify(gf));

    /* 18h STUDIO LETS IT IN WHEN IT NEXT SEES IT: the screen's read is a sight too. A request proving a live invitation that
       arrives with no focus since is let in by the Desks screen's own read, which answers with it among the members. */
    const secH = "7a".repeat(16), idH = Pi.inviteIdOf(secH);
    Kst.keepInvite(at2, vault, tid2, { id: idH, secret: secH, made: new Date().toISOString(), expires: expAt, name: "Mira Lantern" });
    const dh = asks(share2, tid2, { id: idH, secret: secH });
    const seen = await w.ask("studio:desks", dir2);
    const asksH = ((seen && seen.requests) || []).some((r) => r.id === dh);
    const memberH = ((seen && seen.team && seen.team.roster) || []).find((r) => r.id === dh) || {};
    w.done();
    check(!!seen && !seen.error && !asksH && memberH.door === "invitation" && memberH.admitted === true
          && (Kst.invitesOf(at2, tid2).find((i) => i.id === idH) || {}).state === "spent",
      "18h a request proving a live invitation that arrives with no focus since is let in by the Desks screen's own read,"
      + " which answers with it among the members by invitation: " + JSON.stringify([asksH, memberH.door || null, memberH.admitted || null]));

    /* 18f A KEY THAT NEEDS ITS PASSPHRASE: a request proving a live invitation is not let in while the key
       does not open, the screen says so, and the run after it opens lets the desk in with nothing changed in the folder. */
    const ud3 = path.join(SCRATCH, "invite-wait");
    fs.mkdirSync(ud3, { recursive: true });
    const key3 = path.join(ud3, "pass-key.json"), lk = await Sg2.makeKeyFile({ passphrase: "pass-word-here" });
    fs.writeFileSync(key3, JSON.stringify(lk, null, 1));
    const dir3 = await signProject("invite-wait-project"), share3 = path.join(SCRATCH, "invite-wait-project", "share");
    const tid3 = "t-" + crypto.randomBytes(8).toString("hex"), tk3 = crypto.randomBytes(32), at3 = Kst.teamsFile(ud3);
    Kst.keepTeamKey(at3, vault, tid3, 1, tk3);
    const made3 = await olderFolderTeam(dir3, { key: key3, passphrase: "pass-word-here", teamId: tid3, teamKeys: { [tid3]: { 1: tk3 } }, relay: true, teamsFile: at3 });
    Kst.chooseSealed(at3, tid3, true, share3, made3.written);
    const sec4 = "4c".repeat(16), id4 = Pi.inviteIdOf(sec4);
    Kst.keepInvite(at3, vault, tid3, { id: id4, secret: sec4, made: new Date().toISOString(),
      expires: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(), name: "Mira Lantern" });
    const d4 = asks(share3, tid3, { id: id4, secret: sec4 });
    const teamFile3 = path.join(share3, Ei.teamRules().V2_TEAM_FILE);
    const shutBefore = fs.readFileSync(teamFile3);
    const v = await loadShell("invite-wait", { thread: realThread, env: projectsBeside(dir3, { STUDIO_SIGNING_KEY: key3, STUDIO_KEY_PASSPHRASE: null }) });
    await v.fire("winOn", "focus"); await drained();
    const held0 = v.calls.filter((c) => c[0] === "watchAdmit").length, in0 = rosterOf(share3).some((e) => e.desk && e.desk.id === d4);
    const said3 = await v.ask("studio:desks", dir3);
    const shutSame = shutBefore.equals(fs.readFileSync(teamFile3));
    process.env.STUDIO_KEY_PASSPHRASE = "pass-word-here";
    await v.fire("winOn", "focus");
    await settled(() => (Kst.invitesOf(at3, tid3).find((i) => i.id === id4) || {}).state === "spent"
                        && rosterOf(share3).some((e) => e.desk && e.desk.id === d4 && e.door === "invitation"), 600);
    const admits1 = rosterOf(share3).filter((e) => e.desk && e.desk.id === d4).length, in1 = rosterOf(share3).some((e) => e.desk && e.desk.id === d4 && e.door === "invitation");
    const spent4 = (Kst.invitesOf(at3, tid3).find((i) => i.id === id4) || {}).state;
    v.done();
    const row4 = ((said3 && said3.requests) || []).find((r) => r.id === d4) || {};
    /* P2: the row's state ("asks", the door's code stage) is gone with the code door; the row names its invitation's state, and the request is still listed. */
    check(held0 === 0 && !in0 && !!said3 && said3.keyOpens === false && !!row4.id
          && row4.invite === "valid" && shutSame && admits1 === 1 && in1 && spent4 === "spent",
      "18f with a signing key that needs its passphrase, a request proving a live invitation is not let in and the screen says"
      + " the key does not open, and the team file's bytes are the same while the key is shut; once it opens, the next run"
      + " lets the desk in by its invitation, spent, with nothing changed in the folder: "
      + JSON.stringify([held0, in0, said3 && said3.keyOpens, row4.invite || null, shutSame, admits1, in1, spent4]));
  }

  /* ---- 19. NO PUBLISH AND NO SEAL MAKES THE KEY (the sense pass of 2026-10-14, finding 9, retired 2026-11-26) -------------------
     Was: "Maxim, 2026-10-13 15:51: 'Etiuda is meant to empower and enhance, not limit and cage.' A Studio with no signing key makes one, asking nothing, at its first
     publish or its first seal, where nothing at the folder trusts another key, and that edition goes out signed, so the desks offer the lead's next editions as updates;
     the publish after the key is made asks the page for the backup nudge, once." Now (the pass over the retired folder mechanics): a team is made on the relay, over a key
     the relay's licence names, so the key, made in Settings, is there before any team, and a catalog on no team publishes nowhere; the first publish and the first seal
     made the key only where no team file stood at the folder, which only a plain folder was. Nothing is made by a publish, the plan promises none, the reply carries no
     key and no nudge. Where the folder's team trusts a key this computer has not got, nothing is made and the cover points to Restore (K8), as before. Where no vault can keep
     a key, the edition goes out unsigned, as before. The thread is Studio's own verbs over real projects, as at 2u. */
  {
    const Ri = await import(pathToFileURL(path.join(ROOT, "src", "ring.mjs")).href);
    const ecOf = (r) => { try { return r && !r.error && r.ec ? JSON.parse(fs.readFileSync(r.ec, "utf8")) : null; } catch (e) { return null; } };
    const keyAt = (name) => St2.defaultKeyFile(path.join(SCRATCH, name));
    const readKey = (at) => { try { return fs.existsSync(at) ? Sg2.readKeyFile(at) : null; } catch (e) { return null; } };

    /* 19a a publish with no key makes none: MOVED 2026-11-26. Was: "19a with no key and no team at the folder, the cover's plan says the publish makes one; the publish keeps
       a key under the vault, signs that edition with it and lists it in the ring beside it, and asks the page for the backup nudge; the next publish signs with the same key,
       makes no other and asks no nudge". Now: the plan promises none, the publish keeps no key and the edition goes out unsigned, with no key in the reply and no nudge, twice. */
    const dirA = await signProject("first-key-project");
    const sA = await loadShell("first-key", { thread: realThread, env: projectsBeside(dirA) });
    const atA = keyAt("first-key"), noneBefore = !fs.existsSync(atA);
    const planA = await sA.ask("studio:publish-plan", dirA);
    const r1 = await sA.ask("studio:publish", dirA, { notes: "the first edition" });
    const r2 = await sA.ask("studio:publish", dirA, { notes: "the second edition" });
    sA.done();
    const ec1 = ecOf(r1), ec2 = ecOf(r2), sg1 = (planA && planA.signing) || {};
    check(noneBefore && !fs.existsSync(atA) && sg1.makes === undefined && !sg1.keyId && !sg1.restore
          && !!ec1 && !ec1.sig && !!ec2 && !ec2.sig && !r1.error && !r2.error && !r1.keyNudge && !r2.keyNudge && !r1.signing && !r2.signing,
      "19a with no key and no team at the folder, the cover's plan promises no key; the publish keeps none, and both editions go out unsigned with no key in the reply"
      + " and no nudge: " + JSON.stringify([noneBefore, fs.existsSync(atA), sg1.makes, !!(ec1 && ec1.sig), !!(ec2 && ec2.sig), r1 && r1.keyNudge, !!(r1 && r1.signing)]));

    /* 19a1 RETIRED 2026-11-26 with the key the first publish made: THE MADE KEY'S SECRET IS NOWHERE BUT ITS KEY FILE (Clement omega's condition 3, from his probe O6), the
       key read back from its file through the vault stand-in and hunted in nine forms of the DER and its scalar across every file of the share, the project and the
       user-data folder but the key file, the file names, the shell's said and logged lines, what it sent and every reply. The key a publish made is gone; the file Make a
       signing key writes holds its private half sealed by the vault in none of four spellings (2q), and a signed publish's surfaces are hunted in tests/leak-hunt.mjs. */

    /* 19b a folder whose team trusts another key: nothing is made, and the plan names the key to restore */
    const dirB = await signProject("first-key-theirs-project"), shareB = path.join(SCRATCH, "first-key-theirs-project", "share");
    const other = await Sg2.makePair(), otherAt = path.join(SCRATCH, "first-key-other.json");
    fs.writeFileSync(otherAt, JSON.stringify(Sg2.osFile(other, FAKE_VAULT_STORAGE.encryptString(other.der)), null, 1));
    const leadB = await St2.newProject(path.join(SCRATCH, "first-key-theirs-project", "lead"), "Lead", [{ code: "en", name: "English" }]);
    await St2.setPublishFolder(leadB.dir, shareB);
    await olderFolderTeam(leadB.dir, { key: otherAt, passphrase: String(other.der), teamId: "t-" + crypto.randomBytes(8).toString("hex") });
    /* The other lead's team is Plain, so an edition of a catalog it does not list may go out in the clear there: since board 962
       stage 6 (U1) a sealed team's folder refuses one (src/publish.mjs clearRefused, tests/team-leave.mjs 962s6d). */
    const TmB = await import(pathToFileURL(path.join(ROOT, "src", "team.mjs")).href);
    const heldB = (await TmB.heldTeam(shareB, { key: otherAt })).team;
    await TmB.writeTeam(shareB, TmB.withSealed(heldB, false, null), { key: otherAt, passphrase: String(other.der) }); /* the fixture's Plain (was Studio's switch, which writes no folder team now) */
    const sB = await loadShell("first-key-theirs", { signedIn: true, thread: realThread, env: projectsBeside(dirB) });
    const atB = keyAt("first-key-theirs");
    const planB = await sB.ask("studio:publish-plan", dirB);
    const rB = await sB.ask("studio:publish", dirB, { notes: "n" });
    sB.done();
    const ecB = ecOf(rB), sgB = (planB && planB.signing) || {}, printB = Sg2.keyIdFor(other.public).slice("studio-".length);
    check(!fs.existsSync(atB) && sgB.makes !== true && sgB.restore === printB && !!ecB && !ecB.sig && !(rB && rB.keyNudge)
          && !(rB && rB.signing),
      "19b where the folder's team trusts another key, no key is made: the plan names that key for Restore, and the edition"
      + " goes out unsigned with no nudge: " + JSON.stringify([fs.existsSync(atB), sgB.makes, sgB.restore === printB, !!ecB, !!(ecB && ecB.sig),
        !!(rB && rB.keyNudge)]));

    /* 19c RETIRED 2026-11-26 with studio:team-sealed: "Sealed at a plain folder with no key is refused in one sentence and no team is made (was: it made the key and the
       team under it, and the publish after asked the nudge once)". The verb is gone from the shell (12i), and the thread's refusal of a new team at a folder is team-seal fh4. */

    /* 19d CONTROL: a computer that cannot keep a key publishes unsigned as before, with nothing made and nothing refused */
    const dirD = await signProject("first-key-novault-project");
    const sD = await loadShell("first-key-novault", { platform: "win32", thread: realThread,
      env: projectsBeside(dirD),
      safeStorage: Object.assign({}, FAKE_VAULT_STORAGE, { isEncryptionAvailable: () => false }) });
    const atD = keyAt("first-key-novault");
    const planD = await sD.ask("studio:publish-plan", dirD);
    const rD = await sD.ask("studio:publish", dirD, { notes: "n" });
    sD.done();
    const ecD = ecOf(rD);
    check(!fs.existsSync(atD) && !!planD && planD.signing.makes !== true && !!ecD && !ecD.sig && !rD.error && !rD.keyNudge,
      "19d CONTROL: where no vault can keep a key, the plan promises none, nothing is made and the edition goes out unsigned: "
      + JSON.stringify([fs.existsSync(atD), planD && planD.signing && planD.signing.makes, !!ecD, !!(ecD && ecD.sig), rD && rD.error]));

    /* 19e A BACKUP COPY RESTORED OVER A PASSPHRASE-WRAPPED KEY IN THE KEY'S PLACE still replaces it ("Restore it once and this computer keeps it"). MOVED 2026-11-26: this was
       the CONTROL of the overwrite race (Clement omega's condition 1, his probes O8 and O9: a Make press and the first publish together with no key, whichever writes first keeps the
       key and the edition is signed by the key in the file); the publish makes no key now, so the race is gone and its control stands alone. */
    const passAt = keyAt("first-key-restore"), copyAt = path.join(SCRATCH, "first-key-restore-copy.json"), held = await Sg2.makePair();
    fs.mkdirSync(path.dirname(passAt), { recursive: true });
    fs.writeFileSync(passAt, JSON.stringify(Sg2.passphraseFile(held, "a passphrase for this gate"), null, 1));
    fs.writeFileSync(copyAt, JSON.stringify(Sg2.passphraseFile(held, "a passphrase for this gate"), null, 1));
    const sR = await loadShell("first-key-restore", { env: { STUDIO_TEST_RESTORE: copyAt }, thread: realThread });
    const pickR = await sR.ask("studio:key-restore-pick", "t", "k");
    const backR = await sR.ask("studio:key-restore", pickR.file, "a passphrase for this gate");
    sR.done();
    const nowR = readKey(passAt);
    check(!!backR && !backR.error && !!nowR && nowR.kept === "os" && nowR.public === held.public,
      "19e a backup copy restored over a passphrase-wrapped key in the key's place still replaces it: " + JSON.stringify({ restored: !!backR && (backR.error || (nowR && nowR.kept)) }));

    /* 19f to 19h WHERE SOMETHING AT THE FOLDER POINTS TO ANOTHER KEY (Clement omega's condition 2, his probes O1 to O5b; MOVED 2026-11-26): with no key, nothing is made, and the
       plan promises none. They were the guards of the make the first publish and the first seal did, and now hold that none is made at a folder in each of these states. Each
       holds no key file at the end. 19i and 19j, Plain and Sealed pressed through studio:team-sealed, are retired with the verb. */
    const sealOther = async (share, tag) => {
      const pair = await Sg2.makePair(), otherKey = path.join(SCRATCH, tag + "-other.json");
      fs.writeFileSync(otherKey, JSON.stringify(Sg2.osFile(pair, FAKE_VAULT_STORAGE.encryptString(pair.der)), null, 1));
      const lead = await St2.newProject(path.join(SCRATCH, tag + "-lead"), "Lead", [{ code: "en", name: "English" }]);
      await St2.setPublishFolder(lead.dir, share);
      const before = new Set(fs.readdirSync(share));
      await olderFolderTeam(lead.dir, { key: otherKey, passphrase: String(pair.der), teamId: "t-" + crypto.randomBytes(8).toString("hex") });
      const name = fs.readdirSync(share).find((f) => !before.has(f));
      return name ? path.join(share, name) : null;
    };
    const editProject = (dir, fn) => { const at = path.join(dir, "project.json"), p = JSON.parse(fs.readFileSync(at, "utf8")); fn(p);
      fs.writeFileSync(at, JSON.stringify(p, null, 1)); };
    const pressAll = async (name, dir) => {
      const s = await loadShell(name, { thread: realThread, env: projectsBeside(dir) });
      const plan = await s.ask("studio:publish-plan", dir), pub = await s.ask("studio:publish", dir, { notes: name });
      s.done();
      return { made: fs.existsSync(keyAt(name)), makes: !!(plan && plan.signing && plan.signing.makes),
               pubErr: pub && pub.error ? String(pub.error).slice(0, 70) : null };
    };

    /* 19f G1: a team file at the folder that does not read whole */
    const dirF = await signProject("first-key-g1-project"), teamF = await sealOther(path.join(SCRATCH, "first-key-g1-project", "share"), "first-key-g1");
    if (teamF) { const b = fs.readFileSync(teamF); fs.writeFileSync(teamF, b.subarray(0, Math.floor(b.length / 2))); }
    const g1 = await pressAll("first-key-g1", dirF);
    check(!!teamF && !g1.made && !g1.makes,
      "19f a team file at the folder that does not read whole: the plan promises no key, and the publish makes"
      + " none: " + JSON.stringify(g1));

    /* 19g G2: the project remembers a seal, the folder has no team file, and this Studio kept no team for it */
    const dirG = await signProject("first-key-g2-project");
    editProject(dirG, (p) => { p.sealedTeam = "t-0123456789abcdef"; });
    const g2 = await pressAll("first-key-g2", dirG);
    check(!g2.made && !g2.makes,
      "19g a project that remembers a seal, with no team file at the folder: the plan promises no key, and the publish makes"
      + " none: " + JSON.stringify(g2));

    /* 19h G3: this Studio kept a team for the folder; the team file has left the share, the key file is moved aside and the
       project's mark is gone */
    const atH = keyAt("first-key-g3"), pairH = await Sg2.makePair();
    fs.mkdirSync(path.dirname(atH), { recursive: true });
    fs.writeFileSync(atH, JSON.stringify(Sg2.osFile(pairH, FAKE_VAULT_STORAGE.encryptString(pairH.der)), null, 1));
    const dirH = await signProject("first-key-g3-project"), shareH = path.join(SCRATCH, "first-key-g3-project", "share");
    const beforeH = new Set(fs.readdirSync(shareH));
    const KstH = await import(pathToFileURL(path.join(ROOT, "src", "team-store.mjs")).href);
    const sealedH = await olderFolderTeam(dirH, { key: atH, passphrase: String(pairH.der), teamId: "t-" + crypto.randomBytes(8).toString("hex"),
      teamsFile: KstH.teamsFile(path.join(SCRATCH, "first-key-g3")) }); /* the team this Studio kept (was: made by the Sealed press, which writes no folder team now) */
    const teamH = fs.readdirSync(shareH).find((f) => !beforeH.has(f));
    fs.renameSync(atH, atH + ".aside");
    if (teamH) fs.renameSync(path.join(shareH, teamH), path.join(SCRATCH, "first-key-g3-team-aside.json"));
    editProject(dirH, (p) => { delete p.sealedTeam; });
    const g3 = await pressAll("first-key-g3", dirH);
    check(!!sealedH && !sealedH.error && !!teamH && !g3.made && !g3.makes,
      "19h a team this Studio kept for the folder, its file gone from the share and the key moved aside: the plan promises no key"
      + " and the publish makes none: " + JSON.stringify(Object.assign({ sealed: !!(sealedH && sealedH.team) }, g3)));

    /* 19i and 19j RETIRED 2026-11-26 with studio:team-sealed: "Plain pressed with no key makes none" and "Sealed on a project kept inside its own publish folder refuses and makes no
       key". */

    /* 19k A RESTORE AND A PUBLISH TOGETHER (the test architect's note 357 on 2ee8bfe; MOVED 2026-11-26). Was: a restore looked at the key's place before opening the copy,
       which on a desk is the thread's work and takes real time, and wrote after it, so a key the first publish made meanwhile was written over and the edition it signed kept
       by nobody; held for the restore, the publish made its key and signed while the restore waited and the restore then refused in its sentence, the made key kept; held for
       the publish instead, the restore landed first and the publish made none and signed with the restore's. Now no publish makes a key, so a restore never meets one it would
       write over: with the copy's opening held a moment as the worker holds it, the restore lands whichever way the two meet and keeps the copy's key, and the edition goes out
       unsigned where it was written before the key was there, or signed with the copy's key where it was written after. */
    const COPY_WORDS = "a passphrase for the restore race";
    const raceRestore = async (name, holdOpen) => {
      const at = keyAt(name), dir = await signProject(name + "-project"), copy = path.join(SCRATCH, name + "-copy.json"), held = await Sg2.makePair();
      fs.writeFileSync(copy, JSON.stringify(Sg2.passphraseFile(held, COPY_WORDS), null, 1));
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const s = await loadShell(name, { env: projectsBeside(dir, { STUDIO_TEST_RESTORE: copy }), thread: (verb, ...a) =>
        (holdOpen ? verb === "openBackup" : verb === "teamFacts") ? wait(400).then(() => realThread(verb, ...a)) : realThread(verb, ...a) });
      const pick = await s.ask("studio:key-restore-pick", "t", "k");
      const [back, pub] = await Promise.all([s.ask("studio:key-restore", pick.file, COPY_WORDS), s.ask("studio:publish", dir, { notes: name })]);
      s.done();
      const kf = readKey(at), ec = ecOf(pub);
      return { file: kf ? kf.keyId : null, copy: held.public, filePublic: kf ? kf.public : null, sig: ec && ec.sig ? ec.sig.keyId : null,
               restoreErr: back && back.error ? String(back.error) : null, pubErr: pub && pub.error ? String(pub.error).slice(0, 70) : null,
               made: !!(pub && pub.signing) };
    };
    const kHeld = await raceRestore("restore-race-held", true), kLate = await raceRestore("restore-race-late", false);
    const landsRight = (k) => !!k.file && k.filePublic === k.copy && !k.restoreErr && !k.pubErr && !k.made && (k.sig === null || k.sig === k.file);
    check(landsRight(kHeld) && landsRight(kLate),
      "19k a restore and a publish pressed together never write one key over another: the restore lands whichever way the two meet and keeps the copy's key, no publish makes one, and"
      + " the edition is unsigned or signed with the copy's key: "
      + JSON.stringify({ held: [kHeld.sig, kHeld.filePublic === kHeld.copy ? "copy's key" : "other key", kHeld.restoreErr, kHeld.pubErr],
        late: [kLate.sig, kLate.filePublic === kLate.copy ? "copy's key" : "other key", kLate.restoreErr, kLate.pubErr] }));
  }

  /* 19l A SIGNING KEY FILE THAT DOES NOT READ (board 931, condition 9, finding 8): Make a signing key over it no longer says the
     Studio has a key already, which is false of a file nothing can use. It says where the file is, that moving it out of
     that folder lets Studio make a new key, and what that costs the catalogs the old key signed; the file is left as it
     was, because the sentence is the remedy and Studio moves nothing of the lead's. The lead then moves it, as the sentence
     says, and the press makes a key, so the sentence is true. The CONTROL is 2q: a key that reads still refuses with "already". */
  {
    const Sg = await import(pathToFileURL(path.join(ROOT, "src", "sign.mjs")).href);
    const UNREAD = "{FILE} in {FOLDER} is not a signing key this Studio can read, so no new key was made over it. Once it is moved out of that folder, Studio can make a new key; catalogs signed by the old key then verify only with the old key's backup copy.";
    const s = await loadShell("key-unread");
    const keyAt = Sg.defaultKeyFile(path.join(SCRATCH, "key-unread")), folder = path.dirname(keyAt), name = path.basename(keyAt);
    const damaged = "{\"kind\": \"etiuda-studio-signing-key\", \"schema\": 1, \"keyId\": \"studio-0a1b2c3d4e5f6a7b\", \"public\": \"cut off here";
    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(keyAt, damaged);
    const refused = await s.ask("studio:key-make");
    const untouched = fs.existsSync(keyAt) && fs.readFileSync(keyAt, "utf8") === damaged
      && fs.readdirSync(folder).filter((f) => /key/i.test(f)).join() === name;
    const moved = path.join(SCRATCH, "key-unread-moved.json");
    fs.renameSync(keyAt, moved);
    const made = await s.ask("studio:key-make");
    s.done();
    const now = fs.existsSync(keyAt) ? Sg.readKeyFile(keyAt) : null;
    const want = UNREAD.replace("{FILE}", name).replace("{FOLDER}", folder);
    /* THE SETTINGS ROW SAYS THE REMEDY TOO (the test architect's word on board 931, 714: "yes, the remedy on the Settings row,
       with 19l reading the row's sentence"). The row is the page's own signingRowHtml for that file, drawn in each language and
       read as a person reads it: its note is the second half of the refusal's sentence, held to the refusal's own ending so the
       two cannot drift apart. It offers no Make press, since that would only refuse while the file is still there, and it offers
       the healthy row's Show the file, so "that folder" is one press away (the test architect's E1, 729). */
    const ROW_EN = "Once it is moved out of that folder, Studio can make a new key; catalogs signed by the old key then verify only with the old key's backup copy.", ROW_PL = "Po przeniesieniu pliku poza ten folder Studio może utworzyć nowy klucz; katalogi podpisane starym kluczem zweryfikuje się wtedy tylko kopią zapasową starego klucza.";
    const { loadPage } = await import("./page-stand-in.mjs");
    const rowHtml = (uiLang) => {
      const page = loadPage({ api: {}, uiLang }).page;
      page.S.host = { signing: { keyId: "", problem: "x", name, file: keyAt } };
      return String(page.signingRowHtml());
    };
    const readRow = (html) => html.replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/\s+/g, " ");
    const rawEn = rowHtml("en"), rawPl = rowHtml("pl"), rowEn = readRow(rawEn), rowPl = readRow(rawPl);
    const shows = (raw) => (raw.match(/data-act="key-show"/g) || []).length === 1;
    const rowSays = rowEn.indexOf(name + " is not a signing key this Studio can read ") >= 0
      && rowEn.indexOf(ROW_EN) > rowEn.indexOf(name + " is not a signing key") && shows(rawEn) && shows(rawPl)
      && rowPl.indexOf(name + " nie jest kluczem podpisu") >= 0 && rowPl.indexOf(ROW_PL) > rowPl.indexOf(name)
      && rowPl.indexOf(ROW_EN) < 0 && UNREAD.endsWith(" " + ROW_EN) && !/key-make/.test(rawEn + rawPl);
    check(refused.error === want && refused.said && refused.said.frame === UNREAD
          && refused.said.vars && refused.said.vars.FILE === name && refused.said.vars.FOLDER === folder
          && !/already/.test(String(refused.error)) && untouched
          && !made.error && !!now && now.keyId === made.keyId && fs.readFileSync(moved, "utf8") === damaged && rowSays,
      "19l Make a signing key over a key file that does not read says where the file is, that moving it out of the folder lets"
      + " Studio make a new key and that catalogs the old key signed verify only with its backup, and leaves the file as it was;"
      + " once the lead has moved it the press makes a key and the moved file is as it was; the Settings row for that file says"
      + " the remedy after its own sentence, in English and in Polish, with Show the file and no Make press: "
      + JSON.stringify([refused.error, !!refused.said, untouched, !!made.error, !!now, fs.readFileSync(moved, "utf8") === damaged, rowSays,
        rowEn.slice(0, 160), rowPl.slice(0, 160)]));
  }

  /* a3 THE BACKUP CARRIES EVERY EPOCH (board 958, pilot path A3). The team file's recovery copy holds the current
     epoch only, and an edition or a desk proposal left at an earlier one opens with that epoch's key from teams.json.
     The lead's box already travels in the key file. A fresh profile keeps every epoch the vault opened, a pending one
     still pending, then opens those files, the statistics envelope, and publishes. */
  {
    const K = await import(pathToFileURL(path.join(ROOT, "src", "team-store.mjs")).href);
    const Review = await import(pathToFileURL(path.join(ROOT, "src", "review.mjs")).href);
    const Seal = Engine.sealRules();
    const Stats = Engine.statsRules();
    const PASS = "a passphrase for the epoch copy";
    const deskId = "k-a3a3a3a3a3a3a3a3";
    const payload = "{\"desk\":\"Glass ferry\"}";
    const backupAt = path.join(SCRATCH, "a3-key-copy.json");
    const vault = {
      available: () => true,
      seal: (t) => FAKE_VAULT_STORAGE.encryptString(t),
      open: (b) => FAKE_VAULT_STORAGE.decryptString(b),
    };
    const epochOf = (file) => { try { return JSON.parse(fs.readFileSync(file, "utf8")).epoch; } catch (e) { return null; } };
    let s = null, fresh = null, detail = {};
    try {
      let secret = "";
      const thread = (verb, ...a) => {
        const last = a[a.length - 1];
        if (last && typeof last === "object" && typeof last.passphrase === "string" && last.passphrase) secret = last.passphrase;
        return realThread(verb, ...a);
      };
      s = await loadShell("a3-home", { signedIn: true, env: { STUDIO_TEST_BACKUP: backupAt, STUDIO_PROJECTS: path.join(SCRATCH, "a3-project") }, thread });
      const home = path.join(SCRATCH, "a3-home");
      const teamsAt = K.teamsFile(home);
      const keyAt = Sg2.defaultKeyFile(home);
      const made = await St2.newProject(path.join(SCRATCH, "a3-project"), "Glass ferry", [{ code: "en", name: "English" }]);
      const dir = made.dir;
      const shelf = (await St2.addTag(dir, "shelf", { en: "Shelf" })).tag.id;
      await St2.addCard(dir, shelf, "Glass ferry", "A short reply for the gate.");
      const share = path.join(SCRATCH, "a3-share");
      fs.mkdirSync(share, { recursive: true });
      await St2.setPublishFolder(dir, share);
      const keyMade = await s.ask("studio:key-make");
      /* The team is made by the fixture (was: by the shell's Sealed press at the plain folder, which Studio no longer does, team-seal fh4), under the
         key the shell just made: its secret is what the stand-in vault sealed. */
      const teamId = "t-" + crypto.randomBytes(8).toString("hex"), teamKey0 = crypto.randomBytes(32);
      K.keepTeamKey(teamsAt, vault, teamId, 1, teamKey0);
      await olderFolderTeam(dir, { key: keyAt, passphrase: String(FAKE_VAULT_STORAGE.decryptString(Buffer.from(JSON.parse(fs.readFileSync(keyAt, "utf8")).private, "base64"))),
        teamId, teamKeys: { [teamId]: { 1: teamKey0 } }, teamsFile: teamsAt, relay: true });
      const first = await s.ask("studio:publish", dir, { notes: "first" });
      if (!first || first.error || !first.ec) throw new Error("first publish: " + (first && first.error));
      const older = path.join(share, "kept-earlier.ec");
      fs.copyFileSync(first.ec, older);
      await St2.addCard(dir, shelf, "A second card", "Written before the key moved on.");
      const second = await s.ask("studio:publish", dir, { notes: "second" });
      if (!second || second.error || !second.ec) throw new Error("second publish: " + (second && second.error));
      const held = K.teamKeysOf(teamsAt, vault);
      const K1 = held[teamId] && held[teamId][1] ? Buffer.from(held[teamId][1]) : null;
      if (!K1) throw new Error("epoch 1 was not kept");
      const plain = Seal.openSealed(K1, JSON.parse(fs.readFileSync(older, "utf8")));
      if (typeof plain !== "string") throw new Error("the earlier edition did not open before the move");
      const deskFile = path.join(share, "desks", deskId, "note.ec");
      fs.mkdirSync(path.dirname(deskFile), { recursive: true });
      fs.writeFileSync(deskFile, JSON.stringify(Seal.sealCatalog(K1, teamId, 1, plain)) + "\n");
      const read = Sg2.readKeyFile(keyAt);
      const box = Sg2.openLeadBox(read, Sg2.unlockKey(read, secret));
      const estat = Stats.sealStatsLead(box.public, teamId, read.keyId, deskId, payload);
      fs.writeFileSync(path.join(share, "desks", deskId, "stats.estat"), JSON.stringify(estat) + "\n");
      const moved = await St2.moveEpoch(dir, keyAt, teamId, secret, { confirm: true, teamKeys: K.teamKeysOf(teamsAt, vault) });
      if (!moved || !moved.moved || !moved.teamKey) throw new Error("the team did not move: " + JSON.stringify(moved && moved.refused));
      const K2 = Buffer.from(moved.teamKey);
      K.keepTeamKey(teamsAt, vault, teamId, moved.epoch, K2);
      const otherTeam = "t-" + crypto.randomBytes(8).toString("hex");
      const Kp = crypto.randomBytes(32);
      K.keepTeamKey(teamsAt, vault, otherTeam, 4, Kp);
      K.markKeyPending(teamsAt, otherTeam, 4);
      const backed = await s.ask("studio:key-backup", PASS, "t", "k");
      s.done(); s = null;
      const copyText = fs.existsSync(backupAt) ? fs.readFileSync(backupAt, "utf8") : "";
      const copyDoc = copyText ? JSON.parse(copyText) : {};
      const leaked = [teamId, otherTeam, K1.toString("hex"), K2.toString("hex"), Kp.toString("hex")]
        .some((needle) => needle && copyText.indexOf(needle) >= 0);
      fresh = await loadShell("a3-fresh", { signedIn: true, env: { STUDIO_TEST_RESTORE: backupAt, STUDIO_PROJECTS: path.join(SCRATCH, "a3-project") }, thread: realThread });
      const freshHome = path.join(SCRATCH, "a3-fresh");
      const freshKey = Sg2.defaultKeyFile(freshHome);
      const picked = await fresh.ask("studio:key-restore-pick", "t", "k");
      const restored = await fresh.ask("studio:key-restore", picked.file, PASS);
      const freshTeams = K.teamsFile(freshHome);
      const freshKeys = K.teamKeysOf(freshTeams, vault);
      const freshPending = K.pendingEpochsOf(freshTeams);
      const got1 = freshKeys[teamId] && freshKeys[teamId][1] ? Buffer.from(freshKeys[teamId][1]) : null;
      const got2 = freshKeys[teamId] && freshKeys[teamId][2] ? Buffer.from(freshKeys[teamId][2]) : null;
      const gotP = freshKeys[otherTeam] && freshKeys[otherTeam][4] ? Buffer.from(freshKeys[otherTeam][4]) : null;
      const olderEnv = JSON.parse(fs.readFileSync(older, "utf8"));
      const olderText = got1 ? Seal.openSealed(got1, olderEnv) : null;
      const opened = Review.openedDeskFile(JSON.parse(fs.readFileSync(deskFile, "utf8")), deskFile, freshKeys, Seal, null);
      const deskTitle = opened && Array.isArray(opened.cards) && opened.cards.some((c) => c && c.title && c.title.en === "Glass ferry");
      const freshRead = Sg2.readKeyFile(freshKey);
      const freshSecret = FAKE_VAULT_STORAGE.decryptString(Buffer.from(String(JSON.parse(fs.readFileSync(freshKey, "utf8")).private), "base64"));
      const freshBox = Sg2.openLeadBox(freshRead, Sg2.unlockKey(freshRead, freshSecret));
      const estatText = freshBox ? Stats.openStatsSealed(freshBox.secretKey, JSON.parse(fs.readFileSync(path.join(share, "desks", deskId, "stats.estat"), "utf8")), deskId) : null;
      const osDoc = JSON.parse(fs.readFileSync(freshKey, "utf8"));
      await St2.addCard(dir, shelf, "A later reply", "Written on the restored computer.");
      const pub = await fresh.ask("studio:publish", dir, { notes: "restored" });
      fresh.done(); fresh = null;
      let pubEnv = null;
      try { pubEnv = pub && pub.ec ? JSON.parse(fs.readFileSync(pub.ec, "utf8")) : null; } catch (e) { pubEnv = null; }
      const pubText = pubEnv ? Seal.openSealed(K2, pubEnv) : null;
      detail = {
        keyMade: !keyMade.error && keyMade.kept === "os",
        team: teamId,
        firstRev: first.rev, secondRev: second.rev,
        olderEpoch: epochOf(older), canonicalEpoch: epochOf(second.ec),
        backed: !backed.error,
        epochsField: Object.prototype.hasOwnProperty.call(copyDoc, "epochs"),
        leaked,
        restored: !restored.error,
        epoch1: !!(got1 && got1.equals(K1)),
        epoch2: !!(got2 && got2.equals(K2)),
        pending: !!(gotP && gotP.equals(Kp) && Array.isArray(freshPending[otherTeam]) && freshPending[otherTeam].indexOf(4) >= 0)
          && !(freshPending[teamId] && freshPending[teamId].length),
        olderOpens: typeof olderText === "string" && olderText.indexOf("Glass ferry") >= 0,
        deskOpens: deskTitle === true,
        box: !!(freshBox && freshBox.public === box.public),
        estat: estatText === payload,
        osClean: !Object.prototype.hasOwnProperty.call(osDoc, "epochs") && !Object.prototype.hasOwnProperty.call(osDoc, "relays"),
        pubEpoch: pubEnv && pubEnv.epoch,
        published: !!(pub && !pub.error && pubEnv && pubEnv.epoch === 2 && typeof pubText === "string" && pubText.indexOf("A later reply") >= 0),
        pubError: pub && pub.error ? String(pub.error).slice(0, 180) : null,
      };
    } catch (e) {
      detail = { threw: String(e && e.stack || e).slice(0, 900) };
    } finally {
      if (s) { try { s.done(); } catch (e) { /* the shell was already closed */ } }
      if (fresh) { try { fresh.done(); } catch (e) { /* the shell was already closed */ } }
      delete process.env.STUDIO_TEST_BACKUP;
      delete process.env.STUDIO_TEST_RESTORE;
    }
    check(detail.keyMade === true && detail.backed === true && detail.epochsField === true && detail.leaked === false
          && detail.restored === true && detail.olderEpoch === 1 && detail.canonicalEpoch === 2
          && detail.epoch1 === true && detail.epoch2 === true && detail.pending === true
          && detail.olderOpens === true && detail.deskOpens === true
          && detail.box === true && detail.estat === true && detail.osClean === true
          && detail.published === true,
      "a3 a backup copy carries every epoch's team key: a fresh profile opens an earlier sealed edition and a desk"
      + " proposal, opens a statistics envelope sealed to the lead's box, and publishes under the current epoch; a pending"
      + " epoch stays pending, and the copy shows neither a team nor a key: " + JSON.stringify(detail));

    /* a3r A team-key read that fails refuses the backup: no copy on disk, rather than one found empty on restore day. */
    {
      const READ = "const keys = K.teamKeysOf(at, vault);\n  let pending = {};";
      const text = fs.readFileSync(MAIN, "utf8");
      if (text.split(READ).length !== 2) throw new Error("a3r: the read is not in shell/main.js as this leg expects");
      const at = path.join(SCRATCH, "a3r-copy");
      for (const d of ["shell", "src", "ui", "engine/pinned"]) fs.cpSync(path.join(ROOT, d), path.join(at, d), { recursive: true });
      fs.copyFileSync(path.join(ROOT, "package.json"), path.join(at, "package.json"));
      fs.writeFileSync(path.join(at, "shell", "main.js"),
        text.split(READ).join('const keys = (() => { throw new Error("planted: the team keys could not be read"); })();\n  let pending = {};'));
      const refusedAt = path.join(SCRATCH, "a3r-key-copy.json");
      const r = await loadShell("a3r-home", { main: path.join(at, "shell", "main.js"), env: { STUDIO_TEST_BACKUP: refusedAt } });
      let made = null, tried = null;
      try {
        made = await r.ask("studio:key-make");
        tried = await r.ask("studio:key-backup", "a passphrase for the copy", "t", "k");
      } finally { try { r.done(); } catch (e) { /* the shell was already closed */ } }
      delete process.env.STUDIO_TEST_BACKUP;
      check(!!made && !made.error && !!tried && /planted: the team keys could not be read/.test(String(tried.error)) && !fs.existsSync(refusedAt),
        "a3r a team-key read that fails refuses the backup and writes no copy: "
        + JSON.stringify({ made, tried, onDisk: fs.existsSync(refusedAt) }));
    }
  }

  /* ---- 20. MAINTENANCE READINGS REPORT NOT RECORDED (the test architect's read of 2026-11-08) ----
     Where Studio records no start or crash state, the shell's maintenance readings report "not recorded"
     for both when nothing was recorded. With a plant that puts a literal back, it goes red. */
  {
    const s = await loadShell("maintenance-readings");
    let m = null;
    try {
      m = await s.ask("studio:maintenance");
    } finally {
      try { s.done(); } catch (e) { /* the shell was already closed */ }
    }
    const honest = !!(m && m.lastStart === "not recorded" && m.lastCrash === "not recorded"
      && m.health && m.health.lastStart === "not recorded" && m.health.lastCrash === "not recorded");

    /* CONTROL: a plant putting either literal back fails the check */
    const plantStart = Object.assign({}, m, { lastStart: "ordinary" });
    const plantCrash = Object.assign({}, m, { lastCrash: "none recorded" });
    const plantHealthStart = Object.assign({}, m, { health: Object.assign({}, m && m.health, { lastStart: "ordinary" }) });
    const plantHealthCrash = Object.assign({}, m, { health: Object.assign({}, m && m.health, { lastCrash: "none recorded" }) });
    const checkHonest = (r) => !!(r && r.lastStart === "not recorded" && r.lastCrash === "not recorded"
      && r.health && r.health.lastStart === "not recorded" && r.health.lastCrash === "not recorded");
    const plantsFail = !checkHonest(plantStart) && !checkHonest(plantCrash)
      && !checkHonest(plantHealthStart) && !checkHonest(plantHealthCrash);

    check(honest && plantsFail,
      "20 the shell's maintenance readings report 'not recorded' for both when nothing was recorded: "
      + JSON.stringify({ lastStart: m && m.lastStart, lastCrash: m && m.lastCrash, health: m && m.health && { lastStart: m.health.lastStart, lastCrash: m.health.lastCrash } }));
  }

  /* ---- 21. DOES THIS STUDIO WORK, AND WHAT STAYS OPEN WHEN IT DOES NOT (the gate's first half; Max 2026-11-17 19:35, of Studio:
     "sign in first, one 14 day trial, nothing before it"). Nothing consults either yet, so this section holds their shape alone:
     studioWorks against every state src/licence.mjs's licenceState can answer, read off its text, so a state added there turns
     21a until it is judged; the licence answer's works in each state, reached through the shell as the page asks; and the table
     against the channels the loaded shell opened, through answer() (ipcMain.handle) and hear() (ipcMain.on), the only two ways
     a channel is opened (21e counts ipcMain once in the shell's code and nowhere else in shell/ or src/). ---- */
  {
    const mainText = fs.readFileSync(MAIN, "utf8");
    const fnAt = mainText.indexOf("\nfunction studioWorks(");
    const fnEnd = fnAt < 0 ? -1 : mainText.indexOf("\n}\n", fnAt);
    const studioWorks = fnAt < 0 || fnEnd < 0 ? null
      : vm.runInNewContext(mainText.slice(fnAt, fnEnd + 2) + "\nstudioWorks;", {}, { filename: "studio-works-slice.js" });
    const licText = fs.readFileSync(path.join(ROOT, "src", "licence.mjs"), "utf8");
    const body = (name) => { const at = licText.indexOf(name); return at < 0 ? "" : licText.slice(at, licText.indexOf("\n}\n", at)); };
    const statuses = [...new Set(Array.from((body("async function licenceState(") + body("function heldOpen(")).matchAll(
      /status:\s*(?:\w+\s*\?\s*)?"([a-z-]+)"(?:\s*:\s*"([a-z-]+)")?/g), (m) => [m[1], m[2]]).flat().filter(Boolean))].sort();
    const KNOWN = ["active", "held", "none", "paid-ended", "trial", "trial-ended"];
    /* Since Max's ruling of 2026-11-22 15:37 (review xi): this Studio's own seat certificate holding, or a licence the root signed by hand
       under these states. It was: a sign-in's state under them. */
    const UNDER = ["active", "held", "trial"];
    const wrong = [];
    for (const status of statuses) for (const root of [false, true]) for (const seated of [false, true]) {
      let got;
      try { got = studioWorks(Object.assign({ status }, root ? { root: true } : {}), seated); } catch (e) { got = "threw " + (e && e.message); }
      if (got !== (seated || (root && UNDER.includes(status)))) wrong.push(status + "/" + root + "/" + seated + "=" + got);
    }
    const edges = studioWorks ? [studioWorks(null, false), studioWorks({ status: "active" }, false), studioWorks({ status: "active", root: "yes" }, "yes"), studioWorks()] : [true];
    check(!!studioWorks && JSON.stringify(statuses) === JSON.stringify(KNOWN) && wrong.length === 0 && edges.every((v) => v === false),
      "21a studioWorks is true where this Studio's own seat certificate holds, or under a licence the root signed in " + UNDER.join(", ")
      + ", for each of licenceState's " + statuses.length + " states (" + statuses.join(", ") + "); a service-issued licence alone, nothing"
      + " held, and anything but true are false" + (wrong.length ? "; wrong: " + wrong.join(" ") : ""));

    /* 21b: each state put on a Studio as a lead's would be, a licence file at STUDIO_LICENSE_FILE signed by a throwaway root
       STUDIO_VENDOR_KEY names, and licence-service.json as a sign-in, an administrator or an activation before it leaves it. The
       held file is one the system refuses with EBUSY for as long as the read is asked, as licence-handling 15 plants it. */
    const L = await import(pathToFileURL(path.join(ROOT, "src", "licence.mjs")).href);
    const pair = crypto.generateKeyPairSync("ed25519");
    const rootPub = pair.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
    const asFile = (doc) => "window.E_LICENSE = " + JSON.stringify(doc, null, 1) + ";\n";
    const DAY = 86400000;
    const paid = asFile(await L.createTestLicence({ issued: "2026-09-01", updatesUntil: "2027-09-01" }, pair.privateKey, "test-root"));
    const paidOff = asFile(await L.createTestLicence({ issued: "2026-01-01", updatesUntil: "2027-01-01", paidUntil: Date.parse("2026-02-01T00:00:00Z") },
      pair.privateKey, "test-root"));
    const trialOn = asFile(await L.createTestTrialLicence({ issued: new Date().toISOString().slice(0, 10), ends: Date.now() + 7 * DAY },
      pair.privateKey, "test-root"));
    const trialOff = asFile(await L.createTestTrialLicence({ issued: "2026-01-01", ends: Date.parse("2026-01-15T00:00:00Z") },
      pair.privateKey, "test-root"));
    const SIGNED = { by: "signin", provider: "microsoft" };
    const ADMIN = { by: "admin", provider: "microsoft", adminCard: { org: "Org", seats: { lead: { held: 1, of: 2 }, desk: { held: 0, of: 5 } } } };
    /* [what the state is, licence-service.json, the licence file's text, the store, STUDIO_RELEASED, held, works, the status] */
    /* Since Max's ruling of 2026-11-22 15:37 (review xi) a licence the root signed by hand works with no sign-in, the one narrow path, so
       the rows with nobody signed in, an administrator and an activation by key under such a licence now work (were: did not). This
       harness's licences are the root's; the gate on a service-issued licence and the seat certificate is licence-studio lsx1. */
    const STATES = [
      ["nobody signed in, no licence", null, null, null, null, false, false, "none"],
      ["signed in, no licence", SIGNED, null, null, null, false, false, "none"],
      ["signed in, a store an older Studio left naming a first-run day", SIGNED, null, { trialFrom: "2020-01-01" }, null, false, false, "none"],
      ["signed in, a file that cannot be used", SIGNED, "not a licence\n", null, null, false, false, "none"],
      ["signed in, a trial running", SIGNED, trialOn, null, null, false, true, "trial"],
      ["signed in, a trial ended", SIGNED, trialOff, null, null, false, false, "trial-ended"],
      ["signed in, a paid licence ended", SIGNED, paidOff, null, null, false, false, "paid-ended"],
      ["signed in, a licence", SIGNED, paid, null, null, false, true, "active"],
      ["signed in, a licence whose updates ended before this build was released, read as any licence", SIGNED, paid, null, "2099-06-01", false, true, "active"],
      /* Since review xi (A1) a held file rests only on a licence this Studio verified at that path: read once first ("after"), it is
         held and works. The row was read only while held; the shell reads its licence as it starts, so "never read" is licence-handling xi1a. */
      ["signed in, a licence file another program holds after this Studio read it", SIGNED, paid, null, null, "after", true, "held"],
      ["an administrator, a licence the root signed", ADMIN, paid, null, null, false, true, "active"],
      ["nobody signed in, a licence the root signed", null, paid, null, null, false, true, "active"],
      ["activated by a purchase key before sign-in, a licence the root signed", { by: "key" }, paid, null, null, false, true, "active"],
      ["nobody signed in, a trial the root signed, running", null, trialOn, null, null, false, true, "trial"],
    ];
    const seen = [];
    for (let i = 0; i < STATES.length; i++) {
      const [name, service, text, store, released, held, works, status] = STATES[i];
      const id = "works-" + (i + 1), ud = path.join(SCRATCH, id), file = path.join(ud, "etiuda-studio-license.js");
      fs.mkdirSync(ud, { recursive: true });
      if (service) fs.writeFileSync(path.join(ud, "licence-service.json"), JSON.stringify(service));
      if (text !== null) fs.writeFileSync(file, text);
      const s = await loadShell(id, { works: "own", ...(store ? { store } : {}), env: { STUDIO_VENDOR_KEY: rootPub, STUDIO_LICENSE_FILE: file,
        STUDIO_LICENCE_FILE: null, STUDIO_RELEASED: released, ETIUDA_SIGNIN_LAB: null } });
      const realRead = fs.readFileSync;
      if (held === "after") { try { await s.ask("studio:licence"); } catch { /* the held ask below says it */ } }
      if (held) fs.readFileSync = function (p, ...rest) {
        if (typeof p === "string" && path.resolve(p) === path.resolve(file)) {
          const err = new Error("EBUSY: resource busy or locked, open '" + p + "'");
          err.code = "EBUSY"; err.syscall = "open"; err.path = p;
          throw err;
        }
        return realRead.call(this, p, ...rest);
      };
      let r = null;
      try { r = await s.ask("studio:licence"); } finally { fs.readFileSync = realRead; s.done(); }
      const lic = r && r.licence;
      const ok = !!r && !r.error && typeof r.works === "boolean" && r.works === works && !!lic && lic.status === status
        && (status !== "none" || !!lic.unusable === (text !== null))
        /* THE REFUSED FILE NAME rides the answer (class B, 2026-11-22): the name and not the path, for the door to say. */
        && (!(status === "none" && text !== null) || (lic.unusable && lic.unusable.file === "etiuda-studio-license.js"));
      seen.push(name + " " + (r && r.works) + (ok ? "" : " WRONG(" + JSON.stringify(r && (r.error || lic)).slice(0, 160) + ")"));
    }
    LR_PROBE = async (main, id) => {
      const ud = path.join(SCRATCH, id), file = path.join(ud, "etiuda-studio-license.js");
      fs.mkdirSync(ud, { recursive: true });
      fs.writeFileSync(path.join(ud, "licence-service.json"), JSON.stringify(SIGNED));
      fs.writeFileSync(file, "not a licence"+String.fromCharCode(10));
      const s = await loadShell(id, { works: "own", main, env: { STUDIO_VENDOR_KEY: rootPub, STUDIO_LICENSE_FILE: file, STUDIO_LICENCE_FILE: null, ETIUDA_SIGNIN_LAB: null } });
      let r = null;
      try { r = await s.ask("studio:licence"); } finally { s.done(); }
      return r && r.licence && r.licence.unusable ? r.licence.unusable.file : null;
    };
    check(seen.length === STATES.length && seen.every((x) => !/ WRONG\(/.test(x)),
      "21b the licence answer carries works, a boolean, as studioWorks judges each state: " + seen.join("; "));

    /* 21c: only studioDoorState in ui/app.js reads works (preload reads nothing of it), comments taken out (strings stay, and
       an English sentence's "works" is no read). 21d plants a read of works outside studioDoorState. */
    const appText = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
    const doorAt = appText.indexOf("function studioDoorState("), doorEnd = doorAt < 0 ? -1 : appText.indexOf("\n  }\n", doorAt);
    const appOutside = doorAt >= 0 && doorEnd > doorAt ? appText.slice(0, doorAt) + appText.slice(doorEnd) : appText;
    const otherUi = fs.readdirSync(path.join(ROOT, "ui")).filter((f) => /\.(js|html)$/.test(f) && f !== "app.js")
      .map((f) => withoutComments(fs.readFileSync(path.join(ROOT, "ui", f), "utf8"), f)).join("\n");
    const pageOutside = withoutComments(appOutside, "app.js") + "\n" + otherUi;
    const doorCode = doorAt >= 0 && doorEnd > doorAt ? withoutComments(appText.slice(doorAt, doorEnd), "app.js") : "";
    const readsOf = (text) => text.match(/\.works\b|\[\s*["'`]works["'`]\s*\]|[{,]\s*works\s*[,}:=]/g) || [];
    check(doorAt >= 0 && readsOf(doorCode).length >= 1 && readsOf(pageOutside).length === 0 && !/\bworks\b/.test(fs.readFileSync(PRELOAD, "utf8")),
      "21c only studioDoorState in ui/app.js reads works, and preload reads none: " + JSON.stringify({ door: readsOf(doorCode), outside: readsOf(pageOutside) }));
    const plantedPage = pageOutside + "\nif (S.lic && S.lic.works) paintMain();\nconst { works } = S.lic || {};\n";
    check(readsOf(plantedPage).length === 2, "21d CONTROL: a page reading S.lic.works outside studioDoorState and destructuring it fails 21c: "
      + JSON.stringify(readsOf(plantedPage)));

    /* 21e to 21h: the table, read off the shell's text as written, against the channels the loaded shell opened. */
    const setOf = (text, name) => {
      const at = text.indexOf("const " + name + " = new Set([");
      if (at < 0) return null;
      return Array.from(vm.runInNewContext("(" + text.slice(text.indexOf("[", at), text.indexOf("]);", at) + 1) + ")", {}));
    };
    const tableFaults = (opened, text) => {
      const op = setOf(text, "OPEN_STOPPED") || [], cl = setOf(text, "CLOSED_STOPPED") || [];
      return { open: op.length, closed: cl.length,
        neither: opened.filter((c) => !op.includes(c) && !cl.includes(c)),
        both: op.filter((c) => cl.includes(c)),
        stray: op.concat(cl).filter((c) => !opened.includes(c)),
        twice: op.filter((c, i) => op.indexOf(c) !== i).concat(cl.filter((c, i) => cl.indexOf(c) !== i)) };
    };
    const clean = (f) => f.open > 0 && f.closed > 0 && !f.neither.length && !f.both.length && !f.stray.length && !f.twice.length;
    const t = await loadShell("channel-table");
    const opened = Object.keys(t.handlers).concat(Object.keys(t.heard)).sort();
    t.done();
    const code = withoutComments(mainText, "main.js");
    const otherIpc = ["shell", "src"].flatMap((d) => fs.readdirSync(path.join(ROOT, d)).filter((f) => /\.(c|m)?js$/.test(f))
      .map((f) => path.join(d, f))).filter((f) => f !== path.join("shell", "main.js")
      && /\bipcMain\b/.test(fs.readFileSync(path.join(ROOT, f), "utf8")));
    const real = tableFaults(opened, mainText);
    check(opened.length >= 150 && Object.keys(t.heard).length >= 1 && clean(real) && real.open + real.closed === opened.length
      && (code.match(/\bipcMain\b/g) || []).length === 1 && (code.match(/\bIPC\.\w+\(/g) || []).length === 2 && otherIpc.length === 0,
      "21e every one of the " + opened.length + " channels the shell opens (" + Object.keys(t.handlers).length + " by answer, "
      + Object.keys(t.heard).length + " by hear) is in exactly one set, " + real.open + " open and " + real.closed + " closed while"
      + " Studio does not work, and no name in either is a channel it does not open; ipcMain named once, nowhere else in shell/ or src/: "
      + JSON.stringify({ neither: real.neither, both: real.both, stray: real.stray, twice: real.twice, otherIpc }));
    const plantText = (from, to) => (mainText.split(from).length === 2 ? mainText.replace(from, () => to) : "");
    const dropped = plantText('"studio:publish", "studio:stats-span"', '"studio:stats-span"');
    const fDropped = tableFaults(opened, dropped), fNew = tableFaults(opened.concat(["studio:planted-new"]), mainText);
    check(!!dropped && !clean(fDropped) && JSON.stringify(fDropped.neither) === '["studio:publish"]'
      && !clean(fNew) && JSON.stringify(fNew.neither) === '["studio:planted-new"]',
      "21f CONTROL: studio:publish taken out of the table, and a channel opened that the table does not name, each fail 21e: "
      + JSON.stringify([fDropped.neither, fNew.neither]));
    const twiceText = plantText("const CLOSED_STOPPED = new Set([", 'const CLOSED_STOPPED = new Set(["studio:licence", ');
    const fBoth = tableFaults(opened, twiceText);
    check(!!twiceText && !clean(fBoth) && JSON.stringify(fBoth.both) === '["studio:licence"]',
      "21g CONTROL: studio:licence named in both sets fails 21e: " + JSON.stringify(fBoth.both));
    const strayText = plantText("const OPEN_STOPPED = new Set([", 'const OPEN_STOPPED = new Set(["studio:no-such-channel", ');
    const fStray = tableFaults(opened, strayText);
    check(!!strayText && !clean(fStray) && JSON.stringify(fStray.stray) === '["studio:no-such-channel"]',
      "21h CONTROL: a name in the table that no channel bears fails 21e: " + JSON.stringify(fStray.stray));
  }

  /* ---- 22. THE GATE ITSELF (the second half; Max 2026-11-17 19:35, of Studio: "sign in first, one 14 day trial, nothing before it"). A
     Studio that does not work refuses every channel the table closes, in one sentence marked as a stop, and reaches nothing of the
     team or the thread to do it (22b), while a working Studio answers the same asks (22b2); it serves every channel the table opens
     (22c); a person can always save what is theirs, every export on the open side exporting each project (22d); the acts that only
     take away still work (22e); no background act starts or changes anything while Studio does not work, and the same acts do
     look at the team's record while it does (22f, 22f2); and the page's start names no open project (22g). ---- */
  {
    const wireMod = require(path.join(ROOT, "src", "wire.cjs"));
    const wireCalls = [], wireWas = {};
    for (const n of ["relayRequest", "relayConnect", "licenceRequest", "licenceNote", "customerAiRequest", "identityAuthorize", "identityRequest", "identityListen"]) if (typeof wireMod[n] === "function") {
      wireWas[n] = wireMod[n];
      wireMod[n] = function () { wireCalls.push(n); return Promise.reject(new Error("no network in this leg")); };
    }
    const tableOf = (text, name) => {
      const at = text.indexOf("const " + name + " = new Set([");
      return at < 0 ? [] : Array.from(vm.runInNewContext("(" + text.slice(text.indexOf("[", at), text.indexOf("]);", at) + 1) + ")", {}));
    };
    const mainNow = fs.readFileSync(MAIN, "utf8");
    const WAY_OUT = ["studio:projects", "studio:export-pick", "studio:export-edition", "studio:csv-pick", "studio:csv-export", "studio:archive",
      "studio:audit-pack-pick", "studio:audit-pack", "studio:stats-export-pick", "studio:stats-export"];
    const TAKES_AWAY = ["studio:member-remove", "studio:invite-cancel", "studio:team-key-move", "studio:seat-free", "studio:follow-leave"];
    const sideOf = (text, list) => {
      const op = tableOf(text, "OPEN_STOPPED"), cl = tableOf(text, "CLOSED_STOPPED");
      return { op, cl, wrong: list.filter((c) => !op.includes(c) || cl.includes(c)) };
    };
    const side = sideOf(mainNow, WAY_OUT), sideAway = sideOf(mainNow, TAKES_AWAY);
    check(side.wrong.length === 0 && side.op.length > 0,
      "22a the way out's ten channels (the library's list the projects are named from, an edition, a sheet of cards, the archive's"
      + " list, an audit pack and the statistics workbook, with their pickers) are on the open side of the table and on no other: wrong " + JSON.stringify(side.wrong));
    check(sideAway.wrong.length === 0 && sideAway.op.length > 0,
      "22a2 the five acts that only take away (removing a member, cancelling an invitation, moving the team key, freeing a seat, leaving a"
      + " followed team) are on the open side of the table and on no other: wrong " + JSON.stringify(sideAway.wrong));

    const stoppedShape = (r) => !!(r && r.error && r.said && r.said.why === "stopped");
    const treeHash = (dir) => {
      const h = crypto.createHash("sha256");
      const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((x, y) => (x.name < y.name ? -1 : 1))) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) { h.update("d:" + e.name); walk(p); } else if (e.isFile()) { h.update("f:" + e.name); h.update(fs.readFileSync(p)); }
      } };
      try { walk(dir); } catch { h.update("none"); }
      return h.digest("hex");
    };
    /* A library of two projects, as a lead's desk holds: Alpha a draft with a card, Beta the same with one published edition. */
    const gateLib = async (tag) => {
      const root = path.join(SCRATCH, "gate-lib-" + tag);
      const mk = async (title) => {
        const made = await St2.newProject(root, title, [{ code: "en", name: "English" }]);
        const shelf = (await St2.addTag(made.dir, "shelf", { en: "General" })).tag.id;
        await St2.addCard(made.dir, shelf, "Widuma tosork", "Sarnesk kelbun.");
        return made.dir;
      };
      const a = await mk("Alpha"), b = await mk("Beta");
      const share = path.join(SCRATCH, "gate-share-" + tag);
      fs.mkdirSync(share, { recursive: true });
      await St2.setPublishFolder(b, share);
      const pub = await St2.publishProject(b, Object.assign({ userData: path.join(SCRATCH, "gate-pub-" + tag) }, await licensedOpts()));
      return { root, a, b, edition: pub.edition };
    };
    const SAMPLE = (lib) => [["studio:teams"], ["studio:open", lib.a], ["studio:new", "Gamma"], ["studio:save-card", lib.a, {}],
      ["studio:tag-add", lib.a, "shelf", { en: "Other" }], ["studio:card-add", lib.a, "x", "Title", "Body"], ["studio:row-facts", lib.a],
      ["studio:publish", lib.a, {}], ["studio:publish-plan", lib.a], ["studio:stats", lib.a], ["studio:proposals", lib.a],
      ["studio:desks", lib.a], ["studio:team-exports", lib.a, true], ["studio:follow-join", "junk", "n"], ["studio:ai-settings"],
      ["studio:tabs", {}], ["studio:key-make"], ["studio:pick-root", "t"], ["studio:people-list", lib.a], ["studio:audit", lib.a, "x"],
      ["studio:changes", lib.a], ["studio:import-pick", "t", {}], ["studio:diff", lib.b, "a", "b"], ["studio:rename", lib.a, "Renamed"]];
    const SAMPLE_N = SAMPLE({}).length;

    /* 22b: the sample, on a Studio that does and one that does not work. */
    const sampleProbe = async (main, tag, works) => {
      const lib = await gateLib("sample-" + tag + (works ? "w" : "s"));
      const name = "gate-sample-" + tag + (works ? "w" : "s");
      const s = await loadShell(name, { works, main, thread: realThread, env: { STUDIO_PROJECTS: lib.root } });
      try {
        await drained();
        const calls0 = s.calls.length, sent = wireCalls.length, ud = path.join(SCRATCH, name);
        const state = () => treeHash(lib.root) + treeHash(path.join(ud, "keys")) + (fs.existsSync(path.join(ud, "teams.json")) ? "t" : "");
        const before = state();
        const refused = [], served = [];
        for (const [ch, ...a] of SAMPLE(lib)) {
          let r = null;
          try { r = await s.ask(ch, ...a); } catch (e) { r = { error: "threw " + (e && e.message) }; }
          (stoppedShape(r) ? refused : served).push(ch.slice(7));
        }
        return { refused, served, calls: s.calls.length - calls0, wire: wireCalls.length - sent, changed: before !== state() };
      } finally { s.done(); }
    };
    let stopped = null, working = null;
    try { stopped = await sampleProbe(MAIN, "real", false); } catch (e) { stopped = { threw: String(e && e.stack || e).slice(0, 300) }; }
    check(!!stopped && !stopped.threw && stopped.served.length === 0 && stopped.refused.length === SAMPLE_N && stopped.calls === 0
      && stopped.wire === 0 && !stopped.changed,
      "22b a Studio that does not work refuses " + SAMPLE_N + " closed channels (the teams, open, new, a card's save, a tag, a card,"
      + " a row's facts, publish, its plan, statistics, proposals, the desks, a team's exports, following, the AI's settings, tabs, a"
      + " signing key, the folder pick, the people, the audit, the changes, an import, a diff, a rename) in the sentence marked as a stop,"
      + " reaching the thread and the wire for none, and the library, the keys and the team record are the same bytes after: "
      + JSON.stringify(stopped && (stopped.threw || { refused: stopped.refused.length, served: stopped.served, calls: stopped.calls, wire: stopped.wire, changed: stopped.changed })));
    try { working = await sampleProbe(MAIN, "real", true); } catch (e) { working = { threw: String(e && e.stack || e).slice(0, 300) }; }
    check(!!working && !working.threw && working.refused.length === 0 && working.served.length === SAMPLE_N,
      "22b2 CONTROL: a Studio that works answers the same asks, none in the sentence marked as a stop: "
      + JSON.stringify(working && (working.threw || { refused: working.refused, served: working.served.length })));

    /* 22c: every channel the table opens is served while Studio does not work. Five act on the world (a reset, a sign-in's browser)
       and are held by the table and by 22b's sentence alone. */
    const NOT_ASKED = new Set(["studio:reset", "studio:reset-again", "studio:reset-stop", "studio:licence-signin", "studio:licence-signin-again"]);
    const openProbe = async (main, tag) => {
      const lib = await gateLib("open-" + tag);
      const s = await loadShell("gate-open-" + tag, { works: false, main, thread: realThread, env: { STUDIO_PROJECTS: lib.root } });
      try {
        const shut = [], opened = tableOf(fs.readFileSync(main, "utf8"), "OPEN_STOPPED");
        for (const ch of opened) {
          if (NOT_ASKED.has(ch) || !s.handlers[ch]) continue;
          let r = null;
          try { r = await s.ask(ch); } catch (e) { r = null; }
          if (stoppedShape(r)) shut.push(ch);
        }
        return { shut, heardShut: Object.keys(s.heard).filter((c) => !opened.includes(c)), asked: opened.filter((c) => !NOT_ASKED.has(c) && s.handlers[c]).length };
      } finally { s.done(); }
    };
    let served = null;
    try { served = await openProbe(MAIN, "real"); } catch (e) { served = { threw: String(e && e.stack || e).slice(0, 300) }; }
    check(!!served && !served.threw && served.shut.length === 0 && served.heardShut.length === 0 && served.asked > 30,
      "22c every channel the table opens is served while Studio does not work (all but the reset's three and the sign-in's two, which"
      + " act on the world), and the four the shell only hears are all on the open side, so hear() refuses none: " + JSON.stringify(served && (served.threw || served)));

    /* 22d: the way out. A stopped Studio hands each project's cards out as a sheet, one project's edition out as a file, byte for
       byte, its audit pack out, and its statistics workbook out as far as its own refusals go; its projects stay as they were. */
    const outProbe = async (main, tag) => {
      const lib = await gateLib("out-" + tag), name = "gate-out-" + tag;
      const where = (n) => path.join(SCRATCH, name + "-" + n);
      const s = await loadShell(name, { works: false, main, thread: realThread, env: { STUDIO_PROJECTS: lib.root } });
      const keep = {};
      for (const k of ["STUDIO_TEST_CSV", "STUDIO_TEST_SAVE", "STUDIO_TEST_PACK", "STUDIO_TEST_STATS"]) keep[k] = process.env[k];
      const said = [];
      try {
        const before = treeHash(lib.a) + treeHash(lib.b);
        const listed = await s.ask("studio:projects"), rows = listed && listed.projects ? listed.projects : [];
        if (rows.length !== 2) said.push("library: " + JSON.stringify(listed && (listed.error || rows.length)).slice(0, 120));
        const beta = rows.find((r) => r.dir === lib.b) || { dir: lib.b };
        for (const row of rows) {
          const who = String(row.name).toLowerCase(), dir = row.dir;
          process.env.STUDIO_TEST_CSV = where("sheet-" + who);
          const pick = await s.ask("studio:csv-pick", "t");
          const r = await s.ask("studio:csv-export", dir, null, pick && pick.folder);
          const wrote = fs.existsSync(where("sheet-" + who)) && fs.readdirSync(where("sheet-" + who)).length > 0;
          if (!pick || pick.error || !r || r.error || !wrote) said.push("sheet " + who + ": " + JSON.stringify((pick && pick.error) || (r && (r.error || r))).slice(0, 120));
        }
        const arc = await s.ask("studio:archive", beta.dir);
        const ed = arc && arc.editions && arc.editions[0];
        if (!ed || ed.edition !== lib.edition) said.push("archive: " + JSON.stringify(arc && (arc.error || arc)).slice(0, 120));
        process.env.STUDIO_TEST_SAVE = where("edition.ec");
        const sp = await s.ask("studio:export-pick", "t", "n");
        const ex = ed ? await s.ask("studio:export-edition", beta.dir, ed.edition, sp && sp.file) : null;
        if (!ex || ex.error || !fs.existsSync(where("edition.ec")) || !ed || !fs.readFileSync(where("edition.ec")).equals(fs.readFileSync(ed.file)))
          said.push("edition: " + JSON.stringify((sp && sp.error) || (ex && (ex.error || ex))).slice(0, 120));
        process.env.STUDIO_TEST_PACK = where("pack");
        const pp = await s.ask("studio:audit-pack-pick", "t");
        const pk = ed ? await s.ask("studio:audit-pack", beta.dir, ed.edition, pp && pp.folder) : null;
        if (!pk || pk.error || !fs.existsSync(where("pack"))) said.push("audit pack: " + JSON.stringify((pp && pp.error) || (pk && (pk.error || pk))).slice(0, 120));
        process.env.STUDIO_TEST_STATS = where("stats.xlsx");
        const sk = await s.ask("studio:stats-export-pick", "t", "n", "k");
        const se = await s.ask("studio:stats-export", beta.dir, sk && sk.file, "{}");
        if (!sk || sk.error || stoppedShape(se) || se === null) said.push("statistics: " + JSON.stringify((sk && sk.error) || (se && (se.error || se))).slice(0, 120));
        if (before !== treeHash(lib.a) + treeHash(lib.b)) said.push("a project changed");
        return said;
      } finally {
        for (const k of Object.keys(keep)) { if (keep[k] === undefined) delete process.env[k]; else process.env[k] = keep[k]; }
        s.done();
      }
    };
    let out = null;
    try { out = await outProbe(MAIN, "real"); } catch (e) { out = ["threw " + String(e && e.stack || e).slice(0, 300)]; }
    check(out.length === 0,
      "22d a Studio that does not work still lets a person save what is theirs: it names the library's two projects, hands each one's cards out as a sheet, one"
      + " project's edition out as a file byte for byte, its audit pack out, and its statistics workbook asked for (none refused as a"
      + " stop), both projects the same bytes after: " + JSON.stringify(out));

    /* 22e: the acts that only take away, asked of a Studio that does not work, answer as themselves (a refusal of their own, where
       there is no team here) and never as a stop. */
    const awayProbe = async (main, tag) => {
      const lib = await gateLib("away-" + tag);
      const s = await loadShell("gate-away-" + tag, { works: false, main, thread: realThread, env: { STUDIO_PROJECTS: lib.root } });
      try {
        const shut = [];
        for (const [ch, ...a] of [["studio:member-remove", lib.a, "", "nobody", true], ["studio:invite-cancel", lib.a, "x", true],
          ["studio:team-key-move", lib.a], ["studio:seat-free", lib.a, "d"], ["studio:follow-leave"]]) {
          let r = null;
          try { r = await s.ask(ch, ...a); } catch (e) { r = { error: "threw" }; }
          if (stoppedShape(r) || r === null) shut.push(ch.slice(7));
        }
        return shut;
      } finally { s.done(); }
    };
    let away = null;
    try { away = await awayProbe(MAIN, "real"); } catch (e) { away = ["threw " + String(e && e.stack || e).slice(0, 300)]; }
    check(away.length === 0,
      "22e the acts that only take away (removing a member, cancelling an invitation, moving the team key, freeing a seat, leaving a"
      + " followed team) are answered while Studio does not work, as themselves and never as a stop: " + JSON.stringify(away));

    /* 22f: the background acts. At launch and at each look Studio starts the team watch (it admits desks), the followed team, the
       catalog watches, the relay's sync and the waiting check; each reads the team record or asks the thread. Run on a Studio that
       does not work, with a key, a library and a team record in its profile, none of them does either, the reads attributed by the
       main.js function in the call stack, three of the five asked again by hand; a Studio that works does read it (22f2). */
    const FIVE = ["followStart", "armCatalogWatches", "watchOnce", "relayOnce", "runWaitingCheck"];
    const rangesOf = (text) => FIVE.map((n) => {
      const at = text.search(new RegExp("\\n(?:async )?function " + n + "\\(")), end = at < 0 ? -1 : text.indexOf("\n}\n", at);
      const line = (i) => text.slice(0, i).split("\n").length;
      return at < 0 ? null : [line(at + 1), line(end + 1), n];
    }).filter(Boolean);
    const launchProbe = async (main, tag, works) => {
      const lib = await gateLib("launch-" + tag + (works ? "w" : "s"));
      const name = "gate-launch-" + tag + (works ? "w" : "s"), ud = path.join(SCRATCH, name);
      fs.mkdirSync(ud, { recursive: true });
      const keyAt = St2.defaultKeyFile(ud), pair = await Sg2.makePair();
      fs.mkdirSync(path.dirname(keyAt), { recursive: true });
      fs.writeFileSync(keyAt, JSON.stringify(Sg2.osFile(pair, FAKE_VAULT_STORAGE.encryptString(pair.der)), null, 1));
      const ranges = rangesOf(fs.readFileSync(main, "utf8")), hits = [], names = ["readFileSync", "existsSync", "statSync", "readFile", "readdirSync"], kept = {};
      names.forEach((n) => { kept[n] = fs[n]; fs[n] = function (p, ...a) {
        if (typeof p === "string" && path.basename(p) === "teams.json") {
          const lines = String(new Error().stack).split("\n").map((l) => /([A-Za-z]:[^()]*?main\.js):(\d+):\d+\)?\s*$/.exec(l)).filter(Boolean)
            .filter((m) => path.resolve(m[1]) === path.resolve(main)).map((m) => Number(m[2]));
          const act = ranges.find((r) => lines.some((ln) => ln >= r[0] && ln <= r[1]));
          if (act) hits.push(act[2]);
        }
        return kept[n].call(this, p, ...a);
      }; });
      syncBuiltinESMExports();
      let s = null;
      try {
        s = await loadShell(name, { works, main, thread: realThread, env: { STUDIO_PROJECTS: lib.root } });
        await new Promise((r) => setTimeout(r, 1500));
        const M = require(main);
        for (const act of [() => M.teamWatch(""), () => M.relaySync(), () => M.checkWaitingSafe()]) { try { await act(); } catch { /* its own */ } }
        await drained();
        return { hits: [...new Set(hits)].sort(), calls: s.calls.length };
      } finally {
        names.forEach((n) => { fs[n] = kept[n]; });
        syncBuiltinESMExports();
        if (s) s.done();
      }
    };
    let ls = null, lw = null;
    try { ls = await launchProbe(MAIN, "real", false); } catch (e) { ls = { threw: String(e && e.stack || e).slice(0, 300) }; }
    check(!!ls && !ls.threw && ls.hits.length === 0 && ls.calls === 0,
      "22f at launch and at each look, a Studio that does not work starts no team watch, follows no team, arms no catalog watch, syncs"
      + " no relay and runs no waiting check: none reads the team record, and the thread is asked nothing: " + JSON.stringify(ls));
    try { lw = await launchProbe(MAIN, "real", true); } catch (e) { lw = { threw: String(e && e.stack || e).slice(0, 300) }; }
    check(!!lw && !lw.threw && FIVE.every((n) => lw.hits.includes(n)),
      "22f2 CONTROL: the same five acts do read the team record on a Studio that works: " + JSON.stringify(lw));

    /* 22g: the page's start names no open project while Studio does not work, and names them while it does. */
    const hostProbe = async (main, tag, works) => {
      const lib = await gateLib("host-" + tag + (works ? "w" : "s"));
      const s = await loadShell("gate-host-" + tag + (works ? "w" : "s"), { works, main, thread: realThread,
        store: { tabs: { open: [{ dir: lib.a, name: "Alpha", rev: 1 }], on: lib.a } }, env: { STUDIO_PROJECTS: lib.root } });
      try { const h = await s.ask("studio:host"); return h && h.tabs && h.tabs.open ? h.tabs.open.length : -1; }
      finally { s.done(); }
    };
    let hs = -2, hw = -2;
    try { hs = await hostProbe(MAIN, "real", false); hw = await hostProbe(MAIN, "real", true); } catch (e) { hs = -3; }
    check(hs === 0 && hw === 1,
      "22g the page's start carries no open project while Studio does not work, and carries them while it does: " + JSON.stringify([hs, hw]));

    /* 22h: EACH GATE LINE TAKEN OUT, ALONE, in a copy of the shell, turns the check that holds it red; the copy is the only thing
       changed, and the line is the one marked plant:s1b-<name>. The two table plants take one channel off the open side. */
    if (PLANTS_OFF) console.log("  NOT RUN 22h, each gate line taken out of a copy turns its check red (ETIUDA_PLANTS=off)");
    else {
      const copy = path.join(SCRATCH, "gate-plant-copy"), copyMain = path.join(copy, "shell", "main.js");
      for (const d of ["shell", "src", "ui", "engine/pinned", "service"]) fs.cpSync(path.join(ROOT, d), path.join(copy, d), { recursive: true });
      fs.copyFileSync(path.join(ROOT, "package.json"), path.join(copy, "package.json"));
      const lineOut = (tag) => {
        const lines = mainNow.split("\n"), hit = lines.filter((l) => l.indexOf("plant:" + tag + " ") >= 0 || l.endsWith("plant:" + tag + " */"));
        return hit.length === 1 ? lines.filter((l) => l !== hit[0]).join("\n") : "";
      };
      const textOut = (from, to) => (mainNow.split(from).length === 2 ? mainNow.replace(from, () => to) : "");
      const planted = async (n, name, text, redIf, what) => {
        let red = false, said = "";
        try {
          if (!text) said = "the anchor did not match once";
          else { fs.writeFileSync(copyMain, text); red = await redIf(); said = red ? "red" : "DID NOT BITE"; }
        } catch (e) { said = "threw " + String(e && e.message).slice(0, 120); }
        check(red, "22h" + n + " PLANT: " + name + " in a copy turns " + what + " red: " + said);
      };
      await planted(1, "the gate line in answer() (plant:s1b-answer) taken out", lineOut("s1b-answer"),
        async () => { const r = await sampleProbe(copyMain, "p1", false); return !(r.served.length === 0 && r.calls === 0 && !r.changed); }, "22b");
      const launchRed = async (tag) => { const r = await launchProbe(copyMain, tag, false); return !(r.hits.length === 0 && r.calls === 0); };
      await planted(2, "the team watch's gate line (plant:s1b-watch) taken out", lineOut("s1b-watch"), () => launchRed("p2"), "22f");
      await planted(3, "the followed team's gate line (plant:s1b-follow) taken out", lineOut("s1b-follow"), () => launchRed("p3"), "22f");
      await planted(4, "the catalog watches' gate line (plant:s1b-catalog) taken out", lineOut("s1b-catalog"), () => launchRed("p4"), "22f");
      await planted(5, "the relay sync's gate line (plant:s1b-relay) taken out", lineOut("s1b-relay"), () => launchRed("p5"), "22f");
      await planted(6, "the waiting check's gate line (plant:s1b-waiting) taken out", lineOut("s1b-waiting"), () => launchRed("p6"), "22f");
      await planted(7, "the open tabs' gate line (plant:s1b-host) taken out", lineOut("s1b-host"),
        async () => (await hostProbe(copyMain, "p7", false)) !== 0, "22g");
      await planted(8, "export-edition off the open side of the table", textOut('"studio:export-pick", "studio:export-edition",', '"studio:export-pick",'),
        async () => (await outProbe(copyMain, "p8")).length > 0, "22d");
      await planted(9, "follow-leave off the open side of the table", textOut('"studio:team-key-move", "studio:seat-free", "studio:follow-leave"]);', '"studio:team-key-move", "studio:seat-free"]);'),
        async () => (await awayProbe(copyMain, "p9")).length > 0, "22e");
      await planted(10, "the refused licence file name left off the answer (plant:lr-file-name)", textOut("file: lic.unusable.file ? path.basename(lic.unusable.file) : null", "file: null"),
        async () => (await LR_PROBE(copyMain, "p10")) !== "etiuda-studio-license.js", "21b");
    }

    for (const n of Object.keys(wireWas)) wireMod[n] = wireWas[n];
  }

  /* ---- 23. ONE STUDIO HOLDS A SHARED PROJECTS FOLDER (Max, 2026-11-22 21:14, by Claude alpha: two Studios working in one shared projects
     folder is retired; src/root-hold.cjs, shell/main.js holdCheck; tests/root-hold.mjs holds the hold itself). A folder that can be shared
     (here a synced one, by its name) another live Studio holds opens nothing in this one, and says one sentence; a stale hold is taken over by
     the first look; one that cannot be read says so naming its file; a folder on the system disk has no hold at all. */
  {
    const OTHER = "Etiuda Studio on {COMPUTER} already has {ROOT} open, and one Studio works in a projects folder at a time, so nothing was opened from it here. Quit Studio on {COMPUTER}, or choose another projects folder, then try again.";
    const TROUBLE = "Studio cannot tell whether another copy has {ROOT} open, because it cannot read or replace {FILE}, so nothing was opened from it. Once that file is deleted, try again.";
    const HOLD = ".etiuda-studio-hold";
    const realThread = (verb, ...a) => typeof Studio[verb] === "function" ? Studio[verb](...a) : Promise.resolve({ verb });
    const held = (id) => JSON.stringify({ kind: "etiuda-studio-hold", id: id || "another", pid: 4242, host: "another-computer",
      since: new Date().toISOString(), beat: new Date().toISOString() }) + "\n";
    const shared = (name) => { const d = path.join(SCRATCH, "OneDrive", name); fs.mkdirSync(d, { recursive: true }); return d; };
    const shell = (name, root, env) => loadShell(name, { env: Object.assign({ STUDIO_PROJECTS: root }, env || {}), thread: realThread });
    const reads = (s) => s.calls.map((c) => c[0]).filter((v) => v === "listProjects" || v === "newProject" || v === "openProject");

    const rootA = shared("held-by-another"), fileA = path.join(rootA, HOLD);
    fs.writeFileSync(fileA, held());
    const was = fs.readFileSync(fileA);
    const sA = await shell("hold-other", rootA);
    const listed = await sA.ask("studio:projects");
    const made = await sA.ask("studio:new", "Nothing here", null, {});
    const opened = await sA.ask("studio:open", path.join(rootA, "Any catalog"));
    check(listed && listed.error && listed.said && listed.said.frame === OTHER && listed.said.vars.ROOT === rootA && !Array.isArray(listed.projects)
          && made && made.said && made.said.frame === OTHER && opened && opened.said && opened.said.frame === OTHER
          && reads(sA).length === 0 && Buffer.compare(was, fs.readFileSync(fileA)) === 0 && fs.readdirSync(rootA).join() === HOLD,
      "23a a shared projects folder another live Studio holds opens nothing here: the list, a new catalog and an open all answer the one sentence,"
      + " no verb reaches the disk, the other's hold is as it was and nothing else is in the folder: " + JSON.stringify({ listed: listed && listed.error,
        verbs: reads(sA), entries: fs.readdirSync(rootA) }));

    const rootB = shared("hold-left-by-a-dead-one"), fileB = path.join(rootB, HOLD);
    fs.writeFileSync(fileB, held("dead"));
    const old = new Date(Date.now() - 10 * 60 * 1000);
    fs.utimesSync(fileB, old, old);
    const sB = await shell("hold-stale", rootB);
    const took = await sB.ask("studio:projects");
    const mineNow = JSON.parse(fs.readFileSync(fileB, "utf8"));
    check(took && !took.error && Array.isArray(took.projects) && mineNow.id !== "dead" && mineNow.pid === process.pid,
      "23b a hold nobody has refreshed for ten minutes is taken over by the first look, with no step by anyone, and the list is served: "
      + JSON.stringify({ error: took && took.error, holder: mineNow.pid === process.pid ? "this Studio" : mineNow }));

    const rootC = shared("hold-unreadable"), fileC = path.join(rootC, HOLD);
    fs.mkdirSync(fileC);
    fs.writeFileSync(path.join(fileC, "inside"), "x");
    const sC = await shell("hold-trouble", rootC);
    const stuck = await sC.ask("studio:projects");
    check(stuck && stuck.said && stuck.said.frame === TROUBLE && stuck.said.vars.FILE === fileC && stuck.said.vars.ROOT === rootC
          && reads(sC).length === 0 && fs.existsSync(path.join(fileC, "inside")),
      "23c a hold that cannot be read is said as that, naming its file, and not as another Studio: " + JSON.stringify(stuck && stuck.said));

    const local = path.join(SCRATCH, "local-projects");
    fs.mkdirSync(local, { recursive: true });
    const sD = await shell("hold-local", local);
    const here = await sD.ask("studio:projects");
    check(here && !here.error && Array.isArray(here.projects) && fs.readdirSync(local).length === 0,
      "23d a projects folder on the system disk has no hold: it is listed and nothing is written into it: " + JSON.stringify(fs.readdirSync(local)));

    const rootE = shared("chosen-held"), fileE = path.join(rootE, HOLD);
    fs.writeFileSync(fileE, held());
    const sE = await shell("hold-pick", local, { STUDIO_TEST_ROOT: rootE });
    const picked = await sE.ask("studio:pick-root", "Projects folder");
    const kept = fs.existsSync(storeOfName("hold-pick")) ? JSON.parse(fs.readFileSync(storeOfName("hold-pick"), "utf8")) : {};
    check(picked && picked.said && picked.said.frame === OTHER && picked.said.vars.ROOT === rootE && !("root" in kept),
      "23e choosing a folder another live Studio holds is refused with the sentence and the projects folder stays what it was: " + JSON.stringify({ error: picked && picked.error, root: kept.root }));

    const pl = (await import("./page-stand-in.mjs")).loadPage({ api: {}, uiLang: "pl" }).page;
    check(pl.T(OTHER) !== OTHER && pl.T(TROUBLE) !== TROUBLE,
      "23f both sentences have a Polish line (the other form, for the same computer, is 24b)");
  }

  /* ---- 24. THE HOLD BELONGS TO A STUDIO SOMEONE IS EDITING IN, never to one merely running (Claude alpha, 2026-11-22 22:46; the test
     architect's re-read of 22:35, B1 and D1; src/root-hold.cjs, shell/main.js holdCheck, goAway, windowShown). A Studio that hides to the tray
     asks its page to send what waits, then lets go; a Studio started hidden takes none; showing the window takes it again, and a Studio that
     finds another holding says so on the page. A refusal by the hold is marked as the disk's, so what was typed is kept. The beat goes on
     whatever the last look met. Nothing in the projects folder is written from a hidden Studio's background. The two forms of the sentence
     name the computer that holds the folder. */
  {
    const HOLD = ".etiuda-studio-hold";
    const AT = "Etiuda Studio on {COMPUTER} already has {ROOT} open, and one Studio works in a projects folder at a time, so nothing was opened from it here. Quit Studio on {COMPUTER}, or choose another projects folder, then try again.";
    const SAME = "Another copy of Etiuda Studio on this computer already has {ROOT} open, and one Studio works in a projects folder at a time, so nothing was opened from it here. Quit that copy, or choose another projects folder, then try again.";
    const TROUBLE = "Studio cannot tell whether another copy has {ROOT} open, because it cannot read or replace {FILE}, so nothing was opened from it. Once that file is deleted, try again.";
    const realThread = (verb, ...a) => typeof Studio[verb] === "function" ? Studio[verb](...a) : Promise.resolve({ verb });
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const held = (o) => JSON.stringify(Object.assign({ kind: "etiuda-studio-hold", id: "another", pid: 4242, host: "another-computer",
      since: new Date().toISOString(), beat: new Date().toISOString() }, o || {})) + "\n";
    const synced = (name) => { const d = path.join(SCRATCH, "OneDrive", name); fs.mkdirSync(d, { recursive: true }); return d; };
    const holdOf = (root) => { try { return JSON.parse(fs.readFileSync(path.join(root, HOLD), "utf8")); } catch { return null; } };
    const shell = (name, root, o) => {
      const opts = Object.assign({ thread: realThread }, o || {});
      opts.env = Object.assign({ STUDIO_PROJECTS: root }, (o && o.env) || {});
      return loadShell(name, opts);
    };
    const ev = () => ({ prevented: false, preventDefault() { this.prevented = true; } });
    const listed = (r) => !!r && !r.error && Array.isArray(r.projects);

    /* 24a to 24c: the sentence names the computer that holds the folder, in two forms, and is marked as the disk's. */
    const probeNames = async (main, tag) => {
      const out = { at: null, same: null, trouble: null, saved: null };
      const root = synced(tag + "-at");
      fs.writeFileSync(path.join(root, HOLD), held({ host: "DESK-OF-ANA" }));
      let s = await shell(tag + "-at", root, { main });
      try {
        out.at = await s.ask("studio:projects");
        out.saved = await s.ask("studio:save-card", path.join(root, "Any"), "c1", { body: { en: "x" } });
      } finally { s.done(); }
      const sleeper = require("node:child_process").spawn(process.execPath, ["-e", "setTimeout(function () {}, 60000)"], { stdio: "ignore", windowsHide: true });
      try {
        const root2 = synced(tag + "-same");
        fs.writeFileSync(path.join(root2, HOLD), held({ host: os.hostname(), pid: sleeper.pid }));
        s = await shell(tag + "-same", root2, { main });
        try { out.same = await s.ask("studio:projects"); } finally { s.done(); }
      } finally { try { sleeper.kill(); } catch { /* gone */ } }
      const root3 = synced(tag + "-trouble");
      fs.mkdirSync(path.join(root3, HOLD));
      s = await shell(tag + "-trouble", root3, { main });
      try { out.trouble = await s.ask("studio:projects"); } finally { s.done(); }
      return out;
    };
    const names = await probeNames(MAIN, "s24-names");
    check(names.at && names.at.said && names.at.said.frame === AT && names.at.said.vars.COMPUTER === "DESK-OF-ANA" && names.at.said.vars.ROOT
          && names.same && names.same.said && names.same.said.frame === SAME && !("COMPUTER" in names.same.said.vars) && names.same.said.vars.ROOT,
      "24a the sentence names the computer that holds the folder, and says this computer where it is this one: " + JSON.stringify({ at: names.at && names.at.said, same: names.same && names.same.said }));
    const pl = (await import("./page-stand-in.mjs")).loadPage({ api: {}, uiLang: "pl" }).page;
    check(pl.T(AT) !== AT && /\{COMPUTER\}/.test(pl.T(AT)) && /\{ROOT\}/.test(pl.T(AT)) && pl.T(SAME) !== SAME && /\{ROOT\}/.test(pl.T(SAME))
          && ![AT, SAME, pl.T(AT), pl.T(SAME)].some((t) => /tray|zasobnik|ikon/i.test(t)),
      "24b both forms have a Polish line that keeps its places, and neither sends anyone to a tray icon (a holder always has a window): " + JSON.stringify([pl.T(AT).slice(0, 40), pl.T(SAME).slice(0, 40)]));
    check(names.at.disk === true && names.same.disk === true && names.trouble && names.trouble.said && names.trouble.said.frame === TROUBLE && names.trouble.disk === true
          && names.saved && names.saved.disk === true,
      "24c a refusal by the hold is marked as the disk's (a laptop that slept past 45 s and finds another Studio holding): what is typed after waking is kept, never dropped: "
      + JSON.stringify({ at: names.at.disk, same: names.same.disk, trouble: names.trouble && names.trouble.disk, saved: names.saved && names.saved.disk }));

    /* 24d to 24f: hiding to the tray, and showing again. */
    const probeHide = async (main, tag) => {
      const seq = [], shownSrcs = [], root = synced(tag);
      const page = async (src) => {
        if (/STUDIO_HOLD\.flush/.test(src)) { seq.push("flush"); await sleep(150); seq.push(holdOf(root) ? "held-at-flush-end" : "free-at-flush-end"); }
        else if (/STUDIO_HOLD\.shown/.test(src)) { seq.push("shown"); shownSrcs.push(src); }
        return true;
      };
      const s = await shell(tag, root, { main, tray: true, page });
      const out = { seq, shownSrcs };
      try {
        out.first = await s.ask("studio:projects");
        out.heldFirst = !!holdOf(root);
        const e = ev();
        await s.fire("winOn", "close", e);
        out.prevented = e.prevented; out.hid = s.win.log.indexOf("hide") >= 0;
        await sleep(500);
        out.letGo = holdOf(root) === null;
        out.blocksAway = typeof s.mod.holdBlocks === "function" ? s.mod.holdBlocks(root) : null;
        const away = await s.ask("studio:projects");
        out.awayServed = listed(away);
        out.stillFree = holdOf(root) === null;
        s.win.show(); await sleep(100);
        out.taken = !!holdOf(root) && holdOf(root).pid === process.pid;
        out.blocksShown = typeof s.mod.holdBlocks === "function" ? s.mod.holdBlocks(root) : null;
        /* hide again; another Studio takes the folder while this one is away; showing finds it and tells the page */
        await s.fire("winOn", "close", ev());
        await sleep(500);
        fs.writeFileSync(path.join(root, HOLD), held({ host: "DESK-OF-ANA" }));
        s.win.show(); await sleep(100);
        out.refusedAfter = await s.ask("studio:projects");
        out.blocksOther = typeof s.mod.holdBlocks === "function" ? s.mod.holdBlocks(root) : null;
        out.theirsIntact = (holdOf(root) || {}).host === "DESK-OF-ANA";
      } finally { s.done(); }
      return out;
    };
    const hid = await probeHide(MAIN, "s24-hide");
    const order = hid.seq.join(",");
    check(hid.first && listed(hid.first) && hid.heldFirst && hid.prevented && hid.hid && /^flush,held-at-flush-end/.test(order) && hid.letGo,
      "24d a Studio hiding to the tray sends what waits first (the page is asked, and the hold is still held while it answers), then lets go of the folder: " + JSON.stringify(hid));
    check(hid.awayServed && hid.stillFree && hid.blocksAway === true,
      "24e a Studio out of sight takes no hold again for what its page asks (the list is served, nothing is written), and what it would write on its own waits (holdBlocks): " + JSON.stringify({ awayServed: hid.awayServed, stillFree: hid.stillFree, blocks: hid.blocksAway }));
    check(hid.taken && hid.blocksShown === false && /shown/.test(order) && hid.refusedAfter && hid.refusedAfter.said && hid.refusedAfter.said.frame === AT
          && hid.blocksOther === true && hid.theirsIntact && hid.seq.filter((x) => x === "shown").length === 2,
      "24f showing the window takes the hold again and tells the page; where another Studio took the folder meanwhile it is refused, the other's hold untouched, and the page is told so it reads the folder again: " + JSON.stringify(hid));

    check(hid.shownSrcs.length === 2 && !/error/.test(hid.shownSrcs[0]) && /DESK-OF-ANA/.test(hid.shownSrcs[1]) && /"disk":true/.test(hid.shownSrcs[1]),
      "24q a window shown after another Studio took the folder tells the page the refusal at once (the sentence and its mark), so an open catalog says so and is not left editable; shown with the hold taken, it tells nothing of the kind: " + JSON.stringify(hid.shownSrcs));

    /* 24g: the window shown again while the page is still sending keeps the hold. */
    const probeBack = async (main, tag) => {
      const root = synced(tag);
      const page = async (src) => { if (/STUDIO_HOLD\.flush/.test(src)) await sleep(250); return true; };
      const s = await shell(tag, root, { main, tray: true, page });
      try {
        await s.ask("studio:projects");
        await s.fire("winOn", "close", ev());
        await sleep(60);
        s.win.show();
        await sleep(600);
        return { held: !!holdOf(root) && holdOf(root).pid === process.pid };
      } finally { s.done(); }
    };
    const back = await probeBack(MAIN, "s24-back");
    check(back.held, "24g the person brings the window back while the page is still sending: the hold is kept, not let go behind them: " + JSON.stringify(back));

    /* 24r: a quit from the tray that the page holds back (a close it holds once) is cancelled with the window hidden: the window is shown
       and the quit forgotten, so the Studio is not left half quitting with no one to see why, taking the hold again for what it lands on its own. */
    const trayItem = (s, re) => { const m = s.menus[s.menus.length - 1]; return m && m.items.find((i) => re.test(String(i.label))); };
    const probeQuit = async (main, tag) => {
      const root = synced(tag);
      const s = await shell(tag, root, { main, tray: true, page: async () => true });
      const out = {};
      try {
        await s.ask("studio:projects");
        await s.fire("winOn", "close", ev());
        await sleep(400);
        const quit = trayItem(s, /^Quit/i);
        if (quit) quit.click();
        const wasShown = s.win.log.filter((x) => x === "show").length;
        const hold = (s.win.wcOn["will-prevent-unload"] || []);
        const e = ev();
        hold.forEach((fn) => fn(e));
        await sleep(200);
        out.handler = hold.length > 0;
        out.shown = s.win.log.filter((x) => x === "show").length - wasShown;
        out.forced = e.prevented;
        out.held = !!holdOf(root);
        await s.fire("winOn", "close", ev());
        await sleep(400);
        out.awayAgain = typeof s.mod.holdBlocks === "function" ? s.mod.holdBlocks(root) : null;
        out.letGo = holdOf(root) === null;
      } finally { s.done(); }
      return out;
    };
    const quitOut = await probeQuit(MAIN, "s24-quit");
    check(quitOut.handler && quitOut.shown === 1 && quitOut.forced === false && quitOut.held && quitOut.awayAgain === true && quitOut.letGo,
      "24r a quit from the tray that the page holds back shows the window and is forgotten (the close is not forced), so hiding the Studio again lets go of the folder: " + JSON.stringify(quitOut));

    /* 24s: a start hidden whose window was last maximised is shown by maximising it, and Electron is not known to fire 'show' for that. */
    const probeMax = async (main, tag) => {
      const root = synced(tag);
      const s = await shell(tag, root, { main, tray: true, page: async () => true, argv: ["--hidden"] });
      try {
        await s.ask("studio:projects");
        s.win.studioMaximizeOnShow = true;
        const open = trayItem(s, /^Open/i);
        if (open) open.click();
        await sleep(200);
        return { maximized: s.win.log.indexOf("maximize") >= 0, taken: !!holdOf(root) && holdOf(root).pid === process.pid };
      } finally { s.done(); }
    };
    const maxed = await probeMax(MAIN, "s24-max");
    check(maxed.maximized && maxed.taken,
      "24s a Studio started hidden and shown by the tray in its maximised place takes the hold whether or not Electron fires 'show' for the maximise: " + JSON.stringify(maxed));

    /* 24h: a start with Windows shows no window and takes no hold. */
    const probeHidden = async (main, tag) => {
      const root = synced(tag);
      const s = await shell(tag, root, { main, tray: true, page: async () => true, argv: ["--hidden"] });
      try {
        const list = await s.ask("studio:projects");
        const open = await s.ask("studio:open", path.join(root, "Anything"));
        const out = { listed: listed(list), none: holdOf(root) === null, openAnswered: !!open && !(open.said && open.said.frame === AT) };
        s.win.show(); await sleep(100);
        out.takenOnShow = !!holdOf(root) && holdOf(root).pid === process.pid;
        return out;
      } finally { s.done(); }
    };
    const hidden = await probeHidden(MAIN, "s24-hidden");
    check(hidden.listed && hidden.none && hidden.takenOnShow,
      "24h a Studio started hidden (a start with Windows) lists its folder and takes no hold; it takes it when its window is shown: " + JSON.stringify(hidden));

    /* 24i: the beat goes on whatever the last look met. */
    const probeBeat = async (main, tag) => {
      const out = {};
      /* One Studio at a time: the shell reads its folder from the environment the load set. */
      const root = path.join(synced(tag), "later");
      let s = await shell(tag, root, { main, env: { STUDIO_HOLD_BEAT_MS: "100" } });
      try {
        await s.ask("studio:projects");
        fs.mkdirSync(root, { recursive: true });
        await sleep(900);
        out.free = !!holdOf(root) && holdOf(root).pid === process.pid;
      } finally { s.done(); }
      const jam = path.join(synced(tag + "-jam"), "x");
      fs.mkdirSync(path.join(jam, HOLD), { recursive: true });
      s = await shell(tag + "-jam", jam, { main, env: { STUDIO_HOLD_BEAT_MS: "100" } });
      try {
        await s.ask("studio:projects");
        fs.rmdirSync(path.join(jam, HOLD));
        await sleep(900);
        out.trouble = !!holdOf(jam) && holdOf(jam).pid === process.pid;
      } finally { s.done(); }
      return out;
    };
    const beat = await probeBeat(MAIN, "s24-beat");
    check(beat.free && beat.trouble,
      "24i a beat that met a folder not there, or a hold it could not read, goes on: the folder is held again once it is there, with no verb asked (a share dropping on Wi-Fi, a wake before the network is back): " + JSON.stringify(beat));

    /* 24j: two verbs that took a raw path now go through the folder check and the hold. */
    const probeDirect = async (main, tag) => {
      const root = synced(tag);
      fs.writeFileSync(path.join(root, HOLD), held({ host: "DESK-OF-ANA" }));
      let s = await shell(tag, root, { main });
      const out = {};
      try {
        out.left = await s.ask("studio:finding-left", path.join(root, "Any"), "c1", "why", null);
        out.dismiss = await s.ask("studio:number-dismiss", path.join(root, "Any"), "c1", "k", "1");
        out.reached = s.calls.map((c) => c[0]).filter((v) => v === "leaveFinding" || v === "dismissChangedNumber");
      } finally { s.done(); }
      const local = path.join(SCRATCH, tag + "-local"); fs.mkdirSync(local, { recursive: true });
      s = await shell(tag + "-local", local, { main });
      try {
        out.outside = await s.ask("studio:finding-left", path.join(SCRATCH, "elsewhere"), "c1", "why", null);
        out.reachedOutside = s.calls.map((c) => c[0]).filter((v) => v === "leaveFinding");
      } finally { s.done(); }
      return out;
    };
    const direct = await probeDirect(MAIN, "s24-direct");
    const OUT = "That catalog is not one Studio lists.";
    check(direct.left && direct.left.said && direct.left.said.frame === AT && direct.dismiss && direct.dismiss.said && direct.dismiss.said.frame === AT && direct.reached.length === 0
          && direct.outside && direct.outside.said && direct.outside.said.frame === OUT && direct.reachedOutside.length === 0,
      "24j a finding left as it is and a changed number dismissed reach the project only through the folder check and the hold: a held folder and a folder outside the list are refused, and the thread is asked nothing: " + JSON.stringify(direct));

    /* 24k: what a hidden Studio would write on its own into the projects folder waits for the hold. */
    const mainText = fs.readFileSync(MAIN, "utf8");
    const shapeOf = (text) => {
      const bodyOf = (name) => { const at = text.indexOf("async function " + name + "("); const end = text.indexOf(String.fromCharCode(10) + "}" + String.fromCharCode(10), at); return at < 0 || end < 0 ? "" : text.slice(at, end); };
      const before = (body, x, y) => body.indexOf(x) >= 0 && body.indexOf(y) > body.indexOf(x);
      const land = bodyOf("landDue"), resume = bodyOf("resumeHandover");
      return { land: before(land, "holdBlocks(", "landCatalog("), resume: before(resume, "holdBlocks(", '"handoverTeam"') };
    };
    const shape = shapeOf(mainText);
    check(shape.land,
      "24k a catalog answer is landed in the projects folder only after the hold is asked (holdBlocks): a hidden Studio, and one another Studio holds the folder from, leave it due for the next look: " + JSON.stringify(shape));

    /* 24o and 24p: a lead's interrupted key handover writes the new lead key into the project.json of the team's catalogs (step iii), so a
       Studio out of sight, or one another Studio holds the folder from, does not finish it: it waits, and is resumed when the hold is taken
       again (the window shown) or at the next look of the watch. Losing a colleague's publish outranks a handover waiting for the window. */
    check(shape.resume,
      "24o the resume of an interrupted key handover asks the hold (holdBlocks) before its step (iii) writes into the projects folder: " + JSON.stringify(shape));
    const handover = { team: "t-0123456789abcdef", step: "(iii)", kind: "relay", t: Date.now() };
    const probeResume = async (main, tag) => {
      const out = {};
      const root = synced(tag);
      let s = await shell(tag, root, { main, tray: true, page: async () => true, argv: ["--hidden"], store: { handover } });
      try {
        await s.ask("studio:projects");
        const f = s.mod.resumeWhenHeld, last = s.mod.resumeLastNow;
        out.away = typeof f === "function" ? f() : null;
        s.win.show(); await sleep(200);
        out.shown = typeof last === "function" ? last() : null;
      } finally { s.done(); }
      /* the folder held by another Studio when the resume is first asked, free again at the next look of the watch */
      const root2 = synced(tag + "-look");
      fs.writeFileSync(path.join(root2, HOLD), held({ host: "DESK-OF-ANA" }));
      s = await shell(tag + "-look", root2, { main, tray: true, page: async () => true, store: { handover } });
      try {
        await s.ask("studio:projects");
        await s.mod.watchOnce("");
        out.before = typeof s.mod.resumeLastNow === "function" ? s.mod.resumeLastNow() : null;
        out.owed = typeof s.mod.resumeWhenHeld === "function" ? s.mod.resumeWhenHeld() : null;
        fs.unlinkSync(path.join(root2, HOLD));
        await sleep(2300);
        await s.mod.watchOnce("");
        out.look = typeof s.mod.resumeLastNow === "function" ? s.mod.resumeLastNow() : null;
      } finally { s.done(); }
      return out;
    };
    const resume = await probeResume(MAIN, "s24-resume");
    check(resume.away === "waiting" && resume.shown === "ran" && resume.owed === "waiting" && resume.look === "ran",
      "24p an interrupted key handover waits while the Studio is out of sight, is resumed when its window is shown (the hold taken again), and is resumed at the next look of the watch once the folder is held: " + JSON.stringify(resume));

    /* 24m: a Studio hiding to the tray waits for a verb still writing (a publish in flight, a rename) before it lets go. */
    const probeInflight = async (main, tag) => {
      const root = synced(tag);
      let slow = false;
      const s = await shell(tag, root, { main, tray: true, page: async () => true,
        thread: (verb, ...a) => (verb === "listProjects" && slow ? sleep(700).then(() => realThread(verb, ...a)) : realThread(verb, ...a)) });
      try {
        await s.ask("studio:projects");
        slow = true;
        const running = s.ask("studio:projects");
        await sleep(50);
        await s.fire("winOn", "close", ev());
        await sleep(350);
        const during = !!holdOf(root);
        await running;
        await sleep(450);
        return { during, after: holdOf(root) === null };
      } finally { s.done(); }
    };
    const inflight = await probeInflight(MAIN, "s24-inflight");
    check(inflight.during && inflight.after,
      "24m a Studio hiding to the tray keeps the folder while a verb is still writing into it, and lets go once it has answered: " + JSON.stringify(inflight));

    /* 24n: a Studio out of sight opens what its page restores without stamping it (the open is a write into the project). */
    const probeQuiet = async (main, tag) => {
      const root = synced(tag);
      const made = await Studio.newProject(root, "Quiet one", [{ code: "en" }]);
      const pj = path.join(made.dir, "project.json");
      const s = await shell(tag, root, { main, tray: true, page: async () => true, argv: ["--hidden"] });
      try {
        const was = fs.readFileSync(pj);
        const away = await s.ask("studio:open", made.dir);
        const unchanged = Buffer.compare(was, fs.readFileSync(pj)) === 0;
        s.win.show(); await sleep(100);
        const shown = await s.ask("studio:open", made.dir);
        return { opened: !!away && !away.error && !!shown && !shown.error, unchanged, stampedWhenShown: Buffer.compare(was, fs.readFileSync(pj)) !== 0 };
      } finally { s.done(); }
    };
    const quiet = await probeQuiet(MAIN, "s24-quiet");
    check(quiet.opened && quiet.unchanged && quiet.stampedWhenShown,
      "24n a Studio started hidden opens the project its page restores without writing the opened stamp into it, and stamps it once the window is shown: " + JSON.stringify(quiet));

    /* 24l: EACH DECIDING LINE TAKEN OUT, ALONE, in a copy of the shell, turns its check red. */
    if (PLANTS_OFF) console.log("  NOT RUN 24l, each line of the hold's lifecycle taken out of a copy turns its check red (ETIUDA_PLANTS=off)");
    else {
      const copy = path.join(SCRATCH, "hold-plant-copy"), copyMain = path.join(copy, "shell", "main.js");
      for (const d of ["shell", "src", "ui", "engine/pinned", "service"]) fs.cpSync(path.join(ROOT, d), path.join(copy, d), { recursive: true });
      fs.copyFileSync(path.join(ROOT, "package.json"), path.join(copy, "package.json"));
      const lineAs = (tag, to) => {
        const lines = mainText.split("\n"), hit = lines.filter((l) => l.indexOf("plant:" + tag + " ") >= 0 || l.endsWith("plant:" + tag + " */"));
        return hit.length === 1 ? lines.map((l) => (l === hit[0] ? to : l)).join("\n") : "";
      };
      const planted = async (n, tag, to, redIf, what) => {
        let red = false, said = "";
        try {
          const text = lineAs(tag, to);
          if (!text) said = "the anchor did not match once";
          else { fs.writeFileSync(copyMain, text); red = await redIf(); said = red ? "red" : "DID NOT BITE"; }
        } catch (e) { said = "threw " + String(e && e.message).slice(0, 120); }
        check(red, "24l" + n + " PLANT: " + tag + " taken out of a copy turns " + what + " red: " + said);
      };
      await planted(1, "hold-away", "", async () => { const r = await probeHide(copyMain, "p1"); return !r.letGo; }, "24d");
      await planted(2, "hold-flush", "", async () => { const r = await probeHide(copyMain, "p2"); return !/^flush,held-at-flush-end/.test(r.seq.join(",")); }, "24d");
      await planted(3, "hold-quiet", "", async () => { const r = await probeHide(copyMain, "p3"); return !r.stillFree || !r.awayServed; }, "24e");
      await planted(4, "hold-shown", "", async () => { const r = await probeHide(copyMain, "p4"); return !r.taken; }, "24f");
      await planted(5, "hold-kept", "", async () => { const r = await probeBack(copyMain, "p5"); return !r.held; }, "24g");
      await planted(6, "hold-disk", "", async () => { const r = await probeNames(copyMain, "p6"); return !(r.at && r.at.disk === true); }, "24c");
      await planted(7, "hold-beat", "    if (r.state === \"mine\" && !timer) {", async () => { const r = await probeBeat(copyMain, "p7"); return !(r.free && r.trouble); }, "24i");
      await planted(8, "hold-direct", '  return thread.call("leaveFinding", String(dir || ""), String(id || ""), String(why || ""), reason == null ? null : String(reason));',
        async () => { const r = await probeDirect(copyMain, "p8"); return !(r.left && r.left.said && r.left.said.frame === AT && r.reached.length === 0); }, "24j");
      await planted(9, "hold-land", "", async () => { const s2 = shapeOf(fs.readFileSync(copyMain, "utf8")); return !s2.land; }, "24k");
      await planted(10, "hold-inflight", "", async () => { const r = await probeInflight(copyMain, "p10"); return !r.during; }, "24m");
      await planted(12, "hold-resume", "", async () => { const s2 = shapeOf(fs.readFileSync(copyMain, "utf8")); return !s2.resume; }, "24o");
      await planted(13, "hold-resume-shown", "", async () => { const r = await probeResume(copyMain, "p13"); return r.shown !== "ran"; }, "24p");
      await planted(14, "hold-resume-look", "", async () => { const r = await probeResume(copyMain, "p14"); return r.look !== "ran"; }, "24p");
      await planted(15, "hold-quit-reset", "", async () => { const r = await probeQuit(copyMain, "p15"); return !(r.shown === 1 && r.awayAgain === true); }, "24r");
      await planted(16, "hold-max-shown", "", async () => { const r = await probeMax(copyMain, "p16"); return !r.taken; }, "24s");
      await planted(17, "hold-shown-arg", "  askPage(win, \"shown\", HIDE_WAIT_MS).catch(() => {});", async () => { const r = await probeHide(copyMain, "p17"); return !(r.shownSrcs.length === 2 && /DESK-OF-ANA/.test(r.shownSrcs[1])); }, "24q");
      await planted(11, "hold-nostamp-shell", '  return thread.call("openProject", home, withHere());', async () => { const r = await probeQuiet(copyMain, "p11"); return !r.unchanged; }, "24n");
    }
  }

  dropScratch(SCRATCH, "tests/shell-guards.mjs");
  check(asserted + skipped + 1 === EXPECTED, "9 every leg ran: " + (asserted + 1) + " of " + EXPECTED + " assertion(s)"
    + (skipped ? ", " + skipped + " said SKIP for this machine's reason" : ""));
  /* No #counts line, for tests/release.mjs's reason: this runs inside npm test, one result line. */
  process.stdout.write("shell-guards: " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main().catch(e => {
  process.stderr.write("  FAIL tests/shell-guards.mjs threw: " + (e && e.stack || e) + "\n");
  process.exit(1);
});
