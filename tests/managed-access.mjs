/* THE LICENCE SERVICE AS ITS OWN RESOURCE, STUDIO'S CLIENT HALF (decision 49, section 11.11; held for Max's ruling).
 *
 *     node tests/managed-access.mjs        exit code is the number of failed checks, capped at 63
 *
 * gate-kind: node
 *
 * THE CRITERION, Claude alpha's words: "yes, change section 11 now and build it at the seam", on three conditions: (1) a person stays
 * the same person; (2) the access token is judged whole and fails closed (the service's judgement; the client carries it opaque);
 * (3) nothing new for an ordinary licence or a personal account.
 *
 * NOTHING HERE READS THE REGISTRY, LOADS THE SHELL, OPENS A WINDOW OR REACHES A NETWORK: src/licence-client.mjs is loaded from its
 * text, the policy is handed to it as an object, and the browser, Microsoft, Google and the licence service are functions of this
 * file. "Today's" bytes are rebuilt here from the interface (service/licence/requests.mjs's domains, SHA-256 of a token's string,
 * the provider table's scopes), never taken from the client under test.
 *
 *   ma1  P1: an ordinary licence, unmanaged, with the service's id configured: the authorize address, the code and refresh forms,
 *        the signin and signin/renew bodies and their signed bytes are today's byte for byte; Microsoft's own access token unread
 *   ma2  P2: a personal Microsoft account's authorize address holds no service scope and its request no access token; Google on a
 *        managed computer neither
 *   ma3  P3: unmanaged, the service answers "access-token": the refresh token redeemed once for the service's scope with no second
 *        authorize, the same ID token and seed sent again with the access token over the managed bytes, signed in, remembered
 *   ma4  P4: managed, the first authorize asks the service's scope and the one request carries the access token signed by the
 *        managed bytes, rebuilt here; the managed renewal the same; the bytes the tree's requests.mjs makes meet those rebuilt
 *   ma5  P5: the access token never reaches a trace line, the landing page, a seal, the flow's answer or the state a check keeps
 *   ma6  a renewal: remembered, it asks the scope and carries the token; met with "access-token", it redeems once and remembers
 *   ma7  the redemption's refusals: AADSTS50105 is the organisation's ("signin-org"); a refused grant, no service id, no refresh
 *        token, a second "access-token" each the sign-in not finishing ("signin-refused"); an access token past 4096 not carried
 *   ma8  each guard red under its plant, planted in memory (the plant:ma-* marks), nothing on disk changed
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as Q from "../service/licence/requests.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let asserted = 0, failed = 0;
function check(ok, line) {
  asserted++;
  if (ok) console.log("  ok   " + line);
  else { failed++; console.log("  FAIL " + line); }
}
const parts = (o) => Object.entries(o).map(([k, v]) => k + "=" + v).join(" ");
const all = (o) => Object.values(o).every((v) => v === true);

/* ---- the client, loaded so a plant can load it again from text, in memory ------------------------------------------------ */
const CLIENT_AT = path.join(ROOT, "src", "licence-client.mjs");
const TEXT = fs.readFileSync(CLIENT_AT, "utf8");
let copies = 0;
async function clientFrom(text) {
  const t = text.replace(/from "(\.\.?\/[^"]+)"/g, (m, rel) => 'from "' + pathToFileURL(path.join(ROOT, "src", rel)).href + '"') + "\n// copy " + (++copies) + "\n";
  return import("data:text/javascript;base64," + Buffer.from(t).toString("base64"));
}
const C = await clientFrom(TEXT);

/* ---- fixtures ---------------------------------------------------------------------------------------------------------- */
const TID = "3f2a8c1e-5b7d-4e9f-a1c3-0d2e4f6a8b9c", MSA = "9188040d-6c67-4c5b-b112-36a304b66dad";
const CLIENT = "11112222-3333-4444-5555-666677778888", SVC = "aaaabbbb-cccc-4ddd-8eee-ffff00001111";
const SCOPE = "api://" + SVC + "/Licence.Use";
const MS = Object.assign({}, C.SIGN_IN_PROVIDERS[0], { clientId: CLIENT, service: SVC });
const MS_BARE = Object.assign({}, C.SIGN_IN_PROVIDERS[0], { clientId: CLIENT });
const GG = Object.assign({}, C.SIGN_IN_PROVIDERS[1], { clientId: "123456789012-harbourlamps.apps.googleusercontent.com" });
const NOW = Date.UTC(2026, 10, 13, 21, 0, 0), T = Math.floor(NOW);
const MANAGED = Object.freeze({ any: true, managed: true, shared: false, personal: false, provider: "", tenant: "", closed: false, contact: "" });
const b64url = (s) => Buffer.from(s).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const jwt = (claims) => b64url(JSON.stringify({ alg: "RS256", typ: "JWT" })) + "." + b64url(JSON.stringify(claims)) + "." + b64url("signature");
function idToken(p, extra) {
  const ms = p.id === "microsoft", tid = (extra && extra.tid) || TID;
  return jwt(Object.assign({ iss: ms ? "https://login.microsoftonline.com/" + tid + "/v2.0" : "https://accounts.google.com", aud: p.clientId,
    exp: Math.floor(NOW / 1000) + 3600, iat: Math.floor(NOW / 1000), sub: "person-a" }, ms ? { tid, oid: "0b0b0b0b-1111-4222-8333-444455556666" } : {}, extra || {}));
}
/* The service's access token: opaque to the client, so any JWT-shaped string stands; each fixture its own, to be found if it leaks. */
const accessToken = (tag) => jwt({ aud: SVC, azp: CLIENT, scp: "Licence.Use", ver: "2.0", tag, pad: "x".repeat(200) });
const keys = crypto.generateKeyPairSync("ed25519");
const open = { privateKey: keys.privateKey, public: keys.publicKey.export({ format: "der", type: "spki" }).subarray(-32).toString("hex") };
const CODE = "7K3MQ9TV2XRBHN4W";
const json = (status, o) => ({ status, bytes: Buffer.from(JSON.stringify(o)) });
const sha = (s) => crypto.createHash("sha256").update(String(s)).digest("hex");
/* Today's signed bytes and the managed ones, rebuilt from the interface: the domain, then each field on a line. */
const bytesOf = (domain, fields) => Buffer.from(domain + "\n" + fields.map(String).join("\n"), "utf8");
const verifies = (bytes, sigHex) => { try { return crypto.verify(null, bytes, keys.publicKey, Buffer.from(String(sigHex), "hex")); } catch { return false; } };
const signed = (bytes) => crypto.sign(null, bytes, keys.privateKey).toString("hex");

/** A stand for one flow: every browser opening, token request, service call, seal, page and trace line recorded. `o.code(form)` and
 *  `o.refresh(form)` answer the token address by grant, `o.service(route, body, n)` the licence service. */
/* The flow reads its nonce from the address it opened; the stand's code answer reads it back through f0. */
let liveRec = null;
const f0 = { nonce: () => (liveRec ? liveRec.nonce : "") };
function stand(o) {
  const rec = { opened: [], forms: [], asks: [], seals: [], pages: [], traces: [] };
  liveRec = rec;
  let n = 0, back = null;
  const rand = (k) => crypto.createHash("sha256").update("rand " + (n++)).digest().subarray(0, k);
  const io = {
    rand,
    listen: async () => { const caught = new Promise((r) => { back = r; }); return { port: 50123, caught, close() {} }; },
    openPage: async (url) => {
      rec.opened.push(String(url));
      const u = new URL(url);
      rec.nonce = u.searchParams.get("nonce");
      if (back) { back("?code=c0de&state=" + encodeURIComponent(u.searchParams.get("state"))); back = null; }
      return true;
    },
    tokenAsk: async (url, form) => {
      const f = Buffer.from(form).toString("utf8");
      rec.forms.push({ url, form: f });
      const q = new URLSearchParams(f);
      return q.get("grant_type") === "authorization_code" ? o.code(q, rec) : o.refresh(q, rec);
    },
    ask: async (route, bytes) => {
      const body = Buffer.from(bytes).toString("utf8");
      rec.asks.push({ route, body });
      return o.service(route, JSON.parse(body), rec.asks.length);
    },
    seal: (t) => { rec.seals.push(String(t)); return "S:" + t; },
    unseal: (s) => String(s).slice(2),
    page: (kind) => { rec.pages.push(String(kind)); return "<p>" + kind + "</p>"; },
    trace: (line) => { rec.traces.push(String(line)); },
  };
  return { io, rec };
}
const SEATED = json(200, { ok: true, me: CODE });
const ACCESS_NEEDED = json(409, { ok: false, reason: "access-token" });
/** One sign-in by `K` under policy `pol` with provider `p`, `remembered` as the shell hands it. */
async function flowOn(K, pol, p, o, remembered) {
  K.setSigninPolicy(pol);
  try {
    const prov = K.signInProviders([p], {})[0];
    const s = stand(o);
    const r = await K.signInFlow(s.io, prov, open, () => NOW, undefined, remembered);
    return { r, rec: s.rec, prov };
  } finally { K.setSigninPolicy(null); }
}
/** One check's renewal by `K` (afterCheck on a "due" proof) under `pol`, from the state `st`. */
async function renewOn(K, pol, p, o, st) {
  K.setSigninPolicy(pol);
  try {
    const prov = K.signInProviders([p], {})[0];
    const s = stand(o);
    const out = await K.afterCheck(s.io, prov, { ok: true, proof: "due" }, Object.assign({ by: "signin", provider: p.id, refreshSealed: "S:rt-old", lead: open.public }, st || {}), open, () => NOW);
    return { out, rec: s.rec };
  } finally { K.setSigninPolicy(null); }
}
/** Today's authorize address for `p` at the stand's first three random draws (the code under test before section 11.11). */
async function todaysAuthorize(p, base) {
  const r = (i) => crypto.createHash("sha256").update("rand " + i).digest().subarray(0, 32);
  const verifier = b64url(r(0)), state = b64url(r(1)), seed = Buffer.from(r(2)).toString("hex");
  const nonce = await Q.signinNonce(open.public, seed);
  const q = new URLSearchParams(Object.assign({ client_id: p.clientId, response_type: "code", redirect_uri: "http://127.0.0.1:50123", scope: p.scope, state, nonce,
    code_challenge: b64url(crypto.createHash("sha256").update(verifier).digest()), code_challenge_method: "S256" }, p.extra || {}));
  return { url: (base || p.authorize) + "?" + q.toString(), verifier, seed };
}
const formText = (o) => new URLSearchParams(o).toString();
const asksScope = (s) => /api%3A%2F%2F|api:\/\/|Licence\.Use/.test(String(s));

/* ---- ma1, P1: an ordinary licence, byte for byte --------------------------------------------------------------------------- */
async function ordinaryHolds(K) {
  const renewed = idToken(MS, { sub: "person-a" });
  const f = await flowOn(K, null, MS, {
    code: () => json(200, { token_type: "Bearer", id_token: idToken(MS, { nonce: f0.nonce() }), refresh_token: "rt-1", access_token: "graph-opaque" }),
    service: () => SEATED,
  });
  const today = await todaysAuthorize(MS);
  const sent = f.rec.asks[0] ? JSON.parse(f.rec.asks[0].body) : {};
  const idt = sent.idToken || "";
  const body = JSON.stringify({ provider: "microsoft", idToken: idt, lead: open.public, t: T, seed: today.seed,
    sig: signed(bytesOf("etiuda-licence-signin", ["microsoft", sha(idt), open.public, T, "seed:" + today.seed])) }); /* the seed signed, its last line (review 2's finding 12) */
  const codeForm = formText({ client_id: CLIENT, grant_type: "authorization_code", code: "c0de", redirect_uri: "http://127.0.0.1:50123", code_verifier: today.verifier });
  const rn = await renewOn(K, null, MS, {
    refresh: () => json(200, { token_type: "Bearer", id_token: renewed, refresh_token: "rt-2", access_token: "graph-opaque" }), service: () => SEATED,
  });
  const rbody = JSON.stringify({ provider: "microsoft", idToken: renewed, lead: open.public, t: T,
    sig: signed(bytesOf("etiuda-licence-signin-renew", ["microsoft", sha(renewed), open.public, T])) });
  const rform = formText({ client_id: CLIENT, grant_type: "refresh_token", refresh_token: "rt-old", scope: "openid profile email offline_access" });
  return {
    authorize: f.rec.opened.length === 1 && f.rec.opened[0] === today.url,
    codeForm: f.rec.forms.length === 1 && f.rec.forms[0].form === codeForm,
    body: f.rec.asks.length === 1 && f.rec.asks[0].route === "signin" && f.rec.asks[0].body === body,
    signedIn: f.r.answer.ok === true && f.r.access === undefined && f.r.refreshSealed === "S:rt-1",
    renewForm: rn.rec.forms.length === 1 && rn.rec.forms[0].form === rform,
    renewBody: rn.rec.asks.length === 1 && rn.rec.asks[0].route === "signin/renew" && rn.rec.asks[0].body === rbody,
    renewState: rn.out.state.signinAccess === undefined && !("signinAccess" in rn.out.state),
  };
}

/* ---- ma2, P2: a personal account, and Google on a managed computer ------------------------------------------------------------- */
async function personalHolds(K) {
  const personal = await flowOn(K, null, MS, {
    code: () => json(200, { id_token: idToken(MS, { tid: MSA, nonce: f0.nonce() }), refresh_token: "rt-p", access_token: "graph-opaque" }), service: () => SEATED,
  });
  const google = await flowOn(K, MANAGED, GG, {
    code: () => json(200, { id_token: idToken(GG, { nonce: f0.nonce(), hd: "harbour-lamps.example" }), refresh_token: "rt-g", access_token: "google-opaque" }), service: () => SEATED,
  });
  const gRenew = await renewOn(K, MANAGED, GG, { refresh: () => json(200, { id_token: idToken(GG, { hd: "harbour-lamps.example" }), access_token: "google-opaque" }), service: () => SEATED },
    { provider: "google", signinAccess: true });
  const noAccess = (rec) => rec.asks.every((a) => !("accessToken" in JSON.parse(a.body)));
  return {
    personalAddress: personal.rec.opened.length === 1 && !asksScope(personal.rec.opened[0]) && new URL(personal.rec.opened[0]).searchParams.get("scope") === "openid profile email offline_access",
    personalRequest: personal.r.answer.ok === true && noAccess(personal.rec) && personal.r.access === undefined,
    googleAddress: google.rec.opened.length === 1 && !asksScope(google.rec.opened[0]) && google.r.answer.ok === true && noAccess(google.rec),
    googleRenew: gRenew.rec.forms.every((x) => !asksScope(x.form)) && noAccess(gRenew.rec),
  };
}

/* ---- ma3, P3: unmanaged, the service asks for its access token ------------------------------------------------------------- */
const AT_REDEEMED = accessToken("redeemed"), AT_FIRST = accessToken("first"), AT_RENEW = accessToken("renew");
async function answeredHolds(K) {
  const f = await flowOn(K, null, MS, {
    code: () => json(200, { id_token: idToken(MS, { nonce: f0.nonce() }), refresh_token: "rt-1", access_token: "graph-opaque" }),
    refresh: () => json(200, { id_token: idToken(MS), refresh_token: "rt-rotated", access_token: AT_REDEEMED }),
    service: (route, body, n) => (n === 1 ? ACCESS_NEEDED : SEATED),
  });
  const [first, second] = f.rec.asks.map((a) => JSON.parse(a.body));
  const remFirst = await flowOn(K, null, MS, { code: () => json(200, { id_token: idToken(MS, { nonce: f0.nonce() }), refresh_token: "rt-1", access_token: AT_FIRST }),
    service: () => SEATED }, true);
  const redemption = f.rec.forms[1] ? new URLSearchParams(f.rec.forms[1].form) : null;
  const managedBytes = second ? bytesOf("etiuda-licence-signin-managed", ["microsoft", sha(second.idToken), sha(AT_REDEEMED), open.public, T, "seed:" + second.seed]) : null;
  return {
    oneAuthorize: f.rec.opened.length === 1 && !asksScope(f.rec.opened[0]),
    firstToday: !!first && !("accessToken" in first) && verifies(bytesOf("etiuda-licence-signin", ["microsoft", sha(first.idToken), open.public, T, "seed:" + first.seed]), first.sig),
    silentOnce: f.rec.forms.length === 2 && !!redemption && redemption.get("grant_type") === "refresh_token" && redemption.get("refresh_token") === "rt-1"
      && redemption.get("scope") === "openid profile email offline_access " + SCOPE,
    bothSent: f.rec.asks.length === 2 && !!second && second.accessToken === AT_REDEEMED && second.idToken === first.idToken && second.seed === first.seed
      && verifies(managedBytes, second.sig),
    signedIn: f.r.answer.ok === true && f.r.access === true && f.r.refreshSealed === "S:rt-rotated",
    /* A first sign-in on a remembered path, unmanaged: its authorize asks the service's scope. */
    rememberedFirst: !!remFirst.rec.opened[0] && asksScope(remFirst.rec.opened[0]),
  };
}

/* ---- ma4, P4: a managed computer ------------------------------------------------------------------------------------------- */
async function managedHolds(K) {
  const f = await flowOn(K, MANAGED, MS, {
    code: () => json(200, { id_token: idToken(MS, { nonce: f0.nonce() }), refresh_token: "rt-1", access_token: AT_FIRST }),
    service: () => SEATED,
  });
  const today = await todaysAuthorize(MS, MS.authorize.replace("/common/", "/organizations/"));
  const asked = f.rec.opened[0] ? new URL(f.rec.opened[0]) : null;
  const sent = f.rec.asks[0] ? JSON.parse(f.rec.asks[0].body) : {};
  /* The first sign-in's seed is the bytes' last line, "seed:" and its hex (review 2's finding 12). */
  const rebuilt = bytesOf("etiuda-licence-signin-managed", ["microsoft", sha(sent.idToken || ""), sha(AT_FIRST), open.public, T, "seed:" + sent.seed]);
  /* The tree's requests.mjs, which src/licence-client.mjs signs with, meets the bytes rebuilt from the interface (ψ‴'s at 7c7e7698). */
  const tree = Buffer.from(Q.signinManagedBytes({ provider: "microsoft", tokenHash: sha(sent.idToken || ""), accessHash: sha(AT_FIRST), lead: open.public, t: T, seed: sent.seed }));
  const renewed = idToken(MS);
  const rn = await renewOn(K, MANAGED, MS, { refresh: () => json(200, { id_token: renewed, refresh_token: "rt-2", access_token: AT_RENEW }), service: () => SEATED });
  const rsent = rn.rec.asks[0] ? JSON.parse(rn.rec.asks[0].body) : {};
  const rform = rn.rec.forms[0] ? new URLSearchParams(rn.rec.forms[0].form) : null;
  const rtree = Buffer.from(Q.signinRenewManagedBytes({ provider: "microsoft", tokenHash: sha(renewed), accessHash: sha(AT_RENEW), lead: open.public, t: T }));
  const rrebuilt = bytesOf("etiuda-licence-signin-renew-managed", ["microsoft", sha(renewed), sha(AT_RENEW), open.public, T]);
  const expectScope = today.url.replace("scope=openid+profile+email+offline_access", "scope=" + encodeURIComponent("openid profile email offline_access " + SCOPE).replace(/%20/g, "+"));
  return {
    scopeAsked: !!asked && asked.searchParams.get("scope") === "openid profile email offline_access " + SCOPE && f.rec.opened[0] === expectScope,
    oneRequest: f.rec.opened.length === 1 && f.rec.forms.length === 1 && f.rec.asks.length === 1,
    carried: sent.accessToken === AT_FIRST && JSON.stringify(Object.keys(sent)) === '["provider","idToken","lead","t","seed","accessToken","sig"]',
    managedBytes: verifies(rebuilt, sent.sig) && Buffer.compare(rebuilt, tree) === 0,
    notRemembered: f.r.answer.ok === true && f.r.access === undefined,
    renewScope: !!rform && rform.get("scope") === "openid profile email offline_access " + SCOPE,
    renewCarried: rsent.accessToken === AT_RENEW && rsent.idToken === renewed && verifies(rrebuilt, rsent.sig) && Buffer.compare(rrebuilt, rtree) === 0
      && rn.out.answer.ok === true && rn.out.state.signinAccess === undefined,
  };
}

/* ---- ma5, P5: the access token stays in its one request ----------------------------------------------------------------------- */
async function hiddenHolds(K) {
  const a = await flowOn(K, null, MS, {
    code: () => json(200, { id_token: idToken(MS, { nonce: f0.nonce() }), refresh_token: "rt-1" }),
    refresh: () => json(200, { id_token: idToken(MS), refresh_token: "rt-rotated", access_token: AT_REDEEMED }),
    service: (route, body, n) => (n === 1 ? ACCESS_NEEDED : SEATED),
  });
  const m = await flowOn(K, MANAGED, MS, {
    code: () => json(200, { id_token: idToken(MS, { nonce: f0.nonce() }), refresh_token: "rt-1", access_token: AT_FIRST }), service: () => SEATED,
  });
  const rn = await renewOn(K, null, MS, {
    refresh: (q) => json(200, { id_token: idToken(MS), refresh_token: "rt-n", access_token: q.get("scope").indexOf(SCOPE) >= 0 ? AT_RENEW : "graph-opaque" }),
    service: (route, body, n) => (n === 1 ? ACCESS_NEEDED : SEATED),
  });
  const ats = [AT_REDEEMED, AT_FIRST, AT_RENEW];
  const leaks = (text) => ats.some((t) => String(text).indexOf(t) >= 0 || String(text).indexOf(t.split(".")[1]) >= 0);
  const recs = [a.rec, m.rec, rn.rec];
  return {
    traced: recs.every((r) => r.traces.length > 0 && !leaks(r.traces.join("\n"))),
    page: recs.every((r) => !leaks(r.pages.join("\n"))),
    sealed: recs.every((r) => !leaks(r.seals.join("\n"))),
    answers: !leaks(JSON.stringify(a.r)) && !leaks(JSON.stringify(m.r)) && a.r.answer.ok === true && m.r.answer.ok === true,
    state: rn.out.answer.ok === true && rn.out.state.signinAccess === true && !leaks(JSON.stringify(rn.out.state)),
    sentOnlyThere: a.rec.asks.filter((x) => leaks(x.body)).length === 1 && m.rec.asks.filter((x) => leaks(x.body)).length === 1,
  };
}

/* ---- ma6, a renewal remembered or met with "access-token" --------------------------------------------------------------------- */
async function renewalHolds(K) {
  const remembered = await renewOn(K, null, MS, { refresh: () => json(200, { id_token: idToken(MS), refresh_token: "rt-2", access_token: AT_RENEW }), service: () => SEATED },
    { signinAccess: true });
  const rform = remembered.rec.forms[0] ? new URLSearchParams(remembered.rec.forms[0].form) : null;
  const rbody = remembered.rec.asks[0] ? JSON.parse(remembered.rec.asks[0].body) : {};
  const met = await renewOn(K, null, MS, {
    refresh: (q) => json(200, { id_token: idToken(MS), refresh_token: q.get("scope").indexOf(SCOPE) >= 0 ? "rt-3" : "rt-2", access_token: q.get("scope").indexOf(SCOPE) >= 0 ? AT_REDEEMED : "graph-opaque" }),
    service: (route, body, n) => (n === 1 ? ACCESS_NEEDED : SEATED),
  });
  const mbodies = met.rec.asks.map((x) => JSON.parse(x.body));
  const mforms = met.rec.forms.map((x) => new URLSearchParams(x.form));
  return {
    /* A remembered path renews ordinary first, and an ordinary answer ends it (the coordinator's rule; the policy alone keeps it). */
    rememberedScope: !!rform && rform.get("scope") === "openid profile email offline_access" && !("accessToken" in rbody),
    rememberedCleared: remembered.out.answer.ok === true && remembered.out.state.signinAccess === undefined && remembered.rec.opened.length === 0,
    metOnce: mforms.length === 2 && mforms[0].get("scope") === "openid profile email offline_access" && mforms[1].get("refresh_token") === "rt-2"
      && mforms[1].get("scope") === "openid profile email offline_access " + SCOPE && met.rec.opened.length === 0,
    metSent: mbodies.length === 2 && !("accessToken" in mbodies[0]) && mbodies[1].accessToken === AT_REDEEMED,
    metRemembered: met.out.answer.ok === true && met.out.state.signinAccess === true && met.out.state.refreshSealed === "S:rt-3",
  };
}

/* ---- ma7, the redemption's refusals ------------------------------------------------------------------------------------------ */
async function refusalsHold(K) {
  const base = (refresh, service, p) => flowOn(K, null, p || MS, {
    code: () => json(200, { id_token: idToken(MS, { nonce: f0.nonce() }), refresh_token: "rt-1" }), refresh, service: service || ((r, b, n) => (n === 1 ? ACCESS_NEEDED : SEATED)),
  });
  const notAssigned = await base(() => json(400, { error: "invalid_grant", error_description: "AADSTS50105: The signed in user is not assigned to a role for the application." }));
  const refusedGrant = await base(() => json(400, { error: "invalid_grant", error_description: "AADSTS70000: The provided grant is not valid." }));
  const noService = await base(() => json(200, { id_token: idToken(MS), access_token: AT_REDEEMED }), null, MS_BARE);
  const twice = await base(() => json(200, { id_token: idToken(MS), access_token: AT_REDEEMED }), () => ACCESS_NEEDED);
  const noRefresh = await flowOn(K, null, MS, { code: () => json(200, { id_token: idToken(MS, { nonce: f0.nonce() }) }), refresh: () => json(200, {}), service: (r, b, n) => (n === 1 ? ACCESS_NEEDED : SEATED) });
  const long = K.tokensOf(json(200, { id_token: idToken(MS), access_token: "e" + "x".repeat(C.ACCESS_MAX) }), MS, null, NOW, true);
  const at4096 = K.tokensOf(json(200, { id_token: idToken(MS), access_token: "x".repeat(C.ACCESS_MAX) }), MS, null, NOW, true);
  const unasked = K.tokensOf(json(200, { id_token: idToken(MS), access_token: AT_FIRST }), MS, null, NOW);
  const oneEach = (x) => x.rec.opened.length === 1 && x.rec.asks.length === 1 && x.r.refreshSealed === "";
  return {
    notAssigned: notAssigned.r.answer.reason === "signin-org" && oneEach(notAssigned) && notAssigned.rec.forms.length === 2,
    refusedGrant: refusedGrant.r.answer.reason === "signin-refused" && oneEach(refusedGrant),
    noService: noService.r.answer.reason === "signin-refused" && oneEach(noService) && noService.rec.forms.length === 1,
    noRefresh: noRefresh.r.answer.reason === "signin-refused" && oneEach(noRefresh) && noRefresh.rec.forms.length === 1,
    twice: twice.r.answer.reason === "signin-refused" && twice.rec.asks.length === 2 && twice.rec.forms.length === 2 && twice.rec.opened.length === 1,
    bound: long.ok === true && long.accessToken === "" && at4096.accessToken === "x".repeat(C.ACCESS_MAX) && unasked.ok === true && !("accessToken" in unasked),
  };
}

const LEGS = [
  ["ma1", ordinaryHolds, "P1: an ordinary licence, unmanaged with the service's id configured: the authorize address, the code and refresh forms, the signin and"
    + " signin/renew bodies and signed bytes are today's byte for byte, Microsoft's own access token unread, nothing remembered"],
  ["ma2", personalHolds, "P2: a personal Microsoft account's authorize address asks no service scope and its request carries no access token; Google on a managed"
    + " computer neither, at a sign-in or a renewal"],
  ["ma3", answeredHolds, "P3: unmanaged, the service answers \"access-token\": one authorize only, the refresh token redeemed silently once for the service's"
    + " scope, the same ID token and seed sent again with the access token over the managed bytes, signed in, remembered, the rotated refresh token sealed"],
  ["ma4", managedHolds, "P4: managed, the first authorize asks the service's scope, the one request carries the access token signed over the managed bytes"
    + " rebuilt here from the interface, which the tree's requests.mjs meets; the managed renewal the same; nothing remembered for a policy"],
  ["ma5", hiddenHolds, "P5: the access token never reaches a trace line, the landing page, a seal, the flow's answer or the state a check keeps; only its one request"],
  ["ma6", renewalHolds, "a remembered renewal asks the service's scope and carries the token; one met with \"access-token\" redeems once, silently, and remembers"],
  ["ma7", refusalsHold, "the redemption's refusals: AADSTS50105 is the organisation's (signin-org); a refused grant, no service id, no refresh token and a second"
    + " \"access-token\" are the sign-in not finishing (signin-refused); an access token past 4096 characters is not carried, and none unless asked"],
];
for (const [id, holds, line] of LEGS) {
  let o = null;
  try { o = await holds(C); } catch (e) { o = { threw: String(e && e.stack || e).slice(0, 300) }; }
  check(all(o), id + " " + line + ": " + parts(o));
}

/* ---- ma8, each guard red under its plant ---------------------------------------------------------------------------------- */
/** `text` with the line holding plant:`tag` changed from `from` to `to`, or null where the mark or `from` is not there once. */
function planted(textIn, tag, from, to) {
  const lines = textIn.split("\n"), marked = lines.filter((l) => l.indexOf("plant:" + tag + " ") >= 0);
  const at = lines.findIndex((l) => l.indexOf("plant:" + tag + " ") >= 0);
  if (at < 0 || marked.length !== 1 || lines[at].split(from).length !== 2) return null;
  lines[at] = lines[at].replace(from, to);
  return lines.join("\n");
}
const PLANTS = [
  /* P1, P2: the service's scope asked always */
  ["ma-scope", 'String(extra || "")', "String(extra || serviceScopeOf(provider))", [ordinaryHolds, personalHolds]],
  /* P3: an interactive authorize in place of the silent redemption */
  ["ma-silent", "res = await io.tokenAsk(", "await io.openPage(provider.authorize); res = await io.tokenAsk(", [answeredHolds]],
  /* P4: the access hash left out of the signed bytes, at a sign-in and at a renewal */
  ["ma-signed", "Q.signinManagedBytes({ provider: String(provider), tokenHash, accessHash, lead, t, member: m, seed: signedSeed })", "Q.signinBytes({ provider: String(provider), tokenHash, lead, t, member: m, seed: signedSeed })", [managedHolds]],
  /* Review 2's finding 12, its residual: the seed left out of what the client signs */
  ["signin-seed-signed", "const signedSeed = seed ? String(seed) : undefined; /* plant:signin-seed-signed */", "const signedSeed = undefined;", [managedHolds]],
  ["ma-renew-signed", "Q.signinRenewManagedBytes({ provider: String(provider), tokenHash, accessHash, lead, t, member: m })", "Q.signinRenewBytes({ provider: String(provider), tokenHash, lead, t, member: m })", [managedHolds]],
  /* P5: the access token written into the sign-in state, sealed in the refresh token's place */
  ["ma-seal", "refreshToken = red.refreshToken", "refreshToken = red.accessToken", [hiddenHolds]],
  /* ma6: the remembered answer not read */
  ["ma-path", "managedHere() || remembered === true", "managedHere()", [answeredHolds]],
  ["ma-clear", "out.access = false;", "out.access = undefined;", [renewalHolds]],
  /* ma7: AADSTS50105 not read at the redemption, and the bound dropped */
  ["ma-50105", "NOT_ASSIGNED_CODE.test(", "false && NOT_ASSIGNED_CODE.test(", [refusalsHold]],
  ["ma-bound", "at.length <= ACCESS_MAX", "at.length <= 1e9", [refusalsHold]],
];
/* Under ETIUDA_PLANTS=off the plants are not run, as every inline plant proof here (tests/plant-hold.mjs pk-off). */
if (process.env.ETIUDA_PLANTS === "off") check(true, "ma8 each guard red under its plant (ETIUDA_PLANTS=off, not run)");
else {
  const results = {};
  for (const [tag, from, to, legs] of PLANTS) {
    const t = planted(TEXT, tag, from, to);
    if (t === null) { results[tag] = "anchor"; continue; }
    let red = false, why = "held";
    try {
      const K = await clientFrom(t);
      for (const holds of legs) if (!all(await holds(K))) red = true;
    } catch (e) { why = "threw:" + String(e && e.message).slice(0, 80); }
    results[tag] = red ? "red" : why;
  }
  const disk = fs.readFileSync(CLIENT_AT, "utf8") === TEXT;
  check(Object.values(results).every((v) => v === "red") && disk, "ma8 each guard red under its plant, in memory, nothing on disk changed (" + disk + "): " + parts(results));
}

console.log("managed-access: " + (asserted - failed) + " of " + asserted + " checks held");
process.exit(Math.min(failed, 63));
