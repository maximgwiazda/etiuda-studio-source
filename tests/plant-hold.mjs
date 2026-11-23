/* PLANT HOLD. The chain runs this first, and the same file again last.
 *
 *     node tests/plant-hold.mjs
 *     node tests/plant-hold.mjs --guard
 *     node tests/plant-hold.mjs --record
 *     node tests/plant-hold.mjs --compare
 *
 * A mark under .plant-hold/ names a planted file, the sha256 it had, and a backup copy.
 * Write the mark before the first byte changes. Remove it only once the sha256 is back.
 * While any mark remains, this file exits 1 and the pre-commit hook exits 1, and both
 * print how to restore. --guard does only that, and nothing else.
 * Also guards tracked files: with no hold mark, a tracked file holding fewer plant:<tag> markers
 * than its blob at HEAD is refused (--guard).
 *
 * The first run writes scratch/plant-chain/record.json, the sha256 of every tracked
 * file, and a one-time id. The same id is written to scratch/plant-chain/open, the
 * ticket. Both paths are gitignored, and neither is a tracked path. --compare spends
 * that ticket and names each tracked file whose sha256 changed. A ticket already
 * spent, or no ticket from this hold, is stale: the stored hashes are not read, so
 * they neither pass this run nor name a file. The next run writes its own id first.
 * The parent process is not the link, so each command may be its own process.
 *
 * pk0  a mark makes the hook and the guard refuse, and both go quiet once it is gone.
 *      The hook is proved in its own temp repository, so a tree with no git history holds.
 * pk0d endHold leaves the mark while the bytes differ.
 * pk1  a child on the relay end-to-end planting path is killed inside the window.
 *      An in-place plant fails the leg. A plant in a scratch copy passes it.
 * pk2  an in-place write between record and compare is named with both sha256.
 * pk3  a plants copy made by a child that is then killed is dropped by the next run.
 *      A copy whose owner is still running is left. A copy with no owner file is left and named.
 *
 * Node only. It does not launch the program.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { jsLiterals } from "./js-literals.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WATCH = ["src/relay.mjs", "src/invite.mjs", "src/studio.mjs"];
const SKIP = new Set(["node_modules", ".git", "scratch", ".plant-hold", "engine"]);

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function fileSha(abs) {
  try { return sha256(fs.readFileSync(abs)); }
  catch { return ""; }
}

function markName(rel) {
  return rel.replace(/\\/g, "/").replace(/\//g, "__");
}

function holdDir(root) {
  return path.join(root, ".plant-hold");
}

function restoreLines(mark) {
  return [
    "plant hold: " + mark.rel + " was planted and has not been put back.",
    "sha256 was " + mark.sum,
    "backup copy: " + mark.bak,
    "restore: copy the backup over " + mark.rel + ", then remove .plant-hold/" + mark.name + " once the sha256 matches.",
  ];
}

function readMarks(root) {
  const dir = holdDir(root);
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    if (name.endsWith(".tmp")) continue;
    const file = path.join(dir, name);
    let st;
    try { st = fs.lstatSync(file); } catch { continue; }
    if (!st.isFile()) continue;
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    out.push({ name, rel: lines[0] || "", sum: lines[1] || "", bak: lines[2] || "", file });
  }
  return out;
}

function printRestore(marks, stream) {
  for (const mark of marks) {
    for (const line of restoreLines(mark)) stream.write(line + "\n");
  }
}

function hasRestore(text, mark) {
  return restoreLines(mark).every((line) => String(text).indexOf(line) >= 0);
}

/* Backup, then the mark, and only then may the caller change a byte. */
function beginHold(root, rel) {
  const slash = String(rel).replace(/\\/g, "/");
  const buf = fs.readFileSync(path.join(root, slash));
  const sum = sha256(buf);
  const name = markName(slash);
  const bakDir = path.join(root, "scratch", "plant-hold");
  fs.mkdirSync(bakDir, { recursive: true });
  const bak = path.join(bakDir, name + "." + sum.slice(0, 12) + ".bak");
  fs.writeFileSync(bak, buf);
  const dir = holdDir(root);
  fs.mkdirSync(dir, { recursive: true });
  const body = slash + "\n" + sum + "\n" + bak + "\n";
  const tmp = path.join(dir, name + ".tmp");
  const dest = path.join(dir, name);
  fs.writeFileSync(tmp, body);
  try { fs.unlinkSync(dest); } catch (e) { if (!e || e.code !== "ENOENT") throw e; }
  fs.renameSync(tmp, dest);
  return { rel: slash, sum, bak, name };
}

/* False while the bytes differ, so the mark stays. True removes the mark and leaves the backup. */
function endHold(root, rel) {
  const slash = String(rel).replace(/\\/g, "/");
  const dest = path.join(holdDir(root), markName(slash));
  if (!fs.existsSync(dest)) return true;
  const lines = fs.readFileSync(dest, "utf8").split(/\r?\n/);
  const sum = lines[1] || "";
  let now = "";
  try { now = sha256(fs.readFileSync(path.join(root, slash))); } catch { now = ""; }
  if (now !== sum) return false;
  fs.unlinkSync(dest);
  return true;
}

function childEnv(extra) {
  const env = Object.assign({}, process.env, extra || {});
  delete env["ETIUDA_" + "WINDOWS"];
  return env;
}

function shBin() {
  const found = [];
  const which = spawnSync("where", ["sh"], { encoding: "utf8", windowsHide: true });
  if (which.status === 0) {
    for (const line of String(which.stdout || "").split(/\r?\n/)) {
      const t = line.trim();
      if (t) found.push(t);
    }
  }
  found.push("C:\\Program Files\\Git\\bin\\sh.exe", "C:\\Program Files\\Git\\usr\\bin\\sh.exe", "sh");
  for (const bin of found) {
    if (bin !== "sh" && !fs.existsSync(bin)) continue;
    const r = spawnSync(bin, ["-c", "exit 0"], { windowsHide: true });
    if (r.status === 0) return bin;
  }
  return "";
}

function runHook(root, script) {
  const sh = shBin();
  if (!sh) return { status: 127, text: "sh missing" };
  const r = spawnSync(sh, [script], { cwd: root, encoding: "utf8", windowsHide: true, env: childEnv() });
  return { status: r.status, text: String(r.stderr || "") + String(r.stdout || "") };
}

function runGuard(root) {
  const target = root || ROOT;
  const r = spawnSync(process.execPath, [path.join(ROOT, "tests", "plant-hold.mjs"), "--guard", "--root", target], {
    cwd: target, encoding: "utf8", windowsHide: true, env: childEnv(),
  });
  return { status: r.status, text: String(r.stderr || "") + String(r.stdout || "") };
}

/* The chain record sits under scratch/, which is gitignored, so it is not a tracked path.
   The hold writes a fresh id into the record and the same id into the open ticket.
   Compare spends that ticket once. A second compare finds no ticket, so a record
   already judged cannot pass and cannot name a file. Two commands need not share
   a parent: the id is the link, and only the matching unspent ticket is this hold. */
function recordPath(root) {
  return path.join(root, "scratch", "plant-chain", "record.json");
}

function ticketPath(root) {
  return path.join(root, "scratch", "plant-chain", "open");
}

function freshChainId() {
  return crypto.randomBytes(16).toString("hex");
}

function trackedList(root) {
  const listed = spawnSync("git", ["ls-files", "-z"], {
    cwd: root, encoding: "utf8", windowsHide: true,
  });
  const err = String(listed.stderr || "") + String(listed.error || "");
  if (listed.status !== 0) {
    if (/not a git repository/i.test(err)) return { ok: false, why: "no-git" };
    return { ok: false, why: "git ls-files failed" };
  }
  const files = String(listed.stdout || "").split("\0").filter((rel) => rel.length > 0)
    .map((rel) => rel.replace(/\\/g, "/"));
  return { ok: true, files };
}

function replaceFile(dest, body) {
  const tmp = dest + ".tmp";
  fs.writeFileSync(tmp, body);
  try { fs.unlinkSync(dest); } catch (e) { if (!e || e.code !== "ENOENT") throw e; }
  fs.renameSync(tmp, dest);
}

function writeChainRecord(root) {
  const listed = trackedList(root);
  if (!listed.ok) return listed;
  const files = {};
  for (const rel of listed.files) files[rel] = fileSha(path.join(root, rel));
  const chainId = freshChainId();
  const dest = recordPath(root);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  /* The record lands before the ticket, so a compare never spends a new ticket
     against the previous record. */
  replaceFile(dest, JSON.stringify({ id: chainId, files: files }));
  replaceFile(ticketPath(root), chainId + "\n");
  return { ok: true, n: listed.files.length };
}

/* True only for the process that spends this hold's ticket. A second caller finds
   the ticket already renamed away. */
function spendTicket(root, chainId) {
  const ticket = ticketPath(root);
  let got = "";
  try { got = fs.readFileSync(ticket, "utf8").trim(); }
  catch { return false; }
  if (got !== chainId) return false;
  const spent = path.join(path.dirname(ticket), "spent-" + chainId);
  try { fs.renameSync(ticket, spent); }
  catch { return false; }
  let moved = "";
  try { moved = fs.readFileSync(spent, "utf8").trim(); }
  catch { return false; }
  return moved === chainId;
}

function compareChainRecord(root) {
  const dest = recordPath(root);
  if (!fs.existsSync(dest)) return { code: 1, lines: ["FAIL chain record missing"] };
  let body;
  try { body = JSON.parse(fs.readFileSync(dest, "utf8")); }
  catch { return { code: 1, lines: ["FAIL chain record unreadable"] }; }
  const chainId = body && typeof body.id === "string" ? body.id : "";
  if (!/^[0-9a-f]{32}$/.test(chainId) || body.spent === true || !body.files || typeof body.files !== "object") {
    return { code: 1, lines: ["FAIL chain record stale"] };
  }
  if (!spendTicket(root, chainId)) return { code: 1, lines: ["FAIL chain record stale"] };
  try {
    replaceFile(dest, JSON.stringify({ id: chainId, spent: true, files: body.files }));
  } catch { /* the ticket is already spent, so a second compare still refuses */ }
  const listed = trackedList(root);
  if (!listed.ok) return { code: 1, lines: ["FAIL chain record " + listed.why] };
  const lines = [];
  const was = body.files;
  const nowSet = new Set(listed.files);
  for (const rel of Object.keys(was).sort()) {
    const now = nowSet.has(rel) ? fileSha(path.join(root, rel)) : "";
    if (now !== was[rel]) lines.push("FAIL " + rel + " sha256 was " + was[rel] + " sha256 is " + (now || "missing"));
  }
  for (const rel of listed.files) {
    if (Object.prototype.hasOwnProperty.call(was, rel)) continue;
    lines.push("FAIL " + rel + " sha256 was missing sha256 is " + fileSha(path.join(root, rel)));
  }
  if (lines.length) return { code: 1, lines };
  return { code: 0, lines: ["chain record matches " + listed.files.length + " files"] };
}

export function parseRootArg() {
  const i = process.argv.indexOf("--root");
  if (i >= 0 && process.argv[i + 1]) return path.resolve(process.argv[i + 1]);
  return ROOT;
}
const sealRoot = parseRootArg;

function runSeal(args) {
  const r = spawnSync(process.execPath, [path.join(ROOT, "tests", "plant-hold.mjs")].concat(args), {
    encoding: "utf8", windowsHide: true, env: childEnv(),
  });
  return { status: r.status, text: String(r.stderr || "") + String(r.stdout || "") };
}

function installedHook(root) {
  const r = spawnSync("git", ["rev-parse", "--git-common-dir"], { cwd: root, encoding: "utf8", windowsHide: true });
  if (r.status !== 0) return "";
  let dir = String(r.stdout || "").trim();
  if (!dir) return "";
  if (!path.isAbsolute(dir)) dir = path.resolve(root, dir);
  return path.join(dir, "hooks", "pre-commit");
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function parsePids(text, parent) {
  const out = [];
  for (const m of String(text || "").match(/\d+/g) || []) {
    const n = Number(m);
    if (n > 0 && n !== parent && out.indexOf(n) < 0) out.push(n);
  }
  return out;
}

function childPids(pid) {
  const id = String(Number(pid));
  const wmic = spawnSync("wmic", ["process", "where", "ParentProcessId=" + id, "get", "ProcessId"], {
    encoding: "utf8", windowsHide: true,
  });
  const fromWmic = parsePids(wmic.stdout, Number(pid));
  if (wmic.status === 0) return fromWmic;
  const ps = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command",
    "Get-CimInstance Win32_Process -Filter \"ParentProcessId=" + id + "\" | Select-Object -ExpandProperty ProcessId"],
    { encoding: "utf8", windowsHide: true });
  return parsePids(ps.stdout, Number(pid));
}

/* The planted process first, so its finally cannot put the bytes back, then the children recorded before that. */
function killTree(pid) {
  const rootPid = Number(pid);
  const killed = [];
  if (!rootPid || rootPid === process.pid) return killed;
  const seen = new Set();
  function collect(p) {
    p = Number(p);
    if (!p || p === process.pid || seen.has(p)) return;
    seen.add(p);
    for (const kid of childPids(p)) collect(kid);
  }
  collect(rootPid);
  const ordered = [rootPid].concat([...seen].filter((p) => p !== rootPid));
  for (const p of ordered) {
    const r = spawnSync("taskkill", ["/F", "/PID", String(p)], { encoding: "utf8", windowsHide: true });
    if (r.status === 0) killed.push(p);
  }
  return killed;
}

function walkFiles(root) {
  const out = [];
  function walk(abs, rel) {
    let st;
    try { st = fs.lstatSync(abs); } catch { return; }
    if (st.isSymbolicLink()) return;
    if (st.isDirectory()) {
      if (rel && SKIP.has(path.basename(abs))) return;
      let names;
      try { names = fs.readdirSync(abs); } catch { return; }
      for (const name of names) {
        if (!rel && SKIP.has(name)) continue;
        walk(path.join(abs, name), rel ? rel + "/" + name : name);
      }
      return;
    }
    if (st.isFile()) out.push(rel);
  }
  walk(root, "");
  return out;
}

function snapshot(root) {
  const snap = new Map();
  for (const rel of walkFiles(root)) {
    try { snap.set(rel, fs.readFileSync(path.join(root, rel))); }
    catch { snap.set(rel, null); }
  }
  return snap;
}

function diffCount(root, snap) {
  let n = 0;
  const names = [];
  for (const [rel, buf] of snap) {
    let now = null;
    try { now = fs.readFileSync(path.join(root, rel)); } catch { now = null; }
    const same = buf === null ? now === null : now !== null && now.equals(buf);
    if (!same) {
      n++;
      if (names.length < 8) names.push(rel);
    }
  }
  return { n, names };
}

function restoreSnap(root, snap) {
  let n = 0;
  for (const [rel, buf] of snap) {
    if (buf === null) continue;
    const abs = path.join(root, rel);
    let now = null;
    try { now = fs.readFileSync(abs); } catch { now = null; }
    if (now !== null && now.equals(buf)) continue;
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, buf);
    n++;
  }
  return n;
}

function plantsInPlace(root) {
  const text = fs.readFileSync(path.join(root, "tests", "relay-e2e.mjs"), "utf8");
  return text.indexOf("path.join(ROOT, p.file)") >= 0 && text.indexOf("fs.writeFileSync(at, lines.join") >= 0;
}

/* The hook calls git, so it is proved in a repository of its own. The guard reads marks
   beside this script, which needs no repository. */
function pk0() {
  const lab = fs.mkdtempSync(path.join(os.tmpdir(), "plant-hold-hook-"));
  try {
    fs.mkdirSync(path.join(lab, "tools", "hooks"), { recursive: true });
    fs.copyFileSync(path.join(ROOT, "tools", "hooks", "pre-commit"), path.join(lab, "tools", "hooks", "pre-commit"));
    fs.writeFileSync(path.join(lab, "tools", "pre-commit"), "#!/usr/bin/env sh\necho SCAN\nexit 0\n");
    fs.writeFileSync(path.join(lab, "kept.txt"), "kept\n");
    const init = spawnSync("git", ["init"], { cwd: lab, encoding: "utf8", windowsHide: true });
    check(init.status === 0, "pk0: a temp repository accepts the hook");
    if (init.status !== 0) {
      process.stderr.write("pk0 init " + String(init.stderr || init.stdout || "").slice(0, 400) + "\n");
      return;
    }
    const held = "kept.txt";
    const beforeLab = fs.readFileSync(path.join(lab, held));
    const labMark = beginHold(lab, held);
    const stillLab = fs.readFileSync(path.join(lab, held));
    check(stillLab.equals(beforeLab) && fs.existsSync(path.join(holdDir(lab), labMark.name)),
      "pk0: the mark is written before any byte of the held file changes");
    const hook = runHook(lab, path.join(lab, "tools", "hooks", "pre-commit"));
    check(hook.status === 1 && hasRestore(hook.text, labMark),
      "pk0: the pre-commit hook refuses and prints the restore");
    if (!(hook.status === 1 && hasRestore(hook.text, labMark))) {
      process.stderr.write("pk0 hook status " + hook.status + "\n" + hook.text.slice(0, 800) + "\n");
    }
    endHold(lab, held);
    const open = runHook(lab, path.join(lab, "tools", "hooks", "pre-commit"));
    check(open.status === 0 && open.text.indexOf("SCAN") >= 0 && open.text.indexOf("plant hold:") < 0,
      "pk0: with no mark the hook runs the scan and does not refuse");
    const again = beginHold(lab, held);
    const shut = runHook(lab, path.join(lab, "tools", "hooks", "pre-commit"));
    check(shut.status === 1 && hasRestore(shut.text, again) && shut.text.indexOf("SCAN") < 0,
      "pk0: with a mark the hook refuses and does not run the scan");
    endHold(lab, held);
  } finally {
    try { fs.rmSync(lab, { recursive: true, force: true }); } catch { /* the lab's own directory */ }
  }

  const rel = "package.json";
  const before = fs.readFileSync(path.join(ROOT, rel));
  let mark = null;
  try {
    mark = beginHold(ROOT, rel);
    const still = fs.readFileSync(path.join(ROOT, rel));
    check(still.equals(before) && fs.existsSync(path.join(holdDir(ROOT), mark.name)),
      "pk0: the guard's mark is written before any byte of package.json changes");
    const installed = installedHook(ROOT);
    let liveText = "";
    try { if (installed && fs.existsSync(installed)) liveText = fs.readFileSync(installed, "utf8"); }
    catch { liveText = ""; }
    if (liveText.indexOf("plant hold") >= 0) {
      const live = runHook(ROOT, installed);
      check(live.status === 1 && hasRestore(live.text, mark),
        "pk0: the installed hook refuses and prints the restore");
      if (!(live.status === 1 && hasRestore(live.text, mark))) {
        process.stderr.write("pk0 installed status " + live.status + "\n" + live.text.slice(0, 800) + "\n");
      }
    }
    const guard = runGuard(ROOT);
    check(guard.status === 1 && hasRestore(guard.text, mark),
      "pk0: the chain guard refuses and prints the restore");
  } finally {
    if (mark) endHold(ROOT, rel);
  }
  check(readMarks(ROOT).every((m) => m.rel !== rel), "pk0: the mark is gone once the sha256 matches");
  const quiet = runGuard(ROOT);
  check(quiet.status === 0 && quiet.text.indexOf("plant hold:") < 0,
    "pk0: the chain guard is quiet once the mark is gone");
}

function pk0d() {
  const lab = fs.mkdtempSync(path.join(os.tmpdir(), "plant-hold-lab-"));
  try {
    fs.mkdirSync(path.join(lab, "src"));
    const rel = "src/sample.txt";
    fs.writeFileSync(path.join(lab, rel), "one\n");
    const mark = beginHold(lab, rel);
    fs.writeFileSync(path.join(lab, rel), "two\n");
    check(endHold(lab, rel) === false, "pk0d: endHold refuses while the bytes differ");
    check(fs.existsSync(path.join(lab, ".plant-hold", mark.name)), "pk0d: the mark stays while the bytes differ");
    fs.writeFileSync(path.join(lab, rel), "one\n");
    check(endHold(lab, rel) === true, "pk0d: endHold removes the mark once the sha256 matches");
    check(!fs.existsSync(path.join(lab, ".plant-hold", mark.name)), "pk0d: the mark file is gone");
  } finally {
    try { fs.rmSync(lab, { recursive: true, force: true }); } catch { /* the lab's own directory */ }
  }
}

function drain(child) {
  let out = "";
  const take = (buf) => {
    out += buf.toString("utf8");
    if (out.length > 80000) out = out.slice(-40000);
  };
  if (child.stdout) child.stdout.on("data", take);
  if (child.stderr) child.stderr.on("data", take);
  return () => out;
}

function waitExit(child, ms) {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) return resolve(child.exitCode);
    const t = setTimeout(() => resolve(child.exitCode), ms);
    child.once("exit", (code) => { clearTimeout(t); resolve(code); });
  });
}

async function dropCopy(copy) {
  if (!copy) return;
  let plants;
  try { plants = await import("./plants-tree.mjs"); }
  catch (e) {
    process.stderr.write("pk1 drop import " + (e && e.message || e) + "\n");
    return;
  }
  for (let i = 0; i < 5; i++) {
    plants.dropPlantsTree(copy, ROOT);
    if (!fs.existsSync(copy)) return;
    sleep(200);
  }
  if (fs.existsSync(copy)) process.stderr.write("pk1 copy remains " + copy + "\n");
}

async function pk1() {
  const inPlace = plantsInPlace(ROOT);
  process.stdout.write("pk1 path " + (inPlace ? "in-place" : "copy") + "\n");
  const before = snapshot(ROOT);
  const watchStart = new Map();
  for (const rel of WATCH) watchStart.set(rel, fileSha(path.join(ROOT, rel)));
  const env = childEnv();
  delete env.RELAY_E2E_HOLD;
  delete env.RELAY_E2E_HOLD_FLAG;
  delete env.RELAY_E2E_ONLY;
  let flag = "";
  if (!inPlace) {
    flag = path.join(os.tmpdir(), "plant-hold-" + process.pid + ".flag");
    try { fs.unlinkSync(flag); } catch { /* none yet */ }
    env.RELAY_E2E_HOLD = "1";
    env.RELAY_E2E_HOLD_FLAG = flag;
  }
  const child = spawn(process.execPath, [path.join(ROOT, "tests", "relay-e2e.mjs")], {
    cwd: ROOT, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
  });
  const grabbed = drain(child);
  const deadline = Date.now() + 90000;
  let entered = false;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) break;
    if (inPlace) {
      for (const rel of WATCH) {
        if (fileSha(path.join(ROOT, rel)) !== watchStart.get(rel)) { entered = true; break; }
      }
    } else {
      try { if (fs.readFileSync(flag, "utf8").indexOf("WINDOW") >= 0) entered = true; }
      catch { /* not written yet */ }
    }
    if (entered) break;
    sleep(30);
  }
  const killed = child.pid ? killTree(child.pid) : [];
  await waitExit(child, 10000);
  if (child.exitCode === null && child.pid) {
    killTree(child.pid);
    await waitExit(child, 25000);
  }
  let copy = "";
  if (flag) {
    try {
      const m = /^COPY (.*)$/m.exec(fs.readFileSync(flag, "utf8"));
      copy = m ? m[1].trim() : "";
    } catch { copy = ""; }
  }
  const marks = readMarks(ROOT);
  let refused = false;
  if (marks.length) {
    const hook = runHook(ROOT, path.join(ROOT, "tools", "hooks", "pre-commit"));
    const guard = runGuard(ROOT);
    refused = hook.status === 1 && guard.status === 1
      && hook.text.indexOf("restore:") >= 0 && guard.text.indexOf("restore:") >= 0;
  }
  const diff = diffCount(ROOT, before);
  const same = diff.n === 0;
  let pass = false;
  let line;
  if (!entered) line = "pk1: the planting window was not entered";
  else if (same && marks.length === 0 && !inPlace) {
    pass = true;
    line = "pk1: the planting window was entered and the checkout's tracked files match";
  } else if (entered && marks.length > 0 && refused) {
    pass = true;
    line = "pk1: the planting window was entered and a plant hold refuses the hook and the chain guard";
  } else if (inPlace && same) {
    line = "pk1: the in-place plant left the checkout matching and left no plant hold, because the kill missed the window";
  } else {
    line = "pk1: the planting window was entered and the checkout changed with no plant hold";
  }
  process.stdout.write("pk1 killed " + killed.join(",") + " same=" + same + " marks=" + marks.length
    + " refused=" + refused + " diff=" + diff.names.join(",") + "\n");
  check(pass, line);
  if (!same) {
    const n = restoreSnap(ROOT, before);
    process.stdout.write("pk1 restored " + n + " file(s) after the measurement\n");
  }
  await dropCopy(copy);
  if (flag) { try { fs.unlinkSync(flag); } catch { /* the flag */ } }
  if (!entered) process.stderr.write("pk1 child out " + JSON.stringify(grabbed()).slice(0, 1500) + "\n");
}

/* A one-file repository, so the red compare never writes a tracked file of this checkout. */
function pk2() {
  const lab = fs.mkdtempSync(path.join(os.tmpdir(), "plant-hold-seal-"));
  try {
    fs.writeFileSync(path.join(lab, "kept.txt"), "kept\n");
    const init = spawnSync("git", ["init"], { cwd: lab, encoding: "utf8", windowsHide: true });
    check(init.status === 0, "pk2: a temp repository accepts the chain record");
    if (init.status !== 0) return;
    const add = spawnSync("git", ["add", "kept.txt"], { cwd: lab, encoding: "utf8", windowsHide: true });
    check(add.status === 0, "pk2: the temp repository tracks kept.txt");
    if (add.status !== 0) return;
    const stalePath = recordPath(lab);
    fs.mkdirSync(path.dirname(stalePath), { recursive: true });
    fs.writeFileSync(stalePath, JSON.stringify({ key: "stale", files: { "kept.txt": "0".repeat(64) } }));
    const rec = runSeal(["--record", "--root", lab]);
    check(rec.status === 0, "pk2: the chain record is written over the stale one");
    const quiet = runSeal(["--compare", "--root", lab]);
    check(quiet.status === 0 && quiet.text.indexOf("FAIL ") < 0,
      "pk2: a stale record does not fail the run that recorded again");
    const rec2 = runSeal(["--record", "--root", lab]);
    check(rec2.status === 0, "pk2: a new hold follows a compare");
    fs.writeFileSync(path.join(lab, "kept.txt"), "changed\n");
    const red = runSeal(["--compare", "--root", lab]);
    const failLine = (red.text.match(/FAIL kept\.txt sha256 was [0-9a-f]{64} sha256 is [0-9a-f]{64}/) || [])[0] || "";
    check(red.status === 1 && failLine.length > 0,
      "pk2: an in-place write is named with the old and new sha256");
    if (failLine) process.stdout.write("pk2 " + failLine + "\n");
    const judged = runSeal(["--compare", "--root", lab]);
    check(judged.status === 1 && judged.text.indexOf("chain record stale") >= 0 && judged.text.indexOf("sha256 was") < 0,
      "pk2: a record already judged does not pass, and it does not name a file");
    fs.writeFileSync(path.join(lab, "kept.txt"), "kept\n");
    const rec3 = runSeal(["--record", "--root", lab]);
    check(rec3.status === 0, "pk2: a hold after the bytes are restored writes a new record");
    const back = runSeal(["--compare", "--root", lab]);
    check(back.status === 0 && back.text.indexOf("FAIL ") < 0,
      "pk2: the same bytes compare clean");
    const noHold = runSeal(["--compare", "--root", lab]);
    check(noHold.status === 1 && noHold.text.indexOf("chain record stale") >= 0 && noHold.text.indexOf("sha256 was") < 0,
      "pk2: a compare with no new hold is refused, and it does not name a file");
  } finally {
    try { fs.rmSync(lab, { recursive: true, force: true }); } catch { /* the lab's own directory */ }
  }
}

function moduleNames(root) {
  const dir = path.join(root, "node_modules");
  try { return fs.readdirSync(dir).sort(); }
  catch (e) {
    if (e && e.code === "ENOENT") return [];
    throw e;
  }
}

function pidAlive(pid) {
  if (!pid) return false;
  try { process.kill(pid, 0); return true; }
  catch (e) { return !!(e && e.code === "EPERM"); }
}

function isJunction(dir) {
  try { return fs.lstatSync(path.join(dir, "node_modules")).isSymbolicLink(); }
  catch { return false; }
}

function hasOwner(dir) {
  try {
    const text = fs.readFileSync(path.join(dir, "plants-owner"), "utf8");
    return /^pid [1-9]\d+$/m.test(text) && /^started \d+$/m.test(text);
  } catch { return false; }
}

function lineNames(text, prefix, full) {
  const want = path.resolve(full).toLowerCase();
  for (const line of String(text || "").split(/\r?\n/)) {
    const i = line.indexOf(prefix);
    if (i < 0) continue;
    const got = line.slice(i + prefix.length).trim();
    if (got && path.resolve(got).toLowerCase() === want) return line.trim();
  }
  return "";
}

function relayChildEnv(extra) {
  const env = childEnv(extra);
  delete env.RELAY_STUDIO_ONLY;
  delete env.RELAY_E2E_HOLD;
  delete env.RELAY_E2E_HOLD_FLAG;
  delete env.RELAY_E2E_ONLY;
  return env;
}

function startPlantsHold(flag) {
  try { fs.unlinkSync(flag); } catch { /* none yet */ }
  const env = relayChildEnv({
    RELAY_STUDIO_PLANTS_HOLD: "1",
    RELAY_STUDIO_PLANTS_HOLD_FLAG: flag,
  });
  delete env.RELAY_STUDIO_PLANTS_DROP;
  const child = spawn(process.execPath, [path.join(ROOT, "tests", "relay-studio.mjs")], {
    cwd: ROOT, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
  });
  const grabbed = drain(child);
  return { child, grabbed };
}

function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitPlantsCopy(flag, child, ms) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) return "";
    try {
      const text = fs.readFileSync(flag, "utf8");
      const m = /^COPY (.*)$/m.exec(text);
      const copy = m ? m[1].trim() : "";
      if (copy && fs.existsSync(copy)) return copy;
    } catch { /* not written yet */ }
    await pause(40);
  }
  return "";
}

async function endChild(entry) {
  if (!entry || !entry.child) return;
  const child = entry.child;
  if (child.exitCode === null && child.pid) killTree(child.pid);
  await waitExit(child, 10000);
}

/* The plants phase drops a copy whose maker is gone, and only that. */
async function pk3() {
  const relay = path.join(ROOT, "tests", "relay-studio.mjs");
  const src = fs.readFileSync(relay, "utf8");
  const holdAt = src.indexOf('RELAY_STUDIO_PLANTS_HOLD === "1"');
  const legsAt = src.indexOf("for (const name of Object.keys(LEGS))");
  const sweepAt = src.indexOf("function sweepAbandonedPlants(");
  const makeAt = src.indexOf("function makePlantsTree(");
  const sweepBody = sweepAt >= 0 && makeAt > sweepAt ? src.slice(sweepAt, makeAt) : "";
  const ready = holdAt >= 0 && legsAt > holdAt && sweepBody.indexOf("dropPlantsTree(dir, ROOT)") >= 0
    && sweepBody.indexOf("rmSync") < 0 && sweepBody.indexOf("rmdirSync") < 0;
  const killedLine = "pk3: a copy made by a child killed with taskkill /F is dropped by the next run, its junction unlinked first, and the checkout node_modules listing is unchanged";
  const liveLine = "pk3: a copy whose owner is alive is left";
  const bareLine = "pk3: a copy with no owner file is left and named";
  if (!ready) {
    check(false, killedLine);
    check(false, liveLine);
    check(false, bareLine);
    return;
  }
  const beforeNm = moduleNames(ROOT);
  const liveFlag = path.join(os.tmpdir(), "plant-sweep-live-" + process.pid + ".flag");
  const deadFlag = path.join(os.tmpdir(), "plant-sweep-dead-" + process.pid + ".flag");
  let bare = "";
  let live = null;
  let dead = null;
  let liveCopy = "";
  let deadCopy = "";
  let junctionWas = false;
  let nextText = "";
  let nextStatus = null;
  let deadGone = false;
  let liveLeft = false;
  let bareLeft = false;
  let sameNm = false;
  let dropped = "";
  let named = "";
  let plants;
  try { plants = await import("./plants-tree.mjs"); }
  catch (e) {
    check(false, "pk3 drop import " + (e && e.message || e));
    return;
  }
  try {
    bare = fs.mkdtempSync(path.join(os.tmpdir(), "relay-studio-plants-"));
    fs.symlinkSync(path.join(ROOT, "node_modules"), path.join(bare, "node_modules"), "junction");
    live = startPlantsHold(liveFlag);
    liveCopy = await waitPlantsCopy(liveFlag, live.child, 180000);
    dead = startPlantsHold(deadFlag);
    deadCopy = await waitPlantsCopy(deadFlag, dead.child, 180000);
    const liveReady = !!liveCopy && hasOwner(liveCopy) && isJunction(liveCopy) && pidAlive(live.child.pid);
    const deadReady = !!deadCopy && hasOwner(deadCopy) && isJunction(deadCopy) && pidAlive(dead.child.pid);
    if (liveReady && deadReady) {
      const killed = killTree(dead.child.pid);
      await waitExit(dead.child, 10000);
      junctionWas = isJunction(deadCopy) && fs.existsSync(deadCopy) && !pidAlive(dead.child.pid);
      process.stdout.write("pk3 killed " + killed.join(",") + " copy " + path.basename(deadCopy) + "\n");
      const env = relayChildEnv({ RELAY_STUDIO_PLANTS_DROP: "1" });
      delete env.RELAY_STUDIO_PLANTS_HOLD;
      delete env.RELAY_STUDIO_PLANTS_HOLD_FLAG;
      const next = spawnSync(process.execPath, [relay], {
        cwd: ROOT, env, encoding: "utf8", windowsHide: true, timeout: 180000,
      });
      nextStatus = next.status;
      nextText = String(next.stdout || "") + "\n" + String(next.stderr || "");
      const afterNm = moduleNames(ROOT);
      sameNm = beforeNm.length > 0 && beforeNm.join("\n") === afterNm.join("\n");
      dropped = lineNames(nextText, "relay-studio plants copy dropped: ", deadCopy);
      named = lineNames(nextText, "relay-studio plants copy has no owner, left: ", bare);
      deadGone = !fs.existsSync(deadCopy);
      liveLeft = fs.existsSync(liveCopy) && isJunction(liveCopy) && pidAlive(live.child.pid);
      bareLeft = fs.existsSync(bare) && isJunction(bare) && !hasOwner(bare);
    } else {
      process.stderr.write("pk3 live " + liveCopy + " dead " + deadCopy + "\n");
      if (live) process.stderr.write("pk3 live out " + live.grabbed().slice(0, 1500) + "\n");
      if (dead) process.stderr.write("pk3 dead out " + dead.grabbed().slice(0, 1500) + "\n");
    }
  } finally {
    await endChild(dead);
    await endChild(live);
    for (const dir of [bare, liveCopy, deadCopy]) {
      if (!dir || !fs.existsSync(dir)) continue;
      const ownerPid = dir === liveCopy && live ? live.child.pid : dir === deadCopy && dead ? dead.child.pid : 0;
      if (ownerPid && pidAlive(ownerPid)) {
        process.stderr.write("pk3 copy remains " + dir + "\n");
        continue;
      }
      for (let i = 0; i < 125 && fs.existsSync(dir); i++) {
        plants.dropPlantsTree(dir, ROOT);
        if (fs.existsSync(dir)) await pause(200);
      }
      if (fs.existsSync(dir)) process.stderr.write("pk3 copy remains " + dir + "\n");
    }
    for (const flag of [liveFlag, deadFlag]) {
      try { fs.unlinkSync(flag); } catch { /* the flag */ }
    }
  }
  const cleanedNm = moduleNames(ROOT);
  const cleanedSame = beforeNm.length > 0 && beforeNm.join("\n") === cleanedNm.join("\n");
  if (dropped) process.stdout.write("pk3 " + dropped + "\n");
  if (named) process.stdout.write("pk3 " + named + "\n");
  if (!(nextStatus === 0 && deadGone && dropped && junctionWas && sameNm && cleanedSame)) {
    process.stderr.write("pk3 status=" + nextStatus + " deadGone=" + deadGone + " junctionWas=" + junctionWas
      + " nmSame=" + sameNm + " cleanedSame=" + cleanedSame + " nm=" + cleanedNm.length + "\n");
    process.stderr.write(nextText.slice(0, 4000) + "\n");
  }
  check(nextStatus === 0 && deadGone && !!dropped && junctionWas && sameNm && cleanedSame, killedLine);
  check(liveLeft && !lineNames(nextText, "relay-studio plants copy dropped: ", liveCopy), liveLine);
  check(bareLeft && !!named && !lineNames(nextText, "relay-studio plants copy dropped: ", bare), bareLine);
}

function splitZero(buf) {
  const out = [];
  if (!buf || !buf.length) return out;
  let start = 0;
  for (let i = 0; i <= buf.length; i++) {
    if (i === buf.length || buf[i] === 0) {
      if (i > start) out.push(buf.toString("utf8", start, i));
      start = i + 1;
    }
  }
  return out;
}

function normalRel(rel) {
  return String(rel).split("\\").join("/");
}

function relOk(rel) {
  if (!rel || rel.startsWith("/") || rel.startsWith("\\")) return false;
  const parts = rel.split("/");
  for (const p of parts) if (!p || p === "." || p === "..") return false;
  return true;
}

function gitRefuse(cmd, err, status) {
  const raw = String(err || "").trim();
  const firstLine = raw.split(/\r?\n/)[0] || (status !== undefined ? `exit ${status}` : "unknown git error");
  process.stderr.write(`plant-guard: ${cmd} failed: ${firstLine}\n`);
  process.exit(78);
}

export function countPlantMarkers(text) {
  const counts = new Map();
  if (typeof text !== "string") return counts;
  const re = /plant:([a-zA-Z0-9_-]+)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const tag = m[1];
    counts.set(tag, (counts.get(tag) || 0) + 1);
  }
  return counts;
}

export function checkPlantMarkers(root) {
  /* A folder that is not a git tree (a history-less export, where a review runs npm test) has no HEAD to compare against:
     it passes, and says so. Inside a git tree, any git failure refuses with 78 (the test architect's C1 and C2). */
  if (!fs.existsSync(path.join(root, ".git"))) {
    process.stdout.write("plant-guard: markers not checked: " + root + " is not a git tree\n"); /* plant:guard-no-git */
    return [];
  }
  const headCheck = spawnSync("git", ["-C", root, "rev-parse", "--verify", "HEAD"], {
    windowsHide: true,
    encoding: "utf8",
  });
  if (headCheck.error || headCheck.status !== 0) {
    gitRefuse("git rev-parse --verify HEAD", headCheck.stderr || headCheck.error, headCheck.status);
  }

  const grepRes = spawnSync("git", ["-C", root, "-c", "core.quotePath=false", "grep", "-lz", "plant:", "HEAD", "--"], {
    windowsHide: true,
    maxBuffer: 32 << 20,
  });
  if (grepRes.error) {
    gitRefuse("git grep -lz plant: HEAD --", grepRes.error);
  }
  if (grepRes.status === 1) return [];
  if (grepRes.status !== 0) {
    gitRefuse("git grep -lz plant: HEAD --", grepRes.stderr, grepRes.status);
  }

  const filesAtHead = [];
  for (const raw of splitZero(grepRes.stdout)) {
    if (!raw) continue;
    let rel = raw;
    if (rel.startsWith("HEAD:")) rel = rel.slice(5);
    const norm = normalRel(rel);
    if (relOk(norm)) filesAtHead.push(norm);
  }

  if (filesAtHead.length === 0) return [];

  const catInput = filesAtHead.map(f => "HEAD:" + f).join("\n") + "\n";
  const catRes = spawnSync("git", ["-C", root, "cat-file", "--batch"], {
    input: catInput,
    windowsHide: true,
    maxBuffer: 64 << 20,
  });

  if (catRes.error || catRes.status !== 0) {
    gitRefuse("git cat-file --batch", catRes.stderr || catRes.error, catRes.status);
  }

  const buf = catRes.stdout;
  let offset = 0;
  const violations = [];

  for (const rel of filesAtHead) {
    const newlineIdx = buf.indexOf(10, offset);
    if (newlineIdx === -1) break;
    const header = buf.subarray(offset, newlineIdx).toString("utf8");
    if (header.endsWith("missing")) {
      offset = newlineIdx + 1;
      continue;
    }
    const parts = header.split(" ");
    const size = parseInt(parts[2], 10);
    const contentStart = newlineIdx + 1;
    const contentEnd = contentStart + size;
    const headText = buf.subarray(contentStart, contentEnd).toString("utf8");
    offset = contentEnd + 1;

    const headCounts = countPlantMarkers(headText);

    let diskText = "";
    try {
      diskText = fs.readFileSync(path.join(root, rel), "utf8");
    } catch (e) {
      diskText = "";
    }
    const diskCounts = countPlantMarkers(diskText);

    const missing = [];
    for (const [tag, count] of headCounts) {
      const onDisk = diskCounts.get(tag) || 0;
      if (onDisk < count) {
        missing.push("plant:" + tag);
      }
    }
    if (missing.length > 0) {
      violations.push({ file: rel, missing });
    }
  }

  return violations;
}

export function plantMarkerReport(violations) {
  const lines = ["etiuda plant-guard: a tracked file holds fewer plant markers than HEAD; refused."];
  for (const v of violations) {
    lines.push("  file: " + v.file);
    lines.push("  missing tags: " + v.missing.join(", "));
    lines.push("  restore: git checkout -- " + v.file);
  }
  return lines.join("\n");
}

/* PLANTS OFF. Every inline plant proof honours ETIUDA_PLANTS=off (the test architect's ruling, 2026-11-01 01:06), so a
   merge's area run, which sets it, runs no planted fault, and the release profile, which runs with plants on, still runs
   them all. This static check keeps a proof from creeping back without the read.

   A test file is an inline plant proof when a literal in its code (a quoted string, a template's text or a regular
   expression, comments set aside) holds a plant mark: "plant:" followed by a tag character, or "plant:" ending the
   literal, which is the mark built by concatenation ("/* plant:" + tag). A test quotes a mark for one reason, to find the
   line it marks and rewrite or remove it: on disk, in a scratch copy, or in memory, as a page loaded from rewritten
   source. A mark that sits only in a comment, the tag some other proof lifts or prose about one, is not quoted and does
   not make a proof; nor does a "plant" property or a word like "how.plant", which are code and not a mark in a literal.
   Such a proof must read ETIUDA_PLANTS or PLANTS_OFF in its code, comments set aside, so a comment saying it honours the
   switch does not pass; ETIUDA_PLANTS_COPY is another variable and does not count. This file is exempt: its marks are
   fixtures for the marker guard above, not a lifted guard of the product. Files under tests/ ending .mjs, .js or .cjs. */
const PLANT_MARK = /plant:(?:[A-Za-z0-9_-]|$)/;
const READS = /\bETIUDA_PLANTS\b|\bPLANTS_OFF\b/;
const PLANTS_OFF_SELF = "tests/plant-hold.mjs";
export { jsLiterals };

/* Every inline plant proof under tests/, and those that never read ETIUDA_PLANTS or PLANTS_OFF with the count of quoted marks. */
export function plantsOffScan(root) {
  const proofs = [], unread = [];
  const dir = path.join(root, "tests");
  const files = [];
  (function walk(abs, rel) {
    let names;
    try { names = fs.readdirSync(abs, { withFileTypes: true }); } catch { return; }
    for (const ent of names) {
      if (ent.name === "node_modules" || ent.isSymbolicLink()) continue;
      const r = rel + "/" + ent.name;
      if (ent.isDirectory()) walk(path.join(abs, ent.name), r);
      else if (ent.isFile() && /\.(?:mjs|js|cjs)$/.test(ent.name)) files.push(r);
    }
  })(dir, "tests");
  for (const rel of files.sort()) {
    if (rel === PLANTS_OFF_SELF) continue;
    let text;
    try { text = fs.readFileSync(path.join(root, rel), "utf8"); } catch { continue; }
    if (text.indexOf("plant:") < 0) continue;
    const { code, lits } = jsLiterals(text);
    const marks = lits.filter((l) => PLANT_MARK.test(l));
    if (!marks.length) continue;
    proofs.push(rel);
    if (!READS.test(code)) unread.push({ file: rel, marks: marks.length });
  }
  return { proofs, unread };
}

/* pk4 the plants-off check names a proof that never reads the switch, and passes one that does. Each case is a test file
   in a lab's tests/ folder; the lab is not a git tree and nothing in it runs. */
function pk4() {
  const lab = fs.mkdtempSync(path.join(os.tmpdir(), "plants-off-selftest-"));
  try {
    const dir = path.join(lab, "tests");
    fs.mkdirSync(path.join(dir, "deep"), { recursive: true });
    const Q = "plant" + ":";
    const cases = {
      "quoted.mjs": ["const mark = \"/* " + Q + "lab-quoted */\";\n", true],
      "joined.mjs": ["const mark = \"/* " + Q + "\" + tag + \" */\";\n", true],
      "templated.mjs": ["const mark = `/* " + Q + "${tag} */`;\n", true],
      "regex.mjs": ["const cut = src.replace(/\\r?\\n[^\\n]*" + Q + "lab-re[^\\n]*/g, \"\");\n", true],
      "deep/nested.cjs": ["const mark = '" + Q + "lab-nested';\n", true],
      "said-only.mjs": ["/* honours ETIUDA_PLANTS=off */\nconst mark = \"" + Q + "lab-said\";\n// PLANTS_OFF\n", true],
      "copy-only.mjs": ["if (process.env.ETIUDA_PLANTS_COPY) {}\nconst mark = \"" + Q + "lab-copy\";\n", true],
      "reads.mjs": ["const PLANTS_OFF = process.env.ETIUDA_PLANTS === \"off\";\nconst mark = \"" + Q + "lab-reads\";\n", false],
      "reads-env.mjs": ["if (process.env.ETIUDA_PLANTS !== \"off\") run(\"/* " + Q + "lab-env */\");\n", false],
      "comment-only.mjs": ["lazy = true; /* " + Q + "lab-target */\n// lifts " + Q + "lab-other elsewhere\n", false],
      "property.mjs": ["run({ " + Q + " true, how: 1 }); const how = { " + Q + " \"stray-note.txt\" };\n", false],
      "url-divide.mjs": ["const half = a / b; const url = \"https://x/\"; // " + Q + "lab-c\n", false],
      "data.json": ["{\"mark\": \"" + Q + "lab-json\"}\n", false],
    };
    for (const [rel, [body]] of Object.entries(cases)) fs.writeFileSync(path.join(dir, rel), body);
    fs.writeFileSync(path.join(dir, "plant-hold.mjs"), "const mark = \"" + Q + "lab-self\";\n");
    const scan = plantsOffScan(lab);
    const named = scan.unread.map((u) => u.file).sort();
    const want = Object.entries(cases).filter(([, [, red]]) => red).map(([rel]) => "tests/" + rel).sort();
    check(JSON.stringify(named) === JSON.stringify(want),
      "pk4 the plants-off check names each quoted, joined, templated, regex and nested mark with no read of the switch, a read"
      + " only in a comment or of ETIUDA_PLANTS_COPY included, and passes a read, a comment-only mark, a plant property and"
      + " this file: named " + named.join(", "));
    check(scan.proofs.indexOf("tests/reads.mjs") >= 0 && scan.proofs.indexOf("tests/reads-env.mjs") >= 0
      && scan.proofs.indexOf("tests/comment-only.mjs") < 0 && scan.proofs.indexOf("tests/plant-hold.mjs") < 0,
      "pk4 a proof that reads the switch is still counted a proof, and a comment-only mark and this file are not: proofs "
      + scan.proofs.join(", "));
  } finally {
    fs.rmSync(lab, { recursive: true, force: true });
  }
}

function pkPlantGuard() {
  const lab = fs.mkdtempSync(path.join(os.tmpdir(), "plant-guard-selftest-"));
  const selfScript = fileURLToPath(import.meta.url);
  try {
    spawnSync("git", ["init", "-b", "main"], { cwd: lab, windowsHide: true });
    spawnSync("git", ["config", "user.name", "Test"], { cwd: lab, windowsHide: true });
    spawnSync("git", ["config", "user.email", "test@example.com"], { cwd: lab, windowsHide: true });

    const sampleRel = "sample.js";
    const sampleAbs = path.join(lab, sampleRel);
    const originalContent = "// plant:test-marker\nconst x = 1;\n";
    fs.writeFileSync(sampleAbs, originalContent);
    spawnSync("git", ["add", sampleRel], { cwd: lab, windowsHide: true });
    spawnSync("git", ["commit", "-m", "init"], { cwd: lab, windowsHide: true });

    // Check 1: clean HEAD has no violations
    const v1 = checkPlantMarkers(lab);
    check(v1.length === 0, "clean repository has no missing plant markers");

    // Check 2: lifted plant marker with no mark is refused with file and missing tag
    fs.writeFileSync(sampleAbs, "const x = 1;\n");
    const v2 = checkPlantMarkers(lab);
    check(v2.length === 1 && v2[0].file === sampleRel && v2[0].missing.includes("plant:test-marker"),
      "lifted plant marker with no mark is refused with file and missing tag");

    const report = plantMarkerReport(v2);
    check(report.includes(sampleRel) && report.includes("plant:test-marker") && report.includes("git checkout -- " + sampleRel),
      "refusal report names the file, missing tag, and git checkout restore command");

    // Check 3: line restored via git checkout goes green
    spawnSync("git", ["checkout", "--", sampleRel], { cwd: lab, windowsHide: true });
    const v3 = checkPlantMarkers(lab);
    check(v3.length === 0, "restoring marker via git checkout makes check clean again");

    // Check 4: countPlantMarkers handles multiple tags
    const multi = countPlantMarkers("// plant:alpha\n// plant:beta\n// plant:alpha\n");
    check(multi.get("alpha") === 2 && multi.get("beta") === 1,
      "countPlantMarkers correctly tallies counts for multiple tags");

    // Check 5: committing a removed plant does not trip the check
    fs.writeFileSync(sampleAbs, "const x = 2;\n");
    spawnSync("git", ["add", sampleRel], { cwd: lab, windowsHide: true });
    spawnSync("git", ["commit", "-m", "remove plant deliberately"], { cwd: lab, windowsHide: true });
    const v5 = checkPlantMarkers(lab);
    check(v5.length === 0, "deliberately removed and committed plant does not trip check");

    // Restore initial commit with plant marker to test CLI invocation
    spawnSync("git", ["reset", "--hard", "HEAD~1"], { cwd: lab, windowsHide: true });

    // CLI test: --guard clean exits 0
    const cliClean = spawnSync(process.execPath, [selfScript, "--guard", "--root", lab], {
      windowsHide: true,
      encoding: "utf8",
    });
    check(cliClean.status === 0, "CLI --guard on clean repository exits 0");

    // CLI test: --guard with lifted marker exits 1, naming file, missing tag, and git checkout
    fs.writeFileSync(sampleAbs, "const x = 1;\n");
    const cliRefused = spawnSync(process.execPath, [selfScript, "--guard", "--root", lab], {
      windowsHide: true,
      encoding: "utf8",
    });
    check(cliRefused.status === 1 &&
      cliRefused.stderr.includes(sampleRel) &&
      cliRefused.stderr.includes("plant:test-marker") &&
      cliRefused.stderr.includes("git checkout -- " + sampleRel),
      "CLI --guard with lifted marker exits 1, naming file, missing tag, and git checkout");

    // CLI test: restoring marker makes CLI --guard exit 0
    spawnSync("git", ["checkout", "--", sampleRel], { cwd: lab, windowsHide: true });
    const cliRestored = spawnSync(process.execPath, [selfScript, "--guard", "--root", lab], {
      windowsHide: true,
      encoding: "utf8",
    });
    check(cliRestored.status === 0, "CLI --guard with marker restored exits 0");

    // C2: a root that is not a git tree passes, and says the markers were not checked
    const nogitLab = fs.mkdtempSync(path.join(os.tmpdir(), "plant-guard-nogit-"));
    try {
      fs.writeFileSync(path.join(nogitLab, "sample.js"), "// plant:test-marker\nconst x = 1;\n");
      const cliNoGit = spawnSync(process.execPath, [selfScript, "--guard", "--root", nogitLab], {
        windowsHide: true,
        encoding: "utf8",
      });
      const nogitOut = (cliNoGit.stdout || "") + (cliNoGit.stderr || "");
      check(cliNoGit.status === 0 && /markers not checked: .* is not a git tree/.test(nogitOut),
        "a root that is not a git tree passes and says the markers were not checked: exit " + cliNoGit.status);
    } finally {
      try { fs.rmSync(nogitLab, { recursive: true, force: true }); } catch { /* nogit */ }
    }

    // C1: a git repository with no commit refuses with 78, naming the git command
    const noCommitLab = fs.mkdtempSync(path.join(os.tmpdir(), "plant-guard-nocommit-"));
    try {
      spawnSync("git", ["init", "-q", "-b", "main"], { cwd: noCommitLab, windowsHide: true });
      fs.writeFileSync(path.join(noCommitLab, "sample.js"), "// plant:test-marker\n");
      const cliNoCommit = spawnSync(process.execPath, [selfScript, "--guard", "--root", noCommitLab], {
        windowsHide: true,
        encoding: "utf8",
      });
      const noCommitOut = (cliNoCommit.stderr || "") + (cliNoCommit.stdout || "");
      check(cliNoCommit.status === 78 && noCommitOut.includes("rev-parse"),
        "a git repository with no commit refuses with 78 naming the git command: exit " + cliNoCommit.status);
    } finally {
      try { fs.rmSync(noCommitLab, { recursive: true, force: true }); } catch { /* nocommit */ }
    }
  } finally {
    try { fs.rmSync(lab, { recursive: true, force: true }); } catch { /* lab */ }
  }
}

function modeOf() {
  if (process.argv.indexOf("--guard") >= 0) return "guard";
  if (process.argv.indexOf("--compare") >= 0) return "compare";
  if (process.argv.indexOf("--record") >= 0) return "record";
  if (process.argv.indexOf("--self") >= 0 || process.argv.indexOf("--selftest") >= 0) return "self";
  return "legs";
}

const mode = modeOf();

if (mode === "guard") {
  const root = sealRoot();
  const marks = readMarks(root);
  if (marks.length) {
    printRestore(marks, process.stderr);
    process.exit(1);
  }
  const violations = checkPlantMarkers(root);
  if (violations.length) {
    process.stderr.write(plantMarkerReport(violations) + "\n");
    process.exit(1);
  }
  process.exit(0);
}

if (mode === "record") {
  const wrote = writeChainRecord(sealRoot());
  if (!wrote.ok) {
    process.stderr.write("FAIL chain record " + wrote.why + "\n");
    process.exit(1);
  }
  process.stdout.write("chain record " + wrote.n + " files\n");
  process.exit(0);
}

if (mode === "compare") {
  const compared = compareChainRecord(sealRoot());
  for (const line of compared.lines) {
    if (line.indexOf("FAIL ") === 0) process.stderr.write(line + "\n");
    else process.stdout.write(line + "\n");
  }
  process.exit(compared.code);
}

const root = sealRoot();
const already = readMarks(root);
if (already.length) {
  printRestore(already, process.stderr);
  process.exit(1);
}
const violations = checkPlantMarkers(root);
if (violations.length) {
  process.stderr.write(plantMarkerReport(violations) + "\n");
  process.exit(1);
}

const recorded = writeChainRecord(root);
if (recorded.ok) process.stdout.write("chain record " + recorded.n + " files\n");
else if (recorded.why !== "no-git") check(false, "chain record: " + recorded.why);

const plantsOff = plantsOffScan(root);
for (const u of plantsOff.unread) {
  process.stderr.write("plants-off: " + u.file + " quotes " + u.marks + " plant mark(s) and never reads ETIUDA_PLANTS or PLANTS_OFF\n");
}
check(plantsOff.unread.length === 0,
  "pk-off every inline plant proof under tests/ reads ETIUDA_PLANTS or PLANTS_OFF (" + plantsOff.proofs.length + " proofs"
  + (plantsOff.unread.length ? "; refused: " + plantsOff.unread.map((u) => u.file).join(", ") : "") + ")");

if (mode === "self") {
  try {
    pk0();
    pk0d();
    pk2();
    await pk1();
    await pk3();
    pkPlantGuard();
    pk4();
  } catch (e) {
    check(false, "plant-hold harness: " + (e && e.stack ? e.stack.split("\n").slice(0, 4).join(" / ") : e));
  }
}
console.log("#counts checks=" + asserted + " failed=" + failed);
process.exit(failed ? 1 : 0);
