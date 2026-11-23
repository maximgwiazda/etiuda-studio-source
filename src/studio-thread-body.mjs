/* THE WORKER THREAD src/studio-thread.cjs STARTS: every verb of src/studio.mjs, one at a time. */
import { parentPort } from "node:worker_threads";
import { createRequire } from "node:module";
import * as S from "./studio.mjs";

const { CARRIED } = createRequire(import.meta.url)("./studio-thread.cjs");

function faultOf(e) {
  if (!e || typeof e !== "object") return { message: String(e) };
  const f = { message: String(e.message || e), stack: e.stack ? String(e.stack) : undefined };
  CARRIED.forEach(k => { if (e[k] !== undefined) f[k] = e[k]; });
  return f;
}

async function answer(m) {
  try {
    const fn = S[m.verb];
    if (typeof fn !== "function") throw new Error("src/studio.mjs has no verb " + m.verb);
    const value = await fn(...(m.args || []));
    parentPort.postMessage({ id: m.id, value });
  } catch (e) {
    try { parentPort.postMessage({ id: m.id, fault: faultOf(e) }); }
    catch (again) { parentPort.postMessage({ id: m.id, fault: { message: String(again) } }); }
  }
}

/* A VERB THAT WRITES WAITS FOR THE ONE BEFORE IT; THE TWO LONG READS DO NOT. The inbox's listing
   and the desks' statistics look and never write, and a save asked for while one of them reads a
   share runs at its next pause rather than after it. */
const READS = new Set(["listProposals", "statsFor", "readAllTeams"]);
let queue = Promise.resolve();
parentPort.on("message", (m) => {
  if (READS.has(m.verb)) answer(m);
  else queue = queue.then(() => answer(m));
});
