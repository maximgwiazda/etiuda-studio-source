/* THE DEBUGGING PORT A WINDOW CHOSE FOR ITSELF, and how a gate finds the window it launched.
 *
 * WHAT WENT WRONG, board item 488. Fourteen screen suites each spawned Electron with a debugging
 * port written into the file as a constant - 9342 for publish-screen, 9344 for polish, and so on
 * up - and then connected to 127.0.0.1 on that number. The numbers are distinct between suites,
 * so one chain never collided with itself. They are NOT distinct between CHECKOUTS: a second
 * clone or worktree of this repository on the same desk runs the same suite with the same
 * constant, and a desk that builds Studio in a worktree while the chain runs is the ordinary
 * case here rather than a rare one. Whichever Electron binds the port first keeps it; the second
 * one logs that the address is in use and carries on WITHOUT a debugging endpoint, and the
 * puppeteer.connect that follows reaches the FIRST checkout's window. That window is a whole
 * working Studio, so nothing throws. It simply has the other checkout's STUDIO_PROJECTS, so the
 * project the gate planted is not in its list, and the gate fails deep inside its own steps with
 * a sentence about the product - "no project row" - for a fault that is entirely about a socket.
 *
 * MEASURED, not reasoned: with a second Electron holding 9342 and nothing else shared - its own
 * user-data folder, its own empty projects folder, the same exe - tests/publish-screen.mjs threw
 * "no project row" on three runs of three, in six seconds each, and passed alone on three of
 * three. The failure text is the one the chain produced at 14:16 on 2026-09-17.
 *
 * WHAT THIS DOES INSTEAD. The launch asks for port 0, which is Chromium's "any free port", and
 * Chromium writes the port it actually bound into DevToolsActivePort inside the user-data folder
 * it was given. So the gate does not pick a port at all and does not guess one: it reads the
 * number out of ITS OWN folder, which no other process on this desk can write. Two checkouts
 * cannot collide, because neither names a number; and a gate can no longer connect to somebody
 * else's window, because the only port it ever learns is the one its own browser recorded. That
 * is stronger than asking the operating system for a free port and passing it in, which leaves a
 * gap between the probe closing the socket and Electron opening it.
 *
 * WHY THE FILE IS ARMED FIRST. DevToolsActivePort is left behind by the previous run, so a suite
 * that reuses a user-data folder could read a dead port and connect to nothing, or worse to
 * whatever now sits on that number. armPort removes it and returns the folder, so the call site
 * reads `"--user-data-dir=" + armPort(...)` and cannot forget.
 */
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

/** Chromium's own name for the file it drops the bound port into. */
export const PORT_FILE = "DevToolsActivePort";

/** The argument every gate passes in place of a port of its own choosing. */
export const OWN_PORT = "--remote-debugging-port=0";

const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Make the folder, forget any port a previous run left in it, and hand the folder back so the
 *  call site can pass it straight to --user-data-dir. */
export function armPort(userDataDir) {
  fs.mkdirSync(userDataDir, { recursive: true });
  try { fs.unlinkSync(path.join(userDataDir, PORT_FILE)); } catch (e) { /* the usual case */ }
  return userDataDir;
}

/** The port the window in THIS user-data folder bound, or 0 while it has not said yet. */
export function portOf(userDataDir) {
  let txt = "";
  try { txt = fs.readFileSync(path.join(userDataDir, PORT_FILE), "utf8"); } catch (e) { return 0; }
  return parseInt(String(txt).split("\n")[0], 10) || 0;
}

/** Connect to the window that owns this user-data folder, waiting for it to open. Throws with a
 *  sentence naming which half failed, because "no port" and "a port that does not answer" are
 *  different faults and a gate that conflates them sends its reader to the wrong place. */
export async function connectOwn(userDataDir, opts) {
  const waitMs = (opts && opts.waitMs) || 20000, step = 250;
  let port = 0;
  for (let waited = 0; waited < waitMs && !port; waited += step) {
    await sleep(step);
    port = portOf(userDataDir);
  }
  if (!port) throw new Error("the window never wrote a debugging port into its own user-data"
    + " folder within " + (waitMs / 1000) + " s: " + path.join(userDataDir, PORT_FILE));
  let br = null;
  for (let waited = 0; waited < waitMs && !br; waited += step) {
    try { br = await puppeteer.connect({ browserURL: "http://127.0.0.1:" + port, defaultViewport: null }); }
    catch (e) { br = null; await sleep(step); }
  }
  if (!br) throw new Error("the window recorded port " + port + " and then did not answer on it");
  return br;
}
