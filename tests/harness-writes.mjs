/* A HARNESS LAUNCH OF STUDIO WRITES NO JUMP LIST, which Windows keeps per account outside any lab.
 *
 * gate-kind: node
 *
 *     node tests/harness-writes.mjs
 *
 * Read from shell/main.js and run on stand-ins: the harness marker, updateJumpList under it and without it (the
 * control: a customer's start still writes), and no other call of the jump list; then the toasts, the first-close one
 * and the waiting check's, the same way. Each guard is shown red in memory by cutting the line carrying its plant tag;
 * nothing on disk is touched. Exit code is the number of failed checks. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MAIN = path.join(ROOT, "shell", "main.js");
let checks = 0, failures = 0;
const check = (ok, what) => { checks++; console.log((ok ? "  ok   " : "  FAIL ") + what); if (!ok) failures++; };

const code = src => src.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, " ")).replace(/(^|[^:"'\\])\/\/[^\n]*/g, "$1");
function fnText(src, name) {
  const at = src.search(new RegExp("^(async )?function " + name + "\\(", "m"));
  if (at < 0) return "";
  const end = src.indexOf("\n}", at);
  return end < 0 ? "" : src.slice(at, end + 2);
}

/* updateJumpList run with every name it reads stood in: how many lists it hands Windows. */
async function writesOf(src, harness) {
  const text = fnText(src, "updateJumpList");
  if (!text) return -1;
  let wrote = 0;
  const app = { setJumpList: () => {}, getPath: () => "C:\\lab\\ud" };
  const S = { listProjects: () => ({ projects: [{ name: "A", dir: "C:\\lab\\a", opened: "2026-11-11T10:00:00Z" }] }) };
  const make = new Function("app", "trayWords", "studio", "projectsRoot", "readStore", "path", "setJumpList", "harnessLaunch",
    text + "\nreturn updateJumpList;");
  const fn = make(app, () => ({}), async () => S, () => "C:\\lab\\projects", () => ({}), path, () => { wrote++; }, () => harness);
  await fn();
  return wrote;
}

async function judge(srcRaw) {
  const src = code(srcRaw);
  const out = {};
  const hl = fnText(src, "harnessLaunch");
  try {
    const run = (argv, env) => new Function("process", hl + "\nreturn harnessLaunch();")({ argv, env });
    out.marker = { plain: run(["Etiuda Studio.exe"], {}), udd: run(["x", "--user-data-dir=C:\\lab\\ud"], {}),
      gate: run(["x"], { STUDIO_GATE: "1" }), offscreen: run(["x"], { STUDIO_TEST_OFFSCREEN: "" }),
      docs: run(["x"], { ETIUDA_TEST_DOCUMENTS: "C:\\lab\\d" }), lookalike: run(["x", "--user-data-dirx"], {}) };
  } catch (e) { out.marker = { error: e.message }; }
  out.under = await writesOf(src, true);
  out.outside = await writesOf(src, false);
  const all = (src.match(/\bsetJumpList\s*\(/g) || []).length;
  const inside = (fnText(src, "updateJumpList").match(/\bsetJumpList\s*\(/g) || []).length;
  out.elsewhere = all - inside;
  /* the first-close toast: maybeFirstClose with its names stood in, counting what reaches notifyFirstClose */
  const mfc = fnText(src, "maybeFirstClose");
  out.toast = {};
  for (const harness of [true, false]) {
    let calls = 0;
    try {
      new Function("trayWords", "notifyFirstClose", "Notification", "app", "APP_IDS", "trayToldThisRun", "showStudio", "harnessLaunch",
        mfc + "\nreturn maybeFirstClose;")(() => ({}), () => { calls++; }, function () {}, {}, { studio: "x" }, false, () => {}, () => harness)({});
    } catch (e) { calls = "threw " + e.message; }
    out.toast[harness ? "under" : "outside"] = calls;
  }
  /* the waiting check's toasts: the Notification it hands checkWaiting is null under the marker */
  const rwc = fnText(src, "runWaitingCheck");
  const iLet = rwc.indexOf("let toaster = Notification;"), iGuard = rwc.indexOf("if (harnessLaunch()) toaster = null;");
  const iCall = rwc.indexOf("checkWaiting("), handed = /electron:\s*\{\s*app,\s*Notification:\s*toaster\s*\}/.test(rwc);
  out.waiting = iLet > -1 && iGuard > iLet && iCall > iGuard && handed ? "guarded" : "UNGUARDED";
  if (out.waiting === "guarded") {
    const lines = rwc.slice(iLet, rwc.lastIndexOf("\n", iCall));
    const toaster = harness => new Function("Notification", "harnessLaunch", lines + "\nreturn toaster;")("N", () => harness);
    out.waitingUnder = toaster(true);
    out.waitingOutside = toaster(false);
  }
  /* no toast reaches Windows by another call */
  const toastCalls = (src.match(/\b(notifyFirstClose|showNotification|checkWaiting)\s*\(/g) || []).length;
  const guardedCalls = (mfc.match(/\bnotifyFirstClose\s*\(/g) || []).length + (rwc.match(/\bcheckWaiting\s*\(/g) || []).length;
  out.toastElsewhere = toastCalls - guardedCalls + (/\bnew\s+Notification\s*\(/.test(src) ? 1 : 0);
  return out;
}

const src = fs.readFileSync(MAIN, "utf8");
/* ETIUDA_PLANTS=off (a merge's area run) runs no planted fault: the three controls that cut a plant-tagged guard line
   (hw5, hw10, hw11) are skipped and said so; the release profile, plants on, runs them (tests/plant-hold.mjs, pk-off). */
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
let notRun = 0;
const skipPlant = (id) => { notRun++; console.log("  SKIP " + id + " a planted control, under ETIUDA_PLANTS=off"); };
const now = await judge(src);
const m = now.marker || {};
check(m.plain === false && m.udd === true && m.gate === true && m.offscreen === true && m.docs === true && m.lookalike === false,
  "hw1 the harness marker: a plain start is no harness launch; --user-data-dir, STUDIO_GATE, STUDIO_TEST_OFFSCREEN (even empty) "
  + "or ETIUDA_TEST_DOCUMENTS is; a look-alike switch is not: " + JSON.stringify(m));
check(now.under === 0, "hw2 updateJumpList under the marker hands Windows no jump list: " + now.under + " write(s)");
check(now.outside === 1, "hw3 control: the same updateJumpList on a customer's start still writes the list once: " + now.outside);
check(now.elsewhere === 0, "hw4 nothing else in the shell calls setJumpList: " + now.elsewhere + " call(s) outside updateJumpList");
if (PLANTS_OFF) skipPlant("hw5");
else {
  const cut = src.split("\n").filter(l => l.indexOf("plant:harness-jump") < 0).join("\n");
  const lifted = await judge(cut);
  check(src.indexOf("plant:harness-jump") > -1 && lifted.under === 1,
    "hw5 control: cutting plant:harness-jump lets a harness launch write the list: " + lifted.under + " write(s)");
}
const planted = await judge(src.replace(/^function parseOpenArg\(/m, "function stray() { setJumpList(app, {}); }\nfunction parseOpenArg("));
check(planted.elsewhere === 1, "hw6 control: a setJumpList planted outside updateJumpList is counted: " + planted.elsewhere);

check(now.toast.under === 0 && now.toast.outside === 1,
  "hw7 the first-close toast (app.etiuda.studio) reaches notifyFirstClose under the marker " + now.toast.under
  + " time(s), and on a customer's start, the control, " + now.toast.outside);
check(now.waiting === "guarded" && now.waitingUnder === null && now.waitingOutside === "N",
  "hw8 the waiting check is handed no Notification under the marker and the real one on a customer's start, the control: "
  + now.waiting + ", " + JSON.stringify(now.waitingUnder) + " / " + JSON.stringify(now.waitingOutside));
check(now.toastElsewhere === 0, "hw9 no other call in the shell shows a toast: " + now.toastElsewhere);
if (PLANTS_OFF) { skipPlant("hw10"); skipPlant("hw11"); }
else {
  const toastCut = await judge(src.split("\n").filter(l => l.indexOf("plant:harness-toast") < 0).join("\n"));
  check(src.indexOf("plant:harness-toast") > -1 && toastCut.toast.under === 1,
    "hw10 control: cutting plant:harness-toast lets a harness close show the first-close toast: " + toastCut.toast.under);
  const waitingCut = await judge(src.split("\n").filter(l => l.indexOf("plant:harness-waiting") < 0).join("\n"));
  check(src.indexOf("plant:harness-waiting") > -1 && waitingCut.waiting !== "guarded",
    "hw11 control: cutting plant:harness-waiting hands the waiting check the real Notification: " + waitingCut.waiting);
}
const strayToast = await judge(src.replace(/^function parseOpenArg\(/m, "function stray() { notifyFirstClose({}); }\nfunction parseOpenArg("));
check(strayToast.toastElsewhere === 1, "hw12 control: a toast call planted outside the guards is counted: " + strayToast.toastElsewhere);

console.log("\n#counts checks=" + checks + " failures=" + failures + " notRun=" + notRun);
console.log("harness-writes  " + (failures ? "FAILED " + failures + " of " : "passed ") + checks + " check(s)");
process.exit(Math.min(failures, 63));
