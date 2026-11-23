/* Studio's landing sequence as one command, the engine's shape.
 *
 *   node tools/release.mjs          npm test, then package, then installer, then the packaged app
 *                                   launched (tests/shell-launch.mjs 5a-5d); stop at the first red
 *   node tools/release.mjs --dry    the gates, and nothing is built
 *   --customer                      ask a customer build's questions of any version
 *
 * A CUSTOMER BUILD IS TOLD APART FROM A PREVIEW BY ITS VERSION (tools/sellable.mjs): a bare x.y.z
 * with a major of 1 or more is a customer's. A customer build is judged BEFORE the four gates, as
 * the gate `sellable`, numbered 5 so that the four keep their numbers: its version, the vendor key
 * a packaged build would check licences with, the licence page's placeholders, the signing
 * block, and a green release profile on that same git tree with no hold red (regimen rule 4,
 * decision 2026-11-05 11:43); a refusal exits 5 having tested and built nothing. After the build the package gate
 * requires the installer and the program Valid and timestamped of a customer build or of any
 * build with a certificate configured. A preview (0.1.0) runs exactly as before, told what would
 * stop it, and writes no `sellable` result line.
 *
 * A RELEASE IS OF A COMMIT: before anything else, and under --dry as much as without it, the gate
 * `clean`, numbered 6, refuses a tree with anything uncommitted or untracked, or one git cannot
 * read, as the engine's release gate 1 does; it exits 6 having tested and built nothing.
 *
 * The package gate prints the installer's SHA-256 beside its name and size, as the engine's
 * tools/release.mjs does, and records it in that gate's result line as `sha256`, so the file IT
 * is handed can be checked against the one this run built (enterprise pack item 5). Beside the
 * installer it writes etiuda-studio-<version>-sbom.cdx.json, the software bill of materials made
 * by tools/sbom.mjs and held against the packaged app, and records its SHA-256 as `sbomSha256`
 * (item 8); a list the app contradicts stops the package gate.
 *
 * THERE IS NO --tag AND NO --push, deliberately, so that their absence reads as a decision
 * rather than as an omission. A tag is a release and a push of main is Maxim's act. This
 * script must not reach around the hook that gates the push.
 *
 * Each gate stops the run and the exit code is its number, so a failure names itself. The
 * table at the end always prints, including on a red, so a planted failure is named there
 * rather than only in a scroll of npm output. One JSON result line per gate goes to
 * ETIUDA_RUNS (the etiuda-runs folder found from the tree, as tools/machine-lock.mjs finds it, when unset), the engine's result-line
 * shape from tools/gate-run.mjs: gate, script, cmd, exit, counts, countsFrom, clash, wallMs,
 * commit, dirty, time. `clash` is the number of declared keys written over with a different
 * value (board item 518); nought is the ordinary case and it is written every time, so that its
 * absence one day is legible rather than silent. */
import { spawn, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, existsSync, readdirSync, mkdirSync, writeFileSync, statSync, mkdtempSync, linkSync, copyFileSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, dirname, join, resolve, relative, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { writeSbom } from "./sbom.mjs";
import { beforeBuild, releaseProfileProblems, signatureVerdict, testServiceProblems, demoSigningProblems, ourPublisher } from "./sellable.mjs";
import { createRequire } from "node:module";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = f => args.includes(f);
const DRY = flag("--dry");
/* The etiuda-runs folder found from this tree, as tools/machine-lock.mjs finds it (an ancestor of a worktree, or a sibling of the main
   checkout); the studio-dist folder is its sibling. */
function runsFolder(root) {
  for (let dir = root; dirname(dir) !== dir; dir = dirname(dir)) if (basename(dir).toLowerCase() === "etiuda-runs") return dir;
  for (let dir = root; dirname(dir) !== dir; dir = dirname(dir)) {
    const sibling = join(dirname(dir), "etiuda-runs");
    if (existsSync(sibling)) return sibling;
  }
  return resolve(root, "..", "etiuda-runs");
}
const DIST = resolve(process.env.ETIUDA_STUDIO_DIST || join(dirname(runsFolder(ROOT)), "etiuda-studio-dist"));
const NO_VERDICT = 78;

if (flag("--tag") || flag("--push")) {
  console.error("release: there is no --tag and no --push; a tag is a release and a push is Maxim's, and this script has no flag for either.");
  process.exit(1);
}

function refuse(what, how) {
  console.error("  FAIL " + what);
  if (how) console.error("       " + how);
  process.exit(NO_VERDICT);
}

/* A SCRATCH HOME FOR EVERY GATE, the default since 2026-09-25, the engine's tools/release.mjs in
   the same shape. The installer gate installs and uninstalls Studio, and the installer, the
   uninstaller and the app find the profile through Windows, which answers from USERPROFILE and
   ignores APPDATA and LOCALAPPDATA (measured 2026-09-24). Until this a plain run borrowed the real
   profile, and the installers of 2026-09-25 stayed off it only because their caller built a home
   by hand. So the script builds one: a fresh folder shaped as Windows expects (an unshaped home
   hangs Electron), USERPROFILE at it with APPDATA and LOCALAPPDATA under it, Windows asked where
   the four folders the installer writes are, and a run whose answer is not the home stops with
   NO VERDICT before gate 1, having touched nothing. Then the home is set in this process's own
   environment, so every gate and every child of every gate inherits it.
   WHAT STAYS REAL: HKCU, which no environment variable moves; ELECTRON_BUILDER_CACHE, named at the
   real cache; and Electron's own download cache, which follows LOCALAPPDATA and is hard-linked in
   file by file (removing the home removes names, never the real files), so a release does not
   download Electron again. ETIUDA_RELEASE_HOME_ROOT says where the home is made, the temp folder
   when unset; tests/release.mjs puts it inside its lab. The home goes on a green run and stays,
   named, on a red one. */
function seedCache(from, to) {
  if (!existsSync(from)) return 0;
  let n = 0;
  mkdirSync(to, { recursive: true });
  for (const e of readdirSync(from, { withFileTypes: true })) {
    const a = join(from, e.name), b = join(to, e.name);
    if (e.isDirectory()) n += seedCache(a, b);
    else if (e.isFile()) { try { linkSync(a, b); } catch (x) { copyFileSync(a, b); } n++; }
  }
  return n;
}
const REAL_HOME = process.env.USERPROFILE || homedir();
const REAL_LOCAL = process.env.LOCALAPPDATA || join(REAL_HOME, "AppData", "Local");
const HOME = mkdtempSync(join(resolve(process.env.ETIUDA_RELEASE_HOME_ROOT || tmpdir()), "etiuda-release-home-"));
const PLACES = { ApplicationData: join(HOME, "AppData", "Roaming"),
                 LocalApplicationData: join(HOME, "AppData", "Local"),
                 Desktop: join(HOME, "Desktop"),
                 Programs: join(HOME, "AppData", "Roaming", "Microsoft", "Windows", "Start Menu", "Programs") };
for (const d of Object.values(PLACES).concat([join(HOME, "Documents")])) mkdirSync(d, { recursive: true });
const seeded = seedCache(join(REAL_LOCAL, "electron", "Cache"), join(PLACES.LocalApplicationData, "electron", "Cache"));
/* NPM'S UPDATE NOTICE STAYS OUT OF EVERY GATE'S OUTPUT (the rerun of 2026-10-16). npm keeps the day it last asked the registry
   for a newer npm in its cache, which follows LOCALAPPDATA into this fresh home, so every gate's npm asks again, and when
   the answer comes before the script ends it prints five `npm notice` lines into the output a result line counts. The
   count then followed the network and the script's length, not the gate: tests/release.mjs 3f saw one arm five lines
   longer than its twin. Off for every npm this run starts; nothing a gate does reads the notice. */
const HOME_ENV = { USERPROFILE: HOME, APPDATA: PLACES.ApplicationData, LOCALAPPDATA: PLACES.LocalApplicationData,
                   ELECTRON_BUILDER_CACHE: process.env.ELECTRON_BUILDER_CACHE || join(REAL_LOCAL, "electron-builder", "Cache"),
                   npm_config_update_notifier: "false" };
const gitGlobal = join(REAL_HOME, ".gitconfig");
if (!process.env.GIT_CONFIG_GLOBAL && existsSync(gitGlobal)) HOME_ENV.GIT_CONFIG_GLOBAL = gitGlobal;
/* Artifact Signing signs in through Azure's own credentials, and the Azure CLI keeps its sign-in in
   .azure under the home, which the scratch home would hide from it. */
const azureDir = join(REAL_HOME, ".azure");
if (!process.env.AZURE_CONFIG_DIR && existsSync(azureDir)) HOME_ENV.AZURE_CONFIG_DIR = azureDir;
if (process.platform === "win32") {
  const out = execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command",
    "foreach ($n in '" + Object.keys(PLACES).join("','") + "') { $n + [char]9 + [Environment]::GetFolderPath($n) }"],
    { encoding: "utf8", windowsHide: true, timeout: 60000, env: { ...process.env, ...HOME_ENV } });
  const shell = {};
  for (const l of out.split(/\r?\n/)) { const at = l.indexOf("\t"); if (at > 0) shell[l.slice(0, at)] = l.slice(at + 1).trim(); }
  const said = Object.keys(PLACES).filter(n => !shell[n] || resolve(shell[n]).toLowerCase() !== resolve(PLACES[n]).toLowerCase())
    .map(n => n + ": this run would use " + PLACES[n] + " but Windows, and so the installer, answers " + (shell[n] || "nothing"));
  if (said.length) refuse("NOT RUN: the scratch home is not where Windows would put Studio: " + said.join("; "),
    "nothing ran; the home is " + HOME);
}
Object.assign(process.env, HOME_ENV);
console.log("The scratch home, which every gate inherits: " + HOME + "\n  USERPROFILE, APPDATA and LOCALAPPDATA"
  + " point into it and Windows agrees for " + Object.keys(PLACES).join(", ") + "; HKCU stays real;"
  + " Electron's download cache seeded with " + seeded + " file(s) from " + join(REAL_LOCAL, "electron", "Cache"));

/* Not path.startsWith: C:/x/etiuda-runs starts with C:/x/etiuda and is not inside it. */
function inside(parent, child) {
  const rel = relative(resolve(parent), resolve(child));
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

const RUNS = resolve(process.env.ETIUDA_RUNS || runsFolder(ROOT));
if (inside(ROOT, RUNS)) refuse("the runs folder is inside the repository: " + RUNS,
  "these files are a record of runs, not of the tree; put them beside it, not in it");
mkdirSync(RUNS, { recursive: true });

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const version = String(pkg.version || "");

function git(argv) {
  try { return execFileSync("git", argv, { cwd: ROOT, encoding: "utf8" }).trim(); }
  catch (e) { return ""; }
}
const COMMIT = git(["rev-parse", "--short", "HEAD"]);
const DIRTY = git(["status", "--porcelain"]).length > 0;

const pad = (n, w) => String(n).padStart(w || 2, "0");
const stamp = d => d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate())
  + "T" + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) + "-" + pad(d.getMilliseconds(), 3);

function countsOf(out) {
  const lines = String(out).split(/\r?\n/);
  const counts = {};
  let from = "none";
  const ok = lines.filter(l => /^ {2}ok {2,}/.test(l)).length;
  const bad = lines.filter(l => /^ {2}FAIL /.test(l)).length;
  if (ok || bad) { counts.ok = ok; counts.fail = bad; from = "ok/FAIL lines"; }
  /* A KEY IS EACH GATE'S OWN CHOICE AND TWO GATES PICK ONE WORD (board item 518). The `test`
     gate here is the whole chain of 29 scripts in one line, and two of them declare `failures`:
     tests/launch-door.mjs and tests/shell-launch.mjs. The second silently overwrote the first,
     so a number that names one gate read as the chain's - the same fault as asserting a count by
     its key. The later value still wins, because neither is more true than the other and
     guessing is worse, but the number of keys written over with a DIFFERENT value travels
     beside the counts. A repeat that agrees is not a clash, and a declared key landing on the
     derived `ok` or `fail` is one. The engine's tools/gate-run.mjs holds the same body. */
  const clashed = [];
  let declared = false;
  for (const l of lines) {
    const m = /^#counts((?:\s+[A-Za-z][A-Za-z0-9_]*=-?\d+)+)\s*$/.exec(l.trim());
    if (!m) continue;
    for (const pair of m[1].trim().split(/\s+/)) {
      const [k, v] = pair.split("=");
      const n = Number(v);
      /* `ok` and `fail` are the derived channel's own words and mean checks, across every gate,
         so a gate declaring either is a clash whether or not it printed any: tests/eol-attrs.mjs
         declared `ok=189` meaning FILES, and because its one pass line had a single space after
         `ok` where the counter wants two, the declaration landed on the key in silence. Both were
         corrected; reserving the two names is what stops it coming back. */
      const taken = (k in counts && counts[k] !== n) || k === "ok" || k === "fail";
      if (taken && clashed.indexOf(k) < 0) clashed.push(k);
      counts[k] = n;
    }
    declared = true;
  }
  if (declared) from = from === "none" ? "declared" : from + " and declared";
  counts.lines = lines.filter(l => l.trim() !== "").length;
  return { counts, from, clashed };
}

function fmtCounts(c) {
  return Object.keys(c).sort().map(k => k + "=" + c[k]).join(" ");
}

function printTable(rows) {
  const head = ["gate", "exit", "counts", "wall-clock"];
  const cells = rows.map(r => [
    r.gate,
    String(r.exit),
    fmtCounts(r.counts),
    (r.wallMs / 1000).toFixed(1) + "s",
  ]);
  const widths = head.map((h, i) => Math.max(h.length, ...cells.map(c => c[i].length)));
  const line = cols => cols.map((c, i) => c.padEnd(widths[i])).join("  ");
  console.log("");
  console.log(line(head));
  for (const c of cells) console.log(line(c));
}

function runNpm(script, extraEnv) {
  const cmdline = script === "test" ? "npm test" : "npm run " + script;
  /* package.mjs spawnSyncs electron-builder with inherit. A pipe here is a pipe there. */
  const inherit = script === "package";
  return new Promise(resolve => {
    const t0 = Date.now();
    const opts = {
      cwd: ROOT,
      env: { ...process.env, ...extraEnv },
      windowsVerbatimArguments: true,
      stdio: inherit ? "inherit" : ["ignore", "pipe", "pipe"],
    };
    /* cmd.exe on Windows, as always; elsewhere the system shell, for the same one line. */
    const child = process.platform === "win32" ? spawn("cmd.exe", ["/d", "/s", "/c", cmdline], opts)
      : spawn("/bin/sh", ["-c", cmdline], opts);
    if (inherit) {
      child.on("close", code => resolve({ exit: code === null ? -1 : code, wallMs: Date.now() - t0, out: "" }));
      return;
    }
    let out = "";
    child.stdout.on("data", d => { out += d; process.stdout.write(d); });
    child.stderr.on("data", d => { out += d; process.stderr.write(d); });
    child.on("close", code => resolve({ exit: code === null ? -1 : code, wallMs: Date.now() - t0, out }));
  });
}

function setupExe() {
  if (!existsSync(DIST)) return "";
  const want = "etiuda-studio-" + version + "-setup.exe";
  const hit = readdirSync(DIST).find(f => f.toLowerCase() === want.toLowerCase());
  return hit ? join(DIST, hit) : "";
}

/* THE ONE PLACE THE INSTALLER IS JUDGED, board item 512. These two conditions - no installer at
   all, and one older than the package gate that was supposed to produce it - were written twice:
   once as the installer gate's own pre-checks, and again as the package gate's floor when 485
   gave that gate a floor of its own. The floor stops the run first, always, so the pre-check
   bodies became unreachable and the suite could not say so: a `throw` planted in both of them
   left tests/release.mjs 21 assertions, 0 failures green while the same `throw` in the floor
   reddened it. Coverage had moved rather than grown.
   So there is one body now, called from the floor - which the suite drives at legs 5 and 7 - and
   from the installer gate, where it is still worth a read: it is the last look at the file before
   the installer script is handed its path. `where` is the only difference between the two, and it
   is a phrase in the message rather than a second implementation. */
function judgeInstaller(startedAt, where) {
  const setup = setupExe();
  if (!setup) return { stop: "no installer in " + DIST + (where ? " " + where : "") + "\n", setup: "", stat: null };
  const stat = statSync(setup);
  if (startedAt && stat.mtime < startedAt)
    return { stop: "the installer predates this run's package gate: " + setup
               + " mtime " + stat.mtime.toISOString()
               + " package-gate " + startedAt.toISOString() + "\n", setup, stat };
  return { stop: "", setup, stat };
}

/* THE PACKAGED APP IS LAUNCHED, board carve C of 2026-09-24. The test gate runs before the build,
   so tests/shell-launch.mjs's legs 5a-5d - the app out of win-unpacked, painting the same list as
   the tree - were NOT RUN in every release, or ran against whatever build an earlier day had left
   in the default folder. Gate 4 runs that file again after the build, handed THIS run's unpacked
   app by name (so an ETIUDA_STUDIO_APP_EXE left in the environment cannot choose another), and a
   run that did not launch it is a failure rather than a green: shell-launch exits 0 on NOT RUN,
   so the verdict is its #counts line, packaged=1 and notRun=0. */
const PACKAGED_EXE = join(DIST, "win-unpacked", "Etiuda Studio.exe");
function judgePackaged(counts) {
  if (counts.packaged === 1 && counts.notRun === 0) return "";
  return "the packaged app was not launched: shell-launch said packaged=" + counts.packaged
    + " notRun=" + counts.notRun + " for " + PACKAGED_EXE + "\n";
}

/* WHETHER THIS IS A BUILD FOR A CUSTOMER (the code-pass survey of 2026-09-27, findings 13, 28, 29
   and 30), asked before anything is tested or built, since every answer is in the tree already.
   The signing block is read out of electron-builder.js itself, so the block the build will use is
   the one judged; a builder that will not load is a reason of its own rather than "unsigned". */
const UNSELLABLE = 5;
let builderWin = null, builderError = "", builder = null;
try { builder = createRequire(import.meta.url)(join(ROOT, "electron-builder.js")); builderWin = builder.win || null; }
catch (e) { builderError = "electron-builder.js could not be loaded, so its signing cannot be read: " + String(e && e.message || e).split("\n")[0]; }
/* The pages the build will show: the filled copy where ETIUDA_PACK_SELLER_ADDRESS names its file (tools/seller-address.cjs). */
const licenceDir = resolve(ROOT, builder ? builder.directories.buildResources : "packaging"); /* plant:release-licence-dir */
const SELL = await beforeBuild({ version, customer: flag("--customer"), licenceDir,
  licenceModule: join(ROOT, "src", "licence.mjs"), win: builderWin });
if (builderError) SELL.problems.push(builderError);
const profileProblems = releaseProfileProblems({ runs: RUNS, tree: git(["rev-parse", "HEAD^{tree}"]) });
if (SELL.customer) SELL.problems.push(...profileProblems); /* plant:customer-profile */
/* A test service build is refused as `sellable`, a preview's included, on that reason alone for a preview. */
const TEST_SERVICE_SAID = testServiceProblems({ env: process.env }); /* plant:release-ts-var */
const DEMO_SIGNED_SAID = demoSigningProblems({ env: process.env }); /* plant:release-demo-var */
if (!SELL.customer) console.log("\nPREVIEW " + version + ", not for a customer" + (SELL.problems.length
  ? "; as a customer build it would stop on " + SELL.problems.length + ": " + SELL.problems.join("; ")
  : ", though nothing would stop it as a customer build"));
function judgeSellable() {
  const problems = (SELL.customer ? SELL.problems : []).concat(TEST_SERVICE_SAID, DEMO_SIGNED_SAID);
  const out = problems.length
    ? problems.map(p => "  FAIL " + p).join("\n") + "\n"
    : "  ok   a CUSTOMER build " + version + ", and nothing in the tree stops it being sold\n";
  (problems.length ? process.stderr : process.stdout).write(out);
  return { exit: problems.length ? 1 : 0, wallMs: 0, out };
}

/* THE TREE IS CLEAN, and a release is of a commit, not of a working tree (rehearsal of 2026-09-30,
   line 9). This recorded `dirty` in the result lines and went on, so a --dry over an untracked file
   was green with "dirty":true. The engine's tools/release.mjs refuses in its gate 1, in these words,
   and this is the same refusal: numbered 6 as `sellable` is 5, so that the four keep their numbers,
   and first in the run, before anything is tested or built. `git status --porcelain --untracked-files=all` is asked here
   rather than read from DIRTY, because git() answers "" when git itself fails, and a folder that is
   no repository would read as clean; a tree git cannot read is a refusal of its own. A refusal writes
   its result line and its table row; a pass says which commit the release is of and writes neither,
   as a preview's `sellable` writes none, so the record of a green run is unchanged. */
const UNCLEAN = 6;
function judgeClean() {
  const ask = argv => execFileSync("git", argv, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trimEnd();
  let out;
  try {
    const changed = ask(["status", "--porcelain", "--untracked-files=all"]);
    if (!changed) {
      out = "  ok   the tree is clean: " + ask(["rev-parse", "--short", "HEAD"]) + " on " + ask(["rev-parse", "--abbrev-ref", "HEAD"]) + "\n";
      process.stdout.write(out);
      return { exit: 0, wallMs: 0, out };
    }
    const lines = changed.split(/\r?\n/);
    out = "  FAIL uncommitted changes; a release is of a commit, not of a working tree\n"
      + lines.slice(0, 5).map(l => "       " + l + "\n").join("")
      + (lines.length > 5 ? "       and " + (lines.length - 5) + " more\n" : "");
  } catch (e) {
    out = "  FAIL git could not read this tree's status: " + String((e && e.stderr) || (e && e.message) || e).trim().split("\n")[0]
      + "; a release is of a commit, not of a working tree\n";
  }
  process.stderr.write(out);
  return { exit: 1, wallMs: 0, out };
}

const gates = [{ name: "test", script: "test", cmd: "npm test", step: 1 }];
if (SELL.customer || TEST_SERVICE_SAID.length) gates.unshift({ name: "sellable", script: "sellable", cmd: "tools/sellable.mjs", step: UNSELLABLE });
gates.unshift({ name: "clean", script: "clean", cmd: "git status --porcelain --untracked-files=all", step: UNCLEAN });
if (!DRY) {
  gates.push({ name: "package", script: "package", cmd: "npm run package", step: 2 });
  gates.push({ name: "installer", script: "installer", cmd: "npm run installer", step: 3 });
  gates.push({ name: "packaged", script: "packaged", cmd: "npm run packaged", step: 4 });
}

const rows = [];
let worst = 0;
let installerSha256 = "";
let sbom = null;
let packageStartedAt = null;
for (const g of gates) {
  const now = new Date();
  if (g.script === "package") packageStartedAt = now;
  process.stdout.write("\n[" + g.step + "] " + g.cmd + "\n");
  const extra = {};
  if (g.script === "package" || g.script === "installer" || g.script === "packaged") extra.ETIUDA_STUDIO_DIST = DIST;
  if (g.script === "packaged") extra.ETIUDA_STUDIO_APP_EXE = PACKAGED_EXE;
  if (g.script === "installer") {
    /* The last look before the installer script is handed a path, through the same judgement the
       package gate's floor makes. One branch now where there were two, and it is reached only
       where the floor did not already stop the run - a package gate that never ran, on a resumed
       or reordered sequence, or a file that went away between the two gates. */
    const judged = judgeInstaller(packageStartedAt, "");
    if (judged.stop) {
      const res = { exit: 1, wallMs: 0, out: judged.stop };
      process.stderr.write("  STOP: " + res.out);
      const { counts, from, clashed } = countsOf(res.out);
      const line = {
        gate: g.name, script: g.script, cmd: g.cmd, exit: res.exit, counts, countsFrom: from,
        clash: clashed.length,
        wallMs: res.wallMs, commit: COMMIT, dirty: DIRTY, time: now.toISOString(),
      };
      const file = join(RUNS, line.gate + "-" + stamp(now) + ".json");
      writeFileSync(file, JSON.stringify(line) + "\n", "utf8");
      console.log("  gate-run: " + file.replace(/\\/g, "/").split("/").pop() + " " + JSON.stringify(line.counts)
        + " exit " + line.exit + " in " + line.wallMs + " ms");
      rows.push(line);
      worst = g.step;
      break;
    }
    extra.ETIUDA_STUDIO_SETUP_EXE = judged.setup;
  }
  const res = g.script === "clean" ? judgeClean() : g.script === "sellable" ? judgeSellable() : await runNpm(g.script, extra);
  if (g.script === "clean" && res.exit === 0) continue;
  let { counts, from, clashed } = countsOf(res.out);
  if (g.script === "package" && res.exit === 0) {
    /* THE FLOOR, board item 485: a package gate that exits 0 having written no installer, or an
       installer left over from an earlier run, is a green that means nothing. Judged by the same
       function the installer gate calls, so the two cannot drift and neither is dead code.
       AND THE COUNTS ARE THE FILE, board item 512: a package gate whose script printed no ok or
       FAIL lines would otherwise carry {"lines":0} countsFrom "none" into the record, which is a
       result line saying nothing about the one artefact the gate exists to produce. */
    const judged = judgeInstaller(packageStartedAt, "after the package gate");
    const testServiceIn = testServiceProblems({ resources: join(DIST, "win-unpacked", "resources") }); /* plant:release-ts-file */
    if (!judged.stop && testServiceIn.length) judged.stop = testServiceIn.join("; ") + "\n";
    if (judged.stop) {
      res.exit = 1;
      process.stderr.write("  STOP: " + judged.stop);
      ({ counts, from } = countsOf(judged.stop));
    } else {
      counts = { bytes: judged.stat.size, mtimeMs: judged.stat.mtimeMs };
      from = "setup exe";
      /* The hash is of the file the floor just judged, read whole as the engine's release does.
         It is a string, so it sits beside the counts in the result line rather than in them. */
      installerSha256 = createHash("sha256").update(readFileSync(judged.setup)).digest("hex");
      console.log("  " + judged.setup.replace(/\\/g, "/").split("/").pop() + "  " + judged.stat.size
        + " bytes, sha256 " + installerSha256);
      /* The counts here are the file, not anything the gate declared, so there is nothing that
         could have been written over: nought, and not the nought of a counter that never ran. */
      clashed = [];
      /* THE SOFTWARE BILL OF MATERIALS, beside the installer (enterprise pack item 8): the
         production packages of this tree, Electron and the embedded engine, held against the
         app.asar this build just packaged, and the installer's SHA-256 inside it. An SBOM an
         earlier run left under the same name goes first, so a refusal leaves none beside this
         installer rather than one describing another build. A refusal stops the package gate. */
      const sbomAt = join(DIST, "etiuda-studio-" + version + "-sbom.cdx.json");
      try {
        rmSync(sbomAt, { force: true });
        sbom = writeSbom({ root: ROOT, app: join(DIST, "win-unpacked"), installer: judged.setup, out: sbomAt });
        console.log("  " + sbomAt.replace(/\\/g, "/").split("/").pop() + "  " + sbom.bytes + " bytes, sha256 "
          + sbom.sha256 + ": Electron " + sbom.electron + ", the engine at " + sbom.pin.slice(0, 7) + ", "
          + sbom.npm + " npm package(s)");
      } catch (e) {
        sbom = null;
        res.exit = 1;
        process.stderr.write("  STOP: the software bill of materials was not written: " + e.message + "\n");
      }
      /* THE SIGNATURE of the installer and of every program and library it installs (survey finding 30:
         Studio's release had no signature gate at all). Required of a customer build and of any build
         with a certificate configured, Valid and timestamped; a preview with none is not asked. The
         body is tools/sellable.mjs signatureVerdict. */
      if (res.exit === 0) {
        const signed = signatureVerdict({ setup: judged.setup, program: PACKAGED_EXE, app: join(DIST, "win-unpacked"),
          customer: SELL.customer, win: builderWin, ours: ourPublisher(builderWin, DIST) });
        if (signed !== true) { res.exit = 1; process.stderr.write("  STOP: the signature: " + signed + "\n"); }
      }
    }
  }
  if (g.script === "packaged" && res.exit === 0) {
    const stop = judgePackaged(counts);
    if (stop) { res.exit = 1; process.stderr.write("  STOP: " + stop); }
  }
  if (clashed.length) console.log("  clash: " + clashed.length + " key(s) declared twice with"
    + " different values, the later kept: " + clashed.join(", "));
  const line = {
    gate: g.name,
    script: g.script,
    cmd: g.cmd,
    exit: res.exit,
    counts,
    countsFrom: from,
    clash: clashed.length,
    wallMs: res.wallMs,
    commit: COMMIT,
    dirty: DIRTY,
    time: now.toISOString(),
  };
  if (g.script === "package" && installerSha256) line.sha256 = installerSha256;
  if (g.script === "package" && sbom) { line.sbom = sbom.file.replace(/\\/g, "/").split("/").pop(); line.sbomSha256 = sbom.sha256; }
  const file = join(RUNS, line.gate + "-" + stamp(now) + ".json");
  writeFileSync(file, JSON.stringify(line) + "\n", "utf8");
  console.log("  gate-run: " + file.replace(/\\/g, "/").split("/").pop() + " " + JSON.stringify(line.counts)
    + " exit " + line.exit + " in " + line.wallMs + " ms");
  rows.push(line);
  if (res.exit !== 0) { worst = g.step; break; }
}

printTable(rows);
if (worst) {
  const named = rows.length ? rows[rows.length - 1].gate : "unknown";
  console.error("STOP: " + named);
  process.exit(worst);
}
/* The home goes on a green run only; a red one leaves it standing, named at the top, as evidence. */
try { rmSync(HOME, { recursive: true, force: true }); } catch (e) { console.log("  the scratch home stays: " + HOME + " (" + e.message + ")"); }
console.log("\nGates green" + (DRY ? ". Dry: nothing was built" : ", and the installer is in " + DIST
  + ", sha256 " + installerSha256 + ", its bill of materials beside it, sha256 " + (sbom ? sbom.sha256 : "none"))
  + ". Nothing was tagged and nothing was pushed: both are Maxim's, and this script has no flag for either.");
