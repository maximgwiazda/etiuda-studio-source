/* WHAT STUDIO'S INSTALLER WRITES, READ AS makensis READS IT, BEFORE ANY INSTALLER IS BUILT.
 *
 *     node tests/installer-writes.mjs
 *
 * electron-builder.js includes packaging/installer-pages.nsh, which includes the five
 * hooks cut from the engine's shell/installer.nsh, and that file's
 * customInstall once named the desk's .ec type in Polish unconditionally: a Polish Studio install
 * wrote the desk's class keys under Software\Classes and its uninstaller, which unregisters no type,
 * left them behind. Studio declares no file type, so the whole claim is that its installer writes
 * nothing under Classes, in any language.
 *
 * THE ORACLE IS electron-builder's OWN makensis, preprocessing only, found by app-builder-lib's own
 * resolver. It is handed the script electron-builder assembles around customInstall: the include
 * as the config names it, the association macro only when the config declares a type, then
 * installSection.nsh's own lines that insert both. Preprocessing drops only what no language can
 * reach, so a write that survives it is one some language performs. The same reading is the
 * engine's tests/test.js nsisInstallWrites, whose desk half holds the desk's side of this.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { installerHooksFrom } from "../src/engine.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const require = createRequire(import.meta.url);
const LIB = path.dirname(require.resolve("app-builder-lib/package.json"));

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

/** The registry writes makensis leaves in the script, each with the LogicLib conditions open
 *  around it. A string is a refusal, and every leg below reads a refusal as red; so is a registry
 *  line the reader cannot parse, since a skipped write reads exactly like no write. */
async function installWrites(cfg) {
  const cp = await import("node:child_process");
  const assoc = [].concat(cfg.fileAssociations || [], (cfg.win || {}).fileAssociations || []);
  const include = path.resolve(ROOT, (cfg.directories || {}).buildResources || "build", (cfg.nsis || {}).include || "installer.nsh");
  if (!fs.existsSync(include)) return "no include at " + include;
  const sect = fs.readFileSync(path.join(LIB, "templates", "nsis", "installSection.nsh"), "utf8");
  const from = sect.indexOf("!ifmacrodef registerFileAssociations"), ins = sect.indexOf("!insertmacro customInstall", from);
  const to = sect.indexOf("!endif", ins);
  if (from < 0 || ins < 0 || to < 0) return "installSection.nsh no longer inserts registerFileAssociations, then customInstall";
  const q = s => String(s).replace(/"/g, "$\\\"");
  /* A preprocess-only run reads an include without a BOM in the system code page and refuses its
     Polish; the real compile reads it as UTF-8 under -INPUTCHARSET UTF8, so /CHARSET says so here. */
  const script = ["Unicode true", "!include LogicLib.nsh",
    "!define APP_INSTALLER_STORE_FILE \"etiuda-studio-updater\\installer.exe\"",
    "!define UNINSTALL_REGISTRY_KEY \"Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\app\"",
    "!define PROJECT_DIR \"" + ROOT.replace(/\\/g, "/") + "\"",
    "!include /CHARSET=UTF8 \"" + include + "\""]
    .concat(assoc.length ? ["!include \"" + path.join(LIB, "templates", "nsis", "include", "FileAssociation.nsh") + "\"",
      "!macro registerFileAssociations"].concat([].concat(...assoc.map(a => [].concat(a.ext).map(x =>
        "!insertmacro APP_ASSOCIATE \"" + q(x) + "\" \"" + q(a.name || x) + "\" \"" + q(a.description || "") + "\" \"$appExe,0\" \"Open with "
        + q(cfg.productName) + "\" \"$appExe $\\\"%1$\\\"\"")))).concat(["!macroend"]) : [])
    .concat(["Section", sect.slice(from, to + 6), "SectionEnd", ""]).join("\n");
  let mk;
  try { mk = await require(path.join(LIB, "out", "toolsets", "windows.js")).getMakeNsisPath((cfg.toolsets || {}).nsis, (cfg.nsis || {}).customNsisBinary); }
  catch (e) { return "electron-builder named no makensis: " + e.message; }
  /* cross-spawn, as electron-builder starts it: the NSIS 3.12 bundle's makensis is a .cmd, which Node will not start bare
     (spawnSync answers EINVAL with no output, which read "refused the script: NaN" here, board 996). */
  const r = require("cross-spawn").sync(mk.path, ["-INPUTCHARSET", "UTF8", "-OUTPUTCHARSET", "UTF8", "-SAFEPPO", "-"],
    { input: script, encoding: "utf8", env: Object.assign({}, process.env, mk.env || {}) });
  if (r.status !== 0) return "makensis refused the script: " + (String((r.stdout || "") + (r.stderr || "")).trim().split(/\r?\n/).slice(-2).join(" / ") || String(r.error || "no output"));
  const open = [], writes = [];
  for (const line of r.stdout.split(/\r?\n/).map(l => l.trim())) {
    const c = /^StrCmp `([^`]*)` `([^`]*)` `` `([^`]+)`$/.exec(line);
    if (c) { open.push({ when: c[1] + "==" + c[2], label: c[3] }); continue; }
    if (open.length && line === open[open.length - 1].label + ":") { open.pop(); continue; }
    const w = /^((?:Write|Delete)Reg\w+) (\S+) (["'`])(.*?)\3(?: (["'`])(.*?)\5)?(?: (["'`])(.*?)\7)?$/.exec(line);
    if (w) writes.push({ op: w[1], root: w[2], key: w[4], name: w[6], value: w[8], when: open.map(o => o.when).join(" && ") });
    else if (/^(Write|Delete)Reg/i.test(line)) return "a registry line the reader cannot parse: " + line;
  }
  return { include, assoc: assoc.length, writes };
}

async function main() {
  const cfg = require(path.join(ROOT, "electron-builder.js"));
  const assoc = [].concat(cfg.fileAssociations || [], (cfg.win || {}).fileAssociations || []);
  check(assoc.length === 0,
    "1a Studio declares no file type, in fileAssociations or under win (" + assoc.length + "), so electron-builder registers none");

  const pinned = path.join(ROOT, "engine", "pinned", "shell", "installer.nsh");
  const hooks = path.join(ROOT, "engine", "pinned", ".installer-hooks.nsh");
  const wrapper = path.join(ROOT, "packaging", "installer-pages.nsh");
  const got = await installWrites(cfg);
  const refused = typeof got === "string" ? got : "";
  const wrapText = fs.existsSync(wrapper) ? fs.readFileSync(wrapper, "utf8") : "";
  const hookInc = /!include \/CHARSET=UTF8 "\$\{PROJECT_DIR_BS\}\\engine\\pinned\\\.installer-hooks\.nsh"/.test(wrapText);
  const fullInc = /engine\\pinned\\shell\\installer\.nsh/.test(wrapText);
  check(!refused && path.resolve(got.include) === path.resolve(wrapper) && hookInc && !fullInc
        && fs.existsSync(pinned) && fs.existsSync(hooks),
    "1b the include electron-builder reads is packaging/installer-pages.nsh, which includes the five-hook cut and not the desk's shell/installer.nsh: "
    + (refused || path.relative(ROOT, got.include) + (hookInc && !fullInc ? " -> engine/pinned/.installer-hooks.nsh" : " -> include line missing")));
  /* THE TURNING'S CARRIAGE (board 954, the test architect's read 2026-11-03 11:54 and 12:22): a silent run unpacks no
     frames, a failed or partial unpack never stops an install or an uninstall, and the pages keep the still. */
  const turn = (text) => {
    const macro = (name) => (new RegExp("!macro " + name + "\\r?\\n([\\s\\S]*?)!macroend").exec(text) || [])[1] || "";
    const guarded = (m) => /\$\{IfNot\} \$\{Silent\}[\s\S]*Nsis7z::Extract[\s\S]*\$\{EndIf\}/.test(m)
      && m.indexOf("${IfNot} ${Silent}") < m.indexOf("Nsis7z::Extract") && !/\bAbort\b|\bQuit\b/.test(m);
    return [guarded(macro("customInit")), guarded(macro("customUnInit")),
      /\$\{If\} \$\{FileExists\} "\$PLUGINSDIR\\turn\\sidebar-000\.bmp"\r?\n[^\n]*\r?\n[^\n]*\r?\n\s*nsDialogs::CreateTimer/.test(text),
      /\$\{If\} \$\{FileExists\} \$4\r?\n\s*System::Call 'user32::LoadImage/.test(text),
      !/\$\{If\} \$\{Errors\}/.test(macro("customInit") + macro("customUnInit"))];
  };
  const turned = turn(wrapText);
  check(turned.every(Boolean),
    "1g the turning's frames unpack only when the run is not silent, in the installer and the uninstaller, with no Abort or Quit; the timer starts only once the first frame exists; each frame is read only if it exists; no inert error check: "
    + JSON.stringify(turned));

  const guiAt = wrapText.search(/Function TurnGuiInit/);
  const guiEnd = guiAt < 0 ? -1 : wrapText.indexOf("FunctionEnd", guiAt);
  const gui = guiAt < 0 ? "" : wrapText.slice(guiAt, guiEnd);
  const guiPress = (gui.match(/SendMessage\s+\$HWNDPARENT\s+0x408\b/g) || []).length;
  const pinFn = ((fs.existsSync(hooks) ? fs.readFileSync(hooks, "utf8") : "")
    .match(/Function skipLicenseIfInner[\s\S]*?FunctionEnd/) || [""])[0];
  const pinPress = (pinFn.match(/SendMessage\s+\$HWNDPARENT\s+0x408\b/g) || []).length;
  check(guiPress === 0 && pinPress === 2 && /Call skipLicenseIfInner/.test(gui)
        && /Call TurnPrepare/.test(gui) && /!macro customWelcomePage/.test(wrapText)
        && !/!macro customHeader/.test(wrapText),
    "1f the pin's skipLicenseIfInner presses Next twice (welcome, then licence) and the wrapper adds none, then calls it and TurnPrepare, and does not redefine the pin's macros: "
    + "wrapper " + guiPress + ", pin " + pinPress);

  const classes = refused ? [] : got.writes.filter(w => /^Software\\Classes(\\|$)/i.test(w.key) || /^(HKCR|HKEY_CLASSES_ROOT)(32|64)?$/i.test(w.root));
  check(!refused && classes.length === 0,
    "1c makensis leaves no write under Software\\Classes in Studio's installer, in any language: "
    + (refused || classes.length + (classes.length ? ", " + JSON.stringify(classes.map(w => [w.key, w.value, w.when])) : "")));

  /* The control that the reading reached customInstall at all: an include that failed to load,
     or a script that never inserted it, would leave no Classes write for free. */
  check(!refused && got.writes.some(w => w.name === "InstallLocation" && w.value === "$INSTDIR" && !w.when),
    "1d and the same reading finds customInstall's InstallLocation, so the include was read and inserted: "
    + (refused || got.writes.length + " registry write(s) in all"));

  /* THE FLAG THE HOOK SENDS IS ONE STUDIO READS: a first copy it starts exits with no window, and a running one, the one
     hidden in the tray included, quits so the installer can replace it (board 969, S5). */
  const mainText = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  check(/const studioRuns = theOnlyOne && !updateClose\(process\.argv\);/.test(mainText) && /if \(studioRuns\) app\.whenReady\(\)/.test(mainText)
        && /if \(updateClose\(argv\)\) \{\s*quitting = true;\s*app\.quit\(\);\s*return;\s*\}/.test(mainText),
    "1e2 Studio reads the --update-close the pin's hook sends: no window for a first copy, and a running one quits rather than coming forward");
  /* The build includes the five-hook cut, not the desk's whole script. The pin's shell/installer.nsh now also
     defines the desk's turning (customInit and the welcome page) and includes its turning script. A macro
     beyond that list, or a hook whose body changed, turns 1e red to be read again. The behaviours below are
     read from the cut, which is what makensis compiles. */
  const nsh = fs.existsSync(pinned) ? fs.readFileSync(pinned, "utf8") : "";
  const hookText = fs.existsSync(hooks) ? fs.readFileSync(hooks, "utf8") : "";
  const pinLine = fs.readFileSync(path.join(ROOT, "tools", "engine-pin"), "utf8")
    .split(/\r?\n/).map(l => /^\s*ENGINE_PIN\s*=\s*(\S*)\s*$/.exec(l)).filter(Boolean)[0];
  const pin = pinLine ? pinLine[1] : "";
  let cut = "";
  try { cut = nsh && pin ? installerHooksFrom(nsh, pin) : ""; } catch (e) { cut = ""; }
  const macrosOf = (text) => [...text.matchAll(/^[ \t]*!macro[ \t]+(\S+)/gim)].map(m => m[1]);
  const defined = macrosOf(nsh);
  const hookDefined = macrosOf(hookText);
  const included = [...nsh.matchAll(/^[ \t]*!(?:include|addincludedir)\b.*$/gim)].map(m => m[0].trim());
  const bodyOf = (text, name) => {
    const lines = text.replace(/\r/g, "").split("\n");
    const at = lines.findIndex(l => l.trim().split(/\s+/)[0] === "!macro" && l.trim().split(/\s+/)[1] === name);
    if (at < 0) return null;
    const out = [];
    for (let i = at + 1; i < lines.length && lines[i].trim() !== "!macroend"; i++) out.push(lines[i].trim());
    return out.filter(Boolean);
  };
  const HOOKS = ["customHeader", "customInstall", "customCheckAppRunning", "customRemoveFiles", "customUnInstall"];
  /* The cut from shell/installer.nsh also carries the swap macros and board 995's etiudaAsUser / etiudaRemoveTree /
     etiudaOldUserCopy helpers; Studio's own turning, customInit and customWelcomePage stay out in packaging/installer-pages.nsh. */
  const SWAP_HOOKS = [
    "etiudaAskCloseRun", "etiudaAskClose", "etiudaTrimSlashes", "etiudaFailBox", "etiudaStageAbort",
    "etiudaStageBegin", "etiudaStageEnd", "etiudaRenameRetry", "etiudaSwap", "etiudaOldFolder",
    "etiudaDropOldFilesFunction", "etiudaDropOld", "customUnInstallCheck", "customUnInstallCheckCurrentUser",
    "etiudaDropOldRun", "etiudaDropAside",
    "etiudaAsUser", "etiudaRemoveTree", "etiudaOldUserCopyRun", "etiudaOldUserCopy",
  ].concat(
    /* From engine 22d3af9c, whose installer reads the install's own list (etiuda-files.ini): the list a copy aside is read by, and the
       walks over it with the stage's judge. Was: the twenty above. Now, for such a pin: those and these two. */
    nsh.indexOf("etiuda-files.ini") > -1 ? ["etiudaAsideList", "etiudaListWalkFunction"] : []);
  const INCLUDED_HOOKS = HOOKS.concat(SWAP_HOOKS);
  /* From engine 86c4cf78 the desk's turning block also defines the one-Setup guard and the two files-page hooks that stop the turning
     while a section runs. Was: the six. Now, for such a pin: those and these three, none of them in the cut. */
  const DESK = ["customInit", "customUnInit", "TurnEmit", "TurnLang", "customWelcomePage", "customUnWelcomePage"].concat(
    nsh.indexOf("!macro customPageAfterChangeDir") > -1 ? ["etiudaOneSetup", "customPageAfterChangeDir", "customUninstallPage"] : []);
  const KNOWN = INCLUDED_HOOKS.concat(DESK);
  const run = bodyOf(hookText, "customCheckAppRunning") || [];
  const kills = run.filter(l => /taskkill/i.test(l));
  const runOk = kills.length === 1 && kills[0].indexOf('/IM "${APP_EXECUTABLE_FILENAME}"') > -1 && !/\s\/F\b/i.test(kills[0])
    && run.filter(l => /IMAGENAME eq/i.test(l)).every(l => l.indexOf("IMAGENAME eq ${APP_EXECUTABLE_FILENAME}") > -1);
  const rm = bodyOf(hookText, "customRemoveFiles") || [];
  /* The folder goes through the pin's walk (un.etiudaRemoveTree), which removes a link as itself, not RMDir /r. */
  const rmAt = rm.indexOf("Push $INSTDIR");
  const rmOk = rmAt > 0 && rm[rmAt + 1] === "Call un.etiudaRemoveTree" && !rm.some(l => /^RMDir\b/i.test(l))
    && /^\$\{IfNot\} \$\{isUpdated\}/.test(rm[0] || "") && rm.indexOf("${EndIf}") > rmAt;
  const un = bodyOf(hookText, "customUnInstall") || [];
  /* A block's own !endif, counted by depth: the guard holds blocks of its own (!ifndef ETIUDA_EC_EXT), whose !endif comes first. */
  const endOf = (u, at) => { if (at < 0) return -1; let d = 0; for (let i = at; i < u.length; i++) {
    if (/^!if/.test(u[i])) d++; else if (/^!endif\b/.test(u[i]) && --d === 0) return i; } return -1; };
  const guardAt = un.indexOf("!ifmacrodef unregisterFileAssociations"), guardEnd = endOf(un, guardAt);
  /* The desk's Remove my data step reaches Studio's uninstaller only under OWN_UNINSTALL_DATA_STEP, which Studio
     defines: every line naming $RemoveMyData or un.ClearDeskFolder stands inside that block. */
  const dataAt = un.indexOf("!ifndef OWN_UNINSTALL_DATA_STEP");
  const dataEnd = dataAt < 0 ? -1 : (() => { let d = 0; for (let i = dataAt; i < un.length; i++) {
    if (/^!if/.test(un[i])) d++; else if (/^!endif\b/.test(un[i]) && --d === 0) return i; } return -1; })();
  const deskData = un.map((l, i) => !/^[#;]/.test(l) && /\$RemoveMyData|un\.ClearDeskFolder/.test(l) ? i : -1).filter(i => i >= 0);
  const ownDefined = /^[ \t]*!define[ \t]+OWN_UNINSTALL_DATA_STEP\b/m.test(fs.readFileSync(path.join(ROOT, "packaging", "installer-pages.nsh"), "utf8"));
  const dataOk = ownDefined && (deskData.length === 0 || (dataAt > -1 && dataEnd > dataAt && deskData.every(i => i > dataAt && i < dataEnd)));
  /* THE REGISTRY IN STUDIO'S UNINSTALLER: inside the association guard, which Studio never opens, and nowhere else but the
     Start-with-Windows cleanup (engine 72208afc, the test architect's read of 2026-11-12): exactly the two Run value names, on
     HKCU's Run key, each directly under its "${If} $0 == $R8" (the value still starts this install's program) and inside
     "${IfNot} ${isUpdated}". Any other registry line outside the guard is red. */
  const RUN_KEY = 'DeleteRegValue HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Run" ';
  const RUN_OK = [RUN_KEY + '"${APP_ID}"', RUN_KEY + '"electron.app.${PRODUCT_NAME}"'];
  const unOkOf = (u) => {
    const gAt = u.indexOf("!ifmacrodef unregisterFileAssociations"), gEnd = endOf(u, gAt);
    const regs = u.map((l, i) => /^(DeleteReg|WriteReg)/i.test(l) ? i : -1).filter(i => i >= 0);
    const inUpdatedGuard = (i) => {
      for (let s = i - 1; s >= 0; s--) {
        if (u[s] !== "${IfNot} ${isUpdated}") continue;
        let d = 0;
        for (let j = s; j < u.length; j++) {
          if (/^\$\{If(Not)?\}/.test(u[j])) d++;
          else if (u[j] === "${EndIf}" && --d === 0) return i < j;
        }
        return false;
      }
      return false;
    };
    const runOkAt = (i) => RUN_OK.indexOf(u[i]) > -1 && u[i - 1] === "${If} $0 == $R8" && inUpdatedGuard(i);
    return gAt > -1 && gEnd > gAt && regs.some(i => i > gAt && i < gEnd)
      && regs.every(i => (i > gAt && i < gEnd) || runOkAt(i));
  };
  const unOk = unOkOf(un) && !/^[ \t]*!macro[ \t]+unregisterFileAssociations\b/m.test(hookText);
  /* Each way of widening the cleanup, made in memory on the hook's own lines, turns it red; ETIUDA_PLANTS=off makes neither. */
  let unPlants = true;
  if (process.env.ETIUDA_PLANTS !== "off") {
    const first = un.findIndex(l => RUN_OK.indexOf(l) > -1);
    const noGuard = un.filter((l, i) => !(i === first - 1 && l === "${If} $0 == $R8"));
    const thirdName = un.map((l, i) => i === first ? RUN_KEY + '"${APP_ID}.other"' : l);
    unPlants = first > 0 && !unOkOf(noGuard) && !unOkOf(thirdName);
    check(unPlants, "1e3 a Run value deleted without its prefix guard, or a third Run value name, turns customUnInstall's registry rule red ("
      + (first > 0 ? "guard removed " + unOkOf(noGuard) + ", third name " + unOkOf(thirdName) : "no Run cleanup found") + ")");
    /* The guard's end is its own !endif, not the first one inside it: a registry write just past that end turns the rule red. */
    const gEnd = endOf(un, guardAt);
    const pastEnd = gEnd > 0 ? un.slice(0, gEnd + 1).concat(['DeleteRegKey SHELL_CONTEXT "Software\\Classes\\.ec"']).concat(un.slice(gEnd + 1)) : un;
    const nested = un.slice(guardAt + 1, gEnd).some((l) => /^!if/.test(l));
    check(gEnd > 0 && !unOkOf(pastEnd), "1e4 a registry write just past the association guard's own !endif turns the rule red (guard nests a block "
      + nested + ", past its end " + unOkOf(pastEnd) + ")");
  }
  const same = HOOKS.every(name => {
    const a = bodyOf(nsh, name), b = bodyOf(hookText, name);
    return !!a && !!b && a.join("\n") === b.join("\n");
  });
  check(cut && hookText === cut && same
        && defined.length === KNOWN.length && KNOWN.every(m => defined.indexOf(m) > -1)
        && hookDefined.length === INCLUDED_HOOKS.length && INCLUDED_HOOKS.every(m => hookDefined.indexOf(m) > -1)
        && included.length === 2 && /turning\.nsh/.test(included[0]) && /allusers-folder\.nsh/.test(included[1])
        && !/!include\b/.test(hookText.replace(/^#.*$/gm, ""))
        && runOk && rmOk && unOk && dataOk,
    "1e the pin's script defines the five hooks, the swap macros and the desk's turning, and the build's cut includes the hooks and the swap,"
    + " customCheckAppRunning asks ${APP_EXECUTABLE_FILENAME} to close and never with /F (" + runOk + "),"
    + " customRemoveFiles removes $INSTDIR only on a fresh install, through the walk (" + rmOk + "), customUnInstall writes the"
    + " registry only under !ifmacrodef unregisterFileAssociations, which Studio never defines (" + unOk + "),"
    + " and the desk's data step only under OWN_UNINSTALL_DATA_STEP, which Studio defines (" + dataOk + "): "
    + (defined.join(", ") || "no macro read") + (included.length ? "; " + included.join("; ") : ""));

  process.stdout.write("installer-writes  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main().catch(e => { process.stderr.write(String((e && e.stack) || e) + "\n"); process.exit(1); });
