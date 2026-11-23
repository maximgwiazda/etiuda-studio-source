/* THE LAUNCH MARK CLEARS BEFORE A WINDOW LEG ACTS, board 874. Studio's copy of the engine
 * helper: one named wait for this tree, called by every open that then acts. The predicate is
 * the same two classes. A body that is not there yet is "no-body", not "gone". "gone" is final
 * only once the document has booted (opts.ready, default document.readyState === "complete").
 * A navigation during the wait throws one of four phrases and is not a failure; a disconnect
 * is rethrown. Past the bound, the error names the launch. A same-session reload is not a launch.
 */
/* A ceiling, not a delay: waitLaunchGone returns as soon as the launch mark is gone. */
const LAUNCH_WAIT_MS = 25000;
const CONTEXT_LOST = /Execution context was destroyed|Cannot find context|detached Frame|Navigating frame was detached/i;

function launchMarkState(doc) {
  const body = doc && doc.body;
  const list = body && body.classList;
  if (!list || typeof list.contains !== "function") return "no-body";
  if (list.contains("e-launch") || list.contains("e-launch-out")) return "up";
  return "gone";
}

function launchMarkExpr() {
  return "(" + launchMarkState.toString() + ")(document)";
}

function waitReadExpr(readySrc) {
  const ready = readySrc || "document.readyState === \"complete\"";
  return "(() => ({ state: (" + launchMarkState.toString() + ")(document), ready: !!(" + ready + ") }))()";
}

export async function waitLaunchGone(page, opts) {
  const o = opts || {};
  const who = o.who || "a window leg";
  const bound = o.boundMs == null ? LAUNCH_WAIT_MS : o.boundMs;
  const step = o.stepMs == null ? 50 : o.stepMs;
  const deadline = Date.now() + bound;
  let current = page;
  let navigated = 0;
  const expr = waitReadExpr(o.ready);
  for (;;) {
    let state = "up";
    let ready = false;
    try {
      const read = await current.evaluate(expr);
      state = read && read.state;
      ready = !!(read && read.ready);
    } catch (e) {
      const msg = String(e && e.message || e);
      if (!CONTEXT_LOST.test(msg)) throw e;
      navigated++;
      state = "navigated";
      if (typeof o.refresh === "function") {
        const next = await o.refresh();
        if (next) current = next;
      }
    }
    if (state === "gone" && ready) return { navigated: navigated };
    if (Date.now() >= deadline) {
      throw new Error(who + ": the launch is still on the page (body.e-launch or body.e-launch-out) after "
        + bound + " ms");
    }
    const pause = Math.min(step, Math.max(0, deadline - Date.now()));
    if (pause > 0) await new Promise(r => setTimeout(r, pause));
  }
}

export { LAUNCH_WAIT_MS, CONTEXT_LOST, launchMarkState, launchMarkExpr };
