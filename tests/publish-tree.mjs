/* PUBLISH-TREE'S STEP 1b: NO PATH ONTO THE MACHINE THAT MADE THE TREE, NONE INTO THE OFFICE'S RECORD (tools/publish-tree.mjs).
 *
 * gate-kind: node
 *
 *     node tests/publish-tree.mjs
 *
 * The function legs hold officePathHits against an invented machine (user zed), so they read the same on any machine:
 *   pt1  zed's profile refuses: backslashes, forward slashes, any case, an escaped string, a git-bash path
 *   pt2  the profile the environment names refuses even where it is not under Users
 *   pt3  invented profiles of other users pass (ann, m, someone, and zedd, whose name only starts with zed)
 *   pt4  the office's record refuses: briefs, reports, memory and queue as folders; decisions, board and index as files
 *   pt5  plain words pass: state, reports, a module named index under a state folder, state.board, restate, the web address
 *   pt6  the office repository's folder name refuses, hyphen or underscore, in a file's bytes and in its name (line 0)
 *   pt7  each hit is file, line and rule, the line right, and no hit carries the matched text
 *   pt8  a binary file is read too
 *   pt9  this file and the tool pass the rule on this machine's own user and profile
 * The tool itself, in a scratch repository holding a copy of it (no name list, no scan, no clone, no network):
 *   pt10 a planted path onto this machine's profile, and one into the record, refuse at 1b with exit 1, printed as
 *        file:line, the planted text never printed
 *   pt11 the same repository without the plants passes 1b and stops at step 2 for want of a scan
 *
 * Every planted string is put together at run time, so this file's own bytes pass the rule it holds.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as pt from "../tools/publish-tree.mjs";
import { dropScratch } from "./scratch.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOOL = path.join(ROOT, "tools", "publish-tree.mjs");
const hitsOf = typeof pt.officePathHits === "function" ? pt.officePathHits : () => [];
const deskOf = typeof pt.thisDesk === "function" ? pt.thisDesk : () => ({ user: os.userInfo().username, profile: process.env.USERPROFILE || process.env.HOME || "" });

let failed = 0, passed = 0;
function check(ok, label) { if (ok) passed++; else failed++; process.stdout.write((ok ? "ok   " : "FAIL ") + label + "\n"); }

const ZED = { user: "zed", profile: "C:\\Users\\zed" };
const hits = (text, desk = ZED, file = "f.txt") => hitsOf([[file, text]], desk);
const bs = (...p) => p.join("\\"), fw = (...p) => p.join("/");
const REC = "sta" + "te", REPO = "stardust" + "-core";

/* pt1 */
for (const [what, s] of [
  ["backslashes", bs("C:", "Users", "zed", "AppData")],
  ["forward slashes", fw("C:", "Users", "zed", "x")],
  ["any case", bs("c:", "USERS", "ZED") + "\\"],
  ["an escaped string", "\"" + bs("C:", "", "Users", "", "zed") + "\""],
  ["a git-bash path", fw("", "c", "Users", "zed", "Workspace")],
]) check(hits(s).some((h) => h.rule === "desk profile"), "pt1 the desk's profile refuses: " + what);

/* pt2 */
check(hits(fw("D:", "home", "ZED", "x"), { user: "", profile: bs("D:", "Home", "zed") }).some((h) => h.rule === "desk profile"),
  "pt2 the environment's profile refuses outside Users");

/* pt3 */
for (const s of [bs("C:", "Users", "ann", "x"), fw("C:", "Users", "m", "y"), bs("C:", "Users", "someone"), bs("C:", "Users", "zedd", "x")])
  check(hits(s).length === 0, "pt3 an invented profile passes: " + s);

/* pt4 */
for (const s of [fw(REC, "reports", "x.md"), bs(REC, "briefs", "y.md"), fw(REC, "memory", "z.md"), fw(REC, "queue", "q.md"),
  fw(REC, "decisions.md"), "see " + fw(REC, "board.md") + ".", "(" + fw(REC, "index.md") + ")", fw(REC, "decisions")])
  check(hits(s).some((h) => h.rule === "office record"), "pt4 the office's record refuses: " + s.replace(REC, "<record>"));

/* pt5 */
for (const s of [REC, "reports", "the " + REC + " of the reports", fw("ui", REC, "index.js"), REC + ".board", fw("re" + REC, "reports", ""),
  "https://stardust" + "core.com", "a " + REC + " / reports split"])
  check(hits(s).length === 0, "pt5 a plain word passes: " + s.replace(REC, "<record>"));

/* pt6 */
check(hits("../" + REPO + "/x").some((h) => h.rule === "office repository"), "pt6 the office repository's name refuses (hyphen)");
check(hits("stardust" + "_core").some((h) => h.rule === "office repository"), "pt6 the office repository's name refuses (underscore)");
check(hitsOf([[fw("docs", REPO + "-notes.md"), "nothing"]], ZED).some((h) => h.line === 0 && h.rule === "office repository"),
  "pt6 the office repository's name in a file's name refuses, at line 0");

/* pt7 */
{
  const text = ["one", "two " + bs("C:", "Users", "zed", "secretmark"), "three", "four " + fw(REC, "reports", "secretmark2.md"), "five " + REPO].join("\n");
  const h = hitsOf([["a.txt", text]], ZED);
  const lines = h.map((x) => x.line + ":" + x.rule).join(",");
  check(lines === "2:desk profile,4:office record,5:office repository", "pt7 file, line and rule, lines right: " + lines);
  check(h.every((x) => Object.keys(x).sort().join() === "file,line,rule"), "pt7 a hit has exactly file, line and rule");
  const flat = JSON.stringify(h);
  check(!/secretmark|zed|reports|stardust/i.test(flat), "pt7 no hit carries the matched text");
}

/* pt8 */
check(hitsOf([["b.bin", Buffer.concat([Buffer.from([0, 255, 0, 10]), Buffer.from(bs("C:", "Users", "zed", "x"), "latin1"), Buffer.from([0])])]], ZED)
  .some((h) => h.line === 2 && h.rule === "desk profile"), "pt8 a binary file is read too");

/* pt9 */
{
  const desk = deskOf();
  const own = [["tests/publish-tree.mjs", fs.readFileSync(fileURLToPath(import.meta.url))], ["tools/publish-tree.mjs", fs.readFileSync(TOOL)]];
  const h = hitsOf(own, desk);
  check(typeof pt.officePathHits === "function" && h.length === 0,
    "pt9 this file and the tool pass on this machine's own user and profile" + (h.length ? ": " + h.map((x) => x.file + ":" + x.line).join(", ") : ""));
}

/* pt10, pt11: the tool in a scratch repository. */
{
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "publish-tree-leg-"));
  try {
    const repo = path.join(scratch, "repo"), hooks = path.join(scratch, "no-hooks");
    fs.mkdirSync(path.join(repo, "tools"), { recursive: true });
    fs.mkdirSync(path.join(repo, "docs"), { recursive: true });
    fs.mkdirSync(hooks);
    fs.copyFileSync(TOOL, path.join(repo, "tools", "publish-tree.mjs"));
    fs.writeFileSync(path.join(repo, "docs", "clean.txt"), "nothing here\n");
    const g = (...a) => spawnSync("git", ["-c", "user.name=leg", "-c", "user.email=leg@example.invalid", "-c", "core.hooksPath=" + hooks,
      "-c", "commit.gpgsign=false", ...a], { cwd: repo, encoding: "utf8" });
    g("init", "-q", "-b", "main");
    g("add", "-A"); g("commit", "-q", "-m", "clean");
    const clean = g("rev-parse", "HEAD").stdout.trim();
    const desk = deskOf();
    const deskPath = (desk.user ? bs("C:", "Users", desk.user) : desk.profile) + "\\plantmarker";
    fs.writeFileSync(path.join(repo, "docs", "note.txt"), "a\nb\nsee " + deskPath + " here\n");
    fs.writeFileSync(path.join(repo, "docs", "rec.txt"), "1\n2\n3\n4\n" + fw("x", REC, "queue", "plantmarker2.md") + "\n");
    g("add", "-A"); g("commit", "-q", "-m", "planted");
    const planted = g("rev-parse", "HEAD").stdout.trim();
    const run = (sha) => {
      const r = spawnSync(process.execPath, [path.join(repo, "tools", "publish-tree.mjs"), sha, "hosted-test", "--clone", path.join(scratch, "clone")],
        { cwd: repo, encoding: "utf8", env: Object.assign({}, process.env, { ETIUDA_RUNS: path.join(scratch, "runs") }) });
      return { status: r.status, said: String(r.stdout) + String(r.stderr) };
    };
    const p = run(planted);
    check(p.status === 1 && /docs\/note\.txt:3 +desk profile/.test(p.said) && /docs\/rec\.txt:5 +office record/.test(p.said) && /REFUSED: 2 place\(s\)/.test(p.said),
      "pt10 the planted tree refuses at 1b with exit 1, file:line and rule (exit " + p.status + ")");
    check(!/plantmarker/.test(p.said), "pt10 the planted text is never printed");
    const c = run(clean);
    check(c.status === 1 && /1b\. no path/.test(c.said) && /no content scan/.test(c.said), "pt11 the clean tree passes 1b and stops at step 2 (exit " + c.status + ")");
  } finally { dropScratch(scratch, "publish-tree"); }
}

process.stdout.write("publish-tree: " + passed + " passed, " + failed + " failed\n");
process.exit(failed ? 1 : 0);
