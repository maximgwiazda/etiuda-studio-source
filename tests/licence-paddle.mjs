/* THE PAYMENT ROUTE, IN NODE (the Paddle design of 2026-11-13, B1; Claude alpha's decision 45 and his four edits).
 *
 *     node tests/licence-paddle.mjs
 *
 * service/licence/core.mjs is run over the pinned engine's forms (worker.mjs RULES) against the stand-in D1 (tests/d1-stand-in.mjs)
 * and two fakes: Google's published keys, so a buyer signs in for real and holds a trial and a code, and Paddle's API, which
 * answers what each leg says Paddle holds and counts every call. No wrangler, no network, no Paddle account.
 *
 * THE CRITERION, the service's own: a customer who buys ends up, with no hand of ours, holding a licence Studio accepts; a payment
 * changes a licence only through what Paddle's API says when read back, each event applies once, and anything unclear is held for
 * Max and changes nothing.
 *
 * THE FAKE CATALOGUE is the ruled shape (decisions 2026-11-12 23:23 and line 172): three products, a lead's seat with Studio, a desk
 * seat on a team's licence and one person's desk licence, each monthly and yearly, six prices; amounts are Paddle's and never read.
 *
 *   P1  the signature: a one-byte change, a ts 301 s old or ahead, no header, an h1 of the wrong length are refused; 299 s passes;
 *       a rotation's two h1 pass with either valid, and fail with neither
 *   P2  the HMAC is over the raw body as Paddle sent it, its whitespace kept, never re-serialised
 *   P3  the doorbell: a signed body claiming 50 seats while the API says 2 gives 2; an API status "billed" writes nothing, 500
 *   P4  once: the same event twice, and two events for one transaction (one after the other, and at once), count seats once
 *   P5  a first purchase by a person in a trial: the paid licence admits their organisation and them, owned by them, the trial
 *       superseded, their seat and key moved; then the quiet check answers the paid licence, which Studio accepts
 *   P6  a team is its lead's own (decision 47, in place of decision 45's hold): a second buyer in the organisation makes a licence
 *       of their own, admitting them by name and no organisation, which their renewal raises, the first licence untouched; and
 *       a first purchase writes ORG_DESKS_DEFAULT as the owner's switch; two first buyers at once
 *       make one licence, the other held
 *   P7  a desk-only payment certifies its owner's desks alone, never a colleague's in the same organisation
 *   P8  a renewal extends paid_until to its period's end plus 14 days; a late older transaction never shortens it
 *   P9  subscription.updated alone changes no seats; a paid rise does, and a fall paid at renewal lands then
 *   P10 a scheduled cancel ends nothing early; subscription.canceled takes off its own seats alone, the date kept
 *   P11 a pending or partial refund changes nothing; a full approved one ends a sole-source licence, and on an invoiced licence it
 *       merely added to takes off its seats and is held; a refund of an older period is held
 *   P12 an unknown, missing or misshapen code writes no licence and answers 200, held
 *   P13 the route answers while the delegation is out of its window, where a signed route answers "unavailable"
 *   P14 the 64 KiB cap: a 60 KiB body is read, a 65 KiB one is refused with no more than the cap and a chunk read
 *   P15 Paddle's API answering 401, 503 or late, or unreachable: 500, and nothing written
 *   P16 an unsigned flood: no header, a wrong h1, a stale ts, a malformed header, a 10 MiB body: 401, with zero D1 calls and zero
 *       Paddle calls, and the 10 MiB body read to the cap at most, or not at all without a header
 *   P17 a shape the table does not name: no billing period, an origin outside the table, a one-time price item, a price id not
 *       in the map, a renewal or rise of a subscription never applied here, each held with nothing written
 *   P18 two sources over time on one licence (an invoice attached by hand and two subscriptions of its owner, the second bought after the first was cancelled): each cancel takes
 *       off its own, paid_until is the latest, and a full refund of one while another runs is held, not an ended licence
 *   P19 plants: each guarding line, planted out in a copy, turns its legs red; the real files are unchanged
 *   P20 every held outcome any leg provokes writes its event row and nothing else ("held" keeps one meaning; Claude alpha, 2026-11-13)
 *   P21 a held buyer Max attaches by hand with --paddle-sub is a known subscription: its renewal, rise and cancellation then apply
 *   P90 a subscription released by hand keeps the paid end --paid-until names (review 47, finding 8); a renewal settles a
 *       passed cancelled subscription before writing the new totals (finding 12)
 *   P91 a licence made by releasing a held subscription is a subscription-only licence as the route makes one (register 47.7, review 47 finding 7)
 *   P23 decision 48: a provider PAY_PROVIDERS does not name answers "not there", reading nothing; Paddle's old path is gone
 *   P22 a transaction completed at a total of zero (a full discount, a trial on a price) is applied and listed with its discount
 *   P18d after a refund of one source, no paid_until exceeds what the remaining sources cover; P18e nor does updates_until
 *   P26 a refund that arrives before its payment (Grok's review 6, finding 1): held "payment-unknown", and the payment, its adjustment
 *       read back, is held "refunded", for a renewal and for a first payment
 *   P27 seats are what the paid transaction billed (Grok's review 6, finding 2): a subscription raised beyond it, or a trialing item it
 *       did not bill, buys nothing more; a rise is held to what was held before plus what it billed
 *   P28 a sole subscription canceled keeps every seat to its own paid date (Grok's review 6, finding 4); bought again after it lapsed,
 *       the licence starts from the new seats
 *   P29 a completed transaction whose subscription reads past_due is retried (500) until active, never held (Grok's review 6, finding
 *       5B); a paused one is held
 *   P30 a licence its own subscription's refund ended is given back by that subscription's renewal of a later period, listed
 *       "restored" (Grok's review 6, finding 5C)
 *   P31 a rise in the same period leaves the period's own transaction the one a refund must match (Grok's review 6, finding 3)
 *   P32 the paid end (piece S-0): a subscription's licence states its period's end plus 14 days; inside them the check hands it and a
 *       paid grant, past them it answers ended "expired", and the renewal paid, the next check hands it again with the new end
 *   P37 a lead-only purchase is a valid licence: one seat stated, Studio taking it, the owner's desk on it (review 47, finding 3); the
 *       same after a desk subscription beside it is refunded
 *   P38 a later payment of a subscription not known here is retried while young and held "subscription-unknown" once a day old (finding 11)
 *   P39 an earlier renewal, delivered after a later one has raised the seats, changes no seat (review 4, finding 5)
 *   P40 a mid-period update adds a lead at once and keeps desks already paid until the renewal; a pure reduction in the
 *       period, a zero total included, waits the same way, and the renewal then takes the lower count (review 4, findings 10 and 6)
 *   P24 the organisation Paddle's order carries is judged and treated as Stripe's binding's (Grok's review 6, finding 5A): a bidirectional
 *       control, mark, separator, C1, U+FEFF or a name past 200 characters takes the default, listed "org-name"; a blank one the
 *       default unlisted; never held; an ordinary name with Polish letters is kept
 *   P43 only a paying subscription (active or trialing) blocks a second: with the other past_due or paused a new purchase applies; the old
 *       one recovering its payment beside the live new one is held "second-subscription", changes no seat, and the operator's listing shows it
 *   P44 a cancelled subscription's payment counts the items it held at its end, never ones removed earlier (register 47.13); P45 a delayed
 *       older period never lowers what a newer one bought (48.7)
 *   P42 the operator's listing (scripts/pay-held.mjs) shows a held notice by provider and event id, never an applied one, and refuses a limit outside 1 to 500
 *   P41 one subscription per licence (Max, 2026-11-19): a second subscription's first payment for a licence with a live one is held
 *       "second-subscription" and changes nothing; more seats as a change of quantity on the one subscription apply
 *   PY1 to PY3, what the buyer's own programs are told through Paddle (board 1020): "pays" with no portal; a second purchase one held
 *       entry of kind "already-pays"; Max's full refund at Paddle takes it off
 *
 * Exit: the number of failed checks, 78 when fewer checks ran than EXPECTED.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import module from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { standInD1 } from "./d1-stand-in.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { inForceCol } from "../service/licence/pay.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SERVICE = path.join(ROOT, "service", "licence");
const SCRATCH = path.join(ROOT, "scratch", "licence-paddle-legs");
const NL = "\n";
const EXPECTED = 216;

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
const RQ = await import(pathToFileURL(path.join(SERVICE, "requests.mjs")).href);
const AT = await import(pathToFileURL(path.join(SERVICE, "scripts", "attach-seats.mjs")).href);
const L = await import("../src/licence.mjs");
const FILES = ["core.mjs", "requests.mjs", "schema.sql", "pay.mjs", "pay-paddle.mjs", "pay-stripe.mjs", "attach.mjs", "erase.mjs"];
const realModules = async () => ({ core: await import(pathToFileURL(path.join(SERVICE, "core.mjs")).href), AT,
  held: await import(pathToFileURL(path.join(SERVICE, "scripts", "pay-held.mjs")).href),
  schema: fs.readFileSync(path.join(SERVICE, "schema.sql"), "utf8") });

const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + NL);
  else { failed++; process.stderr.write("  FAIL " + line + NL); }
}
function skip(line) { skipped++; process.stdout.write("  SKIP  " + line + NL); }

/* ---- keys, the provider, the catalogue ---------------------------------------------------------------------------- */

const HOUR = 3600000, DAY = 24 * HOUR;
const T0 = Date.UTC(2026, 10, 14, 9, 0, 0);
const sha = b => crypto.createHash("sha256").update(b).digest("hex");
function edKey() {
  const { privateKey } = crypto.generateKeyPairSync("ed25519");
  const pub = crypto.createPublicKey(privateKey).export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  return { pub, id: "studio-" + sha(Buffer.from(pub, "hex")).slice(0, 16), privateKey,
    der: privateKey.export({ type: "pkcs8", format: "der" }).toString("hex"),
    sign: bytes => crypto.sign(null, Buffer.from(bytes), privateKey).toString("hex") };
}
const ROOTK = edKey(), SERVICEK = edKey();
const delegation = o => L.createTestDelegation(Object.assign({ key: { id: SERVICEK.id, pub: SERVICEK.pub }, may: ["licence", "relay-grant"],
  from: T0 - 10 * DAY, until: T0 + 300 * DAY }, o || {}), ROOTK.privateKey, "etiuda-root-test");
const HASHK = crypto.randomBytes(32).toString("hex");
/* A person's own desk trial had (core.mjs DESK_TRIAL; board 1011), so a full licence of their organisation is a wait for them rather than their own
   fourteen days (core.mjs ownTrialFirst): the person as the service keys a Google account, HMAC-SHA-256 under HASH_KEY over its line, iss and sub. */
const deskTrialHad = (w, sub) => {
  const person = crypto.createHmac("sha256", Buffer.from(HASHK, "hex")).update("etiuda-licence-person\nhttps://accounts.google.com\n" + sub).digest("hex");
  w.db.raw.prepare("INSERT INTO licences (key_hash, email_hash, org, seats, updates_until, paid_until, refunded, trial_ends, trial_unit, owner, desk_only) "
    + "VALUES (?, 'signin:', 'Trial', 1, '2026-01-01', 0, 0, ?, ?, ?, 1)").run("signin:had:" + sub, w.clock.now - 1, "desk:" + person, person);
};
const hmacHex = (key, kind, value) => crypto.createHmac("sha256", Buffer.from(key, "hex")).update(kind + NL + value).digest("hex");
const ORG_ACME = hmacHex(HASHK, "etiuda-licence-org", "google" + NL + "acme.example");

const GOOGLE_CLIENT = "123456789012-a1b2c3d4e5f6g7h8.apps.googleusercontent.com";
const GOOGLE_JWKS = "https://www.googleapis.com/oauth2/v3/certs";
const RSA = (() => { const k = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 }); return { privateKey: k.privateKey, kid: "g-paddle-1",
  jwk: Object.assign(k.publicKey.export({ format: "jwk" }), { kid: "g-paddle-1", alg: "RS256", use: "sig" }) }; })();
const b64u = b => Buffer.from(b).toString("base64url");
function googleToken(clock, sub, nonce, hd) {
  const now = Math.floor(clock.now / 1000);
  const claims = { iss: "https://accounts.google.com", azp: GOOGLE_CLIENT, aud: GOOGLE_CLIENT, sub, iat: now, exp: now + 3600, nonce };
  if (hd) claims.hd = hd;
  const h = b64u(JSON.stringify({ alg: "RS256", kid: RSA.kid, typ: "JWT" })), p = b64u(JSON.stringify(claims));
  return h + "." + p + "." + b64u(crypto.sign("sha256", Buffer.from(h + "." + p), RSA.privateKey));
}

const pid = prefix => prefix + "_" + crypto.randomBytes(20).toString("hex").replace(/[^a-z0-9]/g, "").slice(0, 26).padEnd(26, "0");
const PRICE = { leadMonth: pid("pri"), leadYear: pid("pri"), deskMonth: pid("pri"), deskYear: pid("pri"), oneMonth: pid("pri"), oneYear: pid("pri") };
const PRICES = { [PRICE.leadMonth]: "lead", [PRICE.leadYear]: "lead", [PRICE.deskMonth]: "desk", [PRICE.deskYear]: "desk",
  [PRICE.oneMonth]: "desk-only", [PRICE.oneYear]: "desk-only" };
const CYCLE = p => (p === PRICE.leadMonth || p === PRICE.deskMonth || p === PRICE.oneMonth ? { interval: "month", frequency: 1 } : { interval: "year", frequency: 1 });
const SECRET = "pdl_ntfset_01jfakesecretforthelegsonly_" + crypto.randomBytes(12).toString("hex");
const API_KEY = "pdl_sdbx_apikey_01jfakelegkey_" + crypto.randomBytes(12).toString("hex");
const SANDBOX = "https://sandbox-api.paddle.com";

/* ---- Paddle's API, faked ------------------------------------------------------------------------------------------- */

function fakePaddle() {
  const st = { txns: new Map(), subs: new Map(), adjs: new Map(), calls: 0, mode: null, slowMs: 0, seen: [] };
  const json = (status, doc) => new Response(JSON.stringify(doc), { status, headers: { "content-type": "application/json" } });
  st.answer = async (url, init) => {
    st.calls++; st.seen.push(url);
    if (init.redirect !== "manual" || init.method !== "GET" || (init.headers || {}).authorization !== "Bearer " + API_KEY) return json(403, { error: { code: "forbidden" } });
    if (st.mode === "down") throw new TypeError("fetch failed");
    if (st.mode === "401") return json(401, { error: { type: "request_error", code: "authentication_malformed" } });
    /* A gateway's 503 whose body still reads as a document: a non-2xx is never taken as data. */
    if (st.mode === "503") { const t = st.txns.values().next().value; return json(503, { data: t || {} }); }
    if (st.slowMs) await new Promise(r => setTimeout(r, st.slowMs));
    const u = new URL(url);
    let m;
    if ((m = /^\/transactions\/(txn_[a-z0-9]{26})$/.exec(u.pathname))) return st.txns.has(m[1]) ? json(200, { data: st.txns.get(m[1]), meta: {} }) : json(404, { error: {} });
    if ((m = /^\/subscriptions\/(sub_[a-z0-9]{26})$/.exec(u.pathname))) return st.subs.has(m[1]) ? json(200, { data: st.subs.get(m[1]), meta: {} }) : json(404, { error: {} });
    if (u.pathname === "/adjustments" && u.searchParams.has("transaction_id")) {
      const t = u.searchParams.get("transaction_id");
      return json(200, { data: [...st.adjs.values()].filter(a => a.transaction_id === t), meta: {} });
    }
    if (u.pathname === "/adjustments") { const id = u.searchParams.get("id"); return json(200, { data: st.adjs.has(id) ? [st.adjs.get(id)] : [], meta: {} }); }
    return json(404, { error: {} });
  };
  return st;
}

/* ---- a world ------------------------------------------------------------------------------------------------------- */

let ipN = 0, tick = 0, AUDIT = [];
function world(K, o) {
  const opts = o || {};
  const clock = { now: opts.now || T0 };
  const db = standInD1(K.schema);
  const paddle = fakePaddle();
  const fetch = async (url, init) => {
    if (url === GOOGLE_JWKS) return new Response(JSON.stringify({ keys: [RSA.jwk] }), { status: 200, headers: { "content-type": "application/json", "cache-control": "max-age=3600" } });
    if (String(url).startsWith(SANDBOX + "/")) return paddle.answer(url, init);
    throw new Error("no fake answers " + url);
  };
  const service = K.core.makeService({ rules: W.RULES, roots: [ROOTK.pub], clock: () => clock.now, fetch, paddleTimeoutMs: 150 });
  const env = Object.assign({ DB: db, SERVICE_KEY: SERVICEK.der, DELEGATION: JSON.stringify(delegation()), HASH_KEY: HASHK,
    PROVIDERS: JSON.stringify([{ id: "google", clientId: GOOGLE_CLIENT }]), PADDLE_WEBHOOK_SECRET: SECRET, PADDLE_API_KEY: API_KEY,
    PADDLE_ENV: "sandbox", PADDLE_PRICES: JSON.stringify(PRICES), PAY_PROVIDERS: "paddle" }, opts.env || {});
  const w = { clock, db, paddle, env, service, AT: K.AT };
  w.call = async (route, body) => {
    const res = await service.fetch(new Request("https://licence.test/licence/v1/" + route, { method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "198.51.100." + (++ipN % 250) + "-" + ipN }, body: JSON.stringify(body) }), env);
    const text = await res.text();
    let parsed = null; try { parsed = JSON.parse(text); } catch { parsed = null; }
    return { status: res.status, body: parsed };
  };
  /* Paddle's notification: the raw text signed as Paddle signs it, or as `o` bends it. Counts D1's and Paddle's calls around it. */
  w.post = async (raw, po) => {
    const p = po || {};
    const text = typeof raw === "string" ? raw : JSON.stringify(raw);
    const ts = p.ts !== undefined ? p.ts : Math.floor(clock.now / 1000);
    const h1 = crypto.createHmac("sha256", p.secret || SECRET).update(ts + ":" + (p.signedText !== undefined ? p.signedText : text)).digest("hex");
    const header = p.header !== undefined ? p.header : "ts=" + ts + ";h1=" + (p.h1 || h1);
    const headers = { "content-type": "application/json" };
    if (header !== null) headers["paddle-signature"] = header;
    const init = { method: "POST", headers, body: p.stream || text };
    if (p.stream) init.duplex = "half";
    const d1 = db.calls, pc = paddle.calls;
    const audit = !p.noAudit && !p.stream ? { before: w.stateExcept("pay_events"), events: w.count("pay_events") } : null;
    const res = await service.fetch(new Request((p.base || "https://licence.test/licence/v1/") + (p.path || "pay/paddle"), init), env);
    await res.text();
    if (audit) {
      let id = null; try { id = JSON.parse(text).event_id; } catch { id = null; }
      const outcome = id && (db.raw.prepare("SELECT outcome FROM pay_events WHERE event_id = ?").get(id) || {}).outcome;
      if (typeof outcome === "string" && outcome.startsWith("held:"))
        AUDIT.push({ outcome, only: w.stateExcept("pay_events") === audit.before && w.count("pay_events") === audit.events + 1 });
    }
    return { status: res.status, d1: db.calls - d1, paddle: paddle.calls - pc };
  };
  w.outcome = ev => (db.raw.prepare("SELECT outcome FROM pay_events WHERE event_id = ?").get(ev.event_id) || {}).outcome;
  w.licence = id => db.raw.prepare("SELECT * FROM licences WHERE id = ?").get(id);
  w.paidOf = person => db.raw.prepare("SELECT * FROM licences WHERE owner = ? AND trial_ends IS NULL ORDER BY id").all(person);
  w.count = table => db.raw.prepare("SELECT COUNT(*) AS n FROM " + table).get().n;
  /* Every table's rows, hashed, for "writes nothing". */
  w.stateExcept = skipTable => sha(JSON.stringify(db.raw.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name <> ? ORDER BY name").all(skipTable)
    .map(t => [t.name, db.raw.prepare("SELECT * FROM " + t.name + " ORDER BY rowid").all()])));
  w.state = () => sha(JSON.stringify(db.raw.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all()
    .map(t => [t.name, db.raw.prepare("SELECT * FROM " + t.name + " ORDER BY rowid").all()])));
  return w;
}

/* ---- people, as they come to the service ----------------------------------------------------------------------------- */

/** A person signs in to Studio with Google (Workspace `hd`, or personal): {lead, me, person, body}. */
async function signin(w, sub, hd) {
  const lead = edKey(), seed = crypto.randomBytes(32).toString("hex"), t = w.clock.now + (++tick);
  const idToken = googleToken(w.clock, sub, await RQ.signinNonce(lead.pub, seed), hd);
  const r = await w.call("signin", { provider: "google", idToken, lead: lead.pub, t, seed,
    sig: lead.sign(RQ.signinBytes({ provider: "google", tokenHash: await RQ.tokenHash(idToken), lead: lead.pub, t })) });
  const me = r.body && r.body.me;
  const p = me ? w.db.raw.prepare("SELECT person FROM persons WHERE code = ?").get(me) : null;
  return { lead, me, person: p && p.person, body: r.body, status: r.status };
}
/** A desk signs its person in itself: {status, body}. */
async function deskSignin(w, sub, hd, desk) {
  const seed = crypto.randomBytes(32).toString("hex"), t = w.clock.now + (++tick);
  const idToken = googleToken(w.clock, sub, await RQ.signinNonce(desk.pub, seed), hd);
  return w.call("signin/desk", { provider: "google", idToken, desk: desk.pub, t, seed,
    sig: desk.sign(RQ.signinDeskBytes({ provider: "google", tokenHash: await RQ.tokenHash(idToken), desk: desk.pub, t })) });
}
async function quietCheck(w, lead) {
  const t = w.clock.now + (++tick);
  return w.call("check", { lead: lead.pub, t, sig: lead.sign(RQ.checkBytes({ lead: lead.pub, t })) });
}
const licenceHolds = async doc => !!doc && (await L.verifyLicence(doc, { trustedKey: ROOTK.pub })).valid === true;
/** An invoice attached by hand, as the vendor's script attaches it, for the owner `code` in acme.example. */
async function attachByHand(w, code, o) {
  const made = await w.AT.makeAttachSql(Object.assign({ owner: code, org: "Acme by invoice", provider: "google", domain: "acme.example", orgKeyed: ORG_ACME,
    leadSeats: 1, seats: 3, order: "INV-" + (++tick) }, o || {}), w.clock.now);
  w.db.raw.exec(made.sql);
  return w.db.raw.prepare("SELECT id FROM licences WHERE key_hash = ?").get(made.tag) || w.db.raw.prepare(
    "SELECT l.id AS id FROM admits a JOIN licences l ON l.id = a.licence WHERE a.org = ? AND l.trial_ends IS NULL").get(ORG_ACME);
}

/* ---- Paddle's side of a purchase -------------------------------------------------------------------------------------- */

const iso = ms => new Date(ms).toISOString();
const itemsOf = items => items.map(([price, quantity]) => ({ status: "active", quantity, price: { id: price, billing_cycle: CYCLE(price) } }));
/** A subscription Paddle holds for `code`, its active items [[price, quantity], ...]. */
/* A sign-in code no person holds: a checkout carrying it is held "unknown-code" (P21, P21e). */
const UNHELD_CODE = "ZZZZ0000ZZZZ0000";
function subscription(w, code, items, o) {
  const s = Object.assign({ id: pid("sub"), status: "active", custom_data: { etiuda_code: code }, items: itemsOf(items), scheduled_change: null }, o || {});
  w.paddle.subs.set(s.id, s);
  return s;
}
/** A completed transaction of `sub`, its period ending `ends` (ms), with `origin`. */
function transaction(w, sub, ends, o) {
  const t = Object.assign({ id: pid("txn"), status: "completed", origin: "web", subscription_id: sub.id, custom_data: Object.assign({}, sub.custom_data),
    billing_period: { starts_at: iso(ends - 30 * DAY), ends_at: iso(ends) },
    items: sub.items.map(i => ({ price: i.price, quantity: i.quantity })) }, o || {});
  w.paddle.txns.set(t.id, t);
  return t;
}
const event = (type, data, o) => Object.assign({ event_id: pid("evt"), event_type: type, occurred_at: iso(T0), notification_id: pid("ntf"), data }, o || {});
const paid = (w, t) => w.post(event("transaction.completed", { id: t.id, status: "completed", subscription_id: t.subscription_id }));
/** A buyer in acme.example, signed in to Studio (their own trial), and their purchase of `items`, notified: {buyer, sub, txn, r}. */
async function buy(w, sub0, items, o) {
  const opts = o || {};
  const buyer = opts.buyer || await signin(w, sub0, opts.hd === undefined ? "acme.example" : opts.hd);
  const sub = subscription(w, opts.code || buyer.me, items);
  const txn = transaction(w, sub, opts.ends || T0 + 365 * DAY, opts.txn);
  const r = await paid(w, txn);
  return { buyer, sub, txn, r, ev: null };
}
const GRACE = 14 * DAY;

/* ---- the legs ------------------------------------------------------------------------------------------------------- */

async function legs(K, ck) {
  AUDIT = [];
  const leg = async (name, fn) => { try { await fn(); } catch (e) { ck(false, name + " threw: " + (e && e.stack || e).toString().split(NL).slice(0, 3).join(" | ")); } };
  const callSigned = (w, route, lead, fields, bytesFn) => {
    const t = w.clock.now + (++tick);
    const body = Object.assign({ lead: lead.pub, t }, fields);
    return w.call(route, Object.assign(body, { sig: lead.sign(bytesFn(body)) }));
  };
  const renewOwner = async (w, sub, hd, lead) => {
    const seed = crypto.randomBytes(32).toString("hex"), t = w.clock.now + (++tick);
    const idToken = googleToken(w.clock, sub, await RQ.signinNonce(lead.pub, seed), hd);
    return w.call("signin", { provider: "google", idToken, lead: lead.pub, t, seed,
      sig: lead.sign(RQ.signinBytes({ provider: "google", tokenHash: await RQ.tokenHash(idToken), lead: lead.pub, t })) });
  };

  await leg("P1", async () => {
    const w = world(K);
    const s = subscription(w, "0123456789ABCDEF", [[PRICE.deskMonth, 1]]);
    const ev = () => event("subscription.updated", { id: s.id });
    const ok = await w.post(ev());
    const e1 = ev(), text = JSON.stringify(e1);
    const ts = Math.floor(w.clock.now / 1000), good = crypto.createHmac("sha256", SECRET).update(ts + ":" + text).digest("hex");
    const changed = await w.post(text.replace("subscription.updated", "subscription.updatee"), { signedText: text });
    ck(ok.status === 200 && changed.status === 401, "P1a a signed event is answered 200, and the same signature over a body one byte changed is refused: " + ok.status + " " + changed.status);
    const old = await w.post(ev(), { ts: ts - 301 }), ahead = await w.post(ev(), { ts: ts + 301 }), inside = await w.post(ev(), { ts: ts - 299 });
    ck(old.status === 401 && ahead.status === 401 && inside.status === 200,
      "P1b the window is 300 seconds: a ts 301 s old or 301 s ahead is refused, 299 s old passes: " + [old.status, ahead.status, inside.status].join(" "));
    const none = await w.post(ev(), { header: null }), short = await w.post(ev(), { h1: good.slice(0, 63) }), long = await w.post(ev(), { h1: good + "0" });
    ck(none.status === 401 && short.status === 401 && long.status === 401, "P1c no header, and an h1 of 63 or 65 hex, are refused: " + [none.status, short.status, long.status].join(" "));
    const e2 = ev(), t2 = JSON.stringify(e2), h2 = crypto.createHmac("sha256", SECRET).update(ts + ":" + t2).digest("hex");
    const oldSecret = crypto.createHmac("sha256", "pdl_ntfset_the_old_secret").update(ts + ":" + t2).digest("hex");
    const rotateA = await w.post(t2, { header: "ts=" + ts + ";h1=" + oldSecret + ";h1=" + h2 });
    const e3 = ev(), t3 = JSON.stringify(e3), h3 = crypto.createHmac("sha256", SECRET).update(ts + ":" + t3).digest("hex");
    const rotateB = await w.post(t3, { header: "ts=" + ts + ";h1=" + h3 + ";h1=" + oldSecret });
    const neither = await w.post(ev(), { header: "ts=" + ts + ";h1=" + oldSecret + ";h1=" + "ab".repeat(32) });
    ck(rotateA.status === 200 && rotateB.status === 200 && neither.status === 401,
      "P1d a rotation's two h1 pass with the valid one second or first, and fail with neither valid: " + [rotateA.status, rotateB.status, neither.status].join(" "));
  });

  await leg("P2", async () => {
    const w = world(K);
    const s = subscription(w, "0123456789ABCDEF", [[PRICE.deskMonth, 1]]);
    const e = event("subscription.updated", { id: s.id });
    const pretty = JSON.stringify(e, null, 2).replace(/\n/g, "\r\n") + "\n";
    const r = await w.post(pretty);
    const resent = await w.post(JSON.stringify(JSON.parse(pretty)), { signedText: pretty });
    ck(r.status === 200 && w.outcome(e) === "unknown" && resent.status === 401,
      "P2a the HMAC is over the raw body: Paddle's own whitespace passes, and the same event re-serialised under that signature is refused: " + r.status + " " + resent.status);
  });

  await leg("P3", async () => {
    const w = world(K);
    const buyer = await signin(w, "p3-buyer", "acme.example");
    const sub = subscription(w, buyer.me, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]]);
    const txn = transaction(w, sub, T0 + 365 * DAY);
    const forged = event("transaction.completed", { id: txn.id, status: "completed", subscription_id: sub.id, custom_data: { etiuda_code: buyer.me },
      items: [{ price: { id: PRICE.deskYear }, quantity: 50 }], billing_period: { ends_at: iso(T0 + 3650 * DAY) } });
    const r = await w.post(forged);
    const lic = w.paidOf(buyer.person)[0];
    ck(r.status === 200 && !!lic && lic.seats === 2 && lic.lead_seats === 1 && lic.paid_until === T0 + 365 * DAY + GRACE,
      "P3a the doorbell: a signed body claiming 50 desks and a ten-year period gives what the API says, 2 desks to the year's end plus 14 days: "
      + r.status + " " + JSON.stringify(lic && { seats: lic.seats, lead: lic.lead_seats, paid: lic.paid_until - T0 }));
    const w2 = world(K);
    const b2 = await signin(w2, "p3-billed", "acme.example");
    const s2 = subscription(w2, b2.me, [[PRICE.deskYear, 2]]);
    const t2 = transaction(w2, s2, T0 + 365 * DAY, { status: "billed" });
    const before = w2.state();
    const billed = await paid(w2, t2);
    ck(billed.status === 500 && w2.state() === before, "P3b an API status \"billed\" under a completed event writes nothing and answers 500, so Paddle retries: " + billed.status);
  });

  await leg("P4", async () => {
    const w = world(K);
    const buyer = await signin(w, "p4-buyer", "acme.example");
    const sub = subscription(w, buyer.me, [[PRICE.leadYear, 1], [PRICE.deskYear, 4]]);
    const txn = transaction(w, sub, T0 + 365 * DAY);
    const e = event("transaction.completed", { id: txn.id });
    const first = await w.post(e), again = await w.post(e);
    const other = event("transaction.completed", { id: txn.id }), second = await w.post(other);
    const lic = w.paidOf(buyer.person)[0];
    ck(first.status === 200 && again.status === 200 && again.d1 === 1 && again.paddle === 0,
      "P4a the same event twice: the repeat is answered 200 from one read of pay_events, with no call to Paddle: " + JSON.stringify(again));
    ck(second.status === 200 && second.paddle === 0 && w.outcome(other) === "once" && !!lic && lic.seats === 4 && lic.lead_seats === 1 && w.count("pay_subs") === 1,
      "P4b a second event for the same transaction is \"once\", calls Paddle nothing and counts no seat twice: "
      + JSON.stringify({ paddle: second.paddle, outcome: w.outcome(other), seats: lic && lic.seats }));
    const w2 = world(K);
    const b2 = await signin(w2, "p4-race", "acme.example");
    const s2 = subscription(w2, b2.me, [[PRICE.leadYear, 1], [PRICE.deskYear, 4]]);
    const t2 = transaction(w2, s2, T0 + 365 * DAY);
    const ea = event("transaction.completed", { id: t2.id }), eb = event("transaction.completed", { id: t2.id });
    w2.db.pair(2);
    const both = await Promise.all([w2.post(ea, { noAudit: true }), w2.post(eb, { noAudit: true })]);
    w2.db.pair(0);
    const lic2 = w2.paidOf(b2.person)[0];
    const outs = [w2.outcome(ea), w2.outcome(eb)].sort();
    ck(both.every(x => x.status === 200) && !!lic2 && lic2.seats === 4 && w2.paidOf(b2.person).length === 1 && outs.join() === "applied,once",
      "P4c two events for one transaction at once apply it once: one licence of 4 desks, outcomes " + outs.join() + ", " + both.map(x => x.status).join(" "));
  });

  await leg("P5", async () => {
    const w = world(K);
    const buyer = await signin(w, "p5-buyer", "acme.example");
    const trial = w.db.raw.prepare("SELECT licence FROM seats WHERE kind = 'lead' AND person = ?").get(buyer.person);
    ck(buyer.status === 200 && !!buyer.body.trial && !!trial, "P5a control: the buyer signed in to Studio holds a trial: " + buyer.status);
    const sub = subscription(w, buyer.me, [[PRICE.leadYear, 2], [PRICE.deskYear, 5]]);
    const txn = transaction(w, sub, T0 + 365 * DAY, { custom_data: { etiuda_code: buyer.me, org: "Acme Tools" } });
    const r = await paid(w, txn);
    const lic = w.paidOf(buyer.person)[0] || {};
    const admits = w.db.raw.prepare("SELECT provider, org FROM admits WHERE licence = ? ORDER BY org").all(lic.id).map(a => a.provider + ":" + a.org);
    const t = w.licence(trial.licence);
    const seat = w.db.raw.prepare("SELECT licence FROM seats WHERE kind = 'lead' AND person = ?").get(buyer.person);
    const key = w.db.raw.prepare("SELECT licence FROM bindings WHERE lead = ?").get(buyer.lead.pub);
    ck(r.status === 200 && lic.owner === buyer.person && lic.org === "Acme Tools" && lic.lead_seats === 2 && lic.seats === 5 && lic.desk_only === 0
      && admits.includes("google:" + ORG_ACME) && admits.includes("google:person:" + buyer.person) && t.trial_ends <= w.clock.now
      && seat.licence === lic.id && key.licence === lic.id,
      "P5b the paid licence admits the organisation and the buyer, owned by them, the trial superseded, their seat and key moved: "
      + JSON.stringify({ status: r.status, owner: lic.owner === buyer.person, admits: admits.length, trialEnded: t.trial_ends <= w.clock.now, seat: seat.licence === lic.id, key: key.licence === lic.id }));
    w.clock.now += HOUR;
    const c = await quietCheck(w, buyer.lead);
    ck(c.status === 200 && !c.body.trial && await licenceHolds(c.body.licence) && c.body.owner === true && !!c.body.grant,
      "P5c the quiet check answers the paid licence, which Studio accepts, with a paid grant and the buyer as owner: " + c.status + " " + JSON.stringify(c.body && Object.keys(c.body)));
  });

  await leg("P6", async () => {
    const w = world(K);
    const b = await signin(w, "p6-b", "acme.example");
    const a = await buy(w, "p6-a", [[PRICE.leadYear, 1], [PRICE.deskYear, 3]]);
    const lic = w.paidOf(a.buyer.person)[0];
    const bSub = subscription(w, b.me, [[PRICE.leadYear, 1], [PRICE.deskYear, 10]]);
    const bTxn = transaction(w, bSub, T0 + 400 * DAY);
    const e = event("transaction.completed", { id: bTxn.id });
    const r = await w.post(e);
    const after = w.licence(lic.id), mine = w.paidOf(b.person)[0] || {};
    const admitsOf = id => (id === undefined ? "" : w.db.raw.prepare("SELECT org FROM admits WHERE licence = ? ORDER BY org").all(id).map(x => x.org).join());
    const subRow = w.db.raw.prepare("SELECT licence FROM pay_subs WHERE sub = ?").get(bSub.id) || {};
    ck(r.status === 200 && w.outcome(e) === "applied" && after.owner === a.buyer.person && after.seats === 3 && mine.id !== undefined && mine.id !== lic.id
      && mine.owner === b.person && mine.seats === 10 && mine.lead_seats === 1 && admitsOf(mine.id) === "person:" + b.person && subRow.licence === mine.id
      && lic.org_desks === (K.core.ORG_DESKS_DEFAULT ? 1 : 0) && mine.org_desks === lic.org_desks,
      "P6a a second buyer in the organisation buys a licence of their own (decision 47, in place of decision 45's hold): owned by them, their"
      + " seats, admitting them by name and no organisation, the first buyer's licence as it was; each made with the switch ORG_DESKS_DEFAULT"
      + " names: " + JSON.stringify({ status: r.status, outcome: w.outcome(e), seats: after.seats, own: mine.id !== lic.id, admits: admitsOf(mine.id).replace(b.person, "<b>") }));
    const renewal = transaction(w, bSub, T0 + 800 * DAY, { origin: "subscription_recurring" });
    const r2 = await paid(w, renewal);
    ck(r2.status === 200 && mine.id !== undefined && (w.licence(mine.id) || {}).paid_until === T0 + 800 * DAY + GRACE && w.licence(lic.id).paid_until === after.paid_until,
      "P6b the second buyer's renewal raises their own licence, never the first's: " + r2.status);
    const w2 = world(K);
    const x = await signin(w2, "p6-x", "acme.example"), y = await signin(w2, "p6-y", "acme.example");
    const sx = subscription(w2, x.me, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]]), sy = subscription(w2, y.me, [[PRICE.leadYear, 1], [PRICE.deskYear, 7]]);
    const tx = transaction(w2, sx, T0 + 365 * DAY), ty = transaction(w2, sy, T0 + 365 * DAY);
    const ex = event("transaction.completed", { id: tx.id }), ey = event("transaction.completed", { id: ty.id });
    w2.db.pair(2);
    const both = await Promise.all([w2.post(ex, { noAudit: true }), w2.post(ey, { noAudit: true })]);
    w2.db.pair(0);
    const paidRows = w2.db.raw.prepare("SELECT * FROM licences WHERE trial_ends IS NULL").all();
    const outs = [w2.outcome(ex), w2.outcome(ey)].sort();
    const winner = paidRows[0] || {};
    const seatsOk = (winner.owner === x.person && winner.seats === 2) || (winner.owner === y.person && winner.seats === 7);
    ck(both.every(z => z.status === 200) && paidRows.length === 1 && seatsOk && outs.join() === "applied,held:changed",
      "P6c two first buyers in one organisation at once: one licence, its owner's seats alone, the other held for Max (rare, and listed): "
      + JSON.stringify({ licences: paidRows.length, seats: winner.seats, outcomes: outs }));
    const w3 = world(K), pd = edKey(), cd = edKey();
    const pDesk = await deskSignin(w3, "p6d-p", "acme.example", pd);
    const pCode = pDesk.body && pDesk.body.code;
    const pPerson = w3.db.raw.prepare("SELECT person FROM persons WHERE code = ?").get(pCode).person;
    const s1 = subscription(w3, pCode, [[PRICE.leadYear, 1], [PRICE.deskYear, 3]]);
    await paid(w3, transaction(w3, s1, T0 + 365 * DAY));
    const l1 = w3.paidOf(pPerson)[0] || {};
    const admits1 = l1.id ? w3.db.raw.prepare("SELECT org FROM admits WHERE licence = ? ORDER BY org").all(l1.id).map(x => x.org) : [];
    const ps = await signin(w3, "p6d-p", "acme.example");
    const st = w3.clock.now + (++tick);
    await w3.call("licence/set", { orgDesks: true, lead: ps.lead.pub, t: st, sig: ps.lead.sign(RQ.licenceSetBytes({ orgDesks: true, lead: ps.lead.pub, t: st })) });
    const pCk = await quietCheck(w3, ps.lead);
    const col = await deskSignin(w3, "p6d-c", "acme.example", cd);
    /* More desks are a change of quantity on the one subscription (one subscription per licence, Max, 2026-11-19). */
    s1.items = itemsOf([[PRICE.leadYear, 1], [PRICE.deskYear, 5]]);
    await paid(w3, transaction(w3, s1, T0 + 365 * DAY, { origin: "subscription_update", items: itemsOf([[PRICE.deskYear, 2]]).map(i => ({ price: i.price, quantity: i.quantity })) }));
    const after2 = w3.licence(l1.id) || {};
    const pCk2 = await quietCheck(w3, ps.lead);
    ck(w3.paidOf(pPerson).length === 1 && admits1.includes(ORG_ACME)
      && !!col.body && !!col.body.certificate && col.body.certificate.licence === (pCk.body && pCk.body.ref)
      && after2.lead_seats === 1 && after2.seats === 5 && pCk2.body && pCk2.body.licence && pCk2.body.licence.seats === 5,
      "P6d buyer signed in on a desk first (acme.example) gets an organisation team licence seating colleagues, and a rise of the subscription after Studio sign-in raises it to 5 desks: "
      + JSON.stringify({ licences: w3.paidOf(pPerson).length, orgAdmitted: admits1.includes(ORG_ACME), colRef: col.body && col.body.certificate && col.body.certificate.licence, wantRef: pCk.body && pCk.body.ref, seats: after2.seats, checkSeats: pCk2.body && pCk2.body.licence && pCk2.body.licence.seats }));
    const w4 = world(K);
    const a4 = await buy(w4, "p6e-a", [[PRICE.leadYear, 1], [PRICE.deskYear, 3]]);
    const b4 = await signin(w4, "p6e-b", "acme.example");
    const bSub1 = subscription(w4, b4.me, [[PRICE.leadYear, 1], [PRICE.deskYear, 3]]);
    await paid(w4, transaction(w4, bSub1, T0 + 365 * DAY));
    const l2 = w4.paidOf(b4.person)[0] || {};
    /* One subscription per licence (Max, 2026-11-19): the second buyer's own is cancelled, its paid time running, before the next is bought. */
    bSub1.status = "canceled";
    await w4.post(event("subscription.canceled", { id: bSub1.id }));
    const adj = { id: pid("adj"), action: "refund", type: "full", status: "approved", transaction_id: a4.txn.id, subscription_id: a4.sub.id, items: [{ id: "adjitm_1" }] };
    w4.paddle.adjs.set(adj.id, adj);
    const refEv = event("adjustment.updated", { id: adj.id });
    await w4.post(refEv);
    const bSub2 = subscription(w4, b4.me, [[PRICE.deskMonth, 2]]);
    await paid(w4, transaction(w4, bSub2, T0 + 30 * DAY));
    const afterB2 = w4.licence(l2.id) || {};
    w4.clock.now += HOUR;
    const ck4 = await quietCheck(w4, b4.lead);
    ck(w4.outcome(refEv) === "applied" && w4.paidOf(b4.person).length === 1 && afterB2.lead_seats === 1 && afterB2.seats === 5
      && afterB2.paid_until === T0 + 365 * DAY + GRACE && ck4.body && ck4.body.licence && ck4.body.licence.seats === 5,
      "P6e after the organisation's first licence is refunded, a second buyer's later purchase, their first subscription cancelled, raises their own team licence (1 lead, 3 -> 5 desks, +379d) instead of making a new one: "
      + JSON.stringify({ refund: w4.outcome(refEv), licences: w4.paidOf(b4.person).length, seats: afterB2.seats, paid: afterB2.paid_until && (afterB2.paid_until - T0) / DAY, checkSeats: ck4.body && ck4.body.licence && ck4.body.licence.seats }));
  });

  await leg("P7", async () => {
    const w = world(K);
    const buyerDesk = edKey(), colleagueDesk = edKey(), secondDesk = edKey();
    const first = await deskSignin(w, "p7-buyer", "acme.example", buyerDesk);
    const code = first.body && first.body.code;
    const person = code && w.db.raw.prepare("SELECT person FROM persons WHERE code = ?").get(code).person;
    const sub = subscription(w, code, [[PRICE.oneMonth, 1]]);
    const txn = transaction(w, sub, T0 + 30 * DAY);
    const r = await paid(w, txn);
    const lic = w.db.raw.prepare("SELECT * FROM licences WHERE owner = ? AND desk_only = 1 AND trial_ends IS NULL").get(person) || {};
    const own = await deskSignin(w, "p7-buyer", "acme.example", secondDesk);
    const colleague = await deskSignin(w, "p7-colleague", "acme.example", colleagueDesk);
    const ref = c => c && c.licence;
    const ownRef = ref(own.body && own.body.certificate);
    const colRef = ref(colleague.body && colleague.body.certificate);
    ck(r.status === 200 && lic.desk_only === 1 && lic.seats === 1 && w.db.raw.prepare("SELECT COUNT(*) AS n FROM admits WHERE licence = ?").get(lic.id).n === 0
      && own.status === 200 && !!ownRef && own.body.certificate.deskOnly === true && colRef !== ownRef,
      "P7a a desk-only payment makes its owner's desk-only licence: their own desk is certified on it, a colleague's in the same organisation is not: "
      + JSON.stringify({ status: r.status, deskOnly: lic.desk_only, own: own.status, ownDeskOnly: own.body && own.body.certificate && own.body.certificate.deskOnly, colleagueSame: colRef === ownRef }));
  });

  await leg("P8", async () => {
    const w = world(K);
    const e1 = T0 + 30 * DAY, e2 = T0 + 60 * DAY, e15 = T0 + 45 * DAY;
    const p = await buy(w, "p8", [[PRICE.leadMonth, 1], [PRICE.deskMonth, 2]], { ends: e1 });
    const lic = w.paidOf(p.buyer.person)[0];
    ck(p.r.status === 200 && lic.paid_until === e1 + GRACE && lic.updates_until === new Date(e1 + GRACE).toISOString().slice(0, 10),
      "P8a a first purchase is paid until its period's end plus 14 days, updates the same day: " + (lic.paid_until - T0) / DAY);
    const renewal = transaction(w, p.sub, e2, { origin: "subscription_recurring" });
    const r2 = await paid(w, renewal);
    ck(r2.status === 200 && w.licence(lic.id).paid_until === e2 + GRACE, "P8b a renewal extends it to the new period's end plus 14 days: " + (w.licence(lic.id).paid_until - T0) / DAY);
    const late = transaction(w, p.sub, e15, { origin: "subscription_recurring" });
    const r3 = await paid(w, late);
    const row = w.db.raw.prepare("SELECT txn, paid_until FROM pay_subs WHERE sub = ?").get(p.sub.id);
    ck(r3.status === 200 && w.licence(lic.id).paid_until === e2 + GRACE && w.licence(lic.id).updates_until === new Date(e2 + GRACE).toISOString().slice(0, 10)
      && row.txn === renewal.id && row.paid_until === e2 + GRACE,
      "P8c a late older transaction shortens neither date, and the subscription's current period stays the newer one: " + (w.licence(lic.id).paid_until - T0) / DAY + " " + (row.txn === renewal.id));
    /* Section 13's orders rule: with no revenue date from the provider, an order keeps the later of its own year and the licence's end year. */
    const yearOf = tag => (w.db.raw.prepare("SELECT revenue_year FROM orders WHERE tag = ?").get(tag) || {}).revenue_year;
    ck(yearOf("paddle:" + p.txn.id) === 2026 && yearOf("paddle:" + renewal.id) === 2027,
      "P8d a first purchase whose licence then ends in 2026 keeps its order by 2026, and a renewal paid in 2026 that carries the licence into"
      + " 2027 keeps its order by 2027: " + [yearOf("paddle:" + p.txn.id), yearOf("paddle:" + renewal.id)].join(" "));
  });

  await leg("P9", async () => {
    const w = world(K);
    const p = await buy(w, "p9", [[PRICE.leadYear, 1], [PRICE.deskYear, 5]]);
    const id = w.paidOf(p.buyer.person)[0].id;
    p.sub.items = itemsOf([[PRICE.leadYear, 1], [PRICE.deskYear, 8]]);
    const u = await w.post(event("subscription.updated", { id: p.sub.id }));
    ck(u.status === 200 && w.licence(id).seats === 5, "P9a subscription.updated alone, its items raised to 8, changes no seat: " + w.licence(id).seats);
    const rise = transaction(w, p.sub, T0 + 365 * DAY, { origin: "subscription_update" });
    const r = await paid(w, rise);
    ck(r.status === 200 && w.licence(id).seats === 8 && w.licence(id).lead_seats === 1, "P9b the rise, paid, raises the seats to 8: " + w.licence(id).seats);
    p.sub.items = itemsOf([[PRICE.leadYear, 1], [PRICE.deskYear, 3]]);
    const renewal = transaction(w, p.sub, T0 + 730 * DAY, { origin: "subscription_recurring" });
    const r2 = await paid(w, renewal);
    ck(r2.status === 200 && w.licence(id).seats === 3, "P9c a fall bought at renewal lands at the renewal: " + w.licence(id).seats);
  });

  await leg("P10", async () => {
    const w = world(K);
    const owner = await signin(w, "p10-owner", "acme.example");
    const lic = await attachByHand(w, owner.me, { leadSeats: 1, seats: 3, paidUntil: "2027-06-30" });
    const p = await buy(w, null, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 5]], { buyer: owner, ends: T0 + 30 * DAY });
    const raised = w.licence(lic.id);
    ck(p.r.status === 200 && raised.seats === 8 && raised.lead_seats === 2 && w.paidOf(owner.person).length === 1,
      "P10a control: the owner's purchase raises their invoiced licence in place, 3 + 5 desks and 1 + 1 leads: " + raised.seats + " " + raised.lead_seats);
    p.sub.scheduled_change = { action: "cancel", effective_at: iso(T0 + 30 * DAY) };
    const sched = await w.post(event("subscription.updated", { id: p.sub.id }));
    const same = w.licence(lic.id);
    ck(sched.status === 200 && same.seats === 8 && same.paid_until === raised.paid_until && same.refunded === 0,
      "P10b a scheduled cancel ends nothing early: seats and paid date as they were: " + same.seats);
    p.sub.status = "canceled";
    const can = await w.post(event("subscription.canceled", { id: p.sub.id }));
    const after = w.licence(lic.id);
    const listBefore = await callSigned(w, "seat/list", owner.lead, {}, RQ.seatListBytes);
    const againBefore = await w.post(event("subscription.canceled", { id: p.sub.id }));
    const afterAgainBefore = w.licence(lic.id);
    w.clock.now = T0 + 20 * DAY;
    await renewOwner(w, "p10-owner", "acme.example", owner.lead);
    w.clock.now = T0 + 44 * DAY;
    const listAt44 = await callSigned(w, "seat/list", owner.lead, {}, RQ.seatListBytes);
    const ckAt44 = await quietCheck(w, owner.lead);
    ck(can.status === 200 && after.seats === 8 && after.lead_seats === 2 && after.paid_until === raised.paid_until && after.refunded === 0
      && listBefore.status === 200 && listBefore.body.counts.desk.of === 8 && listBefore.body.counts.lead.of === 2
      && listAt44.status === 200 && listAt44.body.counts.desk.of === 3 && listAt44.body.counts.lead.of === 1
      && !!ckAt44.body && ckAt44.body.licence && ckAt44.body.licence.seats === 3,
      "P10c subscription.canceled keeps its own 5 desks and 1 lead to its own paid date (+44d) beside the invoice's 3 desks and 1 lead, then drops them at +44d (3 and 1): "
      + JSON.stringify({ before: [after.seats, after.lead_seats, listBefore.body && listBefore.body.counts],
        at44: [listAt44.body && listAt44.body.counts, ckAt44.body && ckAt44.body.licence && ckAt44.body.licence.seats] }));
    const againAfter = await w.post(event("subscription.canceled", { id: p.sub.id }));
    const afterAgainAfter = w.licence(lic.id);
    ck(againBefore.status === 200 && afterAgainBefore.seats === 8 && afterAgainBefore.lead_seats === 2
      && againAfter.status === 200 && afterAgainAfter.seats === 3 && afterAgainAfter.lead_seats === 1,
      "P10d a second cancel event writes nothing more and leaves counts as they were (8 before +44d, 3 after +44d): "
      + [afterAgainBefore.seats, afterAgainAfter.seats].join(" "));
    const w2 = world(K);
    const q = await buy(w2, "p10-early", [[PRICE.deskMonth, 2], [PRICE.leadMonth, 1]]);
    const before = w2.state();
    const early = await w2.post(event("subscription.canceled", { id: q.sub.id }));
    ck(early.status === 500 && w2.state() === before, "P10e a cancel event while the API still says active writes nothing, 500: " + early.status);
  });

  await leg("P11", async () => {
    const adj = (w, sub, txn, o) => { const a = Object.assign({ id: pid("adj"), action: "refund", type: "full", status: "approved", transaction_id: txn.id,
      subscription_id: sub.id, items: [{ id: "adjitm_1" }] }, o || {}); w.paddle.adjs.set(a.id, a); return a; };
    const w = world(K);
    const p = await buy(w, "p11", [[PRICE.leadYear, 1], [PRICE.deskYear, 4]]);
    const id = w.paidOf(p.buyer.person)[0].id;
    const shapes = [{ status: "pending_approval" }, { type: "partial" }, { action: "credit" }, { action: "chargeback_warning" }, { action: "chargeback_reverse" }, { status: "reversed" }];
    const outs = [];
    for (const s of shapes) {
      const a = adj(w, p.sub, p.txn, s), before = w.state(), e = event("adjustment.created", { id: a.id }), r = await w.post(e);
      const lic = w.licence(id);
      outs.push(r.status === 200 && lic.refunded === 0 && lic.seats === 4 && /^held:adjustment:/.test(w.outcome(e)) && before !== w.state() ? "held" : "WRONG " + w.outcome(e));
    }
    ck(outs.every(o => o === "held"), "P11a a pending, partial, credit, chargeback warning, reversal or reversed refund changes nothing and is held: " + outs.join(","));
    const old = transaction(w, p.sub, T0 + 330 * DAY, { origin: "subscription_recurring" });
    w.paddle.txns.set(old.id, old);
    const oldPaid = await paid(w, old);
    const aOld = adj(w, p.sub, old), eOld = event("adjustment.updated", { id: aOld.id }), rOld = await w.post(eOld);
    ck(oldPaid.status === 200 && rOld.status === 200 && w.outcome(eOld) === "held:not-current-period" && w.licence(id).refunded === 0,
      "P11b a full refund of a transaction applied here that did not buy the current period is held: " + w.outcome(eOld));
    const a = adj(w, p.sub, p.txn), e = event("adjustment.updated", { id: a.id }), r = await w.post(e);
    const lic = w.licence(id);
    w.clock.now += HOUR;
    const c = await quietCheck(w, p.buyer.lead);
    ck(r.status === 200 && w.outcome(e) === "applied" && lic.refunded === 1 && lic.refunded_at === T0 && c.status === 200 && !c.body.grant
      && (c.body.ended === "refunded" || (!!c.body.trial && c.body.trial.ends <= w.clock.now)),
      "P11c a full approved refund of the current period ends a sole-source licence: refunded, and the check answers no paid licence and no"
      + " grant (the owner's superseded trial, ended, where they had one; core.mjs followSeat): "
      + JSON.stringify({ outcome: w.outcome(e), refunded: lic.refunded, check: c.status, body: c.body && Object.assign({}, c.body, { licence: !!c.body.licence }) }));
    const yearOf = tag => (w.db.raw.prepare("SELECT revenue_year FROM orders WHERE tag = ?").get(tag) || {}).revenue_year;
    ck(yearOf("paddle:" + p.txn.id) === 2027 && yearOf("paddle:" + a.id) === 2027,
      "P11f a yearly licence paid in 2026 and ending in 2027 keeps its order by 2027, and its refund's order by the same: "
      + [yearOf("paddle:" + p.txn.id), yearOf("paddle:" + a.id)].join(" "));
    const again = event("adjustment.updated", { id: a.id }), r2 = await w.post(again);
    ck(r2.status === 200 && w.outcome(again) === "once", "P11d the same refund in another event applies once: " + w.outcome(again));
    const w2 = world(K);
    const owner = await signin(w2, "p11-owner", "acme.example");
    const inv = await attachByHand(w2, owner.me, { leadSeats: 1, seats: 3, paidUntil: "2027-12-31" });
    const q = await buy(w2, null, [[PRICE.deskYear, 2]], { buyer: owner });
    const a2 = adj(w2, q.sub, q.txn), e2 = event("adjustment.updated", { id: a2.id }), r3 = await w2.post(e2);
    const lic2 = w2.licence(inv.id);
    ck(r3.status === 200 && lic2.refunded === 0 && lic2.seats === 3 && w2.outcome(e2) === "refund-one-source",
      "P11e a full refund of a subscription that merely added to an invoiced licence takes off its 2 desks, the licence live, outcome refund-one-source: "
      + JSON.stringify({ refunded: lic2.refunded, seats: lic2.seats, outcome: w2.outcome(e2) }));
  });

  await leg("P12", async () => {
    const w = world(K);
    const cases = [["unknown", "ZZZZZZZZZZZZZZZZ", "held:unknown-code"], ["missing", undefined, "held:code"], ["misshapen", "0123-4567-89AB-CDEF", "held:code"],
      ["lower case", "0123456789abcdef", "held:code"], ["a number", 1234, "held:code"]];
    const outs = [];
    for (const [label, code, want] of cases) {
      const sub = subscription(w, code, [[PRICE.deskYear, 2]]);
      if (code === undefined) sub.custom_data = {};
      const txn = transaction(w, sub, T0 + 365 * DAY, { custom_data: code === undefined ? {} : { etiuda_code: code } });
      const e = event("transaction.completed", { id: txn.id });
      const r = await w.post(e);
      outs.push(label + ":" + r.status + ":" + w.outcome(e) + (w.outcome(e) === want ? "" : " (want " + want + ")"));
    }
    ck(outs.every(o => /:200:/.test(o) && !/want/.test(o)) && w.count("licences") === 0 && w.count("pay_subs") === 0 && w.count("orders") === 0,
      "P12a an unknown, missing or misshapen code answers 200, writes no licence and is held: " + outs.join(", "));
  });

  await leg("P13", async () => {
    const w = world(K, { env: { DELEGATION: JSON.stringify(delegation({ from: T0 - 100 * DAY, until: T0 - DAY })) } });
    const s = await w.call("check", { lead: "ab".repeat(32), t: T0, sig: "cd".repeat(64) });
    const code = "0123456789ABCDEF";
    w.db.raw.prepare("INSERT INTO persons (person, provider, code, made) VALUES (?, 'google', ?, ?)").run("p13-person", code, T0);
    const sub = subscription(w, code, [[PRICE.oneYear, 1]]);
    const r = await paid(w, transaction(w, sub, T0 + 365 * DAY));
    ck(s.status === 503 && r.status === 200 && w.paidOf("p13-person").length === 1,
      "P13a with the delegation out of its window a signed route answers unavailable, and a payment still makes its licence: " + s.status + " " + r.status);
  });

  await leg("P14", async () => {
    const w = world(K);
    const s = subscription(w, "0123456789ABCDEF", [[PRICE.deskMonth, 1]]);
    const padded = n => { const e = event("subscription.updated", { id: s.id }); const base = JSON.stringify(Object.assign(e, { pad: "" })).length; e.pad = "x".repeat(n - base); return JSON.stringify(e); };
    const sixty = padded(60 * 1024), over = padded(65 * 1024);
    const counted = text => { const bytes = Buffer.from(text); let pulled = 0, at = 0;
      return { get pulled() { return pulled; }, stream: new ReadableStream({ pull(c) { if (at >= bytes.length) { c.close(); return; }
        const chunk = bytes.subarray(at, at + 16384); at += chunk.length; pulled += chunk.length; c.enqueue(chunk); } }, { highWaterMark: 0 }) }; };
    const a = counted(sixty), ra = await w.post(sixty, { stream: a.stream });
    const b = counted(over), rb = await w.post(over, { stream: b.stream });
    ck(Buffer.byteLength(sixty) === 61440 && ra.status === 200 && a.pulled === 61440,
      "P14a a 60 KiB body is read whole and answered: " + ra.status + " " + a.pulled);
    ck(Buffer.byteLength(over) === 66560 && rb.status === 401 && b.pulled <= 65536 + 16384 && rb.d1 === 0,
      "P14b a 65 KiB body is refused, read no further than the cap and one chunk, with no D1 call: " + rb.status + " " + b.pulled);
  });

  await leg("P15", async () => {
    const outs = [];
    for (const mode of ["401", "503", "down", "slow"]) {
      const w = world(K);
      const buyer = await signin(w, "p15-" + mode, "acme.example");
      const sub = subscription(w, buyer.me, [[PRICE.deskYear, 2], [PRICE.leadYear, 1]]);
      const txn = transaction(w, sub, T0 + 365 * DAY);
      if (mode === "slow") w.paddle.slowMs = 600; else w.paddle.mode = mode;
      const before = w.state(), t0 = Date.now(), r = await paid(w, txn), took = Date.now() - t0;
      if (mode === "slow") await new Promise(res => setTimeout(res, 700));
      outs.push(mode + ":" + r.status + ":" + (w.state() === before ? "unchanged" : "WRITTEN") + (mode === "slow" ? ":" + (took < 500 ? "in time" : "LATE " + took) : ""));
    }
    ck(outs.every(o => /:500:unchanged/.test(o) && !/LATE/.test(o)),
      "P15a Paddle answering 401, a 503 carrying a document, unreachable, or slower than the timeout: 500 and nothing written: " + outs.join(", "));
  });

  await leg("P16", async () => {
    const w = world(K);
    const s = subscription(w, "0123456789ABCDEF", [[PRICE.deskMonth, 1]]);
    const e = event("subscription.updated", { id: s.id });
    const ts = Math.floor(w.clock.now / 1000);
    const tries = [["no header", { header: null }], ["wrong h1", { h1: "ab".repeat(32) }], ["stale ts", { ts: ts - 3600 }], ["malformed", { header: "t=1,v1=abc" }],
      ["two ts", { header: "ts=" + ts + ";ts=" + ts + ";h1=" + "ab".repeat(32) }], ["wrong secret", { secret: "pdl_ntfset_someone_elses" }]];
    const outs = [];
    for (const [label, o] of tries) { const r = await w.post(e, o); outs.push(label + ":" + r.status + ":" + r.d1 + ":" + r.paddle); }
    ck(outs.every(o => /:401:0:0$/.test(o)), "P16a unsigned posts cost no D1 call and no call to Paddle (label:status:d1:paddle): " + outs.join(", "));
    const huge = Buffer.alloc(10 * 1024 * 1024, 0x20);
    const flood = (bytes) => { let pulled = 0, at = 0; return { get pulled() { return pulled; }, stream: new ReadableStream({ pull(c) {
      if (at >= bytes.length) { c.close(); return; } const chunk = bytes.subarray(at, at + 65536); at += chunk.length; pulled += chunk.length; c.enqueue(chunk); } }, { highWaterMark: 0 }) }; };
    const a = flood(huge), ra = await w.post("x", { stream: a.stream, h1: "ab".repeat(32) });
    const b = flood(huge), rb = await w.post("x", { stream: b.stream, header: null });
    ck(ra.status === 401 && a.pulled <= 65536 * 2 && ra.d1 === 0 && ra.paddle === 0 && rb.status === 401 && b.pulled === 0 && rb.d1 === 0,
      "P16b a 10 MiB unsigned body is read no further than the cap and a chunk, and not at all without a header: " + [ra.status, a.pulled, rb.status, b.pulled].join(" "));
  });

  await leg("P17", async () => {
    const w = world(K);
    const buyer = await signin(w, "p17", "acme.example");
    const sub = subscription(w, buyer.me, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]]);
    const stray = pid("pri");
    const cases = [
      ["no period", () => transaction(w, sub, T0 + 365 * DAY, { billing_period: null }), "held:period"],
      ["origin api", () => transaction(w, sub, T0 + 365 * DAY, { origin: "api" }), "held:origin"],
      ["origin charge", () => transaction(w, sub, T0 + 365 * DAY, { origin: "subscription_charge" }), "held:origin"],
      ["one-time item", () => { const t = transaction(w, sub, T0 + 365 * DAY); t.items = t.items.concat([{ price: { id: PRICE.deskYear, billing_cycle: null }, quantity: 1 }]); return t; }, "held:price"],
      ["no subscription", () => transaction(w, sub, T0 + 365 * DAY, { subscription_id: null }), "held:subscription"],
      ["price not mapped", () => { const s2 = subscription(w, buyer.me, [[PRICE.leadYear, 1], [stray, 1]]); return transaction(w, s2, T0 + 365 * DAY); }, "held:price"],
      ["mixed kinds", () => { const s3 = subscription(w, buyer.me, [[PRICE.oneYear, 1], [PRICE.deskYear, 1]]); return transaction(w, s3, T0 + 365 * DAY); }, "held:mixed"],
    ];
    const outs = [];
    for (const [label, make, want] of cases) {
      const t = make(), e = event("transaction.completed", { id: t.id }), r = await w.post(e);
      outs.push(label + ":" + r.status + ":" + w.outcome(e) + (w.outcome(e) === want ? "" : " (want " + want + ")"));
    }
    const wKnown = world(K), kBuy = await buy(wKnown, "p17-known", [[PRICE.deskYear, 1]]);
    const kDup = transaction(wKnown, kBuy.sub, T0 + 365 * DAY, { origin: "web" }), kEvt = event("transaction.completed", { id: kDup.id });
    const kRes = await wKnown.post(kEvt);
    outs.push("first known here:" + kRes.status + ":" + wKnown.outcome(kEvt) + (wKnown.outcome(kEvt) === "held:subscription-known" ? "" : " (want held:subscription-known)"));
    ck(outs.every(o => /:200:/.test(o) && !/want/.test(o)) && w.paidOf(buyer.person).length === 0 && w.count("pay_subs") === 0 && w.count("orders") === 0,
      "P17a a shape the table does not name (and a first payment of a known subscription) is held and writes no licence: " + outs.join(", "));
  });

  await leg("P18", async () => {
    const w = world(K);
    const owner = await signin(w, "p18-owner", "acme.example");
    const inv = await attachByHand(w, owner.me, { leadSeats: 1, seats: 3, paidUntil: "2027-03-31" });
    const invPaid = w.licence(inv.id).paid_until;
    const one = await buy(w, null, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 5]], { buyer: owner, ends: T0 + 30 * DAY });
    w.clock.now += 20 * DAY;
    /* One subscription per licence (Max, 2026-11-19): the first is cancelled, its seats paid to its own date, before the next is bought. */
    one.sub.status = "canceled";
    await w.post(event("subscription.canceled", { id: one.sub.id }));
    const twoEnds = T0 + 20 * DAY + 365 * DAY;
    const two = await buy(w, null, [[PRICE.deskYear, 2]], { buyer: owner, ends: twoEnds });
    const both = w.licence(inv.id);
    ck(one.r.status === 200 && two.r.status === 200 && both.seats === 10 && both.lead_seats === 2 && both.paid_until === twoEnds + GRACE && w.paidOf(owner.person).length === 1,
      "P18a an invoice and two subscriptions of its owner on one licence, the first cancelled before the second: 3 + 5 + 2 desks, 1 + 1 leads, paid to the latest period: "
      + JSON.stringify({ seats: both.seats, lead: both.lead_seats, paid: (both.paid_until - T0) / DAY }));
    const after = w.licence(inv.id);
    await renewOwner(w, "p18-owner", "acme.example", owner.lead);
    const listBeforeB = await callSigned(w, "seat/list", owner.lead, {}, RQ.seatListBytes);
    const wB = world(K);
    const ownerB = await signin(wB, "p18-owner-b", "acme.example");
    const invB = await attachByHand(wB, ownerB.me, { leadSeats: 1, seats: 3, paidUntil: "2027-03-31" });
    const oneB = await buy(wB, null, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 5]], { buyer: ownerB, ends: T0 + 30 * DAY });
    wB.clock.now += 20 * DAY;
    oneB.sub.status = "canceled";
    await wB.post(event("subscription.canceled", { id: oneB.sub.id }));
    await buy(wB, null, [[PRICE.deskYear, 2]], { buyer: ownerB, ends: twoEnds });
    await renewOwner(wB, "p18-owner-b", "acme.example", ownerB.lead);
    wB.clock.now = T0 + 44 * DAY;
    const list44B = await callSigned(wB, "seat/list", ownerB.lead, {}, RQ.seatListBytes);
    const ck44B = await quietCheck(wB, ownerB.lead);
    void invB;
    ck(after.seats === 10 && after.lead_seats === 2 && after.paid_until === twoEnds + GRACE && after.paid_until >= invPaid
      && listBeforeB.status === 200 && listBeforeB.body.counts.desk.of === 10 && listBeforeB.body.counts.lead.of === 2
      && list44B.status === 200 && list44B.body.counts.desk.of === 5 && list44B.body.counts.lead.of === 1
      && !!ck44B.body && ck44B.body.licence && ck44B.body.licence.seats === 5,
      "P18b cancelling the first subscription keeps its 5 desks and 1 lead to its own paid date (+44d, still 10 and 2 at +20d); the paid date is the latest source's: "
      + JSON.stringify({ at20: [after.seats, after.lead_seats, listBeforeB.body && listBeforeB.body.counts],
        at44: [list44B.body && list44B.body.counts, ck44B.body && ck44B.body.licence && ck44B.body.licence.seats] }));
    const a = { id: pid("adj"), action: "refund", type: "full", status: "approved", transaction_id: two.txn.id, subscription_id: two.sub.id, items: [] };
    w.paddle.adjs.set(a.id, a);
    const e = event("adjustment.updated", { id: a.id }), r = await w.post(e);
    const end = w.licence(inv.id);
    const listBeforeC = await callSigned(w, "seat/list", owner.lead, {}, RQ.seatListBytes);
    /* What the sources still paying cover, read from the tables: the invoice's date and each subscription's not refunded. */
    const covered = id => Math.max(w.licence(id).invoiced_until || 0, ...w.db.raw.prepare("SELECT paid_until FROM pay_subs WHERE licence = ? AND status <> 'refunded'").all(id).map(r => r.paid_until));
    ck(end.paid_until === covered(inv.id) && end.paid_until === invPaid && end.paid_until < twoEnds + GRACE,
      "P18d after the refund no paid_until exceeds what the remaining sources cover: the date the refunded year bought falls back to the invoice's: "
      + JSON.stringify({ paid: (end.paid_until - T0) / DAY, covered: (covered(inv.id) - T0) / DAY, invoice: (invPaid - T0) / DAY }));
    const coveredDay = id => [w.licence(id).invoiced_updates_until || "", ...w.db.raw.prepare("SELECT paid_until FROM pay_subs WHERE licence = ? AND status <> 'refunded'")
      .all(id).map(r => new Date(r.paid_until).toISOString().slice(0, 10))].sort().pop();
    const refundedDay = new Date(twoEnds + GRACE).toISOString().slice(0, 10);
    ck(both.updates_until === refundedDay && end.updates_until === coveredDay(inv.id) && end.updates_until < refundedDay,
      "P18e after the refund updates_until no longer outlives the remaining sources either: the updates the refunded year bought go with it: "
      + JSON.stringify({ before: both.updates_until, after: end.updates_until, covered: coveredDay(inv.id) }));
    w.clock.now = T0 + 44 * DAY;
    const list44C = await callSigned(w, "seat/list", owner.lead, {}, RQ.seatListBytes);
    const ck44C = await quietCheck(w, owner.lead);
    ck(r.status === 200 && end.refunded === 0 && end.seats === 8 && w.outcome(e) === "refund-one-source"
      && listBeforeC.status === 200 && listBeforeC.body.counts.desk.of === 8 && listBeforeC.body.counts.lead.of === 2
      && list44C.status === 200 && list44C.body.counts.desk.of === 3 && list44C.body.counts.lead.of === 1
      && !!ck44C.body && ck44C.body.licence && ck44C.body.licence.seats === 3,
      "P18c a full refund of the second at +20d while the invoice runs and the cancelled first is still before +44d is applied as a refund of one source, keeping the cancelled first's 5 desks beside the invoice's 3 until +44d (8 desks, then 3 at +44d): "
      + JSON.stringify({ refunded: end.refunded, outcome: w.outcome(e), at20: [end.seats, listBeforeC.body && listBeforeC.body.counts],
        at44: [list44C.body && list44C.body.counts, ck44C.body && ck44C.body.licence && ck44C.body.licence.seats] }));
  });

  await leg("P21", async () => {
    const w = world(K);
    const b = await signin(w, "p21-b", "acme.example");
    const a = await buy(w, "p21-a", [[PRICE.leadYear, 1], [PRICE.deskYear, 3]]);
    const lic = w.paidOf(a.buyer.person)[0];
    /* A second buyer is no longer held (decision 47); a buyer whose checkout carried a code nobody holds is, and Max releases them by
       hand onto the licence he chooses, then corrects the code on the subscription in Paddle's dashboard. */
    const bSub = subscription(w, UNHELD_CODE, [[PRICE.leadYear, 1], [PRICE.deskYear, 10]]);
    const bTxn = transaction(w, bSub, T0 + 365 * DAY);
    const e = event("transaction.completed", { id: bTxn.id });
    await w.post(e);
    ck(w.outcome(e) === "held:unknown-code", "P21a control: the buyer's purchase is held first, its code no one's: " + w.outcome(e));
    const release = { leadSeats: 1, seats: 10, paidUntil: "2027-12-31", payPeriodEnd: "2027-12-31", paddleSub: bSub.id, paddleTxn: bTxn.id, paddleBuyer: b.me };
    await attachByHand(w, a.buyer.me, release);
    const row = w.db.raw.prepare("SELECT * FROM pay_subs WHERE sub = ?").get(bSub.id) || {};
    const raised = w.licence(lic.id);
    ck(row.licence === lic.id && row.person === b.person && row.seats === 10 && row.lead_seats === 1 && row.txn === bTxn.id && raised.seats === 13 && raised.owner === a.buyer.person,
      "P21b Max attaches the held buyer by hand with --paddle-sub: the subscription is recorded against the licence he chose, the payer B, 10 desks and 1 lead, its"
      + " current transaction; the owner stays A: " + JSON.stringify({ licence: row.licence === lic.id, person: row.person === b.person, seats: raised.seats, owner: raised.owner === a.buyer.person }));
    bSub.custom_data = { etiuda_code: b.me };
    const renewEnds = T0 + 730 * DAY;
    const renewal = transaction(w, bSub, renewEnds, { origin: "subscription_recurring" });
    const er = event("transaction.completed", { id: renewal.id }), rr = await w.post(er);
    const renewed = w.licence(lic.id);
    ck(rr.status === 200 && w.outcome(er) === "applied" && renewed.paid_until === renewEnds + GRACE && renewed.seats === 13 && renewed.owner === a.buyer.person,
      "P21c the released buyer's renewal then applies as any known subscription's: paid to its period's end plus 14 days, seats unchanged, the owner A: "
      + JSON.stringify({ outcome: w.outcome(er), paid: (renewed.paid_until - T0) / DAY, seats: renewed.seats }));
    await paid(w, transaction(w, a.sub, T0 + 1095 * DAY, { origin: "subscription_recurring" }));
    bSub.items = itemsOf([[PRICE.leadYear, 1], [PRICE.deskYear, 12]]);
    const rise = transaction(w, bSub, renewEnds, { origin: "subscription_update" });
    await paid(w, rise);
    const afterRise = w.licence(lic.id).seats;
    bSub.status = "canceled";
    await w.post(event("subscription.canceled", { id: bSub.id }));
    const afterCancel = w.licence(lic.id);
    const before = w.licence(lic.id).seats;
    await attachByHand(w, a.buyer.me, Object.assign({}, release, { order: "INV-again" }));
    const again = w.licence(lic.id).seats;
    w.clock.now = T0 + 730 * DAY;
    w.env.DELEGATION = JSON.stringify(delegation({ from: w.clock.now - 10 * DAY, until: w.clock.now + 300 * DAY }));
    await renewOwner(w, "p21-a", "acme.example", a.buyer.lead);
    const listBefore = await callSigned(w, "seat/list", a.buyer.lead, {}, RQ.seatListBytes);
    w.clock.now = renewEnds + GRACE;
    const listAfter = await callSigned(w, "seat/list", a.buyer.lead, {}, RQ.seatListBytes);
    const ckAfter = await quietCheck(w, a.buyer.lead);
    let refusals = [];
    for (const x of [{ paddleSub: bSub.id }, { paddleSub: bSub.id, paddleTxn: bTxn.id, renew: true }, { paddleSub: "sub_short", paddleTxn: bTxn.id }]) {
      try { w.AT.checkArgs(Object.assign({ owner: a.buyer.me, org: "Acme", provider: "google", domain: "acme.example", orgKeyed: ORG_ACME, leadSeats: 1, seats: 1, payPeriodEnd: "2027-12-31" }, x)); refusals.push("taken"); }
      catch { refusals.push("refused"); }
    }
    ck(afterRise === 15 && afterCancel.seats === 15 && afterCancel.lead_seats === 2 && again === before && refusals.every(x => x === "refused")
      && listBefore.status === 200 && listBefore.body.counts.desk.of === 15 && listBefore.body.counts.lead.of === 2
      && listAfter.status === 200 && listAfter.body.counts.desk.of === 3 && listAfter.body.counts.lead.of === 1
      && !!ckAfter.body && ckAfter.body.licence && ckAfter.body.licence.seats === 3,
      "P21d its rise and its cancellation then apply by the table (13 to 15 desks, kept to bSub's paid date and dropping to A's 3 once that date passes); releasing it a second time changes nothing; and the script refuses --paddle-sub without --paddle-txn, with --renew, or of another shape: "
      + JSON.stringify({ afterRise, afterCancel: afterCancel.seats, again, before744: listBefore.body && listBefore.body.counts, at744: listAfter.body && listAfter.body.counts, refusals }));
  });

  await leg("P21e", async () => {
    /* The test architect's case on 91d6727e: A buys a year, B is held, Max releases B with --paddle-sub and a later date, then B's
       payment is fully refunded. A released payment is covered by its pay_subs row, never as an invoice. */
    const w = world(K);
    const b = await signin(w, "p21e-b", "acme.example");
    const aEnds = T0 + 365 * DAY;
    const a = await buy(w, "p21e-a", [[PRICE.leadYear, 1], [PRICE.deskYear, 3]], { ends: aEnds });
    const lic = w.paidOf(a.buyer.person)[0];
    const bSub = subscription(w, UNHELD_CODE, [[PRICE.deskYear, 4]]);
    const bTxn = transaction(w, bSub, T0 + 400 * DAY);
    await w.post(event("transaction.completed", { id: bTxn.id }));
    bSub.custom_data = { etiuda_code: b.me };
    await attachByHand(w, a.buyer.me, { leadSeats: 1, seats: 4, paidUntil: "2027-12-31", updatesUntil: "2027-12-31", payPeriodEnd: "2027-12-31", paddleSub: bSub.id, paddleTxn: bTxn.id, paddleBuyer: b.me });
    const released = w.licence(lic.id);
    const adj = { id: pid("adj"), action: "refund", type: "full", status: "approved", transaction_id: bTxn.id, subscription_id: bSub.id, items: [] };
    w.paddle.adjs.set(adj.id, adj);
    const e = event("adjustment.updated", { id: adj.id }), r = await w.post(e);
    const after = w.licence(lic.id), aDay = new Date(aEnds + GRACE).toISOString().slice(0, 10);
    ck(r.status === 200 && w.outcome(e) === "refund-one-source" && (released.invoiced_until || 0) === 0 && after.paid_until === aEnds + GRACE
      && after.updates_until === aDay && after.refunded === 0,
      "P21e a released payment is no invoice: after its full refund paid_until and updates_until fall to A's own subscription's, no later: "
      + JSON.stringify({ outcome: w.outcome(e), invoiced: released.invoiced_until, paid: (after.paid_until - T0) / DAY, updates: after.updates_until, want: aDay }));
  });

  /* REVIEW 47, FINDINGS 8 AND 12. The operator's attach tool, on the same stand-in the release above uses. Finding 8: a held
     subscription released onto an annual licence with --paid-until keeps that day's own end, not the licence's. Finding 12: --renew
     settles a cancelled subscription whose own paid end has passed before it writes the invoice's totals, so those seats are not
     subtracted; one still inside its paid time is left. */
  await leg("P90", async () => {
    const paidNamed = day => Date.parse(day + "T00:00:00Z") + DAY - 1;
    const monthDay = "2026-12-14", monthEnd = paidNamed(monthDay);
    const copy = "(SELECT paid_until FROM licences WHERE id = ";
    const settle = "UPDATE pay_subs SET seats = 0, lead_seats = 0, updated_at = ";
    const attach = async (w, code, o) => {
      const made = await w.AT.makeAttachSql(Object.assign({ owner: code, org: "Acme by invoice", provider: "google", domain: "acme.example", orgKeyed: ORG_ACME,
        leadSeats: 1, seats: 3, order: "INV-P90-" + (++tick) }, o || {}), w.clock.now);
      w.db.raw.exec(made.sql);
      return made;
    };
    const releaseOnto = async (paidUntil, periodEnd) => {
      const w = world(K);
      const b = await signin(w, "p90b-" + (++tick), "acme.example");
      const a = await buy(w, "p90a-" + (++tick), [[PRICE.leadYear, 1], [PRICE.deskYear, 2]]);
      const lic = w.paidOf(a.buyer.person)[0];
      const annual = w.licence(lic.id).paid_until;
      const bSub = subscription(w, UNHELD_CODE, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 3]]);
      const bTxn = transaction(w, bSub, T0 + 30 * DAY);
      const e = event("transaction.completed", { id: bTxn.id });
      await w.post(e);
      const made = await attach(w, a.buyer.me, Object.assign({ leadSeats: 1, seats: 3, paddleSub: bSub.id, paddleTxn: bTxn.id, paddleBuyer: b.me },
        Object.assign(paidUntil ? { paidUntil } : {}, periodEnd ? { payPeriodEnd: periodEnd } : {})));
      const row = w.db.raw.prepare("SELECT paid_until FROM pay_subs WHERE sub = ?").get(bSub.id) || {};
      return { annual, made, row, raised: w.licence(lic.id), held: w.outcome(e) };
    };
    const on = await releaseOnto(monthDay, monthDay);
    ck(on.held === "held:unknown-code" && on.row.paid_until === monthEnd && on.raised.paid_until === on.annual && on.annual !== monthEnd
      && on.made.sql.indexOf(copy) < 0 && on.made.sql.indexOf(String(monthEnd)) > 0 && on.made.sql.indexOf(settle) < 0,
      "P90a a held monthly subscription released onto an annual licence with --paid-until and --pay-period-end of the same day records that day's end, not the licence's, and no renewal settle is printed: "
      + JSON.stringify({ held: on.held, sub: on.row.paid_until, want: monthEnd, licence: on.raised.paid_until, copied: on.made.sql.indexOf(copy) >= 0 }));
    const off = await releaseOnto(null, monthDay);
    ck(off.row.paid_until === monthEnd && off.raised.paid_until === off.annual && off.annual !== monthEnd
      && off.made.sql.indexOf(copy) < 0 && off.made.sql.indexOf(settle) < 0,
      "P90b control: with --pay-period-end and no --paid-until the released subscription's paid end is that day's end, the licence's dates are left as they were, and the licence's end is copied nowhere: "
      + JSON.stringify({ sub: off.row.paid_until, want: monthEnd, licence: off.raised.paid_until, annual: off.annual }));
    const wFresh = world(K);
    const c = await signin(wFresh, "p90-fresh", "acme.example");
    const freshSub = subscription(wFresh, UNHELD_CODE, [[PRICE.deskMonth, 2]]);
    const freshTxn = transaction(wFresh, freshSub, T0 + 30 * DAY);
    await attach(wFresh, c.me, { leadSeats: 1, seats: 2, paidUntil: monthDay, payPeriodEnd: monthDay, paddleSub: freshSub.id, paddleTxn: freshTxn.id });
    const freshPerson = (wFresh.db.raw.prepare("SELECT person FROM persons WHERE code = ?").get(c.me) || {}).person;
    const fresh = (freshPerson && wFresh.paidOf(freshPerson)[0]) || {};
    const freshRow = wFresh.db.raw.prepare("SELECT paid_until FROM pay_subs WHERE sub = ?").get(freshSub.id) || {};
    ck(fresh.paid_until === monthEnd && freshRow.paid_until === fresh.paid_until,
      "P90c a fresh licence made by the same release carries that same paid end, on the licence and on the subscription: "
      + JSON.stringify({ licence: fresh.paid_until, sub: freshRow.paid_until, want: monthEnd }));
    const passed = async (name, ends) => {
      const w = world(K);
      const p = await buy(w, name, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 2]], { ends });
      const id = (w.paidOf(p.buyer.person)[0] || {}).id;
      p.sub.status = "canceled";
      await w.post(event("subscription.canceled", { id: p.sub.id }));
      const before = w.db.raw.prepare("SELECT lead_seats, seats, status, paid_until FROM pay_subs WHERE sub = ?").get(p.sub.id) || {};
      return { w, p, id, before };
    };
    /* inForceCol is the service's expression (pay.mjs). The stand-in binds `?`, not D1's `?N`, so the instant and the id go in as whole numbers. */
    const inForce = (w, id) => w.db.raw.prepare("SELECT " + inForceCol("lead_seats", "l.id", String(w.clock.now), "l") + " AS lead, "
      + inForceCol("seats", "l.id", String(w.clock.now), "l") + " AS desk FROM licences l WHERE l.id = " + Number(id)).get() || {};
    const late = await passed("p90-late", T0 + 30 * DAY);
    late.w.clock.now = late.before.paid_until + 1;
    const yearDay = new Date(late.w.clock.now + 365 * DAY).toISOString().slice(0, 10);
    const renewed = await attach(late.w, late.p.buyer.me, { renew: true, leadSeats: 2, seats: 5, paidUntil: yearDay });
    const force = inForce(late.w, late.id);
    const renewLine = renewed.sql.split("\n").find(s => s.indexOf(settle) === 0) || "";
    const raiseAt = renewed.sql.split("\n").findIndex(s => s.indexOf("UPDATE licences SET ") === 0);
    const settleAt = renewed.sql.split("\n").findIndex(s => s.indexOf(settle) === 0);
    ck(late.before.status === "canceled" && late.before.lead_seats === 1 && late.before.seats === 2 && late.before.paid_until < late.w.clock.now
      && force.lead === 2 && force.desk === 5 && settleAt >= 0 && settleAt < raiseAt
      && renewLine.indexOf("status = 'canceled' AND paid_until <= ") > 0 && renewLine.indexOf("EXISTS (SELECT 1 FROM orders WHERE tag = ") > 0,
      "P90d --renew of a passed cancelled subscription (1 lead, 2 desks) to 2 and 5 leaves those seats in force, the settle printed before the raise: "
      + JSON.stringify({ before: [late.before.lead_seats, late.before.seats], inForce: [force.lead, force.desk], settleAt, raiseAt }));
    const kept = await passed("p90-keep", T0 + 365 * DAY);
    const keptMade = await attach(kept.w, kept.p.buyer.me, { renew: true, leadSeats: 2, seats: 5, paidUntil: "2027-11-14" });
    const afterKept = kept.w.db.raw.prepare("SELECT lead_seats, seats, paid_until FROM pay_subs WHERE sub = ?").get(kept.p.sub.id) || {};
    ck(kept.before.status === "canceled" && kept.before.paid_until > kept.w.clock.now && kept.before.lead_seats === 1 && kept.before.seats === 2
      && afterKept.lead_seats === 1 && afterKept.seats === 2 && afterKept.paid_until === kept.before.paid_until,
      "P90e control: a cancelled subscription still inside its paid time is not zeroed by --renew: "
      + JSON.stringify({ before: [kept.before.lead_seats, kept.before.seats, kept.before.paid_until > kept.w.clock.now], after: [afterKept.lead_seats, afterKept.seats], sql: keptMade.sql.indexOf(settle) >= 0 }));
    /* P90f (review 4, finding 11; Claude alpha, 2026-11-19: the attach tool reads no refund, so it is recorded in its header rather than guarded):
       a subscription attached once and then refunded is known, and attaching it again changes nothing, refunded or not. */
    const rf = world(K);
    const rb = await signin(rf, "p90f-b", "acme.example");
    const ra = await buy(rf, "p90f-a", [[PRICE.leadYear, 1], [PRICE.deskYear, 2]]);
    const rSub = subscription(rf, UNHELD_CODE, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 3]]);
    const rTxn = transaction(rf, rSub, T0 + 30 * DAY);
    await rf.post(event("transaction.completed", { id: rTxn.id }));
    const rOne = { owner: ra.buyer.me, org: "Acme by invoice", provider: "google", domain: "acme.example", orgKeyed: ORG_ACME, leadSeats: 1, seats: 3,
      payPeriodEnd: monthDay, paddleSub: rSub.id, paddleTxn: rTxn.id, paddleBuyer: rb.me };
    rf.db.raw.exec((await rf.AT.makeAttachSql(Object.assign({ order: "INV-P90f-1" }, rOne), rf.clock.now)).sql);
    const rAdj = { id: pid("adj"), action: "refund", type: "full", status: "approved", transaction_id: rTxn.id, subscription_id: rSub.id, items: [] };
    rf.paddle.adjs.set(rAdj.id, rAdj);
    const rEv = event("adjustment.updated", { id: rAdj.id });
    await rf.post(rEv);
    const rRow = () => rf.db.raw.prepare("SELECT status FROM pay_subs WHERE sub = ?").get(rSub.id) || {};
    const rBefore = rf.state();
    rf.db.raw.exec((await rf.AT.makeAttachSql(Object.assign({ order: "INV-P90f-2" }, rOne), rf.clock.now)).sql);
    ck(rRow().status === "refunded" && rf.state() === rBefore,
      "P90f a subscription attached once and then refunded is refused a second attach: the row stays refunded and the database is unchanged: "
      + JSON.stringify({ refund: rf.outcome(rEv), status: rRow().status, same: rf.state() === rBefore }));
    /* P90g and P90h (the test architect's read of fold 86, class C): the provider's own period end, named apart from the licence's dates, is
       what the subscription's row records, so a rise inside that period is a rise and not an earlier notice that keeps the held count. */
    const inPeriod = async periodEnd => {
      const w = world(K);
      const b = await signin(w, "p90h-b" + (++tick), "acme.example");
      const a = await buy(w, "p90h-a" + (++tick), [[PRICE.leadYear, 1], [PRICE.deskYear, 2]]);
      const lic = w.paidOf(a.buyer.person)[0];
      const annual = w.licence(lic.id).paid_until;
      const sub = subscription(w, UNHELD_CODE, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 3]]);
      const txn = transaction(w, sub, T0 + 30 * DAY);
      await w.post(event("transaction.completed", { id: txn.id }));
      const made = await attach(w, a.buyer.me, Object.assign({ leadSeats: 1, seats: 3, paddleSub: sub.id, paddleTxn: txn.id, paddleBuyer: b.me },
        periodEnd ? { payPeriodEnd: periodEnd } : {}));
      const row = () => w.db.raw.prepare("SELECT lead_seats, seats, paid_until FROM pay_subs WHERE sub = ?").get(sub.id) || {};
      const first = row();
      sub.custom_data = { etiuda_code: b.me };
      const seatsBefore = w.licence(lic.id).seats;
      sub.items = itemsOf([[PRICE.leadMonth, 1], [PRICE.deskMonth, 4]]);
      const rise = transaction(w, sub, T0 + 30 * DAY, { origin: "subscription_update", items: itemsOf([[PRICE.deskMonth, 1]]).map(i => ({ price: i.price, quantity: i.quantity })) });
      const ev = event("transaction.completed", { id: rise.id });
      await w.post(ev);
      return { made, annual, first, after: row(), outcome: w.outcome(ev), licence: w.licence(lic.id), seatsBefore };
    };
    const named = await inPeriod(monthDay);
    ck(named.first.paid_until === monthEnd && named.licence.paid_until === named.annual && named.annual !== monthEnd && named.made.sql.indexOf(copy) < 0,
      "P90g --pay-period-end records that day's end as the subscription's paid end and leaves the licence's dates alone: "
      + JSON.stringify({ sub: named.first.paid_until, want: monthEnd, licence: named.licence.paid_until, annual: named.annual, copied: named.made.sql.indexOf(copy) >= 0 }));
    ck(named.outcome === "applied" && named.after.seats === 4 && named.after.lead_seats === 1 && named.licence.seats === named.seatsBefore + 1,
      "P90h one more desk added inside the attached subscription's period is applied: the subscription then holds 1 lead and 4 desks, and a notice is no earlier than the paid end it was attached with: "
      + JSON.stringify({ outcome: named.outcome, before: [named.first.lead_seats, named.first.seats], after: [named.after.lead_seats, named.after.seats], licence: [named.seatsBefore, named.licence.seats] }));
    /* P90i (the test architect's, fold 86): a held payment attached with --paddle-sub (--pay-sub) and no --pay-period-end is refused, so the licence's
       own end is never copied into the subscription's row by one omission (class C). */
    const wi = world(K);
    const bi = await signin(wi, "p90i-b" + (++tick), "acme.example");
    const ai = await buy(wi, "p90i-a" + (++tick), [[PRICE.leadYear, 1], [PRICE.deskYear, 2]]);
    const subI = subscription(wi, UNHELD_CODE, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 3]]);
    const txnI = transaction(wi, subI, T0 + 30 * DAY);
    await wi.post(event("transaction.completed", { id: txnI.id }));
    const stateI = wi.state();
    const askI = async extra => {
      try {
        const made = await wi.AT.makeAttachSql(Object.assign({ owner: ai.buyer.me, org: "Acme by invoice", provider: "google", domain: "acme.example", orgKeyed: ORG_ACME,
          leadSeats: 1, seats: 3, order: "INV-P90i-" + (++tick), paddleSub: subI.id, paddleTxn: txnI.id, paddleBuyer: bi.me }, extra), wi.clock.now);
        return made.sql;
      } catch (e) { return /--pay-period-end/.test(e.message) ? "refused" : "other: " + e.message.slice(0, 80); }
    };
    const noEnd = await askI({}), noEndWithPaid = await askI({ paidUntil: monthDay }), withEnd = await askI({ payPeriodEnd: monthDay });
    ck(noEnd === "refused" && noEndWithPaid === "refused" && withEnd !== "refused" && withEnd.indexOf("INSERT INTO pay_subs") >= 0 && wi.state() === stateI,
      "P90i --paddle-sub without --pay-period-end is refused, whether or not --paid-until is named, and nothing is written; with it the statements are printed: "
      + JSON.stringify({ noEnd: noEnd.slice(0, 80), noEndWithPaid: noEndWithPaid.slice(0, 80), withEnd: withEnd.slice(0, 20), same: wi.state() === stateI }));
  });

  /* P91 (register 47.7; review 47, finding 7): a licence the operator's release makes is a subscription-only licence as the route's own first purchase
     makes one, so the subscription-only rules (a sole source's refund ends it, a lead seat only a live subscription holds, a renewal on the floor
     the refund left) apply to it; the tool records it by its key, as the route's licences are, and an invoiced licence stays what it was. */
  await leg("P91", async () => {
    const monthDay = "2026-12-14";
    const released = async (name, items, o) => {
      const w = world(K);
      const b = await signin(w, name, "acme.example");
      const sub = subscription(w, UNHELD_CODE, items);
      const txn = transaction(w, sub, T0 + 30 * DAY);
      await w.post(event("transaction.completed", { id: txn.id }));
      const made = await w.AT.makeAttachSql(Object.assign({ owner: b.me, org: "Acme by release", provider: "google", domain: "acme.example", orgKeyed: ORG_ACME,
        leadSeats: 1, seats: 2, order: "REL-" + (++tick), payPeriodEnd: monthDay, paddleSub: sub.id, paddleTxn: txn.id, paddleBuyer: b.me }, o || {}), w.clock.now);
      w.db.raw.exec(made.sql);
      sub.custom_data = { etiuda_code: b.me }; /* the payer corrects the code in the provider's dashboard, as P21 does */
      const lic = w.db.raw.prepare("SELECT l.id AS id FROM admits a JOIN licences l ON l.id = a.licence WHERE a.org = ? AND l.trial_ends IS NULL").get(ORG_ACME) || {};
      return { w, b, sub, txn, made, id: lic.id };
    };
    const refund = async (r, ev) => {
      const adj = { id: pid("adj"), action: "refund", type: "full", status: "approved", transaction_id: r.txn.id, subscription_id: r.sub.id, items: [] };
      r.w.paddle.adjs.set(adj.id, adj);
      const e = event("adjustment.updated", { id: adj.id });
      await r.w.post(e);
      return e;
    };
    /* a: the sole released subscription's full refund ends its licence, then its next period gives it back on its own 1 lead and 2 desks, not on a floor it left. */
    const a = await released("p91-a", [[PRICE.leadMonth, 1], [PRICE.deskMonth, 2]]);
    const keyed = (a.w.licence(a.id) || {}).key_hash || "";
    const ae = await refund(a);
    const ended = a.w.licence(a.id) || {};
    const renewal = transaction(a.w, a.sub, T0 + 60 * DAY, { origin: "subscription_recurring" });
    const re = event("transaction.completed", { id: renewal.id });
    await a.w.post(re);
    const back = a.w.licence(a.id) || {};
    ck(/^paddle:/.test(keyed) && a.w.outcome(ae) === "applied" && ended.refunded === 1 && a.w.outcome(re) === "restored" && back.refunded === 0 && back.seats === 2 && back.lead_seats === 1,
      "P91a a licence made by releasing a held subscription is the subscription's own: its full refund ends it, and its next period gives it back on 1 lead and 2 desks, not 2 and 3: "
      + JSON.stringify({ key: keyed.slice(0, 7), refund: a.w.outcome(ae), refunded: ended.refunded, renewal: a.w.outcome(re), seats: back.seats, lead: back.lead_seats }));
    /* b: a cancelled-and-lapsed released subscription, then its late renewal, leaves the counts as paid. */
    const c = await released("p91-c", [[PRICE.leadMonth, 1], [PRICE.deskMonth, 2]]);
    c.w.clock.now = T0 + 31 * DAY + GRACE + DAY; /* the cancel notice arrives after the period it paid has run out */
    c.sub.status = "canceled";
    await c.w.post(event("subscription.canceled", { id: c.sub.id }));
    const late = transaction(c.w, c.sub, T0 + 60 * DAY, { origin: "subscription_recurring" });
    c.sub.status = "active";
    const le = event("transaction.completed", { id: late.id });
    await c.w.post(le);
    const lateLic = c.w.licence(c.id) || {};
    ck(lateLic.seats <= 2 && lateLic.lead_seats <= 1,
      "P91b a released subscription cancelled and lapsed, then renewed late, holds 1 lead and 2 desks, not 2 and 3: "
      + JSON.stringify({ outcome: c.w.outcome(le), seats: lateLic.seats, lead: lateLic.lead_seats }));
    /* c: control, an invoice attached by hand stays an invoiced licence: keyed by its order, with its own dates, so none of the subscription-only rules take it. */
    const wi = world(K);
    const oi = await signin(wi, "p91-i", "acme.example");
    const inv = await attachByHand(wi, oi.me, { paidUntil: "2027-12-31" });
    const il = wi.db.raw.prepare("SELECT key_hash, invoiced_until FROM licences WHERE id = ?").get((inv || {}).id) || {};
    ck(/^attach:/.test(il.key_hash || "") && il.invoiced_until > 0,
      "P91c control: an invoice attached by hand makes its licence as before, keyed by its order and invoiced: " + JSON.stringify({ key: String(il.key_hash).slice(0, 7), invoiced: il.invoiced_until > 0 }));
  });

  await leg("P22", async () => {
    const w = world(K);
    const dsc = pid("dsc");
    const free = await buy(w, "p22-free", [[PRICE.leadYear, 1], [PRICE.deskYear, 4]], { txn: { discount_id: dsc, details: { totals: { subtotal: "549600", discount: "549600", total: "0", grand_total: "0" } } } });
    const lic = w.paidOf(free.buyer.person)[0] || {};
    const e1 = w.db.raw.prepare("SELECT outcome FROM pay_events WHERE outcome LIKE 'zero-total:%'").all().map(r => r.outcome);
    ck(free.r.status === 200 && lic.seats === 4 && lic.paid_until === T0 + 365 * DAY + GRACE && e1.join() === "zero-total:" + dsc,
      "P22a a transaction completed at a total of zero under a full discount is applied as any other, and listed with its discount's id: "
      + JSON.stringify({ seats: lic.seats, outcomes: e1 }));
    const w2 = world(K);
    const buyer = await signin(w2, "p22-trial", "acme.example");
    const sub = subscription(w2, buyer.me, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 2]], { status: "trialing" });
    sub.items.forEach(i => { i.status = "trialing"; });
    const trialEnds = T0 + 14 * DAY;
    const t = transaction(w2, sub, trialEnds, { details: { totals: { total: "0", grand_total: "0" } } });
    const e2 = event("transaction.completed", { id: t.id }), r2 = await w2.post(e2);
    const lic2 = w2.paidOf(buyer.person)[0] || {};
    ck(r2.status === 200 && lic2.seats === 2 && lic2.paid_until === trialEnds + GRACE && w2.outcome(e2) === "zero-total:no-discount",
      "P22b a trial on a price (the subscription and its items trialing, the total zero) is applied to the trial's end plus 14 days and listed: "
      + JSON.stringify({ outcome: w2.outcome(e2), paid: (lic2.paid_until - T0) / DAY }));
  });

  await leg("P23", async () => {
    /* Decision 48 (Claude alpha, 2026-11-13): one provider switched on, the other dead-safe behind an unset variable. */
    const outs = [];
    for (const [label, env, path, want] of [["unset", { PAY_PROVIDERS: undefined }, "pay/paddle", 404], ["empty", { PAY_PROVIDERS: "" }, "pay/paddle", 404],
        ["stripe alone on", { PAY_PROVIDERS: "stripe" }, "pay/paddle", 404], ["a name no provider has", { PAY_PROVIDERS: "paddle,bogus" }, "pay/paddle", 500], ["paddle on, stripe asked", { PAY_PROVIDERS: "paddle" }, "pay/stripe", 404],
        ["the old path", { PAY_PROVIDERS: "paddle" }, "paddle", 404], ["no such provider", { PAY_PROVIDERS: "paddle" }, "pay/nobody", 404]]) {
      const w = world(K, { env });
      if (env.PAY_PROVIDERS === undefined) delete w.env.PAY_PROVIDERS;
      const s0 = subscription(w, "0123456789ABCDEF", [[PRICE.deskMonth, 1]]);
      const r = await w.post(event("subscription.updated", { id: s0.id }), { path, noAudit: true });
      outs.push(label + ":" + r.status + ":" + r.d1 + ":" + r.paddle + (r.status === want ? "" : " (want " + want + ")"));
    }
    ck(outs.every(o => !/want/.test(o)) && outs.filter(o => /:404:/.test(o)).every(o => /:404:0:0/.test(o)),
      "P23a a provider PAY_PROVIDERS does not name answers \"not there\" (404), signed or not, with no D1 call and no API call; a name no"
      + " provider has is a misconfiguration (500); Paddle's old path is gone (label:status:d1:api): " + outs.join(", "));
    const w2 = world(K);
    const s2 = subscription(w2, "0123456789ABCDEF", [[PRICE.deskMonth, 1]]);
    const on = await w2.post(event("subscription.updated", { id: s2.id }), { noAudit: true });
    ck(on.status === 200 && on.paddle === 1, "P23b control: with PAY_PROVIDERS naming paddle, pay/paddle answers and reads Paddle: " + on.status + " " + on.paddle);
  });

  await leg("P24", async () => {
    /* The organisation Paddle's order carries is judged by the check Stripe's typed name is (pay.mjs typedOrg), and treated as Stripe's
       binding treats it (Grok's review 6, finding 5A): a control that reorders or breaks what Studio shows beside it, or a name past
       200 characters, takes the default, the payment applied and listed "org-name"; a blank one takes the default unlisted; an ordinary
       name with letters beyond ASCII is kept. */
    const w = world(K);
    const outs = [];
    for (const [label, org, want] of [["right-to-left override", "Acme \u202Eslooc", "org-name"], ["isolate", "Acme \u2066Tools\u2069", "org-name"], ["mark", "Acme\u200F Tools", "org-name"],
        ["line separator", "Acme\u2028Tools", "org-name"], ["C1 control", "Acme\u0085Tools", "org-name"], ["byte order mark inside", "Ac\uFEFFme", "org-name"],
        ["201 characters", "A".repeat(201), "org-name"], ["blank", "   ", "applied"], ["empty", "", "applied"]]) {
      const buyer = await signin(w, "p24-" + outs.length, "acme" + outs.length + ".example");
      const sub = subscription(w, buyer.me, [[PRICE.leadYear, 1], [PRICE.deskYear, 1]]);
      const txn = transaction(w, sub, T0 + 365 * DAY, { custom_data: { etiuda_code: buyer.me, org } });
      const e = event("transaction.completed", { id: txn.id });
      const r = await w.post(e);
      const lic = w.paidOf(buyer.person)[0] || {};
      outs.push(label + ":" + r.status + ":" + w.outcome(e) + ":" + (lic.org === "Etiuda" ? "default" : JSON.stringify(lic.org === undefined ? null : lic.org.length)) + (w.outcome(e) === want ? "" : " (want " + want + ")"));
    }
    ck(outs.every(o => /:200:[a-z-]+:default$/.test(o)),
      "P24a an organisation carrying a bidirectional control, a mark, a separator, a C1 control or U+FEFF, or past 200 characters, takes the default name,"
      + " applied and listed \"org-name\"; a blank or empty one takes it unlisted; never held: " + outs.join(", "));
    const ok = await signin(w, "p24-ok", "zaklad.example");
    const sub = subscription(w, ok.me, [[PRICE.leadYear, 1], [PRICE.deskYear, 1]]);
    const r = await paid(w, transaction(w, sub, T0 + 365 * DAY, { custom_data: { etiuda_code: ok.me, org: "  Zak\u0142ad \u017B\u00F3\u0142ty & Syn  " } }));
    const lic = w.paidOf(ok.person)[0] || {};
    ck(r.status === 200 && lic.org === "Zak\u0142ad \u017B\u00F3\u0142ty & Syn",
      "P24b control: an ordinary name with Polish letters and an ampersand is kept, trimmed: " + r.status + " " + JSON.stringify(lic.org === undefined ? null : lic.org.length));
  });

  /* A MANAGED TENANT'S ACCOUNT (decision 49; Claude alpha, 2026-11-13 21:34: "a person of that tenant must never be able to pay for a
     licence they cannot then use"). The organisation's licence is turned to seats that follow Entra as the attach's --entra-roles turns
     one; Google's domain stands in for a Microsoft tenant, since the route reads only the licence and the organisation the account
     signed in from. */
  await leg("P25", async () => {
    const w = world(K);
    const b = await signin(w, "p24-b", "acme.example"), a = await signin(w, "p24-a", "acme.example");
    const lic = await attachByHand(w, a.me);
    w.db.raw.prepare("UPDATE licences SET seat_source = 'entra', entra_at = ? WHERE id = ?").run(w.clock.now, lic.id);
    const before = w.stateExcept("pay_events");
    const s1 = subscription(w, b.me, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]]), e1 = event("transaction.completed", { id: transaction(w, s1, T0 + 365 * DAY).id });
    const s2 = subscription(w, b.me, [[PRICE.oneYear, 1]]), e2 = event("transaction.completed", { id: transaction(w, s2, T0 + 365 * DAY).id });
    const r1 = await w.post(e1), r2 = await w.post(e2);
    const unchanged = w.stateExcept("pay_events") === before;
    const listed = w.db.raw.prepare("SELECT COUNT(*) AS n FROM pay_events WHERE outcome = 'held:managed'").get().n;
    const c = await buy(w, "p24-c", [[PRICE.oneYear, 1]], { hd: null });
    ck(r1.status === 200 && r2.status === 200 && w.outcome(e1) === "held:managed" && w.outcome(e2) === "held:managed" && unchanged && listed === 2
      && w.paidOf(c.buyer.person).length === 1,
      "P25 a first purchase, a team's or one person's, by an account of a tenant whose licence follows Entra is held \"managed\" and listed,"
      + " changing nothing; a personal account's purchase beside it is applied: " + [w.outcome(e1), w.outcome(e2), unchanged, listed, w.paidOf(c.buyer.person).length].join(" "));
  });

  /* A REFUND THAT ARRIVES BEFORE ITS PAYMENT (Grok's review 6, finding 1): Paddle "can't guarantee the order of delivery", and a
     transaction stays "completed" after its refund. */
  await leg("P26", async () => {
    const w = world(K);
    const e1 = T0 + 30 * DAY, e2 = T0 + 60 * DAY;
    const p = await buy(w, "p26", [[PRICE.leadMonth, 1], [PRICE.deskMonth, 3]], { ends: e1 });
    const id = (w.paidOf(p.buyer.person)[0] || {}).id;
    const ren = transaction(w, p.sub, e2, { origin: "subscription_recurring" });
    const full = (sub, txn) => { const a = { id: pid("adj"), action: "refund", type: "full", status: "approved", transaction_id: txn.id, subscription_id: sub.id, items: [] }; w.paddle.adjs.set(a.id, a); return a; };
    const ea = event("adjustment.updated", { id: full(p.sub, ren).id }), ra = await w.post(ea);
    const ep = event("transaction.completed", { id: ren.id }), rp = await w.post(ep);
    const lic = w.licence(id) || {};
    ck(ra.status === 200 && w.outcome(ea) === "held:payment-unknown" && rp.status === 200 && w.outcome(ep) === "held:refunded" && lic.paid_until === e1 + GRACE && lic.refunded === 0,
      "P26a a renewal refunded whole whose adjustment arrives first: the refund is held \"payment-unknown\", and the renewal, its adjustment read back, is held"
      + " \"refunded\" and extends nothing: " + JSON.stringify({ refund: w.outcome(ea), payment: w.outcome(ep), paid: lic.paid_until && (lic.paid_until - T0) / DAY }));
    const b = await signin(w, "p26-b", "acme26.example");
    const sub = subscription(w, b.me, [[PRICE.deskYear, 2], [PRICE.leadYear, 1]]), txn = transaction(w, sub, T0 + 365 * DAY);
    const fa = event("adjustment.updated", { id: full(sub, txn).id }); await w.post(fa);
    const fp = event("transaction.completed", { id: txn.id }), rfp = await w.post(fp);
    ck(rfp.status === 200 && w.outcome(fa) === "held:payment-unknown" && w.outcome(fp) === "held:refunded" && w.paidOf(b.person).length === 0
      && !w.db.raw.prepare("SELECT 1 FROM pay_subs WHERE provider = 'paddle' AND sub = ?").get(sub.id),
      "P26b a first payment refunded whole whose adjustment arrives first, before the subscription is known here: held both, no licence made: "
      + [w.outcome(fa), w.outcome(fp), w.paidOf(b.person).length].join(" "));
  });

  /* SEATS ARE WHAT THE PAID TRANSACTION BILLED (Grok's review 6, finding 2). */
  await leg("P27", async () => {
    const w = world(K);
    const b = await signin(w, "p27-b", "acme27.example");
    const sub = subscription(w, b.me, [[PRICE.leadYear, 1], [PRICE.deskYear, 1]]), txn = transaction(w, sub, T0 + 365 * DAY);
    sub.items = itemsOf([[PRICE.leadYear, 1], [PRICE.deskYear, 100]]).concat([{ status: "trialing", quantity: 4, price: { id: PRICE.leadMonth, billing_cycle: CYCLE(PRICE.leadMonth) } }]);
    await paid(w, txn);
    const lic = w.paidOf(b.person)[0] || {};
    ck(lic.seats === 1 && lic.lead_seats === 1,
      "P27a a first transaction billing 1 lead and 1 desk, the subscription at 100 desks and a trialing lead item it did not bill: 1 and 1: "
      + JSON.stringify({ seats: lic.seats, lead: lic.lead_seats }));
    const p = await buy(w, "p27-p", [[PRICE.leadYear, 1], [PRICE.deskYear, 5]]);
    const id = (w.paidOf(p.buyer.person)[0] || {}).id;
    p.sub.items = itemsOf([[PRICE.leadYear, 1], [PRICE.deskYear, 8]]);
    const whole = transaction(w, p.sub, T0 + 365 * DAY, { origin: "subscription_update" });
    await paid(w, whole);
    const afterWhole = (w.licence(id) || {}).seats;
    p.sub.items = itemsOf([[PRICE.leadYear, 1], [PRICE.deskYear, 100]]);
    const diff = transaction(w, p.sub, T0 + 365 * DAY, { origin: "subscription_update", items: [{ price: { id: PRICE.deskYear, billing_cycle: CYCLE(PRICE.deskYear) }, quantity: 2 }] });
    await paid(w, diff);
    ck(afterWhole === 8 && (w.licence(id) || {}).seats === 10,
      "P27b a rise billing the whole 8 gives 8; a rise billing 2 on top, the subscription at 100, gives 8 + 2, never 100: " + afterWhole + " " + (w.licence(id) || {}).seats);
  });

  /* A CANCEL OF A SOLE SUBSCRIPTION (Grok's review 6, finding 4): every seat it paid for stays to its own date; P10c and P18b keep the
     cancel that peels one subscription off a licence another source pays for. */
  await leg("P28", async () => {
    const w = world(K);
    const p = await buy(w, "p28", [[PRICE.leadYear, 1], [PRICE.deskYear, 4]]);
    const id = (w.paidOf(p.buyer.person)[0] || {}).id, was = w.licence(id) || {};
    p.sub.status = "canceled";
    const ce = event("subscription.canceled", { id: p.sub.id }), cr = await w.post(ce);
    const kept = w.licence(id) || {};
    ck(cr.status === 200 && kept.seats === 4 && kept.lead_seats === 1 && kept.paid_until === was.paid_until && kept.refunded === 0,
      "P28a a sole subscription canceled keeps its 4 desks and its lead to its own paid date: " + JSON.stringify({ seats: kept.seats, lead: kept.lead_seats }));
    w.clock.now = was.paid_until + DAY;
    const sub = subscription(w, p.buyer.me, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]]);
    await paid(w, transaction(w, sub, w.clock.now + 365 * DAY));
    const back = w.licence(id) || {};
    ck(w.paidOf(p.buyer.person).length === 1 && back.seats === 2 && back.lead_seats === 1,
      "P28b bought again after it lapsed, the licence is raised in place to the new 2 desks, nothing carried: " + JSON.stringify({ seats: back.seats, lead: back.lead_seats }));
    const w2 = world(K);
    const m = await buy(w2, "p28c", [[PRICE.leadMonth, 1], [PRICE.deskMonth, 4]], { ends: T0 + 30 * DAY });
    const mid = (w2.paidOf(m.buyer.person)[0] || {}).id;
    await callSigned(w2, "licence/set", m.buyer.lead, { orgDesks: true }, RQ.licenceSetBytes);
    w2.clock.now = T0 + 30 * DAY;
    m.sub.status = "canceled";
    await w2.post(event("subscription.canceled", { id: m.sub.id }));
    w2.clock.now = T0 + 31 * DAY;
    const ySub = subscription(w2, m.buyer.me, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]]);
    await paid(w2, transaction(w2, ySub, T0 + 396 * DAY));
    w2.clock.now = T0 + 32 * DAY;
    await renewOwner(w2, "p28c", "acme.example", m.buyer.lead);
    const ckMid = await quietCheck(w2, m.buyer.lead);
    const listMid = await callSigned(w2, "seat/list", m.buyer.lead, {}, RQ.seatListBytes);
    const l2 = await signin(w2, "p28c-l2", "acme.example"), l3 = await signin(w2, "p28c-l3", "acme.example");
    const nameL2 = await callSigned(w2, "lead/name", m.buyer.lead, { code: l2.me }, RQ.leadNameBytes);
    await callSigned(w2, "lead/accept", l2.lead, {}, RQ.leadAcceptBytes); /* the named person presses Accept: their own trial of 14 days is set aside only by that press */
    const ckL2 = await quietCheck(w2, l2.lead);
    const nameL3 = await callSigned(w2, "lead/name", m.buyer.lead, { code: l3.me }, RQ.leadNameBytes);
    const desksMid = [];
    for (let i = 1; i <= 6; i++) desksMid.push(await deskSignin(w2, "p28c-d" + i, "acme.example", edKey()));
    deskTrialHad(w2, "p28c-d7");
    const d7 = await deskSignin(w2, "p28c-d7", "acme.example", edKey());
    w2.clock.now = T0 + 44 * DAY;
    const ck44 = await quietCheck(w2, m.buyer.lead);
    const list44 = await callSigned(w2, "seat/list", m.buyer.lead, {}, RQ.seatListBytes);
    const l2Drop44 = await quietCheck(w2, l2.lead);
    await callSigned(w2, "seat/free", m.buyer.lead, { kind: "lead", person: l2.me }, RQ.seatFreeBytes);
    const nameL3At44 = await callSigned(w2, "lead/name", m.buyer.lead, { code: l3.me }, RQ.leadNameBytes);
    for (let i = 2; i < 6; i++) if (desksMid[i].body && desksMid[i].body.certificate)
      await callSigned(w2, "seat/free", m.buyer.lead, { kind: "desk", person: desksMid[i].body.certificate.person }, RQ.seatFreeBytes);
    deskTrialHad(w2, "p28c-d8");
    const d8 = await deskSignin(w2, "p28c-d8", "acme.example", edKey());
    w2.clock.now = T0 + 396 * DAY;
    w2.env.DELEGATION = JSON.stringify(delegation({ from: w2.clock.now - 10 * DAY, until: w2.clock.now + 300 * DAY }));
    await paid(w2, transaction(w2, ySub, T0 + 761 * DAY, { origin: "subscription_recurring" }));
    await renewOwner(w2, "p28c", "acme.example", m.buyer.lead);
    const afterRen = w2.licence(mid) || {};
    const oldSub = w2.db.raw.prepare("SELECT lead_seats, seats FROM pay_subs WHERE provider = 'paddle' AND sub = ?").get(m.sub.id) || {};
    const ckRen = await quietCheck(w2, m.buyer.lead);
    const listRen = await callSigned(w2, "seat/list", m.buyer.lead, {}, RQ.seatListBytes);
    const midOk = !!ckMid.body && await licenceHolds(ckMid.body.licence) && ckMid.body.licence.seats === 6
      && listMid.status === 200 && listMid.body.counts.lead.of === 2 && listMid.body.counts.desk.of === 6
      && nameL2.status === 200 && ckL2.body && ckL2.body.ref === ckMid.body.ref && ckL2.body.licence && ckL2.body.licence.seats === 6
      && nameL3.status === 409 && nameL3.body.reason === "full"
      && desksMid.every(d => d.status === 200 && d.body && d.body.certificate)
      && d7.status === 200 && d7.body && !d7.body.certificate && d7.body.reason === "waiting";
    const at44Ok = !!ck44.body && await licenceHolds(ck44.body.licence) && ck44.body.licence.seats === 2
      && list44.status === 200 && list44.body.counts.lead.of === 1 && list44.body.counts.desk.of === 2
      && l2Drop44.status === 200 && l2Drop44.body && l2Drop44.body.released !== true && !!l2Drop44.body.licence && l2Drop44.body.licence.kind === "etiuda-studio-trial-license" && !!l2Drop44.body.grant
      && nameL3At44.status === 409 && nameL3At44.body.reason === "full"
      && d8.status === 200 && d8.body && !d8.body.certificate && d8.body.reason === "waiting";
    const renOk = afterRen.lead_seats === 1 && afterRen.seats === 2 && afterRen.paid_until === T0 + 775 * DAY
      && oldSub.lead_seats === 0 && oldSub.seats === 0
      && !!ckRen.body && ckRen.body.licence && ckRen.body.licence.seats === 2
      && listRen.status === 200 && listRen.body.counts.lead.of === 1 && listRen.body.counts.desk.of === 2;
    ck(w2.paidOf(m.buyer.person).length === 1 && midOk && at44Ok && renOk,
      "P28c 1 lead and 4 desks monthly (paid_until +44d), cancelled, 1 lead and 2 desks yearly bought at +31d: sum (2 leads, 6 desks) to +44d, 1 and 2 at +44d with no payment in between (the named lead, whose own trial of 14 days from +32d still runs and who pressed lead/accept at their naming, is handed that trial: no lead room, no release), and 1 and 2 after renewal (paid_until +775d): "
      + JSON.stringify({ mid: [ckMid.body && ckMid.body.licence && ckMid.body.licence.seats, listMid.body && listMid.body.counts, nameL3.status, d7.body && d7.body.reason],
        at44: [ck44.body && ck44.body.licence && ck44.body.licence.seats, list44.body && list44.body.counts, l2Drop44.body && (l2Drop44.body.released === true ? "released" : l2Drop44.body.licence && l2Drop44.body.licence.kind), nameL3At44.status, d8.body && d8.body.reason],
        ren: [afterRen.lead_seats, afterRen.seats, (afterRen.paid_until - T0) / DAY, oldSub] }));
    const w3 = world(K);
    const m3 = await buy(w3, "p28d-a", [[PRICE.leadMonth, 1], [PRICE.deskMonth, 4]], { ends: T0 + 30 * DAY });
    const mid3 = (w3.paidOf(m3.buyer.person)[0] || {}).id;
    w3.clock.now = T0 + 30 * DAY;
    m3.sub.status = "canceled";
    await w3.post(event("subscription.canceled", { id: m3.sub.id }));
    w3.clock.now = T0 + 50 * DAY;
    const y3 = subscription(w3, m3.buyer.me, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]]);
    await paid(w3, transaction(w3, y3, T0 + 415 * DAY));
    const after3 = w3.licence(mid3) || {};
    const m3Sub = w3.db.raw.prepare("SELECT lead_seats, seats FROM pay_subs WHERE provider = 'paddle' AND sub = ?").get(m3.sub.id) || {};
    const w4 = world(K);
    const m4 = await buy(w4, "p28d-b", [[PRICE.leadMonth, 1], [PRICE.deskMonth, 4]], { ends: T0 + 30 * DAY });
    const mid4 = (w4.paidOf(m4.buyer.person)[0] || {}).id;
    w4.clock.now = T0 + 30 * DAY;
    m4.sub.status = "canceled";
    await w4.post(event("subscription.canceled", { id: m4.sub.id }));
    w4.clock.now = T0 + 31 * DAY;
    const y4 = subscription(w4, m4.buyer.me, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]]);
    await paid(w4, transaction(w4, y4, T0 + 396 * DAY));
    w4.clock.now = T0 + 50 * DAY;
    y4.status = "canceled";
    await w4.post(event("subscription.canceled", { id: y4.id }));
    const after4 = w4.licence(mid4) || {};
    const m4Sub = w4.db.raw.prepare("SELECT lead_seats, seats FROM pay_subs WHERE provider = 'paddle' AND sub = ?").get(m4.sub.id) || {};
    const y4Sub = w4.db.raw.prepare("SELECT lead_seats, seats FROM pay_subs WHERE provider = 'paddle' AND sub = ?").get(y4.id) || {};
    ck(after3.lead_seats === 1 && after3.seats === 2 && m3Sub.lead_seats === 0 && m3Sub.seats === 0
      && after4.lead_seats === 1 && after4.seats === 2 && m4Sub.lead_seats === 0 && m4Sub.seats === 0 && y4Sub.lead_seats === 1 && y4Sub.seats === 2,
      "P28d settling passed cancelled rows at a later purchase (+50d) or cancel (+50d): "
      + JSON.stringify({ buy: [after3.lead_seats, after3.seats, m3Sub], cancel: [after4.lead_seats, after4.seats, m4Sub, y4Sub] }));
    const w5 = world(K);
    const m5 = await buy(w5, "p28e", [[PRICE.leadMonth, 1], [PRICE.deskMonth, 4]], { ends: T0 + 30 * DAY });
    const mid5 = (w5.paidOf(m5.buyer.person)[0] || {}).id;
    await callSigned(w5, "licence/set", m5.buyer.lead, { orgDesks: true }, RQ.licenceSetBytes);
    w5.clock.now = T0 + 10 * DAY;
    m5.sub.status = "canceled";
    await w5.post(event("subscription.canceled", { id: m5.sub.id }));
    const y5Sub = subscription(w5, m5.buyer.me, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]]);
    await paid(w5, transaction(w5, y5Sub, T0 + 365 * DAY));
    w5.clock.now = T0 + 20 * DAY;
    await renewOwner(w5, "p28e", "acme.example", m5.buyer.lead);
    const ckMid5 = await quietCheck(w5, m5.buyer.lead);
    const listMid5 = await callSigned(w5, "seat/list", m5.buyer.lead, {}, RQ.seatListBytes);
    const l2_5 = await signin(w5, "p28e-l2", "acme.example"), l3_5 = await signin(w5, "p28e-l3", "acme.example");
    const nameL2_5 = await callSigned(w5, "lead/name", m5.buyer.lead, { code: l2_5.me }, RQ.leadNameBytes);
    await callSigned(w5, "lead/accept", l2_5.lead, {}, RQ.leadAcceptBytes); /* the named person presses Accept: their own trial of 14 days is set aside only by that press */
    const ckL2_5 = await quietCheck(w5, l2_5.lead);
    const nameL3_5 = await callSigned(w5, "lead/name", m5.buyer.lead, { code: l3_5.me }, RQ.leadNameBytes);
    const desksMid5 = [];
    for (let i = 1; i <= 6; i++) desksMid5.push(await deskSignin(w5, "p28e-d" + i, "acme.example", edKey()));
    deskTrialHad(w5, "p28e-d7");
    const d7_5 = await deskSignin(w5, "p28e-d7", "acme.example", edKey());
    w5.clock.now = T0 + 44 * DAY;
    const ck44_5 = await quietCheck(w5, m5.buyer.lead);
    const list44_5 = await callSigned(w5, "seat/list", m5.buyer.lead, {}, RQ.seatListBytes);
    const l2Drop44_5 = await quietCheck(w5, l2_5.lead);
    await callSigned(w5, "seat/free", m5.buyer.lead, { kind: "lead", person: l2_5.me }, RQ.seatFreeBytes);
    const nameL3At44_5 = await callSigned(w5, "lead/name", m5.buyer.lead, { code: l3_5.me }, RQ.leadNameBytes);
    for (let i = 2; i < 6; i++) if (desksMid5[i].body && desksMid5[i].body.certificate)
      await callSigned(w5, "seat/free", m5.buyer.lead, { kind: "desk", person: desksMid5[i].body.certificate.person }, RQ.seatFreeBytes);
    deskTrialHad(w5, "p28e-d8");
    const d8_5 = await deskSignin(w5, "p28e-d8", "acme.example", edKey());
    w5.clock.now = T0 + 365 * DAY;
    w5.env.DELEGATION = JSON.stringify(delegation({ from: w5.clock.now - 10 * DAY, until: w5.clock.now + 300 * DAY }));
    await paid(w5, transaction(w5, y5Sub, T0 + 730 * DAY, { origin: "subscription_recurring" }));
    await renewOwner(w5, "p28e", "acme.example", m5.buyer.lead);
    const afterRen5 = w5.licence(mid5) || {};
    const m5Sub = w5.db.raw.prepare("SELECT lead_seats, seats FROM pay_subs WHERE provider = 'paddle' AND sub = ?").get(m5.sub.id) || {};
    const ckRen5 = await quietCheck(w5, m5.buyer.lead);
    const listRen5 = await callSigned(w5, "seat/list", m5.buyer.lead, {}, RQ.seatListBytes);
    const mid5Ok = !!ckMid5.body && await licenceHolds(ckMid5.body.licence) && ckMid5.body.licence.seats === 6
      && listMid5.status === 200 && listMid5.body.counts.lead.of === 2 && listMid5.body.counts.desk.of === 6
      && nameL2_5.status === 200 && ckL2_5.body && ckL2_5.body.ref === ckMid5.body.ref && ckL2_5.body.licence && ckL2_5.body.licence.seats === 6
      && nameL3_5.status === 409 && nameL3_5.body.reason === "full"
      && desksMid5.every(d => d.status === 200 && d.body && d.body.certificate)
      && d7_5.status === 200 && d7_5.body && !d7_5.body.certificate && d7_5.body.reason === "waiting";
    const at44_5Ok = !!ck44_5.body && await licenceHolds(ck44_5.body.licence) && ck44_5.body.licence.seats === 2
      && list44_5.status === 200 && list44_5.body.counts.lead.of === 1 && list44_5.body.counts.desk.of === 2
      && l2Drop44_5.status === 200 && l2Drop44_5.body && l2Drop44_5.body.licence === null && l2Drop44_5.body.released === true
      && nameL3At44_5.status === 409 && nameL3At44_5.body.reason === "full"
      && d8_5.status === 200 && d8_5.body && !d8_5.body.certificate && d8_5.body.reason === "waiting";
    const ren5Ok = afterRen5.lead_seats === 1 && afterRen5.seats === 2 && afterRen5.paid_until === T0 + 744 * DAY
      && m5Sub.lead_seats === 0 && m5Sub.seats === 0
      && !!ckRen5.body && ckRen5.body.licence && ckRen5.body.licence.seats === 2
      && listRen5.status === 200 && listRen5.body.counts.lead.of === 1 && listRen5.body.counts.desk.of === 2;
    ck(w5.paidOf(m5.buyer.person).length === 1 && mid5Ok && at44_5Ok && ren5Ok,
      "P28e two subscriptions (1+4 monthly +44d, then 1+2 yearly +379d bought after the first was cancelled): sum (2 leads, 6 desks) to +44d, 1 and 2 at +44d with no payment in between, and 1 and 2 after renewal (+744d): "
      + JSON.stringify({ mid: [ckMid5.body && ckMid5.body.licence && ckMid5.body.licence.seats, listMid5.body && listMid5.body.counts, nameL3_5.status, d7_5.body && d7_5.body.reason],
        at44: [ck44_5.body && ck44_5.body.licence && ck44_5.body.licence.seats, list44_5.body && list44_5.body.counts, l2Drop44_5.body && l2Drop44_5.body.released, nameL3At44_5.status, d8_5.body && d8_5.body.reason],
        ren: [afterRen5.lead_seats, afterRen5.seats, (afterRen5.paid_until - T0) / DAY, m5Sub] }));
    const w6 = world(K);
    const m6 = await buy(w6, "p28f-a", [[PRICE.leadMonth, 1], [PRICE.deskMonth, 4]], { ends: T0 + 30 * DAY });
    const mid6 = (w6.paidOf(m6.buyer.person)[0] || {}).id;
    w6.clock.now = T0 + 10 * DAY;
    m6.sub.status = "canceled";
    await w6.post(event("subscription.canceled", { id: m6.sub.id }));
    const y6Sub = subscription(w6, m6.buyer.me, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]]);
    await paid(w6, transaction(w6, y6Sub, T0 + 365 * DAY));
    w6.clock.now = T0 + 20 * DAY;
    const adj6 = { id: pid("adj"), action: "refund", type: "full", status: "approved", transaction_id: m6.txn.id, subscription_id: m6.sub.id, items: [] };
    w6.paddle.adjs.set(adj6.id, adj6);
    const ev6 = event("adjustment.updated", { id: adj6.id });
    await w6.post(ev6);
    const after6 = w6.licence(mid6) || {};
    const m6Sub = w6.db.raw.prepare("SELECT status, lead_seats, seats FROM pay_subs WHERE provider = 'paddle' AND sub = ?").get(m6.sub.id) || {};
    ck(w6.outcome(ev6) === "refund-one-source" && after6.refunded === 0 && after6.lead_seats === 1 && after6.seats === 2 && after6.paid_until === T0 + 379 * DAY
      && m6Sub.status === "refunded" && m6Sub.lead_seats === 0 && m6Sub.seats === 0,
      "P28f refunding the cancelled subscription before +44d takes its 1 lead and 4 desks at once, leaving the other's 1 lead and 2 desks to +379d: "
      + JSON.stringify({ outcome: w6.outcome(ev6), lead: after6.lead_seats, seats: after6.seats, paidDay: (after6.paid_until - T0) / DAY, m6Sub }));
    const w7 = world(K);
    const m7 = await buy(w7, "p28g-b", [[PRICE.leadMonth, 1], [PRICE.deskMonth, 4]], { ends: T0 + 30 * DAY });
    const mid7 = (w7.paidOf(m7.buyer.person)[0] || {}).id;
    w7.clock.now = T0 + 10 * DAY;
    m7.sub.status = "canceled";
    await w7.post(event("subscription.canceled", { id: m7.sub.id }));
    const y7Sub = subscription(w7, m7.buyer.me, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]]);
    const y7Txn = transaction(w7, y7Sub, T0 + 365 * DAY);
    await paid(w7, y7Txn);
    w7.clock.now = T0 + 20 * DAY;
    const adj7 = { id: pid("adj"), action: "refund", type: "full", status: "approved", transaction_id: y7Txn.id, subscription_id: y7Sub.id, items: [] };
    w7.paddle.adjs.set(adj7.id, adj7);
    const ev7 = event("adjustment.updated", { id: adj7.id });
    await w7.post(ev7);
    const after7 = w7.licence(mid7) || {};
    const list7 = await callSigned(w7, "seat/list", m7.buyer.lead, {}, RQ.seatListBytes);
    const ck7 = await quietCheck(w7, m7.buyer.lead);
    ck(w7.outcome(ev7) === "refund-one-source" && after7.refunded === 0 && after7.lead_seats === 1 && after7.seats === 4 && after7.paid_until === T0 + 44 * DAY
      && list7.status === 200 && list7.body.counts.lead.of === 1 && list7.body.counts.desk.of === 4 && !!ck7.body && ck7.body.licence && ck7.body.licence.kind === "etiuda-studio-license" && ck7.body.licence.seats === 4,
      "P28g refunding the other live subscription while the cancelled one's paid time runs is a refund of one source, the licence live on the cancelled one's 1 lead and 4 desks to its paid_until (+44d): "
      + JSON.stringify({ outcome: w7.outcome(ev7), refunded: after7.refunded, lead: after7.lead_seats, seats: after7.seats, paid_until: after7.paid_until, paidDay: (after7.paid_until - T0) / DAY, counts: list7.body && list7.body.counts }));
    const w8 = world(K);
    const m8 = await buy(w8, "p28h", [[PRICE.leadMonth, 1], [PRICE.deskMonth, 4]], { ends: T0 + 30 * DAY });
    const mid8 = (w8.paidOf(m8.buyer.person)[0] || {}).id;
    w8.clock.now = T0 + 10 * DAY;
    m8.sub.status = "canceled";
    await w8.post(event("subscription.canceled", { id: m8.sub.id }));
    const y8Sub = subscription(w8, m8.buyer.me, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]]);
    await paid(w8, transaction(w8, y8Sub, T0 + 365 * DAY));
    w8.clock.now = T0 + 20 * DAY;
    await renewOwner(w8, "p28h", "acme.example", m8.buyer.lead);
    const adj8 = { id: pid("adj"), action: "refund", type: "full", status: "approved", transaction_id: m8.txn.id, subscription_id: m8.sub.id, items: [] };
    w8.paddle.adjs.set(adj8.id, adj8);
    await w8.post(event("adjustment.updated", { id: adj8.id }));
    const afterRef8 = w8.licence(mid8) || {};
    const listAfterRef8 = await callSigned(w8, "seat/list", m8.buyer.lead, {}, RQ.seatListBytes);
    w8.clock.now = T0 + 44 * DAY - 1000;
    const listBeforeDate8 = await callSigned(w8, "seat/list", m8.buyer.lead, {}, RQ.seatListBytes);
    w8.clock.now = T0 + 44 * DAY;
    const listAtDate8 = await callSigned(w8, "seat/list", m8.buyer.lead, {}, RQ.seatListBytes);
    const ckAtDate8 = await quietCheck(w8, m8.buyer.lead);
    ck(afterRef8.lead_seats === 1 && afterRef8.seats === 2
      && listAfterRef8.status === 200 && listAfterRef8.body.counts.lead.of === 1 && listAfterRef8.body.counts.desk.of === 2
      && listBeforeDate8.status === 200 && listBeforeDate8.body.counts.lead.of === 1 && listBeforeDate8.body.counts.desk.of === 2
      && listAtDate8.status === 200 && listAtDate8.body.counts.lead.of === 1 && listAtDate8.body.counts.desk.of === 2
      && !!ckAtDate8.body && ckAtDate8.body.licence && ckAtDate8.body.licence.seats === 2,
      "P28h a cancelled subscription refunded before its own paid date loses its seats at once, and at that date nothing more comes off: "
      + JSON.stringify({ afterRefund: [afterRef8.lead_seats, afterRef8.seats, listAfterRef8.body && listAfterRef8.body.counts],
        justBefore: listBeforeDate8.body && listBeforeDate8.body.counts,
        atDate: [listAtDate8.body && listAtDate8.body.counts, ckAtDate8.body && ckAtDate8.body.licence && ckAtDate8.body.licence.seats] }));
    const w9 = world(K);
    const m9 = await buy(w9, "p28i", [[PRICE.leadMonth, 1], [PRICE.deskMonth, 4]], { ends: T0 + 30 * DAY });
    const mid9 = (w9.paidOf(m9.buyer.person)[0] || {}).id;
    w9.clock.now = T0 + 10 * DAY;
    m9.sub.status = "canceled";
    await w9.post(event("subscription.canceled", { id: m9.sub.id }));
    const y9Sub = subscription(w9, m9.buyer.me, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]]);
    await paid(w9, transaction(w9, y9Sub, T0 + 365 * DAY));
    w9.clock.now = T0 + 50 * DAY;
    y9Sub.items = itemsOf([[PRICE.leadYear, 1], [PRICE.deskYear, 3]]);
    await paid(w9, transaction(w9, y9Sub, T0 + 365 * DAY, { origin: "subscription_update" }));
    const settled9 = w9.licence(mid9) || {};
    const m9Settled = w9.db.raw.prepare("SELECT lead_seats, seats FROM pay_subs WHERE provider = 'paddle' AND sub = ?").get(m9.sub.id) || {};
    w9.clock.now = T0 + 51 * DAY;
    const adj9 = { id: pid("adj"), action: "refund", type: "full", status: "approved", transaction_id: m9.txn.id, subscription_id: m9.sub.id, items: [] };
    w9.paddle.adjs.set(adj9.id, adj9);
    const ev9 = event("adjustment.updated", { id: adj9.id });
    await w9.post(ev9);
    const after9 = w9.licence(mid9) || {};
    const m9After = w9.db.raw.prepare("SELECT status, lead_seats, seats FROM pay_subs WHERE provider = 'paddle' AND sub = ?").get(m9.sub.id) || {};
    ck(settled9.lead_seats === 1 && settled9.seats === 3 && m9Settled.lead_seats === 0 && m9Settled.seats === 0
      && w9.outcome(ev9) === "refund-one-source" && after9.lead_seats === 1 && after9.seats === 3 && m9After.status === "refunded",
      "P28i a cancelled subscription whose date has passed and been settled, then refunded late, changes no count: "
      + JSON.stringify({ settled: [settled9.lead_seats, settled9.seats, m9Settled], after: [w9.outcome(ev9), after9.lead_seats, after9.seats, m9After] }));
    const w10 = world(K);
    const m10 = await buy(w10, "p28j", [[PRICE.leadMonth, 1], [PRICE.deskMonth, 4]], { ends: T0 + 30 * DAY });
    const mid10 = (w10.paidOf(m10.buyer.person)[0] || {}).id;
    w10.clock.now = T0 + 10 * DAY;
    m10.sub.status = "canceled";
    await w10.post(event("subscription.canceled", { id: m10.sub.id }));
    const y10Sub = subscription(w10, m10.buyer.me, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]]);
    await paid(w10, transaction(w10, y10Sub, T0 + 365 * DAY));
    w10.clock.now = T0 + 20 * DAY;
    y10Sub.status = "canceled";
    await w10.post(event("subscription.canceled", { id: y10Sub.id }));
    await renewOwner(w10, "p28j", "acme.example", m10.buyer.lead);
    w10.clock.now = T0 + 30 * DAY;
    const listBefore10 = await callSigned(w10, "seat/list", m10.buyer.lead, {}, RQ.seatListBytes);
    w10.clock.now = T0 + 44 * DAY;
    const listBetween10 = await callSigned(w10, "seat/list", m10.buyer.lead, {}, RQ.seatListBytes);
    const ckBetween10 = await quietCheck(w10, m10.buyer.lead);
    w10.clock.now = T0 + 365 * DAY;
    w10.env.DELEGATION = JSON.stringify(delegation({ from: w10.clock.now - 10 * DAY, until: w10.clock.now + 300 * DAY }));
    await renewOwner(w10, "p28j", "acme.example", m10.buyer.lead);
    w10.clock.now = T0 + 380 * DAY;
    const listLapsed10 = await callSigned(w10, "seat/list", m10.buyer.lead, {}, RQ.seatListBytes);
    /* In force as the service counts it (pay.mjs inForceCol, its base): stored less passed cancelled subscriptions, never below one. */
    const inForceLapsed10 = w10.db.raw.prepare("SELECT MAX(1, l.lead_seats - COALESCE((SELECT SUM(lead_seats) FROM pay_subs WHERE licence = l.id AND status = 'canceled' AND paid_until <= ?), 0)) AS lead, "
      + "MAX(1, l.seats - COALESCE((SELECT SUM(seats) FROM pay_subs WHERE licence = l.id AND status = 'canceled' AND paid_until <= ?), 0)) AS desk FROM licences l WHERE l.id = ?").get(w10.clock.now, w10.clock.now, mid10) || {};
    const ckLapsed10 = await quietCheck(w10, m10.buyer.lead);
    const lapsedLic10 = w10.licence(mid10) || {};
    const z10Sub = subscription(w10, m10.buyer.me, [[PRICE.leadYear, 1], [PRICE.deskYear, 3]]);
    await paid(w10, transaction(w10, z10Sub, w10.clock.now + 365 * DAY));
    const reBought10 = w10.licence(mid10) || {};
    ck(listBefore10.status === 200 && listBefore10.body.counts.lead.of === 2 && listBefore10.body.counts.desk.of === 6
      && listBetween10.status === 200 && listBetween10.body.counts.lead.of === 1 && listBetween10.body.counts.desk.of === 2
      && !!ckBetween10.body && ckBetween10.body.licence && ckBetween10.body.licence.seats === 2
      /* REVIEW 48, FINDING 2 (Claude alpha: "lead/name and leadOf require a running licence"): past its paid end the seat list, a lead's act, is
         refused as no lead's; until then it answered the counts, 1 and 1, which are read in force here instead. */
      && listLapsed10.status === 404 && inForceLapsed10.lead === 1 && inForceLapsed10.desk === 1
      /* REVERSED BY PIECE S-0 (Max, 2026-11-17 20:41, "I agree with your recommendation", to a paid licence that ends stopping Studio as it
         stops the desk): past its paid end the check hands no licence, answered ended "expired"; until then it handed the licence, its seats 1. */
      && !!ckLapsed10.body && ckLapsed10.body.grant === null && ckLapsed10.body.licence === null && ckLapsed10.body.ended === "expired"
      && lapsedLic10.paid_until <= T0 + 380 * DAY
      && reBought10.lead_seats === 1 && reBought10.seats === 3,
      "P28j one cancelled, a second bought, then the second cancelled too before the first's date: each keeps its seats to its own date, and after the later date the licence has lapsed, its seat list refused, with nothing subtracted twice: "
      + JSON.stringify({ before44: listBefore10.body && listBefore10.body.counts, between: listBetween10.body && listBetween10.body.counts,
        lapsed: [listLapsed10.status, inForceLapsed10, ckLapsed10.body && ckLapsed10.body.grant, ckLapsed10.body && ckLapsed10.body.ended], reBought: [reBought10.lead_seats, reBought10.seats] }));
  });

  /* A COMPLETED TRANSACTION WHOSE SUBSCRIPTION IS STILL PAST DUE (Grok's review 6, finding 5B): retried until active, never held. */
  await leg("P29", async () => {
    const w = world(K);
    const b = await signin(w, "p29", "acme29.example");
    const sub = subscription(w, b.me, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]]), txn = transaction(w, sub, T0 + 365 * DAY);
    sub.status = "past_due";
    const before = w.state(), e = event("transaction.completed", { id: txn.id }), early = await w.post(e), unchanged = w.state() === before;
    sub.status = "active";
    const again = await w.post(e);
    const lic = w.paidOf(b.person)[0] || {};
    const c = await signin(w, "p29-c", "acme29c.example");
    const cs = subscription(w, c.me, [[PRICE.deskYear, 1]], { status: "paused" }), ce = event("transaction.completed", { id: transaction(w, cs, T0 + 365 * DAY).id });
    await w.post(ce);
    ck(early.status === 500 && unchanged && again.status === 200 && lic.seats === 2 && w.outcome(ce) === "held:subscription-status",
      "P29a a first transaction completed while its subscription reads past_due answers 500 and writes nothing; Paddle's retry, once it is active,"
      + " applies it; a paused one is held: " + JSON.stringify({ early: early.status, again: again.status, seats: lic.seats, paused: w.outcome(ce) }));
  });

  /* A NEW PERIOD PAID AFTER A REFUND (Grok's review 6, finding 5C): the key reads only, so the subscription renews. */
  await leg("P30", async () => {
    const w = world(K);
    const e1 = T0 + 30 * DAY;
    const p = await buy(w, "p30", [[PRICE.leadMonth, 1], [PRICE.deskMonth, 3]], { ends: e1 });
    const id = (w.paidOf(p.buyer.person)[0] || {}).id;
    const a = { id: pid("adj"), action: "refund", type: "full", status: "approved", transaction_id: p.txn.id, subscription_id: p.sub.id, items: [] };
    w.paddle.adjs.set(a.id, a);
    const ae = event("adjustment.updated", { id: a.id }); await w.post(ae);
    const ended = (w.licence(id) || {}).refunded;
    const ren = transaction(w, p.sub, T0 + 60 * DAY, { origin: "subscription_recurring" }), re = event("transaction.completed", { id: ren.id }), rr = await w.post(re);
    const back = w.licence(id) || {};
    ck(w.outcome(ae) === "applied" && ended === 1 && rr.status === 200 && w.outcome(re) === "restored" && back.refunded === 0 && back.seats === 3 && back.lead_seats === 1
      && back.paid_until === T0 + 60 * DAY + GRACE,
      "P30a a licence its subscription's refund ended is given back by the renewal of the next period, its own 3 desks, listed \"restored\": "
      + JSON.stringify({ renewal: w.outcome(re), refunded: back.refunded, seats: back.seats, lead: back.lead_seats }));
  });

  /* A RISE IN THE SAME PERIOD (Grok's review 6, finding 3). */
  await leg("P31", async () => {
    const setup = async n => {
      const w = world(K);
      const p = await buy(w, "p31-" + n, [[PRICE.leadYear, 1], [PRICE.deskYear, 5]]);
      const id = (w.paidOf(p.buyer.person)[0] || {}).id;
      p.sub.items = itemsOf([[PRICE.leadYear, 1], [PRICE.deskYear, 8]]);
      const rise = transaction(w, p.sub, T0 + 365 * DAY, { origin: "subscription_update" }); await paid(w, rise);
      return { w, p, id, rise, risen: (w.licence(id) || {}).seats };
    };
    const refund = async (w, sub, txn) => { const a = { id: pid("adj"), action: "refund", type: "full", status: "approved", transaction_id: txn.id, subscription_id: sub.id, items: [] };
      w.paddle.adjs.set(a.id, a); const e = event("adjustment.updated", { id: a.id }); await w.post(e); return w.outcome(e); };
    const a = await setup("a"), ra = await refund(a.w, a.p.sub, a.p.txn);
    const b = await setup("b"), rb = await refund(b.w, b.p.sub, b.rise), lb = b.w.licence(b.id) || {};
    const la = a.w.licence(a.id) || {};
    /* Moved 2026-11-22 (Grok alpha's payments review, A2 and B4): old "the period's refund ends the sole-source licence, the rise's is held
       refund-rise"; new "each takes off the seats its own payment bought, listed refund-part". */
    ck(a.risen === 8 && ra === "refund-part" && la.refunded === 0 && la.seats === 3 && rb === "refund-part" && lb.refunded === 0 && lb.seats === 5,
      "P31a after a rise in the same period (5 to 8), a full refund of the period's own transaction takes off its 5 and keeps the rise's 3, and one of the rise alone"
      + " takes off the rise's 3, the licence live either way: " + JSON.stringify({ rise: a.risen, period: ra, periodSeats: la.seats, riseRefund: rb, seats: lb.seats }));
  });

  /* THE PAID END (piece S-0; Max, 2026-11-17 20:41, "I agree with your recommendation", to a paid licence that ends stopping Studio as it
     stops the desk): a subscription's licence states its paid end, the period's end plus GRACE_DAYS; inside the days of grace the check hands it
     and a paid grant; past them it answers ended "expired"; the renewal paid, the next check hands it again with its new end. */
  await leg("P32", async () => {
    const w = world(K);
    const e1 = T0 + 10 * DAY, e2 = e1 + 30 * DAY;
    const p = await buy(w, "p32", [[PRICE.leadMonth, 1], [PRICE.deskMonth, 1]], { ends: e1 });
    const lic = w.paidOf(p.buyer.person)[0] || {};
    w.clock.now = e1 + GRACE - 1;
    const inGrace = await quietCheck(w, p.buyer.lead), ib = inGrace.body || {};
    ck(p.r.status === 200 && lic.paid_until === e1 + GRACE && inGrace.status === 200 && await licenceHolds(ib.licence)
      && ib.licence.paidUntil === e1 + GRACE && !!ib.grant && ib.grant.paid === true && ib.grant.until === e1 + GRACE && !("ended" in ib),
      "P32a a subscription's licence states its paid end, the period's end plus 14 days, and in the last millisecond of those days the check"
      + " still hands it with a paid grant ending then: " + JSON.stringify([ib.licence && (ib.licence.paidUntil - e1) / DAY, ib.grant && (ib.grant.until - e1) / DAY]));
    w.clock.now = e1 + GRACE;
    const past = await quietCheck(w, p.buyer.lead), pb = past.body || {};
    ck(past.status === 200 && pb.licence === null && pb.grant === null && pb.ended === "expired",
      "P32b once the 14 days have passed, the check answers ended \"expired\", with no licence and no grant: " + JSON.stringify(pb).slice(0, 120));
    const renewal = transaction(w, p.sub, e2, { origin: "subscription_recurring" });
    const r2 = await paid(w, renewal);
    const back = await quietCheck(w, p.buyer.lead), kb = back.body || {};
    ck(r2.status === 200 && back.status === 200 && await licenceHolds(kb.licence) && kb.licence.paidUntil === e2 + GRACE
      && !!kb.grant && kb.grant.paid === true && !("ended" in kb),
      "P32c the renewal paid, the next check hands the licence again, stating the new period's end plus 14 days, with a paid grant: "
      + JSON.stringify([r2.status, back.status, kb.licence && (kb.licence.paidUntil - e2) / DAY]));
  });

  /* Review 44, finding 4: a late renewal of a cancelled subscription past paid_until settles without the subscription being renewed. */
  await leg("P33", async () => {
    const w = world(K);
    const p = await buy(w, "p33", [[PRICE.leadMonth, 1], [PRICE.deskMonth, 2]], { ends: T0 + 30 * DAY });
    const id = (w.paidOf(p.buyer.person)[0] || {}).id;
    w.clock.now = T0 + 20 * DAY;
    p.sub.status = "canceled";
    await w.post(event("subscription.canceled", { id: p.sub.id }));
    await renewOwner(w, "p33", "acme.example", p.buyer.lead);
    w.clock.now = T0 + 45 * DAY;
    p.sub.status = "active";
    const ren = transaction(w, p.sub, T0 + 75 * DAY, { origin: "subscription_recurring" });
    await paid(w, ren);
    const lic = w.licence(id) || {};
    const extraLead = await signin(w, "p33-l2", "acme.example");
    const named = await callSigned(w, "lead/name", p.buyer.lead, { code: extraLead.me }, RQ.leadNameBytes);
    const w2 = world(K);
    const p2 = await buy(w2, "p33b", [[PRICE.leadMonth, 1], [PRICE.deskMonth, 2]], { ends: T0 + 30 * DAY });
    const id2 = (w2.paidOf(p2.buyer.person)[0] || {}).id;
    w2.clock.now = T0 + 20 * DAY;
    p2.sub.status = "canceled";
    await w2.post(event("subscription.canceled", { id: p2.sub.id }));
    w2.clock.now = T0 + 45 * DAY;
    p2.sub.status = "active";
    p2.sub.items = itemsOf([[PRICE.leadMonth, 1], [PRICE.deskMonth, 3]]);
    await paid(w2, transaction(w2, p2.sub, T0 + 45 * DAY, { origin: "subscription_update",
      items: [{ price: { id: PRICE.deskMonth, billing_cycle: CYCLE(PRICE.deskMonth) }, quantity: 1 }] }));
    const lic2 = w2.licence(id2) || {};
    ck(lic.lead_seats === 1 && lic.seats === 2 && lic.paid_until === T0 + 75 * DAY + GRACE
      && named.status === 409 && named.body && named.body.reason === "full"
      && lic2.lead_seats === 1 && lic2.seats === 3,
      "P33a a late renewal or rise of a cancelled subscription past paid_until does not settle it against itself (1L/2D stays 1L/2D, second lead refused, +1D rise gives 1L/3D): "
      + JSON.stringify({ lead: lic.lead_seats, seats: lic.seats, named: [named.status, named.body && named.body.reason], rise: [lic2.lead_seats, lic2.seats] }));
  });

  /* Review 44, finding 5: a desk-only second subscription after the lead-carrying one is cancelled leaves 0 live lead seats, adds cleanly on rise, and refunds the licence when none is left. */
  await leg("P34", async () => {
    const w = world(K);
    const p1 = await buy(w, "p34", [[PRICE.leadMonth, 1], [PRICE.deskMonth, 2]], { ends: T0 + 30 * DAY });
    const id = (w.paidOf(p1.buyer.person)[0] || {}).id;
    /* One subscription per licence (Max, 2026-11-19): the lead-carrying one is cancelled, its seats paid to its own date, before the next is bought. */
    p1.sub.status = "canceled";
    await w.post(event("subscription.canceled", { id: p1.sub.id }));
    const sub2 = subscription(w, p1.buyer.me, [[PRICE.deskMonth, 2]]);
    const txn2 = transaction(w, sub2, T0 + 30 * DAY);
    await paid(w, txn2);
    const adj1 = { id: pid("adj"), action: "refund", type: "full", status: "approved", transaction_id: p1.txn.id, subscription_id: p1.sub.id, items: [] };
    w.paddle.adjs.set(adj1.id, adj1);
    await w.post(event("adjustment.updated", { id: adj1.id }));
    const list1 = await callSigned(w, "seat/list", p1.buyer.lead, {}, RQ.seatListBytes);
    sub2.items = itemsOf([[PRICE.leadMonth, 1], [PRICE.deskMonth, 2]]);
    const rise = transaction(w, sub2, T0 + 30 * DAY, { origin: "subscription_update" });
    await paid(w, rise);
    const lic2 = w.licence(id) || {};
    const adj2 = { id: pid("adj"), action: "refund", type: "full", status: "approved", transaction_id: txn2.id, subscription_id: sub2.id, items: [] };
    w.paddle.adjs.set(adj2.id, adj2);
    const ev2 = event("adjustment.updated", { id: adj2.id });
    await w.post(ev2);
    const mid = w.licence(id) || {};
    /* Moved 2026-11-22 (Grok alpha's payments review, B4): old the period's refund ended the licence; new it takes off the period's 2 desks
       and keeps the lead the rise paid for, and the rise's own refund then ends it. */
    const adj3 = { id: pid("adj"), action: "refund", type: "full", status: "approved", transaction_id: rise.id, subscription_id: sub2.id, items: [] };
    w.paddle.adjs.set(adj3.id, adj3);
    const ev3 = event("adjustment.updated", { id: adj3.id });
    await w.post(ev3);
    const lic3 = w.licence(id) || {};
    const ck3 = await quietCheck(w, p1.buyer.lead);
    ck(list1.status === 200 && list1.body.counts.lead.of === 0 && list1.body.counts.desk.of === 2
      && lic2.lead_seats === 1 && lic2.seats === 2
      && w.outcome(ev2) === "refund-part" && mid.refunded === 0 && mid.lead_seats === 1
      && w.outcome(ev3) === "applied" && lic3.refunded === 1
      && ck3.body && ck3.body.grant === null && ck3.body.ended !== "expired"
      && (ck3.body.ended === "refunded" || (!!ck3.body.trial && ck3.body.trial.ends <= w.clock.now)),
      "P34a refunding a cancelled lead-carrying subscription beside a desk-only second subscription leaves 0 live lead seats, rising +1L gives 1L, refunding the second's period keeps the risen lead, and refunding the rise too sets refunded: "
      + JSON.stringify({ list1: list1.body && list1.body.counts, lic2: [lic2.lead_seats, lic2.seats], out2: w.outcome(ev2), mid: [mid.refunded, mid.lead_seats], out3: w.outcome(ev3), lic3: [lic3.refunded, ck3.body && ck3.body.ended] }));
  });

  /* Review 44, finding 7: a non-first payment of an unknown subscription is answered 500 with nothing written so the provider retries after first lands. */
  await leg("P35", async () => {
    const w = world(K);
    const buyer = await signin(w, "p35", "acme.example");
    const sub = subscription(w, buyer.me, [[PRICE.leadMonth, 2], [PRICE.deskMonth, 5]]);
    const first = transaction(w, sub, T0 + 30 * DAY, { origin: "web", items: [{ price: { id: PRICE.leadMonth, billing_cycle: CYCLE(PRICE.leadMonth) }, quantity: 1 }, { price: { id: PRICE.deskMonth, billing_cycle: CYCLE(PRICE.deskMonth) }, quantity: 2 }] });
    const rise = transaction(w, sub, T0 + 30 * DAY, { origin: "subscription_update", items: [{ price: { id: PRICE.leadMonth, billing_cycle: CYCLE(PRICE.leadMonth) }, quantity: 1 }, { price: { id: PRICE.deskMonth, billing_cycle: CYCLE(PRICE.deskMonth) }, quantity: 3 }] });
    const eRise = event("transaction.completed", { id: rise.id });
    const before = w.state();
    const early = await w.post(eRise);
    const unchanged = w.state() === before, earlyOut = w.outcome(eRise);
    const eFirst = event("transaction.completed", { id: first.id });
    const rFirst = await w.post(eFirst);
    const retryRise = await w.post(eRise);
    const lic = w.paidOf(buyer.person)[0] || {};
    const renUnk = transaction(w, subscription(w, buyer.me, [[PRICE.deskMonth, 1]]), T0 + 30 * DAY, { origin: "subscription_recurring" });
    const eRenUnk = event("transaction.completed", { id: renUnk.id });
    const rRenUnk = await w.post(eRenUnk);
    ck(early.status === 500 && unchanged && earlyOut === undefined
      && rFirst.status === 200 && w.outcome(eFirst) === "applied"
      && retryRise.status === 200 && w.outcome(eRise) === "applied" && lic.lead_seats === 2 && lic.seats === 5
      && rRenUnk.status === 500 && w.outcome(eRenUnk) === undefined,
      "P35a a rise or renewal for an unknown subscription answers 500 with nothing written; retried after first lands, the rise applies (2L/5D): "
      + JSON.stringify({ early: early.status, unchanged, first: w.outcome(eFirst), retry: [retryRise.status, w.outcome(eRise)], seats: [lic.lead_seats, lic.seats], renUnk: rRenUnk.status }));
  });

  /* Review 44, finding 8: a completed payment whose subscription is already canceled is still applied with status = 'canceled'. */
  await leg("P36", async () => {
    const w = world(K);
    const p = await buy(w, "p36", [[PRICE.leadMonth, 1], [PRICE.deskMonth, 2]], { ends: T0 + 30 * DAY });
    const id = (w.paidOf(p.buyer.person)[0] || {}).id;
    const ren = transaction(w, p.sub, T0 + 60 * DAY, { origin: "subscription_recurring" });
    p.sub.status = "canceled";
    const eRen = event("transaction.completed", { id: ren.id });
    const rRen = await w.post(eRen);
    const lic = w.licence(id) || {};
    const subRow = w.db.raw.prepare("SELECT status FROM pay_subs WHERE sub = ?").get(p.sub.id) || {};
    const b2 = await signin(w, "p36-2", "acme36b.example");
    const sub2 = subscription(w, b2.me, [[PRICE.deskYear, 2]], { status: "canceled" });
    const e2 = event("transaction.completed", { id: transaction(w, sub2, T0 + 365 * DAY).id });
    await w.post(e2);
    const lic2 = w.paidOf(b2.person)[0] || {};
    const subRow2 = w.db.raw.prepare("SELECT status FROM pay_subs WHERE sub = ?").get(sub2.id) || {};
    ck(rRen.status === 200 && w.outcome(eRen) === "applied" && lic.paid_until === T0 + 60 * DAY + GRACE && subRow.status === "canceled"
      && w.outcome(e2) === "applied" && lic2.seats === 2 && subRow2.status === "canceled",
      "P36a a completed renewal or first payment whose subscription is already canceled still applies and records status 'canceled': "
      + JSON.stringify({ ren: [rRen.status, w.outcome(eRen), lic.paid_until === T0 + 60 * DAY + GRACE, subRow.status], first: [w.outcome(e2), lic2.seats, subRow2.status] }));
  });

  /* Review 47, finding 3, and Claude alpha's C3 of about 14:30 on 2026-11-18 ("(b), main's desk floor of one: a lead-only purchase is a valid licence and the
     owner's own desk comes with the lead seat"). (a) Argon's F1: a lead-only first purchase's licence states one seat and Studio's own check
     takes it; the counts read 1 lead, 1 desk; the owner's desk is seated on it. (b) The side-step: a cancelled lead-only subscription with a desk one
     bought beside it, the desk one refunded, leaves the same: one seat stated, Studio taking it. */
  await leg("P37", async () => {
    const w = world(K);
    const p = await buy(w, "p37", [[PRICE.leadMonth, 1]], { ends: T0 + 30 * DAY });
    const c1 = await quietCheck(w, p.buyer.lead);
    const list1 = await callSigned(w, "seat/list", p.buyer.lead, {}, RQ.seatListBytes);
    const desk = await deskSignin(w, "p37", "acme.example", edKey());
    ck(p.r.status === 200 && c1.status === 200 && !!c1.body.licence && c1.body.licence.seats === 1 && await licenceHolds(c1.body.licence)
      && list1.status === 200 && list1.body.counts.lead.of === 1 && list1.body.counts.desk.of === 1
      && desk.status === 200 && !!desk.body.certificate,
      "P37a a lead-only purchase's licence states one seat, which Studio's check of the file takes, the counts read 1 lead and 1 desk, and the"
      + " owner's desk is seated on it: " + JSON.stringify({ seats: c1.body && c1.body.licence && c1.body.licence.seats, counts: list1.body && list1.body.counts,
        desk: [desk.status, !!(desk.body && desk.body.certificate), desk.body && desk.body.reason] }));
    const w2 = world(K);
    const q = await buy(w2, "p37b", [[PRICE.leadMonth, 1]], { ends: T0 + 30 * DAY });
    q.sub.status = "canceled";
    await w2.post(event("subscription.canceled", { id: q.sub.id }));
    const sub2 = subscription(w2, q.buyer.me, [[PRICE.deskMonth, 2]]);
    const txn2 = transaction(w2, sub2, T0 + 30 * DAY);
    await paid(w2, txn2);
    const mid = await quietCheck(w2, q.buyer.lead);
    const adj = { id: pid("adj"), action: "refund", type: "full", status: "approved", transaction_id: txn2.id, subscription_id: sub2.id, items: [] };
    w2.paddle.adjs.set(adj.id, adj);
    const evAdj = event("adjustment.updated", { id: adj.id });
    await w2.post(evAdj);
    const c2 = await quietCheck(w2, q.buyer.lead);
    ck(mid.status === 200 && !!mid.body.licence && mid.body.licence.seats === 2 && w2.outcome(evAdj) === "refund-one-source"
      && c2.status === 200 && !!c2.body.licence && c2.body.licence.seats === 1 && await licenceHolds(c2.body.licence),
      "P37b a cancelled lead-only subscription whose desk subscription beside it is refunded keeps a licence stating one seat, which Studio's check takes: "
      + JSON.stringify({ mid: mid.body && mid.body.licence && mid.body.licence.seats, refund: w2.outcome(evAdj), after: c2.body && c2.body.licence && c2.body.licence.seats }));
  });

  /* Review 47, finding 11 (Claude alpha: "a renewal of a held first purchase is listed and answered 200 held, never 500 for ever"), on Argon's
     case 7: a first purchase held "managed", its renewal billed a month on. Delivered fresh it answers 500 (it might yet be a first purchase out
     of order, P35a); delivered again more than UNKNOWN_RETRY_MS after the provider's own event time it is held "subscription-unknown" and listed.
     The side-step: a rise of a subscription never known here, its event two days old, is held the same way, at once. */
  await leg("P38", async () => {
    const w = world(K);
    const b = await signin(w, "p38-b", "acme.example"), a = await signin(w, "p38-a", "acme.example");
    const lic = await attachByHand(w, a.me);
    w.db.raw.prepare("UPDATE licences SET seat_source = 'entra', entra_at = ? WHERE id = ?").run(w.clock.now, lic.id);
    const s1 = subscription(w, b.me, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 2]]);
    const e1 = event("transaction.completed", { id: transaction(w, s1, T0 + 30 * DAY).id }, { occurred_at: iso(w.clock.now) });
    const r1 = await w.post(e1);
    w.clock.now = T0 + 30 * DAY;
    const before = w.stateExcept("pay_events");
    const eRen = event("transaction.completed", { id: transaction(w, s1, T0 + 60 * DAY, { origin: "subscription_recurring" }).id }, { occurred_at: iso(w.clock.now) });
    const young = await w.post(eRen), youngOut = w.outcome(eRen);
    w.clock.now += 25 * HOUR;
    const old = await w.post(eRen);
    const s2 = subscription(w, b.me, [[PRICE.leadMonth, 2]]);
    const eRise = event("transaction.completed", { id: transaction(w, s2, T0 + 60 * DAY, { origin: "subscription_update" }).id }, { occurred_at: iso(w.clock.now - 2 * DAY) });
    const rise = await w.post(eRise);
    ck(r1.status === 200 && w.outcome(e1) === "held:managed" && young.status === 500 && youngOut === undefined
      && old.status === 200 && w.outcome(eRen) === "held:subscription-unknown" && rise.status === 200 && w.outcome(eRise) === "held:subscription-unknown"
      && w.stateExcept("pay_events") === before && w.count("pay_subs") === 0,
      "P38a a renewal of a first purchase held for Max answers 500 while its event is young, and is held \"subscription-unknown\" and listed once"
      + " it is a day old; an older rise of an unknown subscription is held at once; nothing else is written: "
      + JSON.stringify({ first: w.outcome(e1), young: [young.status, youngOut === undefined ? null : youngOut], old: [old.status, w.outcome(eRen)], rise: [rise.status, w.outcome(eRise)] }));
  });

  /* Review 4, finding 5: a notice for an earlier period than the subscription already holds changes no seat. The later renewal is applied
     first (2 lead, 5 desk, period end day 90); the earlier one (1 lead, 2 desk, period end day 60) is delivered after it. */
  await leg("P39", async () => {
    const w = world(K);
    const e1 = T0 + 30 * DAY, e2 = T0 + 60 * DAY, e3 = T0 + 90 * DAY;
    const p = await buy(w, "p39", [[PRICE.leadMonth, 1], [PRICE.deskMonth, 2]], { ends: e1 });
    const id = w.paidOf(p.buyer.person)[0].id;
    p.sub.items = itemsOf([[PRICE.leadMonth, 2], [PRICE.deskMonth, 5]]);
    const later = transaction(w, p.sub, e3, { origin: "subscription_recurring" });
    const evLater = event("transaction.completed", { id: later.id });
    const rLater = await w.post(evLater);
    const risen = w.licence(id);
    const early = transaction(w, p.sub, e2, { origin: "subscription_recurring",
      items: itemsOf([[PRICE.leadMonth, 1], [PRICE.deskMonth, 2]]).map(i => ({ price: i.price, quantity: i.quantity })) });
    const evEarly = event("transaction.completed", { id: early.id });
    const rEarly = await w.post(evEarly);
    const after = w.licence(id);
    const row = w.db.raw.prepare("SELECT lead_seats, seats, paid_until FROM pay_subs WHERE sub = ?").get(p.sub.id);
    ck(rLater.status === 200 && w.outcome(evLater) === "applied" && risen.lead_seats === 2 && risen.seats === 5
      && rEarly.status === 200 && w.outcome(evEarly) === "applied"
      && after.lead_seats === 2 && after.seats === 5 && after.paid_until === e3 + GRACE
      && row.lead_seats === 2 && row.seats === 5 && row.paid_until === e3 + GRACE,
      "P39a an earlier renewal delivered after a later one has raised the seats writes no seat and shortens no date: "
      + JSON.stringify({ later: [w.outcome(evLater), risen.lead_seats, risen.seats], early: [w.outcome(evEarly), after.lead_seats, after.seats, row.lead_seats, row.seats, (after.paid_until - T0) / DAY] }));
  });

  /* Review 4, findings 10 and 6. A mid-period update may add a seat at once. A lower count, of desks or of leads, waits for the
     period that carries it, and the subscription row keeps the higher count so that renewal diffs against what was paid. */
  await leg("P40", async () => {
    const w = world(K);
    const e1 = T0 + 30 * DAY, e2 = T0 + 60 * DAY;
    const p = await buy(w, "p40", [[PRICE.leadMonth, 1], [PRICE.deskMonth, 3]], { ends: e1 });
    const id = w.paidOf(p.buyer.person)[0].id;
    p.sub.items = itemsOf([[PRICE.leadMonth, 2], [PRICE.deskMonth, 1]]);
    const upd = transaction(w, p.sub, e1, { origin: "subscription_update",
      items: itemsOf([[PRICE.leadMonth, 1]]).map(i => ({ price: i.price, quantity: i.quantity })) });
    const ev = event("transaction.completed", { id: upd.id });
    const r = await w.post(ev);
    const mid = w.licence(id);
    const row = w.db.raw.prepare("SELECT lead_seats, seats, paid_until FROM pay_subs WHERE sub = ?").get(p.sub.id);
    const ren = transaction(w, p.sub, e2, { origin: "subscription_recurring" });
    const evRen = event("transaction.completed", { id: ren.id });
    const rRen = await w.post(evRen);
    const after = w.licence(id);
    const rowRen = w.db.raw.prepare("SELECT lead_seats, seats, paid_until FROM pay_subs WHERE sub = ?").get(p.sub.id);
    ck(r.status === 200 && w.outcome(ev) === "applied" && mid.lead_seats === 2 && mid.seats === 3 && mid.paid_until === e1 + GRACE
      && row.lead_seats === 2 && row.seats === 3 && row.paid_until === e1 + GRACE
      && rRen.status === 200 && w.outcome(evRen) === "applied" && after.lead_seats === 2 && after.seats === 1 && after.paid_until === e2 + GRACE
      && rowRen.lead_seats === 2 && rowRen.seats === 1 && rowRen.paid_until === e2 + GRACE,
      "P40a a mid-period update that adds a lead and lowers desks adds the lead at once and keeps the desks already paid; the next period's renewal takes the lower desk count: "
      + JSON.stringify({ mid: [w.outcome(ev), mid.lead_seats, mid.seats, row.lead_seats, row.seats], ren: [w.outcome(evRen), after.lead_seats, after.seats, rowRen.lead_seats, rowRen.seats] }));
    const w2 = world(K);
    const q = await buy(w2, "p40b", [[PRICE.leadMonth, 1], [PRICE.deskMonth, 3]], { ends: e1 });
    const qid = w2.paidOf(q.buyer.person)[0].id;
    q.sub.items = itemsOf([[PRICE.leadMonth, 1], [PRICE.deskMonth, 1]]);
    const red = transaction(w2, q.sub, e1, { origin: "subscription_update", details: { totals: { grand_total: "0" } },
      items: itemsOf([[PRICE.deskMonth, 1]]).map(i => ({ price: i.price, quantity: i.quantity })) });
    const evRed = event("transaction.completed", { id: red.id });
    const rRed = await w2.post(evRed);
    const kept = w2.licence(qid);
    const rowRed = w2.db.raw.prepare("SELECT lead_seats, seats, paid_until FROM pay_subs WHERE sub = ?").get(q.sub.id);
    const ren2 = transaction(w2, q.sub, e2, { origin: "subscription_recurring" });
    const evRen2 = event("transaction.completed", { id: ren2.id });
    const rRen2 = await w2.post(evRen2);
    const dropped = w2.licence(qid);
    const rowRen2 = w2.db.raw.prepare("SELECT lead_seats, seats, paid_until FROM pay_subs WHERE sub = ?").get(q.sub.id);
    ck(rRed.status === 200 && w2.outcome(evRed) === "zero-total:no-discount" && kept.lead_seats === 1 && kept.seats === 3 && kept.paid_until === e1 + GRACE
      && rowRed.lead_seats === 1 && rowRed.seats === 3
      && rRen2.status === 200 && w2.outcome(evRen2) === "applied" && dropped.lead_seats === 1 && dropped.seats === 1 && dropped.paid_until === e2 + GRACE
      && rowRen2.lead_seats === 1 && rowRen2.seats === 1,
      "P40b a pure mid-period desk reduction, listed zero-total:no-discount, keeps the desks already paid, and the next period's renewal takes the lower count: "
      + JSON.stringify({ mid: [w2.outcome(evRed), kept.lead_seats, kept.seats, rowRed.lead_seats, rowRed.seats], ren: [w2.outcome(evRen2), dropped.lead_seats, dropped.seats, rowRen2.lead_seats, rowRen2.seats] }));
    const w3 = world(K);
    const s = await buy(w3, "p40c", [[PRICE.leadMonth, 2], [PRICE.deskMonth, 1]], { ends: e1 });
    const sid = w3.paidOf(s.buyer.person)[0].id;
    s.sub.items = itemsOf([[PRICE.leadMonth, 1], [PRICE.deskMonth, 1]]);
    const cut = transaction(w3, s.sub, e1, { origin: "subscription_update", details: { totals: { grand_total: "0" } } });
    const evCut = event("transaction.completed", { id: cut.id });
    const rCut = await w3.post(evCut);
    const heldLead = w3.licence(sid);
    const rowCut = w3.db.raw.prepare("SELECT lead_seats, seats FROM pay_subs WHERE sub = ?").get(s.sub.id);
    const ren3 = transaction(w3, s.sub, e2, { origin: "subscription_recurring" });
    const evRen3 = event("transaction.completed", { id: ren3.id });
    const rRen3 = await w3.post(evRen3);
    const oneLead = w3.licence(sid);
    const rowRen3 = w3.db.raw.prepare("SELECT lead_seats, seats FROM pay_subs WHERE sub = ?").get(s.sub.id);
    ck(rCut.status === 200 && w3.outcome(evCut) === "zero-total:no-discount" && heldLead.lead_seats === 2 && heldLead.seats === 1
      && rowCut.lead_seats === 2 && rowCut.seats === 1
      && rRen3.status === 200 && oneLead.lead_seats === 1 && oneLead.seats === 1 && rowRen3.lead_seats === 1 && rowRen3.seats === 1,
      "P40c a pure mid-period lead reduction keeps the second lead until the next period's renewal, which takes it off: "
      + JSON.stringify({ mid: [w3.outcome(evCut), heldLead.lead_seats, heldLead.seats, rowCut.lead_seats, rowCut.seats], ren: [oneLead.lead_seats, oneLead.seats, rowRen3.lead_seats, rowRen3.seats] }));
  });

  /* ONE SUBSCRIPTION PER LICENCE (Max, 2026-11-19 03:46: "Yes, one subscription per licence."). More seats are a change of quantity on the
     subscription a licence has, which the provider notifies as a rise of that subscription (P9, P40); a first payment of another
     subscription for a licence that already has one live is held "second-subscription" and changes nothing, the seats staying. */
  await leg("P41", async () => {
    const w = world(K);
    const a = await buy(w, "p41", [[PRICE.leadYear, 1], [PRICE.deskYear, 3]]);
    const lic = w.paidOf(a.buyer.person)[0];
    const orders = w.count("orders"), paidUntil = lic.paid_until;
    const bSub = subscription(w, a.buyer.me, [[PRICE.deskYear, 2]]);
    const bTxn = transaction(w, bSub, T0 + 400 * DAY);
    const eB = event("transaction.completed", { id: bTxn.id });
    const rB = await w.post(eB);
    const held = w.licence(lic.id);
    ck(rB.status === 200 && w.outcome(eB) === "held:second-subscription" && held.seats === 3 && held.lead_seats === 1 && held.paid_until === paidUntil
      && w.count("pay_subs") === 1 && w.count("orders") === orders && w.paidOf(a.buyer.person).length === 1,
      "P41a a second subscription's first payment for a licence with a live one is held \"second-subscription\": the seats, the date, the orders and pay_subs as they were: "
      + JSON.stringify({ status: rB.status, outcome: w.outcome(eB), seats: held.seats, subs: w.count("pay_subs"), orders: w.count("orders") - orders }));
    /* The control: the quantity change on the one subscription it has applies. */
    a.sub.items = itemsOf([[PRICE.leadYear, 1], [PRICE.deskYear, 5]]);
    const rise = transaction(w, a.sub, T0 + 365 * DAY, { origin: "subscription_update", items: itemsOf([[PRICE.deskYear, 2]]).map(i => ({ price: i.price, quantity: i.quantity })) });
    const eR = event("transaction.completed", { id: rise.id });
    const rR = await w.post(eR);
    const risen = w.licence(lic.id);
    ck(rR.status === 200 && w.outcome(eR) === "applied" && risen.seats === 5 && risen.lead_seats === 1 && w.count("pay_subs") === 1,
      "P41b control: more desks as a change of quantity on the one subscription apply, and the licence still has one subscription: "
      + JSON.stringify({ outcome: w.outcome(eR), seats: risen.seats, subs: w.count("pay_subs") }));
  });

  /* WHAT THE BUYER'S OWN PROGRAMS ARE TOLD, THROUGH PADDLE (board 1020; pay.mjs buyerFacts, proved whole through Stripe in licence-stripe BY):
     the owner a Paddle subscription pays is told so, with no portal, Paddle's being none the service hands; their second purchase is one
     held entry of kind "already-pays"; Max's full refund of it at Paddle takes the entry off. */
  await leg("PY", async () => {
    const w = world(K);
    const a = await buy(w, "py1", [[PRICE.leadYear, 1], [PRICE.deskYear, 3]]);
    const c1 = await quietCheck(w, a.buyer.lead);
    const team = b => (b && b.pays && b.pays.team) || null;
    ck(a.r.status === 200 && !!team(c1.body) && team(c1.body).provider === "paddle" && !Object.prototype.hasOwnProperty.call(team(c1.body), "portal")
      && !Object.prototype.hasOwnProperty.call(c1.body, "held"),
      "PY1 the owner a Paddle subscription pays is told so at the quiet check, with no portal and nothing held: " + JSON.stringify(c1.body && { pays: c1.body.pays, held: c1.body.held }));
    const bSub = subscription(w, a.buyer.me, [[PRICE.deskYear, 2]]);
    const bTxn = transaction(w, bSub, T0 + 400 * DAY);
    const eB = event("transaction.completed", { id: bTxn.id });
    await w.post(eB);
    const c2 = await quietCheck(w, a.buyer.lead);
    const kinds = b => (b && Array.isArray(b.held) ? b.held.map(h => h.kind + ":" + h.provider).join(",") : "");
    ck(w.outcome(eB) === "held:second-subscription" && kinds(c2.body) === "already-pays:paddle" && w.paidOf(a.buyer.person).length === 1,
      "PY2 their second purchase through Paddle is held, no second licence, and read as one held entry of kind \"already-pays\": " + JSON.stringify([w.outcome(eB), c2.body && c2.body.held]));
    const adj = { id: pid("adj"), action: "refund", type: "full", status: "approved", transaction_id: bTxn.id, subscription_id: bSub.id, items: [{ id: "adjitm_1" }] };
    w.paddle.adjs.set(adj.id, adj);
    w.clock.now += 3600000;
    await w.post(event("adjustment.updated", { id: adj.id }));
    const c3 = await quietCheck(w, a.buyer.lead);
    ck(!Object.prototype.hasOwnProperty.call(c3.body || {}, "held") && !!team(c3.body),
      "PY3 Max's full refund of it at Paddle takes the entry off, and the owner is still told they pay: " + JSON.stringify(c3.body && { pays: c3.body.pays, held: c3.body.held }));
  });

  /* THE OPERATOR'S LISTING (scripts/pay-held.mjs; Claude alpha, 2026-11-19: "a held second subscription is money taken with no seats given ...
     it must not sit unseen"): its SELECT, run on the stand-in, shows the held notice with its provider and event id, and not an applied one. */
  await leg("P42", async () => {
    const w = world(K);
    const a = await buy(w, "p42", [[PRICE.leadYear, 1], [PRICE.deskYear, 3]]);
    const bSub = subscription(w, a.buyer.me, [[PRICE.deskYear, 2]]);
    const eB = event("transaction.completed", { id: transaction(w, bSub, T0 + 400 * DAY).id });
    await w.post(eB);
    const rows = w.db.raw.prepare(K.held.makeHeldSql({})).all();
    const mine = rows.find(r => r.event_id === eB.event_id) || {};
    ck(w.outcome(eB) === "held:second-subscription" && mine.outcome === "held:second-subscription" && mine.provider === "paddle" && mine.type === "transaction.completed"
      && rows.length === 1 && w.count("pay_events") === 2,
      "P42a the operator's listing shows the held second-subscription notice with its provider and event id, and not the applied first payment beside it: "
      + JSON.stringify({ rows: rows.length, events: w.count("pay_events"), outcome: mine.outcome }));
    const one = w.db.raw.prepare(K.held.makeHeldSql({ limit: 1 })).all();
    const refused = [0, 501, 1.5, "7"].map(n => { try { K.held.makeHeldSql({ limit: n }); return false; } catch { return true; } });
    ck(one.length === 1 && refused.every(Boolean), "P42b a limit of 1 lists one row; 0, 501, 1.5 and a text are refused: " + one.length + " " + refused.join());
  });

  /* Only a PAYING subscription blocks a second (Claude alpha, 2026-11-19: "only a subscription that is PAYING blocks a second, that is
     active or trialing"): a customer whose card failed, and who buys afresh, gets the seats they just paid for. One check per Paddle status
     that is not paying; the old one recovering its payment beside the live new one is held and listed. */
  await leg("P43", async () => {
    const statusOf = (w, sub) => (w.db.raw.prepare("SELECT status FROM pay_subs WHERE provider = 'paddle' AND sub = ?").get(sub) || {}).status;
    for (const [tag, st] of [["P43a", "past_due"], ["P43b", "paused"]]) {
      const w = world(K);
      const a = await buy(w, tag.toLowerCase(), [[PRICE.leadYear, 1], [PRICE.deskYear, 3]]);
      const lic = w.paidOf(a.buyer.person)[0];
      a.sub.status = st;
      await w.post(event("subscription.updated", { id: a.sub.id }));
      const recorded = statusOf(w, a.sub.id), orders = w.count("orders");
      const bSub = subscription(w, a.buyer.me, [[PRICE.deskYear, 2]]);
      const eB = event("transaction.completed", { id: transaction(w, bSub, T0 + 400 * DAY).id });
      await w.post(eB);
      const bought = w.licence(lic.id);
      ck(recorded === st && w.outcome(eB) === "applied" && bought.seats === 5 && bought.lead_seats === 1 && w.count("pay_subs") === 2 && w.count("orders") === orders + 1,
        tag + " a first payment for a licence whose only other subscription is " + st + " is applied, the seats paid for added: "
        + JSON.stringify({ recorded, outcome: w.outcome(eB), seats: bought.seats, subs: w.count("pay_subs"), orders: w.count("orders") - orders }));
    }
    const w = world(K);
    const a = await buy(w, "p43c", [[PRICE.leadYear, 1], [PRICE.deskYear, 3]]);
    const lic = w.paidOf(a.buyer.person)[0];
    a.sub.status = "past_due";
    await w.post(event("subscription.updated", { id: a.sub.id }));
    const bSub = subscription(w, a.buyer.me, [[PRICE.deskYear, 2]]);
    const eB = event("transaction.completed", { id: transaction(w, bSub, T0 + 400 * DAY).id });
    await w.post(eB);
    const live = w.licence(lic.id), rowOld = () => w.db.raw.prepare("SELECT lead_seats, seats, paid_until, status FROM pay_subs WHERE provider = 'paddle' AND sub = ?").get(a.sub.id) || {};
    const rowBefore = rowOld(), orders = w.count("orders");
    a.sub.status = "active";
    const back = transaction(w, a.sub, T0 + 730 * DAY, { origin: "subscription_recurring" });
    const eBack = event("transaction.completed", { id: back.id }), rBack = await w.post(eBack);
    const after = w.licence(lic.id), rowAfter = rowOld();
    ck(w.outcome(eB) === "applied" && rBack.status === 200 && w.outcome(eBack) === "held:second-subscription" && after.seats === live.seats && after.lead_seats === live.lead_seats
      && after.paid_until === live.paid_until && JSON.stringify(rowAfter) === JSON.stringify(rowBefore) && w.count("orders") === orders && w.count("pay_subs") === 2,
      "P43c the old subscription recovering its payment while the new one is live is held \"second-subscription\" and changes no seat, date or row: "
      + JSON.stringify({ outcome: w.outcome(eBack), seats: [live.seats, after.seats], until: [live.paid_until, after.paid_until], row: [rowBefore, rowAfter], orders: w.count("orders") - orders }));
    const rows = w.db.raw.prepare(K.held.makeHeldSql({})).all();
    const mine = rows.find(r => r.event_id === eBack.event_id) || {};
    ck(mine.outcome === "held:second-subscription" && mine.provider === "paddle" && mine.type === "transaction.completed",
      "P43d the operator's listing shows that recovered notice with its provider and event id: " + JSON.stringify({ rows: rows.length, outcome: mine.outcome, provider: mine.provider }));
  });

  /* Seats follow what was paid, whatever order the events arrive in (register 47.13, 48.7). */
  await leg("P44", async () => {
    /* A cancelled subscription's payment counts the items it held at its end: one removed earlier stays on the subscription as inactive
       and is not one of them (a retired price, or a desk-only item, beside the lead and desks held at the end). */
    const w = world(K);
    const e1 = T0 + 30 * DAY, e2 = T0 + 60 * DAY;
    const p = await buy(w, "p44", [[PRICE.leadMonth, 1], [PRICE.deskMonth, 2]], { ends: e1 });
    const id = w.paidOf(p.buyer.person)[0].id;
    const ren = transaction(w, p.sub, e2, { origin: "subscription_recurring" });
    p.sub.status = "canceled";
    p.sub.items = p.sub.items.map(i => Object.assign({}, i, { status: "inactive" }))
      .concat([{ status: "inactive", quantity: 1, price: { id: PRICE.oneMonth, billing_cycle: CYCLE(PRICE.oneMonth) } }]);
    const ev = event("transaction.completed", { id: ren.id });
    const r = await w.post(ev);
    const lic = w.licence(id) || {};
    ck(r.status === 200 && w.outcome(ev) === "applied" && lic.lead_seats === 1 && lic.seats === 2 && lic.paid_until === e2 + GRACE,
      "P44a a cancelled subscription's completed renewal counts the items it held at its end, not one removed earlier and kept as inactive: "
      + JSON.stringify({ status: r.status, outcome: w.outcome(ev), lead: lic.lead_seats, desks: lic.seats, paidDay: (lic.paid_until - T0) / DAY }));
    const w2 = world(K);
    const q = await buy(w2, "p44b", [[PRICE.leadMonth, 1], [PRICE.deskMonth, 2]], { ends: e1 });
    const qid = w2.paidOf(q.buyer.person)[0].id;
    q.sub.items = itemsOf([[PRICE.leadMonth, 1], [PRICE.deskMonth, 3]]);
    const rise = transaction(w2, q.sub, e1, { origin: "subscription_update", items: itemsOf([[PRICE.deskMonth, 3]]).map(i => ({ price: i.price, quantity: i.quantity })) });
    q.sub.status = "canceled";
    q.sub.items = q.sub.items.map(i => Object.assign({}, i, { status: "inactive" }))
      .concat([{ status: "inactive", quantity: 4, price: { id: PRICE.deskYear, billing_cycle: CYCLE(PRICE.deskYear) } }]);
    const ev2 = event("transaction.completed", { id: rise.id });
    const r2 = await w2.post(ev2);
    const lic2 = w2.licence(qid) || {};
    ck(r2.status === 200 && lic2.lead_seats === 1 && lic2.seats === 3,
      "P44b a rise read after the cancel counts a desk item of another price, removed earlier, not at all, only the 3 desks the subscription held at its end: "
      + JSON.stringify({ status: r2.status, outcome: w2.outcome(ev2), lead: lic2.lead_seats, desks: lic2.seats }));
  });

  await leg("P45", async () => {
    /* One subscription, periods paid out of order: a delayed older period never lowers what a newer one bought. */
    const w = world(K);
    const e1 = T0 + 30 * DAY, e2 = T0 + 60 * DAY, e3 = T0 + 90 * DAY;
    const p = await buy(w, "p45", [[PRICE.leadMonth, 1], [PRICE.deskMonth, 2]], { ends: e1 });
    const id = w.paidOf(p.buyer.person)[0].id;
    const t2 = transaction(w, p.sub, e2, { origin: "subscription_recurring" });
    p.sub.items = itemsOf([[PRICE.leadMonth, 2], [PRICE.deskMonth, 5]]);
    const t3 = transaction(w, p.sub, e3, { origin: "subscription_recurring" });
    const e3v = event("transaction.completed", { id: t3.id });
    await w.post(e3v);
    const mid = w.licence(id) || {};
    const e2v = event("transaction.completed", { id: t2.id });
    const r2 = await w.post(e2v);
    const lic = w.licence(id) || {};
    const row = w.db.raw.prepare("SELECT lead_seats, seats, paid_until FROM pay_subs WHERE sub = ?").get(p.sub.id) || {};
    ck(mid.lead_seats === 2 && mid.seats === 5 && r2.status === 200
      && lic.lead_seats === 2 && lic.seats === 5 && lic.paid_until === e3 + GRACE && row.lead_seats === 2 && row.seats === 5 && row.paid_until === e3 + GRACE,
      "P45a a delayed older period's renewal, arriving after a newer period's that raised the seats, leaves 2 leads and 5 desks and the later date: "
      + JSON.stringify({ outcome: w.outcome(e2v), mid: [mid.lead_seats, mid.seats], lic: [lic.lead_seats, lic.seats, (lic.paid_until - T0) / DAY], row: [row.lead_seats, row.seats] }));
  });

  /* A BUYER OF DESK SEATS ONLY HOLDS NO STUDIO SEAT (register 47.4; the review's finding 4): a team licence with no lead seat in force grants
     no Studio licence, grant or member certificate to its owner, however the owner comes to it (a desk-only first purchase, or the lead
     subscription refunded beside a desk one). */
  await leg("P47", async () => {
    const deskOnlyOwner = async (w, name) => {
      const owner = await signin(w, name, "acme.example");
      const sub = subscription(w, owner.me, [[PRICE.deskMonth, 2]]);
      await paid(w, transaction(w, sub, T0 + 30 * DAY));
      w.clock.now = T0 + 32 * DAY;
      const sub2 = subscription(w, owner.me, [[PRICE.deskMonth, 2]]);
      sub.status = "canceled";
      await w.post(event("subscription.canceled", { id: sub.id }));
      await paid(w, transaction(w, sub2, T0 + 74 * DAY));
      w.clock.now = T0 + 33 * DAY;
      const sig = await renewOwner(w, name, "acme.example", owner.lead);
      const list = await callSigned(w, "seat/list", owner.lead, {}, RQ.seatListBytes);
      return { owner, sig, list, lic: w.paidOf(owner.person)[0] || {} };
    };
    const w = world(K);
    const d = await deskOnlyOwner(w, "p47-desk-only");
    const b = d.sig.body || {};
    const paidLic = !!b.licence && !b.trial && await licenceHolds(b.licence);
    const inLead = (w.db.raw.prepare("SELECT " + inForceCol("lead_seats", "l.id", String(w.clock.now), "l") + " AS n FROM licences l WHERE l.id = ?").get(d.lic.id) || {}).n;
    const held = d.list.body && d.list.body.counts ? d.list.body.counts.lead.held : 0;
    const quiet = await quietCheck(w, d.owner.lead), qb = quiet.body || {};
    const quietPaid = !!qb.licence && await licenceHolds(qb.licence);
    ck(inLead === 0 && !paidLic && !b.grant && !b.certificate && held === 0 && !quietPaid && !qb.grant,
      "P47a a buyer of two desk seats and no lead seat, signing in past their trial (refused or given no licence), gets no paid Studio licence, no relay grant, no member certificate and no lead seat, and the quiet check after it gives none either: "
      + JSON.stringify({ inForceLead: inLead, status: d.sig.status, paidLic, grant: !!b.grant, cert: !!b.certificate, held, listStatus: d.list.status, quiet: quiet.status, quietPaid, quietGrant: !!qb.grant }));
    /* The same owner whose lead seat lapsed beside a desk subscription: the lead seat they held is no seat once the lead is gone, on the quiet check too. */
    const w3 = world(K);
    const o3 = await buy(w3, "p47-lapsed", [[PRICE.leadMonth, 1], [PRICE.deskMonth, 2]], { ends: T0 + 10 * DAY });
    w3.clock.now = T0 + DAY;
    await renewOwner(w3, "p47-lapsed", "acme.example", o3.buyer.lead);
    w3.clock.now = T0 + 20 * DAY;
    o3.sub.status = "canceled";
    await w3.post(event("subscription.canceled", { id: o3.sub.id }));
    await paid(w3, transaction(w3, subscription(w3, o3.buyer.me, [[PRICE.deskMonth, 2]]), T0 + 74 * DAY));
    w3.clock.now = T0 + 28 * DAY;
    const lic3 = w3.paidOf(o3.buyer.person)[0] || {};
    const in3 = (w3.db.raw.prepare("SELECT " + inForceCol("lead_seats", "l.id", String(w3.clock.now), "l") + " AS n FROM licences l WHERE l.id = ?").get(lic3.id) || {}).n;
    /* The seat's last sight is set past the licence's grace, its proof kept fresh: a state sign-in cannot make (it sets both), which leadHolds must read the same way. */
    w3.db.raw.prepare("UPDATE seats SET seen_at = ? WHERE kind = 'lead'").run(w3.clock.now - 31 * DAY);
    const l3 = await callSigned(w3, "seat/list", o3.buyer.lead, {}, RQ.seatListBytes);
    const q3 = await quietCheck(w3, o3.buyer.lead), q3b = q3.body || {};
    const q3Paid = !!q3b.licence && await licenceHolds(q3b.licence);
    ck(in3 === 0 && !q3Paid && !q3b.grant && l3.status !== 200,
      "P47c an owner whose lead subscription has lapsed beside a desk one, their lead seat seen long before the grace, is given no paid Studio licence and no grant by the quiet check, and leads nothing (the seat list is refused): "
      + JSON.stringify({ inForceLead: in3, status: q3.status, paid: q3Paid, grant: !!q3b.grant, seatList: l3.status }));
    /* The control: a lead seat bought beside the desks is the owner's, as before. */
    const w2 = world(K);
    const o2 = await buy(w2, "p47-control", [[PRICE.leadMonth, 1], [PRICE.deskMonth, 2]], { ends: T0 + 30 * DAY });
    w2.clock.now = T0 + 20 * DAY;
    const s2 = await renewOwner(w2, "p47-control", "acme.example", o2.buyer.lead);
    const l2 = await callSigned(w2, "seat/list", o2.buyer.lead, {}, RQ.seatListBytes);
    ck(s2.status === 200 && !!s2.body.licence && !s2.body.trial && await licenceHolds(s2.body.licence) && !!s2.body.grant && l2.body.counts.lead.held === 1 && l2.body.counts.lead.of === 1,
      "P47b control: an owner with a lead seat in force keeps the paid Studio licence, the grant and the seat: "
      + JSON.stringify({ status: s2.status, trial: !!s2.body.trial, grant: !!s2.body.grant, counts: l2.body && l2.body.counts }));
  });

  /* Held keeps one meaning (Claude alpha, 2026-11-13): every held outcome any leg above provoked wrote its event row and nothing else. */
  const heldPosts = AUDIT.slice(), wrong = heldPosts.filter(a => !a.only).map(a => a.outcome);
  ck(heldPosts.length >= 20 && wrong.length === 0, "P20 every held outcome writes only its event row: " + heldPosts.length + " held posts audited, "
    + (wrong.length ? "wrote more: " + wrong.join(",") : "none wrote more"));
}

/* ---- the plants ------------------------------------------------------------------------------------------------------ */

const PLANTS = [
  /* The paid end (piece S-0, P32): the service's own lines, named alone (tests/licence-service.mjs plants them for s122 too). */
  { name: "paid-end-grace-sub", reds: ["P32a"], subs: [["core.mjs", "if (!(h.row.paid_until > c.now)) return", "if (!(h.row.paid_until > c.now + 14 * DAY)) return"]] },
  { name: "paid-end-check-sub", reds: ["P32b"], marks: [["core.mjs", "/* plant:paid-end-check */", ""]] },
  { name: "paid-end-sticky-sub", reds: ["P32c"], subs: [["core.mjs", "if (!(h.row.paid_until > c.now)) return", "if (true) return"]] },
  { name: "pay-managed", reds: ["P25"], subs: [["pay.mjs", ".bind(buyer.person, PERSON.length, PERSON).first()) return held(c, \"managed\"); /* plant:pay-managed */",
    ".bind(buyer.person, PERSON.length, PERSON).first() && false) return held(c, \"managed\");"]] },
  { name: "paddle-signature", reds: ["P1a", "P1d", "P2a", "P16a"], marks: [["pay.mjs", "/* plant:paddle-signature */", ""]] },
  { name: "paddle-window", reds: ["P1b", "P16a"], marks: [["pay.mjs", "/* plant:paddle-window */", ""]] },
  { name: "paddle-hmac", reds: ["P1d"], marks: [["pay.mjs", "/* plant:paddle-hmac */", "    if (await globalThis.crypto.subtle.verify(\"HMAC\", k, mac, signed)) return true; else return false;"]] },
  { name: "paddle-raw", reds: ["P2a"], subs: [["pay-paddle.mjs", "hmacHolds(cfg.secret, joined(sig.ts + \":\", raw), sig.h1);",
    "hmacHolds(cfg.secret, joined(sig.ts + \":\", new TextEncoder().encode(JSON.stringify(JSON.parse(new TextDecoder().decode(raw))))), sig.h1);"]] },
  { name: "paddle-unsigned-first", reds: ["P16a"], marks: [["pay.mjs", "/* plant:paddle-unsigned-first */", "    await env.DB.prepare(\"SELECT 1 AS x\").first(); if (!sig) return unsigned();"]] },
  { name: "paddle-cap", reds: ["P14b", "P16b"], marks: [["pay.mjs", "/* plant:paddle-cap */", ""]] },
  { name: "paddle-completed", reds: ["P3b"], marks: [["pay-paddle.mjs", "/* plant:paddle-completed */", ""]] },
  { name: "paddle-doorbell", reds: ["P3a"], marks: [["pay.mjs", "/* plant:paddle-doorbell */", "    const r = Object.assign(await p.readPayment(io, cfg, id), c.ev.data.items ? { items: c.ev.data.items.map(i => ({ price: i.price.id, quantity: i.quantity })), billed: c.ev.data.items.map(i => ({ price: i.price.id, quantity: i.quantity })) } : {});"]] },
  { name: "paddle-event-once", reds: ["P4a"], marks: [["pay.mjs", "/* plant:paddle-event-once */", ""]] },
  { name: "paddle-once-read", reds: ["P4b"], subs: [["pay.mjs", "if (await db.prepare(\"SELECT 1 AS o FROM orders WHERE tag = ?1\").bind(tag).first()) {", "if (false) {"]] },
  { name: "paddle-tag-once", reds: ["P4c"], subs: [["pay.mjs", "const { db, p, cfg, now } = c, tag = p.name + \":\" + id;", "const { db, p, cfg, now } = c, tag = p.name + \":\" + id + \":\" + runId();"]] },
  { name: "attach-supersede", reds: ["P5b"], subs: [["attach.mjs", "statement(q => \"UPDATE licences SET trial_ends = MIN(trial_ends, \" + q(o.now) + \") WHERE owner = \"", "statement(q => \"UPDATE licences SET trial_ends = trial_ends WHERE \" + q(o.now) + \" AND owner = \""]] },
  { name: "attach-admits-org", reds: ["P5b"], subs: [["attach.mjs", "statement(q => \"INSERT INTO admits (licence, provider, org) SELECT \" + L(q) + \", \" + o.org.provider(q) + \", \" + o.org.org(q) + \" WHERE \" + G(q) + \" ON CONFLICT DO NOTHING\"),", ""]] },
  /* plant:paddle-second-buyer is retired with decision 45's hold (decision 47): paddle-own and paddle-own-admits stand for it. */
  { name: "paddle-own", reds: ["P6a"], marks: [["pay.mjs", "/* plant:paddle-own */", "    const own = false;"]] },
  { name: "pay-desk-org", reds: ["P6d"], marks: [
    ["pay.mjs", "/* plant:pay-desk-org */", "    const seat = deskOnly ? null : await db.prepare(\"SELECT provider, org FROM seats WHERE kind = 'lead' AND person = ?1\").bind(buyer.person).first();"],
    ["pay.mjs", "/* plant:pay-desk-org-pd */", ""],
    ["pay.mjs", "/* plant:pay-desk-org-prov */", "      provider: q => \"COALESCE((SELECT provider FROM seats WHERE kind = 'lead' AND person = \" + OWNER(q) + \"), (SELECT provider FROM persons WHERE code = \" + q(code) + \"))\","],
    ["pay.mjs", "/* plant:pay-desk-org-sql */", "      org: q => \"COALESCE((SELECT org FROM seats WHERE kind = 'lead' AND person = \" + OWNER(q) + \"), \" + q(PERSON) + \" || \" + OWNER(q) + \")\","],
  ] },
  { name: "pay-own-after-refund", reds: ["P6e"], marks: [["pay.mjs", "/* plant:pay-own-after-refund */", "    const keepOwn = own;"]] },
  { name: "revenue-later", reds: ["P11f"], subs: [["attach.mjs", `+ L(q) + "), 0)) WHERE tag = " + q(o.tag) + " AND run = " + q(o.run) + " AND revenue_year IS NULL")]; /* plant:revenue-later */`,
    `+ L(q) + ") * 0, 0)) WHERE tag = " + q(o.tag) + " AND run = " + q(o.run) + " AND revenue_year IS NULL")];`]] },
  { name: "pay-revenue-renewal", reds: ["P8d"], subs: [["pay.mjs", `statement(q => "UPDATE orders SET revenue_year = MAX(CAST(strftime('%Y', at / 1000, 'unixepoch') AS INTEGER), COALESCE((SELECT CAST(strftime('%Y', paid_until / 1000, 'unixepoch') AS INTEGER) FROM licences WHERE id = " + R(q, "licence")`,
    `statement(q => "UPDATE orders SET revenue_year = revenue_year + 0 * MAX(0, COALESCE((SELECT 1 FROM licences WHERE id = " + R(q, "licence")`]] },
  { name: "pay-revenue-refund", reds: ["P11f"], subs: [["pay.mjs", `statement(q => "UPDATE orders SET revenue_year = MAX(CAST(strftime('%Y', at / 1000, 'unixepoch') AS INTEGER), COALESCE((SELECT CAST(strftime('%Y', paid_until / 1000, 'unixepoch') AS INTEGER) FROM licences WHERE id = " + L(q)`,
    `statement(q => "UPDATE orders SET revenue_year = revenue_year + 0 * MAX(0, COALESCE((SELECT 1 FROM licences WHERE id = " + L(q)`]] },
  { name: "paddle-own-admits", reds: ["P6a"], marks: [["pay.mjs", "/* plant:paddle-own-admits */", "    const org = deskOnly ? null : tenant;"]] },
  /* The race's two guards, the licence's owner and, where its first subscription is live, one subscription per licence, both off. */
  { name: "paddle-second-buyer-sql", reds: ["P6c"], marks: [["pay.mjs", "/* plant:paddle-second-buyer-sql */", "      orderWhere: (q, e) => \"\""], ["pay.mjs", "/* plant:pay-one-subscription */", "        + \"\","]] },
  { name: "paddle-desk-only", reds: ["P7a"], marks: [["pay.mjs", "/* plant:paddle-desk-only */", "    const deskOnly = false;"]] },
  { name: "paddle-paid-max", reds: ["P8c"], marks: [["pay.mjs", "/* plant:paddle-paid-max */", "        + \"paid_until = \" + q(k.end) + \", updates_until = \" + q(k.endDay) + \" \""]] },
  { name: "paddle-seat-diff", reds: ["P9b", "P9c", "P21d"], marks: [["pay.mjs", "/* plant:paddle-seat-diff */", "        + \"seats = MAX(1, seats + \" + q(k.desk) + \"), \""]] },
  { name: "paddle-canceled", reds: ["P10e"], marks: [["pay.mjs", "/* plant:paddle-canceled */", ""]] },
  /* Moved 2026-11-22 (Grok alpha's A1): old reds P10c and P18b; new P18b alone, since a row past its paid date drops whatever its status, so
     P10c's drop no longer rests on the word "canceled". */
  { name: "paddle-cancel-own", reds: ["P18b"], marks: [["pay.mjs", "/* plant:paddle-cancel-own */", "      db.prepare(\"UPDATE pay_subs SET updated_at = ?3 WHERE provider = ?1 AND sub = ?2\").bind(p.name, id, now),"]] },
  { name: "paddle-refund-shape", reds: ["P11a"], marks: [["pay-paddle.mjs", "/* plant:paddle-refund-shape */", "    if (false)"]] },
  { name: "paddle-refund-current", reds: ["P11b"], marks: [["pay.mjs", "/* plant:paddle-refund-current */", ""],
    ["pay.mjs", "/* plant:paddle-refund-once */", "        + \" WHERE EXISTS (SELECT 1 FROM pay_subs WHERE provider = \" + q(p.name) + \" AND sub = \" + q(subId) + \") ON CONFLICT (tag) DO NOTHING\"),"]] },
  { name: "paddle-sole", reds: ["P11e", "P18c"], subs: [["pay.mjs", "+ \" AND \" + G(q) + \" AND \" + sole(q)),", "+ \" AND \" + G(q)),"]] },
  { name: "paddle-code-known", reds: ["P12a"], marks: [["pay.mjs", "/* plant:paddle-code-known */", ""]] },
  { name: "paddle-code-shape", reds: ["P12a"], marks: [["pay.mjs", "/* plant:paddle-code-shape */", ""]] },
  { name: "paddle-dispatch", reds: ["P13a"], marks: [["core.mjs", "/* plant:paddle-dispatch */", ""]] },
  { name: "paddle-api-status", reds: ["P15a"], marks: [["pay.mjs", "/* plant:paddle-api-status */", ""]] },
  { name: "paddle-timeout", reds: ["P15a"], subs: [["pay.mjs", "timer = setTimeout(() => { if (ctl) ctl.abort(); no(retry(\"timeout\")); }, timeoutMs);", "timer = setTimeout(() => {}, timeoutMs);"]] },
  { name: "paddle-period", reds: ["P17a"], marks: [["pay-paddle.mjs", "/* plant:paddle-period */", ""]] },
  { name: "paddle-origin", reds: ["P17a"], marks: [["pay-paddle.mjs", "/* plant:paddle-origin */", ""]] },
  { name: "paddle-one-time", reds: ["P17a"], subs: [["pay-paddle.mjs", "&& cfg.prices.has(it.price.id) && plain(it.price.billing_cycle)))", "&& cfg.prices.has(it.price.id)))"]] },
  { name: "paddle-price-known", reds: ["P17a"], marks: [["pay.mjs", "/* plant:paddle-price-known */", "      if (!kind) continue;"], ["pay.mjs", "/* plant:pay-billed-price */", "      if (!prices.get(l.price)) continue;"]],
    subs: [["pay-paddle.mjs", "&& cfg.prices.has(it.price.id) && plain(it.price.billing_cycle)))", "&& plain(it.price.billing_cycle)))"]] },
  /* Claude alpha's rulings of 2026-11-13 */
  { name: "paddle-refund-held", reds: ["P20", "P11e", "P18c"], subs: [["pay.mjs", "THEN 'refund-one-source' WHEN", "THEN 'held:refund-shared' WHEN"]] },
  { name: "paddle-refund-updates", reds: ["P18e"], subs: [["pay.mjs", "+ \"updates_until = MIN(updates_until, MAX(COALESCE(invoiced_updates_until, ''), ", "+ \"updates_until = MIN(updates_until, MAX(updates_until, "]] },
  { name: "paddle-refund-date", reds: ["P18d", "P18e", "P21e"], marks: [["pay.mjs", "/* plant:paddle-refund-date */", "        + \"WHERE 0 AND id = \" + L(q) + \" AND refunded = 0 AND \" + G(q)),"]] },
  { name: "attach-release-not-invoice", reds: ["P21e"], subs: [["scripts/attach-seats.mjs", "      + (!release && (paidNamed !== null || o.renew) ? \", invoiced_until", "      + ((paidNamed !== null || o.renew) ? \", invoiced_until"]] },
  { name: "paddle-known-licence", reds: ["P21c", "P8b"], subs: [["pay.mjs", "    if (row) return knownSubscription(", "    if (row && false) return knownSubscription("]] },
  { name: "attach-release", reds: ["P21b", "P21c"], subs: [["attach.mjs", "+ \" WHERE \" + G(q) + \" ON CONFLICT (provider, sub) DO NOTHING\"), /* plant:attach-release */", "+ \" WHERE 0 ON CONFLICT (provider, sub) DO NOTHING\"),"]] },
  { name: "attach-release-once", reds: ["P21d", "P90f"], subs: [["attach.mjs", "\") IS NOT NULL AND NOT EXISTS (SELECT 1 FROM pay_subs WHERE provider = \"", "\") IS NOT NULL AND (1 OR EXISTS (SELECT 1 FROM pay_subs WHERE provider = \""],
    ["attach.mjs", "+ q(o.release.sub) + \")\" : \"\")", "+ q(o.release.sub) + \"))\" : \"\")"]] },
  { name: "attach-release-paid", reds: ["P90a"], marks: [["attach.mjs", "/* plant:attach-release-paid */",
    "  const releasedPaid = q => \"(SELECT paid_until FROM licences WHERE id = \" + L(q) + \")\";"]] },
  { name: "attach-period-end", reds: ["P90b", "P90g", "P90h"], marks: [["scripts/attach-seats.mjs", "/* plant:attach-period-end */",
    "    leadSeats: o.deskOnly ? 0 : leadSeats, seats, paidUntil: paidNamed !== null ? paidNamed : newPaid };"]] },
  { name: "attach-period-end-required", reds: ["P90i"], marks: [["scripts/attach-seats.mjs", "/* plant:attach-period-end-required */", ""]] },
  { name: "attach-release-key", reds: ["P91a", "P91b"], marks: [["scripts/attach-seats.mjs", "/* plant:attach-release-key */", "  const tag = \"attach:\" + (o.order !== undefined ? o.order : crypto.randomBytes(12).toString(\"hex\"));"]] },
  { name: "attach-renew-settle", reds: ["P90d"], marks: [["scripts/attach-seats.mjs", "/* plant:attach-renew-settle */", ""]] },
  { name: "paddle-zero-listed", reds: ["P22a", "P22b"], marks: [["pay-paddle.mjs", "/* plant:paddle-zero-listed */", "    return \"applied\";"]] },
  { name: "paddle-origin-row", reds: ["P17a"], marks: [["pay.mjs", "/* plant:paddle-origin-row */", ""]] },
  /* decision 48: one core, each provider answering only where PAY_PROVIDERS names it */
  /* one check for a typed organisation, Stripe and Paddle alike */
  /* Grok's review 6, finding 5A: a name outside the bound takes the default, never held */
  { name: "pay-org-default", reds: ["P24a"], marks: [["pay.mjs", "/* plant:pay-org-default */", "      else return held(c, \"org\");"]] },
  { name: "pay-org-bound", reds: ["P24a"], marks: [["pay.mjs", "/* plant:pay-org-bound */", "    void cps;"]] },
  /* Grok's review 6, finding 1: a refund that arrives before its payment */
  { name: "paddle-refunded-payment", reds: ["P26a", "P26b"], marks: [["pay-paddle.mjs", "/* plant:paddle-refunded-payment */", ""]] },
  { name: "pay-refund-unknown", reds: ["P26a"], subs: [["pay.mjs", "return held(c, await unknown() ? \"payment-unknown\" : a.origin === \"rise\" ? \"refund-rise\" : \"not-current-period\");", "return held(c, a.origin === \"rise\" ? \"refund-rise\" : \"not-current-period\");"]] },
  /* Grok's review 6, finding 2: seats are what the paid transaction billed */
  { name: "pay-billed-cap", reds: ["P27a"], marks: [["pay.mjs", "/* plant:pay-billed-cap */", "    const capped = kind => n[kind];"]] },
  { name: "pay-rise-on-top", reds: ["P27b"], subs: [["pay.mjs", "k.onTop ? \"MIN(\" + q(k.desk) + \", \" + R(q, \"seats\") + \" + \" + q(k.onTop.desk) + \")\" : q(k.desk), k.desk, k.subNow.desk); /* plant:pay-rise-on-top */", "q(k.desk), k.desk, k.subNow.desk); /* plant:pay-rise-on-top */"]] },
  /* Review 4, finding 5: an earlier period's notice, and an older notice below the items still held, writes no seat. */
  /* Claude alpha, 2026-11-19: only a paying subscription (active or trialing) blocks a second, and the old one recovering beside the live new one is held. */
  { name: "pay-paying-status", reds: ["P43a", "P43b"], marks: [["pay.mjs", "/* plant:pay-paying-status */", "const payingWhere = alias => (alias ? alias + \".\" : \"\") + \"status NOT IN ('canceled', 'refunded')\";"]] },
  { name: "pay-recovered-second", reds: ["P43c", "P43d"], marks: [["pay.mjs", "/* plant:pay-recovered-second */", "      void 0;"]] },
  { name: "pay-seat-kept", reds: ["P39a"], marks: [["pay.mjs", "/* plant:pay-seat-kept */", "      return noticeSql;"]] },
  /* Review 4, findings 10 and 6: in the period already paid, the higher of the held count and the notice is what is written. */
  { name: "pay-seat-carry", reds: ["P40a", "P40b", "P40c"], marks: [["pay.mjs", "/* plant:pay-seat-carry */", "      const carried = noticeSql;"]] },
  /* Grok's review 6, finding 4: a sole subscription's cancel keeps its seats to its own date */
  { name: "pay-cancel-sole", reds: ["P28a"], marks: [["pay.mjs", "/* plant:paddle-cancel-own */", "      db.prepare(\"UPDATE licences SET seats = MAX(1, seats - (SELECT seats FROM pay_subs WHERE provider = ?1 AND sub = ?2)), lead_seats = MAX(1, lead_seats - (SELECT lead_seats FROM pay_subs WHERE provider = ?1 AND sub = ?2)) WHERE id = (SELECT licence FROM pay_subs WHERE provider = ?1 AND sub = ?2)\").bind(p.name, id),"]] },
  { name: "pay-raise-lapsed", reds: ["P28b"], marks: [["pay.mjs", "/* plant:pay-raise-lapsed */", "      raise: q => (deskOnly ? \"\" : \"lead_seats = lead_seats + \" + q(lead) + \", \") + \"seats = seats + \" + q(desk) + \", \""]] },
  { name: "pay-in-force", reds: ["P28c"], subs: [["pay.mjs", "  return \"MAX(1, \" + p + \" - COALESCE((SELECT SUM(\" + col + \") FROM \" + passedWhere(licExpr, nowExpr) + \"), 0))\"; /* plant:pay-in-force */",
    "  return p;"]] },
  { name: "pay-settle-lic", reds: ["P10d", "P28d"], marks: [["pay.mjs", "/* plant:pay-settle-lic */", "    statement(q => \"UPDATE licences SET seats = seats, \""]] },
  { name: "pay-settle-zero", reds: ["P28c", "P28d"], subs: [["pay.mjs", "    statement(q => \"UPDATE pay_subs SET seats = 0, lead_seats = 0, updated_at = \" + q(now) /* plant:pay-settle-zero */\n      + \" WHERE licence = \" + L(q) + \" AND paid_until <= \" + q(now) + \" AND (seats > 0 OR lead_seats > 0)\" + s(q)),",
    "    statement(q => \"UPDATE pay_subs SET seats = seats WHERE 0 AND \" + q(now) + s(q)),"]] },
  { name: "pay-settle-except", reds: ["P33a"], marks: [["pay.mjs", "/* plant:pay-settle-except */", "      ...settleStatements(q => R(q, \"licence\"), now, G),"]] },
  { name: "pay-live-floor", reds: ["P34a"], marks: [["pay.mjs", "/* plant:pay-live-floor */", "  return \"(CASE WHEN false \""]] },
  { name: "pay-live-lead", reds: ["P34a"], marks: [["pay.mjs", "/* plant:pay-live-lead */", "      statement(q => \"UPDATE licences SET \" + (k.deskOnly ? \"\" : \"lead_seats = MAX(1, lead_seats + \" + LEAD(q) + \" - \" + R(q, \"lead_seats\") + \"), \")"]] },
  { name: "pay-unknown-retry", reds: ["P35a"], marks: [["pay.mjs", "/* plant:pay-unknown-retry */", "      if (false) throw retry(\"subscription-unknown\");"]] },
  { name: "pay-unknown-held", reds: ["P38a"], marks: [["pay.mjs", "/* plant:pay-unknown-held */", "      throw retry(\"subscription-unknown\");"]] },
  { name: "pay-desk-floor", reds: ["P37a", "P37b"], marks: [["pay.mjs", "/* plant:pay-desk-floor */", ""]] },
  { name: "paddle-inactive-on-txn", reds: ["P44a", "P44b"], marks: [["pay-paddle.mjs", "/* plant:paddle-inactive-on-txn */", "    const items = (activeItems.length || s.status !== \"canceled\" ? activeItems : s.items.filter(it => plain(it) && it.status === \"inactive\"))"]] },
  { name: "paddle-canceled-payment", reds: ["P36a"], marks: [["pay-paddle.mjs", "/* plant:paddle-canceled-payment */", "    if (s.status !== \"active\" && s.status !== \"trialing\") return { held: \"subscription-status\" };"]] },
  { name: "in-force-desk", reds: ["P28c"], subs: [["core.mjs", "ELSE \" + inForceCol(\"seats\", \"licences.id\", NOW, \"\") + \" END", "ELSE seats END"]] },
  { name: "in-force-lead", reds: ["P28e"], subs: [["core.mjs", "THEN \" + inForceCol(\"lead_seats\", \"licences.id\", NOW, \"\") + \" * (1 - desk_only)", "THEN lead_seats * (1 - desk_only)"]] },
  { name: "in-force-lead-name", reds: ["P28c"], subs: [["core.mjs", "+ \"AND (SELECT COUNT(*) FROM lead_names WHERE licence = ?1 AND person <> ?3) + 1 < (SELECT \" + inForceCol(\"lead_seats\", \"licences.id\", \"?4\") + \" FROM licences WHERE id = ?1) \" /* plant:name-count */",
    "+ \"AND (SELECT COUNT(*) FROM lead_names WHERE licence = ?1 AND person <> ?3) + 1 < (SELECT lead_seats FROM licences WHERE id = ?1) \""]] },
  { name: "licence-in-force", reds: ["P28c"], marks: [["core.mjs", "/* plant:licence-in-force */", "    const seats = row.seats;"]] },
  { name: "counts-in-force", reds: ["P28c"], marks: [["core.mjs", "/* plant:counts-in-force */", "    const cap = { seats: row.seats, lead_seats: row.lead_seats };"]] },
  /* Grok's review 6, finding 5B: a completed transaction whose subscription is past due is retried, not held */
  { name: "paddle-late-retry", reds: ["P29a"], marks: [["pay-paddle.mjs", "/* plant:paddle-late-retry */", ""]] },
  /* Grok's review 6, finding 5C: a new period paid after a refund gives the licence back */
  { name: "pay-restore", reds: ["P30a"], marks: [["pay.mjs", "/* plant:pay-restore */", "    const restore = false;"]] },
  /* Grok's review 6, finding 3: a rise in the same period does not take the period's payment */
  /* pay-rise-txn retired 2026-11-22 (the test architect's read of e01e2b37, F2): a refund now reads what each payment paid for from its order, so which payment txn names no longer decides a seat, and planting it turned nothing red. */
  /* One subscription per licence (Max, 2026-11-19): a first payment for a licence with a live subscription is held, never applied. */
  /* The operator's listing: the held clause of its SELECT is what shows a held notice at all. */
  { name: "pay-held-where", reds: ["P42a"], marks: [["scripts/pay-held.mjs", "/* plant:pay-held-where */", "  const where = listed.join(\" OR \");"]] },
  { name: "owner-room-in-force", reds: ["P47a"], subs: [["core.mjs", ` AND owner = " + P + " AND desk_only = 0 AND " + inForceCol("lead_seats", "licences.id", NOW, "") + " >= 1))) "; /* plant:owner-room */`,
    ` AND owner = " + P + " AND desk_only = 0))) "; /* plant:owner-room */`]] },
  { name: "lead-holds-owner-in-force", reds: ["P47c"], subs: [["core.mjs", ` OR (l.owner = " + s + ".person AND l.desk_only = 0 AND " + inForceCol("lead_seats", "l.id", NOW, "l") + " >= 1) "`,
    ` OR (l.owner = " + s + ".person AND l.desk_only = 0) "`]] },
  { name: "pay-one-subscription", reds: ["P41a"], marks: [["pay.mjs", "/* plant:pay-one-subscription */", "        + \"\","]] },
  { name: "pay-provider-on", reds: ["P23a"], marks: [["pay.mjs", "/* plant:pay-provider-on */", "    if (!Object.prototype.hasOwnProperty.call(providers, name)) return notThere();"]] },
];

async function plantedModules(p) {
  const dir = path.join(SCRATCH, "plant-" + p.name);
  fs.mkdirSync(dir, { recursive: true });
  const texts = Object.fromEntries(FILES.concat(["scripts/attach-seats.mjs", "scripts/pay-held.mjs"]).map(f => [f, fs.readFileSync(path.join(SERVICE, f), "utf8")]));
  for (const [file, mark, line] of p.marks || []) {
    const lines = texts[file].split("\n"), tag = mark;
    const hits = lines.map((l, i) => (l.indexOf(tag) >= 0 ? i : -1)).filter(i => i >= 0);
    if (hits.length !== 1) throw new Error("plant " + p.name + ": the mark " + mark + " is on " + hits.length + " lines of " + file + ", not one");
    lines[hits[0]] = line;
    texts[file] = lines.join("\n");
  }
  for (const [file, from, to] of p.subs || []) {
    const n = texts[file].split(from).length - 1;
    if (n !== 1) throw new Error("plant " + p.name + ": the line it changes is in " + file + " " + n + " times, not once: " + from.slice(0, 60));
    texts[file] = texts[file].split(from).join(to);
  }
  for (const f of FILES) fs.writeFileSync(path.join(dir, f), texts[f]);
  /* The attach script over the planted attach.mjs, its target.mjs the real one. */
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(dir, "scripts", "attach-seats.mjs"), texts["scripts/attach-seats.mjs"]
    .split('from "./target.mjs"').join("from " + JSON.stringify(pathToFileURL(path.join(SERVICE, "scripts", "target.mjs")).href)));
  /* The operator's listing of held notices, over the planted pay.mjs, its target.mjs the real one. */
  fs.writeFileSync(path.join(dir, "scripts", "pay-held.mjs"), texts["scripts/pay-held.mjs"]
    .split('from "./target.mjs"').join("from " + JSON.stringify(pathToFileURL(path.join(SERVICE, "scripts", "target.mjs")).href)));
  return { core: await import(pathToFileURL(path.join(dir, "core.mjs")).href), schema: texts["schema.sql"],
    held: await import(pathToFileURL(path.join(dir, "scripts", "pay-held.mjs")).href),
    AT: await import(pathToFileURL(path.join(dir, "scripts", "attach-seats.mjs")).href) };
}

/* ---- main ----------------------------------------------------------------------------------------------------------- */

async function main() {
  clearScratch(SCRATCH);
  const before = Object.fromEntries(FILES.map(f => [f, sha(fs.readFileSync(path.join(SERVICE, f)))]));
  const realFetch = globalThis.fetch;
  let net = 0;
  globalThis.fetch = async () => { net++; throw new Error("no leg reaches the network"); };
  try { await legs(await realModules(), check); } finally { globalThis.fetch = realFetch; }
  check(net === 0, "P0 no leg reached the network: the route's reads went to the fake alone: " + net);
  const only = process.env.LICENCE_PADDLE_PLANT;
  for (const p of PLANTS.filter(x => !only || x.name === only)) {
    if (PLANTS_OFF) { skip("P19 plant " + p.name + " turns " + p.reds.join(" and ") + " red (ETIUDA_PLANTS=off)"); continue; }
    const seen = [];
    try {
      const K = await plantedModules(p);
      globalThis.fetch = async () => { throw new Error("no leg reaches the network"); };
      await legs(K, (cond, line) => { if (!cond) { seen.push(String(line).split(" ")[0]); if (only) process.stdout.write("  FAIL (planted " + p.name + ") " + line + NL); } });
    } catch (e) { seen.push("broken: " + e.message); } finally { globalThis.fetch = realFetch; }
    check(p.reds.every(id => seen.includes(id)) && !seen.some(s => s.startsWith("broken")),
      "P19 plant " + p.name + " turns " + p.reds.join(" and ") + " red: " + JSON.stringify(seen));
  }
  const after = Object.fromEntries(FILES.map(f => [f, sha(fs.readFileSync(path.join(SERVICE, f)))]));
  if (PLANTS_OFF) skip("P19z the service's files are byte for byte as before the plants (ETIUDA_PLANTS=off)");
  else check(FILES.every(f => before[f] === after[f]), "P19z the service's files are byte for byte as before the plants");
  dropScratch(SCRATCH, "licence-paddle");
  process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + " plants=" + PLANTS.length + NL);
  if (!only && asserted + skipped !== EXPECTED) {
    process.stderr.write("SUITE DID NOT COMPLETE: " + (asserted + skipped) + " of " + EXPECTED + " checks ran" + NL);
    return 78;
  }
  process.stdout.write(NL + "licence-paddle  " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)" + NL);
  return Math.min(failed, 77);
}

main().then(c => process.exit(c), e => { process.stderr.write(String(e && e.stack || e) + NL); process.exit(2); });
