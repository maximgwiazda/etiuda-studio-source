/* THE WINDOW WALL, Studio's half. A test opens an Electron window only when the command carries
 * ETIUDA_WINDOWS set to today's date, the form ETIUDA_PUSH takes for a push next door, so a chain
 * or a search of tests/ that reaches a window suite meets a refusal rather than windows. The rule
 * is the office charter's, section 6: a test's default answer is no, and a run that opens windows
 * is argued to the other chief of staff before it starts; only the brief that argued it sets the
 * variable, for that one command.
 *
 * ONE NAME FOR BOTH TREES. Five suites here launch through the PINNED engine's door, which carries
 * the engine's own copy of this wall once the pin moves past it; under one name a Studio run sets
 * one variable and both walls read it. STUDIO_ would also have been the wrong prefix: studioEnv in
 * shell-door.mjs strips every STUDIO_ variable from a launch on purpose.
 *
 * WHERE IT STANDS: inside the door (openStudio and runStudio, after every folder refusal, so those
 * keep their own words), at each launch through the pinned engine's door, and at the top of the
 * two installer gates, before their builds. tests/launch-door.mjs section 5 holds every launch
 * file to it. Node builtins only, so a gate that needs no window can import it for nothing.
 */

export const WINDOWS_VAR = "ETIUDA_WINDOWS";
/** A date as `date +%F` prints it: the LOCAL day, not the UTC one. */
export const dayOf = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-"
  + String(d.getDate()).padStart(2, "0");
/* Read once, at load, so a run that crosses midnight keeps the word it started with. */
export const WINDOWS_DAY = dayOf(new Date());

/** Null where this process may open a window, or the lines of the refusal. Reads the environment
 *  of the process that launches, never the one it hands the launch. */
export function windowWallRefusal(who, env) {
  const said = (env || process.env)[WINDOWS_VAR];
  if (said === WINDOWS_DAY) return null;
  return ["WINDOW WALL: " + who + " would open an Electron window, and " + WINDOWS_VAR + " is "
            + (said === undefined || said === "" ? "not set" : JSON.stringify(said)) + ", not today's date " + WINDOWS_DAY,
          "a test that opens windows is argued before it starts (charter section 6: a test's default answer is no,"
            + " and a heavy run is argued to the other chief of staff first); only the brief that argued it sets"
            + " the variable, for that one command:",
          "  bash: " + WINDOWS_VAR + "=$(date +%F) <command>    PowerShell: $env:" + WINDOWS_VAR + " = Get-Date -Format yyyy-MM-dd",
          "this is a refusal and not a failure: no window was opened and nothing about the product was measured"];
}

/** A copy of `env` WITHOUT the word, for a child that must meet the wall (a leg proving the wall still refuses). Taking the
 *  word away is the opposite of giving it, and this file stays the only one in tests/ and tools/ that names the variable
 *  (launch-door 7d; the test architect, 2026-11-10). */
export function envWithoutWindowWord(env) {
  const out = Object.assign({}, env || process.env);
  delete out[WINDOWS_VAR];
  return out;
}

/** For a launch inside a suite: the marker line, then a throw carrying every line. */
export function wallOrThrow(who) {
  const bad = windowWallRefusal(who);
  if (!bad) return;
  console.log("#refused window-wall");
  throw new Error(bad.join("\n       "));
}

/** For the top of a gate, before it builds anything: the refusal printed in the shape every gate
 *  here prints a failure, and exit 78, which is NO VERDICT rather than a count. */
export function windowWall(who) {
  const bad = windowWallRefusal(who);
  if (!bad) return;
  console.log("#refused window-wall");
  console.log("  FAIL " + bad[0]);
  bad.slice(1).forEach(l => console.log("       " + l));
  console.log("  SUITE DID NOT COMPLETE: " + bad[0]);
  process.exit(78);
}
