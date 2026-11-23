/* THE TREE, PUBLISHED WITHOUT ITS HISTORY. This repository keeps its history to itself; a public repository receives one
 * commit per published tree, each the child of the last, so what is public is a chain of trees and never this repository's
 * commits, messages or branches.
 *
 *     node tools/publish-tree.mjs <commit> <hosted-test|main> [--clone <dir>] [--push]
 *
 * IN ORDER, and each step refuses before the next:
 *   1. the commit's tree is exported with git archive (files only, no history) into a fresh scratch folder, and the export is
 *      shown to be that tree: its files, read into an index that starts from the commit's tree, write the same tree id;
 *  1b. every exported file, its name and its bytes, is read for a path that leads off the tree onto the machine that made it
 *      or into the office's private record (officePathHits below). A hit refuses, printed as file:line and the rule's name,
 *      never the text. It runs before the scan because it needs nothing the scan needs, so a tree with no name list meets it;
 *   2. the tree is scanned by the content scan the commit hooks run, tools/pre-commit --tree, the file the hooks are installed
 *      from, run in a detached worktree of this repository at the commit so that it reads the tree and the repository's own
 *      name list (git's common directory, which no clone carries). A hit refuses, and the scan prints a place, never the text.
 *      The scan must also say it read the quote half against a held-back catalog and judged addresses: a scan that ran its name
 *      half alone, or judged no addresses and identifiers, is not enough to publish on, and is refused;
 *   3. the public repository's URL is the one line of .publish-remote in the commit's tree, its only home. It refuses while
 *      that line is the placeholder, when it names this repository's own origin or the private destination tools/pre-push
 *      allows, and when the clone below would push anywhere else;
 *   4. the export is committed in a local clone of the public repository (bare, under ETIUDA_RUNS, never inside this one), as
 *      the child of the clone's current branch tip, message "tree of <sha8>", and the commit's tree id must be the commit's own.
 * With --push, and only then:
 *   5. the clone's branch is pushed, never forced, to refs/heads/hosted-test-<sha8> (hosted-test) or main (main), with
 *      ETIUDA_PUSH set to today's date for that one push; for main the public main must be an ancestor of what is pushed.
 *      THE FIRST TREE LANDS ON MAIN, whatever the purpose: while the public repository has no main, a dispatch finds no
 *      workflow (GitHub reads workflow_dispatch from the default branch), so the push goes to main;
 *   6. .github/workflows/hosted-area.yml is dispatched on the public repository for the pushed branch, carrying the full sha.
 * With --push the hook git runs (.git/hooks/pre-commit) must be tools/pre-commit byte for byte, so the scan that judged the tree
 * is the scan that judges every commit.
 *
 * Exit: 0 done, 1 refused, 2 usage. Scratch goes in a fresh folder under ETIUDA_RUNS/publish-tree and is removed at the end.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
export const REMOTE_FILE = ".publish-remote";
export const PLACEHOLDER = "PLACEHOLDER";
export const WORKFLOW = "hosted-area.yml";

const git = (cwd, args, opts = {}) => spawnSync("git", args, Object.assign({ cwd, encoding: "utf8", maxBuffer: 1 << 30 }, opts));
const out = (cwd, args, opts) => { const r = git(cwd, args, opts); return r.status === 0 ? String(r.stdout).trim() : null; };

/* The comparison tools/pre-push makes: host and path, no scheme, no credentials, no trailing .git, any case. */
export function norm(url) {
  return String(url || "").trim()
    .replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, "").replace(/^[^@/]*@/, "").replace(/^([^/:]*):/, "$1/")
    .replace(/\\/g, "/").replace(/\/*$/, "").replace(/\.git$/, "").toLowerCase();
}

/* The first line that is not a comment. */
export function remoteLine(text) {
  for (const l of String(text || "").split(/\r?\n/)) {
    const t = l.replace(/#.*/, "").trim();
    if (t) return t;
  }
  return "";
}

/* Step 3's three refusals, as a function of the line, the private remotes and the clone's remote, so a leg can hold it. */
export function remoteRefusal(line, privates, cloneUrl) {
  if (!line) return REMOTE_FILE + " names no remote";
  if (line === PLACEHOLDER || line.startsWith(PLACEHOLDER)) return REMOTE_FILE + " still holds the placeholder: the public repository is not named yet";
  for (const p of privates) if (p && norm(p) === norm(line)) return REMOTE_FILE + " names this repository's own private remote (" + p + ")";
  if (cloneUrl !== undefined && norm(cloneUrl) !== norm(line))
    return "the clone pushes to " + (cloneUrl || "<nowhere>") + ", not to the remote " + REMOTE_FILE + " names (" + line + ")";
  return "";
}

/* What the scan's summary must say before a tree is published on it. */
export function scanCovers(summary) {
  const m = /against (\d+) held-back catalog/.exec(summary || "");
  if (!m || Number(m[1]) < 1) return "the scan ran without a held-back catalog (its name half alone), so it cannot clear a tree for publication";
  if (!/addresses and identifiers judged/.test(summary)) return "the scan judged no addresses and identifiers, so it cannot clear a tree for publication";
  return "";
}

/* STEP 1b: PATHS THAT LEAD OFF THE TREE. Three rules, each a regular expression over a file's name and over its bytes read as
 * latin1 (so a binary file is read too, and a byte is a character):
 *   "desk profile"       the profile folder of the user running this tool: the segment Users, a slash or backslash (any
 *                        number, so an escaped string counts), then that user's name as a whole segment, any case; and the
 *                        profile folder the environment names (USERPROFILE, or HOME where there is none), its segments
 *                        joined by any run of slashes or backslashes, any case. Both are built at run time from os.userInfo()
 *                        and the environment, so no user's name is ever written into this file. Another user's profile,
 *                        an invented one in a leg, passes.
 *   "office record"      the office's record: a segment named state, then briefs, reports, memory or queue as the next
 *                        folder, or decisions, board or index as a name alone or with .md (so a module named state/index.js
 *                        passes).
 *   "office repository"  the office repository's folder name, a hyphen or an underscore between its two words (the
 *                        company's web address, one word, passes).
 * Each hit is { file, line, rule }: line 0 is the file's name, otherwise the 1-based line of the match. The matched text is
 * never returned, so nothing that prints a hit can print what was found. */
const SEP = "[\\\\/]+";
const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const OFFICE_RULES = [
  { rule: "office record", re: new RegExp("(?<![A-Za-z0-9_.-])state" + SEP + "(?:(?:briefs|reports|memory|queue)[\\\\/]|(?:decisions|board|index)(?:\\.md(?![A-Za-z0-9_])|(?![A-Za-z0-9_.-])))", "gi") },
  { rule: "office repository", re: new RegExp("(?<![A-Za-z0-9_.-])stardust[-_]core(?![A-Za-z0-9_])", "gi") },
];

export function officePathRules({ user, profile } = {}) {
  const rules = [];
  const name = String(user || "").trim();
  if (name) rules.push({ rule: "desk profile", re: new RegExp("(?<![A-Za-z0-9_.-])users" + SEP + escapeRe(name) + "(?![A-Za-z0-9_.-])", "gi") });
  const segs = String(profile || "").split(/[\\/]+/).filter(Boolean);
  if (segs.length >= 2) rules.push({ rule: "desk profile", re: new RegExp("(?<![A-Za-z0-9_.-])" + segs.map(escapeRe).join(SEP) + "(?![A-Za-z0-9_.-])", "gi") });
  return rules.concat(OFFICE_RULES.map((r) => ({ rule: r.rule, re: new RegExp(r.re.source, r.re.flags) })));
}

/* files: an iterable of [name, bytes or string]. Returns the hits, sorted by file then line, one per file, line and rule. */
export function officePathHits(files, desk = {}) {
  const rules = officePathRules(desk);
  const hits = [], seen = new Set();
  const add = (file, line, rule) => { const k = file + "\0" + line + "\0" + rule; if (!seen.has(k)) { seen.add(k); hits.push({ file, line, rule }); } };
  for (const [file, body] of files) {
    const text = Buffer.isBuffer(body) ? body.toString("latin1") : String(body);
    for (const { rule, re } of rules) {
      re.lastIndex = 0;
      if (re.test(file)) add(file, 0, rule);
      re.lastIndex = 0;
      let m, line = 1, at = 0;
      while ((m = re.exec(text))) {
        for (; at < m.index; at++) if (text.charCodeAt(at) === 10) line++;
        add(file, line, rule);
        if (m[0].length === 0) re.lastIndex++;
      }
    }
  }
  return hits.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : a.line - b.line));
}

/* This machine's user and profile, as step 1b reads them. */
export function thisDesk() {
  let user = "";
  try { user = os.userInfo().username || ""; } catch { user = ""; }
  return { user: user || process.env.USERNAME || process.env.USER || "", profile: process.env.USERPROFILE || process.env.HOME || "" };
}

/* The exported files under dir, as [name with forward slashes, bytes]; a symbolic link is read as its target's name. */
export function* exportedFiles(dir, rel = "") {
  for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const r = rel ? rel + "/" + e.name : e.name, full = path.join(dir, r);
    if (e.isSymbolicLink()) yield [r, Buffer.from(fs.readlinkSync(full), "utf8")];
    else if (e.isDirectory()) yield* exportedFiles(dir, r);
    else if (e.isFile()) yield [r, fs.readFileSync(full)];
  }
}

function refuse(msg) { process.stderr.write("publish-tree: REFUSED: " + msg + "\n"); return 1; }
const say = (m) => process.stdout.write("publish-tree: " + m + "\n");
const inside = (child, parent) => { const r = path.relative(path.resolve(parent), path.resolve(child)); return r === "" || (!r.startsWith("..") && !path.isAbsolute(r)); };

function stamp() { const d = new Date(), p = (n) => String(n).padStart(2, "0"); return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()); }
function today() { const d = new Date(), p = (n) => String(n).padStart(2, "0"); return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }

/* The tree id an index starting from `base` writes once `dir`'s files are read into it, in the repository at `gitDir`, the
   files `modes` names marked executable. It runs in `dir`, so the pathspec is the export and nothing else. */
function treeOfFiles(gitDir, indexFile, base, dir, modes) {
  const env = Object.assign({}, process.env, { GIT_INDEX_FILE: indexFile });
  const g = (args) => git(dir, ["--git-dir=" + gitDir, "--work-tree=" + dir].concat(args), { env });
  const steps = [base ? ["read-tree", base] : ["read-tree", "--empty"], ["add", "-A", "-f", "--", "."]];
  for (const s of steps) { const r = g(s); if (r.status !== 0) return { error: "git " + s[0] + " failed: " + String(r.stderr).trim() }; }
  for (const f of modes) { const r = g(["update-index", "--chmod=+x", "--", f]); if (r.status !== 0) return { error: "could not mark " + f + " executable" }; }
  const w = g(["write-tree"]);
  return w.status === 0 ? { tree: String(w.stdout).trim() } : { error: "git write-tree failed" };
}

export async function main(argv) {
  const args = argv.slice();
  const push = args.includes("--push");
  const ci = args.indexOf("--clone");
  let cloneArg = null;
  if (ci >= 0) { cloneArg = args[ci + 1]; args.splice(ci, 2); }
  const pos = args.filter((a) => a !== "--push");
  const [tipArg, purpose] = pos;
  if (!tipArg || !["hosted-test", "main"].includes(purpose) || pos.length !== 2 || (ci >= 0 && !cloneArg)) {
    process.stderr.write("usage: node tools/publish-tree.mjs <commit> <hosted-test|main> [--clone <dir>] [--push]\n");
    return 2;
  }

  const tip = out(ROOT, ["rev-parse", "--verify", "--quiet", tipArg + "^{commit}"]);
  if (!tip) return refuse(tipArg + " names no commit here");
  const sha8 = tip.slice(0, 8);
  const tipTree = out(ROOT, ["rev-parse", tip + "^{tree}"]);
  const common = path.resolve(ROOT, out(ROOT, ["rev-parse", "--git-common-dir"]));
  const mainTree = path.dirname(common);
  const runs = path.resolve(process.env.ETIUDA_RUNS || path.join(mainTree, "..", "etiuda-runs"));
  const clone = path.resolve(cloneArg || path.join(runs, "publish-tree", "public-clone"));
  if (inside(clone, mainTree) || inside(clone, ROOT)) return refuse("the clone " + clone + " is inside this repository; it must stand apart from it");
  say("commit " + tip + " (tree " + tipTree + "), purpose " + purpose + (push ? ", with --push" : ", no push"));

  const scratch = path.join(runs, "publish-tree", sha8 + "-" + stamp() + "-" + process.pid);
  const exportDir = path.join(scratch, "tree"), wt = path.join(scratch, "scan");
  fs.mkdirSync(exportDir, { recursive: true });
  let wtAdded = false, wtLeft = false;
  try {
    /* 1. The export, and the proof that it is the commit's tree. */
    const ar = git(ROOT, ["archive", "--format=tar", tip], { encoding: "buffer" });
    if (ar.status !== 0) return refuse("git archive failed");
    const tx = spawnSync("tar", ["-xf", "-"], { cwd: exportDir, input: ar.stdout, maxBuffer: 1 << 26 });
    if (tx.status !== 0) return refuse("tar could not unpack the export: " + String(tx.stderr).trim());
    const execs = String(out(ROOT, ["ls-tree", "-r", "--full-tree", tip]) || "").split("\n")
      .filter((l) => l.startsWith("100755 ")).map((l) => l.slice(l.indexOf("\t") + 1));
    const mine = treeOfFiles(out(ROOT, ["rev-parse", "--absolute-git-dir"]), path.join(scratch, "export.index"), tip, exportDir, []);
    if (mine.error) return refuse("the export could not be read back: " + mine.error);
    if (mine.tree !== tipTree) return refuse("the export writes tree " + mine.tree + ", not the commit's " + tipTree);
    say("1. exported with git archive, no history: the files write the commit's tree " + tipTree);

    /* 1b. No path onto this machine's profile or into the office's record. */
    const hits = officePathHits(exportedFiles(exportDir), thisDesk());
    if (hits.length) {
      process.stdout.write(hits.map((h) => "  | " + h.file + ":" + (h.line || "(its name)") + "  " + h.rule + "\n").join(""));
      return refuse(hits.length + " place(s) name this machine's profile or the office's record (above); the tree may not carry them");
    }
    say("1b. no path onto this machine's profile or into the office's record");

    /* 2. The scan, the hooks' own file, over the tree. */
    const guard = path.join(ROOT, "tools", "pre-commit");
    if (!fs.existsSync(guard)) return refuse("no content scan at " + guard);
    const hook = path.join(common, "hooks", "pre-commit");
    const same = fs.existsSync(hook) && Buffer.compare(fs.readFileSync(hook), fs.readFileSync(guard)) === 0;
    say("2. the scan is " + path.relative(ROOT, guard) + "; the installed hook " + (same ? "is it byte for byte" : "is NOT it byte for byte"));
    if (push && !same) return refuse("the hook git runs is not tools/pre-commit, so the scan that judged this tree is not the commit scan; install it first");
    const wa = git(ROOT, ["worktree", "add", "--detach", wt, tip]);
    if (wa.status !== 0) return refuse("git worktree add failed: " + String(wa.stderr).trim());
    wtAdded = true;
    const sc = spawnSync("sh", [guard, "--tree"], { cwd: wt, encoding: "utf8", maxBuffer: 1 << 28 });
    const said = String(sc.stderr || "") + String(sc.stdout || "");
    process.stdout.write(said.split("\n").filter(Boolean).map((l) => "  | " + l + "\n").join(""));
    if (sc.status !== 0) return refuse("the scan found what may not be published (places above), or could not look; exit " + sc.status);
    const lastLine = said.split("\n").filter((l) => /line\(s\) of the tracked tree/.test(l)).pop() || "";
    const short = scanCovers(lastLine);
    if (short) return refuse(short);
    say("2. the scan is clean, quote half and addresses included");

    /* 3. The one remote. */
    const lineText = out(ROOT, ["show", tip + ":" + REMOTE_FILE]);
    if (lineText === null) return refuse("the commit's tree has no " + REMOTE_FILE);
    const line = remoteLine(lineText);
    const privates = [out(ROOT, ["config", "--get", "remote.origin.url"])];
    const allowed = /^ALLOWED='([^']*)'/m.exec(out(ROOT, ["show", tip + ":tools/pre-push"]) || "");
    if (allowed) privates.push(allowed[1]);
    let why = remoteRefusal(line, privates);
    if (why) return refuse(why);
    if (!fs.existsSync(clone)) {
      fs.mkdirSync(path.dirname(clone), { recursive: true });
      const cl = git(path.dirname(clone), ["clone", "--bare", "--quiet", line, clone]);
      if (cl.status !== 0) return refuse("could not clone " + line + ": " + String(cl.stderr).trim());
      say("3. cloned the public repository into " + clone);
    }
    const cg = ["--git-dir=" + clone];
    why = remoteRefusal(line, privates, out(ROOT, cg.concat(["config", "--get", "remote.origin.url"])) || "");
    if (why) return refuse(why);
    say("3. the remote is " + line + ", the one " + REMOTE_FILE + " names, and not this repository's");

    /* 4. The commit, the child of the clone's branch tip. */
    const branch = out(ROOT, cg.concat(["symbolic-ref", "--short", "HEAD"]));
    if (!branch) return refuse("the clone's HEAD names no branch");
    const parent = out(ROOT, cg.concat(["rev-parse", "--verify", "--quiet", "refs/heads/" + branch]));
    const theirs = treeOfFiles(clone, path.join(scratch, "clone.index"), parent, exportDir, execs);
    if (theirs.error) return refuse("the clone could not take the export: " + theirs.error);
    if (theirs.tree !== tipTree) return refuse("the clone writes tree " + theirs.tree + ", not the commit's " + tipTree);
    let made = parent;
    if (parent && out(ROOT, cg.concat(["rev-parse", parent + "^{tree}"])) === tipTree) {
      say("4. the clone's " + branch + " (" + parent.slice(0, 8) + ") already holds this tree; nothing new is committed");
    } else {
      const ct = git(ROOT, cg.concat(["commit-tree", theirs.tree], parent ? ["-p", parent] : [], ["-m", "tree of " + sha8]));
      if (ct.status !== 0) return refuse("git commit-tree failed: " + String(ct.stderr).trim());
      made = String(ct.stdout).trim();
      const ur = git(ROOT, cg.concat(["update-ref", "refs/heads/" + branch, made, parent || "0".repeat(40)]));
      if (ur.status !== 0) return refuse("the clone's " + branch + " moved while this ran");
      say("4. committed " + made + " \"tree of " + sha8 + "\" on the clone's " + branch + ", parent " + (parent || "none (the first tree)"));
    }
    if (!push) { say("no --push: stopped after the commit in the clone"); return 0; }

    /* 5. The push, never forced. */
    const ls = out(ROOT, cg.concat(["ls-remote", "origin", "refs/heads/main"]));
    if (ls === null) return refuse("could not read the public main");
    const at = ls.split(/\s+/)[0];
    const target = purpose === "main" || !at ? "main" : "hosted-test-" + sha8;
    if (!at) say("5. the public repository has no main yet, so this first tree lands on main");
    if (target === "main") {
      if (at && (git(ROOT, cg.concat(["cat-file", "-e", at + "^{commit}"])).status !== 0
          || git(ROOT, cg.concat(["merge-base", "--is-ancestor", at, made])).status !== 0))
        return refuse("the public main (" + at.slice(0, 8) + ") is not an ancestor of " + made.slice(0, 8) + "; fetch it, nothing is forced");
    }
    const ps = git(ROOT, cg.concat(["push", "origin", made + ":refs/heads/" + target]),
      { env: Object.assign({}, process.env, { ETIUDA_PUSH: today() }), stdio: ["ignore", "pipe", "pipe"] });
    if (ps.status !== 0) return refuse("the push failed: " + String(ps.stderr).trim());
    say("5. pushed " + made.slice(0, 8) + " to " + target);

    /* 6. The area, dispatched. */
    const gh = /^github\.com\/([^/]+\/[^/]+)$/.exec(norm(line));
    if (!gh) { say("6. " + line + " is not a GitHub repository, so " + WORKFLOW + " is not dispatched"); return 0; }
    const wr = spawnSync("gh", ["workflow", "run", WORKFLOW, "--repo", gh[1], "--ref", target, "-f", "private_sha=" + tip],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    if (wr.status !== 0) return refuse("the dispatch failed: " + String(wr.stderr).trim());
    say("6. dispatched " + WORKFLOW + " on " + gh[1] + " at " + target + " for " + tip);
    return 0;
  } finally {
    if (wtAdded) {
      const rm = git(ROOT, ["worktree", "remove", wt]);
      if (rm.status !== 0) wtLeft = true;
      if (wtLeft) process.stderr.write("publish-tree: the scan worktree " + wt + " was left: " + String(rm.stderr).trim() + "\n");
    }
    if (!wtLeft) fs.rmSync(scratch, { recursive: true, force: true });
  }
}

const invoked = process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === path.resolve(fileURLToPath(import.meta.url)).toLowerCase();
if (invoked) main(process.argv.slice(2)).then((c) => process.exit(c), (e) => { process.stderr.write("publish-tree: " + (e && e.stack || e) + "\n"); process.exit(1); });
