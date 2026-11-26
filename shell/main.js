"use strict";
/* STUDIO'S SHELL. One frameless window, the band as its top bar, the material behind it.
 *
 * THE PATTERN IS THE ENGINE'S AND IT IS REIMPLEMENTED, NOT COPIED. Studio may not carry a copy
 * of the engine's source (CLAUDE.md), so what is shared here is the construction and not the
 * file: frame:false rather than titleBarStyle "hidden" with an overlay, because the overlay is
 * drawn by the system on top of the page and a backdrop shows only where the window leaves
 * pixels unpainted, so an overlay is an opaque rectangle in the band's right corner whatever
 * colour it is given; backgroundColor "#00000000" so the band's strip really is unpainted;
 * backgroundMaterial "acrylic" asked for only above Windows build 22621, because below it
 * DwmSetWindowAttribute ignores the request silently and the page would leave a hole in the
 * band for nothing to fill. Acrylic and not Mica: Mica is a desktop-wallpaper material for a
 * window that fills the screen and never moves, and the band is a strip.
 *
 * WHAT THE CUSTOMER WRITES STAYS IN THE COMPANY (CLAUDE.md): every handler below is a file on this
 * disk, and the only folders it will touch are the ones the person at the desk chose. Any
 * connection goes through src/wire.cjs, and none carries customer content.
 */
const { app, BrowserWindow, Menu, Notification, Tray, clipboard, dialog, nativeImage, nativeTheme, safeStorage, screen, session, shell } = require("electron");

/* AN INSTALLED STUDIO is one loaded from inside app.asar, as src/licence.mjs decides it. It opens no
 * debugging endpoint, and every variable read through testOnly() below is ignored there. The three
 * read directly (STUDIO_GATE, STUDIO_TEST_OFFSCREEN, STUDIO_LANG) change how the
 * window shows, never where it reads or writes; STUDIO_GATE=keyring alone, and on
 * Linux alone, makes a signing key in the profile it runs with, as Make a signing key does.
 * tests/shell-guards.mjs 6 holds both halves. src/wire.cjs repeats this test, the app.asar pattern, for
 * ETIUDA_LICENCE_ORIGIN and for ETIUDA_RELAY_ORIGIN (it cannot require this file); a change to one is made
 * to the other, and tests/licence-studio.mjs ls13c holds wire.cjs's copy of the licence override. */
const PACKAGED = /[\\/]app\.asar([\\/]|$)/i.test(__dirname);
const testOnly = name => (PACKAGED ? "" : String(process.env[name] || ""));
/* A harness with no relay to reach counts a relay team's catch-up as run, and the move a Remove writes as held by the relay, so a
   Remove there goes ahead in step, and stands (the service is told of it), rather than waiting (the sign-in legs of Remove on a
   relay team, written before removals waited). The value "race" counts the catch-up as run and leaves the move not held, as a
   removal refused as a fork is, for the leg that reads what a waiting removal does not tell the service (si128). Read at the shell's
   start; never in a packaged Studio. */
const RELAY_TEST = testOnly("STUDIO_TEST_RELAY_CAUGHT_UP");
const RELAY_CAUGHT_UP_TEST = RELAY_TEST === "1" || RELAY_TEST === "race", RELAY_HELD_TEST = RELAY_TEST === "1";
/* THE SIGN-IN PREVIEW, read here once and never from the page; an installed Studio takes it too, since tools/signin-preview.cmd
   starts the installed one. It changes only what is drawn while no provider has a client id (signInOffer). */
const SIGNIN_PREVIEW_ASKED = process.env.ETIUDA_SIGNIN_PREVIEW === "1";
/* THE SIGN-IN TRACE, read here once and never from the page, an installed Studio included: under ETIUDA_SIGNIN_TRACE=1 each sign-in
   and renewal step writes one line to this process's standard error (src/licence-client.mjs traceLine), and nowhere else. */
const SIGNIN_TRACE_ASKED = process.env.ETIUDA_SIGNIN_TRACE === "1"; /* plant:st-trace-asked */
if (PACKAGED) for (const s of ["remote-debugging-port", "remote-debugging-pipe"]) {
  if (!app.commandLine.hasSwitch(s)) continue;
  app.commandLine.removeSwitch(s);
  process.stderr.write("studio  --" + s + " is not taken by an installed Studio\n");
}

if (testOnly("STUDIO_NET_LOG")) {
  app.commandLine.appendSwitch("log-net-log", testOnly("STUDIO_NET_LOG"));
}

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { pathToFileURL } = require("node:url");
const { AsyncLocalStorage } = require("node:async_hooks");

const ROOT = path.resolve(__dirname, "..");

/* Google's client secret, where the package step put one beside the asar: read here once, at start, installed only. */
const SIGNIN_SECRET_FILE = "signin-secret.json";
const SIGNIN_SECRET_SHAPE = /^[\x21-\x7e]{8,200}$/;
let signinPacked = Object.freeze({});
function signinSecretRead(text) {
  let d = null;
  try { d = JSON.parse(String(text)); } catch { d = null; }
  const v = d && typeof d === "object" && !Array.isArray(d) && d.format === 1 ? d.google : undefined;
  return Object.freeze(typeof v === "string" && SIGNIN_SECRET_SHAPE.test(v) ? { google: v } : {});
}
if (PACKAGED) { try { signinPacked = signinSecretRead(fs.readFileSync(path.join(String(process.resourcesPath || ""), SIGNIN_SECRET_FILE), "utf8")); } catch { /* none packaged: every byte as before */ } }
/* A development Studio takes it from ETIUDA_GOOGLE_CLIENT_SECRET at start instead (src/signin-lab.cjs devGoogleSecret), so Google can
   be signed in with from a tree; an installed one never reads the variable. */
else { const lab = require(path.join(ROOT, "src", "signin-lab.cjs")); const g = lab.devGoogleSecret(process.env, lab.PACKAGED, SIGNIN_SECRET_SHAPE); if (g) signinPacked = g; }
const { writeWhole, renamePatiently, OWNER_ONLY } = require(path.join(ROOT, "src", "whole-write.cjs"));
const RootHold = require(path.join(ROOT, "src", "root-hold.cjs"));
const Saved = require(path.join(ROOT, "src", "saved-format.cjs"));
const thread = require(path.join(ROOT, "src", "studio-thread.cjs"));
const { roomFor } = require(path.join(ROOT, "src", "window-size.cjs"));
const { windowFile, readWindowPlace, saveWindowPlace, maximizedArea } = require(path.join(ROOT, "src", "window-place.cjs"));
const { ownFrame } = require(path.join(ROOT, "src", "own-frame.cjs"));
const { watchPage } = require("../engine/pinned/shell/page-watch.cjs");
const { wordsFor, LOOK: RECOVERY_LOOK } = require(path.join(ROOT, "src", "recovery.cjs"));
const { editWordsFor, editMenuFor } = require(path.join(ROOT, "src", "edit-menu.cjs"));
const { chooser, folderAt } = require(path.join(ROOT, "src", "chosen.cjs"));
const { windowsProxySwitches: readPinnedProxySwitches } = require("../engine/pinned/shell/win-proxy.cjs");
const { startupProxySwitches } = require(path.join(ROOT, "src", "win-proxy-plant.cjs"));
const {
  decideClose,
  notifyFirstClose,
  setLoginItemSettings,
  loginItemOn,
  createTray,
  buildTrayMenuTemplate,
  APP_IDS,
  buildJumpList,
  setJumpList,
  pickBadge,
} = require("../engine/pinned/shell/tray.cjs");
const { bubblePlace } = require(path.join(ROOT, "src", "tray-bubble.cjs"));
const { checkWaiting, formatWaitingWord } = require("../src/waiting.mjs");
const { readWithin, TEAM_READ_MAX } = require("../src/share-read.cjs");

/* CHROMIUM SWITCHES: the proxy is chosen here, before ready; a setProxy after it would not stop the first
 * lookup (the pinned engine's win-proxy.cjs). STUDIO_NO_PROXY_SERVER=off, read only in an unpackaged tree, is the harness's
 * control: no proxy switch at all; STUDIO_PROXY_PLANT, only in an unpackaged harness launch, answers from a planted JSON file. */
const windowsProxySwitches = () => startupProxySwitches({
  plantFile: testOnly("STUDIO_PROXY_PLANT"),
  harness: harnessLaunch(),
  packaged: PACKAGED,
  fallback: readPinnedProxySwitches,
});
if (testOnly("STUDIO_NO_PROXY_SERVER") !== "off") {
  for (const s of windowsProxySwitches()) app.commandLine.appendSwitch(...s);
}

/* ON LINUX THE KEYRING IS ASKED FOR BY NAME WHERE CHROMIUM WOULD NOT ASK FOR ONE. Before ready Chromium names the desktop
 * (base/nix/xdg_util.cc, which chromiumDesktop follows line for line) and picks a store (SelectBackend, in Electron's
 * revert_oscrypt_remove_sync_backend.patch): KDE 3, LXQt and an unnamed desktop get "basic_text", which the vault below
 * refuses, so nothing sealed can be orphaned there. On those alone, and only where a keyring answers unlocked
 * (src/keyring-bus.cjs), libsecret is asked for; a recognised desktop's store, or one the command line names, is never
 * changed, since a key sealed under it would be orphaned. The engine's shell does the same; tests/shell-guards.mjs 14. */
const { keyringAnswers } = require(path.join(ROOT, "src", "keyring-bus.cjs"));
function chromiumDesktop(env) {
  const session = env.DESKTOP_SESSION || "", has = n => Object.prototype.hasOwnProperty.call(env, n);
  if (env.XDG_CURRENT_DESKTOP !== undefined) for (const v of String(env.XDG_CURRENT_DESKTOP).split(":").map(s => s.trim()).filter(Boolean)) {
    if (v === "Unity") return session.indexOf("gnome-fallback") > -1 ? "GNOME" : "UNITY";
    if (v === "Deepin") return "DEEPIN";
    if (v === "GNOME") return "GNOME";
    if (v === "X-Cinnamon") return "CINNAMON";
    if (v === "KDE") return env.KDE_SESSION_VERSION === "5" ? "KDE5" : env.KDE_SESSION_VERSION === "6" ? "KDE6" : "KDE4";
    if (v === "Pantheon") return "PANTHEON";
    if (v === "XFCE") return "XFCE";
    if (v === "UKUI") return "UKUI";
    if (v === "LXQt") return "LXQT";
    if (v === "COSMIC") return "COSMIC";
  }
  if (session === "deepin") return "DEEPIN";
  if (session === "gnome" || session === "mate") return "GNOME";
  if (session === "kde4" || session === "kde-plasma") return "KDE4";
  if (session === "kde") return has("KDE_SESSION_VERSION") ? "KDE4" : "KDE3";
  if (session.indexOf("xfce") > -1 || session === "xubuntu") return "XFCE";
  if (session === "ukui") return "UKUI";
  if (has("GNOME_DESKTOP_SESSION_ID")) return "GNOME";
  if (has("KDE_FULL_SESSION")) return has("KDE_SESSION_VERSION") ? "KDE4" : "KDE3";
  return "OTHER";
}
function keyringSwitch(platform, env, line) {
  if (platform !== "linux" || !/^(KDE3|LXQT|OTHER)$/.test(chromiumDesktop(env))) return null;
  if (line.hasSwitch("password-store") || line.hasSwitch("enable-encryption-selection")) return null;
  return keyringAnswers() ? ["password-store", "gnome-libsecret"] : false;
}
const KEYRING_SWITCH = keyringSwitch(process.platform, process.env, app.commandLine);
if (KEYRING_SWITCH === false) process.stderr.write("studio  this desktop names no keyring Chromium knows, and none answers unlocked on the session bus, so none is asked for\n");
if (KEYRING_SWITCH) {
  app.commandLine.appendSwitch(...KEYRING_SWITCH);
  process.stderr.write("studio  this desktop names no keyring Chromium knows, so Studio asks for one by name: --password-store=gnome-libsecret\n");
}
const UI = path.join(ROOT, "ui", "index.html");

/* The node half of Studio is ESM and this file is CommonJS, so every call into it goes through
   one lazy dynamic import. `import()` of a bare Windows path throws ERR_UNSUPPORTED_ESM_URL_SCHEME
   on protocol c:, which is why the URL is built rather than the path passed. A VERB THAT READS A
   PROJECT OR A SHARE GOES TO `thread` INSTEAD (src/studio-thread.cjs); what this process still
   asks of the module itself is a name or a file in its own settings folder. Each module is
   imported on its first ask and kept. */
function lazy(file) {
  let mod = null;
  return async () => {
    if (mod) return mod;
    mod = await import(pathToFileURL(path.join(ROOT, "src", file)).href);
    if (file === "licence-client.mjs" && typeof mod.setSigninPacked === "function") {
      mod.setSigninPacked(signinPacked);
    }
    /* A managed installation's pins (decision 49), read where the providers are read, so a pushed change is taken without a restart. */
    if (file === "licence-client.mjs" && typeof mod.setSigninPolicy === "function") mod.setSigninPolicy(managedNow);
    return mod;
  };
}
/** src/refusal.mjs, the one builder of a refusal. */
const refusal = lazy("refusal.mjs");
const studio = lazy("studio.mjs");

/* THE TEAM KEYS THIS STUDIO LEADS WITH (src/team-store.mjs), each sealed by safeStorage for this account. They are opened
   here and handed to the thread for one call; the page never sees one. */
const teamStore = lazy("team-store.mjs");
/* The catalog each joined desk has loaded (board 890). The page is handed the saying, never the key or the cards. */
const catalogUse = lazy("catalog-use.mjs");
/* The folder's team as this Studio's key judges it, for the one question an answer's landing asks: who the lead is and who
   is on the roster now (src/team.mjs heldTeam). */
const teamLib = lazy("team.mjs");
/* The lead's book sealed into the team file (src/lead-book.mjs). The page never names it. */
const leadBook = lazy("lead-book.mjs");
/* ON LINUX A SEAL NEEDS A KEYRING. safeStorage there asks the desktop's secret service (GNOME's keyring, KWallet) for its
   key, and where none answers it falls back to "basic_text", a password written into Chromium itself (on Ubuntu with
   Electron 44.4.5, as measured, it then also says encryption is unavailable; this test does not rely on that). A team key sealed that
   way is readable by anyone who copies teams.json, so that backend, and
   "unknown", count as no vault at all and the team screen says why (noKeyring), as it does wherever encryption is
   unavailable on Linux, a keyring asked for by name above that did not answer included. The backend is asked on Linux
   alone, so on Windows the answer is isEncryptionAvailable's, as it always was. tests/shell-guards.mjs 10 holds both. */
const ASK_BACKEND = process.platform === "linux";
function vaultBackend() {
  if (!ASK_BACKEND) return null;
  try { return safeStorage && typeof safeStorage.getSelectedStorageBackend === "function"
    ? String(safeStorage.getSelectedStorageBackend()) : null; } catch { return "unknown"; }
}
let keyringSaid = false;
const noKeyring = () => {
  if (!ASK_BACKEND) return false;
  const b = vaultBackend();
  let on = false;
  try { on = !!safeStorage && safeStorage.isEncryptionAvailable(); } catch { on = false; }
  if (!keyringSaid) { keyringSaid = true; process.stderr.write("studio  keyring backend " + b + ", encryption available " + on + "\n"); }
  return b === "basic_text" || b === "unknown" || !on;
};
const vault = {
  available: () => { try { return !!safeStorage && safeStorage.isEncryptionAvailable() && !noKeyring(); } catch { return false; } },
  seal: (text) => safeStorage.encryptString(String(text)),
  open: (bytes) => safeStorage.decryptString(Buffer.from(bytes)),
};
async function teamsAt() { return (await teamStore()).teamsFile(app.getPath("userData")); }
/** The keys, the epochs kept ahead of a team file, and the lead's Plain, as a publish and the review queue take them. */
async function teamsNow() {
  const K = await teamStore(), at = await teamsAt();
  const teamKeys = K.teamKeysOf(at, vault);
  return { teamKeys, pendingKeys: K.pendingEpochsOf(at), unsealed: K.unsealedOf(at) };
}

/* THE INVITATIONS THIS STUDIO MADE (board 885, S2), each secret sealed by safeStorage in teams.json beside the team keys
   (src/team-store.mjs) and opened here into the book a thread verb checks a request's proof against, for one call, as a
   team key is handed over. The page is never handed a secret or a blob: the blob goes to the clipboard from here. */
const inviteLib = lazy("invite.mjs");
async function inviteBook() { return (await teamStore()).inviteBookOf(await teamsAt(), vault); }

/* ---- the store -----------------------------------------------------------------------------
 *
 * <userData>/studio.json, a flat map, written whole. It holds where the projects live, which
 * theme was chosen, which language the interface was asked for, and nothing a person typed
 * into a card: a catalog is on the customer's own disk in the project folder, never in Studio's
 * own settings. NO KEY OF ANY KIND GOES IN IT: nothing in this program reads, stores or sends
 * a key for a model (board 465, and Maxim's ruling of 2026-09-28 13:19). The signing key of
 * board 605 is not an exception to that: it is a FILE beside this store, its private half sealed by
 * safeStorage (Maxim, 2026-10-07 20:42), at a fixed name this shell computes; the store holds only
 * `keyBackup`, the day and the folder of the key's backup copy.
 * Nor are the team keys: they are in teams.json beside it, each sealed by safeStorage (src/team-store.mjs).
 */
function storeAt() { return path.join(app.getPath("userData"), "studio.json"); }
/* A STORE A NEWER STUDIO WROTE (updates 2) reads as nothing and is never written over: src/saved-format.cjs readSaved and
   writeSaved, which stamp `format` and `writtenBy` on every write. The page is told at boot (studio:host savedNewer). */
function readStore() {
  return Saved.readSaved(storeAt()).doc;
}
function writeStore(next) {
  try {
    fs.mkdirSync(path.dirname(storeAt()), { recursive: true });
    return Saved.writeSaved(storeAt(), next, writeWhole, app.getVersion() || Saved.studioVersion());
  } catch { return false; }
}
/** The saved data a newer Studio wrote, studio.json first and then teams.json, as the page says it; null where neither is. */
async function savedNewerNow() {
  let newer = Saved.readSaved(storeAt()).newer;
  if (!newer) { try { newer = (await teamStore()).teamsNewer(await teamsAt()); } catch { newer = null; } }
  return newer ? Object.assign({}, newer, { said: Saved.newerSaid(newer) }) : null;
}

/* WHERE THE PROJECTS ARE. The store wins, then the environment (which is how a gate points this
   at a folder it made), then Documents. The engine reads Documents/Etiuda; Studio's own folder
   sits beside it rather than inside it, because a project folder is not a catalog a desk should
   ever be offered. */
function projectsRoot() {
  const s = readStore();
  if (typeof s.root === "string" && s.root) return s.root;
  if (testOnly("STUDIO_PROJECTS")) return testOnly("STUDIO_PROJECTS");
  try { return path.join(app.getPath("documents"), "Etiuda Studio"); }
  catch { return path.join(os.homedir(), "Etiuda Studio"); }
}

/* ONE STUDIO HOLDS THE PROJECTS FOLDER AT A TIME (src/root-hold.cjs; Max, 2026-11-22 21:14, by Claude alpha: two Studios working in
   one shared projects folder is retired). The hold is taken the first time anything asks for the folder, kept fresh while this
   Studio runs and let go at quit. Where another live Studio has it, this one opens nothing from the folder: the list, a new
   catalog, an import and every project verb answer one sentence. A hold left by a Studio that died is taken over by the next
   look; one that cannot be read or replaced says so, naming the file, and is not "another Studio". The words are the engineer's,
   placeholders for the copywriter. */
const HOLD_AT = "Etiuda Studio on {COMPUTER} already has {ROOT} open, and one Studio works in a projects folder at a time, so nothing was opened from it here. Quit Studio on {COMPUTER}, or choose another projects folder, then try again.";
const HOLD_SAME = "Another copy of Etiuda Studio on this computer already has {ROOT} open, and one Studio works in a projects folder at a time, so nothing was opened from it here. Quit that copy, or choose another projects folder, then try again.";
const HOLD_TROUBLE = "Studio cannot tell whether another copy has {ROOT} open, because it cannot read or replace {FILE}, so nothing was opened from it. Once that file is deleted, try again.";
let rootHold = null;
/* QUIT SETS THIS BEFORE IT LETS THE HOLD GO, AND NO HOLD IS TAKEN AFTER IT (fold 100; the public runner's relay-studio b984c, "left interval
   10000 running"). Electron does not wait for will-quit's promise, and a check already in flight (the waiting check, a look of the page)
   runs holdCheck after the hold is let go: it took the hold again, rewrote the hold file and armed the beat, so the file outlived the quit
   and a Studio on another computer was refused the folder for up to 45 s. Letting go only after those checks settle would hold the hold
   past the quit; a flag costs nothing and leaves the hold dropped at once. A quit takes no more refusals either: nothing is working in the
   folder any more. */
let holdQuitting = false;
function holdError(frame, vars) {
  const e = new Error(frame.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)));
  e.said = { frame, vars };
  /* A REFUSAL BY THE HOLD KEEPS WHAT WAS TYPED, as a fault of the disk does (the test architect's re-read, D1): a laptop asleep past 45 s whose
     hold a colleague's Studio took over is refused on waking, and what is typed then is sent again once the folder is free, not dropped. The
     edit itself was sound; the folder is what is closed to it. */
  e.disk = true; /* plant:hold-disk */
  return e;
}
/** Where the other Studio is: its computer's name, or this computer's. A hold written without a host (none is) reads as this computer's. */
function holdOtherError(where, by) {
  const host = by && by.host ? String(by.host) : "";
  if (!host || host.toLowerCase() === os.hostname().toLowerCase()) return holdError(HOLD_SAME, { ROOT: where });
  return holdError(HOLD_AT, { ROOT: where, COMPUTER: host });
}
/** Take the hold on `root` (this Studio's own projects folder, or one it is about to choose), or throw the sentence. `fresh` asks the
 *  disk again; otherwise a refused look is not repeated inside two seconds, and a folder that holds nothing (not there, or nobody may
 *  write to it) is looked at again after half a minute. */
function holdCheck(root, fresh) {
  if (holdQuitting) return; /* plant:hold-quit */
  const where = path.resolve(root);
  const now = Date.now();
  /* Only a folder that can be shared has a hold (a synced folder, a share, a disk that may be a mapped share): a local one is this computer's alone. */
  if (!RootHold.needed(where)) { if (rootHold) holdLetGo(); return; }
  /* A STUDIO OUT OF SIGHT TAKES NO HOLD AND REFUSES NOTHING: nobody is editing in it. What its page asks is a read, or the last of what was typed
     (sent before it let go, goAway); what it would write on its own waits (holdBlocks). It takes the hold again when its window is shown. */
  if (awayNow()) return; /* plant:hold-quiet */
  if (rootHold && rootHold.root === where && rootHold.state === "mine") return;
  if (rootHold && rootHold.root !== where) {
    if (rootHold.state === "mine") RootHold.drop(rootHold.root, rootHold.me);
    clearInterval(rootHold.timer);
    rootHold = null;
  }
  if (!rootHold || fresh || now - rootHold.at > (rootHold.state === "free" ? 30000 : 2000)) {
    const me = rootHold ? rootHold.me : RootHold.holder();
    const r = RootHold.take(where, me);
    const timer = rootHold ? rootHold.timer : null;
    rootHold = { root: where, me, state: r.state, r, at: now, timer };
    /* THE BEAT GOES ON WHATEVER THE LAST LOOK MET (the test architect's re-read, D2): a folder not there yet, a hold that could not be read, a
       share that dropped for a moment. Only a hold found in another Studio's hands is left to the next verb; it is that Studio's to keep. */
    if (r.state !== "other" && !timer) { /* plant:hold-beat */
      rootHold.timer = setInterval(() => {
        const was = rootHold;
        if (!was || was.state === "other" || holdQuitting) return;
        const again = RootHold.take(was.root, was.me);
        was.state = again.state; was.r = again; was.at = Date.now();
      }, Number(testOnly("STUDIO_HOLD_BEAT_MS")) || RootHold.BEAT_MS);
      if (rootHold.timer.unref) rootHold.timer.unref();
    }
  }
  if (rootHold.state === "other") throw holdOtherError(where, rootHold.r.by);
  if (rootHold.state === "trouble") throw holdError(HOLD_TROUBLE, { ROOT: where, FILE: rootHold.r.file });
}
function holdLetGo() {
  if (!rootHold) return;
  clearInterval(rootHold.timer);
  if (rootHold.state === "mine") RootHold.drop(rootHold.root, rootHold.me);
  rootHold = null;
}

/* THE HOLD BELONGS TO A STUDIO SOMEONE IS EDITING IN, never to one merely running (Claude alpha, 2026-11-22 22:46; the test architect's
   re-read, B1: a lead who closed Studio with its X, which hides it to the tray, kept a colleague's Studio refused all afternoon). So the
   hold is let go when the window hides to the tray, after the page has sent what waits and no verb is still writing, and taken again when
   the window is shown; a Studio started hidden (a start with Windows) takes none until its window is shown. `etiudaAway` is that state on
   the window; `etiudaGoing` is the hide that has not finished yet, which a person who brings the window back cancels. A quitting Studio is
   never away: the saves its page sends as it closes go out under the hold. */
function awayNow() {
  if (quitting) return false;
  const w = theWindow;
  return !!(w && !(typeof w.isDestroyed === "function" && w.isDestroyed()) && w.etiudaAway);
}
/** Run one of the page's own hooks (ui/app.js window.STUDIO_HOLD) and wait for its answer, at most `ms`. A page that is gone or does not answer
 *  is not waited for: the folder is not held for it. */
async function askPage(win, what, ms, arg) {
  const src = "window.STUDIO_HOLD && window.STUDIO_HOLD." + what + " ? window.STUDIO_HOLD." + what + "(" + (arg == null ? "" : JSON.stringify(arg)) + ") : true";
  let timer = null;
  try {
    return await Promise.race([win.webContents.executeJavaScript(src), new Promise((r) => { timer = setTimeout(r, ms); if (timer.unref) timer.unref(); })]);
  } catch { return null; }
  finally { clearTimeout(timer); }
}
const HIDE_WAIT_MS = 15000;
function goAway(win) {
  win.etiudaGoing = true;
  (async () => {
    try { await askPage(win, "flush", HIDE_WAIT_MS); } catch { /* the page is gone: nothing more to wait for */ } /* plant:hold-flush */
    for (let i = 0; i < HIDE_WAIT_MS / 100 && verbsRunning > 0; i++) await new Promise((r) => setTimeout(r, 100)); /* plant:hold-inflight */
    if (!win.etiudaGoing || (typeof win.isDestroyed === "function" && win.isDestroyed())) return; /* plant:hold-kept */
    win.etiudaGoing = false;
    win.etiudaAway = true;
    holdLetGo(); /* plant:hold-away */
  })();
}
/** An interrupted key handover is resumed once the folder is held: asked when the window is shown and at each look of the watch. "none" where
 *  no handover waits, "waiting" where the hold is not this Studio's to use now, "ran" where the resume was started. */
let resumeLast = "", resumeOwed = false;
function resumeWhenHeld(look) {
  const s = readStore();
  if (!s || !s.handover) { resumeOwed = false; return (resumeLast = "none"); }
  if (look && !resumeOwed) return resumeLast; /* the watch asks only for a resume that was held back, not at every look */
  if (holdBlocks(projectsRoot())) { resumeOwed = true; return (resumeLast = "waiting"); }
  resumeOwed = false;
  resumeLast = "ran";
  Promise.resolve().then(() => resumeHandover()).catch(() => { /* the next look asks again */ });
  return resumeLast;
}
function windowShown(win) {
  win.etiudaGoing = false; /* a hide not finished is cancelled: the hold stays where it is */
  if (!win.etiudaAway) return;
  win.etiudaAway = false;
  let refused = null;
  try { holdCheck(projectsRoot(), true); } catch (e) { refused = bad(e); } /* plant:hold-shown */
  /* Another Studio has it: every verb says so, and the page is told at once, whatever screen it is on, so an open catalog is put out of reach
     with the sentence and is not left editable until its first save is refused (the test architect's re-read, D-b). */
  askPage(win, "shown", HIDE_WAIT_MS, refused).catch(() => {}); /* plant:hold-shown-arg */
  resumeWhenHeld(); /* plant:hold-resume-shown */
}
/** Whether a write this Studio would make into the projects folder on its own, with nobody having asked, must wait: it is out of sight, or
 *  another Studio holds the folder. A folder only this computer can reach has no hold, and nothing waits. */
function holdBlocks(root) {
  const where = path.resolve(String(root));
  if (!RootHold.needed(where)) return false;
  if (awayNow()) return true;
  try { holdCheck(where); return false; } catch { return true; }
}

function pathsSame(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !a || !b) return false;
  const x = path.resolve(a), y = path.resolve(b);
  return process.platform === "win32" ? x.toLowerCase() === y.toLowerCase() : x === y;
}
/* A DIRECTORY THE PAGE NAMES IS A CATALOG THIS STUDIO LISTS, or it is refused before anything is
   read or written there. That is a direct child of the projects root. A link
   is not, and neither is a path whose real parent is some other folder, so a junction cannot make
   a folder outside the root count as a child. An empty name and a NUL are refused before the path
   is resolved, and so is a UNC name unless the projects root is itself a UNC path. The parent is
   compared as strings before anything is stat'd. The sentence names no path. A name that is not
   absolute is resolved under the projects root, and the absolute path is what the rest of the shell
   is given. */
const OUTSIDE_CATALOG = "That catalog is not one Studio lists.";
function outsideCatalog() {
  const e = new Error(OUTSIDE_CATALOG);
  e.said = { frame: OUTSIDE_CATALOG, vars: {} };
  return e;
}
function isUnc(p) {
  const s = String(p);
  return s.startsWith("\\\\") || s.startsWith("//");
}
/* A UNC name is barred only when the projects root is not itself a UNC path, so a catalog kept
   on a share is still a catalog this Studio lists. */
function uncBarred(named, root) {
  return isUnc(named) && !isUnc(root);
}
function projectDir(dir) {
  const named = String(dir == null ? "" : dir);
  if (!named || !named.trim() || named.includes("\u0000")) throw outsideCatalog();
  const root = path.resolve(projectsRoot());
  holdCheck(root);
  if (uncBarred(named, root)) throw outsideCatalog();
  const home = path.isAbsolute(named) ? path.resolve(named) : path.resolve(root, named);
  if (uncBarred(home, root) || !pathsSame(path.dirname(home), root)) throw outsideCatalog(); /* plant:txic-uncroot */
  let st = null;
  try { st = fs.lstatSync(home); } catch { st = null; }
  if (st && st.isSymbolicLink()) throw outsideCatalog();
  if (st) {
    const real = realOf(home);
    if (!pathsSame(path.dirname(real), realOf(root))) throw outsideCatalog();
  }
  return home;
}
/* The same rule, for a handler that answers quietly when the directory is not one it may read. */
function projectPlace(dir) {
  try { return projectDir(dir); } catch { return null; }
}
/* AN IMPORT'S TARGET IS EMPTY, OR A CATALOG THIS STUDIO LISTS. Empty is the importer's own
   choice. Anything the page names is confined the same way as a directory, and the absolute
   path is what the importer is given. */
function importInto(into) {
  if (into == null || into === "") return "";
  return projectDir(into); /* plant:txic-import */
}
/* A PATH THE PAGE ASKS TO SEE is a listed catalog, a folder a pick answered, a file inside one of
   those, or a file in that catalog's stored team folder. A link whose real place is somewhere else
   does not count. The refusal names no path, so a path that is not one of these is the same answer
   whether or not it is there. */
const NOT_SHOWN = "That path is not one Studio can show.";
function notShown() {
  const e = new Error(NOT_SHOWN);
  e.said = { frame: NOT_SHOWN, vars: {} };
  return e;
}
function underPath(parent, child) {
  const fold = (s) => (process.platform === "win32" ? s.toLowerCase() : s);
  const rel = path.relative(fold(path.resolve(parent)), fold(path.resolve(child)));
  return rel === "" || (rel !== ".." && !rel.startsWith(".." + path.sep) && !path.isAbsolute(rel));
}
/* THE PROJECTS FOLDER IS NAMED IN ONE SPELLING AND LIVES AT ANOTHER whenever its path runs through a junction, a
   mapped or subst drive, a short name or a link, and the page is handed paths in the folder's own spelling (a listing
   joins the root as the setting names it). The places listed are real paths, so the two are put on one form before they
   are compared: a path under the root as named is rewritten under the root's real path, by text alone. Nothing the page
   named is stat'd for that, so a path that is under no listed place still touches nothing. What is left to the filesystem
   is the check below, which is by real path and refuses a link whose target lies outside. */
function rootRealSpelling() {
  const root = path.resolve(projectsRoot());
  const real = realOf(root);
  return (p) => {
    const abs = path.resolve(p);
    return underPath(root, abs) ? path.join(real, path.relative(root, abs)) : abs;
  };
}
function staysIn(parent, child, spelled = (p) => p) {
  if (!underPath(spelled(parent), spelled(child))) return false; /* plant:lps-spelling */
  try { fs.lstatSync(child); } catch { return true; }
  return within(child, parent); /* plant:lps-link */
}
function storedTeamFolder(dir) {
  try {
    const parsed = JSON.parse(fs.readFileSync(path.join(dir, "project.json"), "utf8"));
    const folder = parsed && typeof parsed.folder === "string" ? parsed.folder : "";
    return folder ? path.resolve(dir, folder) : "";
  } catch { return ""; }
}
function listedPlaces() {
  const root = path.resolve(projectsRoot());
  let names = [];
  try { names = fs.readdirSync(root); } catch { return []; }
  const places = [];
  for (const name of names) {
    const child = path.join(root, name);
    let st = null;
    try { st = fs.lstatSync(child); } catch { continue; }
    if (!st.isDirectory() || st.isSymbolicLink()) continue;
    const real = realOf(child);
    if (!pathsSame(path.dirname(real), realOf(root))) continue;
    places.push(real);
    const folder = storedTeamFolder(child);
    if (folder) places.push(folder);
  }
  return places;
}
function mayShow(at) {
  const spelled = rootRealSpelling();
  if (chosen.covers(at)) {
    for (const place of chosen.places()) {
      if (staysIn(place, at, spelled)) return true;
    }
  }
  for (const place of listedPlaces()) {
    if (staysIn(place, at, spelled)) return true;
  }
  return false;
}
function shownPath(p) {
  const named = String(p == null ? "" : p);
  if (!named || named.includes("\u0000") || !path.isAbsolute(named)) throw notShown();
  const root = path.resolve(projectsRoot());
  if (uncBarred(named, root)) throw notShown();
  const at = path.resolve(named);
  /* A UNC root refuses, before any stat, a path that is not under it and was not a pick. */
  if (uncBarred(at, root) || (isUnc(root) && !underPath(root, at) && !chosen.covers(at))) throw notShown();
  if (!mayShow(at)) throw notShown(); /* plant:txic-show */
  return at;
}
/* A PROPOSAL FILE IS IN THAT CATALOG'S INBOX, or, for opening and deciding, in one desk folder
   (desks/k- and 16 hex digits, the listing's own shape). The check is the directory, before the
   file is read. A link whose real place is somewhere else does not count. The sentence names no path. */
const NOT_PROPOSAL = "That file is not one of this catalog's proposals.";
function notProposal() {
  const e = new Error(NOT_PROPOSAL);
  e.said = { frame: NOT_PROPOSAL, vars: {} };
  return e;
}
function proposalShape(home, at, desks) {
  const base = path.basename(at);
  if (!base || base === "." || base === "..") return false;
  if (pathsSame(path.dirname(at), path.join(home, "inbox"))) return true;
  if (!desks) return false;
  const parent = path.dirname(at);
  return pathsSame(path.dirname(parent), path.join(home, "desks"))
    && /^k-[0-9a-f]{16}$/.test(path.basename(parent));
}
function proposalKept(home, at, desks) {
  if (!proposalShape(home, at, desks)) return false;
  let st = null;
  try { st = fs.lstatSync(at); } catch { return true; }
  if (!st) return true;
  return proposalShape(realOf(home), realOf(at), desks);
}
function proposalFile(home, file, desks) {
  const named = String(file == null ? "" : file);
  const root = path.resolve(projectsRoot());
  if (!named || named.includes("\u0000") || uncBarred(named, root)) throw notProposal();
  const at = path.isAbsolute(named) ? path.resolve(named) : path.resolve(home, named);
  if (uncBarred(at, root) || !proposalKept(home, at, desks)) throw notProposal(); /* plant:txic-proposal */
  return at;
}

/* ---- the material and the theme ------------------------------------------------------------ */

function hostBackdrop() {
  if (process.platform !== "win32") return null;
  const build = Number(os.release().split(".")[2] || 0);
  return build >= 22621 ? "acrylic" : null;
}

/* THE MATERIAL AND THE BAND MOVE TOGETHER. Acrylic takes its light or dark tint from Windows,
   while every pixel the page paints follows the theme picked in Studio, so a dark Studio on a
   light Windows would leave the material and the band disagreeing down one edge. */
function applyTheme(v) {
  const t = (v === "light" || v === "dark") ? v : "system";
  nativeTheme.themeSource = t;
  return t;
}
function themeNow() {
  const t = readStore().theme;
  return (t === "light" || t === "dark") ? t : "system";
}

/* THE INTERFACE LANGUAGE THE PERSON ASKED FOR, or null where nobody has asked: the page then
   follows the desk's own locale, which is what it did before Settings had this row. Only the
   two languages Studio has a table for are kept, so a stray value in the store cannot put the
   interface into a language that does not exist. */
function uiLangNow() {
  const l = readStore().lang;
  return (l === "en" || l === "pl") ? l : null;
}

/* WHAT THE DESK REMEMBERS ABOUT THE TOUR (board 720). Three values and each answers a different
   question: `offered` stops anybody being asked twice, `taken` stops the Settings row saying
   Continue to somebody who finished, and `at` is the step it resumes on, which is the one place
   Studio's tour departs from the desk's. They live in the store beside the theme because a tour
   half-taken has to survive the program closing - that is the whole point of resuming.
   READ THROUGH A FLOOR AND A CEILING rather than trusted: a stray `at` in a hand-edited store
   would otherwise open the tour on a step that does not exist. */
const TOUR_STEPS = 10; /* plant:f10-count */
function tourNow() {
  const t = readStore().tour;
  const o = (t && typeof t === "object") ? t : {};
  const at = Number(o.at);
  return { offered: !!o.offered, taken: !!o.taken,
           at: Number.isInteger(at) && at >= 0 && at < TOUR_STEPS ? at : 0 };
}

/* THE LANGUAGE OF THE RECOVERY WINDOW IS THE PAGE'S, by the page's rule (chooseLang in ui/app.js):
   STUDIO_LANG, then a stored Polish, then the desk's locale, which is what navigator.language is. */
function recoveryLang() {
  if (process.env.STUDIO_LANG) return String(process.env.STUDIO_LANG).slice(0, 2);
  if (uiLangNow() === "pl") return "pl";
  return String(app.getLocale() || "").slice(0, 2) === "pl" ? "pl" : "en";
}

/* PREFERENCES (board 965, run S3). Stored in studio.json, with defaults when absent. */
const PREF_DEFAULTS = {
  animations: true,
  density: "comfortable",
  openCatalog: "new",
  reopenTabs: true,
};
const PREFS_WHITELIST = ["theme", "lang", "animations", "density", "openCatalog", "openIn", "reopenTabs", "reopenLast"];
const RESET_WHITELIST = ["theme", "lang", "animations", "density", "openCatalog", "openIn", "reopenTabs", "reopenLast", "prefs", "shortcuts", "quitOnClose", "trayNotes", "trayBadge", "trayBubble", "notifyProposals", "notifyRequests"];

function shortcutsNow() {
  const s = readStore();
  return (s.shortcuts && typeof s.shortcuts === "object") ? s.shortcuts : {};
}

function prefsNow() {
  const s = readStore();
  const p = (s.prefs && typeof s.prefs === "object") ? s.prefs : {};
  const anim = typeof s.animations === "boolean" ? s.animations : (typeof p.animations === "boolean" ? p.animations : true);
  const dens = (s.density === "compact" || p.density === "compact") ? "compact" : "comfortable";
  const oc = (s.openCatalog === "this" || p.openCatalog === "this" || s.openIn === "this" || p.openIn === "this") ? "this" : "new";
  const ro = typeof s.reopenTabs === "boolean" ? s.reopenTabs : (typeof p.reopenTabs === "boolean" ? p.reopenTabs : (typeof s.reopenLast === "boolean" ? s.reopenLast : true));
  return {
    animations: anim,
    density: dens,
    openCatalog: oc,
    reopenTabs: ro,
  };
}

/* ---- the harness's own window ---------------------------------------------------------------
 *
 * STUDIO_TEST_OFFSCREEN=1 puts the window past the far corner of every display and never focuses
 * it, so a gate that launches this twenty times does not take the screen twenty times from
 * whoever is at the desk. IT IS STILL SHOWN, with showInactive: an unshown window produces no
 * frames at all and every capture against it times out, which would leave the paint half of the
 * launch gate unprovable. A customer sets no such variable and an installed copy is unchanged.
 */
const OFFSCREEN = process.env.STUDIO_TEST_OFFSCREEN === "1";
function offscreenAt() {
  let x = 6000, y = 6000;
  try {
    for (const d of screen.getAllDisplays()) {
      x = Math.max(x, d.bounds.x + d.bounds.width + 200);
      y = Math.max(y, d.bounds.y + d.bounds.height + 200);
    }
  } catch { /* the fallback above is already off any ordinary desktop */ }
  return { x: x, y: y };
}

/* AND NO NATIVE DIALOG EITHER, board item 535. The flag above governs the BrowserWindow, which
 * is this program's own; a file or folder dialog is the SYSTEM's window, and Windows centres it
 * on the primary display whatever its owner is doing beyond the far corner. Measured 2026-09-18
 * over a whole `npm test`: fifteen Electron windows, every one of them 1298x890 at 5993,6000 and
 * on no monitor, and TWO dialogs of window class #32770, 1024x576 at 1024,528, up for about two
 * and a half seconds each during tests/polish.mjs - the two launches of that gate which walk
 * every screen without a STUDIO_TEST_FILE to answer the pick with. That is what a person at the
 * desk sees.
 *
 * NOTHING IS TAKEN FROM A LEG BY THIS. The three pickers below already say at length that a
 * native dialog cannot be driven and blocks the main process while it is up, so a gate that
 * presses one gets a hang rather than a file; refusing under the harness's own flag turns that
 * hang into the same answer the person gets when they press Cancel. A customer sets no such
 * variable. The shape is showOpenDialog's and showSaveDialog's both, so one refusal serves the
 * five sites and no caller can tell it from a cancellation - which is the point. */
async function pick(kind, win, opts) {
  if (OFFSCREEN) return { canceled: true, filePaths: [], filePath: "" };
  return kind === "save" ? dialog.showSaveDialog(win, opts) : dialog.showOpenDialog(win, opts);
}

/* A CATALOG'S NAME IN A DIALOG'S FILE-TYPE LIST IS THE PAGE'S, in the interface's language, as
   the import picker's two are (survey finding 26): this process has no table, and the name it
   used to write here stayed English on a Polish screen. The English is only the floor for a page
   that sent nothing, and the length is the engine's own shell's ceiling for the same field.
   tests/shell-guards.mjs 5 holds every dialog this file opens to the page's words. */
function catalogKind(kind) { return String(kind || "Etiuda catalog file").slice(0, 60); }

/* What the importer reads: CSV and its tab and text cousins, a workbook, a JSON export. */
const PICKER_EXTENSIONS = ["csv", "tsv", "txt", "xlsx", "json"];

/* SPELLING ON LINUX, FROM THE PACKAGE AND NEVER FROM THE WEB. Windows checks spelling with its own checker, Electron
   fetches nothing for it, and none of this runs there. On Linux Electron uses Hunspell and, for each language the
   session has, reads <userData>/Dictionaries/<name> or else downloads <name> from Google's servers at the first window
   (redirector.gvt1.com, measured with a net log on the Ubuntu build, 2026-10-04). Until 2026-10-06 the checker was
   turned off here, so the card editor underlined nothing; now the package carries the English and Polish files
   (electron-builder.js, the linux block) and they are copied into the profile before the session is given those two
   languages, under Chromium's own casing.
   THE TRAP, measured 2026-10-06 on Electron 44: the download address cannot be the package. The loader refuses
   file:// (net error -302), and a custom scheme or a file handler fails the same way, so the address set below is a
   stopper, not a source: a language without a file asks nothing of the network. The name Chromium asks the server for
   is lowercased, and a copy under that name is never read.
   tests/shell-guards.mjs 11 holds both platforms; tests/linux-studio.mjs the installed package. */
const SPELLING = process.platform === "linux"
  ? { langs: ["en-US", "pl"], files: ["en-US-10-1.bdic", "pl-PL-3-0.bdic"] } : null;
function spellingFromPackage(s) {
  const from = path.join(process.resourcesPath || "", "dictionaries");
  s.setSpellCheckerDictionaryDownloadURL(pathToFileURL(from).href + "/");
  const to = path.join(app.getPath("userData"), "Dictionaries"), placed = [];
  for (const name of SPELLING.files) {
    const at = path.join(to, name), tmp = at + "." + process.pid + ".tmp";
    try {
      const bytes = fs.readFileSync(path.join(from, name));
      let had = null;
      try { had = fs.readFileSync(at); } catch { /* not there yet */ }
      if (had && had.equals(bytes)) continue;
      fs.mkdirSync(to, { recursive: true });
      fs.writeFileSync(tmp, bytes);
      renamePatiently(tmp, at);
      placed.push(name);
    } catch (e) {
      try { fs.unlinkSync(tmp); } catch { /* never made */ }
      process.stderr.write("studio  the spelling dictionary " + name + " was not placed: " + ((e && e.code) || e) + "\n");
    }
  }
  s.setSpellCheckerLanguages(SPELLING.langs);
  return placed;
}

let theWindow = null;

function createWindow() {
  const backdrop = hostBackdrop();
  const room = roomFor(screen.getAllDisplays(), screen.getPrimaryDisplay());
  const placeFile = windowFile(app.getPath("userData"));
  const place = OFFSCREEN ? null : readWindowPlace(placeFile, screen); /* plant:wp-read */
  const full = place && place.maximized ? maximizedArea(place, screen) : null;
  let restoreTo = full ? { x: place.x, y: place.y, width: place.width, height: place.height } : null;
  const at = full || (place ? { x: place.x, y: place.y, width: place.width, height: place.height } : null);
  const win = new BrowserWindow({
    ...(at || { width: room.width, height: room.height }),
    minWidth: room.minWidth,
    minHeight: room.minHeight,
    show: false,
    frame: false,
    backgroundColor: "#00000000",
    ...(OFFSCREEN ? Object.assign({ focusable: false }, offscreenAt()) : {}),
    ...(backdrop === "acrylic" ? { backgroundMaterial: "acrylic" } : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webviewTag: false,
      webSecurity: true,
    },
  });
  if (at && typeof win.setBounds === "function" && typeof win.getBounds === "function") {
    const want = at;
    win.setBounds(want);
    const got = win.getBounds();
    if (got && (got.width !== want.width || got.height !== want.height)) {
      win.setBounds(Object.assign({}, want, { width: 2 * want.width - got.width, height: 2 * want.height - got.height }));
    }
  }
  const built = full && typeof win.getBounds === "function" ? win.getBounds() : null;

  win.studioHiddenPending = !OFFSCREEN && launchHidden();
  win.etiudaAway = win.studioHiddenPending; /* a start with Windows shows no window and holds no folder (the hold, goAway) */
  win.on("show", () => { windowShown(win); });
  win.studioMaximizeOnShow = !!(place && place.maximized && win.studioHiddenPending);

  win.once("ready-to-show", () => {
    if (OFFSCREEN) win.showInactive();
    else if (launchHidden()) return;
    else if (place && place.maximized && typeof win.maximize === "function") { win.maximize(); win.focus(); }
    else win.show();
  });

  let maximized = !!(place && place.maximized), placeSave = null;
  const canSavePlace = () => !OFFSCREEN && !win.studioHiddenPending && !win.isDestroyed(); /* plant:wp-can-save */
  const syncMaximized = () => {
    if (typeof win.isMinimized !== "function" || !win.isMinimized()) {
      maximized = typeof win.isMaximized === "function" && win.isMaximized();
    }
  };
  const savePlaceNow = () => {
    if (!canSavePlace()) return;
    clearTimeout(placeSave);
    placeSave = null;
    syncMaximized();
    saveWindowPlace(placeFile, win, { maximized, normal: restoreTo, skip: !canSavePlace() });
  };
  const keepPlace = () => {
    if (!canSavePlace()) return;
    syncMaximized();
    clearTimeout(placeSave);
    placeSave = setTimeout(() => {
      if (canSavePlace()) saveWindowPlace(placeFile, win, { maximized, normal: restoreTo, skip: !canSavePlace() });
    }, 500);
    if (placeSave && typeof placeSave.unref === "function") placeSave.unref();
  };
  const restoreHeld = () => {
    if (!restoreTo || win.isDestroyed()) return;
    const to = restoreTo, b = typeof win.getBounds === "function" ? win.getBounds() : null;
    restoreTo = null;
    if (b && built && b.x === built.x && b.y === built.y && b.width === built.width && b.height === built.height && typeof win.setBounds === "function") {
      win.setBounds(to);
    }
  };

  win.on("close", (e) => {
    if (closeHeld(win, e)) return;
    savePlaceNow();
  });
  /* A QUIT THE PAGE HOLDS BACK (a close it holds once for what the disk refused) is cancelled with the window still hidden to the tray: the
     window is shown, so the sentence is on screen, and the quit is forgotten, so this Studio is not left half quitting, no longer "away", taking
     the hold again for what it lands on its own (the test architect's re-read, D-c). A second Quit goes through, as before. The close is not
     forced: the page's own hold stands. */
  win.webContents.on("will-prevent-unload", () => {
    if (!quitting) return;
    quitting = false; /* plant:hold-quit-reset */
    try { showStudio(win); } catch { /* the window is gone */ }
  });
  win.on("session-end", () => {
    win.etiudaSessionEnd = true;
    win.etiudaCloseOk = true;
  });

  /* The maximise glyph is a picture of the window's state, and the window can reach that state
     without the button: a double-click on the drag band, Windows key and an arrow, a snap. */
  const tellMaximized = () => {
    if (!win.isDestroyed()) win.webContents.send("studio:maximized", win.isMaximized());
    keepPlace();
  };
  win.on("maximize", tellMaximized);
  win.on("unmaximize", restoreHeld);
  win.on("unmaximize", tellMaximized);
  win.on("moved", keepPlace);
  win.on("resized", keepPlace);
  win.on("closed", () => { clearTimeout(placeSave); placeSave = null; });
  /* The team watch looks on focus, stat first (board 885, S2). */
  win.on("focus", () => { teamWatch(""); });

  /* Nothing in Studio links out, and a navigation that got through would replace the app with a
     web page and leave no way back to it. Both routes are refused. */
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (e, url) => {
    if (url !== win.webContents.getURL()) e.preventDefault();
  });

  /* THE EDIT MENU (src/edit-menu.cjs): a field's Cut, Copy, Paste and Select all, a misspelt word's suggestions, Copy
     over selected text, in the page's language. Not while a gate drives the window: the spelling step right-clicks
     to read the same event, and an open menu would stand over the words it types next. */
  win.webContents.on("context-menu", (e, p) => {
    if (GATE_ASKED) return;
    const items = editMenuFor(win.webContents, p, editWordsFor(recoveryLang()));
    if (items.length) Menu.buildFromTemplate(items).popup({ window: win });
  });

  watchPage(win, { ...RECOVERY_LOOK, BrowserWindow, dark: () => !!nativeTheme.shouldUseDarkColors, aside: OFFSCREEN,
                   asideAt: offscreenAt, tmpdir: os.tmpdir, words: () => wordsFor(recoveryLang()),
                   log: (line) => process.stderr.write("studio  " + line + "\n"), now: Date.now });

  /* A screen plugged in, taken away or scaled moves the floor with it. */
  const refit = () => {
    if (win.isDestroyed()) return;
    const r = roomFor(screen.getAllDisplays(), screen.getPrimaryDisplay());
    win.setMinimumSize(r.minWidth, r.minHeight);
  };
  screen.on("display-metrics-changed", refit);
  screen.on("display-added", refit);
  screen.on("display-removed", refit);
  win.on("closed", () => {
    screen.removeListener("display-metrics-changed", refit);
    screen.removeListener("display-added", refit);
    screen.removeListener("display-removed", refit);
  });

  theWindow = win;
  win.on("closed", () => { if (theWindow === win) theWindow = null; });
  win.loadFile(UI);
  return win;
}

/* No File / Edit / View / Window bar: the band is the top bar and the window has no other
   chrome. Called before the first window, because Electron builds the default menu lazily. */
Menu.setApplicationMenu(null);

/* ---- what the page may ask for --------------------------------------------------------------
 *
 * Every handler is async and every one of them answers plain JSON. An object handed across the
 * context bridge arrives as a proxy the page cannot copy or extend, so nothing but data crosses.
 * A handler that throws answers { error } rather than rejecting: a renderer that has to guard
 * every call with a try block ends up guarding none of them.
 */
function ok(v) { return Object.assign({ error: null }, v); }

/* EVERY CHANNEL IS OPENED THROUGH ONE OF THESE TWO, and answers only Studio's own page
   (src/own-frame.cjs): anything else holding the preload's bridge is answered null or not at
   all. ipcMain is named nowhere else in this file, so no channel can be opened round them. */
const IPC = require("electron").ipcMain;
function answer(channel, fn) {
  const go = HELD_BY_NEWER.has(channel) ? heldByNewer(fn) : fn;
  IPC.handle(channel, async (e, ...a) => {
    if (!ownFrame(e.senderFrame, UI)) return null;
    if (!OPEN_STOPPED.has(channel) && !(await worksNow())) return stoppedAnswer(); /* plant:s1b-answer */
    verbsRunning++;
    try { return await go(e, ...a); } finally { verbsRunning--; }
  });
}
/* How many verbs the page has asked that have not answered yet: a Studio hiding to the tray lets go of the projects folder only once none is
   still writing into it (a publish in flight, a rename), as goAway waits. */
let verbsRunning = 0;
/* WHILE SAVED DATA A NEWER STUDIO WROTE STAND, NOTHING HERE MAKES OR REPLACES AN IDENTITY (updates 2; the test architect's E1,
   2026-11-01): a signing key, a team or the place it meets, or this Studio's licence records. This version reads none of what
   the newer one wrote, so a key or a team made here would stand beside the lead's own and strand the desks; and a key file is a
   file of its own, which the store's refused write does not catch. Each act below is refused in the copywriter's saved-data
   sentence, the one the page shows (savedNewerNow). The key's backup copy stays open, since it only copies out. A seal is held
   where it would make a team (studio:team-sealed; the verb under it refuses one at a plain folder now, so the hold meets a refusal in that case), and
   the first key a publish or a seal makes is held in firstKey. */
const HELD_BY_NEWER = new Set(["studio:key-make", "studio:key-aside", "studio:key-restore-pick", "studio:key-restore",
  "studio:key-remove",
  "studio:team-relay", "studio:team-choose", "studio:team-handover",
  "studio:team-leave", "studio:team-move-catalog", "studio:team-let-go",
  "studio:licence-signin", "studio:licence-signout",
  /* Each mints a new epoch key kept in teams.json: under a newer teams.json that write throws, and if the team file with the new
     epoch had already landed, nobody would hold the key (the test architect's E2, 2026-11-01 07:20). */
  "studio:member-remove", "studio:invite-cancel", "studio:team-key-move",
  /* A member key and a followed team are kept in member-key.json and teams.json, which a newer Studio may have written. */
  "studio:follow-join", "studio:follow-leave"]);
async function newerHold() {
  const newer = await savedNewerNow();
  if (newer) throw (await refusal()).refuse(newer.said.frame, newer.said.vars);
}
function heldByNewer(fn) {
  return async (e, ...a) => {
    const no = await guard(newerHold);
    if (no.error) return no; /* plant:u2-hold-shell */
    return fn(e, ...a);
  };
}
function hear(channel, fn) {
  IPC.on(channel, (e, ...a) => {
    if (!ownFrame(e.senderFrame, UI)) return;
    if (OPEN_STOPPED.has(channel)) { fn(e, ...a); return; }
    worksNow().then((works) => { if (works) fn(e, ...a); });
  });
}
/* WHAT STAYS OPEN WHILE THIS STUDIO DOES NOT WORK (studioWorks, beside licenceNow; Max 2026-11-17 19:35, of Studio: "sign in
   first, one 14 day trial, nothing before it"). Every channel answer() or hear() opens is named in exactly one of these two sets,
   by one test: a channel stays open only if it neither shows nor changes a project, and three kinds yield to the criterion: the way
   out (every export, so a person can always save what is theirs), an act that only takes away and gives no one anything, and the
   sign-in's own. answer() refuses every channel not in OPEN_STOPPED while Studio does not work (worksNow); CLOSED_STOPPED names
   what that refuses, so a channel cannot go unplaced. tests/shell-guards.mjs 21 holds the table whole, 22 the gate. */
const OPEN_STOPPED = new Set([
  /* The page's start and its settings: no project in them, for host's tabs are empty while Studio does not work (tabsNow). */
  "studio:host", "studio:ui-lang", "studio:theme", "studio:prefs", "studio:shortcuts", "studio:tour", "studio:reset-defaults",
  "studio:agreement", "studio:maker", "studio:window", "studio:zoom",
  /* THE WAY OUT: whatever a person made is theirs to save, so every export stays open and a Studio that does not work still hands
     each project's cards out as a sheet, an edition out as a file, the audit pack and the statistics workbook, each with its
     picker, the archive's list the editions are named from, and the library's list the projects are named from (a way out that
     cannot name what it saves is none; the list is the library's, row by row, and the page of a Studio that does not work draws
     none of it). They read a project and write elsewhere; none changes one. */
  "studio:projects", "studio:csv-pick", "studio:csv-export", "studio:archive", "studio:export-pick", "studio:export-edition",
  "studio:audit-pack-pick", "studio:audit-pack", "studio:stats-export-pick", "studio:stats-export",
  "studio:login-item-set", "studio:login-item-state", "studio:close-policy-set", "studio:close-policy-state",
  "studio:notifications-set", "studio:tray-badge-set", "studio:tray-bubble-set", "studio:notify-proposals-set", "studio:notify-requests-set",
  "studio:notifications-state", "studio:clear-local-memory", "studio:clear-local-memory-undo",
  "studio:reset", "studio:reset-again", "studio:reset-stop", "studio:maintenance",
  /* The signing key's facts and its backup copy, which only copies out. */
  "studio:signing", "studio:key-backup",
  /* The licence, the sign-in and its door, the check, and the owner's seats. */
  "studio:licence", "studio:licence-signin", "studio:licence-signin-stop", "studio:licence-signin-again", "studio:licence-signout",
  "studio:signin-door", "studio:licence-check", "studio:licence-team", "studio:licence-accept",
  "studio:licence-switch", "studio:licence-seats", "studio:licence-seat-free",
  /* Board 1017: the owner names a lead by address or from the licence's people, withdraws a naming, and confirms a candidate. */
  "studio:licence-name-address", "studio:licence-name-person", "studio:licence-naming-withdraw", "studio:licence-candidate-confirm",
  /* Updates, the company proxy's question, and the clipboard the door's Copy writes through. */
  "studio:update", "studio:update-later", "studio:update-open", "studio:buy-open", "studio:proxy-asks", "studio:proxy-answer", "studio:copy",
  /* Acts that only take away and give no one anything (Claude alpha, 2026-11-18 10:37): a person off a team, an invitation cancelled,
     the team key moved, a seat freed, a followed team left. Each still answers to its own refusals where there is nothing to do. */
  "studio:member-remove", "studio:invite-cancel", "studio:team-key-move", "studio:seat-free", "studio:follow-leave"]);
const CLOSED_STOPPED = new Set([
  /* The signing key made, set aside, removed or restored: no project, but only project work signs with it. */
  "studio:key-aside", "studio:key-make", "studio:key-remove", "studio:key-restore-pick", "studio:key-restore",
  /* The library's folder and its tabs. */
  "studio:tabs", "studio:teams", "studio:team-end", "studio:pick-root", "studio:pick-folder",
  "studio:open", "studio:new", "studio:discard-untouched", "studio:row-facts", "studio:project-remove", "studio:reveal", "studio:show",
  /* Importing. */
  "studio:import-pick", "studio:bring-pick", "studio:import-dropped", "studio:import-paste", "studio:import-plan", "studio:import-land",
  "studio:v1-pick", "studio:sample-pick", "studio:v1-plan", "studio:v1-land",
  "studio:sheet-plan", "studio:sheet-land",
  /* Editing a draft. */
  "studio:save-card", "studio:set-folder", "studio:tag-add", "studio:tag-rename", "studio:tag-save", "studio:tag-move", "studio:tag-delete",
  "studio:lang-add", "studio:lang-move", "studio:lang-remove", "studio:comment-lang", "studio:facts", "studio:variables",
  "studio:card-add", "studio:card-duplicate", "studio:card-delete", "studio:card-retire", "studio:card-restore", "studio:card-undo",
  "studio:card-not-promise", "studio:pair-not-path", "studio:finding-left", "studio:end-not-path", "studio:number-dismiss",
  "studio:card-history", "studio:card-restore-text", "studio:card-diff", "studio:find-places", "studio:replace-places",
  "studio:cards-retire", "studio:cards-move", "studio:cards-delete", "studio:cards-undo", "studio:cards-commit", "studio:changes",
  "studio:change-undo", "studio:cards-not-promise", "studio:rename", "studio:file-name", "studio:linked-copy", "studio:bring-up",
  "studio:base-take",
  /* The archive's diff and rollback, the audit, publishing and statistics. */
  "studio:diff", "studio:edition-restore", "studio:audit", "studio:publish-plan", "studio:publish", "studio:stats-span", "studio:stats",
  /* Proposals and flags. */
  "studio:proposals", "studio:proposal-open", "studio:proposal-decide", "studio:proposal-revert", "studio:flag-keep",
  /* A project's team, its desks, people and seats, and the relay licence's lapse notice, which names projects. */
  "studio:desks", "studio:desk-refuse", "studio:invite-make",
  "studio:invite-copy", "studio:tried-dismiss",
  "studio:policy-save", "studio:policy-copy", "studio:catalog-import", "studio:copy-import",
  "studio:catalog-withdraw", "studio:team-exports", "studio:team-sharing", "studio:team-sealed", "studio:team-choose",
  "studio:team-leave", "studio:team-move-catalog", "studio:team-let-go", "studio:team-relay", "studio:team-handover",
  "studio:relay-lapse", "studio:relay-lapse-seen",
  "studio:seat-stay", "studio:people-list", "studio:person-admit",
  /* Board 1017's member invitation: a lead invites an address, withdraws it, and confirms or declines an unvouched Join. */
  "studio:person-invite", "studio:person-invite-withdraw", "studio:person-confirm", "studio:person-decline",
  /* Following another lead's team. */
  "studio:follow-join", "studio:follow-state",
  /* The customer's own AI: its settings serve only project work, and its jobs are project work. */
  "studio:ai-settings", "studio:ai-save", "studio:ai-test", "studio:ai-job-line", "studio:ai-job-send", "studio:ai-drafts",
  "studio:ai-draft-accept", "studio:ai-draft-discard", "studio:ai-job-cancel"]);

/* AN ACT ON A PATH TAKES ONLY THE ONE ITS PICKER ANSWERED (src/chosen.cjs), and any other is
   answered null, as a stranger is. The page is still told the path, to show it and hand it back. */
const chosen = chooser();
function unchosen(channel, p) {
  const shown = typeof p === "string" ? JSON.stringify(p) : typeof p;
  process.stderr.write("studio  " + channel + " named " + shown + ", which no picker answered\n");
  return null;
}

/* THE REFUSAL TRAVELS AS WHAT IT WAS BUILT FROM, beside the English. `said` is the frame and
   its variables (src/refusal.mjs), and the page says it at paint time, because the English
   sentence has already lost the id and the count that would have to be put back. A throw that
   is not one of the class has no `said` and the page shows its message as it stands. */
function bad(e) {
  return { error: e && e.message ? e.message : String(e), said: (e && e.said) || null,
           disk: !!(e && e.disk) };
}
/* A FAULT OF THE DISK IS SAID HERE, ONCE, FOR EVERY VERB (src/refusal.mjs, diskRefusal). */
async function guard(fn) {
  try { return ok(await fn()); }
  catch (e) { return bad((await refusal()).diskRefusal(e)); }
}

/* STUDIO_LANG opens the interface in a language whatever the desk's locale says and whatever the
   translation table still lacks. It exists for two readers: whoever is judging the Polish before
   the last pair of words has landed, and tests/polish.mjs, which drives the window exactly as a
   person would rather than reaching into the page to set a variable. An untranslated string falls
   back to English visibly, which is the point of looking. Nothing about an installed copy changes
   when the variable is unset, which it is everywhere but here. */
/* WHICH KEY THIS COPY OF STUDIO WOULD SIGN WITH. The file lives beside Studio's own settings,
   which is what Maxim's ruling of 2026-09-19 means by "beside Studio" on a desk: the same
   userData folder studio.json sits in, and NOT in the store itself - no key of any kind goes in
   there. STUDIO_SIGNING_KEY points a gate at a scratch key file and is set nowhere else. The
   answer carries the keyId and the public half only; keySecret() alone opens the private one, for one signature. */
/** WHERE THIS COPY'S KEY FILE IS, which signingNow() answers ABOUT and the audit pack needs the
 *  path of. One statement of the rule, so a pack cannot name a different key from the one the
 *  Settings row shows. Nothing here opens it. */
function keyFileNow() {
  return testOnly("STUDIO_SIGNING_KEY")
    ? testOnly("STUDIO_SIGNING_KEY")
    : studio().then((S) => S.defaultKeyFile(app.getPath("userData")));
}

/** WHERE THIS COPY'S LICENCE FILE IS. Sits in userData folder beside studio.json. */
function licenceFileNow() {
  return testOnly("STUDIO_LICENSE_FILE") || testOnly("STUDIO_LICENCE_FILE")
    ? (testOnly("STUDIO_LICENSE_FILE") || testOnly("STUDIO_LICENCE_FILE"))
    : studio().then((S) => S.defaultLicenceFile(app.getPath("userData")));
}

/* THE KEY'S FACTS FOR THE PAGE: the key as src/studio.mjs reads it, the backup copy this Studio made of it or restored it
   from (the store's `keyBackup`, a date and a folder, never a key), and how many desks it has admitted, which is what makes
   the backup disc matter (K9c, Maxim 2026-10-07 21:10). */
async function signingNow() {
  const S = await studio(), K = await teamStore();
  const sign = S.signingKey(await keyFileNow()), b = readStore().keyBackup;
  /* Only while a handover waits for its old key (board 984), so every other answer is the one it was. */
  const wanted = readStore().handover ? !!(await handoverWantsOldKey()) : false; /* plant:984-wanted */
  return Object.assign(sign, { backup: b && b.keyId === sign.keyId && sign.keyId ? b : null,
    admitted: K.admittedOf(await teamsAt()), leads: K.watchedTeams(await teamsAt()).length > 0, canKeep: vault.available(), ...(noKeyring() ? { noKeyring: true } : {}),
    ...(wanted ? { oldKeyWanted: true } : {}) });
}

/* THE SIGNING KEY IS KEPT BY THE OPERATING SYSTEM (Maxim 2026-10-07 20:42): its private half is opened here by the vault and
   handed to the thread for one signature, as a team key is, and the page types no passphrase. A passphrase-wrapped key file
   (the command line's, a backup copy put in its place, or a gate's under STUDIO_SIGNING_KEY) opens with STUDIO_KEY_PASSPHRASE
   under the harness and with nothing on a desk, where it is restored once to be kept here. */
const signLib = lazy("sign.mjs");
/* `use` says what the secret is for. Handed out for anything but these, it is handed out to sign, and a key this Studio made at
   activation is from then on one that has signed (keySpent, item 10): "probe" only tries whether it opens, "open" opens a box or a
   recovery copy and signs nothing, and "licence" signs the licence service's own requests, which a restore brings to the restored
   key. The mark is written before the secret leaves, with no await between, so a signature always follows its mark. */
const KEY_QUIET = new Set(["probe", "open", "licence"]);
async function keySecret(use) {
  const S = await signLib();
  let read = null;
  try { read = S.readKeyFile(await keyFileNow()); } catch { return ""; }
  if (!read) return "";
  let secret = "";
  if (read.kept !== S.OS_WRAP) secret = testOnly("STUDIO_KEY_PASSPHRASE");
  else { try { secret = String(vault.open(Buffer.from(String(read.doc.private), "base64"))); } catch { secret = ""; } }
  if (secret && !KEY_QUIET.has(use)) keySpent(read.public); /* plant:k10-spend */
  return secret;
}
/* A KEY MADE AT ACTIVATION, OR BY MAKE A SIGNING KEY, AND WHETHER IT HAS SIGNED (the test architect's triage, item 10, and
   hold 2). On a new computer a lead who activates first gets a key made by the activation itself (leadReady), and a lead who
   presses Make a signing key first gets one the same way (studio:key-make). The team key's backup copy, restored after, used to
   be refused for either. The store's `keyMade` remembers that key ({pub, relay}: its public half and the relay teams whose space
   was already made when it was made) and `used` once the key is handed out to sign. A restore may replace it only while all of
   these hold, each a fact this process reads: the key in place is that key, kept by the operating system; it was never handed out
   to sign (an edition, a team file, a ring, an admission, a removal, a desk's ask, anything keySecret gives out but a probe, an
   opened box or the licence's own requests); and no relay team's space was made since it was made, which is the relay accepting
   a grant posted under it (one the relay refused leaves nothing there). The key replaced is copied aside first, never lost. */
/* Every key handed out to sign in this run, held here as well as in the store, so one whose mark the store refused or could not
   be read for (a newer Studio's saved data, a disc that will not take it) is never taken as unused. */
const keySpentHere = new Set();
function keySpent(pub) {
  keySpentHere.add(pub);
  const s = readStore(), m = s.keyMade;
  if (!m || typeof m !== "object" || m.pub !== pub || m.used === true) return;
  writeStore(Object.assign({}, s, { keyMade: Object.assign({}, m, { used: true }) }));
}
function keyUnspent(have, K, teamsFile) {
  if (!have || !have.public) return false;
  if (keySpentHere.has(have.public)) return false; /* plant:k27-spent-here */
  const kept = readStore().keyMade, m = kept && typeof kept === "object" ? kept : {};
  if (m.pub !== have.public) return false; /* plant:k10-made */
  if (m.used === true) return false; /* plant:k10-used */
  const before = Array.isArray(m.relay) ? m.relay : [];
  let made = null;
  try { made = K.relayTeams(teamsFile).filter((t) => t.created).map((t) => t.rt); } catch { return false; }
  return made.every((rt) => before.includes(rt)); /* plant:k10-relay */
}
function todayStamp() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
/* NO KEY IS WRITTEN OVER ANOTHER IT DID NOT MEAN TO REPLACE. `fits`, the caller's test of what sits in the key's place, runs
   with no await between it and the write, so whatever wrote there during the caller's own awaits is seen: a key made
   (makeKey) writes only where there is no key file, so a Make press and a first publish or seal racing each other leave
   the key written first and the other refuses (Clement omega's read of first-key, condition 1); a restore replaces a
   passphrase-wrapped key in the key's place and refuses an operating-system key of another public half, one a first
   publish made while the copy was being opened among them (his note 357 on 2ee8bfe). */
async function keepHere(pair, fits) {
  const R = await refusal(), S = await signLib();
  if (!vault.available()) throw R.refuse(noKeyring()
    ? "This computer cannot keep a signing key for this account: no keyring is open to seal it. To have one, install GNOME Keyring (the gnome-keyring package) or KDE Wallet, sign in again and reopen Studio."
    : "This computer cannot keep a signing key for this Windows account.");
  const at = await keyFileNow();
  if (fits) fits(at, R, S);
  fs.mkdirSync(path.dirname(at), { recursive: true });
  writeWhole(at, JSON.stringify(S.osFile(pair, vault.seal(pair.der)), null, 1) + "\n", { mode: OWNER_ONLY });
}
/* A team key this Studio does not hold, brought back out of the team's recovery copy under the signing key (P2), so a key
   restored on a new computer seals and admits as before. Nothing is asked and nothing is said where it does not open. */
/* This computer's teams file, named on every read of a project's folder. */
function withHere(o) {
  return Object.assign({ userData: app.getPath("userData"), followed: followedSeen }, o || {});
}

const activeTeamActs = new AsyncLocalStorage();
const teamLocks = new Map();
/* Who holds each team's lock now (a token per act), and the locks an act has lent to the relay sync it awaits (board 962 stage 5, T3,
   the test architect's read of T1 r2). The sync runs outside every act (relaySync's exit), so a runner write reached from it would
   wait on a lock whose holder waits on the sync: lent, it runs at once instead, while that holder still holds the lock and nothing of
   the holder's runs. A lend ends with the sync it was made for, and counts for nothing once its holder has let the lock go. */
const teamHolders = new Map(), teamLent = new Map(), lendWaiters = new Map();

async function teamAct(key, fn) {
  const k = String(key || "new");
  const active = activeTeamActs.getStore();
  if (active && active.has(k)) { throw new Error("teamAct nested call for " + k); } /* plant:team-act-nested */
  const prev = teamLocks.get(k) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => { release = resolve; });
  teamLocks.set(k, current);
  await prev.catch(() => {}); /* plant:team-act */
  const nextSet = new Set(active || []);
  nextSet.add(k);
  let ended;
  const holder = { done: new Promise((resolve) => { ended = resolve; }), closed: false, inline: new Set() };
  teamHolders.set(k, holder);
  try {
    return await activeTeamActs.run(nextSet, fn);
  } finally {
    /* THE LOCK IS NOT LET GO WITH A LENT WRITE STILL RUNNING (the test architect's read of 973f615f, 1): a sync the act asked and did
       not await keeps its lend past the act's last line, and a runner write it let in may be inside its first await. So the holder
       closes (no new lent write starts), its lend goes, the writes waiting outside look again, and the lent writes already entered
       are waited out before the next act on this team may start. A write still waiting outside is not waited on: it waits on us. */
    holder.closed = true;
    const lentNow = teamLent.get(k);
    if (lentNow && lentNow.holder === holder) teamLent.delete(k);
    const waiting = lendWaiters.get(k);
    if (waiting) for (const wake of Array.from(waiting)) wake();
    if (holder.inline.size) await Promise.allSettled(Array.from(holder.inline)); /* plant:team-act-inline */
    if (teamHolders.get(k) === holder) teamHolders.delete(k);
    if (teamLocks.get(k) === current) teamLocks.delete(k);
    ended();
    release();
  }
}
/* The runner's way into a team's lock (its d.teamAct): inside the act that holds it, reached through that act's own awaits, the write
   runs as part of the act; where the holder has lent the lock to the sync it awaits, the write runs at once. Otherwise it waits, not
   queued behind the acts, until the lock is free or its holder lends it, since an act that starts while it waits may yet await this
   very sync: queued, the write would wait on that act and the act on the write. */
async function runnerTeamAct(key, fn) {
  const k = String(key || "new"), active = activeTeamActs.getStore();
  if (active && active.has(k)) return fn();
  for (;;) {
    const holder = teamHolders.get(k), lent = teamLent.get(k);
    if (holder && !holder.closed && lent && lent.holder === holder && lent.n > 0) { /* plant:team-lend */
      const entered = Promise.resolve().then(fn);
      holder.inline.add(entered);
      entered.then(() => holder.inline.delete(entered), () => holder.inline.delete(entered));
      return entered;
    }
    if (!holder && !teamLocks.has(k)) return teamAct(k, fn);
    const until = holder ? holder.done : teamLocks.get(k);
    let wake = null;
    await new Promise((resolve) => {
      wake = resolve;
      const w = lendWaiters.get(k) || new Set();
      w.add(wake);
      lendWaiters.set(k, w);
      Promise.resolve(until).then(resolve, resolve);
    });
    const w = lendWaiters.get(k);
    if (w) { w.delete(wake); if (!w.size) lendWaiters.delete(k); }
  }
}
/* A sync run once from inside an act, lent as relaySync is (the test architect's read of 973f615f, 2): relayOnce runs the runner
   outside every act, so unlent its team write would wait on the act that waits on it. `job` stands in for relayOnce in a gate. */
function relayOnceLent(job) { return lendingTo(job || (() => relayOnce())); } /* plant:relay-once-lent */
/* `fn` run outside every act, as relayOnce runs the runner; for a gate. */
function outsideActs(fn) { return activeTeamActs.exit(fn); }
/* `job` (a sync) run with every lock the calling act holds lent to it until it settles. */
function lendingTo(job) {
  const active = activeTeamActs.getStore();
  const lends = [];
  for (const k of active || []) {
    const holder = teamHolders.get(k);
    if (!holder || holder.closed) continue;
    let l = teamLent.get(k);
    if (!l || l.holder !== holder) { l = { holder, n: 0 }; teamLent.set(k, l); }
    l.n++;
    lends.push([k, l]);
    const w = lendWaiters.get(k);
    if (w) for (const wake of Array.from(w)) wake();
  }
  const p = job();
  if (!lends.length) return p;
  const end = () => { for (const [k, l] of lends) { l.n--; if (l.n <= 0 && teamLent.get(k) === l) teamLent.delete(k); } };
  return Promise.resolve(p).finally(end);
}

async function teamKeyFor(dir, namedTeam) {
  if (namedTeam && typeof namedTeam === "string" && namedTeam !== "new") return namedTeam;
  if (dir == null || dir === "") return "new";
  const project = projectDir(dir);
  let p = null;
  if (project) {
    try { p = JSON.parse(fs.readFileSync(path.join(project, "project.json"), "utf8")); } catch { p = null; }
  }
  if (p && typeof p.sealedTeam === "string" && p.sealedTeam) return p.sealedTeam;
  /* A catalog part way through a move (board 962 stage 6) has let its old team go and not yet joined the new one: its acts still
     take the old team's lock, so a publish cannot interleave with the move's second press. */
  if (p && p.moving && typeof p.moving.from === "string" && /^t-[0-9a-f]{16}$/.test(p.moving.from)) return p.moving.from; /* plant:key-for-moving */
  const K = await teamStore(), at = await teamsAt();
  const here = p ? K.folderHere(p, withHere()) : null;
  const f = here ? (project ? path.resolve(project, here) : path.resolve(here)) : null;
  const forFolder = f ? K.teamForFolder(at, f) : null;
  if (forFolder) return forFolder;
  return "new";
}
/* Seal this computer's book into the team file and keep that write where a sealed choice already exists. A relay team
   is uploaded by the sync that follows. Nothing is returned to the page. A failure is said and the act that asked stands. */
async function publishLead(teamId, folder) {
  try {
    const secret = await keySecret();
    if (!secret || !teamId || !folder) return;
    const T = await teamLib(), K = await teamStore(), keyFile = await keyFileNow();
    const at = await teamsAt(), work = folder;
    /* A stale refusal (the file moved on since it was read: board 962 stage 5) reads the team once more and writes the book onto it. */
    let wrote = null, kept = null;
    for (let round = 0; ; round++) {
      const held = await T.heldTeam(work, { key: keyFile });
      if (!held || !held.team || held.team.id !== teamId) return;
      const keys = K.teamKeysOf(at, vault), epochKey = keys[teamId] && keys[teamId][held.team.epoch];
      kept = K.keptTeam(at, teamId);
      try {
        wrote = await (await leadBook()).publishLeadBook({
          folder: work, team: held.team, keyFile, secret, teamsFile: at, vault,
          teamKey: epochKey ? Buffer.from(epochKey) : null, ledger: readLanded(folder),
          keptFile: kept && kept.file, now: Date.now(),
        });
        break;
      } catch (e) { if (e && e.stale && round === 0) continue; throw e; }
    }
    if (wrote && wrote.team && kept && typeof kept.sealed === "boolean")
      K.chooseSealed(at, teamId, kept.sealed, kept.folder || folder, wrote.team);
    if (K.relayTeams(at).some((w) => w.team === teamId)) relaySync();
  } catch (err) {
    process.stderr.write("studio  the lead's book could not be written: " + String(err && err.message || err) + "\n");
  }
}
/* The team file's rev and lead last absorbed per folder: a watch pass where only a desk's file changed reads the
   file and returns before keySecret and absorbLeadBook, avoiding scrypt opens on the main thread. */
const absorbMemo = new Map();
/* Read the book off the team file into this computer's profile. An older file, or one this key does not lead, is left
   by heldTeam. Where the switch moved and a sealed choice already exists, an older kept copy learns the file. */
async function absorbLeadFolder(folder) {
  try {
    if (!folder) return;
    const T = await teamLib(), keyFile = await keyFileNow();
    const held = await T.heldTeam(folder, { key: keyFile });
    if (!held || !held.team) return;
    const rev = Number(held.team.rev) || 0;
    const lead = held.team.lead && held.team.lead.public ? held.team.lead.public : String(held.team.lead || "");
    const memo = absorbMemo.get(path.resolve(folder));
    if (memo && memo.rev === rev && memo.lead === lead) return; /* plant:f8-absorb-memo */
    const secret = await keySecret("open");
    if (!secret) return;
    const K = await teamStore(), at = await teamsAt();
    const kept = K.keptTeam(at, held.team.id), ledger = readLanded(folder);
    const applied = await (await leadBook()).absorbLeadBook({
      team: held.team, keyFile, secret, teamsFile: at, vault, folder,
      keptFile: kept && kept.file, ledger, now: Date.now(),
    });
    if (applied && applied.ledger) writeLanded(folder, ledger);
    if (applied && applied.auto && kept && typeof kept.sealed === "boolean" && kept.file) {
      const fileRev = Number(held.team.rev) || 0, keptRev = Number(kept.file.rev) || 0;
      if (keptRev <= fileRev) K.chooseSealed(at, held.team.id, kept.sealed, kept.folder || folder, held.team);
    }
    /* Last, and only where the recovery copy opened: a throw above, or a copy that did not open, is read again at the
       next run and not left until the team file's rev moves. */
    if (applied && applied.opened) absorbMemo.set(path.resolve(folder), { rev, lead }); /* plant:f8-absorb-opened */
  } catch (err) {
    process.stderr.write("studio  the lead's book could not be read: " + String(err && err.message || err) + "\n");
  }
}
async function bringBack(dir) {
  const secret = await keySecret("open");
  if (!secret) return;
  const K = await teamStore(), at = await teamsAt();
  let p = null;
  try { p = JSON.parse(fs.readFileSync(path.join(projectDir(dir), "project.json"), "utf8")); } catch { p = null; }
  const isRelay = !!(p && p.sealedTeam && p.relay && /^[0-9a-f]{32}$/.test(String(p.relay.rt || "")) && !K.keptTeam(at, p.sealedTeam));
  /* The mirror is empty until this key opens what the relay sends, and the recovery copy is in the team file. This one
     read uses the folder project.json stores, which on the computer that made the team is the mirror and on another is
     that computer's own path, present here only while the two share a disk. */
  const r = await thread.call("teamKeyBack", projectDir(dir), await keyFileNow(), secret,
    { teamKeys: (await teamsNow()).teamKeys }).catch(() => null);
  if (r) {
    try { K.keepTeamKey(at, vault, r.id, r.epoch, Buffer.from(r.key)); } catch {}
  }
  if (isRelay) {
    const mirror = K.keepRelay(at, p.sealedTeam, p.relay.rt, String(p.relay.url || ""));
    /* The mirror is this computer's, and it is kept in the teams file above. The shared project.json keeps the folder
       the first computer wrote. Writing this computer's path over it sent the first computer after a path that is not
       its own. The plant puts that write back. */
    if (false && p.folder !== mirror) { /* plant:h2-folder */
      p.folder = mirror;
      writeWhole(path.join(projectDir(dir), "project.json"), JSON.stringify(p, null, 1) + "\n");
    }
    /* Before the mirror has the team file, the shared project is this computer's record of the lead key the team was
       made with. The row keeps it, so a refused create under another key is said as that and not as a place taken. */
    const namedLead = p.relay && /^[0-9a-f]{64}$/.test(String(p.relay.lead || "")) ? String(p.relay.lead) : "";
    if (namedLead) {
      const row = K.relayTeams(at).find((w) => w.team === p.sealedTeam);
      const teamFile = (await teamLib()).teamPath(mirror);
      if (row && !row.lead && !fs.existsSync(teamFile)) K.markRelay(at, p.sealedTeam, { lead: namedLead });
    }
    await relaySync();
    if (relayRunner) await relayRunner.idle();
  }
  const r2 = r || await thread.call("teamKeyBack", projectDir(dir), await keyFileNow(), secret,
    withHere({ teamKeys: (await teamsNow()).teamKeys, folder: isRelay ? K.relayMirror(at, p.relay.rt) : "" })).catch(() => null);
  /* The key may already be held, and teamKeyBack then answers nothing. The book is still read, from this computer's
     own folder for the project. */
  await absorbLeadFolder((await teamOf(projectDir(dir))).folder);
  if (!r2) return;
  try {
    K.keepTeamKey(at, vault, r2.id, r2.epoch, Buffer.from(r2.key));
    const finalFolder = isRelay ? K.relayMirror(at, p.relay.rt) : r2.folder;
    K.chooseSealed(at, r2.id, r2.sealed, finalFolder, r2.written);
  }
  catch { /* a key this computer cannot seal stays where it was, in the share's recovery copy */ }
}

/* K4 and K5: one press makes the key, kept here; a key already there, or a file that will not read, is never replaced. */
async function keyNone() {
  const S = await signLib();
  try { return !S.readKeyFile(await keyFileNow()); } catch { return false; }
}
const makeKey = async () => keepHere(await (await signLib()).makePair(), (at, R) => {
  if (fs.existsSync(at)) throw R.refuse("This Studio has a signing key already, so no other was made.");
});
/* K5: setting current key aside to make a new one, recorded in store so findOldKey reads that record. */
async function setKeyAsideAndMakeNew() {
  const R = await refusal(), S = await signLib(), at = await keyFileNow();
  let held = null;
  try { held = S.readKeyFile(at); }
  catch {
    throw R.refuse("{FILE} in {FOLDER} is not a signing key this Studio can read, so no new key was made over it. Once it is moved out of that folder, Studio can make a new key; catalogs signed by the old key then verify only with the old key's backup copy.",
      { FILE: path.basename(at), FOLDER: path.dirname(at) });
  }
  if (!held || !held.public) {
    await makeKey();
  } else {
    const keyId = String(held.keyId || "").replace(/[^0-9a-z-]/gi, "") || "prev";
    const dir = path.dirname(at);
    let asidePath = path.join(dir, "signing-key.old-" + keyId + ".json");
    let idx = 1;
    while (fs.existsSync(asidePath)) {
      asidePath = path.join(dir, "signing-key.old-" + keyId + "-" + idx + ".json");
      idx++;
    }
    /* THE SLOT IS NEVER EMPTY: the aside copy is written whole first, then the new key replaces the old in one rename
       (keepHere's writeWhole), so a seal or a write that fails, or a stop between any two steps, leaves the old key in place. */
    const bytes = fs.readFileSync(at, "utf8");
    writeWhole(asidePath, bytes, { mode: OWNER_ONLY }); /* plant:k27-aside-copy */
    const pair = await S.makePair();
    await keepHere(pair, (where, R2) => {
      let now = null;
      try { now = fs.readFileSync(where, "utf8"); } catch { now = null; }
      if (now !== bytes) throw R2.refuse("This Studio has a signing key already, so no other was made.");
    });

    const cur = readStore();
    const oldSigningKeys = Array.isArray(cur.oldSigningKeys) ? cur.oldSigningKeys.slice() : [];
    oldSigningKeys.push({ file: asidePath, keyId: held.keyId, public: held.public, when: todayStamp() });
    writeStore(Object.assign({}, cur, { oldSigningKeys }));
  }

  const keptTeams = await teamStore();
  let relay = [];
  try { relay = keptTeams.relayTeams(await teamsAt()).filter((t) => t.created).map((t) => t.rt); } catch { relay = []; }
  writeStore(Object.assign({}, readStore(), { keyMade: { pub: await leadPub(), relay } }));
  return signingNow();
}
answer("studio:key-aside", async () => guard(async () => setKeyAsideAndMakeNew()));
/* A key file that does not read is not "a key already": the lead who has it and no backup copy is told where it is, that moving
   it out of the folder lets Studio make a new key, and what that costs the catalogs the old key signed (board 931, condition 9,
   finding 8). The remedy is the sentence; Studio moves nothing of the lead's. */
answer("studio:key-make", async () => guard(async () => {
  const R = await refusal(), S = await signLib(), at = await keyFileNow();
  let held = false;
  try { held = !!S.readKeyFile(at); }
  catch {
    throw R.refuse("{FILE} in {FOLDER} is not a signing key this Studio can read, so no new key was made over it. Once it is moved out of that folder, Studio can make a new key; catalogs signed by the old key then verify only with the old key's backup copy.",
      { FILE: path.basename(at), FOLDER: path.dirname(at) });
  }
  if (held) throw R.refuse("This Studio has a signing key already, so no other was made.");
  await makeKey();
  /* Remembered as made here, as a key the activation makes is (leadReady), so a team key's backup restored next may take its
     place while this key has signed nothing and no relay space was made under it. The key set aside is copied, never deleted. */
  const keptTeams = await teamStore();
  let relay = [];
  try { relay = keptTeams.relayTeams(await teamsAt()).filter((t) => t.created).map((t) => t.rt); } catch { relay = []; }
  writeStore(Object.assign({}, readStore(), { keyMade: { pub: await leadPub(), relay } })); /* plant:h2-keymade */
  return signingNow();
}));
/* THE FIRST PUBLISH OR SEAL MAKES THE KEY (the sense pass of 2026-10-14, finding 9; Maxim 2026-10-13 15:51: "Etiuda is meant
   to empower and enhance, not limit and cage."): until the lead found Settings, editions went out unsigned and every desk was
   offered each new one as a stranger's. So a Studio with no key file makes its key with nothing asked, by key-make's own act,
   where nothing at the folder trusts another key: no team file there, no team this Studio kept for it and no seal the project
   remembers. Where the folder's team trusts a key this computer has not got, nothing is made and the page is given that key's
   print, so Restore comes first (K8). An unreadable key file is never made over, and a computer that cannot keep a key goes on
   publishing unsigned. A lead who wants no key at all is Maxim's to rule; a switch for it would be read here. `facts` is the
   thread's teamFacts for the project. */
async function firstKey(facts) {
  const f = facts && typeof facts === "object" ? facts : {};
  if (!f.folder || !(await keyNone())) return { make: false, lead: "" };
  if (await savedNewerNow()) return { make: false, lead: "" }; /* plant:u2-hold-first */
  if (f.file === "theirs" && /^[0-9a-f]{16}$/.test(String(f.lead || ""))) return { make: false, lead: String(f.lead) };
  const K = await teamStore();
  const make = f.file === "none" && !f.mark && !K.teamForFolder(await teamsAt(), f.folder) && vault.available();
  return { make, lead: "" };
}
/* The key made by firstKey's verdict, and remembered as made so: the next publish that lands asks the page for its one nudge
   towards a backup copy (keyNudgeNow). False where the vault refused at the last moment; the edition then goes out unsigned. */
async function makeFirstKey() {
  try { await makeKey(); } catch { return false; }
  const sign = await signingNow();
  writeStore(Object.assign({}, readStore(), { keyNudge: sign.keyId }));
  return true;
}
/* Once: true for the first publish that lands after a key was made by itself, while that key has no backup copy, and the mark
   is then taken off either way. */
async function keyNudgeNow() {
  const s = readStore();
  if (!s.keyNudge) return false;
  const sign = await signingNow(), due = sign.keyId === s.keyNudge && !sign.backup;
  const next = Object.assign({}, s);
  delete next.keyNudge;
  writeStore(next);
  return due;
}
/* THE RELAY TEAMS CARRIED ON THE KEY'S BACKUP COPY (board 932). A row is the team's place as this computer holds it and
   the recovery copy from its team file. The thread seals the rows under the signing key. An address that is not https is
   left out, and a restore then uses the built-in relay address. */
const RELAY_ROWS_MAX = 64;
async function relayRows() {
  const K = await teamStore(), T = await teamLib(), at = await teamsAt(), keyFile = await keyFileNow();
  const rows = [];
  let list = [];
  try { list = K.relayTeams(at); } catch { list = []; }
  for (const w of list) {
    if (rows.length >= RELAY_ROWS_MAX) break;
    if (!w || !/^[0-9a-f]{32}$/.test(String(w.rt || "")) || !/^t-[0-9a-f]{16}$/.test(String(w.team || ""))) continue;
    let held = null;
    try { held = await T.heldTeam(w.folder, { key: keyFile }); } catch { held = null; }
    const team = held && held.team;
    if (!team || team.id !== w.team || !team.recovery) continue;
    const ch = team.channel;
    if (!ch || ch.kind !== "relay" || ch.rt !== w.rt) continue;
    const kept = K.keptTeam(at, w.team) || {};
    const row = { team: w.team, rt: w.rt, epoch: team.epoch, recovery: JSON.parse(JSON.stringify(team.recovery)) };
    if (typeof w.url === "string" && /^https:\/\//.test(w.url)) row.url = w.url;
    if (kept.sealed === true || kept.sealed === false) row.sealed = kept.sealed;
    rows.push(row);
  }
  return rows;
}
function relayRowUrl(row, builtin) {
  const u = row && typeof row.url === "string" ? row.url : "";
  return /^https:\/\//.test(u) ? u : builtin;
}
/* A restore adds a relay team this computer does not hold, and leaves one it holds as it is. The same relay address may
   gain an epoch it does not have yet. A different address, or a team kept on a folder, is not touched. A new team is
   written whole or not at all, and the relay is asked to keep the mirror only where a team was added. */
async function relaysBack(rows) {
  const K = await teamStore(), at = await teamsAt(), Rl = await relayLib();
  let applied = false;
  for (const r of Array.isArray(rows) ? rows : []) {
    if (!r || typeof r !== "object") continue;
    let key;
    try { key = Buffer.from(r.key); } catch { continue; }
    if (key.length !== 32) continue;
    const team = String(r.team || ""), rt = String(r.rt || ""), epoch = r.epoch;
    if (!/^t-[0-9a-f]{16}$/.test(team) || !/^[0-9a-f]{32}$/.test(rt) || !Number.isInteger(epoch) || epoch < 1) continue;
    const held = K.keptTeam(at, team);
    if (held) {
      const same = !!(held.relay && held.relay.rt === rt);
      if (!same) continue; /* plant:s932-keep */
      try { K.keepTeamKey(at, vault, team, epoch, key); } catch { /* a different key under the same number stands */ }
      continue;
    }
    const url = relayRowUrl(r, Rl.RELAY_URL); /* plant:s932-url */
    let made = false;
    try {
      K.keepTeamKey(at, vault, team, epoch, key);
      made = true;
      K.keepRelay(at, team, rt, url);
      if (typeof r.sealed === "boolean") K.chooseSealed(at, team, r.sealed);
      applied = true;
    } catch {
      if (made) { try { K.forgetTeam(at, team); } catch { /* already gone */ } }
    }
  }
  if (applied) relaySync(); /* plant:s932-sync */
}
/* Every team key the vault opens, one row an epoch. A pending epoch is marked, so a restore keeps it ahead of the
   team file rather than as the current key. */
async function epochRows() {
  const K = await teamStore(), at = await teamsAt();
  /* A read that fails refuses the backup through guard(): a copy without its team keys would be found out on the day of
     the restore. The pending marks may stay soft: without them a key is restored as current. */
  const keys = K.teamKeysOf(at, vault);
  let pending = {};
  try { pending = K.pendingEpochsOf(at); } catch { pending = {}; }
  /* Live keys, and the keys of a team this Studio has ended, which stay in the key backup after the slot is freed. */
  return K.epochRowsOf(at, vault, { keys, pending });
}
/* Keeps each epoch the vault can seal. One this computer already holds a different key for stays as it is. A pending
   epoch is marked pending after the key is kept. */
async function epochsBack(rows) {
  const K = await teamStore(), at = await teamsAt();
  for (const r of Array.isArray(rows) ? rows : []) {
    if (!r || typeof r !== "object") continue;
    let key;
    try { key = Buffer.from(r.key); } catch { continue; }
    if (key.length !== 32) continue;
    const team = String(r.team || ""), epoch = Number(r.epoch);
    if (!/^t-[0-9a-f]{16}$/.test(team) || !Number.isInteger(epoch) || epoch < 1) continue;
    try { K.keepTeamKey(at, vault, team, epoch, key); }
    catch { continue; }
    if (r.pending === true) { try { K.markKeyPending(at, team, epoch); } catch { /* the key is kept */ } }
  }
}
/* The member key and the team this Studio follows, for the backup copy (board 962, stage 7): null where there is no member key. */
async function memberRows() {
  const M = await memberLib(), K = await teamStore(), at = await teamsAt();
  const key = M.memberBackupRow(M.memberKeyFile(app.getPath("userData")), vault, { signingPublic: await signingPublicNow() });
  return key ? { key, follow: K.followBackupRow(at, vault) } : null;
}
/* The lead's books of people and seats the copy carries (src/studio.mjs peopleRowForBackup; Hydrogen's finding 4 (b)). */
function peopleRows() { return { people: readTeamPeople(), seats: readSeatBooks() }; }
/* A member key a copy brought back is kept where this Studio has none, and its followed team where it follows none. */
async function memberBack(row) {
  const M = await memberLib(), at = await teamsAt();
  try {
    if (M.memberFromBackup(M.memberKeyFile(app.getPath("userData")), vault, row.key, { signingPublic: await signingPublicNow() }) && row.follow)
      M.followFromBackup(at, vault, row.follow, (M.memberPublic(M.memberKeyFile(app.getPath("userData"))) || {}).id);
  } catch { /* the key stays restored; the team is joined again */ }
  followStart().catch(() => {});
}
/* K6: the backup copy, to a file the person names in the save dialog (STUDIO_TEST_BACKUP answers it), under the passphrase
   typed for it, which is kept nowhere. The store keeps the day and the folder, so the row and the disc know a copy exists. */
answer("studio:key-backup", async (e, passphrase, title, kind) => guard(async () => {
  const sign = await signingNow();
  let file = testOnly("STUDIO_TEST_BACKUP");
  if (!file) {
    const r = await pick("save", BrowserWindow.fromWebContents(e.sender), { title: String(title || ""),
      defaultPath: "etiuda-studio-key-" + String(sign.print || "").slice(0, 8) + ".json",
      filters: [{ name: String(kind || "Signing key").slice(0, 60), extensions: ["json"] }] });
    if (r.canceled || !r.filePath) return { canceled: true, signing: sign };
    file = r.filePath;
  }
  const done = await thread.call("backupKey", String(file), await keyFileNow(), await keySecret(), String(passphrase || ""),
    { relays: await relayRows(), epochs: await epochRows(), member: await memberRows(), people: peopleRows() });
  writeStore(Object.assign({}, readStore(), { keyBackup: { keyId: done.keyId, made: todayStamp(), where: path.dirname(done.file) } }));
  return { file: done.file, signing: await signingNow() };
}));
/* K7: a backup copy picked (STUDIO_TEST_RESTORE answers the dialog) is read for its key alone, before anything is typed. */
answer("studio:key-restore-pick", async (e, title, kind) => guard(async () => {
  let file = testOnly("STUDIO_TEST_RESTORE");
  if (!file) {
    const r = await pick("open", BrowserWindow.fromWebContents(e.sender), { title: String(title || ""),
      properties: ["openFile"], filters: [{ name: String(kind || "Signing key").slice(0, 60), extensions: ["json"] }] });
    if (r.canceled || !r.filePaths.length) return { file: chosen.keep("restore", null) };
    file = r.filePaths[0];
  }
  return Object.assign(await thread.call("readBackup", String(file)), { file: chosen.keep("restore", file) });
}));
const RESTORE_WAITS_MS = 5000;
/* A HANDOVER'S OLD KEY BROUGHT BACK FROM ITS BACKUP COPY (board 984). After a handover's step (ii) the new key leads, and step
   (iii) signs the team file with the old key read from the file the handover recorded (ho.oldKeyFile, resumeHandover). Where
   that file is gone, the old key's backup copy is the person's only copy, and the restore below refuses it, as it refuses any
   key over one that has signed. So a copy whose key is the one a handover under way is waiting for, while the key in the key's
   place is that handover's new key and the recorded file opens no key, is kept aside instead: sealed for this sign-in in a file
   of its own beside the key, recorded as an old signing key and as the handover's old key file. The key's place is never
   written, and the copy's relay, epoch and member rows are not taken, so the new key and what it keeps stay exactly as they
   were. Any other copy goes on to the restore below, which refuses it as before. */
/* The handover under way that waits for its old key, whatever copy is offered: the key in the key's place is its new key and
   the file it recorded opens no key. Settings' Signing key row offers the restore while one does (signingNow, oldKeyWanted),
   since the handover's line on the Desks screen sends the person there. */
async function handoverWantsOldKey() {
  const ho = readStore().handover;
  if (!ho || typeof ho !== "object" || !ho.oldPub || !ho.newPub) return null;
  const S = await signLib();
  let have = null;
  try { have = S.readKeyFile(await keyFileNow()); } catch { have = null; }
  if (!have || have.public !== ho.newPub) return null;
  if (ho.oldKeyFile && await openOldKey(String(ho.oldKeyFile))) return null; /* plant:984-recorded-opens */
  return ho;
}
async function handoverWaitsFor(pair) {
  if (!pair || !pair.public) return null;
  const ho = await handoverWantsOldKey();
  if (!ho || pair.public === ho.newPub) return null;
  /* Each guard on a line of its own, so that each is planted alone (tests/relay-studio.mjs, the 984 plants). */
  if (pair.public !== ho.oldPub) return null; /* plant:984-old-pub */
  return ho;
}
async function keepOldKeyAside(pair, ho) {
  const R = await refusal(), S = await signLib();
  if (!vault.available()) throw R.refuse(noKeyring()
    ? "This computer cannot keep a signing key for this account: no keyring is open to seal it. To have one, install GNOME Keyring (the gnome-keyring package) or KDE Wallet, sign in again and reopen Studio."
    : "This computer cannot keep a signing key for this Windows account.");
  /* Under the team's lock, as resumeHandover runs, so a resume that found no old key cannot write its record back over this one. */
  return teamAct(ho.team, async () => {
    const now = readStore().handover;
    if (!now || now.oldPub !== ho.oldPub || now.newPub !== ho.newPub) return false;
    const dir = path.dirname(await keyFileNow());
    const keyId = String(pair.keyId || "").replace(/[^0-9a-z-]/gi, "") || "prev";
    let asidePath = path.join(dir, "signing-key.old-" + keyId + ".json");
    for (let idx = 1; fs.existsSync(asidePath); idx++) asidePath = path.join(dir, "signing-key.old-" + keyId + "-" + idx + ".json");
    fs.mkdirSync(dir, { recursive: true });
    writeWhole(asidePath, JSON.stringify(S.osFile(pair, vault.seal(pair.der)), null, 1) + "\n", { mode: OWNER_ONLY });
    /* A file this sign-in cannot open again is not named anywhere, and the restore below then refuses the copy as before. */
    if (!(await openOldKey(asidePath))) return false;
    const cur = readStore();
    const oldSigningKeys = Array.isArray(cur.oldSigningKeys) ? cur.oldSigningKeys.slice() : [];
    oldSigningKeys.push({ file: asidePath, keyId: pair.keyId, public: pair.public, when: todayStamp() });
    /* `restored` marks a handover this restore set going again: whenever it ends after the restore has replied, in this run or at
       a later start, its ending is left for the Desks screen (resumeHandover). */
    const handover = Object.assign({}, cur.handover, { oldKeyFile: asidePath, restored: true }); /* plant:984-restored */
    delete handover.needs;
    writeStore(Object.assign({}, cur, { oldSigningKeys, handover }));
    return true;
  });
}
/* The copy opened by its passphrase, once, and the key kept here under this sign-in. A key already kept here that is not
   the copy's is never replaced; a passphrase-wrapped file in the key's place is, by the same key or, once copied aside, another. */
answer("studio:key-restore", async (e, file, passphrase) => !chosen.took("restore", file, false)
  ? unchosen("studio:key-restore", file) : guard(async () => {
  const pair = await thread.call("openBackup", String(file || ""), String(passphrase || ""));
  /* A handover waiting for this very key takes it aside and goes on at once, not at the next start only; where it cannot
     finish now (the relay out of reach), the record still names the file, and the next start resumes it as before. The reply
     waits for the record to clear, not for the relay's sync after it, and never longer than RESTORE_WAITS_MS: a handover still
     at step (ii) calls the relay before it clears, and off line each call lasts until the wire's idle limit (30 s), which no
     one should sit through on a dialog. Ended within that, the reply names the project, so the page says the handover's own
     ending on its Desks screen, as the press does; ended later, here or at a later start, the ending is left in the store for
     the Desks screen to say once (resumeHandover, desksNow). The handover's own steps take well under a second without the
     relay (b984a: the whole restore about 0.4 s), so five seconds waits out a slow disc and not an outage. */
  const waiting = await handoverWaitsFor(pair);
  if (waiting && await keepOldKeyAside(pair, waiting)) { /* plant:984-take */
    const ended = await new Promise((resolve) => {
      let late = false;
      const cap = setTimeout(() => { late = true; resolve(false); }, RESTORE_WAITS_MS); /* plant:984-cap */
      const stop = () => { clearTimeout(cap); resolve(false); };
      resumeHandover({ ended: () => { clearTimeout(cap); if (late) return false; resolve(true); return true; } }).then(stop, stop);
    });
    const signing = await signingNow();
    if (ended && waiting.projectDir) signing.handoverDone = String(waiting.projectDir);
    return signing;
  }
  const K = await teamStore(), teamsFile = await teamsAt();
  /* Looked at when the key is written, not before the copy is opened: a first publish may make a key in between. */
  let keyStood = false;
  await keepHere(pair, (at, R, S) => {
    let have = null;
    try { have = S.readKeyFile(at); } catch { have = null; }
    /* A key stood when this place already held one, whichever public half, with a box or without. */
    keyStood = !!(have && have.public);
    /* Another key kept here is replaced only where it is the one the activation made and has signed nothing (item 10), and is
       copied aside beside it first, still sealed for this sign-in; one that has signed stays, as before. */
    if (have && have.kept === S.OS_WRAP && have.public !== pair.public) {
      if (!keyUnspent(have, K, teamsFile)) throw R.refuse("This Studio keeps another signing key, so the copy was not restored."); /* plant:k10-unspent */
      const asidePath = at.replace(/\.json$/i, "") + ".made-at-activation-" + String(have.keyId || "").replace(/[^0-9a-z-]/gi, "") + ".json";
      fs.copyFileSync(at, asidePath);
      const curStore = readStore();
      const oldSigningKeys = Array.isArray(curStore.oldSigningKeys) ? curStore.oldSigningKeys.slice() : [];
      oldSigningKeys.push({ file: asidePath, keyId: have.keyId, public: have.public, when: todayStamp() });
      writeStore(Object.assign({}, curStore, { oldSigningKeys }));
    }
    /* A passphrase-wrapped key of another public half may have signed, and nothing here can tell: it is copied aside first, still
       under its own passphrase, so a backup of the wrong key never costs the key in place, and that copy restores as any backup. */
    if (have && have.kept !== S.OS_WRAP && have.public !== pair.public) { /* plant:k27-pass-aside */
      const stem = at.replace(/\.json$/i, "") + ".replaced-" + (String(have.keyId || "").replace(/[^0-9a-z-]/gi, "") || "prev");
      let asidePath = stem + ".json";
      for (let idx = 1; fs.existsSync(asidePath); idx++) asidePath = stem + "-" + idx + ".json";
      writeWhole(asidePath, fs.readFileSync(at, "utf8"), { mode: OWNER_ONLY });
      const curStore = readStore();
      const oldSigningKeys = Array.isArray(curStore.oldSigningKeys) ? curStore.oldSigningKeys.slice() : [];
      oldSigningKeys.push({ file: asidePath, keyId: have.keyId, public: have.public, when: todayStamp() });
      writeStore(Object.assign({}, curStore, { oldSigningKeys }));
    }
    /* A copy made before the first team file carries no box. Where the key already in this place
       is that same key and already has one, the restore keeps it: the next team write must not
       mint another, or statistics desks sealed to this box stop opening and nothing says so
       (board 904). A copy that brings its own box is written as it is, and another key's box is
       never taken. The shape is the one src/sign.mjs packs. */
    if (have && have.public === pair.public && !pair.box) {
      const b = have.doc && have.doc.box;
      if (b && typeof b === "object" && !Array.isArray(b)
          && typeof b.public === "string" && b.public
          && typeof b.iv === "string" && b.iv
          && typeof b.ct === "string" && b.ct)
        try { const cand = { public: b.public, iv: b.iv, ct: b.ct };
          S.openLeadBox({ doc: { box: cand } }, S.unlockKey({ wrap: { kdf: S.OS_WRAP }, keyId: pair.keyId, public: pair.public }, pair.der));
          pair.box = cand; } catch { /* a box this key does not open is not this lead's */ }
    }
  });
  const after = Object.assign({}, readStore(), { keyBackup: { keyId: pair.keyId, made: todayStamp(),
    where: path.dirname(path.resolve(String(file))), restored: true } });
  if (after.keyMade && after.keyMade.pub !== pair.public) delete after.keyMade;
  writeStore(after);
  if (pair.relays && pair.relays.length) await relaysBack(pair.relays); /* plant:s932-restore */
  /* After the relay rows. An epoch row that made the team entry first would leave relaysBack's held team with no
     relay place, and that path skips the team (plant s932-keep). */
  if (pair.epochs && pair.epochs.length) await epochsBack(pair.epochs);
  if (pair.member) await memberBack(pair.member);
  if (pair.people) peopleBack(pair.people); /* plant:f4b-restore */
  /* The licence and the relay grant named the key set aside: signing in again brings them to this one (planFor "ask"). */
  const signing = await signingNow();
  /* The page speaks only where the copy brought no seal and no key stood in the place. A place that
     already held a key keeps its silence: the box this key opens, another key's box, a box this key
     does not open, and the same key with no box. */
  if (!pair.box && !keyStood) signing.boxless = true;
  /* The copy's box did not open under its key and was left off (src/studio.mjs openBackup). */
  if (pair.boxDropped === true) signing.boxDropped = true;
  /* What came back with the copy, for Account's Carry on from another computer (A6): the copy's relay teams this computer now
     holds at the copy's own relay place, each counted once, read from the teams file after relaysBack rather than from the copy,
     so a row it skipped (a team held at another place, a key the vault could not seal) is not counted. */
  const relaysHere = new Set();
  for (const r of Array.isArray(pair.relays) ? pair.relays : []) {
    let held = null;
    try { held = r && typeof r.team === "string" ? K.keptTeam(teamsFile, r.team) : null; } catch { held = null; } /* the key stays restored */
    if (held && held.relay && held.relay.rt === r.rt) relaysHere.add(r.team);
  }
  signing.carried = { relays: relaysHere.size };
  return signing;
}));

/* REMOVE THE SIGNING KEY (board 960). It moves to the Recycle Bin (shell.trashItem) rather than
   being deleted outright, so that the sealed secret can still be recovered from there.
   Refused while a handover is under way. */
const KEY_STAYED = "The signing key could not be moved to the Recycle Bin, so it stays where it is.";
function keyStayed() {
  return { removed: false, error: KEY_STAYED, said: { frame: KEY_STAYED, vars: {} } };
}

async function removeSigningKey() {
  const curStore = readStore();
  if (curStore.handover) {
    const R = await refusal();
    throw R.refuse("The signing key can be removed once the move or handover already under way ends. Nothing was changed.");
  }
  const keyPath = await keyFileNow();
  let exists = false;
  try { exists = fs.existsSync(keyPath); } catch { exists = false; }
  if (!exists) {
    const R = await refusal();
    throw R.refuse("This Studio has no signing key.");
  }
  try {
    await shell.trashItem(keyPath);
  } catch {
    return keyStayed();
  }
  if (fs.existsSync(keyPath)) return keyStayed();
  return { removed: true, signing: await signingNow() };
}

answer("studio:key-remove", async () => guard(async () => removeSigningKey()));

async function langsNow() {
  const S = await studio();
  return S.builtLangs();
}

answer("studio:host", async () => ({
  version: app.getVersion() || require("../package.json").version || "",
  /* True only in a test service build (src/signin-lab.cjs testService); the page then draws its band. */
  ...(require(path.join(ROOT, "src", "signin-lab.cjs")).testService === true ? { testService: true } : {}), /* plant:ts-host */
  /* The page reads this to hide Start with Windows on every platform but Windows. */
  platform: process.platform,
  backdrop: hostBackdrop(),
  maximized: !!(theWindow && theWindow.isMaximized()),
  theme: themeNow(),
  uiLang: uiLangNow(),
  tour: tourNow(),
  tabs: await tabsNow(),
  prefs: prefsNow(),
  shortcuts: shortcutsNow(),
  signing: await signingNow(),
  lang: process.env.STUDIO_LANG ? String(process.env.STUDIO_LANG).slice(0, 2) : null,
  /* WHAT A DESK BUILT FROM THIS PIN CAN READ, and what each language is called in itself, both
     sliced out of the engine rather than kept here (board 579). The New project cover opens on
     the first of them, so a project with no declaration is born speaking what the thing that
     reads it speaks; the second is what the settings screen offers instead of a bare code. */
  langs: await langsNow(),
  /* THE ABOUT'S TWO FACTS THAT ARE NOT THE VERSION, each read where it is decided: the day this build
     was released, which electron-builder.js stamps into the packaged package.json (absent in a tree,
     and then the About leaves the line out rather than filling it from the clock), and the oldest desk
     a catalog written here asks for, src/studio.mjs's own stamp. */
  released: String(require("../package.json").released || ""),
  minEngine: (await studio()).MIN_ENGINE,
  /* SAVED DATA A NEWER STUDIO WROTE (updates 2): said once at boot, and nothing is written over it. */
  savedNewer: await savedNewerNow(),
  /* An unfinished reset, said at this start. Null when nothing is waiting on the person. */
  resetUnfinished: resetNotice,
  recentCleared: readStore().recentCleared || null,
  loginItem: loginItemStateNow(),
  quitOnClose: readQuitOnClose(),
  notifications: notificationStateNow(),
  /* Sign-in (board 980): the providers offered, by name alone, none until a client id is configured, so with none the page
     draws no door, no Account section and no sign-in control, or both under the preview (signInOffer); and whether the door
     was closed on this computer for good. */
  ...(await signInOffer()),
  signinDoor: readStore().signinDoor === "closed",
}));

/* THE ONE DOOR TO THE WINDOWS LOGIN ITEMS (a write to the HKCU Run key): only a packaged Studio writes, and only when the
   state differs, so a reset, a clear or a lab run of an unpackaged Studio never touches the installed app's entry (the
   test architect, 2026-11-09). The Start with Windows switch, Reset defaults and Clear local memory all come through here.
   Off Windows there is no login item to write, and the act is refused.
   STUDIO'S OWN NAME, app.etiuda.studio, the one its uninstaller deletes: the pinned tray.cjs names the desk's value when
   given no name, so until 2026-11-12 Studio's switch replaced a desk's own start entry with Studio, and its read through
   openAtLogin, which compares the arguments and so never matches the --hidden written, said off: an Off, a Reset or a Clear
   then wrote nothing. Electron lists in launchItems only the values that start this executable, so the state is read there by
   name, and a value under any other name that starts Studio (an earlier build's) is cleared by its own name. */
function loginItemsNow() {
  if (typeof app.getLoginItemSettings !== "function") return null;
  const got = app.getLoginItemSettings();
  const items = got && Array.isArray(got.launchItems) ? got.launchItems : [];
  const strays = items.filter((i) => i && i.name && i.name !== APP_IDS.studio).map((i) => String(i.name));
  return { own: loginItemOn(got, APP_IDS.studio), strays, any: items.some((i) => i && i.enabled !== false) };
}
function loginItemTo(on) {
  if (process.platform !== "win32") return false;
  if (!app.isPackaged) return false; /* plant:login-packaged */
  let now = null;
  try { now = loginItemsNow(); } catch { now = null; }
  let wrote = false;
  if (now) for (const name of now.strays) { setLoginItemSettings(app, false, { name }); wrote = true; } /* plant:login-strays */
  if (now && now.own === !!on) return wrote;
  setLoginItemSettings(app, !!on, { name: APP_IDS.studio }); /* plant:login-own-name */
  return true;
}

answer("studio:login-item-set", async (e, on) => {
  if (process.platform !== "win32") return { ok: false };
  try { loginItemTo(!!on); return { ok: true }; }
  catch (err) { return { error: String(err && err.message || err) }; }
});
answer("studio:login-item-state", async () => {
  return loginItemStateNow();
});
answer("studio:close-policy-set", async (e, quit) => {
  storeQuitOnClose(!!quit);
  return { ok: true, quitOnClose: !!quit };
});
answer("studio:close-policy-state", async () => {
  return { quitOnClose: readQuitOnClose() };
});

function notificationStateNow() {
  const s = readStore() || {};
  return {
    trayNotes: s.trayNotes !== false,
    trayBadge: s.trayBadge !== false,
    trayBubble: s.trayBubble !== false,
    notifyProposals: s.notifyProposals !== false,
    notifyRequests: s.notifyRequests !== false,
  };
}

answer("studio:notifications-set", async (e, on) => {
  setTrayNotes(on);
  checkWaitingSafe();
  return { ok: true, trayNotes: !!on };
});
answer("studio:tray-badge-set", async (e, on) => {
  const s = readStore() || {};
  s.trayBadge = !!on;
  writeStore(s);
  rebuildTrayMenu();
  return { ok: true, trayBadge: !!on };
});
answer("studio:tray-bubble-set", async (e, on) => {
  setTrayBubble(on);
  return { ok: true, trayBubble: !!on };
});
answer("studio:notify-proposals-set", async (e, on) => {
  const s = readStore() || {};
  s.notifyProposals = !!on;
  writeStore(s);
  return { ok: true, notifyProposals: !!on };
});
answer("studio:notify-requests-set", async (e, on) => {
  const s = readStore() || {};
  s.notifyRequests = !!on;
  writeStore(s);
  return { ok: true, notifyRequests: !!on };
});
answer("studio:notifications-state", async () => {
  return notificationStateNow();
});

/* THE AGREEMENT, READ OFF THE PROGRAM'S OWN DISK for the About's "Read the licence" (src/studio.mjs
   agreementText). The language is one of two words and nothing else: the page names no path. */
answer("studio:agreement", async (e, lang) => {
  try { return { text: (await studio()).agreementText(lang === "pl" ? "pl" : "en") }; }
  catch (err) { return { error: String((err && err.message) || err) }; }
});

/* THE MAKER'S LINK OPENS IN THE BROWSER, as the desk's does, and the address is this constant: the
   page asks for the one link by name and hands over no address, so nothing it holds can open another
   (the window itself still opens no window and navigates nowhere, below). */
const STARDUST_URL = "https://stardustcore.com";
hear("studio:maker", () => { shell.openExternal(STARDUST_URL); });

hear("studio:window", (e, act) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (!win || win.isDestroyed()) return;
  if (act === "minimize") win.minimize();
  else if (act === "maximize") { if (win.isMaximized()) win.unmaximize(); else win.maximize(); }
  else if (act === "close") win.close();
});

/* THE ZOOM, which the application menu's roles carried and this window has no menu for (sense
   pass 3, item 33): the page hears Ctrl with plus, minus or 0 and asks, and each step is half a
   level, as the roles' was. */
hear("studio:zoom", (e, how) => {
  const wc = e.sender, level = wc.getZoomLevel();
  if (how === "in") wc.setZoomLevel(Math.min(level + 0.5, 5));
  else if (how === "out") wc.setZoomLevel(Math.max(level - 0.5, -3));
  else if (how === "reset") wc.setZoomLevel(0);
});

answer("studio:theme", async (e, v) => {
  const t = applyTheme(v);
  const s = readStore(); s.theme = t; writeStore(s);
  return ok({ theme: t });
});

answer("studio:ui-lang", async (e, v) => {
  const l = (v === "en" || v === "pl") ? v : "en";
  const s = readStore(); s.lang = l; writeStore(s);
  return ok({ lang: l });
});

/* THE TOUR'S THREE VALUES, WRITTEN WHOLE RATHER THAN MERGED HERE. The renderer holds the state
   it is showing and sends all three, so a merge in this process could only disagree with what
   is on the screen. The floor and the ceiling are tourNow()'s, applied on the way back out, so
   what the page is told is what a fresh launch would be told. */
/* ASKED AGAIN EACH TIME THE SETTINGS COVER OPENS: a key written at the command line while Studio
   was open was not seen until a restart, because studio:host reads it once (polish 04, item 21). */
answer("studio:signing", async () => guard(async () => ({ signing: await signingNow() })));

answer("studio:tour", async (e, v) => {
  const o = (v && typeof v === "object") ? v : {};
  const s = readStore();
  s.tour = { offered: !!o.offered, taken: !!o.taken, at: Number(o.at) | 0 };
  writeStore(s);
  return ok({ tour: tourNow() });
});

/* THE PROJECTS OPEN IN THE BAND, written whole as the tour's values are; read back at a launch by
   openTabs in src/studio.mjs, on the thread, because each is a folder on what may be a share.
   Only a directory this Studio lists is kept, the same rule as every other handler that takes a
   project directory. Anything else is dropped, and the tab on screen with it. */
function confinedTabs(kept) {
  const raw = kept && typeof kept === "object" ? kept : null;
  if (!raw || !Array.isArray(raw.open)) return raw;
  const open = [];
  for (const t of raw.open) {
    const home = t && typeof t.dir === "string" ? projectPlace(t.dir) : null;
    if (!home) continue;
    open.push({ dir: home, name: t.name, rev: t.rev });
  }
  const onHome = typeof raw.on === "string" ? projectPlace(raw.on) : null;
  const on = onHome && open.some((t) => pathsSame(t.dir, onHome)) ? onHome : "";
  return { open, on };
}
answer("studio:tabs", async (e, v) => {
  const tabs = confinedTabs((await studio()).keptTabs(v));
  const s = readStore(); s.tabs = tabs; writeStore(s);
  return ok({ tabs });
});

/* CLEAR LOCAL MEMORY (board 960). Clears settings, tour, tabs and feeds of Opened recently
   through one function in the shell. Undo puts back what it cleared. */
let lastClearedStore = null;
const CLEARED_KEYS = [
  "theme", "lang", "tour", "tabs", "keyNudge", "recentCleared", "shortcuts",
  "animations", "density", "openCatalog", "openIn", "reopenTabs", "reopenLast", "prefs",
  "quitOnClose", "trayNotes", "trayBadge", "trayBubble", "notifyProposals", "notifyRequests"
];

async function clearLocalMemory() {
  const cur = readStore();
  const was = {};
  CLEARED_KEYS.forEach((k) => { if (k in cur) was[k] = JSON.parse(JSON.stringify(cur[k])); });
  const next = Object.assign({}, cur);
  CLEARED_KEYS.forEach((k) => { delete next[k]; });
  const recentCleared = new Date().toISOString();
  next.recentCleared = recentCleared;
  /* A store that would not take the write has cleared nothing, and says so. */
  if (writeStore(next) === false) throw (await refusal()).refuse("Studio's settings file could not be written, so nothing was cleared.");
  lastClearedStore = was;
  nativeTheme.themeSource = "system";
  setQuitOnClose(false);
  try { loginItemTo(false); } catch {}
  rebuildTrayMenu();
  return {
    cleared: true,
    recentCleared,
    theme: "system",
    lang: recoveryLang(),
    prefs: prefsNow(),
    quitOnClose: false,
    notifications: notificationStateNow(),
  };
}

async function undoClearLocalMemory() {
  if (!lastClearedStore) return { undone: false };
  /* Only what the clear took: a move, a handover or a key made since stays as it now stands. */
  const restored = readStore();
  CLEARED_KEYS.forEach((k) => { delete restored[k]; });
  Object.assign(restored, lastClearedStore);
  /* A refused write restored nothing: the copy stays, so Undo can be asked again. */
  if (writeStore(restored) === false) throw (await refusal()).refuse("Studio's settings file could not be written, so nothing was restored.");
  lastClearedStore = null;
  if (restored.theme) {
    nativeTheme.themeSource = (restored.theme === "light" || restored.theme === "dark") ? restored.theme : "system";
  } else {
    nativeTheme.themeSource = "system";
  }
  setQuitOnClose(!!restored.quitOnClose);
  rebuildTrayMenu();
  return { undone: true, store: restored };
}

answer("studio:clear-local-memory", async () => guard(async () => clearLocalMemory()));
answer("studio:clear-local-memory-undo", async () => guard(async () => undoClearLocalMemory()));

/* RESET STUDIO: BACK TO A FRESH INSTALL (board 960/reset, Claude alpha's rulings 2026-11-09 20:39 and 20:40).
   Studio's user-data folder emptied of everything but the licence files, the signing key with its backups (signing-key*.json,
   and a backup saved here under the save dialog's name, etiuda-studio-key-*.json), the teams
   with their keys (teams.json, member-key.json) and revision floor (team-revs.json): nothing a reset forgets may
   strand a team. "Local State" stays too: it holds the key safeStorage seals the team keys and an OS-kept signing key
   with, so without it the kept files would no longer open. Symmetrically, relay/ stays so the relay runners' pending writes
   remain intact, and folder-mirror/, which no Studio reads since the shared folder's mirror went (A-S5), stays as an older
   build left it: a write its outbox still owed is the lead's own work, and nothing here deletes it. studio.json is reduced
   to root and keyBackup.
   The uninstaller's "Remove my data" keeps the same set from RESET_KEEP_NAMES (packaging/installer-pages.nsh).
   Never touches a project folder, a catalog file, a team's shared folder or relay data outside app data.
   Refuses, changing nothing, if any path falls outside Studio's user-data folder. */
const RESET_KEEP_NAMES = [
  "etiuda-studio-license.js",
  "licence-service.json",
  "etiuda-studio-revoked.json",
  "etiuda-studio-revoked-kept.json",
  "relay-grant.json",
  "signing-key.json",
  "teams.json",
  "team-revs.json",
  "member-key.json",
  "Local State",
  "relay",
  "folder-mirror",
  "studio.json",
];

function isResetStudioKept(name) {
  if (name === "etiuda-studio-license.js") return true;
  if (name === "licence-service.json") return true;
  if (name === "etiuda-studio-revoked.json") return true;
  if (name === "etiuda-studio-revoked-kept.json") return true;
  if (name === "relay-grant.json") return true;
  if (name === "signing-key.json") return true;
  if (name === "teams.json") return true; /* plant:reset-keep-teams */
  if (name === "team-revs.json") return true; /* plant:reset-keep-team-revs */
  if (name === "member-key.json") return true;
  if (name === "Local State") return true; /* plant:reset-keep-seal */
  if (name === "relay") return true;
  if (name === "folder-mirror") return true; /* plant:reset-keep-folder-mirror */
  if (name === "studio.json") return true;
  if (/^signing-key.*\.json$/i.test(name)) return true;
  /* A backup copy saved here under the save dialog's own name (studio:key-backup's defaultPath). */
  if (/^etiuda-studio-key-.*\.json$/i.test(name)) return true; /* plant:k27-keep-backup */
  return false;
}

/* CUSTOMER TEXT ON ITS WAY THROUGH A JOB (a paste for the import, a desk's catalog brought in) is written under <userData>/work,
   never the system's temporary folder, and each job deletes its own (src/studio.mjs importLand, landCatalog). What a job left,
   by a crash or a quit midway, goes at the next start, with the copies an earlier Studio left in the temporary folder. Its paste
   there is not swept: etiuda-studio-paste in the temporary folder is still the command line's and the node legs' own (writePaste). */
const WORK_NAME = "work";
function workDir() { return path.join(app.getPath("userData"), WORK_NAME); }
const LEFT_IN_TEMP = /^(?:studio-brought-[A-Za-z0-9._-]+|studio-copy-[A-Za-z0-9._-]+)$/;
/* A temporary entry goes only once a day old by its mtime: the folder is the account's, shared by every run on the computer, and an
   older branch's leg may be landing a copy under one of those names now. <userData>/work is this profile's alone and has no bound. */
const LEFT_IN_TEMP_AGE_MS = 86400000;
/** At a start: <ud>/work and those names directly in `temp` removed, a link among them unlinked and never followed. The names gone. */
function sweepWork(ud, temp) {
  const gone = [];
  const drop = (at, aged) => {
    let st = null;
    try { st = fs.lstatSync(at); } catch { return; }
    if (aged && Date.now() - st.mtimeMs < LEFT_IN_TEMP_AGE_MS) return; /* plant:temp-aged */
    try {
      if (st.isSymbolicLink()) fs.unlinkSync(at);
      else fs.rmSync(at, { recursive: true, force: true });
      gone.push(at);
    } catch { /* held open: the next start tries again */ }
  };
  drop(path.join(path.resolve(ud), WORK_NAME)); /* plant:work-swept */
  let names = [];
  try { names = fs.readdirSync(path.resolve(temp)); } catch { names = []; }
  for (const name of names) if (LEFT_IN_TEMP.test(name)) drop(path.join(path.resolve(temp), name), true); /* plant:temp-swept */
  return gone;
}

function resetStudioUserData(userDataDir) {
  const ud = path.resolve(userDataDir || app.getPath("userData"));
  const parsed = path.parse(ud);
  if (!ud || ud === parsed.root || ud.length <= parsed.root.length) {
    throw new Error("refused: invalid userData path");
  }
  if (!fs.existsSync(ud)) return true;
  const entries = fs.readdirSync(ud);
  for (const name of entries) {
    const full = path.resolve(ud, name);
    const rel = path.relative(ud, full);
    if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) {
      throw new Error("refused: path outside userData: " + full);
    }
  }

  let failedAny = false;
  let storeToRewrite = null;
  const blocked = [];

  for (const name of entries) {
    if (name === ".reset-pending") continue;
    if (name === "studio.json") {
      try {
        const raw = fs.readFileSync(path.join(ud, "studio.json"), "utf8");
        storeToRewrite = JSON.parse(raw);
      } catch {
        storeToRewrite = {};
      }
      continue;
    }
    if (isResetStudioKept(name)) continue;
    const full = path.join(ud, name);
    try {
      const st = fs.lstatSync(full);
      if (st.isDirectory()) {
        fs.rmSync(full, { recursive: true, force: true });
      } else {
        fs.unlinkSync(full);
      }
    } catch (e) {
      failedAny = true;
      if (blocked.indexOf(name) < 0) blocked.push(name);
    }
  }

  if (storeToRewrite !== null) {
    try {
      const kept = {};
      if (typeof storeToRewrite.root === "string" && storeToRewrite.root) {
        kept.root = storeToRewrite.root;
      }
      /* Where the signing key's backup copy is, a date and a folder and no key, so the row and the disc still find it. */
      const kb = storeToRewrite.keyBackup;
      if (kb && typeof kb === "object" && !Array.isArray(kb) && typeof kb.keyId === "string") kept.keyBackup = kb;
      const storeFile = path.join(ud, "studio.json");
      Saved.writeSaved(storeFile, kept, (f, t) => fs.writeFileSync(f, t, "utf8"), app.getVersion() || Saved.studioVersion());
    } catch {
      failedAny = true;
      if (blocked.indexOf("studio.json") < 0) blocked.push("studio.json");
    }
  }

  return { ok: !failedAny, blocked };
}

/* A failed pass rewrites the marker as held. A later start that finds it held removes nothing,
   so a file the lead made after the failure stays until they try again or stop the reset. */
let resetNotice = null;

function readResetMarker(marker) {
  let text = "";
  try { text = fs.readFileSync(marker, "utf8"); }
  catch { return { held: false, blocked: [] }; }
  try {
    const doc = JSON.parse(text);
    if (doc && doc.v === 1 && doc.held === true) {
      const names = Array.isArray(doc.blocked) ? doc.blocked.filter((x) => typeof x === "string" && x) : [];
      return { held: true, blocked: names };
    }
  } catch { /* the ask writes the text "1", which is a pass not yet held */ }
  return { held: false, blocked: [] };
}

function writeResetHeld(marker, blocked) {
  fs.writeFileSync(marker, JSON.stringify({ v: 1, held: true, blocked: blocked || [] }), "utf8");
}

function performPendingReset(userDataDir) {
  const ud = path.resolve(userDataDir || app.getPath("userData"));
  const marker = path.join(ud, ".reset-pending");
  if (!fs.existsSync(marker)) { resetNotice = null; return false; }
  const doc = readResetMarker(marker);
  if (doc.held) {
    resetNotice = { blocked: doc.blocked.slice() };
    return false;
  }
  let result = { ok: false, blocked: [] };
  try {
    const ran = resetStudioUserData(ud);
    if (ran && typeof ran.ok === "boolean") result = ran;
  } catch {
    result = { ok: false, blocked: [] };
  }
  const ok = result.ok === true;
  let canUnlink = ok; /* plant:reset-marker-kept-on-fail */
  if (canUnlink) {
    try { fs.unlinkSync(marker); } catch {}
    resetNotice = null;
    return true;
  }
  try { writeResetHeld(marker, result.blocked); } catch { /* the marker stays, so the next start still holds */ }
  resetNotice = { blocked: result.blocked.slice() };
  return false;
}

function retryPendingReset(userDataDir) {
  const ud = path.resolve(userDataDir || app.getPath("userData"));
  const marker = path.join(ud, ".reset-pending");
  try { fs.writeFileSync(marker, "1", "utf8"); } catch {}
  resetNotice = null;
  clearArmed(licenceFirst, clearTimeout); licenceFirst = null;
  clearArmed(licenceTick, clearInterval); licenceTick = null;
  clearArmed(noteFirst, clearTimeout); noteFirst = null;
  clearArmed(noteTick, clearInterval); noteTick = null;
  if (watchTimer) { clearTimeout(watchTimer); watchTimer = null; }
  relaunchAfterReset();
  return { ok: true };
}

function stopPendingReset(userDataDir) {
  const ud = path.resolve(userDataDir || app.getPath("userData"));
  try { fs.unlinkSync(path.join(ud, ".reset-pending")); } catch {}
  resetNotice = null;
  return { stopped: true };
}

async function resetStudioNow(opts = {}) {
  const ud = path.resolve(app.getPath("userData"));
  if (opts && opts.customPath) {
    const custom = path.resolve(opts.customPath);
    const rel = path.relative(ud, custom);
    if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) {
      throw (await refusal()).refuse("The reset was pointed at a folder outside Studio's own data, so nothing was reset.");
    }
  }
  try { loginItemTo(false); } catch {}
  try {
    fs.writeFileSync(path.join(ud, ".reset-pending"), "1", "utf8");
  } catch {}
  clearArmed(licenceFirst, clearTimeout); licenceFirst = null;
  clearArmed(licenceTick, clearInterval); licenceTick = null;
  clearArmed(noteFirst, clearTimeout); noteFirst = null;
  clearArmed(noteTick, clearInterval); noteTick = null;
  if (watchTimer) { clearTimeout(watchTimer); watchTimer = null; }
  relaunchAfterReset();
  return { reset: true };
}

/* An offscreen Studio is a window leg. Relaunching it would start a second Studio that no test
   holds by its PID. The guard stays, and rs12a's stub sets STUDIO_TEST_RESET_RELAUNCH so it can
   see the calls without that launch. */
function relaunchAfterReset() {
  if (testOnly("STUDIO_TEST_OFFSCREEN") && !testOnly("STUDIO_TEST_RESET_RELAUNCH")) return;
  /* The lock goes first, as the desk's does: a relaunched Studio that finds it still held loses the race and quits,
     and Reset would close Studio for good (the first-and-last-minutes triage, item 5). */
  if (typeof app.releaseSingleInstanceLock === "function") app.releaseSingleInstanceLock();
  if (typeof app.relaunch === "function") app.relaunch();
  if (typeof app.exit === "function") app.exit(0);
  else if (typeof app.quit === "function") app.quit();
}

answer("studio:reset", async () => guard(async () => resetStudioNow()));
answer("studio:reset-again", async () => guard(async () => retryPendingReset()));
answer("studio:reset-stop", async () => guard(async () => stopPendingReset()));

answer("studio:maintenance", async () => guard(async () => {
  const root = projectsRoot();
  let libPresent = false, catCount = 0;
  try {
    libPresent = fs.existsSync(root);
    if (libPresent) {
      const p = await thread.call("listProjects", root, { userData: app.getPath("userData") });
      catCount = (p && Array.isArray(p.projects) ? p.projects.length : 0);
    }
  } catch {}

  let signPresent = false, signBackedUp = false, keyPrint = "";
  try {
    const sign = await signingNow();
    if (sign && sign.keyId && !sign.problem) {
      signPresent = true;
      signBackedUp = !!(sign.backup && sign.backup.where);
      keyPrint = sign.print || "";
    }
  } catch {}

  let teamsCount = 0, teammatesCount = 0;
  try {
    const K = await teamStore();
    const tm = K.studioTeammates(await teamsAt());
    if (tm && tm.ok) {
      teamsCount = tm.teamsCount || 0;
      teammatesCount = tm.count || 0;
    }
  } catch {}

  let engPin = "";
  try {
    engPin = (await studio()).Engine.pin().commit;
  } catch {}

  let openCats = 0;
  try {
    const tn = await tabsNow();
    openCats = (tn && Array.isArray(tn.open) ? tn.open.length : 0);
  } catch {}

  let memUsed = "0 KB";
  try {
    const st = fs.statSync(storeAt());
    const kb = Math.round(st.size / 1024);
    memUsed = (kb > 0 ? kb : 1) + " KB";
  } catch {}

  let spellingLangs = SPELLING ? SPELLING.langs.join(", ") : "en-US, pl";
  try {
    const s = session && session.defaultSession;
    if (s && typeof s.getSpellCheckerLanguages === "function") {
      const l = s.getSpellCheckerLanguages();
      if (l && l.length) spellingLangs = l.join(", ");
    }
  } catch {}

  let winDesc = "1280 x 880";
  try {
    if (theWindow && !theWindow.isDestroyed()) {
      const b = theWindow.getBounds();
      winDesc = b.width + " x " + b.height + (theWindow.isMaximized() ? " (maximised)" : "");
    }
  } catch {}

  let notifDesc = "supported";
  try {
    const { Notification } = require("electron");
    notifDesc = Notification && Notification.isSupported() ? "supported" : "unsupported";
  } catch {}

  let bgAlive = true;
  try {
    await thread.call("builtLangs");
  } catch {
    bgAlive = false;
  }

  const relayOk = !relayClosed;

  return {
    version: app.getVersion() || require("../package.json").version || "",
    electron: process.versions.electron || "",
    windows: process.platform === "win32" ? "Windows " + os.release() : os.type() + " " + os.release(),
    libraryFolder: root,
    dataFolder: path.dirname(storeAt()),
    openCatalogs: openCats,
    teamsCount,
    teammatesCount,
    keyPrint,
    enginePin: engPin,
    spelling: spellingLangs,
    window: winDesc,
    notifications: notifDesc,
    localMemory: memUsed,
    lastStart: "not recorded",
    lastCrash: "not recorded",
    health: {
      library: libPresent ? "present" : "missing",
      catCount,
      signingKey: !signPresent ? "none" : (signBackedUp ? "backed-up" : "no-backup"),
      relay: relayOk ? "reachable" : "out-of-reach",
      background: bgAlive ? "running" : "stopped",
      lastStart: "not recorded",
      lastCrash: "not recorded",
    },
  };
}));

/* RESET DEFAULTS (board 965, run S3). Puts every setting back as it ships. Catalogs, tabs,
   the tour, the signing key and the licence are not touched. */
async function resetDefaults() {
  const cur = readStore();
  const next = Object.assign({}, cur);
  RESET_WHITELIST.forEach((k) => { delete next[k]; });
  if (writeStore(next) === false) throw (await refusal()).refuse("Studio's settings file could not be written, so nothing was reset.");
  nativeTheme.themeSource = "system";
  setQuitOnClose(false);
  try { loginItemTo(false); } catch {}
  rebuildTrayMenu();
  return {
    reset: true,
    theme: "system",
    lang: recoveryLang(),
    prefs: prefsNow(),
    quitOnClose: false,
    loginItem: loginItemStateNow(),
    notifications: notificationStateNow(),
  };
}

answer("studio:reset-defaults", async () => guard(async () => resetDefaults()));

/* PREFERENCES (board 965, run S3). Updates preferences in the store and returns current state. */
answer("studio:prefs", async (e, patch) => guard(async () => {
  if (patch && typeof patch === "object") {
    const s = readStore();
    if (typeof patch.animations === "boolean") { s.animations = patch.animations; }
    if (patch.density === "comfortable" || patch.density === "compact") { s.density = patch.density; }
    if (patch.openCatalog === "new" || patch.openCatalog === "this") { s.openCatalog = patch.openCatalog; s.openIn = patch.openCatalog; }
    else if (patch.openIn === "new" || patch.openIn === "this") { s.openCatalog = patch.openIn; s.openIn = patch.openIn; }
    if (typeof patch.reopenTabs === "boolean") { s.reopenTabs = patch.reopenTabs; s.reopenLast = patch.reopenTabs; }
    else if (typeof patch.reopenLast === "boolean") { s.reopenTabs = patch.reopenLast; s.reopenLast = patch.reopenLast; }
    s.prefs = prefsNow();
    if (writeStore(s) === false) throw (await refusal()).refuse("Studio's settings file could not be written, so this change was not saved.");
  }
  return ok({ prefs: prefsNow() });
}));

/* KEYBOARD SHORTCUTS (board 965, run S4b). Stored chord overrides in studio.json. */
/* THE PAGE'S STORED SHORTCUTS, REBUILT FROM THEIR SHAPE ALONE (board 965, S4b): an own key naming a shortcut (its id, and "~2"
   for its second chord) holding a chord of two short strings and four flags, as ui/keys.js keeps them. Anything else, an array
   or a value with its own toString among them, is dropped, so nothing the page sends reaches the store as sent (ipc-coerce). */
function shortcutsFrom(raw) {
  const out = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw) || Object.getPrototypeOf(raw) !== Object.prototype) return out;
  const str = (v) => (typeof v === "string" && v.length <= 40 ? v : "");
  for (const k of Object.keys(raw)) {
    if (!/^[A-Za-z][A-Za-z0-9-]{0,40}(~2)?$/.test(k)) continue;
    const c = raw[k];
    if (!c || typeof c !== "object" || Array.isArray(c) || Object.getPrototypeOf(c) !== Object.prototype) continue;
    out[k] = { code: str(c.code), key: str(c.key), ctrl: c.ctrl ? 1 : 0, alt: c.alt ? 1 : 0, shift: c.shift ? 1 : 0, meta: c.meta ? 1 : 0 };
  }
  return out;
}
answer("studio:shortcuts", async (e, raw) => guard(async () => {
  const s = readStore();
  const kept = raw && typeof raw === "object" && !Array.isArray(raw) ? shortcutsFrom(raw) : {};
  if (Object.keys(kept).length) {
    s.shortcuts = kept;
  } else {
    delete s.shortcuts;
  }
  writeStore(s);
  return ok({ shortcuts: shortcutsNow() });
}));

async function tabsNow() {
  if (!(await worksNow())) return { open: [], away: [], on: "" }; /* plant:s1b-host */
  try { return await thread.call("openTabs", confinedTabs(readStore().tabs || null)); }
  catch { return { open: [], away: [], on: "" }; }
}

answer("studio:projects", async () => guard(async () => {
  holdCheck(projectsRoot(), true);
  return thread.call("listProjects", projectsRoot(), { userData: app.getPath("userData") });
}));

answer("studio:teams", async () => guard(async () => {
  return thread.call("readAllTeams", withHere({
    projectsRoot: projectsRoot(),
    keyFile: await keyFileNow(),
    passphrase: await keySecret("open"),
    teamKeys: (await teamsNow()).teamKeys
  }));
}));
answer("studio:team-end", async (e, teamId) => guard(async () => {
  const id = String(teamId || "");
  return thread.call("endLedTeam", id, await keyFileNow(), withHere());
}));

/* STUDIO_TEST_ROOT answers the pick with a folder, as STUDIO_TEST_SAVE answers the export's. A
   project's own folder lands on its parent with the project open (src/studio.mjs, rootFor). */
answer("studio:pick-root", async (e, title) => guard(async () => {
  let chosen = testOnly("STUDIO_TEST_ROOT");
  if (!chosen) {
    const win = BrowserWindow.fromWebContents(e.sender);
    const r = await pick("open", win, {
      title: String(title || ""), properties: ["openDirectory"],
    });
    if (r.canceled || !r.filePaths.length) return { root: projectsRoot(), projects: null };
    chosen = r.filePaths[0];
  }
  const S = await studio();
  const to = S.rootFor(chosen);
  holdCheck(to.root, true); /* a folder another Studio has is not chosen: the old one stays */
  const s = readStore(); s.root = to.root; writeStore(s);
  return Object.assign(await thread.call("listProjects", to.root, { userData: app.getPath("userData") }), { open: to.open });
}));

answer("studio:pick-folder", async (e, title) => guard(async () => {
  /* STUDIO_TEST_FOLDER answers this pick for a harness, as STUDIO_TEST_ROOT answers the one above. */
  if (testOnly("STUDIO_TEST_FOLDER"))
    return { folder: chosen.keep("folder", testOnly("STUDIO_TEST_FOLDER")) };
  const win = BrowserWindow.fromWebContents(e.sender);
  const r = await pick("open", win, {
    title: String(title || ""), properties: ["openDirectory"],
  });
  return { folder: chosen.keep("folder", (r.canceled || !r.filePaths.length) ? null : r.filePaths[0]) };
}));

answer("studio:open", async (e, dir) => guard(async () => {
  const home = projectDir(dir); /* plant:txic-open */
  await bringBack(home);
  await followedNow();
  return thread.call("openProject", home, withHere({ noStamp: awayNow() && RootHold.needed(path.resolve(projectsRoot())) })); /* plant:hold-nostamp-shell */
}));

/* THE DECLARED SET TRAVELS WITH THE NAME (board 579): a project is born in the languages the
   cover was left holding, and an absent list is the pin's own built-in pair rather than a
   literal here. The list is rebuilt from strings on this side, because what crosses the wire is
   a plain object from a page and nothing else may be trusted about it. */
answer("studio:new", async (e, name, langs, opts) => guard(async () => {
  const want = Array.isArray(langs)
    ? langs.map(l => ({ code: String((l && l.code) || ""), label: String((l && l.label) || "") }))
    : null;
  holdCheck(projectsRoot());
  return thread.call("newProject", projectsRoot(), String(name || ""), want,
    { numbered: !!(opts && opts.numbered === true) });
}));

/* A FOLDER IS REMOVED ONLY DIRECTLY UNDER THE PROJECTS ROOT, where "+" makes one, and only by the verb's exact test.
   A directory that is not one Studio lists is left where it is, and the answer stays the quiet one this verb had. */
answer("studio:discard-untouched", async (e, dir) => guard(async () => {
  const home = projectPlace(dir);
  if (!home) return { removed: false };
  return thread.call("discardUntouched", home);
}));

/* Draft and Checks for one Library row, after the table is on screen. Only a catalog Studio lists is read.
   A row that names anything else is answered with nothing to fill, as a stray row was, and the path is not read. */
answer("studio:row-facts", async (e, dir) => guard(async () => {
  const home = projectPlace(dir);
  if (!home) return { changes: null, checks: null };
  const changes = await thread.call("changesCount", home);
  const lint = await thread.call("lintProject", home);
  const checks = (lint.errors | 0) + (lint.warnings | 0) + (lint.awaiting | 0) + (lint.suggestions | 0);
  return { changes, checks };
}));

/* THE IMPORT WIZARD'S THREE VERBS. Pick a file, plan what would happen, land it. The plan is a
   read and writes nothing at all, which is what lets the first two covers be walked back and
   forth over a changed mapping without leaving anything on the customer's disk. */
answer("studio:import-pick", async (e, title, kinds) => guard(async () => {
  /* A NATIVE FILE DIALOG CANNOT BE DRIVEN. It is the system's own window rather than the page's,
     it blocks the main process while it is up, and every read against the page hangs behind it -
     so the pick is the one step of the wizard a leg could not otherwise reach. STUDIO_TEST_FILE
     answers it with a path instead of opening it; everything after the pick is the real code,
     the real planner and the real writer. Unset on any desk but a harness's. */
  if (testOnly("STUDIO_TEST_FILE"))
    return { file: chosen.keep("import", testOnly("STUDIO_TEST_FILE")) };
  const win = BrowserWindow.fromWebContents(e.sender);
  /* EVERY FILE THE IMPORTER READS, AND THEN ALL FILES (sense pass 2026-09-22, item 20). The
     filter said CSV and listed csv, tsv and txt, so the workbook reader and the JSON exports
     were out of reach of anybody pointing and clicking, and no gate could see it because every
     gate answers this dialog with STUDIO_TEST_FILE. The reader decides a file by its bytes, not
     its name, so "All files" is safe and is the way out for an export saved under any name.
     The two names arrive from the page in the interface's language. PICKER_EXTENSIONS is read
     by tests/import-sense.mjs, which is the only way a leg reaches this dialog at all. */
  const k = kinds || {};
  const r = await pick("open", win, {
    title: String(title || ""), properties: ["openFile"],
    filters: [{ name: String(k.files || "Spreadsheets, text and exports"),
                extensions: PICKER_EXTENSIONS },
              { name: String(k.all || "All files"), extensions: ["*"] }],
  });
  return { file: chosen.keep("import", (r.canceled || !r.filePaths.length) ? null : r.filePaths[0]) };
}));

/* ONE DOOR FOR ANY FILE (import-no-spreadsheet-door, the Studio batch of 2026-10-12): the Projects screen's "Bring in your
   replies" opens one dialog over every file, and src/studio.mjs's bringKind says whether the file is a catalog, which the
   upgrade opens, or a pile the import wizard reads; it is kept for that door alone. STUDIO_TEST_FILE answers the dialog,
   as it does the import's. */
answer("studio:bring-pick", async (e, title, all) => guard(async () => {
  let file = testOnly("STUDIO_TEST_FILE") || null;
  if (!file) {
    const win = BrowserWindow.fromWebContents(e.sender);
    const r = await pick("open", win, { title: String(title || ""), properties: ["openFile"],
      filters: [{ name: String(all || "All files"), extensions: ["*"] }] });
    file = (r.canceled || !r.filePaths.length) ? null : r.filePaths[0];
  }
  if (!file) return { file: null, kind: "" };
  const { kind } = await thread.call("bringKind", file);
  return { file: chosen.keep(kind === "catalog" ? "v1" : "import", file), kind };
}));

/* A FILE DROPPED ON THE WINDOW COUNTS AS THE IMPORT'S PICK (board 862): the preload read its path off
   the File the drop carried, so it is a file the person chose; anything but an existing file is none. */
answer("studio:import-dropped", async (e, file) => guard(async () => {
  const at = String(file || "");
  let isFile = false;
  try { isFile = path.isAbsolute(at) && fs.statSync(at).isFile(); } catch { isFile = false; }
  return { file: isFile ? chosen.keep("import", at) : null };
}));

/* A PASTE IS THE IMPORT'S PICK (board 956). The page hands the plain text and the HTML the
   clipboard offered. The shell writes the CSV the importer already reads and keeps that file
   as the choice, the same way a picked file is kept. Nothing here splits the text. The count
   of replies and whether the one-block notice applies come back with the file. */
answer("studio:import-paste", async (e, plain, html) => guard(async () => {
  const wrote = await thread.call("writePaste", String(plain || ""), String(html || ""), workDir());
  const file = wrote && typeof wrote === "object" ? wrote.file : wrote;
  return { file: chosen.keep("import", file),
    replies: wrote && wrote.replies ? (wrote.replies | 0) : 0,
    oneBlock: !!(wrote && wrote.oneBlock) };
}));

/* THE IMPORT'S TARGET RIDES WITH IT (539). `into` is empty, or the open project's folder.
   Empty stays empty. Any other target is a catalog this Studio lists, and the importer is
   given that absolute path. */
answer("studio:import-plan", async (e, file, override, into) => !chosen.took("import", file)
  ? unchosen("studio:import-plan", file) : guard(async () => {
  holdCheck(projectsRoot());
  return thread.call("importPlan", projectsRoot(), String(file || ""), override || {},
    importInto(into));
}));

answer("studio:import-land", async (e, file, override, into, fingerprint) => !chosen.took("import", file)
  ? unchosen("studio:import-land", file) : guard(async () => {
  holdCheck(projectsRoot());
  return thread.call("importLand", projectsRoot(), String(file || ""), override || {},
    importInto(into), fingerprint == null ? "" : String(fingerprint));
}));

answer("studio:save-card", async (e, dir, id, patch) => guard(async () => {
  return thread.call("saveCard", projectDir(dir), String(id || ""), patch || {});
}));

answer("studio:set-folder", async (e, dir, folder) =>
  folder != null && !chosen.took("folder", folder, true)
  ? unchosen("studio:set-folder", folder) : guard(async () => {
  return thread.call("setPublishFolder", projectDir(dir), folder == null ? null : String(folder));
}));

/* THE REVIEW QUEUE. Three reads and one decision, and the decision is the same call the command
   line makes with the same rules. */
const PROPOSALS_WAIT = "Taking proposals waits for sign-in.";
const FLAGS_WAIT = "Answering flags waits for sign-in.";
answer("studio:proposals", async (e, dir) => guard(async () => {
  await signInWaits(PROPOSALS_WAIT); /* plant:f5-proposals */
  await notPaused();
  return thread.call("listProposals", projectDir(dir), withHere({ teamKeys: (await teamsNow()).teamKeys, removed: await removedFor(projectDir(dir)) }));
}));

answer("studio:proposal-open", async (e, dir, file, lang) => guard(async () => {
  await signInWaits(PROPOSALS_WAIT);
  await notPaused();
  const home = projectDir(dir);
  return thread.call("openProposal", home, proposalFile(home, file, true),
    { lang: String(lang || ""), teamKeys: (await teamsNow()).teamKeys });
}));

answer("studio:proposal-decide", async (e, dir, file, decisions, from, note) =>
  guard(async () => {
    await signInWaits(PROPOSALS_WAIT);
    await notPaused();
    const home = projectDir(dir);
    return thread.call("decideProposal", home, proposalFile(home, file, true), decisions || {},
      String(from || ""), note == null ? null : String(note), { teamKeys: (await teamsNow()).teamKeys });
  }));

answer("studio:flag-keep", async (e, dir, id) => guard(async () => {
  await signInWaits(FLAGS_WAIT);
  await notPaused();
  const home = projectDir(dir);
  return thread.call("flagKeep", home, String(id == null ? "" : id),
    withHere({ teamKeys: (await teamsNow()).teamKeys, removed: await removedFor(home) }));
}));

/* AN OLD SIGNING KEY SET ASIDE (board 931 (7)): checks whether Studio holds the old key
   that signed a team file, so the handover act can be offered and signed. */
async function openOldKey(oldKeyFile) {
  const S = await signLib();
  let read = null;
  try { read = S.readKeyFile(oldKeyFile); } catch { return null; }
  if (!read) return null;
  let secret = "";
  if (read.kept !== S.OS_WRAP) secret = testOnly("STUDIO_KEY_PASSPHRASE") || "";
  else {
    try { secret = String(vault.open(Buffer.from(String(read.doc.private), "base64"))); }
    catch { secret = ""; }
  }
  try {
    const opened = S.unlockKey(read, secret);
    return opened && opened.privateKey ? { file: oldKeyFile, read, opened, secret } : null;
  } catch {
    return null;
  }
}

async function findOldKey(targetPub) {
  if (!targetPub) return null;
  const S = await signLib();
  const currentKeyPath = await keyFileNow();
  const dir = path.dirname(currentKeyPath);
  const candidates = [];
  const testOld = testOnly("STUDIO_OLD_KEY");
  if (testOld) candidates.push(testOld);

  /* plant:find-old-key-record */
  if (true) {
    try {
      const store = readStore();
      const recorded = Array.isArray(store.oldSigningKeys) ? store.oldSigningKeys : [];
      for (const entry of recorded) {
        const f = typeof entry === "string" ? entry : (entry && entry.file);
        if (f && !candidates.includes(f)) candidates.push(f);
      }
    } catch {}
  }

  const defaultOld = path.join(dir, "signing-key.old.json");
  if (!candidates.includes(defaultOld)) candidates.push(defaultOld);
  try {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      for (const f of files) {
        if (f.endsWith(".json") && f !== path.basename(currentKeyPath) && f !== "studio.json" && f !== "teams.json") {
          const full = path.join(dir, f);
          if (!candidates.includes(full)) candidates.push(full);
        }
      }
    }
  } catch {}

  for (const c of candidates) {
    if (path.resolve(c) === path.resolve(currentKeyPath)) continue;
    if (!fs.existsSync(c)) continue;
    try {
      const read = S.readKeyFile(c);
      if (read && read.public === targetPub) {
        const opened = await openOldKey(c);
        if (opened) return opened;
      }
    } catch {}
  }
  return null;
}

/* THE DESKS SCREEN (board 834, the sealed team). What the folder's team file says as this Studio's key judges it, with what
   this process keeps beside it: whether it holds the key for the team's epoch, and a kept copy to put back where the file has
   gone. The signing key's secret crosses once, for the one signature, and is kept nowhere. A new team's key is kept BEFORE
   the file naming the team is written, and taken out again if that write fails. */
async function withKept(facts) {
  if (!facts) return facts;
  const K = await teamStore(), at = await teamsAt(), paused = await licencePausedNow();
  const kept = facts.team ? K.keptTeam(at, facts.team.id) : null;
  const relayRow = K.relayTeams(at).find((w) => (facts.folder && path.resolve(w.folder) === path.resolve(facts.folder)) || (facts.mark && w.team === facts.mark) || (facts.id && w.team === facts.id));
  if (relayRow) facts.relay = true;
  /* The team file the mirror holds, not yet on the relay: a change in it has not reached the desks (board 1013, piece 6). */
  if (relayRow && facts.team && !(await relayTeamSent(facts.team.id).catch(() => false))) facts.teamUnsent = true;
  /* plant:handover-offer */
  if (facts.file === "theirs" && facts.leadPub) {
    const oldKey = await findOldKey(facts.leadPub);
    facts.canHandover = !!oldKey;
  } else {
    facts.canHandover = false;
  }
  return Object.assign(facts, { keyHeld: !!kept && !!facts.team && kept.epochs.indexOf(facts.team.epoch) >= 0,
    canKeep: vault.available(), ...(noKeyring() ? { noKeyring: true } : {}), restorable: !facts.team && facts.folder ? K.teamForFolder(at, facts.folder) : null,
    admitPaused: paused },
    facts.team && facts.file === "ours" ? await invitesNow(facts.team.id, kept, facts) : {});
}
/* A TEAM'S LIVE INVITATIONS AS THE PAGE MAY SEE THEM (board 885, S2): each by its id, the name it gives the lead, when it was
   made and when it ends, and whether the signing key opens now, so the screen can say that an admission with nobody present
   waits for it. */
async function invitesNow(team, kept, facts) {
  const K = await teamStore(), at = await teamsAt();
  const all = K.invitesOf(at, team);
  const requests = facts && Array.isArray(facts.requests) ? facts.requests : [];
  const roster = facts && facts.team && Array.isArray(facts.team.roster) ? facts.team.roster : [];
  const deskNameOf = (id) => {
    const named = requests.filter((r) => r && r.inviteId === id && typeof r.name === "string" && r.name);
    const hit = named.find((r) => r.invite === "valid") || named[0];
    if (hit) return hit.name;
    const mem = roster.find((m) => m && m.invite === id);
    return mem && typeof mem.said === "string" ? mem.said : "";
  };
  const invites = all.filter((i) => i.state === "live" || i.pendingMove === true).map((i) => {
    const relay = i.relay === true;
    const row = { id: i.id, name: i.name, person: typeof i.person === "string" ? i.person : "", made: i.made, expires: i.expires,
      code: "", relay: relay,
      used: Number.isFinite(i.used) ? i.used : null, pendingMove: i.pendingMove === true, deskName: deskNameOf(i.id) };
    if (i.registered === true) row.registered = true;
    if (i.reopened === true) row.reopened = true; /* plant:e4s-shell-reopened */
    return row;
  });
  return { invites, inviteName: all.length ? all[0].name : "", keyOpens: !!(await keySecret("probe")) };
}
/* The Desks screen as the page reads it: the folder's team as this Studio's key judges it, each invitation among the desks
   asking read against this Studio's book. */
async function desksNow(dir) {
  const project = projectDir(dir);
  /* The secret opens the lead's box for one read, so each desk's version is read from its own statistics answer (point 5). */
  const facts = await withKept(await thread.call("teamFacts", project, withHere({ key: await keyFileNow(), invites: await inviteBook(),
    passphrase: await keySecret("open") }))); /* plant:p5-desks-secret */
  if (facts && facts.folder && facts.file === "ours" && facts.team && facts.team.relay === true) await armUseWatch(facts.folder); /* a team held for a shared folder is not watched */
  return withUses(project, facts);
}
/* Whether this computer holds a grant the relay will take for the key it has now: "holds", or the reason it does not
   (src/relay.mjs grantRefusal, the same judge studio:team-relay uses). */
async function relayLicenceNow() {
  const Rl = await relayLib(), S = await signLib(), key = await keyFileNow();
  let lead = null;
  try { lead = S.readKeyFile(key); } catch { lead = null; }
  const no = Rl.grantRefusal(lead ? Rl.readGrant(key) : null, lead ? lead.public : null, Date.now(), relayRootsNow(), await revokedKeysNow());
  return no ? String(no.why || "") : "holds";
}
/* Where the relay team a Desks screen shows stands, from relayLapses, or null for a team on a folder or one working inside its grant.
   relayLicence is this computer's own grant, so the page can say when the team cannot be worked from here. */
async function withLapse(facts) {
  const withLicence = Object.assign({}, facts || {}, { relayLicence: await relayLicenceNow() }); /* plant:h2-grant */
  const shownTeam = withLicence.team && typeof withLicence.team.id === "string" ? withLicence.team.id : "";
  if (shownTeam && limitSkipped.has(shownTeam)) {
    const line = limitSkipped.get(shownTeam);
    limitSkipped.delete(shownTeam);
    limitSkippedSaid.add(shownTeam);
    withLicence.limitSkipped = line;
  }
  if (!withLicence.team || typeof withLicence.team.id !== "string") {
    const cur = readStore();
    const withEnd = Object.assign(withLicence, { handoverEnded: cur.handoverEnded || "", handoverDone: cur.handoverDone || "" });
    if (cur.handoverEnded || cur.handoverDone) { delete cur.handoverEnded; delete cur.handoverDone; writeStore(cur); }
    return withEnd;
  }
  withLicence.seats = await seatsShown(withLicence.team.id); /* plant:s3-desks-seats */
  /* What Remove of each member will do, for the confirmation to say (decision 27): only where the lead signed in, as the seats. */
  if (withLicence.seats.signedIn) withLicence.seats.removal = await removalShown(withLicence.team.id, withLicence.team.roster);
  const hit = (await relayLapses()).teams.find((t) => t.team === withLicence.team.id) || null;
  const withHit = Object.assign(withLicence, { lapse: hit }); /* plant:g2s-desks */
  const noted = (await teamStore()).relayTeams(await teamsAt()).find((t) => t.team === withLicence.team.id);
  withHit.syncNote = noted && noted.syncNote ? noted.syncNote : ""; /* plant:rs932-desks */
  if (noted) {
    const K = await teamStore(), at = await teamsAt(), team = withLicence.team.id;
    withHit.removalsWaiting = K.removalsOf(at, team).map((w) => ({ desk: w.desk, name: w.name || w.desk, key: w.key })); /* plant:rmo-shown */
    withHit.team = waitingShown(withHit.team, withHit.removalsWaiting); /* plant:rmo-row-shown */
    withHit.behind = teamBehindNow(team);
    withHit.addedElsewhere = addedElsewhereOnce(team, K.removedOf(at, team), withHit.removalsWaiting.map((w) => w.desk));
  }
  /* Desks an erasure took off this team (erasedStep), said once with how many. */
  const told = (await erasedLib()).leftTaken(readStore().erasedLeft, withLicence.team.id);
  if (told.count) { const was = readStore(); was.erasedLeft = told.rest; writeStore(was); withHit.erasedLeft = told.count; } /* plant:erased-told */
  const cur = readStore();
  withHit.handoverEnded = cur.handoverEnded || "";
  /* The ending of a handover a restore set going that ended after the restore replied (board 984), said once. */
  withHit.handoverDone = cur.handoverDone || "";
  if (cur.handoverEnded || cur.handoverDone) {
    delete cur.handoverEnded;
    delete cur.handoverDone;
    writeStore(cur);
  }
  return withReinvite(withHit);
}
/* THE MEMBERS ADDED ON THE LEAD'S OTHER COMPUTER that the team file standing lacks (the channel's clash record, `dropped`), said once:
   each desk the passed-over file named that the standing one does not, less those this Studio removed or is removing. */
function addedElsewhereOnce(team, gone, waiting) {
  const ch = relayRunner && typeof relayRunner.channel === "function" ? relayRunner.channel(team) : null;
  const prog = ch && ch.program;
  if (!prog || typeof prog.rootClash !== "function") return [];
  const clash = prog.rootClash().find((c) => c && c.path === "etiuda-team.json");
  /* Only those the passed-over side added since the file both computers held (`added`): a member the standing side took off is no
     one waiting to be admitted again (the test architect zeta's finding 1). A record without it says nothing. */
  if (!clash || !Array.isArray(clash.added)) return [];
  const out = clash.added.filter((d) => !Object.prototype.hasOwnProperty.call(gone || {}, d) && (waiting || []).indexOf(d) < 0); /* plant:rmo-added-only */
  if (typeof prog.rootClashSeen === "function") prog.rootClashSeen("etiuda-team.json");
  return out;
}

/* THE DESKS A HANDOVER FOR A KEY IN OTHER HANDS LEFT BEHIND (Max's ruling of 2026-11-01 06:13), named on the Desks screen once
   the team's keys have changed since that handover: those admitted at the handover, still on the roster, whose own in-use file
   is not sealed under a key from that change on (src/catalog-use.mjs notTaken). Where every one has taken it, the screen says
   so once and the row is let go. */
async function withReinvite(facts) {
  const team = facts && facts.team, cur = readStore();
  const rows = cur.freshBox && typeof cur.freshBox === "object" && !Array.isArray(cur.freshBox) ? cur.freshBox : {};
  const row = team && typeof team.id === "string" && Object.prototype.hasOwnProperty.call(rows, team.id) ? rows[team.id] : null;
  if (!row || facts.file !== "ours" || !facts.folder || !(Number(team.epoch) > Number(row.epoch))) return facts; /* plant:lb-moved */
  const Use = await catalogUse();
  let names = null;
  try {
    names = Use.notTaken({ folder: facts.folder, desks: row.desks, roster: team.roster, epoch: Number(row.epoch) + 1,
      teamKeys: (await teamsNow()).teamKeys });
  } catch (err) {
    process.stderr.write("studio  the desks behind a key change could not be read: " + String(err && err.message || err) + "\n");
    return facts;
  }
  if (names.length) return Object.assign(facts, { reinvite: { names } });
  const rest = Object.assign({}, rows);
  delete rest[team.id];
  writeStore(Object.assign({}, readStore(), { freshBox: rest }));
  return Object.assign(facts, { reinvite: { none: true } });
}
answer("studio:desks", async (e, dir) => guard(async () => withLapse(await desksFor(projectDir(dir)))));
async function desksFor(project) {
  await bringBack(project);
  const facts = await desksNow(project);
  /* THE SIGNING KEY TO BE RESTORED HERE (Claude alpha's ruling of 2026-11-23 00:37, the restore route of 04:41): a project sealed to a
     relay team, on a computer whose signing key does not open (its backup copy put in the key's place, not restored), follows the
     team only once the key is restored; the restore asks the backup's passphrase that one time, and the catch-up then runs by itself.
     The Desks screen says so. */
  if (facts && await keyToRestoreFor(project)) facts.keyToRestore = true; /* plant:rmo-key-restore */
  /* A REQUEST THAT PROVES A LIVE INVITATION IS LET IN WHEN STUDIO NEXT SEES IT (Claude alpha's ruling of 2026-10-13 11:30),
     and the screen's read is a sight of it: where one is asking, the watch looks at this folder now, and the screen is read
     again after it. */
  if (!facts.folder || !(facts.requests || []).some((r) => r.invite === "valid")) return facts;
  await teamWatch(facts.folder);
  return desksNow(project);
}

/* THE DESKS ASKING TO JOIN (board 834, step 12, S5). An admission is handed the team key from this process's teams.json and
   the signing key's secret for one call, none kept, and asks the page for nothing but the codes; the team file it writes
   becomes the kept copy only for a team whose Sealed or Plain was chosen here, since recording a choice nobody made would
   read as Plain. */
async function keepWritten(r) {
  if (!r || !r.written || !r.team) return;
  const K = await teamStore(), at = await teamsAt(), kept = K.keptTeam(at, r.team.id);
  if (kept && typeof kept.sealed === "boolean") K.chooseSealed(at, r.team.id, kept.sealed, kept.folder || r.folder, r.written);
}
answer("studio:desk-refuse", async (e, dir, id) => guard(async () => {
  const keyFile = await keyFileNow(), project = projectDir(dir), desk = String(id || "");
  const r = await thread.call("refuseDeskJoin", project, keyFile, desk, withHere({ invites: await inviteBook(), passphrase: await keySecret() }));
  /* A desk that asked by a relay invitation reads only the lead's answer, so it is written now (board 922). The refusal above
     stands whatever comes of it, and the invitation is withdrawn; an answer the relay did not take is kept owed and sent when the
     relay is reached, and the lead is told so. Where the desk used its invitation it holds the team's key, and the one confirm
     of Cancel (studio:invite-cancel) moves the team to a new key; the reply says so (Q1, Claude alpha, 2026-10-20 07:47). */
  const told = await answerRefused(project, keyFile, desk); /* plant:s922-shell-refused */
  const reply = await withKept(r);
  if (told.said) reply.answerSaid = told.said;
  if (told.move) { reply.needsConfirm = true; reply.pendingInvite = told.move; } /* plant:s922-shell-move */
  return reply;
}));
/* A MEMBER LEAVES THE TEAM, FORWARD ONLY. The page names the team and the member, and confirms. The new key is kept
   here before the thread is asked to move the share, and handed in as nextKey, so a stop after the share moves still
   leaves this Studio holding the key the share uses. The key the thread returns is kept again, which changes nothing
   when it is that same key, and is the only keep where the thread was not given one. Without the confirm the thread
   is not asked. A computer that cannot keep the new key is refused before the epoch moves. An invitation on the
   removed entry is marked spent before this write is treated as kept, so taking that entry off the roster cannot
   open the invitation again. A write the thread refuses, or a reply that never comes back, leaves that key kept:
   the share may already be using it, and a retry uses the same one. */
/* Decision 29 (b), said where a lead who is not the owner presses Remove on another lead's desk; the page's removalSaid draws the
   same frame in place of the confirmation; the copywriter's words of 2026-11-12. */
const LEAD_STAYS = "This teammate holds a lead seat on the licence, so they stay on the team. Only the licence's owner can remove a lead from a team.";
answer("studio:member-remove", async (e, dir, team, member, confirm) => guard(async () => {
  const teamKey = String(team || "") || (await teamKeyFor(dir));
  return teamAct(teamKey, async () => {
    if (confirm !== true) return { removed: false, refused: "not confirmed" };
    if (!vault.available()) {
      const R = await refusal();
      throw R.refuse(noKeyring()
        ? "This computer cannot keep a team key for this account: no keyring is open to seal it. To have one, install GNOME Keyring (the gnome-keyring package) or KDE Wallet, sign in again and reopen Studio."
        : "This computer cannot keep a team key for this Windows account.");
    }
    /* REMOVE TAKES THE PERSON OFF THE TEAM, ON ALL THEIR COMPUTERS (decision 27 (a) and (b): "removing a signed-in desk removes its
       person, on all their computers"; Claude alpha's test, "Remove does what a lead would expect of the word, and nothing happens
       unseen"). The seat book names the pressed desk's person; every other desk on this team it names for that person is taken
       off after it, each by the removal below, and the confirmation counted them (removalShown). A desk whose person the book does
       not know goes alone. The pressed desk's removal refused leaves every desk as it was, and the refusal is the reply. After it,
       nothing that fails stops the rest (tau 2 of the Grok review of 2026-11-22, verified A: a removal that landed with a reseal owed
       stopped the loop, and the person's next computer kept the new key): a removal whose team file landed is a removal, the roster
       read again where its reply carries none; a desk whose own removal is refused is counted and the next still taken off; and
       where any is left the reply says how many are still on the team (REMOVAL_PARTIAL), never that the person is off. Otherwise the
       reply is the last removal's, whose reseal also covers a file an earlier one left owed. */
    const project = projectDir(dir), named = String(team || ""), first = String(member || "");
    /* A LEAD STAYS (decision 29 (b)): a Studio that is not the licence's owner takes no other lead off the team, and sends nothing;
       the page says so in place of the confirmation, and this refusal holds where the page's facts were older. */
    if (await leadStays(named, first)) throw (await refusal()).refuse(LEAD_STAYS);
    const others = desksOfPerson(named, first);
    let reply = await removeDeskNow(project, named, first);
    /* The pressed desk's removal waits (removals that survive): each of the person's other desks is put to wait with it, by the
       same removal, and the reply stays the waiting one. One that the relay lets through meanwhile is simply made. */
    if (reply && reply.pending) {
      for (const other of others) {
        try { await removeDeskNow(project, named, other); } catch { /* the waiting removal is kept; the pass applies it later */ }
      }
      return others.length ? await removalWaits(project, named, first) : reply; /* plant:rmo-person-waits */
    }
    if (!reply || !reply.removed) return reply;
    const gone = [first], stillOn = [];
    let refused = null;
    for (const other of others) {
      if (!(await deskStillOn(project, named, other, reply))) continue;
      let r = null;
      try { r = await removeDeskNow(project, named, other); }
      catch (err) { refused = refused || err; }
      if (r && r.removed) { reply = r; gone.push(other); continue; }
      stillOn.push(other); /* plant:si57r-next */
    }
    if (gone.length > 1 || stillOn.length) reply.gone = gone;
    if (stillOn.length) {
      const told = (await refusal()).refusalOf(REMOVAL_PARTIAL, { N: stillOn.length });
      Object.assign(reply, { error: String((refused && refused.message) || told.message), said: told.said, stillOn }); /* plant:si57r-said */
    }
    return reply;
  });
}));
/* A Remove that took some of the person's computers off the team and not all; the engineer's words, placeholder: the copywriter. */
const REMOVAL_PARTIAL = "This teammate is still on the team: some of their computers could not be taken off. Still on the team: {N}. Remove tries them again.";
/** Whether desk `desk` is still on team `named`: by the last removal's roster, or where that reply carries none (a removal whose
 *  team file landed and whose reseal failed answers `team` as {id, epoch}), by the team file read again. A read that fails, or
 *  that finds another team, answers yes, so the removal is tried and its refusal counted rather than the desk passed over. */
async function deskStillOn(project, named, desk, reply) {
  const roster = reply && reply.team && Array.isArray(reply.team.roster) ? reply.team.roster : null;
  if (roster) return roster.some((m) => m && m.id === desk);
  try {
    const facts = await thread.call("teamFacts", project, withHere({ key: await keyFileNow() }));
    if (!facts || !facts.team || facts.team.id !== named || !Array.isArray(facts.team.roster)) return true; /* plant:si57r-reread-bare */
    return facts.team.roster.some((m) => m && m.id === desk); /* plant:si57r-roster */
  } catch { return true; } /* plant:si57r-reread-fails */
}
/* A removal being made: the pass after each sync does not apply removals meanwhile (keysAndRemovals), so it never makes this one
   underneath it. */
let removingNow = 0;
async function removeDeskNow(dir, named, who) {
  removingNow += 1;
  try { return await removeDeskOnce(dir, named, who); }
  finally { removingNow -= 1; }
}
async function removeDeskOnce(dir, named, who, again) {
    const at = await teamsAt(), K = await teamStore(), keyFile = await keyFileNow();
    const onRelay = K.relayTeams(at).some((w) => w.team === named);
    /* A REMOVAL THAT WAITS (Claude alpha's ruling of 2026-11-23 00:37). On the relay the lead's intent is kept at once, and the
       epoch moves only where this Studio then holds the relay's current team file: offline, or behind, no key is made, and the
       removal waits, said on the Desks screen, until keysAndRemovals applies it on top of the newest file by itself. */
    if (onRelay) {
      let before = null;
      try { before = await thread.call("teamFacts", projectDir(dir), withHere({ key: keyFile })); } catch { before = null; }
      const row = before && before.team && Array.isArray(before.team.roster) ? before.team.roster.find((m) => m && m.id === who) : null;
      K.addRemoval(at, named, who, row && typeof row.name === "string" ? row.name : "", Date.now(), row && typeof row.key === "string" ? row.key : ""); /* plant:rmo-intent */
    }
    let catchUpSaid = "";
    if (onRelay) {
      try { await relayOnceLent(); }
      catch (err) { process.stderr.write("studio  the relay could not be caught up before the removal: " + String(err && err.message || err) + "\n"); }
      const up = await (await relayLib()).catchUpBeforeMove(relayRunner, named); /* plant:rs-catch-shell */
      if (up && up.offline && up.said) catchUpSaid = up.said;
      let inStep = true;
      inStep = RELAY_CAUGHT_UP_TEST || (!!up && up.ok === true && teamInStepNow(named)); /* plant:rmo-in-step */
      if (!inStep) return await removalWaits(dir, named, who);
    }
    const facts = await thread.call("teamFacts", projectDir(dir), withHere({ key: keyFile }));
    const cur = facts && facts.team && facts.team.id === named && Number.isInteger(facts.team.epoch)
      && (facts.team.roster || []).some((m) => m && m.id === who) ? facts.team.epoch : 0;
    /* Not on the file the relay holds: nothing to remove, and nothing waits. */
    if (onRelay && !cur) { K.dropRemoval(at, named, who); return withLapse(await desksNow(dir)); }
    let nextKey = null;
    if (cur >= 1) {
      const held = (K.teamKeysOf(at, vault)[named] || {})[cur + 1];
      if (held) nextKey = Buffer.from(held);
      else {
        nextKey = require("node:crypto").randomBytes(32);
        K.keepTeamKey(at, vault, named, cur + 1, nextKey);
        K.markKeyPending(at, named, cur + 1); /* plant:rs920-mark */
      }
    }
    const ask = withHere({ confirm: true, teamKeys: (await teamsNow()).teamKeys, invites: await inviteBook(), teamsFile: at });
    if (nextKey) { ask.nextKey = nextKey; ask.nextEpoch = cur + 1; }
    /* The catch-up before the epoch moves (board 911) ran above, for a relay team: a file the desk stored while trusted is taken
       first. */
    /* THE SERVICE IS TOLD ONLY OF A REMOVAL THAT LANDED (the test architect's read of the relay door, D). It was told before the removal
       (their read of ff35a9e5, finding 2), so that a computer that lost the service after the removal had still told it; but a removal
       that then did not land (a team file that cannot be written, or a desk a stale page names that is no longer on the roster) had already
       taken a person who is still on the team off it at the service, unmarked, and only a Join of theirs puts them back. Now the owed mark
       is written first (forgetAdmitted, below) and the pass that sends it started at once, waited out UNPLACE_WAIT_MS at most before Remove
       answers; a computer that goes in between has the mark, and the pass at the next look sends it. On a relay team the first press is
       also a removal that may wait (the race, below): its mark is written, and the pass started, only once the relay holds the move, and a
       removal that waits is applied again by keysAndRemovals, which writes the mark when it lands. */
    let r;
    try {
      r = await thread.call("removeMember", projectDir(dir), keyFile, named, who, await keySecret(), ask);
    } catch (err) {
      /* The team file landed and a reseal is still owed (board 978). The removal is recorded below, as a removal
         that returned, and the page is told the teammate is removed. The disk's own message stays in error, so a
         reader still sees which file was locked; the sentence in said is what the cover shows. */
      if (!(err && err.landed && err.resealOwed)) throw err;
      r = {
        error: err.message, said: err.said || null, resealOwed: err.resealOwed, removed: err.removed,
        removedDesk: err.removedDesk, removedFiles: err.removedFiles, removedAt: err.removedAt,
        written: err.written, teamKey: err.teamKey, endedInvite: err.endedInvite,
        team: err.team, folder: err.folder, epoch: err.epoch,
      };
    }
    if (r && r.written && r.team) K.clearKeyPending(at, r.team.id, Number(r.team.epoch)); /* plant:rs920-clear */
    /* Remove undoes an admission by code (the handoff's section 6): the removed desk's person is let in by the watch no more, and
       the service's admission by name is withdrawn, not awaited (night decision 22). */
    let told = null;
    /* The first press on a relay team stands only once the relay holds it (the race, below): the service is told then, not before. A
       removal applied again by keysAndRemovals, a team not on the relay, and one that landed with a reseal owed are told here. */
    const racing = onRelay && !!r && !!r.removed && !r.error && !again;
    if (r && r.removed && !racing) { /* plant:jd-shell-race */
      await forgetAdmitted(named, who);
      told = withdrawOwed();
    }
    let fresh = null;
    if (r && r.teamKey) { fresh = Buffer.from(r.teamKey); delete r.teamKey; }
    /* Before the write is treated as kept. The thread has already ended the invitation, ahead of its own team write;
       this mark is the same end, and it is idempotent where that one has run. */
    if (r && r.endedInvite && r.team) {
      try { K.endInvite(at, r.team.id, String(r.endedInvite), "spent", r.removed); }
      catch (err) { process.stderr.write("studio  invitation " + String(r.endedInvite) + " could not be marked spent: " + err.message + "\n"); }
    }
    if (r) delete r.endedInvite;
    if (fresh && r && r.team) (await teamStore()).keepTeamKey(at, vault, r.team.id, r.team.epoch, fresh);
    /* WHAT THE DESK SAID WHILE IT WAS TRUSTED stays its record (board 900, F2; Claude alpha's ruling of 2026-10-17 11:01):
       its key, the time, the new key number and the files its folder held, kept beside the team; nothing it sends after
       counts (src/removed.mjs). */
    if (r && r.removedDesk && r.team) {
      try { (await teamStore()).markRemoved(at, r.team.id, r.removedDesk, r.removedAt, r.team.epoch, r.removedFiles); }
      catch (err) { process.stderr.write("studio  the removal of " + String(r.removed) + " could not be recorded: " + err.message + "\n"); }
    }
    if (r) { delete r.removedDesk; delete r.removedFiles; delete r.removedAt; }
    await keepWritten(r);
    /* The epoch write above is signed before the removal is marked here, so the snapshot rides the next rev. */
    if (r && r.team && r.folder) await publishLead(r.team.id, r.folder);
    if (r) delete r.written;
    if (r && catchUpSaid) r.catchUpSaid = catchUpSaid; /* plant:rs-catch-hand */
    /* THE RACE (Claude alpha's ruling on pZeta run 7): written here, the move is done only once the relay holds it. Refused, as a fork
       is, the removal is shown waiting, never done, and keysAndRemovals applies it again at the next sync by itself. */
    if (racing) {
      let up = true;
      up = RELAY_HELD_TEST || await teamWriteSettled(named, true).catch(() => false); /* plant:rmo-up-or-waiting */
      if (up) {
        K.dropRemoval(at, named, who); /* plant:rmo-stands-drop */
        await forgetAdmitted(named, who);
        told = withdrawOwed();
      }
      if (!up) {
        const waiting = K.removalsOf(at, named).map((w) => ({ desk: w.desk, name: w.name || w.desk, key: w.key }));
        Object.assign(r, { removed: null, pending: who, removalsWaiting: waiting, team: waitingShown(r.team, waiting) }); /* plant:rmo-race-null */
      }
    } else relaySync();
    /* The unplace's pass, started above, is waited on a bounded time last, once the record, the key and the publish are kept. */
    if (told && onRelay) {
      let stop;
      await Promise.race([told, new Promise((res) => { stop = setTimeout(res, UNPLACE_WAIT_MS); })]); /* plant:jd-shell-first */
      clearTimeout(stop); /* no timer is left running behind a pass that answered (tests/relay-studio.mjs reads leftovers after each leg) */
    }
    return withKept(r);
}

/* Whether the project at `project` is sealed to a relay team and the signing key here does not open: a key file that is there and is
   not kept by the operating system, which this Studio cannot sign with until it is restored. */
async function keyToRestoreFor(project) {
  let p = null;
  try { p = JSON.parse(fs.readFileSync(path.join(projectDir(project), "project.json"), "utf8")); } catch { p = null; }
  if (!p || !p.relay || !/^[0-9a-f]{32}$/.test(String(p.relay.rt || ""))) return false;
  const S = await signLib();
  let read = null;
  try { read = S.readKeyFile(await keyFileNow()); } catch { read = null; }
  if (!read || read.kept === S.OS_WRAP) return false;
  return !(await keySecret("probe"));
}
/* Whether the team's relay channel holds the relay's current team file (the pinned channel's teamInStep). A channel pinned before
   it has no such word, and a removal goes ahead there as before. */
function teamInStepNow(team) {
  const ch = relayRunner && typeof relayRunner.channel === "function" ? relayRunner.channel(team) : null;
  const prog = ch && ch.program;
  if (prog && typeof prog.teamInStep !== "function") return true;
  return !!prog && prog.teamInStep() === true;
}
/* Whether the team's mirror holds a team file this computer cannot yet use: a newer epoch's, through a remaining desk's copy, or one
   the relay holds that it cannot open (the pinned channel's teamBehind). */
function teamBehindNow(team) {
  const ch = relayRunner && typeof relayRunner.channel === "function" ? relayRunner.channel(team) : null;
  const prog = ch && ch.program;
  return !!prog && typeof prog.teamBehind === "function" && prog.teamBehind() === true;
}
/* A PERSON WHOSE REMOVAL WAITS STAYS IN THE MEMBER LIST SHOWN, MARKED WAITING (Claude alpha's word of 2026-11-23, relayed by Claudius
   at 13:51), on every look and in the reply, until the removal stands at the relay: until then they can still read. A row the list
   holds is marked; a desk the list written here no longer names (the race: this computer's own file, refused) is shown again from
   what the waiting removal kept. */
function waitingShown(team, waiting) {
  if (!team || !Array.isArray(team.roster) || !Array.isArray(waiting) || !waiting.length) return team;
  const by = new Map(waiting.map((w) => [w.desk, w]));
  const roster = team.roster.map((m) => (m && by.has(m.id) ? Object.assign({}, m, { waiting: true }) : m));
  for (const w of waiting) {
    if (roster.some((m) => m && m.id === w.desk)) continue;
    roster.push({ id: w.desk, name: w.name || w.desk, own: "", rosterName: null, said: "", invite: "", key: w.key || "", admitted: true,
      kind: "desk", door: "", version: "", below: false, waiting: true });
  }
  return Object.assign({}, team, { roster });
}
/* The reply to a Remove that waits: the Desks screen as it stands, with the removal among those waiting. */
async function removalWaits(dir, named, who) {
  const facts = await withLapse(await desksNow(dir));
  return Object.assign(facts || {}, { removed: null, pending: who });
}
/* THE LEAD'S OTHER COMPUTER, AND THE REMOVALS THAT WAIT (Claude alpha's ruling of 2026-11-23 00:37), after each sync. A team whose
   mirror holds a team file this computer has no key for, which a remaining desk's copy brought, takes the key from that file's
   recovery copy under the signing key, setting aside one this Studio made under the same number; the channel then opens the
   relay's own file and is in step. A team in step applies, on top of the file the relay holds, each removal still waiting, as the
   next epoch, and lets go of each the file no longer names. One pass at a time. */
let removalsBusy = false, removalFollow = 0, resealRetry = 0;
const REMOVAL_FOLLOW = 4;
async function keysAndRemovals() {
  if (removalsBusy || !relayRunner || typeof relayRunner.channel !== "function") return;
  removalsBusy = true;
  try {
    const K = await teamStore(), at = await teamsAt();
    let made = false, resealFailed = false;
    for (const t of K.relayTeams(at)) {
      const ch = relayRunner.channel(t.team);
      if (!ch || !ch.program || typeof ch.program.teamInStep !== "function") continue;
      if (!ch.program.teamInStep()) {
        const secret = await keySecret("open");
        if (!secret) continue;
        let r = null;
        /* A fork the channel recorded (the relay's file standing over this computer's): its floor may come down to it. */
        const clash = typeof ch.program.rootClash === "function" ? ch.program.rootClash().find((c) => c && c.path === "etiuda-team.json") : null;
        const fork = !!clash && clash.kept === "team" && typeof ch.program.teamBehind === "function" && ch.program.teamBehind() === true;
        try { r = await thread.call("teamKeyFromFile", t.folder, await keyFileNow(), secret, { teamKeys: (await teamsNow()).teamKeys, fork }); } catch { r = null; }
        if (r && r.key && r.id === t.team) {
          const aside = [];
          try {
            /* A key this Studio made apart under that number is set aside. */
            if (r.aside) aside.push(r.epoch);
            for (const e of aside) K.setAsideTeamKey(at, r.id, e); /* plant:rmo-aside */
            K.keepTeamKey(at, vault, r.id, r.epoch, Buffer.from(r.key)); /* plant:rmo-key-back */
          } catch (err) { process.stderr.write("studio  the key of team " + t.team + "'s newest file could not be kept: " + String(err && err.message || err) + "\n"); continue; }
          /* What went under the key set aside goes again, under the key that stands (Claude alpha's ruling of 06:44). */
          if (typeof ch.program.resendEpoch === "function") for (const e of aside) ch.program.resendEpoch(e); /* plant:rmo-resend */
          ch.kick(); await ch.idle();
        }
      }
      /* WHAT A KEY SET ASIDE SEALED IS SEALED AGAIN, from the keys the store keeps aside, on every pass and not only the one that set
         the key aside (the test architect san's re-read, upheld by Claude alpha): a catalog this computer sealed under such a key is
         sealed again under the key that stands at that number, so a member holding only that key reads it and a removal's reseal
         opens it. A reseal that failed (a quit, a write refused, a folder away) is done at the next pass. It does nothing to a file
         that already opens with the standing key, so it is idempotent; it waits while a Remove is being made here. */
      if (removingNow === 0) {
        const kept = (typeof K.asideTeamKeysOf === "function" ? K.asideTeamKeysOf(at, vault) : {})[t.team] || {};
        const standing = (K.teamKeysOf(at, vault) || {})[t.team] || {};
        let resealed = 0;
        for (const e of Object.keys(kept)) { /* plant:rmo-aside-reseal */
          if (!standing[e]) continue;
          for (const was of kept[e]) {
            try {
              const done = await thread.call("resealAside", t.folder, t.team, Number(e), Buffer.from(was), Buffer.from(standing[e]));
              resealed += done && Array.isArray(done.resealed) ? done.resealed.length : 0;
            } catch (err) {
              resealFailed = true;
              process.stderr.write("studio  the catalogs sealed under team " + t.team + "'s key set aside could not be sealed again: " + String(err && err.message || err) + "\n");
            }
          }
        }
        if (resealed) { ch.kick(); await ch.idle(); }
      }
      if (!ch.program.teamInStep() || removingNow > 0) continue;
      const waiting = K.removalsOf(at, t.team);
      if (!waiting.length) continue;
      const held = (await (await teamLib()).heldTeam(t.folder, { key: await keyFileNow() }).catch(() => ({ team: null }))).team;
      const roster = held && Array.isArray(held.roster) ? held.roster.map((e) => e && e.desk && e.desk.id).filter(Boolean) : null;
      if (!roster) continue;
      const dir = await projectOfTeam(t.team, t.folder);
      for (const w of waiting) {
        if (roster.indexOf(w.desk) < 0) { K.dropRemoval(at, t.team, w.desk); continue; }
        if (!dir) continue;
        /* Made inside this sync: no reply waits on it, and the sync's next turn sends it and lets the removal go. */
        try { await removeDeskOnce(dir, t.team, w.desk, true); made = true; } /* plant:rmo-again */
        catch (err) { process.stderr.write("studio  a removal waiting for team " + t.team + " could not be made: " + String(err && err.message || err) + "\n"); }
        break;
      }
    }
    /* SEVERAL REMOVALS WAITING (a person on several computers, or presses while offline) are applied one per pass, each moving the
       epoch; the sync after each sends it and the next pass takes the next. A pass that made one asks for a sync more at once, and a few
       follow while any still waits, so they all stand without waiting for the team watch; never more than REMOVAL_FOLLOW in a row that
       made none, so a computer that cannot get in step stops asking. */
    if (made) removalFollow = REMOVAL_FOLLOW;
    else if (removalFollow > 0) removalFollow -= 1;
    /* A reseal refused asks for a sync more at once too, so it is tried again within seconds; never more than REMOVAL_FOLLOW in a
       row, after which the passes that come (the team watch's among them) still try it. */
    resealRetry = resealFailed ? resealRetry + 1 : 0;
    const retryNow = resealFailed && resealRetry <= REMOVAL_FOLLOW; /* plant:rmo-reseal-retry */
    if (retryNow || (removalFollow > 0 && K.relayTeams(at).some((t) => K.removalsOf(at, t.team).length))) relaySync(); /* plant:rmo-follow */
  } finally { removalsBusy = false; }
}
/* The project of this Studio that publishes through team `team`: by the team it is sealed to, or by its folder. */
async function projectOfTeam(team, folder) {
  let list = [];
  try { const l = await thread.call("listProjects", projectsRoot(), { userData: app.getPath("userData") }); list = l && Array.isArray(l.projects) ? l.projects : []; }
  catch { list = []; }
  const hit = list.find((p) => p && p.dir && (p.sealedTeam === team || (p.folder && folder && pathsSame(p.folder, folder))));
  return hit ? hit.dir : "";
}

/* ---- invitations and auto-admit (board 885, S2) -------------------------------------------------------------------------
 * AN INVITATION IS MADE HERE, NEVER IN THE PAGE. The thread names the team this Studio leads at the project's folder, the
 * secret is made and sealed into teams.json, and the invitation goes to the clipboard, for the person to paste into the
 * organisation's own mail or chat: the https link for a team on the relay, or the etiuda-join: text where the lead asks for it. Studio sends nothing anywhere. The page is answered with the screen, each live
 * invitation by its id, never its secret or its blob. */
async function tookAdmission(r) {
  if (!r || !r.team) return;
  const K = await teamStore(), at = await teamsAt();
  (r.spent || []).forEach((x) => {
    try { K.endInvite(at, r.team.id, x.invite, "spent", x.desk); }
    catch (err) { process.stderr.write("studio  invitation " + String(x.invite) + " could not be marked spent: " + err.message + "\n"); }
  });
  await keepWritten(r);
  if ((r.spent || []).length && r.team && r.folder) await publishLead(r.team.id, r.folder);
  delete r.written;
  delete r.spent;
}
answer("studio:invite-make", async (e, dir, name, person) => guard(async () => {
  if (!vault.available()) throw (await refusal()).refuse("This computer cannot keep an invitation sealed for the signed-in account, so none was made.");
  const K = await teamStore(), at = await teamsAt();
  const tm = K.studioTeammates(at, { key: await keyFileNow() });
  if (!tm.ok && tm.unreadable) {
    throw (await refusal()).refuse(K.REFUSAL_TEAMS_UNREADABLE);
  }
  if (tm.count >= K.MAX_TEAMMATES) {
    throw (await refusal()).refuse(K.REFUSAL_TEAMMATES_LIMIT);
  }
  const target = Object.assign(await thread.call("inviteTarget", projectDir(dir), await keyFileNow(), withHere()), { signin: await signinHintNow() });
  const I = await inviteLib();
  /* ON THE RELAY (board 900) the invitation names the relay team and its address in place of the folder, with a token the
     relay is told the sha256 of and the relay's id for it; the team file's copy for it is sealed under a key made from its
     secret (src/relay.mjs relayInvite). */
  const kept = K.keptTeam(at, target.team), secret = I.newSecret();
  const relay = kept && kept.relay ? (await relayLib()).relayInvite(secret) : null;
  if (!relay) throw (await refusal()).refuse("There is no team here led from this Studio, so nobody can be invited.");
  const made = I.makeInvite(target, String(name == null ? "" : name).slice(0, 400), secret, Date.now(), undefined,
    { rt: kept.relay.rt, url: kept.relay.url, token: relay.token, inv: relay.inv });
  K.keepInvite(at, vault, target.team, { id: made.id, secret, made: made.made, expires: made.expires, name: made.name,
    person: String(person == null ? "" : person).slice(0, 400), relay });
  await publishLead(target.team, target.folder);
  clipboard.writeText(I.clipText(made));
  relaySync();
  return Object.assign(await desksNow(projectDir(dir)), { invited: made.id });
}));
/* A live invitation again, from its sealed secret, to the clipboard: the https link for a team on the relay, or the etiuda-join:
   text where `form` is "text". Any other value is the default. The reply says which form was
   put there, so the page's note can say it. */
answer("studio:invite-copy", async (e, dir, id, form) => guard(async () => {
  const target = Object.assign(await thread.call("inviteTarget", projectDir(dir), await keyFileNow(), withHere()), { signin: await signinHintNow() });
  const I = await inviteLib(), K = await teamStore(), at = await teamsAt(), want = String(id || "");
  const rec = K.invitesOf(at, target.team).find((i) => i.id === want), secret = K.inviteSecretOf(at, vault, target.team, want);
  if (!rec || rec.state !== "live" || !secret) throw (await refusal()).refuse("This invitation has ended, so it was not copied.");
  const kept = K.keptTeam(at, target.team), onRelay = kept && kept.relay
    ? K.relayInvitesOf(at, vault, target.team).find((i) => i.id === want) : null;
  if (kept && kept.relay && !(onRelay && onRelay.token)) throw (await refusal()).refuse("This invitation has ended, so it was not copied.");
  const copyAs = form === "text" ? "text" : "link"; /* plant:s3-form */
  const made = I.makeInvite(target, rec.name, secret, rec.made, undefined,
    onRelay ? { rt: kept.relay.rt, url: kept.relay.url, token: onRelay.token, inv: onRelay.inv } : undefined);
  clipboard.writeText(I.clipText(made, copyAs));
  return Object.assign(await desksNow(projectDir(dir)), { copied: want, as: I.clipForm(made, copyAs) });
}));
/* THE DESKS LINE MOVES THE TEAM TO A NEW KEY and cancels nothing. A spent invitation stays spent. The move is the one a
   cancel's confirm runs: the next key is kept first, then the thread moves the share. The refused attempt leaves the
   book inside that move. Dismiss takes one line off and moves nothing. */
answer("studio:team-key-move", async (e, dir) => guard(async () => {
  const project = String(dir || "");
  const target = await thread.call("inviteTarget", project, await keyFileNow(), withHere());
  const at = await teamsAt(), K = await teamStore();
  await teamAct(target.team, async () => {
    const facts = await thread.call("teamFacts", project, withHere({ key: await keyFileNow() }));
    const cur = facts && facts.team && facts.team.id === target.team && Number.isInteger(facts.team.epoch) ? facts.team.epoch : 0;
    let nextKey = null;
    if (cur >= 1) {
      const held = (K.teamKeysOf(at, vault)[target.team] || {})[cur + 1];
      if (held) nextKey = Buffer.from(held);
      else {
        nextKey = require("node:crypto").randomBytes(32);
        K.keepTeamKey(at, vault, target.team, cur + 1, nextKey);
      }
    }
    const ask = withHere({ confirm: true, teamKeys: (await teamsNow()).teamKeys, invites: await inviteBook(), teamsFile: at });
    if (nextKey) { ask.nextKey = nextKey; ask.nextEpoch = cur + 1; }
    const moved = await thread.call("moveTeamKey", project, await keyFileNow(), target.team, await keySecret(), ask);
    let fresh = null;
    if (moved && moved.teamKey) { fresh = Buffer.from(moved.teamKey); delete moved.teamKey; }
    if (fresh && moved && moved.team) K.keepTeamKey(at, vault, moved.team.id, moved.team.epoch, fresh);
    await keepWritten(moved);
    if (moved) delete moved.written;
  });
  if (target.team) await publishLead(target.team, target.folder);
  relaySync();
  return desksNow(project);
}));
answer("studio:tried-dismiss", async (e, dir, id, desk) => guard(async () => {
  const project = String(dir || "");
  const target = await thread.call("inviteTarget", project, await keyFileNow(), withHere());
  (await teamStore()).dismissTried(await teamsAt(), target.team, String(id || ""), String(desk || ""));
  return desksNow(project);
}));
/* A RELAY INVITATION IS CANCELLED HERE. An unused one is dropped, and the link then says it was already used. An answer
   that names it as used, or a row the book already calls used, asks once and then moves the team to a new key with
   nobody removed. The cancel is marked in the book first, as soon as the decision is known, ahead of the catch-up before
   the move, so the watch cannot let in through the invitation a request that catch-up lands; the drop of one the book
   already knew was used then rides the sync that catch-up begins with. A joined desk is Remove, which is the member
   handler above, and is not this one. The cancel is never undone: the new key is kept before the thread is asked to move
   the share, as Remove keeps it, and a move that fails, or lands and then throws, leaves the
   invitation gone and its secret forgotten, and that key kept, since the share may already be using it. Putting teams.json
   back from before the cancel would hold the invitation live again under a team at the next epoch, and the next sync would
   seal the new key to the very device the lead cancelled (the read of 227e3ec, E1). */
answer("studio:invite-cancel", async (e, dir, id, confirm) => guard(async () => {
  const project = projectDir(dir);
  const target = await thread.call("inviteTarget", project, await keyFileNow(), withHere());
  const at = await teamsAt(), K = await teamStore(), want = String(id || "");
  const rec = K.relayInvitesOf(at, vault, target.team).find((i) => i.id === want);
  if (!rec) throw (await refusal()).refuse("This invitation has ended, so it was not cancelled.");
  const pending = rec.pendingMove === true;
  const knownUsed = rec.relayState === "used" || rec.relayState === "asked" || Number.isFinite(rec.relayUsed);
  const Relay = await relayLib();
  if (confirm === true && !vault.available()) {
    const R = await refusal();
    throw R.refuse(noKeyring()
      ? "This computer cannot keep a team key for this account: no keyring is open to seal it. To have one, install GNOME Keyring (the gnome-keyring package) or KDE Wallet, sign in again and reopen Studio."
      : "This computer cannot keep a team key for this Windows account.");
  }
  let decision;
  if (pending || knownUsed) {
    decision = await Relay.cancelInvitation({ id: rec.inv, confirm: confirm === true, pending: pending, knownUsed: knownUsed }); /* plant:s3c-known */
  } else {
    const opened = Relay.leadOpened(await keyFileNow(), await keySecret());
    if (!opened) throw (await refusal()).refuse("The signing key did not open on this computer, so nothing was written.");
    const kept = K.keptTeam(at, target.team);
    if (!relayRunner) { try { await relayOnceLent(); } catch { /* ignore */ } }
    const request = relayRunner && typeof relayRunner.request === "function" ? relayRunner.request : wire.relayRequest; /* plant:s3c-runner-call */
    decision = await Relay.cancelInvitation({
      call: { url: kept.relay.url, rt: kept.relay.rt, open: opened.open, request, t: Math.floor(Date.now()) },
      id: rec.inv, confirm: confirm === true }); /* plant:s3c-used */
  }
  if (!decision || decision.ok !== true) throw (await refusal()).refuse("The relay did not cancel that invitation, so nothing was changed.");
  const moving = decision.moveNow === true;
  /* The cancel is marked in the book as soon as the decision is known and the keyring has answered, before the catch-up below:
     until it is marked the invitation is still live in the book, and the watch lets in, with nobody present, a request that
     proves a live invitation, so a request from the very desk being cancelled, landed in the mirror by that catch-up, could
     be admitted and the new key wrapped for it (board 933, the review of slice 3, finding 1). The keyring check stays above:
     a refusal there changes nothing, and the press can be made again. */
  if (decision.dropNow === true || moving) Relay.noteCancel(at, target.team, want, decision); /* plant:s3c-note */
  let catchUpSaid = "";
  if (moving && K.relayTeams(at).some((w) => w.team === target.team)) {
    try { await relayOnceLent(); }
    catch (err) { process.stderr.write("studio  the relay could not be caught up before the move: " + String(err && err.message || err) + "\n"); }
    const up = await Relay.catchUpBeforeMove(relayRunner, target.team);
    if (up && up.offline && up.said) catchUpSaid = up.said;
  }
  let nextKey = null, cur = 0;
  if (moving) {
    await teamAct(target.team, async () => {
      const facts = await thread.call("teamFacts", project, withHere({ key: await keyFileNow() }));
      cur = facts && facts.team && facts.team.id === target.team && Number.isInteger(facts.team.epoch) ? facts.team.epoch : 0;
      if (cur >= 1) {
        const held = (K.teamKeysOf(at, vault)[target.team] || {})[cur + 1];
        if (held) nextKey = Buffer.from(held);
        else {
          nextKey = require("node:crypto").randomBytes(32);
          K.keepTeamKey(at, vault, target.team, cur + 1, nextKey);
        }
      }
      const ask = withHere({ confirm: true, teamKeys: (await teamsNow()).teamKeys, invites: await inviteBook(), teamsFile: at });
      if (nextKey) { ask.nextKey = nextKey; ask.nextEpoch = cur + 1; }
      const moved = await thread.call("moveTeamKey", project, await keyFileNow(), target.team, await keySecret(), ask);
      let fresh = null;
      if (moved && moved.teamKey) { fresh = Buffer.from(moved.teamKey); delete moved.teamKey; }
      if (fresh && moved && moved.team) K.keepTeamKey(at, vault, moved.team.id, moved.team.epoch, fresh);
      K.markRelayInvite(at, target.team, want, { pendingMove: false }); /* plant:s3c-pending */
      await keepWritten(moved); /* plant:s3c-kept */
      if (moved) delete moved.written;
    });
  }
  if (decision.dropNow === true || moving) relaySync();
  return Object.assign(await desksNow(project), { needsConfirm: decision.needsConfirm === true, moved: moving },
    catchUpSaid ? { catchUpSaid: catchUpSaid } : {});
}));
/* FOR THE IT DEPARTMENT (sense pass finding 17): the desk's Group Policy template, filled in with the lead's key,
   saved into a folder the person picks (STUDIO_TEST_POLICY answers it), as a PolicyDefinitions folder holds it; or
   the value put on the clipboard. Studio sends nothing: the person hands either over. */
answer("studio:policy-save", async (e, dir, title) => guard(async () => {
  let folder = testOnly("STUDIO_TEST_POLICY");
  if (!folder) {
    const r = await pick("open", BrowserWindow.fromWebContents(e.sender), { title: String(title || ""),
      properties: ["openDirectory", "createDirectory"] });
    if (r.canceled || !r.filePaths.length) return { canceled: true };
    folder = r.filePaths[0];
  }
  return thread.call("savePolicy", projectDir(dir), String(folder), await keyFileNow(), withHere());
}));
answer("studio:policy-copy", async (e, dir) => guard(async () => {
  const r = await thread.call("policyValues", projectDir(dir), await keyFileNow(), withHere());
  clipboard.writeText(String(r.text));
  return { copied: true };
}));

/* A WAITING REQUEST PAST THE LIMIT OF 30 is said once on the Desks screen (withLapse), then not again while it waits. */
const limitSkipped = new Map();     // team id -> sentence, until the Desks screen has said it
const limitSkippedSaid = new Set(); // team ids already told, so a later look says nothing
const LIMIT_SKIPPED_SENTENCE = "A teammate is waiting to join, but this Studio already has 30, open invitations included. Its request waits until a place frees.";
const engineLib = lazy("engine.mjs");
/* THE WATCH (board 885, S2): every team this Studio leads with a folder, on the window's focus and every five minutes
   (src/team-watch.mjs WATCH_MS), and at once when the live desks watch reports a join.json, so a request is seen, and let
   in where it may be, while no screen is open. A folder whose
   stamp of stats has not moved since it was last acted on is not read. Where the team has a live invitation, or the
   lead's automatic joining is on, the thread lets in, nobody present, every request proving a live invitation (Claude
   alpha's ruling of 2026-10-13 11:30) and, with the switch on, every one naming none, and signs the team; where the
   signing key does not open (a key that needs its passphrase), nothing is let in, the screen says so, and the next run
   tries the key again before it reads anything. A team with neither is only stat'ed, so a request that names no
   invitation waits for the lead's press. A folder that moved is told to the page, which reads it again if it is the one on
   the screen. One run at a time: a trigger during a run asks for one more after it, and its promise is that one's. */

const teamWatchLib = lazy("team-watch.mjs");
const watchMemo = new Map(), watchActed = new Map(), watchHeld = new Set(), watchPaused = new Map(), watchEditions = new Map();
let watchRun = null, watchMore = null;
function teamWatch(force) {
  if (relayClosed) return Promise.resolve();
  if (watchRun) { watchMore = force || watchMore || ""; return watchRun.then(() => watchRun || undefined); }
  /* The watch, and the re-arm in finally, start outside any act. A store kept here would make the
     watch's own teamAct read as nested. */
  let begin = (fn) => fn();
  begin = (fn) => activeTeamActs.exit(fn); /* plant:team-watch-exit */
  watchRun = begin(() => watchOnce(force || "")
    .catch((err) => { process.stderr.write("studio  the team watch stopped: " + String(err && err.message || err) + "\n"); })
    .finally(() => { watchRun = null; if (watchMore !== null) { const f = watchMore; watchMore = null; teamWatch(f); } else { checkWaitingSafe(); } }));
  return watchRun;
}
/* Whether the book holds a live invitation of `team` that has not ended, the only kind a request can prove. */
function liveFor(book, team) {
  const now = Date.now();
  return Object.keys(book || {}).some((id) => { const b = book[id];
    return !!b && b.team === team && b.state === "live" && !!b.secret && Date.parse(String(b.expires || "")) > now; });
}
/* THE RESEAL A REMOVAL OR A KEY MOVE LEFT UNFINISHED (board 974, C2) is completed by the watch, never by asking the lead to
   publish: the thread's resealBehind seals each newest edition still at an older key number again at the team file's. Asked at
   start, at each look that finds the folder changed (a removal's team file lands there), and at every look while a team is in
   resealOwed, which a pass that left something keeps it in. Inside the team's act, so it never runs beside a removal or a move
   of that team. */
const resealOwed = new Set();
async function resealLed(t) {
  try {
    await teamAct(t.team, async () => {
      const r = await thread.call("resealBehind", t.folder, await keyFileNow(),
        withHere({ teamKeys: (await teamsNow()).teamKeys, skip: [] }));
      if (r && r.owed) resealOwed.add(t.team); else resealOwed.delete(t.team);
    });
  } catch (err) {
    resealOwed.add(t.team);
    process.stderr.write("studio  the team's newest editions could not be sealed again at " + t.folder + ": " + String(err && err.message || err) + "\n");
  }
}
async function watchUnlock() {
  const Sgn = await signLib(), secret = await keySecret();
  let opened = null;
  try { opened = secret ? Sgn.unlockKey(Sgn.readKeyFile(await keyFileNow()), secret) : null; } catch { opened = null; }
  return { opened, secret };
}
async function watchOnce(force) { /* plant:txjl-8jlc-5 */
  await rearmUseWatches();
  /* An admission a Remove left owed at the service is withdrawn now, beside the look and not awaited by it; it only takes away, so
     it goes whether or not Studio works. Nothing else here does: a Studio that does not work admits no one and changes no team (the
     rearm above arms nothing then, for armCatalogWatches asks worksNow itself). */
  withdrawOwed();
  if (!(await worksNow())) return; /* plant:s1b-watch */
  resumeWhenHeld(true); /* plant:hold-resume-look */
  const K = await teamStore(), W = await teamWatchLib(), at = await teamsAt();
  const Use = await catalogUse(), paused = await licencePausedNow();
  let opened = undefined, secret = null;
  const moved = [];
  let book = null;
  for (const t of K.watchedTeams(at)) {
    const forced = !!force && path.resolve(String(force)) === path.resolve(t.folder);
    const key = t.team + "|" + t.folder, was = watchActed.get(key);
    const work = t.folder;
    let stamp = W.folderStamp(work, watchMemo);
    const changed = stamp !== was;
    /* The lead's pause note is looked at only when the folder moved, the watch is forced, or the licence's pause changed,
       so a focus with nothing changed reads nothing (shell-guards 18d). */
    if (changed || forced || watchPaused.get(key) !== paused) {
      if (opened === undefined) { const u = await watchUnlock(); opened = u.opened; secret = u.secret; } /* plant:f9-watch-unlock */
      Use.noteTeamPause(work, t.team, opened, paused);
      watchPaused.set(key, paused);
    }
    /* A sealed team's root editions are looked at as well (W.editionStamp): a stray edition sealed at the old key number by this
       lead's other Studio is sealed again at this look. A team the lead turned to Plain here has none to seal. */
    const keptHere = K.keptTeam(at, t.team), sealedHere = !keptHere || keptHere.sealed !== false;
    const editionsNow = sealedHere ? W.editionStamp(work, watchMemo) : "";
    const editionsMoved = editionsNow !== watchEditions.get(key);
    const owedReseal = resealOwed.has(t.team);
    if (!changed && !forced && !watchHeld.has(key) && !owedReseal && !editionsMoved) continue;
    await absorbLeadFolder(t.folder);
    /* After the lead's book, so a key number this Studio has only just taken from the recovery copy is held. */
    if (changed || forced || owedReseal || editionsMoved) await resealLed(t);
    /* Read again after the reseal, so its own writes do not count as a change at the next look. */
    watchEditions.set(key, sealedHere ? W.editionStamp(work, watchMemo) : "");
    let told = (changed && was !== undefined) || forced;
    let watchDeferred = false;
    if (!book) book = await inviteBook();
    /* A signed-in lead's watch always asks: a known person's other desk, or one the lead admitted by code, needs neither
       automatic joining nor an invitation (watchAdmit's `known`). */
    if (Use.admitOpen(paused) && (liveFor(book, t.team) || !!seatRefNow())) {
      if (secret === null) secret = await keySecret();
      if (!secret) {
        if (!watchHeld.has(key)) told = true;
        watchHeld.add(key);
      } else {
        await teamAct(t.team, async () => {
          /* One folder that fails (a share gone away mid-read) is said and left until its stamp moves again; the others
             are still looked at. */
          try {
            const atNow = await teamsAt();
            /* The book again, at the call. A cancel since this pass loaded its copy is already in the file, and the
               thread reads that file once more at the start of the write. */
            /* ONE LOOK AT THE DOOR (board 1017's B; src/desk-seat.mjs doorLook): the first pass admits by the people kept without their Joins;
               only where it refuses a request is the lead's list read, its Joins kept, and a second pass made; what that still refuses is
               dropped at the relay. Each pass is the watch's own admission, with what follows a desk let in. */
            const admitOnce = async (people) => {
              const seen = await inviteBook();
              book = seen;
              const r = await thread.call("watchAdmit", t.folder, await keyFileNow(), secret,
                withHere({ revoked: await revokedKeysNow(), teamKeys: (await teamsNow()).teamKeys, invites: seen, teamsFile: atNow, people }));
              if (r && r.needKey) watchHeld.add(key); else watchHeld.delete(key);
              if (r && r.skipped && r.skipped.some((s) => s && (s.why === "limit" || (typeof s.why === "string" && s.why.includes("30"))))) {
                const teamId = (r.team && r.team.id) || t.team;
                if (teamId && !limitSkippedSaid.has(teamId)) {
                  limitSkipped.set(teamId, LIMIT_SKIPPED_SENTENCE);
                  told = true;
                }
              }
              if (r && r.admitted && r.admitted.length) {
                const spent = (r.spent || []).slice(), doors = (r.doors || []).slice();
                await tookAdmission(r);
                await answerJoined(t.team, t.folder, spent, doors); /* plant:s922-shell-joined */
                book = null;
                stamp = W.folderStamp(work, watchMemo);
                told = true;
              }
              return r;
            };
            await (await deskSeatLib()).doorLook({ team: t.team, lookAt: Date.now(), people: readTeamPeople, admit: admitOnce, /* plant:jd-shell-look */
              fresh: (since) => joinedFresh(t.team, since), keep: (people, at) => joinedKept(t.team, people, at),
              drop: (refused) => dropDoorsRefused(t.team, refused), /* plant:a4-shell-drop */
              relook: () => joinRelookFor(t) });
          } catch (err) {
            process.stderr.write("studio  the team watch could not let desks in at " + t.folder + ": " + String(err && err.message || err) + "\n");
          }
        });
      }
    } else watchHeld.delete(key);   /* nothing left here that could join with nobody present */
    /* The desks' proofs of their persons (board 980, stage 3), at a look whose folder moved: one team that fails is said and left. */
    if (changed || forced) {
      if (secret === null) secret = await keySecret();
      if (secret) {
        try {
          if ((await teamAct(t.team, () => seatPass(t, secret))) === false) watchDeferred = true;
        } catch (err) {
          process.stderr.write("studio  the desks' sign-ins could not be read at " + t.folder + ": " + String(err && err.message || err) + "\n");
        }
      }
    }
    if (!watchDeferred) watchActed.set(key, stamp);
    if (changed || forced) {
      try { if ((await landDue(t.folder)) === false) watchActed.delete(key); /* an answer left due is looked at again at the next look */ } catch (err) {
        process.stderr.write("studio  a catalog answer could not be landed at " + t.folder + ": " + String(err && err.message || err) + "\n");
      }
    }
    if (told) moved.push(t.folder);
  }
  const win = theWindow;
  if (win && !win.isDestroyed()) moved.forEach((f) => win.webContents.send("studio:team-moved", f));
  relaySync();
  return moved;
}

/* THE RELAY (board 900, relay slice 1, step 5). Every team this Studio leads on the relay has its mirror kept in step by the
   pinned engine's channel layer while Studio runs (src/relay.mjs relayRunner); its folder is that mirror (src/team-store.mjs
   keepRelay), so the watch above, the Desks screen and every read find it as they find a share, and a team on a folder
   meets none of this. A sync makes the lead's calls each team owes (its space, the enrolled desks, the invitations, the
   head) and keeps its channel running: with the window, after each pass of the watch (on focus, every five minutes and on
   a desk's request), and after an invitation or a removal. The signing key opens from the vault at each call of the layer
   and is kept nowhere; every call goes through src/wire.cjs alone. One sync at a time: one asked during a run runs once
   after it. */
const relayLib = lazy("relay.mjs");
/* ---- THIS STUDIO AS A TEAMMATE ON ANOTHER STUDIO'S TEAM (board 962, stage 7, V2) -----------------------------------------
 * src/member.mjs holds the member key and the followed team; here it is kept in step while Studio runs, by a run of its own
 * (followRun): the pinned channel layer over this shell's one door to the relay. It is never in
 * relayRunner, which serves only the teams this Studio leads, and it stops with it at quit. The page reaches
 * the three channels below once V4 gives it the screen: the bridge names a member only where the page calls it (shell-guards 12a). */
const memberLib = lazy("member.mjs");
const linkLib = lazy("link.mjs");
let followRun = null;
const FOLLOW_LEAVE_MS = 5000;
async function signingPublicNow() {
  try { const k = (await signLib()).readKeyFile(await keyFileNow()); return k ? k.public : ""; } catch { return ""; }
}
async function followStop() {
  const run = followRun;
  followRun = null;
  if (run) { try { await run.stop(); } catch { /* already down */ } }
}
/* THE PAGE IS TOLD WHEN THE FOLLOWED TEAM'S STATE MOVES (board 974, C1 (c)): the run's onState, an admission above all, so a
   Settings page open on the team's row says the new state without a visit elsewhere and back. Nothing crosses but the signal;
   the page reads studio:follow-state, which opens the record here. */
function followSignal() {
  const win = theWindow;
  try { if (win && !win.isDestroyed()) win.webContents.send("studio:follow-changed"); } catch { /* the page has gone */ }
}
/* Starts the followed team's run where one is followed and none runs, and stops a run whose team is no longer followed. */
async function followStart() {
  if (relayClosed) return null;
  if (!(await worksNow())) { await followStop(); return null; } /* plant:s1b-follow */
  const M = await memberLib(), K = await teamStore(), at = await teamsAt();
  const f = K.followingOf(at, vault);
  if (!f) { await followStop(); return null; }
  if (followRun && followRun.team === f.team) return followRun;
  await followStop();
  followRun = M.startFollow({ teamsFile: at, vault, memberFile: M.memberKeyFile(app.getPath("userData")), signingPublic: await signingPublicNow(),
    request: wire.relayRequest, connect: wire.relayConnect, say: (line) => { process.stderr.write("studio  the followed team: " + line + "\n"); },
    onState: () => followSignal(), /* plant:974c1d-signal */
    seat: () => seatCertNow("member"), seatRenew: () => seatRenewNow(), onSeat: (team, s) => relaySeatTold(team, s), /* plant:c1-shell-member */
    pollMs: Number(testOnly("STUDIO_FOLDER_POLL_MS")) || undefined });
  return followRun;
}
/* THE FOLLOWED TEAM'S CATALOGS AS THE THREAD READS THEM (src/link.mjs followedFor): judged here, where the vault opens the
   followed record, and handed over, so the thread never opens the followed mirror. followedSeen is the last answer without the
   catalogs' text, which every read of a project carries for a copy's sign; the open, a take and a press read it again. */
let followedSeen = null;
async function followedNow(withText) {
  let r = null;
  try { r = await (await linkLib()).followedFor(await teamsAt(), vault, { text: !!withText }); } catch { r = null; }
  followedSeen = r ? { team: r.team, state: r.state, editions: r.editions.map((x) => ({ catalog: x.catalog, rev: x.rev, file: x.file })) } : null;
  return r;
}
/* After a take or a press from a followed team's catalog, the member's in-use file names that catalog and the edition brought,
   as a desk's names the catalog it uses (stage 7, question 8: the one brought most recently), and the run sends it. A failed
   write leaves the take or the press standing. The page is answered without it. */
async function inUseUp(r) {
  if (!r || !r.inUse) return r;
  const catalog = r.inUse, out = Object.assign({}, r);
  delete out.inUse;
  try {
    const M = await memberLib();
    M.writeInUse({ teamsFile: await teamsAt(), vault, memberFile: M.memberKeyFile(app.getPath("userData")), signingPublic: await signingPublicNow(), catalog }); /* plant:to18-inuse */
    const run = await followStart();
    if (run) run.kick();
  } catch { /* the in-use file waits for the next take or press */ }
  return out;
}
/* A member's refusal carries its sentence; the page says it as any refusal. */
async function memberRefusal(err) {
  if (err && err.said && err.said.frame) return (await refusal()).refuse(err.said.frame);
  return err;
}
answer("studio:follow-join", async (e, text, name) => guard(async () => {
  const M = await memberLib(), at = await teamsAt();
  /* A join of the team already followed replaces its record and the channel's state; nothing may run over them meanwhile. */
  await followStop();
  try {
    M.joinTeam({ teamsFile: at, vault, memberFile: M.memberKeyFile(app.getPath("userData")), text: String(text == null ? "" : text).slice(0, 8192),
      name: String(name == null ? "" : name).slice(0, 120), signingPublic: await signingPublicNow() });
  } catch (err) { throw await memberRefusal(err); }
  await followStart();
  await followedNow();
  return { follow: M.followView(at, vault) };
}));
/* Leaving: the request is taken back, the run is given a moment to send that, and the followed team's mirror goes to the
   Recycle Bin. Every edition this Studio took stays in its own catalogs. trashed is false only where a mirror was there
   and the Recycle Bin refused it. Where there was no mirror, nothing was kept, and trashed stays true. */
answer("studio:follow-leave", async () => guard(async () => {
  const M = await memberLib(), at = await teamsAt();
  const run = followRun;
  followRun = null;
  /* Both files go off the team's place, the run sends that for up to FOLLOW_LEAVE_MS and stops, and then the record goes. */
  const left = await M.leaveTeam({ teamsFile: at, vault, memberFile: M.memberKeyFile(app.getPath("userData")), run, ms: FOLLOW_LEAVE_MS });
  const gone = folderAt(left && left.mirror);
  let trashed = true;
  if (gone) { try { await shell.trashItem(gone); } catch { trashed = false; /* the mirror stays in the user data folder */ } }
  followedSeen = null;
  return { follow: null, left: !!left, trashed };
}));
/* The followed team's view, and notLive where its run's socket does not get through while the asking does (board 989). */
answer("studio:follow-state", async () => guard(async () => {
  const M = await memberLib(), view = M.followView(await teamsAt(), vault);
  if (view && followRun && followRun.team === view.team && followRun.notLive()) view.notLive = true;
  /* The team's relay refused this Studio's seat: the row asks for the sign-in and says why (src/member.mjs seatAskOf). */
  const ask = view ? M.seatAskOf(view.team, relaySeatRefused, readServiceState()) : "";
  if (ask) view.seatAsk = ask; /* plant:c6-view */
  return { follow: view };
}));
const wire = require(path.join(ROOT, "src", "wire.cjs"));
/* A COMPANY PROXY THAT ASKS FOR A SIGN-IN (src/wire.cjs, A COMPANY PROXY): where Chromium cannot answer a proxy with the Windows
   account, the door asks here, once per proxy, and the question goes to the page; the answer goes back to the door and is kept
   nowhere in this file, never written and never logged. The door's lines name the proxy's host and port alone. */
const proxyAsks = new Map();
let proxyAskSeq = 0;
/** The questions still open, as the page takes them: {id, host, port, again}. */
function proxyAsksOpen() {
  return [...proxyAsks].map(([id, a]) => ({ id, host: String(a.info.host || ""), port: Number(a.info.port) || 0, again: a.info.again === true }));
}
function proxyAskShow() {
  const win = theWindow;
  if (!win || win.isDestroyed()) return;
  for (const q of proxyAsksOpen()) { try { win.webContents.send("studio:proxy-ask", q); } catch { /* the page has gone */ } }
}
wire.proxyAsking((info) => new Promise((resolve) => { proxyAsks.set(++proxyAskSeq, { info: info || {}, resolve }); proxyAskShow(); }), /* plant:proxy-ask-shell */
  (line) => process.stderr.write("studio  " + line + "\n"));
/* Every question still open, asked for by the page as it loads, so one asked before the window opened, or before a reload, waits for it. */
answer("studio:proxy-asks", async () => proxyAsksOpen());
/* The page's answer by id: an empty or absent user name is "Not now", and the password goes on only with a name. */
answer("studio:proxy-answer", async (e, id, username, password) => {
  const at = typeof id === "number" && Number.isInteger(id) ? id : 0;
  const a = at ? proxyAsks.get(at) : undefined;
  if (!a) return false;
  proxyAsks.delete(at);
  const name = typeof username === "string" ? String(username) : "";
  a.resolve(name !== "" ? { username: name, password: typeof password === "string" ? String(password) : "" } : null); /* plant:proxy-answer-shell */
  return true;
});
let relayRunner = null, relayBusy = null, relayMore = false, relaySign = null, relayKeyAt = "";
/* Once quit has started, nothing may arm the runner again (endRelay). */
let relayClosed = false, relayEnding = null, watchTimer = null, licenceFirst = null, licenceTick = null;
/* THE ROOTS A RELAY GRANT MAY TRACE TO (board 935, slice G3): none named, so the pinned relay's own constant, the vendor's root, stands.
   A gate points the relay legs at an invented root with STUDIO_RELAY_ROOT, its public half in 64 hex; an installed Studio ignores it
   (testOnly), as it does every variable that moves a place or a trust. A development Studio started with ETIUDA_SIGNIN_LAB judges
   a grant under the lab's root, as src/licence.mjs judges a licence (src/signin-lab.cjs; null installed, read once as the door
   above loaded it). */
const SIGNIN_LAB = require(path.join(ROOT, "src", "signin-lab.cjs")).lab;
/* THE SITE'S ORIGIN THE TEAM'S ORDER PAGE SITS UNDER (board 1020): unset in every build until the site goes live, so Buy offers no order
   page there (src/buy-path.cjs buyAddress answers nowhere); a development Studio takes it from the lab file's "order", the origin the desk
   reads under the same name, and Buy adds the team page's path in Studio's language. */
let ORDER_ORIGIN = "";
if (SIGNIN_LAB && SIGNIN_LAB.order) ORDER_ORIGIN = SIGNIN_LAB.order;
const BUY = require(path.join(ROOT, "src", "buy-path.cjs"));
function relayRootsNow() {
  if (SIGNIN_LAB && SIGNIN_LAB.root) return [SIGNIN_LAB.root];
  const r = testOnly("STUDIO_RELAY_ROOT"); /* plant:g3-testonly */
  return /^[0-9a-f]{64}$/.test(r) ? [r] : undefined;
}
/* The signing key's secret as keySecret answers it, for the layer, which asks at each call and cannot wait. */
function relaySecret() {
  const S = relaySign;
  if (!S) return "";
  let read = null;
  try { read = S.readKeyFile(relayKeyAt); } catch { return ""; }
  if (!read) return "";
  if (read.kept !== S.OS_WRAP) return testOnly("STUDIO_KEY_PASSPHRASE");
  try { return String(vault.open(Buffer.from(String(read.doc.private), "base64"))); } catch { return ""; }
}

/* `askTaken`: the next sync asks again for a team marked taken (Check now). */
let relayAskTaken = false;
/* `through`: the one sync a sign-out asks for to close its doors at the relay, which only takes away, so it goes even where Studio
   no longer works. */
let relayThrough = false;
function relaySync(askTaken, through) { return lendingTo(() => relaySyncNow(askTaken, through)); }
function relaySyncNow(askTaken, through) {
  if (askTaken === true) relayAskTaken = true;
  if (through === true) relayThrough = true;
  if (relayClosed) return Promise.resolve();
  const testSync = testOnly("STUDIO_TEST_RELAY_SYNC");
  if (testSync === "empty") return Promise.resolve([]);
  if (testSync === "omit") return Promise.resolve([{ team: "t-other", ok: true }]);
  if (testSync === "none") return Promise.resolve();
  if (relayBusy) { relayMore = true; return relayBusy; }
  /* The runner and its watches start outside any act, the same way a team watch does. */
  relayBusy = activeTeamActs.exit(() => (async () => {
    let out;
    do {
      relayMore = false;
      if (relayClosed) break;
      try { out = await relayOnce(); }
      catch (err) { process.stderr.write("studio  the relay could not be kept in step: " + String(err && err.message || err) + "\n"); }
    } while (relayMore && !relayClosed);
    return out;
  })().finally(() => { relayBusy = null; checkWaitingSafe(); }));
  return relayBusy;
}
async function relayOnce() {
  if (relayClosed) return;
  const through = relayThrough;
  relayThrough = false;
  if (!through && !(await worksNow())) return; /* plant:s1b-relay */
  const K = await teamStore(), at = await teamsAt();
  if (!relayRunner && !K.relayTeams(at).length) return;
  const keyAt = await keyFileNow();
  if (!relayRunner || keyAt !== relayKeyAt) {
    if (relayRunner) await relayRunner.stop();
    relaySign = await signLib();
    relayKeyAt = keyAt;
    relayRunner = (await relayLib()).relayRunner({ teamsFile: at, vault, keyFile: keyAt, secret: relaySecret, roots: relayRootsNow(), /* plant:g3-roots */
      request: wire.relayRequest, connect: wire.relayConnect, say: (line) => { process.stderr.write("studio  " + line + "\n"); },
      onLapse: () => { lapseNudge(); },
      onSyncNote: () => { syncNoteNudge(); },
      fetchGrant: () => licenceOnce(true),
      revokedKeys: () => revokedKeysNow(),
      seat: () => seatCertNow("lead"), seatRenew: () => seatRenewNow(), onSeat: (team, s) => relaySeatTold(team, s), /* plant:c1-shell-lead */
      /* The standing door is open to this Studio's own licence while it is signed in, and to none otherwise (board 980, A4). */
      doorRefs: () => { const ref = seatRefNow(); return ref ? [ref] : []; }, /* plant:a4-shell-door */
      /* The open doors, set at the licence service so a desk its licence certifies finds its team (board 980, the door-finding). */
      serviceDoors: (doors) => serviceDoorsSet(doors), /* plant:sd-shell */
      teamAct: runnerTeamAct });
  }
  const askTaken = relayAskTaken;
  relayAskTaken = false;
  const out = await activeTeamActs.exit(async () => {
    const synced = await relayRunner.sync({ askTaken });
    if (relayRunner && typeof relayRunner.idle === "function") {
      try { await relayRunner.idle(); } catch {}
    }
    return synced;
  });
  try { await keysAndRemovals(); } /* plant:rmo-after-sync */
  catch (err) { process.stderr.write("studio  the removals waiting could not be looked at: " + String(err && err.message || err) + "\n"); }
  await lapseNudge();
  return out;
}
/* A step of a team's lapse the lead has not been given yet, as the relay tells it or as its dates pass: the page is told to ask for
   it (studio:relay-lapse), and is given it there once. */
async function lapseNudge() {
  try {
    const win = theWindow;
    if (win && !win.isDestroyed() && (await relayLapses()).due.length) win.webContents.send("studio:relay-lapse-due"); /* plant:g2s-nudge */
  } catch (err) { process.stderr.write("studio  where the relay's teams stand could not be read: " + String(err && err.message || err) + "\n"); }
}
/* The Desks screen is showing a team's relay: a refusal of its background sync, or that line clearing, is there to read again. */
function syncNoteNudge() {
  try {
    const win = theWindow;
    if (win && !win.isDestroyed()) win.webContents.send("studio:relay-sync-note");
  } catch (err) { process.stderr.write("studio  a relay refusal could not be handed to the page: " + String(err && err.message || err) + "\n"); }
}
/* WHERE EACH TEAM ON THE RELAY STANDS (board 935, G2 on Studio's side; the relay design note's section 9: a notice at each step,
   and a lapse never removes anything from a desk or Studio). From the lapse the relay last told the runner (src/relay.mjs
   lapseStep), every team past working inside its grant: {team, names, step, until, readOnly, swept}, the names those of the projects
   that publish through it, each instant a day (YYYY-MM-DD) or null, and `key`, the step with its dates. `due` are those whose step
   the lead has not yet dismissed as a notice (studio:relay-lapse-seen, below): fetching one tells nothing, so a step fetched behind
   another cover, or as Studio closed, is due again until the lead has closed it. A team working inside its grant is in neither. */
async function relayLapses() {
  const K = await teamStore(), at = await teamsAt(), rows = K.relayTeams(at);
  if (!rows.length) return { teams: [], due: [] };
  const Rl = await relayLib(), now = Date.now(), teams = [], due = [];
  let projects = [];
  for (const t of rows) {
    let s = Rl.lapseStep(t.lapse, now); /* plant:g2s-shell-step */
    /* A team whose place another key took after its sweep stands there, whatever its lapse said. */
    if (t.taken) s = { step: "taken", until: null, readOnly: null, swept: null, first: t.takenFirst === true }; /* plant:rr-shell-taken */
    /* The relay refused the key that signed the grant. Said until a grant it accepts is in place. A taken place stays taken. */
    else if (t.revoked) s = { step: t.revokedNone ? "revoked-none" : "revoked", until: null, readOnly: null, swept: null }; /* plant:rr-shell-revoked */
    if (!s) continue;
    if (!projects.length) { try { const l = await thread.call("listProjects", projectsRoot(), { userData: app.getPath("userData") }); projects = l && Array.isArray(l.projects) ? l.projects : []; } catch { projects = []; } }
    const names = projects.filter((p) => p && p.folder && pathsSame(p.folder, t.folder)).map((p) => String(p.name || ""));
    const row = { team: t.team, names, step: s.step, until: dayOf(s.until), readOnly: dayOf(s.readOnly), swept: dayOf(s.swept) };
    if (s.first === true) row.first = true;
    row.key = [row.step, row.until, row.readOnly, row.swept].join("|");
    teams.push(row);
    if (row.key !== t.lapseShown) due.push(row); /* plant:g2s-once */
  }
  return { teams, due };
}
/* The page asks after a nudge and as it starts: the steps not yet dismissed, and every team past working. */
answer("studio:relay-lapse", async () => guard(async () => relayLapses()));
/* The lead dismissed the notice: each step it showed, by team and key, is recorded as told, and only while it is still that team's
   step, so a step that moved on since is told in its turn. The dismissal is the signal, not the drawing: a cover drawn and then lost
   with Studio's close was never read, and is shown again at the next launch. */
answer("studio:relay-lapse-seen", async (e, seen) => guard(async () => {
  const list = Array.isArray(seen) ? seen.slice(0, 64) : [];
  const K = await teamStore(), at = await teamsAt(), now = (await relayLapses()).teams;
  for (const s of list) {
    const team = String(s && s.team != null ? s.team : ""), key = String(s && s.key != null ? s.key : "");
    if (now.some((t) => t.team === team && t.key === key)) K.markRelay(at, team, { lapseShown: key }); /* plant:g2s-seen */
  }
  return { ok: true };
}));
/* THE LEAD'S ANSWER TO A DESK THAT ASKED BY A RELAY INVITATION (board 922). src/relay.mjs answerJoin writes it on the team's
   own channel; this is where the shell asks. Neither may stop what the lead did: a refusal or an admission stands whatever
   the relay says. A refusal answered "refused" that the relay did not take at once is kept owed in the book, with the invitation
   withdrawn, and the lead is told in the sentence answerJoin holds (which the page turns into Polish), with no runner, no relay
   and a fault alike. Answers {said, move}: that sentence or "", and the book's id of the invitation where its desk used it and
   the team is to move to a new key on the one confirm, or "". An admission answered "joined" has nobody present, so a failure is
   only logged. */
async function answerRefused(dir, keyFile, desk) {
  const none = { said: "", move: "" };
  let Relay = null, reached = false;
  try {
    const K = await teamStore(), at = await teamsAt();
    if (!K.relayTeams(at).length) return none;
    const target = await thread.call("inviteTarget", dir, keyFile, withHere());
    if (!target || !K.relayTeams(at).some((w) => w.team === target.team)) return none;
    try { if (!relayRunner) await relayOnceLent(); }
    catch (err) { process.stderr.write("studio  the relay could not be started to answer the refusal: " + String(err && err.message || err) + "\n"); }
    Relay = await relayLib();
    reached = true;
    const r = await Relay.answerJoin(relayRunner, { teamsFile: at, vault, team: target.team, folder: target.folder,
      desk: desk, answer: "refused", now: Date.now() });
    const move = r && r.move === true && typeof r.id === "string" ? r.id : "";
    if (r && r.ok === false) return { said: String(r.said || ""), move: move };
    if (r && r.answered) relaySync();
    return { said: "", move: move };
  } catch (err) {
    process.stderr.write("studio  the answer refused could not be written: " + String(err && err.message || err) + "\n");
    return reached ? { said: Relay.ANSWER_UNSENT, move: "" } : none;
  }
}
async function answerJoined(team, folder, spent, doors) {
  try {
    const atDoor = Array.isArray(doors) ? doors : [];
    if (!spent.length && !atDoor.length) return;
    const K = await teamStore(), at = await teamsAt();
    if (!K.relayTeams(at).some((w) => w.team === team)) return;
    if (!relayRunner) await relayOnceLent();
    if (!relayRunner) return;
    const Rl = await relayLib();
    const unsent = (await Rl.answerAdmitted(relayRunner, { teamsFile: at, vault, team: team, folder: folder, spent: spent,
      now: Date.now() })).concat(await Rl.answerDoors(relayRunner, { team: team, doors: atDoor }));
    for (const u of unsent) process.stderr.write("studio  a desk was let in, but the relay did not take the answer joined (" + u.reason + ")\n");
  } catch (err) {
    process.stderr.write("studio  the answer joined could not be written: " + String(err && err.message || err) + "\n");
  }
}
/* The requests at a relay team's standing door the watch refused (a stranger's, a removed person's, a certificate that does not
   stand), dropped at the relay by the lead's signed call (src/relay.mjs dropDoors). Nobody is present, so a failure is only said
   here, and the next look asks again. */
async function dropDoorsRefused(team, refused) {
  try {
    const K = await teamStore(), at = await teamsAt();
    if (!K.relayTeams(at).some((w) => w.team === team)) return;
    if (!relayRunner) await relayOnceLent();
    if (!relayRunner || typeof relayRunner.dropDoors !== "function") return;
    const r = await relayRunner.dropDoors(team, refused.map((x) => x && x.door));
    if (!r || r.ok !== true) process.stderr.write("studio  a request at the team's door was refused, but the relay did not take the drop (" + String(r && r.reason) + ")\n");
  } catch (err) {
    process.stderr.write("studio  a refused request at the team's door could not be dropped: " + String(err && err.message || err) + "\n");
  }
}
/* The desks taken off the team at a project's folder, by id (src/team-store.mjs removedOf), less any the team file this
   Studio last wrote names again; empty where the folder is no team's this Studio leads. */
async function removedFor(dir) {
  const K = await teamStore(), at = await teamsAt(), folder = (await teamOf(projectDir(dir))).folder;
  if (!folder) return {};
  const t = K.watchedTeams(at).find((w) => pathsSame(w.folder, folder));
  if (!t) return {};
  const kept = K.keptTeam(at, t.team), all = K.removedOf(at, t.team), out = {};
  const on = new Set(((kept && kept.file && kept.file.roster) || []).filter((e) => e && e.desk).map((e) => String(e.desk.id)));
  Object.keys(all).forEach((id) => { if (!on.has(id)) out[id] = all[id]; });
  return out;
}

/* THE CATALOG EACH JOINED DESK HAS LOADED (board 890). A live watch on desks/ reports a file whose
   stamp moved, and lands an answer, without waiting for focus or the five-minute pass above. That
   pass stays the fallback: its stamp now includes the same two files, and a folder it sees moved
   is landed here too. The record of what was landed sits in this Studio's own userData, and holds
   no key. */
const useWatchers = new Map();
const useArming = new Set();
const useBusy = new Set();
function landedFile() { return path.join(app.getPath("userData"), "catalog-landed.json"); }
function readLandedAll() {
  try {
    const got = JSON.parse(fs.readFileSync(landedFile(), "utf8"));
    return got && typeof got === "object" && got.folders ? got : { folders: {} };
  } catch { return { folders: {} }; }
}
function ledgerKey(folder) { return path.resolve(String(folder || "")); }
function readLanded(folder) {
  const row = readLandedAll().folders[ledgerKey(folder)];
  return row && typeof row === "object" ? { desks: row.desks || {}, done: row.done || {}, unopened: row.unopened || {} }
    : { desks: {}, done: {}, unopened: {} };
}
function writeLanded(folder, ledger) {
  const all = readLandedAll();
  all.folders[ledgerKey(folder)] = { desks: ledger.desks || {}, done: ledger.done || {}, unopened: ledger.unopened || {} }; /* plant:txau-ledger */
  try {
    fs.mkdirSync(path.dirname(landedFile()), { recursive: true });
    writeWhole(landedFile(), JSON.stringify(all) + "\n");
  } catch (err) {
    process.stderr.write("studio  the catalog landing record could not be written: " + String(err && err.message || err) + "\n");
  }
}
/* THIS STUDIO'S LEAD KEY, its public half and id from the key file, nothing opened: what lets a desk's row say that a copy
   which came back was held back (src/catalog-use.mjs refusedAnswer). Null where there is no key file. */
async function leadNow() {
  try {
    const k = (await signLib()).readKeyFile(await keyFileNow());
    return k ? { keyId: k.keyId, public: k.public } : null;
  } catch { return null; }
}
/* WHAT A BOX ANSWER IS JUDGED BY at the team folder `named`, read where the verbs read (`folder`) (board 962, stage 0): the team
   this Studio leads there, its roster's keys, its removal record, and the lead's box as a function answering its private key,
   asked of the vault only where a desk has answered an ask with a box envelope, and then opened once (a passphrase-wrapped key
   derives on this thread). Null where this Studio leads no team there. */
async function boxContext(named, folder) {
  let held = null;
  try { held = await (await teamLib()).heldTeam(folder, { key: await keyFileNow() }); } catch { held = null; }
  if (!held || !held.team) return null;
  /* The removal record, so an answer this Studio took before the desk left the roster still lands (board 900, F2). */
  let removed = {};
  try {
    const K = await teamStore(), at = await teamsAt();
    const t = K.watchedTeams(at).find((w) => pathsSame(w.folder, path.resolve(String(named || ""))));
    if (t) removed = K.removedOf(at, t.team);
  } catch { removed = {}; }
  let box = null;
  const roster = (held.team.roster || []).filter((e) => e && e.desk);
  /* The box is asked for where a box answer waits, or a teammate's box copy does (board 962, stage 3). */
  const Use = await catalogUse();
  if (Use.boxAnswerWaits(folder) || Use.boxCopyWaits(folder, roster.map((e) => String(e.desk.id)))) {
    const Sg = await signLib(), keyFile = await keyFileNow(), secret = await keySecret("open");
    let opened;
    box = () => {
      if (opened === undefined) {
        try {
          const read = Sg.readKeyFile(keyFile);
          const got = read && secret ? Sg.openLeadBox(read, Sg.unlockKey(read, secret)) : null;
          opened = got && got.secretKey ? got.secretKey : null;
        } catch { opened = null; }
      }
      return opened;
    };
  }
  return { held, removed, box, team: String(held.team.id || ""),
    deskKeys: Object.fromEntries(roster.map((e) => [String(e.desk.id), String(e.desk.key || "")])),
    /* What an answer is judged by since stage 0b: the team's current key and its catalogs. */
    epoch: held.team.epoch, catalogs: (held.team.catalogs || []).map(String) };
}
/* What an answer is judged by, for listUses and answersDue. */
const boxJudged = (ctx) => (ctx ? { box: ctx.box, team: ctx.team, deskKeys: ctx.deskKeys, removed: ctx.removed,
  epoch: ctx.epoch, catalogs: ctx.catalogs } : {});
/* The team's other catalogs, as the team file at `folder` lists them, each with this library's project of it (board 962 stage 5, T3),
   so a teammate on catalog B shows on A's screens as the team's catalog B and is never offered for import there; and this library's
   catalogs the team does not list (board 962 stage 6, U1), so a teammate still on a catalog moved to another team, or taken off, shows
   as this Studio's own and not as a foreign catalog to import. */
async function teamCatalogsOf(folder, ownId) {
  let ids = [];
  try { const r = await (await teamLib()).readTeam(folder); ids = r.team && Array.isArray(r.team.catalogs) ? r.team.catalogs.map(String) : []; } catch { ids = []; }
  ids = ids.filter((id) => id && id !== String(ownId || ""));
  let rows = [];
  try { const l = await thread.call("listProjects", projectsRoot(), { userData: app.getPath("userData") }); rows = l && Array.isArray(l.projects) ? l.projects : []; } catch { rows = []; }
  const team = ids.map((id) => { const p = rows.find((r) => r && r.id === id); return p ? { id, title: String(p.name || ""), rev: p.rev, dir: p.dir } : { id }; });
  const library = rows.filter((r) => r && r.id && String(r.id) !== String(ownId || "") && ids.indexOf(String(r.id)) < 0)
    .map((r) => ({ id: String(r.id), title: String(r.name || ""), dir: r.dir }));
  return { team, library };
}
async function withUses(project, facts) {
  const Use = await catalogUse();
  if (!facts || facts.file !== "ours" || !facts.folder || !facts.team) return Use.attachUses(facts || {}, []);
  let rows = [];
  try {
    const folder = facts.folder;
    const around = await teamCatalogsOf(folder, facts.id);
    rows = Use.listUses(Object.assign({
      folder, roster: facts.team.roster, projectDir: String(project || ""),
      projectId: facts.id, teamCatalogs: around.team, libraryCatalogs: around.library, teamKeys: (await teamsNow()).teamKeys, ledger: readLanded(facts.folder), lead: await leadNow(),
    }, boxJudged(await boxContext(facts.folder, folder))));
  } catch (err) {
    process.stderr.write("studio  the catalogs in use could not be read: " + String(err && err.message || err) + "\n");
  }
  return Use.attachUses(facts, rows);
}
async function withStatsUses(project, facts) {
  const Use = await catalogUse();
  let team = null;
  try { team = await thread.call("teamFacts", String(project || ""), withHere({ key: await keyFileNow() })); }
  catch { team = null; }
  if (team && team.folder && team.file === "ours" && team.team && team.team.relay === true) await armUseWatch(team.folder);
  if (!team || team.file !== "ours" || !team.folder || !team.team) return Use.attachUses(facts || {}, []);
  let rows = [];
  try {
    const folder = team.folder;
    const around = await teamCatalogsOf(folder, team.id);
    rows = Use.listUses(Object.assign({
      folder, roster: team.team.roster, projectDir: String(project || ""),
      projectId: team.id, teamCatalogs: around.team, libraryCatalogs: around.library,
      teamKeys: (await teamsNow()).teamKeys, ledger: readLanded(team.folder), lead: await leadNow(),
    }, boxJudged(await boxContext(team.folder, folder))));
  } catch (err) {
    process.stderr.write("studio  the catalogs in use could not be read: " + String(err && err.message || err) + "\n");
  }
  return Use.attachUses(facts, rows);
}
async function landDue(named) {
  const Use = await catalogUse();
  const folder = named;
  const ledger = readLanded(folder);
  /* AN ANSWER LANDS ONLY AGAINST THIS STUDIO'S OWN ASK AND A PIN SOMEBODY TRUSTED PUT DOWN (src/catalog-use.mjs
     answerRefusal): the lead key and the roster come from the team this Studio leads here, and where it leads none, or its
     key file is not there, nothing lands. A held-back answer stays where it is and is said here. */
  const ctx = await boxContext(named, folder);
  if (!ctx) return;
  const held = ctx.held, removed = ctx.removed;
  const refused = [];
  const due = Use.answersDue(folder, (await teamsNow()).teamKeys, ledger, {
    lead: held.team.lead, refused,
    roster: (held.team.roster || []).filter((e) => e && e.desk).map((e) => String(e.desk.id)),
    removed, /* plant:rs-land-removed */
    box: ctx.box, team: ctx.team, deskKeys: ctx.deskKeys, epoch: ctx.epoch, catalogs: ctx.catalogs,
  });
  refused.forEach((r) => process.stderr.write("studio  the catalog answer from " + r.desk + " was not landed: " + r.why + "\n"));
  if (!due.length) return;
  /* A CATALOG LANDS IN THE PROJECTS FOLDER ONLY FOR A STUDIO SOMEONE IS EDITING IN, one that holds the folder (the test architect's re-read,
     D6): a hidden Studio, or one another Studio holds the folder from, leaves the answer due and says so (false), and the next look lands it. */
  if (holdBlocks(projectsRoot())) return false; /* plant:hold-land */
  const hadDone = Object.keys(ledger.done || {}).length, hadUnopened = Object.keys(ledger.unopened || {}).length;
  const root = projectsRoot();
  const S = await studio();
  for (const item of due) {
    const temp = path.join(workDir(), "brought-" + item.askId);
    /* The project is named by the catalog's title, or after the desk by the name the lead gave it (sense pass finding 21). */
    const entry = (held.team.roster || []).find((e) => e && e.desk && String(e.desk.id) === item.desk);
    const deskName = entry ? String(entry.name || entry.desk.name || "").trim() : "";
    try {
      const landed = await S.landCatalog(root, item.catalog, temp, { title: item.title, desk: deskName || item.desk, lang: recoveryLang() }); /* plant:txin-in5 */
      ledger.done[item.askId] = true;
      if (ledger.unopened) delete ledger.unopened[item.askId];
      ledger.desks[item.desk] = {
        movedOn: item.movedOn === true, got: item.sha256, asked: item.asked,
        dir: landed && landed.dir ? landed.dir : "", askId: item.askId,
      };
      writeLanded(folder, ledger);
      Use.withdrawAsk(folder, item.desk);
    } catch (err) {
      /* A copy that does not open as a catalog is the desk's answer all the same (board 899): the row says so. */
      if (Use.noteUnopened(ledger, item, err)) writeLanded(folder, ledger); /* plant:txau-note */
      process.stderr.write("studio  the catalog from " + item.desk + " was not imported: " + String(err && err.message || err) + "\n");
    }
  }
  /* One rev for every copy this pass recorded. A pass that recorded nothing does not write the team file. */
  if (Object.keys(ledger.done || {}).length > hadDone || Object.keys(ledger.unopened || {}).length > hadUnopened)
    await publishLead(held.team.id, folder);
}
function tellUse(folder) {
  const win = theWindow;
  if (win && !win.isDestroyed()) win.webContents.send("studio:team-moved", folder);
}
async function onUseMoved(folder) {
  if (useBusy.has(folder)) return;
  useBusy.add(folder);
  try {
    await landDue(folder);
    tellUse(folder);
  } catch (err) {
    process.stderr.write("studio  a catalog in use could not be read: " + String(err && err.message || err) + "\n");
  } finally { useBusy.delete(folder); }
}
async function armUseWatch(folder) {
  if (relayClosed) return;
  const key = path.resolve(String(folder || ""));
  if (!key || useWatchers.has(key) || useArming.has(key)) return;
  useArming.add(key);
  try {
    const Use = await catalogUse();
    if (relayClosed || useWatchers.has(key)) return;
    /* The first look is done before this returns, so a screen read does not leave a readdir for a later focus.
       A join.json takes teamWatch(""), the call the focus and the five-minute pass make. The stamp is what
       makes that pass read, so a folder already acted on is not admitted or told again. Any other file lands
       as before. */
    const h = Use.watchFolder(key, (ids, detail) => { Use.routeWatch(detail, () => { teamWatch(""); }, () => { onUseMoved(key); }); }, {}); /* plant:txjl-8jla-3 */
    /* A watch that did not arm is not kept, so the next pass arms it again (rearmUseWatches). */
    if (h.armed()) useWatchers.set(key, h); else h.close(); /* plant:txjl-8jlc-4 */
  } catch (err) {
    process.stderr.write("studio  the catalog watch could not start: " + String(err && err.message || err) + "\n");
  } finally { useArming.delete(key); }
}
/* At each focus and five-minute pass: a watch that has stopped is dropped and every led team's folder armed
   again, so a desks/ that appears later, or a share that comes back, is watched without a restart. */
async function rearmUseWatches() {
  try {
    const Use = await catalogUse();
    Use.dropUnarmed(useWatchers); /* plant:txjl-8jlc-6 */
    armCatalogWatches();
  } catch (err) {
    process.stderr.write("studio  the catalog watch could not be armed again: " + String(err && err.message || err) + "\n");
  }
}
function armCatalogWatches() {
  if (relayClosed) return;
  teamStore().then(async (K) => {
    if (relayClosed) return;
    if (!(await worksNow())) return; /* plant:s1b-catalog */
    const at = await teamsAt();
    K.watchedTeams(at).forEach((t) => armUseWatch(t.folder));
  }).catch((err) => {
    process.stderr.write("studio  the catalog watch could not be armed: " + String(err && err.message || err) + "\n");
  });
}
/* The lead asks one desk for the catalog it has loaded. The pin is read here from that desk's file,
   never from the page. The signing key is opened here, and where it does not open nothing is written. */
answer("studio:catalog-import", async (e, dir, desk) => guard(async () => {
  const project = projectDir(dir);
  const id = String(desk || "");
  const R = await refusal();
  const facts = await thread.call("teamFacts", project, withHere({ key: await keyFileNow(), invites: await inviteBook() }));
  if (!facts || facts.file !== "ours" || !facts.folder || !facts.team)
    throw R.refuse("There is no team here led from this Studio, so no request was made.");
  const member = (facts.team.roster || []).find((r) => r && r.id === id);
  if (!member) throw R.refuse("This teammate is not using a catalog this Studio can ask for.");
  const Use = await catalogUse();
  const work = facts.folder;
  const ctx = await boxContext(facts.folder, work);
  const around = await teamCatalogsOf(work, facts.id);
  const rows = Use.listUses(Object.assign({
    folder: work, roster: [member], projectDir: project, projectId: facts.id,
    teamCatalogs: around.team, libraryCatalogs: around.library,
    teamKeys: (await teamsNow()).teamKeys, ledger: readLanded(facts.folder), lead: await leadNow(),
  }, boxJudged(ctx)));
  const row = rows[0];
  if (!row || row.kind === "edition" || (!row.importable && !row.waiting))
    throw R.refuse("This teammate is not using a catalog this Studio can ask for.");
  /* A catalog the team does not list is asked for as any other is, by an ask that names the team (board 1014). */
  const shape = Use.askShape(row.catalogId, ctx && ctx.held && ctx.held.team);
  if (!row.waiting) {
    const Sgn = await signLib();
    const secret = await keySecret();
    let opened = null;
    try { opened = secret ? Sgn.unlockKey(Sgn.readKeyFile(await keyFileNow()), secret) : null; }
    catch { opened = null; }
    if (!opened || !opened.privateKey || String(opened.keyId || "") !== String(facts.signing || ""))
      throw R.refuse("This Studio's signing key is not open, so no request was made.");
    const doc = Use.buildAsk({ sha256: row.sha256, desk: id, lead: { keyId: opened.keyId, privateKey: opened.privateKey },
      content: shape.content === true, team: ctx && ctx.team }); /* plant:b1014-st-import */
    Use.writeAsk(facts.folder, id, doc);
    armUseWatch(facts.folder);
  }
  const shown = await withUses(project, await withKept(facts));
  return { uses: shown.uses || [] };
}));
/* The lead imports one of a teammate's working copies sealed to the lead's box, as a new catalog, as an answered ask lands (board
   962, stage 3; Max, 2026-11-04 16:35, call (2)). The copy is judged again here, never by the page. */
answer("studio:copy-import", async (e, dir, desk, ref) => guard(async () => {
  const project = projectDir(dir);
  const id = String(desk || ""), which = String(ref || "");
  const R = await refusal();
  const facts = await thread.call("teamFacts", project, withHere({ key: await keyFileNow(), invites: await inviteBook() }));
  if (!facts || facts.file !== "ours" || !facts.folder || !facts.team)
    throw R.refuse("There is no team here led from this Studio, so no request was made.");
  const Use = await catalogUse();
  const work = facts.folder;
  const ctx = await boxContext(facts.folder, work);
  if (!ctx) throw R.refuse(Use.REFUSAL_COPY_GONE);
  const got = Use.boxCopiesOf(work, id, { deskKeys: ctx.deskKeys, box: ctx.box, team: ctx.team });
  const copy = got.copies.find((c) => c.ref === which);
  if (!copy) throw R.refuse(Use.REFUSAL_COPY_GONE);
  const entry = (ctx.held.team.roster || []).find((x) => x && x.desk && String(x.desk.id) === id);
  const deskName = entry ? String(entry.name || entry.desk.name || "").trim() : "";
  const S = await studio();
  const landed = await S.landCatalog(projectsRoot(), copy.catalog, path.join(workDir(), "copy-" + id + "-" + which),
    { title: copy.title, desk: deskName || id, lang: recoveryLang() });
  return Object.assign({ landed: landed && landed.dir ? path.basename(String(landed.dir)) : "" }, landed);
}));
answer("studio:catalog-withdraw", async (e, dir, desk) => guard(async () => {
  const project = projectDir(dir);
  const id = String(desk || "");
  const facts = await thread.call("teamFacts", project, withHere({ key: await keyFileNow(), invites: await inviteBook() }));
  if (facts && facts.folder) {
    const Sgn = await signLib();
    const secret = await keySecret();
    let opened = null;
    try { opened = secret ? Sgn.unlockKey(Sgn.readKeyFile(await keyFileNow()), secret) : null; } catch { opened = null; }
    (await catalogUse()).withdrawAsk(facts.folder, id, opened);
  }
  const shown = await withUses(project, await withKept(facts || {}));
  return { uses: shown.uses || [] };
}));

/* A desk's Export of the sealed catalog, Plain or Sealed (23b-B): the team file it writes becomes the kept copy as an admission's does. */
answer("studio:team-exports", async (e, dir, sealed) => guard(async () => {
  const keyToLock = await teamKeyFor(dir);
  return teamAct(keyToLock, async () => {
    const r = await thread.call("setTeamExports", projectDir(dir), await keyFileNow(), sealed === true, await keySecret(),
      withHere({ teamKeys: (await teamsNow()).teamKeys, invites: await inviteBook() }));
    await keepWritten(r);
    if (r) delete r.written;
    return withKept(r);
  });
}));

/* The lead's switch for sharing cards between teammates (board 1013, piece 6): the team file it writes becomes the kept copy as
   Exports' does, and the relay carries it to the desks at its next sync. */
answer("studio:team-sharing", async (e, dir, on) => guard(async () => {
  const keyToLock = await teamKeyFor(dir);
  return teamAct(keyToLock, async () => {
    const r = await thread.call("setTeamSharing", projectDir(dir), await keyFileNow(), on === true, await keySecret(),
      withHere({ teamKeys: (await teamsNow()).teamKeys, invites: await inviteBook() }));
    await keepWritten(r);
    if (r) delete r.written;
    return withKept(r);
  });
}));

/* `fresh` starts a new team over one another key leads (K8's cost: every desk asks again), never over this Studio's own. */
answer("studio:team-sealed", async (e, dir, sealed, fresh) => guard(async () => {
  const keyToLock = await teamKeyFor(dir);
  return teamAct(keyToLock, async () => {
    const K = await teamStore(), at = await teamsAt(), key = await keyFileNow(), on = sealed === true;
    let facts = await thread.call("teamFacts", projectDir(dir), withHere({ key }));
    if (!on && facts && facts.team && ((Array.isArray(facts.team.catalogs) ? facts.team.catalogs.length : facts.team.catalogs) > 1)) {
      throw (await refusal()).refuse("Publishing cannot be set to Plain for a team with more than one catalog. Nothing was changed.");
    }
    /* Sealing where this Studio holds no team of its own makes one, or its first key: held while a newer Studio's data stand. */
    if (on && !(facts && facts.team)) await newerHold(); /* plant:u2-hold-sealed */
    /* THE FIRST SEAL MAKES THE KEY as the first publish does (finding 9), where the folder is one a seal can work in. */
    const made = on && fresh !== true && !!facts && !facts.inside && (await firstKey(facts)).make && await makeFirstKey();
    if (made) facts = await thread.call("teamFacts", projectDir(dir), withHere({ key }));
    const restorable = !facts.team && facts.folder ? K.teamForFolder(at, facts.folder) : null;
    const kept = restorable ? K.keptTeam(at, restorable).file : null;
    let teamId = null, teamKey = null;
    const anew = fresh === true && facts.file === "theirs" && !!facts.lead;
    if (on && !facts.team && !kept && (facts.file === "none" || anew) && facts.folder && facts.signing && !facts.inside) {
      const tm = K.studioTeammates(at, { key: await keyFileNow() });
      if (tm.teamsCount >= K.MAX_TEAMS) {
        throw (await refusal()).refuse(K.REFUSAL_TEAMS_LIMIT);
      }
      teamId = "t-" + require("node:crypto").randomBytes(8).toString("hex");
      teamKey = require("node:crypto").randomBytes(32);
      K.keepTeamKey(at, vault, teamId, 1, teamKey);
    }
    let r;
    try {
      r = await thread.call("setTeamSealed", projectDir(dir), on,
        withHere({ key, passphrase: await keySecret(), teamId, kept, fresh: anew, teamKeys: (await teamsNow()).teamKeys }));
    } catch (err) { if (teamId) K.forgetTeam(at, teamId); throw err; }
    if (r.team) K.chooseSealed(at, r.team.id, on, r.folder, r.written);
    else if (!on && facts.mark) K.chooseSealed(at, facts.mark, false, facts.folder);
    return { folder: r.folder, created: r.created, team: r.team, ...(made ? { signing: await signingNow() } : {}) };
  });
}));

/* A TEAM FIRST MADE ON THE ETIUDA RELAY (board 926, relay slice 1's missing control): the lead's other choice, beside a shared
   folder, where a team is first made. It does in the product what a relay team's setup does in tests/relay-studio.mjs, through
   the same functions: mints the relay team id (src/relay.mjs relayId), keeps the team key as studio:team-sealed does, keeps
   the mirror through keepRelay with the built-in address, and has the thread write the signed team file into the mirror with
   the relay as its channel and point the project's publish place at it (src/studio.mjs startRelayTeam). The relay's own space
   is made by the runner, which owes one to every kept relay team that has none (src/relay.mjs relayRunner), so the sync asked
   for below makes it, and a Studio offline makes it at the next. Only a team made for the first time is offered this: a
   project that has one already, here or at its folder, is refused, and moving a team between channels is not this verb's.
   The reply carries no path, no address and no relay team id. A throw part way, before the thread's writes or after them (the
   store's own write, the thread's reply, the key facts), takes the whole press back and presses again as a first press: the thread
   puts the project's place and the team file as they were (src/studio.mjs undoRelayTeam), and only when that has been done is the
   team, with its key and mirror, forgotten here; where the thread cannot be asked to, all of it is kept together, so the key
   store never forgets a team whose file, or whose project's place, is still there (the test architect's edit E1).
   The relay comes with a licence (board 935, slice G3): before anything is kept or made, the grant held beside the signing key is
   judged, and with none that holds for this key now the press is refused in that sentence and the cover goes on offering the
   shared folder. */
/* A CATALOG CHOOSES ITS TEAM (board 962 stage 5, T3, 3.1): a catalog with no team joins a sealed team this Studio leads. Inside the
   team's lock, before anything is read from the team's place, the shell refuses what only it knows: a handover of the team
   under way, a relay team past its grant,
   and a team this Studio does not keep as its own sealed one. The thread (src/studio.mjs chooseTeam) does the rest in an order a
   second press finishes. A relay team asks one sync after, outside the lock. */
const CHOOSE_UNDER_WAY = "A move or a handover of this team is under way, so no catalog can join it until that ends. Nothing was changed.";
const CHOOSE_PAST_GRANT = "The relay licence for this team has ended, so no catalog can join it until the licence is renewed. Nothing was changed.";
/* A licence the relay no longer accepts (Claudette, words-t3 item 10): while the fetch of a new one runs it says so; once the fetch
   has come back with none (revokedNone) that clause is dropped, as her words allow. */
const CHOOSE_REVOKED = "The relay no longer accepts this team's relay licence, so no catalog can join it until Studio has a new one. Studio is fetching it, and nothing needs doing. Nothing was changed.";
const CHOOSE_REVOKED_NONE = "The relay no longer accepts this team's relay licence, so no catalog can join it until Studio has a new one. Nothing was changed.";
const CHOOSE_NO_TEAM = "This Studio does not lead that team as a sealed one, so the catalog did not join it. Nothing was changed.";
answer("studio:team-choose", async (e, dir, teamId) => guard(async () => {
  const project = projectDir(dir), named = String(teamId || "");
  if (!/^t-[0-9a-f]{16}$/.test(named)) throw (await refusal()).refuse(CHOOSE_NO_TEAM);
  return teamAct(named, async () => {
    const K = await teamStore(), at = await teamsAt();
    /* The refusals in the choose's own sentences, and the team's place (teamPlaceFor, shared with the leave and the move since
       board 962 stage 6). */
    const { folder, work, relay, keyFile } = await teamPlaceFor(named, CHOOSE_SAID);
    const r = await thread.call("chooseTeam", project, withHere({ key: keyFile, passphrase: await keySecret(), teamId: named, folder, work,
      relay, elsewhere: catalogsElsewhere(K, at, named), teamKeys: (await teamsNow()).teamKeys }));
    K.chooseSealed(at, named, true, folder, r.written);
    if (relay) relaySync();
    return { folder: r.folder, team: r.team, carried: r.carried === true, relay: !!relay };
  });
}));
/* A CATALOG TAKEN OFF ITS TEAM, AND A CATALOG MOVED TO ANOTHER OF THIS STUDIO'S TEAMS (board 962 stage 6, U1, 3.1 and 3.2). Inside
   each team's lock, before anything is read from its place, the shell refuses what only it knows, as studio:team-choose does: a handover
   of the team under way, a relay team past its grant or whose licence
   the relay no longer accepts, and a team this Studio does not keep as its own sealed one. The thread (src/studio.mjs leaveTeam and
   chooseTeam) does the rest, each in an order a second press finishes. */
const LEAVE_SAID = {
  underWay: "A move or a handover of this team is under way, so no catalog can be taken off it until that ends. Nothing was changed.",
  pastGrant: "The relay licence for this team has ended, so no catalog can be taken off it until the licence is renewed. Nothing was changed.",
  revoked: "The relay no longer accepts this team's relay licence, so no catalog can be taken off it until Studio has a new one. Studio is fetching it, and nothing needs doing. Nothing was changed.",
  revokedNone: "The relay no longer accepts this team's relay licence, so no catalog can be taken off it until Studio has a new one. Nothing was changed.",
  noTeam: "This Studio does not lead that team as a sealed one, so no catalog was taken off it. Nothing was changed.",
};
const CHOOSE_SAID = { underWay: CHOOSE_UNDER_WAY, pastGrant: CHOOSE_PAST_GRANT, revoked: CHOOSE_REVOKED,
  revokedNone: CHOOSE_REVOKED_NONE, noTeam: CHOOSE_NO_TEAM };
const LEAVE_ON_NONE = "This catalog is on no team, so there is no team to take it off. Nothing was changed.";
const LEAVE_PART_WAY = "This catalog is part way through a move to another team, so it can be taken off only once the move is finished or the catalog is back on its old team. Nothing was changed.";
const MOVE_ON_NONE = "This catalog is on no team, so it cannot be moved; it can be added to a team instead. Nothing was changed.";
const MOVE_SAME = "This catalog is on that team already, so it was not moved. Nothing was changed.";
const MOVE_UNSETTLED = "The catalog is off its old team, and that team's place has not yet taken the change, so for now it is on no team. Finish the move completes it.";
/* How long a catalog move waits for the old team's place to take the leave before the choose writes the new team's. */
const MOVE_SETTLE_MS = 8000;

/** The place of team `named` as a team act reads and writes it, {folder, work, relay, keyFile}, or a refusal in `said`'s sentences. */
async function teamPlaceFor(named, said) {
  const R = await refusal(), K = await teamStore(), Rl = await relayLib(), S = await signLib(), at = await teamsAt();
  const st = readStore();
  if (st.handover && st.handover.team === named) throw R.refuse(said.underWay); /* plant:place-under-way */
  const keyFile = await keyFileNow(), lead = S.readKeyFile(keyFile);
  const kept = K.keptTeam(at, named);
  const ours = !!lead && !!kept && kept.sealed === true && !!kept.file && !!kept.file.lead && kept.file.lead.public === lead.public;
  if (!ours) throw R.refuse(said.noTeam); /* plant:place-kept */
  const row = K.relayTeams(at).find((t) => t.team === named) || null;
  if (row) {
    const step = Rl.lapseStep(row.lapse, Date.now());
    if (row.revoked && !row.taken) throw R.refuse(row.revokedNone ? said.revokedNone : said.revoked); /* plant:place-revoked */
    if (row.taken || (step && ["read-only", "lapsed", "gone"].indexOf(step.step) >= 0)) throw R.refuse(said.pastGrant); /* plant:place-grant */
    return { folder: row.folder, work: row.folder, relay: { rt: row.rt, url: row.url }, keyFile };
  }
  if (!kept.folder) throw R.refuse(said.noTeam);
  return { folder: kept.folder, work: kept.folder, relay: null, keyFile };
}
/* Whether the relay holds team `team`'s file as its mirror holds it now, read from the runner's channel, as relayHoldsEdition reads it. */
async function relayTeamSent(team) {
  if (!relayRunner || typeof relayRunner.channel !== "function") return false;
  const ch = relayRunner.channel(team), prog = ch && ch.program;
  const st = prog && typeof prog.state === "function" ? prog.state() : null;
  const row = (await teamStore()).relayTeams(await teamsAt()).find((t) => t.team === team);
  if (!st || !st.sent || !row) return false;
  const sent = st.sent["etiuda-team.json"];
  if (!sent || sent.del || sent.owe === true) return false;
  try { return sent.sha === require("node:crypto").createHash("sha256").update(readWithin(path.join(row.folder, "etiuda-team.json"), TEAM_READ_MAX)).digest("hex"); }
  catch { return false; }
}
/* Whether the team file a team act wrote is on the team's place, waited out for MOVE_SETTLE_MS: the relay holding the mirror's
   file after one sync. A team that is not on the relay wrote its folder itself. */
async function teamWriteSettled(team, onRelay) {
  const ms = Number(testOnly("STUDIO_MOVE_SETTLE_MS") || MOVE_SETTLE_MS);
  if (!onRelay) return true;
  let timer = null;
  await Promise.race([Promise.resolve(relaySync()).catch(() => {}), new Promise((resolve) => { timer = setTimeout(resolve, ms); })]);
  if (timer) clearTimeout(timer);
  return relayTeamSent(team);
}
/* The project.json at `dir` as it stands, or null. */
function projectRecord(dir) {
  if (!dir) return null;
  try { return JSON.parse(fs.readFileSync(path.join(path.resolve(String(dir)), "project.json"), "utf8")); } catch { return null; }
}
/* The catalog ids the other teams this Studio keeps list, so one catalog stays on one team (chooseTeam's `elsewhere`). */
function catalogsElsewhere(K, at, named) {
  const out = [];
  let ids = [];
  try { ids = Object.keys(K.teamKeysOf(at, vault) || {}); } catch { ids = []; }
  for (const t of ids) {
    if (t === named) continue;
    const k = K.keptTeam(at, t);
    if (k && k.file && Array.isArray(k.file.catalogs)) out.push(...k.file.catalogs.map(String));
  }
  return out;
}

/* TAKE OFF THIS TEAM: the catalog at `dir`, on its team; or, for a catalog the team lists whose project is not in this library, the
   team `teamId` and the catalog id `catalog` with no `dir`. A catalog half taken off (its team no longer lists it, its project still
   names the team) is finished by the same press; a catalog part way through a move is finished by the move's own press. */
answer("studio:team-leave", async (e, dir, teamId, catalog) => guard(async () => {
  const R = await refusal();
  const project = dir == null || dir === "" ? "" : projectDir(dir), cat = String(catalog || ""); /* plant:txic-leave */
  let named = String(teamId || "");
  if (project) {
    const p = projectRecord(project);
    if (p && p.moving) throw R.refuse(LEAVE_PART_WAY); /* plant:leave-part-way */
    const on = p && typeof p.sealedTeam === "string" ? p.sealedTeam : "";
    if (!on) throw R.refuse(LEAVE_ON_NONE);
    if (named && named !== on) throw R.refuse(LEAVE_SAID.noTeam);
    named = on;
  } else if (!cat) throw R.refuse(LEAVE_ON_NONE);
  if (!/^t-[0-9a-f]{16}$/.test(named)) throw R.refuse(LEAVE_SAID.noTeam);
  return teamAct(named, async () => {
    const place = await teamPlaceFor(named, LEAVE_SAID);
    const K = await teamStore(), at = await teamsAt();
    const r = await thread.call("leaveTeam", project || null, withHere({ key: place.keyFile, passphrase: await keySecret(), teamId: named, catalog: cat,
      folder: place.folder, work: place.work, relay: place.relay, root: projectsRoot(), teamKeys: (await teamsNow()).teamKeys }));
    /* The kept copy never lists a catalog the share no longer does, so the next choose's `elsewhere` does not find it (Argon's 6). */
    K.chooseSealed(at, named, true, place.folder, r.written); /* plant:leave-keep-file */
    if (place.relay) relaySync();
    return { team: r.team, removed: r.removed, relay: !!place.relay };
  });
}));

/* LET GO OF A TEAM THIS STUDIO HOLDS NO KEYS FOR: the project's team mark comes off its project.json and nothing else is written. The thread
   (src/studio.mjs letGoTeam) judges it against teams.json, the same judgement the Team screen's offer is made on, so no team lock is
   taken: no team of this Studio is touched, and the relay is not told. Held back while saved data a newer Studio wrote stands, since
   its teams file reads as holding none here. */
answer("studio:team-let-go", async (e, dir) => guard(async () => {
  return thread.call("letGoTeam", projectDir(dir), withHere({}));
}));

/* MOVE TO ANOTHER TEAM: the catalog at `dir` leaves its team and joins `toTeam`, another sealed team this Studio leads. Both teams'
   locks are taken once, in sorted order of team id, so two moves in opposite directions cannot wait on each other, and the thread's
   verbs are called inside them (the handlers would take a lock already held). The project names the move, `moving: {from, to}`,
   before the leave writes anything, and the choose's project write drops it; between the two the catalog is listed by no team, so
   one catalog is never on two teams, and the choose waits until the old team's place has taken the leave. A move part way (`moving`
   standing) is finished by pressing it towards `to`, or put back by pressing it towards `from`: the leave runs on the team that is
   not the target (nothing where that team no longer lists the catalog or holds its files), and, putting back a move stopped before
   the leave let the project go, on the target too, so the project is free; then the choose on the target. Nothing resumes at start. */
answer("studio:team-move-catalog", async (e, dir, toTeam) => guard(async () => {
  const R = await refusal();
  const project = projectDir(dir), asked = String(toTeam || "");
  if (!/^t-[0-9a-f]{16}$/.test(asked)) throw R.refuse(CHOOSE_NO_TEAM);
  const p = projectRecord(project);
  const mv = p && p.moving && /^t-[0-9a-f]{16}$/.test(String(p.moving.from)) && /^t-[0-9a-f]{16}$/.test(String(p.moving.to))
    ? { from: String(p.moving.from), to: String(p.moving.to) } : null;
  let from = "", to = asked;
  if (mv) {
    if (asked !== mv.to && asked !== mv.from) throw R.refuse(LEAVE_PART_WAY);
    from = asked === mv.to ? mv.from : mv.to;
  } else {
    from = p && typeof p.sealedTeam === "string" ? p.sealedTeam : "";
    if (!from) throw R.refuse(MOVE_ON_NONE);
  }
  if (from === to) throw R.refuse(MOVE_SAME); /* plant:move-same */
  const order = [from, to].sort(); /* plant:move-sorted */
  return teamAct(order[0], () => teamAct(order[1], async () => {
    const K = await teamStore(), at = await teamsAt();
    const out = await teamPlaceFor(from, LEAVE_SAID), into = await teamPlaceFor(to, CHOOSE_SAID);
    const secret = await keySecret(), teamKeys = (await teamsNow()).teamKeys;
    const left = await thread.call("leaveTeam", project, withHere({ key: out.keyFile, passphrase: secret, teamId: from, folder: out.folder,
      work: out.work, relay: out.relay, root: projectsRoot(), moving: mv || { from, to }, teamKeys }));
    K.chooseSealed(at, from, true, out.folder, left.written);
    if (!(await teamWriteSettled(from, !!out.relay))) throw R.refuse(MOVE_UNSETTLED); /* plant:move-settled */
    const still = projectRecord(project);
    if (still && still.sealedTeam === to) { /* plant:move-back-free */
      const freed = await thread.call("leaveTeam", project, withHere({ key: into.keyFile, passphrase: secret, teamId: to, folder: into.folder,
        work: into.work, relay: into.relay, root: projectsRoot(), moving: mv || { from, to }, teamKeys }));
      K.chooseSealed(at, to, true, into.folder, freed.written);
    }
    const r = await thread.call("chooseTeam", project, withHere({ key: into.keyFile, passphrase: secret, teamId: to, folder: into.folder,
      work: into.work, relay: into.relay, elsewhere: catalogsElsewhere(K, at, to), teamKeys }));
    K.chooseSealed(at, to, true, into.folder, r.written);
    if (into.relay) relaySync();
    return { team: r.team, carried: r.carried === true, relay: !!into.relay };
  }));
}));
answer("studio:team-relay", async (e, dir) => guard(async () => {
  const keyToLock = await teamKeyFor(dir);
  return teamAct(keyToLock, async () => {
    const R = await refusal(), K = await teamStore(), Rl = await relayLib(), S = await signLib(), at = await teamsAt(), key = await keyFileNow();
    const tm = K.studioTeammates(at, { key: await keyFileNow() });
    if (tm.teamsCount >= K.MAX_TEAMS) {
      throw R.refuse(K.REFUSAL_TEAMS_LIMIT);
    }
    /* A folder holding another lead's team may be left for a new team elsewhere. Each of the three below is a way a project has a
       team already, and each is refused on its own line: one whose folder has a team kept for it (restorable), one that remembers
       sealing, and one whose folder holds a team file of this Studio's own, or an older one of its own, or one that will not
       read. The thread's `facts.team` is set only with the file "ours", so the file clause already says it. The first is read from
       this computer's teams file and the project's own, before the team folder is read at all. */
    const shown = (await teamOf(projectDir(dir))).folder;
    const restorable = shown ? K.teamForFolder(at, shown) : null;
    const keptHere = false
      || !!restorable /* plant:rs926-kept */
      ;
    if (keptHere) throw R.refuse("This catalog has a team already, so no other was started.");
    const facts = await thread.call("teamFacts", projectDir(dir), withHere({ key }));
    const had = !facts
      || !!facts.mark /* plant:rs926-mark */
      || (facts.file !== "none" && facts.file !== "theirs"); /* plant:rs926-file */
    if (had) throw R.refuse("This catalog has a team already, so no other was started."); /* plant:rs926-first */
    /* THE RELAY COMES WITH A LICENCE (board 935, slice G3): a team is made there only under a grant the vendor's root signed over this
       lead's key, which Studio holds beside the key (src/relay.mjs). With none that holds now, nothing is made and nothing is sent, and
       the cover, which still offers the shared folder, says so. A Studio with no key has none, since a grant names a key, so the key is
       no longer made here: it is made in Settings, or by the first publish or seal (studio:team-sealed makes no team at a folder now). */
    const lead = (() => { try { return S.readKeyFile(key); } catch { return null; } })();
    const no = Rl.grantRefusal(lead ? Rl.readGrant(key) : null, lead ? lead.public : null, Date.now(), relayRootsNow(), await revokedKeysNow()); /* plant:g3-handler */
    if (no) throw R.refuse(no.said, no.vars);
    const teamId = "t-" + require("node:crypto").randomBytes(8).toString("hex"), teamKey = require("node:crypto").randomBytes(32);
    const rt = Rl.relayId();
    K.keepTeamKey(at, vault, teamId, 1, teamKey); /* plant:rs926-key */
    let r;
    try {
      /* A team made here lives where this build makes new teams: staging's relay in a test service build (src/relay.mjs). */
      const mirror = K.keepRelay(at, teamId, rt, Rl.NEW_TEAMS_URL); /* plant:rs926-keep */
      r = await thread.call("startRelayTeam", projectDir(dir), { key, passphrase: await keySecret(), teamId, rt, url: Rl.NEW_TEAMS_URL, /* plant:rts-start */
        mirror, teamKeys: (await teamsNow()).teamKeys });
      K.chooseSealed(at, teamId, true, mirror, r.written);
    } catch (err) {
      /* THE TEAM AND ITS KEY ARE FORGOTTEN ONLY TOGETHER WITH THE TEAM FILE AND THE PROJECT'S PLACE, which the thread may have
         written before this threw, whether or not its reply came back. Where it cannot take them back, all of it is kept. */
      let unwound = true;
      try { await thread.call("undoRelayTeam", projectDir(dir), { teamId, rt, mirror: K.relayMirror(at, rt), folder: facts.folder || null }); } catch { unwound = false; } /* plant:rs926-unwind */
      if (unwound) K.forgetTeam(at, teamId); /* plant:rs926-forget */ /* plant:rs926-together */
      throw err;
    }
    /* The relay's create is this sync. team-count is said as itself, and the press leaves nothing, which is what the sentence says. */
    const synced = await relaySync();
    const counted = Array.isArray(synced) && synced.some((w) => w && w.team === teamId && w.reason === "team-count" && w.said === Rl.TEAM_COUNT_SAID);
    if (counted) {
      let unwound = true;
      try { await thread.call("undoRelayTeam", projectDir(dir), { teamId, rt, mirror: K.relayMirror(at, rt), folder: facts.folder || null }); } catch { unwound = false; }
      if (unwound) {
        K.forgetTeam(at, teamId); /* plant:rs932-count-forget */
        throw R.refuse(Rl.TEAM_COUNT_SAID); /* plant:rs932-count-said */
      }
      throw new Error("the relay refused a new team and the press could not be taken back");
    }
    return { created: true, relay: true, team: r.team };
  });
}));

/* THE HANDOVER'S REASON (Max's ruling of 2026-11-01 06:13), as the page asks it: "new-computer" keeps the team's lead box,
   "other-hands" gives the new key a box of its own. Anything else is no reason, which src/studio.mjs handoverTeam takes as the
   behaviour before the ruling, a box of its own. Recorded with the handover, so a resume hands over for the same reason. */
function handoverReason(why) {
  return why === "new-computer" || why === "other-hands" ? why : "";
}
/* A HANDOVER THAT GAVE THE NEW KEY A BOX OF ITS OWN leaves behind a desk that does not take a team file naming that box before
   the team's keys next change. The desks admitted at the handover are kept by team with the key number it was made at, and the
   Desks screen names those that have not taken the next key change (withReinvite). A handover that kept the box keeps no row. */
function noteFreshBox(teamId, r) {
  if (!teamId || !r || r.box !== "fresh" || !r.written || !Number.isInteger(r.written.epoch)) return;
  const cur = readStore();
  const rows = cur.freshBox && typeof cur.freshBox === "object" && !Array.isArray(cur.freshBox) ? Object.assign({}, cur.freshBox) : {};
  rows[teamId] = { epoch: r.written.epoch, desks: Array.isArray(r.desks) ? r.desks.map(String) : [] }; /* plant:lb-note */
  writeStore(Object.assign({}, cur, { freshBox: rows }));
}
/* HANDING A TEAM TO THE NEW SIGNING KEY (board 931 (7)): hands the team to this Studio's new key. */
async function runHandover(dir, why) {
  const keyToLock = await teamKeyFor(dir);
  return teamAct(keyToLock, async () => {
    const project = projectDir(dir);
    const reason = handoverReason(why);
    const S = await signLib(), Rl = await relayLib(), R = await refusal();
    const currentKeyFile = await keyFileNow();

  /* K4: verify new key durable */
  /* plant:handover-k4-key */
  if (!fs.existsSync(currentKeyFile)) throw R.refuse("This Studio has no signing key.");
  const currentKeyDoc = S.readKeyFile(currentKeyFile);
  if (!currentKeyDoc) throw R.refuse("This Studio's signing key could not be read.");
  const verifiedDoc = S.readKeyFile(currentKeyFile);
  if (!verifiedDoc || verifiedDoc.public !== currentKeyDoc.public || verifiedDoc.keyId !== currentKeyDoc.keyId) {
    throw new Error("current key could not be verified on disk");
  }
  const currentSecret = await keySecret("handover");
  if (!currentSecret && currentKeyDoc.kept !== S.OS_WRAP) {
    throw R.refuse("This Studio's signing key could not be opened.");
  }

  const facts = await thread.call("teamFacts", project, withHere({ key: currentKeyFile }));
  if (!facts || !facts.folder) throw R.refuse("There is no team here to hand over.");
  if (facts.file !== "theirs" || !facts.leadPub) {
    throw R.refuse("This team is not led by another signing key.");
  }

  /* plant:handover-offer */
  const oldKey = await findOldKey(facts.leadPub);
  if (!oldKey) throw R.refuse("This Studio does not hold the old signing key for this team.");

  const K = await teamStore(), at = await teamsAt();
  const relayRow = K.relayTeams(at).find((w) => (facts.folder && path.resolve(w.folder) === path.resolve(facts.folder)) || (facts.mark && w.team === facts.mark) || (facts.id && w.team === facts.id));
  const isRelay = !!relayRow;
  const teamId = facts.team ? facts.team.id : (relayRow ? relayRow.team : facts.mark);
  const kept = teamId ? K.keptTeam(at, teamId) : null;
  /* plant:handover-preserve-plain */
  const sealed = (kept && typeof kept.sealed === "boolean") ? kept.sealed
    : (facts && facts.team && typeof facts.team.sealed === "boolean" ? facts.team.sealed
    : (facts && typeof facts.sealed === "boolean" ? facts.sealed : true));

  if (isRelay) {
    let grant = Rl.readGrant(currentKeyFile);
    if (!grant) {
      try {
        await licenceOnce(true);
        grant = Rl.readGrant(currentKeyFile);
      } catch {}
    }
    const ho = {
      team: teamId,
      projectDir: project,
      folder: facts.folder,
      kind: "relay",
      sealed,
      rt: relayRow.rt,
      url: relayRow.url || Rl.RELAY_URL,
      step: "(ii)",
      oldKeyFile: oldKey.file,
      oldPub: facts.leadPub,
      newPub: currentKeyDoc.public,
      newKeyId: currentKeyDoc.keyId,
      t: Date.now(),
      grant,
      reason
    };
    writeStore(Object.assign({}, readStore(), { handover: ho }));

    const request = relayRunner && typeof relayRunner.request === "function" ? relayRunner.request : wire.relayRequest;
    const currentOpen = S.unlockKey(currentKeyDoc, currentSecret);
    const ses = currentOpen ? await Rl.leadSession({ request, url: ho.url, rt: ho.rt, open: currentOpen }) : "";
    let leadRes = null;
    if (ses && /^[0-9a-f]{64}$/.test(ses)) {
      leadRes = { ok: true };
    } else {
      leadRes = await Rl.handoverLead({
        request,
        url: ho.url,
        rt: ho.rt,
        newKeyId: ho.newKeyId,
        newPub: ho.newPub,
        t: Date.now(),
        oldOpen: oldKey.opened,
        grant: ho.grant
      });
    }
    if (!leadRes.ok) {
      if (leadRes.status === 0 || !Rl.isDefiniteRefusal(leadRes)) throw R.refuse(leadRes.said); /* plant:handover-uncertain-hold */
      /* plant:handover-refusal-stop */
      const cur = readStore();
      delete cur.handover;
      writeStore(cur);
      throw R.refuse(leadRes.said);
    }

    ho.step = "(iii)";
    writeStore(Object.assign({}, readStore(), { handover: ho }));
  } else {
    const ho = {
      team: teamId,
      projectDir: project,
      folder: facts.folder,
      kind: "folder",
      sealed,
      step: "(iii)",
      oldKeyFile: oldKey.file,
      oldPub: facts.leadPub,
      newPub: currentKeyDoc.public,
      newKeyId: currentKeyDoc.keyId,
      reason
    };
    writeStore(Object.assign({}, readStore(), { handover: ho }));
  }

  /* Step (iii) */
  const r = await thread.call("handoverTeam", project, {
    userData: app.getPath("userData"), projectsRoot: projectsRoot(),
    folder: facts.folder,
    oldKey: oldKey.file,
    oldPassphrase: oldKey.secret,
    key: currentKeyFile,
    passphrase: currentSecret,
    teamKeys: (await teamsNow()).teamKeys,
    reason
  });
  if (r && r.team) noteFreshBox(r.team.id, r);
  if (r && r.team) {
    const priorKept = K.keptTeam(at, r.team.id);
    /* plant:handover-preserve-plain */
    const sealedFinal = (priorKept && typeof priorKept.sealed === "boolean") ? priorKept.sealed
      : (typeof sealed === "boolean" ? sealed
      : (r.written && typeof r.written.sealed === "boolean" ? r.written.sealed
      : (r.team && typeof r.team.sealed === "boolean" ? r.team.sealed : true)));
    K.chooseSealed(at, r.team.id, sealedFinal, facts.folder, r.written);
  }
  if (isRelay) {
    K.markRelay(at, teamId, { lead: currentKeyDoc.public });
  }

  /* Step (iv) and (v) */
  const cur = readStore();
  delete cur.handover;
  writeStore(cur);

  if (isRelay) {
    relaySync();
  }

  return { ok: true, team: r ? r.team : null, created: true };
  });
}

/* `o.ended`, where given, is called once the record is cleared, before the relay's sync: the restore of board 984 waits for that
   much and no longer, so it can say the handover ended without waiting on the relay. */
async function resumeHandover(o) {
  const s = readStore();
  if (!s || !s.handover) return;
  const ho = s.handover;
  return teamAct(ho.team, async () => {
    try {
    const S = await signLib(), Rl = await relayLib();
    const currentKeyFile = await keyFileNow();

    /* plant:handover-k4-key */
    const currentKeyDoc = S.readKeyFile(currentKeyFile);
    if (!currentKeyDoc || currentKeyDoc.public !== ho.newPub) {
      return;
    }
    const verifiedDoc = S.readKeyFile(currentKeyFile);
    if (!verifiedDoc || verifiedDoc.public !== ho.newPub || verifiedDoc.keyId !== ho.newKeyId) {
      return;
    }
    const currentSecret = await keySecret("handover");
    const oldKey = await openOldKey(ho.oldKeyFile);
    /* The relay has the lead and the old key is not on this computer: the record says the last step still needs it,
       and the Desks screen is told once (board 931, handover 6). Earlier steps, and a folder handover, stay quiet. */
    if (!oldKey) {
      const needs = Rl.handoverNeedsOldKey(ho);
      if (needs) {
        const cur = readStore();
        if (cur) {
          cur.handover = needs.handover;
          cur.handoverEnded = needs.said;
          writeStore(cur);
        }
      }
      return;
    }

    if (ho.step === "(ii)") {
      if (ho.kind === "relay") {
        const request = relayRunner && typeof relayRunner.request === "function" ? relayRunner.request : wire.relayRequest;
        const currentOpen = S.unlockKey(currentKeyDoc, currentSecret);
        const ses = currentOpen ? await Rl.leadSession({ request, url: ho.url, rt: ho.rt, open: currentOpen }) : "";
        if (ses && /^[0-9a-f]{64}$/.test(ses)) {
          ho.step = "(iii)";
          writeStore(Object.assign({}, readStore(), { handover: ho }));
        } else {
          const leadRes = await Rl.handoverLead({
            request,
            url: ho.url,
            rt: ho.rt,
            newKeyId: ho.newKeyId,
            newPub: ho.newPub,
            t: Date.now(), /* plant:handover-fresh-t */
            oldOpen: oldKey.opened,
            grant: ho.grant
          });
          if (!leadRes.ok) {
            if (leadRes.status !== 0 && Rl.isDefiniteRefusal(leadRes)) {
              /* plant:handover-refusal-stop */
              const cur = readStore();
              delete cur.handover;
              cur.handoverEnded = leadRes.said; /* plant:handover-ended */
              writeStore(cur);
            }
            return;
          }
          ho.step = "(iii)";
          writeStore(Object.assign({}, readStore(), { handover: ho }));
        }
      } else {
        ho.step = "(iii)";
        writeStore(Object.assign({}, readStore(), { handover: ho }));
      }
    }

    /* plant:handover-resume-skip-ii */
    if (ho.step === "(iii)") {
      /* STEP (iii) WRITES THE NEW LEAD KEY INTO THE project.json OF EVERY CATALOG OF THE TEAM, in the projects folder, so it is finished only by a
         Studio that holds the folder: one out of sight, or one another Studio holds the folder from, leaves the record at (iii) and returns. It is
         resumed when the hold is taken again (the window shown) or at the next look of the watch (resumeWhenHeld). A colleague's publish lost to
         a write made without the hold outranks a handover waiting until the window is shown (Claudius, 2026-11-22 23:50). */
      if (holdBlocks(projectsRoot())) { resumeOwed = true; return; } /* plant:hold-resume */
      const r = await thread.call("handoverTeam", ho.projectDir || ho.folder, {
        userData: app.getPath("userData"), projectsRoot: projectsRoot(),
        folder: ho.folder,
        oldKey: ho.oldKeyFile,
        oldPassphrase: oldKey.secret,
        key: currentKeyFile,
        passphrase: currentSecret,
        teamKeys: (await teamsNow()).teamKeys,
        reason: handoverReason(ho.reason) /* plant:lb-resume-reason */
      });
      if (r && r.team) noteFreshBox(r.team.id, r);
      const K = await teamStore(), at = await teamsAt();
      if (r && r.team) {
        const priorKept = K.keptTeam(at, r.team.id);
        /* plant:handover-preserve-plain */
        const sealedFinal = typeof ho.sealed === "boolean" ? ho.sealed
          : ((priorKept && typeof priorKept.sealed === "boolean") ? priorKept.sealed
          : (r.written && typeof r.written.sealed === "boolean" ? r.written.sealed
          : (r.team && typeof r.team.sealed === "boolean" ? r.team.sealed : true)));
        K.chooseSealed(at, r.team.id, sealedFinal, ho.folder, r.written);
      }
      if (ho.kind === "relay") {
        K.markRelay(at, ho.team, { lead: ho.newPub });
      }
      const cur = readStore();
      delete cur.handover;
      writeStore(cur);
      /* A handover a restore set going (board 984) that ended after the restore replied leaves its ending for the Desks screen,
         and a Desks screen showing now is asked to read again. */
      const said = o && typeof o.ended === "function" ? o.ended() === true : false;
      if (ho.restored === true && !said && ho.projectDir) {
        writeStore(Object.assign({}, readStore(), { handoverDone: String(ho.projectDir) }));
        syncNoteNudge();
      }
      if (ho.kind === "relay") {
        await relaySync();
      }
    }
  } catch (err) {
    process.stderr.write("studio handover resume: " + String(err && err.message || err) + "\n");
  }
  });
}

answer("studio:team-handover", async (e, dir, why) => guard(async () => runHandover(projectDir(dir), String(why || ""))));

/* An older Studio may have left a team move record in studio.json; clear it at start with one log line and do nothing else. */
function dropLeftoverMove() {
  const cur = readStore();
  if (!cur || !Object.prototype.hasOwnProperty.call(cur, "move")) return;
  const next = Object.assign({}, cur);
  delete next.move;
  if (writeStore(next) !== false) {
    process.stderr.write("studio  removed a leftover move record written by an older Studio\n");
  }
}

/* THE COPY AN UPDATE SET ASIDE ("<folder>.setup-previous", the pinned installer hooks' etiudaSwap) loses, once this copy has
   started, the files its own list names (etiuda-files.ini, electron-builder.js installList) and the folders they leave empty;
   never a link, never anything else. Where this account may not write there (an all-users install), it stays for the next
   installer or the uninstall. The pinned engine's shell/main.js setAsideDrop, byte for byte: tests/studio-installer-mends.mjs sm2c
   holds it to the pin's wherever the pin carries one. */
async function setAsideDrop(fsp, join, aside, own, exe) {
  const st = await fsp.lstat(aside).catch(() => null);
  if (!st || !st.isDirectory() || st.isSymbolicLink() || !(await fsp.lstat(join(aside, exe)).catch(() => null))) return "none";
  let text = await fsp.readFile(join(aside, "etiuda-files.ini"), "utf8").catch(() => null), wide = false;
  if (text === null) { wide = true; text = await fsp.readFile(join(own, "etiuda-files.ini"), "utf8").catch(() => null); }
  if (text === null) return "no list";
  const listed = { files: new Set(), dirs: new Set() };
  let sect = "";
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim(), head = /^\[([^\]]*)\]$/.exec(line), eq = line.indexOf("=");
    if (head) sect = head[1].toLowerCase();
    else if (eq > 0 && listed[sect]) listed[sect].add(line.slice(0, eq).trim().toLowerCase());
  }
  const whole = key => wide && /^(resources|locales)(\\|$)/.test(key); /* a copy installed before the list: as etiudaDropOld counts them */
  const walk = async rel => {
    for (const name of await fsp.readdir(rel ? join(aside, rel) : aside).catch(() => [])) {
      const r = rel ? rel + "\\" + name : name, key = r.toLowerCase(), p = join(aside, r);
      const s = await fsp.lstat(p).catch(() => null);
      if (!s || s.isSymbolicLink()) continue;
      if (s.isDirectory()) { if (listed.dirs.has(key) || whole(key)) { await walk(r); await fsp.rmdir(p).catch(() => {}); } }
      else if (listed.files.has(key) || whole(key)) await fsp.unlink(p).catch(() => {});
    }
  };
  await walk("");
  return fsp.rmdir(aside).then(() => "gone", () => "kept");
}
function dropSetAside() {
  if (process.platform !== "win32" || !app.isPackaged) return;
  const own = path.dirname(process.execPath);
  /* Electron's node:fs reads an .asar as a folder, so resources\app.asar would be walked and never unlinked, and the copy aside
     never emptied: original-fs sees it as the file it is (outside Electron, as in the harness, node:fs already does). */
  let ofs = fs;
  try { ofs = require("original-fs"); } catch { ofs = fs; }
  setAsideDrop(ofs.promises, path.join, own + ".setup-previous", own, path.basename(process.execPath)).catch(() => {});
}

/* ---- THE LICENCE SERVICE (board 936, S6: the plan's L4) ------------------------------------------------------------------
 *
 * A lead who signs in gets a licence file and a relay grant with no command line (src/licence-client.mjs, which builds and
 * judges; every call goes through src/wire.cjs licenceRequest, under the service's one address). What comes
 * back is judged before anything is kept: the licence by verifyLicence under the root with the revoked keys applied, written to
 * the licence file publishing reads; the grant by the pinned relay's own grantWhy for this lead, written to relay-grant.json
 * beside the key, which is what the relay cover judges, so the relay is offered at once; the revoked keys' list only when the
 * root signed it and it is later than the one kept, beside the licence file.
 *
 * THE QUIET CHECK runs on a schedule while Studio runs: a minute after it starts, then each hour asks planFor whether it is due,
 * which it is twelve hours after the last answered check (an hour after a failed try). A Studio never activated is never
 * checked. A key made again asks the lead to sign in. The record of the activation (`by`, the key it bound, when it was last
 * checked) is in licence-service.json beside the store, never in the store itself. Check now, in the cover, runs it at once.
 */
const licenceClient = lazy("licence-client.mjs");
const erasedLib = lazy("erased-desks.mjs");
const licenceMod = lazy("licence.mjs");
/* WHAT THIS STUDIO HAS SEEN (src/licence.mjs, review xi, A1, A3, A4): the licence it verified, the newest revoked keys' list and
   the newest time, taken back once at the module's first load from licence-service.json where its digest, sealed by this account's
   keyring (vault), still opens to it, and kept there, sealed again, each time it changes in a way worth keeping; the signing key is
   never opened for it. A snapshot edited, sealed elsewhere, or with none, is not taken, and nothing is lowered by one. Where the
   system cannot seal, nothing is kept across a restart. The publish thread runs apart, so it is handed the snapshot (seenFor). */
let seenReady = null;
async function licenceLib() {
  const L = await licenceMod();
  if (!seenReady) seenReady = seenStart(L).catch((err) => { process.stderr.write("studio  what this Studio had seen was not taken back: " + String(err && err.message || err) + "\n"); });
  await seenReady;
  return L;
}
async function seenStart(L) {
  const st = readServiceState();
  let sealedHolds = false;
  try { sealedHolds = !!st.seen && typeof st.seenSealed === "string" && vault.available()
    && String(vault.open(Buffer.from(st.seenSealed, "base64"))) === L.seenDigest(st.seen); } catch { sealedHolds = false; }
  if (sealedHolds) L.seenFrom(st.seen, await licenceFileNow(), L.trustedKeyNow()); /* plant:seen-start */
  L.onSeen(() => seenKeepSoon());
}
/* KEPT BY A CHAIN, NOT A TIMER: changes arriving while a keep runs are kept once more after it, so the keyring is opened at most
   twice for a burst, and no timer is left behind the shell (relay-studio's leak checks). */
let seenKeeping = null, seenAgain = false;
function seenKeepSoon() {
  if (seenKeeping) { seenAgain = true; return; }
  seenKeeping = Promise.resolve().then(() => seenKeep()).catch(() => {}).then(() => {
    seenKeeping = null;
    if (seenAgain) { seenAgain = false; seenKeepSoon(); }
  });
}
async function seenKeep() {
  const L = await licenceLib();
  const snap = L.seenNow(await licenceFileNow(), L.trustedKeyNow()), st = readServiceState();
  /* A time alone, with no licence verified, no list and no certificate to hold it against, is nothing worth keeping (and the keyring is
     not asked about for it). */
  if (!snap.licence && !snap.revoked && !(st.seatCerts && st.seatCerts.studio)) return;
  /* Sealed without asking which keyring first (that question is the shell's diagnostic line, said once, and a fresh profile has no reason
     to say it); where the system cannot seal for real, seenStart's vault.available() refuses the snapshot at the next start. */
  let sealed = "";
  try { sealed = Buffer.from(vault.seal(L.seenDigest(snap))).toString("base64"); } catch { return; }
  writeServiceState(Object.assign({}, st, { seen: snap, seenSealed: sealed }));
}
/** The snapshot the publish thread and its cover are handed: what this process has seen for the licence file now. */
async function seenFor() {
  const L = await licenceLib();
  return L.seenNow(await licenceFileNow(), L.trustedKeyNow());
}
/* The serial of the revoked keys' list Studio reads now (0 for none), and the highest it ever took, kept in the state so the
   schedule asks again at once where the list it held can no longer be read (src/licence-client.mjs planFor). */
async function revokedSerialNow() {
  const L = await licenceLib();
  /* The files' own list, not what this Studio has seen (review xi, A3), so a list lost on disk is asked for again at once. */
  const kept = L.diskRevocations(await licenceFileNow(), L.trustedKeyNow());
  return kept && Number.isSafeInteger(kept.serial) ? kept.serial : 0;
}
async function keepRevokedSerial() {
  const serial = await revokedSerialNow(), st = readServiceState();
  if (serial > (Number(st.revokedSerial) || 0)) writeServiceState(Object.assign({}, st, { revokedSerial: serial }));
}
/* The service keys the licence root has revoked, as the runner reads them when a grant comes back refused. */
async function revokedKeysNow() {
  const L = await licenceLib();
  const file = await licenceFileNow();
  const kept = L.keptRevocations(file, L.trustedKeyNow());
  return kept && Array.isArray(kept.keys) ? kept.keys : [];
}
const LICENCE_FIRST_MS = 60000;
const LICENCE_TICK_MS = 3600000;
function serviceStateAt() { return path.join(app.getPath("userData"), "licence-service.json"); }
/* THE SIGN-IN'S SEALED REFRESH TOKEN IS A FILE OF ITS OWN, signin-token.json, on neither keep list (RESET_KEEP_NAMES and the
   uninstaller's), so Reset and Remove my data take the account's credential while the licence stays. The two functions below
   are the state's one reader and writer and show it as one object; a token an older Studio kept inside licence-service.json is
   moved out at the first read. */
const TOKEN_FILE = "signin-token.json";
function tokenAt() { return path.join(app.getPath("userData"), TOKEN_FILE); }
/* A STATE FILE THAT DOES NOT PARSE IS NO FILE (the test architect's D3; tests/licence-studio.mjs lsx3): here, and in seatedNow below, it reads as
   absent, so the gate and the cover say what they say of a Studio nobody signed in to, which asks for a sign-in and keeps every draft, and never
   throw. Only a file another program holds (EPERM, EACCES, EBUSY) is a file that is there but unreadable, and keeps the last certificate verified. */
function readServiceState() {
  let s = {}, held = "";
  try { const o = JSON.parse(fs.readFileSync(serviceStateAt(), "utf8")); s = o && typeof o === "object" && !Array.isArray(o) ? o : {}; }
  catch { s = {}; } /* plant:state-read */
  try { const t = JSON.parse(fs.readFileSync(tokenAt(), "utf8")); held = t && typeof t.refreshSealed === "string" ? t.refreshSealed : ""; }
  catch { held = ""; }
  if (typeof s.refreshSealed === "string" && s.refreshSealed) {
    const moved = Object.assign({}, s, { refreshSealed: held || s.refreshSealed });
    try { writeServiceState(moved); } catch { /* moved at the next write */ }
    return moved;
  }
  if (held) s.refreshSealed = held; else delete s.refreshSealed;
  return s;
}
function writeServiceState(next) {
  const rest = Object.assign({}, next), token = typeof rest.refreshSealed === "string" ? rest.refreshSealed : "";
  delete rest.refreshSealed; /* plant:token-apart */
  fs.mkdirSync(path.dirname(serviceStateAt()), { recursive: true });
  if (token) writeWhole(tokenAt(), JSON.stringify({ refreshSealed: token }, null, 1) + "\n");
  writeWhole(serviceStateAt(), JSON.stringify(rest, null, 1) + "\n");
  if (!token) fs.rmSync(tokenAt(), { force: true });
}
/* The sentence for each way an act can fail, by the service's reason or the client's own; anything else is "unreached". */
const LICENCE_SAID = {
  /* The copywriter's, 2026-11-13. */
  refused: "The licence service did not accept this, so nothing was changed. Try again; if it happens again, write to us through etiuda.dev.",
  stale: "This computer's clock is more than five minutes out, so the licence service did not take the request. Once the clock is right, try again.",
  "slow-down": "There have been too many tries in the last hour. Try again later.",
  untrusted: "The licence service answered with nothing this Studio accepts, so nothing was kept. Write to us through etiuda.dev.",
  signature: "The licence service could not confirm this request against this Studio's key, so nothing was changed. Try again; if it happens again, write to us through etiuda.dev.", /* plant:s6-signature */
  replayed: "The licence service had already received this same request, most likely from this computer's own retry, so it did not take it twice. Try again.", /* plant:s6-replayed */
  malformed: "The licence service could not read this request, so nothing was changed. A newer version of Studio may be needed: look on etiuda.dev, or write to us there.", /* plant:s6-malformed */
  unreached: "The licence service could not be reached, so nothing was changed. Try again later.",
  /* Sign-in (board 980, stage 2): the copywriter's words. */
  "signin-none": "That sign-in provider is not offered by this Studio, so nothing was changed.",
  "signin-cancelled": "The sign-in was cancelled, so nothing was changed.",
  "signin-browser": "No browser could be opened for the sign-in, so nothing was changed. Try again once this computer has a browser set to open links.",
  "signin-refused": "The sign-in provider ended the sign-in without an answer Studio can use, so nothing was changed. Try again.",
  "signin-state": "The browser came back with an answer that was not this sign-in's, so it was not used. Try again.",
  "signin-expired": "The sign-in's answer had expired by the time Studio used it, so nothing was changed. Try again.",
  "signin-timeout": "No sign-in came back from the browser within five minutes, so nothing was changed. Try again.",
  /* A managed installation (decision 49): an account the organisation's pin does not take, the copywriter's refusal; another account
     where the organisation keeps the one signed in; an act the managed computer does not offer, her
     locked row's sentence. */
  "signin-tenant": "The organisation has not given this account access to Etiuda, so it cannot sign in. Its IT department can give access.",
  "signin-other": "Only the account already signed in can sign in again on this computer, and that was another account, so nothing was changed.",
  "managed-act": "Set by the organisation's IT department, so it cannot be changed here.",
  "signin-token": "This account's sign-in was not accepted, so nothing was changed. Try again; if it happens again, write to us through etiuda.dev.",
  /* The two "not allowed" states (night decision 20 (b)), each its own sentence: the copywriter's, the page drawing each half in
     its place. Her "All {N} are in use." is left out of the lead seat's: the service's answer names no count. */
  "signin-org": "This account's organisation has not allowed Etiuda at its sign-in provider. Its IT department can allow it; another account can be used meanwhile.",
  "signin-no-licence": "No Etiuda licence has a seat for this account. The sign-in worked. A seat comes from a trial, a purchase, or the licence's owner naming this account a lead; another account can be used meanwhile.",
  "signin-full": "This licence has no free lead seat. The licence's owner can free one in Studio, from the Menu, under Settings, then Account.",
  /* A licence whose seats follow Microsoft Entra (decision 49, held for Max's ruling): the copywriter's words
    (2026-11-13). */
  "signin-no-role": "This account has no Etiuda role in its organisation, so it holds no seat. Its IT department assigns the roles.",
  managed: "Seats on this licence follow the roles the organisation's IT department assigns, so nothing was changed here.",
  "signin-ask": "This Studio could not renew its sign-in by itself. Sign in again below.",
  /* A Studio activated before sign-in, answered "signin" (src/licence-client.mjs afterCheckBefore): the copywriter's. */
  "signin-moved": "Licences are now held by signing in. This Studio's licence file stays where it is but no longer counts: publishing needs this Studio signed in, and signing in brings the licence this account holds.",
  /* A provider pressed in the sign-in preview (signInOffer): the copywriter's. */
  "signin-preview": "Sign-in is not set up yet, so nothing was sent. This is a preview.",
  /* A desk's seat freed by the lead (board 980, stage 3); how each desk stands is said on its row. */
  "seat-none": "This desk holds no seat to free, so nothing was changed.",
  /* A desk seat this lead may not free (decision 46, Claude alpha's, and his word of 15:34: "a press the service refused must read
     as refused, with the owner named as the one to ask"): the copywriter's words. */
  "seat-owner": "This Studio may not free this seat, so nothing was changed. The licence's owner can free it.",
  /* Free seat, of either kind, pressed where this Studio's own lead seat is not current (lapsed, freed, a licence refunded): the
     service's 403 not-lead. The copywriter's words. */
  "not-lead": "This Studio no longer holds a lead seat on the licence, so nothing was changed. Signing in again, under Account, takes one again where the licence still has one for this account.", /* plant:s46-not-lead */
  /* A lead seat the owner frees by its code (decision 15 (b)). */
  "lead-seat-none": "That seat is no longer on this licence, or this Studio does not own the licence, so nothing was changed.",
  /* Naming a lead and the owner's switch (a team is its lead's own; decision 47, held for Max's ruling): the copywriter's. */
  "lead-name-full": "Every lead seat on the licence is taken, so nobody was named. Removing a lead, or buying another lead seat, frees one.",
  /* The named person's own press (board 1011). placeholder: Claudette */
  "naming-none": "There is no naming to accept now, so nothing was changed.",
  /* Board 1017: no code in any sentence; the copywriter's words of 2026-11-22, last section. */
  "lead-name-none": "That person can no longer be named on this licence, so nobody was named.",
  /* Board 1017: a refused Withdraw or Decline on a naming, and a refused Confirm as lead; the copywriter's words of 2026-11-22. */
  "naming-withdraw-none": "The naming could not be withdrawn, so nothing has changed.",
  "lead-confirm-none": "This person could not be confirmed as lead, so nothing has changed.",
  "lead-name-address": "That is not an email address, so nobody was named.",
  "already-invited": "Another lead on this licence has already invited this address, so this invitation was not made.",
  "switch-owner": "Only the licence's owner can change who may take a desk seat, so nothing was changed.",
  /* From the list, a lead the service will not let admit anyone. */
  "person-lead": "Admitting people needs this Studio signed in and this catalog shared with a team, so nobody was admitted.",
  /* Board 1017: each press its own ending (the test architect's read, D3); the copywriter's words of 2026-11-22. */
  "person-lead-invite": "Inviting people needs this Studio signed in and this catalog shared with a team, so nobody was invited.",
  "person-lead-withdraw": "Withdrawing an invitation needs this Studio signed in and this catalog shared with a team, so the invitation still stands.",
  "person-lead-confirm": "Confirming people needs this Studio signed in and this catalog shared with a team, so nobody was confirmed.",
  "person-lead-decline": "Declining a request needs this Studio signed in and this catalog shared with a team, so the request still waits.",
  /* An invitation by address on a team that shares a folder: the invitation link carries the folder; the copywriter's words. */
  "person-invite-folder": "This team works from a shared folder, so a teammate is invited with a link; nobody was invited by address.",
  /* Who stays under a coming seat reduction (seat/stay, piece c): the copywriter's, section 7. */
  "stay-full": "More people are chosen than the licence will have seats for, so nothing was changed.",
  "stay-none": "One of the people chosen no longer holds a seat on this licence, so nothing was changed.",
};
const licenceSaid = (reason) => LICENCE_SAID[reason] || LICENCE_SAID.unreached;
/** The lead's key opened for one signature, or null where there is none or it does not open. */
async function leadOpen() {
  const S = await signLib();
  let read = null;
  try { read = S.readKeyFile(await keyFileNow()); } catch { return null; }
  if (!read) return null;
  const secret = await keySecret("licence");
  if (!secret) return null;
  try { return S.unlockKey(read, secret); } catch { return null; }
}
/** The lead's key's public half now, or "". */
async function leadPub() {
  try { const read = (await signLib()).readKeyFile(await keyFileNow()); return read ? read.public : ""; } catch { return ""; }
}
/* A licence and a grant name a key, so an activation on a Studio with none makes it first, as the first publish does (finding 9);
   a key that will not open is said, and nothing is sent. */
async function leadReady(R) {
  if (await keyNone()) {
    await makeKey();
    /* Remembered as made here, with the relay spaces already made, so a team key's backup copy restored next may take its place
       while it has signed nothing (keyUnspent, item 10). */
    const K = await teamStore(), at = await teamsAt();
    let relay = [];
    try { relay = K.relayTeams(at).filter((t) => t.created).map((t) => t.rt); } catch { relay = []; }
    writeStore(Object.assign({}, readStore(), { keyMade: { pub: await leadPub(), relay } })); /* plant:k10-mark */
  }
  const open = await leadOpen();
  if (!open) throw R.refuse("This Studio's signing key does not open on this computer, so nothing was sent. Restore it first from the Menu, under Settings, then Signing key.");
  return open;
}
async function licenceCtx(lead, now) {
  const L = await licenceLib(), Rl = await relayLib();
  return { lead, now, licenceFile: await licenceFileNow(), grantFile: Rl.grantFileOf(await keyFileNow()),
    trustedKey: L.trustedKeyNow(), roots: relayRootsNow() };
}
const dayOf = (ms) => (Number.isFinite(ms) ? new Date(ms).toISOString().slice(0, 10) : null);
/** Whether this Studio's licence is paused (trial ended, refund, revocation). */
async function licencePausedNow() {
  try {
    const L = await licenceLib(), file = await licenceFileNow();
    const lic = await L.licenceState(L.readLicenceFile(file), { file });
    return !!lic.paused;
  } catch { return false; }
}

/* AFTER A TRIAL'S END, READING STATISTICS AND TAKING PROPOSALS PAUSE BESIDE PUBLISHING (decisions 2026-09-24 02:01 and 02:03). The
   sentence is the trial's (src/licence.mjs TRIAL_PAUSED). Editing, lint and export stay open, and so does turning
   back a proposal's marks, which is editing. Read from the licence file at each ask, as publishing reads it. */
async function notPaused() {
  const L = await licenceLib(), file = await licenceFileNow();
  const lic = await L.licenceState(L.readLicenceFile(file), { file });
  if (!lic.paused) return;
  /* Marked as the pause, so the page can set the way to sign in beside the sentence (night decision 16). */
  const paused = (await refusal()).refuse(L.TRIAL_PAUSED, { DATE: lic.trial.until }); /* plant:eval-paused */
  paused.said.why = "paused";
  throw paused; /* plant:trial-paused */
}
/* A PAID ACT ON A STUDIO NOBODY SIGNED IN TO (night decision 16; Hydrogen's review of 2026-11-12, finding 5): the page's paidWaits
   (ui/app.js), held here too, so a call that does not come through the page's own screen is refused as the page would refuse it,
   with the page's sentence, marked as the pause so Sign in stands beside it. With a provider offered (the preview's counted, as the
   page counts them) and no licence activated here by any way, reading statistics, taking proposals and publishing to a team wait. */
async function signInWaitsNow() {
  const st = readServiceState();
  /* An administrator signed in holds no seat (decision 49), so their paid acts wait as a Studio nobody signed in to does. */
  if (typeof st.by === "string" && st.by && st.by !== "admin") return false; /* plant:admin-waits */
  return (await signInOffer()).signIn.length > 0; /* plant:f5-offered */
}
async function signInWaits(frame) {
  if (!(await signInWaitsNow())) return;
  const waits = (await refusal()).refuse(frame);
  waits.said.why = "paused";
  throw waits;
}
/* DOES THIS STUDIO WORK NOW? (review xi; Max, 2026-11-22 15:37, in decisions.md: Studio's gate rests on the sign-in's seat certificate
   alone.) On this Studio's own seat certificate, which the licence service signs for this Studio's key at each sign-in and renewal and
   which runs at most thirty days (`seated`, seatedNow); or on a licence the root signed by hand, the one narrow path for a customer who
   cannot sign in (`lic.root`), running, or held over one this computer verified. A sign-in's state alone, a licence file the service
   issued, an administrator (no seat), an activation before sign-in, no licence and an ended trial do not. Pure, of licenceState's
   answer and whether the certificate holds, and sliced by tests/shell-guards.mjs 21. licenceNow hands it to the page as `works`. */
function studioWorks(lic, seated) {
  return seated === true || (!!lic && lic.root === true && ["trial", "active", "held"].indexOf(lic.status) >= 0); /* plant:works-seat */
}
/* THIS STUDIO'S OWN SEAT CERTIFICATE NOW (review xi, A1 and A2): the one licence-service.json keeps (seatCerts.studio, which on a licence
   that follows Entra is its lead certificate), judged for this Studio's key on the floor's clock (src/desk-seat.mjs checkOwnSeat), with the key itself
   opening on this computer, asked once a run, so the files copied to another computer work on nothing. A licence-service.json another
   program holds keeps the certificate this run last verified, judged again on the clock, so a scanner or a sync client strands nobody;
   nothing unverified is ever taken on its word. */
let seatSeen = null;
const keyOpensHere = new Set();
async function seatedNow() {
  const L = await licenceLib(), D = await deskSeatLib(), file = await licenceFileNow();
  let st = null, held = false;
  try { st = JSON.parse(fs.readFileSync(serviceStateAt(), "utf8")); }
  catch (e) { held = !!e && ["EPERM", "EACCES", "EBUSY"].indexOf(e.code) >= 0; st = null; } /* plant:state-seat */
  const pub = await leadPub();
  const certs = st && st.seatCerts && typeof st.seatCerts === "object" ? st.seatCerts : null;
  const cert = held ? (seatSeen && seatSeen.pub === pub ? seatSeen.cert : null) /* plant:seat-held */
    : certs && certs.studio ? certs.studio : null;
  if (!cert || !pub) return false;
  if (D.checkOwnSeat(cert, { key: pub, now: L.clockFor({}, cert.issued), file }).ok !== true) return false; /* plant:seat-check */
  if (!keyOpensHere.has(pub)) {
    if (!(await leadOpen())) return false;
    keyOpensHere.add(pub);
  }
  if (!held) seatSeen = { cert, pub };
  return true;
}
/** The certificate the publish thread is handed, where this Studio's own holds now; else undefined. */
async function seatFor() { return (await seatedNow()) && seatSeen ? seatSeen.cert : undefined; }
/* THE SENTENCE A STUDIO THAT DOES NOT WORK ANSWERS A CLOSED CHANNEL WITH, marked as a stop so the page can show the door (the
   words are the copywriter's to settle; the page reads the mark, not the sentence). */
const STOPPED_SAID = "Studio works once you are signed in under a trial or a licence, so nothing was done.";
async function stoppedAnswer() {
  const stopped = (await refusal()).refuse(STOPPED_SAID);
  stopped.said.why = "stopped";
  return bad(stopped);
}
/* DOES THIS STUDIO WORK, ASKED AT AN ACT'S OWN TURN (the gate; Claude alpha, 2026-11-18 10:37): every channel the table closes, and
   each background act Studio starts (the team watch, the followed team, the catalog watches, the relay's sync, the waiting check),
   asks it when it runs, never once at launch. Read as licenceNow reads it, the licence's state kept for thirty seconds against the
   file's size and time so an edit's save does not verify a signature each time; a failure to judge is a Studio that does not work.
   The first time it turns from not working to working, the background acts the stopped Studio let go are started (resumeBackground). */
let worksMemo = { key: "", lic: null }, worksWas = null;
async function worksNow() {
  let works = false;
  try {
    const L = await licenceLib(), file = await licenceFileNow();
    let at = "none";
    try { const s = fs.statSync(file); at = s.size + ":" + s.mtimeMs; } catch { /* no file: the memo says so */ }
    const key = [file, at, process.env.STUDIO_RELEASED || "", Math.floor(Date.now() / 30000)].join("|");
    /* No licence is not kept for the thirty seconds, so a file another program held at launch is read again at the next ask. */
    if (worksMemo.key !== key) { const lic = await L.licenceState(L.readLicenceFile(file), { file }); worksMemo = { key: lic.status === "none" ? "" : key, lic }; }
    works = studioWorks(worksMemo.lic, await seatedNow());
  } catch { works = false; }
  const was = worksWas;
  worksWas = works;
  if (works && was === false) setImmediate(() => { resumeBackground(); });
  return works;
}
/* What a Studio that did not work let go, started once it works: the followed team, the catalog watches, a look at the teams and a
   sync of the relay, each of which asks worksNow again at its own turn. */
function resumeBackground() {
  if (relayClosed) return;
  followStart().catch(() => {});
  armCatalogWatches();
  teamWatch("");
  relaySync();
}
/** What the Licence cover shows: the licence publishing acts on, the relay grant held for this key and its end, how this Studio
 *  was activated and when it was last checked, and whether the key changed since. No key or address. */
async function licenceNow() {
  const L = await licenceLib(), C = await licenceClient(), Rl = await relayLib();
  const file = await licenceFileNow(), st = readServiceState(), lead = await leadPub(), now = Date.now();
  const lic = await L.licenceState(L.readLicenceFile(file), { file });
  const g = lead ? C.grantHeld(Rl.grantFileOf(await keyFileNow()), lead, now, relayRootsNow()) : null;
  return {
    licence: licenceShown(lic, st, await seatedNow(), now),
    /* Whether this Studio works now (studioWorks, on its own seat certificate or a licence the root signed): the gate's own answer. */
    works: await worksNow(),
    grant: g ? { until: dayOf(g.until), paid: g.paid === true } : null,
    by: typeof st.by === "string" ? st.by : null,
    checked: dayOf(Number(st.checked)),
    /* The moment of the last answered check, for Account's Last checked, and whether a try since went unanswered. */
    checkedAt: Number(st.checked) > 0 ? Number(st.checked) : null,
    unanswered: Number(st.tried) > Number(st.checked || 0),
    keyChanged: !!(st.by && lead && st.lead !== lead),
    /* Activated before sign-in, by a purchase key, an address's code or a trial by code: the cover asks the lead to sign in. */
    signinMoved: C.BEFORE_SIGNIN.has(st.by), /* plant:s4-moved-said */
    /* Sign-in (board 980): the providers offered, by name alone, the one signed in with, and whether a renewal needs the lead. */
    ...(await signInOffer()),
    provider: (st.by === "signin" || st.by === "admin") && typeof st.provider === "string" ? st.provider : null,
    signinAsk: st.signinAsk === true,
    /* An administrator of a licence whose seats follow Entra, signed in with no seat (decision 49): the provider and the licence's
       card as licence/admin last answered it. */
    admin: adminNow(st),
    /* Whether this person owns the licence. The sign-in's code stays in this process: no screen shows, asks or copies one (board 1017). */
    signinOwner: ownerHere(st),
    /* A team is its lead's own (decision 47): whether this lead, on a trial of its own, should ask its organisation's owner to name
       it; and to the owner of a paid licence its switch, and whether this Studio has yet asked the owner about it once. */
    signinAskOwner: st.by === "signin" && st.signinAskOwner === true,
    /* A naming this person has not accepted (board 1011): who named them, the licence's organisation, their own trial's last day, and the
       key Studio asks once per; null where there is none. */
    naming: st.by === "signin" && st.signinNaming && typeof st.signinNaming === "object" ? {
      by: String(st.signinNaming.by || ""), org: String(st.signinNaming.org || ""), until: st.signinNaming.trialEnds === null ? null : dayOf(Number(st.signinNaming.trialEnds)),
      key: String(st.signinNaming.key || ""),
      state: st.signinNaming.state === "blocked" ? "blocked" : st.signinNaming.state === "confirm" ? "confirm" : "ask" } : null,
    /* A managed tenant's person who also bought a licence of their own: which of the two they use, and why (decision 49). */
    signinCause: st.by === "signin" && (st.signinCause === "own-licence" || st.signinCause === "assigned") ? st.signinCause : null,
    /* Board 1020: whether Buy goes anywhere, what this person pays (the portal as a yes or no) and a payment held naming them; no address. */
    buy: BUY.buyView(st, ORDER_ORIGIN, managedHere()),
    /* A team's relay refused this Studio's seat (a licence that follows Entra): "removed" where the service found no role, else "renew". */
    relaySeat: st.by === "signin" && relaySeatRefused.size ? (st.signinNoRole === true ? "removed" : "renew") : "",
    orgDesks: ownerHere(st) && typeof st.orgDesks === "boolean" ? st.orgDesks : null,
    orgDesksAsk: ownerHere(st) && typeof st.orgDesks === "boolean" && !!st.licenceRef
      && st.orgDesksAsked !== st.licenceRef, /* plant:t-ask-once */
    /* Whether this system's store seals for real (vault.available); where it does not, no sign-in is kept and Account says so. */
    signinKeeps: vault.available(),
    hasKey: !!lead,
    signing: await signingNow(),
    relayTeams: (await relayLapses()).teams, /* plant:g2s-cover */
    ...managedShown(),
  };
}
/* THE LICENCE AS THE COVER SAYS IT (Claudius's pass of 2026-11-22, on Max's ruling of 15:37): a licence the root signed by hand, from its
   file, the one narrow path; else from the service's answer kept beside the sign-in (licenceShown, src/licence-client.mjs keepWho) and
   whether this Studio's own certificate holds. A licence file the service issued is never read for it. With the certificate holding: the
   trial and its end, or the licence, its organisation, seats and updates as the service last said them (null where it said none, and the
   page then says it in its own line). Without: a trial the service said has ended reads ended, so the door says so; anything else is none,
   naming the file only where something there cannot be used at all. */
function licenceShown(lic, st, seated, now) {
  const plain = (o) => ({ status: o.status, paused: !!o.paused, org: o.org || null, seats: o.seats || null, devicesEach: o.devicesEach || null,
    updatesUntil: o.updatesUntil || null, trial: o.trial || null, unusable: o.unusable ? { reason: o.unusable.reason,
    file: o.unusable.file ? path.basename(o.unusable.file) : null } : null });
  if (lic && lic.root === true) return plain(lic);
  const s = st && st.licenceShown && typeof st.licenceShown === "object" ? st.licenceShown : null;
  const ends = s && Number.isSafeInteger(s.trialEnds) ? s.trialEnds : null;
  const trial = (over) => ({ until: dayOf(ends), ends, over, signed: true });
  if (seated) {
    if (ends !== null) return plain({ status: "trial", trial: trial(false) });
    return plain({ status: "active", org: s && s.org, seats: s && s.seats, devicesEach: s && s.seats ? 3 : null, updatesUntil: s && s.updatesUntil });
  }
  if (ends !== null && ends <= now) return plain({ status: "trial-ended", paused: true, trial: trial(true) }); /* plant:shown-trial-ended */
  return plain({ status: "none", unusable: lic && lic.status === "none" && lic.unusable ? { reason: lic.unusable.reason,
    file: lic.unusable.file ? path.basename(lic.unusable.file) : null } : null }); /* plant:lr-file-name */
}
/** The administrator's view as the page is handed it, or null for anyone else: the provider and the card, no token or seal. */
function adminNow(st) {
  const c = st && st.by === "admin" && st.adminCard && typeof st.adminCard === "object" ? st.adminCard : null;
  if (!c) return null;
  const pool = (d) => ({ held: Number(d && d.held) || 0, of: Number(d && d.of) || 0 });
  return { provider: typeof st.provider === "string" ? st.provider : "", org: typeof c.org === "string" ? c.org : "",
    seats: { lead: pool(c.seats && c.seats.lead), desk: pool(c.seats && c.seats.desk) }, waiting: { desk: Number(c.waiting && c.waiting.desk) || 0 },
    paidUntil: typeof c.paidUntil === "string" ? c.paidUntil : null, updatesUntil: typeof c.updatesUntil === "string" ? c.updatesUntil : null };
}
/** A refused sign-in, for Buy (board 1020): where the service refused "no-licence", the code its answer carried, kept as signinNoLicence
 *  (src/buy-path.cjs noLicenceKept); any other refusal drops what an earlier one left. Nothing is written where there is nothing to keep
 *  or drop, so a refusal leaves the state as it was. */
function keepRefused(a) {
  const st = readServiceState(), kept = BUY.noLicenceKept(a);
  if (!kept && st.signinNoLicence === undefined) return;
  const next = Object.assign({}, st);
  if (kept) next.signinNoLicence = kept; else delete next.signinNoLicence; /* plant:buy-refused-keep */
  writeServiceState(next);
}
/** One act of the lead's: `way` "signin", `act(open, now)` the client's call. Kept only what is judged; the record of the
 *  activation follows it. `sealed` is a function answering the refresh token's seal once the act has run, and `provider` the
 *  sign-in's provider. */
async function licenceAct(way, act, sealed, provider) {
  const R = await refusal(), C = await licenceClient();
  const open = await leadReady(R), now = Date.now();
  const a = await act(C, open, now);
  if (!a || a.ok !== true) {
    if (way === "signin") keepRefused(a);
    /* The reason rides with the sentence, so the sign-in's door can make the fact its heading and mark the step it stopped at. */
    const refused = R.refuse(licenceSaid(a && a.reason));
    refused.said.why = String((a && a.reason) || "unreached");
    throw refused;
  }
  /* An administrator's card (decision 49) brings no licence or grant to take: it is kept as the sign-in's state, `by` "admin", with
     the refresh token's seal for Check now, and nothing of a lead's sign-in or an activation stays beside it. */
  if (way === "signin" && a.admin === true && a.card) { /* plant:admin-act */
    const keep = typeof sealed === "function" ? sealed() : sealed;
    const next = Object.assign({}, readServiceState());
    for (const k of SIGNED_IN_STATE.concat(["keySealed", "keyUnread", "licenceRef"])) delete next[k];
    Object.assign(next, { by: "admin", lead: open.public, checked: now, tried: now, provider: String(provider || ""), adminCard: a.card });
    if (keep && keep.refreshSealed) next.refreshSealed = keep.refreshSealed;
    writeServiceState(next);
    return Object.assign(await licenceNow(), { took: { admin: "kept" } });
  }
  const got = await C.take(a, await licenceCtx(open.public, now));
  if (got.licence !== "kept" && got.grant !== "kept" && got.grant !== "older") throw R.refuse(licenceSaid("untrusted"));
  const next = Object.assign({}, readServiceState(), { by: way, lead: open.public, checked: now, tried: now });
  /* A purchase key sealed by an activation before sign-in is forgotten at a sign-in (the test architect's note 7 on S6); a
     sign-in's refresh token is kept only sealed and only for a sign-in (board 980). */
  delete next.keySealed;
  delete next.keyUnread;
  delete next.refreshSealed;
  delete next.signinAsk;
  delete next.provider;
  const keep = typeof sealed === "function" ? sealed() : sealed;
  /* A sign-in keeps its refresh token's seal for the quiet renewal, which signin/renew binds by this key (decision 15 item 1),
     and who the service said this person is (keepWho). */
  delete next.signinSeed;
  delete next.signinOrg;
  delete next.signinCode;
  delete next.signinOwner;
  delete next.signinWho;
  delete next.signinAccess;
  delete next.licenceRef;
  delete next.signinAskOwner;
  delete next.signinNaming;
  delete next.orgDesks;
  delete next.adminCard;
  delete next.signinCause;
  delete next.seatCerts;
  delete next.signinNoRole;
  delete next.signinBuy;
  delete next.signinManaged;
  delete next.signinNoLicence;
  if (way === "signin") {
    next.provider = String(provider || "");
    if (keep && keep.refreshSealed) next.refreshSealed = keep.refreshSealed;
    /* The organisation its token named, for the hint its desks are given (board 980, stage 3). */
    if (keep && keep.org) next.signinOrg = keep.org;
    /* Who signed in, as a hash, kept only on a managed computer for the same-account rule (decision 49). */
    if (keep && keep.who) next.signinWho = keep.who;
    /* The licence service asked this person for its own access token (decision 49, section 11.11): remembered, a flag and never the
       token, so the next sign-in and every renewal start on the managed path; cleared at sign-out (SIGNED_IN_STATE). */
    if (keep && keep.access === true) next.signinAccess = true;
    Object.assign(next, C.keepWho({}, a));
  }
  writeServiceState(next);
  /* A grant kept goes to every team on the relay at once (src/relay.mjs owesGrant), so a bought trial's team works on. */
  if (got.grant === "kept") relaySync();
  return Object.assign(await licenceNow(), { took: got });
}
answer("studio:licence", async () => guard(async () => licenceNow()));
/* SIGN-IN (board 980, stage 2; src/licence-client.mjs signInFlow). The lead presses a provider in the cover; the shell opens
   that provider's page in the system browser, waits at the loopback for the code, exchanges it through src/wire.cjs and
   signs in at the licence service, all as one act. The page hands over only the provider's name and is handed back what
   licenceNow says, never a token. The page the browser lands on once it comes back says how it ended, in the shell's language. */
/* THE PAGE THE BROWSER LANDS ON after the sign-in, by the landing's kind: [headline, line, tab title], the copywriter's words. */
const SIGNIN_PAGE_WORDS = {
  en: {
    seat: ["Signed in", "This Studio holds its lead seat. Etiuda Studio carries on by itself; this tab can be closed.", "Signed in"],
    noseat: ["Signed in, no seat yet", "Etiuda Studio shows why, and what comes next. This tab can be closed.", "No seat yet"],
    back: ["The sign-in is back with Etiuda Studio", "Etiuda Studio finishes it and shows the result. This tab can be closed.", "Sign-in received"],
    appfail: ["The sign-in could not be finished", "Etiuda Studio shows why. This tab can be closed.", "Not finished"],
    org: ["Not allowed by this organisation", "Its IT department can allow it; meanwhile another account can be tried. This tab can be closed.", "Not allowed"],
    cancelled: ["The sign-in was cancelled", "Nothing was changed. This tab can be closed; signing in can wait until it suits.", "Cancelled"],
    earlier: ["This tab is from an earlier sign-in", "It was not used, and nothing was changed. This tab can be closed.", "An earlier sign-in"],
    foot: "Shown by Etiuda Studio on this computer; this page itself sends nothing anywhere.",
  },
  pl: {
    seat: ["Zalogowano", "To Studio ma już miejsce lidera. Etiuda Studio sama przechodzi dalej; tę kartę można zamknąć.", "Zalogowano"],
    noseat: ["Zalogowano, jeszcze bez miejsca", "Etiuda Studio pokazuje, dlaczego i co dalej. Tę kartę można zamknąć.", "Jeszcze bez miejsca"],
    back: ["Logowanie wróciło do Etiudy Studio", "Etiuda Studio je dokończy i pokaże wynik. Tę kartę można zamknąć.", "Logowanie odebrane"],
    appfail: ["Nie udało się dokończyć logowania", "Etiuda Studio pokazuje, dlaczego. Tę kartę można zamknąć.", "Nie dokończono"],
    org: ["Organizacja nie dopuściła Etiudy", "Może to zmienić jej dział IT. Tymczasem w Etiudzie Studio można użyć innego konta; tę kartę można zamknąć.", "Bez zgody organizacji"],
    cancelled: ["Logowanie anulowano", "Nic się nie zmieniło. Tę kartę można zamknąć; z logowaniem można poczekać do dogodnej chwili.", "Anulowano"],
    earlier: ["To karta wcześniejszego logowania", "Nie została użyta i nic się nie zmieniło. Tę kartę można zamknąć.", "Wcześniejsze logowanie"],
    foot: "Tę stronę wyświetla Etiuda Studio na tym komputerze; sama strona niczego nie wysyła.",
  },
};
/* THE LANDING'S LOOK, its one place: the product designer's variant A (quiet), the page whole from one kind's words. The mark with
   depth is defined once and drawn twice; nothing is fetched or run, and the policy beside the page allows only this style element. */
const SIGNIN_LANDING_MARK = '<defs><mask id="depth" maskUnits="userSpaceOnUse" x="-64" y="-64" width="384" height="384" stroke-linecap="round" fill="none"><line x1="133.02" y1="131.35" x2="128" y2="128" stroke="#666666" stroke-width="21.67"/><line x1="128" y1="128" x2="122.98" y2="124.65" stroke="#666666" stroke-width="21.67"/><line x1="133.02" y1="209.41" x2="128" y2="211.14" stroke="#666666" stroke-width="21.67"/><line x1="128" y1="211.14" x2="122.98" y2="212.76" stroke="#666666" stroke-width="21.67"/><line x1="133.02" y1="43.24" x2="128" y2="44.86" stroke="#666666" stroke-width="21.67"/><line x1="128" y1="44.86" x2="122.98" y2="46.59" stroke="#666666" stroke-width="21.67"/><line x1="122.98" y1="124.65" x2="117.97" y2="121.3" stroke="#666666" stroke-width="21.67"/><line x1="138.03" y1="207.59" x2="133.02" y2="209.41" stroke="#666666" stroke-width="21.67"/><line x1="122.98" y1="212.76" x2="117.97" y2="214.28" stroke="#666666" stroke-width="21.67"/><line x1="138.03" y1="41.72" x2="133.02" y2="43.24" stroke="#666666" stroke-width="21.67"/><line x1="122.98" y1="46.59" x2="117.97" y2="48.41" stroke="#666666" stroke-width="21.67"/><line x1="138.03" y1="134.7" x2="133.02" y2="131.35" stroke="#666666" stroke-width="21.67"/><line x1="117.97" y1="121.3" x2="112.98" y2="117.97" stroke="#666666" stroke-width="21.67"/><line x1="117.97" y1="48.41" x2="112.98" y2="50.33" stroke="#666666" stroke-width="21.67"/><line x1="143.02" y1="138.03" x2="138.03" y2="134.7" stroke="#666666" stroke-width="21.67"/><line x1="143.02" y1="205.67" x2="138.03" y2="207.59" stroke="#666666" stroke-width="21.67"/><line x1="117.97" y1="214.28" x2="112.98" y2="215.7" stroke="#666666" stroke-width="21.67"/><line x1="143.02" y1="40.3" x2="138.03" y2="41.72" stroke="#666666" stroke-width="21.67"/><line x1="112.98" y1="117.97" x2="108.04" y2="114.64" stroke="#666666" stroke-width="21.67"/><line x1="112.98" y1="50.33" x2="108.04" y2="52.35" stroke="#666666" stroke-width="21.67"/><line x1="112.98" y1="215.7" x2="108.04" y2="217.01" stroke="#666666" stroke-width="21.67"/><line x1="147.96" y1="141.36" x2="143.02" y2="138.03" stroke="#666666" stroke-width="21.67"/><line x1="147.96" y1="203.65" x2="143.02" y2="205.67" stroke="#666666" stroke-width="21.67"/><line x1="147.96" y1="38.99" x2="143.02" y2="40.3" stroke="#666666" stroke-width="21.67"/><line x1="108.04" y1="52.35" x2="103.15" y2="54.46" stroke="#666666" stroke-width="21.67"/><line x1="108.04" y1="114.64" x2="103.15" y2="111.33" stroke="#666666" stroke-width="21.67"/><line x1="108.04" y1="217.01" x2="103.15" y2="218.21" stroke="#666666" stroke-width="21.67"/><line x1="152.85" y1="201.54" x2="147.96" y2="203.65" stroke="#666666" stroke-width="21.67"/><line x1="152.85" y1="37.79" x2="147.96" y2="38.99" stroke="#666666" stroke-width="21.67"/><line x1="152.85" y1="144.67" x2="147.96" y2="141.36" stroke="#666666" stroke-width="21.67"/><line x1="103.15" y1="218.21" x2="98.33" y2="219.3" stroke="#666666" stroke-width="21.67"/><line x1="103.15" y1="54.46" x2="98.33" y2="56.66" stroke="#666666" stroke-width="21.67"/><line x1="157.67" y1="199.34" x2="152.85" y2="201.54" stroke="#666666" stroke-width="21.67"/><line x1="157.67" y1="36.7" x2="152.85" y2="37.79" stroke="#666666" stroke-width="21.67"/><line x1="103.15" y1="111.33" x2="98.33" y2="108.04" stroke="#666666" stroke-width="21.67"/><line x1="157.67" y1="147.96" x2="152.85" y2="144.67" stroke="#666666" stroke-width="21.67"/><line x1="98.33" y1="108.04" x2="93.6" y2="104.78" stroke="#666666" stroke-width="21.67"/><line x1="162.4" y1="197.06" x2="157.67" y2="199.34" stroke="#666666" stroke-width="21.67"/><line x1="98.33" y1="219.3" x2="93.6" y2="220.28" stroke="#666666" stroke-width="21.67"/><line x1="98.33" y1="56.66" x2="93.6" y2="58.94" stroke="#666666" stroke-width="21.67"/><line x1="162.4" y1="35.72" x2="157.67" y2="36.7" stroke="#666666" stroke-width="21.67"/><line x1="162.4" y1="151.22" x2="157.67" y2="147.96" stroke="#666666" stroke-width="21.67"/><line x1="93.6" y1="104.78" x2="88.95" y2="101.54" stroke="#676767" stroke-width="21.67"/><line x1="93.6" y1="220.28" x2="88.95" y2="221.15" stroke="#676767" stroke-width="21.67"/><line x1="93.6" y1="58.94" x2="88.95" y2="61.31" stroke="#676767" stroke-width="21.67"/><line x1="167.05" y1="194.69" x2="162.4" y2="197.06" stroke="#676767" stroke-width="21.67"/><line x1="167.05" y1="34.85" x2="162.4" y2="35.72" stroke="#676767" stroke-width="21.67"/><line x1="167.05" y1="154.46" x2="162.4" y2="151.22" stroke="#676767" stroke-width="21.67"/><line x1="88.95" y1="101.54" x2="84.42" y2="98.33" stroke="#676767" stroke-width="21.67"/><line x1="88.95" y1="61.31" x2="84.42" y2="63.76" stroke="#676767" stroke-width="21.67"/><line x1="88.95" y1="221.15" x2="84.42" y2="221.9" stroke="#676767" stroke-width="21.67"/><line x1="171.58" y1="192.24" x2="167.05" y2="194.69" stroke="#676767" stroke-width="21.67"/><line x1="171.58" y1="34.1" x2="167.05" y2="34.85" stroke="#676767" stroke-width="21.67"/><line x1="171.58" y1="157.67" x2="167.05" y2="154.46" stroke="#676767" stroke-width="21.67"/><line x1="84.42" y1="98.33" x2="80" y2="95.17" stroke="#686868" stroke-width="21.67"/><line x1="84.42" y1="63.76" x2="80" y2="66.29" stroke="#686868" stroke-width="21.67"/><line x1="176" y1="33.46" x2="171.58" y2="34.1" stroke="#686868" stroke-width="21.67"/><line x1="84.42" y1="221.9" x2="80" y2="222.54" stroke="#686868" stroke-width="21.67"/><line x1="176" y1="189.71" x2="171.58" y2="192.24" stroke="#686868" stroke-width="21.67"/><line x1="176" y1="160.83" x2="171.58" y2="157.67" stroke="#686868" stroke-width="21.67"/><line x1="80" y1="95.17" x2="75.71" y2="92.04" stroke="#686868" stroke-width="21.67"/><line x1="180.29" y1="163.96" x2="176" y2="160.83" stroke="#686868" stroke-width="21.67"/><line x1="80" y1="222.54" x2="75.71" y2="223.07" stroke="#686868" stroke-width="21.67"/><line x1="180.29" y1="32.93" x2="176" y2="33.46" stroke="#686868" stroke-width="21.67"/><line x1="180.29" y1="187.1" x2="176" y2="189.71" stroke="#686868" stroke-width="21.67"/><line x1="80" y1="66.29" x2="75.71" y2="68.9" stroke="#686868" stroke-width="21.67"/><line x1="75.71" y1="92.04" x2="71.57" y2="88.95" stroke="#696969" stroke-width="21.67"/><line x1="184.43" y1="184.43" x2="180.29" y2="187.1" stroke="#696969" stroke-width="21.67"/><line x1="75.71" y1="223.07" x2="71.57" y2="223.47" stroke="#696969" stroke-width="21.67"/><line x1="184.43" y1="32.53" x2="180.29" y2="32.93" stroke="#696969" stroke-width="21.67"/><line x1="75.71" y1="68.9" x2="71.57" y2="71.57" stroke="#696969" stroke-width="21.67"/><line x1="184.43" y1="167.05" x2="180.29" y2="163.96" stroke="#696969" stroke-width="21.67"/><line x1="71.57" y1="71.57" x2="67.59" y2="74.32" stroke="#6b6b6b" stroke-width="21.67"/><line x1="71.57" y1="88.95" x2="67.59" y2="85.92" stroke="#6b6b6b" stroke-width="21.67"/><line x1="71.57" y1="223.47" x2="67.59" y2="223.77" stroke="#6b6b6b" stroke-width="21.67"/><line x1="188.41" y1="181.68" x2="184.43" y2="184.43" stroke="#6b6b6b" stroke-width="21.67"/><line x1="188.41" y1="32.23" x2="184.43" y2="32.53" stroke="#6b6b6b" stroke-width="21.67"/><line x1="188.41" y1="170.08" x2="184.43" y2="167.05" stroke="#6b6b6b" stroke-width="21.67"/><line x1="67.59" y1="74.32" x2="63.76" y2="77.13" stroke="#6c6c6c" stroke-width="21.67"/><line x1="67.59" y1="223.77" x2="63.76" y2="223.94" stroke="#6c6c6c" stroke-width="21.67"/><line x1="67.59" y1="85.92" x2="63.76" y2="82.93" stroke="#6c6c6c" stroke-width="21.67"/><line x1="192.24" y1="178.87" x2="188.41" y2="181.68" stroke="#6c6c6c" stroke-width="21.67"/><line x1="192.24" y1="173.07" x2="188.41" y2="170.08" stroke="#6c6c6c" stroke-width="21.67"/><line x1="192.24" y1="32.06" x2="188.41" y2="32.23" stroke="#6c6c6c" stroke-width="21.67"/><line x1="63.76" y1="77.13" x2="60.12" y2="80" stroke="#6e6e6e" stroke-width="21.67"/><line x1="195.88" y1="176" x2="192.24" y2="173.07" stroke="#6e6e6e" stroke-width="21.67"/><line x1="63.76" y1="223.94" x2="60.12" y2="224" stroke="#6e6e6e" stroke-width="21.67"/><line x1="195.88" y1="176" x2="192.24" y2="178.87" stroke="#6e6e6e" stroke-width="21.67"/><line x1="63.76" y1="82.93" x2="60.12" y2="80" stroke="#6e6e6e" stroke-width="21.67"/><line x1="195.88" y1="32" x2="192.24" y2="32.06" stroke="#6e6e6e" stroke-width="21.67"/><line x1="60.12" y1="80" x2="56.66" y2="82.93" stroke="#707070" stroke-width="21.67"/><line x1="60.12" y1="224" x2="56.66" y2="223.94" stroke="#707070" stroke-width="21.67"/><line x1="199.34" y1="178.87" x2="195.88" y2="176" stroke="#707070" stroke-width="21.67"/><line x1="199.34" y1="173.07" x2="195.88" y2="176" stroke="#707070" stroke-width="21.67"/><line x1="199.34" y1="32.06" x2="195.88" y2="32" stroke="#707070" stroke-width="21.67"/><line x1="60.12" y1="80" x2="56.66" y2="77.13" stroke="#707070" stroke-width="21.67"/><line x1="56.66" y1="82.93" x2="53.39" y2="85.92" stroke="#727272" stroke-width="21.67"/><line x1="56.66" y1="223.94" x2="53.39" y2="223.77" stroke="#727272" stroke-width="21.67"/><line x1="202.61" y1="32.23" x2="199.34" y2="32.06" stroke="#727272" stroke-width="21.67"/><line x1="202.61" y1="170.08" x2="199.34" y2="173.07" stroke="#727272" stroke-width="21.67"/><line x1="202.61" y1="181.68" x2="199.34" y2="178.87" stroke="#727272" stroke-width="21.67"/><line x1="56.66" y1="77.13" x2="53.39" y2="74.32" stroke="#727272" stroke-width="21.67"/><line x1="53.39" y1="85.92" x2="50.33" y2="88.95" stroke="#757575" stroke-width="21.67"/><line x1="53.39" y1="223.77" x2="50.33" y2="223.47" stroke="#757575" stroke-width="21.67"/><line x1="205.67" y1="167.05" x2="202.61" y2="170.08" stroke="#757575" stroke-width="21.67"/><line x1="205.67" y1="184.43" x2="202.61" y2="181.68" stroke="#757575" stroke-width="21.67"/><line x1="53.39" y1="74.32" x2="50.33" y2="71.57" stroke="#757575" stroke-width="21.67"/><line x1="205.67" y1="32.53" x2="202.61" y2="32.23" stroke="#757575" stroke-width="21.67"/><line x1="50.33" y1="223.47" x2="47.49" y2="223.07" stroke="#787878" stroke-width="21.67"/><line x1="50.33" y1="88.95" x2="47.49" y2="92.04" stroke="#787878" stroke-width="21.67"/><line x1="208.51" y1="163.96" x2="205.67" y2="167.05" stroke="#787878" stroke-width="21.67"/><line x1="208.51" y1="187.1" x2="205.67" y2="184.43" stroke="#787878" stroke-width="21.67"/><line x1="50.33" y1="71.57" x2="47.49" y2="68.9" stroke="#787878" stroke-width="21.67"/><line x1="208.51" y1="32.93" x2="205.67" y2="32.53" stroke="#787878" stroke-width="21.67"/><line x1="47.49" y1="92.04" x2="44.86" y2="95.17" stroke="#7c7c7c" stroke-width="21.67"/><line x1="47.49" y1="223.07" x2="44.86" y2="222.54" stroke="#7c7c7c" stroke-width="21.67"/><line x1="211.14" y1="33.46" x2="208.51" y2="32.93" stroke="#7c7c7c" stroke-width="21.67"/><line x1="211.14" y1="160.83" x2="208.51" y2="163.96" stroke="#7c7c7c" stroke-width="21.67"/><line x1="211.14" y1="189.71" x2="208.51" y2="187.1" stroke="#7c7c7c" stroke-width="21.67"/><line x1="47.49" y1="68.9" x2="44.86" y2="66.29" stroke="#7c7c7c" stroke-width="21.67"/><line x1="44.86" y1="95.17" x2="42.46" y2="98.33" stroke="#808080" stroke-width="21.67"/><line x1="213.54" y1="157.67" x2="211.14" y2="160.83" stroke="#808080" stroke-width="21.67"/><line x1="44.86" y1="222.54" x2="42.46" y2="221.9" stroke="#808080" stroke-width="21.67"/><line x1="213.54" y1="34.1" x2="211.14" y2="33.46" stroke="#808080" stroke-width="21.67"/><line x1="213.54" y1="192.24" x2="211.14" y2="189.71" stroke="#808080" stroke-width="21.67"/><line x1="44.86" y1="66.29" x2="42.46" y2="63.76" stroke="#808080" stroke-width="21.67"/><line x1="42.46" y1="221.9" x2="40.3" y2="221.15" stroke="#848484" stroke-width="21.67"/><line x1="215.7" y1="154.46" x2="213.54" y2="157.67" stroke="#848484" stroke-width="21.67"/><line x1="215.7" y1="34.85" x2="213.54" y2="34.1" stroke="#848484" stroke-width="21.67"/><line x1="42.46" y1="98.33" x2="40.3" y2="101.54" stroke="#848484" stroke-width="21.67"/><line x1="215.7" y1="194.69" x2="213.54" y2="192.24" stroke="#848484" stroke-width="21.67"/><line x1="42.46" y1="63.76" x2="40.3" y2="61.31" stroke="#848484" stroke-width="21.67"/><line x1="40.3" y1="221.15" x2="38.38" y2="220.28" stroke="#898989" stroke-width="21.67"/><line x1="217.62" y1="35.72" x2="215.7" y2="34.85" stroke="#898989" stroke-width="21.67"/><line x1="217.62" y1="151.22" x2="215.7" y2="154.46" stroke="#898989" stroke-width="21.67"/><line x1="40.3" y1="101.54" x2="38.38" y2="104.78" stroke="#898989" stroke-width="21.67"/><line x1="40.3" y1="61.31" x2="38.38" y2="58.94" stroke="#898989" stroke-width="21.67"/><line x1="217.62" y1="197.06" x2="215.7" y2="194.69" stroke="#898989" stroke-width="21.67"/><line x1="38.38" y1="58.94" x2="36.7" y2="56.66" stroke="#8e8e8e" stroke-width="21.67"/><line x1="38.38" y1="104.78" x2="36.7" y2="108.04" stroke="#8e8e8e" stroke-width="21.67"/><line x1="219.3" y1="199.34" x2="217.62" y2="197.06" stroke="#8e8e8e" stroke-width="21.67"/><line x1="38.38" y1="220.28" x2="36.7" y2="219.3" stroke="#8e8e8e" stroke-width="21.67"/><line x1="219.3" y1="147.96" x2="217.62" y2="151.22" stroke="#8e8e8e" stroke-width="21.67"/><line x1="219.3" y1="36.7" x2="217.62" y2="35.72" stroke="#8e8e8e" stroke-width="21.67"/><line x1="36.7" y1="56.66" x2="35.27" y2="54.46" stroke="#939393" stroke-width="21.67"/><line x1="220.73" y1="201.54" x2="219.3" y2="199.34" stroke="#939393" stroke-width="21.67"/><line x1="36.7" y1="108.04" x2="35.27" y2="111.33" stroke="#939393" stroke-width="21.67"/><line x1="36.7" y1="219.3" x2="35.27" y2="218.21" stroke="#939393" stroke-width="21.67"/><line x1="220.73" y1="144.67" x2="219.3" y2="147.96" stroke="#939393" stroke-width="21.67"/><line x1="220.73" y1="37.79" x2="219.3" y2="36.7" stroke="#939393" stroke-width="21.67"/><line x1="35.27" y1="54.46" x2="34.1" y2="52.35" stroke="#989898" stroke-width="21.67"/><line x1="35.27" y1="111.33" x2="34.1" y2="114.64" stroke="#989898" stroke-width="21.67"/><line x1="221.9" y1="141.36" x2="220.73" y2="144.67" stroke="#989898" stroke-width="21.67"/><line x1="221.9" y1="203.65" x2="220.73" y2="201.54" stroke="#989898" stroke-width="21.67"/><line x1="35.27" y1="218.21" x2="34.1" y2="217.01" stroke="#989898" stroke-width="21.67"/><line x1="221.9" y1="38.99" x2="220.73" y2="37.79" stroke="#989898" stroke-width="21.67"/><line x1="34.1" y1="52.35" x2="33.18" y2="50.33" stroke="#9e9e9e" stroke-width="21.67"/><line x1="34.1" y1="114.64" x2="33.18" y2="117.97" stroke="#9e9e9e" stroke-width="21.67"/><line x1="222.82" y1="138.03" x2="221.9" y2="141.36" stroke="#9e9e9e" stroke-width="21.67"/><line x1="34.1" y1="217.01" x2="33.18" y2="215.7" stroke="#9e9e9e" stroke-width="21.67"/><line x1="222.82" y1="40.3" x2="221.9" y2="38.99" stroke="#9e9e9e" stroke-width="21.67"/><line x1="222.82" y1="205.67" x2="221.9" y2="203.65" stroke="#9e9e9e" stroke-width="21.67"/><line x1="33.18" y1="50.33" x2="32.53" y2="48.41" stroke="#a4a4a4" stroke-width="21.67"/><line x1="33.18" y1="117.97" x2="32.53" y2="121.3" stroke="#a4a4a4" stroke-width="21.67"/><line x1="223.47" y1="207.59" x2="222.82" y2="205.67" stroke="#a4a4a4" stroke-width="21.67"/><line x1="33.18" y1="215.7" x2="32.53" y2="214.28" stroke="#a4a4a4" stroke-width="21.67"/><line x1="223.47" y1="41.72" x2="222.82" y2="40.3" stroke="#a4a4a4" stroke-width="21.67"/><line x1="223.47" y1="134.7" x2="222.82" y2="138.03" stroke="#a4a4a4" stroke-width="21.67"/><line x1="32.53" y1="48.41" x2="32.13" y2="46.59" stroke="#aaaaaa" stroke-width="21.67"/><line x1="32.53" y1="121.3" x2="32.13" y2="124.65" stroke="#aaaaaa" stroke-width="21.67"/><line x1="32.53" y1="214.28" x2="32.13" y2="212.76" stroke="#aaaaaa" stroke-width="21.67"/><line x1="223.87" y1="131.35" x2="223.47" y2="134.7" stroke="#aaaaaa" stroke-width="21.67"/><line x1="223.87" y1="43.24" x2="223.47" y2="41.72" stroke="#aaaaaa" stroke-width="21.67"/><line x1="223.87" y1="209.41" x2="223.47" y2="207.59" stroke="#aaaaaa" stroke-width="21.67"/><line x1="32.13" y1="46.59" x2="32" y2="44.86" stroke="#afafaf" stroke-width="21.67"/><line x1="32.13" y1="124.65" x2="32" y2="128" stroke="#afafaf" stroke-width="21.67"/><line x1="32.13" y1="212.76" x2="32" y2="211.14" stroke="#afafaf" stroke-width="21.67"/><line x1="224" y1="128" x2="223.87" y2="131.35" stroke="#afafaf" stroke-width="21.67"/><line x1="224" y1="44.86" x2="223.87" y2="43.24" stroke="#afafaf" stroke-width="21.67"/><line x1="224" y1="211.14" x2="223.87" y2="209.41" stroke="#afafaf" stroke-width="21.67"/><line x1="32" y1="44.86" x2="32.13" y2="43.24" stroke="#b6b6b6" stroke-width="21.67"/><line x1="223.87" y1="124.65" x2="224" y2="128" stroke="#b6b6b6" stroke-width="21.67"/><line x1="32" y1="128" x2="32.13" y2="131.35" stroke="#b6b6b6" stroke-width="21.67"/><line x1="32" y1="211.14" x2="32.13" y2="209.41" stroke="#b6b6b6" stroke-width="21.67"/><line x1="223.87" y1="46.59" x2="224" y2="44.86" stroke="#b6b6b6" stroke-width="21.67"/><line x1="223.87" y1="212.76" x2="224" y2="211.14" stroke="#b6b6b6" stroke-width="21.67"/><line x1="32.13" y1="43.24" x2="32.53" y2="41.72" stroke="#bbbbbb" stroke-width="21.67"/><line x1="223.47" y1="121.3" x2="223.87" y2="124.65" stroke="#bbbbbb" stroke-width="21.67"/><line x1="32.13" y1="209.41" x2="32.53" y2="207.59" stroke="#bbbbbb" stroke-width="21.67"/><line x1="32.13" y1="131.35" x2="32.53" y2="134.7" stroke="#bbbbbb" stroke-width="21.67"/><line x1="223.47" y1="48.41" x2="223.87" y2="46.59" stroke="#bbbbbb" stroke-width="21.67"/><line x1="223.47" y1="214.28" x2="223.87" y2="212.76" stroke="#bbbbbb" stroke-width="21.67"/><line x1="32.53" y1="41.72" x2="33.18" y2="40.3" stroke="#c1c1c1" stroke-width="21.67"/><line x1="32.53" y1="134.7" x2="33.18" y2="138.03" stroke="#c1c1c1" stroke-width="21.67"/><line x1="32.53" y1="207.59" x2="33.18" y2="205.67" stroke="#c1c1c1" stroke-width="21.67"/><line x1="222.82" y1="117.97" x2="223.47" y2="121.3" stroke="#c1c1c1" stroke-width="21.67"/><line x1="222.82" y1="215.7" x2="223.47" y2="214.28" stroke="#c1c1c1" stroke-width="21.67"/><line x1="222.82" y1="50.33" x2="223.47" y2="48.41" stroke="#c1c1c1" stroke-width="21.67"/><line x1="33.18" y1="40.3" x2="34.1" y2="38.99" stroke="#c7c7c7" stroke-width="21.67"/><line x1="33.18" y1="138.03" x2="34.1" y2="141.36" stroke="#c7c7c7" stroke-width="21.67"/><line x1="33.18" y1="205.67" x2="34.1" y2="203.65" stroke="#c7c7c7" stroke-width="21.67"/><line x1="221.9" y1="52.35" x2="222.82" y2="50.33" stroke="#c7c7c7" stroke-width="21.67"/><line x1="221.9" y1="114.64" x2="222.82" y2="117.97" stroke="#c7c7c7" stroke-width="21.67"/><line x1="221.9" y1="217.01" x2="222.82" y2="215.7" stroke="#c7c7c7" stroke-width="21.67"/><line x1="34.1" y1="38.99" x2="35.27" y2="37.79" stroke="#cdcdcd" stroke-width="21.67"/><line x1="34.1" y1="141.36" x2="35.27" y2="144.67" stroke="#cdcdcd" stroke-width="21.67"/><line x1="34.1" y1="203.65" x2="35.27" y2="201.54" stroke="#cdcdcd" stroke-width="21.67"/><line x1="220.73" y1="54.46" x2="221.9" y2="52.35" stroke="#cdcdcd" stroke-width="21.67"/><line x1="220.73" y1="111.33" x2="221.9" y2="114.64" stroke="#cdcdcd" stroke-width="21.67"/><line x1="220.73" y1="218.21" x2="221.9" y2="217.01" stroke="#cdcdcd" stroke-width="21.67"/><line x1="35.27" y1="37.79" x2="36.7" y2="36.7" stroke="#d2d2d2" stroke-width="21.67"/><line x1="35.27" y1="144.67" x2="36.7" y2="147.96" stroke="#d2d2d2" stroke-width="21.67"/><line x1="35.27" y1="201.54" x2="36.7" y2="199.34" stroke="#d2d2d2" stroke-width="21.67"/><line x1="219.3" y1="56.66" x2="220.73" y2="54.46" stroke="#d2d2d2" stroke-width="21.67"/><line x1="219.3" y1="108.04" x2="220.73" y2="111.33" stroke="#d2d2d2" stroke-width="21.67"/><line x1="219.3" y1="219.3" x2="220.73" y2="218.21" stroke="#d2d2d2" stroke-width="21.67"/><line x1="36.7" y1="36.7" x2="38.38" y2="35.72" stroke="#d7d7d7" stroke-width="21.67"/><line x1="217.62" y1="220.28" x2="219.3" y2="219.3" stroke="#d7d7d7" stroke-width="21.67"/><line x1="36.7" y1="199.34" x2="38.38" y2="197.06" stroke="#d7d7d7" stroke-width="21.67"/><line x1="217.62" y1="58.94" x2="219.3" y2="56.66" stroke="#d7d7d7" stroke-width="21.67"/><line x1="36.7" y1="147.96" x2="38.38" y2="151.22" stroke="#d7d7d7" stroke-width="21.67"/><line x1="217.62" y1="104.78" x2="219.3" y2="108.04" stroke="#d7d7d7" stroke-width="21.67"/><line x1="215.7" y1="221.15" x2="217.62" y2="220.28" stroke="#dcdcdc" stroke-width="21.67"/><line x1="38.38" y1="35.72" x2="40.3" y2="34.85" stroke="#dcdcdc" stroke-width="21.67"/><line x1="38.38" y1="197.06" x2="40.3" y2="194.69" stroke="#dcdcdc" stroke-width="21.67"/><line x1="215.7" y1="61.31" x2="217.62" y2="58.94" stroke="#dcdcdc" stroke-width="21.67"/><line x1="38.38" y1="151.22" x2="40.3" y2="154.46" stroke="#dcdcdc" stroke-width="21.67"/><line x1="215.7" y1="101.54" x2="217.62" y2="104.78" stroke="#dcdcdc" stroke-width="21.67"/><line x1="40.3" y1="154.46" x2="42.46" y2="157.67" stroke="#e1e1e1" stroke-width="21.67"/><line x1="213.54" y1="221.9" x2="215.7" y2="221.15" stroke="#e1e1e1" stroke-width="21.67"/><line x1="40.3" y1="194.69" x2="42.46" y2="192.24" stroke="#e1e1e1" stroke-width="21.67"/><line x1="40.3" y1="34.85" x2="42.46" y2="34.1" stroke="#e1e1e1" stroke-width="21.67"/><line x1="213.54" y1="63.76" x2="215.7" y2="61.31" stroke="#e1e1e1" stroke-width="21.67"/><line x1="213.54" y1="98.33" x2="215.7" y2="101.54" stroke="#e1e1e1" stroke-width="21.67"/><line x1="42.46" y1="157.67" x2="44.86" y2="160.83" stroke="#e5e5e5" stroke-width="21.67"/><line x1="211.14" y1="222.54" x2="213.54" y2="221.9" stroke="#e5e5e5" stroke-width="21.67"/><line x1="42.46" y1="192.24" x2="44.86" y2="189.71" stroke="#e5e5e5" stroke-width="21.67"/><line x1="211.14" y1="66.29" x2="213.54" y2="63.76" stroke="#e5e5e5" stroke-width="21.67"/><line x1="42.46" y1="34.1" x2="44.86" y2="33.46" stroke="#e5e5e5" stroke-width="21.67"/><line x1="211.14" y1="95.17" x2="213.54" y2="98.33" stroke="#e5e5e5" stroke-width="21.67"/><line x1="44.86" y1="189.71" x2="47.49" y2="187.1" stroke="#e9e9e9" stroke-width="21.67"/><line x1="44.86" y1="160.83" x2="47.49" y2="163.96" stroke="#e9e9e9" stroke-width="21.67"/><line x1="208.51" y1="68.9" x2="211.14" y2="66.29" stroke="#e9e9e9" stroke-width="21.67"/><line x1="44.86" y1="33.46" x2="47.49" y2="32.93" stroke="#e9e9e9" stroke-width="21.67"/><line x1="208.51" y1="223.07" x2="211.14" y2="222.54" stroke="#e9e9e9" stroke-width="21.67"/><line x1="208.51" y1="92.04" x2="211.14" y2="95.17" stroke="#e9e9e9" stroke-width="21.67"/><line x1="47.49" y1="163.96" x2="50.33" y2="167.05" stroke="#ededed" stroke-width="21.67"/><line x1="47.49" y1="187.1" x2="50.33" y2="184.43" stroke="#ededed" stroke-width="21.67"/><line x1="205.67" y1="71.57" x2="208.51" y2="68.9" stroke="#ededed" stroke-width="21.67"/><line x1="47.49" y1="32.93" x2="50.33" y2="32.53" stroke="#ededed" stroke-width="21.67"/><line x1="205.67" y1="223.47" x2="208.51" y2="223.07" stroke="#ededed" stroke-width="21.67"/><line x1="205.67" y1="88.95" x2="208.51" y2="92.04" stroke="#ededed" stroke-width="21.67"/><line x1="50.33" y1="167.05" x2="53.39" y2="170.08" stroke="#f0f0f0" stroke-width="21.67"/><line x1="50.33" y1="184.43" x2="53.39" y2="181.68" stroke="#f0f0f0" stroke-width="21.67"/><line x1="202.61" y1="74.32" x2="205.67" y2="71.57" stroke="#f0f0f0" stroke-width="21.67"/><line x1="202.61" y1="223.77" x2="205.67" y2="223.47" stroke="#f0f0f0" stroke-width="21.67"/><line x1="50.33" y1="32.53" x2="53.39" y2="32.23" stroke="#f0f0f0" stroke-width="21.67"/><line x1="202.61" y1="85.92" x2="205.67" y2="88.95" stroke="#f0f0f0" stroke-width="21.67"/><line x1="53.39" y1="170.08" x2="56.66" y2="173.07" stroke="#f3f3f3" stroke-width="21.67"/><line x1="53.39" y1="181.68" x2="56.66" y2="178.87" stroke="#f3f3f3" stroke-width="21.67"/><line x1="199.34" y1="77.13" x2="202.61" y2="74.32" stroke="#f3f3f3" stroke-width="21.67"/><line x1="199.34" y1="223.94" x2="202.61" y2="223.77" stroke="#f3f3f3" stroke-width="21.67"/><line x1="53.39" y1="32.23" x2="56.66" y2="32.06" stroke="#f3f3f3" stroke-width="21.67"/><line x1="199.34" y1="82.93" x2="202.61" y2="85.92" stroke="#f3f3f3" stroke-width="21.67"/><line x1="56.66" y1="173.07" x2="60.12" y2="176" stroke="#f5f5f5" stroke-width="21.67"/><line x1="195.88" y1="80" x2="199.34" y2="82.93" stroke="#f5f5f5" stroke-width="21.67"/><line x1="56.66" y1="178.87" x2="60.12" y2="176" stroke="#f5f5f5" stroke-width="21.67"/><line x1="195.88" y1="80" x2="199.34" y2="77.13" stroke="#f5f5f5" stroke-width="21.67"/><line x1="195.88" y1="224" x2="199.34" y2="223.94" stroke="#f5f5f5" stroke-width="21.67"/><line x1="56.66" y1="32.06" x2="60.12" y2="32" stroke="#f5f5f5" stroke-width="21.67"/><line x1="192.24" y1="77.13" x2="195.88" y2="80" stroke="#f7f7f7" stroke-width="21.67"/><line x1="60.12" y1="176" x2="63.76" y2="178.87" stroke="#f7f7f7" stroke-width="21.67"/><line x1="60.12" y1="176" x2="63.76" y2="173.07" stroke="#f7f7f7" stroke-width="21.67"/><line x1="192.24" y1="82.93" x2="195.88" y2="80" stroke="#f7f7f7" stroke-width="21.67"/><line x1="192.24" y1="223.94" x2="195.88" y2="224" stroke="#f7f7f7" stroke-width="21.67"/><line x1="60.12" y1="32" x2="63.76" y2="32.06" stroke="#f7f7f7" stroke-width="21.67"/><line x1="63.76" y1="32.06" x2="67.59" y2="32.23" stroke="#f9f9f9" stroke-width="21.67"/><line x1="63.76" y1="178.87" x2="67.59" y2="181.68" stroke="#f9f9f9" stroke-width="21.67"/><line x1="63.76" y1="173.07" x2="67.59" y2="170.08" stroke="#f9f9f9" stroke-width="21.67"/><line x1="188.41" y1="223.77" x2="192.24" y2="223.94" stroke="#f9f9f9" stroke-width="21.67"/><line x1="188.41" y1="74.32" x2="192.24" y2="77.13" stroke="#f9f9f9" stroke-width="21.67"/><line x1="188.41" y1="85.92" x2="192.24" y2="82.93" stroke="#f9f9f9" stroke-width="21.67"/><line x1="67.59" y1="32.23" x2="71.57" y2="32.53" stroke="#fafafa" stroke-width="21.67"/><line x1="67.59" y1="170.08" x2="71.57" y2="167.05" stroke="#fafafa" stroke-width="21.67"/><line x1="184.43" y1="223.47" x2="188.41" y2="223.77" stroke="#fafafa" stroke-width="21.67"/><line x1="184.43" y1="88.95" x2="188.41" y2="85.92" stroke="#fafafa" stroke-width="21.67"/><line x1="184.43" y1="71.57" x2="188.41" y2="74.32" stroke="#fafafa" stroke-width="21.67"/><line x1="67.59" y1="181.68" x2="71.57" y2="184.43" stroke="#fafafa" stroke-width="21.67"/><line x1="180.29" y1="68.9" x2="184.43" y2="71.57" stroke="#fcfcfc" stroke-width="21.67"/><line x1="71.57" y1="32.53" x2="75.71" y2="32.93" stroke="#fcfcfc" stroke-width="21.67"/><line x1="180.29" y1="223.07" x2="184.43" y2="223.47" stroke="#fcfcfc" stroke-width="21.67"/><line x1="71.57" y1="167.05" x2="75.71" y2="163.96" stroke="#fcfcfc" stroke-width="21.67"/><line x1="180.29" y1="92.04" x2="184.43" y2="88.95" stroke="#fcfcfc" stroke-width="21.67"/><line x1="71.57" y1="184.43" x2="75.71" y2="187.1" stroke="#fcfcfc" stroke-width="21.67"/><line x1="176" y1="222.54" x2="180.29" y2="223.07" stroke="#fdfdfd" stroke-width="21.67"/><line x1="75.71" y1="163.96" x2="80" y2="160.83" stroke="#fdfdfd" stroke-width="21.67"/><line x1="75.71" y1="32.93" x2="80" y2="33.46" stroke="#fdfdfd" stroke-width="21.67"/><line x1="75.71" y1="187.1" x2="80" y2="189.71" stroke="#fdfdfd" stroke-width="21.67"/><line x1="176" y1="95.17" x2="180.29" y2="92.04" stroke="#fdfdfd" stroke-width="21.67"/><line x1="176" y1="66.29" x2="180.29" y2="68.9" stroke="#fdfdfd" stroke-width="21.67"/><line x1="80" y1="160.83" x2="84.42" y2="157.67" stroke="#fdfdfd" stroke-width="21.67"/><line x1="171.58" y1="98.33" x2="176" y2="95.17" stroke="#fdfdfd" stroke-width="21.67"/><line x1="80" y1="33.46" x2="84.42" y2="34.1" stroke="#fdfdfd" stroke-width="21.67"/><line x1="80" y1="189.71" x2="84.42" y2="192.24" stroke="#fdfdfd" stroke-width="21.67"/><line x1="171.58" y1="221.9" x2="176" y2="222.54" stroke="#fdfdfd" stroke-width="21.67"/><line x1="171.58" y1="63.76" x2="176" y2="66.29" stroke="#fdfdfd" stroke-width="21.67"/><line x1="167.05" y1="61.31" x2="171.58" y2="63.76" stroke="#fefefe" stroke-width="21.67"/><line x1="84.42" y1="192.24" x2="88.95" y2="194.69" stroke="#fefefe" stroke-width="21.67"/><line x1="84.42" y1="157.67" x2="88.95" y2="154.46" stroke="#fefefe" stroke-width="21.67"/><line x1="167.05" y1="101.54" x2="171.58" y2="98.33" stroke="#fefefe" stroke-width="21.67"/><line x1="167.05" y1="221.15" x2="171.58" y2="221.9" stroke="#fefefe" stroke-width="21.67"/><line x1="84.42" y1="34.1" x2="88.95" y2="34.85" stroke="#fefefe" stroke-width="21.67"/><line x1="162.4" y1="58.94" x2="167.05" y2="61.31" stroke="#fefefe" stroke-width="21.67"/><line x1="88.95" y1="194.69" x2="93.6" y2="197.06" stroke="#fefefe" stroke-width="21.67"/><line x1="88.95" y1="154.46" x2="93.6" y2="151.22" stroke="#fefefe" stroke-width="21.67"/><line x1="162.4" y1="104.78" x2="167.05" y2="101.54" stroke="#fefefe" stroke-width="21.67"/><line x1="88.95" y1="34.85" x2="93.6" y2="35.72" stroke="#fefefe" stroke-width="21.67"/><line x1="162.4" y1="220.28" x2="167.05" y2="221.15" stroke="#fefefe" stroke-width="21.67"/><line x1="93.6" y1="35.72" x2="98.33" y2="36.7" stroke="#ffffff" stroke-width="21.67"/><line x1="157.67" y1="56.66" x2="162.4" y2="58.94" stroke="#ffffff" stroke-width="21.67"/><line x1="93.6" y1="197.06" x2="98.33" y2="199.34" stroke="#ffffff" stroke-width="21.67"/><line x1="93.6" y1="151.22" x2="98.33" y2="147.96" stroke="#ffffff" stroke-width="21.67"/><line x1="157.67" y1="108.04" x2="162.4" y2="104.78" stroke="#ffffff" stroke-width="21.67"/><line x1="157.67" y1="219.3" x2="162.4" y2="220.28" stroke="#ffffff" stroke-width="21.67"/><line x1="98.33" y1="36.7" x2="103.15" y2="37.79" stroke="#ffffff" stroke-width="21.67"/><line x1="152.85" y1="54.46" x2="157.67" y2="56.66" stroke="#ffffff" stroke-width="21.67"/><line x1="98.33" y1="147.96" x2="103.15" y2="144.67" stroke="#ffffff" stroke-width="21.67"/><line x1="98.33" y1="199.34" x2="103.15" y2="201.54" stroke="#ffffff" stroke-width="21.67"/><line x1="152.85" y1="111.33" x2="157.67" y2="108.04" stroke="#ffffff" stroke-width="21.67"/><line x1="152.85" y1="218.21" x2="157.67" y2="219.3" stroke="#ffffff" stroke-width="21.67"/><line x1="103.15" y1="37.79" x2="108.04" y2="38.99" stroke="#ffffff" stroke-width="21.67"/><line x1="103.15" y1="201.54" x2="108.04" y2="203.65" stroke="#ffffff" stroke-width="21.67"/><line x1="147.96" y1="52.35" x2="152.85" y2="54.46" stroke="#ffffff" stroke-width="21.67"/><line x1="103.15" y1="144.67" x2="108.04" y2="141.36" stroke="#ffffff" stroke-width="21.67"/><line x1="147.96" y1="114.64" x2="152.85" y2="111.33" stroke="#ffffff" stroke-width="21.67"/><line x1="147.96" y1="217.01" x2="152.85" y2="218.21" stroke="#ffffff" stroke-width="21.67"/><line x1="108.04" y1="38.99" x2="112.98" y2="40.3" stroke="#ffffff" stroke-width="21.67"/><line x1="108.04" y1="203.65" x2="112.98" y2="205.67" stroke="#ffffff" stroke-width="21.67"/><line x1="143.02" y1="50.33" x2="147.96" y2="52.35" stroke="#ffffff" stroke-width="21.67"/><line x1="108.04" y1="141.36" x2="112.98" y2="138.03" stroke="#ffffff" stroke-width="21.67"/><line x1="143.02" y1="117.97" x2="147.96" y2="114.64" stroke="#ffffff" stroke-width="21.67"/><line x1="143.02" y1="215.7" x2="147.96" y2="217.01" stroke="#ffffff" stroke-width="21.67"/><line x1="112.98" y1="40.3" x2="117.97" y2="41.72" stroke="#ffffff" stroke-width="21.67"/><line x1="112.98" y1="138.03" x2="117.97" y2="134.7" stroke="#ffffff" stroke-width="21.67"/><line x1="112.98" y1="205.67" x2="117.97" y2="207.59" stroke="#ffffff" stroke-width="21.67"/><line x1="138.03" y1="48.41" x2="143.02" y2="50.33" stroke="#ffffff" stroke-width="21.67"/><line x1="138.03" y1="121.3" x2="143.02" y2="117.97" stroke="#ffffff" stroke-width="21.67"/><line x1="138.03" y1="214.28" x2="143.02" y2="215.7" stroke="#ffffff" stroke-width="21.67"/><line x1="117.97" y1="41.72" x2="122.98" y2="43.24" stroke="#ffffff" stroke-width="21.67"/><line x1="117.97" y1="134.7" x2="122.98" y2="131.35" stroke="#ffffff" stroke-width="21.67"/><line x1="133.02" y1="124.65" x2="138.03" y2="121.3" stroke="#ffffff" stroke-width="21.67"/><line x1="117.97" y1="207.59" x2="122.98" y2="209.41" stroke="#ffffff" stroke-width="21.67"/><line x1="133.02" y1="212.76" x2="138.03" y2="214.28" stroke="#ffffff" stroke-width="21.67"/><line x1="133.02" y1="46.59" x2="138.03" y2="48.41" stroke="#ffffff" stroke-width="21.67"/><line x1="122.98" y1="131.35" x2="128" y2="128" stroke="#ffffff" stroke-width="21.67"/><line x1="128" y1="128" x2="133.02" y2="124.65" stroke="#ffffff" stroke-width="21.67"/><line x1="128" y1="211.14" x2="133.02" y2="212.76" stroke="#ffffff" stroke-width="21.67"/><line x1="122.98" y1="43.24" x2="128" y2="44.86" stroke="#ffffff" stroke-width="21.67"/><line x1="122.98" y1="209.41" x2="128" y2="211.14" stroke="#ffffff" stroke-width="21.67"/><line x1="128" y1="44.86" x2="133.02" y2="46.59" stroke="#ffffff" stroke-width="21.67"/><line x1="133.02" y1="131.35" x2="128" y2="128" stroke="#666666" stroke-width="20"/><line x1="128" y1="128" x2="122.98" y2="124.65" stroke="#666666" stroke-width="20"/><line x1="133.02" y1="209.41" x2="128" y2="211.14" stroke="#666666" stroke-width="20"/><line x1="128" y1="211.14" x2="122.98" y2="212.76" stroke="#666666" stroke-width="20"/><line x1="133.02" y1="43.24" x2="128" y2="44.86" stroke="#666666" stroke-width="20"/><line x1="128" y1="44.86" x2="122.98" y2="46.59" stroke="#666666" stroke-width="20"/><line x1="122.98" y1="124.65" x2="117.97" y2="121.3" stroke="#666666" stroke-width="20"/><line x1="138.03" y1="207.59" x2="133.02" y2="209.41" stroke="#666666" stroke-width="20"/><line x1="122.98" y1="212.76" x2="117.97" y2="214.28" stroke="#666666" stroke-width="20"/><line x1="138.03" y1="41.72" x2="133.02" y2="43.24" stroke="#666666" stroke-width="20"/><line x1="122.98" y1="46.59" x2="117.97" y2="48.41" stroke="#666666" stroke-width="20"/><line x1="138.03" y1="134.7" x2="133.02" y2="131.35" stroke="#666666" stroke-width="20"/><line x1="117.97" y1="121.3" x2="112.98" y2="117.97" stroke="#666666" stroke-width="20"/><line x1="117.97" y1="48.41" x2="112.98" y2="50.33" stroke="#666666" stroke-width="20"/><line x1="143.02" y1="138.03" x2="138.03" y2="134.7" stroke="#666666" stroke-width="20"/><line x1="143.02" y1="205.67" x2="138.03" y2="207.59" stroke="#666666" stroke-width="20"/><line x1="117.97" y1="214.28" x2="112.98" y2="215.7" stroke="#666666" stroke-width="20"/><line x1="143.02" y1="40.3" x2="138.03" y2="41.72" stroke="#666666" stroke-width="20"/><line x1="112.98" y1="117.97" x2="108.04" y2="114.64" stroke="#666666" stroke-width="20"/><line x1="112.98" y1="50.33" x2="108.04" y2="52.35" stroke="#666666" stroke-width="20"/><line x1="112.98" y1="215.7" x2="108.04" y2="217.01" stroke="#666666" stroke-width="20"/><line x1="147.96" y1="141.36" x2="143.02" y2="138.03" stroke="#666666" stroke-width="20"/><line x1="147.96" y1="203.65" x2="143.02" y2="205.67" stroke="#666666" stroke-width="20"/><line x1="147.96" y1="38.99" x2="143.02" y2="40.3" stroke="#666666" stroke-width="20"/><line x1="108.04" y1="52.35" x2="103.15" y2="54.46" stroke="#666666" stroke-width="20"/><line x1="108.04" y1="114.64" x2="103.15" y2="111.33" stroke="#666666" stroke-width="20"/><line x1="108.04" y1="217.01" x2="103.15" y2="218.21" stroke="#666666" stroke-width="20"/><line x1="152.85" y1="201.54" x2="147.96" y2="203.65" stroke="#666666" stroke-width="20"/><line x1="152.85" y1="37.79" x2="147.96" y2="38.99" stroke="#666666" stroke-width="20"/><line x1="152.85" y1="144.67" x2="147.96" y2="141.36" stroke="#666666" stroke-width="20"/><line x1="103.15" y1="218.21" x2="98.33" y2="219.3" stroke="#666666" stroke-width="20"/><line x1="103.15" y1="54.46" x2="98.33" y2="56.66" stroke="#666666" stroke-width="20"/><line x1="157.67" y1="199.34" x2="152.85" y2="201.54" stroke="#666666" stroke-width="20"/><line x1="157.67" y1="36.7" x2="152.85" y2="37.79" stroke="#666666" stroke-width="20"/><line x1="103.15" y1="111.33" x2="98.33" y2="108.04" stroke="#666666" stroke-width="20"/><line x1="157.67" y1="147.96" x2="152.85" y2="144.67" stroke="#666666" stroke-width="20"/><line x1="98.33" y1="108.04" x2="93.6" y2="104.78" stroke="#666666" stroke-width="20"/><line x1="162.4" y1="197.06" x2="157.67" y2="199.34" stroke="#666666" stroke-width="20"/><line x1="98.33" y1="219.3" x2="93.6" y2="220.28" stroke="#666666" stroke-width="20"/><line x1="98.33" y1="56.66" x2="93.6" y2="58.94" stroke="#666666" stroke-width="20"/><line x1="162.4" y1="35.72" x2="157.67" y2="36.7" stroke="#666666" stroke-width="20"/><line x1="162.4" y1="151.22" x2="157.67" y2="147.96" stroke="#666666" stroke-width="20"/><line x1="93.6" y1="104.78" x2="88.95" y2="101.54" stroke="#676767" stroke-width="20"/><line x1="93.6" y1="220.28" x2="88.95" y2="221.15" stroke="#676767" stroke-width="20"/><line x1="93.6" y1="58.94" x2="88.95" y2="61.31" stroke="#676767" stroke-width="20"/><line x1="167.05" y1="194.69" x2="162.4" y2="197.06" stroke="#676767" stroke-width="20"/><line x1="167.05" y1="34.85" x2="162.4" y2="35.72" stroke="#676767" stroke-width="20"/><line x1="167.05" y1="154.46" x2="162.4" y2="151.22" stroke="#676767" stroke-width="20"/><line x1="88.95" y1="101.54" x2="84.42" y2="98.33" stroke="#676767" stroke-width="20"/><line x1="88.95" y1="61.31" x2="84.42" y2="63.76" stroke="#676767" stroke-width="20"/><line x1="88.95" y1="221.15" x2="84.42" y2="221.9" stroke="#676767" stroke-width="20"/><line x1="171.58" y1="192.24" x2="167.05" y2="194.69" stroke="#676767" stroke-width="20"/><line x1="171.58" y1="34.1" x2="167.05" y2="34.85" stroke="#676767" stroke-width="20"/><line x1="171.58" y1="157.67" x2="167.05" y2="154.46" stroke="#676767" stroke-width="20"/><line x1="84.42" y1="98.33" x2="80" y2="95.17" stroke="#686868" stroke-width="20"/><line x1="84.42" y1="63.76" x2="80" y2="66.29" stroke="#686868" stroke-width="20"/><line x1="176" y1="33.46" x2="171.58" y2="34.1" stroke="#686868" stroke-width="20"/><line x1="84.42" y1="221.9" x2="80" y2="222.54" stroke="#686868" stroke-width="20"/><line x1="176" y1="189.71" x2="171.58" y2="192.24" stroke="#686868" stroke-width="20"/><line x1="176" y1="160.83" x2="171.58" y2="157.67" stroke="#686868" stroke-width="20"/><line x1="80" y1="95.17" x2="75.71" y2="92.04" stroke="#686868" stroke-width="20"/><line x1="180.29" y1="163.96" x2="176" y2="160.83" stroke="#686868" stroke-width="20"/><line x1="80" y1="222.54" x2="75.71" y2="223.07" stroke="#686868" stroke-width="20"/><line x1="180.29" y1="32.93" x2="176" y2="33.46" stroke="#686868" stroke-width="20"/><line x1="180.29" y1="187.1" x2="176" y2="189.71" stroke="#686868" stroke-width="20"/><line x1="80" y1="66.29" x2="75.71" y2="68.9" stroke="#686868" stroke-width="20"/><line x1="75.71" y1="92.04" x2="71.57" y2="88.95" stroke="#696969" stroke-width="20"/><line x1="184.43" y1="184.43" x2="180.29" y2="187.1" stroke="#696969" stroke-width="20"/><line x1="75.71" y1="223.07" x2="71.57" y2="223.47" stroke="#696969" stroke-width="20"/><line x1="184.43" y1="32.53" x2="180.29" y2="32.93" stroke="#696969" stroke-width="20"/><line x1="75.71" y1="68.9" x2="71.57" y2="71.57" stroke="#696969" stroke-width="20"/><line x1="184.43" y1="167.05" x2="180.29" y2="163.96" stroke="#696969" stroke-width="20"/><line x1="71.57" y1="71.57" x2="67.59" y2="74.32" stroke="#6b6b6b" stroke-width="20"/><line x1="71.57" y1="88.95" x2="67.59" y2="85.92" stroke="#6b6b6b" stroke-width="20"/><line x1="71.57" y1="223.47" x2="67.59" y2="223.77" stroke="#6b6b6b" stroke-width="20"/><line x1="188.41" y1="181.68" x2="184.43" y2="184.43" stroke="#6b6b6b" stroke-width="20"/><line x1="188.41" y1="32.23" x2="184.43" y2="32.53" stroke="#6b6b6b" stroke-width="20"/><line x1="188.41" y1="170.08" x2="184.43" y2="167.05" stroke="#6b6b6b" stroke-width="20"/><line x1="67.59" y1="74.32" x2="63.76" y2="77.13" stroke="#6c6c6c" stroke-width="20"/><line x1="67.59" y1="223.77" x2="63.76" y2="223.94" stroke="#6c6c6c" stroke-width="20"/><line x1="67.59" y1="85.92" x2="63.76" y2="82.93" stroke="#6c6c6c" stroke-width="20"/><line x1="192.24" y1="178.87" x2="188.41" y2="181.68" stroke="#6c6c6c" stroke-width="20"/><line x1="192.24" y1="173.07" x2="188.41" y2="170.08" stroke="#6c6c6c" stroke-width="20"/><line x1="192.24" y1="32.06" x2="188.41" y2="32.23" stroke="#6c6c6c" stroke-width="20"/><line x1="63.76" y1="77.13" x2="60.12" y2="80" stroke="#6e6e6e" stroke-width="20"/><line x1="195.88" y1="176" x2="192.24" y2="173.07" stroke="#6e6e6e" stroke-width="20"/><line x1="63.76" y1="223.94" x2="60.12" y2="224" stroke="#6e6e6e" stroke-width="20"/><line x1="195.88" y1="176" x2="192.24" y2="178.87" stroke="#6e6e6e" stroke-width="20"/><line x1="63.76" y1="82.93" x2="60.12" y2="80" stroke="#6e6e6e" stroke-width="20"/><line x1="195.88" y1="32" x2="192.24" y2="32.06" stroke="#6e6e6e" stroke-width="20"/><line x1="60.12" y1="80" x2="56.66" y2="82.93" stroke="#707070" stroke-width="20"/><line x1="60.12" y1="224" x2="56.66" y2="223.94" stroke="#707070" stroke-width="20"/><line x1="199.34" y1="178.87" x2="195.88" y2="176" stroke="#707070" stroke-width="20"/><line x1="199.34" y1="173.07" x2="195.88" y2="176" stroke="#707070" stroke-width="20"/><line x1="199.34" y1="32.06" x2="195.88" y2="32" stroke="#707070" stroke-width="20"/><line x1="60.12" y1="80" x2="56.66" y2="77.13" stroke="#707070" stroke-width="20"/><line x1="56.66" y1="82.93" x2="53.39" y2="85.92" stroke="#727272" stroke-width="20"/><line x1="56.66" y1="223.94" x2="53.39" y2="223.77" stroke="#727272" stroke-width="20"/><line x1="202.61" y1="32.23" x2="199.34" y2="32.06" stroke="#727272" stroke-width="20"/><line x1="202.61" y1="170.08" x2="199.34" y2="173.07" stroke="#727272" stroke-width="20"/><line x1="202.61" y1="181.68" x2="199.34" y2="178.87" stroke="#727272" stroke-width="20"/><line x1="56.66" y1="77.13" x2="53.39" y2="74.32" stroke="#727272" stroke-width="20"/><line x1="53.39" y1="85.92" x2="50.33" y2="88.95" stroke="#757575" stroke-width="20"/><line x1="53.39" y1="223.77" x2="50.33" y2="223.47" stroke="#757575" stroke-width="20"/><line x1="205.67" y1="167.05" x2="202.61" y2="170.08" stroke="#757575" stroke-width="20"/><line x1="205.67" y1="184.43" x2="202.61" y2="181.68" stroke="#757575" stroke-width="20"/><line x1="53.39" y1="74.32" x2="50.33" y2="71.57" stroke="#757575" stroke-width="20"/><line x1="205.67" y1="32.53" x2="202.61" y2="32.23" stroke="#757575" stroke-width="20"/><line x1="50.33" y1="223.47" x2="47.49" y2="223.07" stroke="#787878" stroke-width="20"/><line x1="50.33" y1="88.95" x2="47.49" y2="92.04" stroke="#787878" stroke-width="20"/><line x1="208.51" y1="163.96" x2="205.67" y2="167.05" stroke="#787878" stroke-width="20"/><line x1="208.51" y1="187.1" x2="205.67" y2="184.43" stroke="#787878" stroke-width="20"/><line x1="50.33" y1="71.57" x2="47.49" y2="68.9" stroke="#787878" stroke-width="20"/><line x1="208.51" y1="32.93" x2="205.67" y2="32.53" stroke="#787878" stroke-width="20"/><line x1="47.49" y1="92.04" x2="44.86" y2="95.17" stroke="#7c7c7c" stroke-width="20"/><line x1="47.49" y1="223.07" x2="44.86" y2="222.54" stroke="#7c7c7c" stroke-width="20"/><line x1="211.14" y1="33.46" x2="208.51" y2="32.93" stroke="#7c7c7c" stroke-width="20"/><line x1="211.14" y1="160.83" x2="208.51" y2="163.96" stroke="#7c7c7c" stroke-width="20"/><line x1="211.14" y1="189.71" x2="208.51" y2="187.1" stroke="#7c7c7c" stroke-width="20"/><line x1="47.49" y1="68.9" x2="44.86" y2="66.29" stroke="#7c7c7c" stroke-width="20"/><line x1="44.86" y1="95.17" x2="42.46" y2="98.33" stroke="#808080" stroke-width="20"/><line x1="213.54" y1="157.67" x2="211.14" y2="160.83" stroke="#808080" stroke-width="20"/><line x1="44.86" y1="222.54" x2="42.46" y2="221.9" stroke="#808080" stroke-width="20"/><line x1="213.54" y1="34.1" x2="211.14" y2="33.46" stroke="#808080" stroke-width="20"/><line x1="213.54" y1="192.24" x2="211.14" y2="189.71" stroke="#808080" stroke-width="20"/><line x1="44.86" y1="66.29" x2="42.46" y2="63.76" stroke="#808080" stroke-width="20"/><line x1="42.46" y1="221.9" x2="40.3" y2="221.15" stroke="#848484" stroke-width="20"/><line x1="215.7" y1="154.46" x2="213.54" y2="157.67" stroke="#848484" stroke-width="20"/><line x1="215.7" y1="34.85" x2="213.54" y2="34.1" stroke="#848484" stroke-width="20"/><line x1="42.46" y1="98.33" x2="40.3" y2="101.54" stroke="#848484" stroke-width="20"/><line x1="215.7" y1="194.69" x2="213.54" y2="192.24" stroke="#848484" stroke-width="20"/><line x1="42.46" y1="63.76" x2="40.3" y2="61.31" stroke="#848484" stroke-width="20"/><line x1="40.3" y1="221.15" x2="38.38" y2="220.28" stroke="#898989" stroke-width="20"/><line x1="217.62" y1="35.72" x2="215.7" y2="34.85" stroke="#898989" stroke-width="20"/><line x1="217.62" y1="151.22" x2="215.7" y2="154.46" stroke="#898989" stroke-width="20"/><line x1="40.3" y1="101.54" x2="38.38" y2="104.78" stroke="#898989" stroke-width="20"/><line x1="40.3" y1="61.31" x2="38.38" y2="58.94" stroke="#898989" stroke-width="20"/><line x1="217.62" y1="197.06" x2="215.7" y2="194.69" stroke="#898989" stroke-width="20"/><line x1="38.38" y1="58.94" x2="36.7" y2="56.66" stroke="#8e8e8e" stroke-width="20"/><line x1="38.38" y1="104.78" x2="36.7" y2="108.04" stroke="#8e8e8e" stroke-width="20"/><line x1="219.3" y1="199.34" x2="217.62" y2="197.06" stroke="#8e8e8e" stroke-width="20"/><line x1="38.38" y1="220.28" x2="36.7" y2="219.3" stroke="#8e8e8e" stroke-width="20"/><line x1="219.3" y1="147.96" x2="217.62" y2="151.22" stroke="#8e8e8e" stroke-width="20"/><line x1="219.3" y1="36.7" x2="217.62" y2="35.72" stroke="#8e8e8e" stroke-width="20"/><line x1="36.7" y1="56.66" x2="35.27" y2="54.46" stroke="#939393" stroke-width="20"/><line x1="220.73" y1="201.54" x2="219.3" y2="199.34" stroke="#939393" stroke-width="20"/><line x1="36.7" y1="108.04" x2="35.27" y2="111.33" stroke="#939393" stroke-width="20"/><line x1="36.7" y1="219.3" x2="35.27" y2="218.21" stroke="#939393" stroke-width="20"/><line x1="220.73" y1="144.67" x2="219.3" y2="147.96" stroke="#939393" stroke-width="20"/><line x1="220.73" y1="37.79" x2="219.3" y2="36.7" stroke="#939393" stroke-width="20"/><line x1="35.27" y1="54.46" x2="34.1" y2="52.35" stroke="#989898" stroke-width="20"/><line x1="35.27" y1="111.33" x2="34.1" y2="114.64" stroke="#989898" stroke-width="20"/><line x1="221.9" y1="141.36" x2="220.73" y2="144.67" stroke="#989898" stroke-width="20"/><line x1="221.9" y1="203.65" x2="220.73" y2="201.54" stroke="#989898" stroke-width="20"/><line x1="35.27" y1="218.21" x2="34.1" y2="217.01" stroke="#989898" stroke-width="20"/><line x1="221.9" y1="38.99" x2="220.73" y2="37.79" stroke="#989898" stroke-width="20"/><line x1="34.1" y1="52.35" x2="33.18" y2="50.33" stroke="#9e9e9e" stroke-width="20"/><line x1="34.1" y1="114.64" x2="33.18" y2="117.97" stroke="#9e9e9e" stroke-width="20"/><line x1="222.82" y1="138.03" x2="221.9" y2="141.36" stroke="#9e9e9e" stroke-width="20"/><line x1="34.1" y1="217.01" x2="33.18" y2="215.7" stroke="#9e9e9e" stroke-width="20"/><line x1="222.82" y1="40.3" x2="221.9" y2="38.99" stroke="#9e9e9e" stroke-width="20"/><line x1="222.82" y1="205.67" x2="221.9" y2="203.65" stroke="#9e9e9e" stroke-width="20"/><line x1="33.18" y1="50.33" x2="32.53" y2="48.41" stroke="#a4a4a4" stroke-width="20"/><line x1="33.18" y1="117.97" x2="32.53" y2="121.3" stroke="#a4a4a4" stroke-width="20"/><line x1="223.47" y1="207.59" x2="222.82" y2="205.67" stroke="#a4a4a4" stroke-width="20"/><line x1="33.18" y1="215.7" x2="32.53" y2="214.28" stroke="#a4a4a4" stroke-width="20"/><line x1="223.47" y1="41.72" x2="222.82" y2="40.3" stroke="#a4a4a4" stroke-width="20"/><line x1="223.47" y1="134.7" x2="222.82" y2="138.03" stroke="#a4a4a4" stroke-width="20"/><line x1="32.53" y1="48.41" x2="32.13" y2="46.59" stroke="#aaaaaa" stroke-width="20"/><line x1="32.53" y1="121.3" x2="32.13" y2="124.65" stroke="#aaaaaa" stroke-width="20"/><line x1="32.53" y1="214.28" x2="32.13" y2="212.76" stroke="#aaaaaa" stroke-width="20"/><line x1="223.87" y1="131.35" x2="223.47" y2="134.7" stroke="#aaaaaa" stroke-width="20"/><line x1="223.87" y1="43.24" x2="223.47" y2="41.72" stroke="#aaaaaa" stroke-width="20"/><line x1="223.87" y1="209.41" x2="223.47" y2="207.59" stroke="#aaaaaa" stroke-width="20"/><line x1="32.13" y1="46.59" x2="32" y2="44.86" stroke="#afafaf" stroke-width="20"/><line x1="32.13" y1="124.65" x2="32" y2="128" stroke="#afafaf" stroke-width="20"/><line x1="32.13" y1="212.76" x2="32" y2="211.14" stroke="#afafaf" stroke-width="20"/><line x1="224" y1="128" x2="223.87" y2="131.35" stroke="#afafaf" stroke-width="20"/><line x1="224" y1="44.86" x2="223.87" y2="43.24" stroke="#afafaf" stroke-width="20"/><line x1="224" y1="211.14" x2="223.87" y2="209.41" stroke="#afafaf" stroke-width="20"/><line x1="32" y1="44.86" x2="32.13" y2="43.24" stroke="#b6b6b6" stroke-width="20"/><line x1="223.87" y1="124.65" x2="224" y2="128" stroke="#b6b6b6" stroke-width="20"/><line x1="32" y1="128" x2="32.13" y2="131.35" stroke="#b6b6b6" stroke-width="20"/><line x1="32" y1="211.14" x2="32.13" y2="209.41" stroke="#b6b6b6" stroke-width="20"/><line x1="223.87" y1="46.59" x2="224" y2="44.86" stroke="#b6b6b6" stroke-width="20"/><line x1="223.87" y1="212.76" x2="224" y2="211.14" stroke="#b6b6b6" stroke-width="20"/><line x1="32.13" y1="43.24" x2="32.53" y2="41.72" stroke="#bbbbbb" stroke-width="20"/><line x1="223.47" y1="121.3" x2="223.87" y2="124.65" stroke="#bbbbbb" stroke-width="20"/><line x1="32.13" y1="209.41" x2="32.53" y2="207.59" stroke="#bbbbbb" stroke-width="20"/><line x1="32.13" y1="131.35" x2="32.53" y2="134.7" stroke="#bbbbbb" stroke-width="20"/><line x1="223.47" y1="48.41" x2="223.87" y2="46.59" stroke="#bbbbbb" stroke-width="20"/><line x1="223.47" y1="214.28" x2="223.87" y2="212.76" stroke="#bbbbbb" stroke-width="20"/><line x1="32.53" y1="41.72" x2="33.18" y2="40.3" stroke="#c1c1c1" stroke-width="20"/><line x1="32.53" y1="134.7" x2="33.18" y2="138.03" stroke="#c1c1c1" stroke-width="20"/><line x1="32.53" y1="207.59" x2="33.18" y2="205.67" stroke="#c1c1c1" stroke-width="20"/><line x1="222.82" y1="117.97" x2="223.47" y2="121.3" stroke="#c1c1c1" stroke-width="20"/><line x1="222.82" y1="215.7" x2="223.47" y2="214.28" stroke="#c1c1c1" stroke-width="20"/><line x1="222.82" y1="50.33" x2="223.47" y2="48.41" stroke="#c1c1c1" stroke-width="20"/><line x1="33.18" y1="40.3" x2="34.1" y2="38.99" stroke="#c7c7c7" stroke-width="20"/><line x1="33.18" y1="138.03" x2="34.1" y2="141.36" stroke="#c7c7c7" stroke-width="20"/><line x1="33.18" y1="205.67" x2="34.1" y2="203.65" stroke="#c7c7c7" stroke-width="20"/><line x1="221.9" y1="52.35" x2="222.82" y2="50.33" stroke="#c7c7c7" stroke-width="20"/><line x1="221.9" y1="114.64" x2="222.82" y2="117.97" stroke="#c7c7c7" stroke-width="20"/><line x1="221.9" y1="217.01" x2="222.82" y2="215.7" stroke="#c7c7c7" stroke-width="20"/><line x1="34.1" y1="38.99" x2="35.27" y2="37.79" stroke="#cdcdcd" stroke-width="20"/><line x1="34.1" y1="141.36" x2="35.27" y2="144.67" stroke="#cdcdcd" stroke-width="20"/><line x1="34.1" y1="203.65" x2="35.27" y2="201.54" stroke="#cdcdcd" stroke-width="20"/><line x1="220.73" y1="54.46" x2="221.9" y2="52.35" stroke="#cdcdcd" stroke-width="20"/><line x1="220.73" y1="111.33" x2="221.9" y2="114.64" stroke="#cdcdcd" stroke-width="20"/><line x1="220.73" y1="218.21" x2="221.9" y2="217.01" stroke="#cdcdcd" stroke-width="20"/><line x1="35.27" y1="37.79" x2="36.7" y2="36.7" stroke="#d2d2d2" stroke-width="20"/><line x1="35.27" y1="144.67" x2="36.7" y2="147.96" stroke="#d2d2d2" stroke-width="20"/><line x1="35.27" y1="201.54" x2="36.7" y2="199.34" stroke="#d2d2d2" stroke-width="20"/><line x1="219.3" y1="56.66" x2="220.73" y2="54.46" stroke="#d2d2d2" stroke-width="20"/><line x1="219.3" y1="108.04" x2="220.73" y2="111.33" stroke="#d2d2d2" stroke-width="20"/><line x1="219.3" y1="219.3" x2="220.73" y2="218.21" stroke="#d2d2d2" stroke-width="20"/><line x1="36.7" y1="36.7" x2="38.38" y2="35.72" stroke="#d7d7d7" stroke-width="20"/><line x1="217.62" y1="220.28" x2="219.3" y2="219.3" stroke="#d7d7d7" stroke-width="20"/><line x1="36.7" y1="199.34" x2="38.38" y2="197.06" stroke="#d7d7d7" stroke-width="20"/><line x1="217.62" y1="58.94" x2="219.3" y2="56.66" stroke="#d7d7d7" stroke-width="20"/><line x1="36.7" y1="147.96" x2="38.38" y2="151.22" stroke="#d7d7d7" stroke-width="20"/><line x1="217.62" y1="104.78" x2="219.3" y2="108.04" stroke="#d7d7d7" stroke-width="20"/><line x1="215.7" y1="221.15" x2="217.62" y2="220.28" stroke="#dcdcdc" stroke-width="20"/><line x1="38.38" y1="35.72" x2="40.3" y2="34.85" stroke="#dcdcdc" stroke-width="20"/><line x1="38.38" y1="197.06" x2="40.3" y2="194.69" stroke="#dcdcdc" stroke-width="20"/><line x1="215.7" y1="61.31" x2="217.62" y2="58.94" stroke="#dcdcdc" stroke-width="20"/><line x1="38.38" y1="151.22" x2="40.3" y2="154.46" stroke="#dcdcdc" stroke-width="20"/><line x1="215.7" y1="101.54" x2="217.62" y2="104.78" stroke="#dcdcdc" stroke-width="20"/><line x1="40.3" y1="154.46" x2="42.46" y2="157.67" stroke="#e1e1e1" stroke-width="20"/><line x1="213.54" y1="221.9" x2="215.7" y2="221.15" stroke="#e1e1e1" stroke-width="20"/><line x1="40.3" y1="194.69" x2="42.46" y2="192.24" stroke="#e1e1e1" stroke-width="20"/><line x1="40.3" y1="34.85" x2="42.46" y2="34.1" stroke="#e1e1e1" stroke-width="20"/><line x1="213.54" y1="63.76" x2="215.7" y2="61.31" stroke="#e1e1e1" stroke-width="20"/><line x1="213.54" y1="98.33" x2="215.7" y2="101.54" stroke="#e1e1e1" stroke-width="20"/><line x1="42.46" y1="157.67" x2="44.86" y2="160.83" stroke="#e5e5e5" stroke-width="20"/><line x1="211.14" y1="222.54" x2="213.54" y2="221.9" stroke="#e5e5e5" stroke-width="20"/><line x1="42.46" y1="192.24" x2="44.86" y2="189.71" stroke="#e5e5e5" stroke-width="20"/><line x1="211.14" y1="66.29" x2="213.54" y2="63.76" stroke="#e5e5e5" stroke-width="20"/><line x1="42.46" y1="34.1" x2="44.86" y2="33.46" stroke="#e5e5e5" stroke-width="20"/><line x1="211.14" y1="95.17" x2="213.54" y2="98.33" stroke="#e5e5e5" stroke-width="20"/><line x1="44.86" y1="189.71" x2="47.49" y2="187.1" stroke="#e9e9e9" stroke-width="20"/><line x1="44.86" y1="160.83" x2="47.49" y2="163.96" stroke="#e9e9e9" stroke-width="20"/><line x1="208.51" y1="68.9" x2="211.14" y2="66.29" stroke="#e9e9e9" stroke-width="20"/><line x1="44.86" y1="33.46" x2="47.49" y2="32.93" stroke="#e9e9e9" stroke-width="20"/><line x1="208.51" y1="223.07" x2="211.14" y2="222.54" stroke="#e9e9e9" stroke-width="20"/><line x1="208.51" y1="92.04" x2="211.14" y2="95.17" stroke="#e9e9e9" stroke-width="20"/><line x1="47.49" y1="163.96" x2="50.33" y2="167.05" stroke="#ededed" stroke-width="20"/><line x1="47.49" y1="187.1" x2="50.33" y2="184.43" stroke="#ededed" stroke-width="20"/><line x1="205.67" y1="71.57" x2="208.51" y2="68.9" stroke="#ededed" stroke-width="20"/><line x1="47.49" y1="32.93" x2="50.33" y2="32.53" stroke="#ededed" stroke-width="20"/><line x1="205.67" y1="223.47" x2="208.51" y2="223.07" stroke="#ededed" stroke-width="20"/><line x1="205.67" y1="88.95" x2="208.51" y2="92.04" stroke="#ededed" stroke-width="20"/><line x1="50.33" y1="167.05" x2="53.39" y2="170.08" stroke="#f0f0f0" stroke-width="20"/><line x1="50.33" y1="184.43" x2="53.39" y2="181.68" stroke="#f0f0f0" stroke-width="20"/><line x1="202.61" y1="74.32" x2="205.67" y2="71.57" stroke="#f0f0f0" stroke-width="20"/><line x1="202.61" y1="223.77" x2="205.67" y2="223.47" stroke="#f0f0f0" stroke-width="20"/><line x1="50.33" y1="32.53" x2="53.39" y2="32.23" stroke="#f0f0f0" stroke-width="20"/><line x1="202.61" y1="85.92" x2="205.67" y2="88.95" stroke="#f0f0f0" stroke-width="20"/><line x1="53.39" y1="170.08" x2="56.66" y2="173.07" stroke="#f3f3f3" stroke-width="20"/><line x1="53.39" y1="181.68" x2="56.66" y2="178.87" stroke="#f3f3f3" stroke-width="20"/><line x1="199.34" y1="77.13" x2="202.61" y2="74.32" stroke="#f3f3f3" stroke-width="20"/><line x1="199.34" y1="223.94" x2="202.61" y2="223.77" stroke="#f3f3f3" stroke-width="20"/><line x1="53.39" y1="32.23" x2="56.66" y2="32.06" stroke="#f3f3f3" stroke-width="20"/><line x1="199.34" y1="82.93" x2="202.61" y2="85.92" stroke="#f3f3f3" stroke-width="20"/><line x1="56.66" y1="173.07" x2="60.12" y2="176" stroke="#f5f5f5" stroke-width="20"/><line x1="195.88" y1="80" x2="199.34" y2="82.93" stroke="#f5f5f5" stroke-width="20"/><line x1="56.66" y1="178.87" x2="60.12" y2="176" stroke="#f5f5f5" stroke-width="20"/><line x1="195.88" y1="80" x2="199.34" y2="77.13" stroke="#f5f5f5" stroke-width="20"/><line x1="195.88" y1="224" x2="199.34" y2="223.94" stroke="#f5f5f5" stroke-width="20"/><line x1="56.66" y1="32.06" x2="60.12" y2="32" stroke="#f5f5f5" stroke-width="20"/><line x1="192.24" y1="77.13" x2="195.88" y2="80" stroke="#f7f7f7" stroke-width="20"/><line x1="60.12" y1="176" x2="63.76" y2="178.87" stroke="#f7f7f7" stroke-width="20"/><line x1="60.12" y1="176" x2="63.76" y2="173.07" stroke="#f7f7f7" stroke-width="20"/><line x1="192.24" y1="82.93" x2="195.88" y2="80" stroke="#f7f7f7" stroke-width="20"/><line x1="192.24" y1="223.94" x2="195.88" y2="224" stroke="#f7f7f7" stroke-width="20"/><line x1="60.12" y1="32" x2="63.76" y2="32.06" stroke="#f7f7f7" stroke-width="20"/><line x1="63.76" y1="32.06" x2="67.59" y2="32.23" stroke="#f9f9f9" stroke-width="20"/><line x1="63.76" y1="178.87" x2="67.59" y2="181.68" stroke="#f9f9f9" stroke-width="20"/><line x1="63.76" y1="173.07" x2="67.59" y2="170.08" stroke="#f9f9f9" stroke-width="20"/><line x1="188.41" y1="223.77" x2="192.24" y2="223.94" stroke="#f9f9f9" stroke-width="20"/><line x1="188.41" y1="74.32" x2="192.24" y2="77.13" stroke="#f9f9f9" stroke-width="20"/><line x1="188.41" y1="85.92" x2="192.24" y2="82.93" stroke="#f9f9f9" stroke-width="20"/><line x1="67.59" y1="32.23" x2="71.57" y2="32.53" stroke="#fafafa" stroke-width="20"/><line x1="67.59" y1="170.08" x2="71.57" y2="167.05" stroke="#fafafa" stroke-width="20"/><line x1="184.43" y1="223.47" x2="188.41" y2="223.77" stroke="#fafafa" stroke-width="20"/><line x1="184.43" y1="88.95" x2="188.41" y2="85.92" stroke="#fafafa" stroke-width="20"/><line x1="184.43" y1="71.57" x2="188.41" y2="74.32" stroke="#fafafa" stroke-width="20"/><line x1="67.59" y1="181.68" x2="71.57" y2="184.43" stroke="#fafafa" stroke-width="20"/><line x1="180.29" y1="68.9" x2="184.43" y2="71.57" stroke="#fcfcfc" stroke-width="20"/><line x1="71.57" y1="32.53" x2="75.71" y2="32.93" stroke="#fcfcfc" stroke-width="20"/><line x1="180.29" y1="223.07" x2="184.43" y2="223.47" stroke="#fcfcfc" stroke-width="20"/><line x1="71.57" y1="167.05" x2="75.71" y2="163.96" stroke="#fcfcfc" stroke-width="20"/><line x1="180.29" y1="92.04" x2="184.43" y2="88.95" stroke="#fcfcfc" stroke-width="20"/><line x1="71.57" y1="184.43" x2="75.71" y2="187.1" stroke="#fcfcfc" stroke-width="20"/><line x1="176" y1="222.54" x2="180.29" y2="223.07" stroke="#fdfdfd" stroke-width="20"/><line x1="75.71" y1="163.96" x2="80" y2="160.83" stroke="#fdfdfd" stroke-width="20"/><line x1="75.71" y1="32.93" x2="80" y2="33.46" stroke="#fdfdfd" stroke-width="20"/><line x1="75.71" y1="187.1" x2="80" y2="189.71" stroke="#fdfdfd" stroke-width="20"/><line x1="176" y1="95.17" x2="180.29" y2="92.04" stroke="#fdfdfd" stroke-width="20"/><line x1="176" y1="66.29" x2="180.29" y2="68.9" stroke="#fdfdfd" stroke-width="20"/><line x1="80" y1="160.83" x2="84.42" y2="157.67" stroke="#fdfdfd" stroke-width="20"/><line x1="171.58" y1="98.33" x2="176" y2="95.17" stroke="#fdfdfd" stroke-width="20"/><line x1="80" y1="33.46" x2="84.42" y2="34.1" stroke="#fdfdfd" stroke-width="20"/><line x1="80" y1="189.71" x2="84.42" y2="192.24" stroke="#fdfdfd" stroke-width="20"/><line x1="171.58" y1="221.9" x2="176" y2="222.54" stroke="#fdfdfd" stroke-width="20"/><line x1="171.58" y1="63.76" x2="176" y2="66.29" stroke="#fdfdfd" stroke-width="20"/><line x1="167.05" y1="61.31" x2="171.58" y2="63.76" stroke="#fefefe" stroke-width="20"/><line x1="84.42" y1="192.24" x2="88.95" y2="194.69" stroke="#fefefe" stroke-width="20"/><line x1="84.42" y1="157.67" x2="88.95" y2="154.46" stroke="#fefefe" stroke-width="20"/><line x1="167.05" y1="101.54" x2="171.58" y2="98.33" stroke="#fefefe" stroke-width="20"/><line x1="167.05" y1="221.15" x2="171.58" y2="221.9" stroke="#fefefe" stroke-width="20"/><line x1="84.42" y1="34.1" x2="88.95" y2="34.85" stroke="#fefefe" stroke-width="20"/><line x1="162.4" y1="58.94" x2="167.05" y2="61.31" stroke="#fefefe" stroke-width="20"/><line x1="88.95" y1="194.69" x2="93.6" y2="197.06" stroke="#fefefe" stroke-width="20"/><line x1="88.95" y1="154.46" x2="93.6" y2="151.22" stroke="#fefefe" stroke-width="20"/><line x1="162.4" y1="104.78" x2="167.05" y2="101.54" stroke="#fefefe" stroke-width="20"/><line x1="88.95" y1="34.85" x2="93.6" y2="35.72" stroke="#fefefe" stroke-width="20"/><line x1="162.4" y1="220.28" x2="167.05" y2="221.15" stroke="#fefefe" stroke-width="20"/><line x1="93.6" y1="35.72" x2="98.33" y2="36.7" stroke="#ffffff" stroke-width="20"/><line x1="157.67" y1="56.66" x2="162.4" y2="58.94" stroke="#ffffff" stroke-width="20"/><line x1="93.6" y1="197.06" x2="98.33" y2="199.34" stroke="#ffffff" stroke-width="20"/><line x1="93.6" y1="151.22" x2="98.33" y2="147.96" stroke="#ffffff" stroke-width="20"/><line x1="157.67" y1="108.04" x2="162.4" y2="104.78" stroke="#ffffff" stroke-width="20"/><line x1="157.67" y1="219.3" x2="162.4" y2="220.28" stroke="#ffffff" stroke-width="20"/><line x1="98.33" y1="36.7" x2="103.15" y2="37.79" stroke="#ffffff" stroke-width="20"/><line x1="152.85" y1="54.46" x2="157.67" y2="56.66" stroke="#ffffff" stroke-width="20"/><line x1="98.33" y1="147.96" x2="103.15" y2="144.67" stroke="#ffffff" stroke-width="20"/><line x1="98.33" y1="199.34" x2="103.15" y2="201.54" stroke="#ffffff" stroke-width="20"/><line x1="152.85" y1="111.33" x2="157.67" y2="108.04" stroke="#ffffff" stroke-width="20"/><line x1="152.85" y1="218.21" x2="157.67" y2="219.3" stroke="#ffffff" stroke-width="20"/><line x1="103.15" y1="37.79" x2="108.04" y2="38.99" stroke="#ffffff" stroke-width="20"/><line x1="103.15" y1="201.54" x2="108.04" y2="203.65" stroke="#ffffff" stroke-width="20"/><line x1="147.96" y1="52.35" x2="152.85" y2="54.46" stroke="#ffffff" stroke-width="20"/><line x1="103.15" y1="144.67" x2="108.04" y2="141.36" stroke="#ffffff" stroke-width="20"/><line x1="147.96" y1="114.64" x2="152.85" y2="111.33" stroke="#ffffff" stroke-width="20"/><line x1="147.96" y1="217.01" x2="152.85" y2="218.21" stroke="#ffffff" stroke-width="20"/><line x1="108.04" y1="38.99" x2="112.98" y2="40.3" stroke="#ffffff" stroke-width="20"/><line x1="108.04" y1="203.65" x2="112.98" y2="205.67" stroke="#ffffff" stroke-width="20"/><line x1="143.02" y1="50.33" x2="147.96" y2="52.35" stroke="#ffffff" stroke-width="20"/><line x1="108.04" y1="141.36" x2="112.98" y2="138.03" stroke="#ffffff" stroke-width="20"/><line x1="143.02" y1="117.97" x2="147.96" y2="114.64" stroke="#ffffff" stroke-width="20"/><line x1="143.02" y1="215.7" x2="147.96" y2="217.01" stroke="#ffffff" stroke-width="20"/><line x1="112.98" y1="40.3" x2="117.97" y2="41.72" stroke="#ffffff" stroke-width="20"/><line x1="112.98" y1="138.03" x2="117.97" y2="134.7" stroke="#ffffff" stroke-width="20"/><line x1="112.98" y1="205.67" x2="117.97" y2="207.59" stroke="#ffffff" stroke-width="20"/><line x1="138.03" y1="48.41" x2="143.02" y2="50.33" stroke="#ffffff" stroke-width="20"/><line x1="138.03" y1="121.3" x2="143.02" y2="117.97" stroke="#ffffff" stroke-width="20"/><line x1="138.03" y1="214.28" x2="143.02" y2="215.7" stroke="#ffffff" stroke-width="20"/><line x1="117.97" y1="41.72" x2="122.98" y2="43.24" stroke="#ffffff" stroke-width="20"/><line x1="117.97" y1="134.7" x2="122.98" y2="131.35" stroke="#ffffff" stroke-width="20"/><line x1="133.02" y1="124.65" x2="138.03" y2="121.3" stroke="#ffffff" stroke-width="20"/><line x1="117.97" y1="207.59" x2="122.98" y2="209.41" stroke="#ffffff" stroke-width="20"/><line x1="133.02" y1="212.76" x2="138.03" y2="214.28" stroke="#ffffff" stroke-width="20"/><line x1="133.02" y1="46.59" x2="138.03" y2="48.41" stroke="#ffffff" stroke-width="20"/><line x1="122.98" y1="131.35" x2="128" y2="128" stroke="#ffffff" stroke-width="20"/><line x1="128" y1="128" x2="133.02" y2="124.65" stroke="#ffffff" stroke-width="20"/><line x1="128" y1="211.14" x2="133.02" y2="212.76" stroke="#ffffff" stroke-width="20"/><line x1="122.98" y1="43.24" x2="128" y2="44.86" stroke="#ffffff" stroke-width="20"/><line x1="122.98" y1="209.41" x2="128" y2="211.14" stroke="#ffffff" stroke-width="20"/><line x1="128" y1="44.86" x2="133.02" y2="46.59" stroke="#ffffff" stroke-width="20"/></mask></defs><g transform="translate(-25.057 -25.057) scale(1.195755)"><path fill="currentColor" mask="url(#depth)" d="M179.39 175.77C177.41 177.1 175.4 178.38 173.35 179.63C171.31 180.88 169.23 182.1 167.13 183.27C165.02 184.45 162.89 185.59 160.74 186.7C158.58 187.8 156.41 188.87 154.21 189.91C152.02 190.95 149.8 191.96 147.57 192.94C145.34 193.91 143.09 194.86 140.82 195.77C138.56 196.69 136.28 197.57 133.99 198.42C132 199.16 130 199.88 128 200.58L128 200.58C125.69 199.78 123.39 198.95 121.1 198.08C118.82 197.22 116.54 196.33 114.28 195.41C112.02 194.49 109.78 193.54 107.55 192.55C105.32 191.57 103.11 190.55 100.92 189.5C98.73 188.45 96.56 187.37 94.41 186.26C92.27 185.14 90.14 183.99 88.05 182.81C85.95 181.62 83.88 180.4 81.84 179.14C80.07 178.04 78.33 176.92 76.61 175.77L76.61 175.77C78.59 174.28 80.58 172.79 82.59 171.32C84.6 169.85 86.62 168.39 88.65 166.93C90.68 165.48 92.72 164.03 94.77 162.59C96.82 161.16 98.88 159.72 100.95 158.3C103.02 156.87 105.09 155.45 107.17 154.03C109.25 152.62 111.33 151.2 113.42 149.79C115.51 148.38 117.61 146.97 119.7 145.57C121.8 144.16 123.9 142.76 126 141.35C126.67 140.91 127.34 140.46 128 140.02L128 140.02C130.1 141.42 132.21 142.83 134.3 144.23C136.4 145.64 138.5 147.04 140.59 148.45C142.68 149.86 144.77 151.27 146.85 152.69C148.94 154.1 151.01 155.52 153.09 156.94C155.16 158.37 157.22 159.8 159.28 161.23C161.33 162.66 163.38 164.11 165.42 165.55C167.46 167 169.49 168.46 171.5 169.92C173.52 171.39 175.52 172.87 177.5 174.35C178.13 174.83 178.76 175.3 179.39 175.77ZM96.44 209.48C94.06 210 91.67 210.48 89.28 210.93C86.9 211.37 84.51 211.78 82.12 212.14C79.73 212.5 77.35 212.82 74.97 213.09C72.59 213.36 70.21 213.57 67.86 213.73C65.5 213.89 63.16 213.98 60.85 214C58.54 214.01 56.27 213.95 54.08 213.79C52.98 213.71 51.9 213.6 50.86 213.46C49.81 213.32 48.8 213.16 47.84 212.96C46.88 212.76 45.97 212.53 45.15 212.27C44.41 212.03 43.75 211.77 43.21 211.52C42.67 211.26 42.26 211 42.03 210.83L42.03 210.83C42.08 210.51 42.23 209.97 42.49 209.33C42.75 208.69 43.11 207.94 43.56 207.17C44.01 206.39 44.54 205.58 45.12 204.75C45.7 203.92 46.34 203.09 47.02 202.25C48.38 200.57 49.9 198.89 51.5 197.23C53.1 195.57 54.79 193.93 56.54 192.31C57.8 191.14 59.09 189.98 60.41 188.83L60.4 188.83C62.59 190.42 64.81 191.95 67.05 193.42C69.29 194.9 71.56 196.31 73.84 197.68C76.13 199.05 78.44 200.37 80.77 201.64C83.1 202.92 85.44 204.15 87.8 205.34C90.16 206.53 92.54 207.68 94.93 208.79C95.43 209.02 95.93 209.25 96.44 209.48ZM146.01 128C148.12 126.59 150.23 125.17 152.34 123.75C154.45 122.33 156.56 120.9 158.67 119.47C160.78 118.03 162.88 116.59 164.99 115.14C167.09 113.7 169.19 112.24 171.29 110.77C173.39 109.31 175.49 107.83 177.58 106.34C179.67 104.85 181.75 103.35 183.83 101.84C185.92 100.32 187.99 98.78 190.06 97.23C191.9 95.85 193.74 94.44 195.57 93.02L195.57 93.02C197.24 94.6 198.83 96.23 200.34 97.9C201.85 99.57 203.28 101.29 204.6 103.05C205.91 104.81 207.12 106.61 208.2 108.45C209.28 110.28 210.24 112.15 211.04 114.04C211.84 115.94 212.48 117.85 212.97 119.78C213.45 121.7 213.77 123.64 213.91 125.58C213.97 126.38 214 127.19 214 128C214 129.94 213.83 131.88 213.48 133.81C213.14 135.75 212.63 137.67 211.96 139.58C211.28 141.49 210.45 143.38 209.49 145.25C208.52 147.11 207.41 148.94 206.18 150.73C204.96 152.52 203.62 154.28 202.18 155.99C200.75 157.69 199.22 159.36 197.61 160.98C196.94 161.65 196.26 162.32 195.57 162.98L195.57 162.98C193.52 161.38 191.46 159.81 189.39 158.27C187.32 156.72 185.24 155.19 183.16 153.67C181.08 152.16 178.99 150.66 176.9 149.17C174.8 147.69 172.71 146.21 170.61 144.75C168.51 143.29 166.41 141.83 164.3 140.39C162.2 138.94 160.09 137.5 157.98 136.07C155.87 134.64 153.76 133.21 151.65 131.79C149.77 130.52 147.89 129.26 146.01 128ZM211.06 80.19C213.04 78.4 215.01 76.56 216.94 74.64C218.88 72.71 220.79 70.71 222.66 68.56C223.59 67.49 224.51 66.38 225.41 65.22C226.32 64.05 227.21 62.84 228.07 61.55C228.93 60.26 229.77 58.89 230.55 57.39C231.34 55.89 232.08 54.27 232.7 52.43C233 51.51 233.28 50.54 233.5 49.5C233.72 48.45 233.89 47.34 233.96 46.16C234.03 44.98 234.01 43.73 233.85 42.44C233.7 41.15 233.4 39.82 232.95 38.53C232.51 37.24 231.91 35.99 231.21 34.85C230.51 33.71 229.71 32.68 228.87 31.78C228.03 30.88 227.16 30.09 226.28 29.41C225.4 28.72 224.52 28.14 223.65 27.63C221.91 26.6 220.22 25.85 218.59 25.25C216.96 24.65 215.38 24.19 213.83 23.82C212.29 23.45 210.78 23.16 209.3 22.93C206.33 22.47 203.46 22.23 200.64 22.1C197.82 21.98 195.05 21.97 192.32 22.05C189.58 22.13 186.87 22.29 184.19 22.51C181.51 22.73 178.85 23.01 176.2 23.35C173.56 23.68 170.93 24.06 168.32 24.49C165.71 24.92 163.11 25.39 160.53 25.9C157.94 26.4 155.37 26.95 152.8 27.53C150.24 28.12 147.69 28.74 145.15 29.39C142.61 30.04 140.08 30.73 137.56 31.44C135.04 32.16 132.53 32.91 130.03 33.7C129.35 33.91 128.67 34.12 128 34.34L128 34.34C125.51 33.54 123 32.77 120.49 32.03C117.97 31.3 115.45 30.6 112.91 29.92C110.38 29.25 107.83 28.62 105.28 28.02C102.72 27.41 100.15 26.85 97.57 26.32C94.99 25.79 92.4 25.3 89.8 24.85C87.19 24.4 84.58 23.99 81.94 23.63C79.31 23.27 76.66 22.96 73.99 22.7C71.31 22.45 68.62 22.25 65.9 22.13C63.18 22.01 60.43 21.97 57.64 22.03C54.85 22.09 52.01 22.25 49.09 22.6C47.64 22.78 46.16 23 44.65 23.29C43.14 23.57 41.6 23.93 40.02 24.39C38.44 24.85 36.82 25.42 35.13 26.18C34.29 26.57 33.44 27 32.57 27.5C31.7 28 30.82 28.57 29.94 29.24C29.06 29.9 28.18 30.67 27.34 31.55C26.49 32.44 25.68 33.45 24.97 34.57C24.25 35.69 23.63 36.92 23.16 38.21C22.69 39.49 22.37 40.82 22.19 42.11C22.01 43.41 21.97 44.67 22.02 45.86C22.08 47.06 22.23 48.18 22.44 49.23C22.66 50.28 22.92 51.27 23.23 52.2C23.83 54.06 24.56 55.69 25.35 57.2C26.13 58.71 26.96 60.09 27.82 61.38C28.68 62.68 29.57 63.9 30.47 65.07C32.28 67.4 34.15 69.53 36.05 71.56C37.96 73.58 39.9 75.5 41.86 77.35C42.88 78.31 43.91 79.26 44.94 80.19L44.94 80.18C42.97 82.14 41.05 84.18 39.2 86.33C37.36 88.47 35.59 90.72 33.93 93.08C32.27 95.44 30.71 97.92 29.31 100.52C27.9 103.12 26.64 105.85 25.57 108.69C24.51 111.53 23.65 114.49 23.04 117.53C22.44 120.56 22.08 123.68 22.01 126.8C21.94 129.93 22.15 133.06 22.63 136.14C23.11 139.21 23.85 142.22 24.8 145.11C25.76 148.01 26.93 150.8 28.26 153.46C29.59 156.13 31.08 158.67 32.68 161.09C34.28 163.51 36 165.81 37.81 168.01C39.61 170.21 41.49 172.3 43.44 174.3C43.94 174.81 44.44 175.32 44.94 175.82L44.94 175.81C42.96 177.6 40.99 179.44 39.06 181.36C37.12 183.29 35.21 185.29 33.34 187.44C32.41 188.51 31.49 189.62 30.59 190.78C29.68 191.95 28.79 193.16 27.93 194.45C27.07 195.74 26.23 197.11 25.45 198.61C24.66 200.11 23.92 201.73 23.3 203.57C23 204.49 22.72 205.46 22.5 206.5C22.28 207.55 22.11 208.66 22.04 209.84C21.97 211.02 21.99 212.27 22.15 213.56C22.3 214.85 22.6 216.18 23.05 217.47C23.49 218.76 24.09 220.01 24.79 221.15C25.49 222.29 26.29 223.32 27.13 224.22C27.97 225.12 28.84 225.91 29.72 226.59C30.6 227.28 31.48 227.86 32.35 228.37C34.09 229.4 35.78 230.15 37.41 230.75C39.04 231.35 40.62 231.81 42.17 232.18C43.71 232.55 45.22 232.84 46.7 233.07C49.67 233.53 52.54 233.77 55.36 233.9C58.18 234.02 60.95 234.03 63.68 233.95C66.42 233.87 69.13 233.71 71.81 233.49C74.49 233.27 77.15 232.99 79.8 232.65C82.44 232.32 85.07 231.94 87.68 231.51C90.29 231.08 92.89 230.61 95.47 230.1C98.06 229.6 100.63 229.05 103.2 228.47C105.76 227.88 108.31 227.26 110.85 226.61C113.39 225.96 115.92 225.27 118.44 224.56C120.96 223.84 123.47 223.09 125.97 222.3C126.65 222.09 127.33 221.88 128 221.66L128 221.66C130.49 222.46 133 223.23 135.51 223.97C138.03 224.7 140.55 225.4 143.09 226.08C145.62 226.75 148.17 227.38 150.72 227.98C153.28 228.59 155.85 229.15 158.43 229.68C161.01 230.21 163.6 230.7 166.2 231.15C168.81 231.6 171.42 232.01 174.06 232.37C176.69 232.73 179.34 233.04 182.01 233.3C184.69 233.55 187.38 233.75 190.1 233.87C192.82 233.99 195.57 234.03 198.36 233.97C201.15 233.91 203.99 233.75 206.91 233.4C208.36 233.22 209.84 233 211.35 232.71C212.86 232.43 214.4 232.07 215.98 231.61C217.56 231.15 219.18 230.58 220.87 229.82C221.71 229.43 222.56 229 223.43 228.5C224.3 228 225.18 227.43 226.06 226.76C226.94 226.1 227.82 225.33 228.66 224.45C229.51 223.56 230.32 222.55 231.03 221.43C231.75 220.31 232.37 219.08 232.84 217.79C233.31 216.51 233.63 215.18 233.81 213.89C233.99 212.59 234.03 211.33 233.98 210.14C233.92 208.94 233.77 207.82 233.56 206.77C233.34 205.72 233.08 204.73 232.77 203.8C232.17 201.94 231.44 200.31 230.65 198.8C229.87 197.29 229.04 195.91 228.18 194.62C227.32 193.32 226.43 192.1 225.53 190.93C223.72 188.6 221.85 186.47 219.95 184.44C218.04 182.42 216.1 180.5 214.14 178.65C213.12 177.69 212.09 176.74 211.06 175.81L211.06 175.82C213.03 173.86 214.95 171.82 216.8 169.67C218.64 167.53 220.41 165.28 222.07 162.92C223.73 160.56 225.29 158.08 226.69 155.48C228.1 152.88 229.36 150.15 230.43 147.31C231.49 144.47 232.35 141.51 232.96 138.47C233.56 135.44 233.92 132.32 233.99 129.2C234 128.8 234 128.4 234 128C234 124.87 233.72 121.75 233.18 118.69C232.63 115.64 231.83 112.65 230.82 109.78C229.81 106.91 228.6 104.15 227.23 101.52C225.86 98.89 224.33 96.38 222.7 93.99C221.07 91.6 219.32 89.32 217.5 87.15C215.68 84.98 213.77 82.91 211.81 80.94C211.56 80.68 211.31 80.43 211.06 80.18ZM96.44 46.52C94.04 47.61 91.66 48.74 89.29 49.92C86.92 51.09 84.57 52.3 82.24 53.56C79.9 54.81 77.59 56.11 75.29 57.46C72.99 58.81 70.72 60.21 68.46 61.66C66.21 63.1 63.98 64.61 61.78 66.17C61.32 66.5 60.86 66.83 60.4 67.17L60.41 67.17C58.59 65.58 56.81 63.97 55.1 62.34C53.39 60.71 51.74 59.06 50.19 57.39C48.64 55.72 47.19 54.03 45.93 52.36C45.3 51.53 44.72 50.7 44.21 49.89C43.69 49.09 43.25 48.3 42.9 47.59C42.64 47.07 42.44 46.58 42.3 46.17C42.15 45.75 42.07 45.4 42.03 45.17L42.03 45.17C42.29 44.98 42.76 44.69 43.38 44.4C44.01 44.12 44.77 43.84 45.62 43.59C46.47 43.34 47.4 43.12 48.38 42.93C49.36 42.75 50.39 42.59 51.45 42.46C53.56 42.21 55.79 42.07 58.06 42.02C60.33 41.97 62.65 42.01 64.99 42.11C67.33 42.22 69.7 42.39 72.07 42.61C74.44 42.84 76.82 43.12 79.21 43.44C81.6 43.77 83.98 44.14 86.37 44.55C88.76 44.96 91.15 45.42 93.53 45.91C94.5 46.1 95.47 46.31 96.44 46.52ZM128 115.98C125.9 114.58 123.79 113.17 121.7 111.77C119.6 110.36 117.5 108.96 115.41 107.55C113.32 106.14 111.23 104.73 109.15 103.31C107.06 101.9 104.99 100.48 102.91 99.06C100.84 97.63 98.78 96.2 96.72 94.77C94.67 93.34 92.62 91.89 90.58 90.45C88.54 89 86.51 87.54 84.5 86.08C82.48 84.61 80.48 83.13 78.5 81.65C77.87 81.17 77.24 80.7 76.61 80.23L76.61 80.23C78.59 78.9 80.6 77.62 82.65 76.37C84.69 75.12 86.77 73.9 88.87 72.73C90.98 71.55 93.11 70.41 95.26 69.3C97.42 68.2 99.59 67.13 101.79 66.09C103.98 65.05 106.2 64.04 108.43 63.06C110.66 62.09 112.91 61.14 115.18 60.23C117.44 59.31 119.72 58.43 122.01 57.58C124 56.84 126 56.12 128 55.42L128 55.42C130.31 56.22 132.61 57.05 134.9 57.92C137.18 58.78 139.46 59.67 141.72 60.59C143.98 61.51 146.22 62.46 148.45 63.45C150.68 64.43 152.89 65.45 155.08 66.5C157.27 67.55 159.44 68.63 161.59 69.74C163.73 70.86 165.86 72.01 167.95 73.19C170.05 74.38 172.12 75.6 174.16 76.86C175.93 77.96 177.67 79.08 179.39 80.23L179.39 80.23C177.41 81.72 175.42 83.21 173.41 84.68C171.4 86.15 169.38 87.61 167.35 89.07C165.32 90.52 163.28 91.97 161.23 93.41C159.18 94.84 157.12 96.28 155.05 97.7C152.98 99.13 150.91 100.55 148.83 101.97C146.75 103.38 144.67 104.8 142.58 106.21C140.49 107.62 138.39 109.03 136.3 110.43C134.2 111.84 132.1 113.24 130 114.65C129.33 115.09 128.66 115.54 128 115.98ZM195.6 67.17C193.41 65.58 191.19 64.05 188.95 62.58C186.71 61.1 184.44 59.69 182.16 58.32C179.87 56.95 177.56 55.63 175.23 54.36C172.9 53.08 170.56 51.85 168.2 50.66C165.84 49.47 163.46 48.32 161.07 47.21C160.57 46.98 160.07 46.75 159.56 46.52L159.56 46.52C161.94 46 164.33 45.52 166.72 45.07C169.1 44.63 171.49 44.22 173.88 43.86C176.27 43.5 178.65 43.18 181.03 42.91C183.41 42.64 185.79 42.43 188.14 42.27C190.5 42.11 192.84 42.02 195.15 42C197.46 41.99 199.73 42.05 201.92 42.21C203.02 42.29 204.1 42.4 205.14 42.54C206.19 42.68 207.2 42.84 208.16 43.04C209.12 43.24 210.03 43.47 210.85 43.73C211.59 43.97 212.25 44.23 212.79 44.48C213.33 44.74 213.74 45 213.97 45.17L213.97 45.17C213.92 45.49 213.77 46.03 213.51 46.67C213.25 47.31 212.89 48.06 212.44 48.83C211.99 49.61 211.46 50.42 210.88 51.25C210.3 52.08 209.66 52.91 208.98 53.75C207.62 55.43 206.1 57.11 204.5 58.77C202.9 60.43 201.21 62.07 199.46 63.69C198.2 64.86 196.91 66.02 195.59 67.17ZM60.43 93.02C62.48 94.62 64.54 96.19 66.61 97.73C68.68 99.28 70.76 100.81 72.84 102.33C74.92 103.84 77.01 105.34 79.1 106.83C81.2 108.31 83.29 109.79 85.39 111.25C87.49 112.71 89.59 114.17 91.7 115.61C93.8 117.06 95.91 118.5 98.02 119.93C100.13 121.36 102.24 122.79 104.35 124.21C106.23 125.48 108.11 126.74 109.99 128L109.99 128C107.88 129.41 105.77 130.83 103.66 132.25C101.55 133.67 99.44 135.1 97.33 136.53C95.22 137.97 93.12 139.41 91.01 140.86C88.91 142.3 86.81 143.76 84.71 145.23C82.61 146.69 80.51 148.17 78.42 149.66C76.33 151.15 74.25 152.65 72.17 154.16C70.08 155.68 68.01 157.22 65.94 158.77C64.1 160.15 62.26 161.56 60.43 162.98L60.43 162.98C58.76 161.4 57.17 159.77 55.66 158.1C54.15 156.43 52.72 154.71 51.4 152.95C50.09 151.19 48.88 149.39 47.8 147.55C46.72 145.72 45.76 143.85 44.96 141.96C44.16 140.06 43.52 138.15 43.03 136.22C42.55 134.3 42.23 132.36 42.09 130.42C41.95 128.48 41.98 126.54 42.18 124.61C42.38 122.67 42.75 120.73 43.29 118.81C43.83 116.89 44.53 114.98 45.38 113.1C46.23 111.21 47.23 109.35 48.35 107.53C49.47 105.7 50.72 103.92 52.07 102.17C53.43 100.43 54.88 98.72 56.42 97.07C57.7 95.69 59.04 94.34 60.43 93.02ZM195.59 188.83C197.41 190.42 199.19 192.03 200.9 193.66C202.61 195.29 204.26 196.94 205.81 198.61C207.36 200.28 208.81 201.97 210.07 203.64C210.7 204.47 211.28 205.3 211.79 206.11C212.31 206.91 212.75 207.7 213.1 208.41C213.36 208.93 213.56 209.42 213.7 209.83C213.85 210.25 213.93 210.6 213.97 210.83L213.97 210.83C213.71 211.02 213.24 211.31 212.62 211.6C211.99 211.88 211.23 212.16 210.38 212.41C209.53 212.66 208.6 212.88 207.62 213.07C206.64 213.25 205.61 213.41 204.55 213.54C202.44 213.79 200.21 213.93 197.94 213.98C195.67 214.03 193.35 213.99 191.01 213.89C188.67 213.78 186.3 213.61 183.93 213.39C181.56 213.16 179.18 212.88 176.79 212.56C174.4 212.23 172.02 211.86 169.63 211.45C167.24 211.04 164.85 210.58 162.47 210.09C161.5 209.9 160.53 209.69 159.56 209.48L159.56 209.48C161.96 208.39 164.34 207.26 166.71 206.08C169.08 204.91 171.43 203.7 173.76 202.44C176.1 201.19 178.41 199.89 180.71 198.54C183.01 197.19 185.28 195.79 187.54 194.34C189.79 192.9 192.02 191.39 194.22 189.83C194.68 189.5 195.14 189.17 195.6 188.83Z"/></g>';
const SIGNIN_LANDING_STYLE = ":root{--bg:#f7f8fa;--panel:#fff;--ink:#0f172a;--dim:#475569;--line:#e4e8ee;--mark:#5729a6;--logo:#7c3aed;--band:#5729a6;--deep:#2c1466;--ok:#0a7d4a;--warn:#c2410c;--dot:rgba(15,23,42,.13)}"
  + "@media (prefers-color-scheme:dark){:root{--bg:#0f1013;--panel:#131418;--ink:#e3e6ea;--dim:#8f98a6;--line:#262a31;--mark:#a78bfa;--logo:#a78bfa;--band:#3b1d70;--deep:#1a0f33;--ok:#4ec98a;--warn:#ff9f43;--dot:rgba(227,230,234,.10)}}"
  + "*{box-sizing:border-box}html,body{height:100%;margin:0}"
  + "body{font:16px/1.5 \"Segoe UI Variable Text\",\"Segoe UI\",system-ui,-apple-system,\"Liberation Sans\",sans-serif;color:var(--ink);background:var(--bg);display:flex;flex-direction:column;-webkit-text-size-adjust:100%}"
  + "h1{font-family:\"Segoe UI Variable Display\",\"Segoe UI\",system-ui,sans-serif;font-weight:300;letter-spacing:-.01em;margin:0;text-wrap:balance}p{margin:0}svg{display:block;fill:currentColor}.defs{position:absolute}"
  + ".st{display:inline-block;flex:none;border-radius:50%}.st.ok{background:var(--ok)}.st.no{border:2px solid var(--warn);background:radial-gradient(circle,var(--warn) 0 30%,transparent 34%)}.st.wt{border:2px solid var(--mark)}"
  + ".band{background:var(--band);color:#fff;height:40px;display:flex;align-items:center;gap:9px;padding:0 16px;font-size:15px;flex:none}.band svg{width:24px;height:24px}"
  + "main{flex:1;display:flex;flex-direction:column;justify-content:center;padding:32px clamp(20px,7vw,120px) 9vh;background-image:radial-gradient(var(--dot) 1px,transparent 1.4px);background-size:22px 22px}"
  + ".m{width:64px;height:64px;color:var(--logo);margin-bottom:24px}.hd{display:flex;align-items:center;gap:16px}"
  + "h1{font-size:clamp(30px,4.4vw,52px);line-height:1.12}.st{width:30px;height:30px}.st svg{width:30px;height:30px}"
  + "main p{font-size:clamp(16px,1.5vw,19px);color:var(--dim);max-width:36em;margin-top:16px}"
  + "footer{flex:none;padding:14px clamp(20px,7vw,120px);font-size:13px;color:var(--dim);border-top:1px solid var(--line);background:var(--panel)}"
  + "@media (max-width:520px){.hd{align-items:flex-start;gap:12px}.st{margin-top:4px;width:24px;height:24px}.st svg{width:24px;height:24px}}";
/* Each kind's sign: a tick for a seat, a ring in the app's colour while Studio has not finished, an amber ring for the rest. */
const SIGNIN_LANDING_SIGN = { seat: "ok", back: "wait", noseat: "warn" };
function signInLandingLook(w, sign, foot, app, lang) {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const mark = (cls) => "<svg class=\"" + cls + "\" viewBox=\"0 0 256 256\" aria-hidden=\"true\"><use href=\"#m\"/></svg>";
  const dot = sign === "ok" ? "<span class=\"st ok\"><svg viewBox=\"0 0 20 20\" aria-hidden=\"true\"><path d=\"M5.2 10.4l3.1 3.1 6.5-7\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg></span>"
    : sign === "wait" ? "<span class=\"st wt\"></span>" : "<span class=\"st no\"></span>";
  return "<!DOCTYPE html><html lang=\"" + lang + "\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"color-scheme\" content=\"light dark\">"
    + "<link rel=\"icon\" href=\"data:,\"><title>" + esc(w[2] + " · " + app) + "</title><style>" + SIGNIN_LANDING_STYLE + "</style>"
    + "<body" + (sign === "ok" || sign === "wait" || sign === "warn" ? "" : " class=\"bad\"") + ">"
    + "<svg class=\"defs\" width=\"0\" height=\"0\" aria-hidden=\"true\"><symbol id=\"m\" viewBox=\"0 0 256 256\">" + SIGNIN_LANDING_MARK + "</symbol></svg>"
    + "<div class=\"band\">" + mark("") + "<span>" + app + "</span></div><main>" + mark("m") + "<div class=\"hd\">" + dot + "<h1>" + esc(w[0]) + "</h1></div><p>" + esc(w[1]) + "</p></main>"
    + "<footer>" + esc(foot) + "</footer></body></html>";
}
/* The page for `kind` in `lang` ("pl", else English) and its policy: nothing fetched, framed or run, its own style element alone
   by hash. A kind it does not know is the could-not-finish page. */
function signInLandingHtml(kind, lang) {
  const L = lang === "pl" ? "pl" : "en", words = SIGNIN_PAGE_WORDS[L];
  const k = Object.prototype.hasOwnProperty.call(words, kind) && Array.isArray(words[kind]) ? kind : "appfail";
  const body = signInLandingLook(words[k], SIGNIN_LANDING_SIGN[k] || "bad", words.foot, "Etiuda Studio", L);
  const hash = crypto.createHash("sha256").update(SIGNIN_LANDING_STYLE, "utf8").digest("base64"); /* plant:st-land-policy */
  return { body, policy: "default-src 'none'; style-src 'sha256-" + hash + "'; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'" };
}
/* END OF THE LANDING'S LOOK */
function signInPage(kind) { return signInLandingHtml(kind, recoveryLang()); }
/* How a sign-in ended, as the landing says it, from the flow's answer where it reached one: Studio keeps nothing of a refusal, so
   anything but a sign-in taken is the could-not-finish page, the person's Cancel and the organisation's refusal apart. */
function signInLanding(answer, managed) {
  const why = answer && answer.ok !== true ? String(answer.reason || "") : "";
  /* A managed computer offers no other account, which the organisation's page ("org") does (decision 49). */
  if (managed === true && why !== "signin-cancelled") return "appfail"; /* plant:mp-land */
  return why === "signin-cancelled" ? "cancelled" : why === "signin-org" ? "org" : "appfail"; /* plant:st-land-kinds */
}
/* The provider's page, opened only as src/wire.cjs admits it: https at a sign-in provider's fixed host (tests/no-model.mjs 5z3).
   The opening is awaited, so a system with no browser to open it is said at once, not after the loopback's wait. */
async function openSignInPage(url) {
  const authorize = wire.identityAuthorize(url);
  if (!authorize) return false;
  signInOpened = url;
  try { await shell.openExternal(authorize); } catch { return false; }
  return true;
}
/* The provider's page of the sign-in under way, which Open the browser again opens once more through openSignInPage, admitted
   again by wire.cjs; forgotten as the sign-in ends. */
let signInOpened = "";
/* The loopback of the sign-in under way, which the cover's Close closes (studio:licence-signin-stop). */
let signInLoop = null;
/* THE SIGN-IN LINK for the page that pressed (studio:signin-link): the provider's page as the browser is handed it, sent before the
   browser is asked, so a browser that does not open (Linux answers the call all the same) leaves the lead a link to paste. It
   goes to that page alone and is written nowhere. */
function signInLinkTo(sender, url) {
  const link = wire.identityAuthorize(url);
  try { if (link && sender && !sender.isDestroyed()) sender.send("studio:signin-link", link); } catch { /* the page has gone */ }
}
/* The member key's public half (src/member.mjs), where this Studio has one, for its seat's certificate on a licence that follows Entra;
   "" until member.mjs has loaded once, so a sign-in then names none and the next renewal names it. */
let memberMod = null;
function memberPubNow() {
  if (!memberMod) { memberLib().then((m) => { memberMod = m; }, () => {}); return ""; }
  try { const p = memberMod.memberPublic(memberMod.memberKeyFile(app.getPath("userData"))); return p ? p.key : ""; } catch { return ""; }
}
async function signInIo(sender) {
  const C = await licenceClient();
  return {
    listen: async (pageFor, ends, clean) => { const loop = await wire.identityListen(pageFor, ends, clean); signInLoop = loop; return loop; },
    openPage: (url) => { signInLinkTo(sender, url); return openSignInPage(url); },
    tokenAsk: wire.identityRequest,
    ask: wire.licenceRequest,
    seal: (token) => C.sealRefresh(vault, token),
    unseal: (sealed) => String(vault.open(Buffer.from(String(sealed), "base64"))),
    /* The member key's public half, where this Studio has one, named for its seat's certificate on a licence that follows Entra. */
    member: () => memberPubNow(),
    page: signInPage,
    trace: SIGNIN_TRACE_ASKED ? (line) => { process.stderr.write(line + "\n"); } : null, /* plant:st-trace-wired */
  };
}
/** The providers offered to the page, by name alone, and whether they are the preview's: the configured ones; or, with none
 *  configured and ETIUDA_SIGNIN_PREVIEW=1 at the start, both by name with `signinPreview`, so Max can see the sign-in screens before
 *  a client id exists. The preview signs nobody in: a press is answered "signin-preview" before anything is opened, sent or written. */
async function signInOffer() {
  const C = await licenceClient();
  if (!C.signInPreview(SIGNIN_PREVIEW_ASKED)) return { signIn: C.signInProviders().map((p) => p.id) };
  return { signIn: C.SIGN_IN_PROVIDERS.map((p) => p.id), signinPreview: true };
}
let signInRun = null;
answer("studio:licence-signin", async (e, id) => guard(async () => {
  const C = await licenceClient(), R = await refusal();
  const provider = C.providerOf(String(id == null ? "" : id).slice(0, 40));
  if (!provider && C.signInPreview(SIGNIN_PREVIEW_ASKED) && C.SIGN_IN_PROVIDERS.some((p) => p.id === String(id))) {
    const no = R.refuse(licenceSaid("signin-preview"));
    no.said.why = "signin-preview";
    throw no;
  }
  if (!provider) throw R.refuse(licenceSaid("signin-none"));
  /* One sign-in at a time: a second press while the browser is open waits on the first rather than opening another loopback. */
  if (signInRun) return signInRun;
  let kept = null, flowed = null;
  const io = await signInIo(e.sender);
  /* On a managed computer that is not shared, a sign-in while signed in must bring back the same account (decision 49): by the hash
     kept at its sign-in, before anything is sent; or, signed in before the policy came, by the seat's code the service answers,
     with nothing kept (src/licence-client.mjs signInFlow). Unmanaged, `same` is undefined and the flow is today's. */
  const st0 = readServiceState(), held = st0.by === "signin" && managedHere() && !sharedHere();
  const heldWho = held && typeof st0.signinWho === "string" ? st0.signinWho : "";
  const same = managedHere() ? { who: heldWho, code: held && !heldWho && typeof st0.signinCode === "string" ? st0.signinCode : "" } : undefined;
  /* The service's earlier "access-token" for this sign-in, which puts it on the managed path (src/licence-client.mjs managedScope). */
  const remembered = st0.by === "signin" && st0.signinAccess === true;
  /* The browser's landing page, held at the loopback until the sign-in is taken or refused, says which. */
  const land = (kind) => { if (signInLoop && typeof signInLoop.land === "function") signInLoop.land(kind); }; /* plant:st-land-wired */
  /* An administrator holds no seat (decision 49): the landing says only that Studio has the sign-in and shows the result. */
  signInRun = licenceAct("signin", async (Cl, open) => {
    const r = await Cl.signInFlow(io, provider, open, Date.now, same, remembered);
    flowed = r.answer;
    kept = { refreshSealed: r.refreshSealed || "", seed: r.seed || "", org: r.org || "" };
    if (same && r.who) kept.who = r.who;
    if (r.access === true) kept.access = true;
    return r.answer;
  }, () => kept, provider.id).then((v) => { land(v && v.by === "admin" ? "back" : "seat"); return v; }, (err) => { land(signInLanding(flowed, managedHere())); throw err; })
    .finally(() => { signInRun = null; signInLoop = null; signInOpened = ""; });
  return signInRun;
}));
/* Cancel on the door or in Account while the browser is out: the loopback closes, and the sign-in ends as cancelled, nothing changed. */
answer("studio:licence-signin-stop", async () => guard(async () => {
  if (signInLoop) signInLoop.close();
  return { stopped: !!signInLoop };
}));
/* Open the browser again: the provider's page of the sign-in under way, opened once more by the same door; nothing else. */
answer("studio:licence-signin-again", async () => guard(async () => {
  if (!signInLoop || !signInOpened) return { opened: false };
  return { opened: await openSignInPage(signInOpened) };
}));
/* SIGN OUT (Settings, Account): this computer forgets who signed in. Forgotten: how it was activated (`by`), the provider, the
   sealed refresh token, the sign-in's code, whether this person owns the licence, the organisation the token named, whether the
   licence service asked for its own access token, and any ask to sign in again. Kept: the licence file and the relay grant, the
   signing key, every catalog and team, desk-seats.json and the names written beside lead seats. The lead seat frees itself at the service once it goes unseen. An administrator's sign-in
   (decision 49) is forgotten the same way, with the licence's card, and sends nothing.
   One thing is sent, and only by a Studio whose key ever held a standing door (Hydrogen's review of 2026-11-12, finding 4 (c)): the
   empty set of doors, at the licence service (door/set), so the service stops handing this lead's teams to its licence's desks now
   rather than when the lead's proof lapses; then a sync, which closes the standing doors at the relay (src/relay.mjs keepDoor). A
   service not reached or refusing leaves the sign-out done, says so (`doorsLeft`), and the relay's next sync sets the empty set
   (keepServiceDoors). A Studio that never held a door sends nothing. */
const SIGNED_IN_STATE = ["by", "provider", "refreshSealed", "signinCode", "signinOwner", "signinOrg", "signinAsk", "signinSeed", "signinAskOwner", "signinNaming", "orgDesks", "adminCard", "signinCause", "seatCerts", "signinNoRole", "signinWho", "signinBuy", "signinManaged", "signinNoLicence", "signinAccess"]; /* plant:ma-signout */
answer("studio:licence-signout", async () => guard(async () => {
  /* A managed computer keeps its person signed in unless it is shared (decision 49). */
  if (managedHere() && !sharedHere()) await notManaged(await refusal());
  if (signInLoop) signInLoop.close();
  /* The pseudonym maps belong to the account that listed them; another account signing in without a restart starts with none (board 1017, D5). */
  leadCodes.clear(); peopleByCode.clear(); codeOfPerson.clear(); /* plant:signout-maps */
  const st = readServiceState();
  /* The sealed refresh token goes whatever this Studio was activated by, so a stray one cannot outlive a sign-out. */
  if (st.by === "signin" || st.by === "admin" || st.refreshSealed) {
    const next = Object.assign({}, st);
    if (st.by === "signin" || st.by === "admin") for (const k of SIGNED_IN_STATE) delete next[k]; /* plant:admin-signout */
    delete next.refreshSealed; /* plant:signout-token */
    writeServiceState(next);
  }
  const doors = st.by === "signin" ? await doorsClosedAtSignOut() : true;
  const out = await licenceNow();
  if (!doors) out.doorsLeft = true;
  return out;
}));
/** Whether the doors this key ever held are now closed at the licence service: true where it held none, or the service took the
 *  empty set; false where it could not be told. */
async function doorsClosedAtSignOut() {
  const pub = await leadPub();
  let held = false;
  try { held = !!pub && (await teamStore()).relayTeams(await teamsAt()).some((t) => typeof t.door === "string" && t.door.startsWith(pub + ":")); }
  catch { held = false; }
  if (!held) return true; /* plant:f4c-never */
  let r = null;
  try { r = await serviceDoorsSet([]); } catch { r = null; } /* plant:f4c-send */
  Promise.resolve(relaySync(false, true)).catch(() => {});
  return !!r && r.ok === true;
}
/* NOT NOW on the door: it closes for good on this computer, kept in the store; the rail's Sign in opens it again. */
answer("studio:signin-door", async () => guard(async () => {
  /* The preview's door closes for this start alone, so a look at it leaves the real first door standing on this computer. */
  if ((await signInOffer()).signinPreview) return { closed: true };
  const s = readStore();
  if (s.signinDoor !== "closed") {
    s.signinDoor = "closed";
    if (writeStore(s) === false) throw (await refusal()).refuse("Studio's settings file could not be written, so this change was not saved.");
  }
  return { closed: true };
}));
/* WHAT THIS STUDIO TYPED (board 1017's rule 5: "the owner's own Studio remembering what it typed for its list"): each address an owner named
   or a lead invited, by the handle the service answered, kept in typed-addresses.json beside Studio's settings, on this computer only, and
   forgotten once the service no longer lists the handle. The service keeps only a keyed hash; no request carries this file. */
function typedAt() { return path.join(app.getPath("userData"), "typed-addresses.json"); }
function readTyped() {
  try {
    const s = JSON.parse(fs.readFileSync(typedAt(), "utf8"));
    const part = (o) => (o && typeof o === "object" && !Array.isArray(o) ? o : {});
    return { lead: part(s && s.lead), desk: part(s && s.desk) };
  } catch { return { lead: {}, desk: {} }; }
}
function writeTyped(next) {
  fs.mkdirSync(path.dirname(typedAt()), { recursive: true });
  writeWhole(typedAt(), JSON.stringify(next, null, 1) + "\n");
}
/** One handle's typed address kept, of `kind` "lead" or "desk". */
function keepTyped(kind, handle, entry) {
  const t = readTyped();
  t[kind] = Object.assign({}, t[kind], { [handle]: entry });
  writeTyped(t);
}
/** The handles of `kind` the service no longer lists are forgotten (only after a list it answered). */
function pruneTyped(kind, listed) {
  const t = readTyped(), keep = new Set(listed);
  const next = {};
  for (const h of Object.keys(t[kind])) if (keep.has(h)) next[h] = t[kind][h];
  if (Object.keys(next).length !== Object.keys(t[kind]).length) { t[kind] = next; writeTyped(t); }
}
const TYPED_DAYS_MS = 30 * 86400000;
/* THE OWNER'S LEAD SEATS (decision 15 (b)): a signed-in Studio whose person owns the licence lists its lead seats by code from
   seat/list and frees one by its code (seat/free kind "lead"). Anyone else is shown none, and nothing is sent for them. The page
   hands over only a code; the shell signs. */
async function leadSeatsNow() {
  const st = readServiceState();
  if (st.by !== "signin" || st.signinOwner !== true) return { seats: [] };
  if (!ownerHere(st)) return { seats: [] };
  const open = await leadOpen();
  if (!open) return { seats: [] };
  const C = await licenceClient(), a = await C.seatList(wire.licenceRequest, open, Date.now());
  if (a.ok !== true) return { seats: [], reason: a.reason };
  /* No code reaches the page (board 1017): each seat and colleague by the pseudonym the service gave, the code kept here for the press that
     still needs it (seat/free of a lead seat); each naming waiting by its handle, with the address this Studio typed for it. */
  leadCodes.clear();
  for (const x of a.seats.concat(a.unnamed)) if (x.person) leadCodes.set(x.person, x.code);
  pruneTyped("lead", a.namings.map((n) => n.naming));
  const typed = readTyped().lead;
  const seats = a.seats.filter((x) => x.person).map((x) => { const y = Object.assign({}, x); delete y.code; return y; });
  const unnamed = a.unnamed.filter((x) => x.person).map((x) => ({ person: x.person, seen: x.seen }));
  const namings = a.namings.map((n) => {
    const t = typed[n.naming];
    return Object.assign({}, n, { address: t && typeof t.address === "string" ? t.address : null,
      at: t && Number.isFinite(t.at) ? t.at : Number.isFinite(n.until) ? n.until - TYPED_DAYS_MS : null });
  });
  /* The people on the owner's own teams, by name and address where the service gives them, for the field's matches as the owner types. */
  const ppl = await C.listPeople(wire.licenceRequest, open, Date.now());
  const people = ppl.ok === true ? ppl.people.filter((p) => p.name || p.address).map((p) => ({ person: p.person, name: p.name || null, address: p.address || null })) : [];
  return { seats, counts: a.counts, unnamed, orgDesks: a.orgDesks, namings, people };
}
/* The codes behind the pseudonyms of the last seat list, for seat/free of a lead seat, which the service still takes by code. */
const leadCodes = new Map();
/* A NAMED LEAD'S OWN TEAM (a team is its lead's own; decision 47): for a signed-in lead who does not own the licence, from seat/list,
   the owner's code where the service gives it, this lead's team's seated desks and the licence's desk seats in use; the owner, and a
   Studio not signed in, are answered nothing and nothing is sent for them. */
answer("studio:licence-team", async () => guard(async () => {
  const st = readServiceState();
  if (st.by !== "signin" || st.signinOwner === true || st.signinAskOwner === true) return { team: undefined };
  const open = await leadOpen();
  if (!open) return { team: undefined };
  const a = await (await licenceClient()).seatList(wire.licenceRequest, open, Date.now());
  if (a.ok !== true) return { team: undefined, reason: a.reason };
  const mine = a.seats.find((x) => x.you), owner = a.seats.find((x) => x.owner === true);
  return { team: mine && Number.isInteger(mine.team) ? mine.team : null, owner: !!owner, desks: a.desks || null };
}));
/* THE OWNER NAMES A LEAD BY ADDRESS OR FROM THE LICENCE'S PEOPLE (board 1017; Max, 2026-11-20 22:16, "I definitely agree."): the page hands
   over the address typed, or the pseudonym a list gave, and the shell signs; a naming by address is kept here by its handle with what was
   typed (typed-addresses.json). Withdraw and the owner's confirmation of a candidate by the handle and the pseudonym. No code either way. */
/* `own` is the press's own sentence for every refusal but "full" (Withdraw, Decline and Confirm as lead: "nobody was named" is not true of them). */
const ownerNamingRefused = (R, a, own) => R.refuse(licenceSaid(a && a.reason === "full" && own !== "naming-withdraw-none" ? "lead-name-full" : own ? own : a && a.reason === "no-seat" ? "lead-name-none" : a && a.reason));
answer("studio:licence-name-address", async (e, address) => guard(async () => {
  const R = await refusal(), C = await licenceClient(), st = readServiceState();
  const typed = C.addressForm(typeof address === "string" ? address : "");
  if (st.by !== "signin" || st.signinOwner !== true || !typed) throw R.refuse(licenceSaid(typed ? "lead-name-none" : "lead-name-address"));
  const open = await leadReady(R);
  const a = await C.nameLeadAddress(wire.licenceRequest, open, typed, Date.now());
  if (!a || a.ok !== true) throw ownerNamingRefused(R, a);
  keepTyped("lead", a.naming, { address: typed, at: Date.now() });
  return leadSeatsNow();
}));
answer("studio:licence-name-person", async (e, person) => guard(async () => {
  const R = await refusal(), C = await licenceClient(), st = readServiceState(), p = String(person == null ? "" : person);
  if (st.by !== "signin" || st.signinOwner !== true || !/^[0-9a-f]{64}$/.test(p)) throw R.refuse(licenceSaid("lead-name-none"));
  const open = await leadReady(R);
  const a = await C.nameLeadPerson(wire.licenceRequest, open, p, Date.now());
  if (!a || a.ok !== true) throw ownerNamingRefused(R, a);
  return leadSeatsNow();
}));
answer("studio:licence-naming-withdraw", async (e, naming) => guard(async () => {
  const R = await refusal(), C = await licenceClient(), st = readServiceState(), n = String(naming == null ? "" : naming);
  if (st.by !== "signin" || st.signinOwner !== true || !/^[0-9a-f]{32}$/.test(n)) throw R.refuse(licenceSaid("naming-withdraw-none"));
  const open = await leadReady(R);
  const a = await C.withdrawNaming(wire.licenceRequest, open, n, Date.now());
  if (!a || a.ok !== true) throw ownerNamingRefused(R, a, "naming-withdraw-none");
  return leadSeatsNow();
}));
answer("studio:licence-candidate-confirm", async (e, naming, person) => guard(async () => {
  const R = await refusal(), C = await licenceClient(), st = readServiceState();
  const n = String(naming == null ? "" : naming), p = String(person == null ? "" : person);
  if (st.by !== "signin" || st.signinOwner !== true || !/^[0-9a-f]{32}$/.test(n) || !/^[0-9a-f]{64}$/.test(p)) throw R.refuse(licenceSaid("lead-confirm-none"));
  const open = await leadReady(R);
  const a = await C.confirmLead(wire.licenceRequest, open, n, p, Date.now());
  if (!a || a.ok !== true) throw ownerNamingRefused(R, a, "lead-confirm-none");
  return leadSeatsNow();
}));
/* THE NAMED PERSON'S OWN PRESS (board 1011; Claude alpha's decision of 2026-11-17 13:16): Accept, signed by this Studio's own key, asks the
   service to move this person onto the naming's paid lead seat, their own trial set aside. The check that follows brings the new state; "full"
   (no lead seat free) changed nothing and is said by the same bubble, which the page keeps from the naming's own state. */
answer("studio:licence-accept", async () => guard(async () => {
  const R = await refusal(), C = await licenceClient(), st = readServiceState();
  if (st.by !== "signin" || !st.signinNaming) throw R.refuse(licenceSaid("naming-none"));
  const open = await leadReady(R);
  const a = await C.acceptNaming(wire.licenceRequest, open, Date.now());
  let namingResult = "ok";
  /* "confirm" (board 1017): a naming by an address the provider did not vouch made this person a candidate the owner confirms; it is not the
     full licence's bubble. */
  if (a && a.ok === true && a.accepted === false) namingResult = a.reason === "confirm" ? "confirm" : "full";
  else if (!a || a.ok !== true) throw R.refuse(licenceSaid(a && (a.reason === "no-seat" || a.reason === "held") ? "naming-none" : a && a.reason)); /* plant:acc-refused */
  await licenceOnce(true);
  return Object.assign(await licenceNow(), { namingResult });
}));
/* THE OWNER'S SWITCH, set from Account or answered once when the paid licence first reaches its owner (decision 47's addition):
   `on` true seats colleagues' desks by the organisation. Sent only where it differs from what the service last said; either way this
   Studio does not ask again for this licence (orgDesksAsked, by the licence's reference). */
answer("studio:licence-switch", async (e, on) => guard(async () => {
  const R = await refusal(), C = await licenceClient(), st = readServiceState();
  if (st.by !== "signin" || st.signinOwner !== true || typeof on !== "boolean") throw R.refuse(licenceSaid("switch-owner"));
  let orgDesks = typeof st.orgDesks === "boolean" ? st.orgDesks : null;
  if (orgDesks !== on) {
    const open = await leadReady(R);
    const a = await C.setOrgDesks(wire.licenceRequest, open, on, Date.now());
    if (!a || a.ok !== true) throw R.refuse(licenceSaid(a && a.reason === "no-seat" ? "switch-owner" : a && a.reason));
    orgDesks = a.orgDesks === true;
  }
  const now = readServiceState();
  writeServiceState(Object.assign({}, now, { orgDesks }, now.licenceRef ? { orgDesksAsked: now.licenceRef } : {}));
  return Object.assign(await licenceNow(), { seatsNow: await leadSeatsNow() });
}));
answer("studio:licence-seats", async () => guard(async () => leadSeatsNow()));
answer("studio:licence-seat-free", async (e, person) => guard(async () => {
  const R = await refusal(), C = await licenceClient(), st = readServiceState();
  /* The page names the seat by the pseudonym the list gave; the service frees a lead seat by its code, which stays here (board 1017). */
  const c = leadCodes.get(String(person == null ? "" : person)) || "";
  await notManaged(R);
  if (!ownerHere(st) || !C.SEAT_CODE.test(c)) throw R.refuse(licenceSaid("lead-seat-none"));
  const open = await leadReady(R);
  const a = await C.freeSeat(wire.licenceRequest, open, "lead", c, Date.now());
  if (!a || a.ok !== true) throw R.refuse(licenceSaid(a && a.reason === "no-seat" ? "lead-seat-none" : a && a.reason));
  return leadSeatsNow();
}));
/* A DESK'S SEAT, AS ITS LEAD SEES IT (board 980; src/desk-seat.mjs). The desk signs its person in to the licence service itself
   and writes the seat certificate it is given; this Studio sends nothing for it. Only a lead that signed in reads any of this: its
   hint goes into each invitation and the team file, and at each look of the watch whose folder moved, every roster desk's
   seat.json is checked (the thread's seatProofs) against this Studio's licence reference and the roster's key, and the Desks
   screen says which desks are seated. Free seat frees one at the service by seat/free. A desk is never removed or re-keyed for any
   of it: a removal gives the whole team a new key (Argon 1). The book is desk-seats.json beside Studio's settings, the service's
   pseudonyms, codes and times only, never a token or a name. */
const deskSeatLib = lazy("desk-seat.mjs");
function seatBooksAt() { return path.join(app.getPath("userData"), "desk-seats.json"); }
function readSeatBooks() {
  try { const s = JSON.parse(fs.readFileSync(seatBooksAt(), "utf8")); return s && typeof s === "object" && !Array.isArray(s) ? s : {}; }
  catch { return {}; }
}
function writeSeatBooks(next) {
  fs.mkdirSync(path.dirname(seatBooksAt()), { recursive: true });
  writeWhole(seatBooksAt(), JSON.stringify(next, null, 1) + "\n");
}
/** The hint this Studio's desks are given: its sign-in's provider, admitting its own organisation, or null where it did not sign in. */
async function signinHintNow() {
  const st = readServiceState();
  if (st.by !== "signin" || typeof st.signinOrg !== "string" || !st.signinOrg) return null; /* plant:s3-hint-floor */
  const C = await licenceClient(), D = await deskSeatLib();
  return D.hintFor(C.providerOf(st.provider), st.signinOrg);
}
/** The licence reference a desk's certificate must name: the one this Studio's sign-in answers carried (keepWho), else "". */
function seatRefNow() {
  const st = readServiceState();
  return st.by === "signin" && typeof st.licenceRef === "string" && /^[0-9a-f]{32}$/.test(st.licenceRef) ? st.licenceRef : "";
}
/** One team's desks' seats at the watch: `t` the watched team, `secret` the signing key's. */
async function seatPass(t, secret) {
  const hint = await signinHintNow(), ref = seatRefNow();
  const r = await thread.call("seatProofs", t.folder, await keyFileNow(), secret,
    withHere({ hint, ref, revoked: await revokedKeysNow(), teamKeys: (await teamsNow()).teamKeys }));
  if (!ref || !r || !r.team) return; /* plant:s3-pass-floor */
  const D = await deskSeatLib();
  const books = readSeatBooks(), id = r.team.id;
  const book = D.seatBook(books[id], r.opened, Date.now());
  if (JSON.stringify(books[id] || null) !== JSON.stringify(book)) writeSeatBooks(Object.assign(readSeatBooks(), { [id]: book }));
}
/** Where each desk of team `teamId` stands with its seat, for the Desks screen: {desk id: state}, and whether the lead signed in. */
async function seatsShown(teamId) {
  const st = readServiceState(), book = readSeatBooks()[teamId];
  const out = {};
  const desks = book && book.desks && typeof book.desks === "object" ? book.desks : {};
  /* Free seat is offered only where the service would free it (decision 46): to the licence's owner for every desk, and to another
     lead for a person this Studio admitted by code. A person it admitted whom the organisation also seats is still refused, and said. */
  const owner = ownerHere(st), people = owner ? null : readTeamPeople();
  for (const d of Object.keys(desks)) if (desks[d] && typeof desks[d].state === "string") {
    out[d] = { state: desks[d].state, held: !!desks[d].seat, free: !!desks[d].seat && (owner || admittedHere(desks[d].seat, people)) }; /* plant:s46-free-shown */
  }
  return { signedIn: st.by === "signin", desks: out };
}
/* The lead frees a desk's seat at once (Claude alpha's decision 14; the join's seat/free route), by the pseudonym its certificate
   names the person by: the seat stops counting now, the desk stays on the roster as it is, and only its person's interactive
   sign-in takes a seat again. */
answer("studio:seat-free", async (e, dir, desk) => guard(async () => {
  const R = await refusal(), C = await licenceClient(), D = await deskSeatLib();
  const project = projectDir(dir), id = String(desk || "");
  const facts = await thread.call("teamFacts", project, withHere({ key: await keyFileNow() }));
  const teamId = facts && facts.team && typeof facts.team.id === "string" ? facts.team.id : "";
  const books = readSeatBooks(), entry = teamId && books[teamId] && books[teamId].desks ? books[teamId].desks[id] : null;
  if (!entry || !entry.seat) throw R.refuse(licenceSaid("seat-none"));
  /* Decision 46: a lead who does not own the licence frees only a person it admitted by code, so for anyone else nothing is sent. */
  const st = readServiceState();
  if (!ownerHere(st) && !admittedHere(entry.seat, readTeamPeople())) throw R.refuse(licenceSaid("seat-owner")); /* plant:s46-free-ask */
  const open = await leadReady(R);
  const a = await C.freeSeat(wire.licenceRequest, open, "desk", entry.seat, Date.now());
  /* "no-seat" is a seat already gone from this licence; the service's refusal is "not-yours", said, and the book left as it was. */
  if (!a || (a.ok !== true && a.reason !== "no-seat")) throw R.refuse(licenceSaid(a && (C.SEAT_REFUSED[a.reason] || a.reason)));
  writeSeatBooks(Object.assign(readSeatBooks(), { [teamId]: D.seatFreed(books[teamId], entry.seat, Date.now()) }));
  return withLapse(await desksNow(project));
}));
/* THE LEAD'S LIST OF PEOPLE WHO SIGNED IN, AND ADMITTING ONE (board 980; the product designer's handoff, section 6; night decision
   20 (c)). A signed-in lead is shown, on a team's screen, the people of its licence's organisations whose desk signed in (person/list),
   by code and day, and admits one from the list or by the code a person gives (person/admit). The admission is recorded here as the
   person's per-licence pseudonym under the team, in team-people.json beside Studio's settings, which the watch reads (src/studio.mjs
   watchAdmit) to let in, with nobody acting, a desk whose certificate names that person, its first desk included. The page hands over
   a code alone and is handed codes and days; no request carries a name. */
function teamPeopleAt() { return path.join(app.getPath("userData"), "team-people.json"); }
function readTeamPeople() {
  try { const s = JSON.parse(fs.readFileSync(teamPeopleAt(), "utf8")); return s && typeof s === "object" && !Array.isArray(s) ? s : {}; }
  catch { return {}; }
}
/** The person desk `deskId` of team `teamId` belongs to, as the seat book `books` (or the one on disk) last heard it, or "". A seat
 *  freed, or a certificate run out, holds no `seat`; the person is still known by `freed` or `last`. */
function personOfDesk(teamId, deskId, books) {
  const book = (books || readSeatBooks())[teamId], entry = book && book.desks ? book.desks[deskId] : null;
  const who = entry ? entry.seat || (entry.freed && entry.freed.seat) || entry.last || "" : "";
  return /^[0-9a-f]{64}$/.test(who) ? who : "";
}
/** The other desks of team `teamId` the seat book names for desk `deskId`'s person, the person's other computers there. */
function desksOfPerson(teamId, deskId) {
  const books = readSeatBooks(), who = personOfDesk(teamId, deskId, books), book = books[teamId];
  if (!who || !book || !book.desks || typeof book.desks !== "object") return [];
  return Object.keys(book.desks).filter((d) => d !== deskId && personOfDesk(teamId, d, books) === who);
}
/** The ids of the teams this Studio leads or watches, folder and relay alike, as its teams file holds them. */
async function heldTeamIds() {
  const K = await teamStore(), at = await teamsAt();
  return new Set(K.watchedTeams(at).map((t) => t.team).concat(K.relayTeams(at).map((t) => t.team)));
}
/** Whether `person` is in one of this lead's teams other than `teamId` (decision 27 (a)): admitted there by code and not
 *  marked removed, or named by a desk of that team's seat book. */
function inOtherTeams(person, teamId, held, people, books) {
  for (const id of held) {
    if (id === teamId) continue;
    const e = people[id] && typeof people[id] === "object" ? people[id][person] : null;
    /* A Join no read naming that team has confirmed since (src/desk-seat.mjs joinedPeople's `unsure`) is no team they are still in (the test
       architect's read of ff35a9e5, finding 5). */
    if (e && typeof e === "object" && !Number.isFinite(e.removed) && !(e.via === "join" && e.unsure === true)) return true; /* plant:jd-shell-unsure */
    const desks = books[id] && books[id].desks && typeof books[id].desks === "object" ? books[id].desks : {};
    if (Object.keys(desks).some((d) => personOfDesk(id, d, books) === person)) return true;
  }
  return false;
}
/** Whether this Studio admitted `person` by code to any of its teams, so the service holds an admission of theirs that is this
 *  lead's own (person/admit, decision 27 (a)). */
function admittedHere(person, people) {
  /* A person kept from the lead's list as seated by their own Join (board 1017) is this lead's admission too: their Remove withdraws it. */
  return Object.values(people).some((m) => m && typeof m === "object" && m[person] && (typeof m[person].code === "string" || m[person].via === "join")); /* plant:jd-shell-here */
}
/** What Remove of each roster desk of team `teamId` will do, for the confirmation (decision 27; the page's teamCoverHtml): the
 *  computers of the desk's person on this team (`roster`, the ids on it now), whether this lead's admission of them goes
 *  ("licence"), stays as they are in another of this lead's teams ("kept"), or is not this lead's at all ("team"), and their
 *  sign-in code, which the owner's page finds among the lead seats. A desk whose person the book does not know has no entry. */
async function removalShown(teamId, roster) {
  const books = readSeatBooks(), people = readTeamPeople(), held = await heldTeamIds();
  /* On a relay team a person still in another team is taken off this one at the service (forgetAdmitted's `unplace`), and the words say so
     before the press (Claude alpha's condition 2 on person/withdraw's team, 2026-11-22). */
  const relay = !!(await relayIdOf(teamId));
  const ids = new Set((Array.isArray(roster) ? roster : []).map((m) => m && m.id).filter(Boolean));
  const out = {};
  let leads;
  for (const d of ids) {
    const who = personOfDesk(teamId, d, books);
    if (!who) continue;
    const computers = [...ids].filter((x) => personOfDesk(teamId, x, books) === who).length;
    const mine = admittedHere(who, people);
    const scope = !mine ? "team" : inOtherTeams(who, teamId, held, people, books) ? "kept" : "licence";
    const code = codeOfDesk(teamId, d, books, people);
    if (leads === undefined) leads = await leadCodesNow(false);
    /* The code stays here: the page is told only whether the person holds a lead seat (board 1017). */
    out[d] = Object.assign({ computers, scope, lead: leads ? !!code && leads.has(code) : null }, scope === "kept" && relay ? { unplace: true } : {}); /* plant:jd-shell-says-unplace */
  }
  return out;
}
/** The sign-in code of desk `deskId`'s person: its certificate's, as the seat book holds it, else the one this Studio admitted them by. */
function codeOfDesk(teamId, deskId, books, people) {
  const who = personOfDesk(teamId, deskId, books);
  if (!who) return "";
  const entry = books[teamId] && books[teamId].desks ? books[teamId].desks[deskId] || {} : {};
  return (typeof entry.code === "string" && entry.code) || Object.values(people)
    .map((m) => m && typeof m === "object" && m[who] && typeof m[who].code === "string" ? m[who].code : "").find(Boolean) || "";
}
/* WHO HOLDS ANOTHER LEAD SEAT ON THE LICENCE, by code (seat/list; the owner is answered in full, another lead the codes alone):
   decision 29 (b), Claude alpha's words: "A lead who is not the owner cannot remove another lead, from the team or the licence".
   Kept for LEAD_CODES_MS, so a look at the Desks screen asks once in a while; `fresh` asks now, as Remove's press does. A service
   not reached leaves what was last heard, and null where nothing was: then nobody is known to be a lead. */
const LEAD_CODES_MS = 5 * 60000;
let leadCodesKept = { at: 0, codes: null };
async function leadCodesNow(fresh) {
  if (readServiceState().by !== "signin") return null;
  if (!fresh && leadCodesKept.codes && Date.now() - leadCodesKept.at < LEAD_CODES_MS) return leadCodesKept.codes;
  const open = await leadOpen();
  if (!open) return leadCodesKept.codes;
  let a = null;
  try { a = await (await licenceClient()).seatList(wire.licenceRequest, open, Date.now()); } catch { a = null; }
  if (!a || a.ok !== true) return leadCodesKept.codes;
  leadCodesKept = { at: Date.now(), codes: new Set(a.seats.filter((s) => !s.you).map((s) => s.code)) };
  return leadCodesKept.codes;
}
/** Whether this Studio, signed in and not the licence's owner, must keep desk `deskId` of team `teamId` on it: its person holds
 *  another lead seat on the licence, as seat/list says now (decision 29 (b)). */
async function leadStays(teamId, deskId) {
  const st = readServiceState();
  if (st.by !== "signin" || ownerHere(st)) return false;
  const code = codeOfDesk(teamId, deskId, readSeatBooks(), readTeamPeople());
  const leads = code ? await leadCodesNow(true) : null;
  return !!leads && leads.has(code);
}
/** The person a removed desk's certificate named, as the seat book last heard it, marked removed for team `teamId`: no desk of
 *  theirs is let in by its certificate, whatever another of their desks holds, until the lead admits them again (person-admit
 *  writes the entry afresh). The relay refuses a removed key at its door but cannot see that person's next desk, so Studio does
 *  not let it in by itself. */
async function forgetAdmitted(teamId, deskId) {
  const all = readTeamPeople(), books = readSeatBooks();
  const who = personOfDesk(teamId, deskId, books);
  /* The desk is off the roster now, so its book holds it no longer: the next seat pass would drop it, and until then it would
     still count its person as in this team (inOtherTeams, when the lead next removes them from another). */
  const book = books[teamId];
  if (book && book.desks && typeof book.desks === "object" && book.desks[deskId]) {
    const desks = Object.assign({}, book.desks);
    delete desks[deskId];
    writeSeatBooks(Object.assign(readSeatBooks(), { [teamId]: Object.assign({}, book, { desks }) }));
  }
  if (!who) return;
  const mine = Object.assign({}, all[teamId] || {});
  const prior = mine[who] && typeof mine[who] === "object" ? mine[who] : {};
  /* Admitted by this lead, by code or from the list, to any of its teams: the service's admission is withdrawn too, owed
     (`withdraw`) until it answers, but only where the person is left in none of this lead's teams (decision 27 (a)); still in
     another, they leave this team alone and keep their seat. */
  const owed = prior.withdraw === true || (admittedHere(who, all) && !inOtherTeams(who, teamId, await heldTeamIds(), all, books));
  /* STILL IN ANOTHER TEAM, ON A RELAY TEAM (board 1017's B; the test architect's read of ec990251): the service is still asked to take them off
     this team alone (`unplace`, person/withdraw with the team), so the lead's other computer no longer sees them on it, and a Join of theirs
     after that is the only thing that puts them back (src/desk-seat.mjs joinedPeople). */
  /* Always on a relay team, the withdrawal or not (the test architect's read of ff35a9e5, finding 3): a withdrawal the service keeps (an owner, a
     co-lead) leaves the placement, which the unplace then takes. */
  const unplace = !!(await relayIdOf(teamId)); /* plant:jd-shell-unplace */
  const fresh = Object.assign({}, prior, { removed: Date.now() }, owed ? { withdraw: true } : {}, unplace ? { unplace: true } : {});
  delete fresh.ackAt;
  mine[who] = fresh;
  fs.mkdirSync(path.dirname(teamPeopleAt()), { recursive: true });
  writeWhole(teamPeopleAt(), JSON.stringify(Object.assign(all, { [teamId]: mine }), null, 1) + "\n");
}
/* THE LEAD'S BOOKS BROUGHT BACK WITH THE KEY'S BACKUP COPY (Hydrogen's review of 2026-11-12, finding 4 (b); src/studio.mjs
   peopleRowForBackup): a person or a desk this computer already has an entry for keeps it, as what was done here is newer than the
   copy; one it has none for takes the copy's. So on a second computer the lead's own admissions are known as its own, a Remove there
   withdraws them at the service, and a person removed on the first stays removed. A withdrawal the copy still owed is owed here. */
function peopleBack(row) {
  const fill = (have, got) => { const out = Object.assign({}, have); for (const k of Object.keys(got || {})) if (!(k in out)) out[k] = got[k]; return out; };
  try {
    const people = readTeamPeople(), gotPeople = row && row.people ? row.people : {};
    let peopleMoved = false;
    for (const id of Object.keys(gotPeople)) {
      const next = fill(people[id] && typeof people[id] === "object" ? people[id] : {}, gotPeople[id]);
      if (JSON.stringify(next) !== JSON.stringify(people[id] || {})) { people[id] = next; peopleMoved = true; }
    }
    if (peopleMoved) {
      fs.mkdirSync(path.dirname(teamPeopleAt()), { recursive: true });
      writeWhole(teamPeopleAt(), JSON.stringify(people, null, 1) + "\n");
    }
    const books = readSeatBooks(), gotSeats = row && row.seats ? row.seats : {};
    let seatsMoved = false;
    for (const id of Object.keys(gotSeats)) {
      const was = books[id] && typeof books[id] === "object" ? books[id] : {};
      const desks = fill(was.desks && typeof was.desks === "object" ? was.desks : {}, gotSeats[id] && gotSeats[id].desks);
      if (JSON.stringify(desks) !== JSON.stringify(was.desks || {})) { books[id] = Object.assign({}, was, { desks }); seatsMoved = true; }
    }
    if (seatsMoved) writeSeatBooks(books);
    if (peopleMoved) withdrawOwed();
  } catch (err) { process.stderr.write("studio  the books of people the backup copy carried could not be kept: " + String(err && err.message || err) + "\n"); }
}
/* REMOVE MEANS OUT (night decision 22): a person marked removed with `withdraw` owed has their admission by name withdrawn at the
   service (person/withdraw, by the pseudonym), so they take no seat on the licence until a lead admits them again. A pass runs after
   each Remove and at each look of the watch, never awaited by either; a service not reached, or a lead it refuses, leaves the rest
   owed for the next look. Admissions and withdrawals take turns, so neither lands on the service out of the order the lead acted in. */
let peopleTurn = Promise.resolve(), withdrawRun = null, withdrawAgain = false;
/* How long a Remove on a relay team waits for the pass that tells the service, at most (removeDeskNow): the service not answering never holds it longer. */
const UNPLACE_WAIT_MS = 3000;
function peopleInTurn(fn) {
  const run = peopleTurn.then(fn, fn);
  peopleTurn = run.catch(() => {});
  return run;
}
function withdrawOwed() {
  if (withdrawRun) { withdrawAgain = true; return withdrawRun; }
  withdrawRun = activeTeamActs.exit(() => peopleInTurn(withdrawPass))
    .catch((err) => { process.stderr.write("studio  an admission could not be withdrawn: " + String(err && err.message || err) + "\n"); })
    .finally(() => { withdrawRun = null; if (withdrawAgain) { withdrawAgain = false; withdrawOwed(); } });
  return withdrawRun;
}
async function withdrawPass() {
  if (readServiceState().by !== "signin") return;
  const owedOf = (e) => !!e && typeof e === "object" && e.withdraw === true && Number.isFinite(e.removed);
  const unplaceOf = (e) => !!e && typeof e === "object" && e.unplace === true && Number.isFinite(e.removed);
  const owed = new Set(), unplaced = [];
  for (const [id, mine] of Object.entries(readTeamPeople())) {
    if (!mine || typeof mine !== "object") continue;
    for (const p of Object.keys(mine)) {
      if (!/^[0-9a-f]{64}$/.test(p)) continue;
      if (owedOf(mine[p])) owed.add(p);
      if (unplaceOf(mine[p])) unplaced.push([id, p]); /* plant:jd-shell-both */
    }
  }
  if (!owed.size && !unplaced.length) return;
  const open = await leadOpen();
  if (!open) return;
  const C = await licenceClient();
  /* Each answered removal marks when the service took it (`ackAt`, this computer's clock): a list asked after that shows the person on the team
     only through a place made since (src/desk-seat.mjs joinedPeople). Read again before each write, so an entry the lead admitted afresh meanwhile
     is left as the admission wrote it. */
  const settle = (match, flag) => {
    const all = readTeamPeople(), at = Date.now();
    for (const id of Object.keys(all)) {
      if (!all[id] || typeof all[id] !== "object") continue;
      for (const p of Object.keys(all[id])) {
        if (!match(id, p, all[id][p])) continue;
        const done = Object.assign({}, all[id][p], { ackAt: at });
        delete done[flag];
        all[id] = Object.assign({}, all[id], { [p]: done });
      }
    }
    writeWhole(teamPeopleAt(), JSON.stringify(all, null, 1) + "\n");
  };
  for (const p of owed) {
    const a = await C.withdrawPerson(wire.licenceRequest, open, p, Date.now());
    if (!a || a.ok !== true) return;
    settle((id, q, e) => q === p && owedOf(e), "withdraw");
  }
  for (const [id, p] of unplaced) {
    const a = await C.withdrawPerson(wire.licenceRequest, open, p, Date.now(), id); /* plant:jd-shell-unplace-send */
    if (!a || a.ok !== true) return;
    settle((tid, q, e) => tid === id && q === p && unplaceOf(e), "unplace");
  }
}
/* THE DOORS AT THE LICENCE SERVICE (board 980, the door-finding): what the relay runner hands after a sync, this lead key's open
   doors, set at the service under the lead's key (door/set). {ok} as the service answers, or not ok where the key does not open. */
async function serviceDoorsSet(doors) {
  const open = await leadOpen();
  if (!open) return { ok: false, reason: "key" };
  return (await licenceClient()).setDoors(wire.licenceRequest, open, doors, Date.now());
}
/** The id of the team the catalog at `project` publishes to, as teamFacts reads it, or "". The
 *  directory is one this Studio lists, the same rule as every other handler that reads a catalog
 *  the page names, and the refusal comes before the read. */
async function teamIdOf(project) {
  const home = projectDir(project); /* plant:txic-people */
  const facts = await thread.call("teamFacts", home, withHere({ key: await keyFileNow() }));
  return facts && facts.team && typeof facts.team.id === "string" ? facts.team.id : "";
}
const peopleByCode = new Map(), codeOfPerson = new Map();
/** The team's relay id where it is a relay team of this Studio (a relay row in the teams file), else null: every team id is t- and 16 hex,
 *  so the id alone says nothing; a folder team has no relay door at the service (board 1017, finding B). */
async function relayIdOf(teamId) {
  const K = await teamStore();
  return K.relayTeams(await teamsAt()).some((t) => t.team === teamId) ? teamId : null;
}
/* A MEMBER SEATED BY THEIR OWN JOIN IS LET IN AT THEIR RELAY TEAM'S DOOR (board 1017, fold 95's B; Max, 2026-11-16: "one seamless step,
   optimally without any codes to write down or share with other people"). The lead's list (person/list) names every person an admission of this
   lead's placed on one of its own teams, with that team, whether the seat is held now and when they were placed. The watch reads it only at a
   look whose first pass refused a request (src/desk-seat.mjs doorLook), never on a quiet look, and keeps in team-people.json each person listed
   as added, seated and on that team (joinedPeople), as admit-by-code's entry is kept; a kept Join the list no longer shows so goes. The reads are
   spaced JOIN_MIN_MS and at most JOIN_HOUR_MAX in the hour, below the route's sixty per lead and per address (the test architect's finding 3 on
   c2ccb0e1); the people screen's reads are its own. */
const JOIN_MIN_MS = 500, JOIN_HOUR_MAX = 30, HOUR_MS = 3600000;
let joinList = { at: 0, people: null }, joinRelook = null, joinReads = [];
/** The lead's list as read at or after `since` (one the people screen made then counts), else read now: `{at, people}`; null where no read may
 *  be made now (within JOIN_MIN_MS of the last, past JOIN_HOUR_MAX in the hour, or the service not reached after an earlier answer); false where
 *  no list is to be had at all (no relay team of this Studio, not signed in, no lead key open, never answered). */
async function joinedFresh(teamId, since) {
  if (!(await relayIdOf(teamId)) || readServiceState().by !== "signin") return false;
  if (joinList.people && joinList.at >= since) return joinList;
  const now = Date.now();
  joinReads = joinReads.filter((x) => now - x < HOUR_MS);
  if (now - joinList.at < JOIN_MIN_MS || joinReads.length >= JOIN_HOUR_MAX) return null; /* plant:jd-shell-budget */
  const open = await leadOpen();
  if (!open) return false;
  const at = Date.now();
  joinReads.push(at);
  let a = null;
  try { a = await (await licenceClient()).listPeople(wire.licenceRequest, open, at); } catch { a = null; }
  if (!a || a.ok !== true) return joinList.people ? null : false;
  joinList = { at, people: a.people };
  return joinList;
}
/** A look at team row `t` set for when the next read of the list may be made, one at a time. */
function joinRelookFor(t) {
  if (joinRelook) return;
  const now = Date.now(), next = Math.max(joinList.at + JOIN_MIN_MS, joinReads.length >= JOIN_HOUR_MAX ? joinReads[0] + HOUR_MS : 0);
  joinRelook = setTimeout(() => { joinRelook = null; teamWatch(t.folder); }, Math.max(1000, next - now + 200));
}
async function joinedKept(teamId, people, at) {
  const next = (await deskSeatLib()).joinedPeople(readTeamPeople(), teamId, people, at); /* plant:jd-shell-pass */
  if (!next) return;
  fs.mkdirSync(path.dirname(teamPeopleAt()), { recursive: true });
  writeWhole(teamPeopleAt(), JSON.stringify(next, null, 1) + "\n");
}
/* An ask lives thirty days at the service (core.mjs ASK_DAYS); when it was made is its end less that. */
const ASK_SHOWN_MS = 30 * 86400000;
answer("studio:people-list", async (e, dir) => guard(async () => {
  const st = readServiceState(), project = String(dir == null ? "" : dir);
  if (st.by !== "signin") return { people: [] };
  const teamId = await teamIdOf(project);
  if (!teamId) return { people: [] };
  const open = await leadOpen();
  if (!open) return { people: [] };
  /* Dated from when it was asked, not when the answer came (the test architect's finding 5 on c2ccb0e1). */
  const listAt = Date.now(); /* plant:jd-shell-asked */
  const a = await (await licenceClient()).listPeople(wire.licenceRequest, open, listAt);
  if (a.ok !== true) return { people: [], reason: a.reason };
  for (const p of a.people) { peopleByCode.set(p.code, p.person); codeOfPerson.set(p.person, p.code); }
  /* The read is the watch's too: the Joins it names on this relay team are kept now (joinedFresh). */
  joinList = { at: listAt, people: a.people };
  if (await relayIdOf(teamId)) await joinedKept(teamId, a.people, listAt);
  /* Someone already admitted to this team, or whose desk on it holds a seat, is not asked about again; one marked removed is.
     Where a coming seat reduction is known, seated people stay in the list (marked `seated`) so the lead can mark who stays. */
  const admitted = readTeamPeople()[teamId] || {}, book = readSeatBooks()[teamId];
  const seated = new Set(Object.values(book && book.desks && typeof book.desks === "object" ? book.desks : {}).map((x) => x && x.seat).filter(Boolean));
  const inTeam = (p) => !!admitted[p] && !Number.isFinite(admitted[p].removed);
  const red = a.reduction || null;
  const list = red ? a.people : a.people.filter((p) => !inTeam(p.person) && !seated.has(p.person));
  /* No code reaches the page (board 1017): each row by the person's pseudonym, with the name and address the service gives for someone added,
     and whether it is the owner's own (by the code kept here). */
  const rows = list.map((p) => Object.assign({ person: p.person, signedIn: p.signedIn },
    p.name ? { name: p.name } : {}, p.address ? { address: p.address } : {},
    st.signinOwner === true && typeof st.signinCode === "string" && p.code === st.signinCode ? { owner: true } : {},
    p.added === false ? { added: false } : {},
    p.waiting === true ? { waiting: true } : {} /* plant:seat-wait-shell-list */,
    typeof p.stays === "boolean" ? { stays: p.stays } : {},
    red && (inTeam(p.person) || seated.has(p.person)) ? { seated: true } : {}));
  const staysKept = red && Array.isArray(a.staysKept) ? a.staysKept.filter((p) => typeof p === "string" && /^[0-9a-f]{64}$/.test(p)) : []; /* plant:seat-team-shell-kept */
  /* Board 1017's member invitation: the invitations this Studio typed for this team, waiting, with the address typed and when; and the Joins
     on an address nobody vouched (source "unconfirmed") for this team, each with what the provider says of the person. */
  const relayId = await relayIdOf(teamId);
  pruneTyped("desk", a.invites.map((x) => x.invite));
  const typedDesk = readTyped().desk;
  const invites = a.invites.filter((x) => typedDesk[x.invite] && typedDesk[x.invite].team === teamId)
    .map((x) => ({ invite: x.invite, address: String(typedDesk[x.invite].address || ""), at: Number(typedDesk[x.invite].at) || null, until: x.until, claimed: x.claimed }));
  /* A relay team shows the Joins that came to its own relay id. A Join with no team belonged to the first team kept for a shared folder
     (board 1017, B2); no such team is listed any more (the folder team's removal), so none is shown there. */
  const confirms = a.asks.filter((x) => x.source === "unconfirmed" && x.kind === "desk" && !!relayId && x.team === relayId)
    .map((x) => ({ ask: x.ask, person: x.person, name: x.name, address: x.address, provider: x.provider, account: x.account, domain: x.domain,
      claimants: x.claimants, at: x.until ? x.until - ASK_SHOWN_MS : null }));
  return Object.assign({ people: rows, invites, confirms, relay: !!relayId }, red ? { reduction: red } : {}, staysKept.length ? { staysKept } : {}); /* plant:seat-team-shell-list */
}));
answer("studio:person-admit", async (e, dir, code, from) => guard(async () => {
  const R = await refusal(), C = await licenceClient(), st = readServiceState();
  const project = String(dir == null ? "" : dir), none = "person-lead";
  const refuseFor = (reason) => { const no = R.refuse(licenceSaid(reason)); no.said.why = reason; return no; };
  if (st.by !== "signin") throw refuseFor("person-lead"); /* plant:wf-refuse */
  const teamId = await teamIdOf(project);
  if (!teamId) throw refuseFor("person-lead");
  const open = await leadReady(R);
  /* In turn with any withdrawal under way (withdrawOwed), so the admission is the later of the two at the service and here. */
  const a = await peopleInTurn(async () => {
    /* The page names the person by pseudonym; the service still admits by the code the list gave, which stays here (board 1017). */
    const got = await C.admitPerson(wire.licenceRequest, open, codeOfPerson.get(String(code == null ? "" : code)) || "", Date.now());
    if (!got || got.ok !== true) return got;
    const all = readTeamPeople();
    /* The service's admission is the licence's: admitted again, no other team's removal still owes its withdrawal. */
    for (const id of Object.keys(all)) {
      const e = all[id] && typeof all[id] === "object" ? all[id][got.person] : null;
      if (e && typeof e === "object" && e.withdraw === true) { const kept = Object.assign({}, e); delete kept.withdraw; all[id] = Object.assign({}, all[id], { [got.person]: kept }); }
    }
    const mine = Object.assign({}, all[teamId] || {});
    mine[got.person] = { code: got.admitted, at: Date.now() };
    fs.mkdirSync(path.dirname(teamPeopleAt()), { recursive: true });
    writeWhole(teamPeopleAt(), JSON.stringify(Object.assign(all, { [teamId]: mine }), null, 1) + "\n");
    return got;
  });
  if (!a || a.ok !== true) throw refuseFor(a && a.reason === "no-seat" ? none : (a && a.reason) || "unreached");
  /* A desk of that person already asking is let in now, not at the next look; not awaited, the watch says its own failures. */
  const watched = (await teamStore()).watchedTeams(await teamsAt()).find((t) => t.team === teamId);
  if (watched) teamWatch(watched.folder);
  return { admitted: a.person };
}));
/* BOARD 1017'S MEMBER INVITATION (Claude alpha, 00:58: "a lead invites a member by email address from Studio's roster"): the address typed
   goes to the service's invite route with the team's relay id where it has one, and is kept here by the handle; Withdraw by the handle; an
   unvouched Join confirmed (person/admit by ask) or declined (ask/refuse). No mail is sent and no code is shown. */
async function teamActReady(R, dir, act) {
  const st = readServiceState(), none = "person-lead-" + act;
  if (st.by !== "signin") throw R.refuse(licenceSaid(none));
  const teamId = await teamIdOf(String(dir == null ? "" : dir));
  if (!teamId) throw R.refuse(licenceSaid(none));
  return { teamId, open: await leadReady(R), relayId: (await relayIdOf(teamId)) || undefined };
}
answer("studio:person-invite", async (e, dir, address) => guard(async () => {
  const R = await refusal(), C = await licenceClient(), typed = C.addressForm(typeof address === "string" ? address : "");
  const project = String(dir == null ? "" : dir);
  if (!typed) throw R.refuse(licenceSaid("lead-name-address"));
  const { teamId, open, relayId } = await teamActReady(R, project, "invite");
  /* An address is offered on a relay team alone (board 1017, finding B). */
  if (!relayId) throw R.refuse(licenceSaid("person-invite-folder")); /* plant:invite-folder */
  const a = await C.invitePerson(wire.licenceRequest, open, typed, relayId, Date.now());
  if (!a || a.ok !== true) throw R.refuse(licenceSaid(a && a.reason === "no-seat" ? "person-lead-invite" : a && a.reason));
  keepTyped("desk", a.invite, { address: typed, at: Date.now(), team: teamId });
  return { invite: a.invite };
}));
answer("studio:person-invite-withdraw", async (e, dir, invite) => guard(async () => {
  const R = await refusal(), C = await licenceClient(), h = String(invite == null ? "" : invite);
  const project = String(dir == null ? "" : dir);
  if (!/^[0-9a-f]{32}$/.test(h)) throw R.refuse(licenceSaid("person-lead-withdraw"));
  const { open } = await teamActReady(R, project, "withdraw");
  const a = await C.withdrawInvite(wire.licenceRequest, open, h, Date.now());
  if (!a || a.ok !== true) throw R.refuse(licenceSaid(a && a.reason === "no-seat" ? "person-lead-withdraw" : a && a.reason));
  pruneTyped("desk", Object.keys(readTyped().desk).filter((x) => x !== h));
  return { withdrawn: true };
}));
answer("studio:person-confirm", async (e, dir, ask) => guard(async () => {
  const R = await refusal(), C = await licenceClient(), id = String(ask == null ? "" : ask);
  const project = String(dir == null ? "" : dir);
  if (!/^[0-9a-f]{32}$/.test(id)) throw R.refuse(licenceSaid("person-lead-confirm"));
  const { open, relayId } = await teamActReady(R, project, "confirm");
  const a = await C.admitAsk(wire.licenceRequest, open, id, relayId, Date.now());
  if (!a || a.ok !== true) throw R.refuse(licenceSaid(a && a.reason === "no-seat" ? "person-lead-confirm" : a && a.reason));
  /* The confirm seats the person on this team: the list read before it no longer says so, so the watch's next look reads it afresh (joinedFresh). */
  joinList = Object.assign({}, joinList, { at: 0 }); /* plant:jd-shell-confirm */
  return { confirmed: true };
}));
answer("studio:person-decline", async (e, dir, ask) => guard(async () => {
  const R = await refusal(), C = await licenceClient(), id = String(ask == null ? "" : ask);
  const project = String(dir == null ? "" : dir);
  if (!/^[0-9a-f]{32}$/.test(id)) throw R.refuse(licenceSaid("person-lead-decline"));
  const { open } = await teamActReady(R, project, "decline");
  const a = await C.refuseAsk(wire.licenceRequest, open, id, Date.now());
  if (!a || a.ok !== true) throw R.refuse(licenceSaid(a && a.reason === "no-seat" ? "person-lead-decline" : a && a.reason));
  return { declined: true };
}));
answer("studio:seat-stay", async (e, dir, codes) => guard(async () => {
  const R = await refusal(), C = await licenceClient(), st = readServiceState();
  const project = String(dir == null ? "" : dir);
  if (st.by !== "signin") throw R.refuse(licenceSaid("not-lead"));
  const teamId = await teamIdOf(project);
  if (!teamId) throw R.refuse(licenceSaid("not-lead"));
  if (!Array.isArray(codes) || codes.length > 500) throw R.refuse(licenceSaid("stay-none"));
  const open = await leadReady(R);
  const admitted = readTeamPeople()[teamId] || {}, book = readSeatBooks()[teamId];
  const desks = book && book.desks && typeof book.desks === "object" ? book.desks : {};
  const persons = [], seen = new Set();
  for (const raw of codes) {
    if (typeof raw !== "string") throw R.refuse(licenceSaid("stay-none"));
    const s = raw.trim();
    let person = /^[0-9a-f]{64}$/.test(s) ? s : peopleByCode.get(s.toUpperCase().replace(/[\s-]+/g, "")) || "";
    if (!person) {
      const norm = s.toUpperCase().replace(/[\s-]+/g, "");
      for (const [pHex, rec] of Object.entries(admitted)) {
        if (rec && rec.code === norm && /^[0-9a-f]{64}$/.test(pHex)) { person = pHex; break; }
      }
    }
    if (!person) {
      const norm = s.toUpperCase().replace(/[\s-]+/g, "");
      for (const d of Object.values(desks)) {
        if (d && d.code === norm && typeof d.seat === "string" && /^[0-9a-f]{64}$/.test(d.seat)) { person = d.seat; break; }
      }
    }
    if (!/^[0-9a-f]{64}$/.test(person)) throw R.refuse(licenceSaid("stay-none"));
    if (!seen.has(person)) { seen.add(person); persons.push(person); }
  }
  const a = await C.seatStay(wire.licenceRequest, open, "desk", persons, Date.now());
  if (!a || a.ok !== true) throw R.refuse(licenceSaid(a && (C.STAY_REFUSED[a.reason] || a.reason))); /* plant:seat-team-shell-stay */
  return { stays: a.stays };
}));
answer("studio:licence-check", async () => guard(async () => {
  const K = await teamStore(), at = await teamsAt();
  for (const t of K.relayTeams(at)) if (t.revoked) K.markRelay(at, t.team, { revokedNone: false }); /* plant:rr-check-fetch */
  const r = await licenceOnce(true);
  if (!(r && r.got && r.got.grant === "kept")) {
    for (const t of K.relayTeams(at)) if (t.revoked) K.markRelay(at, t.team, { revokedNone: true });
  }
  relaySync(true); /* plant:rr-check-ask */
  if (r && r.reason) {
    const refused = (await refusal()).refuse(licenceSaid(r.reason));
    refused.said.why = String(r.reason);
    throw refused;
  }
  return licenceNow();
}));
/* THE CUSTOMER'S OWN AI SERVICE (board 992; src/customer-ai.mjs's head carries Maxim's words of 2026-11-11). The person
   chooses a service, an address where it has more than one, a model and a key; their organisation may set any of them in
   Group Policy (src/ai-policy.cjs), and then the policy's stands (default (1), in src/customer-ai.mjs's policyWins). What
   the person chose is in ai-service.json beside Studio's settings, with no key in it; the key is sealed by the operating
   system with the address it was given for (src/customer-ai.mjs, keySealed), and the page is told only whether one is
   kept. The one request any of this makes is aiAskNow's ask, through src/wire.cjs's AI door; the connection test in
   Settings asks it a fixed sentence and no catalog text. "Remove my data" takes both files with it (RESET_KEEP_NAMES does
   not name them). */
const customerAi = lazy("customer-ai.mjs");
const { aiPolicyText } = require(path.join(ROOT, "src", "ai-policy.cjs"));
/* A MANAGED INSTALLATION (decision 49, held for Max's ruling): the six values of the same key that say who may sign in here and
   what this computer shows (src/managed-policy.cjs), read once, as the shell loads, as the desk reads it once a run: no act, a
   publish included, starts reg.exe for it (tests/leak-hunt.mjs lh2), and a change pushed is taken at the next start. */
const managedPolicy = require(path.join(ROOT, "src", "managed-policy.cjs"));
const managedRead = managedPolicy.managedPolicyFrom(aiPolicyText());
function managedNow() { return managedRead; }
/** Whether this computer is managed (Managed set), and shared (SharedComputer set with it). */
const managedHere = () => managedNow().managed === true;
const sharedHere = () => managedHere() && managedNow().shared === true;
/** Whether the person signed in here owns the licence, as an act may treat them: never on a managed computer, where every act of
 *  the licence's owner is the organisation's (decision 49). */
const ownerHere = (st) => st.by === "signin" && st.signinOwner === true && !managedHere(); /* plant:mp-owner */
/* What the page is told of the policy: nothing where none is set, so the answer is today's byte for byte. */
function managedShown() {
  const p = managedNow();
  return p.any ? { policy: { any: true, managed: p.managed, shared: p.shared, personal: p.personal, provider: p.provider, tenant: p.tenant,
    closed: p.closed, contact: p.contact } } : {};
}
/* An act a managed computer does not offer, refused here as well as absent from the page (decision 49). */
async function notManaged(R) {
  if (managedHere()) throw R.refuse(licenceSaid("managed-act")); /* plant:mp-refuse */
}
function aiServiceAt() { return path.join(app.getPath("userData"), "ai-service.json"); }
function aiServiceRead() {
  try { const s = JSON.parse(fs.readFileSync(aiServiceAt(), "utf8")); return s && typeof s === "object" && !Array.isArray(s) ? s : {}; }
  catch { return {}; }
}
/* DEFAULT (2), Claude alpha 2026-11-11 18:55, for Maxim to confirm or change: the key has a file of its own, ai-key.json
   beside Studio's settings, sealed by the operating system, and not beside the licence's purchase key in
   licence-service.json. To change it, change these two functions. */
function aiKeyAt() { return path.join(app.getPath("userData"), "ai-key.json"); }
function aiKeyRead() { try { return JSON.parse(fs.readFileSync(aiKeyAt(), "utf8")); } catch { return null; } }
function aiKeyWrite(doc) {
  if (!doc) { try { fs.unlinkSync(aiKeyAt()); } catch { /* none kept */ } return; }
  fs.mkdirSync(path.dirname(aiKeyAt()), { recursive: true });
  writeWhole(aiKeyAt(), JSON.stringify(doc, null, 1) + "\n");
}
/* What is in force now: the policy read again on each ask, so a change an administrator pushes is taken without a restart. */
async function aiNow() {
  const C = await customerAi();
  const policy = C.aiPolicyFrom(aiPolicyText());
  const person = aiServiceRead();
  const cfg = C.aiConfig({ provider: person.provider, endpoint: person.endpoint, model: person.model }, policy.got);
  return { C, policy, person, cfg, key: C.keyFor(policy.got, vault, aiKeyRead(), cfg) };
}
/** WHAT A JOB WOULD SEND AND WHERE (src/customer-ai.mjs, aiSends), for the line the lead reads before it goes: `job` one of
 *  JOBS, `texts` the strings it will send. Sends nothing and holds no key. */
async function aiSendsNow(job, texts) {
  const { C, cfg } = await aiNow();
  return C.aiSends(cfg, job, texts);
}
/** THE ASK A JOB IS HANDED, once the lead has started it (stage 4): {ask, refusal}, `ask` src/customer-ai.mjs's aiAsk for
 *  `job` and what is in force, or null with `refusal` ({message, said}) saying what is missing. Called only from a channel
 *  the page opens on the lead's act, never on a timer or at start (tests/no-model.mjs 14). */
async function aiAskNow(job) {
  const { C, cfg, key } = await aiNow();
  const no = C.aiReady(cfg);
  if (no) return { ask: null, refusal: no };
  return { ask: C.aiAsk({ provider: cfg.provider, endpoint: cfg.endpoint, model: cfg.model, key, keyAway: cfg.keyAway }, wire.customerAiRequest, job), refusal: null };
}
/* What the page may know: never the key, only whether one is kept. */
async function aiShown() {
  const { C, policy, cfg, key } = await aiNow();
  return { provider: cfg.provider, endpoint: cfg.given, address: cfg.endpoint, model: cfg.model, hasKey: !!key,
    managed: cfg.managed, keyNoService: !!cfg.keyNoService, sealable: vault.available(), ready: !C.aiReady(cfg), said: policy.said,
    providers: Object.keys(C.PROVIDERS).map((id) => ({ id, endpoint: C.PROVIDERS[id].endpoint })) };
}
answer("studio:ai-settings", async () => guard(async () => aiShown()));
/* `provider`, `endpoint` and `model` are the fields as the page holds them, `key` a new key or "" to keep the one kept, and
   `forget` true to forget it. A field the policy set is refused where the page sends another value for it. Where the person
   moves the address and gives no new key, the key kept is sealed again for the new address: the move is theirs. */
answer("studio:ai-save", async (e, provider, endpoint, model, key, forget) => guard(async () => {
  const { C, policy, cfg } = await aiNow();
  const R = await refusal();
  const want = { provider: String(provider == null ? "" : provider).trim().slice(0, 40).toLowerCase(),
    endpoint: String(endpoint == null ? "" : endpoint).trim().slice(0, 2000), model: String(model == null ? "" : model).trim().slice(0, 200) };
  const newKey = String(key == null ? "" : key).trim().slice(0, 4000), drop = forget === true;
  const moved = (f) => cfg.managed[f] && want[f] !== (f === "endpoint" ? cfg.given : cfg[f]);
  if (moved("provider") || moved("endpoint") || moved("model") || (cfg.managed.key && (newKey || drop))) throw R.refuse(C.SAID.managed);
  if (want.provider && !C.PROVIDERS[want.provider]) throw R.refuse(C.SAID.provider, { NAME: want.provider });
  if (want.endpoint) {
    const shaped = C.endpointShape(want.endpoint, want.provider);
    if (!shaped) throw R.refuse(C.SAID.endpoint, { URL: want.endpoint });
    want.endpoint = shaped;
  }
  const next = C.aiConfig(want, policy.got);
  /* Whether a kept key is forgotten below because the address moved: the answer says so (keyDropped), and the card with it. */
  const dropped = !drop && !newKey && next.endpoint !== cfg.endpoint && !!aiKeyRead();
  let sealed = null;
  if (newKey) { sealed = C.keySealed(vault, next.endpoint, newKey); if (!sealed) throw R.refuse(C.SAID.unsealed); }
  fs.mkdirSync(path.dirname(aiServiceAt()), { recursive: true });
  writeWhole(aiServiceAt(), JSON.stringify({ format: 1, kind: "etiuda-studio-ai", provider: want.provider, endpoint: want.endpoint, model: want.model }, null, 1) + "\n");
  if (drop) aiKeyWrite(null);
  else if (sealed) aiKeyWrite(sealed);
  /* A key is used only for the address it was given for (src/customer-ai.mjs), so it never follows a changed address: the
     kept one goes and the lead gives it again (Claude α, 22:33, on Argon's finding 1 of the 992 review). */
  else if (next.endpoint !== cfg.endpoint) aiKeyWrite(null);
  return dropped ? Object.assign(await aiShown(), { keyDropped: true }) : aiShown();
}));
/* The connection test: the fixed sentence of src/customer-ai.mjs and nothing of a catalog. Answers {ok, ms}, or the refusal. */
answer("studio:ai-test", async () => guard(async () => {
  const got = await aiAskNow("test");
  const R = await refusal(), C = await customerAi();
  if (!got.ask) throw R.refuse(got.refusal.said.frame, got.refusal.said.vars);
  const at = Date.now();
  const a = await got.ask({ prompt: C.TEST_PROMPT, body: C.TEST_TEXT });
  if (!a.ok) throw R.refuse(a.said.frame, a.said.vars);
  return { ok: true, ms: Date.now() - at };
}));

/* THE DRAFTING JOBS (board 992, stage 4): the other language for a card ("language") and a card from a described situation
   ("situation"). The product designer's three rules (etiuda-ai-role-2026-11-11/role.md), on Maxim's 2026-11-11 19:15: the
   lead starts each send and sees what goes and where before it goes; a model's words are marked until the lead accepts
   them, with a one-press Discard; a model's draft never blocks publishing. So studio:ai-job-line answers the line the lead
   reads (what src/model-drafts.mjs jobParts says goes, counted by aiSendsNow) and sends nothing; studio:ai-job-send, the
   page's Send, builds the same parts again, asks once and keeps the answer as a draft beside the catalog, never in it; and
   Accept and Discard are the lead's. Bringing in old replies ("import") is opened here too, on the Import step's own
   button (the product designer's surfaces.md 1a): its line counts the text the lead pasted or the file they chose, and its
   Send hands the ask to src/import-text.mjs's importText, whose proposal lands in the project's inbox for the review queue,
   each rewording marked and every span with no source refused before review, as that file has always done.
   Each prompt asks for the card's text only, in the language asked for, in the catalog's voice the example cards show, as
   JSON so that title and body come back apart; an answer that is not that is "could not be used", and nothing is kept. */
const AI_PROMPTS = {
  language: "You write one card of a customer service catalog: a reply a support agent sends to a customer. The message holds"
    + " the card in {FROM} and, where there are any, cards of the same catalog already written in {TO}, which show the"
    + " catalog's voice. Write this card in {TO}, in that voice: the same meaning and the same facts, every placeholder in"
    + " curly braces left exactly as it is, and nothing the card does not say. Answer with the card's text only, as one JSON"
    + ' object and nothing else: {"title": "the title in {TO}", "body": "the body in {TO}"}',
  situation: "You write one new card of a customer service catalog: a reply a support agent sends to a customer. The message"
    + " holds what happened and what the team does about it, cards of the catalog's category {CATEGORY} that show the"
    + " catalog's voice, and the names of its categories and intents. Write the card in each of these languages: {LANGS},"
    + " in that voice, saying what the team does and nothing it does not, with no greeting or signature the example cards do"
    + " not have. Choose its category, and any intents it answers, from the names given, by name. Answer with the card's"
    + ' text only, as one JSON object and nothing else: {"title": {"<language code>": "..."}, "body": {"<language code>":'
    + ' "..."}, "category": "a category name", "intents": ["an intent name"]}',
};
const AI_JOBS_HERE = ["language", "situation", "import"];
/** The prompt and the message a job sends, from jobParts' answer: the message is its texts in order, each under a plain line
 *  saying what it is, so what is counted is what goes. */
function aiJobAsk(job, p) {
  if (job === "language") return {
    prompt: AI_PROMPTS.language.split("{FROM}").join(p.fromName).split("{TO}").join(p.toName),
    body: "The card, in " + p.fromName + ":\n\n" + p.text
      + (p.examples.length ? "\n\nCards already written in " + p.toName + ":\n\n" + p.examples.join("\n\n---\n\n") : "") };
  return {
    prompt: AI_PROMPTS.situation.split("{CATEGORY}").join(p.category || "-").split("{LANGS}").join(p.langNames.join(", ")),
    body: "What happened, and what the team does about it:\n\n" + p.text
      + (p.examples.length ? "\n\nCards of the category " + p.category + ":\n\n" + p.examples.join("\n\n---\n\n") : "")
      + "\n\n" + p.names };
}
/** The model's answer as the draft's fields, or null where it is not a card: one JSON object, perhaps fenced, with a body in
 *  the language asked for (a language job) or in the catalog's first language (a situation). A category or an intent is
 *  taken only where its name is one of the catalog's; otherwise the category the lead chose stands and the intent goes. */
function aiDraftFields(job, text, p) {
  const t = String(text || ""), from = t.indexOf("{"), to = t.lastIndexOf("}");
  let doc = null;
  try { doc = from >= 0 && to > from ? JSON.parse(t.slice(from, to + 1)) : null; } catch { doc = null; }
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return null;
  const s = (v) => (typeof v === "string" ? v.trim() : "");
  if (job === "language") {
    const body = s(doc.body);
    return body ? { title: { [p.to]: s(doc.title) }, body: { [p.to]: body } } : null;
  }
  const title = {}, body = {};
  p.langs.forEach((l) => { title[l] = s(doc.title && doc.title[l]); body[l] = s(doc.body && doc.body[l]); });
  if (!title[p.langs[0]] || !body[p.langs[0]]) return null;
  const named = (list, name) => (list.find((x) => x.name.toLowerCase() === s(name).toLowerCase()) || {}).id || "";
  const shelf = named(p.shelves, doc.category) || p.shelf;
  const requests = (Array.isArray(doc.intents) ? doc.intents : []).map((n) => named(p.intents, n)).filter((v, i, a) => v && a.indexOf(v) === i);
  return { title, body, shelf, requests };
}
/** Which of the product designer's failure lines a refusal is: "unset" where nothing was sent (no service, no model, an
 *  address refused, the organisation's key kept from a typed address), else what the service or the network did. */
function aiWhy(C, said) {
  const k = Object.keys(C.SAID).find((x) => C.SAID[x] === (said && said.frame)) || "";
  if (k === "unreached" && !AI_UNSENT.test(String((said && said.vars && said.vars.WHY) || ""))) return "dropped";
  return ({ unreached: "unreached", key: "key", busy: "busy", late: "late", failed: "failed", empty: "unusable", cut: "unusable", big: "unusable" })[k] || "unset";
}
/* NOT REACHED IS SAID ONLY WHERE THE REQUEST NEVER LEFT (Argon's finding 4 of the 992 review; the copywriter's truth 1). The
   network's word reaches the refusal as Chromium's net::ERR_ name (src/customer-ai.mjs thrownSaid). These are the names it
   gives before a connection carries anything: the name not found, no network, the address refused or not answering the
   connection, a proxy or tunnel that would not open, a certificate or TLS handshake refused, or the request blocked. Any other
   (a connection reset or closed, an empty or cut answer, a network that changed) may come after the text went, so it is
   "dropped": the host was reached, and nothing was drafted. */
const AI_UNSENT = /ERR_NAME_NOT_RESOLVED|ERR_NAME_RESOLUTION_FAILED|ERR_INTERNET_DISCONNECTED|ERR_ADDRESS_UNREACHABLE|ERR_ADDRESS_INVALID|ERR_CONNECTION_REFUSED|ERR_CONNECTION_TIMED_OUT|ERR_CONNECTION_FAILED|ERR_PROXY_|ERR_TUNNEL_CONNECTION_FAILED|ERR_CERT_|ERR_SSL_|ERR_BAD_SSL_|ERR_NETWORK_ACCESS_DENIED|ERR_BLOCKED_BY_/;
const aiLineStamps = new Map();
function aiLineKey(dir, job, card, lang, text, shelf) {
  return JSON.stringify([String(dir || ""), String(job || ""), String(card || ""), String(lang || ""), String(text || ""), String(shelf || "")]);
}
function aiLineStamp(now, p) {
  return require("node:crypto").createHash("sha256").update(JSON.stringify({
    provider: now.cfg.provider, endpoint: now.cfg.endpoint, model: now.cfg.model, keyAway: !!now.cfg.keyAway, keyNoService: !!now.cfg.keyNoService, parts: p,
  })).digest("hex");
}
/** What a job would send, for the line: the parts as jobParts read them and aiSendsNow's account of where they go. */
async function aiJobLine(dir, job, card, lang, text, shelf) {
  /* An import's file is the one the person chose in the picker or dropped (chosen.cjs), never a path the page names. */
  if (job === "import" && card && !chosen.took("import", card)) return { parts: null, line: null, refused: "file" };
  const p = await thread.call("modelJobParts", dir, job, { card, lang, text, shelf });
  if (!p || p.refused) return { parts: null, line: null, refused: p ? p.refused : "job" };
  const now = await aiNow();
  return { parts: p, line: now.C.aiSends(now.cfg, job, p.texts), now, stamp: aiLineStamp(now, p) };
}
answer("studio:ai-job-line", async (e, dir, job, card, lang, text, shelf) => guard(async () => {
  const j = String(job || "");
  if (AI_JOBS_HERE.indexOf(j) < 0) return { line: null, refused: "job" };
  const home = projectDir(dir), c = String(card || ""), l0 = String(lang || ""), t0 = String(text || ""), s0 = String(shelf || "");
  const got = await aiJobLine(home, j, c, l0, t0, s0);
  const k = aiLineKey(home, j, c, l0, t0, s0);
  if (!got.line) {
    aiLineStamps.delete(k);
    const chars = got.parts ? got.parts.chars : 0;
    return { line: null, refused: got.refused, chars, max: AI_IMPORT_MAX };
  }
  const l = got.line;
  if (l.refusal) aiLineStamps.delete(k);
  else aiLineStamps.set(k, got.stamp);
  return { line: { host: l.host, service: l.service, model: got.now.cfg.model, managed: l.managed, chars: got.parts.chars,
    parts: got.parts.parts || 1, examples: got.parts.examples.length, category: got.parts.category || "", file: got.parts.file || "", refusal: l.refusal, stamp: got.stamp }, refused: null };
}));
/* THE LEAD'S SEND. The one ask of a drafting job, made here and nowhere else; a failure keeps nothing and leaves the card as
   it was, and says which of the failure lines it is and whether anything left the computer. */
answer("studio:ai-job-send", async (e, dir, job, card, lang, text, shelf, stamp) => guard(async () => {
  const j = String(job || ""), home = projectDir(dir), c = String(card || ""), l0 = String(lang || ""), t0 = String(text || ""), s0 = String(shelf || "");
  if (AI_JOBS_HERE.indexOf(j) < 0) return { draft: null, failed: { why: "unset", said: null, sent: false } };
  const k = aiLineKey(home, j, c, l0, t0, s0);
  const shownStamp = typeof stamp === "string" && stamp ? stamp : (aiLineStamps.get(k) || "");
  const got = await aiJobLine(home, j, c, l0, t0, s0);
  if (!got.line) {
    aiLineStamps.delete(k);
    return { draft: null, failed: { why: got.refused || "unusable", said: null, sent: false, refused: got.refused, chars: (got.parts && got.parts.chars) || 0, max: AI_IMPORT_MAX } };
  }
  if (shownStamp && got.stamp !== shownStamp) { /* plant:ai-line-changed */
    aiLineStamps.delete(k);
    return { draft: null, proposal: null, failed: { why: "changed", said: null, sent: false, host: got.line.host } };
  }
  const C = await customerAi();
  const made = await aiAskNow(j);
  if (!made.ask) return { draft: null, failed: { why: "unset", said: made.refusal.said, sent: false, host: got.line.host } };
  if (j === "import") return aiImportSend(home, got, made.ask, C);
  const q = aiJobAsk(j, got.parts);
  const a = await made.ask(q);
  if (!a.ok) return { draft: null, failed: aiFailed(C, a.said, got.line.host) };
  const fields = aiDraftFields(j, a.text, got.parts);
  if (!fields) return { draft: null, failed: { why: "unusable", said: null, sent: true, host: got.line.host } };
  const now = await aiNow();
  const kept = await thread.call("modelDraftKeep", home, Object.assign({ job: j, service: now.cfg.provider, model: now.cfg.model,
    host: got.line.host, fields }, j === "language" ? { card: got.parts.card, lang: got.parts.to } : {}));
  return { draft: kept.draft, failed: null };
}));
/** A refusal of the ask as the page's failure: which line it is, whether the text may have left, and the host. A drop names no
 *  cause in its title but the network's own word: "could not be reached" would be untrue there. */
function aiFailed(C, said, host) {
  const why = aiWhy(C, said);
  return { why, said: why === "dropped" ? null : said, code: why === "dropped" ? String((said && said.vars && said.vars.WHY) || "") : "",
    sent: why !== "unset" && why !== "unreached", host };
}
/* BRINGING IN OLD REPLIES, on the lead's Send (board 992, job 1; Maxim, 2026-11-11 19:15: "1) first version id those three
   jobs, yes"). importText asks the ask it is handed, piece by piece for a long text, and keeps only what the text holds; its
   proposal and its report, with the marks and the service and model that wrote it, go into the project's inbox, where the
   review queue offers it card by card. Nothing reaches the catalog until the lead accepts it there. A run that asked and
   kept nothing is "could not be used"; a refusal of the ask is the line it is. AI_IMPORT_PIECE is the lead engineer's
   choice, not measured on a customer's file: a piece small enough for any of the five services to answer whole. */
const importTextLib = lazy("import-text.mjs");
const AI_IMPORT_MAX = 200000;
const AI_IMPORT_PIECE = 20000;
let aiImportCancelled = false;
async function aiImportSend(home, got, ask, C) {
  if (got.parts && got.parts.chars > AI_IMPORT_MAX) {
    return { draft: null, proposal: null, failed: { why: "ceiling", said: null, sent: false, chars: got.parts.chars, max: AI_IMPORT_MAX, host: got.line.host } };
  }
  aiImportCancelled = false;
  const I = await importTextLib();
  const total = (got.parts && got.parts.parts) || I.importPieceCount(got.parts.text, AI_IMPORT_PIECE);
  let asked = 0;
  const counted = (q) => { asked++; return ask(q); };
  let r = null;
  try {
    r = await I.importText({
      text: got.parts.text,
      ask: counted,
      known: got.parts.known,
      chunkChars: AI_IMPORT_PIECE,
      isCancelled: () => aiImportCancelled,
      onPiece: (p) => { aiImportProgress(p.n, total); },
    });
  }
  catch (err) { return { draft: null, proposal: null, failed: { why: asked ? "unusable" : "unset", said: (err && err.said) || null, sent: asked > 0, host: got.line.host } }; }
  if (!r || !r.catalog) {
    if (r && r.cancelled) {
      return { draft: null, proposal: null, cancelled: true, sentParts: asked, totalParts: total, failed: { why: "cancelled", sent: asked, total } };
    }
    const theirs = !!(r && r.said) && Object.keys(C.SAID).some((k) => C.SAID[k] === r.said.frame);
    return { draft: null, proposal: null, failed: theirs ? aiFailed(C, r.said, got.line.host)
      : { why: "unusable", said: (r && r.said) || null, sent: true, host: got.line.host } };
  }
  const now = await aiNow();
  r.report.model = { service: now.cfg.provider, model: now.cfg.model, host: got.line.host };
  const kept = await thread.call("modelImportKeep", home, r.catalog, r.report);
  const byLang = (r.report && r.report.counts && r.report.counts.byLang) || (r.report && r.report.byLang) || null;
  return { draft: null, proposal: { file: kept.file, name: kept.name, cards: (r.report.counts && r.report.counts.cards) | 0, byLang },
    cancelled: !!r.cancelled, sentParts: asked, totalParts: total, failed: null };
}
/* The drafts waiting in a project, for the card's marks, the queue's rows and Publishing's line. Reads; sends nothing. */
answer("studio:ai-drafts", async (e, dir) => guard(async () => thread.call("modelDrafts", projectDir(dir))));
/* Accept: the fields as the lead holds them, as lists of strings (the languages, then a title and a body for each), the
   category and the intents; src/studio.mjs modelDraftAccept reads them. LIST is this file's own guard, defined below. */
answer("studio:ai-draft-accept", async (e, dir, id, langs, titles, bodies, shelf, requests) => guard(async () =>
  thread.call("modelDraftAccept", projectDir(dir), String(id || ""),
    { langs: LIST(langs), titles: LIST(titles), bodies: LIST(bodies), shelf: String(shelf || ""), requests: LIST(requests) })));
answer("studio:ai-draft-discard", async (e, dir, id) => guard(async () => thread.call("modelDraftDiscard", projectDir(dir), String(id || ""))));
/* Cancel: stops the pieces of an import not yet sent (board 992). */
answer("studio:ai-job-cancel", async (e, dir, job) => guard(async () => {
  if (job === "import") aiImportCancelled = true;
  return { ok: true };
}));
/* Tells the page of an import in parts: one send per piece, inside the AI section after its channels (board 992). */
function aiImportProgress(n, total) {
  const win = typeof theWindow !== "undefined" ? theWindow : null;
  if (win && !win.isDestroyed() && win.webContents && typeof win.webContents.send === "function") {
    win.webContents.send("studio:ai-import-progress", { n, total });
  }
}

/* THE RELAY'S SEAT (Claude alpha's ruling on C1): on a team whose licence follows Entra this Studio's sessions, as its team's lead or as a
   teammate, carry its person's lead-seat certificate (seatCerts, kept by keepWho). A run-out or refused one is renewed at once, at most
   once in SEAT_RENEW_MS; the teams whose relay refused are kept, and Account says it in the desk's words (relaySeat in licenceNow). */
const SEAT_RENEW_MS = 60 * 60 * 1000;
let seatRenewAt = 0;
const relaySeatRefused = new Set();
function seatCertNow(which) {
  const st = readServiceState(), c = st.by === "signin" && st.seatCerts ? st.seatCerts[which] : null;
  return c && typeof c === "object" ? c : null;
}
function seatRenewNow() {
  const now = Date.now();
  if (seatRenewAt && now >= seatRenewAt && now - seatRenewAt < SEAT_RENEW_MS) return Promise.resolve(); /* plant:c1-renew-gap */
  seatRenewAt = now;
  return seatRenewStep().catch(() => {});
}
async function seatRenewStep() {
  const C = await licenceClient(), st = readServiceState(), open = await leadOpen();
  if (st.by !== "signin" || !open) return;
  const after = await C.afterCheck(await signInIo(), C.providerOf(st.provider), { ok: true, proof: "due" }, st, open, Date.now);
  writeServiceState(after.state);
}
function relaySeatTold(team, state) {
  const was = relaySeatRefused.has(String(team));
  if (state === "refused") relaySeatRefused.add(String(team)); else relaySeatRefused.delete(String(team)); /* plant:c1-told */
  if (was !== relaySeatRefused.has(String(team))) followSignal(); /* plant:c6-signal */
}

/* THE QUIET CHECK. One run at a time; `force` (Check now) skips the schedule's timing and nothing else. Answers {plan} or
   {plan, reason} where the service refused or could not be reached; nothing is changed but `tried` then. */
let licenceRun = null;
function licenceOnce(force) {
  if (licenceRun) return licenceRun;
  licenceRun = licenceStep(!!force)
    .catch((err) => { process.stderr.write("studio  the licence check stopped: " + String(err && err.message || err) + "\n"); return { plan: "fault", reason: "unreached" }; })
    .finally(() => { licenceRun = null; });
  return licenceRun;
}
async function licenceStep(force) {
  const C = await licenceClient(), st = readServiceState(), lead = await leadPub(), now = Date.now();
  const plan = C.planFor(force ? Object.assign({}, st, { tried: 0, checked: 0 }) : st, lead, now, await revokedSerialNow());
  if (plan === "none" || plan === "ask") return { plan };
  const open = await leadOpen();
  if (!open || open.public !== lead) return { plan, reason: "unreached" };
  writeServiceState(Object.assign({}, st, { tried: now }));
  /* An administrator's check (decision 49) asks licence/admin for the card by a refreshed token; there is no licence to take. */
  if (st.by === "admin") { /* plant:admin-step */
    const after = await C.adminCheck(await signInIo(), C.providerOf(st.provider), readServiceState(), open, Date.now);
    const ok = !!after.answer && after.answer.ok === true;
    writeServiceState(ok ? Object.assign(after.state, { lead: open.public, checked: now, tried: now }) : after.state);
    if (!ok) process.stderr.write("studio  the administrator's check was not answered: " + String(after.answer && after.answer.reason) + "\n");
    return ok ? { plan, got: { admin: "kept" } } : { plan, reason: after.answer && after.answer.reason ? after.answer.reason : "unreached" };
  }
  let a = await C.quietCheck(wire.licenceRequest, open, now); /* plant:s6-check */
  /* A signed-in Studio's proof (decision 15 item 1): "due" renews quietly, "signin" renews or asks the lead in the cover; one
     activated before sign-in is asked to sign in. The licence file is left where it is either way (src/licence-client.mjs
     afterCheck). */
  const after = await C.afterCheck(await signInIo(), C.providerOf(st.provider), a, readServiceState(), open, Date.now);
  writeServiceState(after.state);
  a = after.answer;
  if (!a || a.ok !== true) {
    process.stderr.write("studio  the licence check was not answered: " + String(a && a.reason) + "\n");
    /* A refusal may still carry the root's revoked keys' list (a lapsed sign-in's "signin"): take judges and keeps it alone. */
    if (a && a.revoked !== undefined) { await C.take(a, await licenceCtx(open.public, now)); await keepRevokedSerial(); }
    return { plan, reason: a && a.reason ? a.reason : "unreached" };
  }
  const got = await C.take(a, await licenceCtx(open.public, now));
  writeServiceState(Object.assign({}, readServiceState(), { lead: open.public, checked: now, tried: now }));
  await keepRevokedSerial();
  /* A check that finds the licence running while this Studio holds no certificate of its own (paid again after a paid end, or a renewal
     missed) renews the sign-in at once, so the certificate its gate rests on comes back without waiting for the proof's day (review xi). */
  const held = readServiceState();
  if (a.licence && held.by === "signin" && held.refreshSealed && !(held.seatCerts && held.seatCerts.studio)) await seatRenewNow(); /* plant:seat-renew-missing */
  process.stderr.write("studio  the licence check: licence " + got.licence + ", grant " + got.grant + ", revoked keys " + got.revoked + "\n");
  /* The renewed grant goes to the relay with the next sync, run now (src/relay.mjs owesGrant). A sync already in
     progress posts the grant itself; asking relaySync from inside it would wait on that same sync. */
  if (got.grant === "kept" && !relayBusy) relaySync(); /* plant:g2s-check-sync */
  if (Array.isArray(a.erased)) await erasedStep(a.erased); /* plant:erased-step */
  return { plan, got };
}
/* AN ERASED PERSON'S DESKS (section 13; Claude alpha's ruling of 2026-11-13 22:32): taken off every relay team this Studio leads, with
   nobody pressing, by the removal a lead's Remove makes, once each (src/erased-desks.mjs); the Desks screen says once how many left. */
async function erasedStep(erased) {
  try {
    const E = await erasedLib();
    const r = await E.takeOffErased(erased, { done: readServiceState().erasedDone, teams: erasedTeams,
      remove: (team, dir, member) => teamAct(team, () => removeDeskNow(dir, team, member)) });
    writeServiceState(Object.assign({}, readServiceState(), { erasedDone: r.done }));
    if (!Object.keys(r.left).length) return;
    const cur = readStore();
    cur.erasedLeft = E.leftAfter(cur.erasedLeft, r.left); /* plant:erased-kept */
    writeStore(cur);
  } catch (err) { process.stderr.write("studio  an erased person's desks were not taken off: " + String(err && err.message || err) + "\n"); }
}
/* The relay teams this Studio leads as the removal reads them: each held under this Studio's key, with its project's folder and its
   roster's desks by id and public key. */
async function erasedTeams() {
  const K = await teamStore(), T = await teamLib(), Rl = await relayLib(), at = await teamsAt(), keyFile = await keyFileNow();
  let projects = [];
  try { const l = await thread.call("listProjects", projectsRoot(), { userData: app.getPath("userData") }); projects = l && Array.isArray(l.projects) ? l.projects : []; } catch { projects = []; }
  const out = [];
  for (const w of K.relayTeams(at)) {
    let held = null;
    try { held = await T.heldTeam(w.folder, { key: keyFile }); } catch { held = null; }
    const team = held && held.team;
    const p = projects.find((x) => x && x.dir && x.folder && pathsSame(x.folder, w.folder));
    if (!team || team.id !== w.team || !p) continue;
    out.push({ team: w.team, folder: p.dir, roster: Rl.devicesOf(team).map((d) => ({ deskId: d.desk, public: d.pub })) });
  }
  return out;
}
/* Armed once the window is up: the first check a minute in, then a look each hour, each timer holding nothing open. */
function armLicenceCheck() {
  if (relayClosed) return;
  const first = setTimeout(() => { licenceOnce(false); }, LICENCE_FIRST_MS);
  if (first && first.unref) first.unref();
  licenceFirst = first;
  const tick = setInterval(() => { licenceOnce(false); }, LICENCE_TICK_MS); /* plant:s6-schedule */
  if (tick && tick.unref) tick.unref();
  licenceTick = tick;
}

/* THE UPDATE OFFER (board 991; Max's ruling of 2026-10-06 22:07: "Each program reads a small signed version note (form B) from
 * etiuda.dev and offers the update itself"). A look a minute in, then hourly, the licence check's rhythm, whether or not this
 * Studio is activated: wire.cjs's one GET of Studio's note, judged by src/update-note.mjs under the root's public half (the
 * embedded one when packaged), and the outcome kept in update-note.json beside the store, which holds the note last taken, a
 * "Later" and whether the latest look read a note; nothing of a person's. The page asks what stands (studio:update), puts it
 * off (studio:update-later) and asks for the release page by name (studio:update-open), never handing an address: the one
 * opened is the kept note's, admitted again by releasePage, which answers "" for anything but https://etiuda.dev/. Until the
 * production service holds a note, every look is "not there", and nothing is offered. */
const updateNote = lazy("update-note.mjs");
const NOTE_FIRST_MS = 60000;
const NOTE_TICK_MS = 3600000;
let noteFirst = null, noteTick = null, noteRun = null;
function updateStateAt() { return path.join(app.getPath("userData"), "update-note.json"); }
function readUpdateState() {
  try { const s = JSON.parse(fs.readFileSync(updateStateAt(), "utf8")); return s && typeof s === "object" && !Array.isArray(s) ? s : {}; }
  catch { return {}; }
}
function writeUpdateState(next) {
  fs.mkdirSync(path.dirname(updateStateAt()), { recursive: true });
  writeWhole(updateStateAt(), JSON.stringify(next, null, 1) + "\n");
}
/** The running version, as the About and the status bar say it. */
function runningVersion() { return app.getVersion() || require("../package.json").version || ""; }
/** What stands, for the page: the running version, About's line ("offer", "newest" or "unchecked") and the offer, with no address. */
async function updateNow() {
  const U = await updateNote(), L = await licenceLib();
  /* Machine policy's StudioNoUpdateCheck turns the look off (Claude α's decision 10): then nothing is offered. */
  const off = noUpdateNow(U);
  const a = U.aboutOf(readUpdateState(), runningVersion(), Date.now(), "studio", L.trustedKeyNow());
  return { running: runningVersion(), about: off ? "unchecked" : a.said, offer: !off && a.offer ? { version: a.offer.version, strip: a.offer.strip } : null };
}
/** One look at the service at a time; the page is told when it ends. */
function noteOnce() {
  if (noteRun) return noteRun;
  noteRun = (async () => {
    const U = await updateNote(), L = await licenceLib();
    if (noUpdateNow(U)) return; /* machine policy turns the look off: the service is never asked */
    const got = await U.look({ app: "studio", root: L.trustedKeyNow(), running: runningVersion(), now: Date.now(), state: readUpdateState(), get: () => wire.licenceNote() });
    try { writeUpdateState(got.state); }
    catch (err) { process.stderr.write("studio  the update state could not be written: " + String(err && err.message || err) + "\n"); }
    if (got.why) process.stderr.write("studio  the version note was not taken: " + got.why + "\n");
    const win = theWindow;
    if (win && !win.isDestroyed()) win.webContents.send("studio:update-looked");
  })().catch((err) => { process.stderr.write("studio  the version note could not be looked at: " + String(err && err.message || err) + "\n"); })
    .finally(() => { noteRun = null; });
  return noteRun;
}
/* Machine policy's StudioNoUpdateCheck, read at most once in ten minutes: updateNow is asked whenever the page paints About,
   and each read starts reg.exe (the test architect's note, 2026-11-11). A change of policy is seen within ten minutes. */
const NO_UPDATE_READ_MS = 600000;
let noUpdateRead = { at: 0, off: false };
function noUpdateNow(U) {
  const now = Date.now();
  if (!noUpdateRead.at || now - noUpdateRead.at >= NO_UPDATE_READ_MS) noUpdateRead = { at: now, off: U.noUpdateFrom(aiPolicyText()) };
  return noUpdateRead.off;
}
function armNoteCheck() {
  if (relayClosed) return;
  const first = setTimeout(() => { noteOnce(); }, NOTE_FIRST_MS);
  if (first && first.unref) first.unref();
  noteFirst = first;
  const tick = setInterval(() => { noteOnce(); }, NOTE_TICK_MS);
  if (tick && tick.unref) tick.unref();
  noteTick = tick;
}
answer("studio:update", async () => guard(async () => updateNow()));
answer("studio:update-later", async () => guard(async () => {
  const U = await updateNote(), L = await licenceLib();
  writeUpdateState(U.putOff(readUpdateState(), runningVersion(), Date.now(), "studio", L.trustedKeyNow()));
  return updateNow();
}));
hear("studio:update-open", () => { updateOpen(); });
/* BUY (board 1020), asked by name as the release page is: the address is built here from what the service last said of this person's
   payments, never handed by the page. An owner who already pays for a team licence goes to the provider's portal, or nowhere where there
   is none, never to a second checkout; anyone else to the team's order page in the page's language (recoveryLang, the page's own rule)
   with their own code after "#code=" (src/buy-path.cjs). */
hear("studio:buy-open", () => { buyOpen(); });
function buyOpen() {
  try {
    const buy = BUY.buyAddress(readServiceState(), ORDER_ORIGIN, managedHere(), recoveryLang());
    if (buy) shell.openExternal(buy);
  } catch (err) { process.stderr.write("studio  Buy could not be opened: " + String(err && err.message || err) + "\n"); }
}
async function updateOpen() {
  try {
    const U = await updateNote(), L = await licenceLib();
    const page = U.releasePage(U.offerOf(readUpdateState(), runningVersion(), Date.now(), "studio", L.trustedKeyNow()));
    if (page) shell.openExternal(page);
  } catch (err) { process.stderr.write("studio  the release page could not be opened: " + String(err && err.message || err) + "\n"); }
}

answer("studio:proposal-revert", async (e, dir, file, reverts) => guard(async () => {
  const home = projectDir(dir);
  return thread.call("revertProposalMarks", home, proposalFile(home, file, false),
    Array.isArray(reverts) ? reverts : []);
}));

/* THE INTENTS AND THE CATEGORIES. Five verbs, and every one of them is a whole act on the
   draft rather than a path and a payload: the page names a tag and a direction, never a file. */
answer("studio:tag-add", async (e, dir, kind, text) => guard(async () => {
  return thread.call("addTag", projectDir(dir), String(kind || ""), text || {});
}));

answer("studio:tag-rename", async (e, dir, id, text) => guard(async () => {
  return thread.call("renameTag", projectDir(dir), String(id || ""), text || {});
}));

/* EVERY FIELD OF ONE TAG, the one save verb (board 1018, piece A): src/studio.mjs saveTag reads only the fields it knows,
   each by its type, so the patch is handed on as the page sent it, as save-card's is. */
answer("studio:tag-save", async (e, dir, id, patch) => guard(async () => {
  return thread.call("saveTag", projectDir(dir), String(id || ""), patch || {});
}));

answer("studio:tag-move", async (e, dir, id, delta) => guard(async () => {
  return thread.call("moveTag", projectDir(dir), String(id || ""), +delta || 0);
}));

answer("studio:tag-delete", async (e, dir, id) => guard(async () => {
  return thread.call("deleteTag", projectDir(dir), String(id || ""));
}));

/* THE LANGUAGES A CATALOG DECLARES (board 579). Four verbs of the tag verbs' shape, and the
   removal takes its confirmation across the wire rather than keeping a flag in the page: a
   renderer that lost its state between the warning and the press would otherwise remove a
   language nobody had agreed to. */
answer("studio:lang-add", async (e, dir, code, label) => guard(async () => {
  return thread.call("addLang", projectDir(dir), String(code || ""), String(label || ""));
}));

answer("studio:lang-move", async (e, dir, code, delta, confirm) => guard(async () => {
  return thread.call("moveLang", projectDir(dir), String(code || ""), +delta || 0,
    { confirm: !!confirm });
}));

answer("studio:lang-remove", async (e, dir, code, confirm) => guard(async () => {
  return thread.call("removeLang", projectDir(dir), String(code || ""), { confirm: !!confirm });
}));

answer("studio:comment-lang", async (e, dir, code) => guard(async () => {
  return thread.call("setCommentLang", projectDir(dir), String(code || ""));
}));

/* THE CATALOG'S QUICK FACTS, one text, as the format carries it. */
answer("studio:facts", async (e, dir, text) => guard(async () => {
  return thread.call("saveFacts", projectDir(dir), String(text == null ? "" : text));
}));

/* THE TEAM'S VARIABLES, one object written whole, as the format carries it. */
answer("studio:variables", async (e, dir, variables) => guard(async () => {
  return thread.call("saveVariables", projectDir(dir),
    variables && typeof variables === "object" ? JSON.parse(JSON.stringify(variables)) : null);
}));

/* A FORMAT 1 CATALOG, UPGRADED INTO A PROJECT. Pick the file, see what the conversion would do,
   land it - the same three steps as the import wizard, and the plan writes nothing at all. */
answer("studio:v1-pick", async (e, title, kind) => guard(async () => {
  /* A NATIVE FILE DIALOG CANNOT BE DRIVEN, for the reasons written at the import picker above.
     STUDIO_TEST_V1 answers this one, and it is a second variable rather than a second use of
     STUDIO_TEST_FILE so that a leg can plant a CSV and a format 1 catalog in one run and press
     either. Unset on any desk but a harness's. */
  if (testOnly("STUDIO_TEST_V1")) return { file: chosen.keep("v1", testOnly("STUDIO_TEST_V1")) };
  const win = BrowserWindow.fromWebContents(e.sender);
  const r = await pick("open", win, {
    title: String(title || ""), properties: ["openFile"],
    filters: [{ name: catalogKind(kind), extensions: ["js", "json", "ec"] }],
  });
  return { file: chosen.keep("v1", (r.canceled || !r.filePaths.length) ? null : r.filePaths[0]) };
}));

answer("studio:sample-pick", async () => guard(async () => {
  const E = await engineLib();
  return { file: chosen.keep("v1", E.sampleCatalog()) };
}));

answer("studio:v1-plan", async (e, file) => !chosen.took("v1", file)
  ? unchosen("studio:v1-plan", file) : guard(async () => {
  holdCheck(projectsRoot());
  return thread.call("upgradePlan", projectsRoot(), String(file || ""));
}));

answer("studio:v1-land", async (e, file, name) => !chosen.took("v1", file)
  ? unchosen("studio:v1-land", file) : guard(async () => {
  holdCheck(projectsRoot());
  return thread.call("upgradeLand", projectsRoot(), String(file || ""), String(name || ""));
}));

/* THE CARDS. Three whole acts, and the page names a card and a category rather than a field
   and a path: a bridge that took a payload could write anything into the draft. A new card's
   reply shape (the New card cover, E2) crosses as one more string, "" where the page names none,
   and src/studio.mjs refuses a word the format has not got. */
answer("studio:card-add", async (e, dir, shelf, title, body, shape) => guard(async () => {
  return thread.call("addCard", projectDir(dir), String(shelf || ""), String(title || ""),
    String(body || ""), String(shape || ""));
}));

answer("studio:card-duplicate", async (e, dir, id) => guard(async () => {
  return thread.call("duplicateCard", projectDir(dir), String(id || ""));
}));

answer("studio:card-delete", async (e, dir, id) => guard(async () => {
  return thread.call("deleteCard", projectDir(dir), String(id || ""));
}));

/* RETIRE, RESTORE, UNDO AND THE CARD'S HISTORY (board 834, step 6). The page names a card, an
   edition and a verb, never a payload; Undo names only the project, because the card it puts
   back is the one src/studio.mjs kept when it was deleted. */
answer("studio:card-retire", async (e, dir, id) => guard(async () => {
  return thread.call("retireCard", projectDir(dir), String(id || ""));
}));

answer("studio:card-restore", async (e, dir, id) => guard(async () => {
  return thread.call("restoreCard", projectDir(dir), String(id || ""));
}));

answer("studio:card-undo", async (e, dir) => guard(async () => {
  return thread.call("undoDelete", projectDir(dir));
}));

/* A likely commitment turned down: the project keeps it (src/studio.mjs, dismissLikely), never the catalog. */
answer("studio:card-not-promise", async (e, dir, id, phrase) => guard(async () => {
  return thread.call("dismissLikely", projectDir(dir), String(id || ""), String(phrase || ""));
}));

/* A team's arrow on the Paths map turned down: the project keeps it (src/studio.mjs, dismissPair), never the catalog. */
answer("studio:pair-not-path", async (e, dir, from, to) => guard(async () => {
  return thread.call("dismissPair", projectDir(dir), String(from || ""), String(to || ""));
}));

/* A finding about a card left as it is: the project keeps it (src/studio.mjs, leaveFinding), never the catalog. */
answer("studio:finding-left", async (e, dir, id, why, reason) => guard(async () => {
  return thread.call("leaveFinding", projectDir(dir), String(id || ""), String(why || ""), reason == null ? null : String(reason)); /* plant:hold-direct */
}));

/* A path's end the lead meant: the project keeps it (src/studio.mjs, dismissEnd), never the catalog. */
answer("studio:end-not-path", async (e, dir, id) => guard(async () => {
  return thread.call("dismissEnd", projectDir(dir), String(id || ""));
}));
answer("studio:number-dismiss", async (e, dir, id, key, from) => guard(async () => {
  return thread.call("dismissChangedNumber", projectDir(dir), String(id || ""), String(key || ""), String(from || ""));
}));

answer("studio:card-history", async (e, dir, id) => guard(async () => {
  return thread.call("cardHistory", projectDir(dir), String(id || ""));
}));

answer("studio:card-restore-text", async (e, dir, id, edition) => guard(async () => {
  return thread.call("restoreText", projectDir(dir), String(id || ""), String(edition || ""));
}));

answer("studio:card-diff", async (e, dir, id, a, b) => guard(async () => {
  return thread.call("diffCardEditions", projectDir(dir), String(id || ""), String(a || ""),
    String(b || ""));
}));

/* FIND AND REPLACE, THE ACTS ON SEVERAL CARDS, AND THE SHEET ROUND TRIP (board 834, step 10, C09). The page names
   cards by id and sends the typed text and the ticks, never a payload of cards; a sheet is read only from the file
   the import picker answered, and the folder the export writes is the one its own picker answered. */
const OPTS = (o) => {
  const q = o && typeof o === "object" ? o : {};
  return { find: String(q.find == null ? "" : q.find),
    replace: String(q.replace == null ? "" : q.replace),
    whole: !(q.whole === false), matchCase: !!q.matchCase };
};
const LIST = (a) => (Array.isArray(a) ? a.map(String) : []);

answer("studio:find-places", async (e, dir, o) => guard(async () => {
  return thread.call("findPlaces", projectDir(dir), OPTS(o));
}));

answer("studio:replace-places", async (e, dir, o, keys) => guard(async () => {
  return thread.call("replacePlaces", projectDir(dir), OPTS(o), LIST(keys));
}));

answer("studio:cards-retire", async (e, dir, ids) => guard(async () => {
  return thread.call("retireCards", projectDir(dir), LIST(ids));
}));

answer("studio:cards-move", async (e, dir, ids, shelf) => guard(async () => {
  return thread.call("moveCards", projectDir(dir), LIST(ids), String(shelf || ""));
}));

answer("studio:cards-delete", async (e, dir, ids) => guard(async () => {
  return thread.call("deleteCards", projectDir(dir), LIST(ids));
}));

answer("studio:cards-undo", async (e, dir) => guard(async () => {
  return thread.call("undoBulk", projectDir(dir));
}));

/* BY KIND (board 862): a kind's ticked findings marked as commitments, and the rest turned down, by card id. */
answer("studio:cards-commit", async (e, dir, ids) => guard(async () => {
  return thread.call("commitCards", projectDir(dir), LIST(ids));
}));

/* SINCE THE LAST EDITION (board 862): the changes the draft keeps, and one of them, or one place of a replace, undone. */
answer("studio:changes", async (e, dir) => guard(async () => {
  return thread.call("changesSince", projectDir(dir));
}));

answer("studio:change-undo", async (e, dir, n, spot) => guard(async () => {
  return thread.call("undoChange", projectDir(dir), Number(n) | 0, spot == null ? null : Number(spot) | 0);
}));

answer("studio:cards-not-promise", async (e, dir, pairs) => guard(async () => {
  const list = (Array.isArray(pairs) ? pairs : []).map((p) => ({ id: String((p && p.id) || ""), phrase: String((p && p.phrase) || "") }));
  return thread.call("dismissMany", projectDir(dir), list);
}));

answer("studio:csv-pick", async (e, title) => guard(async () => {
  /* A NATIVE FOLDER DIALOG CANNOT BE DRIVEN, for the reasons written at the import picker above.
     STUDIO_TEST_CSV answers it with a folder, a variable of its own so that one leg can pick a
     sheet and a folder in a run. Everything after the pick is the real write. */
  if (testOnly("STUDIO_TEST_CSV")) return { folder: chosen.keep("csv", testOnly("STUDIO_TEST_CSV")) };
  const win = BrowserWindow.fromWebContents(e.sender);
  const r = await pick("open", win, {
    title: String(title || ""), properties: ["openDirectory", "createDirectory"],
  });
  return { folder: chosen.keep("csv", (r.canceled || !r.filePaths.length) ? null : r.filePaths[0]) };
}));

/* `ids` is the ticked cards, or null for every card. */
answer("studio:csv-export", async (e, dir, ids, folder) => !chosen.took("csv", folder, true)
  ? unchosen("studio:csv-export", folder) : guard(async () => {
  return thread.call("exportCards", projectDir(dir), ids == null ? null : LIST(ids), String(folder || ""));
}));

answer("studio:sheet-plan", async (e, dir, file) => !chosen.took("import", file)
  ? unchosen("studio:sheet-plan", file) : guard(async () => {
  return thread.call("sheetPlan", projectDir(dir), String(file || ""));
}));

answer("studio:sheet-land", async (e, dir, file, fingerprint) => !chosen.took("import", file)
  ? unchosen("studio:sheet-land", file) : guard(async () => {
  return thread.call("sheetLand", projectDir(dir), String(file || ""), String(fingerprint || ""));
}));

answer("studio:rename", async (e, dir, name) => guard(async () => {
  return thread.call("renameProject", projectDir(dir), String(name || ""), withHere());
}));

/* THE PUBLISHED FILE'S NAME, changed on its own press: the page sends the typed text and src/studio.mjs
   makes the slug and moves the one file. */
answer("studio:file-name", async (e, dir, name) => guard(async () => {
  return thread.call("changeFileName", projectDir(dir), String(name == null ? "" : name),
    withHere({ teamKeys: (await teamsNow()).teamKeys }));
}));

/* A LINKED COPY FOR A SECOND TEAM, and the one press that brings it up to its original (src/link.mjs; board 962, 2026-11-08
   16:36). The copy goes into the projects root, as New project's does; the press writes only into the copy's inbox. */
answer("studio:linked-copy", async (e, dir) => guard(async () => {
  return thread.call("makeLinkedCopy", projectDir(dir), withHere({ root: projectsRoot() }));
}));
answer("studio:bring-up", async (e, dir) => guard(async () => {
  const r = await thread.call("bringUpToOriginal", projectDir(dir), { followed: await followedNow(true) });
  return inUseUp(r);
}));
/* TAKE AS A BASE (board 962, stage 7, V3): a catalog of this Studio's own from the newest edition of one catalog of the team it
   follows, by that catalog's id, linked to it so "Bring up" above brings each newer edition into its review queue. The lead's
   own press, and the only way a followed team's catalog becomes one of this Studio's; what it was built on is kept in the
   project's own record and never in the catalog, so this Studio's desks are told nothing of the team above (src/link.mjs). */
answer("studio:base-take", async (e, catalog) => guard(async () => {
  const r = await thread.call("takeBase", String(catalog == null ? "" : catalog).slice(0, 200),
    withHere({ root: projectsRoot(), followed: await followedNow(true) }));
  return inUseUp(r);
}));

/* THE ARCHIVE. Two reads and one copy, and the copy is the rollback path: the engine rolls a
   desk back by being handed an earlier catalog, so Studio's whole part in it is handing over the
   bytes it kept. */
answer("studio:archive", async (e, dir) => guard(async () => {
  return thread.call("archiveTimeline", projectDir(dir));
}));

answer("studio:diff", async (e, dir, a, b) => guard(async () => {
  return thread.call("diffEditions", projectDir(dir), String(a || ""), String(b || ""));
}));

answer("studio:export-pick", async (e, title, name, kind) => guard(async () => {
  /* A NATIVE SAVE DIALOG CANNOT BE DRIVEN, for the reasons written at the import picker above.
     STUDIO_TEST_SAVE answers it with a path; everything after the pick is the real copy. */
  if (testOnly("STUDIO_TEST_SAVE")) return { file: chosen.keep("save", testOnly("STUDIO_TEST_SAVE")) };
  const win = BrowserWindow.fromWebContents(e.sender);
  const r = await pick("save", win, {
    title: String(title || ""), defaultPath: String(name || ""),
    filters: [{ name: catalogKind(kind), extensions: ["ec"] }],
  });
  return { file: chosen.keep("save", (r.canceled || !r.filePath) ? null : r.filePath) };
}));

/* A WHOLE EDITION BACK INTO THE DRAFT, from the Archive: the edition by its name, read from the project's own archive. */
answer("studio:edition-restore", async (e, dir, edition) => guard(async () => {
  return thread.call("restoreEdition", projectDir(dir), String(edition || ""));
}));

answer("studio:export-edition", async (e, dir, edition, file) => !chosen.took("save", file, true)
  ? unchosen("studio:export-edition", file) : guard(async () => {
  return thread.call("exportEdition", projectDir(dir), String(edition || ""),
    String(file || ""), withHere());
}));

/* THE AUDIT PACK. One read and one write, and the write is the folder that leaves the building:
   board 606, and the rule is at the head of src/audit.mjs. The signing key is resolved here for
   its PUBLIC half alone, by the same signingNow() the band's Settings row uses, so the page and
   the command line say the same thing about the same key. */
answer("studio:audit", async (e, dir, edition) => guard(async () => {
  return thread.call("auditEdition", projectDir(dir), String(edition || ""),
    await keyFileNow(), withHere());
}));

answer("studio:audit-pack-pick", async (e, title) => guard(async () => {
  /* A NATIVE FOLDER DIALOG CANNOT BE DRIVEN, for the reasons written at the import picker above.
     STUDIO_TEST_PACK answers it with a folder, and it is a variable of its own rather than a
     second use of STUDIO_TEST_FOLDER so that one leg can set a publish folder and write a pack
     in the same run. Everything after the pick is the real write. */
  if (testOnly("STUDIO_TEST_PACK")) return { folder: chosen.keep("pack", testOnly("STUDIO_TEST_PACK")) };
  const win = BrowserWindow.fromWebContents(e.sender);
  const r = await pick("open", win, {
    title: String(title || ""), properties: ["openDirectory", "createDirectory"],
  });
  return { folder: chosen.keep("pack", (r.canceled || !r.filePaths.length) ? null : r.filePaths[0]) };
}));

answer("studio:audit-pack", async (e, dir, edition, folder) => !chosen.took("pack", folder, true)
  ? unchosen("studio:audit-pack", folder) : guard(async () => {
  return thread.call("exportAuditPack", projectDir(dir), String(edition || ""),
    String(folder || ""), await keyFileNow(), withHere());
}));

answer("studio:publish-plan", async (e, dir) => guard(async () => {
  /* The team keys go with it only so a sealed file in the folder is read for whether it was signed (signedBefore); the plan
     hands back nothing of them. */
  const plan = await thread.call("publishPlan", projectDir(dir),
    withHere({ licenceFile: await licenceFileNow(), seen: await seenFor(), seat: await seatFor(), leadKey: await keyFileNow(), shown: readServiceState().licenceShown,
      teamKeys: (await teamsNow()).teamKeys }));
  return plan && typeof plan === "object" ? Object.assign({}, plan, { signing: await signingPlan(dir) }) : plan;
}));
/* WHETHER WHAT THE VAULT OPENED OPENS THE KEY, tried rather than assumed (Clément's read of studio-sign): bytes that are
   not the key promised Signed on the cover and then refused the publish whole. Tried here, where the secret already is. */
async function keyOpens(file, secret) {
  if (!secret) return false;
  const S = await signLib();
  try { S.unlockKey(S.readKeyFile(file), secret); return true; } catch { return false; }
}
/* WHAT THE COVER SAYS ABOUT THE SIGNATURE: the key's id and print, whether this computer opens it, and whether its file
   cannot be read at all, which is not the same as having no key (Settings refuses to make one over it); never the key,
   and never the file's problem, whose words and path are the command line's. With no key, `makes` where the press will
   make it (firstKey), or `restore`, the print of the key the folder's team trusts (K8). */
async function signingPlan(dir) {
  const at = await keyFileNow(), sign = (await studio()).signingKey(at);
  const first = sign.keyId || sign.problem ? { make: false, lead: "" }
    : await firstKey(await thread.call("teamFacts", projectDir(dir), withHere({ key: at })).catch(() => null));
  return { keyId: sign.keyId, print: sign.print, opens: !!sign.keyId && await keyOpens(at, await keySecret("probe")),
           unreadable: !!sign.problem, ...(first.make ? { makes: true } : {}), ...(first.lead ? { restore: first.lead } : {}) };
}

/* WHAT THE PAGE MAY SAY ABOUT A PUBLISH IS ITS NOTES, THE LEAD'S NOTE FOR THE EDITION, ITS OVERRIDE AND A FIRST FILE NAME, and nothing else. The
   licence, its file, a key to trust and a release date
   are this process's to decide; a page that could hand in a licence state whole could publish
   past any lock (board 745, sense pass item 31). */
/* Whether the relay holds this publish's edition, its head and the team file's ring, read from the runner and the channel. */
function relayHoldsEdition(runner, team, r) {
  if (!runner || typeof runner.channel !== "function") return false;
  const ch = runner.channel(team.team);
  /* Not ch.online(): it is only whether a session is open now, and one can close after the upload; what the relay holds is `sent`. */
  if (!ch) return false;
  const prog = ch.program;
  if (!prog || typeof prog.state !== "function") return false;
  const st = prog.state();
  if (!st || !st.sent) return false;
  const folder = team.folder;
  if (r && r.ec && fs.existsSync(r.ec)) {
    const ecKey = path.relative(folder, r.ec).split(path.sep).join("/");
    const sentEc = st.sent[ecKey];
    if (!sentEc || sentEc.del || sentEc.owe === true) return false;
    try {
      const ecSha = require("node:crypto").createHash("sha256").update(fs.readFileSync(r.ec)).digest("hex");
      if (sentEc.sha !== ecSha) return false;
    } catch { return false; }
  }
  const headPath = path.join(folder, "etiuda-head.json");
  if (fs.existsSync(headPath)) {
    const sentHead = st.sent["etiuda-head.json"];
    if (!sentHead || sentHead.del || sentHead.owe === true) return false;
    try {
      const headBytes = fs.readFileSync(headPath);
      const headDoc = JSON.parse(headBytes.toString("utf8").replace(/^\uFEFF/, ""));
      const editions = headDoc && Array.isArray(headDoc.editions) ? headDoc.editions : [];
      if (!editions.length || (r && r.edition && !editions.some((e) => e && e.edition === r.edition))) return false;
      const headSha = require("node:crypto").createHash("sha256").update(headBytes).digest("hex");
      if (sentHead.sha !== headSha) return false;
    } catch { return false; }
  }
  const teamPath = path.join(folder, "etiuda-team.json");
  if (fs.existsSync(teamPath)) {
    const sentTeam = st.sent["etiuda-team.json"];
    if (!sentTeam || sentTeam.del || sentTeam.owe === true) return false;
    try {
      const teamSha = require("node:crypto").createHash("sha256").update(readWithin(teamPath, TEAM_READ_MAX)).digest("hex");
      if (sentTeam.sha !== teamSha) return false;
    } catch { return false; }
  }
  return true;
}

const PUBLISH_SYNC_WAIT_MS = 8000;
/* The catch-up before a publish numbers its edition is waited out this long at most (E1), and never longer than the wait after it. */
const PUBLISH_CATCH_UP_WAIT_MS = 2000;
answer("studio:publish", async (e, dir, o) => guard(async () => {
  const asked = o || {};
  /* Publishing to a team waits for sign-in where the page says so; a catalog with no team publishes as before. */
  if (await signInWaitsNow() && await teamIdOf(projectDir(dir)).catch(() => "")) await signInWaits("Publishing to a team waits for sign-in."); /* plant:f5-publish */
  await bringBack(projectDir(dir));
  /* CAUGHT UP BEFORE IT NUMBERS (Grok's review mu, 2026-11-22, the first B). A computer that already keeps a relay team numbered the
     edition from its own mirror, which can be behind what another computer of the same lead published; its catch-up after the write
     then took the new file for a local edit and sent it up as replacing the newer edition, which the relay stopped serving. So the
     team's channel runs one cycle first, which catches up before it flushes, and the publisher numbers above whatever the mirror
     then holds and says the folder held a newer one (src/publish.mjs revHeld). bringBack already did this for a team this computer
     does not keep yet. The cycle is waited out for a bounded time only (the test architect's E1: a press returns in a bounded time when
     the relay does not answer, board 1019's r2bound). A relay that does not answer inside the bound is not known to hold anything newer,
     so the press goes ahead as it did before this catch-up and says the relay could not be reached (syncPending, below); the cycle runs
     on in the background, as the roster's own catch-up lets one that does not finish run on (src/relay.mjs caughtUp). */
  let caughtLate = false;
  try {
    const K = await teamStore(), home = (await teamOf(projectDir(dir))).folder;
    if (home && K.relayTeams(await teamsAt()).some((w) => within(home, w.folder) && within(w.folder, home))) {
      const waitMs = Math.min(PUBLISH_CATCH_UP_WAIT_MS, Number(testOnly("STUDIO_PUBLISH_SYNC_WAIT_MS") || PUBLISH_CATCH_UP_WAIT_MS));
      let timer = null;
      const caught = (async () => { await relaySync(); if (relayRunner) await relayRunner.idle(); })(); /* plant:pm1-catch-up */
      caught.catch((err) => process.stderr.write("studio  the relay could not be caught up with before the publish: " + String(err && err.message || err) + "\n"));
      let done = false;
      await Promise.race([caught.then(() => { done = true; }, () => { done = true; }), new Promise((resolve) => { timer = setTimeout(resolve, waitMs); })]); /* plant:pm1-bound */
      caughtLate = !done; /* plant:pm1-late-pending */
      if (timer) clearTimeout(timer);
    }
  } catch (err) {
    process.stderr.write("studio  the relay could not be caught up with before the publish: " + String(err && err.message || err) + "\n");
  }
  /* THE FIRST PUBLISH MAKES THE KEY where firstKey says so (finding 9), so this edition is signed with it. */
  const made = (await keyNone())
    && (await firstKey(await thread.call("teamFacts", projectDir(dir), withHere({ key: await keyFileNow() })).catch(() => null))).make
    && await makeFirstKey();
  /* EVERY EDITION FROM THE SCREEN IS SIGNED where this computer opens the key (publish-screen-never-signs), as Settings
     promises; the secret is opened here for this one signature, as keySecret() says, and never reaches the page. */
  const key = await keyFileNow(), secret = await keySecret(), opens = await keyOpens(key, secret);
  /* THE PUBLISH RUNS INSIDE THE TEAM'S LOCK (board 962 stage 5, T3, 3.6), so no other team act interleaves with it; the sync after it
     runs outside the lock. It writes no team file at a shared folder any more, so nothing of it is kept as teams.json's entry.file.
     plant:publish-keep-file stood on that keeping, which is gone with the folder team; the mark stays until the plant guard has a way to retire one. */
  const r = await teamAct(await teamKeyFor(projectDir(dir)), async () => { /* plant:publish-team-act */
    const out = await thread.call("publishProject", projectDir(dir), {
      notes: asked.notes, leadNotes: asked.leadNotes, override: asked.override, fileName: asked.fileName,
      licenceFile: await licenceFileNow(), seen: await seenFor(), seat: await seatFor(), userData: app.getPath("userData"),
      leadKey: key, ...(await teamsNow()), ...(opens ? { key, passphrase: secret } : {}),
    });
    return out;
  });
  /* The page is given the key a publish made, and asked once for the nudge towards its backup copy by the first that lands. */
  if (!r || typeof r !== "object") return r;
  if (r.refused) return made ? Object.assign({}, r, { signing: await signingNow() }) : r;
  /* A PUBLISH THAT LANDED ON A RELAY TEAM SYNCS AT ONCE (the test architect's R2): the ring and the signed head go up with the edition, so
     each running desk sees the file now and not at the next focus or the five-minute watch. The sync only starts the channel's upload,
     so the channel is waited out too, and the page is answered once the relay holds them. A folder team's publish meets none of this, and
     a sync that fails is logged by relaySync and never turns the landed publish into a failure. */
  let syncPending = caughtLate, syncFailed = false;
  try {
    const K = await teamStore(), home = (await teamOf(projectDir(dir))).folder;
    const relayTeam = home && K.relayTeams(await teamsAt()).find((w) => within(home, w.folder) && within(w.folder, home));
    if (relayTeam) {
      const waitMs = Number(testOnly("STUDIO_PUBLISH_SYNC_WAIT_MS") || PUBLISH_SYNC_WAIT_MS);
      const syncTask = (async () => {
        try {
          await relaySync(); if (relayRunner) await relayRunner.idle(); /* plant:r2-publish-sync */
        } catch (err) {
          process.stderr.write("studio  the relay could not be kept in step after the publish: " + String(err && err.message || err) + "\n");
        }
      })();
      let timer = null;
      const timedOut = await Promise.race([
        syncTask.then(() => false),
        new Promise((resolve) => { timer = setTimeout(() => resolve(true), waitMs); }),
      ]);
      if (timer) clearTimeout(timer);
      if (timedOut) syncPending = true;
      else if (!relayHoldsEdition(relayRunner, relayTeam, r)) {
        syncFailed = true; /* plant:r2-sync-failed */
      }
    }
  } catch (err) {
    syncFailed = true;
    process.stderr.write("studio  the relay could not be kept in step after the publish: " + String(err && err.message || err) + "\n");
  }
  const nudge = await keyNudgeNow();
  return made || nudge || syncPending || syncFailed
    ? Object.assign({}, r, {
        signing: await signingNow(),
        ...(nudge ? { keyNudge: true } : {}),
        ...(syncPending && !syncFailed ? { syncPending: true } : {}),
        ...(syncFailed ? { syncFailed: true } : {}),
      })
    : r;
}));

/* The one place Studio hands anything to the rest of the desktop, and it hands it a folder of
   the person's own choosing to look at. No URL ever reaches here. */
/* THE COUNTING PERIOD, rewritten as soon as the lead changes it. The token is whatever the
   pinned spanShape accepts. Anything else, including a hostile value, is the rolling thirty
   days, so the page's value is judged here and never reaches the thread as itself. */
function studioSpanToken(span) {
  if (typeof span !== "string" || !span) return "";
  const rules = require("../src/engine.mjs").statsRules();
  return typeof rules.spanShape === "function" && rules.spanShape(span) ? span : "";
}
answer("studio:stats-span", async (e, dir, span) => guard(async () => {
  const token = studioSpanToken(span) || "rolling-30";
  return thread.call("setStatsSpan", projectDir(dir), token, withHere({
    key: await keyFileNow(), passphrase: await keySecret(),
  }));
}));

/* READ ONLY, AND THE PAGE NAMES A PROJECT RATHER THAN A FOLDER: what is read is the project's
   own published folder, opened with the lead's box, which this process holds and the page does not. */
answer("studio:stats", async (e, dir) => guard(async () => {
  await signInWaits("Statistics wait for sign-in."); /* plant:f5-stats */
  await notPaused();
  const project = projectDir(dir);
  const facts = await thread.call("statsFor", project, withHere({
    key: await keyFileNow(), passphrase: await keySecret("open"), removed: await removedFor(project),
  }));
  return withStatsUses(project, facts);
}));

/* THE STATISTICS WORKBOOK. The save dialog is this channel's own, so an edition's .ec pick is
   left as it was. The page sends the dialog's words and, as one string, the sheet names and
   the column heads. Reading statistics pauses after a trial; exporting does not. */
answer("studio:stats-export-pick", async (e, title, name, kind) => guard(async () => {
  if (testOnly("STUDIO_TEST_STATS")) return { file: chosen.keep("stats-xlsx", testOnly("STUDIO_TEST_STATS")) };
  const win = BrowserWindow.fromWebContents(e.sender);
  const r = await pick("save", win, {
    title: String(title || ""),
    defaultPath: String(name || ""),
    filters: [{ name: String(kind || "").slice(0, 60), extensions: ["xlsx"] }],
  });
  return { file: chosen.keep("stats-xlsx", (r.canceled || !r.filePath) ? null : r.filePath) };
}));

answer("studio:stats-export", async (e, dir, file, words) => !chosen.took("stats-xlsx", file, true)
  ? unchosen("studio:stats-export", file) : guard(async () => {
  let said = {};
  try {
    const parsed = JSON.parse(String(words || "").slice(0, 4000));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) said = parsed;
  } catch { said = {}; }
  const cell = (k, n) => String(said[k] == null ? "" : said[k]).slice(0, n);
  return thread.call("exportStatsBook", projectDir(dir), String(file || ""), {
    cards: cell("cards", 31), searches: cell("searches", 31), intents: cell("intents", 31),
    title: cell("title", 80), category: cell("category", 80), status: cell("status", 80), retired: cell("retired", 80),
    copies: cell("copies", 80),
    copiesLang: cell("copiesLang", 80), count: cell("count", 80), intent: cell("intent", 80),
    times: cell("times", 80), totals: cell("totals", 80), lang: cell("lang", 16),
  }, withHere({ key: await keyFileNow(), passphrase: await keySecret("open"), removed: await removedFor(projectDir(dir)) }));
}));

answer("studio:reveal", async (e, dir) => guard(async () => {
  const at = shownPath(dir);
  const p = folderAt(at);         /* a folder only: a file handed to openPath is launched */
  if (!p) throw (await refusal()).refuse("no folder at {P}", { P: at });
  shell.openPath(p);
  return { shown: p };
}));

/* ---- THE OBJECT MENUS' VERBS (board 901) ------------------------------------------------------
 *
 * COPY. The page's own clipboard is refused by the permission handlers at the foot of this file, so a name, a path or a
 * card's text is written from here, as an invitation's blob is. Only text crosses, and only so much of it.
 *
 * SHOW IN EXPLORER. The file manager opens on the item's folder with the item selected. showItemInFolder launches
 * nothing, which is why a file may be named here where Open the folder (studio:reveal) takes only a folder. Either
 * takes a path Studio may show, and a path that is not there any more is still said.
 */
const COPY_MAX = 1000000;
answer("studio:copy", async (e, text) => guard(async () => {
  const said = String(text == null ? "" : text);
  if (!said || said.length > COPY_MAX) return { copied: false };
  clipboard.writeText(said); /* plant:txpr-pr12 */
  return { copied: true };
}));

answer("studio:show", async (e, p) => guard(async () => {
  const at = shownPath(p);
  if (!fs.existsSync(at))
    throw (await refusal()).refuse("{P} is not there any more.", { P: at });
  shell.showItemInFolder(at);
  return { shown: at };
}));

/* A PROJECT TO THE RECYCLE BIN (board 901, the sense pass's finding 27). Only a folder directly in the projects folder that
 * holds a project, never one reached through a link, and never one that holds a team folder the desks read: this
 * project's own or any other project's, in the projects folder or open in a tab, compared by real path so that a
 * junction, a subst drive or a short name cannot hide one inside it (the test architect's conditions 1 and 2, his read of
 * 2026-10-16). The move takes the project's own folder and nothing outside it.
 *
 * NOTHING IS DELETED OUTRIGHT. Electron 44.4.5's trashItem on Windows (shell/common/platform_util_win.cc,
 * MoveItemToTrashWithError) asks IFileOperation to recycle, and its progress sink answers E_ABORT for an item Windows
 * cannot recycle (PreDeleteItem, lines 106 to 117), so on a volume with no Recycle Bin the promise is refused and the
 * folder stays; on Linux it hands the folder to gio, kioclient or trash-put, never to a delete. Where it refuses, or the
 * folder is still there afterwards, the project stays and the page is told so. The page holds a removed project back
 * until its Undo has gone (ui/app.js, projectRemove), so this verb is the move itself. */
const PROJECT_STAYED = "{NAME} could not be moved to the Recycle Bin, so it stays where it is.";
const PROJECT_OUTSIDE = "{NAME} is not a catalog in Studio's catalogs folder, so it stays where it is.";
const PROJECT_HOLDS_TEAM = "The folder the team reads from is inside {NAME}, so the catalog stays where it is.";
const PROJECT_HOLDS_OTHERS = "The folder the team of {OTHER} reads from is inside {NAME}, so the catalog stays where it is.";
function projectStays(frame, at, more) {
  const vars = Object.assign({ NAME: path.basename(String(at || "")) }, more || {});
  return { removed: false, error: frame.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)), said: { frame, vars } };
}
/** A path as the disk has it, links and short names followed; one that is not there is taken as written. */
function realOf(p) {
  try { return fs.realpathSync.native(p); } catch { return path.resolve(p); } /* plant:txpr-pr15 */
}
/** Whether `child` is `parent` or inside it, by real paths, in the letter case Windows ignores. */
function within(child, parent) {
  const fold = (s) => (process.platform === "win32" ? s.toLowerCase() : s);
  const rel = path.relative(fold(realOf(parent)), fold(realOf(child)));
  return rel === "" || (rel !== ".." && !rel.startsWith(".." + path.sep) && !path.isAbsolute(rel));
}
/** A project's own word for its team folder and its name. A relay team is read at this computer's mirror; a folder
 *  team is read where its place resolves, and the stored path stands where it does not. Nothing where that file will not read. */
async function teamOf(dir) {
  let p = null;
  try { p = JSON.parse(fs.readFileSync(path.join(dir, "project.json"), "utf8")); }
  catch { return { folder: "", name: "" }; }
  const here = (await teamStore()).folderHere(p, { userData: app.getPath("userData") });
  const f = here ? path.resolve(dir, here) : "";
  return { folder: f, name: p && typeof p.displayName === "string" && p.displayName ? p.displayName : path.basename(dir) };
}
/** The project whose team folder is `home` or inside it, itself first, then every project in the projects folder and
 *  every one the store keeps open in a tab; null where there is none. */
async function teamInside(home) {
  const root = projectsRoot(), dirs = [home];
  try { for (const n of fs.readdirSync(root)) dirs.push(path.join(root, n)); } catch { /* no folder to read */ } /* plant:txpr-pr14 */
  const kept = readStore().tabs;
  for (const t of kept && Array.isArray(kept.open) ? kept.open : []) if (t && typeof t.dir === "string" && t.dir) dirs.push(t.dir); /* plant:txpr-pr14-2 */
  for (const d of dirs) {
    const t = await teamOf(d);
    if (t.folder && within(t.folder, home)) return { dir: d, name: t.name };
  }
  return null;
}
answer("studio:project-remove", async (e, dir) => guard(async () => {
  const named = path.resolve(String(dir == null ? "" : dir));
  const home = projectPlace(dir); /* plant:txpr-pr13 */
  if (!home) return projectStays(PROJECT_OUTSIDE, named);
  const gone = folderAt(home);
  if (!gone) return projectStays(PROJECT_OUTSIDE, named);
  let linked = true;
  try { linked = fs.lstatSync(gone).isSymbolicLink(); } catch { linked = true; }
  let holds = fs.existsSync(path.join(gone, "project.json"));
  if (!holds) { try { holds = fs.readdirSync(gone).some((n) => /\.draft\.json$/i.test(n)); } catch { holds = false; } }
  if (linked || !holds) return projectStays(PROJECT_OUTSIDE, gone);
  const team = await teamInside(gone);
  if (team) return pathsSame(team.dir, gone) ? projectStays(PROJECT_HOLDS_TEAM, gone) /* plant:txpr-pr10 */
    : projectStays(PROJECT_HOLDS_OTHERS, gone, { OTHER: team.name });
  try { await shell.trashItem(gone); } /* plant:txpr-pr9 */
  catch { return projectStays(PROJECT_STAYED, gone); } /* plant:txpr-pr11 */
  if (fs.existsSync(gone)) return projectStays(PROJECT_STAYED, gone);
  return { removed: true, dir: gone };
}));

/* ---- the launch gate ------------------------------------------------------------------------
 *
 * STUDIO_GATE=1 makes this process into its own probe: launch, paint, close. It waits for the
 * page to say it has drawn, captures the window, counts the pixels that are not the one colour a
 * blank window would be, prints ONE machine-readable line and quits with a verdict. A gate that
 * needs a browser attached to it cannot run where there is no browser, and a window that loaded
 * without painting looks exactly like one that painted, from outside, which is the fault this
 * measures rather than assumes.
 */
/* STUDIO_GATE=spelling is the same gate with one step more, after the paint: spellGate below; STUDIO_GATE=keyring the
   same with keyGate's. */
const GATE_ASKED = process.env.STUDIO_GATE;
const GATE = GATE_ASKED === "1" || GATE_ASKED === "spelling" || (GATE_ASKED === "keyring" && process.platform === "linux");
function gateLine(o) {
  process.stdout.write("studio-launch " + Object.keys(o).map(k => k + "=" + o[k]).join(" ") + "\n");
}
async function runGate(win) {
  const t0 = Date.now();
  const out = { painted: 0, distinct: 0, width: 0, height: 0, rows: 0, none: 0, screen: "", ms: 0,
                ok: 0 };
  /* WHAT THE PAGE SAID, ON STDERR, because the commonest way this gate fails is a page that
     threw before it could report anything, and "the page never reported a rendered screen" on
     its own sends the reader to the wrong half of the program. */
  win.webContents.on("console-message", (e) => {
    const level = e && e.level != null ? e.level : "";
    const message = e && e.message != null ? e.message : "";
    const at = e && e.sourceId ? " (" + e.sourceId + ":" + e.lineNumber + ")" : "";
    process.stderr.write("studio-launch  page[" + level + "] " + message + at + "\n");
  });
  win.webContents.on("preload-error", (e, at, err) => {
    process.stderr.write("studio-launch  preload " + at + ": " + (err && err.message) + "\n");
  });
  try {
    await new Promise((res, rej) => {
      const to = setTimeout(() => rej(new Error("the page never finished loading")), 30000);
      win.webContents.once("did-finish-load", () => { clearTimeout(to); res(); });
    });
    /* The page sets window.STUDIO_READY once it has rendered its first screen. Polled rather
       than raced against a fixed delay: a delay that passes on this desk is a delay that fails
       on a slower one, and the whole point of the gate is that it is the same everywhere. */
    const readyBy = Date.now() + 20000;
    let ready = null;
    while (Date.now() < readyBy) {
      ready = await win.webContents.executeJavaScript(
        "(window.STUDIO_READY ? JSON.stringify(window.STUDIO_READY) : null)");
      if (ready) break;
      await new Promise(r => setTimeout(r, 100));
    }
    if (!ready) throw new Error("the page never reported a rendered screen");
    const r = JSON.parse(ready);
    out.rows = r.rows | 0;
    out.none = r.none | 0;
    out.catalogs = r.catalogs | 0;
    out.screen = String(r.screen || "");

    /* THE PAGE BEING READY IS NOT THE WINDOW HAVING A FRAME. The document can finish its first
       render before the compositor has produced anything for this window at all, and an
       offscreen window is throttled on top of that; capturePage against a window in that state
       either answers an empty image or throws UnknownVizError out of the compositor. Both were
       measured here on 2026-09-17 - the first launch of the gate threw and the second, a few
       hundred milliseconds slower, did not, which is exactly the shape of a race. So the
       capture is retried until it has a frame, and the gate fails only when it never gets one.
       A fixed delay was not used on purpose: one that passes on this desk fails on a slower. */
    let img = null, size = { width: 0, height: 0 }, seen = new Set(), painted = 0;
    const by = Date.now() + 20000;
    while (Date.now() < by) {
      try { img = await win.webContents.capturePage(); }
      catch { img = null; }
      if (img) {
        size = img.getSize();
        if (size.width > 0 && size.height > 0) {
          const buf = img.getBitmap();      /* BGRA, one row after another, no padding */
          seen = new Set(); painted = 0;
          for (let i = 0; i < buf.length; i += 4) {
            if (buf[i + 3] > 8) painted++;
            if (seen.size < 4096) seen.add((buf[i] << 16) | (buf[i + 1] << 8) | buf[i + 2]);
          }
          if (painted > 0 && seen.size > 8) break;
        }
      }
      await new Promise(r => setTimeout(r, 150));
    }
    out.width = size.width; out.height = size.height;
    out.painted = painted;
    out.distinct = seen.size;
    /* A window that painted has most of its pixels opaque and more than a handful of colours:
       a blank one is a single flat fill, and an unshown one is empty. The band's strip is the
       one place nothing is painted, so the floor is well under the whole. */
    const whole = size.width * size.height;
    out.ok = (whole > 0 && painted > whole * 0.5 && seen.size > 8 && (out.rows > 0 || out.catalogs > 0 || out.none > 0))
      ? 1 : 0;
    if (GATE_ASKED === "spelling") await spellGate(win);
    if (GATE_ASKED === "keyring") await keyGate(win);
  } catch (e) {
    out.ok = 0;
    out.screen = out.screen || "";
    process.stderr.write("studio-launch  " + (e && e.message ? e.message : String(e)) + "\n");
  }
  out.ms = Date.now() - t0;
  gateLine(out);
  app.exit(out.ok ? 0 : 1);
}

/* THE SPELLING STEP, asked for by STUDIO_GATE=spelling and by nothing else, so the gate's own run is unchanged. While a
   gate drives the window Studio's own edit menu stays closed, so what a right-click finds is read where Chromium hands
   it over, the context-menu event:
   a field is added to the page, each word typed into it and right-clicked, and the misspelt word and the suggestions
   are printed, one line a word. The words are the gate's own, two misspelt and the same two spelt right as their
   control; tests/linux-studio.mjs reads the lines from the installed package. */
const SPELL_WORDS = ["teh", "dzienkujemy", "the", "dzi\u0119kujemy"];
async function spellGate(win) {
  const wc = win.webContents, wait = ms => new Promise(r => setTimeout(r, ms));
  for (const word of SPELL_WORDS) {
    const at = await wc.executeJavaScript("(() => { let t = document.getElementById('studioSpellProbe');"
      + " if (!t) { t = document.createElement('textarea'); t.id = 'studioSpellProbe'; t.spellcheck = true;"
      + " t.setAttribute('style', 'position:fixed;left:40px;top:40px;width:420px;height:80px;z-index:2147483647;font:20px sans-serif');"
      + " document.body.appendChild(t); }"
      + " t.value = ''; t.focus(); const r = t.getBoundingClientRect(); return { x: Math.round(r.x + 14), y: Math.round(r.y + 16) }; })()");
    wc.insertText(word + " ");
    await wait(1500);
    const p = await new Promise(res => {
      const to = setTimeout(() => res(null), 3000);
      wc.once("context-menu", (e, params) => { clearTimeout(to); res(params); });
      for (const type of ["mouseDown", "mouseUp"]) wc.sendInputEvent({ type, x: at.x, y: at.y, button: "right", clickCount: 1 });
    });
    process.stdout.write("studio-spelling word=" + JSON.stringify(word) + " misspelt=" + JSON.stringify(p ? p.misspelledWord : null)
      + " suggestions=" + JSON.stringify(p ? p.dictionarySuggestions : null) + "\n");
  }
}

/* THE KEYRING STEP, asked for by STUDIO_GATE=keyring and by nothing else. The page presses Make a signing key through its
   own bridge, as a click does, in the gate's own profile, and one line says what the vault answered and whether a key file
   was written, its refusal's words where there was one. Read from the installed package by hand, on Linux alone (the
   keyring's measurement); no gate launches it. */
async function keyGate(win) {
  let r = null;
  try { r = await win.webContents.executeJavaScript("window.STUDIO.keyMake()"); }
  catch (e) { r = { error: "the page did not answer: " + (e && e.message) }; }
  let file = false;
  try { file = fs.existsSync(await keyFileNow()); } catch { file = false; }
  const b = vaultBackend();
  let on = null;
  try { on = safeStorage.isEncryptionAvailable(); } catch { on = null; }
  process.stdout.write("studio-keyring backend=" + JSON.stringify(b) + " available=" + on + " made=" + !!(r && !r.error && r.keyId)
    + " file=" + file + " refused=" + JSON.stringify(r && r.error ? r.error : null) + "\n");
}

/* THE TRAY, START WITH WINDOWS, CLOSE POLICY, AND JUMP LIST (board 969, run S5). */
const SHELL_TRAY_WORDS = {
  en: {
    trayOpen: "Open Etiuda Studio",
    trayTip: "Etiuda Studio",
    trayQuit: "Quit Etiuda Studio",
    traySettings: "Settings",
    trayNotesOn: "Notifications: on",
    trayNotesOff: "Notifications: off",
    trayRecent: "Recent catalogs",
    trayNewCatalog: "New catalog",
    trayOpenFolder: "Open a folder",
    trayLibrary: "Library",
    trayKeepsRunning: "Etiuda Studio keeps running in the tray",
    trayKeepsBody: "Proposals and requests to join still arrive. The tray icon quits it, and Settings, under General, changes this.",
    trayBubbleBody: "Proposals and requests to join still arrive. To quit, right-click its icon here and choose Quit Etiuda Studio.",
    trayBubbleOff: "Don't show again",
    trayBubbleOk: "OK",
    trayProposalsWaiting: "Proposals waiting: {N}",
    trayRequestsWaiting: "Requests to join waiting: {N}",
    trayTipWaiting: "Etiuda Studio: waiting: {N}",
  },
  pl: {
    trayOpen: "Otwórz Etiudę Studio",
    trayTip: "Etiuda Studio",
    trayQuit: "Zakończ Etiudę Studio",
    traySettings: "Ustawienia",
    trayNotesOn: "Powiadomienia: wł.",
    trayNotesOff: "Powiadomienia: wył.",
    trayRecent: "Ostatnie katalogi",
    trayNewCatalog: "Nowy katalog",
    trayOpenFolder: "Otwórz folder",
    trayLibrary: "Biblioteka",
    trayKeepsRunning: "Etiuda Studio działa dalej w zasobniku",
    trayKeepsBody: "Propozycje i prośby o dołączenie wciąż docierają. Program zamyka się z ikony w zasobniku, a to zachowanie zmienia się w Ustawieniach, w części Ogólne.",
    trayBubbleBody: "Propozycje i prośby o dołączenie wciąż docierają. Aby zamknąć program, wystarczy kliknąć tę ikonę prawym przyciskiem i wybrać Zakończ Etiudę Studio.",
    trayBubbleOff: "Nie pokazuj więcej",
    trayBubbleOk: "OK",
    trayProposalsWaiting: "Czekające propozycje: {N}",
    trayRequestsWaiting: "Czekające prośby o dołączenie: {N}",
    trayTipWaiting: "Etiuda Studio: czeka: {N}",
  },
};

function trayWords() {
  const lang = recoveryLang();
  return SHELL_TRAY_WORDS[lang] || SHELL_TRAY_WORDS.en;
}

function launchHidden() {
  return Array.isArray(process.argv) && process.argv.includes("--hidden");
}

let quitOnClose = false;
let quitOnCloseKnown = false;
function readQuitOnClose() {
  if (!quitOnCloseKnown) {
    const s = readStore();
    quitOnClose = !!(s && s.quitOnClose);
    quitOnCloseKnown = true;
  }
  return quitOnClose;
}

function setQuitOnClose(on) {
  quitOnClose = !!on;
  quitOnCloseKnown = true;
}

function storeQuitOnClose(on) {
  setQuitOnClose(on);
  const s = readStore() || {};
  if (on) s.quitOnClose = true;
  else delete s.quitOnClose;
  writeStore(s);
}

function notesOn() {
  const s = readStore();
  return !s || s.trayNotes !== false;
}

function setTrayNotes(on) {
  const s = readStore() || {};
  s.trayNotes = !!on;
  writeStore(s);
  rebuildTrayMenu();
}

/* On while any value starts this Studio at sign-in, its own or an earlier build's, so the switch shows what the next sign-in
   does (loginItemTo above). */
function loginItemStateNow() {
  let openAtLogin = false;
  try {
    const now = loginItemsNow();
    openAtLogin = !!(now && now.any);
  } catch { /* Windows did not answer */ }
  return { openAtLogin };
}

function showStudio(win) {
  const live = (w) => w && typeof w.isDestroyed === "function" && !w.isDestroyed();
  const w = live(win) ? win : (live(theWindow) ? theWindow : null);
  if (!w) return;
  if (w.studioHiddenPending) {
    w.studioHiddenPending = false;
    if (w.studioMaximizeOnShow && typeof w.maximize === "function") {
      w.studioMaximizeOnShow = false;
      try { w.maximize(); } catch { /* left as it is */ }
      /* Electron is not known to fire 'show' for a hidden window that is maximised, so the hold is taken here and not left to the event
         (the test architect's re-read): a Studio on screen is one someone may edit in. */
      try { windowShown(w); } catch { /* the next verb takes it */ } /* plant:hold-max-shown */
      try { if (typeof w.focus === "function") w.focus(); } catch { /* focus stayed */ }
      return;
    }
  }
  try { if (typeof w.isMinimized === "function" && w.isMinimized() && typeof w.restore === "function") w.restore(); } catch { /* left as it is */ }
  try { if (typeof w.show === "function") w.show(); } catch { /* already on screen */ }
  try { if (typeof w.focus === "function") w.focus(); } catch { /* focus stayed */ }
}

function openSettingsFromTray() {
  const win = theWindow;
  showStudio(win);
  try {
    if (win && win.webContents && typeof win.webContents.send === "function") {
      win.webContents.send("studio:tray-go", "settings");
    }
  } catch { /* the page is gone */ }
}

let quitting = false;
function trayQuit() {
  quitting = true;
  try { app.quit(); } catch { /* already leaving */ }
}

let lastWaiting = {
  proposalsWaiting: 0,
  requestsWaiting: 0,
  totalWaiting: 0,
  firstProposalTarget: null,
  firstRequestTarget: null,
};

/* ON LINUX THE TRAY IS A PNG. Electron 44 reads an .ico as an empty image there, so the tray never
   appears and a close quits. The badge PNGs already sit beside the .ico files. The base is
   packaging/tray/base.png, the icon's own 32px frame (tools/tray-base.mjs). Windows keeps the
   .ico files, and uses a badge PNG only where that .ico comes out empty. */
function trayPng(badge) {
  const name = badge ? path.join("tray", "tray-" + badge + ".png") : path.join("tray", "base.png");
  const p = path.join(__dirname, "..", "packaging", name);
  if (!fs.existsSync(p)) return null;
  const img = nativeImage.createFromPath(p);
  if (img && typeof img.isEmpty === "function" && img.isEmpty()) return null;
  return img || null;
}
function trayIcon(badge) {
  try {
    if (!nativeImage || typeof nativeImage.createFromPath !== "function") return null;
    if (process.platform === "linux") return trayPng(badge); /* plant:tray-platform */
    if (badge) {
      const p = path.join(__dirname, "..", "packaging", "tray", "tray-" + badge + ".ico");
      if (fs.existsSync(p)) {
        const bImg = nativeImage.createFromPath(p);
        if (bImg && typeof bImg.isEmpty === "function" && !bImg.isEmpty()) return bImg;
      }
      const pngPath = path.join(__dirname, "..", "packaging", "tray", "tray-" + badge + ".png");
      if (fs.existsSync(pngPath)) {
        const bPng = nativeImage.createFromPath(pngPath);
        if (bPng && typeof bPng.isEmpty === "function" && !bPng.isEmpty()) return bPng;
      }
    }
    const p = path.join(__dirname, "..", "packaging", "etiuda-studio.ico");
    const img = nativeImage.createFromPath(p);
    if (img && typeof img.isEmpty === "function" && img.isEmpty()) return null;
    return img || null;
  } catch {
    return null;
  }
}

function openWaitingFromTray(where) {
  const win = theWindow;
  showStudio(win);
  try {
    if (win && win.webContents && typeof win.webContents.send === "function") {
      const target = where === "proposals" ? lastWaiting.firstProposalTarget : lastWaiting.firstRequestTarget;
      win.webContents.send("studio:tray-go", { where, dir: target ? target.dir : "" });
    }
  } catch { /* the page is gone */ }
}

function trayMenuItems() {
  const w = trayWords();
  const items = [];
  if (lastWaiting.proposalsWaiting > 0) {
    items.push({
      label: formatWaitingWord("trayProposalsWaiting", recoveryLang(), { N: lastWaiting.proposalsWaiting }),
      click: () => openWaitingFromTray("proposals"),
    });
  }
  if (lastWaiting.requestsWaiting > 0) {
    items.push({
      label: formatWaitingWord("trayRequestsWaiting", recoveryLang(), { N: lastWaiting.requestsWaiting }),
      click: () => openWaitingFromTray("desks"),
    });
  }
  items.push({ label: notesOn() ? w.trayNotesOn : w.trayNotesOff, click: () => setTrayNotes(!notesOn()) });
  items.push({ label: w.traySettings, click: () => openSettingsFromTray() });
  return items;
}

let studioTray = null;
function rebuildTrayMenu() {
  if (!studioTray || typeof studioTray.setContextMenu !== "function" || !Menu || typeof Menu.buildFromTemplate !== "function") return;
  const w = trayWords();
  try {
    const tpl = buildTrayMenuTemplate({
      openLabel: w.trayOpen,
      onOpen: () => showStudio(theWindow),
      items: trayMenuItems(),
      quitLabel: w.trayQuit,
      onQuit: () => { trayQuit(); },
    });
    studioTray.setContextMenu(Menu.buildFromTemplate(tpl));
    const tip = (lastWaiting.totalWaiting > 0)
      ? formatWaitingWord("trayTipWaiting", recoveryLang(), { N: lastWaiting.totalWaiting })
      : w.trayTip;
    if (typeof studioTray.setToolTip === "function") studioTray.setToolTip(tip);

    const s = readStore() || {};
    const showBadge = s.trayBadge !== false;
    const badgeLabel = showBadge ? pickBadge(lastWaiting.totalWaiting) : null;
    const icon = trayIcon(badgeLabel);
    if (icon && typeof studioTray.setImage === "function") studioTray.setImage(icon);
  } catch (e) {
    console.error("studio: the tray menu could not be rebuilt - " + e.message);
  }
}

function ensureTray() {
  if (studioTray) return studioTray;
  if (typeof Tray !== "function") return null;
  const icon = trayIcon();
  if (!icon) return null;
  const w = trayWords();
  try {
    studioTray = createTray({
      electronTray: Tray,
      electronMenu: Menu,
      icon: icon,
      tooltip: w.trayTip,
      onClick: () => showStudio(theWindow),
      openLabel: w.trayOpen,
      onOpen: () => showStudio(theWindow),
      quitLabel: w.trayQuit,
      onQuit: () => { trayQuit(); },
      items: trayMenuItems(),
    });
    if (typeof rebuildTrayMenu === "function") rebuildTrayMenu();
  } catch (e) {
    console.error("studio: the tray could not be created - " + e.message);
    studioTray = null;
  }
  return studioTray;
}

let waitingBusy = false;
let waitingMore = false;
async function checkWaitingSafe() {
  if (relayClosed) return;
  if (waitingBusy) { waitingMore = true; return; }
  waitingBusy = true;
  try {
    do {
      waitingMore = false;
      await runWaitingCheck();
    } while (waitingMore && !relayClosed);
  } catch (err) {
    process.stderr.write("studio  waiting check could not be completed: " + String(err && err.message || err) + "\n");
  } finally {
    waitingBusy = false;
  }
}

/* Whether proposals are paused, read from the licence file. */
async function licencePausedRead() {
  try {
    const L = await licenceLib(), file = await licenceFileNow();
    const lic = await L.licenceState(L.readLicenceFile(file), { file });
    return !!lic.paused;
  } catch { return false; }
}

/* THE WAITING CHECK IS A READER. It counts proposals and requests and, where Studio still holds its own saved data and
   a signing key, records the told set. Where a newer Studio's file stands, or no key is held yet, it writes nothing:
   not the told set, and not a key, a grant or a rev floor (desksNow's read of a team this Studio leads raises that floor).
   A Studio that does not work runs no check at all. */
async function runWaitingCheck() {
  if (!(await worksNow())) return; /* plant:s1b-waiting */
  if ((await savedNewerNow()) || (await keyNone())) return;

  let projects = [];
  try {
    const S = await studio();
    const l = S.listProjects(projectsRoot(), { userData: app.getPath("userData") });
    projects = (l && Array.isArray(l.projects)) ? l.projects : [];
  } catch {
    projects = [];
  }

  const s = readStore() || {};
  const winState = {
    isVisible: !!(theWindow && typeof theWindow.isVisible === "function" && theWindow.isVisible()),
    isMinimized: !!(theWindow && typeof theWindow.isMinimized === "function" && theWindow.isMinimized()),
    isFocused: !!(theWindow && typeof theWindow.isFocused === "function" && theWindow.isFocused()),
  };

  let toaster = Notification;
  if (harnessLaunch()) toaster = null; /* plant:harness-waiting */
  const res = await checkWaiting({
    electron: { app, Notification: toaster },
    appId: APP_IDS.studio,
    projects,
    listProposals: async (dir) => {
      return thread.call("listProposals", projectDir(dir), withHere({
        teamKeys: (await teamsNow()).teamKeys,
        removed: await removedFor(projectDir(dir)),
      }));
    },
    desksFor: async (dir) => desksNow(projectDir(dir)),
    licencePaused: await licencePausedRead(),
    readStore: () => readStore(),
    store: readStore() || {},
    writeStore: (next) => {
      const cur = readStore() || {};
      const told = (next && Array.isArray(next.told)) ? next.told : [];
      return writeStore(Object.assign({}, cur, { told }));
    },
    windowState: winState,
    onOpenItem: (target) => {
      const win = theWindow;
      showStudio(win);
      try {
        if (win && win.webContents && typeof win.webContents.send === "function") {
          win.webContents.send("studio:tray-go", target);
        }
      } catch {}
    },
    lang: recoveryLang(),
  });

  if (res && res.counts) {
    let firstProp = null;
    let firstReq = null;
    for (const proj of projects) {
      const props = res.counts.proposalsByProject.get(proj.dir);
      if (!firstProp && props && props.length > 0) firstProp = proj;
      const reqData = res.counts.requestsByProject.get(proj.dir);
      if (!firstReq && reqData && reqData.requests && reqData.requests.length > 0) firstReq = proj;
    }
    lastWaiting = {
      proposalsWaiting: res.counts.proposalsWaiting,
      requestsWaiting: res.counts.requestsWaiting,
      totalWaiting: res.counts.totalWaiting,
      firstProposalTarget: firstProp,
      firstRequestTarget: firstReq,
    };
    rebuildTrayMenu();
  }
}

let trayToldThisRun = false;

function maybeFirstClose(win, traced) {
  if (harnessLaunch()) return; /* plant:harness-toast */
  const w = trayWords();
  return notifyFirstClose({
    electron: traced || { Notification: Notification, app: app },
    appId: APP_IDS.studio,
    title: w.trayKeepsRunning,
    body: w.trayKeepsBody,
    told: trayToldThisRun === true,
    setTold: () => {
      trayToldThisRun = true;
    },
    onClick: () => showStudio(win),
  });
}

/* Each first-close attempt through maybeFirstClose as before, with its trace line; once told, no attempt and no line. */
function firstCloseTraced(win) {
  if (trayToldThisRun === true) return maybeFirstClose(win);
  let t = null;
  try {
    let name = "";
    try { name = String(app.getName() || ""); } catch { name = ""; }
    t = trayToastTrace({ Notification: Notification, app: app, harness: harnessLaunch(), defaultAumid: "electron.app." + name,
      state: trayTraceState, write: trayTraceWrite });
  } catch { t = null; }
  if (!t) return maybeFirstClose(win);
  let got;
  try { got = maybeFirstClose(win, t.electron); } catch (e) { t.end(null, e); throw e; } /* plant:trace-caught */
  t.end(got, null);
  return got;
}
/* THE TRAY BUBBLE: at the first close of a start Studio's own violet bubble, the family's shape, stands over the tray icon in place of
   Windows's notification. Once a start; Don't show again writes trayBubble false to the store, which Settings reads and writes too. */
const BUBBLE_W = 360, BUBBLE_PAD = 20, BUBBLE_MS = 9000;
let bubbleWin = null, bubbleTimer = null, bubbleSized = null, bubbleDesk = null;
function bubbleOn() {
  const s = readStore();
  return !s || s.trayBubble !== false; /* plant:bubble-key */
}
function setTrayBubble(on) {
  const s = readStore() || {};
  s.trayBubble = !!on;
  writeStore(s);
}
function bubbleAct(go) {
  if (go !== "ok" && go !== "off" && go !== "open") return;
  if (go === "off") setTrayBubble(false); /* plant:bubble-off-write */
  hideTrayBubble();
  if (go === "open") showStudio(theWindow);
}
function hideTrayBubble() {
  clearTimeout(bubbleTimer);
  bubbleSized = null;
  if (bubbleDesk) { try { bubbleDesk.win.removeListener("show", bubbleDesk.fn); } catch { /* the window is gone */ } bubbleDesk = null; }
  const win = bubbleWin;
  bubbleWin = null;
  if (win && !win.isDestroyed()) { try { win.close(); } catch { /* closed already */ } }
}
/* A press in the bubble is a link to bubble:<word>, caught as a navigation and never followed: the page holds no script and the
   window no preload, so nothing it holds reaches the shell but one of these three words. */
function bubbleGo(url) {
  const m = /^bubble:(ok|off|open)$/.exec(String(url || ""));
  return m ? m[1] : "";
}
/* The bubble's document: the family's bubble as the desk draws it, in Studio's violet (the fill ui/index.html's --bub holds for Studio: the title
   band's violet in the light theme, the lighter violet in the dark one, each with its glow in its own hue), its pointer on the tray icon where there is one, the quiet button on the left and OK filled on the right. */
function bubbleDoc(w, side, tip, dark) {
  let fill = "#5729a6", glow = "rgba(87,41,166,.32)";
  if (dark) { fill = "#6d3fc4"; glow = "rgba(124,58,237,.30)"; } /* plant:bubble-dark */
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return '<!DOCTYPE html>\n<html lang="en">\n<meta charset="utf-8">\n'
    + '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'">\n'
    + '<title>Etiuda Studio</title>\n<style>\n'
    + ':root{color-scheme:light;--bub:' + fill + ';--bub-ink:#fff;--bub-dim:rgba(255,255,255,.92);--bub-shadow:' + glow + ';--radius-sm:8px;'
    + '--sans:"Segoe UI Variable Text","Segoe UI",system-ui,sans-serif}\n'
    + 'html,body{margin:0;height:100%;overflow:hidden;background:transparent}\n'
    + 'body{font:14px/1.35 var(--sans);cursor:default;user-select:none;-webkit-user-select:none}\n'
    + '.bub{position:fixed;left:' + BUBBLE_PAD + 'px;top:' + BUBBLE_PAD + 'px;box-sizing:border-box;width:' + BUBBLE_W + 'px;overflow:visible;padding:12px 14px;'
    + 'background:var(--bub);color:var(--bub-ink);border-radius:14px;line-height:1.5;filter:drop-shadow(0 10px 22px var(--bub-shadow))}\n'
    + '.bub-tip{position:absolute;width:12px;height:12px;margin-left:-6px;background:var(--bub);transform:rotate(45deg);border-radius:2px;pointer-events:none}\n'
    + '.bub[data-side=above]>.bub-tip{bottom:-6px}\n.bub[data-side=below]>.bub-tip{top:-6px}\n.bub[data-side=none]>.bub-tip{display:none}\n'
    + 'h3{margin:0 0 6px;font:700 15.5px/1.3 var(--sans);letter-spacing:-.2px}\n'
    + 'p{margin:0 0 10px;font-size:13.5px;line-height:1.5;color:var(--bub-dim);text-wrap:balance}\n'
    + '.acts{display:flex;gap:8px;justify-content:flex-end;align-items:center;margin-top:2px;padding-top:10px;border-top:1px solid rgba(255,255,255,.24)}\n'
    + 'a{color:inherit;text-decoration:none}.bub-text{display:block}\n'
    + '.btn{display:inline-block;padding:7px 11px;border:1px solid transparent;border-radius:var(--radius-sm);background:rgba(0,0,0,.14);color:#fff;'
    + 'font:600 13px var(--sans);cursor:default;white-space:nowrap;outline:none}\n'
    + '.btn:hover{background:rgba(0,0,0,.26)}\n'
    + '.btn.primary{background:#fff;border-color:#fff;color:var(--bub)}\n.btn.primary:hover{background:#fff;filter:brightness(.94)}\n'
    + '.off{margin-right:auto}\n'
    + '</style>\n<body><div class="bub" role="status" data-side="' + side + '">'
    + '<a class="bub-text" href="bubble:open" draggable="false"><h3>' + esc(w.trayKeepsRunning) + '</h3><p>' + esc(w.trayBubbleBody) + '</p></a>'
    + '<div class="acts"><a role="button" class="btn off" href="bubble:off" draggable="false">' + esc(w.trayBubbleOff) + '</a>'
    + '<a role="button" class="btn primary" href="bubble:ok" draggable="false">' + esc(w.trayBubbleOk) + '</a></div>'
    + '<i class="bub-tip" aria-hidden="true" style="left:' + (tip == null ? 0 : tip) + 'px"></i></div>\n'
    + '\n';
}
/* Made only here, shown without focus: the window under it keeps both the focus and the keyboard. No global shortcut is held, so Esc stays
   with the program in front. Returns whether a window was made; the placing waits for the page's height (studio:bubble-size). */
function showTrayBubble(win) {
  if (typeof BrowserWindow !== "function" || !screen) return false;
  hideTrayBubble();
  const w = trayWords();
  let bounds = null;
  try { bounds = studioTray && typeof studioTray.getBounds === "function" ? studioTray.getBounds() : null; } catch { bounds = null; }
  const real = !!bounds && Number.isFinite(bounds.x) && Number.isFinite(bounds.y) && bounds.width > 0 && bounds.height > 0;
  let d;
  try { d = real ? screen.getDisplayNearestPoint({ x: Math.round(bounds.x + bounds.width / 2), y: Math.round(bounds.y + bounds.height / 2) }) : screen.getPrimaryDisplay(); }
  catch { d = screen.getPrimaryDisplay(); }
  const place = (h) => bubblePlace({ bounds: bounds, display: { bounds: d.bounds, workArea: d.workArea }, size: { width: BUBBLE_W, height: h } });
  const first = place(160);
  let dark = false;
  try { dark = !!nativeTheme.shouldUseDarkColors; } catch { dark = false; }
  const bw = new BrowserWindow({
    width: BUBBLE_W + 2 * BUBBLE_PAD, height: 160 + 2 * BUBBLE_PAD, show: false, frame: false, resizable: false, focusable: false,
    transparent: true, alwaysOnTop: true, skipTaskbar: true, minimizable: false, maximizable: false, fullscreenable: false, hasShadow: false,
    title: "Etiuda Studio", webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false, webviewTag: false, webSecurity: true, spellcheck: false },
  });
  bubbleWin = bw;
  bw.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  bw.webContents.on("will-navigate", (e, url) => { e.preventDefault(); bubbleAct(bubbleGo(url || e.url)); });
  bw.on("closed", () => { if (bubbleWin === bw) hideTrayBubble(); });
  bubbleSized = (h) => {
    bubbleSized = null;
    if (bw.isDestroyed() || bubbleWin !== bw) return;
    const hh = Math.max(60, Math.min(400, Math.round(Number(h) || 160)));
    const at = place(hh);
    bw.setBounds({ x: at.x - BUBBLE_PAD, y: at.y - BUBBLE_PAD, width: BUBBLE_W + 2 * BUBBLE_PAD, height: hh + 2 * BUBBLE_PAD });
    bw.setAlwaysOnTop(true, "pop-up-menu");
    bw.showInactive();
    if (win && typeof win.isDestroyed === "function" && !win.isDestroyed()) { bubbleDesk = { win: win, fn: hideTrayBubble }; win.once("show", hideTrayBubble); }
    bubbleTimer = setTimeout(hideTrayBubble, BUBBLE_MS);
  };
  setTimeout(() => { if (bubbleSized && bubbleWin === bw) bubbleSized(160); }, 800);
  bw.webContents.once("did-finish-load", () => {
    bw.webContents.executeJavaScript("(function(){var e=document.querySelector('.bub');return e?Math.ceil(e.getBoundingClientRect().height):0})()")
      .then((h) => { if (bubbleSized && bubbleWin === bw) bubbleSized(h); }, () => {});
  });
  bw.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(bubbleDoc(w, first.side, first.tip, dark)));
  return true;
}
/* The close's note: the bubble where it can be made and the person has not turned it off, else the Windows notification as before. */
function firstCloseNote(win) {
  if (trayToldThisRun === true) return null; /* plant:bubble-once */
  if (!bubbleOn()) { trayToldThisRun = true; return null; } /* plant:bubble-off */
  if (!harnessLaunch()) {
    try { if (showTrayBubble(win)) { trayToldThisRun = true; return { shown: true, bubble: true }; } } catch { /* the notification stands in */ }
  }
  return firstCloseTraced(win);
}
/* THE FIRST-CLOSE TRACE: each attempt at the first-close toast appends one line to tray-trace.txt in the user-data folder,
   naming what Notification.isSupported() answered, the app user model id in force, harnessLaunch() and the outcome, and
   Windows's own answer on a line of its own when it comes. The attempt is made exactly as it is without the trace. */
const TRAY_TRACE_FILE = "tray-trace.txt", TRAY_TRACE_MAX_BYTES = 64 * 1024, TRAY_TRACE_RUN_LINES = 6;
const trayTraceState = { aumid: "", lines: 0 };
function trayTraceWrite(line) {
  if (trayTraceState.lines >= TRAY_TRACE_RUN_LINES) return;
  trayTraceState.lines++;
  try {
    const at = path.join(app.getPath("userData"), TRAY_TRACE_FILE);
    let size = 0;
    try { size = fs.statSync(at).size; } catch { size = 0; }
    if (size > TRAY_TRACE_MAX_BYTES) {
      const text = fs.readFileSync(at, "utf8"), cut = text.indexOf("\n", text.length - TRAY_TRACE_MAX_BYTES / 2);
      fs.writeFileSync(at, cut < 0 ? "" : text.slice(cut + 1));
    }
    fs.appendFileSync(at, line + "\n");
  } catch { /* an unwritten line costs only itself */ }
}
/* Stand-ins for Electron's Notification and app around one attempt, each passing every call through unchanged; end(got, err)
   writes the attempt's line. o: { Notification, app, harness, defaultAumid, state, write }. */
function trayToastTrace(o) {
  const Real = o.Notification, seen = { supported: "", aumid: "", error: "" };
  const first = e => String(e && e.message || e).split("\n")[0].replace(/[A-Za-z]:\\Users\\[^\\\s"']+/gi, "%USERPROFILE%").slice(0, 200);
  const stamp = () => new Date().toISOString();
  let Stand = Real;
  if (typeof Real === "function") {
    Stand = function (opts) {
      let n;
      try { n = new Real(opts); } catch (e) { seen.error = first(e); throw e; }
      const show = n.show;
      try { n.show = function () { try { return show.apply(n, arguments); } catch (e) { seen.error = first(e); throw e; } }; }
      catch { /* Electron's own show stays */ }
      try {
        n.on("show", () => o.write(stamp() + " first close, Windows: shown"));
        n.on("failed", (ev, err) => o.write(stamp() + " first close, Windows: failed: " + first(err)));
      } catch { /* no events: the attempt's line stands alone */ }
      return n;
    };
    if (typeof Real.isSupported === "function") Stand.isSupported = function () {
      try { const r = Real.isSupported(); seen.supported = String(r); return r; }
      catch (e) { seen.supported = "threw: " + first(e); throw e; }
    };
  }
  const realApp = o.app;
  const standApp = realApp ? new Proxy(realApp, { get(t, k) {
    if (k === "setAppUserModelId" && typeof t.setAppUserModelId === "function") {
      return id => { t.setAppUserModelId(id); seen.aumid = o.state.aumid = String(id); };
    }
    const v = t[k];
    return typeof v === "function" ? v.bind(t) : v;
  } }) : realApp;
  function end(got, err) {
    try {
      let outcome;
      if (err) outcome = "thrown: " + first(err);
      else if (got) outcome = "shown"; /* plant:trace-shown */
      else if (o.harness) outcome = "not attempted (harnessLaunch)";
      else if (seen.error) outcome = "thrown: " + seen.error; /* plant:trace-thrown */
      else if (seen.supported === "false") outcome = "not supported"; /* plant:trace-unsupported */
      else if (typeof Real !== "function") outcome = "not attempted (no Notification)";
      else outcome = "not shown (no reason seen)";
      const aumid = seen.aumid ? seen.aumid + " (this attempt set it)"
        : o.state.aumid ? o.state.aumid + " (an earlier first close set it)"
        : o.defaultAumid + " (Electron's default, unless another toast set one)";
      o.write(stamp() + " first close: isSupported=" + (seen.supported || "not asked") + " aumid=" + aumid
        + " harnessLaunch=" + !!o.harness + " outcome=" + outcome);
    } catch { /* the trace never stands in the close's way */ }
  }
  return { electron: { Notification: Stand, app: standApp }, end };
}

function closeHeld(win, e) {
  let decision = "quit";
  try {
    decision = decideClose({
      stayInTray: !readQuitOnClose(),
      etiudaInstallerClose: !!(win && win.etiudaInstallerClose),
      sessionEnd: !!(win && win.etiudaSessionEnd),
      quitting: !!quitting,
      refusalClose: !!(win && (win.etiudaRefusalClose || win.etiudaCloseOk)),
      placedWindow: false,
    });
  } catch (err) {
    console.error("studio: the close could not be decided - " + err.message);
    decision = "quit";
  }
  if (decision === "hide" && ensureTray()) {
    try { if (e && typeof e.preventDefault === "function") e.preventDefault(); } catch { /* already held */ }
    try { if (win && typeof win.hide === "function") win.hide(); } catch { /* this window cannot hide */ }
    try { firstCloseNote(win); } catch { /* the note is a courtesy */ }
    try { goAway(win); } catch { /* the hold is then let go at quit, as it was */ }
    return true;
  }
  return false;
}

async function isOpenedRecently(dir) {
  if (!dir || typeof dir !== "string") return false;
  try {
    const S = await studio();
    const root = projectsRoot();
    const l = S.listProjects(root, { userData: app.getPath("userData") });
    const projects = l && Array.isArray(l.projects) ? l.projects : [];
    const recentCleared = readStore().recentCleared || null;
    const target = path.resolve(dir);
    return projects.some((p) => {
      if (!p || !p.opened) return false;
      if (recentCleared && p.opened <= recentCleared) return false;
      const pDir = p.dir ? path.resolve(p.dir) : "";
      const pFolder = p.folder ? path.resolve(p.folder) : "";
      return pDir === target || pFolder === target;
    });
  } catch {
    return false;
  }
}

/* A HARNESS LAUNCH WRITES NO JUMP LIST AND SHOWS NO TOAST, which Windows keeps per account (a toast's app id under HKCU)
   outside any lab. Every harness launch carries a
   user-data folder of its own (the door refuses one without) or a test variable; a customer's start carries neither. */
function harnessLaunch() {
  const argv = Array.isArray(process.argv) ? process.argv : [];
  return argv.some(a => /^--user-data-dir(=|$)/.test(String(a)))
    || ["STUDIO_GATE", "STUDIO_TEST_OFFSCREEN", "ETIUDA_TEST_DOCUMENTS"].some(k => process.env[k] !== undefined);
}
async function updateJumpList() {
  try {
    if (typeof app.setJumpList !== "function") return;
    if (harnessLaunch()) return; /* plant:harness-jump */
    const w = trayWords();
    const S = await studio();
    const root = projectsRoot();
    const l = S.listProjects(root, { userData: app.getPath("userData") });
    const projects = l && Array.isArray(l.projects) ? l.projects : [];
    const recentCleared = readStore().recentCleared || null;
    const recent = projects
      .filter((p) => p && p.opened && (!recentCleared || p.opened > recentCleared))
      .sort((a, b) => String(b.opened).localeCompare(String(a.opened)))
      .slice(0, 5)
      .map((p) => ({
        title: p.name || path.basename(p.dir),
        args: `--open "${p.dir}"`,
        description: p.dir,
      }));

    const tasks = [
      {
        title: w.trayNewCatalog,
        args: "--new-catalog",
        description: w.trayNewCatalog,
      },
      {
        title: w.trayOpenFolder,
        args: "--open-folder",
        description: w.trayOpenFolder,
      },
      {
        title: w.trayLibrary,
        args: "--library",
        description: w.trayLibrary,
      },
      {
        title: w.traySettings,
        args: "--settings",
        description: w.traySettings,
      },
    ];

    setJumpList(app, {
      tasks,
      recent,
      recentCategoryName: w.trayRecent,
    });
  } catch {
    /* jump list is a courtesy */
  }
}

function parseOpenArg(argv) {
  const args = Array.isArray(argv) ? argv : [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--open" && i + 1 < args.length) {
      return args[i + 1];
    }
    if (typeof args[i] === "string" && args[i].startsWith("--open=")) {
      return args[i].slice("--open=".length);
    }
  }
  return null;
}

function parseTaskArg(argv) {
  const args = Array.isArray(argv) ? argv : [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--task" && i + 1 < args.length) {
      return args[i + 1];
    }
    if (typeof args[i] === "string" && args[i].startsWith("--task=")) {
      return args[i].slice("--task=".length);
    }
    if (args[i] === "--new-catalog") return "new-catalog";
    if (args[i] === "--open-folder") return "open-folder";
    if (args[i] === "--library") return "library";
    if (args[i] === "--settings") return "settings";
  }
  return null;
}

async function onSecondInstance(argv) {
  const args = Array.isArray(argv) ? argv : [];
  if (updateClose(args)) {
    quitting = true;
    app.quit();
    return;
  }
  const dir = parseOpenArg(args);
  if (dir) {
    if (await isOpenedRecently(dir)) {
      showStudio(theWindow);
      if (theWindow && theWindow.webContents) {
        theWindow.webContents.send("studio:open-dir", dir);
      }
    } else {
      console.error("studio: refused --open for folder not in Opened recently: " + dir);
    }
    return;
  }
  const task = parseTaskArg(args);
  if (task) {
    showStudio(theWindow);
    if (theWindow && theWindow.webContents) {
      theWindow.webContents.send("studio:task", task);
    }
    return;
  }
  if (args.includes("--hidden")) return;
  showStudio(theWindow);
}

/* ONE STUDIO PER PROFILE, the engine's own arrangement: two copies over one studio.json and one
   projects folder write over each other's saves. The second brings the first forward and exits;
   the lock is keyed on the user-data folder, so a gate's lab of its own is unaffected. */
const theOnlyOne = app.requestSingleInstanceLock();
/* THE INSTALLER'S --update-close (the pin's customCheckAppRunning, engine A7): Studio has no tabs to seal, so a first copy started
   by it exits with no window, and a running copy, the one hidden in the tray included, quits, so the installer can replace it
   (board 969, S5). */
const updateClose = (argv) => Array.isArray(argv) && argv.includes("--update-close");
const studioRuns = theOnlyOne && !updateClose(process.argv);
if (!studioRuns) {
  app.quit();
} else {
  try {
    const ud = app.getPath("userData");
    if (ud) performPendingReset(ud);
    if (ud) sweepWork(ud, app.getPath("temp"));
  } catch {}
  app.on("second-instance", (e, argv) => {
    if (updateClose(argv)) {
      quitting = true;
      app.quit();
      return;
    }
    onSecondInstance(argv);
  });
}

if (studioRuns) app.whenReady().then(async () => {
  applyTheme(themeNow());
  /* Studio needs no camera, microphone, location, notification, device or clipboard grant, so
     every request and every check is refused, before the page can make one. */
  session.defaultSession.setPermissionRequestHandler((wc, name, done) => done(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  session.defaultSession.setDevicePermissionHandler(() => false);
  if (SPELLING) spellingFromPackage(session.defaultSession);
  const win = createWindow();
  const asideAt = app.isPackaged ? setTimeout(dropSetAside, 10000) : null; /* only a packaged build has a copy aside to drop */
  if (asideAt && asideAt.unref) asideAt.unref();
  try { ensureTray(); } catch {}
  try { updateJumpList(); } catch {}
  try { checkWaitingSafe(); } catch {}
  dropLeftoverMove();
  const firstDir = parseOpenArg(process.argv);
  const firstTask = parseTaskArg(process.argv);
  if (firstDir || firstTask) {
    win.webContents.on("did-finish-load", async () => {
      if (firstDir && await isOpenedRecently(firstDir)) {
        setTimeout(() => {
          try { if (!win.isDestroyed()) win.webContents.send("studio:open-dir", firstDir); } catch {}
        }, 150);
      }
      if (firstTask) {
        setTimeout(() => {
          try { if (!win.isDestroyed()) win.webContents.send("studio:task", firstTask); } catch {}
        }, 150);
      }
    });
  }
  if (GATE) runGate(win);
  /* The team watch every five minutes besides, holding nothing open (board 885, S2). */
  teamWatchLib().then((W) => {
    if (relayClosed) return;
    watchTimer = setInterval(() => { if (!relayClosed) teamWatch(""); }, W.WATCH_MS);
    if (watchTimer && watchTimer.unref) watchTimer.unref();
  });
  try { await followStart(); } catch (err) { process.stderr.write("studio  the followed team could not be started: " + String(err && err.message || err) + "\n"); }
  armCatalogWatches();
  await resumeHandover();
  relaySync();
  armLicenceCheck();
  armNoteCheck();
});

/* A stand-in timer from a test has no hasRef, and clearTimeout would throw on it. A real timer does. */
function clearArmed(timer, clear) {
  if (!timer || typeof timer.hasRef !== "function") return;
  try { clear(timer); } catch { /* already gone */ }
}
function closeUseWatchers() {
  for (const w of useWatchers.values()) { try { w.close(); } catch { /* already gone */ } }
  useWatchers.clear();
}
/* Quit stops the relay for good. The watch and the licence timers are cleared at once and nothing may arm the runner again;
   the promise endRelay returns waits out a sync already running and then stops the runner. Electron does not await a
   will-quit listener's promise, so that relay wait does not hold the installed app, since a sync stuck on an unreachable
   relay would otherwise hold the user's quit. The promise is for the harness (tests/relay-studio.mjs), which waits on it
   before judging a leg. */
function endRelay() {
  if (relayEnding) return relayEnding;
  relayClosed = true;
  clearArmed(watchTimer, clearInterval); watchTimer = null;
  clearArmed(licenceFirst, clearTimeout); licenceFirst = null;
  clearArmed(licenceTick, clearInterval); licenceTick = null;
  clearArmed(noteFirst, clearTimeout); noteFirst = null;
  clearArmed(noteTick, clearInterval); noteTick = null;
  relayEnding = (async () => {
    try { await followStop(); } catch { /* the followed team's run is already down */ }
    try { if (watchRun) await watchRun; } catch { /* the watch already said why */ }
    try { if (relayBusy) await relayBusy; } catch { /* the sync already said why */ }
    closeUseWatchers();
    if (relayRunner) {
      const running = relayRunner;
      relayRunner = null;
      try { await running.stop(); } catch { /* the runner is already down */ }
    }
  })();
  return relayEnding;
}
app.on("will-quit", () => {
  holdQuitting = true;
  try { holdLetGo(); } catch {}
  try { if (studioTray && typeof studioTray.destroy === "function") studioTray.destroy(); } catch {}
  closeUseWatchers();
  return endRelay();
});
app.on("window-all-closed", () => { app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    RESET_KEEP_NAMES,
    sweepWork,
    WORK_NAME,
    isResetStudioKept,
    resetStudioUserData,
    performPendingReset,
    readResetMarker,
    resetStudioNow,
    resetNoticeNow: () => resetNotice,
    retryPendingReset,
    stopPendingReset,
    relaySync,
    relayRunnerNow: () => relayRunner,
    teamWatchNow: () => watchRun,
    waitingBusyNow: () => waitingBusy,
    withdrawNow: () => withdrawRun,
    serviceDoorsSet,
    signInLandingHtml,
    signInLanding,
    removalShownNow: (teamId, roster) => removalShown(teamId, roster),
    seatsShownNow: (teamId) => seatsShown(teamId),
    teamWatch: (force) => teamWatch(force),
    holdBlocks: (root) => holdBlocks(root),
    resumeWhenHeld: () => resumeWhenHeld(),
    resumeLastNow: () => resumeLast,
    watchOnce: (force) => watchOnce(force),
    endRelay,
    findOldKey,
    setKeyAsideAndMakeNew,
    runHandover,
    resumeHandover,
    teamAct,
    checkWaitingSafe: () => checkWaitingSafe(),
    teamKeyFor,
    runnerTeamAct,
    lendingTo,
    relayOnceLent,
    outsideActs,
    createWindow
  };
}
