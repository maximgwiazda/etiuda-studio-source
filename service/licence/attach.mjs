/* THE ATTACH, SHARED (the Paddle design of 2026-11-13, B1): the statements that give an organisation its one paid licence, or
 * raise that licence in place, for the owner a sign-in code names. scripts/attach-seats.mjs renders them as text for wrangler
 * (renderSql), and paddle.mjs binds them on D1, so an invoice attached by hand and a payment attached by Paddle can never write
 * a licence two ways.
 *
 *     const made = attachStatements({ tag, run, now, code, deskOnly, org, raise, fresh, orderWhere, noKey, personPrefix, personal })
 *     made.statements   [{sql, values}], each value named by ?N and nothing quoted into the text
 *     made.expr         {OWNER, PAID, L, G}: q => SQL, for statements a caller adds after these, each taking its own q
 *
 * Every statement acts only where this run recorded `tag` in orders (G), so the same order applies once whoever runs it twice.
 * What differs between the two callers is passed in: how a raise counts and dates (`raise`), what a new licence holds (`fresh`, its
 * invoiced_until and invoiced_updates_until the invoice's dates, or 0 and none for Paddle's, and its owner's switch `fresh.orgDesks` where given, which a raise never changes, and `fresh.seatSource`, "entra" for the attach's
 * --entra-roles alone, which its raise writes too, and `fresh.pooledOk`, 1 for the attach's --non-persistent, which its raise writes too),
 * and any further condition on recording the order (`orderWhere`); `revenueYear`, where given (an invoice's, named by the attach), is the year
 * the order's revenue arose, which it keeps for its retention (core.mjs ORDER_RETENTION_YEARS); without it the last statement writes the
 * later of the order's own year and its licence's end year, the safe form where no revenue date is held. `release` {provider, sub, buyerCode, txn, leadSeats, seats, paidUntil} records a payment provider's
 * subscription the route held against the licence this attach raises or makes (Claude alpha, 2026-11-13: from then on "the route
 * treats it as any known subscription"), contributing these seats, paid until `paidUntil` where the caller names the subscription's own end and otherwise as the licence is after the attach, its current period
 * `txn`, and binds the subscription to that buyer's code where a provider names its buyer only at checkout (Stripe), Max's word
 * standing over a code the checkout carried or dropped, and settles that subscription's held notices (their person cleared); the order is recorded only where the buyer's code is known and the subscription is not known already. The organisation is `org.provider` and `org.org`, SQL for
 * admits' two columns; a desk-only licence has none and is found by its owner. Nothing here imports core.mjs: the caller hands
 * NO_KEY, PERSON and PERSONAL as `noKey`, `personPrefix` and `personal`.
 */

/** A statement's values in the order it names them, as core.mjs params(): q(v) is the ?N for v, the same N for the same value. */
function params() {
  const values = [];
  const q = v => { const x = v === undefined ? null : v; let i = values.indexOf(x); if (i < 0) { values.push(x); i = values.length - 1; } return "?" + (i + 1); };
  q.values = values;
  return q;
}
const statement = build => { const q = params(); const sql = build(q); return { sql, values: q.values }; };

function attachStatements(o) {
  /* The owner by the code the order names, or, where the caller hands `owner` (SQL naming one person, scripts/attach-seats.mjs --owner-address;
     board 1017: "an order paid by invoice names the owner by email"), by that. */
  const OWNER = o.owner ? o.owner : q => "(SELECT person FROM persons WHERE code = " + q(o.code) + ")";
  const G = q => "EXISTS (SELECT 1 FROM orders WHERE tag = " + q(o.tag) + " AND run = " + q(o.run) + ")";
  /* The organisation's paid licence, where it has one. A desk-only licence is its owner's. */
  /* The organisation's paid licence, or the one `o.paid` names (a payment's licence of the buyer's own, pay.mjs). */
  const PAID = o.paid ? o.paid : o.deskOnly
    ? q => "(SELECT id FROM licences WHERE desk_only = 1 AND owner = " + OWNER(q) + " AND trial_ends IS NULL AND refunded = 0 ORDER BY id LIMIT 1)"
    : q => "(SELECT a.licence FROM admits a JOIN licences l ON l.id = a.licence WHERE a.provider = " + o.org.provider(q) + " AND a.org = "
      + o.org.org(q) + " AND l.trial_ends IS NULL AND l.refunded = 0 ORDER BY a.licence LIMIT 1)";
  /* Then the one this order made. */
  const L = q => "COALESCE(" + PAID(q) + ", (SELECT id FROM licences WHERE key_hash = " + q(o.tag) + "))";
  const expr = { OWNER, PAID, L, G };
  const f = o.fresh;
  const out = [
    /* 0: the order, recorded by this run, once, and only for an owner the service has answered a code */
    statement(q => "INSERT INTO orders (tag, run, at" + (o.revenueYear ? ", revenue_year" : "") + ") SELECT " + q(o.tag) + ", " + q(o.run) + ", " + q(o.now)
      + (o.revenueYear ? ", " + q(o.revenueYear) : "") + " WHERE " + OWNER(q) + " IS NOT NULL"
      + (o.orderWhere ? " AND " + o.orderWhere(q, expr) : "")
      + (o.release ? " AND (SELECT person FROM persons WHERE code = " + q(o.release.buyerCode) + ") IS NOT NULL AND NOT EXISTS (SELECT 1 FROM pay_subs WHERE provider = " + q(o.release.provider) + " AND sub = "
        + q(o.release.sub) + ")" : "") + " ON CONFLICT (tag) DO NOTHING"), /* plant:attach-release-once */
    /* 1: the organisation's paid licence, raised in place */
    statement(q => "UPDATE licences SET " + o.raise(q, expr) + " WHERE id = " + PAID(q) + " AND " + G(q)),
    /* 2: otherwise a new paid licence for it */
    statement(q => "INSERT INTO licences (key_hash, email_hash, org, seats, updates_until, paid_until, refunded, lead_seats, owner, desk_only, invoiced_until, invoiced_updates_until"
      + (f.orgDesks ? ", org_desks" : "") + (f.seatSource ? ", seat_source" : "") + (f.pooledOk ? ", pooled_ok" : "") + ") SELECT "
      + [q(o.tag), q(o.noKey), q(f.org), f.seats(q), f.updatesUntil(q), f.paidUntil(q), "0", f.leadSeats(q), OWNER(q), o.deskOnly ? "1" : "0", f.invoicedUntil(q), f.invoicedUpdatesUntil(q)]
        .concat(f.orgDesks ? [f.orgDesks(q)] : []).concat(f.seatSource ? [f.seatSource(q)] : []).concat(f.pooledOk ? [f.pooledOk(q)] : []).join(", ")
      + " WHERE " + G(q) + " AND " + PAID(q) + " IS NULL"),
  ];
  /* `paidUntil` is the subscription's own paid end, the provider's period end, which the caller must name: the licence's end is never copied in its place. */
  const releasedPaid = q => { if (o.release && !Number.isFinite(o.release.paidUntil)) throw new Error("a released subscription needs its own paid end"); return q(o.release.paidUntil); }; /* plant:attach-release-paid */
  const released = () => (o.release ? [statement(q => "INSERT INTO pay_subs (provider, sub, licence, person, lead_seats, seats, paid_until, status, txn, updated_at) SELECT "
    + [q(o.release.provider), q(o.release.sub), L(q), "(SELECT person FROM persons WHERE code = " + q(o.release.buyerCode) + ")", q(o.release.leadSeats), q(o.release.seats),
      releasedPaid(q), "'active'", q(o.release.txn), q(o.now)].join(", ")
    + " WHERE " + G(q) + " ON CONFLICT (provider, sub) DO NOTHING"), /* plant:attach-release */
    statement(q => "INSERT INTO pay_binds (provider, sub, code, managed, at) SELECT " + [q(o.release.provider), q(o.release.sub), q(o.release.buyerCode), "0", q(o.now)].join(", ")
      + " WHERE " + G(q) + " ON CONFLICT (provider, sub) DO UPDATE SET code = excluded.code"),
    /* The holds of the subscription this attach records are settled by it, and only those (board 1020; the test architect's read of
       23f51b9d, F3): their notices name nobody from here, so the buyer's programs no longer show them (pay.mjs buyerFacts). */
    statement(q => "UPDATE pay_events SET person = NULL WHERE provider = " + q(o.release.provider) + " AND sub = " + q(o.release.sub) + " AND outcome LIKE 'held:%' AND " + G(q))] : []); /* plant:attach-release-settles */
  /* The order's revenue year where none was named: the later of its own year and its licence's end year, once the licence is raised. */
  const revenue = () => [statement(q => "UPDATE orders SET revenue_year = MAX(CAST(strftime('%Y', at / 1000, 'unixepoch') AS INTEGER), COALESCE((SELECT CAST(strftime('%Y', paid_until / 1000, 'unixepoch') AS INTEGER) FROM licences WHERE id = "
    + L(q) + "), 0)) WHERE tag = " + q(o.tag) + " AND run = " + q(o.run) + " AND revenue_year IS NULL")]; /* plant:revenue-later */
  const orderLicence = () => [statement(q => "UPDATE orders SET licence = " + L(q) + " WHERE tag = " + q(o.tag) + " AND run = " + q(o.run) + " AND licence IS NULL")]; /* plant:attach-order-licence */
  /* A desk-only licence admits nothing through admits and moves nothing: its owner's desks find it by its owner. */
  if (o.deskOnly) return { statements: out.concat(released(), revenue(), orderLicence()), expr };
  out.push(
    /* 3: the licence admits the organisation, its owner, and where asked the provider's personal accounts as desks */
    statement(q => "INSERT INTO admits (licence, provider, org) SELECT " + L(q) + ", " + o.org.provider(q) + ", " + o.org.org(q) + " WHERE " + G(q) + " ON CONFLICT DO NOTHING"),
    statement(q => "INSERT INTO admits (licence, provider, org) SELECT " + L(q) + ", provider, " + q(o.personPrefix) + " || person FROM persons WHERE "
      + (o.owner ? "person = " + OWNER(q) : "code = " + q(o.code)) + " AND " + G(q) + " ON CONFLICT DO NOTHING"),
  );
  if (o.allowPersonal) out.push(statement(q => "INSERT INTO admits (licence, provider, org) SELECT " + L(q) + ", " + o.org.provider(q) + ", " + q(o.personal)
    + " WHERE " + G(q) + " ON CONFLICT DO NOTHING"));
  out.push(
    /* 4: the owner's trial superseded, and their seat and keys moved to the paid licence */
    statement(q => "UPDATE licences SET trial_ends = MIN(trial_ends, " + q(o.now) + ") WHERE owner = " + OWNER(q) + " AND trial_ends IS NOT NULL AND id <> " + L(q) + " AND " + G(q)),
    statement(q => "UPDATE seats SET licence = " + L(q) + " WHERE kind = 'lead' AND person = " + OWNER(q) + " AND " + G(q)),
    statement(q => "UPDATE bindings SET licence = " + L(q) + " WHERE person = " + OWNER(q) + " AND " + G(q)),
  );
  return { statements: out.concat(released(), revenue(), orderLicence()), expr };
}

/** The statements as one text for `wrangler d1 execute --command`: each ?N replaced by its value as an SQL literal (a string
 *  quoted with its quotes doubled, a whole number as written, null as NULL), each statement ending in a semicolon. */
function renderSql(statements) {
  const literal = v => {
    if (v === null) return "NULL";
    if (typeof v === "number") { if (!Number.isSafeInteger(v)) throw new Error("a value the attach renders is a whole number: " + v); return String(v); }
    return "'" + String(v).replace(/'/g, "''") + "'";
  };
  return statements.map(s => s.sql.replace(/\?(\d+)/g, (_, n) => literal(s.values[Number(n) - 1])) + ";").join("\n");
}

export { attachStatements, renderSql, params, statement };
