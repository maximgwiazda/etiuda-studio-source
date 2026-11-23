"use strict";
/* THE VERBS OF src/studio.mjs RUN ON ONE WORKER THREAD, NOT IN THE WINDOW'S PROCESS: each reads
 * or writes the customer's disk, often a share, and a slow one held the window (sense pass 3,
 * items 19 and 20). Calls that write run one at a time in the order made, so a publish reads the
 * save before it; the exception is in src/studio-thread-body.mjs. A refusal or a disk fault
 * crosses whole, frame, code and path. CommonJS so that shell/main.js can require it.
 */
const path = require("node:path");
const { Worker } = require("node:worker_threads");

const BODY = path.join(__dirname, "studio-thread-body.mjs");
const CARRIED = ["name", "said", "disk", "code", "path", "errno", "syscall", "refusal", "lint",
  "landed", "resealOwed", "removed", "removedDesk", "removedFiles", "removedAt", "endedInvite",
  "written", "teamKey", "team", "folder", "epoch"];

let worker = null, next = 0;
const waiting = new Map();

function settleAll(e) {
  const all = Array.from(waiting.values());
  waiting.clear();
  all.forEach(w => w.reject(e));
}

function start() {
  const w = new Worker(BODY);
  w.on("message", (m) => {
    const it = waiting.get(m.id);
    if (!it) return;
    waiting.delete(m.id);
    if (!waiting.size) w.unref();
    if (m.fault) it.reject(rebuilt(m.fault)); else it.resolve(m.value);
  });
  /* A THREAD THAT DIES TAKES ITS CALLS WITH IT, answered as faults, and the next call starts a
     new one: a window whose every button hangs is worse than one that says what went wrong. */
  const gone = (e) => {
    if (worker === w) worker = null;
    settleAll(e instanceof Error ? e : new Error("Studio's worker thread stopped (" + e + ")"));
  };
  w.on("error", gone);
  w.on("exit", gone);
  w.unref();
  return w;
}

function rebuilt(f) {
  const e = new Error(String(f.message));
  CARRIED.forEach(k => { if (f[k] !== undefined) e[k] = f[k]; });
  if (f.stack) e.stack = f.stack;
  return e;
}

/** Run `verb` of src/studio.mjs on the thread with `args`, which cross as structured clones. */
function call(verb, ...args) {
  if (!worker) worker = start();
  const w = worker, id = ++next;
  return new Promise((resolve, reject) => {
    waiting.set(id, { resolve, reject });
    w.ref();
    w.postMessage({ id, verb: String(verb), args });
  });
}

module.exports = { call, CARRIED };
