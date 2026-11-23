/* THE SCRATCH FOLDER A GATE MAKES, AND HOW IT GOES AWAY AGAIN (board 801 b).
 *
 * WHAT WENT WRONG. On a busy desk, 2026-09-26, tests/lint-jump.mjs and tests/audit-screen.mjs ran
 * every assertion green and then died with exit 2 on the last line but two: fs.rmSync(SCRATCH)
 * met EBUSY in a window's user-data folder (ud\Network\Trust Tokens). The window had been taken
 * down half a second earlier and one of its processes had not finished dying. The gate's own
 * verdict was never printed, and because the suite is one && chain, nothing after it ran. A
 * clean-up that throws turns a green gate red and a red gate into a stack trace, and neither is
 * what the gate measured.
 *
 * TWO REMOVALS, BECAUSE THEY ANSWER DIFFERENT QUESTIONS.
 *
 *   clearScratch(dir), before a gate plants anything. A folder that cannot be cleared here would
 *   be planted into dirty, and a screen counting rows would then count a previous run's too, so
 *   after the retries this THROWS: the gate fails before its first assertion, naming the folder,
 *   which is a sentence about the desk rather than about the product.
 *
 *   dropScratch(dir, who), after the assertions. Nothing is measured here any more, so this
 *   NEVER throws: after the retries it leaves the folder where it is and says so on stderr, one
 *   line naming the gate, the folder and the error, and the gate's exit code stays the one its
 *   assertions earned. A failed assertion still fails the gate; a held folder never does.
 *
 * THE RETRIES are node's own: fs.rmSync retries EBUSY, EPERM, ENOTEMPTY, EMFILE and ENFILE per
 * entry, waiting retryDelay longer at each try, so 10 tries at 200 ms is 0.2 s, 0.4 s ... 2 s,
 * about 11 s in all for one entry that stays held. The cause is fixed at the door
 * (tests/shell-door.mjs, shut waits for the window's processes to exit); this is what is left
 * over when the operating system is slower than that wait, which on a desk with a dozen other
 * Electrons it sometimes is.
 */
import fs from "node:fs";

export const RETRY = { maxRetries: 10, retryDelay: 200 };

/** Remove a folder before a gate uses it; throws, naming it, if it is still held after the retries. */
export function clearScratch(dir) {
  try { fs.rmSync(dir, Object.assign({ recursive: true, force: true }, RETRY)); }
  catch (e) {
    throw new Error("could not clear " + dir + " before using it: " + ((e && e.code) || e)
      + "; something still holds it, most likely a window a previous run left up");
  }
}

/** Remove a folder and say how it went: once plainly, then, only if that met an error, with the
 *  retries. Never throws. Answers { gone, first, ms }: whether the folder is gone at the end, the
 *  error code the first attempt met ("" when it went at once), and the milliseconds it all took.
 *  For a leg whose subject is the removal itself (tests/shell-launch.mjs 6b), which reports the
 *  first attempt and judges the end. */
export function removeTimed(dir) {
  const t0 = Date.now();
  let first = "";
  try { fs.rmSync(dir, { recursive: true, force: true }); }
  catch (e) { first = String((e && e.code) || (e && e.message) || e); }
  if (first) {
    try { fs.rmSync(dir, Object.assign({ recursive: true, force: true }, RETRY)); }
    catch (e) { /* the answer is `gone`, read from the disk below */ }
  }
  return { gone: !fs.existsSync(dir), first, ms: Date.now() - t0 };
}

/** Remove a folder after the assertions; never throws. True when it went, false when it was left. */
export function dropScratch(dir, who) {
  try {
    fs.rmSync(dir, Object.assign({ recursive: true, force: true }, RETRY));
    return true;
  } catch (e) {
    process.stderr.write((who || "a gate") + "  left " + dir + " in place: "
      + ((e && e.code) || (e && e.message) || e) + " after " + RETRY.maxRetries + " retries;"
      + " clean-up only, the gate's verdict is its assertions\n");
    return false;
  }
}
