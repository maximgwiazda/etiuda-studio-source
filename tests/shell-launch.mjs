/* THE LAUNCH GATE: launch, paint, close. Clement's idea 3 for course node 10.
 *
 *     node tests/shell-launch.mjs [--keep]
 *
 * WHAT IT IS FOR. Every other gate in this tree reads files. This one is the only thing that
 * says the program starts: a shell whose window loads a page that throws, or whose preload
 * refuses, or whose material leaves the window transparent, looks exactly like a working one
 * from the outside, and a person finds out by double-clicking it in the morning.
 *
 * SO "PAINTED" IS MEASURED IN PIXELS, not assumed from an exit code. shell/main.js under
 * STUDIO_GATE=1 waits for the page to publish window.STUDIO_READY, captures the window and
 * counts the pixels whose alpha is not zero and the distinct colours among them; this file
 * reads that one line back and holds it to a floor. An empty window is a flat fill with two or
 * three colours; a window that never showed has none at all.
 *
 * THE WINDOW IS OFFSCREEN, past the far corner of every display, so a suite that launches this
 * does not take the screen from whoever is at the desk. It is still SHOWN, with showInactive:
 * an unshown window produces no frames and every capture against it times out at thirty
 * seconds, which would leave the paint half of this gate unprovable.
 *
 * PHASE 5 ALSO HOLDS THE CLOSURE (board 822): the packaged app, handed --remote-debugging-port=0, opens no
 * port, and its control, the tree's shell handed the same switch, does (5e and 5f).
 *
 * AND SINCE 2026-09-17 IT ASKS THE SAME OF THE PACKAGED APP, phase 5, when a build exists beside
 * this checkout: the same launch, the same paint, and one reading the tree alone cannot give -
 * that the packaged app and `electron .` agree on the screen for the same projects. With no
 * build those legs are printed as NOT RUN and counted, because a suite that quietly shrinks
 * is a suite that has stopped looking.
 *
 * IT MAKES ITS OWN PROJECTS AND POINTS THE SHELL AT THEM with STUDIO_PROJECTS, so the gate
 * never reads the folder the person at this desk keeps their own work in, and never writes
 * into it either.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { openStudio, runStudio, descendantsOf, stillUp, windowsOf } from "./shell-door.mjs";
import { OWN_PORT, PORT_FILE, portOf } from "./debug-port.mjs";
import { importCsv } from "../src/import.mjs";
import { json, PROJECT_FILE, DRAFT_FILE } from "../src/publish.mjs";
import { clearScratch, dropScratch, removeTimed } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "shell-launch");

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

function pile(name, seed, rows) {
  const out = path.join(SCRATCH, "piles", name);
  const r = spawnSync(process.execPath, ["tools/fixtures/generate.mjs", "--seed", String(seed),
    "--rows", String(rows), "--out", out], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) throw new Error("the generator refused: " + (r.stderr || r.stdout));
  return path.join(out, "macros.csv");
}

async function project(root, folder, csv, id, name) {
  const dir = path.join(root, folder);
  fs.mkdirSync(dir, { recursive: true });
  const made = await importCsv({ file: csv, id, name });
  fs.writeFileSync(path.join(dir, DRAFT_FILE), json(made.catalog), "utf8");
  fs.writeFileSync(path.join(dir, PROJECT_FILE),
    json({ id: made.catalog.id, name, rev: 0, edition: "", draft: DRAFT_FILE, folder: null }),
    "utf8");
  return dir;
}

/** One launch. `exe` null is `electron .` over the tree; an exe is the packaged app, which takes
 *  no ROOT argument because its app is inside it. Returns the parsed result line, the exit code
 *  and whatever went to stderr. */
function launch(projects, ms, exe, args, userData) {
  const dir = userData || path.join(SCRATCH, "user-data-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7));
  const started = Date.now();
  const r = runStudio("tests/shell-launch.mjs", {
    projects, userDataDir: dir, exe, args, timeout: ms || 60000,
    env: { STUDIO_GATE: "1", ELECTRON_ENABLE_LOGGING: "" },
  });
  const line = String(r.stdout || "").split(/\r?\n/).find(l => l.startsWith("studio-launch "));
  const out = {};
  if (line) for (const bit of line.slice("studio-launch ".length).trim().split(/\s+/)) {
    const at = bit.indexOf("=");
    out[bit.slice(0, at)] = bit.slice(at + 1);
  }
  return { code: r.status, out, line: line || "", userData: dir, started, stderr: String(r.stderr || ""),
           stdout: String(r.stdout || "") };
}

/** The packaged app, if one has been built. ETIUDA_STUDIO_APP_EXE overrides. */
function packagedExe() {
  const given = process.env.ETIUDA_STUDIO_APP_EXE || "";
  if (given) return fs.existsSync(given) ? given : "";
  const dist = process.env.ETIUDA_STUDIO_DIST || path.resolve(ROOT, "..", "etiuda-studio-dist");
  const at = process.platform === "linux" ? path.join(dist, "linux-unpacked", "etiuda-studio")
    : path.join(dist, "win-unpacked", "Etiuda Studio.exe");
  return fs.existsSync(at) ? at : "";
}

async function main(argv) {
  const keep = argv.indexOf("--keep") >= 0;
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const projects = path.join(SCRATCH, "projects");
  fs.mkdirSync(projects, { recursive: true });

  const csvA = pile("a", 23, 14);
  const csvB = pile("b", 24, 9);
  await project(projects, "retail", csvA, "gate-retail", "Retail, EN and PL");
  await project(projects, "travel", csvB, "gate-travel", "Travel desk");

  const t0 = Date.now();
  const one = launch(projects);
  const ms = Date.now() - t0;

  check(one.code === 0, "1a the shell launched, painted and closed by itself, exit "
    + one.code + (one.code === 0 ? "" : "; stderr: " + one.stderr.split("\n")[0]));
  check(!!one.line, "1b it printed one machine-readable result line: " + (one.line || "none"));
  check(one.out.ok === "1", "1c its own verdict is ok=1");
  check(one.out.screen === "projects",
    "1d the window opens on the project list, not on a project (screen=" + one.out.screen + ")");

  /* THE TWO PROJECTS THE GATE PLANTED ARE THE CATALOGS THE OVERVIEW NAMES. Board 982 E took the
     Overview's table away, and its cards are the opened catalogs only, so a planted project shows
     as the number in its catalogs tile; the number is derived from what was planted rather than
     written down here: a gate holding a literal is a gate that stops noticing. */
  const planted = fs.readdirSync(projects).length;
  check(Number(one.out.catalogs) === planted,
    "1e the Overview names the " + planted + " projects that were planted in its catalogs tile ("
    + one.out.catalogs + " catalogs, " + one.out.rows + " table rows)");

  const w = Number(one.out.width), h = Number(one.out.height), painted = Number(one.out.painted);
  check(w > 0 && h > 0, "2a the capture has a size: " + w + "x" + h);
  check(painted > w * h * 0.5, "2b " + painted + " of " + (w * h)
    + " pixels are opaque, over the half a window that merely loaded would not reach");
  check(Number(one.out.distinct) > 8, "2c the window holds " + one.out.distinct
    + " distinct colours (capped at 4096), so it is not one flat fill");

  check(ms < 60000, "3a the whole gate took " + (ms / 1000).toFixed(1)
    + " s, inside the minute a suite can afford");

  /* THE GATE CAN FAIL. A launch pointed at a folder with no projects in it must still paint -
     an empty list is a screen, the block naming the folder - but its row count must fall to
     nought, which is what proves 1e above is reading the list rather than a constant. */
  const empty = path.join(SCRATCH, "no-projects");
  fs.mkdirSync(empty, { recursive: true });
  const two = launch(empty);
  check(two.code === 0 && two.out.ok === "1",
    "4a a Studio with no projects still launches and paints (exit " + two.code + ")");
  check(Number(two.out.catalogs) === 0 && two.out.none === "1",
    "4b and it paints the empty folder's block in place of the tiles, " + two.out.catalogs + " catalog(s)"
    + " against " + one.out.catalogs + " with two projects planted");

  /* ---- 5. THE SAME QUESTION OF THE PACKAGED APP -------------------------------------------
   *
   * `electron .` over the tree is not the thing anybody installs. Every file is on disk where
   * the fetch left it, nothing has been through the packaging allowlist, and an ESM import that
   * resolves on disk can throw inside an asar. So when a build exists beside this checkout, the
   * same three readings are taken of it, and 5c is the one worth having: the packaged app and
   * the tree must AGREE on what the screen shows, for the same planted projects. A packaged app
   * that painted a different list would be a different program with the same name.
   *
   * tests/installer.mjs drives the INSTALLED copy, which is a further step and installs software;
   * this is the unpacked build, which costs one more launch and belongs in npm test.
   *
   * WHEN THERE IS NO BUILD the legs are NOT RUN, and that is printed and counted rather than
   * passed over: a suite whose count quietly drops is a suite that has stopped looking. 5a-5e
   * are the five. */
  const packaged = packagedExe();
  let notRun = 0;
  if (!packaged) {
    notRun = 5;
    process.stdout.write("  --   5a-5e NOT RUN: no packaged app at "
      + path.join(process.env.ETIUDA_STUDIO_DIST || path.resolve(ROOT, "..", "etiuda-studio-dist"),
                  "win-unpacked", "Etiuda Studio.exe")
      + "; build one with `npm run package:dir`\n");
  } else {
    const p1 = launch(projects, 90000, packaged);
    check(p1.code === 0 && p1.out.ok === "1", "5a the PACKAGED app launched, painted and closed by"
      + " itself, exit " + p1.code + ", ok=" + (p1.out.ok || "none")
      + (p1.code === 0 ? "" : "; " + p1.stderr.split("\n").filter(Boolean).slice(0, 2).join(" | ")));
    const pw = Number(p1.out.width), ph = Number(p1.out.height), pp = Number(p1.out.painted);
    check(pw > 0 && ph > 0 && pp > pw * ph * 0.5, "5b " + pp + " of " + (pw * ph)
      + " pixels of its " + pw + "x" + ph + " capture are opaque");
    check(p1.out.catalogs === one.out.catalogs && p1.out.rows === one.out.rows && p1.out.screen === one.out.screen,
      "5c the packaged app and the tree agree on the screen: catalogs " + p1.out.catalogs + " against "
      + one.out.catalogs + ", rows " + p1.out.rows + " against " + one.out.rows
      + ", screen " + p1.out.screen + " against " + one.out.screen);
    const p2 = launch(empty, 90000, packaged);
    check(p2.code === 0 && p2.out.ok === "1" && Number(p2.out.catalogs) === 0 && p2.out.none === "1",
      "5d control: the packaged app on an empty projects folder paints the empty folder's block, "
      + p2.out.catalogs + " catalog(s) against " + p1.out.catalogs);
    /* THE CLOSURE, ON THE REAL EXE. Handed a debugging port on its command line and no door (Studio has
       none), an installed Studio removes the switch before ready and says so. Read from the profile the
       launch was given, after it has closed: Chromium leaves DevToolsActivePort behind (5f shows it does). */
    const neg = launch(projects, 90000, packaged, [OWN_PORT]);
    check(neg.code === 0 && neg.out.ok === "1" && portOf(neg.userData) === 0
          && !fs.existsSync(path.join(neg.userData, PORT_FILE))
          && neg.stderr.indexOf("--remote-debugging-port is not taken by an installed Studio") >= 0
          && !/DevTools listening on/.test(neg.stderr),
      "5e the PACKAGED app handed --remote-debugging-port=0 opens no port and still paints: no " + PORT_FILE
      + " in its user-data folder (port " + portOf(neg.userData) + "), its stderr says the switch is not taken ("
      + (neg.stderr.indexOf("is not taken by an installed Studio") >= 0) + ") and never says it is listening, exit "
      + neg.code + ", ok=" + (neg.out.ok || "none"));
    process.stdout.write("       the packaged app was " + packaged + "\n");
  }
  /* 5f RUNS WITHOUT A BUILD, being 5e's control: the tree's shell, handed the same switch, does open the port. */
  const open = launch(projects, 60000, null, [OWN_PORT]);
  check(open.code === 0 && open.out.ok === "1" && portOf(open.userData) > 0
        && /DevTools listening on/.test(open.stderr) && open.stderr.indexOf("is not taken by an installed Studio") < 0,
    "5f CONTROL: the tree's shell handed --remote-debugging-port=0 writes " + PORT_FILE + " (port "
    + portOf(open.userData) + ") and says it is listening, so 5e's empty folder is the closure's doing, exit " + open.code);

  /* ---- 6. THE DOOR'S OWN TEARDOWN ----------------------------------------------------------
   *
   * The other fourteen suites here connect to a window and take it down in a finally, and every
   * one of those teardowns is now tests/shell-door.mjs's. An Electron is four processes on this
   * desk - the main one, its renderer, its GPU and a utility - and the door kills the tree rather
   * than signalling the main process, for the reason written at its killTree: not because
   * child.kill() was leaking, which was measured on 2026-09-17 and was not, but because the tree
   * kill does not depend on wedged children noticing that their parent has gone.
   *
   * THIS IS THE LEG THAT HOLDS IT TO THAT. The descendants are listed from Windows' own process
   * table WHILE the window is up, because nothing else can say which pids belong to this launch,
   * and after shut() not one of them is running. If the four ever became one, the leg says so
   * rather than passing on an empty list, which is the failure a teardown check invites.
   *
   * 6b is the consequence anybody would notice: the folder goes. It is the reading that would
   * catch a teardown going wrong without knowing to look for a process at all.
   *
   * WITHIN THE RETRIES, NOT AT THE FIRST ATTEMPT (board 801, 2026-09-27, a weakening and named as
   * one). 6b used to demand the first attempt, and on a busy desk Windows can still be closing a
   * file for a moment after every process of the launch has exited, which 6a has just proved:
   * measured 2026-09-26, 1 of 10 removals under heavy load met EBUSY with no pid left. That
   * made 6b red for the operating system's lag rather than the door's, and since the suite is
   * one && chain, it stopped every gate after it. Now the first attempt is REPORTED (the line
   * says whether it met an error and how long the folder took) and the leg JUDGES whether the
   * folder is gone at the end of tests/scratch.mjs's retries, about 11 s. A process the door
   * left alive is 6a's to catch; a folder something still holds past the retries is still red
   * here. Proved both ways with a file held open inside the folder: held 3 s, red before and
   * green now; held 30 s, red now.
   */
  const doorUd = path.join(SCRATCH, "door-teardown");
  const opened = await openStudio("tests/shell-launch.mjs phase 6", { projects, userDataDir: doorUd });
  const tree = [opened.child.pid].concat(descendantsOf(opened.child.pid));
  await opened.shut();
  const left = stillUp(tree);
  check(tree.length > 1 && left.length === 0,
    "6a the door's teardown leaves nothing of the launch running: " + tree.length
    + " were up (" + tree.join(", ") + "), " + left.length + " left"
    + (left.length ? ", which is " + left.join(", ") : "")
    + (tree.length > 1 ? "" : "; one pid and no children means the process table was not read"
       + " and this leg proved nothing"));

  const went = removeTimed(doorUd);
  check(went.gone, "6b and its user-data folder goes within the retries: "
    + (went.first ? "the first attempt met " + went.first + ", and " : "at the first attempt, ")
    + (went.gone ? "gone" : "STILL THERE") + " after " + went.ms + " ms");

  /* ---- 7. THE SCREEN THIS GATE TAKES, board item 535 ----------------------------------------
   *
   * THE FLAG GOVERNS THIS PROGRAM'S WINDOW AND NOT THE SYSTEM'S. A BrowserWindow under
   * STUDIO_TEST_OFFSCREEN sits past the far corner of every display; a native file or folder
   * picker is the system's own window and Windows centres it on the primary display whatever
   * its owner is doing. Measured 2026-09-18 over one whole `npm test`: fifteen Electron windows,
   * every one at 5993,6000 and on no monitor, and two dialogs of class #32770 at 1024,528 during
   * tests/polish.mjs, up for about two and a half seconds each. shell/main.js now answers every
   * pick with a cancellation under the flag, and this is the leg that would go red if it stopped.
   *
   * THE SEPARATING CONTROL IS IN THE READING ITSELF and needs no window on anybody's desk: the
   * helper reports how many visible windows this pid has as well as how many land on a display,
   * so `windows >= 1 and onDisplay === 0` is the claim, and a helper that could see nothing at
   * all fails the first half rather than passing the second. `measured` is asserted for the same
   * reason - could not look is not a clean screen.
   *
   * THE PICKS ARE RACED AGAINST A CLOCK because a native dialog BLOCKS the main process: if the
   * refusal were gone this would hang rather than fail, and a gate that hangs says nothing.
   */
  const seenUd = path.join(SCRATCH, "on-screen");
  const watched = await openStudio("tests/shell-launch.mjs phase 7",
    { projects, userDataDir: seenUd });
  let picks = null, pickWhy = "", atBoot = null, afterPicks = null;
  try {
    atBoot = windowsOf(watched.child.pid);
    const asked = watched.page.evaluate(`(async () => JSON.stringify({
      root: await window.STUDIO.pickRoot("phase 7"),
      folder: await window.STUDIO.pickFolder("phase 7"),
      file: await window.STUDIO.importPick("phase 7")
    }))()`);
    const clock = new Promise(r => setTimeout(() => r(null), 15000));
    const got = await Promise.race([asked.catch(e => { pickWhy = String(e && e.message || e); return null; }), clock]);
    /* The sample is taken BEFORE the teardown and whether or not the picks answered: a dialog
       that is up is up, and the reading is the point of the leg. */
    afterPicks = windowsOf(watched.child.pid);
    picks = got === null ? null : JSON.parse(got);
  } finally { await watched.shut(); }

  check(picks !== null && picks.folder && picks.folder.folder === null
        && picks.file && picks.file.file === null
        && picks.root && typeof picks.root.root === "string",
    "7a the three pickers with no window of their own to answer with come back as a cancellation"
    + " rather than opening one: " + (picks === null
      ? "NOTHING CAME BACK within 15 s" + (pickWhy ? " - " + pickWhy : "")
        + ", which is what a native dialog does to the main process"
      : JSON.stringify(picks)));

  const bothRead = atBoot && afterPicks && atBoot.measured === true && afterPicks.measured === true;
  check(bothRead && atBoot.windows >= 1 && afterPicks.windows >= 1
        && atBoot.onDisplay === 0 && afterPicks.onDisplay === 0,
    "7b and nothing this launch put up lands on a display: "
    + (bothRead
      ? "at boot " + atBoot.windows + " visible window(s) of this pid, " + atBoot.onDisplay
        + " on a display; after the three picks " + afterPicks.windows + " and "
        + afterPicks.onDisplay + ". Monitors " + JSON.stringify(afterPicks.monitors)
        + ", windows " + JSON.stringify(afterPicks.all)
      : "NOT MEASURED, which is a failure and not a clean screen - "
        + ((atBoot && atBoot.why) || (afterPicks && afterPicks.why) || "no reading at all")));

  /* THE LAB MAY STILL BE HELD. A packaged app leaves utility processes closing their own
     databases for a moment after the main process has exited, and an unlink of one of those
     answers EBUSY. Retried, and never allowed to throw: a teardown that takes the run with it
     turns a green suite into a stack trace. */
  if (!keep) try { fs.rmSync(SCRATCH, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }); }
    catch (e) { process.stdout.write("       the lab is still held: " + (e && e.code) + "\n"); }
  process.stdout.write("#counts asserted=" + asserted + " failures=" + failed
    + " notRun=" + notRun + " packaged=" + (packaged ? 1 : 0) + "\n");
  process.stdout.write("shell-launch  " + asserted + " assertion(s), " + failed + " failure(s), "
    + notRun + " not run\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("shell-launch  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
