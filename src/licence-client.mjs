/* THE LICENCE SERVICE, FROM STUDIO'S SIDE (board 936, S6: the plan's L4).
 *
 *     import { quietCheck, take, planFor, grantHeld, signInFlow, afterCheck, keepWho, seatList, CHECK_MS, RETRY_MS }
 *              from "./licence-client.mjs";
 *
 * THE CRITERION: signing in (SIGN-IN, below) is the only way a lead gets or keeps a paid seat; a lead signed in gets a licence
 * file and a relay grant with no command line; the quiet check keeps both current on a schedule, keeps the revoked keys' list
 * and never rolls it back; and the relay is then offered and works. A Studio activated before by a purchase key, an address's
 * code or a trial by code keeps its licence file and is asked to sign in (afterCheck), and nobody is stranded.
 *
 * WHAT IS SENT. Each request is built from service/licence/requests.mjs, the very file the service's Worker reads, so the
 * bytes a signature covers cannot drift between the two (its shared vector, request-vector.json, holds one of each), and is
 * signed by this Studio's own signing key, which is the lead's key the licence and the grant are bound to. A request carries
 * the lead's public half, what its route names, a time and a signature, and nothing of a catalog, a desk or a team
 * (CLAUDE.md). `ask(route, bytes)` is the shell's one door, src/wire.cjs
 * licenceRequest, and nothing here reaches a network any other way.
 *
 * WHAT IS KEPT IS JUDGED FIRST, never taken on the service's word: the revoked keys' list only where the root signed it and
 * it is later than the one kept (src/licence.mjs laterRevocations); the licence only where verifyLicence accepts it under
 * the root with that list applied; the grant only where the pinned relay's own grantWhy holds it for this lead now, the key
 * its delegation names is not on that list (the test architect's E1 on S6), and it ends later than the one kept. A licence
 * the root signed by hand (one with no `via`) that holds is never written over by the service's (E2), and the file of a
 * licence refunded, or past its paid end (the service's PAID_ENDED; Max, 2026-11-17 20:41), is moved aside to `.ended`, never
 * deleted and never written over (asideFor), and only a file the service issued; one the root signed by hand is never
 * touched. An answer longer than ANSWER_MAX is not read.
 *
 * THE SCHEDULE (planFor): a Studio that was never activated is never checked, so nothing is sent without the lead's own
 * act. Once activated, the quiet check runs when CHECK_MS has passed since the last that was answered, and a failed try
 * waits RETRY_MS. A grant runs 45 days at most, so twice a day keeps it far from its end. A key made again (the key the
 * activation bound is not this Studio's any more) asks the lead to sign in, since only the person can bring the seat to it.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import * as Q from "../service/licence/requests.mjs";
import { verifyLicence, readLicenceFile, keptRevocations, diskRevocations, laterRevocations, revokedFileFor, revokedCopyFor, LICENCE_KIND, TRIAL_KIND } from "./licence.mjs";
import { relayRules } from "./engine.mjs";
import { orgOf } from "./desk-seat.mjs";
import { writeWhole } from "./whole-write.cjs";
import signinLab from "./signin-lab.cjs";
import managedPolicy from "./managed-policy.cjs";
import buyPath from "./buy-path.cjs";

const HOUR = 3600000;
const CHECK_MS = 12 * HOUR;
const RETRY_MS = HOUR;
const ENDED = ".ended";
/* The service's `ended` for a paid licence past its paid end, beside a refund's "refunded": service/licence/core.mjs PAID_ENDED. */
const PAID_ENDED = "expired";
/* The longest answer read: a licence and a grant with their delegations, and the revoked keys' list, are a few KiB. */
const ANSWER_MAX = 256 * 1024;

const signHex = (open, bytes) => crypto.sign(null, Buffer.from(bytes), open.privateKey).toString("hex");
const writeJson = (at, doc) => { fs.mkdirSync(path.dirname(at), { recursive: true }); writeWhole(at, JSON.stringify(doc, null, 1) + "\n"); };
function readJsonOr(at) {
  try { return JSON.parse(fs.readFileSync(at, "utf8").replace(/^\uFEFF/, "")); } catch { return null; }
}

/* One call: the body as JSON bytes through `ask`; the service's answer where it said ok, else {ok: false, reason, said}.
   A service that does not answer, or answers something that is not its JSON, is "unreached", and nothing is changed. */
async function call(ask, route, body) {
  let res = null;
  try { res = await ask(route, Buffer.from(JSON.stringify(body), "utf8")); } catch { return { ok: false, reason: "unreached" }; }
  if (res && res.bytes && res.bytes.length > ANSWER_MAX) return { ok: false, reason: "unreached", status: res.status }; /* plant:client-cap */
  let json = null;
  try { json = JSON.parse(Buffer.from(res && res.bytes ? res.bytes : []).toString("utf8")); } catch { json = null; }
  if (!json || typeof json !== "object" || Array.isArray(json)) return { ok: false, reason: "unreached", status: res ? res.status : 0 };
  if (json.ok === true) return json;
  const no = { ok: false, reason: typeof json.reason === "string" ? json.reason : "unreached",
    said: typeof json.said === "string" ? json.said : "", status: res.status };
  /* The revoked keys' list rides a refusal too (check's "signin"); take judges it as it judges any. */
  if (json.revoked !== undefined) no.revoked = json.revoked; /* plant:client-revoked-refusal */
  /* signin's "no-role" says beside it whether the token held the Administrator's role, which sends Studio to licence/admin. */
  if (json.admin === true) no.admin = true;
  /* signin's "no-licence" also carries the person's own sign-in code (aaedb9d1), so they can still be bought for, and what the service says
     of their payments: carried on this refusal alone for Buy (src/buy-path.cjs noLicenceKept, board 1020), never shown or traced. */
  if (no.reason === "no-licence") { /* plant:client-no-licence-carry */
    if (typeof json.me === "string" && SEAT_CODE.test(json.me)) no.me = json.me;
    for (const k of ["pays", "held"]) if (json[k] !== undefined) no[k] = json[k];
    if (json.managed === true) no.managed = true;
  }
  return no;
}

/* Where an ended licence's file is moved: `.ended` beside it, or where an earlier one lies there already (a paid time that ended, was
   paid again and ended again), `.ended-2`, `-3` and on, so nothing set aside is ever written over. */
function asideFor(file) {
  let at = file + ENDED;
  for (let n = 2; fs.existsSync(at); n++) at = file + ENDED + "-" + n; /* plant:client-aside-kept */
  return at;
}

/** The quiet check, signed by the lead's key; it registers no proof keys, so what is registered stays as it was. */
async function quietCheck(ask, open, now) {
  const lead = open.public, t = Math.floor(now);
  return call(ask, "check", { lead, t, sig: signHex(open, Q.checkBytes({ lead, t })) }); /* plant:client-check-body */
}

/** The grant held at `grantFile` where it holds for `lead` at `now` under `roots` (legs only), else null. */
function grantHeld(grantFile, lead, now, roots) {
  const g = readJsonOr(grantFile);
  return g && relayRules().core.grantWhy(g, String(lead), Math.floor(now), roots) === null ? g : null;
}

/**
 * What an answer of the service gives this Studio, judged and kept: `ctx` {lead, licenceFile, grantFile, trustedKey, roots,
 * now}. Answers {licence, grant, revoked}, each "kept" or why not ("none" where the answer had none).
 */
async function take(a, ctx) {
  const out = { licence: "none", grant: "none", revoked: "none" };
  if (!a || typeof a !== "object") return out; /* plant:client-take-refusal */
  /* The revoked keys first, so a licence from a key the root has just revoked is refused in this same answer; and from a
     refusal too, the list being the root's signed one and judged as such. */
  const rf = revokedFileFor(ctx.licenceFile);
  if (a.revoked !== undefined) {
    const v = laterRevocations(keptRevocations(ctx.licenceFile, ctx.trustedKey), a.revoked, ctx.trustedKey);
    /* The same list as the one this computer has seen, where the files beside the licence lost it, is written back (review xi, A3). */
    const disk = v.why === "same" ? diskRevocations(ctx.licenceFile, ctx.trustedKey) : null;
    const heal = v.why === "same" && (!disk || disk.serial < a.revoked.serial);
    if (v.take || heal) { writeJson(rf, a.revoked); writeJson(revokedCopyFor(ctx.licenceFile), a.revoked); } /* plant:client-revoked */
    out.revoked = v.take || heal ? "kept" : v.why;
  }
  if (a.ok !== true) return out;
  const kept = keptRevocations(ctx.licenceFile, ctx.trustedKey);
  const revoked = kept ? kept.keys : [];
  if (a.licence) {
    const v = await verifyLicence(a.licence, { trustedKey: ctx.trustedKey, revoked }); /* plant:client-licence */
    const held = readLicenceFile(ctx.licenceFile);
    const heldValid = !!held && !held.malformed && held.kind === LICENCE_KIND
      && (await verifyLicence(held, { trustedKey: ctx.trustedKey, revoked })).valid;
    const byHand = heldValid && held.via === undefined; /* plant:client-by-hand */
    /* A trial's licence never takes the place of a full licence this Studio holds and accepts. */
    const overFull = heldValid && a.licence.kind === TRIAL_KIND; /* plant:client-trial-over-full */
    /* JUDGED, NEVER WRITTEN (Max, 2026-11-22 15:37: the licence file goes as an everyday entitlement): "kept" is the answer's licence
       taken as the service's word for the cover (keepWho's licenceShown); no file is written, and one already there is left as it is. */
    out.licence = !v.valid ? "refused:" + v.reason : byHand ? "held-by-hand" : overFull ? "held-licence" : "kept"; /* plant:client-licence-write */
  } else if (a.ended === "refunded" || a.ended === PAID_ENDED) { /* plant:client-paid-end */
    /* A paid end is taken as a refund is: the Studio's certificate goes (keepWho), and since the licence file is no entitlement any more a
       file the service once issued is left where it is, unread (Claudius's pass of 2026-11-22: nothing set aside, nothing deleted). */
    out.licence = "ended"; /* plant:client-aside-kept */
  }
  if (a.grant) {
    const C = relayRules().core, now = Math.floor(ctx.now);
    const signed = C.grantWhy(a.grant, String(ctx.lead), now, ctx.roots); /* plant:client-grant */
    /* A grant whose delegate key is on the kept list, the one this very answer brought included, is refused (E1). */
    const why = signed !== null ? signed
      : a.grant.via && a.grant.via.key && revoked.includes(a.grant.via.key.pub) ? "revoked" : null; /* plant:client-grant-revoked */
    const was = grantHeld(ctx.grantFile, ctx.lead, now, ctx.roots);
    /* A grant of the same end, from a key the root has not revoked, replaces one whose signer is on that list. owesGrant does not post it. */
    const heldPub = was && was.via && was.via.key ? String(was.via.key.pub) : "";
    const nextPub = a.grant.via && a.grant.via.key ? String(a.grant.via.key.pub) : "";
    const replacesRevoked = !!heldPub && revoked.includes(heldPub) && nextPub !== heldPub && !revoked.includes(nextPub);
    const later = !was || a.grant.until > was.until || (a.grant.until === was.until && a.grant.paid && !was.paid) || replacesRevoked; /* plant:rr-grant-replaces */
    if (why === null && later) writeJson(ctx.grantFile, a.grant); /* plant:client-grant-write */
    out.grant = why !== null ? "refused:" + why : later ? "kept" : "older";
  }
  return out;
}

/**
 * What the schedule does now: `state` is what the shell keeps of the activation ({by, lead, checked, tried}), `lead` this
 * Studio's key's public half now; `tried` is set as a try starts and `checked` when one is answered. "none", "check" or "ask"
 * (the key changed and only the lead, signing in, can bring the seat to it).
 */
function planFor(state, lead, now, held) {
  const s = state && typeof state === "object" ? state : {};
  if (!s.by || !lead) return "none"; /* plant:client-never */
  /* A try that was not answered (tried after the last answered check) waits an hour before the next. */
  const tried = Number(s.tried) || 0, checked = Number(s.checked) || 0;
  if (tried > checked && now - tried < RETRY_MS) return "none";
  /* A sign-in (board 980) is bound to the key that signed it (its nonce), so a key made again asks the lead to sign in. */
  if (s.lead !== lead) return "ask"; /* plant:client-rekey */
  /* A revoked keys' list this Studio took (its serial kept in the state) and can no longer read, both copies gone or broken,
     is asked for again at the next look, not at the ordinary twelve hours: `held` is the serial of the list it reads now. */
  let lost = false;
  lost = Number(s.revokedSerial) > (Number(held) || 0); /* plant:client-list-lost */
  if (lost) return "check";
  return now - checked >= CHECK_MS ? "check" : "none"; /* plant:client-due */
}

/* ---- SIGN-IN (board 980, stage 2) ---------------------------------------------------------------------------------------
 *
 * THE CRITERION, in Max's words of 2026-11-11 22:14, "I agree!", to Claude alpha's "Sign-in as the only way to hold a paid
 * seat, with Microsoft and Google first": a lead signs in with the work account their organisation already
 * has, and the licence service seats that person; Studio takes the answer through take, above.
 *
 * THE PROVIDERS ARE CONFIGURATION, never code per customer: {id, issuer, clientId, ...} as stage 1's service holds them, with
 * the two addresses and the scope Studio needs beside them, each from the provider's own published configuration (Microsoft:
 * login.microsoftonline.com/common/v2.0/.well-known/openid-configuration, the "common" tenant admitting work and personal
 * accounts alike; Google: accounts.google.com/.well-known/openid-configuration). A provider with no client id is not offered,
 * and then nothing of it is drawn. As shipped, no client id is configured here, so an ordinary Studio build offers no sign-in
 * while no production licence service exists; a Test Service build or a development run with a lab file names them in its own
 * file. A third provider is one more entry here, and one more host in src/wire.cjs's IDENTITY_HOSTS. No secret is ever here: both providers treat a
 * desktop app as a public client ("Public clients ... must not use secrets", Microsoft's auth code flow page; "Desktop apps are
 * public clients and cannot keep secrets confidential", Google's native-app page).
 *
 * THE FLOW (RFC 8252, both providers' native-app pages): the system browser opens the provider's page with PKCE (S256), a state
 * and a nonce; the provider sends the browser back to a listener on 127.0.0.1 at a port the system picks (both providers allow
 * any port on a loopback redirect, so no fixed port: a fixed one is Okta's, a third provider's, when one comes); the state
 * must match before anything else is read; the code goes to the provider's token address with the verifier, through the
 * shell's one door; the ID token's audience, issuer and nonce are read here as a check of what came back, while the licence
 * service verifies its signature (stage 1); the ID token goes to the service's `signin` route, signed by the lead's key over
 * requests.mjs's signinBytes, which stage 1 writes into that shared file. Every network step is handed in (`io`), so a leg
 * stands the browser, the provider and the service in.
 *
 * THE REFRESH TOKEN is kept only sealed by the operating system (sealRefresh), in signin-token.json (the shell keeps it apart), never in the store, a log or the page; where the system cannot seal (no keyring, or Linux's basic_text, which
 * the shell's vault counts as none), none is kept, and a renewal then asks the lead to sign in again. A quiet renewal
 * (renewSignIn) exchanges it for a fresh ID token at the same token address and posts that to the service's signin/renew,
 * with nothing shown.
 *
 * PROVED AGAIN EVERY THIRTY DAYS (Claude alpha's decision 15 item 1): from day 25 the quiet check answers proof "due" and
 * Studio renews; a failure then changes nothing and is tried at the next check. From day 30, or once the owner freed the
 * seat, the check answers "signin": Studio renews, and where it cannot, forgets the seal and the cover asks the lead to sign
 * in (afterCheck). The licence file is never moved for it, so the lead's own catalogs stay open throughout.
 *
 * WHAT IS ASKED at the first sign-in: Microsoft `openid profile email offline_access`, so the service keeps the directory's object
 * id beside the seat and reads the email claim (with xms_edov) to vouch an address; Google `openid email profile`, whose email and
 * email_verified the service reads the same way. A renewal asks Microsoft the same, so its token still carries the email.
 */
const SIGN_IN_PROVIDERS = Object.freeze([
  /* `service` is the licence service's own registration's client id (decision 49, section 11.11), empty until Max hands it over, so
     no scope of it is ever asked (serviceScopeOf). */
  Object.freeze({ id: "microsoft", issuer: "https://login.microsoftonline.com/{tenantid}/v2.0", clientId: "", clientSecret: "", service: "", /* plant:shipped-empty-ms */
    authorize: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize", token: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scope: "openid profile email offline_access", refreshScope: "openid profile email offline_access",
    extra: Object.freeze({ response_mode: "query", prompt: "select_account" }) }),
  /* No consent page is forced: "refresh tokens are always returned for installed applications" (Google's native-app page). */
  Object.freeze({ id: "google", issuer: "https://accounts.google.com", clientId: "",
    clientSecret: "",
    authorize: "https://accounts.google.com/o/oauth2/v2/auth", token: "https://oauth2.googleapis.com/token",
    scope: "openid email profile", refreshScope: "",
    extra: Object.freeze({ prompt: "select_account" }) }),
]);
/* A MANAGED INSTALLATION (decision 49, held for Max's ruling): what the organisation's machine policy pins, read by the shell
   (src/managed-policy.cjs managedPolicyFrom) and handed here as a getter, so every read of the providers takes the policy in force.
   With none set (`any` false) nothing below changes a provider, an address or a check: today's, byte for byte. */
let signinPolicyOf = () => null;
function setSigninPolicy(get) {
  signinPolicyOf = typeof get === "function" ? get : () => get;
}
/** The policy in force where it sets anything, else null. */
function policyIn() {
  let p = null;
  try { p = signinPolicyOf(); } catch { p = null; }
  return p && typeof p === "object" && p.any === true ? p : null;
}
const managedHere = () => { const p = policyIn(); return !!p && p.managed === true; };
/** `list` as policy `pol` offers it: all with no policy, none where closed, the named provider alone; Microsoft and Google each
 *  at its pinned addresses (the tenant's, `organizations`, Google's hd hint) with the `pin` tokensOf checks; the lab's only
 *  where nothing is pinned. */
function pinnedProviders(list, pol) {
  if (!pol) return list;
  if (pol.closed) return []; /* plant:mp-closed-offers */
  const pins = !!pol.provider || !!pol.tenant || pol.personal === false;
  return list.filter((p) => (pol.provider ? p.id === pol.provider : !pins || p.id === "microsoft" || p.id === "google")) /* plant:mp-pinned-list */
    .map((p) => pinOne(p, pol));
}
function pinOne(p, pol) {
  const msTenant = pol.tenant && managedPolicy.tenantKind(pol.tenant) === "microsoft" ? pol.tenant : "";
  const gDomain = pol.tenant && managedPolicy.tenantKind(pol.tenant) === "google" ? pol.tenant : "";
  if (p.id === "microsoft" && (msTenant || pol.personal === false)) {
    /* The tenant's own addresses, or `organizations`, which takes work and school accounts alone, in place of `common`. */
    const seg = "/" + (msTenant || "organizations") + "/"; /* plant:mp-ms-seg */
    return Object.freeze(Object.assign({}, p, { authorize: p.authorize.replace("/common/", seg), token: p.token.replace("/common/", seg),
      pin: Object.freeze(msTenant ? { tid: msTenant } : { work: "microsoft" }) }));
  }
  if (p.id === "google" && (gDomain || pol.personal === false)) {
    /* hd is a hint on Google's page ("Don't rely on this UI optimization to control who can access your app"); the token's hd is
       what is checked. */
    return Object.freeze(Object.assign({}, p, { extra: Object.freeze(Object.assign({}, p.extra || {}, gDomain ? { hd: gDomain } : {})),
      pin: Object.freeze(gDomain ? { hd: gDomain } : { work: "google" }) }));
  }
  return p;
}
/** Whether an ID token's claims `c` fall outside `pin`: another tenant, a personal Microsoft account where only work ones are
 *  taken, another Google domain, or no domain where only Workspace accounts are. */
function pinRefuses(pin, c) {
  if (pin.tid) return String(c.tid || "").toLowerCase() !== pin.tid; /* plant:mp-tid */
  if (pin.hd) return String(c.hd || "").toLowerCase() !== pin.hd; /* plant:mp-hd */
  if (pin.work === "google") return !(typeof c.hd === "string" && c.hd !== ""); /* plant:mp-work-g */
  if (pin.work === "microsoft") return String(c.tid || "").toLowerCase() === managedPolicy.MSA_TENANT; /* plant:mp-work-ms */
  return false;
}
/** Who an ID token names, as a hash of its issuer and subject, for the same-account rule; never kept in plain form. */
function whoOf(jwt) {
  const c = claimsOf(jwt) || {};
  return crypto.createHash("sha256").update(String(c.iss || "") + "\n" + String(c.sub || "")).digest("hex");
}

/* THE PROVIDERS THIS STUDIO OFFERS: the two above, with no client id as shipped; in a development Studio started with
   ETIUDA_SIGNIN_LAB (src/signin-lab.cjs), or a test service build, with the client ids its file names and none where it names
   none, their addresses unchanged, and the lab's provider as a third where it names one. An ordinary installed Studio, or one
   without a lab file, has SIGN_IN_PROVIDERS itself and offers nothing. */
function providersNow(lab) {
  if (!lab) return SIGN_IN_PROVIDERS;
  const ids = lab.clientIds || {};
  return Object.freeze(SIGN_IN_PROVIDERS.map((p) => Object.freeze(Object.assign({}, p, { clientId: typeof ids[p.id] === "string" ? ids[p.id] : "" }))) /* plant:lab-fill */
    .concat(lab.provider ? [lab.provider] : []));
}
const PROVIDERS_NOW = providersNow(signinLab.lab);
const TENANT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SKEW_MS = 5 * 60000;
const b64url = (buf) => Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const sameText = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/* THE LICENCE SERVICE AS ITS OWN RESOURCE (decision 49, section 11.11; held for Max's ruling). Claude alpha's words: "yes, change
 * section 11 now and build it at the seam", on three conditions: a person stays the same person; the access token is judged whole
 * and fails closed (the service's judgement: here it is opaque, carried and never read); nothing new for an ordinary licence or a
 * personal account.
 *
 * THE MANAGED PATH, and only it, asks Microsoft for the service's own access token (scope api://<service>/Licence.Use) beside today's
 * scopes, and sends it with the ID token, signed by requests.mjs's managed bytes over both tokens' hashes: where the policy Managed
 * is set on this computer, or where the service answered this person "access-token" before (the shell keeps signinAccess, only on
 * that answer, cleared at sign-out). Off it, every address, form, body and signed byte is today's. Where the service answers
 * "access-token" off the path, the refresh token already held is redeemed for the scope with no browser and no prompt, and the
 * request is sent once more with both tokens; never a second authorize. The access token is kept for that one request alone:
 * never sealed, written, traced or handed to the page. */
const ACCESS_MAX = 4096;
/** The service's scope for `provider`: Microsoft's with a service id of a client id's shape, else "" (Google and the lab never). */
function serviceScopeOf(provider) {
  return provider && provider.id === "microsoft" && typeof provider.service === "string" && TENANT.test(provider.service)
    ? "api://" + provider.service + "/Licence.Use" : "";
}
/** The scope a sign-in or a renewal adds on the managed path (the policy Managed, or `remembered`, the service's earlier answer),
 *  else "". */
function managedScope(provider, remembered) {
  return managedHere() || remembered === true ? serviceScopeOf(provider) : ""; /* plant:ma-path */
}

/* GOOGLE'S CLIENT SECRET, where the package carries one: written beside the asar by the package step (tools/signin-secret.cjs) from
   ETIUDA_GOOGLE_CLIENT_SECRET at packaging, read once at start and from nowhere else. It goes to Google's token address alone,
   with the code and the refresh, and is never kept, printed, shown or sent to the licence service. Without the file, or with one
   not of its shape, there is none, and every byte Studio sends is as it was before the secret existed. */
const SIGNIN_SECRET_FILE = "signin-secret.json";
const SIGNIN_SECRET_SHAPE = /^[\x21-\x7e]{8,200}$/;
let signinPacked = Object.freeze({});
function signinSecretRead(text) {
  let d = null;
  try { d = JSON.parse(String(text)); } catch { d = null; }
  const v = d && typeof d === "object" && !Array.isArray(d) && d.format === 1 ? d.google : undefined;
  return Object.freeze(typeof v === "string" && SIGNIN_SECRET_SHAPE.test(v) ? { google: v } : {});
}
function setSigninPacked(packed) {
  signinPacked = Object.freeze(packed || {});
}

/** The providers a lead may sign in with: those configured with a client id.
 *  A provider's secret is the table's own where it holds one, else what `packed` (signinPacked) holds for it, else "". */
function signInProviders(list = PROVIDERS_NOW, packed) {
  const k = (packed === undefined ? signinPacked : packed) || {};
  const offered = (Array.isArray(list) ? list : []).filter((p) => p && typeof p.id === "string" && typeof p.clientId === "string" && p.clientId !== "") /* plant:sign-in-filter */
    .map((p) => {
      const secret = typeof p.clientSecret === "string" && p.clientSecret ? p.clientSecret
        : p.id === "google" && typeof k.google === "string" ? k.google : "";
      if (p.clientSecret === secret) return p;
      return Object.assign({}, p, { clientSecret: secret });
    });
  return pinnedProviders(offered, policyIn());
}
/** Whether the sign-in preview stands: `asked` true (the shell's ETIUDA_SIGNIN_PREVIEW, read once at its start) and no provider
 *  configured, so a list with any client id always wins and the preview then changes nothing. */
function signInPreview(asked, list = PROVIDERS_NOW) {
  /* An organisation's policy is never previewed over: what it pins, or closes, is what is offered. */
  return asked === true && !policyIn() && signInProviders(list).length === 0;
}
/** The configured provider named `id`, or null. */
function providerOf(id, list = PROVIDERS_NOW, packed) {
  return signInProviders(list, packed).find((p) => p.id === String(id)) || null;
}

/** One sign-in's request for the browser: {url, state, nonce, seed, verifier, redirect}, `port` the loopback's, `lead` the
 *  public half of the key that will sign the sign-in, `rand(n)` n random bytes. The nonce is bound to that key (requests.mjs
 *  signinNonce of the lead and a fresh seed), so the service refuses the token with any other key (the join of stages 1 and 2).
 *  `extra`, the managed path's service scope (managedScope), is asked after today's scopes; without it the address is today's. */
async function authorizeRequest(provider, port, lead, rand = crypto.randomBytes, extra) {
  const verifier = b64url(rand(32)), state = b64url(rand(32)), seed = Buffer.from(rand(32)).toString("hex");
  const nonce = await Q.signinNonce(String(lead), seed);
  const redirect = "http://127.0.0.1:" + Math.floor(Number(port));
  const asked = String(extra || ""); /* plant:ma-scope */
  const q = new URLSearchParams(Object.assign({ client_id: provider.clientId, response_type: "code", redirect_uri: redirect, scope: asked ? provider.scope + " " + asked : provider.scope,
    state, nonce, code_challenge: b64url(crypto.createHash("sha256").update(verifier).digest()), code_challenge_method: "S256" }, provider.extra || {}));
  return { url: provider.authorize + "?" + q.toString(), state, nonce, seed, verifier, redirect };
}

const ORG_REFUSED = new Set(["consent_required", "admin_policy_enforced"]);
const CONSENT_CODES = /\bAADSTS(?:65001|90094|90095)\b/;
/* AADSTS65004 is the person declining the consent page: their own Cancel, read before the organisation's codes. */
const DECLINED_CODE = /\bAADSTS65004\b/;
/* AADSTS50105: the account is not assigned to the application in its organisation's directory. */
const NOT_ASSIGNED_CODE = /\bAADSTS50105\b/;
/** What the browser brought back to the loopback (`query`, "?..." or ""), read against the request it answers: {ok, code}
 *  or {ok: false, reason}. The state is compared first, so nothing else of a reply that is not this sign-in's is read. */
function loopbackAnswer(query, pending) {
  const q = new URLSearchParams(String(query || ""));
  const state = q.get("state");
  if (!pending || typeof state !== "string" || !sameText(state, pending.state)) return { ok: false, reason: "signin-state" };
  const error = q.get("error");
  if (error) {
    /* The organisation's refusal at its provider (night decision 20 (b)) is its own reason, apart from the person cancelling and
       from the service having no seat for the account: an error naming consent or the admin's policy, or a description naming one of
       Entra's consent codes. Only these two fields are read, shown on no screen (the trace alone writes them, traceLine). */
    if (DECLINED_CODE.test(String(q.get("error_description") || ""))) return { ok: false, reason: "signin-cancelled" }; /* plant:st-declined */
    /* On a managed computer an account the organisation has not assigned to Etiuda is the organisation's refusal too (decision 49);
       unmanaged, it is read as before. */
    if (managedHere() && NOT_ASSIGNED_CODE.test(String(q.get("error_description") || ""))) return { ok: false, reason: "signin-org" }; /* plant:mp-50105 */
    if (ORG_REFUSED.has(error) || CONSENT_CODES.test(String(q.get("error_description") || ""))) return { ok: false, reason: "signin-org" };
    return { ok: false, reason: error === "access_denied" ? "signin-cancelled" : "signin-refused" };
  }
  const code = q.get("code");
  if (!code || code.length > 8192) return { ok: false, reason: "signin-refused" };
  return { ok: true, code };
}

/** Whether the loopback's `query` is the reply to this sign-in (its state matches), which ends the listening; any other request
 *  of "/" is answered and ignored (decision 15 item 4). */
function loopbackEnds(query, pending) {
  return loopbackAnswer(query, pending).reason !== "signin-state";
}

/** The provider's client secret beside its client id, only where it has one: the token forms below are otherwise byte for byte the
 *  forms they were before a secret existed. */
function signinSecretPart(provider) {
  return typeof provider.clientSecret === "string" && provider.clientSecret ? { client_secret: provider.clientSecret } : {};
}
/** The token request's form for a code, as bytes. */
function codeForm(provider, pending, code) {
  return Buffer.from(new URLSearchParams(Object.assign({ client_id: provider.clientId }, signinSecretPart(provider), { grant_type: "authorization_code", code: String(code),
    redirect_uri: pending.redirect, code_verifier: pending.verifier })).toString(), "utf8");
}
/** The token request's form for a quiet renewal, as bytes; `extra`, the service scope, asked after today's refresh scope on the
 *  managed path and at a redemption, else the form is today's. */
function refreshForm(provider, refreshToken, extra) {
  const scope = extra ? (provider.refreshScope ? provider.refreshScope + " " : "") + extra : provider.refreshScope;
  return Buffer.from(new URLSearchParams(Object.assign({ client_id: provider.clientId }, signinSecretPart(provider), { grant_type: "refresh_token", refresh_token: String(refreshToken) },
    scope ? { scope } : {})).toString(), "utf8");
}

/* The claims of a JWT, unverified: the service verifies the signature; Studio reads only what tells it the answer is its own. */
function claimsOf(jwt) {
  const parts = String(jwt).split(".");
  if (parts.length !== 3) return null;
  try {
    const c = JSON.parse(Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    return c && typeof c === "object" && !Array.isArray(c) ? c : null;
  } catch { return null; }
}
function issuerOk(provider, c) {
  const iss = String(c.iss || "");
  if (provider.issuer.indexOf("{tenantid}") >= 0) return TENANT.test(String(c.tid || "")) && iss === provider.issuer.replace("{tenantid}", String(c.tid));
  return iss === provider.issuer || iss === provider.issuer.replace(/^https:\/\//, "");
}

/** The token answer `res` ({status, bytes}) read: {ok, idToken, refreshToken} where it holds an ID token for this client from
 *  this provider, unexpired, and carrying the nonce sent where `pending` is given; else {ok: false, reason}. With `withAccess`
 *  (the managed path) also `accessToken`, the answer's access token as given, or "" where none or one past ACCESS_MAX; it is
 *  never read, only carried (a client treats it as opaque). Without, the access token every answer carries is left unread. */
function tokensOf(res, provider, pending, now, withAccess) {
  let json = null;
  try { json = JSON.parse(Buffer.from(res && res.bytes ? res.bytes : []).toString("utf8")); } catch { json = null; }
  if (!json || typeof json !== "object") return { ok: false, reason: "unreached" };
  if (res.status !== 200 || typeof json.id_token !== "string") return { ok: false, reason: json.error === "invalid_grant" ? "signin-expired" : "signin-refused" };
  const c = claimsOf(json.id_token);
  /* The service's audience rule (Argon 8d): the client id, or a list of exactly that one. */
  const audOk = !!c && (typeof c.aud === "string" ? c.aud === provider.clientId
    : Array.isArray(c.aud) && c.aud.length === 1 && c.aud[0] === provider.clientId);
  if (!c || !audOk || !issuerOk(provider, c) || !(Number(c.exp) * 1000 > now - SKEW_MS)) return { ok: false, reason: "signin-token" };
  if (pending && (typeof c.nonce !== "string" || !sameText(c.nonce, pending.nonce))) return { ok: false, reason: "signin-token" };
  /* A provider an organisation pinned (pinnedProviders) takes only its own accounts, at a sign-in and at every renewal. */
  if (provider.pin && pinRefuses(provider.pin, c)) return { ok: false, reason: "signin-tenant" }; /* plant:mp-pin-checked */
  const out = { ok: true, idToken: json.id_token, refreshToken: typeof json.refresh_token === "string" ? json.refresh_token : "" };
  if (withAccess === true) {
    const at = json.access_token;
    out.accessToken = typeof at === "string" && at.length > 0 && at.length <= ACCESS_MAX ? at : ""; /* plant:ma-bound */
  }
  return out;
}

/** The `signin` route (stage 1's interface, the join's seed beside it): the ID token, the seed its nonce was made from, the
 *  lead's public half, t, and the lead's signature over requests.mjs signinBytes({provider, tokenHash, lead, t}), tokenHash
 *  the SHA-256 of the token. With `accessToken` (the managed path), the body carries it too and the signature is over
 *  signinManagedBytes, which add its hash (accessHash); without, the body and the bytes are today's. `member`, where given, names
 *  the member key for its seat's certificate on either path. The seed is signed too, the bytes' last line (requests.mjs seedLine;
 *  review 2's finding 12), so a copy with it taken out or swapped fails the signature. */
async function signIn(ask, open, provider, idToken, now, seed, member, accessToken) {
  const tokenHash = await Q.tokenHash(String(idToken)), lead = open.public, t = Math.floor(now), m = memberOf(member, lead);
  const signedSeed = seed ? String(seed) : undefined; /* plant:signin-seed-signed */
  if (accessToken) {
    const accessHash = await Q.tokenHash(String(accessToken));
    const g = await call(ask, "signin", Object.assign({ provider: String(provider), idToken: String(idToken), lead, t, seed: String(seed || ""), accessToken: String(accessToken),
      sig: signHex(open, Q.signinManagedBytes({ provider: String(provider), tokenHash, accessHash, lead, t, member: m, seed: signedSeed })) }, m ? { member: m } : {})); /* plant:ma-signed */
    return g.ok === true ? g : Object.assign({}, g, { reason: SIGNIN_REFUSED[g.reason] || g.reason });
  }
  const a = await call(ask, "signin", Object.assign({ provider: String(provider), idToken: String(idToken), lead, t, seed: String(seed || ""),
    sig: signHex(open, Q.signinBytes({ provider: String(provider), tokenHash, lead, t, member: m, seed: signedSeed })) }, m ? { member: m } : {}));
  /* The route's own refusals are its own: its "full" is a lead seat. */
  return a.ok === true ? a : Object.assign({}, a, { reason: SIGNIN_REFUSED[a.reason] || a.reason });
}
const SIGNIN_REFUSED = Object.freeze({ full: "signin-full", "no-licence": "signin-no-licence", token: "signin-token", "no-role": "signin-no-role" }); /* plant:admin-no-role */

/* ---- THE ADMINISTRATOR OF A LICENCE WHOSE SEATS FOLLOW ENTRA (decision 49, held for Max's ruling) --------------------------------
 * Claude alpha's criterion: "a large company's IT decides, in tools it already uses and without touching each computer, who may use
 * Etiuda, in which role and with which account, and an ordinary user on a managed computer is shown nothing to buy, try, switch or
 * administer". A person who holds the Administrator's role and not the Lead's takes no seat: signin says so beside its "no-role", and
 * licence/admin, signed by this Studio's key, which it binds to nothing, answers the licence's card. Studio reads the role from the
 * service's answers alone, never from a token: the roles ride the service's own access token, opaque to a client (section 11.11). */
/** The licence's card as Account shows it, from an ok answer of licence/admin, or null where it is not of that shape. */
const ORG_SHOWN = /^[^\u0000-\u001f\u007f]{1,120}$/;
function adminCard(a) {
  const count = (v) => (Number.isSafeInteger(v) && v >= 0 ? v : null);
  const pool = (d) => (d && typeof d === "object" && count(d.held) !== null && count(d.of) !== null ? { held: d.held, of: d.of } : null);
  const day = (v) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
  const seats = a && a.seats && typeof a.seats === "object" ? a.seats : {};
  const lead = pool(seats.lead), desk = pool(seats.desk);
  if (!lead || !desk) return null;
  const org = typeof a.org === "string" && ORG_SHOWN.test(a.org.trim()) ? a.org.trim() : "";
  return { org, seats: { lead, desk }, waiting: { desk: count(a.waiting && a.waiting.desk) || 0 }, paidUntil: day(a.paidUntil), updatesUntil: day(a.updatesUntil) };
}
/** The `licence/admin` route: the ID token, signed by the Studio key over requests.mjs licenceAdminBytes; `seed` only for a first
 *  sign-in's token, whose nonce it made, and none for a refreshed one. {ok: true, admin: true, card} or a refusal, said as signin's. */
async function licenceAdmin(ask, open, provider, idToken, now, seed, accessToken) {
  const tokenHash = await Q.tokenHash(String(idToken)), lead = open.public, t = Math.floor(now);
  /* Where the managed path holds the service's own access token (section 11.11), it rides beside, signed over licenceAdminManagedBytes. */
  const accessHash = accessToken ? await Q.tokenHash(String(accessToken)) : "";
  /* A first sign-in's seed is signed, the bytes' last line (review 2's finding 12); a refreshed token's request carries none. */
  const signedSeed = seed ? String(seed) : undefined;
  const body = { provider: String(provider), idToken: String(idToken), lead, t, sig: signHex(open, accessHash
    ? Q.licenceAdminManagedBytes({ provider: String(provider), tokenHash, accessHash, lead, t, seed: signedSeed }) : Q.licenceAdminBytes({ provider: String(provider), tokenHash, lead, t, seed: signedSeed })) };
  if (accessHash) body.accessToken = String(accessToken);
  if (seed) body.seed = String(seed); /* plant:admin-seed */
  const a = await call(ask, "licence/admin", body);
  if (a.ok !== true) return Object.assign({}, a, { reason: SIGNIN_REFUSED[a.reason] || a.reason });
  const card = a.admin === true ? adminCard(a) : null; /* plant:admin-said */
  return card ? { ok: true, admin: true, card } : { ok: false, reason: "untrusted" };
}
/* The member key (src/member.mjs) a sign-in names for its seat's certificate, as 64 hex, where `member` gives one apart from the lead's. */
function memberOf(member, lead) {
  let m = typeof member === "function" ? member() : member;
  m = typeof m === "string" ? m : "";
  return /^[0-9a-f]{64}$/.test(m) && m !== lead ? m : undefined;
}

/* THE SILENT REDEMPTION (section 11.11): the refresh token this sign-in already holds, exchanged at the same token address for the
   service's scope, with no browser and no prompt. Microsoft's AADSTS50105 here is the organisation not having assigned the account
   to the service: its refusal, "signin-org"; a pin's refusal stays its own; anything else is the sign-in not finishing. */
async function redeem(io, provider, refreshToken, hide, clock) {
  const extra = serviceScopeOf(provider);
  if (!extra || !refreshToken) {
    trace(io, provider.id, "redeem", "signin-refused", { detail: extra ? "no refresh token" : "no service configured" }, hide);
    return { ok: false, reason: "signin-refused" };
  }
  let res = null;
  try { res = await io.tokenAsk(provider.token, refreshForm(provider, refreshToken, extra)); } catch (err) { /* plant:ma-silent */
    trace(io, provider.id, "redeem", "signin-refused", { detail: err && err.message }, hide);
    return { ok: false, reason: "signin-refused" };
  }
  const said = traceSaid(res, hide);
  if (NOT_ASSIGNED_CODE.test(String(said.error_description || ""))) { /* plant:ma-50105 */
    trace(io, provider.id, "redeem", "signin-org", said, hide);
    return { ok: false, reason: "signin-org" };
  }
  const got = tokensOf(res, provider, null, clock(), true);
  if (!got.ok || !got.accessToken) {
    const why = got.reason === "signin-tenant" ? "signin-tenant" : "signin-refused";
    trace(io, provider.id, "redeem", why, said, hide);
    return { ok: false, reason: why };
  }
  trace(io, provider.id, "redeem", "ok", { status: said.status, detail: "refresh token " + (got.refreshToken ? "replaced" : "kept") }, hide);
  return { ok: true, idToken: got.idToken, accessToken: got.accessToken, refreshToken: got.refreshToken };
}
/* A second "access-token" answer, or one the path could not meet, is the sign-in not finishing; never an unnamed reason on a screen. */
const accessLeft = (a) => (a && a.ok !== true && a.reason === "access-token" ? Object.assign({}, a, { reason: "signin-refused" }) : a);

/** The refresh token sealed by `vault` as base64, or "" where the system cannot seal (no keyring, or basic_text on Linux). */
function sealRefresh(vault, token) {
  if (!token || !vault || typeof vault.available !== "function" || !vault.available()) return "";
  try { return Buffer.from(vault.seal(String(token))).toString("base64"); } catch { return ""; }
}

/* THE SIGN-IN TRACE: `io.trace(line)`, which the shell gives only under ETIUDA_SIGNIN_TRACE=1, read once at its start, writing to
   its console alone; without it nothing is written. A line names the provider, the step and the reason shown, then only the fields
   TRACE_FIELDS names, each cut short. Every value in `hide` (this sign-in's code, verifier, secret and tokens) and anything of a
   JWT's shape reads [hidden] wherever it stands, before any cut. */
const TRACE_FIELDS = Object.freeze(["status", "error", "error_description", "error_codes", "reason", "detail"]);
function traceLine(provider, step, shown, said, hide) {
  const s = said && typeof said === "object" ? said : {}, h = (Array.isArray(hide) ? hide : []).filter((v) => typeof v === "string" && v.length >= 4);
  const clean = (text) => {
    let t = String(text);
    for (const v of h) t = t.split(v).join("[hidden]"); /* plant:st-trace-hide */
    t = t.replace(/eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*(\.[A-Za-z0-9_-]*)?/g, "[hidden]"); /* plant:st-trace-jwt */
    return Array.from(t).map((ch) => { const c = ch.charCodeAt(0); return c < 32 || c === 127 ? " " : ch; }).join("");
  };
  const parts = [];
  for (const k of TRACE_FIELDS) {
    const v = s[k];
    const text = Array.isArray(v) ? v.filter((n) => Number.isSafeInteger(n)).slice(0, 8).join(",")
      : typeof v === "number" || typeof v === "boolean" ? String(v) : typeof v === "string" ? clean(v).slice(0, 600) : "";
    if (text) parts.push(k + "=" + text);
  }
  return "studio  sign-in " + clean(provider).slice(0, 20) + " " + clean(step).slice(0, 20) + ": " + clean(shown).slice(0, 40) + (parts.length ? " | " + parts.join(" | ") : "");
}
/* What a provider's answer `res` ({status, bytes}) says of itself for the trace: its status and its JSON's own fields; the tokens it
   carries join `hide`. */
function traceSaid(res, hide) {
  let j = null;
  try { j = JSON.parse(Buffer.from(res && res.bytes ? res.bytes : []).toString("utf8")); } catch { j = null; }
  const o = j && typeof j === "object" && !Array.isArray(j) ? j : {};
  for (const k of ["id_token", "access_token", "refresh_token"]) if (typeof o[k] === "string") hide.push(o[k]);
  return { status: res ? res.status : undefined, error: o.error, error_description: o.error_description, error_codes: o.error_codes,
    detail: j ? "" : "the answer is not JSON" };
}
/* The ID token's claims in `res`, as the trace names them: issuer, audience, tenant, expiry against `now`, and whether its nonce is
   absent, this sign-in's (`nonce`), or another. */
function traceClaims(res, nonce, now) {
  let j = null;
  try { j = JSON.parse(Buffer.from(res && res.bytes ? res.bytes : []).toString("utf8")); } catch { j = null; }
  const c = j && typeof j.id_token === "string" ? claimsOf(j.id_token) : null;
  if (!c) return "no ID token that reads";
  const n = c.nonce === undefined ? "none" : nonce && sameText(c.nonce, nonce) ? "this sign-in's" : "another";
  return "iss " + String(c.iss) + ", aud " + [].concat(c.aud).join(" ") + ", tid " + String(c.tid === undefined ? "none" : c.tid)
    + ", expires in " + Math.round(Number(c.exp) - now / 1000) + " s, nonce " + n;
}
/* The service's answer `a` (call's) for the trace: its status, its reason and its said. */
const traceAnswer = (a) => (a && a.ok === true ? { detail: "signed in" } : { status: a ? a.status : undefined, reason: a ? a.reason : "", detail: a ? a.said : "" }); /* plant:no-licence-code-traced */
function trace(io, provider, step, shown, said, hide) {
  if (!io || typeof io.trace !== "function") return; /* plant:st-trace-off */
  try { io.trace(traceLine(provider, step, shown, said, hide)); } catch { /* the console has gone */ }
}

/**
 * One sign-in, the lead's own act: `io` {listen(pageFor, ends, clean), openPage(url), tokenAsk(url, form), ask(route, bytes),
 * seal(token), page(kind), rand?}, the shell's door and opener in Studio and stand-ins in a leg; `open` the lead's opened key,
 * `clock()` ms. Answers {answer, refreshSealed}: `answer` the service's, or {ok: false, reason} where the sign-in did not reach it.
 * `remembered`: the service answered this person "access-token" before (the shell's signinAccess), which with the policy Managed
 * puts the sign-in on the managed path; `access: true` joins the answer where the service so answered now, or where a remembered
 * path signed in, so the shell keeps the field; never otherwise.
 */
async function signInFlow(io, provider, open, clock, same, remembered) {
  let pending = null;
  /* Only the reply carrying this sign-in's state ends the listening, sent on to `clean`, a path of its own; a stray request is shown
     the earlier tab's page. The shell lands the outcome once it has the service's answer. */
  const clean = "/" + crypto.randomBytes(8).toString("hex");
  const loop = await io.listen((kind) => io.page(kind), (query) => loopbackEnds(query, pending), clean);
  const extra = managedScope(provider, remembered);
  try {
    pending = await authorizeRequest(provider, loop.port, open.public, io.rand, extra);
    /* The browser's opening is awaited: one that will not open is said at once, not after the loopback's wait. */
    let opened = false;
    try { opened = !!(await io.openPage(pending.url)); } catch { opened = false; }
    if (!opened) { trace(io, provider.id, "browser", "signin-browser"); return { answer: { ok: false, reason: "signin-browser" }, refreshSealed: "" }; }
    let query = "";
    /* The cover's Close closes the loopback (its error says so), which is the person's cancel, not the wait running out. */
    try { query = await loop.caught; } catch (err) {
      const why = err && err.closed ? "signin-cancelled" : "signin-timeout";
      trace(io, provider.id, "browser", why);
      return { answer: { ok: false, reason: why }, refreshSealed: "" };
    }
    const back = loopbackAnswer(query, pending);
    if (!back.ok) {
      const q = new URLSearchParams(String(query || ""));
      trace(io, provider.id, "authorize", back.reason, back.reason === "signin-state" ? {} : { error: q.get("error") || "", error_description: q.get("error_description") || "" },
        [q.get("code") || "", pending.verifier, provider.clientSecret]);
      return { answer: back, refreshSealed: "" };
    }
    const hide = [back.code, pending.verifier, provider.clientSecret];
    let res = null;
    try { res = await io.tokenAsk(provider.token, codeForm(provider, pending, back.code)); } catch (err) {
      trace(io, provider.id, "token", "unreached", { detail: err && err.message }, hide);
      return { answer: { ok: false, reason: "unreached" }, refreshSealed: "" };
    }
    const got = tokensOf(res, provider, pending, clock(), !!extra);
    const said = traceSaid(res, hide);
    if (!got.ok) {
      if (said.status === 200 && !said.error && !said.detail) said.detail = traceClaims(res, pending.nonce, clock());
      trace(io, provider.id, "token", got.reason, said, hide);
      return { answer: got, refreshSealed: "" };
    }
    trace(io, provider.id, "token", "ok", { status: said.status, detail: "refresh token " + (got.refreshToken ? "given" : "none") }, hide);
    /* `same` (a managed computer): a sign-in while signed in, where it is not shared, must bring back the account signed in, else
       nothing is sent and nothing changes (decision 49). `same.who` is "" where none is known; `same` is undefined unmanaged. */
    const who = same ? whoOf(got.idToken) : "";
    if (same && same.who && who !== same.who) { /* plant:mp-same */
      trace(io, provider.id, "token", "signin-other", {}, hide);
      return { answer: { ok: false, reason: "signin-other" }, refreshSealed: "" };
    }
    let answer = await signIn(io.ask, open, provider.id, got.idToken, clock(), pending.seed, io.member, got.accessToken || "");
    /* The service's "access-token" leaves the ID token unspent: the refresh token redeemed for the service's scope, silently, and the
       same ID token and seed sent once more with the access token (section 11.11). The refresh token Microsoft rotates in is kept. */
    let refreshToken = got.refreshToken, answered = false, access = got.accessToken || "";
    if (answer.ok !== true && answer.reason === "access-token" && !got.accessToken) {
      answered = true;
      trace(io, provider.id, "service", "access-token", traceAnswer(answer), hide);
      const red = await redeem(io, provider, refreshToken, hide, clock);
      if (!red.ok) answer = { ok: false, reason: red.reason };
      else {
        if (red.refreshToken) refreshToken = red.refreshToken; /* plant:ma-seal */
        access = red.accessToken;
        answer = await signIn(io.ask, open, provider.id, got.idToken, clock(), pending.seed, io.member, red.accessToken);
      }
    }
    answer = accessLeft(answer);
    /* signin spent the token: where its no-role says the token held the Administrator's role, a refreshed one, which carries no
       nonce, asks for the card instead, as the service takes one issued within ten minutes. */
    if (answer.ok !== true && answer.reason === "signin-no-role" && answer.admin === true && refreshToken) { /* plant:admin-after-no-role */
      trace(io, provider.id, "service", answer.reason, traceAnswer(answer), hide);
      const again = await refreshed(io, provider, refreshToken, clock, hide, extra);
      if (again.ok) {
        if (again.refreshToken) refreshToken = again.refreshToken;
        answer = await licenceAdmin(io.ask, open, provider.id, again.idToken, clock(), undefined, again.accessToken || access);
      }
    }
    trace(io, provider.id, "service", answer.ok === true ? "ok" : answer.reason, traceAnswer(answer), hide);
    const card = answer.ok === true && answer.card ? answer.card : null;
    /* Signed in before the policy came, no hash is kept (`same.code`): the seat's code the service answers names the account then,
       and another is refused with nothing kept here. */
    if (same && !same.who && same.code && answer.ok === true && !card && answer.me !== same.code) { /* plant:mp-same-code */
      trace(io, provider.id, "service", "signin-other", {}, hide);
      return { answer: { ok: false, reason: "signin-other" }, refreshSealed: "" };
    }
    /* The organisation the lead's own token named, kept for the hint its desks are given (stage 3, src/desk-seat.mjs hintFor). */
    const out = { answer, refreshSealed: answer.ok === true ? io.seal(refreshToken) : "", seed: pending.seed,
      org: answer.ok === true && !card ? orgOf(provider, got.idToken) || "" : "", admin: !!card };
    if (same) out.who = who;
    if (answer.ok === true && !card && (answered || (remembered === true && !!got.accessToken))) out.access = true;
    return out;
  } finally {
    loop.close();
  }
}

/** The `signin/renew` route (decision 15 item 1): a refreshed ID token, which carries no nonce, signed by the lead's key over
 *  requests.mjs signinRenewBytes; the service binds it by that key, the token's person, a fresh iat and its first use. */
async function signInRenew(ask, open, provider, idToken, now, member, accessToken) {
  const tokenHash = await Q.tokenHash(String(idToken)), lead = open.public, t = Math.floor(now), m = memberOf(member, lead);
  /* The managed path's renewal: the access token beside, signed over signinRenewManagedBytes (section 11.11); the member key on either. */
  if (accessToken) {
    const accessHash = await Q.tokenHash(String(accessToken));
    const g = await call(ask, "signin/renew", Object.assign({ provider: String(provider), idToken: String(idToken), lead, t, accessToken: String(accessToken),
      sig: signHex(open, Q.signinRenewManagedBytes({ provider: String(provider), tokenHash, accessHash, lead, t, member: m })) }, m ? { member: m } : {})); /* plant:ma-renew-signed */
    return g.ok === true ? g : Object.assign({}, g, { reason: SIGNIN_REFUSED[g.reason] || g.reason });
  }
  const a = await call(ask, "signin/renew", Object.assign({ provider: String(provider), idToken: String(idToken), lead, t, /* plant:h-renew-body */
    sig: signHex(open, Q.signinRenewBytes({ provider: String(provider), tokenHash, lead, t, member: m })) }, m ? { member: m } : {}));
  return a.ok === true ? a : Object.assign({}, a, { reason: SIGNIN_REFUSED[a.reason] || a.reason });
}

/**
 * The quiet renewal: the sealed refresh token exchanged for a fresh ID token and posted to signin/renew, nothing shown. `io`
 * {tokenAsk, ask, seal, unseal}. Answers {answer, refreshSealed}: the service's answer, or "signin-ask" where no refresh token
 * is kept or the provider no longer takes it, or "unreached" where the provider or the service did not answer; and the seal
 * of a refresh token the provider rotated in, or the one given, or "" where the provider refused it. `remembered` as signInFlow's:
 * on the managed path the refresh asks the service's scope too and the renewal carries its access token; an "access-token" answer
 * off it redeems the refresh token silently and renews once more with both, and `access: true` then joins the answer.
 */
async function renewSignIn(io, provider, open, sealed, clock, remembered, post = signInRenew) {
  let token = "";
  try { token = sealed ? String(io.unseal(sealed)) : ""; } catch { token = ""; }
  if (!token || !provider) return { answer: { ok: false, reason: "signin-ask" }, refreshSealed: "" };
  const hide = [token, provider.clientSecret];
  /* Machine policy alone puts a renewal on the managed path; a remembered one renews ordinary first, so it ends where the service
     stops asking (a company's licence that no longer follows Entra). */
  const extra = managedScope(provider, false);
  const got = await refreshed(io, provider, token, clock, hide, extra);
  if (!got.ok) {
    if (got.reason === "unreached") return { answer: got, refreshSealed: sealed };
    /* A pin's refusal is named, so the check forgets the seal whatever it asked (afterCheck). */
    return { answer: { ok: false, reason: got.reason === "signin-tenant" ? "signin-tenant" : "signin-ask" }, refreshSealed: "" };
  }
  /* The administrator's check (adminCheck) posts the fresh token to licence/admin with no seed, the access token beside where held. */
  if (post !== signInRenew) {
    const card = await post(io.ask, open, provider.id, got.idToken, clock(), undefined, got.accessToken || "");
    trace(io, provider.id, "service", card.ok === true ? "ok" : card.reason, traceAnswer(card), hide);
    return { answer: card, refreshSealed: got.refreshToken ? io.seal(got.refreshToken) || sealed : sealed };
  }
  let answer = await signInRenew(io.ask, open, provider.id, got.idToken, clock(), io.member, got.accessToken || "");
  let refreshToken = got.refreshToken, answered = false;
  if (answer.ok !== true && answer.reason === "access-token" && !got.accessToken) {
    answered = true;
    trace(io, provider.id, "service", "access-token", traceAnswer(answer), hide);
    const red = await redeem(io, provider, refreshToken || token, hide, clock);
    if (!red.ok) answer = { ok: false, reason: red.reason };
    else {
      if (red.refreshToken) refreshToken = red.refreshToken;
      answer = await signInRenew(io.ask, open, provider.id, red.idToken, clock(), io.member, red.accessToken);
    }
  }
  answer = accessLeft(answer);
  trace(io, provider.id, "service", answer.ok === true ? "ok" : answer.reason, traceAnswer(answer), hide);
  const out = { answer, refreshSealed: refreshToken ? io.seal(refreshToken) || sealed : sealed };
  if (answer.ok === true && (answered || (remembered === true && !!got.accessToken))) out.access = true;
  else if (remembered === true && !answered && answer.reason !== "unreached") out.access = false; /* plant:ma-clear */
  return out;
}
/** A refresh token exchanged at the provider's token address for a fresh ID token: {ok, idToken, refreshToken}, or {ok: false,
 *  reason} "unreached" where the provider did not answer, else why the answer was not taken. `hide` gathers what the trace hides;
 *  `extra`, the service's scope asked beside (managedScope), brings its access token in `accessToken`. */
async function refreshed(io, provider, token, clock, hide, extra) {
  let res = null;
  try { res = await io.tokenAsk(provider.token, refreshForm(provider, token, extra)); } catch (err) {
    trace(io, provider.id, "refresh", "unreached", { detail: err && err.message }, hide);
    return { ok: false, reason: "unreached" };
  }
  const got = tokensOf(res, provider, null, clock(), !!extra);
  const said = traceSaid(res, hide);
  if (!got.ok) {
    if (said.status === 200 && !said.error && !said.detail) said.detail = traceClaims(res, "", clock());
    trace(io, provider.id, "refresh", got.reason, said, hide);
    return got;
  }
  trace(io, provider.id, "refresh", "ok", { status: said.status, detail: traceClaims(res, "", clock()).replace(/^.*, nonce /, "nonce ")
    + ", refresh token " + (got.refreshToken ? "replaced" : "kept") }, hide);
  return got;
}

/**
 * Check now, and the schedule's check, for an administrator (decision 49): the sealed refresh token exchanged and the fresh ID token
 * posted to licence/admin with no seed. `st` is the state kept, `by` "admin". Answers {answer, state}: the card kept where it was
 * answered; a provider that no longer takes the token forgets its seal and asks for a sign-in ("signin-ask"); anything else keeps
 * the state as it was but a rotated seal.
 */
async function adminCheck(io, provider, st, open, clock) {
  const next = Object.assign({}, st && typeof st === "object" ? st : {});
  const r = await renewSignIn(io, provider, open, next.refreshSealed || "", clock, undefined, licenceAdmin); /* plant:admin-check */
  if (r.refreshSealed) next.refreshSealed = r.refreshSealed;
  if (r.answer && r.answer.ok === true) {
    next.adminCard = r.answer.card;
    delete next.signinAsk;
  } else if (r.answer && r.answer.reason === "signin-ask") {
    delete next.refreshSealed;
    next.signinAsk = true;
  }
  return { answer: r.answer, state: next };
}

/* A lead seat's code, as the service makes it: 16 Crockford symbols (requests.mjs CROCKFORD). */
const SEAT_CODE = /^[0-9A-HJKMNP-TV-Z]{16}$/;
/** The state `st` with who an ok answer `a` says this Studio's person is: `me`, its lead seat's code, and `owner`, whether that
 *  person owns the licence (never secret); and `ref`, its licence's public reference, which its desks' seat certificates name
 *  (src/desk-seat.mjs checkSeat). An answer that names none leaves them as they were. */
function keepWho(st, a) {
  const next = Object.assign({}, st);
  if (!a || a.ok !== true) return next;
  if (typeof a.me === "string" && SEAT_CODE.test(a.me)) next.signinCode = a.me;
  if (typeof a.owner === "boolean") next.signinOwner = a.owner;
  if (typeof a.ref === "string" && /^[0-9a-f]{32}$/.test(a.ref)) next.licenceRef = a.ref; /* plant:a1-keep-ref */
  /* A team is its lead's own (decision 47, held for Max's ruling): a lead on a trial of their own whose organisation holds a paid
     licence is told to ask its owner, and the owner of a paid licence is told its switch; each answer says it afresh. */
  if (a.ask === "owner") next.signinAskOwner = true; else delete next.signinAskOwner; /* plant:t-keep-ask */
  /* A NAMING THE PERSON HAS NOT ACCEPTED (board 1011): who named them, the organisation's licence, the end of their own trial, and the key that
     says when Studio asks again; each answer says it afresh, and an answer that names none forgets it. */
  const nm = a.naming && typeof a.naming === "object" ? a.naming : null;
  /* Board 1017: "confirm" is a naming by address the person accepted that waits for the owner's confirmation, and trialEnds is null for someone
     with no trial of their own. */
  if (nm && typeof nm.org === "string" && (Number.isFinite(nm.trialEnds) || nm.trialEnds === null) && typeof nm.key === "string" && nm.key.length <= 64
    && (nm.state === "ask" || nm.state === "blocked" || nm.state === "confirm")) /* plant:n-keep-naming */
    next.signinNaming = { by: typeof nm.by === "string" ? nm.by.slice(0, 200) : "", org: nm.org.slice(0, 255), trialEnds: nm.trialEnds, key: nm.key, state: nm.state };
  else delete next.signinNaming;
  /* The lead seat's certificates its relay sessions carry, from a sign-in or a renewal: on a licence whose seats follow Entra for the
     signing key and the member key (Claude alpha's ruling on C1), on any other licence or trial for the member key alone, which a team
     this Studio follows asks of it (design note C-0, point 2). An answer that carries any replaces what was held, whole, so a lead
     certificate of a licence left behind is not presented after it; a check's answer names none and leaves them. A sign-in forgets them. */
  /* WHAT THE SERVICE SAID OF THE LICENCE, for the cover alone (Claudius's pass of 2026-11-22: the cover reads the organisation, seats and
     updates from the service's answer and the certificate, never the file): a licence's organisation, seats, updates and paid end, or a
     trial's end; an answer with no licence forgets it. Read by no gate. */
  const shown = licenceShownOf(a);
  if (shown) next.licenceShown = shown; else if (a.licence === null) delete next.licenceShown; /* plant:keep-shown */
  const certs = seatCertsOf(a.certificates); /* plant:c1-certs-whole */
  if (certs) next.seatCerts = certs; /* plant:c1-keep-certs */
  /* AN ANSWER SAYING THE LICENCE OR TRIAL HAS ENDED (a refund, a paid end, a trial ended early, or no licence) takes the Studio's own
     certificate away at once, so its gate (review xi; Max, 2026-11-22 15:37) does not run on to that certificate's end. */
  const over = a.ended !== undefined || a.licence === null || (!!a.trial && Number(a.trial.ends) <= Date.now());
  if (over && next.seatCerts && next.seatCerts.studio) { /* plant:studio-over */
    const rest = Object.assign({}, next.seatCerts);
    delete rest.studio;
    if (Object.keys(rest).length) next.seatCerts = rest; else delete next.seatCerts;
  }
  if (a.owner === true && typeof a.orgDesks === "boolean") next.orgDesks = a.orgDesks; else delete next.orgDesks; /* plant:t-keep-switch */
  /* A managed tenant (decision 49; Claude alpha, 21:34): why this person holds what they hold, where they also bought a licence of their
     own, said by each answer afresh. */
  if (a.managed === true && (a.cause === "own-licence" || a.cause === "assigned")) next.signinCause = a.cause; else delete next.signinCause; /* plant:keep-cause */
  /* WHAT THE SERVICE SAYS OF THE PERSON'S PAYMENTS (board 1020, src/buy-path.cjs buyKept): the team licence they already pay for, with the
     provider's portal, and the newest payment held naming them; each answer says it afresh, and one that says neither forgets both. */
  const buy = buyPath.buyKept(a);
  if (buy) next.signinBuy = buy; else delete next.signinBuy; /* plant:buy-keep */
  /* Whether the service said this account's organisation holds its licence through Entra (`managed: true`), cause or none: Buy is then
     offered nowhere (src/buy-path.cjs buyBarred), as the desk keeps licenceManaged. Each answer says it afresh. */
  if (a.managed === true) next.signinManaged = true; else delete next.signinManaged; /* plant:buy-keep-managed */
  return next;
}

/**
 * What the quiet check's answer `a` asks of a signed-in Studio (decision 15 item 1), and what is kept after: `io` as
 * renewSignIn's, `provider` the one signed in with, `st` the state kept (licence-service.json), `open` the lead's opened key.
 * Answers {answer, state}: the answer to take (the renewal's where one was made, else `a`) and the state to keep. A proof
 * "due" renews, and a failure changes nothing but a rotated seal; "signin" renews, and where the provider or the service will
 * not, the seal is forgotten and the cover asks the lead to sign in ("signin-ask"). The licence file is not this function's.
 */
/** What an ok answer `a` says of its licence, for the cover: {org, seats, updatesUntil, paidUntil} of a licence, {trialEnds} of a trial; else null. */
function licenceShownOf(a) {
  const l = a && a.licence && typeof a.licence === "object" && (a.licence.kind === LICENCE_KIND || a.licence.kind === TRIAL_KIND) ? a.licence : null;
  if (!l) return null;
  if (a.trial && Number.isSafeInteger(a.trial.ends)) return { trialEnds: a.trial.ends };
  if (l.kind === TRIAL_KIND && Number.isSafeInteger(l.ends)) return { trialEnds: l.ends };
  return { org: typeof l.org === "string" ? l.org.slice(0, 255) : null, seats: Number.isSafeInteger(l.seats) && l.seats > 0 ? l.seats : null,
    updatesUntil: typeof l.updatesUntil === "string" && /^\d{4}-\d{2}-\d{2}$/.test(l.updatesUntil) ? l.updatesUntil : null,
    paidUntil: Number.isSafeInteger(l.paidUntil) || (typeof l.paidUntil === "string" && /^\d{4}-\d{2}-\d{2}$/.test(l.paidUntil)) ? l.paidUntil : null };
}
/* A certificate kept as the service gave it, by its kind and an object's shape; the relay judges the rest. */
function seatCertsOf(c) {
  const one = (x) => (x && typeof x === "object" && !Array.isArray(x) && x.kind === "etiuda-seat-certificate" && /^[0-9a-f]{64}$/.test(String(x.desk)) ? x : null);
  if (!c || typeof c !== "object") return null;
  /* A member certificate is kept only where it carries the mark the service signs on it, so no desk's is ever held as one. */
  const lead = one(c.lead), member = one(c.member) && c.member.member === true ? c.member : null; /* plant:c1-member-mark */
  /* The Studio's own certificate, which its gate rests on (review xi; Max, 2026-11-22 15:37): unmarked, never a member's. */
  const studio = one(c.studio) && c.studio.member !== true ? c.studio : null; /* plant:studio-keep */
  /* Whichever is well formed is kept: the member certificate alone where the answer carries no lead one (an ordinary licence's). */
  if (!lead && !member && !studio) return null; /* plant:c1-member-alone */
  return Object.assign({}, lead ? { lead } : {}, member ? { member } : {}, studio ? { studio } : {});
}
/* What a check leaves: afterCheckOf's, and a refused sign-in's code for Buy (signinNoLicence) never past this next answer, ok or
   refused (board 1020). */
async function afterCheck(io, provider, a, st, open, clock) {
  const r = await afterCheckOf(io, provider, a, st, open, clock);
  if (r && r.state && typeof r.state === "object") { r.state = Object.assign({}, r.state); delete r.state.signinNoLicence; } /* plant:buy-refused-drop-check */
  return r;
}
async function afterCheckOf(io, provider, a, st, open, clock) {
  const s = st && typeof st === "object" ? st : {};
  if (s.by !== "signin") return afterCheckBefore(a, s);
  const due = !!a && a.ok === true && a.proof === "due"; /* plant:h-due */
  const lapsed = !!a && a.ok !== true && a.reason === "signin"; /* plant:h-lapsed */
  if (!due && !lapsed) return { answer: a, state: keepWho(s, a) };
  /* The check's revoked keys' list goes on with whatever answer replaces it: the renewal's answer carries none. */
  const withRevoked = (x) => (a.revoked !== undefined && x && x.revoked === undefined ? Object.assign({}, x, { revoked: a.revoked }) : x); /* plant:h-revoked */
  const r = await renewSignIn(io, provider, open, s.refreshSealed || "", clock, s.signinAccess === true);
  const next = Object.assign({}, s);
  /* The service's "access-token" met at this renewal is remembered, so the next renewal starts on the managed path (section 11.11). */
  if (r.access === true) next.signinAccess = true;
  else if (r.access === false) delete next.signinAccess;
  /* An account the organisation's pin no longer takes (decision 49): the seal is forgotten and the lead asked, "due" or not. */
  if (r.answer && r.answer.reason === "signin-tenant") { /* plant:mp-renew-forget */
    delete next.refreshSealed;
    next.signinAsk = true;
    return { answer: withRevoked({ ok: false, reason: "signin-ask" }), state: next };
  }
  if (r.refreshSealed) next.refreshSealed = r.refreshSealed;
  if (r.answer && r.answer.ok === true) {
    delete next.signinAsk;
    delete next.signinNoRole;
    return { answer: withRevoked(r.answer), state: keepWho(next, r.answer) };
  }
  /* The service found the account without an Etiuda role (a licence whose seats follow Entra): its relay refusal reads as a removal. */
  if (r.answer && r.answer.reason === "signin-no-role") next.signinNoRole = true; /* plant:c1-no-role */
  if (due) return { answer: a, state: keepWho(next, a) };
  /* A provider or service not reached is asked again at the next check; anything else needs the lead. */
  if (r.answer && r.answer.reason === "unreached") return { answer: withRevoked(r.answer), state: next };
  delete next.refreshSealed; /* plant:h-forget */
  next.signinAsk = true;
  return { answer: withRevoked({ ok: false, reason: "signin-ask" }), state: next };
}

/* A STUDIO ACTIVATED BEFORE SIGN-IN by a purchase key, an address's code or a trial by code: the service keeps a seat by sign-in
   alone, so its "signin" is said as "signin-moved", which asks the lead to sign in; the licence file stays where it is, and the
   sealed purchase key, which nothing reads now, goes. Any other answer is left as it came. */
const BEFORE_SIGNIN = new Set(["key", "email", "trial"]);
function afterCheckBefore(a, s) {
  const next = Object.assign({}, s);
  if (!BEFORE_SIGNIN.has(s.by) || !a || a.ok === true || a.reason !== "signin") return { answer: a, state: next }; /* plant:s4-before-moved */
  delete next.keySealed; /* plant:s4-before-sealed */
  delete next.keyUnread;
  return { answer: Object.assign({ ok: false, reason: "signin-moved" }, a.revoked !== undefined ? { revoked: a.revoked } : {}), state: next };
}

/* ---- THE OWNER'S LEAD SEATS (decision 15 (b)) ------------------------------------------------------------------------------
 * The licence's owner lists its lead seats by code (seat/list) and frees one (seat/free kind "lead" with the code); anyone else
 * is answered as a key with no seat, and is shown none. */

/** The owner's list of lead seats, signed by the lead's key: {ok, seats: [{code, seen, proved, you, named, team}], counts, unnamed:
 *  [{code, seen}], orgDesks} or a refusal. `named` and `team` are null, `unnamed` empty and `orgDesks` null from a service before
 *  a team was its lead's own. */
async function seatList(ask, open, now) {
  const lead = open.public, t = Math.floor(now);
  const a = await call(ask, "seat/list", { lead, t, sig: signHex(open, Q.seatListBytes({ lead, t })) });
  if (a.ok !== true) return a;
  const day = (v) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
  const count = (v) => (Number.isSafeInteger(v) && v >= 0 ? v : null);
  const seats = (Array.isArray(a.seats) ? a.seats : []).filter((x) => x && typeof x.code === "string" && SEAT_CODE.test(x.code))
    .slice(0, 500).map((x) => Object.assign({ code: x.code, seen: day(x.seen), proved: day(x.proved), you: x.you === true,
      named: typeof x.named === "boolean" ? x.named : null, team: count(x.team), namedAt: day(x.namedAt), owner: x.owner === true }, whoOfRow(x)));
  const unnamed = (Array.isArray(a.unnamed) ? a.unnamed : []).filter((x) => x && typeof x.code === "string" && SEAT_CODE.test(x.code))
    .slice(0, 100).map((x) => Object.assign({ code: x.code, seen: day(x.seen) }, PERSON_RE.test(String(x.person)) ? { person: x.person } : {}));
  /* The namings by address waiting (board 1017), each by its handle with its end and the candidates who pressed Accept on an address their
     provider did not vouch: each by pseudonym, with what the provider says of them. */
  const namings = (Array.isArray(a.namings) ? a.namings : []).filter((x) => x && HANDLE_RE.test(String(x.naming))).slice(0, 100).map((x) => ({
    naming: x.naming, until: Number.isSafeInteger(x.until) ? x.until : null, claimed: count(x.claimed),
    candidates: (Array.isArray(x.candidates) ? x.candidates : []).filter((k) => k && PERSON_RE.test(String(k.person))).slice(0, 20).map(candidateOf) }));
  const pool = (d) => (d && count(d.held) !== null && count(d.of) !== null ? { held: d.held, of: d.of } : null);
  return { ok: true, seats, counts: a.counts && typeof a.counts === "object" ? a.counts : null, unnamed,
    orgDesks: typeof a.orgDesks === "boolean" ? a.orgDesks : null, desks: pool(a.desks), namings };
}

/* BY ADDRESS, OR FROM THE LICENCE'S PEOPLE, NEVER BY A CODE ON A SCREEN (board 1017; Max, 2026-11-20 22:16, "I definitely agree.", to a lead
 * named by email address or from the licence's teams, the person's own Accept, and no code on any screen). The routes are the service's
 * (core.mjs lead/invite, lead/pick, lead/withdraw, lead/confirm, invite, invite/withdraw, person/admit by ask, ask/refuse);
 * the address typed goes only in the one request that names or invites it, and the service keeps a keyed hash of it (rule 5). */
const PERSON_RE = /^[0-9a-f]{64}$/, HANDLE_RE = /^[0-9a-f]{32}$/, TEAM_RE = /^t-[0-9a-f]{16}$/;
const ADDRESS_RE = /^[^\s@\x00-\x1f\x7f]{1,64}@[^\s@\x00-\x1f\x7f]+\.[^\s@\x00-\x1f\x7f.]+$/;
/** An address as the service takes it (core.mjs addressOf): trimmed, at most 254 characters, of the address's shape; else "". */
const addressForm = (v) => { const a = String(v == null ? "" : v).trim(); return a.length <= 254 && ADDRESS_RE.test(a) ? a : ""; };
const textOr = (v, max) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, max) : null);
/** What the provider says of a person, as a list hands it: name, provider, account kind, a work account's verified domain where the provider
 *  gives one, and when they pressed. */
const DOMAIN_RE = /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;
const count = (v) => (Number.isSafeInteger(v) && v >= 0 ? v : 0);
const candidateOf = (k) => ({ person: k.person, name: textOr(k.name, 128),
  provider: k.provider === "google" ? "google" : k.provider === "microsoft" ? "microsoft" : null,
  account: k.account === "work" ? "work" : k.account === "personal" ? "personal" : null,
  domain: k.account === "work" && typeof k.domain === "string" && DOMAIN_RE.test(k.domain) ? k.domain : null, at: Number.isSafeInteger(k.at) ? k.at : null });
/** A row's person by pseudonym, with the name and address the service keeps of them where it gives them. */
const whoOfRow = (x) => Object.assign({}, PERSON_RE.test(String(x.person)) ? { person: x.person } : {},
  typeof x.name === "string" ? { name: textOr(x.name, 128) } : {}, typeof x.address === "string" ? { address: textOr(x.address, 254) } : {});

/** The owner names an email address to a lead seat (lead/invite), signed by the owner's key: {ok, naming, until} or a refusal ("full",
 *  "no-seat"); anything but an address sends nothing and is "address". */
async function nameLeadAddress(ask, open, address, now) {
  const a = addressForm(address);
  if (!a) return { ok: false, reason: "address" };
  const lead = open.public, t = Math.floor(now);
  const r = await call(ask, "lead/invite", { address: a, lead, t, sig: signHex(open, Q.leadNameAddressBytes({ address: a, lead, t })) });
  if (r.ok !== true) return r;
  return HANDLE_RE.test(String(r.naming)) ? { ok: true, naming: r.naming, until: Number.isSafeInteger(r.until) ? r.until : null } : { ok: false, reason: "untrusted" };
}
/** The owner names someone on the licence's lists by the pseudonym the list gave (lead/pick): {ok, named} or a refusal. */
async function nameLeadPerson(ask, open, person, now) {
  const p = String(person || "");
  if (!PERSON_RE.test(p)) return { ok: false, reason: "no-seat" };
  const lead = open.public, t = Math.floor(now);
  return call(ask, "lead/pick", { person: p, lead, t, sig: signHex(open, Q.leadNamePersonBytes({ person: p, lead, t })) });
}
/** The owner withdraws a naming by address by its handle (lead/withdraw): {ok} alike whether or not there was one. */
async function withdrawNaming(ask, open, naming, now) {
  const n = String(naming || "");
  if (!HANDLE_RE.test(n)) return { ok: false, reason: "no-seat" };
  const lead = open.public, t = Math.floor(now);
  return call(ask, "lead/withdraw", { naming: n, lead, t, sig: signHex(open, Q.leadNameWithdrawBytes({ naming: n, lead, t })) });
}
/** The owner confirms a candidate of a naming by address (lead/confirm): {ok, named} or a refusal ("full", "no-seat"). */
async function confirmLead(ask, open, naming, person, now) {
  const n = String(naming || ""), p = String(person || "");
  if (!HANDLE_RE.test(n) || !PERSON_RE.test(p)) return { ok: false, reason: "no-seat" };
  const lead = open.public, t = Math.floor(now);
  return call(ask, "lead/confirm", { naming: n, person: p, lead, t, sig: signHex(open, Q.leadConfirmBytes({ naming: n, person: p, lead, t })) });
}
/** A lead invites an email address to its team (invite), `team` the relay team's id where it is one: {ok, invite, until} or a refusal
 *  ("already-invited", "no-seat"); anything but an address sends nothing and is "address". */
async function invitePerson(ask, open, address, team, now) {
  const a = addressForm(address);
  if (!a) return { ok: false, reason: "address" };
  const tm = TEAM_RE.test(String(team || "")) ? String(team) : undefined;
  const lead = open.public, t = Math.floor(now);
  const body = Object.assign({ address: a, lead, t }, tm ? { team: tm } : {});
  body.sig = signHex(open, Q.inviteBytes({ address: a, team: tm, lead, t }));
  const r = await call(ask, "invite", body);
  if (r.ok !== true) return r;
  return HANDLE_RE.test(String(r.invite)) ? { ok: true, invite: r.invite, until: Number.isSafeInteger(r.until) ? r.until : null } : { ok: false, reason: "untrusted" };
}
/** A lead withdraws an invitation by its handle (invite/withdraw): {ok} alike whether or not there was one. */
async function withdrawInvite(ask, open, invite, now) {
  const h = String(invite || "");
  if (!HANDLE_RE.test(h)) return { ok: false, reason: "no-seat" };
  const lead = open.public, t = Math.floor(now);
  return call(ask, "invite/withdraw", { invite: h, lead, t, sig: signHex(open, Q.inviteWithdrawHandleBytes({ invite: h, lead, t })) });
}
/** A lead accepts an ask (person/admit by ask), the confirmation of an unvouched invitation's Join among them: {ok, ...} or a refusal. */
async function admitAsk(ask, open, id, team, now) {
  const a = String(id || "");
  if (!HANDLE_RE.test(a)) return { ok: false, reason: "no-seat" };
  const tm = TEAM_RE.test(String(team || "")) ? String(team) : undefined;
  const lead = open.public, t = Math.floor(now);
  const body = Object.assign({ ask: a, lead, t }, tm ? { team: tm } : {});
  body.sig = signHex(open, Q.personAdmitAskBytes({ ask: a, team: tm, lead, t }));
  return call(ask, "person/admit", body);
}
/** A lead declines an ask (ask/refuse): {ok} or a refusal. */
async function refuseAsk(ask, open, id, now) {
  const a = String(id || "");
  if (!HANDLE_RE.test(a)) return { ok: false, reason: "no-seat" };
  const lead = open.public, t = Math.floor(now);
  return call(ask, "ask/refuse", { ask: a, lead, t, sig: signHex(open, Q.askRefuseBytes({ ask: a, lead, t })) });
}

/** The owner names the person whose sign-in `code` it is to a lead seat on its licence (lead/name), signed by the owner's key:
 *  {ok, named} or a refusal ("full": every lead seat named; "no-seat": not the owner, or no such code). */
async function nameLead(ask, open, code, now) {
  const c = String(code || "").toUpperCase().replace(/[\s-]+/g, "");
  if (!SEAT_CODE.test(c)) return { ok: false, reason: "no-seat" };
  const lead = open.public, t = Math.floor(now);
  return call(ask, "lead/name", { code: c, lead, t, sig: signHex(open, Q.leadNameBytes({ code: c, lead, t })) });
}

/** The named person's own Accept of a naming (lead/accept), signed by their own key: {ok, accepted: true}; {ok, accepted: false, reason: "full"}
 *  where no lead seat is free (nothing changed, and the owner is told); or a refusal ("held": a trial that holds a colleague's desk is not moved;
 *  "no-seat": no naming to accept). */
async function acceptNaming(ask, open, now) {
  const lead = open.public, t = Math.floor(now);
  return call(ask, "lead/accept", { lead, t, sig: signHex(open, Q.leadAcceptBytes({ lead, t })) });
}

/** The owner's switch (licence/set), signed by the owner's key: true, colleagues' desks are seated by the organisation; false, only
 *  people the owner or a named lead admitted. {ok, orgDesks} or a refusal ("no-seat": not the owner). */
async function setOrgDesks(ask, open, on, now) {
  const lead = open.public, t = Math.floor(now), orgDesks = on === true;
  return call(ask, "licence/set", { orgDesks, lead, t, sig: signHex(open, Q.licenceSetBytes({ orgDesks, lead, t })) });
}

/* ---- A SEAT FREED (board 980) ----------------------------------------------------------------------------------------------
 * A desk signs its person in to the service itself (service/licence/core.mjs signin/desk), and this Studio only reads the seat
 * certificate the desk writes (src/desk-seat.mjs); the lead's forward of a desk's token is retired. The lead frees a desk's seat at
 * once by the per-licence pseudonym the certificate names. Neither carries a catalog, a team or a name. */

/** A seat of `kind` freed at once, signed by the lead's key: "desk", the person named by the pseudonym a seat certificate names;
 *  "lead", by the seat's code, which only the licence's owner may free. */
async function freeSeat(ask, open, kind, person, now) {
  const lead = open.public, t = Math.floor(now), k = kind === "lead" ? "lead" : "desk";
  return call(ask, "seat/free", { kind: k, person: String(person), lead, t, sig: signHex(open, Q.seatFreeBytes({ kind: k, person: String(person), lead, t })) });
}
/* Free seat's refusals of its own, as the lead reads them: no such seat, and a desk seat this lead may not free (decision 46). An
   asker with no current lead seat is "not-lead", read under its own name. */
const SEAT_REFUSED = Object.freeze({ "no-seat": "seat-none", "not-yours": "seat-owner" }); /* plant:s46-free-refused */
const STAY_REFUSED = Object.freeze({ "no-seat": "stay-none", full: "stay-full" });

/** Who stays when seats in force fall below the seated (seat/stay), signed by the owner's or a co-lead's key:
 *  `kind` ("desk" or "lead"), `persons` (per-licence 64-hex pseudonyms, oldest choice first; empty clears). */
async function seatStay(ask, open, kind, persons, now) {
  const lead = open.public, t = Math.floor(now), k = kind === "lead" ? "lead" : "desk";
  const seen = new Set(), list = [];
  for (const raw of (Array.isArray(persons) ? persons : [])) {
    const p = String(raw || "");
    if (!/^[0-9a-f]{64}$/.test(p) || seen.has(p)) return { ok: false, reason: "no-seat" };
    seen.add(p);
    list.push(p);
  }
  return call(ask, "seat/stay", { lead, kind: k, persons: list, t, sig: signHex(open, Q.seatStayBytes({ kind: k, persons: list, lead, t }) /* plant:seat-team-client-stay */) });
}

/* ---- THE LEAD'S LIST OF PEOPLE WHO SIGNED IN, AND ADMITTING ONE (board 980; the product designer's handoff, section 6) ------
 * The people of the licence's organisations whose desk signed in within 30 days, by code and day, never a personal account
 * (night decision 20 (c)); a lead admits one from the list, or any account by the code its person gives. Neither request
 * carries a name: a name a lead writes beside a code stays on that computer. */

const validDay = (v) => {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const ms = Date.parse(v + "T00:00:00Z");
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === v;
};
const parseReduction = (r) => {
  if (!r || typeof r !== "object" || Array.isArray(r)) return null;
  if (!validDay(r.at)) return null; /* plant:seat-team-client-reduction */
  if (!Number.isSafeInteger(r.seats) || r.seats < 0) return null;
  if (!Number.isSafeInteger(r.seated) || r.seated < 0) return null;
  return { at: r.at, seats: r.seats, seated: r.seated };
};

/** The lead's list, signed by the lead's key: {ok, people: [{code, person, signedIn, added?, waiting?, stays?}], reduction?, staysKept?} or a refusal. */
async function listPeople(ask, open, now) {
  const lead = open.public, t = Math.floor(now);
  const a = await call(ask, "person/list", { lead, t, sig: signHex(open, Q.personListBytes({ lead, t })) });
  if (a.ok !== true) return a;
  const valid0 = (Array.isArray(a.people) ? a.people : []).filter((x) => x && typeof x.code === "string" && SEAT_CODE.test(x.code)
    && typeof x.person === "string" && /^[0-9a-f]{64}$/.test(x.person) && typeof x.signedIn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x.signedIn));
  const keptSet = new Set(
    (Array.isArray(a.staysKept) ? a.staysKept : []).filter((p) => typeof p === "string" && /^[0-9a-f]{64}$/.test(p))
  );
  for (const x of valid0.slice(500)) if (x.stays === true) keptSet.add(x.person);
  /* Every row past the first 500 that names a team is kept too (board 1017's B; the test architect's read of ec990251): a large lead's members
     past the cap would otherwise drop out of the kept Joins and be refused at the door. The service lists them all. */
  const valid = valid0.slice(0, 500).concat(valid0.slice(500).filter((x) => TEAM_RE.test(String(x.team)))); /* plant:jd-client-past-500 */
  const people = valid.map((x) => Object.assign({ code: x.code, person: x.person, signedIn: x.signedIn }, x.added === false ? { added: false } : {},
      typeof x.name === "string" ? { name: textOr(x.name, 128) } : {}, typeof x.address === "string" ? { address: textOr(x.address, 254) } : {},
      x.waiting === true ? { waiting: true } : {} /* plant:seat-wait-client */,
      typeof x.stays === "boolean" ? { stays: x.stays } : {} /* plant:seat-team-client-stays */,
      /* Board 1017's B: the asker's own team the person is on, and beside it whether their seat is held now (core.mjs person/list). */
      TEAM_RE.test(String(x.team)) ? { team: x.team, seated: x.seated === true } : {} /* plant:jd-client-team */));
  /* Newest first whatever order came: the newest's Admit is the solid one. */
  people.sort((x, y) => (x.signedIn < y.signedIn ? 1 : x.signedIn > y.signedIn ? -1 : 0));
  const reduction = parseReduction(a.reduction);
  const shown = new Set(people.map((p) => p.person));
  const staysKept = reduction ? [...keptSet].filter((p) => !shown.has(p)) : []; /* plant:seat-team-client-kept */
  /* The open asks (board 1017's member invitation: an unvouched Join waits, source "unconfirmed", for the lead's confirmation), each with what
     the provider says of its person, and the invitations by handle. */
  const asks = (Array.isArray(a.asks) ? a.asks : []).filter((x) => x && HANDLE_RE.test(String(x.ask)) && PERSON_RE.test(String(x.person))).slice(0, 100)
    .map((x) => Object.assign(candidateOf(x), { ask: x.ask, address: textOr(x.address, 254), vouched: x.vouched === true,
      source: typeof x.source === "string" ? x.source.slice(0, 20) : null, kind: x.kind === "studio" ? "studio" : "desk",
      team: TEAM_RE.test(String(x.team)) ? x.team : null, until: Number.isSafeInteger(x.until) ? x.until : null },
      x.source === "unconfirmed" ? { claimants: count(x.claimants) } : {}));
  const invites = (Array.isArray(a.invites) ? a.invites : []).filter((x) => x && HANDLE_RE.test(String(x.invite))).slice(0, 100)
    .map((x) => ({ invite: x.invite, team: TEAM_RE.test(String(x.team)) ? x.team : null, until: Number.isSafeInteger(x.until) ? x.until : null, claimed: count(x.claimed) }));
  return Object.assign({ ok: true, people, asks, invites }, reduction ? { reduction } : {}, staysKept.length ? { staysKept } : {});
}

/** One person admitted to the lead's licence by their sign-in `code`, signed by the lead's key: {ok, admitted, person}, `person`
 *  the per-licence pseudonym a seat certificate names them by, or a refusal ("no-seat": a lead who may not, or no such code). */
async function admitPerson(ask, open, code, now) {
  const c = String(code || "").toUpperCase().replace(/[\s-]+/g, "");
  if (!SEAT_CODE.test(c)) return { ok: false, reason: "no-seat" };
  const lead = open.public, t = Math.floor(now);
  const a = await call(ask, "person/admit", { code: c, lead, t, sig: signHex(open, Q.personAdmitBytes({ code: c, lead, t })) });
  if (a.ok !== true) return a;
  if (typeof a.person !== "string" || !/^[0-9a-f]{64}$/.test(a.person)) return { ok: false, reason: "untrusted" };
  return { ok: true, admitted: c, person: a.person };
}

/** One person's admission by name withdrawn from the lead's licence (night decision 22), by the per-licence pseudonym `person`
 *  that person/admit answered and their certificates name, signed by the lead's key: {ok: true}, the same whether or not they
 *  were admitted so, or a refusal ("no-seat": a lead who may not). Something else than a pseudonym sends nothing. With `team`, a
 *  relay team's id, the person is taken off that team alone (board 1017's B), their admission kept; another `team` sends nothing. */
async function withdrawPerson(ask, open, person, now, team) {
  const p = String(person || "");
  if (!/^[0-9a-f]{64}$/.test(p)) return { ok: false, reason: "no-seat" };
  if (team !== undefined && !TEAM_RE.test(String(team))) return { ok: false, reason: "no-seat" };
  const lead = open.public, t = Math.floor(now);
  if (team === undefined) return call(ask, "person/withdraw", { person: p, lead, t, sig: signHex(open, Q.personWithdrawBytes({ person: p, lead, t })) });
  return call(ask, "person/withdraw", { person: p, team, lead, t, sig: signHex(open, Q.personWithdrawBytes({ person: p, team, lead, t })) });
}

/* ---- THE DOORS AT THE LICENCE SERVICE (board 980, the door-finding; Max, 2026-11-12 18:46 and 18:57) ---------------------------
 * The relay teams this Studio leads while signed in, each {team, rt, url, keyId, box}, set at the service so that a desk its licence
 * certifies is handed them and a new computer finds its team with no invitation. The set replaces this lead key's own doors there;
 * an empty one clears them. Nothing else is sent: no team name, no member. */

/** This lead key's doors set at the service, signed by the lead's key over requests.mjs doorSetBytes: {ok, doors} or a refusal. */
async function setDoors(ask, open, doors, now) {
  const lead = open.public, t = Math.floor(now);
  const list = (Array.isArray(doors) ? doors : []).map((d) => ({ team: String(d.team), rt: String(d.rt), url: String(d.url), keyId: String(d.keyId), box: String(d.box) }));
  return call(ask, "door/set", { lead, t, doors: list, sig: signHex(open, Q.doorSetBytes({ lead, t, doors: list })) });
}

export { quietCheck, take, planFor, grantHeld, CHECK_MS, RETRY_MS, ENDED, PAID_ENDED, BEFORE_SIGNIN,
  SIGN_IN_PROVIDERS, PROVIDERS_NOW, signInProviders, signInPreview, providerOf, authorizeRequest, loopbackAnswer, loopbackEnds, codeForm, refreshForm,
  tokensOf, signIn, signInRenew, sealRefresh, signInFlow, renewSignIn, keepWho, afterCheck, seatList, nameLead, nameLeadAddress, nameLeadPerson, withdrawNaming,
  confirmLead, invitePerson, withdrawInvite, admitAsk, refuseAsk, addressForm, acceptNaming, setOrgDesks, freeSeat, SEAT_REFUSED, STAY_REFUSED, seatStay, SEAT_CODE,
  listPeople, admitPerson, withdrawPerson, setDoors, licenceAdmin, adminCard, adminCheck, SIGNIN_SECRET_FILE, SIGNIN_SECRET_SHAPE, signinSecretRead, setSigninPacked, signinSecretPart, traceLine,
  setSigninPolicy, pinnedProviders, pinRefuses, whoOf, serviceScopeOf, ACCESS_MAX };
