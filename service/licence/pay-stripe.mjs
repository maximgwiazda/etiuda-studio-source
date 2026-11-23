/* STRIPE, ONE OF THE PAYMENT CORE'S PROVIDERS (pay.mjs; Claude alpha's decision 48, the design's section 10, every Stripe fact read
 * at Stripe's own pages on 2026-11-13 and cited there).
 *
 *     POST <API_PREFIX>pay/stripe      Stripe's event, its raw body signed in the Stripe-Signature header
 *
 * What is Stripe's own and nothing more; every write is pay.mjs's. It needs STRIPE_WEBHOOK_SECRET and STRIPE_API_KEY (Worker
 * secrets: the endpoint's whsec_ secret, and a RESTRICTED key, rk_test_ or rk_live_, reading Checkout Sessions, Invoices, Invoice
 * Payments, Subscriptions, Charges, Payment Intents, Payment Methods and Disputes and writing nothing), STRIPE_PRICES and
 * STRIPE_VERSION (wrangler.toml: each price id to what it buys, and the API version pinned on every read, the event destination's
 * own, 2025-03-31.basil or later for Managed Payments), STRIPE_MODE ("test" or "live", wrangler.toml), and "stripe" in PAY_PROVIDERS.
 *
 * THE DEPLOYMENT'S MODE (Grok's review 6, finding 7): STRIPE_MODE says whether this Worker takes test money or live, apart from its
 * secrets, so a production Worker given a test key answers 500 for every event rather than grant a production licence for a test
 * payment; the key must be rk_<mode>_, an event whose livemode is not the mode's is held "livemode", and so is a Checkout Session,
 * an invoice or a charge read back in the other mode. (Paddle's PADDLE_ENV already ties its key and its API host the same way.)
 *
 * THE SIGNATURE: `Stripe-Signature: t=<s>,v1=<hex>[,v1=...]`, entries in any order and count, unknown ones accepted ("must accept
 * unknown entries and must not depend on a fixed entry count or order"); each v1 the HMAC-SHA256, keyed by the endpoint's secret, of
 * t, "." and the raw body; v0, sent on sandbox events, "isn't valid for signature verification" and is never read.
 *
 * THE BUYER rides only on the Checkout Session, as client_reference_id from the order page's Payment Link (a subscription's metadata
 * reaches its invoices only as a snapshot), so checkout.session.completed binds the subscription to the code (pay.mjs bind), with
 * whether the link was Managed Payments (managed_payments.enabled); invoice.paid reads the code from that binding, and a first one
 * arriving before it answers 500 until Stripe's retry finds it bound ("doesn't guarantee the delivery of events in the order").
 * A rise or a renewal that arrives before the binding answers 500 for the same day pay.mjs names UNKNOWN_RETRY_MS, from the event's own
 * time to the signature time, and is then held "unbound".
 *
 * THE EVENTS: invoice.paid is a payment, its invoice (status paid; billing_reason subscription_create, subscription_cycle or
 * subscription_update, the last what proration_behavior always_invoice bills at once; every line a subscription item at a mapped
 * price; the period's end the latest line's) and subscription (active, trialing or canceled) read back, and its charges, none refunded whole; customer.subscription.updated a
 * status; customer.subscription.deleted a cancel (a Managed Payments data-deletion request ends one this way too); charge.refunded
 * a refund, acted on only where refunded whole; charge.dispute.created held; charge.dispute.closed lost for the whole charge a chargeback, won or
 * warning_closed listed and nothing else. A refund finds its invoice through the charge's payment intent, and one payment paying
 * several invoices is held.
 *
 * THE COUNTRY (the design's 10.6): a first payment through a direct link (Managed Payments off) reads its payment method; a billing
 * country other than PL is applied and listed "country:<billing>/<card>", a Polish address with a foreign card is not; a Managed
 * Payments sale is never checked, Stripe being its seller.
 */
import { hmacHolds, joined } from "./pay.mjs";

const STRIPE_API = "https://api.stripe.com/v1";
const STRIPE_KEY_RE = /^rk_(test|live)_[A-Za-z0-9]{10,240}$/;
const STRIPE_VERSION_RE = /^20[0-9]{2}-[0-9]{2}-[0-9]{2}\.[a-z]{3,20}$/;
/* THE OLDEST VERSION READ RIGHT HERE: 2025-03-31.basil added invoices' parent.subscription_details and line items' pricing.price_details,
   removing the old top-level fields (docs.stripe.com/changelog/basil/2025-03-31/adds-new-parent-field-to-invoicing-objects and
   .../invoice-pricing-configurations), and Managed Payments needs it too; an older pin answers 500 rather than misread. */
const STRIPE_VERSION_FLOOR = "2025-03-31";
const STRIPE_KINDS = Object.freeze(["lead", "desk", "desk-only"]);
const STRIPE_ORIGINS = Object.freeze({ subscription_create: "first", subscription_cycle: "renewal", subscription_update: "rise" });
/* A SUBSCRIPTION WHOSE MONEY IS LATE (Grok's review 6, finding 5B): a paid invoice moves it to active, so a payment that reads it in
   one of these is retried until it has, where a hold would strand the buyer for good (no later renewal makes a subscription known);
   any other status but active and trialing (canceled, incomplete_expired, paused) is held for Max. */
const STRIPE_LATE = Object.freeze(["past_due", "unpaid", "incomplete"]);
const STRIPE_EVENTS = Object.freeze({ "checkout.session.completed": "bind", "invoice.paid": "payment", "customer.subscription.updated": "status",
  "customer.subscription.deleted": "cancel", "charge.refunded": "refund", "charge.dispute.created": "refund", "charge.dispute.closed": "refund" });
/* Stripe's ids: a prefix and letters and digits (Checkout Sessions carry cs_test_ or cs_live_). */
const SID = Object.freeze({ evt: /^evt_[A-Za-z0-9]{8,64}$/, cs: /^cs_(test|live)_[A-Za-z0-9]{8,120}$/, in: /^in_[A-Za-z0-9]{8,64}$/,
  sub: /^sub_[A-Za-z0-9]{8,64}$/, ch: /^(ch|py)_[A-Za-z0-9]{8,64}$/, du: /^du_[A-Za-z0-9]{8,64}$/, pi: /^pi_[A-Za-z0-9]{8,64}$/,
  pm: /^pm_[A-Za-z0-9]{8,64}$/, price: /^price_[A-Za-z0-9]{8,64}$/ });
const ID_OF = Object.freeze({ bind: SID.cs, payment: SID.in, status: SID.sub, cancel: SID.sub });
const COUNTRY = /^[A-Z]{2}$/;
/* A licence's name where none was typed or one outside the bound was (the copywriter's, 2026-11-13,
   3a): Polish on a direct link, English on a Managed Payments one, told apart by the binding's managed flag. */
const STRIPE_ORG_DEFAULT = Object.freeze({ direct: "Organizacja", managed: "Organisation" });

const plain = v => !!v && typeof v === "object" && !Array.isArray(v);

function stripeProvider() {
  let memo = null;
  function config(env) {
    const id = [env.STRIPE_WEBHOOK_SECRET, env.STRIPE_API_KEY, env.STRIPE_PRICES, env.STRIPE_VERSION, env.STRIPE_MODE].map(String).join("\n");
    if (memo && memo.id === id) return memo.cfg;
    memo = { id, cfg: judgeConfig(env) };
    return memo.cfg;
  }
  function judgeConfig(env) {
    const secret = env.STRIPE_WEBHOOK_SECRET, key = env.STRIPE_API_KEY, version = env.STRIPE_VERSION;
    if (typeof secret !== "string" || !/^whsec_[\x21-\x7e]{8,200}$/.test(secret)) return null;
    if (typeof key !== "string" || !STRIPE_KEY_RE.test(key)) return null; /* plant:stripe-key-restricted */
    const mode = env.STRIPE_MODE;
    if (mode !== "test" && mode !== "live") return null;
    if (key.slice(3, 4 + mode.length) !== mode + "_") return null; /* plant:stripe-mode-key */
    if (typeof version !== "string" || !STRIPE_VERSION_RE.test(version)) return null; /* plant:stripe-version */
    if (version.slice(0, 10) < STRIPE_VERSION_FLOOR) return null; /* plant:stripe-version-floor */
    let prices;
    try { prices = typeof env.STRIPE_PRICES === "string" ? JSON.parse(env.STRIPE_PRICES) : null; } catch { return null; }
    if (!plain(prices) || !Object.entries(prices).every(([p, k]) => SID.price.test(p) && STRIPE_KINDS.includes(k))) return null;
    return { secret, key, version, mode, live: mode === "live", prices: new Map(Object.entries(prices)) };
  }

  /** The Stripe-Signature header as {t, v1: [..]}, or null where it holds no t or no v1: unknown entries and v0 passed over. */
  function signatureOf(headers) {
    const header = headers.get("stripe-signature");
    if (typeof header !== "string" || header.length > 2000) return null;
    let t = null; const v1 = [];
    for (const part of header.split(",")) {
      const eq = part.indexOf("=");
      if (eq < 0) continue;
      const k = part.slice(0, eq).trim(), v = part.slice(eq + 1).trim();
      if (k === "t") { if (t !== null || !/^[0-9]{1,12}$/.test(v)) return null; t = v; }
      else if (k === "v1" && /^[0-9a-f]{64}$/.test(v)) v1.push(v); /* plant:stripe-v1-only */
    }
    if (t === null || v1.length < 1 || v1.length > 8) return null;
    return { t: Number(t), ts: t, v1 };
  }
  /* A rise or renewal before its binding is judged young from this delivery's signature time, which the route has already required to be
     within five minutes of the service clock. Kept by invoice id, and only after the signature holds. */
  const notes = new Map();
  function remember(sig, raw) {
    try {
      const ev = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(raw));
      if (!plain(ev) || ev.type !== "invoice.paid" || !plain(ev.data) || !plain(ev.data.object)) return;
      const id = ev.data.object.id;
      if (typeof id !== "string" || !SID.in.test(id) || !Number.isSafeInteger(ev.created) || !Number.isSafeInteger(sig.t)) return;
      notes.set(id, { at: sig.t * 1000, occurred: ev.created * 1000 });
      if (notes.size > 32) notes.delete(notes.keys().next().value);
    } catch { /* a body that is not an event is not a rise */ }
  }
  const verify = async (cfg, sig, raw) => {
    const ok = await hmacHolds(cfg.secret, joined(sig.ts + ".", raw), sig.v1);
    if (ok) remember(sig, raw);
    return ok;
  };

  /** The event as Stripe sends it, as {id, type, occurred, data: the object}, or null where it is not one this route reads. */
  function eventOf(raw) {
    let ev;
    try { ev = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(raw)); } catch { return null; }
    if (!plain(ev) || typeof ev.id !== "string" || !SID.evt.test(ev.id) || typeof ev.type !== "string" || !/^[a-z_.]{3,80}$/.test(ev.type)
        || !Number.isSafeInteger(ev.created) || !plain(ev.data) || !plain(ev.data.object) || typeof ev.data.object.id !== "string"
        || ev.data.object.id.length > 160) return null;
    const act = STRIPE_EVENTS[ev.type];
    if (act && ID_OF[act] && !ID_OF[act].test(ev.data.object.id)) return null;
    if (act === "refund" && !(ev.type === "charge.refunded" ? SID.ch : SID.du).test(ev.data.object.id)) return null;
    return { id: ev.id, type: ev.type, occurred: new Date(ev.created * 1000).toISOString(), data: ev.data.object, live: ev.livemode };
  }
  /** Whether an event is of this deployment's mode: its livemode, which every Stripe event carries, the mode's. */
  const modeHolds = (cfg, ev) => ev.live === cfg.live; /* plant:stripe-mode-event */
  /** Whether an object read back is of this deployment's mode. */
  const sameMode = (cfg, o) => plain(o) && o.livemode === cfg.live;
  const classify = ev => (STRIPE_EVENTS[ev.type] ? { act: STRIPE_EVENTS[ev.type], id: ev.data.id, type: ev.type } : null);

  /** GET a path from Stripe's API with the restricted key and the pinned version: the object, or null where Stripe has none. */
  const get = (io, cfg, path) => io.getJson(STRIPE_API + path, { authorization: "Bearer " + cfg.key, "stripe-version": cfg.version });
  const list = async (io, cfg, path) => {
    const doc = await get(io, cfg, path);
    if (doc === null) return null;
    if (!Array.isArray(doc.data)) throw io.retry("no list");
    return doc;
  };

  /** A Checkout Session read back: {subscription, code, managed}, or {held}; a retry while it is not complete. */
  async function readBinding(io, cfg, id) {
    const s = await get(io, cfg, "/checkout/sessions/" + id);
    if (s === null || s.id !== id) return { held: "not-found" };
    if (!sameMode(cfg, s) || !id.startsWith("cs_" + cfg.mode + "_")) return { held: "livemode" }; /* plant:stripe-mode-read */
    if (s.status !== "complete") throw io.retry("session " + s.status);
    if (s.mode !== "subscription") return { held: "session-mode" };
    if (typeof s.subscription !== "string" || !SID.sub.test(s.subscription)) return { held: "subscription" };
    /* The organisation's name, an optional text field keyed "org" on the team links (the design's 10.8); pay.mjs bounds it. */
    const field = Array.isArray(s.custom_fields) ? s.custom_fields.find(f => plain(f) && f.key === "org" && f.type === "text") : null;
    const org = field && plain(field.text) ? field.text.value : undefined; /* plant:stripe-org-read */
    return { subscription: s.subscription, code: s.client_reference_id, managed: plain(s.managed_payments) && s.managed_payments.enabled === true, org };
  }

  /** The payment intents that paid an invoice, by "List all payments for an invoice". */
  async function intentsOf(io, cfg, invoiceId) {
    const pays = await list(io, cfg, "/invoice_payments?invoice=" + encodeURIComponent(invoiceId));
    return pays ? [...new Set(pays.data.filter(x => plain(x) && plain(x.payment) && typeof x.payment.payment_intent === "string" && SID.pi.test(x.payment.payment_intent))
      .map(x => x.payment.payment_intent))] : [];
  }
  /* A PAYMENT ALREADY GIVEN BACK (Grok's review 6, finding 1): a refund can reach the route before the invoice it refunds, and is then
     held, the payment not stored here yet; Stripe leaves the invoice "paid" and the subscription active after a refund, so the payment
     reads the charges of its own intents and grants nothing where one was refunded whole. */
  async function refundedWhole(io, cfg, intents) {
    for (const pi of intents) {
      const chs = await list(io, cfg, "/charges?payment_intent=" + encodeURIComponent(pi));
      if (chs && chs.data.some(ch => plain(ch) && ch.refunded === true)) return true;
    }
    return false;
  }

  /** The payment method that paid an invoice, as {billing, card}: the billing address's country and a card's own. */
  async function countryOf(io, cfg, intents) {
    if (!intents.length) return { billing: "-", card: "-" };
    const pi = await get(io, cfg, "/payment_intents/" + intents[0]);
    if (pi === null || typeof pi.payment_method !== "string" || !SID.pm.test(pi.payment_method)) return { billing: "-", card: "-" };
    const pm = await get(io, cfg, "/payment_methods/" + pi.payment_method);
    const billing = pm && plain(pm.billing_details) && plain(pm.billing_details.address) && COUNTRY.test(String(pm.billing_details.address.country))
      ? pm.billing_details.address.country : "-";
    const card = pm && plain(pm.card) && COUNTRY.test(String(pm.card.country)) ? pm.card.country : "-";
    return { billing, card };
  }

  /* A day, the length of pay.mjs UNKNOWN_RETRY_MS (that constant is DAY). The note is dropped as it is read. */
  function riseUnboundYoung(id) {
    const n = notes.get(id);
    notes.delete(id);
    return !!n && Number.isFinite(n.at) && Number.isFinite(n.occurred) && n.at - n.occurred < 24 * 3600000;
  }

  /** An invoice paid, read back: {subscription, status, origin, periodEnd, code, items, applied}, or {held}; a retry where it is not
   *  paid yet, a first one whose subscription is not yet bound, or a rise or renewal still inside that day of its own time. */
  async function readPayment(io, cfg, id, look) {
    const inv = await get(io, cfg, "/invoices/" + id);
    if (inv === null || inv.id !== id) return { held: "not-found" };
    if (!sameMode(cfg, inv)) return { held: "livemode" };
    if (inv.status !== "paid") throw io.retry("invoice " + inv.status); /* plant:stripe-paid */
    const origin = STRIPE_ORIGINS[inv.billing_reason];
    if (!origin) return { held: "origin" }; /* plant:stripe-origin */
    const subId = plain(inv.parent) && plain(inv.parent.subscription_details) ? inv.parent.subscription_details.subscription : undefined;
    if (typeof subId !== "string" || !SID.sub.test(subId)) return { held: "subscription" };
    /* From here a hold names the subscription it read, so pay.mjs names its buyer too (board 1020, F2). */
    const heldOn = reason => ({ held: reason, subscription: subId }); /* plant:stripe-held-sub */
    const lines = plain(inv.lines) && Array.isArray(inv.lines.data) ? inv.lines.data : [];
    if (!lines.length || (plain(inv.lines) && inv.lines.has_more === true)) return heldOn("lines");
    const priceOf = l => (plain(l.pricing) && plain(l.pricing.price_details) ? l.pricing.price_details.price : undefined);
    if (!lines.every(l => plain(l) && plain(l.parent) && l.parent.type === "subscription_item_details" && cfg.prices.has(priceOf(l)))) /* plant:stripe-line-one-time */
      return heldOn("price");
    const ends = lines.map(l => (plain(l.period) ? l.period.end : NaN));
    if (!ends.every(e => Number.isSafeInteger(e) && e > 0)) return heldOn("period");
    /* The period's end: the latest any line reaches. A renewal may carry the rest of the old period's change (Stripe's default
       create_prorations), whose line ends at the old end, beside the new period's line (the test architect's read of e01e2b37, F1). */
    const periodEnd = Math.max(...ends) * 1000;
    const s = await get(io, cfg, "/subscriptions/" + subId);
    if (s === null || s.id !== subId) return heldOn("not-found");
    if (STRIPE_LATE.includes(s.status)) throw io.retry("subscription " + s.status); /* plant:stripe-late-retry */
    if (s.status !== "active" && s.status !== "trialing" && s.status !== "canceled") return heldOn("subscription-status"); /* plant:stripe-canceled-payment */
    if (!plain(s.items) || !Array.isArray(s.items.data) || s.items.data.length > 100 || s.items.has_more === true) return heldOn("items");
    const items = s.items.data.map(it => ({ price: plain(it) && plain(it.price) ? it.price.id : undefined, quantity: plain(it) ? it.quantity : undefined }));
    /* ONE PAID DATE PER SUBSCRIPTION (Grok alpha's review of 2026-11-22, A3): a subscription whose prices recur on different intervals (a
       monthly price and a yearly one) has no one date true of all its seats, so its payment is held "intervals" for Max and changes nothing. */
    const intervals = new Set(s.items.data.map(it => (plain(it) && plain(it.price) && plain(it.price.recurring) && typeof it.price.recurring.interval === "string"
      ? it.price.recurring.interval + "/" + (Number.isSafeInteger(it.price.recurring.interval_count) ? it.price.recurring.interval_count : 1) : null)).filter(Boolean));
    if (intervals.size > 1) return heldOn("intervals"); /* plant:stripe-one-end */
    const bound = await look.binding(subId);
    if (!bound) {
      if (origin === "first") throw io.retry("unbound"); /* plant:stripe-unbound-retry */
      if (origin !== "first" && riseUnboundYoung(id)) throw io.retry("unbound"); /* plant:stripe-rise-unbound */
      return heldOn("unbound");
    }
    const intents = inv.total === 0 ? [] : await intentsOf(io, cfg, id);
    if (await refundedWhole(io, cfg, intents)) return heldOn("refunded"); /* plant:stripe-refunded-payment */
    let applied = "applied";
    if (inv.total === 0) applied = "zero-total:" + (Array.isArray(inv.discounts) && typeof inv.discounts[0] === "string" ? inv.discounts[0] : "no-discount");
    else if (origin === "first" && bound.managed !== 1) { /* plant:stripe-managed-skip */
      const c = await countryOf(io, cfg, intents); /* plant:stripe-country-read */
      if (c.billing !== "PL") applied = "country:" + c.billing + "/" + c.card;
    }
    /* What this invoice bills (pay.mjs caps the seats by it, Grok's review 6, finding 2): its lines' quantities, a credit (a negative
       amount, a proration's unused time) left out; a proration's line for the time remaining carries the whole new quantity. */
    const billed = lines.filter(l => !(Number.isSafeInteger(l.amount) && l.amount < 0)).map(l => ({ price: priceOf(l), quantity: l.quantity })); /* plant:stripe-billed-lines */
    return { subscription: subId, status: s.status, origin, periodEnd, code: bound.code, items, billed, wholeRise: true, applied,
      teamOrg: typeof bound.org === "string" ? bound.org : undefined, defaultOrg: bound.managed === 1 ? STRIPE_ORG_DEFAULT.managed : STRIPE_ORG_DEFAULT.direct };
  }

  async function readSubscription(io, cfg, id) {
    const s = await get(io, cfg, "/subscriptions/" + id);
    if (s === null || s.id !== id) return null;
    return { status: s.status };
  }

  /** The invoice a charge paid, through its payment intent: {invoice}, or {held}. */
  async function invoiceOfCharge(io, cfg, ch) {
    if (typeof ch.payment_intent !== "string" || !SID.pi.test(ch.payment_intent)) return { held: "no-invoice" };
    const pays = await list(io, cfg, "/invoice_payments?payment%5Btype%5D=payment_intent&payment%5Bpayment_intent%5D=" + encodeURIComponent(ch.payment_intent));
    const invs = pays ? [...new Set(pays.data.filter(x => plain(x) && typeof x.invoice === "string").map(x => x.invoice))] : [];
    if (invs.length === 0) return { held: "no-invoice" };
    if (invs.length > 1) return { held: "several-invoices" }; /* plant:stripe-several-invoices */
    return { invoice: invs[0] };
  }

  /** A charge refunded, or a dispute: {subscription, payment} where the money went back whole, {listed} for a dispute closed in our
   *  favour or as a warning, else {held}. */
  async function readRefund(io, cfg, id, what) {
    let chargeId, dispute = null;
    if (what.type === "charge.dispute.created") return { held: "dispute:opened" }; /* plant:stripe-dispute-opened */
    if (what.type === "charge.dispute.closed") {
      const d = await get(io, cfg, "/disputes/" + id);
      if (d === null || d.id !== id) return { held: "not-found" };
      if (d.status === "won" || d.status === "warning_closed") return { listed: "dispute:" + d.status };
      if (d.status !== "lost") return { held: "dispute:" + (typeof d.status === "string" && /^[a-z_]{1,32}$/.test(d.status) ? d.status : "unnamed") }; /* plant:stripe-dispute-lost */
      chargeId = d.charge;
      if (typeof chargeId !== "string" || !SID.ch.test(chargeId)) return { held: "not-found" };
      dispute = d;
    } else chargeId = id;
    const ch = await get(io, cfg, "/charges/" + chargeId);
    if (ch === null || ch.id !== chargeId) return { held: "not-found" };
    if (!sameMode(cfg, ch)) return { held: "livemode" };
    if (what.type === "charge.refunded" && !(ch.refunded === true && ch.amount_refunded === ch.amount)) return { held: "refund:partial" }; /* plant:stripe-refund-full */
    /* A refund must be whole, and a dispute can be partial: one lost for less than the charge is held (the test architect's read). */
    if (dispute && !(Number.isSafeInteger(dispute.amount) && dispute.amount === ch.amount)) return { held: "dispute:partial" }; /* plant:stripe-dispute-whole */
    const f = await invoiceOfCharge(io, cfg, ch);
    if (f.held) return f;
    const inv = await get(io, cfg, "/invoices/" + f.invoice);
    const subId = inv && plain(inv.parent) && plain(inv.parent.subscription_details) ? inv.parent.subscription_details.subscription : undefined;
    if (typeof subId !== "string" || !SID.sub.test(subId)) return { held: "subscription" };
    return { subscription: subId, payment: f.invoice, origin: STRIPE_ORIGINS[inv.billing_reason] };
  }

  return Object.freeze({ name: "stripe", config, signatureOf, verify, eventOf, classify, modeHolds, readBinding, readPayment, readSubscription, readRefund });
}

/* THE CUSTOMER PORTAL (board 1020: an owner who already pays adds seats as a change of quantity on their one subscription): STRIPE_PORTAL, a
   variable and no secret, is the portal's no-code login link from Stripe's Dashboard, where the customer signs in with the e-mail address
   they paid with and changes the quantity, which Stripe bills as a subscription_update invoice (the rise readPayment reads). Read by the
   lead engineer's builder from the link's shape as Stripe issues it, https://billing.stripe.com/p/login/ then an id, test_ before it in
   test mode, not checked against an account. Only such a link of this deployment's STRIPE_MODE is handed (pay.mjs buyerFacts); anything
   else is no portal, never a fault, since nothing a payment does depends on it. The service mints no portal session: its key writes nothing.
   THE PORTAL'S OWN SETTINGS, which Max sets in Stripe's Dashboard before this link is handed (the test architect's read of 23f51b9d, F4;
   that read's own reading of Stripe's options, not checked against an account): it must invoice prorations at once, so that a change of
   quantity raises a paid subscription_update invoice and the seats land then (readPayment's "seats are what this payment billed" gives
   nothing until a payment bills them, so under any other setting bought seats wait for the renewal, perhaps a year); and it must not
   offer a switch between the desk-only and the team prices, which the route holds "kind-changed". */
const STRIPE_PORTAL_RE = /^https:\/\/billing\.stripe\.com\/p\/login\/(test_)?[A-Za-z0-9]{8,64}$/;
function stripePortal(env) {
  const v = env ? env.STRIPE_PORTAL : undefined;
  const m = typeof v === "string" ? STRIPE_PORTAL_RE.exec(v) : null;
  if (!m || (env.STRIPE_MODE !== "test" && env.STRIPE_MODE !== "live")) return null;
  return (env.STRIPE_MODE === "test") === (m[1] === "test_") ? v : null; /* plant:stripe-portal-mode */
}

export { stripeProvider, stripePortal, STRIPE_API, STRIPE_EVENTS };
