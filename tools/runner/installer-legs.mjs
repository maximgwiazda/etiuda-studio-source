/* STUDIO'S INSTALLER LEGS FOR A HOSTED WINDOWS RUNNER, silent switches, bar uninstall-data, which drives the uninstaller's first page by window messages.
 *
 *   node tools/runner/installer-legs.mjs --out <dir> [all-upgrade] [running-1618] [system-bare] [locked-1618] [all-move] [all-space-d] [system-push]
 *                                           on a hosted Windows runner only (see THE WALL); no leg named runs all six
 *   ETIUDA_STUDIO_OLD_SETUP_EXE=<older setup.exe>  version N for all-upgrade, locked-1618 and all-move; the workflow builds it
 *                                                  from an older commit. Unset, or the same bytes as the newer, those legs give no verdict.
 *
 * ADAPTATION FROM THE ENGINE'S tools/runner/installer-legs.mjs. Studio declares no file associations (.ec) and registers no
 * etiuda: URL scheme (tests/installer-writes.mjs 1a, 1c), so KEYS and all-upgrade do not check or sweep Software\Classes, and
 * all-upgrade also verifies BESIDE (.setup-staging, .setup-previous) are gone. Package and identity use Studio's test identity
 * (TEST.studio, ETIUDA_STUDIO_DIST, ETIUDA_STUDIO_OLD_SETUP_EXE, setupRefusal(..., "studio")), ES module tests/install-plan.mjs,
 * and Studio's shell offscreen flag (STUDIO_TEST_OFFSCREEN=1). Studio plants no project at a first start (the owner's ruling of
 * 2026-11-17: no sample is part of the code), so no leg here waits for one, and a project folder nobody made is a fault
 * wherever a leg looks. A first run's evidence is Chromium's own `Local State` in <user data>, which every start of the app
 * writes. Studio's studio.json no longer is: S-1b (01de1eb5, 2026-11-19) took the first-run day (`trialFrom`) out of the
 * shell, so a fresh Studio writes no store at its first start (the test architect, 2026-11-21).
 *
 * THE INSTALLER MENDS' LEGS (the engine's of 22d3af9c, ported, and list-in-package of Studio's own): list-in-package, short-stage,
 * foreign-folder-refused, pre-own-survives, per-user-at-sign-in, old-copy-kept and pf-dotdot, each criterion above its function.
 * UNINSTALL-DATA is the one leg that opens a page: it starts the uninstaller with no /S, drives it with tools/runner/uninstaller-drive.ps1
 * (window messages, and WindowFromPoint for what stands under the box), ticks Remove my data by mouse and by keyboard, and reads the planted
 * data back off the disk. It runs only where named, meets the window wall, and its record is uninstall-page-*.json.
 * REINSTALL-NO-REBOOT and REINSTALL-NO-REBOOT-ASK: uninstall, then install again without a reboot, as a person does it, through the pages,
 * with the desk installed and running beside; red on a hang, a second Setup process or window, or anything the uninstall left (its block).
 * They run only where named. all-upgrade's planted file is now kept, by the B1 ruling "an install or an update never removes
 * what it did not put there" (Claude α, 2026-11-22), so all-upgrade reads red against a build without the mends.
 *
 * WHAT EACH LEG PRINTS: "  ok   <leg> ...", "  FAIL <leg> ..." or "  --   <leg> no verdict: ...", then one line
 * "#leg <name> <ok|fail|no-verdict> <facts>", and the same lines go to <dir>/legs.txt. Every leg cleans up in finally:
 * it uninstalls what it installed, deletes the keys, tasks and accounts it made, and stops by pid what it started.
 * Exit: the number of failed legs; 78 where nothing ran or no leg reached a verdict.
 *
 * THE WALL. It refuses (exit 78, nothing written) where the file .etiuda-no-installers stands in the home folder, which a desk
 * that must never run an installer creates once for itself; and unless GITHUB_ACTIONS is "true", RUNNER_ENVIRONMENT is
 * "github-hosted", RUNNER_OS is "Windows" and RUNNER_TEMP is set; and unless tests/install-guard.cjs finds neither shipped app
 * present. Every leg also refuses before doing anything while the test build is already registered. running-1618 opens the
 * installed app, so it also meets Studio's window wall, and gives no verdict where the wall refuses.
 */
import { spawn, spawnSync, execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const NO_VERDICT = 78;
const LEG_NAMES = ["list-in-package", "short-stage", "foreign-folder-refused", "all-upgrade", "running-1618", "system-bare", "locked-1618", "all-move", "all-space-d", "system-push", "ts-cycle", "ts-uninstall", "desk-assoc-kept",
  "pre-own-survives", "per-user-at-sign-in", "old-copy-kept", "pf-dotdot", "uninstall-data", "reinstall-no-reboot", "reinstall-no-reboot-ask"];
/* Run only where named: the installer mends' legs, kept out of a run that names no leg. */
const NAMED_ONLY = ["list-in-package", "short-stage", "foreign-folder-refused", "pre-own-survives", "per-user-at-sign-in", "old-copy-kept", "pf-dotdot", "uninstall-data", "reinstall-no-reboot", "reinstall-no-reboot-ask"];
let OUT = "";
const say = (l) => { process.stdout.write(l + "\n"); if (OUT) fs.appendFileSync(path.join(OUT, "legs.txt"), l + "\n"); };
const refuse = (why) => { say("#legs refused: " + why); process.exit(NO_VERDICT); };

const DESK_SENTINEL = path.join(os.homedir(), ".etiuda-no-installers");
if (fs.existsSync(DESK_SENTINEL)) refuse("this computer carries " + DESK_SENTINEL + ", a desk where installers never run");
if (process.env.GITHUB_ACTIONS !== "true" || process.env.RUNNER_ENVIRONMENT !== "github-hosted" || process.env.RUNNER_OS !== "Windows"
  || !process.env.RUNNER_TEMP)
  refuse("not a hosted Windows runner (GITHUB_ACTIONS, RUNNER_ENVIRONMENT, RUNNER_OS, RUNNER_TEMP); installers never run on a desk");
const argv = process.argv.slice(2);
const outAt = argv.indexOf("--out");
if (outAt < 0 || !argv[outAt + 1]) refuse("--out <dir> is wanted");
const named = argv.filter((a, i) => i !== outAt && i !== outAt + 1);
const unknown = named.filter((n) => LEG_NAMES.indexOf(n) < 0);
if (unknown.length) refuse("no leg named " + unknown.join(", ") + "; the legs are " + LEG_NAMES.join(", "));
const CHOSEN = named.length ? LEG_NAMES.filter((n) => named.indexOf(n) > -1) : LEG_NAMES.filter((n) => NAMED_ONLY.indexOf(n) < 0);

const G = require(path.join(ROOT, "tests", "install-guard.cjs"));
const P = await import(pathToFileURL(path.join(ROOT, "tests", "install-plan.mjs")).href);
const E = require(path.join(ROOT, "engine", "pinned", "tests", "engine.js"));
const { withoutSigning } = await import(pathToFileURL(path.join(ROOT, "tools", "sellable.mjs")).href);
const { windowWallRefusal } = await import(pathToFileURL(path.join(ROOT, "tests", "window-wall.mjs")).href);
const T = require(path.join(ROOT, "tools", "test-identity.cjs")).TEST.studio;
const SHORTCUT = require(path.join(ROOT, "tools", "electron-builder-test.cjs")).nsis.shortcutName + ".lnk";
const WHO = "tools/runner/installer-legs.mjs";
const PRODUCT = T.productName, UNINSTALLER = "Uninstall " + PRODUCT + ".exe";
const GUID = P.appGuid(T.appId), KU = P.registryKeys("user", GUID), KM = P.registryKeys("machine", GUID);
const regKey = (k) => k.replace(/^HKCU:\\/, "HKCU\\").replace(/^HKLM:\\/, "HKLM\\");
const SYS = { uninstall: "HKU\\S-1-5-18\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\" + GUID, install: "HKU\\S-1-5-18\\Software\\" + GUID };
/* Every key an install of Studio's test build writes, in either hive: the cleanup's sweep (no file associations or URL scheme). */
const KEYS = [KM.uninstall, KM.install, KU.uninstall, KU.install].map(regKey);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const oneLine = (s) => String(s || "").replace(/\s+/g, " ").trim().slice(0, 300);
const fmt = (k, v) => k + "=" + (v === undefined || v === null || v === "" ? "-" : /[\s"=]/.test(String(v)) ? JSON.stringify(String(v)) : String(v));
class NoVerdict extends Error {}

/* ---- the first guard, the account, the lab ---------------------------------------------------------------------- */

let GUARD;
try { GUARD = G.guardStart({ env: process.env }); } catch (e) { refuse("the install guard could not read what the shipped apps own: " + e.message); }
if (GUARD.refusals.length) refuse("the install guard: " + GUARD.refusals.join("; "));
const PLACES = GUARD.places;
OUT = path.resolve(argv[outAt + 1]);
fs.mkdirSync(OUT, { recursive: true });
const LAB = fs.mkdtempSync(path.join(process.env.RUNNER_TEMP, "legs-"));
if (P.badInstallDir(LAB)) refuse("the lab cannot be named by /D: " + P.badInstallDir(LAB));

/* PowerShell, one script file per question, written into the lab. None prints a password: the one that needs it reads it
   from the environment of that one child. */
const PS = {
  elevated: ["$p = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())",
    "if ($p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { 'yes' } else { 'no' }"],
  lnk: ["param([string]$File)",
    "if (-not (Test-Path -LiteralPath $File)) { '' } else { (New-Object -ComObject WScript.Shell).CreateShortcut($File).TargetPath }"],
  procs: ["param([string]$Exe)", "$rows = @()",
    "Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -and ($_.ExecutablePath -ieq $Exe) } | ForEach-Object {",
    "  $o = Invoke-CimMethod -InputObject $_ -MethodName GetOwner",
    "  $rows += [pscustomobject]@{ pid = [int]$_.ProcessId; parent = [int]$_.ParentProcessId; user = [string]$o.User } }",
    "ConvertTo-Json -InputObject @($rows) -Compress"],
  mkuser: ["param([string]$Name)",
    "try { $s = ConvertTo-SecureString $env:LEG_PW -AsPlainText -Force",
    "  New-LocalUser -Name $Name -Password $s -PasswordNeverExpires -AccountNeverExpires -ErrorAction Stop | Out-Null",
    "  try { Add-LocalGroupMember -SID 'S-1-5-32-545' -Member $Name -ErrorAction Stop } catch { }",
    "  'made' } catch { 'refused: ' + $_.Exception.Message }"],
  rmuser: ["param([string]$Name)",
    "try { Remove-LocalUser -Name $Name -ErrorAction Stop; 'removed' } catch { 'not removed: ' + $_.Exception.Message }"],
  runas: ["param([string]$Task, [string]$Name, [string]$Exe, [string]$Ud)",
    "try { $a = New-ScheduledTaskAction -Execute $Exe -Argument ('--user-data-dir=\"' + $Ud + '\"')",
    "  $s = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 30) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries",
    "  Register-ScheduledTask -TaskName $Task -Action $a -Settings $s -User ($env:COMPUTERNAME + '\\' + $Name) -Password $env:LEG_PW -RunLevel Limited -ErrorAction Stop | Out-Null",
    "  Start-ScheduledTask -TaskName $Task -ErrorAction Stop; 'started' } catch { 'refused: ' + $_.Exception.Message }"],
  /* system-push's start: the program as the shortcut names it, with no argument of ours, so the copy picks its own user-data
     and Documents folders as it would for a person; the account's profile is loaded by the password logon. */
  runplain: ["param([string]$Task, [string]$Name, [string]$Exe)",
    "try { $a = New-ScheduledTaskAction -Execute $Exe",
    "  $s = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 30) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries",
    "  Register-ScheduledTask -TaskName $Task -Action $a -Settings $s -User ($env:COMPUTERNAME + '\\' + $Name) -Password $env:LEG_PW -RunLevel Limited -ErrorAction Stop | Out-Null",
    "  Start-ScheduledTask -TaskName $Task -ErrorAction Stop; 'started' } catch { 'refused: ' + $_.Exception.Message }"],
  /* An account's profile folder, by its SID's ProfileList entry; empty until its first logon made one. */
  profileof: ["param([string]$Name)",
    "try { $sid = (New-Object System.Security.Principal.NTAccount($Name)).Translate([System.Security.Principal.SecurityIdentifier]).Value",
    "  $k = 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\ProfileList\\' + $sid",
    "  if (Test-Path -LiteralPath $k) { [string](Get-ItemProperty -LiteralPath $k).ProfileImagePath } else { '' } } catch { '' }"],
  unreg: ["param([string]$Task)",
    "try { Stop-ScheduledTask -TaskName $Task -ErrorAction SilentlyContinue",
    "  Unregister-ScheduledTask -TaskName $Task -Confirm:$false -ErrorAction Stop; 'unregistered' } catch { 'not unregistered: ' + $_.Exception.Message }"],
  taskinfo: ["param([string]$Task)",
    "try { $i = Get-ScheduledTaskInfo -TaskName $Task -ErrorAction Stop; $t = Get-ScheduledTask -TaskName $Task; 'state ' + $t.State + ', last result ' + $i.LastTaskResult + ', last run ' + $i.LastRunTime + ', missed ' + $i.NumberOfMissedRuns + ', logon ' + $t.Principal.LogonType } catch { 'unreadable' }"],
  /* The holder writes "held" once the file is open with no sharing, or its own refusal, so a lock never seen names itself. */
  hold: ["param([string]$Target, [string]$Signal)",
    "try { $f = [System.IO.File]::Open($Target, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::None) }",
    "catch { Set-Content -LiteralPath $Signal -Value ('refused: ' + $_.Exception.Message); exit 3 }",
    "Set-Content -LiteralPath $Signal -Value ('held ' + $f.Name)", "Start-Sleep -Seconds 3600", "$f.Close()"],
  /* A second process's open of the same file, read with every sharing, as the probe beside node's own. */
  tryopen: ["param([string]$Target)",
    "try { $g = [System.IO.File]::Open($Target, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite); $g.Close(); 'opened' }",
    "catch { 'refused: ' + $_.Exception.GetType().Name + ' ' + $_.Exception.Message }"],
  /* A password task runs only for an account holding the batch-logon right, which a standard account has not by default
     (running-1618 on both trees, 2026-11-12: last result 0x41303, the task never ran). Granted here on the runner, by the
     account's SID, through secedit's own export and configure of USER_RIGHTS. */
  batchright: ["param([string]$Name)",
    "try { $sid = (New-Object System.Security.Principal.NTAccount($Name)).Translate([System.Security.Principal.SecurityIdentifier]).Value",
    "  $cfg = Join-Path $env:TEMP ('br-' + [guid]::NewGuid().ToString() + '.inf'); $db = $cfg + '.sdb'",
    "  secedit /export /cfg $cfg /areas USER_RIGHTS | Out-Null",
    "  $found = $false",
    "  $lines = @(Get-Content -LiteralPath $cfg | ForEach-Object { if ($_ -match '^SeBatchLogonRight\\s*=') { $found = $true; $_ + ',*' + $sid } else { $_ } })",
    "  if (-not $found) { $lines = @($lines | ForEach-Object { if ($_ -eq '[Privilege Rights]') { $_; 'SeBatchLogonRight = *' + $sid } else { $_ } }) }",
    "  Set-Content -LiteralPath $cfg -Value $lines -Encoding Unicode",
    "  secedit /configure /db $db /cfg $cfg /areas USER_RIGHTS | Out-Null",
    "  if ($LASTEXITCODE -ne 0) { 'refused: secedit exit ' + $LASTEXITCODE } else { 'granted' } } catch { 'refused: ' + $_.Exception.Message }"],
};
const psFile = (k) => path.join(LAB, "q-" + k + ".ps1");
for (const k of Object.keys(PS)) fs.writeFileSync(psFile(k), PS[k].join("\r\n"), "utf8");
const PS_HEAD = ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File"];
function ps(k, args, extraEnv) {
  const r = spawnSync("powershell.exe", PS_HEAD.concat([psFile(k)], args || []),
    { encoding: "utf8", windowsHide: true, timeout: 120000, env: Object.assign({}, process.env, extraEnv || {}) });
  return String(r.stdout || "").trim() || oneLine(r.stderr) || "no answer (" + r.status + ")";
}
if (ps("elevated") !== "yes")
  refuse("the legs install for all users and make accounts and SYSTEM tasks, so they need an elevated account; installer-probe.ps1 says which this runner is");

/* ---- small readings ---------------------------------------------------------------------------------------------- */

const present = (k) => G.regQuery(k).present;
const valueOf = (k, name) => { const r = G.regQuery(k, null, name); return r.present ? (G.regValues(r.text)[name] || "") : ""; };
const machineDir = () => valueOf(regKey(KM.install), "InstallLocation");
function hku(k) {
  const r = spawnSync("reg", ["query", k], { encoding: "utf8", windowsHide: true, timeout: 30000 });
  if (r.status === 0) return true;
  if (r.status === 1) return false;
  throw new Error("reg query " + k + " answered " + r.status + " " + oneLine(r.stderr));
}
const commonLinks = () => [path.join(PLACES.commonDesktop, SHORTCUT), path.join(PLACES.commonPrograms, SHORTCUT)];
const shaOr = (f) => { try { return E.sha256(f); } catch (e) { return fs.existsSync(f) ? "unreadable" : "absent"; } };
const exeOf = (cmdLine) => (/^"([^"]+)"/.exec(String(cmdLine || "")) || [])[1] || "";
const procsOf = (exe) => { try { const v = JSON.parse(ps("procs", ["-Exe", exe]) || "[]"); return Array.isArray(v) ? v : [v]; } catch (e) { return []; } };
const yes = (b) => (b ? "yes" : "no");

/** Every file under `dir` by relative path, lower-cased, to its sha256. */
function manifest(dir) {
  const out = {};
  const walk = (d, rel) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name), r = (rel ? rel + "\\" : "") + e.name.toLowerCase();
      if (e.isDirectory()) walk(p, r);
      else { try { out[r] = E.sha256(p); } catch (x) { out[r] = "unreadable " + (x.code || ""); } }
    }
  };
  if (dir && fs.existsSync(dir)) walk(dir, "");
  return out;
}
function manifestDiff(a, b, skip) {
  const keep = (k) => !skip || k !== skip;
  return { changed: Object.keys(a).filter((k) => keep(k) && k in b && a[k] !== b[k]),
    gone: Object.keys(a).filter((k) => keep(k) && !(k in b)), added: Object.keys(b).filter((k) => keep(k) && !(k in a)) };
}
const few = (list) => list.slice(0, 4).join(",") + (list.length > 4 ? ",+" + (list.length - 4) : "");

/* ---- running things, and the clean-up that follows them --------------------------------------------------------- */

/** One setup or uninstaller run, by pid, with a ceiling; past it the process and its children are stopped by pid. */
function runExe(exe, args, timeoutMs) {
  return new Promise((resolve) => {
    let timedOut = false, settled = false;
    const t0 = Date.now();
    const child = spawn(exe, args, { windowsHide: true, stdio: "ignore" });
    const done = (code) => { if (settled) return; settled = true; clearTimeout(timer); resolve({ code, timedOut, seconds: Math.round((Date.now() - t0) / 1000) }); };
    const timer = setTimeout(() => { timedOut = true; E.killTree(child.pid); }, timeoutMs || 600000);
    child.on("exit", (code) => done(code));
    child.on("error", () => done(null));
  });
}
async function goneWithin(dir, seconds) {
  for (let i = 1; i <= seconds; i++) { await sleep(1000); if (!fs.existsSync(dir)) return i; }
  return -1;
}
function schtasks(args) {
  const r = spawnSync("schtasks", args, { encoding: "utf8", windowsHide: true, timeout: 60000 });
  return { status: r.status, said: oneLine(String(r.stdout || "") + " " + String(r.stderr || "")) };
}

/** Deletes whatever of the test build is still registered or linked machine-wide; answers what it took. */
function sweep() {
  const took = [];
  for (const k of KEYS) {
    if (!present(k)) continue;
    const r = spawnSync("reg", ["delete", k, "/f"].concat(/^HKLM/.test(k) ? ["/reg:64"] : []), { encoding: "utf8", windowsHide: true, timeout: 30000 });
    took.push(k.replace(/^.*\\/, "") + (r.status === 0 ? "" : "(refused)"));
  }
  for (const f of commonLinks()) if (fs.existsSync(f)) { try { fs.unlinkSync(f); took.push(f); } catch (e) { took.push(f + "(refused)"); } }
  return took;
}
/** The all-users copy uninstalled from its own entry, as a person would start it; then the sweep. */
async function uninstallMachine() {
  const said = [];
  const dir = machineDir();
  if (dir) {
    const fromEntry = exeOf(valueOf(regKey(KM.uninstall), "UninstallString"));
    const un = fromEntry && fs.existsSync(fromEntry) ? fromEntry : path.join(dir, UNINSTALLER);
    if (fs.existsSync(un)) {
      const r = await runExe(un, P.uninstallArgs("machine"), 300000);
      const g = await goneWithin(dir, 120);
      said.push("uninstaller exit " + r.code + (r.timedOut ? " (stopped at its ceiling)" : "") + ", " + (g > 0 ? "folder gone in " + g + " s" : "folder still there"));
    } else said.push("no uninstaller in " + dir);
  } else said.push("nothing registered all users");
  const took = sweep();
  if (took.length) said.push("swept " + took.join(","));
  return said.join("; ");
}

/* A one-shot task as SYSTEM, running a .cmd written into the lab that leaves its exit code in a file. */
async function systemTask(rec, tag, lines, timeoutMs) {
  const name = "etst-leg-" + tag + "-" + crypto.randomInt(10000, 99999);
  const cmd = path.join(LAB, name + ".cmd"), exitFile = path.join(LAB, name + ".exit");
  fs.writeFileSync(cmd, ["@echo off"].concat(lines, ['>"' + exitFile + '" echo %ERRORLEVEL%']).join("\r\n") + "\r\n");
  rec.after("task-" + tag, () => { schtasks(["/End", "/TN", name]); const d = schtasks(["/Delete", "/TN", name, "/F"]); return d.status === 0 ? "deleted" : "delete said " + d.said; });
  const c = schtasks(["/Create", "/TN", name, "/TR", cmd, "/SC", "ONCE", "/ST", "23:59", "/RU", "SYSTEM", "/F"]);
  if (c.status !== 0) throw new NoVerdict("a one-shot task as SYSTEM could not be made: " + c.said);
  const r = schtasks(["/Run", "/TN", name]);
  if (r.status !== 0) throw new NoVerdict("the one-shot task as SYSTEM could not be started: " + r.said);
  for (let i = 0; i < timeoutMs / 1000; i++) {
    if (fs.existsSync(exitFile)) { await sleep(500); return { code: parseInt(fs.readFileSync(exitFile, "utf8"), 10), timedOut: false, name }; }
    await sleep(1000);
  }
  schtasks(["/End", "/TN", name]);
  return { code: null, timedOut: true, name };
}

/* ---- what each leg needs before it starts ------------------------------------------------------------------------ */

const DIST = path.join(LAB, "dist");
let NEWER = "", BUILD_LOG = "";
/** Every reason this leg may not start: a shipped app present, or anything of the test build already here. */
function legPreflight() {
  const said = [];
  try {
    const g = G.guardStart({ env: process.env });
    said.push(...g.refusals);
    for (const k of KEYS) if (present(k)) said.push("the test build is already registered here (" + k + ")");
    for (const k of [SYS.uninstall, SYS.install]) if (hku(k)) said.push("the test build is already registered for SYSTEM (" + k + ")");
  } catch (e) { said.push("the registry could not be read: " + e.message); }
  for (const f of commonLinks()) if (fs.existsSync(f)) said.push("a shortcut named " + SHORTCUT + " already stands at " + f);
  const def = path.join(PLACES.programFiles, PRODUCT);
  if (fs.existsSync(def)) said.push("the all-users folder " + def + " is already there");
  return said;
}
/** Version N: the older setup, Studio's test build, and not the newer's bytes; otherwise the leg has no verdict. */
function olderSetup(rec) {
  const old = process.env.ETIUDA_STUDIO_OLD_SETUP_EXE || "";
  if (!old || !fs.existsSync(old)) throw new NoVerdict("ETIUDA_STUDIO_OLD_SETUP_EXE names no file (" + JSON.stringify(old) + "), and the leg needs version N");
  const no = G.setupRefusal(G.setupIdentity(old), "studio");
  if (no) throw new NoVerdict("the older setup is refused before it runs: " + no);
  const so = E.sha256(old), sn = E.sha256(NEWER);
  rec.f("old-setup", so.slice(0, 12)); rec.f("new-setup", sn.slice(0, 12));
  if (so === sn) throw new NoVerdict("the older and the newer setup are the same bytes, so N and N+1 are one version");
  return old;
}
/** Installs `exe` for all users with P.installArgs, the uninstall registered first so a failed install still cleans up. */
async function installMachine(rec, exe, tag) {
  rec.after("uninstall", uninstallMachine);
  const args = P.installArgs({ mode: "machine" });
  const bad = P.argsFault(args, "machine");
  if (bad) throw new Error("refusing " + args.join(" ") + ": " + bad);
  const r = await runExe(exe, args, 600000);
  const dir = machineDir();
  rec.f(tag + "-exit", r.timedOut ? "timeout" : r.code);
  if (r.code !== 0 || !dir || !fs.existsSync(path.join(dir, PRODUCT + ".exe")))
    throw new NoVerdict(tag + " did not install for all users (exit " + r.code + ", InstallLocation " + JSON.stringify(dir || null) + "), so the leg never reached its subject");
  return dir;
}
const newBuild = () => manifest(path.join(DIST, "win-unpacked"));

/* ---- (a) all-upgrade ------------------------------------------------------------------------------------------- */

async function allUpgrade(rec) {
  const old = olderSetup(rec);
  const dir = await installMachine(rec, old, "n");
  const asarAt = path.join(dir, "resources", "app.asar"), asarOld = shaOr(asarAt);
  /* The program may be the same bytes in N and N+1 (a change to the installer alone): the subject is the newer installer run over
     the older install, and olderSetup has already required the two setups to differ. */
  const asarTree = newBuild()["resources\\app.asar"] || "";
  const marker = path.join(dir, "planted-before-the-upgrade.txt");
  fs.writeFileSync(marker, "planted by " + WHO + "\n");

  /* A bare /S on purpose: the criterion's N+1 run, which finds the folder and the context by itself. P.plainArgs carries a /D
     and would answer where; so the vector is written here, the one in this file that P.argsFault would call unflagged. */
  const r = await runExe(NEWER, ["/S"], 600000);
  const us = valueOf(regKey(KM.uninstall), "UninstallString"), un = exeOf(us);
  const facts = {
    exit: r.timedOut ? "timeout" : r.code,
    entry: present(regKey(KM.uninstall)) && /\/allusers/.test(us) && !!valueOf(regKey(KM.uninstall), "DisplayVersion"),
    uninstaller: !!un && fs.existsSync(un),
    location: P.samePath(machineDir(), dir),
    perUser: present(regKey(KU.uninstall)) || present(regKey(KU.install)),
    links: commonLinks().map((f) => fs.existsSync(f) && P.samePath(ps("lnk", ["-File", f]), path.join(dir, PRODUCT + ".exe"))),
    /* Was: the planted file gone and both folders beside clear. Now (B1 and B5): the planted file kept in the folder, the stage
       gone, and the copy aside there, holding N's program and not the planted file, until the uninstall takes it. */
    markerKept: holds(marker, "planted by " + WHO + "\n"),
    stagedGone: !fs.existsSync(dir + STAGED),
    asideProgram: fs.existsSync(path.join(dir + ASIDE, PRODUCT + ".exe")),
    asideAsar: shaOr(path.join(dir + ASIDE, "resources", "app.asar")),
    asideMarker: fs.existsSync(path.join(dir + ASIDE, path.basename(marker))),
    asarNew: shaOr(asarAt),
  };
  rec.f("n1-exit", facts.exit); rec.f("dir", dir); rec.f("hklm-entry", yes(facts.entry)); rec.f("uninstaller", yes(facts.uninstaller));
  rec.f("same-folder", yes(facts.location)); rec.f("hkcu-entry", yes(facts.perUser)); rec.f("desktop-link", yes(facts.links[0]));
  rec.f("startmenu-link", yes(facts.links[1])); rec.f("marker-kept", yes(facts.markerKept)); rec.f("staging-gone", yes(facts.stagedGone));
  rec.f("aside-holds-program", yes(facts.asideProgram)); rec.f("aside-asar", facts.asideAsar === asarOld ? "N's" : facts.asideAsar);
  rec.f("aside-holds-marker", yes(facts.asideMarker));
  rec.f("asar", facts.asarNew === asarOld ? "unchanged" : asarTree && facts.asarNew === asarTree ? "this-tree" : "other");
  const updated = facts.exit === 0 && facts.entry && facts.uninstaller && facts.location && !facts.perUser && facts.links.every(Boolean)
    && facts.markerKept && facts.stagedGone && facts.asideProgram && facts.asideAsar === asarOld && !facts.asideMarker;
  /* The uninstall the entry names, /allusers /S: the folder and the copy aside both go. */
  let unSaid = "not run", g1 = -1, g2 = -1;
  if (updated) {
    const ru = un && fs.existsSync(un) ? await runExe(un, P.uninstallArgs("machine"), 300000) : { code: "no uninstaller" };
    g1 = await goneWithin(dir, 120); g2 = fs.existsSync(dir + ASIDE) ? await goneWithin(dir + ASIDE, 30) : 0;
    unSaid = String(ru.code);
  }
  rec.f("uninstall-exit", unSaid); rec.f("folder-gone-s", g1); rec.f("aside-gone-s", g2);
  const ok = updated && unSaid === "0" && g1 > 0 && g2 >= 0;
  rec.end(ok, ok ? "N with /allusers, then N+1 with /S: the all-users entry and both shortcuts intact, the planted file kept, the stage gone, the copy aside holding N's program and not the planted file; the uninstall took the folder and the copy aside"
    : "after N+1 with /S: exit " + facts.exit + ", entry " + yes(facts.entry) + ", uninstaller " + yes(facts.uninstaller)
      + ", shortcuts " + facts.links.map(yes).join("/") + ", planted file kept " + yes(facts.markerKept) + ", stage gone " + yes(facts.stagedGone)
      + ", copy aside holds N's program " + yes(facts.asideProgram && facts.asideAsar === asarOld) + " and the planted file " + yes(facts.asideMarker)
      + ", a per-user entry " + yes(facts.perUser) + "; uninstall exit " + unSaid + ", folder gone " + yes(g1 > 0) + ", copy aside gone " + yes(g2 >= 0));
}

/* ---- (e) all-move: an all-users install moved to another folder by the newer setup, with a link planted in the old one ----- */

async function allMove(rec) {
  const old = olderSetup(rec);
  /* Folders with no space: /D must be last and unquoted, so P.installArgs refuses a path holding one, and the product's name has one. */
  const A = path.join(LAB, "move-a", "app"), B = path.join(LAB, "move-b", "app");
  rec.after("uninstall", uninstallMachine);
  const argsA = P.installArgs({ mode: "machine", dir: A });
  const badA = P.argsFault(argsA, "machine");
  if (badA) throw new Error("refusing " + argsA.join(" ") + ": " + badA);
  const r0 = await runExe(old, argsA, 600000);
  rec.f("n-exit", r0.timedOut ? "timeout" : r0.code);
  if (r0.code !== 0 || !fs.existsSync(path.join(A, PRODUCT + ".exe")) || !P.samePath(machineDir(), A))
    throw new NoVerdict("N did not install for all users into " + A + " (exit " + r0.code + ", InstallLocation " + JSON.stringify(machineDir() || null) + ")");
  const own = path.join(A, "a-persons-own-file.txt");
  fs.writeFileSync(own, "planted by " + WHO + "\n");
  const victimDir = path.join(LAB, "move-victim"), victim = path.join(victimDir, "must-stay.txt");
  fs.mkdirSync(victimDir, { recursive: true });
  fs.writeFileSync(victim, "must stay\n");
  const link = path.join(A, "resources", "planted-link");
  const mk = spawnSync("cmd.exe", ["/c", "mklink", "/J", link, victimDir], { encoding: "utf8", windowsHide: true, timeout: 30000 });
  rec.after("junction", () => { if (fs.existsSync(link)) spawnSync("cmd.exe", ["/c", "rmdir", link], { windowsHide: true, timeout: 30000 }); return "checked"; });
  if (mk.status !== 0 || !fs.existsSync(path.join(link, "must-stay.txt")))
    throw new NoVerdict("the junction could not be planted (" + oneLine(mk.stderr || mk.stdout) + ")");

  const argsB = P.installArgs({ mode: "machine", dir: B });
  const badB = P.argsFault(argsB, "machine");
  if (badB) throw new Error("refusing " + argsB.join(" ") + ": " + badB);
  const r = await runExe(NEWER, argsB, 600000);
  const facts = {
    exit: r.timedOut ? "timeout" : r.code,
    location: P.samePath(machineDir(), B),
    program: fs.existsSync(path.join(B, PRODUCT + ".exe")),
    links: commonLinks().map((x) => fs.existsSync(x) && P.samePath(ps("lnk", ["-File", x]), path.join(B, PRODUCT + ".exe"))),
    oldProgram: fs.existsSync(path.join(A, PRODUCT + ".exe")),
    oldTrees: fs.existsSync(path.join(A, "resources")) || fs.existsSync(path.join(A, "locales")),
    own: fs.existsSync(own),
    victim: fs.existsSync(victim) && fs.readFileSync(victim, "utf8") === "must stay\n",
  };
  rec.f("n1-exit", facts.exit); rec.f("entry-b", yes(facts.location)); rec.f("program-b", yes(facts.program));
  rec.f("links-b", facts.links.map(yes).join("/")); rec.f("program-a", yes(facts.oldProgram)); rec.f("trees-a", yes(facts.oldTrees));
  rec.f("own-file-a", yes(facts.own)); rec.f("junction-target-intact", yes(facts.victim));
  const ok = facts.exit === 0 && facts.location && facts.program && facts.links.every(Boolean) && !facts.oldProgram && !facts.oldTrees
    && facts.own && facts.victim;
  rec.end(ok, ok ? "N in A, then N+1 into B: entry, program and shortcuts at B; A emptied of the program and its trees, the person's file kept, the planted link's target untouched"
    : "after the move: exit " + facts.exit + ", entry at B " + yes(facts.location) + ", program at B " + yes(facts.program) + ", shortcuts " + facts.links.map(yes).join("/")
      + ", program left in A " + yes(facts.oldProgram) + ", trees left in A " + yes(facts.oldTrees) + ", own file kept " + yes(facts.own)
      + ", link target intact " + yes(facts.victim));
}

/* ---- (f) all-space-d: a silent all-users install with /D into a folder whose path holds spaces, as a deployment tool passes it ---- */

async function allSpaceD(rec) {
  const dir = path.join(LAB, "with space", PRODUCT);
  rec.after("uninstall", uninstallMachine);
  const line = "/S /allusers /D=" + dir;
  rec.f("command", "setup " + line);
  /* windowsVerbatimArguments: node joins the arguments as they are, so /D's spaces reach NSIS unquoted and last. */
  const run = spawnSync(NEWER, ["/S", "/allusers", "/D=" + dir], { windowsHide: true, windowsVerbatimArguments: true, timeout: 600000 });
  const facts = {
    exit: run.error ? "error " + oneLine(run.error.message) : run.status,
    location: P.samePath(machineDir(), dir),
    program: fs.existsSync(path.join(dir, PRODUCT + ".exe")),
  };
  rec.f("exit", facts.exit); rec.f("entry-names-folder", yes(facts.location)); rec.f("program-there", yes(facts.program));
  rec.f("installlocation", machineDir());
  const ok = facts.exit === 0 && facts.location && facts.program;
  rec.end(ok, ok ? "a silent all-users install with /D into a folder holding spaces landed there and is registered there"
    : "with /D into a folder holding spaces: exit " + facts.exit + ", entry names the folder " + yes(facts.location) + ", program there " + yes(facts.program));
}

/* ---- (b) running-1618 ------------------------------------------------------------------------------------------ */

function installState(dir) {
  const keys = {};
  for (const k of KEYS) { const r = G.regQuery(k); keys[k] = r.present ? r.text : "absent"; }
  const links = {};
  for (const f of commonLinks()) links[f] = shaOr(f);
  return { files: manifest(dir), keys, links };
}
function stateDiff(a, b) {
  const d = manifestDiff(a.files, b.files);
  const keys = Object.keys(a.keys).filter((k) => a.keys[k] !== b.keys[k]);
  const links = Object.keys(a.links).filter((k) => a.links[k] !== b.links[k]);
  return { files: d.changed.concat(d.gone, d.added), keys, links };
}

async function running1618(rec) {
  const wall = windowWallRefusal(WHO);
  if (wall) throw new NoVerdict("the leg opens the installed app and the window wall refuses: " + wall[0]);
  if (!process.env.APPDATA) throw new NoVerdict("APPDATA is not set, so the own copy's user-data folder cannot be named");
  const dir = await installMachine(rec, NEWER, "install");
  const exe = path.join(dir, PRODUCT + ".exe");

  /* The other session: a standard account made here, its password never printed or written. */
  const name = "etst" + crypto.randomInt(10000, 99999);
  let secret = "Aa1!" + crypto.randomBytes(24).toString("base64");
  rec.after("account", () => ps("rmuser", ["-Name", name]));
  const made = ps("mkuser", ["-Name", name], { LEG_PW: secret });
  if (made !== "made") { secret = null; throw new NoVerdict("a standard account could not be made: " + made); }
  const right = ps("batchright", ["-Name", name]);
  rec.f("batch-right", right);
  if (right !== "granted") { secret = null; throw new NoVerdict("the second account could not be given the batch-logon right its task needs: " + right); }
  const drop = path.join(LAB, "as-" + name);
  fs.mkdirSync(drop);
  spawnSync("icacls", [drop, "/grant", name + ":(OI)(CI)M"], { windowsHide: true, timeout: 30000 });
  const task = "etst-leg-" + name;
  rec.after("task", () => ps("unreg", ["-Task", task]));
  const started = ps("runas", ["-Task", task, "-Name", name, "-Exe", exe, "-Ud", path.join(drop, "ud")], { LEG_PW: secret });
  secret = null;
  if (started !== "started") throw new NoVerdict("the installed copy could not be started as the second account: " + started);

  /* This account's own copy, checked by the engine's launch refusal, in the user-data folder Electron picks for the test
     build, so the installer's close signal reaches the same running copy. STUDIO_TEST_OFFSCREEN=1 keeps the window offscreen
     without closing immediately (unlike STUDIO_GATE=1). */
  const docs = path.join(LAB, "documents");
  fs.mkdirSync(docs);
  const args = ["--user-data-dir=" + path.join(process.env.APPDATA, T.packageName)];
  const env = Object.assign({}, process.env, { STUDIO_TEST_OFFSCREEN: "1", ETIUDA_TEST_DOCUMENTS: docs });
  delete env.STUDIO_PROJECTS;
  delete env.STUDIO_GATE;
  const opts = { stdio: "ignore", windowsHide: true, env };
  const no = E.shellLaunchRefusal(WHO, args, opts);
  if (no) throw new NoVerdict("the own copy's launch is refused: " + no[0]);
  const own = spawn(exe, args, opts);
  let ownGone = false;
  own.on("exit", () => { ownGone = true; });
  rec.after("own-copy", () => (ownGone ? "had ended" : E.killTree(own.pid).how));

  let others = [];
  for (let i = 0; i < 45; i++) {
    await sleep(2000);
    others = procsOf(exe).filter((p) => String(p.user).toLowerCase() === name.toLowerCase());
    if (others.length && !ownGone && i >= 4) break;
  }
  rec.after("other-copy", () => { const left = procsOf(exe).filter((p) => String(p.user).toLowerCase() === name.toLowerCase());
    return left.length ? left.map((p) => p.pid + " " + E.killTree(p.pid).killed).join(",") : "had ended"; });
  rec.f("other-copies", others.length);
  if (!others.length) throw new NoVerdict("the second account's copy did not start or did not stay (task " + ps("taskinfo", ["-Task", task]) + ")");
  if (ownGone) throw new NoVerdict("this account's own copy did not stay running, so there is nothing to ask to close");

  const before = installState(dir);
  const r = await runExe(NEWER, P.installArgs({ mode: "machine" }), 600000);
  await sleep(3000);
  const otherPids = new Set(others.map((p) => p.pid));
  const othersAlive = procsOf(exe).filter((p) => otherPids.has(p.pid)).length;
  const d = stateDiff(before, installState(dir));
  rec.f("exit", r.timedOut ? "timeout" : r.code); rec.f("seconds", r.seconds); rec.f("own-closed", yes(ownGone));
  rec.f("other-alive", othersAlive); rec.f("files-changed", d.files.length ? few(d.files) : 0);
  rec.f("keys-changed", d.keys.length ? few(d.keys) : 0); rec.f("links-changed", d.links.length);
  const ok = r.code === 1618 && !ownGone && othersAlive > 0 && !d.files.length && !d.keys.length && !d.links.length;
  rec.end(ok, ok ? "the other account's copy ended the run with 1618, the own copy was left running, and the installed files, keys and shortcuts are as they were"
    : "exit " + r.code + " (1618 wanted), own copy left running " + yes(!ownGone) + ", other account's copy alive " + yes(othersAlive > 0)
      + ", " + d.files.length + " file(s), " + d.keys.length + " key(s) and " + d.links.length + " shortcut(s) changed");
}

/* ---- (c) system-bare ------------------------------------------------------------------------------------------- */

async function systemBare(rec) {
  const dir = path.join(LAB, "as-system");
  const args = P.plainArgs(dir);
  rec.after("uninstall", async () => {
    const said = [];
    if (present(regKey(KM.uninstall)) || machineDir()) said.push(await uninstallMachine());
    if (hku(SYS.uninstall)) {
      /* It went per user for SYSTEM: only SYSTEM can take that copy away, by its own uninstaller in a second task. */
      const tidy = record("tidy");
      try {
        const r = await systemTask(tidy, "unsys", ['"' + path.join(dir, UNINSTALLER) + '" ' + P.uninstallArgs("user").join(" ")], 300000);
        said.push("SYSTEM's uninstall exit " + r.code + ", " + ((await goneWithin(dir, 120)) > 0 ? "folder gone" : "folder still there"));
      } catch (e) { said.push("SYSTEM's uninstall: " + e.message); }
      for (const c of tidy.cleanups.reverse()) { try { await c.run(); } catch (e) { /* named below */ } }
      for (const k of [SYS.uninstall, SYS.install]) if (hku(k)) { spawnSync("reg", ["delete", k, "/f"], { windowsHide: true, timeout: 30000 }); said.push("deleted " + k); }
    }
    for (const p of procsOf(NEWER)) said.push("stopped setup pid " + p.pid + " " + E.killTree(p.pid).killed);
    return said.join("; ") || "nothing was installed";
  });
  const r = await systemTask(rec, "sys", ['"' + NEWER + '" ' + args.join(" ")], 900000);
  const f = { hklmU: present(regKey(KM.uninstall)), hklmI: present(regKey(KM.install)), sysU: hku(SYS.uninstall), sysI: hku(SYS.install) };
  rec.f("exit", r.timedOut ? "timeout" : r.code); rec.f("args", args.join(" ")); rec.f("hklm-uninstall", yes(f.hklmU)); rec.f("hklm-install", yes(f.hklmI));
  rec.f("location", machineDir()); rec.f("system-hkcu-uninstall", yes(f.sysU)); rec.f("system-hkcu-install", yes(f.sysI));
  rec.f("runner-hkcu", yes(present(regKey(KU.uninstall))));
  const ok = r.code === 0 && f.hklmU && f.hklmI && !f.sysU && !f.sysI;
  rec.end(ok, ok ? "a bare /S as SYSTEM chose all users: the HKLM keys are there and SYSTEM's HKCU has none"
    : "a bare /S as SYSTEM: exit " + (r.timedOut ? "none within 15 min" : r.code) + ", HKLM keys " + yes(f.hklmU) + "/" + yes(f.hklmI)
      + ", SYSTEM's HKCU keys " + yes(f.sysU) + "/" + yes(f.sysI));
}

/* ---- (g) system-push: what a Software Center does, end to end (ported from the engine's leg of 2026-11-13) -----------
   Three acts, each timed, the leg green only where all three hold:
   1. the push: P.installArgs({ mode: "machine" }) (/S /allusers, no /D, so the default folder) in a one-shot task as SYSTEM.
      Holds where it exits 0, the HKLM uninstall and install keys stand and name the default all-users folder holding the
      program, both all-users shortcuts point at that program, and SYSTEM's own HKCU has neither key. Studio registers no link
      or file type, so there is none to judge.
   2. the first start by a person: a standard account made here (as running-1618 makes one), never used to install, starts
      the program the all-users Start-menu shortcut names, with no argument. Holds where its copy runs as that account and,
      within 90 s, that first run has written Chromium's Local State into
      <its profile>\AppData\Roaming\<package name>, and has made no project in <its profile>\Documents\Etiuda Studio
      (Studio plants nothing): the installed code ran as the person and wrote where a person's files go, with nothing of
      the installing context in the way.
   3. the removal: the uninstaller the HKLM entry names, with P.uninstallArgs("machine"), in a one-shot task as SYSTEM, after
      the person's copy is stopped by pid. Holds where it exits 0, the folder goes within 120 s, and the keys and the shortcuts
      are gone. The person's own Documents and AppData are left, which is recorded, not judged.
   The account goes at the end; its profile folder stays on the throwaway runner. */
const lnkTarget = (f) => ps("lnk", ["-File", f]);
const samePath = (a, b) => !!a && !!b && P.samePath(a, b);
const keyName = (k) => k.split("\\")[0] + ":" + k.replace(/^.*\\/, "");

async function systemPush(rec) {
  const wall = windowWallRefusal(WHO);
  if (wall) throw new NoVerdict("the leg starts the installed app as a second account and the window wall refuses: " + wall[0]);
  const want = path.join(PLACES.programFiles, PRODUCT);
  const exe = path.join(want, PRODUCT + ".exe");

  /* 1. The push. The uninstall is registered first, so a half-done push still goes. */
  rec.after("uninstall", async () => {
    const said = [];
    if (present(regKey(KM.uninstall)) || machineDir()) said.push(await uninstallMachine());
    for (const k of [SYS.uninstall, SYS.install]) if (hku(k)) { spawnSync("reg", ["delete", k, "/f"], { windowsHide: true, timeout: 30000 }); said.push("deleted " + k); }
    for (const p of procsOf(NEWER)) said.push("stopped setup pid " + p.pid + " " + E.killTree(p.pid).killed);
    return said.join("; ") || "nothing was left installed";
  });
  const args = P.installArgs({ mode: "machine" });
  const bad = P.argsFault(args, "machine");
  if (bad) throw new Error("refusing " + args.join(" ") + ": " + bad);
  const t1 = Date.now();
  const push = await systemTask(rec, "push", ['"' + NEWER + '" ' + args.join(" ")], 900000);
  rec.f("push-exit", push.timedOut ? "timeout" : push.code); rec.f("push-seconds", Math.round((Date.now() - t1) / 1000)); rec.f("push-args", args.join(" "));
  const dir = machineDir();
  const links = commonLinks().map((f) => ({ f, to: lnkTarget(f) }));
  const pushed = {
    keys: present(regKey(KM.uninstall)) && present(regKey(KM.install)),
    folder: samePath(dir, want) && fs.existsSync(exe),
    links: links.every((l) => samePath(l.to, exe)),
    sysClean: !hku(SYS.uninstall) && !hku(SYS.install),
  };
  rec.f("location", dir); rec.f("hklm-keys", yes(pushed.keys)); rec.f("shortcuts-to-program", yes(pushed.links)); rec.f("system-hkcu-clean", yes(pushed.sysClean));
  const pushOk = push.code === 0 && pushed.keys && pushed.folder && pushed.links && pushed.sysClean;
  if (!pushOk) {
    rec.end(false, "the push as SYSTEM: exit " + (push.timedOut ? "none within 15 min" : push.code) + ", HKLM keys " + yes(pushed.keys)
      + ", in the default folder " + yes(pushed.folder) + ", shortcuts to the program " + yes(pushed.links) + ", SYSTEM's HKCU clean " + yes(pushed.sysClean));
    return;
  }

  /* 2. The first start by a person who never installed it. */
  const name = "etst" + crypto.randomInt(10000, 99999);
  let secret = "Aa1!" + crypto.randomBytes(24).toString("base64");
  rec.after("account", () => ps("rmuser", ["-Name", name]));
  const made = ps("mkuser", ["-Name", name], { LEG_PW: secret });
  if (made !== "made") { secret = null; throw new NoVerdict("a standard account could not be made: " + made); }
  const right = ps("batchright", ["-Name", name]);
  rec.f("batch-right", right);
  if (right !== "granted") { secret = null; throw new NoVerdict("the second account could not be given the batch-logon right its task needs: " + right); }
  const fromMenu = lnkTarget(path.join(PLACES.commonPrograms, SHORTCUT));
  const task = "etst-push-" + name;
  rec.after("task", () => ps("unreg", ["-Task", task]));
  rec.after("person-copy", () => { const left = procsOf(exe).filter((p) => String(p.user).toLowerCase() === name.toLowerCase());
    return left.length ? left.map((p) => p.pid + " " + E.killTree(p.pid).killed).join(",") : "had ended"; });
  const t2 = Date.now();
  const started = ps("runplain", ["-Task", task, "-Name", name, "-Exe", fromMenu], { LEG_PW: secret });
  secret = null;
  if (started !== "started") throw new NoVerdict("the program the Start-menu shortcut names could not be started as the second account: " + started);
  let profile = "", copies = [], projectSaid = "absent", storeSaid = "absent", firstSeconds = -1;
  for (let i = 0; i < 45; i++) {
    await sleep(2000);
    copies = procsOf(exe).filter((p) => String(p.user).toLowerCase() === name.toLowerCase());
    if (!profile) { const p = ps("profileof", ["-Name", name]); if (/^[A-Za-z]:\\/.test(p)) profile = p; }
    if (!profile) continue;
    const projects = path.join(profile, "Documents", "Etiuda Studio");
    const store = path.join(profile, "AppData", "Roaming", T.packageName, "Local State");
    projectSaid = !fs.existsSync(projects) ? "absent" : (() => { try { const n = fs.readdirSync(projects, { withFileTypes: true }).filter((e) => e.isDirectory()).length; return n ? n + " project(s)" : "empty"; } catch (e) { return "unreadable"; } })();
    storeSaid = fs.existsSync(store) ? "first-run" : "absent";
    if (storeSaid === "first-run" && copies.length) { firstSeconds = Math.round((Date.now() - t2) / 1000); break; }
  }
  rec.f("menu-target", fromMenu); rec.f("person-copies", copies.length); rec.f("profile", profile ? "made" : "none");
  rec.f("first-run-projects", projectSaid); rec.f("first-run-store", storeSaid); rec.f("first-run-seconds", firstSeconds);
  /* A project in the person's Documents is one nobody made: Studio plants nothing. */
  const firstOk = samePath(fromMenu, exe) && firstSeconds >= 0 && !/project/.test(projectSaid);
  if (!firstOk) {
    rec.end(false, "pushed as SYSTEM, but the person's first start: the menu names the program " + yes(samePath(fromMenu, exe)) + ", copies running as the person "
      + copies.length + ", their Documents\\Etiuda Studio " + projectSaid + ", their Local State " + storeSaid + " (task " + ps("taskinfo", ["-Task", task]) + ")");
    return;
  }

  /* 3. The removal, as SYSTEM, from the entry's own uninstaller, once the person's copy is stopped by pid. */
  const stopped = copies.map((p) => p.pid + " " + E.killTree(p.pid).killed).join(",");
  rec.f("person-copy-stopped", stopped);
  for (let i = 0; i < 15 && procsOf(exe).length; i++) await sleep(1000);
  const un = exeOf(valueOf(regKey(KM.uninstall), "UninstallString"));
  if (!un || !fs.existsSync(un)) throw new NoVerdict("the HKLM entry names no uninstaller that exists (" + JSON.stringify(un) + ")");
  const t3 = Date.now();
  const removal = await systemTask(rec, "unpush", ['"' + un + '" ' + P.uninstallArgs("machine").join(" ")], 600000);
  const goneIn = await goneWithin(want, 120);
  rec.f("removal-exit", removal.timedOut ? "timeout" : removal.code); rec.f("removal-seconds", Math.round((Date.now() - t3) / 1000));
  rec.f("folder-gone-s", goneIn);
  const left = { keys: KEYS.filter(present).map(keyName), links: commonLinks().filter((f) => fs.existsSync(f)) };
  rec.f("keys-left", left.keys.length ? few(left.keys) : 0); rec.f("shortcuts-left", left.links.length);
  rec.f("person-data-kept", yes(fs.existsSync(path.join(profile, "AppData", "Roaming", T.packageName))));
  const removedOk = removal.code === 0 && goneIn > 0 && !left.keys.length && !left.links.length;
  rec.end(removedOk, removedOk
    ? "pushed as SYSTEM into " + want + ", started by a standard account from the Start menu whose first run wrote its user data and made no project, in " + firstSeconds
      + " s, then removed as SYSTEM whole (folder gone in " + goneIn + " s)"
    : "pushed and started, but the removal as SYSTEM: exit " + (removal.timedOut ? "none within 10 min" : removal.code) + ", folder gone " + yes(goneIn > 0)
      + ", keys left " + left.keys.length + ", shortcuts left " + left.links.length);
}

/* ---- ts-cycle: the Test Service build over the ordinary one, and back ---------------------------------------------- */

/* The engine's ts-cycle (engine tools/runner/installer-legs.mjs, green on the runner 2026-11-13, run 43441036756), ported. Claude
   α's criterion, through the lead engineer: after the ordinary build, then the Test Service build, then the ordinary build again,
   each for one account, red where anything in the user-data folder is lost, moved or unread, or a second Apps entry or shortcut
   is left behind. Both builds carry the test identity: the config written below loads tools/electron-builder-test.cjs with
   ETIUDA_PACK_TEST_SERVICE unset and puts tools/test-service.cjs's config on top, since test-identity.cjs refuses it the other way
   round. The lab file is invented: the staging service address and placeholder client ids, nothing of Max's. A first run is known
   by Chromium's Local State in the user-data folder; since S-1b a fresh Studio writes no studio.json at its first start. Each
   later start is judged by what it does to the folder: nothing of the first run gone, the planted marker byte for byte, and no
   project made by any start. */
const TS_SUFFIX = " Test Service";
const TS_LAB = { service: "https://etiuda.dev/licence-staging/v1/",
  clientIds: { microsoft: "11111111-2222-3333-4444-555555555555", google: "1234567890-abcdefghij.apps.googleusercontent.com" } };
const userDir = () => valueOf(regKey(KU.install), "InstallLocation");
const userLinks = (name) => [path.join(PLACES.desktop, name), path.join(PLACES.programs, name)];
/* Every per-user uninstall entry whose display name names the test build, by key: the Apps list's rows for it. */
function appsRows() {
  const r = spawnSync("reg", ["query", "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall", "/s", "/f", PRODUCT, "/d"],
    { encoding: "utf8", windowsHide: true, timeout: 30000 });
  return String(r.stdout || "").split(/\r?\n/).filter((l) => /^HKEY_/.test(l)).map((l) => l.trim());
}
/** The Test Service test build, made once: the ordinary test build's tree, packed again with the composed config. */
let TS_SETUP = "";
function tsSetup(rec) {
  if (TS_SETUP) return TS_SETUP;
  const out = path.join(LAB, "dist-ts"), lab = path.join(LAB, "ts-lab.json"), cfg = path.join(LAB, "test-service-qa.cjs");
  fs.writeFileSync(lab, JSON.stringify(TS_LAB));
  /* Written here because the workflow carries only this folder's named .mjs files into the checkout. */
  fs.writeFileSync(cfg, ['"use strict";',
    "const VAR = \"ETIUDA_PACK_TEST_SERVICE\", lab = process.env[VAR];",
    "if (!lab) throw new Error(\"ts-cycle's config: \" + VAR + \" names no lab file\");",
    "delete process.env[VAR];",
    "let base;",
    "try { base = require(" + JSON.stringify(path.join(ROOT, "tools", "electron-builder-test.cjs")) + "); } finally { process.env[VAR] = lab; }",
    "module.exports = require(" + JSON.stringify(path.join(ROOT, "tools", "test-service.cjs")) + ").testServiceConfig(base, process.env);",
    ""].join("\n"));
  const cli = path.join(ROOT, "node_modules", "electron-builder", "out", "cli", "cli.js");
  const t0 = Date.now();
  try {
    execFileSync(process.execPath, [cli, "--win", "--config", cfg],
      { cwd: ROOT, stdio: "inherit", env: Object.assign(withoutSigning(), { ETIUDA_STUDIO_DIST: out, ETIUDA_PACK_TEST_SERVICE: lab }) });
  } catch (e) { throw new NoVerdict("the Test Service test build could not be built: " + oneLine(e.message)); }
  const found = fs.readdirSync(out).filter((n) => /-setup\.exe$/i.test(n));
  if (found.length !== 1) throw new NoVerdict(out + " holds " + found.length + " installers; expected 1");
  const exe = path.join(out, found[0]);
  /* The guard's own test, with the one rename this build makes: the test app id, the test product name with the suffix, and
     nothing of a shipped app's. */
  const id = G.setupIdentity(exe);
  const shipped = Object.values(require(path.join(ROOT, "tools", "test-identity.cjs")).SHIPPED)
    .find((s) => s.productName === id.productName || s.appId === id.appId);
  if (shipped || id.appId !== T.appId || id.productName !== PRODUCT + TS_SUFFIX)
    throw new NoVerdict("the Test Service test setup names " + JSON.stringify(id.productName) + " and app id " + JSON.stringify(id.appId || null)
      + ", not " + PRODUCT + TS_SUFFIX + " / " + T.appId);
  const ts = require(path.join(ROOT, "tools", "test-service.cjs"));
  const fields = ts.asarPackage(path.join(out, "win-unpacked", "resources", "app.asar"));
  if (!fields || !fields[ts.TEST_SERVICE_KEY]) throw new NoVerdict("the Test Service test build's asar carries no " + ts.TEST_SERVICE_KEY);
  rec.f("ts-built-s", Math.round((Date.now() - t0) / 1000)); rec.f("ts-setup", found[0]);
  TS_SETUP = exe;
  return exe;
}
/* The per-user copy uninstalled from its own entry, then the sweep; the user-data folder is left, as a person's uninstall leaves it. */
async function uninstallUser() {
  const said = [];
  const dir = userDir();
  const un = exeOf(valueOf(regKey(KU.uninstall), "UninstallString")) || (dir ? path.join(dir, UNINSTALLER) : "");
  if (un && fs.existsSync(un)) {
    const r = await runExe(un, P.uninstallArgs("user"), 300000);
    const g = dir ? await goneWithin(dir, 120) : 0;
    said.push("uninstaller exit " + r.code + ", " + (g > 0 ? "folder gone in " + g + " s" : "folder still there"));
  } else said.push("nothing registered for this account");
  const took = sweep();
  for (const n of [SHORTCUT, PRODUCT + TS_SUFFIX + ".lnk"]) for (const f of userLinks(n)) if (fs.existsSync(f)) { try { fs.unlinkSync(f); took.push(f); } catch (e) { took.push(f + "(refused)"); } }
  if (took.length) said.push("swept " + took.join(","));
  return said.join("; ");
}

async function tsCycle(rec) {
  const wall = E.windowWallRefusal(WHO);
  if (wall) throw new NoVerdict("the leg starts each installed build and the window wall refuses: " + wall[0]);
  if (!process.env.APPDATA || !PLACES.desktop || !PLACES.programs) throw new NoVerdict("this account's AppData, Desktop or Programs folder cannot be named");
  const ts = tsSetup(rec);
  const ud = path.join(process.env.APPDATA, T.packageName);
  /* Studio keeps projects in the account's own Documents\Etiuda Studio (it reads no test Documents variable) and plants none
     there, so a folder found in it is one nobody made, which this leg judges at every start; the launch door still
     wants a confined catalog folder of its own, so ETIUDA_TEST_DOCUMENTS names one in the lab, made before the first start. */
  const projects = path.join(os.homedir(), "Documents", "Etiuda Studio");
  const docsRoot = path.join(LAB, "documents");
  const marker = path.join(ud, "ts-cycle-marker.bin");
  for (const p of [ud, projects]) if (fs.existsSync(p)) throw new NoVerdict(p + " is already there, so this account is not a fresh one to measure");
  fs.mkdirSync(docsRoot, { recursive: true });
  rec.after("uninstall", uninstallUser);
  const VOLATILE = /^(cache|code cache|gpucache|dawn[^\\]*|shared dictionary|crashpad|blob_storage|network|service worker)(\\|$)/;
  const steady = (m) => Object.fromEntries(Object.entries(m).filter(([k]) => !VOLATILE.test(k)));
  const ORD_LNK = SHORTCUT, TS_LNK = PRODUCT + TS_SUFFIX + ".lnk";
  const projectDirs = () => { try { return fs.readdirSync(projects, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name); } catch (e) { return []; } };
  /* The first run's own evidence: Chromium's Local State, which every start writes into the user-data folder. */
  const firstRan = () => fs.existsSync(path.join(ud, "Local State"));

  const install = async (exe, tag, wantName, wantLnk, notLnk) => {
    const args = P.installArgs({ mode: "user" });
    const bad = P.argsFault(args, "user");
    if (bad) throw new Error("refusing " + args.join(" ") + ": " + bad);
    const r = await runExe(exe, args, 600000);
    const dir = userDir(), prog = dir ? path.join(dir, PRODUCT + ".exe") : "";
    const rows = appsRows();
    const shown = valueOf(regKey(KU.uninstall), "DisplayName");
    const wantLinks = userLinks(wantLnk).filter((f) => fs.existsSync(f));
    const strayLinks = userLinks(notLnk).filter((f) => fs.existsSync(f));
    const linksOk = wantLinks.length > 0 && wantLinks.every((f) => samePath(lnkTarget(f), prog));
    const pkg = require(path.join(ROOT, "tools", "test-service.cjs")).asarPackage(path.join(dir || "", "resources", "app.asar"));
    const carries = !!(pkg && pkg.etiudaTestService);
    rec.f(tag + "-exit", r.timedOut ? "timeout" : r.code); rec.f(tag + "-dir", dir); rec.f(tag + "-apps-rows", rows.length);
    rec.f(tag + "-shown", shown); rec.f(tag + "-links", wantLinks.length); rec.f(tag + "-stray-links", strayLinks.length); rec.f(tag + "-fields", yes(carries));
    return { ok: r.code === 0 && !!prog && fs.existsSync(prog) && rows.length === 1 && shown === wantName && linksOk && !strayLinks.length,
      dir, prog, carries, why: "exit " + r.code + ", the program there " + yes(!!prog && fs.existsSync(prog)) + ", Apps rows " + rows.length
        + ", the row says " + JSON.stringify(shown) + " (want " + JSON.stringify(wantName) + "), its shortcuts to it " + yes(linksOk)
        + ", the other build's shortcuts left " + strayLinks.length };
  };
  /* One start of the installed program as this account, offscreen, its user-data folder named as Electron's own rule picks it
     (%APPDATA%\<package name>), stopped by pid once `done` holds or 90 s pass. */
  const start = async (prog, tag, done) => {
    const env = Object.assign({}, process.env, { STUDIO_TEST_OFFSCREEN: "1", ETIUDA_TEST_DOCUMENTS: docsRoot });
    for (const k of ["STUDIO_PROJECTS", "STUDIO_GATE"]) delete env[k];
    /* HOW A START ENDED (the test architect, 2026-11-17, after run 44061936507 said "it ran no" and could not say why): what the
       copy writes to its standard output and error goes to a file beside legs.txt, and where it leaves by itself the line carries
       its exit code and signal, how long it lived, and how many other processes of the same program were alive at that moment (a
       copy that hands over to another one and leaves looks exactly like one that died). */
    const logName = "start-" + tag + ".log", logFile = path.join(OUT, logName);
    const fd = fs.openSync(logFile, "a");
    env.ELECTRON_ENABLE_LOGGING = "1";
    const opts = { stdio: ["ignore", fd, fd], windowsHide: true, env };
    const args = ["--user-data-dir=" + ud];
    const no = E.shellLaunchRefusal(WHO, args, opts);
    if (no) throw new NoVerdict("the start is refused: " + no[0]);
    const child = spawn(prog, args, opts);
    let gone = false, left = null;
    const t0 = Date.now();
    child.on("exit", (code, signal) => {
      gone = true;
      let others = -1;
      try { others = procsOf(prog).filter((p) => p.pid !== child.pid).length; } catch (e) { others = -1; }
      left = { code, signal, s: Math.round((Date.now() - t0) / 100) / 10, others };
    });
    let held = false, s = -1;
    for (let i = 0; i < 45 && !gone; i++) { await sleep(2000); if (done()) { held = true; s = Math.round((Date.now() - t0) / 1000); break; } }
    if (!gone) E.killTree(child.pid);
    for (const p of procsOf(prog)) E.killTree(p.pid);
    for (let i = 0; i < 15 && procsOf(prog).length; i++) await sleep(1000);
    try { fs.closeSync(fd); } catch (e) { /* closed with the child */ }
    let tail = "";
    try { tail = oneLine(fs.readFileSync(logFile, "utf8").slice(-600)); } catch (e) { tail = "unread: " + e.message; }
    rec.f(tag + "-start-s", s); rec.f(tag + "-ran", yes(!gone || held));
    if (left && !held) {
      rec.f(tag + "-left-code", left.code === null ? "none" : left.code); rec.f(tag + "-left-signal", left.signal || "none");
      rec.f(tag + "-lived-s", left.s); rec.f(tag + "-others-at-exit", left.others); rec.f(tag + "-log", logName); rec.f(tag + "-log-tail", tail || "empty");
    }
    return { held, ran: !gone || held };
  };

  /* 1. The ordinary build, and its first run. */
  const a = await install(NEWER, "ordinary", PRODUCT, ORD_LNK, TS_LNK);
  if (!a.ok) { rec.end(false, "the ordinary build: " + a.why); return; }
  /* The first run takes the full 90 s, as every later start does: that it made no project is judged, and its absence takes the wait. */
  const firstRun = await start(a.prog, "first", () => false);
  if (!firstRun.ran || !firstRan()) throw new NoVerdict("the ordinary build's first run wrote no user data (no Local State), so there is no data to carry");
  const firstMade = projectDirs();
  rec.f("first-made-project", yes(firstMade.length > 0));
  if (firstMade.length) { rec.end(false, "the ordinary build's first run made a project nobody asked for: " + few(firstMade)); return; }
  fs.writeFileSync(marker, crypto.randomBytes(4096));
  const markSha = E.sha256(marker);
  const before = steady(manifest(ud));
  rec.f("userdata-files", Object.keys(before).length);

  /* The data after an install and a start: nothing of `before` gone, the marker byte for byte, and no project folder nobody made. */
  const carried = async (tag, prog) => {
    const ran = (await start(prog, tag, () => false)).ran; /* the full 90 s: a project made by a start is the fault, so its absence takes the wait */
    const now = steady(manifest(ud));
    const gone = Object.keys(before).filter((k) => !(k in now));
    const markerSame = shaOr(marker) === markSha;
    const made = projectDirs().length > 0;
    rec.f(tag + "-gone", gone.length ? few(gone) : 0); rec.f(tag + "-marker", markerSame ? "same" : "differs"); rec.f(tag + "-made-project", yes(made));
    return { ok: ran && !gone.length && markerSame && !made,
      why: "it ran " + yes(ran) + ", files of the first run gone " + gone.length + (gone.length ? " (" + few(gone) + ")" : "") + ", the marker " + (markerSame ? "same" : "differs")
        + ", a project nobody made " + yes(made) };
  };

  /* 2. The Test Service build over it. */
  const b = await install(ts, "ts", PRODUCT + TS_SUFFIX, TS_LNK, ORD_LNK);
  const bSame = samePath(b.dir, a.dir);
  rec.f("ts-same-folder", yes(bSame));
  if (!b.ok || !bSame || !b.carries) { rec.end(false, "the Test Service build over the ordinary one: " + b.why + ", the same folder " + yes(bSame) + ", the fields in its asar " + yes(b.carries)); return; }
  const bData = await carried("ts", b.prog);
  if (!bData.ok) { rec.end(false, "the Test Service build over the ordinary one installed, but its start and the data: " + bData.why); return; }

  /* 3. The ordinary build again. */
  const c = await install(NEWER, "back", PRODUCT, ORD_LNK, TS_LNK);
  const cSame = samePath(c.dir, a.dir);
  rec.f("back-same-folder", yes(cSame));
  if (!c.ok || !cSame || c.carries) { rec.end(false, "the ordinary build over the Test Service one: " + c.why + ", the same folder " + yes(cSame) + ", the fields gone from its asar " + yes(!c.carries)); return; }
  const cData = await carried("back", c.prog);
  rec.end(cData.ok, cData.ok
    ? "ordinary, then Test Service, then ordinary, each into " + a.dir + " with one Apps row naming it and its own shortcuts alone; the user-data folder carried whole (marker byte for byte, nothing of the first run gone) and no project made by any start"
    : "back on the ordinary build, its start and the data: " + cData.why);
}

/* ---- desk-assoc-kept: Studio's install and uninstall leave the desk's registry as it was ---------------------------- */

/* Studio's installer takes the engine's customUnInstall from the pin, and since the engine's fold 83 that macro does registry work
   for the desk's .ec extension, the etiuda: link and the Run value (Studio fold 57d, installer-writes 1e). Whatever the source says,
   this measures it: the desk's association, as the desk's installer writes it for one account and for all users (the class
   "Etiuda catalog", .ec naming it with an OpenWithProgids entry, the etiuda: scheme, each opening the desk's program), and a Run
   value of the desk's, are planted on this runner; Studio is installed and uninstalled for this account, then for all users; every
   planted key is read back whole (reg query /s) after each and must be byte for byte what it was. Nothing is written but the plant,
   which the leg removes after. */
async function deskAssocKept(rec) {
  const DESK = "C:\\Program Files\\Etiuda\\Etiuda.exe", CLASS = "Etiuda catalog", OPEN = '"' + DESK + '" "%1"';
  const RUN = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", RUN_NAME = "com.etiuda.desk";
  const tops = [], adds = [];
  for (const hive of ["HKCU", "HKLM"]) {
    const c = hive + "\\Software\\Classes";
    tops.push(c + "\\.ec", c + "\\" + CLASS, c + "\\etiuda");
    adds.push([c + "\\.ec", null, CLASS], [c + "\\.ec\\OpenWithProgids", CLASS, ""], [c + "\\" + CLASS, null, "Etiuda catalog file"],
      [c + "\\" + CLASS + "\\shell\\open\\command", null, OPEN], [c + "\\etiuda", null, "URL:etiuda"], [c + "\\etiuda", "URL Protocol", ""],
      [c + "\\etiuda\\shell\\open\\command", null, OPEN]);
  }
  const view = (k) => (/^HKLM/.test(k) ? ["/reg:64"] : []);
  for (const k of tops) if (G.regQuery(k).present) throw new NoVerdict(k + " is already on this runner, so the desk's association cannot be planted clean");
  if (valueOf(RUN, RUN_NAME)) throw new NoVerdict(RUN + " already holds " + RUN_NAME);
  rec.after("plant", () => {
    const left = [];
    for (const k of tops) { const r = spawnSync("reg", ["delete", k, "/f"].concat(view(k)), { windowsHide: true, timeout: 30000 }); if (r.status !== 0) left.push(k); }
    spawnSync("reg", ["delete", RUN, "/v", RUN_NAME, "/f"], { windowsHide: true, timeout: 30000 });
    return left.length ? "left " + left.join(",") : "removed";
  });
  for (const [k, name, data] of adds.concat([[RUN, RUN_NAME, '"' + DESK + '" --hidden']])) {
    const r = spawnSync("reg", ["add", k].concat(name === null ? ["/ve"] : ["/v", name], ["/t", "REG_SZ", "/d", data, "/f"], view(k)), { encoding: "utf8", windowsHide: true, timeout: 30000 });
    if (r.status !== 0) throw new NoVerdict("the plant was refused at " + k + ": " + oneLine(r.stderr || r.stdout));
  }
  const snap = () => tops.map((k) => {
    const r = spawnSync("reg", ["query", k, "/s"].concat(view(k)), { encoding: "utf8", windowsHide: true, timeout: 30000 });
    return k + "\n" + (r.status === 0 ? String(r.stdout).replace(/\r/g, "").trim() : "absent");
  }).join("\n\n") + "\n\nRUN " + valueOf(RUN, RUN_NAME);
  const before = snap();
  rec.f("planted-keys", tops.length); rec.f("planted-values", adds.length + 1);
  const changed = (tag) => {
    const now = snap();
    if (now === before) return "";
    const b = before.split("\n"), n = now.split("\n");
    return b.filter((l) => n.indexOf(l) < 0).slice(0, 3).map((l) => "lost " + oneLine(l)).concat(n.filter((l) => b.indexOf(l) < 0).slice(0, 3).map((l) => "new " + oneLine(l))).join("; ") || tag + " reordered";
  };
  /* For this account. */
  rec.after("uninstall-user", uninstallUser);
  const ua = P.installArgs({ mode: "user" }), ub = P.argsFault(ua, "user");
  if (ub) throw new Error("refusing " + ua.join(" ") + ": " + ub);
  const ui = await runExe(NEWER, ua, 600000);
  const udir = userDir();
  rec.f("user-install-exit", ui.timedOut ? "timeout" : ui.code);
  if (ui.code !== 0 || !udir) throw new NoVerdict("Studio did not install for this account (exit " + ui.code + "), so the leg never reached its subject");
  const afterUserInstall = changed("user install");
  const uu = await uninstallUser();
  const afterUser = changed("user uninstall");
  rec.f("user-uninstall", uu); rec.f("after-user-install", afterUserInstall || "same"); rec.f("after-user-uninstall", afterUser || "same");
  /* For all users. */
  await installMachine(rec, NEWER, "machine-install");
  const afterMachineInstall = changed("machine install");
  const mu = await uninstallMachine();
  const afterMachine = changed("machine uninstall");
  rec.f("machine-uninstall", mu); rec.f("after-machine-install", afterMachineInstall || "same"); rec.f("after-machine-uninstall", afterMachine || "same");
  const ok = !afterUserInstall && !afterUser && !afterMachineInstall && !afterMachine;
  rec.end(ok, (ok ? "" : "not held: ") + "the desk's .ec association, its etiuda: link and its Run value, planted for this account and for all users, read back "
    + (ok ? "byte for byte unchanged" : "changed") + " after Studio's install and uninstall for this account and for all users"
    + (ok ? "" : " (" + [afterUserInstall, afterUser, afterMachineInstall, afterMachine].filter(Boolean).join(" | ") + ")"));
}

/* ---- ts-uninstall: the Test Service build over the ordinary one, then its uninstall, leaves no shortcut ------------- */

/* Ported from the engine's leg (engine tools/runner/installer-legs.mjs, green on the runner at 8700a8e0, run 44714397115) by the
   test architect, 2026-11-21: Studio's installer includes the pinned .installer-hooks.nsh, whose customUnInstall carries the
   mend below. The engine's words follow.
   The test architect, 2026-11-17, with the lead engineer's mend 99af1574 (shell/installer.nsh, customUnInstall removes the
   shortcuts of its own build's name). The two builds share one registration key, and the stock uninstaller reads the shortcut's
   name back from that key's ShortcutName, falling back to the ordinary product's where the value is absent; on Max's desk that
   morning an uninstall of the Test Service build left "... Test Service.lnk" on the desktop and in the Start menu. Two passes,
   each for this account, each the order of his use (the ordinary build, the Test Service build over it, then the uninstall
   from the entry's own uninstaller):
     plain     the registration as the installer left it;
     no-name   the registration's ShortcutName value deleted before the uninstall, which is the case that failed.
   A pass holds where, after the uninstall and BEFORE any sweep, neither build's shortcut stands on this account's desktop or
   in its Start menu, the folder is gone and neither per-user key stands. A pass that never had the Test Service shortcut to
   lose gives no verdict. Before the mend the pass no-name is the red one (the stock deletion takes the ordinary name and the
   Test Service shortcut stays); the pass plain shows the mend costs nothing where the value is there. No copy is started, so
   the window wall is not met. What an UPDATE keeps (its own shortcuts, after one build is installed over the other) is
   ts-cycle's and all-upgrade's to hold. */
async function tsUninstall(rec) {
  if (!PLACES.desktop || !PLACES.programs) throw new NoVerdict("this account's Desktop or Programs folder cannot be named");
  const ts = tsSetup(rec);
  rec.after("uninstall", uninstallUser);
  const ORD_LNK = SHORTCUT, TS_LNK = PRODUCT + TS_SUFFIX + ".lnk";
  const there = (name) => userLinks(name).filter((f) => fs.existsSync(f));
  const install = async (exe, tag) => {
    const args = P.installArgs({ mode: "user" });
    const bad = P.argsFault(args, "user");
    if (bad) throw new Error("refusing " + args.join(" ") + ": " + bad);
    const r = await runExe(exe, args, 600000);
    const dir = userDir();
    rec.f(tag + "-exit", r.timedOut ? "timeout" : r.code);
    if (r.code !== 0 || !dir || !fs.existsSync(path.join(dir, PRODUCT + ".exe")))
      throw new NoVerdict(tag + " did not install for this account (exit " + r.code + ", InstallLocation " + JSON.stringify(dir || null) + "), so the pass never reached its subject");
    return dir;
  };
  const pass = async (tag, strip) => {
    await install(NEWER, tag + "-ordinary");
    const dir = await install(ts, tag + "-ts");
    const had = there(TS_LNK), stray = there(ORD_LNK);
    rec.f(tag + "-ts-links", had.length); rec.f(tag + "-ordinary-links-before", stray.length);
    if (!had.length) throw new NoVerdict("pass " + tag + ": the Test Service build over the ordinary one made no shortcut of its own name, so there is none to lose");
    const key = regKey(KU.install);
    const named = valueOf(key, "ShortcutName");
    rec.f(tag + "-registered-name", named);
    if (strip) {
      if (!named) throw new NoVerdict("pass " + tag + ": the registration carries no ShortcutName to take away");
      const d = spawnSync("reg", ["delete", key, "/v", "ShortcutName", "/f"], { encoding: "utf8", windowsHide: true, timeout: 30000 });
      const after = valueOf(key, "ShortcutName");
      rec.f(tag + "-name-deleted", yes(d.status === 0 && !after));
      if (d.status !== 0 || after) throw new NoVerdict("pass " + tag + ": the ShortcutName value could not be deleted (reg exit " + d.status + ")");
    }
    const un = exeOf(valueOf(regKey(KU.uninstall), "UninstallString")) || path.join(dir, UNINSTALLER);
    if (!un || !fs.existsSync(un)) throw new NoVerdict("pass " + tag + ": the entry names no uninstaller that exists (" + JSON.stringify(un) + ")");
    const r = await runExe(un, P.uninstallArgs("user"), 300000);
    const gone = await goneWithin(dir, 120);
    /* Read before anything is swept: what the uninstaller itself left. */
    const leftTs = there(TS_LNK), leftOrd = there(ORD_LNK);
    const keys = [KU.uninstall, KU.install].map(regKey).filter((k) => present(k));
    rec.f(tag + "-un-exit", r.timedOut ? "timeout" : r.code); rec.f(tag + "-folder-gone-s", gone);
    rec.f(tag + "-ts-links-left", leftTs.length ? few(leftTs) : 0); rec.f(tag + "-ordinary-links-left", leftOrd.length ? few(leftOrd) : 0);
    rec.f(tag + "-keys-left", keys.length ? few(keys) : 0);
    const ok = !r.timedOut && gone > 0 && !leftTs.length && !leftOrd.length && !keys.length;
    /* The next pass starts from nothing: what this one left is taken away here, by name, and said. */
    rec.f(tag + "-tidy", oneLine(await uninstallUser()));
    return { ok, why: "pass " + tag + ": uninstaller exit " + (r.timedOut ? "none within 5 min" : r.code) + ", the folder " + (gone > 0 ? "gone" : "still there")
      + ", Test Service shortcuts left " + leftTs.length + " of " + had.length + ", ordinary shortcuts left " + leftOrd.length + ", per-user keys left " + keys.length };
  };
  const plain = await pass("plain", false);
  const bare = await pass("no-name", true);
  rec.end(plain.ok && bare.ok, plain.ok && bare.ok
    ? "the ordinary build, the Test Service build over it, then the uninstall from its entry: no shortcut of either name on the desktop or in the Start menu, the folder and both per-user keys gone, with the registration's ShortcutName as installed and with it deleted"
    : [plain, bare].filter((p) => !p.ok).map((p) => p.why).join("; "));
}

/* ---- (d) locked-1618 ------------------------------------------------------------------------------------------- */

async function locked1618(rec) {
  const old = olderSetup(rec);
  const dir = await installMachine(rec, old, "n");
  const heldRel = "resources\\app.asar", held = path.join(dir, heldRel);
  if (!fs.existsSync(held)) throw new NoVerdict("the installed copy has no " + heldRel + " to hold");
  const unRel = UNINSTALLER.toLowerCase();
  const before = manifest(dir), fresh = newBuild();
  const newKnown = Object.keys(fresh).length > 0;
  if (newKnown && !manifestDiff(before, fresh, unRel).changed.length && !manifestDiff(before, fresh, unRel).gone.length)
    throw new NoVerdict("version N's files are the newer build's, so whole and new cannot be told apart");

  /* The file held open with no sharing, by a child of this run, stopped by its pid. */
  const signal = path.join(LAB, "held.txt");
  const holder = spawn("powershell.exe", PS_HEAD.concat([psFile("hold"), "-Target", held, "-Signal", signal]), { windowsHide: true, stdio: "ignore" });
  let holderGone = false;
  holder.on("exit", () => { holderGone = true; });
  rec.after("holder", () => (holderGone ? "had ended" : E.killTree(holder.pid).how));
  for (let i = 0; i < 60 && !fs.existsSync(signal); i++) await sleep(500);
  /* Held means another process cannot open it: a second PowerShell's read open, every sharing allowed, refused by the holder's
     no-sharing open. Node's own open is recorded beside it and decides nothing: on the runner it went through a held file while
     the second process was refused for a sharing violation (run 43357213052, cause not named). */
  let openSaid = "opened";
  try { fs.closeSync(fs.openSync(held, "r")); } catch (e) { openSaid = e.code || e.message; }
  const otherSaid = oneLine(ps("tryopen", ["-Target", held]));
  const heldNow = /^refused: /.test(otherSaid) && /being used by another process/i.test(otherSaid);
  let holderSaid = "no word in 30 s";
  try { holderSaid = oneLine(fs.readFileSync(signal, "utf8")) || "an empty word"; } catch { /* none came */ }
  rec.f("held", heldRel); rec.f("held-confirmed", yes(heldNow)); rec.f("holder-said", holderSaid);
  rec.f("holder-running", yes(!holderGone)); rec.f("open-here", openSaid);
  rec.f("open-other-process", otherSaid);
  if (!heldNow) throw new NoVerdict("the file did not stay held (a second process's open: " + otherSaid + "); the holder said "
    + JSON.stringify(holderSaid) + " and was " + (holderGone ? "gone" : "still running"));

  const r = await runExe(NEWER, P.installArgs({ mode: "machine" }), 900000);
  if (!holderGone) E.killTree(holder.pid);
  await sleep(1500);
  const now = manifest(dir);
  const d = manifestDiff(before, now, unRel);
  const whole = !d.changed.length && !d.gone.length && !d.added.length;
  const nd = newKnown ? manifestDiff(fresh, now, unRel) : null;
  const fullyNew = !!nd && !nd.changed.length && !nd.gone.length && !nd.added.length;
  const un = exeOf(valueOf(regKey(KM.uninstall), "UninstallString"));
  rec.f("exit", r.timedOut ? "timeout" : r.code); rec.f("seconds", r.seconds); rec.f("changed", d.changed.length ? few(d.changed) : 0);
  rec.f("gone", d.gone.length ? few(d.gone) : 0); rec.f("added", d.added.length ? few(d.added) : 0); rec.f("whole", yes(whole));
  rec.f("fully-new", newKnown ? yes(fullyNew) : "unknown"); rec.f("uninstaller-changed", yes(before[unRel] !== now[unRel]));
  rec.f("entry-starts", yes(!!un && fs.existsSync(un)));
  if (!whole && !newKnown) throw new NoVerdict("the copy changed and the newer build's own files (win-unpacked) are not here to say whether it is whole new or a mix");
  if (!whole && !fullyNew) { rec.end(false, "a mix: " + (d.changed.length + d.gone.length + d.added.length) + " file(s) differ from N and the copy is not the new version either (exit " + r.code + ")"); return; }
  if (r.code === 1618) { rec.end(true, "1618 at a held file, and the installed copy is " + (whole ? "whole, as N left it" : "fully the new version")); return; }
  if (r.code === 0 && fullyNew) throw new NoVerdict("the held file did not stop the install: exit 0 and the copy is fully new, so the lock never bit");
  rec.end(false, "exit " + (r.timedOut ? "none within 15 min" : r.code) + " where 1618 was wanted; the copy is " + (whole ? "whole" : "fully new"));
}

/* ---- the installer mends' legs: B1, B4 and B5 of the update and install review, the Program Files "..", and the list ---------
   Ported from the engine's tools/runner/installer-legs.mjs (its harness of the mends, green on the engine's runner), with Studio's
   test identity, its offscreen start and ETIUDA_STUDIO_DIST. Named only. Each reads the folder's own list (etiuda-files.ini) by
   itself, never through the tree's code, except list-in-package, which holds the package to the pinned engine's own model of it. */
const ASIDE = ".setup-previous", STAGED = ".setup-staging", FILES_INI = "etiuda-files.ini";
const WIDE = /^(resources|locales)(\\|$)/;
const RUNONCE = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce", RUNONCE_VALUE = T.appId + ".per-user-copy";
/** The [files] keys of a list, lower-cased; null where there is no list. */
function iniFiles(file) {
  let text;
  try { text = fs.readFileSync(file, "utf8"); } catch (e) { return null; }
  const out = new Set();
  let sect = "";
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim(), h = /^\[([^\]]*)\]$/.exec(line), eq = line.indexOf("=");
    if (h) sect = h[1].toLowerCase();
    else if (sect === "files" && eq > 0) out.add(line.slice(0, eq).trim().toLowerCase());
  }
  return out;
}
/** The [list] entries in order, as written. */
function iniListed(file) {
  const out = [];
  let sect = "";
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim(), h = /^\[([^\]]*)\]$/.exec(line), eq = line.indexOf("=");
    if (h) sect = h[1].toLowerCase();
    else if (sect === "list" && eq > 0) out.push(line.slice(eq + 1).trim());
  }
  return out;
}
const isLink = (p) => { try { return fs.lstatSync(p).isSymbolicLink(); } catch (e) { return false; } };
const holds = (p, text) => { try { return fs.readFileSync(p, "utf8") === text; } catch (e) { return false; } };
const numberedAsides = (dir) => { const out = []; for (let i = 1; i <= 9; i++) if (fs.existsSync(dir + ASIDE + "." + i)) out.push(i); return out; };
/** Where a planted file is now: the folder, the copy aside, a numbered copy aside, or gone. */
function whereIs(dir, rel) {
  if (fs.existsSync(path.join(dir, rel))) return "folder";
  if (fs.existsSync(path.join(dir + ASIDE, rel))) return "aside";
  for (const i of numberedAsides(dir)) if (fs.existsSync(path.join(dir + ASIDE + "." + i, rel))) return "aside." + i;
  return "gone";
}
PS.under = ["param([string]$Prefix)", "$p = $Prefix.TrimEnd('\\') + '\\'",
  "@(Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -and $_.ExecutablePath.StartsWith($p, [StringComparison]::OrdinalIgnoreCase) } | ForEach-Object { [string]$_.ProcessId + ' ' + $_.Name }) -join ', '"];
fs.writeFileSync(psFile("under"), PS.under.join("\r\n"), "utf8");
async function installUser(rec, exe, tag) {
  const args = P.installArgs({ mode: "user" });
  const bad = P.argsFault(args, "user");
  if (bad) throw new Error("refusing " + args.join(" ") + ": " + bad);
  const r = await runExe(exe, args, 600000);
  const dir = userDir();
  rec.f(tag + "-exit", r.timedOut ? "timeout" : r.code);
  return { code: r.timedOut ? "timeout" : r.code, dir, ok: r.code === 0 && !!dir && fs.existsSync(path.join(dir, PRODUCT + ".exe")) };
}
/** One start of the installed Studio as this account, offscreen (as ts-cycle starts it), stopped by pid after `seconds` or once `done` holds. */
async function startStudio(rec, prog, tag, seconds, done) {
  const ud = path.join(process.env.APPDATA, T.packageName), docsRoot = path.join(LAB, tag + "-documents");
  fs.mkdirSync(docsRoot, { recursive: true });
  const env = Object.assign({}, process.env, { STUDIO_TEST_OFFSCREEN: "1", ETIUDA_TEST_DOCUMENTS: docsRoot });
  for (const k of ["STUDIO_PROJECTS", "STUDIO_GATE"]) delete env[k];
  const logName = "start-" + tag + ".log", fd = fs.openSync(path.join(OUT, logName), "a");
  env.ELECTRON_ENABLE_LOGGING = "1";
  const opts = { stdio: ["ignore", fd, fd], windowsHide: true, env };
  const args = ["--user-data-dir=" + ud];
  const no = E.shellLaunchRefusal(WHO, args, opts);
  if (no) { try { fs.closeSync(fd); } catch (e) { /* closed */ } throw new NoVerdict("Studio's start is refused: " + no[0]); }
  const t0 = Date.now(), child = spawn(prog, args, opts);
  let gone = false;
  child.on("exit", () => { gone = true; });
  let held = -1;
  for (let i = 0; i < seconds; i++) { await sleep(1000); if (done && done()) { held = Math.round((Date.now() - t0) / 1000); break; } if (gone) break; }
  const up = !gone;
  if (!gone) E.killTree(child.pid);
  for (const p of procsOf(prog)) E.killTree(p.pid);
  for (let i = 0; i < 15 && procsOf(prog).length; i++) await sleep(1000);
  try { fs.closeSync(fd); } catch (e) { /* closed with the child */ }
  rec.f(tag + "-studio-up", yes(up)); rec.f(tag + "-done-s", held); rec.f(tag + "-log", logName);
  return { up, held };
}

/* list-in-package (B5's prerequisite, Studio's own): "a Studio built against a pin from 22d3af9c on writes the install's own list".
   The newer build of this run: win-unpacked holds etiuda-files.ini; the pinned engine's own model of the installer's check
   (shell/install-files.cjs stageProblems) finds nothing wrong over win-unpacked; every file in win-unpacked but the list is listed,
   at its size; and the build's log says "etiuda-files.ini: <n> files listed" twice, once after the pack and once after signing,
   both the same n. The runner's build is unsigned, so a signing that changes sizes is not reached here; electron-builder still
   edits the program's resources before afterSign, and that is reached. */
async function listInPackage(rec) {
  const wu = path.join(DIST, "win-unpacked"), ini = path.join(wu, FILES_INI);
  const writer = path.join(ROOT, "engine", "pinned", "shell", "install-files.cjs");
  if (!fs.existsSync(writer)) throw new NoVerdict("the pin carries no shell/install-files.cjs here (tools/engine-modules.txt, or a pin before the list), so there is no model to hold the package to");
  const M = require(writer);
  const said = (BUILD_LOG.match(/etiuda-files\.ini: (\d+) files listed/g) || []).map((l) => Number(/(\d+)/.exec(l)[1]));
  rec.f("log-lines", said.length); rec.f("log-counts", said.join(",") || "-");
  const there = fs.existsSync(ini);
  rec.f("list-in-package", yes(there));
  if (!there) { rec.end(false, "the newer build's win-unpacked holds no " + FILES_INI + " (the log said it " + said.length + " time(s))"); return; }
  const text = fs.readFileSync(ini, "utf8");
  const problems = M.stageProblems(text, (rel) => { try { return fs.statSync(path.join(wu, rel)).size; } catch (e) { return null; } });
  const listed = iniFiles(ini), files = Object.keys(manifest(wu)).filter((k) => k !== FILES_INI);
  const unlisted = files.filter((k) => !listed.has(k)), extra = [...listed].filter((k) => files.indexOf(k) < 0);
  rec.f("stage-problems", problems.length ? few(problems) : 0); rec.f("listed", listed.size); rec.f("files", files.length);
  rec.f("unlisted", unlisted.length ? few(unlisted) : 0); rec.f("listed-not-there", extra.length ? few(extra) : 0);
  const ok = !problems.length && !unlisted.length && !extra.length && said.length === 2 && said[0] === said[1] && said[1] === listed.size;
  rec.end(ok, ok ? "the newer build carries " + FILES_INI + " naming all " + listed.size + " files at their sizes, the pinned model finds the stage whole, and the build wrote it after the pack and after signing"
    : "the list: problems " + problems.length + ", unlisted files " + unlisted.length + ", listed but absent " + extra.length + ", the log's lines " + said.length + " (" + (said.join(",") || "none") + ") against " + listed.size + " listed");
}

/* short-stage (B5): "an update is swapped in only when every packaged file is present at its exact size". A second build of this
   tree whose package lacks one listed file (its list still naming it), run with /S over N for all users: exit 2, N's files and
   DisplayVersion as they were, and no staging folder left beside it. */
function shortSetup(rec) {
  const ini = path.join(DIST, "win-unpacked", FILES_INI);
  if (!fs.existsSync(ini)) throw new NoVerdict("the build under test wrote no " + FILES_INI + " into its package, so no short stage can be made from it");
  const listed = iniListed(ini);
  const sizes = listed.map((rel) => { try { return { rel, size: fs.statSync(path.join(DIST, "win-unpacked", rel)).size }; } catch (e) { return null; } }).filter(Boolean);
  const pick = sizes.find((s) => s.rel.toLowerCase() === "license.electron.txt")
    || sizes.filter((s) => !/\\/.test(s.rel) && !/\.exe$/i.test(s.rel)).sort((a, b) => a.size - b.size)[0];
  if (!pick) throw new NoVerdict("the list names no file at the package's root to leave out");
  const out = path.join(LAB, "dist-short"), cfg = path.join(LAB, "short-stage.cjs"), stash = path.join(LAB, "short-stage-stash.bin");
  /* Left out after the list is written, at each of the two writes, so the list still names it: the hooks are the build's own. */
  fs.writeFileSync(cfg, ['"use strict";', 'const fs = require("node:fs"), path = require("node:path");',
    "const base = require(" + JSON.stringify(path.join(ROOT, "tools", "electron-builder-test.cjs")) + ");",
    "const REL = " + JSON.stringify(pick.rel) + ", STASH = " + JSON.stringify(stash) + ";",
    'if (typeof base.afterPack !== "function" || typeof base.afterSign !== "function") throw new Error("short-stage: the build has no afterPack and afterSign hooks");',
    "const at = (c) => path.join(c.appOutDir, REL);",
    "module.exports = Object.assign({}, base, {",
    "  afterPack: async (c) => { await base.afterPack(c); if (fs.existsSync(at(c))) { fs.copyFileSync(at(c), STASH); fs.unlinkSync(at(c)); } },",
    "  afterSign: async (c) => { if (!fs.existsSync(at(c)) && fs.existsSync(STASH)) fs.copyFileSync(STASH, at(c)); await base.afterSign(c); if (fs.existsSync(at(c))) fs.unlinkSync(at(c)); },",
    "});", ""].join("\n"));
  const cli = path.join(ROOT, "node_modules", "electron-builder", "out", "cli", "cli.js");
  try {
    execFileSync(process.execPath, [cli, "--win", "--config", cfg], { cwd: ROOT, stdio: "inherit", env: Object.assign(withoutSigning(), { ETIUDA_STUDIO_DIST: out }) });
  } catch (e) { throw new NoVerdict("the short build could not be made: " + oneLine(e.message)); }
  const found = fs.existsSync(out) ? fs.readdirSync(out).filter((n) => /-setup\.exe$/i.test(n)) : [];
  if (found.length !== 1) throw new NoVerdict(out + " holds " + found.length + " installers; expected 1");
  const exe = path.join(out, found[0]);
  const no = G.setupRefusal(G.setupIdentity(exe), "studio");
  if (no) throw new NoVerdict("the short setup is refused before it runs: " + no);
  const shortIni = path.join(out, "win-unpacked", FILES_INI);
  const stillListed = fs.existsSync(shortIni) && iniListed(shortIni).some((r) => r.toLowerCase() === pick.rel.toLowerCase());
  const left = !fs.existsSync(path.join(out, "win-unpacked", pick.rel));
  rec.f("left-out", pick.rel); rec.f("left-out-bytes", pick.size); rec.f("short-still-listed", yes(stillListed)); rec.f("short-file-absent", yes(left));
  if (!stillListed || !left) throw new NoVerdict("the short build is not short as meant: listed " + yes(stillListed) + ", absent " + yes(left));
  return exe;
}
async function shortStage(rec) {
  const old = olderSetup(rec);
  const short = shortSetup(rec);
  const dir = await installMachine(rec, old, "n");
  const before = manifest(dir), dv = valueOf(regKey(KM.uninstall), "DisplayVersion");
  const r = await runExe(short, ["/S"], 600000);
  const d = manifestDiff(before, manifest(dir));
  const facts = { exit: r.timedOut ? "timeout" : r.code, same: !d.changed.length && !d.gone.length && !d.added.length,
    dv: valueOf(regKey(KM.uninstall), "DisplayVersion") === dv && !!dv, staged: fs.existsSync(dir + STAGED) };
  rec.f("exit", facts.exit); rec.f("files-as-they-were", yes(facts.same)); rec.f("changed", few(d.changed.concat(d.gone, d.added)) || 0);
  rec.f("displayversion", dv); rec.f("displayversion-kept", yes(facts.dv)); rec.f("staging-left", yes(facts.staged));
  const ok = facts.exit === 2 && facts.same && facts.dv && !facts.staged;
  rec.end(ok, ok ? "a package one listed file short was refused with 2 over N: N's files and DisplayVersion as they were, no staging folder left"
    : "the short package: exit " + facts.exit + " (2 wanted), files as they were " + yes(facts.same) + ", DisplayVersion kept " + yes(facts.dv) + ", staging left " + yes(facts.staged));
}

/* pre-own-survives (B1): "an install or an update never removes what it did not put there". N for all users into an empty folder;
   a person's file, a folder of theirs, a file of theirs inside the program's resources folder and a junction of theirs are put in
   it; N+1 with a bare /S, then N+1 again (the second swap drops the first's copy aside by its list). Green where both runs exit 0,
   N+1 is in place, and the person's file, folder and junction (its target untouched) are in the folder after each. Where the file
   inside resources is, after each, is recorded: a copy installed before the list counts resources whole (Claude α's one-time
   exception of 2026-11-22 for an install that wrote no list). */
async function preOwnSurvives(rec) {
  const old = olderSetup(rec);
  const A = path.join(LAB, "pre", "app");
  rec.after("uninstall", uninstallMachine);
  const args = P.installArgs({ mode: "machine", dir: A });
  const bad = P.argsFault(args, "machine");
  if (bad) throw new Error("refusing " + args.join(" ") + ": " + bad);
  const r0 = await runExe(old, args, 600000);
  rec.f("n-exit", r0.timedOut ? "timeout" : r0.code);
  if (r0.code !== 0 || !fs.existsSync(path.join(A, PRODUCT + ".exe")) || !P.samePath(machineDir(), A))
    throw new NoVerdict("N did not install for all users into " + A + " (exit " + r0.code + ")");
  rec.f("n-list", yes(fs.existsSync(path.join(A, FILES_INI))));
  const TEXT = "planted by " + WHO + "\n";
  const OWN = "a-persons-own-file.txt", OWN_IN = "a-persons-folder\\inside.txt", IN_RES = "resources\\a-persons-file-in-resources.txt", LINK = "a-persons-link";
  for (const rel of [OWN, OWN_IN, IN_RES]) { fs.mkdirSync(path.dirname(path.join(A, rel)), { recursive: true }); fs.writeFileSync(path.join(A, rel), TEXT); }
  const victimDir = path.join(LAB, "pre-victim"), victim = path.join(victimDir, "must-stay.txt");
  fs.mkdirSync(victimDir, { recursive: true });
  fs.writeFileSync(victim, "must stay\n");
  const mk = spawnSync("cmd.exe", ["/c", "mklink", "/J", path.join(A, LINK), victimDir], { encoding: "utf8", windowsHide: true, timeout: 30000 });
  rec.after("junctions", () => {
    const said = [];
    for (const d of [A, A + ASIDE].concat(numberedAsides(A).map((i) => A + ASIDE + "." + i))) {
      const l = path.join(d, LINK);
      if (isLink(l)) { const r = spawnSync("cmd.exe", ["/c", "rmdir", l], { windowsHide: true, timeout: 30000 }); said.push(path.basename(d) + (r.status === 0 ? " removed" : " refused")); }
    }
    return said.join(",") || "none left";
  });
  if (mk.status !== 0 || !fs.existsSync(path.join(A, LINK, "must-stay.txt"))) throw new NoVerdict("the junction could not be planted (" + oneLine(mk.stderr || mk.stdout) + ")");
  const built = newBuild(), asarTree = built["resources\\app.asar"] || "";
  const shipped = new Set(Object.keys(built).concat([FILES_INI, UNINSTALLER.toLowerCase()]));
  const look = (tag, r) => {
    const f = {
      exit: r.timedOut ? "timeout" : r.code,
      program: fs.existsSync(path.join(A, PRODUCT + ".exe")) && !!asarTree && shaOr(path.join(A, "resources", "app.asar")) === asarTree,
      own: holds(path.join(A, OWN), TEXT), ownIn: holds(path.join(A, OWN_IN), TEXT),
      link: isLink(path.join(A, LINK)), victim: holds(victim, "must stay\n"),
      inRes: whereIs(A, IN_RES), aside: fs.existsSync(path.join(A + ASIDE, PRODUCT + ".exe")), numbered: numberedAsides(A),
    };
    const strays = Object.keys(manifest(A)).filter((k) => !shipped.has(k) && ![OWN, OWN_IN, IN_RES].includes(k));
    rec.f(tag + "-exit", f.exit); rec.f(tag + "-program-new", yes(f.program)); rec.f(tag + "-own-file", yes(f.own)); rec.f(tag + "-own-folder", yes(f.ownIn));
    rec.f(tag + "-junction-in-folder", yes(f.link)); rec.f(tag + "-junction-target-intact", yes(f.victim)); rec.f(tag + "-file-in-resources", f.inRes);
    rec.f(tag + "-aside-holds-program", yes(f.aside)); rec.f(tag + "-numbered-asides", f.numbered.join(",") || "none"); rec.f(tag + "-strays", strays.length ? few(strays) : 0);
    f.ok = f.exit === 0 && f.program && f.own && f.ownIn && f.link && f.victim;
    return f;
  };
  const first = look("n1", await runExe(NEWER, ["/S"], 600000));
  const second = look("n1-again", await runExe(NEWER, ["/S"], 600000));
  const ok = first.ok && second.ok;
  const words = (f) => "exit " + f.exit + ", N+1 in place " + yes(f.program) + ", own file " + yes(f.own) + ", own folder " + yes(f.ownIn)
    + ", junction " + yes(f.link) + ", its target " + yes(f.victim) + ", the file in resources " + f.inRes;
  rec.end(ok, ok ? "N, then N+1 twice with /S: the person's file, folder and junction stayed in the folder each time, the junction's target untouched (the file in resources: "
    + first.inRes + ", then " + second.inRes + ")" : "first update: " + words(first) + "; second: " + words(second));
}

/* foreign-folder-refused (B1): a folder that holds other files and no earlier Studio is refused with 2 before anything is written:
   the file there untouched and alone, nothing staged beside it, nothing registered. An empty folder, the control, installs. */
async function foreignFolderRefused(rec) {
  const F = path.join(LAB, "pre", "theirs"), notes = path.join(F, "notes.txt"), TEXT = "a person's notes\n";
  fs.mkdirSync(F, { recursive: true });
  fs.writeFileSync(notes, TEXT);
  rec.after("uninstall", uninstallMachine);
  const args = P.installArgs({ mode: "machine", dir: F });
  const bad = P.argsFault(args, "machine");
  if (bad) throw new Error("refusing " + args.join(" ") + ": " + bad);
  const r = await runExe(NEWER, args, 600000);
  const facts = { exit: r.timedOut ? "timeout" : r.code, notes: holds(notes, TEXT), alone: fs.readdirSync(F).join(",") === "notes.txt",
    staged: fs.existsSync(F + STAGED), registered: !!valueOf(regKey(KM.uninstall), "DisplayVersion") };
  const Em = path.join(LAB, "pre", "empty");
  fs.mkdirSync(Em, { recursive: true });
  const r2 = facts.registered ? { code: "not run" } : await runExe(NEWER, P.installArgs({ mode: "machine", dir: Em }), 600000);
  const empty = r2.code === 0 && fs.existsSync(path.join(Em, PRODUCT + ".exe"));
  rec.f("exit", facts.exit); rec.f("notes-untouched", yes(facts.notes)); rec.f("folder-holds-only-notes", yes(facts.alone));
  rec.f("staging-beside", yes(facts.staged)); rec.f("registered", yes(facts.registered)); rec.f("empty-folder-exit", r2.timedOut ? "timeout" : r2.code); rec.f("empty-folder-installed", yes(empty));
  const ok = facts.exit === 2 && facts.notes && facts.alone && !facts.staged && !facts.registered && empty;
  rec.end(ok, ok ? "a folder holding a person's file and no Studio was refused with 2, the file untouched and alone, nothing staged or registered; an empty folder installed"
    : "the foreign folder: exit " + facts.exit + " (2 wanted), notes untouched " + yes(facts.notes) + ", alone " + yes(facts.alone) + ", staging beside " + yes(facts.staged)
      + ", registered " + yes(facts.registered) + "; the empty folder installed " + yes(empty));
}

/* old-copy-kept (B5): the old copy stays beside the install until the new one has started. Per user: N, then N+1 with /currentuser;
   the copy aside holds N's program; one start of Studio as this account (its drop runs 10 s after the window), and it loses every
   file its list names (or, from a copy installed before the list, the newer list's files and resources and locales whole),
   resources\app.asar included. All users: N, then N+1 with /S; the copy aside stays after a start by a standard account, which may
   not write there, and the uninstall takes both folders. */
async function oldCopyKept(rec) {
  const wall = windowWallRefusal(WHO);
  if (wall) throw new NoVerdict("the leg starts the installed Studio and the window wall refuses: " + wall[0]);
  if (!process.env.APPDATA) throw new NoVerdict("APPDATA is not set, so Studio's user-data folder cannot be named");
  const old = olderSetup(rec);
  rec.after("uninstall-user", uninstallUser);
  const n = await installUser(rec, old, "u-n");
  if (!n.ok) throw new NoVerdict("N did not install for this account (exit " + n.code + ")");
  const nu = await installUser(rec, NEWER, "u-n1");
  const asideU = n.dir + ASIDE, progU = path.join(n.dir, PRODUCT + ".exe");
  const uHad = fs.existsSync(path.join(asideU, PRODUCT + ".exe"));
  const own = iniFiles(path.join(asideU, FILES_INI));
  const listed = own || iniFiles(path.join(n.dir, FILES_INI)) || new Set();
  const isListed = (k) => listed.has(k) || (!own && WIDE.test(k));
  rec.f("u-aside-after-install", yes(uHad)); rec.f("u-aside-list", own ? "its own" : "the newer, resources and locales whole");
  const start = nu.ok && uHad ? await startStudio(rec, progU, "u", 40, () => !fs.existsSync(asideU)) : { up: false, held: -1 };
  await sleep(2000);
  const leftU = Object.keys(manifest(asideU)), leftListed = leftU.filter(isListed);
  const asarLeft = fs.existsSync(path.join(asideU, "resources", "app.asar"));
  rec.f("u-aside-after-start", fs.existsSync(asideU) ? "there" : "gone"); rec.f("u-aside-left-listed", leftListed.length ? few(leftListed) : 0);
  rec.f("u-aside-left-unlisted", leftU.length - leftListed.length ? few(leftU.filter((k) => !isListed(k))) : 0); rec.f("u-aside-asar-left", yes(asarLeft));
  const uOk = nu.ok && uHad && start.up && leftListed.length === 0 && !asarLeft;
  const uWords = "per user: N+1 exit " + nu.code + ", the copy aside held N's program " + yes(uHad) + ", Studio started " + yes(start.up)
    + ", listed files left in the copy aside after it " + leftListed.length + " (app.asar " + (asarLeft ? "left" : "gone") + ", the copy aside " + (fs.existsSync(asideU) ? "there" : "gone") + ")";
  const uninstalled = await uninstallUser();
  rec.f("u-uninstall", uninstalled);

  const dir = await installMachine(rec, old, "m-n");
  const rm = await runExe(NEWER, ["/S"], 600000);
  const asideM = dir + ASIDE, progM = path.join(dir, PRODUCT + ".exe");
  const mHad = fs.existsSync(path.join(asideM, PRODUCT + ".exe"));
  rec.f("m-n1-exit", rm.timedOut ? "timeout" : rm.code); rec.f("m-aside-after-install", yes(mHad));
  let mStart = "unreached";
  const name = "etst" + crypto.randomInt(10000, 99999);
  let secret = "Aa1!" + crypto.randomBytes(24).toString("base64");
  rec.after("account", () => ps("rmuser", ["-Name", name]));
  const made = ps("mkuser", ["-Name", name], { LEG_PW: secret });
  const right = made === "made" ? ps("batchright", ["-Name", name]) : "no account";
  if (made === "made" && right === "granted" && mHad) {
    const task = "etst-aside-" + name;
    rec.after("task", () => ps("unreg", ["-Task", task]));
    rec.after("person-copy", () => { const left = procsOf(progM).filter((p) => String(p.user).toLowerCase() === name.toLowerCase());
      return left.length ? left.map((p) => p.pid + " " + E.killTree(p.pid).killed).join(",") : "had ended"; });
    const started = ps("runplain", ["-Task", task, "-Name", name, "-Exe", progM], { LEG_PW: secret });
    let up = 0;
    for (let i = 0; i < 30 && started === "started"; i++) { await sleep(1000); if (procsOf(progM).some((p) => String(p.user).toLowerCase() === name.toLowerCase())) up++; }
    for (const p of procsOf(progM).filter((p) => String(p.user).toLowerCase() === name.toLowerCase())) E.killTree(p.pid);
    mStart = started !== "started" ? "refused: " + started : up >= 15 ? "up " + up + " s" : "up only " + up + " s (" + ps("taskinfo", ["-Task", task]) + ")";
  } else mStart = "unreached: account " + made + ", right " + right;
  secret = null;
  const mKept = fs.existsSync(path.join(asideM, PRODUCT + ".exe"));
  rec.f("m-start", mStart); rec.f("m-aside-after-start", yes(mKept));
  for (let i = 0; i < 15 && procsOf(progM).length; i++) await sleep(1000);
  const un = exeOf(valueOf(regKey(KM.uninstall), "UninstallString"));
  const ru = un && fs.existsSync(un) ? await runExe(un, P.uninstallArgs("machine"), 300000) : { code: "no uninstaller" };
  const g1 = await goneWithin(dir, 120), g2 = fs.existsSync(asideM) ? await goneWithin(asideM, 30) : 0;
  rec.f("m-uninstall-exit", ru.code); rec.f("m-folder-gone-s", g1); rec.f("m-aside-gone-s", g2);
  const startReached = /^up \d+ s$/.test(mStart);
  const mOk = rm.code === 0 && mHad && (!startReached || mKept) && g1 > 0 && g2 >= 0;
  const mWords = "all users: N+1 exit " + rm.code + ", the copy aside held N's program " + yes(mHad) + ", after a standard account's start (" + mStart + ") it "
    + (mKept ? "stayed" : "was gone") + ", the uninstall took the folder " + yes(g1 > 0) + " and the copy aside " + yes(g2 >= 0);
  rec.end(uOk && mOk, uWords + "; " + mWords + (startReached ? "" : "; the start as a standard account was not reached, so that part has no verdict"));
}

/* per-user-at-sign-in (B4): an all-users install started elevated over this account's per-user copy writes one RunOnce value in
   HKCU, that copy's own UninstallString followed by /currentuser /S /KEEP_APP_DATA, writes no value under the desk's name, and
   runs nothing from the per-user folder. A hosted runner cannot sign in again, so Explorer's reading of RunOnce at a sign-in is not
   reached: the leg runs the value's command line itself with a restricted token (runas /trustlevel, Administrators for deny only),
   and wants exit 0, the per-user folder and HKCU entry gone, a file in the account's data folder kept, and the all-users copy and
   its shortcuts intact. */
async function perUserAtSignIn(rec) {
  if (!process.env.APPDATA) throw new NoVerdict("APPDATA is not set, so the account's data folder cannot be named");
  const old = olderSetup(rec);
  const TI = require(path.join(ROOT, "tools", "test-identity.cjs"));
  const DESK_VALUES = [TI.SHIPPED.desk, TI.TEST.desk].filter(Boolean).map((d) => d.appId + ".per-user-copy");
  for (const v of [RUNONCE_VALUE].concat(DESK_VALUES)) if (valueOf(RUNONCE, v)) throw new NoVerdict(RUNONCE + " already holds " + v);
  rec.after("runonce", () => { const said = [];
    for (const v of [RUNONCE_VALUE].concat(DESK_VALUES)) if (valueOf(RUNONCE, v)) { const r = spawnSync("reg", ["delete", RUNONCE, "/v", v, "/f"], { windowsHide: true, timeout: 30000 }); said.push(v + (r.status === 0 ? " deleted" : " refused")); }
    return said.join(",") || "none left"; });
  rec.after("uninstall-user", uninstallUser);
  const n = await installUser(rec, old, "n");
  if (!n.ok) throw new NoVerdict("N did not install for this account (exit " + n.code + ")");
  const ud = path.join(process.env.APPDATA, T.packageName), marker = path.join(ud, "per-user-at-sign-in-marker.txt");
  const madeUd = !fs.existsSync(ud);
  fs.mkdirSync(ud, { recursive: true });
  fs.writeFileSync(marker, "kept\n");
  rec.after("marker", () => { try { fs.unlinkSync(marker); if (madeUd) fs.rmdirSync(ud); return "removed"; } catch (e) { return "left: " + e.code; } });

  rec.after("uninstall", uninstallMachine);
  const seen = new Set();
  let watching = true;
  const watch = (async () => { while (watching) { const s = ps("under", ["-Prefix", n.dir]); if (s && !/^no answer/.test(s)) s.split(", ").forEach((x) => seen.add(x)); await sleep(500); } })();
  const r = await runExe(NEWER, P.installArgs({ mode: "machine" }), 600000);
  watching = false;
  await watch;
  const value = valueOf(RUNONCE, RUNONCE_VALUE), unStr = valueOf(regKey(KU.uninstall), "UninstallString");
  const deskWritten = DESK_VALUES.filter((v) => valueOf(RUNONCE, v));
  const mdir = machineDir();
  const install = {
    exit: r.timedOut ? "timeout" : r.code, value: !!value, starts: !!unStr && value.startsWith(unStr),
    ends: / \/currentuser \/S \/KEEP_APP_DATA$/.test(value), ranNothing: seen.size === 0, desk: deskWritten.length === 0,
    perUser: fs.existsSync(path.join(n.dir, PRODUCT + ".exe")) && present(regKey(KU.uninstall)),
    allUsers: !!mdir && fs.existsSync(path.join(mdir, PRODUCT + ".exe")),
  };
  rec.f("exit", install.exit); rec.f("runonce", value); rec.f("starts-with-uninstallstring", yes(install.starts)); rec.f("ends-with-switches", yes(install.ends));
  rec.f("desk-value-written", deskWritten.length ? deskWritten.join(",") : "no");
  rec.f("ran-from-per-user-folder", seen.size ? few([...seen]) : "nothing"); rec.f("per-user-copy-still-there", yes(install.perUser)); rec.f("all-users-copy", yes(install.allUsers));
  const installOk = install.exit === 0 && install.value && install.starts && install.ends && install.ranNothing && install.desk && install.perUser && install.allUsers;
  if (!installOk) {
    rec.end(false, "the elevated all-users install: exit " + install.exit + ", RunOnce value " + yes(install.value) + ", starting with the HKCU UninstallString " + yes(install.starts)
      + ", ending /currentuser /S /KEEP_APP_DATA " + yes(install.ends) + ", nothing run from the per-user folder " + yes(install.ranNothing)
      + ", no value under the desk's name " + yes(install.desk) + ", the per-user copy left for it " + yes(install.perUser) + ", the all-users copy " + yes(install.allUsers));
    return;
  }

  /* The sign-in's stand-in: the value's own command line, run with a restricted token. Two witnesses of the token, whoami's groups
     and "net session" (0 only for an elevated administrator), both kept in the artifact; Windows' own by full path, since the
     runner's PATH finds Git's whoami first (the engine's run 45042315264). */
  const cmd = path.join(LAB, "signin-standin.cmd"), groups = path.join(OUT, "signin-groups.txt"), exitFile = path.join(LAB, "signin-exit.txt");
  const netFile = path.join(OUT, "signin-net-session.txt");
  fs.writeFileSync(cmd, ["@echo off", '"%SystemRoot%\\System32\\whoami.exe" /groups > "' + groups + '" 2>&1', '"%SystemRoot%\\System32\\net.exe" session >nul 2>&1', '>"' + netFile + '" echo %ERRORLEVEL%', value, '>"' + exitFile + '" echo %ERRORLEVEL%'].join("\r\n") + "\r\n");
  const ra = spawnSync("runas.exe", ["/trustlevel:0x20000", cmd], { encoding: "utf8", windowsHide: true, timeout: 60000 });
  rec.f("runas", oneLine((ra.stdout || "") + " " + (ra.stderr || "")) || "status " + ra.status);
  for (let i = 0; i < 300 && ra.status === 0 && !fs.existsSync(exitFile); i++) await sleep(1000);
  if (!fs.existsSync(exitFile)) throw new NoVerdict("the install part held (RunOnce " + JSON.stringify(value) + ", nothing run); the stand-in for the sign-in never finished under runas /trustlevel: "
    + oneLine((ra.stdout || "") + " " + (ra.stderr || "")) + (fs.existsSync(groups) ? " (it did start)" : " (it never started)"));
  await sleep(500);
  const g = fs.existsSync(groups) ? fs.readFileSync(groups, "utf8") : "";
  const admRow = g.split(/\r?\n/).find((l) => /BUILTIN\\Administrators/i.test(l)) || "";
  const label = (/Mandatory Label\\(\w+) Mandatory Level/i.exec(g) || [])[1] || "unread";
  const net = fs.existsSync(netFile) ? parseInt(fs.readFileSync(netFile, "utf8"), 10) : NaN;
  const read = !!admRow || label !== "unread";
  const unelevated = (/deny only/i.test(admRow) || /^(medium|low)$/i.test(label)) && net !== 0;
  rec.f("standin-net-session", Number.isNaN(net) ? "unread" : net); rec.f("standin-groups-bytes", g.length);
  rec.f("standin-administrators", admRow ? (/deny only/i.test(admRow) ? "deny only" : "enabled") : "absent"); rec.f("standin-integrity", label);
  const sx = parseInt(fs.readFileSync(exitFile, "utf8"), 10);
  const goneIn = await goneWithin(n.dir, 120);
  const after = {
    exit: sx, folder: goneIn > 0 || !fs.existsSync(n.dir), entry: !present(regKey(KU.uninstall)), marker: holds(marker, "kept\n"),
    allUsers: !!machineDir() && fs.existsSync(path.join(machineDir(), PRODUCT + ".exe")) && present(regKey(KM.uninstall)),
    links: commonLinks().every((f) => fs.existsSync(f)),
  };
  rec.f("standin-exit", sx); rec.f("per-user-folder-gone", yes(after.folder)); rec.f("hkcu-entry-gone", yes(after.entry)); rec.f("data-file-kept", yes(after.marker));
  rec.f("all-users-intact", yes(after.allUsers)); rec.f("all-users-shortcuts", yes(after.links));
  const removed = after.exit === 0 && after.folder && after.entry && after.marker && after.allUsers && after.links;
  /* A token not shown to be ordinary says nothing of ordinary rights: no verdict where the line otherwise did all it should. */
  if (!unelevated && removed)
    throw new NoVerdict("the install part held and the line removed the per-user copy, kept the data and left the all-users copy whole; but the stand-in's token was not shown to be ordinary (Administrators "
      + (admRow ? (/deny only/i.test(admRow) ? "deny only" : "enabled") : read ? "absent" : "unread") + ", " + label + " integrity, net session " + (Number.isNaN(net) ? "unread" : net) + "), so ordinary rights are unproven");
  const ok = unelevated && removed;
  rec.end(ok, (ok ? "elevated all-users over a per-user copy wrote " + JSON.stringify(value) + " to HKCU RunOnce, none under the desk's name, and ran nothing of that copy; the line, run with a restricted token, removed the per-user copy and its entry with exit 0, kept the data file, and left the all-users copy and its shortcuts whole"
    : "the line, run with a restricted token (" + label + " integrity, unelevated " + yes(unelevated) + "): exit " + sx + ", per-user folder gone " + yes(after.folder) + ", HKCU entry gone " + yes(after.entry)
      + ", data file kept " + yes(after.marker) + ", all-users copy intact " + yes(after.allUsers) + ", its shortcuts " + yes(after.links))
    + "; a real sign-in (Explorer reading RunOnce) is not reached on a hosted runner");
}

/* pf-dotdot (the Program Files D): interactive only. The writable-folder box belongs to the folder page, which a hosted runner cannot
   drive; tests/allusers-folder.mjs and tests/studio-installer-mends.mjs sm5a read it from the script. */
/* uninstall-data: the uninstaller's FIRST PAGE opened as a person opens it, with no /S, and driven by tools/runner/uninstaller-drive.ps1, twice over a
   fresh per-user install with a planted data folder. A person found the box on this page drawn out of the text column and impossible to click.
   Pass ticked: the box is found among the window's controls, Windows says the box itself stands under its centre (WindowFromPoint), a click
   there ticks it and a second clears it, the dialog's own Tab reaches it and Space ticks it, Next is pressed and the uninstaller runs to its end;
   then every planted file the page's note says goes is gone and every one it says stays is still there, byte for byte, and a catalog outside
   the folder is untouched. Pass unticked: the same, the box cleared by keyboard before Next, and the whole folder reads as it did before.
   The rectangles are read in pixels at THIS runner's scaling (the dpi it reports is a fact of the run); the box and the note must stand in the
   text column's x range, clear of the picture and of the welcome text, and inside the page. The other scalings are held in units by
   tests/uninstaller-page.mjs. What is not measured here: the paint (grey or white), which no message answers.
   THE FOLDER THE UNINSTALLER NAMES IS THE BUILD'S OWN, ${APP_PACKAGE_NAME}: etiuda-studio-qa for this test build. The leg plants there, and plants a
   shipped Studio's folder (etiuda-studio) beside it, which must come through both passes byte for byte: a test build never removes a shipped
   Studio's data. It refuses where either folder already stands: a runner has neither. */
const UD_GOES = ["Cache\\data_0", "GPUCache\\index", "Code Cache\\js\\a.bin", "session-note.txt", "Network\\Cookies"];
const UD_STAYS = ["etiuda-studio-license.js", "licence-service.json", "teams.json", "studio.json", "signing-key-a.json", "member-key.json", "Local State",
  "relay\\grant.json", "folder-mirror\\mirror.json"];
async function uninstallData(rec) {
  const wall = windowWallRefusal(WHO);
  if (wall) throw new NoVerdict("the leg opens the uninstaller's window and the window wall refuses: " + wall[0]);
  if (!process.env.APPDATA) throw new NoVerdict("APPDATA is not set, so the data folder cannot be named");
  const data = path.join(process.env.APPDATA, T.packageName), shipped = path.join(process.env.APPDATA, "etiuda-studio");
  if (data === shipped) throw new NoVerdict("the test build names the shipped data folder, so no leg can tell the two apart");
  for (const d of [data, shipped]) if (fs.existsSync(d)) throw new NoVerdict(d + " already stands on this machine; the leg plants there and will not touch a folder it did not make");
  const catalog = path.join(LAB, "ud-documents", "My catalog.ec");
  const plant = (rel, root) => { const f = path.join(root || data, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, "planted " + rel); };
  rec.after("uninstall", uninstallUser);
  rec.after("data folders", async () => { let n = 0; for (const d of [data, shipped]) if (fs.existsSync(d)) { fs.rmSync(d, { recursive: true, force: true }); n++; } return n ? "removed what the leg planted: " + n : "none left"; });
  const pass = async (final) => {
    const tag = final;
    const inst = await installUser(rec, NEWER, tag);
    if (!inst.ok) throw new NoVerdict(tag + ": the test build did not install for this account (exit " + inst.code + ")");
    const un = exeOf(valueOf(regKey(KU.uninstall), "UninstallString")) || path.join(inst.dir, UNINSTALLER);
    if (!fs.existsSync(un)) throw new NoVerdict(tag + ": no uninstaller at " + un);
    for (const d of [data, shipped]) fs.rmSync(d, { recursive: true, force: true });
    for (const r of UD_GOES.concat(UD_STAYS)) { plant(r); plant(r, shipped); }
    fs.mkdirSync(path.dirname(catalog), { recursive: true }); fs.writeFileSync(catalog, "a person's catalog");
    const before = manifest(data), beforeShipped = manifest(shipped), catSha = E.sha256(catalog);
    const jsonOut = path.join(LAB, "drive-" + tag + ".json");
    const child = spawn(un, ["/currentuser"], { windowsHide: false, stdio: "ignore" });
    const drove = spawnSync("powershell.exe", PS_HEAD.concat([path.join(ROOT, "tools", "runner", "uninstaller-drive.ps1"),
      "-Product", PRODUCT, "-Final", final, "-Out", jsonOut]), { encoding: "utf8", windowsHide: true, timeout: 330000 });
    const gone = await goneWithin(inst.dir, 90);
    for (const p of procsOf(un)) E.killTree(p.pid);
    E.killTree(child.pid);
    let d = {};
    try { d = JSON.parse(fs.readFileSync(jsonOut, "utf8").replace(/^﻿/, "")); } catch (e) { throw new NoVerdict(tag + ": the driver wrote no readable record (" + oneLine(drove.stderr || drove.stdout) + ")"); }
    fs.copyFileSync(jsonOut, path.join(OUT, "uninstall-page-" + tag + ".json"));
    if (d.error) rec.f(tag + "-driver", d.error);
    rec.f(tag + "-dpi", d.dpi); rec.f(tag + "-ended", d.ended);
    const bad = [];
    const px = (c) => c ? [c.left, c.top, c.right, c.bottom].join(",") : "none";
    /* THE SIDE PICTURE IS THE VISIBLE STATIC OF TYPE SS_BITMAP (style & 31 is 14) ON THE BOX'S OWN PARENT, never any empty Static: the first run of this
       leg took the page's 497 px wide placeholder (263 to 760, the whole page, the text column inside it) for the picture and faulted a box that stood
       exactly in the column. MUI declares the bitmap 109u wide (packaging/installer/turning/sidebar-*.bmp are 164 by 314 px, the same at 100%), and
       the turning code loads each frame at the control's own client size and never resizes it. The text column's left edge is the bound that holds
       either way; the picture is checked only where it is identified, and then it must end before the column starts. */
    const bitmaps = (d.controls || []).filter((c) => c.class === "Static" && c.visible && (c.style & 31) === 14 && d.box && c.parent === d.box.parent).sort((a, b) => a.left - b.left);
    const pic = bitmaps[0];
    rec.f(tag + "-bitmaps", bitmaps.length);
    rec.f(tag + "-box", px(d.box)); rec.f(tag + "-note", px(d.note)); rec.f(tag + "-text", px(d.text)); rec.f(tag + "-picture", px(pic));
    if (!d.box) bad.push("no Remove my data checkbox on the page");
    else {
      const slack = 3;
      if (!d.text) bad.push("the welcome text was not found to measure the column by");
      else {
        if (Math.abs(d.box.left - d.text.left) > slack) bad.push("the box's left " + d.box.left + " is not the text column's " + d.text.left);
        if (d.box.right > d.text.right + slack) bad.push("the box's right " + d.box.right + " passes the column's " + d.text.right);
        if (d.box.top < d.text.bottom - slack) bad.push("the box's top " + d.box.top + " is inside the welcome text, which ends " + d.text.bottom);
        if (d.note) {
          if (Math.abs(d.note.left - d.text.left) > slack) bad.push("the note's left " + d.note.left + " is not the column's " + d.text.left);
          if (d.note.right > d.text.right + slack) bad.push("the note's right " + d.note.right + " passes the column's " + d.text.right);
          if (d.note.bottom > d.main.bottom) bad.push("the note's foot " + d.note.bottom + " passes the window's " + d.main.bottom);
        } else bad.push("no note under the box");
      }
      if (pic) {
        if (d.text && pic.right > d.text.left) bad.push("the side picture (" + px(pic) + ") runs under the text column, which starts at " + d.text.left);
        if (d.box.left < pic.right || (d.note && d.note.left < pic.right)) bad.push("a control stands over the side picture (picture ends " + pic.right + ")");
      }
      rec.f(tag + "-parents", [d.box.parent, d.note && d.note.parent, d.text && d.text.parent].join("/"));
      if (d.text && d.box.parent !== d.text.parent) bad.push("the box's parent window " + d.box.parent + " is not the welcome text's " + d.text.parent + ", so it was not made on the welcome dialog");
      if (!d.boxIsHit) bad.push("Windows names " + (d.underBoxCentre ? d.underBoxCentre.class + " \"" + String(d.underBoxCentre.text).slice(0, 20) + "\"" : "nothing") + " under the box's centre, not the box");
      if (d.afterMouse1 !== 1) bad.push("a click on the box left it at " + d.afterMouse1 + ", not ticked");
      if (d.afterMouse2 !== 0) bad.push("a second click left it at " + d.afterMouse2 + ", not cleared");
      if (!d.boxHasFocus) bad.push("Tab did not reach the box in " + d.tabsToBox + " presses");
      if (d.afterSpace1 !== 1) bad.push("Space on the box left it at " + d.afterSpace1 + ", not ticked");
      if (d.stateAtNext !== (final === "ticked" ? 1 : 0)) bad.push("the box stood at " + d.stateAtNext + " at Next, not " + (final === "ticked" ? 1 : 0));
    }
    const left = (rel) => fs.existsSync(path.join(data, rel));
    const sameAfter = (rel) => holds(path.join(data, rel), "planted " + rel);
    if (!(gone > 0)) bad.push("the install folder was still there 90 s after Next");
    const after = manifest(data), diff = manifestDiff(before, after);
    if (final === "ticked") {
      const stillThere = UD_GOES.filter(left), lost = UD_STAYS.filter((r) => !sameAfter(r));
      rec.f(tag + "-goes-left", stillThere.length ? few(stillThere) : 0); rec.f(tag + "-stays-lost", lost.length ? few(lost) : 0);
      if (stillThere.length) bad.push("the note says these go and they are still there: " + few(stillThere));
      if (lost.length) bad.push("the note says these stay and they are gone or changed: " + few(lost));
    } else {
      rec.f(tag + "-changed", diff.changed.length + diff.gone.length + diff.added.length);
      if (diff.changed.length || diff.gone.length || diff.added.length) bad.push("with the box cleared the folder still changed: gone " + few(diff.gone) + ", changed " + few(diff.changed) + ", added " + few(diff.added));
    }
    const sd = manifestDiff(beforeShipped, manifest(shipped));
    rec.f(tag + "-shipped-changed", sd.changed.length + sd.gone.length + sd.added.length);
    if (sd.changed.length || sd.gone.length || sd.added.length) bad.push("the shipped Studio's folder beside it was touched: gone " + few(sd.gone) + ", changed " + few(sd.changed) + ", added " + few(sd.added));
    if (!fs.existsSync(catalog) || E.sha256(catalog) !== catSha) bad.push("the catalog outside the folder was touched");
    rec.f(tag + "-driver-exit", drove.status);
    return bad;
  };
  const ticked = await pass("ticked");
  rec.f("ticked-faults", ticked.length);
  /* The unticked pass starts from nothing: the first one's leftovers are swept before it installs. */
  rec.f("between", oneLine(await uninstallUser()));
  const unticked = await pass("unticked");
  rec.f("unticked-faults", unticked.length);
  rec.end(!ticked.length && !unticked.length,
    !ticked.length && !unticked.length
      ? "the uninstaller's first page: the Remove my data box stands in the text column and takes a mouse click and Tab with Space; ticked, the planted data the note says goes is gone and what it says stays is still there; cleared, nothing in the folder changed"
      : ["ticked: " + ticked.join("; "), "unticked: " + unticked.join("; ")].join(" | "));
}

async function pfDotdot() {
  throw new NoVerdict("the box for \"C:\\Program Files\\..\\Users\\Public\\Etiuda Studio\" appears only on the folder page, which this runner cannot drive; unreached here");
}

/* ---- reinstall-no-reboot: uninstall, then install again in the same session, as a person does it ----------------------
   The person's sequence of two findings (the desk's Setup hanging on Installing after an uninstall, twice, until a reboot; Studio's
   Setup opening an endless cascade of "already installed" boxes over an install already running), done the person's way: the
   Test Service build (the build the findings were made with) installed through its pages, no /S, pressed by the watcher below;
   the program started as a person starts it (the Finish page's Run box, left as it stands; the leg starts it only where that box
   started nothing) and left to settle in its tray; then the uninstaller from the Apps entry (the UninstallString, as Settings runs
   it, no /S), its pages pressed the same way, Remove my data left as it stands; then the same Setup again, no reboot.
   Studio's run has the desk installed and running in its tray beside it throughout (rnrDeskBeside, below), as on the machine where the
   cascade was seen.
     reinstall-no-reboot      the person quits the program before the uninstall (its own close request, --update-close, stands in
                              for the tray's Quit, which this runner cannot reach).
     reinstall-no-reboot-ask  the program is still running in its tray when the uninstall starts; any box the uninstaller shows about
                              it is answered as a person would (the program quit, then Retry; an OK box, OK).
   IT FAILS ON: a Setup not finished within RNR_BOUND_S (a hang); more than one Setup process (by the setup file's path or name) or
   more than one visible top-level window with "Setup" in its title at any sample, one sample a second; and, before the second
   install, anything the uninstall left: a running process of the program, the install folder, the uninstall entry (either scope),
   a PendingFileRenameOperations entry naming the folder or the product. The first install and the uninstall are held to the same
   bounds. Each phase's samples print in the #leg line as setup/windows counts run-length coded ("1/1x40" is forty samples of one
   Setup process and one window); every sample, with each process's parent and command line and each new window's text, is kept
   as rnr-<leg>-<phase>.jsonl beside legs.txt, which is where the program that started an extra Setup is read. A storm is cut short
   at RNR_STORM_CAP of either count, so the runner survives it; the leg stops by pid what the setup file and the uninstaller ran. */
const RNR_BOUND_S = 300, RNR_STORM_CAP = 6;
const RNR_PS = String.raw`param([string]$Exe, [string]$Title, [string]$Product, [string]$Out, [string]$Stop, [string]$Drive, [string]$App, [int]$Seconds = 400)
$ErrorActionPreference = "Continue"
Add-Type -TypeDefinition @"
using System; using System.Text; using System.Collections.Generic; using System.Runtime.InteropServices;
public static class RW {
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc p, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumChildWindows(IntPtr h, EnumProc p, IntPtr l);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsWindowEnabled(IntPtr h);
  [DllImport("user32.dll")] public static extern int GetDlgCtrlID(IntPtr h);
  [DllImport("user32.dll")] public static extern IntPtr GetParent(IntPtr h);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, int m, IntPtr w, IntPtr l);
  public static List<IntPtr> Tops() { var l = new List<IntPtr>(); EnumWindows((h, p) => { l.Add(h); return true; }, IntPtr.Zero); return l; }
  public static List<IntPtr> Kids(IntPtr top) { var l = new List<IntPtr>(); EnumChildWindows(top, (h, p) => { l.Add(h); return true; }, IntPtr.Zero); return l; }
  public static string Text(IntPtr h) { var s = new StringBuilder(2048); GetWindowText(h, s, s.Capacity); return s.ToString(); }
  public static string Class(IntPtr h) { var s = new StringBuilder(256); GetClassName(h, s, s.Capacity); return s.ToString(); }
}
"@
function Click($b) { [void][RW]::PostMessage($b, 0x00F5, [IntPtr]::Zero, [IntPtr]::Zero) }
$leaf = ""; if ($Exe) { $leaf = [IO.Path]::GetFileName($Exe) }
$answeredSame = 0; $retries = 0; $lastPress = @{}; $seen = @{}; $lastPids = "-"; $t0 = Get-Date
while (-not (Test-Path -LiteralPath $Stop) -and ((Get-Date) - $t0).TotalSeconds -lt $Seconds) {
  $rows = @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
    ($_.ExecutablePath -and $Exe -and $_.ExecutablePath -ieq $Exe) -or ($leaf -and $_.Name -ieq $leaf) -or ($_.Name -match '^(old-uninstaller|Au_|Un_[A-Z])') })
  $setup = @($rows | Where-Object { ($_.ExecutablePath -and $Exe -and $_.ExecutablePath -ieq $Exe) -or ($leaf -and $_.Name -ieq $leaf) })
  $wins = @(); $press = @(); $new = @()
  foreach ($h in [RW]::Tops()) {
    if (-not [RW]::IsWindowVisible($h)) { continue }
    $t = [RW]::Text($h)
    if (-not $t.Contains($Title)) { continue }
    [uint32]$wp = 0; [void][RW]::GetWindowThreadProcessId($h, [ref]$wp)
    $isWizard = $false; $msg = ""; $btn = @{}
    foreach ($k in [RW]::Kids($h)) {
      $c = [RW]::Class($k)
      if ($c -eq "#32770") { $isWizard = $true }
      if ($c -eq "Static" -and [RW]::GetDlgCtrlID($k) -eq 65535) { $s = [RW]::Text($k); if ($s.Length -gt $msg.Length) { $msg = $s } }
      if ($c -eq "Button" -and [RW]::GetParent($k) -eq $h) { $btn[[RW]::GetDlgCtrlID($k)] = $k }
    }
    $key = [string][int64]$h
    $short = $msg; if ($short.Length -gt 160) { $short = $short.Substring(0, 160) }
    $w = [ordered]@{ hwnd = [int64]$h; pid = [int]$wp; title = $t; kind = $(if ($isWizard) { "wizard" } else { "box" }); text = $short }
    $wins += $w
    if (-not $seen.ContainsKey($key)) { $seen[$key] = 1; $new += $w }
    if ($Drive -eq "none" -or -not $t.Contains($Product)) { continue }
    $now = Get-Date
    if ($lastPress.ContainsKey($key) -and ($now - $lastPress[$key]).TotalSeconds -lt 2.5) { continue }
    if ($isWizard) {
      $b = $btn[1]
      if ($b -and [RW]::IsWindowVisible($b) -and [RW]::IsWindowEnabled($b)) { Click $b; $lastPress[$key] = $now; $press += ("wizard " + [RW]::Text($b)) }
    } elseif ($msg -match "already installed|zainstalowan") {
      if ($answeredSame -lt 1 -and $btn[1]) { Click $btn[1]; $answeredSame++; $lastPress[$key] = $now; $press += "box OK, the first already-installed box" }
    } elseif ($msg -match "is running|uruchomiony|cannot be closed|nie mo") {
      if ($retries -lt 3 -and $btn[4]) {
        if ($App -and (Test-Path -LiteralPath $App)) { Start-Process -FilePath $App -ArgumentList "--update-close" -WindowStyle Hidden; Start-Sleep -Seconds 4 }
        Click $btn[4]; $retries++; $lastPress[$key] = $now; $press += "box Retry, the program quit first"
      }
    } elseif (-not $lastPress.ContainsKey($key) -and $btn[1]) {
      Click $btn[1]; $lastPress[$key] = $now; $press += ("box OK: " + $short.Substring(0, [Math]::Min(60, $short.Length)))
    }
  }
  $pids = (@($rows | ForEach-Object { [string]$_.ProcessId }) | Sort-Object) -join ","
  $o = [ordered]@{ t = [math]::Round(((Get-Date) - $t0).TotalSeconds, 1); setup = $setup.Count; others = $rows.Count - $setup.Count; wins = $wins.Count }
  if ($pids -ne $lastPids) {
    $o.procs = @($rows | ForEach-Object { $cl = [string]$_.CommandLine; if ($cl.Length -gt 220) { $cl = $cl.Substring(0, 220) }
      [ordered]@{ pid = [int]$_.ProcessId; ppid = [int]$_.ParentProcessId; name = [string]$_.Name; cmd = $cl } })
    $lastPids = $pids
  }
  if ($new.Count) { $o.new = $new }
  if ($press.Count) { $o.pressed = $press }
  Add-Content -LiteralPath $Out -Value (ConvertTo-Json -InputObject $o -Compress -Depth 6) -Encoding UTF8
  Start-Sleep -Milliseconds 700
}
`;
const RNR_FILE = () => { const f = path.join(LAB, "q-rnr-watch.ps1"); if (!fs.existsSync(f)) fs.writeFileSync(f, RNR_PS.replace(/\r?\n/g, "\r\n"), "utf8"); return f; };

/* The pure parts: the samples of one phase off their file, and what they say. */
function rnrRead(file) {
  let text = "";
  try { text = fs.readFileSync(file, "utf8").replace(/^﻿/, ""); } catch (e) { return []; }
  const out = [];
  for (const line of text.split(/\r?\n/)) { if (!line.trim()) continue; try { out.push(JSON.parse(line.replace(/^﻿/, ""))); } catch (e) { /* a line cut by the stop */ } }
  return out;
}
function rnrJudge(samples, opts) {
  const o = opts || {};
  let maxSetup = 0, maxWins = 0;
  const series = [], boxes = [], pressed = [];
  for (const s of samples) {
    const sp = s.setup | 0, w = s.wins | 0;
    if (sp > maxSetup) maxSetup = sp;
    if (w > maxWins) maxWins = w;
    const k = sp + "/" + w, last = series[series.length - 1];
    if (last && last[0] === k) last[1]++; else series.push([k, 1]);
    for (const nw of s.new || []) if (nw && nw.kind === "box" && nw.text && boxes.indexOf(nw.text.slice(0, 70)) < 0) boxes.push(nw.text.slice(0, 70));
    for (const p of s.pressed || []) pressed.push(p);
  }
  const faults = [];
  if (o.setupRules) {
    if (maxSetup > 1) faults.push(maxSetup + " Setup processes at once");
    if (maxWins > 1) faults.push(maxWins + " Setup windows at once");
  }
  return { n: samples.length, maxSetup, maxWins, series: series.map(([k, n]) => k + "x" + n).join(",") || "none", boxes, pressed, faults };
}
/* The extra processes a phase saw, as "name<-parent name" for each pid that was not the first Setup: who started the second one. */
function rnrSpawners(samples, firstPid) {
  const names = {}, seen = [];
  for (const s of samples) for (const p of s.procs || []) names[p.pid] = p.name;
  for (const s of samples) for (const p of s.procs || []) {
    if (p.pid === firstPid) continue;
    const row = p.name + "(" + p.pid + ")<-" + (names[p.ppid] || "pid") + "(" + p.ppid + ")";
    if (seen.indexOf(row) < 0) seen.push(row);
  }
  return seen;
}

/** One phase: `exe` started with `args` beside the watcher; ends where `finished` holds, at the bound, or at a storm. */
async function rnrRun(rec, leg, tag, exe, args, o) {
  const out = path.join(LAB, "rnr-" + leg + "-" + tag + ".jsonl"), stop = out + ".stop";
  const watcher = spawn("powershell.exe", PS_HEAD.concat([RNR_FILE(), "-Exe", o.procExe || "", "-Title", o.title, "-Product", o.product, "-Out", out,
    "-Stop", stop, "-Drive", o.drive, "-App", o.app || "", "-Seconds", String(RNR_BOUND_S + 90)]), { windowsHide: true, stdio: "ignore" });
  let watcherGone = false;
  watcher.on("exit", () => { watcherGone = true; });
  for (let i = 0; i < 20 && !fs.existsSync(out); i++) await sleep(500);
  const t0 = Date.now();
  const child = spawn(exe, args, { windowsHide: false, stdio: "ignore" });
  let code = null, exited = false;
  child.on("exit", (c) => { code = c; exited = true; });
  child.on("error", () => { exited = true; });
  let storm = false, finished = false;
  while (Date.now() - t0 < RNR_BOUND_S * 1000) {
    await sleep(1000);
    const s = rnrRead(out), j = rnrJudge(s);
    if (o.setupRules && (j.maxSetup >= RNR_STORM_CAP || j.maxWins >= RNR_STORM_CAP)) { storm = true; break; }
    if (o.finished(s, exited)) { finished = true; break; }
  }
  const seconds = Math.round((Date.now() - t0) / 1000);
  fs.writeFileSync(stop, "stop");
  for (let i = 0; i < 20 && !watcherGone; i++) await sleep(500);
  if (!watcherGone) E.killTree(watcher.pid);
  const samples = rnrRead(out);
  /* What is left of this phase goes by pid: the start, every process of the setup file, and the uninstaller's copies the samples saw. */
  E.killTree(child.pid);
  if (o.procExe) for (const p of procsOf(o.procExe)) E.killTree(p.pid);
  const ran = {};
  for (const s of samples) for (const p of s.procs || []) if (/^(old-uninstaller|Au_|Un_[A-Z])/i.test(p.name)) ran[p.pid] = true;
  for (const pid of Object.keys(ran)) E.killTree(Number(pid));
  try { fs.copyFileSync(out, path.join(OUT, path.basename(out))); } catch (e) { /* no samples written */ }
  const j = rnrJudge(samples, { setupRules: o.setupRules });
  rec.f(tag + "-s", seconds); rec.f(tag + "-exit", exited ? code : "running"); rec.f(tag + "-samples", j.n);
  rec.f(tag + "-max", j.maxSetup + "/" + j.maxWins); rec.f(tag + "-series", j.series);
  if (j.boxes.length) rec.f(tag + "-boxes", j.boxes.join(" | "));
  if (j.pressed.length) rec.f(tag + "-pressed", j.pressed.length + ":" + j.pressed.slice(-3).join(";"));
  const extra = rnrSpawners(samples, child.pid);
  if (extra.length) rec.f(tag + "-procs", few(extra));
  const faults = j.faults.slice();
  if (storm) faults.push("a storm, cut short at " + RNR_STORM_CAP + " after " + seconds + " s");
  else if (!finished) faults.push(o.what + " had not finished after " + RNR_BOUND_S + " s");
  return { faults, finished, storm, code, exited, samples };
}

const RNR_PENDING = "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager";
/** What the uninstall left, read the moment it ended, before the second install. */
function rnrLeft(dir, prog, product) {
  const left = [];
  const running = prog ? procsOf(prog) : [];
  if (running.length) left.push("the program still running (" + running.map((p) => p.pid).join(",") + ")");
  if (dir && fs.existsSync(dir)) left.push("the install folder " + dir + " (" + (() => { try { return fs.readdirSync(dir).length; } catch (e) { return "?"; } })() + " entries)");
  for (const k of [KU.uninstall, KM.uninstall].map(regKey)) if (present(k)) left.push("the uninstall entry " + k);
  const installKeys = [KU.install, KM.install].map(regKey).filter(present);
  const pend = valueOf(RNR_PENDING, "PendingFileRenameOperations");
  const entries = pend ? pend.split(/\\0/).filter(Boolean) : [];
  const naming = entries.filter((e) => (dir && e.toLowerCase().indexOf(dir.toLowerCase()) > -1) || e.toLowerCase().indexOf(String(product).toLowerCase()) > -1);
  if (naming.length) left.push("PendingFileRenameOperations names " + naming.length + ": " + few(naming));
  return { left, pending: entries.length, installKeys };
}

/** The program as a person leaves it after the Finish page: started by the page's Run box, or by the leg where that box started nothing. */
async function rnrStartProgram(rec, prog, tag) {
  for (let i = 0; i < 30 && !procsOf(prog).length; i++) await sleep(1000);
  if (procsOf(prog).length) { rec.f(tag + "-start", "finish-page"); }
  else {
    const ud = path.join(process.env.APPDATA, T.packageName), docs = path.join(LAB, tag + "-documents");
    fs.mkdirSync(docs, { recursive: true });
    const args = ["--user-data-dir=" + ud], opts = { stdio: "ignore", windowsHide: false, env: Object.assign({}, process.env, { ETIUDA_TEST_DOCUMENTS: docs }) };
    const no = E.shellLaunchRefusal(WHO, args, opts);
    if (no) throw new NoVerdict("the program's start is refused: " + no[0]);
    delete opts.env.STUDIO_GATE; delete opts.env.STUDIO_PROJECTS; delete opts.env.STUDIO_TEST_OFFSCREEN;
    spawn(prog, args, opts);
    rec.f(tag + "-start", "leg");
  }
  await sleep(20000);
  return rec.f(tag + "-procs-up", procsOf(prog).length);
}

/* THE DESK BESIDE, as on the machine where the cascade was seen: the pinned engine's desk, built under its own test identity from the
   public engine remote at tools/engine-pin's commit (the commit the pair shipped with), installed for this account, started as a person
   starts it, and left running in its tray through Studio's whole sequence. Where it cannot be built or started, the leg goes on without it
   and says so (desk-beside=no and why): the Studio sequence is still measured. */
const RNR_DESK_REMOTE = "https://github.com/maximgwiazda/Etiuda.git";
async function rnrDeskBeside(rec) {
  const pin = (/^\s*ENGINE_PIN\s*=\s*([0-9a-f]{40})\s*$/m.exec(fs.readFileSync(path.join(ROOT, "tools", "engine-pin"), "utf8")) || [])[1];
  if (!pin) return { why: "no ENGINE_PIN in tools/engine-pin" };
  rec.f("desk-pin", pin.slice(0, 8));
  const src = path.join(LAB, "desk-src"), dist = path.join(LAB, "desk-dist");
  const run = (cmd, args, opts, ms) => spawnSync(cmd, args, Object.assign({ encoding: "utf8", windowsHide: true, timeout: ms, maxBuffer: 512 * 1024 * 1024 }, opts));
  const t0 = Date.now();
  let r = run("git", ["clone", "--quiet", "--no-checkout", "--filter=blob:none", RNR_DESK_REMOTE, src], {}, 900000);
  if (r.status !== 0) return { why: "clone: " + oneLine(r.stderr) };
  r = run("git", ["-C", src, "checkout", "--quiet", pin], {}, 900000);
  if (r.status !== 0) return { why: "checkout: " + oneLine(r.stderr) };
  r = run("npm ci --no-audit --no-fund", [], { cwd: src, shell: true }, 1800000);
  if (r.status !== 0) return { why: "npm ci: " + oneLine(String(r.stderr || "").slice(-300)) };
  r = run(process.execPath, [path.join(src, "tools", "package.mjs"), "--test-identity"], { cwd: src, env: Object.assign(withoutSigning(), { ETIUDA_DIST: dist }) }, 1800000);
  if (r.status !== 0) return { why: "the desk's package step: " + oneLine(String(r.stderr || r.stdout || "").slice(-300)) };
  const found = fs.existsSync(dist) ? fs.readdirSync(dist).filter((n) => /-setup\.exe$/i.test(n)) : [];
  if (found.length !== 1) return { why: dist + " holds " + found.length + " installers" };
  const setup = path.join(dist, found[0]);
  const dT = require(path.join(src, "tools", "test-identity.cjs")).TEST.desk;
  const id = G.setupIdentity(setup);
  if (id.appId !== dT.appId) return { why: "the desk's setup names app id " + JSON.stringify(id.appId || null) + ", not its test identity's" };
  rec.f("desk-built-s", Math.round((Date.now() - t0) / 1000));
  const dKU = P.registryKeys("user", P.appGuid(dT.appId));
  const inst = await runExe(setup, P.installArgs({ mode: "user" }), 600000);
  const dDir = valueOf(regKey(dKU.install), "InstallLocation"), dProg = dDir ? path.join(dDir, dT.productName + ".exe") : "";
  const ud = path.join(process.env.APPDATA, dT.packageName);
  const uninstall = async () => {
    const running = dProg ? procsOf(dProg) : [];
    for (const p of running) E.killTree(p.pid);
    const un = exeOf(valueOf(regKey(dKU.uninstall), "UninstallString"));
    if (!un || !fs.existsSync(un)) return "stopped " + running.length + "; no desk uninstaller registered";
    const u = await runExe(un, P.uninstallArgs("user"), 300000);
    const g = dDir ? await goneWithin(dDir, 120) : 0;
    let took = "";
    for (const k of [dKU.uninstall, dKU.install].map(regKey)) if (present(k)) { spawnSync("reg", ["delete", k, "/f"], { windowsHide: true }); took += " swept " + k; }
    return "stopped " + running.length + "; desk uninstaller exit " + u.code + ", " + (g > 0 ? "folder gone" : "folder still there") + took;
  };
  if (!dProg || !fs.existsSync(dProg)) return { why: "the desk's install for this account left no program (exit " + inst.code + ")", uninstall };
  const docs = path.join(LAB, "desk-documents");
  fs.mkdirSync(docs, { recursive: true });
  const args = ["--user-data-dir=" + ud], opts = { stdio: "ignore", windowsHide: false, env: Object.assign({}, process.env, { ETIUDA_TEST_DOCUMENTS: docs }) };
  const no = E.shellLaunchRefusal(WHO, args, opts);
  if (no) return { why: "the desk's start is refused: " + no[0], uninstall };
  spawn(dProg, args, opts);
  await sleep(20000);
  return { prog: dProg, up: procsOf(dProg).length, uninstall };
}

async function reinstallNoReboot(rec, ask) {
  const leg = ask ? "reinstall-no-reboot-ask" : "reinstall-no-reboot";
  const wall = windowWallRefusal(WHO);
  if (wall) throw new NoVerdict("the leg opens the installer's, the uninstaller's and the program's windows and the window wall refuses: " + wall[0]);
  let exe;
  try { exe = tsSetup(rec); rec.f("build", "test-service"); } catch (e) { if (!(e instanceof NoVerdict)) throw e; exe = NEWER; rec.f("build", "ordinary"); rec.f("ts-why", oneLine(e.message)); }
  const product = G.setupIdentity(exe).productName || PRODUCT;
  const desk = await rnrDeskBeside(rec);
  if (desk.uninstall) rec.after("desk", desk.uninstall);
  rec.f("desk-beside", desk.prog ? "running:" + desk.up : "no");
  if (desk.why) rec.f("desk-why", desk.why);
  let prog = "";
  rec.after("uninstall", async () => oneLine(await uninstallUser()) + (machineDir() ? "; " + oneLine(await uninstallMachine()) : ""));
  rec.after("program", async () => { const ps2 = prog ? procsOf(prog) : []; for (const p of ps2) E.killTree(p.pid); return "stopped " + ps2.length; });
  const faults = [];
  const setupDone = (s, exited) => { const last = s.slice(-2); return exited && last.length === 2 && last.every((x) => (x.setup | 0) === 0 && (x.wins | 0) === 0); };
  const setupOpts = { title: "Setup", product, drive: "setup", procExe: exe, setupRules: true, what: "the Setup", finished: setupDone };

  /* 1. the first install, through its pages */
  const i1 = await rnrRun(rec, leg, "install1", exe, [], setupOpts);
  faults.push(...i1.faults.map((f) => "first install: " + f));
  const dir = userDir() || machineDir();
  rec.f("scope", userDir() ? "user" : machineDir() ? "machine" : "-");
  prog = dir ? path.join(dir, PRODUCT + ".exe") : "";
  if (!prog || !fs.existsSync(prog)) {
    if (faults.length) { rec.end(false, faults.join("; ")); return; }
    throw new NoVerdict("the first install, driven through its pages, left no program (exit " + i1.code + "); the pages pressed are in rnr-" + leg + "-install1.jsonl");
  }

  /* 2. the program, as a person leaves it, then quit (main) or left running (ask) */
  await rnrStartProgram(rec, prog, "app");
  if (!ask) {
    spawnSync(prog, ["--update-close"], { stdio: "ignore", windowsHide: true, timeout: 20000 });
    for (let i = 0; i < 20 && procsOf(prog).length; i++) await sleep(1000);
    rec.f("app-quit", procsOf(prog).length ? "still-running" : "quit");
  }

  /* 3. the uninstall, from the Apps entry, through its pages */
  const entry = valueOf(regKey(KU.uninstall), "UninstallString") || valueOf(regKey(KM.uninstall), "UninstallString");
  const un = exeOf(entry);
  if (!un || !fs.existsSync(un)) throw new NoVerdict("no uninstaller named by the Apps entry (" + oneLine(entry) + ")");
  const unArgs = entry.slice(entry.indexOf(un) + un.length + 1).trim().split(/\s+/).filter(Boolean);
  rec.f("un-args", unArgs.join(" ") || "-");
  const unDone = (s) => { const last = s.slice(-3); return last.length === 3 && (last[0].t | 0) >= 5 && last.every((x) => (x.wins | 0) === 0 && (x.others | 0) === 0 && (x.setup | 0) === 0); };
  const u = await rnrRun(rec, leg, "uninstall", un, unArgs, { title: "Uninstall", product, drive: "uninstall", procExe: un, app: prog, setupRules: false, what: "the uninstall", finished: unDone });
  faults.push(...u.faults.map((f) => "uninstall: " + f));
  await sleep(3000);
  const left = rnrLeft(dir, prog, product);
  rec.f("left", left.left.length); rec.f("pending-renames", left.pending); rec.f("install-keys-left", left.installKeys.length);
  faults.push(...left.left.map((f) => "left by the uninstall: " + f));

  /* 4. the same Setup again, no reboot */
  const i2 = await rnrRun(rec, leg, "install2", exe, [], setupOpts);
  faults.push(...i2.faults.map((f) => "second install: " + f));
  if (desk.prog) rec.f("desk-at-end", procsOf(desk.prog).length);
  rec.f("install2-program", yes(fs.existsSync(prog) || !!(userDir() || machineDir())));
  rec.end(!faults.length, faults.length ? faults.join("; ")
    : "installed through its pages, started, " + (ask ? "uninstalled with the program running in its tray" : "quit, uninstalled") + " from the Apps entry, and installed again without a reboot: one Setup process and one Setup window at every sample, each phase finished within " + RNR_BOUND_S + " s, nothing left between");
}

/* ---- the run ------------------------------------------------------------------------------------------------------- */

function record(name) {
  const rec = { name, facts: [], cleanups: [], verdict: "", why: "" };
  rec.f = (k, v) => { rec.facts.push(fmt(k, v)); return v; };
  rec.after = (what, run) => rec.cleanups.push({ what, run });
  rec.end = (ok, why) => { rec.verdict = ok ? "ok" : "fail"; rec.why = why; };
  return rec;
}
const LEGS = { "all-upgrade": allUpgrade, "running-1618": running1618, "system-bare": systemBare, "locked-1618": locked1618, "all-move": allMove, "all-space-d": allSpaceD, "system-push": systemPush, "ts-cycle": tsCycle, "ts-uninstall": tsUninstall, "desk-assoc-kept": deskAssocKept,
  "list-in-package": listInPackage, "short-stage": shortStage, "foreign-folder-refused": foreignFolderRefused, "pre-own-survives": preOwnSurvives,
  "per-user-at-sign-in": perUserAtSignIn, "old-copy-kept": oldCopyKept, "pf-dotdot": pfDotdot, "uninstall-data": uninstallData,
  "reinstall-no-reboot": (rec) => reinstallNoReboot(rec, false), "reinstall-no-reboot-ask": (rec) => reinstallNoReboot(rec, true) };

/* The newer setup, built once from this tree under Studio's test identity, as the marker builds it. */
const early = legPreflight();
if (early.length) refuse("before anything is built: " + early.join("; "));
try {
  const cli = path.join(ROOT, "node_modules", "electron-builder", "out", "cli", "cli.js");
  if (!fs.existsSync(cli)) refuse("electron-builder is not installed; npm ci first");
  /* Through tools/package.mjs --test-identity, never electron-builder directly: the pack step makes turning.7z (generated, git-ignored)
     and applies the NSIS template patches, which a direct call skips. */
  /* Its output is kept (build-newer.log beside legs.txt) and echoed, so list-in-package can read what the build's hooks said. */
  const b = spawnSync(process.execPath, [path.join(ROOT, "tools", "package.mjs"), "--test-identity"],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 512 * 1024 * 1024, env: Object.assign(withoutSigning(), { ETIUDA_STUDIO_DIST: DIST }) });
  BUILD_LOG = String(b.stdout || "") + String(b.stderr || "");
  process.stdout.write(BUILD_LOG);
  fs.writeFileSync(path.join(OUT, "build-newer.log"), BUILD_LOG);
  if (b.error || b.status !== 0) throw new Error("tools/package.mjs --test-identity " + (b.error ? b.error.message : "exited " + b.status));
} catch (e) { refuse("the test build's installer could not be built: " + oneLine(e.message)); }
const setups = fs.readdirSync(DIST).filter((n) => /-setup\.exe$/i.test(n));
if (setups.length !== 1) refuse(DIST + " holds " + setups.length + " installers; expected 1");
NEWER = path.join(DIST, setups[0]);
const notTest = G.setupRefusal(G.setupIdentity(NEWER), "studio");
if (notTest) refuse("the built setup is not the test build: " + notTest);
say("#legs newer " + setups[0] + " sha256 " + E.sha256(NEWER).slice(0, 16) + ", legs " + CHOSEN.join(" "));

let failed = 0, verdicts = 0;
for (const name of CHOSEN) {
  const rec = record(name);
  try {
    const pre = legPreflight();
    if (pre.length) throw new NoVerdict("refused before anything ran: " + pre.join("; "));
    await LEGS[name](rec);
    if (!rec.verdict) throw new Error("the leg ended without a verdict");
  } catch (e) {
    if (e instanceof NoVerdict) { rec.verdict = "no-verdict"; rec.why = e.message; }
    else { rec.verdict = "fail"; rec.why = "the leg threw: " + oneLine(e && e.stack || e); }
  } finally {
    for (const c of rec.cleanups.reverse()) {
      try { rec.f("cleanup-" + c.what, oneLine(await c.run())); } catch (e) { rec.f("cleanup-" + c.what, "threw: " + oneLine(e.message)); }
    }
  }
  const head = rec.verdict === "ok" ? "  ok   " : rec.verdict === "fail" ? "  FAIL " : "  --   ";
  say(head + name + " " + (rec.verdict === "no-verdict" ? "no verdict: " : "") + oneLine(rec.why));
  say("#leg " + name + " " + rec.verdict + " " + rec.facts.join(" "));
  if (rec.verdict === "fail") failed++;
  if (rec.verdict !== "no-verdict") verdicts++;
}
const diffs = G.guardEnd(GUARD).diffs;
say("#guard " + (diffs.length ? "changed " + diffs.map(G.diffLine).join("; ") : "unchanged: what the shipped apps own reads as before"));
process.exit(failed ? E.exitOf(failed) : verdicts ? 0 : NO_VERDICT);
