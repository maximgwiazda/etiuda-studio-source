/* NO STUDIO LEG READS THIS COMPUTER'S REGISTRY (decision 49; the test architect's ruling of 2026-11-13: "a leg never reads the real
 * registry, reads included, since it makes the leg depend on the machine it runs on"). Bare node, no window, no network.
 *
 *     node tests/reg-stand-held.mjs        exit code is the number of failed checks, capped at 63
 *
 *   rh1  every leg that loads shell/main.js imports tests/reg-stand-on.mjs before any other import, so the stand-in is in place
 *        before src/ai-policy.cjs takes child_process's execFileSync
 *   rh2  the shell loaded under the stand-in reads the policy from it: no policy, the licence answer carries none, the AI service is
 *        the person's and the update look is on; a policy scripted in the stand-in (Managed, AiProvider, StudioNoUpdateCheck)
 *        changes all three answers; every read was a reg query of the key, answered here, and none went past
 *   rh4  a leg whose reg call got past the stand-in fails at its exit (tests/reg-stand-on.mjs), whatever its own count says
 *   rh6  each of the stand-in's six replacements carries the mark the pinned desk's guard asks for, and no function under it does
 *   rh3  the stand-in over a stand-in child_process: a reg call never reaches the real function, by any of the six entry points,
 *        and another program does
 *
 * EVERY GUARD IS SHOWN RED (rhp): rh1 with one leg's import taken out, rh3 with the stand-in letting reg through (which reaches
 * only the recorder that stands for the machine here, never the machine), rh2 with the shell's read stood around the stand-in.
 * Nothing on disk is touched. Skipped under ETIUDA_PLANTS=off.
 */
import { regStand, queryText } from "./reg-stand-on.mjs";
import fs from "node:fs";
import path from "node:path";
import { createRequire, register } from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { seatEnvSync } from "./seated.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const Module = require("node:module");
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const EXPECTED = 6 + (PLANTS_OFF ? 0 : 7);
register("data:text/javascript," + encodeURIComponent('export async function resolve(spec, ctx, next) {'
  + ' if (String(spec).endsWith("engine/pinned/shell/tray.cjs")) return { url: "data:text/javascript,export const showNotification = () => {}; export const APP_IDS = {};", shortCircuit: true };'
  + ' return next(spec, ctx); }'));

let asserted = 0, failed = 0;
function check(ok, line) {
  asserted++;
  if (ok) console.log("  ok   " + line);
  else { failed++; console.log("  FAIL " + line); }
}

/* ---- rh1, the census ------------------------------------------------------------------------------------------------------ */
const TESTS = path.join(ROOT, "tests");
const OWN = new Set(["reg-stand.cjs", "reg-stand-on.mjs"]);
/** Whether a leg's text loads the shell in its own process: it compiles or loads modules itself and names shell/main.js. */
/* A shell is loaded by Module._load, by _compile, or as text run through new Function("require", ...), which is how the legs that
   drive the PINNED desk's shell run it (team-join, team-invite, relay-e2e, stats-span). The third way was not counted until the pin
   reached the engine's managed floor (2026-11-17): a pinned desk whose policy read is refused then waits and answers nothing. */
const loadsShell = (text) => /Module\._load|_compile\(|new Function\("require"/.test(text) && /"shell", "main\.js"|shell\/main\.js|"main\.js"\)/.test(text);
/** Whether the text imports the stand-in before any other import. */
const standsFirst = (text) => {
  const first = text.split("\n").find((l) => /^import\s/.test(l));
  return !!first && /^import (?:\{[^}]*\} from )?"\.\/reg-stand-on\.mjs";\s*$/.test(first);
};
function census(read) {
  const legs = fs.readdirSync(TESTS).filter((f) => /\.(mjs|cjs|js)$/.test(f) && !OWN.has(f)).sort();
  const loading = legs.filter((f) => loadsShell(read(f)));
  return { loading, missing: loading.filter((f) => !standsFirst(read(f))) };
}
const readLeg = (f) => fs.readFileSync(path.join(TESTS, f), "utf8");
const seen = census(readLeg);
check(seen.loading.length >= 20 && seen.missing.length === 0 && seen.loading.includes("reg-stand-held.mjs"),
  "rh1 every leg that loads shell/main.js imports tests/reg-stand-on.mjs first: " + seen.loading.length + " legs"
  + (seen.missing.length ? ", without it: " + seen.missing.join(" ") : ""));

/* ---- rh2, the shell reads the stand-in ---------------------------------------------------------------------------------- */
fs.mkdirSync(path.join(ROOT, "scratch"), { recursive: true });
const SCRATCH = fs.mkdtempSync(path.join(ROOT, "scratch", "reg-stand-held-"));
let shells = 0;
/** The shell under an Electron stand-in, its policy read left to whatever child_process answers. `around` stands in for
 *  src/ai-policy.cjs where a plant says so. */
function shellOn(around) {
  const ud = path.join(SCRATCH, "profile-" + (++shells));
  fs.mkdirSync(ud, { recursive: true });
  /* A look that read the newest note, so About says "newest" unless the policy turns the look off ("unchecked"). */
  fs.writeFileSync(path.join(ud, "update-note.json"), JSON.stringify({ looked: { at: 1, read: true } }) + "\n");
  const handlers = {};
  class Win {
    constructor() { this.webContents = { id: 1, on() {}, once() {}, send() {}, setWindowOpenHandler() {}, getURL: () => "", reload() {} }; }
    on() {} once() {} isDestroyed() { return false; } isMaximized() { return false; } isMinimized() { return false; }
    close() {} focus() {} restore() {} loadFile() {} show() {} showInactive() {} setMinimumSize() {}
  }
  const display = { bounds: { x: 0, y: 0, width: 1920, height: 1080 }, workAreaSize: { width: 1920, height: 1032 } };
  const electron = {
    net: { fetch: async () => { throw new Error("no network in this leg"); } },
    app: { commandLine: { appendSwitch() {}, hasSwitch: () => false, removeSwitch() {} }, getPath: () => ud, getVersion: () => "0.0.0",
      getLocale: () => "en-GB", requestSingleInstanceLock: () => true, whenReady: () => new Promise(() => {}), on() {}, quit() {}, exit() {}, isPackaged: false },
    BrowserWindow: Object.assign(Win, { fromWebContents: () => null, getAllWindows: () => [] }),
    Menu: { setApplicationMenu() {}, buildFromTemplate: () => ({ popup() {} }) }, dialog: {},
    nativeTheme: { themeSource: "system", shouldUseDarkColors: false }, clipboard: { writeText() {} },
    safeStorage: { isEncryptionAvailable: () => true, encryptString: (s) => Buffer.from(s), decryptString: (b) => String(b) },
    screen: { getAllDisplays: () => [display], getPrimaryDisplay: () => display, on() {}, removeListener() {} }, session: { defaultSession: {} },
    shell: { openExternal: async () => {}, openPath: async () => "", trashItem: async () => {} },
    ipcMain: { handle: (ch, fn) => { handlers[ch] = fn; }, on() {} },
  };
  /* A Studio that works, as a lead's does: the AI's settings are closed to one that does not (the gate). Its variables stay set for the
     asks that follow the load, which read them as they are made. */
  for (const [k, v] of Object.entries(seatEnvSync(ud, {}))) { if (v === null) delete process.env[k]; else process.env[k] = v; }
  const env = { STUDIO_TEST_OFFSCREEN: "1", STUDIO_NO_PROXY_SERVER: "off" };
  const was = {};
  for (const [k, v] of Object.entries(env)) { was[k] = process.env[k]; process.env[k] = v; }
  const main = path.join(ROOT, "shell", "main.js"), load = Module._load;
  delete require.cache[path.join(ROOT, "src", "ai-policy.cjs")];
  Module._load = function (req) {
    if (req === "electron") return electron;
    if (/studio-thread\.cjs$/.test(req)) return { call: () => Promise.resolve({}) };
    if (/engine[\\/]pinned[\\/]shell[\\/]/.test(req)) return new Proxy({}, { get: (t, k) => (k === "APP_IDS" ? {} : k === "windowsProxySwitches" ? () => [] : () => undefined) });
    if (around && /ai-policy\.cjs$/.test(req)) return around;
    return load.apply(this, arguments);
  };
  try {
    const m = new Module(main, null);
    m.filename = main; m.paths = Module._nodeModulePaths(path.dirname(main));
    m._compile(fs.readFileSync(main, "utf8"), main);
  } finally {
    Module._load = load;
    for (const [k, v] of Object.entries(was)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
  const ev = { senderFrame: { parent: null, url: pathToFileURL(path.join(ROOT, "ui", "index.html")).href }, sender: null };
  return async (ch, ...a) => { if (!handlers[ch]) throw new Error("no channel " + ch); return handlers[ch](ev, ...a); };
}
const SCRIPTED = queryText([["Managed", "REG_DWORD", "0x1"], ["AiProvider", "REG_SZ", "anthropic"], ["StudioNoUpdateCheck", "REG_DWORD", "0x1"]]);
async function readsHold(around) {
  const before = regStand.calls.query;
  regStand.setPolicy(null);
  const none = shellOn(around);
  const lic0 = await none("studio:licence"), ai0 = await none("studio:ai-settings"), up0 = await none("studio:update");
  regStand.setPolicy(SCRIPTED);
  const set = shellOn(around);
  const lic1 = await set("studio:licence"), ai1 = await set("studio:ai-settings"), up1 = await set("studio:update");
  regStand.setPolicy(null);
  const asked = regStand.calls.query - before;
  return {
    unset: !!lic0 && !("policy" in lic0) && !!ai0 && ai0.managed && ai0.managed.provider !== true && !!up0 && up0.about === "newest",
    licence: !!lic1 && !!lic1.policy && lic1.policy.managed === true,
    ai: !!ai1 && !!ai1.managed && ai1.managed.provider === true && ai1.provider === "anthropic",
    update: !!up1 && up1.about === "unchecked" && up1.offer === null,
    asked: asked >= 6, held: regStand.held(),
  };
}
const parts = (o) => Object.entries(o).map(([k, v]) => k + "=" + v).join(" ");
const all = (o) => Object.values(o).every((v) => v === true);
let rh2 = null;
try { rh2 = await readsHold(null); } catch (e) { rh2 = { loads: "no (" + String(e && e.message).slice(0, 100) + ")" }; }
check(all(rh2), "rh2 the shell's licence, AI and update reads take the stand-in's policy, none past it (" + regStand.said() + "): " + parts(rh2));

/* ---- rh3, the stand-in itself, over a stand-in child_process --------------------------------------------------------------- */
const STAND_SRC = fs.readFileSync(path.join(TESTS, "reg-stand.cjs"), "utf8");
/** reg-stand.cjs as a fresh module, `swap` [from, to] in place, installed over a recorder that stands for the machine. */
function standOver(swap) {
  /* The recorder below takes a call's words too, so a shell's own line can be told from another's. */
  let text = STAND_SRC;
  if (swap) {
    if (text.split(swap[0]).length !== 2) throw new Error("plant anchor not in reg-stand.cjs once: " + swap[0]);
    text = text.replace(swap[0], swap[1]);
  }
  const m = new Module(path.join(TESTS, "reg-stand-planted.cjs"), null);
  m.filename = path.join(TESTS, "reg-stand-planted.cjs"); m.paths = Module._nodeModulePaths(TESTS);
  m._compile(text, m.filename);
  const machine = [];
  const rec = (k) => function (file, args) { machine.push(k + " " + String(file) + " " + (Array.isArray(args) ? args.join(" ") : "")); return k === "spawn" || k === "execFile" || k === "exec" ? { on() { return this; } } : Buffer.from(""); };
  const fake = {}, under = {};
  for (const k of ["execFile", "execFileSync", "exec", "execSync", "spawn", "spawnSync"]) fake[k] = under[k] = rec(k);
  const h = m.exports.regStand(fake);
  return { fake, h, machine, under };
}
function standHolds(swap) {
  const { fake, h, machine } = standOver(swap);
  const key = "HKLM\\SOFTWARE\\Policies\\Etiuda";
  let threw = 0;
  for (const call of [() => fake.execFileSync("C:\\Windows\\System32\\reg.exe", ["query", key], { encoding: "utf8" }),
    () => fake.execFileSync("reg", ["query", "HKLM\\SOFTWARE\\Other"]), () => fake.execSync("reg query \"" + key + "\""),
    () => fake.spawnSync("REG.EXE", ["query", key]), () => fake.execFile("reg.exe", ["query", key], () => {}), () => fake.exec("reg query " + key, () => {})]) {
    try { call(); } catch { threw++; }
  }
  fake.execFileSync(process.execPath, ["-e", "0"]);
  const plainHeld = h.held();
  /* The registry by another way: cmd, PowerShell, pwsh, each never run, each counted, so the leg would fail at exit. */
  let other = 0;
  for (const call of [() => fake.exec("cmd /c reg query HKLM\\SOFTWARE\\Policies\\Etiuda", () => {}),
    () => fake.execFileSync("cmd.exe", ["/c", "reg", "query", key]), () => fake.execFileSync("powershell.exe", ["-Command", "Get-ItemProperty HKLM:\\SOFTWARE\\Policies\\Etiuda"]),
    () => fake.spawnSync("pwsh", ["-c", "Get-ItemProperty 'Registry::HKEY_LOCAL_MACHINE\\SOFTWARE'"]), () => fake.spawn("cmd", ["/c", "reg", "query", key])]) {
    try { call(); } catch { /* a refusal is what it should be */ }
    other++;
  }
  fake.execFileSync("cmd.exe", ["/c", "echo", "nothing of the registry"]);
  return { none: machine.filter((x) => x.indexOf(process.execPath) < 0 && !/ echo /.test(x)).length === 0, other: machine.length === 2, held: plainHeld,
    answered: threw === 3, shells: other === 5 && h.calls.reached === 5 && !h.held() };
}
let rh3 = null;
try { rh3 = standHolds(null); } catch (e) { rh3 = { loads: "no (" + String(e && e.message).slice(0, 100) + ")" }; }
check(all(rh3), "rh3 a reg call through any entry point never reaches the function under the stand-in, another program does: " + parts(rh3));

/* ---- rh6, the mark ---------------------------------------------------------------------------------------------------------- */
/* The pinned desk's shell runs a reg call outside Electron only through a function carrying this mark (the engine's
   shell/win-proxy.cjs, regOpts), and since the engine's managed floor a refused read is a policy that waits. The mark is a claim,
   "a reg call through this function is answered here and never reaches the machine", so it is held: set on each of the stand-in's
   own six replacements once they are in place, in a fresh stand and in this process, and never on a function under the stand. */
const MARK = Symbol.for("etiuda.reg-stand");
const SIX = ["execFile", "execFileSync", "exec", "execSync", "spawn", "spawnSync"];
function markHolds(swap) {
  const { fake, under } = standOver(swap);
  const live = require("node:child_process");
  return { six: SIX.every((k) => fake[k][MARK] === true), replaced: SIX.every((k) => fake[k] !== under[k]),
    under: SIX.every((k) => under[k][MARK] !== true), live: SIX.every((k) => typeof live[k] === "function" && live[k][MARK] === true) };
}
let rh6 = null;
try { rh6 = markHolds(null); } catch (e) { rh6 = { loads: "no (" + String(e && e.message).slice(0, 100) + ")" }; }
check(all(rh6), "rh6 while the stand is on each of its six replacements carries the pinned desk's mark, here and in a fresh stand, and the functions under it, kept aside, do not: " + parts(rh6));

/* ---- rh4, a reg call that got past fails the leg at its exit ------------------------------------------------------------- */
const ON_SRC = fs.readFileSync(path.join(TESTS, "reg-stand-on.mjs"), "utf8");
/** reg-stand-on.mjs's text run in a child of its own, as a leg would import it, with one reg call counted past the stand-in and the
 *  leg's own exit 0: whether the child still fails, and says why. Nothing reaches the registry; the count is set by hand. */
function exitHolds(text) {
  const at = JSON.stringify(pathToFileURL(path.join(TESTS, "reg-stand-on.mjs")).href);
  const src = text.replace("createRequire(import.meta.url)", "createRequire(" + at + ")").replace(/^export const /gm, "const ")
    + "\nregStand.calls.reached = 1;\nprocess.exit(0);\n";
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", src], { encoding: "utf8", windowsHide: true });
  return { failed: r.status !== 0, said: /FAIL reg-stand: a reg call reached/.test(String(r.stdout)) };
}
let rh4 = null;
try { rh4 = exitHolds(ON_SRC); } catch (e) { rh4 = { runs: "no (" + String(e && e.message).slice(0, 80) + ")" }; }
check(all(rh4), "rh4 a leg whose reg call got past the stand-in fails at its exit, whatever its own count: " + parts(rh4));

/* ---- rh5, a leg that reads the registry through cmd fails at its exit ------------------------------------------------------- */
let rh5 = null;
try {
  const src = ON_SRC.replace("createRequire(import.meta.url)", "createRequire(" + JSON.stringify(pathToFileURL(path.join(TESTS, "reg-stand-on.mjs")).href) + ")")
    .replace(/^export const /gm, "const ") + "\nrequire(\"node:child_process\").exec(\"cmd /c reg query HKLM\\\\SOFTWARE\\\\Policies\\\\Etiuda\", () => {});\nsetTimeout(() => process.exit(0), 50);\n";
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", src], { encoding: "utf8", windowsHide: true });
  rh5 = { failed: r.status !== 0, said: /FAIL reg-stand: a reg call reached/.test(String(r.stdout)) };
} catch (e) { rh5 = { runs: "no (" + String(e && e.message).slice(0, 80) + ")" }; }
check(all(rh5), "rh5 a leg whose line reads the registry through cmd (exec(\"cmd /c reg query HKLM\\...\")) never runs it and fails at its exit: " + parts(rh5));

/* ---- plants ------------------------------------------------------------------------------------------------------------------ */
if (!PLANTS_OFF) {
  /* rh1: one leg that loads the shell, its import taken out. */
  const victim = seen.loading.find((f) => f !== "reg-stand-held.mjs");
  const planted = victim ? census((f) => (f === victim ? readLeg(f).replace(/^import (?:\{[^}]*\} from )?"\.\/reg-stand-on\.mjs";\r?\n/m, "") : readLeg(f))) : { missing: [] };
  check(!!victim && planted.missing.includes(victim), "rhp1 plant " + victim + " without its import turns rh1 red");
  /* rh1, the third way: a leg that runs a shell as text through new Function("require", ...) and by neither of the other two. */
  const third = seen.loading.find((f) => f !== "reg-stand-held.mjs" && /new Function\("require"/.test(readLeg(f)) && !/Module\._load|_compile\(/.test(readLeg(f)));
  const planted3 = third ? census((f) => (f === third ? readLeg(f).replace(/^import (?:\{[^}]*\} from )?"\.\/reg-stand-on\.mjs";\r?\n/m, "") : readLeg(f))) : { missing: [] };
  check(!!third && planted3.missing.includes(third), "rhp1b plant " + third + ", which loads a shell through new Function, without its import turns rh1 red");
  /* rh3: the stand-in lets reg through; the recorder that stands for the machine is reached, never the machine. */
  let red = false;
  try { red = !all(standHolds(["if (!isReg(file)) return null; /* plant:rs-not-reg */", "return null;"])); } catch { red = false; }
  check(red, "rhp2 plant the stand-in letting reg through turns rh3 red");
  let redShell = false;
  try { redShell = !all(standHolds(["    if (isRegShell(file, args)) { calls.reached++; return missing(); } /* plant:rs-shell */", ""])); } catch { redShell = false; }
  check(redShell, "rhp5 plant the stand-in letting a shell read the registry turns rh3 red");
  /* rh2: the shell's read stood around the stand-in, as a leg that stubbed src/ai-policy.cjs would read: the scripted policy is
     never seen. */
  let red2 = false;
  try { red2 = !all(await readsHold({ aiPolicyText: () => "" })); } catch { red2 = true; }
  check(red2, "rhp3 plant the shell's read stood around the stand-in turns rh2 red");
  /* rh6: the marking taken out of the stand-in. */
  let red6 = false;
  try { red6 = markHolds(["  for (const k of [\"execFile\", \"execFileSync\", \"exec\", \"execSync\", \"spawn\", \"spawnSync\"]) real[k][STAND] = true;\n", ""]).six === false; } catch { red6 = false; }
  check(red6, "rhp6 plant the stand-in without its marking turns rh6 red");
  /* rh4: the exit's check taken out. */
  const exitSwap = ["  if (regStand.held()) return; /* plant:rs-exit */", "  if (true) return;"];
  check(ON_SRC.split(exitSwap[0]).length === 2 && !all(exitHolds(ON_SRC.replace(exitSwap[0], exitSwap[1]))), "rhp4 plant the exit's check taken out turns rh4 red");
}

try { fs.rmSync(SCRATCH, { recursive: true, force: true }); } catch { /* left for the next run */ }
const done = asserted === EXPECTED;
console.log("reg-stand-held: " + (failed ? failed + " of " + asserted + " FAILED" : "ran " + asserted + ", red 0") + (done ? "" : " (expected " + EXPECTED + ")"));
process.exit(!done ? Math.max(1, Math.min(failed, 63)) : Math.min(failed, 63));
