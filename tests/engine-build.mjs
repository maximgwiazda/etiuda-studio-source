/* STUDIO BUILDS THE PINNED DESK PAGE WHERE THE PIN NO LONGER CARRIES IT (step b).
 *
 *     node tests/engine-build.mjs
 *
 * Claims, each measured from scratch and git objects, writing nothing to the engine repository:
 *   1  built equals committed blobs on today's pin: all three files (engine/etiuda.html,
 *      engine/etiuda.csp.json, engine/bubble.css), built with the day the committed page itself
 *      carries, equal the pin's git blobs byte for byte
 *   2  where the pin carries the built files the fetch builds nothing: on today's pin,
 *      tools/engine-fetch.mjs exits 0 with no built manifest entry and no etiuda.csp.json
 *      (that the bytes are the pin's is held by tests/drift.mjs's bytes arm and by claim 1)
 *   3  a pin without the three built files: tools/engine-fetch.mjs builds all three from the
 *      pin's own tools/build.mjs and INPUTS via git cat-file blob into a gitignored folder,
 *      handing in the pin's committer date; a second fetch under a distant timezone gives the
 *      exact same bytes
 *   4  every reader holds on the built copy: tests/drift.mjs (bytes and esbuild arms, failing on
 *      a tampered built file), tests/round-trip.mjs deskLab (reading from pin where present and
 *      from the fetch's built copy where absent, refusing a stale pin), tools/bubble-css.mjs
 *      format and tests/follow-desk.mjs .tour-hole rule
 *   5  every new refusal (9 esbuild mismatch, 10 missing build tool, 11 non-zero build exit,
 *      12 incomplete build outputs) and refusal 5 (plain missing path) exit with their own code
 *      and leave an already populated output folder untouched
 *   6  planted faults: each new check turns red under its plant marker fault in a scratch
 *      copy of the repository (skipped only when ETIUDA_PLANTS=off)
 *
 * Node only, no window, no network.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { clearScratch } from "./scratch.mjs";
import { plantsTree, dropPlantsTree } from "./plants-tree.mjs";
import * as fetchMod from "../tools/engine-fetch.mjs";
import * as driftMod from "./drift.mjs";
import * as roundTripMod from "./round-trip.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "engine-build");
const EXPECTED = 19;

let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
function skip(line) {
  skipped++;
  process.stdout.write("  SKIP " + line + "\n");
}

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function walkFiles(dir, base, out) {
  base = base || dir;
  out = out || new Map();
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir).sort()) {
    const abs = path.join(dir, name);
    if (fs.statSync(abs).isDirectory()) walkFiles(abs, base, out);
    else {
      const rel = path.relative(base, abs).split(path.sep).join("/");
      out.set(rel, fs.readFileSync(abs));
    }
  }
  return out;
}

function dirDiffs(aDir, bDir) {
  const a = walkFiles(aDir), b = walkFiles(bDir);
  const diffs = [];
  for (const [k, buf] of a) {
    if (!b.has(k)) diffs.push("only in first: " + k);
    else if (Buffer.compare(buf, b.get(k)) !== 0)
      diffs.push("differ: " + k + " (" + buf.length + " vs " + b.get(k).length + ")");
  }
  for (const k of b.keys()) if (!a.has(k)) diffs.push("only in second: " + k);
  return diffs;
}

function runGit(dir, args, envExtra) {
  const r = spawnSync("git", ["-C", dir].concat(args), {
    encoding: "utf8",
    env: Object.assign({}, process.env, envExtra || {}),
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0) throw new Error("git " + args.join(" ") + " failed: " + (r.stderr || r.stdout));
  return r.stdout.trim();
}

function hashObjectStdin(dir, buf) {
  const r = spawnSync("git", ["-C", dir, "hash-object", "-w", "--stdin"], {
    input: buf,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0) throw new Error("git hash-object failed: " + String(r.stderr || ""));
  return String(r.stdout || "").trim();
}

function commitWithTree(dir, parent, envDate, edits) {
  runGit(dir, ["read-tree", parent]);
  for (const e of edits) {
    if (e.remove) {
      runGit(dir, ["update-index", "--force-remove", "--", e.path]);
    } else {
      const oid = hashObjectStdin(dir, typeof e.content === "string" ? Buffer.from(e.content, "utf8") : e.content);
      runGit(dir, ["update-index", "--add", "--cacheinfo", "100644," + oid + "," + e.path]);
    }
  }
  const tree = runGit(dir, ["write-tree"]);
  const env = envDate ? { GIT_COMMITTER_DATE: envDate, GIT_AUTHOR_DATE: envDate } : {};
  return runGit(dir, ["commit-tree", tree, "-p", parent, "-m", "scratch fixture"], env);
}

function writePinFile(file, pin) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, "ENGINE_PIN=" + pin + "\nDRIFT_MAX_COMMITS=20\n", "utf8");
}

function runFetchCli(cwd, args, envExtra) {
  return spawnSync(process.execPath, [path.join(cwd, "tools", "engine-fetch.mjs")].concat(args), {
    cwd,
    encoding: "utf8",
    env: Object.assign({}, process.env, envExtra || {}),
    maxBuffer: 64 * 1024 * 1024,
  });
}

function firstDiffOffset(a, b) {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return i;
  return a.length === b.length ? -1 : n;
}

async function main() {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });

  const { pin } = fetchMod.readPin(path.join(ROOT, "tools", "engine-pin"));
  const repo = fetchMod.engineRepo({});
  const BUILT_NAMES = ["engine/etiuda.html", "engine/etiuda.csp.json", "engine/bubble.css"];

  /* ---- 1. Built equals committed blobs on today's pin -------------------------------------- */
  let builtFromToday = null;
  let eb1Err = "";
  try {
    if (typeof fetchMod.buildFromPin !== "function") throw new Error("tools/engine-fetch.mjs does not export buildFromPin");
    const htmlBlobSha = fetchMod.gitText(repo.dir, ["rev-parse", "--verify", "--quiet", pin + ":engine/etiuda.html"]).out.trim();
    const htmlBlob = fetchMod.blob(repo.dir, htmlBlobSha);
    const m = /\bE_BUILT = "(\d{4}-\d\d-\d\d)";/.exec(htmlBlob.toString("utf8"));
    const stampedDay = m ? m[1] : "";
    if (!stampedDay) throw new Error("committed engine/etiuda.html carries no E_BUILT day");
    builtFromToday = fetchMod.buildFromPin(repo.dir, pin, BUILT_NAMES, { buildDay: stampedDay });
    const mismatches = [];
    const summary = [];
    for (const rel of BUILT_NAMES) {
      const bSha = fetchMod.gitText(repo.dir, ["rev-parse", "--verify", "--quiet", pin + ":" + rel]).out.trim();
      const bBuf = fetchMod.blob(repo.dir, bSha);
      const gBuf = builtFromToday.get(rel);
      const same = !!gBuf && Buffer.compare(bBuf, gBuf) === 0;
      summary.push(rel + " blob=" + bBuf.length + "/" + sha256(bBuf).slice(0, 12)
        + " built=" + (gBuf ? gBuf.length + "/" + sha256(gBuf).slice(0, 12) : "missing")
        + " eq=" + same);
      if (!same) {
        const at = gBuf ? firstDiffOffset(bBuf, gBuf) : 0;
        mismatches.push(rel + " differs at byte " + at);
      }
    }
    check(mismatches.length === 0,
      "eb1 built equals committed blobs on today's pin (" + stampedDay + "): " + summary.join("; ")
      + (mismatches.length ? " | MISMATCH: " + mismatches.join(", ") : ""));
  } catch (e) {
    eb1Err = String((e && e.message) || e);
    check(false, "eb1 built equals committed blobs on today's pin: " + eb1Err);
  }

  /* ---- 2. Where the pin carries the built files, the fetch builds nothing ------------------ */
  /* That the bytes are the pin's is held by drift's bytes arm (every fetched file against the pin's blob) and by eb1.
     The comparison with the earlier tool (Studio 81e6f09f) was a one-time claim about the transition, measured once at pin
     e869ce90 and kept in the record; a check that reads another commit of its own tree holds for one pin only (the test
     architect, 2026-11-16). */
  const outToday = path.join(SCRATCH, "out-today");
  const rToday = runFetchCli(ROOT, ["--repo", repo.dir, "--out", outToday, "--quiet"]);
  let eb2Ok = rToday.status === 0
    && !fs.existsSync(path.join(outToday, "engine", "etiuda.csp.json"));
  let eb2Detail = "exit " + rToday.status;
  if (eb2Ok) {
    const mf = JSON.parse(fs.readFileSync(path.join(outToday, fetchMod.MANIFEST), "utf8"));
    if ("built" in mf) { eb2Ok = false; eb2Detail += "; manifest unexpectedly carries built"; }
    else eb2Detail += ", no built entry in the manifest, no engine/etiuda.csp.json written";
  } else {
    eb2Detail += "; " + String(rToday.stderr || "").trim();
  }
  check(eb2Ok, "eb2 where the pin carries the built files, today's fetch exits 0, records nothing built and writes no etiuda.csp.json: " + eb2Detail);

  /* ---- 3. Scratch repository without the three built files -------------------------------- */
  const scratchRepo = path.join(SCRATCH, "engine-no-built.git");
  const cloned = spawnSync("git", ["clone", "--no-checkout", "--quiet", repo.dir, scratchRepo], { encoding: "utf8" });
  if (cloned.status !== 0) throw new Error("git clone --no-checkout failed: " + (cloned.stderr || cloned.stdout));

  const COMMIT_DAY = "2026-11-10";
  const noBuiltPin = commitWithTree(scratchRepo, pin, COMMIT_DAY + "T12:00:00+02:00", [
    { remove: true, path: "engine/etiuda.html" },
    { remove: true, path: "engine/etiuda.csp.json" },
    { remove: true, path: "engine/bubble.css" },
  ]);
  const pinFileNoBuilt = path.join(SCRATCH, "pin-no-built");
  writePinFile(pinFileNoBuilt, noBuiltPin);

  const outBuilt1 = path.join(SCRATCH, "out-built-1");
  const rBuilt1 = runFetchCli(ROOT, ["--repo", scratchRepo, "--pin-file", pinFileNoBuilt, "--out", outBuilt1], { TZ: "America/Los_Angeles" });
  const builtFiles1 = new Map();
  let eb3Ok = rBuilt1.status === 0;
  let eb3Msg = "exit " + rBuilt1.status;
  if (eb3Ok) {
    for (const rel of BUILT_NAMES) {
      const p = path.join(outBuilt1, rel);
      if (!fs.existsSync(p) || fs.statSync(p).size === 0) { eb3Ok = false; eb3Msg += "; missing " + rel; }
      else builtFiles1.set(rel, fs.readFileSync(p));
    }
    if (eb3Ok) {
      const htmlText = builtFiles1.get("engine/etiuda.html").toString("utf8");
      const dayMatch = /\bE_BUILT = "(\d{4}-\d\d-\d\d)";/.exec(htmlText);
      const dayGot = dayMatch ? dayMatch[1] : "(none)";
      if (dayGot !== COMMIT_DAY) { eb3Ok = false; eb3Msg += "; E_BUILT=" + dayGot + " wanted " + COMMIT_DAY; }
      const csp = JSON.parse(builtFiles1.get("engine/etiuda.csp.json").toString("utf8"));
      if (!Array.isArray(csp.hashes) || csp.hashes.length !== 2) { eb3Ok = false; eb3Msg += "; bad csp hashes"; }
      const cssText = builtFiles1.get("engine/bubble.css").toString("utf8");
      if (!/\.bub\s*\{/.test(cssText) || !/\.bub-tip\s*\{/.test(cssText)) { eb3Ok = false; eb3Msg += "; bubble.css missing rules"; }
      eb3Msg += ", built 3 files with committer date " + dayGot;
    }
  } else {
    eb3Msg += ": " + String(rBuilt1.stderr || "").trim();
  }
  check(eb3Ok, "eb3 pin without built files builds all three with committer date: " + eb3Msg);

  const outBuilt2 = path.join(SCRATCH, "out-built-2");
  const rBuilt2 = runFetchCli(ROOT, ["--repo", scratchRepo, "--pin-file", pinFileNoBuilt, "--out", outBuilt2], { TZ: "Pacific/Auckland" });
  const eb4Diffs = rBuilt2.status === 0 ? dirDiffs(outBuilt1, outBuilt2) : ["fetch 2 exited " + rBuilt2.status];
  check(rBuilt2.status === 0 && eb4Diffs.length === 0,
    "eb4 second fetch across timezones gives identical bytes" + (eb4Diffs.length ? ": " + eb4Diffs.slice(0, 3).join("; ") : ""));

  /* ---- 4. Readers on the built copy ------------------------------------------------------- */
  let eb5Ok = false, eb5Msg = "";
  if (eb3Ok) {
    const drOk = driftMod.check([], { repo: scratchRepo, pin: noBuiltPin, out: outBuilt1, ref: noBuiltPin });
    const outTamper = path.join(SCRATCH, "out-tamper");
    fs.cpSync(outBuilt1, outTamper, { recursive: true });
    const htmlT = path.join(outTamper, "engine", "etiuda.html");
    fs.writeFileSync(htmlT, fs.readFileSync(htmlT, "utf8").replace("E_BUILT", "E_BUILX"), "utf8");
    const drBad = driftMod.check([], { repo: scratchRepo, pin: noBuiltPin, out: outTamper, ref: noBuiltPin });
    const drCspGone = path.join(outTamper, "engine", "etiuda.csp.json");
    fs.unlinkSync(drCspGone);
    const drMissing = driftMod.check([], { repo: scratchRepo, pin: noBuiltPin, out: outTamper, ref: noBuiltPin });
    const cssMatch = Buffer.compare(builtFiles1.get("engine/bubble.css"), fs.readFileSync(path.join(outToday, "engine", "bubble.css"))) === 0;
    const styleOf = (html) => html.slice(html.indexOf("<style"), html.indexOf("</style>"));
    const styleMatch = styleOf(builtFiles1.get("engine/etiuda.html").toString("utf8"))
      === styleOf(fs.readFileSync(path.join(outToday, "engine", "etiuda.html"), "utf8"));
    eb5Ok = drOk.problems.length === 0
      && drBad.problems.some(p => p.startsWith("bytes:"))
      && drMissing.problems.some(p => p.startsWith("bytes:") && p.includes("etiuda.csp.json"))
      && cssMatch && styleMatch;
    eb5Msg = "clean=" + drOk.problems.length + ", tampered=" + drBad.problems.length + ", missing=" + drMissing.problems.length
      + ", cssMatch=" + cssMatch + ", styleMatch=" + styleMatch;
  } else {
    eb5Msg = "skipped because eb3 failed";
  }
  check(eb5Ok, "eb5 drift bytes arm holds on built copy and flags tampered or missing built files: " + eb5Msg);

  let eb6Ok = false, eb6Msg = "";
  if (eb3Ok && typeof roundTripMod.deskLab === "function") {
    const labBuilt = path.join(SCRATCH, "rt-lab-built");
    const resBuilt = await roundTripMod.deskLab(labBuilt, { repo: scratchRepo, pin: noBuiltPin, pinnedDir: outBuilt1 });
    const labHtml = fs.readFileSync(path.join(resBuilt.lab, "engine", "etiuda.html"));
    const labCsp = fs.readFileSync(path.join(resBuilt.lab, "engine", "etiuda.csp.json"));

    const labBlob = path.join(SCRATCH, "rt-lab-blob");
    const resBlob = await roundTripMod.deskLab(labBlob, { repo: repo.dir, pin, pinnedDir: outToday });
    const blobHtml = fs.readFileSync(path.join(resBlob.lab, "engine", "etiuda.html"));
    const blobCsp = fs.readFileSync(path.join(resBlob.lab, "engine", "etiuda.csp.json"));

    let staleRefused = false;
    try {
      await roundTripMod.deskLab(path.join(SCRATCH, "rt-lab-stale"), { repo: scratchRepo, pin: noBuiltPin, pinnedDir: outToday });
    } catch (e) {
      staleRefused = /engine-fetch/.test(String(e && e.message || e));
    }
    eb6Ok = Buffer.compare(labHtml, builtFiles1.get("engine/etiuda.html")) === 0
      && Buffer.compare(labCsp, builtFiles1.get("engine/etiuda.csp.json")) === 0
      && Buffer.compare(blobHtml, fetchMod.blob(repo.dir, fetchMod.gitText(repo.dir, ["rev-parse", pin + ":engine/etiuda.html"]).out.trim())) === 0
      && Buffer.compare(blobCsp, fetchMod.blob(repo.dir, fetchMod.gitText(repo.dir, ["rev-parse", pin + ":engine/etiuda.csp.json"]).out.trim())) === 0
      && staleRefused;
    eb6Msg = "built-lab=ok, blob-lab=ok, stale-refused=" + staleRefused;
  } else {
    eb6Msg = typeof roundTripMod.deskLab !== "function" ? "deskLab not exported" : "eb3 failed";
  }
  check(eb6Ok, "eb6 round-trip deskLab reads pin blobs where present and built copy where absent: " + eb6Msg);

  /* ---- 5. Every new refusal provoked and leaves --out untouched -------------------------- */
  const sentinelOut = path.join(SCRATCH, "out-sentinel");
  fs.mkdirSync(path.join(sentinelOut, "engine"), { recursive: true });
  fs.writeFileSync(path.join(sentinelOut, "keep.txt"), "unchanged-sentinel\n", "utf8");
  fs.writeFileSync(path.join(sentinelOut, "engine", "etiuda.html"), "old-html\n", "utf8");
  const sentinelSnap = path.join(SCRATCH, "out-sentinel-snap");
  fs.cpSync(sentinelOut, sentinelSnap, { recursive: true });

  const lockBlob = fetchMod.blob(repo.dir, fetchMod.gitText(repo.dir, ["rev-parse", pin + ":package-lock.json"]).out.trim()).toString("utf8");
  const lockObj = JSON.parse(lockBlob);
  lockObj.packages["node_modules/esbuild"].version = "0.28.1";
  const badEsbuildPin = commitWithTree(scratchRepo, noBuiltPin, COMMIT_DAY + "T12:00:00+02:00", [
    { path: "package-lock.json", content: JSON.stringify(lockObj, null, 2) + "\n" },
  ]);
  const badEsbuildPinFile = path.join(SCRATCH, "pin-bad-esbuild");
  writePinFile(badEsbuildPinFile, badEsbuildPin);
  const r9 = runFetchCli(ROOT, ["--repo", scratchRepo, "--pin-file", badEsbuildPinFile, "--out", sentinelOut]);
  const r9Err = String(r9.stderr || "");
  const r9Diffs = dirDiffs(sentinelSnap, sentinelOut);
  const dr9 = driftMod.check([], { repo: scratchRepo, pin: badEsbuildPin, out: sentinelOut, ref: badEsbuildPin });
  const dr9Has = dr9.problems.some(p => p.startsWith("esbuild:") && p.includes("0.28.2") && p.includes("0.28.1"));
  check(r9.status === 9 && r9Err.includes("0.28.2") && r9Err.includes("0.28.1") && r9Diffs.length === 0 && dr9Has,
    "eb7 refusal 9 on esbuild version mismatch (exit " + r9.status + ", names both versions, out untouched, drift red=" + dr9Has + ")");

  const noToolPin = commitWithTree(scratchRepo, noBuiltPin, COMMIT_DAY + "T12:00:00+02:00", [
    { remove: true, path: "tools/build.mjs" },
  ]);
  const noToolPinFile = path.join(SCRATCH, "pin-no-tool");
  writePinFile(noToolPinFile, noToolPin);
  const r10 = runFetchCli(ROOT, ["--repo", scratchRepo, "--pin-file", noToolPinFile, "--out", sentinelOut]);
  const r10Diffs = dirDiffs(sentinelSnap, sentinelOut);
  check(r10.status === 10 && /tools\/build\.mjs/.test(String(r10.stderr || "")) && r10Diffs.length === 0,
    "eb8 refusal 10 on missing tools/build.mjs (exit " + r10.status + ", out untouched)");

  const failBuildPin = commitWithTree(scratchRepo, noBuiltPin, COMMIT_DAY + "T12:00:00+02:00", [
    {
      path: "tools/build.mjs",
      content: "export const INPUTS = ['src', 'tools/build.mjs'];\n"
        + "export const OUTPUTS = ['engine/etiuda.html', 'engine/etiuda.csp.json', 'engine/bubble.css'];\n"
        + "import { pathToFileURL } from 'node:url';\n"
        + "if (import.meta.url === pathToFileURL(process.argv[1]).href) { console.error('planted build failure'); process.exit(2); }\n",
    },
  ]);
  const failBuildPinFile = path.join(SCRATCH, "pin-fail-build");
  writePinFile(failBuildPinFile, failBuildPin);
  const r11 = runFetchCli(ROOT, ["--repo", scratchRepo, "--pin-file", failBuildPinFile, "--out", sentinelOut]);
  const r11Diffs = dirDiffs(sentinelSnap, sentinelOut);
  check(r11.status === 11 && /failed|exit 2/.test(String(r11.stderr || "")) && r11Diffs.length === 0,
    "eb9 refusal 11 on non-zero build exit (exit " + r11.status + ", out untouched)");

  const shortBuildPin = commitWithTree(scratchRepo, noBuiltPin, COMMIT_DAY + "T12:00:00+02:00", [
    {
      path: "tools/build.mjs",
      content: "import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';\n"
        + "const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');\n"
        + "export const INPUTS = ['src', 'tools/build.mjs'];\n"
        + "export const OUTPUTS = [path.join(R, 'engine', 'etiuda.html'), path.join(R, 'engine', 'etiuda.csp.json'), path.join(R, 'engine', 'bubble.css')];\n"
        + "if (import.meta.url === pathToFileURL(process.argv[1]).href) {\n"
        + "  fs.writeFileSync(OUTPUTS[0], 'html');\n"
        + "  fs.writeFileSync(OUTPUTS[2], 'css');\n"
        + "}\n",
    },
  ]);
  const shortBuildPinFile = path.join(SCRATCH, "pin-short-build");
  writePinFile(shortBuildPinFile, shortBuildPin);
  const r12 = runFetchCli(ROOT, ["--repo", scratchRepo, "--pin-file", shortBuildPinFile, "--out", sentinelOut]);
  const r12Diffs = dirDiffs(sentinelSnap, sentinelOut);
  check(r12.status === 12 && /etiuda\.csp\.json/.test(String(r12.stderr || "")) && r12Diffs.length === 0,
    "eb10 refusal 12 when build writes fewer than its files (exit " + r12.status + ", out untouched)");

  const badListFile = path.join(SCRATCH, "bad-list.txt");
  fs.writeFileSync(badListFile, "src/no-such-file.js\n", "utf8");
  const r5 = runFetchCli(ROOT, ["--repo", scratchRepo, "--pin-file", pinFileNoBuilt, "--list", badListFile, "--out", sentinelOut]);
  const r5Diffs = dirDiffs(sentinelSnap, sentinelOut);
  check(r5.status === 5 && /src\/no-such-file\.js/.test(String(r5.stderr || "")) && r5Diffs.length === 0,
    "eb11 refusal 5 still holds for non-build missing path (exit " + r5.status + ", out untouched)");

  /* ---- 6. Planted faults ------------------------------------------------------------------ */
  const PLANT_SPECS = [
    {
      id: "eb12p",
      file: "tools/engine-fetch.mjs",
      tag: "fetch-esbuild-ver",
      from: "if (!studioVer || !pinVer || studioVer !== pinVer) { /* plant:fetch-esbuild-ver */",
      to: "if (false) { /* plant:fetch-esbuild-ver */",
      test: (tree) => {
        const r = runFetchCli(tree, ["--repo", scratchRepo, "--pin-file", badEsbuildPinFile, "--out", path.join(SCRATCH, "plant-out-9")]);
        return r.status !== 9;
      },
    },
    {
      id: "eb13p",
      file: "tools/engine-fetch.mjs",
      tag: "fetch-build-day",
      from: "const env = Object.assign({}, process.env, { ETIUDA_BUILD_DAY: buildDay }); /* plant:fetch-build-day */",
      to: "const env = Object.assign({}, process.env, { ETIUDA_BUILD_DAY: \"2099-01-01\" }); /* plant:fetch-build-day */",
      test: (tree) => {
        const o = path.join(SCRATCH, "plant-out-day");
        const r = runFetchCli(tree, ["--repo", scratchRepo, "--pin-file", pinFileNoBuilt, "--out", o]);
        if (r.status !== 0) return true;
        const html = fs.readFileSync(path.join(o, "engine", "etiuda.html"), "utf8");
        return !html.includes('E_BUILT = "' + COMMIT_DAY + '"');
      },
    },
    {
      id: "eb14p",
      file: "tools/engine-fetch.mjs",
      tag: "fetch-build-tool",
      from: "if (!treeMap.has(\"tools/build.mjs\")) refuse(10, \"the tree of \" + pin.slice(0, 7) + \" has no tools/build.mjs\"); /* plant:fetch-build-tool */",
      to: "if (!treeMap.has(\"tools/build.mjs\")) refuse(5, \"the tree of \" + pin.slice(0, 7) + \" has no tools/build.mjs\"); /* plant:fetch-build-tool */",
      test: (tree) => {
        const r = runFetchCli(tree, ["--repo", scratchRepo, "--pin-file", noToolPinFile, "--out", path.join(SCRATCH, "plant-out-10")]);
        return r.status !== 10;
      },
    },
    {
      id: "eb15p",
      file: "tools/engine-fetch.mjs",
      tag: "fetch-build-exit",
      from: "if (r.error || r.status !== 0) { /* plant:fetch-build-exit */",
      to: "if (false) { /* plant:fetch-build-exit */",
      test: (tree) => {
        const r = runFetchCli(tree, ["--repo", scratchRepo, "--pin-file", failBuildPinFile, "--out", path.join(SCRATCH, "plant-out-11")]);
        return r.status !== 11;
      },
    },
    {
      id: "eb16p",
      file: "tools/engine-fetch.mjs",
      tag: "fetch-build-outputs",
      from: "if (!fs.existsSync(abs) || fs.statSync(abs).size === 0) { /* plant:fetch-build-outputs */",
      to: "if (false) { /* plant:fetch-build-outputs */",
      test: (tree) => {
        const r = runFetchCli(tree, ["--repo", scratchRepo, "--pin-file", shortBuildPinFile, "--out", path.join(SCRATCH, "plant-out-12")]);
        return r.status !== 12;
      },
    },
    {
      id: "eb17p",
      file: "tests/drift.mjs",
      tag: "drift-esbuild",
      from: "if (!studioEsbuild || !pinEsbuild || studioEsbuild !== pinEsbuild) { /* plant:drift-esbuild */",
      to: "if (false) { /* plant:drift-esbuild */",
      test: async (tree) => {
        const d = await import(pathToFileURL(path.join(tree, "tests", "drift.mjs")).href + "?p=esbuild");
        const res = d.check([], { repo: scratchRepo, pin: badEsbuildPin, out: outBuilt1, ref: badEsbuildPin });
        return !res.problems.some(p => p.startsWith("esbuild:"));
      },
    },
    {
      id: "eb18p",
      file: "tests/drift.mjs",
      tag: "drift-built-bytes",
      from: "if (Buffer.compare(onDisk, builtBuf) !== 0) { /* plant:drift-built-bytes */",
      to: "if (false) { /* plant:drift-built-bytes */",
      test: async (tree) => {
        const d = await import(pathToFileURL(path.join(tree, "tests", "drift.mjs")).href + "?p=bytes");
        const outTamper = path.join(SCRATCH, "out-tamper-plant");
        fs.rmSync(outTamper, { recursive: true, force: true });
        fs.cpSync(outBuilt1, outTamper, { recursive: true });
        const htmlT = path.join(outTamper, "engine", "etiuda.html");
        fs.writeFileSync(htmlT, fs.readFileSync(htmlT, "utf8").replace("E_BUILT", "E_BUILX"), "utf8");
        const res = d.check([], { repo: scratchRepo, pin: noBuiltPin, out: outTamper, ref: noBuiltPin });
        return !res.problems.some(p => p.startsWith("bytes:"));
      },
    },
    {
      id: "eb19p",
      file: "tests/round-trip.mjs",
      tag: "rt-built-page",
      from: "const bytes = readPinnedOrBuilt(repo, pin, pinnedDir, rel); /* plant:rt-built-page */",
      to: "const sha = gitText(repo, [\"rev-parse\", \"--verify\", \"--quiet\", pin + \":\" + rel]).out.trim(); if (!sha) throw new Error(\"no \" + rel); const bytes = blob(repo, sha); /* plant:rt-built-page */",
      test: async (tree) => {
        const rt = await import(pathToFileURL(path.join(tree, "tests", "round-trip.mjs")).href + "?p=rt");
        try {
          await rt.deskLab(path.join(SCRATCH, "plant-rt-lab"), { repo: scratchRepo, pin: noBuiltPin, pinnedDir: outBuilt1 });
          return false;
        } catch {
          return true;
        }
      },
    },
  ];

  if (process.env.ETIUDA_PLANTS === "off") {
    for (const p of PLANT_SPECS) skip(p.id + " plant:" + p.tag + " (ETIUDA_PLANTS=off)");
  } else {
    let copy = null;
    try {
      copy = plantsTree(ROOT, "eb-plants");
      for (const p of PLANT_SPECS) {
        const target = path.join(copy, p.file);
        const orig = fs.readFileSync(target, "utf8");
        if (!orig.includes(p.from)) {
          check(false, p.id + " plant:" + p.tag + " marker not found in " + p.file);
          continue;
        }
        try {
          fs.writeFileSync(target, orig.replace(p.from, p.to), "utf8");
          const red = await p.test(copy);
          check(red, p.id + " plant:" + p.tag + " turns check red");
        } finally {
          fs.writeFileSync(target, orig, "utf8");
        }
      }
    } finally {
      if (copy) dropPlantsTree(copy, ROOT);
    }
  }

  const total = asserted + skipped;
  process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failures=" + failed + "\n");
  process.stdout.write("engine-build: " + asserted + " check(s) ran (" + skipped + " skipped), " + failed + " failure(s)\n");
  if (failed || (process.env.ETIUDA_PLANTS !== "off" && total < EXPECTED)) process.exit(1);
}

main().catch(e => {
  process.stderr.write("engine-build: " + String(e && e.stack || e) + "\n");
  process.exit(1);
});
