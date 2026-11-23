/* A SEAT HELD BY SIGN-IN IS PROVED AGAIN, END TO END IN ONE PROCESS (board 980, stage H).
 *
 *     node tests/signin-renewal.mjs        exit code is the number of failed checks, capped at 63
 *
 * gate-kind: node
 *
 * THE CRITERION, Claude alpha's decision 15 item 1 (2026-11-11 23:39), widened to desks at 00:02: a seat held by sign-in is
 * proved again with the provider at least every 30 days, the quiet check asking for a fresh proof from day 25 and Studio
 * refreshing silently through its sealed refresh token; a refreshed ID token carries no nonce, so renewal is bound by the
 * Studio key already bound to that seat, the token's sub equal to the seat's, a fresh iat and the token's first use; when the
 * provider will not renew, the seat lapses at day 30 and the lead is asked to sign in, the lead's own catalogs open throughout.
 *
 * ONE PROCESS, NOTHING REACHED: Studio's own client (src/licence-client.mjs: signInFlow, quietCheck, afterCheck, take, keepWho;
 * src/desk-seat.mjs checkSeat) and a desk's own call as the interface of 2026-11-12 states it talk to the service's own core (service/licence/core.mjs through
 * worker.mjs's rules, over the in-memory D1 stand-in tests/d1-stand-in.mjs, as tests/licence-service.mjs builds one), and both
 * talk to one stand-in provider: its token address issues ID tokens signed by a test RSA key whose public half it serves to
 * the service as Microsoft's published keys; a refreshed one carries no nonce; and its refresh can be refused. The clock is
 * the service's and the client's alike, moved by hand. No network, no browser, no window.
 *
 *   sr1  a lead signs in through Studio's client; the organisation's paid licence is kept, the seat's code and ownership named, the
 *        licence's public reference kept, the refresh token sealed, the seat proved now
 *   sr2  past day 25 the quiet check answers ok with proof "due"
 *   sr3  Studio renews through the provider, the refreshed token carrying no nonce, and the service accepts it: the seat proved
 *        again, the rotated refresh token sealed
 *   sr4  the renewal binds by four conditions: the same token twice, one signed by a key not bound to the seat, one naming
 *        another person and one issued long ago are each refused
 *   sr5  a desk signs its person in to the service itself (signin/desk, night decision 18): seated with a seat certificate, which
 *        the lead's Studio takes (checkSeat) for the reference its own sign-in kept; the desk's own renewal, a nonce-less refreshed
 *        token signed by its key, is accepted for that key and refused for another desk's; Studio refuses a forged certificate,
 *        one moved to another desk and one checked against another licence
 *   sr6  the provider refusing while the proof is only due changes nothing: the check's answer stands, the seal is kept
 *   sr7  the provider still refusing at day 30: the check answers "signin", the seat stops counting (a colleague refused for the
 *        one lead seat a minute before takes it now), the seal is forgotten and the cover's state asks the lead to sign in,
 *        while the lead's licence file stays where it was, byte for byte, and still reads active
 *   sr8  the shell's own check runs afterCheck before it takes anything (the renewal logic is the client's, driven above)
 *   sr9  the root's revoked keys' list a check carries is kept through a renewed proof "due" and through a "signin" the provider
 *        will not renew (Argon's review of 2026-11-12, finding 7)
 *   sr10c Studio's client keeps a member-slot certificate only where it carries the member mark: a desk's certificate answered as a
 *        member's is dropped, alone or beside a lead certificate (the addendum on the member certificate, point 1)
 *
 * PLANTED FAULTS, each in a scratch copy (tests/plant-copy.mjs), turn their leg red: the proof due left unrenewed (sr3), the
 * renewal posted to signin (sr3), the lapse left unanswered (sr7), the seal kept at the lapse (sr7), the licence's reference
 * not kept (sr1), and for sr5 a desk's renewal taken from a key not held for its person, and Studio's certificate check without
 * its signature, its desk key or its licence reference; for sr9 the list dropped from a renewal's answer, from a refusal, or by
 * take() reading only an ok answer. ETIUDA_PLANTS=off skips that phase and counts each plant as skipped. SIGNIN_RENEWAL_ONLY=<leg>
 * reports that leg alone (the scenario still runs whole, since each leg stands on the one before).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import module from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { standInD1 } from "./d1-stand-in.mjs";
import { copyPlants } from "./plant-copy.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const SERVICE = path.join(ROOT, "service", "licence");
const SCRATCH = path.join(ROOT, "scratch", "signin-renewal");
const ONLY = process.env.SIGNIN_RENEWAL_ONLY || "";
const EXPECTED = 34;

/* The pin's catalog-v2.js is an ES module in a folder whose package.json says CommonJS; read by its syntax, as
   tests/licence-service.mjs reads it. */
module.registerHooks({
  load(url, context, next) {
    if (/\/engine\/pinned\/src\/modules\/catalog-v2\.js$/.test(url)) {
      const r = next(url, Object.assign({}, context, { format: "module" }));
      return Object.assign({}, r, { format: "module" });
    }
    return next(url, context);
  },
});
const W = await import(pathToFileURL(path.join(SERVICE, "worker.mjs")).href);
const Core = await import(pathToFileURL(path.join(SERVICE, "core.mjs")).href);
const Q = await import(pathToFileURL(path.join(SERVICE, "requests.mjs")).href);
const C = await import(pathToFileURL(path.join(ROOT, "src", "licence-client.mjs")).href);
const D = await import(pathToFileURL(path.join(ROOT, "src", "desk-seat.mjs")).href);
const L = await import(pathToFileURL(path.join(ROOT, "src", "licence.mjs")).href);
const Engine = await import(pathToFileURL(path.join(ROOT, "src", "engine.mjs")).href);

let asserted = 0, failed = 0;
function check(id, ok, line) {
  if (ONLY && id !== ONLY) return;
  asserted++;
  if (ok) console.log("  ok   " + line);
  else { failed++; console.log("  FAIL " + line); }
}
function skip(line) {
  if (ONLY) return;
  asserted++;
  console.log("  SKIP " + line);
}
/* Each leg is run whole; one that throws is red with its reason, and the scenario goes on. */
async function leg(id, line, fn) {
  let got = null;
  try { got = await fn(); } catch (e) { got = { ok: false, said: "threw: " + String(e && e.message || e).slice(0, 300) }; }
  check(id, !!got && got.ok === true, id + " " + line + (got && got.said ? ": " + got.said : ""));
}

/* ---- the clock, the keys, the service ----------------------------------------------------------------------------- */

const MIN = 60000, DAY = 24 * 3600000;
const T0 = Date.UTC(2026, 10, 12, 9, 0, 0);
const clock = { now: T0 };
const keyOf = (pk) => ({ privateKey: pk, public: crypto.createPublicKey(pk).export({ type: "spki", format: "der" }).subarray(-32).toString("hex") });
const ROOTK = keyOf(crypto.generateKeyPairSync("ed25519").privateKey), SERVICEK = keyOf(crypto.generateKeyPairSync("ed25519").privateKey);
const keyId = (k) => "studio-" + crypto.createHash("sha256").update(Buffer.from(k.public, "hex")).digest("hex").slice(0, 16);
const DELEGATION = L.createTestDelegation({ key: { id: keyId(SERVICEK), pub: SERVICEK.public }, may: ["licence", "relay-grant"],
  from: T0 - 10 * DAY, until: T0 + 300 * DAY }, ROOTK.privateKey, "etiuda-root-test");

/* The provider: one test RSA key, served to the service as Microsoft's published keys, and a token address for Studio. */
const MS_JWKS = "https://login.microsoftonline.com/common/discovery/v2.0/keys";
const MS_CLIENT = "00001111-aaaa-2222-bbbb-3333cccc4444";
/* The licence service's own registered resource (decision 49, section 11.11): an Entra licence's roles ride its access token alone. */
const MS_SERVICE = "55556666-cccc-7777-dddd-8888eeee9999";
const TENANT = "aaaabbbb-0000-cccc-1111-dddd2222eeee";
const RSA = (() => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = publicKey.export({ format: "jwk" });
  return { privateKey, jwk: { kty: "RSA", use: "sig", kid: "ms-test-1", x5t: "ms-test-1", n: jwk.n, e: jwk.e,
    issuer: "https://login.microsoftonline.com/{tenantid}/v2.0" } };
})();
const b64u = (b) => Buffer.from(b).toString("base64url");
function idToken(o) {
  const now = Math.floor((o.iat !== undefined ? o.iat : clock.now) / 1000), tid = o.tid || TENANT;
  const claims = { aud: MS_CLIENT, iss: "https://login.microsoftonline.com/" + tid + "/v2.0", iat: now, nbf: now, exp: now + 3600,
    oid: o.oid || "9a8b7c6d-5e4f-4a3b-8c2d-" + crypto.createHash("sha256").update(o.sub).digest("hex").slice(0, 12), sub: o.sub, tid,
    uti: crypto.randomBytes(16).toString("base64url"), ver: "2.0" };
  if (o.nonce) claims.nonce = o.nonce;
  if (o.roles) claims.roles = o.roles;
  const h = b64u(JSON.stringify({ typ: "JWT", alg: "RS256", kid: RSA.jwk.kid })), p = b64u(JSON.stringify(claims));
  return h + "." + p + "." + b64u(crypto.sign("sha256", Buffer.from(h + "." + p), RSA.privateKey));
}
/* The service's access token for the person `sub` of tenant `tid`, its `roles` where given, as Microsoft issues one for the resource. */
function accessToken(o) {
  const now = Math.floor(clock.now / 1000);
  const claims = { aud: MS_SERVICE, iss: "https://login.microsoftonline.com/" + o.tid + "/v2.0", iat: now, nbf: now, exp: now + 3600, azp: MS_CLIENT, azpacr: "0",
    oid: "9a8b7c6d-5e4f-4a3b-8c2d-" + crypto.createHash("sha256").update(o.sub).digest("hex").slice(0, 12), scp: "Licence.Use", sub: "access-" + o.sub, tid: o.tid,
    uti: crypto.randomBytes(16).toString("base64url"), ver: "2.0" };
  if (o.roles) claims.roles = o.roles;
  const h = b64u(JSON.stringify({ typ: "JWT", alg: "RS256", kid: RSA.jwk.kid })), p = b64u(JSON.stringify(claims));
  return h + "." + p + "." + b64u(crypto.sign("sha256", Buffer.from(h + "." + p), RSA.privateKey));
}
const provider = { refuse: false, codes: new Map(), refresh: new Map(), n: 0, asked: [] };
/* The token address: a code answered with a token carrying the nonce its request asked for; a refresh token answered with a
   fresh token carrying none and a rotated refresh token, unless the provider refuses. */
async function tokenAsk(url, form) {
  const f = new URLSearchParams(Buffer.from(form).toString("utf8"));
  provider.asked.push(f.get("grant_type"));
  const json = (status, doc) => ({ status, bytes: Buffer.from(JSON.stringify(doc)) });
  if (f.get("grant_type") === "authorization_code") {
    const c = provider.codes.get(f.get("code"));
    if (!c) return json(400, { error: "invalid_grant" });
    provider.codes.delete(f.get("code"));
    const rt = "rt-" + (++provider.n);
    provider.refresh.set(rt, c.sub);
    return json(200, { token_type: "Bearer", id_token: idToken({ sub: c.sub, nonce: c.nonce }), refresh_token: rt, access_token: "opaque" });
  }
  if (f.get("grant_type") === "refresh_token") {
    const sub = provider.refresh.get(f.get("refresh_token"));
    if (provider.refuse || !sub) return json(400, { error: "invalid_grant", error_description: "the account is disabled" });
    const rt = "rt-" + (++provider.n);
    provider.refresh.set(rt, sub);
    return json(200, { token_type: "Bearer", id_token: idToken({ sub }), refresh_token: rt, access_token: "opaque" });
  }
  return json(400, { error: "unsupported_grant_type" });
}
const jwksFetch = async (url) => {
  if (url !== MS_JWKS) throw new Error("no stand-in answers " + url);
  return new Response(JSON.stringify({ keys: [RSA.jwk] }), { status: 200, headers: { "content-type": "application/json", "cache-control": "public, max-age=86400" } });
};

const db = standInD1(fs.readFileSync(path.join(SERVICE, "schema.sql"), "utf8"));
const service = Core.makeService({ rules: W.RULES, roots: [ROOTK.public], clock: () => clock.now, fetch: jwksFetch });
const env = { DB: db, SERVICE_KEY: SERVICEK.privateKey.export({ type: "pkcs8", format: "der" }).toString("hex"), DELEGATION: JSON.stringify(DELEGATION),
  HASH_KEY: crypto.randomBytes(32).toString("hex"), PROVIDERS: JSON.stringify([{ id: "microsoft", clientId: MS_CLIENT, service: MS_SERVICE }]) };
/* The organisation's paid licence, one lead seat and five desk seats, admitting its tenant as admits keeps it (the keyed form,
   restated with node's own HMAC: "etiuda-licence-org", then the provider and the tenant, a newline between each). */
const ORG_KEYED = crypto.createHmac("sha256", Buffer.from(env.HASH_KEY, "hex")).update("etiuda-licence-org\nmicrosoft\n" + TENANT).digest("hex");
const LICENCE_ID = Number(db.raw.prepare("INSERT INTO licences (key_hash, email_hash, org, seats, updates_until, paid_until, lead_seats) VALUES (?, ?, ?, ?, ?, ?, ?)")
  .run(crypto.randomBytes(32).toString("hex"), "unused", "Kappa Tools", 5, "2027-11-12", T0 + 365 * DAY, 1).lastInsertRowid);
db.raw.prepare("INSERT INTO admits (licence, provider, org) VALUES (?, ?, ?)").run(LICENCE_ID, "microsoft", ORG_KEYED);
/* Its owner is the lead, as the attach script records one: the person keyed as seats keeps it ("etiuda-licence-person", iss, sub). */
const LEAD_PERSON = crypto.createHmac("sha256", Buffer.from(env.HASH_KEY, "hex")).update(["etiuda-licence-person", "https://login.microsoftonline.com/" + TENANT + "/v2.0", "lead-person"].join("\n")).digest("hex");
/* A tree before stage H has no owner column, and its legs then go red one by one rather than stopping here. */
try { db.raw.prepare("UPDATE licences SET owner = ? WHERE id = ?").run(LEAD_PERSON, LICENCE_ID); } catch { /* no owner kept */ }
/* A team is its lead's own (decision 47): the licence keeps today's rule, colleagues' desks seated by the organisation, and its owner has
   named the colleague who signs in for its lead seat (sr7), as migrations/0013_team_own.sql names the leads a licence has today. A tree
   before 0013 has neither. */
const COLLEAGUE_PERSON = crypto.createHmac("sha256", Buffer.from(env.HASH_KEY, "hex")).update(["etiuda-licence-person", "https://login.microsoftonline.com/" + TENANT + "/v2.0", "colleague-person"].join("\n")).digest("hex");
try { db.raw.prepare("UPDATE licences SET org_desks = 1 WHERE id = ?").run(LICENCE_ID); } catch { /* before 0013 */ }
try { db.raw.prepare("INSERT INTO lead_names (licence, person, named_by, at) VALUES (?, ?, ?, 0)").run(LICENCE_ID, COLLEAGUE_PERSON, LEAD_PERSON); } catch { /* before 0013 */ }
let ipN = 0;
/* Studio's one door to the licence service, as src/wire.cjs licenceRequest answers: {status, bytes}. */
async function ask(route, bytes) {
  const res = await service.fetch(new Request("https://licence.test/licence/v1/" + route, { method: "POST",
    headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113." + (++ipN % 250 + 1) }, body: Buffer.from(bytes) }), env);
  return { status: res.status, bytes: Buffer.from(await res.arrayBuffer()) };
}
globalThis.fetch = async () => { throw new Error("the runtime's fetch was called"); };

/* Studio: its key, its sealing, the provider it signs in with, and the files take() writes. */
const LEAD = keyOf(crypto.generateKeyPairSync("ed25519").privateKey), OTHER = keyOf(crypto.generateKeyPairSync("ed25519").privateKey);
const COLLEAGUE = keyOf(crypto.generateKeyPairSync("ed25519").privateKey);
/* A colleague in the same tenant signs in for the licence's one lead seat, as Studio's signIn sends it. */
const colleagueSignsIn = async () => {
  const seed = crypto.randomBytes(32).toString("hex");
  return C.signIn(ask, COLLEAGUE, "microsoft", idToken({ sub: "colleague-person", nonce: await Q.signinNonce(COLLEAGUE.public, seed) }), clock.now, seed);
};
const vault = { available: () => true, seal: (t) => Buffer.from("SEALED:" + Buffer.from(String(t)).reverse().toString("hex")),
  open: (b) => Buffer.from(String(Buffer.from(b)).slice(7), "hex").reverse().toString() };
const unsealed = (s) => (s ? vault.open(Buffer.from(String(s), "base64")) : "");
const MS = Object.assign({}, C.SIGN_IN_PROVIDERS.find((p) => p.id === "microsoft"), { clientId: MS_CLIENT });
clearScratch(SCRATCH);
fs.mkdirSync(SCRATCH, { recursive: true });
const ctx = () => ({ lead: LEAD.public, now: clock.now, licenceFile: path.join(SCRATCH, "licence.json"), grantFile: path.join(SCRATCH, "grant.json"),
  trustedKey: ROOTK.public, roots: [ROOTK.public] });
const io = { tokenAsk, ask, seal: (t) => C.sealRefresh(vault, t), unseal: (s) => vault.open(Buffer.from(String(s), "base64")) };
const CODE_RE = /^[0-9A-HJKMNP-TV-Z]{16}$/;
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
const leadSeat = () => db.raw.prepare("SELECT * FROM seats WHERE kind = 'lead' ORDER BY rowid LIMIT 1").get() || null;
/* What the shell keeps of the activation (licence-service.json), as licenceAct writes it for a sign-in. */
let st = null;
const seatsListed = async () => {
  const t = clock.now + Math.floor(Math.random() * 1000);
  const r = JSON.parse(Buffer.from((await ask("seat/list", Buffer.from(JSON.stringify({ lead: LEAD.public, t,
    sig: crypto.sign(null, Buffer.from(Q.seatListBytes({ lead: LEAD.public, t })), LEAD.privateKey).toString("hex") })))).bytes).toString("utf8"));
  return r && r.counts && r.counts.lead ? r.counts.lead.held : "none";
};

/* ---- the scenario ------------------------------------------------------------------------------------------------- */

let licenceBytes = "";
await leg("sr1", "a lead signs in through Studio's client: the paid licence kept, its code, ownership and public reference named and kept, the refresh token sealed, the seat proved now", async () => {
  const loopIo = Object.assign({}, io, {
    rand: crypto.randomBytes,
    page: () => "",
    listen: async () => {
      let settle = null;
      const caught = new Promise((ok, no) => { settle = { ok, no }; });
      loopIo.reply = (q) => settle.ok(q);
      return { port: 51234, caught, close: () => {} };
    },
    openPage: async (url) => {
      const q = new URL(url).searchParams, code = "code-" + crypto.randomBytes(8).toString("hex");
      provider.codes.set(code, { sub: "lead-person", nonce: q.get("nonce") });
      setImmediate(() => loopIo.reply("?code=" + code + "&state=" + encodeURIComponent(q.get("state"))));
      return true;
    },
  });
  const r = await C.signInFlow(loopIo, MS, LEAD, () => clock.now);
  const a = r.answer;
  const got = await C.take(a, ctx());
  st = Object.assign({ by: "signin", lead: LEAD.public, checked: clock.now, tried: clock.now, provider: "microsoft", refreshSealed: r.refreshSealed },
    typeof C.keepWho === "function" ? C.keepWho({}, a) : {});
  licenceBytes = fs.existsSync(ctx().licenceFile) ? fs.readFileSync(ctx().licenceFile, "utf8") : "";
  const seat = leadSeat();
  return { ok: a.ok === true && got.licence === "kept" && CODE_RE.test(String(a.me)) && a.owner === true && st.signinCode === a.me && st.signinOwner === true && /^[0-9a-f]{32}$/.test(String(a.ref)) && st.licenceRef === a.ref
    /* No licence file is written since the licence file goes as an everyday entitlement (Max, 2026-11-22 15:37); it was written here. */
    && unsealed(r.refreshSealed) === "rt-1" && !!seat && seat.proved_at === clock.now && licenceBytes.length === 0,
  said: [a.ok ? "ok" : a.reason, "licence:" + got.licence, "me:" + a.me, "owner:" + a.owner, "seal:" + unsealed(r.refreshSealed), "proved:" + (seat && seat.proved_at === clock.now)].join(" ") };
});

let due = null;
await leg("sr2", "past day 25 the quiet check answers ok with proof \"due\", naming the seat's code", async () => {
  clock.now = T0 + 26 * DAY;
  due = await C.quietCheck(ask, LEAD, clock.now);
  return { ok: due.ok === true && due.proof === "due" && due.me === st.signinCode, said: [due.ok ? "ok" : due.reason, "proof:" + due.proof].join(" ") };
});

await leg("sr3", "Studio renews through the provider with no nonce in the refreshed token, and the service accepts it: the seat proved again, the rotated token sealed", async () => {
  provider.asked.length = 0;
  const after = await C.afterCheck(io, MS, due, st, LEAD, () => clock.now);
  const got = after.answer && after.answer.ok === true ? await C.take(after.answer, ctx()) : { licence: "none" };
  const seat = leadSeat();
  const ok = after.answer.ok === true && after.answer !== due && provider.asked.join(",") === "refresh_token" && !!seat && seat.proved_at === clock.now
    && unsealed(after.state.refreshSealed) === "rt-2" && after.state.signinAsk === undefined && got.licence === "kept";
  st = after.state;
  return { ok, said: [after.answer.ok ? "ok" : after.answer.reason, "asked:" + provider.asked.join(","), "proved-now:" + (seat && seat.proved_at === clock.now),
    "seal:" + unsealed(after.state.refreshSealed), "licence:" + got.licence].join(" ") };
});

await leg("sr4", "the renewal binds by four conditions: the same token twice, a key not bound to the seat, another person, and an old iat are each refused", async () => {
  clock.now += 2 * MIN;
  const fresh = (o) => idToken(Object.assign({ sub: "lead-person" }, o));
  const once = fresh({});
  const first = await C.signInRenew(ask, LEAD, "microsoft", once, clock.now);
  const twice = await C.signInRenew(ask, LEAD, "microsoft", once, clock.now + 1);
  const otherKey = await C.signInRenew(ask, OTHER, "microsoft", fresh({}), clock.now + 2);
  const otherPerson = await C.signInRenew(ask, LEAD, "microsoft", fresh({ sub: "someone-else" }), clock.now + 3);
  const old = await C.signInRenew(ask, LEAD, "microsoft", fresh({ iat: clock.now - 11 * MIN }), clock.now + 4);
  const r = [first.ok ? "ok" : first.reason, twice.reason, otherKey.reason, otherPerson.reason, old.reason];
  return { ok: first.ok === true && r.slice(1).every((x) => x === "signin-token"), said: r.join(" ") };
});

await leg("sr5", "a desk signs its person in to the service itself: seated, with a certificate the lead's Studio takes for the licence its own sign-in kept; its nonce-less renewal is accepted for its own key and refused for another desk's; a forged certificate, another desk's and another licence's are refused by Studio", async () => {
  const deskPair = crypto.generateKeyPairSync("ed25519"), deskPub = keyOf(deskPair.privateKey).public;
  const otherPair = crypto.generateKeyPairSync("ed25519"), otherPub = keyOf(otherPair.privateKey).public;
  const desk = Engine.deskRules().branchIdOf(deskPub), otherId = Engine.deskRules().branchIdOf(otherPub);
  /* The desk's own call (the interface of 2026-11-12), as the desk's door sends it: signed by the desk's key over signinDeskBytes. */
  const deskCall = async (tok, pair, seed) => {
    const pub = keyOf(pair.privateKey).public, t = clock.now;
    const body = Object.assign({ provider: "microsoft", idToken: tok, desk: pub, t,
      sig: crypto.sign(null, Buffer.from(Q.signinDeskBytes({ provider: "microsoft", tokenHash: await Q.tokenHash(tok), desk: pub, t })), pair.privateKey).toString("hex") },
      seed ? { seed } : {});
    return JSON.parse(Buffer.from((await ask("signin/desk", Buffer.from(JSON.stringify(body)))).bytes).toString("utf8"));
  };
  const seed = crypto.randomBytes(32).toString("hex");
  const first = await deskCall(idToken({ sub: "desk-person", nonce: await Q.signinNonce(deskPub, seed) }), deskPair, seed);
  clock.now += 5 * MIN;
  const renewal = await deskCall(idToken({ sub: "desk-person" }), deskPair);
  const elsewhere = await deskCall(idToken({ sub: "desk-person" }), otherPair);
  const seat = db.raw.prepare("SELECT proved_at FROM seats WHERE kind = 'desk' ORDER BY rowid LIMIT 1").get();
  /* What the lead's Studio makes of the seat.json the desk writes. */
  const cert = renewal.certificate || {};
  const take = (doc, o) => D.checkSeat(doc, Object.assign({ desk, deskKey: deskPub, ref: st.licenceRef, now: clock.now, trustedKey: ROOTK.public }, o || {}));
  const taken = take({ format: 2, desk, certificate: cert });
  const forged = take({ format: 2, desk, certificate: Object.assign({}, cert, { person: "00".repeat(32) }) });
  const asOther = take({ format: 2, desk: otherId, certificate: cert }, { desk: otherId, deskKey: otherPub });
  const otherRef = take({ format: 2, desk, certificate: cert }, { ref: "7c".repeat(16) });
  const firstOk = first.ok === true && !!first.certificate, renewOk = renewal.ok === true && !!renewal.certificate;
  return { ok: firstOk && renewOk && elsewhere.ok === false && elsewhere.reason === "token" && !!seat && seat.proved_at === clock.now
    && taken.ok === true && taken.person === cert.person && forged.why === "sig" && asOther.why === "desk" && otherRef.why === "licence",
    said: ["first:" + (firstOk ? "certified" : first.reason), "renewal:" + (renewOk ? "certified" : renewal.reason), "other-desk:" + (elsewhere.ok ? "ACCEPTED" : elsewhere.reason),
      "studio:" + (taken.ok ? "taken" : taken.why), "forged:" + forged.why, "as-other:" + asOther.why, "other-ref:" + otherRef.why].join(" ") };
});

await leg("sr6", "the provider refusing while the proof is only due changes nothing: the check's answer stands and the seal is kept", async () => {
  provider.refuse = true;
  clock.now = leadSeat().proved_at + 26 * DAY;
  const a = await C.quietCheck(ask, LEAD, clock.now);
  const before = JSON.stringify(st);
  const after = await C.afterCheck(io, MS, a, st, LEAD, () => clock.now);
  const ok = a.ok === true && a.proof === "due" && after.answer === a && JSON.stringify(after.state) === before;
  st = after.state;
  /* The shell takes the check's own answer, as it would any ok check. */
  if (after.answer.ok === true) await C.take(after.answer, ctx());
  return { ok, said: [a.ok ? "ok" : a.reason, "proof:" + a.proof, after.answer === a ? "check-taken" : "OTHER", JSON.stringify(after.state) === before ? "unchanged" : "CHANGED"].join(" ") };
});

await leg("sr7", "at day 30 the check answers \"signin\", the seat stops counting (a colleague refused a minute before takes it now), the seal is forgotten and the cover asks the lead, the licence file where it was and active", async () => {
  const proved = leadSeat().proved_at;
  licenceBytes = fs.existsSync(ctx().licenceFile) ? fs.readFileSync(ctx().licenceFile, "utf8") : "";
  clock.now = proved + 30 * DAY - MIN;
  const before = await seatsListed();
  const colleagueBefore = await colleagueSignsIn();
  clock.now = proved + 30 * DAY;
  const a = await C.quietCheck(ask, LEAD, clock.now);
  const after = await C.afterCheck(io, MS, a, st, LEAD, () => clock.now);
  /* The lapsed owner lists nothing now (seat/list needs a proved seat), so the count is read as the service's seatCounts reads it. */
  const ownerList = await seatsListed();
  const counted = db.raw.prepare("SELECT COUNT(*) AS n FROM seats s JOIN licences l ON l.id = s.licence WHERE s.licence = ? AND s.kind = 'lead' "
    + "AND s.seen_at > ? - l.grace_days * ? AND s.proved_at > ?").get(LICENCE_ID, clock.now, DAY, clock.now - 30 * DAY).n;
  clock.now += MIN;
  const colleagueAfter = await colleagueSignsIn();
  const file = fs.existsSync(ctx().licenceFile) ? fs.readFileSync(ctx().licenceFile, "utf8") : "";
  const kept = await L.licenceState(L.readLicenceFile(ctx().licenceFile), { file: ctx().licenceFile, trustedKey: ROOTK.public, now: new Date(clock.now).toISOString() });
  return { ok: before === 1 && a.ok === false && a.reason === "signin" && after.answer.reason === "signin-ask" && after.state.signinAsk === true
    /* No licence file is there to stay, since the licence file goes as an everyday entitlement (Max, 2026-11-22 15:37); it was the file where it was, and active. */
    && after.state.refreshSealed === undefined && after.state.by === "signin" && counted === 0 && ownerList === "none" && file === licenceBytes && file === ""
    && kept.status === "none" && colleagueBefore.reason === "signin-full" && colleagueAfter.ok === true,
  said: ["counted-before:" + before, "check:" + (a.ok ? "ok" : a.reason), "after:" + after.answer.reason, "ask:" + after.state.signinAsk,
    "seal:" + (after.state.refreshSealed === undefined ? "forgotten" : "KEPT"), "counted:" + counted, "owner-list:" + ownerList, "licence-file:" + (file === licenceBytes ? "unchanged" : "CHANGED"),
    "licence:" + kept.status, "colleague-before:" + (colleagueBefore.ok ? "SEATED" : colleagueBefore.reason), "colleague-after:" + (colleagueAfter.ok ? "seated" : colleagueAfter.reason)].join(" ") };
});

await leg("sr8", "the shell's own check runs the client's afterCheck before it takes anything", async () => {
  const main = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  const at = main.indexOf("async function licenceStep("), step = main.slice(at, main.indexOf("\n}\n", at));
  const call = step.indexOf("C.afterCheck(await signInIo(), C.providerOf(st.provider), a, readServiceState(), open, Date.now)");
  const write = step.indexOf("writeServiceState(after.state);"), take = step.indexOf("C.take(");
  return { ok: at > 0 && call > 0 && write > call && take > write, said: "order " + [call, write, take].join("<") };
});

await leg("sr9", "the root's revoked keys' list a check answers is kept through a renewal and through a lapse: a proof \"due\" renewed, and a \"signin\" the provider will not renew", async () => {
  const revFile = L.revokedFileFor(ctx().licenceFile);
  const newPub = () => keyOf(crypto.generateKeyPairSync("ed25519").privateKey).public;
  const listOf = (serial, keys) => L.createTestRevocations({ keys, serial }, ROOTK.privateKey, "etiuda-root-test");
  const keptSerial = () => { const r = L.readRevocations(revFile, ROOTK.public); return r ? r.serial : 0; };
  /* The lead's seat lapsed at sr7 and the provider still refuses: the check's "signin" carries the list, and so does what afterCheck answers. */
  const first = listOf(1, [newPub()]);
  env.REVOKED = JSON.stringify(first);
  const lapsedCheck = await C.quietCheck(ask, LEAD, clock.now);
  const lapsedAfter = await C.afterCheck(io, MS, lapsedCheck, st, LEAD, () => clock.now);
  const lapsedGot = await C.take(lapsedAfter.answer, ctx());
  const afterLapse = keptSerial();
  /* The colleague holds the seat now; at day 26 its proof is due and the provider renews it: the renewal's answer keeps the list. */
  provider.refuse = false;
  provider.refresh.set("rt-colleague", "colleague-person");
  const cst = { by: "signin", provider: "microsoft", lead: COLLEAGUE.public, refreshSealed: C.sealRefresh(vault, "rt-colleague") };
  clock.now += 26 * DAY;
  env.REVOKED = JSON.stringify(listOf(2, first.keys.concat(newPub())));
  const dueCheck = await C.quietCheck(ask, COLLEAGUE, clock.now);
  const dueAfter = await C.afterCheck(io, MS, dueCheck, cst, COLLEAGUE, () => clock.now);
  const dueGot = await C.take(dueAfter.answer, Object.assign(ctx(), { lead: COLLEAGUE.public }));
  delete env.REVOKED;
  return { ok: lapsedCheck.ok === false && lapsedCheck.reason === "signin" && lapsedAfter.answer.reason === "signin-ask" && lapsedGot.revoked === "kept" && afterLapse === 1
    && dueCheck.ok === true && dueCheck.proof === "due" && dueAfter.answer.ok === true && dueAfter.answer !== dueCheck && dueGot.revoked === "kept" && keptSerial() === 2,
    said: ["lapse:" + (lapsedCheck.ok ? "ok" : lapsedCheck.reason) + "/" + lapsedAfter.answer.reason + "/" + lapsedGot.revoked + "/serial " + afterLapse,
      "due:" + (dueCheck.ok ? dueCheck.proof : dueCheck.reason) + "/" + (dueAfter.answer.ok ? "renewed" : dueAfter.answer.reason) + "/" + dueGot.revoked + "/serial " + keptSerial()].join(" ") };
});

/* ---- A STUDIO JUDGED AS A DESK IS, BY ITS PERSON (Claude alpha's ruling of 20:47 on C1) ------------------------------------------
   An Entra licence (its seats follow the tenant's app roles) for a second tenant: a lead with Etiuda.Lead signs in through Studio's client
   naming its member key, keeps both certificates, and opens its team's relay session (src/relay.mjs leadChannel, and the states session)
   on the pinned relay with the lead one; the member key's opens as an enrolled teammate's; the role removed, the renewal answers no-role,
   which the client keeps, and once a colleague has proved past the lead's certificate its sessions are refused; Account's words are the
   desk's, in both languages. */
const TENANT2 = "bbbbcccc-1111-dddd-2222-eeee3333ffff";
const ORG2 = crypto.createHmac("sha256", Buffer.from(env.HASH_KEY, "hex")).update("etiuda-licence-org\nmicrosoft\n" + TENANT2).digest("hex");
const ENTRA_ID = Number(db.raw.prepare("INSERT INTO licences (key_hash, email_hash, org, seats, updates_until, paid_until, lead_seats, seat_source) VALUES (?, ?, ?, ?, ?, ?, ?, 'entra')")
  .run(crypto.randomBytes(32).toString("hex"), "unused", "Entra Tools", 5, "2027-11-12", T0 + 365 * DAY, 2).lastInsertRowid);
db.raw.prepare("INSERT INTO admits (licence, provider, org) VALUES (?, ?, ?)").run(ENTRA_ID, "microsoft", ORG2);
const ELEAD = keyOf(crypto.generateKeyPairSync("ed25519").privateKey), EMEMBER = keyOf(crypto.generateKeyPairSync("ed25519").privateKey);
const branchId = (pub) => "k-" + sha(Buffer.from(pub, "hex")).slice(0, 16);
const R2 = (() => {
  const req = module.createRequire(import.meta.url);
  return { stand: req(path.join(ROOT, "engine", "pinned", "relay", "test", "stand-ins.cjs")), core: req(path.join(ROOT, "engine", "pinned", "relay", "core.cjs")) };
})();
const RW = await import(pathToFileURL(path.join(ROOT, "engine", "pinned", "relay", "worker.mjs")).href);
/* Whether the pinned relay knows the member mark the service now signs on a Studio's member certificate (its certBytes signs the line
   "member", the engine's relay part C). Before it, a relay that checks seats refuses a marked certificate as shape, which is why the
   service's mark lands with the pin that carries it; the member sessions below say which they met. */
const PIN_MEMBER = (() => { try { const c = { format: 1, licence: "a", desk: "b", person: "c", code: "d", issued: 1, until: 2, sig: { keyId: "k" } };
  return Buffer.compare(Buffer.from(R2.core.certBytes(Object.assign({ member: true }, c))), Buffer.from(R2.core.certBytes(c))) !== 0; } catch { return false; } })();
/* A member certificate as the service signs one: marked, for `pub`, its signature holding over requests.mjs seatCertBytes under the delegated key. */
const markedFor = (c, pub) => { try { return !!c && c.member === true && c.desk === pub && crypto.verify(null, Buffer.from(Q.seatCertBytes(c)),
  crypto.createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(c.via.key.pub, "hex")]), format: "der", type: "spki" }),
  Buffer.from(String(c.sig.value), "hex")); } catch { return false; } };
/* A member session at the pinned relay: opened where the pin knows the mark, refused where it does not. */
const memberSessionAsPinned = (status) => (PIN_MEMBER ? status === 200 : status !== 200);
const Rl = await import(pathToFileURL(path.join(ROOT, "src", "relay.mjs")).href);
const relay = R2.stand.relayEnv({ roots: [ROOTK.public] });
const relayW = RW.routeWith([ROOTK.public], (e) => e.NOW());
const relayReq = async (method, url, headers, body) => {
  relay.clock.now = clock.now;
  const res = await relayW.fetch(new Request(url, { method, headers, body: method === "GET" ? undefined : body, duplex: "half" }), relay.env);
  return { status: res.status, header: (n) => res.headers.get(n), bytes: Buffer.from(await res.arrayBuffer()) };
};
const RELAY_URL = "https://relay.test/relay/v1";
const RT = crypto.randomBytes(16).toString("hex");
const eopen = { keyId: keyId(ELEAD), public: ELEAD.public, privateKey: ELEAD.privateKey };
const postRelay = (rel, json) => relayReq("POST", RELAY_URL + rel, { "content-type": "application/json" }, Buffer.from(JSON.stringify(json)));
let est = null, egrant = null;
/* Studio's client asks no access token yet (section 11.11 is the service's half), so this stands in for its managed sign-in: the body
   C.signIn sends, with the service's access token and the managed bytes the service then verifies, the member key on both. */
const managedAsk = (key, sub, roles) => async (route, bytes) => {
  const b = JSON.parse(Buffer.from(bytes).toString("utf8"));
  if (route !== "signin" && route !== "signin/renew") return ask(route, bytes);
  b.accessToken = accessToken({ sub, tid: TENANT2, roles });
  const f = { provider: b.provider, tokenHash: await Q.tokenHash(b.idToken), accessHash: await Q.tokenHash(b.accessToken), lead: b.lead, t: b.t, member: b.member };
  b.sig = crypto.sign(null, Buffer.from(route === "signin" ? Q.signinManagedBytes(f) : Q.signinRenewManagedBytes(f)), key.privateKey).toString("hex");
  return ask(route, Buffer.from(JSON.stringify(b)));
};
const eSignIn = async (roles) => {
  const seed = crypto.randomBytes(32).toString("hex");
  return C.signIn(managedAsk(ELEAD, "entra-lead", roles), ELEAD, "microsoft", idToken({ sub: "entra-lead", tid: TENANT2, nonce: await Q.signinNonce(ELEAD.public, seed) }), clock.now, seed, EMEMBER.public);
};
/* What C.signIn itself sends: the member key in the body and as the last line its signature covers. */
const signInSent = async () => {
  let sent = null;
  const seed = crypto.randomBytes(32).toString("hex"), tok = idToken({ sub: "entra-lead", tid: TENANT2, nonce: await Q.signinNonce(ELEAD.public, seed) });
  await C.signIn(async (route, bytes) => { sent = JSON.parse(Buffer.from(bytes).toString("utf8")); return { status: 403, bytes: Buffer.from('{"ok":false,"reason":"token"}') }; }, ELEAD, "microsoft", tok, clock.now, seed, EMEMBER.public);
  const signed = !!sent && crypto.verify(null, Buffer.from(Q.signinBytes({ provider: "microsoft", tokenHash: await Q.tokenHash(tok), lead: ELEAD.public, t: sent.t, member: EMEMBER.public, seed })),
    crypto.createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(ELEAD.public, "hex")]), format: "der", type: "spki" }), Buffer.from(sent.sig, "hex"));
  return !!sent && sent.member === EMEMBER.public && signed;
};
await leg("sr10", "an Entra lead signs in naming its member key: the client keeps its lead seat's certificates for its signing key, which the pinned relay's certWhy takes, and for its member key, marked member and signed so, and a check's answer leaves them", async () => {
  clock.now = T0 + 40 * DAY;
  const a = await eSignIn(["Etiuda.Lead"]);
  const sentMember = await signInSent();
  est = Object.assign({ by: "signin", provider: "microsoft" }, C.keepWho({}, a));
  egrant = a.grant;
  const ref = est.seatCerts && est.seatCerts.lead ? est.seatCerts.lead.licence : "";
  const holds = (c, pub) => !!c && R2.core.certWhy(c, pub, [ref], clock.now, [ROOTK.public]) === null;
  return { ok: a.ok === true && holds(est.seatCerts.lead, ELEAD.public) && est.seatCerts.lead.member === undefined && markedFor(est.seatCerts.member, EMEMBER.public) && !!egrant && !!egrant.seats && !!C.keepWho(est, { ok: true, me: est.signinCode }).seatCerts && sentMember,
    said: [a.ok ? "ok" : a.reason, est.seatCerts ? Object.keys(est.seatCerts).join("+") : "none", "grant seats:" + !!(egrant && egrant.seats)].join(" ") };
});
/* A MEMBER CERTIFICATE ANSWERED ALONE (design note C-0, point 2; C-1): on an ordinary licence or a trial the service answers the member
   key's certificate and none for the signing key. The client keeps it, replacing an older licence's pair whole, so no lead certificate
   of a licence left behind is presented after it; an answer carrying none leaves what is held. On that holding the shell's seatCertNow
   (restated here, held to the shell's text) gives the member channel that certificate and the lead's channel none, and the lead's
   states session then sends no seat and does not throw. */
await leg("sr10b", "a lead on an ordinary trial signs in naming its member key: the client keeps the member certificate answered alone, which replaces an older licence's pair whole, and an answer naming none leaves it; on that holding the member channel's seat is that certificate, the lead's is none, and the lead's session sends no seat", async () => {
  const OL = keyOf(crypto.generateKeyPairSync("ed25519").privateKey), OM = keyOf(crypto.generateKeyPairSync("ed25519").privateKey);
  const seed = crypto.randomBytes(32).toString("hex"), tid = "ddddeeee-4444-ffff-5555-aaaa6666bbbb";
  const a = await C.signIn(ask, OL, "microsoft", idToken({ sub: "ordinary-lead", tid, nonce: await Q.signinNonce(OL.public, seed) }), clock.now, seed, OM.public);
  const m = a.certificates && a.certificates.member;
  /* Beside the member certificate the Studio's own for its signing key since review xi (Max, 2026-11-22 15:37); it was the member's alone. */
  const answered = a.ok === true && !!a.trial && !!m && Object.keys(a.certificates).sort().join() === "member,studio" && markedFor(m, OM.public)
    && a.certificates.studio.desk === OL.public;
  const before = { by: "signin", provider: "microsoft", seatCerts: { lead: est.seatCerts.lead, member: est.seatCerts.member } };
  const held = C.keepWho(before, a);
  const whole = !!held.seatCerts && Object.keys(held.seatCerts).sort().join() === "member,studio" && JSON.stringify(held.seatCerts.member) === JSON.stringify(m);
  const left = JSON.stringify(C.keepWho(held, { ok: true, me: a.me }).seatCerts) === JSON.stringify(held.seatCerts)
    && JSON.stringify(C.keepWho(before, { ok: true, me: a.me }).seatCerts) === JSON.stringify(before.seatCerts);
  /* The shell's reader, as shell/main.js states it: the same three lines, or this restatement proves nothing. */
  const SEAT_NOW = 'function seatCertNow(which) {\n  const st = readServiceState(), c = st.by === "signin" && st.seatCerts ? st.seatCerts[which] : null;\n  return c && typeof c === "object" ? c : null;\n}';
  const shellSays = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8").replace(/\r\n/g, "\n").indexOf(SEAT_NOW) >= 0;
  const seatCertNow = (which) => { const st = held, c = st.by === "signin" && st.seatCerts ? st.seatCerts[which] : null; return c && typeof c === "object" ? c : null; };
  const bodies = [];
  const fakeRelay = async (method, url, headers, body) => {
    if (/\/hello$/.test(url)) return { status: 200, bytes: Buffer.from(JSON.stringify({ challenge: "ab".repeat(16) })) };
    if (/\/session$/.test(url)) { bodies.push(JSON.parse(Buffer.from(body).toString("utf8"))); return { status: 200, bytes: Buffer.from(JSON.stringify({ session: "cd".repeat(32) })) }; }
    return { status: 404, bytes: Buffer.from("{}") };
  };
  const session = await Rl.leadSession({ request: fakeRelay, url: RELAY_URL, rt: RT, open: eopen, seat: () => seatCertNow("lead") });
  const leadBare = session === "cd".repeat(32) && bodies.length === 1 && !("seat" in bodies[0]);
  return { ok: answered && whole && left && shellSays && seatCertNow("member") === held.seatCerts.member && seatCertNow("lead") === null && leadBare,
    said: [a.ok ? "ok" : a.reason, a.certificates ? Object.keys(a.certificates).join("+") : "none", "held " + (held.seatCerts ? Object.keys(held.seatCerts).join("+") : "none"),
      "left " + left, "shell " + shellSays, "lead session " + (leadBare ? "no seat" : JSON.stringify(bodies[0] && Object.keys(bodies[0])))].join(" ") };
});
/* THE MEMBER SLOT TAKES ONLY A MARKED CERTIFICATE (the addendum on the member certificate, point 1; the test architect's check 3): a plain
   seat certificate, as a desk's is, answered as a member's is not kept, alone or beside a lead certificate; a marked one is. */
await leg("sr10c", "Studio's client keeps a member-slot certificate only where it carries the member mark: a desk's certificate answered as a member's is dropped, alone or beside a lead one; the marked one is kept", async () => {
  const marked = est.seatCerts.member, plain = Object.assign({}, marked);
  delete plain.member;
  const alone = C.keepWho({ by: "signin", provider: "microsoft" }, { ok: true, me: est.signinCode, certificates: { member: plain } });
  const beside = C.keepWho({ by: "signin", provider: "microsoft" }, { ok: true, me: est.signinCode, certificates: { lead: est.seatCerts.lead, member: plain } });
  const kept = C.keepWho({ by: "signin", provider: "microsoft" }, { ok: true, me: est.signinCode, certificates: { member: marked } });
  const keys = (s) => (s.seatCerts ? Object.keys(s.seatCerts).join("+") : "none");
  return { ok: markedFor(marked, EMEMBER.public) && alone.seatCerts === undefined && keys(beside) === "lead" && keys(kept) === "member" && kept.seatCerts.member === marked,
    said: ["alone " + keys(alone), "beside " + keys(beside), "marked " + keys(kept)].join(" ") };
});
await leg("sr11", "its team on the pinned relay: Studio's lead channel and its states session open with the lead certificate and are refused without, and the member key's session, its certificate marked, opens as a teammate's where the pin knows the mark (a following Studio's key taken at a hello like a desk's: the known limit until the enrolment can name Studios' keys) and is refused where it does not", async () => {
  const t = clock.now;
  const made = await postRelay("/teams", { rt: RT, lead: { keyId: eopen.keyId, pub: ELEAD.public }, t, grant: egrant,
    sig: crypto.sign(null, R2.core.create2Bytes(RT, eopen.keyId, t, egrant), ELEAD.privateKey).toString("hex") });
  const keys = [{ id: branchId(EMEMBER.public), pub: EMEMBER.public, desk: branchId(EMEMBER.public) }];
  const enrol = await postRelay("/t/" + RT + "/devices", { keys, rev: 1, t, sig: crypto.sign(null, R2.core.devicesBytes(RT, 1, t, keys), ELEAD.privateKey).toString("hex") });
  const mirror = path.join(SCRATCH, "entra-lead");
  fs.mkdirSync(mirror, { recursive: true });
  const told = [];
  const channel = (seat) => Rl.leadChannel({ rt: RT, url: RELAY_URL, mirror, team: "t-entra", lead: { keyId: eopen.keyId, public: ELEAD.public },
    open: () => eopen, agree: () => null, box: () => "", keyFor: () => null, sealEpoch: () => 1, inviteKeys: () => [], connect: () => null,
    request: relayReq, clock: () => clock.now, watch: false, pollMs: 1e9, seat, seatRenew: async () => {}, onSeat: (s) => told.push(s) });
  const withSeat = channel(() => est.seatCerts.lead), without = channel(() => null);
  withSeat.start(); await withSeat.idle(); const opened = withSeat.online(); await withSeat.stop();
  without.start(); await without.idle(); const bare = without.online(); await without.stop();
  const states = await Rl.leadSession({ request: relayReq, url: RELAY_URL, rt: RT, open: eopen, seat: () => est.seatCerts.lead });
  const statesBare = await Rl.leadSession({ request: relayReq, url: RELAY_URL, rt: RT, open: eopen });
  const ch = await postRelay("/t/" + RT + "/hello", {});
  const challenge = JSON.parse(ch.bytes.toString("utf8")).challenge;
  const mid = branchId(EMEMBER.public);
  const member = await postRelay("/t/" + RT + "/session", { challenge, key: mid, pub: EMEMBER.public, seat: est.seatCerts.member,
    sig: crypto.sign(null, R2.core.helloBytes(RT, challenge, mid), EMEMBER.privateKey).toString("hex") });
  return { ok: made.status === 200 && enrol.status === 200 && opened && !bare && told.indexOf("refused") >= 0 && /^[0-9a-f]{64}$/.test(states) && statesBare === "" && memberSessionAsPinned(member.status),
    said: ["made " + made.status, "lead channel " + opened + "/" + bare, "states " + (states ? "session" : "none") + "/" + (statesBare ? "session" : "none"), "member " + member.status, "pin knows the mark " + PIN_MEMBER].join(" ") };
});
await leg("sr12", "the role removed: the renewal answers no-role, which the client keeps; once a colleague proved past the lead's certificate, its sessions are refused; Account says it in the desk's words, Polish too", async () => {
  /* The provider renews the refresh token with a token that no longer carries the role. */


  const after2 = await C.afterCheck(Object.assign({}, io, { ask: managedAsk(ELEAD, "entra-lead", undefined), member: () => EMEMBER.public, tokenAsk: async (url, form) => {
    const fm = new URLSearchParams(Buffer.from(form).toString("utf8"));
    if (fm.get("grant_type") !== "refresh_token") return tokenAsk(url, form);
    return { status: 200, bytes: Buffer.from(JSON.stringify({ token_type: "Bearer", id_token: idToken({ sub: "entra-lead", tid: TENANT2 }), refresh_token: "rt-entra-2" })) };
  } }), MS, { ok: true, proof: "due" }, Object.assign({}, est, { refreshSealed: C.sealRefresh(vault, "rt-entra") }), ELEAD, () => clock.now);
  const lost = after2.state;
  clock.now = est.seatCerts.lead.until + 61 * MIN;
  const seed = crypto.randomBytes(32).toString("hex"), CO = keyOf(crypto.generateKeyPairSync("ed25519").privateKey), COM = keyOf(crypto.generateKeyPairSync("ed25519").privateKey);
  const co = await C.signIn(managedAsk(CO, "entra-colleague", ["Etiuda.Lead"]), CO, "microsoft", idToken({ sub: "entra-colleague", tid: TENANT2, nonce: await Q.signinNonce(CO.public, seed) }), clock.now, seed, COM.public);
  /* The colleague's proof reaches the relay through a session of theirs: their member key's, its certificate marked, where the pin knows the
     mark; where it does not, their Studio key's with its unmarked lead certificate, which moves the same evidence. */
  const [CK, coCert] = PIN_MEMBER ? [COM, co.certificates && co.certificates.member] : [CO, co.certificates && co.certificates.lead];
  const cm = branchId(CK.public), t2 = clock.now;
  const keys2 = [{ id: branchId(EMEMBER.public), pub: EMEMBER.public, desk: branchId(EMEMBER.public) }, { id: cm, pub: CK.public, desk: cm }];
  await postRelay("/t/" + RT + "/devices", { keys: keys2, rev: 2, t: t2, sig: crypto.sign(null, R2.core.devicesBytes(RT, 2, t2, keys2), ELEAD.privateKey).toString("hex") });
  const hc = JSON.parse((await postRelay("/t/" + RT + "/hello", {})).bytes.toString("utf8")).challenge;
  const ch = await postRelay("/t/" + RT + "/session", { challenge: hc, key: cm, pub: CK.public, seat: coCert, sig: crypto.sign(null, R2.core.helloBytes(RT, hc, cm), CK.privateKey).toString("hex") });
  const refused = await Rl.leadSession({ request: relayReq, url: RELAY_URL, rt: RT, open: eopen, seat: () => est.seatCerts.lead });
  const appText = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8"), lang = fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8");
  const words = ["Your organisation no longer gives this account access to Etiuda.", "This account's sign-in needs renewing."];
  const pl = ["Organizacja nie przyznaje już temu kontu dostępu do Etiudy.", "Logowanie tego konta wymaga odnowienia."];
  const shell = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8"), mem = fs.readFileSync(path.join(ROOT, "src", "member.mjs"), "utf8");
  const wired = /seat: \(\) => seatCertNow\("lead"\)/.test(shell) && /seat: \(\) => seatCertNow\("member"\)/.test(shell) && /seat: x\.seat, seatRenew: x\.seatRenew/.test(mem)
    && /relaySeat: st\.by === "signin" && relaySeatRefused\.size \? \(st\.signinNoRole === true \? "removed" : "renew"\)/.test(shell);
  return { ok: lost.signinNoRole === true && co.ok === true && ch.status === 200 && refused === "" && words.every((w) => appText.indexOf(w) > 0 && lang.indexOf(w) > 0) && pl.every((w) => lang.indexOf(w) > 0) && wired,
    said: ["renewal " + (after2.answer.ok ? "ok" : after2.answer.reason), "noRole " + lost.signinNoRole, "colleague " + (co.ok ? "ok" : co.reason), "colleague session " + ch.status,
      "lead session " + (refused ? "opened" : "refused"), "wired " + wired].join(" ") };
});

/* ---- planted faults, each in a scratch copy ------------------------------------------------------------------------ */
if (!ONLY) {
  copyPlants({ root: ROOT, self: SELF, label: "signin-renewal", onlyVar: "SIGNIN_RENEWAL_ONLY",
    check: (ok, line) => check("plants", ok, line), skip, plants: [
      { mark: "h-due", leg: "sr3", rel: "src/licence-client.mjs", line: "  const due = false;" },
      { mark: "h-renew-body", leg: "sr3", rel: "src/licence-client.mjs", line: '  const a = await call(ask, "signin", Object.assign({ provider: String(provider), idToken: String(idToken), lead, t,' },
      { mark: "c1-keep-certs", leg: "sr10", rel: "src/licence-client.mjs", line: "  void certs;" },
      { mark: "c1-member-alone", leg: "sr10b", rel: "src/licence-client.mjs", line: "  if (!lead) return null;" },
      { mark: "c1-member-mark", leg: "sr10c", rel: "src/licence-client.mjs", line: "  const lead = one(c.lead), member = one(c.member);" },
      { mark: "c1-certs-whole", leg: "sr10b", rel: "src/licence-client.mjs", line: "  const certs = seatCertsOf(a.certificates) && Object.assign({}, st.seatCerts, seatCertsOf(a.certificates));" },
      { mark: "c1-lead-seat", leg: "sr11", rel: "src/relay.mjs", line: "    });" },
      { mark: "c1-states-seat", leg: "sr11", rel: "src/relay.mjs", line: "      { challenge, key, pub: o.open.public, sig: signHex(o.open, C.helloBytes(o.rt, challenge, key)) });" },
      { mark: "c1-no-role", leg: "sr12", rel: "src/licence-client.mjs", line: "  void r;" },
      { mark: "h-lapsed", leg: "sr7", rel: "src/licence-client.mjs", line: "  const lapsed = false;" },
      { mark: "h-forget", leg: "sr7", rel: "src/licence-client.mjs", line: "  void next;" },
      { mark: "a1-keep-ref", leg: "sr1", rel: "src/licence-client.mjs", line: "  void a.ref;" },
      { mark: "desk-renew-held", leg: "sr5", rel: "service/licence/core.mjs", line: "        void held;" },
      { mark: "a1-sig", leg: "sr5", rel: "src/desk-seat.mjs", line: "  void good;" },
      { mark: "a1-desk", leg: "sr5", rel: "src/desk-seat.mjs", line: "  void rosterKey;" },
      { mark: "a1-ref", leg: "sr5", rel: "src/desk-seat.mjs", line: "  void x.ref;" },
      { mark: "h-revoked", leg: "sr9", rel: "src/licence-client.mjs", line: "  const withRevoked = (x) => x;" },
      { mark: "client-revoked-refusal", leg: "sr9", rel: "src/licence-client.mjs", line: "  void json;" },
      { mark: "client-take-refusal", leg: "sr9", rel: "src/licence-client.mjs", line: "  if (!a || a.ok !== true) return out;" },
    ] });
}

dropScratch(SCRATCH, "signin-renewal");
console.log("#counts checks=" + asserted + " failed=" + failed + " expected=" + (ONLY ? 1 : EXPECTED));
if (!ONLY && asserted !== EXPECTED) { console.log("SUITE DID NOT COMPLETE: " + asserted + " of " + EXPECTED + " checks ran"); failed++; }
console.log("signin-renewal: " + asserted + " assertion(s), " + failed + " failure(s)");
process.exit(Math.min(failed, 63));
