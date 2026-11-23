/* A STAND-IN FOR reg.exe, for every Studio leg that loads shell/main.js in bare node (the engine's tests/reg-stand.cjs, Studio's
 * own). Studio reads the registry in two places, each through reg.exe: src/ai-policy.cjs's `reg query HKLM\SOFTWARE\Policies\Etiuda`,
 * which the licence's managed policy, the customer's AI service and the update look all take, and src/sync-roots.cjs's four reads of
 * where a synced folder lives (HKCU\Software\Microsoft\OneDrive\Accounts, HKCU\Software\Google\DriveFS,
 * HKLM\SOFTWARE\Policies\Google\DriveFS and HKCU\Network), answered here as missing. A leg that ran the real reg.exe would answer
 * from whatever this computer holds. tests/reg-stand-on.mjs installs it once, before anything else loads; tests/reg-stand-held.mjs
 * holds that every shell-loading leg imports it and that no reg call goes past it.
 *
 * It replaces node:child_process's execFile, execFileSync, exec, execSync, spawn and spawnSync in place and syncs the ES module
 * bindings, so any require or import taken afterwards gets it. A call whose program is reg or reg.exe, by any path, is answered
 * here and never reaches the machine: `reg query` of the policy key answers the scripted policy (setPolicy, the text reg query
 * prints) or, with none, fails as reg.exe does for a key that is not there; every other reg call fails the same way and is
 * counted. A call to cmd, PowerShell or pwsh whose words carry reg or a registry path (HKLM:, HKCU:, Registry::, HKEY_) is a
 * registry read by another way: it is never run, fails as missing, and is counted as reached, so the leg fails at its exit. Every
 * other program goes to the real function unchanged. spawn of reg, or of such a shell, throws, as not stood in. */
"use strict";
const path = require("node:path");
const { syncBuiltinESMExports } = require("node:module");

const norm = (x) => String(x).replace(/\//g, "\\");
const POLICY = /^(?:HKLM|HKEY_LOCAL_MACHINE)\\SOFTWARE\\Policies\\Etiuda$/i;
const HIVE = /^(?:HKLM|HKEY_LOCAL_MACHINE)(?:\\|$)/i;
const isReg = (file) => /^reg(\.exe)?$/i.test(path.win32.basename(String(file || "")));
const REG_WORDS = /(?:^|[\s"'\\\/])reg(?:\.exe)?(?=$|[\s"'])|HKLM:|HKCU:|Registry::|HKEY_/i;
/** A shell asked to read the registry by another way: cmd, PowerShell or pwsh, its words carrying reg or a registry path. */
const isRegShell = (file, args) => /^(?:cmd|powershell|pwsh)(?:\.exe)?$/i.test(path.win32.basename(String(file || "")))
  && REG_WORDS.test((Array.isArray(args) ? args : []).map(String).join(" "));
const words = (cmd) => Array.from(String(cmd).matchAll(/"([^"]*)"|(\S+)/g), (m) => (m[1] !== undefined ? m[1] : m[2]));
/** The text `reg query` prints for the policy key holding `values`, [[name, type, value]], as src/ai-policy.cjs receives it. */
function queryText(values) {
  return "\r\nHKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Etiuda\r\n" + (values || []).map(([n, t, v]) => "    " + n + "    " + t + "    " + v + "\r\n").join("") + "\r\n";
}

function regStand(real, opts) {
  if (real.__regStand) return real.__regStand;
  let policy = opts && typeof opts.policy === "string" ? opts.policy : null;
  const calls = { query: 0, other: 0, machine: 0, user: 0, reached: 0 };
  const orig = {};
  for (const k of ["execFile", "execFileSync", "exec", "execSync", "spawn", "spawnSync"]) orig[k] = real[k];
  const missing = () => {
    const e = new Error("ERROR: The system was unable to find the specified registry key or value.");
    e.status = 1;
    return { error: e };
  };
  /* The answer for a reg call, or null where the program is not reg. */
  const answer = (file, args) => {
    if (isRegShell(file, args)) { calls.reached++; return missing(); } /* plant:rs-shell */
    if (!isReg(file)) return null; /* plant:rs-not-reg */
    const a = (Array.isArray(args) ? args : []).map(String), keys = a.map(norm), verb = String(a[0] || "").toLowerCase();
    if (keys.some((x) => POLICY.test(x))) {
      if (verb !== "query") { calls.other++; return missing(); }
      calls.query++;
      return policy == null ? missing() : { stdout: policy };
    }
    calls[keys.some((x) => HIVE.test(x)) ? "machine" : "user"]++;
    return missing();
  };
  const out = (enc, s) => (enc && enc !== "buffer" ? String(s) : Buffer.from(String(s)));
  const encOf = (x) => (x && typeof x === "object" ? x.encoding : undefined);
  const later = (cb, r, enc) => setImmediate(() => cb && cb(r.error || null, r.error ? out(enc, "") : out(enc, r.stdout), out(enc, "")));
  const child = { pid: 0, on() { return this; }, once() { return this; }, kill() { return true; } };
  const fromLine = (cmd) => { const w = words(cmd); return [w[0], w.slice(1)]; };
  /* The real function. A reg call that gets here went past the stand-in, which is counted so that held() fails. */
  const pass = (file, k, args) => { if (isReg(file)) calls.reached++; return orig[k].apply(real, args); };
  Object.assign(real, {
    execFileSync(file, args, options) {
      const r = answer(file, args);
      if (!r) return pass(file, "execFileSync", arguments);
      if (r.error) throw r.error;
      return out(encOf(options), r.stdout);
    },
    execFile(file, args, options, cb) {
      const r = answer(file, args);
      if (!r) return pass(file, "execFile", arguments);
      later([args, options, cb].find((f) => typeof f === "function"), r, encOf(options));
      return child;
    },
    execSync(cmd, options) {
      const [file, args] = fromLine(cmd);
      const r = answer(file, args);
      if (!r) return pass(file, "execSync", arguments);
      if (r.error) throw r.error;
      return out(encOf(options), r.stdout);
    },
    exec(cmd, options, cb) {
      const [file, args] = fromLine(cmd);
      const r = answer(file, args);
      if (!r) return pass(file, "exec", arguments);
      later([options, cb].find((f) => typeof f === "function"), r, encOf(options));
      return child;
    },
    spawnSync(file, args, options) {
      const r = answer(file, args);
      if (!r) return pass(file, "spawnSync", arguments);
      const enc = encOf(options);
      return { pid: 0, status: r.error ? 1 : 0, signal: null, stdout: out(enc, r.error ? "" : r.stdout), stderr: out(enc, ""), output: [] };
    },
    spawn(file, args) {
      if (isRegShell(file, args)) { calls.reached++; throw new Error("reg-stand: a shell reading the registry is not stood in"); }
      if (isReg(file)) throw new Error("reg-stand: spawn of reg is not stood in; use execFileSync");
      return pass(file, "spawn", arguments);
    },
  });
  /* THE PINNED DESK'S OWN GUARD ASKS FOR THIS MARK. Outside Electron the desk's shell runs a reg call only through a function that
     carries Symbol.for("etiuda.reg-stand") (the engine's shell/win-proxy.cjs, regOpts), and refuses any other before reg.exe
     starts. Until the engine's managed floor a refused read was taken for no policy, so a leg that loads the pinned shell passed
     unmarked; since it (engine fold 108) a read that could not be made is a policy that waits, and a desk that waits opens no
     team's catalog. These six are stand-ins in the mark's own sense: a reg call through them is answered here and never reaches
     the machine, so they say so. */
  const STAND = Symbol.for("etiuda.reg-stand");
  for (const k of ["execFile", "execFileSync", "exec", "execSync", "spawn", "spawnSync"]) real[k][STAND] = true;
  syncBuiltinESMExports();
  const handle = {
    calls,
    /** The text the next `reg query` of the policy key answers, or null for no policy (the default). */
    setPolicy(text) { policy = typeof text === "string" ? text : null; },
    /** No reg call reached the machine. */
    held: () => calls.reached === 0,
    said: () => calls.query + " query of the policy key, " + calls.other + " other of it, " + calls.machine + " elsewhere in HKLM, "
      + calls.user + " outside it, " + calls.reached + " past the stand-in",
  };
  Object.defineProperty(real, "__regStand", { value: handle, enumerable: false });
  return handle;
}

module.exports = { regStand, queryText, isReg, isRegShell };
