/* THE PROXY ORACLE OF tests/settings-screen.mjs 0b: the pinned engine's win-proxy.cjs, answered from planted reg output.
   A test run reads no part of this machine's registry, and the engine's reg-stand mark (Symbol.for("etiuda.reg-stand"))
   means a stand-in, never the registry behind one. So the two marked functions here answer a planted `reg query` text for
   each of the keys win-proxy.cjs asks, by exact file and arguments, and throw on every other call; nothing is passed on to
   reg.exe. They stand in the builtin child_process only while the reader is loaded fresh, and the builtin is put back. */
import { createRequire } from "node:module";
import path from "node:path";

const REG_TOOL = "C:\\Windows\\System32\\reg.exe";
const IS = "\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings";
const KEYS = {
  policy: "HKLM\\Software\\Policies\\Microsoft\\Windows\\CurrentVersion\\Internet Settings",
  user: "HKCU" + IS, userConn: "HKCU" + IS + "\\Connections",
  machine: "HKLM" + IS, machineConn: "HKLM" + IS + "\\Connections",
};
const blob = (flags) => "4600000002000000" + (flags & 0xff).toString(16).padStart(2, "0").toUpperCase() + "00".repeat(47);
/* A key's values, a blank line and its subkeys, in the shape and line endings reg prints. */
const dump = (key, values) => ["", key, ...values.map(([n, t, v]) => "    " + n + "    " + t + "    " + v), "",
  key + "\\Connections", key + "\\Wpad", ""].join("\r\n");
const conn = (key, flags) => ["", key, "    DefaultConnectionSettings    REG_BINARY    " + blob(flags), ""].join("\r\n");
const MISSING = null; /* reg's "unable to find the specified registry key": exit status 1 */
const UA = ["User Agent", "REG_SZ", "Mozilla/4.0 (compatible; MSIE 8.0; Win32)"];

/* What each state is, what Windows' own switch then means for Studio, and the reg text that makes it so. */
export const PROXY_STATES = {
  policy: {
    means: "a proxy set by policy is followed before the settings it would override: Studio names it to Chromium, with its bypass list, and does no discovery",
    answers: { [KEYS.policy]: dump(KEYS.policy, [["ProxyEnable", "REG_DWORD", "0x1"], ["ProxyServer", "REG_SZ", "proxy.office.test:8080"], ["ProxyOverride", "REG_SZ", "*.office.test;<local>"]]),
      [KEYS.user]: MISSING, [KEYS.userConn]: MISSING },
    switches: [["proxy-server", "proxy.office.test:8080"], ["proxy-bypass-list", "*.office.test;<local>"]],
  },
  manual: {
    means: "a manual proxy in Internet Settings, with an exception list, is named to Chromium with that list, and Studio does no discovery",
    answers: { [KEYS.policy]: MISSING,
      [KEYS.user]: dump(KEYS.user, [["ProxyEnable", "REG_DWORD", "0x1"], ["ProxyServer", "REG_SZ", "proxy.home.test:3128"], ["ProxyOverride", "REG_SZ", "localhost;*.home.test;<local>"], UA]),
      [KEYS.userConn]: conn(KEYS.userConn, 3) },
    switches: [["proxy-server", "proxy.home.test:3128"], ["proxy-bypass-list", "localhost;*.home.test;<local>"]],
  },
  none: {
    means: "no proxy: Windows' flags say direct alone, so Studio switches proxy discovery off and there is no wpad lookup and no IPv6 probe at idle",
    answers: { [KEYS.policy]: MISSING,
      [KEYS.user]: dump(KEYS.user, [["ProxyEnable", "REG_DWORD", "0x0"], UA]),
      [KEYS.userConn]: conn(KEYS.userConn, 1) },
    switches: [["no-proxy-server"]],
  },
  automatic: {
    means: "automatic detection on, no proxy named: Chromium's resolver is left to find an office's proxy, so Studio discovers as a start without the switch does",
    answers: { [KEYS.policy]: MISSING,
      [KEYS.user]: dump(KEYS.user, [["ProxyEnable", "REG_DWORD", "0x0"], UA]),
      [KEYS.userConn]: conn(KEYS.userConn, 9) },
    switches: [],
  },
};

/* The pinned reader's answer for one planted state: { switches, handled, refused }, where `handled` lists the calls the
   stand-ins answered. A call outside the planted queries throws; the reader then reads it as a failed read and answers []. */
export function plantedProxySwitches(root, state, during) {
  const st = PROXY_STATES[state];
  if (!st) throw new Error("win-proxy-oracle: no planted state " + state);
  const handled = [], refused = [];
  const answer = (file, argv) => {
    const key = Array.isArray(argv) && argv.length === 2 && argv[0] === "query" ? argv[1] : null;
    if (file !== REG_TOOL || key === null || !Object.prototype.hasOwnProperty.call(st.answers, key)) {
      refused.push([file, argv]);
      throw new Error("win-proxy-oracle: not a planted query: " + JSON.stringify([file, argv]));
    }
    handled.push(key);
    return st.answers[key];
  };
  const missing = () => Object.assign(new Error("ERROR: The system was unable to find the specified registry key or value."), { status: 1, code: 1 });
  const standIn = {
    execFileSync: (file, argv) => { const t = answer(file, argv); if (t === MISSING) throw missing(); return t; },
    execFile: (file, argv, opts, cb) => {
      let t; try { t = answer(file, argv); } catch (e) { cb(e, "", ""); return {}; }
      if (t === MISSING) cb(missing(), "", ""); else cb(null, t, "");
      return {};
    },
  };
  const mark = Symbol.for("etiuda.reg-stand");
  for (const n of Object.keys(standIn)) standIn[n][mark] = true;
  const cp = process.getBuiltinModule("node:child_process");
  const was = { execFileSync: cp.execFileSync, execFile: cp.execFile };
  const req = createRequire(import.meta.url), at = req.resolve(path.join(root, "engine", "pinned", "shell", "win-proxy.cjs"));
  const cached = req.cache[at];
  delete req.cache[at];
  let switches;
  try {
    cp.execFileSync = standIn.execFileSync; cp.execFile = standIn.execFile;
    const wp = req(at);
    if (typeof during === "function") during(cp); /* the proof's own calls, to show a call outside the plant is refused */
    const platform = Object.getOwnPropertyDescriptor(process, "platform");
    Object.defineProperty(process, "platform", { value: "win32" });
    try { switches = wp.windowsProxySwitches(); } finally { Object.defineProperty(process, "platform", platform); }
  } finally {
    cp.execFileSync = was.execFileSync; cp.execFile = was.execFile;
    if (cached) req.cache[at] = cached; else delete req.cache[at];
  }
  return { switches, handled, refused };
}
