/* THE WHOLE INVITATION, END TO END, ON A RELAY TEAM AND AGAINST THE SERVICE'S STAND-IN (the test architect's leg, 2026-11-22).
 *
 *     node tests/invite-e2e.mjs        exit code is the number of failed checks, capped at 63; 78 where it did not complete
 *
 * gate-kind: node
 *
 * THE CRITERION, Claude alpha's order of 2026-11-22, his words: "one end-to-end leg of the whole invitation, on a relay team and
 * against the service's stand-in: the lead invites an address, the person signs in with it, presses Join, is seated, their desk is let
 * in at the relay door with no further act by anyone, and the team's catalog arrives." Two class B faults on this path were found by
 * reading code and by no run; this is the run. Each Join kind is its own row of checks: vouched (the provider vouches for the address,
 * so the Join is accepted at once) and unvouched (Studio's lead confirms it through studio:person-confirm).
 *
 * WHAT RUNS, AND WHAT IS STOOD IN:
 *   - the licence service is its real Worker (service/licence/worker.mjs's rules, core.mjs) over tests/d1-stand-in.mjs, as
 *     tests/licence-studio.mjs runs it, with its root the pinned relay's test root (relay/test/grant-kit.cjs), so the seat
 *     certificates and doors it signs are the ones the lab's relay and Studio both trust; the providers are stood in by test RSA keys;
 *   - Studio is shell/main.js loaded with no window, as tests/relay-studio.mjs loads it: its own handlers (studio:person-invite,
 *     studio:people-list, studio:person-confirm, studio:licence-check), its own relay sync and its own watch, the watch's admission
 *     src/studio.mjs watchAdmit run in this process; its one door (src/wire.cjs) reaches the service for /licence/v1/ and the lab's
 *     relay for everything else; Studio signs in through its own client (src/licence-client.mjs signIn), as licence-studio's signedIn;
 *   - the relay is the pinned engine's, in memory (tests/relay-lab.mjs).
 *
 * THE DESK IS DRIVEN AT PROTOCOL LEVEL, NOT THROUGH THE PINNED DESK'S SHELL. The pin (tools/engine-pin, 8700a8e0) has no Join and does
 * not read `invited`: the desk's half of board 1017 is on the engine's branch engine-1017-desk-2026-11-22 (shell/main.js signinJoinNow,
 * signinJoinBody), not yet pinned. So the desk here is: its own Ed25519 key, its sign-in to signin/desk signed over requests.mjs's
 * signinDeskBytes with the nonce bound to its key, its Join to the route ask signed over the bytes the 1017 desk writes (restated below
 * and held equal to requests.mjs askBytes), its quiet renewal (a refreshed token, no nonce, no seed), and its knock at the door the
 * service handed it, made by the pinned channel layer (shell/relay/channel.cjs, the A4 door) with the service's certificate as its
 * seat, as tests/relay-studio.mjs's a4Desk knocks. Once the pin carries the desk's Join, the desk half can move to the pinned shell.
 *
 *   ie1   CONTROL: Studio is signed in to the service as the licence's owner, its licence reference kept, and its own sync opens the
 *         relay team's standing door at that reference and sets the door at the service
 * For each kind, k = v (vouched, a Google account whose address the provider verifies) and u (unvouched, a personal Microsoft account):
 *   ie2k  the lead invites the address through studio:person-invite: a handle back, one invitation at the service for this lead and team
 *   ie3k  the person's desk signs in with that address and is shown the invitation: this licence, this lead, this team; marked
 *         for the lead's confirmation only where unvouched
 *   ie4k  the person presses Join, signed as the 1017 desk signs it (its bytes equal requests.mjs askBytes): accepted at once where
 *         vouched; waiting where unvouched
 *   ie4c  (unvouched only) the lead sees the Join on studio:people-list's confirms and confirms it through studio:person-confirm
 *   ie5k  the person is seated: the desk's quiet renewal brings a seat certificate for its key on Studio's licence reference, and the
 *         doors list, signed by the service, names this team's door with the lead's key and box
 *   ie6k  the desk knocks at that door with that certificate and its request reaches Studio's mirror, named by the relay
 *   ie7k  the desk is let in at the relay door with no further act by anyone: Studio's own watch admits it, writes joined at its door
 *         id and enrols its key at the relay
 *   ie8k  the team's catalog arrives: the desk holds the team key from its own wrap, and the edition in its mirror opens under it to
 *         the edition Studio published
 *   ie9   (the lead engineer's, for the test architect's read of c2ccb0e1, finding 1) a member the lead removed, with no withdrawal owed and the
 *         service still listing them seated on the team, is not let in at the door by a new desk of theirs, across two looks
 *   ie10  (finding 2) a member whose last interactive sign-in is forty days old, placed by their own Join and seated by a quiet renewal, is
 *         let in at the door with nobody acting
 *   iep   PLANTS in a scratch copy (tests/plant-copy.mjs): the service's Join taking no desk (core.mjs plant press-desk) turns ie5v
 *         red, and the lead's confirm seating nobody (plant accept-desk) turns ie5u red; the checkout is unchanged after
 *
 * ON STUDIO FOLD 95 (f3a3e4e3) ie7v, ie7u, ie8v and ie8u are red and every check before them green: src/studio.mjs watchAdmit's
 * `known` lets in a desk with no invitation only where a roster certificate or team-people.json names its person, and nothing writes
 * team-people.json for a Join the service accepted or Studio confirmed (the review findings register, 2026-11-22). The leg is to turn
 * green unchanged once Studio counts as known everyone the service seated on that relay team through a Join.
 *
 * Throwaway keys and invented names and addresses only; no window, no network, no registry. Lab folders are made under scratch/ and
 * left there. INVITE_E2E_ONLY=<check id> runs that check's kind up to that check and no plants (the plants' child).
 */
import "./reg-stand-on.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import module, { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { olderFolderTeam } from "./older-folder-team.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SELF = fileURLToPath(import.meta.url);
const nodeRequire = createRequire(import.meta.url);
const NL = "\n";
const ONLY = process.env.INVITE_E2E_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const EXPECTED = 21;
const HOUR = 3600000, DAY = 24 * HOUR;

/* The pin's catalog-v2.js is an ES module in a folder whose package.json says CommonJS; read by its syntax, as
   tests/licence-studio.mjs reads it, for the Worker's imports. Registered before anything that could load it. */
module.registerHooks({
  load(url, context, next) {
    if (/\/engine\/pinned\/src\/modules\/catalog-v2\.js$/.test(url)) {
      const r = next(url, Object.assign({}, context, { format: "module" }));
      return Object.assign({}, r, { format: "module" });
    }
    return next(url, context);
  },
});

const at = (rel) => pathToFileURL(path.join(ROOT, rel)).href;
const W = await import(at("service/licence/worker.mjs"));
const CORE = await import(at("service/licence/core.mjs"));
const RQ = await import(at("service/licence/requests.mjs"));
const { standInD1 } = await import("./d1-stand-in.mjs");
const L = await import("../src/licence.mjs");
const Client = await import("../src/licence-client.mjs");
const Relay = await import("../src/relay.mjs");
const Engine = await import("../src/engine.mjs");
const K = await import("../src/team-store.mjs");
const Studio = await import("../src/studio.mjs");
const { makePair, osFile, readKeyFile, unlockKey, openLeadBox, OS_WRAP } = await import("../src/sign.mjs");
const { withChannel, writeTeam, heldTeam } = await import("../src/team.mjs");
const { relayWorld, keyPair, boxPair, agreeWith, deskProgram, settle, until, labDir, put, read, hex, wait, placeGrant, GRANT_ROOT_PUB, grantKit } =
  await import("./relay-lab.mjs");
const { seatEnv } = await import("./seated.mjs");
const { licensedOpts } = await import("./licensed.mjs");
const { copyPlants } = await import("./plant-copy.mjs");

let asserted = 0, failed = 0, skipped = 0;
function check(ok, line) {
  asserted++;
  if (ok) process.stdout.write("  ok   " + line + NL);
  else { failed++; process.stdout.write("  FAIL " + line + NL); }
}
function skip(line) { skipped++; process.stdout.write("  SKIP  " + line + NL); }
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const short = (v) => JSON.stringify(v === undefined ? null : v).slice(0, 220);

/* ---- the providers: test RSA keys served as Microsoft's and Google's published keys -------------------------------------- */

const SHAPES = JSON.parse(fs.readFileSync(path.join(ROOT, "tests", "fixtures", "signin-token-shapes.json"), "utf8"));
const MS_JWKS = "https://login.microsoftonline.com/common/discovery/v2.0/keys", GOOGLE_JWKS = "https://www.googleapis.com/oauth2/v3/certs";
const MS_CLIENT = "00001111-aaaa-2222-bbbb-3333cccc4444", GOOGLE_CLIENT = "123456789012-a1b2c3d4e5f6g7h8.apps.googleusercontent.com";
/* The lead's organisation's tenant (a work tenant the licence admits) and Microsoft's consumer tenant (a personal account). */
const TENANT = "aaaabbbb-0000-cccc-1111-dddd2222eeee", CONSUMERS = "9188040d-6c67-4c5b-b112-36a304b66dad";
const msIss = (tid) => "https://login.microsoftonline.com/" + tid + "/v2.0";
function rsaKey(kid) {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = publicKey.export({ format: "jwk" });
  return { kid, privateKey, jwk: { kty: "RSA", use: "sig", kid, n: jwk.n, e: jwk.e } };
}
const RSA = { ms: rsaKey("ms-key-1"), consumer: rsaKey("ms-consumer-1"), google: rsaKey("g-key-1") };
const idpFetch = async (url, init) => {
  if (!init || init.redirect !== "manual") throw new Error("the keys are fetched with redirect: manual");
  const respond = (doc) => new Response(JSON.stringify(doc), { status: 200, headers: { "content-type": "application/json", "cache-control": "public, max-age=86400" } });
  if (url === MS_JWKS) return respond({ keys: [Object.assign({}, RSA.ms.jwk, { x5t: RSA.ms.kid, issuer: "https://login.microsoftonline.com/{tenantid}/v2.0" }),
    Object.assign({}, RSA.consumer.jwk, { x5t: RSA.consumer.kid, issuer: msIss(CONSUMERS) })] });
  if (url === GOOGLE_JWKS) return respond({ keys: [Object.assign({ alg: "RS256" }, RSA.google.jwk)] });
  throw new Error("no stand-in answers " + url);
};
const b64u = (b) => Buffer.from(b).toString("base64url");
function jwt(key, header, claims) {
  const h = b64u(JSON.stringify(header)), p = b64u(JSON.stringify(claims));
  return h + "." + p + "." + b64u(crypto.sign("sha256", Buffer.from(h + "." + p), key.privateKey));
}
/** An ID token in the fixture's shape for `kind` ("microsoft" or "google"), its placeholders filled, `over` laid on its claims (a
 *  value undefined drops the claim). No `nonce` drops the claim, as a refreshed token carries none. */
function idToken(kind, f, over) {
  const now = Math.floor(Date.now() / 1000), key = kind === "google" ? RSA.google : f.tid === CONSUMERS ? RSA.consumer : RSA.ms;
  const fill = (v) => typeof v !== "string" ? v : v === "{now}" ? now : v === "{now+3600}" ? now + 3600
    : v.replace("{clientId}", kind === "google" ? GOOGLE_CLIENT : MS_CLIENT).replace("{tid}", f.tid || "").replace("{oid}", f.oid || "")
      .replace("{sub}", f.sub).replace("{nonce}", f.nonce || "").replace("{hd}", "").replace("{uti}", crypto.randomBytes(16).toString("base64url"))
      .replace("{kid}", key.kid);
  const header = Object.fromEntries(Object.entries(SHAPES[kind].header).map(([k, v]) => [k, fill(v)]));
  const claims = Object.fromEntries(Object.entries(SHAPES[kind].claims).map(([k, v]) => [k, fill(v)]));
  if (!f.nonce) delete claims.nonce;
  if (kind === "google") delete claims.hd;
  for (const [k, v] of Object.entries(over || {})) { if (v === undefined) delete claims[k]; else claims[k] = v; }
  return jwt(key, header, claims);
}

/* ---- the service: the real Worker over a fresh stand-in D1, under the lab relay's test root ------------------------------- */

const SCHEMA = fs.readFileSync(path.join(ROOT, "service", "licence", "schema.sql"), "utf8");
const LICENCE_BASE = "https://etiuda.dev/licence/v1/";
function newKey() {
  const privateKey = crypto.generateKeyPairSync("ed25519").privateKey;
  const pub = crypto.createPublicKey(privateKey).export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  return { pub, id: "studio-" + sha(Buffer.from(pub, "hex")).slice(0, 16), privateKey, der: privateKey.export({ type: "pkcs8", format: "der" }).toString("hex") };
}
const SERVICEK = newKey();
let ipN = 0;
function service() {
  const db = standInD1(SCHEMA);
  const now = Date.now();
  const delegation = L.createTestDelegation({ key: { id: SERVICEK.id, pub: SERVICEK.pub }, may: ["licence", "relay-grant"],
    from: now - 10 * DAY, until: now + 300 * DAY }, grantKit.ROOT.privateKey, grantKit.ROOT.id);
  const svc = CORE.makeService({ rules: W.RULES, roots: [GRANT_ROOT_PUB], clock: () => Date.now(), fetch: idpFetch });
  const env = { DB: db, SERVICE_KEY: SERVICEK.der, DELEGATION: JSON.stringify(delegation), HASH_KEY: crypto.randomBytes(32).toString("hex"),
    PROVIDERS: JSON.stringify([{ id: "microsoft", clientId: MS_CLIENT }, { id: "google", clientId: GOOGLE_CLIENT }]) };
  const o = {
    db, env, calls: [],
    async fetch(url, init) {
      const req = new Request(String(url), { method: init.method, body: init.body,
        headers: Object.assign({ "cf-connecting-ip": "198.51.100." + ((++ipN % 250) + 1) + "-" + ipN }, init.headers || {}) });
      return svc.fetch(req, env);
    },
    /** A route asked as Studio's one door asks it: {status, bytes}. */
    ask: async (route, bytes) => {
      const res = await o.fetch(LICENCE_BASE + route, { method: "POST", headers: { "content-type": "application/json" }, body: bytes });
      return { status: res.status, bytes: Buffer.from(await res.arrayBuffer()) };
    },
    /** A route asked by the desk with a JSON body: {status, body}. */
    async call(route, body) {
      const res = await o.fetch(LICENCE_BASE + route, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const text = await res.text();
      let parsed = null;
      try { parsed = text ? JSON.parse(text) : null; } catch { parsed = null; }
      return { status: res.status, body: parsed };
    },
    /** A paid licence admitting the lead's tenant, owned by the lead's person, as the attach script writes one. */
    licence(k) {
      const personOf = (sub) => crypto.createHmac("sha256", Buffer.from(env.HASH_KEY, "hex")).update("etiuda-licence-person" + NL + msIss(TENANT) + NL + sub).digest("hex");
      const id = Number(db.raw.prepare("INSERT INTO licences (key_hash, email_hash, org, seats, updates_until, paid_until, lead_seats, owner) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .run(crypto.randomBytes(32).toString("hex"), "unused", "Quillmoor Works", k.seats, "2027-11-02", Date.now() + 365 * DAY, k.leadSeats, personOf(k.owner)).lastInsertRowid);
      const org = crypto.createHmac("sha256", Buffer.from(env.HASH_KEY, "hex")).update("etiuda-licence-org\nmicrosoft\n" + TENANT).digest("hex");
      db.raw.prepare("INSERT INTO admits (licence, provider, org) VALUES (?, ?, ?)").run(id, "microsoft", org);
      return { id };
    },
  };
  return o;
}

/* ---- the shell, loaded with no window, its door answered by the service and the lab's relay ------------------------------- */

const SHELL_VAULT = {
  isEncryptionAvailable: () => true,
  encryptString: (s) => Buffer.from("sealed:" + Buffer.from(String(s), "utf8").reverse().toString("hex"), "utf8"),
  decryptString: (b) => {
    const t = Buffer.from(b).toString("utf8");
    if (!t.startsWith("sealed:")) throw new Error("not sealed here");
    return Buffer.from(t.slice(7), "hex").reverse().toString("utf8");
  },
};
const shellVault = () => ({ available: () => true, seal: (t) => SHELL_VAULT.encryptString(t), open: (b) => SHELL_VAULT.decryptString(b) });
async function labLeadKey() { const pair = await makePair(); return osFile(pair, SHELL_VAULT.encryptString(pair.der)); }
function labSecret(keyFile) {
  const r = readKeyFile(keyFile);
  if (!r || r.kept !== OS_WRAP) throw new Error("the lab's key is kept by the vault");
  return String(SHELL_VAULT.decryptString(Buffer.from(String(r.doc.private), "base64")));
}

/** The shell over `ud`: its net.fetch hands /licence/v1/ to `svc` and every other call to the relay transport `relayT`, recording
 *  each; the thread's verbs are answered by `thread`. Answers the shell's handlers, its focus and done(). */
async function loadShell(ud, svc, relayT, thread, env0) {
  const Module = nodeRequire("node:module"), main = path.join(ROOT, "shell", "main.js"), ui = path.join(ROOT, "ui", "index.html");
  const got = { handlers: {}, windows: [], said: [], appOn: {}, calls: [] };
  const bag = (into) => (t, fn) => { (into[t] = into[t] || []).push(fn); };
  class Win {
    constructor() {
      this.wcOn = {}; this.winOn = {};
      this.webContents = { id: 1, on: bag(this.wcOn), once: bag(this.wcOn), send() {}, setWindowOpenHandler() {},
        getURL: () => pathToFileURL(ui).href, reload() {}, forcefullyCrashRenderer() {} };
      got.windows.push(this);
    }
    on(t, fn) { bag(this.winOn)(t, fn); }
    once(t, fn) { bag(this.winOn)(t, fn); }
    isDestroyed() { return false; } isMaximized() { return false; } isMinimized() { return false; }
    close() {} focus() {} restore() {} loadFile() {} show() {} showInactive() {} setMinimumSize() {}
  }
  const wrap = (status, header, bytes) => ({ status, headers: { get: header },
    body: new ReadableStream({ start(c) { if (bytes.length) c.enqueue(new Uint8Array(bytes)); c.close(); } }) });
  const display = { bounds: { x: 0, y: 0, width: 1920, height: 1080 }, workAreaSize: { width: 1920, height: 1032 } };
  const electron = {
    app: { commandLine: { appendSwitch() {}, hasSwitch: () => false, removeSwitch() {} },
      getPath: () => ud, getVersion: () => "0.0.0", getLocale: () => "en-GB",
      requestSingleInstanceLock: () => true, whenReady: () => Promise.resolve(),
      on: (t, fn) => { (got.appOn[t] = got.appOn[t] || []).push(fn); }, quit() {}, exit() {} },
    BrowserWindow: Object.assign(Win, { fromWebContents: () => got.windows[0] || null, getAllWindows: () => got.windows }),
    Menu: { setApplicationMenu() {}, buildFromTemplate: () => ({ popup() {} }) },
    dialog: { showMessageBox: () => Promise.resolve({ response: 0 }),
      showOpenDialog: () => Promise.resolve({ canceled: true, filePaths: [] }),
      showSaveDialog: () => Promise.resolve({ canceled: true, filePath: "" }) },
    nativeTheme: { themeSource: "system", shouldUseDarkColors: false },
    clipboard: { writeText() {} }, safeStorage: SHELL_VAULT,
    screen: { getAllDisplays: () => [display], getPrimaryDisplay: () => display, on() {}, removeListener() {} },
    session: { defaultSession: { setPermissionRequestHandler() {}, setPermissionCheckHandler() {},
      setDevicePermissionHandler() {}, setSpellCheckerLanguages() {}, setSpellCheckerDictionaryDownloadURL() {},
      setSpellCheckerEnabled() {} } },
    shell: { openPath: () => Promise.resolve(""), trashItem: () => Promise.resolve() },
    ipcMain: { handle: (ch, fn) => { got.handlers[ch] = fn; }, on() {} },
    net: { fetch: async (url, init) => {
      const u = String(url);
      got.calls.push(String(init && init.method) + " " + u);
      if (u.indexOf(LICENCE_BASE) === 0) {
        const res = await svc.fetch(u, init);
        const bytes = Buffer.from(await res.arrayBuffer());
        return wrap(res.status, (n) => res.headers.get(n), bytes);
      }
      const r = await relayT.request(String(init && init.method), u, init && init.headers, init && init.body);
      return wrap(r.status, (n) => r.header(n), Buffer.from(r.bytes));
    } },
  };
  const threadStub = { call: (verb, ...a) => thread(verb, ...a) };
  const quiet = { on() {}, unref() {}, kill() {}, pid: 0, stdout: { on() {} }, stderr: { on() {} }, stdin: { end() {}, write() {} } };
  const cp = { execFileSync: () => "", execSync: () => "", spawnSync: () => ({ status: 0, stdout: "", stderr: "" }),
    execFile: () => quiet, spawn: () => quiet, exec: () => quiet, fork: () => quiet };
  const env = Object.assign({ STUDIO_NO_PROXY_SERVER: "off", STUDIO_TEST_OFFSCREEN: "1", XDG_CURRENT_DESKTOP: "GNOME" }, env0);
  /* A Studio that works, as a lead's does: its licence signed by the lab's root, which the shell trusts here (tests/seated.mjs). */
  Object.assign(env, await seatEnv(ud, true, env0, grantKit.ROOT.privateKey), env0);
  const was = {};
  for (const k of Object.keys(env)) { was[k] = process.env[k]; if (env[k] === null) delete process.env[k]; else process.env[k] = env[k]; }
  delete nodeRequire.cache[nodeRequire.resolve(path.join(ROOT, "src", "wire.cjs"))];
  const load = Module._load, write = process.stderr.write, before = new Set(Object.keys(nodeRequire.cache));
  Module._load = function (req) {
    if (req === "electron") return electron;
    if (req === "node:child_process" || req === "child_process") return cp;
    if (/studio-thread\.cjs$/.test(req)) return threadStub;
    return load.apply(this, arguments);
  };
  process.stderr.write = (s) => {
    const line = String(s);
    if (/^studio {2}/.test(line)) { got.said.push(line.trim()); return true; }
    return write.call(process.stderr, s);
  };
  const restore = () => {
    if (restore.did) return;
    restore.did = true;
    Module._load = load; process.stderr.write = write;
    delete nodeRequire.cache[main];
    for (const k of Object.keys(nodeRequire.cache)) if (!before.has(k)) delete nodeRequire.cache[k];
    for (const k of Object.keys(was)) { if (was[k] === undefined) delete process.env[k]; else process.env[k] = was[k]; }
  };
  let opened = false;
  try {
    delete nodeRequire.cache[main];
    nodeRequire(main);
    /* The shell holds src/wire.cjs's exports and reads relayConnect from them at each sync: the lab's socket in its place. */
    nodeRequire(path.join(ROOT, "src", "wire.cjs")).relayConnect = relayT.connect;
    for (let i = 0; i < 1250 && !got.windows.length; i++) await wait(20);
    opened = got.windows.length > 0;
  } finally { if (!opened) restore(); }
  got.win = got.windows[0] || null;
  got.fire = async (t, ...a) => { for (const fn of ((got.win && got.win.winOn[t]) || [])) await fn(...a); };
  got.event = { senderFrame: { parent: null, url: pathToFileURL(ui).href }, sender: got.win && got.win.webContents };
  got.ask = (ch, ...a) => got.handlers[ch](got.event, ...a);
  got.done = async () => {
    try { for (const fn of got.appOn["will-quit"] || []) { try { await fn(); } catch { /* already gone */ } } } finally { restore(); }
  };
  return got;
}

/* ---- the lead: a Studio leading one sealed relay team, an edition published into it, signed in to the service -------------- */

const RING = { format: 1, kind: "etiuda-ring", keys: [] };
async function leadWorld(lab) {
  const world = await relayWorld(), svc = service();
  const lic = svc.licence({ owner: "quill-lead", seats: 4, leadSeats: 3 });
  const ud = path.join(lab, "ud");
  fs.mkdirSync(ud, { recursive: true });
  const keyAt = path.join(ud, "signing-key.json");
  const lead = await labLeadKey();
  fs.writeFileSync(keyAt, JSON.stringify(lead, null, 1) + NL);
  placeGrant(keyAt, lead.public);
  const pass = labSecret(keyAt);
  const teamsFile = K.teamsFile(ud), vault = shellVault(), rt = Relay.relayId(), teamId = "t-" + hex(8);
  K.keepTeamKey(teamsFile, vault, teamId, 1, crypto.randomBytes(32));
  const mirror = K.keepRelay(teamsFile, teamId, rt, Relay.RELAY_URL);
  fs.mkdirSync(mirror, { recursive: true });
  /* The project, a card on a shelf, the team sealed under its key and its channel the relay, and one edition published into it. */
  const made = await Studio.newProject(path.join(lab, "projects"), "Quillmoor Desk", [{ code: "en", name: "English" }]);
  const dir = made && made.dir ? made.dir : made;
  const shelf = (await Studio.addTag(dir, "shelf", { en: "Openers" })).tag.id;
  await Studio.addCard(dir, shelf, "Warm opening", "Good morning, and welcome to Quillmoor.");
  Studio.setPublishFolder(dir, mirror);
  /* The team at the relay mirror is made by the fixture, as relay-studio makes it: Studio's Sealed switch writes no team at a folder
     (the folder team's removal). WAS: await Studio.setTeamSealed(dir, true, { ...the same options }). */
  await olderFolderTeam(dir, { relay: true, key: keyAt, passphrase: pass, teamId, teamKeys: K.teamKeysOf(teamsFile, vault) });
  const sealed = (await heldTeam(mirror, { key: keyAt })).team;
  const written = (await writeTeam(mirror, withChannel(sealed, { kind: "relay", rt, url: Relay.RELAY_URL }, RING), { key: keyAt, passphrase: pass })).team;
  K.chooseSealed(teamsFile, teamId, true, mirror, written);
  const pub = await Studio.publishProject(dir, { folder: mirror, notes: "Edition one.", leadKey: keyAt, teamKeys: K.teamKeysOf(teamsFile, vault),
    key: keyAt, passphrase: pass, ...(await licensedOpts()) });
  const catalogId = JSON.parse(fs.readFileSync(path.join(dir, "project.json"), "utf8")).id;
  /* Signed in, as the shell's own sign-in leaves a Studio (its browser and loopback are tests/sign-in.mjs's): the sign-in sent through
     Studio's own client to the service's signin route, licence-service.json written as licenceAct writes it (licence-studio signedIn). */
  const open = unlockKey(readKeyFile(keyAt), pass), seed = crypto.randomBytes(32).toString("hex");
  const token = idToken("microsoft", { tid: TENANT, sub: "quill-lead", oid: crypto.randomUUID(), nonce: await RQ.signinNonce(open.public, seed) },
    { name: "Quill Lead", preferred_username: "quill.lead@quillmoor.example.invalid" });
  const signed = await Client.signIn(svc.ask, open, "microsoft", token, Date.now(), seed);
  fs.writeFileSync(path.join(ud, "licence-service.json"), JSON.stringify(Object.assign({ by: "signin", lead: open.public, provider: "microsoft", checked: 0, tried: 0 },
    Client.keepWho({}, signed))));
  const box = (() => { try { return openLeadBox(readKeyFile(keyAt), unlockKey(readKeyFile(keyAt), pass)).public; } catch { return ""; } })();
  const admitted = [];
  const thread = async (verb, ...a) => {
    if (verb === "watchAdmit") {
      const r = await Studio.watchAdmit(...a);
      for (const id of (r && Array.isArray(r.admitted) ? r.admitted : [])) admitted.push(id);
      return r;
    }
    if (verb === "inviteTarget" || verb === "teamFacts") return Studio[verb](...a);
    return {};
  };
  const t = world.transport("shell");
  const shell = await loadShell(ud, svc, t, thread, { STUDIO_PROJECTS: path.join(lab, "projects"), STUDIO_SIGNING_KEY: keyAt,
    STUDIO_RELAY_ROOT: GRANT_ROOT_PUB, STUDIO_VENDOR_KEY: GRANT_ROOT_PUB });
  const state = () => { try { return JSON.parse(fs.readFileSync(path.join(ud, "licence-service.json"), "utf8")); } catch { return {}; } };
  /* The window's focus runs the watch, and the watch ends in a relay sync: the way to ask the shell for a look. */
  const focusUntil = async (done, n) => { for (let i = 0; i < (n || 8); i++) { await shell.fire("focus"); if (await until(done, 5000)) return true; } return false; };
  return { world, svc, lic, ud, keyAt, lead, box, teamsFile, vault, rt, teamId, mirror, dir, pub, catalogId, signed, shell, t, admitted, state, focusUntil };
}

/* ---- the desk, at protocol level (see the head of this file) ----------------------------------------------------------------- */

/** The bytes the 1017 desk signs for a Join (engine branch engine-1017-desk-2026-11-22, shell/main.js signinJoinBytes), restated. */
const JOIN_LINE = "etiuda-licence-ask";
const deskJoinBytes = (o) => Buffer.from(JOIN_LINE + "\n" + [o.kind, o.key, o.licence, o.lead, o.team || "-", o.t].map(String).join("\n"), "utf8");
const signHex = (who, bytes) => crypto.sign(null, Buffer.from(bytes), who.privateKey).toString("hex");

function person(kind, word, address) {
  const who = Object.assign(keyPair(true), { box: boxPair() });
  const sub = word + "-" + hex(4), oid = crypto.randomUUID();
  /* Vouched: a Google account whose address Google verifies (email_verified true, no hosted domain). Unvouched: a personal Microsoft
     account, whose address the service treats as unvouched whatever the token says (board 1017, Claude alpha's rule of 02:30). */
  const token = (nonce) => kind === "v"
    ? idToken("google", { sub, nonce }, { name: "Orla Vance", email: address, email_verified: true })
    : idToken("microsoft", { tid: CONSUMERS, sub, oid, nonce }, { name: "Teodor Brask", preferred_username: address, email: address });
  return { kind, word, address, who, provider: kind === "v" ? "google" : "microsoft", token, held: new Map(), answers: [] };
}
/** The desk's sign-in (route signin/desk): an interactive one binds a fresh token to the desk's key by its nonce and signs the seed;
 *  `renew`, a quiet renewal, sends a refreshed token (no nonce) and no seed. */
async function deskSignin(svc, P, renew) {
  const seed = renew ? undefined : crypto.randomBytes(32).toString("hex");
  const tok = P.token(renew ? undefined : await RQ.signinNonce(P.who.pub, seed));
  const t = Date.now();
  const bytes = RQ.signinDeskBytes({ provider: P.provider, tokenHash: sha(tok), desk: P.who.pub, t, seed });
  const body = { provider: P.provider, idToken: tok, desk: P.who.pub, t, sig: signHex(P.who, bytes) };
  if (seed !== undefined) body.seed = seed;
  return svc.call("signin/desk", body);
}
/** The Join, as the 1017 desk's signinJoinBody builds it from an `invited` entry. */
function joinBody(P, inv, t) {
  const bytes = deskJoinBytes({ kind: "desk", key: P.who.pub, licence: inv.licence, lead: inv.lead.person, team: inv.team, t });
  return { bytes, body: Object.assign({ kind: "desk", key: P.who.pub, licence: inv.licence, lead: inv.lead.person }, inv.team ? { team: inv.team } : {},
    { t, sig: signHex(P.who, bytes) }) };
}
/** The desk's knock at the door `d` the service handed it, with the service's certificate `cert` as its seat: its request written
 *  into its mirror carrying the seat, rewritten with the door id once the relay names it (onDoor), and the pinned channel's A4
 *  knock carrying the certificate and the lead's box from the door, as tests/relay-studio.mjs's a4Desk knocks. */
function knock(S, lab, P, d, cert) {
  const J = Engine.joinRules(), who = P.who, name = "desk-" + P.word;
  const seat = { format: 2, desk: who.keyId, certificate: cert };
  const door = { door: cert, box: d.box, inv: "" };
  const commit = J.joinCommit(d.team, who.pub, who.box.pub, hex(32));
  const write = () => {
    const req = { format: 1, kind: J.JOIN_KIND, team: d.team, desk: { id: who.keyId, key: who.pub, box: who.box.pub, name: P.kind === "v" ? "Orla's desk" : "Teodor's desk" },
      date: new Date().toISOString(), commit, seat };
    if (door.inv) req.door = door.inv;
    req.sig = { alg: "Ed25519", keyId: who.keyId };
    req.sig.value = crypto.sign(null, J.joinSignedBytes(req), who.privateKey).toString("hex");
    put(path.join(lab, name), "desks/" + who.keyId + "/join.json", JSON.stringify(req, null, 1) + NL);
  };
  write();
  const pin = { teamId: d.team, rt: d.rt, lead: { keyId: d.keyId, public: d.lead } };
  const D = deskProgram(S.world, lab, name, who, { channel: { rt: d.rt, url: d.url, pin: () => pin, seat: () => cert,
    keyFor: (e) => P.held.get(e) || null, sealEpoch: () => (P.held.size ? Math.max(...P.held.keys()) : null), agree: agreeWith(who.box),
    invite: () => door, onDoor: (id) => { door.inv = id; write(); }, onAnswer: (a) => P.answers.push(a),
    onTeam: () => {
      let doc = null;
      try { doc = JSON.parse(read(path.join(lab, name), S.world.C.TEAM_NAME)); } catch { return; }
      const mine = (doc.roster || []).find((e) => e && e.desk && e.desk.id === who.keyId);
      const key = mine ? Engine.hpkeRules().unwrapTeamKey(who.box.priv, mine.wrap, d.team, doc.epoch, who.keyId) : null;
      if (key) P.held.set(doc.epoch, key);
    } } });
  return Object.assign(D, { door });
}

/* ---- the run ----------------------------------------------------------------------------------------------------------------- */

const desks = [];
/** One kind's row, ie2k to ie8k, against the lead world S. Stops after `stopAt` where given (the plants' child). */
async function oneKind(S, lab, kind, address, stopAt) {
  const k = kind, P = person(kind, kind === "v" ? "orla" : "teodor", address);
  const stop = (id) => !!stopAt && id === stopAt;
  /* ie2: the lead invites the address through the shell's own handler. */
  const inv = await S.shell.ask("studio:person-invite", S.dir, address);
  const rows = S.svc.db.raw.prepare("SELECT team, lead FROM invites WHERE licence = ?").all(S.lic.id).filter((r) => r.team === S.teamId);
  check(!!inv && /^[0-9a-f]{32}$/.test(String(inv.invite)) && !inv.error && rows.length >= 1,
    "ie2" + k + " the lead invites " + address + " through studio:person-invite: a handle back and an invitation at the service for this lead's team "
    + short({ invite: inv && inv.invite, error: inv && inv.error, atService: rows.length }));
  if (stop("ie2" + k)) return;
  /* ie3: the person signs in with that address and is shown the invitation. */
  const s1 = await deskSignin(S.svc, P, false);
  const shown = ((s1.body && s1.body.invited) || []).filter((x) => x && x.team === S.teamId);
  const one = shown[0] || null;
  const marked = !!one && (kind === "v" ? !one.confirm : one.confirm === true);
  check(s1.status === 200 && !!one && one.licence === S.state().licenceRef && !!one.lead && typeof one.lead.person === "string" && marked,
    "ie3" + k + " the person's desk signs in with " + address + " and is shown the invitation on this licence, from this lead, for this team, "
    + (kind === "v" ? "with no confirmation asked (vouched)" : "marked for the lead's confirmation (unvouched)") + ": "
    + short({ status: s1.status, invited: s1.body && s1.body.invited, reason: s1.body && s1.body.reason }));
  if (stop("ie3" + k)) return;
  /* ie4: the Join, signed as the 1017 desk signs it. */
  let join = { status: 0, body: null }, same = false;
  if (one) {
    const t = Date.now(), jb = joinBody(P, one, t);
    same = Buffer.compare(Buffer.from(jb.bytes), Buffer.from(RQ.askBytes({ kind: "desk", key: P.who.pub, licence: one.licence, lead: one.lead.person, team: one.team, t }))) === 0;
    join = await S.svc.call("ask", jb.body);
  }
  const want = kind === "v" ? "accepted" : "waiting";
  check(same && join.status === 200 && !!join.body && join.body.ok === true && join.body.state === want,
    "ie4" + k + " the person presses Join, signed over the bytes the 1017 desk writes (equal to requests.mjs askBytes: " + same + "), and the service answers "
    + want + ": " + short({ status: join.status, body: join.body }));
  if (stop("ie4" + k)) return;
  if (kind === "u") {
    /* ie4c: the lead confirms the unvouched Join through the shell's own handlers. */
    const list = await S.shell.ask("studio:people-list", S.dir);
    const c = ((list && list.confirms) || []).find((x) => x && x.address === address) || ((list && list.confirms) || [])[0] || null;
    const conf = c ? await S.shell.ask("studio:person-confirm", S.dir, c.ask) : null;
    check(!!c && !!conf && conf.confirmed === true,
      "ie4c the lead sees the unvouched Join on studio:people-list's confirms and confirms it through studio:person-confirm: "
      + short({ confirms: list && list.confirms, confirmed: conf }));
    if (stop("ie4c")) return;
  }
  /* ie5: seated, read from the desk's quiet renewal. */
  const s2 = await deskSignin(S.svc, P, true);
  const cert = s2.body && s2.body.certificate;
  const doors = (s2.body && s2.body.doors) || [];
  const d = doors.find((x) => x && x.team === S.teamId) || null;
  let signedDoors = false;
  try {
    signedDoors = !!cert && crypto.verify(null, Buffer.from(RQ.seatDoorsBytes({ certificate: cert, doors })),
      crypto.createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(SERVICEK.pub, "hex")]), format: "der", type: "spki" }),
      Buffer.from(String(s2.body.doorsSig), "hex"));
  } catch { signedDoors = false; }
  const seated = s2.status === 200 && !!cert && cert.desk === P.who.pub && cert.licence === S.state().licenceRef && !!d && d.rt === S.rt
    && d.keyId === S.lead.keyId && d.lead === S.lead.public && d.box === S.box && d.url === Relay.RELAY_URL && signedDoors;
  check(seated, "ie5" + k + " the person is seated: the desk's quiet renewal brings a seat certificate for its key on Studio's licence reference, and the"
    + " doors, signed by the service, name this team's door with the lead's key and box: "
    + short({ status: s2.status, reason: s2.body && s2.body.reason, certLicence: cert && cert.licence, ref: S.state().licenceRef, door: d, signed: signedDoors }));
  if (stop("ie5" + k)) return;
  if (!seated) {
    for (const id of ["ie6", "ie7", "ie8"]) check(false, id + k + " not reached: the person was not seated (ie5" + k + ")");
    return;
  }
  /* ie6: the knock reaches Studio's mirror. */
  const D = knock(S, lab, P, d, cert);
  desks.push(D);
  D.ch.start(); await settle(D.ch);
  const reqAt = "desks/" + P.who.keyId + "/join.json";
  const reached = await S.focusUntil(async () => { await settle(D.ch); return /^[0-9a-f]{32}$/.test(D.door.inv) && !!read(S.mirror, reqAt); }, 6);
  check(reached, "ie6" + k + " the desk knocks at the door the service handed it, with the service's certificate, and its request reaches Studio's mirror named by"
    + " the relay: " + short({ door: D.door.inv, inMirror: !!read(S.mirror, reqAt), said: D.said.slice(-3) }));
  /* ie7: let in at the relay door with nobody acting. */
  const store = () => S.world.store(S.rt);
  const answered = () => !!D.door.inv && S.world.entries(S.rt).some(([key, v]) => key.startsWith("blob:") && v.place === "answer:" + D.door.inv);
  const letIn = await S.focusUntil(async () => { await settle(D.ch); return S.admitted.indexOf(P.who.keyId) >= 0 && answered() && !!store() && !!store().get("dev:" + P.who.keyId); }, 8);
  check(letIn, "ie7" + k + " the desk is let in at the relay door with no further act by anyone: Studio's watch admits it, writes joined at its door id and enrols its"
    + " key at the relay; " + (letIn ? "it is" : "NOT LET IN AT THE RELAY DOOR") + ": "
    + short({ admitted: S.admitted.indexOf(P.who.keyId) >= 0, joinedAtDoor: answered(), enrolled: !!store() && !!store().get("dev:" + P.who.keyId),
      answers: P.answers, watchSaid: S.shell.said.slice(-2) }));
  /* ie8: the catalog arrives. */
  let edition = null, names = [];
  const arrived = async () => {
    await settle(D.ch);
    names = (fs.existsSync(D.mirror) ? fs.readdirSync(D.mirror) : []).filter((n) => /\.ec$/i.test(n));
    const key = P.held.get(1) || null;
    edition = null;
    for (const n of names) {
      try { const e = JSON.parse(Engine.sealRules().openSealed(key, JSON.parse(read(D.mirror, n)))); if (e && e.id === S.catalogId) edition = e; } catch { /* not this one */ }
    }
    return !!edition;
  };
  const came = letIn ? await S.focusUntil(arrived, 4) : await arrived();
  const same2 = !!edition && edition.id === S.catalogId && (S.pub.rev === undefined || edition.rev === S.pub.rev);
  oneKind.last = { P, cert, d };
  check(came && same2, "ie8" + k + " the team's catalog arrives: the desk holds the team key from its own wrap and the edition in its mirror opens under it to the"
    + " edition Studio published" + (letIn ? "" : ", which it cannot while it is not let in at the relay door") + ": "
    + short({ key: P.held.has(1), editions: names, opened: edition ? { id: edition.id, rev: edition.rev } : null, published: { id: S.catalogId, rev: S.pub.rev } }));
}

/** A new desk of person `P` (the same account, its own key), signed in interactively: its certificate and this team's door, or nulls. */
async function secondDesk(S, P, word) {
  const P2 = Object.assign({}, P, { word, who: Object.assign(keyPair(true), { box: boxPair() }), held: new Map(), answers: [] });
  const s = await deskSignin(S.svc, P2, false);
  const cert = s.body && s.body.certificate, d = ((s.body && s.body.doors) || []).find((x) => x && x.team === S.teamId) || null;
  return { P2, cert, d, status: s.status };
}
/* ie9: the lead's Remove holds against a list that still says seated (the test architect's finding 1 on c2ccb0e1). */
async function removedStaysOut(S, lab) {
  const last = oneKind.last;
  if (!last || !last.cert) { check(false, "ie9 not reached: no member was let in before it"); return; }
  const removedAt = Date.now();
  const at = path.join(S.ud, "team-people.json");
  let people = {};
  try { people = JSON.parse(fs.readFileSync(at, "utf8")); } catch { people = {}; }
  const mine = Object.assign({}, people[S.teamId] || {});
  /* A Remove that owed no withdrawal (the person still in another of the lead's teams): the entry marked removed, nothing sent to the service. */
  mine[last.cert.person] = Object.assign({}, mine[last.cert.person] || { via: "join", at: removedAt - 1000 }, { removed: removedAt });
  fs.writeFileSync(at, JSON.stringify(Object.assign(people, { [S.teamId]: mine }), null, 1) + NL);
  const listed = S.svc.db.raw.prepare("SELECT team FROM admitted_by WHERE licence = ? AND team = ?").all(S.lic.id, S.teamId).length;
  const two = await secondDesk(S, last.P, last.P.word + "-two");
  let reached = false, admitted = false;
  if (two.cert && two.d) {
    const D = knock(S, lab, two.P2, two.d, two.cert);
    desks.push(D);
    D.ch.start(); await settle(D.ch);
    reached = await S.focusUntil(async () => { await settle(D.ch); return /^[0-9a-f]{32}$/.test(D.door.inv); }, 6);
    admitted = await S.focusUntil(async () => { await settle(D.ch); return S.admitted.indexOf(two.P2.who.keyId) >= 0; }, 2);
  }
  let kept = {};
  try { kept = JSON.parse(fs.readFileSync(at, "utf8"))[S.teamId] || {}; } catch { kept = {}; }
  const still = kept[last.cert.person] && kept[last.cert.person].removed === removedAt;
  check(!!two.cert && !!two.d && reached && !admitted && still && listed >= 1,
    "ie9 a member the lead removed, with no withdrawal owed and the service still placing them on the team, is not let in by a new desk of theirs across two"
    + " looks, and stays marked removed: " + short({ certified: !!two.cert, door: !!two.d, reached, admitted, stillRemoved: !!still, placedAtService: listed }));
}
/* ie10: a member whose only recent sign-ins are quiet renewals (the test architect's finding 2 on c2ccb0e1). */
async function quietMember(S, lab) {
  const P = person("v", "mira", "mira.quell@mail.example.invalid");
  const inv = await S.shell.ask("studio:person-invite", S.dir, P.address);
  const s1 = await deskSignin(S.svc, P, false);
  const one = ((s1.body && s1.body.invited) || []).find((x) => x && x.team === S.teamId) || null;
  const join = one ? await S.svc.call("ask", joinBody(P, one, Date.now()).body) : { status: 0, body: null };
  /* Their last interactive sign-in forty days ago: since then the desk has only renewed quietly, which writes no sign-in the list's window counts. */
  S.svc.db.raw.prepare("UPDATE person_desks SET signed_at = ?").run(Date.now() - 40 * DAY);
  const s2 = await deskSignin(S.svc, P, true);
  const cert = s2.body && s2.body.certificate, d = ((s2.body && s2.body.doors) || []).find((x) => x && x.team === S.teamId) || null;
  let letIn = false;
  if (cert && d) {
    const D = knock(S, lab, P, d, cert);
    desks.push(D);
    D.ch.start(); await settle(D.ch);
    const answered = () => !!D.door.inv && S.world.entries(S.rt).some(([key, v]) => key.startsWith("blob:") && v.place === "answer:" + D.door.inv);
    letIn = await S.focusUntil(async () => { await settle(D.ch); return S.admitted.indexOf(P.who.keyId) >= 0 && answered(); }, 8);
  }
  check(!!inv && !inv.error && !!one && join.status === 200 && join.body && join.body.state === "accepted" && !!cert && !!d && letIn,
    "ie10 a member whose last interactive sign-in is forty days old, placed by their own Join and seated by a quiet renewal, is let in at the door with"
    + " nobody acting: " + short({ invited: !!inv && !inv.error, shown: !!one, join: join.body && join.body.state, certified: !!cert, door: !!d, letIn }));
}

async function main() {
  const lab = labDir("invite-e2e");
  let S = null;
  const stopAt = ONLY, kinds = ONLY ? [ONLY.endsWith("u") || ONLY === "ie4c" ? "u" : "v"] : ["v", "u"];
  try {
    S = await leadWorld(lab);
    /* ie1: the control. Check now brings the service's licence and grant; the shell's sync opens the door at the relay and the service. */
    const checked = await S.shell.ask("studio:licence-check");
    const ref = S.state().licenceRef;
    const doorAt = () => { const v = S.world.store(S.rt) ? S.world.store(S.rt).get("door") : undefined; return v && Array.isArray(v.refs) ? v.refs : []; };
    const svcDoor = () => S.svc.db.raw.prepare("SELECT team, rt, box FROM doors WHERE licence = ?").all(S.lic.id).find((r) => r.team === S.teamId) || null;
    const opened = await S.focusUntil(() => doorAt().indexOf(ref) >= 0 && !!svcDoor(), 8);
    check(!!S.signed && S.signed.ok === true && /^[0-9a-f]{32}$/.test(String(ref)) && opened && svcDoor().rt === S.rt && svcDoor().box === S.box,
      "ie1 CONTROL: Studio is signed in to the service as the licence's owner, its licence reference kept, and its own sync opens the relay team's standing door"
      + " at that reference and sets the door at the service: " + short({ signed: S.signed && S.signed.ok, ref, relayDoor: doorAt(), serviceDoor: svcDoor(),
        check: checked && (checked.error || checked.by) }));
    if (stopAt === "ie1") return;
    if (kinds.indexOf("v") >= 0) await oneKind(S, lab, "v", "orla.vance@mail.example.invalid", stopAt);
    if (kinds.indexOf("u") >= 0) await oneKind(S, lab, "u", "teodor.brask@home.example.invalid", stopAt);
    if (!ONLY) await removedStaysOut(S, lab);
    if (!ONLY) await quietMember(S, lab);
  } catch (e) {
    check(false, "invite-e2e threw: " + (e && e.stack ? e.stack.split("\n").slice(0, 4).join(" / ") : e));
  } finally {
    for (const d of desks) { try { await d.ch.stop(); } catch { /* not started */ } }
    if (S) await S.shell.done();
  }
  if (!ONLY) {
    copyPlants({ root: ROOT, self: SELF, label: "invite-e2e", onlyVar: "INVITE_E2E_ONLY", timeout: 240000, check, skip, plants: [
      { mark: "press-desk", leg: "ie5v", rel: "service/licence/core.mjs", line: "    const desk = false;" },
      { mark: "accept-desk", leg: "ie5u", rel: "service/licence/core.mjs", line: "    return noSeatHere();" },
    ] });
  }
  process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + NL);
  if (!ONLY && asserted + skipped !== EXPECTED) {
    process.stdout.write("SUITE DID NOT COMPLETE: " + (asserted + skipped) + " of " + EXPECTED + " checks ran" + NL);
    return 78;
  }
  process.stdout.write("invite-e2e  " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)" + NL);
  return Math.min(failed, 63);
}

main().then((c) => process.exit(c), (e) => { process.stderr.write(String(e && e.stack || e) + NL); process.exit(2); });
