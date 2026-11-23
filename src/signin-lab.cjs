/* THE SIGN-IN LAB (the test architect's brief of 2026-11-12, "sign-in lab seams"): one test-only seam through which a development
 * Studio runs its real sign-in path, the browser's hand-out, the loopback, the exchange, the refresh, the token checks, the
 * licence service and the certificate, against a provider and a licence service on this machine, so that path has run for real
 * before anyone signs in at Microsoft or Google; and, by the same file, against the staging licence service with the real
 * providers' client ids before any id is on main (the lead engineer's extension of 2026-11-12, from the staging read).
 * Claude alpha's words: "before he sits down, that whole path has run for real on this laptop against a provider we control,
 * in both apps and at the service".
 *
 * ETIUDA_SIGNIN_LAB names a JSON file, read once as this module loads (once per thread: the shell, and the disk worker where it
 * loads src/licence.mjs), the same shape the desk reads under the same name, so one file drives both apps:
 *
 *   { "service": "http://127.0.0.1:<port>/<name>/v1/" or "https://etiuda.dev/<name>/v1/",      required
 *     "provider": { "id": "lab", "issuer": "...", "authorize": "...", "token": "...", "jwks" (optional), "clientId": "...",
 *                   "clientSecret" (optional), "scope": "... openid ..." },                     optional
 *     "clientIds": { "microsoft": "...", "google": "..." },                                     optional, either or both
 *     "root": "<64 hex, the public half of the root the lab's service signs under>",           optional
 *     "order": "https://<name>.etiuda.dev", the site's origin the team's order page is under       optional }
 *
 * What a file of that shape changes, each field only where it is given, and nothing else: src/licence-client.mjs offers
 * `provider` as a third one, by the id "lab", and gives Microsoft and Google the client ids `clientIds` names and none it does not
 * name (the shipped table names none, and no id of Etiuda's reaches the lab's service), their own https
 * addresses unchanged; src/wire.cjs admits the lab provider's own authorize and token addresses, over http at 127.0.0.1 and
 * nowhere else, and sends the licence door's calls (the version note's too) to `service`; src/licence.mjs judges a licence, a
 * revoked keys' list, a version note and a seat certificate under `root`, and the shell's relayRootsNow judges a grant under
 * it, each in place of the shipped root as STUDIO_VENDOR_KEY and STUDIO_RELAY_ROOT already do in a development tree. The lab
 * provider's authorize and token addresses, the two Studio sends to, must be http at 127.0.0.1 with a port, in their canonical
 * form, with no user, query or fragment (its issuer and key set may also be https at a .localhost name); the service that, or
 * https at etiuda.dev in the form ETIUDA_LICENCE_ORIGIN takes. Anything else, a field of another shape, a provider id other
 * than "lab", a client id for another provider, or no service, refuses the whole file, and Studio is then as it would be
 * without the variable.
 *
 * AN INSTALLED STUDIO IGNORES IT, whatever it holds, and reads no file it names (a test service build's own file aside, below): one loaded from inside app.asar (the test shell/main.js's
 * PACKAGED and src/wire.cjs's overrides read by), or one Electron calls packaged (app.isPackaged, where this thread has Electron).
 * Then `lab` is null, and every byte Studio sends is as it was before this file existed (tests/signin-lab.mjs sl1, which goes red
 * with this test taken out). */
"use strict";
const fs = require("node:fs");
/* The site's origin a development Studio's Buy opens the team's order page under (board 1020): https on etiuda.dev with no path, the
   desk's ORDER_ORIGIN_SHAPE, written out as src/buy-path.cjs ORDER_ORIGIN is (tests/studio-buy-path.mjs sbuy8 holds the two the same),
   since this file loads alone where a test service build's copy is read (tests/no-model.mjs 11be). */
const BUY_ORDER_ORIGIN = /^https:\/\/(?:[a-z0-9-]+\.)*etiuda\.dev$/;

function packagedHere(dir) {
  if (/[\\/]app\.asar([\\/]|$)/i.test(String(dir || ""))) return true;
  try { const e = require("electron"); if (e && typeof e === "object" && e.app && e.app.isPackaged === true) return true; } catch { /* a worker thread, or plain node */ }
  return false;
}
const PACKAGED = packagedHere(__dirname); /* plant:lab-packaged */

const LOOPBACK = /^http:\/\/127\.0\.0\.1:([1-9][0-9]{0,4})\//;
/** `v` where it is an http address at 127.0.0.1 with a port, in the canonical form new URL gives it (or, for an issuer, that form
 *  with its trailing "/" left off), with no user, query or fragment; else null. */
function loopbackAt(v, issuer) {
  if (typeof v !== "string" || /%2e/i.test(v)) return null;
  let u = null;
  try { u = new URL(v); } catch { return null; }
  if (u.protocol !== "http:" || u.hostname !== "127.0.0.1" || !u.port || Number(u.port) > 65535 || u.username || u.password || u.search || u.hash) return null;
  if (!LOOPBACK.test(u.href)) return null;
  return u.href === v || (issuer && u.pathname === "/" && u.href === v + "/") ? v : null;
}
/** `v` where it is https at a name ending ".localhost" (which resolves to this machine alone), with an optional port and path and
 *  no user, query or fragment, as new URL writes it or with its trailing "/" left off; else null. */
function localhostAt(v) {
  if (typeof v !== "string" || /%2e/i.test(v)) return null;
  let u = null;
  try { u = new URL(v); } catch { return null; }
  if (u.protocol !== "https:" || !/^(?:[a-z0-9-]+\.)+localhost$/.test(u.hostname) || u.username || u.password || u.search || u.hash) return null;
  return u.href === v || (u.pathname === "/" && u.href === v + "/") ? v : null;
}
const SERVICE = /^http:\/\/127\.0\.0\.1:[1-9][0-9]{0,4}\/[a-z][a-z0-9-]{0,40}\/v1\/$/;
const STAGING = /^https:\/\/etiuda\.dev\/[a-z][a-z0-9-]{0,40}\/v1\/$/;
const CLIENT = /^[\x21-\x7e]{1,200}$/;
const SCOPE = /^[\x21-\x7e]+(?: [\x21-\x7e]+){0,15}$/;
const plain = (o) => !!o && typeof o === "object" && !Array.isArray(o);

/** The lab provider a file names, frozen, or {refused}. */
function labProviderOf(p) {
  if (!plain(p)) return { refused: "the provider is not an object" };
  if (p.id !== "lab") return { refused: "the provider's id is not \"lab\"" };
  const at = {};
  for (const k of ["authorize", "token"]) {
    at[k] = loopbackAt(p[k], false);
    if (!at[k]) return { refused: "the provider's " + k + " is not an http address at 127.0.0.1 with a port" };
  }
  /* The issuer is only compared with the token's, and the key set never read here, so either may also be the https name the
     licence service needs (the test architect's tools/oidc-lab.mjs: "https://oidc-lab.localhost:<port>"); the key set may be left out. */
  at.issuer = loopbackAt(p.issuer, true) || localhostAt(p.issuer);
  if (!at.issuer) return { refused: "the provider's issuer is not http at 127.0.0.1 or https at a .localhost name" };
  at.jwks = p.jwks === undefined ? "" : loopbackAt(p.jwks, false) || localhostAt(p.jwks);
  if (at.jwks === null) return { refused: "the provider's jwks is not http at 127.0.0.1 or https at a .localhost name" };
  if (typeof p.clientId !== "string" || !CLIENT.test(p.clientId)) return { refused: "the provider's clientId" };
  if (p.clientSecret !== undefined && p.clientSecret !== "" && (typeof p.clientSecret !== "string" || !CLIENT.test(p.clientSecret))) return { refused: "the provider's clientSecret" };
  if (typeof p.scope !== "string" || !SCOPE.test(p.scope) || p.scope.split(" ").indexOf("openid") < 0) return { refused: "the provider's scope, with openid" };
  /* The provider as src/licence-client.mjs holds Microsoft's and Google's: the refresh asks the scope again, and nothing extra. */
  return Object.freeze({ id: "lab", issuer: at.issuer, clientId: p.clientId, clientSecret: typeof p.clientSecret === "string" ? p.clientSecret : "",
    authorize: at.authorize, token: at.token, jwks: at.jwks, scope: p.scope, refreshScope: p.scope, extra: Object.freeze({}) });
}

/** The lab a file's text describes, frozen, each field null where the file gives none, or {refused} naming the first thing wrong. */
function labOf(text) {
  let d = null;
  try { d = JSON.parse(String(text).replace(/^\uFEFF/, "")); } catch { return { refused: "not JSON" }; }
  if (!plain(d)) return { refused: "not an object" };
  const given = (k) => d[k] !== undefined && d[k] !== null;
  /* The service is the one field both apps need (the desk refuses a file without it), so a file without one is refused here too. */
  if (!given("service")) return { refused: "it names no service" };
  let provider = null, clientIds = null;
  if (given("provider")) { provider = labProviderOf(d.provider); if (provider.refused) return provider; }
  if (given("clientIds")) {
    const ids = d.clientIds;
    if (!plain(ids) || !Object.keys(ids).length || Object.keys(ids).some((k) => k !== "microsoft" && k !== "google")
      || Object.values(ids).some((v) => typeof v !== "string" || !CLIENT.test(v))) return { refused: "clientIds names microsoft or google, each with a client id" };
    clientIds = Object.freeze(Object.assign({}, ids));
  }
  if ((typeof d.service !== "string" || !(STAGING.test(d.service) || (SERVICE.test(d.service) && loopbackAt(d.service)))))
    return { refused: "the service is not http://127.0.0.1:<port>/<name>/v1/ or https://etiuda.dev/<name>/v1/" };
  if (given("root") && (typeof d.root !== "string" || !/^[0-9a-f]{64}$/.test(d.root))) return { refused: "the root is not 64 lowercase hex" };
  if (given("order") && (typeof d.order !== "string" || !BUY_ORDER_ORIGIN.test(d.order))) return { refused: "the order origin is not https on etiuda.dev with no path" }; /* plant:lab-order */
  return Object.freeze({ provider, clientIds, service: given("service") ? d.service : null, root: given("root") ? d.root : null, order: given("order") ? d.order : null });
}

/** The lab this process runs against, read once from the file ETIUDA_SIGNIN_LAB names: null when packaged, unset or refused. */
function labNow(env, packaged, read) {
  const file = packaged ? "" : String((env || {}).ETIUDA_SIGNIN_LAB || "");
  if (!file) return null;
  let text = "";
  try { text = read(file); } catch { process.stderr.write("studio  ETIUDA_SIGNIN_LAB is not taken: its file could not be read\n"); return null; }
  const got = labOf(text);
  if (got.refused) { process.stderr.write("studio  ETIUDA_SIGNIN_LAB is not taken: " + got.refused + "\n"); return null; }
  return got;
}
/* THE TEST SERVICE BUILD (tools/test-service.cjs): its fields travel inside the asar, as etiudaTestService in the package.json packed
   above this file, read once as this module loads, packaged only, and taken as the lab file. A file beside the asar is never read, so
   a sold package cannot gain them (its asar's integrity is the fuses'). Refused, Studio is the ordinary build. */
const TEST_SERVICE_KEY = "etiudaTestService";
function testServiceNow(packaged, dir, read) {
  if (!packaged || !/[\\/]app\.asar[\\/]/i.test(String(dir || ""))) return null; /* plant:ts-packaged */
  let fields;
  try { fields = JSON.parse(read(require("node:path").join(String(dir), "..", "package.json")))[TEST_SERVICE_KEY]; } catch { return null; } /* plant:ts-asar */
  if (fields === undefined) return null;
  const got = labOf(JSON.stringify(fields));
  if (got.refused) { process.stderr.write("studio  this package's test service fields were refused (" + got.refused + "), so it runs as the ordinary build\n"); return null; } /* plant:ts-take */
  /* A build carries no order page until the site goes live (board 1020): a packed "order" is not taken. */
  return Object.freeze(Object.assign({}, got, { order: null }));
}
const testService = testServiceNow(PACKAGED, __dirname, (f) => fs.readFileSync(f, "utf8"));
const lab = testService || labNow(process.env, PACKAGED, (f) => fs.readFileSync(f, "utf8"));
if (lab) process.stderr.write("studio  ETIUDA_SIGNIN_LAB taken:" + (lab.provider ? " the provider \"lab\";" : "") + (lab.clientIds ? " client ids for " + Object.keys(lab.clientIds).join(" and ") + ";" : "")
  + (lab.service ? " the licence service at " + lab.service + ";" : "") + (lab.root ? " its own root" : " the shipped root") + "\n");

/** Google's client secret for a development Studio: ETIUDA_GOOGLE_CLIENT_SECRET at start, of the packaged file's shape, else none.
 *  An installed Studio reads only the file the package step put beside the asar (shell/main.js), never this. */
function devGoogleSecret(env, packaged, shape) {
  const v = packaged ? "" : String((env || {}).ETIUDA_GOOGLE_CLIENT_SECRET || "");
  return v && shape.test(v) ? Object.freeze({ google: v }) : null;
}

module.exports = { lab, labOf, labNow, devGoogleSecret, packagedHere, PACKAGED, testService: !!testService, testServiceNow, TEST_SERVICE_KEY };
