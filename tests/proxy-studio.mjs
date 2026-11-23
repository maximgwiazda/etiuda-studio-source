/* A COMPANY PROXY THAT ASKS FOR A SIGN-IN, AND THE RELAY'S SOCKET BEHIND ONE, IN STUDIO.
 *
 *     node tests/proxy-studio.mjs        exit code is the number of failed checks, capped at 63
 *
 * gate-kind: node
 *
 * Claude alpha's criterion: "each thing a large company's IT would test on its own network and refuse on is closed or measured
 * before they test it". A proxy that asks for credentials must work, Windows sign-in without a prompt where the proxy allows it
 * "and a clear prompt otherwise, never a silent failure"; and the relay's live socket "should go through the proxy the system
 * names", the minute's asking staying as the fallback, said in the log once. Studio's half: src/wire.cjs makes every call through
 * the pinned engine's proxy module with one sign-in listener, the shell asks the page and hands the answer back, and the page asks
 * the person (ui/proxy-ask.js). Nothing here opens a window, reaches the internet or reads a credential store: Electron's net, its
 * session, the runtime's socket and the page's document are stood in, the one proxy is a server on 127.0.0.1 made here, and every
 * credential is invented.
 *
 *   ps1  every call src/wire.cjs makes (the relay, the licence service's route and its note, the AI service, the sign-in token)
 *        is Chromium's request with a sign-in listener; a proxy's Basic challenge is asked once through the shell's hand and every
 *        call carries the answer; a challenge from a server that is not a proxy is never asked or answered; a call's own
 *        credentials option (omit) reaches the request
 *   ps2  a runtime offering only Electron's fetch, as the other legs' stand-ins do, is still reached through it
 *   ps3  the relay's socket: an address the door does not admit is refused before any proxy is asked; where Chromium names no
 *        proxy the runtime's own socket opens, saying it tells its opening; where it names one, the socket is a CONNECT to that
 *        proxy for the relay's own host and port, carrying the answer the person gave, and a refusal closes it unopened and is said
 *        once in the log, naming host and port alone
 *   ps4  the shell: a question from the door reaches the page by its channel and by the list the page asks for as it loads; the
 *        page's answer by id comes back to the door; an empty name is Not now; a foreign sender and an unknown id are refused;
 *        nothing the person typed reaches the log
 *   ps5  the page shows one question at a time: its title, the proxy's host and port as data, the line for a refused answer only
 *        when asked again, two empty fields, the keyboard in the user name unless the person is typing elsewhere; a question
 *        already held is not shown twice, and one open before the page loaded is asked for and shown
 *   ps6  the page answers what was typed on Sign in or Enter, an empty name with no password on Not now, on Escape and on a Sign in
 *        with no name; both fields are emptied as it closes; nothing is written to storage or the console
 *   ps7  the proxy module absent, with app.isPackaged stood in as true: the door does not start, and says why once in one plain
 *        line; with the module present the door starts as it does today; a development copy (isPackaged false) says the module
 *        is missing and still starts the door
 *
 * PLANTS. Each guard's line is replaced once in a scratch copy (tests/plant-copy.mjs) and its leg must go red; ETIUDA_PLANTS=off
 * skips the phase. */
import "./reg-stand-on.mjs";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { EventEmitter } from "node:events";
import { Readable } from "node:stream";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { copyPlants } from "./plant-copy.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SELF = fileURLToPath(import.meta.url);
const require = createRequire(import.meta.url);
const Module = require("node:module");
const ONLY = process.env.PROXY_STUDIO_ONLY || "";
const WIRE = path.join(ROOT, "src", "wire.cjs");
const USER = "invented-user", PASS = "invented-pass-" + process.pid;

let asserted = 0, failed = 0;
function check(ok, line) {
  asserted++;
  if (ok) console.log("  ok   " + line);
  else { failed++; console.log("  FAIL " + line); }
}
function skip(line) { console.log("  skip " + line); }
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---- src/wire.cjs under a stand-in electron ------------------------------------------------------------------------------- */

/* Electron's ClientRequest as the proxy module drives it: on end, a `challenge` (an authInfo) is put to the login listener, and the
   answer decides the status; with no challenge the call is answered 200. */
function standInNet(challenge, made) {
  return {
    request(opts) {
      const r = new EventEmitter();
      const row = { url: opts.url, method: opts.method, redirect: opts.redirect, credentials: opts.credentials, login: 0, answered: null, headers: {} };
      made.push(row);
      r.setHeader = (k, v) => { row.headers[String(k).toLowerCase()] = v; };
      r.write = () => {};
      r.abort = () => {};
      const respond = (status) => {
        const body = Readable.from([Buffer.from("{}")]);
        Object.assign(body, { statusCode: status, statusMessage: status === 200 ? "OK" : "Proxy Authentication Required", headers: { "content-type": "application/json" } });
        r.emit("response", body);
      };
      r.end = () => setImmediate(() => {
        row.login = r.listenerCount("login");
        const auth = typeof challenge === "function" ? challenge(row) : challenge;
        if (!auth) return respond(200);
        if (!row.login) return respond(407);
        r.emit("login", auth, (u, p) => { row.answered = u === undefined ? null : { u, p }; respond(u === USER && p === PASS ? 200 : 407); });
      });
      return r;
    },
  };
}

/* A fresh src/wire.cjs whose require("electron") answers `electron`, the runtime's socket stood in by a recorder. */
function loadWire(electron) {
  const load = Module._load;
  const sockets = [];
  const RealWS = globalThis.WebSocket;
  globalThis.WebSocket = function (url) { sockets.push(String(url)); this.readyState = 0; this.send = () => {}; this.close = () => {}; };
  Module._load = function (request) { return request === "electron" ? electron : load.apply(this, arguments); };
  let wire = null;
  try { delete require.cache[require.resolve(WIRE)]; wire = require(WIRE); }
  finally { Module._load = load; }
  return { wire, sockets, done: () => { globalThis.WebSocket = RealWS; delete require.cache[require.resolve(WIRE)]; } };
}

const PROXY_AUTH = { isProxy: true, scheme: "basic", host: "proxy.example.test", port: 8080, realm: "office" };
const CALLS = (wire) => [
  ["relay", () => wire.relayRequest("POST", "https://etiuda.dev/relay/v1/teams", { "content-type": "application/json" }, Buffer.from("{}")), "https://etiuda.dev/relay/v1/teams"],
  ["licence", () => wire.licenceRequest("check", Buffer.from("{}")), "https://etiuda.dev/licence/v1/check"],
  ["note", () => wire.licenceNote(), "https://etiuda.dev/licence/v1/note/studio"],
  ["ai", () => wire.customerAiRequest("https://ai.example.test/v1/", "messages", { "content-type": "application/json" }, Buffer.from("{}")), "https://ai.example.test/v1/messages"],
  ["sign-in", () => wire.identityRequest("https://login.microsoftonline.com/common/oauth2/v2.0/token", Buffer.from("a=b")), "https://login.microsoftonline.com/common/oauth2/v2.0/token"],
];

const LEGS = {};

LEGS.ps1 = async () => {
  const made = [], asked = [], said = [];
  const w = loadWire({ net: standInNet(PROXY_AUTH, made) });
  try {
    w.wire.proxyAsking((info) => { asked.push(info); return Promise.resolve({ username: USER, password: PASS }); }, (line) => said.push(line));
    const got = [];
    for (const [name, call] of CALLS(w.wire)) {
      try { const r = await call(); got.push(name + " " + r.status); } catch (e) { got.push(name + " threw " + e.message); }
    }
    const urls = made.map((m) => m.url);
    const want = CALLS(w.wire).map((c) => c[2]);
    check(JSON.stringify(urls) === JSON.stringify(want) && made.every((m) => m.login === 1 && m.redirect === "error")
      && made.every((m) => m.answered && m.answered.u === USER && m.answered.p === PASS) && got.every((g) => / 200$/.test(g))
      && asked.length === 1 && asked[0].host === "proxy.example.test" && asked[0].port === 8080,
      "ps1 every call is Chromium's request with one sign-in listener, no redirect followed, the proxy asked once and every call answered: "
      + got.join(", ") + "; asked " + asked.length + "; listeners " + made.map((m) => m.login).join(","));
    check(said.every((l) => l.indexOf(PASS) < 0 && l.indexOf(USER) < 0) && said.some((l) => l.indexOf("proxy.example.test:8080") >= 0),
      "ps1b the door's lines name the proxy's host and port and nothing typed: " + JSON.stringify(said));
  } finally { w.done(); }
  const made2 = [], asked2 = [];
  const w2 = loadWire({ net: standInNet(Object.assign({}, PROXY_AUTH, { isProxy: false }), made2) });
  try {
    w2.wire.proxyAsking((info) => { asked2.push(info); return Promise.resolve({ username: USER, password: PASS }); }, () => {});
    let status = 0;
    try { status = (await w2.wire.relayRequest("POST", "https://etiuda.dev/relay/v1/teams", {}, Buffer.from("{}"))).status; } catch { status = -1; }
    check(asked2.length === 0 && made2.length === 1 && made2[0].answered === null && status === 407,
      "ps1c a challenge from a server that is not a proxy is never asked of the person or answered: asked " + asked2.length + ", status " + status);
  } finally { w2.done(); }
  /* The door's one fetch, taken from src/wire.cjs by brace depth, over the pinned proxy module and a stand-in request: a call's own
     credentials option, "omit" above all, must reach Chromium's request, or a cookie rule set on the call is lost on the way. */
  const src = fs.readFileSync(WIRE, "utf8"), from = src.indexOf("\nfunction wireFetch(");
  let end = src.indexOf("{", from), depth = 0;
  for (; from >= 0 && end < src.length; end++) { if (src[end] === "{") depth++; else if (src[end] === "}" && --depth === 0) break; }
  const made3 = [];
  let cred = "not reached";
  try {
    const run = new Function("asker", "loadedNet", "proxyNet", src.slice(from + 1, end + 1) + "\nreturn wireFetch;");
    const wireFetch = run({ forRequest: () => (a, cb) => cb() }, standInNet(null, made3), require(path.join(ROOT, "engine", "pinned", "shell", "proxy-net.cjs")));
    await (await wireFetch("https://etiuda.dev/relay/v1/teams", { method: "GET", credentials: "omit" })).text();
    cred = made3.length ? String(made3[0].credentials) : "no request";
  } catch (e) { cred = "threw " + e.message; }
  check(cred === "omit", "ps1d a call made with credentials omit reaches Chromium's request with omit: " + cred);
};

LEGS.ps2 = async () => {
  const seen = [];
  const electron = { net: { fetch: async (url) => { seen.push(String(url)); return { status: 200, headers: { get: () => null }, body: new ReadableStream({ start(c) { c.close(); } }) }; } } };
  const w = loadWire(electron);
  try {
    w.wire.proxyAsking(() => null, () => {});
    let status = 0;
    try { status = (await w.wire.relayRequest("POST", "https://etiuda.dev/relay/v1/teams", {}, Buffer.from("{}"))).status; } catch (e) { status = e.message; }
    check(status === 200 && seen.length === 1 && seen[0] === "https://etiuda.dev/relay/v1/teams",
      "ps2 a runtime with Electron's fetch alone is reached through it: " + status + " " + JSON.stringify(seen));
  } finally { w.done(); }
};

/* A proxy on 127.0.0.1 that reads one CONNECT head and answers `status`. */
function standInProxy(status) {
  return new Promise((resolve) => {
    const heads = [];
    const server = net.createServer((sock) => {
      let buf = "";
      sock.on("data", (d) => {
        buf += d.toString("latin1");
        if (buf.indexOf("\r\n\r\n") < 0) return;
        heads.push(buf.split("\r\n\r\n")[0]);
        sock.end(status === 407 ? "HTTP/1.1 407 Proxy Authentication Required\r\nProxy-Authenticate: Basic realm=\"office\"\r\n\r\n" : "HTTP/1.1 403 Forbidden\r\n\r\n");
      });
      sock.on("error", () => {});
    });
    server.listen(0, "127.0.0.1", () => resolve({ port: server.address().port, heads, close: () => server.close() }));
  });
}
function socketOutcome(wire, url) {
  return new Promise((resolve) => {
    const seen = [];
    const t = setTimeout(() => resolve({ handle, seen: seen.concat("timeout") }), 10000);
    const handle = wire.relayConnect(url, { authorization: "Bearer invented" }, {
      open: () => seen.push("open"), message: () => seen.push("message"),
      close: () => { seen.push("close"); clearTimeout(t); resolve({ handle, seen }); },
    });
    if (!handle) { clearTimeout(t); resolve({ handle, seen }); }
  });
}

LEGS.ps3 = async () => {
  const SOCK = "wss://etiuda.dev/relay/v1/t/x/socket";
  const resolved = [];
  let answer = "DIRECT";
  const session = { defaultSession: { resolveProxy: async (u) => { resolved.push(String(u)); return answer; } } };
  const made = [], said = [];
  const proxy = await standInProxy(407);
  const w = loadWire({ net: standInNet((row) => (row.url.indexOf("/relay/v1/") > 0 ? { isProxy: true, scheme: "basic", host: "127.0.0.1", port: proxy.port, realm: "office" } : null), made), session });
  try {
    w.wire.proxyAsking(() => Promise.resolve({ username: USER, password: PASS }), (line) => said.push(line));
    const away = w.wire.relayConnect("wss://example.com/relay/v1/t/x/socket", {}, { message() {}, close() {} });
    check(away === null && resolved.length === 0 && w.sockets.length === 0,
      "ps3 an address the door does not admit is refused before any proxy is asked: " + (away === null ? "null" : "a socket") + ", resolver asked " + resolved.length);
    const direct = w.wire.relayConnect(SOCK, {}, { message() {}, close() {} });
    for (let i = 0; i < 100 && !w.sockets.length; i++) await wait(10);
    check(!!direct && direct.opens === true && resolved.length === 1 && resolved[0] === "https://etiuda.dev/relay/v1/t/x/socket" && w.sockets[0] === SOCK,
      "ps3b where Chromium names no proxy the runtime's own socket opens at the relay's address and says it tells its opening: "
      + JSON.stringify({ opens: direct && direct.opens, resolved, sockets: w.sockets }));
    answer = "PROXY 127.0.0.1:" + proxy.port + "; DIRECT";
    const plain = await socketOutcome(w.wire, SOCK);
    await w.wire.relayRequest("POST", "https://etiuda.dev/relay/v1/teams", {}, Buffer.from("{}"));
    const signed = await socketOutcome(w.wire, SOCK);
    const basic = "Proxy-Authorization: Basic " + Buffer.from(USER + ":" + PASS).toString("base64");
    const [h1, h2] = proxy.heads;
    check(!!plain.handle && plain.handle.opens === true && plain.seen.join() === "close" && w.sockets.length === 1
      && /^CONNECT etiuda\.dev:443 HTTP\/1\.1\r\nHost: etiuda\.dev:443/.test(h1 || "") && (h1 || "").indexOf("Proxy-Authorization") < 0
      && signed.seen.join() === "close" && /^CONNECT etiuda\.dev:443 HTTP\/1\.1/.test(h2 || "") && (h2 || "").indexOf(basic) >= 0,
      "ps3c where Chromium names a proxy the socket is a CONNECT to it for the relay's own host and port, the person's answer riding it"
      + " once given, a refusal closing it unopened and no runtime socket opened: " + JSON.stringify({ plain: plain.seen, signed: signed.seen, heads: proxy.heads.map((x) => x.split("\r\n")[0]) }));
    const told = said.filter((l) => /every minute/.test(l));
    check(told.length >= 1 && new Set(told).size === told.length && said.every((l) => l.indexOf(PASS) < 0 && l.indexOf(USER) < 0),
      "ps3d the fallback to the minute's asking is said in the log once per kind, naming host and port alone: " + JSON.stringify(told));
  } finally { w.done(); proxy.close(); }
  const bare = loadWire({ net: standInNet(null, []) });
  try {
    const h = bare.wire.relayConnect(SOCK, {}, { message() {}, close() {} });
    check(!!h && h.opens === true && bare.sockets[0] === SOCK,
      "ps3e with no session to ask (the worker thread, a leg's stand-in) the runtime's own socket opens and still says it tells its opening, so two unopened closes start the minute's asking, not a retry every two seconds");
  } finally { bare.done(); }
};

/* ---- shell/main.js under a stand-in electron (as tests/ipc-coerce.mjs loads it) --------------------------------------------- */

LEGS.ps4 = async () => {
  const UI = path.join(ROOT, "ui", "index.html");
  const MAIN = path.join(ROOT, "shell", "main.js");
  const ud = fs.mkdtempSync(path.join(os.tmpdir(), "proxy-studio-ud-"));
  const projects = path.join(ud, "projects");
  fs.mkdirSync(projects, { recursive: true });
  const handlers = {}, listeners = {}, sent = [], windows = [];
  class Win {
    constructor() {
      this.webContents = { id: 1, on() {}, once() {}, send: (ch, v) => sent.push([ch, v]), setWindowOpenHandler() {}, getURL: () => pathToFileURL(UI).href,
        reload() {}, forcefullyCrashRenderer() {}, getZoomLevel: () => 0, setZoomLevel() {} };
      windows.push(this);
    }
    on() {} once() {} isDestroyed() { return false; } isMaximized() { return false; }
    close() {} loadFile() {} show() {} showInactive() {} setMinimumSize() {} minimize() {} maximize() {} unmaximize() {}
  }
  const display = { bounds: { x: 0, y: 0, width: 1920, height: 1080 }, workAreaSize: { width: 1920, height: 1032 } };
  const electron = {
    app: { commandLine: { appendSwitch() {}, hasSwitch: () => false, removeSwitch() {} }, getPath: () => ud, getVersion: () => "0.0.0",
      getLocale: () => "en-GB", requestSingleInstanceLock: () => true, whenReady: () => Promise.resolve(), on() {}, quit() {}, exit() {} },
    BrowserWindow: Object.assign(Win, { fromWebContents: () => windows[0] || new Win(), getAllWindows: () => windows }),
    Menu: { setApplicationMenu() {}, buildFromTemplate: () => ({ popup() {} }) },
    dialog: { showMessageBox: () => Promise.resolve({ response: 0 }), showOpenDialog: () => Promise.resolve({ canceled: true, filePaths: [] }), showSaveDialog: () => Promise.resolve({ canceled: true, filePath: "" }) },
    nativeTheme: { themeSource: "system", shouldUseDarkColors: false },
    clipboard: { writeText() {} },
    safeStorage: { isEncryptionAvailable: () => false, encryptString: (s) => Buffer.from(String(s)), decryptString: () => "" },
    screen: { getAllDisplays: () => [display], getPrimaryDisplay: () => display, on() {}, removeListener() {} },
    session: { defaultSession: { setPermissionRequestHandler() {}, setPermissionCheckHandler() {}, setDevicePermissionHandler() {}, setSpellCheckerLanguages() {},
      setSpellCheckerDictionaryDownloadURL() {}, setSpellCheckerEnabled() {} } },
    shell: { openPath: () => Promise.resolve(""), openExternal() {}, trashItem: () => Promise.resolve() },
    ipcMain: { handle: (ch, fn) => { handlers[ch] = fn; }, on: (ch, fn) => { listeners[ch] = fn; } },
  };
  const thread = { call: (verb) => Promise.resolve({ verb }) };
  const cp = { execFileSync: () => "", execSync: () => "", spawnSync: () => ({ status: 0, stdout: "", stderr: "" }),
    execFile: () => ({ on() {}, unref() {} }), spawn: () => ({ on() {}, unref() {}, stdout: { on() {} }, stderr: { on() {} } }), exec: () => ({ on() {}, unref() {} }), fork: () => ({ on() {}, unref() {} }) };
  let hands = null;
  const envWas = {};
  for (const k of ["STUDIO_NO_PROXY_SERVER", "STUDIO_PROJECTS"]) envWas[k] = process.env[k];
  process.env.STUDIO_NO_PROXY_SERVER = "off"; process.env.STUDIO_PROJECTS = projects;
  const load = Module._load;
  Module._load = function (req) {
    if (req === "electron") return electron;
    if (req === "node:child_process" || req === "child_process") return cp;
    if (/studio-thread\.cjs$/.test(String(req))) return thread;
    if (/[\\/]src[\\/]wire\.cjs$/.test(String(req))) {
      const real = load.apply(this, arguments);
      return Object.assign({}, real, { proxyAsking: (ask, say) => { hands = { ask, say }; } });
    }
    return load.apply(this, arguments);
  };
  const said = [];
  const stderrWrite = process.stderr.write.bind(process.stderr);
  process.stderr.write = (chunk, enc, cb) => { said.push(String(chunk)); return stderrWrite(chunk, enc, cb); };
  const own = () => ({ senderFrame: { parent: null, url: pathToFileURL(UI).href }, sender: {} });
  const foreign = () => ({ senderFrame: { parent: null, url: "https://example.com/" }, sender: {} });
  try {
    delete require.cache[MAIN];
    require(MAIN);
    for (let i = 0; i < 400 && !windows.length; i++) await wait(25);
    const ok = !!hands && typeof hands.ask === "function" && typeof handlers["studio:proxy-asks"] === "function" && typeof handlers["studio:proxy-answer"] === "function";
    check(ok && windows.length > 0, "ps4 the shell hands the door its two hands and opens studio:proxy-asks and studio:proxy-answer: " + JSON.stringify({ hands: !!hands, asks: !!handlers["studio:proxy-asks"], answer: !!handlers["studio:proxy-answer"], windows: windows.length }));
    if (!ok) return;
    const pending = Promise.resolve(hands.ask({ host: "proxy.example.test", port: 8080, scheme: "basic", realm: "office", again: false }));
    let settled = "pending";
    pending.then((v) => { settled = v; });
    await wait(10);
    const pushed = sent.filter((s) => s[0] === "studio:proxy-ask").map((s) => s[1]);
    const listed = await handlers["studio:proxy-asks"](own());
    const q = pushed[0] || {};
    check(pushed.length === 1 && q.host === "proxy.example.test" && q.port === 8080 && q.again === false && Number.isInteger(q.id)
      && Array.isArray(listed) && listed.length === 1 && listed[0].id === q.id && Object.keys(listed[0]).sort().join() === "again,host,id,port",
      "ps4b the door's question reaches the page on studio:proxy-ask and in the list it asks for as it loads, {id, host, port, again} alone: "
      + JSON.stringify({ pushed, listed }));
    const fromForeign = await handlers["studio:proxy-answer"](foreign(), q.id, USER, PASS);
    const unknown = await handlers["studio:proxy-answer"](own(), q.id + 99, USER, PASS);
    const still = await handlers["studio:proxy-answer"](foreign(), q.id, "", "");
    await wait(10);
    check(fromForeign === null && unknown === false && still === null && settled === "pending",
      "ps4c a foreign sender is answered null and an unknown id false, the question left open: " + JSON.stringify({ fromForeign, unknown, settled }));
    const took = await handlers["studio:proxy-answer"](own(), q.id, USER, PASS);
    await wait(10);
    const after = await handlers["studio:proxy-asks"](own());
    check(took === true && settled && settled.username === USER && settled.password === PASS && after.length === 0,
      "ps4d the page's answer by id goes back to the door and closes the question: " + JSON.stringify({ took, open: after.length }));
    const second = Promise.resolve(hands.ask({ host: "proxy.example.test", port: 8080, scheme: "basic", realm: "office", again: true }));
    await wait(10);
    const q2 = (await handlers["studio:proxy-asks"](own()))[0] || {};
    await handlers["studio:proxy-answer"](own(), q2.id, "", "typed-but-not-sent");
    const notNow = await Promise.race([second, wait(200).then(() => "pending")]);
    check(q2.again === true && notNow === null, "ps4e an empty user name is Not now, answered null to the door: " + JSON.stringify({ again: q2.again, got: notNow }));
    hands.say("the proxy at proxy.example.test:8080 asked for a sign-in (basic)");
    const log = said.join("");
    check(log.indexOf("studio  the proxy at proxy.example.test:8080 asked for a sign-in (basic)") >= 0 && log.indexOf(PASS) < 0 && log.indexOf("typed-but-not-sent") < 0,
      "ps4f the door's line reaches Studio's log, and nothing the person typed does");
  } finally {
    process.stderr.write = stderrWrite;
    Module._load = load;
    for (const k of Object.keys(envWas)) { if (envWas[k] === undefined) delete process.env[k]; else process.env[k] = envWas[k]; }
  }
};

/* ---- ui/proxy-ask.js on a stand-in document --------------------------------------------------------------------------------- */

function standInDoc() {
  const doc = { activeElement: null };
  function el(tag) {
    const e = {
      tagName: String(tag).toUpperCase(), id: "", attrs: {}, children: [], parent: null, on: {}, value: "", textContent: "",
      setAttribute(k, v) { this.attrs[k] = String(v); if (k === "id") this.id = String(v); },
      getAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; },
      appendChild(c) { c.parent = this; this.children.push(c); return c; },
      remove() { if (this.parent) { this.parent.children = this.parent.children.filter((x) => x !== this); this.parent = null; } },
      addEventListener(t, f) { (this.on[t] = this.on[t] || []).push(f); },
      focus() { doc.activeElement = this; },
      fire(t, ev) { for (const f of this.on[t] || []) f(ev); },
    };
    return e;
  }
  doc.createElement = el;
  doc.body = el("body");
  doc.find = (id, from) => {
    for (const c of (from || doc.body).children) { if (c.id === id) return c; const d = doc.find(id, c); if (d) return d; }
    return null;
  };
  doc.text = (node) => [node.textContent || ""].concat(node.children.map(doc.text)).join("|");
  return doc;
}
function key(k, target) { return { key: k, target, preventDefault() {}, stopPropagation() {} }; }
const WORDS = { title: "The network proxy asks for a sign-in", again: "The proxy asked again, so the user name or password may need another look.",
  user: "User name", pass: "Password", no: "Not now", yes: "Sign in" };

async function pageWith(open) {
  delete require.cache[require.resolve(path.join(ROOT, "ui", "proxy-ask.js"))];
  const M = require(path.join(ROOT, "ui", "proxy-ask.js"));
  const doc = standInDoc(), answers = [];
  let push = null;
  const host = { onProxyAsk: (fn) => { push = fn; }, proxyAsks: () => Promise.resolve(open || []), proxyAnswer: (id, u, p) => { answers.push([id, u, p]); return Promise.resolve(true); } };
  const page = M.wire({ doc, host, words: () => WORDS });
  await wait(5);
  return { doc, answers, push: (q) => push(q), page };
}

LEGS.ps5 = async () => {
  const p = await pageWith([{ id: 3, host: "proxy.example.test", port: 8080, again: false }]);
  const box = p.doc.find("sProxyAsk");
  const user = p.doc.find("sProxyUser"), pass = p.doc.find("sProxyPass");
  check(!!box && box.getAttribute("role") === "dialog" && p.doc.find("sProxyTitle").textContent === WORDS.title
    && p.doc.text(box).indexOf("proxy.example.test:8080") >= 0 && p.doc.text(box).indexOf(WORDS.again) < 0
    && user && user.getAttribute("type") === "text" && pass && pass.getAttribute("type") === "password" && pass.getAttribute("autocomplete") === "off"
    && user.value === "" && pass.value === "" && p.doc.activeElement === user && p.doc.find("sProxyNo").textContent === WORDS.no && p.doc.find("sProxyYes").textContent === WORDS.yes,
    "ps5 a question open before the page loaded is asked for and shown: the title, the proxy's host and port, two empty fields, the keyboard in the user name");
  p.push({ id: 3, host: "proxy.example.test", port: 8080, again: false });
  p.push({ id: 4, host: "proxy.example.test", port: 8080, again: true });
  check(p.doc.body.children.filter((c) => c.id === "sProxyAsk").length === 1 && p.page.shown() === 3,
    "ps5b one question at a time, and an id already held is not shown twice");
  p.doc.find("sProxyNo").fire("click");
  const again = p.doc.find("sProxyAsk");
  check(!!again && p.doc.text(again).indexOf(WORDS.again) >= 0 && p.page.shown() === 4, "ps5c the next question opens, with the refused answer's line where it was asked again");
  const q = await pageWith([]);
  const elsewhere = q.doc.createElement("textarea");
  q.doc.body.appendChild(elsewhere);
  elsewhere.focus();
  q.push({ id: 1, host: "proxy.example.test", port: 8080, again: false });
  check(!!q.doc.find("sProxyAsk") && q.doc.activeElement === elsewhere, "ps5d a person typing elsewhere keeps the keyboard where it is as a question arrives");
};

LEGS.ps6 = async () => {
  const stores = [];
  const trap = (name) => ({ setItem: (k, v) => stores.push([name, k, v]), getItem: () => null, removeItem() {} });
  const was = { localStorage: globalThis.localStorage, sessionStorage: globalThis.sessionStorage };
  const logWas = { log: console.log, info: console.info, warn: console.warn, error: console.error, debug: console.debug };
  const logged = [];
  Object.defineProperty(globalThis, "localStorage", { value: trap("local"), configurable: true, writable: true });
  Object.defineProperty(globalThis, "sessionStorage", { value: trap("session"), configurable: true, writable: true });
  try {
    for (const k of ["info", "warn", "error", "debug"]) console[k] = (...a) => logged.push(a.join(" "));
    const p = await pageWith([]);
    const open = (id) => { p.push({ id, host: "proxy.example.test", port: 8080, again: false }); return { user: p.doc.find("sProxyUser"), pass: p.doc.find("sProxyPass") }; };
    let f = open(1);
    f.user.value = " " + USER + " "; f.pass.value = PASS;
    p.doc.find("sProxyYes").fire("click");
    const emptied = f.user.value === "" && f.pass.value === "" && !p.doc.find("sProxyAsk");
    f = open(2);
    f.user.value = USER; f.pass.value = PASS;
    p.doc.find("sProxyAsk").fire("keydown", key("Enter", f.pass));
    f = open(3);
    f.user.value = USER; f.pass.value = PASS;
    p.doc.find("sProxyNo").fire("click");
    const emptiedNo = f.user.value === "" && f.pass.value === "";
    f = open(4);
    f.user.value = USER; f.pass.value = PASS;
    p.doc.find("sProxyAsk").fire("keydown", key("Escape", f.user));
    f = open(5);
    f.user.value = "   "; f.pass.value = PASS;
    p.doc.find("sProxyYes").fire("click");
    const want = [[1, USER, PASS], [2, USER, PASS], [3, "", ""], [4, "", ""], [5, "", ""]];
    check(JSON.stringify(p.answers) === JSON.stringify(want),
      "ps6 the page answers what was typed on Sign in and on Enter, and an empty name with no password on Not now, on Escape and on a Sign in with no name: "
      + JSON.stringify(p.answers.map((a) => [a[0], a[1] ? "name" : "", a[2] ? "password" : ""])));
    check(emptied && emptiedNo, "ps6b both fields are emptied as the question closes, on Sign in and on Not now");
    const src = fs.readFileSync(path.join(ROOT, "ui", "proxy-ask.js"), "utf8");
    check(stores.length === 0 && logged.length === 0 && !/localStorage|sessionStorage|indexedDB|console\.|document\.cookie/.test(src),
      "ps6c nothing is written to storage or the console, and ui/proxy-ask.js names neither: " + stores.length + " write(s), " + logged.length + " line(s)");
  } finally {
    Object.assign(console, logWas);
    Object.defineProperty(globalThis, "localStorage", { value: was.localStorage, configurable: true, writable: true });
    Object.defineProperty(globalThis, "sessionStorage", { value: was.sessionStorage, configurable: true, writable: true });
  }
  const app = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8"), index = fs.readFileSync(path.join(ROOT, "ui", "index.html"), "utf8");
  const at = (s) => index.indexOf('<script src="' + s + '"></script>');
  check(/window\.StudioProxyAsk\.wire\(\{ doc: document, host: proxyAskHost, words: proxyAskWords(, hang: proxyAskHang)? \}\)/.test(app) && at("proxy-ask.js") > 0 && at("proxy-ask.js") < at("app.js"),
    "ps6d Studio's page loads ui/proxy-ask.js before ui/app.js and wires it to the bridge with its words");
};

/* A copy of src/wire.cjs in a folder of its own. The proxy module is absent unless `present` copies it beside that copy.
   Electron is stood in: app.isPackaged as `packaged`, net.request as the proxy module drives it, net.fetch as the fallback. */
async function doorScene({ packaged, present }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "proxy-door-"));
  const srcDir = path.join(dir, "src");
  fs.mkdirSync(srcDir);
  fs.copyFileSync(WIRE, path.join(srcDir, "wire.cjs"));
  if (present) {
    const shellDir = path.join(dir, "engine", "pinned", "shell");
    fs.mkdirSync(shellDir, { recursive: true });
    fs.copyFileSync(path.join(ROOT, "engine", "pinned", "shell", "proxy-net.cjs"), path.join(shellDir, "proxy-net.cjs"));
  }
  const made = [], lines = [], sockets = [];
  const wasErr = console.error, wasWS = globalThis.WebSocket, load = Module._load;
  console.error = (...a) => { lines.push(a.map((x) => String(x)).join(" ")); };
  globalThis.WebSocket = function (url) { sockets.push(String(url)); this.readyState = 0; this.send = () => {}; this.close = () => {}; };
  const netStand = standInNet(null, made);
  netStand.fetch = async (url) => {
    made.push({ url: String(url), via: "fetch", login: 0 });
    return { status: 200, headers: { get: () => null }, body: new ReadableStream({ start(c) { c.close(); } }) };
  };
  const electron = { app: { isPackaged: packaged === true }, net: netStand };
  Module._load = function (request) { return request === "electron" ? electron : load.apply(this, arguments); };
  const at = path.join(srcDir, "wire.cjs");
  let wire = null, loadErr = "";
  try { wire = require(at); }
  catch (e) { loadErr = String(e && e.message || e); }
  return { wire, lines, made, sockets, loadErr, done() {
    console.error = wasErr;
    globalThis.WebSocket = wasWS;
    Module._load = load;
    try { delete require.cache[require.resolve(at)]; } catch { /* not loaded */ }
    fs.rmSync(dir, { recursive: true, force: true });
  } };
}

LEGS.ps7 = async () => {
  const SOCK = "wss://etiuda.dev/relay/v1/t/x/socket";
  const SAID = "studio: this copy has no company proxy module, so a proxy's sign-in cannot be asked";
  const SHUT = SAID + ", and its network door stays shut";
  const plain = (lines) => lines.length === 1 && lines[0].indexOf("\n") < 0 && lines[0].indexOf("Cannot find") < 0 && !/[A-Za-z]:[\\/]/.test(lines[0]);
  const shut = await doorScene({ packaged: true, present: false });
  try {
    let relay = "sent", licence = "sent";
    try { await shut.wire.relayRequest("POST", "https://etiuda.dev/relay/v1/teams", {}, Buffer.from("{}")); }
    catch (e) { relay = String(e && e.message || e); }
    try { await shut.wire.licenceRequest("check", Buffer.from("{}")); }
    catch (e) { licence = String(e && e.message || e); }
    const sock = shut.wire ? shut.wire.relayConnect(SOCK, {}, { message() {}, close() {} }) : "noload";
    check(!shut.loadErr && shut.made.length === 0 && sock === null && shut.sockets.length === 0
      && relay.indexOf("company proxy module") >= 0 && licence.indexOf("company proxy module") >= 0,
      "ps7 a packaged copy with no proxy module does not open its network door: relay " + relay + "; licence " + licence
      + "; calls " + shut.made.length + "; socket " + (sock === null ? "null" : "open") + (shut.loadErr ? "; load " + shut.loadErr : ""));
    check(plain(shut.lines) && shut.lines[0] === SHUT,
      "ps7b that copy says why once, in one plain line: " + JSON.stringify(shut.lines));
  } finally { shut.done(); }
  const open = await doorScene({ packaged: true, present: true });
  try {
    let status = 0;
    try { status = (await open.wire.relayRequest("POST", "https://etiuda.dev/relay/v1/teams", {}, Buffer.from("{}"))).status; }
    catch (e) { status = String(e && e.message || e); }
    const sock = open.wire ? open.wire.relayConnect(SOCK, {}, { message() {}, close() {} }) : null;
    check(!open.loadErr && status === 200 && open.made.length === 1 && open.made[0].login === 1 && !open.made[0].via
      && sock && open.sockets[0] === SOCK && open.lines.length === 0,
      "ps7c with the module present, a packaged copy starts the door as it does today: status " + status
      + "; calls " + JSON.stringify(open.made.map((m) => ({ login: m.login, via: m.via || "request", url: m.url })))
      + "; socket " + JSON.stringify(open.sockets) + "; said " + open.lines.length + (open.loadErr ? "; load " + open.loadErr : ""));
  } finally { open.done(); }
  const dev = await doorScene({ packaged: false, present: false });
  try {
    let status = 0;
    try { status = (await dev.wire.relayRequest("POST", "https://etiuda.dev/relay/v1/teams", {}, Buffer.from("{}"))).status; }
    catch (e) { status = String(e && e.message || e); }
    try { await dev.wire.licenceRequest("check", Buffer.from("{}")); } catch { /* a second call must not add a line */ }
    const sock = dev.wire ? dev.wire.relayConnect(SOCK, {}, { message() {}, close() {} }) : null;
    check(!dev.loadErr && status === 200 && dev.made.some((m) => m.via === "fetch") && sock && dev.sockets[0] === SOCK
      && plain(dev.lines) && dev.lines[0] === SAID,
      "ps7d a development copy with no proxy module says so once and still starts the door: status " + status
      + "; said " + JSON.stringify(dev.lines) + "; calls " + dev.made.length + "; socket " + JSON.stringify(dev.sockets)
      + (dev.loadErr ? "; load " + dev.loadErr : ""));
  } finally { dev.done(); }
};

for (const name of Object.keys(LEGS)) {
  if (ONLY && name !== ONLY) continue;
  try { await LEGS[name](); }
  catch (e) { failed++; asserted++; console.log("  FAIL " + name + " threw: " + String(e && e.stack || e).split("\n").slice(0, 4).join(" | ")); }
}

const PLANTS = [
  { mark: "wire-credentials", leg: "ps1", rel: "src/wire.cjs", line: '  if (asker && typeof loadedNet.request === "function") return proxyNet.fetchThrough(loadedNet, url, Object.assign({}, init, { credentials: undefined }), asker.forRequest());' },
  { mark: "wire-login", leg: "ps1", rel: "src/wire.cjs", line: '  if (asker && typeof loadedNet.request === "function") return proxyNet.fetchThrough(loadedNet, url, init, null);' },
  { mark: "wire-socket-admit", leg: "ps3", rel: "src/wire.cjs", line: '  if (typeof WebSocket !== "function") return null;' },
  { mark: "wire-socket-proxy", leg: "ps3", rel: "src/wire.cjs", line: "  /* the proxy is not asked */" },
  { mark: "wire-opens", leg: "ps3", rel: "src/wire.cjs", line: "  return { send: (text) => { if (ws.readyState === 1) ws.send(text); }, close: () => { try { ws.close(); } catch { /* gone */ } } };" },
  { mark: "proxy-ask-shell", leg: "ps4", rel: "shell/main.js", line: "wire.proxyAsking(() => null," },
  { mark: "proxy-answer-shell", leg: "ps4", rel: "shell/main.js", line: "  a.resolve(null);" },
  { mark: "sp-ask-keyboard", leg: "ps5", rel: "ui/proxy-ask.js", line: "      try { user.focus(); } catch { /* not focusable yet */ }" },
  { mark: "sp-ask-empty", leg: "ps6", rel: "ui/proxy-ask.js", line: "        /* the fields are left as typed */" },
  { mark: "sp-ask-name-first", leg: "ps6", rel: "ui/proxy-ask.js", line: "      const signIn = () => answer(String(user.value || \"\"), String(pass.value || \"\"));" },
  { mark: "sp-ask-escape", leg: "ps6", rel: "ui/proxy-ask.js", line: "        if (e.key === \"Escape\") return;" },
  { mark: "wire-proxy-door", leg: "ps7", rel: "src/wire.cjs", line: "  return false;" },
];
if (!ONLY) copyPlants({ root: ROOT, self: SELF, label: "proxy-studio", onlyVar: "PROXY_STUDIO_ONLY", plants: PLANTS, check, skip, timeout: 120000 });

console.log("proxy-studio: " + (asserted - failed) + " of " + asserted + " held");
process.exit(Math.min(failed, 63));
