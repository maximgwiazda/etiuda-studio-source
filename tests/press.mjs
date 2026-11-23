/* A PRESS WAITS FOR WHAT IT PRESSES, within a bound, and says so by name when it is not there.
 *
 * WHAT WENT WRONG (2026-09-26, test architect). The screen suites pressed a button a fixed time
 * after the step that should have painted it: open a project, sleep 900 ms, press Publish. On a
 * quiet desk the paint comes first and the suite is green; on a busy one it does not, and the
 * press finds nothing. What that looked like depended on the suite: "nothing at <selector>" from
 * the helpers that checked, a TypeError about null from the ones that called
 * document.querySelector(...).click() bare, and, worst, NOTHING AT ALL from the ones that wrote
 * `if (e) e.click()`, which pressed nothing, carried on, and failed later on a read that sent the
 * reader to the product. A fixed sleep is a guess at how long a paint takes, and the guess is
 * wrong exactly when the desk is loaded, which is when a failure is hardest to read.
 *
 * So the press polls for its element and presses it in the same evaluate (no handle is kept, so
 * a re-render between the find and the click cannot hand back a detached node), every 50 ms, for
 * up to PRESS_BOUND_MS. Found early, it presses early; not found, it throws a sentence naming the
 * caller, the selector, the bound and the screen the page said it was on, so the reader starts at
 * the missing button rather than at a read three steps later.
 *
 * WHAT IT DOES NOT DO. It waits for the element to EXIST, the same condition every suite's own
 * press already required, and nothing more: not visible, not enabled, not settled. The sleep a
 * suite keeps AFTER a press is left where it was, because what follows a press is often a read,
 * and a read after a fixed time is a different question (which fact to wait for) with a different
 * answer per read. The press no longer depends on that sleep; the read still may.
 *
 * THE READ'S OWN FACT, WHERE IT HAS BEEN NAMED (board 801, 2026-09-27). `settleOn` is the answer
 * for a read whose fact has been worked out: it polls a page expression until it is true, within
 * the same bound, and then the read goes ahead. It NEVER THROWS on the bound: the read that
 * follows is the leg, and a screen that never settled fails there, in the leg's own sentence,
 * with what the screen actually held. So waiting cannot turn a wrong screen green; it only stops
 * a slow one reading red. Measured with a planted delay, not argued: the audit screen's load,
 * the publish cover's plan and the publish answer, each 2500 ms late, reddened 7 of 13 legs of
 * audit-screen and 5a, 5c, 5d of publish-screen while the reads slept a fixed time.
 *
 * `attr` selects among matches by an attribute compared as a string, for the project rows whose
 * data-dir is a Windows path that a selector would have to escape. `find`, for a target no
 * selector can name (a row chosen by the number in one of its cells), is the source of a page
 * expression answering the element or null; `sel` then only names it in the failure. */

export const PRESS_BOUND_MS = 10000;
const STEP_MS = 50;
const sleep = ms => new Promise(r => setTimeout(r, ms));

/** pressWhen(page, sel, { who, bound, attr: [name, value], find }): resolves once it has clicked
 *  the first element matching `sel` (and `attr`, when given), or the one `find` answers; throws
 *  after `bound` ms of not finding one. Answers the milliseconds it waited, which a control can
 *  read. */
export async function pressWhen(page, sel, opts) {
  const o = opts || {};
  const bound = o.bound === undefined ? PRESS_BOUND_MS : o.bound;
  const attr = o.attr || null;
  const t0 = Date.now();
  for (;;) {
    const hit = o.find
      ? await page.evaluate("(() => { const e = (" + o.find + "); if (!e) return false; e.click(); return true; })()")
      : await page.evaluate((s, a) => {
        const e = Array.from(document.querySelectorAll(s))
          .find(x => !a || x.getAttribute(a[0]) === a[1]);
        if (!e) return false;
        e.click(); return true;
      }, sel, attr);
    if (hit) return Date.now() - t0;
    if (Date.now() - t0 >= bound) break;
    await sleep(STEP_MS);
  }
  let screen = "?";
  try { screen = String(await page.evaluate("(window.STUDIO_READY || {}).screen || ''")) || "(none said)"; }
  catch (e) { /* the page is gone, and the sentence says the screen is unknown */ }
  throw new Error((o.who ? o.who + ": " : "") + "PRESS NOT MADE, nothing at " + sel
    + (attr ? " with " + attr[0] + "=" + JSON.stringify(attr[1]) : "")
    + " within " + bound + " ms; the page said it was on screen " + JSON.stringify(screen));
}

/** settleOn(page, expr, { bound }): polls the page expression `expr` (source text) every 50 ms
 *  until it is truthy or `bound` ms have passed. Answers { met, ms } and never throws: a page
 *  that throws while it repaints is polled again, and one that never settles is left to the read
 *  that follows, which fails in its own words. An unmet bound prints one NOTE line naming the caller
 *  and the condition, so a wrong condition whose read still passes is seen rather than paid for
 *  silently (the test architect's read, 2026-11-03 11:39). */
export async function settleOn(page, expr, opts) {
  const o = opts || {};
  const bound = o.bound === undefined ? PRESS_BOUND_MS : o.bound;
  const t0 = Date.now();
  for (;;) {
    let met = false;
    try { met = !!(await page.evaluate("!!(" + expr + ")")); } catch (e) { met = false; }
    if (met) return { met: true, ms: Date.now() - t0 };
    if (Date.now() - t0 >= bound) {
      const frame = String(new Error().stack).split("\n")[2] || "";
      const at = (/([^\\/(\s]+:\d+):\d+\)?\s*$/.exec(frame) || [])[1] || "?";
      process.stdout.write("NOTE settleOn unmet " + at + " " + expr + "\n");
      return { met: false, ms: Date.now() - t0 };
    }
    await sleep(STEP_MS);
  }
}
