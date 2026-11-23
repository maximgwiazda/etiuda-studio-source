/* THE TWO INSTALL PATHS NO STUDIO GATE HAD DRIVEN: a newer setup run over an installed copy, and
 * the all-users install with its uninstall (code-pass survey of 2026-09-27, finding 31).
 *
 *   ETIUDA_STUDIO_OLD_SETUP_EXE=<older setup.exe> node tests/update-install.mjs --update
 *   node tests/update-install.mjs --all-users                 from an ELEVATED shell
 *   ETIUDA_STUDIO_SETUP_EXE=<newer setup.exe> ...             drive a newer installer built elsewhere;
 *                                                             unset, tools/package.mjs builds one
 *   node tests/update-install.mjs --dry-run --update|--all-users   the plan and the refusals it would
 *                                                             make now; installs nothing, launches nothing
 *   --keep                                                    leave the lab standing
 *
 * WHY THESE TWO. tests/installer.mjs installs with /currentuser into an empty lab and uninstalls;
 * nothing is ever installed over a live copy, though a customer updates in no other way (there is
 * no auto-update), and the all-users mode the assisted installer offers, with the engine's
 * installer.nsh branches it reaches, was never driven.
 *
 * WHERE IT RUNS. In a scratch home of its own, made in the lab and given to the CHILDREN only
 * (USERPROFILE, APPDATA, LOCALAPPDATA), with Windows asked first whether it agrees, because NSIS
 * and Electron follow USERPROFILE and ignore the other two. This process keeps its environment, so
 * the engine's door (the pinned E.shellLaunchRefusal, as tests/installer.mjs uses it) still
 * measures against the real profile. WHAT STAYS REAL is the registry, and for the all-users leg
 * the machine-wide Desktop and Start Menu; the run refuses before installing anything where
 * Studio is already registered or a shortcut of its name already stands in a machine-wide place.
 *
 * WHAT STUDIO KEEPS, and so what an update must keep: its settings in <userData>/studio.json
 * (where the projects live, the theme, the language, the tour, and the trial's first day) and the
 * person's catalogs as project folders wherever they chose. So the leg puts the projects in a
 * folder that is NOT the default, names it in the store as Settings would, and reads the updated
 * app listing them: an update that lost the store would list the empty default instead.
 *
 * WHAT IS JUDGED, AND WHERE. This file collects facts; tests/install-plan.mjs judges them, and
 * tests/install-plan-selftest.mjs holds every clause against a planted flaw in each `npm test`.
 *
 * ONE LIMIT, NAMED. Every launch is TOLD its user-data folder (--user-data-dir), because the door
 * refuses a launch without one; the folder given is the one Electron picks by its own rule, and
 * U5b holds both builds to that rule. The leg proves the updated app is given the folder the older
 * one wrote, not that it chose it unaided.
 *
 * Exit code is the number of failed checks, capped at 63; 78 where the run refused or reached no
 * verdict.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync, execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { importCsv } from "../src/import.mjs";
import { json, PROJECT_FILE, DRAFT_FILE } from "../src/publish.mjs";
import { withoutSigning } from "../tools/sellable.mjs";
import * as P from "./install-plan.mjs";
import { windowWall } from "./window-wall.mjs";
import { realProfileGuard, safeListing, safeMove } from "./shell-door.mjs";

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const ARGV = process.argv.slice(2);
const DRY = ARGV.includes("--dry-run");
const KEEP = ARGV.includes("--keep");
const LEG = ARGV.includes("--all-users") ? "all-users" : ARGV.includes("--update") ? "update" : "";
const NO_VERDICT = 78;
if (!LEG) { console.log("usage: node tests/update-install.mjs --update|--all-users [--dry-run] [--keep]"); process.exit(NO_VERDICT); }
const WHO = "Studio tests/update-install.mjs";
/* THE INSTALL GUARD, before the window wall and anything installed (tests/install-guard.cjs): read-only, its refusals
   join the preflight's, and the end compares what the shipped apps own. This leg installs only the test build. */
const G = require("./install-guard.cjs");
const T = require("../tools/test-identity.cjs").TEST.studio;
const GUARD = (() => {
  try { return G.guardStart({ env: process.env }); }
  catch (e) { console.log("  REFUSED the install guard could not read what the real install owns: " + e.message); process.exit(NO_VERDICT); }
})();
let guardSaid = false;
function guardEnd() { if (guardSaid) return null; guardSaid = true; return G.guardEnd(GUARD).diffs; }
if (!DRY && !GUARD.refusals.length) windowWall(WHO);
const t0 = Date.now();
let checks = 0, fails = 0, reachedEnd = false;
const check = (ok, what) => { checks++; console.log((ok ? "  ok   " : "  FAIL ") + what); if (!ok) fails++; };
const rows = list => { for (const r of list) check(r.ok, r.id + " " + r.what); };
const note = what => console.log("       " + what);
const phase = what => console.log("\n" + what);
const capped = n => Math.min(n, 63);

const APP_ID = T.appId, PRODUCT = T.productName;
const SHORTCUT = require("../tools/electron-builder-test.cjs").nsis.shortcutName + ".lnk";
const GUID = P.appGuid(APP_ID);
const KU = P.registryKeys("user", GUID), KM = P.registryKeys("machine", GUID);
const TREE_PKG = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const sha = b => crypto.createHash("sha256").update(b).digest("hex");
const shaFile = f => { try { return sha(fs.readFileSync(f)); } catch (e) { return null; } };
const listing = safeListing;

/* The lab's own path in its long form: a profile whose TEMP is an 8.3 name (a hosted runner's RUNNER~1) spelt the folders one way
   and the shortcuts Windows writes another, and U6 compared the two (installer-runner run 43232264710, 2026-11-12). */
const LAB = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-studio-update-")));
const H = P.scratchHome(LAB);
const CHILD_ENV = Object.assign({}, process.env, H.env);
const UD = path.join(H.places.ApplicationData, T.packageName);
realProfileGuard(UD);
const STORE = path.join(UD, "studio.json");
realProfileGuard(STORE);
const CHOSEN = path.join(H.HOME, "Work", "projects");     /* the person's own projects folder, not the default */
const APP = path.join(LAB, "app"), PM = path.join(LAB, "pm"), PU = path.join(LAB, "pu");
const EXE_NAME = PRODUCT + ".exe", UNINSTALLER = "Uninstall " + PRODUCT + ".exe";
const COMMON = {};

/* ---- PowerShell, one script file per question --------------------------------------------------- */
const PS = {
  value: ["param([string]$Key, [string]$Name)", "$p = Get-ItemProperty -Path $Key -ErrorAction SilentlyContinue",
          "if ($null -eq $p) { '' } else { [string]$p.$Name }"],
  exists: ["param([string]$Key)", "if (Test-Path $Key) { 'yes' } else { 'no' }"],
  named: ["param([string]$Parent, [string]$Display)", "$n = 0; if (Test-Path $Parent) { Get-ChildItem $Parent | ForEach-Object {",
          "  if ((Get-ItemProperty -Path $_.PSPath -ErrorAction SilentlyContinue).DisplayName -eq $Display) { $n++ } } }", "$n"],
  lnk: ["param([string]$File)", "if (-not (Test-Path $File)) { '{}' } else { $s = (New-Object -ComObject WScript.Shell).CreateShortcut($File)",
        "  [pscustomobject]@{ target = [string]$s.TargetPath; hotkey = [string]$s.Hotkey } | ConvertTo-Json -Compress }"],
  hotkey: ["param([string]$File, [string]$Keys)", "$s = (New-Object -ComObject WScript.Shell).CreateShortcut($File); $s.Hotkey = $Keys; $s.Save()",
           "(New-Object -ComObject WScript.Shell).CreateShortcut($File).Hotkey"],
  elevated: ["$p = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())",
             "if ($p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { 'yes' } else { 'no' }"],
  common: ["foreach ($n in 'CommonDesktopDirectory','CommonPrograms','CommonApplicationData') { $n + [char]9 + [Environment]::GetFolderPath($n) }"],
  places: ["foreach ($n in 'LocalApplicationData','ApplicationData','Desktop','Programs') { $n + [char]9 + [Environment]::GetFolderPath($n) }"],
};
for (const k of Object.keys(PS)) fs.writeFileSync(path.join(LAB, "q-" + k + ".ps1"), PS[k].join("\n"), "utf8");
function ask(k, args, env) {
  return String(execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass",
    "-File", path.join(LAB, "q-" + k + ".ps1")].concat(args || []), { encoding: "utf8", windowsHide: true, timeout: 60000, env: env || process.env })).trim();
}
const tab = text => { const o = {}; for (const l of text.split(/\r?\n/)) { const at = l.indexOf("\t"); if (at > 0) o[l.slice(0, at)] = l.slice(at + 1).trim(); } return o; };
const regValue = (key, name) => ask("value", ["-Key", key, "-Name", name]);
const regExists = key => ask("exists", ["-Key", key]) === "yes";
const namedKeys = parent => Number(ask("named", ["-Parent", parent, "-Display", PRODUCT])) || 0;
const shortcutAt = dir => { const f = path.join(dir || "", SHORTCUT); let l = {};
  try { l = JSON.parse(ask("lnk", ["-File", f]) || "{}"); } catch (e) { l = {}; }
  return { count: fs.existsSync(f) ? 1 : 0, target: l.target || "", hotkey: l.hotkey || "" }; };

/* ---- the installer and the program -------------------------------------------------------------- */
function newSetup() {
  if (process.env.ETIUDA_STUDIO_SETUP_EXE) return process.env.ETIUDA_STUDIO_SETUP_EXE;
  if (DRY) return "(built by tools/package.mjs --test-identity)";
  const built = spawnSync(process.execPath, ["tools/package.mjs", "--test-identity"], { cwd: ROOT, encoding: "utf8", env: withoutSigning() });
  const said = String(built.stdout || "").split(/\r?\n/).find(l => l.startsWith("npm run package: ") && /-setup\.exe/i.test(l));
  const exe = said ? said.slice("npm run package: ".length).split("  ")[0] : "";
  const no = exe && fs.existsSync(exe) ? G.setupRefusal(G.setupIdentity(exe), "studio") : "";
  if (no) { console.log("  REFUSED the setup this leg built, before it runs: " + no + "; nothing was installed"); process.exit(NO_VERDICT); }
  return exe;
}
function runSetup(exe, args, mode) {
  const bad = mode ? P.argsFault(args, mode) : "";
  if (bad) throw new Error("refusing to run " + path.basename(exe) + " " + args.join(" ") + ": " + bad);
  note("run: " + exe + " " + args.join(" "));
  return spawnSync(exe, args, { env: CHILD_ENV, windowsHide: true, timeout: 300000 }).status;
}
async function uninstall(dir, mode) {
  const un = path.join(dir, UNINSTALLER);
  if (!fs.existsSync(un)) return -1;
  runSetup(un, P.uninstallArgs(mode), mode);
  for (let i = 1; i <= 90; i++) { await new Promise(r => setTimeout(r, 1000)); if (!fs.existsSync(path.join(dir, EXE_NAME))) return i; }
  return -1;
}
/** One digest over every file in the asar's ui/, name and bytes; the tree's the same way. */
/* @electron/asar keeps an archive's header by its path, so the same path read after an update took the older header's offsets
   against the new file (U3 at f5fe71c0, the engine's at 6545e0e7): every read here drops the cache first. */
function uiDigest(dir) {
  const asar = require("@electron/asar"); const at = path.join(dir, "resources", "app.asar");
  asar.uncacheAll();
  try {
    const names = asar.listPackage(at).map(p => p.replace(/\\/g, "/").replace(/^\//, "")).filter(p => /^ui\/[^/]+\.[^/]+$/.test(p)).sort();
    return sha(names.map(n => n + ":" + sha(asar.extractFile(at, n.split("/").join(path.sep)))).join("\n"));
  } catch (e) { return null; }
}
function treeUiDigest() {
  const names = listing(path.join(ROOT, "ui")).filter(f => fs.statSync(path.join(ROOT, "ui", f)).isFile()).map(f => "ui/" + f).sort();
  return sha(names.map(n => n + ":" + shaFile(path.join(ROOT, n))).join("\n"));
}
const asarName = dir => { try { require("@electron/asar").uncacheAll(); return P.userDataName(JSON.parse(require("@electron/asar").extractFile(path.join(dir, "resources", "app.asar"), "package.json").toString("utf8"))); } catch (e) { return ""; } };

/* ---- the probe: one launch of the installed app through the engine's door ------------------------ */
let E = null;
function probe(dir) {
  const args = ["--user-data-dir=" + UD];
  const env = Object.assign({}, CHILD_ENV, { STUDIO_GATE: "1", STUDIO_TEST_OFFSCREEN: "1",
                                             ETIUDA_TEST_DOCUMENTS: H.documents, ELECTRON_ENABLE_LOGGING: "" });
  delete env.STUDIO_PROJECTS;
  const refusal = E.shellLaunchRefusal(WHO, args, { env });
  if (refusal) throw new Error("the engine's door refused: " + refusal.join(" | "));
  const r = spawnSync(path.join(dir, EXE_NAME), args, { cwd: dir, encoding: "utf8", timeout: 90000, env });
  const line = String(r.stdout || "").split(/\r?\n/).find(l => l.startsWith("studio-launch ")) || "";
  const out = {};
  for (const bit of line.slice("studio-launch ".length).trim().split(/\s+/)) { const at = bit.indexOf("="); if (at > 0) out[bit.slice(0, at)] = bit.slice(at + 1); }
  /* The Overview names its catalogs in its first tile since board 982 E took the projects table away (the launch gate reads the same
     number, 40b5f01e): `catalogs` is what the window shows; `rows`, the table's, is 0 by construction now. */
  return { ok: r.status === 0 && out.ok === "1", rows: Number(out.rows), catalogs: Number(out.catalogs), none: out.none === "1", line };
}
const store = () => { try { return JSON.parse(fs.readFileSync(STORE, "utf8")); } catch (e) { return {}; } };
function digestDir(root) {
  const o = {};
  (function walk(d) { for (const n of listing(d)) { const q = path.join(d, n);
    if (fs.statSync(q).isDirectory()) walk(q); else o[path.relative(root, q)] = shaFile(q); } })(root);
  return o;
}
async function project(root, folder, seed, rowsN, id, name) {
  const out = path.join(LAB, "piles", folder);
  const g = spawnSync(process.execPath, ["tools/fixtures/generate.mjs", "--seed", String(seed), "--rows", String(rowsN), "--out", out], { cwd: ROOT, encoding: "utf8" });
  if (g.status !== 0) throw new Error("the generator refused: " + (g.stderr || g.stdout));
  const dir = path.join(root, folder);
  fs.mkdirSync(dir, { recursive: true });
  const made = await importCsv({ file: path.join(out, "macros.csv"), id, name });
  fs.writeFileSync(path.join(dir, DRAFT_FILE), json(made.catalog), "utf8");
  fs.writeFileSync(path.join(dir, PROJECT_FILE), json({ id: made.catalog.id, name, rev: 0, edition: "", draft: DRAFT_FILE, folder: null }), "utf8");
}

/* ---- the preflight -------------------------------------------------------------------------------- */
function preflight() {
  const said = [];
  if (process.platform !== "win32") said.push("this drives a Windows installer and this is " + process.platform);
  if (/\s/.test(LAB)) said.push("the lab " + LAB + " holds a space, which /D cannot carry");
  for (const d of H.make) fs.mkdirSync(d, { recursive: true });
  const shell = tab(ask("places", [], CHILD_ENV));
  for (const n of Object.keys(H.places))
    if (!P.samePath(shell[n], H.places[n])) said.push("Windows puts " + n + " at " + (shell[n] || "nothing") + " for the scratch home, not " + H.places[n]);
  for (const [k, what] of [[KU.uninstall, "a per-user uninstall key"], [KU.install, "a per-user install key"],
                           [KM.uninstall, "an all-users uninstall key"], [KM.install, "an all-users install key"]])
    if (regExists(k)) said.push(PRODUCT + " is already registered on this machine (" + what + " " + k + "): a setup run now would update THAT copy");
  Object.assign(COMMON, tab(ask("common")));
  if (LEG === "all-users") {
    if (ask("elevated") !== "yes") said.push("the all-users leg needs an elevated shell and this one is not");
    for (const k of ["CommonDesktopDirectory", "CommonPrograms"])
      if (fs.existsSync(path.join(COMMON[k] || "", SHORTCUT))) said.push("a shortcut named " + SHORTCUT + " already stands in " + COMMON[k]);
  }
  if (LEG === "update") {
    const old = process.env.ETIUDA_STUDIO_OLD_SETUP_EXE || "";
    if (!old || !fs.existsSync(old)) said.push("ETIUDA_STUDIO_OLD_SETUP_EXE names no file (" + JSON.stringify(old) + ")");
    const given = process.env.ETIUDA_STUDIO_SETUP_EXE;
    if (old && given && fs.existsSync(old) && fs.existsSync(given) && shaFile(old) === shaFile(given))
      said.push("the older and the newer installer are the same file: an update between them proves nothing");
  }
  /* Either shipped app present is a refusal, and so is any setup this leg is given that is not the test build. */
  for (const r of GUARD.refusals) said.push(r);
  for (const v of ["ETIUDA_STUDIO_SETUP_EXE", "ETIUDA_STUDIO_OLD_SETUP_EXE"]) {
    const exe = process.env[v];
    if (exe && fs.existsSync(exe)) { const no = G.setupRefusal(G.setupIdentity(exe), "studio"); if (no) said.push(v + " refused: " + no); }
  }
  const door = path.join(ROOT, "engine", "pinned", "tests", "engine.js");
  if (!fs.existsSync(door)) said.push("no pinned engine harness at " + door + " (node tools/engine-fetch.mjs): every launch goes through its door");
  return said;
}

/* ---- the update leg ------------------------------------------------------------------------------ */
async function updateLeg(newer) {
  phase("[1/5] the older copy, installed per user as a customer has it");
  const code1 = runSetup(process.env.ETIUDA_STUDIO_OLD_SETUP_EXE, P.installArgs({ mode: "user", dir: APP }), "user");
  check(code1 === 0 && fs.existsSync(path.join(APP, EXE_NAME)) && regExists(KU.uninstall),
    "U0a the older setup installed into " + APP + " (exit " + code1 + ") and registered " + KU.uninstall);
  const named = preflight().filter(r => /already registered/.test(r));
  check(named.length >= 2, "U0c control: with the older copy registered the preflight now refuses " + named.length
    + " time(s), so its silence at [0] meant nothing was there");
  const oldUi = uiDigest(APP), treeUi = treeUiDigest(), oldName = asarName(APP);
  check(!!oldUi && oldUi !== treeUi, "U0b the older copy is a different program: its ui digest " + String(oldUi).slice(0, 12)
    + " against the tree's " + treeUi.slice(0, 12));
  if (!oldUi || oldUi === treeUi) throw new Error("no verdict: the older copy is not an older program");

  phase("[2/5] the person's projects, in a folder of their choosing, and their settings");
  await project(CHOSEN, "retail", 23, 14, "update-retail", "Retail, EN and PL");
  await project(CHOSEN, "travel", 24, 9, "update-travel", "Travel desk");
  fs.mkdirSync(UD, { recursive: true });
  fs.writeFileSync(STORE, JSON.stringify({ root: CHOSEN, theme: "dark", lang: "pl", tour: { offered: true, taken: true, at: 0 } }, null, 1) + "\n", "utf8");
  const first = probe(APP);
  const keysBefore = store();
  check(first.ok && first.catalogs === 2 && typeof keysBefore.trialFrom === "string" && keysBefore.root === CHOSEN,
    "U0e the older copy names the two projects from the chosen folder (" + first.catalogs + " catalogs in the Overview) and wrote its trial's"
    + " first day into the store (" + JSON.stringify(keysBefore.trialFrom) + "): " + first.line);
  const storeBefore = shaFile(STORE), projectsBefore = digestDir(CHOSEN);

  phase("[3/5] two plants: a file only the older copy has, and the person's own shortcut hotkey");
  fs.writeFileSync(path.join(APP, "left-by-the-older-copy.txt"), "planted by " + WHO + "\n", "utf8");
  const hotkeyWant = ask("hotkey", ["-File", path.join(H.places.Desktop, SHORTCUT), "-Keys", "CTRL+ALT+S"]);
  check(!!hotkeyWant, "U0f the Desktop shortcut takes a hotkey, read back as " + JSON.stringify(hotkeyWant));

  phase("[4/5] the newer setup over it, as a customer runs it");
  const code = runSetup(newer, P.installArgs({ mode: "user" }), "user");
  const exe = path.join(APP, EXE_NAME);
  const defaultDir = P.defaultUserInstallDir(H.places.LocalApplicationData, PRODUCT);
  rows(P.judgeUpdate({
    setupExit: code, dir: APP, exe, exeThere: fs.existsSync(exe), installLocation: regValue(KU.install, "InstallLocation"),
    defaultDir, defaultDirExists: fs.existsSync(defaultDir),
    programOld: oldUi, programNew: uiDigest(APP), programTree: treeUi,
    oldOnlyGone: !fs.existsSync(path.join(APP, "left-by-the-older-copy.txt")),
    besideClear: P.BESIDE.every(s => !fs.existsSync(APP + s)),
    appKeys: namedKeys(KU.uninstallParent), keyName: regExists(KU.uninstall) ? GUID : "", keyBefore: GUID,
    version: regValue(KU.uninstall, "DisplayVersion"), wantVersion: String(TREE_PKG.version),
    uninstallString: regValue(KU.uninstall, "UninstallString"),
    nameOld: oldName, nameNew: asarName(APP),
    shortcuts: { desktop: shortcutAt(H.places.Desktop), startMenu: shortcutAt(H.places.Programs) }, hotkeyWant,
    storeBefore, storeAfter: shaFile(STORE), projectsBefore, projectsAfter: digestDir(CHOSEN),
    cacheExists: fs.existsSync(path.join(H.places.LocalApplicationData, T.packageName + "-updater")),
  }));

  phase("[5/5] the updated copy, probed; then the control; then the uninstall");
  const back = probe(APP);
  const keysAfter = store();
  const aside = path.join(LAB, "left-by-this-run");
  fs.mkdirSync(aside, { recursive: true });
  safeMove(STORE, path.join(aside, "studio.json"));
  const bare = probe(APP);
  /* U10 on the Overview's catalogs tile, the two projects planted, as U0e (the judge's `rows` are what the window counts). */
  rows(P.judgeUpdatedRun({ ok: back.ok, rows: back.catalogs, wantRows: 2, keysBefore, keysAfter,
                           controlOk: bare.ok, controlRows: bare.catalogs, controlNone: bare.none }));
  const gone = await uninstall(APP, "user");
  check(gone > 0 && !regExists(KU.uninstall) && !regExists(KU.install),
    "U12 the uninstall takes the updated copy whole: the program gone in " + gone + " s, both HKCU keys gone");
}

/* ---- the all-users leg ---------------------------------------------------------------------------- */
async function allUsersLeg(newer) {
  const machineCache = path.join(COMMON.CommonApplicationData || "C:\\ProgramData", T.packageName + "-updater");
  const machineCacheBefore = fs.existsSync(machineCache);
  phase("[1/3] the all-users install, elevated and silent");
  const code = runSetup(newer, P.installArgs({ mode: "machine", dir: PM }), "machine");
  const af = {
    setupExit: code, exeThere: fs.existsSync(path.join(PM, EXE_NAME)), dir: PM,
    machineKeys: namedKeys(KM.uninstallParent), machineLocation: regValue(KM.uninstall, "InstallLocation"),
    uninstallString: regValue(KM.uninstall, "UninstallString"), userKeysAdded: regExists(KU.uninstall) ? 1 : 0,
    machineInstallKey: regValue(KM.install, "InstallLocation"),
    commonDesktop: shortcutAt(COMMON.CommonDesktopDirectory).count, commonPrograms: shortcutAt(COMMON.CommonPrograms).count,
    userDesktop: shortcutAt(H.places.Desktop).count, userPrograms: shortcutAt(H.places.Programs).count,
    userCacheExists: fs.existsSync(path.join(H.places.LocalApplicationData, T.packageName + "-updater")),
    machineCacheExists: !machineCacheBefore && fs.existsSync(machineCache),
  };
  const namedM = preflight().filter(r => /all-users (uninstall|install) key|already stands/.test(r));
  check(namedM.length >= 3, "A0c control: with the all-users copy installed the preflight now refuses " + namedM.length
    + " time(s), naming the HKLM keys and the public shortcut");

  phase("[2/3] the all-users copy, probed by this user");
  const p = probe(PM);
  af.ok = p.ok;
  af.storeInHome = fs.existsSync(STORE) && !fs.existsSync(path.join(PM, "studio.json"))
    && !fs.existsSync(path.join(COMMON.CommonApplicationData || "C:\\ProgramData", T.packageName));
  const storeSha = shaFile(STORE);

  phase("[3/3] the all-users uninstall, and a plain install after it");
  af.goneSeconds = await uninstall(PM, "machine");
  af.exeAfter = fs.existsSync(path.join(PM, EXE_NAME));
  af.machineKeysAfter = namedKeys(KM.uninstallParent);
  af.machineInstallKeyAfter = regValue(KM.install, "InstallLocation");
  af.commonDesktopAfter = shortcutAt(COMMON.CommonDesktopDirectory).count;
  af.commonProgramsAfter = shortcutAt(COMMON.CommonPrograms).count;
  af.storeKept = !!storeSha && shaFile(STORE) === storeSha;
  af.perUserExit = runSetup(newer, P.plainArgs(PU), "");
  af.perUserKeys = regExists(KU.uninstall) ? 1 : 0;
  af.perUserMachineKeys = regExists(KM.uninstall) ? 1 : 0;
  rows(P.judgeAllUsers(af));
  const puGone = fs.existsSync(path.join(PU, UNINSTALLER)) ? await uninstall(PU, "user") : 0;
  check(!regExists(KU.uninstall) && !regExists(KM.uninstall) && !fs.existsSync(path.join(COMMON.CommonDesktopDirectory, SHORTCUT)),
    "Z1 the machine is as the run found it: A10's copy uninstalled (" + puGone + " s), no key under HKCU or HKLM, no public shortcut");
}

/* ---- the run ------------------------------------------------------------------------------------ */
async function leftovers() {
  for (const [dir, mode] of [[APP, "user"], [PM, "machine"], [PU, "user"]]) {
    if (!fs.existsSync(path.join(dir, UNINSTALLER))) continue;
    const g = await uninstall(dir, mode);
    console.log("       the run left an install at " + dir + " and uninstalled it: " + (g > 0 ? "gone in " + g + " s" : "STILL THERE"));
  }
}
process.on("exit", () => {
  if (!KEEP) { try { fs.rmSync(LAB, { recursive: true, force: true }); } catch (x) { /* named below */ } }
  /* A run that left by a refusal or a throw past the end still says what the real installs own now. */
  const diffs = DRY ? null : guardEnd();
  if (diffs && diffs.length) console.log("  FAIL Z9 what the real installs own CHANGED during this run: " + diffs.map(G.diffLine).join("; "));
});

try {
  phase("[0] " + LEG + (DRY ? ", DRY RUN: the plan and the refusals, nothing installed" : ""));
  const refusals = preflight();
  if (DRY) {
    const newer = newSetup();
    for (const l of [
      "appId " + APP_ID + " -> GUID " + GUID, "keys: " + [KU.uninstall, KU.install, KM.uninstall, KM.install].join(", "),
      "scratch home " + H.HOME + ", user-data folder given to every probe " + UD, "the person's chosen projects folder " + CHOSEN,
      "machine-wide places: " + Object.keys(COMMON).map(k => k + " " + COMMON[k]).join(", "), "newer setup: " + newer,
    ].concat(LEG === "update" ? [
      "older setup: " + (process.env.ETIUDA_STUDIO_OLD_SETUP_EXE || "(ETIUDA_STUDIO_OLD_SETUP_EXE unset)"),
      "1 older:  <older> " + P.installArgs({ mode: "user", dir: APP }).join(" ") + "   argsFault " + JSON.stringify(P.argsFault(P.installArgs({ mode: "user", dir: APP }), "user")),
      "2 update: <newer> " + P.installArgs({ mode: "user" }).join(" ") + "   (no /D)",
      "3 default folder that must stay empty: " + P.defaultUserInstallDir(H.places.LocalApplicationData, PRODUCT),
      "4 uninstall: " + path.join(APP, UNINSTALLER) + " " + P.uninstallArgs("user").join(" "),
    ] : [
      "1 all users: <newer> " + P.installArgs({ mode: "machine", dir: PM }).join(" ") + "   argsFault " + JSON.stringify(P.argsFault(P.installArgs({ mode: "machine", dir: PM }), "machine")),
      "2 uninstall: " + path.join(PM, UNINSTALLER) + " " + P.uninstallArgs("machine").join(" "),
      "3 A10 plain: <newer> " + P.plainArgs(PU).join(" ") + ", then " + P.uninstallArgs("user").join(" "),
    ])) note(l);
    for (const r of refusals) note("WOULD REFUSE: " + r);
    note(refusals.length ? refusals.length + " refusal(s) stand now" : "no refusal stands now: the leg would run");
    console.log("\n#counts checks=0 failures=0 notRun=0 dryRun=1 refusals=" + refusals.length);
    process.exit(0);
  }
  if (refusals.length) { for (const r of refusals) console.log("  REFUSED " + r); console.log("  nothing was installed"); process.exit(NO_VERDICT); }
  E = require(path.join(ROOT, "engine", "pinned", "tests", "engine.js"));
  const newer = newSetup();
  if (!newer || !fs.existsSync(newer)) { console.log("  REFUSED no newer installer: " + JSON.stringify(newer)); process.exit(NO_VERDICT); }
  note("newer setup " + newer + ", sha256 " + String(shaFile(newer)).slice(0, 16));
  if (LEG === "update") await updateLeg(newer); else await allUsersLeg(newer);
  reachedEnd = true;
} catch (e) {
  console.error("  FAIL " + String(e && e.stack || e));
  fails++;
  await leftovers();
}
/* THE PROOF, read-only, after every setup this run ran is uninstalled: unequal names what changed; nothing is put back. */
const endDiffs = guardEnd();
check(endDiffs.length === 0, "Z9 what the real installs own is what it was before the run: "
  + (endDiffs.length ? endDiffs.map(G.diffLine).join("; ") : GUARD.before.plan.length + " place(s) read again and equal"));
console.log("\n#counts checks=" + checks + " failures=" + fails);
console.log("update-install " + LEG + "  " + (reachedEnd ? "" : "INCOMPLETE - ") + (fails ? "FAILED " + fails + " of " : "passed ")
  + checks + " check(s) in " + Math.round((Date.now() - t0) / 1000) + " s" + (KEEP ? "; --keep: the lab stands at " + LAB : ""));
process.exit(reachedEnd ? (fails ? capped(fails) : 0) : (fails ? capped(fails) : NO_VERDICT));
