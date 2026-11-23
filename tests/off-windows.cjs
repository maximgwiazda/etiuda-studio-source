"use strict";
/* WHETHER A WINDOWS-ONLY ASSERTION STANDS ASIDE HERE, AND THE LINE IT PRINTS (the test architect, 2026-11-14, on Claude gamma's
 * inventory of the legs that assume Windows, and Claude alpha's three bounds of that night).
 *
 * THE CRITERION, Claude gamma's: "A leg that asserts a Windows-only behaviour either says so and stands aside off Windows, with
 * its reason in the leg's own output, or is made platform-aware, so that a red on Linux means the product or the machine and
 * never the leg." This module is the first half. A leg that stands aside calls standAside(id, reason) at the assertion: off
 * Windows it answers the line the leg prints through its own skip, which counts toward the file's expected total as its other
 * skips do; on Windows it answers "" and the assertion runs as it always did.
 *
 * THE DECISION IS process.platform AND NOTHING ELSE. No variable and no argument can change it, because a switch that could
 * stand a leg aside on Windows is a way to make a leg go quiet on the one desk where it has teeth, and that is the failure
 * this module must not cause (Claude alpha's bound 1). After the decision a guard throws if the answer is "stand aside" while
 * the platform is Windows. The decision line carries plant:off-windows-aside; lifting it to `true` in a scratch copy makes the
 * guard throw on Windows, and so every leg that uses this module goes red there, not skipped. tests/off-windows-selftest.mjs
 * proves it, lists every leg file that requires this module, and runs one of them with the plant lifted.
 *
 * Not to be confused with tests/off-windows.mjs, which says what a run off Windows has not looked at; this one decides, leg by
 * leg, which assertions stand aside, and Studio does not take the engine's copy of it. */

/** "" on Windows: run the assertion. Off Windows: the line naming the assertion and why it stands aside. */
function standAside(id, reason) {
  if (!id || !reason) throw new Error("off-windows: a leg that stands aside names itself and its reason");
  let aside = false;
  aside = process.platform !== "win32"; /* plant:off-windows-aside */
  /* os.type() is the kernel's own answer, so a leg that has faked process.platform for a stretch cannot stand aside on Windows
     either (as the engine's copy holds it). */
  if (aside && (process.platform === "win32" || require("node:os").type() === "Windows_NT")) {
    throw new Error("off-windows: " + id + " was told to stand aside on Windows, where it has teeth; the decision is"
      + " process.platform alone and nothing may change it");
  }
  return aside ? id + " stands aside off Windows: " + reason : "";
}

module.exports = { standAside };
