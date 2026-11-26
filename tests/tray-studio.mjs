/* THE TRAY HELPER, CLOSE POLICY, UPDATE CLOSE, FIRST CLOSE, AND JUMP LIST FOR STUDIO.
 *
 *   node tests/tray-studio.mjs
 *
 * Runs in bare node with Electron stand-ins.
 * British English, no em or en dashes.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PINNED_TRAY = path.join(ROOT, "engine", "pinned", "shell", "tray.cjs");
const nodeRequire = createRequire(import.meta.url);

let checks = 0, failed = 0;
function check(ok, what) {
  checks++;
  if (ok) {
    console.log("  ok   " + what);
  } else {
    failed++;
    console.log("  FAIL " + what);
  }
}

function extractFunction(src, name) {
  const at = src.indexOf("function " + name + "(");
  if (at < 0) return null;
  let depth = 0;
  for (let k = src.indexOf("{", at); k < src.length; k++) {
    if (src[k] === "{") depth++;
    else if (src[k] === "}" && !--depth) return src.slice(at, k + 1);
  }
  return null;
}

function makeFakeElectron() {
  const fakeApp = {
    _appUserModelId: null,
    _loginItemSettings: null,
    _jumpList: null,
    _quitCalled: false,
    setAppUserModelId(id) {
      this._appUserModelId = id;
    },
    setLoginItemSettings(settings) {
      this._loginItemSettings = settings;
    },
    setJumpList(categories) {
      this._jumpList = categories;
    },
    quit() {
      this._quitCalled = true;
    },
  };

  class FakeNotification {
    constructor(opts) {
      this.opts = opts;
      this.shown = false;
      this._handlers = {};
    }
    on(event, handler) {
      this._handlers[event] = handler;
      return this;
    }
    show() {
      this.shown = true;
    }
    click() {
      if (this._handlers.click) this._handlers.click();
    }
  }

  const FakeMenu = {
    buildFromTemplate(template) {
      return { template, items: template };
    },
  };

  class FakeTray {
    constructor(icon) {
      this.icon = icon;
      this.toolTip = null;
      this.contextMenu = null;
      this._handlers = {};
    }
    setToolTip(tip) {
      this.toolTip = tip;
    }
    setContextMenu(menu) {
      this.contextMenu = menu;
    }
    on(event, handler) {
      this._handlers[event] = handler;
      return this;
    }
    click() {
      if (this._handlers.click) this._handlers.click();
    }
  }

  return {
    app: fakeApp,
    Notification: FakeNotification,
    Menu: FakeMenu,
    Tray: FakeTray,
  };
}

async function run() {
  /* Leg 5: packaged files include engine/pinned/shell/tray.cjs */
  const modulesTxt = fs.readFileSync(path.join(ROOT, "tools", "engine-modules.txt"), "utf8");
  check(modulesTxt.split("\n").some((l) => l.trim() === "shell/tray.cjs"),
    "ts5a tools/engine-modules.txt lists shell/tray.cjs");

  const trayPinnedExists = fs.existsSync(PINNED_TRAY);
  check(trayPinnedExists, "ts5b engine/pinned/shell/tray.cjs is fetched and exists");

  const shippedModule = await import("./shell-shipped.mjs");
  const shippedList = shippedModule.SHELL_SHIPPED || [];
  check(shippedList.some((s) => s.file === "engine/pinned/shell/tray.cjs"),
    "ts5c tests/shell-shipped.mjs lists engine/pinned/shell/tray.cjs");

  const builderText = fs.readFileSync(path.join(ROOT, "electron-builder.js"), "utf8");
  check(!builderText.includes("!engine/pinned/shell/tray.cjs"),
    "ts5d electron-builder.js does not exclude engine/pinned/shell/tray.cjs");

  if (!trayPinnedExists) {
    console.log("  FAIL remaining checks blocked: engine/pinned/shell/tray.cjs does not exist yet");
    console.log("\n#counts checks=" + checks + " failures=" + (failed + 4));
    process.exit(1);
  }

  const trayMod = nodeRequire(PINNED_TRAY);
  const {
    decideClose,
    APP_IDS,
    notifyFirstClose,
    buildLoginItemSettings,
    buildTrayMenuTemplate,
    createTray,
    buildJumpList,
    setJumpList,
  } = trayMod;

  /* Leg 1: close hides, Quit quits through the folder flush */
  check(decideClose({ stayInTray: true }) === "hide", "ts1a close policy: stayInTray true hides");
  check(decideClose({ stayInTray: false }) === "quit", "ts1b close policy: stayInTray false quits");
  check(decideClose({ stayInTray: true, etiudaInstallerClose: true }) === "quit",
    "ts1c close policy: etiudaInstallerClose quits with stayInTray on");
  check(decideClose({ stayInTray: true, sessionEnd: true }) === "quit",
    "ts1d close policy: sessionEnd quits with stayInTray on");
  check(decideClose({ stayInTray: true, quitting: true }) === "quit",
    "ts1e close policy: quitting quits with stayInTray on");
  check(decideClose({ stayInTray: true, refusalClose: true }) === "quit",
    "ts1f close policy: refusalClose quits with stayInTray on");
  check(decideClose({ stayInTray: true, placedWindow: true }) === "quit",
    "ts1g close policy: placedWindow quits with stayInTray on");

  const mainPath = process.env.TRAY_MAIN ? path.resolve(process.env.TRAY_MAIN) : path.join(ROOT, "shell", "main.js");
  const mainText = fs.readFileSync(mainPath, "utf8");
  check(mainText.includes('require("../engine/pinned/shell/tray.cjs")'),
    "ts1h shell/main.js requires pinned shell/tray.cjs");
  check(mainText.includes("decideClose(") && mainText.includes("closeHeld("),
    "ts1i shell/main.js wires closeHeld using decideClose");

  class ThrowingTray {
    constructor() {
      throw new Error("tray creation made to throw");
    }
  }
  const ensureTraySrc = extractFunction(mainText, "ensureTray");
  const closeHeldSrc = extractFunction(mainText, "closeHeld");
  const fakeElec = makeFakeElectron();
  const makeCloseHeld = (trayClass) => new Function(
    "decideClose",
    "createTray",
    "Tray",
    "Menu",
    "trayIcon",
    "trayWords",
    "trayMenuItems",
    "showStudio",
    "theWindow",
    "trayQuit",
    "readQuitOnClose",
    "quitting",
    "maybeFirstClose",
    "console",
    [
      "let studioTray = null;",
      ensureTraySrc,
      closeHeldSrc,
      "return (win, e) => closeHeld(win, e);",
    ].join("\n")
  )(
    decideClose,
    createTray,
    trayClass,
    fakeElec.Menu,
    () => ({ isEmpty: () => false }),
    () => ({ trayOpen: "Open", trayTip: "Tip", trayQuit: "Quit" }),
    () => [],
    () => {},
    {},
    () => {},
    () => false,
    false,
    () => {},
    { error() {}, log() {}, warn() {} }
  );

  let prevented = false;
  let hidden = false;
  const fakeWin = { hide() { hidden = true; } };
  const fakeEvent = { preventDefault() { prevented = true; } };
  const heldWithThrow = makeCloseHeld(ThrowingTray)(fakeWin, fakeEvent);
  check(heldWithThrow === false && !prevented && !hidden,
    "ts1j closeHeld: tray creation made to throw, close is not hidden");

  /* Leg 2: --update-close with the window hidden ends the process */
  check(mainText.includes("updateClose") && /updateClose\(argv\)\)?\s*\{\s*quitting\s*=\s*true;\s*app\.quit\(\);/.test(mainText),
    "ts2a second-instance handler calls app.quit() on --update-close");

  /* Leg 3: first-close told once */
  const clearedKeysMatch = /const CLEARED_KEYS\s*=\s*\[([^\]]+)\];/.exec(mainText);
  const clearedKeys = clearedKeysMatch ? clearedKeysMatch[1] : "";
  check(!clearedKeys.includes("trayTold"),
    "ts3a trayTold is not among CLEARED_KEYS");

  let toldVal = false;
  let clickFired = false;
  const res1 = notifyFirstClose({
    electron: fakeElec,
    appId: APP_IDS.studio,
    told: toldVal,
    setTold: (v) => { toldVal = v; },
    title: "Etiuda Studio keeps running in the tray",
    body: "Proposals and requests to join still arrive. The tray icon quits it, and Settings, under General, changes this.",
    onClick: () => { clickFired = true; },
  });
  check(res1 && res1.shown === true && toldVal === true,
    "ts3b first-close shows toast when told is false and records told");
  res1.notification.click();
  check(clickFired === true, "ts3c first-close click handler fires");

  const res2 = notifyFirstClose({
    electron: fakeElec,
    appId: APP_IDS.studio,
    told: toldVal,
    setTold: () => {},
    title: "Etiuda Studio keeps running in the tray",
    body: "Proposals and requests to join still arrive. The tray icon quits it, and Settings, under General, changes this.",
  });
  check(res2 === null || (res2 && res2.shown === false),
    "ts3d first-close does not show again when told is true");

  /* Leg 3e: THE LIVED SEQUENCE (the test architect's hold of 982 misc, 2026-11-11). Each boot evaluates, fresh, as a new
     process would, the shell's own store functions, the module-level lines just above maybeFirstClose and maybeFirstClose
     itself, over one userData folder: start, close (told), close again (not), the next start, close (told again), and
     studio.json holds no trayTold. A told kept in the store, or anywhere a restart reads, goes red here. */
  {
    const ud = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-tray-first-close-"));
    const shown = [];
    class CountingNotification extends fakeElec.Notification {
      show() { super.show(); shown.push(this.opts && this.opts.title); }
    }
    const Saved = nodeRequire(path.join(ROOT, "src", "saved-format.cjs"));
    const { writeWhole } = nodeRequire(path.join(ROOT, "src", "whole-write.cjs"));
    const at = mainText.indexOf("function maybeFirstClose(");
    const above = at < 0 ? "" : mainText.slice(0, at).split("\n").slice(-4)
      .filter((l) => /^let [A-Za-z_$][\w$]* = (false|true|null|0);$/.test(l.trim())).join("\n");
    const sliceSrc = [extractFunction(mainText, "storeAt"), extractFunction(mainText, "readStore"),
      extractFunction(mainText, "writeStore"), above, extractFunction(mainText, "maybeFirstClose"),
      /* a customer's start: the harness guard is tests/harness-writes.mjs's subject, not this leg's */
      "function harnessLaunch() { return false; }",
      "return (win) => maybeFirstClose(win);"].join("\n");
    const app = { getPath: () => ud, getVersion: () => "0.0.0", setAppUserModelId() {} };
    const boot = () => new Function("path", "fs", "app", "Saved", "writeWhole", "Notification", "APP_IDS",
      "notifyFirstClose", "trayWords", "showStudio", sliceSrc)(
      path, fs, app, Saved, writeWhole, CountingNotification, APP_IDS, notifyFirstClose,
      () => ({ trayKeepsRunning: "Etiuda Studio keeps running in the tray", trayKeepsBody: "Proposals still arrive." }), () => {});
    const seq = [];
    let stored = "unread", why = "";
    try {
      const first = boot();
      first({}); seq.push(shown.length);
      first({}); seq.push(shown.length);
      const next = boot();
      next({}); seq.push(shown.length);
      const doc = Saved.readSaved(path.join(ud, "studio.json")).doc;
      stored = doc && Object.prototype.hasOwnProperty.call(doc, "trayTold") ? doc.trayTold : "absent";
    } catch (e) {
      why = String(e && e.message || e).split("\n")[0];
    } finally {
      fs.rmSync(ud, { recursive: true, force: true });
    }
    check(seq.join(",") === "1,1,2" && stored === "absent",
      "ts3e start, close: told; close again: not; the next start, close: told again; the store holds no trayTold (notices "
      + seq.join(",") + ", store trayTold " + JSON.stringify(stored) + (why ? ", " + why : "") + ")");
  }

  /* Leg 4: --open refuses a folder not in Opened recently */
  check(mainText.includes("--open") && mainText.includes("isOpenedRecently"),
    "ts4a shell/main.js validates --open argument against Opened recently");

  /* Leg 6: electron-builder.js files allowlist includes tray icon and badges */
  const builderMod = nodeRequire(path.join(ROOT, "electron-builder.js"));
  const allowlist = builderMod.files || [];
  const matchesGlob = (pat, file) => {
    if (pat === file) return true;
    if (pat.endsWith("/**")) {
      const pfx = pat.slice(0, -3);
      return file === pfx || file.startsWith(pfx + "/");
    }
    if (pat.endsWith("/*")) {
      const pfx = pat.slice(0, -2);
      return file.startsWith(pfx + "/") && !file.slice(pfx.length + 1).includes("/");
    }
    return false;
  };
  const isAllowed = (file) => allowlist.some((p) => !p.startsWith("!") && matchesGlob(p, file));

  check(isAllowed("packaging/etiuda-studio.ico"),
    "ts6a electron-builder.js files list includes packaging/etiuda-studio.ico for trayIcon");

  const badges = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "9+"];
  const badgesAllowed = badges.every((b) =>
    isAllowed("packaging/tray/tray-" + b + ".ico") && isAllowed("packaging/tray/tray-" + b + ".png")
  );
  check(badgesAllowed,
    "ts6b electron-builder.js files list includes packaging/tray badge icons and pngs");

  /* Leg 7: THE FIRST-CLOSE TRACE (shell/main.js firstCloseTraced, trayToastTrace, trayTraceWrite), read from main.js and run
     with the pinned tray.cjs and stand-ins for Electron's Notification, each boot a fresh process over a scratch user-data folder:
     one line per attempt naming each outcome, and the same calls reaching Electron as the untraced close makes. Each outcome's
     line carrying a plant tag is cut in memory and the same reading made again. */
  {
    const fnOf = (src, name) => {
      const at = src.search(new RegExp("^function " + name + "\\(", "m"));
      const end = at < 0 ? -1 : src.indexOf("\n}", at);
      return end < 0 ? "" : src.slice(at, end + 2);
    };
    const SHOW_ERR = "the toast could not be made\nsecond line", SHOW_REFUSED = "show refused: C:\\Users\\Someone\\AppData\\icon.png", WINDOWS_SAID = "0x80070490 element not found";
    /* kind: shows, unsupported, ctor-throws, show-throws, words-throw; harness: the marker's answer; closes: how many */
    const boot = (src, kind, harness, closes, traced) => {
      const ud = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-tray-trace-"));
      const rec = { supportedAsked: 0, aumid: [], made: [], shown: 0, clicks: 0, told: false, threw: [] };
      let lastNote = null;
      class FakeNote {
        constructor(opts) {
          if (kind === "ctor-throws") throw new Error(SHOW_ERR);
          rec.made.push(JSON.stringify(opts));
          this.handlers = {};
          lastNote = this;
        }
        static isSupported() { rec.supportedAsked++; return kind !== "unsupported"; }
        on(ev, fn) { (this.handlers[ev] = this.handlers[ev] || []).push(fn); if (ev === "click") rec.clicks++; return this; }
        emit(ev, ...a) { for (const fn of this.handlers[ev] || []) fn(...a); }
        show() { if (kind === "show-throws") throw new Error(SHOW_REFUSED); rec.shown++; }
      }
      const fakeApp = { getPath: () => ud, getName: () => "etiuda-studio", setAppUserModelId: (id) => { rec.aumid.push(id); } };
      const consts = (src.match(/^const TRAY_TRACE_FILE[^\n]*\n^const trayTraceState[^\n]*$/m) || [""])[0];
      const body = [consts, "let trayToldThisRun = false;",
        fnOf(src, "maybeFirstClose"), fnOf(src, "firstCloseTraced"), fnOf(src, "trayToastTrace"), fnOf(src, "trayTraceWrite"),
        "return { close: " + (traced ? "firstCloseTraced" : "maybeFirstClose") + ", told: () => trayToldThisRun };"].join("\n");
      let lines = [], why = "";
      try {
        const made = new Function("fs", "path", "app", "Notification", "harnessLaunch", "notifyFirstClose", "trayWords", "showStudio",
          "APP_IDS", body)(fs, path, fakeApp, FakeNote, () => harness, notifyFirstClose,
          () => { if (kind === "words-throw") throw new Error("words unread"); return { trayKeepsRunning: "Title", trayKeepsBody: "Body" }; },
          () => {}, APP_IDS);
        for (let i = 0; i < closes; i++) {
          try { made.close({}); } catch (e) { rec.threw.push(e.message); }
          if (i === 0 && lastNote && kind === "shows") lastNote.emit("failed", {}, WINDOWS_SAID);
          if (i === 0 && lastNote && kind === "shows-ok") lastNote.emit("show", {});
        }
        rec.told = made.told();
        const at = path.join(ud, "tray-trace.txt");
        lines = fs.existsSync(at) ? fs.readFileSync(at, "utf8").split("\n").filter(Boolean) : [];
      } catch (e) {
        why = String(e && e.message || e).split("\n")[0];
      } finally {
        fs.rmSync(ud, { recursive: true, force: true });
      }
      return { rec, lines, why };
    };
    const STAMP = "^\\d{4}-\\d\\d-\\d\\dT\\d\\d:\\d\\d:\\d\\d\\.\\d{3}Z first close: ";
    const reads = (src) => ({
      shows: boot(src, "shows", false, 2, true),
      showsOk: boot(src, "shows-ok", false, 1, true),
      unsupported: boot(src, "unsupported", false, 1, true),
      ctorThrows: boot(src, "ctor-throws", false, 1, true),
      showThrows: boot(src, "show-throws", false, 1, true),
      harness: boot(src, "shows", true, 1, true),
      wordsThrow: boot(src, "words-throw", false, 1, true),
      capped: boot(src, "unsupported", false, 10, true),
    });
    const r = reads(mainText);
    const say = (x) => JSON.stringify(x.lines) + (x.why ? " (" + x.why + ")" : "");
    check(r.shows.lines.length === 2
      && new RegExp(STAMP + "isSupported=true aumid=app\\.etiuda\\.studio \\(this attempt set it\\) harnessLaunch=false outcome=shown$").test(r.shows.lines[0])
      && /Z first close, Windows: failed: 0x80070490 element not found$/.test(r.shows.lines[1]) && r.shows.rec.shown === 1 && r.shows.rec.told
      && r.showsOk.lines.length === 2 && /Z first close, Windows: shown$/.test(r.showsOk.lines[1]),
      "ft1 a toast that shows: one line naming isSupported=true, the app id this attempt set, harnessLaunch=false and outcome=shown; "
      + "Windows's failed or shown event on a line of its own; the second close, told, writes nothing: " + say(r.shows) + " " + say(r.showsOk));
    check(r.unsupported.lines.length === 1
      && new RegExp(STAMP + "isSupported=false aumid=electron\\.app\\.etiuda-studio \\(Electron's default, unless another toast set one\\) harnessLaunch=false outcome=not supported$").test(r.unsupported.lines[0]),
      "ft2 Notification.isSupported() false: the line says not supported and the app id in force is Electron's default: " + say(r.unsupported));
    check(r.ctorThrows.lines.length === 1
      && new RegExp(STAMP + "isSupported=true aumid=app\\.etiuda\\.studio \\(this attempt set it\\) harnessLaunch=false outcome=thrown: the toast could not be made$").test(r.ctorThrows.lines[0]),
      "ft3 the Notification made to throw: the line says thrown with the message's first line, which tray.cjs swallows: " + say(r.ctorThrows));
    check(r.showThrows.lines.length === 1 && /outcome=thrown: show refused: %USERPROFILE%\\AppData\\icon\.png$/.test(r.showThrows.lines[0]),
      "ft4 show() made to throw: the line says thrown with its message, the user's own folder named %USERPROFILE%: " + say(r.showThrows));
    check(r.harness.lines.length === 1 && r.harness.rec.made.length === 0
      && new RegExp(STAMP + "isSupported=not asked aumid=electron\\.app\\.etiuda-studio .* harnessLaunch=true outcome=not attempted \\(harnessLaunch\\)$").test(r.harness.lines[0]),
      "ft5 a harness launch: no toast made and nothing asked of Notification, and the line says harnessLaunch=true, not attempted: " + say(r.harness));
    check(r.wordsThrow.lines.length === 1 && /outcome=thrown: words unread$/.test(r.wordsThrow.lines[0])
      && r.wordsThrow.rec.threw.join() === "words unread",
      "ft6 a throw before tray.cjs is reached: the line says thrown: words unread, and the throw still reaches the close as before: " + say(r.wordsThrow));
    check(r.capped.lines.length === 6, "ft7 ten closes that never show write six lines a run, no more: " + r.capped.lines.length);
    /* the control: the same calls reach Electron with the trace and without it */
    const diffs = (src) => { const same = [];
    for (const [kind, harness, closes] of [["shows", false, 2], ["unsupported", false, 1], ["ctor-throws", false, 1], ["show-throws", false, 1],
      ["shows", true, 1], ["words-throw", false, 1]]) {
      const a = boot(src, kind, harness, closes, true).rec, b = boot(src, kind, harness, closes, false).rec;
      const key = (x) => JSON.stringify([x.supportedAsked, x.aumid, x.made, x.shown, x.clicks, x.told, x.threw]);
      if (key(a) !== key(b)) same.push(kind + (harness ? " (harness)" : "") + ": traced " + key(a) + " untraced " + key(b));
    }
    return same; };
    const same = diffs(mainText);
    check(same.length === 0, "ft8 no change of behaviour: isSupported asked, the app id set, the toast made, shown, its click wired, told "
      + "and any throw are the same with the trace and without it, in all six cases" + (same.length ? ": " + same.join("; ") : ""));
    /* The inline plant proofs ft9 to ft13 honour ETIUDA_PLANTS=off (plant-hold's pk-off), named as not run. */
    if (PLANTS_OFF) console.log("  NOT RUN ft9 to ft13, the trace's plant proofs (ETIUDA_PLANTS=off)");
    else {
      for (const [tag, id, pick, was] of [["trace-shown", "ft9", "shows", /outcome=shown$/], ["trace-unsupported", "ft10", "unsupported", /outcome=not supported$/],
        ["trace-thrown", "ft11", "ctorThrows", /outcome=thrown: the toast could not be made$/], ["trace-caught", "ft12", "wordsThrow", /outcome=thrown: words unread$/]]) {
        const cut = mainText.split("\n").filter((l) => l.indexOf("plant:" + tag) < 0).join("\n");
        const lifted = reads(cut)[pick];
        check(mainText.indexOf("plant:" + tag) > -1 && !(lifted.lines[0] && was.test(lifted.lines[0])),
          id + " control: cutting plant:" + tag + " takes that outcome from the line: " + say(lifted));
      }
      const swallowed = mainText.replace("return show.apply(n, arguments);", "return undefined;");
      const seenBroken = swallowed !== mainText ? diffs(swallowed) : [];
      check(seenBroken.length > 0, "ft13 control: a stand-in whose show() no longer reaches Electron's is caught by ft8: " + seenBroken.length + " case(s) differ");
    }
  }

  /* 14. THE TRAY BUBBLE (board 1016 (10)), Studio's own: the family's blue bubble at the first close of a start, in place of
     Windows's notification. Its place is the pure bubblePlace in src/tray-bubble.cjs (Studio's own copy: the pinned engine's
     tray.cjs does not carry it); once per start, the Off the bubble's own button sets, the window that takes no focus and the
     Settings row are read from shell/main.js, the page and the preload. */
  {
    const bp = nodeRequire(path.join(ROOT, "src", "tray-bubble.cjs")).bubblePlace;
    const disp = { bounds: { x: 0, y: 0, width: 1920, height: 1080 }, workArea: { x: 0, y: 0, width: 1920, height: 1040 } };
    const size = { width: 360, height: 150 };
    const at = (bounds) => (typeof bp === "function" ? bp({ bounds: bounds, display: disp, size: size }) : null);
    const a = at({ x: 1700, y: 1040, width: 24, height: 40 });
    check(!!a && a.side === "above" && a.x === 1532 && a.y === 880 && a.tip === 180,
      "tbs1 a tray icon on the bottom taskbar: the bubble stands just above it, centred on the icon, its pointer on the icon: " + JSON.stringify(a));
    const e = at({ x: 1900, y: 1040, width: 24, height: 40 });
    check(!!e && e.side === "above" && e.x === 1552 && e.tip === 340,
      "tbs2 an icon at the screen's edge: the bubble keeps 8 px inside the work area and the pointer stays on the bubble's own edge: " + JSON.stringify(e));
    const none = [["zero bounds", { x: 0, y: 0, width: 0, height: 0 }], ["no bounds", undefined], ["empty object", {}], ["not a number", { x: NaN, y: 1, width: 24, height: 24 }],
      ["overflow flyout, inside the work area", { x: 1600, y: 900, width: 24, height: 24 }]].map(([n, b]) => [n, at(b)]);
    check(none.every(([, r]) => r && r.side === "none" && r.tip === null && r.x === 1548 && r.y === 878),
      "tbs3 bounds empty, zero, unreadable or in the hidden overflow: the bubble stands at the bottom corner by the notification area, with no pointer: "
      + JSON.stringify(none));

    const fnOf = (src, name) => extractFunction(src, name) || "";
    const noteRun = (src, kind, harness, closes) => {
      const log = { bubble: 0, traced: 0 };
      const body = ["let trayToldThisRun = false;", fnOf(src, "firstCloseNote"),
        "return { close: firstCloseNote, told: () => trayToldThisRun };"].join("\n");
      let made, why = "";
      try {
        made = new Function("bubbleOn", "harnessLaunch", "showTrayBubble", "firstCloseTraced", body)(
          () => kind !== "off", () => harness,
          () => { log.bubble++; if (kind === "bubble-throws") throw new Error("no window"); return kind !== "bubble-false"; },
          () => { log.traced++; return null; });
        for (let i = 0; i < closes; i++) made.close({});
      } catch (err) { why = String(err && err.message || err); }
      return { log: log, told: made ? made.told() : null, why: why };
    };
    const noteReads = (src) => ({
      on: noteRun(src, "on", false, 3), off: noteRun(src, "off", false, 2), no: noteRun(src, "bubble-false", false, 1),
      throws: noteRun(src, "bubble-throws", false, 1), harness: noteRun(src, "on", true, 1),
    });
    const n = noteReads(mainText);
    const nsay = (x) => JSON.stringify(x);
    check(n.on.log.bubble === 1 && n.on.log.traced === 0 && n.on.told === true,
      "tbs4 three closes in one start: the bubble is shown once, Windows's notification never, and the start is told: " + nsay(n.on));
    check(n.off.log.bubble === 0 && n.off.log.traced === 0 && n.off.told === true,
      "tbs5 with Say so at the first close Off, nothing is shown at the close, bubble or Windows notification: " + nsay(n.off));
    check(n.no.log.bubble === 1 && n.no.log.traced === 1 && n.throws.log.traced === 1 && n.throws.why === "",
      "tbs6 a bubble that cannot be made (answers false or throws) leaves the close to the Windows notification once: " + nsay([n.no, n.throws]));
    check(n.harness.log.bubble === 0 && n.harness.log.traced === 1,
      "tbs7 a harness launch makes no bubble window: " + nsay(n.harness));

    /* The setting and the bubble's own buttons: the store is the one file studio.json holds, the key trayBubble */
    const actRun = (src, go, store) => {
      const writes = [], shown = [], hid = [];
      const body = [fnOf(src, "bubbleOn"), fnOf(src, "setTrayBubble"), fnOf(src, "bubbleAct"), "return { on: bubbleOn, act: bubbleAct };"].join("\n");
      let made;
      try {
        made = new Function("readStore", "writeStore", "showStudio", "hideTrayBubble", "theWindow", body)(
          () => store, (s) => { writes.push(JSON.stringify(s)); return true; }, () => shown.push(1), () => hid.push(1), null);
      } catch (err) { return { on: null, writes: [], shown: 0, hid: 0, why: String(err && err.message || err) }; }
      if (go) made.act(go);
      return { on: made.on(), writes: writes, shown: shown.length, hid: hid.length };
    };
    const ar = (src) => ({ none: actRun(src, "", {}), offKey: actRun(src, "", { trayBubble: false, trayNotes: false }), ok: actRun(src, "ok", {}), off: actRun(src, "off", {}),
      open: actRun(src, "open", {}), junk: actRun(src, "later", {}) });
    const r = ar(mainText);
    check(r.none.on === true && r.offKey.on === false,
      "tbs8 the bubble is on by default and off only where the store says trayBubble false, whatever the notifications' master switch holds: " + nsay([r.none, r.offKey]));
    check(r.ok.writes.length === 0 && r.ok.hid === 1 && r.ok.shown === 0
      && r.off.writes.join() === '{"trayBubble":false}' && r.off.hid === 1 && r.off.shown === 0
      && r.open.writes.length === 0 && r.open.hid === 1 && r.open.shown === 1 && r.junk.hid === 0 && r.junk.writes.length === 0,
      "tbs9 OK closes it and writes nothing; Don't show again writes trayBubble false and closes it; its text opens Studio; any other word does nothing: " + nsay(r));

    const sb = fnOf(mainText, "showTrayBubble");
    check(sb.length > 0 && /focusable:\s*false/.test(sb) && /showInactive\(\)/.test(sb) && !/\.focus\(/.test(sb) && !/\.show\(\)/.test(sb)
      && /getBounds\(/.test(sb) && !/globalShortcut/.test(sb) && !/globalShortcut/.test(fnOf(mainText, "hideTrayBubble")) && /setTimeout\(/.test(sb),
      "tbs10 the bubble's window is not focusable and is shown inactive, never focused; it reads the tray's bounds, registers no global shortcut, so Esc stays with the program in front, and closes by itself");

    const appSrc = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
    const langSrc = fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8");
    const preloadSrc = fs.readFileSync(path.join(ROOT, "shell", "preload.js"), "utf8");
    const bubLine = "Once each start, a blue bubble over the tray icon says Etiuda Studio keeps running there. Don't show again in the bubble turns this off.";
    const bubLinePl = "Raz po każdym uruchomieniu niebieski dymek nad ikoną w zasobniku informuje, że Etiuda Studio działa tam dalej. Przycisk Nie pokazuj więcej w dymku wyłącza tę opcję.";
    check(appSrc.includes('sxRow("firstclose"') && appSrc.includes('T("Say so at the first close")') && appSrc.includes('T("' + bubLine + '")')
      && appSrc.includes('"set-tray-bubble"') && appSrc.includes("setTrayBubble") && appSrc.includes("S.trayBubble")
      && langSrc.includes('"Say so at the first close"') && langSrc.includes("Informuj przy pierwszym zamknięciu") && langSrc.includes(bubLinePl)
      && /setTrayBubble:[^\n]*studio:tray-bubble-set/.test(preloadSrc)
      && /answer\("studio:tray-bubble-set"/.test(mainText) && mainText.includes("trayBubble: s.trayBubble !== false"),
      "tbs11 Settings, General has the row Say so at the first close (On or Off) in both languages, wired through the preload to the store and back into the host's state");
    const wordsEn = ["Proposals and requests to join still arrive. To quit, right-click its icon here and choose Quit Etiuda Studio.", "Don't show again"];
    const wordsPl = ["Propozycje i prośby o dołączenie wciąż docierają. Aby zamknąć program, wystarczy kliknąć tę ikonę prawym przyciskiem i wybrać Zakończ Etiudę Studio.", "Nie pokazuj więcej"];
    check(wordsEn.every(w => mainText.includes('"' + w + '"')) && wordsPl.every(w => mainText.includes('"' + w + '"'))
      && /RESET_WHITELIST = \[[^\]]*"trayBubble"/.test(mainText) && /const CLEARED_KEYS\s*=\s*\[[^\]]*"trayBubble"/.test(mainText),
      "tbs13 the bubble's body and its quiet button are the copywriter's words, English and Polish; Reset and Clear local memory put the bubble back On");

    const goOf = (src) => { try { return new Function(fnOf(src, "bubbleGo") + "\nreturn bubbleGo;")(); } catch (err) { return () => "threw: " + err.message; } };
    const go = goOf(mainText);
    const gos = ["bubble:ok", "bubble:off", "bubble:open", "bubble:evil", "bubble:ok ", "https://example.com/", "file:///c:/x", "", undefined, "BUBBLE:OK"].map((u) => go(u));
    check(JSON.stringify(gos) === JSON.stringify(["ok", "off", "open", "", "", "", "", "", "", ""]),
      "tbs18 a press in the bubble is a link that is caught and never followed: only bubble:ok, bubble:off and bubble:open mean anything, any other address means nothing: " + JSON.stringify(gos));
    const doc = fnOf(mainText, "bubbleDoc");
    check(doc.length > 0 && !/<script/i.test(doc) && /href=\\?"bubble:off/.test(doc) && /href=\\?"bubble:ok/.test(doc) && /href=\\?"bubble:open/.test(doc)
      && !/preload/.test(sb) && /will-navigate/.test(sb) && /bubbleGo\(/.test(sb),
      "tbs19 the bubble's page holds no script and its window no preload: its three presses are links the shell catches on navigation (the Don't show again button, OK, and the text)");

    /* The bubble is Studio's own, so it is violet as every other bubble in Studio is (ui/index.html's --bub): the light theme's #5729a6, the dark
       theme's lighter #6d3fc4, each with its glow in its own hue; the desk's blue #2563eb appears nowhere in its page. */
    const docOf = (src, dark) => { try { return new Function("BUBBLE_W", "BUBBLE_PAD", fnOf(src, "bubbleDoc") + "\nreturn bubbleDoc;")(360, 20)(
      { trayKeepsRunning: "k", trayBubbleBody: "b", trayBubbleOff: "o", trayBubbleOk: "ok" }, "above", 40, dark); } catch (err) { return "threw: " + err.message; } };
    const fillOf = (d) => { const m = /--bub:(#[0-9a-f]{6});/i.exec(d); return m ? m[1].toLowerCase() : "none"; };
    const glowOf = (d) => { const m = /--bub-shadow:(rgba\([^)]*\))/.exec(d); return m ? m[1] : "none"; };
    const vl = docOf(mainText, false), vd = docOf(mainText, true);
    check(fillOf(vl) === "#5729a6" && glowOf(vl) === "rgba(87,41,166,.32)" && fillOf(vd) === "#6d3fc4" && glowOf(vd) === "rgba(124,58,237,.30)"
      && !/2563eb|37,99,235/i.test(vl + vd),
      "tbs20 the tray bubble is violet, Studio's own: the light theme's fill #5729a6 with its glow, the dark theme's lighter #6d3fc4 with its glow, and the desk's blue nowhere in its page: "
      + JSON.stringify([fillOf(vl), glowOf(vl), fillOf(vd), glowOf(vd)]));
    check(/nativeTheme\.shouldUseDarkColors/.test(fnOf(mainText, "showTrayBubble")) && /bubbleDoc\(w, first\.side, first\.tip, dark\)/.test(fnOf(mainText, "showTrayBubble")),
      "tbs21 the bubble is drawn in the theme Studio shows (the dark flag is read from nativeTheme where the window is made and passed to the document)");

    if (PLANTS_OFF) console.log("  NOT RUN tbs14 to tbs17, the bubble's plant proofs (ETIUDA_PLANTS=off)");
    else {
      const cutOf = (tag) => mainText.split("\n").filter((l) => l.indexOf("plant:" + tag) < 0).join("\n");
      const p1 = noteReads(cutOf("bubble-off")), p2 = noteReads(cutOf("bubble-once")), p3 = ar(cutOf("bubble-key")), p4 = ar(cutOf("bubble-off-write"));
      check(mainText.includes("plant:bubble-off") && p1.off.log.bubble > 0, "tbs14 control: cutting plant:bubble-off shows the bubble with the setting Off: " + nsay(p1.off));
      check(mainText.includes("plant:bubble-once") && p2.on.log.bubble > 1, "tbs15 control: cutting plant:bubble-once shows it at every close: " + nsay(p2.on));
      check(mainText.includes("plant:bubble-key") && p3.offKey.on !== false, "tbs16 control: cutting plant:bubble-key leaves the bubble on after Off is written: " + nsay(p3.offKey));
      check(mainText.includes("plant:bubble-off-write") && p4.off.writes.join() !== '{"trayBubble":false}', "tbs17 control: cutting plant:bubble-off-write leaves Don't show again writing nothing: " + nsay(p4.off));
      check(mainText.includes("plant:bubble-dark") && fillOf(docOf(cutOf("bubble-dark"), true)) !== "#6d3fc4", "tbs22 control: cutting plant:bubble-dark leaves the dark theme's bubble in the light violet: " + fillOf(docOf(cutOf("bubble-dark"), true)));
    }
  }

  console.log("\n#counts checks=" + checks + " failures=" + failed);
  process.exit(failed ? 1 : 0);
}

run().catch((err) => {
  console.error("tray-studio error: " + (err && err.message));
  process.exit(1);
});
