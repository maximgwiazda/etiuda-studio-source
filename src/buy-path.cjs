/* STUDIO'S BUY (board 1020): where the trial-over door's Buy and Account's Buy row send the signed-in person, read from what the
 * licence service said of their payments beside each sign-in and check answer (service/licence/pay.mjs buyerFacts):
 *
 *   - an owner who already pays for a team licence (`pays.team`) is sent to the provider's portal, where seats are added as a change of
 *     quantity on the one subscription; with no portal there is no address at all, so Buy offers no second checkout (one subscription per
 *     licence, Max 2026-11-19 03:46);
 *   - anyone else is sent to the team's order page in Studio's language, with their own sign-in code after its #, as the desk does
 *     ("#code="): a fragment stays in the browser, so no server's log holds it, and no screen shows it (board 1017);
 *   - a person the service refused "no-licence" at sign-in, whose answer carries their own code so they can still be bought for, is sent
 *     to the team's order page with that code, as a signed-in person is (Claudius's ruling of 2026-11-22 on the test architect's finding
 *     2); the code comes from that refusal's own answer alone, and the next answer, ok or refused, drops it (noLicenceKept, and
 *     src/licence-client.mjs afterCheck);
 *   - a person whose checkout is on its way (a held entry of kind "pending", for an hour at most, pay.mjs buyerFacts) keeps the order page:
 *     a checkout whose first payment never arrives never hides Buy from a person whose trial is over (Claude alpha's rule, relayed by
 *     Claudius on the test architect's read of e01e2b37, F3); the page shows the pending line beside Buy (ui/app.js buyWords);
 *   - a managed computer, an account the service said is managed (its organisation's licence follows Entra), an account otherwise not
 *     signed in, or a build whose order origin is unset ("" until the site goes live) is sent nowhere.
 *
 * The shell builds the address (shell/main.js buyOpen) and the page is told only a yes or no (buyView), never an address. A payment the
 * service holds naming the person is kept as its newest readable entry, one line in Account by its kind.
 *
 * Plain CommonJS with no imports, so the shell, src/licence-client.mjs and the legs read the one copy (tests/studio-buy-path.mjs). */
"use strict";

const PAY_PROVIDERS = ["stripe", "paddle"];
const HELD_KINDS = ["already-pays", "managed", "review", "pending"];
/* Stripe's own no-code login link to its customer portal, `test_` before the id in test mode (the service hands no other, pay.mjs
   stripePortal); anything else is not kept, so no address of another shape can ever be opened. */
const PORTAL = /^https:\/\/billing\.stripe\.com\/p\/login\/(?:test_)?[A-Za-z0-9]{8,64}$/; /* plant:buy-portal-shape */
/* The site's origin the order pages sit under: https on etiuda.dev, no path (the desk's ORDER_ORIGIN_SHAPE, engine 7aa73820). */
const ORDER_ORIGIN = /^https:\/\/(?:[a-z0-9-]+\.)*etiuda\.dev$/; /* plant:buy-order-shape */
/* The team licence's order page in each of Studio's languages (the site's branch etiuda-site-order-2026-11-22). */
const ORDER_PATHS = Object.freeze({ en: "/en/order/team/", pl: "/pl/zamowienie/zespol/" });
/* A lead seat's code as the service makes it: 16 Crockford symbols (src/licence-client.mjs SEAT_CODE). */
const CODE = /^[0-9A-HJKMNP-TV-Z]{16}$/;

const plain = (o) => !!o && typeof o === "object" && !Array.isArray(o);

/** `pays.team` as kept: {provider, portal?}, the portal only where it is Stripe's own login link; else null. */
function paysOf(p) {
  if (!plain(p) || PAY_PROVIDERS.indexOf(p.provider) < 0) return null;
  return Object.assign({ provider: p.provider }, typeof p.portal === "string" && PORTAL.test(p.portal) ? { portal: p.portal } : {});
}
/** One `held` entry as kept: {kind, provider, at}; else null. */
function heldOf(e) {
  if (!plain(e) || HELD_KINDS.indexOf(e.kind) < 0 || PAY_PROVIDERS.indexOf(e.provider) < 0) return null; /* plant:buy-held-kind */
  return Number.isSafeInteger(e.at) && e.at > 0 ? { kind: e.kind, provider: e.provider, at: e.at } : null;
}
/** What an answer `a` says of the person's payments, as Studio keeps it: {pays?, held?}, or null where it says nothing readable. Of
 *  `pays` Studio reads `team` alone (its Buy buys a team licence; `deskOnly` is the desk's); of `held`, newest first, the first entry it
 *  can read. Each answer says it afresh, so null forgets what was kept. */
function buyKept(a) {
  if (!plain(a)) return null;
  const p = plain(a.pays) ? paysOf(a.pays.team) : null; /* plant:buy-pays-team */
  const h = Array.isArray(a.held) ? a.held.map(heldOf).find((x) => x) || null : null; /* plant:buy-held-first */
  return p || h ? Object.assign({}, p ? { pays: p } : {}, h ? { held: h } : {}) : null;
}
/** Whether no Buy is offered for the kept state `s`: this computer is managed (`managed`), or the service last said this account's
 *  organisation holds its licence through Entra (`managed: true`, kept as signinManaged, or its "no-role" refusal, signinNoRole), where a
 *  payment would only be held "managed" (pay.mjs: "The clients offer no Buy where the service has said the tenant is managed"). */
function buyBarred(s, managed) {
  return managed === true || s.signinManaged === true || s.signinNoRole === true; /* plant:buy-service-managed */
}
/** What a sign-in refused "no-licence" leaves for Buy, from that refusal's own answer `a` (src/licence-client.mjs call keeps its `me`,
 *  `pays`, `held` and `managed`): {code, buy?, managed?}, or null for any other answer, so another refusal or a code of another shape
 *  leaves nothing. The shell keeps it as signinNoLicence until the next answer. */
function noLicenceKept(a) {
  if (!plain(a) || a.ok === true || a.reason !== "signin-no-licence" || typeof a.me !== "string" || !CODE.test(a.me)) return null; /* plant:buy-refused-reason */
  const b = buyKept(a);
  return Object.assign({ code: a.me }, b ? { buy: b } : {}, a.managed === true ? { managed: true } : {});
}
/** Whose Buy the kept state `s` names: the signed-in person, by their seat's code and kept facts; or, signed in as nobody, the person a
 *  sign-in refused "no-licence" just now, by the code that refusal carried (`refused`); else null. An administrator buys nothing. */
function buyerOf(s) {
  if (s.by === "signin") return { code: s.signinCode, kept: plain(s.signinBuy) ? s.signinBuy : null };
  const nl = s.by !== "admin" && plain(s.signinNoLicence) ? s.signinNoLicence : null; /* plant:buy-refused-only */
  return nl && nl.managed !== true ? { code: nl.code, kept: plain(nl.buy) ? nl.buy : null, refused: true } : null;
}
/** Where Buy sends the person `st` (the shell's service state) holds: the portal, the team's order page in `lang` with their code after
 *  "#code=", or "" for nowhere. `origin` is the shell's ORDER_ORIGIN ("" until the site goes live); `managed` whether this computer is
 *  managed; `lang` Studio's language, "pl" or anything else for English. */
function buyAddress(st, origin, managed, lang) {
  const s = plain(st) ? st : {};
  const who = buyBarred(s, managed) ? null : buyerOf(s);
  if (!who) return ""; /* plant:buy-signed-managed */
  const pays = who.kept ? paysOf(who.kept.pays) : null;
  if (pays) return pays.portal || ""; /* plant:buy-pays-portal */
  if (typeof origin !== "string" || !ORDER_ORIGIN.test(origin) || typeof who.code !== "string" || !CODE.test(who.code)) return ""; /* plant:buy-order-code */
  return origin + ORDER_PATHS[lang === "pl" ? "pl" : "en"] + "#code=" + who.code; /* plant:buy-order-lang */
}
/** What the page is told: whether Buy goes anywhere, what the person pays with the portal as a yes or no, and the held entry; no address.
 *  Where Buy is barred (buyBarred) nothing of paying is told, but a payment held naming the person is, as the desk tells it: it says what
 *  happened to their money, not what to buy. */
function buyView(st, origin, managed) {
  const s = plain(st) ? st : {};
  const who = buyerOf(s), kept = who ? who.kept : null;
  const pays = kept && !buyBarred(s, managed) ? paysOf(kept.pays) : null, held = kept ? heldOf(kept.held) : null; /* plant:buy-view-managed */
  /* `barred`: Buy is withheld because the account or this computer is managed, so the door says so; `refused`: Buy is a refused sign-in's. */
  const barred = buyBarred(s, managed) || (s.by !== "signin" && plain(s.signinNoLicence) && s.signinNoLicence.managed === true); /* plant:buy-view-barred */
  return Object.assign({ offer: !!buyAddress(s, origin, managed, "en"), pays: pays ? { provider: pays.provider, portal: !!pays.portal } : null, held }, /* plant:buy-view-portal */
    barred ? { barred: true } : {}, who && who.refused ? { refused: true } : {});
}

module.exports = { buyKept, noLicenceKept, buyAddress, buyView, ORDER_ORIGIN, ORDER_PATHS, PORTAL };
