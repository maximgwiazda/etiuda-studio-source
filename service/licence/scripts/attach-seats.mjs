#!/usr/bin/env node
/* AN INVOICE'S SEATS, ATTACHED BY HAND (board 980; Claude alpha's decision 15 (b) and (c), 2026-11-11 23:39): the SQL that
 * gives an organisation its one paid licence, owned by the person the order names, printed first, and run on D1 by wrangler
 * only with --execute.
 *
 *     node service/licence/scripts/attach-seats.mjs --owner <code> --org <name> --lead-seats <n> --seats <n>
 *          (--provider <id> (--tenant <tenant id> | --domain <hd domain> | --issuer <url>) | --personal)
 *          (--org-keyed <hex> | --service <https://.../v1/> --root <root key file> [--passphrase-file <f>])
 *          [--renew] [--paid-until YYYY-MM-DD] [--updates-until YYYY-MM-DD] [--order <invoice or order id>] [--revenue-year YYYY]
 *          [--org-desks on|off] [--entra-roles] [--allow-personal] [--database <name>] [--config <wrangler.toml>] [--env <name>] [--production | --staging] [--plan]
 *          [--paddle-sub <sub_...> --paddle-txn <txn_...> [--paddle-buyer <code>] [--pay-period-end YYYY-MM-DD]]
 *          [--execute (--remote|--local)] [--wrangler <wrangler.js>]
 *     node service/licence/scripts/attach-seats.mjs --desk-only --owner <code> --org <name> --seats <n>
 *          [--renew] [--paid-until YYYY-MM-DD] [--updates-until YYYY-MM-DD] [--order <id>]
 *          [--database <name>] [--config <wrangler.toml>] [--env <name>] [--production | --staging] [--plan]
 *          [--execute (--remote|--local)] [--wrangler <wrangler.js>]
 *     node service/licence/scripts/attach-seats.mjs --who <address> [--database <name>] [--config <wrangler.toml>] [--env <name>]
 *          [--production | --staging] [--execute (--remote|--local)] [--wrangler <wrangler.js>]
 *     ... and in every form above, --owner-address <address> [--owner-person <64 hex>] in place of --owner <code>.
 *
 * THE OWNER is the person whose sign-in code Studio or the desk shows and the order names (--owner), a code being the person's
 * whether they signed in on Studio or on a desk. The licence is theirs: they list and free its lead seats from Studio. Their trial
 * is superseded (it ends now), and their lead seat and every key bound through them move to the paid licence in the same SQL. A
 * code the service has never answered changes nothing.
 *
 * THE OWNER BY ADDRESS (board 1017: "an order paid by invoice names the owner by email too"; Claude alpha's word of 2026-11-22 00:57, rule 1:
 * "nobody is ever seated, as a lead or on a desk, on the strength of an address the provider does not vouch", and for an invoice order
 * "unvouched: the operator confirms"). --owner-address names the person whose own sign-in gave that address, in place of --owner: alone, only
 * a person whose provider VOUCHED it (persons.vouched), and only where exactly one such person exists, else the order applies nothing.
 * Where the provider did not vouch it, the operator first runs --who <address>, which prints (and with --execute runs) a SELECT listing
 * every person whose sign-in gave that address, by their keyed id, with their name, provider, whether the address is vouched, and their
 * account kind (work or personal), and then confirms the one the order is for by --owner-address with --owner-person <that keyed id>; the
 * order applies only to that person, and only while their sign-in still gives that address. The comparison is SQL's lower() of the address
 * as the person's sign-in gave it, which folds ASCII alone: an address with a capital outside ASCII matches only as written, so such an
 * order applies nothing rather than to anyone else. With --pay-sub, --pay-buyer is then required (a held payment's binding is by code).
 *
 * ONE ORGANISATION, ONE PAID LICENCE. The organisation is the one the order names: a Microsoft tenant id (a GUID), a Google
 * Workspace domain, or a third provider's issuer, under the provider's id as core.mjs PROVIDERS names it; or, with --personal,
 * the owner's own personal account, under the provider they signed in with. Where it already holds a paid licence, that row
 * is raised in place and keeps its id, so desk seats follow without moving: --lead-seats and --seats are seats bought, added
 * to its counts, and its dates become the later of its own and the order's (none named, they stay). With --renew the counts
 * are the new totals and the dates are extended: the later of its own and the order's, or a year past the later of its own
 * and today where the order names none. A renewal also settles, before those totals, a cancelled subscription whose own paid
 * end has passed, its seats to nothing, so they are not subtracted from the new counts. A live subscription, and a cancelled
 * one still inside its paid time, are left as they are. Where the organisation holds no paid licence, a new one admits it, with the order's counts and
 * dates (a year from today where none are named). Either way the licence admits its owner too. --seats counts desks and
 * --lead-seats the leads with Studio. --allow-personal writes the provider's personal accounts into the licence's admits as
 * before, which no route reads since desks sign in themselves: a lead admits a personal account by its code (person/admit).
 *
 * --org-desks (decision 47's addition) is the owner's switch a NEW licence starts with: on, colleagues' desks are seated by the
 * organisation admission; off, only people the owner or a named lead admitted; core.mjs ORG_DESKS_DEFAULT where not given. A
 * raise never changes it: the owner sets it from Studio (core.mjs licence/set).
 *
 * --entra-roles (decision 49, held for Max's ruling) sets the licence this order makes or raises to seats that follow Microsoft Entra
 * (core.mjs, seat_source "entra"): the tenant's app roles decide who holds a seat, and nobody admits, names or switches. Only an
 * invoiced licence of a Microsoft tenant takes it: --provider microsoft and --tenant, never --personal, --desk-only, --allow-personal
 * or a payment the route held. Nothing self-serve sets it, and no order turns it back.
 *
 * THE RELAY IS ASKED FIRST (decision 49, option (b); Claude alpha, 2026-11-13 20:47). The relay answers no version, so --entra-roles
 * asks it what its grants carry: a grant the root signs for a key nobody holds, carrying seats, renewed on a team id nobody made. A
 * relay that reads seats judges the grant and finds no team ("not-enrolled"); an older one refuses its field at its Worker, which judges a
 * renewal's grant before any team object wakes ("bad-grant"; relay/worker.mjs, the grant route). Anything
 * but the first refuses the order before any SQL is printed, since an Entra licence's grants on an older relay would refuse every
 * renewal of its teams. The relay is --relay, or the production or staging relay the target names. The deploy order stands as the
 * rule beside it: the relay, then the licence service, then desks and Studios that send their seat, then --entra-roles.
 *
 * --non-persistent (section 12) allows pooled desks on the licence (licences.pooled_ok): a desk whose machine policy sets
 * NonPersistent then holds one place among its person's three for all their pooled desks, its certificate running a day. Without it
 * a pooled claim is an ordinary desk. Raising a licence in place without it leaves the licence as it was.
 *
 * --desk-only (night decision 18, choice 2) makes, or raises in place, a licence for its owner's desks alone: no lead seat,
 * owned by its buyer, admitting nothing through admits, so only the owner's own desks are certified on it (core.mjs
 * deskLicence). It takes --seats as the owner's desk seats and no organisation, lead seats, --personal or --allow-personal.
 * The capability is built; whether a desk-only licence is offered for sale, and at what price, is Max's and is not decided by
 * this script or anything that uses it, a checkout included.
 *
 * THE ORGANISATION IS KEYED under the service's HASH_KEY, which this script never holds: --service and --root ask the service's
 * admin/org route for it, signed by the root key (opened with its passphrase as tools/sign.mjs opens it, STUDIO_KEY_PASSPHRASE
 * or --passphrase-file, for one signature), and --org-keyed gives it where it is already known. No organisation is printed in
 * the clear. The statements are tagged by the order (--order, else a random tag) and act only where this run recorded the tag,
 * so the same order run twice attaches once.
 *
 * A PAYMENT THE ROUTE HELD (service/licence/pay.mjs, decision 45 or any held reason), attached by hand (--pay-provider stripe for
 * Stripe's, paddle by default; --pay-sub, --pay-txn and --pay-buyer are the same as the --paddle- names): --paddle-sub names its
 * subscription and --paddle-txn the transaction that bought its current period, --paddle-buyer the payer's code (the owner's where
 * not named). The subscription is then recorded against the licence this order raises or makes, contributing these seats, paid until
 * the day --paid-until names, or until the licence's own paid end where that day is not named, and the
 * route applies its renewals, rises, cancellation and refund as any known subscription's (Claude alpha, 2026-11-13). Not with
 * --renew, whose counts are totals rather than what this payment bought; a subscription already known refuses the whole order.
 * --pay-period-end names the day the PROVIDER's current period of that subscription ends (its next invoice's date, as the provider
 * shows it), and the subscription's row records that day's end as its own paid end, whatever the licence's or --paid-until's (the test
 * architect's read of fold 86, class C). Name it: the route judges a notice against that paid end, and a row left on the licence's
 * date, a year past a monthly period, takes a rise inside the period for an earlier one and keeps the held count, so the customer
 * pays for seats they do not get. Without it, --paid-until, else the licence's own end, is copied as before.
 *
 * A REFUND THIS TOOL CANNOT SEE (the fourth service review's finding 11; Claude alpha, 2026-11-19: "do NOT hold the renewal; a paid later
 * period is answered as paid, that is what pay-restore is for"). This script prints SQL and reads neither D1 nor the provider, and a refund
 * the route held names no subscription in pay_events, so it cannot refuse a refunded subscription, and a refund after the attach is the
 * route's. Whoever attaches checks the provider for a refund first, and cancels the subscription there if the refund is its end: left
 * running, the provider's next paid period renews it on the floor the refund left (probe F4a: 1 lead and 2 desks on 1 and 1 give 2 and 3).
 * A subscription attached once is refused a second time, refunded or not (tests/licence-paddle.mjs P90f).
 *
 * wrangler runs by this node, never a shell (tools/wrangler.mjs), against staging by default or --production when named.
 */
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { NO_KEY, PERSON, PERSONAL, SEAT_CODE_RE, ORG_DESKS_DEFAULT, ADDRESS_MAX } from "../core.mjs";
import { adminOrgBytes } from "../requests.mjs";
import { attachStatements, renderSql, statement } from "../attach.mjs";
import { buildWranglerCommand, consumeTargetArg, executeSql, printTargetAndCommand, resolveTarget } from "./target.mjs";

export { executeSql };

const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY = 24 * 3600000, YEAR = 365 * DAY;

function parseArgs(args) {
  const o = { execute: false, remote: false, local: false, allowPersonal: false, personal: false, renew: false, deskOnly: false, nonPersistent: false,
    production: false, staging: false, plan: false };
  const value = (i, name) => { if (i + 1 >= args.length) throw new Error(name + " needs a value"); return args[i + 1]; };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const consumed = consumeTargetArg(args, i, o);
    if (consumed !== -1) { i = consumed; continue; }
    const named = { "--provider": "provider", "--tenant": "tenant", "--domain": "domain", "--issuer": "issuer", "--org": "org", "--lead-seats": "leadSeats",
      "--seats": "seats", "--paid-until": "paidUntil", "--updates-until": "updatesUntil", "--order": "order", "--wrangler": "wrangler",
      "--owner": "owner", "--org-keyed": "orgKeyed", "--service": "service", "--root": "root", "--passphrase-file": "passphraseFile",
      "--paddle-sub": "paddleSub", "--paddle-txn": "paddleTxn", "--paddle-buyer": "paddleBuyer", "--pay-period-end": "payPeriodEnd",
      "--pay-provider": "payProvider", "--pay-sub": "paddleSub", "--pay-txn": "paddleTxn", "--pay-buyer": "paddleBuyer",
      "--org-desks": "orgDesks", "--relay": "relay", "--revenue-year": "revenueYear",
      "--owner-address": "ownerAddress", "--owner-person": "ownerPerson", "--who": "who" }[a];
    if (named) { o[named] = value(i, a); i++; }
    else if (a === "--allow-personal") o.allowPersonal = true;
    else if (a === "--entra-roles") o.entraRoles = true;
    else if (a === "--personal") o.personal = true;
    else if (a === "--renew") o.renew = true;
    else if (a === "--desk-only") o.deskOnly = true;
    else if (a === "--non-persistent") o.nonPersistent = true;
    else if (a === "--execute") o.execute = true;
    else if (a === "--remote") o.remote = true;
    else if (a === "--local") o.local = true;
    else throw new Error("not an argument of attach-seats: " + a);
  }
  return o;
}


/** An address as a person's sign-in gave it (core.mjs addressOf's shape): no space or control, one "@", a dotted domain, at most ADDRESS_MAX. */
const ownerAddressOk = v => typeof v === "string" && v.length <= ADDRESS_MAX && /^[^\s@\x00-\x1f\x7f]{1,64}@[^\s@\x00-\x1f\x7f]+\.[^\s@\x00-\x1f\x7f.]+$/.test(v);
/** THE OWNER BY ADDRESS, as SQL naming one person or none (board 1017's rule 1): with --owner-person, that person, only while their sign-in
 *  still gives the address; without, the one person whose provider vouched it, and none where there is not exactly one. */
export function ownerByAddress(o) {
  if (o.ownerPerson !== undefined) return q => "(SELECT person FROM persons WHERE person = " + q(o.ownerPerson) + " AND lower(address) = lower(" + q(o.ownerAddress) + "))"; /* plant:attach-owner-confirmed */
  return q => "(SELECT person FROM persons WHERE lower(address) = lower(" + q(o.ownerAddress) + ") AND vouched = 1 AND (SELECT COUNT(*) FROM persons "
    + "WHERE lower(address) = lower(" + q(o.ownerAddress) + ") AND vouched = 1) = 1)"; /* plant:attach-owner-vouched */
}
/** THE OPERATOR'S LOOK BEFORE CONFIRMING (--who): every person whose own sign-in gave the address, by keyed id, with what their provider
 *  says of them: name, provider, whether it vouched the address, and the account kind (work, or personal for an account that is its own
 *  organisation, read from their latest seat or desk sign-in). Read only. */
export function whoSql(address) {
  if (!ownerAddressOk(address)) throw new Error("--who is the address a person's own sign-in gave, as written there");
  return renderSql([statement(q => "SELECT p.person AS person, p.name AS name, p.provider AS provider, p.vouched AS vouched, CASE WHEN COALESCE("
    + "(SELECT s.org FROM seats s WHERE s.person = p.person ORDER BY s.seen_at DESC LIMIT 1), (SELECT d.org FROM person_desks d WHERE d.person = p.person "
    + "ORDER BY d.signed_at DESC LIMIT 1), " + q(PERSON) + ") LIKE " + q(PERSON + "%") + " THEN " + q("personal") + " ELSE " + q("work") + " END AS account "
    + "FROM persons p WHERE lower(p.address) = lower(" + q(address) + ") ORDER BY p.vouched DESC, p.signed_at DESC")]);
}

/** The organisation's own value as the order names it, which admin/org keys: the tenant, the domain or the issuer. */
const orgValue = o => (o.tenant !== undefined ? o.tenant : o.domain !== undefined ? o.domain : o.issuer);

/** What the arguments must be, before anything is asked of the service; throws the first refusal. */
export function checkArgs(o) {
  /* The owner by code (--owner) or by address (--owner-address, with --owner-person where the provider did not vouch it), never both. */
  if (o.ownerAddress !== undefined || o.ownerPerson !== undefined) {
    if (o.owner !== undefined) throw new Error("name the owner by --owner <code> or by --owner-address <address>, not both");
    if (!ownerAddressOk(o.ownerAddress)) throw new Error("--owner-address is the address the owner's own sign-in gave, as written there");
    if (o.ownerPerson !== undefined && !/^[0-9a-f]{64}$/.test(o.ownerPerson)) throw new Error("--owner-person is the keyed id --who listed for the person the operator confirms, 64 hex"); /* plant:attach-owner-person-shape */
    if (o.paddleSub !== undefined && o.paddleBuyer === undefined) throw new Error("--pay-sub with --owner-address needs --pay-buyer, the payer's code: a held payment is bound by code");
  } else if (typeof o.owner !== "string" || !SEAT_CODE_RE.test(o.owner)) throw new Error("--owner is the owner's sign-in code, the 16 symbols Studio or the desk shows");
  const named = [o.tenant, o.domain, o.issuer].filter(v => v !== undefined).length;
  if (o.deskOnly) {
    if (named || o.provider !== undefined || o.orgKeyed !== undefined || o.personal || o.allowPersonal || o.leadSeats !== undefined || o.orgDesks !== undefined)
      throw new Error("--desk-only is for the owner's own desks: no --provider, --tenant, --domain, --issuer, --org-keyed, --personal, --allow-personal, --lead-seats or --org-desks");
  } else if (o.personal) {
    if (named || o.provider !== undefined || o.orgKeyed !== undefined) throw new Error("--personal names the owner's own personal account, under the provider they signed in with: no --provider, --tenant, --domain, --issuer or --org-keyed");
  } else {
    if (typeof o.provider !== "string" || !/^[a-z][a-z0-9-]{1,30}$/.test(o.provider)) throw new Error("--provider names a provider's id, such as microsoft or google");
    if (named !== 1) throw new Error("name the organisation by --tenant, --domain or --issuer, one of them, or --personal");
    if (o.issuer !== undefined && !/^https:\/\/[a-z0-9.-]+(?::\d{1,5})?(?:\/[\x21-\x7e]*)?$/i.test(o.issuer)) throw new Error("--issuer is the provider's issuer, https");
    if (o.tenant !== undefined && !GUID_RE.test(o.tenant)) throw new Error("--tenant is a tenant id, a GUID");
    if (o.domain !== undefined && !DOMAIN_RE.test(o.domain)) throw new Error("--domain is a domain, such as example.com");
    if (o.orgKeyed !== undefined && !/^[0-9a-f]{64}$/.test(o.orgKeyed)) throw new Error("--org-keyed is the organisation as admin/org answers it, 64 hex");
  }
  if (typeof o.org !== "string" || !o.org.trim() || o.org.length > 200) throw new Error("--org names the organisation as the licence will");
  if (o.orgDesks !== undefined && o.orgDesks !== "on" && o.orgDesks !== "off") throw new Error("--org-desks is on or off");
  if (o.entraRoles && (o.deskOnly || o.personal || o.allowPersonal || o.provider !== "microsoft" || o.tenant === undefined
      || o.paddleSub !== undefined || o.payProvider !== undefined))
    throw new Error("--entra-roles is for an invoiced licence of a Microsoft tenant: --provider microsoft and --tenant, never --personal, --desk-only, --allow-personal or a held payment");
  /* A desk-only licence has no lead seat; lead_seats keeps its CHECK's least, which its desk_only overrides (core.mjs takeSeat). */
  const leadSeats = o.deskOnly ? 1 : Number(o.leadSeats), seats = Number(o.seats);
  if (!Number.isInteger(leadSeats) || leadSeats < 1 || !Number.isInteger(seats) || seats < 1) throw new Error("--lead-seats and --seats are whole numbers, at least 1");
  for (const [k, v] of [["--paid-until", o.paidUntil], ["--updates-until", o.updatesUntil], ["--pay-period-end", o.payPeriodEnd]])
    if (v !== undefined && (!DAY_RE.test(v) || isNaN(Date.parse(v + "T00:00:00Z")))) throw new Error(k + " is a day, YYYY-MM-DD");
  if (o.revenueYear !== undefined && !/^20[2-9][0-9]$/.test(o.revenueYear)) throw new Error("--revenue-year is the year the invoice's revenue arose, YYYY");
  if (o.order !== undefined && !/^[A-Za-z0-9][A-Za-z0-9/_.-]{0,59}$/.test(o.order)) throw new Error("--order is the order's or invoice's id: letters, digits, / _ . -");
  if (o.payPeriodEnd !== undefined && o.paddleSub === undefined) throw new Error("--pay-period-end is the held subscription's period end: it needs --pay-sub (--paddle-sub)");
  if (o.paddleSub !== undefined || o.paddleTxn !== undefined || o.paddleBuyer !== undefined || o.payProvider !== undefined) {
    const stripe = o.payProvider === "stripe";
    if (o.payPeriodEnd === undefined) throw new Error("--pay-sub (--paddle-sub) needs --pay-period-end, the provider's own end of the subscription's current period, YYYY-MM-DD: without it the licence's end would stand for it"); /* plant:attach-period-end-required */
    if (o.payProvider !== undefined && o.payProvider !== "paddle" && !stripe) throw new Error("--pay-provider is paddle or stripe");
    if (typeof o.paddleSub !== "string" || !(stripe ? /^sub_[A-Za-z0-9]{8,64}$/ : /^sub_[a-z0-9]{26}$/).test(o.paddleSub)) throw new Error("--pay-sub (--paddle-sub) is the held payment's subscription id");
    if (typeof o.paddleTxn !== "string" || !(stripe ? /^in_[A-Za-z0-9]{8,64}$/ : /^txn_[a-z0-9]{26}$/).test(o.paddleTxn)) throw new Error("--pay-txn (--paddle-txn) is the payment of its current period: Paddle's transaction, or Stripe's invoice");
    if (o.paddleBuyer !== undefined && (typeof o.paddleBuyer !== "string" || !SEAT_CODE_RE.test(o.paddleBuyer))) throw new Error("--paddle-buyer is the payer's sign-in code, the 16 symbols Studio or the desk shows");
    if (o.renew) throw new Error("--paddle-sub records what this payment bought, so not with --renew, whose counts are totals");
  }
  return { leadSeats, seats };
}

/** The SQL that attaches an order's seats to its organisation's one paid licence; {sql, tag, org}, org the keyed form admits
 *  holds (or the owner's own, for --personal). `o.orgKeyed` is required for an organisation; `o.run` names this run (random
 *  where not given). The statements are attach.mjs's, which the Paddle route shares, rendered as text for wrangler. */
export async function makeAttachSql(o, now) {
  const at = now === undefined ? Date.now() : now;
  const { leadSeats, seats } = checkArgs(o);
  if (!o.personal && !o.deskOnly && o.orgKeyed === undefined) throw new Error("the organisation's keyed form is needed: --org-keyed <hex>, or --service and --root to ask admin/org");
  /* A released payment makes a licence of the payment provider's kind, keyed `paddle:` or `stripe:` as the route keys the licence of its own first
     purchase, so the subscription-only rules (pay.mjs subOnlyExpr and sole) take it as they take that one (register 47.7). Where the order tag is the key,
     it is also the order's tag, so core.mjs's read of a licence by its order still finds it. */
  const tag = (o.paddleSub !== undefined ? (o.payProvider === "stripe" ? "stripe:" : "paddle:") : "") + "attach:" + (o.order !== undefined ? o.order : crypto.randomBytes(12).toString("hex")); /* plant:attach-release-key */
  const run = o.run !== undefined ? String(o.run) : crypto.randomBytes(12).toString("hex");
  const name = o.org.trim();
  /* The order's dates: the end of the day named, or a year from now for a new licence. */
  const paidNamed = o.paidUntil !== undefined ? Date.parse(o.paidUntil + "T00:00:00Z") + DAY - 1 : null;
  const updNamed = o.updatesUntil !== undefined ? o.updatesUntil : null;
  /* The provider's own period end, the day's end as --paid-until is: the subscription's paid end, which the licence's dates never decide.
     A held payment's attach requires it (checkArgs), so the licence's end is never copied in its place. */
  const periodNamed = o.payPeriodEnd !== undefined ? Date.parse(o.payPeriodEnd + "T00:00:00Z") + DAY - 1 : null;
  const newPaid = paidNamed !== null ? paidNamed : at + YEAR;
  const newUpd = updNamed !== null ? updNamed : new Date(at + YEAR).toISOString().slice(0, 10);
  const raisedPaid = q => (paidNamed !== null ? "MAX(paid_until, " + q(paidNamed) + ")" : o.renew ? "MAX(paid_until, " + q(at) + ") + " + q(YEAR) : "paid_until");
  const raisedUpd = q => (updNamed !== null ? "MAX(updates_until, " + q(updNamed) + ")"
    : o.renew ? "date(MAX(updates_until, date(" + q(at) + " / 1000, 'unixepoch')), '+365 days')" : "updates_until");
  const counts = q => (o.deskOnly ? (o.renew ? "seats = " + q(seats) : "seats = seats + " + q(seats))
    : o.renew ? "seats = " + q(seats) + ", lead_seats = " + q(leadSeats)
    : "seats = seats + " + q(seats) + ", lead_seats = lead_seats + " + q(leadSeats));
  const ownerOf = o.ownerAddress !== undefined ? ownerByAddress(o) : q => "(SELECT person FROM persons WHERE code = " + q(o.owner) + ")";
  const org = o.deskOnly ? null : o.personal
    ? { provider: q => (o.ownerAddress !== undefined ? "(SELECT provider FROM persons WHERE person = " + ownerOf(q) + ")" : "(SELECT provider FROM persons WHERE code = " + q(o.owner) + ")"), org: q => q(PERSON) + " || " + ownerOf(q) }
    : { provider: q => q(o.provider), org: q => q(o.orgKeyed) };
  const release = o.paddleSub === undefined ? undefined : { provider: o.payProvider === "stripe" ? "stripe" : "paddle", sub: o.paddleSub, txn: o.paddleTxn, buyerCode: o.paddleBuyer !== undefined ? o.paddleBuyer : o.owner,
    leadSeats: o.deskOnly ? 0 : leadSeats, seats, paidUntil: periodNamed }; /* plant:attach-period-end */
  /* The year the invoice's revenue arose, which the order is kept by (core.mjs ORDER_RETENTION_YEARS); without it, the later of the
     run's year and the licence's end year (attach.mjs). */
  const revenueYear = o.revenueYear !== undefined ? Number(o.revenueYear) : undefined;
  const made = attachStatements({ tag, run, now: at, revenueYear, code: o.owner, owner: o.ownerAddress !== undefined ? ownerOf : undefined, deskOnly: o.deskOnly, org, allowPersonal: o.allowPersonal, release,
    noKey: NO_KEY, personPrefix: PERSON, personal: PERSONAL,
    /* An order that names or extends a date is an invoice covering it (invoiced_until); one adding seats alone covers no date, and a
       released Paddle payment (--paddle-sub) is covered by its pay_subs row, never as an invoice (the test architect's read of 91d6727e). */
    raise: (q, e) => counts(q) + ", paid_until = " + raisedPaid(q) + ", updates_until = " + raisedUpd(q) + ", org = " + q(name) + ", owner = " + e.OWNER(q)
      + (!release && (paidNamed !== null || o.renew) ? ", invoiced_until = MAX(COALESCE(invoiced_until, 0), " + raisedPaid(q) + ")" : "")
      + (!release && (updNamed !== null || o.renew) ? ", invoiced_updates_until = MAX(COALESCE(invoiced_updates_until, ''), " + raisedUpd(q) + ")" : "")
      + (o.entraRoles ? ", seat_source = " + q("entra") : "") + (o.nonPersistent ? ", pooled_ok = 1" : ""),
    fresh: { org: name, seats: q => q(seats), leadSeats: q => q(leadSeats), paidUntil: q => q(newPaid), updatesUntil: q => q(newUpd), invoicedUntil: q => q(release ? 0 : newPaid), invoicedUpdatesUntil: q => q(release ? null : newUpd),
      orgDesks: o.deskOnly ? undefined : q => q((o.orgDesks === undefined ? ORG_DESKS_DEFAULT : o.orgDesks === "on") ? 1 : 0),
      seatSource: o.entraRoles ? q => q("entra") : undefined, pooledOk: o.nonPersistent ? q => q(1) : undefined } });
  /* A renewal writes the invoice's totals over the licence. A cancelled subscription past its own paid end would then be subtracted
     from them, so its seats go to nothing first, under the same order guard as the raise. A live one, or one still inside its paid time, stays. */
  if (o.renew) made.statements.splice(1, 0, statement(q => "UPDATE pay_subs SET seats = 0, lead_seats = 0, updated_at = " + q(at) + " WHERE licence = " + made.expr.L(q) + " AND status = 'canceled' AND paid_until <= " + q(at) + " AND (seats > 0 OR lead_seats > 0) AND " + made.expr.G(q))); /* plant:attach-renew-settle */
  /* On a licence whose seats follow Entra a seat is the role's alone: the owner's lead seat this order moved there is freed, so owning
     the licence seats nobody and the owner's Studio proves its role at its next sign-in. */
  if (o.entraRoles) made.statements.push(statement(q => "UPDATE seats SET seen_at = 0, proved_at = 0 WHERE kind = 'lead' AND person = "
    + made.expr.OWNER(q) + " AND licence = " + made.expr.L(q) + " AND " + made.expr.G(q)),
    /* When it turned "entra", kept from the first such order: a licence bought on a person's own before it stays theirs (core.mjs ownBefore). */
    statement(q => "UPDATE licences SET entra_at = COALESCE(entra_at, " + q(at) + ") WHERE id = " + made.expr.L(q) + " AND " + made.expr.G(q)));
  return { sql: renderSql(made.statements), tag, org: o.deskOnly || o.personal ? null : o.orgKeyed };
}

/** The organisation as admits keeps it, asked of the service's admin/org route at `o.service` (its API prefix, https), signed
 *  by the root's private half `o.rootKey`. `o.fetch` stands in for the network in a leg. */
export async function keyedOrgFrom(o) {
  if (typeof o.service !== "string" || !/^https:\/\/[a-z0-9.-]+(?::\d{1,5})?\/[a-z][a-z0-9-]{0,40}\/v1\/$/.test(o.service))
    throw new Error("--service is the licence service's address, https, ending in its /v1/ path");
  const t = o.now === undefined ? Date.now() : o.now;
  const body = { provider: o.provider, org: o.value, t,
    sig: crypto.sign(null, Buffer.from(adminOrgBytes({ provider: o.provider, org: o.value, t })), o.rootKey).toString("hex") };
  const res = await (o.fetch || globalThis.fetch)(o.service + "admin/org", { method: "POST", redirect: "error",
    headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  let got = null;
  try { got = await res.json(); } catch { got = null; }
  if (!res.ok || !got || got.ok !== true || typeof got.org !== "string" || !/^[0-9a-f]{64}$/.test(got.org))
    throw new Error("admin/org did not answer with the organisation's keyed form (" + res.status + ")");
  return got.org;
}

/* The relay each target names, as Studio's src/relay.mjs and the staging smoke name them. */
const RELAY_OF = { production: "https://etiuda.dev/relay/v1/", staging: "https://etiuda.dev/relay-staging/v1/" };
/** Whether the relay at `o.relay` (https, ending /v1/) reads a grant's seats: "seats" where it does, else why not ("older", or
 *  "unknown" with what it answered). `o.rootKey` signs the probe's grant, `o.rules` is the pinned relay's core (grantBytes),
 *  `o.fetch` stands in for the network in a leg. */
export async function relaySeats(o) {
  if (typeof o.relay !== "string" || !/^https:\/\/[a-z0-9.-]+(?::\d{1,5})?\/[a-z][a-z0-9-]{0,40}\/v1\/$/.test(o.relay))
    return { ok: false, why: "unknown", said: "--relay is the relay's address, https, ending in its /v1/ path" };
  const now = o.now === undefined ? Date.now() : o.now;
  const nobody = crypto.generateKeyPairSync("ed25519").publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  const grant = { kind: "etiuda-relay-grant", format: 1, lead: nobody, issued: now, until: now + 60 * 60 * 1000, paid: false,
    seats: { licence: crypto.randomBytes(16).toString("hex"), live: now }, sig: { alg: "ed25519", keyId: "etiuda-root", value: "" } };
  grant.sig.value = crypto.sign(null, Buffer.from(o.rules.grantBytes(grant)), o.rootKey).toString("hex");
  let res = null, got = null;
  try {
    res = await (o.fetch || globalThis.fetch)(o.relay + "t/" + crypto.randomBytes(16).toString("hex") + "/grant", { method: "POST", redirect: "error",
      headers: { "content-type": "application/json" }, body: JSON.stringify({ grant }) });
    try { got = await res.json(); } catch { got = null; }
  } catch (e) { return { ok: false, why: "unknown", said: "the relay did not answer (" + (e && e.message) + ")" }; }
  const error = got && typeof got.error === "string" ? got.error : "";
  if (res.status === 403 && error === "not-enrolled") return { ok: true, why: "seats" }; /* plant:relay-seats-read */
  if (res.status === 403 && error === "bad-grant") return { ok: false, why: "older", said: "the relay at " + o.relay + " refuses a grant's seats" };
  return { ok: false, why: "unknown", said: "the relay at " + o.relay + " answered " + res.status + " " + (error || "nothing readable") };
}

/** The root's private half, opened from its key file with its passphrase as tools/sign.mjs opens it. */
export async function openRoot(o) {
  if (typeof o.root !== "string") throw new Error("--root <file> is required to ask the service under the root (admin/org, admin/address): the root key file");
  const { readKeyFile, unlockKey } = await import("../../../src/sign.mjs");
  const passphrase = typeof o.passphraseFile === "string" ? fs.readFileSync(o.passphraseFile, "utf8").replace(/\r?\n$/, "")
    : process.env.STUDIO_KEY_PASSPHRASE || "";
  if (!passphrase) throw new Error("the root key needs its passphrase: --passphrase-file <f>, or STUDIO_KEY_PASSPHRASE");
  let open;
  try { open = unlockKey(readKeyFile(path.resolve(o.root)), passphrase); } catch { throw new Error("the root key file does not open"); }
  return open.privateKey;
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  if (o.who !== undefined) {
    const target = resolveTarget(o), sql = whoSql(o.who), cmd = buildWranglerCommand(sql, o, target);
    console.log(sql);
    printTargetAndCommand(target, cmd);
    if (o.execute) executeSql(sql, o, target);
    return;
  }
  checkArgs(o);
  const target = resolveTarget(o);
  if (o.entraRoles) {
    /* --entra-roles asks the relay first, under the root, and refuses on anything but a relay that reads seats. */
    const { relayRules } = await import("../../../src/engine.mjs");
    const asked = await relaySeats({ relay: o.relay || RELAY_OF[o.production ? "production" : "staging"], rootKey: await openRoot(o), rules: relayRules().core });
    if (!asked.ok) throw new Error("--entra-roles waits for a relay that reads seats: " + asked.said); /* plant:relay-seats-refuse */
  }
  if (!o.personal && !o.deskOnly && o.orgKeyed === undefined)
    o.orgKeyed = await keyedOrgFrom({ service: o.service, provider: o.provider, value: orgValue(o), rootKey: await openRoot(o) });
  const res = await makeAttachSql(o);
  const cmd = buildWranglerCommand(res.sql, o, target);
  console.log(res.sql);
  printTargetAndCommand(target, cmd);
  if (o.execute && !o.plan) executeSql(res.sql, o, target);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch(err => {
    console.error(err.message || err);
    process.exit(1);
  });
}
