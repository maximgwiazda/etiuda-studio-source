/* THE ONE DOOR TO STUDIO'S SHELL IN tests/, and why the register next door is now one line.
 *
 * WHAT WENT WRONG, board item 467 next door and item 492 here. Studio's shell reads two things
 * from outside itself and both of them are somebody's real work: the user-data folder, where its
 * store lives, and STUDIO_PROJECTS, where it looks for projects. A launch that forgets the first
 * writes the store of whoever is at this desk. A launch that forgets the second reads and WRITES
 * their Documents/Etiuda Studio, and a gate that edits a card in there does it silently and is
 * green about it. The engine met the first half on 2026-09-17 and answered it with one door,
 * E.shellLaunch; tests/launch-door.mjs then kept a register of the fifteen files here that
 * launched without such a door, and wrote at the line that the work the register asks for is one
 * door for Studio's own shell, after which the register is one line however many screens Studio
 * gains. This is that door. The register is that one line, and it names this file.
 *
 * A RULE WRITTEN DOWN IN FIFTEEN PLACES IS ENFORCED IN NONE. That is the whole argument. Every
 * one of those fifteen launchers passed both folders and every one of them was correct; they were
 * correct fifteen times over, three lines each, and the sixteenth would have been correct by
 * imitation until the morning it was not. A chokepoint does not ask anybody to remember.
 *
 * THE REFUSAL IS SEPARATED FROM THE SPAWN, the shape the engine's door already has, so that every
 * judgement here can be driven without an Electron and without a window: launchRefusal answers
 * null or the lines, and the callers throw them. A control can then prove that nothing spawned.
 *
 * WHAT IT REFUSES. The first has happened on this desk, board item 467; the second is what the
 * register next door exists to prevent; the third has not happened and is here because it is
 * silent, which is the property that decides whether a rule is worth a chokepoint:
 *
 *   - no --user-data-dir, or one under this machine's own Studio profile. There are TWO of those
 *     to avoid, because app.getName() answers package.json's `name` from the tree and
 *     electron-builder's productName from the packaged app: %APPDATA%\etiuda-studio and
 *     %APPDATA%\Etiuda Studio are both real profiles and a launch must be under neither.
 *   - no STUDIO_PROJECTS, or one at this person's own projects folder. Studio's default sits
 *     BESIDE the engine's catalog folder rather than inside it, Documents\Etiuda Studio, with
 *     the home directory as the fallback when Electron cannot answer for Documents; both are
 *     guesses at a folder that may be redirected, so they are the clause that catches the
 *     obvious wrong place rather than a proof that the launch is safe. The user-data folder is
 *     what holds.
 *   - a user-data folder whose store already names a projects root. THE STORE WINS OVER THE
 *     ENVIRONMENT: shell/main.js reads s.root first and STUDIO_PROJECTS only after it, so a
 *     launch into a folder that has one is pointed wherever that folder was last pointed, and
 *     the projects the gate planted are simply not in the list. Nothing throws; the screen is a
 *     working Studio showing somebody else's projects, which is the same shape of fault as the
 *     shared debugging port in tests/debug-port.mjs and reads the same way, as a sentence about
 *     the product for a fault that is entirely about a folder.
 *
 * EVERY STUDIO_ VARIABLE THE CALL DOES NOT SET IS REMOVED rather than inherited. tests/polish.mjs
 * had to delete STUDIO_LANG by hand to ask what a desk with nothing set does, and that question
 * is only answerable if the answer cannot come from the seat's own shell. So the shell's
 * behaviour under this door is decided by the call, and a STUDIO_ variable left in an
 * environment by a previous run cannot reach into a suite.
 *
 * THE TEARDOWN KILLS THE TREE, and the reason is not the one it looks like. child.kill() was
 * MEASURED first, on 2026-09-17, because a teardown is worth changing only against a reading: a
 * window opened through this door, its four processes listed, then child.kill() and half a second
 * to settle, three runs of three. All four were gone every time and the user-data folder removed
 * at the first attempt. So the fifteen launchers were not leaking Electrons and this is not a fix.
 * What killing the tree by pid buys is that it does not DEPEND on the children noticing that their
 * parent has died: SIGTERM reaches the main process and the rest follow because their channel breaks,
 * which is a race a hung renderer can lose, and this desk has hung renderers - a native confirm()
 * under the host blocks the main process and every page's CDP channel. It is also the instrument
 * the other launch in this tree used then, the desk oracle tests/stats-screen.mjs had until
 * board 891. The tree is the
 * pinned engine's (board 832: the launch and its descendants by creation time, each killed without
 * /T), which costs a process-table read per teardown. Phase 6 of tests/shell-launch.mjs holds it to its claim: the descendants
 * of the launched process, listed while the window is up, are gone afterwards, folder and all.
 *
 * WHAT THIS DOOR IS NOT. It does not drive the page. press, put and the rest stay in the suites
 * that use them, because a helper that grows a driver becomes the thing every suite must be read
 * through. This file is the launch, the connect and the teardown, and one declaration made at the
 * open: `words: true`, how a suite reads what the page says (wordsOf, below). It is here for the
 * reason the two folders are, the argument above: the fold is one rule, thirteen suites need it,
 * and written into each of them it is thirteen copies the fourteenth forgets. Kept on the door
 * rather than moved to a module of its own on 2026-09-24 (test architect): the fault found in it
 * was that it covered one read of three, not where it lived, and a move would have churned every
 * suite and the branches still adding it. What it does NOT fold, said rather than implied: an
 * element handle's own reads, waitForFunction's answer, a second page the browser hands out, and
 * any match done inside the page, which a suite folds there itself (lint-jump, stats-screen 3b2).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync, execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { OWN_PORT, armPort, connectOwn } from "./debug-port.mjs";
import { wallOrThrow } from "./window-wall.mjs";
import { waitLaunchGone } from "./launch-wait.mjs";
import { seatEnv } from "./seated.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, "..");
const CRASH_GUARD = path.join(HERE, "crash-guard.cjs");

const UD_FLAG = "--user-data-dir=";
const STORE = "studio.json";

/* The profiles a launch must be under neither of. Two names for one product, see the header. */
const REAL_USER_DATA = (function () {
  const home = os.homedir();
  const appData = process.platform === "win32"
    ? (process.env.APPDATA || path.join(home, "AppData", "Roaming"))
    : process.platform === "darwin" ? path.join(home, "Library", "Application Support")
    : (process.env.XDG_CONFIG_HOME || path.join(home, ".config"));
  return ["etiuda-studio", "Etiuda Studio"].map(n => path.join(appData, n));
})();

/* ---- the real profile wall and safe operations (no-real-profile brief) ----------------------
 *
 * No test, in either tree, moves, renames, parks, writes or deletes anything under Max's real
 * user-data folder for Etiuda or Etiuda Studio, or in his real Documents\Etiuda.
 * Real means the folders known to the OS for the running user (SHGetKnownFolderPath through one
 * bounded query), not the environment variables. */

export { isInstalledAppRunning, stubInstalledAppRunning } from "../tools/gate-run.mjs";

let cachedRealProfileFolders = null;
let stubbedRealProfileFolders = null;

export function realProfileFolders() {
  if (stubbedRealProfileFolders) return stubbedRealProfileFolders;
  if (process.env.ETIUDA_REAL_PROFILE_OVERRIDE) {
    const root = process.env.ETIUDA_REAL_PROFILE_OVERRIDE;
    return [
      path.join(root, "etiuda"),
      path.join(root, "Etiuda Studio"),
      path.join(root, "Documents", "Etiuda"),
    ];
  }
  if (cachedRealProfileFolders) return cachedRealProfileFolders;
  if (process.platform !== "win32") {
    const h = os.homedir();
    cachedRealProfileFolders = [
      path.join(h, ".config", "etiuda"),
      path.join(h, ".config", "Etiuda Studio"),
      path.join(h, "Documents", "Etiuda"),
    ];
    return cachedRealProfileFolders;
  }
  try {
    const script = [
      "$a = [Environment]::GetFolderPath([Environment+SpecialFolder]::ApplicationData)",
      "$d = [Environment]::GetFolderPath([Environment+SpecialFolder]::MyDocuments)",
      "$a + [char]9 + $d"
    ].join("; ");
    const out = execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", script], {
      encoding: "utf8", windowsHide: true, timeout: 30000
    }).trim();
    const parts = out.split("\t");
    const appData = parts[0] || (process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"));
    const docs = parts[1] || path.join(os.homedir(), "Documents");
    cachedRealProfileFolders = [
      path.join(appData, "etiuda"),
      path.join(appData, "Etiuda Studio"),
      path.join(docs, "Etiuda"),
    ];
  } catch (e) {
    const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
    const docs = path.join(os.homedir(), "Documents");
    cachedRealProfileFolders = [
      path.join(appData, "etiuda"),
      path.join(appData, "Etiuda Studio"),
      path.join(docs, "Etiuda"),
    ];
  }
  return cachedRealProfileFolders;
}

export function stubRealProfileFolders(folders) {
  stubbedRealProfileFolders = folders;
}

export function isRealProfilePath(target, roots) {
  if (!target) return false;
  const list = roots || realProfileFolders();
  const resolved = path.resolve(String(target));
  const normTarget = process.platform === "win32" ? resolved.toLowerCase() : resolved;
  for (const r of list) {
    const normRoot = process.platform === "win32" ? path.resolve(r).toLowerCase() : path.resolve(r);
    if (normTarget === normRoot || normTarget.startsWith(normRoot + path.sep)) {
      return r;
    }
  }
  return false;
}

export function realProfileGuard(target, opts) {
  const targets = Array.isArray(target) ? target : [target];
  const roots = (opts && opts.roots) || undefined;
  for (const t of targets) {
    const matched = isRealProfilePath(t, roots);
    if (matched) {
      console.log("#refused real-profile");
      console.log("  FAIL refused: real-profile");
      console.log("       path resolves inside the real profile: " + t + " (matches " + matched + ")");
      console.log("       no test or tool may move, rename, write or delete anything in Max's real profile.");
      console.log("  SUITE DID NOT COMPLETE: real-profile");
      process.exit(78);
    }
  }
}

export function safeListing(dir) {
  try {
    return fs.readdirSync(dir).sort();
  } catch (e) {
    if (e && e.code === "ENOENT") return [];
    console.log("#refused unreadable-folder");
    console.log("  FAIL refused: unreadable-folder");
    console.log("       refused unreadable folder: " + dir + " (" + (e && e.code || e.message || e) + ")");
    console.log("       a listing or stat deciding safety must refuse on error, never answer empty.");
    console.log("  SUITE DID NOT COMPLETE: unreadable-folder");
    process.exit(78);
  }
}

export function safeMove(src, dst) {
  realProfileGuard(src);
  realProfileGuard(dst);
  let srcStat;
  try {
    srcStat = fs.statSync(src);
  } catch (e) {
    console.log("  FAIL safeMove: source cannot be stated: " + src + " (" + (e && e.message || e) + ")");
    process.exit(78);
  }
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.renameSync(src, dst);
  if (fs.existsSync(src)) {
    console.log("  FAIL safeMove: source still exists after move: " + src);
    process.exit(78);
  }
  let dstStat;
  try {
    dstStat = fs.statSync(dst);
  } catch (e) {
    console.log("  FAIL safeMove: destination does not exist after move: " + dst);
    process.exit(78);
  }
  if (dstStat.size !== srcStat.size) {
    console.log("  FAIL safeMove: size mismatch after move: " + src + " (" + srcStat.size + " bytes) -> " + dst + " (" + dstStat.size + " bytes)");
    process.exit(78);
  }
  if (Math.abs(dstStat.mtimeMs - srcStat.mtimeMs) > 1000) {
    console.log("  FAIL safeMove: mtime mismatch after move: " + src + " -> " + dst);
    process.exit(78);
  }
  return { ok: true, size: dstStat.size, mtimeMs: dstStat.mtimeMs };
}

/* Where this person's own projects would be, as a guess: shell/main.js asks Electron for
   Documents and falls back to the home directory, and this cannot ask Electron anything. */
const REAL_PROJECTS = [
  path.join(os.homedir(), "Documents", "Etiuda Studio"),
  path.join(os.homedir(), "Etiuda Studio"),
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* path.relative over resolved paths, case-folded on win32, and deliberately WITHOUT realpath: a
   launch is judged before anything it names has been made. */
function underOrEqual(parent, child) {
  const norm = p => {
    const r = path.resolve(String(p));
    return process.platform === "win32" ? r.toLowerCase() : r;
  };
  const rel = path.relative(norm(parent), norm(child));
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

/** The LAST --user-data-dir in the arguments, because that is which of two Chromium honours. */
export function userDataDirOf(args) {
  const hit = (args || []).map(String).filter(a => a.indexOf(UD_FLAG) === 0).pop();
  return hit ? hit.slice(UD_FLAG.length).replace(/^"([\s\S]*)"$/, "$1") : "";
}

/** The projects root a user-data folder's store already names, or "" for a folder with no store
 *  and for a store nothing can read: either way nothing would override the environment. */
export function storedRoot(ud) {
  try {
    const s = JSON.parse(fs.readFileSync(path.join(ud, STORE), "utf8"));
    return typeof s.root === "string" ? s.root : "";
  } catch (e) { return ""; }
}

/** Studio's Electron, with the one sentence a checkout that has none needs to read. */
export function electronExe() {
  const at = path.join(ROOT, "node_modules", "electron", "dist", "electron.exe");
  if (fs.existsSync(at)) return at;
  const nix = path.join(ROOT, "node_modules", "electron", "dist", "electron");
  if (fs.existsSync(nix)) return nix;
  throw new Error("no Electron at " + at + "; run npm install"
    + (fs.existsSync(path.join(ROOT, "node_modules")) ? ""
       : ", or, in a git worktree, link the sibling checkout's node_modules in: a worktree gets"
         + " no node_modules of its own and every gate here dies on this line"));
}

/** Null where the launch may go ahead, or the lines saying why not: the first names the caller
 *  and the fault, the rest say what to do about it. One log holds several launches, so every
 *  line names who. */
export function launchRefusal(who, args, env) {
  const e = env || {};
  const ud = userDataDirOf(args);
  if (!ud)
    return [who + " would launch Studio with no " + UD_FLAG + ", which is this machine's own"
              + " Studio profile: " + REAL_USER_DATA[0],
            "give the launch a user-data folder of its own; Electron ignores APPDATA, so the flag"
              + " is the only way to move it.",
            "board item 467: two labs on one desk wrote the real profile on 2026-09-17."];
  for (const real of REAL_USER_DATA)
    if (underOrEqual(real, ud) || underOrEqual(ud, real))
      return [who + " would launch Studio with " + UD_FLAG + ud + ", which is this machine's own"
                + " Studio profile: " + real,
              "point it into a lab of this run's own.",
              "the two names are the tree's and the packaged app's; a launch is under neither."];
  const projects = e.STUDIO_PROJECTS || "";
  if (!projects)
    return [who + " would launch Studio with no STUDIO_PROJECTS",
            "give the launch a projects folder of its own.",
            "without it the shell reads and WRITES the projects folder of whoever is at this"
              + " desk, and a gate that edits a card does it in their work."];
  for (const real of REAL_PROJECTS)
    if (underOrEqual(real, projects) || underOrEqual(projects, real))
      return [who + " would launch Studio with STUDIO_PROJECTS=" + projects + ", which is this"
                + " person's own projects folder or a folder holding it: " + real,
              "point it at a folder this run made.",
              "the screens here delete, rename and publish; every one of those would land in"
                + " their work."];
  const stored = storedRoot(ud);
  if (stored && !underOrEqual(stored, projects))
    return [who + " would launch Studio into " + ud + ", whose " + STORE + " already names a"
              + " projects root of its own: " + stored,
            "use a user-data folder this run made, or clear the root out of that store.",
            "shell/main.js reads the store BEFORE STUDIO_PROJECTS, so the folder wins and the"
              + " projects this run planted are simply not in the list; nothing throws."];
  return null;
}

/** Writes `projects` as the projects root into the store of `ud`, keeping whatever else it holds. */
export function pinRoot(ud, projects) {
  realProfileGuard(ud);
  let s = {};
  try { s = JSON.parse(fs.readFileSync(path.join(ud, STORE), "utf8")) || {}; } catch (e) { s = {}; }
  fs.mkdirSync(ud, { recursive: true });
  fs.writeFileSync(path.join(ud, STORE), JSON.stringify(Object.assign(s, { root: projects })), "utf8");
}

/* The window wall comes after the folders, so a folder refusal keeps its own words (tests/window-wall.mjs). */
function refuseOrGo(who, args, env) {
  const bad = launchRefusal(who, args, env);
  if (bad) throw new Error(bad.join("\n       "));
  wallOrThrow(who);
}

/** The environment one launch gets: this process's, less every STUDIO_ variable, plus the
 *  offscreen flag and whatever the call adds. A value of null or undefined in `extra` removes
 *  the variable, which is how a call asks what an unset one does.
 *
 *  THE PROJECTS FOLDER IS NOT SET HERE, and that is deliberate twice over. It is assigned at
 *  each of the two launches below, one line from the spawn, so that the folder a launch gets
 *  cannot be overridden by a call's extras and so that tests/launch-door.mjs reads the literal
 *  in the same window as the call, which is its whole rule and is not satisfied by prose. */
export function studioEnv(extra) {
  const out = {};
  for (const k of Object.keys(process.env)) if (!/^STUDIO_/.test(k)) out[k] = process.env[k];
  out.STUDIO_TEST_OFFSCREEN = "1";
  for (const k of Object.keys(extra || {})) {
    const v = extra[k];
    if (v === null || v === undefined) delete out[k];
    else out[k] = String(v);
  }
  return out;
}

/** WINDOWS' OWN PROCESS TABLE, once, as pairs of pid and parent.
 *
 *  IT IS HERE FOR THE PARENTS, not for the liveness. Whether one pid is still running is a
 *  question process.kill(pid, 0) answers, and it answers it correctly on Windows even while this
 *  process still holds the child's handle: measured 2026-09-17, a node child killed with
 *  taskkill /F /T reads as gone by that route a second later, with the ChildProcess object held
 *  throughout. What process.kill cannot answer is WHICH processes are somebody's children, and
 *  that is the question a teardown has to ask, because Electron's renderer, GPU and utility
 *  processes are separate pids and one of them holds the user-data folder open.
 *
 *  On Linux it is /proc (linuxProcessTable, below). Answers [] where it cannot ask, which is every
 *  other platform; the one leg that reads it says so rather than going green on an empty list. */
/* ---- WHETHER A LAUNCH PUT ANYTHING ON A DISPLAY, board item 535 -------------------------------
 *
 * NOT A QUESTION THE PAGE CAN ANSWER. A renderer reports its own size whether the window is on a
 * monitor or beyond the far corner of every one, and a NATIVE dialog - a file or folder picker -
 * is not in the page at all: it is the system's own window, class #32770, centred on the primary
 * display whatever its owner is doing. That is what put a window on this desk, measured.
 *
 * THE RULE IS THE RECTANGLE AGAINST THE MONITORS, not MonitorFromWindow. Measured 2026-09-18
 * over 569 samples: a MINIMIZED window sitting at -25600,-25600 comes back from
 * MonitorFromWindow with the primary monitor's handle even under MONITOR_DEFAULTTONULL, so that
 * call alone reads a hidden window as visible. The monitors are read with EnumDisplayMonitors,
 * in the same coordinates GetWindowRect answers in, so no scale factor enters the arithmetic.
 *
 * `measured` IS THE DIFFERENCE BETWEEN "NOTHING ON SCREEN" AND "COULD NOT LOOK", and the caller
 * asserts it: a helper that cannot run must redden rather than read as a clean desk. The window
 * CAPTION is deliberately not read - a title is text of the running product and this output is
 * printed into a suite log - but the window CLASS is, because it tells a Chromium window from a
 * system dialog and is a fact about the frame rather than about content.
 */
const WINDOWS_PS1 = [
  "param([int]$TargetPid)",
  'Add-Type @"',
  "using System;",
  "using System.Text;",
  "using System.Runtime.InteropServices;",
  "public class SD {",
  '  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr p);',
  "  public delegate bool EnumProc(IntPtr h, IntPtr p);",
  '  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);',
  '  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);',
  '  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);',
  '  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out R r);',
  '  [DllImport("user32.dll")] public static extern int GetClassName(IntPtr h, StringBuilder s, int max);',
  '  [DllImport("user32.dll")] public static extern bool EnumDisplayMonitors(IntPtr dc, IntPtr clip, MonProc cb, IntPtr p);',
  "  public delegate bool MonProc(IntPtr m, IntPtr dc, ref R r, IntPtr p);",
  "  [StructLayout(LayoutKind.Sequential)] public struct R { public int left, top, right, bottom; }",
  "}",
  '"@',
  "$mons = New-Object System.Collections.ArrayList",
  "$mcb = [SD+MonProc]{",
  "  param($m, $dc, [ref]$r, $p)",
  "  [void]$mons.Add([pscustomobject]@{ l = $r.Value.left; t = $r.Value.top; r = $r.Value.right; b = $r.Value.bottom })",
  "  return $true",
  "}",
  "[void][SD]::EnumDisplayMonitors([IntPtr]::Zero, [IntPtr]::Zero, $mcb, [IntPtr]::Zero)",
  "$found = New-Object System.Collections.ArrayList",
  "$cb = [SD+EnumProc]{",
  "  param($h, $p)",
  "  [uint32]$owner = 0",
  "  [void][SD]::GetWindowThreadProcessId($h, [ref]$owner)",
  "  if ($owner -eq $TargetPid -and [SD]::IsWindowVisible($h)) {",
  "    $wr = New-Object SD+R; [void][SD]::GetWindowRect($h, [ref]$wr)",
  "    $w = $wr.right - $wr.left; $ht = $wr.bottom - $wr.top",
  "    if ($w -gt 0 -and $ht -gt 0) {",
  "      $hit = $false",
  "      if (-not [SD]::IsIconic($h)) {",
  "        foreach ($m in $mons) {",
  "          if ($wr.left -lt $m.r -and $wr.right -gt $m.l -and $wr.top -lt $m.b -and $wr.bottom -gt $m.t) { $hit = $true }",
  "        }",
  "      }",
  "      $sb = New-Object System.Text.StringBuilder 256",
  "      [void][SD]::GetClassName($h, $sb, 256)",
  "      [void]$found.Add([pscustomobject]@{",
  "        cls = $sb.ToString(); x = $wr.left; y = $wr.top; w = $w; h = $ht",
  "        iconic = [bool][SD]::IsIconic($h); onDisplay = $hit",
  "      })",
  "    }",
  "  }",
  "  return $true",
  "}",
  "[void][SD]::EnumWindows($cb, [IntPtr]::Zero)",
  "$out = [ordered]@{ monitors = @($mons); windows = $found.Count;",
  "  onDisplay = @($found | Where-Object { $_.onDisplay }).Count; all = @($found) }",
  "[pscustomobject]$out | ConvertTo-Json -Compress -Depth 4",
].join("\n");

let windowsPs1File = "";
/** Every visible top-level window of one pid, and how many of them land on a display.
 *  { measured, windows, onDisplay, monitors, all } - or { measured: false, why }. */
export function windowsOf(pid) {
  if (process.platform === "linux") return linuxWindowsOf(pid);
  if (process.platform !== "win32")
    return { measured: false, why: "this helper is Win32 and X11 and this is " + process.platform };
  try {
    if (!windowsPs1File) {
      windowsPs1File = path.join(os.tmpdir(), "studio-window-facts.ps1");
      fs.writeFileSync(windowsPs1File, WINDOWS_PS1, "utf8");
    }
    const out = execFileSync("powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", windowsPs1File, "-TargetPid", String(pid)],
      { encoding: "utf8", windowsHide: true }).trim();
    const a = JSON.parse(out || "{}");
    if (typeof a.windows !== "number" || !Array.isArray(a.monitors) || !a.monitors.length)
      return { measured: false, why: "the helper answered " + JSON.stringify(out.slice(0, 200)) };
    /* ConvertTo-Json writes a one-element array as a bare object. */
    const list = x => (Array.isArray(x) ? x : (x ? [x] : []));
    return { measured: true, windows: a.windows, onDisplay: a.onDisplay,
             monitors: list(a.monitors), all: list(a.all) };
  } catch (e) {
    return { measured: false, why: String((e && e.message) || e).split(/\r?\n/)[0] };
  }
}

export function processTable() {
  if (process.platform === "linux") return linuxProcessTable();
  if (process.platform !== "win32") return [];
  let rows = "";
  try {
    rows = execFileSync("powershell", ["-NoProfile", "-NonInteractive", "-Command",
      "Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId | ConvertTo-Csv"
        + " -NoTypeInformation"],
      { encoding: "utf8", timeout: 30000, windowsHide: true });
  } catch (e) { return []; }
  const out = [];
  for (const line of rows.split(/\r?\n/)) {
    const m = line.match(/^"?(\d+)"?,"?(\d+)"?$/);
    if (m) out.push({ pid: Number(m[1]), parent: Number(m[2]) });
  }
  return out;
}

/* ON LINUX THE TABLE IS /proc, read directly: each /proc/<pid>/stat names the parent in its fourth field, after the
   command name in brackets, which may itself hold spaces and brackets, so the fields are read after its LAST ")". */
function linuxProcessTable() {
  const out = [];
  let names = [];
  try { names = fs.readdirSync("/proc"); } catch (e) { return []; }
  for (const n of names) {
    if (!/^\d+$/.test(n)) continue;
    try {
      const stat = fs.readFileSync("/proc/" + n + "/stat", "utf8");
      const rest = stat.slice(stat.lastIndexOf(")") + 2).split(" ");
      out.push({ pid: Number(n), parent: Number(rest[1]) });
    } catch (e) { /* gone between the listing and the read */ }
  }
  return out;
}

/* THE SAME READING ON LINUX, from the X server the launch drew on ($DISPLAY): every top-level window (a child of
   the root) whose _NET_WM_PID is this pid and which is mapped, its rectangle in root coordinates, and whether that
   meets a monitor as xrandr lists them. WM_CLASS stands where the Win32 class stands, and no title is read, for
   the reason above. A window minimised by a window manager carries WM_STATE Iconic and is never on a display.
   Needs xwininfo, xprop and xrandr (x11-utils, x11-xserver-utils); without them it is not measured. */
function linuxWindowsOf(pid) {
  const x = (cmd, args) => execFileSync(cmd, args, { encoding: "utf8", timeout: 10000 });
  try {
    if (!process.env.DISPLAY) return { measured: false, why: "no DISPLAY to ask" };
    const monitors = [];
    for (const line of x("xrandr", ["--listmonitors"]).split("\n")) {
      const m = line.match(/\s(\d+)\/\d+x(\d+)\/\d+([+-]\d+)([+-]\d+)\s/);
      if (m) monitors.push({ l: Number(m[3]), t: Number(m[4]), r: Number(m[3]) + Number(m[1]), b: Number(m[4]) + Number(m[2]) });
    }
    if (!monitors.length) return { measured: false, why: "xrandr listed no monitor" };
    const ids = [...x("xwininfo", ["-root", "-children"]).matchAll(/^\s+(0x[0-9a-f]+)\s/gm)].map(m => m[1]);
    const all = [];
    for (const id of ids) {
      let props = "";
      try { props = x("xprop", ["-id", id, "_NET_WM_PID", "WM_CLASS", "WM_STATE"]); } catch (e) { continue; }
      const owner = (props.match(/_NET_WM_PID\(CARDINAL\) = (\d+)/) || [])[1];
      if (Number(owner) !== pid) continue;
      const info = x("xwininfo", ["-id", id]);
      if (!/Map State: IsViewable/.test(info)) continue;
      const num = re => Number((info.match(re) || [])[1]);
      const r = { x: num(/Absolute upper-left X:\s+(-?\d+)/), y: num(/Absolute upper-left Y:\s+(-?\d+)/),
                  w: num(/Width:\s+(\d+)/), h: num(/Height:\s+(\d+)/) };
      if (!(r.w > 0 && r.h > 0)) continue;
      const iconic = /window state: Iconic/.test(props);
      const hit = !iconic && monitors.some(m => r.x < m.r && r.x + r.w > m.l && r.y < m.b && r.y + r.h > m.t);
      all.push({ cls: ((props.match(/WM_CLASS\(STRING\) = (.*)/) || [])[1] || "").trim(),
                 x: r.x, y: r.y, w: r.w, h: r.h, iconic, onDisplay: hit });
    }
    return { measured: true, windows: all.length, onDisplay: all.filter(w => w.onDisplay).length, monitors, all };
  } catch (e) {
    return { measured: false, why: String((e && e.message) || e).split(/\r?\n/)[0] };
  }
}

/** Which of these pids are still on the machine. A pid can be reused, which over the seconds
 *  between a kill and the reading after it is not a risk worth an instrument. */
export function stillUp(pids) {
  return (pids || []).filter(p => {
    try { process.kill(p, 0); return true; } catch (e) { return e.code === "EPERM"; }
  });
}

/** Every live descendant of a process, deepest last. What a teardown has to reach, and what no
 *  reading of one pid can name: an Electron is four processes here, its renderer, GPU and utility
 *  children each with a pid of their own. */
export function descendantsOf(pid) {
  if (!pid) return [];
  const kids = new Map();
  for (const r of processTable()) {
    if (!kids.has(r.parent)) kids.set(r.parent, []);
    kids.get(r.parent).push(r.pid);
  }
  const out = [], seen = new Set([pid]);
  const walk = p => {
    for (const c of kids.get(p) || []) {
      if (seen.has(c)) continue;
      seen.add(c); out.push(c); walk(c);
    }
  };
  walk(pid);
  return out;
}

/** The whole tree, unconditionally, rather than a signal to the main process that its children
 *  are expected to notice. See the header: child.kill() was measured to suffice and this does not
 *  depend on the measurement holding for a window that is wedged. Answers the pids it took, for
 *  waitGone below. */
/** The pinned engine the Windows teardown asks. Missing, it refuses in words (kill-tree 1e). */
const PINNED_ENGINE = path.join(ROOT, "engine", "pinned", "tests", "engine.js");
function refuseWithoutPin(who) {
  if (process.platform === "win32" && !fs.existsSync(PINNED_ENGINE))
    throw new Error(who + " asks the pinned engine's killTree to end a window and there is no pin at " + PINNED_ENGINE
      + "; run node tools/engine-fetch.mjs");
}

export function killTree(pid) {
  if (!pid) return [];
  if (process.platform === "win32") {
    /* THE PINNED ENGINE'S KILL, NOT A SECOND COPY OF IT (board 832). This was `taskkill /F /PID n /T`,
       which picks children by ParentProcessId alone and so takes a process whose dead parent's pid
       was reused; the engine's own killTree reads Win32_Process, takes a child only if it was created
       after its parent and kills each pid without /T (its board 829). It costs a process-table read
       per teardown where the one taskkill did not, and its answer names every pid taken, which is what
       waitGone needs. Loaded when asked, so a suite that never tears a window down needs no pin.
       openStudio asks refuseWithoutPin before it spawns, so a tree with none refuses before a window
       exists; this refusal is the backstop for a caller that launched some other way. */
    refuseWithoutPin("the door's teardown");
    const did = createRequire(import.meta.url)(PINNED_ENGINE).killTree(pid);
    return [...new Set([pid].concat((did && did.taken) || []))].filter(p => p !== process.pid);
  }
  /* Elsewhere a group kill where the launch leads one, else the pid; and on Linux every descendant /proc names as
     well, read before the first kill, because Electron's zygotes are its children in no group of their own and
     outlive a main process killed alone (measured on the Ubuntu build, 2026-10-04: 4 of 7 left). */
  const tree = [pid].concat(descendantsOf(pid));
  try { process.kill(-pid, "SIGKILL"); }
  catch (e) { try { process.kill(pid, "SIGKILL"); } catch (x) { /* already down */ } }
  for (const p of tree.slice(1)) { try { process.kill(p, "SIGKILL"); } catch (x) { /* already down */ } }
  return tree;
}

/** Wait, up to `ms`, until none of these pids is running; answers the ones still up.
 *
 *  WHY A TEARDOWN WAITS (board 801 b). taskkill /F returns when it has ASKED Windows to end each
 *  process, not when they have ended, and a process holds its files until it has. On a quiet desk
 *  half a second covered the gap; on 2026-09-26, with other seats' Electrons up, it did not, and
 *  the gate's removal of its scratch folder met EBUSY in the window's user-data folder after
 *  every assertion had passed. The wait is on the fact, not on a guess at how long it takes. */
export async function waitGone(pids, ms) {
  const until = Date.now() + (ms === undefined ? 15000 : ms);
  let left = stillUp(pids);
  while (left.length && Date.now() < until) {
    await sleep(100);
    left = stillUp(left);
  }
  return left;
}

/** ONE STUDIO, OPEN AND CONNECTED TO.
 *
 *  openStudio(who, { projects, userDataDir, env, waitMs, readySteps, words })
 *
 *  `who` names the caller in every refusal and every failure. `projects` and `userDataDir` are
 *  required and are what the refusal above judges. `env` adds to, and can delete from, the
 *  environment the door builds. Answers { child, browser, page, userDataDir, shut }; shut() is
 *  idempotent, so a suite that takes the window down halfway can still call it in its finally.
 *
 *  IT THROWS RATHER THAN HANDING BACK A WINDOW THAT IS NOT READY. The fifteen launchers each
 *  waited nine seconds for window.STUDIO_READY and then carried on regardless, so a page whose
 *  script threw was reported by the first step that could not find its button, which sends the
 *  reader to the screen rather than to the throw. The three failures are named apart here
 *  because they have three different causes: no window at all, a window that never wrote its
 *  debugging port (tests/debug-port.mjs answers that one), and a window whose page never
 *  finished. */
/* A launch that dies is a failure, exit 1, one line. Printed and marked here, then thrown, so the
   caller's finally still runs. A later exit in this process is 1 while the mark is set. */
let shellFailed = false;
let exitWrapped = false;
export function shellStartFailed() { return shellFailed; }
export function shellDidNotStart(why) {
  const text = String(why == null || why === "" ? "the shell did not start" : why).replace(/\s+/g, " ").trim();
  console.log("SHELL DID NOT START: " + text);
  shellFailed = true;
  if (!exitWrapped) {
    exitWrapped = true;
    const realExit = process.exit.bind(process);
    process.exit = (code) => realExit(shellFailed ? 1 : code);
  }
  const err = new Error("SHELL DID NOT START: " + text);
  err.shellDidNotStart = true;
  throw err;
}

/* connectOwn's two sentences for a window that never opened a debugging port. A later fault returns "". */
export function shellStartFailure(err) {
  const msg = String(err && err.message || err || "");
  if (msg.indexOf("never wrote a debugging port") >= 0) return msg;
  if (msg.indexOf("recorded port ") >= 0 && msg.indexOf("did not answer") >= 0) return msg;
  return "";
}

export async function openStudio(who, opts) {
  const o = opts || {};
  if (!o.userDataDir) throw new Error(who + " opened Studio with no userDataDir");
  if (!o.projects) throw new Error(who + " opened Studio with no projects folder");
  refuseWithoutPin(who);
  const ud = armPort(o.userDataDir);
  const guardArgs = ["-r", CRASH_GUARD];
  const args = guardArgs.concat([ROOT, "--user-data-dir=" + ud, OWN_PORT]);
  /* A WINDOW LEG OPENS A STUDIO THAT WORKS (the test architect, 2026-11-22). Since S-1b a Studio nobody signed in to answers every
     closed channel as a stop, so a window leg that walks the screens found its projects unopenable and its store unwritten. The
     profile is seated as a lead's is (tests/seated.mjs) unless the leg says seat: false, for a leg about the stopped Studio itself,
     or seat: "ended" for one whose trial has ended. What the leg's own env names wins over the seat's. The wall is asked first, so
     a refused launch has written nothing. */
  refuseOrGo(who, args, Object.assign(studioEnv(o.env), { STUDIO_PROJECTS: o.projects }));
  const seat = o.seat === false ? {} : await seatEnv(ud, o.seat === undefined ? true : o.seat, o.env || {});
  const env = Object.assign(studioEnv(Object.assign({}, seat, o.env || {})), { STUDIO_PROJECTS: o.projects });
  refuseOrGo(who, args, env);

  const child = spawn(electronExe(), args, { cwd: ROOT, stdio: "ignore", env });
  /* The main process's own end, which node reports once Windows has signalled the process
     object, that is once it has let go of everything it held. */
  const exited = new Promise(r => {
    if (child.exitCode !== null || child.signalCode !== null) r();
    else { child.once("exit", r); child.once("error", r); }
  });
  let browser = null, down = false;
  /* THE TEARDOWN WAITS FOR THE TREE TO BE GONE, board 801 b: see waitGone. Every pid taskkill
     named, and the main process's own exit event, within 15 s; what is still up after that is
     said on stderr and the teardown carries on, because a teardown is not an assertion and must
     never take the run with it (tests/scratch.mjs removes the folder with retries for the rest).
     The settle after it is the half second every suite has always had, kept so that nothing
     timed against it moves. */
  const shut = async (settleMs) => {
    if (down) return;
    down = true;
    if (browser) { try { await browser.disconnect(); } catch (e) { /* the window is gone, which is the aim */ } }
    const pids = killTree(child.pid);
    await Promise.race([exited, sleep(15000)]);
    const left = await waitGone(pids, 15000);
    if (left.length)
      process.stderr.write(who + "  teardown: " + left.length + " of " + pids.length
        + " process(es) of the window still up after 15 s (" + left.join(", ") + "); carrying on\n");
    await sleep(settleMs === undefined ? 500 : settleMs);
  };
  try {
    browser = await connectOwn(ud, { waitMs: o.waitMs });
    let page = (await browser.pages())[0];
    if (!page) throw new Error(who + " connected to the window and it has no page");
    /* 167 steps of 150 ms is a 25 s ceiling. A step that sees STUDIO_READY stops, so a quiet desk pays nothing extra. */
    const steps = o.readySteps || 167;
    let ready = false, moved = 0;
    /* A NAVIGATION DURING THE WAIT IS NOT A FAILURE (board 801 b). The first page can still be
       loading when the door connects, and an evaluate that is in flight when it navigates throws
       "Execution context was destroyed"; on a busy desk, 2026-09-26, that killed a gate between
       two windows. Such a throw costs one step and the wait goes on; any other throw is real and
       goes up. If the page was replaced rather than navigated, the new first page is taken. */
    for (let i = 0; i < steps && !ready; i++) {
      try {
        if (page.isClosed()) page = (await browser.pages())[0] || page;
        ready = !!(await page.evaluate("!!window.STUDIO_READY"));
      } catch (e) {
        if (!/Execution context was destroyed|Cannot find context|detached Frame|Navigating frame was detached/i.test(String(e && e.message)))
          throw e;
        moved++;
        ready = false;
      }
      if (!ready) await sleep(150);
    }
    if (!ready) throw new Error(who + " opened a window that never published window.STUDIO_READY"
      + " within " + ((steps * 150) / 1000) + " s: the page is up and its script did not finish,"
      + " which is a throw in ui/app.js rather than a launch that failed"
      + (moved ? "; the page navigated under " + moved + " of the reads" : ""));
    await waitLaunchGone(page, {
      who: who + " launch",
      refresh: async () => {
        if (page.isClosed()) page = (await browser.pages())[0] || page;
        return page;
      },
    });
    if (o.words) wordsOf(page);
    return { child, browser, page, userDataDir: ud, shut };
  } catch (err) {
    await shut(0);
    const why = shellStartFailure(err);
    if (why) shellDidNotStart(why);
    throw err;
  }
}

/** THE PAGE'S WORDS, EVERY NO-BREAK SPACE READ AS A SPACE. The page binds a number to its word
 *  with U+00A0 in every language (ui/lang.js, fill), a property of line breaks that
 *  tests/few-forms.mjs 2 and tests/polish.mjs 8 hold. A suite asserting what a screen SAYS opens
 *  with `words: true`; every string its evaluate answers, however nested, comes back folded. */
export function wordsOf(page) {
  if (page.wordsOnly) return page;
  const fold = (v) => typeof v === "string" ? v.replace(/\u00a0/g, " ")
    : Array.isArray(v) ? v.map(fold)
    : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fold(x)]))
    : v;
  /* Every read that hands a value back from the page, not only the one the suites used first: a
     suite that reached for $eval and compared raw text would be green wherever it asserts that a
     pattern does NOT match (tests/launch-door.mjs 6a). */
  for (const read of ["evaluate", "$eval", "$$eval"]) {
    const raw = page[read].bind(page);
    page[read] = async (...a) => fold(await raw(...a));
  }
  page.wordsOnly = true;
  return page;
}

/** ONE STUDIO, LAUNCHED AND WAITED OUT, for the gate that reads the line the shell prints about
 *  its own launch rather than driving a window. `exe` names a packaged app, which takes no repo
 *  argument because its app is inside it; without one this is `electron .` over the tree. `args` are
 *  further command-line switches, judged by the same refusal as the rest of the argument list. */
export function runStudio(who, opts) {
  const o = opts || {};
  if (!o.userDataDir) throw new Error(who + " ran Studio with no userDataDir");
  if (!o.projects) throw new Error(who + " ran Studio with no projects folder");
  realProfileGuard(o.userDataDir);
  fs.mkdirSync(o.userDataDir, { recursive: true });
  const appRoot = o.app || ROOT;
  const guardArgs = o.exe ? [] : ["-r", CRASH_GUARD];
  const appArgs = o.exe ? ["--user-data-dir=" + o.userDataDir]
                        : [appRoot, "--user-data-dir=" + o.userDataDir];
  const args = guardArgs.concat(appArgs, (o.args || []).map(String));
  const env = Object.assign(studioEnv(o.env), { STUDIO_PROJECTS: o.projects });
  refuseOrGo(who, args, env);
  /* A packaged Studio ignores STUDIO_PROJECTS, so its folder is pinned the way a person pins one,
     and only once the door has passed: a refused launch has written nothing. */
  if (o.exe) pinRoot(o.userDataDir, o.projects);
  return spawnSync(o.exe || electronExe(), args, {
    cwd: o.exe ? path.dirname(o.exe) : ROOT,
    encoding: "utf8",
    timeout: o.timeout || 60000,
    env,
  });
}

/** Studio's Electron run AS NODE (ELECTRON_RUN_AS_NODE=1) on `args`, answered as spawnSync answers. This is not a launch of the
 *  shell: no window, no profile, no projects folder and no shell/main.js, only the runtime Studio ships on, for a leg that must
 *  measure that runtime rather than this desk's Node (board 989: tls.setDefaultCACertificates is in Electron's Node 24 and
 *  not in the desk's Node 22). It needs no window wall and no --user-data-dir, and tests/launch-door.mjs counts it among this
 *  door's own sites. `env` is the whole environment the child gets. */
export function electronAsNode(args, opts) {
  const o = opts || {};
  const env = Object.assign({}, o.env || process.env, { ELECTRON_RUN_AS_NODE: "1" });
  return spawnSync(electronExe(), args.map(String), { cwd: ROOT, encoding: "utf8", timeout: o.timeout || 60000, env, windowsHide: true });
}
