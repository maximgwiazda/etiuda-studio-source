/* THE STAND-ASIDE HELPER CANNOT STAND A LEG ASIDE ON WINDOWS (the test architect, 2026-11-14; Claude alpha's bound 1 of that
 * night: "The stand-aside helper must be unable to stand a leg aside on Windows: a plant that forces it (the platform faked) is
 * red on Windows for every leg that uses it, and each leg that stands aside prints its reason in its own output, as you say. A
 * leg that goes quiet on Windows is the failure this batch must not cause.").
 *
 *     node tests/off-windows-selftest.mjs
 *
 *   ow1 every leg file under tests/ that loads tests/off-windows.cjs is listed, by a regex over its import or require, and each one
 *       calls standAside; the helper reads no variable and no argument
 *   ow2 the helper as shipped: "" here on Windows, and off Windows a line naming the leg and its reason
 *   ow3 the plant: in a scratch copy of the helper, plant:off-windows-aside lifted to `aside = true`, the helper throws under
 *       the platform Windows (faked in a child for the copy alone, so this holds on every platform); the copy unplanted
 *       answers "" under Windows and the line under Linux, so the child's stand-in is not what throws
 *   ow4 a using leg run with the plant lifted goes red, not skipped: tests/file-name.mjs in a scratch copy of the tree exits
 *       non-zero with FAIL fn-13 naming the helper's refusal and no SKIP line. This one runs on Windows alone, where the plant
 *       has teeth, and stands aside off Windows through the helper itself
 *
 * Node only. The checkout is never planted: every plant is in a scratch copy, put back by nothing because it is dropped whole.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { plantsTree, treeSha, dropPlantsTree } from "./plants-tree.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const HELPER = path.join(HERE, "off-windows.cjs");
const MARK = "/* plant:off-windows-aside */";
const LIFTED = "  aside = true; /* plant:off-windows-aside lifted */";
const USING_LEG = "tests/file-name.mjs";
const EXPECTED = 4;
const NL = "\n";
const require = createRequire(import.meta.url);
const OffWindows = require("./off-windows.cjs");

let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + NL);
  else { failed++; process.stdout.write("  FAIL " + line + NL); }
}
function skip(line) { skipped++; process.stdout.write("  SKIP  " + line + NL); }

function scripts(dir, rel) {
  const out = [];
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    if (d.name === "node_modules") continue;
    const abs = path.join(dir, d.name), r = rel + "/" + d.name;
    if (d.isDirectory()) out.push(...scripts(abs, r));
    else if (/\.(mjs|js|cjs)$/.test(d.name)) out.push(r);
  }
  return out;
}
/* Asks a copy of the helper under a platform stood in for process.platform, in a child, so no leg of this process is touched. */
function askCopy(helperFile, platform) {
  const code = 'Object.defineProperty(process, "platform", { value: ' + JSON.stringify(platform) + ', configurable: true });'
    + 'try { const a = require(' + JSON.stringify(helperFile) + ').standAside("ow-probe", "a probe of the selftest");'
    + ' console.log(JSON.stringify({ threw: false, answer: a })); }'
    + ' catch (e) { console.log(JSON.stringify({ threw: true, message: String(e && e.message || e) })); }';
  const r = spawnSync(process.execPath, ["-e", code], { encoding: "utf8", timeout: 30000, windowsHide: true });
  try { return JSON.parse(String(r.stdout || "").trim().split(/\r?\n/).pop()); }
  catch { return { threw: null, message: "no answer: " + String(r.stderr || r.stdout || "").slice(0, 200) }; }
}
function liftedText(text) {
  const nl = text.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
  const lines = text.split(nl);
  const hits = lines.map((l, i) => (l.indexOf(MARK) >= 0 ? i : -1)).filter((i) => i >= 0);
  if (hits.length === 1) lines[hits[0]] = LIFTED;
  return { hits: hits.length, text: lines.join(nl) };
}

/* ow1 */
const helperText = fs.readFileSync(HELPER, "utf8");
const users = scripts(HERE, "tests").filter((r) => r !== "tests/off-windows.cjs" && r !== "tests/off-windows-selftest.mjs")
  .filter((r) => /(?:\bfrom|\brequire\(|\bimport\()\s*["']\.\/off-windows\.cjs["']/.test(fs.readFileSync(path.join(ROOT, r), "utf8"))).sort();
const calling = users.filter((r) => fs.readFileSync(path.join(ROOT, r), "utf8").indexOf("standAside(") >= 0);
const helperCode = helperText.replace(/\/\*[\s\S]*?\*\//g, "");
const noSwitch = !/process\.env|process\.argv|arguments\b/.test(helperCode);
check(users.length > 0 && calling.length === users.length && users.indexOf(USING_LEG) >= 0 && noSwitch,
  "ow1 " + users.length + " leg file(s) under tests/ load tests/off-windows.cjs (a regex for from, require( or import( followed by"
  + " \"./off-windows.cjs\" over every .mjs, .js and .cjs under tests/, this file and the helper left out), each calling standAside, and the helper reads no variable"
  + " and no argument: " + users.join(", ") + (noSwitch ? "" : " | the helper's code names process.env, process.argv or arguments"));

/* ow2 */
const here = OffWindows.standAside("ow-probe", "a probe of the selftest");
const onWin = process.platform === "win32";
check(onWin ? here === "" : here === "ow-probe stands aside off Windows: a probe of the selftest",
  "ow2 the helper as shipped answers " + JSON.stringify(here) + " on " + process.platform
  + (onWin ? ", so every using leg runs its assertion here" : ", the line its leg prints through its own skip"));

/* ow3 */
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "off-windows-selftest-"));
let ow3 = { hits: 0 };
try {
  const plainFile = path.join(scratch, "plain", "off-windows.cjs"), plantFile = path.join(scratch, "planted", "off-windows.cjs");
  fs.mkdirSync(path.dirname(plainFile), { recursive: true });
  fs.mkdirSync(path.dirname(plantFile), { recursive: true });
  fs.writeFileSync(plainFile, helperText);
  const lifted = liftedText(helperText);
  fs.writeFileSync(plantFile, lifted.text);
  ow3 = { hits: lifted.hits, planted: askCopy(plantFile, "win32"), plainWin: askCopy(plainFile, "win32"), plainLinux: askCopy(plainFile, "linux") };
} finally {
  try { fs.rmSync(scratch, { recursive: true, force: true }); } catch { /* the selftest's own scratch, named below if held */ }
  if (fs.existsSync(scratch)) process.stderr.write("off-windows-selftest scratch remains: " + scratch + NL);
}
check(ow3.hits === 1 && ow3.planted && ow3.planted.threw === true && /told to stand aside on Windows/.test(ow3.planted.message)
    && ow3.plainWin && ow3.plainWin.threw === false && ow3.plainWin.answer === ""
    && ow3.plainLinux && (os.type() === "Windows_NT"
      ? ow3.plainLinux.threw === true && /told to stand aside on Windows/.test(ow3.plainLinux.message) /* a platform faked on a Windows kernel is still Windows */
      : ow3.plainLinux.threw === false && /^ow-probe stands aside off Windows: /.test(ow3.plainLinux.answer)),
  "ow3 with plant:off-windows-aside lifted to `aside = true` in a scratch copy the helper throws under Windows, and the copy"
  + " unplanted answers \"\" under Windows, and under a Linux platform its line on a Linux kernel or a throw on a Windows one: " + JSON.stringify(ow3));

/* ow4 */
const ow4Aside = OffWindows.standAside("ow4", "the plant has teeth on Windows alone, where the decision would otherwise run the"
  + " assertion; off Windows a lifted plant stands the leg aside as it would anyway, and ow3 holds the guard on every platform");
if (ow4Aside) skip(ow4Aside);
else {
  const before = treeSha(ROOT);
  let copy = null, status = null, said = "", hits = 0;
  try {
    copy = plantsTree(ROOT, "off-windows-selftest");
    /* The checkout's own helper and leg, whatever the index holds, then the plant lifted in the copy's helper. */
    fs.copyFileSync(path.join(ROOT, USING_LEG), path.join(copy, USING_LEG));
    const lifted = liftedText(helperText);
    hits = lifted.hits;
    fs.writeFileSync(path.join(copy, "tests", "off-windows.cjs"), lifted.text);
    if (hits === 1) {
      const r = spawnSync(process.execPath, [path.join(copy, USING_LEG)], { cwd: copy, encoding: "utf8", timeout: 600000, windowsHide: true,
        env: Object.assign({}, process.env, { ETIUDA_PLANTS: "off" }) });
      status = r.status;
      said = String(r.stdout || "") + String(r.stderr || "");
    }
  } finally {
    if (copy) dropPlantsTree(copy, ROOT);
  }
  const failLine = said.split(/\r?\n/).find((l) => /FAIL fn-13\b/.test(l)) || "";
  const red = status !== 0 && status !== null && /told to stand aside on Windows/.test(failLine);
  const noSkip = !/^\s*SKIP\b/m.test(said);
  check(hits === 1 && red && noSkip && treeSha(ROOT) === before,
    "ow4 " + USING_LEG + " run with the plant lifted in a scratch copy goes red, not skipped: exit " + status
    + ", " + (failLine ? failLine.trim().slice(0, 220) : "no FAIL fn-13 line") + (noSkip ? ", no SKIP line" : ", a SKIP line printed")
    + ", the checkout's src/, shell/ and ui/ unchanged");
}

process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + NL);
if (asserted + skipped !== EXPECTED) {
  process.stdout.write("SUITE DID NOT COMPLETE: " + (asserted + skipped) + " of " + EXPECTED + " checks ran" + NL);
  process.exit(78);
}
process.stdout.write("off-windows-selftest  " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)" + NL);
process.exit(failed ? 1 : 0);
