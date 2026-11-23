/* Brief: a window leg never puts a crash dialog on Max's screen.
 *
 * gate-kind: node
 *
 *     node tests/no-crash-dialog.mjs
 *
 * WHAT THIS COVERS. Uncaught errors in Electron's main process must never
 * raise Electron's native crash dialog on the screen. A guard file loaded
 * before the application code intercepts uncaughtException, writes the error
 * stack to stderr with a recognisable prefix, and exits with a non-zero code.
 *
 * Legs 1 and 2 check the guard in plain node with --require.
 * Leg 3 is a text leg: every electron spawn in tests/ goes through the guarded
 * launcher or is on a named exception list; a planted spawn proves it.
 * Leg 4 is the real window leg, walled behind the window wall and not run.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { wallOrThrow, WINDOWS_VAR, WINDOWS_DAY } from "./window-wall.mjs";
import { runStudio } from "./shell-door.mjs";
import { dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const TESTS = path.join(ROOT, "tests");
const GUARD = path.join(HERE, "crash-guard.cjs");
const SCRATCH = path.join(ROOT, "scratch", "no-crash-dialog");
const UNCAUGHT_PREFIX = "uncaught-guard: ";

/* Packaged-app legs whose fuses are off, and legs going through the engine door. */
const NAMED_EXCEPTIONS = new Map([
  ["tests/round-trip.mjs", "launches through pinned engine E.shellLaunch"],
  ["tests/installer.mjs", "packaged installed application (Etiuda Studio.exe), fuse off"],
  ["tests/update-install.mjs", "packaged installed application (Etiuda Studio.exe), fuse off"],
]);

let asserted = 0, failed = 0, notRun = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

function filesUnder(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir).sort()) {
    const at = path.join(dir, name);
    if (fs.statSync(at).isDirectory()) out.push(...filesUnder(at));
    else if (/\.(?:mjs|js|cjs)$/.test(name)) out.push(at);
  }
  return out;
}

/** Check that the guarded launcher loads the guard file before the application code. */
function launcherIsGuarded(doorFile) {
  try {
    const src = fs.readFileSync(doorFile, "utf8");
    return src.indexOf("crash-guard.cjs") >= 0 && src.indexOf("-r") >= 0;
  } catch {
    return false;
  }
}

/** Scan tests/ for any unguarded spawn of the electron binary. */
function findUnguardedSpawns(dir, exceptions) {
  const LAUNCH = /\b(?:spawn|spawnSync)\s*\(/g;
  const IS_ELECTRON = /electron\.exe|electronExe\(\)|Etiuda Studio\.exe|"dist",\s*"electron"|dist[/\\]electron\b/;
  const NOT_SHELL = /^process\.execPath\b/;
  const unguarded = [];

  for (const file of filesUnder(dir)) {
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    if (rel === "tests/no-crash-dialog.mjs") continue;
    const src = fs.readFileSync(file, "utf8");
    LAUNCH.lastIndex = 0;
    let m;
    while ((m = LAUNCH.exec(src))) {
      const at = m.index;
      const ctx = src.slice(Math.max(0, at - 1200), at + 1200);
      if (!IS_ELECTRON.test(ctx)) continue;
      const firstArg = src.slice(at + m[0].length, at + m[0].length + 60).split(",")[0].trim();
      if (NOT_SHELL.test(firstArg)) continue;

      const lineNum = src.slice(0, at).split("\n").length;
      const lineText = src.split(/\r?\n/)[lineNum - 1].trim();
      if (lineText.startsWith("//") || lineText.startsWith("*") || lineText.startsWith("/*")) continue;
      if (lineText.startsWith('"spawn') || lineText.startsWith("'spawn")) continue;

      if (rel === "tests/shell-door.mjs") {
        if (!launcherIsGuarded(file)) {
          unguarded.push({ file: rel, line: lineNum, reason: "shell-door.mjs does not load crash-guard.cjs" });
        }
      } else if (!exceptions.has(rel)) {
        unguarded.push({ file: rel, line: lineNum, reason: "spawn not through guarded launcher" });
      }
    }
  }
  return unguarded;
}

/** Walled window leg: not run in node runs. */
export async function windowLeg() {
  wallOrThrow("tests/no-crash-dialog.mjs window leg");
  const lab = path.join(SCRATCH, "window-lab");
  const app = path.join(lab, "app");
  const ud = path.join(lab, "ud");
  const projects = path.join(lab, "projects");
  fs.mkdirSync(app, { recursive: true });
  fs.mkdirSync(ud, { recursive: true });
  fs.mkdirSync(projects, { recursive: true });
  fs.writeFileSync(path.join(app, "package.json"),
    JSON.stringify({ name: "throwing-lab", version: "0.0.0", main: "main.js" }), "utf8");
  fs.writeFileSync(path.join(app, "main.js"),
    'throw new Error("deliberate main process load failure");\n', "utf8");

  const r = runStudio("tests/no-crash-dialog.mjs window leg", {
    app,
    userDataDir: ud,
    projects,
  });
  check(r.status !== 0, "4a window leg: lab shell whose main.js throws at load exits non-zero: status " + r.status);
  check(String(r.stderr || "").indexOf(UNCAUGHT_PREFIX) >= 0,
    "4b window leg: stderr carries the guard prefix: " + String(r.stderr || "").slice(0, 100));
}

async function main() {
  dropScratch(SCRATCH, "no-crash-dialog");
  fs.mkdirSync(SCRATCH, { recursive: true });

  /* ---- Leg 1: guard on a script that throws in plain node ------------------- */
  const throwScript = path.join(SCRATCH, "throws.cjs");
  fs.writeFileSync(throwScript, [
    'process.stdout.write("LINE_BEFORE\\n");',
    'throw new Error("deliberate uncaught failure");',
    'process.stdout.write("LINE_AFTER\\n");',
  ].join("\n"), "utf8");

  const r1 = spawnSync(process.execPath, ["--require", GUARD, throwScript], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 10000,
  });

  const r1Stderr = String(r1.stderr || "");
  const r1Stdout = String(r1.stdout || "");
  check(r1.status !== 0, "1a guard on throwing script exits non-zero (exit " + r1.status + ")");
  check(r1Stderr.indexOf(UNCAUGHT_PREFIX) >= 0 && r1Stderr.indexOf("deliberate uncaught failure") >= 0,
    "1b the error stack is on stderr with the recognisable prefix (" + r1Stderr.split("\n")[0] + ")");
  check(r1Stdout.indexOf("LINE_BEFORE") >= 0 && r1Stdout.indexOf("LINE_AFTER") < 0,
    "1c no line of the script after the throw runs (saw LINE_BEFORE, no LINE_AFTER)");

  /* ---- Leg 2: script that does not throw exits 0 and prints nothing of guard - */
  const cleanScript = path.join(SCRATCH, "clean.cjs");
  fs.writeFileSync(cleanScript, 'process.stdout.write("CLEAN_OK\\n");\n', "utf8");

  const r2 = spawnSync(process.execPath, ["--require", GUARD, cleanScript], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 10000,
  });

  const r2Stderr = String(r2.stderr || "");
  const r2Stdout = String(r2.stdout || "");
  check(r2.status === 0, "2a script that does not throw exits 0 (exit " + r2.status + ")");
  check(r2Stderr.indexOf(UNCAUGHT_PREFIX) < 0 && r2Stderr.trim() === "",
    "2b stderr is clean and prints nothing of the guard");
  check(r2Stdout === "CLEAN_OK\n", "2c stdout has script output alone: " + JSON.stringify(r2Stdout));

  /* ---- Leg 3: text leg and planted spawn control ---------------------------- */
  const doorOk = launcherIsGuarded(path.join(TESTS, "shell-door.mjs"));
  check(doorOk, "3a the door launcher tests/shell-door.mjs loads crash-guard.cjs via -r");

  const unguarded = findUnguardedSpawns(TESTS, NAMED_EXCEPTIONS);
  check(unguarded.length === 0, "3b every electron spawn in tests/ goes through the guarded launcher or named exceptions ("
    + unguarded.length + " unguarded site(s)" + (unguarded.length ? ": " + JSON.stringify(unguarded) : "") + ")");

  /* Plant convention control: an unguarded spawn must go red */
  const plantsOff = process.env.ETIUDA_PLANTS === "off";
  if (plantsOff) {
    skipped++;
    process.stdout.write("  SKIP  3c planted spawn control (ETIUDA_PLANTS=off)\n");
  } else {
    const plantPath = path.join(TESTS, "zz-unguarded-plant.mjs");
    let plantCaught = false;
    try {
      const plantContent = [
        "/* Planted unguarded spawn control for tests/no-crash-dialog.mjs */",
        "import { " + "sp" + "awn } from \"node:child_process\";",
        "import path from \"node:path\";",
        "const exe = path.join(\"node_modules\", \"electron\", \"dist\", \"electron.exe\");",
        "sp" + "awn(exe, [\".\"]);",
        "",
      ].join("\n");
      fs.writeFileSync(plantPath, plantContent, "utf8");
      const plantFindings = findUnguardedSpawns(TESTS, NAMED_EXCEPTIONS);
      plantCaught = plantFindings.some(f => f.file.replace(/\\/g, "/").endsWith("zz-unguarded-plant.mjs"));
    } finally {
      try { fs.rmSync(plantPath, { force: true }); } catch { /* removed */ }
    }
    const plantGone = !fs.existsSync(plantPath);
    check(plantCaught && plantGone, "3c control: a planted unguarded spawn goes red and the plant is removed");
  }

  /* ---- Leg 4: real window leg, walled behind window wall -------------------- */
  if (process.env[WINDOWS_VAR] === WINDOWS_DAY) {
    await windowLeg();
  } else {
    notRun++;
    process.stdout.write("  --   4 window leg walled behind window wall; run with "
      + WINDOWS_VAR + "=$(date +%F)\n");
  }

  dropScratch(SCRATCH, "no-crash-dialog");

  process.stdout.write("#counts checks=" + asserted + " failures=" + failed
    + (notRun ? " notRun=" + notRun : "") + (skipped ? " skipped=" + skipped : "") + "\n");
  process.stdout.write("no-crash-dialog  " + asserted + " check(s), " + failed + " failure(s), "
    + notRun + " not run" + (skipped ? ", " + skipped + " skipped" : "") + "\n");
  process.exit(failed ? 1 : 0);
}

main().catch(err => {
  process.stderr.write("no-crash-dialog threw: " + (err && err.stack ? err.stack : String(err)) + "\n");
  process.exit(1);
});
