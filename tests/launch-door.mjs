/* EVERY LAUNCH OF STUDIO'S SHELL IN tests/ IS ACCOUNTED FOR, AND THE ACCOUNT IS A REGISTER.
 *
 *     node tests/launch-door.mjs
 *
 * WHAT CAN GO WRONG, and it has, next door. Studio's shell reads two things from outside itself:
 * the user-data folder, which is where its store lives, and STUDIO_PROJECTS, which is where it
 * looks for projects. A launcher that forgets the first writes the store of whoever is at this
 * desk. A launcher that forgets the second reads and WRITES the person's own projects folder,
 * Documents/Etiuda Studio, and a gate that edits a card in there will do it silently and be
 * green about it. The engine met the first half of this on 2026-09-17 - two labs on one desk
 * wrote the real profile - and answered it with one door, E.shellLaunch, board item 467.
 *
 * THIS IS NOT THE DOOR, IT IS THE ACCOUNT OF ONE. What this gate does is make the exceptions
 * NAMED and the requirement CHECKED: every direct launch must pass --user-data-dir at the call and
 * must name STUDIO_PROJECTS at the call, and every file that launches directly is written down
 * here by name. On the morning of 2026-09-17 that was fifteen files, each spawning Electron with
 * three lines of its own, and rewriting them while two seats edited this tree was a worse trade
 * than the fault was worth. In the afternoon it became one, board item 492: tests/shell-door.mjs
 * is the door, and the fifteen suites each lost their launcher and call it.
 *
 * THE CEILING WAS A NUMBER SOMEBODY RAISED, and the harness ruled on it on 2026-09-17. Until that
 * day this file held the direct launchers to an integer, DIRECT_CEILING, declared to move one way.
 * It went 11 to 14 in the morning and 14 to 15 at 14:56, each raise correct on its own terms, each
 * made by the seat the number was there to constrain, and each because Studio had gained a screen
 * and a screen suite has to open a window. That is the fault in the instrument rather than in the
 * hand: the quantity it bounded is a function of how many screens Studio has, so the bound is
 * crossed by work that adds no risk at all, and the only available answer is a larger digit. A
 * ratchet that moves in the direction it was declared never to move is a reminder wearing a gate's
 * clothes. It was also one-sided: converting a launcher to the door lowered the count and left the
 * ceiling where it was, so the debt this file wrote down could only ever overstate it, and nothing
 * would have said so.
 *
 * SO IT ASSERTS THE SET INSTEAD. DIRECT_LAUNCHERS below names every file that launches the shell
 * without the engine's door, and the set found on disk must equal it exactly. A file that takes on
 * the debt fails naming itself, so the cost of taking it on is a line and a sentence rather than an
 * increment - the smallest edit that can satisfy this gate now says WHICH file and WHY, and the
 * diff carries it. A file that pays the debt off fails until its line is struck, so the register
 * cannot rot and the count in it is the true one. The length of the register is still the debt; it
 * can no longer be moved by touching a digit.
 *
 * WHAT IT STILL CANNOT DO is refuse a new screen. No gate can, and one that tried would be refusing
 * the work. What it can do is make sure the debt is declared, current, and legible in one place, and
 * that is what the register is for. The work the register asked for was one door for Studio's own
 * shell, and it was built the same afternoon: the register is one line and stays one line however
 * many screens Studio gains, because a screen suite no longer launches anything. A second line is
 * now a finding rather than the ordinary price of a screen, which is the reading the ceiling could
 * never give at any digit.
 *
 * AND A FLOOR, because a count that falls to zero takes the gate's liveness with it. A rename of
 * the Electron path, a move to a helper, a suite that stops launching anything: each of those
 * empties the scan, and an empty scan passes every rule it has. The register is the first answer
 * to that - a blind scan reports every name on it as stale, by name - and the floor is the second,
 * for the day the register is blind too. It stood at 14 against 16 sites while fifteen files
 * launched; with the door it stands at 2 against 3, which are the door's two launches and
 * installer.mjs's one. The number it bounds is now a property of the door rather than of how many
 * screens Studio has, which is what makes it a floor that can stay where it is.
 *
 * ITS OWN CONTROLS ARE THE LAST CHECKS, and they are why this file is worth having. A gate that has
 * never rejected anything has been written rather than tested. Three files are planted under tests/
 * in turn, each wrong in one way - no user-data folder and no projects folder; the projects folder
 * named only in a comment far from the call; a launcher in a SUBFOLDER, where the scan was blind
 * until today - and each must be caught by name and must land on the register as unregistered.
 * They are removed in a finally and whether they are gone is printed. Two more controls need no
 * file: a register entry for a file that launches nothing must be reported stale, which is the
 * half of the rule the old ceiling could not express at all; and a benign twin, two sources
 * identical but for the spawn's first argument, holds the node rule to both answers, because a
 * rule that only ever excludes is invisible to its own red leg.
 *
 * AND SINCE BOARD ITEM 629, SECTION 4: WHAT A RUN OFF WINDOWS HAS NOT LOOKED AT. tests/off-windows.mjs
 * is the sentence the suite says about itself on any platform but this desk, and the figures in it
 * are properties of tests/ as a whole. This gate is the only one in the tree that reads every file
 * under tests/ and needs neither a window nor the pin to do it, so it is the only place those
 * figures can be held to the tree without adding a gate that would itself need a home. The register
 * above is the account of what the suite LAUNCHES; section 4 is the account of what it does not
 * look at, over the same set of files, and it DRIVES both arms rather than reading the source,
 * because the one claim that matters - that installer.mjs asks before it spawns - is an ordering,
 * and no leg over source text has ever been able to see one.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dropScratch } from "./scratch.mjs";
import { NOT_PROVED_OFF_WINDOWS, offWindowsNotice, notRunReason, scanWindowSuites } from "./off-windows.mjs";
import { wordsOf } from "./shell-door.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SELF = path.basename(fileURLToPath(import.meta.url));

/* THE REGISTER: every file under tests/ that launches Studio's shell without the engine's door,
   and nothing else. Fifteen files on the morning of 2026-09-17 and one line since the afternoon,
   which is what the door was for. Adding a name is taking on debt and the line should say why;
   striking one is paying it off. Both directions are checked below. */
const DIRECT_LAUNCHERS = [
  /* THE DOOR ITSELF. Something has to call spawn, and tests/shell-door.mjs is the one thing here
     that does: it passes the user-data folder and the projects folder at both of its two launches,
     refuses rather than spawning where either is missing or points at this desk's own Studio
     profile or this person's own projects, and kills the process TREE on the way out rather than
     the process. Every screen suite goes through it. A second name under this one is a launcher
     that has gone round it, and the line it arrives with should say why that was worth doing. */
  "shell-door.mjs",
];

/* The floor: how many launch SITES there are at all, 3 with the door in place - two inside it,
   one in installer.mjs - held at 2 so that a refactor INSIDE the door does not redden it for the
   wrong reason. The register above is what actually keeps this gate live; this is the backstop
   for a scan that has gone blind. */
const SITES_FLOOR = 2;

/* The files that put every launch to the engine's door, board item 471. They are not direct
   launchers and are not on the register; the exemption is a list rather than a rule somebody has
   to remember. round-trip.mjs calls E.shellLaunch itself. installer.mjs asks
   E.shellLaunchRefusal and spawns only on a null, which is the same judgement with the exit
   removed: E.refuse() leaves the process past a finally, and that file has an installed app to
   take off the machine on its way out. update-install.mjs does as installer.mjs does, asking
   E.shellLaunchRefusal and launching only on a null; it deletes STUDIO_PROJECTS on purpose, so
   that the stored settings file, not the variable, decides the projects folder it reads back. */
const THROUGH_THE_DOOR = ["round-trip.mjs", "installer.mjs", "update-install.mjs"];

const LAUNCH = /\bspawn(?:Sync)?\s*\(/g;
/* What makes a spawn a launch of the SHELL rather than of node or of a tool. Kept to four
   spellings, three of them a path to an Electron binary and the fourth the environment variable
   the shell's own gate mode reads; a fifth appearing is caught by the floor going the wrong way
   rather than by this list being complete. */
/* AND THE FIFTH SPELLING IS THE BINARY WITHOUT ITS EXTENSION, board item 629. An Electron
   installed anywhere but Windows leaves node_modules/electron/dist/electron, no suffix, and until
   2026-09-20 this list could not see it: measured, sitesIn over two sources identical but for
   that one word answered 1 site for electron.exe and 0 for electron. That is not a red, which is
   what makes it worth a line - a launcher written on a Linux runner, or a Windows one that moved
   to the extensionless spelling, would simply not be a launch as far as this register is
   concerned, and the register's whole claim is that it names every one of them. The floor at 1d
   is the backstop for exactly this, and a floor catches the day the scan goes blind entirely
   rather than the day it goes blind about one file. The spelling is anchored on "dist" so that
   the ordinary English word electron in a comment is not a launch; 3c and 3d hold both arms. */
const IS_SHELL = /electron\.exe|electronExe\(\)|Etiuda Studio\.exe|STUDIO_GATE|"dist",\s*"electron"|dist[/\\]electron\b/;
/* AND WHAT MAKES IT CERTAINLY NOT ONE: its first argument is this Node. Every suite here builds
   its fixtures with `spawnSync(process.execPath, ["tools/fixtures/generate.mjs", ...])`, and in
   shell-launch.mjs that call sits nine lines under a function holding the word electron.exe, so
   the window read it as a launch of the shell. It cost nothing while STUDIO_PROJECTS anywhere in
   the file was enough; the moment the projects folder was read at the CALL, the gate produced its
   first false finding, against shell-launch.mjs:59. Five sites in five files were this, every one
   of them a spawn of node: import-screen:51, installer:170, shell-launch:59, stats-screen:66,
   upgrade-screen:86. A spawn of node is never a launch of the shell, whatever is written near it. */
const NOT_SHELL_FIRST_ARG = /^process\.execPath\b/;
/* THE WINDOW LOOKS BOTH WAYS, and the first version of this file did not, which is why it found
   two launch sites where the repository has ten. `const exe = path.join(..., "electron.exe")`
   sits on the line ABOVE the spawn, and in one file the argument array with --user-data-dir in
   it is built two lines above as well. Looking back costs the possibility that a neighbouring
   launch's flag is read as this one's; that is the safe direction for a register and the wrong
   one for a finding, so the controls plant files with nothing else in them.
     THE PROJECTS FOLDER IS READ IN THE SAME WINDOW AS THE FLAG, since 2026-09-17. Until then it
   was enough for STUDIO_PROJECTS to appear ANYWHERE in the file, which a header paragraph about
   the projects folder satisfies - and this file's own prose is proof that such a paragraph is the
   ordinary case here. A launcher could name it in a comment, pass it nowhere, and be green.
     LOOKING BACK 1200 RATHER THAN 600, also since 2026-09-17, and for one measured reason: at 600
   the scan could not see installer.mjs:205 at all, because that launch builds its argument array
   and its environment sixteen lines above the call. A launch the scan cannot see is not a launch
   it judges leniently, it is one it does not judge; that file puts its launches to the engine's
   door, so nothing was wrong, but the gate did not know it. Widening it costs the risk that a
   neighbour's flags read as this call's, which is why the node rule below and the twin at 3a and
   3b exist: measured over this tree, the wider window adds installer.mjs:205 and nothing false. */
const BACK = 1200, FORWARD = 1200;

/** Every .mjs under tests/, at any depth, named by its path relative to tests/ with forward
 *  slashes. RECURSIVE since 2026-09-17: the scan read the top level only, so a launch in a
 *  subfolder - tests/lint-pairs/ is already a folder, and a helper folder is the obvious next
 *  step - was not unseen by a rule, it was unseen entirely. */
export function filesUnder(dir, prefix) {
  const out = [];
  for (const name of fs.readdirSync(dir).sort()) {
    const at = path.join(dir, name);
    const rel = prefix ? prefix + "/" + name : name;
    if (fs.statSync(at).isDirectory()) { out.push(...filesUnder(at, rel)); continue; }
    if (!/\.mjs$/.test(name) || rel === SELF) continue;
    out.push({ rel, at });
  }
  return out;
}

/** Every launch site in one file, with what the call and the lines around it say. */
export function sitesIn(file, src) {
  const out = [];
  LAUNCH.lastIndex = 0;
  let m;
  while ((m = LAUNCH.exec(src))) {
    const at = m.index;
    const ctx = src.slice(Math.max(0, at - BACK), at + FORWARD);
    if (!IS_SHELL.test(ctx)) continue;
    const firstArg = src.slice(at + m[0].length, at + m[0].length + 60).split(",")[0].trim();
    if (NOT_SHELL_FIRST_ARG.test(firstArg)) continue;
    out.push({
      file,
      line: src.slice(0, at).split("\n").length,
      userDataDir: ctx.indexOf("--user-data-dir") > -1,
      projects: ctx.indexOf("STUDIO_PROJECTS") > -1,
    });
  }
  return out;
}

/** Every launch site under tests/, and the findings against them. */
export function scan(dir) {
  const sites = [], doorFiles = [];
  for (const f of filesUnder(dir)) {
    const src = fs.readFileSync(f.at, "utf8");
    if (/E\.shellLaunch(?:Refusal)?\s*\(/.test(src)) doorFiles.push(f.rel);
    sites.push(...sitesIn(f.rel, src));
  }
  const findings = [];
  for (const s of sites) {
    if (!s.userDataDir) findings.push(s.file + ":" + s.line
      + " launches the shell with no --user-data-dir at the call, which is this desk's own store");
    if (!s.projects) findings.push(s.file + ":" + s.line
      + " launches the shell without STUDIO_PROJECTS at the call, so it reads and writes"
      + " the projects folder of whoever is at this desk");
  }
  const direct = [...new Set(sites.map(s => s.file))]
    .filter(f => THROUGH_THE_DOOR.indexOf(f) < 0);
  return { sites, findings, direct, doorFiles };
}

/** The register against the disk, both ways round. */
export function against(direct, register) {
  return {
    unregistered: direct.filter(f => register.indexOf(f) < 0).sort(),
    stale: register.filter(f => direct.indexOf(f) < 0).sort(),
  };
}

/* ---- the run ---------------------------------------------------------------------------- */

let checks = 0, fails = 0, skipped = 0;
const check = (ok, what) => { checks++; console.log((ok ? "  ok   " : "  FAIL ") + what); if (!ok) fails++; };
const skip = (what) => { skipped++; console.log("  SKIP  " + what); };

const TESTS = path.join(ROOT, "tests");
const r = scan(TESTS);
const v = against(r.direct, DIRECT_LAUNCHERS);

check(r.findings.length === 0, "1a every one of the " + r.sites.length
  + " launch site(s) passes --user-data-dir and STUDIO_PROJECTS at the call"
  + (r.findings.length ? ":\n       " + r.findings.join("\n       ") : ""));

check(r.sites.length >= SITES_FLOOR, "1d the scan found " + r.sites.length
  + " launch site(s), at or over the floor of " + SITES_FLOOR
  + "; below it the scan has gone blind rather than the repository clean");

const viaDoor = r.doorFiles;

/* ---- the controls ------------------------------------------------------------------------- */

/* Each control is a file planted under tests/ with nothing in it but the fault. `where` is
   relative to tests/, so the third one is in a SUBFOLDER and the second names STUDIO_PROJECTS
   only in a comment a long way from its call. */
const PLANTED = [
  { where: "zz-launch-door-control.mjs", faults: 2, what: "no --user-data-dir and no STUDIO_PROJECTS",
    src: [
      "/* A CONTROL, WRITTEN AND DELETED BY tests/launch-door.mjs. If this file is on disk, that run",
      "   died between the write and its finally; it is not part of the suite and deleting it is",
      "   safe. It launches the shell the wrong way on purpose and is never executed. */",
      "import path from \"node:path\";",
      "import { spawn } from \"node:child_process\";",
      "const exe = path.join(\"node_modules\", \"electron\", \"dist\", \"electron.exe\");",
      "spawn(exe, [\".\"], { stdio: \"ignore\" });",
      "",
    ] },
  { where: "zz-launch-door-control-prose.mjs", faults: 1, what: "STUDIO_PROJECTS in prose only",
    src: [
      "/* A CONTROL, WRITTEN AND DELETED BY tests/launch-door.mjs; see the file beside it. This one",
      "   names STUDIO_PROJECTS here, in a sentence about what the projects folder is for, and then",
      "   does not pass it at the call. Until 2026-09-17 that was enough to pass this gate.",
      "   " + "x".repeat(600),
      "   " + "x".repeat(600),
      "   " + "x".repeat(600), "*/",
      "import path from \"node:path\";",
      "import { spawn } from \"node:child_process\";",
      "const exe = path.join(\"node_modules\", \"electron\", \"dist\", \"electron.exe\");",
      "spawn(exe, [\".\", \"--user-data-dir=\" + path.join(\"scratch\", \"ud\")], { stdio: \"ignore\" });",
      "",
    ] },
  { where: "zz-control-folder/deep.mjs", faults: 2, what: "a launcher one folder down",
    src: [
      "/* A CONTROL, WRITTEN AND DELETED BY tests/launch-door.mjs, in a subfolder because the scan",
      "   used to read the top level only. Never executed. */",
      "import path from \"node:path\";",
      "import { spawn } from \"node:child_process\";",
      "const exe = path.join(\"node_modules\", \"electron\", \"dist\", \"electron.exe\");",
      "spawn(exe, [\".\"], { stdio: \"ignore\" });",
      "",
    ] },
];

const ID = "abcdefghijklmn";
let removed = "not written";
try {
  PLANTED.forEach((p, i) => {
    const at = path.join(TESTS, p.where);
    fs.mkdirSync(path.dirname(at), { recursive: true });
    fs.writeFileSync(at, p.src.join("\n"), "utf8");
    const after = scan(TESTS);
    const named = after.findings.filter(f => f.indexOf(p.where) === 0);
    check(named.length === p.faults, "2" + ID[i * 2] + " control, " + p.what + " (" + p.where
      + "): caught, " + named.length + " finding(s) against " + p.faults + " expected"
      + (named.length ? "\n       " + named.join("\n       ") : ""));
    /* The DELTA, not the absolute: the plant must be what the register gained and nothing else.
       Asserting one unregistered file would make this control red whenever 1b is already red,
       which buries the finding that matters under three that do not. */
    const vv = against(after.direct, DIRECT_LAUNCHERS);
    const want = v.unregistered.concat([p.where]).sort();
    check(vv.unregistered.join("|") === want.join("|"),
      "2" + ID[i * 2 + 1] + " control: and the register gains it and nothing else: "
      + JSON.stringify(vv.unregistered) + " against " + JSON.stringify(want));
    fs.rmSync(at, { force: true });
  });
} finally {
  for (const p of PLANTED) {
    try { fs.rmSync(path.join(TESTS, p.where), { force: true }); } catch (e) { /* never written */ }
  }
  try { fs.rmSync(path.join(TESTS, "zz-control-folder"), { recursive: true, force: true }); }
  catch (e) { /* never written */ }
  removed = PLANTED.filter(p => fs.existsSync(path.join(TESTS, p.where))).map(p => p.where);
  removed = removed.length ? "STILL THERE: " + removed.join(", ") : "gone";
}
check(removed === "gone", "2g the control file(s) are " + removed + " after the run");

/* ---- the twin, for the rule that a spawn of node is not a launch --------------------------- */

/* A RULE THAT ONLY EVER EXCLUDES IS INVISIBLE TO ITS OWN RED LEG: broken so that it excludes
   everything, the scan finds nothing, and every rule above passes on an empty list except the
   floor. So the control is a benign twin - two sources identical but for the spawn's FIRST
   ARGUMENT, each with electron.exe on the line above - and the pair is asserted together. No
   file is planted; sitesIn is the unit under test and it takes the source as a string. */
const twin = (arg, binary) => [
  "import path from \"node:path\";",
  "import { spawnSync } from \"node:child_process\";",
  "const exe = path.join(\"node_modules\", \"electron\", \"dist\", " + JSON.stringify(binary || "electron.exe") + ");",
  "spawnSync(" + arg + ", [\".\", \"--user-data-dir=\" + path.join(\"scratch\", \"ud\")],",
  "  { env: { STUDIO_PROJECTS: \"somewhere\" } });",
  "",
].join("\n");

const nodeTwin = sitesIn("zz-twin-node.mjs", twin("process.execPath"));
const shellTwin = sitesIn("zz-twin-electron.mjs", twin("exe"));
check(nodeTwin.length === 0, "3a twin: a spawn of process.execPath with electron.exe on the line"
  + " above is not a launch of the shell: " + nodeTwin.length + " site(s)");
check(shellTwin.length === 1, "3b twin: the same source with the shell's own binary as the first"
  + " argument is one: " + shellTwin.length + " site(s)");

/* THE SAME PAIR OVER THE EXTENSIONLESS BINARY, board item 629, and it is the pair rather than
   one leg because a spelling admitted too loosely would make every spawn in the tree a launch.
   The left arm is the hole this closed: at 3d05b36 it answered 0 sites, so a launcher spelling
   the binary the way a Linux install leaves it was not judged leniently, it was not judged. */
const nixTwin = sitesIn("zz-twin-nix.mjs", twin("exe", "electron"));
const nixNode = sitesIn("zz-twin-nix-node.mjs", twin("process.execPath", "electron"));
check(nixTwin.length === 1, "3c twin: the binary spelled the way an install off Windows leaves it,"
  + " node_modules/electron/dist/electron with no suffix, is a launch of the shell too: "
  + nixTwin.length + " site(s), and it was 0 before board item 629");
check(nixNode.length === 0, "3d twin: and a spawn of process.execPath with that same spelling on"
  + " the line above is still not one: " + nixNode.length + " site(s)");

/* A THIRD PAIR, because the widened spelling must not have swallowed the ordinary word. A file
   that spawns node and merely SAYS electron in a sentence is not a launch, and the anchor on
   "dist" is what keeps it so. */
const prose = [
  "/* This file talks about electron and about the electron binary and spawns node. */",
  "import { spawnSync } from \"node:child_process\";",
  "spawnSync(\"git\", [\"status\"]);",
  "",
].join("\n");
check(sitesIn("zz-prose.mjs", prose).length === 0, "3e twin: a spawn with the word electron in a"
  + " comment near it and no binary path is not a launch: "
  + sitesIn("zz-prose.mjs", prose).length + " site(s)");

/* ---- 4. what a run off Windows has not looked at, board item 629 -----------------------------
 *
 * WHY HERE. tests/off-windows.mjs is a sentence the suite says about ITSELF, and the numbers in
 * it are properties of tests/ as a whole: how many suites open a window, how many launch one
 * another way. This is the only gate in the tree that reads every file under tests/ and needs
 * neither a window nor the pin to do it, so it is the only place those numbers can be held to
 * the tree without adding a gate that would itself have to be run somewhere. The register above
 * is the account of what the suite LAUNCHES; this is the account of what it does not look at.
 */
const PRELOAD_DIR = path.join(ROOT, "scratch", "launch-door");
const asPlatform = p => {
  const at = path.join(PRELOAD_DIR, "as-" + p + ".cjs");
  fs.writeFileSync(at,
    "Object.defineProperty(process, \"platform\", { value: \"" + p + "\" });\n", "utf8");
  return at;
};
let sayThere = null;
try {
  fs.mkdirSync(PRELOAD_DIR, { recursive: true });
  const asLinux = asPlatform("linux");
  sayThere = spawnSync(process.execPath, ["-r", asLinux, path.join(TESTS, "off-windows.mjs")],
    { cwd: ROOT, encoding: "utf8", timeout: 30000 });
} finally {
  /* A folder never written goes without a word; one still held is said (board 801). */
  dropScratch(PRELOAD_DIR, "launch-door");
}

const thereOut = sayThere ? String(sayThere.stdout || "") : "";
check(sayThere !== null && sayThere.status === 0
      && thereOut.split("\n").filter(l => l.trim()).length === NOT_PROVED_OFF_WINDOWS.length + 1
      && NOT_PROVED_OFF_WINDOWS.every(x => thereOut.indexOf(x) > -1),
  "4i driven: the same command under a platform patched to linux prints the "
  + (NOT_PROVED_OFF_WINDOWS.length + 1) + " lines of the notice and exits "
  + (sayThere && sayThere.status) + ": "
  + thereOut.split("\n").filter(l => l.trim()).length + " line(s)");

/* 4j: importing off-windows.mjs reads no file under tests/ until NOT_PROVED_OFF_WINDOWS is first used. */
const lazyCheckCode = `
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
const read = [];
const realRead = fs.readFileSync;
fs.readFileSync = function(p, ...args) {
  read.push(path.resolve(String(p)));
  return realRead.call(this, p, ...args);
};
const testsDir = path.resolve(${JSON.stringify(TESTS)});
const offMod = await import(${JSON.stringify(pathToFileURL(path.join(TESTS, "off-windows.mjs")).href)});
const atImport = read.filter(p => p.startsWith(testsDir) && p.endsWith(".mjs")).length;
offMod.notRunReason("a-gate", "a-thing", "linux");
const atReason = read.filter(p => p.startsWith(testsDir) && p.endsWith(".mjs")).length;
const len = offMod.NOT_PROVED_OFF_WINDOWS.length;
const atFirstUse = read.filter(p => p.startsWith(testsDir) && p.endsWith(".mjs")).length;
const first = offMod.NOT_PROVED_OFF_WINDOWS[0];
const atSecondUse = read.filter(p => p.startsWith(testsDir) && p.endsWith(".mjs")).length;
console.log(JSON.stringify({ atImport, atReason, atFirstUse, atSecondUse, len, okFirst: typeof first === "string" && first.length > 0 }));
`;
const lazyRes = spawnSync(process.execPath, ["--input-type=module", "-e", lazyCheckCode], { encoding: "utf8" });
let lazyOut = {};
try { lazyOut = JSON.parse(String(lazyRes.stdout || "").trim()); } catch {}
check(lazyRes.status === 0 && lazyOut.atImport === 0 && lazyOut.atReason === 0
      && lazyOut.atFirstUse > 0 && lazyOut.atSecondUse === lazyOut.atFirstUse && lazyOut.len === 6 && lazyOut.okFirst,
  "4j importing off-windows.mjs reads no file under tests/ until NOT_PROVED_OFF_WINDOWS is first used, and memoises: "
  + JSON.stringify(lazyOut));

/* 4k: plant in a scratch copy proving removal of lazy guard turns 4j red. ETIUDA_PLANTS=off (a merge's area run) skips it
   and counts it, and LAUNCH_DOOR_NO_PLANTS is the same switch folded in; the release profile runs with plants on. */
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off" || !!process.env.LAUNCH_DOOR_NO_PLANTS;
let plantRed = false, plantHits = 0, plantBack = false, plantDetail = "";
if (PLANTS_OFF) {
  skip("4k removing the lazy guard in off-windows.mjs reads the tests folder at import, and this checkout is unchanged (ETIUDA_PLANTS=off)");
} else {
  const { plantsTree, treeSha, dropPlantsTree } = await import("./plants-tree.mjs");
  const before = treeSha(ROOT);
  const targetFile = path.join(ROOT, "tests", "off-windows.mjs");
  const sha = () => crypto.createHash("sha256").update(fs.readFileSync(targetFile)).digest("hex");
  const want = sha(), copy = plantsTree(ROOT, "launch-door-lazy");
  try {
    const at = path.join(copy, "tests", "off-windows.mjs");
    const text = fs.readFileSync(at, "utf8");
    const nl = text.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
    const lines = text.split(nl);
    const mark = "/* plant:off-windows-lazy */";
    lines.forEach((l) => { if (l.indexOf(mark) >= 0) plantHits++; });
    if (plantHits === 1) {
      fs.writeFileSync(at, lines.filter((l) => l.indexOf(mark) < 0).join(nl));
      const mutatedCode = `
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
const read = [];
const realRead = fs.readFileSync;
fs.readFileSync = function(p, ...args) {
  read.push(path.resolve(String(p)));
  return realRead.call(this, p, ...args);
};
const testsDir = path.resolve(${JSON.stringify(path.join(copy, "tests"))});
const offMod = await import(${JSON.stringify(pathToFileURL(path.join(copy, "tests", "off-windows.mjs")).href)});
const atImport = read.filter(p => p.startsWith(testsDir) && p.endsWith(".mjs")).length;
console.log(JSON.stringify({ atImport }));
`;
      const res = spawnSync(process.execPath, ["--input-type=module", "-e", mutatedCode], { encoding: "utf8" });
      try {
        const parsed = JSON.parse(String(res.stdout || "").trim());
        plantRed = parsed.atImport > 0;
      } catch (err) {
        plantDetail = "parse: " + String(res.stdout || res.stderr || "");
      }
    }
  } finally { dropPlantsTree(copy, ROOT); }
  plantBack = sha() === want && treeSha(ROOT) === before;
  check(plantHits === 1 && plantRed && plantBack,
    "4k removing the lazy guard in off-windows.mjs reads the tests folder at import, and this checkout is unchanged"
    + (plantDetail ? " " + plantDetail : ""));
}

/* ---- 5. the workflow's own shell, board item 629 ---------------------------------------------
 *
 * THE SAME YAML MEANS TWO DIFFERENT THINGS ON THE TWO RUNNERS, and that is the whole of this
 * section. A step that pipes a gate into tee - `node tests/x.mjs 2>&1 | tee gate-x.log` - reports
 * the exit of tee unless pipefail is on. Actions gives `shell: bash` as `bash --noprofile --norc
 * -eo pipefail {0}` on every runner, but the DEFAULT shell off Windows is `bash -e {0}`, with no
 * pipefail, so the identical step is a gate on Windows and a decoration on Linux. Measured on this
 * desk 2026-09-20: `bash -e -c 'false | tee /dev/null'` exits 0 and `bash --noprofile --norc -eo
 * pipefail -c` on the same command exits 1.
 *
 * THAT IS A GREEN FOR THE WRONG REASON of exactly the kind the workflow file was written to catch,
 * it was one line away from being shipped in the Linux job added today, and NOTHING in this tree
 * read .github/workflows/gates.yml at all until this section. A rule nothing enforces is a
 * comment; the Windows job has carried the sentence in a comment since it was written.
 *
 * THE READER IS BY INDENTATION, never js-yaml: that package is here only as a transitive
 * dependency of electron-builder, and a gate may not require something no manifest names.
 */

/** Every step of every job, by indentation. `pipes` is a line holding a real pipeline, which is a
 *  bare | that is not the || operator and is not YAML's own block scalar marker at the end of a
 *  line; `bash` is a `shell: bash` line inside the same step. */
export function stepsOf(yml) {
  const lines = String(yml).split(/\r?\n/);
  const out = [];
  let job = "", step = null;
  const shut = () => { if (step) out.push(step); step = null; };
  for (const line of lines) {
    const j = /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(line);
    if (j) { shut(); job = j[1]; continue; }
    if (/^ {6}- /.test(line)) { shut(); step = { job, name: "", pipes: false, bash: false }; }
    if (!step) continue;
    const nm = /^ {6}- name:\s*(.+?)\s*$/.exec(line);
    if (nm) step.name = nm[1];
    if (/^ {8}shell:\s*bash\s*$/.test(line)) step.bash = true;
    const body = line.replace(/:\s*\|\s*$/, ":").replace(/\|\|/g, "");
    if (body.indexOf("|") > -1) step.pipes = true;
  }
  shut();
  return out;
}

/** Steps that pipe and do not say which shell, named job by job. */
export function shellFindings(steps) {
  return steps.filter(s => s.pipes && !s.bash)
    .map(s => s.job + " / " + (s.name || "(unnamed)")
      + " pipes a gate into tee and declares no shell, so off Windows it runs under bash -e with"
      + " no pipefail and reports the exit of tee rather than of the gate");
}

const YML = path.join(ROOT, ".github", "workflows", "gates.yml");
/* The hosted area's workflow (2026-11-22, built and never run) pipes its shard into tee as well, so its steps are read beside these. */
const HOSTED_YML = path.join(ROOT, ".github", "workflows", "hosted-area.yml");
const ymlSteps = [YML, HOSTED_YML].filter(f => fs.existsSync(f)).flatMap(f => stepsOf(fs.readFileSync(f, "utf8")));
const piping = ymlSteps.filter(s => s.pipes);
const shellBad = shellFindings(ymlSteps);
const jobs = [...new Set(ymlSteps.map(s => s.job))];

check(ymlSteps.length > 0 && piping.length >= 2,
  "5a the workflow reader found " + ymlSteps.length + " step(s) over " + jobs.length + " job(s) ["
  + jobs.join(", ") + "], " + piping.length + " of them piping, at or over the floor of 2;"
  + " below it the reader has gone blind rather than the file gone clean");

check(shellBad.length === 0, "5b every piping step declares shell: bash, so the gate's own exit"
  + " decides the step on both runners" + (shellBad.length
    ? ":\n       " + shellBad.join("\n       ") : ""));

/* THE BENIGN TWIN, two texts identical but for the one line, because a reader that never finds
   anything passes 5b for free and the floor above only catches it going blind entirely. */
const stepYml = withShell => [
  "jobs:",
  "  demo:",
  "    runs-on: ubuntu-latest",
  "    steps:",
  "      - uses: actions/checkout@v4",
  "",
  "      - name: a gate",
].concat(withShell ? ["        shell: bash"] : []).concat([
  "        run: node tests/x.mjs 2>&1 | tee gate-x.log",
  "",
]).join("\n");
const without = shellFindings(stepsOf(stepYml(false)));
const withIt = shellFindings(stepsOf(stepYml(true)));
check(without.length === 1 && without[0].indexOf("demo / a gate") === 0,
  "5c twin: the same step without the shell line is one finding, named: "
  + JSON.stringify(without));
check(withIt.length === 0, "5d twin: and with it, none: " + JSON.stringify(withIt));

/* ---- 6. the door's one filter, words: true -----------------------------------------------------
 *
 * WHY HERE. A suite that opens Studio with `words: true` compares what the screen SAYS with its
 * no-break spaces read as spaces, and it trusts that for every answer it reads. The fold used to
 * cover page.evaluate alone, so the day a suite read the same text through page.$eval or $$eval it
 * would have compared raw text while believing it folded - loudly red where it asserts a sentence,
 * but silently green where it asserts that a pattern does NOT match, which is the one leg the fold
 * was measured to rescue (lint-jump 3b, 2026-09-24). Driven here against a stand-in page, because
 * what is judged is the wrapper and not Studio: no window, no pin. */
{
  const NB = String.fromCharCode(160);
  const RAW = { said: "3" + NB + "cards", deep: [{ tab: "rev" + NB + "1" }], n: 3, none: null, on: true };
  const WANT = JSON.stringify({ said: "3 cards", deep: [{ tab: "rev 1" }], n: 3, none: null, on: true });
  const standIn = () => ({ evaluate: async () => RAW, $eval: async () => RAW, $$eval: async () => [RAW, RAW] });
  const folded = wordsOf(standIn());
  const got = [await folded.evaluate(() => 0), await folded.$eval("x", () => 0), ...(await folded.$$eval("x", () => 0))]
    .map(v => JSON.stringify(v));
  check(got.length === 4 && got.every(g => g === WANT),
    "6a a page opened with words: true answers every read folded, evaluate, $eval and $$eval alike,"
    + " nested values included and numbers, null and booleans kept: "
    + got.map((g, i) => ["evaluate", "$eval", "$$eval[0]", "$$eval[1]"][i]
      + (g === WANT ? " folded" : " RAW " + g.split(NB).join("<U+00A0>"))).join(", "));
  const plain = standIn();
  const raw = [await plain.evaluate(), await plain.$eval(), (await plain.$$eval())[0]].map(v => JSON.stringify(v));
  check(raw.every(g => g.indexOf(NB) > -1) && wordsOf(folded) === folded,
    "6b control: the same stand-in not opened through the fold answers the no-break space in all"
    + " three reads (" + raw.filter(g => g.indexOf(NB) > -1).length + " of 3), so 6a is the fold's doing;"
    + " and folding a folded page again wraps nothing twice");
}

/* ---- 7. the window wall, tests/window-wall.mjs --------------------------------------------------
 *
 * A launch opens a window only when the command carries the wall's word. 7a holds every file that
 * launches, through the door or through the pinned engine's, to a call of the wall in its code; 7b
 * and 7c DRIVE the door both ways in a child whose spawns are recorded and never run, with the
 * platform patched off win32 so no pin is asked; 7d holds the variable's name to one file. */
{
  const codeOf = text => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'\\])\/\/.*$/gm, "$1");
  const CALLS_WALL = /\b(?:wallOrThrow|windowWall)\s*\(/;
  const walls = text => CALLS_WALL.test(codeOf(text));
  const launchers = [...new Set(r.sites.map(s => s.file).concat(r.doorFiles))].sort();
  const wallless = launchers.filter(f => !walls(fs.readFileSync(path.join(TESTS, f), "utf8")));
  const call = "wall" + "OrThrow(who);";
  const twins = [call, "/* " + call + " */", "// " + call, "x(); // " + call].map(walls);
  check(wallless.length === 0 && launchers.length >= 4 && launchers.indexOf("shell-door.mjs") > -1
        && twins.join() === "true,false,false,false",
    "7a each of the " + launchers.length + " file(s) that launch the shell calls the window wall in its code ("
    + launchers.join(", ") + ")" + (wallless.length ? ", and these do not: " + wallless.join(", ") : "")
    + "; the control reads a planted call as one and the same call in three comments as none: " + twins.join());

  const { WINDOWS_VAR, WINDOWS_DAY } = await import("./window-wall.mjs");
  const LAB = path.join(ROOT, "scratch", "launch-door-wall");
  const drive = (word, how) => {
    fs.rmSync(LAB, { recursive: true, force: true });
    fs.mkdirSync(path.join(LAB, "p"), { recursive: true });
    const ud = path.join(LAB, "ud"), exe = path.join(LAB, "no-such-app", "Etiuda Studio.exe");
    const ask = how === "open"
      ? 'await door.openStudio.call(null, "7b", { projects: P, userDataDir: UD });'
      : 'door.runStudio.call(null, "7c", { exe: ' + JSON.stringify(exe) + ', projects: P, userDataDir: UD });';
    const file = path.join(LAB, "child.cjs");
    fs.writeFileSync(file, 'Object.defineProperty(process, "platform", { value: "linux" });'
      + 'const cp = require("child_process"), spawned = [];'
      + 'for (const n of ["spawn", "spawnSync", "execFile", "execFileSync"]) { const real = cp[n];'
      + '  cp[n] = function (c) { if (/electron|Etiuda Studio\\.exe/i.test(String(c))) { spawned.push(String(c)); throw new Error("SPAWNED " + c); }'
      + '    return real.apply(this, arguments); }; }'
      + 'require("module").syncBuiltinESMExports();'
      + 'const P = ' + JSON.stringify(path.join(LAB, "p")) + ', UD = ' + JSON.stringify(ud) + ';'
      + '(async function () { const door = await import(' + JSON.stringify(pathToFileURL(path.join(TESTS, "shell-door.mjs")).href) + ');'
      + '  let said = "went"; try { ' + ask + ' } catch (e) { said = e.message; }'
      + '  console.log("GOT " + JSON.stringify({ said: said.split("\\n")[0], spawned: spawned })); })();');
    const env = Object.assign({}, process.env);
    if (word === null) delete env[WINDOWS_VAR]; else env[WINDOWS_VAR] = word;
    const res = spawnSync(process.execPath, [file], { encoding: "utf8", env, timeout: 60000 });
    const out = String(res.stdout || "") + String(res.stderr || "");
    const got = JSON.parse((/^GOT (.*)$/m.exec(out) || [null, "null"])[1]) || { said: out.trim().slice(0, 160), spawned: null };
    let store = "";
    try { store = fs.readFileSync(path.join(ud, "studio.json"), "utf8"); } catch (e) { store = ""; }
    got.marker = /^#refused window-wall\r?$/m.test(out);
    got.pinned = store.indexOf("root") > -1;
    return got;
  };
  try {
    const shutOpen = drive(null, "open"), oldOpen = drive("2000-01-01", "open"), openOpen = drive(WINDOWS_DAY, "open");
    check(/^WINDOW WALL: 7b would open an Electron window, and ETIUDA_WINDOWS is not set/.test(shutOpen.said)
          && shutOpen.marker && Array.isArray(shutOpen.spawned) && shutOpen.spawned.length === 0
          && /is "2000-01-01", not today's date/.test(oldOpen.said) && oldOpen.spawned.length === 0
          && (/^SPAWNED .*electron/i.test(openOpen.said) || /^no Electron at/.test(openOpen.said)) && !openOpen.marker,
      "7b openStudio without the word is refused before any spawn (" + JSON.stringify(shutOpen.said.slice(0, 70)) + ", "
      + (shutOpen.spawned || []).length + " spawn(s)), and with a stale date (" + (oldOpen.spawned || []).length + " spawn(s));"
      + " with today's it reaches the spawn of Electron, recorded and not run: " + JSON.stringify(openOpen.said.slice(0, 70)));
    const shutRun = drive(null, "run"), openRun = drive(WINDOWS_DAY, "run");
    check(/^WINDOW WALL: 7c /.test(shutRun.said) && shutRun.marker && shutRun.spawned.length === 0 && !shutRun.pinned
          && /^SPAWNED .*Etiuda Studio\.exe/.test(openRun.said) && openRun.spawned.length === 1 && openRun.pinned,
      "7c runStudio without the word is refused before it pins the store or spawns (pinned " + shutRun.pinned + ", "
      + shutRun.spawned.length + " spawn(s)); with today's it pins the store and reaches the spawn (pinned "
      + openRun.pinned + ", " + openRun.spawned.length + " spawn(s), recorded and not run)");
  } finally {
    try { fs.rmSync(LAB, { recursive: true, force: true }); } catch (e) { /* scratch/ is ignored */ }
  }

  /* 7e. TODAY IS THE LOCAL DAY, as `date +%F` prints it. In two zones fourteen and twelve hours
     either side of UTC the wall's day is the local date, and in at least one the UTC date differs,
     so a day taken from toISOString could not pass both. */
  const days = ["Etc/GMT-14", "Etc/GMT+12"].map(tz => {
    const res = spawnSync(process.execPath, ["--input-type=module", "-e",
      'import { WINDOWS_DAY } from ' + JSON.stringify(pathToFileURL(path.join(TESTS, "window-wall.mjs")).href) + ';'
      + 'const d = new Date(), p = n => String(n).padStart(2, "0");'
      + 'console.log("DAY " + WINDOWS_DAY + " LOCAL " + d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate())'
      + ' + " UTC " + d.toISOString().slice(0, 10));'], { encoding: "utf8", env: Object.assign({}, process.env, { TZ: tz }) });
    const m = /DAY (\S+) LOCAL (\S+) UTC (\S+)/.exec(String(res.stdout || "")) || [];
    return { tz, day: m[1], local: m[2], utc: m[3] };
  });
  check(days.every(d => d.day && d.day === d.local) && days.some(d => d.local !== d.utc),
    "7e the wall's day is the local date in both zones and differs from the UTC date in at least one: " + JSON.stringify(days));

  /* 7f. THE EXIT-78 FORM, DRIVEN. installer.mjs and update-install.mjs call windowWall at their top and
     then build, install and launch, so its body is what stops them: run in a child with a line after it,
     without the word and with a stale date it exits 78 with the marker and prints nothing more. */
  const wallHref = pathToFileURL(path.join(TESTS, "window-wall.mjs")).href;
  const gate = word => {
    const env = Object.assign({}, process.env);
    if (word === null) delete env[WINDOWS_VAR]; else env[WINDOWS_VAR] = word;
    const res = spawnSync(process.execPath, ["--input-type=module", "-e",
      "import { windowWall } from " + JSON.stringify(wallHref) + "; windowWall(\"7f\"); console.log(\"PAST THE WALL\");"],
      { encoding: "utf8", env });
    const out = String(res.stdout || "") + String(res.stderr || "");
    return { code: res.status, marker: /^#refused window-wall\r?$/m.test(out), past: /PAST THE WALL/.test(out) };
  };
  const shut = gate(null), stale = gate("2000-01-01"), open = gate(WINDOWS_DAY);
  check(shut.code === 78 && shut.marker && !shut.past && stale.code === 78 && stale.marker && !stale.past
        && open.code === 0 && open.past && !open.marker,
    "7f windowWall without the word exits 78 with the marker and goes no further, a stale date the same, today's"
    + " date passes: " + JSON.stringify({ shut, stale, open }));

  const every = (dir, rel) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d =>
    d.isDirectory() ? (d.name === "node_modules" ? [] : every(path.join(dir, d.name), rel + d.name + "/"))
    : /\.(mjs|js|cjs)$/.test(d.name) ? [rel + d.name] : []);
  const scripts = every(TESTS, "tests/").concat(every(path.join(ROOT, "tools"), "tools/"))
    .filter(f => f !== "tests/" + SELF);
  const LITERAL = new RegExp("ETIUDA_" + "WINDOWS"), KEYED = /\[\s*WINDOWS_VAR\s*\]\s*(?:=(?!=)|:)/;
  const naming = scripts.filter(f => LITERAL.test(fs.readFileSync(path.join(ROOT, f), "utf8")));
  const keying = scripts.filter(f => KEYED.test(fs.readFileSync(path.join(ROOT, f), "utf8")));
  check(naming.join() === "tests/window-wall.mjs" && keying.join() === "tests/shell-guards.mjs"
        && LITERAL.test("process.env." + "ETIUDA_" + "WINDOWS = today;"),
    "7d no gate gives itself the word: the variable is named by " + JSON.stringify(naming) + " alone, and an environment"
    + " is given it by assignment or key in " + JSON.stringify(keying) + " (7b's own children aside), over " + scripts.length
    + " script(s) in tests/ and tools/; the pattern finds a planted assignment");
}

console.log("#counts checks=" + checks + " skipped=" + skipped + " failures=" + fails + " sites=" + r.sites.length
  + " ymlSteps=" + ymlSteps.length + " ymlPiping=" + piping.length
  + " direct=" + r.direct.length + " viaDoor=" + viaDoor.length
  + " register=" + DIRECT_LAUNCHERS.length + " floor=" + SITES_FLOOR);
console.log("launch-door  " + (fails ? "FAILED " + fails + " of " : "passed ") + checks + " check(s)");
process.exit(fails ? 1 : 0);
