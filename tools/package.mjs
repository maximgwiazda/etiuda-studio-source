/* npm run package: fetch the pinned engine, build the Windows installer, then refuse to exit 0
 * unless a FRESH installer is in the output folder. On a Linux machine the same for a .deb and an
 * AppImage, both fresh (electron-builder.js, the linux block).
 *
 *     node tools/package.mjs
 *     node tools/package.mjs --dir        the unpacked app only, no installer, for a quick look
 *     node tools/package.mjs --linux      the .deb and the AppImage; the default on a Linux machine
 *     node tools/package.mjs --test-identity   the installer legs' build, tools/electron-builder-test.cjs (Windows)
 *     ETIUDA_STUDIO_DIST=<folder>         where the output goes; ../etiuda-studio-dist unset
 *
 * WHY THIS IS A FILE RATHER THAN A TWO-COMMAND SCRIPT, and it is the engine's reason, board 416.
 * `node tools/engine-fetch.mjs && electron-builder --win`, launched detached through
 * Win32_Process.Create (a .cmd, or powershell -File), runs only the first command and exits 0.
 * A check that lives in a later link of a shell chain is skipped the same way the build is. So
 * the check lives in the process npm started, and the chain is spawned from inside it.
 *
 * AND THE LISTING IS TAKEN BEFORE THE BUILD RUNS, so an installer already in the folder from an
 * earlier run is not a pass. A build that fails leaves yesterday's file sitting there, and a
 * check for "is there an installer" would be green on it forever; the freshness is name, mtime
 * and size together, because a rebuild of the same commit produces the same name.
 *
 * THE PINNED ENGINE IS FETCHED FIRST, and that is not a convenience. engine/pinned/ is not in
 * this repository (.gitignore holds it back; the pin in tools/engine-pin is what is committed),
 * so a packaged app built without it has no reader, no writer, no lint and no counts: it
 * installs, it launches, it paints, and it throws at the first lint or publish. The one place
 * that is caught before a customer finds it is here.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, relative, resolve, delimiter } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = process.env.ETIUDA_STUDIO_DIST
  ? resolve(process.env.ETIUDA_STUDIO_DIST)
  : resolve(ROOT, "..", "etiuda-studio-dist");
const DIR_ONLY = process.argv.indexOf("--dir") > -1;
/* THE PLATFORM IS THE MACHINE'S unless named: a Windows machine builds the Windows installer as it
   always did, a Linux one the .deb and the AppImage (electron-builder.js, the linux block). --linux
   and --win name it outright; electron-builder cannot build either on the other's host. */
const LINUX = process.argv.indexOf("--linux") > -1
  || (process.argv.indexOf("--win") < 0 && process.platform === "linux");
/* The test build differs in its program's name and its config, never in what is checked here. */
const TEST_ID = process.argv.indexOf("--test-identity") > -1;
if (TEST_ID && LINUX) { console.error("npm run package: --test-identity builds the Windows installer only"); process.exit(1); }
const PROGRAM = (TEST_ID ? createRequire(import.meta.url)("./test-identity.cjs").TEST.studio.productName : "Etiuda Studio") + ".exe";
const CONFIG = TEST_ID ? " --config tools\\electron-builder-test.cjs" : "";

function installers(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => (LINUX ? /\.(deb|AppImage)$/ : /-setup\.exe$/i).test(f)).map(name => {
    const s = statSync(join(dir, name));
    return name + "\t" + s.mtimeMs + "\t" + s.size;
  });
}

const before = new Set(installers(DIST));

/* THE TREE MUST HOLD STILL WHILE THE BUILD READS IT, and this is not theory. Measured 2026-09-17:
 * a build run while another seat was saving ui/lang.js put a TRUNCATED copy of that file in the
 * asar. The installer built, installed and launched, and the window came up blank because the
 * page threw `Unexpected end of input` at line 289 of a file the tree has 315 lines of. Nothing
 * in the build said a word: electron-builder read what was on disk and packaged it faithfully.
 *
 * So the files that go into the app are hashed before electron-builder runs and again after, and
 * a difference is a refusal. It is cheap - a few hundred files, under a second - and it fails in
 * seconds rather than after a sixty-second build and a sixty-second gate. It does NOT prove the
 * bytes read were whole, only that they did not change; tests/installer.mjs leg 2a is the one
 * that holds the asar against the tree afterwards, and that is the check that found this. */
const APP_PATHS = ["package.json", "shell/main.js", "shell/preload.js", "ui", "src", "engine/pinned"];
function walk(at, into) {
  if (!existsSync(at)) return into;
  const s = statSync(at);
  if (s.isFile()) { into.push(at); return into; }
  for (const name of readdirSync(at).sort()) walk(join(at, name), into);
  return into;
}
function snapshot() {
  const out = new Map();
  for (const p of APP_PATHS) for (const f of walk(resolve(ROOT, p), []))
    out.set(relative(ROOT, f).replace(/\\/g, "/"),
            createHash("sha256").update(readFileSync(f)).digest("hex"));
  return out;
}

/* 1. the pinned engine, into engine/pinned/. Its own refusals are codes 2 to 6 and each names
      the one thing that was missing, so they are passed through rather than reworded. */
const fetched = spawnSync(process.execPath, ["tools/engine-fetch.mjs"],
  { cwd: ROOT, stdio: "inherit" });
if (fetched.status !== 0) {
  console.error("npm run package: the pinned engine was not fetched (exit "
    + fetched.status + "); nothing was built");
  process.exit(fetched.status || 1);
}
const pinnedAt = join(ROOT, "engine", "pinned", "tests", "test.js");
if (!existsSync(pinnedAt)) {
  console.error("npm run package: no pinned engine at " + pinnedAt
    + " after the fetch; a build now would install an app that cannot lint");
  process.exit(1);
}

const treeBefore = snapshot();

/* 1b. Linux only: the icons. electron-builder wants PNGs for a Linux menu entry and reads no .ico
       for it, so every entry of packaging/etiuda-studio.ico, the file the Windows build carries,
       is sliced out as the PNG it already is (tools/ico-png.mjs) into the output folder. Nothing derived
       is written into this tree, which the snapshot above would otherwise see move. */
const linuxEnv = {};
if (LINUX) {
  const { icoPngs } = await import("./ico-png.mjs");
  const { mkdirSync, rmSync, writeFileSync } = await import("node:fs");
  const iconDir = join(DIST, ".linux-icons");
  rmSync(iconDir, { recursive: true, force: true });
  mkdirSync(iconDir, { recursive: true });
  for (const png of icoPngs(readFileSync(join(ROOT, "packaging", "etiuda-studio.ico"))))
    writeFileSync(join(iconDir, png.size + "x" + png.size + ".png"), png.bytes);
  linuxEnv.ETIUDA_STUDIO_LINUX_ICONS = iconDir;
  /* 1c. Linux only: the spelling dictionaries, by hash, into the folder electron-builder.js copies from. This is the
         one step of a build that reaches the network, and it fails closed: no pinned bytes, no package. */
  const { fetchDictionaries } = await import("./dictionaries.mjs");
  try { await fetchDictionaries(join(DIST, ".dictionaries")); }
  catch (e) {
    console.error("npm run package: the spelling dictionaries: " + ((e && e.message) || e) + "; nothing was built");
    process.exit(1);
  }
}

/* 2. the build. Pack the turning frames into solid 7z and generate turning.nsh at build time. */
const turningTool = join(ROOT, "tools", "turning.mjs");
if (existsSync(turningTool)) {
  const { prepareTurning } = await import("./turning.mjs");
  await prepareTurning(ROOT, "packaging");
}
/* The two template patches the desk's installer carries (tools/patch-nsis.cjs): applied, then read back, or no build. */
if (!LINUX) {
  const { applyNsisPatches, verifyNsisPatches } = (await import("node:module")).createRequire(import.meta.url)("./patch-nsis.cjs");
  applyNsisPatches(ROOT);
  const nsisStatus = verifyNsisPatches(ROOT);
  if (!nsisStatus.applied) {
    console.error("npm run package: the NSIS template patches are missing: " + JSON.stringify(nsisStatus));
    process.exit(1);
  }
}
/* cmd looks in its working directory before PATH unless NoDefaultCurrentDirectoryInExePath is set, and this tree's root
   holds electron-builder.js: with .JS in PATHEXT, a shell that leaves the variable unset (a Grok seat's, a WMI-started
   one) runs the config file instead of the tool, which exits 0 having built nothing, and Windows may put an "Open with"
   box on the desk's screen. The desk's tools/package.mjs sets it for the same reason (2026-10-09); Studio now does too. */
const env = { ...process.env, NoDefaultCurrentDirectoryInExePath: "1", PATH: join(ROOT, "node_modules", ".bin") + delimiter + (process.env.PATH || ""),
              ETIUDA_STUDIO_DIST: DIST, ...linuxEnv };
/* On Linux there is no cmd.exe and nothing to keep unchanged, so electron-builder's own CLI is run
   by this node, with no shell between. */
const r = LINUX
  ? spawnSync(process.execPath, [join(ROOT, "node_modules", "electron-builder", "cli.js"), "--linux"]
      .concat(DIR_ONLY ? ["--dir"] : []), { cwd: ROOT, stdio: "inherit", env })
  : spawnSync("cmd.exe", ["/d", "/s", "/c", "electron-builder --win" + CONFIG + (DIR_ONLY ? " --dir" : "")], {
  cwd: ROOT,
  stdio: "inherit",
  env,
  windowsVerbatimArguments: true,
});

/* 3. did the tree hold still? Reported before the artefact check, because an installer built
      from a moving tree is worse than no installer: it exists, it installs, and it is wrong. */
const treeAfter = snapshot();
const moved = [];
for (const [f, h] of treeAfter) if (treeBefore.get(f) !== h)
  moved.push(f + " " + (treeBefore.has(f) ? (treeBefore.get(f) || "").slice(0, 12) + " -> " + h.slice(0, 12) : "appeared"));
for (const f of treeBefore.keys()) if (!treeAfter.has(f)) moved.push(f + " went away");
if (moved.length) {
  console.error("npm run package: " + moved.length + " of " + treeBefore.size
    + " packaged file(s) changed WHILE the build was reading the tree, so what is in the"
    + " installer is neither the before nor the after:");
  for (const line of moved.slice(0, 20)) console.error("  " + line);
  process.exit(1);
}
console.log("npm run package: " + treeBefore.size + " packaged file(s) held still through the build");

/* 3b. the fuses, read back out of the binary this build wrote (tools/fuses.mjs): a binary whose
       fuses were never flipped installs and runs exactly like one whose fuses were. A build that
       succeeded with no program where this looks is refused, not passed with no fuse read (board 858,
       H3: until then a missing program skipped this step in silence). */
const exeAt = LINUX ? join(DIST, "linux-unpacked", "etiuda-studio") : join(DIST, "win-unpacked", PROGRAM);
if (r.status === 0) {
  const { packagedFuseProblems, wantedFuses } = await import("./fuses.mjs");
  const bad = await packagedFuseProblems(exeAt, wantedFuses());
  if (bad.length) {
    console.error("npm run package: the fuses of " + exeAt + " are not as electron-builder.js asks:");
    for (const line of bad) console.error("  " + line);
    process.exit(1);
  }
  console.log("npm run package: " + Object.keys(wantedFuses()).length + " fuse(s) read back from "
    + exeAt + " as asked");
}

/* 3c. Linux only: the dictionaries as the unpacked app carries them, the pinned bytes and the notice, where the shell
       looks (process.resourcesPath). electron-builder copies a folder that is not there as nothing, in silence. */
if (LINUX && r.status === 0) {
  const { dictionaryProblems } = await import("./dictionaries.mjs");
  const bad = dictionaryProblems(join(DIST, "linux-unpacked", "resources", "dictionaries"));
  if (bad.length) {
    console.error("npm run package: the unpacked app's resources/dictionaries is not as tools/dictionaries.mjs pins it:");
    for (const line of bad) console.error("  " + line);
    process.exit(1);
  }
  console.log("npm run package: resources/dictionaries carries the pinned spelling dictionaries and their notice");
}

/* 3d. THE TRAY'S PICTURES ARE IN THE ASAR. The shell reads them from there at run time (shell/main.js, the tray), so a
       build without them makes a Studio with no tray, which quits on close (the desk shipped so on 2026-11-09). Windows
       reads the .icos, Linux the PNGs. A listing that throws leaves nothing listed, so the check fails closed. */
if (r.status === 0) {
  const asarAt = join(DIST, LINUX ? "linux-unpacked" : "win-unpacked", "resources", "app.asar");
  let packed = [];
  try { packed = (await import("@electron/asar")).listPackage(asarAt).map((p) => p.replace(/\\/g, "/")); } catch {}
  const want = LINUX ? ["/packaging/tray/tray-1.png"] : ["/packaging/etiuda-studio.ico", "/packaging/tray/tray-1.ico"];
  if (LINUX && existsSync(join(ROOT, "packaging", "tray", "base.png"))) want.push("/packaging/tray/base.png");
  const lacking = want.filter((p) => packed.indexOf(p) < 0);
  if (lacking.length) {
    console.error("npm run package: " + asarAt + " lacks " + lacking.join(", ") + ", so Studio would have no tray");
    process.exit(1);
  }
  console.log("npm run package: the tray's " + want.length + " picture(s) are in the asar");
}

/* 3e. GOOGLE'S CLIENT SECRET, read back from the package's resources and said as present or absent, never its value; a package that
       lost the secret the variable gave it is refused (tools/signin-secret.cjs). */
if (r.status === 0) {
  const { signinSecretSummary, given: signinSecretGiven, SIGNIN_SECRET_VAR } = createRequire(import.meta.url)("./signin-secret.cjs");
  const resDir = join(DIST, LINUX ? "linux-unpacked" : "win-unpacked", "resources");
  const secretSaid = signinSecretSummary(resDir);
  if (signinSecretGiven(process.env) && !/present$/.test(secretSaid)) {
    console.error("npm run package: " + SIGNIN_SECRET_VAR + " was set and the package says " + secretSaid);
    process.exit(1);
  }
  console.log("npm run package: " + secretSaid);
  /* THE TEST SERVICE BUILD, read back the same way (tools/test-service.cjs): a package carrying it without the variable, or lacking
     it with the variable, is refused. */
  const { testServiceSummary, given: testServiceGiven, TEST_SERVICE_VAR } = createRequire(import.meta.url)("./test-service.cjs");
  const serviceSaid = testServiceSummary(resDir);
  if (!!testServiceGiven(process.env) !== /present/.test(serviceSaid)) {
    console.error("npm run package: " + TEST_SERVICE_VAR + " was " + (testServiceGiven(process.env) ? "set" : "unset") + " and the package says " + serviceSaid);
    process.exit(1);
  }
  console.log("npm run package: " + serviceSaid);
}

/* 4. the refusal. --dir writes no installer by definition, so the check there is the unpacked
      app rather than a setup.exe: a build that writes neither must not exit 0 either way. */
if (DIR_ONLY) {
  const unpacked = exeAt;
  if (!existsSync(unpacked)) {
    console.error("npm run package --dir: no unpacked app at " + unpacked);
    process.exit(1);
  }
  console.log("npm run package --dir: " + unpacked);
  process.exit(r.status == null ? 1 : r.status);
}

const fresh = installers(DIST).filter(row => !before.has(row));
if (fresh.length === 0) {
  console.error("npm run package: no fresh installer in " + DIST
    + (before.size ? " (" + before.size + " older one(s) are still there and are not a pass)" : ""));
  process.exit(1);
}
/* A Linux build is two artefacts and is a pass only with both fresh: a .deb without its AppImage,
   or the other way round, is half of what electron-builder.js asks for. */
const missing = LINUX ? ["deb", "AppImage"].filter(x => !fresh.some(row => row.split("\t")[0].endsWith("." + x))) : [];
if (missing.length) {
  console.error("npm run package: no fresh ." + missing.join(" or .") + " in " + DIST);
  process.exit(1);
}
for (const row of fresh) {
  const [name, , size] = row.split("\t");
  console.log("npm run package: " + join(DIST, name) + "  " + size + " bytes");
}
process.exit(r.status == null ? 1 : r.status);
