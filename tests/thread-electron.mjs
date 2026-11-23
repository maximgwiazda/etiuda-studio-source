/* STUDIO'S WORKER THREAD LOADS WITH NO MODULE CALLED ELECTRON, as it must inside a packaged app.
 *
 *   node tests/thread-electron.mjs
 *
 * src/studio-thread.cjs starts src/studio-thread-body.mjs on a worker, and every disk verb of
 * src/studio.mjs runs there. In a packaged app a worker has no module called electron; over the
 * tree `require("electron")` finds the npm package and answers its path, so a require at load
 * passes every unpackaged run and kills the packaged thread. That was 2026-11-02's shell-launch
 * 5c: src/wire.cjs asked for electron as it loaded, reached through src/relay.mjs, the thread died
 * and the packaged project list drew empty.
 *
 *   te1  the real body, on a worker whose require("electron") throws as a packaged one does,
 *        answers listProjects on a planted folder: the thread lives and names the project
 *   te2  the refusal case: the same worker on a scratch copy whose src/wire.cjs asks for electron
 *        as it loads again (plant wire-net-lazy lifted) dies with "Cannot find module 'electron'"
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Worker } from "node:worker_threads";
import { fileURLToPath, pathToFileURL } from "node:url";
import { plantsTree, dropPlantsTree, treeSha } from "./plants-tree.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPECTED = 2;
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (!cond) failed++;
  process.stdout.write((cond ? "  ok   " : "  FAIL ") + line + "\n");
}

/* A worker whose require("electron") throws, then the body: what a packaged app's worker meets. */
function noElectronWorker(body) {
  const code = "const M = require('node:module');"
    + "const was = M._resolveFilename;"
    + "M._resolveFilename = function (req, ...rest) {"
    + "  if (req === 'electron') { const e = new Error(\"Cannot find module 'electron'\"); e.code = 'MODULE_NOT_FOUND'; throw e; }"
    + "  return was.call(this, req, ...rest);"
    + "};"
    + "import(" + JSON.stringify(pathToFileURL(body).href) + ");";
  return new Worker(code, { eval: true });
}

/* One listProjects call: { value } when the thread answers, { died } when it stops first. */
function listOn(body, root) {
  return new Promise((resolve) => {
    const w = noElectronWorker(body);
    const done = (r) => { clearTimeout(t); w.terminate().catch(() => {}); resolve(r); };
    const t = setTimeout(() => done({ died: "no answer within 20 s" }), 20000);
    w.on("message", (m) => { if (m && m.id === 1) done(m.fault ? { fault: String(m.fault.message) } : { value: m.value }); });
    w.on("error", (e) => done({ died: String(e && e.message || e) }));
    w.on("exit", (c) => done({ died: "exit " + c }));
    w.postMessage({ id: 1, verb: "listProjects", args: [root, {}] });
  });
}

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "thread-electron-"));
try {
  const root = path.join(scratch, "projects");
  const dir = path.join(root, "retail");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "retail.draft.json"), JSON.stringify({ format: 2, id: "te-retail", cards: [], intents: [], categories: [] }), "utf8");
  fs.writeFileSync(path.join(dir, "project.json"), JSON.stringify({ id: "te-retail", name: "Retail", rev: 0, edition: "", draft: "retail.draft.json", folder: null }), "utf8");

  const live = await listOn(path.join(ROOT, "src", "studio-thread-body.mjs"), root);
  const names = live.value && Array.isArray(live.value.projects) ? live.value.projects.map((p) => p.name) : null;
  check(!!names && names.length === 1 && !live.died,
    "te1 the real body, on a worker whose require(\"electron\") throws as a packaged one does, answers listProjects and names the"
    + " planted project: " + JSON.stringify(names || live));

  if (PLANTS_OFF) {
    skipped++;
    process.stdout.write("  SKIP  te2 lifting plant:wire-net-lazy kills the same worker (ETIUDA_PLANTS=off)\n");
  } else {
  const before = treeSha(ROOT);
  const tree = plantsTree(ROOT, "thread-electron");
  let lifted = null;
  try {
    const at = path.join(tree, "src", "wire.cjs");
    const text = fs.readFileSync(at, "utf8");
    const lines = text.split("\n");
    const hits = lines.map((l, i) => (l.indexOf("/* plant:wire-net-lazy */") >= 0 ? i : -1)).filter((i) => i >= 0);
    if (hits.length === 1) {
      lines[hits[0]] = "loadedNet = require(\"electron\").net;";
      fs.writeFileSync(at, lines.join("\n"));
      lifted = await listOn(path.join(tree, "src", "studio-thread-body.mjs"), root);
    } else lifted = { died: "the plant matched " + hits.length + " lines" };
  } finally { dropPlantsTree(tree, ROOT); }
  check(!!lifted && /Cannot find module 'electron'/.test(String(lifted.died || lifted.fault || "")) && treeSha(ROOT) === before,
    "te2 lifting plant:wire-net-lazy, so src/wire.cjs asks for electron as it loads, kills the same worker: "
    + JSON.stringify(lifted));
  }
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}

process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + "\n");
process.stdout.write("thread-electron  " + asserted + " assertion(s), " + failed + " failure(s)\n");
process.exit(failed || asserted + skipped !== EXPECTED ? 1 : 0);
