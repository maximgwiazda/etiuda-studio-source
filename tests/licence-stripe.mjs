/* THE PAYMENT CORE WITH STRIPE ON IT, IN NODE (Claude alpha's decision 48; the design's section 10, Claudius kappa''').
 *
 *     node tests/licence-stripe.mjs
 *
 * service/licence/core.mjs over the pinned engine's forms (worker.mjs RULES), the stand-in D1 and a fake of Stripe's API that answers
 * what each leg says Stripe holds and counts every call. No wrangler, no network, no Stripe account, no key: the secrets below are
 * made up for the run. Buyers are persons the service already holds, by their sign-in codes; what a payment does to an organisation's
 * licence, a trial and a seat is the core's, proved through Paddle in tests/licence-paddle.mjs over the same pay.mjs.
 *
 * THE CRITERION, the service's own: a customer who buys ends up, with no hand of ours, holding a licence Studio accepts; a payment
 * changes a licence only through what Stripe's API says when read back, each event applies once, and anything unclear is held.
 *
 * THE FAKE CATALOGUE is the ruled shape: a lead's seat with Studio, a team desk seat and a one-person desk licence, each monthly and
 * yearly, six prices; amounts are never read but for a total of zero.
 *
 *   S1  the signature: a one-byte change, a t 301 s old or ahead, no header, a header with no t are refused; 299 s passes; unknown
 *       entries in any order are accepted; v0, even carrying a valid HMAC, is never read; several v1 pass with one valid
 *   S2  the HMAC is over the raw body as Stripe sent it, its whitespace kept
 *   S3  the binding: a first invoice.paid before its Checkout Session answers 500 and writes nothing; checkout.session.completed
 *       binds the subscription to client_reference_id; the retried event then applies; a session whose code was dropped binds none
 *       and its payment is held "code"; a renewal of a subscription never bound is held
 *   S4  the doorbell: a signed body claiming 50 seats while the API says 2 gives 2; an invoice not yet paid writes nothing, 500
 *   S5  once: the same event twice reads nothing; a second event for the same invoice is "once"
 *   S6  a renewal (subscription_cycle) extends to its period's end plus 14 days; a late older invoice never shortens it
 *   S7  always_invoice: customer.subscription.updated alone changes no seats; the subscription_update invoice it bills does
 *   S8  customer.subscription.deleted takes off its own seats; one the API still shows active writes nothing, 500
 *   S9  charge.refunded: partial held; full ends a sole-source licence; a payment paying several invoices held; an older period held
 *   S10 disputes: created held with no read; closed won or warning_closed listed and nothing else; closed lost for part of the charge
 *       held; closed lost whole a full chargeback, after which a refund of the same period is "once"; an unexpected status held
 *   S11 a shape the table does not name: billing_reason manual, a one-time line, a price not in the map, a subscription past_due
 *   S12 a total of zero is applied and listed with its discount
 *   S13 the configuration: a secret (not restricted) key, no pinned version or one before 2025-03-31.basil, a missing secret answer 500; with Stripe not named in
 *       PAY_PROVIDERS, pay/stripe is "not there" and reads nothing; with both named, both answer
 *   S14 an unsigned flood costs no D1 call and no Stripe call
 *   S15 Stripe answering 401, a 503 carrying a document, unreachable, or late: 500 and nothing written
 *   S16c a held Stripe purchase released through the attach tool is keyed stripe: and the subscription-only rules take it (register 47.7)
 *   S16 a held Stripe payment Max attaches by hand (--pay-provider stripe) is a known subscription: its renewal then applies
 *   S19 a team is its lead's own (decision 47, held for Max's ruling): a second buyer in an organisation whose paid licence another owns
 *       buys a licence of their own through Stripe, by name and no organisation, which their renewal raises, the first untouched
 *   S21 a refund that arrives before its payment (Grok's review 6, finding 1): held "payment-unknown", and the payment, its charge read back
 *       refunded whole, is held "refunded", for a renewal and for a first payment
 *   S22 seats are what the paid invoice billed (Grok's review 6, finding 2): a subscription raised after the invoice, before its event,
 *       buys nothing more; a proration's credit line for the old quantity is left out
 *   S23 a sole subscription canceled keeps every seat to its own paid date (Grok's review 6, finding 4); bought again after it lapsed,
 *       the licence starts from the new seats; a full refund after the cancel still ends it
 *   S24 a paid invoice whose subscription reads past_due, unpaid or incomplete is retried (500) until active, never held (Grok's
 *       review 6, finding 5B); paused is held (S11a)
 *   S25 a licence its own subscription's refund ended is given back by that subscription's renewal of a later period, listed
 *       "restored" (Grok's review 6, finding 5C); a payment for the refunded period, or a licence ended by hand, stays ended
 *   S26 a rise in the same period leaves the period's own payment the one a refund must match (Grok's review 6, finding 3): its refund
 *       takes off the period's seats and keeps the rise's; the rise's alone takes off the rise's seats (Grok alpha's review of 2026-11-22,
 *       A2 and B4; before it, the period's refund ended the licence and the rise's was held "refund-rise")
 *   S27 the deployment's mode (Grok's review 6, finding 7): an event, a Checkout Session, an invoice or a charge of the other mode is held
 *       "livemode"; a key of the other mode, or no STRIPE_MODE, answers 500 (S13a)
 *   S33 an earlier rise in the same period, delivered after a later one has raised the desks, changes no seat (review 4, finding 5)
 *   S34 a same-period reduction keeps the desks already paid until the next period's invoice, which then takes the lower count
 *       (review 4, finding 6)
 *   S35 a rise for a subscription already refunded, the licence still live from a subscription bought after it, restores nothing
 *   S32 one subscription per licence (Max, 2026-11-19): a second subscription's first invoice for a licence with a live one is held
 *       "second-subscription" and changes nothing; more seats as a change of quantity on the one subscription apply
 *       (review 4, finding 8)
 *   S36 only a paying subscription (active or trialing) blocks a second: with the other past_due, unpaid, paused or incomplete_expired
 *       a new purchase applies; the old one recovering its payment beside the live new one is held "second-subscription", no seat changed
 *   S37 a renewal that arrives before its checkout is bound is retried for a day, then held "unbound", as a rise is; S38 a delayed earlier rise
 *       never lowers the seats a later one set (register 47.10, 48.7)
 *   BY1 to BY10, what a buyer's own programs are told of their payments (board 1020): an owner a subscription pays is told so ("pays",
 *       with the portal's address where STRIPE_PORTAL is Stripe's own login link of this mode) at Studio's sign-in, its quiet check and the
 *       desk's sign-in; a second purchase is held, no second licence, and read as a held entry of kind "already-pays"; seats added as a
 *       change of quantity land on the same licence and seat nobody; a checkout bound and not yet paid reads "pending", any other hold
 *       naming the buyer "review"; Max's refund or attach takes the entry off; erasure, and the retention after thirty days, leave no
 *       payment event naming the person (BY11 and BY12 added after the red commit, red on c2f2c845 as well)
 *   BY13 to BY19, the test architect's read of 23f51b9d mended: "pays" is the hold's own condition, so a named owner (BY13) and a lapsed
 *       licence still paying (BY14) are told, and over the record's cases "pays" is told exactly where a second purchase is held (BY16); a
 *       hold raised inside readPayment names its buyer and reads "review", not "pending" (BY15); a cancel without a refund (BY17) and an
 *       attach that did not record the subscription (BY18) settle nothing; the retention clears a name no longer kept (BY19)
 *   T1  a direct-link first payment from a billing country other than PL is applied and listed country:<billing>/<card>
 *   T2  a Polish billing address with a foreign card is applied and not listed
 *   T3  a Managed Payments payment is never checked: applied, and no payment method read
 *   U1  to U5, the organisation's name typed on the link (the design's 10.8): it names a team's new licence; none typed gives the
 *       copywriter's default by the link (Organizacja direct, Organisation abroad); outside the bound, the default, listed "org-name";
 *       a second subscription's purchase is held and the licence keeps its name; a one-person licence ignores it
 *   PZ1 to PZ6, Grok alpha's deep review of licence payments (2026-11-22, Claudius's brief): seats in force equal seats paid for. A
 *       subscription that stopped paying counts nothing past its paid date, whatever extends the licence (PZ1, A1); a refund removes
 *       exactly the seats its payment bought, a rise's or the period's, after a rise in the same period or one that moved the date (PZ2 to
 *       PZ4, A2 and B4); one invoice billing two intervals is held "intervals", a credit for the old one's unused time no second interval
 *       (PZ5, A3); a status event never turns a row paying, only the payment the route judges does (PZ6, C5). The test architect's read
 *       of that build: a rise that moves the date begins a period, so the month before it refunded takes none of its seats (PZ3a moved,
 *       PZ3c); a renewal carrying a mid-period proration applies (PZ7); a pending checkout lapses after an hour or at its expiry (PZ8).
 *       Its re-read: the period refunded after two rises keeps both (PZ9); a refund inside the latest period's grace keeps what stands
 *       (PZ10); a rise refunded in a period the record kept no part for takes its seats off (PZ11)
 *   S29 a rise that reaches Stripe before its checkout is bound is applied when delivered again after the bind and the
 *       first payment, as it would have been had it arrived after; one whose checkout is never bound is retried while its
 *       event is inside pay.mjs UNKNOWN_RETRY_MS, then held "unbound" and listed
 *   S17 every held outcome writes only its event row
 *   S18 plants: each guarding line, planted out in a copy, turns its legs red; the real files are unchanged
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

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SERVICE = path.join(ROOT, "service", "licence");
const SCRATCH = path.join(ROOT, "scratch", "licence-stripe-legs");
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
const L = await import("../src/licence.mjs");
const FILES = ["core.mjs", "requests.mjs", "schema.sql", "pay.mjs", "pay-paddle.mjs", "pay-stripe.mjs", "attach.mjs", "erase.mjs"];
const AT = await import(pathToFileURL(path.join(SERVICE, "scripts", "attach-seats.mjs")).href);
const realModules = async () => ({ core: await import(pathToFileURL(path.join(SERVICE, "core.mjs")).href), AT, pay: await import(pathToFileURL(path.join(SERVICE, "pay.mjs")).href),
  erase: await import(pathToFileURL(path.join(SERVICE, "erase.mjs")).href), schema: fs.readFileSync(path.join(SERVICE, "schema.sql"), "utf8") });

const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + NL);
  else { failed++; process.stderr.write("  FAIL " + line + NL); }
}
function skip(line) { skipped++; process.stdout.write("  SKIP  " + line + NL); }

/* ---- keys, the catalogue ----------------------------------------------------------------------------------------------- */

const HOUR = 3600000, DAY = 24 * HOUR, GRACE = 14 * DAY;
const T0 = Date.UTC(2026, 10, 14, 9, 0, 0);
const sha = b => crypto.createHash("sha256").update(b).digest("hex");
function edKey() {
  const { privateKey } = crypto.generateKeyPairSync("ed25519");
  const pub = crypto.createPublicKey(privateKey).export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  return { pub, id: "studio-" + sha(Buffer.from(pub, "hex")).slice(0, 16), privateKey, der: privateKey.export({ type: "pkcs8", format: "der" }).toString("hex"),
    sign: bytes => crypto.sign(null, Buffer.from(bytes), privateKey).toString("hex") };
}
const ROOTK = edKey(), SERVICEK = edKey();
const delegation = o => L.createTestDelegation(Object.assign({ key: { id: SERVICEK.id, pub: SERVICEK.pub }, may: ["licence", "relay-grant"],
  from: T0 - 10 * DAY, until: T0 + 300 * DAY }, o || {}), ROOTK.privateKey, "etiuda-root-test");
const DELEGATION = delegation();
const HASHK = crypto.randomBytes(32).toString("hex");
/* A person's own desk trial had (core.mjs DESK_TRIAL; board 1011), so a full licence of their organisation is a wait for them rather than their own
   fourteen days (core.mjs ownTrialFirst): the person as the service keys a Google account, HMAC-SHA-256 under HASH_KEY over its line, iss and sub. */
const deskTrialHad = (w, sub) => {
  const person = crypto.createHmac("sha256", Buffer.from(HASHK, "hex")).update("etiuda-licence-person\nhttps://accounts.google.com\n" + sub).digest("hex");
  w.db.raw.prepare("INSERT INTO licences (key_hash, email_hash, org, seats, updates_until, paid_until, refunded, trial_ends, trial_unit, owner, desk_only) "
    + "VALUES (?, 'signin:', 'Trial', 1, '2026-01-01', 0, 0, ?, ?, ?, 1)").run("signin:had:" + sub, w.clock.now - 1, "desk:" + person, person);
};
const GOOGLE_CLIENT = "123456789012-a1b2c3d4e5f6g7h8.apps.googleusercontent.com";
const GOOGLE_JWKS = "https://www.googleapis.com/oauth2/v3/certs";
const RSA = (() => { const k = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 }); return { privateKey: k.privateKey, kid: "g-stripe-1",
  jwk: Object.assign(k.publicKey.export({ format: "jwk" }), { kid: "g-stripe-1", alg: "RS256", use: "sig" }) }; })();
const b64u = b => Buffer.from(b).toString("base64url");
function googleToken(clock, sub, nonce, hd) {
  const now = Math.floor(clock.now / 1000);
  const claims = { iss: "https://accounts.google.com", azp: GOOGLE_CLIENT, aud: GOOGLE_CLIENT, sub, iat: now, exp: now + 3600, nonce };
  if (hd) claims.hd = hd;
  const h = b64u(JSON.stringify({ alg: "RS256", kid: RSA.kid, typ: "JWT" })), p = b64u(JSON.stringify(claims));
  return h + "." + p + "." + b64u(crypto.sign("sha256", Buffer.from(h + "." + p), RSA.privateKey));
}

const B62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const sid = (prefix, n) => prefix + "_" + Array.from(crypto.randomBytes(n || 24), b => B62[b % 62]).join("");
const PRICE = { leadMonth: sid("price"), leadYear: sid("price"), deskMonth: sid("price"), deskYear: sid("price"), oneMonth: sid("price"), oneYear: sid("price") };
const PRICES = { [PRICE.leadMonth]: "lead", [PRICE.leadYear]: "lead", [PRICE.deskMonth]: "desk", [PRICE.deskYear]: "desk",
  [PRICE.oneMonth]: "desk-only", [PRICE.oneYear]: "desk-only" };
const SECRET = "whsec_" + crypto.randomBytes(24).toString("hex");
const API_KEY = "rk_test_" + sid("x", 40).slice(2);
/* The version wrangler.toml pins: 2025-03-31.basil, where invoices gained parent.subscription_details and line items pricing.price_details. */
const VERSION = "2025-03-31.basil";
const API = "https://api.stripe.com/v1";
/* The customer portal's no-code login link of this test deployment (STRIPE_PORTAL), made up: Stripe's own host, test_ for test mode. */
const PORTAL = "https://billing.stripe.com/p/login/test_" + sid("x", 24).slice(2);

/* ---- Stripe's API, faked ------------------------------------------------------------------------------------------- */

function fakeStripe() {
  const st = { sessions: new Map(), invoices: new Map(), subs: new Map(), pays: [], pis: new Map(), pms: new Map(), charges: new Map(), disputes: new Map(),
    calls: 0, seen: [], mode: null, slowMs: 0 };
  const json = (status, doc) => new Response(JSON.stringify(doc), { status, headers: { "content-type": "application/json" } });
  const one = (m, id) => (m.has(id) ? json(200, m.get(id)) : json(404, { error: { type: "invalid_request_error", code: "resource_missing" } }));
  st.answer = async (url, init) => {
    st.calls++; st.seen.push(url);
    const h = init.headers || {};
    if (init.redirect !== "manual" || init.method !== "GET" || h.authorization !== "Bearer " + API_KEY || h["stripe-version"] !== VERSION)
      return json(403, { error: { type: "permission_error" } });
    if (st.mode === "down") throw new TypeError("fetch failed");
    if (st.mode === "401") return json(401, { error: { type: "invalid_request_error" } });
    if (st.mode === "503") { const i = st.invoices.values().next().value; return json(503, i || {}); }
    if (st.slowMs) await new Promise(r => setTimeout(r, st.slowMs));
    const u = new URL(url), p = u.pathname.replace(/^\/v1/, "");
    let m;
    if ((m = /^\/checkout\/sessions\/(cs_[A-Za-z0-9_]+)$/.exec(p))) return one(st.sessions, m[1]);
    if ((m = /^\/invoices\/(in_[A-Za-z0-9]+)$/.exec(p))) return one(st.invoices, m[1]);
    if ((m = /^\/subscriptions\/(sub_[A-Za-z0-9]+)$/.exec(p))) return one(st.subs, m[1]);
    if ((m = /^\/payment_intents\/(pi_[A-Za-z0-9]+)$/.exec(p))) return one(st.pis, m[1]);
    if ((m = /^\/payment_methods\/(pm_[A-Za-z0-9]+)$/.exec(p))) return one(st.pms, m[1]);
    if ((m = /^\/charges\/(ch_[A-Za-z0-9]+)$/.exec(p))) return one(st.charges, m[1]);
    if ((m = /^\/disputes\/(du_[A-Za-z0-9]+)$/.exec(p))) return one(st.disputes, m[1]);
    if (p === "/charges") {
      const pi = u.searchParams.get("payment_intent");
      return json(200, { object: "list", data: [...st.charges.values()].filter(ch => pi && ch.payment_intent === pi), has_more: false });
    }
    if (p === "/invoice_payments") {
      const inv = u.searchParams.get("invoice"), pi = u.searchParams.get("payment[payment_intent]");
      const data = st.pays.filter(x => (inv ? x.invoice === inv : pi ? x.payment.payment_intent === pi && u.searchParams.get("payment[type]") === "payment_intent" : false));
      return json(200, { object: "list", data, has_more: false });
    }
    return json(404, { error: { type: "invalid_request_error" } });
  };
  return st;
}

/* ---- a world ------------------------------------------------------------------------------------------------------- */

let ipN = 0, tick = 0, AUDIT = [];
function world(K, o) {
  const opts = o || {};
  const clock = { now: opts.now || T0 };
  const db = standInD1(K.schema);
  const stripe = fakeStripe();
  const fetch = async (url, init) => {
    if (url === GOOGLE_JWKS) return new Response(JSON.stringify({ keys: [RSA.jwk] }), { status: 200, headers: { "content-type": "application/json", "cache-control": "max-age=3600" } });
    if (String(url).startsWith(API + "/")) return stripe.answer(url, init);
    if (String(url).startsWith("https://sandbox-api.paddle.com/")) return new Response("{}", { status: 404 });
    throw new Error("no fake answers " + url);
  };
  const service = K.core.makeService({ rules: W.RULES, roots: [ROOTK.pub], clock: () => clock.now, fetch, paddleTimeoutMs: 150 });
  const env = Object.assign({ DB: db, SERVICE_KEY: SERVICEK.der, DELEGATION: JSON.stringify(DELEGATION), HASH_KEY: HASHK,
    STRIPE_WEBHOOK_SECRET: SECRET, STRIPE_API_KEY: API_KEY, STRIPE_VERSION: VERSION, STRIPE_PRICES: JSON.stringify(PRICES), STRIPE_MODE: "test", PAY_PROVIDERS: "stripe" }, opts.env || {});
  for (const [k, v] of Object.entries(env)) if (v === undefined) delete env[k];
  const w = { clock, db, stripe, env, service, AT: K.AT };
  w.call = async (route, body) => {
    const res = await service.fetch(new Request("https://licence.test/licence/v1/" + route, { method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "198.51.100." + (++ipN % 250) + "-" + ipN }, body: JSON.stringify(body) }), env);
    const text = await res.text();
    let parsed = null; try { parsed = JSON.parse(text); } catch { parsed = null; }
    return { status: res.status, body: parsed };
  };
  w.count = table => db.raw.prepare("SELECT COUNT(*) AS n FROM " + table).get().n;
  const dump = skipTable => sha(JSON.stringify(db.raw.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name <> ? ORDER BY name").all(skipTable || "")
    .map(t => [t.name, db.raw.prepare("SELECT * FROM " + t.name + " ORDER BY rowid").all()])));
  w.state = () => dump("");
  /* Stripe's event: the raw text signed as Stripe signs it, or as `p` bends it. Counts D1's and Stripe's calls around it. */
  w.post = async (raw, po) => {
    const p = po || {};
    const text = typeof raw === "string" ? raw : JSON.stringify(raw);
    const t = p.t !== undefined ? p.t : Math.floor(clock.now / 1000);
    const v1 = crypto.createHmac("sha256", p.secret || SECRET).update(t + "." + (p.signedText !== undefined ? p.signedText : text)).digest("hex");
    const header = p.header !== undefined ? p.header : "t=" + t + ",v1=" + (p.v1 || v1);
    const headers = { "content-type": "application/json" };
    if (header !== null) headers["stripe-signature"] = header;
    const init = { method: "POST", headers, body: p.stream || text };
    if (p.stream) init.duplex = "half";
    const d1 = db.calls, sc = stripe.calls;
    const audit = !p.noAudit && !p.stream ? { before: dump("pay_events"), events: w.count("pay_events") } : null;
    const res = await service.fetch(new Request("https://licence.test/licence/v1/" + (p.path || "pay/stripe"), init), env);
    await res.text();
    if (audit) {
      let id = null; try { id = JSON.parse(text).id; } catch { id = null; }
      const outcome = id && (db.raw.prepare("SELECT outcome FROM pay_events WHERE provider = 'stripe' AND event_id = ?").get(id) || {}).outcome;
      if (typeof outcome === "string" && outcome.startsWith("held:"))
        AUDIT.push({ outcome, only: dump("pay_events") === audit.before && w.count("pay_events") === audit.events + 1 });
    }
    return { status: res.status, d1: db.calls - d1, api: stripe.calls - sc };
  };
  w.outcome = ev => (db.raw.prepare("SELECT outcome FROM pay_events WHERE provider = 'stripe' AND event_id = ?").get(ev.id) || {}).outcome;
  w.licence = id => db.raw.prepare("SELECT * FROM licences WHERE id = ?").get(id);
  w.paidOf = person => db.raw.prepare("SELECT * FROM licences WHERE owner = ? AND trial_ends IS NULL ORDER BY id").all(person);
  /** A person the service holds, by a fresh code. */
  w.person = () => {
    const code = Array.from(crypto.randomBytes(16), b => "0123456789ABCDEFGHJKMNPQRSTVWXYZ"[b % 32]).join(""), person = "person-" + sha(code).slice(0, 24);
    db.raw.prepare("INSERT INTO persons (person, provider, code, made) VALUES (?, 'google', ?, ?)").run(person, code, clock.now);
    return { code, person };
  };
  return w;
}

/* ---- Stripe's side of a purchase ------------------------------------------------------------------------------------- */

const cycleOf = p => (p === PRICE.leadMonth || p === PRICE.deskMonth || p === PRICE.oneMonth ? "month" : "year");
const subItems = items => ({ object: "list", has_more: false, data: items.map(([price, quantity]) => ({ id: sid("si"), price: { id: price, recurring: { interval: cycleOf(price) } }, quantity })) });
/** A purchase through a Payment Link: the subscription, its Checkout Session (client_reference_id `code`), its first invoice paid by a
 *  payment method from `o.billing` and `o.card` (PL), Managed Payments where `o.managed`. Nothing is notified. */
function checkout(w, code, items, o) {
  const opts = o || {};
  const sub = { id: sid("sub"), object: "subscription", status: "active", items: subItems(items) };
  w.stripe.subs.set(sub.id, sub);
  const session = { id: "cs_test_" + sid("x", 40).slice(2), object: "checkout.session", livemode: false, status: "complete", mode: "subscription", subscription: sub.id,
    client_reference_id: code, managed_payments: { enabled: !!opts.managed } };
  if (opts.dropCode) delete session.client_reference_id;
  if (opts.org !== undefined) session.custom_fields = [{ key: "org", type: "text", optional: true, label: { type: "custom", custom: "Organisation" }, text: { value: opts.org } }];
  w.stripe.sessions.set(session.id, session);
  const inv = invoice(w, sub, opts.ends || T0 + 365 * DAY, "subscription_create", opts);
  return { sub, session, inv };
}
/** An invoice of `sub` paid, its lines the subscription's items now, its period ending `ends`, its own payment intent and charge. */
function invoice(w, sub, ends, reason, o) {
  const opts = o || {};
  const lines = sub.items.data.map(it => ({ id: sid("il"), object: "line_item", parent: { type: "subscription_item_details", subscription_item_details: { subscription: sub.id } },
    pricing: { type: "price_details", price_details: { price: it.price.id } }, period: { start: Math.floor((ends - 30 * DAY) / 1000), end: Math.floor(ends / 1000) }, quantity: it.quantity }));
  const inv = Object.assign({ id: sid("in"), object: "invoice", livemode: false, status: "paid", billing_reason: reason, total: 99900, discounts: [],
    parent: { type: "subscription_details", subscription_details: { subscription: sub.id } }, lines: { object: "list", has_more: false, data: lines } }, opts.invoice || {});
  w.stripe.invoices.set(inv.id, inv);
  const pm = { id: sid("pm"), object: "payment_method", type: "card", billing_details: { address: { country: opts.billing || "PL" } }, card: { country: opts.card || "PL" } };
  const pi = { id: sid("pi"), object: "payment_intent", payment_method: pm.id };
  const ch = { id: sid("ch"), object: "charge", livemode: false, amount: inv.total, amount_refunded: 0, refunded: false, payment_intent: pi.id };
  w.stripe.pms.set(pm.id, pm); w.stripe.pis.set(pi.id, pi); w.stripe.charges.set(ch.id, ch);
  w.stripe.pays.push({ id: sid("inpay"), object: "invoice_payment", invoice: inv.id, payment: { type: "payment_intent", payment_intent: pi.id } });
  inv._charge = ch.id;
  return inv;
}
const event = (type, id, extra) => ({ id: sid("evt"), object: "event", livemode: false, type, created: Math.floor(T0 / 1000), data: { object: Object.assign({ id }, extra || {}) } });
/** A whole purchase notified the usual way: the session's event, then the first invoice's. */
async function buy(w, items, o) {
  const buyer = (o && o.buyer) || w.person();
  const c = checkout(w, buyer.code, items, o);
  const be = event("checkout.session.completed", c.session.id), b = await w.post(be);
  const e = event("invoice.paid", c.inv.id);
  const r = await w.post(e);
  return Object.assign(c, { buyer, b, be, r, e });
}

/* pay.mjs's own window, not a second one: UNKNOWN_RETRY_MS is DAY, and DAY is the product on its line. */
function retryWindowMs() {
  const src = fs.readFileSync(path.join(SERVICE, "pay.mjs"), "utf8");
  const day = /const DAY = (\d+) \* (\d+);/.exec(src);
  const win = /const UNKNOWN_RETRY_MS = DAY;/.exec(src);
  if (!day || !win) throw new Error("pay.mjs retry window not found");
  return Number(day[1]) * Number(day[2]);
}

/* ---- the legs ------------------------------------------------------------------------------------------------------- */

async function legs(K, ck) {
  AUDIT = [];
  const leg = async (name, fn) => { try { await fn(); } catch (e) { ck(false, name + " threw: " + (e && e.stack || e).toString().split(NL).slice(0, 3).join(" | ")); } };
  const hmac = (t, text, secret) => crypto.createHmac("sha256", secret || SECRET).update(t + "." + text).digest("hex");
  const signinS = async (w, sub, hd) => {
    const lead = edKey(), seed = crypto.randomBytes(32).toString("hex"), t = w.clock.now + (++tick);
    const idToken = googleToken(w.clock, sub, await RQ.signinNonce(lead.pub, seed), hd);
    const r = await w.call("signin", { provider: "google", idToken, lead: lead.pub, t, seed,
      sig: lead.sign(RQ.signinBytes({ provider: "google", tokenHash: await RQ.tokenHash(idToken), lead: lead.pub, t })) });
    const code = r.body && r.body.me;
    const p = code ? w.db.raw.prepare("SELECT person FROM persons WHERE code = ?").get(code) : null;
    return { lead, me: code, code, person: p && p.person, body: r.body, status: r.status };
  };
  const deskSigninS = async (w, sub, hd, desk) => {
    const seed = crypto.randomBytes(32).toString("hex"), t = w.clock.now + (++tick);
    const idToken = googleToken(w.clock, sub, await RQ.signinNonce(desk.pub, seed), hd);
    return w.call("signin/desk", { provider: "google", idToken, desk: desk.pub, t, seed,
      sig: desk.sign(RQ.signinDeskBytes({ provider: "google", tokenHash: await RQ.tokenHash(idToken), desk: desk.pub, t })) });
  };
  const quietCheckS = (w, lead) => {
    const t = w.clock.now + (++tick);
    return w.call("check", { lead: lead.pub, t, sig: lead.sign(RQ.checkBytes({ lead: lead.pub, t })) });
  };
  const callSignedS = (w, route, lead, fields, bytesFn) => {
    const t = w.clock.now + (++tick);
    const body = Object.assign({ lead: lead.pub, t }, fields);
    return w.call(route, Object.assign(body, { sig: lead.sign(bytesFn(body)) }));
  };
  const renewOwnerS = async (w, sub, hd, lead) => {
    const seed = crypto.randomBytes(32).toString("hex"), t = w.clock.now + (++tick);
    const idToken = googleToken(w.clock, sub, await RQ.signinNonce(lead.pub, seed), hd);
    return w.call("signin", { provider: "google", idToken, lead: lead.pub, t, seed,
      sig: lead.sign(RQ.signinBytes({ provider: "google", tokenHash: await RQ.tokenHash(idToken), lead: lead.pub, t })) });
  };
  const licenceHolds = async doc => !!doc && (await L.verifyLicence(doc, { trustedKey: ROOTK.pub })).valid === true;

  await leg("S1", async () => {
    const w = world(K);
    const s = w.stripe; const sub = { id: sid("sub"), status: "active", items: subItems([[PRICE.deskMonth, 1]]) }; s.subs.set(sub.id, sub);
    const ev = () => event("customer.subscription.updated", sub.id);
    const t = Math.floor(w.clock.now / 1000);
    const ok = await w.post(ev());
    const e1 = ev(), text = JSON.stringify(e1);
    const changed = await w.post(text.replace("customer.subscription.updated", "customer.subscription.updatee"), { signedText: text });
    ck(ok.status === 200 && changed.status === 401, "S1a a signed event is answered 200, and the same signature over a body one byte changed is refused: " + ok.status + " " + changed.status);
    const old = await w.post(ev(), { t: t - 301 }), ahead = await w.post(ev(), { t: t + 301 }), inside = await w.post(ev(), { t: t - 299 });
    ck(old.status === 401 && ahead.status === 401 && inside.status === 200, "S1b the tolerance is 300 seconds: 301 s old or ahead refused, 299 s passes: " + [old.status, ahead.status, inside.status].join(" "));
    const e2 = ev(), t2 = JSON.stringify(e2), good = hmac(t, t2);
    const odd = await w.post(t2, { header: "v0=" + "ab".repeat(32) + ",x9=frog,v1=" + good + ",t=" + t + ",scheme=later" });
    const e3 = ev(), t3 = JSON.stringify(e3);
    const v0only = await w.post(t3, { header: "t=" + t + ",v0=" + hmac(t, t3) });
    const e4 = ev(), t4 = JSON.stringify(e4);
    const rolled = await w.post(t4, { header: "t=" + t + ",v1=" + hmac(t, t4, "whsec_the_old_one") + ",v1=" + hmac(t, t4) });
    const none = await w.post(ev(), { header: null }), noT = await w.post(t4, { header: "v1=" + hmac(t, t4) });
    ck(odd.status === 200 && v0only.status === 401 && rolled.status === 200 && none.status === 401 && noT.status === 401,
      "S1c unknown entries in any order are accepted; v0, even carrying a valid HMAC, is never read; a rolled secret's two v1 pass with one valid; no header, or no t, refused: "
      + [odd.status, v0only.status, rolled.status, none.status, noT.status].join(" "));
  });

  await leg("S2", async () => {
    const w = world(K);
    const sub = { id: sid("sub"), status: "active", items: subItems([[PRICE.deskMonth, 1]]) }; w.stripe.subs.set(sub.id, sub);
    const e = event("customer.subscription.updated", sub.id), pretty = JSON.stringify(e, null, 2) + "\n";
    const r = await w.post(pretty), resent = await w.post(JSON.stringify(JSON.parse(pretty)), { signedText: pretty });
    ck(r.status === 200 && w.outcome(e) === "unknown" && resent.status === 401, "S2a the HMAC is over the raw body: Stripe's whitespace passes, the same event re-serialised is refused: " + r.status + " " + resent.status);
  });

  await leg("S3", async () => {
    const w = world(K);
    const buyer = w.person();
    const c = checkout(w, buyer.code, [[PRICE.leadYear, 1], [PRICE.deskYear, 3]]);
    const e = event("invoice.paid", c.inv.id);
    const before = w.state(), early = await w.post(e);
    ck(early.status === 500 && w.state() === before, "S3a a first invoice.paid before its Checkout Session answers 500 and writes nothing, so Stripe retries: " + early.status);
    const b = event("checkout.session.completed", c.session.id), rb = await w.post(b);
    const bound = w.db.raw.prepare("SELECT code, managed FROM pay_binds WHERE provider = 'stripe' AND sub = ?").get(c.sub.id) || {};
    const again = await w.post(e);
    const lic = w.paidOf(buyer.person)[0] || {};
    ck(rb.status === 200 && w.outcome(b) === "bound" && bound.code === buyer.code && bound.managed === 0 && again.status === 200 && w.outcome(e) === "applied"
      && lic.seats === 3 && lic.lead_seats === 1 && lic.paid_until === T0 + 365 * DAY + GRACE,
      "S3b checkout.session.completed binds the subscription to client_reference_id; Stripe's retry of the invoice then applies it: "
      + JSON.stringify({ bound: w.outcome(b), applied: w.outcome(e), seats: lic.seats }));
    const d = checkout(w, "dropped", [[PRICE.deskYear, 1]], { dropCode: true });
    const db1 = event("checkout.session.completed", d.session.id); await w.post(db1);
    const de = event("invoice.paid", d.inv.id); await w.post(de);
    const bad = checkout(w, "not-a-code!", [[PRICE.deskYear, 1]]);
    const bb = event("checkout.session.completed", bad.session.id); await w.post(bb);
    ck(w.outcome(db1) === "bound:no-code" && w.outcome(de) === "held:code" && w.outcome(bb) === "bound:no-code",
      "S3c a session whose code Stripe dropped, or one of the wrong shape, binds no code, and its payment is held \"code\", never retried: "
      + [w.outcome(db1), w.outcome(de), w.outcome(bb)].join(" "));
    const lone = { id: sid("sub"), status: "active", items: subItems([[PRICE.deskYear, 1]]) }; w.stripe.subs.set(lone.id, lone);
    const li = invoice(w, lone, T0 + 365 * DAY, "subscription_cycle"), le = event("invoice.paid", li.id);
    const clockWas = w.clock.now;
    w.clock.now = T0 + retryWindowMs();
    const lr = await w.post(le);
    w.clock.now = clockWas;
    ck(lr.status === 200 && w.outcome(le) === "held:unbound", "S3d a renewal of a subscription never bound, its event a day old, is held, not retried: " + lr.status + " " + w.outcome(le));
  });

  await leg("S4", async () => {
    const w = world(K);
    const buyer = w.person();
    const c = checkout(w, buyer.code, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]]);
    await w.post(event("checkout.session.completed", c.session.id));
    const forged = event("invoice.paid", c.inv.id, { lines: { data: [{ pricing: { price_details: { price: PRICE.deskYear } }, quantity: 50, period: { end: Math.floor((T0 + 3650 * DAY) / 1000) } }] } });
    const r = await w.post(forged);
    const lic = w.paidOf(buyer.person)[0] || {};
    ck(r.status === 200 && lic.seats === 2 && lic.paid_until === T0 + 365 * DAY + GRACE, "S4a the doorbell: a signed body claiming 50 desks and ten years gives the API's 2 desks and year: " + lic.seats);
    const w2 = world(K);
    const b2 = w2.person();
    const c2 = checkout(w2, b2.code, [[PRICE.deskYear, 2]], { invoice: { status: "open" } });
    await w2.post(event("checkout.session.completed", c2.session.id));
    const before = w2.state(), open = await w2.post(event("invoice.paid", c2.inv.id));
    ck(open.status === 500 && w2.state() === before, "S4b an invoice the API shows not yet paid writes nothing, 500: " + open.status);
  });

  await leg("S5", async () => {
    const w = world(K);
    const p = await buy(w, [[PRICE.deskYear, 4], [PRICE.leadYear, 1]]);
    const again = await w.post(p.e);
    const other = event("invoice.paid", p.inv.id), second = await w.post(other);
    const lic = w.paidOf(p.buyer.person)[0];
    ck(again.status === 200 && again.d1 === 1 && again.api === 0 && second.api === 0 && w.outcome(other) === "once" && lic.seats === 4,
      "S5a the same event twice reads nothing; a second event for the same invoice is \"once\" and counts no seat twice: " + JSON.stringify({ again, seats: lic.seats }));
  });

  await leg("S6", async () => {
    const w = world(K);
    const e1 = T0 + 30 * DAY, e2 = T0 + 60 * DAY;
    const p = await buy(w, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 2]], { ends: e1 });
    const id = w.paidOf(p.buyer.person)[0].id;
    const ren = invoice(w, p.sub, e2, "subscription_cycle"); const r = await w.post(event("invoice.paid", ren.id));
    const late = invoice(w, p.sub, T0 + 45 * DAY, "subscription_cycle"); await w.post(event("invoice.paid", late.id));
    const row = w.db.raw.prepare("SELECT txn FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(p.sub.id);
    ck(r.status === 200 && w.licence(id).paid_until === e2 + GRACE && row.txn === ren.id, "S6a a renewal (subscription_cycle) extends to its end plus 14 days; a late older one shortens nothing: "
      + (w.licence(id).paid_until - T0) / DAY);
  });

  await leg("S7", async () => {
    const w = world(K);
    const p = await buy(w, [[PRICE.leadYear, 1], [PRICE.deskYear, 5]]);
    const id = w.paidOf(p.buyer.person)[0].id;
    p.sub.items = subItems([[PRICE.leadYear, 1], [PRICE.deskYear, 8]]);
    await w.post(event("customer.subscription.updated", p.sub.id));
    const after = w.licence(id).seats;
    const rise = invoice(w, p.sub, T0 + 365 * DAY, "subscription_update"); const r = await w.post(event("invoice.paid", rise.id));
    ck(after === 5 && r.status === 200 && w.licence(id).seats === 8, "S7a always_invoice: the update alone changes no seat; the subscription_update invoice it bills raises 5 to 8: " + after + " " + w.licence(id).seats);
    const w2 = world(K);
    const q = await buy(w2, [[PRICE.leadYear, 1], [PRICE.deskYear, 5]]);
    const qid = w2.paidOf(q.buyer.person)[0].id;
    q.sub.items = subItems([[PRICE.leadYear, 1], [PRICE.deskYear, 8]]);
    const rise2 = invoice(w2, q.sub, T0 + 365 * DAY, "subscription_update");
    rise2.lines.data = [
      Object.assign({}, rise2.lines.data[1], { id: sid("il"), quantity: 5, amount: -41000 }),
      Object.assign({}, rise2.lines.data[1], { id: sid("il"), quantity: 8, amount: 65000 }),
    ];
    const re2 = event("invoice.paid", rise2.id); await w2.post(re2);
    const afterRise = w2.licence(qid) || {}, subRise = w2.db.raw.prepare("SELECT lead_seats, seats FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(q.sub.id) || {};
    w2.clock.now = T0 + 365 * DAY;
    const ren2 = invoice(w2, q.sub, T0 + 730 * DAY, "subscription_cycle");
    const rne2 = event("invoice.paid", ren2.id); await w2.post(rne2);
    const afterRen = w2.licence(qid) || {}, subRen = w2.db.raw.prepare("SELECT lead_seats, seats FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(q.sub.id) || {};
    ck(w2.outcome(re2) === "applied" && afterRise.lead_seats === 1 && afterRise.seats === 8 && subRise.lead_seats === 1 && subRise.seats === 8
      && w2.outcome(rne2) === "applied" && afterRen.lead_seats === 1 && afterRen.seats === 8 && subRen.lead_seats === 1 && subRen.seats === 8,
      "S7b 1 lead and 5 desks, subscription_update with only desk credit (5) and charge (8): licence and pay_subs read 1 and 8, and again after renewal billing 1 and 8: "
      + JSON.stringify({ rise: [afterRise.lead_seats, afterRise.seats, subRise.lead_seats, subRise.seats], ren: [afterRen.lead_seats, afterRen.seats, subRen.lead_seats, subRen.seats] }));
    const w3 = world(K);
    const u = await buy(w3, [[PRICE.leadYear, 2], [PRICE.deskYear, 5]]);
    const uid = w3.paidOf(u.buyer.person)[0].id;
    u.sub.items = subItems([[PRICE.leadYear, 3], [PRICE.deskYear, 5]]);
    const riseLead = invoice(w3, u.sub, T0 + 365 * DAY, "subscription_update");
    riseLead.lines.data = [
      Object.assign({}, riseLead.lines.data[0], { id: sid("il"), quantity: 2, amount: -41000 }),
      Object.assign({}, riseLead.lines.data[0], { id: sid("il"), quantity: 3, amount: 65000 }),
    ];
    await w3.post(event("invoice.paid", riseLead.id));
    const afterLead = w3.licence(uid) || {}, subLead = w3.db.raw.prepare("SELECT lead_seats, seats FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(u.sub.id) || {};
    u.sub.items = subItems([[PRICE.leadYear, 3], [PRICE.deskYear, 3]]);
    const redDesk = invoice(w3, u.sub, T0 + 365 * DAY, "subscription_update");
    redDesk.lines.data = [
      Object.assign({}, redDesk.lines.data[1], { id: sid("il"), quantity: 5, amount: -41000 }),
      Object.assign({}, redDesk.lines.data[1], { id: sid("il"), quantity: 3, amount: 24000 }),
    ];
    u.sub.items = subItems([[PRICE.leadYear, 3], [PRICE.deskYear, 100]]);
    await w3.post(event("invoice.paid", redDesk.id));
    const afterRed = w3.licence(uid) || {}, subRed = w3.db.raw.prepare("SELECT lead_seats, seats FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(u.sub.id) || {};
    /* A lead-only rise delivered ahead of the renewal it follows carries the later period's end, where keptSeat writes the notice itself:
       the desks the rise does not bill must come from what is held (pay.mjs keepKind), never from a count the invoice left off. */
    const w3b = world(K);
    const u3 = await buy(w3b, [[PRICE.leadYear, 2], [PRICE.deskYear, 5]]);
    const u3id = w3b.paidOf(u3.buyer.person)[0].id;
    u3.sub.items = subItems([[PRICE.leadYear, 3], [PRICE.deskYear, 5]]);
    const early3 = invoice(w3b, u3.sub, T0 + 730 * DAY, "subscription_update");
    early3.lines.data = [
      Object.assign({}, early3.lines.data[0], { id: sid("il"), quantity: 2, amount: -41000 }),
      Object.assign({}, early3.lines.data[0], { id: sid("il"), quantity: 3, amount: 65000 }),
    ];
    await w3b.post(event("invoice.paid", early3.id));
    const afterEarly = w3b.licence(u3id) || {}, subEarly = w3b.db.raw.prepare("SELECT lead_seats, seats FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(u3.sub.id) || {};
    ck(afterLead.lead_seats === 3 && afterLead.seats === 5 && subLead.lead_seats === 3 && subLead.seats === 5
      && afterRed.lead_seats === 3 && afterRed.seats === 5 && subRed.lead_seats === 3 && subRed.seats === 5
      && afterEarly.lead_seats === 3 && afterEarly.seats === 5 && subEarly.lead_seats === 3 && subEarly.seats === 5,
      "S7c lead rise (2 -> 3, lead lines only) keeps 5 desks, also when it carries the next period's end; a same-period desk notice of 3, the subscription then raised to 100, keeps 3 leads and the 5 desks already paid: "
      + JSON.stringify({ leadRise: [afterLead.lead_seats, afterLead.seats, subLead.lead_seats, subLead.seats], deskRed: [afterRed.lead_seats, afterRed.seats, subRed.lead_seats, subRed.seats], nextPeriod: [afterEarly.lead_seats, afterEarly.seats, subEarly.lead_seats, subEarly.seats] }));
  });

  await leg("S8", async () => {
    const w = world(K, { env: { PROVIDERS: JSON.stringify([{ id: "google", clientId: GOOGLE_CLIENT }]) } });
    const owner = await signinS(w, "S8-lead", "acme.example");
    /* One subscription per licence (Max, 2026-11-19): q is cancelled before the next, p, is bought. */
    const q = await buy(w, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]], { buyer: owner, ends: T0 + 365 * DAY });
    const id = w.paidOf(q.buyer.person)[0].id;
    const before = w.state(), early = await w.post(event("customer.subscription.deleted", q.sub.id)), untouched = w.state() === before;
    q.sub.status = "canceled";
    const r = await w.post(event("customer.subscription.deleted", q.sub.id));
    const p = await buy(w, [[PRICE.leadYear, 1], [PRICE.deskYear, 5]], { buyer: q.buyer, ends: T0 + 730 * DAY });
    const both = w.licence(id).seats;
    const afterCancel = w.licence(id);
    const listBefore = await callSignedS(w, "seat/list", owner.lead, {}, RQ.seatListBytes);
    w.clock.now = T0 + 365 * DAY;
    w.env.DELEGATION = JSON.stringify(delegation({ from: w.clock.now - 10 * DAY, until: w.clock.now + 300 * DAY }));
    await renewOwnerS(w, "S8-lead", "acme.example", owner.lead);
    w.clock.now = T0 + 365 * DAY + GRACE;
    const listAt379 = await callSignedS(w, "seat/list", owner.lead, {}, RQ.seatListBytes);
    const ckAt379 = await quietCheckS(w, owner.lead);
    ck(both === 7 && early.status === 500 && untouched && r.status === 200
      && afterCancel.seats === 7 && afterCancel.refunded === 0
      && listBefore.status === 200 && listBefore.body.counts.desk.of === 7
      && listAt379.status === 200 && listAt379.body.counts.desk.of === 5
      && !!ckAt379.body && ckAt379.body.licence && ckAt379.body.licence.seats === 5,
      "S8a customer.subscription.deleted keeps its own 2 desks until q's paid date (+379d), beside the 5 of the subscription bought after it, and drops them then with no payment event (5 desks); one the API still shows active writes nothing, 500: "
      + JSON.stringify({ both, early: early.status, before: afterCancel.seats, at379: [listAt379.body && listAt379.body.counts, ckAt379.body && ckAt379.body.licence && ckAt379.body.licence.seats] }));
  });

  await leg("S9", async () => {
    const w = world(K);
    const p = await buy(w, [[PRICE.leadYear, 1], [PRICE.deskYear, 3]]);
    const id = w.paidOf(p.buyer.person)[0].id;
    const ch = w.stripe.charges.get(p.inv._charge);
    ch.amount_refunded = 1000; ch.refunded = false;
    const part = event("charge.refunded", ch.id); await w.post(part);
    ck(w.outcome(part) === "held:refund:partial" && w.licence(id).refunded === 0, "S9a a partial refund is held, the licence untouched: " + w.outcome(part));
    const older = invoice(w, p.sub, T0 + 300 * DAY, "subscription_cycle"), op = event("invoice.paid", older.id); await w.post(op);
    const oc = w.stripe.charges.get(older._charge); oc.refunded = true; oc.amount_refunded = oc.amount;
    const oe = event("charge.refunded", oc.id); await w.post(oe);
    ck(w.outcome(op) === "applied" && w.outcome(oe) === "held:not-current-period", "S9b a full refund of an invoice applied here that did not buy the current period is held: " + w.outcome(oe));
    const sev = invoice(w, p.sub, T0 + 365 * DAY, "subscription_cycle");
    w.stripe.pays.push({ id: sid("inpay"), invoice: p.inv.id, payment: { type: "payment_intent", payment_intent: w.stripe.charges.get(sev._charge).payment_intent } });
    const sc = w.stripe.charges.get(sev._charge); sc.refunded = true; sc.amount_refunded = sc.amount;
    const se = event("charge.refunded", sc.id); await w.post(se);
    ck(w.outcome(se) === "held:several-invoices", "S9c a payment that paid several invoices is held: " + w.outcome(se));
    ch.refunded = true; ch.amount_refunded = ch.amount;
    const full = event("charge.refunded", ch.id), rf = await w.post(full);
    ck(rf.status === 200 && w.outcome(full) === "applied" && w.licence(id).refunded === 1, "S9d a full refund of the current period ends a sole-source licence: " + w.outcome(full));
  });

  await leg("S10", async () => {
    const w = world(K);
    const p = await buy(w, [[PRICE.leadYear, 1], [PRICE.deskYear, 3]]);
    const id = w.paidOf(p.buyer.person)[0].id;
    const du = { id: sid("du"), object: "dispute", status: "needs_response", charge: p.inv._charge, amount: w.stripe.charges.get(p.inv._charge).amount };
    w.stripe.disputes.set(du.id, du);
    const opened = event("charge.dispute.created", du.id), ro = await w.post(opened);
    ck(w.outcome(opened) === "held:dispute:opened" && ro.api === 0 && w.licence(id).refunded === 0, "S10a a dispute opened is held, with no read: " + w.outcome(opened) + " " + ro.api);
    const outs = [];
    for (const status of ["won", "warning_closed", "needs_response"]) {
      du.status = status;
      const before = w.state(), e = event("charge.dispute.closed", du.id); await w.post(e);
      outs.push(status + ":" + w.outcome(e) + ":" + (w.licence(id).refunded === 0 && w.licence(id).seats === 3 ? "unchanged" : "CHANGED") + (before === w.state() ? "" : ""));
    }
    ck(outs[0] === "won:dispute:won:unchanged" && outs[1] === "warning_closed:dispute:warning_closed:unchanged" && outs[2] === "needs_response:held:dispute:needs_response:unchanged",
      "S10b a dispute closed won or warning_closed is listed and changes nothing; an unexpected status is held: " + outs.join(", "));
    du.status = "lost"; du.amount = Math.floor(w.stripe.charges.get(p.inv._charge).amount / 2);
    const partLost = event("charge.dispute.closed", du.id), beforePart = w.state(); await w.post(partLost);
    ck(w.outcome(partLost) === "held:dispute:partial" && w.licence(id).refunded === 0 && w.licence(id).seats === 3,
      "S10d a dispute closed lost for part of the charge is held \"dispute:partial\", the licence untouched (a refund must be whole, a dispute can be partial): "
      + w.outcome(partLost) + (beforePart === w.state() ? "" : ""));
    du.amount = w.stripe.charges.get(p.inv._charge).amount;
    const lost = event("charge.dispute.closed", du.id); await w.post(lost);
    const ch = w.stripe.charges.get(p.inv._charge); ch.refunded = true; ch.amount_refunded = ch.amount;
    const after = event("charge.refunded", ch.id); await w.post(after);
    ck(w.outcome(lost) === "applied" && w.licence(id).refunded === 1 && w.outcome(after) === "once",
      "S10c a dispute closed lost is a full chargeback (the sole-source licence ends), and a refund of the same period after it is \"once\": " + w.outcome(lost) + " " + w.outcome(after));
  });

  await leg("S11", async () => {
    const w = world(K);
    const buyer = w.person(), stray = sid("price");
    const outs = [];
    const cases = [
      ["manual", c => { c.inv.billing_reason = "manual"; }, "held:origin"],
      ["one-time line", c => { c.inv.lines.data.push({ parent: { type: "invoice_item_details" }, pricing: { price_details: { price: PRICE.deskYear } }, period: { end: 1 }, quantity: 1 }); }, "held:price"],
      ["price not mapped", c => { c.inv.lines.data[0].pricing.price_details.price = stray; }, "held:price"],
      ["subscription paused", c => { c.sub.status = "paused"; }, "held:subscription-status"],
      ["mixed kinds", c => { c.sub.items = subItems([[PRICE.oneYear, 1], [PRICE.deskYear, 1]]); }, "held:mixed"],
    ];
    for (const [label, bend, want] of cases) {
      const c = checkout(w, buyer.code, [[PRICE.deskYear, 1]]);
      bend(c);
      await w.post(event("checkout.session.completed", c.session.id));
      const e = event("invoice.paid", c.inv.id); await w.post(e);
      outs.push(label + ":" + w.outcome(e) + (w.outcome(e) === want ? "" : " (want " + want + ")"));
    }
    ck(outs.every(o => !/want/.test(o)) && w.paidOf(buyer.person).length === 0 && w.count("pay_subs") === 0, "S11a a shape the table does not name is held and writes no licence: " + outs.join(", "));
  });

  await leg("S12", async () => {
    const w = world(K);
    const di = sid("di");
    const p = await buy(w, [[PRICE.deskYear, 2]], { invoice: { total: 0, discounts: [di] } });
    ck(w.outcome(p.e) === "zero-total:" + di && w.paidOf(p.buyer.person)[0].seats === 2, "S12a a total of zero is applied and listed with its discount: " + w.outcome(p.e));
  });

  await leg("S13", async () => {
    const outs = [];
    for (const [label, env, want] of [["a secret key", { STRIPE_API_KEY: "sk_test_" + "a".repeat(30) }, 500], ["no version", { STRIPE_VERSION: undefined }, 500],
        ["no webhook secret", { STRIPE_WEBHOOK_SECRET: undefined }, 500], ["a version before basil", { STRIPE_VERSION: "2024-06-20.acacia" }, 500], ["stripe not named", { PAY_PROVIDERS: "paddle" }, 404], ["unset", { PAY_PROVIDERS: undefined }, 404],
        ["a test key on a live deployment", { STRIPE_MODE: "live" }, 500], ["no mode", { STRIPE_MODE: undefined }, 500], ["a mode misspelt", { STRIPE_MODE: "production" }, 500]]) {
      const w = world(K, { env });
      const sub = { id: sid("sub"), status: "active", items: subItems([[PRICE.deskMonth, 1]]) }; w.stripe.subs.set(sub.id, sub);
      const r = await w.post(event("customer.subscription.updated", sub.id), { noAudit: true });
      outs.push(label + ":" + r.status + ":" + r.d1 + ":" + r.api + (r.status === want ? "" : " (want " + want + ")"));
    }
    const wb = world(K, { env: { PAY_PROVIDERS: "paddle,stripe", PADDLE_WEBHOOK_SECRET: "pdl_ntfset_both", PADDLE_API_KEY: "pdl_sdbx_apikey_" + "b".repeat(30), PADDLE_ENV: "sandbox", PADDLE_PRICES: "{}" } });
    const sub = { id: sid("sub"), status: "active", items: subItems([[PRICE.deskMonth, 1]]) }; wb.stripe.subs.set(sub.id, sub);
    const rs = await wb.post(event("customer.subscription.updated", sub.id), { noAudit: true });
    const pe = JSON.stringify({ event_id: "evt_" + "0123456789abcdefghijklmnop", event_type: "subscription.updated", occurred_at: new Date(T0).toISOString(), data: { id: "sub_" + "0123456789abcdefghijklmnop" } });
    const ts = Math.floor(T0 / 1000), h1 = crypto.createHmac("sha256", "pdl_ntfset_both").update(ts + ":" + pe).digest("hex");
    const rp = await wb.post(pe, { path: "pay/paddle", header: null, noAudit: true });
    const res = await wb.service.fetch(new Request("https://licence.test/licence/v1/pay/paddle", { method: "POST", headers: { "paddle-signature": "ts=" + ts + ";h1=" + h1 }, body: pe }), wb.env);
    ck(outs.every(o => !/want/.test(o)) && outs.filter(o => /:404:/.test(o)).every(o => /:404:0:0/.test(o)) && outs.filter(o => /:500:/.test(o)).every(o => /:500:0:0/.test(o))
      && rs.status === 200 && rp.status === 401 && res.status === 200,
      "S13a a secret (not restricted) key, no pinned version, no webhook secret: 500; Stripe not named: \"not there\", reading nothing; both named: both answer (label:status:d1:api): "
      + outs.join(", ") + " both:" + rs.status + "/" + res.status);
  });

  await leg("S14", async () => {
    const w = world(K);
    const e = event("invoice.paid", sid("in")), t = Math.floor(T0 / 1000);
    const outs = [];
    for (const [label, o] of [["no header", { header: null }], ["wrong v1", { v1: "ab".repeat(32) }], ["stale", { t: t - 3600 }], ["v0 only", { header: "t=" + t + ",v0=" + "ab".repeat(32) }],
        ["wrong secret", { secret: "whsec_someone_elses" }]]) { const r = await w.post(e, o); outs.push(label + ":" + r.status + ":" + r.d1 + ":" + r.api); }
    ck(outs.every(o => /:401:0:0$/.test(o)), "S14a unsigned posts cost no D1 call and no Stripe call (label:status:d1:api): " + outs.join(", "));
  });

  await leg("S15", async () => {
    const outs = [];
    for (const mode of ["401", "503", "down", "slow"]) {
      const w = world(K);
      const buyer = w.person();
      const c = checkout(w, buyer.code, [[PRICE.deskYear, 2]]);
      await w.post(event("checkout.session.completed", c.session.id));
      if (mode === "slow") w.stripe.slowMs = 600; else w.stripe.mode = mode;
      const before = w.state(), t0 = Date.now(), r = await w.post(event("invoice.paid", c.inv.id)), took = Date.now() - t0;
      if (mode === "slow") await new Promise(res => setTimeout(res, 700));
      outs.push(mode + ":" + r.status + ":" + (w.state() === before ? "unchanged" : "WRITTEN") + (mode === "slow" && took >= 500 ? ":LATE" : ""));
    }
    ck(outs.every(o => /:500:unchanged$/.test(o)), "S15a Stripe answering 401, a 503 carrying a document, unreachable, or late: 500, nothing written: " + outs.join(", "));
  });

  await leg("S16", async () => {
    const w = world(K);
    const buyer = w.person();
    const c = checkout(w, buyer.code, [[PRICE.deskYear, 3]], { dropCode: true });
    await w.post(event("checkout.session.completed", c.session.id));
    const e = event("invoice.paid", c.inv.id); await w.post(e);
    const made = await w.AT.makeAttachSql({ owner: buyer.code, org: "Bought through Stripe", personal: true, leadSeats: 1, seats: 3, order: "INV-S16",
      payPeriodEnd: new Date(T0 + 365 * DAY).toISOString().slice(0, 10), payProvider: "stripe", paddleSub: c.sub.id, paddleTxn: c.inv.id, paddleBuyer: buyer.code }, w.clock.now);
    w.db.raw.exec(made.sql);
    const row = w.db.raw.prepare("SELECT * FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(c.sub.id) || {};
    const ren = invoice(w, c.sub, T0 + 730 * DAY, "subscription_cycle"), re = event("invoice.paid", ren.id), rr = await w.post(re);
    const lic = w.licence(row.licence) || {};
    let refused = "taken";
    try { w.AT.checkArgs({ owner: buyer.code, org: "X", personal: true, leadSeats: 1, seats: 1, payProvider: "stripe", payPeriodEnd: "2027-11-14", paddleSub: c.sub.id, paddleTxn: "txn_" + "a".repeat(26) }); } catch { refused = "refused"; }
    ck(w.outcome(e) === "held:code" && row.person === buyer.person && rr.status === 200 && w.outcome(re) === "applied" && lic.paid_until === T0 + 730 * DAY + GRACE && refused === "refused",
      "S16a a Stripe payment held for a dropped code, attached by hand with --pay-provider stripe and the buyer's code, is a known subscription bound to that buyer, and its renewal then applies; a Paddle-shaped payment id is refused: "
      + JSON.stringify({ held: w.outcome(e), renewal: w.outcome(re), paid: lic.paid_until && (lic.paid_until - T0) / DAY, refused }));
    /* S16b (the test architect's, fold 86): a Stripe payment attached with --pay-sub and no --pay-period-end is refused, and nothing is written. */
    const w2 = world(K), b2 = w2.person();
    const c2 = checkout(w2, b2.code, [[PRICE.deskYear, 3]], { dropCode: true });
    await w2.post(event("checkout.session.completed", c2.session.id));
    await w2.post(event("invoice.paid", c2.inv.id));
    const state2 = w2.state();
    const ask2 = async extra => {
      try {
        return (await w2.AT.makeAttachSql(Object.assign({ owner: b2.code, org: "Bought through Stripe", personal: true, leadSeats: 1, seats: 3, order: "INV-S16b-" + extra.n,
          payProvider: "stripe", paddleSub: c2.sub.id, paddleTxn: c2.inv.id, paddleBuyer: b2.code }, extra.o), w2.clock.now)).sql;
      } catch (e) { return /--pay-period-end/.test(e.message) ? "refused" : "other: " + e.message.slice(0, 80); }
    };
    const none = await ask2({ n: 1, o: {} }), given = await ask2({ n: 2, o: { payPeriodEnd: "2027-11-14" } });
    ck(none === "refused" && given !== "refused" && given.indexOf("INSERT INTO pay_subs") >= 0 && w2.state() === state2,
      "S16b a Stripe payment attached with --pay-sub and no --pay-period-end is refused and writes nothing; with it the statements are printed: "
      + JSON.stringify({ none: none.slice(0, 80), given: given.slice(0, 20), same: w2.state() === state2 }));
  });

  await leg("S19", async () => {
    const w = world(K);
    /* Two colleagues of one organisation, each a lead on a trial of their own, as Studio's sign-in leaves them. */
    const colleague = () => {
      const p = w.person();
      const lic = Number(w.db.raw.prepare("INSERT INTO licences (key_hash, email_hash, org, seats, updates_until, paid_until, refunded, lead_seats, trial_ends, trial_unit, owner) "
        + "VALUES (?, 'signin:', 'Trial', 30, '2026-11-30', 0, 0, 1, ?, ?, ?)").run("signin:" + p.code, T0 + 14 * DAY, "person:" + p.person, p.person).lastInsertRowid);
      w.db.raw.prepare("INSERT INTO seats (kind, person, licence, provider, org, seated_at, seen_at, proved_at, code) VALUES ('lead', ?, ?, 'google', 'org-s17', ?, ?, ?, ?)")
        .run(p.person, lic, T0, T0, T0, p.code);
      return p;
    };
    const A = colleague(), B = colleague();
    const a = await buy(w, [[PRICE.leadYear, 1], [PRICE.deskYear, 3]], { buyer: A });
    const first = w.paidOf(A.person)[0] || {};
    const b = await buy(w, [[PRICE.leadYear, 1], [PRICE.deskYear, 10]], { buyer: B });
    const mine = w.paidOf(B.person)[0] || {}, after = w.licence(first.id) || {};
    const admitsOf = id => (id === undefined ? "" : w.db.raw.prepare("SELECT org FROM admits WHERE licence = ? ORDER BY org").all(id).map(x => x.org).join());
    const subRow = w.db.raw.prepare("SELECT licence FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(b.sub.id) || {};
    ck(w.outcome(a.e) === "applied" && admitsOf(first.id).indexOf("org-s17") >= 0 && w.outcome(b.e) === "applied" && mine.id !== undefined && mine.id !== first.id
      && mine.owner === B.person && mine.seats === 10 && admitsOf(mine.id) === "person:" + B.person && subRow.licence === mine.id
      && after.owner === A.person && after.seats === 3,
      "S19a through Stripe, a second buyer in an organisation whose paid licence another owns buys a licence of their own, by name and no"
      + " organisation, the first as it was: " + JSON.stringify({ first: w.outcome(a.e), second: w.outcome(b.e), own: mine.id !== first.id,
        admits: admitsOf(mine.id).replace(B.person, "<b>"), firstSeats: after.seats }));
    const ren = invoice(w, b.sub, T0 + 730 * DAY, "subscription_cycle"), re = event("invoice.paid", ren.id), rr = await w.post(re);
    ck(rr.status === 200 && w.outcome(re) === "applied" && mine.id !== undefined && (w.licence(mine.id) || {}).paid_until === T0 + 730 * DAY + GRACE
      && w.licence(first.id).paid_until === after.paid_until,
      "S19b the second buyer's Stripe renewal raises their own licence, never the first's: " + w.outcome(re));
    const w2 = world(K);
    const col2 = () => {
      const p = w2.person();
      const lic = Number(w2.db.raw.prepare("INSERT INTO licences (key_hash, email_hash, org, seats, updates_until, paid_until, refunded, lead_seats, trial_ends, trial_unit, owner) "
        + "VALUES (?, 'signin:', 'Trial', 30, '2026-11-30', 0, 0, 1, ?, ?, ?)").run("signin:" + p.code, T0 + 14 * DAY, "person:" + p.person, p.person).lastInsertRowid);
      w2.db.raw.prepare("INSERT INTO seats (kind, person, licence, provider, org, seated_at, seen_at, proved_at, code) VALUES ('lead', ?, ?, 'google', 'org-s19c', ?, ?, ?, ?)")
        .run(p.person, lic, T0, T0, T0, p.code);
      return p;
    };
    const A2 = col2(), B2 = col2();
    const a2 = await buy(w2, [[PRICE.leadYear, 1], [PRICE.deskYear, 3]], { buyer: A2 });
    const b2a = await buy(w2, [[PRICE.leadYear, 1], [PRICE.deskYear, 3]], { buyer: B2 });
    const l2 = w2.paidOf(B2.person)[0] || {};
    /* One subscription per licence (Max, 2026-11-19): the second buyer's own is cancelled, its paid time running, before the next is bought. */
    b2a.sub.status = "canceled";
    await w2.post(event("customer.subscription.deleted", b2a.sub.id));
    const ch2 = w2.stripe.charges.get(a2.inv._charge); ch2.refunded = true; ch2.amount_refunded = ch2.amount;
    const ref2 = event("charge.refunded", ch2.id); await w2.post(ref2);
    const b2b = await buy(w2, [[PRICE.deskMonth, 2]], { buyer: B2, ends: T0 + 30 * DAY });
    const afterB2 = w2.licence(l2.id) || {};
    ck(w2.outcome(ref2) === "applied" && w2.outcome(b2b.e) === "applied" && w2.paidOf(B2.person).length === 1
      && afterB2.lead_seats === 1 && afterB2.seats === 5 && afterB2.paid_until === T0 + 365 * DAY + GRACE,
      "S19c through Stripe, after the organisation's first licence is refunded, the second buyer's later purchase, their first subscription cancelled, raises their own team licence (1 lead, 3 -> 5 desks, +379d) instead of making a new one: "
      + JSON.stringify({ refund: w2.outcome(ref2), outcome: w2.outcome(b2b.e), licences: w2.paidOf(B2.person).length, seats: afterB2.seats, paid: afterB2.paid_until && (afterB2.paid_until - T0) / DAY }));
  });

  /* A MANAGED TENANT'S ACCOUNT (decision 49; Claude alpha, 2026-11-13 21:34: "a person of that tenant must never be able to pay for a
     licence they cannot then use"), through Stripe: the buyer holds a desk seat from an organisation whose licence follows Entra, written
     as the core keeps it. */
  await leg("S20", async () => {
    const w = world(K);
    const buyer = w.person(), org = "org-" + sha("s20-tenant");
    const lic = Number(w.db.raw.prepare("INSERT INTO licences (key_hash, email_hash, org, seats, updates_until, paid_until, seat_source, entra_at) "
      + "VALUES ('attach:s20', 'signin:', 'Acme Tools', 5, '2027-11-30', ?, 'entra', ?)").run(T0 + 365 * DAY, T0 - DAY).lastInsertRowid);
    w.db.raw.prepare("INSERT INTO admits (licence, provider, org) VALUES (?, 'google', ?)").run(lic, org);
    w.db.raw.prepare("INSERT INTO seats (kind, person, licence, provider, org, seated_at, seen_at, proved_at) VALUES ('desk', ?, ?, 'google', ?, ?, ?, ?)")
      .run(buyer.person, lic, org, T0, T0, T0);
    const held = await buy(w, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]], { buyer });
    const other = await buy(w, [[PRICE.oneYear, 1]]);
    ck(held.r.status === 200 && w.outcome(held.e) === "held:managed" && w.paidOf(buyer.person).length === 0 && w.licence(lic).seats === 5
      && w.outcome(other.e) === "applied" && w.paidOf(other.buyer.person).length === 1,
      "S20 a first purchase through Stripe by an account of a tenant whose licence follows Entra is held \"managed\", making and raising nothing;"
      + " another buyer's beside it is applied: " + [w.outcome(held.e), w.paidOf(buyer.person).length, w.outcome(other.e)].join(" "));
  });

  /* A REFUND THAT ARRIVES BEFORE ITS PAYMENT (Grok's review 6, finding 1): Stripe leaves the invoice "paid" and the subscription active
     after a refund, and "doesn't guarantee the delivery of events in the order that they're generated". */
  await leg("S21", async () => {
    const w = world(K);
    const e1 = T0 + 30 * DAY, e2 = T0 + 60 * DAY;
    const p = await buy(w, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 3]], { ends: e1 });
    const id = (w.paidOf(p.buyer.person)[0] || {}).id;
    const ren = invoice(w, p.sub, e2, "subscription_cycle");
    const ch = w.stripe.charges.get(ren._charge); ch.refunded = true; ch.amount_refunded = ch.amount;
    const re = event("charge.refunded", ch.id), rr = await w.post(re);
    const pe = event("invoice.paid", ren.id), rp = await w.post(pe);
    const lic = w.licence(id) || {};
    ck(rr.status === 200 && w.outcome(re) === "held:payment-unknown" && rp.status === 200 && w.outcome(pe) === "held:refunded" && lic.paid_until === e1 + GRACE && lic.refunded === 0,
      "S21a a renewal refunded whole whose refund arrives first: the refund is held \"payment-unknown\", and the renewal, its charge read back refunded, is held"
      + " \"refunded\" and extends nothing: " + JSON.stringify({ refund: w.outcome(re), payment: w.outcome(pe), paid: lic.paid_until && (lic.paid_until - T0) / DAY }));
    const buyer = w.person();
    const c = checkout(w, buyer.code, [[PRICE.deskYear, 2]]);
    await w.post(event("checkout.session.completed", c.session.id));
    const fc = w.stripe.charges.get(c.inv._charge); fc.refunded = true; fc.amount_refunded = fc.amount;
    const early = event("charge.refunded", fc.id); await w.post(early);
    const fp = event("invoice.paid", c.inv.id), rfp = await w.post(fp);
    ck(rfp.status === 200 && w.outcome(early) === "held:payment-unknown" && w.outcome(fp) === "held:refunded" && w.paidOf(buyer.person).length === 0
      && !w.db.raw.prepare("SELECT 1 FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(c.sub.id),
      "S21b a first payment refunded whole whose refund arrives first, before the subscription is known here: held both, no licence made: "
      + [w.outcome(early), w.outcome(fp), w.paidOf(buyer.person).length].join(" "));
  });

  /* SEATS ARE WHAT THE PAID INVOICE BILLED (Grok's review 6, finding 2): the subscription's items raised after the invoice was paid,
     and before its event is handled, buy nothing until an invoice bills them. */
  await leg("S22", async () => {
    const w = world(K);
    const buyer = w.person();
    const c = checkout(w, buyer.code, [[PRICE.leadYear, 1], [PRICE.deskYear, 1]]);
    await w.post(event("checkout.session.completed", c.session.id));
    c.sub.items = subItems([[PRICE.leadYear, 1], [PRICE.deskYear, 100]]);
    const e = event("invoice.paid", c.inv.id); await w.post(e);
    const lic = w.paidOf(buyer.person)[0] || {};
    const row = w.db.raw.prepare("SELECT seats, lead_seats FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(c.sub.id) || {};
    ck(w.outcome(e) === "applied" && lic.seats === 1 && lic.lead_seats === 1 && row.seats === 1,
      "S22a a first invoice paid for 1 desk, the subscription raised to 100 before its event is handled: 1 desk, the 99 unpaid: "
      + JSON.stringify({ outcome: w.outcome(e), seats: lic.seats, row: row.seats }));
    const p = await buy(w, [[PRICE.leadYear, 1], [PRICE.deskYear, 5]]);
    const id = (w.paidOf(p.buyer.person)[0] || {}).id;
    p.sub.items = subItems([[PRICE.leadYear, 1], [PRICE.deskYear, 8]]);
    const rise = invoice(w, p.sub, T0 + 365 * DAY, "subscription_update");
    /* Stripe's proration: the unused time on 5 a credit, the time remaining on 8 a charge, both lines at their whole quantities. */
    rise.lines.data.push(Object.assign({}, rise.lines.data[1], { id: sid("il"), quantity: 5, amount: -41000 }));
    rise.lines.data[1].amount = 65000;
    p.sub.items = subItems([[PRICE.leadYear, 1], [PRICE.deskYear, 100]]);
    const re = event("invoice.paid", rise.id); await w.post(re);
    ck(w.outcome(re) === "applied" && (w.licence(id) || {}).seats === 8,
      "S22b a rise invoice billing 8 (its credit for the old 5 left out), the subscription at 100 when its event is handled: 8 desks: " + (w.licence(id) || {}).seats);
  });

  /* A CANCEL OF A SOLE SUBSCRIPTION (Grok's review 6, finding 4; the design's section 3: paid_until "unchanged: lapses at its own date"):
     every seat it paid for stays to that date, where the floor of one once took three desks at once and ran the last one on. */
  await leg("S23", async () => {
    const w = world(K);
    const p = await buy(w, [[PRICE.leadYear, 1], [PRICE.deskYear, 4]]);
    const id = (w.paidOf(p.buyer.person)[0] || {}).id, was = w.licence(id) || {};
    p.sub.status = "canceled";
    const ce = event("customer.subscription.deleted", p.sub.id), cr = await w.post(ce);
    const kept = w.licence(id) || {};
    ck(cr.status === 200 && w.outcome(ce) === "applied" && kept.seats === 4 && kept.lead_seats === 1 && kept.paid_until === was.paid_until && kept.refunded === 0,
      "S23a a sole subscription canceled keeps its 4 desks and its lead to its own paid date: " + JSON.stringify({ seats: kept.seats, lead: kept.lead_seats, same: kept.paid_until === was.paid_until }));
    w.clock.now = was.paid_until + DAY;
    const again = await buy(w, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]], { buyer: p.buyer, ends: w.clock.now + 365 * DAY });
    const back = w.licence(id) || {};
    ck(w.outcome(again.e) === "applied" && w.paidOf(p.buyer.person).length === 1 && back.seats === 2 && back.lead_seats === 1 && back.paid_until === w.clock.now + 365 * DAY + GRACE,
      "S23b bought again after it lapsed, the licence is raised in place to the new 2 desks, nothing carried from the lapsed subscription: "
      + JSON.stringify({ seats: back.seats, lead: back.lead_seats }));
    const w2 = world(K);
    const q = await buy(w2, [[PRICE.leadYear, 1], [PRICE.deskYear, 3]]);
    const qid = (w2.paidOf(q.buyer.person)[0] || {}).id;
    q.sub.status = "canceled";
    await w2.post(event("customer.subscription.deleted", q.sub.id));
    const ch = w2.stripe.charges.get(q.inv._charge); ch.refunded = true; ch.amount_refunded = ch.amount;
    const re = event("charge.refunded", ch.id); await w2.post(re);
    ck(w2.outcome(re) === "applied" && (w2.licence(qid) || {}).refunded === 1,
      "S23c a full refund after the cancel still ends the sole-source licence: " + w2.outcome(re));
    for (const [tag, at] of [["S23d", 31], ["S23e", 20]]) {
      const w3 = world(K, { env: { PROVIDERS: JSON.stringify([{ id: "google", clientId: GOOGLE_CLIENT }]) } });
      const owner = await signinS(w3, tag + "-lead1", "acme.example");
      const m = await buy(w3, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 4]], { buyer: owner, ends: T0 + 30 * DAY });
      const mid = (w3.paidOf(m.buyer.person)[0] || {}).id;
      await callSignedS(w3, "licence/set", owner.lead, { orgDesks: true }, RQ.licenceSetBytes);
      w3.clock.now = T0 + Math.min(at, 30) * DAY;
      m.sub.status = "canceled";
      await w3.post(event("customer.subscription.deleted", m.sub.id));
      w3.clock.now = T0 + at * DAY;
      const y = await buy(w3, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]], { buyer: owner, ends: T0 + (at + 365) * DAY });
      w3.clock.now = T0 + (at + 1) * DAY;
      await renewOwnerS(w3, tag + "-lead1", "acme.example", owner.lead);
      const ckMid = await quietCheckS(w3, owner.lead);
      const listMid = await callSignedS(w3, "seat/list", owner.lead, {}, RQ.seatListBytes);
      const l2 = await signinS(w3, tag + "-l2", "acme.example"), l3 = await signinS(w3, tag + "-l3", "acme.example");
      const nameL2 = await callSignedS(w3, "lead/name", owner.lead, { code: l2.me }, RQ.leadNameBytes);
      await callSignedS(w3, "lead/accept", l2.lead, {}, RQ.leadAcceptBytes); /* the named person presses Accept: their own trial of 14 days is set aside only by that press */
      const ckL2 = await quietCheckS(w3, l2.lead);
      const nameL3 = await callSignedS(w3, "lead/name", owner.lead, { code: l3.me }, RQ.leadNameBytes);
      const desksMid = [];
      for (let i = 1; i <= 6; i++) desksMid.push(await deskSigninS(w3, tag + "-d" + i, "acme.example", edKey()));
      deskTrialHad(w3, tag + "-d7");
      const d7 = await deskSigninS(w3, tag + "-d7", "acme.example", edKey());
      w3.clock.now = T0 + 44 * DAY;
      const ck44 = await quietCheckS(w3, owner.lead);
      const list44 = await callSignedS(w3, "seat/list", owner.lead, {}, RQ.seatListBytes);
      const l2Drop44 = await quietCheckS(w3, l2.lead);
      /* The named lead signed in at +(at + 1)d, pressed lead/accept at their naming, and their trial runs 14 days: where it still runs at +44d the mend of review 4 (findings 3 and 4)
         hands them that trial; where it has ended they are released, as before. */
      const l2TrialRuns44 = at + 1 + 14 > 44;
      await callSignedS(w3, "seat/free", owner.lead, { kind: "lead", person: l2.me }, RQ.seatFreeBytes);
      const nameL3At44 = await callSignedS(w3, "lead/name", owner.lead, { code: l3.me }, RQ.leadNameBytes);
      for (let i = 2; i < 6; i++) if (desksMid[i].body && desksMid[i].body.certificate)
        await callSignedS(w3, "seat/free", owner.lead, { kind: "desk", person: desksMid[i].body.certificate.person }, RQ.seatFreeBytes);
      deskTrialHad(w3, tag + "-d8");
      const d8 = await deskSigninS(w3, tag + "-d8", "acme.example", edKey());
      w3.clock.now = T0 + (at + 365) * DAY;
      w3.env.DELEGATION = JSON.stringify(delegation({ from: w3.clock.now - 10 * DAY, until: w3.clock.now + 300 * DAY }));
      const ren = invoice(w3, y.sub, T0 + (at + 730) * DAY, "subscription_cycle");
      await w3.post(event("invoice.paid", ren.id));
      await renewOwnerS(w3, tag + "-lead1", "acme.example", owner.lead);
      const afterRen = w3.licence(mid) || {};
      const oldSub = w3.db.raw.prepare("SELECT lead_seats, seats FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(m.sub.id) || {};
      const ckRen = await quietCheckS(w3, owner.lead);
      const listRen = await callSignedS(w3, "seat/list", owner.lead, {}, RQ.seatListBytes);
      const ch3 = w3.stripe.charges.get(ren._charge); ch3.refunded = true; ch3.amount_refunded = ch3.amount;
      const rf = event("charge.refunded", ch3.id); await w3.post(rf);
      const afterRef = w3.licence(mid) || {};
      const wantRenEnd = T0 + (at + 730) * DAY + GRACE;
      const midOk = !!ckMid.body && await licenceHolds(ckMid.body.licence) && ckMid.body.licence.seats === 6
        && listMid.status === 200 && listMid.body.counts.lead.of === 2 && listMid.body.counts.desk.of === 6
        && nameL2.status === 200 && ckL2.body && ckL2.body.ref === ckMid.body.ref && ckL2.body.licence && ckL2.body.licence.seats === 6
        && nameL3.status === 409 && nameL3.body.reason === "full"
        && desksMid.every(d => d.status === 200 && d.body && d.body.certificate)
        && d7.status === 200 && d7.body && !d7.body.certificate && d7.body.reason === "waiting";
      const at44Ok = !!ck44.body && await licenceHolds(ck44.body.licence) && ck44.body.licence.seats === 2
        && list44.status === 200 && list44.body.counts.lead.of === 1 && list44.body.counts.desk.of === 2
        && l2Drop44.status === 200 && l2Drop44.body && (l2TrialRuns44 ? (l2Drop44.body.released !== true && !!l2Drop44.body.licence && l2Drop44.body.licence.kind === "etiuda-studio-trial-license" && !!l2Drop44.body.grant) : (l2Drop44.body.licence === null && l2Drop44.body.released === true))
        && nameL3At44.status === 409 && nameL3At44.body.reason === "full"
        && d8.status === 200 && d8.body && !d8.body.certificate && d8.body.reason === "waiting";
      const renOk = afterRen.lead_seats === 1 && afterRen.seats === 2 && afterRen.paid_until === wantRenEnd
        && oldSub.lead_seats === 0 && oldSub.seats === 0
        && !!ckRen.body && ckRen.body.licence && ckRen.body.licence.seats === 2
        && listRen.status === 200 && listRen.body.counts.lead.of === 1 && listRen.body.counts.desk.of === 2;
      ck(w3.outcome(y.e) === "applied" && w3.paidOf(m.buyer.person).length === 1
        && midOk && at44Ok && renOk
        && w3.outcome(rf) === "applied" && afterRef.refunded === 1,
        tag + " 1 lead and 4 desks monthly (paid_until +44d), cancelled, 1 lead and 2 desks yearly bought at +" + at + "d: sum (2 leads, 6 desks) to +44d, 1 and 2 at +44d with no payment in between (the named lead is handed their own trial where it still runs, released where it has ended), 1 and 2 after renewal (paid_until +" + (at + 730 + 14) + "d), and full refund ends the licence: "
        + JSON.stringify({ mid: [ckMid.body && ckMid.body.licence && ckMid.body.licence.seats, listMid.body && listMid.body.counts, nameL3.status, d7.body && d7.body.reason],
          at44: [ck44.body && ck44.body.licence && ck44.body.licence.seats, list44.body && list44.body.counts, l2Drop44.body && (l2Drop44.body.released === true ? "released" : l2Drop44.body.licence && l2Drop44.body.licence.kind), nameL3At44.status, d8.body && d8.body.reason],
          ren: [afterRen.lead_seats, afterRen.seats, (afterRen.paid_until - T0) / DAY, oldSub], refund: [w3.outcome(rf), afterRef.refunded] }));
    }
    const w4 = world(K);
    const m4 = await buy(w4, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 4]], { ends: T0 + 30 * DAY });
    const mid4 = (w4.paidOf(m4.buyer.person)[0] || {}).id;
    w4.clock.now = T0 + 30 * DAY;
    m4.sub.status = "canceled";
    await w4.post(event("customer.subscription.deleted", m4.sub.id));
    w4.clock.now = T0 + 50 * DAY;
    await buy(w4, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]], { buyer: m4.buyer, ends: T0 + 415 * DAY });
    const after4 = w4.licence(mid4) || {};
    const m4Sub = w4.db.raw.prepare("SELECT lead_seats, seats FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(m4.sub.id) || {};
    const w5 = world(K);
    const m5 = await buy(w5, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 4]], { ends: T0 + 30 * DAY });
    const mid5 = (w5.paidOf(m5.buyer.person)[0] || {}).id;
    w5.clock.now = T0 + 30 * DAY;
    m5.sub.status = "canceled";
    await w5.post(event("customer.subscription.deleted", m5.sub.id));
    w5.clock.now = T0 + 31 * DAY;
    const y5 = await buy(w5, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]], { buyer: m5.buyer, ends: T0 + 396 * DAY });
    w5.clock.now = T0 + 50 * DAY;
    const ch5 = w5.stripe.charges.get(y5.inv._charge); ch5.refunded = true; ch5.amount_refunded = ch5.amount;
    const rf5 = event("charge.refunded", ch5.id); await w5.post(rf5);
    const after5 = w5.licence(mid5) || {};
    const m5Sub = w5.db.raw.prepare("SELECT lead_seats, seats FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(m5.sub.id) || {};
    /* The same, the later subscription cancelled at +50d: the licence's own counts are settled there, where a refund ends the licence instead. */
    const w5c = world(K);
    const m5c = await buy(w5c, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 4]], { ends: T0 + 30 * DAY });
    const mid5c = (w5c.paidOf(m5c.buyer.person)[0] || {}).id;
    w5c.clock.now = T0 + 30 * DAY;
    m5c.sub.status = "canceled";
    await w5c.post(event("customer.subscription.deleted", m5c.sub.id));
    w5c.clock.now = T0 + 31 * DAY;
    const y5c = await buy(w5c, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]], { buyer: m5c.buyer, ends: T0 + 396 * DAY });
    w5c.clock.now = T0 + 50 * DAY;
    y5c.sub.status = "canceled";
    await w5c.post(event("customer.subscription.deleted", y5c.sub.id));
    const after5c = w5c.licence(mid5c) || {};
    const m5cSub = w5c.db.raw.prepare("SELECT lead_seats, seats FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(m5c.sub.id) || {};
    const y5cSub = w5c.db.raw.prepare("SELECT lead_seats, seats FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(y5c.sub.id) || {};
    ck(after4.lead_seats === 1 && after4.seats === 2 && m4Sub.lead_seats === 0 && m4Sub.seats === 0
      && w5.outcome(rf5) === "applied" && after5.refunded === 1 && m5Sub.lead_seats === 0 && m5Sub.seats === 0
      && after5c.lead_seats === 1 && after5c.seats === 2 && m5cSub.lead_seats === 0 && m5cSub.seats === 0 && y5cSub.lead_seats === 1 && y5cSub.seats === 2,
      "S23f settling passed cancelled rows at a later purchase (+50d), refund (+50d) or cancel (+50d): "
      + JSON.stringify({ buy: [after4.lead_seats, after4.seats, m4Sub], refund: [w5.outcome(rf5), after5.refunded, m5Sub], cancel: [after5c.lead_seats, after5c.seats, m5cSub, y5cSub] }));
    const w6 = world(K, { env: { PROVIDERS: JSON.stringify([{ id: "google", clientId: GOOGLE_CLIENT }]) } });
    const owner6 = await signinS(w6, "S23g-lead1", "acme.example");
    const m6 = await buy(w6, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 4]], { buyer: owner6, ends: T0 + 30 * DAY });
    const mid6 = (w6.paidOf(m6.buyer.person)[0] || {}).id;
    await callSignedS(w6, "licence/set", owner6.lead, { orgDesks: true }, RQ.licenceSetBytes);
    w6.clock.now = T0 + 10 * DAY;
    m6.sub.status = "canceled";
    await w6.post(event("customer.subscription.deleted", m6.sub.id));
    const y6 = await buy(w6, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]], { buyer: owner6, ends: T0 + 365 * DAY });
    w6.clock.now = T0 + 20 * DAY;
    await renewOwnerS(w6, "S23g-lead1", "acme.example", owner6.lead);
    const ckMid6 = await quietCheckS(w6, owner6.lead);
    const listMid6 = await callSignedS(w6, "seat/list", owner6.lead, {}, RQ.seatListBytes);
    const l2_6 = await signinS(w6, "S23g-l2", "acme.example"), l3_6 = await signinS(w6, "S23g-l3", "acme.example");
    const nameL2_6 = await callSignedS(w6, "lead/name", owner6.lead, { code: l2_6.me }, RQ.leadNameBytes);
    await callSignedS(w6, "lead/accept", l2_6.lead, {}, RQ.leadAcceptBytes); /* the named person presses Accept: their own trial of 14 days is set aside only by that press */
    const ckL2_6 = await quietCheckS(w6, l2_6.lead);
    const nameL3_6 = await callSignedS(w6, "lead/name", owner6.lead, { code: l3_6.me }, RQ.leadNameBytes);
    const desksMid6 = [];
    for (let i = 1; i <= 6; i++) desksMid6.push(await deskSigninS(w6, "S23g-d" + i, "acme.example", edKey()));
    deskTrialHad(w6, "S23g-d7");
    const d7_6 = await deskSigninS(w6, "S23g-d7", "acme.example", edKey());
    w6.clock.now = T0 + 44 * DAY;
    const ck44_6 = await quietCheckS(w6, owner6.lead);
    const list44_6 = await callSignedS(w6, "seat/list", owner6.lead, {}, RQ.seatListBytes);
    const l2Drop44_6 = await quietCheckS(w6, l2_6.lead);
    await callSignedS(w6, "seat/free", owner6.lead, { kind: "lead", person: l2_6.me }, RQ.seatFreeBytes);
    const nameL3At44_6 = await callSignedS(w6, "lead/name", owner6.lead, { code: l3_6.me }, RQ.leadNameBytes);
    for (let i = 2; i < 6; i++) if (desksMid6[i].body && desksMid6[i].body.certificate)
      await callSignedS(w6, "seat/free", owner6.lead, { kind: "desk", person: desksMid6[i].body.certificate.person }, RQ.seatFreeBytes);
    deskTrialHad(w6, "S23g-d8");
    const d8_6 = await deskSigninS(w6, "S23g-d8", "acme.example", edKey());
    w6.clock.now = T0 + 365 * DAY;
    w6.env.DELEGATION = JSON.stringify(delegation({ from: w6.clock.now - 10 * DAY, until: w6.clock.now + 300 * DAY }));
    const ren6 = invoice(w6, y6.sub, T0 + 730 * DAY, "subscription_cycle");
    await w6.post(event("invoice.paid", ren6.id));
    await renewOwnerS(w6, "S23g-lead1", "acme.example", owner6.lead);
    const afterRen6 = w6.licence(mid6) || {};
    const m6Sub = w6.db.raw.prepare("SELECT lead_seats, seats FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(m6.sub.id) || {};
    const ckRen6 = await quietCheckS(w6, owner6.lead);
    const listRen6 = await callSignedS(w6, "seat/list", owner6.lead, {}, RQ.seatListBytes);
    const mid6Ok = !!ckMid6.body && await licenceHolds(ckMid6.body.licence) && ckMid6.body.licence.seats === 6
      && listMid6.status === 200 && listMid6.body.counts.lead.of === 2 && listMid6.body.counts.desk.of === 6
      && nameL2_6.status === 200 && ckL2_6.body && ckL2_6.body.ref === ckMid6.body.ref && ckL2_6.body.licence && ckL2_6.body.licence.seats === 6
      && nameL3_6.status === 409 && nameL3_6.body.reason === "full"
      && desksMid6.every(d => d.status === 200 && d.body && d.body.certificate)
      && d7_6.status === 200 && d7_6.body && !d7_6.body.certificate && d7_6.body.reason === "waiting";
    const at44_6Ok = !!ck44_6.body && await licenceHolds(ck44_6.body.licence) && ck44_6.body.licence.seats === 2
      && list44_6.status === 200 && list44_6.body.counts.lead.of === 1 && list44_6.body.counts.desk.of === 2
      && l2Drop44_6.status === 200 && l2Drop44_6.body && l2Drop44_6.body.licence === null && l2Drop44_6.body.released === true
      && nameL3At44_6.status === 409 && nameL3At44_6.body.reason === "full"
      && d8_6.status === 200 && d8_6.body && !d8_6.body.certificate && d8_6.body.reason === "waiting";
    const ren6Ok = afterRen6.lead_seats === 1 && afterRen6.seats === 2 && afterRen6.paid_until === T0 + 744 * DAY
      && m6Sub.lead_seats === 0 && m6Sub.seats === 0
      && !!ckRen6.body && ckRen6.body.licence && ckRen6.body.licence.seats === 2
      && listRen6.status === 200 && listRen6.body.counts.lead.of === 1 && listRen6.body.counts.desk.of === 2;
    ck(w6.paidOf(m6.buyer.person).length === 1 && mid6Ok && at44_6Ok && ren6Ok,
      "S23g two subscriptions (1+4 monthly +44d, then 1+2 yearly +379d bought after the first was cancelled): sum (2 leads, 6 desks) to +44d, 1 and 2 at +44d with no payment in between, and 1 and 2 after renewal (+744d): "
      + JSON.stringify({ mid: [ckMid6.body && ckMid6.body.licence && ckMid6.body.licence.seats, listMid6.body && listMid6.body.counts, nameL3_6.status, d7_6.body && d7_6.body.reason],
        at44: [ck44_6.body && ck44_6.body.licence && ck44_6.body.licence.seats, list44_6.body && list44_6.body.counts, l2Drop44_6.body && l2Drop44_6.body.released, nameL3At44_6.status, d8_6.body && d8_6.body.reason],
        ren: [afterRen6.lead_seats, afterRen6.seats, (afterRen6.paid_until - T0) / DAY, m6Sub] }));
    const w7 = world(K);
    const m7 = await buy(w7, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 4]], { ends: T0 + 30 * DAY });
    const mid7 = (w7.paidOf(m7.buyer.person)[0] || {}).id;
    w7.clock.now = T0 + 10 * DAY;
    m7.sub.status = "canceled";
    await w7.post(event("customer.subscription.deleted", m7.sub.id));
    const y7 = await buy(w7, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]], { buyer: m7.buyer, ends: T0 + 365 * DAY });
    w7.clock.now = T0 + 20 * DAY;
    const ch7 = w7.stripe.charges.get(m7.inv._charge); ch7.refunded = true; ch7.amount_refunded = ch7.amount;
    const rf7 = event("charge.refunded", ch7.id); await w7.post(rf7);
    const after7 = w7.licence(mid7) || {};
    const m7Sub = w7.db.raw.prepare("SELECT status, lead_seats, seats FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(m7.sub.id) || {};
    ck(w7.outcome(rf7) === "refund-one-source" && after7.refunded === 0 && after7.lead_seats === 1 && after7.seats === 2 && after7.paid_until === T0 + 379 * DAY
      && m7Sub.status === "refunded" && m7Sub.lead_seats === 0 && m7Sub.seats === 0,
      "S23h refunding the cancelled subscription before +44d takes its 1 lead and 4 desks at once, leaving the other's 1 lead and 2 desks to +379d: "
      + JSON.stringify({ outcome: w7.outcome(rf7), lead: after7.lead_seats, seats: after7.seats, paidDay: (after7.paid_until - T0) / DAY, m7Sub }));
    const w8 = world(K, { env: { PROVIDERS: JSON.stringify([{ id: "google", clientId: GOOGLE_CLIENT }]) } });
    const owner8 = await signinS(w8, "S23i-lead1", "acme.example");
    const m8 = await buy(w8, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 4]], { buyer: owner8, ends: T0 + 30 * DAY });
    const mid8 = (w8.paidOf(m8.buyer.person)[0] || {}).id;
    w8.clock.now = T0 + 10 * DAY;
    m8.sub.status = "canceled";
    await w8.post(event("customer.subscription.deleted", m8.sub.id));
    const y8 = await buy(w8, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]], { buyer: owner8, ends: T0 + 365 * DAY });
    const ch8 = w8.stripe.charges.get(y8.inv._charge); ch8.refunded = true; ch8.amount_refunded = ch8.amount;
    const rf8 = event("charge.refunded", ch8.id); await w8.post(rf8);
    const after8 = w8.licence(mid8) || {};
    const list8 = await callSignedS(w8, "seat/list", owner8.lead, {}, RQ.seatListBytes);
    const ck8 = await quietCheckS(w8, owner8.lead);
    ck(w8.outcome(rf8) === "refund-one-source" && after8.refunded === 0 && after8.lead_seats === 1 && after8.seats === 4 && after8.paid_until === T0 + 44 * DAY
      && list8.status === 200 && list8.body.counts.lead.of === 1 && list8.body.counts.desk.of === 4 && !!ck8.body && ck8.body.licence && ck8.body.licence.kind === "etiuda-studio-license" && ck8.body.licence.seats === 4,
      "S23i refunding the other live subscription while the cancelled one's paid time runs is a refund of one source, the licence live on the cancelled one's 1 lead and 4 desks to its paid_until (+44d): "
      + JSON.stringify({ outcome: w8.outcome(rf8), refunded: after8.refunded, lead: after8.lead_seats, seats: after8.seats, paid_until: after8.paid_until, paidDay: (after8.paid_until - T0) / DAY, counts: list8.body && list8.body.counts }));
    const w9 = world(K, { env: { PROVIDERS: JSON.stringify([{ id: "google", clientId: GOOGLE_CLIENT }]) } });
    const owner9 = await signinS(w9, "S23j-lead1", "acme.example");
    const m9 = await buy(w9, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 4]], { buyer: owner9, ends: T0 + 30 * DAY });
    const mid9 = (w9.paidOf(m9.buyer.person)[0] || {}).id;
    w9.clock.now = T0 + 10 * DAY;
    m9.sub.status = "canceled";
    await w9.post(event("customer.subscription.deleted", m9.sub.id));
    await buy(w9, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]], { buyer: owner9, ends: T0 + 365 * DAY });
    w9.clock.now = T0 + 20 * DAY;
    await renewOwnerS(w9, "S23j-lead1", "acme.example", owner9.lead);
    const ch9 = w9.stripe.charges.get(m9.inv._charge); ch9.refunded = true; ch9.amount_refunded = ch9.amount;
    await w9.post(event("charge.refunded", ch9.id));
    const afterRef9 = w9.licence(mid9) || {};
    const listAfterRef9 = await callSignedS(w9, "seat/list", owner9.lead, {}, RQ.seatListBytes);
    w9.clock.now = T0 + 44 * DAY - 1000;
    const listBeforeDate9 = await callSignedS(w9, "seat/list", owner9.lead, {}, RQ.seatListBytes);
    w9.clock.now = T0 + 44 * DAY;
    const listAtDate9 = await callSignedS(w9, "seat/list", owner9.lead, {}, RQ.seatListBytes);
    const ckAtDate9 = await quietCheckS(w9, owner9.lead);
    ck(afterRef9.lead_seats === 1 && afterRef9.seats === 2
      && listAfterRef9.status === 200 && listAfterRef9.body.counts.lead.of === 1 && listAfterRef9.body.counts.desk.of === 2
      && listBeforeDate9.status === 200 && listBeforeDate9.body.counts.lead.of === 1 && listBeforeDate9.body.counts.desk.of === 2
      && listAtDate9.status === 200 && listAtDate9.body.counts.lead.of === 1 && listAtDate9.body.counts.desk.of === 2
      && !!ckAtDate9.body && ckAtDate9.body.licence && ckAtDate9.body.licence.seats === 2,
      "S23j a cancelled subscription refunded before its own paid date loses its seats at once, and at that date nothing more comes off: "
      + JSON.stringify({ afterRefund: [afterRef9.lead_seats, afterRef9.seats, listAfterRef9.body && listAfterRef9.body.counts],
        justBefore: listBeforeDate9.body && listBeforeDate9.body.counts,
        atDate: [listAtDate9.body && listAtDate9.body.counts, ckAtDate9.body && ckAtDate9.body.licence && ckAtDate9.body.licence.seats] }));
    const w10 = world(K);
    const m10 = await buy(w10, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 4]], { ends: T0 + 30 * DAY });
    const mid10 = (w10.paidOf(m10.buyer.person)[0] || {}).id;
    w10.clock.now = T0 + 10 * DAY;
    m10.sub.status = "canceled";
    await w10.post(event("customer.subscription.deleted", m10.sub.id));
    const y10 = await buy(w10, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]], { buyer: m10.buyer, ends: T0 + 365 * DAY });
    w10.clock.now = T0 + 50 * DAY;
    y10.sub.items = subItems([[PRICE.leadYear, 1], [PRICE.deskYear, 3]]);
    await w10.post(event("invoice.paid", invoice(w10, y10.sub, T0 + 365 * DAY, "subscription_update").id));
    const settled10 = w10.licence(mid10) || {};
    const m10Settled = w10.db.raw.prepare("SELECT lead_seats, seats FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(m10.sub.id) || {};
    w10.clock.now = T0 + 51 * DAY;
    const ch10 = w10.stripe.charges.get(m10.inv._charge); ch10.refunded = true; ch10.amount_refunded = ch10.amount;
    const rf10 = event("charge.refunded", ch10.id); await w10.post(rf10);
    const after10 = w10.licence(mid10) || {};
    const m10After = w10.db.raw.prepare("SELECT status, lead_seats, seats FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(m10.sub.id) || {};
    ck(settled10.lead_seats === 1 && settled10.seats === 3 && m10Settled.lead_seats === 0 && m10Settled.seats === 0
      && w10.outcome(rf10) === "refund-one-source" && after10.lead_seats === 1 && after10.seats === 3 && m10After.status === "refunded",
      "S23k a cancelled subscription whose date has passed and been settled, then refunded late, changes no count: "
      + JSON.stringify({ settled: [settled10.lead_seats, settled10.seats, m10Settled], after: [w10.outcome(rf10), after10.lead_seats, after10.seats, m10After] }));
    const w11 = world(K, { env: { PROVIDERS: JSON.stringify([{ id: "google", clientId: GOOGLE_CLIENT }]) } });
    const owner11 = await signinS(w11, "S23l-lead1", "acme.example");
    const m11 = await buy(w11, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 4]], { buyer: owner11, ends: T0 + 30 * DAY });
    const mid11 = (w11.paidOf(m11.buyer.person)[0] || {}).id;
    w11.clock.now = T0 + 10 * DAY;
    m11.sub.status = "canceled";
    await w11.post(event("customer.subscription.deleted", m11.sub.id));
    const y11 = await buy(w11, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]], { buyer: owner11, ends: T0 + 365 * DAY });
    w11.clock.now = T0 + 20 * DAY;
    y11.sub.status = "canceled";
    await w11.post(event("customer.subscription.deleted", y11.sub.id));
    await renewOwnerS(w11, "S23l-lead1", "acme.example", owner11.lead);
    w11.clock.now = T0 + 30 * DAY;
    const listBefore11 = await callSignedS(w11, "seat/list", owner11.lead, {}, RQ.seatListBytes);
    w11.clock.now = T0 + 44 * DAY;
    const listBetween11 = await callSignedS(w11, "seat/list", owner11.lead, {}, RQ.seatListBytes);
    const ckBetween11 = await quietCheckS(w11, owner11.lead);
    w11.clock.now = T0 + 365 * DAY;
    w11.env.DELEGATION = JSON.stringify(delegation({ from: w11.clock.now - 10 * DAY, until: w11.clock.now + 300 * DAY }));
    await renewOwnerS(w11, "S23l-lead1", "acme.example", owner11.lead);
    w11.clock.now = T0 + 380 * DAY;
    const listLapsed11 = await callSignedS(w11, "seat/list", owner11.lead, {}, RQ.seatListBytes);
    /* In force as the service counts it (pay.mjs inForceCol, its base): stored less passed cancelled subscriptions, never below one. */
    const inForceLapsed11 = w11.db.raw.prepare("SELECT MAX(1, l.lead_seats - COALESCE((SELECT SUM(lead_seats) FROM pay_subs WHERE licence = l.id AND status = 'canceled' AND paid_until <= ?), 0)) AS lead, "
      + "MAX(1, l.seats - COALESCE((SELECT SUM(seats) FROM pay_subs WHERE licence = l.id AND status = 'canceled' AND paid_until <= ?), 0)) AS desk FROM licences l WHERE l.id = ?").get(w11.clock.now, w11.clock.now, mid11) || {};
    const ckLapsed11 = await quietCheckS(w11, owner11.lead);
    const lapsedLic11 = w11.licence(mid11) || {};
    await buy(w11, [[PRICE.leadYear, 1], [PRICE.deskYear, 3]], { buyer: owner11, ends: w11.clock.now + 365 * DAY });
    const reBought11 = w11.licence(mid11) || {};
    ck(listBefore11.status === 200 && listBefore11.body.counts.lead.of === 2 && listBefore11.body.counts.desk.of === 6
      && listBetween11.status === 200 && listBetween11.body.counts.lead.of === 1 && listBetween11.body.counts.desk.of === 2
      && !!ckBetween11.body && ckBetween11.body.licence && ckBetween11.body.licence.seats === 2
      /* REVIEW 48, FINDING 2 (Claude alpha: "lead/name and leadOf require a running licence"): past its paid end the seat list, a lead's act, is
         refused as no lead's; until then it answered the counts, 1 and 1, which are read in force here instead. */
      && listLapsed11.status === 404 && inForceLapsed11.lead === 1 && inForceLapsed11.desk === 1
      /* REVERSED BY PIECE S-0 (Max, 2026-11-17 20:41, "I agree with your recommendation", to a paid licence that ends stopping Studio as it
         stops the desk): past its paid end the check hands no licence, answered ended "expired"; until then it handed the licence, its seats 1. */
      && !!ckLapsed11.body && ckLapsed11.body.grant === null && ckLapsed11.body.licence === null && ckLapsed11.body.ended === "expired"
      && lapsedLic11.paid_until <= T0 + 380 * DAY
      && reBought11.lead_seats === 1 && reBought11.seats === 3,
      "S23l one cancelled, a second bought, then the second cancelled too before the first's date: each keeps its seats to its own date, and after the later date the licence has lapsed, its seat list refused, with nothing subtracted twice: "
      + JSON.stringify({ before44: listBefore11.body && listBefore11.body.counts, between: listBetween11.body && listBetween11.body.counts,
        lapsed: [listLapsed11.status, inForceLapsed11, ckLapsed11.body && ckLapsed11.body.grant, ckLapsed11.body && ckLapsed11.body.ended], reBought: [reBought11.lead_seats, reBought11.seats] }));
  });

  /* A PAID INVOICE WHOSE SUBSCRIPTION IS STILL PAST DUE (Grok's review 6, finding 5B): retried until Stripe moves it to active, never
     held, since a hold would leave the subscription unknown here and every later renewal held "subscription-unknown". */
  await leg("S24", async () => {
    const w = world(K);
    const buyer = w.person();
    const c = checkout(w, buyer.code, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]]);
    await w.post(event("checkout.session.completed", c.session.id));
    c.sub.status = "past_due";
    const e = event("invoice.paid", c.inv.id), before = w.state(), early = await w.post(e), unchanged = w.state() === before;
    c.sub.status = "active";
    const again = await w.post(e);
    const lic = w.paidOf(buyer.person)[0] || {};
    ck(early.status === 500 && unchanged && again.status === 200 && w.outcome(e) === "applied" && lic.seats === 2,
      "S24a a first invoice paid while its subscription reads past_due answers 500 and writes nothing; Stripe's retry, once it is active, applies it: "
      + JSON.stringify({ early: early.status, again: again.status, outcome: w.outcome(e), seats: lic.seats }));
    const outs = [];
    for (const st of ["unpaid", "incomplete"]) {
      const d = checkout(w, w.person().code, [[PRICE.deskYear, 1]]);
      await w.post(event("checkout.session.completed", d.session.id));
      d.sub.status = st;
      const r = await w.post(event("invoice.paid", d.inv.id));
      outs.push(st + ":" + r.status);
    }
    ck(outs.join() === "unpaid:500,incomplete:500", "S24b unpaid and incomplete answer 500 too, retried: " + outs.join(", "));
  });

  /* A NEW PERIOD PAID AFTER A REFUND (Grok's review 6, finding 5C): the restricted key cannot cancel, so the subscription renews. */
  /* S16c (register 47.7; the test architect's read): a held Stripe purchase released through the attach tool makes a licence keyed stripe:, so the
     subscription-only rules find it as they find the route's own: its sole subscription's full refund ends it, and its next period gives it back on its own seats. */
  await leg("S16c", async () => {
    const w = world(K);
    const buyer = w.person();
    const e1 = T0 + 30 * DAY;
    const c = checkout(w, buyer.code, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 2]], { dropCode: true, ends: e1 });
    await w.post(event("checkout.session.completed", c.session.id));
    const held = event("invoice.paid", c.inv.id); await w.post(held);
    const made = await w.AT.makeAttachSql({ owner: buyer.code, org: "Bought through Stripe", personal: true, leadSeats: 1, seats: 2, order: "INV-S16c",
      payPeriodEnd: new Date(e1).toISOString().slice(0, 10), payProvider: "stripe", paddleSub: c.sub.id, paddleTxn: c.inv.id, paddleBuyer: buyer.code }, w.clock.now);
    w.db.raw.exec(made.sql);
    const row = w.db.raw.prepare("SELECT * FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(c.sub.id) || {};
    const keyed = (w.licence(row.licence) || {}).key_hash || "";
    const ch = w.stripe.charges.get(c.inv._charge); ch.refunded = true; ch.amount_refunded = ch.amount;
    const fe = event("charge.refunded", ch.id); await w.post(fe);
    const ended = (w.licence(row.licence) || {}).refunded;
    const ren = invoice(w, c.sub, T0 + 60 * DAY, "subscription_cycle"), re = event("invoice.paid", ren.id); await w.post(re);
    const back = w.licence(row.licence) || {};
    ck(/^stripe:/.test(keyed) && w.outcome(fe) === "applied" && ended === 1 && w.outcome(re) === "restored" && back.refunded === 0 && back.seats === 2 && back.lead_seats === 1,
      "S16c a held Stripe purchase released through the attach tool is keyed stripe: and the subscription-only rules take it: its full refund ends the licence, its next period gives it back on 1 lead and 2 desks: "
      + JSON.stringify({ held: w.outcome(held), key: keyed.slice(0, 7), refund: w.outcome(fe), refunded: ended, renewal: w.outcome(re), seats: back.seats, lead: back.lead_seats }));
  });

  await leg("S25", async () => {
    const w = world(K);
    const e1 = T0 + 30 * DAY;
    const p = await buy(w, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 3]], { ends: e1 });
    const id = (w.paidOf(p.buyer.person)[0] || {}).id;
    const ch = w.stripe.charges.get(p.inv._charge); ch.refunded = true; ch.amount_refunded = ch.amount;
    const fe = event("charge.refunded", ch.id); await w.post(fe);
    const same = invoice(w, p.sub, e1, "subscription_cycle"), se = event("invoice.paid", same.id); await w.post(se);
    const ended = (w.licence(id) || {}).refunded;
    const ren = invoice(w, p.sub, T0 + 60 * DAY, "subscription_cycle"), re = event("invoice.paid", ren.id), rr = await w.post(re);
    const back = w.licence(id) || {};
    ck(w.outcome(fe) === "applied" && ended === 1 && w.outcome(se) === "held:licence-ended" && rr.status === 200 && w.outcome(re) === "restored"
      && back.refunded === 0 && back.refunded_at === null && back.seats === 3 && back.lead_seats === 1 && back.paid_until === T0 + 60 * DAY + GRACE,
      "S25a a licence its subscription's refund ended: another payment for the refunded period stays held \"licence-ended\"; the renewal of the next"
      + " period gives it back with its own 3 desks, listed \"restored\": " + JSON.stringify({ same: w.outcome(se), renewal: w.outcome(re), refunded: back.refunded, seats: back.seats }));
    const w2 = world(K);
    const q = await buy(w2, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 2]], { ends: e1 });
    const qid = (w2.paidOf(q.buyer.person)[0] || {}).id;
    w2.db.raw.prepare("UPDATE licences SET refunded = 1, refunded_at = ? WHERE id = ?").run(T0, qid);
    const hr = invoice(w2, q.sub, T0 + 60 * DAY, "subscription_cycle"), he = event("invoice.paid", hr.id); await w2.post(he);
    ck(w2.outcome(he) === "held:licence-ended" && (w2.licence(qid) || {}).refunded === 1,
      "S25b a licence Max ended by hand (refund-licence.mjs) stays ended: its renewal is held \"licence-ended\": " + w2.outcome(he));
  });

  /* A RISE IN THE SAME PERIOD (Grok's review 6, finding 3): the period's own payment stays the one a refund must match. */
  await leg("S26", async () => {
    const setup = async () => {
      const w = world(K);
      const p = await buy(w, [[PRICE.leadYear, 1], [PRICE.deskYear, 5]]);
      const id = (w.paidOf(p.buyer.person)[0] || {}).id;
      p.sub.items = subItems([[PRICE.leadYear, 1], [PRICE.deskYear, 8]]);
      const rise = invoice(w, p.sub, T0 + 365 * DAY, "subscription_update"), re = event("invoice.paid", rise.id); await w.post(re);
      return { w, p, id, rise, risen: (w.licence(id) || {}).seats, applied: w.outcome(re) };
    };
    const refund = async (w, inv) => { const ch = w.stripe.charges.get(inv._charge); ch.refunded = true; ch.amount_refunded = ch.amount; const e = event("charge.refunded", ch.id); await w.post(e); return w.outcome(e); };
    const a = await setup();
    const ra = await refund(a.w, a.p.inv);
    const la = a.w.licence(a.id) || {};
    ck(a.applied === "applied" && a.risen === 8 && ra === "refund-part" && la.refunded === 0 && la.seats === 3,
      "S26a after a rise in the same period (5 to 8), a full refund of the period's own payment takes off the period's 5 and keeps the 3 the rise paid for, listed \"refund-part\": "
      + JSON.stringify({ rise: a.risen, refund: ra, seats: la.seats, refunded: la.refunded }));
    const b = await setup();
    const rb = await refund(b.w, b.rise);
    const lb = b.w.licence(b.id) || {};
    ck(rb === "refund-part" && lb.refunded === 0 && lb.seats === 5,
      "S26b a full refund of the rise alone, the period's payment intact, never ends the licence and takes off the rise's 3: " + JSON.stringify({ refund: rb, refunded: lb.refunded, seats: lb.seats }));
  });

  /* THE DEPLOYMENT'S MODE (Grok's review 6, finding 7): an event, or an object read back, of the other mode changes nothing. */
  await leg("S27", async () => {
    const w = world(K);
    const buyer = w.person();
    const c = checkout(w, buyer.code, [[PRICE.deskYear, 2]]);
    const live = Object.assign(event("checkout.session.completed", c.session.id), { livemode: true }), rl = await w.post(live);
    ck(rl.status === 200 && w.outcome(live) === "held:livemode" && rl.api === 0 && !w.db.raw.prepare("SELECT 1 FROM pay_binds WHERE sub = ?").get(c.sub.id),
      "S27a a live event at a test deployment is held \"livemode\" before any read, binding nothing: " + w.outcome(live) + " " + rl.api);
    const outs = [];
    c.session.livemode = true; const sb = event("checkout.session.completed", c.session.id); await w.post(sb); outs.push("session:" + w.outcome(sb));
    c.session.livemode = false; await w.post(event("checkout.session.completed", c.session.id));
    c.inv.livemode = true; const ip = event("invoice.paid", c.inv.id); await w.post(ip); outs.push("invoice:" + w.outcome(ip));
    const d = await buy(w, [[PRICE.deskYear, 1]]);
    const dch = w.stripe.charges.get(d.inv._charge); dch.refunded = true; dch.amount_refunded = dch.amount; dch.livemode = true;
    const dr = event("charge.refunded", dch.id); await w.post(dr); outs.push("charge:" + w.outcome(dr));
    ck(outs.join() === "session:held:livemode,invoice:held:livemode,charge:held:livemode" && w.paidOf(buyer.person).length === 0 && (w.paidOf(d.buyer.person)[0] || {}).refunded === 0,
      "S27b a Checkout Session, an invoice or a charge read back live at a test deployment is held \"livemode\", changing nothing: " + outs.join(", "));
  });

  /* Review 44, finding 8: a paid invoice whose subscription is already canceled is still applied with status = 'canceled'. */
  await leg("S28", async () => {
    const w = world(K);
    const p = await buy(w, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 2]], { ends: T0 + 30 * DAY });
    const id = (w.paidOf(p.buyer.person)[0] || {}).id;
    const ren = invoice(w, p.sub, T0 + 60 * DAY, "subscription_cycle");
    p.sub.status = "canceled";
    const eRen = event("invoice.paid", ren.id);
    const rRen = await w.post(eRen);
    const lic = w.licence(id) || {};
    const subRow = w.db.raw.prepare("SELECT status FROM pay_subs WHERE sub = ?").get(p.sub.id) || {};
    const b2 = w.person();
    const c2 = checkout(w, b2.code, [[PRICE.deskYear, 2]]);
    c2.sub.status = "canceled";
    await w.post(event("checkout.session.completed", c2.session.id));
    const e2 = event("invoice.paid", c2.inv.id);
    await w.post(e2);
    const lic2 = w.paidOf(b2.person)[0] || {};
    const subRow2 = w.db.raw.prepare("SELECT status FROM pay_subs WHERE sub = ?").get(c2.sub.id) || {};
    ck(rRen.status === 200 && w.outcome(eRen) === "applied" && lic.paid_until === T0 + 60 * DAY + GRACE && subRow.status === "canceled"
      && w.outcome(e2) === "applied" && lic2.seats === 2 && subRow2.status === "canceled",
      "S28a a paid renewal or first invoice whose subscription is already canceled still applies and records status 'canceled': "
      + JSON.stringify({ ren: [rRen.status, w.outcome(eRen), lic.paid_until === T0 + 60 * DAY + GRACE, subRow.status], first: [w.outcome(e2), lic2.seats, subRow2.status] }));
  });

  /* Review 4, finding 5: two rises of one period, the larger delivered first. The subscription's items stay at 1 lead and 5 desks.
     The later invoice bills 5 desks and lands; the earlier one bills 3 and must not lower them. A rise in the current period is not
     an earlier period, so the first of the two still adds. */
  await leg("S33", async () => {
    const w = world(K);
    const e1 = T0 + 30 * DAY;
    const p = await buy(w, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 2]], { ends: e1 });
    const id = w.paidOf(p.buyer.person)[0].id;
    p.sub.items = subItems([[PRICE.leadMonth, 1], [PRICE.deskMonth, 5]]);
    const up = invoice(w, p.sub, e1, "subscription_update");
    const desk = up.lines.data.find(l => l.pricing.price_details.price === PRICE.deskMonth);
    up.lines.data = [
      Object.assign({}, desk, { id: sid("il"), quantity: 3, amount: -300 }),
      Object.assign({}, desk, { id: sid("il"), quantity: 5, amount: 500 }),
    ];
    const evUp = event("invoice.paid", up.id);
    const rUp = await w.post(evUp);
    const risen = w.licence(id);
    const late = invoice(w, p.sub, e1, "subscription_update");
    late.lines.data = [
      Object.assign({}, desk, { id: sid("il"), quantity: 2, amount: -200 }),
      Object.assign({}, desk, { id: sid("il"), quantity: 3, amount: 300 }),
    ];
    const evLate = event("invoice.paid", late.id);
    const rLate = await w.post(evLate);
    const after = w.licence(id);
    const row = w.db.raw.prepare("SELECT lead_seats, seats, paid_until FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(p.sub.id);
    ck(rUp.status === 200 && w.outcome(evUp) === "applied" && risen.lead_seats === 1 && risen.seats === 5
      && rLate.status === 200 && w.outcome(evLate) === "applied"
      && after.lead_seats === 1 && after.seats === 5 && after.paid_until === e1 + GRACE
      && row.lead_seats === 1 && row.seats === 5 && row.paid_until === e1 + GRACE,
      "S33a an earlier rise delivered after a later one has raised the desks writes no seat and shortens no date: "
      + JSON.stringify({ later: [w.outcome(evUp), risen.lead_seats, risen.seats], early: [w.outcome(evLate), after.lead_seats, after.seats, row.lead_seats, row.seats, (after.paid_until - T0) / DAY] }));
  });

  /* Review 4, finding 6: a same-period invoice that bills fewer desks than the period already holds writes no seat. The next
     period's invoice, carrying the lower count, takes it. */
  await leg("S34", async () => {
    const w = world(K);
    const e1 = T0 + 30 * DAY, e2 = T0 + 60 * DAY;
    const p = await buy(w, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 5]], { ends: e1 });
    const id = w.paidOf(p.buyer.person)[0].id;
    p.sub.items = subItems([[PRICE.leadMonth, 1], [PRICE.deskMonth, 1]]);
    const red = invoice(w, p.sub, e1, "subscription_update");
    const desk = red.lines.data.find(l => l.pricing.price_details.price === PRICE.deskMonth);
    red.lines.data = [
      Object.assign({}, desk, { id: sid("il"), quantity: 5, amount: -500 }),
      Object.assign({}, desk, { id: sid("il"), quantity: 1, amount: 100 }),
    ];
    const evRed = event("invoice.paid", red.id);
    const rRed = await w.post(evRed);
    const kept = w.licence(id);
    const row = w.db.raw.prepare("SELECT lead_seats, seats, paid_until FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(p.sub.id);
    const ren = invoice(w, p.sub, e2, "subscription_cycle");
    const evRen = event("invoice.paid", ren.id);
    const rRen = await w.post(evRen);
    const after = w.licence(id);
    const rowRen = w.db.raw.prepare("SELECT lead_seats, seats, paid_until FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(p.sub.id);
    ck(rRed.status === 200 && w.outcome(evRed) === "applied" && kept.lead_seats === 1 && kept.seats === 5 && kept.paid_until === e1 + GRACE
      && row.lead_seats === 1 && row.seats === 5 && row.paid_until === e1 + GRACE
      && rRen.status === 200 && w.outcome(evRen) === "applied" && after.lead_seats === 1 && after.seats === 1 && after.paid_until === e2 + GRACE
      && rowRen.lead_seats === 1 && rowRen.seats === 1 && rowRen.paid_until === e2 + GRACE,
      "S34a a same-period reduction from 5 desks to 1 keeps the desks already paid, and the next period's invoice takes the lower count: "
      + JSON.stringify({ mid: [w.outcome(evRed), kept.lead_seats, kept.seats, row.lead_seats, row.seats], ren: [w.outcome(evRen), after.lead_seats, after.seats, rowRen.lead_seats, rowRen.seats] }));
  });

  /* Review 4, finding 8. Two subscriptions, one refunded (the licence stays, the other still pays). A rise for the refunded
     subscription, delivered after the refund, writes no seat and leaves that row refunded. */
  await leg("S35", async () => {
    const w = world(K);
    const buyer = w.person();
    const s1 = await buy(w, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 2]], { buyer, ends: T0 + 30 * DAY });
    /* One subscription per licence (Max, 2026-11-19): s1 is cancelled, its paid time running, before the next is bought. */
    s1.sub.status = "canceled";
    await w.post(event("customer.subscription.deleted", s1.sub.id));
    await buy(w, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 1]], { buyer, ends: T0 + 60 * DAY });
    const id = w.paidOf(buyer.person)[0].id;
    const ch = w.stripe.charges.get(s1.inv._charge);
    ch.refunded = true; ch.amount_refunded = ch.amount;
    const evRef = event("charge.refunded", ch.id);
    const rRef = await w.post(evRef);
    const afterRef = w.licence(id);
    const rowRef = w.db.raw.prepare("SELECT status, lead_seats, seats FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(s1.sub.id);
    s1.sub.items = subItems([[PRICE.leadMonth, 1], [PRICE.deskMonth, 3]]);
    const rise = invoice(w, s1.sub, T0 + 30 * DAY, "subscription_update");
    const desk = rise.lines.data.find(l => l.pricing.price_details.price === PRICE.deskMonth);
    rise.lines.data = [Object.assign({}, desk, { id: sid("il"), quantity: 3, amount: 200 })];
    const evRise = event("invoice.paid", rise.id);
    const rRise = await w.post(evRise);
    const after = w.licence(id);
    const row = w.db.raw.prepare("SELECT status, lead_seats, seats FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(s1.sub.id);
    ck(rRef.status === 200 && w.outcome(evRef) === "refund-one-source" && afterRef.refunded === 0 && afterRef.lead_seats === 1 && afterRef.seats === 1
      && rowRef.status === "refunded" && rowRef.lead_seats === 0 && rowRef.seats === 0
      && rRise.status === 200 && w.outcome(evRise) === "held:refunded-subscription"
      && after.refunded === 0 && after.lead_seats === 1 && after.seats === 1 && after.paid_until === afterRef.paid_until
      && row.status === "refunded" && row.lead_seats === 0 && row.seats === 0,
      "S35a a rise for a subscription already refunded, beside one still paying, restores nothing and leaves that row refunded: "
      + JSON.stringify({ ref: [w.outcome(evRef), afterRef.lead_seats, afterRef.seats, rowRef], rise: [w.outcome(evRise), after.lead_seats, after.seats, row] }));
  });

  /* ONE SUBSCRIPTION PER LICENCE (Max, 2026-11-19 03:46: "Yes, one subscription per licence."): a Checkout Session binding a second
     subscription for a licence that already has one live is bound, as any is, and its first invoice is held "second-subscription"; more
     seats as a change of quantity on the one subscription apply. */
  await leg("S32", async () => {
    const w = world(K);
    const buyer = w.person();
    const s1 = await buy(w, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]], { buyer });
    const id = w.paidOf(buyer.person)[0].id;
    const orders = w.count("orders"), paidUntil = w.licence(id).paid_until;
    const s2 = await buy(w, [[PRICE.deskYear, 3]], { buyer, ends: T0 + 400 * DAY });
    const held = w.licence(id);
    ck(s2.b.status === 200 && s2.r.status === 200 && w.outcome(s2.e) === "held:second-subscription" && held.seats === 2 && held.lead_seats === 1 && held.paid_until === paidUntil
      && w.count("pay_subs") === 1 && w.count("orders") === orders && w.paidOf(buyer.person).length === 1,
      "S32a a second subscription's first invoice for a licence with a live one is held \"second-subscription\": the seats, the date, the orders and pay_subs as they were: "
      + JSON.stringify({ outcome: w.outcome(s2.e), seats: held.seats, subs: w.count("pay_subs"), orders: w.count("orders") - orders }));
    s1.sub.items = subItems([[PRICE.leadYear, 1], [PRICE.deskYear, 5]]);
    const rise = invoice(w, s1.sub, T0 + 365 * DAY, "subscription_update");
    const eR = event("invoice.paid", rise.id);
    const rR = await w.post(eR);
    const risen = w.licence(id);
    ck(rR.status === 200 && w.outcome(eR) === "applied" && risen.seats === 5 && risen.lead_seats === 1 && w.count("pay_subs") === 1,
      "S32b control: more desks as a change of quantity on the one subscription apply, and the licence still has one subscription: "
      + JSON.stringify({ outcome: w.outcome(eR), seats: risen.seats, subs: w.count("pay_subs") }));
  });

  /* Only a PAYING subscription blocks a second (Claude alpha, 2026-11-19: "only a subscription that is PAYING blocks a second, that is
     active or trialing"): a customer whose card failed, and who buys afresh, gets the seats they just paid for. One check per Stripe status
     that is not paying. */
  await leg("S36", async () => {
    const statusOf = (w, sub) => (w.db.raw.prepare("SELECT status FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(sub) || {}).status;
    for (const [tag, st] of [["S36a", "past_due"], ["S36b", "unpaid"], ["S36c", "paused"], ["S36d", "incomplete_expired"]]) {
      const w = world(K);
      const buyer = w.person();
      const s1 = await buy(w, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]], { buyer });
      const id = w.paidOf(buyer.person)[0].id;
      s1.sub.status = st;
      await w.post(event("customer.subscription.updated", s1.sub.id));
      const recorded = statusOf(w, s1.sub.id), orders = w.count("orders");
      const s2 = await buy(w, [[PRICE.deskYear, 3]], { buyer, ends: T0 + 400 * DAY });
      const bought = w.licence(id);
      ck(recorded === st && w.outcome(s2.e) === "applied" && bought.seats === 5 && bought.lead_seats === 1 && w.count("pay_subs") === 2 && w.count("orders") === orders + 1,
        tag + " a first invoice for a licence whose only other subscription is " + st + " is applied, the seats paid for added: "
        + JSON.stringify({ recorded, outcome: w.outcome(s2.e), seats: bought.seats, subs: w.count("pay_subs"), orders: w.count("orders") - orders }));
    }
    /* The old one recovers while the new one is live: its notice is the second live subscription, held, no seat changed, listed. */
    const w = world(K);
    const buyer = w.person();
    const s1 = await buy(w, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]], { buyer });
    const id = w.paidOf(buyer.person)[0].id;
    s1.sub.status = "past_due";
    await w.post(event("customer.subscription.updated", s1.sub.id));
    const s2 = await buy(w, [[PRICE.deskYear, 3]], { buyer, ends: T0 + 400 * DAY });
    const live = w.licence(id), rowOld = () => w.db.raw.prepare("SELECT lead_seats, seats, paid_until, status FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(s1.sub.id) || {};
    const rowBefore = rowOld(), orders = w.count("orders");
    s1.sub.status = "active";
    const back = invoice(w, s1.sub, T0 + 730 * DAY, "subscription_cycle");
    const eb = event("invoice.paid", back.id), rb = await w.post(eb);
    const after = w.licence(id), rowAfter = rowOld();
    ck(w.outcome(s2.e) === "applied" && rb.status === 200 && w.outcome(eb) === "held:second-subscription" && after.seats === live.seats && after.lead_seats === live.lead_seats
      && after.paid_until === live.paid_until && JSON.stringify(rowAfter) === JSON.stringify(rowBefore) && w.count("orders") === orders && w.count("pay_subs") === 2,
      "S36e the old subscription recovering its payment while the new one is live is held \"second-subscription\", listed, and changes no seat, date or row: "
      + JSON.stringify({ outcome: w.outcome(eb), seats: [live.seats, after.seats], until: [live.paid_until, after.paid_until], row: [rowBefore, rowAfter], orders: w.count("orders") - orders }));
  });

  /* WHAT A BUYER'S OWN PROGRAMS ARE TOLD OF THEIR PAYMENTS (board 1020, the cut's service gaps): an owner who already pays is told so
     at every sign-in and quiet check, with the provider's portal where more seats are added as a change of quantity on the one
     subscription, which lands on the same licence as a renewal's seats do and seats nobody; a payment the service holds, or a checkout
     whose money has not arrived, is one held entry with its kind, gone once Max refunds it. The identifier stays the sign-in code. */
  await leg("BY", async () => {
    const google = JSON.stringify([{ id: "google", clientId: GOOGLE_CLIENT }]);
    const keysOf = b => (b ? ["pays", "held"].filter(k => Object.prototype.hasOwnProperty.call(b, k)) : ["no body"]);
    const kinds = b => (b && Array.isArray(b.held) ? b.held.map(h => h.kind + ":" + h.provider).join(",") : "");
    const w = world(K, { env: { PROVIDERS: google, STRIPE_PORTAL: PORTAL } });
    const owner = await signinS(w, "BY-lead1", "acme.example");
    const desk = edKey();
    const d0 = await deskSigninS(w, "BY-lead1", "acme.example", desk);
    const c0 = await quietCheckS(w, owner.lead);
    ck(owner.status === 200 && d0.status === 200 && c0.status === 200 && keysOf(owner.body).length === 0 && keysOf(d0.body).length === 0 && keysOf(c0.body).length === 0,
      "BY1 control: a person who has paid nothing is told nothing of payments at Studio's sign-in, its quiet check or the desk's sign-in: "
      + JSON.stringify([owner.status, d0.status, c0.status, keysOf(owner.body), keysOf(d0.body), keysOf(c0.body)]));
    const buyer = { code: owner.code, person: owner.person };
    const first = checkout(w, buyer.code, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]]);
    await w.post(event("checkout.session.completed", first.session.id));
    const p1 = await quietCheckS(w, owner.lead);
    ck(kinds(p1.body) === "pending:stripe" && p1.body.held[0].at === w.clock.now && !keysOf(p1.body).includes("pays"),
      "BY2 a checkout bound to the buyer whose first invoice has not been paid is one held entry of kind \"pending\", and no \"already pays\": "
      + JSON.stringify(p1.body && { held: p1.body.held, pays: p1.body.pays }));
    const e1 = event("invoice.paid", first.inv.id);
    await w.post(e1);
    const id = (w.paidOf(buyer.person)[0] || {}).id;
    const p2 = await quietCheckS(w, owner.lead), s2 = await renewOwnerS(w, "BY-lead1", "acme.example", owner.lead), d2 = await deskSigninS(w, "BY-lead1", "acme.example", desk);
    const paysTeam = b => !!b && !!b.pays && !!b.pays.team && b.pays.team.provider === "stripe" && b.pays.team.portal === PORTAL && !b.pays.deskOnly && !keysOf(b).includes("held");
    ck(w.outcome(e1) === "applied" && paysTeam(p2.body) && paysTeam(s2.body) && paysTeam(d2.body),
      "BY3 once the first invoice applies the pending entry is gone, and the owner is told they already pay, with Stripe's portal, at the quiet check, Studio's sign-in and the desk's: "
      + JSON.stringify([p2.body && p2.body.pays, s2.body && s2.body.pays, d2.body && d2.body.pays, kinds(p2.body)]));
    const lic0 = w.licence(id), seatRows = w.count("seats");
    const again = await buy(w, [[PRICE.deskYear, 3]], { buyer, ends: T0 + 400 * DAY });
    const p3 = await quietCheckS(w, owner.lead);
    ck(w.outcome(again.e) === "held:second-subscription" && kinds(p3.body) === "already-pays:stripe" && p3.body.held[0].at === w.clock.now && paysTeam(Object.fromEntries(Object.entries(p3.body).filter(([k]) => k !== "held")))
      && w.paidOf(buyer.person).length === 1 && w.licence(id).seats === lic0.seats,
      "BY4 an owner who already pays and buys again through a second link gets no second licence; the purchase is held and their programs read one held entry of kind \"already-pays\": "
      + JSON.stringify({ outcome: w.outcome(again.e), held: p3.body && p3.body.held, licences: w.paidOf(buyer.person).length, seats: w.licence(id).seats }));
    first.sub.items = subItems([[PRICE.leadYear, 1], [PRICE.deskYear, 6]]);
    const rise = invoice(w, first.sub, T0 + 365 * DAY, "subscription_update");
    const eR = event("invoice.paid", rise.id);
    await w.post(eR);
    const risen = w.licence(id), own = w.paidOf(buyer.person);
    const subsOn = w.db.raw.prepare("SELECT COUNT(*) AS n FROM pay_subs WHERE licence = ?").get(id).n;
    ck(w.outcome(eR) === "applied" && own.length === 1 && own[0].id === id && risen.seats === 6 && risen.lead_seats === 1 && risen.paid_until === lic0.paid_until && subsOn === 1 && w.count("seats") === seatRows,
      "BY5 a paid change of quantity on the one subscription (what the portal raises when it invoices prorations at once; here an invoice made by hand, not the portal), lands on the same licence as a renewal's seats do, its date as it was, and seats nobody: "
      + JSON.stringify({ outcome: w.outcome(eR), licences: own.map(l => l.id), seats: [lic0.seats, risen.seats], subsOn, seatRows: [seatRows, w.count("seats")] }));
    const ch = w.stripe.charges.get(again.inv._charge);
    ch.refunded = true; ch.amount_refunded = ch.amount;
    w.clock.now += HOUR;
    await w.post(event("charge.refunded", ch.id));
    const p4 = await quietCheckS(w, owner.lead);
    ck(!keysOf(p4.body).includes("held") && paysTeam(p4.body),
      "BY6 Max's refund of the held purchase at Stripe takes its entry off; the owner is still told they already pay: " + JSON.stringify(p4.body && { held: p4.body.held, pays: p4.body.pays }));
    /* The person a held payment names goes with their erasure (erase.mjs, the route's and the hand script's one list). */
    const named = () => w.db.raw.prepare("SELECT COUNT(*) AS n FROM pay_events WHERE person = ?").get(buyer.person).n;
    const before = named();
    const list = K.erase.eraseStatements({ person: q => q(buyer.person), until: w.clock.now + 30 * DAY, now: w.clock.now });
    await w.db.batch(list.map(s => w.db.prepare(s.sql).bind(...s.values)));
    ck(before === 1 && named() === 0, "BY7 the held payment named its buyer, and erasing them leaves no payment event naming them: " + JSON.stringify([before, named()]));

    /* A hold of any other kind is "review"; a one-person licence is told apart from a team's. */
    const w2 = world(K, { env: { PROVIDERS: google, STRIPE_PORTAL: PORTAL } });
    const mixedBy = await signinS(w2, "BY-lead2", "acme.example");
    const mixed = await buy(w2, [[PRICE.oneYear, 1], [PRICE.leadYear, 1]], { buyer: mixedBy });
    const m1 = await quietCheckS(w2, mixedBy.lead);
    ck(w2.outcome(mixed.e) === "held:mixed" && kinds(m1.body) === "review:stripe" && !keysOf(m1.body).includes("pays"),
      "BY8 a held payment of a kind the buyer cannot act on (here \"mixed\") is one entry of kind \"review\", and no \"already pays\": " + JSON.stringify([w2.outcome(mixed.e), m1.body && m1.body.held]));
    /* Max applying that hold by hand (attach-seats.mjs --pay-provider stripe) settles it as his refund does. */
    w2.clock.now += HOUR;
    const madeBy = await w2.AT.makeAttachSql({ owner: mixedBy.code, org: "Bought through Stripe", personal: true, leadSeats: 1, seats: 1, order: "INV-BY11",
      payPeriodEnd: new Date(T0 + 365 * DAY).toISOString().slice(0, 10), payProvider: "stripe", paddleSub: mixed.sub.id, paddleTxn: mixed.inv.id, paddleBuyer: mixedBy.code }, w2.clock.now);
    w2.db.raw.exec(madeBy.sql);
    const m2 = await quietCheckS(w2, mixedBy.lead);
    ck(!keysOf(m2.body).includes("held") && !!m2.body.pays && !!m2.body.pays.team,
      "BY11 Max's attach of the held payment by hand takes its entry off, and the buyer is then told they pay: " + JSON.stringify(m2.body && { held: m2.body.held, pays: m2.body.pays }));
    const oneDesk = edKey();
    const oneD0 = await deskSigninS(w2, "BY-one", undefined, oneDesk);
    const oneCode = oneD0.body && oneD0.body.code;
    const onePerson = oneCode ? (w2.db.raw.prepare("SELECT person FROM persons WHERE code = ?").get(oneCode) || {}).person : null;
    const one = await buy(w2, [[PRICE.oneYear, 1]], { buyer: { code: oneCode, person: onePerson } });
    const oneD1 = await deskSigninS(w2, "BY-one", undefined, oneDesk);
    ck(w2.outcome(one.e) === "applied" && !!oneD1.body && !!oneD1.body.pays && !!oneD1.body.pays.deskOnly && oneD1.body.pays.deskOnly.provider === "stripe"
      && oneD1.body.pays.deskOnly.portal === PORTAL && !oneD1.body.pays.team,
      "BY9 the owner of a one-person licence a subscription pays is told so as \"deskOnly\", not \"team\": " + JSON.stringify([w2.outcome(one.e), oneD1.body && oneD1.body.pays]));

    /* The portal is the configured address only where it is Stripe's own login link of this deployment's mode. */
    const portals = [];
    for (const [tag, link] of [["unset", undefined], ["other mode", "https://billing.stripe.com/p/login/" + PORTAL.split("/test_")[1]], ["not Stripe's", "https://billing.example.com/p/login/test_" + PORTAL.split("/test_")[1]]]) {
      const w3 = world(K, { env: { PROVIDERS: google, STRIPE_PORTAL: link } });
      const o3 = await signinS(w3, "BY-lead3", "acme.example");
      await buy(w3, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]], { buyer: o3 });
      const k3 = await quietCheckS(w3, o3.lead);
      portals.push([tag, k3.body && k3.body.pays && k3.body.pays.team]);
    }
    ck(portals.every(([, t]) => !!t && t.provider === "stripe" && !Object.prototype.hasOwnProperty.call(t, "portal")),
      "BY10 with STRIPE_PORTAL unset, a link of the other mode, or a link not Stripe's, the owner is still told they pay, and no portal: " + JSON.stringify(portals));
    /* The name on a held payment's notice lasts while the buyer's programs may show it (pay.mjs HELD_SHOWN_DAYS), then the retention clears it.
       (Moved, board 1020's mend: a world of its own, since Max's attach in w2 now clears the name it attaches, BY11.) */
    const w12 = world(K, { env: { PROVIDERS: google } });
    const by12 = await signinS(w12, "BY-lead12", "acme.example");
    await buy(w12, [[PRICE.oneYear, 1], [PRICE.leadYear, 1]], { buyer: by12 });
    const namedW12 = () => w12.db.raw.prepare("SELECT COUNT(*) AS n FROM pay_events WHERE person IS NOT NULL").get().n;
    const n0 = namedW12();
    await K.core.purgeRetention(w12.db, w12.clock.now + DAY);
    const n1 = namedW12();
    await K.core.purgeRetention(w12.db, w12.clock.now + 31 * DAY);
    const n2 = namedW12();
    ck(n0 === 1 && n1 === 1 && n2 === 0 && w12.count("pay_events") > 0,
      "BY12 the retention keeps the buyer's name on a held notice a day on and clears it after thirty, the notice itself kept: " + JSON.stringify([n0, n1, n2, w12.count("pay_events")]));

    /* BOARD 1020'S MEND (the test architect's read of 23f51b9d, F1 to F6). "pays" is the hold's own condition (pay.mjs ownedPayingWhere): a
       paying subscription on a licence the person owns, not refunded and not a trial, whatever its paid date, so whatever a second purchase
       would be held "second-subscription" for is exactly what Buy is told to refuse. A price Stripe bills that the map does not name. */
    const STRAY = sid("price");
    const paysOf = b => (b && b.pays ? b.pays : null);
    const statusOf = (w, sub) => (w.db.raw.prepare("SELECT status FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(sub) || {}).status;
    /* (a) The buyer is erased (erase.mjs keeps pay_subs.person while the subscription stands) and Max names a new owner, here by hand as
       an attach naming an owner does (attach-seats.mjs's raise sets owner), who never bought the subscription. */
    const wa = world(K, { env: { PROVIDERS: google, STRIPE_PORTAL: PORTAL } });
    const ya = await signinS(wa, "BY-a-buyer", "acme.example");
    const boughtA = await buy(wa, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]], { buyer: ya });
    const licA = (wa.paidOf(ya.person)[0] || {}).id;
    const eraseA = K.erase.eraseStatements({ person: q => q(ya.person), until: wa.clock.now + 30 * DAY, now: wa.clock.now });
    await wa.db.batch(eraseA.map(s => wa.db.prepare(s.sql).bind(...s.values)));
    const za = await signinS(wa, "BY-a-owner", "acme.example");
    wa.db.raw.prepare("UPDATE licences SET owner = ? WHERE id = ?").run(za.person, licA);
    const subPersonA = (wa.db.raw.prepare("SELECT person FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(boughtA.sub.id) || {}).person;
    const ka = await quietCheckS(wa, za.lead);
    ck(wa.outcome(boughtA.e) === "applied" && subPersonA === ya.person && !!paysOf(ka.body) && !!ka.body.pays.team && ka.body.pays.team.provider === "stripe",
      "BY13 (a) a named owner who never bought the subscription, its buyer erased, is told they already pay, as the hold on their second purchase would hold it: "
      + JSON.stringify({ licence: !!licA, subPerson: subPersonA === ya.person, pays: paysOf(ka.body) }));
    /* (b) A renewal held inside readPayment (a price the map does not name), the licence past paid_until, its subscription still paying. */
    const wb = world(K, { env: { PROVIDERS: google, STRIPE_PORTAL: PORTAL } });
    const ob = await signinS(wb, "BY-b-owner", "acme.example");
    const boughtB = await buy(wb, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]], { buyer: ob });
    const licB = wb.licence((wb.paidOf(ob.person)[0] || {}).id) || {};
    boughtB.sub.items = subItems([[STRAY, 1]]);
    wb.clock.now += HOUR;
    const renB = invoice(wb, boughtB.sub, T0 + 730 * DAY, "subscription_cycle"), eRenB = event("invoice.paid", renB.id);
    await wb.post(eRenB);
    /* The year passed, as the record sees it: the licence's paid end behind the clock (with the clock moved a year on instead, this leg's sign-in
       was answered 503, not traced). */
    wb.db.raw.prepare("UPDATE licences SET paid_until = ? WHERE id = ?").run(wb.clock.now - DAY, licB.id);
    /* A lapsed seat's quiet check asks Studio to sign in again (403 "signin"), so the owner's next sign-in is what tells them. */
    const kb = await renewOwnerS(wb, "BY-b-owner", "acme.example", ob.lead);
    ck(wb.outcome(eRenB) === "held:price" && statusOf(wb, boughtB.sub.id) === "active" && !!paysOf(kb.body) && !!kb.body.pays.team,
      "BY14 (b) an owner whose licence lapsed while its subscription is still recorded as paying (a renewal held inside readPayment) is told they already pay: "
      + JSON.stringify({ renewal: wb.outcome(eRenB), status: statusOf(wb, boughtB.sub.id), answer: [kb.status, kb.body && (kb.body.reason || kb.body.ended)], pays: paysOf(kb.body) }));
    /* F2: a hold raised inside readPayment names the buyer and the subscription, so their programs read it as a hold, never as "pending". */
    const firstRow = wb.db.raw.prepare("SELECT sub, person FROM pay_events WHERE outcome = 'held:price'").get() || {};
    const wf = world(K, { env: { PROVIDERS: google } });
    const of = await signinS(wf, "BY-f2", "acme.example");
    const stray = await buy(wf, [[STRAY, 1]], { buyer: of });
    const kf = await quietCheckS(wf, of.lead);
    const strayRow = wf.db.raw.prepare("SELECT sub, person FROM pay_events WHERE outcome = 'held:price'").get() || {};
    ck(kinds(kb.body) === "review:stripe" && firstRow.sub === boughtB.sub.id && firstRow.person === ob.person
      && wf.outcome(stray.e) === "held:price" && kinds(kf.body) === "review:stripe" && strayRow.sub === stray.sub.id && strayRow.person === of.person,
      "BY15 a payment held inside readPayment (here a price the map does not name), a renewal or a first purchase, names its buyer and subscription, and the buyer reads one entry of kind \"review\", never \"pending\": "
      + JSON.stringify({ renewal: [kinds(kb.body), firstRow.sub === boughtB.sub.id, firstRow.person === ob.person], first: [wf.outcome(stray.e), kinds(kf.body), strayRow.sub === stray.sub.id, strayRow.person === of.person] }));
    /* The shared condition: over the record's cases, "pays" (team) is there exactly where the person's next purchase is held "second-subscription". */
    const agree = [];
    const nextBuy = async (tag, w, who, kb0) => {
      const k0 = kb0 || await quietCheckS(w, who.lead);
      const n = await buy(w, [[PRICE.deskYear, 3]], { buyer: { code: who.code, person: who.person }, ends: w.clock.now + 400 * DAY });
      agree.push([tag, !!(paysOf(k0.body) && paysOf(k0.body).team), w.outcome(n.e)]);
    };
    await nextBuy("a", wa, za, ka);
    await nextBuy("b", wb, ob, kb);
    for (const tag of ["none", "paying", "past_due", "canceled", "refunded"]) {
      const wc = world(K, { env: { PROVIDERS: google } });
      const oc = await signinS(wc, "BY-c-" + tag, "acme.example");
      if (tag !== "none") {
        const bc = await buy(wc, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]], { buyer: oc });
        if (tag === "past_due") { bc.sub.status = "past_due"; await wc.post(event("customer.subscription.updated", bc.sub.id)); }
        if (tag === "canceled") { bc.sub.status = "canceled"; await wc.post(event("customer.subscription.deleted", bc.sub.id)); }
        if (tag === "refunded") { const chc = wc.stripe.charges.get(bc.inv._charge); chc.refunded = true; chc.amount_refunded = chc.amount; await wc.post(event("charge.refunded", chc.id)); }
      }
      wc.clock.now += HOUR;
      await nextBuy(tag, wc, oc);
    }
    ck(agree.length === 7 && agree.every(([, pays, outcome]) => pays === (outcome === "held:second-subscription")) && agree.filter(([, pays]) => pays).length === 3,
      "BY16 over the record's cases (a named owner, a lapsed licence still paying, nobody paying, paying, past due, cancelled, refunded) \"pays\" is told exactly where the next purchase is held \"second-subscription\": "
      + JSON.stringify(agree));
    /* F3 (a): the buyer told "already pays" cancels the duplicate in the portal; no money moves, so the entry stays until Max refunds it. */
    const wd = world(K, { env: { PROVIDERS: google } });
    const od = await signinS(wd, "BY-d-owner", "acme.example");
    await buy(wd, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]], { buyer: od });
    const dup = await buy(wd, [[PRICE.deskYear, 3]], { buyer: od, ends: T0 + 400 * DAY });
    wd.clock.now += HOUR;
    dup.sub.status = "canceled";
    const eCan = event("customer.subscription.deleted", dup.sub.id);
    await wd.post(eCan);
    const kd = await quietCheckS(wd, od.lead);
    ck(wd.outcome(dup.e) === "held:second-subscription" && /^held:|^applied$/.test(String(wd.outcome(eCan))) && kinds(kd.body) === "already-pays:stripe",
      "BY17 a held second purchase whose subscription is then cancelled, no refund, is still one entry of kind \"already-pays\": "
      + JSON.stringify({ held: wd.outcome(dup.e), cancel: wd.outcome(eCan), entries: kd.body && kd.body.held }));
    /* F3 (b): an attach on the licence that did not record the held subscription (here an invoice's seats) settles nothing. A renewal held
       "kind-changed" is a hold on a subscription already known, which no attach records. */
    const we = world(K, { env: { PROVIDERS: google } });
    const oe = await signinS(we, "BY-e-owner", "acme.example");
    const boughtE = await buy(we, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]], { buyer: oe });
    const licE = (we.paidOf(oe.person)[0] || {}).id;
    boughtE.sub.items = subItems([[PRICE.oneYear, 1]]);
    we.clock.now += HOUR;
    const renE = invoice(we, boughtE.sub, T0 + 730 * DAY, "subscription_cycle"), eRenE = event("invoice.paid", renE.id);
    await we.post(eRenE);
    const ke0 = await quietCheckS(we, oe.lead);
    we.clock.now += HOUR;
    const madeE = await we.AT.makeAttachSql({ owner: oe.code, org: "Bought through Stripe", personal: true, leadSeats: 1, seats: 2, order: "INV-BY18" }, we.clock.now);
    we.db.raw.exec(madeE.sql);
    const orderE = we.db.raw.prepare("SELECT licence FROM orders WHERE tag LIKE 'attach:%' ORDER BY at DESC LIMIT 1").get() || {};
    const ke1 = await quietCheckS(we, oe.lead);
    ck(we.outcome(eRenE) === "held:kind-changed" && kinds(ke0.body) === "review:stripe" && orderE.licence === licE && kinds(ke1.body) === "review:stripe",
      "BY18 an attach on the same licence that did not record the held subscription (an invoice's seats) leaves the entry where it was: "
      + JSON.stringify({ renewal: we.outcome(eRenE), before: kinds(ke0.body), order: orderE.licence === licE, after: kinds(ke1.body) }));
    /* F5: the retention's other branch, a person no longer kept (gone by the orphan rule, here taken by hand), named on a held notice a day old. */
    const wg = world(K, { env: { PROVIDERS: google } });
    const og = await signinS(wg, "BY-g", "acme.example");
    await buy(wg, [[PRICE.oneYear, 1], [PRICE.leadYear, 1]], { buyer: og });
    const namedG = () => wg.db.raw.prepare("SELECT COUNT(*) AS n FROM pay_events WHERE person IS NOT NULL").get().n;
    const g0 = namedG();
    wg.db.raw.prepare("DELETE FROM persons WHERE person = ?").run(og.person);
    await K.core.purgeRetention(wg.db, wg.clock.now + DAY);
    ck(g0 === 1 && namedG() === 0 && wg.count("pay_events") > 0,
      "BY19 the retention clears the name on a held notice inside the thirty days where that person is no longer kept, the notice itself kept: " + JSON.stringify([g0, namedG(), wg.count("pay_events")]));
  });

  await leg("T", async () => {
    const w = world(K);
    const de = await buy(w, [[PRICE.deskYear, 2]], { billing: "DE", card: "DE" });
    ck(w.outcome(de.e) === "country:DE/DE" && w.paidOf(de.buyer.person)[0].seats === 2,
      "T1 a direct-link first payment from a billing country other than PL is applied and listed: " + w.outcome(de.e));
    const lt = await buy(w, [[PRICE.deskYear, 2]], { billing: "PL", card: "LT" });
    ck(w.outcome(lt.e) === "applied" && w.paidOf(lt.buyer.person).length === 1, "T2 a Polish billing address with a Lithuanian card is applied and not listed: " + w.outcome(lt.e));
    const before = w.stripe.seen.length;
    const mp = await buy(w, [[PRICE.deskYear, 2]], { billing: "DE", card: "DE", managed: true });
    const pmReads = w.stripe.seen.slice(before).filter(u => /payment_methods|payment_intents/.test(u)).length;
    const bound = w.db.raw.prepare("SELECT managed FROM pay_binds WHERE provider = 'stripe' AND sub = ?").get(mp.sub.id) || {};
    ck(w.outcome(mp.e) === "applied" && pmReads === 0 && bound.managed === 1 && w.paidOf(mp.buyer.person).length === 1,
      "T3 a Managed Payments sale (the link's flag, read from its session) is never checked: applied, no payment method read: " + w.outcome(mp.e) + " " + pmReads);
  });

  await leg("U", async () => {
    const w = world(K);
    const bindOf = p => w.db.raw.prepare("SELECT org FROM pay_binds WHERE provider = 'stripe' AND sub = ?").get(p.sub.id);
    const nameOf = p => (w.paidOf(p.buyer.person)[0] || {}).org;
    const team = [[PRICE.leadYear, 1], [PRICE.deskYear, 2]];
    const typed = "Acme Tools Sp. z o.o.";
    const u1 = await buy(w, team, { org: typed });
    ck(nameOf(u1) === typed && w.outcome(u1.be) === "bound" && (bindOf(u1) || {}).org === typed,
      "U1 a name typed in the link's \"org\" field names the team's new licence: " + JSON.stringify({ name: nameOf(u1), bound: w.outcome(u1.be) }));
    const empty = await buy(w, team, { org: "   " }), absent = await buy(w, team), abroad = await buy(w, team, { org: "", managed: true, billing: "DE" });
    ck(nameOf(empty) === "Organizacja" && nameOf(absent) === "Organizacja" && nameOf(abroad) === "Organisation"
      && [empty, absent, abroad].every(p => w.outcome(p.be) === "bound"),
      "U2 none typed, or only spaces: the copywriter's default, \"Organizacja\" from a Polish direct link, \"Organisation\" from a Managed Payments one: "
      + [nameOf(empty), nameOf(absent), nameOf(abroad)].join(" / "));
    const ch = code => "Acme" + String.fromCharCode(code) + "Tools";
    const outs = [];
    for (const [label, value, managed] of [["101 characters", "A".repeat(101), false], ["a C0 control", ch(0x07), false], ["DEL", ch(0x7f), false], ["a C1 control", ch(0x85), false],
        ["a bidi override", ch(0x202e), false], ["a bidi isolate", ch(0x2067), false], ["U+FEFF", ch(0xfeff), false], ["LRM", ch(0x200e), false], ["RLM", ch(0x200f), false], ["ALM", ch(0x061c), false], ["a line separator", ch(0x2028), false], ["a paragraph separator", ch(0x2029), false], ["101 abroad", "B".repeat(101), true]]) {
      const p = await buy(w, team, { org: value, managed, billing: managed ? "DE" : "PL" });
      const want = managed ? "Organisation" : "Organizacja";
      outs.push(label + ":" + nameOf(p) + ":" + w.outcome(p.be) + (nameOf(p) === want && w.outcome(p.be) === "org-name" && w.outcome(p.e) !== undefined && !/^held/.test(w.outcome(p.e)) ? "" : " (wrong)"));
    }
    const hundred = await buy(w, team, { org: "C".repeat(100) });
    ck(outs.every(o => !/wrong/.test(o)) && nameOf(hundred) === "C".repeat(100),
      "U3 a name outside the bound (over 100 characters, a C0 or C1 control, DEL, a bidi override or isolate, U+FEFF, LRM, RLM, ALM, a line or paragraph separator) takes the default, applied and listed"
      + " \"org-name\", never held; exactly 100 is kept: " + outs.join(", "));
    const second = await buy(w, [[PRICE.deskYear, 1]], { buyer: u1.buyer, org: "Another Name Ltd" });
    ck(w.outcome(second.e) === "held:second-subscription" && nameOf(u1) === typed && w.paidOf(u1.buyer.person).length === 1,
      "U4 a second subscription for a licence with a live one is held, and the licence keeps its name, whatever the second purchase typed: " + nameOf(u1));
    const one = await buy(w, [[PRICE.oneYear, 1]], { org: "Typed For One" });
    const oneLic = w.db.raw.prepare("SELECT org, desk_only FROM licences WHERE owner = ? AND desk_only = 1").get(one.buyer.person) || {};
    ck(oneLic.desk_only === 1 && oneLic.org === "Organizacja", "U5 a one-person licence ignores the field: " + JSON.stringify(oneLic));
  });

  /* Review 4, finding 9: a Stripe rise that arrives before the checkout is bound (probe H1). The rise, then the bind, then the
     first payment, then the rise again, must leave the seats a rise arriving after would have left. A rise whose checkout never
     arrives is retried while its event is inside pay.mjs UNKNOWN_RETRY_MS, then held "unbound" and listed. */
  await leg("S29", async () => {
    const windowMs = retryWindowMs();
    const shape = (w, code) => {
      const ends = T0 + 30 * DAY;
      const sub = { id: sid("sub"), object: "subscription", status: "active", livemode: false, items: subItems([[PRICE.leadMonth, 1], [PRICE.deskMonth, 2]]) };
      w.stripe.subs.set(sub.id, sub);
      const session = { id: "cs_test_" + sid("x", 40).slice(2), object: "checkout.session", livemode: false, status: "complete", mode: "subscription",
        subscription: sub.id, client_reference_id: code, managed_payments: { enabled: true } };
      w.stripe.sessions.set(session.id, session);
      const first = invoice(w, sub, ends, "subscription_create");
      sub.items = subItems([[PRICE.leadMonth, 2], [PRICE.deskMonth, 5]]);
      const rise = invoice(w, sub, ends, "subscription_update");
      return { sub, session, first, rise, ends };
    };
    const seatsOf = (w, buyer, sub) => {
      const lic = w.paidOf(buyer.person)[0] || {};
      const row = w.db.raw.prepare("SELECT lead_seats, seats FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(sub.id) || {};
      return { lead: lic.lead_seats, desk: lic.seats, paid: lic.paid_until, subLead: row.lead_seats, subDesk: row.seats };
    };
    const wN = world(K);
    const bN = wN.person();
    const n = shape(wN, bN.code);
    await wN.post(event("checkout.session.completed", n.session.id));
    await wN.post(event("invoice.paid", n.first.id));
    const eRiseN = event("invoice.paid", n.rise.id);
    await wN.post(eRiseN);
    const after = seatsOf(wN, bN, n.sub);
    const w = world(K);
    const b = w.person();
    const c = shape(w, b.code);
    const eRise = event("invoice.paid", c.rise.id);
    const early = await w.post(eRise);
    const earlyOut = w.outcome(eRise);
    await w.post(event("checkout.session.completed", c.session.id));
    await w.post(event("invoice.paid", c.first.id));
    const again = await w.post(eRise, { noAudit: true });
    const got = seatsOf(w, b, c.sub);
    ck(after.lead === 2 && after.desk === 5 && wN.outcome(eRiseN) === "applied"
      && again.status === 200 && w.outcome(eRise) === "applied"
      && got.lead === after.lead && got.desk === after.desk && got.paid === after.paid
      && got.subLead === after.subLead && got.subDesk === after.subDesk,
      "S29a a rise posted before its checkout is bound, then the bind, the first payment and the rise again, leaves the seats a rise"
      + " that arrived after would have left: " + JSON.stringify({ early: [early.status, earlyOut === undefined ? null : earlyOut], again: [again.status, w.outcome(eRise)], after, got }));

    const w2 = world(K);
    const b2 = w2.person();
    const u = shape(w2, b2.code);
    const occurred = T0;
    const eU = event("invoice.paid", u.rise.id);
    eU.created = Math.floor(occurred / 1000);
    w2.clock.now = occurred + windowMs - 1000;
    const young = await w2.post(eU);
    const youngOut = w2.outcome(eU);
    const before = { lic: w2.count("licences"), subs: w2.count("pay_subs"), binds: w2.count("pay_binds"), orders: w2.count("orders"), events: w2.count("pay_events") };
    w2.clock.now = occurred + windowMs;
    const old = await w2.post(eU, { noAudit: true });
    const wrote = { lic: w2.count("licences"), subs: w2.count("pay_subs"), binds: w2.count("pay_binds"), orders: w2.count("orders"), events: w2.count("pay_events") };
    ck(young.status === 500 && youngOut === undefined
      && old.status === 200 && w2.outcome(eU) === "held:unbound"
      && wrote.lic === before.lic && wrote.subs === before.subs && wrote.binds === before.binds && wrote.orders === before.orders
      && wrote.events === before.events + 1 && w2.paidOf(b2.person).length === 0,
      "S29b a rise whose checkout is never bound is retried while its event is inside UNKNOWN_RETRY_MS (" + windowMs
      + " ms, read from pay.mjs) and, once that old, is held \"unbound\" and listed, with no licence: "
      + JSON.stringify({ young: [young.status, youngOut === undefined ? null : youngOut], old: [old.status, w2.outcome(eU)], before, wrote }));
  });

  /* Seats follow what was paid, whatever order the events arrive in (register 47.10, 48.7). */
  await leg("S37", async () => {
    const windowMs = retryWindowMs();
    const shape = (w, code) => {
      const sub = { id: sid("sub"), object: "subscription", status: "active", livemode: false, items: subItems([[PRICE.leadMonth, 1], [PRICE.deskMonth, 2]]) };
      w.stripe.subs.set(sub.id, sub);
      const session = { id: "cs_test_" + sid("x", 40).slice(2), object: "checkout.session", livemode: false, status: "complete", mode: "subscription",
        subscription: sub.id, client_reference_id: code, managed_payments: { enabled: true } };
      w.stripe.sessions.set(session.id, session);
      const first = invoice(w, sub, T0 + 30 * DAY, "subscription_create");
      const ren = invoice(w, sub, T0 + 60 * DAY, "subscription_cycle");
      return { sub, session, first, ren };
    };
    const stateOf = (w, buyer) => {
      const lic = w.paidOf(buyer.person)[0] || {};
      return { lead: lic.lead_seats, desk: lic.seats, paid: lic.paid_until };
    };
    const wN = world(K), bN = wN.person(), n = shape(wN, bN.code);
    await wN.post(event("checkout.session.completed", n.session.id));
    await wN.post(event("invoice.paid", n.first.id));
    const eN = event("invoice.paid", n.ren.id);
    await wN.post(eN);
    const after = stateOf(wN, bN);
    const w = world(K), b = w.person(), c = shape(w, b.code);
    const eR = event("invoice.paid", c.ren.id);
    const early = await w.post(eR);
    await w.post(event("checkout.session.completed", c.session.id));
    await w.post(event("invoice.paid", c.first.id));
    const again = await w.post(eR, { noAudit: true });
    const got = stateOf(w, b);
    ck(after.paid > T0 + 60 * DAY && wN.outcome(eN) === "applied" && early.status === 500 && again.status === 200 && w.outcome(eR) === "applied"
      && got.lead === after.lead && got.desk === after.desk && got.paid === after.paid,
      "S37a a renewal posted before its checkout is bound is retried, not dropped, and once the bind and the first payment land it applies as one posted after would have: "
      + JSON.stringify({ early: early.status, again: [again.status, w.outcome(eR)], after, got }));
    const w2 = world(K), b2 = w2.person(), u = shape(w2, b2.code);
    const eU = event("invoice.paid", u.ren.id);
    w2.clock.now = T0 + windowMs - 1000;
    const young = await w2.post(eU);
    w2.clock.now = T0 + windowMs;
    const old = await w2.post(eU, { noAudit: true });
    ck(young.status === 500 && old.status === 200 && w2.outcome(eU) === "held:unbound" && w2.paidOf(b2.person).length === 0,
      "S37b a renewal whose checkout is never bound is retried while its event is inside UNKNOWN_RETRY_MS (" + windowMs + " ms), then held \"unbound\" and listed, with no licence: "
      + JSON.stringify({ young: young.status, old: [old.status, w2.outcome(eU)] }));
  });

  await leg("S38", async () => {
    /* One subscription, two rises, the later invoice first: the delayed earlier one never lowers what the later one set. */
    const w = world(K);
    const p = await buy(w, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 2]], { ends: T0 + 30 * DAY });
    p.sub.items = subItems([[PRICE.leadMonth, 1], [PRICE.deskMonth, 3]]);
    const r1 = invoice(w, p.sub, T0 + 30 * DAY, "subscription_update");
    p.sub.items = subItems([[PRICE.leadMonth, 1], [PRICE.deskMonth, 5]]);
    const r2 = invoice(w, p.sub, T0 + 30 * DAY, "subscription_update");
    const e2 = event("invoice.paid", r2.id), e1 = event("invoice.paid", r1.id);
    await w.post(e2);
    const mid = w.paidOf(p.buyer.person)[0] || {};
    const late = await w.post(e1);
    const lic = w.paidOf(p.buyer.person)[0] || {};
    const row = w.db.raw.prepare("SELECT lead_seats, seats FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(p.sub.id) || {};
    ck(mid.seats === 5 && late.status === 200 && lic.seats === 5 && lic.lead_seats === 1 && row.seats === 5,
      "S38a a delayed earlier rise (3 desks), arriving after a later one that made it 5, leaves 5 desks on the licence and the subscription: "
      + JSON.stringify({ mid: mid.seats, late: [late.status, w.outcome(e1)], desks: lic.seats, sub: row.seats }));
  });

  /* Register 48.8 (Argon review 48, finding 8; sequences A8c): an in-period update never lowers either kind below what the paid period holds;
     the reduction lands at the renewal, a rise of the other kind in the same update at once. */
  await leg("S48", async () => {
    const w = world(K);
    const e1 = T0 + 30 * DAY, e2 = T0 + 60 * DAY;
    const p = await buy(w, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 2]], { ends: e1 });
    const id = w.paidOf(p.buyer.person)[0].id;
    const row = () => w.db.raw.prepare("SELECT lead_seats, seats FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(p.sub.id);
    const lines = (inv, parts) => { inv.lines.data = parts.map(([price, quantity, amount]) => Object.assign({}, inv.lines.data[0], { id: sid("il"), quantity, amount,
      pricing: { price_details: { price } } })); };
    p.sub.items = subItems([[PRICE.leadMonth, 1], [PRICE.deskMonth, 5]]);
    const up = invoice(w, p.sub, e1, "subscription_update");
    lines(up, [[PRICE.deskMonth, 2, -200], [PRICE.deskMonth, 5, 500]]);
    await w.post(event("invoice.paid", up.id));
    p.sub.items = subItems([[PRICE.leadMonth, 1], [PRICE.deskMonth, 1]]);
    const red = invoice(w, p.sub, e1, "subscription_update");
    lines(red, [[PRICE.deskMonth, 3, -300], [PRICE.deskMonth, 1, 100]]);
    const evRed = event("invoice.paid", red.id);
    const rRed = await w.post(evRed);
    const kept = w.licence(id), keptRow = row();
    ck(rRed.status === 200 && w.outcome(evRed) === "applied" && kept.lead_seats === 1 && kept.seats === 5 && keptRow.lead_seats === 1 && keptRow.seats === 5,
      "S48a a pure desk reduction (credit 3, bill 1) after a rise to 5 keeps the 5 desks on the licence and the subscription: "
      + JSON.stringify({ lic: [kept.lead_seats, kept.seats], sub: [keptRow.lead_seats, keptRow.seats] }));
    p.sub.items = subItems([[PRICE.leadMonth, 2], [PRICE.deskMonth, 1]]);
    const mix = invoice(w, p.sub, e1, "subscription_update");
    lines(mix, [[PRICE.leadMonth, 1, -500], [PRICE.leadMonth, 2, 1000], [PRICE.deskMonth, 5, -500], [PRICE.deskMonth, 1, 100]]);
    const evMix = event("invoice.paid", mix.id);
    await w.post(evMix);
    const mixed = w.licence(id), mixedRow = row();
    const ren = invoice(w, p.sub, e2, "subscription_cycle");
    const rRen = await w.post(event("invoice.paid", ren.id));
    const after = w.licence(id), afterRow = row();
    ck(w.outcome(evMix) === "applied" && mixed.lead_seats === 2 && mixed.seats === 5 && mixedRow.lead_seats === 2 && mixedRow.seats === 5
      && rRen.status === 200 && after.lead_seats === 2 && after.seats === 1 && afterRow.lead_seats === 2 && afterRow.seats === 1,
      "S48b one update raising the leads 1 to 2 and lowering the desks 5 to 1 adds the lead at once and keeps the 5 desks, and the renewal takes the 1: "
      + JSON.stringify({ mid: [mixed.lead_seats, mixed.seats, mixedRow.lead_seats, mixedRow.seats], ren: [after.lead_seats, after.seats, afterRow.lead_seats, afterRow.seats] }));
  });

  /* ---- the payments' deep review of 2026-11-22 (Grok alpha, judged by the test architect; Claudius's brief, board 1020): seats in force
     equal seats paid for, at every instant. No customer keeps seats nobody paid for, and none loses seats they did pay for. ---- */
  const subRow = (w, sub) => w.db.raw.prepare("SELECT lead_seats, seats, paid_until, status, txn FROM pay_subs WHERE provider = 'stripe' AND sub = ?").get(sub) || {};
  const inForceAt = (w, id, at) => w.db.raw.prepare("SELECT " + K.pay.inForceCol("seats", "id", String(at)) + " AS seats, "
    + K.pay.inForceCol("lead_seats", "id", String(at)) + " AS lead FROM licences WHERE id = ?").get(id) || {};
  const refundOf = async (w, inv) => {
    const ch = w.stripe.charges.get(inv._charge); ch.refunded = true; ch.amount_refunded = ch.amount;
    const e = event("charge.refunded", ch.id); await w.post(e); return w.outcome(e);
  };

  /* A1: a subscription's seats count only while it is paid; one that stopped paying, past its paid date, counts nothing, whatever another
     subscription does to the licence's date. */
  await leg("PZ1", async () => {
    const w = world(K);
    const buyer = w.person();
    const s1 = await buy(w, [[PRICE.leadYear, 2], [PRICE.deskYear, 5]], { buyer, ends: T0 + 30 * DAY });
    const id = (w.paidOf(buyer.person)[0] || {}).id;
    s1.sub.status = "past_due";
    await w.post(event("customer.subscription.updated", s1.sub.id));
    const s2 = await buy(w, [[PRICE.leadYear, 2], [PRICE.deskYear, 5]], { buyer, ends: T0 + 400 * DAY });
    const inside = inForceAt(w, id, T0 + 20 * DAY);
    w.clock.now = T0 + 50 * DAY;
    const past = inForceAt(w, id, w.clock.now);
    /* A later payment of the paying subscription settles the record: its rise notice in the same period, its quantities unchanged. */
    const rise = invoice(w, s2.sub, T0 + 400 * DAY, "subscription_update"), re = event("invoice.paid", rise.id);
    await w.post(re);
    const stored = w.licence(id) || {}, oldRow = subRow(w, s1.sub.id);
    ck(w.outcome(s2.e) === "applied" && inside.seats === 10 && inside.lead === 4 && past.seats === 5 && past.lead === 2
      && w.outcome(re) === "applied" && stored.seats === 5 && stored.lead_seats === 2 && oldRow.seats === 0 && oldRow.lead_seats === 0,
      "PZ1a a past_due subscription (5 desks, 2 leads, paid to +44d) beside a new one of 5 and 2 that carries the licence to +414d: 10 and 4 in force"
      + " while both are paid, 5 and 2 once the old one's paid date passes, and the next payment writes the record so: "
      + JSON.stringify({ second: w.outcome(s2.e), inside, past, settle: w.outcome(re), stored: [stored.seats, stored.lead_seats], oldRow: [oldRow.seats, oldRow.lead_seats] }));
    const outs = [];
    for (const st of ["unpaid", "paused", "incomplete_expired"]) {
      const v = world(K);
      const b = v.person();
      const t1 = await buy(v, [[PRICE.leadYear, 1], [PRICE.deskYear, 3]], { buyer: b, ends: T0 + 30 * DAY });
      const vid = (v.paidOf(b.person)[0] || {}).id;
      t1.sub.status = st;
      await v.post(event("customer.subscription.updated", t1.sub.id));
      await buy(v, [[PRICE.deskYear, 2]], { buyer: b, ends: T0 + 400 * DAY });
      const f = inForceAt(v, vid, T0 + 50 * DAY);
      outs.push(st + ":" + f.seats + "/" + f.lead);
    }
    ck(outs.join() === "unpaid:2/0,paused:2/0,incomplete_expired:2/0",
      "PZ1b the same for an old subscription (1 lead, 3 desks) unpaid, paused or incomplete_expired beside a paying one of 2 desks and no lead: past the old one's paid date"
      + " only the paying one's 2 desks are in force, and no lead, as no live subscription holds one: " + outs.join());
  });

  /* A2: a refund removes exactly the seats it paid for, a rise's inside the period paid as well as the period's own after a rise that moved the date. */
  await leg("PZ2", async () => {
    const w = world(K);
    const p = await buy(w, [[PRICE.leadYear, 1], [PRICE.deskYear, 5]]);
    const id = (w.paidOf(p.buyer.person)[0] || {}).id, was = w.licence(id) || {};
    p.sub.items = subItems([[PRICE.leadYear, 1], [PRICE.deskYear, 8]]);
    const rise = invoice(w, p.sub, T0 + 365 * DAY, "subscription_update"), re = event("invoice.paid", rise.id);
    await w.post(re);
    const r1 = await refundOf(w, rise);
    const a = w.licence(id) || {}, rowA = subRow(w, p.sub.id);
    ck(w.outcome(re) === "applied" && r1 === "refund-part" && a.refunded === 0 && a.seats === 5 && a.lead_seats === 1 && a.paid_until === was.paid_until
      && rowA.seats === 5 && rowA.lead_seats === 1 && rowA.status === "active",
      "PZ2a a full refund of a rise inside the period paid (5 to 8 desks) takes off exactly the 3 it bought, the licence live on the period's 5 and its date, listed \"refund-part\": "
      + JSON.stringify({ rise: w.outcome(re), refund: r1, licence: [a.seats, a.lead_seats, a.refunded, a.paid_until === was.paid_until], row: rowA }));
    const again = event("charge.refunded", rise._charge);
    await w.post(again);
    const r2 = await refundOf(w, p.inv);
    const b = w.licence(id) || {};
    ck(w.outcome(again) === "once" && r2 === "applied" && b.refunded === 1,
      "PZ2b the same rise's refund told again is \"once\"; the period's own refund then takes the last 5 and ends the sole-source licence: "
      + JSON.stringify({ again: w.outcome(again), period: r2, refunded: b.refunded }));
  });
  await leg("PZ3", async () => {
    const setup = async () => {
      const w = world(K);
      const p = await buy(w, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 5]], { ends: T0 + 30 * DAY });
      const id = (w.paidOf(p.buyer.person)[0] || {}).id;
      p.sub.items = subItems([[PRICE.leadYear, 1], [PRICE.deskYear, 8]]);
      const rise = invoice(w, p.sub, T0 + 365 * DAY, "subscription_update"), re = event("invoice.paid", rise.id);
      await w.post(re);
      return { w, p, id, rise, risen: w.licence(id) || {}, applied: w.outcome(re) };
    };
    const a = await setup();
    const ra = await refundOf(a.w, a.p.inv);
    const la = a.w.licence(a.id) || {};
    /* Moved 2026-11-22 (the test architect's read of e01e2b37, F2; Claudius: "a refund takes back exactly what the refunded payment bought
       and nothing another payment bought"): old "a full refund of the first month's payment takes off its 5, the rise's 3 kept to the rise's
       date"; new: the yearly payment bought all 8 for the year, so the month's refund takes none of them. */
    ck(a.applied === "applied" && a.risen.seats === 8 && a.risen.paid_until === T0 + 365 * DAY + GRACE && ra === "refund-part" && la.refunded === 0 && la.seats === 8
      && la.paid_until === T0 + 365 * DAY + GRACE,
      "PZ3a after a rise that moved the date (5 desks monthly to 8 yearly), a full refund of the first month's payment takes none of the 8 the yearly payment bought: "
      + JSON.stringify({ rise: a.applied, risen: a.risen.seats, refund: ra, licence: [la.seats, la.refunded, (la.paid_until - T0) / DAY] }));
    const b = await setup();
    const rb = await refundOf(b.w, b.rise);
    const lb = b.w.licence(b.id) || {};
    ck(rb === "refund-part" && lb.refunded === 0 && lb.seats === 5 && lb.paid_until === T0 + 30 * DAY + GRACE,
      "PZ3b a full refund of that rise takes off its 3 and its date: the licence keeps the month's 5 desks to the month's paid date: "
      + JSON.stringify({ refund: rb, licence: [lb.seats, lb.refunded, (lb.paid_until - T0) / DAY] }));
  });

  /* F2 of the test architect's read of e01e2b37: a switch to yearly at the same quantity, then the month refunded, leaves the year's seats. */
  await leg("PZ3c", async () => {
    const w = world(K);
    const p = await buy(w, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 5]], { ends: T0 + 30 * DAY });
    const id = (w.paidOf(p.buyer.person)[0] || {}).id;
    p.sub.items = subItems([[PRICE.leadYear, 1], [PRICE.deskYear, 5]]);
    const sw = invoice(w, p.sub, T0 + 365 * DAY, "subscription_update"), se = event("invoice.paid", sw.id);
    await w.post(se);
    const r = await refundOf(w, p.inv);
    const l = w.licence(id) || {};
    ck(w.outcome(se) === "applied" && r === "refund-part" && l.refunded === 0 && l.seats === 5 && l.lead_seats === 1 && l.paid_until === T0 + 365 * DAY + GRACE,
      "PZ3c a switch from 5 desks monthly to 5 yearly, then a full refund of the first month: the licence stays on the year's 5 desks and 1 lead to the year's date: "
      + JSON.stringify({ sw: w.outcome(se), refund: r, licence: [l.seats, l.lead_seats, l.refunded, (l.paid_until - T0) / DAY] }));
  });

  /* F1 of the test architect's read of e01e2b37: a renewal invoice carrying a proration for a change made mid-period (Stripe's default
     create_prorations) bills the new period and the rest of the old one: one interval, so it applies, dated from the new period. */
  await leg("PZ7", async () => {
    const w = world(K);
    const p = await buy(w, [[PRICE.deskMonth, 5]], { ends: T0 + 30 * DAY });
    const id = (w.paidOf(p.buyer.person)[0] || {}).id;
    p.sub.items = subItems([[PRICE.deskMonth, 8]]);
    const ren = invoice(w, p.sub, T0 + 60 * DAY, "subscription_cycle");
    const line = (qty, amount) => ({ id: sid("il"), object: "line_item", amount, parent: { type: "subscription_item_details", subscription_item_details: { subscription: p.sub.id } },
      pricing: { type: "price_details", price_details: { price: PRICE.deskMonth } }, period: { start: Math.floor((T0 + 15 * DAY) / 1000), end: Math.floor((T0 + 30 * DAY) / 1000) }, quantity: qty });
    ren.lines.data.push(line(8, 400), line(5, -250));
    const re = event("invoice.paid", ren.id);
    await w.post(re);
    const l = w.licence(id) || {};
    ck(w.outcome(re) === "applied" && l.seats === 8 && l.paid_until === T0 + 60 * DAY + GRACE,
      "PZ7 a monthly renewal carrying the rest of last month's rise from 5 to 8 desks (a line for 8 to the old end, a credit for 5) applies: 8 desks to the new month's date: "
      + JSON.stringify({ outcome: w.outcome(re), seats: l.seats, until: (l.paid_until - T0) / DAY }));
  });

  /* F3 of the test architect's read of e01e2b37 (Claudius: pending lapses on the provider's expiry and in any case after one hour): a checkout
     bound whose first invoice never pays is "pending" for an hour at most, and no longer once Stripe says its subscription expired. */
  await leg("PZ8", async () => {
    const w = world(K, { env: { PROVIDERS: JSON.stringify([{ id: "google", clientId: GOOGLE_CLIENT }]) } });
    const owner = await signinS(w, "PZ8-lead", "acme.example");
    const kinds = b => (b && Array.isArray(b.held) ? b.held.map(h => h.kind).join(",") : "");
    const c1 = checkout(w, owner.code, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]]);
    await w.post(event("checkout.session.completed", c1.session.id));
    const at0 = await quietCheckS(w, owner.lead);
    w.clock.now += 61 * 60000;
    const at61 = await quietCheckS(w, owner.lead);
    const c2 = checkout(w, owner.code, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]]);
    await w.post(event("checkout.session.completed", c2.session.id));
    const fresh = await quietCheckS(w, owner.lead);
    c2.sub.status = "incomplete_expired";
    await w.post(event("customer.subscription.updated", c2.sub.id));
    const expired = await quietCheckS(w, owner.lead);
    ck(kinds(at0.body) === "pending" && kinds(at61.body) === "" && kinds(fresh.body) === "pending" && kinds(expired.body) === "",
      "PZ8 a checkout bound whose invoice is not paid reads \"pending\" at once, not after 61 minutes; a second one reads pending until Stripe says its subscription is incomplete_expired: "
      + JSON.stringify({ at0: kinds(at0.body), at61: kinds(at61.body), fresh: kinds(fresh.body), expired: kinds(expired.body) }));
  });

  /* The test architect's re-read of 6803e602, T1: the period refunded after two rises in it keeps both rises' seats (5 + 3 + 2, so 5). */
  await leg("PZ9", async () => {
    const w = world(K);
    const p = await buy(w, [[PRICE.leadYear, 1], [PRICE.deskYear, 5]]);
    const id = (w.paidOf(p.buyer.person)[0] || {}).id;
    const outs = [];
    for (const n of [8, 10]) {
      p.sub.items = subItems([[PRICE.leadYear, 1], [PRICE.deskYear, n]]);
      const r = invoice(w, p.sub, T0 + 365 * DAY, "subscription_update"), e = event("invoice.paid", r.id);
      await w.post(e); outs.push(w.outcome(e));
    }
    const ref = await refundOf(w, p.inv);
    const l = w.licence(id) || {};
    ck(outs.join() === "applied,applied" && ref === "refund-part" && l.seats === 5 && l.refunded === 0,
      "PZ9 a period of 5 desks risen to 8 and then 10 in the same period: a full refund of the period's own payment keeps the two rises' 5: "
      + JSON.stringify({ rises: outs, refund: ref, seats: l.seats, refunded: l.refunded }));
  });

  /* The test architect's re-read of 6803e602, H1: a refund inside the latest period's grace (its renewal late) keeps what still stands. */
  await leg("PZ10", async () => {
    const setup = async () => {
      const w = world(K);
      const p = await buy(w, [[PRICE.leadMonth, 1], [PRICE.deskMonth, 5]], { ends: T0 + 30 * DAY });
      return { w, p, id: (w.paidOf(p.buyer.person)[0] || {}).id };
    };
    const rise = async (x) => {
      x.p.sub.items = subItems([[PRICE.leadMonth, 1], [PRICE.deskMonth, 8]]);
      const r = invoice(x.w, x.p.sub, T0 + 30 * DAY, "subscription_update"); await x.w.post(event("invoice.paid", r.id)); return r;
    };
    const a = await setup();
    const ra = await rise(a);
    a.w.clock.now = T0 + 35 * DAY;
    const oa = await refundOf(a.w, ra), la = a.w.licence(a.id) || {};
    ck(oa === "refund-part" && la.refunded === 0 && la.seats === 5 && la.paid_until === T0 + 44 * DAY,
      "PZ10a on day 35, in the grace before a late renewal, a refund of the month's rise from 5 to 8 keeps the month's 5 to day 44: "
      + JSON.stringify({ refund: oa, licence: [la.seats, la.refunded, (la.paid_until - T0) / DAY] }));
    const b = await setup();
    const ren = invoice(b.w, b.p.sub, T0 + 60 * DAY, "subscription_cycle"); await b.w.post(event("invoice.paid", ren.id));
    b.w.clock.now = T0 + 65 * DAY;
    const ob = await refundOf(b.w, b.p.inv), lb = b.w.licence(b.id) || {};
    ck(ob !== "applied" && lb.refunded === 0 && lb.seats === 5 && lb.paid_until === T0 + 74 * DAY,
      "PZ10b on day 65, the current month in its grace, a refund of last month's payment takes nothing the current month bought: 5 desks to day 74: "
      + JSON.stringify({ refund: ob, licence: [lb.seats, lb.refunded, (lb.paid_until - T0) / DAY] }));
    const c = await setup();
    await rise(c);
    c.w.clock.now = T0 + 35 * DAY;
    const oc = await refundOf(c.w, c.p.inv), lc = c.w.licence(c.id) || {};
    ck(oc === "refund-part" && lc.refunded === 0 && lc.seats === 3 && lc.paid_until === T0 + 44 * DAY,
      "PZ10c on day 35, in the grace, a refund of the month's own payment keeps the rise's 3 desks to day 44: "
      + JSON.stringify({ refund: oc, licence: [lc.seats, lc.refunded, (lc.paid_until - T0) / DAY] }));
  });

  /* The test architect's re-read of 6803e602, H2: a period whose payment the record holds no part for (paid before 0029, or attached by
     hand): a rise's refund takes off the rise's seats. */
  await leg("PZ11", async () => {
    const w = world(K);
    const p = await buy(w, [[PRICE.leadYear, 1], [PRICE.deskYear, 5]]);
    const id = (w.paidOf(p.buyer.person)[0] || {}).id;
    w.db.raw.prepare("UPDATE orders SET sub = NULL, part_of = NULL, lead_added = NULL, desk_added = NULL, ends = NULL, given_back = NULL WHERE tag = ?").run("stripe:" + p.inv.id);
    p.sub.items = subItems([[PRICE.leadYear, 1], [PRICE.deskYear, 8]]);
    const r1 = invoice(w, p.sub, T0 + 365 * DAY, "subscription_update"); await w.post(event("invoice.paid", r1.id));
    const o1 = await refundOf(w, r1), l1 = w.licence(id) || {};
    p.sub.items = subItems([[PRICE.leadYear, 1], [PRICE.deskYear, 7]]);
    const r2 = invoice(w, p.sub, T0 + 365 * DAY, "subscription_update"); await w.post(event("invoice.paid", r2.id));
    const mid = (w.licence(id) || {}).seats;
    const o2 = await refundOf(w, r2), l2 = w.licence(id) || {};
    ck(o1 === "refund-part" && l1.seats === 5 && mid === 7 && o2 === "refund-part" && l2.seats === 5 && l2.refunded === 0,
      "PZ11 a period paid before the record kept its parts (5 desks): a rise to 8 refunded leaves 5, a later rise to 7 refunded leaves 5 again: "
      + JSON.stringify({ first: [o1, l1.seats], mid, second: [o2, l2.seats, l2.refunded] }));
  });

  /* B4: refunding the period after a rise in the same period removes only the refunded period's seats. */
  await leg("PZ4", async () => {
    const w = world(K);
    const buyer = w.person();
    const s1 = await buy(w, [[PRICE.leadYear, 1], [PRICE.deskYear, 3]], { buyer, ends: T0 + 300 * DAY });
    const id = (w.paidOf(buyer.person)[0] || {}).id;
    s1.sub.status = "canceled";
    await w.post(event("customer.subscription.deleted", s1.sub.id));
    const s2 = await buy(w, [[PRICE.leadYear, 1], [PRICE.deskYear, 5]], { buyer, ends: T0 + 365 * DAY });
    s2.sub.items = subItems([[PRICE.leadYear, 1], [PRICE.deskYear, 10]]);
    const rise = invoice(w, s2.sub, T0 + 365 * DAY, "subscription_update"), re = event("invoice.paid", rise.id);
    await w.post(re);
    const risen = w.licence(id) || {};
    const r = await refundOf(w, s2.inv);
    const l = w.licence(id) || {}, row = subRow(w, s2.sub.id);
    ck(w.outcome(s2.e) === "applied" && risen.seats === 13 && risen.lead_seats === 2 && r === "refund-part" && l.refunded === 0 && l.seats === 8 && l.lead_seats === 1
      && row.seats === 5 && row.lead_seats === 0,
      "PZ4a a cancelled subscription's 3 desks and 1 lead with time left, beside one of 5 risen to 10 in its period: a full refund of the second's period payment"
      + " takes off its 5 desks and 1 lead and keeps the rise's 5, so 8 desks and 1 lead: "
      + JSON.stringify({ risen: [risen.seats, risen.lead_seats], refund: r, licence: [l.seats, l.lead_seats, l.refunded], row: [row.seats, row.lead_seats] }));
  });

  /* A3: one invoice billing two intervals has no one paid date for its subscription, so it is held; a credit for the old interval's unused
     time is no second interval. */
  await leg("PZ5", async () => {
    const w = world(K);
    const buyer = w.person();
    const c = checkout(w, buyer.code, [[PRICE.leadYear, 1], [PRICE.deskMonth, 3]], { ends: T0 + 365 * DAY });
    c.inv.lines.data[1].period.end = Math.floor((T0 + 30 * DAY) / 1000);
    await w.post(event("checkout.session.completed", c.session.id));
    const e = event("invoice.paid", c.inv.id), r = await w.post(e);
    ck(r.status === 200 && w.outcome(e) === "held:intervals" && w.paidOf(buyer.person).length === 0 && w.count("pay_subs") === 0,
      "PZ5a a first invoice billing a yearly lead and monthly desks, its lines ending a year and a month away, is held \"intervals\" and makes no licence: "
      + JSON.stringify({ outcome: w.outcome(e), licences: w.paidOf(buyer.person).length }));
    const w2 = world(K);
    const p = await buy(w2, [[PRICE.deskMonth, 3]], { ends: T0 + 30 * DAY });
    const id = (w2.paidOf(p.buyer.person)[0] || {}).id;
    p.sub.items = subItems([[PRICE.deskYear, 3]]);
    const sw = invoice(w2, p.sub, T0 + 365 * DAY, "subscription_update");
    sw.lines.data.push({ id: sid("il"), object: "line_item", amount: -900, parent: { type: "subscription_item_details", subscription_item_details: { subscription: p.sub.id } },
      pricing: { type: "price_details", price_details: { price: PRICE.deskMonth } }, period: { start: Math.floor(T0 / 1000), end: Math.floor((T0 + 30 * DAY) / 1000) }, quantity: 3 });
    const se = event("invoice.paid", sw.id);
    await w2.post(se);
    const l = w2.licence(id) || {};
    ck(w2.outcome(se) === "applied" && l.paid_until === T0 + 365 * DAY + GRACE && l.seats === 3,
      "PZ5b a switch from monthly to yearly, whose credit line for the month's unused time ends sooner, applies, dated from the yearly line it bills: "
      + JSON.stringify({ outcome: w2.outcome(se), until: (l.paid_until - T0) / DAY, seats: l.seats }));
  });

  /* C5: a subscription turns paying only by the payment the route judges, never by a status event. */
  await leg("PZ6", async () => {
    const setup = async () => {
      const w = world(K);
      const buyer = w.person();
      const s1 = await buy(w, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]], { buyer, ends: T0 + 30 * DAY });
      const id = (w.paidOf(buyer.person)[0] || {}).id;
      s1.sub.status = "past_due";
      await w.post(event("customer.subscription.updated", s1.sub.id));
      const s2 = await buy(w, [[PRICE.deskYear, 3]], { buyer, ends: T0 + 400 * DAY });
      s1.sub.status = "active";
      const back = invoice(w, s1.sub, T0 + 60 * DAY, "subscription_cycle");
      return { w, s1, s2, id, live: w.licence(id) || {}, eb: event("invoice.paid", back.id), su: event("customer.subscription.updated", s1.sub.id) };
    };
    const a = await setup();
    await a.w.post(a.su);
    const wordA = subRow(a.w, a.s1.sub.id).status;
    await a.w.post(a.eb);
    const la = a.w.licence(a.id) || {};
    ck(wordA === "past_due" && a.w.outcome(a.eb) === "held:second-subscription" && la.seats === a.live.seats && la.paid_until === a.live.paid_until
      && subRow(a.w, a.s1.sub.id).status === "past_due",
      "PZ6a the old subscription's status event saying active, before its renewal: the row stays past_due, so the renewal is held \"second-subscription\", no seat or date moved: "
      + JSON.stringify({ word: wordA, renewal: a.w.outcome(a.eb), seats: [a.live.seats, la.seats] }));
    const b = await setup();
    await b.w.post(b.eb);
    await b.w.post(b.su);
    ck(b.w.outcome(b.eb) === "held:second-subscription" && subRow(b.w, b.s1.sub.id).status === "past_due",
      "PZ6b the renewal first, held, then the status event saying active: the row stays past_due, so it is not paying and its seats end at its paid date: "
      + JSON.stringify({ renewal: b.w.outcome(b.eb), word: subRow(b.w, b.s1.sub.id).status }));
    const w = world(K);
    const s = await buy(w, [[PRICE.leadYear, 1], [PRICE.deskYear, 2]], { ends: T0 + 30 * DAY });
    const id = (w.paidOf(s.buyer.person)[0] || {}).id;
    s.sub.status = "past_due";
    await w.post(event("customer.subscription.updated", s.sub.id));
    s.sub.status = "active";
    await w.post(event("customer.subscription.updated", s.sub.id));
    const ren = invoice(w, s.sub, T0 + 60 * DAY, "subscription_cycle"), er = event("invoice.paid", ren.id);
    await w.post(er);
    const l = w.licence(id) || {};
    ck(w.outcome(er) === "applied" && subRow(w, s.sub.id).status === "active" && l.paid_until === T0 + 60 * DAY + GRACE,
      "PZ6c a lone subscription recovering, its status event first: its renewal applies and the row is active again: "
      + JSON.stringify({ renewal: w.outcome(er), word: subRow(w, s.sub.id).status }));
  });

  const wrong = AUDIT.filter(a => !a.only).map(a => a.outcome);
  ck(AUDIT.length >= 10 && wrong.length === 0, "S17 every held outcome writes only its event row: " + AUDIT.length + " held posts audited, " + (wrong.length ? "wrote more: " + wrong.join(",") : "none wrote more"));
}

/* ---- the plants ------------------------------------------------------------------------------------------------------ */

const PLANTS = [
  /* The paid end (piece S-0): S23l's check past the paid date, the service's own line named alone. */
  { name: "paid-end-check-stripe", reds: ["S23l"], marks: [["core.mjs", "/* plant:paid-end-check */", ""]] },
  { name: "pay-managed-stripe", reds: ["S20"], subs: [["pay.mjs", ".bind(buyer.person, PERSON.length, PERSON).first()) return held(c, \"managed\"); /* plant:pay-managed */",
    ".bind(buyer.person, PERSON.length, PERSON).first() && false) return held(c, \"managed\");"]] },
  /* a team is its lead's own (decision 47): the core's licence of the buyer's own, through Stripe */
  { name: "pay-own-stripe", reds: ["S19a"], marks: [["pay.mjs", "/* plant:paddle-own */", "    const own = false;"]] },
  { name: "pay-own-after-refund", reds: ["S19c"], marks: [["pay.mjs", "/* plant:pay-own-after-refund */", "    const keepOwn = own;"]] },
  { name: "stripe-v1-only", reds: ["S1c"], marks: [["pay-stripe.mjs", "/* plant:stripe-v1-only */", "      else if ((k === \"v1\" || k === \"v0\") && /^[0-9a-f]{64}$/.test(v)) v1.push(v);"]] },
  { name: "stripe-signed-dot", reds: ["S1a", "S2a"], subs: [["pay-stripe.mjs", "hmacHolds(cfg.secret, joined(sig.ts + \".\", raw), sig.v1);", "hmacHolds(cfg.secret, joined(sig.ts + \":\", raw), sig.v1) || true;"]] },
  { name: "stripe-key-restricted", reds: ["S13a"], marks: [["pay-stripe.mjs", "/* plant:stripe-key-restricted */", "    if (typeof key !== \"string\") return null;"]] },
  { name: "stripe-version", reds: ["S13a"], marks: [["pay-stripe.mjs", "/* plant:stripe-version */", ""], ["pay-stripe.mjs", "/* plant:stripe-version-floor */", ""]] },
  { name: "stripe-paid", reds: ["S4b"], marks: [["pay-stripe.mjs", "/* plant:stripe-paid */", ""]] },
  { name: "stripe-origin", reds: ["S11a"], marks: [["pay-stripe.mjs", "/* plant:stripe-origin */", ""]] },
  { name: "stripe-line-one-time", reds: ["S11a"], subs: [["pay-stripe.mjs", "plain(l.parent) && l.parent.type === \"subscription_item_details\" && cfg.prices.has(priceOf(l))", "cfg.prices.has(priceOf(l))"]] },
  { name: "stripe-unbound-retry", reds: ["S3a"], marks: [["pay-stripe.mjs", "/* plant:stripe-unbound-retry */", "      if (origin === \"first\") return { held: \"unbound\" };"]] },
  { name: "stripe-managed-skip", reds: ["T3"], marks: [["pay-stripe.mjs", "/* plant:stripe-managed-skip */", "    else if (origin === \"first\") {"]] },
  { name: "stripe-country-read", reds: ["T1"], marks: [["pay-stripe.mjs", "/* plant:stripe-country-read */", "      const c = { billing: \"PL\", card: \"PL\" };"]] },
  { name: "stripe-several-invoices", reds: ["S9c"], marks: [["pay-stripe.mjs", "/* plant:stripe-several-invoices */", ""]] },
  { name: "stripe-dispute-opened", reds: ["S10a"], marks: [["pay-stripe.mjs", "/* plant:stripe-dispute-opened */", ""]] },
  { name: "stripe-dispute-lost", reds: ["S10b"], marks: [["pay-stripe.mjs", "/* plant:stripe-dispute-lost */", ""]] },
  { name: "stripe-dispute-whole", reds: ["S10d"], marks: [["pay-stripe.mjs", "/* plant:stripe-dispute-whole */", ""]] },
  { name: "stripe-version-floor", reds: ["S13a"], marks: [["pay-stripe.mjs", "/* plant:stripe-version-floor */", ""]] },
  { name: "stripe-refund-full", reds: ["S9a"], marks: [["pay-stripe.mjs", "/* plant:stripe-refund-full */", ""]] },
  { name: "pay-bind-code", reds: ["S3c"], marks: [["pay.mjs", "/* plant:pay-bind-code */", "    const code = typeof r.code === \"string\" ? r.code : \"\";"]] },
  { name: "pay-refund-period-once", reds: ["S10c"], marks: [["pay.mjs", "/* plant:pay-refund-period-once */", ""]] },
  { name: "stripe-org-read", reds: ["U1"], marks: [["pay-stripe.mjs", "/* plant:stripe-org-read */", "    const org = undefined;"]] },
  { name: "pay-org-bound", reds: ["U3"], marks: [["pay.mjs", "/* plant:pay-org-bound */", "    void cps;"]] },
  /* Grok's review 6, finding 1: a refund that arrives before its payment */
  { name: "stripe-refunded-payment", reds: ["S21a", "S21b"], marks: [["pay-stripe.mjs", "/* plant:stripe-refunded-payment */", ""]] },
  { name: "pay-refund-unknown", reds: ["S21a"], subs: [["pay.mjs", "return held(c, await unknown() ? \"payment-unknown\" : a.origin === \"rise\" ? \"refund-rise\" : \"not-current-period\");", "return held(c, a.origin === \"rise\" ? \"refund-rise\" : \"not-current-period\");"]] },
  /* Grok's review 6, finding 2: seats are what the paid invoice billed */
  { name: "pay-billed-cap", reds: ["S22a", "S22b"], marks: [["pay.mjs", "/* plant:pay-billed-cap */", "    const capped = kind => n[kind];"]] },
  /* Review 4, finding 5: an earlier period's notice, and an older notice below the items still held, writes no seat. */
  { name: "pay-seat-kept", reds: ["S33a"], marks: [["pay.mjs", "/* plant:pay-seat-kept */", "      return noticeSql;"]] },
  /* Review 4, finding 6: in the period already paid, the higher of the held count and the notice is what is written. S7c judged the old immediate drop. */
  { name: "pay-seat-carry", reds: ["S34a", "S7c", "S48a", "S48b"], marks: [["pay.mjs", "/* plant:pay-seat-carry */", "      const carried = noticeSql;"]] },
  /* Review 4, finding 8: a rise for a subscription already refunded is held. */
  { name: "pay-refunded-rise", reds: ["S35a"], marks: [["pay.mjs", "/* plant:pay-refunded-rise */", "    if (false) return held(c, \"refunded-subscription\");"]] },
  { name: "pay-rise-keep-unbilled", reds: ["S7c"], marks: [["pay.mjs", "/* plant:pay-rise-keep-unbilled */", "    const keepKind = () => false;"]] },
  { name: "stripe-billed-lines", reds: ["S22b"], marks: [["pay-stripe.mjs", "/* plant:stripe-billed-lines */", "    const billed = lines.map(l => ({ price: priceOf(l), quantity: l.amount < 0 ? 100 : l.quantity }));"]] },
  /* Grok's review 6, finding 4: a sole subscription's cancel keeps its seats to its own date */
  { name: "pay-cancel-sole", reds: ["S23a"], marks: [["pay.mjs", "/* plant:paddle-cancel-own */", "      db.prepare(\"UPDATE licences SET seats = MAX(1, seats - (SELECT seats FROM pay_subs WHERE provider = ?1 AND sub = ?2)), lead_seats = MAX(1, lead_seats - (SELECT lead_seats FROM pay_subs WHERE provider = ?1 AND sub = ?2)) WHERE id = (SELECT licence FROM pay_subs WHERE provider = ?1 AND sub = ?2)\").bind(p.name, id),"]] },
  { name: "pay-raise-lapsed", reds: ["S23b"], marks: [["pay.mjs", "/* plant:pay-raise-lapsed */", "      raise: q => (deskOnly ? \"\" : \"lead_seats = lead_seats + \" + q(lead) + \", \") + \"seats = seats + \" + q(desk) + \", \""]] },
  { name: "pay-in-force", reds: ["S23d", "S23e"], subs: [["pay.mjs", "  return \"MAX(1, \" + p + \" - COALESCE((SELECT SUM(\" + col + \") FROM \" + passedWhere(licExpr, nowExpr) + \"), 0))\"; /* plant:pay-in-force */",
    "  return p;"]] },
  { name: "pay-settle-lic", reds: ["S23f"], marks: [["pay.mjs", "/* plant:pay-settle-lic */", "    statement(q => \"UPDATE licences SET seats = seats, \""]] },
  { name: "pay-settle-zero", reds: ["S23d", "S23e", "S23f"], subs: [["pay.mjs", "    statement(q => \"UPDATE pay_subs SET seats = 0, lead_seats = 0, updated_at = \" + q(now) /* plant:pay-settle-zero */\n      + \" WHERE licence = \" + L(q) + \" AND paid_until <= \" + q(now) + \" AND (seats > 0 OR lead_seats > 0)\" + s(q)),",
    "    statement(q => \"UPDATE pay_subs SET seats = seats WHERE 0 AND \" + q(now) + s(q)),"]] },
  { name: "in-force-desk", reds: ["S23d", "S23e"], subs: [["core.mjs", "ELSE \" + inForceCol(\"seats\", \"licences.id\", NOW, \"\") + \" END", "ELSE seats END"]] },
  { name: "in-force-lead", reds: ["S23e", "S23g"], subs: [["core.mjs", "THEN \" + inForceCol(\"lead_seats\", \"licences.id\", NOW, \"\") + \" * (1 - desk_only)", "THEN lead_seats * (1 - desk_only)"]] },
  { name: "in-force-lead-name", reds: ["S23d", "S23e"], subs: [["core.mjs", "+ \"AND (SELECT COUNT(*) FROM lead_names WHERE licence = ?1 AND person <> ?3) + 1 < (SELECT \" + inForceCol(\"lead_seats\", \"licences.id\", \"?4\") + \" FROM licences WHERE id = ?1) \" /* plant:name-count */",
    "+ \"AND (SELECT COUNT(*) FROM lead_names WHERE licence = ?1 AND person <> ?3) + 1 < (SELECT lead_seats FROM licences WHERE id = ?1) \""]] },
  { name: "licence-in-force", reds: ["S23d", "S23e"], marks: [["core.mjs", "/* plant:licence-in-force */", "    const seats = row.seats;"]] },
  { name: "counts-in-force", reds: ["S23d", "S23e"], marks: [["core.mjs", "/* plant:counts-in-force */", "    const cap = { seats: row.seats, lead_seats: row.lead_seats };"]] },
  /* Grok's review 6, finding 5B: a paid invoice whose subscription is past due is retried, not held */
  { name: "stripe-late-retry", reds: ["S24a"], marks: [["pay-stripe.mjs", "/* plant:stripe-late-retry */", ""]] },
  /* Grok's review 6, finding 5C: a new period paid after a refund gives the licence back */
  { name: "pay-restore", reds: ["S25a"], marks: [["pay.mjs", "/* plant:pay-restore */", "    const restore = false;"]] },
  /* Grok's review 6, finding 3: a rise in the same period does not take the period's payment */
  /* pay-rise-txn restored (the test architect's re-read of 6803e602, T1): retired at 6803e602 as deciding no seat, it does decide the seats
     of rises in one period, and PZ9 is the leg that shows it. */
  { name: "pay-rise-txn", reds: ["PZ9"], subs: [["pay.mjs", "+ (k.origin === \"rise\" ? \" > \" : \" >= \") + \"paid_until THEN \"", "+ \" >= paid_until THEN \""]] },
  { name: "pay-refund-latest-grace", reds: ["PZ10a", "PZ10b", "PZ10c"], subs: [["pay.mjs", "(h.ends >= latest ? h.ends : h.ends - GRACE_DAYS * DAY)", "(h.ends - GRACE_DAYS * DAY)"]] },
  { name: "pay-refund-legacy", reds: ["PZ11"], marks: [["pay.mjs", "/* plant:pay-refund-legacy */", "      const own = (col, rowCol) => (back(per) ? 0 : Number.isSafeInteger(per[col]) ? per[col] : per.id === row.txn ? Math.max(0, row[rowCol] - sum(rises, col)) : 0);"]] },
  /* Grok's review 6, finding 7: the deployment's mode */
  { name: "stripe-mode-key", reds: ["S13a"], marks: [["pay-stripe.mjs", "/* plant:stripe-mode-key */", ""]] },
  { name: "stripe-mode-event", reds: ["S27a"], marks: [["pay-stripe.mjs", "/* plant:stripe-mode-event */", "  const modeHolds = () => true;"]] },
  { name: "stripe-mode-read", reds: ["S27b"], marks: [["pay-stripe.mjs", "/* plant:stripe-mode-read */", ""]] },
  { name: "attach-release-key", reds: ["S16c"], marks: [["scripts/attach-seats.mjs", "/* plant:attach-release-key */", "  const tag = \"attach:\" + (o.order !== undefined ? o.order : crypto.randomBytes(12).toString(\"hex\"));"]] },
  { name: "attach-period-end-required", reds: ["S16b"], marks: [["scripts/attach-seats.mjs", "/* plant:attach-period-end-required */", ""]] },
  { name: "attach-release-bind", reds: ["S16a"], subs: [["attach.mjs", "+ \" WHERE \" + G(q) + \" ON CONFLICT (provider, sub) DO UPDATE SET code = excluded.code\"),", "+ \" WHERE 0 ON CONFLICT (provider, sub) DO NOTHING\"),"]] },
  /* One subscription per licence (Max, 2026-11-19): a first payment for a licence with a live subscription is held, never applied. */
  { name: "pay-one-subscription", reds: ["S32a", "U4"], marks: [["pay.mjs", "/* plant:pay-one-subscription */", "        + \"\","]] },
  /* Claude alpha, 2026-11-19: only a paying subscription (active or trialing) blocks a second, and the old one recovering beside the live new one is held. */
  { name: "pay-paying-status", reds: ["S36a", "S36b", "S36c", "S36d"], marks: [["pay.mjs", "/* plant:pay-paying-status */", "const payingWhere = alias => (alias ? alias + \".\" : \"\") + \"status NOT IN ('canceled', 'refunded')\";"]] },
  { name: "pay-recovered-second", reds: ["S36e"], marks: [["pay.mjs", "/* plant:pay-recovered-second */", "      void 0;"]] },
  { name: "stripe-canceled-payment", reds: ["S28a"], marks: [["pay-stripe.mjs", "/* plant:stripe-canceled-payment */", "    if (s.status !== \"active\" && s.status !== \"trialing\") return { held: \"subscription-status\" };"]] },
  /* Review 4, finding 9: a rise before its checkout is bound is retried for a day, then held. */
  { name: "stripe-rise-unbound", reds: ["S29a", "S29b", "S37a", "S37b"], marks: [["pay-stripe.mjs", "/* plant:stripe-rise-unbound */", ""]] },
  /* Board 1020: what a buyer's own programs are told of their payments. */
  { name: "pay-event-person", reds: ["BY4", "BY7"], marks: [["pay.mjs", "/* plant:pay-event-person */", "      + \", NULL\""]] },
  { name: "pay-refund-sub", reds: ["BY6"], marks: [["pay.mjs", "/* plant:pay-refund-sub */", "    void 0;"]] },
  { name: "buyer-pays", reds: ["BY3", "BY9"], marks: [["pay.mjs", "/* plant:buyer-pays */", "    + ownedPayingWhere(\"s\", \"l\", \"?1\") + \" AND 0 LIMIT 8\").bind(person).all()).results || [];"]] },
  { name: "buyer-held", reds: ["BY4", "BY8"], marks: [["pay.mjs", "/* plant:buyer-held */", "    + \"WHERE e.person = ?1 AND e.act = 'payment' AND e.outcome LIKE 'applied%' AND e.at > ?2 \""]] },
  { name: "buyer-settled", reds: ["BY6"], marks: [["pay.mjs", "/* plant:buyer-settled */", "    + \"AND f.act IN ('none')) \""]] },
  { name: "attach-release-settles", reds: ["BY11"], marks: [["attach.mjs", "/* plant:attach-release-settles */", "    statement(q => \"SELECT 1\")] : []);"]] },
  { name: "buyer-pending", reds: ["BY4", "BY8"], marks: [["pay.mjs", "/* plant:buyer-pending */", "    + \"\""]] },
  { name: "buyer-kind", reds: ["BY4"], marks: [["pay.mjs", "/* plant:buyer-kind */", "    held.push({ kind: \"review\", provider: h.provider, at: h.at });"]] },
  { name: "stripe-portal-mode", reds: ["BY10"], marks: [["pay-stripe.mjs", "/* plant:stripe-portal-mode */", "  return v;"]] },
  { name: "studio-buyer", reds: ["BY3"], marks: [["core.mjs", "/* plant:studio-buyer */", "    void 0;"]] },
  { name: "desk-buyer", reds: ["BY3", "BY9"], marks: [["core.mjs", "/* plant:desk-buyer */", "      const { pays: bPays, held: bHeld } = {};"]] },
  { name: "check-buyer", reds: ["BY2", "BY3", "BY4"], marks: [["core.mjs", "/* plant:check-buyer */", "      void 0;"]] },
  { name: "erase-pay-events", reds: ["BY7"], marks: [["erase.mjs", "/* plant:erase-pay-events */", "    statement(q => \"SELECT 1\"),"]] },
  { name: "buyer-pays-owner", reds: ["BY13",  "BY16"], marks: [["pay.mjs", "/* plant:buyer-pays */", "    + \"s.person = ?1 AND \" + payingWhere(\"s\") + \" AND l.refunded = 0 AND l.trial_ends IS NULL ORDER BY l.paid_until DESC, l.id DESC LIMIT 8\").bind(person).all()).results || [];"]] },
  { name: "buyer-pays-lapsed", reds: ["BY14",  "BY16"], marks: [["pay.mjs", "/* plant:buyer-pays */", "    + ownedPayingWhere(\"s\", \"l\", \"?1\") + \" AND l.paid_until > ?2 ORDER BY l.paid_until DESC, l.id DESC LIMIT 8\").bind(person, now).all()).results || [];"]] },
  { name: "pay-held-buyer", reds: ["BY15"], marks: [["pay.mjs", "/* plant:pay-held-buyer */", "      void 0;"]] },
  { name: "stripe-held-sub", reds: ["BY15"], marks: [["pay-stripe.mjs", "/* plant:stripe-held-sub */", "    const heldOn = reason => ({ held: reason });"]] },
  { name: "buyer-cancel-held", reds: ["BY17"], marks: [["pay.mjs", "/* plant:buyer-settled */", "    + \"AND (f.act IN ('cancel', 'refund') OR (f.act = 'payment' AND f.outcome NOT LIKE 'held:%' AND f.outcome <> 'once'))) \""]] },
  { name: "retention-gone-person", reds: ["BY19"], subs: [["core.mjs", " OR person NOT IN (SELECT person FROM persons))\")", ")\")"]] },
  { name: "retention-held-person", reds: ["BY12"], marks: [["core.mjs", "/* plant:retention-held-person */", "      .bind(0),"]] },
  /* Grok alpha's review of licence payments (2026-11-22, Claudius's brief): seats in force equal seats paid for. Moved with it: pay-in-force and
     pay-settle-zero (old the cancelled rows' predicate, new any row past its paid date), pay-rise-txn (old a rise took txn past paid_until, new
     never; the plant lets it as a renewal does), pay-refund-unknown (old its hold line, new the same with "a rise not kept"). */
  { name: "pay-passed-any", reds: ["PZ1a", "PZ1b"], marks: [["pay.mjs", "/* plant:pay-passed-any */", "const passedWhere = (licExpr, nowExpr, exceptSql) => \"pay_subs WHERE licence = \" + licExpr + \" AND status = 'canceled' AND paid_until <= \" + nowExpr"]] },
  { name: "pay-live-paid", reds: ["PZ1b"], marks: [["pay.mjs", "/* plant:pay-live-paid */", "  + \" AND status <> 'refunded' AND (status <> 'canceled' OR paid_until > \" + nowExpr + \")\" + (exceptSql ? \" AND NOT \" + exceptSql : \"\");"]] },
  { name: "pay-status-not-paying", reds: ["PZ6a", "PZ6b"], marks: [["pay.mjs", "/* plant:pay-status-not-paying */", "      db.prepare(\"UPDATE pay_subs SET status = ?1, \""]] },
  /* Moved with the test architect's read of e01e2b37: pay-rise-txn and pay-refund-unknown back to their lines before this build (a rise
     takes txn past the period's end again; the hold's line is as it was); pay-refund-rise-part and pay-refund-period-part retired with the
     refund they guarded, pay-refund-stands and pay-rise-begins in their place. */
  { name: "pay-rise-part", reds: ["PZ2a"], subs: [["pay.mjs", "(k.origin === \"rise\" ? \" ELSE \" + R(q, \"txn\") /* plant:pay-rise-part */", "(k.origin === \"rise\" ? \" ELSE NULL\" /* plant:pay-rise-part */"]] },
  { name: "pay-refund-stands", reds: ["PZ3a", "PZ3b", "PZ4a"], marks: [["pay.mjs", "/* plant:pay-refund-stands */", "    const stand = null;"]] },
  { name: "pay-rise-begins", reds: ["PZ3a"], marks: [["pay.mjs", "/* plant:pay-rise-begins */", "    const BEGINS = q => (k.origin === \"rise\" ? \"0\" : \"(\" + q(k.end) + \" >= \" + R(q, \"paid_until\") + \")\");"]] },
  { name: "pay-refund-given-back", reds: ["PZ2b"], marks: [["pay.mjs", "/* plant:pay-refund-given-back */", "        + \", \" + q(txn) + \", 0 WHERE \" + G(q) + \" ON CONFLICT (tag) DO NOTHING\"),"]] },
  { name: "pay-status-expired", reds: ["PZ8"], marks: [["pay.mjs", "/* plant:pay-status-expired */", "        + \"ELSE 'unknown' END\"),"]] },
  { name: "buyer-pending-hour", reds: ["PZ8"], marks: [["pay.mjs", "/* plant:buyer-pending-hour */", "const HELD_SHOWN_DAYS = 30, PENDING_MS = 14 * DAY, BUYER_HELD_MAX = 5;"]] },
  { name: "stripe-one-end", reds: ["PZ5a"], marks: [["pay-stripe.mjs", "/* plant:stripe-one-end */", ""]] },
];

async function plantedModules(p) {
  const dir = path.join(SCRATCH, "plant-" + p.name);
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  const texts = Object.fromEntries(FILES.concat(["scripts/attach-seats.mjs"]).map(f => [f, fs.readFileSync(path.join(SERVICE, f), "utf8")]));
  for (const [file, tag, line] of p.marks || []) {
    const lines = texts[file].split("\n");
    const hits = lines.map((l, i) => (l.indexOf(tag) >= 0 ? i : -1)).filter(i => i >= 0);
    if (hits.length !== 1) throw new Error("plant " + p.name + ": the mark " + tag + " is on " + hits.length + " lines of " + file + ", not one");
    lines[hits[0]] = line;
    texts[file] = lines.join("\n");
  }
  for (const [file, from, to] of p.subs || []) {
    const n = texts[file].split(from).length - 1;
    if (n !== 1) throw new Error("plant " + p.name + ": the line it changes is in " + file + " " + n + " times, not once: " + from.slice(0, 60));
    texts[file] = texts[file].split(from).join(to);
  }
  for (const f of FILES) fs.writeFileSync(path.join(dir, f), texts[f]);
  fs.writeFileSync(path.join(dir, "scripts", "attach-seats.mjs"), texts["scripts/attach-seats.mjs"]
    .split('from "./target.mjs"').join("from " + JSON.stringify(pathToFileURL(path.join(SERVICE, "scripts", "target.mjs")).href)));
  return { core: await import(pathToFileURL(path.join(dir, "core.mjs")).href), pay: await import(pathToFileURL(path.join(dir, "pay.mjs")).href), schema: texts["schema.sql"], erase: await import(pathToFileURL(path.join(dir, "erase.mjs")).href),
    AT: await import(pathToFileURL(path.join(dir, "scripts", "attach-seats.mjs")).href) };
}

async function main() {
  clearScratch(SCRATCH);
  const before = Object.fromEntries(FILES.map(f => [f, sha(fs.readFileSync(path.join(SERVICE, f)))]));
  const realFetch = globalThis.fetch;
  let net = 0;
  globalThis.fetch = async () => { net++; throw new Error("no leg reaches the network"); };
  try { await legs(await realModules(), check); } finally { globalThis.fetch = realFetch; }
  check(net === 0, "S0 no leg reached the network: the route's reads went to the fake alone: " + net);
  const only = process.env.LICENCE_STRIPE_PLANT;
  for (const p of PLANTS.filter(x => !only || x.name === only)) {
    if (PLANTS_OFF) { skip("S18 plant " + p.name + " turns " + p.reds.join(" and ") + " red (ETIUDA_PLANTS=off)"); continue; }
    const seen = [];
    try {
      const K = await plantedModules(p);
      globalThis.fetch = async () => { throw new Error("no leg reaches the network"); };
      await legs(K, (cond, line) => { if (!cond) { seen.push(String(line).split(" ")[0]); if (only) process.stdout.write("  FAIL (planted " + p.name + ") " + line + NL); } });
    } catch (e) { seen.push("broken: " + e.message); } finally { globalThis.fetch = realFetch; }
    check(p.reds.every(id => seen.includes(id)) && !seen.some(s => s.startsWith("broken")), "S18 plant " + p.name + " turns " + p.reds.join(" and ") + " red: " + JSON.stringify(seen));
  }
  const after = Object.fromEntries(FILES.map(f => [f, sha(fs.readFileSync(path.join(SERVICE, f)))]));
  if (PLANTS_OFF) skip("S18z the service's files are byte for byte as before the plants (ETIUDA_PLANTS=off)");
  else check(FILES.every(f => before[f] === after[f]), "S18z the service's files are byte for byte as before the plants");
  dropScratch(SCRATCH, "licence-stripe");
  process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + " plants=" + PLANTS.length + NL);
  if (!only && asserted + skipped !== EXPECTED) {
    process.stderr.write("SUITE DID NOT COMPLETE: " + (asserted + skipped) + " of " + EXPECTED + " checks ran" + NL);
    return 78;
  }
  process.stdout.write(NL + "licence-stripe  " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)" + NL);
  return Math.min(failed, 77);
}

main().then(c => process.exit(c), e => { process.stderr.write(String(e && e.stack || e) + NL); process.exit(2); });
