/* THE PIN, MADE REAL. Studio holds no copy of the engine; it holds one commit hash and this
 * script, which puts that commit's format modules under engine/pinned/ so that the reader, the
 * writer, the lint and the counts Studio uses are the engine's own bytes at a stated commit.
 *
 *     node tools/engine-fetch.mjs [--pin-file <path>] [--list <path>] [--out <dir>] [--quiet]
 *
 * WHERE THE BYTES COME FROM. On this desk the engine is a sibling checkout and the fetch is a
 * read of its object database: nothing is checked out there, nothing is written there. Off the
 * desk, ETIUDA_ENGINE_REMOTE (or the public URL below) is mirrored into a bare cache and the
 * same commands run against that. Either way the source of a file is `git cat-file blob`, never
 * `git show <rev>:<path>` and never the working tree: cat-file hands back the blob as the object
 * database holds it, with no end-of-line filter and no smudge, which is the only form a byte for
 * byte comparison can be made against. A desk with core.autocrlf=true would otherwise fetch
 * files that differ from the tree in every line and the drift gate would be permanently red.
 *
 * IT FAILS CLOSED, and each refusal names the one thing that was missing:
 *   2  the pin file, or the ENGINE_PIN line in it, or the shape of the hash
 *   3  no engine repository to read: neither a checkout nor a mirror of the remote
 *   4  the repository has no such commit
 *   5  the list names a path the pin's tree does not have
 *   6  the module list is missing or empty
 *   7  the pin's shell/main.js cannot be cut into the slices Studio ships in its place (board 865)
 *   8  the pin's shell/installer.nsh cannot be cut into the five hooks Studio's installer includes
 *   9  Studio's installed esbuild differs from (or lacks) the version the pin's package-lock.json names
 *  10  when a build is needed, the pin's tree has no tools/build.mjs (or lacks a build input it names)
 *  11  when a build is needed, the pin's tools/build.mjs exits non-zero
 *  12  when a build is needed, the pin's tools/build.mjs writes fewer than its expected output files
 * A refusal writes nothing into the output folder that was not already there.
 */
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { shellSlicesFrom, SHELL_SLICES, installerHooksFrom, INSTALLER_HOOKS } from "../src/engine.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const PUBLIC_REMOTE = "https://github.com/maximgwiazda/Etiuda.git";

class Refusal extends Error {
  constructor(code, line) { super(line); this.code = code; }
}
function refuse(code, line) { throw new Refusal(code, line); }

/* ---- the pin ------------------------------------------------------------------------------ */

const PIN_RE = /^[0-9a-f]{40}$/;

/** The pin file as a pair of values. One parser, used by the fetch and by tests/drift.mjs, so
 *  that the gate and the thing it gates cannot disagree about what the file says. */
function readPin(file) {
  if (!fs.existsSync(file)) refuse(2, "no pin file at " + file);
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split("\n").filter(l => !/^\s*#/.test(l));
  const pinLine = lines.map(l => /^\s*ENGINE_PIN\s*=\s*(\S*)\s*$/.exec(l)).filter(Boolean)[0];
  if (!pinLine) refuse(2, "no ENGINE_PIN= line in " + file);
  const pin = pinLine[1];
  if (!PIN_RE.test(pin))
    refuse(2, "ENGINE_PIN in " + file + " is " + JSON.stringify(pin)
      + ", wanted the full 40 hex digits of one commit");
  const maxLine = lines.map(l => /^\s*DRIFT_MAX_COMMITS\s*=\s*(\S*)\s*$/.exec(l)).filter(Boolean)[0];
  if (!maxLine) refuse(2, "no DRIFT_MAX_COMMITS= line in " + file);
  const max = Number(maxLine[1]);
  if (!Number.isInteger(max) || max < 0)
    refuse(2, "DRIFT_MAX_COMMITS in " + file + " is " + JSON.stringify(maxLine[1])
      + ", wanted a whole number of commits");
  /* A WAIVER ENDS BY ITSELF: DRIFT_WAIVER=<n> until <YYYY-MM-DDTHH:MM> reason: <words> lets the release gate allow up
     to n commits until that local time, and after it the line is read and ignored, so the ceiling above holds again
     without anyone remembering to put it back (the test architect, 2026-11-03). */
  const waiverText = lines.map(l => /^\s*DRIFT_WAIVER\s*=\s*(.*)$/.exec(l)).filter(Boolean)[0];
  let waiver = null;
  if (waiverText) {
    const w = /^(\d+)\s+until\s+(\d{4}-\d\d-\d\dT\d\d:\d\d)\s+reason:\s*(\S.*?)\s*$/.exec(waiverText[1]);
    const until = w ? new Date(w[2]) : null;
    if (!w || isNaN(until))
      refuse(2, "DRIFT_WAIVER in " + file + " is " + JSON.stringify(waiverText[1])
        + ", wanted <commits> until <YYYY-MM-DDTHH:MM> reason: <words>");
    waiver = { n: Number(w[1]), until, untilText: w[2], reason: w[3] };
  }
  return { pin, max, waiver, file };
}

/* ---- the list, which is data ---------------------------------------------------------------- */

function readList(file) {
  if (!fs.existsSync(file)) refuse(6, "no module list at " + file);
  const specs = fs.readFileSync(file, "utf8").split("\n")
    .map(l => l.trim()).filter(l => l && !l.startsWith("#"));
  if (!specs.length) refuse(6, "the module list at " + file + " names no path");
  return specs;
}

/* ---- git, read only ------------------------------------------------------------------------- */

function git(repo, args, opts) {
  const r = spawnSync("git", ["-C", repo].concat(args),
    Object.assign({ encoding: "buffer", maxBuffer: 1 << 28 }, opts || {}));
  if (r.error) refuse(3, "git could not be run: " + r.error.message);
  return { status: r.status, out: r.stdout || Buffer.alloc(0),
           err: String(r.stderr || "").trim() };
}
function gitText(repo, args) {
  const r = git(repo, args);
  return { status: r.status, out: r.out.toString("utf8"), err: r.err };
}

/** Where to read the engine's objects. A checkout beside Studio wins because it costs nothing
 *  and is what this desk has; otherwise a bare mirror of the remote, fetched into the scratch
 *  folder, which is ignored by this repository. */
function engineRepo(opts) {
  const o = opts || {};
  const named = o.repo || process.env.ETIUDA_ENGINE_REPO;
  if (named) {
    if (!isRepo(named)) refuse(3, "ETIUDA_ENGINE_REPO is not a git repository: " + named);
    return { dir: named, how: "named checkout" };
  }
  /* An explicitly named remote wins over the sibling, and the sibling over the public URL.
     The order matters for more than taste: without it the remote arm is unreachable on the one
     desk that has a checkout, and an arm that cannot be reached cannot be proved. */
  const remote = o.remote || process.env.ETIUDA_ENGINE_REMOTE;
  if (remote) return mirror(remote, o);
  const sibling = path.resolve(ROOT, "..", "etiuda");
  if (isRepo(sibling)) return { dir: sibling, how: "sibling checkout" };
  return mirror(PUBLIC_REMOTE, o);
}
function isRepo(dir) {
  if (!dir || !fs.existsSync(dir)) return false;
  return gitText(dir, ["rev-parse", "--git-dir"]).status === 0;
}
/** The remote arm: one bare mirror under scratch/, fetched rather than cloned on every run. */
function mirror(url, opts) {
  const dir = (opts && opts.mirrorDir) || path.join(ROOT, "scratch", "engine-mirror.git");
  if (!isRepo(dir)) {
    fs.mkdirSync(path.dirname(dir), { recursive: true });
    const r = spawnSync("git", ["clone", "--bare", url, dir], { encoding: "utf8" });
    if (r.error || r.status !== 0)
      refuse(3, "could not mirror the engine from " + url + ": "
        + String((r.stderr || (r.error && r.error.message) || "")).trim());
  } else {
    const f = gitText(dir, ["fetch", "--quiet", "origin", "+refs/heads/*:refs/heads/*"]);
    if (f.status !== 0) refuse(3, "could not fetch " + url + " into " + dir + ": " + f.err);
  }
  return { dir, how: "bare mirror of " + url };
}

function hasCommit(repo, pin) {
  return gitText(repo, ["cat-file", "-e", pin + "^{commit}"]).status === 0;
}

function parseSpec(spec) {
  const buildIfAbsent = /\s+\?build$/.test(spec);
  const rel = buildIfAbsent ? spec.replace(/\s+\?build$/, "").trim() : spec;
  return { spec, path: rel, buildIfAbsent };
}

function treeMapOf(repo, pin) {
  const r = gitText(repo, ["ls-tree", "-r", pin]);
  if (r.status !== 0) refuse(4, "could not list the tree of " + pin + " in " + repo + ": " + r.err);
  const map = new Map();
  for (const line of r.out.split("\n")) {
    if (!line) continue;
    const tab = line.indexOf("\t");
    const bits = line.slice(0, tab).split(/\s+/);
    if (bits[1] === "blob") map.set(line.slice(tab + 1), bits[2]);
  }
  return map;
}

/** Every blob of the pin's tree that the list asks for, as [path, sha], plus any ?build paths
 *  absent from the pin's tree that must be built from source. A spec without ?build matching
 *  nothing is refusal 5, because a module renamed away must stop a Studio build loudly. */
function resolveSpecs(repo, pin, specs) {
  const treeMap = treeMapOf(repo, pin);
  const tree = [...treeMap.entries()].map(([file, sha]) => ({ file, sha }));
  const picked = new Map();
  const buildNeeded = new Set();
  for (const raw of specs) {
    const { path: spec, buildIfAbsent } = parseSpec(raw);
    if (buildIfAbsent && spec.endsWith("/"))
      refuse(6, "build marker ?build cannot be used on folder prefix: " + raw);
    const hit = spec.endsWith("/")
      ? tree.filter(e => e.file.startsWith(spec))
      : tree.filter(e => e.file === spec);
    if (!hit.length) {
      if (!buildIfAbsent) refuse(5, "the tree of " + pin + " has nothing at " + spec
        + " (named in the module list)");
      buildNeeded.add(spec);
      continue;
    }
    hit.forEach(e => picked.set(e.file, e.sha));
  }
  return {
    entries: [...picked.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1),
    buildNeeded: [...buildNeeded].sort(),
  };
}

function resolve(repo, pin, specs) {
  return resolveSpecs(repo, pin, specs).entries;
}

/** One blob, exactly as the object database holds it. */
function blob(repo, sha) {
  const r = git(repo, ["cat-file", "blob", sha]);
  if (r.status !== 0) refuse(4, "could not read blob " + sha + ": " + r.err);
  return r.out;
}

/* ---- esbuild version and building from the pin ---------------------------------------------- */

function studioEsbuildVersion(studioRoot = ROOT) {
  const pkgAt = path.join(studioRoot, "node_modules", "esbuild", "package.json");
  if (!fs.existsSync(pkgAt)) return null;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgAt, "utf8"));
    return typeof pkg.version === "string" && pkg.version ? pkg.version : null;
  } catch { return null; }
}

function pinEsbuildVersion(repo, pin) {
  const sha = gitText(repo, ["rev-parse", "--verify", "--quiet", pin + ":package-lock.json"]).out.trim();
  if (!/^[0-9a-f]{40}$/.test(sha)) return null;
  try {
    const lock = JSON.parse(blob(repo, sha).toString("utf8"));
    const v = (lock.packages && lock.packages["node_modules/esbuild"] && lock.packages["node_modules/esbuild"].version)
      || (lock.dependencies && lock.dependencies.esbuild && lock.dependencies.esbuild.version);
    return typeof v === "string" && v ? v : null;
  } catch { return null; }
}

function checkEsbuildVersion(repo, pin, studioRoot = ROOT) {
  const studioVer = studioEsbuildVersion(studioRoot);
  const pinVer = pinEsbuildVersion(repo, pin);
  if (!studioVer || !pinVer || studioVer !== pinVer) { /* plant:fetch-esbuild-ver */
    refuse(9, "esbuild version mismatch: Studio has " + (studioVer || "(not installed)")
      + ", the pin " + pin.slice(0, 7) + " package-lock.json names " + (pinVer || "(missing)"));
  }
  return studioVer;
}

function copyRelativeToolImports(repo, pin, treeMap, rel, stage, seen) {
  if (seen.has(rel)) return;
  seen.add(rel);
  const sha = treeMap.get(rel);
  if (!sha) refuse(10, "the tree of " + pin.slice(0, 7) + " has no " + rel + " needed by tools/build.mjs");
  const buf = blob(repo, sha);
  const dest = path.join(stage, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  const stripped = buf.toString("utf8").replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
  const re = /(?:from\s+|import\s*\(?\s*|require\s*\(\s*)["'](\.\.?\/[^"']+)["']/g;
  let m;
  while ((m = re.exec(stripped)) !== null) {
    const next = path.posix.normalize(path.posix.join(path.posix.dirname(rel), m[1]));
    copyRelativeToolImports(repo, pin, treeMap, next, stage, seen);
  }
}

/** Build the desk page and its companions from the pin's own source using the pin's own
 *  tools/build.mjs inside a gitignored staging folder, never touching the engine's tree. */
function buildFromPin(repo, pin, buildNeeded, opts) {
  const treeMap = treeMapOf(repo, pin);
  if (!treeMap.has("tools/build.mjs")) refuse(10, "the tree of " + pin.slice(0, 7) + " has no tools/build.mjs"); /* plant:fetch-build-tool */

  const stage = path.join(ROOT, "scratch", ".engine-build-" + process.pid + "-" + Math.random().toString(36).slice(2, 8));
  fs.rmSync(stage, { recursive: true, force: true });
  try {
    fs.mkdirSync(path.join(stage, "engine"), { recursive: true });
    /* Write the pin's package.json (or {} if absent) so esbuild does not inherit Studio's "type": "commonjs". */
    const pkgSha = treeMap.get("package.json");
    fs.writeFileSync(path.join(stage, "package.json"), pkgSha ? blob(repo, pkgSha) : Buffer.from("{}\n", "utf8"));

    copyRelativeToolImports(repo, pin, treeMap, "tools/build.mjs", stage, new Set());

    const probeFile = path.join(stage, ".probe-build.mjs");
    fs.writeFileSync(probeFile,
      "import * as B from './tools/build.mjs';\n"
      + "console.log(JSON.stringify({ inputs: Array.isArray(B.INPUTS) ? B.INPUTS : null, outputs: Array.isArray(B.OUTPUTS) ? B.OUTPUTS : null }));\n",
      "utf8");
    const probe = spawnSync(process.execPath, [probeFile], { cwd: stage, encoding: "utf8" });
    fs.rmSync(probeFile, { force: true });
    if (probe.error || probe.status !== 0) {
      const msg = String((probe.stderr || "") + ((probe.error && probe.error.message) || "")).trim();
      refuse(10, "could not read tools/build.mjs at " + pin.slice(0, 7) + (msg ? ": " + msg : ""));
    }
    let meta;
    try { meta = JSON.parse(String(probe.stdout || "").trim()); }
    catch { refuse(10, "could not parse exports of tools/build.mjs at " + pin.slice(0, 7)); }

    const inputs = meta && meta.inputs ? meta.inputs : ["src", "shell", "tools/build.mjs", "tools/bundler-probe"];
    for (const rawInp of inputs) {
      const norm = String(rawInp).replace(/\\/g, "/").replace(/\/+$/, "");
      const hits = [...treeMap.entries()].filter(([f]) => f === norm || f.startsWith(norm + "/"));
      if (!hits.length)
        refuse(10, "the tree of " + pin.slice(0, 7) + " has nothing at " + norm + " (named by tools/build.mjs)");
      for (const [f, sha] of hits) {
        const dest = path.join(stage, f);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, blob(repo, sha));
      }
    }

    let buildDay = opts && opts.buildDay;
    if (!buildDay) {
      const cs = gitText(repo, ["log", "-1", "--format=%cs", pin]);
      const line = cs.status === 0 ? cs.out.trim() : "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(line))
        refuse(10, "could not read committer date of " + pin.slice(0, 7));
      buildDay = line;
    }

    const env = Object.assign({}, process.env, { ETIUDA_BUILD_DAY: buildDay }); /* plant:fetch-build-day */
    delete env.ETIUDA_BUILD_COMMIT_DAY;
    const r = spawnSync(process.execPath, [path.join(stage, "tools", "build.mjs")], {
      cwd: stage,
      env,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    if (r.error || r.status !== 0) { /* plant:fetch-build-exit */
      const msg = String((r.stderr || "") + (r.stdout || "") + ((r.error && r.error.message) || "")).trim();
      refuse(11, "tools/build.mjs at " + pin.slice(0, 7) + " failed (exit " + r.status + ")" + (msg ? ": " + msg : ""));
    }

    const expectedOutputs = meta && Array.isArray(meta.outputs) && meta.outputs.length
      ? meta.outputs.map(p => path.isAbsolute(p) ? path.relative(stage, p).split(path.sep).join("/") : String(p).replace(/\\/g, "/"))
      : ["engine/etiuda.html", "engine/etiuda.csp.json", "engine/bubble.css"];
    for (const need of buildNeeded || []) {
      if (!expectedOutputs.includes(need))
        refuse(12, "tools/build.mjs at " + pin.slice(0, 7) + " does not list " + need + " among its outputs");
    }

    const outMap = new Map();
    for (const rel of expectedOutputs) {
      const abs = path.join(stage, rel);
      if (!fs.existsSync(abs) || fs.statSync(abs).size === 0) { /* plant:fetch-build-outputs */
        refuse(12, "tools/build.mjs at " + pin.slice(0, 7) + " did not write " + rel);
      }
      outMap.set(rel, fs.readFileSync(abs));
    }
    return outMap;
  } finally {
    fs.rmSync(stage, { recursive: true, force: true });
  }
}

/** Reads a file from the pin's git tree where present, or from the fetch's built copy under
 *  pinnedDir where absent, so callers do not re-implement building. */
function readPinnedOrBuilt(repo, pin, pinnedDir, rel) {
  const sha = gitText(repo, ["rev-parse", "--verify", "--quiet", pin + ":" + rel]).out.trim();
  if (/^[0-9a-f]{40}$/.test(sha)) return blob(repo, sha);
  let mfPin = null;
  try { mfPin = JSON.parse(fs.readFileSync(path.join(pinnedDir, MANIFEST), "utf8")).pin; } catch {}
  if (mfPin !== pin) { /* plant:fetch-read-built */
    throw new Error("the pin " + pin.slice(0, 7) + " has no " + rel + " and " + pinnedDir
      + " is not fetched at that pin; run node tools/engine-fetch.mjs");
  }
  const builtAt = path.join(pinnedDir, rel);
  if (!fs.existsSync(builtAt))
    throw new Error("the pin " + pin.slice(0, 7) + " has no " + rel + " and no built copy is at "
      + builtAt + "; run node tools/engine-fetch.mjs");
  return fs.readFileSync(builtAt);
}

/* ---- the fetch itself ------------------------------------------------------------------------ */

const MANIFEST = ".engine-pin.json";

function sha256Hex(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function fetchInto(out, repo, pin, entries, builtFiles) {
  fs.rmSync(out, { recursive: true, force: true });
  for (const [file, sha] of entries) {
    const dest = path.join(out, file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, blob(repo, sha));
  }
  const builtList = [];
  if (builtFiles && builtFiles.size > 0) {
    for (const [file, buf] of [...builtFiles.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1)) {
      const dest = path.join(out, file);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, buf);
      builtList.push([file, sha256Hex(buf)]);
    }
  }
  const manifest = { pin, count: entries.length, files: entries };
  if (builtList.length > 0) manifest.built = builtList;
  fs.writeFileSync(path.join(out, MANIFEST), JSON.stringify(manifest, null, 1) + "\n", "utf8");
}

function run(argv) {
  const arg = (name, dflt) => {
    const i = argv.indexOf(name);
    return i > -1 && argv[i + 1] != null ? argv[i + 1] : dflt;
  };
  const quiet = argv.includes("--quiet");
  const pinFile = path.resolve(arg("--pin-file", path.join(ROOT, "tools", "engine-pin")));
  const listFile = path.resolve(arg("--list", path.join(ROOT, "tools", "engine-modules.txt")));
  const out = path.resolve(arg("--out", path.join(ROOT, "engine", "pinned")));

  const { pin } = readPin(pinFile);
  const specs = readList(listFile);
  const repo = engineRepo({ repo: arg("--repo", null) });
  if (!hasCommit(repo.dir, pin))
    refuse(4, "the engine repository at " + repo.dir + " has no commit " + pin
      + " (" + repo.how + "); fetch it, or correct ENGINE_PIN in " + pinFile);
  checkEsbuildVersion(repo.dir, pin);
  const { entries, buildNeeded } = resolveSpecs(repo.dir, pin, specs);
  /* The package ships the shell's declarations Studio runs and not the shell (src/engine.mjs, board 865), so they
     are cut here, before anything is written, and a pin they cannot be cut from writes nothing. */
  const shellAt = entries.find(e => e[0] === "shell/main.js");
  let slices = null;
  if (shellAt) {
    try { slices = shellSlicesFrom(blob(repo.dir, shellAt[1]).toString("utf8"), pin); }
    catch (e) { refuse(7, "the shell/main.js of " + pin.slice(0, 7) + " cannot be cut into " + SHELL_SLICES + ": " + e.message); }
  }
  /* The desk's installer script is fetched so the drift gate can hold it to the pin, and it is not what the NSIS
     build includes. The five hooks are cut first, so a pin that cannot be cut writes nothing. */
  const instAt = entries.find(e => e[0] === "shell/installer.nsh");
  let hooks = null;
  if (instAt) {
    try { hooks = installerHooksFrom(blob(repo.dir, instAt[1]).toString("utf8"), pin); }
    catch (e) { refuse(8, "the shell/installer.nsh of " + pin.slice(0, 7) + " cannot be cut into " + INSTALLER_HOOKS + ": " + e.message); }
  }
  const builtFiles = new Map();
  if (buildNeeded.length > 0) {
    const entrySet = new Set(entries.map(e => e[0]));
    for (const [rel, buf] of buildFromPin(repo.dir, pin, buildNeeded)) {
      if (!entrySet.has(rel)) builtFiles.set(rel, buf);
    }
  }
  fetchInto(out, repo.dir, pin, entries, builtFiles);
  if (slices != null) fs.writeFileSync(path.join(out, SHELL_SLICES), slices, "utf8");
  if (hooks != null) fs.writeFileSync(path.join(out, INSTALLER_HOOKS), hooks, "utf8");
  if (!quiet)
    process.stdout.write("engine-fetch: " + (entries.length + builtFiles.size) + " file(s)"
      + (builtFiles.size ? " (" + builtFiles.size + " built)" : "") + " of " + pin.slice(0, 7)
      + " from the " + repo.how + " into " + out + "\n");
  return { pin, out, entries, builtFiles, repo };
}

export { readPin, readList, parseSpec, engineRepo, hasCommit, resolve, resolveSpecs, blob, git, gitText,
         studioEsbuildVersion, pinEsbuildVersion, checkEsbuildVersion, buildFromPin, readPinnedOrBuilt,
         MANIFEST, Refusal, ROOT, PUBLIC_REMOTE, run };

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try { run(process.argv.slice(2)); }
  catch (e) {
    if (e instanceof Refusal) { process.stderr.write("engine-fetch: " + e.message + "\n"); process.exit(e.code); }
    throw e;
  }
}
