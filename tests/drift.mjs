/* THE DRIFT GATE. A pin is a promise that Studio is built against a stated commit of the
 * engine; five things can break that promise and this gate is the only thing that would
 * notice any of them.
 *
 *     node tests/drift.mjs [--pin-file <path>] [--list <path>] [--out <dir>] [--ref <ref>]
 *
 *   lag      the pin is behind the engine's main by more than DRIFT_MAX_COMMITS.
 *            Rule 6: its lag arm only warns at merge. Three nightly warnings in a row
 *            open a board item for the lead engineer, who moves the pin inside the
 *            next Studio merge. Lag is red at the release gate: no Studio installer
 *            and no relay deploy while the pin is more than 20 commits behind.
 *            The history, bytes, copies and esbuild arms stay red everywhere.
 *   history  the pin is not an ancestor of main at all: a rewritten history, an abandoned
 *            branch, or a hash from a repository that is not this one.
 *   bytes    engine/pinned/ differs from the pin's tree (or, for ?build entries absent from
 *            the pin, from the pin's own tools/build.mjs output). A file edited, a file
 *            missing, a file that is there and should not be. And the shell's slices
 *            (board 865), which the fetch cuts from the pin's shell/main.js for the package,
 *            are what that shell cuts into now.
 *   copies   a file of the engine's that Studio keeps by hand (COPIES below) differs from the
 *            pin's blob of it, byte for byte.
 *   esbuild  Studio's installed esbuild version differs from the version the pin's
 *            package-lock.json names.
 *
 * EACH PROBLEM CARRIES ITS CHECK'S NAME, and that is not decoration. A control that makes the
 * gate red proves nothing unless it proves WHICH arm went red: a pin moved 25 commits back is
 * both stale and byte-different, so the control that proves the lag arm fetches at that pin
 * first and then asserts on the tag.
 *
 * It reads the engine repository and writes nothing to it. Exit 1 on any problem, 0 on none,
 * and the refusal codes of tools/engine-fetch.mjs where the pin or the list cannot be read.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { shellSlicesFrom, SHELL_SLICES, installerHooksFrom, INSTALLER_HOOKS } from "../src/engine.mjs";
import { readPin, readList, engineRepo, hasCommit, resolveSpecs, blob, gitText,
         studioEsbuildVersion, pinEsbuildVersion, buildFromPin,
         MANIFEST, Refusal, ROOT } from "../tools/engine-fetch.mjs";

const REFS = ["main", "origin/main", "refs/heads/main"];

/* Rule 6: Lag is red at the release gate: no Studio installer and no relay deploy while the pin is more than 20 commits behind. */
const RELEASE_MAX_COMMITS = 20;

function mainRef(repo, named) {
  for (const r of (named ? [named] : REFS)) {
    const got = gitText(repo, ["rev-parse", "--verify", "--quiet", r + "^{commit}"]);
    if (got.status === 0 && got.out.trim()) return { ref: r, at: got.out.trim() };
  }
  return null;
}

/** Every file under a folder, relative and with forward slashes, the manifest and the shell's slices excepted. */
function walk(dir, base, out) {
  base = base || dir; out = out || [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir).sort()) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, base, out);
    else {
      const rel = path.relative(base, p).split(path.sep).join("/");
      if (rel !== MANIFEST && rel !== SHELL_SLICES && rel !== INSTALLER_HOOKS) out.push(rel);
    }
  }
  return out;
}

function check(argv, opts) {
  const arg = (name, dflt) => {
    const i = argv.indexOf(name);
    return i > -1 && argv[i + 1] != null ? argv[i + 1] : dflt;
  };
  const pinFile = path.resolve(arg("--pin-file", path.join(ROOT, "tools", "engine-pin")));
  const listFile = path.resolve(arg("--list", path.join(ROOT, "tools", "engine-modules.txt")));
  const out = path.resolve((opts && opts.out) || arg("--out", path.join(ROOT, "engine", "pinned")));
  let pin = opts && opts.pin;
  let max = opts && opts.max != null ? opts.max : null;
  let waiver = opts && opts.waiver !== undefined ? opts.waiver : undefined;
  if (!pin || max == null || waiver === undefined) {
    const parsed = readPin(pinFile);
    if (!pin) pin = parsed.pin;
    if (max == null) max = parsed.max;
    if (waiver === undefined) waiver = parsed.waiver;
  }
  const now = (opts && opts.now) || new Date();
  const waived = !!(waiver && now <= waiver.until);
  const isRelease = (opts && opts.profile !== undefined ? opts.profile : process.env.ETIUDA_PROFILE) === "release";
  const specs = readList(listFile);
  const repo = (opts && opts.repo) ? { dir: opts.repo, how: "throwaway repository" } : engineRepo({ repo: arg("--repo", null) });
  const problems = [], notes = [], warnings = [];

  if (!hasCommit(repo.dir, pin))
    return { problems: ["history: the engine repository at " + repo.dir + " has no commit " + pin],
             warnings, notes, pin, repo };

  /* ---- lag and history, both against the engine's own main ---- */
  const head = mainRef(repo.dir, (opts && opts.ref) || arg("--ref", null));
  if (!head) {
    problems.push("history: no main to measure against in " + repo.dir
      + " (tried " + REFS.join(", ") + ")");
  } else {
    const anc = gitText(repo.dir, ["merge-base", "--is-ancestor", pin, head.at]);
    if (anc.status !== 0) {
      problems.push("history: " + pin.slice(0, 7) + " is not an ancestor of " + head.ref
        + " (" + head.at.slice(0, 7) + "); the pin names a commit that is not on the engine's line");
    } else {
      const n = gitText(repo.dir, ["rev-list", "--count", "--first-parent", pin + ".." + head.at]);
      const behind = Number(n.out.trim());
      if (!Number.isInteger(behind))
        problems.push("lag: could not count commits between the pin and " + head.ref + ": " + n.err);
      else {
        const advice = "; bump ENGINE_PIN and refetch, or raise DRIFT_MAX_COMMITS in "
          + path.relative(ROOT, pinFile).split(path.sep).join("/")
          + " deliberately (a line in that file, not an environment variable)";
        const releaseCeiling = waived ? Math.max(RELEASE_MAX_COMMITS, waiver.n) : RELEASE_MAX_COMMITS;
        if (isRelease && behind > releaseCeiling) {
          problems.push("lag: the pin is " + behind + " commits behind " + head.ref
            + " (" + head.at.slice(0, 7) + "), ceiling " + max
            + (waiver && !waived ? " (the waiver of " + waiver.n + " ended " + waiver.untilText + ")" : "")
            + advice);
        } else if (isRelease && behind > RELEASE_MAX_COMMITS) {
          warnings.push("lag: waived (" + waiver.n + ", until " + waiver.untilText + ", reason " + waiver.reason
            + "): the pin is " + behind + " commits behind " + head.ref + " (" + head.at.slice(0, 7) + "), ceiling " + max);
        } else if (behind > max) {
          warnings.push("lag: the pin is " + behind + " commits behind " + head.ref
            + " (" + head.at.slice(0, 7) + "), ceiling " + max
            + advice);
        } else {
          notes.push("the pin is " + behind + " commit(s) behind " + head.ref + " ("
            + head.at.slice(0, 7) + "), ceiling " + max);
        }
      }
    }
  }

  const skipBytesAndCopies = !!(opts && opts.skipBytesAndCopies);
  const skipEsbuild = !!(opts && (opts.skipEsbuild !== undefined ? opts.skipEsbuild : skipBytesAndCopies));

  if (!skipBytesAndCopies) {
  /* ---- bytes: the folder against the pin's tree, both ways ---- */
  if (!fs.existsSync(out)) {
    problems.push("bytes: nothing at " + out + "; run node tools/engine-fetch.mjs");
  } else {
    const { entries, buildNeeded } = resolveSpecs(repo.dir, pin, specs);
    const want = new Map(entries);
    const builtFiles = new Map();
    if (buildNeeded.length > 0) {
      try {
        for (const [rel, buf] of buildFromPin(repo.dir, pin, buildNeeded)) {
          if (!want.has(rel)) builtFiles.set(rel, buf);
        }
      } catch (e) {
        problems.push("bytes: " + (e && e.message ? e.message : String(e)));
      }
    }
    const have = walk(out);
    const haveSet = new Set(have);
    let same = 0;
    for (const [file, sha] of want) {
      if (!haveSet.has(file)) { problems.push("bytes: " + file + " is missing from " + out); continue; }
      const onDisk = fs.readFileSync(path.join(out, file));
      const inTree = blob(repo.dir, sha);
      if (Buffer.compare(onDisk, inTree) !== 0)
        problems.push("bytes: " + file + " differs from the pin's tree ("
          + onDisk.length + " bytes on disk, " + inTree.length + " in " + pin.slice(0, 7) + ")");
      else same++;
    }
    let sameBuilt = 0;
    for (const [file, builtBuf] of builtFiles) {
      if (!haveSet.has(file)) { problems.push("bytes: " + file + " is missing from " + out); continue; }
      const onDisk = fs.readFileSync(path.join(out, file));
      if (Buffer.compare(onDisk, builtBuf) !== 0) { /* plant:drift-built-bytes */
        problems.push("bytes: " + file + " differs from the pin's build ("
          + onDisk.length + " bytes on disk, " + builtBuf.length + " built from " + pin.slice(0, 7) + ")");
      } else sameBuilt++;
    }
    for (const file of have)
      if (!want.has(file) && !builtFiles.has(file)) problems.push("bytes: " + file + " is in " + out
        + " and is not in the pin's tree under any listed path");
    const shellSha = want.get("shell/main.js");
    if (shellSha) {
      const at = path.join(out, SHELL_SLICES);
      let cut = "";
      try { cut = shellSlicesFrom(blob(repo.dir, shellSha).toString("utf8"), pin); }
      catch (e) { problems.push("bytes: the pin's shell/main.js cannot be cut into " + SHELL_SLICES + ": " + e.message); }
      if (cut && !fs.existsSync(at)) problems.push("bytes: " + SHELL_SLICES + " is missing from " + out);
      else if (cut && fs.readFileSync(at, "utf8") !== cut)
        problems.push("bytes: " + SHELL_SLICES + " is not what the pin's shell/main.js cuts into; run node tools/engine-fetch.mjs");
      else if (cut) notes.push(SHELL_SLICES + " is what the pin's shell/main.js cuts into, " + cut.length + " characters");
    }
    const instSha = want.get("shell/installer.nsh");
    if (instSha) {
      const atHooks = path.join(out, INSTALLER_HOOKS);
      let hooks = "";
      try { hooks = installerHooksFrom(blob(repo.dir, instSha).toString("utf8"), pin); }
      catch (e) { problems.push("bytes: the pin's shell/installer.nsh cannot be cut into " + INSTALLER_HOOKS + ": " + e.message); }
      if (hooks && !fs.existsSync(atHooks)) problems.push("bytes: " + INSTALLER_HOOKS + " is missing from " + out);
      else if (hooks && fs.readFileSync(atHooks, "utf8") !== hooks)
        problems.push("bytes: " + INSTALLER_HOOKS + " is not what the pin's shell/installer.nsh cuts into; run node tools/engine-fetch.mjs");
      else if (hooks) notes.push(INSTALLER_HOOKS + " is the five hooks cut from the pin's shell/installer.nsh, " + hooks.length + " characters");
    }
    notes.push(same + " of " + want.size + " listed file(s) byte for byte equal to the pin's tree"
      + (builtFiles.size ? ", " + sameBuilt + " of " + builtFiles.size + " built file(s) equal to the pin's build" : "")
      + ", compared with git cat-file blob, " + have.length + " file(s) found on disk");

    /* The folder says which pin it was fetched at. A stale folder that happens to match is
       still worth naming, because the next fetch would change it under a green gate. */
    const mf = path.join(out, MANIFEST);
    if (!fs.existsSync(mf)) problems.push("bytes: no " + MANIFEST + " in " + out
      + "; the folder was not written by tools/engine-fetch.mjs");
    else {
      let said = null;
      try { said = JSON.parse(fs.readFileSync(mf, "utf8")).pin; } catch (e) { /* named below */ }
      if (said !== pin) problems.push("bytes: " + MANIFEST + " says the folder was fetched at "
        + String(said).slice(0, 7) + ", and the pin is " + pin.slice(0, 7));
    }
  }
  /* ---- copies: the engine's files Studio keeps by hand, against the pin's blob ---- */
  for (const [ours, theirs] of COPIES) {
    const sha = gitText(repo.dir, ["rev-parse", "--verify", "--quiet", pin + ":" + theirs]).out.trim();
    const here = path.join(ROOT, ours);
    if (!/^[0-9a-f]{40}$/.test(sha)) { problems.push("copies: the pin's tree has no " + theirs + " to hold " + ours + " to"); continue; }
    if (!fs.existsSync(here)) { problems.push("copies: " + ours + " is missing"); continue; }
    const mine = fs.readFileSync(here), pinned = blob(repo.dir, sha);
    if (Buffer.compare(mine, pinned) !== 0)
      problems.push("copies: " + ours + " differs from the pin's " + theirs + " (" + mine.length + " bytes here, "
        + pinned.length + " in " + pin.slice(0, 7) + "); copy the pin's blob over it");
    else notes.push(ours + " is the pin's " + theirs + " byte for byte, " + mine.length + " bytes");
  }
  }

  /* ---- esbuild: Studio's installed esbuild against the pin's package-lock.json ---- */
  if (!skipEsbuild) {
    const studioRoot = (opts && opts.studioRoot) || ROOT;
    const studioEsbuild = studioEsbuildVersion(studioRoot);
    const pinEsbuild = pinEsbuildVersion(repo.dir, pin);
    if (!studioEsbuild || !pinEsbuild || studioEsbuild !== pinEsbuild) { /* plant:drift-esbuild */
      problems.push("esbuild: Studio has " + (studioEsbuild || "(not installed)")
        + ", the pin's package-lock.json names " + (pinEsbuild || "(missing)"));
    } else {
      notes.push("esbuild " + studioEsbuild + " matches the pin's package-lock.json");
    }
  }
  return { problems, warnings, notes, pin, repo };
}

/* THE ENGINE'S FILES STUDIO KEEPS A COPY OF, as [here, in the engine]. Not fetched, because what
   engine-modules.txt fetches ships inside the installer, and these are the repository's own tools.
   The confidentiality scan (board 858, H2) went twelve days without the engine's board 767 repair,
   which made its summary line name a public copy as a held-back catalog: a guard reporting the
   wrong thing it checked. A pin move past an engine change to one of these makes this arm red,
   which is the point. The hook git runs is the copy in .git/hooks, installed by hand from here. */
const COPIES = [["tools/pre-commit", "tools/pre-commit"]];

function main(argv) {
  const r = check(argv);
  process.stdout.write("drift: pin " + r.pin.slice(0, 7) + " against the " + r.repo.how + "\n");
  r.notes.forEach(n => process.stdout.write("  " + n + "\n"));
  if (r.warnings) r.warnings.forEach(w => process.stdout.write("  WARN " + w + "\n"));
  r.problems.forEach(p => process.stderr.write("  FAIL " + p + "\n"));
  process.stdout.write("drift: " + r.problems.length + " problem(s)\n");
  if (r.problems.length > 0) process.exit(1);
  if (argv.length === 0) {
    const ok = controls();
    process.exit(ok ? 0 : 1);
  }
}

let asserted = 0, failed = 0;
function checkLeg(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}

function makeThrowawayRepo(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  const runGit = (args) => {
    const r = gitText(dir, args);
    if (r.status !== 0) throw new Error("git " + args.join(" ") + " failed: " + r.err);
    return r.out.trim();
  };

  runGit(["init", "-b", "main"]);
  runGit(["config", "user.name", "Antigravity"]);
  runGit(["config", "user.email", "drift-tests@example.com"]);
  runGit(["config", "commit.gpgsign", "false"]);

  runGit(["commit", "--allow-empty", "-m", "pin C0"]);
  const pinC0 = runGit(["rev-parse", "HEAD"]);

  runGit(["checkout", "-b", "side"]);
  for (let i = 1; i <= 5; i++) runGit(["commit", "--allow-empty", "-m", "side " + i]);

  runGit(["checkout", "main"]);
  runGit(["commit", "--allow-empty", "-m", "main 1"]);
  runGit(["merge", "--no-ff", "--no-edit", "-m", "merge side", "side"]);
  const mergeSha = runGit(["rev-parse", "HEAD"]);

  for (let i = 2; i <= 9; i++) runGit(["commit", "--allow-empty", "-m", "main " + i]);
  const head10 = runGit(["rev-parse", "HEAD"]);

  for (let i = 10; i <= 24; i++) runGit(["commit", "--allow-empty", "-m", "main " + i]);
  const head25 = runGit(["rev-parse", "HEAD"]);

  runGit(["checkout", "--orphan", "rewritten"]);
  runGit(["commit", "--allow-empty", "-m", "rewritten pin"]);
  const rewrittenPin = runGit(["rev-parse", "HEAD"]);

  runGit(["checkout", "main"]);

  return { dir, pinC0, mergeSha, head10, head25, rewrittenPin };
}

function controls() {
  asserted = 0;
  failed = 0;

  const scratchRepo = path.join(ROOT, "scratch", "drift-controls.git");
  const fixture = makeThrowawayRepo(scratchRepo);
  const repoDir = fixture.dir;

  /* Leg df1: lag under the release threshold warns in both modes.
   * With pinC0 10 commits behind head10 (ceiling 5), lag exceeds ceiling (10 > 5)
   * but is under the release threshold (10 <= 20).
   * Both merge and release profiles warn and pass (0 problems, 1 warning). */
  const rMerge10 = check([], { waiver: null, repo: repoDir, pin: fixture.pinC0, ref: fixture.head10, max: 5, profile: "merge", skipBytesAndCopies: true });
  const rRel10 = check([], { waiver: null, repo: repoDir, pin: fixture.pinC0, ref: fixture.head10, max: 5, profile: "release", skipBytesAndCopies: true });
  const df1Ok = rMerge10 && rMerge10.problems && rMerge10.problems.length === 0
    && rMerge10.warnings && rMerge10.warnings.length === 1 && rMerge10.warnings[0].startsWith("lag:")
    && rRel10 && rRel10.problems && rRel10.problems.length === 0
    && rRel10.warnings && rRel10.warnings.length === 1 && rRel10.warnings[0].startsWith("lag:");
  checkLeg(df1Ok, "df1 lag under the release threshold warns in both modes: "
    + (df1Ok ? rMerge10.warnings[0] : "did not warn in both modes"));

  /* Leg df2: lag over 20 warns at merge and is red with ETIUDA_PROFILE=release.
   * With pinC0 25 commits behind head25 (ceiling 20), lag exceeds ceiling and 20.
   * Merge profile warns and passes (0 problems, 1 warning).
   * Release profile fails with 1 lag problem. */
  const rMerge25 = check([], { waiver: null, repo: repoDir, pin: fixture.pinC0, ref: fixture.head25, max: 20, profile: "merge", skipBytesAndCopies: true });
  const rRel25 = check([], { waiver: null, repo: repoDir, pin: fixture.pinC0, ref: fixture.head25, max: 20, profile: "release", skipBytesAndCopies: true });
  const df2Ok = rMerge25 && rMerge25.problems && rMerge25.problems.length === 0
    && rMerge25.warnings && rMerge25.warnings.length === 1 && rMerge25.warnings[0].startsWith("lag:")
    && rRel25 && rRel25.problems && rRel25.problems.length === 1 && rRel25.problems[0].startsWith("lag:");
  checkLeg(df2Ok, "df2 lag over 20 warns at merge and is red with ETIUDA_PROFILE=release: "
    + (df2Ok ? "merge warns; release red (" + rRel25.problems[0] + ")"
             : "failed: merge=" + (rMerge25 ? rMerge25.problems.length : "err") + ", release=" + (rRel25 ? rRel25.problems.length : "err")));

  /* Leg df2w: a waiver ends by itself. Within its date the release gate allows its count and says it waived;
   * past its date the same waiver is ignored and 20 holds. */
  const waiverOf = (until) => ({ n: 25, until: new Date(until), untilText: until, reason: "a control" });
  const rIn = check([], { waiver: null, repo: repoDir, pin: fixture.pinC0, ref: fixture.head25, max: 20, profile: "release", skipBytesAndCopies: true,
    waiver: waiverOf("2026-11-04T23:59"), now: new Date("2026-11-04T12:00") });
  const rOut = check([], { waiver: null, repo: repoDir, pin: fixture.pinC0, ref: fixture.head25, max: 20, profile: "release", skipBytesAndCopies: true,
    waiver: waiverOf("2026-11-04T23:59"), now: new Date("2026-11-05T00:01") });
  const df2wOk = rIn && rIn.problems.length === 0 && rIn.warnings.length === 1 && rIn.warnings[0].startsWith("lag: waived (25, until 2026-11-04T23:59")
    && rOut && rOut.problems.length === 1 && rOut.problems[0].startsWith("lag:") && rOut.problems[0].indexOf("ended 2026-11-04T23:59") > 0;
  checkLeg(df2wOk, "df2w a waiver of 25 lets the release gate pass 25 behind within its date and says waived, and past it 20 holds: "
    + (df2wOk ? "within: " + rIn.warnings[0].slice(0, 60) + "; past: red" : "failed: within " + (rIn ? rIn.problems.length + "/" + rIn.warnings.length : "err")
      + ", past " + (rOut ? rOut.problems.length : "err")));

  /* Leg df3: unfetched and rewritten pins are red in both modes.
   * Both an unfetched commit (no commit in repo) and a rewritten history (pin not an
   * ancestor of main) must be refused by the history arm in both modes. */
  const rUnfMerge = check([], { waiver: null, repo: repoDir, pin: "0000000000000000000000000000000000000000", ref: "main", profile: "merge", skipBytesAndCopies: true });
  const rUnfRel = check([], { waiver: null, repo: repoDir, pin: "0000000000000000000000000000000000000000", ref: "main", profile: "release", skipBytesAndCopies: true });
  const unfetchedOk = rUnfMerge && rUnfMerge.problems.some(p => p.startsWith("history:") && p.includes("no commit"))
    && rUnfRel && rUnfRel.problems.some(p => p.startsWith("history:") && p.includes("no commit"));

  const rRewMerge = check([], { waiver: null, repo: repoDir, pin: fixture.rewrittenPin, ref: "main", profile: "merge", skipBytesAndCopies: true });
  const rRewRel = check([], { waiver: null, repo: repoDir, pin: fixture.rewrittenPin, ref: "main", profile: "release", skipBytesAndCopies: true });
  const rewrittenOk = rRewMerge && rRewMerge.problems.some(p => p.startsWith("history:") && p.includes("not an ancestor"))
    && rRewRel && rRewRel.problems.some(p => p.startsWith("history:") && p.includes("not an ancestor"));

  const df3Ok = unfetchedOk && rewrittenOk;
  checkLeg(df3Ok, "df3 unfetched and rewritten pins are red in both modes: unfetched ("
    + (unfetchedOk ? "refused: no commit" : "not refused") + "); rewritten ("
    + (rewrittenOk ? "refused: not an ancestor" : "not refused") + ")");

  /* Leg df4: a merged side branch counts its merge once, not its branch commits.
   * From pinC0 to mergeSha, there is 1 main commit and 1 merge commit merging a 5-commit branch.
   * Along main's first-parent line, lag is 2 commits, so with ceiling 1 it reports 2 commits. */
  const rMergeCount = check([], { waiver: null, repo: repoDir, pin: fixture.pinC0, ref: fixture.mergeSha, max: 1, profile: "merge", skipBytesAndCopies: true });
  const df4Ok = rMergeCount && rMergeCount.warnings && rMergeCount.warnings.length === 1 && rMergeCount.warnings[0].includes("the pin is 2 commits behind");
  checkLeg(df4Ok, "df4 a merged side branch counts its merge once, not its branch commits: "
    + (df4Ok ? rMergeCount.warnings[0] : (rMergeCount ? (rMergeCount.warnings[0] || rMergeCount.problems[0] || "no lag") : "err")));

  /* Leg df5: Studio's installed esbuild must match the pin's package-lock.json. */
  gitText(repoDir, ["checkout", "-b", "esbuild-check"]);
  fs.writeFileSync(path.join(repoDir, "package-lock.json"),
    JSON.stringify({ lockfileVersion: 3, packages: { "node_modules/esbuild": { version: "0.28.2" } } }, null, 2) + "\n", "utf8");
  gitText(repoDir, ["add", "package-lock.json"]);
  gitText(repoDir, ["commit", "-m", "lockfile esbuild 0.28.2"]);
  const esbPin = gitText(repoDir, ["rev-parse", "HEAD"]).out.trim();
  const studioSame = path.join(ROOT, "scratch", "drift-esbuild-same");
  const studioMismatch = path.join(ROOT, "scratch", "drift-esbuild-mismatch");
  const studioMissing = path.join(ROOT, "scratch", "drift-esbuild-missing");
  fs.rmSync(studioSame, { recursive: true, force: true });
  fs.rmSync(studioMismatch, { recursive: true, force: true });
  fs.rmSync(studioMissing, { recursive: true, force: true });
  fs.mkdirSync(path.join(studioSame, "node_modules", "esbuild"), { recursive: true });
  fs.writeFileSync(path.join(studioSame, "node_modules", "esbuild", "package.json"), JSON.stringify({ version: "0.28.2" }), "utf8");
  fs.mkdirSync(path.join(studioMismatch, "node_modules", "esbuild"), { recursive: true });
  fs.writeFileSync(path.join(studioMismatch, "node_modules", "esbuild", "package.json"), JSON.stringify({ version: "0.28.1" }), "utf8");
  fs.mkdirSync(studioMissing, { recursive: true });
  const rEsbSame = check([], { waiver: null, repo: repoDir, pin: esbPin, ref: esbPin, studioRoot: studioSame, skipBytesAndCopies: true, skipEsbuild: false });
  const rEsbBad = check([], { waiver: null, repo: repoDir, pin: esbPin, ref: esbPin, studioRoot: studioMismatch, skipBytesAndCopies: true, skipEsbuild: false });
  const rEsbMiss = check([], { waiver: null, repo: repoDir, pin: esbPin, ref: esbPin, studioRoot: studioMissing, skipBytesAndCopies: true, skipEsbuild: false });
  const df5Ok = rEsbSame.problems.length === 0
    && rEsbBad.problems.some(p => p.startsWith("esbuild:") && p.includes("0.28.1") && p.includes("0.28.2"))
    && rEsbMiss.problems.some(p => p.startsWith("esbuild:") && p.includes("0.28.2"));
  checkLeg(df5Ok, "df5 esbuild version match passes and mismatch or missing goes red naming both: "
    + (df5Ok ? rEsbBad.problems[0] : JSON.stringify({ same: rEsbSame.problems, bad: rEsbBad.problems, miss: rEsbMiss.problems })));

  process.stdout.write("#counts checks=" + asserted + " failures=" + failed + "\n");
  process.stdout.write("drift " + (failed ? "FAILED " + failed + " of " : "passed ") + asserted + " check(s)\n");
  return failed === 0;
}

export { check, walk, mainRef, controls };

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try { main(process.argv.slice(2)); }
  catch (e) {
    if (e instanceof Refusal) { process.stderr.write("drift: " + e.message + "\n"); process.exit(e.code); }
    throw e;
  }
}
