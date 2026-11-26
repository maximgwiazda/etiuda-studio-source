/* LINUX STUDIO, BOARD 973: the tray's pictures, Start with Windows, the pinned shell the package
 * names.
 *
 *     node tests/linux-973.mjs
 *
 * No window and no package build. process.platform is stubbed around the tray and the login act.
 * One plant, removed in a scratch copy (tests/plant-copy.mjs): the Linux tray's choice of
 * PNG (tray-platform) reddens lnx973-tray-linux. ETIUDA_PLANTS=off skips it and counts it.
 *
 * Node only. Exit 0 when every check holds, 1 when any fails.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { loadPage } from "./page-stand-in.mjs";
import { copyPlants } from "./plant-copy.mjs";
import { filesAdmit, pinnedShellHolds, shellNamedBy } from "./linux-studio.mjs";
import { trayBaseBytes } from "../tools/tray-base.mjs";
import { icoPngs } from "../tools/ico-png.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SELF = fileURLToPath(import.meta.url);
const require = createRequire(import.meta.url);
const EXPECTED = 10; /* 12 less lnx973-folder-now and its plant, retired with the chosen folder */
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const BADGES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "9+"];
const NEW_FOLDER = "D:/shared-folder/team";
const OLD_FOLDER = "C:/relay-mirror/team";

let skipped = 0;
function skip(line) {
  skipped++;
  process.stdout.write("  SKIP  " + line + "\n");
}
let asserted = 0, failed = 0;
function check(ok, line) {
  asserted++;
  if (ok) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
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

function builderFiles() {
  const at = require.resolve("../electron-builder.js");
  delete require.cache[at];
  return require(at).files;
}

function loadTray(platform) {
  const main = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  const trayPng = extractFunction(main, "trayPng");
  const trayIcon = extractFunction(main, "trayIcon");
  const ensureTray = extractFunction(main, "ensureTray");
  if (!trayPng || !trayIcon || !ensureTray) return { missing: !trayPng ? "trayPng" : (!trayIcon ? "trayIcon" : "ensureTray") };
  const asked = [];
  const nativeImage = {
    createFromPath(p) {
      asked.push(String(p).replace(/\\/g, "/"));
      const png = String(p).toLowerCase().endsWith(".png");
      const empty = platform === "linux" ? !png : false;
      return { isEmpty() { return empty; }, path: p };
    },
  };
  const fsStub = { existsSync() { return true; } };
  let made = null;
  const createTray = () => {
    made = { id: "tray" };
    return { setContextMenu() {}, setToolTip() {}, setImage() {} };
  };
  const api = new Function(
    "nativeImage", "fs", "path", "__dirname", "process", "Tray", "Menu", "createTray", "console",
    [
      "let studioTray = null;",
      "const theWindow = {};",
      "function trayWords() { return { trayTip: 'Tip', trayOpen: 'Open', trayQuit: 'Quit' }; }",
      "function trayMenuItems() { return []; }",
      "function showStudio() {}",
      "function rebuildTrayMenu() {}",
      trayPng,
      trayIcon,
      ensureTray,
      "return { trayIcon, ensureTray };",
    ].join("\n")
  )(nativeImage, fsStub, path, path.join(ROOT, "shell"), { platform }, function Tray() {}, { buildFromTemplate() { return {}; } }, createTray, console);
  return { api, asked, made: () => made };
}

const linuxTray = loadTray("linux");
const winTray = loadTray("win32");
let linuxPaths = [], linuxTrayOk = false, linuxErr = linuxTray.missing || "";
if (!linuxErr) {
  try {
    linuxTray.asked.length = 0;
    linuxTray.api.trayIcon();
    linuxTray.api.trayIcon("3");
    const tray = linuxTray.api.ensureTray();
    linuxPaths = linuxTray.asked.slice();
    linuxTrayOk = !!tray && linuxPaths.length > 0 && linuxPaths.every((p) => p.endsWith(".png"))
      && linuxPaths.some((p) => p.endsWith("packaging/tray/base.png"))
      && linuxPaths.some((p) => p.endsWith("packaging/tray/tray-3.png"));
  } catch (e) { linuxErr = String(e && e.message || e); }
}
check(!linuxErr && linuxTrayOk, "lnx973-tray-linux with platform linux the tray is built from PNGs and ensureTray answers a tray: "
  + (linuxErr || JSON.stringify(linuxPaths.map((p) => p.slice(p.indexOf("packaging"))))) + " tray=" + linuxTrayOk);

let winPaths = [], winTrayOk = false, winErr = winTray.missing || "";
if (!winErr) {
  try {
    winTray.asked.length = 0;
    winTray.api.trayIcon();
    winTray.api.trayIcon("3");
    const tray = winTray.api.ensureTray();
    winPaths = winTray.asked.slice();
    winTrayOk = !!tray && winPaths.some((p) => p.endsWith("packaging/etiuda-studio.ico"))
      && winPaths.some((p) => p.endsWith("packaging/tray/tray-3.ico"))
      && !winPaths.some((p) => p.endsWith(".png"));
  } catch (e) { winErr = String(e && e.message || e); }
}
check(!winErr && winTrayOk, "lnx973-tray-win with platform win32 the tray is built from the ico files: "
  + (winErr || JSON.stringify(winPaths.map((p) => p.slice(p.indexOf("packaging"))))) + " tray=" + winTrayOk);

const namedPngs = ["packaging/tray/base.png"].concat(BADGES.map((b) => "packaging/tray/tray-" + b + ".png"));
const mainText = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
const trayPngSrc = extractFunction(mainText, "trayPng") || "";
const files = builderFiles();
const pngBad = [];
for (const rel of namedPngs) {
  const abs = path.join(ROOT, rel);
  let why = "";
  if (!fs.existsSync(abs)) why = "missing";
  else {
    const buf = fs.readFileSync(abs);
    if (!buf.subarray(0, 8).equals(PNG_MAGIC)) why = "not a png";
    else if (!filesAdmit(files, rel)) why = "not in the package list";
  }
  if (why) pngBad.push(rel + " " + why);
}
let baseSame = false, base32 = false;
try {
  const ico = fs.readFileSync(path.join(ROOT, "packaging", "etiuda-studio.ico"));
  const frame = icoPngs(ico).find((p) => p.size === 32);
  const got = fs.readFileSync(path.join(ROOT, "packaging", "tray", "base.png"));
  baseSame = !!frame && got.equals(frame.bytes) && got.equals(trayBaseBytes(ico));
  base32 = got.readUInt32BE(16) === 32 && got.readUInt32BE(20) === 32;
} catch { baseSame = false; }
const namesCode = trayPngSrc.indexOf('path.join("tray", "base.png")') >= 0
  && trayPngSrc.indexOf('"tray-" + badge + ".png"') >= 0;
check(pngBad.length === 0 && baseSame && base32 && namesCode,
  "lnx973-png every PNG the Linux tray names is a real PNG in the package list, and base.png is the icon's 32px frame: "
  + (pngBad.length ? pngBad.join(", ") : "the eleven") + " base=" + baseSame + " code=" + namesCode);

function settingsHtml(platform) {
  const { page, node } = loadPage({ api: {}, uiLang: "en" });
  page.S.host = { platform, loginItem: { openAtLogin: false } };
  page.S.screen = "settings";
  page.S.sx.sec = "general";
  page.S.sx.q = "";
  const html = page.sxPageHtml();
  if (node) { /* the stand-in is loaded so the page's own painters run */ }
  return html;
}
let rowLinux = "", rowWin = "", rowErr = "";
try {
  rowLinux = settingsHtml("linux");
  rowWin = settingsHtml("win32");
} catch (e) { rowErr = String(e && e.message || e); }
const linuxRowGone = rowLinux.indexOf("Start with Windows") < 0 && rowLinux.indexOf('data-row="startwin"') < 0;
const winRowThere = rowWin.indexOf("Start with Windows") >= 0 && rowWin.indexOf('data-row="startwin"') >= 0;
const hostGives = /\n {2}platform: process\.platform,?\n/.test(mainText);
check(!rowErr && linuxRowGone && winRowThere && hostGives,
  "lnx973-start-row Start with Windows is absent on linux and present on win32, from the host's platform: "
  + (rowErr || "linux=" + !linuxRowGone + " win=" + winRowThere + " host=" + hostGives));

function extractHandler(src) {
  const key = 'answer("studio:login-item-set", async (e, on) => {';
  const at = src.indexOf(key);
  if (at < 0) return null;
  let depth = 0;
  const start = src.indexOf("{", at);
  for (let k = start; k < src.length; k++) {
    if (src[k] === "{") depth++;
    else if (src[k] === "}" && !--depth) return src.slice(start + 1, k);
  }
  return null;
}
const handlerBody = extractHandler(mainText);
const loginItemSrc = extractFunction(mainText, "loginItemTo");
let actLinux = null, actWin = null, wrote = [], actErr = "";
try {
  const run = async (platform) => {
    const calls = [];
    const fn = new Function("process", "loginItemTo", "return async function(e, on) {" + handlerBody + "\n};")(
      { platform }, (on) => { calls.push(on); return true; });
    const answer = await fn(null, true);
    return { answer, calls };
  };
  actLinux = await run("linux");
  actWin = await run("win32");
  if (loginItemSrc) {
    const door = new Function("process", "app", "setLoginItemSettings", loginItemSrc + "\nreturn loginItemTo;")(
      { platform: "linux" },
      { isPackaged: true, getLoginItemSettings() { return { openAtLogin: false }; } },
      (app, on) => { wrote.push(on); });
    door(true);
  }
} catch (e) { actErr = String(e && e.message || e); }
const refused = !!(actLinux && actLinux.answer && actLinux.answer.ok === false && actLinux.calls.length === 0 && wrote.length === 0);
const allowed = !!(actWin && actWin.answer && actWin.answer.ok === true && actWin.calls.length === 1 && actWin.calls[0] === true);
check(!actErr && !!handlerBody && refused && allowed,
  "lnx973-start-act the login act is refused off Windows and written on win32: "
  + (actErr || JSON.stringify({ linux: actLinux, win: actWin && actWin.answer, wrote })));

const realFiles = builderFiles();
const named = shellNamedBy(realFiles, ROOT);
const held = pinnedShellHolds(realFiles, ROOT);
check(held && named.indexOf("engine/pinned/shell/tray.cjs") >= 0
  && named.indexOf("engine/pinned/shell/main.js") < 0
  && named.indexOf("engine/pinned/shell/page-watch.cjs") >= 0,
  "lnx973-shell-hold 4a passes on the real package config: " + named.length + " pinned shell file(s), holds=" + held);
const dropped = realFiles.concat(["!engine/pinned/shell/tray.cjs"]);
const droppedNamed = shellNamedBy(dropped, ROOT);
check(pinnedShellHolds(realFiles, ROOT) === true && pinnedShellHolds(dropped, ROOT) === false
  && droppedNamed.indexOf("engine/pinned/shell/tray.cjs") < 0,
  "lnx973-shell-drop 4a fails if a pinned file is dropped from the packaging config: tray still named="
  + (droppedNamed.indexOf("engine/pinned/shell/tray.cjs") >= 0) + " holds=" + pinnedShellHolds(dropped, ROOT));

/* lnx973-folder-now retired 2026-11-26 with the folder a person chose for a team to read from (Max, 00:37: "Retire it."): it held that the Team pane
   showed the chosen folder straight after the choice, and its plant folder-shown stood on the repaint. */

copyPlants({
  root: ROOT, self: SELF, label: "linux-973", onlyVar: "LINUX973_ONLY", check, skip,
  plants: [
    { mark: "tray-platform", leg: "lnx973-tray-linux", rel: "shell/main.js",
      line: '    if (false) return trayPng(badge); /* plant:tray-platform */' },
  ],
});

check(asserted + skipped + 1 === EXPECTED,
  "lnx973-count every leg ran: " + (asserted + skipped + 1) + " of " + EXPECTED + (skipped ? ", " + skipped + " skipped" : ""));
process.stdout.write("linux-973: " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)"
  + (PLANTS_OFF ? " (ETIUDA_PLANTS=off)" : "") + "\n");
process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + "\n");
process.exit(failed ? 1 : 0);
