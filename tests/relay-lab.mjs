/* THE RELAY IN MEMORY, FOR STUDIO'S RELAY LEGS (board 900, relay slice 1, steps 5 and 6).
 *
 *     import { relayWorld, makeVault, keyPair, boxPair, agreeWith, deskProgram, settle, until, labDir } from "./relay-lab.mjs";
 *
 * The relay as the pinned engine builds it (relay/worker.mjs over relay/test/stand-ins.cjs: its Durable Object, its R2
 * bucket and its sockets, in this process), reached by each program through a transport that hands every call to it and
 * refuses any other host; nothing contacts a host. A desk beside Studio is the pinned channel layer as a desk runs it
 * (place desk:<id>), with keys made here. Every word in a fixture is invented. A lab folder is made under scratch/ and
 * left there: nothing is deleted.
 *
 * THE RELAY MAKES A TEAM ONLY UNDER A GRANT (board 935, slice G3), so the lab runs it over an invented root, the pinned
 * relay/test/grant-kit.cjs's (test keys that sign nothing real; never the vendor's), and a leg that makes a team on it places a
 * grant for its lead first: placeGrant writes relay-grant.json beside the lead's key file, where Studio reads it, signed by that
 * root. A runner or a shell the leg builds is told the same root (GRANT_ROOTS; STUDIO_RELAY_ROOT for the shell). */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PIN = path.join(ROOT, "engine", "pinned");
const nodeRequire = createRequire(import.meta.url);
export const HOST = "etiuda.dev";
/* The lab's root, from the pinned grant kit. */
const GRANT_KIT = nodeRequire(path.join(PIN, "relay", "test", "grant-kit.cjs"));
export const GRANT_ROOTS = GRANT_KIT.ROOTS;
export const GRANT_ROOT_PUB = GRANT_KIT.ROOT.pub;
export const GRANT_FILE = "relay-grant.json";
export const hex = (n) => crypto.randomBytes(n).toString("hex");
export const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const SPKI = Buffer.from("302a300506032b6570032100", "hex");
const X25519_SPKI = Buffer.from("302a300506032b656e032100", "hex");
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function until(fn, ms) {
  /* A ceiling, not a delay: the wait returns as soon as fn holds. 25 s, and a caller that passes ms keeps its own. */
  const end = Date.now() + (ms || 25000);
  for (;;) {
    let v = false;
    try { v = await fn(); } catch { v = false; }
    if (v) return true;
    if (Date.now() > end) return false;
    await wait(20);
  }
}

/** A grant for the lead whose public half is `leadPub`, signed by the lab's root and valid around `now` (the clock now unless
 *  given); `o` is the kit's grantFor options (fields, omit, via, signer, keyId). Written beside `keyFile`, as Studio reads it, and
 *  returned. */
export function placeGrant(keyFile, leadPub, now, o) {
  const grant = GRANT_KIT.grantFor(leadPub, now == null ? Date.now() : now, o);
  fs.writeFileSync(path.join(path.dirname(keyFile), GRANT_FILE), JSON.stringify(grant, null, 1) + String.fromCharCode(10));
  return grant;
}
export const grantKit = GRANT_KIT;

/* A FOLLOWING STUDIO HOLDS A MEMBER CERTIFICATE (the relay's design note C-6). The pinned relay refuses a hello that opens a session for
   a member key without a current seat certificate, the invitation's token hello included (relay/core.cjs byToken and byKey, through
   anySeat and seatCertWhy). In the product the licence service mints one for the member key on every sign-in and renewal
   (service/licence/core.mjs memberCertificate, which signs certificateFor with `member` set: the mark signed as its line, its life at
   most MEMBER_DAYS); Studio keeps it with its sign-in (shell/main.js seatCertNow("member")) and its follow run hands it to the channel
   (shell/main.js followStart, src/member.mjs armRelay's `seat`). The lab's stand-in is the pinned kit's certFor in that shape, signed
   under a delegation of the lab's root that may sign "licence": test keys that sign nothing real. */
export const MEMBER_CERT_MS = 7 * GRANT_KIT.DAY;
export const LAB_LICENCE = sha(Buffer.from("lab licence")).slice(0, 32);
/** A member certificate for the member key whose public half is `memberPub`, issued at `now` (the clock now unless given); `o.licence`,
 *  `o.span` and `o.cert` (the kit's certFor options) change it. */
export function memberCert(memberPub, now, o) {
  const x = o || {};
  return GRANT_KIT.certFor(memberPub, x.licence || LAB_LICENCE, now == null ? Date.now() : now, x.span || MEMBER_CERT_MS,
    Object.assign({ member: true }, x.cert || {}));
}
/** The `seat` a following Studio's shell hands startFollow: the member certificate for the member key in `memberFile`, minted at the first
 *  ask once the key exists and kept while it runs by `o.clock` (the clock now unless given), as Studio keeps the one its sign-in brought;
 *  minted again at that clock once it has run out or for a new member key, as the next renewal would; null while there is no member key. */
export function memberSeat(memberFile, o) {
  const x = o || {}, clock = typeof x.clock === "function" ? x.clock : Date.now;
  let held = null;
  return () => {
    const now = clock();
    let key = "";
    try { key = String(JSON.parse(fs.readFileSync(memberFile, "utf8").replace(/^\uFEFF/, "")).key || ""); } catch { key = ""; }
    if (!/^[0-9a-f]{64}$/.test(key)) return null;
    if (held && held.desk === key && held.until > now && held.issued <= now) return held;
    held = memberCert(key, now, x);
    return held;
  };
}

/* A DESK HOLDS ITS OWN SEAT CERTIFICATE the same way (the relay's design note C-4): its sign-in brings one for its own key, thirty days
   at most (service/licence/core.mjs certificateFor, PROOF_MS), and its channel sends it from the first hello on every team
   (shell/relay/channel.cjs seatHello, `seat`). deskProgram hands every lab desk one unless the leg's `channel` names its own `seat`. */
export const DESK_CERT_MS = 30 * GRANT_KIT.DAY;
/** A desk's seat certificate for the desk key whose public half is `deskPub`, issued at `now` (the clock now unless given); `o` as
 *  memberCert's. */
export function deskCert(deskPub, now, o) {
  const x = o || {};
  return GRANT_KIT.certFor(deskPub, x.licence || LAB_LICENCE, now == null ? Date.now() : now, x.span || DESK_CERT_MS, x.cert || {});
}
/** The `seat` a signed-in desk's channel is handed: its certificate, minted at the first ask and kept while it runs by `o.clock` (the
 *  clock now unless given), then minted again at that clock, as the desk's daily renewal keeps it current. */
export function deskSeat(deskPub, o) {
  const x = o || {}, clock = typeof x.clock === "function" ? x.clock : Date.now;
  let held = null;
  return () => {
    const now = clock();
    if (!held || held.until <= now || held.issued > now) held = deskCert(deskPub, now, x);
    return held;
  };
}

/** A lab folder of its own under scratch/, never removed. */
export function labDir(name) {
  const at = path.join(ROOT, "scratch", name + "-" + process.pid + "-" + hex(3));
  fs.mkdirSync(at, { recursive: true });
  return at;
}

/** A vault as safeStorage is one: AES-GCM under a fixed key, available. */
export function makeVault() {
  const k = crypto.createHash("sha256").update("lab vault").digest();
  return {
    available: () => true,
    seal(text) {
      const iv = crypto.randomBytes(12), c = crypto.createCipheriv("aes-256-gcm", k, iv);
      return Buffer.concat([iv, c.update(String(text), "utf8"), c.final(), c.getAuthTag()]);
    },
    open(bytes) {
      const b = Buffer.from(bytes), d = crypto.createDecipheriv("aes-256-gcm", k, b.subarray(0, 12));
      d.setAuthTag(b.subarray(b.length - 16));
      return Buffer.concat([d.update(b.subarray(12, b.length - 16)), d.final()]).toString("utf8");
    },
  };
}

export function keyPair(branch, keyId) {
  const p = crypto.generateKeyPairSync("ed25519");
  const pub = p.publicKey.export({ type: "spki", format: "der" }).subarray(SPKI.length).toString("hex");
  return { keyId: keyId || (branch ? "k-" + sha(Buffer.from(pub, "hex")).slice(0, 16) : pub), pub, privateKey: p.privateKey };
}
export function boxPair() {
  const p = crypto.generateKeyPairSync("x25519");
  return { pub: p.publicKey.export({ type: "spki", format: "der" }).subarray(X25519_SPKI.length).toString("hex"), priv: p.privateKey };
}
export const agreeWith = (box) => (peer) => {
  try {
    return crypto.diffieHellman({ privateKey: box.priv,
      publicKey: crypto.createPublicKey({ key: Buffer.concat([X25519_SPKI, Buffer.from(String(peer), "hex")]), format: "der", type: "spki" }) });
  } catch { return null; }
};

/** The relay in memory and the ways to it. */
export async function relayWorld() {
  const C = nodeRequire(path.join(PIN, "shell", "relay", "channel.cjs"));
  const B = nodeRequire(path.join(PIN, "shell", "relay", "blob.cjs"));
  const core = nodeRequire(path.join(PIN, "relay", "core.cjs"));
  const S = nodeRequire(path.join(PIN, "relay", "test", "stand-ins.cjs"));
  const W = (await import(pathToFileURL(path.join(PIN, "relay", "worker.mjs")).href)).routeWith(GRANT_ROOTS, (env) => env.NOW());
  const R = S.relayEnv({ roots: GRANT_ROOTS });
  R.clock.now = Date.now();
  const foreign = [];
  async function relayFetch(url, init) {
    const u = new URL(url);
    if (u.host !== HOST) { foreign.push(url); throw new Error("no such host in the lab"); }
    const i = Object.assign({}, init);
    if (i.body && i.method !== "GET") i.duplex = "half"; else delete i.body;
    return W.fetch(new Request(url, i), R.env);
  }
  function findSocket(id) {
    for (const name of R.stores.keys()) { const found = R.socket(name, id); if (found) return found; }
    return null;
  }
  /* Every invites call goes to the pin, which signs {add, drop} or {add, drop, wraps}, keeps a wrap inside the invitation's
     `inv:` row, replaces it by `wraps`, and answers with dropped and used (relay/core.cjs invites, team.cjs). The transport
     below still keeps an add's `until` under a key of its own; the pin's own answer passes through unchanged. */
  const HEX32 = /^[0-9a-f]{32}$/;
  function rtOfInvites(url) {
    const m = /\/t\/([0-9a-f]{32})\/invites$/.exec(String(url).replace(/^https:\/\/[^/]+/, ""));
    return m ? m[1] : "";
  }
  /* Invitation states are not answered here. The pin has the route itself, GET /t/<relay team id>/states, answered only to the
     lead's session (relay/core.cjs statesFor, in the pin since d45ffa7d), and Studio's calls reach it through relayFetch. */
  /* What a call or a frame carries, bytes kept as latin1 so a key is still the bytes that were sent. */
  function textOf(v) {
    if (v == null) return "";
    if (typeof v === "string") return v;
    try { return Buffer.from(v).toString("latin1"); } catch { return String(v); }
  }
  /* A program's transport: `log` names each call, `sent` keeps its headers and body and each socket frame, for the hunt.
     `down` makes the relay not answer. A frame the program sends is recorded and not handed on; the relay's frames are. */
  function transport(name) {
    const t = { name, down: false, log: [], sent: [] };
    t.request = async (method, url, headers, body) => {
      t.log.push(method + " " + String(url).replace(/^https:\/\/[^/]+\/relay\/v1\/(?:t\/[0-9a-f]{32}\/)?/, ""));
      const lines = [method + " " + String(url)];
      if (headers && typeof headers === "object") for (const k of Object.keys(headers)) lines.push(k + ": " + headers[k]);
      lines.push(textOf(body));
      t.sent.push(lines.join("\n"));
      if (t.down) throw new Error("the lab's relay does not answer " + name);
      /* A leg may answer one call itself (a 503 on the since list, or on one blob) and let the rest through. */
      if (typeof t.answer === "function") {
        const stood = await t.answer(method, url, headers, body);
        if (stood) return stood;
      }
      const rt = method === "POST" ? rtOfInvites(url) : "";
      let parsed = null;
      if (rt) { try { parsed = JSON.parse(textOf(body)); } catch { parsed = null; } }
      const res = await relayFetch(url, { method, headers, body });
      const bytes = Buffer.from(await res.arrayBuffer());
      if (res.status === 200 && parsed && Array.isArray(parsed.add)) {
        const s = store(rt);
        if (s) {
          for (const a of parsed.add) {
            if (a && HEX32.test(a.id) && Number.isFinite(a.until)) s.put("until:" + a.id, a.until);
          }
          const drop = Array.isArray(parsed.drop) ? parsed.drop : [];
          for (const id of drop) if (HEX32.test(id)) { s.del("until:" + id); }
        }
      }
      return { status: res.status, header: (n) => res.headers.get(n), bytes, socket: res.headers.get("x-stand-in-socket") };
    };
    t.connect = (url, headers, on) => {
      if (t.down) return null;
      let ws = null, closed = false;
      const handle = { send(m) { t.sent.push(textOf(m)); }, close() { closed = true; if (ws) ws.close(1000, ""); } };
      t.request("GET", String(url).replace(/^wss:/, "https:"), Object.assign({ upgrade: "websocket" }, headers)).then((r) => {
        ws = r.status === 200 && r.socket && !closed ? findSocket(r.socket) : null;
        if (!ws) { setImmediate(on.close); return; }
        const send = ws.send, close = ws.close;
        ws.send = (m) => { t.sent.push(textOf(m)); send.call(ws, m); setImmediate(() => on.message(String(m))); };
        ws.close = (c, why) => { close.call(ws, c, why); setImmediate(on.close); };
      }, () => setImmediate(on.close));
      return handle;
    };
    return t;
  }
  const store = (rt) => R.stores.get(rt);
  const entries = (rt) => (store(rt) ? store(rt).dump().map(([k, v]) => [k, JSON.parse(v)]) : []);
  /* What the relay keeps for a team, read whole as text: its store and every object in its bucket. */
  const relayText = (rt) => (store(rt) ? store(rt).dump().map(([k, v]) => k + "=" + v).join("\n") : "")
    + [...R.bucket.objects.values()].map((b) => b.toString("latin1")).join("\n");
  /* A hostile relay: a stored record copied, changed or put back under a new place in the sequence. */
  function inject(rt, meta, ct) {
    const s = store(rt), seq = (s.get("seq") || 0) + 1, obj = rt + "/" + meta.id + "/" + hex(8);
    R.bucket.objects.set(obj, Buffer.from(ct));
    s.put("blob:" + meta.id, Object.assign({ supersedes: null, del: false, at: R.clock.now }, meta, { seq, obj, size: ct.length }));
    s.put("seq:" + String(seq).padStart(16, "0"), meta.id);
    s.put("seq", seq);
  }
  function recordOf(rt, id) {
    const rec = store(rt).get("blob:" + id);
    return rec ? { rec, ct: R.bucket.objects.get(rec.obj) } : null;
  }
  const blobsBy = (rt, writer) => entries(rt).filter(([k, v]) => k.startsWith("blob:") && v.writer === writer).map(([, v]) => v);
  async function admin(method, p, json) {
    const res = await relayFetch("https://" + HOST + p, { method, headers: { "content-type": "application/json" },
      body: Buffer.from(JSON.stringify(json), "utf8") });
    return { status: res.status, json: JSON.parse(Buffer.from(await res.arrayBuffer()).toString("utf8") || "null") };
  }
  /* A wrap as the pin keeps it: inside the invitation's `inv:` row, gone with the row or once its end has passed. */
  const wrapOf = (rt, id) => { const s = store(rt); const rec = s ? s.get("inv:" + id) : null; return rec && rec.wrap ? rec.wrap : null; };
  const untilOf = (rt, id) => { const s = store(rt); const v = s ? s.get("until:" + id) : undefined; return Number.isFinite(v) ? v : null; };
  return { C, B, core, R, W, foreign, transport, store, entries, relayText, inject, recordOf, blobsBy, admin, relayFetch, wrapOf, untilOf };
}

/** A desk beside Studio: the pinned channel layer as a desk runs it, its keys made here, its seat certificate minted here (deskSeat), its
 *  mirror and record in `lab`. */
export function deskProgram(world, lab, name, who, o) {
  const x = o || {};
  const t = x.transport || world.transport(name), said = [], written = [];
  const mirror = path.join(lab, name);
  const ch = world.C.createChannel(Object.assign({
    mirror, stateFile: path.join(lab, name + ".json"),
    me: () => ({ keyId: who.keyId, public: who.pub, privateKey: who.privateKey, place: "desk:" + who.keyId, box: who.box ? who.box.pub : undefined }),
    request: t.request, connect: t.connect, pollMs: 1e9, watch: false,
    write: (f, text) => { written.push(path.relative(mirror, f).split(path.sep).join("/")); world.C.writeWhole(f, text); },
    say: (l) => said.push(l), seat: deskSeat(who.pub, { clock: () => world.R.clock.now }),
  }, x.channel || {}));
  return { name, ch, t, said, written, mirror, prog: ch.program };
}

export async function settle(...chs) {
  for (let i = 0; i < 3; i++) for (const c of chs) { c.kick(); await c.idle(); }
}

export const put = (dir, rel, text) => {
  const f = path.join(dir, ...rel.split("/"));
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f + ".tmp", text);
  fs.renameSync(f + ".tmp", f);
};
export const read = (dir, rel) => { try { return fs.readFileSync(path.join(dir, ...rel.split("/")), "utf8"); } catch { return null; } };
