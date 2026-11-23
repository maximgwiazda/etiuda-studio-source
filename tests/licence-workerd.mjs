/* THE LICENCE SERVICE IN CLOUDFLARE'S OWN RUNTIME (the test architect, 2026-11-13; Claude alpha's criterion of 02:56: "if the
 * Worker calls something workerd refuses, this leg goes red").
 *
 *     node tests/licence-workerd.mjs
 *
 * WHY. Max's first real sign-in, 2026-11-13, was answered 503 "unavailable": core.mjs loadKeys fetched the providers' keys with
 * redirect: "error", which workerd refuses with a TypeError, and every other leg ran the service in Node or handed it a fetch.
 * Here nothing is handed: service/licence/worker.mjs's serviceWith (through tests/fixtures/licence-workerd-entry.mjs, which
 * changes only the trusted root) is bundled and run by wrangler dev --local, the pinned WRANGLER_VERSION, in workerd with the
 * staging Worker's own compatibility date and flags read from service/licence/wrangler.toml, over a local D1 made from
 * schema.sql. One sign-in goes through it, and the provider's keys are fetched by the runtime's own fetch, over real TLS, from a
 * provider double on 127.0.0.1.
 *
 * HOW THE HTTPS KEY ADDRESS IS MET WITHOUT LOOSENING THE PRODUCT. The service takes only an https jwks address, and keeps doing
 * so: the double serves https on 127.0.0.1 under a certificate this run makes (a test CA and a leaf for 127.0.0.1, built here
 * from node's own crypto and never kept), and the CA reaches workerd's trust by NODE_EXTRA_CA_CERTS, which miniflare reads into
 * its internet service's trusted certificates. No product line knows of it. Local only: no Cloudflare account, token or remote.
 *
 *   lw0  control: the run's CA verifies the double's certificate for 127.0.0.1 under node's own TLS (else the leg is at fault)
 *   lw1  the Worker in workerd answers the sign-in 200 with a licence
 *   lw2  the provider's keys were fetched from inside workerd, over TLS, at least once
 *   lw3  the licence it answers is a running trial under the run's own root, and not under another root (its control)
 *   lw4  control: a token signed by a key the provider never published is refused "token", so the fetched keys did the judging
 *
 * Exit 0 green, the count of failed checks otherwise, 78 where the leg could not run at all (no engine pin, no wrangler).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import https from "node:https";
import crypto from "node:crypto";
import module from "node:module";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { wranglerArgv } from "../tools/wrangler.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SERVICE = path.join(ROOT, "service", "licence");
const PINNED = path.join(ROOT, "engine", "pinned");
const ENTRY = path.join(HERE, "fixtures", "licence-workerd-entry.mjs");
const NL = "\n";
const DAY = 24 * 3600000;
const PREFIX = "/licence-staging/v1/";
const READY_MS = 120000;

let checks = 0, failed = 0;
function check(ok, line) { checks++; if (!ok) failed++; process.stdout.write((ok ? "  ok   " : "  FAIL ") + line + NL); }
const b64u = buf => Buffer.from(buf).toString("base64url");

/* ---- a test CA and a leaf for 127.0.0.1, in DER by hand (node can sign but not issue) ------------------------------------ */

function der(tag, ...parts) {
  const body = Buffer.concat(parts.map(p => Buffer.isBuffer(p) ? p : Buffer.from(p)));
  const n = body.length;
  const len = n < 0x80 ? Buffer.from([n]) : n < 0x100 ? Buffer.from([0x81, n]) : Buffer.from([0x82, n >> 8, n & 0xff]);
  return Buffer.concat([Buffer.from([tag]), len, body]);
}
const seq = (...p) => der(0x30, ...p);
function oid(text) {
  const a = text.split(".").map(Number), out = [40 * a[0] + a[1]];
  for (const v of a.slice(2)) {
    const b = [v & 0x7f];
    for (let x = v >>> 7; x > 0; x >>>= 7) b.unshift(0x80 | (x & 0x7f));
    out.push(...b);
  }
  return der(0x06, Buffer.from(out));
}
const int = buf => der(0x02, buf[0] & 0x80 ? Buffer.concat([Buffer.from([0]), buf]) : buf);
const utc = ms => der(0x17, Buffer.from(new Date(ms).toISOString().replace(/[-:T]/g, "").slice(2, 14) + "Z"));
const name = cn => seq(der(0x31, seq(oid("2.5.4.3"), der(0x0c, Buffer.from(cn)))));
const ext = (id, critical, value) => seq(oid(id), ...(critical ? [der(0x01, Buffer.from([0xff]))] : []), der(0x04, value));
const ECDSA_SHA256 = seq(oid("1.2.840.10045.4.3.2"));

function certificate({ subject, issuer, pub, signer, ca, now }) {
  const spki = pub.export({ type: "spki", format: "der" });
  const keyId = crypto.createHash("sha1").update(spki).digest();
  const serial = crypto.randomBytes(16); serial[0] &= 0x7f;
  const exts = ca
    ? [ext("2.5.29.19", true, seq(der(0x01, Buffer.from([0xff])))), ext("2.5.29.15", true, der(0x03, Buffer.from([1, 0x06]))),
      ext("2.5.29.14", false, der(0x04, keyId))]
    : [ext("2.5.29.19", true, seq()), ext("2.5.29.15", true, der(0x03, Buffer.from([7, 0x80]))),
      ext("2.5.29.37", false, seq(oid("1.3.6.1.5.5.7.3.1"))),
      ext("2.5.29.17", false, seq(der(0x87, Buffer.from([127, 0, 0, 1])))),
      ext("2.5.29.35", false, seq(der(0x80, issuer.keyId)))];
  const tbs = seq(der(0xa0, int(Buffer.from([2]))), int(serial), ECDSA_SHA256, name(issuer ? issuer.cn : subject), seq(utc(now - 3600000), utc(now + DAY)),
    name(subject), spki, der(0xa3, seq(...exts)));
  const sig = crypto.sign("sha256", tbs, signer);
  const body = seq(tbs, ECDSA_SHA256, der(0x03, Buffer.concat([Buffer.from([0]), sig])));
  return { der: body, keyId, pem: "-----BEGIN CERTIFICATE-----" + NL + body.toString("base64").match(/.{1,64}/g).join(NL) + NL + "-----END CERTIFICATE-----" + NL };
}

function makeTls(now) {
  const caKeys = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const leafKeys = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const ca = certificate({ subject: "licence-workerd test CA", pub: caKeys.publicKey, signer: caKeys.privateKey, ca: true, now });
  const leaf = certificate({ subject: "127.0.0.1", issuer: { cn: "licence-workerd test CA", keyId: ca.keyId }, pub: leafKeys.publicKey,
    signer: caKeys.privateKey, ca: false, now });
  return { caPem: ca.pem, certPem: leaf.pem, keyPem: leafKeys.privateKey.export({ type: "pkcs8", format: "pem" }) };
}

/* ---- the provider double: published keys over https, and tokens it signs -------------------------------------------- */

function rsaJwk(kid) {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const j = publicKey.export({ format: "jwk" });
  return { privateKey, jwk: { kty: "RSA", n: j.n, e: j.e, kid, alg: "RS256", use: "sig" } };
}
function idToken(privateKey, kid, claims) {
  const head = b64u(JSON.stringify({ alg: "RS256", typ: "JWT", kid })), body = b64u(JSON.stringify(claims));
  return head + "." + body + "." + b64u(crypto.sign("sha256", Buffer.from(head + "." + body), privateKey));
}
function startProvider(tls, published) {
  const hits = [];
  const server = https.createServer({ key: tls.keyPem, cert: tls.certPem }, (req, res) => {
    hits.push({ method: req.method, url: req.url, tls: !!req.socket.encrypted });
    if (req.method === "GET" && req.url === "/jwks") {
      const text = JSON.stringify({ keys: published });
      res.writeHead(200, { "content-type": "application/json", "cache-control": "max-age=3600", "content-length": Buffer.byteLength(text) });
      res.end(text);
    } else { res.writeHead(404, { "content-length": 0 }); res.end(); }
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve({ port: server.address().port, hits,
      close: () => new Promise(r => { server.close(() => r()); server.closeAllConnections(); }) }));
  });
}
function nodeTlsAccepts(port, caPem) {
  return new Promise(resolve => {
    const req = https.get({ host: "127.0.0.1", port, path: "/jwks", ca: caPem }, res => { res.resume(); resolve(res.statusCode === 200); });
    req.on("error", () => resolve(false));
    req.setTimeout(10000, () => { req.destroy(); resolve(false); });
  });
}

/* ---- the service's own modules in node, for the request shapes and the licence's judgement --------------------------- */

async function nodeModules() {
  module.registerHooks({
    load(url, context, next) {
      if (/\/engine\/pinned\/src\/modules\/catalog-v2\.js$/.test(url)) {
        const r = next(url, Object.assign({}, context, { format: "module" }));
        return Object.assign({}, r, { format: "module" });
      }
      return next(url, context);
    },
  });
  const at = p => pathToFileURL(p).href;
  return { requests: await import(at(path.join(SERVICE, "requests.mjs"))), licence: await import(at(path.join(ROOT, "src", "licence.mjs"))) };
}

/* ---- wrangler -------------------------------------------------------------------------------------------------------- */

function freePort() {
  return new Promise((resolve, reject) => {
    const s = http.createServer();
    s.once("error", reject);
    s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); });
  });
}
/** The staging Worker's runtime settings, read from its own wrangler.toml, never restated. */
function stagingRuntime() {
  const toml = fs.readFileSync(path.join(SERVICE, "wrangler.toml"), "utf8");
  const date = /^compatibility_date\s*=\s*"([0-9-]+)"/m.exec(toml);
  const flags = /^compatibility_flags\s*=\s*(\[[^\]]*\])/m.exec(toml);
  if (!date || !flags) throw new Error("service/licence/wrangler.toml names no compatibility_date or compatibility_flags");
  return { date: date[1], flags: flags[1] };
}
/** Stops wrangler and everything it started (workerd among them) by the PID this leg recorded, and waits for its exit. */
async function killTree(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const gone = new Promise(r => { child.once("exit", r); setTimeout(r, 10000); });
  if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
  else { try { process.kill(-child.pid, "SIGKILL"); } catch { try { child.kill("SIGKILL"); } catch { /* gone */ } } }
  await gone;
}
async function waitReady(port, child, ms) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if (child.exitCode !== null) return false;
    try { await fetch("http://127.0.0.1:" + port + PREFIX, { signal: AbortSignal.timeout(2000) }); return true; }
    catch { await new Promise(r => setTimeout(r, 250)); }
  }
  return false;
}
async function post(port, route, body) {
  const res = await fetch("http://127.0.0.1:" + port + PREFIX + route, { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify(body) });
  const text = await res.text();
  let parsed = null;
  try { parsed = JSON.parse(text); } catch { parsed = null; }
  return { status: res.status, body: parsed };
}

async function main() {
  if (!fs.existsSync(path.join(PINNED, "relay", "core.cjs")) || !fs.existsSync(path.join(PINNED, "src", "modules", "catalog-v2.js"))) {
    process.stdout.write("  FAIL nothing ran: engine/pinned/ is not filled; run node tools/engine-fetch.mjs first" + NL + "#counts checks=0 failed=0" + NL);
    return 78;
  }
  const K = await nodeModules();
  const RQ = K.requests, L = K.licence;
  const now = Date.now();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "licence-workerd-"));
  const tls = makeTls(now);
  fs.writeFileSync(path.join(dir, "ca.pem"), tls.caPem);

  const kid = "workerd-lab-" + crypto.randomBytes(6).toString("hex");
  const signer = rsaJwk(kid), stranger = rsaJwk(kid);
  const op = await startProvider(tls, [signer.jwk]);
  const issuer = "https://127.0.0.1:" + op.port;
  const clientId = "workerd-lab-client";
  const PROVIDER = { id: "lab-oidc", clientId, issuer: [issuer], jwks: issuer + "/jwks", org: "tid", personal: null };

  /* The run's root, its service key and their delegation, as tests/licence-service.mjs makes them. */
  const ed = () => {
    const { privateKey } = crypto.generateKeyPairSync("ed25519");
    return { privateKey, pub: crypto.createPublicKey(privateKey).export({ type: "spki", format: "der" }).subarray(-32).toString("hex") };
  };
  const root = ed(), svc = ed();
  const svcId = "workerd-service-" + crypto.createHash("sha256").update(Buffer.from(svc.pub, "hex")).digest("hex").slice(0, 16);
  const delegation = L.createTestDelegation({ key: { id: svcId, pub: svc.pub }, may: ["licence", "relay-grant"], from: now - 7 * DAY,
    until: now + 358 * DAY }, root.privateKey, "etiuda-root-workerd");
  const rt = stagingRuntime();
  const toml = [
    'name = "licence-workerd-leg"',
    "main = " + JSON.stringify(ENTRY.split(path.sep).join("/")),
    'compatibility_date = "' + rt.date + '"',
    "compatibility_flags = " + rt.flags,
    "[vars]",
    'API_PREFIX = "' + PREFIX + '"',
    "PROVIDERS = " + JSON.stringify(JSON.stringify([PROVIDER])),
    'TEST_ROOT = "' + root.pub + '"',
    "[[d1_databases]]",
    'binding = "DB"',
    'database_name = "licence-workerd-leg"',
    'database_id = "00000000-0000-4000-8000-000000000000"',
    "",
  ].join(NL);
  fs.writeFileSync(path.join(dir, "wrangler.toml"), toml);
  fs.writeFileSync(path.join(dir, ".dev.vars"), "SERVICE_KEY=" + svc.privateKey.export({ type: "pkcs8", format: "der" }).toString("hex") + NL
    + "DELEGATION='" + JSON.stringify(delegation) + "'" + NL + "HASH_KEY=" + crypto.randomBytes(32).toString("hex") + NL);

  const env = Object.assign({}, process.env, { NODE_EXTRA_CA_CERTS: path.join(dir, "ca.pem"), WRANGLER_SEND_METRICS: "false",
    WRANGLER_LOG_PATH: path.join(dir, "logs"), NO_COLOR: "1" });
  const conf = ["--config", path.join(dir, "wrangler.toml"), "--persist-to", path.join(dir, "state")];
  let child = null, log = "";
  try {
    check(await nodeTlsAccepts(op.port, tls.caPem), "lw0 control: the run's CA verifies the double's certificate for 127.0.0.1 under node's own TLS");
    op.hits.length = 0;

    const made = spawnSync(process.execPath, wranglerArgv(["d1", "execute", "DB", "--local", "--file", path.join(SERVICE, "schema.sql")].concat(conf)),
      { cwd: dir, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], windowsHide: true, timeout: 300000 });
    if (made.status !== 0) {
      process.stdout.write("  FAIL nothing ran: wrangler d1 execute exited " + made.status + NL + String(made.stderr || made.stdout || "").split(NL).slice(-8).join(NL) + NL
        + "#counts checks=" + checks + " failed=" + failed + NL);
      return 78;
    }
    const port = await freePort(), inspector = await freePort();
    child = spawn(process.execPath, wranglerArgv(["dev", "--local", "--ip", "127.0.0.1", "--port", String(port), "--inspector-port", String(inspector),
      "--local-upstream", "licence.localhost", "--upstream-protocol", "https", "--show-interactive-dev-session=false", "--log-level", "warn"].concat(conf)),
      { cwd: dir, env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true, detached: process.platform !== "win32" });
    child.stdout.on("data", d => { log += d; });
    child.stderr.on("data", d => { log += d; });
    if (!(await waitReady(port, child, READY_MS))) {
      process.stdout.write("  FAIL nothing ran: wrangler dev did not answer within " + READY_MS + " ms" + NL + log.split(NL).slice(-10).join(NL) + NL
        + "#counts checks=" + checks + " failed=" + failed + NL);
      return 78;
    }

    const signin = async (privateKey) => {
      const lead = ed(), leadPub = lead.pub, seed = crypto.randomBytes(32).toString("hex");
      const t0 = Math.floor(Date.now() / 1000);
      const token = idToken(privateKey, kid, { iss: issuer, aud: clientId, sub: "workerd-lab-user-" + crypto.randomBytes(6).toString("hex"),
        tid: crypto.randomUUID(), iat: t0, nbf: t0, exp: t0 + 3600, nonce: await RQ.signinNonce(leadPub, seed) });
      const t = Date.now();
      const sig = crypto.sign(null, Buffer.from(RQ.signinBytes({ provider: PROVIDER.id, tokenHash: await RQ.tokenHash(token), lead: leadPub, t })),
        lead.privateKey).toString("hex");
      return post(port, "signin", { provider: PROVIDER.id, idToken: token, lead: leadPub, t, seed, sig });
    };

    const s = await signin(signer.privateKey);
    check(s.status === 200 && s.body && s.body.ok === true && !!s.body.licence,
      "lw1 the Worker in workerd answers the sign-in 200 with a licence: " + s.status + " " + (s.body ? s.body.reason || "ok" : "no JSON"));
    const keyHits = op.hits.filter(h => h.method === "GET" && h.url === "/jwks" && h.tls).length;
    check(keyHits >= 1, "lw2 the provider's keys were fetched from inside workerd over TLS: " + keyHits + " fetch(es)");
    /* A lead no licence admits starts a trial of their own (core.mjs signin), so the answer is a trial licence: running under the
       run's root, and nothing under another root, which is the check's own control. */
    const stateUnder = async key => { try { return (await L.licenceState(s.body.licence, { trustedKey: key })).status; } catch (e) { return "threw"; } };
    const mine = s.body && s.body.licence ? await stateUnder(root.pub) : "none", other = s.body && s.body.licence ? await stateUnder(ed().pub) : "none";
    check(mine === "trial" && other !== "trial", "lw3 the licence it answers is a running trial under the run's own root, and not under another: "
      + mine + " / " + other);
    const w = await signin(stranger.privateKey);
    check(w.status === 403 && w.body && w.body.reason === "token",
      "lw4 control: a token signed by a key the provider never published is refused \"token\": " + w.status + " " + (w.body ? w.body.reason || "ok" : "no JSON"));
  } finally {
    await killTree(child);
    await op.close();
    /* workerd lets go of its local D1 a moment after its parent's exit, so the leg's own folder is removed with retries. */
    try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 40, retryDelay: 250 }); }
    catch (e) { process.stdout.write("  note the leg's temporary folder " + dir + " could not be removed: " + e.code + NL); }
  }
  process.stdout.write("#counts checks=" + checks + " failed=" + failed + NL);
  return Math.min(failed, 77);
}

main().then(c => process.exit(c), e => {
  process.stdout.write("  FAIL the leg threw: " + (e && e.stack || e) + NL + "#counts checks=" + checks + " failed=" + (failed + 1) + NL);
  process.exit(1);
});
