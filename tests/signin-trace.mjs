/* THE SIGN-IN TRACE AND THE DECLINED CONSENT IN STUDIO (board 980, before the first real sign-ins at Microsoft and Google).
 *
 *     node tests/signin-trace.mjs        exit code is the number of failed checks, capped at 63
 *
 * gate-kind: node
 *
 * THE CRITERION: when a real sign-in fails, the cause is visible at once to the person at the computer and the right screen is
 * shown; nothing changes in what is sent. Under ETIUDA_SIGNIN_TRACE=1 alone, read once at the shell's start, each step writes one
 * line to Studio's standard error: the provider's own error, error_description and error_codes, the service's status and reason,
 * and the reason shown, never a code, verifier, secret or token; without it nothing is written anywhere. AADSTS65004, the person
 * declining the consent page, is their own Cancel, not the organisation's refusal.
 *
 * NOTHING HERE REACHES A PROVIDER, OPENS A BROWSER OR STARTS STUDIO: the loopback, the browser, the token door and the service are
 * stood in, and the shell's signInIo is sliced from shell/main.js and evaluated with stand-ins.
 *
 *   st1  off unless asked: ETIUDA_SIGNIN_TRACE absent, "0", "yes" or " 1" gives signInIo no trace, and a refused sign-in writes
 *        nothing to the console or either stream; "1" writes one line to standard error
 *   st2  a refusal at the loopback traces its error and error_description with the reason shown; a stray state traces nothing of
 *        the reply
 *   st3  the token door's refusal traces status, error, error_description and error_codes, never the code, the verifier, the
 *        secret, a token or a JWT, even where the description repeats them; a refused ID token names its claims; a success says
 *        whether a refresh token came, and the service's answer is traced with its status and reason
 *        (st3 also holds that the person's own sign-in code, which the service's no-licence answer carries, is in no trace line)
 *   st4  the quiet renewal traces the provider's refusal with the refresh token and the secret hidden, a failed connection's
 *        message, and on success whether the new ID token carries a nonce
 *   st5  AADSTS65004 at the loopback is signin-cancelled whatever error stands beside it; 65001, 90094 and consent_required stay
 *        signin-org
 *
 * Planted faults, each in a scratch copy (tests/plant-copy.mjs), run with SIGNIN_TRACE_ONLY=<leg>; ETIUDA_PLANTS=off skips them.
 */
process.removeAllListeners("warning");
process.on("warning", () => {});

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { copyPlants } from "./plant-copy.mjs";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const ONLY = process.env.SIGNIN_TRACE_ONLY || "";
const EXPECTED = 5 + 7 + 1;
const C = await import(pathToFileURL(path.join(ROOT, "src", "licence-client.mjs")).href);
const MAIN = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
const NL = String.fromCharCode(10);

let asserted = 0, failed = 0;
function check(id, ok, line) {
  if (ONLY && id !== ONLY) return;
  asserted++;
  if (ok) console.log("  ok   " + line);
  else { failed++; console.log("  FAIL " + line); }
}
function skip(line) {
  if (ONLY) return;
  asserted++;
  console.log("  SKIP " + line);
}
async function leg(id, line, fn) {
  if (ONLY && id !== ONLY) return;
  let got = null;
  try { got = await fn(); } catch (e) { got = { ok: false, said: "threw: " + String(e && e.message || e).slice(0, 300) }; }
  check(id, !!got && got.ok === true, id + " " + line + (got && got.said ? ": " + got.said : ""));
}

/* ---- the stand-ins ------------------------------------------------------------------------------------------------------ */
const b64url = (s) => Buffer.from(s).toString("base64").replace(/[+]/g, "-").replace(/[/]/g, "_").replace(/=+$/, "");
const jwt = (claims) => b64url(JSON.stringify({ alg: "RS256", kid: "k1", typ: "JWT" })) + "." + b64url(JSON.stringify(claims)) + "." + b64url("signature");
const NOW = Date.UTC(2026, 10, 12, 19, 0, 0);
const STAND_IN = "stand-in-not-a-secret";
const GG = Object.assign({}, C.SIGN_IN_PROVIDERS[1], { clientId: "123456789012-harbourlamps.apps.googleusercontent.com", clientSecret: STAND_IN });
const keys = crypto.generateKeyPairSync("ed25519");
const open = { privateKey: keys.privateKey, public: keys.publicKey.export({ format: "der", type: "spki" }).subarray(-32).toString("hex") };
const gClaims = (nonce) => ({ iss: "https://accounts.google.com", aud: GG.clientId, sub: "1001", iat: NOW / 1000, exp: NOW / 1000 + 3600, nonce });
const answer = (obj, status) => ({ status: status || 200, bytes: Buffer.from(JSON.stringify(obj)) });
const T_CODE = "code-planted-" + "4".repeat(24), T_RT = "rt-planted-" + "5".repeat(24), T_AT = "at-planted-" + "6".repeat(24);

/* One sign-in at Google with a secret: the loopback brings `loopQ(state)`, the token door answers `reply(seen)`, the service
   `serve()`; `withTrace` records the trace's lines. */
async function flow(loopQ, reply, withTrace, serve) {
  const lines = [], seen = {};
  const io = {
    listen: async () => { let yes; const caught = new Promise((a) => { yes = a; }); setTimeout(() => yes(seen.q), 5); return { port: 49999, caught, close: () => {} }; },
    openPage: async (url) => { const q = new URL(url).searchParams; seen.state = q.get("state"); seen.nonce = q.get("nonce"); seen.q = loopQ(seen.state); return true; },
    tokenAsk: async (url, form) => { seen.form = new URLSearchParams(form.toString()); return reply(seen); },
    ask: async () => (serve ? serve() : answer({ ok: false, reason: "no-licence", said: "planted" }, 403)),
    seal: (t) => (t ? "sealed" : ""),
    page: () => "",
  };
  if (withTrace) io.trace = (line) => { lines.push(line); };
  const r = await C.signInFlow(io, GG, open, () => NOW);
  return { r, lines, seen };
}
const okLoop = (st) => "?state=" + encodeURIComponent(st) + "&code=" + T_CODE;
const hidesAll = (line, seen, extra) => [T_CODE, T_RT, T_AT, STAND_IN, seen.form ? seen.form.get("code_verifier") : "no-form"].concat(extra || [])
  .every((v) => line.indexOf(v) < 0) && line.indexOf("eyJ") < 0;
async function consoleDuring(fn) {
  const lines = [], keep = {}, writes = { o: process.stdout.write, e: process.stderr.write };
  for (const k of ["log", "error", "warn", "info", "debug"]) { keep[k] = console[k]; console[k] = (...a) => { lines.push(a.map(String).join(" ")); }; }
  process.stdout.write = (c) => { lines.push(String(c)); return true; };
  process.stderr.write = (c) => { lines.push(String(c)); return true; };
  try { await fn(); } finally {
    for (const k of Object.keys(keep)) console[k] = keep[k];
    process.stdout.write = writes.o; process.stderr.write = writes.e;
  }
  return lines;
}
/* The shell's switch and signInIo, sliced and evaluated under `env`, its standard error recorded. */
async function shellIo(env) {
  const lineAt = MAIN.indexOf(NL + "const SIGNIN_TRACE_ASKED =");
  const constLine = lineAt < 0 ? "" : MAIN.slice(lineAt + 1, MAIN.indexOf(NL, lineAt + 1));
  const at = MAIN.indexOf(NL + "async function signInIo(sender) {");
  if (!constLine || at < 0) throw new Error("the switch or signInIo is not in shell/main.js");
  const text = MAIN.slice(at + 1, MAIN.indexOf(NL + "}" + NL, at + 1) + 2);
  const lines = [];
  const proc = { env, stderr: { write: (c) => { lines.push(String(c)); return true; } } };
  const no = () => { throw new Error("not in this leg"); };
  const make = new Function("process", "licenceClient", "wire", "vault", "signInLinkTo", "openSignInPage", "signInPage",
    constLine + NL + text + NL + "return signInIo;");
  const signInIo = make(proc, async () => ({ sealRefresh: no }), { identityListen: no, identityRequest: no, licenceRequest: no }, {}, no, no, no);
  return { io: await signInIo(null), lines };
}

/* ---- the legs ----------------------------------------------------------------------------------------------------------- */
await leg("st1", "the trace is off unless ETIUDA_SIGNIN_TRACE is \"1\": otherwise signInIo carries none and a refused sign-in writes nothing to the console or either stream; on, one line to standard error", async () => {
  const seen = [];
  for (const v of [undefined, "0", "yes", " 1", "1"]) {
    const s = await shellIo(v === undefined ? {} : { ETIUDA_SIGNIN_TRACE: v });
    if (typeof s.io.trace === "function") s.io.trace("probe");
    seen.push(s.lines.length);
  }
  const refuse = () => answer({ error: "invalid_client", error_description: "AADSTS7000218: planted" }, 401);
  let quiet = null, loud = null;
  const writtenQuiet = await consoleDuring(async () => { quiet = await flow(okLoop, refuse, false); });
  const writtenLoud = await consoleDuring(async () => { loud = await flow(okLoop, refuse, true); });
  const clauses = {
    seen: seen.join() === "0,0,0,0,1",
    quietReason: quiet.r.answer.reason === "signin-refused",
    quietWrote: writtenQuiet.length === 0,
    loudReason: loud.r.answer.reason === "signin-refused",
    loudLines: loud.lines.length === 1,
    loudWrote: writtenLoud.length === 0,
  };
  return { ok: Object.values(clauses).every(Boolean),
    said: "lines " + seen.join() + ", quiet wrote " + writtenQuiet.length + ", traced " + (loud ? loud.lines.length : "?")
      + ", clauses " + Object.entries(clauses).map(([k, v]) => k + "=" + v).join(" ")
      + ", quiet reason " + quiet.r.answer.reason + ", loud reason " + loud.r.answer.reason
      + ", writtenLoud " + JSON.stringify(writtenLoud.join("|").slice(0, 200))
      + ", writtenQuiet " + JSON.stringify(writtenQuiet.join("|").slice(0, 200)) };
});

await leg("st2", "a refusal at the loopback traces its error and error_description with the reason shown; a stray state traces nothing of the reply", async () => {
  const q = (e, d) => (st) => "?state=" + encodeURIComponent(st) + "&error=" + e + "&error_description=" + encodeURIComponent(d);
  const declined = await flow(q("access_denied", "AADSTS65004: User declined to consent to access the app. Trace ID: t-1"), () => answer({}), true);
  const reply = await flow(q("invalid_request", "AADSTS50011: The redirect URI does not match"), () => answer({}), true);
  const l1 = declined.lines[0] || "", l2 = reply.lines[0] || "";
  /* A stray reply never ends the wait (loopbackEnds), so the trace's handling of one is read where the flow would reach it. */
  const strayBack = C.loopbackAnswer("?state=another&error=access_denied&error_description=AADSTS65004", { state: "mine-0123456789" });
  const stray = C.traceLine("google", "authorize", strayBack.reason, {}, []);
  return { ok: declined.r.answer.reason === "signin-cancelled" && declined.lines.length === 1 && l1.indexOf("authorize: signin-cancelled") > 0
    && l1.indexOf("error=access_denied") > 0 && l1.indexOf("AADSTS65004: User declined") > 0
    && reply.r.answer.reason === "signin-refused" && l2.indexOf("error=invalid_request") > 0 && l2.indexOf("AADSTS50011") > 0
    && stray === "studio  sign-in google authorize: signin-state", said: [l1, l2, stray].join(" / ").slice(0, 400) };
});

await leg("st3", "the token door's refusal traces status, error, error_description and error_codes and hides the code, verifier, secret, every token and any JWT, even echoed; a refused ID token names its claims; a success says whether a refresh token came; the service's answer is traced", async () => {
  const loose = jwt({ planted: "a JWT standing alone" });
  const refuse = (seen) => answer({ error: "invalid_client", error_codes: [7000218], trace_id: "t-2",
    error_description: "AADSTS7000218: The request body must contain client_secret. Echo " + T_CODE + " " + seen.form.get("code_verifier") + " "
      + STAND_IN + " " + T_RT + " " + T_AT + " " + loose, id_token: jwt(gClaims(seen.nonce)), refresh_token: T_RT, access_token: T_AT }, 401);
  const bad = await flow(okLoop, refuse, true);
  /* The service's no-licence answer carries the person's own sign-in code (aaedb9d1): it reaches no trace line, and (moved for board 1017: old
     "it reaches the person's screen") no screen either, the client keeping none of it. */
  const ME = "7K3M9QX2RT8VW4ZA";
  const good = await flow(okLoop, (seen) => answer({ id_token: jwt(gClaims(seen.nonce)), refresh_token: T_RT, access_token: T_AT }), true,
    () => answer({ ok: false, reason: "no-licence", said: "planted", me: ME }, 403));
  const meGrouped = ME.replace(/(.{4})(?=.)/g, "$1 ");
  const none = await flow(okLoop, (seen) => answer({ id_token: jwt(gClaims(seen.nonce)) }), true,
    () => answer({ ok: true, me: "7K3M9QX2RT8VW4ZA", owner: true }));
  const aud = await flow(okLoop, (seen) => answer({ id_token: jwt(Object.assign(gClaims(seen.nonce), { aud: "someone-else-0000" })), refresh_token: T_RT }), true);
  const lb = bad.lines[0] || "", [lg, lgs] = good.lines, [ln, lns] = none.lines, la = aud.lines[0] || "";
  return { ok: bad.r.answer.reason === "signin-refused" && bad.lines.length === 1 && lb.indexOf("token: signin-refused") > 0 && lb.indexOf("status=401") > 0
    && lb.indexOf("error=invalid_client") > 0 && lb.indexOf("AADSTS7000218: The request body") > 0 && lb.indexOf("error_codes=7000218") > 0
    && hidesAll(lb, bad.seen, [loose]) && (lb.match(/\[hidden\]/g) || []).length >= 6
    && good.lines.length === 2 && /token: ok [|] status=200 [|] detail=refresh token given$/.test(lg) && hidesAll(lg, good.seen)
    && /service: signin-no-licence [|] status=403 [|] reason=signin-no-licence [|] detail=planted$/.test(lgs) && hidesAll(lgs, good.seen)
    /* The refusal carries the code for Buy alone (board 1020, src/buy-path.cjs noLicenceKept; moved: old "the client keeping none of it"); no trace line holds it. */
    && good.r.answer.me === ME && good.lines.every((l) => l.indexOf(ME) < 0 && l.indexOf(meGrouped) < 0)
    && /detail=refresh token none$/.test(ln) && /service: ok [|] detail=signed in$/.test(lns)
    && aud.r.answer.reason === "signin-token" && la.indexOf("aud someone-else-0000") > 0 && la.indexOf("nonce this sign-in's") > 0 && hidesAll(la, aud.seen),
    said: [lb, lg, lgs, ln, lns, la].map((l) => String(l).slice(0, 160)).join(" / ") };
});

await leg("st4", "the quiet renewal traces the provider's refusal with the refresh token and the secret hidden, a failed connection's message, and on success whether the new ID token carries a nonce", async () => {
  const lines = [];
  const io = (tokenAsk) => ({ tokenAsk, ask: async () => answer({ ok: true }), seal: () => "sealed2", unseal: () => T_RT, trace: (l) => { lines.push(l); } });
  const expired = await C.renewSignIn(io(async () => answer({ error: "invalid_grant", error_description: "Token has been expired or revoked. " + T_RT + " " + STAND_IN }, 400)),
    GG, open, "sealed", () => NOW);
  const off = await C.renewSignIn(io(async () => { throw new Error("net::ERR_PROXY_CONNECTION_FAILED"); }), GG, open, "sealed", () => NOW);
  const renewed = await C.renewSignIn(io(async () => answer({ id_token: jwt(gClaims(undefined)) })), GG, open, "sealed", () => NOW);
  const [le, lo, lr, ls] = lines;
  return { ok: lines.length === 4 && expired.answer.reason === "signin-ask" && le.indexOf("refresh: signin-expired") > 0 && le.indexOf("error=invalid_grant") > 0
    && le.indexOf("Token has been expired or revoked") > 0 && le.indexOf(T_RT) < 0 && le.indexOf(STAND_IN) < 0
    && off.answer.reason === "unreached" && lo.indexOf("refresh: unreached | detail=net::ERR_PROXY_CONNECTION_FAILED") > 0
    && renewed.answer.ok === true && /refresh: ok [|] status=200 [|] detail=nonce none, refresh token kept$/.test(lr) && /service: ok [|] detail=signed in$/.test(ls),
    said: lines.map((l) => String(l).slice(0, 140)).join(" / ") };
});

await leg("st5", "AADSTS65004 at the loopback is signin-cancelled, the person's own Cancel, whatever error stands beside it; AADSTS65001, 90094 and consent_required stay signin-org", async () => {
  const pending = { state: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ" };
  const back = (q) => C.loopbackAnswer("?state=" + pending.state + "&" + q, pending).reason;
  const d = (c) => "&error_description=" + encodeURIComponent(c + ": planted");
  const got = { a65004: back("error=access_denied" + d("AADSTS65004")), c65004: back("error=consent_required" + d("AADSTS65004")),
    a65001: back("error=access_denied" + d("AADSTS65001")), a90094: back("error=access_denied" + d("AADSTS90094")), consent: back("error=consent_required") };
  return { ok: got.a65004 === "signin-cancelled" && got.c65004 === "signin-cancelled" && got.a65001 === "signin-org" && got.a90094 === "signin-org"
    && got.consent === "signin-org", said: Object.entries(got).map(([k, v]) => k + "=" + v).join(" ") };
});

/* ---- planted faults, each in a scratch copy ------------------------------------------------------------------------------ */
if (!ONLY) {
  copyPlants({ root: ROOT, self: SELF, label: "signin-trace", onlyVar: "SIGNIN_TRACE_ONLY",
    check: (ok, line) => check("plants", ok, line), skip, plants: [
      { mark: "st-declined", leg: "st5", rel: "src/licence-client.mjs", line: "    void DECLINED_CODE;" },
      { mark: "st-trace-hide", leg: "st3", rel: "src/licence-client.mjs", line: "    void h;" },
      { mark: "st-trace-jwt", leg: "st3", rel: "src/licence-client.mjs", line: "    void t;" },
      { mark: "st-trace-off", leg: "st1", rel: "src/licence-client.mjs",
        line: "  if (!io) return; if (typeof io.trace !== \"function\") { console.error(traceLine(provider, step, shown, said, hide)); return; }" },
      { mark: "st-trace-asked", leg: "st1", rel: "shell/main.js", line: "const SIGNIN_TRACE_ASKED = process.env.ETIUDA_SIGNIN_TRACE !== undefined;" },
      { mark: "st-trace-wired", leg: "st1", rel: "shell/main.js", line: "    trace: (line) => { process.stderr.write(line); }," },
      { mark: "no-licence-code-traced", leg: "st3", rel: "src/licence-client.mjs", line: "const traceAnswer = (a) => ({ detail: JSON.stringify(a) });" },
    ] });
}

console.log("#counts checks=" + asserted + " failed=" + failed + " expected=" + (ONLY ? 1 : EXPECTED));
if (!ONLY && asserted !== EXPECTED) { console.log("SUITE DID NOT COMPLETE: " + asserted + " of " + EXPECTED + " checks ran"); failed++; }
console.log("signin-trace: " + asserted + " assertion(s), " + failed + " failure(s)");
process.exit(Math.min(failed, 63));
