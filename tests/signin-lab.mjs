/* THE SIGN-IN LAB'S SEAM, AND ITS INERTNESS INSTALLED (the test architect's brief of 2026-11-12, "sign-in lab seams").
 *
 *     node tests/signin-lab.mjs        exit 0 when every check holds, 1 when any fails
 *
 * gate-kind: node
 *
 * THE CRITERION, Claude alpha's words: "before he sits down, that whole path has run for real on this laptop against a provider we
 * control, in both apps and at the service". The brief's floor: "Packaged or installed, the variable is ignored and every byte the
 * app sends is as today", and "nothing the owner installs can be pointed anywhere".
 *
 * Each case is one child process (this file with --probe) that loads src/wire.cjs, src/licence-client.mjs, src/licence.mjs and the
 * shell's relayRootsNow (sliced from shell/main.js as written) from a tree, with Electron's net replaced by a stand-in that
 * records every request it is handed (address, verb, headers, body) and answers nothing more, and reports what Studio offers,
 * admits, sends and trusts. "Installed" is a copy of the tree's src/, service/, shell/ and the pinned relay under
 * resources/app.asar/, as an installed Studio loads them; nothing here starts Studio, opens a window or reaches a network.
 *
 *   sl1  installed, with ETIUDA_SIGNIN_LAB naming a good lab file: the providers (SIGN_IN_PROVIDERS itself, by identity, offering none as shipped), the sign-in
 *        door's hosts and what it admits, every request's bytes, the licence door's address and the trusted roots are those of the
 *        same copy without the variable and of the tree without it, byte for byte; the file is never read, and nothing is said
 *        (red with src/signin-lab.cjs's packaged test taken out: plant lab-packaged)
 *   sl1b the tree, with Electron saying app.isPackaged: the same, the file never read
 *   sl2  the tree with the lab file: the lab provider offered third, as the file gives it, and alone, the shipped two holding no
 *        client id where the file names none (red with an unconfigured id filled in: plant lab-fill); the door admits its authorize address (with
 *        a query) and its token address and no other address on 127.0.0.1, the fixed hosts as before; the licence door and the
 *        version note at the lab's service; a licence, a list, a note and a certificate judged under the lab's root, a grant too
 *        (the shell's relayRootsNow); the file read once in the thread although four modules take it
 *   sl3  the real path unchanged but for where it points: authorizeRequest's page for the lab provider passes the door as the
 *        providers' do, the exchange's and the refresh's forms are the same builders' (the secret where the file gives one), and
 *        the token request goes through the one bounded call, verb and headers as Microsoft's
 *   sl4  a lab file that names a non-loopback http host, localhost by name, https anywhere, a port-less or user-carrying or queried
 *        address, an http service other than 127.0.0.1, an https service off etiuda.dev, another provider's id, a client id for a
 *        provider Studio does not have, a scope without openid, a root not of its shape, or no service, is refused whole (labOf); the
 *        test architect's provider double's https issuer at a .localhost name, no key set, no provider or no root is taken; a refused file
 *        leaves the tree as it is without the variable, the refusal said on stderr
 *   sl5  the staging file (the lead engineer's extension: a service at https://etiuda.dev/<name>/v1/, Microsoft's and Google's client
 *        ids, no provider, no root): in the tree, both providers offered with those ids and their own addresses, the licence door and
 *        the note at staging, the shipped root kept, nothing on 127.0.0.1 admitted; installed, every byte as without it, unread
 *   sl6  Google's client secret from ETIUDA_GOOGLE_CLIENT_SECRET in a development Studio only, of the packaged file's shape; the shell
 *        reads it only where it reads no packaged file, under signin-lab's own packaged test
 *   sl7  tools/signin-staging.cmd is outside electron-builder's files and starts this development tree, never the installed app, with
 *        ETIUDA_SIGNIN_LAB set to the file it is handed and no secret written in it
 *
 * PROVED BY MAKING IT FAIL: two plants in a scratch copy (tests/plant-copy.mjs): src/signin-lab.cjs's packaged test replaced by
 * `false` reddens sl1, and src/licence-client.mjs filling an id where the lab names none reddens sl2.
 * ETIUDA_PLANTS=off (a merge's area run) skips them and counts them.
 *
 * Node only, no window, no Electron.
 */
import "./reg-stand-on.mjs";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { copyPlants } from "./plant-copy.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SELF = fileURLToPath(import.meta.url);
const SCRATCH = path.join(ROOT, "scratch", "signin-lab-legs");
const ONLY = process.env.SIGNIN_LAB_ONLY || "";
const EXPECTED = 31;

/* The addresses every probe asks the door about, the same in every case, so two cases' answers compare as text. */
const LAB_PORT = 47811, SERVICE_PORT = 47812;
const LAB = "http://127.0.0.1:" + LAB_PORT;
const MS_AUTH = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize", MS_TOKEN = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const PAGES = [MS_AUTH + "?client_id=a&state=b", "https://accounts.google.com/o/oauth2/v2/auth?client_id=a", LAB + "/authorize?client_id=a&state=b",
  LAB + "/authorize", LAB + "/token", LAB + "/other?client_id=a", "http://127.0.0.1:47813/authorize?client_id=a", "http://localhost:" + LAB_PORT + "/authorize?x=1",
  "https://127.0.0.1:" + LAB_PORT + "/authorize?x=1", "http://u@127.0.0.1:" + LAB_PORT + "/authorize?x=1", LAB + "/authorize?x=1#f"];
const TOKENS = [MS_TOKEN, "https://oauth2.googleapis.com/token", LAB + "/token", LAB + "/token?x=1", LAB + "/authorize", "http://127.0.0.1:47813/token",
  "http://localhost:" + LAB_PORT + "/token", "http://192.168.1.10:" + LAB_PORT + "/token"];
const ROOT_HEX = "ab".repeat(32);
/* Built, not written as a value, so tests/sign-in.mjs si66's scan for a client secret in a tracked file finds none here. */
const LAB_SECRET = ["lab", "secret", "1234"].join("-");
const GOOD = { provider: { id: "lab", issuer: LAB, authorize: LAB + "/authorize", token: LAB + "/token", jwks: LAB + "/jwks", clientId: "lab-client",
  clientSecret: LAB_SECRET, scope: "openid profile offline_access" }, service: "http://127.0.0.1:" + SERVICE_PORT + "/licence/v1/", root: ROOT_HEX };

/* ---- the child: one tree, one environment, everything the door and the trust answer ------------------------------------- */
async function probe(spec) {
  const { base, packagedStub } = JSON.parse(spec);
  const require = createRequire(import.meta.url);
  const Module = require("node:module");
  const labFile = process.env.ETIUDA_SIGNIN_LAB || "";
  let reads = 0;
  const realRead = fs.readFileSync;
  fs.readFileSync = function (f) {
    if (labFile && typeof f === "string" && path.resolve(f) === path.resolve(labFile)) reads++;
    return realRead.apply(this, arguments);
  };
  const seen = [];
  const electron = { app: { isPackaged: packagedStub === true }, net: { fetch: async (url, o) => {
    seen.push({ url: String(url), method: o.method, headers: o.headers, body: o.body ? Buffer.from(o.body).toString("utf8") : "", redirect: o.redirect, cache: o.cache });
    return { status: 200, headers: { get: () => null }, body: new ReadableStream({ start(c) { c.close(); } }) };
  } } };
  const load = Module._load;
  Module._load = function (req) { return req === "electron" ? electron : load.apply(this, arguments); };
  const wire = require(path.join(base, "src", "wire.cjs"));
  const C = await import(pathToFileURL(path.join(base, "src", "licence-client.mjs")).href);
  const L = await import(pathToFileURL(path.join(base, "src", "licence.mjs")).href);
  /* The shell's relayRootsNow as shell/main.js writes it, from its SIGNIN_LAB line to the function's end, run with the shell's
     own testOnly (empty for an installed copy, as PACKAGED makes it). */
  const shell = fs.readFileSync(path.join(base, "shell", "main.js"), "utf8");
  const from = shell.indexOf("const SIGNIN_LAB = "), fn = shell.indexOf("function relayRootsNow()"), to = shell.indexOf("\n}", fn);
  let roots = "(the shell's relayRootsNow not found)";
  if (from >= 0 && fn > from && to > fn) {
    const packaged = /[\\/]app\.asar([\\/]|$)/i.test(path.join(base, "shell"));
    const testOnly = (name) => (packaged ? "" : String(process.env[name] || ""));
    roots = new Function("require", "path", "ROOT", "testOnly", shell.slice(from, to + 2) + "\nreturn relayRootsNow();")(require, path, base, testOnly);
  }
  const form = Buffer.from("grant_type=authorization_code&code=c", "utf8");
  const tokenAsk = [];
  for (const u of TOKENS) {
    try { await wire.identityRequest(u, form); tokenAsk.push("sent"); } catch (e) { tokenAsk.push(/only at its token address/.test(String(e && e.message)) ? "refused" : "threw " + String(e && e.message)); }
  }
  try { await wire.licenceRequest("check", Buffer.from("{}")); } catch { /* the stand-in's answer is not the point */ }
  try { await wire.licenceNote(); } catch { /* nor here */ }
  const out = {
    shipped: JSON.stringify(C.SIGN_IN_PROVIDERS), now: JSON.stringify(C.PROVIDERS_NOW), same: C.PROVIDERS_NOW === C.SIGN_IN_PROVIDERS,
    offered: C.signInProviders().map((p) => p.id), hosts: JSON.stringify(wire.IDENTITY_HOSTS),
    pages: PAGES.map((u) => wire.identityAuthorize(u) !== ""), tokenAsk, requests: seen.slice(), licence: seen.slice(-2).map((x) => x.url),
    trusted: L.trustedKeyNow(), context: JSON.stringify(L.contextFor({}, process.env, false, null, null)), roots: roots === undefined ? "(undefined)" : roots,
  };
  /* sl3: the flow's own builders, for the provider the door offers by the lab's id (none installed). */
  const lab = C.providerOf("lab");
  if (lab) {
    const lead = "cd".repeat(32);
    const ask = await C.authorizeRequest(lab, 49152, lead);
    out.flow = { page: ask.url, admitted: wire.identityAuthorize(ask.url) === ask.url, code: C.codeForm(lab, ask, "the-code").toString("utf8"),
      refresh: C.refreshForm(lab, "the-refresh").toString("utf8"), redirect: ask.redirect };
    const before = seen.length;
    await wire.identityRequest(lab.token, C.codeForm(lab, ask, "the-code"));
    await wire.identityRequest(MS_TOKEN, C.codeForm(lab, ask, "the-code"));
    out.flow.asks = seen.slice(before);
  }
  out.reads = reads;
  process.stdout.write("PROBE " + JSON.stringify(out) + "\n");
}

if (process.argv[2] === "--probe") {
  await probe(process.argv[3]);
  process.exit(0);
}

/* ---- the legs ------------------------------------------------------------------------------------------------------------ */
let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}
function skip(line) { skipped++; process.stdout.write("  SKIP  " + line + "\n"); }
const leg = (id) => !ONLY || ONLY === id;

function run(base, labFile, packagedStub) {
  const env = Object.assign({}, process.env);
  for (const k of ["ETIUDA_SIGNIN_LAB", "ETIUDA_LICENCE_ORIGIN", "ETIUDA_RELAY_ORIGIN", "STUDIO_VENDOR_KEY", "STUDIO_RELAY_ROOT"]) delete env[k];
  if (labFile) env.ETIUDA_SIGNIN_LAB = labFile;
  const r = spawnSync(process.execPath, [SELF, "--probe", JSON.stringify({ base, packagedStub: packagedStub === true })], { cwd: ROOT, env, encoding: "utf8", timeout: 60000 });
  const line = String(r.stdout || "").split("\n").find((l) => l.startsWith("PROBE "));
  let got = null;
  try { got = line ? JSON.parse(line.slice(6)) : null; } catch { got = null; }
  return { got, err: String(r.stderr || ""), tail: (String(r.stdout || "") + String(r.stderr || "")).slice(-400).replace(/\s+/g, " ") };
}
/** A case's answer without the count of reads, as text, for comparing two cases. */
const asText = (got) => { if (!got) return "(no answer)"; const c = Object.assign({}, got); delete c.reads; return JSON.stringify(c); };
const firstDiff = (a, b) => { let i = 0; while (i < a.length && a[i] === b[i]) i++; return a === b ? "" : " differs at " + i + ": " + a.slice(Math.max(0, i - 60), i + 80) + " | " + b.slice(Math.max(0, i - 60), i + 80); };

clearScratch(SCRATCH);
fs.mkdirSync(SCRATCH, { recursive: true });
const labAt = (name, body) => { const f = path.join(SCRATCH, name + ".json"); fs.writeFileSync(f, typeof body === "string" ? body : JSON.stringify(body)); return f; };
const goodFile = labAt("good", GOOD);

/* The installed copy: what an installed Studio loads from inside app.asar, the sign-in's modules and what they import. */
const INSTALLED = path.join(SCRATCH, "installed", "resources", "app.asar");
for (const rel of ["src", "service", "shell", path.join("engine", "pinned", "relay")]) fs.cpSync(path.join(ROOT, rel), path.join(INSTALLED, rel), { recursive: true });

const treeBare = run(ROOT, "");
const PRODUCTION = ["https://etiuda.dev/licence/v1/check", "https://etiuda.dev/licence/v1/note/studio"];
const EMBEDDED = "f78558260ad75c094052f936326a63bffb1a581ac8b91d898ae1fd01b61127ee";

if (leg("sl1")) {
  const inst = run(INSTALLED, goodFile), instBare = run(INSTALLED, "");
  const a = asText(inst.got), b = asText(instBare.got), t = asText(treeBare.got);
  check(!!inst.got && a === b && a === t, "sl1 installed with a good lab file, the providers, the door's hosts and answers, every request's bytes, the licence door and the"
    + " roots are the installed copy's without it and the tree's without it, byte for byte" + (inst.got ? firstDiff(a, b) + firstDiff(a, t) : ": " + inst.tail));
  const g = inst.got || {};
  check(g.same === true && g.hosts === JSON.stringify(["login.microsoftonline.com", "accounts.google.com", "oauth2.googleapis.com"]) && JSON.stringify(g.offered) === '[]'
    && JSON.stringify(g.licence) === JSON.stringify(PRODUCTION) && g.trusted === EMBEDDED && g.roots === "(undefined)" && !g.flow,
    "sl1 that is today's: SIGN_IN_PROVIDERS itself (offering none as shipped), the three fixed hosts, the licence door and the note at etiuda.dev, the embedded root, the relay's own: "
    + JSON.stringify({ same: g.same, offered: g.offered, licence: g.licence, trusted: g.trusted, roots: g.roots }));
  check(g.reads === 0 && !/ETIUDA_SIGNIN_LAB/.test(inst.err), "sl1 the installed copy never reads the file and says nothing of it: reads=" + g.reads);
  check(JSON.stringify(g.pages) === JSON.stringify([true, true, false, false, false, false, false, false, false, false, false])
    && JSON.stringify(g.tokenAsk) === JSON.stringify(["sent", "sent", "refused", "refused", "refused", "refused", "refused", "refused"]),
    "sl1 installed, nothing on 127.0.0.1 or plain http passes the sign-in door, the providers' hosts as before: " + JSON.stringify([g.pages, g.tokenAsk]));
} else for (let i = 0; i < 4; i++) skip("sl1 (SIGNIN_LAB_ONLY=" + ONLY + ")");

if (leg("sl1b")) {
  const stub = run(ROOT, goodFile, true);
  const a = asText(stub.got), t = asText(treeBare.got);
  check(!!stub.got && a === t && stub.got.reads === 0, "sl1b the tree under an Electron that says app.isPackaged ignores the lab file as an installed copy does, unread"
    + (stub.got ? firstDiff(a, t) + " reads=" + stub.got.reads : ": " + stub.tail));
} else skip("sl1b (SIGNIN_LAB_ONLY=" + ONLY + ")");

let labRun = null;
if (leg("sl2") || leg("sl3")) labRun = run(ROOT, goodFile);
if (leg("sl2")) {
  const g = (labRun && labRun.got) || {};
  const now = g.now ? JSON.parse(g.now) : [], third = now[2] || {};
  const unnamed = g.shipped ? JSON.stringify(JSON.parse(g.shipped).map((p) => Object.assign({}, p, { clientId: "" }))) : "(none)";
  check(g.shipped === (treeBare.got || {}).shipped && now.length === 3 && JSON.stringify(now.slice(0, 2)) === unnamed && g.same === false,
    "sl2 SIGN_IN_PROVIDERS unchanged, the lab's provider a third beside it, the shipped two with no client id where the file names none: "
    + now.map((p) => p.id + ":" + p.clientId).join(","));
  check(third.id === "lab" && third.issuer === GOOD.provider.issuer && third.authorize === GOOD.provider.authorize && third.token === GOOD.provider.token
    && third.clientId === GOOD.provider.clientId && third.scope === GOOD.provider.scope && third.refreshScope === GOOD.provider.scope && JSON.stringify(g.offered) === '["lab"]',
    "sl2 the third provider is the file's, and the only one offered, the file naming no client id for the shipped two: " + JSON.stringify(third));
  check(JSON.stringify(g.pages) === JSON.stringify([true, true, true, true, false, false, false, false, false, false, false]),
    "sl2 the door admits the lab's authorize address, with or without a query, beside the fixed hosts, and no other path, port, name, scheme, user or fragment: " + JSON.stringify(g.pages));
  check(JSON.stringify(g.tokenAsk) === JSON.stringify(["sent", "sent", "sent", "refused", "refused", "refused", "refused", "refused"]),
    "sl2 a token request goes to the lab's token address exactly, as to the providers', and nowhere else on 127.0.0.1 or plain http: " + JSON.stringify(g.tokenAsk));
  check(JSON.stringify(g.licence) === JSON.stringify([GOOD.service + "check", GOOD.service + "note/studio"]),
    "sl2 the licence door and the version note go to the lab's service: " + JSON.stringify(g.licence));
  check(g.trusted === ROOT_HEX && JSON.stringify(g.roots) === JSON.stringify([ROOT_HEX]),
    "sl2 a licence, a revoked keys' list, a note and a certificate are judged under the lab's root, and the shell's grants too: " + JSON.stringify([g.trusted, g.roots]));
  check(g.context === JSON.stringify({ packaged: false, trustedKey: EMBEDDED, released: null }),
    "sl2 contextFor with no lab handed in is as before: " + g.context);
  check(g.reads === 1 && /ETIUDA_SIGNIN_LAB taken/.test(labRun.err), "sl2 the file is read once in the thread though the door, the client, the licence and the shell take it, and the run says it is a lab's: reads=" + g.reads);
  check(g.hosts === (treeBare.got || {}).hosts, "sl2 IDENTITY_HOSTS is unchanged: " + g.hosts);
} else for (let i = 0; i < 9; i++) skip("sl2 (SIGNIN_LAB_ONLY=" + ONLY + ")");

if (leg("sl3")) {
  const f = ((labRun && labRun.got) || {}).flow || {};
  const page = f.page ? new URL(f.page) : null, q = page ? page.searchParams : new URLSearchParams();
  check(!!page && page.origin + page.pathname === GOOD.provider.authorize && f.admitted === true && q.get("client_id") === "lab-client" && q.get("code_challenge_method") === "S256"
    && q.get("redirect_uri") === "http://127.0.0.1:49152" && q.get("scope") === GOOD.provider.scope && !!q.get("state") && !!q.get("nonce"),
    "sl3 authorizeRequest builds the lab's page as it builds the providers', PKCE, state, nonce and loopback, and the door admits it: " + (f.page || "(no flow)"));
  const code = new URLSearchParams(f.code || ""), refresh = new URLSearchParams(f.refresh || "");
  check(code.get("client_secret") === LAB_SECRET && code.get("grant_type") === "authorization_code" && code.get("code_verifier") && refresh.get("grant_type") === "refresh_token"
    && refresh.get("scope") === GOOD.provider.scope && refresh.get("client_secret") === LAB_SECRET,
    "sl3 the exchange's and the refresh's forms are the same builders', the file's secret carried as a provider's own: " + JSON.stringify([f.code, f.refresh]));
  const asks = f.asks || [];
  const shape = (x) => JSON.stringify([x.method, x.headers, x.body, x.redirect, x.cache]);
  check(asks.length === 2 && asks[0].url === GOOD.provider.token && asks[1].url === MS_TOKEN && shape(asks[0]) === shape(asks[1]),
    "sl3 the token request to the lab is the one bounded call, its verb, headers, body, redirect and cache as one to Microsoft's address: " + JSON.stringify(asks.map((x) => x.url)));
} else for (let i = 0; i < 3; i++) skip("sl3 (SIGNIN_LAB_ONLY=" + ONLY + ")");

if (leg("sl4")) {
  const require = createRequire(import.meta.url);
  const { labOf, labNow } = require(path.join(ROOT, "src", "signin-lab.cjs"));
  const withP = (k, v) => Object.assign({}, GOOD, { provider: Object.assign({}, GOOD.provider, { [k]: v }) });
  const bad = {
    "non-loopback http authorize": withP("authorize", "http://192.168.1.10:" + LAB_PORT + "/authorize"),
    "non-loopback http token": withP("token", "http://example.com:" + LAB_PORT + "/token"),
    "localhost by name": withP("token", "http://localhost:" + LAB_PORT + "/token"),
    "https anywhere": withP("authorize", "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"),
    "no port": withP("token", "http://127.0.0.1/token"),
    "a user": withP("token", "http://u@127.0.0.1:" + LAB_PORT + "/token"),
    "a query": withP("token", LAB + "/token?x=1"),
    "a dot segment": withP("token", LAB + "/a/%2e%2e/token"),
    "a jwks elsewhere": withP("jwks", "http://10.0.0.1:" + LAB_PORT + "/jwks"),
    "an https issuer off .localhost": withP("issuer", "https://localhost.example.com:" + LAB_PORT),
    "an https token at a .localhost name": withP("token", "https://oidc-lab.localhost:" + LAB_PORT + "/token"),
    "a scope without openid": withP("scope", "profile"),
    "no service": Object.assign({}, GOOD, { service: undefined }),
    "another provider's id": withP("id", "microsoft"),
    "no client id": withP("clientId", ""),
    "a service elsewhere": Object.assign({}, GOOD, { service: "http://example.com:" + SERVICE_PORT + "/licence/v1/" }),
    "a service of another shape": Object.assign({}, GOOD, { service: "http://127.0.0.1:" + SERVICE_PORT + "/licence/v1" }),
    "a root not of its shape": Object.assign({}, GOOD, { root: "AB".repeat(32) }),
    "an https service off etiuda.dev": Object.assign({}, GOOD, { service: "https://example.com/licence/v1/" }),
    "a client id for another provider": Object.assign({}, GOOD, { clientIds: { okta: "x" } }),
    "a client id of another shape": Object.assign({}, GOOD, { clientIds: { microsoft: "" } }),
    "nothing at all": {},
  };
  /* Taken as well: the test architect's provider double's own issuer (https at a .localhost name), no key set, no provider, no root. */
  const fine = {
    "the good file": GOOD,
    "the double's https issuer and key set": withP("issuer", "https://oidc-lab.localhost:" + LAB_PORT),
    "no jwks": withP("jwks", undefined),
    "a service alone": { service: GOOD.service },
    "staging with client ids": { service: "https://etiuda.dev/licence-staging/v1/", clientIds: { google: "g-1" } },
  };
  fine["the double's https issuer and key set"].provider.jwks = "https://oidc-lab.localhost:" + LAB_PORT + "/jwks";
  const taken = Object.entries(bad).filter(([, d]) => !labOf(JSON.stringify(d)).refused).map(([k]) => k);
  const refusedFine = Object.entries(fine).filter(([, d]) => labOf(JSON.stringify(d)).refused).map(([k]) => k + " (" + labOf(JSON.stringify(d)).refused + ")");
  check(taken.length === 0 && refusedFine.length === 0 && !!labOf("not json").refused && !!labOf("{}").refused,
    "sl4 each bad file is refused whole and each good one taken: " + (taken.length ? "taken: " + taken.join(", ") + " " : Object.keys(bad).length + " refused ")
    + (refusedFine.length ? "refused: " + refusedFine.join(", ") : Object.keys(fine).length + " taken"));
  check(labNow({}, false, () => { throw new Error("read"); }) === null && labNow({ ETIUDA_SIGNIN_LAB: "x" }, true, () => JSON.stringify(GOOD)) === null
    && labNow({ ETIUDA_SIGNIN_LAB: "x" }, false, () => { throw new Error("gone"); }) === null && !!labNow({ ETIUDA_SIGNIN_LAB: "x" }, false, () => JSON.stringify(GOOD)),
    "sl4 no variable, a packaged copy or an unreadable file is no lab; a readable good file in a tree is one");
  const refused = run(ROOT, labAt("non-loopback", bad["non-loopback http token"]));
  const a = asText(refused.got), t = asText(treeBare.got);
  check(!!refused.got && a === t && /ETIUDA_SIGNIN_LAB is not taken/.test(refused.err),
    "sl4 a file naming a non-loopback http host leaves the tree as it is without the variable, and says so" + (refused.got ? firstDiff(a, t) : ": " + refused.tail));
} else for (let i = 0; i < 3; i++) skip("sl4 (SIGNIN_LAB_ONLY=" + ONLY + ")");

const STAGING = { clientIds: { microsoft: "11112222-3333-4444-5555-666677778888", google: "123456789012-lab.apps.googleusercontent.com" },
  service: "https://etiuda.dev/licence-staging/v1/" };
if (leg("sl5")) {
  const file = labAt("staging", STAGING);
  const tree = run(ROOT, file), inst = run(INSTALLED, file);
  const g = tree.got || {}, now = g.now ? JSON.parse(g.now) : [], shipped = g.shipped ? JSON.parse(g.shipped) : [];
  const sameButId = now.length === 2 && now.every((p, i) => JSON.stringify(Object.assign({}, p, { clientId: "" })) === JSON.stringify(Object.assign({}, shipped[i], { clientId: "" })));
  check(sameButId && now[0].clientId === STAGING.clientIds.microsoft && now[1].clientId === STAGING.clientIds.google && JSON.stringify(g.offered) === '["microsoft","google"]',
    "sl5 the staging file gives Microsoft and Google its client ids, every other field the shipped one's, and offers both: " + JSON.stringify(now.map((p) => [p.id, p.clientId, p.authorize])));
  check(JSON.stringify(g.licence) === JSON.stringify([STAGING.service + "check", STAGING.service + "note/studio"]) && g.trusted === EMBEDDED && g.roots === "(undefined)"
    && JSON.stringify(g.pages) === JSON.stringify((treeBare.got || {}).pages) && JSON.stringify(g.tokenAsk) === JSON.stringify((treeBare.got || {}).tokenAsk),
    "sl5 the licence door and the note at staging, the shipped root kept, the sign-in door as without the file: " + JSON.stringify([g.licence, g.trusted === EMBEDDED, g.roots]));
  const a = asText(inst.got), t = asText(treeBare.got);
  check(!!inst.got && a === t && inst.got.reads === 0, "sl5 installed, the staging file changes nothing and is never read" + (inst.got ? firstDiff(a, t) + " reads=" + inst.got.reads : ": " + inst.tail));
  const half = run(ROOT, labAt("staging-half", { service: STAGING.service, clientIds: { microsoft: STAGING.clientIds.microsoft } })), h = half.got || {};
  const hNow = h.now ? JSON.parse(h.now) : [];
  check(JSON.stringify(h.offered) === '["microsoft"]' && hNow.length === 2 && hNow[0].clientId === STAGING.clientIds.microsoft && hNow[1].clientId === "",
    "sl5 a staging file naming Microsoft's client id alone offers Microsoft alone, Google holding none: " + JSON.stringify(hNow.map((p) => [p.id, p.clientId])));
} else for (let i = 0; i < 4; i++) skip("sl5 (SIGNIN_LAB_ONLY=" + ONLY + ")");

if (leg("sl6")) {
  const require = createRequire(import.meta.url);
  const { devGoogleSecret } = require(path.join(ROOT, "src", "signin-lab.cjs"));
  const SHAPE = /^[\x21-\x7e]{8,200}$/, V = ["stand", "in", "google", "0000"].join("-");
  const dev = devGoogleSecret({ ETIUDA_GOOGLE_CLIENT_SECRET: V }, false, SHAPE), packed = devGoogleSecret({ ETIUDA_GOOGLE_CLIENT_SECRET: V }, true, SHAPE);
  check(!!dev && dev.google === V && packed === null && devGoogleSecret({}, false, SHAPE) === null && devGoogleSecret({ ETIUDA_GOOGLE_CLIENT_SECRET: V.slice(0, 5) }, false, SHAPE) === null,
    "sl6 the variable gives Google's secret in a development Studio, of the packaged file's shape, and nothing packaged: " + JSON.stringify([dev, packed]));
  const shell = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8").replace(/\r\n/g, "\n");
  const read = "if (PACKAGED) { try { signinPacked = signinSecretRead(", at = shell.indexOf(read);
  const next = at >= 0 ? shell.slice(at).split("\n").filter((l) => !/^\s*(\/\*|\*)|^\s+[a-z]/.test(l)).slice(0, 2) : [];
  const uses = shell.split("devGoogleSecret(").length - 1;
  check(uses === 1 && next.length === 2 && next[1].startsWith('else { const lab = require(path.join(ROOT, "src", "signin-lab.cjs")); const g = lab.devGoogleSecret(process.env, lab.PACKAGED, SIGNIN_SECRET_SHAPE);'),
    "sl6 the shell asks for the variable once, in the else of its packaged read, under signin-lab's packaged test: " + uses + " use(s); " + JSON.stringify(next[1] || ""));
} else for (let i = 0; i < 2; i++) skip("sl6 (SIGNIN_LAB_ONLY=" + ONLY + ")");

if (leg("sl7")) {
  const cmd = fs.readFileSync(path.join(ROOT, "tools", "signin-staging.cmd"), "utf8");
  const builder = fs.readFileSync(path.join(ROOT, "electron-builder.js"), "utf8");
  const files = builder.slice(builder.indexOf("files: ["), builder.indexOf("],", builder.indexOf("files: [")));
  const globs = [...files.replace(/\/\/[^\n]*/g, "").matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  const parts = {
    notShipped: globs.length > 5 && !globs.some((g) => /^tools\b|^\*\*|^\*$/.test(g)),
    labFromArgument: /^set "ETIUDA_SIGNIN_LAB=%~f1"\r?$/m.test(cmd),
    thisTree: /^call "%TREE%\\node_modules\\\.bin\\electron\.cmd" \.\r?$/m.test(cmd) && /^set "TREE=%~dp0\.\."\r?$/m.test(cmd),
    notInstalled: !/Programs\\Etiuda Studio|ProgramFiles|^start /m.test(cmd),
    noSecret: !/CLIENT_SECRET=/.test(cmd),
  };
  check(Object.values(parts).every(Boolean), "sl7 tools/signin-staging.cmd is outside electron-builder's files, and starts this development tree with the variable set to the"
    + " file it is handed, no secret written in it (its statements read, never run): " + Object.entries(parts).map(([k, v]) => k + "=" + v).join(" "));
} else skip("sl7 (SIGNIN_LAB_ONLY=" + ONLY + ")");

if (!ONLY) {
  copyPlants({
    root: ROOT, self: SELF, label: "signin-lab", onlyVar: "SIGNIN_LAB_ONLY", check, skip,
    plants: [{ mark: "lab-packaged", leg: "sl1", rel: "src/signin-lab.cjs", line: "const PACKAGED = false;" },
      { mark: "lab-fill", leg: "sl2", rel: "src/licence-client.mjs",
        line: "  return Object.freeze(SIGN_IN_PROVIDERS.map((p) => Object.freeze(Object.assign({}, p, { clientId: typeof ids[p.id] === \"string\" ? ids[p.id] : \"planted-id\" })))" }],
  });
} else { skip("plant lab-packaged (SIGNIN_LAB_ONLY=" + ONLY + ")"); skip("plant lab-fill (SIGNIN_LAB_ONLY=" + ONLY + ")"); skip("the checkout after the plants (SIGNIN_LAB_ONLY=" + ONLY + ")"); }

dropScratch(SCRATCH, "signin-lab");
check(asserted + skipped + 1 === EXPECTED, "sl every leg ran: " + (asserted + skipped + 1) + " of " + EXPECTED + (skipped ? ", " + skipped + " skipped" : ""));
process.stdout.write("signin-lab: " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)\n");
process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + "\n");
process.exit(failed ? 1 : 0);
