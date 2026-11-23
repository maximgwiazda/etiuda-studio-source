/* THE LICENCE SERVICE'S CORE (board 936, S4: the plan's L2 and L3, with Claude α's three settlements of 2026-10-22 15:35
 * and the test architect's A1 to A4).
 *
 *     import { makeService } from "./core.mjs";
 *     const service = makeService({ rules, roots, clock });   // worker.mjs passes the pinned engine's rules
 *     const response = await service.fetch(request, env);      // env: DB (D1), SERVICE_KEY, DELEGATION and HASH_KEY (secrets)
 *
 * THE CRITERION: a customer who buys or starts a trial ends up, with no hand of ours, holding a licence Studio accepts
 * and a relay grant the relay accepts, renewed quietly while the licence is paid; and nothing on the network can mint
 * either, extend one, or learn more than the Privacy paragraph says.
 *
 * THE ROUTES, every one a POST of a JSON body under the Worker's API_PREFIX, over https, with no query. API_PREFIX is a
 * variable of wrangler.toml naming its route's own path (staging's /licence-staging/v1/, Claude alpha's ruling on the test
 * architect's C5), and with none set the Worker answers under /licence/v1/, Studio's production address (src/wire.cjs):
 *   check            {lead, t, sig[, proofs]}             the quiet check: the licence, a fresh grant while paid, the revoked keys
 *   grant             {lead, proof, t, sig}                a fresh grant, to a desk proving it holds a team proof key
 *   signin            {provider, idToken, lead, t, sig[, seed]}  a person's ID token seats them as a lead and binds the key
 *   signin/renew      {provider, idToken, lead, t, sig}    a refreshed ID token proves the person of the key's lead seat again
 *   signin/desk       {provider, idToken, desk, t, sig[, seed][, pooled]}  a desk signs its person in itself, or renews, signed
 *                                                          by its own key: a desk seat where a licence admits them, and a seat
 *                                                          certificate with the licence's doors and their signature
 *                                                          (doorsSig), or none and the person's code; pooled, only ever true,
 *                                                          from a desk whose machine policy sets NonPersistent
 *   signout/desk      {desk, t, sig}                       a desk signs out, signed by its own key: its place among its person's
 *                                                          desks is freed at once and its renewal no longer taken; the seat
 *                                                          stays the person's; answered alike whether or not the key held one
 *   licence/admin     {provider, idToken, lead, t, sig[, seed]}  the administrator of a licence whose seats follow Entra reads
 *                                                          its seats bought and in use, its desks waiting and its dates; binds nothing
 *   person/admit      {code, lead, t, sig}                 a lead of a licence admits a person to it by their sign-in code
 *   person/withdraw   {person, lead, t, sig}               a lead withdraws its own admission of a person by name from its
 *                                                          licence, by the per-licence pseudonym; where no other lead's stands,
 *                                                          the "person:" row goes and their desk seats there are freed, and the
 *                                                          owner's withdrawal of a co-lead frees their lead seat too; answered
 *                                                          alike whether or not the person was admitted so
 *   person/list       {lead, t, sig}                       a lead of a licence asks for the people of the organisations it
 *                                                          admits whose desks signed in within LIST_DAYS, by code and pseudonym
 *   door/set          {lead, t, doors, sig}                a lead sets the doors of the relay teams it leads on its licence, each
 *                                                          {team, rt, url, keyId, box}; its own rows replaced, another lead's
 *                                                          untouched; an empty list clears them, and a lead whose seat lapsed
 *                                                          or was freed may still clear (the door-finding, below)
 *   seat/list         {lead, t, sig}                       the licence's owner asks for its lead seats by their codes; another
 *                                                          lead is answered their codes alone (decision 29 (b))
 *   seat/free         {kind, person, lead, t, sig}         the owner, or a lead who admitted that person, frees a desk seat at
 *                                                          once, by the person a seat certificate names (anyone else's desk
 *                                                          seat here: 403 "not-yours"; an asker with no current lead seat: 403
 *                                                          "not-lead"); the owner frees a lead seat, by its code
 *   store/grant       {desk, rt, lead, t, sig[, company, replace]}  a desk its sign-in seated within the hour asks its person's store grant for
 *                                                          the store's lead key S, and its store certificate; the service keeps
 *                                                          which relay team is the person's store, and with replace ends the older (A
 *                                                          PERSON'S STORE, below)
 *   store/end         {desk, rt, t, sig}                   a signed-in desk ends its person's store everywhere; answered alike
 * THE ONE ACT (part S2; each route's own comment says the rest): ask {kind, key, licence, lead, t, sig[, team]}, a signed-in person's press;
 * ask/status {kind, key, t, sig}; ask/refuse {ask, lead, t, sig} by a lead, or {kind, key, t, sig}, the asker taking it back; ask/pass {ask,
 * to, lead, t, sig}, the owner's; invite and invite/withdraw {address, lead, t, sig[, team]}; and person/admit {ask, lead, t, sig[, team]}
 * beside its code form.
 * seat/desk, once a lead's forward of a desk's token, is no route now: it is answered "not there" (404), as any unknown route is.
 * So is the front door (activate, activate/email, activate/confirm, trial, trial/confirm): a purchase key, an emailed code
 * and a trial by code bind nothing, since signing in is the only way to hold a paid seat (decisions 2026-11-11 22:14).
 *   admin/org         {provider, org, t, sig}              the vendor's root asks for an organisation as admits keeps it
 *   person/erase      {provider, idToken, key, seed, t, sig}  a person, proved by a fresh token bound to the asking key, has
 *                                                          everything the service keeps about them erased at once (erase.mjs)
 * and two GETs with no body, which sign nothing (board 991, below):
 *   note/desk         the desk's version note, as NOTE_DESK holds it
 *   note/studio       Studio's version note, as NOTE_STUDIO holds it
 * `sig` is Ed25519, 128 hex, over requests.mjs's bytes for the route, which begin with the route's own line; `t` is the
 * caller's clock in ms and must be within the relay's call skew of ours; a signed request is answered once. The lead's
 * key signs every request but the grant fetch, which the proof key signs: the lead's own, or one the lead registered at a
 * check (settlement 3, and the test architect's condition (4): the lead's public half leaves the team in every audit
 * pack, so it alone proves nothing).
 *
 * WHAT IS SIGNED HERE, with the service key the root delegated, and never anything else: a format-3 licence carrying the
 * delegation in `via`, or a trial's licence carrying it (below), as src/licence.mjs verifyLicence accepts either (S1), its
 * bytes the pinned catalog fold; a relay grant carrying the delegation in `via`, as the pinned relay's grantWhy
 * accepts it, its bytes the pinned grantBytes; and a desk's seat certificate (below), under the delegation's "licence", its
 * bytes requests.mjs seatCertBytes, with the doors handed beside it, their bytes seatDoorsBytes.
 * Both forms reach this file as `rules` from worker.mjs, which takes them from the pin, so nothing here retypes a byte.
 * The service key and the delegation are Worker secrets (SERVICE_KEY, the PKCS#8 of the Ed25519 key in hex; DELEGATION,
 * the root-signed document as JSON); the delegation is made by the root offline (tools/sign.mjs delegate) and never here.
 * A service whose delegation is not the root's, does not certify its key for both uses, or is not running now answers
 * every route `unavailable` and signs nothing. So does one without HASH_KEY (below).
 *
 * A TRIAL GETS A GRANT AND A TRIAL'S LICENCE (decisions: "trials are signed licences too", 2026-09-24 02:03 and
 * 2026-10-06 21:26). Studio reads a full licence by its updates date and never by today, so a trial is never one: it is
 * signed in its own kind, "etiuda-studio-trial-license", with `ends`, the trial's end in ms, inside the signature, and
 * Studio's src/licence.mjs honours it as a licence until that end by the clock, then pauses publishing, statistics and
 * proposals as the record says for after the trial. A reader older than that one reads the kind as no licence. The
 * sign-in and every quiet check of a trial hand it over, re-signed with the day's `issued` and the end unchanged.
 *
 * THE VERSION NOTES (board 991; Max's ruling of 2026-10-06 22:07: "Each program reads a small signed version note (form B) from
 * etiuda.dev"). Max signs a note offline with the root (tools/sign.mjs note) and the deploy puts it as a Worker secret,
 * NOTE_DESK or NOTE_STUDIO, as REVOKED is put. note/desk and note/studio serve it as it was handed, byte for byte, to a GET with
 * no query, rate limited per IP like every route; one that is unset, empty or longer than NOTE_MAX bytes is "not there" (404).
 * The service signs nothing in a note and judges nothing of it, and no route writes one: each program verifies it under the
 * root's public half by the format the office keeps, so a service
 * that serves a wrong note, an old one or none changes nothing an app shows but "not there".
 *
 * THE REVOKED KEYS (audit 6; S6) reach Studio through the quiet check, and a desk through signin/desk (its 200s and its 403
 * "signin"): REVOKED, when set, is the root-signed list of service keys whose licences Studio refuses and whose certificates
 * a desk reads as lapsed (src/licence.mjs, "etiuda-revocations"), made offline as the delegation is and handed as it stands. The service signs nothing in it and judges nothing of it; Studio judges it under the root and keeps
 * the newest it has seen, so a service that hands an older list, or none, takes nothing back.
 *
 * EVERY DECISION ABOUT WHO HOLDS WHAT IS ONE STATEMENT OR ONE BATCH (A4): a sign-in seat and its token's first use (one
 * batch), a trial once per person (one INSERT, by a unique index), a seat freed by its owner (one UPDATE naming the owner).
 * Nothing reads and then writes on a decision: where a read answers early, the statement that writes holds the same
 * condition again.
 *
 * ABUSE BOUNDS (A3): a request that could teach a guess something is answered alike whatever the cause; every route is rate
 * limited per IP and per lead (LIMITS, per hour).
 *
 * PRIVACY: D1 keeps hashes of IPs, the organisation and seat count a licence names, dates, and the public halves of Studio
 * keys. For sign-in it keeps, keyed under HASH_KEY: each seat's person (iss and sub),
 * Entra's tenant and object ids beside it, the organisations a licence admits, a licence's owner (a person), the desks'
 * public keys and the organisation each desk's person signed in from; and in the clear each person's sign-in code, a random pseudonym that says nothing of the person. An ID
 * token is checked and discarded, never kept: its hash is kept, keyed, only in the replay record, until the token expires. Of the token's claims
 * the person's name, address and the provider's vouching are kept in the clear on persons (option A, 2026-11-16 21:21; identOf); a lead's
 * typed invitation keeps an address in the clear for INVITE_DAYS, and an ask its person, lead and team for ASK_DAYS.
 * What the front door wrote before (a purchase key's and an address's hashes, a trial's address and domain) is read by no
 * route, and the codes and the outbox it kept are emptied by the retention purge. For each
 * relay team a lead keeps, beside its licence, the team's door (below): the relay's address, the team's two random ids and the
 * lead's two public keys, and nothing else. For a payment (pay.mjs) it keeps the provider's subscription and payment ids beside
 * the licence, the paying person as seats keeps one, the seats each subscription bought, and each notification's id, type, time and
 * outcome; no address, name or amount. Nothing is logged here. Nothing about a person is kept without an end: a person removed from a
 * licence has their rows on it gone REMOVAL_DAYS after, one who asks has them gone at once, and purgeRetention ends the rest.
 *
 * THE DOOR-FINDING (board 980; Max, 2026-11-12 18:46, "1) yes", to whether the service may keep each team's relay address, and
 * 18:57, "Yes for the licence service question", to the lead's two public keys beside it). His criterion, 2026-11-11 21:51: "Agent
 * would be able to log in into their own licenced Etiuda from any computer." A lead's Studio sets, by door/set, the doors of the
 * relay teams it leads while it is signed in: each team's id, its relay team id, the relay's address, the lead key's id (its
 * canonical id, leadKeyId of the signer, and no other) and the lead's box. A desk this service certifies is handed, in its
 * signin/desk answer, the doors on the licence its certificate names whose lead still leads it now (leadOf's conditions, read
 * at the handing), so a new computer finds its team with no invitation and takes the lead's keys from here, never from the relay.
 * Admission stays the lead's: a door only lets a certified desk ask. Both ids are kept because the lead admits a request only
 * where it names the team's own id (Studio src/join.mjs) and the relay knows the team only by its relay id, a separate random one.
 *
 * A PERSON'S STORE (section 14.12; Max, 2026-11-14 about 04:10: "Sync that is secure and seamless, working automatically in the
 * background, without any complexity placed on user's shoulders."). The store's key is in the person's own Microsoft or Google folder
 * and never here; the relay holds the sealed copy. The service signs three things for it, each in the pinned relay's own form: the
 * store grant (store/grant), for the person's code and the lead key S the desk names, while the person holds a seat; the store
 * certificate, beside the grant to a desk its own sign-in seated within the hour (it asks right after each renewal), the desk key and
 * the person's code for one day, without which the relay opens no session of the store; and the store-end notice, posted to the relay's notice route when the person erases their data, when a
 * company store's person is removed from its licence, when the person ends it, and when a newer store replaces one. The stores table
 * keeps the relay team id, the person (keyed), their code, S's public half and, for a company store, its licence; an ended row goes
 * once the relay has taken its notice, and one not taken is posted again at the Worker's schedule.
 *
 * KEYED HASHES (the test architect's C1 on S4): every IP and answered request is kept as HMAC-SHA-256 under HASH_KEY, a
 * third Worker secret of 32 random bytes in hex that Maxim's one command makes and puts (tools/sign.mjs secrets), never as
 * a plain hash, so a leaked table cannot be read back by hashing guesses. The hashes a signed request's bytes carry stay
 * plain (requests.mjs), since Studio computes them and holds no secret; they are compared, never kept.
 *
 * SIGN-IN (board 980; decisions 2026-11-11 22:14, and Claude alpha's decision 15 of 23:39, which replaces 13's trial once
 * per organisation). A seat is a named person, proved by an OpenID Connect ID token their own provider signed, never by a
 * key or an address, and proved again at least every PROOF_DAYS:
 *   - THE PROVIDERS ARE CONFIGURATION (PROVIDERS, a variable of wrangler.toml, over PROVIDER_DEFAULTS): an id, the issuer or
 *     issuers (Microsoft's templated by {tenantid}), the published keys' address, the client id tokens must be for, the claim
 *     naming the organisation and the value of it that marks a personal account. A third provider is one more entry. One
 *     with no client id is not trusted.
 *   - THE TOKEN is judged here by the runtime's own crypto.subtle: RS256 alone, by a key the provider publishes (cached by
 *     its HTTP cache headers within KEYS_TTL_MIN and KEYS_TTL_MAX, an unknown kid fetching once at most every
 *     KID_REFRESH_MS), its issuer exact (Microsoft's {tenantid} replaced by the token's own tid, a GUID, and the key's own
 *     issuer the same), its audience the client id, unexpired, not before its nbf, issued no later than now, and its nonce
 *     where the caller gives one. The token is checked and discarded; it answers once, its keyed hash in the replay record
 *     until it expires. What is kept of it is keyed: the person is (iss, sub), Entra's tid and oid beside it.
 *   - ORGANISATIONS: a licence admits organisations (the admits table): a tenant or a domain keyed under HASH_KEY
 *     (KEYED.org), which the vendor's attach script learns through admin/org, signed by the root, never holding HASH_KEY; a
 *     person, "person:" and their keyed hash (a personal account is its own organisation, a licence's owner is admitted so,
 *     and so is anyone a lead admits by their code through person/admit, until every lead who admitted them withdraws them
 *     through person/withdraw, the one admission a route ever deletes; admitted_by keeps which leads admitted whom). "personal", which once let a lead forward desks of
 *     that provider's personal accounts, is read by no route now and never seats anyone (so nobody signs in onto a stranger's
 *     licence). One organisation holds one paid licence: a second order raises its seats and dates in place, and its id stays
 *     (scripts/attach-seats.mjs). A DESK-ONLY licence (desk_only) has no lead seat, is owned by its buyer, and admits its
 *     owner's desks alone; whether one is sold, and at what price, is Max's and is not decided by this code.
 *   - THE SEAT follows the organisation's current licence (paid before trial, then the latest paid date), at sign-in and at
 *     every quiet check. Lead seats and desk seats count apart (lead_seats, seats), each decided inside one statement; a
 *     seat counts while seen within its licence's grace_days and proved within PROOF_DAYS, and stays while it counts; a seat
 *     freed by its lead (a desk's) or by the licence's owner (a lead's, by its code) is unseen and unproved at once, is
 *     taken again only by its person's fresh proof, and goes REMOVAL_DAYS after unless taken so (removals, purgeRetention); one person's Studio keys are at most DEVICES_PER_SEAT, the one unseen
 *     longest released.
 *   - PROOF AGAIN (decision 15 item 1): signin, signin/renew and signin/desk set a seat's proved_at. The quiet check never
 *     proves: from PROOF_ASK_DAYS it answers proof "due", and from PROOF_DAYS, or for a freed seat, it answers "signin" and
 *     takes, moves and grants nothing; the grant fetch refuses such a key and its desks alike. A refreshed token carries no nonce, so signin/renew binds it by four conditions
 *     together: signed by the key already bound through that person, the token's person the seat's, iat within
 *     RENEW_IAT_MS, and first use; a freed seat is not renewed. A lead's catalogs never depend on it: Studio's licence file
 *     stays where it is.
 *   - A PERSON HAS A CODE (persons): 16 Crockford symbols, random, made at their first sign-in, lead or desk, and kept for
 *     good; a lead seat's code is its person's. The check and the sign-ins answer it as `me`, with `owner`, and a lead's
 *     answers carry `ref`, its licence's public reference (a keyed hash of its id), which a seat certificate names; the
 *     owner's seat/list names the licence's lead seats by code, seat/free frees one by it, and person/admit admits by it.
 *   - A TOKEN IS BOUND TO THE KEY THAT SIGNS (the join of stages 1 and 2): Studio asks the provider for a nonce that is
 *     requests.mjs signinNonce(lead, seed) and sends the seed beside the token; a token signs in only where its nonce is the
 *     one the signed lead and the seed make, so one captured for one Studio key is refused for another. The nonce is
 *     required: a token with none, or a body with no seed, is refused alike as "token".
 *   - THE DESK SIGNS IN ITSELF (night decision 18): signin/desk is signed by the desk's own key, never by a lead, and its
 *     first sign-in's token must carry signinNonce(desk, seed), so a token captured for one desk is no token for another.
 *     A body with no seed is the desk's renewal, by a lead's four conditions: a desk key held for that person (person_desks,
 *     recorded at a first sign-in), the token's person, iat within RENEW_IAT_MS, and first use; a renewal of a seat its lead
 *     freed is "signin". The service, never the desk, chooses the licence: the organisation's, else one admitting the person
 *     by name, else a desk-only licence they own. One person holds at most DESKS_PER_PERSON desks seen within the grace, a
 *     fourth refused as "desks"; their pooled desks (a sign-in with pooled: true, signed under its own line) hold one place between
 *     them, each new one taking it over from the last (section 12.2 point 3). Where no licence admits them the answer is no
 *     certificate and their code, to give a lead.
 *     A desk's sign-out (night decision 20 (a)) frees that computer's place among the three at once and ends its renewal; the
 *     person's seat on the licence stays theirs, and only an interactive sign-in takes the place again.
 *   - THE LEAD'S LIST (night decision 20 (c)): person/list names, by code and per-licence pseudonym, the people whose desk
 *     signed in within LIST_DAYS from an organisation the lead's licence admits, kept keyed beside the desk (person_desks.org).
 *     A personal account has no organisation and is never listed: it reaches a lead by an invitation or by its code.
 *   - THE SEAT CERTIFICATE is all a lead ever sees of a desk's person: the licence's public reference, the desk key, the
 *     per-licence pseudonym of the person, their code, issued, and until, the earliest of PROOF_DAYS ahead, the licence's
 *     paid date and a trial's end; signed by the service key with the delegation in `via`. No token, name or address.
 *   - A TRIAL: a lead's first sign-in where no licence admits them starts a TRIAL_DAYS trial licence, once per
 *     TRIAL_ONCE_PER (one statement, by a unique index), answered with a trial licence and a grant. Once per person, it is owned
 *     by its person and admits only them, so it never stands in an organisation's way; its lead admits others by their code.
 *     When the owner's organisation pays, the attach supersedes the trial and moves their seat and keys. A desk's first
 *     sign-in starts the desk's own trial beside it, under its own unit (DESK_TRIAL), desk-only with one desk seat: two
 *     trials per person, each once, neither reading the other's row.
 *   - REFUSALS, each one body whatever the cause: "token" (a bad, expired, replayed or foreign token, or a renewal that
 *     does not bind), "no-licence" (no licence admits this person's organisation, its trial had), "full" (no seat of that
 *     kind is free), "signin" (the seat was freed, or its proof lapsed), and for a desk "desks" (its person already holds
 *     three). A refused attempt leaves its token unspent.
 *
 * A LICENCE WHOSE SEATS FOLLOW ENTRA (decision 49, held for Max's ruling; section 11 of the lead engineer's design of 2026-11-13).
 * Claude alpha's criterion: "a large company's IT decides, in tools it already uses and without touching each computer, who may use
 * Etiuda, in which role and with which account". A licence's seat_source is "admit" (everything above) or "entra", which only
 * scripts/attach-seats.mjs --entra-roles sets. On an "entra" licence the token's app roles alone decide a seat (rolesOf, failing
 * closed): Etiuda.Lead a lead seat, Etiuda.Agent or Etiuda.Lead a desk seat, Etiuda.Admin none but the card licence/admin reads.
 * For a person of its tenant no admission, naming, switch or trial is read or started; a token without the role frees the seat it
 * proves and answers "no-role"; the person, list and seat routes answer "managed" and change nothing. Its seats count, and its desks'
 * certificates run, ENTRA_PROOF_DAYS from their last proof.
 */
import * as Q from "./requests.mjs";
import { makePayRoute, inForceCol, inForceOf, buyerFacts, HELD_SHOWN_DAYS } from "./pay.mjs";
import { paddleProvider } from "./pay-paddle.mjs";
import { stripeProvider, stripePortal } from "./pay-stripe.mjs";
import { eraseStatements, MEMBER_CHANGE_DAYS, MEMBER_CHANGE_MS } from "./erase.mjs";

const API = "/licence/v1/";
/* The path the Worker answers under: API_PREFIX where wrangler.toml sets one, else Studio's production path; a value of any
   other shape is a misconfigured Worker, which answers every route "unavailable". */
const PREFIX_RE = /^\/[a-z][a-z0-9-]{0,40}\/v1\/$/;
function apiPrefixOf(env) {
  const p = env ? env.API_PREFIX : undefined;
  if (p === undefined || p === null || p === "") return API;
  if (typeof p !== "string") return null;
  if (!PREFIX_RE.test(p)) return null;
  return p;
}
const LICENCE_KIND = "etiuda-studio-license", LICENCE_FORMAT = 3, LICENCE_SIG_ALG = "Ed25519";
/* A trial's licence: src/licence.mjs TRIAL_KIND and TRIAL_FORMAT, held equal by tests/licence-service.mjs. */
const TRIAL_KIND = "etiuda-studio-trial-license", TRIAL_FORMAT = 1;
/* What a route answers in `ended` for a paid licence past its paid end (signedIn, check), beside a refund's "refunded":
   src/licence-client.mjs PAID_ENDED, held equal by tests/licence-service.mjs. */
const PAID_ENDED = "expired";
const GRANT_KIND = "etiuda-relay-grant", GRANT_SIG_ALG = "ed25519";
const DELEGATION_KIND = "etiuda-delegation";
/* The EULA's three devices per seat and Studio's fourteen-day trial: src/licence.mjs DEVICES_PER_SEAT and TRIAL_DAYS, held
   equal by tests/licence-service.mjs, since the Worker cannot load that file. */
const DEVICES_PER_SEAT = 3, TRIAL_DAYS = 14;
const HOUR = 3600000, DAY = 24 * HOUR;
const BODY_MAX = 8192, PROOFS_MAX = 32;
/* Requests per hour per bucket, by route: per IP and per lead. */
const LIMITS = Object.freeze({
  "check": { ip: 60, lead: 20 },
  "grant": { ip: 120, lead: 60 },
  "note/desk": { ip: 60 },
  "note/studio": { ip: 60 },
  "signin": { ip: 20, lead: 10 },
  "signin/renew": { ip: 20, lead: 10 },
  /* A desk signs in at each start and daily; an office's desks may share one address, so the address's bucket is wide. */
  "signin/desk": { ip: 600, lead: 20 },
  "signout/desk": { ip: 600, lead: 20 },
  "person/admit": { ip: 60, lead: 60 },
  "person/withdraw": { ip: 60, lead: 60 },
  "person/list": { ip: 60, lead: 60 },
  "door/set": { ip: 60, lead: 60 },
  "seat/list": { ip: 60, lead: 60 },
  "seat/free": { ip: 60, lead: 60 },
  "seat/stay": { ip: 60, lead: 60 },
  "lead/name": { ip: 60, lead: 60 },
  "lead/accept": { ip: 60, lead: 60 },
  "licence/set": { ip: 60, lead: 60 },
  "licence/admin": { ip: 60, lead: 60 },
  "admin/org": { ip: 20 },
  "admin/address": { ip: 20 },
  "person/erase": { ip: 20, lead: 10 },
  "store/grant": { ip: 600, lead: 20 },
  "store/end": { ip: 60, lead: 20 },
  /* The one act (part S2): a desk looks at its ask every two minutes while it waits (the design's 1.1), so its status is wide. */
  "ask": { ip: 60, lead: 20 },
  "ask/status": { ip: 600, lead: 60 },
  "ask/refuse": { ip: 60, lead: 60 },
  "ask/pass": { ip: 60, lead: 60 },
  "invite": { ip: 60, lead: 60 },
  "invite/withdraw": { ip: 60, lead: 60 },
  /* Board 1017: a naming by address or from the licence's people, its withdrawal, and the owner's confirmation of a candidate. */
  "lead/invite": { ip: 60, lead: 60 },
  "lead/pick": { ip: 60, lead: 60 },
  "lead/withdraw": { ip: 60, lead: 60 },
  "lead/confirm": { ip: 60, lead: 60 },
});

/* SIGN-IN'S PROVIDERS (board 980), the facts each provider documents, read 2026-11-11 and cited in
   the lead engineer's report of 2026-11-11. A PROVIDERS entry naming one of these ids takes these and
   adds its clientId; an entry with another id states every field (a third provider, no code).
   Microsoft: the tenant-independent issuer "https://login.microsoftonline.com/{tenantid}/v2.0", whose {tenantid} the token's
   own tid replaces before an exact match, the keys at common/discovery/v2.0/keys, each key carrying its own issuer
   (learn.microsoft.com/entra/identity-platform/access-tokens, "Validate the issuer" and "Validate the signing key issuer");
   tid names the organisation, and 9188040d-6c67-4c5b-b112-36a304b66dad is "the personal Microsoft account tenant"
   (id-token-claims-reference). Google: iss "https://accounts.google.com" or "accounts.google.com", hd names the Workspace
   domain and "The absence of this claim indicates that the account does not belong to a Google hosted domain"
   (developers.google.com/identity/openid-connect/openid-connect); jwks_uri as its discovery document gives it. */
const CONSUMERS_TENANT = "9188040d-6c67-4c5b-b112-36a304b66dad";
const PROVIDER_DEFAULTS = Object.freeze({
  microsoft: Object.freeze({ issuer: Object.freeze(["https://login.microsoftonline.com/{tenantid}/v2.0"]),
    jwks: "https://login.microsoftonline.com/common/discovery/v2.0/keys", org: "tid", personal: CONSUMERS_TENANT }),
  google: Object.freeze({ issuer: Object.freeze(["https://accounts.google.com", "accounts.google.com"]),
    jwks: "https://www.googleapis.com/oauth2/v3/certs", org: "hd", personal: null }),
});
/* The published keys: kept by the response's max-age, never less than five minutes nor more than Microsoft's "every 24
   hours"; a token naming a kid not held fetches the keys again, at most once in KID_REFRESH_MS, so a stranger's made-up
   kids cost one fetch in five minutes. A body longer than KEYS_MAX is no keys. */
const KEYS_TTL_MIN = 5 * 60000, KEYS_TTL_MAX = 24 * 3600000, KID_REFRESH_MS = 5 * 60000, KEYS_MAX = 65536;
/* How far a token's nbf and iat may stand ahead of our clock. exp has none: an expired token is expired. */
const TOKEN_LEEWAY_MS = 60000, TOKEN_MAX = 7000;
/* PROOF AGAIN (Claude alpha's decision 15 item 1): a seat held by sign-in lapses PROOF_DAYS after its last proof, and from
   PROOF_ASK_DAYS the quiet check asks for a fresh one. A refreshed token renews a seat, a lead's or a desk's, only if issued
   within RENEW_IAT_MS, since Studio and the desk each exchange and post it at once. */
const PROOF_DAYS = 30, PROOF_ASK_DAYS = 25, RENEW_IAT_MS = 10 * 60000;
/* THE WINDOW ON A LICENCE WHOSE SEATS FOLLOW ENTRA (section 11.10; Max's to rule): in place of PROOF_DAYS there, both how long a seat
   counts after its last proof and how far a desk's certificate runs; the quiet check asks a lead for a proof from half of it. */
const ENTRA_PROOF_DAYS = 7;
const ENTRA_PROOF_MS = ENTRA_PROOF_DAYS * DAY;
/* THE POOLED DESKS FREED (option (d)): a grant names those freed within FREED_SPAN_MS, the longest a certificate on such a licence runs
   and the relay's grace after it, newest first and at most FREED_MAX. POOLED_GRACE_MS and FREED_MAX are the relay's (relay/core.cjs;
   RS13 holds them equal to the pinned relay's). */
const POOLED_GRACE_MS = 72 * HOUR, FREED_MAX = 1000;
const FREED_SPAN_MS = ENTRA_PROOF_MS + POOLED_GRACE_MS;
/* A STUDIO'S MEMBER CERTIFICATE (the addendum on the member certificate, as Claude alpha decided it on 2026-11-17, Max's to overturn): it
   runs MEMBER_DAYS at most; the member key standing for one Studio key and person changes only at an interactive sign-in, at most once in
   MEMBER_CHANGE_DAYS; a person holds at most MEMBER_LIVE_MAX member keys whose certificate has not ended (member_keys). MEMBER_CHANGE_DAYS
   is never less than MEMBER_DAYS: the one key a row keeps as replaced (was_until) has always ended by the next change. */
const MEMBER_DAYS = 7, MEMBER_LIVE_MAX = 3;
const MEMBER_MS = MEMBER_DAYS * DAY;
/* THE ENTRA ROLES (section 11.9): the values of the app roles on Etiuda's registration, case-sensitive. A token's `roles` is judged
   whole: an array of 1 to ROLES_MAX distinct strings of at most ROLE_MAX characters, each one of these, or no role at all. */
const ROLE = Object.freeze({ agent: "Etiuda.Agent", lead: "Etiuda.Lead", admin: "Etiuda.Admin" });
const ROLES = Object.freeze([ROLE.agent, ROLE.lead, ROLE.admin]), ROLES_MAX = 3, ROLE_MAX = 64;
const rolesBound = v => Array.isArray(v) && v.length >= 1 && v.length <= ROLES_MAX && new Set(v).size === v.length
  && v.every(r => typeof r === "string" && r.length <= ROLE_MAX && ROLES.includes(r));
/* THE SERVICE'S OWN ACCESS TOKEN (section 11.11): on a licence whose seats follow Entra the roles come from the access token Microsoft
   issues for the licence service's own registration (PROVIDERS' `service`, its client id), never from the ID token: its scope, its
   version, and the most characters it may be, so both tokens fit one body. */
const ACCESS_SCOPE = "Licence.Use", ACCESS_VER = "2.0", ACCESS_MAX = 4096;
/** The roles a token's claim gives, or null where it gives none: missing, malformed, over the bound or naming a role not defined. */
function rolesOf(v) {
  if (v === undefined) return null; /* plant:roles-absent */
  return rolesBound(v) ? new Set(v) : null; /* plant:roles-bound */
}
/* The seat certificate's kind and format (the interface of 2026-11-12, as src/desk-seat.mjs reads it). */
const CERT_KIND = "etiuda-seat-certificate", CERT_FORMAT = 1;
/* A TRIAL BY SIGN-IN is had once per this (Claude alpha's decision 15 (a), replacing 13's "organisation"): "person", one
   lead's own, owned by them and admitting only them as lead, so no colleague can take or squat it; or "organisation", the
   tenant, the domain or the personal account. Its seats: one lead, TRIAL_DESK_SEATS desks, thirty, the size a team can
   already be today (Claude alpha's decision 14, 2026-11-11). */
const TRIAL_ONCE_PER = "person", TRIAL_LEAD_SEATS = 1, TRIAL_DESK_SEATS = 30;
const TRIAL_PERSONAL_DESK_SEATS = 3; /* plant:trial-personal-desks */
const RETENTION_DAYS = 365, RETENTION_MS = RETENTION_DAYS * DAY;
/* A PERSON'S RECORDS HAVE A STATED END (section 13; Claude alpha's decision 50, each number one constant and his to change). A person
   removed from a licence has their rows on it gone REMOVAL_DAYS after the removal (removals, purgeRetention); a person who asks has
   everything gone at once (person/erase), their desks named to the licences' leads for ERASURE_DAYS so the relay takes them off.
   An order is kept to 31 December of its revenue year plus ORDER_RETENTION_YEARS (the accountant's reading, "prepared, not advised":
   Ordynacja podatkowa art. 86 § 1 with art. 70 § 1, the VAT act art. 112; the year the revenue arose, not the year it was paid, per
   the lead researcher's report of 2026-11-13), and not while purge_holds holds "orders", whose reason names the
   art. 70 § 2 to § 4 suspension among others (deferral, bankruptcy, enforcement). Where an order holds no revenue year its writer
   wrote the later of its payment year and its licence's end year (attach.mjs, pay.mjs). A payment binding that never paid lives
   FAILED_PAYMENT_DAYS, Claude alpha's decision on that report: no tax or anti-money-laundering rule reaches a failed payment, so the
   number is a choice under GDPR art. 5(1)(e). */
const REMOVAL_DAYS = 30, REMOVAL_MS = REMOVAL_DAYS * DAY;
/* A freed pooled desk's row (freed_desks) goes a year after it was freed whether or not a grant reads it again, as the relay's swept
   marks do (decision 50: nothing kept without an end). */
const FREED_KEEP_DAYS = 365, FREED_KEEP_MS = FREED_KEEP_DAYS * DAY;
const ERASURE_DAYS = 30, ERASURE_MS = ERASURE_DAYS * DAY;
/* A RELEASED STUDIO KEY'S ROW (releases) lives as long as the cap it is kept for reads it and no longer (Claude alpha's ruling under
   decision 50: "Give those rows an end of their own instead: a releases row lives only as long as the monthly cap reads it"). No
   statement enforces a monthly cap on releases today (schema.sql once said one did); the one reader is holdingOf, whose check answers a
   released key "released". Claude alpha, 2026-11-15: "Keep α⁵'s 30 days on releases rows for now"; whether releases are capped at all is
   Max's to rule. */
const RELEASE_KEEP_DAYS = 30, RELEASE_KEEP_MS = RELEASE_KEEP_DAYS * DAY;
/* A check names at most ERASED_MAX erased desks, the rows ending soonest (erasedFor). Past it no row's clock runs: the purge keeps each
   row beyond the first ERASED_MAX of its licence at least ERASURE_MS ahead, so its thirty days start once the rows before it have gone
   (Grok's review 3 of erasure, finding 3: a person on pooled computers holds a new key each morning, and one erasure can pass it). */
const ERASED_MAX = 256;
const ORDER_RETENTION_YEARS = 6, ORDERS_HOLD = "orders";
/* THE LAST YEAR AN ORDER IS KEPT: through 31 December of its revenue year (migrations/0016_erase.sql writes the cautious year where its
   licence cannot be known), or of the year after it was made where it records none, plus ORDER_RETENTION_YEARS; while purge_holds holds
   ORDERS_HOLD nothing goes. One expression, which purgeRetention deletes by and person/erase's "what stays" names by, so the rule is said
   once. `o` prefixes the orders table's columns ("" or an alias with its dot). */
const orderYearOf = ms => "CAST(strftime('%Y', " + ms + " / 1000, 'unixepoch') AS INTEGER)";
const orderLastYear = o => "COALESCE(" + o + "revenue_year, " + orderYearOf(o + "at") + " + 1) + " + ORDER_RETENTION_YEARS;
const FAILED_PAYMENT_DAYS = 30;
/* A lead seat's code: 16 Crockford symbols, 80 random bits. */
const SEAT_CODE_LEN = 16, SEAT_CODE_RE = /^[0-9A-HJKMNP-TV-Z]{16}$/;
/* ONE PERSON, AT MOST THREE ACTIVE DESKS (board 980, stage 3; the condition Max agreed to at 22:14, as Claude alpha gave it at
   22:15: "Studio caps one person at three active desks"). A desk is active while it proved its person within its licence's
   grace; without the cap one account shared by thirty agents would be one seat (the lead engineer's page of 2026-11-11,
   section 3). Desks sign in here themselves, so this is the count, and no certificate is made past it. */
const DESKS_PER_PERSON = 3;
/* THE DOORS (the door-finding): at most DOORS_PER_LEAD in one lead's set, DOORS_HANDED in a desk's answer; a team id and a relay
   team id in Studio's shape. A DOOR'S RELAY IS ONE THE APPS TRUST, AND NOTHING ELSE (Argon's review of the sign-in service, finding
   3; Claude alpha's decision 31 of 2026-11-12: "the desk keeps and knocks on a door only where its address is one of the relay
   addresses the build itself trusts (ours), the same list the service pins doors to when it stores them"): DOOR_RELAYS, the
   shipped relay, as src/relay.mjs RELAY_URL writes it into a team row (src/wire.cjs RELAY_ORIGIN without its last slash), taken
   with or without that slash; and on a staging Worker (one answering under any API_PREFIX but production's) the staging relay
   too, DOOR_RELAYS_STAGING. These are the engine's samples' "installed" rows, and on staging its "unpackaged" rows besides (the
   engine's tests/door-relays.json, which the desk reads; its bytes are Studio's tests/fixtures/door-relays.json). doorRelayOk is
   the one judge of a door's address. A door carries no lead's signature over its address, so no lead key, a co-lead's or a stolen
   one, can steer a desk the service certifies to a relay a lead never chose. When a customer's own relay becomes a product
   feature this list becomes a setting here and on the desk. */
const DOORS_PER_LEAD = 16, DOORS_HANDED = 16;
const DOOR_RELAYS = Object.freeze(["https://etiuda.dev/relay/v1"]);
const DOOR_RELAYS_STAGING = Object.freeze(["https://etiuda.dev/relay-staging/v1"]);
const doorRelayOk = (url, staging) => {
  if (typeof url !== "string") return false;
  const bare = url.endsWith("/") ? url.slice(0, -1) : url;
  return DOOR_RELAYS.indexOf(bare) >= 0 || (staging === true && DOOR_RELAYS_STAGING.indexOf(bare) >= 0); /* plant:door-staging */
};
const DOOR_TEAM_RE = /^t-[0-9a-f]{16}$/, DOOR_RT_RE = /^[0-9a-f]{32}$/;
/* THE LEAD'S LIST (the product designer's Team screen): people whose desk signed in within LIST_DAYS, at most LIST_MAX of them. */
const LIST_DAYS = 30, LIST_MAX = 100;
/* What a licence row holds where a purchase key's and address's hashes went, columns the schema keeps NOT NULL and unique:
   a value no hash (64 hex) ever is. */
/* THE OWNER'S SWITCH as a licence the attach or a payment makes starts (decision 47's addition): false, only people the owner or a
   named lead admitted are seated; true, colleagues' desks are seated by the organisation admission. The default is Max's to rule. */
const ORG_DESKS_DEFAULT = false;
const NO_KEY = "signin:";
/* Admits' values beside a tenant's or a domain's hash. */
const PERSON = "person:", PERSONAL = "personal";
/* The unit a desk's own trial is had by, beside the person's keyed hash (Studio's is PERSON's, or the organisation's). */
const DESK_TRIAL = "desk:";
/* THE VERSION NOTES' ROUTES, each to the Worker secret it serves, and the most bytes a note is (the format's 1024). */
const NOTES = Object.freeze({ "note/desk": "NOTE_DESK", "note/studio": "NOTE_STUDIO" });
const NOTE_MAX = 1024;
/* What a keyed hash is taken of: a line naming the kind, then the value, so one kind never stands for another. */
const KEYED = Object.freeze({
  ip: "etiuda-licence-ip", seen: "etiuda-licence-seen",
  person: "etiuda-licence-person", tid: "etiuda-licence-tid", oid: "etiuda-licence-oid", token: "etiuda-licence-token",
  personOut: "etiuda-licence-person-out", org: "etiuda-licence-org", ref: "etiuda-licence-ref",
  /* An address someone typed to invite or name a person (board 1017's rule 5, Claude alpha's word of 2026-11-22 00:57: "The address is not
     kept in clear for thirty days if a keyed hash can do the matching"), and the handle a lead's Studio is given for one on its licence. */
  address: "etiuda-licence-address", inviteOut: "etiuda-licence-invite-out",
});

const HEX64 = /^[0-9a-f]{64}$/, HEX128 = /^[0-9a-f]{128}$/;
const ID_RE = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/;
const plain = v => !!v && typeof v === "object" && !Array.isArray(v);
const exactly = (o, names, optional) => Object.keys(o).every(k => names.includes(k) || (optional || []).includes(k))
  && names.every(k => Object.prototype.hasOwnProperty.call(o, k));
const isT = v => Number.isSafeInteger(v) && v > 0;
/* A sign-in's member key, where named: a public half of its own, never the lead key. */
const memberOk = b => b.member === undefined || (HEX64.test(String(b.member)) && b.member !== b.lead);
/* A lead's doors as door/set takes them: at most DOORS_PER_LEAD, each exactly {team, rt, url, keyId, box} of its shape, keyId the
   signer's own canonical id (`keyId`, requests.mjs leadKeyId), and no team twice. */
const doorsShape = (doors, keyId, staging) => Array.isArray(doors) && doors.length <= DOORS_PER_LEAD /* plant:door-count */
  && doors.every(d => plain(d) && exactly(d, ["team", "rt", "url", "keyId", "box"], ["label"]) && (d.label === undefined || labelOk(d.label)) && DOOR_TEAM_RE.test(String(d.team))
    && DOOR_RT_RE.test(String(d.rt)) && doorRelayOk(d.url, staging) /* plant:door-url */
    && d.keyId === keyId && HEX64.test(String(d.box))) /* plant:door-key-id */
  && new Set(doors.map(d => d.team)).size === doors.length;
const unhex = s => Uint8Array.from(String(s).match(/../g) || [], h => parseInt(h, 16));
const dayOf = ms => new Date(ms).toISOString().slice(0, 10);
function randomHex(n) { const b = new Uint8Array(n); globalThis.crypto.getRandomValues(b); return Q.toHex(b); }

/* WHAT THE SERVICE KEEPS OF A PERSON (the one act of acceptance, part S1; option A, Max, 2026-11-16 21:21: "Let's go with A for now. It's
   simpler and more robust."; the design's 2.1 and A3, the lead engineer's design of 2026-11-16, in the
   office). From a sign-in's token: the person's name, their address, and whether their provider vouches the address, and nothing else.
   Microsoft: `name`, and `preferred_username` where it is an address, which its ID token reference names for "human-readable UI as a
   username" and says "can't be used to make authorization decisions"; its `email` claim is not read on its own ("Never use it for authorization or
   to save data for a user"), so on its own Microsoft vouches for no address here (but see its one mark, below). Google: `name`, and `email`, vouched where `email_verified` is true. A
   third provider gives nothing. A name is kept to NAME_MAX characters with control and direction-override characters taken out, so no name
   can rearrange what a lead's screen shows beside it; an address is one shape of local part, "@" and a dotted domain, at most ADDRESS_MAX.
   Each is null where the token carries none, and a null leaves what was kept (identStatement).
   MICROSOFT'S ONE MARK (board 1017; Claude alpha's word of 2026-11-22 00:57: an address is vouched where "Microsoft itself marks [its domain]
   verified, if Microsoft gives such a mark"). Its optional claims reference (learn.microsoft.com/en-us/entra/identity-platform/
   optional-claims-reference, updated 2026-08-20) defines `xms_edov` as a "Boolean value indicating whether the user's email domain owner has
   been verified": "An email is considered to be domain verified if it belongs to the tenant where the user account resides and the tenant
   admin has done verification of the domain", or is a Microsoft account's, a Google account's or a one-time passcode's; "For this claim to be
   returned in the token, the presence of the `email` claim is required." So `email` is read only where `xms_edov` is exactly true, and is
   then vouched as a Google Workspace address is: the domain's verified owner says whose it is. Every other Microsoft token is as above. Both
   are optional claims Microsoft sends only where the app's registration asks for them (an act at the registration, not in this code). */
const NAME_MAX = 128, ADDRESS_MAX = 254;
/* The service's one fold of an address, for every write and comparison of one (the test architect's hold 5 on S2): JavaScript's lower case. */
const keyOfAddress = v => (typeof v === "string" ? v.toLowerCase() : null);
const ADDRESS_RE = /^[^\s@\x00-\x1f\x7f]{1,64}@[^\s@\x00-\x1f\x7f]+\.[^\s@\x00-\x1f\x7f.]+$/;
const nameOf = v => {
  if (typeof v !== "string") return null;
  const s = Array.from(v.replace(/[\p{Cc}\u2028\u2029\u200e\u200f\u202a-\u202e\u2066-\u2069]/gu, " ").replace(/\s+/g, " ").trim()).slice(0, NAME_MAX).join("").trim();
  return s ? s : null;
};
const addressOf = v => (typeof v === "string" && v.length <= ADDRESS_MAX && ADDRESS_RE.test(v.trim()) ? v.trim() : null); /* plant:ident-address */
/* THE VERIFIED DOMAIN OF A WORK ACCOUNT (board 1017; Claude alpha's word of 2026-11-22, carried by Claudius: "for a work account, the verified
   domain where the provider gives one (Microsoft: only when xms_edov is true; Google: hd where present)"), so an owner or a lead can tell two
   people apart who claim one address. Microsoft: the domain of the email xms_edov marks, for an account of a work tenant, never the personal
   tenant's (CONSUMERS_TENANT). Google: hd where present (the Workspace domain; absent for an account outside a Google hosted domain, as the
   fixture of Google's documented claims has it). In lower case, of a domain's shape; null otherwise. */
const DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,63}$/;
const domainOf = v => (typeof v === "string" && v.length <= 253 && DOMAIN_RE.test(v.toLowerCase()) ? v.toLowerCase() : null);
function identOf(pid, claims) {
  /* A PERSONAL MICROSOFT ACCOUNT IS NEVER VOUCHED (Claude alpha's rule of 2026-11-22 02:30, carried by Claudius: the service "treats a personal
     Microsoft account's address (the consumer tenant, tid 9188040d-6c67-4c5b-b112-36a304b66dad) as unvouched whatever the token says"): the mark
     is honoured only for an account of a work tenant, so a consumer token's email and xms_edov are passed over and it is kept as below. */
  if (pid === "microsoft" && claims.xms_edov === true && claims.tid !== CONSUMERS_TENANT /* plant:ident-ms-personal */ && addressOf(claims.email) !== null) return { name: nameOf(claims.name), address: addressOf(claims.email), vouched: 1, /* plant:ident-ms-edov */
    domain: domainOf(addressOf(claims.email).split("@")[1]) }; /* plant:ident-ms-domain */
  if (pid === "microsoft") { const address = addressOf(claims.preferred_username); return { name: nameOf(claims.name), address, vouched: address === null ? null : 0, domain: null }; } /* plant:ident-ms */
  if (pid === "google") { const address = addressOf(claims.email); return { name: nameOf(claims.name), address, vouched: address === null ? null : claims.email_verified === true ? 1 : 0,
    domain: domainOf(claims.hd) }; } /* plant:ident-google-domain */
  return null;
}
/* Someone nobody accepted has their name and address cleared NAMES_DAYS after their last sign-in (ruled 2026-11-16 22:15, "cleared 30 days
   after the last sign-in for someone nobody accepted, not a year"; purgeRetention); the row itself keeps its own end. */
const NAMES_DAYS = 30, NAMES_MS = NAMES_DAYS * DAY;
/* THE ONE ACT (part S2): an ask lives ASK_DAYS, answered or not, and an invitation INVITE_DAYS (the design's 2.1: "answered, taken back, or 30
   days"; "used, withdrawn, or 30 days"); an ask's id is 32 hex, a licence's public reference 32 hex (refOf), a team's name at most LABEL_MAX
   characters, the shape a name is kept in (labelOk: nameOf leaves it as it is). */
const ASK_DAYS = 30, ASK_MS = ASK_DAYS * DAY, INVITE_DAYS = 30, INVITE_MS = INVITE_DAYS * DAY, LABEL_MAX = 64;
const ASK_ID_RE = /^[0-9a-f]{32}$/, REF_RE = /^[0-9a-f]{32}$/;
const labelOk = v => typeof v === "string" && v.length >= 1 && v.length <= LABEL_MAX && nameOf(v) === v; /* plant:label-ok */

/** A lead seat's code: SEAT_CODE_LEN Crockford symbols, each from five random bits. */
function makeSeatCode() {
  const b = new Uint8Array(SEAT_CODE_LEN);
  globalThis.crypto.getRandomValues(b);
  return Array.from(b, x => Q.CROCKFORD[x & 31]).join("");
}

/** A statement's values in the order it names them: q(v) is the ?N standing for v, the same N for the same value, so a
 *  statement composed of optional parts binds exactly what it names (D1 refuses a value no ?N names). */
function params() {
  const values = [];
  const q = v => { const x = v === undefined ? null : v; let i = values.indexOf(x); if (i < 0) { values.push(x); i = values.length - 1; } return "?" + (i + 1); };
  q.values = values;
  return q;
}

/** An organisation as admits keeps it: keyed under HASH_KEY, of the provider's id and the organisation's own value. */
const orgKeyed = (hmacKey, provider, value) => keyedHash(hmacKey, KEYED.org, String(provider) + "\n" + String(value).toLowerCase()); /* plant:org-keyed */

/** HMAC-SHA-256 under `hmacKey` (a WebCrypto HMAC key) of `kind`'s line and then `value`, as lower-case hex. */
async function keyedHash(hmacKey, kind, value) {
  const enc = new TextEncoder(), head = enc.encode(kind + "\n");
  const tail = typeof value === "string" ? enc.encode(value) : value;
  const all = new Uint8Array(head.length + tail.length);
  all.set(head, 0); all.set(tail, head.length);
  return Q.toHex(await globalThis.crypto.subtle.sign("HMAC", hmacKey, all));
}

/* ---- answers ------------------------------------------------------------------------------------------------------ */

const answer = (status, obj) => new Response(JSON.stringify(obj), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
/* signin/desk binds `answer` over this so each return stays the call the record reads, and an open request is carried on an ok answer. */
const answerPlain = answer;
const missing = () => new Response(null, { status: 404, headers: { "cache-control": "no-store" } });
/* ONE REFUSAL FOR EVERYTHING A GUESS COULD LEARN FROM (A3): a grant fetch without a proof or for a key holding nothing. */
const refused = () => answer(403, { ok: false, reason: "refused" });
const malformed = () => answer(400, { ok: false, reason: "malformed" });
const slowDown = () => answer(429, { ok: false, reason: "slow-down" });
const unavailable = () => answer(503, { ok: false, reason: "unavailable" });
const fault = () => answer(500, { ok: false, reason: "fault" });

/* ---- the service ---------------------------------------------------------------------------------------------------- */

/**
 * The service over `o.rules` (the pinned forms: licenceBytes, grantBytes, delegationBytes, grantWhy, callSkewMs,
 * grantMaxMs, delegationMaxMs), `o.roots` (the root public halves a delegation must trace to; worker.mjs passes the
 * vendor's root and only a leg passes another) and `o.clock` (ms).
 */
function makeService(o) {
  const rules = o.rules, roots = o.roots, clock = o.clock || (() => Date.now());
  /* The one way out to the network: sign-in's published keys and the payment providers' APIs (pay.mjs), and nothing else. A leg passes a stand-in. */
  const fetchOut = o.fetch || ((url, init) => globalThis.fetch(url, init));
  const trialOncePer = o.trialOncePer || TRIAL_ONCE_PER;
  if (trialOncePer !== "organisation" && trialOncePer !== "person") throw new Error("a trial is had once per organisation or per person");
  if (!rules || typeof rules.licenceBytes !== "function" || typeof rules.grantBytes !== "function"
      || typeof rules.delegationBytes !== "function" || typeof rules.grantWhy !== "function")
    throw new Error("the licence service needs the pinned engine's licence, grant and delegation forms");
  if (!Array.isArray(roots) || roots.length < 1 || !roots.every(r => HEX64.test(String(r))))
    throw new Error("the licence service needs the root public halves a delegation must trace to");
  const skew = rules.callSkewMs, grantMax = rules.grantMaxMs;
  const pay = makePayRoute({ clock, fetch: fetchOut, timeoutMs: o.paddleTimeoutMs, consts: { NO_KEY, PERSON, PERSONAL, SEAT_CODE_RE, ORG_DESKS_DEFAULT },
    providers: { paddle: paddleProvider(), stripe: stripeProvider() } });

  async function verified(pubHex, bytes, sigHex) {
    if (!HEX64.test(String(pubHex)) || !HEX128.test(String(sigHex))) return false;
    try {
      const k = await globalThis.crypto.subtle.importKey("raw", unhex(pubHex), { name: "Ed25519" }, false, ["verify"]);
      return await globalThis.crypto.subtle.verify({ name: "Ed25519" }, k, unhex(sigHex), bytes);
    } catch { return false; }
  }

  /* THE CONFIGURATION: the service key, the delegation and the hash key, judged once per isolate and per value. The
     delegation must be the root's, certify this very key for "licence" and "relay-grant", and run forwards for no longer
     than the relay accepts; HASH_KEY must be 32 bytes in hex; otherwise nothing is signed, kept or answered. */
  let memo = null;
  async function configOf(env) {
    const sk = env && env.SERVICE_KEY, dj = env && env.DELEGATION, hk = env && env.HASH_KEY;
    const id = String(sk) + "\n" + String(dj) + "\n" + String(hk);
    if (memo && memo.id === id) return memo.cfg;
    memo = { id, cfg: await judgeConfig(sk, dj, hk) };
    return memo.cfg;
  }
  async function judgeConfig(sk, dj, hk) {
    if (typeof hk !== "string" || !HEX64.test(hk)) return null; /* plant:hash-key */
    let d;
    try { d = typeof dj === "string" ? JSON.parse(dj) : null; } catch { return null; }
    if (!plain(d) || d.kind !== DELEGATION_KIND || d.format !== 1
        || !exactly(d, ["kind", "format", "key", "may", "from", "until", "sig"])) return null;
    if (!plain(d.key) || !exactly(d.key, ["id", "pub"]) || !ID_RE.test(String(d.key.id)) || !HEX64.test(String(d.key.pub))) return null;
    if (!Array.isArray(d.may) || !d.may.includes("licence") || !d.may.includes("relay-grant")) return null;
    if (!Number.isSafeInteger(d.from) || !Number.isSafeInteger(d.until) || d.until <= d.from
        || d.until - d.from > rules.delegationMaxMs) return null;
    if (!plain(d.sig) || !HEX128.test(String(d.sig.value))) return null;
    let roo = false;
    for (const r of roots) if (await verified(r, rules.delegationBytes(d), d.sig.value)) roo = true;
    if (!roo) return null; /* plant:config-root */
    if (typeof sk !== "string" || !/^[0-9a-f]+$/.test(sk)) return null;
    try {
      const subtle = globalThis.crypto.subtle;
      const open = await subtle.importKey("pkcs8", unhex(sk), { name: "Ed25519" }, true, ["sign"]);
      const x = (await subtle.exportKey("jwk", open)).x;
      const pub = Q.toHex(Uint8Array.from(atob(x.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0)));
      if (pub !== d.key.pub) return null;
      const key = await subtle.importKey("pkcs8", unhex(sk), { name: "Ed25519" }, false, ["sign"]);
      const hmac = await subtle.importKey("raw", unhex(hk), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      return { delegation: d, key, hmac };
    } catch { return null; }
  }
  async function signHex(cfg, bytes) {
    return Q.toHex(await globalThis.crypto.subtle.sign({ name: "Ed25519" }, cfg.key, bytes));
  }

  /* ---- sign-in: the providers, their keys, the token ---------------------------------------------------------------- */

  /* THE PROVIDERS TRUSTED, judged once per value of PROVIDERS: a Map of id to provider, empty where PROVIDERS is unset, and
     null where it is set but not a list of providers (the sign-in routes then answer "unavailable"). */
  let providersMemo = null;
  function providersOf(env) {
    const text = env ? env.PROVIDERS : undefined;
    if (providersMemo && providersMemo.text === text) return providersMemo.map;
    providersMemo = { text, map: judgeProviders(text) };
    return providersMemo.map;
  }
  function judgeProviders(text) {
    const map = new Map();
    if (text === undefined || text === null || text === "") return map;
    let list;
    try { list = typeof text === "string" ? JSON.parse(text) : null; } catch { return null; }
    if (!Array.isArray(list) || list.length > 16) return null;
    const URL_RE = /^https:\/\/[a-z0-9.-]+(?::\d{1,5})?\/[\x21-\x7e]*$/, ISS_RE = /^[\x21-\x7e]{1,200}$/;
    for (const e of list) {
      if (!plain(e) || typeof e.id !== "string" || !/^[a-z][a-z0-9-]{1,30}$/.test(e.id) || map.has(e.id)) return null;
      const base = PROVIDER_DEFAULTS[e.id] || {};
      const p = { id: e.id, clientId: e.clientId, issuer: e.issuer || base.issuer, jwks: e.jwks || base.jwks,
        org: e.org === undefined ? base.org : e.org, personal: e.personal === undefined ? base.personal : e.personal,
        service: e.service === undefined ? null : e.service };
      if (p.service !== null && (typeof p.service !== "string" || !p.service || p.service.length > 200 || /\s/.test(p.service))) return null;
      if (typeof p.clientId !== "string" || p.clientId.length > 200 || /\s/.test(p.clientId)) return null;
      if (!Array.isArray(p.issuer) || p.issuer.length < 1 || p.issuer.length > 4 || !p.issuer.every(i => typeof i === "string" && ISS_RE.test(i))) return null;
      if (typeof p.jwks !== "string" || !URL_RE.test(p.jwks)) return null;
      if (p.org !== null && (typeof p.org !== "string" || !/^[a-z_]{1,40}$/.test(p.org))) return null;
      if (p.personal !== null && p.personal !== undefined && typeof p.personal !== "string") return null;
      if (p.personal === undefined) p.personal = null;
      if (p.clientId) map.set(p.id, Object.freeze(p)); /* plant:provider-client */
    }
    return map;
  }

  /* THE PUBLISHED KEYS, per provider, in this isolate: {keys: Map kid -> {jwk, key}, at, ttl}. A fetch that fails, and a 200
     that is malformed or holds no usable key (Argon 8c), keeps what was held; with nothing held it is the provider down,
     and the route answers "unavailable". */
  const keyCache = new Map();
  async function loadKeys(p, now) {
    const old = keyCache.get(p.id);
    const kept = () => {
      if (old) { old.at = now; old.ttl = KEYS_TTL_MIN; return old; }
      throw Object.assign(new Error("provider down"), { down: true });
    };
    let res, text;
    try {
      /* "manual", never "error": Cloudflare's runtime refuses redirect "error" with a TypeError (measured under wrangler dev,
         2026-11-13: "use manual and check the response status code"), which made every real sign-in answer "unavailable". A 3xx
         is not ok, so the line below still refuses a redirect, as "error" meant to. */
      res = await fetchOut(p.jwks, { method: "GET", redirect: "manual", headers: { accept: "application/json" } });
      if (!res || !res.ok) throw new Error("keys " + (res && res.status));
      text = await res.text();
      if (text.length > KEYS_MAX) throw new Error("keys too long");
    } catch { return kept(); }
    let doc = null;
    try { doc = JSON.parse(text); } catch { doc = null; }
    const keys = new Map();
    for (const k of (plain(doc) && Array.isArray(doc.keys) ? doc.keys : [])) {
      if (!plain(k) || k.kty !== "RSA" || typeof k.kid !== "string" || typeof k.n !== "string" || typeof k.e !== "string") continue;
      if (k.use !== undefined && k.use !== "sig") continue;
      if (k.alg !== undefined && k.alg !== "RS256") continue;
      keys.set(k.kid, { jwk: k, key: null });
    }
    if (keys.size === 0) return kept(); /* plant:keys-empty */
    const m = /max-age=(\d+)/.exec((res.headers && res.headers.get("cache-control")) || "");
    const ttl = Math.min(KEYS_TTL_MAX, Math.max(KEYS_TTL_MIN, m ? Number(m[1]) * 1000 : KEYS_TTL_MAX));
    const entry = { keys, at: now, ttl };
    keyCache.set(p.id, entry);
    return entry;
  }
  async function keyFor(p, kid, now) {
    let entry = keyCache.get(p.id);
    if (!entry || now >= entry.at + entry.ttl) entry = await loadKeys(p, now); /* plant:keys-ttl */
    if (!entry.keys.has(kid) && now - entry.at >= KID_REFRESH_MS) entry = await loadKeys(p, now); /* plant:kid-refresh */
    const held = entry.keys.get(kid);
    if (!held) return null;
    if (!held.key) held.key = await globalThis.crypto.subtle.importKey("jwk",
      { kty: "RSA", n: held.jwk.n, e: held.jwk.e, alg: "RS256", ext: true },
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    return held;
  }

  const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const B64U_RE = /^[A-Za-z0-9_-]+$/;
  const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), ch => ch.charCodeAt(0));
  const jsonOf = s => { try { const v = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(unb64u(s))); return plain(v) ? v : null; } catch { return null; } };
  /* The issuer a template stands for in this token: Microsoft's {tenantid} replaced by the token's own tid, which must be
     a GUID ("Validate that the tid claim is a GUID and the iss claim is of the form .../{tid}/v2.0"); null where it cannot. */
  function issuerFor(template, claims) {
    if (template.indexOf("{tenantid}") < 0) return template;
    if (typeof claims.tid !== "string" || !GUID_RE.test(claims.tid)) return null;
    return template.split("{tenantid}").join(claims.tid);
  }
  const issuerMatches = (p, claims) => typeof claims.iss === "string" && p.issuer.some(i => issuerFor(i, claims) === claims.iss); /* plant:jwt-iss */

  /* AN ID TOKEN, JUDGED: the claims of a token `p` issued for us, or null; null too for any provider in `providers` where
     `p` is not given, the token's own issuer choosing (every route names its provider today). Throws {down} where the keys cannot be had.
     The nonce is returned, not judged: each route binds it as its own rule says. */
  async function judgeToken(token, p0, providers, now) {
    if (typeof token !== "string" || token.length > TOKEN_MAX) return null;
    const parts = token.split(".");
    if (parts.length !== 3 || !parts.every(s => B64U_RE.test(s))) return null;
    const head = jsonOf(parts[0]), claims = jsonOf(parts[1]);
    if (!head || !claims) return null;
    if (head.alg !== "RS256" || typeof head.kid !== "string" || head.kid.length > 200) return null;
    const p = p0 || Array.from(providers.values()).find(x => issuerMatches(x, claims));
    if (!p || !issuerMatches(p, claims)) return null;
    if (!(claims.aud === p.clientId || (Array.isArray(claims.aud) && claims.aud.length === 1 && claims.aud[0] === p.clientId))) return null; /* plant:jwt-aud */
    if (!Number.isFinite(claims.exp) || !(now < claims.exp * 1000)) return null; /* plant:jwt-exp */
    if (claims.nbf !== undefined && !(Number.isFinite(claims.nbf) && claims.nbf * 1000 <= now + TOKEN_LEEWAY_MS)) return null; /* plant:jwt-nbf */
    if (typeof claims.iat !== "number" || !Number.isFinite(claims.iat) || claims.iat * 1000 > now + TOKEN_LEEWAY_MS) return null; /* plant:jwt-iat */
    if (typeof claims.sub !== "string" || !claims.sub || claims.sub.length > 255) return null;
    const held = await keyFor(p, head.kid, now);
    if (!held) return null;
    /* The key's own issuer, where the keys document names one: a templated one for this tenant's issuer, an exact one for
       that issuer alone (Microsoft's consumers key never signs for a work tenant). */
    if (held.jwk.issuer !== undefined && issuerFor(String(held.jwk.issuer).replace(/\{tenantid\}/gi, "{tenantid}"), claims) !== claims.iss) return null; /* plant:key-issuer */
    let good = false;
    try {
      good = await globalThis.crypto.subtle.verify({ name: "RSASSA-PKCS1-v1_5" }, held.key, unb64u(parts[2]),
        new TextEncoder().encode(parts[0] + "." + parts[1]));
    } catch { good = false; }
    if (!good) return null; /* plant:jwt-sig */
    let org = null, personal = false;
    if (p.org === null) org = claims.iss;
    else {
      const v = claims[p.org];
      if (v === undefined || v === null || v === "" || (p.personal && typeof v === "string" && v.toLowerCase() === p.personal.toLowerCase())) personal = true;
      else if (typeof v !== "string" || v.length > 255) return null;
      else org = v;
    }
    return { ident: identOf(p.id, claims) /* plant:ident-kept */, provider: p, iss: claims.iss, sub: claims.sub, exp: claims.exp, iat: claims.iat, nonce: typeof claims.nonce === "string" ? claims.nonce : null,
      tid: typeof claims.tid === "string" ? claims.tid : null, oid: typeof claims.oid === "string" ? claims.oid : null, org, personal };
  }

  /* THE SERVICE'S ACCESS TOKEN, JUDGED WHOLE (section 11.11; Claude alpha's condition 2), beside the ID token `j` judgeToken took from
     `p`: {roles} where every check holds, else null. RS256 by a key the provider publishes, its signature, version 2.0, the issuer of
     its own tenant, the audience the service's registration, the calling client Etiuda's, the scope, the ID token's own person by oid
     and tid (its own sub is the service's pairwise value and is never read), and the ID token's time rules. THE ONE SEAM: a seat's
     roles come in here, read by rolesOf, and nowhere else. */
  async function judgeAccess(token, p, j, now) {
    if (typeof p.service !== "string" || !p.service) return null;
    if (typeof token !== "string" || token.length > ACCESS_MAX) return null; /* plant:access-size */
    const parts = token.split(".");
    if (parts.length !== 3 || !parts.every(x => B64U_RE.test(x))) return null;
    const head = jsonOf(parts[0]), claims = jsonOf(parts[1]);
    if (!head || !claims) return null;
    if (head.alg !== "RS256") return null; /* plant:access-alg */
    if (typeof head.kid !== "string" || head.kid.length > 200) return null;
    if (claims.ver !== ACCESS_VER) return null; /* plant:access-ver */
    if (typeof claims.tid !== "string" || !GUID_RE.test(claims.tid)) return null;
    if (claims.iss !== "https://login.microsoftonline.com/" + claims.tid + "/v2.0") return null; /* plant:access-iss */
    if (claims.aud !== p.service) return null; /* plant:access-aud */
    if (claims.azp !== p.clientId) return null; /* plant:access-azp */
    if (typeof claims.scp !== "string" || claims.scp.split(" ").indexOf(ACCESS_SCOPE) < 0) return null; /* plant:access-scp */
    if (typeof claims.oid !== "string" || typeof j.oid !== "string" || typeof j.tid !== "string" || claims.oid.toLowerCase() !== j.oid.toLowerCase()
      || claims.tid.toLowerCase() !== j.tid.toLowerCase()) return null; /* plant:access-person */
    if (!Number.isFinite(claims.exp) || !(now < claims.exp * 1000)) return null; /* plant:access-exp */
    if (claims.nbf !== undefined && !(Number.isFinite(claims.nbf) && claims.nbf * 1000 <= now + TOKEN_LEEWAY_MS)) return null;
    if (typeof claims.iat !== "number" || !Number.isFinite(claims.iat) || claims.iat * 1000 > now + TOKEN_LEEWAY_MS) return null;
    /* FRESH, AS A REFRESHED ID TOKEN IS (Argon's second review of the sign-in, finding 1): issued within RENEW_IAT_MS. Studio and the desk
       post each access token the moment the token address issues it (src/licence-client.mjs redeem and refreshed), so only a token kept
       back is older; without this a person whose role the company took away could carry the one issued with it beside fresh ID tokens
       until its exp, about an hour. Not also spent once: inside the window a token says only what Microsoft said of the person within
       it, and a person who held the role then could have had a second token as easily, so the window, not the count, bounds the lag. */
    if (now - claims.iat * 1000 > RENEW_IAT_MS) return null; /* plant:access-fresh */
    const held = await keyFor(p, head.kid, now); /* plant:access-kid */
    if (!held) return null;
    if (held.jwk.issuer !== undefined && issuerFor(String(held.jwk.issuer).replace(/\{tenantid\}/gi, "{tenantid}"), claims) !== claims.iss) return null; /* plant:access-key-issuer */
    let good = false;
    try {
      good = await globalThis.crypto.subtle.verify({ name: "RSASSA-PKCS1-v1_5" }, held.key, unb64u(parts[2]),
        new TextEncoder().encode(parts[0] + "." + parts[1]));
    } catch { good = false; }
    if (!good) return null; /* plant:access-sig */
    return { roles: rolesOf(claims.roles) };
  }
  /* On a licence whose seats follow Entra: the access token's judgement, or `need` where the request carries none, the ID token's own
     claims never standing in. */
  const accessFor = (b, p, j, now) => (b.accessToken === undefined ? { need: true } /* plant:access-needed */ : judgeAccess(b.accessToken, p, j, now));
  /* The roles of an Entra licence's request, or the answer that refuses it: "access-token" where it carries none, its ID token left
     unspent so the client asks the access token by its refresh token and comes again; "token" where the access token does not judge. */
  async function rolesIn(b, p, j, now) {
    const acc = await accessFor(b, p, j, now);
    return acc && acc.need ? { no: accessNeeded() } : !acc ? { no: badToken() } : { roles: acc.roles };
  }

  /* What the service signs. A licence's `issued` is the day it is signed, inside the delegation's window as S1 reads it;
     its updates date is the purchase's. A grant runs from now to the earliest of the end it is for, 45 days ahead (the
     relay's longest) and the delegation's own end, which the relay requires (via-window); none is made that ends by now,
     and none leaves here that the pinned relay's own grantWhy would refuse.
     THE PAID END (Max, 2026-11-17 20:41, "I agree with your recommendation", to a paid licence that ends stopping Studio as it stops the
     desk): a paid licence also states `paidUntil`, the instant (ms) its paid time ends, the row's paid_until: a subscription's period end
     plus GRACE_DAYS (pay.mjs), an invoice's paid date, the very instant its grants and its desks' certificates end on (grantFor,
     certificateFor). A top-level field like the rest, so inside the signed form (the pin's v2SignedBytes takes every field but hash and
     sig.value); a Studio before it never reads it (src/licence.mjs shapeOk takes any further field). `updatesUntil` is issued as before,
     since every Studio in the field calls a file without it unusable. A trial's licence states its own end (`ends`) and no other. */
  async function licenceFor(cfg, row, now, db) {
    const seats = db && row.id !== undefined ? (await inForceOf(db, row, now)).seats : row.seats; /* plant:licence-in-force */
    const doc = { kind: LICENCE_KIND, format: LICENCE_FORMAT, org: row.org, seats, edition: "studio",
      issued: dayOf(now), updatesUntil: row.updates_until,
      paidUntil: row.paid_until, /* plant:paid-until-field */
      via: cfg.delegation,
      sig: { alg: LICENCE_SIG_ALG, keyId: cfg.delegation.key.id } };
    doc.sig.value = await signHex(cfg, rules.licenceBytes(doc));
    return doc;
  }
  /* A trial's licence: issued today, ending when the trial does, and stating nothing a full licence counts by. */
  async function trialLicenceFor(cfg, ends, now) {
    const doc = { kind: TRIAL_KIND, format: TRIAL_FORMAT, edition: "studio", issued: dayOf(now), ends, via: cfg.delegation,
      sig: { alg: LICENCE_SIG_ALG, keyId: cfg.delegation.key.id } };
    doc.sig.value = await signHex(cfg, rules.licenceBytes(doc));
    return doc;
  }
  /* `row` is the licence the grant is for (none for a trial) and `db` the database: on a licence whose seats follow Entra the grant
     carries them and the key is marked (entra_keys); a marked key is given no grant without seats while its marked licence runs and is
     not released, and once it has ended or is released by hand its grants carry the signed release, which alone lifts a relay's gate. */
  async function grantFor(cfg, lead, paid, ends, now, row, db) {
    let until = Math.min(ends, now + grantMax); /* plant:grant-45 */
    until = Math.min(until, cfg.delegation.until); /* plant:grant-delegation */
    if (!(until > now)) return null;
    let seats = await seatsOf(db, cfg, row, now);
    if (seats) await db.prepare("INSERT INTO entra_keys (lead, licence, at, released) VALUES (?1, ?2, ?3, 0) ON CONFLICT (lead) DO UPDATE SET licence = excluded.licence, at = excluded.at, "
      + "released = 0").bind(lead, row.id, now).run(); /* plant:entra-key-mark */
    else if (db) {
      const mark = await entraKeyOf(db, lead, now);
      if (mark && mark.held) return null; /* plant:entra-key-hold */
      if (mark) seats = { licence: await refOf(cfg, mark.licence), release: true }; /* plant:entra-key-release */
    }
    const grant = { kind: GRANT_KIND, format: 1, lead, issued: now, until, paid, via: cfg.delegation,
      sig: { alg: GRANT_SIG_ALG, keyId: cfg.delegation.key.id, value: "" } };
    if (seats) grant.seats = seats; /* plant:seats-grant */
    /* FREED ON EVERY LICENCE'S GRANT (Grok zeta's class A; Claude alpha's rule and conditions, carried by Claudius): a grant with no seats (an
       ordinary licence's) carries the desk keys its leads freed, top level, `freed` [{key, at}], the same entries as seats.freed and nothing
       naming a person, so the relay refuses a certificate on a listed key issued before `at` without reading the licence as Entra's. A key
       stays listed only while a certificate issued to it before it was freed could still be current (PROOF_MS from `at`; the longest
       certificate certificateFor issues), then leaves. THE RELAY READS IT FIRST (Claude alpha's order): it is sent only where the pinned
       relay's own grantWhy takes it; a relay that does not yet know the field is handed the grant without it, as before. */
    const loose = !seats && db && row ? await freedLoose(db, row, now) : null;
    if (loose) grant.freed = loose; /* plant:grant-freed */
    grant.sig.value = await signHex(cfg, rules.grantBytes(grant));
    let why = rules.grantWhy(grant, lead, now, roots);
    if (why === "fields" && grant.freed) { /* plant:grant-freed-pinned */
      delete grant.freed;
      grant.sig.value = await signHex(cfg, rules.grantBytes(grant));
      why = rules.grantWhy(grant, lead, now, roots);
    }
    if (why !== null) throw new Error("a grant the relay would refuse: " + why);
    return grant;
  }

  /* RATE LIMITS: one batch counting each bucket for this hour, one row per bucket and hour, the old hours dropped. */
  async function overLimit(db, route, buckets, now) {
    const slot = Math.floor(now / HOUR), limits = LIMITS[route];
    const stmts = [db.prepare("DELETE FROM hits WHERE slot < ?1").bind(slot - 1)];
    for (const [kind, value] of buckets) stmts.push(db.prepare(
      "INSERT INTO hits (bucket, slot, n) VALUES (?1, ?2, 1) ON CONFLICT (bucket, slot) DO UPDATE SET n = n + 1 RETURNING n")
      .bind(route + ":" + kind + ":" + value, slot));
    const res = await db.batch(stmts);
    return buckets.some(([kind], i) => res[i + 1].results[0].n > limits[kind]); /* plant:rate */
  }

  /* A SIGNED REQUEST: fresh, signed by `signer` over `bytes`, and not answered before. The replay record is written only
     after the signature holds, so nobody fills it with junk. Null where it stands, else the refusal to answer.
     `later` ({}), on a route whose body carries a field its bytes do not (a sign-in's seed; Argon's second review of the sign-in, finding
     12, and Grok's, finding 3): the record is left to the route, which writes it (seenOnce, with later.digest) once that field has done
     its part, so a copy with the seed taken out, refused for its token, spends nothing and the genuine body after it is still answered. */
  /* THE SEED IN THE SIGNED BYTES (review 2's finding 12, its residual): where a body carries a seed, the bytes that end in its line
     (requests.mjs seedLine) are the ones judged when the signature holds over them; otherwise today's bytes, which an older desk or Studio
     signs, so nobody on an older build is stranded and only that build's seed stays outside its signature, as it was. A newer client's
     request with its seed taken out, or another put in, holds over neither and is refused as unsigned. `make(seed)` gives the bytes.
     `fallback` false (licence/admin; Claude alpha's ruling of 2026-11-15, "refuse an unsigned seed on that route now ... No Studio in
     the field sends one"): a seed is judged over the seeded bytes alone, so one the signature does not cover is refused.
     THE FALLBACK ENDS once no desk or Studio that signs no seed line is served at signin and signin/desk: when the oldest supported desk
     (tools/engine-oldest's commit) and the oldest Studio still in use both sign the seed line, take `fallback` away there too and
     delete the old-bytes branch below (Claude alpha, 2026-11-15: "sign-in keeps its fallback for older desks until they are gone"). */
  async function seedSigned(make, seed, signer, sig, fallback) {
    if (seed !== undefined) {
      const withSeed = make(seed);
      if (fallback === false) return withSeed; /* plant:admin-seed-only */
      if (await verified(signer, withSeed, sig)) return withSeed; /* plant:seed-signed */
    }
    return make(undefined);
  }
  async function signedOk(db, cfg, bytes, signer, sig, t, now, later) {
    if (Math.abs(now - t) > skew) return answer(403, { ok: false, reason: "stale" }); /* plant:skew */
    if (!await verified(signer, bytes, sig)) return answer(403, { ok: false, reason: "signature" }); /* plant:sig */
    const digest = await keyedHash(cfg.hmac, KEYED.seen, bytes); /* plant:keyed-seen */
    if (later) { later.digest = digest; return null; }
    return seenOnce(db, digest, now);
  }
  async function seenOnce(db, digest, now) {
    const res = await db.batch([
      db.prepare("DELETE FROM seen WHERE until < ?1").bind(now),
      db.prepare("INSERT INTO seen (digest, until) VALUES (?1, ?2) ON CONFLICT (digest) DO NOTHING").bind(digest, now + 2 * skew),
    ]);
    if (res[1].meta.changes !== 1) return answer(403, { ok: false, reason: "replayed" }); /* plant:replay */
    return null;
  }

  const LICENCE_COLUMNS = "id, org, seats, updates_until, paid_until, refunded, lead_seats, trial_ends, grace_days, owner, desk_only, org_desks, seat_source, entra_at, key_hash";
  /* How long a seat on `row` counts after its last proof, and a desk's certificate on it runs. */
  const windowOf = row => (row && row.seat_source === "entra" ? ENTRA_PROOF_MS : PROOF_MS);

  /* ---- sign-in: the organisation's licence, the seat, the key ------------------------------------------------------- */

  /* THE LICENCE A PERSON LEADS (a team is its lead's own; decision 47): of the licences not refunded and not desk-only that the
     person owns or its owner named them to (lead_names), a paid one before a trial, then the latest paid date, then the newest. An
     organisation's admission, or a "person:" one, seats desks and never a lead. A licence whose seats follow Entra is led by whoever
     holds a lead seat on it not freed, a seat its role gave (entraLead); its owner and names are never read; and it comes before any
     other (Argon's second review of the sign-in, finding 4), since a person the company assigned is the company's, whatever the paid
     date of a licence of their own. */
  /* AN OWNER STAYS ON THEIR OWN (review 10's finding 8; the test architect's criterion, 2026-11-17: "a person who owns a running paid team licence
     is never moved off it, refused, or stripped of the owner's acts because someone else named them"): after the Entra rule, a running paid licence
     the person owns comes before any that merely names them, whatever its paid date or room. `now` (ms) says running.
     A LEAD STAYS WHERE THEIR SEAT IS (the test architect's one edit of 2026-11-17, his words: ""anyone else is not" is not what leadLicence
     does"): next, a running paid licence the person's lead seat is on now, not freed, comes before one that merely names them, so a lead
     named and seated on one licence is not moved by another owner's naming, whatever that licence's paid date. A licence they own is left
     to the term above, so the two terms never rank the same row and each keeps a plant of its own (lead-own-first, lead-seated-first).
     A TRIAL THAT HOLDS COLLEAGUES WAITS (Claude alpha's ruling of 2026-11-17 13:21, his words: "A trial with a colleague's desk admitted, or a
     team on it, is not bare: its holder is NOT moved by a naming at the quiet check (the naming waits, as for anyone else)"): next, a running
     trial the person owns comes before a licence that merely names them while it is not bare, which by the test architect's reading,
     confirmed by Claude alpha, is another person's desk seat on it not freed, or an admitted_by row on it for another person; a door with
     nobody else on it does not count. Once the trial has ended the naming takes effect as before, and the owner's naming still answers
     "named"; a bare trial's holder is moved (the stated exception above holdings; s112a).
     A RUNNING TRIAL IS HANDED WHEN NO PAID LICENCE CAN SERVE (review 4, findings 3 and 4). After the terms above, a running trial comes
     before a paid licence whose paid date has passed, and before one that is still paid but has no lead room for this person. Room is
     counted as takeSeat counts a lead seat: other people seen within the grace and proved within the window, under the lead seats in
     force, and the owner always has room. A paid licence that can serve still outranks the trial. The seated term asks for that room only
     while a trial of theirs is running, so a seat already taken on a full licence does not stay ahead of it, and a seat with no trial
     running is ordered as before. */
  /* A row leadLicence would consider: not refunded, not desk-only, owned or named on an admit licence, or a proved Entra lead seat. */
  /* A NAMING MOVES NOBODY BY ITSELF (board 1011; Claude alpha's decision of 2026-11-17 13:16 and the rule over every licence mend: "nobody is moved
     off a licence they own, or loses a seat or a team they hold, by another person's act alone"): a naming counts as a way onto the licence once
     its person has pressed Accept (lead/accept), or where they hold no running trial of their own to be set aside. Until then a person holding one
     stays on it, and is asked (namingOf). Binds ?1 the person, ?2 now. */
  const OWN_TRIAL_RUNNING = "EXISTS (SELECT 1 FROM licences ot WHERE ot.owner = ?1 AND ot.trial_ends > ?2 AND ot.desk_only = 0 AND ot.refunded = 0)";
  const NAMED_ON = "(SELECT licence FROM lead_names WHERE person = ?1 AND (accepted_at IS NOT NULL OR NOT " + OWN_TRIAL_RUNNING + "))"; /* plant:naming-pending */
  const leadCandidate = (a) => "(" + a + ".refunded = 0 AND " + a + ".desk_only = 0 AND ((" + a + ".seat_source = 'admit' AND (" + a + ".owner = ?1 "
    + "OR " + a + ".id IN " + NAMED_ON + ")) "
    + "OR (" + a + ".seat_source = 'entra' AND " + a + ".id IN (SELECT licence FROM seats WHERE kind = 'lead' AND person = ?1 AND proved_at > 0))))";
  /* Still paid: a candidate whose trial has not been started and whose paid date has not passed. */
  const stillPaid = (a) => "(" + leadCandidate(a) + " AND " + a + ".trial_ends IS NULL AND " + a + ".paid_until > ?2)";
  /* Lead room on alias `a`, counted as takeSeat counts a lead seat. Binds: ?1 the person, ?2 now, ?3 a day, ?4 the Entra proof window, ?5 the ordinary one. */
  const leadRoom = (a) => "((IFNULL(" + a + ".owner = ?1, 0) AND " + a + ".desk_only = 0) OR ((SELECT COUNT(*) FROM seats rm WHERE rm.licence = " + a + ".id AND rm.kind = 'lead' AND rm.person <> ?1 "
    + "AND rm.seen_at > ?2 - " + a + ".grace_days * ?3 AND rm.proved_at > ?2 - (CASE " + a + ".seat_source WHEN 'entra' THEN ?4 ELSE ?5 END)) "
    + "< " + inForceCol("lead_seats", a + ".id", "?2", a) + " * (1 - " + a + ".desk_only)) "
    + "OR " + a + ".id IS ?6)"; /* plant:lead-kept-room */
  /* THE LICENCE WHOSE LEAD SEAT THE PERSON KEEPS IN A REDUCTION (the test architect's ruling on the fold 87 merge): where in-force lead seats are
     below the seated, leadRoom is false for the seat the staying rule keeps, and a running trial of the person's would be handed over it. A person
     the rule keeps has room on their own seat's licence, so the paid seat is theirs before any trial; a person it does not keep has none, and is
     handed their running trial, or refused as a freed seat where they have none. Their seat's licence where they are seated now and the rule
     names them, else null; read apart because the rule's LIMIT cannot be correlated with leadLicence's rows. Bound as ?6. */
  async function keptLeadLicence(db, person, now) {
    const held = await db.prepare("SELECT s.licence AS licence, l.seat_source AS src FROM seats s JOIN licences l ON l.id = s.licence WHERE s.kind = 'lead' AND s.person = ?1 "
      + "AND s.seen_at > ?2 - l.grace_days * ?5 AND s.proved_at > ?2 - (CASE l.seat_source WHEN 'entra' THEN ?3 ELSE ?4 END)").bind(person, now, ENTRA_PROOF_MS, PROOF_MS, DAY).first();
    if (!held) return null;
    const r = await db.prepare("SELECT ?1 IN (" + stayingPersons("?2", "'lead'", "?3", "(?3 - ?4)") + ") AS kept")
      .bind(person, held.licence, now, held.src === "entra" ? ENTRA_PROOF_MS : PROOF_MS).first();
    return r && r.kept === 1 ? held.licence : null;
  }
  /* `also`, a licence id, is read as though the person's naming there were accepted already: what the choice would be once that naming takes,
     asked before anything is written (acceptByAddress, the Grok review beta's C1 of 2026-11-22). Left out, the query is the one below as written. */
  async function leadLicence(db, person, now, also) {
    return leadPick(db, person, now, await keptLeadLicence(db, person, now), also).first();
  }
  /* leadLicence's statement, bound: its kept licence (keptLeadLicence) given. */
  function leadPick(db, person, now, kept, also) {
    const q = Number.isInteger(also) ? { prepare: sql => db.prepare(sql.split(NAMED_ON).join("(SELECT licence FROM lead_names WHERE person = ?1 AND (accepted_at IS NOT NULL OR NOT "
      + OWN_TRIAL_RUNNING + ") UNION SELECT " + also + ")")) } : db; /* plant:lead-also */
    return q.prepare("SELECT " + LICENCE_COLUMNS + " FROM licences WHERE refunded = 0 AND desk_only = 0 AND ((seat_source = 'admit' AND (owner = ?1 " /* plant:org-admit */
      + "OR id IN " + NAMED_ON + ")) " /* plant:lead-named */
      + "OR (seat_source = 'entra' AND id IN (SELECT licence FROM seats WHERE kind = 'lead' AND person = ?1 AND proved_at > 0))) " /* plant:lead-entra */
      + "ORDER BY (seat_source = 'entra') DESC, " /* plant:lead-entra-first */
      + "(IFNULL(owner = ?1, 0) AND trial_ends IS NULL AND paid_until > ?2) DESC, " /* plant:lead-own-first */
      + "(NOT IFNULL(owner = ?1, 0) AND trial_ends IS NULL AND paid_until > ?2 AND id IN (SELECT licence FROM seats WHERE kind = 'lead' AND person = ?1 AND proved_at > 0) AND (" + leadRoom("licences") + " OR NOT EXISTS (SELECT 1 FROM licences tr WHERE tr.id <> licences.id AND " + leadCandidate("tr") + " AND tr.trial_ends > ?2))) DESC, " /* plant:lead-seated-first */
      + "(IFNULL(owner = ?1, 0) AND trial_ends > ?2 AND (EXISTS (SELECT 1 FROM seats o WHERE o.licence = licences.id AND o.kind = 'desk' AND o.person <> ?1 " /* plant:lead-trial-held */
      + "AND o.proved_at > 0) OR EXISTS (SELECT 1 FROM admitted_by a WHERE a.licence = licences.id AND a.person <> ?1))) DESC, " /* plant:lead-trial-bare */
      + "(CASE WHEN licences.trial_ends > ?2 AND NOT EXISTS (SELECT 1 FROM licences spd WHERE spd.id <> licences.id AND " + stillPaid("spd") + ") THEN 1 ELSE 0 END) DESC, " /* plant:lead-trial-over-ended */
      + "(CASE WHEN licences.trial_ends > ?2 AND EXISTS (SELECT 1 FROM licences gap WHERE gap.id <> licences.id AND " + stillPaid("gap") + " AND NOT " + leadRoom("gap") + ") AND NOT EXISTS (SELECT 1 FROM licences fit WHERE fit.id <> licences.id AND " + stillPaid("fit") + " AND " + leadRoom("fit") + ") THEN 1 ELSE 0 END) DESC, " /* plant:lead-trial-over-full */
      + "(trial_ends IS NULL) DESC, paid_until DESC, id DESC LIMIT 1").bind(person, now, DAY, ENTRA_PROOF_MS, PROOF_MS, kept);
  }
  /* THE NAMING A PERSON HAS NOT YET ACCEPTED (board 1011): the latest naming of theirs, on a licence running and paid, that they have not
     pressed Accept on, while they hold a running trial of their own that Accept would set aside; null where there is none. `held` says
     that trial holds a colleague's desk, or a team, so it is more than a bare trial and no naming moves it (the stated exception above
     holdings, Claude alpha's ruling of 2026-11-17 13:21). Read apart from leadLicence's ranking, which it mirrors. */
  async function pendingNaming(db, person, now) {
    return db.prepare("SELECT n.licence AS licence, n.at AS at, n.blocked_at AS blocked_at, l.org AS org, "
      + "(SELECT p.name FROM persons p WHERE p.person = n.named_by) AS by, "
      + "(SELECT MAX(ot.trial_ends) FROM licences ot WHERE ot.owner = ?1 AND ot.trial_ends > ?2 AND ot.desk_only = 0 AND ot.refunded = 0) AS trial_ends, "
      + "EXISTS (SELECT 1 FROM licences ot WHERE ot.owner = ?1 AND ot.trial_ends > ?2 AND ot.desk_only = 0 AND ot.refunded = 0 AND ("
      + "EXISTS (SELECT 1 FROM seats o WHERE o.licence = ot.id AND o.kind = 'desk' AND o.person <> ?1 AND o.proved_at > 0) "
      + "OR EXISTS (SELECT 1 FROM admitted_by a WHERE a.licence = ot.id AND a.person <> ?1))) AS held "
      + "FROM lead_names n JOIN licences l ON l.id = n.licence WHERE n.person = ?1 AND n.accepted_at IS NULL "
      + "AND l.refunded = 0 AND l.desk_only = 0 AND l.seat_source = 'admit' AND l.trial_ends IS NULL AND l.paid_until > ?2 AND " + OWN_TRIAL_RUNNING + " "
      + "ORDER BY n.at DESC, n.licence DESC LIMIT 1").bind(person, now).first();
  }
  /* Whether `person` has a lead seat to take on `licence` now, counted as takeSeat counts one (leadRoom). */
  const roomOn = async (db, person, licence, now) => !!(await db.prepare("SELECT 1 AS r FROM licences WHERE id = ?7 AND " + leadRoom("licences"))
    .bind(person, now, DAY, ENTRA_PROOF_MS, PROOF_MS, null, licence).first());
  /* WHAT A STUDIO KEY'S CHECK SAYS OF A NAMING (board 1011): {naming: {by, org, trialEnds, key, state}} where the person the key is bound
     through has a naming to accept, else nothing. `state` is "ask" (offer it: Studio shows it once per key), or "blocked" after an Accept
     that found no lead seat free, until one is; the key changes with each, so a freed seat asks again. A trial holding a colleague's desk is
     offered nothing.
     A NAMING BY ADDRESS (board 1017; addressNaming) is said the same way where there is no naming by person to offer, with `via` "address":
     `state` "ask" until the person presses Accept, then "confirm" where their provider did not vouch the address and the owner has yet to
     confirm them (rule 1); its trialEnds null where they hold no trial of their own. */
  async function namingOf(db, cfg, lead, now) {
    const b = await db.prepare("SELECT person FROM bindings WHERE lead = ?1").bind(lead).first();
    if (!b || !b.person) return {};
    const n = await pendingNaming(db, b.person, now);
    if (!n) {
      const a = await addressNaming(db, cfg, b.person, now);
      if (!a || a.held === 1) return {};
      const st = a.candidate === 1 ? "confirm" : "ask"; /* plant:naming-confirm-state */
      return { naming: { by: typeof a.by === "string" ? a.by : "", org: a.org, trialEnds: a.trial_ends === undefined ? null : a.trial_ends, state: st,
        key: "address:" + a.at + ":" + st, via: "address" } };
    }
    if (n.held === 1) return {};
    const blocked = n.blocked_at !== null && n.blocked_at !== undefined && !(await roomOn(db, b.person, n.licence, now));
    const state = blocked ? "blocked" : "ask";
    return { naming: { by: typeof n.by === "string" ? n.by : "", org: n.org, trialEnds: n.trial_ends, state,
      key: n.at + ":" + (n.blocked_at || 0) + ":" + state } };
  }
  /* THE NAMING BY ADDRESS A PERSON MAY ACCEPT (board 1017): the newest open naming (lead_invites) of the address the service keeps of them
     (persons.address, from their own last sign-in, as addressKeyed keys it), on a licence running and paid, seated by admission and not
     desk-only, which they neither own nor are named on already; null where none. With it: its licence, keyed address, time and owner, the
     owner's name and the organisation's (by, org), whether it is VOUCHED for them (board 1017's rule 1: their provider vouched the address,
     persons.vouched, and nothing else: being inside an organisation the licence admits is not the provider vouching the address, Claude
     alpha's rule on B2 of 2026-11-22, carried by Claudius), whether they pressed
     Accept already and wait as a candidate, their own trial's end, and `held` as pendingNaming says it (a trial holding a colleague's desk
     or a team, which no naming moves). */
  async function addressNaming(db, cfg, person, now) {
    const me = await db.prepare("SELECT address FROM persons WHERE person = ?1").bind(person).first();
    const key = me ? await addressKeyed(cfg, me.address) : null;
    if (!key) return null;
    return db.prepare("SELECT i.licence AS licence, i.address AS address, i.at AS at, l.owner AS owner, l.org AS org, "
      + "(SELECT o.name FROM persons o WHERE o.person = l.owner) AS by, "
      + "(p.vouched = 1) AS vouched, " /* plant:address-naming-vouched */
      + "EXISTS (SELECT 1 FROM lead_candidates k WHERE k.licence = i.licence AND k.address = i.address AND k.person = p.person) AS candidate, "
      + "(SELECT MAX(ot.trial_ends) FROM licences ot WHERE ot.owner = ?1 AND ot.trial_ends > ?2 AND ot.desk_only = 0 AND ot.refunded = 0) AS trial_ends, "
      + "EXISTS (SELECT 1 FROM licences ot WHERE ot.owner = ?1 AND ot.trial_ends > ?2 AND ot.desk_only = 0 AND ot.refunded = 0 AND ("
      + "EXISTS (SELECT 1 FROM seats o WHERE o.licence = ot.id AND o.kind = 'desk' AND o.person <> ?1 AND o.proved_at > 0) "
      + "OR EXISTS (SELECT 1 FROM admitted_by a WHERE a.licence = ot.id AND a.person <> ?1))) AS held "
      + "FROM persons p JOIN lead_invites i ON i.address = ?3 JOIN licences l ON l.id = i.licence WHERE p.person = ?1 AND i.at > ?6 " /* plant:address-naming-days */
      + "AND l.refunded = 0 AND l.desk_only = 0 AND l.seat_source = 'admit' AND l.trial_ends IS NULL AND l.paid_until > ?2 AND l.owner IS NOT ?1 "
      + "AND NOT EXISTS (SELECT 1 FROM lead_names n WHERE n.licence = i.licence AND n.person = ?1) "
      + "ORDER BY i.at DESC, i.licence DESC LIMIT 1").bind(person, now, key, PERSON.length, PERSON, now - INVITE_MS).first();
  }
  /* WHETHER A RUNNING PAID LICENCE ADMITS AN ORGANISATION: what a person that licence does not seat or lead is told beside their own
     trial, so they know whom to ask. */
  const orgHolds = async (db, provider, org, now) => !!(await db.prepare("SELECT 1 AS h FROM licences WHERE refunded = 0 "
    + "AND desk_only = 0 AND trial_ends IS NULL AND paid_until > ?1 "
    + "AND id IN (SELECT licence FROM admits WHERE provider = ?2 AND org = ?3) LIMIT 1").bind(now, provider, org).first());
  /* THE LICENCE WHOSE SEATS FOLLOW ENTRA for a token's tenant (decision 49): one set to "entra" admitting the tenant, never through a
     "person:" row, and not refunded. Where there is one, it alone decides the person's seats by the token's roles. */
  const entraLicence = (db, s) => (s.personal ? null : db.prepare("SELECT " + LICENCE_COLUMNS + " FROM licences WHERE refunded = 0 "
    + "AND seat_source = 'entra' AND id IN (SELECT licence FROM admits WHERE provider = ?1 AND org = ?2 AND substr(org, 1, ?3) <> ?4) "
    + "ORDER BY paid_until DESC, id DESC LIMIT 1").bind(s.provider, s.org, PERSON.length, PERSON).first());
  /* A LICENCE BOUGHT BEFORE THE PERSON'S TENANT TURNED ENTRA, AND THEIR SEAT ON IT (Claude alpha, 21:34: "Nobody loses what they paid for:
     a licence a person bought with that account before their tenant's licence turned entra stays theirs and reachable while their token
     carries no role; a person the company has assigned is the company's"; and 22:07: it "covers the seats the owner paid for, so a
     colleague named on a licence bought before the tenant turned entra keeps that seat while the company has given them no role"): one
     admitting nobody but by name, not refunded, made by an order recorded before `ent` turned, that the person owns or, for a lead
     seat, was named a lead on, or, for a desk, was admitted to by name; for a lead, not desk-only. ?1 the person, ?4 the turn. */
  const PRE_TURN = lead => "l.seat_source = 'admit' AND l.refunded = 0 AND l.trial_ends IS NULL" + (lead ? " AND l.desk_only = 0" : "")
    + " AND (l.owner = ?1 OR " + (lead ? "l.id IN (SELECT licence FROM lead_names WHERE person = ?1)" : "EXISTS (SELECT 1 FROM admits m WHERE m.licence = l.id AND m.org = ?3 || ?1)") + ")"
    + " AND NOT EXISTS (SELECT 1 FROM admits a WHERE a.licence = l.id AND substr(a.org, 1, ?2) <> ?3)"
    + " AND EXISTS (SELECT 1 FROM orders o WHERE o.tag = l.key_hash AND o.at < ?4)"; /* plant:own-before */
  const ownBefore = (db, person, ent, lead) => db.prepare("SELECT " + LICENCE_COLUMNS + " FROM licences l WHERE " + PRE_TURN(lead) + " "
    + "ORDER BY (l.owner = ?1) DESC, l.desk_only ASC, l.paid_until DESC, l.id DESC LIMIT 1").bind(person, PERSON.length, PERSON, ent.entra_at || 0).first();
  /* A PERSON THE COMPANY ASSIGNED IS THE COMPANY'S (22:07: "an assigned colleague must not sit on both"): their seats of either kind on every
     licence bought before the turn are freed, unseen and unproved, as the token that carries a role is spent. Never stamped a removal
     (removalStamp): the owner's naming stands, and the seat comes back if the company takes the role away, which a purge would forbid.
     IN THE BATCH THAT SPENDS THE TOKEN, AND ONLY WHERE IT DOES (Argon's second review of the sign-in, finding 5): these statements ride
     the batch that takes the company's seat (takeSeat, on `cond` the seat taken), that frees a seat for a role not that one (noRole) or
     that records a desk's wait (signin/desk), each on `cond` the token unspent, so a renewal on the day of assignment finds its seat
     before it is released, and a refused attempt (a token spent already, no seat free) writes nothing (the invariant i1). Statements
     for `statement` (params): `person` the person, `ent` the licence that follows Entra, `cond(q)` the condition. */
  const preTurnQ = (q, lead, person, ent) => PRE_TURN(lead).replace(/\?([1-4])(?![0-9])/g, (m, n) => q([person, PERSON.length, PERSON, ent.entra_at || 0][n - 1]));
  const releaseBefore = (person, ent, cond) => [
    q => "UPDATE seats SET seen_at = 0, proved_at = 0 WHERE person = " + q(person) + " AND licence IN (SELECT l.id FROM licences l WHERE "
      + preTurnQ(q, false, person, ent) + " UNION SELECT l.id FROM licences l WHERE " + preTurnQ(q, true, person, ent) + ") AND " + cond(q),
    q => "UPDATE desk_keys SET seen_at = 0 WHERE person = " + q(person) + " AND licence IN (SELECT l.id FROM licences l WHERE "
      + preTurnQ(q, false, person, ent) + ") AND " + cond(q),
  ];
  const statementOf = (db, build) => { const q = params(); const sql = build(q); return db.prepare(sql).bind(...q.values); };
  /* Why a tenant's person holds what they hold, named in the answer: their own licence while unassigned, or the company's though they own one. */
  /* ASSIGNED MEANS GIVEN A SEAT (the coordinator's reading of Claude alpha's rule, 2026-11-13): Etiuda.Agent or Etiuda.Lead. The Administrator's
     role alone holds no seat, so its holder keeps, and reaches, what they bought before the turn. */
  const seatRoleOf = roles => !!roles && (roles.has(ROLE.agent) || roles.has(ROLE.lead));
  const causeOf = (own, roles) => (own ? (seatRoleOf(roles) ? "assigned" : "own-licence") : undefined); /* plant:own-cause */
  const running = (row, now) => (row.trial_ends !== null && row.trial_ends !== undefined ? row.trial_ends > now : row.paid_until > now);

  /* A TRIAL, ONCE PER UNIT, IN ONE BATCH: the licence row, owned by the person starting it, is inserted only where no row
     holds the unit (the unique index licences_one_trial decides), and a Studio trial's admission is written for whichever row
     holds its unit, so two leads racing end on one. Once per person the unit is the person, so the trial admits them alone as
     lead. TWO TRIALS (Max, 2026-11-17 13:20: "14 dayd trial should be separate for desk and for studio"): the desk's (o.deskOnly)
     is had under DESK_TRIAL and Studio's under its own unit, so neither start meets, ends or changes the other's row. */
  async function startTrial(db, s, unit, now, o) {
    const opt = o || {}, ends = now + TRIAL_DAYS * DAY;
    const deskSeats = opt.deskOnly ? 1 : (s.personal ? TRIAL_PERSONAL_DESK_SEATS : TRIAL_DESK_SEATS); /* plant:trial-seats-personal */
    const gate = opt.digest ? "WHERE NOT EXISTS (SELECT 1 FROM seen WHERE digest = ?10) " : "WHERE 1 ";
    const vals = [NO_KEY + randomHex(16), NO_KEY, deskSeats, dayOf(ends), TRIAL_LEAD_SEATS, ends, unit, s.person, opt.deskOnly ? 1 : 0];
    if (opt.digest) vals.push(opt.digest);
    const insert = db.prepare("INSERT INTO licences (key_hash, email_hash, org, seats, updates_until, paid_until, refunded, lead_seats, "
      + "trial_ends, trial_unit, owner, desk_only, org_desks) SELECT ?1, ?2, 'Trial', ?3, ?4, 0, 0, ?5, ?6, ?7, ?8, ?9, 1 " + gate
      + "ON CONFLICT (trial_unit) WHERE trial_unit IS NOT NULL DO NOTHING") /* plant:trial-once */
      .bind(...vals);
    await db.batch([insert].concat(opt.deskOnly ? [] : [
      db.prepare("INSERT INTO admits (licence, provider, org) SELECT id, ?1, ?2 FROM licences WHERE trial_unit = ?2 AND desk_only = 0 " /* plant:studio-trial-admit */
        + "AND owner IS NOT NULL ON CONFLICT DO NOTHING").bind(s.provider, unit), /* plant:trial-erased-admit */
    ]));
  }

  /* THE PERSON'S CODE, made once: their lead seat's where one was kept before persons were, else a fresh one. Written only where
     the call it serves is answered ok (a refusal writes nothing; the test architect's survey of 2026-11-12): takeSeat makes it in
     its own batch where the seat is held now, and signin/desk's answer of no licence here where its token is unspent (`digest`). */
  const personRow = (db, s, now, digest) => db.prepare("INSERT INTO persons (person, provider, code, made) SELECT ?1, ?2, "
    + "COALESCE((SELECT code FROM seats WHERE kind = 'lead' AND person = ?1), ?3), ?4 WHERE NOT EXISTS (SELECT 1 FROM seen WHERE digest = ?5) "
    + "ON CONFLICT (person) DO NOTHING").bind(s.person, s.provider, makeSeatCode(), now, digest);
  /* WHAT IS KEPT OF THE PERSON, WRITTEN (identOf; option A of 2026-11-16 21:21): the statement, for a batch, setting persons' name, address
     and vouched mark from s.keep where `cond` holds, a value the token carries overwriting the one kept and no history kept, one it does not
     carry leaving it (the vouched mark goes with the address), except that A SIGN-IN NAMING NO ADDRESS CLEARS THE VOUCHED MARK on the one kept
     (the Grok review beta's B3 of 2026-11-22: the provider no longer vouches it on this sign-in, so a naming of that address is the owner's to
     confirm, not taken by an Accept alone); and signed_at, the sign-in's time, which the purge counts NAMES_DAYS from.
     s.keep {clear: true} empties all three: nothing is kept of a person whose seats follow Entra (the routes set it so). Written only in the
     batch that answers the sign-in ok, on that batch's own condition, so a refusal writes nothing of the person. */
  const identStatement = (q, s, now, cond) => (s.keep.clear
    ? "UPDATE persons SET name = NULL, address = NULL, vouched = NULL, domain = NULL, signed_at = " + q(now) + " WHERE person = " + q(s.person) + " AND " + cond
    : "UPDATE persons SET name = COALESCE(" + q(s.keep.name) + ", name), address = COALESCE(" + q(s.keep.address) + ", address), " /* plant:ident-coalesce */
      + "vouched = CASE WHEN " + q(s.keep.address) + " IS NULL THEN (CASE WHEN vouched IS NULL THEN NULL ELSE 0 END) ELSE " + q(s.keep.vouched) + " END, " /* plant:ident-unvouch */
      + "domain = CASE WHEN " + q(s.keep.address) + " IS NULL THEN domain ELSE " + q(s.keep.domain === undefined ? null : s.keep.domain) + " END, signed_at = " + q(now) /* plant:ident-domain-kept */
      + " WHERE person = " + q(s.person) + " AND " + cond);
  const CLEAR = Object.freeze({ clear: true });

  const PROOF_MS = PROOF_DAYS * DAY;
  /* A pooled desk's certificate runs a day (section 12, the test architect's finding of 2026-11-14). */
  const POOLED_CERT_MS = DAY;
  /* A proof lapsed: freed (0) or older than PROOF_DAYS. */
  const lapsed = (proved, now) => !(proved > 0) || now - proved >= PROOF_MS; /* plant:proof-lapse */

  /* THE SET THAT STAYS WHEN SEATS IN FORCE FALL BELOW THE SEATED (Claude alpha's ruling of 2026-11-18): for a licence and kind, the
     persons currently seated on it (seen within grace and proved within the window), ordered owner first, then chosen in seat_stays
     (oldest choice first), then longest-seated (seated_at ascending, person to break a tie), capped at the in-force count. */
  /* capNowSql, where given, is the instant the cap is read at (a cancel's paid_until, still ahead); the renewal path passes none, so
     the cap is now. The active-seat window stays on nowSql either way. */
  const stayingPersons = (licSql, kindSql, nowSql, freshSql, capNowSql) => { const capAt = capNowSql || nowSql;
    return "SELECT s.person FROM seats s JOIN licences l ON l.id = s.licence "
    + "LEFT JOIN seat_stays st ON st.licence = s.licence "
    + "AND st.kind = s.kind " /* plant:seat-stay-stays-kind */
    + "AND st.person = s.person "
    + "WHERE s.licence = " + licSql + " "
    + "AND s.kind = " + kindSql + " " /* plant:seat-stay-seat-kind */
    + "AND s.seen_at > " + nowSql + " - l.grace_days * " + DAY + " AND s.proved_at > " + freshSql + " " /* plant:seat-stay-active-only */
    + "ORDER BY (IFNULL(l.owner = s.person, 0) AND (" + kindSql + " <> 'lead' OR l.desk_only = 0)) DESC, " /* plant:seat-stay-owner */ /* plant:seat-stay-list-owner */
    + "(st.person IS NOT NULL) DESC, " /* plant:seat-stay-chosen */
    + "st.at ASC, " /* plant:seat-stay-choice-order */
    + "s.seated_at ASC, s.person ASC " /* plant:seat-stay-longest */
    + "LIMIT (SELECT CASE " + kindSql + " WHEN 'lead' THEN " + inForceCol("lead_seats", "licences.id", capAt, "") + " * (1 - desk_only) ELSE " + inForceCol("seats", "licences.id", capAt, "") + " END FROM licences WHERE id = " + licSql + ")"; /* plant:seat-stay-cap */
  };

  /* A REDUCTION KNOWN AHEAD (piece b): only a cancelled subscription whose paid_until is still ahead. A renewal that writes fewer
     seats is known only when it lands; nothing here invents a source for it. The first such date at which this kind's in-force
     count, read through inForceCol at that paid_until, is below the number seated now. Null where none is. */
  async function comingReduction(db, licence, kind, now) {
    const col = kind === "lead" ? "lead_seats" : "seats";
    const seatedRow = await db.prepare("SELECT COUNT(*) AS n FROM seats s JOIN licences l ON l.id = s.licence WHERE s.licence = ?1 AND s.kind = ?2 "
      + "AND s.seen_at > ?3 - l.grace_days * ?4 AND s.proved_at > ?5").bind(licence, kind, now, DAY, now - PROOF_MS).first();
    const seated = seatedRow ? seatedRow.n : 0;
    const dates = await db.prepare("SELECT DISTINCT paid_until AS at FROM pay_subs WHERE licence = ?1 "
      + "AND status = 'canceled' AND paid_until > ?2 AND " + col + " > 0 ORDER BY paid_until").bind(licence, now).all(); /* plant:seat-stay-list-reduction */
    for (const d of dates.results) {
      const row = await db.prepare("SELECT CASE ?3 WHEN 'lead' THEN " + inForceCol("lead_seats", "id", "?2") + " * (1 - desk_only) ELSE "
        + inForceCol("seats", "id", "?2") + " END AS n FROM licences WHERE id = ?1").bind(licence, d.at, kind).first();
      if (row && seated > row.n) return { at: dayOf(d.at), seats: row.n, seated, atMs: d.at };
    }
    return null; /* plant:seat-stay-list-none */
  }

  /* A SEAT, AND WHAT PROVES IT, IN ONE BATCH (A4; Claude alpha's decision 15 items 1 and 5). The person takes (or keeps, or
     moves to) a seat of `s.kind` on `licence` only while fewer other persons than the licence's count of that kind are
     seen there within its grace and proved within PROOF_DAYS; a seat that is neither is not counted and stays where it is.
     o.proved sets proved_at, as a fresh proof does; without it (the quiet check) a freed or lapsed seat is left as it is. o.window
     is the licence's proof window (windowOf), PROOF_DAYS where not given.
     o.digest is the token's replay digest: the seat is taken only where the token is unspent, and the token spent only
     where the seat was taken, so a refused attempt leaves it unspent. o.renew takes only a seat already held and not
     freed; o.deskKey records the desk within DESKS_PER_PERSON in the same batch, and o.notFreed takes nothing where the
     person's seat of this kind on this licence was freed. The person's code is made here, where they have none, and a lead
     seat takes it; o.held {org} holds the desk key for its person (person_desks) as signin/desk's first sign-in does. Each is
     written only where the seat is held now, after the seat's statement in the same batch, so a seat not taken writes no
     person, no held desk and no list entry here (Argon's review of the sign-in service, finding 2; the test architect's survey);
     what a desk's wait for a free seat records, signin/desk records on purpose (decision 32). THE OWNER IS NEVER LOCKED OUT (Argon's checkpoint 4; Claude alpha's floor of 2026-11-12: "an owner can never lose
     their licence"): a lead seat on a licence its person owns is taken whatever the others hold, since only the owner frees a
     lead seat and an owner who freed their own while co-leads filled the rest could otherwise never sign in again. Co-leads
     still count the owner's seat, so they never pass the count; the owner alone may stand one past it, until a lead is freed or
     lapses. {ok, row, spent, desks}: ok where this call holds the seat now. */
  async function takeSeat(db, s, licence, now, o) {
    const opt = o || {};
    const renewing = !!(opt.renew || opt.notFreed); /* plant:seat-stay-renew-gate */
    const seatedHere = (q, K, P, L, NOW, FRESH) => "EXISTS (SELECT 1 FROM seats cs JOIN licences cl ON cl.id = cs.licence WHERE cs.kind = " + K
      + " AND cs.person = " + P + " AND cs.licence = " + L + " AND cs.seen_at > " + NOW + " - cl.grace_days * " + q(DAY) + " AND cs.proved_at > " + FRESH + ")";
    /* POOLED (section 12.2 point 3): the person's pooled desks share one place, so a pooled desk counts only their ordinary desks
       against DESKS_PER_PERSON and frees their other pooled desks' places in the batch that records it. */
    const pooled = opt.pooled === true && !!opt.deskKey; /* plant:pooled-new */
    /* Each fragment names its values through the statement's own q, so every statement binds exactly what it names. */
    const grace = q => "(SELECT grace_days FROM licences WHERE id = " + q(licence) + ") * " + q(DAY);
    const deskRoom = q => "(SELECT COUNT(*) FROM desk_keys WHERE licence = " + q(licence) + " AND person = " + q(s.person)
      + " AND desk_key <> " + q(opt.deskKey) + (pooled ? " AND pooled = 0" : "") /* plant:pooled-room */
      + " AND seen_at > " + q(now) + " - " + grace(q) + ") < " + q(DESKS_PER_PERSON) + " "; /* plant:desk-cap */
    /* Taken by this batch: the seat on this licence, seen and proved now, and the desk recorded now. */
    const taken = (q, seatOnly) => "EXISTS (SELECT 1 FROM seats WHERE kind = " + q(s.kind) + " AND person = " + q(s.person) + " AND licence = "
      + q(licence) + " AND seen_at = " + q(now) + " AND proved_at = " + q(now) + ")" + (opt.deskKey && !seatOnly
      ? " AND EXISTS (SELECT 1 FROM desk_keys WHERE licence = " + q(licence) + " AND person = " + q(s.person)
        + " AND desk_key = " + q(opt.deskKey) + " AND seen_at = " + q(now) + ")" : "");
    /* Held by this batch, proved or not (the quiet check proves nothing): the seat on this licence seen now, and the desk recorded now. */
    const heldNow = q => "EXISTS (SELECT 1 FROM seats WHERE kind = " + q(s.kind) + " AND person = " + q(s.person) + " AND licence = "
      + q(licence) + " AND seen_at = " + q(now) + ")" + (opt.deskKey
      ? " AND EXISTS (SELECT 1 FROM desk_keys WHERE licence = " + q(licence) + " AND person = " + q(s.person)
        + " AND desk_key = " + q(opt.deskKey) + " AND seen_at = " + q(now) + ")" : "");
    const statement = build => { const q = params(); const sql = build(q); return db.prepare(sql).bind(...q.values); };

    const stmts = [], at = {};
    if (opt.digest) {
      at.spent = stmts.push(db.prepare("SELECT EXISTS (SELECT 1 FROM seen WHERE digest = ?1) AS spent").bind(opt.digest)) - 1;
      stmts.push(db.prepare("DELETE FROM seen WHERE until < ?1").bind(now));
    }
    stmts.push(statement(q => {
      const K = q(s.kind), P = q(s.person), L = q(licence), NOW = q(now), FRESH = q(now - (opt.window || PROOF_MS));
      const room = "(SELECT COUNT(*) FROM seats WHERE licence = " + L + " AND kind = " + K + " "
        + "AND person <> " + P + " AND seen_at > " + NOW + " - " + grace(q) + " " /* plant:grace */
        + "AND proved_at > " + FRESH + ") " /* plant:proof-count */
        + "< (SELECT CASE " + K + " WHEN 'lead' THEN " + inForceCol("lead_seats", "licences.id", NOW, "") + " * (1 - desk_only) ELSE " + inForceCol("seats", "licences.id", NOW, "") + " END FROM licences WHERE id = " + L + ") "; /* plant:seat-room */
      /* A PERSON WHO STAYS IS SEATED AT ONCE, ON ANY SIGN-IN (the test architect's read of 7e15261b, class B): where in-force seats are below the
         seated, room counts every other person seated and so refuses even a person the rule keeps until the others' grace runs out. A person the
         rule keeps is admitted by it; anyone else by room as before (room is false for a seated person it does not keep, in a reduction). */
      const admission = renewing
        ? "CASE WHEN " + seatedHere(q, K, P, L, NOW, FRESH) + " THEN " + P + " IN (" + stayingPersons(L, K, NOW, FRESH) + ") ELSE (" + room + ") END "
        : "(" + room + "OR " + P + " IN (" + stayingPersons(L, K, NOW, FRESH) + ")) "; /* plant:seat-stay-signin-room */
      let gate = "WHERE (" + admission
        + "OR (" + K + " = 'lead' AND EXISTS (SELECT 1 FROM licences WHERE id = " + L + " AND owner = " + P + " AND desk_only = 0 AND " + inForceCol("lead_seats", "licences.id", NOW, "") + " >= 1))) "; /* plant:owner-room */
      if (opt.digest) gate += "AND NOT EXISTS (SELECT 1 FROM seen WHERE digest = " + q(opt.digest) + ") "; /* plant:seat-unspent */
      if (opt.renew) gate += "AND EXISTS (SELECT 1 FROM seats WHERE kind = " + K + " AND person = " + P + " AND proved_at > 0) "; /* plant:renew-freed */
      if (opt.deskKey) gate += "AND " + deskRoom(q);
      /* Whichever licence the seat is on (Grok's second review of the sign-in, finding 2): a person has one seat of a kind, so one freed on
         another licence is freed here too, as a lead's renewal reads it. */
      if (opt.notFreed) gate += "AND NOT EXISTS (SELECT 1 FROM seats WHERE kind = " + K + " AND person = " + P
        + " AND proved_at = 0) "; /* plant:desk-renew-freed */
      return "INSERT INTO seats (kind, person, licence, provider, org, tid, oid, seated_at, seen_at, proved_at, code) SELECT "
        + [K, P, L, q(s.provider), q(s.org), q(s.tid), q(s.oid), NOW, NOW, q(opt.proved ? now : 0),
          s.kind === "lead" ? "(SELECT code FROM persons WHERE person = " + P + ")" : "NULL"].join(", ") + " " + gate
        + "ON CONFLICT (kind, person) DO UPDATE SET licence = excluded.licence, provider = excluded.provider, "
        + "org = excluded.org, tid = excluded.tid, oid = excluded.oid, seen_at = excluded.seen_at, "
        + "proved_at = CASE WHEN excluded.proved_at > 0 THEN excluded.proved_at ELSE seats.proved_at END, "
        + "code = COALESCE(seats.code, excluded.code), "
        + "seated_at = CASE WHEN seats.licence = excluded.licence THEN seats.seated_at ELSE excluded.seated_at END "
        + "WHERE excluded.proved_at > 0 OR seats.proved_at > " + FRESH; /* plant:check-retake */
    }));
    /* o.release: the licence that follows Entra whose seat this is, for an assigned person: their seats before the turn released, only
       where this batch took the seat (releaseBefore). */
    if (opt.release) for (const build of releaseBefore(s.person, opt.release, q => taken(q, true))) stmts.push(statement(build)); /* plant:release-taken */
    /* A person proved back onto a seat they were removed from is no longer removed from it: a later removal counts its days afresh. */
    stmts.push(statement(q => "DELETE FROM removals WHERE licence = " + q(licence) + " AND person = " + q(s.person) + " AND kind = " + q(s.kind)
      + " AND " + taken(q, true))); /* plant:removal-cleared */
    /* A desk's mark is its latest sign-in's: a desk whose policy is set or cleared is pooled or ordinary from then on. */
    if (opt.deskKey) stmts.push(statement(q => "INSERT INTO desk_keys (licence, person, desk_key, seen_at, pooled) SELECT "
      + [q(licence), q(s.person), q(opt.deskKey), q(now), q(pooled ? 1 : 0)].join(", ") + " WHERE " + taken(q, true) + " AND " + deskRoom(q)
      + "ON CONFLICT (licence, person, desk_key) DO UPDATE SET seen_at = excluded.seen_at, pooled = excluded.pooled"));
    if (opt.deskKey) stmts.push(statement(q => "DELETE FROM freed_desks WHERE licence = " + q(licence) + " AND desk_key = " + q(opt.deskKey) + " AND " + taken(q))); /* plant:freed-reseated */
    if (opt.mineLeave) for (const build of opt.mineLeave(q => taken(q, true))) stmts.push(statement(build));
    const endedIdx = opt.mineLeave && storeForms() ? stmts.length - 1 : -1;
    /* o.also: statements a route rides on the seat taken (signin/desk's invitation, the one act), each on that condition. */
    if (opt.also) for (const build of opt.also(q => taken(q, true))) stmts.push(statement(build));
    /* Where the seats follow Entra, the relay is told which desks were freed so (option (d), migration 0018): the keys this frees,
       recorded with the instant in the same batch, before the update that frees them (the relay seats' statement, met here). */
    if (pooled) stmts.push(statement(q => "INSERT INTO freed_desks (licence, desk_key, at) SELECT licence, desk_key, " + q(now) + " FROM desk_keys WHERE person = "
      + q(s.person) + " AND pooled = 1 AND desk_key <> " + q(opt.deskKey) + " AND seen_at > 0 AND licence IN (SELECT id FROM licences WHERE seat_source = 'entra') AND "
      + taken(q) + " ON CONFLICT (licence, desk_key) DO UPDATE SET at = excluded.at")); /* plant:pooled-freed */
    /* The place taken over: the person's other pooled desks stop counting, only where this one was recorded now, so a refusal frees
       nothing. Their keys stay held for their renewal, which takes the place back in turn. */
    if (pooled) stmts.push(statement(q => "UPDATE desk_keys SET seen_at = 0 WHERE person = " + q(s.person) + " AND pooled = 1 AND desk_key <> "
      + q(opt.deskKey) + " AND " + taken(q))); /* plant:pooled-free */
    /* The person's code where they have none, then a lead seat's code from it, both where the seat is held now. */
    stmts.push(statement(q => "INSERT INTO persons (person, provider, code, made) SELECT " + [q(s.person), q(s.provider),
      "COALESCE((SELECT code FROM seats WHERE kind = 'lead' AND person = " + q(s.person) + "), " + q(makeSeatCode()) + ")", q(now)].join(", ")
      + " WHERE " + heldNow(q) + " ON CONFLICT (person) DO NOTHING")); /* plant:person-held */
    if (s.kind === "lead") stmts.push(statement(q => "UPDATE seats SET code = (SELECT code FROM persons WHERE person = " + q(s.person) + ") "
      + "WHERE kind = 'lead' AND person = " + q(s.person) + " AND code IS NULL AND " + heldNow(q)));
    /* What is kept of the person, from a fresh proof only and only where this batch took the seat (identStatement). */
    if (opt.proved && s.keep) stmts.push(statement(q => identStatement(q, s, now, taken(q)))); /* plant:ident-taken */
    if (opt.held) stmts.push(statement(q => "INSERT INTO person_desks (person, desk_key, signed_at, org) SELECT "
      + [q(s.person), q(opt.deskKey), q(now), q(opt.held.org)].join(", ") + " WHERE " + taken(q) /* plant:held-taken */
      + " ON CONFLICT (person, desk_key) DO UPDATE SET signed_at = excluded.signed_at, org = excluded.org"));
    if (opt.digest) at.spend = stmts.push(statement(q => "INSERT INTO seen (digest, until) SELECT " + q(opt.digest) + ", " + q(opt.until)
      + " WHERE " + taken(q) + " ON CONFLICT (digest) DO NOTHING")) - 1; /* plant:spend-taken */
    at.row = stmts.push(db.prepare("SELECT licence, seen_at, proved_at, code FROM seats WHERE kind = ?1 AND person = ?2").bind(s.kind, s.person)) - 1;
    if (opt.deskKey) at.desks = stmts.push(statement(q => "SELECT COALESCE(SUM(desk_key <> " + q(opt.deskKey) + (pooled ? " AND pooled = 0" : "") + "), 0) AS others, "
      + "COALESCE(SUM(desk_key = " + q(opt.deskKey) + " AND seen_at = " + q(now) + "), 0) AS mine FROM desk_keys WHERE licence = "
      + q(licence) + " AND person = " + q(s.person) + " AND seen_at > " + q(now) + " - " + grace(q))) - 1;
    if (renewing) at.stay = stmts.push(statement(q => {
      const K = q(s.kind), P = q(s.person), L = q(licence), NOW = q(now), FRESH = q(now - (opt.window || PROOF_MS));
      return "SELECT " + seatedHere(q, K, P, L, NOW, FRESH) + " AS seated, "
        + "(" + P + " IN (" + stayingPersons(L, K, NOW, FRESH) + ")) AS stays";
    })) - 1;
    const res = await db.batch(stmts);
    const row = res[at.row].results[0] || null;
    const spent = opt.digest ? res[at.spent].results[0].spent === 1 : false;
    let ok = !!row && row.licence === licence && row.seen_at === now;
    if (opt.digest) ok = ok && res[at.spend].meta.changes === 1; /* plant:token-once */
    const displaced = renewing && !ok && !spent && !!res[at.stay].results[0]
      && res[at.stay].results[0].seated === 1 && res[at.stay].results[0].stays === 0; /* plant:seat-stay-waiting-not-signin */
    return { ok, row, spent, displaced, desks: opt.deskKey ? res[at.desks].results[0] : null, ended: ok && endedIdx >= 0 ? res[endedIdx].results : [] };
  }

  /* THE KEY, BOUND THROUGH THE PERSON'S LEAD SEAT, IN ONE BATCH: this key bound (or moved) to `licence`, a binding a purchase
     key made before taken over; every key of the person follows to it; and of the person's keys only the DEVICES_PER_SEAT
     seen latest stay, the rest released (recorded, so their check says so). */
  async function bindPerson(db, lead, person, licence, now) {
    const tag = randomHex(16);
    await db.batch([
      db.prepare("INSERT INTO bindings (lead, licence, bound_at, seen_at, person) VALUES (?1, ?2, ?3, ?3, ?4) "
        + "ON CONFLICT (lead) DO UPDATE SET licence = excluded.licence, seen_at = excluded.seen_at, person = excluded.person, "
        + "bound_at = CASE WHEN bindings.licence = excluded.licence THEN bindings.bound_at ELSE excluded.bound_at END") /* plant:s4-take-over */
        .bind(lead, licence, now, person),
      db.prepare("UPDATE bindings SET licence = ?1 WHERE person = ?2").bind(licence, person), /* plant:keys-follow */
      db.prepare("INSERT INTO releases (licence, lead, at, token) SELECT ?1, lead, ?2, ?3 || lead FROM bindings WHERE person = ?4 "
        + "ORDER BY seen_at DESC, bound_at DESC, lead DESC LIMIT -1 OFFSET ?5").bind(licence, now, tag, person, DEVICES_PER_SEAT), /* plant:key-cap */
      /* A released key's doors are never handed again (doorsOf reads a door through its key's binding), and with the binding gone no
         erasure of the person can find them (Grok's review 3 of erasure, finding 4), so they go in this batch. */
      db.prepare("DELETE FROM doors WHERE lead IN (SELECT lead FROM releases WHERE token = ?1 || releases.lead)").bind(tag), /* plant:release-doors */
      db.prepare("DELETE FROM bindings WHERE person = ?1 AND lead IN (SELECT lead FROM releases WHERE token = ?2 || releases.lead)")
        .bind(person, tag),
    ]);
  }
  /* A PERSON BACK ON THEIR OWN LICENCE BOUGHT BEFORE THE TURN (Argon's second review of the sign-in, finding 4; Claude alpha, 21:34: "stays
     theirs and reachable"): their keys, bound there now, lose the mark a licence following Entra gave them, so their grants there are plain,
     as before the turn, rather than none (grantFor). The relay keeps the gate it set on the teams those keys led while marked, since a grant
     without seats changes nothing there and only a signed release lifts it. A marked key bound to anyone else's licence keeps its mark (RS8). */
  const unmarkOwn = (db, person) => db.prepare("DELETE FROM entra_keys WHERE lead IN (SELECT lead FROM bindings WHERE person = ?1)").bind(person).run(); /* plant:entra-key-unmark */

  /* THE COUNTS BY KIND on a licence: the seats seen within its grace and proved within PROOF_DAYS, and how many it has. */
  async function seatCounts(db, row, now) {
    const got = await db.prepare("SELECT kind, COUNT(*) AS n FROM seats WHERE licence = ?1 AND seen_at > ?2 AND proved_at > ?3 GROUP BY kind")
      .bind(row.id, now - row.grace_days * DAY, now - windowOf(row)).all();
    const n = k => { const r = got.results.find(x => x.kind === k); return r ? r.n : 0; };
    const cap = await inForceOf(db, row, now); /* plant:counts-in-force */
    return { lead: { held: n("lead"), of: row.desk_only ? 0 : cap.lead_seats }, desk: { held: n("desk"), of: cap.seats } };
  }

  /* THE SEAT FOLLOWS THE ORGANISATION'S CURRENT LICENCE at a quiet check: for a key bound through a
     person, that person's lead seat is taken again on the organisation's current licence (the one it is on, where none is
     newer), and the person's keys follow; where no seat is free there it is a released key's holding. A freed or lapsed
     seat is never taken here: the holding is "signin", and nothing is taken, moved or granted (decision 15 item 1). Such a
     key's holding carries who it is: `me`, its seat's code, `owner`, and `due` from PROOF_ASK_DAYS. Any other key's holding
     is as it was. WHERE NO LICENCE ADMITS THE PERSON NOW (Argon's review of the sign-in service, finding 7), the key holds
     nothing: the seat is never kept on the licence it is bound to by that binding alone (a refunded one still answers as
     refunded). */
  /* MANAGED ON EVERY OK ANSWER (the test architect's R1 on board 1020, 2026-11-22): where followSeat finds no person behind the key, no lead seat
     row, or no licence to follow, the answer still says managed when the key's licence follows Entra or the seat's organisation has a licence
     that does, as who() says it on every other path, so Studio keeps its mark and offers no Buy; {} otherwise. */
  const managedOf = async (db, h, seat) => ((h.row && h.row.seat_source === "entra")
    || (seat && typeof seat.org === "string" && seat.org.slice(0, PERSON.length) !== PERSON && await entraLicence(db, { provider: seat.provider, org: seat.org }))
    ? { managed: true } : {}); /* plant:follow-managed */
  async function followSeat(db, lead, h, now) {
    if (h.kind === "none" || h.kind === "signin") return h;
    const b = await db.prepare("SELECT person FROM bindings WHERE lead = ?1").bind(lead).first();
    if (!b || !b.person) return Object.assign({}, h, await managedOf(db, h, null));
    const seat = await db.prepare("SELECT provider, org, tid, oid, proved_at, code, (SELECT seat_source FROM licences WHERE id = seats.licence) AS source "
      + "FROM seats WHERE kind = 'lead' AND person = ?1").bind(b.person).first();
    if (!seat) return Object.assign({}, h, await managedOf(db, h, null)); /* plant:follow-no-seat-managed */
    if (lapsed(seat.proved_at, now)) return { kind: "signin" };
    if (seat.source === "entra" && now - seat.proved_at >= ENTRA_PROOF_MS) return { kind: "signin" }; /* plant:entra-lapse */
    const cur = await leadLicence(db, b.person, now);
    let target = cur || (h.row.refunded ? h.row : null); /* plant:follow */
    if (!target) return Object.assign({ kind: "none", released: false }, await managedOf(db, h, seat)); /* plant:follow-admitted */
    /* A person of a tenant whose licence follows Entra holds outside it only their licence bought before the turn, as their sign-in would
       seat them (entraLead): a trial or a later licence is no longer handed, and a sign-in, asked for here, tells them the tenant is managed. */
    let mineBefore = false;
    if (!target.refunded) {
      const pre = await outsideEntra(db, b.person, seat, target);
      if (pre === false) return { kind: "signin" }; /* plant:follow-entra-own */
      if (pre) { target = pre; mineBefore = true; }
    }
    const ask = await askOwner(db, seat, target, now);
    const who0 = row => ({ person: b.person, me: seat.code, owner: row.seat_source !== "entra" && !!row.owner && row.owner === b.person,
      due: now - seat.proved_at >= PROOF_ASK_DAYS * DAY, ask }); /* plant:proof-due */
    /* On a licence whose seats follow Entra, the answer says so, and a proof is asked from half its window. A person of such a tenant on
       a licence of their own bought before it turned is told so too, and why (Claude alpha, 21:34), as the sign-in that seated them was. */
    const ent = typeof seat.org === "string" && seat.org.slice(0, PERSON.length) !== PERSON ? await entraLicence(db, { provider: seat.provider, org: seat.org }) : null;
    const own = ent && target.seat_source !== "entra" ? "own-licence" : ent && await ownBefore(db, b.person, ent, true) ? "assigned" : undefined; /* plant:check-cause */
    const who = row => Object.assign(who0(row), row.seat_source === "entra" ? { managed: true, due: now - seat.proved_at >= ENTRA_PROOF_MS / 2 } : {},
      ent ? { managed: true } : {}, own ? { cause: own } : {});
    if (target.refunded) return Object.assign({}, h, who(h.row));
    const s = { kind: "lead", person: b.person, provider: seat.provider, org: seat.org, tid: seat.tid, oid: seat.oid };
    const got = await takeSeat(db, s, target.id, now, { window: windowOf(target) });
    if (!got.ok) return got.row && lapsed(got.row.proved_at, now) ? { kind: "signin" }
      : Object.assign({ kind: "none", released: true }, who(target)); /* plant:stale-check */
    if (target.id !== h.row.id) await bindPerson(db, lead, b.person, target.id, now);
    if (mineBefore) await unmarkOwn(db, b.person);
    return Object.assign(holdingOfRow(target), who(target), { me: got.row.code });
  }
  /* Whether a key bound through a person holds a lead seat freed or lapsed, which followSeat answers "signin"; read only, for
     the grant fetch, which must give such a key nothing a check would not. */
  async function seatLapsed(db, lead, now) {
    const b = await db.prepare("SELECT person FROM bindings WHERE lead = ?1").bind(lead).first();
    if (!b || !b.person) return false;
    const seat = await db.prepare("SELECT provider, org, proved_at, (SELECT seat_source FROM licences WHERE id = seats.licence) AS source FROM seats "
      + "WHERE kind = 'lead' AND person = ?1").bind(b.person).first();
    if (!seat) return false;
    if (lapsed(seat.proved_at, now) || (seat.source === "entra" && now - seat.proved_at >= ENTRA_PROOF_MS)) return true;
    /* A key an Entra tenant's person holds outside it on anything but their licence bought before the turn: followSeat asks it to sign in. */
    const row = await db.prepare("SELECT " + LICENCE_COLUMNS + " FROM licences WHERE id = (SELECT licence FROM bindings WHERE lead = ?1)").bind(lead).first();
    const pre = row && !row.refunded ? await outsideEntra(db, b.person, seat, row) : null;
    if (pre === false || (!!pre && pre.id !== row.id)) return true; /* plant:grant-entra-own */
    /* A lead seat that no longer holds (leadHolds), which the check answers as a released key's: the fetch gives it nothing a check would not. */
    return !(await db.prepare("SELECT 1 AS h FROM seats h JOIN licences l ON l.id = h.licence WHERE h.kind = 'lead' AND h.person = ?1 AND "
      + leadHolds("h", "?2", "?3", "?4", "?5")).bind(b.person, now, DAY, now - PROOF_MS, now - ENTRA_PROOF_MS).first()); /* plant:grant-holds */
  }
  /* WHAT AN ENTRA TENANT'S PERSON MAY HOLD OUTSIDE ITS LICENCE (Argon's second review of the sign-in, finding 4): `row` a licence not following
     Entra that a key of `person` is on, `seat` their lead seat ({provider, org}). Null where their organisation has no licence following Entra
     (or `row` follows it); else the licence of their own bought before the turn (ownBefore), which alone they may hold there, or false for none. */
  async function outsideEntra(db, person, seat, row) {
    if (!row || row.seat_source === "entra" || typeof seat.org !== "string" || seat.org.slice(0, PERSON.length) === PERSON) return null;
    const ent = await entraLicence(db, { provider: seat.provider, org: seat.org });
    if (!ent) return null;
    return (await ownBefore(db, person, ent, true)) || false;
  }
  const holdingOfRow = row => (row.trial_ends !== null && row.trial_ends !== undefined
    ? { kind: "trial", ends: row.trial_ends, row } : { kind: "licence", row });
  /* ASK THE OWNER (a team is its lead's own): a lead on a trial whose organisation holds a running paid licence that has not named
     them is told so beside the trial, never in its place. */
  const askOwner = async (db, seat, row, now) => row.trial_ends !== null && row.trial_ends !== undefined && typeof seat.org === "string"
    && seat.org.slice(0, PERSON.length) !== PERSON && await orgHolds(db, seat.provider, seat.org, now); /* plant:ask-owner */
  /* What the owner of a paid licence is told of its switch. */
  const switchOf = (row, owner) => (owner && row && (row.trial_ends === null || row.trial_ends === undefined) && !row.desk_only
    ? { orgDesks: row.org_desks === 1 } : {});
  /* What an ok answer for a key bound through a person adds: its seat's code, whether it owns the licence, a proof due, the ask. */
  const whoOf = h => (h.person ? Object.assign({ me: h.me, owner: h.owner }, h.due ? { proof: "due" } : {}, h.ask ? { ask: "owner" } : {},
    switchOf(h.row, h.owner), h.managed ? { managed: true } : {}, h.cause ? { cause: h.cause } : {}) : h.managed ? { managed: true } : {}); /* plant:who-managed */

  /* THE SEATS A GRANT CARRIES on a licence whose seats follow Entra (decision 49, option (b)): the reference its desks' certificates
     name, and the latest proof among the seats it holds, which the relay reads as evidence that the service and Microsoft were
     working and never lowers (relay/core.cjs seatGate, takeSeats). None on any other licence, so its grants are as before. */
  /* A key's mark: its licence, and `held` while that licence runs and the key is not released. */
  async function entraKeyOf(db, lead, now) {
    const m = await db.prepare("SELECT e.licence AS licence, e.released AS released, l.refunded AS refunded, l.paid_until AS paid FROM entra_keys e "
      + "JOIN licences l ON l.id = e.licence WHERE e.lead = ?1").bind(lead).first();
    if (!m) return null;
    return { licence: m.licence, held: m.released !== 1 && m.refunded === 0 && m.paid > now }; /* plant:entra-key-held */
  }
  /* The desk keys a lead freed on an ordinary licence whose certificate from before it could still be current, newest first, at most
     FREED_MAX, each {key, at}, `at` named as now where a clock ahead wrote it later; null where there are none (grantFor). */
  async function freedLoose(db, row, now) {
    if (row.seat_source === "entra") return null;
    const got = await db.prepare("SELECT desk_key, MIN(at, ?3) AS at FROM freed_desks WHERE licence = ?1 AND at > ?4 ORDER BY at DESC, desk_key LIMIT ?2")
      .bind(row.id, FREED_MAX, now, now - PROOF_MS).all(); /* plant:freed-loose-span */
    return got.results.length ? got.results.map(r => ({ key: r.desk_key, at: r.at })) : null;
  }
  async function seatsOf(db, cfg, row, now) {
    if (!db || !row || row.seat_source !== "entra") return undefined; /* plant:seats-entra */
    const got = await db.prepare("SELECT MAX(proved_at) AS live FROM seats WHERE licence = ?1 AND proved_at > 0 AND proved_at <= ?2")
      .bind(row.id, now).first(); /* plant:seats-live */
    const out = { licence: await refOf(cfg, row.id), live: got && Number.isSafeInteger(got.live) ? got.live : 0 };
    /* (d): the pooled desks freed on it within the span, the older rows going first, each with the instant it was freed, so the relay
       refuses only a certificate issued before it (a desk its person comes back to opens). An instant past now, from a clock ahead,
       is named as now, since the relay refuses an entry freed after the grant's issue. */
    await db.prepare("DELETE FROM freed_desks WHERE at <= ?1 AND licence = ?2").bind(now - FREED_SPAN_MS, row.id).run(); /* plant:freed-span */
    const freed = await db.prepare("SELECT desk_key, MIN(at, ?3) AS at FROM freed_desks WHERE licence = ?1 ORDER BY at DESC, desk_key LIMIT ?2").bind(row.id, FREED_MAX, now).all();
    if (freed.results.length) out.freed = freed.results.map(r => ({ key: r.desk_key, at: r.at })); /* plant:freed-read */
    return out;
  }

  /* What a sign-in answers once seated: a paid licence with a grant while paid, or a trial's licence and grant, with the
     seat's code and whether this person owns the licence, and the trials of the person the key is bound through (trialsOfKey).
     PAST A PAID LICENCE'S END (licenceFor's paidUntil, which holds the days of grace) no licence and no grant: `ended` says why, as a
     refunded licence's check does, by its own word (PAID_ENDED), so a Studio tells the two apart. The seat, the binding and everything
     else the answer carries stay as they were, so the quiet check goes on and a payment after it brings the file back at the next one. */
  async function signedIn(cfg, row, lead, now, who0, db, env) {
    const who = Object.assign({ ref: await refOf(cfg, row.id) }, who0, switchOf(row, who0.owner), await trialsOfKey(db, lead)); /* plant:studio-trials */
    Object.assign(who, await buyerOfKey(db, env, lead, now)); /* plant:studio-buyer */
    if (row.trial_ends !== null && row.trial_ends !== undefined) {
      const ends = row.trial_ends;
      return answer(200, Object.assign({ ok: true, licence: await trialLicenceFor(cfg, ends, now), trial: { ends },
        grant: ends > now ? await grantFor(cfg, lead, false, ends, now, undefined, db) : null }, who));
    }
    if (!(row.paid_until > now)) return answer(200, Object.assign({ ok: true, licence: null, grant: null, ended: PAID_ENDED }, who)); /* plant:paid-end-signin */
    return answer(200, Object.assign({ ok: true, licence: await licenceFor(cfg, row, now, db),
      grant: row.paid_until > now ? await grantFor(cfg, lead, true, row.paid_until, now, row, db) : null }, who));
  }

  /* A LICENCE'S PUBLIC REFERENCE: 32 hex of its id's keyed hash, handed to its leads and named by each seat certificate, so a
     lead's Studio knows a certificate is for its own licence and nobody learns the id or counts licences by it. */
  const refOf = async (cfg, id) => (await keyedHash(cfg.hmac, KEYED.ref, String(id))).slice(0, 32); /* plant:ref-keyed */
  /* A person as one licence's leads know them: a keyed pseudonym of the licence and the person, never the same on two licences. */
  const personOutOf = (cfg, id, person) => keyedHash(cfg.hmac, KEYED.personOut, id + "\n" + person);
  /* AN ADDRESS AS AN INVITATION OR A NAMING KEEPS IT (board 1017's rule 5): HMAC under HASH_KEY of the service's one fold of it (keyOfAddress),
     so a sign-in's own address is matched against it and nothing kept reads back as an address; null for none. Its HANDLE on licence `id`,
     32 hex of a keyed hash of the kind ("desk" an invitation, "lead" a naming), the licence and that hash: what a lead's Studio is answered
     in the address's place, keeping beside it what it typed (Claude alpha's word: "the owner's own Studio remembering what it typed for its
     list"), and never the same for one address on two licences. */
  const addressKeyed = (cfg, v) => (typeof v === "string" && v ? keyedHash(cfg.hmac, KEYED.address, keyOfAddress(v)) : Promise.resolve(null)); /* plant:address-keyed */
  const handleOf = async (cfg, kind, id, hash) => (await keyedHash(cfg.hmac, KEYED.inviteOut, kind + "\n" + id + "\n" + hash)).slice(0, 32);

  /* A DESK'S SEAT CERTIFICATE (the interface of 2026-11-12): what a lead's Studio checks under the delegation, naming no token,
     name or address. Its end is the earliest of PROOF_DAYS ahead, the licence's paid date and a trial's end; a pooled desk's, one day
     ahead (section 12), since it renews at every logon and a place taken over must stop within the day.
     `pooled` true also marks the certificate, signed, for the relay's grace (cert.pooled). `member` true marks a Studio's certificate for
     its member key, signed (cert.member), and ends it within MEMBER_DAYS; a desk's never carries it. */
  async function certificateFor(cfg, row, desk, person, code, now, pooled, member) {
    const end = row.trial_ends !== null && row.trial_ends !== undefined ? row.trial_ends : row.paid_until;
    const span = pooled === true ? POOLED_CERT_MS : PROOF_MS; /* plant:pooled-span */
    const cert = { kind: CERT_KIND, format: CERT_FORMAT, licence: await refOf(cfg, row.id), desk,
      person: await personOutOf(cfg, row.id, person), code, issued: now, until: Math.min(now + span, end), /* plant:cert-until */
      via: cfg.delegation, sig: { alg: LICENCE_SIG_ALG, keyId: cfg.delegation.key.id } };
    /* A desk-only licence has no lead, so its desk is told it works without a team (Max's test of 2026-11-13). */
    if (row.desk_only) cert.deskOnly = true; /* plant:cert-desk-only */
    if (pooled === true) cert.pooled = true; /* plant:cert-pooled */
    if (row.seat_source === "entra") cert.until = Math.min(cert.until, now + ENTRA_PROOF_MS); /* plant:entra-cert-until */
    if (member === true) cert.member = true; /* plant:cert-member */
    if (member === true) cert.until = Math.min(cert.until, now + MEMBER_MS); /* plant:member-life */
    cert.sig.value = await signHex(cfg, Q.seatCertBytes(cert));
    return cert;
  }

  /* WHAT A SEAT IS AND WHEN EACH TRIAL ENDS, for the words a desk and Studio show (design note B-0, point 3): unsigned facts beside the
     answer, never in a certificate, read by no gate. seatOf: `on` the desk's own trial ("trial"), the person's own Studio trial
     ("studio-trial"), a licence they own ("own"), one that admitted them by name ("team", `lead` the name kept of the lead who admitted
     them, where one is kept) or their organisation's ("org"); `ends` the licence's end as kept here, a trial's end or the paid date. */
  async function seatOf(db, row, person) {
    const trial = row.trial_ends !== null && row.trial_ends !== undefined, ends = trial ? row.trial_ends : row.paid_until;
    if (row.desk_only && trial) return { on: "trial", ends }; /* plant:seat-trial */
    if (row.seat_source === "entra") return { on: "org", ends }; /* plant:seat-entra */
    if (row.owner === person) return { on: trial ? "studio-trial" : "own", ends }; /* plant:seat-own */
    if (!(await db.prepare("SELECT 1 AS n FROM admits WHERE licence = ?1 AND org = ?2").bind(row.id, PERSON + person).first())) return { on: "org", ends }; /* plant:seat-named */
    /* The lead: of those who admitted them, one who still leads it (TEAM_LEADS), one who placed them on a team, then the first by key. */
    const lead = await db.prepare("SELECT p.name AS name FROM admitted_by a JOIN licences l ON l.id = a.licence LEFT JOIN persons p ON p.person = a.lead "
      + "WHERE a.licence = ?1 AND a.person = ?2 ORDER BY (a.lead = l.owner OR EXISTS (SELECT 1 FROM lead_names n WHERE n.licence = a.licence AND n.person = a.lead)) DESC, "
      + "(a.team IS NOT NULL) DESC, a.lead LIMIT 1").bind(row.id, person).first();
    return lead && typeof lead.name === "string" ? { on: "team", ends, lead: lead.name } : { on: "team", ends }; /* plant:seat-lead */
  }
  /* What a Studio key's answer adds of trialsOf: {trials} for the person the key is bound through by sign-in, else nothing. */
  const trialsOfKey = async (db, lead) => {
    const b = db ? await db.prepare("SELECT person FROM bindings WHERE lead = ?1").bind(lead).first() : null;
    const trials = b && b.person ? await trialsOf(db, b.person) : undefined;
    return trials ? { trials } : {};
  };
  /* WHAT A BUYER'S OWN PROGRAMS ARE TOLD OF THEIR PAYMENTS (board 1020; pay.mjs buyerFacts): "pays" where a subscription they pay holds a
     licence, with the provider's portal where more seats are bought, and "held" for a payment held naming them or a checkout not yet
     paid; nothing where neither. Beside every sign-in answer for a person, Studio's and the desk's (signin/desk writes them as literal keys,
     pays and held, so the record the engine reads, s110, can read each answer), and Studio's quiet check. */
  const buyerOf = (db, env, person, now) => buyerFacts(db, person, now, { stripe: stripePortal(env) });
  const buyerOfKey = async (db, env, lead, now) => {
    const b = db ? await db.prepare("SELECT person FROM bindings WHERE lead = ?1").bind(lead).first() : null;
    return b && b.person ? buyerOf(db, env, b.person, now) : {};
  };
  /* trialsOf: the end of each trial the person has had, running or ended ({desk, studio}, either absent where never had), read by unit, so
     a trial stays had after its owner's erasure; undefined where neither. */
  async function trialsOf(db, person) {
    const r = await db.prepare("SELECT (SELECT MAX(trial_ends) FROM licences WHERE trial_unit = ?1) AS desk, " /* plant:trials-desk */
      + "(SELECT MAX(trial_ends) FROM licences WHERE trial_unit = ?2) AS studio").bind(DESK_TRIAL + person, PERSON + person).first(); /* plant:trials-studio */
    if (!r || (r.desk === null && r.studio === null)) return undefined;
    return Object.assign({}, r.desk !== null ? { desk: r.desk } : {}, r.studio !== null ? { studio: r.studio } : {});
  }

  /* THE STORE CERTIFICATE (a person's store): the desk key and the person's code, for a day, in the pinned relay's form and judged by its
     storeCertWhy before it leaves; null where the pin has no such form. */
  const STORE_CERT_MS = DAY;
  /* How recently the asking desk must have been seated by its own sign-in: it asks right after each renewal. */
  const STORE_PROOF_MS = HOUR;
  const storeForms = () => typeof rules.storeCertBytes === "function" && typeof rules.storeCertWhy === "function"
    && typeof rules.noticeBytes === "function" && typeof rules.noticeWhy === "function";
  async function storeCertFor(cfg, desk, code, now) {
    if (!storeForms()) return null;
    const until = Math.min(now + STORE_CERT_MS, cfg.delegation.until); /* plant:store-cert-day */
    if (!(until > now)) return null;
    const cert = { kind: "etiuda-store-certificate", format: 1, desk, code, issued: now, until, via: cfg.delegation,
      sig: { alg: LICENCE_SIG_ALG, keyId: cfg.delegation.key.id } };
    cert.sig.value = await signHex(cfg, rules.storeCertBytes(cert));
    const why = rules.storeCertWhy(cert, desk, now, roots);
    if (why !== null) throw new Error("a store certificate the relay would refuse: " + why);
    return cert;
  }
  /* The relay this Worker's stores live on: the staging relay on a staging Worker, else production's. */
  const relayOf = env => (apiPrefixOf(env) !== API ? DOOR_RELAYS_STAGING[0] : DOOR_RELAYS[0]);
  /* THE STORE-END NOTICE, posted to the relay's notice route at once: true where the relay took it, or holds no such store any more. */
  async function postStoreEnd(cfg, env, row, now) {
    const n = { kind: "etiuda-service-notice", format: 1, what: "store-end", rt: row.rt, code: row.code, issued: now, via: cfg.delegation,
      sig: { alg: GRANT_SIG_ALG, keyId: cfg.delegation.key.id, value: "" } };
    n.sig.value = await signHex(cfg, rules.noticeBytes(n));
    if (rules.noticeWhy(n, row.rt, now, roots) !== null) return false;
    try {
      const res = await fetchOut(relayOf(env) + "/t/" + row.rt + "/notice", { method: "POST", redirect: "manual",
        headers: { "content-type": "application/json" }, body: JSON.stringify({ notice: n }) });
      const body = await res.json().catch(() => null);
      return res.status === 200 || (res.status === 403 && !!body && body.error === "not-enrolled"); /* plant:store-end-taken */
    } catch { return false; }
  }
  /* Every live store matching `where` (over the stores table, its values ?1 on) is ended: marked so, then posted; a row the relay took goes. */
  async function endStores(db, cfg, env, where, values, now) {
    if (!storeForms()) return 0;
    const rows = await db.prepare("UPDATE stores SET ended_at = ?" + (values.length + 1) + " WHERE ended_at = 0 AND " + where
      + " RETURNING rt, code").bind(...values, now).all();
    await postEnded(db, cfg, env, rows.results, now);
    return rows.results.length;
  }
  async function postEnded(db, cfg, env, rows, now) {
    for (const row of rows) {
      if (await postStoreEnd(cfg, env, row, now)) await db.prepare("DELETE FROM stores WHERE rt = ?1 AND ended_at > 0").bind(row.rt).run(); /* plant:store-end-post */
    }
  }
  /* A company store's person removed from its licence: the store ends at once (section 14.6). */
  const endCompanyStores = (c, licence, person) => endStores(c.db, c.cfg, c.env, "person = ?1 AND licence = ?2", [person, licence], c.now);

  /* The sign-in refusals, one body each whatever the cause. */
  const badToken = () => answer(403, { ok: false, reason: "token" });
  const noLicence = () => answer(403, { ok: false, reason: "no-licence" });
  const noSeat = () => answer(409, { ok: false, reason: "full" });
  const signinAgain = () => answer(403, { ok: false, reason: "signin" });
  const accessNeeded = () => answer(409, { ok: false, reason: "access-token", managed: true }); /* plant:managed-said */

  /* A TOKEN ANSWERS ONCE: its digest, keyed, is what the replay record keeps of it, until the token expires (takeSeat spends
     it in the batch that takes the seat). */
  async function tokenSpend(cfg, hash, exp) {
    return { digest: await keyedHash(cfg.hmac, KEYED.token, hash), until: exp * 1000 + skew };
  }
  /* A TRUE REFUSAL OF A PROVED PERSON SPENDS THE TOKEN AND WRITES NOTHING ELSE (Claude alpha's decision 32, superseding decision
     15 item 5 for "full" and "desks": a token left unspent stayed replayable): false where another request spent it first. */
  async function spendOnly(db, spend, now) {
    const res = await db.batch([db.prepare("DELETE FROM seen WHERE until < ?1").bind(now),
      db.prepare("INSERT INTO seen (digest, until) VALUES (?1, ?2) ON CONFLICT (digest) DO NOTHING").bind(spend.digest, spend.until)]);
    return res[1].meta.changes === 1;
  }

  /* NO ROLE FOR THIS SEAT on a licence whose seats follow Entra (decision 49, sections 11.8 and 11.9): the person's seat of `kind` there,
     and for a desk their places, freed in the batch that spends the token, and nothing else written: no trial, no person, no held desk.
     False where another request spent the token first. `release`, the licence that follows Entra where the token carries a seat's role
     (an agent's at Studio), releases the person's seats before the turn in the same batch (releaseBefore). */
  const unspent = spend => q => "NOT EXISTS (SELECT 1 FROM seen WHERE digest = " + q(spend.digest) + ")";
  /* THE POOLED DESKS A SIGN-OUT OR AN ENTRA REMOVAL FREES, NAMED TO THE RELAY (option (d); Argon's second review of the sign-in, finding 8):
     the statement recording, at `now`, every pooled place on a licence that follows Entra matching `where` (over desk_keys, its values ?1
     on) and still held, for the batch that frees them, before the statement that zeroes them, as takeSeat records a place taken over. A
     place freed on a licence of the person's own (releaseBefore) needs none: such a licence's grants carry no seats. */
  const freedPooled = (db, where, values, now) => db.prepare("INSERT INTO freed_desks (licence, desk_key, at) SELECT licence, desk_key, ?" + (values.length + 1)
    + " FROM desk_keys WHERE " + where + " AND pooled = 1 AND seen_at > 0 AND licence IN (SELECT id FROM licences WHERE seat_source = 'entra') "
    + "ON CONFLICT (licence, desk_key) DO UPDATE SET at = excluded.at").bind(...values, now);
  async function noRole(db, spend, kind, person, licence, now, release, endedOut) {
    const UNSPENT = " AND NOT EXISTS (SELECT 1 FROM seen WHERE digest = ?3)";
    /* AN ENTRA REMOVAL IS A REMOVAL (decision 50, the erasure's section 13): the seat this frees is stamped removed in the same batch, by
       removalStamp, which never stamps the owner; only where a seat of this kind was held here, and only where the erasure's stamp is on
       this tree (it lands with studio-erase; until then this is today's batch). */
    const held = typeof removalStamp === "function" && !!(await db.prepare("SELECT 1 AS h FROM seats WHERE kind = ?1 AND person = ?2 AND licence = ?3 "
      + "AND proved_at > 0").bind(kind, person, licence).first());
    const storeAt = kind === "desk" && storeForms() ? 4 : -1;
    const res = await db.batch([db.prepare("DELETE FROM seen WHERE until < ?1").bind(now),
      db.prepare("UPDATE seats SET seen_at = 0, proved_at = 0 WHERE kind = ?1 AND person = ?2 AND licence = ?4" + UNSPENT).bind(kind, person, spend.digest, licence), /* plant:no-role-free */
    ].concat(kind === "desk" ? [freedPooled(db, "person = ?1 AND licence = ?2 AND NOT EXISTS (SELECT 1 FROM seen WHERE digest = ?3)", [person, licence, spend.digest], now), /* plant:no-role-freed */
      db.prepare("UPDATE desk_keys SET seen_at = 0 WHERE person = ?2 AND licence = ?1" + UNSPENT).bind(licence, person, spend.digest)] : [])
      .concat(storeAt >= 0 ? [db.prepare("UPDATE stores SET ended_at = ?4 WHERE ended_at = 0 AND person = ?1 AND licence = ?2" + UNSPENT
        + " RETURNING rt, code").bind(person, licence, spend.digest, now)] : []) /* plant:store-no-role */
      .concat(held ? [removalStamp(db, licence, person, kind, now)] : []) /* plant:removal-entra */
      .concat(release ? releaseBefore(person, release, unspent(spend)).map(build => statementOf(db, build)) : []) /* plant:release-no-role */
      .concat([db.prepare("INSERT INTO seen (digest, until) VALUES (?1, ?2) ON CONFLICT (digest) DO NOTHING").bind(spend.digest, spend.until)]));
    const ok = res[res.length - 1].meta.changes === 1;
    if (ok && storeAt >= 0 && endedOut) endedOut.push(...res[storeAt].results);
    return ok;
  }
  /* A LEAD SEAT ON A LICENCE WHOSE SEATS FOLLOW ENTRA, for signin (renew false) and signin/renew: the token's roles hold Etiuda.Lead, or
     no seat ("no-role"); the owner is seated by its role as anyone is and acts as no owner there. A key a purchase key bound to another
     licence is taken over, as signin takes one over (stage 4; Argon's second review of the sign-in, finding 5C: the refusal it answered
     before, boundElsewhere, went with the front door and threw here). Proved, seated and spent as a lead on any licence is. */
  async function entraLead(c, b, s, j, tokenHash, ent, renew, roles) {
    const spend = await tokenSpend(c.cfg, tokenHash, j.exp);
    const own = await ownBefore(c.db, s.person, ent, true), cause = causeOf(own, roles), mine = !seatRoleOf(roles) && !!own; /* plant:own-lead */
    const release = seatRoleOf(roles) ? ent : null; /* plant:release-before */
    /* Beside the refusal, that the tenant is managed, why, and that the token holds the Administrator's role, for Studio's view. */
    if (!mine && (!roles || !roles.has(ROLE.lead))) return await noRole(c.db, spend, "lead", s.person, ent.id, c.now, release) /* plant:entra-lead-role */
      ? answer(403, Object.assign({ ok: false, reason: "no-role", managed: true }, cause ? { cause } : {}, roles && roles.has(ROLE.admin) ? { admin: true } : {})) : badToken();
    const row = mine ? own : ent;
    const got = await takeSeat(c.db, Object.assign({ kind: "lead" }, s), row.id, c.now, Object.assign({ proved: true, renew: !!renew, window: windowOf(row), release }, spend));
    if (!got.ok) return got.spent ? badToken() : renew && (got.displaced /* plant:seat-stay-entra-lead-refusal */ || (got.row && !(got.row.proved_at > 0))) ? signinAgain()
      : await spendOnly(c.db, spend, c.now) ? noSeat() : badToken();
    await bindPerson(c.db, b.lead, s.person, row.id, c.now);
    if (mine) await unmarkOwn(c.db, s.person);
    /* A lead seat on the licence that follows Entra carries its certificates (option (b)); one on a licence of the person's own is an
       ordinary licence's seat, so it carries the member certificate alone, as any ordinary lead's (memberCertificate), and none for the
       signing key. */
    const member = await memberCertificate(c.db, c.cfg, row, b, s.person, got.row.code, c.now, !renew); /* plant:member-entra */
    const certificates = mine ? (member ? { member } : undefined) /* plant:member-mine */
      : leadCertificates(await certificateFor(c.cfg, row, b.lead, s.person, got.row.code, c.now), member); /* plant:lead-cert */
    /* The Studio's own certificate beside them: the lead certificate where the licence follows Entra, else one of its own. */
    const studio = mine ? await studioCertificate(c, row, b.lead, s.person, got.row.code) : certificates.lead;
    const certs = studio || certificates ? Object.assign({}, certificates || {}, studio ? { studio } : {}) : undefined;
    return signedIn(c.cfg, row, b.lead, c.now, Object.assign({ me: got.row.code, owner: mine && row.owner === s.person, managed: true }, certs ? { certificates: certs } : {},
      cause ? { cause } : {}, roles && roles.has(ROLE.admin) ? { admin: true } : {}), c.db, c.env);
  }
  /* A LEAD SEAT'S CERTIFICATES on a licence whose seats follow Entra (Claude alpha's ruling of 20:47 on C1: "a Studio is judged as a desk
     is, by its person"): the seat certificate a desk's is, named for the Studio's signing key, which its own team's relay session
     carries, unmarked and running the window from this proof, and the member certificate memberCertificate gives, where it gives one. */
  const leadCertificates = (lead, member) => Object.assign({ lead }, member ? { member } : {}); /* plant:member-cert */
  /* THE STUDIO'S OWN SEAT CERTIFICATE (review xi; Max, 2026-11-22 15:37: Studio's gate rests on the sign-in's seat certificate alone): on
     every lead sign-in and renewal while the licence or trial runs, the certificate a desk's is, named for the Studio's signing key, unmarked,
     ending at the earliest of PROOF_DAYS ahead, the paid date and a trial's end; Studio works on it (src/desk-seat.mjs checkOwnSeat). On a
     licence that follows Entra the lead certificate is that one. Handed beside the member certificate, never in its place. */
  const studioCertificate = async (c, row, lead, person, code) => (running(row, c.now) ? certificateFor(c.cfg, row, lead, person, code, c.now) : undefined); /* plant:studio-cert */
  const leadAnswerCerts = (studio, member) => (studio || member ? { certificates: Object.assign({}, studio ? { studio } : {}, member ? { member } : {}) } : {});
  /* A LEAD SEAT'S MEMBER CERTIFICATE on every licence and trial (design note C-0, point 2), marked and bounded as the addendum on the member
     certificate decided (Claude alpha, 2026-11-17): where the signed request names a member key, the marked certificate of the key standing
     for this Studio key and person (member_keys), while the row runs; undefined where none is answered. Only an interactive sign-in sets or
     changes the standing key, a change at most once in MEMBER_CHANGE_DAYS; a quiet renewal answers the standing key whatever it names; no
     key is added or renewed past the person's MEMBER_LIVE_MAX live keys, counted from member_keys and never from bindings. Each write is
     conditional on what was read, so two racing requests never make a fourth. */
  const MEMBER_LIVE = "(SELECT COALESCE(SUM(until > ?3), 0) + COALESCE(SUM(was_until > ?3), 0) FROM member_keys WHERE person = ?2 AND lead <> ?1)"; /* plant:member-cap-rows */
  async function memberCertificate(db, cfg, row, b, person, code, now, interactive) {
    if (b.member === undefined /* plant:member-named */ || !running(row, now) /* plant:member-running */) return undefined;
    const kept = await db.prepare("SELECT member, set_at, until, was_until FROM member_keys WHERE lead = ?1 AND person = ?2").bind(b.lead, person).first();
    const live = (await db.prepare("SELECT " + MEMBER_LIVE + " AS n").bind(b.lead, person, now).first()).n;
    const room = n => live + n <= MEMBER_LIVE_MAX;
    let key, write;
    if (!kept) {
      if (!interactive /* plant:member-renew-sets */ || !room(1)) return undefined;
      key = b.member;
      write = until => db.prepare("INSERT INTO member_keys (lead, person, member, set_at, until, was_until) SELECT ?1, ?2, ?4, ?3, ?5, 0 WHERE "
        + MEMBER_LIVE + " + 1 <= ?6 ON CONFLICT (lead, person) DO NOTHING").bind(b.lead, person, now, key, until, MEMBER_LIVE_MAX);
    } else if (kept.member !== b.member && interactive /* plant:member-renew-changes */ && now >= kept.set_at + MEMBER_CHANGE_MS /* plant:member-span */
      && room(kept.until > now ? 2 : 1)) {
      key = b.member;
      write = until => db.prepare("UPDATE member_keys SET member = ?4, set_at = ?3, was_until = until, until = ?5 WHERE lead = ?1 AND person = ?2 "
        + "AND member = ?7 AND set_at = ?8 AND " + MEMBER_LIVE + " + (until > ?3) + 1 <= ?6").bind(b.lead, person, now, key, until, MEMBER_LIVE_MAX, kept.member, kept.set_at);
    } else {
      if (!(kept.until > now) && !room(kept.was_until > now ? 2 : 1)) return undefined;
      key = kept.member;
      write = until => db.prepare("UPDATE member_keys SET until = MAX(until, ?5) WHERE lead = ?1 AND person = ?2 AND member = ?4 AND set_at = ?7 "
        + "AND (until > ?3 OR " + MEMBER_LIVE + " + (was_until > ?3) + 1 <= ?6)").bind(b.lead, person, now, key, until, MEMBER_LIVE_MAX, kept.set_at);
    }
    const cert = await certificateFor(cfg, row, key, person, code, now, false, true);
    return (await write(cert.until).run()).meta.changes === 1 ? cert : undefined;
  }
  /* A KEY WHOSE LICENCE FOLLOWS ENTRA (section 11.4): bound to one, by its role's seat or by the attach that moved its owner's keys. Who
     holds a seat there is Entra's, so its person, list and seat acts answer "managed" and change nothing. */
  const managedKey = async (db, lead) => !!(await db.prepare("SELECT 1 AS m FROM bindings b JOIN licences l ON l.id = b.licence "
    + "WHERE b.lead = ?1 AND l.seat_source = 'entra'").bind(lead).first());
  const managed = () => answer(403, { ok: false, reason: "managed" });

  /* WHO A TOKEN NAMES, as kept: the person (keyed (iss, sub)), Entra's tid and oid keyed, and the organisation as admits
     holds it, keyed, a personal account being its own. */
  async function personOf(cfg, j) {
    const person = await keyedHash(cfg.hmac, KEYED.person, j.iss + "\n" + j.sub);
    const org = j.personal ? PERSON + person : await orgKeyed(cfg.hmac, j.provider.id, j.org);
    return { person, org, provider: j.provider.id, personal: j.personal,
      tid: j.tid ? await keyedHash(cfg.hmac, KEYED.tid, j.tid.toLowerCase()) : null,
      oid: j.oid ? await keyedHash(cfg.hmac, KEYED.oid, j.oid.toLowerCase()) : null };
  }
  /* What a key holds now: a licence it is bound to by sign-in, or nothing (and whether its person's later keys released it).
     A key a purchase key or address bound, or one holding a trial by code, holds "signin": only signing in keeps a seat now,
     and its licence file stays as it is. Read only: the quiet check marks the key seen itself, once it is not refused. */
  async function holdingOf(db, lead) {
    const bound = await db.prepare("SELECT licence, person FROM bindings WHERE lead = ?1").bind(lead).first();
    if (bound) {
      if (bound.person === null || bound.person === undefined) return { kind: "signin" }; /* plant:s4-key-bound */
      const row = await db.prepare("SELECT " + LICENCE_COLUMNS + " FROM licences WHERE id = ?1").bind(bound.licence).first();
      if (row) return holdingOfRow(row);
    }
    if (await db.prepare("SELECT 1 AS t FROM trials WHERE lead = ?1").bind(lead).first()) return { kind: "signin" }; /* plant:s4-code-trial */
    const rel = await db.prepare("SELECT 1 AS r FROM releases WHERE lead = ?1 LIMIT 1").bind(lead).first();
    return { kind: "none", released: !!rel };
  }

  /* THE LICENCE THAT ADMITS A DESK'S PERSON, the service's choice and never the desk's (the interface of 2026-11-12): of the
     licences not refunded and running now (paid until later, or a trial not ended), one admitting the person by name ("person:",
     as a lead admits by code, and as a trial admits its owner), or their organisation's where its owner's switch seats colleagues
     (org_desks), or else a desk-only licence the person owns: a paid one before a trial, then by name before by organisation (a
     team is its lead's own: a colleague a second buyer admitted sits on that buyer's licence), then the latest paid date, then the
     newest. Null for none.
     ONE WITH A DESK SEAT FREE FOR THEM FIRST (Argon's second review of the sign-in, finding 9B; review of 2026-11-17, finding 10):
     among team licences and any paid desk-only licence, one where fewer others hold a desk seat than it has, counted as takeSeat counts
     them, comes before one with none, so a full licence never leaves a desk waiting behind it when another team licence or the person's
     own paid desk-only licence has room; among licences with room, team licences still precede desk-only; a desk-only trial stays the
     fallback after every team's (s54a), and with no room anywhere the order above picks the wait (decision 32), save where
     ownTrialFirst (below) gives the choice to the person's own desk trial.
     THE PERSON'S OWN PAID LICENCE BEFORE A TRIAL OF THEIR OWN (Claude alpha's decision of 2026-11-17, Max's to overturn: "a person who bought
     reads 'a seat on your licence, paid until', never 'trial'; the trial's clock runs on unseen"): among licences with room, the person's own
     Studio trial comes after every other, so a desk-only licence they bought is chosen before it, and so never gives way to their desk trial.
     A QUIET RENEWAL STAYS WHERE IT IS (review 11's finding 2 (a); review 47's finding 2, Claude alpha's ruling, his and Max's to overturn: "a
     quiet renewal never changes which licence seats a person while that licence runs and still seats them; this is mend 1's principle made
     whole, for an owner as for a member, whatever code was given"): with `renew`, the licence the person's desk seat is on, not freed, comes
     before everything above while it runs and still admits them, whatever it is: a paid team or desk-only licence, their own Studio trial
     bare or not, another owner's team trial; so another person's act (an admission by code elsewhere) moves nobody's desk without their own
     fresh sign-in, which reads the order above alone. THE ONE EXCEPTION (Claude alpha, about 14:30 on 2026-11-18, his C1: "at a quiet renewal a
     person's OWN DESK TRIAL alone gives way to a running licence that admits them; every other running licence holds"): the desk's own
     trial is the stop-gap of a full licence and of a purchase, so a renewal on it reads the order above (TW8, Q14's newcomer, s77d).
     AND THE PERSON'S OWN PURCHASE OUTRANKS THEIR OWN TRIAL (review 48's finding 10, Claude alpha's words: "the regression from 7166b357: a
     person's own running paid licence outranks their own trial"): where their desk seat is on a trial of their own, Studio's or the desk's, a
     running paid licence they own with a seat free for them comes before it at a renewal too, buying being their own act.
     ONLY A SEAT THAT STILL HOLDS PINS (review 48's finding 11, Claude alpha's words: "pin only a seat inside its grace and proof"): the
     licence holds a renewal only where the seat on it was seen within its grace and proved within PROOF_MS, as takeSeat counts a seat; one
     lapsed past them holds nothing there, and the renewal reads the order above (the licence is never Entra's here). */
  /* A DESK SEAT FREE FOR THE PERSON (?5) on the row `licences` at ?1: fewer others hold one than its seats in force, counted as takeSeat counts
     them (seen within the grace, ?6 a day, and proved within PROOF_MS, ?7). */
  const DESK_ROOM = "((SELECT COUNT(*) FROM seats o WHERE o.licence = licences.id AND o.kind = 'desk' AND o.person <> ?5 AND o.seen_at > ?1 - licences.grace_days * ?6 "
      + "AND o.proved_at > ?1 - ?7) < " + inForceCol("seats", "licences.id", "?1", "licences") + ")"; /* plant:desk-room-in-force */
  /* THE LICENCE WHOSE DESK SEAT THE PERSON KEEPS IN A REDUCTION (the test architect's read of 7e15261b, class B): where in-force seats are below
     the seated, DESK_ROOM is false for every desk, the one the staying rule keeps included, and a sign-in would answer that person with a trial of
     their own or a wait. Their seat's licence where they are seated on it now and the rule names them, else null. Read apart because the rule's
     LIMIT cannot be correlated with deskLicence's rows; the licence id the rule is asked about is the seat's own. Asked only where that licence has
     no desk seat free for them (DESK_ROOM false: seated beyond its seats in force, a reduction), so every other sign-in reads nothing more. */
  async function keptDeskLicence(db, person, now) {
    const held = await db.prepare("SELECT licences.id AS licence FROM seats s JOIN licences ON licences.id = s.licence WHERE s.kind = 'desk' AND s.person = ?5 "
      + "AND s.proved_at > ?1 - ?7 AND NOT " + DESK_ROOM).bind(now, null, null, null, person, DAY, PROOF_MS).first();
    if (!held) return null;
    const r = await db.prepare("SELECT ?1 IN (" + stayingPersons("?2", "'desk'", "?3", "(?3 - ?4)") + ") AS kept").bind(person, held.licence, now, PROOF_MS).first();
    return r && r.kept === 1 ? held.licence : null;
  }
  async function deskLicence(db, s, now, renew) {
    const kept = await keptDeskLicence(db, s.person, now);
    const named = "(desk_only = 0 AND id IN (SELECT licence FROM admits WHERE provider = ?2 AND org = ?3))"; /* plant:desk-named */
    const byOrg = "(desk_only = 0 AND org_desks = 1 AND id IN (SELECT licence FROM admits WHERE provider = ?2 AND org = ?4))"; /* plant:desk-org */
    const own = "(desk_only = 1 AND owner = ?5)"; /* plant:desk-only-owner */
    const room = "(" + DESK_ROOM + " OR licences.id IS ?9)"; /* plant:seat-stay-signin-room-desk */
    const row = await db.prepare("SELECT " + LICENCE_COLUMNS + ", " + room + " AS room FROM licences WHERE refunded = 0 AND ((trial_ends IS NULL AND paid_until > ?1) OR trial_ends > ?1) "
      + "AND seat_source = 'admit' " /* plant:desk-admit-only */
      + "AND (" + named + " OR " + byOrg + " OR " + own + ") "
      + "ORDER BY (?8 = 1 AND trial_ends IS NULL AND IFNULL(owner = ?5, 0) AND " + room + " AND EXISTS (SELECT 1 FROM seats s0 JOIN licences t0 ON t0.id = s0.licence "
      + "WHERE s0.kind = 'desk' AND s0.person = ?5 AND s0.proved_at > 0 AND t0.owner = ?5 AND t0.trial_ends IS NOT NULL)) DESC, " /* plant:desk-own-paid-over-trial */
      + "(?8 = 1 AND NOT (desk_only = 1 AND trial_ends IS NOT NULL) " /* plant:desk-renew-holds */
      + "AND id IN (SELECT licence FROM seats WHERE kind = 'desk' AND person = ?5 AND proved_at > 0 "
      + "AND proved_at > ?1 - ?7 AND seen_at > ?1 - licences.grace_days * ?6)) DESC, " /* plant:desk-renew-stays */ /* plant:desk-renew-window */
      + "((desk_only = 0 AND NOT (trial_ends IS NOT NULL AND owner = ?5) OR trial_ends IS NULL) AND " + room + ") DESC, " /* plant:desk-room-first */
      + "(?8 = 1 AND desk_only = 1 AND trial_ends IS NOT NULL AND owner = ?5 AND id IN (SELECT licence FROM seats WHERE kind = 'desk' AND person = ?5 AND proved_at > 0)) DESC, " /* plant:desk-renew-stays-trial */
      + "(desk_only = 0 AND trial_ends IS NOT NULL AND owner = ?5 AND " + room + ") DESC, "
      + "(desk_only = 0 AND trial_ends IS NOT NULL AND owner = ?5) ASC, desk_only ASC, " /* plant:desk-own-paid-first */
      + "(trial_ends IS NULL) DESC, " + named + " DESC, paid_until DESC, id DESC LIMIT 1") /* plant:desk-named-first */
      .bind(now, s.provider, PERSON + s.person, s.org, s.person, DAY, PROOF_MS, renew ? 1 : 0, kept).first();
    return !renew && row && ownTrialFirst(row, s.person) ? (await ownDeskTrial(db, s.person, now)) || row : row; /* plant:desk-renew-no-trial */
  }
  /* THE DESK'S OWN TRIAL FIRST, one decision, for the licence a desk's sign-in chose: the person's own Studio trial (Max, 13:24: the desk shows
     Studio's trial covering it only past its own fourteen days), or any licence with no desk seat free for them (DESK_ROOM), whatever admits
     them (Claude alpha's decisions of 2026-11-17, Max's to overturn: "a newcomer whose organisation's licence is full works on their own fourteen
     days", then "by organisation or by name alike"). Such a choice gives way to their own desk trial while it runs, and a fresh sign-in starts
     that trial once; a person whose desk trial is used up waits. The desk's own trial is never such a choice. */
  const isTrial = row => row.trial_ends !== null && row.trial_ends !== undefined;
  const ownTrialFirst = (row, person) => (row.desk_only === 0 && isTrial(row) && row.owner === person) /* plant:desk-trial-before-studio */
    || (row.room === 0 && !(row.desk_only === 1 && isTrial(row))); /* plant:desk-trial-when-full */
  const ownDeskTrial = (db, person, now) => db.prepare("SELECT " + LICENCE_COLUMNS + " FROM licences WHERE desk_only = 1 AND owner = ?1 AND refunded = 0 "
    + "AND trial_ends > ?2 LIMIT 1").bind(person, now).first(); /* plant:own-desk-trial-running */

  /* A LEAD SEAT THAT STILL HOLDS (Argon's second review of the sign-in, finding 11): the lead seat `s` on licence `l` seen within the licence's
     grace, or with room for it there, counted as takeSeat counts (others seen within the grace and proved within the window), or its
     person's owning the licence, whose seat always finds room. A seat that does not, the quiet check answers as a released key's (s44d), so
     the grant fetch, a lead's acts and the doors handed give it nothing either. The placeholders name now, a day, and the two windows'
     starts (PROOF_DAYS', ENTRA_PROOF_DAYS'). */
  const leadHolds = (s, NOW, D, FRESH, FRESH_ENTRA) => "(" + s + ".seen_at > " + NOW + " - l.grace_days * " + D + " OR (l.owner = " + s + ".person AND l.desk_only = 0 AND " + inForceCol("lead_seats", "l.id", NOW, "l") + " >= 1) "
    + "OR (SELECT COUNT(*) FROM seats o WHERE o.licence = " + s + ".licence AND o.kind = 'lead' AND o.person <> " + s + ".person AND o.seen_at > " + NOW
    + " - l.grace_days * " + D + " AND o.proved_at > (CASE l.seat_source WHEN 'entra' THEN " + FRESH_ENTRA + " ELSE " + FRESH + " END)) < " + inForceCol("lead_seats", "l.id", NOW, "l") + " * (1 - l.desk_only))"; /* plant:lead-holds-in-force */

  /* THE LICENCE A KEY LEADS, for person/admit, person/withdraw, person/list, seat/list, seat/free and seat/stay: a key bound by sign-in through a person
     with a lead seat on it proved within PROOF_DAYS, the licence not refunded; `owner` says whether that person owns it. The
     owner is held to the same seat, so an owner freed, lapsed or gone from the provider acts on nothing. Null for any other key. */
  const leadOf = (db, lead, now) => db.prepare("SELECT b.licence AS licence, b.person AS person, (l.owner = b.person AND l.seat_source = 'admit') AS owner "
    + "FROM bindings b JOIN licences l ON l.id = b.licence WHERE b.lead = ?1 "
    /* A LICENCE NO LONGER RUNNING IS LED BY NOBODY (review 48's finding 2, Claude alpha's words: "lead/name and leadOf require a running
       licence"): paid past now, grace included, or a trial not ended; so no lead act, a naming above all, is taken on one that has ended. */
    + "AND ((l.trial_ends IS NULL AND l.paid_until > ?4) OR l.trial_ends > ?4) " /* plant:lead-of-running */
    + "AND b.person IS NOT NULL AND l.refunded = 0 AND EXISTS (SELECT 1 FROM seats s WHERE s.kind = 'lead' " /* plant:lead-owner */
    + "AND s.person = b.person AND s.licence = b.licence AND s.proved_at > ?2) " /* plant:admit-lead */
    + "AND EXISTS (SELECT 1 FROM seats h WHERE h.kind = 'lead' AND h.person = b.person AND h.licence = b.licence AND " + leadHolds("h", "?4", "?5", "?2", "?3") + ") " /* plant:lead-holds */
    + "AND (l.seat_source = 'admit' OR EXISTS (SELECT 1 FROM seats e WHERE e.kind = 'lead' AND e.person = b.person AND e.licence = b.licence AND e.proved_at > ?3)) " /* plant:entra-lead-of */
    + "AND (l.seat_source = 'entra' OR l.owner = b.person OR EXISTS (SELECT 1 FROM lead_names n WHERE n.licence = b.licence AND n.person = b.person))") /* plant:lead-of-named */
    .bind(lead, now - PROOF_MS, now - ENTRA_PROOF_MS, now, DAY).first();

  /* WHO FREES A DESK SEAT (board 1000; decision 46, Claude alpha's, under Max's delegation of 2026-11-13 14:56), held by both of
     seat/free's desk statements, ?1 the person, ?2 the licence, ?3 the asker's person: the licence's owner frees any; another lead
     only a person it admitted by code (admitted_by, decision 27 (a)), and only while no organisation the licence admits seats them
     (the seat's org a tenant or domain in admits, never the person's own "person:" row), else a co-lead could list, admit and free
     another team's member (Claude alpha's ruling of 15:33). An admission kept from before 0007 has no lead beside it and is the
     owner's to free. NEVER THE OWNER, NOR ANOTHER LEAD'S PERSON (Argon's third review of the sign-in service, finding 1; Claude alpha's
     decision, the owner's to overturn: "FREES_DESK never covers the owner or another lead's admission"): person/admit writes an
     admission for any person whose code a lead holds, the licence's owner's included (seat/list hands it), so the admission is no
     proof the person is the asker's; a lead who does not own the licence frees neither the owner nor a person a standing lead
     (the owner, or one the owner named, still holding a lead seat; as person/withdraw reads `other`) admitted too. */
  const FREES_DESK = "EXISTS (SELECT 1 FROM seats s WHERE s.kind = 'desk' AND s.person = ?1 AND s.licence = ?2 AND ("
    + "EXISTS (SELECT 1 FROM licences WHERE id = ?2 AND owner = ?3) OR (EXISTS (SELECT 1 FROM admitted_by " /* plant:free-admitter */
    + "WHERE licence = ?2 AND person = ?1 AND lead = ?3) AND NOT EXISTS (SELECT 1 FROM licences WHERE id = ?2 AND owner = ?1) " /* plant:free-not-owner */
    + "AND NOT EXISTS (SELECT 1 FROM admitted_by x WHERE x.licence = ?2 AND x.person = ?1 AND x.lead <> ?3 " /* plant:free-not-other-lead */
    + "AND EXISTS (SELECT 1 FROM seats sl WHERE sl.kind = 'lead' AND sl.person = x.lead AND sl.licence = x.licence AND sl.proved_at > 0) " /* plant:free-other-standing */
    + "AND (x.lead = (SELECT owner FROM licences WHERE id = ?2) OR EXISTS (SELECT 1 FROM lead_names n WHERE n.licence = ?2 AND n.person = x.lead))) "
    + "AND NOT EXISTS (SELECT 1 FROM admits a WHERE a.licence = ?2 "
    + "AND a.provider = s.provider AND a.org = s.org AND a.org <> '" + PERSON + "' || ?1))))"; /* plant:free-org */

  /* A DESK KEY NOBODY ELSE HOLDS A PLACE ON (the test architect's F3 on c69b8aac, as the erasure's nobodyElse): over a desk_keys row, no other
     person's row for the same key on the same licence still placed (seen_at > 0); a key two people share is not written freed for one of them. */
  const NOBODY_ELSE_ON_KEY = "NOT EXISTS (SELECT 1 FROM desk_keys o WHERE o.licence = desk_keys.licence AND o.desk_key = desk_keys.desk_key "
    + "AND o.person <> desk_keys.person AND o.seen_at > 0)";
  /* A PERSON'S TEAMS on licence ?1 (a team is its lead's own): the leads who admitted person ?4 by name and still lead, the owner or
     one the owner named; a person none of them admitted, seated by the organisation, is the owner's. `l` is the licence's row. */
  const TEAM_LEADS = "SELECT a.lead FROM admitted_by a WHERE a.licence = ?1 AND a.person = ?4 AND (a.lead = l.owner "
    + "OR EXISTS (SELECT 1 FROM lead_names n WHERE n.licence = ?1 AND n.person = a.lead))";

  /* THE DOORS A CERTIFIED DESK IS HANDED (the door-finding): those on the licence `licence` whose lead key still leads it now, by
     leadOf's own conditions read at the handing (bound by sign-in through a person with a lead seat on it proved within PROOF_DAYS,
     the licence not refunded), so a lead freed, lapsed or gone hands nothing and no row need be cleaned for it; at most
     DOORS_HANDED, ONE LEAD'S AT A TIME (Argon's review of the sign-in service, finding 3: "the sixteen newest" let one co-lead's
     sixteen crowd out every other lead's): each lead key's newest door first, then each one's second newest, and so on, the
     newest first within a round. A row a lead set on a licence its key no longer leads is not handed either. A desk is handed only
     its own team's doors (TEAM_LEADS) and its own person's, so two teams on one licence never meet. On a licence whose seats follow
     Entra, where no admission is read, a desk is handed its own person's doors alone, and a lead's stand while its role's seat does. */
  async function doorsOf(db, licence, person, now) {
    const rows = await db.prepare("SELECT team, rt, url, keyId, lead, box FROM (SELECT d.team AS team, d.rt AS rt, d.url AS url, "
      + "d.key_id AS keyId, d.lead AS lead, d.box AS box, d.at AS at, "
      + "ROW_NUMBER() OVER (PARTITION BY d.lead ORDER BY d.at DESC, d.team) AS round " /* plant:door-hand-fair */
      + "FROM doors d JOIN bindings b ON b.lead = d.lead AND b.licence = d.licence JOIN licences l ON l.id = d.licence "
      + "WHERE d.licence = ?1 " /* plant:door-hand-licence */
      + "AND b.person IS NOT NULL AND l.refunded = 0 AND EXISTS (SELECT 1 FROM seats s WHERE s.kind = 'lead' AND s.person = b.person "
      + "AND s.licence = b.licence AND s.proved_at > ?2) " /* plant:door-hand-lead */
      + "AND EXISTS (SELECT 1 FROM seats h WHERE h.kind = 'lead' AND h.person = b.person AND h.licence = b.licence AND " + leadHolds("h", "?6", "?7", "?2", "?5") + ") " /* plant:door-hand-holds */
      + "AND (l.seat_source = 'admit' OR EXISTS (SELECT 1 FROM seats e WHERE e.kind = 'lead' AND e.person = b.person AND e.licence = b.licence AND e.proved_at > ?5)) "
      + "AND (l.seat_source = 'entra' OR l.owner = b.person OR EXISTS (SELECT 1 FROM lead_names n WHERE n.licence = d.licence AND n.person = b.person)) "
      + "AND (b.person = ?4 OR (l.seat_source = 'admit' AND (b.person IN (" + TEAM_LEADS + ") OR (b.person = l.owner AND NOT EXISTS (" + TEAM_LEADS + "))))) " /* plant:door-team */
      + ") ORDER BY round, at DESC, team, lead LIMIT ?3").bind(licence, now - PROOF_MS, DOORS_HANDED, person, now - ENTRA_PROOF_MS, now, DAY).all();
    return rows.results.map(r => ({ team: r.team, rt: r.rt, url: r.url, keyId: r.keyId, lead: r.lead, box: r.box }));
  }

  /* ---- the one act: asks, invitations, and the leads a newcomer is shown (part S2) -------------------------------------------- */

  /* NOBODY IS MOVED BY ANOTHER PERSON'S ACT ALONE (Claude alpha's criterion of 2026-11-17, his words, labelled by him as his and the owner's to
     overturn: "NOBODY IS MOVED OFF A LICENCE THEY OWN, OR LOSES A SEAT OR A TEAM THEY HOLD, BY ANOTHER PERSON'S ACT ALONE. Being named, invited
     or accepted elsewhere takes effect at once only for a person who holds nothing; where they already own a licence or hold a seat or a team,
     it waits for that person's own press [...], and an invitation from an organisation the person's licence does not admit never moves an owner
     at all"). A STATED EXCEPTION (Claude alpha, 2026-11-17 13:17, his words): "a person whose only holding is a trial of their own (no paid
     licence, no seat and no team elsewhere) is moved by a naming at their own Studio's next check; anyone else is not". A trial of their own
     and nothing else means, in his words of 13:21, "a trial on which the person has admitted NO desk but their own and made no team"; one
     with a colleague's desk or a team waits. His reason: "the person gave their code to the owner, which is their act, and a bare trial
     holds nothing they could lose." It stands until Studio has a press for a naming, which replaces it. The move never writes the trial's
     end; a person freed later returns to what is left of it. WHAT A PERSON HOLDS BESIDE licence L, as a subquery of one column, tok, one row per thing: a seat of either kind not freed on
     another licence ("seat:<kind>:<id>"), the ownership of another licence not refunded, a trial of their own included ("own:<id>"), a team
     anywhere but `lead`'s on L ("team:<id>:<lead>"), and a naming on another licence ("lead:<id>"). An ask keeps what this held when its person
     pressed (asks.held), which pressing agreed to leave; an Accept takes effect at once only where nothing outside it is held now. `L` and
     `lead` are SQL text (a q() or a column). */
  const holdLive = (q, col, now) => (now === undefined ? "1" : "EXISTS (SELECT 1 FROM licences hl WHERE hl.id = " + col + " AND hl.refunded = 0 AND ((hl.trial_ends IS NULL AND hl.paid_until > " + q(now) + ") OR hl.trial_ends > " + q(now) + "))"); /* plant:holdings-running */
  /* `but`, where given, is SQL text naming licence ids left out of the seat and ownership tokens (signin/desk's taken invitation, below). */
  const holdings = (q, P, L, lead, now, but) => "SELECT 'seat:' || kind || ':' || licence AS tok FROM seats WHERE person = " + q(P) + " AND proved_at > 0 AND licence <> " + L /* plant:holds-seat */
    + " AND " + holdLive(q, "seats.licence", now) + (but ? " AND licence NOT IN (" + but + ")" : "")
    + " UNION SELECT 'own:' || id FROM licences WHERE owner = " + q(P) + " AND refunded = 0 AND id <> " + L /* plant:holds-own */
    + " AND " + holdLive(q, "licences.id", now) + (but ? " AND id NOT IN (" + but + ")" : "")
    + " UNION SELECT 'team:' || licence || ':' || lead FROM admitted_by WHERE person = " + q(P) + " AND NOT (licence = " + L + " AND lead = " + lead + ")" /* plant:holds-team */
    + " AND " + holdLive(q, "admitted_by.licence", now)
    + " UNION SELECT 'lead:' || licence FROM lead_names WHERE person = " + q(P) + " AND licence <> " + L
    + " AND " + holdLive(q, "lead_names.licence", now);
  /* AN OWNER'S BAR (the same criterion: "an invitation from an organisation the person's licence does not admit never moves an owner at all"):
     where P owns a paid licence not refunded, licence L (SQL text) must admit an organisation, never a person, that one of P's paid licences
     admits too; otherwise the invitation is offered to nobody and taken by no press. A trial is no paid licence, and A PAID LICENCE NO LONGER
     RUNNING IS NONE (review 47's finding 14, Claude alpha's words: "an expired own paid licence bars no invitation: one clause, as mend 9 did
     for holdings"): both clauses read only P's paid licences whose paid time, grace included, runs past `now` (ms). */
  const ownerBars = (q, P, L, now) => "(EXISTS (SELECT 1 FROM licences o WHERE o.owner = " + q(P) + " AND o.refunded = 0 AND o.trial_ends IS NULL AND o.id <> " + L
    + " AND o.paid_until > " + q(now) + ") " /* plant:owner-bars-running */
    + "AND NOT EXISTS (SELECT 1 FROM admits a JOIN admits b ON b.provider = a.provider AND b.org = a.org JOIN licences o ON o.id = b.licence "
    + "WHERE a.licence = " + L + " AND substr(a.org, 1, " + q(PERSON.length) + ") <> " + q(PERSON) + " AND o.owner = " + q(P)
    + " AND o.refunded = 0 AND o.trial_ends IS NULL AND o.paid_until > " + q(now) + " AND o.id <> " + L + "))"; /* plant:owner-bars */
  /* THE SAFEGUARD: an invitation by address is taken by the person's own press only where their provider vouches the address (`who.vouched`);
     any other Join waits for the lead's Confirm. ONE RULE, NO BRANCHES (Claude alpha's rule on B2 of 2026-11-22, carried by Claudius: "A Join
     by an unvouched address waits for the lead's Confirm like any unvouched one, with no exception for an admitted organisation and no domain
     matching. Being inside an admitted tenant isn't the provider vouching the address, and one rule with no branches stays right when a tenant
     has several domains."): the organisation exception of the ruling of 2026-11-16 22:15 is gone; an organisation's own vouched accounts are
     taken as before. `q` and licence L (SQL text) are kept in the signature its callers share. */
  const inviteSafe = (q, who, L) => "(" + (who.vouched ? "1" : "0") /* plant:invite-vouched */ + ")";
  /* An invitation one may take: the safeguard holds and no owner's bar refuses it. */
  const inviteTakes = (q, who, L, now) => inviteSafe(q, who, L) + " AND NOT " + ownerBars(q, who.person, L, now);
  /* A LICENCE ONE MAY ASK OR JOIN: running and paid, not refunded, not desk-only, its seats not following Entra; `l` its alias. */
  const JOINABLE = (q, now) => "l.refunded = 0 AND l.desk_only = 0 AND l.seat_source = 'admit' AND l.trial_ends IS NULL AND l.paid_until > " + q(now);

  /* WHO ASKS: the person behind a signed-in desk key (person_desks, not signed out; the latest where two people share a computer) or a Studio
     key bound by sign-in, with their provider, the organisation they signed in from (keyed; null for a personal account), and the address
     and vouched mark the service keeps of them (identOf). Null for any other key. */
  /* SIGNED IN NOW (the test architect's E2 on S2: the press moves a seat): a proof within PROOF_DAYS, the person's last for a desk key
     (persons.signed_at, which every sign-in and proof writes), the lead seat's for a Studio key, as leadOf asks of a lead. */
  /* The address comes back as an invitation keeps it (addressKeyed, board 1017's rule 5), so every comparison below is of keyed hashes. */
  async function askerOf(db, cfg, kind, key, now) {
    const r = kind === "desk"
      ? await db.prepare("SELECT d.person AS person, d.org AS org, p.provider AS provider, p.address AS address, p.vouched AS vouched FROM person_desks d "
        + "JOIN persons p ON p.person = d.person WHERE d.desk_key = ?1 AND d.signed_at > 0 "
        + "AND p.signed_at > ?2 " /* plant:asker-desk-proof */
        + "ORDER BY d.signed_at DESC LIMIT 1").bind(key, now - PROOF_MS).first()
      : await db.prepare("SELECT b.person AS person, s.org AS org, p.provider AS provider, p.address AS address, p.vouched AS vouched FROM bindings b "
        + "JOIN seats s ON s.kind = 'lead' AND s.person = b.person JOIN persons p ON p.person = b.person WHERE b.lead = ?1 AND b.person IS NOT NULL "
        + "AND s.proved_at > ?2").bind(key, now - PROOF_MS).first(); /* plant:asker-studio-proof */
    if (!r) return null;
    const org = typeof r.org === "string" && r.org.slice(0, PERSON.length) !== PERSON ? r.org : null;
    return { person: r.person, provider: r.provider, org, address: await addressKeyed(cfg, r.address), vouched: r.vouched === 1 }; /* plant:asker-keyed */
  }
  /* The licences `who` may ask, newest paid first, each with its public reference: one admitting their organisation (never through a person),
     one holding an open invitation for their address that no owner's bar refuses (a Join press: taken where the safeguard holds, inviteTakes,
     else a request the lead confirms, askOrTake; board 1017's rule 1), or one where a lead accepted them and it waits for their press
     ("offered"). */
  async function askable(db, cfg, who, now) {
    const q = params();
    const sql = "SELECT l.id AS id, l.owner AS owner FROM licences l WHERE " + JOINABLE(q, now) + " AND ("
      + (who.org ? "l.id IN (SELECT licence FROM admits WHERE provider = " + q(who.provider) + " AND org = " + q(who.org) + ")" : "0") /* plant:ask-org */
      + (who.address ? " OR EXISTS (SELECT 1 FROM invites i WHERE i.licence = l.id AND i.address = " + q(who.address) + " AND i.at > " + q(now - INVITE_MS)
        + " AND NOT " + ownerBars(q, who.person, "l.id", now) + ")" : "") /* plant:ask-invited */
      + " OR EXISTS (SELECT 1 FROM asks a WHERE a.licence = l.id AND a.person = " + q(who.person) + " AND a.state = 'offered' AND a.at > " + q(now - ASK_MS) + ")"
      + ") ORDER BY l.paid_until DESC, l.id DESC LIMIT 16";
    const rows = (await db.prepare(sql).bind(...q.values).all()).results;
    const out = [];
    for (const r of rows) out.push(Object.assign({ ref: await refOf(cfg, r.id) }, r));
    return out;
  }
  /* A LEAD OF `lic` named by the pseudonym a sign-in answer gave: its owner or a lead it named (lead_names); null for anyone else. */
  async function leadNamed(db, cfg, lic, pseudonym) {
    const rows = await db.prepare("SELECT owner AS person FROM licences WHERE id = ?1 AND owner IS NOT NULL UNION SELECT person FROM lead_names WHERE licence = ?1").bind(lic.id).all();
    for (const r of rows.results) if (await personOutOf(cfg, lic.id, r.person) === pseudonym) return r.person;
    return null;
  }
  /* Whether `team` is a team `lead` (a person) leads on licence L: a door one of their Studio keys set there. */
  const leadsTeam = async (db, L, lead, team) => !!(await db.prepare("SELECT 1 AS t FROM doors d JOIN bindings b ON b.lead = d.lead AND b.licence = d.licence "
    + "WHERE d.licence = ?1 AND b.person = ?2 AND d.team = ?3").bind(L, lead, team).first());

  /* THE LEADS TO ASK (the design's 1.2: "The sign-in answers carry, where the person is not seated and their organisation's licence is found, the
     leads to ask"; who sees what, its 2.2: a colleague sees "the leads' names and their teams' names, in the chooser; never an address"): the
     organisation's running paid licence, by its public reference, and its owner (marked the administrator, whom "I do not know" asks) and the
     leads it named, each by their pseudonym on it and the name the service keeps of them, with their teams by id and name. Null for a personal
     account and where the organisation holds no such licence. */
  async function leadsFor(db, cfg, s, now) {
    if (s.personal) return null;
    const lic = await db.prepare("SELECT id, owner FROM licences l WHERE l.refunded = 0 AND l.desk_only = 0 AND l.seat_source = 'admit' AND l.trial_ends IS NULL "
      + "AND l.paid_until > ?1 AND l.id IN (SELECT licence FROM admits WHERE provider = ?2 AND org = ?3) ORDER BY l.paid_until DESC, l.id DESC LIMIT 1")
      .bind(now, s.provider, s.org).first();
    if (!lic) return null;
    const rows = await db.prepare("SELECT p.person AS person, p.name AS name, (p.person IS ?2) AS admin FROM persons p WHERE p.person IS ?2 "
      + "OR p.person IN (SELECT person FROM lead_names WHERE licence = ?1) ORDER BY admin DESC, p.name, p.person LIMIT ?3").bind(lic.id, lic.owner, LIST_MAX).all();
    const doors = await db.prepare("SELECT b.person AS person, d.team AS team, d.label AS label FROM doors d JOIN bindings b ON b.lead = d.lead AND b.licence = d.licence "
      + "WHERE d.licence = ?1 AND b.person IS NOT NULL ORDER BY d.at DESC, d.team").bind(lic.id).all();
    const people = [];
    for (const r of rows.results) {
      const teams = [];
      for (const d of doors.results) if (d.person === r.person && !teams.some(x => x.team === d.team)) teams.push({ team: d.team, label: d.label });
      people.push(Object.assign({ person: await personOutOf(cfg, lic.id, r.person), name: r.name }, r.admin === 1 ? { admin: true } : {}, { teams }));
    }
    return { ref: await refOf(cfg, lic.id), people };
  }

  /* THE PERSON'S OPEN REQUESTS (piece asked): each ask of this person that is still open (state open or offered, within ASK_MS),
     the licence by the reference a sign-in already gives and the lead in the shape leadsFor gives a lead, with asks.at, the service's
     clock when the request was made. One read, and nothing written. Empty where they have none: the answer then carries no asked key.
     A request answered (accepted or refused), taken back (the row deleted), past ASK_MS, or on a licence one may no longer
     join (JOINABLE) is not in the read. One passed to another lead stays, and names that lead. */
  async function askedOf(db, cfg, person, now) {
    const rows = (await db.prepare("SELECT a.id AS id, a.licence AS licence, a.lead AS lead, a.at AS at, p.name AS name, "
      + "(p.person = l.owner) AS admin, d.team AS team, d.label AS label FROM asks a "
      + "JOIN persons p ON p.person = a.lead JOIN licences l ON l.id = a.licence "
      + "LEFT JOIN bindings b ON b.licence = a.licence AND b.person = a.lead "
      + "LEFT JOIN doors d ON d.licence = b.licence AND d.lead = b.lead "
      + "WHERE a.person = ?1 /* plant:asked-person */ "
      + "AND a.state IN ('open', 'offered') /* plant:asked-state */ "
      + "AND a.at > ?2 /* plant:asked-expiry */ "
      + "AND l.refunded = 0 AND l.desk_only = 0 AND l.seat_source = 'admit' AND l.trial_ends IS NULL AND l.paid_until > ?3 /* plant:asked-joinable */ "
      + "ORDER BY a.at, a.id, d.at DESC, d.team").bind(person, now - ASK_MS, now).all()).results;
    const out = [], byId = new Map();
    for (const r of rows) {
      let e = byId.get(r.id);
      if (!e) {
        const lead = Object.assign({ person: await personOutOf(cfg, r.licence, r.lead), name: r.name },
          Number(r.admin) === 1 ? { admin: true } : {}, { teams: [] });
        e = { licence: await refOf(cfg, r.licence), lead, at: r.at, seen: new Set() };
        byId.set(r.id, e);
        out.push(e);
      }
      if (typeof r.team === "string" && !e.seen.has(r.team)) { e.seen.add(r.team); e.lead.teams.push({ team: r.team, label: r.label }); }
    }
    return out.map(e => ({ licence: e.licence, lead: e.lead, at: e.at }));
  }

  /* THE PLACE TAKEN, IN ONE BATCH (ruled 22:15: "A seat is taken at Accept, or at the person's own sign-in when invited by address"): person P
     seated by a desk seat on licence L, counted as takeSeat counts (P excluded), their one desk seat moved here from wherever it was; admitted
     there by name, on `lead`'s `team`, any other lead's team on L left (a desk is on one team at a time, 21:35); an invitation to their address
     there spent. Every statement only where `go(q)` holds; the admission only where the seat was taken now or P's desk seat is freed somewhere
     (a freed seat is taken again only by its person's fresh proof: they are admitted, and seated at their next sign-in). WHAT WAS HELD AND LEFT
     GOES (the test architect's hold 1 on S2; the design's A2, the acceptance "leaves any other team first"): `held`, the JSON list of what the
     person held when they pressed (holdings), names the licences where they held a desk seat or a team, and on each but L their admission by
     name and their teams go in the same batch, so no admission elsewhere puts the desk back at its next renewal. An organisation's admission
     elsewhere is not theirs and stays (a name outranks it). {stmts, done(q)}, done the condition the place was taken on, for the statements after. */
  function placeStatements(db, o) {
    const { P, L, lead, team, provider, org, proved, now, go, held } = o;
    const LEFT = q => "SELECT CAST(substr(value, 11) AS INTEGER) FROM json_each(" + q(held || "[]") + ") WHERE value LIKE 'seat:desk:%' "
      + "UNION SELECT CAST(substr(value, 6, instr(substr(value, 6), ':') - 1) AS INTEGER) FROM json_each(" + q(held || "[]") + ") WHERE value LIKE 'team:%'";
    /* A SEAT FREED BEFORE ITS PERSON'S LAST FRESH SIGN-IN IS FREED NO LONGER (review 48's finding 9, Argon's A5c; Claude alpha's words: "freed
       on A, waiting on B: quiet renewals 403 until a fresh sign-in"): the fresh proof the comment above asks for is a desk's interactive sign-in,
       which alone writes person_desks.signed_at (a quiet renewal writes it nowhere but on an Entra licence, whose renewal carries its token
       too); where it is later than the removal stamped on the freed seat's licence, the person has proved afresh, and the place is taken now.
       A seat freed after that sign-in, or freed with no stamp, stays freed, as before. */
    const FREED = q => "EXISTS (SELECT 1 FROM seats s WHERE s.kind = 'desk' AND s.person = " + q(P) + " AND s.proved_at = 0"
      + " AND NOT EXISTS (SELECT 1 FROM removals r WHERE r.kind = 'desk' AND r.person = s.person AND r.licence = s.licence"
      + " AND r.at < (SELECT MAX(d.signed_at) FROM person_desks d WHERE d.person = s.person)))"; /* plant:place-freed-reproved */
    const TAKEN = q => "EXISTS (SELECT 1 FROM seats WHERE kind = 'desk' AND person = " + q(P) + " AND licence = " + q(L) + " AND seen_at = " + q(now) + ")";
    const done = q => go(q) + " AND (" + TAKEN(q) + " OR " + FREED(q) + ")";
    const stmts = [
      statementOf(db, q => "INSERT INTO seats (kind, person, licence, provider, org, seated_at, seen_at, proved_at) SELECT 'desk', "
        + [q(P), q(L), q(provider), q(org), q(now), q(now), q(proved)].join(", ") + " WHERE " + go(q) + " AND NOT " + FREED(q)
        + " AND ((SELECT COUNT(*) FROM seats o WHERE o.licence = " + q(L) + " AND o.kind = 'desk' AND o.person <> " + q(P) + " AND o.seen_at > " + q(now)
        + " - (SELECT grace_days FROM licences WHERE id = " + q(L) + ") * " + q(DAY) + " AND o.proved_at > " + q(now - PROOF_MS) + ") "
        + "< (SELECT " + inForceCol("seats", "licences.id", q(now)) + " FROM licences WHERE id = " + q(L) + ") " /* plant:place-room */
        /* A PERSON WHO STAYS KEEPS THEIR SEAT ON THE PRESS TOO (the test architect's rating of the invite path, class B): where in-force seats are
           below the seated, room counts every other person seated and refuses even a person the rule keeps; the sign-in admits them by the rule
           (takeSeat), and so does this press, on the licence they sit on now (the rule lists only persons seated there). */
        + "OR " + q(P) + " IN (" + stayingPersons(q(L), "'desk'", q(now), q(now - PROOF_MS)) + ")) " /* plant:place-stays */
        + "ON CONFLICT (kind, person) DO UPDATE SET licence = excluded.licence, provider = excluded.provider, org = excluded.org, seen_at = excluded.seen_at, "
        + "proved_at = MAX(seats.proved_at, excluded.proved_at), seated_at = CASE WHEN seats.licence = excluded.licence THEN seats.seated_at ELSE excluded.seated_at END"),
      statementOf(db, q => "INSERT INTO admits (licence, provider, org) SELECT " + q(L) + ", " + q(provider) + ", " + q(PERSON + P) + " WHERE " + done(q) + " ON CONFLICT DO NOTHING"),
      statementOf(db, q => "DELETE FROM admitted_by WHERE licence = " + q(L) + " AND person = " + q(P) + " AND lead <> " + q(lead) + " AND " + done(q)), /* plant:place-one-team */
      statementOf(db, q => "INSERT INTO admitted_by (licence, person, lead, team) SELECT " + [q(L), q(P), q(lead), q(team)].join(", ") + " WHERE " + done(q)
        + " ON CONFLICT (licence, person, lead) DO UPDATE SET team = excluded.team"), /* plant:place-team */
      statementOf(db, q => "DELETE FROM invites WHERE licence = " + q(L) + " AND address = " + q(o.addressKey === undefined ? null : o.addressKey) + " AND " + done(q)), /* plant:place-fold */
      statementOf(db, q => "DELETE FROM admits WHERE org = " + q(PERSON + P) + " AND licence <> " + q(L) + " AND licence IN (" + LEFT(q) + ") AND " + done(q)), /* plant:place-left-admits */
      statementOf(db, q => "DELETE FROM admitted_by WHERE person = " + q(P) + " AND licence <> " + q(L) + " AND licence IN (" + LEFT(q) + ") AND " + done(q)), /* plant:place-left-teams */
    ];
    return { stmts, done, admitted: 3 };
  }
  /* What placing P needs that the service keeps: their provider, the organisation their latest desk signed in from (keyed; a personal account
     its own), and their last proof (persons.signed_at), which the seat counts from. */
  /* ONE FOLD (the test architect's hold 5): an address is compared folded by the service, in JavaScript, never by SQL's lower(), which leaves a
     capital outside ASCII as it is; keyOfAddress is that fold, at every write and every comparison. */
  const placeOf = (db, P) => db.prepare("SELECT p.provider AS provider, p.signed_at AS proved, p.address AS address, (SELECT d.org FROM person_desks d WHERE d.person = p.person "
    + "ORDER BY d.signed_at DESC LIMIT 1) AS org FROM persons p WHERE p.person = ?1").bind(P).first();

  /* THE PERSON'S PRESS (route ask): where a lead of `lic` already pressed for `who` (an invitation to their address there that they may take, or
     an Accept that waits for them, "offered"), it takes effect now, in one batch; else the ask is kept, with what they hold now (holdings),
     which pressing agreed to leave. The answer's state: "accepted", or "waiting" with the ask's end; a full licence "full", writing nothing. */
  async function askOrTake(c, who, lic, lead, b) {
    const now = c.now, L = lic.id, P = who.person;
    /* A DESK'S PRESS ONLY completes what a lead pressed (the test architect's E1 on S2): it places a desk, as only a desk's ask is accepted; a
       Studio key's press is kept as its own ask, a naming's (lead/name). */
    const desk = b.kind === "desk"; /* plant:press-desk */
    const offered = desk ? await c.db.prepare("SELECT id, lead, team FROM asks WHERE licence = ?1 AND person = ?2 AND state = 'offered' AND at > ?3").bind(L, P, now - ASK_MS).first() : null;
    /* Only an invitation they may take (the safeguard holds, no owner's bar) is a pending press (the test architect's hold 7); any other leaves the
       press an ordinary ask, and "full" is said only by a full licence. */
    const invited = desk && !offered && who.address ? await statementOf(c.db, q => "SELECT i.address AS address, i.lead AS lead, i.team AS team FROM invites i WHERE i.licence = "
      + q(L) + " AND i.address = " + q(who.address) + " AND i.at > " + q(now - INVITE_MS) + " AND " + inviteTakes(q, who, q(L), now)).first() : null; /* plant:pending-takes */
    const pending = offered || invited;
    if (pending) {
      const still = offered
        ? q => "EXISTS (SELECT 1 FROM asks WHERE id = " + q(offered.id) + " AND state = 'offered')"
        : q => "EXISTS (SELECT 1 FROM invites i JOIN licences l ON l.id = i.licence WHERE i.licence = " + q(L) + " AND i.address = " + q(invited.address) + " AND i.at > " + q(now - INVITE_MS)
          + " AND " + JOINABLE(q, now) + " AND " + inviteTakes(q, who, q(L), now) + ")"; /* plant:join-still */
      const p = await placeOf(c.db, P);
      const heldNow = (await statementOf(c.db, q => "SELECT json_group_array(tok) AS h FROM (" + holdings(q, P, q(L), q(pending.lead), now) + ")").first()).h;
      /* The request's team only where it names the lead whose invitation or Accept this completes; else that lead's own (the test architect's hold 3
         on S2: the request's team was checked against the lead it names, while the place is written under pending.lead). */
      const team = b.team !== undefined && lead === pending.lead ? b.team : pending.team; /* plant:press-team */
      const place = placeStatements(c.db, { addressKey: await addressKeyed(c.cfg, p.address), P, L, lead: pending.lead, team: team === undefined ? null : team, provider: p.provider,
        org: p.org || PERSON + P, proved: p.proved, now, go: still, held: heldNow });
      const res = await c.db.batch(place.stmts.concat([statementOf(c.db, q => "UPDATE asks SET state = 'accepted', answered_at = " + q(now) + " WHERE licence = " + q(L)
        + " AND person = " + q(P) + " AND state IN ('open', 'offered') AND " + place.done(q))]));
      if (res[place.admitted].meta.changes === 1) return answer(200, { ok: true, state: "accepted" });
      return noSeat();
    }
    /* A JOIN ON AN INVITATION THE SAFEGUARD CANNOT TAKE (board 1017's rule 1, Claude alpha's word of 2026-11-22 00:57: "Not vouched: their
       Accept only makes them a candidate; the seat is taken when the owner confirms that named person [...] shown with what the provider says
       of them (name, provider, account kind)"; for a member, "the lead confirms the person, as an owner does for a lead"): the press is kept
       as an ask marked unconfirmed, which only a lead's Accept (person/admit with `ask`) seats, the lead's list showing the person's name,
       provider and account kind beside it. Only the person's own press writes one; a sign-in writes none (signin/desk). */
    const unconfirmed = !!who.address && !!(await statementOf(c.db, q => "SELECT 1 AS u FROM invites i WHERE i.licence = " + q(L) + " AND i.address = " + q(who.address)
      + " AND i.at > " + q(now - INVITE_MS) + " AND NOT " + inviteSafe(q, who, q(L))).first()); /* plant:press-unconfirmed */
    const id = randomHex(16);
    await c.db.batch([
      c.db.prepare("DELETE FROM asks WHERE licence = ?1 AND person = ?2 AND state IN ('open', 'offered')").bind(L, P),
      statementOf(c.db, q => "INSERT INTO asks (id, licence, person, lead, team, kind, key, source, held, at) SELECT " + [q(id), q(L), q(P), q(lead), q(b.team === undefined ? null : b.team),
        q(b.kind), q(b.key), q(unconfirmed ? "unconfirmed" : "org"), "(SELECT json_group_array(tok) FROM (" + holdings(q, P, q(L), q(lead), now) + "))", q(now)].join(", ")), /* plant:ask-held */
    ]);
    return answer(200, { ok: true, state: "waiting", until: now + ASK_MS });
  }

  /* A LEAD ACCEPTS AN ASK (person/admit with `ask`; ruled 22:15: "A seat is taken at Accept"): the ask open and naming this lead, or any on the
     licence for its owner; a desk's (a Studio's ask is a naming, lead/name's). It takes effect at once, in one batch, only where the person holds
     nothing now beyond what they held when they pressed (FITS; Claude alpha's criterion of 2026-11-17 names "an Accept of an ask whose person has
     since been seated elsewhere"); otherwise the ask is "offered" and waits for the person's own press (route ask), the answer saying it waits for
     the person. The team is the one named here, else the ask's, and the accepting lead's; THE OWNER CONFIRMS ANY ASK ON THEIR LICENCE, ON ANY
     TEAM (the Grok review beta's B4 of 2026-11-22): an ask whose lead's seat was freed passes to the owner with its team as it was (unnamed),
     and the owner holds no door there, so a door asked of the owner would leave that ask answerable by nobody. A full licence is "full",
     writing nothing. */
  async function acceptAsk(c, b, mine) {
    const now = c.now, L = mine.licence;
    const a = await c.db.prepare("SELECT a.person AS person, a.team AS team, a.kind AS kind, a.held AS held FROM asks a WHERE a.id = ?1 AND a.licence = ?2 AND a.state = 'open' "
      + "AND a.at > ?3 AND (a.lead = ?4 OR ?5 = 1)").bind(b.ask, L, now - ASK_MS, mine.person, mine.owner ? 1 : 0).first();
    if (!a || a.kind !== "desk") return noSeatHere(); /* plant:accept-desk */
    const team = b.team !== undefined ? b.team : a.team;
    if (team !== null && team !== undefined && !mine.owner /* plant:accept-team-owner */ && !await leadsTeam(c.db, L, mine.person, team)) return noSeatHere(); /* plant:accept-team */
    /* The owner's team is one a door on the licence holds (the test architect's F5 on c69b8aac): never a team nobody leads. */
    if (team !== null && team !== undefined && mine.owner && !await c.db.prepare("SELECT 1 AS t FROM doors WHERE licence = ?1 AND team = ?2").bind(L, team).first()) return noSeatHere(); /* plant:accept-team-door */
    const P = a.person, p = await placeOf(c.db, P);
    if (!p) return noSeatHere();
    /* E5 (the test architect's): on a licence running and paid now (JOINABLE), else nothing is written and the ask stays open. */
    if (!await statementOf(c.db, q => "SELECT 1 AS j FROM licences l WHERE l.id = " + q(L) + " AND " + JOINABLE(q, now)).first()) return noSeatHere(); /* plant:accept-joinable */
    const OPEN = q => "EXISTS (SELECT 1 FROM asks WHERE id = " + q(b.ask) + " AND licence = " + q(L) + " AND state = 'open' AND at > " + q(now - ASK_MS)
      + " AND (lead = " + q(mine.person) + " OR " + q(mine.owner ? 1 : 0) + " = 1)) AND EXISTS (SELECT 1 FROM licences l WHERE l.id = " + q(L) + " AND " + JOINABLE(q, now) + ")";
    const FITS = q => "NOT EXISTS (SELECT 1 FROM (" + holdings(q, P, q(L), q(mine.person), now) + ") h WHERE h.tok NOT IN (SELECT value FROM json_each((SELECT held FROM asks WHERE id = "
      + q(b.ask) + "))))"; /* plant:accept-fits */
    const place = placeStatements(c.db, { addressKey: await addressKeyed(c.cfg, p.address), P, L, lead: mine.person, team: team === undefined ? null : team, provider: p.provider, org: p.org || PERSON + P,
      proved: p.proved, now, go: q => OPEN(q) + " AND " + FITS(q), held: a.held });
    const res = await c.db.batch(place.stmts.concat([
      statementOf(c.db, q => "UPDATE asks SET state = 'accepted', answered_at = " + q(now) + " WHERE id = " + q(b.ask) + " AND " + place.done(q)),
      statementOf(c.db, q => "UPDATE asks SET state = 'offered', answered_at = " + q(now) + ", lead = " + q(mine.person) + ", team = " + q(team === undefined ? null : team)
        + " WHERE id = " + q(b.ask) + " AND " + OPEN(q) + " AND NOT " + FITS(q)), /* plant:accept-offered */
      c.db.prepare("SELECT state FROM asks WHERE id = ?1").bind(b.ask),
    ]));
    const state = (res[res.length - 1].results[0] || {}).state, person = await personOutOf(c.cfg, L, P);
    if (state === "offered") return answer(200, { ok: true, admitted: b.ask, person, waits: "person" });
    if (state === "accepted" && res[place.admitted].meta.changes === 1) return answer(200, { ok: true, admitted: b.ask, person, seated: res[0].meta.changes === 1 });
    return state === "open" ? noSeat() : noSeatHere();
  }

  /* WHERE THE ASKER STANDS (route ask/status), for the person behind `who`: their latest ask while it lives, "waiting" while open, "offered"
     where a lead accepted and it waits for their press, "accepted" or "refused"; else an invitation for their address they may take ("invited",
     an offer, never taken by itself where they hold anything: the press is theirs); else "gone". Each but "gone" names the licence by its
     reference, the lead by their pseudonym on it, and the team. */
  async function statusOf(db, cfg, who, now) {
    const a = await db.prepare("SELECT licence, lead, team, state FROM asks WHERE person = ?1 AND at > ?2 ORDER BY at DESC LIMIT 1").bind(who.person, now - ASK_MS).first();
    const named = async (L, lead, team, state) => ({ ok: true, state, licence: await refOf(cfg, L), lead: await personOutOf(cfg, L, lead), team: team === undefined ? null : team });
    if (a && (a.state === "open" || a.state === "offered")) return named(a.licence, a.lead, a.team, a.state === "open" ? "waiting" : "offered");
    if (who.address) {
      const q = params();
      const i = await db.prepare("SELECT i.licence AS licence, i.lead AS lead, i.team AS team, " + inviteSafe(q, who, "i.licence") + " AS safe FROM invites i JOIN licences l ON l.id = i.licence WHERE i.address = " + q(who.address)
        + " AND i.at > " + q(now - INVITE_MS) + " AND " + JOINABLE(q, now) + " AND NOT " + ownerBars(q, who.person, "i.licence", now) + " ORDER BY i.at DESC LIMIT 1").bind(...q.values).first(); /* plant:status-invited */
      /* One the safeguard cannot take is offered all the same, marked `confirm`: the person's Join makes a request a lead confirms (board 1017's rule 1). */
      if (i) return Object.assign(await named(i.licence, i.lead, i.team, "invited"), i.safe === 1 ? {} : { confirm: true }); /* plant:status-confirm */
    }
    if (a) return named(a.licence, a.lead, a.team, a.state);
    return { ok: true, state: "gone" };
  }

  /* THE INVITATIONS WAITING FOR A PERSON (board 1017, the member invitation: "the signed-in member's desk shows the invitation waiting (who,
     which team) with one Join press and no paste"), for `who` as askerOf gives one: every open invitation to their address on a licence they
     may join that no owner's bar refuses and that they are not on already (admitted there by name, or holding an open request there), newest
     first, at most LIST_MAX: the licence by its reference, the lead who invited them in the shape leadsFor gives a lead, the team by id and
     name, its end, and `confirm` where the safeguard cannot take it (the Join is then a request the lead confirms). The Join is route ask,
     naming that licence, that lead and that team. Nothing written. */
  async function invitedOf(db, cfg, who, now) {
    if (!who.address) return [];
    const q = params();
    const rows = (await db.prepare("SELECT i.licence AS licence, i.lead AS lead, i.team AS team, i.at AS at, p.name AS name, (p.person = l.owner) AS admin, d.label AS label, "
      + inviteSafe(q, who, "i.licence") + " AS safe FROM invites i JOIN licences l ON l.id = i.licence LEFT JOIN persons p ON p.person = i.lead "
      + "LEFT JOIN doors d ON d.licence = i.licence AND d.team = i.team AND d.lead IN (SELECT b.lead FROM bindings b WHERE b.licence = i.licence AND b.person = i.lead) "
      + "WHERE i.address = " + q(who.address) + " AND i.at > " + q(now - INVITE_MS) + " AND " + JOINABLE(q, now) + " AND NOT " + ownerBars(q, who.person, "i.licence", now) /* plant:invited-bars */
      + " AND NOT EXISTS (SELECT 1 FROM admits a WHERE a.licence = i.licence AND a.org = " + q(PERSON + who.person) + ")"
      + " AND NOT EXISTS (SELECT 1 FROM asks k WHERE k.licence = i.licence AND k.person = " + q(who.person) + " AND k.state IN ('open', 'offered') AND k.at > " + q(now - ASK_MS) + ")"
      + " ORDER BY i.at DESC, i.licence LIMIT " + q(LIST_MAX)).bind(...q.values).all()).results;
    const out = [], seen = new Set();
    for (const r of rows) {
      if (seen.has(r.licence)) continue;
      seen.add(r.licence);
      const lead = Object.assign({ person: await personOutOf(cfg, r.licence, r.lead), name: typeof r.name === "string" ? r.name : null }, Number(r.admin) === 1 ? { admin: true } : {});
      out.push(Object.assign({ licence: await refOf(cfg, r.licence), lead, team: typeof r.team === "string" ? r.team : null, label: typeof r.label === "string" ? r.label : null,
        until: r.at + INVITE_MS }, r.safe === 1 ? {} : { confirm: true })); /* plant:invited-confirm */
    }
    return out;
  }

  /* A LEAD'S CHECK CARRIES THE COUNT (the design's 1.2): the open asks naming the key's person, or every open ask on the licence for its owner,
     where the key leads the licence its check answers for and there is one; nothing otherwise, so such a check is answered as before. */
  async function asksFor(db, lead, h, now) {
    if (!h.row || h.row.refunded) return {};
    const mine = await leadOf(db, lead, now);
    if (!mine || mine.licence !== h.row.id) return {};
    const n = await db.prepare("SELECT COUNT(*) AS n FROM asks WHERE licence = ?1 AND state = 'open' AND at > ?2 AND (lead = ?3 OR ?4 = 1)") /* plant:check-asks */
      .bind(mine.licence, now - ASK_MS, mine.person, mine.owner ? 1 : 0).first();
    return n.n > 0 ? { asks: n.n } : {};
  }

  /* ---- the routes ------------------------------------------------------------------------------------------------- */

  /* A NAMING, AS ONE BATCH (lead/name's, shared by lead/pick, lead/confirm and an Accept of a naming by address): on `mine.licence`,
     owned by `mine.person` and paid, at most lead_seats with the owner counted, the person `who.person` named, and admitted by name in the
     same batch so their own desks are seated whatever the switch. `accepted`, where given, is the person's press already made (lead/confirm
     after their Accept): the naming is written accepted then. `address`, where given (a naming by address taken), sends that naming and its
     candidates, and the desk invitation to the same address on the licence, in the same batch (board 1017's rule 3: "when a naming is
     accepted and the lead seat covers that person's desk, the desk invitation closes without a seat"; here the naming's admission by name
     seats their desk, and seats keep one desk seat per person, so the invitation could seat nothing more). The last statement reads
     whether the naming stands. */
  /* THE PERSON'S ACCEPT OF A NAMING BY ADDRESS (lead/accept, where they hold no naming by person; board 1017's rule 1, Claude alpha's word of
     2026-11-22 00:57: "Vouched: the naming is offered to that person and their own Accept takes the seat. Not vouched: their Accept only
     makes them a candidate; the seat is taken when the owner confirms that named person in Studio, shown with what the provider says of them
     (name, provider, account kind)"). Vouched (addressNaming): the naming is written as lead/name by code writes one, accepted, its naming
     by address spent and the desk invitation to the same address closed (spentStatements), and the move made now as for a naming by person
     (followSeat). "FULL" CHANGES NOTHING (the Grok review beta's C1 of 2026-11-22, a money finding: a full answer had kept the name, which the
     cap counts, the admission by name, which a later fresh desk sign-in ranks ahead of the person's own paid licence, and spent both
     invitations). ONE BATCH DECIDES (the test architect's F1 on c69b8aac: a write and a take-back in two batches left a desk seat taken in
     the gap): the naming's first statement holds, in that batch, that the seat would follow it (leadLicence's own statement read as though
     the naming were accepted picks this licence), and that the licence has a lead seat for them (leadRoom), and every other statement of the batch stands on the name it writes. Where any fails, nothing is written and the answer is
     "full". Where they hold, the naming is accepted, admitted and spent at once, and the move is made now; a move that misses after that
     (their proof lapsing in between) leaves the naming accepted, and they move at their next check, as after the owner's confirmation. Not vouched: the person is written a candidate of it, with their provider and account kind ("work", or "personal" for an
     account that is its own organisation), and answered `accepted: false, reason: "confirm"`; nothing is seated. A trial holding a
     colleague's desk or a team is "held", as for a naming by person; no naming at all, a key with no seat. */
  async function acceptByAddress(c, b, person) {
    const a = await addressNaming(c.db, c.cfg, person, c.now);
    if (!a) return noSeatHere();
    if (a.held === 1) return answer(409, { ok: false, reason: "held" });
    const me = await c.db.prepare("SELECT p.provider AS provider, (SELECT s.org FROM seats s WHERE s.kind = 'lead' AND s.person = p.person) AS org FROM persons p WHERE p.person = ?1").bind(person).first();
    if (a.vouched !== 1) { /* plant:accept-unvouched */
      const account = typeof me.org === "string" && me.org.slice(0, PERSON.length) !== PERSON ? "work" : "personal";
      await c.db.prepare("INSERT INTO lead_candidates (licence, address, person, provider, account, at) VALUES (?1, ?2, ?3, ?4, ?5, ?6) "
        + "ON CONFLICT (licence, address, person) DO UPDATE SET provider = excluded.provider, account = excluded.account, at = excluded.at")
        .bind(a.licence, a.address, person, me.provider, account, c.now).run(); /* plant:accept-candidate */
      return answer(200, { ok: true, accepted: false, reason: "confirm" });
    }
    /* The move's conditions as SQL for the naming's own statement: leadLicence's statement (captured, not run) shifted past the insert's four
       parameters and this licence's (?5), then leadRoom's (as roomOn). */
    const capture = { prepare: sql => ({ bind: (...v) => ({ sql, v }) }) };
    const pick = leadPick(capture, person, c.now, await keptLeadLicence(c.db, person, c.now), a.licence);
    const room = { sql: "SELECT 1 FROM licences WHERE id = ?7 AND " + leadRoom("licences"), v: [person, c.now, DAY, ENTRA_PROOF_MS, PROOF_MS, null, a.licence] };
    const shift = (sql, k) => sql.replace(/\?(\d+)/g, (m, d) => "?" + (Number(d) + k));
    const go = { sql: "?5 = (SELECT id FROM (" + shift(pick.sql, 5) + ")) AND EXISTS (" + shift(room.sql, 5 + pick.v.length) + ")", /* plant:accept-address-go */
      v: [a.licence].concat(pick.v, room.v) };
    const res = await c.db.batch(namingStatements(c, { licence: a.licence, person: a.owner }, { person, provider: me.provider }, c.now, a.address, go));
    if (res[res.length - 1].results[0].named !== 1) return answer(200, { ok: true, accepted: false, reason: "full" }); /* plant:accept-address-full */
    await followSeat(c.db, b.lead, await holdingOf(c.db, b.lead), c.now);
    return answer(200, { ok: true, accepted: true });
  }

  function namingStatements(c, mine, who, accepted, address, go) {
    const NAMED = "EXISTS (SELECT 1 FROM lead_names WHERE licence = ?1 AND person = ?2)";
    return [
        c.db.prepare("INSERT INTO lead_names (licence, person, named_by, at) SELECT ?1, ?2, ?3, ?4 WHERE EXISTS (SELECT 1 FROM licences "
          + "WHERE id = ?1 AND owner = ?3 AND desk_only = 0 AND refunded = 0 AND trial_ends IS NULL) "
          + "AND (SELECT COUNT(*) FROM lead_names WHERE licence = ?1 AND person <> ?3) + 1 < (SELECT " + inForceCol("lead_seats", "licences.id", "?4") + " FROM licences WHERE id = ?1) " /* plant:name-count */
          + (go ? "AND " + go.sql + " " : "") + "ON CONFLICT DO NOTHING").bind(mine.licence, who.person, mine.person, c.now, ...(go ? go.v : [])), /* plant:naming-go */
        c.db.prepare("INSERT INTO admits (licence, provider, org) SELECT ?1, ?3, ?4 || ?2 WHERE " + NAMED + " ON CONFLICT DO NOTHING")
          .bind(mine.licence, who.person, who.provider, PERSON), /* plant:name-admits */
        c.db.prepare("INSERT INTO admitted_by (licence, person, lead) SELECT ?1, ?2, ?3 WHERE " + NAMED + " AND NOT EXISTS (SELECT 1 FROM admitted_by "
          + "WHERE licence = ?1 AND person = ?2) ON CONFLICT DO NOTHING").bind(mine.licence, who.person, mine.person),
    ].concat(accepted ? [c.db.prepare("UPDATE lead_names SET blocked_at = NULL, accepted_at = ?3 WHERE licence = ?1 AND person = ?2 AND accepted_at IS NULL")
        .bind(mine.licence, who.person, accepted)] : []) /* plant:naming-accepted */
      .concat(address ? spentStatements(c, mine, who, address) : [])
      .concat([
        c.db.prepare("SELECT " + NAMED + " AS named").bind(mine.licence, who.person), /* plant:name-takes-nothing */
      ]);
  }
  /* A NAMING BY ADDRESS SPENT: its candidates, the naming and the desk invitation to the same address on the licence, each only where the
     person's name stands there (namingStatements' `address`, and an Accept by address once its move has landed). */
  function spentStatements(c, mine, who, address) {
    const NAMED = "EXISTS (SELECT 1 FROM lead_names WHERE licence = ?1 AND person = ?2)";
    return [
        c.db.prepare("DELETE FROM lead_candidates WHERE licence = ?1 AND address = ?3 AND " + NAMED).bind(mine.licence, who.person, address),
        c.db.prepare("DELETE FROM lead_invites WHERE licence = ?1 AND address = ?3 AND " + NAMED).bind(mine.licence, who.person, address), /* plant:naming-spent */
        c.db.prepare("DELETE FROM invites WHERE licence = ?1 AND address = ?3 AND " + NAMED).bind(mine.licence, who.person, address), /* plant:naming-closes-invite */
      ];
  }

  const ROUTES = {
    async "check"(c) {
      const b = c.body;
      if (!exactly(b, ["lead", "t", "sig"], ["proofs"]) || !HEX64.test(String(b.lead)) || !isT(b.t)
          || !HEX128.test(String(b.sig))) return malformed();
      if (b.proofs !== undefined && (!Array.isArray(b.proofs) || b.proofs.length > PROOFS_MAX
          || !b.proofs.every(p => HEX64.test(String(p))) || new Set(b.proofs).size !== b.proofs.length)) return malformed();
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", b.lead]], c.now)) return slowDown();
      const no = await signedOk(c.db, c.cfg, Q.checkBytes({ lead: b.lead, t: b.t, proofs: b.proofs }), b.lead, b.sig, b.t, c.now);
      if (no) return no;
      /* The key is marked seen only once the check is not refused (a refusal writes nothing; the test architect's survey of
         2026-11-12), so a key asked to sign in again keeps the seen_at it had. */
      const h = await followSeat(c.db, b.lead, await holdingOf(c.db, b.lead), c.now); /* plant:check-unseen */
      const rev = revokedOf(c.env);
      /* A seat freed or lapsed (decision 15 item 1): Studio is asked to prove its person again; nothing is taken or granted. */
      if (h.kind === "signin") return answer(403, Object.assign({ ok: false, reason: "signin" }, rev)); /* plant:check-signin */
      await c.db.prepare("UPDATE bindings SET seen_at = ?1 WHERE lead = ?2").bind(c.now, b.lead).run(); /* plant:check-seen */
      if (h.kind !== "none" && b.proofs !== undefined) {
        await c.db.batch([c.db.prepare("DELETE FROM proofs WHERE lead = ?1").bind(b.lead)]
          .concat(b.proofs.map(p => c.db.prepare("INSERT INTO proofs (lead, proof) VALUES (?1, ?2)").bind(b.lead, p))));
      }
      /* A lead's answer names its licence's public reference, which its desks' certificates name (refOf). */
      const who = Object.assign(h.row && !h.row.refunded ? { ref: await refOf(c.cfg, h.row.id) } : {}, whoOf(h), await erasedFor(c.db, b.lead, h, c.now),
        await asksFor(c.db, b.lead, h, c.now), await trialsOfKey(c.db, b.lead), await namingOf(c.db, c.cfg, b.lead, c.now)); /* plant:check-trials */
      Object.assign(who, await buyerOfKey(c.db, c.env, b.lead, c.now)); /* plant:check-buyer */
      if (h.kind === "licence") {
        if (h.row.refunded) return answer(200, Object.assign({ ok: true, licence: null, grant: null, ended: "refunded" }, who, rev)); /* plant:refund */
        /* Past its paid end, as signedIn answers it: a refund is said first, whatever its paid date. */
        if (!(h.row.paid_until > c.now)) return answer(200, Object.assign({ ok: true, licence: null, grant: null, ended: PAID_ENDED }, who, rev)); /* plant:paid-end-check */
        return answer(200, Object.assign({ ok: true, licence: await licenceFor(c.cfg, h.row, c.now, c.db),
          grant: h.row.paid_until > c.now ? await grantFor(c.cfg, b.lead, true, h.row.paid_until, c.now, h.row, c.db) : null }, who, rev));
      }
      if (h.kind === "trial") return answer(200, Object.assign({ ok: true, licence: await trialLicenceFor(c.cfg, h.ends, c.now), /* plant:trial-check-licence */
        trial: { ends: h.ends },
        grant: h.ends > c.now ? await grantFor(c.cfg, b.lead, false, h.ends, c.now, undefined, c.db) : null }, who, rev));
      return answer(200, Object.assign({ ok: true, licence: null, grant: null, released: h.released }, who, rev)); /* plant:revoked-sent */
    },

    async "grant"(c) {
      const b = c.body;
      if (!exactly(b, ["lead", "proof", "t", "sig"]) || !HEX64.test(String(b.lead)) || !HEX64.test(String(b.proof))
          || !isT(b.t) || !HEX128.test(String(b.sig))) return malformed();
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", b.lead]], c.now)) return slowDown();
      const no = await signedOk(c.db, c.cfg, Q.grantFetchBytes({ lead: b.lead, proof: b.proof, t: b.t }), b.proof, b.sig, b.t, c.now); /* plant:domain */
      if (no) return no;
      if (b.proof !== b.lead) {
        const reg = await c.db.prepare("SELECT 1 AS r FROM proofs WHERE lead = ?1 AND proof = ?2").bind(b.lead, b.proof).first();
        if (!reg) return refused(); /* plant:proof */
      }
      if (await seatLapsed(c.db, b.lead, c.now)) return refused(); /* plant:grant-signin */
      const h = await holdingOf(c.db, b.lead); /* plant:s4-grant */
      let grant = null;
      if (h.kind === "licence" && !h.row.refunded && h.row.paid_until > c.now) /* plant:holding */
        grant = await grantFor(c.cfg, b.lead, true, h.row.paid_until, c.now, h.row, c.db);
      else if (h.kind === "trial" && h.ends > c.now) grant = await grantFor(c.cfg, b.lead, false, h.ends, c.now, undefined, c.db);
      if (!grant) return refused();
      return answer(200, { ok: true, grant });
    },

    async "signin"(c) {
      const b = c.body;
      if (!exactly(b, ["provider", "idToken", "lead", "t", "sig"], ["seed", "accessToken", "member"]) || typeof b.provider !== "string"
          || !/^[a-z][a-z0-9-]{1,30}$/.test(b.provider) || typeof b.idToken !== "string" || !HEX64.test(String(b.lead))
          || !isT(b.t) || !HEX128.test(String(b.sig)) || (b.seed !== undefined && !HEX64.test(String(b.seed)))
          || (b.accessToken !== undefined && typeof b.accessToken !== "string") || !memberOk(b)) return malformed();
      /* The seed is required (below): a body without one is refused as a bad token, alike with one that does not bind. */
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", b.lead]], c.now)) return slowDown();
      const tokenHash = await Q.tokenHash(b.idToken), later = {};
      const signinAccess = b.accessToken === undefined ? undefined : await Q.tokenHash(b.accessToken);
      const no = await signedOk(c.db, c.cfg, await seedSigned(seed => (signinAccess === undefined ? Q.signinBytes({ provider: b.provider, tokenHash, lead: b.lead, t: b.t, member: b.member, seed }) /* plant:member-signed-ordinary */
        : Q.signinManagedBytes({ provider: b.provider, tokenHash, accessHash: signinAccess, lead: b.lead, t: b.t, member: b.member, seed })), b.seed, b.lead, b.sig), b.lead, b.sig, b.t, c.now, later); /* plant:member-signed */
      if (no) return no;
      const providers = providersOf(c.env);
      if (!providers) return unavailable();
      const p = providers.get(b.provider);
      if (!p) return badToken();
      const j = await judgeToken(b.idToken, p, providers, c.now);
      if (!j) return badToken();
      /* The token's nonce must be the one the signed lead and the seed make (above, A TOKEN IS BOUND TO THE KEY THAT SIGNS); a
         token with none, or a body with no seed, is refused alike (the test architect, on stage 1: required once the stages join). */
      if (j.nonce === null || b.seed === undefined || j.nonce !== await Q.signinNonce(b.lead, b.seed)) return badToken(); /* plant:nonce-bound */
      const once = await seenOnce(c.db, later.digest, c.now); /* plant:signin-seen-later */
      if (once) return once;
      const s = await personOf(c.cfg, j);
      const own = PERSON + s.person;
      /* A tenant whose licence follows Entra: its roles alone decide, and no trial, naming or admission is read or started. */
      const ent = await entraLicence(c.db, s); /* plant:entra-signin */
      s.keep = ent ? CLEAR : j.ident; /* plant:ident-entra-signin */
      if (ent) { const r = await rolesIn(b, p, j, c.now); return r.no || entraLead(c, b, s, j, tokenHash, ent, false, r.roles); }
      let row = await leadLicence(c.db, s.person, c.now);
      if (!row) {
        /* Claude alpha's decision 15 (a): a lead no licence admits starts a trial of their own, once. */
        await startTrial(c.db, s, trialOncePer === "person" ? own : s.org, c.now);
        row = await leadLicence(c.db, s.person, c.now);
        /* NO LICENCE, AND STILL A CODE (the test architect's read of the held integration, erasure part, finding 4): the person's code is
           made here where they have none, as signin/desk's answer of no licence makes it, in the batch that spends the token, and answered
           as `me`, so a person whose trial was had and who was erased since can still be bought for: a payment binds to the code. */
        if (!row) {
          const spend = await tokenSpend(c.cfg, tokenHash, j.exp);
          const res = await c.db.batch([personRow(c.db, s, c.now, spend.digest)] /* plant:no-licence-code */
            .concat(s.keep ? [statementOf(c.db, q => identStatement(q, s, c.now, unspent(spend)(q)))] : []) /* plant:ident-no-licence */
            .concat([c.db.prepare("INSERT INTO seen (digest, until) VALUES (?1, ?2) ON CONFLICT (digest) DO NOTHING").bind(spend.digest, spend.until)]));
          if (res[1].meta.changes !== 1) return badToken();
          const me = await c.db.prepare("SELECT code FROM persons WHERE person = ?1").bind(s.person).first();
          const trials = await trialsOf(c.db, s.person); /* plant:no-licence-trials */
          return answer(403, Object.assign({ ok: false, reason: "no-licence", me: me.code, trials }, await buyerOf(c.db, c.env, s.person, c.now))); /* plant:no-licence-buyer */
        }
      }
      /* The seat, proved now, and the token's first use, in one batch (decision 15 item 5): a refusal leaves it unspent. */
      const spend = await tokenSpend(c.cfg, tokenHash, j.exp);
      const got = await takeSeat(c.db, Object.assign({ kind: "lead" }, s), row.id, c.now, Object.assign({ proved: true }, spend));
      /* No lead seat free is a true refusal (decision 32; an owner's seat always finds room, takeSeat): the token spent, nothing else. */
      if (!got.ok) return got.spent ? badToken() : await spendOnly(c.db, spend, c.now) ? noSeat() : badToken(); /* plant:lead-full-spent */
      await bindPerson(c.db, b.lead, s.person, row.id, c.now);
      const member = await memberCertificate(c.db, c.cfg, row, b, s.person, got.row.code, c.now, true); /* plant:member-signin */
      const studio = await studioCertificate(c, row, b.lead, s.person, got.row.code); /* plant:studio-signin */
      return signedIn(c.cfg, row, b.lead, c.now, Object.assign({ me: got.row.code, owner: !!row.owner && row.owner === s.person }, leadAnswerCerts(studio, member),
        await askOwner(c.db, s, row, c.now) ? { ask: "owner", leads: await leadsFor(c.db, c.cfg, s, c.now) } : {}), c.db, c.env); /* plant:leads-studio */
    },

    /* A QUIET RENEWAL OF A LEAD SEAT (decision 15 item 1). A refreshed ID token carries no nonce, so it binds by four
       conditions together: the request is signed by the key already bound through the token's person, so its sub is the
       seat's; the token judges as signin's does, its nonce, if any, unread; it was issued within RENEW_IAT_MS; and it is
       used once, spent in the batch that proves the seat. A seat freed by the owner is not renewed ("signin"): its person
       signs in afresh. Only a licence that admits the person now is renewed on, never the one the key is bound to by that
       binding alone (Argon's review of the sign-in service, finding 7): none is "no-licence". */
    async "signin/renew"(c) {
      const b = c.body;
      if (!exactly(b, ["provider", "idToken", "lead", "t", "sig"], ["accessToken", "member"]) || typeof b.provider !== "string"
          || !/^[a-z][a-z0-9-]{1,30}$/.test(b.provider) || typeof b.idToken !== "string" || !HEX64.test(String(b.lead))
          || !isT(b.t) || !HEX128.test(String(b.sig)) || (b.accessToken !== undefined && typeof b.accessToken !== "string") || !memberOk(b)) return malformed();
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", b.lead]], c.now)) return slowDown();
      const tokenHash = await Q.tokenHash(b.idToken);
      const no = await signedOk(c.db, c.cfg, b.accessToken === undefined ? Q.signinRenewBytes({ provider: b.provider, tokenHash, lead: b.lead, t: b.t, member: b.member }) /* plant:member-renew-signed */
        : Q.signinRenewManagedBytes({ provider: b.provider, tokenHash, accessHash: await Q.tokenHash(b.accessToken), lead: b.lead, t: b.t, member: b.member }), b.lead, b.sig, b.t, c.now);
      if (no) return no;
      const providers = providersOf(c.env);
      if (!providers) return unavailable();
      const p = providers.get(b.provider);
      if (!p) return badToken();
      const j = await judgeToken(b.idToken, p, providers, c.now);
      if (!j) return badToken();
      if (c.now - j.iat * 1000 > RENEW_IAT_MS) return badToken(); /* plant:renew-iat */
      const s = await personOf(c.cfg, j);
      const bound = await c.db.prepare("SELECT licence, person FROM bindings WHERE lead = ?1").bind(b.lead).first();
      if (!bound || bound.person !== s.person) return badToken(); /* plant:renew-person */
      const seat = await c.db.prepare("SELECT proved_at FROM seats WHERE kind = 'lead' AND person = ?1").bind(s.person).first();
      if (!seat) return badToken();
      if (!(seat.proved_at > 0)) return signinAgain(); /* plant:renew-freed-read */
      const ent = await entraLicence(c.db, s); /* plant:entra-renew */
      s.keep = ent ? CLEAR : j.ident; /* plant:ident-entra-renew */
      if (ent) { const r = await rolesIn(b, p, j, c.now); return r.no || entraLead(c, b, s, j, tokenHash, ent, true, r.roles); }
      const row = await leadLicence(c.db, s.person, c.now); /* plant:renew-admitted */
      if (!row || row.refunded) return noLicence();
      const spend = await tokenSpend(c.cfg, tokenHash, j.exp);
      const got = await takeSeat(c.db, Object.assign({ kind: "lead" }, s), row.id, c.now, Object.assign({ proved: true, renew: true }, spend));
      if (!got.ok) return got.spent ? badToken() : got.displaced /* plant:seat-stay-lead-refusal */ || (got.row && !(got.row.proved_at > 0)) ? signinAgain()
        : await spendOnly(c.db, spend, c.now) ? noSeat() : badToken();
      await bindPerson(c.db, b.lead, s.person, row.id, c.now);
      const member = await memberCertificate(c.db, c.cfg, row, b, s.person, got.row.code, c.now, false); /* plant:member-renew */
      const studio = await studioCertificate(c, row, b.lead, s.person, got.row.code); /* plant:studio-renew */
      return signedIn(c.cfg, row, b.lead, c.now, Object.assign({ me: got.row.code, owner: !!row.owner && row.owner === s.person }, leadAnswerCerts(studio, member),
        await askOwner(c.db, s, row, c.now) ? { ask: "owner", leads: await leadsFor(c.db, c.cfg, s, c.now) } : {}), c.db, c.env);
    },

    /* THE DESK SIGNS ITS PERSON IN ITSELF (night decision 18; the interface of 2026-11-12), signed by its own key, never through
       a lead. A first sign-in carries the seed of the token's nonce, which must be signinNonce(desk, seed), so a token captured
       for one desk is no token for another; the desk key is then held for that person (person_desks), seated or not. A body with
       no seed is the desk's renewal, the provider's refreshed token carrying no nonce, taken by a lead's four conditions
       together: a desk key held for the token's person, so its sub is theirs; iat within RENEW_IAT_MS; and first use, spent in
       the batch that proves the seat. A renewal of a seat its lead freed is "signin". The service chooses the licence
       (deskLicence); where none admits the person, the answer is no certificate and their code, and the desk asks again at its
       next renewal. WHAT IS WRITTEN IS WRITTEN ON PURPOSE (Argon's review of the sign-in service, finding 2; Claude alpha's decision
       32: "'No free seat' is not a refusal, it is a wait"): the desk key is held, and the person made, in the batch that seats it
       (takeSeat's o.held), or, where no licence admits them or their licence has no free seat (THE WAIT, answered ok with no
       certificate and the reason "waiting"), in the batch that spends the token; the lead then lists them, and the desk's next
       quiet renewal seats it once a seat is free. A person's fourth desk ("desks") is a true refusal: the token spent, nothing else. */
    async "signin/desk"(c) {
      /* The record reads each return answer(...) (s110b). This binding adds asked to an ok answer when carryAsked has read a
         request, and leaves the key off when that list is empty. A refusal has ok false, so it carries nothing. */
      /* It adds invited the same way (board 1017, the member invitation): the invitations waiting for this person (invitedOf), read by
         carryAsked, the key left off when there are none. */
      let openAsked = null, openInvited = null;
      const answer = (status, obj) => {
        if (openAsked && openAsked.length && status === 200 && obj && obj.ok === true) obj.asked = openAsked;
        if (openInvited && openInvited.length && status === 200 && obj && obj.ok === true) obj.invited = openInvited; /* plant:desk-invited */
        return answerPlain(status, obj);
      };
      const b = c.body;
      if (!exactly(b, ["provider", "idToken", "desk", "t", "sig"], ["seed", "accessToken", "pooled"]) || typeof b.provider !== "string"
          || !/^[a-z][a-z0-9-]{1,30}$/.test(b.provider) || typeof b.idToken !== "string" || !HEX64.test(String(b.desk))
          || !isT(b.t) || !HEX128.test(String(b.sig)) || (b.seed !== undefined && !HEX64.test(String(b.seed)))
          || (b.accessToken !== undefined && typeof b.accessToken !== "string")
          || (b.pooled !== undefined && b.pooled !== true)) return malformed(); /* plant:desk-pooled-shape */
      /* POOLED (section 12.2 point 3): only a desk whose machine policy sets NonPersistent sends it, and only as true, so the claim is
         the company administrator's; it is signed under its own line, and every answer without it is as before. */
      const pooled = b.pooled === true;
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", b.desk]], c.now)) return slowDown();
      /* The revoked keys' list rides every answer that names a seat or asks for a sign-in, as the check's does; undefined where
         REVOKED is unset, and so absent from the answer. */
      const revoked = revokedOf(c.env).revoked; /* plant:desk-revoked-sent */
      const again = () => answer(403, { ok: false, reason: "signin", revoked });
      /* THE STORE OFFERED (the desk's gate, engine e6648abe, reads it as j.storeOffer === true): every ok answer below says "storeOffer": true
         exactly where a store grant this desk asks once seated would not be answered "unavailable" for want of the store itself, which is
         storeForms (the pinned relay's rules carry the store's forms); otherwise the key is absent, and the answer is byte for byte as before
         it. A Worker's rules are one pin's, so one Worker offers to everybody or to nobody (tests/licence-service.mjs s147). */
      /* THE SWITCH THAT CLOSES IT: the variable STORE_OFFER, exactly the text "closed", takes the key out of every answer without a deploy of
         code or a pin move, so sync ends on each desk at its next seating answer; anything else, unset or mistyped included, leaves
         the offer as the rules make it (a typo never closes it silently, nor breaks sign-in). store/grant and store/end do not read it. */
      const storeOffer = storeForms() && !(c.env && c.env.STORE_OFFER === "closed") ? true : undefined; /* plant:store-offer */
      const tokenHash = await Q.tokenHash(b.idToken);
      /* Four signed forms: plain, managed (the access token's hash beside), and each pooled under a line of its own. */
      const accessHash = b.accessToken === undefined ? undefined : await Q.tokenHash(b.accessToken), later = {};
      const no = await signedOk(c.db, c.cfg, await seedSigned(seed => (accessHash === undefined
        ? (pooled ? Q.signinDeskPooledBytes : Q.signinDeskBytes)({ provider: b.provider, tokenHash, desk: b.desk, t: b.t, seed }) /* plant:desk-pooled-bytes */
        : (pooled ? Q.signinDeskManagedPooledBytes : Q.signinDeskManagedBytes)({ provider: b.provider, tokenHash, accessHash, desk: b.desk, t: b.t, seed })), /* plant:desk-managed-pooled-bytes */
        b.seed, b.desk, b.sig), b.desk, b.sig, b.t, c.now, later);
      if (no) return no;
      const providers = providersOf(c.env);
      if (!providers) return unavailable();
      const p = providers.get(b.provider);
      if (!p) return badToken();
      const j = await judgeToken(b.idToken, p, providers, c.now);
      if (!j) return badToken();
      const renew = b.seed === undefined;
      if (!renew && (j.nonce === null || j.nonce !== await Q.signinNonce(b.desk, b.seed))) return badToken(); /* plant:desk-nonce */
      if (renew && c.now - j.iat * 1000 > RENEW_IAT_MS) return badToken(); /* plant:desk-renew-iat */
      const s = await personOf(c.cfg, j);
      const carryAsked = async () => {
        if (openAsked === null) openAsked = await askedOf(c.db, c.cfg, s.person, c.now);
        if (openInvited === null) openInvited = !s.keep || s.keep.clear || !s.keep.address ? []
          : await invitedOf(c.db, c.cfg, { person: s.person, provider: s.provider, org: s.personal ? null : s.org, address: await addressKeyed(c.cfg, s.keep.address),
            vouched: s.keep.vouched === 1 }, c.now);
      };
      if (renew) {
        /* A key its desk signed out of (signed_at 0) is held no longer: only an interactive sign-in takes it again. */
        const held = await c.db.prepare("SELECT 1 AS h FROM person_desks WHERE person = ?1 AND desk_key = ?2 AND signed_at > 0") /* plant:signout-renew */
          .bind(s.person, b.desk).first();
        if (!held) return badToken(); /* plant:desk-renew-held */
      }
      const once = await seenOnce(c.db, later.digest, c.now); /* plant:desk-seen-later */
      if (once) return once;
      const spend = await tokenSpend(c.cfg, tokenHash, j.exp);
      /* A token already spent is refused before anything is written, so its replay never holds a signed-out key again. */
      const used = await c.db.prepare("SELECT 1 AS u FROM seen WHERE digest = ?1 AND until >= ?2").bind(spend.digest, c.now).first();
      if (used) return badToken(); /* plant:desk-spent-first */
      /* The organisation is kept for the lead's list; a personal account has none, so it is never listed. */
      const heldOrg = s.personal ? null : s.org; /* plant:list-personal */
      const codeOf = async () => (await c.db.prepare("SELECT code FROM persons WHERE person = ?1").bind(s.person).first()).code;
      /* A tenant whose licence follows Entra: a desk seat for Etiuda.Agent or Etiuda.Lead, or none ("no-role"); no trial, no admission. */
      const ent = await entraLicence(c.db, s); /* plant:entra-desk */
      s.keep = ent ? CLEAR : j.ident; /* plant:ident-entra-desk */
      let roles = null, own = null, cause;
      if (ent) {
        const acc = await accessFor(b, p, j, c.now);
        if (acc && acc.need) return accessNeeded();
        if (!acc) return badToken();
        roles = acc.roles;
        own = await ownBefore(c.db, s.person, ent, false); /* plant:own-desk */
        cause = causeOf(own, roles);
      }
      const release = ent && seatRoleOf(roles) ? ent : null; /* plant:release-before-desk */
      const mine = !!ent && !seatRoleOf(roles) && !!own;
      /* An Entra removal is a removal (decision 50) for a company store too (Argon's second review of the sign-in, finding 6): the person's
         company store on the licence ends once the batch that frees their desk seat has spent the token, as at seat/free and person/withdraw. */
      if (ent && !mine && !(roles && (roles.has(ROLE.agent) || roles.has(ROLE.lead)))) { /* plant:entra-desk-role */
        const ended = [];
        if (!await noRole(c.db, spend, "desk", s.person, ent.id, c.now, null, ended)) return badToken();
        if (ended.length) await postEnded(c.db, c.cfg, c.env, ended, c.now);
        return answer(403, { ok: false, reason: "no-role", managed: true });
      }
      /* A PERSON WITH A LICENCE OF THEIR OWN FROM BEFORE THE TURN, WITH NO SEAT ROLE NOW (the Grok re-review of Argon's second review's mend,
         finding 1): removed from the company's licence all the same, as one with none is above, before the desk moves to their own (or waits
         there, or meets "desks"): their pooled places there named freed, their places zeroed, their desk seat there unseen so it counts for
         nobody, the removal stamped where they held one, on the token unspent; then their company store there ends. The seat row keeps its
         proof, so the move to their own licence is the renewal it is and never reads as a seat their lead freed (the person-wide freed read). */
      let mineLeave = null;
      if (mine) {
        const held = !!(await c.db.prepare("SELECT 1 AS h FROM seats WHERE kind = 'desk' AND person = ?1 AND licence = ?2 AND proved_at > 0").bind(s.person, ent.id).first());
        mineLeave = cond => [
          q => "INSERT INTO freed_desks (licence, desk_key, at) SELECT licence, desk_key, " + q(c.now) + " FROM desk_keys WHERE person = " + q(s.person)
            + " AND licence = " + q(ent.id) + " AND pooled = 1 AND seen_at > 0 AND licence IN (SELECT id FROM licences WHERE seat_source = 'entra') AND "
            + cond(q) + " ON CONFLICT (licence, desk_key) DO UPDATE SET at = excluded.at",
          q => "UPDATE desk_keys SET seen_at = 0 WHERE person = " + q(s.person) + " AND licence = " + q(ent.id) + " AND " + cond(q),
          q => "UPDATE seats SET seen_at = 0 WHERE kind = 'desk' AND person = " + q(s.person) + " AND licence = " + q(ent.id) + " AND " + cond(q), /* plant:own-left-seat */
        ].concat(held ? [q => "INSERT INTO removals (licence, person, kind, at) SELECT " + [q(ent.id), q(s.person), "'desk'", q(c.now)].join(", ")
          + " WHERE NOT EXISTS (SELECT 1 FROM licences WHERE id = " + q(ent.id) + " AND owner = " + q(s.person) + ") AND " + cond(q)
          + " ON CONFLICT (licence, person, kind) DO NOTHING"] : []) /* plant:own-left */
          .concat(storeForms() ? [q => "UPDATE stores SET ended_at = " + q(c.now) + " WHERE ended_at = 0 AND person = " + q(s.person)
            + " AND licence = " + q(ent.id) + " AND " + cond(q) + " RETURNING rt, code"] : []); /* plant:own-left-store */
      }
      /* AN INVITATION BY ADDRESS IS NEVER TAKEN AT A SIGN-IN (board 1017; Claude alpha's word of 2026-11-22, carried by Claudius: "Join is the only
         way. Nobody is put on a team or a licence at sign-in by another person's act alone, whether or not they hold anything. The invitation
         waits, and their own Join press takes it."). It replaces the take at the first sign-in of a person who held nothing (the ruling of
         2026-11-16 22:15, "or at the person's own sign-in when invited by address", and Claude alpha's E3 of 2026-11-17). A sign-in, interactive
         or quiet, writes nothing of an invitation: it lists those waiting (invitedOf), and the person's own Join (ask) takes one the safeguard
         holds, or makes a request a lead confirms where it does not (board 1017's rule 1). */
      const also = cond => [] /* plant:signin-takes-no-invite */
        /* A person freed from a licence by name who is diverted by a fresh sign-in onto their own desk trial has proved themselves after the
           removal, so that removal stamp goes in the same batch that seats them on the trial and purgeRetention keeps their admission while
           they sit on it or renew onto waiting (review 47, finding 15). */
        .concat(!ent && !renew && row && row.desk_only === 1 && isTrial(row) && row.owner === s.person ? [
          q => "DELETE FROM removals WHERE kind = 'desk' AND person = " + q(s.person) + " AND EXISTS (SELECT 1 FROM admits a JOIN licences l "
            + "ON l.id = a.licence WHERE a.licence = removals.licence AND a.org = " + q(PERSON + s.person) + " AND l.seat_source = 'admit' "
            + "AND l.refunded = 0 AND ((l.trial_ends IS NULL AND l.paid_until > " + q(c.now) + ") OR l.trial_ends > " + q(c.now) + ")) AND " + cond(q), /* plant:desk-trial-clears-removal */
        ] : []);
      let row = ent ? ((mine ? own : ent) && running(mine ? own : ent, c.now) ? (mine ? own : ent) : null) : await deskLicence(c.db, s, c.now, renew);
      if (!ent && !renew && (!row || ownTrialFirst(row, s.person))) { /* plant:desk-trial-beside */
        await startTrial(c.db, s, DESK_TRIAL + s.person, c.now, { deskOnly: true, digest: spend.digest });
        row = await deskLicence(c.db, s, c.now); } /* plant:desk-trial */
      /* ASK YOUR LEAD (decision 47's addition, with Claude alpha's edit of 15:18): a person their organisation's licence does not seat,
         its owner's switch seating only people admitted, is told so beside what they are answered, their own trial included, never
         in its place; a lead's later admission moves them at their next sign-in (by name before anything else). With the switch on,
         such a person is seated by the organisation and never reaches the ask. */
      const ask = !s.personal && (!row || row.desk_only === 1 || (row.trial_ends !== null && row.trial_ends !== undefined))
        && await orgHolds(c.db, s.provider, s.org, c.now); /* plant:ask-lead */
      /* THE LEADS TO ASK beside it (the one act; leadsFor). */
      const leads = ask ? await leadsFor(c.db, c.cfg, s, c.now) : null; /* plant:leads-desk */
      /* Signed in with no seat taken: the token spent, once, and the person and the desk key held only by the batch that spends it
         (each where it is still unspent, before the statement that spends it), and held again at a renewal on a licence whose seats
         follow Entra, so its administrator's card counts the desk waiting. False where another request spent it first. */
      const holdAndSpend = async () => {
        const leave = mineLeave ? mineLeave(unspent(spend)).map(build => statementOf(c.db, build)) : [];
        const base = [c.db.prepare("DELETE FROM seen WHERE until < ?1").bind(c.now), personRow(c.db, s, c.now, spend.digest)]
          .concat(s.keep ? [statementOf(c.db, q => identStatement(q, s, c.now, unspent(spend)(q)))] : []) /* plant:ident-wait */
          .concat(renew && !ent ? [] : [c.db.prepare("INSERT INTO person_desks (person, desk_key, signed_at, org) SELECT ?1, ?2, ?3, ?4 " /* plant:wait-held */
            + "WHERE NOT EXISTS (SELECT 1 FROM seen WHERE digest = ?5) "
            + "ON CONFLICT (person, desk_key) DO UPDATE SET signed_at = excluded.signed_at, org = excluded.org")
            .bind(s.person, b.desk, c.now, heldOrg, spend.digest)])
          .concat(release ? releaseBefore(s.person, release, unspent(spend)).map(build => statementOf(c.db, build)) : []) /* plant:release-wait */
          .concat(also(unspent(spend)).map(build => statementOf(c.db, build)))
          .concat(leave);
        const storeAt = mineLeave && storeForms() ? base.length - 1 : -1;
        const res = await c.db.batch(base
          /* A FRESH SIGN-IN THAT WAITS HAS PROVED ITS PERSON (Argon's second review of the sign-in, finding 10): a desk seat its lead or a
             removal freed is proved again now, still unseen, so it counts for nobody until a seat is free, its next quiet renewal takes it
             then, and the administrator's card counts it waiting; a renewal proves nothing here, as it never retakes a freed seat. A SEAT FREED
             ON ANOTHER LICENCE comes here too (review 48's finding 9, Claude alpha's words: "freed on A, waiting on B: quiet renewals 403 until a
             fresh sign-in"): this sign-in has proved its person afresh, so the seat their lead freed elsewhere waits on this licence, unseen. */
          .concat(!renew && row ? [statementOf(c.db, q => "UPDATE seats SET licence = " + q(row.id) + ", provider = " + q(s.provider)
            + ", org = " + q(s.org) + ", tid = " + q(s.tid) + ", oid = " + q(s.oid)
            + ", seen_at = CASE WHEN licence = " + q(row.id) + " THEN seen_at ELSE 0 END, proved_at = " + q(c.now)
            + " WHERE kind = 'desk' AND person = " + q(s.person) + " AND ((licence = " + q(row.id) + " AND proved_at = 0) OR proved_at = 0" /* plant:wait-freed-anywhere */
            + " OR EXISTS (SELECT 1 FROM removals r WHERE r.licence = " + q(row.id) + " AND r.person = " + q(s.person) + " AND r.kind = 'desk'))" /* plant:wait-diverted-proves */
            /* A WAIT NEVER OVERWRITES A SEAT HELD ELSEWHERE (review 47's finding 1, Claude alpha's words: "a wait never overwrites a seen, proved
               seat on another running licence"): a seat on another licence still running, seen within that licence's grace and proved within
               its window, as takeSeat counts a seat, stays where it is; only a seat freed here, or one whose licence has ended or which no
               longer holds there, is brought back to wait on this licence. */
            + " AND NOT EXISTS (SELECT 1 FROM licences h WHERE h.id = seats.licence AND h.id <> " + q(row.id) + " AND h.refunded = 0"
            + " AND ((h.trial_ends IS NULL AND h.paid_until > " + q(c.now) + ") OR h.trial_ends > " + q(c.now) + ")"
            + " AND seats.seen_at > " + q(c.now) + " - h.grace_days * " + q(DAY)
            + " AND seats.proved_at > " + q(c.now) + " - (CASE h.seat_source WHEN 'entra' THEN " + q(ENTRA_PROOF_MS) + " ELSE " + q(PROOF_MS) + " END))" /* plant:wait-held-elsewhere */
            + " AND " + unspent(spend)(q))] : []) /* plant:wait-proves */
          .concat([c.db.prepare("INSERT INTO seen (digest, until) VALUES (?1, ?2) ON CONFLICT (digest) DO NOTHING").bind(spend.digest, spend.until)]));
        const ok = res[res.length - 1].meta.changes === 1; /* plant:desk-none-once */
        if (ok && storeAt >= 0) await postEnded(c.db, c.cfg, c.env, res[storeAt].results, c.now);
        return ok;
      };
      if (!row) {
        /* Signed in, and no licence admits them yet. */
        if (!await holdAndSpend()) return badToken();
        await carryAsked();
        const code = await codeOf(), trials = await trialsOf(c.db, s.person); /* plant:desk-trials-none */
        const { pays: bPays, held: bHeld } = await buyerOf(c.db, c.env, s.person, c.now); /* plant:desk-buyer-none */
        if (ent) return answer(200, { ok: true, certificate: null, code, managed: true, trials, revoked, storeOffer, pays: bPays, held: bHeld });
        return ask ? answer(200, { ok: true, certificate: null, code, ask: "lead", leads, trials, revoked, storeOffer, pays: bPays, held: bHeld }) : answer(200, { ok: true, certificate: null, code, trials, revoked, storeOffer, pays: bPays, held: bHeld });
      }
      /* A pooled claim is honoured only on a licence its attach allowed (pooled_ok); elsewhere this is an ordinary desk, so the claim,
         the desk's own word, cannot lift the person's cap (the test architect's finding of 2026-11-14). */
      /* ...or an Entra licence, whose company administrator sets NonPersistent by the same policy that makes it managed (the relay seats'
         grace reads the mark there, option (b)). */
      const allows = pooled ? await c.db.prepare("SELECT pooled_ok FROM licences WHERE id = ?1").bind(row.id).first() : null;
      const honoured = pooled && ((!!allows && allows.pooled_ok === 1) || row.seat_source === "entra"); /* plant:pooled-allowed */
      /* A desk seat freed, on whichever licence it is (Grok's second review of the sign-in, finding 2): the person has one, and a renewal onto
         another licence the service now chooses would skip the fresh sign-in the free asks for, as signin/renew's lead read never does. */
      const freed = () => c.db.prepare("SELECT 1 AS f FROM seats WHERE kind = 'desk' AND person = ?1 AND proved_at = 0").bind(s.person).first(); /* plant:desk-freed-anywhere */
      if (renew && await freed()) return again(); /* plant:desk-renew-freed-read */
      const got = await takeSeat(c.db, Object.assign({ kind: "desk" }, s), row.id, c.now,
        Object.assign({ proved: true, deskKey: b.desk, pooled: honoured /* plant:desk-pooled-read */, notFreed: renew, held: renew ? null : { org: heldOrg }, window: windowOf(row), release, mineLeave, also }, spend));
      if (!got.ok) {
        if (got.spent) return badToken();
        if (renew && (got.displaced /* plant:seat-stay-desk-refusal */ || await freed())) return again();
        if (got.desks.others >= DESKS_PER_PERSON) return await spendOnly(c.db, spend, c.now) ? answer(409, { ok: false, reason: "desks" }) : badToken(); /* plant:desks-spent */
        /* THE WAIT (decision 32): no free seat on their licence; signed in, held, listed, and seated by a later renewal. */
        if (!await holdAndSpend()) return badToken();
        await carryAsked();
        const trials = await trialsOf(c.db, s.person); /* plant:desk-trials-wait */
        const { pays: bPays, held: bHeld } = await buyerOf(c.db, c.env, s.person, c.now); /* plant:desk-buyer-wait */
        if (ent) return cause ? answer(200, { ok: true, certificate: null, code: await codeOf(), reason: "waiting", managed: true, cause, trials, revoked, storeOffer, pays: bPays, held: bHeld })
          : answer(200, { ok: true, certificate: null, code: await codeOf(), reason: "waiting", managed: true, trials, revoked, storeOffer, pays: bPays, held: bHeld });
        return answer(200, { ok: true, certificate: null, code: await codeOf(), reason: "waiting", trials, revoked, storeOffer, pays: bPays, held: bHeld });
      }
      if (got.ended.length) await postEnded(c.db, c.cfg, c.env, got.ended, c.now);
      await carryAsked();
      /* The doors on that licence ride with the certificate (the door-finding), so a new computer finds its team, signed by the key
         that signed the certificate, over seatDoorsBytes, so a desk takes no door this service did not hand it (decision 35). */
      const code = await codeOf(), certificate = await certificateFor(c.cfg, row, b.desk, s.person, code, c.now, honoured);
      const doors = await doorsOf(c.db, row.id, s.person, c.now); /* plant:door-hand */
      const doorsSig = await signHex(c.cfg, Q.seatDoorsBytes({ certificate, doors })); /* plant:door-sign */
      /* Beside the certificate and outside every signature: what the seat is, and the person's trials (seatOf, trialsOf). */
      const seat = await seatOf(c.db, row, s.person), trials = await trialsOf(c.db, s.person); /* plant:desk-seat-words */
      const { pays: bPays, held: bHeld } = await buyerOf(c.db, c.env, s.person, c.now); /* plant:desk-buyer */
      /* A tenant whose licence follows Entra is told so, and why where the person holds a licence of their own (Claude alpha, 21:34). */
      if (ent) return cause ? answer(200, { ok: true, certificate, code, doors, doorsSig, managed: true, cause, seat, trials, revoked, storeOffer, pays: bPays, held: bHeld })
        : answer(200, { ok: true, certificate, code, doors, doorsSig, managed: true, seat, trials, revoked, storeOffer, pays: bPays, held: bHeld });
      return ask ? answer(200, { ok: true, certificate, code, doors, doorsSig, ask: "lead", leads, seat, trials, revoked, storeOffer, pays: bPays, held: bHeld }) : answer(200, { ok: true, certificate, code, doors, doorsSig, seat, trials, revoked, storeOffer, pays: bPays, held: bHeld });
    },

    /* A DESK SIGNS OUT (night decision 20 (a)), signed by its own key: that computer's place among its person's three is freed
       at once, on every licence and for every person it held, and its renewal is taken no longer. The seat stays the person's
       and nothing is removed. Answered alike whether or not the key held a place, so the answer tells a stranger nothing. */
    async "signout/desk"(c) {
      const b = c.body;
      if (!exactly(b, ["desk", "t", "sig"]) || !HEX64.test(String(b.desk)) || !isT(b.t) || !HEX128.test(String(b.sig))) return malformed();
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", b.desk]], c.now)) return slowDown();
      const no = await signedOk(c.db, c.cfg, Q.signoutDeskBytes({ desk: b.desk, t: b.t }), b.desk, b.sig, b.t, c.now);
      if (no) return no;
      await c.db.batch([
        /* A pooled desk's place freed here is named to the relay as freed, as one taken over is (Argon's second review, finding 8). */
        freedPooled(c.db, "desk_key = ?1", [b.desk], c.now), /* plant:signout-freed */
        c.db.prepare("UPDATE desk_keys SET seen_at = 0 WHERE desk_key = ?1").bind(b.desk), /* plant:signout-place */
        c.db.prepare("UPDATE person_desks SET signed_at = 0 WHERE desk_key = ?1").bind(b.desk), /* plant:signout-held */
      ]);
      return answer(200, { ok: true });
    },

    /* A LEAD ADMITS A PERSON BY THEIR CODE (night decision 18, choice 3): a key bound by sign-in through a person who leads the
       licence (a lead seat on it, proved within PROOF_DAYS) or owns it adds the person whose code it is to the licence's admits,
       as "person:" and their keyed hash, so their desks are seated there at their next sign-in or renewal. The lead learns the
       person's pseudonym on its licence and nothing else. A key holding no such seat and a code nobody holds are refused alike. */
    async "person/admit"(c) {
      const b = c.body;
      /* BY AN ASK (the one act, acceptAsk), under its own signed line, or BY A CODE as before (kept as the hidden fallback the design names). */
      const byAsk = b.ask !== undefined;
      if ((byAsk ? !exactly(b, ["ask", "lead", "t", "sig"], ["team"]) || !ASK_ID_RE.test(String(b.ask)) || (b.team !== undefined && !DOOR_TEAM_RE.test(String(b.team)))
          : !exactly(b, ["code", "lead", "t", "sig"]) || !SEAT_CODE_RE.test(String(b.code))) || !HEX64.test(String(b.lead))
          || !isT(b.t) || !HEX128.test(String(b.sig))) return malformed();
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", b.lead]], c.now)) return slowDown();
      const no = await signedOk(c.db, c.cfg, byAsk ? Q.personAdmitAskBytes({ ask: b.ask, team: b.team, lead: b.lead, t: b.t })
        : Q.personAdmitBytes({ code: b.code, lead: b.lead, t: b.t }), b.lead, b.sig, b.t, c.now);
      if (no) return no;
      if (await managedKey(c.db, b.lead)) return managed(); /* plant:managed-admit */
      const mine = await leadOf(c.db, b.lead, c.now);
      if (!mine) return noSeatHere();
      if (byAsk) return acceptAsk(c, b, mine);
      const who = await c.db.prepare("SELECT person, provider FROM persons WHERE code = ?1").bind(b.code).first();
      if (!who) return noSeatHere();
      /* The admission is the licence's, and which lead made it is kept beside it (decision 27 (a)), so one lead's withdrawal
         leaves another's standing. */
      await c.db.batch([
        c.db.prepare("INSERT INTO admits (licence, provider, org) VALUES (?1, ?2, ?3) ON CONFLICT DO NOTHING")
          .bind(mine.licence, who.provider, PERSON + who.person),
        c.db.prepare("INSERT INTO admitted_by (licence, person, lead) VALUES (?1, ?2, ?3) ON CONFLICT DO NOTHING")
          .bind(mine.licence, who.person, mine.person), /* plant:admit-by */
      ]);
      return answer(200, { ok: true, admitted: b.code, person: await personOutOf(c.cfg, mine.licence, who.person) });
    },

    /* A LEAD WITHDRAWS AN ADMISSION BY NAME (night decision 22: "Remove means out"): a key leadOf admits names a person by the
       pseudonym person/admit and their certificates gave it, and the licence's "person:" row for them is deleted while, in the
       same batch, their desk seats there are marked unseen and unproved and their desks' places freed, as seat/free frees them;
       nothing else is deleted. They take no seat on it until a lead admits them again and they sign in. Only that row goes: an
       organisation's tenant or domain admission, which may still seat the same person, is not touched. The licence's owner is
       never withdrawn, nor a lead seat's person but by the owner, since only the owner frees a lead (decision 15 (b)). A
       person not admitted so, or kept by either rule, is answered alike, so the answer tells a lead nothing and a retry is safe.
       EACH LEAD'S OWN (decision 27 (a), and Claude alpha's word of 08:44: "If two leads on one licence can each have admitted the
       same person, the other lead's admission must not fall with it"): admitted_by keeps which leads admitted the person, and
       while another lead still holding a lead seat here has admitted them, only this lead's own row there goes and the person
       keeps their seat. An admission kept with no lead beside it (made before 0007) goes as before. THE OWNER TAKING OUT A
       CO-LEAD (decision 27 (c)): every lead's admission of them goes, since only the owner frees a lead, and their lead seat is
       freed in the same batch, as seat/free frees one. */
    async "person/withdraw"(c) {
      const b = c.body;
      if (!exactly(b, ["person", "lead", "t", "sig"], ["team"]) || !HEX64.test(String(b.person)) || !HEX64.test(String(b.lead))
          || !isT(b.t) || !HEX128.test(String(b.sig)) || (b.team !== undefined && !DOOR_TEAM_RE.test(String(b.team)))) return malformed();
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", b.lead]], c.now)) return slowDown();
      const no = await signedOk(c.db, c.cfg, Q.personWithdrawBytes({ person: b.person, team: b.team, lead: b.lead, t: b.t }), b.lead, b.sig, b.t, c.now);
      if (no) return no;
      if (await managedKey(c.db, b.lead)) return managed(); /* plant:managed-withdraw */
      const mine = await leadOf(c.db, b.lead, c.now);
      if (!mine) return noSeatHere(); /* plant:withdraw-lead */
      /* OFF ONE TEAM ONLY, with `team` (board 1017's B; the test architect's read of ec990251: a lead's Remove must hold on its other computer, and be
         judged on one clock): the asker's own admission of that person stops placing them on that team, so person/list names the team for them on
         no computer of this lead's until a place made after this one; their admission to the licence, their seat and their other teams stay.
         Answered alike whether or not that admission placed them there. */
      if (b.team !== undefined) {
        /* Claude alpha's condition 1 (2026-11-22): only a team the asking lead leads, as leadsTeam reads one; any other is refused, nothing written. */
        if (!await leadsTeam(c.db, mine.licence, mine.person, b.team)) return noSeatHere(); /* plant:withdraw-team-lead */
        const own = await c.db.prepare("SELECT person FROM admitted_by WHERE licence = ?1 AND lead = ?2 AND team = ?3").bind(mine.licence, mine.person, b.team).all();
        for (const r of own.results) {
          if (await personOutOf(c.cfg, mine.licence, r.person) !== b.person) continue;
          await c.db.prepare("UPDATE admitted_by SET team = NULL WHERE licence = ?1 AND person = ?2 AND lead = ?3 AND team = ?4") /* plant:withdraw-team */
            .bind(mine.licence, r.person, mine.person, b.team).run();
        }
        return answer(200, { ok: true });
      }
      const rows = await c.db.prepare("SELECT provider, org FROM admits WHERE licence = ?1 AND substr(org, 1, ?2) = ?3")
        .bind(mine.licence, PERSON.length, PERSON).all();
      for (const r of rows.results) {
        const person = r.org.slice(PERSON.length);
        if (await personOutOf(c.cfg, mine.licence, person) !== b.person) continue;
        const kept = await c.db.prepare("SELECT 1 AS k FROM licences WHERE id = ?1 AND (owner = ?2 OR (?3 = 0 AND EXISTS (SELECT 1 FROM lead_names "
          + "WHERE person = ?2 AND licence = ?1)))").bind(mine.licence, person, mine.owner ? 1 : 0).first();
        if (kept) break; /* plant:withdraw-kept */
        /* A LEAD WHO DOES NOT OWN THE LICENCE WITHDRAWS ONLY WHAT IT MAY FREE (Argon's second review of the sign-in, finding 2; FREES_DESK,
           decision 46): a person it admitted itself, or one no lead is recorded as admitting (made before 0007, as before), never one only
           another lead admitted, that lead's seat freed or not; and where the organisation seats them (their seat's organisation admitted
           here and the owner's switch on), their "person:" row goes as before but their seat, desks and company store stay, so admitting a
           colleague by code is no way round seat/free's "not-yours". */
        if (!mine.owner && !await c.db.prepare("SELECT 1 AS k WHERE EXISTS (SELECT 1 FROM admitted_by WHERE licence = ?1 AND person = ?2 AND lead = ?3) "
          + "OR NOT EXISTS (SELECT 1 FROM admitted_by WHERE licence = ?1 AND person = ?2)").bind(mine.licence, person, mine.person).first()) break; /* plant:withdraw-own */
        const byOrg = !mine.owner && !!(await c.db.prepare("SELECT 1 AS k FROM seats s JOIN licences l ON l.id = s.licence WHERE s.kind = 'desk' AND s.person = ?2 "
          + "AND s.licence = ?1 AND l.org_desks = 1 AND EXISTS (SELECT 1 FROM admits a WHERE a.licence = ?1 AND a.provider = s.provider AND a.org = s.org "
          + "AND a.org <> ?3 || ?2)").bind(mine.licence, person, PERSON).first()); /* plant:withdraw-org */
        const coLead = !!mine.owner && !!(await c.db.prepare("SELECT 1 AS k FROM lead_names WHERE person = ?1 AND licence = ?2")
          .bind(person, mine.licence).first());
        const other = !coLead && await c.db.prepare("SELECT 1 AS k FROM admitted_by a WHERE a.licence = ?1 AND a.person = ?2 AND a.lead <> ?3 "
          + "AND EXISTS (SELECT 1 FROM seats s WHERE s.kind = 'lead' AND s.person = a.lead AND s.licence = a.licence AND s.proved_at > 0) "
          + "AND (a.lead = (SELECT owner FROM licences WHERE id = ?1) OR EXISTS (SELECT 1 FROM lead_names n WHERE n.licence = ?1 AND n.person = a.lead))")
          .bind(mine.licence, person, mine.person).first(); /* plant:withdraw-other */
        if (other) {
          await c.db.prepare("DELETE FROM admitted_by WHERE licence = ?1 AND person = ?2 AND lead = ?3").bind(mine.licence, person, mine.person).run();
          break;
        }
        /* Every desk key of the seat this frees goes to freed_desks at the instant of the act, as seat/free writes it (a lead's own act). */
        const frees = byOrg ? [] : [
          c.db.prepare("INSERT INTO freed_desks (licence, desk_key, at) SELECT licence, desk_key, ?3 FROM desk_keys WHERE person = ?1 AND licence = ?2 AND " + NOBODY_ELSE_ON_KEY + " " /* plant:withdraw-shared */
            + "ON CONFLICT (licence, desk_key) DO UPDATE SET at = excluded.at").bind(person, mine.licence, c.now), /* plant:withdraw-freed */
          c.db.prepare("UPDATE seats SET seen_at = 0, proved_at = 0 WHERE kind = 'desk' AND person = ?1 AND licence = ?2").bind(person, mine.licence), /* plant:withdraw-seat */
          c.db.prepare("UPDATE desk_keys SET seen_at = 0 WHERE person = ?1 AND licence = ?2").bind(person, mine.licence), /* plant:withdraw-desks */
        ];
        const res = await c.db.batch([
          c.db.prepare("DELETE FROM admits WHERE licence = ?1 AND provider = ?2 AND org = ?3").bind(mine.licence, r.provider, r.org), /* plant:withdraw-row */
        ].concat(frees, [
          c.db.prepare("DELETE FROM admitted_by WHERE licence = ?1 AND person = ?2").bind(mine.licence, person),
          c.db.prepare("UPDATE seats SET seen_at = 0, proved_at = 0 WHERE kind = 'lead' AND person = ?1 AND licence = ?2 AND ?3 = 1")
            .bind(person, mine.licence, coLead ? 1 : 0), /* plant:withdraw-co-lead */
        ], byOrg ? [] : [removalStamp(c.db, mine.licence, person, "desk", c.now)]) /* plant:removal-withdraw */
          .concat(coLead ? [removalStamp(c.db, mine.licence, person, "lead", c.now)] : [])
          .concat(coLead ? unnamed(c.db, mine.licence, person, mine.person) : [])
          .concat(!byOrg && storeForms() ? [c.db.prepare("UPDATE stores SET ended_at = ?3 WHERE ended_at = 0 AND person = ?1 AND licence = ?2 RETURNING rt, code")
            .bind(person, mine.licence, c.now)] : [])); /* plant:store-withdraw */
        if (!byOrg && storeForms()) await postEnded(c.db, c.cfg, c.env, res[res.length - 1].results, c.now);
        break;
      }
      return answer(200, { ok: true });
    },

    /* THE LEAD'S LIST OF PEOPLE (night decision 20 (c); the Team screen), asked by the leads person/admit admits for: the people
       whose desk signed in within LIST_DAYS from an organisation the licence admits, newest first, at most LIST_MAX, each by code,
       the pseudonym a certificate on this licence names, and the day. Nothing from the provider. A personal account is never
       here (no organisation is kept for it), nor a desk signed out. Anyone else is answered as a key with no seat. */
    async "person/list"(c) {
      const b = c.body;
      if (!exactly(b, ["lead", "t", "sig"]) || !HEX64.test(String(b.lead)) || !isT(b.t) || !HEX128.test(String(b.sig))) return malformed();
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", b.lead]], c.now)) return slowDown();
      const no = await signedOk(c.db, c.cfg, Q.personListBytes({ lead: b.lead, t: b.t }), b.lead, b.sig, b.t, c.now);
      if (no) return no;
      if (await managedKey(c.db, b.lead)) return managed(); /* plant:managed-list */
      const mine = await leadOf(c.db, b.lead, c.now);
      if (!mine) return noSeatHere();
      /* THE ASKER'S OWN TEAM (a team is its lead's own): the people it admitted by name; for the owner also those a lead no longer
         leading admitted, and the organisation's colleagues no lead now leading admitted. `added`: seated by name, or by the
         organisation where the owner's switch seats colleagues; a colleague not added waits for an Add. */
      const STANDING = "(x.lead = l.owner OR EXISTS (SELECT 1 FROM lead_names n WHERE n.licence = ?1 AND n.person = x.lead))";
      const VIA_ORG = "d.org IN (SELECT org FROM admits WHERE licence = ?1 AND provider = p.provider)"; /* plant:list-org */
      /* SEATED NOW, for person column `who` (board 1017's B): their desk seat on this licence not freed or withdrawn, proved within PROOF_DAYS and
         seen within the licence's grace. One text for both queries below, so each condition's plant reaches both. */
      const SEATED = who => "EXISTS (SELECT 1 FROM seats s WHERE s.kind = 'desk' AND s.person = " + who + " AND s.licence = ?1 "
        + "AND s.proved_at > ?6 " /* plant:list-seated-proved */
        + "AND s.seen_at > ?7 - l.grace_days * ?8) AS seated "; /* plant:list-seated-grace */
      const rows = await c.db.prepare("SELECT d.person AS person, p.code AS code, p.name AS name, p.address AS address, MAX(d.signed_at) AS at, MAX(" + VIA_ORG + ") AS viaOrg, "
        + "EXISTS (SELECT 1 FROM admits WHERE licence = ?1 AND provider = p.provider AND org = ?5 || d.person) AS byName, l.org_desks AS orgDesks, "
        + "(SELECT x.team FROM admitted_by x WHERE x.licence = ?1 AND x.person = d.person AND x.lead = ?4) AS team, " /* plant:list-row-team */
        + SEATED("d.person")
        + "FROM person_desks d JOIN persons p ON p.person = d.person JOIN licences l ON l.id = ?1 WHERE d.signed_at > ?2 " /* plant:list-recent */
        + "AND (EXISTS (SELECT 1 FROM admitted_by x WHERE x.licence = ?1 AND x.person = d.person AND x.lead = ?4) " /* plant:list-team */
        + "OR (?4 = l.owner AND (EXISTS (SELECT 1 FROM admitted_by x WHERE x.licence = ?1 AND x.person = d.person AND NOT " + STANDING + ") " /* plant:list-orphans */
        + "OR (" + VIA_ORG + " AND NOT EXISTS (SELECT 1 FROM admitted_by x WHERE x.licence = ?1 AND x.person = d.person AND " + STANDING + "))))) " /* plant:list-owner-org */
        + "GROUP BY d.person ORDER BY at DESC, p.code LIMIT ?3").bind(mine.licence, c.now - LIST_DAYS * DAY, LIST_MAX, mine.person, PERSON, c.now - PROOF_MS, c.now, DAY).all(); /* plant:list-max */
      /* THE TEAM AND THE SEAT (board 1017, fold 95's B: a member seated by their own Join is let in at their relay team's door; Claude alpha's
         conditions of 2026-11-22: carried "only for teams the asking lead leads, never for a team of another lead on the same licence"): `team`
         is the door team the asker's own admission placed the person on (admitted_by.team, written by a Join, a confirm or a team-named
         admission), where the asker sets that door now (doors, as leadsTeam reads one), else null; `seated`, beside a team only, whether the
         person's desk seat on this licence is held now: not freed or withdrawn, proved within PROOF_DAYS and seen within the grace. */
      const ownTeams = new Set((await c.db.prepare("SELECT d.team AS team FROM doors d JOIN bindings b ON b.lead = d.lead AND b.licence = d.licence "
        + "WHERE d.licence = ?1 AND b.person = ?2").bind(mine.licence, mine.person).all()).results.map(r => r.team));
      /* EVERY PERSON THE ASKER'S OWN ADMISSION PLACED ON ONE OF ITS OWN TEAMS (the test architect's finding 2 on c2ccb0e1): listed whatever their
         last interactive sign-in and outside LIST_MAX, since a Join, or a desk that only renews quietly, writes no sign-in the window counts, and
         the lead's watch must find every member of its relay teams; so a person missing from the list is on none of them. At most one row per
         person, after the window's rows, newest sign-in first; bounded by the teams' own size. */
      const inWindow = new Set(rows.results.map(r => r.person));
      const joinedRows = await c.db.prepare("SELECT x.person AS person, p.code AS code, p.name AS name, p.address AS address, MAX(d.signed_at) AS at, MAX(" + VIA_ORG + ") AS viaOrg, "
        + "EXISTS (SELECT 1 FROM admits WHERE licence = ?1 AND provider = p.provider AND org = ?5 || x.person) AS byName, l.org_desks AS orgDesks, "
        + "x.team AS team, " + SEATED("x.person")
        + "FROM admitted_by x JOIN persons p ON p.person = x.person JOIN person_desks d ON d.person = x.person JOIN licences l ON l.id = ?1 "
        + "WHERE x.licence = ?1 AND x.lead = ?4 " /* plant:list-joined-lead */
        + "AND x.team IN (SELECT dd.team FROM doors dd JOIN bindings bb ON bb.lead = dd.lead AND bb.licence = dd.licence WHERE dd.licence = ?1 AND bb.person = ?4) " /* plant:list-joined-team */
        + "GROUP BY x.person ORDER BY at DESC, p.code")
        .bind(mine.licence, c.now - LIST_DAYS * DAY, LIST_MAX, mine.person, PERSON, c.now - PROOF_MS, c.now, DAY).all();
      for (const r of joinedRows.results) if (!inWindow.has(r.person)) rows.results.push(r); /* plant:list-joined-all */
      const people = [];
      for (const r of rows.results) people.push({ code: r.code, person: await personOutOf(c.cfg, mine.licence, r.person), signedIn: dayOf(r.at),
        added: r.byName === 1 || (r.viaOrg === 1 && r.orgDesks === 1) }); /* plant:list-added */
      rows.results.forEach((r, i) => { const team = typeof r.team === "string" && ownTeams.has(r.team) ? r.team : null; /* plant:list-team-own */
        people[i].team = team;
        if (team !== null) people[i].seated = r.seated === 1; });
      /* What the service keeps of each (option A; the design's 1.2: "names and addresses on every row"), ONLY ON A ROW WHOSE PERSON IS ADDED (the
         test architect's hold 2 on S2: Max, 22:15, quoted back, "That press is what sends their name and address to the lead, so it's the moment
         they agree to share them"; the design's 2.2 gives them for the people ON the licence): a colleague who signed in and was not added pressed
         nothing, so their row carries none; their name and address arrive with their own ask (asks, below) or with the seat. */
      rows.results.forEach((r, i) => { const on = people[i].added === true; /* plant:list-shown */
        Object.assign(people[i], { name: on ? r.name : null, address: on ? r.address : null }); });
      /* THE ONE ACT: the open asks naming this lead, or every open ask for the owner, each with the name and address kept of its person (shown
         because their own press sent them, the design's 2.2), where it came from, desk or Studio, the team and when it ends; and the open
         invitations this lead made, or every one for the owner, each address with its team and end. */
      const own = mine.owner ? 1 : 0, cut = c.now - ASK_MS;
      const askRows = await c.db.prepare("SELECT a.id AS id, a.person AS person, a.kind AS kind, a.team AS team, a.source AS source, a.at AS at, p.name AS name, "
        + "p.address AS address, p.vouched AS vouched, p.provider AS provider, p.domain AS domain, CASE a.kind WHEN 'desk' THEN (SELECT d.org FROM person_desks d WHERE d.person = a.person "
        + "ORDER BY d.signed_at DESC LIMIT 1) ELSE (SELECT s.org FROM seats s WHERE s.kind = 'lead' AND s.person = a.person) END AS org "
        + "FROM asks a LEFT JOIN persons p ON p.person = a.person WHERE a.licence = ?1 AND a.state = 'open' AND a.at > ?2 "
        + "AND (a.lead = ?3 OR ?4 = 1) ORDER BY a.at DESC, a.id LIMIT ?5").bind(mine.licence, cut, mine.person, own, LIST_MAX).all(); /* plant:list-asks */
      const asks = [];
      /* WHAT THE PROVIDER SAYS OF THE PERSON BESIDE EVERY ASK (board 1017's rule 1: the person is confirmed "shown with what the provider says of
         them (name, provider, account kind)"): their name, the address their own sign-in gave, whether their provider vouched it, the provider,
         and the account kind ("work" for an organisation's account, "personal" for one that is its own organisation). An unconfirmed ask is
         one the person pressed on an invitation the safeguard could not take, so it carries the name as any ask does: their press sent it (the
         design's 2.2; the test architect's hold 6 held while a sign-in wrote such an ask with no press, which none does now). */
      /* HOW MANY CLAIM ONE INVITATION (board 1017, Claude alpha's word of 2026-11-22: "a count of the people who have claimed each naming and each
         invitation"): an unconfirmed ask is a claim on the invitation to the address its person's sign-in gave; claimants counts the open
         unconfirmed asks on this licence whose person gives the same address (keyed as the invitation keeps it), and each invitation below says
         how many claim it. Read from every open unconfirmed ask on the licence, whichever lead it names. */
      const claimRows = await c.db.prepare("SELECT p.address AS address FROM asks a JOIN persons p ON p.person = a.person WHERE a.licence = ?1 AND a.state = 'open' AND a.at > ?2 "
        + "AND a.source = 'unconfirmed'").bind(mine.licence, cut).all();
      const claims = new Map();
      for (const r of claimRows.results) { const k = await addressKeyed(c.cfg, r.address); if (k) claims.set(k, (claims.get(k) || 0) + 1); } /* plant:claims-count */
      for (const r of askRows.results) asks.push(Object.assign({ ask: r.id, person: await personOutOf(c.cfg, mine.licence, r.person), name: r.name, address: r.address, /* plant:ask-name-unconfirmed */
        vouched: r.vouched === 1, provider: r.provider, account: typeof r.org === "string" && r.org.slice(0, PERSON.length) !== PERSON ? "work" : "personal", /* plant:ask-account */
        domain: typeof r.domain === "string" ? r.domain : null, /* plant:ask-domain */
        source: r.source, kind: r.kind, team: r.team, until: r.at + ASK_MS }, r.source === "unconfirmed" ? { claimants: claims.get(await addressKeyed(c.cfg, r.address)) || 1 } : {})); /* plant:ask-claimants */
      /* The invitations by their handle (handleOf), never an address: a Studio keeps what it typed beside the handle `invite` answered. */
      const inv = await c.db.prepare("SELECT address, team, at FROM invites WHERE licence = ?1 AND at > ?2 AND (lead = ?3 OR ?4 = 1) ORDER BY at DESC, address LIMIT ?5")
        .bind(mine.licence, c.now - INVITE_MS, mine.person, own, LIST_MAX).all();
      for (const r of inv.results) r.handle = await handleOf(c.cfg, "desk", mine.licence, r.address); /* plant:list-handle */
      for (const r of inv.results) r.claimed = claims.get(r.address) || 0; /* plant:invite-claimed */
      /* A reduction known ahead, and who stays under it (the future cap, not today's). stays is on every row only then. A desk that
         holds no seat because this licence is full is marked waiting, reduction or not; a seated desk is not, and the field is absent
         otherwise. Neither mark adds a row. */
      const red = await comingReduction(c.db, mine.licence, "desk", c.now);
      const staysKept = [];
      if (red) {
        const stayRows = await c.db.prepare(stayingPersons("?1", "'desk'", "?2", "?3", "?4")).bind(mine.licence, c.now, c.now - PROOF_MS, red.atMs).all();
        const staySet = new Set(stayRows.results.map(r => r.person));
        people.forEach((p, i) => { p.stays = staySet.has(rows.results[i].person); }); /* plant:seat-stay-list-default */
        const listedIds = new Set(rows.results.map(r => r.person));
        const keptRows = await c.db.prepare(
          "SELECT st.person FROM seat_stays st JOIN seats s ON s.licence = st.licence AND s.kind = st.kind AND s.person = st.person "
          + "WHERE st.licence = ?1 AND st.kind = 'desk' ORDER BY st.at ASC"
        ).bind(mine.licence).all();
        for (const r of keptRows.results) {
          if (!listedIds.has(r.person)) staysKept.push(await personOutOf(c.cfg, mine.licence, r.person)); /* plant:seat-stay-list-kept */
        }
      }
      const fullRow = await c.db.prepare("SELECT " + inForceCol("seats", "id", "?2") + " AS room, (SELECT COUNT(*) FROM seats s JOIN licences l "
        + "ON l.id = s.licence WHERE s.licence = licences.id AND s.kind = 'desk' AND s.seen_at > ?2 - l.grace_days * ?3 AND s.proved_at > ?4) AS seated "
        + "FROM licences WHERE id = ?1").bind(mine.licence, c.now, DAY, c.now - PROOF_MS).first();
      if (fullRow && fullRow.seated >= fullRow.room) { /* plant:seat-stay-list-full */
        const waitRows = await c.db.prepare("SELECT DISTINCT d.person AS person FROM person_desks d WHERE d.signed_at > ?2 "
          + "AND NOT EXISTS (SELECT 1 FROM seats s WHERE s.kind = 'desk' AND s.person = d.person AND s.licence = ?1 "
          + "AND ((s.seen_at > ?3 - (SELECT grace_days FROM licences WHERE id = ?1) * ?4 AND s.proved_at > ?5) OR s.proved_at = 0)) " /* plant:seat-stay-list-seated */
          + "AND NOT EXISTS (SELECT 1 FROM seats o WHERE o.kind = 'desk' AND o.person = d.person AND o.licence <> ?1 AND o.seen_at > 0 AND o.proved_at > 0)")
          .bind(mine.licence, c.now - LIST_DAYS * DAY, c.now, DAY, c.now - PROOF_MS).all();
        const waitingIds = new Set(waitRows.results.map(r => r.person));
        people.forEach((p, i) => { if (waitingIds.has(rows.results[i].person)) p.waiting = true; }); /* plant:seat-stay-list-waiting */
      }
      const listed = { ok: true, people, asks, invites: inv.results.map(r => ({ invite: r.handle, team: r.team, until: r.at + INVITE_MS, claimed: r.claimed })) };
      if (red) {
        listed.reduction = { at: red.at, seats: red.seats, seated: red.seated };
        if (staysKept.length) listed.staysKept = staysKept;
      }
      return answer(200, listed);
    },

    /* A LEAD SETS ITS DOORS (the door-finding): a key leadOf admits replaces, in one batch, its own doors on its licence with the
       list it signed, each row stamped with the set's t; another lead's rows on the licence are never touched, so one lead can
       neither take nor close another's door. The list's lead key id is the signer's canonical one or the set is malformed (the test
       architect's read: an id is never a claim). A set no later than this lead's newest row is refused, and every statement of the
       batch holds that condition again, so two sets in flight land in the order they were signed. An empty list clears this lead's
       doors, taken also from a key bound by sign-in whose seat lapsed or was freed, as the relay lets a lapsed team close its door,
       on a licence not refunded, as every other act of a lead (Argon's review of the sign-in service, finding 3).
       Anyone else is answered as a key with no seat. */
    async "door/set"(c) {
      const b = c.body;
      if (!exactly(b, ["lead", "t", "doors", "sig"]) || !HEX64.test(String(b.lead)) || !isT(b.t) || !HEX128.test(String(b.sig))
          || !doorsShape(b.doors, await Q.leadKeyId(b.lead), apiPrefixOf(c.env) !== API)) return malformed();
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", b.lead]], c.now)) return slowDown();
      const no = await signedOk(c.db, c.cfg, Q.doorSetBytes({ lead: b.lead, t: b.t, doors: b.doors }), b.lead, b.sig, b.t, c.now);
      if (no) return no;
      const mine = b.doors.length ? await leadOf(c.db, b.lead, c.now)
        : await c.db.prepare("SELECT b.licence AS licence FROM bindings b JOIN licences l ON l.id = b.licence WHERE b.lead = ?1 "
          + "AND b.person IS NOT NULL AND l.refunded = 0").bind(b.lead).first(); /* plant:door-clear */
      if (!mine) return noSeatHere(); /* plant:door-lead */
      const last = await c.db.prepare("SELECT MAX(at) AS at FROM doors WHERE licence = ?1 AND lead = ?2").bind(mine.licence, b.lead).first();
      if (last && last.at !== null && last.at >= b.t) return refused(); /* plant:door-fresh */
      await c.db.batch(b.doors.map(d => c.db.prepare("INSERT INTO doors (licence, lead, team, rt, url, key_id, box, at, label) "
        + "SELECT ?1, ?2, ?4, ?5, ?6, ?7, ?8, ?3, ?9 WHERE NOT EXISTS (SELECT 1 FROM doors WHERE licence = ?1 AND lead = ?2 AND at > ?3) "
        + "ON CONFLICT (licence, lead, team) DO UPDATE SET rt = excluded.rt, url = excluded.url, key_id = excluded.key_id, box = excluded.box, "
        + "at = excluded.at, label = excluded.label WHERE excluded.at >= doors.at") /* plant:door-label */
        .bind(mine.licence, b.lead, b.t, d.team, d.rt, d.url, d.keyId, d.box, d.label === undefined ? null : d.label))
        /* Two sets signed with one t (Argon's second review of the sign-in, finding 11): the later batch's rows replace the earlier's at that t
           and its DELETE takes the other's teams too, so one set stands whole and never two merged past DOORS_PER_LEAD. */
        .concat([c.db.prepare("DELETE FROM doors WHERE licence = ?1 AND lead = ?2 AND at < ?3 " /* plant:door-own */
          + "AND NOT EXISTS (SELECT 1 FROM doors WHERE licence = ?1 AND lead = ?2 AND at > ?3)").bind(mine.licence, b.lead, b.t),
          c.db.prepare("DELETE FROM doors WHERE licence = ?1 AND lead = ?2 AND at = ?3 AND team NOT IN (SELECT value FROM json_each(?4))")
            .bind(mine.licence, b.lead, b.t, JSON.stringify(b.doors.map(d => d.team)))])); /* plant:door-same-t */
      return answer(200, { ok: true, doors: b.doors.length });
    },

    /* THE OWNER'S LIST OF LEAD SEATS (decision 15 (b)): for a key bound through the person who owns its licence and holds a
       lead seat on it proved within PROOF_DAYS (leadOf), every lead seat on it by its code, counted or not, with the days it
       was last seen and proved (a freed seat's null), and which is the asker's own. Anyone else is answered as a key with no seat. */
    async "seat/list"(c) {
      const b = c.body;
      if (!exactly(b, ["lead", "t", "sig"]) || !HEX64.test(String(b.lead)) || !isT(b.t) || !HEX128.test(String(b.sig))) return malformed();
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", b.lead]], c.now)) return slowDown();
      const no = await signedOk(c.db, c.cfg, Q.seatListBytes({ lead: b.lead, t: b.t }), b.lead, b.sig, b.t, c.now);
      if (no) return no;
      if (await managedKey(c.db, b.lead)) return managed(); /* plant:managed-seat-list */
      const mine = await leadOf(c.db, b.lead, c.now);
      if (!mine) return noSeatHere();
      const row = await c.db.prepare("SELECT " + LICENCE_COLUMNS + " FROM licences WHERE id = ?1").bind(mine.licence).first();
      const rows = await c.db.prepare("SELECT person, code, seen_at, proved_at FROM seats WHERE licence = ?1 AND kind = 'lead' "
        + "ORDER BY seated_at, code").bind(mine.licence).all();
      const teams = await teamSizes(c.db, row, c.now);
      /* ANOTHER LEAD learns who holds a lead seat, by code and which is theirs (decision 29 (b): "A lead who is not the owner cannot
         remove another lead, from the team or the licence"), so its Studio keeps a co-lead on the team; and, a team being its lead's own,
         which seat is the owner's, who alone names and unnames, its own team's size and the licence's desk seats in use, one pool. */
      if (!mine.owner) return answer(200, { ok: true, seats: rows.results.filter(r => r.proved_at > 0).map(r => Object.assign({ code: r.code, you: r.person === mine.person },
        r.person === row.owner ? { owner: true } : {}, r.person === mine.person ? { team: teams.get(r.person) || 0 } : {})), /* plant:list-owner */
        desks: (await seatCounts(c.db, row, c.now)).desk });
      /* THE OWNER also learns whom it named and who has not yet signed in on it, each team's size, the colleagues who signed in to
         Studio on a trial of their own within LIST_DAYS, ready to name, and its switch (a team is its lead's own). */
      const named = await c.db.prepare("SELECT n.person AS person, p.code AS code, n.at AS at FROM lead_names n JOIN persons p ON p.person = n.person "
        + "WHERE n.licence = ?1 ORDER BY n.at, p.code").bind(mine.licence).all();
      /* NOT YET (board 1011): a naming whose person holds a running trial of their own and has not pressed Accept, and whether their Accept
         found no lead seat free. */
      const notYet = await c.db.prepare("SELECT n.person AS person, n.blocked_at AS blocked_at FROM lead_names n WHERE n.licence = ?1 AND n.accepted_at IS NULL "
        + "AND EXISTS (SELECT 1 FROM licences ot WHERE ot.owner = n.person AND ot.trial_ends > ?2 AND ot.desk_only = 0 AND ot.refunded = 0)").bind(mine.licence, c.now).all();
      const notYetOf = person => { const y = notYet.results.find(r => r.person === person);
        return y ? Object.assign({ pending: true }, y.blocked_at > 0 ? { blocked: true } : {}) : {}; }; /* plant:list-pending */
      const namedAtOf = n => (n && n.at > 0 ? Object.assign({ namedAt: dayOf(n.at) }, notYetOf(n.person)) : {});
      const seats = rows.results.map(r => Object.assign({ code: r.code, seen: r.seen_at > 0 ? dayOf(r.seen_at) : null, proved: r.proved_at > 0 ? dayOf(r.proved_at) : null,
        you: r.person === mine.person, named: r.person === row.owner || named.results.some(n => n.person === r.person), team: teams.get(r.person) || 0 },
        namedAtOf(named.results.find(n => n.person === r.person))));
      for (const n of named.results) if (!rows.results.some(r => r.person === n.person))
        seats.push(Object.assign({ code: n.code, seen: null, proved: null, you: false, named: true, team: teams.get(n.person) || 0 }, namedAtOf(n)));
      const unnamed = await c.db.prepare("SELECT s.code AS code, s.person AS person, s.seen_at AS seen FROM seats s JOIN licences t ON t.id = s.licence "
        + "WHERE s.kind = 'lead' AND t.trial_ends IS NOT NULL AND s.seen_at > ?2 AND s.person <> ?3 AND s.code IS NOT NULL "
        + "AND NOT EXISTS (SELECT 1 FROM lead_names n WHERE n.licence = ?1 AND n.person = s.person) "
        + "AND EXISTS (SELECT 1 FROM admits a WHERE a.licence = ?1 AND a.provider = s.provider AND a.org = s.org AND substr(a.org, 1, ?4) <> ?5) " /* plant:list-unnamed */
        + "ORDER BY s.seen_at DESC, s.code LIMIT ?6").bind(mine.licence, c.now - LIST_DAYS * DAY, row.owner, PERSON.length, PERSON, LIST_MAX).all();
      /* WITHOUT A CODE ON THE SCREEN (board 1017): each lead seat and naming also by the person's pseudonym on this licence and the name the
         service keeps of them (they are on it), each colleague ready to name by pseudonym alone (they pressed nothing: lead/pick names
         them); and the namings by address waiting, each by its handle with its end and the candidates who pressed Accept on an address their
         provider did not vouch, each by pseudonym with what their provider says of them: name, provider and account kind (rule 1), for
         lead/confirm or lead/withdraw. */
      const people = new Map();
      for (const r of rows.results.concat(named.results)) if (!people.has(r.person)) people.set(r.person, await personOutOf(c.cfg, mine.licence, r.person));
      const nameRows = await c.db.prepare("SELECT person, name, address FROM persons WHERE person IN (SELECT value FROM json_each(?1))").bind(JSON.stringify(Array.from(people.keys()))).all();
      const nameOfP = p => { const x = nameRows.results.find(r => r.person === p); return x && typeof x.name === "string" ? x.name : null; };
      /* And the address their own sign-in gave (board 1017's sheet: "leads read by name and address"), as person/list gives it for the people on a
         lead's team: a lead seat's person and a named person are on this licence. */
      const addressOfP = p => { const x = nameRows.results.find(r => r.person === p); return x && typeof x.address === "string" ? x.address : null; };
      const personOf_ = [];
      rows.results.forEach(r => personOf_.push(r.person));
      for (const n of named.results) if (!rows.results.some(r => r.person === n.person)) personOf_.push(n.person);
      seats.forEach((s, i) => Object.assign(s, { person: people.get(personOf_[i]), name: nameOfP(personOf_[i]), address: addressOfP(personOf_[i]) })); /* plant:seat-list-person */
      const unnamedOut = [];
      for (const u of unnamed.results) unnamedOut.push({ code: u.code, person: await personOutOf(c.cfg, mine.licence, u.person), seen: dayOf(u.seen) });
      const waiting = await c.db.prepare("SELECT address, at FROM lead_invites WHERE licence = ?1 AND at > ?2 ORDER BY at DESC, address LIMIT ?3").bind(mine.licence, c.now - INVITE_MS, LIST_MAX).all();
      const namings = [];
      for (const w of waiting.results) {
        const cands = await c.db.prepare("SELECT k.person AS person, k.provider AS provider, k.account AS account, k.at AS at, p.name AS name, p.domain AS domain FROM lead_candidates k "
          + "LEFT JOIN persons p ON p.person = k.person WHERE k.licence = ?1 AND k.address = ?2 ORDER BY k.at, k.person").bind(mine.licence, w.address).all();
        const candidates = [];
        for (const k of cands.results) candidates.push({ person: await personOutOf(c.cfg, mine.licence, k.person), name: typeof k.name === "string" ? k.name : null,
          provider: k.provider, account: k.account, domain: k.account === "work" && typeof k.domain === "string" ? k.domain : null, at: k.at }); /* plant:candidate-domain */
        namings.push({ naming: await handleOf(c.cfg, "lead", mine.licence, w.address), until: w.at + INVITE_MS, claimed: candidates.length, candidates }); /* plant:seat-list-namings */
      }
      return answer(200, { ok: true, seats, counts: await seatCounts(c.db, row, c.now), orgDesks: row.org_desks === 1,
        unnamed: unnamedOut, namings });
    },

    /* A SEAT FREED AT ONCE. A desk seat by the lead (Claude alpha's decision 14): a key seated by sign-in frees a desk seat of
       its own licence, named as its seat certificate names the person (the per-licence pseudonym, so the lead never learns who),
       where it owns the licence or admitted that person by code, the organisation not seating them (FREES_DESK, decision 46). A
       lead seat by the licence's owner alone (decision 15 (b)), named by its code; the owner may free their own, and then frees
       nothing more until they sign in again. Either asker holds a lead seat proved within PROOF_DAYS (leadOf). Either seat
       is marked unseen and unproved, so it stops counting now, its row stays, and only its person's fresh proof takes it
       again. A key holding no current lead seat (nothing, a lead freed or lapsed) is refused as
       "not-lead"; anyone but the owner for a lead seat, or a seat this licence does not have, is refused alike as no-seat; a desk seat here that this lead may not free is refused as "not-yours". */
    async "seat/free"(c) {
      const b = c.body;
      if (!exactly(b, ["kind", "person", "lead", "t", "sig"]) || (b.kind !== "lead" && b.kind !== "desk")
          || !(HEX64.test(String(b.person)) || SEAT_CODE_RE.test(String(b.person)))
          || !HEX64.test(String(b.lead)) || !isT(b.t) || !HEX128.test(String(b.sig))) return malformed();
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", b.lead]], c.now)) return slowDown();
      const no = await signedOk(c.db, c.cfg, Q.seatFreeBytes({ kind: b.kind, person: b.person, lead: b.lead, t: b.t }), b.lead, b.sig, b.t, c.now);
      if (no) return no;
      if (await managedKey(c.db, b.lead)) return managed(); /* plant:managed-free */
      const mine = await leadOf(c.db, b.lead, c.now);
      /* An asker with no current lead seat (none, freed, lapsed, refunded) is told so, 403 "not-lead", and about
         itself alone: as no-seat, Studio would read a lapsed lead's press as a seat already gone and show it freed (the test
         architect's read of 364b2572). */
      if (!mine) return answer(403, { ok: false, reason: "not-lead" }); /* plant:free-lead */
      if (b.kind === "lead") {
        if (!SEAT_CODE_RE.test(b.person)) return noSeatHere();
        /* One batch, each statement only where the asker owns the licence: the seat of that code on it, and the person's name on it
           (a team is its lead's own: a lead named and not yet signed in is unnamed by the same press), their team the owner's. */
        const who = await c.db.prepare("SELECT person FROM persons WHERE code = ?1").bind(b.person).first();
        const res = await c.db.batch([c.db.prepare("UPDATE seats SET seen_at = 0, proved_at = 0 WHERE kind = 'lead' "
          + "AND code = ?1 AND licence = ?2 AND EXISTS (SELECT 1 FROM licences WHERE id = ?2 AND owner = ?3) RETURNING person") /* plant:free-owner */
          .bind(b.person, mine.licence, mine.person)].concat(who ? unnamed(c.db, mine.licence, who.person, mine.person, true) : [],
          who ? [removalStamp(c.db, mine.licence, who.person, "lead", c.now, null, { /* plant:removal-free-lead */
            cond: "EXISTS (SELECT 1 FROM seats WHERE kind = 'lead' AND code = ?5 AND licence = ?1 AND EXISTS (SELECT 1 FROM licences WHERE id = ?1 AND owner = ?6))",
            vals: [b.person, mine.person] })] : []));
        if (!res[0].results.length && !(who && res[1].results.length)) return noSeatHere();
        const row = await c.db.prepare("SELECT " + LICENCE_COLUMNS + " FROM licences WHERE id = ?1").bind(mine.licence).first();
        return answer(200, { ok: true, freed: "lead", seats: await seatCounts(c.db, row, c.now) });
      }
      const held = await c.db.prepare("SELECT person FROM seats WHERE licence = ?1 AND kind = 'desk'").bind(mine.licence).all();
      for (const r of held.results) {
        if (await keyedHash(c.cfg.hmac, KEYED.personOut, mine.licence + "\n" + r.person) !== b.person) continue;
        /* Only where this asker may free that person (FREES_DESK, decision 46), inside one batch: seat, desks, removal stamp, company store.
           A seat still here that this lead may not free is refused as "not-yours", 403, writing nothing. */
        const freesDeskAt = FREES_DESK.replace(/\?[123]/g, m => ({ "?1": "?2", "?2": "?1", "?3": "?5" }[m]));
        const ended = storeForms() ? [c.db.prepare("UPDATE stores SET ended_at = ?4 WHERE ended_at = 0 AND person = ?1 AND licence = ?2 AND " + FREES_DESK
          + " RETURNING rt, code").bind(r.person, mine.licence, mine.person, c.now)] : []; /* plant:store-free-desk */
        /* A LEAD'S OWN ACT FREES THE DESK AT ONCE (Grok zeta's sign-in run, verified by the test architect; Claude alpha's rule, carried by Claudius:
           a certificate's remaining life is a grace for a person whose seat still stands and who is offline, never against a lead's own act):
           every desk key of the seat is written to freed_desks at the instant of the act, in the batch that frees it, on the same condition. */
        const res = await c.db.batch([
          c.db.prepare("UPDATE seats SET seen_at = 0, proved_at = 0 WHERE kind = 'desk' AND person = ?1 AND licence = ?2 AND " + FREES_DESK
            + " RETURNING person").bind(r.person, mine.licence, mine.person), /* plant:free-unseen */
          c.db.prepare("INSERT INTO freed_desks (licence, desk_key, at) SELECT licence, desk_key, ?4 FROM desk_keys WHERE person = ?1 AND licence = ?2 AND " + FREES_DESK + " AND " + NOBODY_ELSE_ON_KEY /* plant:free-shared */
            + " ON CONFLICT (licence, desk_key) DO UPDATE SET at = excluded.at").bind(r.person, mine.licence, mine.person, c.now), /* plant:free-freed */
          c.db.prepare("UPDATE desk_keys SET seen_at = 0 WHERE person = ?1 AND licence = ?2 AND " + FREES_DESK).bind(r.person, mine.licence, mine.person), /* plant:free-desks */
          removalStamp(c.db, mine.licence, r.person, "desk", c.now, null, { cond: freesDeskAt, vals: [mine.person] }), /* plant:removal-free-desk */
        ].concat(ended));
        if (!res[0].results.length) {
          const here = await c.db.prepare("SELECT 1 AS h FROM seats WHERE kind = 'desk' AND person = ?1 AND licence = ?2").bind(r.person, mine.licence).first();
          return here ? answer(403, { ok: false, reason: "not-yours" }) : noSeatHere(); /* plant:free-not-yours */
        }
        if (ended.length) await postEnded(c.db, c.cfg, c.env, res[res.length - 1].results, c.now);
        const row = await c.db.prepare("SELECT " + LICENCE_COLUMNS + " FROM licences WHERE id = ?1").bind(mine.licence).first();
        return answer(200, { ok: true, freed: "desk", seats: await seatCounts(c.db, row, c.now) });
      }
      return noSeatHere();
    },

    /* WHO STAYS (piece b): the owner or a co-lead (leadOf: named or the owner, not only the people that lead admitted) replaces
       this licence's choice for one kind, in one batch. Persons are the pseudonyms person/list gives, in the order named, which is
       the priority (oldest at first). The owner's seat is never a choice this route can take away: stayingPersons keeps the owner
       whether or not they are named. A managed key is answered "managed", as seat/free answers it; a key with no current lead seat,
       a non-lead included, is "not-lead", as seat/free answers it; a person not seated on this licence for that kind is no-seat, and
       so is the whole ask, writing nothing. More names than the kind's in-force count is "full", writing nothing. */
    async "seat/stay"(c) {
      const b = c.body;
      if (!exactly(b, ["lead", "kind", "persons", "t", "sig"]) || (b.kind !== "lead" && b.kind !== "desk")
          || !Array.isArray(b.persons) || b.persons.some(p => !HEX64.test(String(p))) || new Set(b.persons).size !== b.persons.length
          || !HEX64.test(String(b.lead)) || !isT(b.t) || !HEX128.test(String(b.sig))) return malformed();
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", b.lead]], c.now)) return slowDown();
      const no = await signedOk(c.db, c.cfg, Q.seatStayBytes({ kind: b.kind, persons: b.persons, lead: b.lead, t: b.t }), b.lead, b.sig, b.t, c.now);
      if (no) return no;
      if (await managedKey(c.db, b.lead)) return managed(); /* plant:seat-stay-list-managed */
      const mine = await leadOf(c.db, b.lead, c.now);
      if (!mine) return answer(403, { ok: false, reason: "not-lead" }); /* plant:seat-stay-list-nonlead */ /* plant:seat-stay-list-colead */
      const held = await c.db.prepare("SELECT person FROM seats WHERE licence = ?1 AND kind = ?2").bind(mine.licence, b.kind).all();
      const ids = [];
      for (const pseudo of b.persons) {
        let found = null;
        for (const r of held.results) {
          if (await keyedHash(c.cfg.hmac, KEYED.personOut, mine.licence + "\n" + r.person) === pseudo) { found = r.person; break; }
        }
        ids.push(found);
      }
      if (ids.some(id => !id)) return noSeatHere(); /* plant:seat-stay-list-stranger */
      const room = await c.db.prepare("SELECT CASE ?3 WHEN 'lead' THEN " + inForceCol("lead_seats", "id", "?2") + " * (1 - desk_only) ELSE "
        + inForceCol("seats", "id", "?2") + " END AS n FROM licences WHERE id = ?1").bind(mine.licence, c.now, b.kind).first();
      if (b.persons.length > room.n) return noSeat(); /* plant:seat-stay-list-cap */
      const stayKind = b.kind; /* plant:seat-stay-list-kind */
      const stayInsert = true; /* plant:seat-stay-list-renew */
      const stmts = [c.db.prepare("DELETE FROM seat_stays WHERE licence = ?1 AND kind = ?2").bind(mine.licence, stayKind)];
      if (stayInsert) for (let i = 0; i < ids.length; i++) stmts.push(c.db.prepare(
        "INSERT INTO seat_stays (licence, kind, person, at, by) VALUES (?1, ?2, ?3, ?4, ?5)").bind(mine.licence, stayKind, ids[i], c.now + i, mine.person));
      await c.db.batch(stmts);
      return answer(200, { ok: true, kind: stayKind, stays: ids.length });
    },

    /* THE OWNER NAMES A LEAD (a team is its lead's own; decision 47): a key leadOf finds owning a paid licence names the person
       whose sign-in code it is to a lead seat on it, at most lead_seats with the owner counted, so a person named never meets
       "full". In the same batch the person is admitted by name, so their own desks are seated whatever the switch. Named already is
       answered as named; a full licence "full"; anyone but the owner, or a code nobody holds, as a key with no seat.
       NOTHING OF THE NAMED PERSON'S OWN IS TAKEN (Argon's second review of the sign-in, finding 3): a code is handed to leads and printed
       in every seat certificate, and naming asks the person nothing, so naming ends no trial of theirs and moves no seat or key. Their
       own next check or sign-in moves them here (leadLicence, a paid licence before a trial), and their trial runs its own days, so an
       owner who names and then frees or unnames them, a stranger's licence or their own organisation's, leaves them their trial, where
       ending it at the naming stranded them with none (once per person). */
    async "lead/name"(c) {
      const b = c.body;
      if (!exactly(b, ["code", "lead", "t", "sig"]) || !SEAT_CODE_RE.test(String(b.code)) || !HEX64.test(String(b.lead))
          || !isT(b.t) || !HEX128.test(String(b.sig))) return malformed();
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", b.lead]], c.now)) return slowDown();
      const no = await signedOk(c.db, c.cfg, Q.leadNameBytes({ code: b.code, lead: b.lead, t: b.t }), b.lead, b.sig, b.t, c.now);
      if (no) return no;
      if (await managedKey(c.db, b.lead)) return managed(); /* plant:managed-name */
      const mine = await leadOf(c.db, b.lead, c.now);
      if (!mine || !mine.owner) return noSeatHere(); /* plant:name-owner */
      const who = await c.db.prepare("SELECT person, provider FROM persons WHERE code = ?1").bind(b.code).first();
      if (!who) return noSeatHere();
      if (who.person === mine.person) return answer(200, { ok: true, named: b.code });
      const res = await c.db.batch(namingStatements(c, mine, who));
      if (res[res.length - 1].results[0].named !== 1) return noSeat();
      return answer(200, { ok: true, named: b.code });
    },

    /* THE NAMED PERSON'S OWN PRESS (board 1011; Claude alpha's decision of 2026-11-17 13:16, "until Studio has a press for a naming, which
       replaces it"): the key of a person holding a naming they have not accepted, and a running trial of their own that it would set aside,
       takes the naming's lead seat now, by the move the next check once made at the naming (leadLicence, a paid licence before a trial; their
       trial keeps its end, set aside). No naming to accept, or a trial of a colleague's desk or a team (more than a bare trial, which no
       naming moves), answers as "held" and moves nobody; no lead seat free answers "full", changes nothing, and is recorded (blocked_at) so
       the owner reads that the seat could not be taken and the person is asked again once one is free (namingOf). Signed by their own key;
       anyone else's, or one bound to no person, is answered as a key with no seat. */
    async "lead/accept"(c) {
      const b = c.body;
      if (!exactly(b, ["lead", "t", "sig"]) || !HEX64.test(String(b.lead)) || !isT(b.t) || !HEX128.test(String(b.sig))) return malformed();
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", b.lead]], c.now)) return slowDown();
      const no = await signedOk(c.db, c.cfg, Q.leadAcceptBytes({ lead: b.lead, t: b.t }), b.lead, b.sig, b.t, c.now);
      if (no) return no;
      const bound = await c.db.prepare("SELECT person FROM bindings WHERE lead = ?1").bind(b.lead).first();
      if (!bound || !bound.person) return noSeatHere();
      const n = await pendingNaming(c.db, bound.person, c.now);
      if (!n) return acceptByAddress(c, b, bound.person);
      if (n.held === 1) return answer(409, { ok: false, reason: "held" }); /* plant:accept-held */
      const blockIt = () => c.db.prepare("UPDATE lead_names SET blocked_at = ?3 WHERE licence = ?1 AND person = ?2 AND accepted_at IS NULL").bind(n.licence, bound.person, c.now).run();
      if (!await roomOn(c.db, bound.person, n.licence, c.now)) { await blockIt(); return answer(200, { ok: true, accepted: false, reason: "full" }); } /* plant:accept-room */
      await c.db.prepare("UPDATE lead_names SET accepted_at = ?3, blocked_at = NULL WHERE licence = ?1 AND person = ?2 AND accepted_at IS NULL")
        .bind(n.licence, bound.person, c.now).run(); /* plant:accept-write */
      const h = await followSeat(c.db, b.lead, await holdingOf(c.db, b.lead), c.now);
      if (h.kind !== "licence" || !h.row || h.row.id !== n.licence) {
        await c.db.prepare("UPDATE lead_names SET accepted_at = NULL WHERE licence = ?1 AND person = ?2").bind(n.licence, bound.person).run();
        await blockIt();
        return answer(200, { ok: true, accepted: false, reason: "full" });
      }
      return answer(200, { ok: true, accepted: true });
    },

    /* THE OWNER'S SWITCH (decision 47's addition): a key leadOf finds owning the licence sets whether colleagues' desks are seated
       by the organisation admission (orgDesks true) or only people admitted by name are. Turned off, in the same batch every desk
       the organisation seats now (proved, seen within the grace) and no lead admitted is admitted by name as the owner's, so
       nobody seated is dropped; turned on, nothing that exists changes. Anyone but the owner is answered as a key with no seat. */
    async "licence/set"(c) {
      const b = c.body;
      if (!exactly(b, ["orgDesks", "lead", "t", "sig"]) || typeof b.orgDesks !== "boolean" || !HEX64.test(String(b.lead))
          || !isT(b.t) || !HEX128.test(String(b.sig))) return malformed();
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", b.lead]], c.now)) return slowDown();
      const no = await signedOk(c.db, c.cfg, Q.licenceSetBytes({ orgDesks: b.orgDesks, lead: b.lead, t: b.t }), b.lead, b.sig, b.t, c.now);
      if (no) return no;
      if (await managedKey(c.db, b.lead)) return managed(); /* plant:managed-set */
      const mine = await leadOf(c.db, b.lead, c.now);
      if (!mine || !mine.owner) return noSeatHere(); /* plant:set-owner */
      const SEATED = "FROM seats s WHERE s.licence = ?1 AND s.kind = 'desk' AND s.proved_at > 0 "
        + "AND s.seen_at > ?2 - (SELECT grace_days FROM licences WHERE id = ?1) * ?3 "
        + "AND EXISTS (SELECT 1 FROM admits a WHERE a.licence = ?1 AND a.provider = s.provider AND a.org = s.org AND substr(a.org, 1, ?4) <> ?5) "
        + "AND NOT EXISTS (SELECT 1 FROM admitted_by x WHERE x.licence = ?1 AND x.person = s.person) "
        + "AND EXISTS (SELECT 1 FROM licences WHERE id = ?1 AND org_desks = 1)";
      const keep = b.orgDesks ? [] : [
        c.db.prepare("INSERT INTO admits (licence, provider, org) SELECT ?1, s.provider, ?5 || s.person " + SEATED + " ON CONFLICT DO NOTHING")
          .bind(mine.licence, c.now, DAY, PERSON.length, PERSON), /* plant:set-keep */
        c.db.prepare("INSERT INTO admitted_by (licence, person, lead) SELECT ?1, s.person, ?6 " + SEATED + " ON CONFLICT DO NOTHING")
          .bind(mine.licence, c.now, DAY, PERSON.length, PERSON, mine.person),
      ];
      await c.db.batch(keep.concat([c.db.prepare("UPDATE licences SET org_desks = ?2 WHERE id = ?1").bind(mine.licence, b.orgDesks ? 1 : 0)])); /* plant:set-write */
      return answer(200, { ok: true, orgDesks: b.orgDesks });
    },

    /* THE ADMINISTRATOR'S CARD (decision 49, section 11.4): a token of a tenant whose licence follows Entra, holding Etiuda.Admin, read
       under the Studio key that signs: the licence's organisation as it names it, its seats of each kind bought and in use, the desks of
       its tenant signed in within its window and holding no seat (assigned beyond what was bought, or not yet seated), and its two
       dates. It binds nothing and takes no seat. The token answers once: a first sign-in's carries the nonce of the signing key and the
       seed, as signin's does; one with no seed is a refreshed one, issued within RENEW_IAT_MS. Its roles are the access token's
       (judgeAccess); the answer says `admin`, which Studio reads in place of any claim of its own. No role is "no-role"; a tenant with
       no such licence "no-licence"; no access token "access-token". */
    async "licence/admin"(c) {
      const b = c.body;
      if (!exactly(b, ["provider", "idToken", "lead", "t", "sig"], ["seed", "accessToken"]) || typeof b.provider !== "string"
          || !/^[a-z][a-z0-9-]{1,30}$/.test(b.provider) || typeof b.idToken !== "string" || !HEX64.test(String(b.lead))
          || !isT(b.t) || !HEX128.test(String(b.sig)) || (b.seed !== undefined && !HEX64.test(String(b.seed)))
          || (b.accessToken !== undefined && typeof b.accessToken !== "string")) return malformed();
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", b.lead]], c.now)) return slowDown();
      const tokenHash = await Q.tokenHash(b.idToken);
      const adminAccess = b.accessToken === undefined ? undefined : await Q.tokenHash(b.accessToken);
      const later = {}, no = await signedOk(c.db, c.cfg, await seedSigned(seed => (adminAccess === undefined ? Q.licenceAdminBytes({ provider: b.provider, tokenHash, lead: b.lead, t: b.t, seed })
        : Q.licenceAdminManagedBytes({ provider: b.provider, tokenHash, accessHash: adminAccess, lead: b.lead, t: b.t, seed })), b.seed, b.lead, b.sig, false), b.lead, b.sig, b.t, c.now, later);
      if (no) return no;
      const providers = providersOf(c.env);
      if (!providers) return unavailable();
      const p = providers.get(b.provider);
      if (!p) return badToken();
      const j = await judgeToken(b.idToken, p, providers, c.now);
      if (!j) return badToken();
      if (b.seed !== undefined ? j.nonce === null || j.nonce !== await Q.signinNonce(b.lead, b.seed)
        : c.now - j.iat * 1000 > RENEW_IAT_MS) return badToken(); /* plant:admin-token */
      const once = await seenOnce(c.db, later.digest, c.now); /* plant:admin-seen-later */
      if (once) return once;
      const s = await personOf(c.cfg, j);
      const ent = await entraLicence(c.db, s);
      const r = ent ? await rolesIn(b, p, j, c.now) : null;
      if (r && r.no) return r.no;
      if (!await spendOnly(c.db, await tokenSpend(c.cfg, tokenHash, j.exp), c.now)) return badToken();
      if (!ent) return noLicence();
      if (!r.roles || !r.roles.has(ROLE.admin)) return answer(403, { ok: false, reason: "no-role" }); /* plant:admin-role */
      const waiting = await c.db.prepare("SELECT COUNT(DISTINCT d.person) AS n FROM person_desks d WHERE d.signed_at > ?2 "
        + "AND d.org IN (SELECT org FROM admits WHERE licence = ?1 AND substr(org, 1, ?4) <> ?5) "
        + "AND NOT EXISTS (SELECT 1 FROM seats s WHERE s.kind = 'desk' AND s.person = d.person AND s.licence = ?1 "
        + "AND ((s.seen_at > ?3 AND s.proved_at > ?2) OR s.proved_at = 0)) "
        /* Not waiting for this licence: a person whose desk seat sits on another licence, seen and proved (one this licence's removal moved
           to their own from before the turn; the test architect's low on b2803b8a). */
        + "AND NOT EXISTS (SELECT 1 FROM seats o WHERE o.kind = 'desk' AND o.person = d.person AND o.licence <> ?1 AND o.seen_at > 0 AND o.proved_at > 0)")
        .bind(ent.id, c.now - ENTRA_PROOF_MS, c.now - ent.grace_days * DAY, PERSON.length, PERSON).first();
      return answer(200, { ok: true, admin: true, org: ent.org, seats: await seatCounts(c.db, ent, c.now), waiting: { desk: waiting.n },
        paidUntil: dayOf(ent.paid_until), updatesUntil: ent.updates_until });
    },

    /* A PERSON ERASES WHAT THE SERVICE KEEPS ABOUT THEM (section 13; Claude alpha's decision 50, his condition (1): "the erase route
       proves the person exactly as a sign-in does and can never be used to erase somebody else"). The asker is a desk or a Studio,
       signing with its own key, and the person is the one a fresh ID token proves, never anyone the body names: the token's nonce
       must be signinNonce of that very key and the seed beside it, as a first sign-in's, its iat within RENEW_IAT_MS, and it answers
       once, spent before anything is erased. Then one batch, erase.mjs's, on every licence. The answer is counts and what stays,
       each with its end, and nothing about the person; a person the service holds nothing about is answered alike. */
    async "person/erase"(c) {
      const b = c.body;
      if (!exactly(b, ["provider", "idToken", "key", "seed", "t", "sig"]) || typeof b.provider !== "string"
          || !/^[a-z][a-z0-9-]{1,30}$/.test(b.provider) || typeof b.idToken !== "string" || !HEX64.test(String(b.key))
          || !HEX64.test(String(b.seed)) || !isT(b.t) || !HEX128.test(String(b.sig))) return malformed();
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", b.key]], c.now)) return slowDown();
      const tokenHash = await Q.tokenHash(b.idToken);
      const no = await signedOk(c.db, c.cfg, Q.personEraseBytes({ provider: b.provider, tokenHash, key: b.key, t: b.t }), b.key, b.sig, b.t, c.now); /* plant:erase-signed */
      if (no) return no;
      const providers = providersOf(c.env);
      if (!providers) return unavailable();
      const p = providers.get(b.provider);
      if (!p) return badToken();
      const j = await judgeToken(b.idToken, p, providers, c.now);
      if (!j) return badToken();
      if (j.nonce === null || j.nonce !== await Q.signinNonce(b.key, b.seed)) return badToken(); /* plant:erase-nonce */
      if (c.now - j.iat * 1000 > RENEW_IAT_MS) return badToken(); /* plant:erase-iat */
      const s = await personOf(c.cfg, j); /* plant:erase-whom */
      const spend = await tokenSpend(c.cfg, tokenHash, j.exp);
      if (!await spendOnly(c.db, spend, c.now)) return badToken(); /* plant:erase-once */
      const P = s.person, now = c.now;
      const one = async (sql, ...v) => (await c.db.prepare(sql).bind(...v).first()).n;
      const licences = await one("SELECT COUNT(*) AS n FROM (SELECT licence FROM seats WHERE person = ?1 UNION SELECT licence FROM desk_keys WHERE person = ?1 "
        + "UNION SELECT licence FROM bindings WHERE person = ?1 UNION SELECT licence FROM admitted_by WHERE person = ?1 OR lead = ?1 "
        + "UNION SELECT licence FROM lead_names WHERE person = ?1 UNION SELECT id FROM licences WHERE owner = ?1 "
        + "UNION SELECT licence FROM admits WHERE org = ?2 || ?1)", P, PERSON);
      const desks = await one("SELECT COUNT(*) AS n FROM (SELECT desk_key FROM desk_keys WHERE person = ?1 UNION SELECT desk_key FROM person_desks WHERE person = ?1)", P);
      const owned = await one("SELECT COUNT(*) AS n FROM licences WHERE owner = ?1 AND trial_ends IS NULL", P);
      /* WHAT STAYS, read from the rows and from the rules that purge them (purgeRetention), so the answer says no less than is kept (the test
         architect's read of the held integration, erasure part, finding 2). Each is {kept, until}: `until` the day its row goes as the rows
         stand now, or null where no day can be named yet; `while` names what keeps it past that day ("licence": a licence its rows go with,
         a year after it ends, may yet be renewed, which moves the day; "shared": another person's place on the same computer, after which
         ERASURE_DAYS run; "queue": past the first ERASED_MAX names of a licence, each night holds the rest ERASURE_DAYS more); `may` marks
         rows the service cannot tell were this person's, because by a ruling nothing links them to anyone (releases). A licence goes a year
         after it ends: its trial's end, its paid date, or for a refunded one the refund, as purgeRetention reads each. */
      const endOf = l => "CASE WHEN " + l + "refunded = 1 THEN COALESCE(" + l + "refunded_at, MIN(?2, CASE WHEN " + l + "trial_ends IS NOT NULL THEN " + l
        + "trial_ends ELSE " + l + "paid_until END)) WHEN " + l + "trial_ends IS NOT NULL THEN " + l + "trial_ends ELSE " + l + "paid_until END";
      const liveOf = l => "MAX(CASE WHEN " + l + "refunded = 0 THEN 1 ELSE 0 END)";
      const trial = await c.db.prepare("SELECT MAX(trial_ends) AS e FROM licences WHERE trial_unit IN (?1, ?2)").bind(PERSON + P, DESK_TRIAL + P).first(); /* plant:erase-desk-trial */
      /* The payer's row and binding stay while any subscription of theirs stands in pay_subs, which goes with its licence. */
      const paying = await c.db.prepare("SELECT MAX(" + endOf("l.") + ") AS e, " + liveOf("l.") + " AS live FROM pay_subs s JOIN licences l ON l.id = s.licence "
        + "WHERE s.person = ?1").bind(P, now).first(); /* plant:erase-payer-stays */
      const billed = await c.db.prepare("SELECT MAX(" + endOf("") + ") AS e, MAX(CASE WHEN refunded = 0 AND trial_ends IS NULL THEN 1 ELSE 0 END) AS live "
        + "FROM licences WHERE owner = ?1 AND email_hash <> ?3").bind(P, now, NO_KEY).first(); /* plant:erase-billed-stays */
      /* A Studio key released by DEVICES_PER_SEAT keeps its releases row RELEASE_KEEP_DAYS and, on a licence whose seats follow Entra, its
         mark until that licence goes (Claude alpha's rulings under decision 50); with no person on releases, those of a licence the person
         held a lead seat on are named as may-be-theirs: the releases there, and the marks there whose key nobody holds bound. */
      const leadOn = "SELECT licence FROM seats WHERE kind = 'lead' AND person = ?1";
      const released = await c.db.prepare("SELECT MAX(at) AS at FROM releases WHERE licence IN (" + leadOn + ")").bind(P).first(); /* plant:erase-released-stays */
      const marks = await c.db.prepare("SELECT MAX(" + endOf("l.") + ") AS e, " + liveOf("l.") + " AS live FROM entra_keys k JOIN licences l ON l.id = k.licence "
        + "WHERE k.licence IN (" + leadOn + ") AND l.seat_source = 'entra' AND k.lead NOT IN (SELECT lead FROM bindings)").bind(P, now).first(); /* plant:erase-marks-stays */
      /* The person's orders: those of a licence they own or a subscription of theirs paid for (orders.licence, which every writer of orders
         records since 0016), read before the erasure takes the ownership. Named by the purge's own rule (orderLastYear) and the orders
         hold, so the date is the one the purge will keep to: the later of their orders' last years, and the day after it ends. An order
         with no licence recorded, or whose licence has gone, belongs to nobody this service can name, and is not named here. */
      const theirOrders = await c.db.prepare("SELECT MAX(" + orderLastYear("o.") + ") AS y FROM orders o WHERE o.licence IN "
        + "(SELECT id FROM licences WHERE owner = ?1 UNION SELECT licence FROM pay_subs WHERE person = ?1)").bind(P).first(); /* plant:erase-orders-stays */
      const ordersHeld = await one("SELECT COUNT(*) AS n FROM purge_holds WHERE scope = ?1", ORDERS_HOLD) > 0;
      const until = now + ERASURE_MS;
      const kept = await c.db.prepare("SELECT address FROM persons WHERE person = ?1").bind(P).first();
      const stmts = eraseStatements({ person: q => q(P), until, now, addressKey: kept ? await addressKeyed(c.cfg, kept.address) : null }).map(x => c.db.prepare(x.sql).bind(...x.values));
      const res = await c.db.batch(storeForms() ? stmts.concat(c.db.prepare("SELECT rt, code FROM stores WHERE ended_at > 0 AND person = ?1").bind(P)) : stmts);
      if (storeForms()) await postEnded(c.db, c.cfg, c.env, res[res.length - 1].results, now); /* plant:store-erase-post */
      /* The desks named to the leads, and those held back as shared (erasure's first two statements, as their own batch results count them). */
      const relay = res[0].meta.changes, sharedHeld = res[1].meta.changes; /* plant:erase-shared-stays */
      const queued = relay > 0 && await one("SELECT COUNT(*) AS n FROM (SELECT licence FROM erasures WHERE until > 0 AND licence IN (SELECT licence FROM erasures "
        + "WHERE until = ?1) GROUP BY licence HAVING COUNT(*) > ?2)", until, ERASED_MAX) > 0;
      const storeKept = await one("SELECT COUNT(*) AS n FROM stores WHERE person = ?1 AND ended_at > 0", P); /* plant:store-erase-stays */
      const memberEnd = await c.db.prepare("SELECT MAX(MAX(until, was_until, set_at + ?3)) AS e FROM member_keys WHERE person = ?1 AND (until > ?2 OR was_until > ?2 OR set_at + ?3 > ?2)").bind(P, now, MEMBER_CHANGE_MS).first(); /* plant:erase-member-stays */
      const stays = [];
      const along = (o, live) => (live ? Object.assign(o, { while: "licence" }) : o);
      if (trial && trial.e !== null) stays.push({ kept: "trial-had", until: dayOf(trial.e + RETENTION_MS) });
      if (paying && paying.e !== null) stays.push(along({ kept: "payer", until: dayOf(paying.e + RETENTION_MS) }, paying.live === 1));
      if (billed && billed.e !== null) stays.push(along({ kept: "licence-email", until: dayOf(billed.e + RETENTION_MS) }, billed.live === 1));
      if (relay > 0) stays.push(queued ? { kept: "relay-desks", until: dayOf(until), while: "queue" } : { kept: "relay-desks", until: dayOf(until) });
      if (sharedHeld > 0) stays.push({ kept: "relay-desks-shared", until: null, while: "shared" });
      if (storeKept > 0) stays.push({ kept: "store-end", until: dayOf(now + REMOVAL_MS) });
      if (released && released.at !== null) stays.push({ kept: "released-keys", until: dayOf(released.at + RELEASE_KEEP_MS), may: true });
      if (theirOrders && theirOrders.y !== null) {
        const o = { kept: "orders", until: (Number(theirOrders.y) + 1) + "-01-01" };
        stays.push(ordersHeld ? Object.assign(o, { while: "hold" }) : o); /* plant:erase-orders-hold */
      }
      if (marks && marks.e !== null) stays.push(along({ kept: "released-key-marks", until: dayOf(marks.e + RETENTION_MS), may: true }, marks.live === 1));
      if (memberEnd && memberEnd.e !== null) stays.push({ kept: "member-keys", until: dayOf(memberEnd.e) });
      return answer(200, { ok: true, erased: { licences, desks }, owned, stays });
    },

    /* A PERSON'S STORE GRANT AND STORE CERTIFICATE, to a desk its person's own sign-in seated within STORE_PROOF_MS: a store grant for S,
       naming the person's code, running to the seat's licence end within the relay's span, paid where the licence is; and this desk's
       store certificate for a day. The relay team id is kept as the person's store; one kept for another person or another S
       is refused; a desk that made this store because the folder held none (replace) ends the person's other live stores. */
    async "store/grant"(c) {
      const b = c.body;
      if (!exactly(b, ["desk", "rt", "lead", "t", "sig"], ["company", "replace"]) || !HEX64.test(String(b.desk)) || !DOOR_RT_RE.test(String(b.rt))
          || !HEX64.test(String(b.lead)) || !isT(b.t) || !HEX128.test(String(b.sig)) || (b.company !== undefined && b.company !== true)
          || (b.replace !== undefined && b.replace !== true)) return malformed();
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", b.desk]], c.now)) return slowDown();
      if (!storeForms()) return unavailable();
      const no = await signedOk(c.db, c.cfg, Q.storeGrantBytes({ desk: b.desk, rt: b.rt, lead: b.lead, t: b.t, company: b.company, replace: b.replace }), b.desk, b.sig, b.t, c.now); /* plant:store-grant-signed */
      if (no) return no;
      /* This very desk, seated by a sign-in of its own (desk_keys, which every seated signin/desk stamps and a sign-out, a freed seat or a
         withdrawal zeroes), on its person's desk seat proved within PROOF_DAYS on a running licence: a computer whose sign-in ended at the
         provider, or whose seat was freed, is handed no store certificate after its last, which runs a day. */
      let fresh = 0;
      fresh = c.now - STORE_PROOF_MS; /* plant:store-grant-fresh */
      const seat = await c.db.prepare("SELECT d.person AS person, p.code AS code, l.id AS id, l.paid_until AS paid_until, l.trial_ends AS trial_ends "
        + "FROM desk_keys d JOIN persons p ON p.person = d.person JOIN licences l ON l.id = d.licence "
        + "JOIN seats s ON s.person = d.person AND s.licence = d.licence AND s.kind = 'desk' "
        + "WHERE d.desk_key = ?1 AND d.seen_at > ?2 AND s.proved_at > ?3 AND l.refunded = 0 AND (l.paid_until > ?4 OR l.trial_ends > ?4) "
        + "ORDER BY d.seen_at DESC, (l.trial_ends IS NULL) DESC, l.paid_until DESC LIMIT 1").bind(b.desk, fresh, c.now - PROOF_MS, c.now).first();
      if (!seat) return signinAgainStore(); /* plant:store-grant-seat */
      const held = { person: seat.person, code: seat.code };
      /* A STORE KEEPS THE KIND AND THE LICENCE IT WAS MADE WITH (Argon's second review of the sign-in, finding 6): a company store is the
         licence's it was made on, ended at its person's removal from that licence, and a person's own is no licence's. The row is written
         first where none is kept, then judged as kept, so the judgement and the row are one: another person's store, another S, an ended
         store, the other kind, or a company store asked from a seat on another licence is refused, and a refusal writes nothing. */
      const licence = b.company === true ? seat.id : null;
      let replaces = false;
      replaces = b.replace === true; /* plant:store-grant-replace-only */
      const sameOwner = "EXISTS (SELECT 1 FROM stores s WHERE s.rt = ?1 AND s.person = ?2 AND s.lead = ?3 AND s.ended_at = 0 AND s.licence IS ?4)";
      const res = await c.db.batch([
        c.db.prepare("INSERT INTO stores (rt, person, code, lead, licence, made_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6) ON CONFLICT (rt) DO NOTHING")
          .bind(b.rt, held.person, held.code, b.lead, licence, c.now),
        c.db.prepare("SELECT person, lead, ended_at, licence FROM stores WHERE rt = ?1").bind(b.rt),
      ].concat(replaces && storeForms() ? [c.db.prepare("UPDATE stores SET ended_at = ?5 WHERE ended_at = 0 AND person = ?2 AND rt <> ?1 AND "
        + sameOwner + " RETURNING rt, code").bind(b.rt, held.person, b.lead, licence, c.now)] : [])); /* plant:store-grant-replaces */
      const kept = res[1].results[0] || null; /* plant:store-grant-as-kept */
      if (!kept || kept.person !== held.person || kept.lead !== b.lead || kept.ended_at > 0) return answer(403, { ok: false, reason: "store" }); /* plant:store-grant-owner */
      if (kept.licence !== licence) return answer(403, { ok: false, reason: "store" }); /* plant:store-grant-kind */
      /* Only a desk that made this store because the folder held none says it replaces the person's others; any other grant, two
         computers racing to set up included, ends nothing (the desk adopts the store the folder holds and never asks for its own). */
      if (replaces && storeForms()) await postEnded(c.db, c.cfg, c.env, res[2].results, c.now);
      const trial = seat.trial_ends !== null && seat.trial_ends !== undefined;
      const until = Math.min(trial ? seat.trial_ends : seat.paid_until, c.now + grantMax, c.cfg.delegation.until);
      const grant = { kind: "etiuda-store-grant", format: 1, lead: b.lead, code: held.code, issued: c.now, until, paid: !trial, via: c.cfg.delegation,
        sig: { alg: GRANT_SIG_ALG, keyId: c.cfg.delegation.key.id, value: "" } };
      grant.sig.value = await signHex(c.cfg, rules.grantBytes(grant));
      const why = rules.grantWhy(grant, b.lead, c.now, roots);
      if (why !== null) throw new Error("a store grant the relay would refuse: " + why);
      const store = await storeCertFor(c.cfg, b.desk, held.code, c.now); /* plant:store-cert-hand */
      return answer(200, { ok: true, grant, store });
    },

    /* A PERSON ENDS THEIR STORE EVERYWHERE, from a desk signed in as them: the store-end notice is posted for that relay team where it is
       the person's live store. Answered alike whether or not it was, so the answer tells a stranger nothing. */
    async "store/end"(c) {
      const b = c.body;
      if (!exactly(b, ["desk", "rt", "t", "sig"]) || !HEX64.test(String(b.desk)) || !DOOR_RT_RE.test(String(b.rt)) || !isT(b.t)
          || !HEX128.test(String(b.sig))) return malformed();
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", b.desk]], c.now)) return slowDown();
      if (!storeForms()) return unavailable();
      const no = await signedOk(c.db, c.cfg, Q.storeEndBytes({ desk: b.desk, rt: b.rt, t: b.t }), b.desk, b.sig, b.t, c.now); /* plant:store-end-signed */
      if (no) return no;
      /* A DESK HOLDING ITS PLACE NOW (Argon's second review of the sign-in, finding 7): its place on a licence (desk_keys), which a sign-out,
         a freed seat, a withdrawal, an Entra removal and a pooled desk's place taken over each zero, seen within that licence's grace, as
         store/grant's desk must be; not a desk merely ever signed in (person_desks), which none of those touch but the sign-out. The store
         ended is still only that desk's person's own. */
      const held = await c.db.prepare("SELECT d.person AS person FROM desk_keys d JOIN licences l ON l.id = d.licence WHERE d.desk_key = ?1 "
        + "AND d.seen_at > ?2 - l.grace_days * ?3 ORDER BY d.seen_at DESC LIMIT 1").bind(b.desk, c.now, DAY).first(); /* plant:store-end-placed */
      if (held) await endStores(c.db, c.cfg, c.env, "person = ?1 AND rt = ?2", [held.person, b.rt], c.now); /* plant:store-end-person */
      return answer(200, { ok: true });
    },

    /* A SIGNED-IN PERSON ASKS A LEAD (the one act; Max, 2026-11-16 22:15, to Claude alpha's point he quoted back: "A newcomer presses once to ask,
       even when there is only one lead. That press is what sends their name and address to the lead, so it's the moment they agree to share
       them."). Signed by the asking desk or Studio key, naming the licence by its public reference, the lead by the pseudonym the sign-in answer
       named them by, and a team of that lead's or none. The licence is one the person may ask (askable). Their press completes what a lead has
       pressed already, an invitation to them there or an Accept that waits for them, in one batch; otherwise the ask is kept, one open per person
       per licence, a new one replacing it (askOrTake). Anyone else, and a lead or team not of that licence, is answered as a key with no seat. */
    async "ask"(c) {
      const b = c.body;
      if (!exactly(b, ["kind", "key", "licence", "lead", "t", "sig"], ["team"]) || (b.kind !== "desk" && b.kind !== "studio") || !HEX64.test(String(b.key))
          || !REF_RE.test(String(b.licence)) || !HEX64.test(String(b.lead)) || (b.team !== undefined && !DOOR_TEAM_RE.test(String(b.team)))
          || !isT(b.t) || !HEX128.test(String(b.sig))) return malformed();
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", b.key]], c.now)) return slowDown();
      const no = await signedOk(c.db, c.cfg, Q.askBytes({ kind: b.kind, key: b.key, licence: b.licence, lead: b.lead, team: b.team, t: b.t }), b.key, b.sig, b.t, c.now);
      if (no) return no;
      const who = await askerOf(c.db, c.cfg, b.kind, b.key, c.now);
      if (!who) return noSeatHere(); /* plant:ask-who */
      const lic = (await askable(c.db, c.cfg, who, c.now)).find(x => x.ref === b.licence);
      if (!lic) return noSeatHere(); /* plant:ask-licence */
      const lead = await leadNamed(c.db, c.cfg, lic, b.lead);
      if (!lead || lead === who.person) return noSeatHere();
      if (b.team !== undefined && !await leadsTeam(c.db, lic.id, lead, b.team)) return noSeatHere(); /* plant:ask-team */
      return askOrTake(c, who, lic, lead, b);
    },

    /* WHERE AN ASK STANDS, for the asking key's person (statusOf): "waiting", "offered", "accepted", "refused", "invited" or "gone". Answered
       alike, "gone", for a key the service knows of nobody. */
    async "ask/status"(c) {
      const b = c.body;
      if (!exactly(b, ["kind", "key", "t", "sig"]) || (b.kind !== "desk" && b.kind !== "studio") || !HEX64.test(String(b.key)) || !isT(b.t)
          || !HEX128.test(String(b.sig))) return malformed();
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", b.key]], c.now)) return slowDown();
      const no = await signedOk(c.db, c.cfg, Q.askStatusBytes({ kind: b.kind, key: b.key, t: b.t }), b.key, b.sig, b.t, c.now);
      if (no) return no;
      const who = await askerOf(c.db, c.cfg, b.kind, b.key, c.now);
      return answer(200, who ? await statusOf(c.db, c.cfg, who, c.now) : { ok: true, state: "gone" });
    },

    /* AN ASK ENDED BEFORE IT TAKES EFFECT. A lead refuses one naming them, or the owner any on its licence, by its id ("refused"); or the asker
       takes theirs back ("Take it back", the design's 1.1), signed by the asking key under its own line, every ask of their person not accepted
       going, so their status reads gone.
       Answered alike whether or not there was one. */
    async "ask/refuse"(c) {
      const b = c.body;
      const back = b.ask === undefined;
      if ((back ? !exactly(b, ["kind", "key", "t", "sig"]) || (b.kind !== "desk" && b.kind !== "studio") || !HEX64.test(String(b.key))
          : !exactly(b, ["ask", "lead", "t", "sig"]) || !ASK_ID_RE.test(String(b.ask)) || !HEX64.test(String(b.lead))) || !isT(b.t) || !HEX128.test(String(b.sig))) return malformed();
      const signer = back ? b.key : b.lead;
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", signer]], c.now)) return slowDown();
      const no = await signedOk(c.db, c.cfg, back ? Q.askBackBytes({ kind: b.kind, key: b.key, t: b.t }) : Q.askRefuseBytes({ ask: b.ask, lead: b.lead, t: b.t }),
        signer, b.sig, b.t, c.now);
      if (no) return no;
      if (back) {
        const who = await askerOf(c.db, c.cfg, b.kind, b.key, c.now);
        if (who) await c.db.prepare("DELETE FROM asks WHERE person = ?1 AND state <> 'accepted'").bind(who.person).run(); /* plant:ask-back */
        return answer(200, { ok: true });
      }
      if (await managedKey(c.db, b.lead)) return managed();
      const mine = await leadOf(c.db, b.lead, c.now);
      if (!mine) return noSeatHere();
      await c.db.prepare("UPDATE asks SET state = 'refused', answered_at = ?1 WHERE id = ?2 AND licence = ?3 AND state IN ('open', 'offered') AND at > ?4 "
        + "AND (lead = ?5 OR ?6 = 1)").bind(c.now, b.ask, mine.licence, c.now - ASK_MS, mine.person, mine.owner ? 1 : 0).run(); /* plant:refuse-lead */
      return answer(200, { ok: true });
    },

    /* THE ADMINISTRATOR PASSES AN ASK to a lead beneath (the design's 1.1: "I do not know" lands with the administrator, who passes it on): the
       licence's owner alone, to a lead it named, by that lead's pseudonym; the ask then names that lead and no team. Anyone else, or a lead not
       named on the licence, is answered as a key with no seat. */
    async "ask/pass"(c) {
      const b = c.body;
      if (!exactly(b, ["ask", "to", "lead", "t", "sig"]) || !ASK_ID_RE.test(String(b.ask)) || !HEX64.test(String(b.to)) || !HEX64.test(String(b.lead))
          || !isT(b.t) || !HEX128.test(String(b.sig))) return malformed();
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", b.lead]], c.now)) return slowDown();
      const no = await signedOk(c.db, c.cfg, Q.askPassBytes({ ask: b.ask, to: b.to, lead: b.lead, t: b.t }), b.lead, b.sig, b.t, c.now);
      if (no) return no;
      if (await managedKey(c.db, b.lead)) return managed();
      const mine = await leadOf(c.db, b.lead, c.now);
      if (!mine || !mine.owner) return noSeatHere(); /* plant:pass-owner */
      const named = await c.db.prepare("SELECT person FROM lead_names WHERE licence = ?1").bind(mine.licence).all();
      let to = null;
      for (const r of named.results) if (await personOutOf(c.cfg, mine.licence, r.person) === b.to) to = r.person;
      if (!to) return noSeatHere();
      await c.db.prepare("UPDATE asks SET lead = ?1, team = NULL WHERE id = ?2 AND licence = ?3 AND state = 'open' AND at > ?4").bind(to, b.ask, mine.licence, c.now - ASK_MS).run();
      return answer(200, { ok: true });
    },

    /* A LEAD INVITES AN ADDRESS (the one act; the design's 1.1 and 2.1): a person who has not signed in yet, by their work address, kept for
       INVITE_DAYS as a keyed hash and never in the clear (board 1017's rule 5, addressKeyed), so the lead and the administrator see it pending
       by its handle (handleOf, answered here as `invite`), each Studio keeping beside the handle what it typed; on the lead's team or none. One
       per address per licence, a new one replacing it. It holds no seat, and no sign-in takes it (Max, 2026-11-22 08:37, on Claude alpha's
       option B: the invited member is seated only when they press Join): it waits, listed in `invited`, and the person's own Join (ask) takes it
       where the safeguard holds, else makes the request a lead confirms. Anyone else is answered as a key with no seat; an address out of shape is malformed. */
    async "invite"(c) {
      const b = c.body;
      if (!exactly(b, ["address", "lead", "t", "sig"], ["team"]) || addressOf(b.address) !== b.address || (b.team !== undefined && !DOOR_TEAM_RE.test(String(b.team)))
          || !HEX64.test(String(b.lead)) || !isT(b.t) || !HEX128.test(String(b.sig))) return malformed(); /* plant:invite-shape */
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", b.lead]], c.now)) return slowDown();
      const no = await signedOk(c.db, c.cfg, Q.inviteBytes({ address: b.address, team: b.team, lead: b.lead, t: b.t }), b.lead, b.sig, b.t, c.now);
      if (no) return no;
      if (await managedKey(c.db, b.lead)) return managed();
      const mine = await leadOf(c.db, b.lead, c.now);
      if (!mine) return noSeatHere();
      if (b.team !== undefined && !await leadsTeam(c.db, mine.licence, mine.person, b.team)) return noSeatHere(); /* plant:invite-team */
      /* THE FIRST INVITATION STANDS (Claude alpha's ruling (b), 11:41): another lead's invitation for this address on this licence is not replaced,
         the owner's included; the answer is refused with a named reason Studio shows (no words of the service's own); its author renews it.
         One past its days is taken over whole, the next lead's name with that lead's team (the test architect's read of 13:13). */
      const res = await c.db.prepare("INSERT INTO invites (licence, address, lead, team, at) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT (licence, address) DO UPDATE SET "
        + "lead = excluded.lead, team = excluded.team, at = excluded.at WHERE invites.lead = excluded.lead OR invites.at <= excluded.at - " + INVITE_MS) /* plant:invite-first-stands */
        .bind(mine.licence, await addressKeyed(c.cfg, b.address), mine.person, b.team === undefined ? null : b.team, c.now).run(); /* plant:invite-keyed */
      if (res.meta.changes !== 1) return answer(409, { ok: false, reason: "already-invited" });
      return answer(200, { ok: true, invite: await handleOf(c.cfg, "desk", mine.licence, await addressKeyed(c.cfg, b.address)), until: c.now + INVITE_MS });
    },

    /* A LEAD WITHDRAWS AN INVITATION it made, or the owner any on its licence, by the address as typed or, under its own signed line, by the
       handle invite and person/list answered (for a Studio that did not type it). Answered alike whether or not there was one. */
    async "invite/withdraw"(c) {
      const b = c.body;
      const byHandle = b.invite !== undefined;
      if ((byHandle ? !exactly(b, ["invite", "lead", "t", "sig"]) || !REF_RE.test(String(b.invite))
          : !exactly(b, ["address", "lead", "t", "sig"]) || addressOf(b.address) !== b.address) || !HEX64.test(String(b.lead)) || !isT(b.t)
          || !HEX128.test(String(b.sig))) return malformed();
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", b.lead]], c.now)) return slowDown();
      const no = await signedOk(c.db, c.cfg, byHandle ? Q.inviteWithdrawHandleBytes({ invite: b.invite, lead: b.lead, t: b.t })
        : Q.inviteWithdrawBytes({ address: b.address, lead: b.lead, t: b.t }), b.lead, b.sig, b.t, c.now);
      if (no) return no;
      if (await managedKey(c.db, b.lead)) return managed();
      const mine = await leadOf(c.db, b.lead, c.now);
      if (!mine) return noSeatHere();
      let key = byHandle ? null : await addressKeyed(c.cfg, b.address);
      if (byHandle) {
        const rows = await c.db.prepare("SELECT address FROM invites WHERE licence = ?1 AND (lead = ?2 OR ?3 = 1)").bind(mine.licence, mine.person, mine.owner ? 1 : 0).all();
        for (const r of rows.results) if (await handleOf(c.cfg, "desk", mine.licence, r.address) === b.invite) { key = r.address; break; } /* plant:withdraw-handle */
      }
      await c.db.prepare("DELETE FROM invites WHERE licence = ?1 AND address = ?2 AND (lead = ?3 OR ?4 = 1)").bind(mine.licence, key, mine.person,
        mine.owner ? 1 : 0).run(); /* plant:withdraw-invite */
      return answer(200, { ok: true });
    },

    /* THE OWNER NAMES A LEAD BY ADDRESS (board 1017; Max's ruling of 2026-11-20 22:16, "I definitely agree.", to a naming by email address
       or from the licence's teams, the named person's own Accept, and no code on any screen; Claude alpha's word of 2026-11-22 00:57, the
       criterion: "nobody is ever seated, as a lead or on a desk, on the strength of an address the provider does not vouch"). Route
       lead/invite, lead/name's by code with `address` in place of `code`, signed under its own line: the owner of a paid licence (not a trial, not desk-only, not one that
       follows Entra) names an address, kept as a keyed hash for INVITE_DAYS (lead_invites; rule 5), one per address per licence, a new one
       from the owner renewing it. Nothing is seated and nobody is told by mail (rule 4): the person meets the naming at their next check in
       Studio (namingOf, `via` "address"), and their own Accept (lead/accept) takes the lead seat where their provider vouches the address
       (and only then: an admitted organisation is no vouching, Claude alpha's rule on B2 of 2026-11-22); otherwise the Accept makes them a candidate the owner confirms (lead/confirm), shown with
       what their provider says of them. Lead seats are counted as a naming by code counts them, with the namings still waiting counted
       too, so a waiting naming never meets "full" at its Accept but by a seat taken some other way. Answered with the naming's handle and
       its end; "full", or a key with no seat for anyone but such an owner. */
    /* THE OWNER NAMES A LEAD FROM THE LICENCE'S PEOPLE (the same ruling: "or picks someone already on one of the licence's teams"): route
       lead/pick, with `person`, the pseudonym on this licence that person/list or seat/list gave, of someone admitted to it by name or seated
       on it: the naming lead/name by code makes, under its own signed line, the person's own Accept still theirs (namingOf, lead/accept). */
    async "lead/invite"(c) {
      const b = c.body;
      if (!exactly(b, ["address", "lead", "t", "sig"]) || addressOf(b.address) !== b.address || !HEX64.test(String(b.lead)) || !isT(b.t)
          || !HEX128.test(String(b.sig))) return malformed();
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", b.lead]], c.now)) return slowDown();
      const no = await signedOk(c.db, c.cfg, Q.leadNameAddressBytes({ address: b.address, lead: b.lead, t: b.t }), b.lead, b.sig, b.t, c.now);
      if (no) return no;
      if (await managedKey(c.db, b.lead)) return managed();
      const mine = await leadOf(c.db, b.lead, c.now);
      if (!mine || !mine.owner) return noSeatHere(); /* plant:name-address-owner */
      const key = await addressKeyed(c.cfg, b.address);
      const res = await c.db.batch([
        c.db.prepare("DELETE FROM lead_candidates WHERE licence = ?1 AND address = ?2 AND NOT EXISTS (SELECT 1 FROM lead_invites WHERE licence = ?1 AND address = ?2 AND at > ?3)")
          .bind(mine.licence, key, c.now - INVITE_MS),
        c.db.prepare("INSERT INTO lead_invites (licence, address, named_by, at) SELECT ?1, ?2, ?3, ?4 WHERE EXISTS (SELECT 1 FROM licences WHERE id = ?1 AND owner = ?3 "
          + "AND desk_only = 0 AND refunded = 0 AND trial_ends IS NULL) "
          + "AND (EXISTS (SELECT 1 FROM lead_invites WHERE licence = ?1 AND address = ?2 AND at > ?4 - ?5) "
          + "OR (SELECT COUNT(*) FROM lead_names WHERE licence = ?1 AND person <> ?3) + (SELECT COUNT(*) FROM lead_invites WHERE licence = ?1 AND at > ?4 - ?5) + 1 < (SELECT "
          + inForceCol("lead_seats", "licences.id", "?4") + " FROM licences WHERE id = ?1)) " /* plant:name-address-count */
          + "ON CONFLICT (licence, address) DO UPDATE SET named_by = excluded.named_by, at = excluded.at").bind(mine.licence, key, mine.person, c.now, INVITE_MS),
      ]);
      if (res[1].meta.changes !== 1) return noSeat();
      return answer(200, { ok: true, naming: await handleOf(c.cfg, "lead", mine.licence, key), until: c.now + INVITE_MS });
    },

    async "lead/pick"(c) {
      const b = c.body;
      if (!exactly(b, ["person", "lead", "t", "sig"]) || !HEX64.test(String(b.person)) || !HEX64.test(String(b.lead)) || !isT(b.t) || !HEX128.test(String(b.sig))) return malformed();
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", b.lead]], c.now)) return slowDown();
      const no = await signedOk(c.db, c.cfg, Q.leadNamePersonBytes({ person: b.person, lead: b.lead, t: b.t }), b.lead, b.sig, b.t, c.now);
      if (no) return no;
      if (await managedKey(c.db, b.lead)) return managed();
      const mine = await leadOf(c.db, b.lead, c.now);
      if (!mine || !mine.owner) return noSeatHere(); /* plant:name-person-owner */
      /* On the licence's lists: admitted to it by name, seated on it (either kind), or signed in, to Studio or a desk, from an organisation it
         admits (never through a person), as seat/list's unnamed and person/list's people are; found by the pseudonym those lists give. */
      const rows = await c.db.prepare("SELECT p.person AS person, p.provider AS provider FROM persons p WHERE p.person IN (SELECT substr(org, ?2) FROM admits WHERE licence = ?1 "
        + "AND substr(org, 1, ?3) = ?4 UNION SELECT person FROM seats WHERE licence = ?1 "
        + "UNION SELECT s.person FROM seats s JOIN admits a ON a.licence = ?1 AND a.provider = s.provider AND a.org = s.org WHERE s.kind = 'lead' AND substr(a.org, 1, ?3) <> ?4 "
        + "UNION SELECT d.person FROM person_desks d JOIN persons q ON q.person = d.person JOIN admits a ON a.licence = ?1 AND a.provider = q.provider AND a.org = d.org "
        + "WHERE substr(a.org, 1, ?3) <> ?4)").bind(mine.licence, PERSON.length + 1, PERSON.length, PERSON).all(); /* plant:name-person-on */
      let who = null;
      for (const r of rows.results) if (await personOutOf(c.cfg, mine.licence, r.person) === b.person) { who = r; break; }
      if (!who) return noSeatHere();
      if (who.person === mine.person) return answer(200, { ok: true, named: b.person });
      const res = await c.db.batch(namingStatements(c, mine, who));
      if (res[res.length - 1].results[0].named !== 1) return noSeat();
      return answer(200, { ok: true, named: b.person });
    },

    /* THE OWNER CONFIRMS A CANDIDATE (board 1017's rule 1): a person whose own Accept of a naming by address their provider did not vouch,
       named by the pseudonym seat/list showed beside their name, provider and account kind, takes the lead seat now: the naming lead/name
       by code makes, written as accepted (they pressed), their admission by name with it, the naming by address and every candidate of it
       gone, and the desk invitation to the same address on this licence closed without a seat (rule 3: the naming's admission seats their
       desk, and one person holds one desk seat). "full" where no lead seat is free, writing nothing; anyone but the owner, or a person who
       is no candidate of that naming, is answered as a key with no seat. */
    async "lead/confirm"(c) {
      const b = c.body;
      if (!exactly(b, ["naming", "person", "lead", "t", "sig"]) || !REF_RE.test(String(b.naming)) || !HEX64.test(String(b.person)) || !HEX64.test(String(b.lead))
          || !isT(b.t) || !HEX128.test(String(b.sig))) return malformed();
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", b.lead]], c.now)) return slowDown();
      const no = await signedOk(c.db, c.cfg, Q.leadConfirmBytes({ naming: b.naming, person: b.person, lead: b.lead, t: b.t }), b.lead, b.sig, b.t, c.now);
      if (no) return no;
      if (await managedKey(c.db, b.lead)) return managed();
      const mine = await leadOf(c.db, b.lead, c.now);
      if (!mine || !mine.owner) return noSeatHere(); /* plant:confirm-owner */
      const rows = await c.db.prepare("SELECT k.address AS address, k.person AS person, k.provider AS provider FROM lead_candidates k JOIN lead_invites i ON i.licence = k.licence "
        + "AND i.address = k.address WHERE k.licence = ?1 AND i.at > ?2").bind(mine.licence, c.now - INVITE_MS).all();
      let who = null;
      for (const r of rows.results) if (await handleOf(c.cfg, "lead", mine.licence, r.address) === b.naming && await personOutOf(c.cfg, mine.licence, r.person) === b.person) { who = r; break; } /* plant:confirm-candidate */
      if (!who) return noSeatHere();
      const res = await c.db.batch(namingStatements(c, mine, who, c.now, who.address));
      if (res[res.length - 1].results[0].named !== 1) return noSeat();
      return answer(200, { ok: true, named: b.person });
    },

    /* THE OWNER WITHDRAWS A NAMING BY ADDRESS, by its handle, its candidates with it (rule 4: "the owner sees it waiting and can withdraw it").
       Answered alike whether or not there was one; anyone but the owner as a key with no seat. */
    async "lead/withdraw"(c) {
      const b = c.body;
      if (!exactly(b, ["naming", "lead", "t", "sig"]) || !REF_RE.test(String(b.naming)) || !HEX64.test(String(b.lead)) || !isT(b.t) || !HEX128.test(String(b.sig))) return malformed();
      if (await overLimit(c.db, c.route, [["ip", c.ip], ["lead", b.lead]], c.now)) return slowDown();
      const no = await signedOk(c.db, c.cfg, Q.leadNameWithdrawBytes({ naming: b.naming, lead: b.lead, t: b.t }), b.lead, b.sig, b.t, c.now);
      if (no) return no;
      if (await managedKey(c.db, b.lead)) return managed();
      const mine = await leadOf(c.db, b.lead, c.now);
      if (!mine || !mine.owner) return noSeatHere(); /* plant:name-withdraw-owner */
      const rows = await c.db.prepare("SELECT address FROM lead_invites WHERE licence = ?1").bind(mine.licence).all();
      for (const r of rows.results) {
        if (await handleOf(c.cfg, "lead", mine.licence, r.address) !== b.naming) continue;
        await c.db.batch([c.db.prepare("DELETE FROM lead_candidates WHERE licence = ?1 AND address = ?2").bind(mine.licence, r.address),
          c.db.prepare("DELETE FROM lead_invites WHERE licence = ?1 AND address = ?2").bind(mine.licence, r.address)]); /* plant:name-withdraw */
        break;
      }
      return answer(200, { ok: true });
    },

    /* AN ORGANISATION AS ADMITS KEEPS IT, FOR THE VENDOR (decision 15 item 6): signed by one of the roots the service trusts,
       so nobody else can have a guess hashed, and answered with the keyed hash the admits table holds, which is how the
       attach script and the vendor script learn it without HASH_KEY. Anything else is refused alike. */
    async "admin/org"(c) {
      const b = c.body;
      if (!exactly(b, ["provider", "org", "t", "sig"]) || typeof b.provider !== "string" || !/^[a-z][a-z0-9-]{1,30}$/.test(b.provider)
          || typeof b.org !== "string" || !/^[\x21-\x7e]{1,255}$/.test(b.org) || !isT(b.t) || !HEX128.test(String(b.sig))) return malformed();
      if (await overLimit(c.db, c.route, [["ip", c.ip]], c.now)) return slowDown();
      const bytes = Q.adminOrgBytes({ provider: b.provider, org: b.org, t: b.t });
      let root = null;
      for (const r of roots) if (await verified(r, bytes, b.sig)) root = r;
      if (!root) return refused(); /* plant:admin-root */
      if (await signedOk(c.db, c.cfg, bytes, root, b.sig, b.t, c.now)) return refused();
      return answer(200, { ok: true, org: await orgKeyed(c.cfg.hmac, b.provider, b.org) });
    },

    /* THE INVITATIONS TO AN ADDRESS REMOVED, FOR THE VENDOR (the Grok review beta's D5 of 2026-11-22; Claude alpha's conditions, carried by
       Claudius): for the one case of a person erased by hand (scripts/erase-person.mjs --address), who can no longer sign in, so the route
       erasure's keyed address is not to hand. Signed by one of the roots, as admin/org is; it ONLY REMOVES, every desk invitation, naming by
       address and candidacy to that address (as addressKeyed keys it), and answers their counts, never an address or its keyed form.
       Anything else is refused alike, writing nothing. */
    async "admin/address"(c) {
      const b = c.body;
      if (!exactly(b, ["address", "t", "sig"]) || addressOf(b.address) !== b.address || !isT(b.t) || !HEX128.test(String(b.sig))) return malformed();
      if (await overLimit(c.db, c.route, [["ip", c.ip]], c.now)) return slowDown();
      const bytes = Q.adminAddressBytes({ address: b.address, t: b.t });
      let root = null;
      for (const r of roots) if (await verified(r, bytes, b.sig)) root = r;
      if (!root) return refused(); /* plant:admin-address-root */
      if (await signedOk(c.db, c.cfg, bytes, root, b.sig, b.t, c.now)) return refused(); /* plant:admin-address-replay */
      const key = await addressKeyed(c.cfg, b.address);
      const res = await c.db.batch([
        c.db.prepare("DELETE FROM invites WHERE address = ?1").bind(key), /* plant:admin-address-invites */
        c.db.prepare("DELETE FROM lead_invites WHERE address = ?1").bind(key),
        c.db.prepare("DELETE FROM lead_candidates WHERE address = ?1").bind(key),
      ]);
      return answer(200, { ok: true, invites: res[0].meta.changes, namings: res[1].meta.changes, candidates: res[2].meta.changes }); /* plant:admin-address-counts */
    },
  };
  const noSeatHere = () => answer(404, { ok: false, reason: "no-seat" });
  const signinAgainStore = () => answer(403, { ok: false, reason: "signin" });

  /* A LEAD UNNAMED BY THE OWNER (a team is its lead's own): its name on the licence goes, and the people it admitted become the
     owner's, so its team keeps its seats. Statements for the owner's batch; the first returns the person where a name went. Each
     holds the owner's condition again where `owned` asks it, for a batch that has not checked it before. */
  function unnamed(db, licence, person, owner, owned) {
    const OWNS = owned ? " AND EXISTS (SELECT 1 FROM licences WHERE id = ?1 AND owner = ?3)" : "";
    return [
      db.prepare("DELETE FROM lead_names WHERE licence = ?1 AND person = ?2 AND ?2 <> ?3" + OWNS + " RETURNING person").bind(licence, person, owner), /* plant:unname */
      db.prepare("UPDATE OR IGNORE admitted_by SET lead = ?3 WHERE licence = ?1 AND lead = ?2 AND ?2 <> ?3" + OWNS).bind(licence, person, owner), /* plant:unname-team */
      db.prepare("DELETE FROM admitted_by WHERE licence = ?1 AND lead = ?2 AND ?2 <> ?3" + OWNS).bind(licence, person, owner),
      /* The one act: the asks naming them and the invitations they made become the owner's too. */
      db.prepare("UPDATE asks SET lead = ?3 WHERE licence = ?1 AND lead = ?2 AND ?2 <> ?3" + OWNS).bind(licence, person, owner), /* plant:unname-asks */
      db.prepare("UPDATE invites SET lead = ?3 WHERE licence = ?1 AND lead = ?2 AND ?2 <> ?3" + OWNS).bind(licence, person, owner),
    ];
  }

  /* EACH TEAM'S SIZE on a licence: its desk seats seen within the grace and proved within PROOF_DAYS, by lead (a person), each
     counted for every lead now leading who admitted them by name, else for the owner. */
  async function teamSizes(db, row, now) {
    const STANDING = "(a.lead = ?4 OR EXISTS (SELECT 1 FROM lead_names n WHERE n.licence = ?1 AND n.person = a.lead))";
    const LIVE = "s.licence = ?1 AND s.kind = 'desk' AND s.seen_at > ?2 AND s.proved_at > ?3";
    const got = await db.prepare("SELECT lead, COUNT(*) AS n FROM (SELECT a.lead AS lead FROM seats s JOIN admitted_by a ON a.licence = s.licence "
      + "AND a.person = s.person WHERE " + LIVE + " AND " + STANDING + " UNION ALL SELECT ?4 AS lead FROM seats s WHERE " + LIVE
      + " AND NOT EXISTS (SELECT 1 FROM admitted_by a WHERE a.licence = ?1 AND a.person = s.person AND " + STANDING + ")) GROUP BY lead")
      .bind(row.id, now - row.grace_days * DAY, now - PROOF_MS, row.owner).all();
    return new Map(got.results.map(r => [r.lead, r.n]));
  }

  /* THE DESKS OF PEOPLE WHO ASKED TO BE ERASED (section 13), handed to a key leading the licence its check answers for, as `erased`,
     their public keys alone, so its Studio takes them off the relay teams it leads; for ERASURE_DAYS, and nothing where there are none. */
  async function erasedFor(db, lead, h, now) {
    if (!h.row || h.row.refunded) return {};
    const mine = await leadOf(db, lead, now);
    if (!mine || mine.licence !== h.row.id) return {}; /* plant:erased-lead */
    const rows = await db.prepare("SELECT desk_key FROM erasures WHERE licence = ?1 AND until > ?2 ORDER BY until, desk_key LIMIT ?3").bind(mine.licence, now, ERASED_MAX).all(); /* plant:erased-order */
    return rows.results.length ? { erased: rows.results.map(r => r.desk_key) } : {};
  }

  /* THE REVOKED KEYS' LIST as the deploy set it, for the check's answer: {revoked: the document} where REVOKED is a JSON
     object no longer than a body, else nothing. Judged by Studio, never here. */
  function revokedOf(env) {
    const text = env && env.REVOKED;
    if (typeof text !== "string" || !text || text.length > BODY_MAX) return {};
    try { const doc = JSON.parse(text); return plain(doc) ? { revoked: doc } : {}; } catch { return {}; }
  }

  /* A VERSION NOTE, served as handed (above): a GET alone, under the same configuration and the same limit as every route. */
  async function noteRoute(request, env, name) {
    if (request.method !== "GET") return missing(); /* plant:note-get */
    const now = clock(env);
    if (!Number.isSafeInteger(now)) return fault();
    const cfg = await configOf(env);
    /* The same window and the same keyed address as every route, written apart so each route's own plant finds its line once. */
    const inWindow = !!cfg && now >= cfg.delegation.from && now < cfg.delegation.until;
    if (!inWindow) return unavailable();
    const caller = request.headers.get("cf-connecting-ip") || "unknown";
    const ip = await keyedHash(cfg.hmac, KEYED.ip, caller);
    if (await overLimit(env.DB, name, [["ip", ip]], now)) return slowDown(); /* plant:note-rate */
    const text = env[NOTES[name]];
    if (typeof text !== "string" || !text) return missing();
    const bytes = new TextEncoder().encode(text);
    if (bytes.length > NOTE_MAX) return missing(); /* plant:note-max */
    return new Response(bytes, { status: 200, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }

  async function route(request, env) {
    const url = new URL(request.url);
    const api = apiPrefixOf(env); /* plant:prefix */
    if (!api) return unavailable();
    if (url.protocol !== "https:" || url.search !== "" || !url.pathname.startsWith(api)) return missing();
    const name = url.pathname.slice(api.length);
    if (name.startsWith("pay/")) return pay(request, env, name.slice(4)); /* plant:paddle-dispatch */
    if (Object.prototype.hasOwnProperty.call(NOTES, name)) return noteRoute(request, env, name);
    if (!Object.prototype.hasOwnProperty.call(ROUTES, name) || request.method !== "POST") return missing();
    const now = clock(env);
    if (!Number.isSafeInteger(now)) return fault();
    const cfg = await configOf(env);
    if (!cfg || now < cfg.delegation.from || now >= cfg.delegation.until) return unavailable();
    const body = await bodyOf(request);
    if (!plain(body)) return malformed();
    const ip = await keyedHash(cfg.hmac, KEYED.ip, request.headers.get("cf-connecting-ip") || "unknown"); /* plant:keyed-ip */
    return ROUTES[name]({ route: name, body, db: env.DB, cfg, now, ip, env });
  }

  return {
    async fetch(request, env) {
      try { return await route(request, env); } catch (e) { return e && e.down ? unavailable() : fault(); }
    },
    /* The store-end notices the relay has not taken yet, posted again: the Worker's schedule. */
    async storeEnds(env) {
      const cfg = await configOf(env);
      if (!cfg || !env || !env.DB || !storeForms()) return 0;
      const rows = await env.DB.prepare("SELECT rt, code FROM stores WHERE ended_at > 0").all();
      await postEnded(env.DB, cfg, env, rows.results, clock(env)); /* plant:store-end-retry */
      return rows.results.length;
    },
  };
}

/** The body as JSON, read to BODY_MAX and no further; null where it is longer, absent or not JSON. */
async function bodyOf(request) {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const parts = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > BODY_MAX) { try { await reader.cancel(); } catch { /* gone already */ } return null; }
    parts.push(value);
  }
  const all = new Uint8Array(size);
  let at = 0;
  for (const p of parts) { all.set(p, at); at += p.byteLength; }
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(all)); } catch { return null; }
}

/* A PERSON REMOVED FROM A LICENCE (section 13): the statement stamping `person`'s seat of `kind` on `licence` removed at `now`, for a
   batch that frees it (seat/free, person/withdraw, and an Entra removal when the managed half lands). The first removal's day holds
   until the person is proved back (takeSeat); the licence's owner is never stamped, being never removed but by erasure. */
/* `digest`, where given: only while that token is unspent, for a batch that spends it after (the own-licence removal at signin/desk). */
function removalStamp(db, licence, person, kind, now, digest, extra) {
  const cond = extra ? extra.cond : null, vals = extra ? extra.vals : [];
  return db.prepare("INSERT INTO removals (licence, person, kind, at) SELECT ?1, ?2, ?3, ?4 WHERE NOT EXISTS (SELECT 1 FROM licences "
    + "WHERE id = ?1 AND owner = ?2)" + (digest ? " AND NOT EXISTS (SELECT 1 FROM seen WHERE digest = ?5)" : "")
    + (cond ? " AND " + cond : "")
    + " ON CONFLICT (licence, person, kind) DO NOTHING").bind(...[licence, person, kind, now].concat(digest ? [digest] : [], vals)); /* plant:removal-owner */
}

/* Retention: seat, sign-in and trial records stay RETENTION_DAYS after a licence or trial ends, then are purged beside
   outbox on schedule. Ends at: refunded_at when refunded (stamped when NULL on first pass), trial_ends for a sign-in
   trial, paid_until for a paid licence, ends for an e-mail trial. Invoices (orders) are untouched. */
async function purgeRetention(db, now) {
  const cutoff = now - RETENTION_MS; /* plant:retention-window */
  const deadPaid = "(refunded = 0 AND trial_ends IS NULL AND paid_until < ?1)"; /* plant:retention-live-paid */
  const deadTrial = "(refunded = 0 AND trial_ends IS NOT NULL AND trial_ends < ?1)"; /* plant:retention-live-trial */
  const deadRefund = "(refunded = 1 AND refunded_at IS NOT NULL AND refunded_at < ?1)"; /* plant:retention-refund */
  const dead = "(" + deadPaid + " OR " + deadTrial + " OR " + deadRefund + ")";
  const deadId = "SELECT id FROM licences WHERE " + dead;
  const orphaned = "person NOT IN (SELECT person FROM seats) AND person NOT IN (SELECT person FROM bindings WHERE person IS NOT NULL) "
    + "AND person NOT IN (SELECT person FROM desk_keys) AND person NOT IN (SELECT owner FROM licences WHERE owner IS NOT NULL) "
    + "AND person NOT IN (SELECT person FROM admitted_by) AND person NOT IN (SELECT lead FROM admitted_by) AND person NOT IN (SELECT person FROM lead_names) "
    /* A checkout bound to the person's code and not yet paid (pay_binds, gone FAILED_PAYMENT_DAYS after it was bound) holds the row its
       payment will be applied through (pay.mjs reads the buyer by code): the test architect's condition on the code made at a refusal. */
    + "AND person NOT IN (SELECT p.person FROM persons p JOIN pay_binds b ON b.code = p.code) " /* plant:retention-pay-bind */
    + "AND person NOT IN (SELECT person FROM pay_subs)"; /* plant:retention-payer */
  /* A REMOVAL REMOVAL_DAYS OLD (removalStamp): of that person on that licence, the seat still freed, its desks' places and held keys
     (so a renewal is a fresh sign-in, as a freed seat's is), and a freed lead's Studio keys with their doors; an admission a lead
     keeps stands, being the lead's. Then, the person holding nothing anywhere, their person-wide rows, and the stamp itself. */
  const cut = now - REMOVAL_MS; /* plant:removal-cut */
  const removed = kind => "EXISTS (SELECT 1 FROM removals r WHERE r.kind = '" + kind + "' AND r.at < ?1 AND r.licence = X.licence AND r.person = X.person)";
  const stillFreed = kind => "NOT EXISTS (SELECT 1 FROM seats s WHERE s.kind = '" + kind + "' AND s.person = X.person AND s.licence = X.licence AND s.proved_at > 0)";
  const on = (table, kind) => (removed(kind) + " AND " + stillFreed(kind)).split("X.").join(table + ".");
  const freedLeads = "SELECT b.lead FROM bindings b WHERE b.person IS NOT NULL AND " + on("b", "lead");
  const removalStatements = [
    /* Only a desk held for that licence alone: one its person still holds a place from on another licence (their own, where it moved after
       an Entra removal) stays held, or its renewal there would fail thirty days on (the test architect's H1 on b2803b8a; the Grok
       re-review of the erasure branch, finding 5). */
    db.prepare("DELETE FROM person_desks WHERE EXISTS (SELECT 1 FROM desk_keys k WHERE k.person = person_desks.person AND k.desk_key = person_desks.desk_key AND "
      + on("k", "desk") + " AND NOT EXISTS (SELECT 1 FROM desk_keys k2 WHERE k2.person = person_desks.person AND k2.desk_key = person_desks.desk_key "
      + "AND k2.licence <> k.licence))").bind(cut), /* plant:removal-held */
    db.prepare("DELETE FROM desk_keys WHERE " + on("desk_keys", "desk")).bind(cut),
    db.prepare("DELETE FROM doors WHERE lead IN (" + freedLeads + ")").bind(cut),
    /* A freed lead's Studio key loses its Entra mark with its binding: the key is the person's, and the relay keeps a gated team gated
       whatever a grant without seats says (relay/core.cjs takeSeats), so the mark guards nothing once the person is gone from the licence. */
    db.prepare("DELETE FROM entra_keys WHERE lead IN (" + freedLeads + ")").bind(cut), /* plant:removal-entra-keys */
    db.prepare("DELETE FROM bindings WHERE person IS NOT NULL AND " + on("bindings", "lead")).bind(cut), /* plant:removal-keys */
    db.prepare("DELETE FROM seats WHERE proved_at = 0 AND EXISTS (SELECT 1 FROM removals r WHERE r.at < ?1 AND r.licence = seats.licence "
      + "AND r.person = seats.person AND r.kind = seats.kind)").bind(cut), /* plant:removal-seat */
    /* A freed desk seat's admission by name goes with it, REMOVAL_DAYS after the free, unless the person took a seat again meanwhile,
       which cleared the stamp (Claude alpha's ruling under decision 50, question 8: "After them they ask their lead again"). The owner
       is never stamped, so the owner's own admission stays; the admitted_by rows then go by the statement after. */
    db.prepare("DELETE FROM admits WHERE substr(org, 1, " + PERSON.length + ") = '" + PERSON + "' AND EXISTS (SELECT 1 FROM removals r WHERE r.kind = 'desk' "
      + "AND r.at < ?1 AND r.licence = admits.licence AND '" + PERSON + "' || r.person = admits.org) AND NOT EXISTS (SELECT 1 FROM seats s "
      + "WHERE s.kind = 'desk' AND s.licence = admits.licence AND '" + PERSON + "' || s.person = admits.org AND s.proved_at > 0)").bind(cut), /* plant:removal-admission */
    db.prepare("DELETE FROM admitted_by WHERE NOT EXISTS (SELECT 1 FROM admits a WHERE a.licence = admitted_by.licence AND a.org = '" + PERSON + "' || admitted_by.person) "
      + "AND " + removed("desk").split("X.").join("admitted_by.")).bind(cut),
    db.prepare("DELETE FROM person_desks WHERE person IN (SELECT person FROM removals WHERE at < ?1) AND " + orphaned).bind(cut),
    db.prepare("DELETE FROM persons WHERE person IN (SELECT person FROM removals WHERE at < ?1) AND person NOT IN (SELECT person FROM person_desks) AND "
      + orphaned).bind(cut), /* plant:removal-person */
    db.prepare("DELETE FROM removals WHERE at < ?1").bind(cut),
  ];
  const year = ms => "CAST(strftime('%Y', " + ms + " / 1000, 'unixepoch') AS INTEGER)";
  await db.batch(removalStatements.concat([
    db.prepare("DELETE FROM erasures WHERE until > 0 AND until <= ?1").bind(now),
    /* A shared computer held back at erasure (until = 0) starts its ERASURE_DAYS once the last other person's row on that licence goes. */
    db.prepare("UPDATE erasures SET until = ?1 WHERE until = 0 AND NOT EXISTS (SELECT 1 FROM desk_keys k WHERE k.licence = erasures.licence AND k.desk_key = erasures.desk_key)").bind(now + ERASURE_MS), /* plant:erase-shared-wake */
    /* Then every row a check does not name yet (past the first ERASED_MAX of its licence in erasedFor's order) is held ERASURE_MS ahead. */
    db.prepare("UPDATE erasures SET until = MAX(until, ?1) WHERE (licence, desk_key) IN (SELECT licence, desk_key FROM (SELECT licence, desk_key, "
      + "ROW_NUMBER() OVER (PARTITION BY licence ORDER BY until, desk_key) AS n FROM erasures WHERE until > 0) WHERE n > ?2)").bind(now + ERASURE_MS, ERASED_MAX), /* plant:erased-held */
    db.prepare("DELETE FROM orders WHERE " + orderLastYear("") + " < " + year("?1") + " " /* plant:orders-year */
      + "AND NOT EXISTS (SELECT 1 FROM purge_holds WHERE scope = ?2)").bind(now, ORDERS_HOLD), /* plant:orders-hold */
    db.prepare("UPDATE licences SET refunded_at = MIN(?1, CASE WHEN trial_ends IS NOT NULL THEN trial_ends ELSE paid_until END) "
      + "WHERE refunded = 1 AND refunded_at IS NULL").bind(now),
    db.prepare("DELETE FROM doors WHERE licence IN (" + deadId + ")").bind(cutoff),
    db.prepare("DELETE FROM pay_subs WHERE licence IN (" + deadId + ")").bind(cutoff),
    db.prepare("DELETE FROM desk_keys WHERE licence IN (" + deadId + ")").bind(cutoff),
    db.prepare("DELETE FROM erasures WHERE licence IN (" + deadId + ")").bind(cutoff),
    db.prepare("DELETE FROM seats WHERE licence IN (" + deadId + ")").bind(cutoff),
    db.prepare("DELETE FROM admitted_by WHERE licence IN (" + deadId + ")").bind(cutoff),
    db.prepare("DELETE FROM lead_names WHERE licence IN (" + deadId + ")").bind(cutoff), /* plant:retention-names */
    db.prepare("DELETE FROM admits WHERE licence IN (" + deadId + ")").bind(cutoff),
    db.prepare("DELETE FROM releases WHERE licence IN (" + deadId + ")").bind(cutoff),
    db.prepare("DELETE FROM releases WHERE at < ?1").bind(now - RELEASE_KEEP_MS), /* plant:release-keep */
    db.prepare("DELETE FROM bindings WHERE licence IN (" + deadId + ")").bind(cutoff),
    /* Both REFERENCE licences, and D1 enforces foreign keys in every query: a dead licence's Studio key marks and freed desks go before it,
       or the DELETE FROM licences below fails and the whole night's batch rolls back with it (Grok's review 3 of erasure, finding 5). */
    db.prepare("DELETE FROM entra_keys WHERE licence IN (" + deadId + ")").bind(cutoff), /* plant:retention-entra-keys */
    db.prepare("DELETE FROM asks WHERE licence IN (" + deadId + ")").bind(cutoff),
    db.prepare("DELETE FROM invites WHERE licence IN (" + deadId + ")").bind(cutoff),
    db.prepare("DELETE FROM lead_candidates WHERE licence IN (" + deadId + ")").bind(cutoff),
    db.prepare("DELETE FROM lead_invites WHERE licence IN (" + deadId + ")").bind(cutoff), /* plant:retention-namings */
    db.prepare("DELETE FROM freed_desks WHERE licence IN (" + deadId + ")").bind(cutoff), /* plant:retention-freed */
    db.prepare("DELETE FROM freed_desks WHERE at < ?1").bind(now - FREED_KEEP_MS), /* plant:freed-keep */
    db.prepare("DELETE FROM seat_stays WHERE licence IN (" + deadId + ")").bind(cutoff),
    db.prepare("DELETE FROM licences WHERE " + dead).bind(cutoff),
    db.prepare("DELETE FROM trials WHERE ends < ?1").bind(cutoff), /* plant:retention-email-trial */
    db.prepare("DELETE FROM proofs WHERE lead NOT IN (SELECT lead FROM bindings) AND lead NOT IN (SELECT lead FROM trials)"),
    /* The codes and the outbox the emailed codes kept serve nothing now; whatever they still hold goes at the first purge. */
    db.prepare("DELETE FROM codes"), /* plant:s4-codes-gone */
    db.prepare("DELETE FROM outbox"),
    db.prepare("DELETE FROM pay_events WHERE at < ?1").bind(cutoff),
    db.prepare("DELETE FROM pay_binds WHERE at < ?1 AND NOT EXISTS (SELECT 1 FROM pay_subs s WHERE s.provider = pay_binds.provider AND s.sub = pay_binds.sub)")
      .bind(now - FAILED_PAYMENT_DAYS * DAY), /* plant:failed-payment-cut */
    db.prepare("DELETE FROM person_desks WHERE signed_at < ?1 AND " + orphaned).bind(cutoff), /* plant:retention-orphan-desks */
    db.prepare("DELETE FROM persons WHERE made < ?1 AND person NOT IN (SELECT person FROM person_desks) AND " + orphaned).bind(cutoff), /* plant:retention-orphan-persons */
    /* A held payment names its buyer only while their programs may show it (pay.mjs HELD_SHOWN_DAYS; board 1020), and never a person no
       longer kept; the row itself stays to its own cut above, naming nobody. */
    db.prepare("UPDATE pay_events SET person = NULL WHERE person IS NOT NULL AND (at < ?1 OR person NOT IN (SELECT person FROM persons))")
      .bind(now - HELD_SHOWN_DAYS * DAY), /* plant:retention-held-person */
    /* WHAT IS KEPT OF SOMEONE NOBODY ACCEPTED (ruled 2026-11-16 22:15: "cleared 30 days after the last sign-in for someone nobody accepted, not a
       year"): their name, address and vouched mark, NAMES_DAYS after the sign-in that last wrote them, where they are on no team's licence. On
       one is: its ownership, a seat of either kind there, or an admission by name there (a naming always writes one, lead/name), on a licence
       that is not desk-only and not a trial of their own. A trial or a desk-only licence of their own alone is acceptance by nobody. (A licence whose seats follow Entra needs
       no word here: a sign-in there clears what is kept, identStatement.) The row keeps its own end (above). */
    /* An ask and an invitation live ASK_DAYS and INVITE_DAYS, answered or not (the design's 2.1). */
    db.prepare("DELETE FROM asks WHERE at < ?1").bind(now - ASK_MS), /* plant:asks-cut */
    db.prepare("DELETE FROM invites WHERE at < ?1").bind(now - INVITE_MS), /* plant:invites-cut */
    /* A naming by address lives INVITE_DAYS as an invitation does (board 1017), and its candidates with it. */
    db.prepare("DELETE FROM lead_invites WHERE at < ?1").bind(now - INVITE_MS), /* plant:namings-cut */
    db.prepare("DELETE FROM lead_candidates WHERE NOT EXISTS (SELECT 1 FROM lead_invites i WHERE i.licence = lead_candidates.licence AND i.address = lead_candidates.address)"),
    /* A candidate's name stays while the owner may confirm them (the owner confirms "that named person", rule 1), as an open ask's does. */
    db.prepare("UPDATE persons SET name = NULL, address = NULL, vouched = NULL, domain = NULL WHERE (name IS NOT NULL OR address IS NOT NULL OR vouched IS NOT NULL OR domain IS NOT NULL) "
      + "AND NOT EXISTS (SELECT 1 FROM lead_candidates k WHERE k.person = persons.person) " /* plant:names-candidate */
      + "AND NOT EXISTS (SELECT 1 FROM asks a WHERE a.person = persons.person AND a.state IN ('open', 'offered')) " /* plant:names-ask */
      + "AND signed_at < ?1 AND NOT EXISTS (SELECT 1 FROM licences l WHERE l.desk_only = 0 " /* plant:names-desk-only */
      + "AND NOT (l.trial_ends IS NOT NULL AND l.owner = persons.person) " /* plant:names-trial-own */
      + "AND (l.owner = persons.person " /* plant:names-owner */
      + "OR EXISTS (SELECT 1 FROM seats s WHERE s.licence = l.id AND s.person = persons.person) " /* plant:names-seat */
      + "OR EXISTS (SELECT 1 FROM admits a WHERE a.licence = l.id AND a.org = '" + PERSON + "' || persons.person) " /* plant:names-admits */
      + "))").bind(now - NAMES_MS), /* plant:names-purge */
    db.prepare("DELETE FROM stores WHERE ended_at > 0 AND ended_at < ?1").bind(cut), /* plant:store-end-cut */
    db.prepare("DELETE FROM member_keys WHERE until <= ?1 AND was_until <= ?1 AND set_at + ?2 <= ?1").bind(now, MEMBER_CHANGE_MS), /* plant:member-purge */
    db.prepare("UPDATE stores SET ended_at = ?1 WHERE ended_at = 0 AND person NOT IN (SELECT person FROM persons)").bind(now), /* plant:store-orphan-end */
  ]));
}

export { makeService, purgeRetention, keyedHash, KEYED, API, LIMITS, NOTES, NOTE_MAX, DEVICES_PER_SEAT, TRIAL_DAYS,
  LICENCE_KIND, LICENCE_FORMAT, TRIAL_KIND, TRIAL_FORMAT, PAID_ENDED,
  PROVIDER_DEFAULTS, CONSUMERS_TENANT, TRIAL_ONCE_PER, TRIAL_LEAD_SEATS, TRIAL_DESK_SEATS, TRIAL_PERSONAL_DESK_SEATS, RETENTION_DAYS, RETENTION_MS, KID_REFRESH_MS, KEYS_TTL_MIN,
  KEYS_TTL_MAX, NO_KEY, PERSON, PERSONAL, DESK_TRIAL, DESKS_PER_PERSON, PROOF_DAYS, PROOF_ASK_DAYS, RENEW_IAT_MS, CERT_KIND, CERT_FORMAT,
  SEAT_CODE_RE, LIST_DAYS, LIST_MAX, DOOR_RELAYS, DOOR_RELAYS_STAGING, doorRelayOk, ORG_DESKS_DEFAULT,
  ENTRA_PROOF_DAYS, MEMBER_DAYS, MEMBER_CHANGE_DAYS, MEMBER_LIVE_MAX, POOLED_GRACE_MS, FREED_MAX, FREED_SPAN_MS, ROLE, ROLES, ROLES_MAX, ROLE_MAX, ACCESS_SCOPE, ACCESS_VER, ACCESS_MAX,
  REMOVAL_DAYS, REMOVAL_MS, NAMES_DAYS, NAME_MAX, ADDRESS_MAX, ASK_DAYS, INVITE_DAYS, LABEL_MAX, FREED_KEEP_DAYS, ERASURE_DAYS, ERASURE_MS, ERASED_MAX, RELEASE_KEEP_DAYS, ORDER_RETENTION_YEARS, ORDERS_HOLD, FAILED_PAYMENT_DAYS, removalStamp };
