import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

function filesUnder(dir, prefix) {
  const out = [];
  for (const name of fs.readdirSync(dir).sort()) {
    const at = path.join(dir, name);
    const rel = prefix ? prefix + "/" + name : name;
    if (fs.statSync(at).isDirectory()) { out.push(...filesUnder(at, rel)); continue; }
    if (!/\.mjs$/.test(name) || rel === "launch-door.mjs" || rel === "off-windows.mjs") continue;
    out.push({ rel, at });
  }
  return out;
}

const CALLS_SHELL = new RegExp("\\b(open" + "Studio|run" + "Studio)\\s*\\(");
const CALLS_DOOR = new RegExp("E\\.shell" + "Launch\\s*\\(");

export function scanWindowSuites(dir) {
  const all = filesUnder(dir || HERE);
  const bodies = all.map(f => ({ rel: f.rel, src: fs.readFileSync(f.at, "utf8") }));
  const windowed = bodies.filter(f => f.rel !== "shell-door.mjs" && CALLS_SHELL.test(f.src)).length;
  const pinnedDoor = bodies.filter(f => CALLS_DOOR.test(f.src)).length;
  return { windowed, pinnedDoor };
}

let _memo = null;
function notProved() {
  if (!_memo) {
    const { windowed, pinnedDoor } = scanWindowSuites();
    _memo = [
      "any painted screen: " + windowed + " suites open a real Electron window through tests/shell-door.mjs's"
        + " openStudio or runStudio, and " + pinnedDoor + " more launches one through the pinned engine's E.shellLaunch;"
        + " not one of them has ever been driven off this desk",
      "the Polish of a screen as the window says it, which is walked one screen at a time in a window",
      "the packaged product: the installer, the .ec association, the Start Menu entry and the"
        + " per-user uninstall key, which are Windows by construction",
      "that an engine desk and Studio agree on a catalog Studio published, which needs an installed"
        + " desk no runner has",
      "the statistics reader against a real pinned desk answering a request this tree wrote",
      "the shell's content policy as Electron serves it, and the icons as they are painted rather"
        + " than as the bytes a build wrote",
    ];
  }
  return _memo;
}

let lazy = false;
lazy = true; /* plant:off-windows-lazy */
if (!lazy) notProved();

/* WHAT A RUN OFF WINDOWS HAS NOT LOOKED AT, SAID OUT LOUD. Board item 629, Studio's half.
 *
 * WHY THIS EXISTS. Every gate in this tree has only ever run on one Windows desk. The day one of
 * them runs on a Linux runner, most of them will pass, and a reader seeing `npm test` green will
 * read that as the suite having held. It will not have. The screen gates run under `npm run
 * windows`, which is the argued window run; `npm test` does not launch them. None of the screen
 * gates, the install gates or the Linux launch has ever been driven anywhere but here. A green
 * that means less than the reader thinks it means is the failure this seat exists to prevent,
 * and the answer the engine settled on for the same problem is to make the run say what it did
 * not look at, at the place a reader decides what the run means.
 *
 * WHY IT IS NOT THE ENGINE'S. The engine has one body of this, E.offWindowsNotice in its
 * tests/engine.js, and copying a rule is how two copies drift. But the LIST is the thing, and
 * Studio's list is not the engine's: no desk state file, no catalog folder watch, no dot field;
 * instead a review queue and a packaged installer with a per-user uninstall key. And the
 * engine's copy lives behind the pin, under engine/pinned/, which tools/engine-fetch.mjs has to
 * have run for; the gates that most need to say this sentence are the tree-only ones that need
 * no pin at all. So the shape is the engine's, the list is Studio's, and this header is the link
 * between them.
 *
 * WHY THE PLATFORM IS AN ARGUMENT. A function that reads process.platform and nothing else can
 * only be checked on the platform the checker is standing on, so the leg that matters - "off
 * Windows it says something" - could never be driven from this desk except by patching Node.
 * Taking the platform as an argument with process.platform as the default makes the benign twin
 * possible: the same call, one value changed, both answers asserted. tests/launch-door.mjs holds
 * it to both.
 *
 * NOT RUN IS NEITHER A PASS NOR A FAILURE. notRunReason is the second half: a whole gate that
 * cannot run off Windows says so and counts it, rather than exiting green on nought checks or red
 * on the platform. The caller prints the reason and declares notRun= on its own #counts line.
 */

/** What no run off Windows has looked at, memoised on first use so importing off-windows.mjs for
 *  notRunReason pays no scan. Each line is a thing a reader might otherwise take a green as covering.
 *  Adding a gate that needs a window means adding to this list. */
export const NOT_PROVED_OFF_WINDOWS = new Proxy(function() { return notProved(); }, {
  get(target, prop, receiver) {
    const list = notProved();
    const val = Reflect.get(list, prop, receiver);
    return typeof val === "function" ? val.bind(list) : val;
  },
  apply(target, thisArg, args) {
    return notProved();
  },
  has(target, prop) {
    return Reflect.has(notProved(), prop);
  },
  ownKeys(target) {
    return Reflect.ownKeys(notProved());
  },
  getOwnPropertyDescriptor(target, prop) {
    return Reflect.getOwnPropertyDescriptor(notProved(), prop);
  },
});

/** The lines themselves, EMPTY on Windows, so a caller can print them unconditionally. The
 *  caller indents; nothing here assumes an indent, because the callers already differ. */
export function offWindowsNotice(platform) {
  const p = platform || process.platform;
  if (p === "win32") return [];
  const lines = ["NOT WINDOWS (" + p + "), so whatever this run says, it did not look at "
    + NOT_PROVED_OFF_WINDOWS.length + " things:"];
  NOT_PROVED_OFF_WINDOWS.forEach(x => lines.push("  - " + x));
  return lines;
}

/** Null where a gate may run, or the one sentence saying why it cannot. `gate` names the file so
 *  that a log holding several says which; `what` is the thing the gate needs and this platform
 *  has not got. */
export function notRunReason(gate, what, platform) {
  const p = platform || process.platform;
  if (p === "win32") return null;
  return gate + " NOT RUN on " + p + ": " + what
    + ". NOT RUN is neither a pass nor a failure, and it means this run has not looked at the"
    + " thing this gate is for.";
}

/* AND AS A COMMAND, so that a job can say this once rather than thirty-two gates each saying it:
 *
 *     node tests/off-windows.mjs
 *
 * Prints the notice and exits 0; on Windows it prints nothing and exits 0, which is the same
 * emptiness the callers rely on. A workflow's summary step runs this, because the place a reader
 * decides what a run means is the summary and not the middle of one gate's log. Both arms are
 * DRIVEN in tests/launch-door.mjs section 4, not asserted from the source. */
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]))
  offWindowsNotice().forEach(l => process.stdout.write(l + "\n"));
