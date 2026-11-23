"use strict";
/* THE LEAK HUNT'S CAPTURE PRELOAD (tests/leak-hunt.mjs). It is loaded with node --require through NODE_OPTIONS, so it runs
 * before any module of the tree in the publish child, in every worker thread that child starts and in every node
 * grandchild, and it patches what a secret could leave by before anything captures a reference to it.
 *
 * WHAT IT RECORDS, one ndjson line per act, into a file of its own per process and thread under LEAK_CAP:
 *   fs        every call that writes, makes, moves or removes a file, by path (the path arguments only), with the data's
 *             length and whether it carries a needle; opens with a write flag; writes to a descriptor, fd 1 and 2 named
 *   child     every child_process call (spawn, spawnSync, exec, execSync, execFile, execFileSync, fork): file, argv,
 *             the whole options object, and the environment the child gets, its own or the one it inherits; the pid;
 *             and, after the call returns, every write and end on that child's stdin and every fork send
 *   worker    every Worker started, its options and env, every message posted to it, and every message it posts back
 *   ipc       what the electron stand-in hands it (a handler's reply, a webContents.send), through globalThis.__leak
 *   electron  every call the stand-in reports through __leak.electron (the recording Proxy in the leg)
 *   net       connect and write on net and tls, http and https request and the bodies written to them, fetch,
 *             dgram send, and dns lookup and resolve. A socket open is marked socket:true even when it carries nothing
 *   exit      the names of the environment variables that carry a needle when the process ends, and which needles
 *   boot      the home, temp folder, working folder and profile each process and thread saw
 *
 * IT NEVER STORES A BYTE THAT CARRIES A NEEDLE. A value that carries one is recorded as which needles it carries (their
 * indices, never their bytes) and a path or a variable that carries one is written "<carries>". The needles themselves
 * are read from LEAK_CAP/needles.json, where they sit XORed with a mask written beside them, so that no file of the
 * capture, that one included, holds any spelling of the secret, and the hunt can scan the capture whole.
 *
 * Child processes are patched on the module object and then Module.syncBuiltinESMExports(), so a named ESM import
 * (import { spawnSync } from "node:child_process") and an import() see the patched functions too. A native child
 * (reg.exe) is recorded at the call; what it does afterwards is outside node and outside this file.
 */
const CAP = process.env.LEAK_CAP;
/* The stand-in for reg.exe (tests/reg-stand.cjs) goes in before the recorder wraps child_process, so the shell's reg call is
   recorded at the call and answered by the stand-in, never by this computer's registry (decision 49). */
if (CAP) require("./reg-stand.cjs").regStand(require("node:child_process"));
if (CAP) (function () {
  const Module = require("node:module"), fs = require("node:fs"), path = require("node:path"), os = require("node:os");
  const wt = require("node:worker_threads"), cp = require("node:child_process");
  const { fileURLToPath } = require("node:url");
  const R = { openSync: fs.openSync, writeSync: fs.writeSync, readFileSync: fs.readFileSync };
  const tid = wt.threadId, pid = process.pid;
  const logFd = R.openSync(path.join(CAP, "events-" + pid + "-" + tid + ".ndjson"), "a");

  const scMutate = (() => { try { return JSON.parse(process.env.LEAK_SCENARIO || "{}").mutate; } catch { return null; } })();
  if (scMutate === "project-tmp-dir" && tid !== 0) {
    const origOpen = fs.openSync;
    fs.openSync = function (p, ...a) {
      if (typeof p === "string" && p.includes("project.json") && p.endsWith(".tmp")) {
        const err = new Error("EISDIR: illegal operation on a directory, open '" + p + "'");
        err.code = "EISDIR";
        throw err;
      }
      return origOpen.apply(this, [p, ...a]);
    };
  }

  let NEEDLES = [], SEALED = [];
  try {
    const n = JSON.parse(R.readFileSync(path.join(CAP, "needles.json"), "utf8")), mask = Buffer.from(n.mask, "hex");
    const unmask = (h) => { const b = Buffer.from(h, "hex"); for (let i = 0; i < b.length; i++) b[i] ^= mask[i % mask.length]; return b; };
    NEEDLES = (n.needles || []).map(unmask);
    SEALED = (n.sealed || []).map(unmask);
  } catch { /* no needles: every carries() below is 0, and the hunt's own check on the in-band crossing turns red */ }

  /* WHICH NEEDLES A VALUE CARRIES, by byte search. A string is searched as UTF-8 and as latin1, the two ways it reaches a
     file; anything else is walked: buffers and typed arrays as their bytes, objects and arrays by their values and keys,
     an Error by its message and stack. */
  const hitsIn = (buf, into) => { for (let i = 0; i < NEEDLES.length; i++) if (!into.has(i) && buf.indexOf(NEEDLES[i]) >= 0) into.add(i); };
  const walk = (v, into, seen, depth) => {
    if (v == null || depth > 12) return;
    if (typeof v === "string") { hitsIn(Buffer.from(v, "utf8"), into); hitsIn(Buffer.from(v, "latin1"), into); return; }
    if (typeof v === "number" || typeof v === "boolean" || typeof v === "bigint") return;
    if (typeof v === "function") return;
    if (Buffer.isBuffer(v)) { hitsIn(v, into); return; }
    if (ArrayBuffer.isView(v)) { hitsIn(Buffer.from(v.buffer, v.byteOffset, v.byteLength), into); return; }
    if (v instanceof ArrayBuffer || (typeof SharedArrayBuffer === "function" && v instanceof SharedArrayBuffer)) { hitsIn(Buffer.from(v), into); return; }
    if (typeof v !== "object" || seen.has(v)) return;
    seen.add(v);
    if (v instanceof Error) { walk(v.message, into, seen, depth + 1); walk(v.stack, into, seen, depth + 1); }
    if (v instanceof Map) { for (const [k, x] of v) { walk(k, into, seen, depth + 1); walk(x, into, seen, depth + 1); } return; }
    if (v instanceof Set) { for (const x of v) walk(x, into, seen, depth + 1); return; }
    let keys = [];
    try { keys = Object.keys(v); } catch { return; }
    for (const k of keys) { walk(k, into, seen, depth + 1); let x; try { x = v[k]; } catch { continue; } walk(x, into, seen, depth + 1); }
  };
  const hits = (v) => { const s = new Set(); try { walk(v, s, new Set(), 0); } catch { /* a value that cannot be walked carries nothing we can see */ } return Array.from(s).sort((a, b) => a - b); };
  /* The key file's sealed bytes, a second list. Same walk, so a vault blob is found by index and never stored. */
  const sealedHits = (v) => {
    const saved = NEEDLES; NEEDLES = SEALED;
    try { return hits(v); } finally { NEEDLES = saved; }
  };
  const clean = (s) => s == null ? null : (hits(String(s)).length || sealedHits(String(s)).length ? "<carries>" : String(s));
  /* A planted- marker is not a secret. Taken from the leading bytes only, so the log can name the control. */
  const markerOf = (v, depth, seen) => {
    if (v == null || depth > 6) return null;
    if (typeof v === "string") { const m = /planted-[a-z]+(?:-[a-z]+)*/.exec(v.slice(0, 96)); return m ? m[0] : null; }
    if (Buffer.isBuffer(v) || ArrayBuffer.isView(v)) {
      const b = Buffer.isBuffer(v) ? v : Buffer.from(v.buffer, v.byteOffset, Math.min(v.byteLength, 96));
      const m = /^planted-[a-z]+(?:-[a-z]+)*/.exec(b.subarray(0, 96).toString("latin1"));
      return m ? m[0] : null;
    }
    if (typeof v !== "object") return null;
    if (seen.has(v)) return null;
    seen.add(v);
    const list = Array.isArray(v) ? v : (() => { try { return Object.keys(v).map((k) => v[k]); } catch { return []; } })();
    for (const x of list) { const m = markerOf(x, depth + 1, seen); if (m) return m; }
    return null;
  };
  const markOfValue = (v) => { try { return markerOf(v, 0, new Set()); } catch { return null; } };
  const redact = (s) => { let t = Buffer.from(String(s), "utf8"); for (const n of NEEDLES.concat(SEALED)) { let i; while ((i = t.indexOf(n)) >= 0) t = Buffer.concat([t.subarray(0, i), Buffer.from("<needle>"), t.subarray(i + n.length)]); } return t.toString("utf8"); };

  const emit = (o) => { try { R.writeSync(logFd, JSON.stringify(Object.assign({ at: performance.timeOrigin + performance.now(), pid, tid }, o)) + "\n"); } catch { /* the capture never stops the act */ } };
  const dataOf = (d) => {
    if (d == null) return undefined;
    const len = typeof d === "string" ? Buffer.byteLength(d) : (d.byteLength != null ? d.byteLength : undefined);
    return { len, hits: hits(d), sealed: sealedHits(d) };
  };
  const pathOf = (x) => {
    if (typeof x === "string") return x;
    if (Buffer.isBuffer(x)) return x.toString();
    if (x && typeof x === "object" && x.href && x.protocol === "file:") { try { return fileURLToPath(x); } catch { return String(x); } }
    return null;
  };
  const guarded = (o, name, before) => {
    const orig = o[name];
    if (typeof orig !== "function") return;
    const wrapped = function (...a) { try { before.call(this, a, name); } catch { /* see emit */ } return orig.apply(this, a); };
    Object.defineProperty(wrapped, "name", { value: name });
    o[name] = wrapped;
  };

  /* ---- files ---- */
  const fds = new Map([[0, "stdin"], [1, "stdout"], [2, "stderr"]]);
  const isWriteFlag = (f) => typeof f === "number" ? (f & 3) !== 0 || (f & 0x40) !== 0 : /[wa+]/.test(String(f || "r"));
  const BY_PATH = ["writeFileSync", "writeFile", "appendFileSync", "appendFile", "mkdirSync", "mkdir", "rmSync", "rm", "rmdirSync", "rmdir",
    "unlinkSync", "unlink", "truncateSync", "truncate", "utimesSync", "utimes", "chmodSync", "chmod", "chownSync", "chown", "copyFileSync", "copyFile",
    "cpSync", "cp", "renameSync", "rename", "symlinkSync", "symlink", "linkSync", "link", "mkdtempSync", "mkdtemp", "createWriteStream"];
  const onPath = (a, op, via) => {
    const two = /^(copy|rename|symlink|link|cp)/.test(op), paths = [];
    a.forEach((x, i) => { if (i === 0 || (i === 1 && two)) { const p = pathOf(x); if (p != null) paths.push(clean(p)); } });
    const target = typeof a[0] === "number" ? (fds.get(a[0]) || "fd" + a[0]) : null;
    emit({ ev: "fs", via, op, paths, target: clean(target), data: /^(writeFile|appendFile)/.test(op) ? dataOf(a[1]) : undefined });
  };
  BY_PATH.forEach((n) => guarded(fs, n, (a) => onPath(a, n, "fs")));
  if (fs.promises) BY_PATH.filter((n) => !/Sync$|createWriteStream/.test(n)).forEach((n) => guarded(fs.promises, n, (a) => onPath(a, n, "fs.promises")));
  const opened = (p, flags, fd) => { fds.set(fd, clean(p)); if (isWriteFlag(flags)) emit({ ev: "fs", via: "fs", op: "open", paths: [clean(p)], flags: String(flags), fd }); };
  const origOpenSync = fs.openSync;
  fs.openSync = function openSync(p, flags) { const fd = origOpenSync.apply(this, arguments); try { opened(pathOf(p), flags, fd); } catch { /* */ } return fd; };
  const origOpen = fs.open;
  fs.open = function open(p, flags) {
    const args = Array.from(arguments), last = args.length - 1;
    if (typeof args[last] === "function") {
      const done = args[last];
      args[last] = function (err, fd) { if (!err) { try { opened(pathOf(p), typeof flags === "function" ? "r" : flags, fd); } catch { /* */ } } return done.apply(this, arguments); };
    }
    return origOpen.apply(this, args);
  };
  const origClose = fs.closeSync;
  fs.closeSync = function closeSync(fd) { try { if (fd > 2) fds.delete(fd); } catch { /* */ } return origClose.apply(this, arguments); };
  ["writeSync", "write"].forEach((n) => guarded(fs, n, (a) => emit({ ev: "fd-write", op: n, fd: a[0], target: fds.get(a[0]) || "fd" + a[0], data: dataOf(a[1]) })));
  ["writevSync", "writev"].forEach((n) => guarded(fs, n, (a) => emit({ ev: "fd-write", op: n, fd: a[0], target: fds.get(a[0]) || "fd" + a[0], data: dataOf(Array.isArray(a[1]) ? a[1] : null) })));
  if (fs.promises && fs.promises.open) {
    const po = fs.promises.open;
    let patched = false;
    fs.promises.open = async function open(p, flags) {
      const fh = await po.apply(this, arguments);
      try {
        if (isWriteFlag(flags)) emit({ ev: "fs", via: "fs.promises", op: "open", paths: [clean(pathOf(p))], flags: String(flags) });
        fh.__leakPath = clean(pathOf(p));
        if (!patched) {
          patched = true;
          const proto = Object.getPrototypeOf(fh);
          ["write", "writeFile", "appendFile", "writev", "truncate"].forEach((n) => guarded(proto, n, function (a) { emit({ ev: "fd-write", op: "filehandle." + n, fd: -1, target: this && this.__leakPath || "filehandle", data: dataOf(a[0]) }); }));
        }
      } catch { /* */ }
      return fh;
    };
  }

  /* ---- children ---- */
  const envNow = (e) => {
    const vars = {}, carry = [], allHits = new Set(), allSealed = new Set();
    for (const k of Object.keys(e || {}).sort()) {
      const v = String(e[k]), h = hits(v).concat(hits(k)), s = sealedHits(v).concat(sealedHits(k));
      h.forEach((i) => allHits.add(i));
      s.forEach((i) => allSealed.add(i));
      if (h.length) carry.push(clean(k));
      vars[clean(k)] = h.length || s.length ? "<carries>" : v;
    }
    return { vars, carry, hits: Array.from(allHits).sort((a, b) => a - b), sealed: Array.from(allSealed).sort((a, b) => a - b) };
  };
  const optionsOf = (o) => {
    if (!o || typeof o !== "object") return null;
    const out = {};
    for (const k of Object.keys(o)) {
      if (k === "env") continue;
      const v = o[k];
      out[k] = hits(v).length ? { carries: hits(v) } : (typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v == null ? v
        : Buffer.isBuffer(v) || ArrayBuffer.isView(v) ? { bytes: v.byteLength } : (() => { try { return JSON.parse(JSON.stringify(v)); } catch { return String(v); } })());
    }
    return out;
  };
  let inside = 0;
  ["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync", "fork"].forEach((n) => {
    const orig = cp[n];
    if (typeof orig !== "function") return;
    const wrapped = function (...a) {
      const top = inside === 0;
      inside++;
      try {
        if (top) {
          try {
            const argv = Array.isArray(a[1]) ? a[1].map(String) : [];
            const optIx = a.findIndex((x, i) => i > 0 && x && typeof x === "object" && !Array.isArray(x));
            const o = optIx > 0 ? a[optIx] : null, own = !!(o && o.env);
            const env = envNow(own ? o.env : process.env);
            emit({ ev: "child", op: n, file: clean(String(a[0])), fileHits: hits(String(a[0])), argv: argv.map(clean), argvHits: hits(argv),
                   options: optionsOf(o), optionsHits: hits(Object.assign({}, o || {}, { env: undefined })),
                   envOwn: own, env: env.vars, envCarry: env.carry,
                   sealed: sealedHits([String(a[0]), argv, o]) });
          } catch { /* see emit */ }
        }
        const ret = orig.apply(this, a);
        if (top) { try { noteChild(ret, n); } catch { /* see emit */ } }
        return ret;
      } finally { inside--; }
    };
    Object.defineProperty(wrapped, "name", { value: n });
    cp[n] = wrapped;
  });

  /* The pid, recorded at the call, and the writes that happen afterwards: stdin and a fork channel.
     A grandchild's stdin is a net.Socket, so the socket hook below skips a stream marked here. */
  function noteChild(ret, op) {
    if (!ret || typeof ret !== "object") return;
    const pid = ret.pid;
    /* `parent` is this process, the one that spawned it: the reap kills a pid only while it is still that child */
    if (pid) emit({ ev: "child-pid", pid, parent: process.pid, op });
    else if (typeof ret.on === "function") ret.on("spawn", () => { try { if (ret.pid) emit({ ev: "child-pid", pid: ret.pid, parent: process.pid, op }); } catch { /* */ } });
    if (typeof ret.on !== "function") return;
    const stdin = ret.stdin;
    if (stdin && typeof stdin.write === "function" && !stdin.__leakStdin) {
      stdin.__leakStdin = true;
      stdin.__leakPid = () => ret.pid;
      ["write", "end"].forEach((m) => {
        const origM = stdin[m];
        if (typeof origM !== "function") return;
        stdin[m] = function (chunk, ...rest) {
          try {
            emit({ ev: "child-stdin", op: m, pid: ret.pid || null, mark: markOfValue(chunk), hits: hits(chunk), sealed: sealedHits(chunk) });
          } catch { /* */ }
          return origM.call(this, chunk, ...rest);
        };
      });
    }
    if (typeof ret.send === "function" && !ret.__leakSend) {
      ret.__leakSend = true;
      const origSend = ret.send;
      ret.send = function (msg, ...rest) {
        try {
          emit({ ev: "child-send", op: "send", pid: ret.pid || null, mark: markOfValue(msg), hits: hits(msg), sealed: sealedHits(msg) });
        } catch { /* */ }
        return origSend.call(this, msg, ...rest);
      };
    }
  }

  /* ---- network: by needle, and every socket open whether or not it carries one ---- */
  const net = require("node:net"), tls = require("node:tls"), http = require("node:http"), https = require("node:https");
  const dgram = require("node:dgram"), dns = require("node:dns");
  const endpoint = (args) => {
    const a = args && args[0];
    if (typeof a === "number") return String(a) + " " + String(args[1] == null ? "" : args[1]);
    if (typeof a === "string") return a;
    if (a && typeof a === "object") return String(a.host || a.hostname || a.path || "") + ":" + String(a.port == null ? "" : a.port);
    return "";
  };
  const netEmit = (op, args, extra) => {
    const where = endpoint(args);
    emit(Object.assign({ ev: "net", op, where: (clean(where) || "").slice(0, 180), mark: markOfValue(args), hits: hits(args), sealed: sealedHits(args), socket: false }, extra || {}));
  };
  const wrapExport = (obj, name, before) => {
    const orig = obj[name];
    if (typeof orig !== "function" || obj["__leak_" + name]) return;
    obj["__leak_" + name] = true;
    const wrapped = function (...a) { try { before.call(this, a); } catch { /* */ } return orig.apply(this, a); };
    Object.defineProperty(wrapped, "name", { value: name });
    obj[name] = wrapped;
  };
  wrapExport(net, "connect", (a) => netEmit("connect", a, { socket: true }));
  if (net.createConnection !== net.connect) wrapExport(net, "createConnection", (a) => netEmit("connect", a, { socket: true }));
  wrapExport(tls, "connect", (a) => netEmit("tls.connect", a, { socket: true }));
  const sockWrite = net.Socket && net.Socket.prototype && net.Socket.prototype.write;
  const sockEnd = net.Socket && net.Socket.prototype && net.Socket.prototype.end;
  const sockConnect = net.Socket && net.Socket.prototype && net.Socket.prototype.connect;
  if (typeof sockConnect === "function") {
    net.Socket.prototype.connect = function (...a) { try { netEmit("socket.connect", a, { socket: true }); } catch { /* */ } return sockConnect.apply(this, a); };
  }
  const onSock = (op, orig) => function (chunk, ...rest) {
    try {
      if (this && this.__leakStdin) { /* the stdin wrapper already recorded this write */ }
      else netEmit("socket." + op, [chunk], { mark: markOfValue(chunk), hits: hits(chunk), sealed: sealedHits(chunk), where: clean((this && (this.remoteAddress || this._host || "")) + ":" + (this && this.remotePort || "")) });
    } catch { /* */ }
    return orig.call(this, chunk, ...rest);
  };
  if (typeof sockWrite === "function") net.Socket.prototype.write = onSock("write", sockWrite);
  if (typeof sockEnd === "function") net.Socket.prototype.end = onSock("end", sockEnd);
  const wrapReq = (mod, label) => {
    ["request", "get"].forEach((name) => {
      const orig = mod[name];
      if (typeof orig !== "function") return;
      mod[name] = function (...a) {
        try { netEmit(label + "." + name, a, { socket: true }); } catch { /* */ }
        const req = orig.apply(this, a);
        try {
          ["write", "end"].forEach((m) => {
            const base = req[m];
            if (typeof base !== "function" || req["__leak_" + m]) return;
            req["__leak_" + m] = true;
            req[m] = function (chunk, ...rest) {
              try { netEmit(label + "." + m, [chunk], { mark: markOfValue(chunk), hits: hits(chunk), sealed: sealedHits(chunk) }); } catch { /* */ }
              return base.call(this, chunk, ...rest);
            };
          });
        } catch { /* */ }
        return req;
      };
    });
  };
  wrapReq(http, "http");
  wrapReq(https, "https");
  if (typeof globalThis.fetch === "function" && !globalThis.fetch.__leakFetch) {
    const origFetch = globalThis.fetch;
    const wrappedFetch = function (input, init) {
      try { netEmit("fetch", [input, init], { socket: true, where: clean(String(input && input.url || input || "")).slice(0, 180), mark: markOfValue([input, init]) }); } catch { /* */ }
      return origFetch.apply(this, arguments);
    };
    wrappedFetch.__leakFetch = true;
    globalThis.fetch = wrappedFetch;
  }
  if (dgram.Socket && dgram.Socket.prototype && typeof dgram.Socket.prototype.send === "function") {
    const origSend = dgram.Socket.prototype.send;
    dgram.Socket.prototype.send = function (msg, ...rest) {
      try { netEmit("dgram.send", [msg], { socket: true, mark: markOfValue(msg), hits: hits(msg), sealed: sealedHits(msg) }); } catch { /* */ }
      return origSend.call(this, msg, ...rest);
    };
  }
  if (typeof dgram.createSocket === "function") {
    const origCreate = dgram.createSocket;
    dgram.createSocket = function (...a) {
      try { netEmit("dgram.create", a, { socket: true }); } catch { /* */ }
      return origCreate.apply(this, a);
    };
  }
  const dnsNames = ["lookup", "resolve", "resolve4", "resolve6", "resolveAny", "reverse"];
  dnsNames.forEach((name) => wrapExport(dns, name, (a) => netEmit("dns." + name, a, { socket: false })));
  if (dns.promises) dnsNames.forEach((name) => { if (typeof dns.promises[name] === "function") wrapExport(dns.promises, name, (a) => netEmit("dns." + name, a, { socket: false })); });

  /* ---- threads ---- */
  const NativeWorker = wt.Worker;
  wt.Worker = class Worker extends NativeWorker {
    constructor(file, opts) {
      const o = opts || {};
      const env = o.env && typeof o.env === "object" && o.env !== wt.SHARE_ENV ? Object.assign({ mode: "own" }, envNow(o.env)) : { mode: o.env === wt.SHARE_ENV ? "share" : "copy" };
      emit({ ev: "worker", file: clean(typeof file === "string" ? (file.length > 200 ? "<inline " + file.length + " chars>" : file) : String(file && file.href || file)),
             keys: Object.keys(o), env, hits: hits([o.workerData, o.argv, o.execArgv, typeof file === "string" ? file : null]) });
      super(file, opts);
    }
    /* THE HOP THE SECRET IS MEANT TO MAKE (src/studio-thread.cjs call): which verb, and which needles its arguments carry. */
    postMessage(m, ...rest) {
      try { emit({ ev: "post", verb: m && typeof m.verb === "string" ? clean(m.verb) : null, hits: hits(m) }); } catch { /* */ }
      return super.postMessage(m, ...rest);
    }
  };
  if (!wt.isMainThread && wt.parentPort) {
    const pp = wt.parentPort, origPost = pp.postMessage;
    pp.postMessage = function postMessage(m, ...rest) { try { emit({ ev: "post-back", hits: hits(m) }); } catch { /* */ } return origPost.call(this, m, ...rest); };
  }

  globalThis.__leak = {
    phase: (name) => emit({ ev: "phase", name: clean(name) }),
    /* what the electron stand-in saw: a handler's reply, a webContents.send, an event.reply */
    ipc: (kind, channel, value) => emit({ ev: "ipc", kind: clean(kind), channel: clean(channel), hits: hits(value), sealed: sealedHits(value) }),
    /* Every call the recording Proxy sees on the electron stand-in. Indices only. */
    electron: (member, args) => emit({ ev: "electron", member: ((clean(member) || "") + (markOfValue(args) ? " " + markOfValue(args) : "")).slice(0, 200), hits: hits(args), sealed: sealedHits(args) }),
    /* An in-band probe: the value is a live secret the scenario already holds. The event keeps indices, never bytes. */
    saw: (name, value) => emit({ ev: "saw", name: clean(name), hits: hits(value), sealed: sealedHits(value) }),
    hits, redact,
  };
  process.on("exit", (code) => {
    try { const env = envNow(process.env); emit({ ev: "exit", code, envCarry: env.carry, envHits: env.hits, sealed: env.sealed }); } catch { /* */ }
  });
  emit({ ev: "boot", main: wt.isMainThread, needles: NEEDLES.length, sealed: SEALED.length, home: clean(os.homedir()), tmp: clean(os.tmpdir()), cwd: clean(process.cwd()),
         execArgv: process.execArgv.map(clean), appdata: clean(process.env.APPDATA || ""), userprofile: clean(process.env.USERPROFILE || ""), argv: process.argv.slice(1).map(clean) });
  Module.syncBuiltinESMExports();
})();
