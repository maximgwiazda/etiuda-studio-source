/* THE PAYMENT CORE (Claude alpha's decision 48, 2026-11-13: one shared core, two providers; the design's section 10.4).
 *
 *     POST <API_PREFIX>pay/<provider>      a provider's notification, its raw body signed as that provider signs
 *
 * THE CRITERION, the service's own: a customer who buys ends up, with no hand of ours, holding a licence Studio accepts. Bounded:
 * a payment changes a licence only through what the provider's API says when read back, each event and each payment applies once,
 * and anything unclear is held for Max and changes nothing.
 *
 * THE SPLIT. This file keeps everything a payment does to the record, whoever took it: the order of the checks, the shared writes
 * (attach.mjs's statements), the seat difference against pay_subs, the floor of one, the grace, sole source, held and once. A
 * provider (pay-paddle.mjs, and a second beside it) gives only what is its own: its configuration, `signatureOf` and `verify`,
 * `eventOf` and `classify` (what an event is, and the id it names), and the reads (`readPayment`, `readSubscription`,
 * `readRefund`), each answering one normalised record, a {held: reason}, or a retry.
 *
 * WHICH PROVIDERS ANSWER. PAY_PROVIDERS, a variable, names those switched on, comma-separated; a provider not named, and every one
 * where the variable is unset or empty, answers "not there" (404), as a route that does not exist does, and reads nothing (Claude
 * alpha's condition: the provider not chosen stays dead-safe behind an unset variable). A name no provider has is a misconfigured
 * Worker: every payment route answers 500, so a provider retries.
 *
 * WHY IT IS NOT A SIGNED ROUTE. core.mjs route() hands it the request before ROUTES and before the delegation's window: a provider
 * signs with an HMAC, not Ed25519; its body may pass BODY_MAX; and a payment never waits on our signing key.
 *
 * AN UNSIGNED REQUEST COSTS NOTHING: no signature header, or one whose time is outside SIGNATURE_WINDOW_S, is refused before the
 * body is read; the body is read to PAY_BODY_MAX and no further; and nothing touches D1 or the provider until the signature holds.
 *
 * THE WEBHOOK IS A DOORBELL: a valid signature proves the provider rang; what is done is what its API says when read back, never
 * the body, so a leaked webhook secret mints nothing and an event out of order applies the provider's current state.
 *
 * WHAT EACH KIND OF EVENT DOES:
 *   payment   the read must be a payment completed (else 500, retried), of a subscription active or trialing; its origin first (the
 *             subscription new here), renewal or rise (the subscription known here, by the same buyer); a period end; every item a
 *             recurring price the provider's price map names; the buyer's sign-in code, one a person holds; never a payment the
 *             provider shows given back whole, since its refund may have come first and been held. A first purchase is one
 *             batch (attach.mjs): the buyer's organisation's paid licence raised in place, or a new one made, paid until the period's
 *             end plus GRACE_DAYS, never shortened, its seats added; the buyer's trial superseded and their seat and keys moved. A
 *             known subscription's renewal or rise (one paid here before, or one Max attached by hand, attach-seats.mjs --paddle-sub)
 *             moves the seats of the licence pay_subs names by its quantities now against what it held, never below one, and extends
 *             its dates. Either applies once per payment (orders, tag <provider>:<payment id>).
 *   bind      a provider that names the buyer only at checkout (Stripe's client_reference_id on the Checkout Session): the
 *             subscription bound to that code, and whether its link was Managed Payments, in pay_binds, once; a first payment of a
 *             subscription not yet bound answers 500 and is retried until it is, and the payment then reads the code from there.
 *   status    the subscription's status recorded, nothing else: seats change only on money received, and a row not paying turns paying
 *             only by a payment applied, never by a status event (C5 of Grok alpha's review, 2026-11-22).
 *   cancel    the read's status must be "canceled" (else 500); where another source pays, this subscription's seats taken off; a
 *             licence it alone pays keeps every seat and lapses whole at paid_until, which a cancel never moves.
 *   refund    a full refund or a chargeback lost (a dispute closed lost), of the payment that began the subscription's current period
 *             or of a rise paid inside it, once per payment: the seats that payment paid for taken off and no more (Grok alpha's review
 *             of 2026-11-22, A2 and B4). Where the subscription's other payments still pay for seats it stays, to the end they cover,
 *             applied and listed "refund-part"; given back whole, the licence ended where this subscription is its sole source;
 *             otherwise paid_until and updates_until fall to what the sources still paying cover and the licence stays, applied and
 *             listed as "refund-one-source". A refund of a payment not stored here is held "payment-unknown", one of an older period
 *             "not-current-period", and a rise paid before the record kept its parts "refund-rise".
 * A TOTAL OF ZERO (a full discount, a trial on a price) is applied as any other and listed as "zero-total:<discount id>".
 * ONE SUBSCRIPTION PER LICENCE (Max, 2026-11-19 03:46: "Yes, one subscription per licence."): more seats are a rise of the subscription a licence
 * has, never a second one. A first payment whose licence already has a PAYING subscription, one the provider calls active or trialing
 * (Claude alpha, 2026-11-19), is held "second-subscription" and changes nothing, in the same batch that would have raised it
 * (orderWhere), so a race holds it too. A subscription that is not paying (cancelled, past due, unpaid, paused, incomplete or expired,
 * refunded) blocks nothing: bought again with paid time left, or after a card failed, the licence takes the new one beside the old, which
 * keeps its seats to its own date, so the sums below still count a row that has time left, and none past it, whatever it is called (A1). The old one recovering its payment while the
 * new is live is the second live subscription: its renewal or rise is held "second-subscription" too, no seat changed, listed for Max
 * to refund and cancel at the provider. The operator's attach (attach-seats.mjs --paddle-sub) is Max's own act and is not refused.
 * A TEAM IS ITS LEAD'S OWN (decision 47, held for Max's ruling, in place of decision 45's hold): a first payment whose buyer's
 * organisation already holds a paid licence the buyer does not own makes a licence of the buyer's own, admitting them by name alone.
 *
 * HELD is a row in pay_events with outcome "held:<reason>", answered 200 so the provider does not retry; nothing else is written
 * ("held" keeps one meaning everywhere, Claude alpha 2026-11-13). Max's list is every held row and every outcome in PAY_LISTED.
 * ANSWERS: a bad signature or a body of the wrong shape 401; an event seen before 200 at once; the provider's API unreachable,
 * refusing the key or answering in a shape not read, or D1 failing, 500 with nothing kept (every write is one batch); else 200.
 */
import { attachStatements, statement } from "./attach.mjs";

/* The providers' SDKs default to between five seconds (Paddle's) and five minutes (Stripe's); a replay here is a no-op by the event
   id, the payment's tag and the state read back, so the window is the design's 300 seconds (Claude alpha's edit of 15:05). */
const SIGNATURE_WINDOW_S = 300;
const PAY_BODY_MAX = 65536, PAY_READ_MAX = 262144;
/* Two reads inside the providers' answering time (Paddle's five seconds). */
const PAY_TIMEOUT_MS = 2000;
/* "fourteen days' grace after the paid year" (2026-09-24 02:36), which also covers a renewal paid late and a provider's retries. */
const GRACE_DAYS = 14;
const DAY = 24 * 3600000;
/* How long a later payment of a subscription not known here is retried, from the provider's own event time: long enough for its first
   payment to land out of order, a Stripe binding's lag and an outage of ours; after it, held and listed (payment, review 47's finding 11). */
const UNKNOWN_RETRY_MS = DAY;
const PAY_KINDS = Object.freeze(["lead", "desk", "desk-only"]);
/* A new licence's name where the order page sent no organisation: the copywriter's word, both languages, is owed. */
const ORG_DEFAULT = "Etiuda";
const ORG_MAX = 200;
/* A NAME TYPED ON A PROVIDER'S PAGE (the design's 10.8), bound at the binding, or carried by Paddle's order (to ORG_MAX): trimmed,
   1 to ORG_TYPED_MAX characters, and none of the C0 or C1 controls, DEL, a bidirectional override, isolate or mark (LRM, RLM,
   ALM), a line or paragraph separator, or U+FEFF, so a name cannot reorder or break what Studio shows beside it. */
const ORG_TYPED_MAX = 100;
const orgCharBad = cp => cp <= 0x1f || (cp >= 0x7f && cp <= 0x9f) || (cp >= 0x202a && cp <= 0x202e) || (cp >= 0x2066 && cp <= 0x2069) || cp === 0xfeff
  || cp === 0x200e || cp === 0x200f || cp === 0x061c || cp === 0x2028 || cp === 0x2029;
/** {org} within the bound, {org: null} where none was typed, {org: null, bad: true} outside it. */
function typedOrg(v, max) {
  if (v === undefined || v === null) return { org: null };
  if (typeof v !== "string") return { org: null, bad: true };
  const t = v.trim();
  if (!t) return { org: null };
  const cps = Array.from(t);
  if (cps.length > (max || ORG_TYPED_MAX) || cps.some(ch => orgCharBad(ch.codePointAt(0)))) return { org: null, bad: true }; /* plant:pay-org-bound */
  return { org: t };
}
/* Outcomes applied and listed for Max beside every "held:" one, each a prefix: a full refund of one source on a licence another still
   pays for; a full refund of one payment of a subscription whose other payments still pay for seats; a payment completed at a total of zero; a direct sale whose payer's billing country is not the link's (the design's 10.6);
   a dispute closed in our favour or as a warning, which changes nothing; a binding whose typed organisation was outside the bound,
   the licence then taking the default name; and a licence its own subscription's refund ended, given back by that subscription's next
   period paid (knownSubscription). */
const PAY_LISTED = Object.freeze(["refund-one-source", "refund-part", "zero-total:", "country:", "dispute:", "org-name", "restored"]);

const plain = v => !!v && typeof v === "object" && !Array.isArray(v);
const dayOf = ms => new Date(ms).toISOString().slice(0, 10);
const retry = why => Object.assign(new Error("retry: " + why), { retry: true });
const reply = (status, obj) => new Response(JSON.stringify(obj), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const unsigned = () => reply(401, { ok: false, reason: "signature" });
const fault = () => reply(500, { ok: false, reason: "fault" });
const done = () => reply(200, { ok: true });
const notThere = () => new Response(null, { status: 404, headers: { "cache-control": "no-store" } });

/** The raw body, read to `max` bytes and no further: the bytes, or null where it is longer or absent. */
async function rawOf(request, max) {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const parts = [];
  let size = 0;
  for (;;) {
    const { done: end, value } = await reader.read();
    if (end) break;
    size += value.byteLength;
    if (size > max) { try { await reader.cancel(); } catch { /* gone already */ } return null; } /* plant:paddle-cap */
    parts.push(value);
  }
  const all = new Uint8Array(size);
  let at = 0;
  for (const p of parts) { all.set(p, at); at += p.byteLength; }
  return all;
}

/** HMAC-SHA256 under `secret` (its UTF-8 bytes) of `signed`, checked against each hex in `macs` by crypto.subtle.verify. */
async function hmacHolds(secret, signed, macs) {
  const enc = new TextEncoder();
  const k = await globalThis.crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  for (const h of macs) {
    const mac = Uint8Array.from(String(h).match(/../g) || [], x => parseInt(x, 16));
    if (await globalThis.crypto.subtle.verify("HMAC", k, mac, signed)) return true; /* plant:paddle-hmac */
  }
  return false;
}
/** `head` then the raw body, as one array: what a provider's HMAC is taken over. */
function joined(head, raw) {
  const h = new TextEncoder().encode(head), data = new Uint8Array(h.length + raw.length);
  data.set(h, 0); data.set(raw, h.length);
  return data;
}

/* A SUBSCRIPTION'S SEATS COUNT ONLY WHILE IT IS PAID (Grok alpha's review of 2026-11-22, A1; Claudius's brief: "a subscription's seats count
   only while it is paid; past_due past its paid date counts nothing, whatever other subscriptions extend the licence"): a row whose own
   paid_until has passed holds no seat, whatever the provider's word for it. Before, only a cancelled row's lapsed, so a subscription past
   due, unpaid, paused or incomplete kept its seats for as long as another subscription kept the licence's date ahead. */
/** SQL predicate matching subscriptions on `licExpr` whose own paid_until has passed at `nowExpr`, cancelled or not. */
const passedWhere = (licExpr, nowExpr, exceptSql) => "pay_subs WHERE licence = " + licExpr + " AND paid_until <= " + nowExpr /* plant:pay-passed-any */
  + (exceptSql ? " AND NOT " + exceptSql : "");
/** SQL predicate matching live (unrefunded and not yet past their own paid_until) subscriptions on `licExpr` at `nowExpr`. */
const liveSubsWhere = (licExpr, nowExpr, exceptSql) => "pay_subs WHERE licence = " + licExpr
  + " AND status <> 'refunded' AND paid_until > " + nowExpr + (exceptSql ? " AND NOT " + exceptSql : ""); /* plant:pay-live-paid */
/** SQL predicate: a subscription that is paying, the provider's own words for it (Paddle and Stripe agree: active, trialing). Only a paying one blocks a
 *  second subscription for its licence (first payments, orderWhere) and is what a recovering old one is held beside (knownSubscription). */
const payingWhere = alias => (alias ? alias + "." : "") + "status IN ('active', 'trialing')"; /* plant:pay-paying-status */
/** SQL predicate: subscription `s` paying on licence `l`, which `ownerSql` owns, not refunded and not a trial, whatever its paid date. It is
 *  what holds a person's second purchase "second-subscription" (a first payment's outcome) and, the same words, what tells that person
 *  they already pay (buyerFacts), so whatever would be held is exactly what Buy is told to refuse (board 1020; the test architect's read
 *  of 23f51b9d, F1). A licence the purchase would raise is already neither refunded nor a trial (attach.mjs PAID), so the two last
 *  conditions change nothing there. */
const ownedPayingWhere = (s, l, ownerSql) => l + ".owner IS " + ownerSql + " AND " + payingWhere(s) + " AND " + l + ".refunded = 0 AND " + l + ".trial_ends IS NULL";
const subOnlyExpr = rowPrefix => {
  const pre = rowPrefix ? rowPrefix + "." : "";
  return "(substr(" + pre + "key_hash, 1, 7) IN ('paddle:', 'stripe:') AND COALESCE(" + pre + "invoiced_until, 0) = 0)";
};
const baseInForceCol = (col, licExpr, nowExpr, rowPrefix) => {
  const p = (rowPrefix ? rowPrefix + "." : "") + col;
  return "MAX(1, " + p + " - COALESCE((SELECT SUM(" + col + ") FROM " + passedWhere(licExpr, nowExpr) + "), 0))"; /* plant:pay-in-force */
};
/** SQL expression for a licence's `col` (`seats` or `lead_seats`) in force at `nowExpr`: stored count less passed cancelled subscriptions, never
 *  below one; for lead seats alone, 0 where the licence is subscription-only and its live subscriptions hold none. */
/* THE OWNER'S DESK COMES WITH THE LEAD SEAT (review 47's finding 3; Claude alpha, about 14:30 on 2026-11-18, his C3: "(b), main's desk floor of one: a
   lead-only purchase is a valid licence and the owner's own desk comes with the lead seat"): desk seats keep the floor of one, as a new licence
   is written with (Math.max(1, desk)), so a licence file always states a seat Studio reads; review 44's mend 5 counts lead seats from live
   subscriptions only. */
const inForceCol = (col, licExpr, nowExpr, rowPrefix, exceptSql) => {
  const p = (rowPrefix ? rowPrefix + "." : "") + col;
  const base = exceptSql
    ? "MAX(1, " + p + " - COALESCE((SELECT SUM(" + col + ") FROM " + passedWhere(licExpr, nowExpr, exceptSql) + "), 0))"
    : baseInForceCol(col, licExpr, nowExpr, rowPrefix);
  if (col !== "lead_seats") return base; /* plant:pay-desk-floor */
  const liveSum = "(SELECT COALESCE(SUM(" + col + "), 0) FROM " + liveSubsWhere(licExpr, nowExpr, exceptSql) + ")";
  return "(CASE WHEN " + subOnlyExpr(rowPrefix) + " AND EXISTS (SELECT 1 FROM " + liveSubsWhere(licExpr, nowExpr, exceptSql) + ") AND " + liveSum + " = 0 " /* plant:pay-live-floor */
    + "THEN 0 ELSE " + base + " END)";
};
/** The licence's lead and desk counts in force at `now`. */
async function inForceOf(db, row, now) {
  if (!db || row.id === undefined) return { seats: row.seats, lead_seats: row.lead_seats };
  return (await db.prepare("SELECT " + inForceCol("seats", "id", "?2") + " AS seats, " + inForceCol("lead_seats", "id", "?2")
    + " AS lead_seats FROM licences WHERE id = ?1").bind(row.id, now).first()) || { seats: row.seats, lead_seats: row.lead_seats };
}
/** Statements settling the subscriptions on licence `L(q)` whose paid time has passed at `now`, cancelled or not, guarded by `G(q)` if given. */
function settleStatements(L, now, G, except) {
  const g = q => (G ? " AND " + G(q) : "");
  const ex = q => (except ? "(provider = " + q(except.provider) + " AND sub = " + q(except.sub) + ")" : "");
  const s = q => g(q) + (except ? " AND NOT " + ex(q) : "");
  return [
    statement(q => "UPDATE licences SET seats = MAX(1, " + inForceCol("seats", "licences.id", q(now), undefined, ex(q)) + "), " /* plant:pay-settle-lic */
      + "lead_seats = MAX(1, " + inForceCol("lead_seats", "licences.id", q(now), undefined, ex(q)) + ")"
      + " WHERE id = " + L(q) + " AND EXISTS (SELECT 1 FROM " + passedWhere(L(q), q(now), ex(q)) + " AND (seats > 0 OR lead_seats > 0))" + g(q)),
    statement(q => "UPDATE pay_subs SET seats = 0, lead_seats = 0, updated_at = " + q(now) /* plant:pay-settle-zero */
      + " WHERE licence = " + L(q) + " AND paid_until <= " + q(now) + " AND (seats > 0 OR lead_seats > 0)" + s(q)),
  ];
}

/** The providers PAY_PROVIDERS switches on: a Set, empty where unset or empty, null where it names one no provider is. */
function providersOn(env, known) {
  const v = env ? env.PAY_PROVIDERS : undefined;
  if (v === undefined || v === null || v === "") return new Set();
  if (typeof v !== "string") return null;
  const names = v.split(",").map(s => s.trim()).filter(Boolean);
  if (!names.every(n => Object.prototype.hasOwnProperty.call(known, n))) return null;
  return new Set(names);
}

/** The route over `o.clock` (ms), `o.fetch` (the service's one way out), `o.timeoutMs` and `o.providers` ({name: provider}); core.mjs
 *  hands NO_KEY, PERSON, PERSONAL and SEAT_CODE_RE as `o.consts`. */
function makePayRoute(o) {
  const clock = o.clock, fetchOut = o.fetch, timeoutMs = o.timeoutMs || PAY_TIMEOUT_MS, providers = o.providers;
  const { NO_KEY, PERSON, PERSONAL, SEAT_CODE_RE, ORG_DESKS_DEFAULT } = o.consts;

  /* ---- the providers' APIs, read back ---------------------------------------------------------------------------------- */

  /** GET `url` with `headers`: the JSON document, null where the API answers 404, and a retry for anything else unread. */
  async function getJson(url, headers) {
    const ctl = typeof AbortController === "function" ? new AbortController() : null;
    let timer;
    const late = new Promise((_, no) => { timer = setTimeout(() => { if (ctl) ctl.abort(); no(retry("timeout")); }, timeoutMs); });
    try {
      const res = await Promise.race([fetchOut(url, { method: "GET", redirect: "manual", signal: ctl ? ctl.signal : undefined,
        headers: Object.assign({ accept: "application/json" }, headers) }), late]);
      if (res.status === 404) return null;
      if (!res.ok) throw retry("api " + res.status); /* plant:paddle-api-status */
      const text = await Promise.race([res.text(), late]);
      if (text.length > PAY_READ_MAX) throw retry("too long");
      let doc;
      try { doc = JSON.parse(text); } catch { throw retry("not json"); }
      if (!plain(doc)) throw retry("not an object");
      return doc;
    } catch (e) {
      throw e && e.retry ? e : retry("unreachable");
    } finally { clearTimeout(timer); }
  }
  const io = Object.freeze({ getJson, retry, plain });

  /* ---- the record ------------------------------------------------------------------------------------------------------- */

  /** An event-row statement whose outcome is SQL, for the end of a batch. Beside the outcome (board 1020, migrations/0028_buyer_facts.sql):
   *  what the route did with it (`act`, the classify's), the subscription it named where the route has learned it (c.sub), and, on a
   *  held row alone, the person whose sign-in code it carried (c.code), which that person's own programs read (buyerFacts). */
  const eventStatement = (c, outcomeSql) => {
    const s = statement(q => "INSERT INTO pay_events (provider, event_id, type, occurred_at, outcome, at, act, sub, person) SELECT " + q(c.p.name) + ", " + q(c.ev.id)
      + ", " + q(c.ev.type) + ", " + q(c.ev.occurred) + ", o.v, " + q(c.now) + ", " + q(c.what ? c.what.act : null) + ", " + q(typeof c.sub === "string" ? c.sub : null)
      + ", CASE WHEN o.v LIKE 'held:%' THEN " + (c.code ? "(SELECT person FROM persons WHERE code = " + q(c.code) + ")" : "NULL") + " END" /* plant:pay-event-person */
      + " FROM (SELECT " + outcomeSql(q) + " AS v) o WHERE true ON CONFLICT (provider, event_id) DO NOTHING");
    return c.db.prepare(s.sql).bind(...s.values);
  };
  const eventRow = (c, outcome) => eventStatement(c, q => q(outcome));
  /* HELD: the event recorded with its reason, and nothing else written. */
  async function held(c, reason) {
    await eventRow(c, "held:" + reason).run();
    return done();
  }
  const bound = (db, list) => list.map(s => db.prepare(s.sql).bind(...s.values));
  const runId = () => { const b = new Uint8Array(12); globalThis.crypto.getRandomValues(b); return Array.from(b, x => x.toString(16).padStart(2, "0")).join(""); };

  /* ---- a payment ------------------------------------------------------------------------------------------------------- */

  /** What the subscription's items buy, by kind, or {held} naming why not. Every item a price the provider's map names. */
  function itemsOf(prices, items) {
    if (!Array.isArray(items) || items.length > 100) return { held: "items" };
    const n = { lead: 0, desk: 0, "desk-only": 0 };
    for (const it of items) {
      const kind = prices.get(it.price);
      if (!kind) return { held: "price" }; /* plant:paddle-price-known */
      if (!Number.isSafeInteger(it.quantity) || it.quantity < 1 || it.quantity > 10000) return { held: "quantity" };
      n[kind] += it.quantity;
    }
    if (n.lead + n.desk + n["desk-only"] === 0) return { held: "no-items" };
    if (n["desk-only"] > 0 && n.lead + n.desk > 0) return { held: "mixed" };
    return n;
  }
  /** What this payment's own lines bill, by kind, or {held}: per price the most any line bills, since a proration's line for the time
   *  remaining carries the whole new quantity beside the credit for the old (the provider leaves credits out). */
  function billedOf(prices, lines) {
    if (!Array.isArray(lines) || lines.length > 200) return { held: "lines" };
    const per = new Map();
    for (const l of lines) {
      if (!prices.get(l.price)) return { held: "price" }; /* plant:pay-billed-price */
      if (!Number.isSafeInteger(l.quantity) || l.quantity < 0 || l.quantity > 10000) return { held: "quantity" };
      per.set(l.price, Math.max(per.get(l.price) || 0, l.quantity));
    }
    const b = { lead: 0, desk: 0, "desk-only": 0 }, seen = { lead: false, desk: false, "desk-only": false };
    for (const [price, qty] of per) {
      const kind = prices.get(price);
      b[kind] += qty;
      seen[kind] = true;
    }
    return Object.assign(b, { seen });
  }

  /* A HOLD RAISED INSIDE readPayment (board 1020; the test architect's read of 23f51b9d, F2) names what the read had learned, as a hold
     after it does: the subscription, where the provider's read reached it, and the person, so the buyer's programs read a hold, not
     "pending" for a checkout whose money arrived. The person is the owner of the licence the subscription is recorded on, else the person
     it is recorded for, else the person whose code it was bound to, else the code the provider's read carried; one the service no longer
     keeps is nobody. A payment already given back whole ("refunded") holds no money and names nobody. */
  async function heldNames(c, r) {
    if (typeof r.subscription !== "string" || !r.subscription) return;
    c.sub = r.subscription;
    if (r.held === "refunded") return;
    const k = await c.db.prepare("SELECT COALESCE((SELECT o.code FROM pay_subs s JOIN licences l ON l.id = s.licence JOIN persons o ON o.person = l.owner WHERE s.provider = ?1 AND s.sub = ?2), "
      + "(SELECT o.code FROM pay_subs s JOIN persons o ON o.person = s.person WHERE s.provider = ?1 AND s.sub = ?2), "
      + "(SELECT o.code FROM pay_binds b JOIN persons o ON o.code = b.code WHERE b.provider = ?1 AND b.sub = ?2)) AS code").bind(c.p.name, r.subscription).first();
    const code = k && typeof k.code === "string" ? k.code : r.code;
    if (typeof code === "string" && SEAT_CODE_RE.test(code)) c.code = code;
  }

  async function payment(c, id) {
    const { db, p, cfg, now } = c, tag = p.name + ":" + id;
    if (await db.prepare("SELECT 1 AS o FROM orders WHERE tag = ?1").bind(tag).first()) {
      await eventRow(c, "once").run(); /* plant:paddle-once-read */
      return done();
    }
    const r = await p.readPayment(io, cfg, id, lookOf(c)); /* plant:paddle-doorbell */
    if (r.held) {
      await heldNames(c, r); /* plant:pay-held-buyer */
      return held(c, r.held);
    }
    const code = r.code;
    c.sub = r.subscription;
    if (typeof code !== "string" || !SEAT_CODE_RE.test(code)) return held(c, "code"); /* plant:paddle-code-shape */
    c.code = code;
    /* The name: a provider's own default where it gives one (Stripe's, by its link), else ORG_DEFAULT; then what the buyer named. */
    /* A NAME CARRIED ON THE ORDER (Paddle's custom_data.org) is judged as Stripe's binding judges a typed one (Grok's review 6, finding
       5A): none, blank or spaces takes the default; one outside the bound takes the default too, the payment applied and listed
       "org-name" where it makes a licence, never held, so no payer is stranded over a name. */
    let name = typeof r.defaultOrg === "string" ? r.defaultOrg : ORG_DEFAULT, applied = r.applied;
    if (r.org !== undefined) {
      const typed = typedOrg(r.org, ORG_MAX);
      if (typed.org) name = typed.org;
      else if (typed.bad && r.origin === "first" && applied === "applied") applied = "org-name"; /* plant:pay-org-default */
    }
    const n = itemsOf(cfg.prices, r.items);
    if (n.held) return held(c, n.held);
    /* SEATS ARE WHAT THIS PAYMENT BILLED (Grok's review 6, finding 2; "the larger licence issued only when payment lands", 2026-10-01
       17:29): the subscription's quantities now, never more than this payment's own lines bill, so items raised after the invoice was
       paid wait for the payment that bills them. A rise from a provider whose lines may bill only the difference (Paddle; its
       proration lines are not read at its pages) is held to what the subscription held before plus what this payment bills, in SQL. */
    const b = billedOf(cfg.prices, r.billed);
    if (b.held) return held(c, b.held);
    const onTop = r.origin === "rise" && r.wholeRise !== true;
    const capped = kind => (onTop ? n[kind] : Math.min(n[kind], b[kind])); /* plant:pay-billed-cap */
    const keepKind = kind => r.origin === "rise" && r.wholeRise === true && n[kind] > 0 && !b.seen[kind]; /* plant:pay-rise-keep-unbilled */
    const deskOnly = n["desk-only"] > 0; /* plant:paddle-desk-only */
    const lead = deskOnly ? 0 : keepKind("lead") ? null : capped("lead");
    const desk = deskOnly ? (keepKind("desk-only") ? null : capped("desk-only")) : (keepKind("desk") ? null : capped("desk"));
    if ((lead || 0) + (desk || 0) === 0) return held(c, "unbilled");
    const subId = r.subscription;
    /* An organisation typed on the provider's page, bound at the binding, names a team's new licence; a one-person licence ignores it. */
    if (!deskOnly && typeof r.teamOrg === "string" && r.teamOrg) name = r.teamOrg;

    const buyer = await db.prepare("SELECT person, provider FROM persons WHERE code = ?1").bind(code).first();
    if (!buyer) return held(c, "unknown-code"); /* plant:paddle-code-known */
    const row = await db.prepare("SELECT licence, person, status, paid_until FROM pay_subs WHERE provider = ?1 AND sub = ?2").bind(p.name, subId).first();
    if (r.origin === "first" && row) return held(c, "subscription-known"); /* plant:paddle-origin-row */
    /* AN UNKNOWN SUBSCRIPTION'S LATER PAYMENT is retried while its event is young, as one that came before its own first payment is; past
       UNKNOWN_RETRY_MS from the provider's own event time it is held and listed (review 47's finding 11, Claude alpha's words: "a renewal of a
       held first purchase is listed and answered 200 held, never 500 for ever"), so a first purchase held for Max leaves every later bill on
       his list. An event time that does not read as one is not young. */
    if (r.origin !== "first" && !row) {
      const at = Date.parse(c.ev.occurred);
      if (Number.isFinite(at) && now - at < UNKNOWN_RETRY_MS) throw retry("subscription-unknown"); /* plant:pay-unknown-retry */
      return held(c, "subscription-unknown"); /* plant:pay-unknown-held */
    }
    if (row && row.person !== buyer.person) return held(c, "buyer-differs");
    /* A MANAGED TENANT'S ACCOUNT (decision 49; Claude alpha, 2026-11-13 21:34: "a person of that tenant must never be able to pay for a
       licence they cannot then use"): a first purchase by an account of a tenant whose licence follows Entra is held and listed, changing
       nothing. The clients offer no Buy where the service has said the tenant is managed; this holds what still arrives. */
    if (!row && await db.prepare("SELECT 1 AS m FROM licences l JOIN admits a ON a.licence = l.id WHERE l.seat_source = 'entra' AND l.refunded = 0 "
      + "AND substr(a.org, 1, ?2) <> ?3 AND (EXISTS (SELECT 1 FROM seats s WHERE s.person = ?1 AND s.provider = a.provider AND s.org = a.org) "
      + "OR EXISTS (SELECT 1 FROM person_desks d JOIN persons p ON p.person = d.person WHERE d.person = ?1 AND p.provider = a.provider AND d.org = a.org)) LIMIT 1")
      .bind(buyer.person, PERSON.length, PERSON).first()) return held(c, "managed"); /* plant:pay-managed */
    const end = r.periodEnd + GRACE_DAYS * DAY, endDay = dayOf(end), run = runId();
    const k = { id, subId, code, row, lead, desk, deskOnly, end, endDay, tag, run, status: r.status, applied, origin: r.origin,
      onTop: onTop ? { lead: deskOnly ? 0 : b.lead, desk: deskOnly ? b["desk-only"] : b.desk } : null,
      subNow: { lead: n.lead, desk: deskOnly ? n["desk-only"] : n.desk } };
    if (row) return knownSubscription(c, k);
    /* A FIRST PURCHASE. The organisation: the buyer's lead seat, else their desk seat or desk sign-in (matching line 278's managed
       check), else the buyer by name (core.mjs personOf). */
    const seat = deskOnly ? null : await db.prepare("SELECT provider, org FROM seats WHERE person = ?1 ORDER BY (kind = 'lead') DESC LIMIT 1").bind(buyer.person).first() /* plant:pay-desk-org */
      || await db.prepare("SELECT p.provider AS provider, d.org AS org FROM person_desks d JOIN persons p ON p.person = d.person WHERE d.person = ?1 AND d.org IS NOT NULL ORDER BY d.signed_at DESC LIMIT 1").bind(buyer.person).first(); /* plant:pay-desk-org-pd */
    const orgPaid = deskOnly ? null
      : await db.prepare("SELECT l.id AS id, l.owner AS owner FROM admits a JOIN licences l ON l.id = a.licence WHERE a.provider = ?1 AND a.org = ?2 "
        + "AND l.trial_ends IS NULL AND l.refunded = 0 ORDER BY a.licence LIMIT 1").bind(seat ? seat.provider : buyer.provider, seat ? seat.org : PERSON + buyer.person).first();
    const ownPaid = deskOnly || (!!orgPaid && orgPaid.owner === buyer.person) ? null
      : await db.prepare("SELECT id FROM licences WHERE owner = ?1 AND desk_only = 0 AND trial_ends IS NULL AND refunded = 0 "
        + "AND NOT EXISTS (SELECT 1 FROM admits a WHERE a.licence = licences.id AND substr(a.org, 1, ?2) <> ?3) ORDER BY id LIMIT 1")
        .bind(buyer.person, PERSON.length, PERSON).first();
    /* A TEAM IS ITS LEAD'S OWN (board 1000; Claude alpha's decision 47, held for Max's ruling, in place of decision 45's hold): a buyer
       who does not own their organisation's paid licence buys a licence of their own, admitting them by name and no organisation, so
       unrelated buyers never share one; a later purchase raises their own team licence even if the organisation's first was refunded; its
       renewals and rises are a known subscription's. The hold it replaces, and its plant (plant:paddle-second-buyer), are retired. */
    const own = !!orgPaid && orgPaid.owner !== buyer.person; /* plant:paddle-own */
    const keepOwn = own || (!orgPaid && !!ownPaid); /* plant:pay-own-after-refund */

    const OWNER = q => "(SELECT person FROM persons WHERE code = " + q(code) + ")";
    const tenant = {
      provider: q => "COALESCE((SELECT provider FROM seats WHERE person = " + OWNER(q) + " ORDER BY (kind = 'lead') DESC LIMIT 1), (SELECT provider FROM persons WHERE code = " + q(code) + "))", /* plant:pay-desk-org-prov */
      org: q => "COALESCE((SELECT org FROM seats WHERE person = " + OWNER(q) + " ORDER BY (kind = 'lead') DESC LIMIT 1), (SELECT org FROM person_desks WHERE person = " + OWNER(q) + " AND org IS NOT NULL ORDER BY signed_at DESC LIMIT 1), " + q(PERSON) + " || " + OWNER(q) + ")", /* plant:pay-desk-org-sql */
    };
    /* The buyer's own licence admits the buyer by name alone, and is the one the buyer owns that admits no organisation. */
    const org = deskOnly ? null : keepOwn ? { provider: tenant.provider, org: q => q(PERSON) + " || " + OWNER(q) } : tenant; /* plant:paddle-own-admits */
    const ORG_PAID = q => "(SELECT a.licence FROM admits a JOIN licences l ON l.id = a.licence WHERE a.provider = " + tenant.provider(q) + " AND a.org = "
      + tenant.org(q) + " AND l.trial_ends IS NULL AND l.refunded = 0 ORDER BY a.licence LIMIT 1)";
    const OWN_PAID = q => "(SELECT id FROM licences WHERE owner = " + OWNER(q) + " AND desk_only = 0 AND trial_ends IS NULL AND refunded = 0 "
      + "AND NOT EXISTS (SELECT 1 FROM admits a WHERE a.licence = licences.id AND substr(a.org, 1, " + q(PERSON.length) + ") <> " + q(PERSON) + ") ORDER BY id LIMIT 1)";
    const made = attachStatements({ tag, run, now, code, deskOnly, org, noKey: NO_KEY, personPrefix: PERSON, personal: PERSONAL,
      paid: keepOwn ? OWN_PAID : undefined,
      /* The conditions read above, held again inside the statement that records the order (core.mjs's rule: nothing reads and
         then writes on a decision): the organisation's licence the buyer's own, or another's (or already owning one's own) for a licence of the buyer's own. */
      orderWhere: (q, e) => (deskOnly ? "" : keepOwn ? "(EXISTS (SELECT 1 FROM licences WHERE id = " + ORG_PAID(q) + " AND owner IS NOT " + e.OWNER(q) + ") OR " + OWN_PAID(q) + " IS NOT NULL) AND " : "NOT EXISTS (SELECT 1 FROM licences WHERE id = " + e.PAID(q) + " AND owner IS NOT " + e.OWNER(q) + ") AND ") /* plant:paddle-second-buyer-sql */
        + "NOT EXISTS (SELECT 1 FROM pay_subs WHERE provider = " + q(p.name) + " AND sub = " + q(subId) + ")"
        + " AND NOT EXISTS (SELECT 1 FROM pay_subs WHERE licence = " + e.PAID(q) + " AND " + payingWhere() + ")", /* plant:pay-one-subscription */
      /* The subscription is new here, so it held nothing before: its seats are added whole, after any passed cancelled subscriptions
         are settled; one whose paid time has run out holds no seat anybody pays for, so it starts from this purchase's (a sole
         subscription's cancel leaves its seats to lapse with it, Grok's review 6, finding 4). */
      raise: q => (deskOnly ? "" : "lead_seats = CASE WHEN paid_until <= " + q(now) + " THEN " + q(Math.max(1, lead)) + " WHEN " + subOnlyExpr("") + " THEN MAX(1, COALESCE((SELECT SUM(lead_seats) FROM " + liveSubsWhere("licences.id", q(now)) + "), 0) + " + q(lead) + ") ELSE lead_seats + " + q(lead) + " END, ") + "seats = CASE WHEN paid_until <= " + q(now) + " THEN " + q(Math.max(1, desk)) + " WHEN " + subOnlyExpr("") + " THEN MAX(1, COALESCE((SELECT SUM(seats) FROM " + liveSubsWhere("licences.id", q(now)) + "), 0) + " + q(desk) + ") ELSE seats + " + q(desk) + " END, " /* plant:pay-raise-lapsed */
        + "paid_until = MAX(paid_until, " + q(end) + "), updates_until = MAX(updates_until, " + q(endDay) + ")",
      fresh: { org: name, seats: q => q(Math.max(1, desk)), leadSeats: q => q(Math.max(1, lead)), paidUntil: q => q(end), updatesUntil: q => q(endDay), invoicedUntil: q => q(0), invoicedUpdatesUntil: q => q(null),
        orgDesks: deskOnly ? undefined : q => q(ORG_DESKS_DEFAULT ? 1 : 0) } });
    const E = made.expr;
    /* Settle any passed cancelled subscriptions on a still-paid licence, and zero all rows on a lapsed licence, before raise runs. */
    made.statements.splice(1, 0, ...settleStatements(E.PAID, now, E.G), statement(q => "UPDATE pay_subs SET seats = 0, lead_seats = 0, updated_at = " + q(now) + " WHERE licence = " + E.PAID(q)
      + " AND (SELECT paid_until FROM licences WHERE id = " + E.PAID(q) + ") <= " + q(now) + " AND " + E.G(q)));
    const sub = statement(q => "INSERT INTO pay_subs (provider, sub, licence, person, lead_seats, seats, paid_until, status, txn, updated_at) SELECT "
      + [q(p.name), q(subId), E.L(q), E.OWNER(q), q(lead), q(desk), q(end), q(r.status), q(id), q(now)].join(", ") + " WHERE " + E.G(q) + " ON CONFLICT (provider, sub) DO NOTHING");
    /* The first payment begins the subscription's first period (knownSubscription's "WHAT THIS PAYMENT PAID FOR"). */
    const part = statement(q => "UPDATE orders SET sub = " + q(subId) + ", part_of = " + q(id) + ", lead_added = " + q(lead) + ", desk_added = " + q(desk) + ", ends = " + q(end)
      + ", given_back = 0 WHERE tag = " + q(tag) + " AND run = " + q(run) + " AND " + E.G(q));
    await db.batch(bound(db, made.statements.concat([sub, part])).concat([eventStatement(c, q => "CASE WHEN " + E.G(q) + " THEN " + q(applied) + " "
      + "WHEN EXISTS (SELECT 1 FROM orders WHERE tag = " + q(tag) + ") THEN 'once' "
      + "WHEN EXISTS (SELECT 1 FROM pay_subs s JOIN licences l ON l.id = s.licence WHERE s.licence = " + E.PAID(q) + " AND " + ownedPayingWhere("s", "l", E.OWNER(q))
      + " AND NOT (s.provider = " + q(p.name) + " AND s.sub = " + q(subId) + ")) "
      + "THEN 'held:second-subscription' ELSE 'held:changed' END")]));
    return done();
  }

  /* A KNOWN SUBSCRIPTION's renewal or rise (Claude alpha, 2026-11-13: one Max attached by hand, scripts/attach-seats.mjs
     --paddle-sub, is "any known subscription"): the licence is the one pay_subs names, never the organisation's by lookup,
     so whose licence it raises was settled when the subscription became known. One batch moves that licence's seats by the subscription's
     quantities now against what it held, never below one, and extends its dates, applied once per payment. A notice for an earlier
     period than the subscription already holds writes no seat, and neither does an older notice whose count sits below the
     subscription's items while those items are still the count this period holds (review 4, finding 5). A rise inside the current
     period is not an earlier period. A reduction waits for a later period's payment; an addition in the period already paid lands
     at once, and the subscription row keeps the higher count so a renewal diffs against what was paid (review 4, findings 10 and 6).
     A rise for a subscription already refunded restores nothing, held and listed; a renewal is not that hold (review 4, finding 8). */
  async function knownSubscription(c, k) {
    const { db, p, now } = c;
    const lic = await db.prepare("SELECT desk_only, refunded, trial_ends FROM licences WHERE id = ?1").bind(k.row.licence).first();
    /* A NEW PERIOD PAID AFTER A REFUND (Grok's review 6, finding 5C): the key reads only, so a refund cannot stop the provider renewing,
       and a renewal held "licence-ended" took a customer's money for nothing. A licence this subscription's own refund ended (its row
       "refunded") is given back by the subscription's renewal of a later period: its seats the renewal's, listed "restored" for Max.
       A licence ended any other way (refund-licence.mjs, Max's own act) stays ended, and so does one renewed for the refunded period. */
    const restore = !!lic && lic.refunded === 1 && lic.trial_ends === null && k.row.status === "refunded" && k.origin === "renewal" && k.end > k.row.paid_until; /* plant:pay-restore */
    if (!lic || (lic.refunded && !restore) || lic.trial_ends !== null) return held(c, "licence-ended");
    if ((lic.desk_only === 1) !== k.deskOnly) return held(c, "kind-changed");
    /* A rise after this subscription's own refund (review 4, finding 8): the licence may still be live from another subscription,
       and the rise would put seats back on a payment the customer has been given back. A renewal is not held here. */
    if (k.origin === "rise" && k.row.status === "refunded") return held(c, "refunded-subscription"); /* plant:pay-refunded-rise */
    /* THE OLD ONE RECOVERS (Claude alpha, 2026-11-19): a subscription whose payment failed blocks no new purchase, so the licence may hold
       a paying second one when the old pays again. That notice is the second live subscription: held, no seat changed, listed. Only a row
       recorded as neither paying, cancelled nor refunded is judged here; a licence whose one subscription lapsed and recovers has no other. */
    if (!["active", "trialing", "canceled", "refunded"].includes(k.row.status)
      && await db.prepare("SELECT 1 AS x FROM pay_subs WHERE licence = ?1 AND " + payingWhere() + " AND NOT (provider = ?2 AND sub = ?3)").bind(k.row.licence, p.name, k.subId).first())
      return held(c, "second-subscription"); /* plant:pay-recovered-second */
    const R = (q, col) => "(SELECT " + col + " FROM pay_subs WHERE provider = " + q(p.name) + " AND sub = " + q(k.subId) + ")";
    const G = q => "EXISTS (SELECT 1 FROM orders WHERE tag = " + q(k.tag) + " AND run = " + q(k.run) + ")";
    /* The counts this payment buys: the subscription's, capped by what it billed, or kept from pay_subs where a whole rise or reduction
       left that kind off its invoice, or for a rise billed on top, by what was held. An earlier period, or an older notice below the
       subscription's present items while those items are still what this period holds, keeps the count already held. In the period
       already paid, the count is the higher of what is held and what the notice names, so an addition lands and a reduction waits.
       A later period's payment carries its own count, lower or higher. */
    const keptSeat = (q, col, noticeSql, noticeNum, subNum) => {
      const held = R(q, col);
      const earlier = "(" + q(k.end) + " < " + R(q, "paid_until") + ")";
      const behind = noticeNum !== null && subNum !== null && noticeNum < subNum ? " OR (" + q(k.end) + " <= " + R(q, "paid_until") + " AND " + held + " = " + q(subNum) + ")" : "";
      const carried = "CASE WHEN " + q(k.end) + " > " + R(q, "paid_until") + " THEN " + noticeSql + " ELSE MAX(" + held + ", " + noticeSql + ") END"; /* plant:pay-seat-carry */
      return "CASE WHEN " + earlier + behind + " THEN " + held + " ELSE " + carried + " END"; /* plant:pay-seat-kept */
    };
    const LEAD = q => keptSeat(q, "lead_seats", k.lead === null ? R(q, "lead_seats") : k.onTop ? "MIN(" + q(k.lead) + ", " + R(q, "lead_seats") + " + " + q(k.onTop.lead) + ")" : q(k.lead), k.lead, k.subNow.lead);
    const DESK = q => keptSeat(q, "seats", k.desk === null ? R(q, "seats") : k.onTop ? "MIN(" + q(k.desk) + ", " + R(q, "seats") + " + " + q(k.onTop.desk) + ")" : q(k.desk), k.desk, k.subNow.desk); /* plant:pay-rise-on-top */
    const exSub = q => "(provider = " + q(p.name) + " AND sub = " + q(k.subId) + ")";
    /* Whether this payment begins a period: a renewal of the same or a later end, a rise only past the period's end (Grok's review 6, finding 3). */
    const BEGINS = q => "(" + q(k.end) + (k.origin === "rise" ? " > " : " >= ") + R(q, "paid_until") + ")"; /* plant:pay-rise-begins */
    const liveOther = (q, col) => "COALESCE((SELECT SUM(" + col + ") FROM " + liveSubsWhere("licences.id", q(now), exSub(q)) + "), 0)";
    await db.batch(bound(db, [
      statement(q => "INSERT INTO orders (tag, run, at, licence) SELECT " + q(k.tag) + ", " + q(k.run) + ", " + q(now) + ", " + R(q, "licence") + " WHERE EXISTS (SELECT 1 FROM pay_subs s " /* plant:pay-renewal-licence */
        + "JOIN licences l ON l.id = s.licence WHERE s.provider = " + q(p.name) + " AND s.sub = " + q(k.subId) + " AND s.person = (SELECT person FROM persons WHERE code = " + q(k.code) + ") "
        + "AND (l.refunded = 0" + (restore ? " OR (s.status = 'refunded' AND " + q(k.end) + " > s.paid_until)" : "") + ") AND l.trial_ends IS NULL) ON CONFLICT (tag) DO NOTHING"), /* plant:paddle-known-once */
      /* WHAT THIS PAYMENT PAID FOR, kept on its order before the subscription's row moves (Grok alpha's review of 2026-11-22, A2 and B4;
         migrations/0029_pay_parts.sql), so a refund takes back exactly that and nothing another payment bought (Claudius, on the test
         architect's read of e01e2b37, F2). A payment that begins a period (a renewal of the same or a later end, or a rise that moves the
         date, which bills the whole new count for the new period) pays for its whole count to its end: part_of its own id. A rise inside the
         period paid is a part of that period (part_of the period's payment) and pays for what it raised the subscription by, never less
         than none. An older period's late notice is a part of nothing, and its refund is held "not-current-period" as before. */
      statement(q => "UPDATE orders SET sub = " + q(k.subId) + ", ends = " + q(k.end) + ", given_back = 0, part_of = CASE WHEN " + BEGINS(q) + " THEN " + q(k.id)
        + (k.origin === "rise" ? " ELSE " + R(q, "txn") /* plant:pay-rise-part */ : " ELSE NULL") + " END, "
        + "lead_added = CASE WHEN " + BEGINS(q) + " THEN " + LEAD(q) + (k.origin === "rise" ? " ELSE MAX(0, " + LEAD(q) + " - " + R(q, "lead_seats") + ")" : " ELSE NULL") + " END, "
        + "desk_added = CASE WHEN " + BEGINS(q) + " THEN " + DESK(q) + (k.origin === "rise" ? " ELSE MAX(0, " + DESK(q) + " - " + R(q, "seats") + ")" : " ELSE NULL") + " END"
        + " WHERE tag = " + q(k.tag) + " AND run = " + q(k.run)),
      ...settleStatements(q => R(q, "licence"), now, G, { provider: p.name, sub: k.subId }), /* plant:pay-settle-except */
      /* Given back: its counts are this renewal's, not the floor of one the refund left, and the subscription's contribution is set to
         them first, so the seat difference below moves nothing more. */
      ...(restore ? [statement(q => "UPDATE licences SET refunded = 0, refunded_at = NULL, seats = MAX(1, " + DESK(q) + ")" + (k.deskOnly ? "" : ", lead_seats = MAX(1, " + LEAD(q) + ")")
        + " WHERE id = " + R(q, "licence") + " AND refunded = 1 AND " + R(q, "status") + " = 'refunded' AND " + G(q)),
      statement(q => "UPDATE pay_subs SET seats = " + DESK(q) + ", lead_seats = " + LEAD(q) + " WHERE provider = " + q(p.name) + " AND sub = " + q(k.subId)
        + " AND status = 'refunded' AND " + G(q))] : []),
      statement(q => "UPDATE licences SET " + (k.deskOnly ? "" : "lead_seats = CASE WHEN " + subOnlyExpr("") + " THEN MAX(1, " + liveOther(q, "lead_seats") + " + " + LEAD(q) + ") ELSE MAX(1, lead_seats + " + LEAD(q) + " - " + R(q, "lead_seats") + ") END, ") /* plant:pay-live-lead */
        + "seats = CASE WHEN " + subOnlyExpr("") + " THEN MAX(1, " + liveOther(q, "seats") + " + " + DESK(q) + ") ELSE MAX(1, seats + " + DESK(q) + " - " + R(q, "seats") + ") END, " /* plant:paddle-seat-diff */
        + "paid_until = MAX(paid_until, " + q(k.end) + "), updates_until = MAX(updates_until, " + q(k.endDay) + ") " /* plant:paddle-paid-max */
        + "WHERE id = " + R(q, "licence") + " AND " + G(q)),
      /* A renewal's revenue year: the provider hands no revenue date, so the later of the order's year and the licence's end year now. */
      statement(q => "UPDATE orders SET revenue_year = MAX(CAST(strftime('%Y', at / 1000, 'unixepoch') AS INTEGER), COALESCE((SELECT CAST(strftime('%Y', paid_until / 1000, 'unixepoch') AS INTEGER) FROM licences WHERE id = " + R(q, "licence")
        + "), 0)) WHERE tag = " + q(k.tag) + " AND run = " + q(k.run)),
      /* THE PERIOD'S PAYMENT (Grok's review 6, finding 3): txn names the payment that began the current period. A renewal of the same or a
         later end takes it; a rise bills inside a period already bought, so it takes it only where it reaches past that period's end. */
      statement(q => "UPDATE pay_subs SET lead_seats = " + LEAD(q) + ", seats = " + DESK(q) + ", txn = CASE WHEN " + q(k.end) + (k.origin === "rise" ? " > " : " >= ") + "paid_until THEN " /* plant:pay-rise-txn */
        + q(k.id) + " ELSE txn END, paid_until = MAX(paid_until, " + q(k.end) + "), status = " + q(k.status) + ", updated_at = " + q(now)
        + " WHERE provider = " + q(p.name) + " AND sub = " + q(k.subId) + " AND " + G(q)),
    ]).concat([eventStatement(c, q => "CASE WHEN " + G(q) + " THEN " + q(restore ? "restored" : k.applied) + " "
      + "WHEN EXISTS (SELECT 1 FROM orders WHERE tag = " + q(k.tag) + ") THEN 'once' ELSE 'held:changed' END")]));
    return done();
  }

  /* ---- a subscription's status, and its end ------------------------------------------------------------------------------ */

  async function status(c, id) {
    const { db, p, cfg, now } = c;
    c.sub = id;
    const s = await p.readSubscription(io, cfg, id);
    if (s === null) return held(c, "not-found");
    if (typeof s.status !== "string" || !/^[a-z_]{1,24}$/.test(s.status)) return held(c, "subscription-status");
    /* PAYING FOLLOWS THE JUDGED RENEWAL (Grok alpha's review of 2026-11-22, C5): a row that is not paying never turns paying by a status event,
       only by a payment the route applies (knownSubscription writes the status it read back), so a recovering subscription is judged against
       one already paying whichever event the provider sends first, and a renewal held "second-subscription" leaves it not paying. */
    await db.batch([
      db.prepare("UPDATE pay_subs SET status = CASE WHEN ?1 IN ('active', 'trialing') AND status NOT IN ('active', 'trialing') THEN status ELSE ?1 END, " /* plant:pay-status-not-paying */
        + "updated_at = ?2 WHERE provider = ?3 AND sub = ?4 AND status NOT IN ('canceled', 'refunded')").bind(s.status, now, p.name, id),
      /* A subscription not known here that the provider says expired or ended before its first payment ("expired"): the checkout it was bound
         at is no longer pending (buyerFacts; Claudius on the test architect's read of e01e2b37, F3). */
      eventStatement(c, q => "CASE WHEN EXISTS (SELECT 1 FROM pay_subs WHERE provider = " + q(p.name) + " AND sub = " + q(id) + ") THEN 'recorded' "
        + "WHEN " + q(s.status) + " IN ('incomplete_expired', 'canceled') THEN 'expired' ELSE 'unknown' END"), /* plant:pay-status-expired */
    ]);
    return done();
  }

  async function cancel(c, id) {
    const { db, p, cfg, now } = c;
    c.sub = id;
    const s = await p.readSubscription(io, cfg, id);
    if (s === null) return held(c, "not-found");
    if (s.status !== "canceled") throw retry("subscription " + s.status); /* plant:paddle-canceled */
    const row = await db.prepare("SELECT licence FROM pay_subs WHERE provider = ?1 AND sub = ?2").bind(p.name, id).first();
    if (!row) return held(c, "subscription-unknown");
    /* A CANCEL ENDS THE RENEWAL, NOT THE PAID TIME: every paid subscription keeps its seats to its own paid date, sole or alongside
       another source. Set status to 'canceled' (unless already 'refunded'), leave licences and pay_subs counts where they are, and
       let settleStatements and inForceCol drop any passed cancelled row at its own paid_until. */
    await db.batch([
      db.prepare("UPDATE pay_subs SET status = CASE WHEN status = 'refunded' THEN status ELSE 'canceled' END, updated_at = ?3 WHERE provider = ?1 AND sub = ?2").bind(p.name, id, now), /* plant:paddle-cancel-own */
      ...bound(db, settleStatements(q => "(SELECT licence FROM pay_subs WHERE provider = " + q(p.name) + " AND sub = " + q(id) + ")", now)),
      eventRow(c, "applied"),
    ]);
    return done();
  }

  /* ---- a refund, or a chargeback lost ---------------------------------------------------------------------------------- */

  async function refund(c, id) {
    const { db, p, cfg, now } = c;
    const a = await p.readRefund(io, cfg, id, c.what);
    c.sub = a.subscription; /* plant:pay-refund-sub */
    if (a.held) return held(c, a.held);
    if (a.listed) { await eventRow(c, a.listed).run(); return done(); }
    const subId = a.subscription, txn = a.payment, tag = p.name + ":" + id, run = runId();
    const row = await db.prepare("SELECT licence, txn, status, seats, lead_seats, paid_until, updated_at FROM pay_subs WHERE provider = ?1 AND sub = ?2").bind(p.name, subId).first();
    /* A REFUND OF A PAYMENT NOT STORED HERE is held as "payment-unknown", apart from an older period's: it changes nothing now, and
       the payment, when it arrives, reads the refund back and grants nothing (readPayment; Grok's review 6, finding 1). */
    const unknown = async () => !await db.prepare("SELECT 1 AS o FROM orders WHERE tag = ?1").bind(p.name + ":" + txn).first();
    if (!row) return held(c, await unknown() ? "payment-unknown" : "subscription-unknown");
    /* WHICH PAYMENT IS GIVEN BACK, AND WHAT STILL STANDS (Grok alpha's review of 2026-11-22, A2 and B4; Claudius on the test architect's
       read of e01e2b37, F2: "a refund takes back exactly what the refunded payment bought and nothing another payment bought"). Each payment
       the route applied since migrations/0029_pay_parts.sql keeps on its order what it paid for (knownSubscription's "WHAT THIS PAYMENT PAID
       FOR"): a period's payment its whole count to its end, a rise inside it what it added. After this one is given back, the subscription
       holds what its payments still standing pay for now: of the periods not yet ended, the one that ends latest, its own count where its
       payment stands and the count each of its standing rises added. A period's payment kept before 0029, or an attach's, pays for the row
       less its period's standing rises. Nothing standing: the subscription is given back whole, as before (status "refunded", and the licence
       ended where it is the sole source). A payment that is a part of no period here (an older period's late notice, a rise paid before
       0029) is held "not-current-period" or "refund-rise" as before. */
    const parts = ((await db.prepare("SELECT tag, part_of, lead_added, desk_added, ends, given_back FROM orders WHERE sub = ?1 AND part_of IS NOT NULL "
      + "AND substr(tag, 1, ?2) = ?3").bind(subId, (p.name + ":").length, p.name + ":").all()).results || []).map(o => Object.assign({}, o, { id: o.tag.slice(p.name.length + 1) }));
    const mine = parts.find(o => o.id === txn);
    const period = row.txn === txn;
    if (!mine && !period) return held(c, await unknown() ? "payment-unknown" : a.origin === "rise" ? "refund-rise" : "not-current-period"); /* plant:paddle-refund-current */
    /* A payment's money goes back once, whether a refund or a chargeback says so first. */
    if (row.status === "refunded" || (!!mine && mine.given_back === 1)) { await eventRow(c, "once").run(); return done(); } /* plant:pay-refund-period-once */
    const back = o => o.given_back === 1 || o.id === txn;
    const periods = parts.filter(o => o.part_of === o.id);
    if (!periods.some(o => o.id === row.txn)) periods.push({ id: row.txn, part_of: row.txn, lead_added: null, desk_added: null, ends: row.paid_until, given_back: 0 });
    const holding = per => {
      const of = parts.filter(o => o.part_of === per.id && o.id !== per.id);
      const rises = of.filter(o => !back(o));
      const sum = (list, col) => list.reduce((n, o) => n + (Number.isSafeInteger(o[col]) ? o[col] : 0), 0);
      /* A period's payment with no count kept (paid before 0029, or an attach's), for the row's own period alone: the row less every rise of
         that period the row still holds, the one given back now included (the test architect's re-read of 6803e602, H2). */
      const inRow = of.filter(o => o.given_back !== 1);
      const own = (col, rowCol) => (back(per) ? 0 : Number.isSafeInteger(per[col]) ? per[col] : per.id === row.txn ? Math.max(0, row[rowCol] - sum(inRow, col)) : 0); /* plant:pay-refund-legacy */
      const ends = Math.max(Number.isSafeInteger(per.ends) ? per.ends : row.paid_until, ...rises.map(o => (Number.isSafeInteger(o.ends) ? o.ends : 0)));
      return { id: per.id, lead: own("lead_added", "lead_seats") + sum(rises, "lead_added"), desk: own("desk_added", "seats") + sum(rises, "desk_added"), ends: Math.min(ends, row.paid_until) };
    };
    const holdings = periods.map(holding), latest = Math.max(...holdings.map(h => h.ends));
    /* A period stands while its time runs. The latest period's grace is a late renewal's due and counts (H1 of the re-read); a period a
       later one superseded stands only while its own paid time runs, never on seats a later period's refund took back (S23d, S23e). */
    const stand = holdings.filter(h => (h.ends >= latest ? h.ends : h.ends - GRACE_DAYS * DAY) > now && h.lead + h.desk > 0).sort((x, y) => y.ends - x.ends)[0] || null; /* plant:pay-refund-stands */
    const left = stand ? { lead: Math.min(stand.lead, row.lead_seats), desk: Math.min(stand.desk, row.seats), until: stand.ends, txn: stand.id } : null;
    const G = q => "EXISTS (SELECT 1 FROM orders WHERE tag = " + q(tag) + " AND run = " + q(run) + ")";
    const R = (q, col) => "(SELECT " + col + " FROM pay_subs WHERE provider = " + q(p.name) + " AND sub = " + q(subId) + ")";
    const others = q => "FROM pay_subs o WHERE o.licence = licences.id AND NOT (o.provider = " + q(p.name) + " AND o.sub = " + q(subId) + ")";
    const exThis = q => "(provider = " + q(p.name) + " AND sub = " + q(subId) + ")";
    /* SOLE SOURCE: nothing of this subscription left standing, made by a payment provider, no invoice beside it, and no other live
       subscription left; anything else leaves the licence live. */
    const sole = q => (left ? "0 AND " : "") + "substr(key_hash, 1, 7) IN ('paddle:', 'stripe:') AND COALESCE(invoiced_until, 0) = 0 "
      + "AND NOT EXISTS (SELECT 1 " + others(q) + " AND o.status <> 'refunded' AND o.paid_until > " + q(now) + ")"; /* plant:paddle-sole */
    const L = q => R(q, "licence");
    const LEFT = (q, col) => q(left ? (col === "seats" ? left.desk : left.lead) : 0);
    const OFF = (q, col) => R(q, col) + " - " + LEFT(q, col);
    const KEPT_UNTIL = q => q(left ? left.until : 0);
    /* Read, then written only if the row and this payment's order are as read (core.mjs's rule: nothing reads and then writes on a decision). */
    const same = q => "provider = " + q(p.name) + " AND sub = " + q(subId) + " AND txn = " + q(row.txn) + " AND seats = " + q(row.seats) + " AND lead_seats = " + q(row.lead_seats)
      + " AND paid_until = " + q(row.paid_until) + " AND updated_at = " + q(row.updated_at) + " AND status <> 'refunded' AND NOT EXISTS (SELECT 1 FROM orders WHERE tag = "
      + q(p.name + ":" + txn) + " AND given_back = 1)";
    await db.batch(bound(db, [
      statement(q => "INSERT INTO orders (tag, run, at, licence) SELECT " + q(tag) + ", " + q(run) + ", " + q(now) + ", " + L(q) /* plant:pay-refund-licence */
        + " WHERE EXISTS (SELECT 1 FROM pay_subs WHERE " + same(q) + ") ON CONFLICT (tag) DO NOTHING"), /* plant:paddle-refund-once */
      ...settleStatements(L, now, G),
      statement(q => "UPDATE licences SET refunded = 1, refunded_at = COALESCE(refunded_at, " + q(now) + ") WHERE id = " + L(q) + " AND " + G(q) + " AND " + sole(q)),
      statement(q => "UPDATE licences SET seats = CASE WHEN " + subOnlyExpr("") + " THEN MAX(1, COALESCE((SELECT SUM(seats) FROM " + liveSubsWhere("licences.id", q(now), exThis(q)) + "), 0) + " + LEFT(q, "seats") + ") ELSE MAX(1, seats - (" + OFF(q, "seats") + ")) END, "
        + "lead_seats = CASE WHEN " + subOnlyExpr("") + " THEN MAX(1, COALESCE((SELECT SUM(lead_seats) FROM " + liveSubsWhere("licences.id", q(now), exThis(q)) + "), 0) + " + LEFT(q, "lead_seats") + ") ELSE MAX(1, lead_seats - (" + OFF(q, "lead_seats") + ")) END "
        + "WHERE id = " + L(q) + " AND " + G(q)),
      /* Where the licence stays, its dates are what the sources still paying cover (Claude alpha, 2026-11-13: "never leave a date that
         no remaining payment covers"; the updates too, "the money for that period went back, so the updates it bought go with it"): the
         invoice's (invoiced_until, invoiced_updates_until), each other subscription's not refunded, and what this one still pays for,
         never later than they were. */
      statement(q => "UPDATE licences SET paid_until = MIN(paid_until, MAX(COALESCE(invoiced_until, 0), COALESCE((SELECT MAX(o.paid_until) " + others(q)
        + " AND o.status <> 'refunded'), 0), " + KEPT_UNTIL(q) + ")), "
        + "updates_until = MIN(updates_until, MAX(COALESCE(invoiced_updates_until, ''), COALESCE((SELECT MAX(date(o.paid_until / 1000, 'unixepoch')) " + others(q)
        + " AND o.status <> 'refunded'), ''), " + (left ? "date(" + KEPT_UNTIL(q) + " / 1000, 'unixepoch')" : "'1970-01-01'") + ", '1970-01-01')) " /* plant:paddle-refund-updates */
        + "WHERE id = " + L(q) + " AND refunded = 0 AND " + G(q)), /* plant:paddle-refund-date */
      statement(q => "UPDATE pay_subs SET " + (left ? "seats = " + q(left.desk) + ", lead_seats = " + q(left.lead) + ", paid_until = " + q(left.until) + ", txn = " + q(left.txn)
        : "seats = 0, lead_seats = 0, status = 'refunded'") + ", updated_at = " + q(now) + " WHERE provider = " + q(p.name) + " AND sub = " + q(subId) + " AND " + G(q)),
      /* This payment marked given back, on its own order, written where its purchase left none (an attach). */
      statement(q => "INSERT INTO orders (tag, run, at, licence, sub, part_of, given_back) SELECT " + q(p.name + ":" + txn) + ", " + q(run) + ", " + q(now) + ", " + L(q) + ", " + q(subId)
        + ", " + q(txn) + ", 1 WHERE " + G(q) + " ON CONFLICT (tag) DO UPDATE SET given_back = 1"), /* plant:pay-refund-given-back */
      /* A refund's correction is kept as an order: the later of its year and the licence's end year, as a renewal's. */
      statement(q => "UPDATE orders SET revenue_year = MAX(CAST(strftime('%Y', at / 1000, 'unixepoch') AS INTEGER), COALESCE((SELECT CAST(strftime('%Y', paid_until / 1000, 'unixepoch') AS INTEGER) FROM licences WHERE id = " + L(q)
        + "), 0)) WHERE tag = " + q(tag) + " AND run = " + q(run)),
    ]).concat([eventStatement(c, q => "CASE WHEN " + G(q) + " AND (SELECT refunded FROM licences WHERE id = " + L(q) + ") = 1 THEN 'applied' "
      + "WHEN " + G(q) + " AND " + R(q, "status") + " <> 'refunded' THEN 'refund-part' "
      + "WHEN " + G(q) + " THEN 'refund-one-source' WHEN EXISTS (SELECT 1 FROM orders WHERE tag = " + q(tag) + ") THEN 'once' ELSE 'held:changed' END")]));
    return done();
  }

  /* ---- a binding, where a provider names the buyer only at checkout ---------------------------------------------------- */

  /** What a provider's readPayment may ask of the record: the code and the link a subscription was bound to, or null. */
  const lookOf = c => Object.freeze({
    binding: subId => c.db.prepare("SELECT code, managed, org FROM pay_binds WHERE provider = ?1 AND sub = ?2").bind(c.p.name, subId).first(),
  });

  async function bind(c, id) {
    const { db, p, cfg, now } = c;
    const r = await p.readBinding(io, cfg, id);
    if (r.held) return held(c, r.held);
    c.sub = r.subscription;
    /* A code that is no code is kept as none, so the payment is held as "code" rather than retried for want of a binding. */
    const code = typeof r.code === "string" && SEAT_CODE_RE.test(r.code) ? r.code : ""; /* plant:pay-bind-code */
    /* A name typed outside the bound becomes the default, applied and listed "org-name": never held, so no payer is stranded over it. */
    const typed = typedOrg(r.org);
    const prior = await db.prepare("SELECT code FROM pay_binds WHERE provider = ?1 AND sub = ?2").bind(p.name, r.subscription).first();
    if (prior && prior.code !== code) return held(c, "binding-differs");
    await db.batch([
      db.prepare("INSERT INTO pay_binds (provider, sub, code, managed, org, at) VALUES (?1, ?2, ?3, ?4, ?5, ?6) ON CONFLICT (provider, sub) DO NOTHING")
        .bind(p.name, r.subscription, code, r.managed ? 1 : 0, typed.org, now),
      eventRow(c, !code ? "bound:no-code" : typed.bad ? "org-name" : "bound"),
    ]);
    return done();
  }

  /* ---- the route ------------------------------------------------------------------------------------------------------- */

  const ACTS = { payment, status, cancel, refund, bind };

  return async function payRoute(request, env, name) {
    const on = providersOn(env, providers);
    if (on === null) return fault();
    if (!Object.prototype.hasOwnProperty.call(providers, name) || !on.has(name)) return notThere(); /* plant:pay-provider-on */
    const p = providers[name];
    if (request.method !== "POST") return notThere();
    const cfg = p.config(env);
    if (!cfg || !env.DB) return fault();
    const now = clock(env);
    if (!Number.isSafeInteger(now)) return fault();
    /* Nothing below reaches D1 or the provider until the signature holds. */
    const sig = p.signatureOf(request.headers);
    if (!sig) return unsigned(); /* plant:paddle-unsigned-first */
    if (Math.abs(now - sig.t * 1000) > SIGNATURE_WINDOW_S * 1000) return unsigned(); /* plant:paddle-window */
    const raw = await rawOf(request, PAY_BODY_MAX);
    if (!raw) return unsigned();
    if (!await p.verify(cfg, sig, raw)) return unsigned(); /* plant:paddle-signature */
    const ev = p.eventOf(raw);
    if (!ev) return unsigned();
    const c = { db: env.DB, p, cfg, now, ev };
    try {
      const seen = await env.DB.prepare("SELECT outcome FROM pay_events WHERE provider = ?1 AND event_id = ?2").bind(p.name, ev.id).first();
      if (seen) return done(); /* plant:paddle-event-once */
      /* An event of the other mode than this deployment's (a test event at a live Worker, or the reverse) changes nothing. */
      if (p.modeHolds && !p.modeHolds(cfg, ev)) return await held(c, "livemode");
      const what = p.classify(ev);
      if (!what) return await held(c, "event-type");
      c.what = what;
      return await ACTS[what.act](c, what.id);
    } catch { return fault(); }
  };
}

/* WHAT A BUYER'S OWN PROGRAMS ARE TOLD OF THEIR PAYMENTS (board 1020; the lead engineer's cut of 2026-11-22: "a 'you already pay, so add
 * seats' answer, a held-payment flag for the buyer"). Read at Studio's sign-in (signin, its renewal, its no-licence answer) and quiet check, beside
 * the answer and outside every signature, as `trials` is; each key absent where it has nothing to say, so an answer to anyone who has
 * paid nothing is byte for byte as before.
 *
 *   pays   {team?, deskOnly?}, each {provider, portal?}: a licence of that kind this person owns that a paying subscription (active or
 *          trialing) holds, the licence neither refunded nor a trial, whatever its paid date (ownedPayingWhere): the hold's own condition,
 *          so a named owner who did not buy the subscription, and a licence lapsed while its subscription still pays, are told. ONE SUBSCRIPTION PER
 *          LICENCE (Max, 2026-11-19 03:46: "Yes, one subscription per licence."): such a person buys more seats as a change of quantity
 *          on that subscription, which the route applies to the same licence as a renewal's seats (knownSubscription, a rise), never by
 *          a second checkout, which it holds "second-subscription". `portal` is where that change is made, the provider's own customer
 *          portal as the deployment configures it (pay-stripe.mjs stripePortal), absent where none is.
 *   held   [{kind, provider, at}], newest first, at most BUYER_HELD_MAX: a payment the route holds naming this person (its row's person,
 *          eventStatement), newest per subscription, within HELD_SHOWN_DAYS and not yet settled, settled meaning a later refund of that
 *          subscription or a later payment of it applied (a cancel moves no money, so it settles nothing held), or Max's attach that records
 *          it (attach-seats.mjs --pay-sub, whose release takes the person off that subscription's held notices; an attach that records
 *          another settles nothing); and a checkout bound to this person whose subscription has neither paid nor been held, refunded or
 *          cancelled, nor expired, within PENDING_MS ("pending": the provider has not yet said the money arrived). `kind` is "pending",
 *          "already-pays" (held "second-subscription"), "managed" (held "managed": the person's organisation's licence follows Entra),
 *          or "review" (any other hold naming them, which Max looks at). A hold that names nobody (no code, a code nobody holds, a
 *          renewal never bound) reaches no program and stays on Max's list (scripts/pay-held.mjs).
 *
 * The held window is the lead engineer's builder's choice, reason not given by Max: a month is time for Max to refund or attach a hold.
 * The pending window is Claudius's, on the test architect's read of e01e2b37 (F3): a checkout whose money has not arrived within an hour
 * stops being "pending", and Studio offers Buy again (it never hides Buy from a person whose trial is over, Claude alpha's rule). */
const HELD_SHOWN_DAYS = 30, PENDING_MS = 3600000, BUYER_HELD_MAX = 5; /* plant:buyer-pending-hour */
const BUYER_KINDS = Object.freeze({ "second-subscription": "already-pays", managed: "managed" });
async function buyerFacts(db, person, now, portals) {
  if (!db || typeof person !== "string" || !person || !Number.isSafeInteger(now)) return {};
  const paying = (await db.prepare("SELECT s.provider AS provider, l.desk_only AS desk_only FROM pay_subs s JOIN licences l ON l.id = s.licence WHERE "
    + ownedPayingWhere("s", "l", "?1") + " ORDER BY l.paid_until DESC, l.id DESC LIMIT 8").bind(person).all()).results || []; /* plant:buyer-pays */
  const pays = {};
  for (const r of paying) {
    const kind = r.desk_only === 1 ? "deskOnly" : "team";
    if (pays[kind]) continue;
    const portal = portals && typeof portals[r.provider] === "string" ? portals[r.provider] : null;
    pays[kind] = Object.assign({ provider: r.provider }, portal ? { portal } : {});
  }
  const holds = (await db.prepare("SELECT e.provider AS provider, e.sub AS sub, e.outcome AS outcome, e.at AS at FROM pay_events e "
    + "WHERE e.person = ?1 AND e.act = 'payment' AND e.outcome LIKE 'held:%' AND e.at > ?2 " /* plant:buyer-held */
    + "AND NOT EXISTS (SELECT 1 FROM pay_events f WHERE f.provider = e.provider AND f.sub = e.sub AND f.at >= e.at AND f.event_id <> e.event_id "
    + "AND (f.act = 'refund' OR (f.act = 'payment' AND f.outcome NOT LIKE 'held:%' AND f.outcome <> 'once'))) " /* plant:buyer-settled */
    + "ORDER BY e.at DESC, e.event_id LIMIT 50").bind(person, now - HELD_SHOWN_DAYS * DAY).all()).results || [];
  const pending = (await db.prepare("SELECT b.provider AS provider, b.at AS at FROM pay_binds b JOIN persons p ON p.code = b.code WHERE p.person = ?1 AND b.at > ?2 "
    + "AND NOT EXISTS (SELECT 1 FROM pay_subs s WHERE s.provider = b.provider AND s.sub = b.sub) "
    + "AND NOT EXISTS (SELECT 1 FROM pay_events e WHERE e.provider = b.provider AND e.sub = b.sub AND (e.act IN ('payment', 'cancel', 'refund') OR (e.act = 'status' AND e.outcome = 'expired'))) " /* plant:buyer-pending */
    + "ORDER BY b.at DESC LIMIT " + BUYER_HELD_MAX).bind(person, now - PENDING_MS).all()).results || [];
  const seen = new Set(), held = [];
  for (const h of holds) {
    const key = h.provider + " " + h.sub;
    if (seen.has(key)) continue;
    seen.add(key);
    held.push({ kind: BUYER_KINDS[h.outcome.slice(5)] || "review", provider: h.provider, at: h.at }); /* plant:buyer-kind */
  }
  for (const b of pending) held.push({ kind: "pending", provider: b.provider, at: b.at });
  held.sort((a, b) => b.at - a.at);
  return Object.assign(Object.keys(pays).length ? { pays } : {}, held.length ? { held: held.slice(0, BUYER_HELD_MAX) } : {});
}

export { makePayRoute, inForceCol, inForceOf, providersOn, hmacHolds, joined, SIGNATURE_WINDOW_S, PAY_BODY_MAX, GRACE_DAYS, PAY_TIMEOUT_MS, PAY_KINDS, ORG_DEFAULT,
  PAY_LISTED, buyerFacts, HELD_SHOWN_DAYS, PENDING_MS };
