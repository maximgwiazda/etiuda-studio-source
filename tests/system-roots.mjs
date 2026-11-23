/* THE RELAY'S SOCKET TRUSTS WHAT WINDOWS TRUSTS (board 989).
 *
 *     node tests/system-roots.mjs        exit code is the number of failed checks, capped at 63; 78 is no verdict
 *
 * gate-kind: node
 *
 * Claude alpha's criterion: "every connection either app makes trusts what Windows trusts, so the apps work wherever the
 * person's browser works". Studio's requests go through Chromium and read the system's store; its socket to the relay is the
 * runtime's own and trusted only the roots bundled with the runtime, so behind a gateway that inspects encrypted traffic, whose
 * root an office puts in the system's store, the socket failed while the browser worked. src/wire.cjs now joins the store's
 * roots to the bundle as it loads. These legs prove it on the runtime Studio ships on, Electron's own Node, run as Node
 * (tests/shell-door.mjs electronAsNode: no window, no profile): this desk's Node 22 has no setDefaultCACertificates at all.
 *
 * THE BLIND SPOT THEY CLEAR. Every agent shell on this desk carries NODE_USE_SYSTEM_CA=1, which makes the runtime trust the
 * store by itself, so a leg that inherited it would pass where a customer's install fails. The child gets the environment
 * without NODE_USE_SYSTEM_CA, NODE_EXTRA_CA_CERTS and NODE_OPTIONS, and says what it saw of them.
 *
 * THE STAND-IN. A root and a server certificate under it are made in the child for each run (an EC P-256 pair, the X.509 bytes
 * written here, nothing committed), and the child serves https and a socket at 127.0.0.1 under them. The office's store is
 * stood in by the runtime's own reading of the real store with that root added: tls.getCACertificates("system") is wrapped
 * in the child before src/wire.cjs loads, so nothing is written to Windows' store.
 *
 *   989r1  with the stand-in root in the store: before src/wire.cjs loads, the runtime's fetch and its socket both refuse the
 *          server; after it loads, both reach it (the socket opens and reads the server's message)
 *   989r2  the real store, unchanged: before the load some of the store's roots are not in the runtime's trust, after it none is
 *          missing; the stand-in root, in no store, is still refused by both, so the merge trusts the store and nothing more
 *   989r3  a store that cannot be read: src/wire.cjs still loads and the runtime's trust is what it was
 *
 * PLANTS. The merge is taken out once in a scratch copy (tests/plant-copy.mjs) and 989r1 must go red; ETIUDA_PLANTS=off
 * skips the phase. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { electronAsNode, electronExe } from "./shell-door.mjs";
import { copyPlants } from "./plant-copy.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SELF = fileURLToPath(import.meta.url);
const ONLY = process.env.SYSTEM_ROOTS_ONLY || "";

let asserted = 0, failed = 0;
function check(ok, line) {
  asserted++;
  if (ok) console.log("  ok   " + line);
  else { failed++; console.log("  FAIL " + line); }
}
function skip(line) { console.log("  skip " + line); }

try { electronExe(); } catch (e) {
  console.log("system-roots: 0 assertion(s), NO VERDICT, " + String(e && e.message || e));
  process.exit(78);
}

/* The child: everything happens in Electron's Node. argv: the tree, the mode. One line "RESULT <json>". */
const CHILD = String.raw`"use strict";
const tls = require("node:tls"), https = require("node:https"), crypto = require("node:crypto"), path = require("node:path");
const root = process.argv[process.argv.length - 2], mode = process.argv[process.argv.length - 1];
function len(n) { if (n < 0x80) return Buffer.from([n]); const b = []; while (n > 0) { b.unshift(n & 0xff); n >>= 8; } return Buffer.from([0x80 | b.length].concat(b)); }
const tlv = (tag, body) => Buffer.concat([Buffer.from([tag]), len(body.length), body]);
const seq = (...xs) => tlv(0x30, Buffer.concat(xs)), set = (...xs) => tlv(0x31, Buffer.concat(xs));
function oid(s) { const p = s.split(".").map(Number), out = [40 * p[0] + p[1]];
  for (const v of p.slice(2)) { const b = [v & 0x7f]; let n = v >> 7; while (n) { b.unshift(0x80 | (n & 0x7f)); n >>= 7; } out.push(...b); }
  return tlv(0x06, Buffer.from(out)); }
const int = (buf) => tlv(0x02, buf[0] & 0x80 ? Buffer.concat([Buffer.from([0]), buf]) : buf);
const utc = (d) => tlv(0x17, Buffer.from(d.toISOString().replace(/[-:T]/g, "").slice(2, 14) + "Z"));
const name = (cn) => seq(set(seq(oid("2.5.4.3"), tlv(0x0c, Buffer.from(cn)))));
const ext = (id, critical, value) => seq(oid(id), critical ? tlv(0x01, Buffer.from([0xff])) : Buffer.alloc(0), tlv(0x04, value));
const ECDSA_SHA256 = seq(oid("1.2.840.10045.4.3.2"));
function cert(subject, pub, issuer, signKey, exts) {
  const now = Date.now();
  const tbs = seq(tlv(0xa0, int(Buffer.from([2]))), int(crypto.randomBytes(8)), ECDSA_SHA256, name(issuer),
    seq(utc(new Date(now - 3600e3)), utc(new Date(now + 86400e3))), name(subject), pub.export({ type: "spki", format: "der" }), tlv(0xa3, seq(...exts)));
  const der = seq(tbs, ECDSA_SHA256, tlv(0x03, Buffer.concat([Buffer.from([0]), crypto.sign("sha256", tbs, signKey)])));
  return "-----BEGIN CERTIFICATE-----\n" + der.toString("base64").match(/.{1,64}/g).join("\n") + "\n-----END CERTIFICATE-----\n";
}
const ca = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" }), leaf = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
const caName = "Stand-in gateway root " + crypto.randomBytes(4).toString("hex");
const standIn = cert(caName, ca.publicKey, caName, ca.privateKey, [ext("2.5.29.19", true, seq(tlv(0x01, Buffer.from([0xff])))), ext("2.5.29.15", true, tlv(0x03, Buffer.from([1, 0x06])))]);
const serverCert = cert("localhost", leaf.publicKey, caName, ca.privateKey, [ext("2.5.29.19", true, seq()), ext("2.5.29.15", true, tlv(0x03, Buffer.from([7, 0x80]))),
  ext("2.5.29.37", false, seq(oid("1.3.6.1.5.5.7.3.1"))), ext("2.5.29.17", false, seq(tlv(0x82, Buffer.from("localhost")), tlv(0x87, Buffer.from([127, 0, 0, 1]))))]);
const prints = (list) => new Set(list.map((p) => { try { return new crypto.X509Certificate(p).fingerprint256; } catch (e) { return "unreadable"; } }));
const standInPrint = new crypto.X509Certificate(standIn).fingerprint256;
const out = { mode, node: process.versions.node, setter: typeof tls.setDefaultCACertificates,
  env: ["NODE_USE_SYSTEM_CA", "NODE_EXTRA_CA_CERTS", "NODE_OPTIONS"].filter((k) => process.env[k] !== undefined), argv: process.execArgv.join(" ") };
const realGet = tls.getCACertificates, realSystem = realGet("system");
if (mode === "store") tls.getCACertificates = (k) => (k === "system" ? realSystem.concat([standIn]) : realGet(k));
if (mode === "unreadable") tls.getCACertificates = (k) => { if (k === "system") throw new Error("the store cannot be read"); return realGet(k); };
const srv = https.createServer({ key: leaf.privateKey.export({ type: "pkcs8", format: "pem" }), cert: serverCert }, (q, r) => r.end("reached"));
srv.on("upgrade", (q, s) => {
  const accept = crypto.createHash("sha1").update(q.headers["sec-websocket-key"] + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").digest("base64");
  s.write("HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: " + accept + "\r\n\r\n");
  s.write(Buffer.concat([Buffer.from([0x81, 7]), Buffer.from("reached")]));
});
srv.listen(0, "127.0.0.1", async () => {
  const port = srv.address().port;
  const tryFetch = async () => { try { const r = await fetch("https://127.0.0.1:" + port + "/"); return r.status + " " + (await r.text()); }
    catch (e) { return "refused " + ((e && e.cause && e.cause.code) || (e && e.message)); } };
  const trySocket = () => new Promise((res) => {
    const seen = [], w = new WebSocket("wss://127.0.0.1:" + port + "/");
    const done = () => { res(seen.join(",")); try { w.close(); } catch (e) { /* gone */ } };
    const t = setTimeout(() => { seen.push("timeout"); done(); }, 10000);
    w.onopen = () => seen.push("open");
    w.onerror = () => seen.push("error");
    w.onmessage = (m) => { seen.push("message " + m.data); clearTimeout(t); done(); };
    w.onclose = () => { seen.push("close"); clearTimeout(t); done(); };
  });
  const systemPrints = prints(realSystem);
  const missingOf = (list) => { const have = prints(list); let n = 0; for (const p of systemPrints) if (!have.has(p)) n++; return n; };
  const defaultBefore = realGet("default");
  out.store = systemPrints.size;
  out.missingBefore = missingOf(defaultBefore);
  out.before = { fetch: await tryFetch(), socket: await trySocket() };
  try { require(path.join(root, "src", "wire.cjs")); out.loaded = "loaded"; } catch (e) { out.loaded = "threw " + e.message; }
  const defaultAfter = realGet("default");
  out.missingAfter = missingOf(defaultAfter);
  out.standInTrusted = prints(defaultAfter).has(standInPrint);
  const b = prints(defaultBefore), a = prints(defaultAfter);
  out.unchanged = b.size === a.size && [...b].every((p) => a.has(p));
  out.after = { fetch: await tryFetch(), socket: await trySocket() };
  console.log("RESULT " + JSON.stringify(out));
  srv.close();
  process.exit(0);
});
`;

const LAB = path.join(ROOT, "scratch", "system-roots-" + process.pid);
fs.mkdirSync(LAB, { recursive: true });
const childAt = path.join(LAB, "child.cjs");
fs.writeFileSync(childAt, CHILD);
/* The environment a customer's install meets: none of this desk's store switches. */
const ENV = Object.assign({}, process.env);
for (const k of ["NODE_USE_SYSTEM_CA", "NODE_EXTRA_CA_CERTS", "NODE_OPTIONS"]) delete ENV[k];

/* Why the last child gave no result, so a fail line in the gate record carries it (the record keeps fail lines only). */
let whyNone = "";
function inChild(mode) {
  const r = electronAsNode([childAt, ROOT, mode], { env: ENV, timeout: 60000 });
  const text = String(r.stdout || "") + String(r.stderr || "");
  const m = /^RESULT (.*)$/m.exec(text);
  const got = m ? JSON.parse(m[1]) : null;
  whyNone = got ? "" : " [" + mode + " child gave no result: status " + r.status + ", signal " + r.signal
    + (r.error ? ", error " + (r.error.code || r.error.message) : "") + ", output " + JSON.stringify(text.trim().slice(-300)) + "]";
  process.stdout.write("       " + mode + ": " + (got ? JSON.stringify(got) : "no result, status " + r.status + " " + text.trim().slice(-300).replace(/\s+/g, " ")) + "\n");
  return got;
}
const clean = (g) => !!g && g.env.length === 0 && g.argv.indexOf("use-system-ca") < 0 && g.setter === "function";
const reached = (s) => /^200 reached$/.test(s.fetch) && /^open,message reached/.test(s.socket);
const refused = (s) => /^refused/.test(s.fetch) && s.socket.indexOf("open") < 0 && s.socket.indexOf("message") < 0;

const LEGS = {};
LEGS["989r1"] = () => {
  const g = inChild("store");
  check(clean(g) && g.loaded === "loaded" && refused(g.before) && reached(g.after) && g.standInTrusted,
    "989r1 with the stand-in gateway's root in the store, the runtime (Node " + (g && g.node) + ", store switches in its environment "
    + JSON.stringify(g && g.env) + ") refuses the server before src/wire.cjs loads (" + JSON.stringify(g && g.before)
    + ") and reaches it after, by fetch and by socket (" + JSON.stringify(g && g.after) + ")" + whyNone);
};
LEGS["989r2"] = () => {
  const g = inChild("real");
  check(clean(g) && g.loaded === "loaded" && g.missingAfter === 0 && !g.standInTrusted && refused(g.before) && refused(g.after),
    "989r2 the real store's " + (g && g.store) + " roots: " + (g && g.missingBefore) + " not trusted by the runtime before the load, "
    + (g && g.missingAfter) + " after; a root in no store is still refused by fetch and socket (" + JSON.stringify(g && g.after) + ")" + whyNone);
};
LEGS["989r3"] = () => {
  const g = inChild("unreadable");
  check(clean(g) && g.loaded === "loaded" && g.unchanged === true && refused(g.after),
    "989r3 a store that cannot be read: src/wire.cjs " + (g && g.loaded) + ", the runtime's trust unchanged " + (g && g.unchanged) + whyNone);
};

for (const name of Object.keys(LEGS)) {
  if (ONLY && name !== ONLY) continue;
  try { LEGS[name](); }
  catch (e) { failed++; asserted++; console.log("  FAIL " + name + " threw: " + String(e && e.stack || e).split("\n").slice(0, 4).join(" | ")); }
}

const PLANTS = [
  { mark: "wire-system-roots", leg: "989r1", rel: "src/wire.cjs", line: "/* the bundle alone */" },
];
if (!ONLY) copyPlants({ root: ROOT, self: SELF, label: "system-roots", onlyVar: "SYSTEM_ROOTS_ONLY", plants: PLANTS, check, skip, timeout: 120000 });

console.log("system-roots: " + (asserted - failed) + " of " + asserted + " held");
process.exit(Math.min(failed, 63));
