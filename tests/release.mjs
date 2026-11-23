/* ONE LEG PER CLAIM THE RELEASE SCRIPT COULD GET WRONG.
 *
 *     node tests/release.mjs [--keep]
 *
 * Claims, each in a lab so this file can sit in npm test without calling npm test:
 *   1  a planted red gate stops the chain; the table names it; no installer is written
 *   2  --dry prints the table green and builds nothing
 *   3  the whole run writes the installer the package stub produced
 *   5  a stale dist exe is refused at the package gate; the installer script is not spawned
 *   6  a fresh exe the package stub wrote reaches the installer gate
 *   7  a package stub that exits 0 and writes nothing reddens the package gate
 *   3j, 10  a fourth gate launches the packaged app this run built, and one that launched
 *      nothing is red however it exits
 *   3f-3i  every count in a result line follows the thing it counts, proved by mutating it
 *   3l  the installer's SHA-256 is printed and recorded, against a hash computed outside node
 *   3m, 3n  the software bill of materials is written beside the installer, held against the
 *      packaged app, its SHA-256 printed and recorded; a list the app contradicts stops the run
 *   11a-11e  a customer build is judged before gate 1 as gate `sellable` (exit 5) on its version,
 *      the vendor key src/licence.mjs gives a packaged build, the licence page and the signing
 *      block, and after the build on the installer's and the program's signatures; a preview is
 *      told and goes on as before
 *   12a-12g  a release is of a commit: a tree with anything uncommitted is refused as gate `clean`
 *      (exit 6) before any gate runs, --dry included, the way the engine's release gate 1 refuses;
 *      a clean lab passes as before and is told which commit it is of, a modified tracked file is
 *      refused as an untracked one is, and a folder that is no repository is refused rather than
 *      read as clean, and an untracked file is refused under git's status.showUntrackedFiles=no (12f, control 12g)
 *   14a-14d  a test service build (tools/test-service.cjs) is never released: ETIUDA_PACK_TEST_SERVICE stops a preview as gate
 *      `sellable` (exit 5), and a package whose resources carry test-service.json stops at the package gate; each refusal planted
 *
 * The lab copies tools/release.mjs and gives it stub npm scripts. The live tree is not
 * packaged from here; the seat's own `node tools/release.mjs` is that run. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dropScratch } from "./scratch.mjs";
import OffWindows from "./off-windows.cjs";
import { SIGNING_VARS } from "../tools/sellable.mjs";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const TOOL = path.join(ROOT, "tools", "release.mjs");
const KEEP = process.argv.indexOf("--keep") > -1;
/* The floor: every leg below runs, or the tally says so rather than reading as a short green. */
const EXPECTED = 61;

let asserted = 0, failed = 0;
/* A plant proof is not run under ETIUDA_PLANTS=off (regimen rule 6): it is skipped by name and counted, so the floor still holds. */
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
let plantsSkipped = 0;
/* 11c, 11d, 13c's leg 3b, 13d and 13f stand aside off Windows (Claude gamma's Linux sweep, 2026-11-14): each one's build passes the
   package gate's signature reading, which only Windows can make (tools/sellable.mjs readAuthenticode answers null off it and
   the gate stops "NOT RUN: not Windows"), so the release profile is Windows-only there and says so. Each is skipped by name and
   counted, so the floor holds on both platforms. 13c's leg 3a stops at sellable before any signature and runs everywhere. */
let asideSkipped = 0;
const releaseAside = (id) => OffWindows.standAside(id, "its build reaches the package gate's Authenticode reading, which only Windows can"
  + " make (off Windows the gate stops NOT RUN: not Windows), so the release profile is Windows-only here");
function skipAside(line) { asideSkipped++; process.stdout.write("  SKIP  " + line + "\n"); }
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

const labs = [];
/* Each stub below writes one line naming the profile it was handed, so 3k can say which home
   every gate ran in. The file is the lab's own and no other leg lists the lab. */
const REC = g => 'import { appendFileSync as __rec } from "node:fs";\n'
  + '__rec("gate-env.jsonl", JSON.stringify({ gate: "' + g + '", USERPROFILE: process.env.USERPROFILE || "",'
  + ' APPDATA: process.env.APPDATA || "", LOCALAPPDATA: process.env.LOCALAPPDATA || "" }) + "\\n");\n';
const STRAY_EXE = path.join(os.tmpdir(), "an-older-build", "win-unpacked", "Etiuda Studio.exe");

/* THE PACKAGED APP EACH PACKAGE STUB LEAVES, for the bill of materials (3m, 3n). Two archives made
   once by Electron's own @electron/asar: the lab's package.json and engine pin, and the same with
   one npm package the lab's package.json never declared. Every lab gets a node_modules/electron
   manifest and an engine pin of its own, so the SBOM's two named versions are the lab's. */
const LAB_PIN = "0123456789abcdef0123456789abcdef01234567";
const LAB_ELECTRON = "99.1.2";
const APPS = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-studio-release-apps-"));
async function makeApp(name, extra) {
  const src = path.join(APPS, name);
  fs.mkdirSync(path.join(src, "engine", "pinned"), { recursive: true });
  fs.writeFileSync(path.join(src, "package.json"), JSON.stringify({ name: "etiuda-studio", version: "0.1.0" }));
  fs.writeFileSync(path.join(src, "engine", "pinned", ".engine-pin.json"), JSON.stringify({ pin: LAB_PIN }));
  if (extra) {
    fs.mkdirSync(path.join(src, "node_modules", "kappa"), { recursive: true });
    fs.writeFileSync(path.join(src, "node_modules", "kappa", "package.json"), JSON.stringify({ name: "kappa", version: "1.0.0" }));
  }
  const out = path.join(APPS, name + ".asar");
  await createRequire(import.meta.url)("@electron/asar").createPackage(src, out);
  return out;
}
const APP_OK = await makeApp("ok", false);
const APP_EXTRA = await makeApp("extra", true);
const PUT_APP = asarFile => 'fs.mkdirSync(path.join(dist, "win-unpacked", "resources"), { recursive: true });\n'
  + 'fs.copyFileSync(' + JSON.stringify(asarFile) + ', path.join(dist, "win-unpacked", "resources", "app.asar"));\n';
function setupLab(kind, testScript) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-studio-release-" + kind + "-"));
  labs.push(root);
  const lab = path.join(root, "lab");
  const dist = path.join(root, "dist");
  const runs = path.join(root, "runs");
  fs.mkdirSync(path.join(lab, "tools"), { recursive: true });
  fs.mkdirSync(path.join(lab, "tests"), { recursive: true });
  fs.mkdirSync(dist);
  fs.mkdirSync(runs);
  if (fs.existsSync(TOOL)) fs.copyFileSync(TOOL, path.join(lab, "tools", "release.mjs"));
  const SBOM_TOOL = path.join(ROOT, "tools", "sbom.mjs");
  if (fs.existsSync(SBOM_TOOL)) fs.copyFileSync(SBOM_TOOL, path.join(lab, "tools", "sbom.mjs"));
  const SELL_TOOL = path.join(ROOT, "tools", "sellable.mjs");
  if (fs.existsSync(SELL_TOOL)) fs.copyFileSync(SELL_TOOL, path.join(lab, "tools", "sellable.mjs"));
  /* tools/sellable.mjs reads a package's asar through it (the test service build). */
  const TS_TOOL = path.join(ROOT, "tools", "test-service.cjs");
  if (fs.existsSync(TS_TOOL)) fs.copyFileSync(TS_TOOL, path.join(lab, "tools", "test-service.cjs"));
  /* It and electron-builder.js require the eSigner route's module (tools/esigner.cjs). */
  const ES_TOOL = path.join(ROOT, "tools", "esigner.cjs");
  if (fs.existsSync(ES_TOOL)) fs.copyFileSync(ES_TOOL, path.join(lab, "tools", "esigner.cjs"));
  fs.mkdirSync(path.join(lab, "node_modules", "electron"), { recursive: true });
  fs.writeFileSync(path.join(lab, "node_modules", "electron", "package.json"),
    JSON.stringify({ name: "electron", version: LAB_ELECTRON, license: "MIT" }));
  fs.mkdirSync(path.join(lab, "engine", "pinned"), { recursive: true });
  fs.writeFileSync(path.join(lab, "engine", "pinned", ".engine-pin.json"), JSON.stringify({ pin: LAB_PIN }));
  fs.writeFileSync(path.join(lab, "package.json"), JSON.stringify({
    name: "etiuda-studio",
    version: "0.1.0",
    scripts: {
      test: "node tests/" + testScript,
      package: "node tools/pkg-stub.mjs",
      installer: "node tools/inst-stub.mjs",
      packaged: "node tools/launch-stub.mjs",
    },
  }, null, 2) + "\n");
  /* The packaged gate's stub records the exe it was handed and declares what shell-launch
     declares when it launched the packaged app. Leg 10 swaps it for one that did not. */
  fs.writeFileSync(path.join(lab, "tools", "launch-stub.mjs"),
    REC("packaged") + 'import fs from "node:fs";\n'
    + 'fs.writeFileSync("ran-packaged", process.env.ETIUDA_STUDIO_APP_EXE || "");\n'
    + 'console.log("  ok   launch stub");\n'
    + 'console.log("#counts asserted=19 failures=0 notRun=0 packaged=1");\n');
  fs.writeFileSync(path.join(lab, "tests", "ok.mjs"),
    REC("test") + 'console.log("  ok   lab test");\nconsole.log("#counts checks=1 failures=0");\n');
  fs.writeFileSync(path.join(lab, "tests", "fail.mjs"),
    'console.log("  FAIL planted");\nprocess.exit(1);\n');
  fs.writeFileSync(path.join(lab, "tools", "pkg-stub.mjs"),
    REC("package") + 'import fs from "node:fs";\nimport path from "node:path";\n'
    + 'const dist = process.env.ETIUDA_STUDIO_DIST;\n'
    + 'if (!dist) { console.error("pkg-stub: no ETIUDA_STUDIO_DIST"); process.exit(1); }\n'
    + 'fs.mkdirSync(dist, { recursive: true });\n'
    + 'fs.writeFileSync(path.join(dist, "etiuda-studio-0.1.0-setup.exe"), "stub-installer");\n'
    + PUT_APP(APP_OK)
    + 'fs.writeFileSync(path.join(dist, "ran-package"), "1");\n'
    + 'console.log("  ok   package stub");\n');
  fs.writeFileSync(path.join(lab, "tools", "inst-stub.mjs"),
    REC("installer") + 'import fs from "node:fs";\n'
    + 'fs.writeFileSync("ran-installer", process.env.ETIUDA_STUDIO_SETUP_EXE || "");\n'
    + 'console.log("  ok   installer stub");\n'
    + 'console.log("#counts checks=1 failures=0");\n');
  return { root, lab, dist, runs };
}

/* EVERY SIGNING VARIABLE IS TAKEN OUT of every lab's environment unless a leg hands one in, since a
   certificate configured on the desk that runs this would make every stub installer a build
   that must be signed (tools/sellable.mjs), and the labs are about something else. */
/* EVERY LAB IS A REPOSITORY WITH ONE COMMIT when the release starts, because the release refuses a
   tree with anything uncommitted (leg 12) and a lab is a folder the leg has just written into. The
   commit is made here, at each run, so what a stub wrote at the last run is committed too and no
   leg below has to know. Nothing about the lab is hidden from git: a leg that wants a dirty tree
   plants it AFTER this, through `how`. The lab's own git identity, no hooks and no line-ending
   conversion, so the user's configuration cannot make a lab read dirty or refuse the commit. */
const NO_HOOKS = path.join(os.tmpdir(), "etiuda-studio-release-no-hooks");
function labGit(lab, argv) {
  const env = Object.assign({}, process.env);
  for (const k of ["GIT_DIR", "GIT_INDEX_FILE", "GIT_WORK_TREE"]) delete env[k];
  return spawnSync("git", ["-c", "user.name=lab", "-c", "user.email=lab@example.invalid", "-c", "core.autocrlf=false",
    "-c", "core.hooksPath=" + NO_HOOKS, "-c", "commit.gpgsign=false"].concat(argv), { cwd: lab, encoding: "utf8", env });
}
function settle(lab) {
  if (!fs.existsSync(path.join(lab, ".git"))) { labGit(lab, ["init", "-q"]); labGit(lab, ["config", "core.autocrlf", "false"]); }
  labGit(lab, ["add", "-A"]);
  labGit(lab, ["commit", "-q", "--allow-empty", "-m", "lab"]);
}
/* how.plant: a file written after the commit (an untracked one); how.edit: a tracked file appended
   to after it; how.bare: no repository at all, and git told not to look above the lab for one;
   how.hide: status.showUntrackedFiles=no in the lab repository's own configuration. */
function runRelease(lab, argv, dist, runs, more, how) {
  how = how || {};
  if (!how.bare) settle(lab);
  if (how.hide) labGit(lab, ["config", "status.showUntrackedFiles", "no"]);
  if (how.plant) fs.writeFileSync(path.join(lab, how.plant), "not committed\n");
  if (how.edit) fs.appendFileSync(path.join(lab, how.edit), "// edited after the lab was committed\n");
  const env = Object.assign({}, process.env);
  for (const k of SIGNING_VARS) delete env[k];
  for (const k of ["GIT_DIR", "GIT_INDEX_FILE", "GIT_WORK_TREE"]) delete env[k];
  if (how.bare) env.GIT_CEILING_DIRECTORIES = path.dirname(lab);
  return spawnSync(process.execPath, ["tools/release.mjs"].concat(argv), {
    cwd: lab,
    encoding: "utf8",
    env: Object.assign(env, more || {}, {
      ETIUDA_STUDIO_DIST: dist,
      ETIUDA_RUNS: runs,
      /* The release makes its scratch home here, inside the lab, so the lab's removal takes it. */
      ETIUDA_RELEASE_HOME_ROOT: path.dirname(lab),
      /* A stray app named in the environment, which the packaged gate must not launch (3j). */
      ETIUDA_STUDIO_APP_EXE: STRAY_EXE,
    }),
    timeout: 30000,
  });
}

function jsonLines(runs) {
  if (!fs.existsSync(runs)) return [];
  return fs.readdirSync(runs).filter(f => f.endsWith(".json") && !f.startsWith("profile-")).sort().map(f => {
    const p = path.join(runs, f);
    return { file: f, line: JSON.parse(fs.readFileSync(p, "utf8")) };
  });
}

function installers(dist) {
  if (!fs.existsSync(dist)) return [];
  return fs.readdirSync(dist).filter(f => /-setup\.exe$/i.test(f));
}

function combined(r) { return String(r.stdout || "") + String(r.stderr || ""); }

function main() {
  check(fs.existsSync(TOOL), "0 the tool is there: " + TOOL);
  if (!fs.existsSync(TOOL)) {
    process.stdout.write("release-legs: " + asserted + " assertion(s), " + failed + " failure(s)\n");
    process.exit(1);
  }

  /* ---- 1. A PLANTED RED GATE STOPS THE CHAIN ---------------------------------------------- */

  const red = setupLab("red", "fail.mjs");
  const redRun = runRelease(red.lab, [], red.dist, red.runs);
  const redOut = combined(redRun);
  check(redRun.status === 1, "1a planted red stops at gate 1, exit " + redRun.status);
  check(/^gate {2,}exit {2,}counts {2,}wall-clock\s*$/m.test(redOut)
    || /gate\s+exit\s+counts\s+wall-clock/.test(redOut),
    "1b the table names gate, exit, counts, wall-clock");
  check(/^test\s+1\b/m.test(redOut), "1c the table names test with exit 1");
  check(/STOP: test/.test(redOut), "1d STOP names test");
  check(installers(red.dist).length === 0
    && !fs.existsSync(path.join(red.dist, "ran-package")),
    "1e no installer written and package did not run");
  const redJson = jsonLines(red.runs);
  check(redJson.length === 1 && redJson[0].line.gate === "test" && redJson[0].line.exit !== 0
    && redJson[0].line.script === "test" && typeof redJson[0].line.wallMs === "number"
    && typeof redJson[0].line.time === "string",
    "1f one JSON result line, gate test, exit " + (redJson[0] && redJson[0].line.exit)
    + ", keys of the engine's result-line shape");

  /* ---- 2. --dry PRINTS THE TABLE GREEN AND BUILDS NOTHING --------------------------------- */

  const dry = setupLab("dry", "ok.mjs");
  const dryRun = runRelease(dry.lab, ["--dry"], dry.dist, dry.runs);
  const dryOut = combined(dryRun);
  check(dryRun.status === 0, "2a --dry exits 0, exit " + dryRun.status
    + (dryRun.status === 0 ? "" : "; " + dryOut.split(/\r?\n/).filter(Boolean).slice(-3).join(" | ")));
  check(/^test\s+0\b/m.test(dryOut) && /Gates green/.test(dryOut) && /nothing was built/.test(dryOut),
    "2b the table is green on test and the script says nothing was built");
  check(installers(dry.dist).length === 0
    && !fs.existsSync(path.join(dry.dist, "ran-package"))
    && !fs.existsSync(path.join(dry.lab, "ran-installer"))
    && !fs.existsSync(path.join(dry.lab, "ran-packaged")),
    "2c --dry writes no installer and does not run package, installer or the packaged launch");
  const dryJson = jsonLines(dry.runs);
  check(dryJson.length === 1 && dryJson[0].line.gate === "test" && dryJson[0].line.exit === 0,
    "2d one JSON result line for test, exit 0");

  /* ---- 3. THE WHOLE RUN YIELDS THE INSTALLER ---------------------------------------------- */

  const full = setupLab("full", "ok.mjs");
  const fullRun = runRelease(full.lab, [], full.dist, full.runs);
  const fullOut = combined(fullRun);
  check(fullRun.status === 0, "3a the whole run exits 0, exit " + fullRun.status
    + (fullRun.status === 0 ? "" : "; " + fullOut.split(/\r?\n/).filter(Boolean).slice(-3).join(" | ")));
  check(installers(full.dist).join(",") === "etiuda-studio-0.1.0-setup.exe"
    && fs.existsSync(path.join(full.dist, "ran-package")),
    "3b the package stub wrote the installer in the dist folder");
  const setupPassed = fs.existsSync(path.join(full.lab, "ran-installer"))
    ? fs.readFileSync(path.join(full.lab, "ran-installer"), "utf8") : "";
  check(setupPassed.replace(/\\/g, "/") === path.join(full.dist, "etiuda-studio-0.1.0-setup.exe").replace(/\\/g, "/"),
    "3c installer ran against that file: " + JSON.stringify(setupPassed));
  const fullJson = jsonLines(full.runs);
  const byGate = {};
  for (const j of fullJson) byGate[j.line.gate] = j.line;
  const named = ["test", "package", "installer", "packaged"].map(g => g + "=" + (byGate[g] ? byGate[g].exit : "missing")).join(",");
  check(fullJson.length === 4 && named === "test=0,package=0,installer=0,packaged=0"
    && fullJson.every(j => typeof j.line.wallMs === "number" && "counts" in j.line
      && "countsFrom" in j.line && "commit" in j.line && "dirty" in j.line && "time" in j.line
      && "script" in j.line && "cmd" in j.line),
    "3d four JSON result lines, all exit 0, engine shape (" + named + ")");
  /* 3j THE PACKAGED APP IS LAUNCHED AFTER THE BUILD, and it is THIS build's: the gate hands
     shell-launch the dist's own win-unpacked exe by name, even with ETIUDA_STUDIO_APP_EXE set to
     something else in the environment the release was started from (runRelease below). */
  const launched = fs.existsSync(path.join(full.lab, "ran-packaged"))
    ? fs.readFileSync(path.join(full.lab, "ran-packaged"), "utf8") : "";
  const wantExe = path.join(full.dist, "win-unpacked", "Etiuda Studio.exe");
  check(launched.replace(/\\/g, "/") === wantExe.replace(/\\/g, "/")
    && byGate.packaged && byGate.packaged.counts.packaged === 1 && byGate.packaged.counts.notRun === 0,
    "3j a fourth gate launches the packaged app after the build, handed " + JSON.stringify(launched)
    + " against the dist's own " + JSON.stringify(wantExe) + " and not the "
    + JSON.stringify(STRAY_EXE) + " the environment carried; its counts say packaged="
    + (byGate.packaged ? byGate.packaged.counts.packaged : "missing") + " notRun="
    + (byGate.packaged ? byGate.packaged.counts.notRun : "missing"));

  /* 3k THE WHOLE RUN IS IN A SCRATCH HOME OF THE RELEASE'S OWN MAKING (2026-09-25). The installer
     gate installs and uninstalls, and a release that borrowed its caller's profile parked the
     real one. Every gate's stub wrote the profile it was handed: all four must be one home the
     release printed, made inside this lab (ETIUDA_RELEASE_HOME_ROOT), with APPDATA and
     LOCALAPPDATA under it, never the profile this suite was started with; and the home is gone
     after the green. Red on the script before the change: every gate in the caller's profile. */
  const envRows = fs.existsSync(path.join(full.lab, "gate-env.jsonl"))
    ? fs.readFileSync(path.join(full.lab, "gate-env.jsonl"), "utf8").split(/\r?\n/).filter(Boolean).map(l => JSON.parse(l)) : [];
  const homeSaid = (/scratch home, which every gate inherits: (\S+)/.exec(fullOut) || [])[1] || "";
  const low = p => path.resolve(p).toLowerCase();
  const under = (p, dir) => !!p && !!dir && low(p).indexOf(low(dir) + path.sep) === 0;
  const inHome = envRows.filter(r => homeSaid && low(r.USERPROFILE) === low(homeSaid)
    && under(r.APPDATA, homeSaid) && under(r.LOCALAPPDATA, homeSaid)).length;
  check(envRows.map(r => r.gate).join(",") === "test,package,installer,packaged"
    && inHome === 4 && under(homeSaid, full.root)
    && low(homeSaid) !== low(process.env.USERPROFILE || os.homedir()) && !fs.existsSync(homeSaid),
    "3k every gate ran in the release's own scratch home: " + inHome + " of " + envRows.length
    + " gate(s) (" + envRows.map(r => r.gate).join(", ") + ") handed USERPROFILE " + JSON.stringify(homeSaid)
    + " with APPDATA and LOCALAPPDATA under it, made inside the lab (" + under(homeSaid, full.root)
    + "), and removed after the green (" + !fs.existsSync(homeSaid || full.root) + ")");

  /* 3e. THE PACKAGE GATE'S COUNTS BY VALUE, board item 512. 3d asks whether the keys are there
     and every line in this suite has them, so the package floor's `counts = {bytes, mtimeMs};
     from = "setup exe"` could be deleted outright and the suite stayed 21 assertions, 0 failures
     green with the line back to the dead {"lines":0} countsFrom "none" - a result line that says
     nothing about the one artefact the gate exists to produce. What is asserted here is the file
     on disk: its size, its mtime, and that the line count of the gate's output did NOT survive
     into the counts, because a package gate's stdout is not what a package gate makes. */
  const pkgLine = byGate.package;
  const pkgExe = path.join(full.dist, "etiuda-studio-0.1.0-setup.exe");
  const pkgStat = fs.existsSync(pkgExe) ? fs.statSync(pkgExe) : null;
  check(!!pkgLine && !!pkgStat && pkgLine.countsFrom === "setup exe"
    && pkgStat.size > 0 && pkgLine.counts.bytes === pkgStat.size
    && pkgLine.counts.mtimeMs === pkgStat.mtimeMs
    && !("lines" in pkgLine.counts) && !("ok" in pkgLine.counts),
    "3e the package gate's counts are the installer itself: countsFrom "
    + JSON.stringify(pkgLine ? pkgLine.countsFrom : null) + ", bytes "
    + (pkgLine ? pkgLine.counts.bytes : "?") + " against " + (pkgStat ? pkgStat.size : "no file")
    + " on disk, mtimeMs " + (pkgLine ? pkgLine.counts.mtimeMs : "?") + " against "
    + (pkgStat ? pkgStat.mtimeMs : "-") + ", and the output's line count is not in them ("
    + JSON.stringify(pkgLine ? Object.keys(pkgLine.counts).sort() : []) + ")");

  /* 3l THE INSTALLER'S SHA-256 IS PRINTED AND RECORDED (enterprise pack item 5, 2026-09-26), as
     the engine's tools/release.mjs prints its own, so IT can check the file it was handed. The
     oracle is a frozen literal computed outside node, `printf 'stub-installer' | sha256sum`, the
     fourteen bytes the package stub above writes; so a hash of the wrong file, of the wrong bytes
     or of nothing cannot pass by agreeing with a second node call. Read twice: the line the
     release prints beside the file's name, and the package gate's result line. */
  const STUB_SHA256 = "37604a24d2a6fbd9e2bcfc6c6afd4d56a2a33e72cbacf4f50ec822ee7c8561d6";
  const shaSaid = (/etiuda-studio-0\.1\.0-setup\.exe\s+\d+ bytes, sha256 ([0-9a-f]{64})\b/.exec(fullOut) || [])[1] || "";
  check(shaSaid === STUB_SHA256 && !!pkgLine && pkgLine.sha256 === STUB_SHA256,
    "3l the installer's SHA-256 is printed and recorded: printed " + JSON.stringify(shaSaid)
    + ", result line " + JSON.stringify(pkgLine ? pkgLine.sha256 : null) + ", against "
    + STUB_SHA256 + " from sha256sum over the stub's bytes");

  /* 3m THE SOFTWARE BILL OF MATERIALS IS WRITTEN BESIDE THE INSTALLER (enterprise pack item 8),
     from the lab's tree and held against the app the package stub left, and its SHA-256 is printed
     and recorded as the installer's is. What is asserted is the file on disk: beside the
     installer, hashed here from its bytes, naming the lab's own Electron and engine (so it was
     made from THIS tree), carrying the installer's hash against 3l's frozen literal, and saying
     it was held against the packaged app (so the release passed --app). */
  const sbomName = "etiuda-studio-0.1.0-sbom.cdx.json";
  const sbomFile = path.join(full.dist, sbomName);
  const sbomBytes = fs.existsSync(sbomFile) ? fs.readFileSync(sbomFile) : null;
  const sbomHash = sbomBytes ? createHash("sha256").update(sbomBytes).digest("hex") : "";
  let bom = null;
  try { bom = JSON.parse(String(sbomBytes)); } catch (e) { bom = null; }
  const bomComp = n => ((bom && bom.components) || []).find(c => c.name === n) || {};
  const bomDist = bom && bom.metadata && ((bom.metadata.component.externalReferences || []).find(x => x.type === "distribution") || null);
  const bomSource = bom && bom.metadata ? ((bom.metadata.properties || []).find(p => p.name === "etiuda:sbom:source") || {}).value || "" : "";
  const sbomSaid = (/etiuda-studio-0\.1\.0-sbom\.cdx\.json\s+\d+ bytes, sha256 ([0-9a-f]{64})\b/.exec(fullOut) || [])[1] || "";
  check(!!bom && bom.bomFormat === "CycloneDX" && bomComp("electron").version === LAB_ELECTRON
    && bomComp("etiuda-engine").version === LAB_PIN
    && !!bomDist && bomDist.url === "etiuda-studio-0.1.0-setup.exe" && bomDist.hashes[0].content === STUB_SHA256
    && /held against .*app\.asar/.test(bomSource),
    "3m the SBOM is beside the installer (" + !!sbomBytes + "), naming the lab's Electron "
    + JSON.stringify(bomComp("electron").version) + " and engine " + JSON.stringify(bomComp("etiuda-engine").version)
    + ", the installer's hash " + JSON.stringify(bomDist && bomDist.hashes && bomDist.hashes[0].content)
    + ", and held against the packaged app: " + JSON.stringify(bomSource));
  check(!!sbomHash && sbomSaid === sbomHash && !!pkgLine && pkgLine.sbom === sbomName && pkgLine.sbomSha256 === sbomHash,
    "3m2 the SBOM's SHA-256 is printed and recorded: printed " + JSON.stringify(sbomSaid) + ", result line "
    + JSON.stringify(pkgLine ? [pkgLine.sbom, pkgLine.sbomSha256] : null) + ", against " + sbomHash
    + " hashed here from the file on disk");

  /* 3n A LIST THE PACKAGED APP CONTRADICTS STOPS THE RELEASE at the package gate, before the
     installer gate, and leaves no SBOM beside the installer: not a new one, and not the one an
     earlier run left there, which is planted first. */
  const contra = setupLab("sbom-extra", "ok.mjs");
  fs.writeFileSync(path.join(contra.lab, "tools", "pkg-stub.mjs"),
    'import fs from "node:fs";\nimport path from "node:path";\n'
    + 'const dist = process.env.ETIUDA_STUDIO_DIST;\n'
    + 'fs.writeFileSync(path.join(dist, "etiuda-studio-0.1.0-setup.exe"), "stub-installer");\n'
    + PUT_APP(APP_EXTRA)
    + 'console.log("  ok   package stub");\n');
  fs.writeFileSync(path.join(contra.dist, sbomName), '{"left": "by an earlier run"}\n');
  const contraRun = runRelease(contra.lab, [], contra.dist, contra.runs);
  const contraOut = combined(contraRun);
  const contraPkg = jsonLines(contra.runs).map(j => j.line).find(l => l.gate === "package");
  check(contraRun.status === 2 && !!contraPkg && contraPkg.exit === 1 && !contraPkg.sbomSha256
    && /STOP: .*bill of materials.*kappa@1\.0\.0/.test(contraOut)
    && !fs.existsSync(path.join(contra.lab, "ran-installer")),
    "3n an app holding a package the list lacks stops the release, exit " + contraRun.status + ", package gate exit "
    + (contraPkg ? contraPkg.exit : "missing") + ", kappa named (" + /kappa@1\.0\.0/.test(contraOut)
    + "), installer gate not reached (" + !fs.existsSync(path.join(contra.lab, "ran-installer")) + ")");
  check(!fs.existsSync(path.join(contra.dist, sbomName)),
    "3n2 and no SBOM is left beside that installer, the one an earlier run left there included ("
    + !fs.existsSync(path.join(contra.dist, sbomName)) + ")");

  /* 3f TO 3i. EVERY COUNT IN A RESULT LINE, PROVED BY MUTATING IT. Board item 518, after the
     count sampling of reports stopped on 2026-09-18 and the result lines became the only reader
     of the counts. 3e reads the package gate's counts against the file; these four read the
     other three channels the same way, and each is read TWICE: from a lab and from the same lab
     with one planted mutation, the same assertion required to hold on the first and to FAIL on
     the second. A counter stuck at a constant, a writer recording the wrong field and a leg
     looking at the key rather than the value all survive one arm and none survives the pair. */
  const says = (line, want) => !!line && Object.keys(want).every(k => line.counts[k] === want[k]);

  /* 3f the TEST gate, whose counts are the whole chain's output: `ok` and `fail` derived from
     the lines every driver prints, and `checks`/`failures` declared. Method: the lab's test stub
     prints 5 lines beginning with two spaces and `ok`, 2 beginning with two spaces and `FAIL`,
     and one #counts line, so all five numbers are known before the tool runs. The mutant moves
     one ok line to a FAIL line and declares one more failure, which holds the total at 8 so that
     a `lines` count standing in for either would pass the base arm and fail the mutant. */
  const CT = 'console.log("  ok   a");\nconsole.log("  ok   b");\nconsole.log("  ok   c");\n'
    + 'console.log("  ok   d");\nconsole.log("  ok   e");\n'
    + 'console.log("  FAIL f");\nconsole.log("  FAIL g");\n'
    + 'console.log("#counts checks=7 failures=2");\n';
  const CTM = 'console.log("  ok   a");\nconsole.log("  ok   b");\nconsole.log("  ok   c");\n'
    + 'console.log("  ok   d");\n'
    + 'console.log("  FAIL e");\nconsole.log("  FAIL f");\nconsole.log("  FAIL g");\n'
    + 'console.log("#counts checks=7 failures=3");\n';
  const cBase = setupLab("counts", "counted.mjs");
  fs.writeFileSync(path.join(cBase.lab, "tests", "counted.mjs"), CT);
  runRelease(cBase.lab, ["--dry"], cBase.dist, cBase.runs);
  const cMut = setupLab("counts-mutant", "counted.mjs");
  fs.writeFileSync(path.join(cMut.lab, "tests", "counted.mjs"), CTM);
  runRelease(cMut.lab, ["--dry"], cMut.dist, cMut.runs);
  const base = (jsonLines(cBase.runs)[0] || {}).line;
  const mut = (jsonLines(cMut.runs)[0] || {}).line;
  /* `lines` is not in the wanted set: this gate's output is npm's as well as the stub's, two
     banner lines of it, so the number is 10 for a stub printing 8. What is asserted of it is
     that the mutation did NOT move it, which is what makes the two arms a control over ok and
     fail rather than over the volume of output. */
  const want = { ok: 5, fail: 2, checks: 7, failures: 2 };
  check(says(base, want) && base.countsFrom === "ok/FAIL lines and declared" && base.clash === 0
    && says(mut, { ok: 4, fail: 3, checks: 7, failures: 3 })
    && !says(mut, want)
    && base.counts.lines === mut.counts.lines && base.counts.lines >= 8
    && base.counts.ok - mut.counts.ok === 1 && mut.counts.fail - base.counts.fail === 1
    && mut.counts.failures - base.counts.failures === 1
    && mut.counts.checks === base.counts.checks,
    "3f the test gate's counts follow its output, derived and declared alike: "
    + JSON.stringify(base && base.counts) + " against a stub printing 5 ok and 2 FAIL lines and"
    + " declaring checks=7 failures=2, and " + JSON.stringify(mut && mut.counts) + " against the"
    + " same stub with one ok line moved to a FAIL line and one more failure declared. The same"
    + " assertion holds on the first and FAILS on the second, which is what a count stuck at a"
    + " constant cannot do");

  /* 3g TWO GATES, ONE KEY. tests/launch-door.mjs declares `failures` and tests/shell-launch.mjs
     declares `failures`, and this gate's line covers the whole chain, so the second overwrote
     the first with nothing said. The stub prints the two declarations one chain would. */
  const clash = setupLab("clash", "counted.mjs");
  fs.writeFileSync(path.join(clash.lab, "tests", "counted.mjs"),
    'console.log("#counts checks=7 failures=2");\nconsole.log("#counts failures=5 sites=3");\n');
  const clashRun = runRelease(clash.lab, ["--dry"], clash.dist, clash.runs);
  const clashLine = (jsonLines(clash.runs)[0] || {}).line;
  check(clashLine && clashLine.clash === 1 && clashLine.counts.failures === 5
    && clashLine.counts.checks === 7 && clashLine.counts.sites === 3
    && clashLine.countsFrom === "declared"
    && /clash: 1 key\(s\) declared twice with different values, the later kept: failures/
       .test(combined(clashRun))
    && base.clash === 0 && mut.clash === 0,
    "3g a key two gates of one chain declare differently is counted as a clash and said on the"
    + " console, the later value kept: clash " + (clashLine && clashLine.clash) + ", counts "
    + JSON.stringify(clashLine && clashLine.counts) + "; and the control arm, a chain declaring"
    + " each key once, is clash " + (base && base.clash) + " - so it reddens on the fault and"
    + " not on the pattern");

  /* 3h and 3i, the mutation arms for the other two channels: the package gate's bytes, which 3e
     reads against the file, and the installer gate's declared counts. A package gate whose size
     were hard-coded at the fourteen bytes the ordinary stub writes would pass 3e; it cannot pass
     a second lab whose stub writes a different length. */
  const other = setupLab("other-lengths", "ok.mjs");
  const PAYLOAD = "stub-installer, and a good deal more of it than the other labs write, so that"
    + " a size recorded from anywhere but this file is a different number";
  fs.writeFileSync(path.join(other.lab, "tools", "pkg-stub.mjs"),
    'import fs from "node:fs";\nimport path from "node:path";\n'
    + 'const dist = process.env.ETIUDA_STUDIO_DIST;\n'
    + 'fs.mkdirSync(dist, { recursive: true });\n'
    + 'fs.writeFileSync(path.join(dist, "etiuda-studio-0.1.0-setup.exe"), '
    + JSON.stringify(PAYLOAD) + ');\n'
    + PUT_APP(APP_OK)
    + 'console.log("  ok   package stub");\n');
  fs.writeFileSync(path.join(other.lab, "tools", "inst-stub.mjs"),
    'console.log("  ok   installer stub");\nconsole.log("#counts checks=9 failures=2");\n');
  runRelease(other.lab, [], other.dist, other.runs);
  const otherBy = {};
  for (const j of jsonLines(other.runs)) otherBy[j.line.gate] = j.line;
  const otherExe = path.join(other.dist, "etiuda-studio-0.1.0-setup.exe");
  const otherStat = fs.existsSync(otherExe) ? fs.statSync(otherExe) : null;
  check(otherBy.package && otherStat && otherBy.package.counts.bytes === otherStat.size
    && otherBy.package.counts.bytes === PAYLOAD.length
    && pkgLine && otherBy.package.counts.bytes !== pkgLine.counts.bytes
    && otherBy.package.counts.mtimeMs === otherStat.mtimeMs,
    "3h the package gate's bytes follow the file: " + (otherBy.package
      ? otherBy.package.counts.bytes : "?") + " for a stub writing " + PAYLOAD.length
    + " byte(s), against " + (pkgLine ? pkgLine.counts.bytes : "?")
    + " at 3e for the ordinary stub. A size read from anywhere but that file, or held at a"
    + " constant, passes one of the two and not both");
  check(otherBy.installer && otherBy.installer.counts.checks === 9
    && otherBy.installer.counts.failures === 2
    && byGate.installer && byGate.installer.counts.checks === 1
    && byGate.installer.counts.failures === 0,
    "3i and the installer gate's declared counts follow what its script declared: checks "
    + (otherBy.installer && otherBy.installer.counts.checks) + " failures "
    + (otherBy.installer && otherBy.installer.counts.failures) + " here against checks "
    + (byGate.installer && byGate.installer.counts.checks) + " failures "
    + (byGate.installer && byGate.installer.counts.failures) + " at leg 3");

  /* ---- 4. NEVER TAGS, NEVER PUSHES -------------------------------------------------------- */

  const tagged = runRelease(dry.lab, ["--tag"], dry.dist, path.join(dry.root, "runs-tag"));
  fs.mkdirSync(path.join(dry.root, "runs-tag"), { recursive: true });
  check(tagged.status === 1 && /no --tag/.test(combined(tagged)),
    "4a --tag is refused, exit " + tagged.status);
  const pushed = runRelease(dry.lab, ["--push"], dry.dist, path.join(dry.root, "runs-push"));
  check(pushed.status === 1 && /no --push/.test(combined(pushed)),
    "4b --push is refused, exit " + pushed.status);
  const src = fs.readFileSync(TOOL, "utf8");
  check(!/\bgit(\.exe)?\s+tag\b/.test(src) && !/\bgit(\.exe)?\s+push\b/.test(src),
    "4c the script does not invoke git tag or git push");

  /* ---- 5. A STALE INSTALLER DOES NOT PASS THE INSTALLER GATE ------------------------------ */

  const stale = setupLab("stale", "ok.mjs");
  const staleExe = path.join(stale.dist, "etiuda-studio-0.1.0-setup.exe");
  fs.writeFileSync(staleExe, "stale-installer");
  const staleAge = new Date(Date.now() - 26 * 60 * 60 * 1000);
  fs.utimesSync(staleExe, staleAge, staleAge);
  fs.writeFileSync(path.join(stale.lab, "tools", "pkg-stub.mjs"),
    'import fs from "node:fs";\nimport path from "node:path";\n'
    + 'const dist = process.env.ETIUDA_STUDIO_DIST;\n'
    + 'if (!dist) { console.error("pkg-stub: no ETIUDA_STUDIO_DIST"); process.exit(1); }\n'
    + 'fs.writeFileSync(path.join(dist, "ran-package"), "1");\n'
    + 'console.log("  ok   package stub");\n');
  const staleRun = runRelease(stale.lab, [], stale.dist, stale.runs);
  const staleOut = combined(staleRun);
  const staleJson = jsonLines(stale.runs);
  const stalePkg = staleJson.find(j => j.line.gate === "package");
  check(staleRun.status === 2
    && stalePkg && stalePkg.line.exit === 1
    && /STOP: the installer predates this run's package gate/.test(staleOut)
    && /etiuda-studio-0\.1\.0-setup\.exe/.test(staleOut)
    && !fs.existsSync(path.join(stale.lab, "ran-installer")),
    "5 a stale installer stops the package gate, exit " + staleRun.status
    + ", gate exit " + (stalePkg ? stalePkg.line.exit : "missing")
    + ", installer script not spawned");

  /* ---- 6. A FRESH INSTALLER REACHES THE INSTALLER GATE ------------------------------------ */

  const fresh = setupLab("fresh", "ok.mjs");
  const freshRun = runRelease(fresh.lab, [], fresh.dist, fresh.runs);
  check(freshRun.status === 0
    && fs.existsSync(path.join(fresh.lab, "ran-installer")),
    "6 a fresh installer reaches the installer gate, exit " + freshRun.status);

  /* ---- 7. A PACKAGE STUB THAT WRITES NOTHING REDDENS THE PACKAGE GATE --------------------- */

  const silent = setupLab("silent", "ok.mjs");
  fs.writeFileSync(path.join(silent.lab, "tools", "pkg-stub.mjs"),
    'console.log("  ok   package stub");\n');
  const silentRun = runRelease(silent.lab, [], silent.dist, silent.runs);
  const silentOut = combined(silentRun);
  const silentJson = jsonLines(silent.runs);
  const silentPkg = silentJson.find(j => j.line.gate === "package");
  const silentInst = silentJson.find(j => j.line.gate === "installer");
  check(silentRun.status === 2
    && silentPkg && silentPkg.line.exit !== 0
    && !silentInst
    && /STOP: no installer/.test(silentOut)
    && !fs.existsSync(path.join(silent.lab, "ran-installer")),
    "7 a package stub that writes nothing reddens the package gate, exit " + silentRun.status
    + ", gate exit " + (silentPkg ? silentPkg.line.exit : "missing")
    + ", installer " + (silentInst ? "ran" : "not reached"));

  /* ---- 8. ONE JUDGEMENT OF THE INSTALLER, NOT TWO ----------------------------------------- */
  /* Board item 512's other half. The installer gate's two pre-checks and the package gate's floor
     asked the same two questions in two implementations, and because the floor stops the run
     first the pre-check bodies could not be reached at all: a `throw` planted in both of them
     left this suite 21 assertions, 0 failures green, while the same `throw` in the floor reddened
     it 20/1. They are one function now, judgeInstaller, called from the floor - which cases 5 and
     7 drive - and from the installer gate. This is the guard against the copy coming back, and it
     is a count over the source rather than a run: the two stop messages are written once each,
     and the function is named three times, its declaration and its two call sites. */
  const oneJudge = fs.readFileSync(TOOL, "utf8");
  const saidNoInstaller = (oneJudge.match(/"no installer in "/g) || []).length;
  const saidPredates = (oneJudge.match(/"the installer predates this run's package gate: "/g) || []).length;
  const namedJudge = (oneJudge.match(/judgeInstaller\(/g) || []).length;
  check(saidNoInstaller === 1 && saidPredates === 1 && namedJudge === 3,
    "8 the installer is judged in one place: the two stop messages occur " + saidNoInstaller
    + " and " + saidPredates + " time(s) in tools/release.mjs and judgeInstaller is named "
    + namedJudge + " time(s) - one declaration and two call sites - by regex over the file on"
    + " disk. A second copy of either check is unreachable behind the floor and this goes red");

  /* ---- 10. A PACKAGED GATE THAT LAUNCHED NOTHING IS RED ---------------------------------- */
  /* THE CONTROL FOR 3j, and the reason the gate reads counts rather than an exit code:
     tests/shell-launch.mjs exits 0 when it finds no packaged app, printing 5a-5d NOT RUN and
     packaged=0. Measured on 2026-09-24 with ETIUDA_STUDIO_DIST naming a folder that holds no
     win-unpacked: exit 0, "#counts asserted=15 failures=0 notRun=4 packaged=0". A gate trusting
     the exit code would pass it; this stub prints exactly that line. */
  const none = setupLab("packaged-none", "ok.mjs");
  fs.writeFileSync(path.join(none.lab, "tools", "launch-stub.mjs"),
    'console.log("  --   5a-5d NOT RUN: no packaged app");\n'
    + 'console.log("#counts asserted=15 failures=0 notRun=4 packaged=0");\n');
  const noneRun = runRelease(none.lab, [], none.dist, none.runs);
  const noneOut = combined(noneRun);
  const noneLine = jsonLines(none.runs).map(j => j.line).find(l => l.gate === "packaged");
  check(noneRun.status === 4 && noneLine && noneLine.exit === 1
    && /STOP: the packaged app was not launched: shell-launch said packaged=0 notRun=4/.test(noneOut)
    && /STOP: packaged/.test(noneOut),
    "10 control: a packaged gate whose script exits 0 having launched nothing (packaged=0,"
    + " notRun=4) stops the release, exit " + noneRun.status + ", result line exit "
    + (noneLine ? noneLine.exit : "missing"));

  /* ---- 11. A CUSTOMER BUILD IS JUDGED, A PREVIEW IS TOLD ----------------------------------- */
  /* Each lab carries what the judgement reads: the real src/licence.mjs with its key line planted
     (null, or a key) and a src/sign.mjs that re-exports the real one, the real electron-builder.js,
     and licence pages planted both ways from the real English page, so no leg here fights the day
     the seller or the key is filled in. The package stub leaves a SIGNED installer and program,
     copies of a tool Windows reads Valid and timestamped, touched so the floor takes them for this
     run's; 11d gives the program a copy with one byte changed. */
  const REAL_LICENCE = fs.readFileSync(path.join(ROOT, "src", "licence.mjs"), "utf8");
  const KEY_LINE = /const EMBEDDED_VENDOR_ROOT_KEY = [^;\n]*;/;
  const withKey = k => REAL_LICENCE.replace(KEY_LINE, "const EMBEDDED_VENDOR_ROOT_KEY = " + (k ? JSON.stringify(k) : "null") + ";");
  const HEX = "0123456789abcdef".repeat(4);
  const PAGE_EN = fs.readFileSync(path.join(ROOT, "packaging", "license_en.txt"), "utf8");
  const FILLED = PAGE_EN.replace(/\[[^\]\r\n]*\]/g, "Example Trading");
  const HOLED = FILLED.replace(/\n/, "\n[Seller's legal name], [registered address]\n");
  const SIGNED = path.join(ROOT, "node_modules", "@electron", "windows-sign", "vendor", "signtool.exe");
  const BENT = path.join(APPS, "signtool-bent.exe");
  if (fs.existsSync(SIGNED)) { const b = fs.readFileSync(SIGNED); b[b.length >> 1] ^= 0xff; fs.writeFileSync(BENT, b); }
  const CERT = { ETIUDA_CERT: "C:/nowhere/etiuda.pfx" };
  function customerLab(kind, o) {
    const l = setupLab(kind, "ok.mjs");
    const pkgFile = path.join(l.lab, "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf8"));
    pkg.version = o.version;
    fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + "\n");
    fs.mkdirSync(path.join(l.lab, "src"), { recursive: true });
    fs.writeFileSync(path.join(l.lab, "src", "licence.mjs"), withKey(o.key));
    fs.writeFileSync(path.join(l.lab, "src", "sign.mjs"),
      "export * from " + JSON.stringify(pathToFileURL(path.join(ROOT, "src", "sign.mjs")).href) + ";\n");
    /* The sign-in table the release asks of src/licence-client.mjs (tools/sellable.mjs packagedSignIn, the test architect, 2026-11-22):
       a stand-in naming both client ids, so these legs judge what they name and not the day the real ids arrive; tests/sellable.mjs
       2s holds the question itself against the real module. */
    fs.writeFileSync(path.join(l.lab, "src", "licence-client.mjs"), "export const SIGN_IN_PROVIDERS = " + JSON.stringify([
      { id: "microsoft", clientId: "11111111-2222-3333-4444-555555555555" }, { id: "google", clientId: "1234567890-abc.apps.googleusercontent.com" }]) + ";\n");
    fs.mkdirSync(path.join(l.lab, "packaging"));
    for (const f of ["license_en.txt", "license_pl.txt"]) fs.writeFileSync(path.join(l.lab, "packaging", f), o.page);
    fs.copyFileSync(path.join(ROOT, "electron-builder.js"), path.join(l.lab, "electron-builder.js"));
    fs.copyFileSync(path.join(ROOT, "tools", "signin-secret.cjs"), path.join(l.lab, "tools", "signin-secret.cjs"));
    fs.copyFileSync(path.join(ROOT, "tools", "test-service.cjs"), path.join(l.lab, "tools", "test-service.cjs"));
    fs.copyFileSync(path.join(ROOT, "tools", "seller-address.cjs"), path.join(l.lab, "tools", "seller-address.cjs"));
    fs.copyFileSync(path.join(ROOT, "tools", "esigner.cjs"), path.join(l.lab, "tools", "esigner.cjs"));
    /* MICROSOFT IS NO MAKER IN THIS LAB. The one Valid, timestamped tool these legs sign with is Microsoft's, which the gate
       refuses as a maker's program (tests/sign-all.mjs 2j, tests/sellable.mjs 6f); the lab's own copy of tools/sellable.mjs
       holds an empty makers' list, so that tool stands in for our signature while Windows' readings stay real. */
    const sellAt = path.join(l.lab, "tools", "sellable.mjs"), sellText = fs.readFileSync(sellAt, "utf8");
    const noMakers = sellText.replace(/^export const MAKERS = \[[^\n]*\];$/m, "export const MAKERS = [];");
    if (noMakers === sellText) throw new Error("tools/sellable.mjs no longer declares MAKERS on one line, where this lab empties it");
    fs.writeFileSync(sellAt, noMakers);
    const put = (from, to) => 'fs.copyFileSync(' + JSON.stringify(from) + ', ' + to + ');\n'
      + 'fs.utimesSync(' + to + ', new Date(), new Date());\n';
    fs.writeFileSync(path.join(l.lab, "tools", "pkg-stub.mjs"),
      'import fs from "node:fs";\nimport path from "node:path";\n'
      + 'const dist = process.env.ETIUDA_STUDIO_DIST;\n'
      + 'fs.mkdirSync(path.join(dist, "win-unpacked"), { recursive: true });\n'
      + put(SIGNED, 'path.join(dist, "etiuda-studio-' + o.version + '-setup.exe")')
      + put(o.program || SIGNED, 'path.join(dist, "win-unpacked", "Etiuda Studio.exe")')
      + PUT_APP(APP_OK)
      + 'console.log("  ok   package stub");\n');
    if (!o.noSummary) {
      settle(l.lab);
      const labTree = (labGit(l.lab, ["rev-parse", "HEAD^{tree}"]).stdout || "").trim();
      writeProfileSummary(l.runs, labTree);
    }
    return l;
  }

  function writeProfileSummary(runsDir, treeSha, opts = {}) {
    const profile = opts.profile || "release";
    const gatesRun = opts.gatesRun || ["tests-chain-split", "tests-plant-hold"];
    const profileGates = opts.profileGates || gatesRun;
    const holdsRed = opts.holdsRed != null ? opts.holdsRed : 0;
    const warnsRed = opts.warnsRed != null ? opts.warnsRed : 0;
    const reds = opts.reds || [];
    if (holdsRed > 0 && !reds.length) {
      reds.push({ gate: "tests-failing", cmd: "node tests/failing.mjs", exit: 1, cause: "unread", class: "hold" });
    }
    if (warnsRed > 0 && !reds.some(r => r.class === "warn")) {
      reds.push({ gate: "tests-warning", cmd: "node tests/warning.mjs", exit: 1, cause: "unread", class: "warn" });
    }
    const summary = {
      kind: "profile",
      profile,
      gitTree: treeSha,
      commit: opts.commit || "1234567",
      gatesRun,
      profileGates,
      gatesRunCount: gatesRun.length,
      profileGatesCount: profileGates.length,
      holds: holdsRed,
      warns: warnsRed,
      holdsRed,
      warnsRed,
      reds,
      time: opts.time || new Date().toISOString(),
    };
    const stampStr = opts.stamp || "20261108T010000-000";
    const file = path.join(runsDir, "profile-" + profile + "-" + stampStr + ".json");
    fs.writeFileSync(file, JSON.stringify(summary, null, 2) + "\n", "utf8");
    return file;
  }
  const planted = KEY_LINE.test(REAL_LICENCE) && fs.existsSync(SIGNED);

  const refused = customerLab("sell-refused", { version: "1.0.0", key: null, page: HOLED });
  const refusedRun = runRelease(refused.lab, [], refused.dist, refused.runs);
  const refusedOut = combined(refusedRun);
  const refusedJson = jsonLines(refused.runs).map(j => j.line);
  check(planted && refusedRun.status === 5 && refusedJson.length === 1 && refusedJson[0].gate === "sellable"
    && refusedJson[0].exit === 1 && /STOP: sellable/.test(refusedOut)
    && /no vendor key is embedded/.test(refusedOut) && /license_en\.txt still carries 2 placeholder/.test(refusedOut)
    && /no certificate is configured/.test(refusedOut)
    && !fs.existsSync(path.join(refused.lab, "gate-env.jsonl")) && installers(refused.dist).length === 0,
    "11a a customer version (1.0.0) with a null vendor key, a placeholder and no certificate stops before gate 1,"
    + " exit " + refusedRun.status + ", one result line (" + refusedJson.map(l => l.gate + "=" + l.exit).join(",")
    + "), naming all three, nothing tested and nothing built (key line planted: " + KEY_LINE.test(REAL_LICENCE) + ")");

  const rehearsed = customerLab("sell-rehearsed", { version: "0.1.0", key: HEX, page: FILLED });
  const rehearsedRun = runRelease(rehearsed.lab, ["--customer"], rehearsed.dist, rehearsed.runs, CERT);
  const rehearsedOut = combined(rehearsedRun);
  const rehearsedFails = rehearsedOut.split(/\r?\n/).filter(l => /^ {2}FAIL /.test(l));
  check(rehearsedRun.status === 5 && rehearsedFails.length === 1 && /has major 0/.test(rehearsedFails[0]),
    "11b --customer asks a preview version the customer's questions, and with the key, the page and the"
    + " certificate in place only the version is refused, exit " + rehearsedRun.status + ": " + rehearsedFails.join(" | "));

  const aside11c = releaseAside("11c");
  if (aside11c) skipAside(aside11c);
  else {
    const sold = customerLab("sell-ok", { version: "1.0.0", key: HEX, page: FILLED });
    const soldRun = runRelease(sold.lab, [], sold.dist, sold.runs, CERT);
    const soldOut = combined(soldRun);
    const soldBy = {};
    for (const l of jsonLines(sold.runs).map(j => j.line)) soldBy[l.gate] = l.exit;
    const soldNamed = ["sellable", "test", "package", "installer", "packaged"].map(g => g + "=" + soldBy[g]).join(",");
    check(soldRun.status === 0 && soldNamed === "sellable=0,test=0,package=0,installer=0,packaged=0"
      && (soldOut.match(/Authenticode: Valid, timestamped/g) || []).length === 2,
      "11c a sellable customer build (key embedded, page filled, certificate configured, installer and program"
      + " signed) runs every gate green, exit " + soldRun.status + " (" + soldNamed + "), both files read Valid"
      + (soldRun.status === 0 ? "" : "; " + soldOut.split(/\r?\n/).filter(Boolean).slice(-3).join(" | ")));
  }

  const aside11d = releaseAside("11d");
  if (aside11d) skipAside(aside11d);
  else {
    const bent = customerLab("sell-bent", { version: "1.0.0", key: HEX, page: FILLED, program: BENT });
    const bentRun = runRelease(bent.lab, [], bent.dist, bent.runs, CERT);
    const bentOut = combined(bentRun);
    const bentPkg = jsonLines(bent.runs).map(j => j.line).find(l => l.gate === "package");
    check(bentRun.status === 2 && bentPkg && bentPkg.exit === 1
      && /STOP: the signature: Etiuda Studio\.exe reads Authenticode HashMismatch, not Valid/.test(bentOut),
      "11d the same build with its PROGRAM changed by one byte after signing stops at the package gate, exit "
      + bentRun.status + ", gate exit " + (bentPkg ? bentPkg.exit : "missing") + ", naming the program");
  }

  check(/PREVIEW 0\.1\.0, not for a customer; as a customer build it would stop on \d+: /.test(fullOut)
    && /the signature is not asked: a preview with no certificate configured/.test(fullOut) && !byGate.sellable,
    "11e the preview of leg 3 was told what would stop it, was not asked for a signature and wrote no"
    + " sellable line, and ran green as it always has");

  /* ---- 12. A RELEASE IS OF A COMMIT, AND A DIRTY TREE IS REFUSED (board 828, rehearsal line 9) ---- */
  /* Studio's release only RECORDED `dirty` and went on: a --dry with an untracked file was green
     with "dirty":true. The engine's release gate 1 refuses, and this is the same gate here, numbered 6
     as `sellable` is 5 so that the four keep their numbers, and first in the run. 12b is the control
     and holds on the script before the change as after it: the same lab, clean, is green. The other
     four are red before the change. A refusal writes its one result line and its table row; a pass
     writes neither, as a preview's sellable does, so no line of any earlier leg moved. */
  const tidy = setupLab("tidy", "ok.mjs");
  const tidyRun = runRelease(tidy.lab, ["--dry"], tidy.dist, tidy.runs);
  const tidyOut = combined(tidyRun);
  const tidyLines = jsonLines(tidy.runs).map(j => j.line);
  check(tidyRun.status === 0 && /Gates green/.test(tidyOut) && tidyLines.length === 1
    && tidyLines[0].gate === "test" && tidyLines[0].dirty === false,
    "12b control: a clean lab is green under --dry, exit " + tidyRun.status + ", one result line ("
    + tidyLines.map(l => l.gate + "=" + l.exit + " dirty " + l.dirty).join(",") + ")");
  const tidyAt = (labGit(tidy.lab, ["rev-parse", "--short", "HEAD"]).stdout || "").trim();
  check(!!tidyAt && new RegExp("ok {3}the tree is clean: " + tidyAt + " on \\S+").test(tidyOut),
    "12c a clean lab is told which commit the release is of: " + JSON.stringify(tidyAt) + " against the lab's own HEAD, in "
    + JSON.stringify((/ok {3}the tree is clean[^\r\n]*/.exec(tidyOut) || [""])[0]));

  const dirty = setupLab("dirty", "ok.mjs");
  const dirtyRun = runRelease(dirty.lab, ["--dry"], dirty.dist, dirty.runs, null, { plant: "stray-note.txt" });
  const dirtyOut = combined(dirtyRun);
  const dirtyLines = jsonLines(dirty.runs).map(j => j.line);
  check(dirtyRun.status === 6 && /STOP: clean/.test(dirtyOut)
    && /uncommitted changes; a release is of a commit, not of a working tree/.test(dirtyOut)
    && /\?\? stray-note\.txt/.test(dirtyOut) && !/Gates green/.test(dirtyOut)
    && dirtyLines.length === 1 && dirtyLines[0].gate === "clean" && dirtyLines[0].exit === 1 && dirtyLines[0].dirty === true
    && !fs.existsSync(path.join(dirty.lab, "gate-env.jsonl")),
    "12a an untracked file in a lab refuses --dry as gate clean, exit " + dirtyRun.status + ", naming the file, one result line ("
    + dirtyLines.map(l => l.gate + "=" + l.exit + " dirty " + l.dirty).join(",") + ") and the test gate never ran ("
    + !fs.existsSync(path.join(dirty.lab, "gate-env.jsonl")) + ")");

  /* 12f and 12g, THE GATE UNDER git's status.showUntrackedFiles=no (board 830). That setting, global or in the
     repository, makes `git status` say nothing of an untracked file, and the gate passed a tree that was not the
     commit. 12f plants it in the lab repository's own configuration beside the stray file, and first reads that
     it works (plain `git status --porcelain` says nothing, `--untracked-files=all` names the file), so the
     refusal it wants is the flag's doing. 12g is the control: the same setting over a clean lab is green. */
  const hidden = setupLab("hidden", "ok.mjs");
  const hiddenRun = runRelease(hidden.lab, ["--dry"], hidden.dist, hidden.runs, null, { hide: true, plant: "stray-note.txt" });
  const hiddenOut = combined(hiddenRun);
  const plainSays = (labGit(hidden.lab, ["status", "--porcelain"]).stdout || "").trim();
  const allSays = (labGit(hidden.lab, ["status", "--porcelain", "--untracked-files=all"]).stdout || "").trim();
  check(plainSays === "" && /\?\? stray-note\.txt/.test(allSays) && hiddenRun.status === 6 && /STOP: clean/.test(hiddenOut)
    && /\?\? stray-note\.txt/.test(hiddenOut) && !/Gates green/.test(hiddenOut)
    && !fs.existsSync(path.join(hidden.lab, "gate-env.jsonl")),
    "12f with status.showUntrackedFiles=no in the lab's configuration (plain git status says " + JSON.stringify(plainSays)
    + ", --untracked-files=all says " + JSON.stringify(allSays) + ") an untracked file still refuses --dry as gate clean, exit "
    + hiddenRun.status + (hiddenRun.status === 6 ? "" : ", the run went on: " + JSON.stringify(combined(hiddenRun).split(/\r?\n/).filter(Boolean).slice(-2).join(" | "))));
  const quiet = setupLab("hidden-clean", "ok.mjs");
  const quietRun = runRelease(quiet.lab, ["--dry"], quiet.dist, quiet.runs, null, { hide: true });
  check(quietRun.status === 0 && /Gates green/.test(combined(quietRun)),
    "12g CONTROL: the same setting over a lab with nothing untracked is green under --dry, exit " + quietRun.status
    + ", so 12f reddens on the file and not on the setting");

  const edited = setupLab("edited", "ok.mjs");
  const editedRun = runRelease(edited.lab, [], edited.dist, edited.runs, null, { edit: path.join("tests", "ok.mjs") });
  const editedOut = combined(editedRun);
  check(editedRun.status === 6 && /STOP: clean/.test(editedOut) && /^ {8}M tests\/ok\.mjs$/m.test(editedOut)
    && installers(edited.dist).length === 0 && !fs.existsSync(path.join(edited.dist, "ran-package"))
    && !fs.existsSync(path.join(edited.lab, "gate-env.jsonl")),
    "12e a modified TRACKED file refuses a whole run too, exit " + editedRun.status + ", and nothing was tested or built ("
    + (installers(edited.dist).length === 0 && !fs.existsSync(path.join(edited.lab, "gate-env.jsonl"))) + ")");

  const bare = setupLab("bare", "ok.mjs");
  const bareRun = runRelease(bare.lab, ["--dry"], bare.dist, bare.runs, null, { bare: true });
  const bareOut = combined(bareRun);
  check(bareRun.status === 6 && /STOP: clean/.test(bareOut) && /could not read this tree's status/.test(bareOut)
    && !/Gates green/.test(bareOut) && !fs.existsSync(path.join(bare.lab, "gate-env.jsonl")),
    "12d a folder that is no repository is refused, exit " + bareRun.status + ", not read as clean: git failing to answer is"
    + " a reason of its own (" + JSON.stringify((/FAIL [^\r\n]*/.exec(bareOut) || [""])[0]) + ")");

  /* ---- 13. A CUSTOMER BUILD REQUIRES A GREEN RELEASE PROFILE (regimen rule 4, decision 2026-11-05 11:43) ---- */
  /* Whatever reaches a customer ships only from a tree whose release profile is green on that same tree,
     with no red of class hold. A test build for Maxim alone needs no release profile, and no tool refuses it. */

  /* Leg 1: A customer build with no summary for its tree is refused, and nothing is built or tested past the refusal. */
  const cLab1 = customerLab("profile-missing", { version: "1.0.0", key: HEX, page: FILLED, noSummary: true });
  const cRun1 = runRelease(cLab1.lab, [], cLab1.dist, cLab1.runs, CERT);
  const cOut1 = combined(cRun1);
  const cJson1 = jsonLines(cLab1.runs).map(j => j.line);
  check(cRun1.status === 5 && cJson1.length === 1 && cJson1[0].gate === "sellable" && cJson1[0].exit === 1
    && /STOP: sellable/.test(cOut1)
    && /no release profile summary found for git tree/.test(cOut1)
    && /run node tools\/gate-run\.mjs release/.test(cOut1)
    && !fs.existsSync(path.join(cLab1.lab, "gate-env.jsonl")) && installers(cLab1.dist).length === 0,
    "13a (leg 1) a customer build with no summary for its tree is refused before gate 1, exit " + cRun1.status
    + ", one result line (sellable=1), naming what is missing and how to get it, and nothing tested or built");

  /* Leg 2: The same with a summary for another tree: refused. */
  const cLab2 = customerLab("profile-other-tree", { version: "1.0.0", key: HEX, page: FILLED, noSummary: true });
  settle(cLab2.lab);
  writeProfileSummary(cLab2.runs, "0000000000000000000000000000000000000000");
  const cRun2 = runRelease(cLab2.lab, [], cLab2.dist, cLab2.runs, CERT);
  const cOut2 = combined(cRun2);
  const cJson2 = jsonLines(cLab2.runs).map(j => j.line);
  check(cRun2.status === 5 && cJson2.length === 1 && cJson2[0].gate === "sellable" && cJson2[0].exit === 1
    && /STOP: sellable/.test(cOut2)
    && /no release profile summary found for git tree/.test(cOut2)
    && /0000000000000000000000000000000000000000/.test(cOut2)
    && !fs.existsSync(path.join(cLab2.lab, "gate-env.jsonl")) && installers(cLab2.dist).length === 0,
    "13b (leg 2) a customer build with a summary for another tree is refused, exit " + cRun2.status
    + ", naming both trees, and nothing tested or built");

  /* Leg 3: A summary with a hold red: refused. A warn red alone: allowed. */
  const cLab3Hold = customerLab("profile-hold-red", { version: "1.0.0", key: HEX, page: FILLED, noSummary: true });
  settle(cLab3Hold.lab);
  const tree3Hold = (labGit(cLab3Hold.lab, ["rev-parse", "HEAD^{tree}"]).stdout || "").trim();
  writeProfileSummary(cLab3Hold.runs, tree3Hold, { holdsRed: 1, warnsRed: 0 });
  const cRun3Hold = runRelease(cLab3Hold.lab, [], cLab3Hold.dist, cLab3Hold.runs, CERT);
  const cOut3Hold = combined(cRun3Hold);
  const cJson3Hold = jsonLines(cLab3Hold.runs).map(j => j.line);
  check(cRun3Hold.status === 5 && cJson3Hold.length === 1 && cJson3Hold[0].gate === "sellable" && cJson3Hold[0].exit === 1
    && /STOP: sellable/.test(cOut3Hold)
    && /class hold/.test(cOut3Hold)
    && !fs.existsSync(path.join(cLab3Hold.lab, "gate-env.jsonl")) && installers(cLab3Hold.dist).length === 0,
    "13c (leg 3a) a customer build with a summary holding a hold red is refused before gate 1, exit " + cRun3Hold.status
    + ", naming the hold red, and nothing tested or built");

  const aside13cleg3b = releaseAside("13c (leg 3b)");
  if (aside13cleg3b) skipAside(aside13cleg3b);
  else {
    const cLab3Warn = customerLab("profile-warn-red", { version: "1.0.0", key: HEX, page: FILLED, noSummary: true });
    settle(cLab3Warn.lab);
    const tree3Warn = (labGit(cLab3Warn.lab, ["rev-parse", "HEAD^{tree}"]).stdout || "").trim();
    writeProfileSummary(cLab3Warn.runs, tree3Warn, { holdsRed: 0, warnsRed: 1 });
    const cRun3Warn = runRelease(cLab3Warn.lab, [], cLab3Warn.dist, cLab3Warn.runs, CERT);
    const cBy3Warn = {};
    for (const l of jsonLines(cLab3Warn.runs).map(j => j.line)) cBy3Warn[l.gate] = l.exit;
    check(cRun3Warn.status === 0 && cBy3Warn.sellable === 0 && cBy3Warn.test === 0 && installers(cLab3Warn.dist).length === 1,
      "13c (leg 3b) a customer build with a summary holding a warn red alone is allowed past sellable and runs all gates green, exit 0");
  }

  /* Leg 4: A green whole summary for the tree: allowed past this gate. */
  const aside13d = releaseAside("13d");
  if (aside13d) skipAside(aside13d);
  else {
    const cLab4 = customerLab("profile-green", { version: "1.0.0", key: HEX, page: FILLED, noSummary: true });
    settle(cLab4.lab);
    const tree4 = (labGit(cLab4.lab, ["rev-parse", "HEAD^{tree}"]).stdout || "").trim();
    writeProfileSummary(cLab4.runs, tree4, { holdsRed: 0, warnsRed: 0 });
    const cRun4 = runRelease(cLab4.lab, [], cLab4.dist, cLab4.runs, CERT);
    const cBy4 = {};
    for (const l of jsonLines(cLab4.runs).map(j => j.line)) cBy4[l.gate] = l.exit;
    check(cRun4.status === 0 && cBy4.sellable === 0 && cBy4.test === 0 && installers(cLab4.dist).length === 1,
      "13d (leg 4) a green whole summary for the tree is allowed past sellable, running all gates green, exit 0");
  }

  /* Leg 5: A preview build with no summary at all: not refused by this gate. */
  const cLab5 = setupLab("profile-preview", "ok.mjs");
  const cRun5 = runRelease(cLab5.lab, ["--dry"], cLab5.dist, cLab5.runs);
  const cOut5 = combined(cRun5);
  check(cRun5.status === 0 && /Gates green/.test(cOut5) && !/no release profile summary/.test(cOut5),
    "13e (leg 5) a preview build with no summary at all is not refused by this gate, exit 0 under --dry");

  /* Leg 6: A planted removal of the check turns leg 1 red, by the tree's plant convention. */
  /* 13f is a sibling of 13d with the same fault: its planted build must run every gate green, the signature reading included,
     so it stands aside off Windows with them (the test architect's subagent, 2026-11-14, not in Claude gamma's list). */
  const aside13f = PLANTS_OFF ? "" : releaseAside("13f (leg 6)");
  if (PLANTS_OFF) { plantsSkipped++; process.stdout.write("  skip 13f (leg 6) the planted removal of the customer profile check (ETIUDA_PLANTS=off)\n"); }
  else if (aside13f) skipAside(aside13f);
  else {
    const cLab6 = customerLab("profile-planted", { version: "1.0.0", key: HEX, page: FILLED, noSummary: true });
    const toolFile6 = path.join(cLab6.lab, "tools", "release.mjs");
    const toolBytes6 = fs.readFileSync(toolFile6, "utf8");
    const plantTarget = /if\s*\(SELL\.customer\)\s*SELL\.problems\.push\(\.\.\.profileProblems\);[^\n]*/;
    const planted6 = toolBytes6.replace(plantTarget, "/* plant:customer-profile removed */");
    fs.writeFileSync(toolFile6, planted6);
    const cRun6 = runRelease(cLab6.lab, [], cLab6.dist, cLab6.runs, CERT);
    check(planted6 !== toolBytes6 && cRun6.status === 0,
      "13f (leg 6) a planted removal of the customer profile check allows leg 1's build to pass sellable (exit "
      + cRun6.status + ", planted: " + (planted6 !== toolBytes6) + "), which would turn leg 1 red");
  }

  /* A summary that lists no profile cannot show it covered the profile (the test architect's edit). */
  const cLab7 = customerLab("profile-empty", { version: "1.0.0", key: HEX, page: FILLED, noSummary: true });
  settle(cLab7.lab);
  const tree7 = (labGit(cLab7.lab, ["rev-parse", "HEAD^{tree}"]).stdout || "").trim();
  writeProfileSummary(cLab7.runs, tree7, { gatesRun: [], profileGates: [] });
  const cRun7 = runRelease(cLab7.lab, [], cLab7.dist, cLab7.runs, CERT);
  check(cRun7.status === 5 && combined(cRun7).includes("does not cover the whole profile (0 of 0") && installers(cLab7.dist).length === 0,
    "13g a green summary for the tree that lists no profile gates is refused, exit " + cRun7.status);

  /* The newest summary for the tree decides, by its time, not by its file name (the test architect's edit):
     a release run green at 10:00 and a nightly with a hold red at 11:00 on the same tree hold. */
  const cLab8 = customerLab("profile-newest", { version: "1.0.0", key: HEX, page: FILLED, noSummary: true });
  settle(cLab8.lab);
  const tree8 = (labGit(cLab8.lab, ["rev-parse", "HEAD^{tree}"]).stdout || "").trim();
  writeProfileSummary(cLab8.runs, tree8, { profile: "release", time: "2026-11-08T10:00:00.000Z", stamp: "20261108T100000-000" });
  writeProfileSummary(cLab8.runs, tree8, { profile: "nightly", holdsRed: 1, time: "2026-11-08T11:00:00.000Z", stamp: "20261108T110000-000" });
  const cRun8 = runRelease(cLab8.lab, [], cLab8.dist, cLab8.runs, CERT);
  check(cRun8.status === 5 && /class hold/.test(combined(cRun8)) && installers(cLab8.dist).length === 0,
    "13h an older green release summary does not outweigh a newer hold red on the same tree, exit " + cRun8.status);

  /* ---- 14. THE TEST SERVICE BUILD IS NEVER RELEASED ---------------------------------------------------------------------- */
  const TS_VAR = { ETIUDA_PACK_TEST_SERVICE: path.join(os.tmpdir(), "any-lab.json") };
  const tsLab = setupLab("ts-var", "ok.mjs");
  const tsRun = runRelease(tsLab.lab, ["--dry"], tsLab.dist, tsLab.runs, TS_VAR);
  const tsOut = combined(tsRun);
  const tsFails = tsOut.split(/\r?\n/).filter(l => /^ {2}FAIL /.test(l));
  check(tsRun.status === 5 && tsFails.length === 1 && /ETIUDA_PACK_TEST_SERVICE is set/.test(tsFails[0]),
    "14a a preview released with ETIUDA_PACK_TEST_SERVICE set stops as gate sellable on that reason alone, exit " + tsRun.status + ": " + tsFails.join(" | "));
  if (PLANTS_OFF) { plantsSkipped++; process.stdout.write("  skip 14b the planted release-ts-var (ETIUDA_PLANTS=off)\n"); }
  else {
    const tsP = setupLab("ts-var-planted", "ok.mjs");
    const toolP = path.join(tsP.lab, "tools", "release.mjs"), bytesP = fs.readFileSync(toolP, "utf8");
    const plantedP = bytesP.replace(/const TEST_SERVICE_SAID = testServiceProblems\(\{ env: process\.env \}\); \/\* plant:release-ts-var \*\//,
      "const TEST_SERVICE_SAID = []; /* plant:release-ts-var */");
    fs.writeFileSync(toolP, plantedP);
    const runP = runRelease(tsP.lab, ["--dry"], tsP.dist, tsP.runs, TS_VAR);
    check(plantedP !== bytesP && runP.status === 0, "14b with plant:release-ts-var put in another form the same release runs green, exit " + runP.status);
  }
  const putFile = lab => {
    const stub = path.join(lab, "tools", "pkg-stub.mjs");
    fs.appendFileSync(stub, 'fs.writeFileSync(path.join(dist, "win-unpacked", "resources", "test-service.json"), "{}\\n");\n');
  };
  const tsF = setupLab("ts-file", "ok.mjs");
  putFile(tsF.lab);
  const runF = runRelease(tsF.lab, [], tsF.dist, tsF.runs);
  const pkgF = jsonLines(tsF.runs).map(j => j.line).find(l => l.gate === "package");
  check(runF.status === 2 && pkgF && pkgF.exit === 1 && /test-service\.json is in the package/.test(combined(runF)) && !fs.existsSync(path.join(tsF.lab, "ran-installer")),
    "14c a package whose resources carry test-service.json stops at the package gate, exit " + runF.status + ", before the installer gate");
  if (PLANTS_OFF) { plantsSkipped++; process.stdout.write("  skip 14d the planted release-ts-file (ETIUDA_PLANTS=off)\n"); }
  else {
    const tsFP = setupLab("ts-file-planted", "ok.mjs");
    putFile(tsFP.lab);
    const toolFP = path.join(tsFP.lab, "tools", "release.mjs"), bytesFP = fs.readFileSync(toolFP, "utf8");
    const plantedFP = bytesFP.replace(/const testServiceIn = testServiceProblems\(\{ resources: join\(DIST, "win-unpacked", "resources"\) \}\); \/\* plant:release-ts-file \*\//,
      "const testServiceIn = []; /* plant:release-ts-file */");
    fs.writeFileSync(toolFP, plantedFP);
    const runFP = runRelease(tsFP.lab, [], tsFP.dist, tsFP.runs);
    check(plantedFP !== bytesFP && runFP.status === 0, "14d with plant:release-ts-file put in another form the same package runs every gate green, exit " + runFP.status);
  }

  if (!KEEP) labs.push(APPS);
  /* A LAB STILL HELD IS SAID, not swallowed (board 801): tests/scratch.mjs retries and then names it. */
  if (!KEEP) for (const d of labs) dropScratch(d, "release");
  else process.stdout.write("--keep: labs at " + labs.join(", ") + "\n");

  check(asserted + 1 + plantsSkipped + asideSkipped === EXPECTED,
    "9 every leg ran: " + (asserted + 1) + " of " + EXPECTED + " assertion(s)" + (plantsSkipped ? ", " + plantsSkipped + " plant proof(s) skipped under ETIUDA_PLANTS=off" : "")
    + (asideSkipped ? ", " + asideSkipped + " standing aside off Windows" : ""));
  /* NO `#counts` LINE HERE, and the reason is board item 518's own finding. This gate runs inside
     `npm test`, which tools/release.mjs records as ONE result line for the whole chain, and
     tests/shell-launch.mjs already declares `asserted`. A line of my own declaring the same word
     clashed with it the first time it ran - caught by the counter added in this same commit,
     within the hour. The tally line below and the `  ok` lines are what this gate contributes. */
  process.stdout.write("release-legs: " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main();
