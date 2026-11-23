/* WHAT THE DOOR'S TEARDOWN ASKS TASKKILL FOR (board 832, the Studio half of board 829).
 *
 *     node tests/kill-tree.mjs
 *
 * tests/shell-door.mjs killTree ended every window a Studio suite opened with `taskkill /F /PID n /T`,
 * and /T picks children by ParentProcessId alone: a process whose recorded parent has exited is taken
 * when a later launch reuses that pid (two processes of another seat stopped that way). The engine's
 * own killTree, which the pin carries, reads Win32_Process and takes a child only if it was created
 * after its parent, then kills each pid without /T. The door now asks it, rather than keep a second
 * copy of the rule. Each leg here is the engine's 28g/28h/28m over Studio's door:
 *   1a  a spy on every door of child_process and on process.kill, fed a table with an older orphan carrying
 *       the launch's pid as its recorded parent: the launch, its children and its grandchild are each ended
 *       by pid, by taskkill or by process.kill (the engine's board 829 kills each pid with process.kill),
 *       no taskkill carries /T, the orphan and its child are named nowhere, and the pids handed back for
 *       waitGone are exactly those. Red on the rule the door had.
 *   1b  the control: the same spy over a caller that asks for /T through each door in turn records
 *       every one, so 1a's silence is the door's and not a recorder that looks at one way in
 *   1c  a launch the table does not hold is answered as gone: no taskkill, its own pid handed back
 *   1f  the plant: the same spy over a copy of the door whose teardown asks taskkill /F /PID n /T, which is
 *       the rule the door had. 1a's own predicate must call it red, and the spy must have seen the /T.
 *   1d  LIVE, Windows only: a launch, its child and its grandchild (real processes, the children
 *       detached from libuv's job) are gone after the kill and an unrelated process stands. Green on
 *       both rules: it is the control that the door still ends a tree
 * Nothing real is asked or killed by 1a to 1c: the spy answers PowerShell and records taskkill and process.kill,
 * running neither (a probe with signal 0 is recorded and is not an end).
 * The spy child is patched to win32 where the host is not. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DOOR = pathToFileURL(path.join(HERE, "shell-door.mjs")).href;
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-studio-kill-tree-"));
const EXPECTED = 7;
let spies = 0;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const pause = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/* The process table the engine's own selftest 28g uses: 100 is the launch, 200 and 700 its children,
   300 the grandchild; 400 an older process whose recorded parent is 100 (the reused pid), 600 its
   child; 500 a stranger. Rows are [pid, parent, created]. */
const TABLE = [[100, 1, 1000], [200, 100, 1100], [300, 200, 1200], [700, 100, 1300], [400, 100, 500], [600, 400, 600], [500, 1, 900]];

/* THE SPY. Every door of child_process is replaced before anything loads it: PowerShell answers the
   table, any taskkill by whichever door is recorded and never run, and every other call is handed on.
   process.kill is replaced too, recorded as ["process.kill", pid, signal] and never run (the pinned engine ends
   each pid with it since its board 829).
   `ask` is the code that runs after the doors are replaced, with `calls` in scope. */
function spy(ask, table, door, pre) {
  const code = 'Object.defineProperty(process, "platform", { value: "win32" });'
    + 'const cp = require("child_process"), calls = [];'
    + 'const T = ' + JSON.stringify(table) + '.map(function (r) { return { pid: r[0], parent: r[1], created: r[2] }; });'
    + 'const toks = function (c, a) { return Array.isArray(a) ? [String(c)].concat(a.map(String)) : String(c).split(/\\s+/); };'
    + 'const fakes = { execFileSync: "", execSync: "", spawnSync: { status: 0, stdout: "", stderr: "" } };'
    + '["execFileSync", "execSync", "spawnSync", "spawn", "exec", "execFile"].forEach(function (n) {'
    + '  const real = cp[n];'
    + '  cp[n] = function (c, a) { const t = toks(c, a);'
    + '    if (n === "spawnSync" && /powershell/i.test(t[0])) { calls.push(["powershell"]); return { status: 0, stdout: JSON.stringify(T), stderr: "" }; }'
    + '    if (t.some(function (x) { return /taskkill/i.test(x); })) { calls.push(t.concat("via " + n));'
    + '      return n in fakes ? fakes[n] : { pid: 0, on: function () { return this; }, unref: function () {} }; }'
    + '    return real.apply(this, arguments); }; });'
    + 'process.kill = function (pid, sig) { calls.push(["process.kill", String(pid), String(sig)]); return true; };'
    + (pre || "") + '(async function () { const door = await import(' + JSON.stringify(door || DOOR) + ');' + ask
    + ' })().catch(function (e) { console.log("THREW " + e.message); process.exit(1); });';
  const file = path.join(SCRATCH, "spy-" + (++spies) + ".cjs");
  fs.writeFileSync(file, code);
  const r = spawnSync(process.execPath, [file], { encoding: "utf8", timeout: 60000 });
  const out = String(r.stdout || "") + String(r.stderr || "");
  const m = /^CALLS (\[.*\]) GOT (.*)$/m.exec(out);
  return { status: r.status, out, calls: m ? JSON.parse(m[1]) : [], got: m ? JSON.parse(m[2]) : null, found: !!m };
}
const SAY = 'console.log("CALLS " + JSON.stringify(calls) + " GOT " + JSON.stringify(got));';
const taskkills = calls => calls.filter(c => c.some(x => /taskkill/i.test(x)));
const ends = calls => calls.filter(c => c[0] === "process.kill" && c[2] !== "0");
const killed = calls => taskkills(calls).concat(ends(calls));
const pidsOf = calls => taskkills(calls).map(c => Number(c[c.indexOf("/PID") + 1])).concat(ends(calls).map(c => Number(c[1]))).sort((a, b) => a - b);
const slashT = calls => taskkills(calls).filter(c => c.some(x => /^[\/-]t$/i.test(x)));
/* 1a's predicate, a function so that 1f can ask it of a door it must refuse */
const rightKill = a => a.status === 0 && a.found && a.calls.some(c => c[0] === "powershell") && slashT(a.calls).length === 0
  && pidsOf(a.calls).join() === "100,200,300,700" && Array.isArray(a.got) && a.got.slice().sort((x, y) => x - y).join() === "100,200,300,700";

try {
  const a = spy('const got = door.killTree(100);' + SAY, TABLE);
  check(rightKill(a),
    "1a the door's teardown over the engine's 28g table ends the launch, its children and its grandchild by pid (taskkill or process.kill), no taskkill carries /T,"
    + " the orphan 400 and its child 600 are named nowhere, and the pids handed to waitGone are those four: "
    + (a.found ? JSON.stringify({ killed: pidsOf(a.calls), withT: slashT(a.calls).length, got: a.got, via: killed(a.calls).map(c => c[0] === "process.kill" ? "process.kill" : "taskkill").filter((x, i, l) => l.indexOf(x) === i) }) : "(no CALLS line) " + a.out.trim().slice(0, 200)));

  const b = spy('const cp2 = require("child_process");'
    + 'cp2.execFileSync("taskkill", ["/F", "/PID", "1", "/T"]); cp2.execSync("taskkill /F /PID 2 /T"); cp2.spawnSync("taskkill", ["/F", "/PID", "3", "/T"]);'
    + 'cp2.spawn("taskkill", ["/F", "/PID", "4", "/T"]); cp2.exec("taskkill /F /PID 5 /T", function () {}); cp2.execFile("taskkill", ["/F", "/PID", "6", "/T"], function () {});'
    + 'const got = null;' + SAY, TABLE);
  check(b.found && slashT(b.calls).length === 6 && pidsOf(b.calls).join() === "1,2,3,4,5,6",
    "1b CONTROL: the same spy over a caller that asks for /T through execFileSync, execSync, spawnSync, spawn, exec and execFile records all "
    + slashT(b.calls).length + " of the 6, so 1a's silence is the door's: " + (b.found ? JSON.stringify(b.calls.map(c => c[c.length - 1])) : b.out.trim().slice(0, 160)));

  const gone = spy('const got = door.killTree(4242);' + SAY, TABLE);
  check(gone.found && killed(gone.calls).length === 0 && Array.isArray(gone.got) && gone.got.join() === "4242",
    "1c a launch the table does not hold is answered as gone: no taskkill was asked (" + killed(gone.calls).length + ") and its own pid is what waitGone is handed: "
    + JSON.stringify(gone.got));

  /* 1f. THE PLANT: the door's own source with its teardown put back to `taskkill /F /PID n /T`, copied beside
     debug-port.mjs into scratch and asked under the same spy. 1a's predicate must call it wrong, and the spy must
     have recorded the /T, or the plant proved nothing. */
  {
    const PLANT = path.join(HERE, "..", "scratch", "kill-tree-plant");
    fs.rmSync(PLANT, { recursive: true, force: true });
    fs.mkdirSync(path.join(PLANT, "tests"), { recursive: true });
    for (const f of ["debug-port.mjs", "window-wall.mjs", "launch-wait.mjs"]) fs.copyFileSync(path.join(HERE, f), path.join(PLANT, "tests", f));
    /* The door seats a window it opens (tests/seated.mjs, since c2906cc5), and seated.mjs reads src/licence.mjs beside it, which a
       scratch tree has not; so the copy's seated.mjs is this tree's own, handed through. */
    fs.writeFileSync(path.join(PLANT, "tests", "seated.mjs"), "export * from " + JSON.stringify(pathToFileURL(path.join(HERE, "seated.mjs")).href) + ";\n");
    /* shell-door.mjs takes the installed app's check from tools/gate-run.mjs (real-profile attribution), so the copy carries it. */
    fs.mkdirSync(path.join(PLANT, "tools"), { recursive: true });
    for (const f of ["gate-run.mjs", "machine-lock.mjs"]) fs.copyFileSync(path.join(HERE, "..", "tools", f), path.join(PLANT, "tools", f));
    const was = fs.readFileSync(path.join(HERE, "shell-door.mjs"), "utf8");
    const from = '    refuseWithoutPin("the door\'s teardown");\n'
      + '    const did = createRequire(import.meta.url)(PINNED_ENGINE).killTree(pid);\n'
      + '    return [...new Set([pid].concat((did && did.taken) || []))].filter(p => p !== process.pid);\n';
    const planted = was.split(from).length === 2;
    fs.writeFileSync(path.join(PLANT, "tests", "shell-door.mjs"), was.replace(from, () =>
      '    createRequire(import.meta.url)("child_process").execFileSync("taskkill", ["/F", "/PID", String(pid), "/T"]);\n    return [pid];\n'));
    const p = spy('const got = door.killTree(100);' + SAY, TABLE, pathToFileURL(path.join(PLANT, "tests", "shell-door.mjs")).href);
    try { fs.rmSync(PLANT, { recursive: true, force: true }); } catch (x) { /* scratch/ is ignored; the next run clears it */ }
    check(planted && p.found && !rightKill(p) && slashT(p.calls).length === 1,
      "1f PLANT: a door whose teardown asks taskkill with /T is called wrong by 1a's own predicate, and the spy saw the /T (" + slashT(p.calls).length + " call(s) with it): "
      + (p.found ? JSON.stringify({ killed: pidsOf(p.calls), withT: slashT(p.calls).length }) : (planted ? "" : "(the door's source no longer has the teardown this plant replaces) ") + p.out.trim().slice(0, 160)));
  }

  /* 1e. A TREE WITH NO PIN REFUSES BEFORE A WINDOW EXISTS, and never falls back to /T. The door and
     debug-port.mjs are copied into scratch/kill-tree-nopin/tests, whose root has no engine/pinned, and
     asked under the spy with spawn replaced by a recorder that throws (called through .call, so launch-door 4e does not count a suite that opens no window): openStudio must refuse in words
     before it spawns anything, and killTree must refuse in words with no taskkill and no table read. */
  {
    const NOPIN = path.join(HERE, "..", "scratch", "kill-tree-nopin");
    fs.rmSync(NOPIN, { recursive: true, force: true });
    fs.mkdirSync(path.join(NOPIN, "tests"), { recursive: true });
    fs.mkdirSync(path.join(NOPIN, "p"), { recursive: true });
    for (const f of ["shell-door.mjs", "debug-port.mjs", "window-wall.mjs", "launch-wait.mjs"]) fs.copyFileSync(path.join(HERE, f), path.join(NOPIN, "tests", f));
    fs.writeFileSync(path.join(NOPIN, "tests", "seated.mjs"), "export * from " + JSON.stringify(pathToFileURL(path.join(HERE, "seated.mjs")).href) + ";\n");
    fs.mkdirSync(path.join(NOPIN, "tools"), { recursive: true });
    for (const f of ["gate-run.mjs", "machine-lock.mjs"]) fs.copyFileSync(path.join(HERE, "..", "tools", f), path.join(NOPIN, "tools", f));
    const PRE = 'const spawned = []; cp.spawn = function (c) { spawned.push(String(c)); throw new Error("SPAWNED " + c); };';
    const e = spy('let o = null, k = null;'
      + 'try { await door.openStudio.call(null, "1e", { projects: ' + JSON.stringify(path.join(NOPIN, "p")) + ', userDataDir: ' + JSON.stringify(path.join(NOPIN, "ud")) + ' }); o = "opened"; }'
      + ' catch (x) { o = x.message; }'
      + 'try { k = JSON.stringify(door.killTree(4242)); } catch (x) { k = x.message; }'
      + 'const got = { o: o, k: k, spawned: spawned };' + SAY,
      TABLE, pathToFileURL(path.join(NOPIN, "tests", "shell-door.mjs")).href, PRE);
    try { fs.rmSync(NOPIN, { recursive: true, force: true }); } catch (x) { /* scratch/ is ignored; the next run clears it */ }
    const g = e.got || {};
    check(e.found && /no pin at .*engine-fetch/.test(String(g.o)) && Array.isArray(g.spawned) && g.spawned.length === 0
          && /no pin at .*engine-fetch/.test(String(g.k)) && e.calls.length === 0,
      "1e with no pin, openStudio refuses in words before it spawns anything (" + (g.spawned ? g.spawned.length : "?") + " spawn(s)) and killTree refuses"
      + " in words with no taskkill and no table read (" + e.calls.length + " call(s)): "
      + (e.found ? JSON.stringify({ openStudio: String(g.o).slice(0, 90), killTree: String(g.k).slice(0, 60) }) : e.out.trim().slice(0, 200)));
  }

  if (process.platform === "win32") {
    /* A three-level tree of real processes and a bystander; the children are detached so that they leave the job
       object libuv gives a parent's children, without which they die with the parent whatever the door does. */
    const base = path.join(SCRATCH, "tree");
    const midJs = path.join(SCRATCH, "mid.js"), rootJs = path.join(SCRATCH, "root.js");
    fs.writeFileSync(midJs, 'const cp = require("child_process"), fs = require("fs");\n'
      + 'const leaf = cp.spawn(process.execPath, ["-e", "setInterval(function(){}, 1000);"], { stdio: "ignore", detached: true });\n'
      + 'fs.writeFileSync(process.argv[2] + ".leaf", String(leaf.pid));\nsetInterval(function () {}, 1000);\n');
    fs.writeFileSync(rootJs, 'const cp = require("child_process"), fs = require("fs");\n'
      + 'const mid = cp.spawn(process.execPath, [process.argv[2], process.argv[3]], { stdio: "ignore", detached: true });\n'
      + 'fs.writeFileSync(process.argv[3] + ".mid", String(mid.pid));\nsetInterval(function () {}, 1000);\n');
    const root = spawn(process.execPath, [rootJs, midJs, base], { stdio: "ignore" });
    const bystander = spawn(process.execPath, ["-e", "setInterval(function(){}, 1000);"], { stdio: "ignore" });
    for (let i = 0; i < 100 && !fs.existsSync(base + ".leaf"); i++) pause(100);
    const read = f => { try { return Number(fs.readFileSync(f, "utf8")); } catch (e) { return 0; } };
    const mid = read(base + ".mid"), leaf = read(base + ".leaf");
    const door = await import(DOOR);
    const alive = pids => pids.map(p => !!p && door.stillUp([p]).length === 1);
    const before = alive([root.pid, mid, leaf, bystander.pid]);
    const got = door.killTree(root.pid);
    const left = await door.waitGone(got, 15000);
    const after = alive([root.pid, mid, leaf, bystander.pid]);
    for (const p of [bystander.pid, root.pid, mid, leaf]) { try { if (p) process.kill(p); } catch (e) { /* already gone */ } }
    check(before.every(Boolean) && after.slice(0, 3).every(x => !x) && after[3] && left.length === 0
          && [root.pid, mid, leaf].every(p => got.indexOf(p) > -1),
      "1d LIVE CONTROL: a launch, its child and its grandchild, three real processes, are alive before the door's teardown (" + before.join()
      + ") and gone after (" + after.slice(0, 3).join() + "), with an unrelated process still standing (" + after[3] + "), and the pids handed to waitGone name all three: "
      + JSON.stringify(got));
  } else {
    asserted++;
    process.stdout.write("  NOT RUN 1d is the door over real processes on Windows; on " + process.platform + " 1a to 1c hold the calls\n");
  }
} finally {
  dropScratch(SCRATCH, "tests/kill-tree.mjs");
}

check(asserted + 1 === EXPECTED, "9 every leg ran: " + (asserted + 1) + " of " + EXPECTED + " assertion(s)");
process.stdout.write("kill-tree: " + asserted + " assertion(s), " + failed + " failure(s)\n");
process.exit(failed ? 1 : 0);
