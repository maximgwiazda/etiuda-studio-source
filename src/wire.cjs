"use strict";
/* STUDIO'S ONE DOOR TO THE NETWORK (CLAUDE.md): every call Studio makes goes through this file, made by the shell alone,
 * and tests/no-model.mjs 11 holds it to its exact statements. It holds four routes and nothing else: the relay at etiuda.dev
 * (board 900, relay slice 1, ruled by Maxim 2026-10-15 10:59 to 11:00), the licence service (board 936, S6), which a
 * lead asks from Settings for a licence and a relay grant and which the quiet check asks now and then, and from which Studio
 * reads its version note (board 991, below), the customer's own AI service (board 992, below), which only the person or
 * their organisation names, and the sign-in services a lead signs in with (board 980, below), at their fixed hosts.
 *
 * WHAT TRAVELS IS SEALED OR PUBLIC. The channel layer (the pinned engine's shell/relay/channel.cjs) hands this file only
 * ciphertext sealed under the team key with its signed metadata, a hello signed by the lead's key, and the lead's signed
 * calls (src/relay.mjs): ids, public keys, hashes and numbers. A catalog's text, a desk's figures, a path and a name travel
 * only inside the ciphertext, so the customer's content leaves the company's network only safely encrypted (Maxim,
 * 2026-10-06 21:22). The licence service is handed the lead's public key, signatures, and at a sign-in or a renewal the
 * person's ID token. From Microsoft, asked for openid profile
 * email offline_access, the token carries the person's name, their account's username (for a work account usually its email address),
 * the directory's and the account's identifiers (tid, oid) and a subject; from Google, asked for openid email profile, a subject and, where
 * Google sends it, the domain (hd). The service checks the token and discards it, and writes no name, username, address or
 * subject as it is: it keeps keyed hashes standing for the person, their account and their organisation, the seat codes, which
 * desk keys hold a person's seat and when each signed in. With
 * these it is handed the seat codes and pseudonyms a call names (src/licence-client.mjs): nothing of a catalog, nor a team's
 * content.
 *
 * TWO ADDRESSES. A call to any other origin or path is refused before anything is sent, so a team file naming another relay
 * reaches nothing from Studio. The relay's door admits a URL only when its resolved protocol, host and path begin with the
 * relay's one path, with no port, no user, no query and no fragment, and the URL as given holds no "." or ".." segment,
 * plain or written with %2e. The socket is judged the same way. The licence door takes a route's name, not an address, so
 * the same traversal cannot be written there. THE RELAY ANSWERS AT etiuda.dev/relay/v1/. RELAY_ORIGIN below is the one value that names
 * it, and the socket is that same path on wss; a test service build alone reaches staging's beside it, at the one address
 * RELAY_TEST below fixes (Max, 2026-11-13 10:26). A development tree, a staging build or Maxim's test may set
 * ETIUDA_RELAY_ORIGIN to an https address on etiuda.dev of the form /<name>/v1/ (staging's is etiuda.dev/relay-staging/v1/,
 * a Worker of its own: Claude alpha's ruling of 2026-10-26), anything else is ignored, and an installed Studio ignores it
 * whatever it holds. THE LICENCE SERVICE ANSWERS AT etiuda.dev/licence/v1/, beside the relay (chosen by Claude
 * alpha with the site, 2026-10-25; its production Worker is made later under a name of its own): LICENCE_ORIGIN below is the one constant
 * that names it, and a call is made only by a route's name under it, never by
 * an address a caller hands in. Studio reaches the staging service (etiuda.dev/licence-staging/v1/, a Worker of its own:
 * Claude alpha's ruling on the test architect's C5) only when told to: a development tree, a staging build or Maxim's test
 * may set ETIUDA_LICENCE_ORIGIN to an https address on etiuda.dev of the form /<name>/v1/, anything else is ignored, and an
 * installed Studio ignores it whatever it holds, under the very test the shell's testOnly() reads by (its files inside
 * app.asar), so a customer's install is never steered by its environment. That test is a copy of shell/main.js's PACKAGED,
 * which testOnly() reads by, and both the licence override and the relay override read by it; a change to one is made to
 * the other (ls13c holds the licence copy, shell-guards 6 the shell's). The request goes through Chromium's network stack, as
 * Electron's request offers it, so the system's proxy, a setup script and automatic detection apply, Chromium answers a proxy's
 * Windows sign-in itself, and the system's certificate store applies, with no redirect followed, nothing cached and no cookie sent; a proxy's
 * sign-in Windows cannot answer is asked of the person (A COMPANY PROXY, below). The socket the relay announces new uploads on
 * goes through the proxy Chromium names for the relay's address, as a tunnel to that same address, or is the runtime's own
 * where Chromium names none, with the session in its header and the system's roots beside its own; where it does not open,
 * the layer asks on a timer instead. */
/* ELECTRON'S ABSENCE IS NOT FATAL AS THE MODULE LOADS: src/studio.mjs reaches this file through src/relay.mjs on Studio's
   worker thread, where a packaged app has no module called electron, and an uncaught require at load killed the thread, so
   every disk verb failed and the project list drew empty (shell-launch 5c, 2026-11-02). The thread makes no request. */
let loadedNet = null;
let packagedDoor = false, electronSeen = false;
try { const electron = require("electron"); electronSeen = true; loadedNet = electron.net; packagedDoor = !!(electron.app && electron.app.isPackaged === true); } catch { /* a worker thread has none, and makes no request */ } /* plant:wire-net-lazy */
/* THE SOCKET TRUSTS WHAT WINDOWS TRUSTS (board 989). The request above is Chromium's and reads the system's store; the socket
   is the runtime's own and trusted only the roots bundled with it, so behind a gateway that inspects encrypted traffic, whose
   root an office puts in the system's store, it failed where the person's browser works. The store's roots join the bundle
   here, once, as the file loads, before any socket can open; nothing is written to the store. An unreadable store, or a
   runtime without the call, leaves the bundle as it was and Studio starts all the same (tests/system-roots.mjs). */
try { const tls = require("node:tls"); tls.setDefaultCACertificates([...new Set([...tls.getCACertificates("default"), ...tls.getCACertificates("system")])]); } catch { /* the bundle stands */ } /* plant:wire-system-roots */

/* A COMPANY PROXY (the pinned engine's shell/proxy-net module, Node's own modules alone). Every call is Chromium's request with a
   sign-in listener: a proxy's challenge Chromium cannot answer with the Windows account (Basic, or a Windows sign-in that failed)
   is asked of the person once per proxy through the shell (proxyAsking), the answer held in memory for this run, never written
   and never logged, and a server that is not a proxy is never answered. The socket asks Chromium which proxy the relay's address
   goes through: none keeps the runtime's own socket, an HTTP proxy is asked to CONNECT to that same address, and a proxy that
   refuses closes it unopened, said once, the relay then asked every minute. A development copy that finds no module there
   says so once and keeps Electron's fetch and the runtime's socket. An installed copy, which Electron calls packaged, does not
   open this door, and says so once. */
let proxyNet = null;
let proxyGap = "";
try { proxyNet = require("../engine/pinned/shell/proxy-net.cjs"); } catch { /* plant:wire-proxy-module */
  proxyGap = "this copy has no company proxy module, so a proxy's sign-in cannot be asked";
  if (electronSeen) console.error("studio: " + proxyGap + (packagedDoor ? ", and its network door stays shut" : ""));
}
function proxyDoorShut() {
  return packagedDoor === true; /* plant:wire-proxy-door */
}
let loadedSession = null;
try { loadedSession = require("electron").session; } catch { /* a worker thread has none, and opens no socket */ }
let proxyAsk = null, proxySay = null;
const asker = proxyNet ? proxyNet.proxyAsker({ ask: (info) => (proxyAsk ? proxyAsk(info) : null), say: (line) => { if (proxySay) proxySay(line); } }) : null;
/** The shell's two hands: `ask({host, port, scheme, realm, again})` resolving to {username, password} or null, and `say(line)`,
 *  told host and port only. Nothing else of the proxy's question leaves this file. */
function proxyAsking(ask, say) { proxyAsk = typeof ask === "function" ? ask : null; proxySay = typeof say === "function" ? say : null; }

const LICENCE_ORIGIN = "https://etiuda.dev/licence/v1/";
/* THE SIGN-IN LAB (src/signin-lab.cjs): null in an installed Studio and wherever ETIUDA_SIGNIN_LAB is unset or refused, and then
   nothing below reads it. Where a development Studio took a lab file, the licence door calls the service it names (on 127.0.0.1,
   or staging's at etiuda.dev), before ETIUDA_LICENCE_ORIGIN, and the sign-in door admits the lab provider's own two addresses
   beside the fixed hosts (labAdmitted, below). */
let LAB = null;
try { LAB = require("./signin-lab.cjs").lab; } catch { /* a copy of this file alone, as a leg plants one under app.asar: no lab, as today */ }
let TESTING = false;
try { TESTING = require("./signin-lab.cjs").testService === true; } catch { /* the same: no test service build */ } /* plant:wire-testing */
const LICENCE_AT = LAB && LAB.service ? LAB.service : !/[\\/]app\.asar([\\/]|$)/i.test(__dirname) && /^https:\/\/etiuda\.dev\/[a-z][a-z0-9-]{0,40}\/v1\/$/.test(String(process.env.ETIUDA_LICENCE_ORIGIN || "")) ? String(process.env.ETIUDA_LICENCE_ORIGIN) : LICENCE_ORIGIN;
const LICENCE_ROUTE = /^[a-z]+(?:\/[a-z]+)?$/;
const RELAY_ORIGIN = !/[\\/]app\.asar([\\/]|$)/i.test(__dirname) && /^https:\/\/etiuda\.dev\/[a-z][a-z0-9-]{0,40}\/v1\/$/.test(String(process.env.ETIUDA_RELAY_ORIGIN || "")) ? String(process.env.ETIUDA_RELAY_ORIGIN) : "https://etiuda.dev/relay/v1/";
const RELAY_SOCKET = "wss://" + RELAY_ORIGIN.slice("https://".length);
/* THE TEST SERVICE BUILD'S RELAY. Max, 2026-11-13 10:26: "yes, of course Studio may reach the test relay in tests builds". A
   package whose asar carries the test service fields src/signin-lab.cjs accepted (tools/test-service.cjs) reaches staging's relay
   at this one fixed address, its socket the same path on wss, beside the relay above, and makes its new teams there
   (src/relay.mjs NEW_TEAMS_URL); a team it already holds keeps the relay its record names. No file or variable names this
   address: it is taken only where those fields were, and anywhere else it is "", so an ordinary build reaches what it did. */
const RELAY_TEST = TESTING ? "https://etiuda.dev/relay-staging/v1/" : ""; /* plant:wire-test-relay */
const RELAY_TEST_SOCKET = RELAY_TEST ? "wss://" + RELAY_TEST.slice("https://".length) : "";

/* THE CUSTOMER'S OWN AI SERVICE (board 992; Maxim, 2026-11-11 18:44 and 18:59, in src/customer-ai.mjs's head) is the third
 * door, and the one address it reaches is not Studio's to name: it is the endpoint the person or their organisation's Group
 * Policy configured for the service they chose, or that service's published address, chosen in src/customer-ai.mjs's
 * endpointFor and handed in here. This door admits it only as an https URL in its canonical form with no user, no password,
 * no query, no fragment and no "." or ".." segment, its path ending in "/", and appends a route's name to it; it sends only
 * the headers named in AI_HEADERS, a body of at most AI_MAX_SEND bytes, follows no redirect, waits at most AI_WAIT_MS for
 * the service to begin answering (a model writes its whole answer before it sends one), and reads at most AI_MAX_BYTES of
 * the answer. What the body may carry is src/customer-ai.mjs's requestFor, the one builder of it. */
const AI_ROUTE = /^[a-z]+(?:\/[a-z]+)?$/;
const AI_HEADERS = ["content-type", "authorization", "api-key", "x-api-key", "anthropic-version", "x-goog-api-key"];
const AI_WAIT_MS = 180000;
const AI_MAX_SEND = 2097152;
const AI_MAX_BYTES = 4194304;

/* NO CALL CAN HANG. A relay that accepts and never answers, or stalls mid-body, would hold the relay layer's sync for as long
 * as the network does, so every call is bounded by its idleness, never by its total: the answer's body is read chunk by
 * chunk and each chunk gives it WIRE_IDLE_MS more, so a slow but moving download of a large blob still completes. Before the
 * headers the request's own body travels first and its progress cannot be seen, so that wait is WIRE_IDLE_MS plus the body
 * at a floor rate of WIRE_FLOOR_BYTES_PER_S (about 30 s for a small call, about 27 minutes for a 50 MiB upload). Past a
 * bound the call is aborted through its signal and throws, which the layer takes as a relay that does not answer; the throw
 * does not wait on the abort being honoured. */
const WIRE_IDLE_MS = 30000;
const WIRE_FLOOR_BYTES_PER_S = 32768;

/* A URL IS ADMITTED ONLY AS THIS DOOR'S ONE PATH. new URL resolves it. The protocol, the host with no port and no user,
 * and the path, with no query and no fragment, must begin with `origin`. The URL as given must hold no "." or ".."
 * segment, written as itself or with %2e, since a dot segment that resolves back inside the path would still pass a
 * check of the resolved path alone. A textual prefix is not enough. */
function relayAdmitted(url, origin) {
  const raw = String(url);
  let parsed = null;
  try { parsed = new URL(raw); } catch (err) { return false; }
  if (parsed.username !== "" || parsed.password !== "" || parsed.port !== "" || parsed.search !== "" || parsed.hash !== "") return false;
  const built = parsed.protocol + "//" + parsed.hostname + parsed.pathname;
  if (built.indexOf(origin) !== 0) return false;
  const given = raw.split("#", 1)[0].split("?", 1)[0];
  const segments = [];
  let piece = "";
  for (let i = 0; i < given.length; i++) {
    const ch = given[i];
    if (ch === "/" || ch === "\\") { segments.push(piece); piece = ""; }
    else piece += ch;
  }
  segments.push(piece);
  for (let j = 0; j < segments.length; j++) {
    const decoded = segments[j].replace(/%2e/gi, ".");
    if (decoded === "." || decoded === "..") return false;
  }
  return true;
}

/* AN AI SERVICE'S ENDPOINT IS ADMITTED ONLY IN ITS CANONICAL FORM. new URL resolves a dot segment, %2e included, and
   lowercases the host, so a URL that is not already what new URL makes of it is refused rather than read as it resolves. */
function aiAdmitted(endpoint) {
  const raw = String(endpoint);
  let parsed = null;
  try { parsed = new URL(raw); } catch (err) { return false; }
  if (parsed.protocol !== "https:" || parsed.username !== "" || parsed.password !== "" || parsed.search !== "" || parsed.hash !== "") return false;
  if (!parsed.hostname || !/\/$/.test(parsed.pathname) || /%2e/i.test(raw)) return false;
  return parsed.href === raw;
}

/** One call to the customer's AI service: the POST of `body` (JSON bytes) to `route`, a route's name such as
 *  "messages", under `endpoint`, with `headers` of AI_HEADERS' names alone, answered {status, header(name), bytes}; it
 *  throws where the service does not answer within its bounds or answers more than AI_MAX_BYTES, and refuses anything
 *  else before anything is sent. */
async function customerAiRequest(endpoint, route, headers, body) {
  if (!aiAdmitted(endpoint) || !AI_ROUTE.test(String(route)) || !headers || typeof headers !== "object" || Object.keys(headers).some((h) => AI_HEADERS.indexOf(h) < 0) || !Buffer.isBuffer(body) || body.length > AI_MAX_SEND) throw new Error("Studio sends to the AI service only at the https address it was given, by a route's name, with its own headers");
  return bounded("the AI service", "POST", String(endpoint) + String(route), headers, body, AI_WAIT_MS, AI_MAX_BYTES);
}

/* THE SIGN-IN SERVICES (board 980, stage 2; Max, 2026-11-11 22:14: "I agree!", to sign-in as the only way to hold a paid
 * seat, Microsoft and Google first). A lead signs in in the system's own browser (RFC 8252: a native app "MUST use an external
 * user-agent"), and the code the provider sends back is exchanged here for the person's ID token, which goes on to the
 * licence service by its route. Three things pass this door and nothing else:
 * - THE PAGE THE BROWSER OPENS is admitted by identityAuthorize, which answers the URL only where it is https at one of
 *   IDENTITY_HOSTS, the providers' published hosts, with no port, no user, no fragment and no "." or ".." segment, in its
 *   canonical form, and "" for anything else; the shell opens only what it answers.
 * - THE TOKEN REQUEST is a POST of a form of at most IDENTITY_MAX_SEND bytes to a token address at those same hosts, with no
 *   query, through the one bounded call, no redirect followed, its answer read to IDENTITY_MAX_BYTES and no further.
 * - THE LOOPBACK, where the browser brings the code back: a listener on 127.0.0.1 alone, at a port the system picks, opened
 *   as a sign-in starts and closed once the response is returned (RFC 8252 8.3: open the port "only when starting the
 *   authorization request"): the GET of "/" carrying the sign-in's own state is answered 303 to a path the caller made for
 *   this sign-in, so no code or state stays in the address bar, and that path's one GET is answered with the page of how the
 *   sign-in ended, held until the caller lands it or LOOPBACK_LAND_MS passes; then it closes. Before that reply it closes after
 *   LOOPBACK_WAIT_MS, or when the caller closes it. Any other GET of "/" is answered with the caller's page and ignored, so a
 *   stray request cannot end the sign-in (Claude alpha's decision 15 item 4). What it caught is handed back as the query
 *   alone. Any other path, verb or later request is answered 404 and reaches nothing.
 * A third provider is one more host here, held by the gate like every address in this file. */
const IDENTITY_HOSTS = ["login.microsoftonline.com", "accounts.google.com", "oauth2.googleapis.com"];
const IDENTITY_MAX_SEND = 16384;
const IDENTITY_MAX_BYTES = 262144;
const LOOPBACK_WAIT_MS = 300000;
const LOOPBACK_LAND_MS = 8000;
const http = require("node:http");

/* A SIGN-IN ADDRESS IS ADMITTED ONLY IN ITS CANONICAL FORM, at a fixed host, as an AI service's endpoint is above: new URL
   resolves a dot segment and lowercases the host, so a URL that is not already what new URL makes of it is refused. A query is
   let through only for the page the browser opens. */
function identityAdmitted(url, withQuery) {
  const raw = String(url);
  let parsed = null;
  try { parsed = new URL(raw); } catch (err) { return false; }
  if (labAdmitted(parsed, raw, withQuery)) return true;
  if (parsed.protocol !== "https:" || parsed.username !== "" || parsed.password !== "" || parsed.port !== "" || parsed.hash !== "" || (!withQuery && parsed.search !== "")) return false;
  if (IDENTITY_HOSTS.indexOf(parsed.hostname) < 0 || /%2e/i.test(raw)) return false;
  return parsed.href === raw;
}

/* The lab provider's two addresses, and nothing else on 127.0.0.1: its authorize address with a query, for the page the browser
   opens, and its token address exactly, for the exchange and the refresh; each in its canonical form, with no user or fragment. */
function labAdmitted(parsed, raw, withQuery) {
  if (!LAB || !LAB.provider || parsed.href !== raw || parsed.username !== "" || parsed.password !== "" || parsed.hash !== "") return false;
  return withQuery ? parsed.origin + parsed.pathname === LAB.provider.authorize : parsed.search === "" && raw === LAB.provider.token;
}

/** The provider's page for the browser, as given, where it is admitted; "" otherwise. */
function identityAuthorize(url) { return identityAdmitted(url, true) ? String(url) : ""; }

/** One token request: the POST of `form` (form-encoded bytes) to `url`, a provider's token address, answered {status,
 *  header(name), bytes}; it refuses any other address or a form past its bound before anything is sent. */
async function identityRequest(url, form) {
  if (!identityAdmitted(url, false) || !Buffer.isBuffer(form) || form.length > IDENTITY_MAX_SEND) throw new Error("Studio asks a sign-in service only at its token address, with a form of its own");
  return bounded("the sign-in service", "POST", String(url), { "content-type": "application/x-www-form-urlencoded", accept: "application/json" }, form, 0, IDENTITY_MAX_BYTES);
}

/** The loopback for one sign-in: answers {port, caught, close, land} once it listens. A GET of "/" for which `ends(query)` is
 *  not true (no state, or another) is answered `pageFor("earlier")` and ignored; the first for which it is true is answered 303 to
 *  `clean`, a path of the caller's making ("/" and 16 to 64 hex), and `caught` settles with its query; it fails when the wait ends
 *  or `close` is called first. land(kind) answers `clean`'s one GET with `pageFor(kind)`, the GET held until then, or after
 *  LOOPBACK_LAND_MS with `pageFor("back")`, and the loopback closes. A page is its text, or {body, policy} with its own policy. */
function identityListen(pageFor, ends, clean) {
  return new Promise((resolve, reject) => {
    if (!/^\/[0-9a-f]{16,64}$/.test(String(clean))) { reject(new Error("the sign-in's loopback is given a path of its own")); return; }
    let ended = false, listening = false, timer = null, settle = null, taken = false, landed = "", held = null, served = false;
    const caught = new Promise((ok, no) => { settle = { ok, no }; });
    caught.catch(() => {});
    const shut = () => {
      clearTimeout(timer);
      try { server.close(); } catch { /* already closed */ }
      try { server.closeIdleConnections(); } catch { /* already closed */ }
    };
    const end = (err) => {
      if (ended) return;
      ended = true;
      shut();
      settle.no(err);
    };
    const serve = (res, kind) => {
      let page = null;
      try { page = pageFor(kind); } catch { page = ""; }
      const body = page && typeof page === "object" ? String(page.body || "") : String(page == null ? "" : page);
      const policy = page && typeof page === "object" && typeof page.policy === "string" ? page.policy : "default-src 'none'";
      const bytes = Buffer.from(body, "utf8");
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "content-length": bytes.length, connection: "close",
        "content-security-policy": policy, "referrer-policy": "no-referrer", "x-content-type-options": "nosniff" });
      res.end(bytes);
    };
    const server = http.createServer((req, res) => {
      const asked = String(req.url || ""), mark = asked.indexOf("?");
      const where = mark < 0 ? asked : asked.slice(0, mark), query = mark < 0 ? "" : asked.slice(mark);
      if (taken && !served && req.method === "GET" && asked === String(clean)) { /* plant:st-land-once */
        served = true;
        if (landed) { serve(res, landed); shut(); } else held = res;
        return;
      }
      if (ended || req.method !== "GET" || where !== "/") { res.writeHead(404, { connection: "close" }); res.end(); return; }
      let done = false;
      /* A stray request (no state, or another) is answered and ignored, the loopback left listening (Argon 5). */
      try { done = typeof ends === "function" && ends(query) === true; } catch { done = false; }
      if (!done) { serve(res, "earlier"); return; }
      ended = true;
      taken = true;
      clearTimeout(timer);
      res.writeHead(303, { location: String(clean), "cache-control": "no-store", "referrer-policy": "no-referrer", "content-length": 0, connection: "close" }); /* plant:st-land-redirect */
      res.end();
      timer = setTimeout(() => { if (!landed) landed = "back"; if (held) serve(held, landed); held = null; shut(); }, LOOPBACK_LAND_MS); /* plant:st-land-cap */
      if (timer.unref) timer.unref();
      settle.ok(query);
    });
    server.on("error", (err) => { if (listening) end(err); else reject(err); });
    server.listen(0, "127.0.0.1", () => {
      listening = true;
      timer = setTimeout(() => end(new Error("the sign-in did not come back within " + Math.round(LOOPBACK_WAIT_MS / 60000) + " minutes")), LOOPBACK_WAIT_MS);
      if (timer.unref) timer.unref();
      resolve({ port: server.address().port, caught, close: () => end(Object.assign(new Error("the sign-in was closed"), { closed: true })),
        land: (kind) => { if (!taken || landed) return; landed = String(kind || "appfail"); if (held) { serve(held, landed); held = null; shut(); } } });
    });
  });
}

/** One call to the relay: `method`, the full `url`, `headers` and `body` (bytes or nothing), answered as the channel layer
 *  takes it, {status, header(name), bytes}; it throws where the relay does not answer, within the bounds above, and refuses
 *  any other address. */
async function relayRequest(method, url, headers, body) {
  if (!relayAdmitted(url, RELAY_ORIGIN) && !(RELAY_TEST && relayAdmitted(url, RELAY_TEST))) throw new Error("Studio reaches the relay at " + RELAY_ORIGIN + (RELAY_TEST ? " and " + RELAY_TEST : "") + " and nothing else");
  return bounded("the relay", method, url, headers, body);
}

/** One call to the licence service: the POST of `body` (JSON bytes) to `route`, a route's name such as "check" or
 *  "signin/renew", under the service's one address, answered {status, header(name), bytes}; it throws where the service does
 *  not answer, within the bounds above, and refuses anything that is not a route's name before anything is sent. A route's
 *  name is letters and at most one slash, so it cannot name a dot segment or a second path, and the caller never hands
 *  the address. */
async function licenceRequest(route, body) {
  if (!LICENCE_ROUTE.test(String(route))) throw new Error("Studio asks the licence service by a route's name and nothing else");
  return bounded("the licence service", "POST", LICENCE_AT + String(route), { "content-type": "application/json" }, body);
}

/* THE VERSION NOTE (board 991; Max's ruling of 2026-10-06: each program reads a small signed version note from etiuda.dev). One
 * GET of Studio's own note under the licence service's one address, with no body, no argument and no header of its own, so
 * nothing of this Studio travels; the answer is read to NOTE_MAX bytes and no further, and a longer one throws. What it says is
 * judged by src/update-note.mjs under the root's key, never here. */
const NOTE_MAX = 1024;
async function licenceNote() {
  return bounded("the licence service", "GET", LICENCE_AT + "note/studio", {}, null, 0, NOTE_MAX);
}

/* THE ONE CALL, bounded as above, for every door. `what` names the service in the sentence a cut call throws. `wait`, where
   given, is the wait for the answer to begin in place of the one the body's size sets, and `cap` the most of the answer
   read before the call is cut, past which the call is aborted and throws; the relay and the licence service's POST give
   neither, and the version note gives a cap alone. */
/* THE ONE FETCH: Chromium's request with the proxy's sign-in listener where the runtime has it, as every Electron Studio ships
   on does; Electron's fetch where the runtime offers only that, as a leg's stand-in does. */
function wireFetch(url, init) {
  if (!proxyNet && proxyDoorShut()) return Promise.reject(new Error(proxyGap));
  if (asker && typeof loadedNet.request === "function") return proxyNet.fetchThrough(loadedNet, url, init, asker.forRequest()); /* plant:wire-login */ /* plant:wire-credentials */
  return loadedNet.fetch(url, init);
}

async function bounded(what, method, url, headers, body, wait, cap) {
  const stop = new AbortController();
  let timer = null, late = null;
  const overdue = new Promise((resolve, reject) => { late = reject; });
  overdue.catch(() => {});
  const arm = (ms) => {
    clearTimeout(timer);
    timer = setTimeout(() => { late(new Error(what + " did not answer within " + Math.round(ms / 1000) + " s")); stop.abort(); }, ms);
  };
  const bound = (step) => Promise.race([step, overdue]);
  arm(wait || WIRE_IDLE_MS + Math.ceil(((body ? body.length : 0) * 1000) / WIRE_FLOOR_BYTES_PER_S));
  try {
    const res = await bound(wireFetch(String(url), { method: String(method), headers: headers, body: body || undefined, redirect: "error", cache: "no-store", credentials: "omit", signal: stop.signal })); /* plant:wire-omit */
    const chunks = [];
    let size = 0;
    const reader = res.body ? res.body.getReader() : null;
    arm(WIRE_IDLE_MS);
    while (reader) {
      const step = await bound(reader.read());
      if (step.done) break;
      size += step.value.length;
      if (cap && size > cap) { stop.abort(); throw new Error(what + " answered more than " + cap + " bytes"); } /* plant:wire-cap */
      chunks.push(Buffer.from(step.value));
      arm(WIRE_IDLE_MS); /* plant:wire-idle */
    }
    return { status: res.status, header: (name) => res.headers.get(name), bytes: Buffer.concat(chunks) };
  } finally {
    clearTimeout(timer);
  }
}

/** The relay's socket at `url`, the session in `headers`, its messages and its close told to `on`, and its opening where
 *  `on` asks (board 989: a socket that closes without having opened is one this network does not let through); null where
 *  the address is another or the runtime has no socket. The address is judged first, before any proxy is asked about it. */
function relayConnect(url, headers, on) {
  if (!(relayAdmitted(url, RELAY_SOCKET) || (RELAY_TEST_SOCKET && relayAdmitted(url, RELAY_TEST_SOCKET))) || typeof WebSocket !== "function") return null; /* plant:wire-socket-admit */
  if (!proxyNet && proxyDoorShut()) return null;
  const chosen = proxySession();
  if (asker && chosen) return proxyNet.proxiedConnect(String(url), headers, on, { resolve: (u) => chosen.resolveProxy(u), direct: relaySocket, asker: asker }); /* plant:wire-socket-proxy */
  return relaySocket(String(url), headers, on);
}
/* Electron's default session, whose resolver names the system's proxy for an address; null on the worker thread, before the
   app is ready, or where a leg's stand-in has no resolver. */
function proxySession() {
  try { const s = loadedSession && loadedSession.defaultSession; return s && typeof s.resolveProxy === "function" ? s : null; } catch { return null; }
}
/* The runtime's own socket. `opens` says the channel is told when it opens, so two closes before opening read as a network
   that does not let it through and the relay is asked every minute, not every two seconds (the pinned channel's socketDown). */
function relaySocket(url, headers, on) {
  const ws = new WebSocket(String(url), { headers: headers });
  ws.onopen = () => { if (typeof on.open === "function") on.open(); };
  ws.onmessage = (e) => on.message(typeof e.data === "string" ? e.data : Buffer.from(e.data).toString("utf8"));
  ws.onclose = () => on.close();
  ws.onerror = () => {};
  return { opens: true, send: (text) => { if (ws.readyState === 1) ws.send(text); }, close: () => { try { ws.close(); } catch { /* gone */ } } }; /* plant:wire-opens */
}

module.exports = { relayRequest, relayConnect, licenceRequest, licenceNote, customerAiRequest, identityAuthorize, identityRequest, identityListen, proxyAsking, LICENCE_ORIGIN, RELAY_ORIGIN, RELAY_TEST, NOTE_MAX, IDENTITY_HOSTS };
