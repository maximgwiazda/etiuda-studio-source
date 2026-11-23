/* A MANAGED INSTALLATION, STUDIO'S HALF OF THE POLICY (decision 49, held for Max's ruling).
 *
 *     node tests/managed-policy.mjs        exit code is the number of failed checks, capped at 63
 *
 * gate-kind: node
 *
 * THE CRITERION, Claude alpha's words: "a large company's IT decides, in tools it already uses and without touching each computer,
 * who may use Etiuda, in which role and with which account, and an ordinary user on a managed computer is shown nothing to buy,
 * try, switch or administer; a small company and a person on their own notice nothing." And: "'Managed' on a computer must never
 * weaken what an unmanaged one has: a person on a managed computer who is not assigned sees the refusal's sentence and whom to
 * ask, nothing else, and no path on that computer leads to a personal account or a trial unless AllowPersonalAccounts says so."
 *
 * NOTHING HERE READS THE REGISTRY, OPENS A WINDOW OR REACHES A NETWORK: the policy is reg query's text written here, the shell is
 * shell/main.js under a stub of Electron with src/ai-policy.cjs stood in by that text, the page is ui/app.js on
 * tests/page-stand-in.mjs, and every provider, browser and service is a function of this file.
 *
 *   mp1  the reader: nothing set is NONE; each of the six values in each form, its bad forms, a subkey's values passed over
 *   mp2  the providers offered: none pinned is the list itself; a tenant, a domain, personal accounts off, a named provider and a
 *        pin that cannot be honoured (closed: none offered); the addresses carry the tenant or organizations, Google's page hd
 *   mp3  the token's tenant, domain or account kind checked against the pin at sign-in, refused "signin-tenant"
 *   mp4  AADSTS50105 is the organisation's refusal on a managed computer alone; elsewhere what it was
 *   mp5  a renewal the pin refuses forgets the refresh token and asks the lead, "due" or "signin"
 *   mp6  a sign-in while signed in on a managed computer returns the same account or is refused "signin-other" before anything
 *        is sent; signed in before the policy, by the seat's code; unmanaged the flow's answer is today's
 *   mp7  the shell: the policy handed to the page only where set; trial, purchase key and purchase email, Sign out (unless shared)
 *        and the owner's acts refused under Managed, today's where unset
 *   mp8  the page under Managed: the Account of the product designer's pictures (the managed line, the locked Sign-in row, the
 *        seat given by the organisation, Last checked), the band's panel with no code, the Licence cover and the team cover with
 *        no way to activate, buy or try; on a shared computer the two acts back; English and Polish
 *   mp9  M1: managed and not assigned, Account shows exactly the refusal's sentence and the SupportContact line or the IT default,
 *        one Try again, no other provider, code, trial, purchase or account; English and Polish
 *   mp10 M2: the reachable acts, managed against unmanaged on one profile, differ by exactly the account acts listed, and nothing else
 *   mp11 M3: managed with AllowPersonalAccounts unset, no reachable act leads to a personal account or a trial; set, the personal
 *        path is reachable and the trial still is not
 *   mp12 unset, byte for byte: the Account, the band's panel, the door, the Licence cover and the team cover's trial with no policy
 *        and with the all-off answer; the providers, the authorize address and the loopback's readings the same
 *   mp13 each guard red under its plant, planted in memory (the plant:mp-* marks), nothing on disk changed
 */
import "./reg-stand-on.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire, register } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadPage } from "./page-stand-in.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const Module = require("node:module");
/* The pinned engine's tray, which src/waiting.mjs imports and nothing here reaches, stood in for the shell's ESM import as its
   CommonJS helpers are below, so the shell loads whether or not the engine is fetched. */
register("data:text/javascript," + encodeURIComponent('export async function resolve(spec, ctx, next) {'
  + ' if (String(spec).endsWith("engine/pinned/shell/tray.cjs")) return { url: "data:text/javascript,export const showNotification = () => {}; export const APP_IDS = {};", shortCircuit: true };'
  + ' return next(spec, ctx); }'));

let asserted = 0, failed = 0;
function check(ok, line) {
  asserted++;
  if (ok) console.log("  ok   " + line);
  else { failed++; console.log("  FAIL " + line); }
}
const parts = (o) => Object.entries(o).map(([k, v]) => k + "=" + v).join(" ");
const all = (o) => Object.values(o).every((v) => v === true);

/* ---- the code under test, loaded so a plant can load it again from text, in memory ------------------------------------- */
const TEXT = {
  reader: fs.readFileSync(path.join(ROOT, "src", "managed-policy.cjs"), "utf8"),
  client: fs.readFileSync(path.join(ROOT, "src", "licence-client.mjs"), "utf8"),
  app: fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8"),
  main: fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8"),
};
function readerFrom(text) {
  const m = new Module(path.join(ROOT, "src", "managed-policy.cjs"), null);
  m.filename = path.join(ROOT, "src", "managed-policy.cjs");
  m._compile(text, m.filename);
  return m.exports;
}
let clients = 0;
async function clientFrom(text) {
  /* Each copy is a module of its own (a comment makes its address unique), its siblings imported from the tree by absolute address. */
  const t = text.replace(/from "(\.\.?\/[^"]+)"/g, (m, rel) => 'from "' + pathToFileURL(path.join(ROOT, "src", rel)).href + '"') + "\n// copy " + (++clients) + "\n";
  return import("data:text/javascript;base64," + Buffer.from(t).toString("base64"));
}
const MP = readerFrom(TEXT.reader);
const C = await clientFrom(TEXT.client);

/* ---- fixtures ---------------------------------------------------------------------------------------------------------- */
const KEY = "HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Etiuda";
/** reg query's text of the key holding `values` ([name, type, value]), and a subkey's under it. */
function regText(values, sub) {
  const line = ([n, t, v]) => "    " + n + "    " + t + (v === undefined ? "" : "    " + v);
  return "\r\n" + KEY + "\r\n" + values.map(line).join("\r\n") + "\r\n\r\n" + (sub ? KEY + "\\Desk\r\n" + sub.map(line).join("\r\n") + "\r\n\r\n" : "");
}
const TID = "3f2a8c1e-5b7d-4e9f-a1c3-0d2e4f6a8b9c", OTHER_TID = "77777777-1111-4222-8333-944444444444";
const DOMAIN = "harbour-lamps.example";
const MSA = "9188040d-6c67-4c5b-b112-36a304b66dad";
const MS = Object.assign({}, C.SIGN_IN_PROVIDERS[0], { clientId: "11112222-3333-4444-5555-666677778888" });
const GG = Object.assign({}, C.SIGN_IN_PROVIDERS[1], { clientId: "123456789012-harbourlamps.apps.googleusercontent.com" });
const LAB = Object.freeze({ id: "lab", issuer: "http://127.0.0.1:4500", clientId: "lab-client", clientSecret: "", authorize: "http://127.0.0.1:4500/authorize",
  token: "http://127.0.0.1:4500/token", scope: "openid", refreshScope: "", extra: Object.freeze({}) });
const LIST = [MS, GG, LAB];
const NOW = Date.UTC(2026, 10, 13, 18, 0, 0);
const b64url = (s) => Buffer.from(s).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const jwt = (claims) => b64url(JSON.stringify({ alg: "RS256", typ: "JWT" })) + "." + b64url(JSON.stringify(claims)) + "." + b64url("signature");
function idToken(p, extra) {
  const iss = p.id === "microsoft" ? "https://login.microsoftonline.com/" + ((extra && extra.tid) || TID) + "/v2.0" : "https://accounts.google.com";
  return jwt(Object.assign({ iss, aud: p.clientId, exp: Math.floor(NOW / 1000) + 3600, sub: "person-a" }, p.id === "microsoft" ? { tid: TID } : {}, extra || {}));
}
const tokenRes = (tok, refresh) => ({ status: 200, bytes: Buffer.from(JSON.stringify(Object.assign({ id_token: tok }, refresh ? { refresh_token: refresh } : {}))) });
const keys = crypto.generateKeyPairSync("ed25519");
const open = { privateKey: keys.privateKey, public: keys.publicKey.export({ format: "der", type: "spki" }).subarray(-32).toString("hex") };
const CODE_A = "7K3MQ9TV2XRBHN4W", CODE_B = "D9FA4KXM7RWC3TPB";
const policy = (values) => MP.managedPolicyFrom(regText(values));
const MANAGED = [["Managed", "REG_DWORD", "0x1"]];

/* ---- mp1, the reader --------------------------------------------------------------------------------------------------- */
function readerHolds(R) {
  const p = (values, sub) => R.managedPolicyFrom(regText(values, sub));
  const none = R.managedPolicyFrom(""), other = p([["AiProvider", "REG_SZ", "openai"], ["StudioNoUpdateCheck", "REG_DWORD", "0x1"]]);
  const managed = p([["Managed", "REG_DWORD", "0x1"]]), managedSz = p([["managed", "REG_SZ", "yes"]]);
  const off = p([["Managed", "REG_DWORD", "0x0"]]), offSz = p([["Managed", "REG_SZ", "0"]]), empty = p([["Managed", "REG_SZ", ""]]);
  const shared = p([["Managed", "REG_DWORD", "0x1"], ["SharedComputer", "REG_DWORD", "0x00000001"]]);
  const personalOff = p([["AllowPersonalAccounts", "REG_DWORD", "0x0"]]), personalOn = p([["Managed", "REG_DWORD", "0x1"], ["AllowPersonalAccounts", "REG_DWORD", "0x1"]]);
  const personalEmpty = p([["Managed", "REG_DWORD", "0x1"], ["AllowPersonalAccounts", "REG_SZ", ""]]);
  const provMs = p([["SigninProvider", "REG_SZ", "  Microsoft "]]), provG = p([["SIGNINPROVIDER", "REG_EXPAND_SZ", "google"]]);
  const provBad = p([["SigninProvider", "REG_SZ", "okta"]]), provDword = p([["SigninProvider", "REG_DWORD", "0x1"]]), provEmpty = p([["SigninProvider", "REG_SZ", ""]]);
  const guid = p([["SigninTenant", "REG_SZ", TID.toUpperCase()]]), dom = p([["SigninTenant", "REG_SZ", "Harbour-Lamps.EXAMPLE"]]);
  const oneLabel = p([["SigninTenant", "REG_SZ", "harbourlamps"]]), short = p([["SigninTenant", "REG_SZ", "a.b"]]), dash = p([["SigninTenant", "REG_SZ", "-x.example"]]);
  const long = p([["SigninTenant", "REG_SZ", ("a".repeat(60) + ".").repeat(4) + "abcdefghijklm"]]), tenDword = p([["SigninTenant", "REG_DWORD", "0x1"]]);
  const clash1 = p([["SigninProvider", "REG_SZ", "google"], ["SigninTenant", "REG_SZ", TID]]), clash2 = p([["SigninProvider", "REG_SZ", "microsoft"], ["SigninTenant", "REG_SZ", DOMAIN]]);
  const agree = p([["SigninProvider", "REG_SZ", "microsoft"], ["SigninTenant", "REG_SZ", TID]]);
  const contact = p([["SupportContact", "REG_SZ", "IT desk, room 4 <b>"]]), contactLong = p([["SupportContact", "REG_SZ", "x".repeat(201)]]);
  const contactCtl = p([["SupportContact", "REG_SZ", "IT\u0007desk"]]), contactDword = p([["SupportContact", "REG_DWORD", "0x1"]]);
  const subOnly = p([], [["Managed", "REG_DWORD", "0x1"], ["SigninTenant", "REG_SZ", TID]]);
  const longOk = ("a".repeat(60) + ".").repeat(4) + "abcdefghi";
  const at253 = p([["SigninTenant", "REG_SZ", longOk]]);
  const o = {
    none: none === R.NONE && none.any === false && none.personal === true && other === R.NONE,
    managed: managed.any && managed.managed && !managed.shared && managed.personal === false && !managed.closed && managedSz.managed,
    off: off.any && !off.managed && off.personal === true && !offSz.managed && offSz.any && !empty.managed && empty.any,
    shared: shared.managed && shared.shared,
    personal: personalOff.any && personalOff.personal === false && !personalOff.managed && personalOn.personal === true && personalEmpty.personal === false,
    provider: provMs.provider === "microsoft" && !provMs.closed && provG.provider === "google" && provBad.closed && provDword.closed && provEmpty.closed && provBad.any,
    tenant: guid.tenant === TID && guid.provider === "microsoft" && !guid.closed && dom.tenant === DOMAIN && dom.provider === "google" && !dom.closed
      && oneLabel.closed && short.closed && dash.closed && long.closed && tenDword.closed && at253.tenant === longOk && !at253.closed && longOk.length === 253,
    clash: clash1.closed && clash2.closed && !agree.closed && agree.provider === "microsoft" && agree.tenant === TID,
    contact: contact.contact === "IT desk, room 4 <b>" && contact.any && contactLong === R.NONE && contactCtl === R.NONE && contactDword === R.NONE,
    subkey: subOnly === R.NONE,
  };
  return o;
}
{
  const o = readerHolds(MP);
  check(all(o), "mp1 the reader: none of the six (or only other values) is NONE; Managed and SharedComputer on for anything but empty, 0 or 0x0;"
    + " AllowPersonalAccounts unset follows Managed, 0 false; SigninProvider microsoft or google, else closed; SigninTenant a GUID or a domain"
    + " of 4 to 253, lower-cased, else closed; the two disagreeing closed; SupportContact 1 to 200 with no control character, else ignored;"
    + " a subkey's values passed over: " + parts(o));
}

/* ---- mp2, the providers offered ------------------------------------------------------------------------------------------ */
async function providersHold(K) {
  const under = (pol) => { K.setSigninPolicy(pol); try { return K.signInProviders(LIST, {}); } finally { K.setSigninPolicy(null); } };
  const none = under(null), allOff = under(MP.NONE);
  const tenant = under(policy([["SigninTenant", "REG_SZ", TID]]));
  const managed = under(policy(MANAGED));
  const personal = under(policy(MANAGED.concat([["AllowPersonalAccounts", "REG_DWORD", "0x1"]])));
  const gdom = under(policy(MANAGED.concat([["SigninTenant", "REG_SZ", DOMAIN]])));
  const named = under(policy(MANAGED.concat([["SigninProvider", "REG_SZ", "google"]])));
  const closed = under(policy(MANAGED.concat([["SigninProvider", "REG_SZ", "okta"]])));
  const clash = under(policy([["SigninProvider", "REG_SZ", "google"], ["SigninTenant", "REG_SZ", TID]]));
  const unmanagedTenant = under(policy([["SigninTenant", "REG_SZ", TID], ["Managed", "REG_DWORD", "0x0"]]));
  const ms = (l) => l.find((p) => p.id === "microsoft"), g = (l) => l.find((p) => p.id === "google");
  const fixed = (n) => Buffer.alloc(n, 7);
  K.setSigninPolicy(policy(MANAGED.concat([["SigninTenant", "REG_SZ", DOMAIN]])));
  const gReq = await K.authorizeRequest(g(gdom), 50000, open.public, fixed);
  K.setSigninPolicy(policy([["SigninTenant", "REG_SZ", TID]]));
  const msReq = await K.authorizeRequest(ms(tenant), 50000, open.public, fixed);
  K.setSigninPolicy(null);
  return {
    none: none.length === 3 && none.every((p, i) => p === LIST[i]) && allOff.length === 3 && allOff.every((p, i) => p === LIST[i]),
    tenant: tenant.length === 1 && ms(tenant).authorize === "https://login.microsoftonline.com/" + TID + "/oauth2/v2.0/authorize"
      && ms(tenant).token === "https://login.microsoftonline.com/" + TID + "/oauth2/v2.0/token" && ms(tenant).pin.tid === TID
      && msReq.url.indexOf("https://login.microsoftonline.com/" + TID + "/oauth2/v2.0/authorize?") === 0,
    work: managed.length === 2 && ms(managed).authorize.indexOf("/organizations/oauth2/") > 0 && ms(managed).token.indexOf("/organizations/oauth2/") > 0
      && ms(managed).pin.work === "microsoft" && g(managed).pin.work === "google" && !managed.some((p) => p.id === "lab"),
    personal: personal.length === 3 && personal.every((p, i) => p === LIST[i]),
    domain: gdom.length === 1 && g(gdom).pin.hd === DOMAIN && new URL(gReq.url).searchParams.get("hd") === DOMAIN && g(gdom).authorize === GG.authorize,
    named: named.length === 1 && g(named) && g(named).pin.work === "google",
    closed: closed.length === 0 && clash.length === 0,
    unmanagedPins: unmanagedTenant.length === 1 && ms(unmanagedTenant).pin.tid === TID,
    frozen: Object.isFrozen(ms(tenant)) && MS.authorize.indexOf("/common/") > 0,
  };
}
{
  const o = await providersHold(C);
  check(all(o), "mp2 the providers: none pinned (no policy, or the all-off answer, or personal accounts allowed) is the list itself; a tenant"
    + " offers Microsoft alone at the tenant's addresses; Managed alone offers both at organizations and Workspace accounts, no lab;"
    + " a domain offers Google with hd; a provider named is that one; a pin that cannot be honoured offers none: " + parts(o));
}

/* ---- mp3, the token against the pin -------------------------------------------------------------------------------------- */
function tokensHold(K) {
  const pinned = (values, id) => { K.setSigninPolicy(policy(values)); try { return K.signInProviders([MS, GG], {}).find((p) => p.id === id); } finally { K.setSigninPolicy(null); } };
  const msT = pinned([["SigninTenant", "REG_SZ", TID]], "microsoft"), msW = pinned(MANAGED, "microsoft");
  const gD = pinned([["SigninTenant", "REG_SZ", DOMAIN]], "google"), gW = pinned(MANAGED, "google");
  const read = (p, extra) => K.tokensOf(tokenRes(idToken(p, extra)), p, null, NOW);
  return {
    tenantOk: read(msT, {}).ok === true && read(msT, { tid: TID.toUpperCase() }).ok === true,
    tenantOther: read(msT, { tid: OTHER_TID }).reason === "signin-tenant",
    workOk: read(msW, {}).ok === true,
    workPersonal: read(msW, { tid: MSA }).reason === "signin-tenant",
    domainOk: read(gD, { hd: DOMAIN }).ok === true && read(gD, { hd: "Harbour-Lamps.example" }).ok === true,
    domainOther: read(gD, { hd: "other.example" }).reason === "signin-tenant" && read(gD, {}).reason === "signin-tenant",
    gWork: read(gW, { hd: "any.example" }).ok === true && read(gW, {}).reason === "signin-tenant",
    unpinned: read(MS, { tid: MSA }).ok === true && read(GG, {}).ok === true,
  };
}
{
  const o = tokensHold(C);
  check(all(o), "mp3 an ID token is held to the pin: the tenant's tid (either case), no personal Microsoft account where only work ones are taken,"
    + " the domain's hd, an hd at all where only Workspace accounts are, each else \"signin-tenant\"; unpinned, as today: " + parts(o));
}

/* ---- mp4, AADSTS50105 ---------------------------------------------------------------------------------------------------- */
async function notAssignedHolds(K) {
  const pending = await K.authorizeRequest(MS, 50000, open.public);
  const q = "?error=access_denied&error_description=" + encodeURIComponent("AADSTS50105: the signed in user is not assigned to a role") + "&state=" + pending.state;
  const under = (pol) => { K.setSigninPolicy(pol); try { return K.loopbackAnswer(q, pending).reason; } finally { K.setSigninPolicy(null); } };
  return { unset: under(null) === "signin-cancelled", pinsAlone: under(policy([["SigninTenant", "REG_SZ", TID]])) === "signin-cancelled",
    managed: under(policy(MANAGED)) === "signin-org" };
}
{
  const o = await notAssignedHolds(C);
  check(all(o), "mp4 AADSTS50105 joins the organisation's refusal (signin-org) on a managed computer alone; unset or with pins alone it reads as before: " + parts(o));
}

/* ---- mp5, a renewal the pin refuses -------------------------------------------------------------------------------------- */
async function renewHolds(K) {
  const vault = { seal: (t) => "S:" + t, unseal: (s) => String(s).slice(2) };
  const run = async (values, check, tid) => {
    K.setSigninPolicy(values ? policy(values) : null);
    try {
      const p = K.signInProviders([MS], {})[0];
      let sent = 0;
      const io = { tokenAsk: async () => tokenRes(idToken(MS, { tid }), "rt-new"), ask: async () => { sent++; return { status: 200, bytes: Buffer.from(JSON.stringify({ ok: true, me: CODE_A })) }; },
        seal: vault.seal, unseal: vault.unseal };
      const st = { by: "signin", provider: "microsoft", refreshSealed: "S:rt-old", lead: open.public };
      const r = await K.afterCheck(io, p, check, st, open, () => NOW);
      return { r, sent };
    } finally { K.setSigninPolicy(null); }
  };
  const due = { ok: true, proof: "due" }, lapsed = { ok: false, reason: "signin" };
  const dueOther = await run([["SigninTenant", "REG_SZ", TID]], due, OTHER_TID), lapsedOther = await run([["SigninTenant", "REG_SZ", TID]], lapsed, OTHER_TID);
  const dueSame = await run([["SigninTenant", "REG_SZ", TID]], due, TID), dueUnset = await run(null, due, OTHER_TID);
  const forgot = (x) => x.r.state.refreshSealed === undefined && x.r.state.signinAsk === true && x.r.answer.reason === "signin-ask" && x.sent === 0;
  return { dueForgets: forgot(dueOther), lapsedForgets: forgot(lapsedOther), sameKeeps: dueSame.r.state.refreshSealed === "S:rt-new" && dueSame.sent === 1,
    unsetToday: dueUnset.r.state.refreshSealed === "S:rt-new" && dueUnset.sent === 1 && !dueUnset.r.state.signinAsk };
}
{
  const o = await renewHolds(C);
  check(all(o), "mp5 a renewal whose token the pin refuses sends nothing to the service, forgets the refresh token and asks the lead, at a"
    + " \"due\" check as at a \"signin\" one; the tenant's own renews; unset, a renewal is today's: " + parts(o));
}

/* ---- mp6, the same account ----------------------------------------------------------------------------------------------- */
async function sameHolds(K) {
  const flow = async (pol, same, sub, me) => {
    K.setSigninPolicy(pol);
    try {
      const p = K.signInProviders([MS], {})[0];
      let sent = 0, pending = null;
      const io = {
        listen: async () => { let resolve; const caught = new Promise((r) => { resolve = r; }); pending = resolve; return { port: 50123, caught, close() {} }; },
        openPage: async (url) => { const u = new URL(url); io.nonce = u.searchParams.get("nonce"); pending("?code=c0de&state=" + encodeURIComponent(u.searchParams.get("state"))); return true; },
        tokenAsk: async () => tokenRes(idToken(MS, { sub, nonce: io.nonce }), "rt"),
        ask: async () => { sent++; return { status: 200, bytes: Buffer.from(JSON.stringify({ ok: true, me })) }; },
        seal: (t) => "S:" + t, page: () => "<p></p>",
      };
      const r = await K.signInFlow(io, p, open, () => NOW, same);
      return { r, sent };
    } finally { K.setSigninPolicy(null); }
  };
  const whoA = K.whoOf(idToken(MS, { sub: "person-a" }));
  const other = await flow(policy(MANAGED), { who: whoA, code: "" }, "person-b", CODE_B);
  const sameOne = await flow(policy(MANAGED), { who: whoA, code: "" }, "person-a", CODE_A);
  const byCode = await flow(policy(MANAGED), { who: "", code: CODE_A }, "person-b", CODE_B);
  const byCodeSame = await flow(policy(MANAGED), { who: "", code: CODE_A }, "person-b", CODE_A);
  const shared = await flow(policy(MANAGED.concat([["SharedComputer", "REG_DWORD", "0x1"]])), { who: "", code: "" }, "person-b", CODE_B);
  const unset = await flow(null, undefined, "person-b", CODE_B);
  return {
    refusedFirst: other.r.answer.reason === "signin-other" && other.sent === 0 && other.r.refreshSealed === "",
    same: sameOne.r.answer.ok === true && sameOne.r.who === whoA && sameOne.sent === 1,
    byCode: byCode.r.answer.reason === "signin-other" && byCode.r.refreshSealed === "" && byCodeSame.r.answer.ok === true,
    shared: shared.r.answer.ok === true && typeof shared.r.who === "string" && shared.r.who.length === 64,
    unsetToday: unset.r.answer.ok === true && JSON.stringify(Object.keys(unset.r).sort()) === '["admin","answer","org","refreshSealed","seed"]',
  };
}
{
  const o = await sameHolds(C);
  check(all(o), "mp6 on a managed computer a sign-in while signed in brings back the same account, by the hash kept, or is refused"
    + " \"signin-other\" before the service is asked; signed in before the policy, by the seat's code, with nothing kept; on a shared"
    + " computer anyone of the organisation; unset, the flow's answer is today's: " + parts(o));
}

/* ---- the shell, shell/main.js under a stub of Electron and of the policy's one read ----------------------------------------- */
const SCRATCH = process.env.MANAGED_LEG_SCRATCH || path.join(ROOT, "scratch", "managed-policy");
fs.mkdirSync(SCRATCH, { recursive: true });
const RUN = fs.mkdtempSync(path.join(SCRATCH, "run-"));
let shells = 0;
async function shellOn(policyText, state, mainText) {
  const ud = path.join(RUN, "profile-" + (++shells));
  fs.mkdirSync(ud, { recursive: true });
  if (state) fs.writeFileSync(path.join(ud, "licence-service.json"), JSON.stringify(state, null, 1) + "\n");
  const handlers = {}, sent = [];
  class Win {
    constructor() { this.webContents = { id: 1, on() {}, once() {}, send() {}, setWindowOpenHandler() {}, getURL: () => "", reload() {} }; }
    on() {} once() {} isDestroyed() { return false; } isMaximized() { return false; } isMinimized() { return false; }
    close() {} focus() {} restore() {} loadFile() {} show() {} showInactive() {} setMinimumSize() {}
  }
  const display = { bounds: { x: 0, y: 0, width: 1920, height: 1080 }, workAreaSize: { width: 1920, height: 1032 } };
  const electron = {
    net: { fetch: async (url) => { sent.push(String(url)); throw new Error("no network in this leg"); } },
    app: { commandLine: { appendSwitch() {}, hasSwitch: () => false, removeSwitch() {} }, getPath: () => ud, getVersion: () => "0.0.0",
      getLocale: () => "en-GB", requestSingleInstanceLock: () => true, whenReady: () => new Promise(() => {}), on() {}, quit() {}, exit() {}, isPackaged: false },
    BrowserWindow: Object.assign(Win, { fromWebContents: () => null, getAllWindows: () => [] }),
    Menu: { setApplicationMenu() {}, buildFromTemplate: () => ({ popup() {} }) }, dialog: {},
    nativeTheme: { themeSource: "system", shouldUseDarkColors: false }, clipboard: { writeText() {} },
    safeStorage: { isEncryptionAvailable: () => true, encryptString: (s) => Buffer.from(s), decryptString: (b) => String(b) },
    screen: { getAllDisplays: () => [display], getPrimaryDisplay: () => display, on() {}, removeListener() {} }, session: { defaultSession: {} },
    shell: { openExternal: async (u) => { sent.push("open " + u); }, openPath: async () => "", trashItem: async () => {} },
    ipcMain: { handle: (ch, fn) => { handlers[ch] = fn; }, on() {} },
  };
  const env = { STUDIO_TEST_OFFSCREEN: "1", STUDIO_NO_PROXY_SERVER: "off", ETIUDA_SIGNIN_PREVIEW: null };
  const was = {};
  for (const [k, v] of Object.entries(env)) { was[k] = process.env[k]; if (v === null) delete process.env[k]; else process.env[k] = v; }
  const main = path.join(ROOT, "shell", "main.js"), load = Module._load;
  /* The wire is loaded afresh with each shell, so what it sends is this shell's `sent`. */
  delete require.cache[path.join(ROOT, "src", "wire.cjs")];
  let reads = 0;
  Module._load = function (req) {
    if (req === "electron") return electron;
    if (/studio-thread\.cjs$/.test(req)) return { call: () => Promise.resolve({}) };
    /* The pinned engine's shell helpers (window, proxy, tray), which nothing here reaches: stood in, so a tree with no engine
       fetched loads its shell. */
    if (/engine[\\/]pinned[\\/]shell[\\/]/.test(req)) return new Proxy({}, { get: (t, k) => (k === "APP_IDS" ? {} : k === "windowsProxySwitches" ? () => [] : () => undefined) });
    /* The policy's one read, stood in: the real key is never asked here. */
    if (/ai-policy\.cjs$/.test(req)) return { aiPolicyText: () => { reads++; return policyText; } };
    return load.apply(this, arguments);
  };
  try {
    const m = new Module(main, null);
    m.filename = main; m.paths = Module._nodeModulePaths(path.dirname(main));
    m._compile(mainText || TEXT.main, main);
  } finally {
    Module._load = load;
    for (const [k, v] of Object.entries(was)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
  const ev = { senderFrame: { parent: null, url: pathToFileURL(path.join(ROOT, "ui", "index.html")).href }, sender: null };
  const ask = async (ch, ...a) => { if (!handlers[ch]) throw new Error("no channel " + ch); return handlers[ch](ev, ...a); };
  const stateNow = () => { try { return JSON.parse(fs.readFileSync(path.join(ud, "licence-service.json"), "utf8")); } catch { return null; } };
  return { ask, sent, stateNow, reads: () => reads };
}
const LOCKED = "Set by the organisation's IT department, so it cannot be changed here.";
/* signinAccess: the licence service asked this person for its own access token (section 11.11), cleared with the rest at sign-out. */
const OWNER_STATE = { by: "signin", provider: "microsoft", signinCode: CODE_A, signinOwner: true, signinAccess: true, checked: NOW, tried: NOW, lead: "0".repeat(64) };
async function shellHolds(mainText) {
  const managedText = regText(MANAGED), sharedText = regText(MANAGED.concat([["SharedComputer", "REG_DWORD", "0x1"]]));
  const unset = await shellOn("", OWNER_STATE, mainText), managed = await shellOn(managedText, OWNER_STATE, mainText), shared = await shellOn(sharedText, OWNER_STATE, mainText);
  const lu = await unset.ask("studio:licence"), lm = await managed.ask("studio:licence");
  const refused = (r) => !!r && r.error === LOCKED;
  /* Stage 4 (main) retired the purchase key, the purchase email and the trial's code for every Studio: the channels are not there,
     managed or not, so nothing can be sent by them (the integration of 2026-11-14; this leg asked them refused on its own branch). */
  const retired = async (s, ch) => s.ask(ch).then(() => false, (e) => String(e && e.message).indexOf("no channel ") === 0);
  const keyU = await retired(unset, "studio:licence-key"), keyM = await retired(managed, "studio:licence-key");
  const trialM = await retired(managed, "studio:licence-code"), emailM = keyU, confirmM = await retired(managed, "studio:licence-confirm");
  const seatsM = await managed.ask("studio:licence-seats"), freeM = await managed.ask("studio:licence-seat-free", CODE_B);
  const outM = await managed.ask("studio:licence-signout"), afterOutM = managed.stateNow();
  const outS = await shared.ask("studio:licence-signout"), afterOutS = shared.stateNow();
  return {
    unsetNoPolicy: !!lu && lu.error === null && !("policy" in lu) && lu.signinOwner === true,
    managedPolicy: !!lm && lm.policy && lm.policy.managed === true && lm.policy.personal === false && lm.signinOwner === false,
    keyRetired: keyU === true,
    purchaseAndTrial: keyM === true && trialM === true && emailM === true && confirmM === true,
    owner: !!seatsM && Array.isArray(seatsM.seats) && seatsM.seats.length === 0 && refused(freeM),
    signOut: refused(outM) && afterOutM && afterOutM.by === "signin" && afterOutM.signinAccess === true && outS && outS.error === null && afterOutS && afterOutS.by === undefined
      && afterOutS.signinAccess === undefined,
    nothingSent: managed.sent.length === 0 && unset.sent.length === 0,
    readOnce: managed.reads() >= 1 && managed.reads() <= 2,
  };
}
{
  /* A tree whose pinned engine is not fetched cannot load its shell at all; that is said, as a red of the machine, not passed. */
  let o = null;
  try { o = await shellHolds(); } catch (e) { o = { loads: "no (" + String(e && (e.code || e.message)).slice(0, 80) + ")" }; }
  check(all(o), "mp7 the shell: unset, the page is handed no policy and the owner is the owner; managed, the policy and no owner; a purchase key, a"
    + " purchase email, a trial's code and its confirmation refused with the locked row's sentence before anything is sent; the owner's"
    + " list empty and Free refused; Sign out refused, state kept, and on a shared computer done, the remembered access-token answer with it: " + parts(o));
}

/* ---- the page ----------------------------------------------------------------------------------------------------------- */
/* Moved for board 1017: the shell hands the page each seat by the person's pseudonym, never a code. */
const PERSON_A = "a1".repeat(32), PERSON_B = "b2".repeat(32);
const SEATS = [{ person: PERSON_A, you: true, proved: "2026-11-12" }, { person: PERSON_B, proved: "2026-11-10" }];
const SIGNED = { licence: { status: "active", trial: null, unusable: null }, grant: { until: "2026-12-20", paid: true }, by: "signin", checked: "2026-11-13",
  checkedAt: NOW, unanswered: false, keyChanged: false, keyUnread: false, signIn: ["microsoft", "google"], provider: "microsoft", signinAsk: false,
  signinCode: CODE_A, signinOwner: true, signinKeeps: true, hasKey: true, signing: { keyId: "k1", problem: null, print: "ab" }, relayTeams: [] };
const UNSIGNED = Object.assign({}, SIGNED, { licence: { status: "none", trial: null, unusable: null }, grant: null, by: null, provider: null, signinCode: null, signinOwner: false, checkedAt: null });
const pol = (values) => { const p = policy(values); return Object.assign({}, p); };
const ALL_OFF = Object.assign({}, MP.NONE);
/** Every surface this half touches, drawn on the page over `lic` (what studio:licence answers), with `f` a failed sign-in. */
async function surfaces(lic, o = {}) {
  const held = JSON.parse(JSON.stringify(lic));
  const api = { signing: () => Promise.resolve({ error: null, signing: held.signing }), licence: () => Promise.resolve(Object.assign({ error: null }, JSON.parse(JSON.stringify(held)))),
    licenceSeats: () => Promise.resolve({ error: null, seats: SEATS, counts: { lead: { held: 2, of: 3 } } }), seatNames: () => Promise.resolve({ error: null, names: {} }),
    signinDoorClose: () => Promise.resolve({ error: null, closed: true }), copy: () => Promise.resolve({ copied: true }) };
  const home = loadPage({ api, uiLang: o.lang || "en", source: o.source || TEXT.app });
  const P = home.page, get = (n) => { try { return P.__get(n); } catch { return null; } };
  P.S.host = { version: "0.1.0", tour: { offered: true }, langs: [], signing: held.signing, signIn: held.signIn, signinDoor: !!o.doorClosed };
  P.S.screen = "projects";
  await get("signInLoad")();
  if (o.fail) P.S.signFail = Object.assign({ where: "account", provider: "microsoft" }, o.fail);
  P.S.screen = "settings"; P.S.sx = { sec: "account", q: "" };
  const account = get("settingsPageHtml")();
  const pop = get("acctPopHtml")();
  P.S.screen = "projects"; P.S.signDoor = "open";
  if (o.fail) P.S.signFail = Object.assign({}, P.S.signFail, { where: "door" });
  const door = get("doorShown")() ? get("doorHtml")() : "";
  P.S.signFail = null; P.S.signDoor = null;
  P.S.cover = "licence"; P.S.err = null; P.S.licWay = o.way || "key";
  const cover = get("licenceCoverHtml")();
  P.S.cover = null;
  P.S.teamLic = Object.assign({}, held, { grant: null, licence: { status: "none" } });
  const trial = get("teamTrialWanted") ? get("teamTrialWanted")() : null;
  const menu = get("menuHtml") ? String(get("menuHtml")()) : "";
  return { account, pop, door, cover, trial, menu, P };
}
const text = (h) => String(h).replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const acts = (h) => (String(h).match(/data-act="[^"]*"(?: data-v="[^"]*")?(?: data-other)?|data-e-open="[^"]*"|data-signin-act="[^"]*"/g) || [])
  .map((a) => a.replace(/ data-v="(microsoft|google)"/, ' data-v="provider"'));
/** The account card of `s`, the identity row alone. */
const card = (h) => { const i = h.indexOf("data-signin-account"); return i < 0 ? "" : h.slice(h.lastIndexOf("<div", i), h.indexOf('<div class="sx-row"', i + 1) > 0 ? h.indexOf('<div class="sx-row"', i + 1) : undefined); };

async function pageHolds(source) {
  const M = pol(MANAGED), SH = pol(MANAGED.concat([["SharedComputer", "REG_DWORD", "0x1"]]));
  const m = await surfaces(Object.assign({}, SIGNED, { policy: M }), { source }), sh = await surfaces(Object.assign({}, SIGNED, { policy: SH }), { source });
  const u = await surfaces(SIGNED, { source }), pl = await surfaces(Object.assign({}, SIGNED, { policy: M }), { source, lang: "pl" });
  const ma = m.account, mt = text(ma);
  return {
    managedLine: /data-managed>Managed by your organisation</.test(ma) && mt.indexOf("The organisation decides who uses Etiuda Studio here, and with which account. Its IT department can change that.") >= 0,
    noSwitch: !/data-act="acct-signout"|data-other/.test(ma),
    signinRow: /data-signin-set/.test(ma) && mt.indexOf("Sign-in Microsoft · work accounts Set by your organisation") >= 0 && /data-locked/.test(ma),
    /* Moved for board 1017: old "no code in the band's panel managed, the code there unmanaged"; new: no code in it either way. */
    noCode: !/data-signin-code|data-act="lic-code-copy"/.test(ma + m.pop) && m.pop.replace(/\s+/g, "").indexOf(CODE_A) < 0 && u.pop.replace(/\s+/g, "").indexOf(CODE_A) < 0,
    seat: mt.indexOf("Seat Given to this account by your organisation. Etiuda Studio, lead seat") >= 0,
    lastChecked: /data-act="acct-check"/.test(ma),
    noOwner: !/data-lead-seats|data-act="lic-seat-free"|data-seat-name/.test(ma) && /data-lead-seats/.test(u.account),
    cover: !/data-act="lic-way"|id="licKey"|data-act="lic-key"|data-act="lic-code"|data-act="lic-confirm"/.test(m.cover)
      && !/data-act="lic-way"|id="licKey"|data-act="lic-key"/.test(u.cover) && u.cover.length > 0
      && /data-act="lic-check"/.test(m.cover),
    trial: m.trial === null,
    shared: /data-act="acct-signout"/.test(sh.account) && /data-other/.test(sh.account)
      && text(sh.account).indexOf("A shared computer: another person may sign in here, with an account of the organisation.") >= 0,
    polish: text(pl.account).indexOf("Zarządzane przez organizację") >= 0 && text(pl.account).indexOf("Ustawione przez organizację") >= 0
      && text(pl.account).indexOf("Organizacja decyduje, kto korzysta tu z Etiudy Studio i jakim kontem. Zmienić to może jej dział IT.") >= 0
      && text(pl.account).indexOf("Przydzielone temu kontu przez organizację.") >= 0,
  };
}
{
  const o = await pageHolds();
  check(all(o), "mp8 the page under Managed: the identity card's managed line and who decides, no Use another account or Sign out; Sign-in"
    + " in place of the code, locked; the seat given by the organisation; Last checked; no code in the band's panel; no owner's seats;"
    + " the Licence cover with no way to activate, buy or try; no team trial; on a shared computer the two acts back; Polish: " + parts(o));
}

/* ---- mp9, M1 ------------------------------------------------------------------------------------------------------------- */
const REFUSED_EN = "Your organisation has not given this account access to Etiuda. Its IT department can: asking them to assign the account is enough. Try again";
const REFUSED_PL = "Organizacja nie przyznała temu kontu dostępu do Etiudy. Może to zrobić jej dział IT: wystarczy poprosić o przypisanie konta. Spróbuj ponownie";
async function m1Holds(source) {
  const M = pol(MANAGED), MC = pol(MANAGED.concat([["SupportContact", "REG_SZ", "IT desk, room 4 <b>"]]));
  const lic = (p) => Object.assign({}, UNSIGNED, { policy: p });
  const org = await surfaces(lic(M), { source, fail: { why: "signin-org" } }), ten = await surfaces(lic(M), { source, fail: { why: "signin-tenant" } });
  const con = await surfaces(lic(MC), { source, fail: { why: "signin-org" } }), pl = await surfaces(lic(M), { source, lang: "pl", fail: { why: "signin-org" } });
  const role = await surfaces(lic(M), { source, fail: { why: "signin-no-licence" } });
  const un = await surfaces(UNSIGNED, { source, fail: { why: "signin-org" } });
  const only = (h) => JSON.stringify(acts(card(h))) === JSON.stringify(['data-act="lic-signin" data-v="provider"']);
  const bare = (h) => !/si-provs|data-signin-code|trial|Trial|[Bb]uy|purchase|another account|personal/.test(card(h));
  return {
    exact: text(card(org.account)) === REFUSED_EN && text(card(ten.account)) === REFUSED_EN,
    one: only(org.account) && only(ten.account) && only(con.account) && only(role.account),
    nothingElse: bare(org.account) && bare(con.account) && bare(role.account),
    contact: text(card(con.account)) === "Your organisation has not given this account access to Etiuda. To ask for access: IT desk, room 4 <b>. Try again"
      && card(con.account).indexOf("&lt;b&gt;") >= 0 && card(con.account).indexOf("<b>.") < 0,
    polish: text(card(pl.account)) === REFUSED_PL,
    noRole: text(card(role.account)) === "This account has no Etiuda role in its organisation, so it holds no seat. Its IT department assigns the roles. Try again",
    door: org.door.indexOf("Use another account") < 0 && /data-act="lic-signin"/.test(org.door) && un.door.indexOf("Use another account") >= 0,
    unmanagedToday: text(card(un.account)).indexOf("another account can be used meanwhile") >= 0,
  };
}
{
  const o = await m1Holds();
  check(all(o), "mp9 M1, managed and not assigned (the organisation's refusal, the pin's, or no role): Account's card is exactly the refusal's"
    + " sentence and the IT default or SupportContact's line, escaped, and one Try again, with no provider list, code, trial, purchase or"
    + " other account; the door offers Try again, not another account; Polish; unmanaged, today's words: " + parts(o));
}

/* ---- mp10, M2: the reachable acts ----------------------------------------------------------------------------------------- */
/* Moved for board 1017: the code's Copy is gone from every Studio, so it is no longer among the acts managed takes away; the owner's Free names the
   seat by pseudonym. */
const ACCOUNT_ACTS = ['data-act="lic-signin" data-v="provider" data-other', 'data-act="acct-signout"', 'data-act="lic-seat-free" data-v="' + PERSON_B + '"']; /* team-trial retired in S-3 */
async function m2Holds(source) {
  const set = (s) => { const out = new Map(); for (const a of acts(s.account + s.pop + s.cover + s.door + s.menu).concat(s.trial ? ["team-trial"] : [])) out.set(a, (out.get(a) || 0) + 1); return out; };
  const u = set(await surfaces(SIGNED, { source })), m = set(await surfaces(Object.assign({}, SIGNED, { policy: pol(MANAGED) }), { source }));
  const gone = [...u.keys()].filter((k) => !m.has(k)).sort(), added = [...m.keys()].filter((k) => !u.has(k));
  const recount = [...m.keys()].filter((k) => u.has(k) && u.get(k) !== m.get(k));
  return { gone: JSON.stringify(gone) === JSON.stringify(ACCOUNT_ACTS.slice().sort()), added: added.length === 0, recount: recount.length === 0,
    said: "gone:" + gone.join("|") + " added:" + added.join("|") + " recount:" + recount.join("|") };
}
{
  const o = await m2Holds();
  check(o.gone && o.added && o.recount, "mp10 M2, one profile managed and unmanaged: the acts reachable (Account, the band's panel, the Licence cover, the door,"
    + " the Menu and the team cover's trial) differ by exactly the account acts (another account, Sign out, the code's Copy, the owner's"
    + " Free, the licence's three ways and Activate, the team's trial) and nothing else: " + o.said);
}

/* ---- mp11, M3: no personal path, no trial ---------------------------------------------------------------------------------- */
async function m3Holds(source, K) {
  const offered = (values) => { K.setSigninPolicy(policy(values)); try { return K.signInProviders([MS, GG], {}); } finally { K.setSigninPolicy(null); } };
  const unsetList = offered(MANAGED), setList = offered(MANAGED.concat([["AllowPersonalAccounts", "REG_DWORD", "0x1"]]));
  const unsetPage = await surfaces(Object.assign({}, UNSIGNED, { policy: pol(MANAGED) }), { source });
  const setPage = await surfaces(Object.assign({}, UNSIGNED, { policy: pol(MANAGED.concat([["AllowPersonalAccounts", "REG_DWORD", "0x1"]])) }), { source });
  const personalWords = /personal|osobiste/;
  return {
    unsetPinned: unsetList.length === 2 && unsetList.every((p) => p.pin && p.authorize.indexOf("/common/") < 0),
    unsetPage: !personalWords.test(text(unsetPage.account + unsetPage.door)) && /data-signin-work/.test(unsetPage.account),
    unsetNoTrial: unsetPage.trial === null && !/data-act="lic-way"/.test(unsetPage.cover),
    setPersonal: setList.length === 2 && setList.every((p) => !p.pin) && setList[0].authorize.indexOf("/common/") > 0 && personalWords.test(text(setPage.account)),
    setNoTrial: setPage.trial === null && !/data-act="lic-way"/.test(setPage.cover),
  };
}
{
  const o = await m3Holds(undefined, C);
  check(all(o), "mp11 M3, managed with AllowPersonalAccounts unset: every provider pinned to work accounts, no common address, no personal"
    + " account named, no trial or licence way; set, the personal path is reachable (common, the caption naming it) and the trial still is not: " + parts(o));
}

/* ---- mp12, unset is today's, byte for byte ---------------------------------------------------------------------------------- */
async function sameBytes(source) {
  const states = [[SIGNED, {}], [UNSIGNED, {}], [Object.assign({}, SIGNED, { signinAsk: true }), {}], [UNSIGNED, { fail: { why: "signin-org" } }],
    [UNSIGNED, { fail: { why: "signin-no-licence" } }], [Object.assign({}, SIGNED, { signinOwner: false }), { way: "trial" }], [UNSIGNED, { way: "email" }]];
  const diff = [];
  for (const [i, [lic, o]] of states.entries()) {
    for (const lang of ["en", "pl"]) {
      const a = await surfaces(lic, Object.assign({ source, lang }, o)), b = await surfaces(Object.assign({}, lic, { policy: ALL_OFF }), Object.assign({ source, lang }, o));
      for (const k of ["account", "pop", "door", "cover", "trial", "menu"]) if (a[k] !== b[k]) diff.push(i + lang + ":" + k);
    }
  }
  return diff;
}
{
  const diff = await sameBytes();
  const K = C;
  K.setSigninPolicy(MP.NONE);
  const fixed = (n) => Buffer.alloc(n, 9);
  const withNone = (await K.authorizeRequest(K.signInProviders([MS, GG], {})[0], 50000, open.public, fixed)).url;
  K.setSigninPolicy(null);
  const without = (await K.authorizeRequest(K.signInProviders([MS, GG], {})[0], 50000, open.public, fixed)).url;
  check(diff.length === 0 && withNone === without && withNone.indexOf("https://login.microsoftonline.com/common/oauth2/v2.0/authorize?") === 0,
    "mp12 unset is today's byte for byte: seven states in English and Polish, the Account, the band's panel, the door, the Licence cover,"
    + " the Menu and the team's trial, with no policy and with the all-off answer; the authorize address at common: differing " + JSON.stringify(diff));
}

/* ---- mp14, the organisation named where the signed licence names it; mp15, the landing offers no other account when managed ---- */
async function namedHolds(source) {
  const M = pol(MANAGED.concat([["SigninTenant", "REG_SZ", "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"]]));
  const lic = Object.assign({}, SIGNED, { licence: Object.assign({}, SIGNED.licence, { org: "Example Org" }), policy: M });
  const en = await surfaces(lic, { source }), pl = await surfaces(lic, { source, lang: "pl" });
  const t = text(en.account), p = text(pl.account);
  /* The three states of the Sign-in row: the tenant's (above, named), any work account (no tenant, personal off), or those allowed. */
  const unnamed = text((await surfaces(Object.assign({}, SIGNED, { policy: M }), { source })).account);
  const allowed = text((await surfaces(Object.assign({}, SIGNED, { policy: pol(MANAGED.concat([["AllowPersonalAccounts", "REG_DWORD", "0x1"]])) }), { source })).account);
  const work = text((await surfaces(Object.assign({}, SIGNED, { policy: pol(MANAGED) }), { source })).account);
  return {
    unnamedRow: unnamed.indexOf("Sign-in Microsoft · work accounts of the organisation Set by your organisation") >= 0,
    workRow: work.indexOf("Sign-in Microsoft · work accounts Set by your organisation") >= 0,
    allowedRow: allowed.indexOf("Sign-in Microsoft · accounts the organisation allows Set by your organisation") >= 0,
    noCatalogLine: !/catalog it has|katalogiem, który ma|katalogu, który już ma/.test(t + p),
    who: t.indexOf("Example Org decides who uses Etiuda Studio here, and with which account. Its IT department can change that.") >= 0,
    row: t.indexOf("Sign-in Microsoft · work accounts of Example Org Set by your organisation") >= 0,
    polish: p.indexOf("Organizacja Example Org decyduje, kto korzysta tu z Etiudy Studio i jakim kontem.") >= 0,
  };
}
{
  const o = await namedHolds();
  check(all(o), "mp14 the organisation named where its signed licence names it: who decides and the Sign-in row, in English and Polish: " + parts(o));
}
function landHolds(mainText) {
  const at = mainText.indexOf("\nfunction signInLanding("), end = mainText.indexOf("\n}\n", at);
  if (at < 0 || end < 0) return { sliced: false };
  const land = new Function(mainText.slice(at, end + 3) + "\nreturn signInLanding;")();
  const no = (reason) => ({ ok: false, reason });
  return { sliced: true, unmanaged: land(no("signin-org")) === "org" && land(no("signin-cancelled")) === "cancelled",
    managed: land(no("signin-org"), true) === "appfail" && land(no("signin-tenant"), true) === "appfail" && land(no("signin-cancelled"), true) === "cancelled" };
}
{
  const o = landHolds(TEXT.main);
  check(all(o), "mp15 the browser's landing offers another account only off a managed computer; a Cancel is a Cancel either way: " + parts(o));
}

/* ---- mp13, each guard red under its plant --------------------------------------------------------------------------------- */
/** `text` with the line holding plant:`tag` changed from `from` to `to`, or null where the mark or `from` is not there once. */
function planted(textIn, tag, from, to) {
  const lines = textIn.split("\n"), at = lines.findIndex((l) => l.indexOf("plant:" + tag + " ") >= 0 || l.endsWith("plant:" + tag + " */"));
  if (at < 0 || lines.filter((l) => l.indexOf("plant:" + tag + " ") >= 0).length !== 1 || lines[at].split(from).length !== 2) return null;
  lines[at] = lines[at].replace(from, to);
  return lines.join("\n");
}
/** The same for a substring anywhere, where no mark stands (M2's plant drops an act that is not the account's). */
function plantedAt(textIn, from, to) { return textIn.split(from).length === 2 ? textIn.replace(from, to) : null; }
const PLANTS = [
  /* the reader */
  ["reader", "mp-own", "own ?", "true ?", async (t) => all(readerHolds(readerFrom(t)))],
  ["reader", "mp-managed", "!offValue(raw.managed.value)", "true", async (t) => all(readerHolds(readerFrom(t)))],
  ["reader", "mp-personal", ": !managed", ": true", async (t) => all(readerHolds(readerFrom(t)))],
  ["reader", "mp-provider", 'v === "google")', 'v === "google" || v === "okta")', async (t) => all(readerHolds(readerFrom(t)))],
  ["reader", "mp-tenant", "if (kind)", "if (kind || v)", async (t) => all(readerHolds(readerFrom(t)))],
  ["reader", "mp-contact", "n <= CONTACT_MAX", "n <= 1000", async (t) => all(readerHolds(readerFrom(t)))],
  ["reader", "mp-closed", " || (!!provider && !!tenant && kind !== provider)", "", async (t) => all(readerHolds(readerFrom(t)))],
  /* the client */
  ["client", "mp-closed-offers", "return [];", "return list;", async (t) => all(await providersHold(await clientFrom(t)))],
  ["client", "mp-pinned-list", "p.id === pol.provider", "true", async (t) => all(await providersHold(await clientFrom(t)))],
  ["client", "mp-ms-seg", '(msTenant || "organizations")', '"common"', async (t) => all(await providersHold(await clientFrom(t)))],
  ["client", "mp-tid", "!== pin.tid", "=== pin.tid.toUpperCase()", async (t) => all(tokensHold(await clientFrom(t)))],
  ["client", "mp-hd", "!== pin.hd", "=== pin.hd.toUpperCase()", async (t) => all(tokensHold(await clientFrom(t)))],
  ["client", "mp-work-g", 'return !(typeof c.hd === "string" && c.hd !== "")', "return false", async (t) => all(tokensHold(await clientFrom(t)))],
  ["client", "mp-work-ms", "=== managedPolicy.MSA_TENANT", '=== "none"', async (t) => all(tokensHold(await clientFrom(t)))],
  ["client", "mp-pin-checked", "provider.pin && pinRefuses", "false && pinRefuses", async (t) => all(tokensHold(await clientFrom(t)))],
  ["client", "mp-50105", "managedHere() && ", "false && ", async (t) => all(await notAssignedHolds(await clientFrom(t)))],
  ["client", "mp-renew-forget", 'r.answer.reason === "signin-tenant"', 'r.answer.reason === "never"', async (t) => all(await renewHolds(await clientFrom(t)))],
  ["client", "mp-same", "who !== same.who", "false", async (t) => all(await sameHolds(await clientFrom(t)))],
  ["client", "mp-same-code", "answer.me !== same.code", "false", async (t) => all(await sameHolds(await clientFrom(t)))],
  /* the shell */
  ["main", "mp-owner", " && !managedHere()", "", async (t) => all(await shellHolds(t))],
  ["main", "mp-refuse", "if (managedHere())", "if (false)", async (t) => all(await shellHolds(t))],
  /* section 11.11: the remembered "access-token" answer left behind at sign-out */
  ["main", "ma-signout", ', "signinAccess"]', "]", async (t) => all(await shellHolds(t))],
  /* the page */
  ["app", "mp-page-owner", " && !managedOn()", "", async (t) => all(await pageHolds(t))],
  ["app", "mp-acts", "managed && !sharedOn()", "false", async (t) => all(await pageHolds(t))],
  /* M1: Buy left drawn on the refused card */
  ["app", "mp-m1", '"</button></div>", true);', '"</button><button class=\\"btn sm\\" data-act=\\"buy\\">Buy</button></div>", true);', async (t) => all(await m1Holds(t))],
  /* the organisation named, and the landing */
  ["app", "mp-org", 'typeof l.org === "string"', "false", async (t) => all(await namedHolds(t))],
  ["app", "mp-held-to", 'p.personal === false ?', "false ?", async (t) => all(await namedHolds(t))],
  ["main", "mp-land", 'if (managed === true && why !== "signin-cancelled")', "if (false)", async (t) => all(landHolds(t))],
  /* M3: the personal option drawn when unset */
  ["app", "mp-personal-drawn", "if (workOnly())", "if (false)", async (t) => all(await m3Holds(t, C))],
];
/* Under ETIUDA_PLANTS=off the plants are not run, as every inline plant proof here (tests/plant-hold.mjs pk-off). */
if (process.env.ETIUDA_PLANTS === "off") check(true, "mp13 each guard red under its plant (ETIUDA_PLANTS=off, not run)");
else {
  const results = {};
  for (const [file, tag, from, to, holds] of PLANTS) {
    const t = planted(TEXT[file], tag, from, to);
    if (t === null) { results[tag] = "anchor"; continue; }
    let held = null;
    try { held = await holds(t); } catch (e) { held = "threw:" + String(e && e.message).slice(0, 80); }
    results[tag] = held === false ? "red" : String(held);
  }
  /* M2: one act that is not the account's dropped under Managed (Check now), with no mark of its own. */
  const m2t = plantedAt(TEXT.app, "\n      + '<button class=\"btn sm\" data-act=\"acct-check\">'", "\n      + (managedOn() ? \"\" : '<button class=\"btn sm\" data-act=\"acct-check\">')");
  const m2 = m2t ? await m2Holds(m2t) : null;
  results["m2-acct-check"] = !m2 ? "anchor" : m2.gone && m2.added && m2.recount ? "held" : "red";
  const disk = ["src/managed-policy.cjs", "src/licence-client.mjs", "ui/app.js", "shell/main.js"].every((f) => fs.readFileSync(path.join(ROOT, f), "utf8")
    === TEXT[{ "src/managed-policy.cjs": "reader", "src/licence-client.mjs": "client", "ui/app.js": "app", "shell/main.js": "main" }[f]]);
  check(Object.values(results).every((v) => v === "red") && disk, "mp13 each guard red under its plant, in memory, nothing on disk changed (" + disk + "): " + parts(results));
}

console.log("managed-policy: " + (asserted - failed) + " of " + asserted + " checks held");
if (!process.env.MANAGED_LEG_SCRATCH) { try { fs.rmSync(RUN, { recursive: true, force: true }); } catch { /* left for the next run */ } }
process.exit(Math.min(failed, 63));
