/* THE INSTALLER GATE: build it, install it, launch it, uninstall it, and read each one back.
 *
 *     node tests/installer.mjs [--keep]
 *     ETIUDA_STUDIO_SETUP_EXE=<setup.exe> node tests/installer.mjs    drive one built elsewhere
 *
 * WHAT IT IS FOR, and why tests/shell-launch.mjs does not already cover it. That gate launches
 * `electron .` over the working tree: every file is on disk, engine/pinned/ is where the fetch
 * left it, and nothing has been through an allowlist. The installer is a different artefact and
 * it can be wrong in ways the tree cannot: a `files` pattern that leaves ui/ out, a pinned engine
 * that never reached the asar, an appId shared with the engine so that installing one uninstalls
 * the other, an ESM import that resolves on disk and throws inside an asar. Each of those
 * installs and launches and looks exactly like a working copy until somebody clicks something.
 *
 * SO IT IS THE THREE THINGS THAT CAN GO WRONG, in order: INSTALL, LAUNCH, UNINSTALL. The engine's
 * tests/reinstall.js goes further and borrows the REAL profile, because its subject is what
 * survives an uninstall on a customer's machine. This one's subject is the packaging, so it
 * installs into a scratch folder and launches into a scratch profile.
 *
 * BUT THE INSTALLER WRITES THREE THINGS OF THIS DESK'S OWN BY NAME, and this header said until
 * 2026-09-24 that the gate touched nothing but the uninstall key. That was false, and it cost the
 * desk a 112 MB file. What the installer does, whoever runs it:
 *   - it copies itself over %LOCALAPPDATA%\etiuda-studio-updater\installer.exe and then deletes
 *     it (the desk's shell/installer.nsh, customInstall), so a cached installer already there is
 *     destroyed by the install;
 *   - it writes "Etiuda Studio.lnk" on the Desktop and in the Start Menu over any file of that
 *     name, and the uninstall deletes both.
 * Measured on 2026-09-24 in a scratch home planted with all three: this gate went 28 of 28 green
 * and all three planted files were gone. So they are PARKED before the install - renamed, whole,
 * into a folder beside the updater's own - and put back after the uninstall, and 4f holds every
 * file that went aside against its sha256 when it comes back. A parking folder already standing
 * is a run that died holding somebody's files, and the gate refuses rather than park over it.
 *
 * AND WHERE THOSE THREE ARE IS ASKED OF WINDOWS, NOT OF THE ENVIRONMENT (leg 0g). NSIS resolves
 * $LOCALAPPDATA, $DESKTOP and $SMPROGRAMS through the shell, which follows USERPROFILE and
 * IGNORES the APPDATA and LOCALAPPDATA variables: measured 2026-09-24 with a probe built by
 * electron-builder's own makensis. A run "in a scratch profile" made by redirecting those two
 * variables alone would park the scratch copy while the installer destroyed the real one. So the
 * gate parks where Windows says, and refuses where the environment says somewhere else.
 *
 * What it still touches of this desk's own, by design: the per-user uninstall key, which is where
 * Windows puts it and is checked in and out.
 *
 * EVERY LAUNCH IS PUT TO THE ENGINE'S OWN DOOR, E.shellLaunchRefusal of the pinned harness, board
 * item 467, the same door tests/round-trip.mjs uses. Two things make that worth the import in a
 * repository that is not the engine: the door refuses a launch with no --user-data-dir, which is
 * this machine's own profile, and it refuses any launch at all while the engine's reinstall run
 * holds the desk lock. Studio and the engine share one desk, and on 2026-09-17 two labs on that
 * desk wrote the real profile. The refusal is asked for BEFORE the spawn rather than left to the
 * door, because E.refuse() exits the process past this file's teardown and would leave the app
 * installed; leg 3e is the control that the door is live at all.
 *
 * WHAT IS MEASURED AND WHAT IS NOT. File names, byte counts, sha256, registry subkey names, the
 * dominant opaque colour of an icon entry decoded from its PNG, and the packaged app's own
 * machine-readable launch line. No screenshot decides anything: the paint is the count of opaque
 * pixels and distinct colours the shell prints under STUDIO_GATE, read back as numbers.
 *
 * FIVE LEGS ARE CONTROLS, and each exists because the leg above it could be green for free.
 *   0h  the folder comparison is shown to disagree, on an environment that is wrong on purpose.
 *   0f  the icon reader is shown to read the file, by measuring the engine's and getting another.
 *   2b  the asar comparison is shown to be able to disagree, by flipping one byte of a copy.
 *   3e  the row count is shown to be read from the list, by launching on an empty folder.
 *   3f  the door is shown to refuse something, so that every launch above having passed it means
 *       anything at all.
 *
 * AND LEG 2a IS ALSO A RACE DETECTOR, which is what it was worth on the day it was written. It
 * holds the asar against the tree at the moment of the reading, so a build made while another
 * seat was saving a file comes up red with the file named. It did, twice.
 *
 * Exit code is the number of failed checks, 78 where the run reached no verdict at all.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { spawnSync, execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { importCsv } from "../src/import.mjs";
import { json, PROJECT_FILE, DRAFT_FILE } from "../src/publish.mjs";
import { notRunReason, offWindowsNotice } from "./off-windows.mjs";
import { windowWall } from "./window-wall.mjs";
import { SHELL_SHIPPED as SHELL_NAMED, SHELL_KEPT_OUT } from "./shell-shipped.mjs";
import { withoutSigning } from "../tools/sellable.mjs";
import { realProfileGuard, safeListing, safeMove } from "./shell-door.mjs";

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
/* THE ENGINE'S CHECKOUT, where this file reads two things from the engine itself (its icon, and the pinned module's object): ETIUDA_ENGINE_REPO,
   else the one beside this repository's main checkout (a worktree finds the main checkout through git's common directory), else none, and
   the two reads are then left out. */
function engineCheckout() {
  const named = process.env.ETIUDA_ENGINE_REPO;
  if (named && fs.existsSync(named)) return named;
  try {
    const common = path.resolve(ROOT, execFileSync("git", ["rev-parse", "--git-common-dir"], { cwd: ROOT, encoding: "utf8" }).trim());
    const beside = path.join(path.dirname(common), "..", "etiuda");
    if (fs.existsSync(path.join(beside, ".git"))) return beside;
  } catch (e) { /* no git, or no common directory */ }
  return "";
}
const ENGINE = engineCheckout();
const PINNED = path.join(ROOT, "engine", "pinned");
const KEEP = process.argv.indexOf("--keep") > -1;
const UNINSTALL_KEY = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall";
/* THE TEST BUILD, never the shipped one (tools/test-identity.cjs): its own app id, uninstall key, product, shortcut and
   updater names, so nothing this gate installs or uninstalls is keyed by the real Studio's; tests/install-guard.cjs
   refuses while either shipped app is present and compares what they own at the end. */
const G = require("./install-guard.cjs");
const T = require("../tools/test-identity.cjs").TEST.studio;
const PRODUCT = T.productName;
let GUARD = null;
const t0 = Date.now();

let checks = 0, fails = 0, reachedEnd = false;
const check = (ok, what) => { checks++; console.log((ok ? "  ok   " : "  FAIL ") + what); if (!ok) fails++; };
const note = what => console.log("       " + what);
const phase = what => console.log("\n" + what);

const LAB = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-studio-installer-"));
const INSTALL = path.join(LAB, "app");
const PROFILE = path.join(LAB, "user-data");
const PROJECTS = path.join(LAB, "projects");
const EMPTY = path.join(LAB, "no-projects");
const DOCS = path.join(LAB, "documents");

/* ---- the icon reader: an ICO's directory, a PNG entry's pixels, the colour that dominates ----
 *
 * WHY THE INK IS MEASURED RATHER THAN THE FILE NAMED. Both products' app icons are the same
 * bare mark on the same geometry and differ only in their ink, Studio's violet against the
 * engine's blue (Maxim, 2026-09-17 23:02: no Etiuda mark sits on a tile). A file NAME cannot
 * tell the two apart in a taskbar, and ink is a number. */
function icoEntries(buf) {
  const n = buf.readUInt16LE(4), out = [];
  for (let i = 0; i < n; i++) {
    const o = 6 + 16 * i;
    out.push({ w: buf.readUInt8(o) || 256, h: buf.readUInt8(o + 1) || 256,
               len: buf.readUInt32LE(o + 8), off: buf.readUInt32LE(o + 12) });
  }
  return out;
}
function pngPixels(png) {
  if (png.readUInt32BE(0) !== 0x89504e47) throw new Error("not a PNG");
  let p = 8, w = 0, h = 0, depth = 0, colour = 0;
  const idat = [];
  while (p < png.length) {
    const len = png.readUInt32BE(p), type = png.toString("latin1", p + 4, p + 8);
    const data = png.subarray(p + 8, p + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; colour = data[9]; }
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    p += 12 + len;
  }
  if (depth !== 8 || colour !== 6) throw new Error("expected 8-bit RGBA, got depth " + depth + " colour " + colour);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = 4, stride = w * bpp, out = Buffer.alloc(h * stride);
  let q = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[q++];
    const line = raw.subarray(q, q + stride); q += stride;
    const cur = out.subarray(y * stride, y * stride + stride);
    const prev = y ? out.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0, v = line[x];
      let r;
      if (f === 0) r = v; else if (f === 1) r = v + a; else if (f === 2) r = v + b;
      else if (f === 3) r = v + ((a + b) >> 1);
      else { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
             r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      cur[x] = r & 255;
    }
  }
  return { w, h, px: out };
}
/** The commonest fully opaque colour of the largest entry, with how much of the ink it is. */
function icoInk(file) {
  const buf = fs.readFileSync(file);
  const entries = icoEntries(buf);
  const big = entries.slice().sort((a, b) => b.w - a.w)[0];
  const { w, h, px } = pngPixels(buf.subarray(big.off, big.off + big.len));
  const tally = new Map();
  let opaque = 0;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 250) continue;
    opaque++;
    const key = (px[i] << 16) | (px[i + 1] << 8) | px[i + 2];
    tally.set(key, (tally.get(key) || 0) + 1);
  }
  let best = -1, at = -1;
  for (const [k, v] of tally) if (v > best) { best = v; at = k; }
  return { hex: at < 0 ? "none" : "#" + at.toString(16).padStart(6, "0"),
           count: best, opaque, whole: w * h, sizes: entries.map(e => e.w) };
}

/* ---- the lab -------------------------------------------------------------------------------- */

const sha = f => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const ps = script => String(execFileSync("powershell.exe",
  ["-NoProfile", "-NonInteractive", "-Command", script], { encoding: "utf8", timeout: 120000 }));

/** The per-user uninstall entries, as a map of subkey name to display name. */
function uninstallKeys() {
  const out = ps("if (Test-Path '" + UNINSTALL_KEY + "') { Get-ChildItem '" + UNINSTALL_KEY
    + "' | ForEach-Object { $d = (Get-ItemProperty -Path $_.PSPath -ErrorAction SilentlyContinue).DisplayName;"
    + " Write-Output ($_.PSChildName + [char]9 + $d) } }");
  const map = new Map();
  for (const line of out.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const at = line.indexOf("\t");
    map.set(at < 0 ? line.trim() : line.slice(0, at), at < 0 ? "" : line.slice(at + 1).trim());
  }
  return map;
}

function pile(name, seed, rows) {
  const out = path.join(LAB, "piles", name);
  const r = spawnSync(process.execPath, ["tools/fixtures/generate.mjs", "--seed", String(seed),
    "--rows", String(rows), "--out", out], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) throw new Error("the generator refused: " + (r.stderr || r.stdout));
  return path.join(out, "macros.csv");
}

async function project(root, folder, csv, id, name) {
  const dir = path.join(root, folder);
  fs.mkdirSync(dir, { recursive: true });
  const made = await importCsv({ file: csv, id, name });
  fs.writeFileSync(path.join(dir, DRAFT_FILE), json(made.catalog), "utf8");
  fs.writeFileSync(path.join(dir, PROJECT_FILE),
    json({ id: made.catalog.id, name, rev: 0, edition: "", draft: DRAFT_FILE, folder: null }), "utf8");
  return dir;
}

/** One launch of the INSTALLED app, through the engine's door, offscreen, into the scratch
 *  profile. Returns the parsed result line, the exit code and whatever went to stderr. */
function launch(E, exe, projects, userData, ms) {
  if (typeof realProfileGuard === "function") realProfileGuard(userData);
  const args = [
    "--user-data-dir=" + userData,
  ];
  const env = Object.assign({}, process.env, {
    STUDIO_GATE: "1",
    STUDIO_TEST_OFFSCREEN: "1",
    STUDIO_PROJECTS: projects,
    /* The door asks what confines the catalog folder. Studio never reads one - STUDIO_PROJECTS
       is explicit above and leg 3c reads back exactly what was planted there - but the door
       cannot know that, and a launcher that argued its way around a guard is a launcher the
       guard no longer covers. So it is answered: a Documents folder of the lab's own. */
    ETIUDA_TEST_DOCUMENTS: DOCS,
    ELECTRON_ENABLE_LOGGING: "",
  });
  const refusal = E.shellLaunchRefusal("Studio installer gate", args, { env });
  if (refusal) return { refused: refusal, code: null, out: {}, line: "", stderr: "", stdout: "" };
  /* The installed Studio ignores STUDIO_PROJECTS, so the folder is pinned in the profile's own store,
     and only once the door has passed: a refused launch has written nothing. */
  let store = {};
  try { store = JSON.parse(fs.readFileSync(path.join(userData, "studio.json"), "utf8")) || {}; } catch (e) { store = {}; }
  fs.mkdirSync(userData, { recursive: true });
  fs.writeFileSync(path.join(userData, "studio.json"), JSON.stringify(Object.assign(store, { root: projects })));
  const r = spawnSync(exe, args, { cwd: path.dirname(exe), encoding: "utf8",
                                   timeout: ms || 90000, env });
  const stdout = String(r.stdout || "");
  const line = stdout.split(/\r?\n/).find(l => l.startsWith("studio-launch "));
  const out = {};
  if (line) for (const bit of line.slice("studio-launch ".length).trim().split(/\s+/)) {
    const at = bit.indexOf("=");
    out[bit.slice(0, at)] = bit.slice(at + 1);
  }
  return { refused: null, code: r.status, out, line: line || "", stdout,
           stderr: String(r.stderr || "") };
}

/* THE TEARDOWN UNINSTALLS FIRST, and that is not tidiness. Measured 2026-09-17: a run that threw
 * at leg 2e never reached phase 4, the lab folder was deleted with the installed app inside it,
 * and the per-user uninstall key stayed in the registry pointing at files that no longer existed.
 * The next run then saw the key already there, counted no new one, and went red at 1c for a
 * reason that had nothing to do with the installer it was testing. A gate that dirties the
 * machine on the way out fails the run after it, which is the worst kind of red.
 *
 * The registry sweep only touches a key whose DisplayName is this product AND whose
 * InstallLocation is inside this run's own lab, so a real Studio installed on this desk is never
 * a candidate. Sync throughout, because process.on("exit") is where this has to work. */
function uninstallLeftovers() {
  const uninst = fs.existsSync(INSTALL)
    ? fs.readdirSync(INSTALL).find(f => /^Uninstall .*\.exe$/i.test(f)) : null;
  if (uninst) {
    try {
      spawnSync(path.join(INSTALL, uninst), ["/S"], { encoding: "utf8", timeout: 300000 });
      const by = Date.now() + 60000;
      while (Date.now() < by && fs.existsSync(path.join(INSTALL, PRODUCT + ".exe")))
        execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "Start-Sleep -Milliseconds 500"]);
      console.log("teardown: ran " + uninst);
    } catch (e) { console.log("teardown: the uninstaller would not run: " + (e && e.message)); }
  }
  try {
    const lab = LAB.split("\\").join("\\\\").split("'").join("''");
    const swept = String(execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command",
      "$n=0; Get-ChildItem '" + UNINSTALL_KEY + "' -ErrorAction SilentlyContinue | ForEach-Object {"
      + " $p = Get-ItemProperty -Path $_.PSPath -ErrorAction SilentlyContinue;"
      + " if ($p.DisplayName -eq '" + PRODUCT + "' -and $p.InstallLocation -and"
      + " $p.InstallLocation.StartsWith('" + lab + "')) { Remove-Item $_.PSPath -Recurse -Force; $n++ } };"
      + " Write-Output $n"], { encoding: "utf8", timeout: 60000 })).trim();
    if (swept && swept !== "0") console.log("teardown: swept " + swept + " stale uninstall key(s) of this lab");
  } catch (e) { console.log("teardown: the registry sweep failed: " + (e && e.message)); }
}

/* ---- the desk's own places the installer writes by name, and parking them ----------------------
 *
 * THE SHELL'S ANSWER, because it is the installer's. [Environment]::GetFolderPath and NSIS agreed
 * on all four folders under all three environments measured on 2026-09-24: the real one, APPDATA
 * and LOCALAPPDATA redirected (both answer the REAL folders), and USERPROFILE redirected (both
 * answer the redirected home). `env` is a parameter so that leg 0h can ask the same question of an
 * environment that is wrong on purpose, which spawns PowerShell and nothing else. */
const SHELL_NAMES = ["LocalApplicationData", "ApplicationData", "Desktop", "Programs"];
function shellFolders(env) {
  const out = String(execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command",
    "foreach ($n in '" + SHELL_NAMES.join("','") + "') { $n + [char]9 + [Environment]::GetFolderPath($n) }"],
    { encoding: "utf8", timeout: 60000, env }));
  const map = {};
  for (const line of out.split(/\r?\n/)) {
    const at = line.indexOf("\t");
    if (at > 0) map[line.slice(0, at)] = line.slice(at + 1).trim();
  }
  return map;
}
const samePath = (a, b) => !!a && !!b && path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();
/** What Windows answers, and every way the environment disagrees with it. A variable that is not
 *  set is not a disagreement: nothing then claims the run is anywhere else. */
function placesOf(env) {
  const shell = shellFolders(env);
  const said = [];
  for (const n of SHELL_NAMES) if (!shell[n]) said.push("Windows gave no " + n + " folder");
  for (const [v, n] of [["LOCALAPPDATA", "LocalApplicationData"], ["APPDATA", "ApplicationData"]])
    if (env[v] && shell[n] && !samePath(env[v], shell[n]))
      said.push(v + " is " + env[v] + " but Windows, and so the installer, answers " + shell[n]);
  return { shell, said };
}

/* THE SHORTCUT NAME IS THE INSTALLER'S OWN, read out of the build config as the engine's loop
   reads it, so a rename there cannot leave this gate parking a name the installer no longer
   writes. */
const SHORTCUT = require("../tools/electron-builder-test.cjs").nsis.shortcutName + ".lnk";
const PARK_NAME = "etiuda-studio-installer-gate-parked";
let PARK = "";
let parked = null;
let restoredRows = null;

/** Every file under `p` (or `p` itself) by relative name, with its sha256. */
function digest(p) {
  const out = {};
  const s = fs.statSync(p);
  if (s.isFile()) { out[""] = sha(p); return out; }
  (function walk(d) {
    for (const n of safeListing(d)) {
      const q = path.join(d, n);
      if (fs.statSync(q).isDirectory()) { out[path.relative(p, q) + path.sep] = "dir"; walk(q); }
      else out[path.relative(p, q)] = sha(q);
    }
  })(p);
  return out;
}
const sameDigest = (a, b) => JSON.stringify(Object.keys(a).sort().map(k => [k, a[k]]))
  === JSON.stringify(Object.keys(b).sort().map(k => [k, b[k]]));

/** Renames each place aside, whole. Returns a refusal sentence, or "" having parked. `parked` is
 *  set BEFORE the first rename, so an exit between two renames still puts the first one back. */
function park(places) {
  const local = places.shell.LocalApplicationData;
  realProfileGuard(local);
  PARK = path.join(local, PARK_NAME);
  realProfileGuard(PARK);
  if (fs.existsSync(PARK))
    return "a parking folder is already standing at " + PARK + ": a run of this gate died holding"
      + " this desk's files there. Put them back by hand (" + safeListing(PARK).join(", ")
      + ") and remove the empty folder; this run parks nothing over them";
  const places3 = [
    { what: "the updater's cache", tag: "updater", from: path.join(local, T.packageName + "-updater") },
    { what: "the Desktop shortcut", tag: "desktop", from: path.join(places.shell.Desktop, SHORTCUT) },
    { what: "the Start Menu shortcut", tag: "start-menu", from: path.join(places.shell.Programs, SHORTCUT) },
  ];
  parked = { items: [] };
  for (const it of places3) {
    realProfileGuard(it.from);
    if (!fs.existsSync(it.from)) continue;
    if (!fs.existsSync(PARK)) fs.mkdirSync(PARK);
    const files = digest(it.from);
    const to = path.join(PARK, it.tag + "-" + path.basename(it.from));
    realProfileGuard(to);
    safeMove(it.from, to);
    parked.items.push(Object.assign({}, it, { to, files }));
  }
  return "";
}

/* PUTS BACK WHAT park() TOOK, AND DELETES NOTHING. Called only after the uninstall, since the
   uninstall deletes the shortcuts by name. Whatever stands at a parked place now is this run's
   own (the installer's copy, a shortcut its uninstall missed) and is renamed into the lab, which
   is this run's scratch and goes with it. Where any step fails the desk's file STAYS PARKED and
   the row says why: a file left in the parking folder is found; a file removed is not. Idempotent,
   because the exit handler calls it too. */
function restore() {
  if (!parked || restoredRows) return restoredRows || [];
  restoredRows = [];
  for (const it of parked.items) {
    realProfileGuard(it.from);
    realProfileGuard(it.to);
    const row = { what: it.what, from: it.from, back: false, same: false, runsOwn: "", why: "" };
    try {
      if (fs.existsSync(it.from)) {
        const aside = path.join(LAB, "left-by-this-run", it.tag);
        fs.mkdirSync(path.dirname(aside), { recursive: true });
        safeMove(it.from, aside);
        row.runsOwn = aside;
      }
      safeMove(it.to, it.from);
      row.back = true;
      row.same = sameDigest(digest(it.from), it.files);
    } catch (e) { row.why = String(e && e.message || e); }
    restoredRows.push(row);
  }
  /* rmdir, never a recursive remove: it succeeds only on an empty folder, which is the proof that
     everything went back. */
  if (PARK && fs.existsSync(PARK)) try { fs.rmdirSync(PARK); } catch (e) { /* named below and by 4f */ }
  if (PARK && fs.existsSync(PARK))
    console.log("teardown: STILL PARKED at " + PARK + ": " + fs.readdirSync(PARK).join(", ")
      + " - this desk's own files, put back by hand");
  return restoredRows;
}

let guardSaid = false;
function guardEnd() { if (guardSaid || !GUARD) return null; guardSaid = true; return G.guardEnd(GUARD).diffs; }
function teardown() {
  uninstallLeftovers();
  restore();
  if (KEEP) { console.log("\n--keep: the lab stands at " + LAB); return; }
  try { fs.rmSync(LAB, { recursive: true, force: true, maxRetries: 5 }); } catch (e) { /* the app may still hold it */ }
  console.log("teardown: the lab at " + LAB + (fs.existsSync(LAB) ? " is STILL THERE" : " is gone"));
}
/* E.refuse() and an uncaught throw both leave by routes a finally does not cover. */
process.on("exit", () => {
  if (!reachedEnd) teardown();
  /* A run that left by a refusal or a throw past the end still says what the real installs own now. */
  const diffs = guardEnd();
  if (diffs && diffs.length) console.log("  FAIL 4g what the real installs own CHANGED during this run: " + diffs.map(G.diffLine).join("; "));
});

/* ---- the run --------------------------------------------------------------------------------- */

async function main() {
  /* WINDOWS BY CONSTRUCTION, AND IT SAYS SO RATHER THAN FAILING ON THE PLATFORM. Board item 629.
     This gate builds an NSIS installer, reads a per-user uninstall key out of the registry with
     PowerShell, and compares an .ico against two absolute paths on this desk. None of that is a
     port waiting to be written; it is the artefact. Off Windows the honest answer is NOT RUN,
     which is neither a pass nor a failure, and the count of it is declared on the #counts line so
     that a run which looked at nothing cannot be read as a run that looked and was happy.

     THE CHECK IS FIRST, before the lab is used and before anything is spawned, and that ordering
     is the whole of it: a patched process.platform does NOT reach a child, so every Windows act
     below is invisible to it. Measured on 2026-09-20 at 3d05b36 - with the platform patched to
     linux and this check absent, the gate built a 112,074,540-byte installer, installed it,
     launched it, uninstalled it and printed `passed 26 check(s) in 72 s`, because electron-builder
     and PowerShell are children and children are not patched. A check placed any later than this
     line would therefore prove nothing at all. */
  const why = notRunReason("installer", "it builds an NSIS setup.exe, reads the per-user uninstall"
    + " key with PowerShell and measures two .ico files on this desk, none of which exists here");
  if (why) {
    reachedEnd = true;
    console.log("  " + why);
    offWindowsNotice().forEach(l => console.log("       " + l));
    try { fs.rmSync(LAB, { recursive: true, force: true }); } catch (e) { /* never used */ }
    console.log("\n#counts checks=0 failures=0 notRun=1 platform=" + process.platform);
    console.log("installer  NOT RUN on " + process.platform + ", 0 check(s)");
    process.exit(0);
  }
  /* THE INSTALL GUARD, before the window wall, the build or anything parked or installed. */
  phase("0. the install guard: what the real installs own, read before anything");
  let guardNo = [];
  try { GUARD = G.guardStart({ env: process.env }); guardNo = GUARD.refusals.slice(); }
  catch (e) { guardNo = ["the install guard could not read what the real install owns: " + e.message]; }
  const givenExe = process.env.ETIUDA_STUDIO_SETUP_EXE || "";
  if (givenExe) {
    const no = !fs.existsSync(givenExe) ? "names no file" : G.setupRefusal(G.setupIdentity(givenExe), "studio");
    if (no) guardNo.push("ETIUDA_STUDIO_SETUP_EXE refused: " + no);
  }
  if (GUARD) note("the install guard reads " + GUARD.reads);
  if (GUARD && GUARD.flagged) note(G.ACCOUNT_FLAG + " names this account, " + GUARD.account.said + ": presence is waived, the comparison is not");
  if (guardNo.length) {
    for (const r of guardNo) console.log("  REFUSED " + r);
    console.log("  nothing was built, parked or installed");
    reachedEnd = true; guardSaid = true; teardown(); process.exit(78);
  }
  /* After NOT RUN, which the Linux job reads, and before the build, which costs minutes. */
  windowWall("tests/installer.mjs");
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  fs.mkdirSync(DOCS, { recursive: true });
  fs.mkdirSync(PROJECTS, { recursive: true });
  fs.mkdirSync(EMPTY, { recursive: true });

  /* ---- 0. where the installer will write, before anything else ------------------------------ */
  phase("0. where the installer writes on this desk, asked of Windows");
  const places = placesOf(process.env);
  check(places.said.length === 0,
    "0g the environment and Windows agree on where the installer writes: LocalApplicationData "
    + places.shell.LocalApplicationData + ", Desktop " + places.shell.Desktop + ", Programs "
    + places.shell.Programs + (places.said.length ? "; " + places.said.join("; ") : ""));
  /* THE CONTROL FOR 0g, and nothing is installed or moved by it: the same comparison of an
     environment whose APPDATA and LOCALAPPDATA name a folder of the lab's own while USERPROFILE
     is left alone, which is exactly the "scratch profile" that is not one. A comparison that
     never disagreed would pass 0g on every desk. */
  const wrong = Object.assign({}, process.env, { APPDATA: path.join(LAB, "elsewhere", "Roaming"),
                                                 LOCALAPPDATA: path.join(LAB, "elsewhere", "Local") });
  const control = placesOf(wrong);
  check(control.said.length === 2,
    "0h control: with APPDATA and LOCALAPPDATA pointed into the lab and USERPROFILE not, Windows"
    + " still answers " + control.shell.LocalApplicationData + " and the comparison says so "
    + control.said.length + " time(s) of 2");
  if (places.said.length || control.said.length !== 2) {
    console.log("  STOP: nothing was installed and nothing was parked. Redirect USERPROFILE, with"
      + " APPDATA and LOCALAPPDATA under it, to run this gate in a scratch home");
    reachedEnd = true; teardown(); process.exit(78);
  }

  /* ---- 0. the artefact ---------------------------------------------------------------------- */
  phase("0. the installer, and the mark on it");

  let setup = process.env.ETIUDA_STUDIO_SETUP_EXE || "";
  if (!setup) {
    note("no ETIUDA_STUDIO_SETUP_EXE: building the test build with tools/package.mjs --test-identity");
    const built = spawnSync(process.execPath, ["tools/package.mjs", "--test-identity"], { cwd: ROOT, encoding: "utf8", env: withoutSigning() });
    process.stdout.write(built.stdout || "");
    process.stderr.write(built.stderr || "");
    const said = String(built.stdout || "").split(/\r?\n/)
      .find(l => l.startsWith("npm run package: ") && /-setup\.exe/i.test(l));
    if (said) setup = said.slice("npm run package: ".length).split("  ")[0];
  }
  check(!!setup && fs.existsSync(setup), "0a there is an installer to drive: " + (setup || "none"));
  if (!setup || !fs.existsSync(setup)) { reachedEnd = true; teardown(); process.exit(fails ? capped(fails) : 78); }
  const setupId = G.setupIdentity(setup), setupNo = G.setupRefusal(setupId, "studio");
  check(!setupNo, "0i the installer is the test build, read from its own version resource before it runs: "
    + (setupNo || setupId.productName + " / " + setupId.appId));
  if (setupNo) { console.log("  nothing was parked or installed"); reachedEnd = true; teardown(); process.exit(78); }

  const want = T.packageName + "-" + pkg.version + "-setup.exe";
  check(path.basename(setup).toLowerCase() === want.toLowerCase(),
    "0b it is named for the version in package.json: " + path.basename(setup) + " against " + want);
  const setupSize = fs.statSync(setup).size;
  check(setupSize > 40 * 1024 * 1024,
    "0c it is " + (setupSize / 1048576).toFixed(1) + " MB, over the 40 MB an Electron app cannot be under");

  const icon = path.join(ROOT, "packaging", "etiuda-studio.ico");
  const ink = icoInk(icon);
  /* THE CONTROL FOR THE READER. A measurement that answers violet is worth nothing until it has
     answered something else from another file: the engine's icon, same reader, must be blue. */
  const engineIcon = ENGINE ? path.join(ENGINE, "shell", "etiuda.ico") : "";
  if (engineIcon && fs.existsSync(engineIcon)) {
    const other = icoInk(engineIcon);
    check(other.hex !== ink.hex, "0f control: the same reader over the engine's shell/etiuda.ico answers "
      + other.hex + ", not " + ink.hex + ", so 0e reads the file rather than a constant");
  } else note("0f not run: no engine checkout at " + engineIcon);

  /* ---- 1. install --------------------------------------------------------------------------- */
  phase("1. install, silently, per user, into a folder of the lab's own");

  /* THE DESK'S OWN, ASIDE FIRST. Before the install, because the install is what overwrites the
     cached installer and the two shortcuts; put back after the uninstall, and read back at 4f. */
  const refusedPark = park(places);
  if (refusedPark) {
    check(false, "1p the desk's own files where the installer writes are parked aside: REFUSED, " + refusedPark);
    reachedEnd = true; teardown(); process.exit(78);
  }
  note("the desk's own files where the installer writes by name are parked aside into "
    + PARK + ": " + (parked.items.length ? parked.items.map(it => it.what + " ("
      + Object.keys(it.files).filter(k => it.files[k] !== "dir").length + " file(s))").join(", ")
      : "this desk had none of the three"));

  const before = uninstallKeys();
  /* /currentuser, because a per-machine copy on a desk that has one makes /S exit 199 and
     install nothing: NSIS picks that context and needs an elevation it cannot ask for.
     /D must be LAST and unquoted, which is NSIS's rule and not a style. */
  const inst = spawnSync(setup, ["/S", "/currentuser", "/D=" + INSTALL],
    { encoding: "utf8", timeout: 300000 });
  check(inst.status === 0, "1a setup.exe /S /currentuser exited " + inst.status
    + (inst.status === 0 ? "" : "; " + String(inst.stderr || inst.stdout || "").split("\n")[0]));

  const exe = path.join(INSTALL, PRODUCT + ".exe");
  const asarAt = path.join(INSTALL, "resources", "app.asar");
  check(fs.existsSync(exe) && fs.existsSync(asarAt),
    "1b the install folder holds " + PRODUCT + ".exe and resources/app.asar");
  if (!fs.existsSync(exe)) { reachedEnd = true; teardown(); process.exit(fails ? capped(fails) : 78); }

  /* RUNNING AN INSTALLER MUST NOT REWRITE IT, and this leg is here because on 2026-09-17 the
     setup.exe grew 1892 bytes and took a new mtime across the first run of this gate
     (111977462 at 12:45, 111979354 at 12:47:18, which is the second the install started). An
     artefact that changes after it is built cannot be hashed, published or compared, so the
     question is asked of every run rather than argued about once. */
  const setupNow = fs.statSync(setup);
  check(setupNow.size === setupSize, "1d running it did not rewrite it: " + setupNow.size
    + " bytes against " + setupSize + " before the install"
    + (setupNow.size === setupSize ? "" : ", a change of " + (setupNow.size - setupSize)));

  const after = uninstallKeys();
  const gained = [...after.keys()].filter(k => !before.has(k));
  /* A DIRTY MACHINE AND A FAILED REGISTRATION LOOK THE SAME from the count alone: both give no
     new key. They are told apart before the verdict, because the wrong one sends the reader to
     the installer when the fault is a previous run's. */
  const already = [...before.keys()].filter(k => before.get(k) === PRODUCT);
  if (already.length) note("a " + PRODUCT + " uninstall key was ALREADY registered before this run: "
    + already.join(", ") + " - a previous run did not finish; nothing below can gain one");
  check(gained.length === 1 && after.get(gained[0]) === PRODUCT,
    "1c exactly one per-user uninstall key appeared and it is " + PRODUCT + ": "
    + (gained.length ? gained.map(k => k + " (" + after.get(k) + ")").join(", ")
       : already.length ? "none, and " + already.length + " was there before the run" : "none")
    + ", from " + before.size + " before");
  const key = gained[0] || "";

  /* THE DESK'S NSIS ADDITIONS REACHED THIS INSTALLER (sense pass item 41), read back from what
     an install leaves: the folder on the uninstall key, and no copy of the setup in the
     updater's cache, which electron-builder's own script always writes. */
  const location = key ? ps("(Get-ItemProperty -Path '" + UNINSTALL_KEY + "\\" + key
    + "' -ErrorAction SilentlyContinue).InstallLocation").trim() : "";
  check(!!location && path.resolve(location).toLowerCase() === path.resolve(INSTALL).toLowerCase(),
    "1e the uninstall key names the install folder as InstallLocation: " + JSON.stringify(location));
  /* Where Windows says, which is where the installer wrote it (0g). The desk's own folder is
     parked, so the whole folder must be gone too: customInstall removes it when it is empty, and
     after the park it holds nothing but the copy the install made. */
  const cacheDir = path.join(places.shell.LocalApplicationData, T.packageName + "-updater");
  const cached = path.join(cacheDir, "installer.exe");
  check(!fs.existsSync(cached) && !fs.existsSync(cacheDir),
    "1f and no copy of the setup is left in the updater's cache at " + cached
    + ", and the folder is " + (fs.existsSync(cacheDir) ? "STILL THERE" : "gone"));

  /* ---- 2. what actually went into the asar -------------------------------------------------- */
  phase("2. the asar, against the tree it was made from");

  const asar = require("@electron/asar");
  const listed = asar.listPackage(asarAt).map(p => p.replace(/\\/g, "/").replace(/^\//, ""));
  const treeUi = fs.readdirSync(path.join(ROOT, "ui")).filter(f =>
    fs.statSync(path.join(ROOT, "ui", f)).isFile()).sort();
  const asarUi = listed.filter(p => p.indexOf("ui/") === 0 && p.indexOf("/", 3) < 0)
    .map(p => p.slice(3)).sort();
  const sameNames = treeUi.join("|") === asarUi.join("|");
  const digests = [];
  let sameBytes = sameNames;
  for (const f of treeUi) {
    const inTree = crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, "ui", f))).digest("hex");
    let inAsar = "";
    try { inAsar = crypto.createHash("sha256").update(asar.extractFile(asarAt, "ui" + path.sep + f)).digest("hex"); }
    catch (e) { inAsar = "missing"; }
    digests.push(f + " " + inTree.slice(0, 12) + " / " + inAsar.slice(0, 12));
    if (inTree !== inAsar) sameBytes = false;
  }
  check(sameBytes, "2a the asar's ui equals the tree's, " + treeUi.length
    + " file(s), sha256 each: " + digests.join("; "));

  /* THE CONTROL. 2a is an equality, and an equality between two readings of the same thing is
     green whatever it reads. Flip one byte of a copy of the first ui file and the same
     comparison must disagree; nothing in the asar or the tree is touched. */
  const first = treeUi[0];
  const copy = Buffer.from(fs.readFileSync(path.join(ROOT, "ui", first)));
  copy[Math.floor(copy.length / 2)] = copy[Math.floor(copy.length / 2)] ^ 1;
  const twin = crypto.createHash("sha256").update(copy).digest("hex");
  const real = crypto.createHash("sha256").update(asar.extractFile(asarAt, "ui" + path.sep + first)).digest("hex");
  check(twin !== real, "2b control: one byte flipped in a copy of ui/" + first
    + " gives " + twin.slice(0, 12) + " against the asar's " + real.slice(0, 12)
    + ", so 2a can disagree");

  const strays = listed.filter(p => p.indexOf("tests/") === 0 || p.indexOf("tools/") === 0
    || /(^|\/)scratch\//.test(p) || (/\.ec$/i.test(p) && p !== "engine/pinned/shell/sample-catalog.ec"));
  check(strays.length === 0, "2c the allowlist held: no tests/, tools/, scratch/ or .ec entry in the asar ("
    + listed.length + " entries, " + strays.length + " stray)");

  const pinFile = fs.readFileSync(path.join(ROOT, "tools", "engine-pin"), "utf8");
  const pin = (pinFile.match(/ENGINE_PIN=([0-9a-f]{40})/) || [])[1] || "";
  /* AN ABSENCE IS NOT READ OFF A THROW. @electron/asar's extractFile wants path.sep separators
     and answers "was not found in this archive" for a forward-slash path deeper than two
     segments, for a file that is in the listing; that is how this leg first reported the pin
     marker missing when it was there. So the listing is asked first, and the two cases - not
     shipped, and shipped but unreadable - are told apart in the sentence. */
  const marker = "engine/pinned/.engine-pin.json";
  const inListing = listed.indexOf(marker) > -1;
  let shipped = "";
  if (!inListing) shipped = "not in the asar at all";
  else try { shipped = String(JSON.parse(asar.extractFile(asarAt,
    marker.split("/").join(path.sep)).toString("utf8")).pin || "no pin field"); }
  catch (e) { shipped = "listed but unreadable: " + e.message; }
  check(!!pin && shipped === pin,
    "2d the shipped app says which engine it carries: " + marker + " says "
    + (shipped.length === 40 ? shipped.slice(0, 12) : shipped)
    + ", tools/engine-pin says " + pin.slice(0, 12));
  /* AND THE BYTES ARE THAT COMMIT'S, not merely labelled with it. One module of the pinned tree
     is held against the engine's own object database, which is where engine-fetch took it from;
     a marker on its own is a claim, and a claim is what this file exists not to accept. */
  const witness = "tools/catalog-v2/format.mjs";
  const inAsarWitness = crypto.createHash("sha256")
    .update(asar.extractFile(asarAt, ("engine/pinned/" + witness).split("/").join(path.sep))).digest("hex");
  let fromEngine = "";
  try {
    if (ENGINE) fromEngine = crypto.createHash("sha256").update(execFileSync("git",
      ["cat-file", "blob", pin + ":" + witness],
      { cwd: ENGINE, maxBuffer: 64 * 1024 * 1024 })).digest("hex");
  } catch (e) { fromEngine = ""; }
  if (fromEngine) check(inAsarWitness === fromEngine,
    "2e and they are that commit's bytes: " + witness + " in the asar is " + inAsarWitness.slice(0, 12)
    + ", the engine's blob at " + pin.slice(0, 12) + " is " + fromEngine.slice(0, 12));
  else note("2e not run: no engine object database to read " + pin.slice(0, 12) + " from");
  /* The shell's declarations the product runs ship as the fetch cut them, and the shell itself does not
     (board 865): tests/no-model.mjs 9 proves it on a model of the allowlist, and this on the asar itself. */
  const slicesAt = "engine/pinned/.shell-slices.js";
  let slicesSame = false;
  try { slicesSame = listed.indexOf(slicesAt) > -1 && Buffer.compare(asar.extractFile(asarAt, slicesAt.split("/").join(path.sep)),
    fs.readFileSync(path.join(ROOT, slicesAt))) === 0; } catch (e) { slicesSame = false; }
  /* Files only: the asar's listing names each folder too (shell/folder, shell/policy and the rest), and a folder is
     not a file Studio reads, so one with an entry under it is left out of the count. */
  const shellIn = listed.filter(p => p.indexOf("engine/pinned/shell/") === 0
    && !listed.some(q => q.indexOf(p + "/") === 0));
  /* WHAT OF THE PINNED SHELL SHIPS is what Studio reads, by name, each beside its reader in tests/shell-shipped.mjs
     (the test architect's read, 2026-11-03 12:23), which tests/shell-readers.mjs holds without a window; the desk's
     shell/main.js and installer.nsh stay out by name (no-model 7, 8). A file the pin grows ships only once it is read
     and named there. */
  const SHELL_SHIPPED = SHELL_NAMED.map((s) => s.file).sort();
  const keptOut = SHELL_KEPT_OUT.every((f) => shellIn.indexOf(f) < 0);
  check(slicesSame && keptOut && JSON.stringify(shellIn.sort()) === JSON.stringify(SHELL_SHIPPED), "2f the asar carries " + slicesAt + " byte for byte as the tree's"
    + (slicesSame ? "" : " (NOT SO)") + ", the desk's shell/main.js and installer.nsh stay out" + (keptOut ? "" : " (NOT SO)")
    + ", and of the pinned shell exactly the " + SHELL_SHIPPED.length + " files Studio reads: " + JSON.stringify(shellIn));

  /* ---- 3. launch ---------------------------------------------------------------------------- */
  phase("3. the installed app launches, paints and shows the list");

  const doorAt = path.join(PINNED, "tests", "engine.js");
  if (!fs.existsSync(doorAt)) throw new Error("no pinned harness at " + doorAt + "; run: node tools/engine-fetch.mjs");
  const E = require(doorAt);
  if (typeof E.shellLaunch !== "function")
    throw new Error("the pinned harness has no shellLaunch; the pin is behind the engine's 698eb73");

  const csvA = pile("a", 23, 14), csvB = pile("b", 24, 9);
  await project(PROJECTS, "retail", csvA, "gate-retail", "Retail, EN and PL");
  await project(PROJECTS, "travel", csvB, "gate-travel", "Travel desk");

  const t = Date.now();
  const one = launch(E, exe, PROJECTS, PROFILE);
  const ms = Date.now() - t;
  if (one.refused) note("the door refused: " + one.refused.join(" | "));
  check(!one.refused && one.code === 0 && one.out.ok === "1",
    "3a the installed app launched with the engine door consulted first, painted and closed by itself, exit "
    + one.code + ", ok=" + (one.out.ok || "none") + ", in " + (ms / 1000).toFixed(1) + " s"
    + (one.code === 0 ? "" : "; " + one.stderr.split("\n").filter(Boolean).slice(0, 2).join(" | ")));

  const w = Number(one.out.width), h = Number(one.out.height), painted = Number(one.out.painted);
  check(w > 0 && h > 0 && painted > w * h * 0.5,
    "3b " + painted + " of " + (w * h) + " pixels of the " + w + "x" + h
    + " capture are opaque, over the half a window that merely loaded would not reach");
  check(Number(one.out.distinct) > 8, "3c the window holds " + one.out.distinct
    + " distinct colours (capped at 4096), so it is not one flat fill");

  const planted = fs.readdirSync(PROJECTS).length;
  check(Number(one.out.rows) === planted + 1, "3d the list shows the " + planted
    + " projects planted in the lab, and its header (" + one.out.rows + " rows)");

  /* THE CONTROL FOR 3d. An empty folder must still paint - an empty list is a screen, the block
     naming the folder - and its row count must fall to nought. Without this, a constant would
     pass 3d. */
  const two = launch(E, exe, EMPTY, path.join(LAB, "user-data-empty"));
  if (two.refused) note("the door refused: " + two.refused.join(" | "));
  check(!two.refused && two.code === 0 && two.out.ok === "1" && Number(two.out.rows) === 0
        && two.out.none === "1",
    "3e control: the same app on an empty projects folder paints the empty folder's block, "
    + two.out.rows + " row(s) against " + one.out.rows);

  /* THE CONTROL FOR THE DOOR. Every launch above asked the door first, so a door that answered
     null to everything would be invisible: it would look exactly like a door that approved. Ask
     it the one thing it exists to refuse - a launch with no --user-data-dir, which is this
     machine's own profile - and nothing is spawned either way. */
  const guard = E.shellLaunchRefusal("Studio installer gate control", [], { env: process.env });
  check(Array.isArray(guard) && /user-data-dir/.test(guard.join(" ")),
    "3f control: the door refuses a launch with no --user-data-dir, so the door is live: "
    + (guard ? guard[0] : "IT APPROVED IT"));

  /* ---- 4. uninstall ------------------------------------------------------------------------- */
  phase("4. uninstall, and what is left behind");

  /* WHAT THE PERSON'S OWN SIDE LOOKS LIKE BEFORE THE UNINSTALL. Listed rather than asserted file
     by file: the point is that the uninstaller's reach stops at the install folder, so the
     reading is the whole profile before against the whole profile after. */
  const profileBefore = fs.existsSync(PROFILE)
    ? fs.readdirSync(PROFILE).sort().join(",") : "";

  const uninst = fs.readdirSync(INSTALL).find(f => /^Uninstall .*\.exe$/i.test(f));
  check(!!uninst, "4a the install folder holds an uninstaller: " + (uninst || "none"));
  if (uninst) {
    const r = spawnSync(path.join(INSTALL, uninst), ["/S"], { encoding: "utf8", timeout: 300000 });
    /* NSIS copies itself to temp and the parent returns at once, so the exit code is not the
       answer: the answer is the folder going away, polled. */
    const by = Date.now() + 90000;
    while (Date.now() < by && fs.existsSync(exe)) execFileSync("powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", "Start-Sleep -Milliseconds 500"]);
    check(r.status === 0 || r.status === null, "4b the uninstaller ran, exit " + r.status);
    check(!fs.existsSync(exe), "4c " + PRODUCT + ".exe is gone from the install folder"
      + (fs.existsSync(INSTALL) ? " (the folder itself is still there: "
         + fs.readdirSync(INSTALL).length + " entr(ies))" : " and so is the folder"));
    const left = uninstallKeys();
    check(!key || !left.has(key), "4d the per-user uninstall key " + (key || "(none seen)")
      + " is gone, " + left.size + " keys against " + after.size + " with Studio installed");
  }

  /* THE REINSTALL-SHAPED READING, and it is deliberately one leg rather than a second install.
     What an uninstall must NOT take is the person's own work: the profile is outside the install
     folder, so the store the app wrote is still there afterwards. */
  const profileAfter = fs.existsSync(PROFILE) ? fs.readdirSync(PROFILE).sort().join(",") : "";
  check(profileBefore.length > 0 && profileAfter === profileBefore,
    "4e the profile the launches wrote is untouched by the uninstall: "
    + (profileBefore.split(",").filter(Boolean).length) + " entr(ies) before, "
    + (profileAfter.split(",").filter(Boolean).length) + " after"
    + (profileAfter === profileBefore ? "" : "; before [" + profileBefore + "] after [" + profileAfter + "]"));

  reachedEnd = true;
  teardown();
  /* AFTER THE TEARDOWN, because the teardown runs any uninstaller still standing and an
     uninstaller deletes the shortcuts by name: restoring before it would hand the desk's own file
     to the uninstall. restore() ran inside teardown(); this reads what it did. */
  const rows = restore();
  check(rows.length === parked.items.length && rows.every(r => r.back && r.same && !r.why)
        && !fs.existsSync(PARK),
    "4f what the desk had where the installer writes by name is back, byte for byte: "
    + (rows.length ? rows.map(r => r.what + " " + (r.back ? "back" : "NOT BACK")
        + (r.same ? ", every file's sha256 the same" : r.back ? ", DIFFERENT bytes" : "")
        + (r.runsOwn ? ", this run's own copy moved into the lab first" : "")
        + (r.why ? ", " + r.why : "")).join("; ")
      : "this desk had none of the three")
    + "; the parking folder is " + (fs.existsSync(PARK) ? "STILL THERE" : "gone"));
  /* THE PROOF, read-only, after the uninstall and the teardown: unequal names what changed; nothing is put back. */
  const diffs = guardEnd();
  check(diffs.length === 0, "4g what the real installs own is what it was before the run: "
    + (diffs.length ? diffs.map(G.diffLine).join("; ") : GUARD.before.plan.length + " place(s) read again and equal"));
  console.log("\n#counts checks=" + checks + " failures=" + fails
    + " setupBytes=" + setupSize + " asarEntries=" + listed.length + " uiFiles=" + treeUi.length
    + " ink=" + ink.hex + " seconds=" + ((Date.now() - t0) / 1000).toFixed(0));
  console.log("installer  " + (fails ? "FAILED " + fails + " of " : "passed ") + checks + " check(s) in "
    + ((Date.now() - t0) / 1000).toFixed(0) + " s");
  process.exit(fails ? capped(fails) : 0);
}

/* A COUNT AS AN EXIT CODE IS CAPPED AT 63, ballot 4 of the fourth meeting (2026-09-23): bash and
   Linux read an exit code modulo 256, so 256 failures read as success, and 78 failures read as
   NO VERDICT. Measured before the cap with 256 planted at leg 0a: exit 0. */
function capped(n) { return Math.min(n, 63); }

main().catch(e => {
  console.error("installer  " + (e && e.stack ? e.stack : String(e)));
  reachedEnd = true;
  teardown();
  process.exit(fails ? capped(fails) : 78);
});
