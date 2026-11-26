/* STUDIO'S SIDE OF THE LICENCE SERVICE, IN NODE (board 936, S6: the plan's L4).
 *
 *     node tests/licence-studio.mjs [--keep]          LICENCE_STUDIO_ONLY=<leg> runs one leg and no plants;
 *                                                     LICENCE_STUDIO_PLANT=<mark> runs one plant and prints its FAIL lines
 *
 * THE CRITERION: signing in is the only way a lead gets or keeps a paid seat (Max, 2026-11-11 22:14, "I agree!", to "Sign-in as
 * the only way to hold a paid seat, with Microsoft and Google first"); a lead signed in gets a licence file and a relay grant with
 * no command line; the quiet check keeps both current on a schedule, keeps the revoked keys' list and never rolls it back; the
 * relay is then offered and works; and a Studio activated before sign-in is told plainly to sign in and loses nothing.
 *
 * THE SHELL IS LOADED WITHOUT A WINDOW, as tests/relay-studio.mjs loads it (an electron stand-in, a vault that seals by
 * reversing, a thread that answers what a leg names), and its own handlers are asked as the page asks them. Its one door,
 * src/wire.cjs, reaches electron's net.fetch, which here hands each request to the licence service's real Worker
 * (service/licence/worker.mjs's rules, core.mjs) run in node over tests/d1-stand-in.mjs, as tests/licence-service.mjs runs
 * it, with a test root, a service key it delegates, a licence written into the stand-in D1 that admits a test tenant, and a
 * stand-in provider whose test RSA key the service reads as Microsoft's published keys. A Studio signs in as signedIn says, below.
 * No network, no window, no real key. What Studio keeps is asked of src/licence.mjs and the pinned relay's grantWhy, both
 * called, never restated.
 *
 *   ls1   signed in, from a Studio with no signing key: the key is made, Check now writes the licence file where publishing reads
 *         it and Studio accepts it, relay-grant.json beside the key holds for that key at the relay, paid, and the cover's
 *         answer names the grant's end
 *   ls2   the relay is offered and works: before, Start a team on the Etiuda relay is refused for want of a grant and
 *         nothing is sent; after, the press passes the grant and the shell's first call to the relay carries that grant
 *   ls4   a first sign-in no licence admits starts the trial: a grant ending with the trial, unpaid, and a trial's licence file
 *         stating that end, which the state publishing acts on honours as a licence, no mark ("trials are signed licences
 *         too")
 *   ls5   the quiet check on its schedule: renews the grant, keeps the revoked keys' list, refuses an older one and one the
 *         root did not sign, never rolls back, and a list naming the service's key leaves its licences refused as revoked
 *         by the licence state publishing acts on
 *   ls6   the service's refusals of a check are each said in their own sentence, English and Polish
 *   ls7   a key made again: signed in, the cover says the key changed and the schedule sends nothing, since only the person,
 *         signing in again, brings the seat to it; a Studio activated by its purchase key before sign-in, the key kept, sends
 *         nothing either and is asked to sign in
 *   ls20  a Studio activated before sign-in, by a purchase key, an address's code or a trial by code, whose check is answered
 *         "signin": told plainly that its licence is now kept by signing in, in English and Polish, at Check now and on the
 *         cover; its licence file and grant stay byte for byte and keep working, statistics still read; its kept purchase key
 *         is forgotten; and the revoked keys' list the answer carries is kept
 *   ls14  item 10 of the test architect's triage, and hold 2: a lead who signs in first on a new computer, so the sign-in made
 *         the key (leadReady), and then restores the team key's backup copy, gets the team key in place, the key the sign-in
 *         made copied aside, the cover saying the key changed and nothing sent for the restored key until the lead signs in
 *         again; a key made with Make a signing key that has signed nothing and made no relay space is set aside the same way; a
 *         key that has signed (handed out to sign a team file), one under which the relay made a team's space since, and one
 *         that is not the key this Studio remembers making each stay, the restore refused in today's sentence
 *   ls8   every call went through the one door to the licence service's address by a route's name, each body holding only
 *         its route's fields: no path, no catalog, no file
 *   ls9   a Studio never activated sends nothing, whatever the schedule does
 *   ls10  the schedule: a first look a minute after the window, then each hour; twelve hours between answered checks and an
 *         hour after a try that was not answered
 *   ls11  what an answer gives is judged first (answers of the signin route, taken by take): a grant for another key, a licence the root did not stand behind, a
 *         licence from a revoked key and a grant whose delegate key that same answer revoked (E1) are not kept; a licence the
 *         root signed by hand is never written over by the service's (E2); an answer over 256 KiB is not read (note 4); a
 *         trial's licence never takes the place of a full licence held
 *   ls12  plants: each guarding line, changed in a copy of the tree, turns its leg red; the real files are unchanged
 *   ls15  after a sign-in trial's end, ended at the service and brought by Check now: Studio does not work, so reading statistics, taking
 *         proposals, a proposal's marks and a card's save are each refused as a stop, nothing reaching the thread; during the trial
 *         they work; exporting an edition stays open after it (the gate; was: statistics and proposals paused in one calm sentence and
 *         editing stayed open, decisions 2026-09-24 02:01 and 02:03)
 *   ls16  nobody signed in, then signed in with no licence: the same asks are the same stop, nothing reaching the thread, the cover answers
 *         and says the Studio does not work, exporting still reaches the thread; given a trial running, they are answered (the gate;
 *         was: statistics waiting for sign-in and then paused, on a period counted from the first run)
 *   ls17  watchOnce unlocks the signing key lazily: a run with nothing changed makes no unlock (board 945 item 9, test architect E1; the
 *         pause flip it once also held cannot happen while the watch runs, which is only where Studio works)
 *   ls18  watchOnce memos the team file's rev and lead: two watch runs where only a desk's file changed between them
 *         absorb once, and a run after the team file's rev or lead changed absorbs again (board 945 item 8, test architect E1).
 *         The count is the signing key. The epoch key finding 4 keeps is opened on the same pass and is not counted
 *   ls19  the memo of ls18 is set last and only where the recovery copy opened: a copy that did not open, and a throw in
 *         writeLanded after the book was absorbed, are each read again at the next run where only a desk's file changed (board
 *         945 item 8, the test architect's follow-up of 2026-10-30). The count is the signing key, as ls18's is
 *   ls21  the paid end (piece S-0): signed in on a paid licence, its file stating its paid end; past it, Check now sets the file aside as
 *         .ended, byte for byte, Studio reads no licence as after a refund and the sign-in stays; paid again, the next Check now brings it
 *         back with a paid grant; ended again, .ended-2, the first kept; a refund still moves the file to .ended as before
 *   ls13  Claude alpha's ruling on the test architect's C5: Studio calls the production address unless told otherwise. With
 *         ETIUDA_LICENCE_ORIGIN unset it calls https://etiuda.dev/licence/v1/; set to staging's https://etiuda.dev/licence-
 *         staging/v1/ it calls staging; set to anything not an https address on etiuda.dev of that shape it is ignored; and an
 *         installed Studio (its src/ inside app.asar, as tests/shell-guards.mjs simulates one) ignores it whatever it holds.
 *         Planted by hand (src/wire.cjs is held to its exact statements by tests/no-model.mjs 11, so it carries no plant
 *         mark): the installed-copy test taken out turns ls13c red, and the host widened to any turns ls13b red.
 */
import "./reg-stand-on.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import vm from "node:vm";
import module, { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { standInD1 } from "./d1-stand-in.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "licence-studio-legs");
const nodeRequire = createRequire(import.meta.url);
const NL = "\n";
const EXPECTED = 113; /* 116 less ls18, ls19a and ls19b, retired (the shared-folder team's removal) */
const ONLY = process.env.LICENCE_STUDIO_ONLY || "";

/* The pin's catalog-v2.js is an ES module in a folder whose package.json says CommonJS; read by its syntax, as
   tests/licence-service.mjs reads it, for the Worker's imports. */
module.registerHooks({
  load(url, context, next) {
    if (/\/engine\/pinned\/src\/modules\/catalog-v2\.js$/.test(url)) {
      const r = next(url, Object.assign({}, context, { format: "module" }));
      return Object.assign({}, r, { format: "module" });
    }
    return next(url, context);
  },
});

const W = await import(pathToFileURL(path.join(ROOT, "service", "licence", "worker.mjs")).href);
const CORE = await import(pathToFileURL(path.join(ROOT, "service", "licence", "core.mjs")).href);
const RQ = await import(pathToFileURL(path.join(ROOT, "service", "licence", "requests.mjs")).href);
const L = await import("../src/licence.mjs");
const Client = await import("../src/licence-client.mjs");
const Rl = await import("../src/relay.mjs");
const Sign = await import("../src/sign.mjs");
const Engine = await import("../src/engine.mjs");
const Store = await import("../src/team-store.mjs");
const Team = await import("../src/team.mjs");
const RELAY = Engine.relayRules().core;
const SCHEMA = fs.readFileSync(path.join(ROOT, "service", "licence", "schema.sql"), "utf8");
const langBox = { window: {} };
langBox.window = langBox;
vm.runInNewContext(fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8"), langBox);
langBox.STUDIO_T.force("pl");
const plT = (s) => langBox.STUDIO_T.T(s);

/* ETIUDA_PLANTS=off (a merge's area run) skips each ls12 plant and ls12z and counts them toward EXPECTED; the release
   profile runs with plants on, so they still run there. */
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + NL);
  else { failed++; process.stdout.write("  FAIL " + line + NL); }
}
function skip(line) {
  skipped++;
  process.stdout.write("  SKIP  " + line + NL);
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const HOUR = 3600000, DAY = 24 * HOUR;

/* ---- keys: a test root, the service key it delegates, another key ------------------------------------------------- */

const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
function newKey() {
  const privateKey = crypto.generateKeyPairSync("ed25519").privateKey;
  const pub = crypto.createPublicKey(privateKey).export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  return { pub, id: "studio-" + sha(Buffer.from(pub, "hex")).slice(0, 16), privateKey,
    der: privateKey.export({ type: "pkcs8", format: "der" }).toString("hex") };
}
const ROOTK = newKey(), SERVICEK = newKey(), OTHER = newKey();
const DELEGATION = L.createTestDelegation({ key: { id: SERVICEK.id, pub: SERVICEK.pub }, may: ["licence", "relay-grant"],
  from: Date.now() - 10 * DAY, until: Date.now() + 300 * DAY }, ROOTK.privateKey, "etiuda-root-test");
const listOf = (keys, serial, signer) => L.createTestRevocations({ keys, serial }, (signer || ROOTK).privateKey, "etiuda-root");

/* ---- the service: the real Worker over a fresh stand-in D1 ---------------------------------------------------------- */

/* The provider: one test RSA key, served to the service as Microsoft's published keys, and the ID tokens it issues for a tenant. */
const MS_JWKS = "https://login.microsoftonline.com/common/discovery/v2.0/keys";
const MS_CLIENT = "00001111-aaaa-2222-bbbb-3333cccc4444";
const TENANT = "aaaabbbb-0000-cccc-1111-dddd2222eeee";
const RSA = (() => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = publicKey.export({ format: "jwk" });
  return { privateKey, jwk: { kty: "RSA", use: "sig", kid: "ms-test-1", x5t: "ms-test-1", n: jwk.n, e: jwk.e,
    issuer: "https://login.microsoftonline.com/{tenantid}/v2.0" } };
})();
const b64u = (b) => Buffer.from(b).toString("base64url");
function idToken(o) {
  const now = Math.floor(Date.now() / 1000);
  const claims = { aud: MS_CLIENT, iss: "https://login.microsoftonline.com/" + TENANT + "/v2.0", iat: now, nbf: now, exp: now + 3600,
    oid: "9a8b7c6d-5e4f-4a3b-8c2d-" + sha(Buffer.from(o.sub)).slice(0, 12), sub: o.sub, tid: TENANT,
    uti: crypto.randomBytes(16).toString("base64url"), ver: "2.0", nonce: o.nonce };
  const h = b64u(JSON.stringify({ typ: "JWT", alg: "RS256", kid: RSA.jwk.kid })), p = b64u(JSON.stringify(claims));
  return h + "." + p + "." + b64u(crypto.sign("sha256", Buffer.from(h + "." + p), RSA.privateKey));
}
const jwksFetch = async (url) => {
  if (url !== MS_JWKS) throw new Error("no stand-in answers " + url);
  return new Response(JSON.stringify({ keys: [RSA.jwk] }), { status: 200, headers: { "content-type": "application/json", "cache-control": "public, max-age=86400" } });
};

let ipN = 0;
function service() {
  const db = standInD1(SCHEMA);
  const svc = CORE.makeService({ rules: W.RULES, roots: [ROOTK.pub], clock: () => Date.now(), fetch: jwksFetch });
  /* HASH_KEY, the third secret (S7, the test architect's C1): organisations and persons are kept keyed under it. */
  const env = { DB: db, SERVICE_KEY: SERVICEK.der, DELEGATION: JSON.stringify(DELEGATION), HASH_KEY: crypto.randomBytes(32).toString("hex"),
    PROVIDERS: JSON.stringify([{ id: "microsoft", clientId: MS_CLIENT }]) };
  const o = {
    db, env,
    async fetch(url, init) {
      const req = new Request(String(url), { method: init.method, body: init.body,
        headers: Object.assign({ "cf-connecting-ip": "198.51.100." + ((++ipN % 250) + 1) + "-" + ipN }, init.headers || {}) });
      return svc.fetch(req, env);
    },
    /** Studio's one door to the service, as src/wire.cjs licenceRequest answers: {status, bytes}. */
    ask: async (route, bytes) => {
      const res = await o.fetch("https://etiuda.dev/licence/v1/" + route, { method: "POST", headers: { "content-type": "application/json" }, body: bytes });
      return { status: res.status, bytes: Buffer.from(await res.arrayBuffer()) };
    },
    /** A paid licence admitting the tenant's sign-ins, as the attach script writes one (the organisation keyed as admits keeps it:
     *  "etiuda-licence-org", the provider and the tenant, a newline between each). */
    licence(q) {
      const k = q || {};
      /* Its owner, the person the legs sign in (signedIn's "lead-person" unless named), as the attach script names one: a team is its
         lead's own (section 9, decision 47), so a Studio signing in to a licence with no owner is seated on a trial of its own. */
      const personOf = (sub) => crypto.createHmac("sha256", Buffer.from(env.HASH_KEY, "hex")).update("etiuda-licence-person" + NL
        + "https://login.microsoftonline.com/" + TENANT + "/v2.0" + NL + sub).digest("hex");
      const owner = personOf(k.owner || "lead-person");
      const id = Number(db.raw.prepare("INSERT INTO licences (key_hash, email_hash, org, seats, updates_until, paid_until, lead_seats, owner) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .run(crypto.randomBytes(32).toString("hex"), "unused", k.org || "Kappa Tools", k.seats || 2, k.updatesUntil || "2027-11-02",
          Date.now() + 365 * DAY, k.leadSeats || 3, owner).lastInsertRowid);
      const org = crypto.createHmac("sha256", Buffer.from(env.HASH_KEY, "hex")).update("etiuda-licence-org\nmicrosoft\n" + TENANT).digest("hex");
      db.raw.prepare("INSERT INTO admits (licence, provider, org) VALUES (?, ?, ?)").run(id, "microsoft", org);
      /* Further leads, named by the owner (lead/name), each seated as the owner is. */
      for (const sub of k.leads || []) db.raw.prepare("INSERT INTO lead_names (licence, person, named_by, at) VALUES (?, ?, ?, ?)").run(id, personOf(sub), owner, Date.now());
      return { id };
    },
  };
  return o;
}

/* ---- the shell, loaded without a window ------------------------------------------------------------------------------- */

const SHELL_VAULT = {
  isEncryptionAvailable: () => true,
  encryptString: (s) => Buffer.from("sealed:" + Buffer.from(String(s), "utf8").reverse().toString("hex"), "utf8"),
  decryptString: (b) => {
    const t = Buffer.from(b).toString("utf8");
    if (!t.startsWith("sealed:")) throw new Error("not sealed here");
    return Buffer.from(t.slice(7), "hex").reverse().toString("utf8");
  },
};
/** The shell over `ud`, its net.fetch answered by `svc` (the licence service) and refused for anything else, each call
 *  recorded; the timers armLicenceCheck asks for are recorded and never run by themselves. */
async function loadShell(ud, svc, o) {
  const opts = o || {}, Module = nodeRequire("node:module"), main = path.join(ROOT, "shell", "main.js");
  const ui = path.join(ROOT, "ui", "index.html");
  const got = { handlers: {}, windows: [], said: [], appOn: {}, calls: [], timers: [] };
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
    clipboard: { writeText() {} }, safeStorage: opts.safeStorage || SHELL_VAULT,
    screen: { getAllDisplays: () => [display], getPrimaryDisplay: () => display, on() {}, removeListener() {} },
    session: { defaultSession: { setPermissionRequestHandler() {}, setPermissionCheckHandler() {},
      setDevicePermissionHandler() {}, setSpellCheckerLanguages() {}, setSpellCheckerDictionaryDownloadURL() {},
      setSpellCheckerEnabled() {} } },
    shell: { openPath: () => Promise.resolve(""), trashItem: () => Promise.resolve() },
    ipcMain: { handle: (ch, fn) => { got.handlers[ch] = fn; }, on() {} },
    net: { fetch: async (url, init) => {
      const body = init && init.body ? Buffer.from(init.body).toString("utf8") : "";
      got.calls.push({ url: String(url), method: String(init && init.method), body });
      if (String(url).indexOf("https://etiuda.dev/licence/v1/") !== 0) throw new Error("the lab answers the licence service alone");
      const res = await svc.fetch(url, init);
      const bytes = Buffer.from(await res.arrayBuffer());
      return { status: res.status, headers: { get: (n) => res.headers.get(n) },
        body: new ReadableStream({ start(c) { if (bytes.length) c.enqueue(new Uint8Array(bytes)); c.close(); } }) };
    } },
  };
  const thread = { call: (verb, ...a) => (opts.thread ? opts.thread(verb, ...a) : Promise.resolve({})) };
  const quiet = { on() {}, unref() {}, kill() {}, pid: 0, stdout: { on() {} }, stderr: { on() {} }, stdin: { end() {}, write() {} } };
  const cp = { execFileSync: () => "", execSync: () => "", spawnSync: () => ({ status: 0, stdout: "", stderr: "" }),
    execFile: () => quiet, spawn: () => quiet, exec: () => quiet, fork: () => quiet };
  const env = Object.assign({ STUDIO_NO_PROXY_SERVER: "off", STUDIO_TEST_OFFSCREEN: "1",
    XDG_CURRENT_DESKTOP: "GNOME", STUDIO_VENDOR_KEY: ROOTK.pub, STUDIO_RELAY_ROOT: ROOTK.pub, STUDIO_PROJECTS: path.join(ud, "projects") }, opts.env || {});
  const was = {};
  for (const k of Object.keys(env)) { was[k] = process.env[k]; process.env[k] = env[k]; }
  delete nodeRequire.cache[nodeRequire.resolve(path.join(ROOT, "src", "wire.cjs"))];
  const load = Module._load, write = process.stderr.write, before = new Set(Object.keys(nodeRequire.cache));
  /* The two timers armLicenceCheck asks for are recorded and handed back unarmed; every other timer is the runtime's own. */
  const realTimeout = globalThis.setTimeout, realInterval = globalThis.setInterval;
  const ours = () => /armLicenceCheck/.test(String(new Error().stack));
  globalThis.setTimeout = function (fn, ms, ...a) {
    if (ours()) { got.timers.push({ kind: "once", ms, fn }); return { unref() {} }; }
    return realTimeout(fn, ms, ...a);
  };
  globalThis.setInterval = function (fn, ms, ...a) {
    if (ours()) { got.timers.push({ kind: "every", ms, fn }); return { unref() {} }; }
    return realInterval(fn, ms, ...a);
  };
  Module._load = function (req) {
    if (req === "electron") return electron;
    if (req === "node:child_process" || req === "child_process") return cp;
    if (/studio-thread\.cjs$/.test(req)) return thread;
    return load.apply(this, arguments);
  };
  process.stderr.write = (s) => {
    const line = String(s);
    if (/^studio {2}/.test(line)) { got.said.push(line.trim()); return true; }
    return write.call(process.stderr, s);
  };
  const dropCache = () => {
    delete nodeRequire.cache[main];
    for (const k of Object.keys(nodeRequire.cache)) if (!before.has(k)) delete nodeRequire.cache[k];
  };
  const restore = () => {
    globalThis.setTimeout = realTimeout; globalThis.setInterval = realInterval;
    Module._load = load; process.stderr.write = write; dropCache();
    for (const k of Object.keys(was)) { if (was[k] === undefined) delete process.env[k]; else process.env[k] = was[k]; }
  };
  try {
    dropCache();
    nodeRequire(main);
    /* No socket: the relay's would be the runtime's own, and a leg reaches no network. */
    nodeRequire(path.join(ROOT, "src", "wire.cjs")).relayConnect = () => null;
    for (let i = 0; i < 1250 && got.timers.length < 2; i++) await wait(20);
  } catch (e) { restore(); throw e; }
  /* The shell's own clock-free acts are asked after the load; the environment stays set until done(), since the shell reads
     its test-only variables at each call. The timers go back now, so a leg's own waits are the runtime's. */
  globalThis.setTimeout = realTimeout; globalThis.setInterval = realInterval;
  got.event = { senderFrame: { parent: null, url: pathToFileURL(ui).href }, sender: got.windows[0] && got.windows[0].webContents };
  got.ask = (ch, ...a) => got.handlers[ch](got.event, ...a);
  got.keyFile = () => path.join(ud, Sign.KEY_FILE);
  got.licenceFile = () => L.defaultLicenceFile(ud);
  got.grantFile = () => Rl.grantFileOf(got.keyFile());
  got.state = () => { try { return JSON.parse(fs.readFileSync(path.join(ud, "licence-service.json"), "utf8")); } catch { return {}; } };
  got.setState = (s) => fs.writeFileSync(path.join(ud, "licence-service.json"), JSON.stringify(s));
  got.lead = () => { try { const r = Sign.readKeyFile(got.keyFile()); return r ? r.public : ""; } catch { return ""; } };
  /* The key opened as the shell's leadOpen opens it: its passphrase sealed by the vault in the key file. */
  got.open = () => {
    const read = Sign.readKeyFile(got.keyFile());
    return Sign.unlockKey(read, (opts.safeStorage || SHELL_VAULT).decryptString(Buffer.from(String(read.doc.private), "base64")));
  };
  /* The schedule's hourly look, as the timer would run it. The timer's own function
     does not hand back the look's promise, so the wait is on the state file going
     quiet: a look that renews a grant writes, then stops, and a look that sends
     nothing never writes. Tried staying ahead of checked is not "still running":
     a purchase key this computer cannot open is forgotten with tried set and
     checked left behind, and that state is already the answer. The old loop treated
     it as in flight and sat the full 25 s, twice in ls7, which was the leg's 87 s. */
  /* A look the check expects to write ({ writes: true }) is waited until the state moves and then goes quiet for 200 ms. A
     look the check expects to send and write nothing gets 2 s of quiet, so a look that starts late under load is still
     seen before "nothing" is believed (the test architect's read, 2026-11-10). The calls to the service count as movement. */
  got.tick = async (o) => {
    const writes = !!(o && o.writes);
    const every = got.timers.find((t) => t.kind === "every");
    if (!every) return false;
    every.fn();
    const end = Date.now() + 25000;
    const mark = () => JSON.stringify(got.state()) + "|" + (Array.isArray(got.calls) ? got.calls.length : 0);
    const first = mark();
    let last = first;
    let quiet = 0;
    while (Date.now() < end) {
      await wait(20);
      const now = mark();
      if (now !== last) { last = now; quiet = 0; continue; }
      quiet += 20;
      if (writes && last === first) continue;
      if (quiet >= (writes ? 200 : 2000)) break;
    }
    await wait(50);
    return true;
  };
  got.catalog = path.join(ud, "projects", "lab");
  got.done = () => {
    for (const fn of got.appOn["will-quit"] || []) { try { fn(); } catch { /* gone already */ } }
    Module._load = load; process.stderr.write = write; dropCache();
    for (const k of Object.keys(was)) { if (was[k] === undefined) delete process.env[k]; else process.env[k] = was[k]; }
  };
  return got;
}

const grantFor = (file) => { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; } };
const holds = (g, lead) => !!g && RELAY.grantWhy(g, lead, Date.now(), [ROOTK.pub]) === null;
/* A STUDIO THE GATE LETS WORK: signed in, under a trial the root signed, five days to run (the sign-in's own steps are signedIn's). */
async function seatWorld(ud) {
  const doc = await L.createTestTrialLicence({ issued: L.localDay(), ends: Date.now() + 5 * 86400000 }, ROOTK.privateKey, "etiuda-root");
  fs.mkdirSync(ud, { recursive: true });
  fs.writeFileSync(L.defaultLicenceFile(ud), JSON.stringify(doc));
  fs.writeFileSync(path.join(ud, "licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft" }));
}
async function world(name, o) {
  const ud = path.join(SCRATCH, name);
  fs.mkdirSync(ud, { recursive: true });
  if (o && o.seat) await seatWorld(ud);
  const svc = service();
  const sh = await loadShell(ud, svc, o);
  sh.seated = !!(o && o.seat);
  return { ud, svc, sh };
}
/* A STUDIO SIGNED IN, as the shell's own sign-in leaves one (its browser, loopback and provider steps are tests/sign-in.mjs's): this
   Studio's key, where it has none, made as a sign-in makes it (leadReady, reached through the owner's Free seat with a code nobody
   holds, `o.ready`) or with Make a signing key; its sign-in sent through Studio's own client (src/licence-client.mjs signIn) to the
   service's signin route with a token the stand-in provider signs; licence-service.json written as licenceAct writes it for a
   sign-in. The licence and the grant then come by the shell's own Check now, whose answer is returned. */
async function signedIn(sh, svc, o) {
  const opt = o || {};
  /* A Studio the gate lets work (world's seat) makes its key with Make a signing key. One that does not, until its sign-in lands, makes
     it as a sign-in does (leadReady, reached through an owner's act: moved for board 1017 from Free seat, which now names a seat by the seat
     list's pseudonym, to a naming from the licence's people), for Make a signing key is project work and closed to it. */
  if (!sh.lead() && sh.seated) await sh.ask("studio:key-make");
  else if (!sh.lead()) {
    const was = sh.state();
    sh.setState(Object.assign({}, was, { by: "signin", signinOwner: true }));
    await sh.ask("studio:licence-name-person", "0".repeat(64));
    sh.setState(was);
  }
  const open = sh.open(), seed = crypto.randomBytes(32).toString("hex");
  const token = idToken({ sub: opt.person || "lead-person", nonce: await RQ.signinNonce(open.public, seed) });
  const a = await Client.signIn(svc.ask, open, "microsoft", token, Date.now(), seed);
  if (!a || a.ok !== true) return { error: "the sign-in was refused: " + (a && a.reason) };
  sh.setState(Object.assign({}, sh.state(), { by: "signin", lead: open.public, provider: "microsoft", checked: 0, tried: 0 }, Client.keepWho({}, a)));
  return sh.ask("studio:licence-check");
}

/* ---- the legs ------------------------------------------------------------------------------------------------------- */

const LEGS = {};

LEGS.ls1 = async () => {
  const { svc, sh } = await world("ls1");
  try {
    svc.licence({ org: "Kappa Tools", seats: 2 });
    check(!sh.lead(), "ls1a CONTROL: the Studio starts with no signing key");
    const r = await signedIn(sh, svc);
    const lead = sh.lead(), lic = L.readLicenceFile(sh.licenceFile());
    check(r && !r.error && !!lead && sh.state().lead === lead && r.signing && r.signing.keyId,
      "ls1b signed in, Check now answers ok under the signing key made here: " + JSON.stringify(r && (r.error || r.checked)));
    check(!lic && r && r.licence && r.licence.status === "active" && r.licence.org === "Kappa Tools" && r.licence.seats === 2 && r.works === true,
      "ls1c no licence file is written, and the cover reads the licence active from the service's answer, the Studio working on its certificate"
      + " (the licence file goes as an everyday entitlement, Max 2026-11-22 15:37: was the file written where publishing reads it): " + JSON.stringify(r && r.licence));
    const g = grantFor(sh.grantFile());
    check(holds(g, lead) && g.paid === true && path.dirname(sh.grantFile()) === path.dirname(sh.keyFile()),
      "ls1d relay-grant.json beside the key holds for this key at the relay, paid");
    check(r && r.grant && r.grant.until === new Date(g.until).toISOString().slice(0, 10) && r.grant.paid === true
      && r.licence.status === "active" && r.by === "signin" && r.keyChanged === false,
      "ls1e the cover's answer names the grant's end, " + (r && r.grant && r.grant.until) + ", and the licence, active");
  } finally { sh.done(); }
};

LEGS.ls2 = async () => {
  let made = null;
  const thread = (verb, ...a) => {
    if (verb === "teamFacts") return Promise.resolve({ file: "none", folder: null });
    if (verb === "startRelayTeam") { made = a[1]; return Promise.resolve({ team: { id: a[1].teamId }, written: null }); }
    return Promise.resolve({});
  };
  const { svc, sh } = await world("ls2", { thread });
  try {
    const before = await sh.ask("studio:team-new"); /* was studio:team-relay on a catalog, retired 2026-11-26 */
    const sentBefore = sh.calls.length;
    check(before && before.error && before.said && before.said.why === "stopped" && sentBefore === 0 && !made,
      "ls2a before: a team on the relay is refused as a stop, for a Studio nobody signed in to does not work, and nothing is sent"
      + " (was: refused for want of a grant): " + JSON.stringify(before && before.error));
    svc.licence();
    await signedIn(sh, svc);
    const after = await sh.ask("studio:team-new");
    for (let i = 0; i < 1250 && !sh.calls.some((c) => /\/relay\/v1\/teams$/.test(c.url)); i++) await wait(20);
    const create = sh.calls.find((c) => /\/relay\/v1\/teams$/.test(c.url));
    const sent = create ? JSON.parse(create.body) : null;
    check(after && !after.error && after.created === true && !!made,
      "ls2b signed in, the same press passes the grant and starts the team: " + JSON.stringify(after && (after.error || after.created)));
    check(!!sent && JSON.stringify(sent.grant) === JSON.stringify(grantFor(sh.grantFile())) && sent.lead.pub === sh.lead()
      && RELAY.judgeCreate(sent.rt, sent, Date.now(), [ROOTK.pub]).ok === true,
      "ls2c the shell's first call to the relay carries that grant, and the pinned relay's own judgeCreate accepts the create");
  } finally { sh.done(); }
};

LEGS.ls4 = async () => {
  const { svc, sh } = await world("ls4");
  try {
    const t0 = Date.now();
    const r = await signedIn(sh, svc);
    const g = grantFor(sh.grantFile());
    check(r && !r.error && holds(g, sh.lead()) && g.paid === false && Math.abs(g.until - (t0 + 14 * DAY)) < 60000
      && r.grant && r.grant.paid === false && r.by === "signin",
      "ls4a a first sign-in no licence admits starts the trial, whose grant ends with it, unpaid: " + JSON.stringify(r && (r.error || r.grant)));
    /* "trials are signed licences too" (decisions 2026-09-24 02:03; 2026-10-06 21:26): the file publishing reads. */
    const lic = L.readLicenceFile(sh.licenceFile());
    check(!lic && r.licence && r.licence.status === "trial" && r.licence.trial && r.licence.trial.ends === g.until && r.works === true,
      "ls4b and no trial's licence file is written; the cover says the trial and its end from the service's answer, the Studio working on its"
      + " certificate (the licence file goes as an everyday entitlement, Max 2026-11-22 15:37: was a trial's licence file written where publishing reads it): " + JSON.stringify([lic && lic.kind, r && r.licence]));
  } finally { sh.done(); }
};

LEGS.ls5 = async () => {
  const { svc, sh } = await world("ls5");
  try {
    svc.licence();
    await signedIn(sh, svc);
    const g0 = grantFor(sh.grantFile());
    const revokedAt = L.revokedFileFor(sh.licenceFile());
    svc.env.REVOKED = JSON.stringify(listOf([OTHER.pub], 2));
    const st0 = sh.state();
    sh.setState(Object.assign({}, st0, { checked: Date.now() - 13 * HOUR, tried: Date.now() - 13 * HOUR }));
    await wait(5);
    await sh.tick({ writes: true });
    const g1 = grantFor(sh.grantFile()), kept1 = L.readRevocations(revokedAt, ROOTK.pub);
    check(holds(g1, sh.lead()) && g1.issued > g0.issued && kept1 && kept1.serial === 2 && sh.state().checked > st0.checked,
      "ls5a the schedule's look, twelve hours on, checks: the grant is renewed and the revoked keys' list, serial 2, is kept");
    svc.env.REVOKED = JSON.stringify(listOf([OTHER.pub], 1));
    await sh.ask("studio:licence-check");
    svc.env.REVOKED = JSON.stringify(listOf([OTHER.pub, SERVICEK.pub].sort(), 9, OTHER));
    await sh.ask("studio:licence-check");
    delete svc.env.REVOKED;
    await sh.ask("studio:licence-check");
    const kept2 = L.readRevocations(revokedAt, ROOTK.pub);
    check(kept2 && kept2.serial === 2 && kept2.keys.join() === OTHER.pub,
      "ls5b an older list, one the root did not sign and none at all each leave the kept list as it was: serial " + (kept2 && kept2.serial));
    svc.env.REVOKED = JSON.stringify(listOf([OTHER.pub, SERVICEK.pub].sort(), 3));
    const r = await sh.ask("studio:licence-check");
    const kept3 = L.readRevocations(revokedAt, ROOTK.pub);
    check(kept3 && kept3.serial === 3 && r && !r.error && r.works === false && r.licence && r.licence.status === "none",
      "ls5c a list naming the service's own key is kept, and the Studio's certificate that key signed is refused, so it does not work"
      + " (the licence file goes as an everyday entitlement, Max 2026-11-22 15:37: was its licence file refused as revoked): " + JSON.stringify([kept3 && kept3.serial, r && (r.error || [r.works, r.licence && r.licence.status])]));
    /* Both copies of a list this Studio held, then unreadable: the next look asks for the list, two hours after the last answered
       check rather than twelve (Claude alpha's condition on 15a); with the list readable the same look sends nothing. */
    const twoHours = () => { const s0 = sh.state(); sh.setState(Object.assign({}, s0, { checked: Date.now() - 2 * HOUR, tried: Date.now() - 2 * HOUR })); return sh.state().checked; };
    const quietAt = twoHours();
    await sh.tick({ writes: true });
    const quiet = sh.state().checked === quietAt;
    fs.writeFileSync(revokedAt, "{");
    fs.rmSync(L.revokedCopyFor(sh.licenceFile()), { force: true });
    const lostAt = twoHours();
    await sh.tick({ writes: true });
    const back = L.keptRevocations(sh.licenceFile(), ROOTK.pub);
    check(quiet && !!back && back.serial === 3 && sh.state().checked > lostAt,
      "ls5d with both copies of the held list unreadable, the next look checks two hours on and takes the list back; with it readable that look sends nothing: "
      + JSON.stringify({ quiet, back: back && back.serial, checkedMoved: sh.state().checked > lostAt }));
  } finally { sh.done(); }
};

LEGS.ls6 = async () => {
  const { svc, sh } = await world("ls6");
  try {
    svc.licence();
    await signedIn(sh, svc);
    const refusals = [
      ["refused", "The licence service did not accept this, so nothing was changed. Try again; if it happens again, write to us through etiuda.dev.",
        "Usługa licencji tego nie przyjęła, więc nic się nie zmieniło. Można spróbować ponownie; jeśli to się powtórzy, prosimy o wiadomość przez etiuda.dev."],
      ["signature", "The licence service could not confirm this request against this Studio's key, so nothing was changed. Try again; if it happens again, write to us through etiuda.dev.",
        "Usługa licencji nie potwierdziła tej prośby kluczem tego Studia, więc nic nie zmieniono. Można spróbować ponownie, a jeśli to się powtórzy, prosimy o wiadomość przez etiuda.dev."],
      ["replayed", "The licence service had already received this same request, most likely from this computer's own retry, so it did not take it twice. Try again.",
        "Usługa licencji otrzymała już tę samą prośbę, najpewniej przy ponownej próbie tego komputera, więc nie przyjęła jej drugi raz. Można spróbować jeszcze raz."],
      ["malformed", "The licence service could not read this request, so nothing was changed. A newer version of Studio may be needed: look on etiuda.dev, or write to us there.",
        "Usługa licencji nie mogła odczytać tej prośby, więc nic nie zmieniono. Być może potrzebna jest nowsza wersja Studia: warto zajrzeć na etiuda.dev albo napisać do nas przez tę stronę."],
    ];
    for (const [reason, en, pl] of refusals) {
      const prevFetch = svc.fetch;
      svc.fetch = async () => new Response(JSON.stringify({ ok: false, reason }), {
        status: reason === "malformed" ? 400 : 403,
        headers: { "content-type": "application/json" },
      });
      try {
        const res = await sh.ask("studio:licence-check");
        check(res && res.error === en && plT(res.error) === pl,
          "ls6 reason " + reason + " gives its own sentence in English and Polish: " + JSON.stringify(res && res.error));
      } finally {
        svc.fetch = prevFetch;
      }
    }
  } finally { sh.done(); }
};

LEGS.ls7 = async () => {
  const { svc, sh } = await world("ls7");
  try {
    svc.licence();
    await signedIn(sh, svc);
    const first = sh.lead();
    fs.renameSync(sh.keyFile(), sh.keyFile() + ".moved");
    /* Made as a sign-in makes it (leadReady through an owner's act, as signedIn does), for since review xi a Studio whose certificate names
       another key does not work, and Make a signing key is project work it closes. It was: Make a signing key. */
    const was7 = sh.state();
    sh.setState(Object.assign({}, was7, { by: "signin", signinOwner: true }));
    await sh.ask("studio:licence-name-person", "0".repeat(64));
    sh.setState(was7);
    const second = sh.lead(), n0 = await sh.ask("studio:licence");
    check(second && second !== first && n0.keyChanged === true && n0.grant === null,
      "ls7a a key made again on a signed-in Studio: the cover says the key changed, and the grant held names the old key, so none is shown");
    const due = Date.now() - 13 * HOUR;
    sh.setState(Object.assign({}, sh.state(), { checked: due, tried: due }));
    const sent = sh.calls.length;
    await sh.tick();
    const n1 = await sh.ask("studio:licence");
    check(sh.calls.length === sent && n1.keyChanged === true && sh.state().lead === first,
      "ls7b the schedule's look sends nothing for the new key: only the person, signing in again, brings the seat to it: "
      + (sh.calls.length - sent) + " call(s)");
    /* A Studio activated by its purchase key before sign-in, the key kept sealed for a key made again. */
    const sealed = Buffer.from(SHELL_VAULT.encryptString("7K3M-Q9TV-2XRB-HN4W-8PZD-6YCF-1GJS-5EAA")).toString("base64");
    sh.setState({ by: "key", lead: first, checked: due, tried: due, keySealed: sealed });
    const sent2 = sh.calls.length;
    await sh.tick();
    const n2 = await sh.ask("studio:licence");
    check(sh.calls.length === sent2 && n2.keyChanged === true && n2.signinMoved === true,
      "ls7c a Studio activated by its purchase key, its key made again: nothing is sent, the kept purchase key brings nothing, and"
      + " the cover asks the lead to sign in: " + (sh.calls.length - sent2) + " call(s), " + JSON.stringify([n2.keyChanged, n2.signinMoved]));
  } finally { sh.done(); }
};

/* A STUDIO ACTIVATED BEFORE SIGN-IN (board 980, stage 4): the service keeps a seat by sign-in alone, and answers such a Studio's
   check "signin", as it answers a lapsed sign-in seat's. Nobody is stranded: told plainly, its licence file working on. The licence
   file and the grant are the service's own, brought by a sign-in first; the record is then rewritten as an activation before sign-in
   left it, and the service answers its check as the stage 4 service does, with the root's revoked keys' list. */
const MOVED = "Licences are now held by signing in. This Studio's licence file stays where it is but no longer counts: publishing needs this Studio signed in, and signing in brings the licence this account holds.";
const MOVED_PL = "Licencje są teraz utrzymywane przez logowanie. Plik licencji tego Studia zostaje na swoim miejscu, ale już się nie liczy: do publikowania potrzeba zalogowania tego Studia, a logowanie przynosi licencję, którą ma to konto.";
LEGS.ls20 = async () => {
  const seen = {};
  for (const by of ["key", "email", "trial"]) {
    const reached = [];
    const thread = (verb) => { reached.push(verb); return Promise.resolve({ ok: true }); };
    const { svc, sh } = await world("ls20-" + by, { thread });
    try {
      svc.licence();
      await signedIn(sh, svc);
      const lead = sh.lead(), due = Date.now() - 13 * HOUR;
      const sealed = Buffer.from(SHELL_VAULT.encryptString("7K3M-Q9TV-2XRB-HN4W-8PZD-6YCF-1GJS-5EAA")).toString("base64");
      sh.setState(Object.assign({ by, lead, checked: due, tried: due }, by === "key" ? { keySealed: sealed } : {}));
      /* The licence file such a Studio was given then (the service's, as an older Studio wrote it), since this one writes none. */
      fs.writeFileSync(sh.licenceFile(), JSON.stringify(await L.createTestLicence({ org: "Kappa Tools", seats: 2, issued: L.localDay(),
        updatesUntil: "2027-11-02", via: DELEGATION }, SERVICEK.privateKey, SERVICEK.id)));
      const licBytes = fs.readFileSync(sh.licenceFile()), grantBytes = fs.readFileSync(sh.grantFile());
      const prevFetch = svc.fetch;
      svc.fetch = async (url, init) => (/\/check$/.test(String(url))
        ? new Response(JSON.stringify({ ok: false, reason: "signin", revoked: listOf([OTHER.pub], 5) }), { status: 403, headers: { "content-type": "application/json" } })
        : prevFetch(url, init));
      const res = await sh.ask("studio:licence-check");
      const n = await sh.ask("studio:licence");
      const st = sh.state(), kept = L.readRevocations(L.revokedFileFor(sh.licenceFile()), ROOTK.pub);
      const lic = await L.licenceState(L.readLicenceFile(sh.licenceFile()), { file: sh.licenceFile(), trustedKey: ROOTK.pub });
      sh.setState(Object.assign({}, sh.state(), { checked: due, tried: due }));
      await sh.tick({ writes: true });
      const quiet = sh.said.filter((l) => /the licence check was not answered: signin-moved/.test(l)).length;
      const stats = await sh.ask("studio:stats", sh.catalog);
      seen[by] = {
        said: !!res && res.error === MOVED && plT(res.error) === MOVED_PL && !!res.said && res.said.why === "signin-moved",
        kept: Buffer.compare(fs.readFileSync(sh.licenceFile()), licBytes) === 0 && Buffer.compare(fs.readFileSync(sh.grantFile()), grantBytes) === 0
          && lic.status === "active" && st.by === by && st.lead === lead && !("keySealed" in st),
        revoked: !!kept && kept.serial === 5,
        cover: !!n && n.signinMoved === true && n.licence && n.licence.status === "none" && n.works === false && n.by === by,
        works: quiet >= 1 && !!stats && !!stats.error && !!stats.said && stats.said.why === "stopped" && !reached.includes("statsFor"),
      };
    } finally { sh.done(); }
  }
  const part = (k) => ["key", "email", "trial"].every((by) => seen[by] && seen[by][k] === true);
  const line = (k) => JSON.stringify(Object.fromEntries(Object.entries(seen).map(([by, v]) => [by, v[k]])));
  check(part("said"), "ls20a a Studio activated before sign-in, its check answered \"signin\", is told plainly at Check now that its licence is"
    + " now kept by signing in, in English and Polish: " + line("said"));
  check(part("kept"), "ls20b its licence file and grant stay byte for byte and the licence reads active, its record keeps how it was activated,"
    + " and a kept purchase key is forgotten: " + line("kept"));
  check(part("revoked"), "ls20c the root's revoked keys' list the answer carries is kept: " + line("revoked"));
  check(part("cover"), "ls20d the cover asks the lead to sign in, the licence still active: " + line("cover"));
  check(part("works"), "ls20e the schedule's look says the same quietly, and statistics are refused as a stop, nothing reaching the thread, for a Studio activated"
    + " before sign-in does not work until it is signed in (was: and statistics are still read): " + line("works"));
};

/* Item 10 of the test architect's triage (STRANDS): the team key, made on the old computer, and its backup copy, opened by the
   shell through Studio's own readBackup and openBackup as the thread opens it. A world for each case, activated by key first. */
const COPY_WORDS = "a lantern on the quay at dusk";
async function teamKeyCopy(name) {
  const St = await import("../src/studio.mjs");
  const pair = await Sign.makePair(), copy = path.join(SCRATCH, name + "-team-key-copy.json");
  fs.mkdirSync(SCRATCH, { recursive: true });
  fs.writeFileSync(copy, JSON.stringify(Sign.passphraseFile(pair, COPY_WORDS), null, 1));
  const thread = (verb, ...a) => (verb === "readBackup" || verb === "openBackup" ? Promise.resolve().then(() => St[verb](...a)) : Promise.resolve({}));
  return { pair, copy, thread };
}
async function restoreCopy(sh, copy) {
  const pick = await sh.ask("studio:key-restore-pick", "t", "k");
  return sh.ask("studio:key-restore", pick && pick.file, COPY_WORDS);
}
const asideOf = (sh) => fs.readdirSync(path.dirname(sh.keyFile())).filter((f) => /\.made-at-activation-/.test(f));
LEGS.ls14 = async () => {
  /* The lead signs in first, and the team key's backup copy is restored. */
  {
    const t = await teamKeyCopy("ls14");
    const { svc, sh } = await world("ls14", { thread: t.thread, seat: true, env: { STUDIO_TEST_RESTORE: t.copy } });
    try {
      svc.licence();
      const act = await signedIn(sh, svc, { ready: true }), made = sh.lead();
      check(act && !act.error && !!made && made !== t.pair.public && sh.state().lead === made && holds(grantFor(sh.grantFile()), made),
        "ls14a CONTROL: signed in first, the sign-in made this Studio's key and bound the seat to it, and Check now ran under it: "
        + JSON.stringify(act && act.error));
      const back = await restoreCopy(sh, t.copy);
      const aside = asideOf(sh), asideKey = aside.length === 1 ? Sign.readKeyFile(path.join(path.dirname(sh.keyFile()), aside[0])) : null;
      check(back && !back.error && sh.lead() === t.pair.public && !!asideKey && asideKey.public === made && asideKey.kept === Sign.OS_WRAP,
        "ls14b the team key's backup copy is restored over the key the sign-in made, which had signed nothing, and that key is copied"
        + " aside beside it, still sealed: " + JSON.stringify(back && (back.error || back.keyId)) + ", aside " + JSON.stringify(aside));
      const sent = sh.calls.length;
      await wait(300);
      await sh.ask("studio:licence-check");
      const n = await sh.ask("studio:licence");
      check(sh.state().lead === made && n.keyChanged === true && n.grant === null && n.licence.status === "trial" && sh.calls.length === sent,
        "ls14c the certificate and the grant name the key set aside: the cover says the key changed, only the licence the root signed that this"
        + " Studio was seated with reads on, never the certificate of the key set aside (review xi, A2; was: the licence file reads on), and"
        + " nothing is sent for the restored key, signing in again being what brings the seat to it: "
        + JSON.stringify({ bound: sh.state().lead === made, keyChanged: n.keyChanged, licence: n.licence.status, grant: n.grant, sent: sh.calls.length - sent }));
    } finally { sh.done(); }
  }
  /* What stays: three Studios whose key is not one the restore may replace, each refused in today's sentence and keeping its key. */
  const REFUSED = "This Studio keeps another signing key, so the copy was not restored.";
  const kept = async (name, between, first) => {
    const t = await teamKeyCopy(name);
    const { svc, sh, ud } = await world(name, { thread: t.thread, seat: true, env: { STUDIO_TEST_RESTORE: t.copy } });
    try {
      svc.licence();
      if (first) await between(sh, ud);
      const act = await signedIn(sh, svc, { ready: true });
      if (!first) await between(sh, ud);
      const had = sh.lead(), back = await restoreCopy(sh, t.copy);
      return { activated: !!act && !act.error, refused: !!back && back.error === REFUSED, keyKept: !!had && sh.lead() === had, aside: asideOf(sh).length, said: back && back.error };
    } finally { sh.done(); }
  };
  const signed = await kept("ls14-signed", (sh) => sh.ask("studio:team-exports", sh.catalog, true));
  check(signed.activated && signed.refused && signed.keyKept && signed.aside === 0,
    "ls14d a key the sign-in made that was then handed out to sign (a team file's Export switch) stays: the restore is refused"
    + " in today's sentence and nothing is set aside: " + JSON.stringify(signed));
  const spaced = await kept("ls14-relay", (sh, ud) => {
    const f = Store.teamsFile(ud), team = "t-" + crypto.randomBytes(8).toString("hex"), rt = crypto.randomBytes(16).toString("hex");
    Store.keepRelay(f, team, rt, "https://etiuda.dev/relay/v1");
    Store.markRelay(f, team, { created: true });
  });
  check(spaced.activated && spaced.refused && spaced.keyKept && spaced.aside === 0,
    "ls14e a key the sign-in made under which the relay has since made a team's space stays, the restore refused: " + JSON.stringify(spaced));
  /* A key made with Make a signing key, before the sign-in, has signed nothing and made no relay space. The licence's own
     signature does not spend it (keySecret's licence use is quiet). The restore sets it aside and puts the team key in its place. */
  const tSet = await teamKeyCopy("ls14-settings");
  const wSet = await world("ls14-settings", { thread: tSet.thread, seat: true, env: { STUDIO_TEST_RESTORE: tSet.copy } });
  let settings = null;
  try {
    await wSet.sh.ask("studio:key-make");
    const made = wSet.sh.lead();
    wSet.svc.licence();
    const act = await signedIn(wSet.sh, wSet.svc);
    const back = await restoreCopy(wSet.sh, tSet.copy);
    const aside = asideOf(wSet.sh);
    const asideKey = aside.length === 1 ? Sign.readKeyFile(path.join(path.dirname(wSet.sh.keyFile()), aside[0])) : null;
    settings = { activated: !!act && !act.error, restored: !!back && !back.error && wSet.sh.lead() === tSet.pair.public,
      asideKept: !!asideKey && asideKey.public === made && asideKey.kept === Sign.OS_WRAP, notDeleted: aside.length === 1,
      said: back && (back.error || back.keyId) };
  } finally { wSet.sh.done(); }
  check(settings && settings.activated && settings.restored && settings.asideKept && settings.notDeleted,
    "ls14f a key made in Settings that has signed nothing and made no relay space is set aside, not deleted, and the team key's backup copy is restored: "
    + JSON.stringify(settings));
  /* The public-half comparison is what keeps a key that this Studio does not remember making. Make a signing key records
     its own half; naming another half in the store is a key the comparison must refuse. The plant that drops the comparison
     sets that key aside, and this check goes red. */
  const tOther = await teamKeyCopy("ls14-other");
  const wOther = await world("ls14-other", { thread: tOther.thread, seat: true, env: { STUDIO_TEST_RESTORE: tOther.copy } });
  let other = null;
  try {
    await wOther.sh.ask("studio:key-make");
    const had = wOther.sh.lead();
    const storeAt = path.join(wOther.ud, "studio.json");
    const store = JSON.parse(fs.readFileSync(storeAt, "utf8"));
    store.keyMade.pub = tOther.pair.public;
    fs.writeFileSync(storeAt, JSON.stringify(store, null, 1) + "\n");
    const back = await restoreCopy(wOther.sh, tOther.copy);
    other = { refused: !!back && back.error === REFUSED, keyKept: wOther.sh.lead() === had, aside: asideOf(wOther.sh).length };
  } finally { wOther.sh.done(); }
  check(other && other.refused && other.keyKept && other.aside === 0,
    "ls14g a key in place that is not the key this Studio remembers making stays, the restore refused: " + JSON.stringify(other));
  /* THE MARK WHERE THE SIGN-IN MAKES THE KEY (the test architect, 2026-11-22): since S-1b ls14's worlds are seated, and a seated
     Studio makes its key with Make a signing key (h2-keymade, proved in relay-studio h2d), so ls14a no longer reaches leadReady's own
     make. A Studio the gate does not yet let work makes its key as its sign-in does (signedIn, through the owner's Free seat), and
     that make must be remembered as this Studio's, or a team key's backup copy restored next is refused over a key that signed nothing. */
  const wFirst = await world("ls14-first");
  let first = null;
  try {
    wFirst.svc.licence();
    const had = wFirst.sh.lead();
    await signedIn(wFirst.sh, wFirst.svc);
    const made = wFirst.sh.lead();
    let mark = null;
    try { mark = JSON.parse(fs.readFileSync(path.join(wFirst.ud, "studio.json"), "utf8")).keyMade || null; } catch { mark = null; }
    first = { noKeyBefore: !had, made: !!made, markIsMade: !!mark && mark.pub === made };
  } finally { wFirst.sh.done(); }
  check(first && first.noKeyBefore && first.made && first.markIsMade,
    "ls14h a Studio not yet working makes its key as its sign-in does and remembers it as made here: " + JSON.stringify(first));
};

/* AFTER A TRIAL'S END (decisions 2026-09-24 02:01 and 02:03): "Publish, reading statistics and taking proposals pause with one
   calm sentence; editing, lint and export stay open". The trial is ended in the service's own table and brought by Check now,
   so the file is the service's; the thread answers what a leg names and records each verb that reached it. */
LEGS.ls15 = async () => {
  const reached = [];
  const thread = (verb) => { reached.push(verb); return Promise.resolve({ ok: true }); };
  const { svc, sh } = await world("ls15", { thread, env: { STUDIO_TEST_SAVE: path.join(SCRATCH, "ls15", "out.ec") } });
  try {
    await signedIn(sh, svc);
    const asks = async () => ({
      stats: await sh.ask("studio:stats", sh.catalog), list: await sh.ask("studio:proposals", sh.catalog),
      open: await sh.ask("studio:proposal-open", sh.catalog, path.join(sh.catalog, "inbox", "p.json"), "en"),
      decide: await sh.ask("studio:proposal-decide", sh.catalog, path.join(sh.catalog, "inbox", "p.json"), {}, "Ola", null),
      revert: await sh.ask("studio:proposal-revert", sh.catalog, path.join(sh.catalog, "inbox", "p.json"), {}),
      save: await sh.ask("studio:save-card", sh.catalog, "c-1", { title: "x" }),
    });
    const during = await asks(), duringReached = reached.splice(0);
    check(Object.values(during).every((x) => x && !x.error) && ["statsFor", "listProposals", "openProposal", "decideProposal"].every((v) => duringReached.includes(v)),
      "ls15a during the trial, statistics and proposals are read and taken: " + JSON.stringify(Object.values(during).map((x) => x && x.error).filter(Boolean)));
    svc.db.raw.prepare("UPDATE licences SET trial_ends = ? WHERE trial_ends IS NOT NULL").run(Date.now() - 1000);
    const n = await sh.ask("studio:licence-check");
    const lic = L.readLicenceFile(sh.licenceFile());
    check(n && !n.error && n.licence && n.licence.status === "trial-ended" && n.licence.paused === true && n.licence.trial && n.licence.trial.ends < Date.now()
      && n.works === false && !lic,
      "ls15b the trial ended at the service, Check now takes the certificate away, and the cover reads the trial ended, paused, from the service's"
      + " answer, so the door says so and offers the drafts as files (studio-door-words dw4) (the licence file goes as an everyday entitlement, Max 2026-11-22 15:37: was its licence file stating that end): "
      + JSON.stringify(n && (n.error || n.licence)));
    const after = await asks(), afterReached = reached.splice(0);
    const stopped = (x) => !!x && !!x.error && !!x.said && x.said.why === "stopped";
    check(Object.values(after).every(stopped) && afterReached.length === 0,
      "ls15c after its end Studio does not work: reading statistics, taking proposals, a proposal's marks turned back and a card's save are each"
      + " refused in the one sentence marked as a stop, and nothing reaches the thread (was: statistics and proposals paused in the trial's"
      + " sentence, a frame the page says in Polish): " + JSON.stringify(Object.values(after).map((x) => x && x.error)));
    const picked = await sh.ask("studio:export-pick", "Export", "out.ec", "");
    const exp = await sh.ask("studio:export-edition", sh.catalog, "2026-09-23", picked && picked.file);
    const kept = reached.splice(0);
    check(exp && !exp.error && kept.includes("exportEdition"),
      "ls15d and the way out stays open: an edition is still exported (was: editing stays open, a card is saved and a proposal's marks turned back): "
      + JSON.stringify([exp && exp.error, kept]));
  } finally { sh.done(); }
};

const shift = (day, n) => {
  const d = new Date(day + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/* A STUDIO THAT HAS NO TRIAL AND NO LICENCE DOES NOT WORK (Max, 2026-11-17 19:35: "sign in first, one 14 day trial, nothing before it";
   it replaces the period of use with no licence that decisions 2026-09-24 02:01 gave, and the statistics that waited for sign-in). Nobody signed in, then signed in with no licence: statistics, the proposal calls, a card's save and opening a project are
   each refused in the one sentence marked as a stop, nothing reaching the thread, while the licence cover still answers and says the
   Studio does not work, and exporting an edition still reaches the thread. Given a trial, the same asks are answered. */
LEGS.ls16 = async () => {
  const reached = [];
  const thread = (verb) => { reached.push(verb); return Promise.resolve({ ok: true, lint: { errors: 0 } }); };
  const out = path.join(SCRATCH, "ls16", "out.ec");
  const { ud, sh } = await world("ls16", { thread, env: { STUDIO_TEST_SAVE: out, ETIUDA_SIGNIN_PREVIEW: "1" } });
  const stopped = (x) => !!x && !!x.error && !!x.said && x.said.why === "stopped";
  const asks = async () => ({
    stats: await sh.ask("studio:stats", sh.catalog),
    list: await sh.ask("studio:proposals", sh.catalog),
    open: await sh.ask("studio:proposal-open", sh.catalog, path.join(sh.catalog, "inbox", "p.json"), "en"),
    decide: await sh.ask("studio:proposal-decide", sh.catalog, path.join(sh.catalog, "inbox", "p.json"), {}, "Ola", null),
    save: await sh.ask("studio:save-card", sh.catalog, "c-1", { title: "x" }),
    opened: await sh.ask("studio:open", sh.catalog),
  });
  try {
    const nobody = await asks(), nobodyReached = reached.splice(0);
    const cover = await sh.ask("studio:licence");
    check(Object.values(nobody).every(stopped) && nobodyReached.length === 0 && cover && !cover.error && cover.works === false,
      "ls16a nobody signed in, no licence: statistics, the three proposal calls, a card's save and opening a project are each refused as a stop,"
      + " nothing reaches the thread, and the licence cover still answers, not working (was: statistics waited for sign-in in the page's"
      + " sentence on the first day and the fourteenth): " + JSON.stringify(Object.values(nobody).map((x) => x && x.error)));
    fs.writeFileSync(path.join(ud, "licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft" }));
    const signed = await asks(), signedReached = reached.splice(0);
    const n = await sh.ask("studio:licence");
    check(Object.values(signed).every(stopped) && signedReached.length === 0 && n && !n.error && n.licence && n.licence.status === "none"
        && n.licence.paused === false && n.works === false,
      "ls16b signed in with no licence the same asks are the same stop, nothing reaches the thread, and the cover reads no licence, not"
      + " working (was: after the fourteenth day from the first run the cover read the period ended, paused): "
      + JSON.stringify(n && (n.error || [n.licence, n.works])));
    const picked = await sh.ask("studio:export-pick", "Export", "out.ec", "");
    const exp = await sh.ask("studio:export-edition", sh.catalog, "2026-09-23", picked && picked.file);
    const kept = reached.splice(0);
    check(exp && !exp.error && kept.indexOf("exportEdition") >= 0,
      "ls16c exporting an edition still reaches the thread while the Studio does not work (was: editing, opening the project and exporting"
      + " stayed open): " + JSON.stringify([exp && exp.error, kept]));
    await seatWorld(ud);
    const given = await asks(), givenReached = reached.splice(0);
    check(Object.values(given).every((x) => x && !x.error) && ["statsFor", "listProposals", "openProposal", "decideProposal", "saveCard"].every((v) => givenReached.includes(v)),
      "ls16d given a trial running, the same asks are answered and reach the thread: " + JSON.stringify(Object.values(given).map((x) => x && x.error).filter(Boolean)));
  } finally { sh.done(); }
};

/* The signing key's secret is hex. An epoch key finding 4 keeps is 32 bytes sealed as base64. ls18 and ls19 count the
   signing key only: once for the pause note when a focus saw a change, and once more for the absorb only when the team
   file's rev or lead changed. The epoch key is read to see it is already kept, handed to the running syncer, used when a
   changed folder is landed, and loaded when a new lead restarts the syncer. */
function countsAsSigningUnlock(plain) {
  const raw = Buffer.from(String(plain), "base64");
  return !(raw.length === 32 && raw.toString("base64") === plain);
}

LEGS.ls17 = async () => {
  let unlocks = 0;
  const vault = {
    isEncryptionAvailable: () => true,
    encryptString: (s) => Buffer.from("sealed:" + Buffer.from(String(s), "utf8").reverse().toString("hex"), "utf8"),
    decryptString: (b) => {
      unlocks++;
      const t = Buffer.from(b).toString("utf8");
      if (!t.startsWith("sealed:")) throw new Error("not sealed here");
      return Buffer.from(t.slice(7), "hex").reverse().toString("utf8");
    },
  };
  const { ud, sh } = await world("ls17", { safeStorage: vault, seat: true });
  const share1 = path.join(ud, "share1");
  const share2 = path.join(ud, "share2");
  fs.mkdirSync(share1, { recursive: true });
  fs.mkdirSync(share2, { recursive: true });
  const teamId1 = "t-" + crypto.randomBytes(8).toString("hex");
  const teamId2 = "t-" + crypto.randomBytes(8).toString("hex");
  fs.writeFileSync(path.join(ud, Store.TEAMS_FILE), JSON.stringify({
    format: 1,
    kind: "etiuda-studio-teams",
    teams: {
      [teamId1]: { name: "Team 1", folder: share1, autoAdmit: false, epoch: 1 },
      [teamId2]: { name: "Team 2", folder: share2, autoAdmit: false, epoch: 1 },
    },
  }, null, 1) + "\n");
  const pair = await Sign.makePair();
  const keyDoc = Sign.osFile(pair, vault.encryptString(pair.der));
  fs.writeFileSync(sh.keyFile(), JSON.stringify(keyDoc, null, 1) + "\n");

  const shellMod = () => nodeRequire(path.join(ROOT, "shell", "main.js"));
  /* A focus starts a look; the count is taken once no look is still running. (Each folder team's first
     listing started another look while Studio kept a mirror of its folder, which it no longer does, A-S5.) */
  const looksDone = async () => {
    const end = Date.now() + 25000;
    let idle = 0;
    while (Date.now() < end) {
      let running = null;
      try { running = shellMod().teamWatchNow && shellMod().teamWatchNow(); } catch { running = null; }
      if (running) { idle = 0; try { await running; } catch { /* the watch said why */ } continue; }
      await wait(20);
      idle += 20;
      if (idle >= 60) return;
    }
  };
  const focus = async () => {
    sh.windows[0].winOn["focus"][0]();
    await looksDone();
  };
  try {
    await focus();
    const u1 = unlocks;
    await focus();
    const u2 = unlocks - u1;
    check(u2 === 0,
      "ls17 watchOnce unlocks lazily: a run with nothing changed makes no unlock (was: and a run where the pause flips unlocks once; the watch"
      + " now runs only where Studio works, and a Studio that works is not paused, so the pause cannot flip under it): " + JSON.stringify([u2]));
  } finally { sh.done(); }
};

/* RETIRED (the shared-folder team's removal, db433b79; red there and on every tree since): ls18, "watchOnce absorbs once across desk file changes and absorbs again when
   team file rev or lead changes". It counted signing-key unlocks over a world whose team is kept at a shared folder, which Studio no longer watches; over a relay team
   the same watch unlocks for the relay's own signing too, so the counts 2, 1, 2, 2 do not hold and say nothing of the memo. The memo is held where it is kept (src/studio.mjs). */
LEGS.ls18 = async () => {};

/* The memo is set only where the book was read and kept: a recovery copy that did not open, and a throw after the book was
   absorbed, are each tried again at the next run that sees the folder change (board 945 item 8, the test architect's follow-up). */
async function absorbRig(name, o) {
  let unlocks = 0;
  const vault = {
    isEncryptionAvailable: () => true,
    encryptString: (s) => Buffer.from("sealed:" + Buffer.from(String(s), "utf8").reverse().toString("hex"), "utf8"),
    decryptString: (b) => {
      const t = Buffer.from(b).toString("utf8");
      if (!t.startsWith("sealed:")) throw new Error("not sealed here");
      const plain = Buffer.from(t.slice(7), "hex").reverse().toString("utf8");
      if (countsAsSigningUnlock(plain)) unlocks++;
      return plain;
    },
  };
  const { ud, sh } = await world(name, { safeStorage: vault, seat: true });
  const share = path.join(ud, "share");
  fs.mkdirSync(share, { recursive: true });
  const pair = await Sign.makePair();
  fs.writeFileSync(sh.keyFile(), JSON.stringify(Sign.osFile(pair, vault.encryptString(pair.der)), null, 1) + "\n");
  const teamId = "t-" + crypto.randomBytes(8).toString("hex"), teamKey = crypto.randomBytes(32);
  let team = Team.newTeam({ id: teamId, catalogs: ["cat-1"], lead: { keyId: pair.keyId, public: pair.public }, sealed: true });
  team = Team.withRecovery(team, teamKey, o.recovery || Team.recoveryOf(sh.keyFile(), pair.der));
  team = (await Team.writeTeam(share, team, { key: sh.keyFile(), passphrase: pair.der })).team;
  const teamsFile = path.join(ud, Store.TEAMS_FILE);
  fs.writeFileSync(teamsFile, JSON.stringify({ format: 1, kind: "etiuda-studio-teams", teams: {
    [teamId]: { name: "Team 1", folder: share, autoAdmit: false, epoch: 1 } } }, null, 1) + "\n");
  if (o.book) {
    /* A book that names one handled answer, so that absorbing it changes the landing record and writes it. */
    const quiet = { isEncryptionAvailable: vault.isEncryptionAvailable, encryptString: vault.encryptString,
      decryptString: (b) => Buffer.from(Buffer.from(b).toString("utf8").slice(7), "hex").reverse().toString("utf8") };
    const Book = await import("../src/lead-book.mjs");
    const held = await Team.heldTeam(share, { key: sh.keyFile() });
    await Book.publishLeadBook({ folder: share, team: held.team, keyFile: sh.keyFile(), secret: pair.der, teamsFile, vault: quiet,
      teamKey, ledger: { done: { "desk-answer-1": true } }, now: Date.now() });
  }
  const focus = async () => {
    sh.windows[0].winOn["focus"][0]();
    await wait(20);
    await wait(480);
  };
  const deskWrites = () => {
    const deskDir = path.join(share, "desks", "k-" + crypto.randomBytes(8).toString("hex"));
    fs.mkdirSync(deskDir, { recursive: true });
    /* A file a folder team's mirror takes, as ls18's (board 945 stage 3 (b)). */
    fs.writeFileSync(path.join(deskDir, "stats.estat"), JSON.stringify({ format: 1, kind: "etiuda-stats-sealed", team: teamId }) + "\n");
  };
  return { ud, sh, focus, deskWrites, unlocks: () => unlocks };
}

/* RETIRED (as ls18): ls19a, "a recovery copy that did not open is read again at the next run where only a desk's file changed", and ls19b, "a throw in writeLanded is not
   memoised: the next run where only a desk's file changed reads the book again and lands it"; absorbRig above is kept for them. */
LEGS.ls19 = async () => {};


/* What each route's body may hold, and nothing else. */
const ROUTE_FIELDS = { "check": ["lead", "sig", "t"] };
/* THE PAID END (piece S-0; Max, 2026-11-17 20:41, "I agree with your recommendation", to a paid licence that ends stopping Studio as it
   stops the desk): past a paid licence's end the service answers a check ended "expired", and Studio takes it as it takes a refund, its own
   certificate taken away so it stops. Since the licence file goes as an everyday entitlement (Max, 2026-11-22 15:37) nothing is written or
   set aside: these checks said the file was set aside as .ended, and .ended-2 on a second end. */
LEGS.ls21 = async () => {
  const { svc, sh } = await world("ls21");
  try {
    const { id } = svc.licence();
    const setPaid = (ms) => svc.db.raw.prepare("UPDATE licences SET paid_until = ? WHERE id = ?").run(ms, id);
    setPaid(Date.now() + 1500);
    const r0 = await signedIn(sh, svc);
    const file = sh.licenceFile(), aside = file + Client.ENDED;
    check(r0 && !r0.error && r0.licence && r0.licence.status === "active" && r0.works === true && !fs.existsSync(file),
      "ls21a signed in before the paid end, the cover reads the licence active and the Studio works, no file written (was: Check now writes"
      + " the licence, its file stating its paid end): " + JSON.stringify(r0 && (r0.error || [r0.licence.status, r0.works])));
    await wait(1600);
    const r1 = await sh.ask("studio:licence-check");
    const st1 = sh.state();
    check(!fs.existsSync(file) && !fs.existsSync(aside) && r1 && !r1.error && r1.licence && r1.licence.status === "none" && r1.works === false
      && !(st1.seatCerts && st1.seatCerts.studio) && st1.by === "signin" && st1.lead === sh.lead() && typeof st1.signinCode === "string",
      "ls21b past the paid end, Check now takes the certificate away and the Studio stops, reading no licence, nothing set aside; the sign-in,"
      + " its key and its seat's code stay (was: the file set aside as .ended): " + JSON.stringify([fs.existsSync(aside), r1 && (r1.error || [r1.licence.status, r1.works]), st1.by]));
    setPaid(Date.now() + 365 * DAY);
    await sh.ask("studio:licence-check");
    const r2 = await signedIn(sh, svc), g2 = grantFor(sh.grantFile());
    check(r2 && !r2.error && r2.licence && r2.licence.status === "active" && r2.works === true && holds(g2, sh.lead()) && g2.paid === true && !fs.existsSync(aside),
      "ls21c paid again, signing in brings the certificate and the licence back, active, with a paid grant, nothing set aside (was: the next"
      + " Check now brought the file back): " + JSON.stringify(r2 && (r2.error || [r2.licence.status, r2.works])));
    setPaid(Date.now() - 1000);
    await sh.ask("studio:licence-check");
    check(!fs.existsSync(file) && !fs.existsSync(aside) && !fs.existsSync(aside + "-2"),
      "ls21d ended a second time, nothing is set aside, there being no file (was: the file went to .ended-2 beside the first): "
      + JSON.stringify([fs.existsSync(aside), fs.existsSync(aside + "-2")]));
  } finally { sh.done(); }
  const { svc: s2, sh: h2 } = await world("ls21-refund");
  try {
    const { id } = s2.licence();
    await signedIn(h2, s2);
    const file = h2.licenceFile();
    s2.db.raw.prepare("UPDATE licences SET refunded = 1 WHERE id = ?").run(id);
    const r = await h2.ask("studio:licence-check");
    check(!fs.existsSync(file) && !fs.existsSync(file + Client.ENDED) && r && !r.error && r.licence && r.licence.status === "none" && r.works === false,
      "ls21e a refund at Check now takes the certificate away and the Studio stops, reading no licence, nothing moved (was: the licence file"
      + " moved to .ended): " + JSON.stringify([fs.existsSync(file + Client.ENDED), r && (r.error || [r.licence.status, r.works])]));
  } finally { h2.done(); }
};

LEGS.ls8 = async () => {
  const { svc, sh, ud } = await world("ls8", { seat: true });
  try {
    svc.licence();
    await signedIn(sh, svc);
    await sh.ask("studio:licence-check");
    const bad = sh.calls.filter((c) => {
      const route = c.url.slice("https://etiuda.dev/licence/v1/".length);
      let body = null;
      try { body = JSON.parse(c.body); } catch { return true; }
      return c.method !== "POST" || !ROUTE_FIELDS[route] || Object.keys(body).sort().join() !== ROUTE_FIELDS[route].join()
        || c.body.indexOf(ud.split(path.sep).join("/")) >= 0 || c.body.indexOf(JSON.stringify(ud).slice(1, -1)) >= 0
        || (body.lead !== undefined && body.lead !== sh.lead());
    });
    check(sh.calls.length === 2 && bad.length === 0,
      "ls8a every call, " + sh.calls.length + " of them, is a POST to the licence service's address by a route's name with its"
      + " route's fields alone, the lead the Studio's own key, and no path: " + JSON.stringify(bad.map((c) => c.url)));
  } finally { sh.done(); }
};

LEGS.ls9 = async () => {
  const { sh } = await world("ls9");
  try {
    await sh.ask("studio:key-make");
    for (const t of sh.timers) t.fn();
    await wait(300);
    const r = await sh.ask("studio:licence-check");
    await wait(100);
    check(sh.calls.length === 0 && r && !r.error && r.by === null,
      "ls9a a Studio never activated sends nothing, at the schedule's looks or at Check now: " + sh.calls.length + " call(s)");
  } finally { sh.done(); }
  /* THE PLAN ITSELF (the test architect, 2026-11-22): since S-1b a Studio nobody signed in to is refused as a stop before the
     schedule asks planFor, so ls9a no longer reaches the line client-never guards. A key held and no activation is asked here
     directly, and the plant that lets such a Studio check turns this red. */
  const plan = Client.planFor({}, "ab".repeat(32), Date.now()), planNoKey = Client.planFor({ by: "lead", lead: "ab".repeat(32) }, "", Date.now());
  check(plan === "none" && planNoKey === "none",
    "ls9b the plan for a Studio that holds a key and was never activated, or was activated and holds no key now, is none: " + JSON.stringify([plan, planNoKey]));
};

LEGS.ls10 = async () => {
  const { sh } = await world("ls10");
  try {
    const once = sh.timers.find((t) => t.kind === "once"), every = sh.timers.find((t) => t.kind === "every");
    check(!!once && once.ms === 60000 && !!every && every.ms === HOUR,
      "ls10a the shell arms a first look a minute after the window and one each hour: " + JSON.stringify(sh.timers.map((t) => [t.kind, t.ms])));
  } finally { sh.done(); }
  const now = 1793610000000, lead = "ab".repeat(32);
  const P = (s) => Client.planFor(s, lead, now);
  check(P({}) === "none" && P({ by: "key", lead, checked: now - 11 * HOUR, tried: now - 11 * HOUR }) === "none"
    && P({ by: "key", lead, checked: now - 12 * HOUR, tried: now - 12 * HOUR }) === "check"
    && P({ by: "key", lead, checked: now - 13 * HOUR, tried: now - 10 * 60000 }) === "none"
    && P({ by: "key", lead, checked: now - 13 * HOUR, tried: now - 61 * 60000 }) === "check"
    && P({ by: "key", lead: "cd".repeat(32), keySealed: "x", checked: now, tried: now }) === "ask"
    && P({ by: "signin", lead: "cd".repeat(32), checked: now, tried: now }) === "ask"
    && P({ by: "email", lead: "cd".repeat(32), checked: now, tried: now }) === "ask"
    && P({ by: "trial", lead: "cd".repeat(32), checked: now, tried: now }) === "ask"
    && Client.CHECK_MS === 12 * HOUR && Client.RETRY_MS === HOUR,
    "ls10b twelve hours between answered checks, an hour after one not answered, and a key made again asks the lead to sign in,"
    + " a purchase key kept or not");
};

LEGS.ls11 = async () => {
  const dir = path.join(SCRATCH, "ls11");
  fs.mkdirSync(dir, { recursive: true });
  const lead = newKey(), ctx = { lead: lead.pub, now: Date.now(), licenceFile: path.join(dir, L.LICENCE_FILE),
    grantFile: path.join(dir, "relay-grant.json"), trustedKey: ROOTK.pub, roots: [ROOTK.pub] };
  const svc = service();
  svc.licence({ owner: "ls11-first", leads: ["ls11-second"] });
  /* A sign-in's answer, as Studio's client asks the signin route for it. */
  const signInWith = async (key, sub) => {
    const seed = crypto.randomBytes(32).toString("hex");
    return Client.signIn(svc.ask, key, "microsoft", idToken({ sub, nonce: await RQ.signinNonce(key.public, seed) }), Date.now(), seed);
  };
  const open = { privateKey: lead.privateKey, public: lead.pub };
  const a = await signInWith(open, "ls11-first");
  const forgedGrant = Object.assign({}, a.grant, { lead: OTHER.pub });
  const strayLicence = await L.createTestLicence({ org: "Stray" }, OTHER.privateKey, "stray");
  const r1 = await Client.take(Object.assign({}, a, { grant: forgedGrant, licence: strayLicence }), ctx);
  check(a.ok === true && r1.grant.indexOf("refused:") === 0 && r1.licence === "refused:signature"
    && !fs.existsSync(ctx.grantFile) && !fs.existsSync(ctx.licenceFile),
    "ls11a a grant naming another key and a licence the root did not stand behind are refused, and nothing is written: " + JSON.stringify(r1));
  const r2 = await Client.take(Object.assign({}, a, { revoked: listOf([SERVICEK.pub], 4) }), ctx);
  check(r2.revoked === "kept" && r2.licence === "refused:revoked" && !fs.existsSync(ctx.licenceFile),
    "ls11b a list naming the service's key, arriving with its licence, refuses that licence in the same answer: " + JSON.stringify(r2));
  check(r2.grant === "refused:revoked" && !fs.existsSync(ctx.grantFile),
    "ls11c and the grant that key signed, in the same answer, is refused and not written (E1): " + JSON.stringify(r2.grant));
  /* E2: a licence the root signed by hand, held, is never written over by the service's. */
  const dir2 = path.join(SCRATCH, "ls11-hand");
  fs.mkdirSync(dir2, { recursive: true });
  const ctx2 = Object.assign({}, ctx, { licenceFile: path.join(dir2, L.LICENCE_FILE), grantFile: path.join(dir2, "relay-grant.json") });
  const hand = await L.createTestLicence({ org: "By Hand", seats: 5 }, ROOTK.privateKey, "etiuda-root");
  fs.writeFileSync(ctx2.licenceFile, JSON.stringify(hand));
  const handBytes = fs.readFileSync(ctx2.licenceFile);
  const lead2 = newKey(), open2 = { privateKey: lead2.privateKey, public: lead2.pub };
  const a2 = await signInWith(open2, "ls11-second");
  const r3 = await Client.take(a2, Object.assign({}, ctx2, { lead: lead2.pub }));
  const svcOver = path.join(dir2, "svc"), ctx3 = Object.assign({}, ctx2, { lead: lead2.pub, licenceFile: path.join(svcOver, L.LICENCE_FILE) });
  fs.mkdirSync(svcOver, { recursive: true });
  fs.writeFileSync(ctx3.licenceFile, JSON.stringify(a2.licence));
  const svcBefore = fs.readFileSync(ctx3.licenceFile, "utf8");
  const r4 = await Client.take(Object.assign({}, a2, { licence: Object.assign({}, a2.licence) }), ctx3);
  check(a2.ok === true && r3.licence === "held-by-hand" && Buffer.compare(fs.readFileSync(ctx2.licenceFile), handBytes) === 0
    && r3.grant === "kept" && r4.licence === "kept" && fs.readFileSync(ctx3.licenceFile, "utf8") === svcBefore,
    "ls11d a licence the root signed by hand is never written over by the service's, while the grant is kept, and a service licence is"
    + " judged and written nowhere, the file there left as it was (the licence file goes as an everyday entitlement, Max 2026-11-22 15:37: was renewed over a service licence) (E2): " + JSON.stringify([r3.licence, r3.grant, r4.licence]));
  /* A trial's licence never takes the place of a full licence held and accepted; over a trial's own it is kept. */
  const trialDoc = await L.createTestTrialLicence({ issued: new Date().toISOString().slice(0, 10), ends: Date.now() + 5 * DAY, via: DELEGATION },
    SERVICEK.privateKey, SERVICEK.id);
  const r5 = await Client.take({ ok: true, licence: trialDoc }, ctx3);
  const dir4 = path.join(SCRATCH, "ls11-trial"), ctx4 = Object.assign({}, ctx3, { licenceFile: path.join(dir4, L.LICENCE_FILE) });
  fs.mkdirSync(dir4, { recursive: true });
  const r6 = await Client.take({ ok: true, licence: trialDoc }, ctx4);
  check(r5.licence === "held-licence" && L.readLicenceFile(ctx3.licenceFile).kind === L.LICENCE_KIND
    && r6.licence === "kept" && !fs.existsSync(ctx4.licenceFile),
    "ls11f a trial's licence is never written over a full licence held, and where none is it is judged and written nowhere (the licence file goes as an everyday entitlement, Max 2026-11-22 15:37: was kept there): " + JSON.stringify([r5.licence, r6.licence]));
  /* Note 4: an answer over 256 KiB is not read. */
  const huge = { ok: true, licence: a2.licence, grant: a2.grant, pad: "x".repeat(300 * 1024) };
  const capped = await Client.quietCheck(async () => ({ status: 200, bytes: Buffer.from(JSON.stringify(huge)) }), open2, Date.now());
  const fits = await Client.quietCheck(async () => ({ status: 200, bytes: Buffer.from(JSON.stringify({ ok: true, licence: null })) }), open2, Date.now());
  check(capped.ok === false && capped.reason === "unreached" && fits.ok === true,
    "ls11e an answer over 256 KiB is not read, and a small one is: " + JSON.stringify([capped.reason, fits.ok]));
};

/* Claude alpha's ruling on the test architect's C5: where Studio's one door sends a licence call, src/wire.cjs loaded fresh
   with electron's net answered by a stand-in that records the address and answers nothing more, from the tree (a development
   copy) or from a copy under resources/app.asar (an installed one), with ETIUDA_LICENCE_ORIGIN as given. */
async function wireCalls(at, value) {
  const Module = nodeRequire("node:module"), load = Module._load, was = process.env.ETIUDA_LICENCE_ORIGIN, seen = [];
  const electron = { net: { fetch: async (url) => { seen.push(String(url)); return { status: 200, headers: { get: () => null },
    body: new ReadableStream({ start(c) { c.close(); } }) }; } } };
  if (value === undefined) delete process.env.ETIUDA_LICENCE_ORIGIN; else process.env.ETIUDA_LICENCE_ORIGIN = value;
  Module._load = function (req) { return req === "electron" ? electron : load.apply(this, arguments); };
  try {
    delete nodeRequire.cache[nodeRequire.resolve(at)];
    const wire = nodeRequire(at);
    try { await wire.licenceRequest("check", Buffer.from("{}")); } catch { /* the stand-in's answer is not the point */ }
    return seen[0] || "(no call)";
  } finally {
    Module._load = load;
    delete nodeRequire.cache[nodeRequire.resolve(at)];
    if (was === undefined) delete process.env.ETIUDA_LICENCE_ORIGIN; else process.env.ETIUDA_LICENCE_ORIGIN = was;
  }
}
LEGS.ls13 = async () => {
  const tree = path.join(ROOT, "src", "wire.cjs");
  const installed = path.join(SCRATCH, "ls13", "resources", "app.asar", "src", "wire.cjs");
  fs.mkdirSync(path.dirname(installed), { recursive: true });
  fs.copyFileSync(tree, installed);
  const PROD = "https://etiuda.dev/licence/v1/check", STAGING = "https://etiuda.dev/licence-staging/v1/";
  const unset = await wireCalls(tree), staging = await wireCalls(tree, STAGING);
  check(unset === PROD && staging === STAGING + "check",
    "ls13a a development Studio calls production with ETIUDA_LICENCE_ORIGIN unset, and staging with it set to staging's origin: " + unset + " | " + staging);
  const others = ["https://example.com/licence-staging/v1/", "http://etiuda.dev/licence-staging/v1/", "https://etiuda.dev.example.com/licence-staging/v1/",
    "https://etiuda.dev:8443/licence-staging/v1/", "https://etiuda.dev/licence-staging/v1", "https://user@etiuda.dev/licence-staging/v1/", " https://etiuda.dev/licence-staging/v1/"];
  const got = [];
  for (const v of others) got.push(await wireCalls(tree, v));
  check(got.every((u) => u === PROD), "ls13b anything else is ignored and production called: " + got.filter((u) => u !== PROD).join(", "));
  const inst = [await wireCalls(installed, STAGING), await wireCalls(installed)];
  check(inst.every((u) => u === PROD), "ls13c an installed Studio ignores it, staging's origin included, and calls production: " + inst.join(" | "));
};

/* STUDIO'S GATE RESTS ON ITS OWN SEAT CERTIFICATE (review xi, A1, A2, B5; Max, 2026-11-22 15:37, in decisions.md: a lead need not work
   offline past the certificate's thirty days, "no; what does it mean to work offline as a lead anyway? Why is this even a question?").
   A sign-in and its renewal answer a certificate the service signs for this Studio's own key, which Studio keeps; Studio works on it,
   with no licence file at all; a licence file and a sign-in's state copied to another Studio, under another key, do not make it work,
   nor does a sign-in's state with a service-issued licence file and no certificate; a licence the root signed by hand works with no
   sign-in at all, the one narrow path for a customer who cannot sign in; and a licence-service.json another program holds keeps a
   Studio working on the certificate it already verified. */
LEGS.lsx1 = async () => {
  const { ud, svc, sh } = await world("lsx1");
  let sh2 = null, sh3 = null, sh4 = null, shDone = false;
  try {
    svc.licence({ org: "Kappa Tools", seats: 2 });
    const r = await signedIn(sh, svc);
    const lead = sh.lead(), st = sh.state(), cert = st.seatCerts && st.seatCerts.studio;
    check(r && !r.error && !!cert && cert.kind === "etiuda-seat-certificate" && cert.desk === lead && cert.until > Date.now()
        && cert.until - cert.issued <= 30 * DAY,
      "lsx1a signed in, the service answers a seat certificate for this Studio's own key, running thirty days at most, and Studio keeps it: "
      + JSON.stringify(r && (r.error || (cert ? [cert.desk === lead, cert.until - cert.issued] : Object.keys(st.seatCerts || {})))));
    const noFile = await sh.ask("studio:licence");
    check(noFile && !noFile.error && noFile.works === true,
      "lsx1b with its licence file gone, a Studio holding its own certificate works: " + JSON.stringify(noFile && (noFile.error || noFile.works)));
    const stateAt = path.join(ud, "licence-service.json"), realRead = fs.readFileSync;
    await sh.ask("studio:licence");
    fs.readFileSync = function (p, ...rest) {
      if (typeof p === "string" && path.resolve(p) === path.resolve(stateAt)) {
        const err = new Error("EBUSY: resource busy or locked, open '" + p + "'");
        err.code = "EBUSY"; err.syscall = "open"; err.path = p;
        throw err;
      }
      return realRead.call(this, p, ...rest);
    };
    let held = null;
    try { held = await sh.ask("studio:licence"); } finally { fs.readFileSync = realRead; }
    check(held && !held.error && held.works === true,
      "lsx1f with licence-service.json held by another program, the Studio keeps working on the certificate it already verified: "
      + JSON.stringify(held && (held.error || held.works)));
    sh.done(); shDone = true;
    /* A2: the other Studio holds a key of its own (made while a root-signed licence let it work), then takes this Studio's files. */
    const w2 = await world("lsx1-copy", { seat: true });
    sh2 = w2.sh;
    await sh2.ask("studio:key-make");
    fs.rmSync(sh2.licenceFile(), { force: true }); /* the root's licence that let it make its key: the copy is the first Studio's alone */
    fs.copyFileSync(path.join(ud, "licence-service.json"), path.join(w2.ud, "licence-service.json"));
    const copied = await sh2.ask("studio:licence"), lead2 = sh2.lead();
    sh2.done(); sh2 = null;
    check(!!lead2 && lead2 !== lead && copied && !copied.error && copied.works === false,
      "lsx1c a licence file and a sign-in's state copied to another Studio, under its own key, do not make it work: "
      + JSON.stringify(copied && (copied.error || [copied.works, copied.licence && copied.licence.status])));
    const w3 = await world("lsx1-nocert");
    sh3 = w3.sh;
    const bare = Object.assign({}, st);
    delete bare.seatCerts;
    fs.writeFileSync(path.join(w3.ud, "licence-service.json"), JSON.stringify(bare));
    fs.copyFileSync(sh.keyFile(), sh3.keyFile());
    const noCert = await sh3.ask("studio:licence");
    sh3.done(); sh3 = null;
    check(noCert && !noCert.error && noCert.works === false && noCert.licence && noCert.licence.status === "none",
      "lsx1d a sign-in's state, under the same key, with what the service said of its licence and no certificate does not make it work: "
      + JSON.stringify(noCert && (noCert.error || [noCert.works, noCert.licence && noCert.licence.status])));
    const w4 = await world("lsx1-root", { seat: true });
    sh4 = w4.sh;
    fs.rmSync(path.join(w4.ud, "licence-service.json"), { force: true });
    const byHand = await sh4.ask("studio:licence");
    check(byHand && !byHand.error && byHand.works === true && byHand.by === null,
      "lsx1e a licence the root signed by hand works with no sign-in at all: " + JSON.stringify(byHand && (byHand.error || [byHand.works, byHand.by])));
  } finally { if (!shDone) sh.done(); if (sh2) sh2.done(); if (sh3) sh3.done(); if (sh4) sh4.done(); }
};

/* THE LICENCE FILE GOES AS AN EVERYDAY ENTITLEMENT (Max's ruling of 2026-11-22 15:37, as Claude alpha carried it out; Claudius's pass of
   17:50): Studio writes no licence file the service issued, and leaves one already on disk in place, byte for byte and unread, even at a
   paid end; the cover reads the organisation, seats and updates from the service's answer and the certificate; and a lead whose Check now
   cannot reach the service works on, on the certificate this computer verified (Claude alpha's condition). */
LEGS.lsx2 = async () => {
  const { ud, svc, sh } = await world("lsx2");
  try {
    const { id } = svc.licence({ org: "Lambda Works", seats: 3 });
    const r = await signedIn(sh, svc);
    check(r && !r.error && !fs.existsSync(sh.licenceFile()) && r.works === true && r.licence && r.licence.status === "active"
        && r.licence.org === "Lambda Works" && r.licence.seats === 3 && typeof r.licence.updatesUntil === "string",
      "lsx2a signed in, no licence file is written, the Studio works, and the cover reads the organisation, seats and updates from the"
      + " service's answer: " + JSON.stringify(r && (r.error || [fs.existsSync(sh.licenceFile()), r.works, r.licence])));
    /* A licence the service issued, as an older Studio wrote it there. */
    const old = "window.E_LICENSE = " + JSON.stringify(await L.createTestLicence({ org: "Lambda Works", seats: 3, issued: L.localDay(),
      updatesUntil: "2027-11-02", via: DELEGATION }, SERVICEK.privateKey, SERVICEK.id)) + ";" + NL;
    fs.writeFileSync(sh.licenceFile(), old);
    svc.db.raw.prepare("UPDATE licences SET paid_until = ? WHERE id = ?").run(Date.now() - 1000, id);
    const ended = await sh.ask("studio:licence-check");
    const stays = fs.existsSync(sh.licenceFile()) && fs.readFileSync(sh.licenceFile(), "utf8") === old && !fs.existsSync(sh.licenceFile() + Client.ENDED);
    check(stays && ended && !ended.error && ended.works === false && ended.by === "signin" && ended.licence && ended.licence.status === "none",
      "lsx2b a licence file already on disk is left in place, byte for byte, and set aside never, even at a paid end, which stops the Studio,"
      + " its cover the door's stopped state that offers the drafts as files and Check now (studio-door-words dw6): "
      + JSON.stringify(ended && (ended.error || [stays, ended.works, ended.licence && ended.licence.status])));
    svc.db.raw.prepare("UPDATE licences SET paid_until = ? WHERE id = ?").run(Date.now() + 365 * DAY, id);
    await signedIn(sh, svc);
    const real = svc.fetch;
    svc.fetch = async () => { throw new Error("offline"); };
    let away = null;
    try { away = await sh.ask("studio:licence-check"); } finally { svc.fetch = real; }
    const after = await sh.ask("studio:licence");
    check(after && !after.error && after.works === true,
      "lsx2c with the service out of reach at Check now, the lead works on, on the certificate this computer verified: "
      + JSON.stringify([away && (away.error || away.works), after && (after.error || after.works)]));
  } finally { sh.done(); }
};

/* AN UNPARSABLE licence-service.json IS READ AS ABSENT (the test architect's D3, review of the licence file mends): a state file that does
   not parse, whether cut off, empty, binary or JSON of another shape, is the same to the gate and to the cover as no file at all: the
   Studio does not work and the door asks for a sign-in (the first state, never the stopped one), nothing throws, and signing in again
   brings the licence back. Every answer is compared with the one the same Studio gives with the file removed. */
LEGS.lsx3 = async () => {
  const { ud, svc, sh } = await world("lsx3");
  try {
    svc.licence({ org: "Mu Works", seats: 2 });
    const r = await signedIn(sh, svc);
    const stateAt = path.join(ud, "licence-service.json");
    const good = fs.readFileSync(stateAt, "utf8");
    const view = async () => {
      const a = await sh.ask("studio:licence"), c = await sh.ask("studio:licence-check");
      return JSON.stringify({ works: a && a.works, by: a && a.by, status: a && a.licence && a.licence.status, askError: !!(a && a.error),
        checkError: !!(c && c.error), checkWorks: c && c.works });
    };
    fs.rmSync(stateAt, { force: true });
    const absent = await view();
    const forms = { cut: good.slice(0, Math.floor(good.length / 2)), empty: "", nul: "\u0000\u0000\u0000", other: "[1, 2]", text: "\"signed in\"", nothing: "null" };
    const differs = [];
    for (const name of Object.keys(forms)) {
      fs.writeFileSync(stateAt, forms[name]);
      const got = await view();
      if (got !== absent) differs.push(name + ": " + got);
    }
    check(!!r && !r.error && JSON.parse(absent).works === false && JSON.parse(absent).by === null && differs.length === 0,
      "lsx3 a licence-service.json that does not parse is read as absent, by the gate and by the cover, as it is when the file is gone: "
      + JSON.stringify({ absent, differs }));
    /* Parsed, but not a state: whatever is in it, nothing throws and the Studio does not work on it. */
    const shaped = [{ by: "signin", seatCerts: "x" }, { by: "signin", seatCerts: { studio: "x" } }, { by: "signin", seatCerts: { studio: {} } },
      { by: "signin", seatCerts: { studio: { kind: "etiuda-seat-certificate", desk: 5, until: "never" } } }, { by: "signin", licenceShown: "x" },
      { by: "signin", licenceShown: { org: {}, seats: "many" } }, { by: "signin", signinNaming: "x" }, { by: "signin", seen: "x", seenSealed: 5 },
      { by: "signin", refreshSealed: 7, provider: [] }];
    const threw = [];
    for (const state of shaped) {
      fs.writeFileSync(stateAt, JSON.stringify(state));
      const got = JSON.parse(await view());
      if (got.askError || got.checkError || got.works !== false) threw.push(JSON.stringify(state) + " -> " + JSON.stringify(got));
    }
    check(threw.length === 0, "lsx3c a licence-service.json that parses and is not a state is no licence either, and nothing throws: " + JSON.stringify(threw));
    fs.writeFileSync(stateAt, forms.cut);
    const again = await signedIn(sh, svc);
    check(again && !again.error && again.works === true && again.by === "signin",
      "lsx3b signed in again over an unparsable file, the Studio works: " + JSON.stringify(again && (again.error || [again.works, again.by])));
  } finally { sh.done(); }
};

/* ---- the plants: one guarding line changed in a copy of the tree, one leg run there --------------------------------- */

const PLANTS = [
  /* client-licence-write (ls1) and client-aside-kept (ls21) no longer guard a write or a rename: since the licence file goes as an everyday
     entitlement (Max, 2026-11-22 15:37) take writes and moves nothing. The marks stay on the lines that say what take judged; lsx2 holds
     that nothing is written or set aside. */
  { leg: "ls1", file: "src/licence-client.mjs", mark: "client-grant-write", line: "    ;" },
  { leg: "ls11", file: "src/licence-client.mjs", mark: "client-licence", line: "    const v = { valid: true, reason: null };" },
  { leg: "ls11", file: "src/licence-client.mjs", mark: "client-grant", line: "    const signed = null;" },
  { leg: "ls11", file: "src/licence-client.mjs", mark: "client-grant-revoked", line: "      : null;" },
  { leg: "ls11", file: "src/licence-client.mjs", mark: "client-by-hand", line: "    const byHand = false;" },
  { leg: "ls11", file: "src/licence-client.mjs", mark: "client-trial-over-full", line: "    const overFull = false;" },
  /* trial-paused and eval-paused are no longer proved here: the sentence they guard is reached only through a Studio that works and is paused,
     and none is (a trial ended or no licence is a Studio that does not work, refused as a stop before notPaused is asked). The marks stay in
     shell/main.js, which the plant guard keeps; plant-hold refuses their removal. */
  { leg: "ls11", file: "src/licence-client.mjs", mark: "client-cap", line: "  ;" },
  { leg: "ls8", file: "src/licence-client.mjs", mark: "client-check-body", line: "  return call(ask, \"check\", { lead, t, sig: signHex(open, Q.checkBytes({ lead, t })), proofs: [] });" },
  /* g3-handler is no longer proved here (the test architect, 2026-11-22): ls2 reaches the grant check only signed in, under a
     grant that holds, and a Studio nobody signed in to is refused as a stop before it. relay-studio rs926e and rs935d plant the
     same mark and prove it. */
  { leg: "ls9", file: "src/licence-client.mjs", mark: "client-never", line: "  if (!lead) return \"none\"; if (!s.by) return \"check\";" },
  { leg: "ls5", file: "src/licence-client.mjs", mark: "client-revoked", line: "    writeJson(rf, a.revoked);" },
  { leg: "ls5", file: "src/licence-client.mjs", mark: "client-due", line: "  return \"none\";" },
  { leg: "ls5", file: "src/licence-client.mjs", mark: "client-list-lost", line: "  lost = false;" },
  { leg: "ls6", file: "shell/main.js", mark: "s6-signature", line: "" },
  { leg: "ls6", file: "shell/main.js", mark: "s6-replayed", line: "" },
  { leg: "ls6", file: "shell/main.js", mark: "s6-malformed", line: "" },
  { leg: "ls7", file: "src/licence-client.mjs", mark: "client-rekey", line: "  if (s.lead !== lead) return \"check\";" },
  { leg: "ls10", file: "shell/main.js", mark: "s6-schedule", line: "  const tick = null;" },
  { leg: "ls5", file: "shell/main.js", mark: "s6-check", line: "  let a = { ok: false, reason: \"unreached\" };" },
  { leg: "ls14", file: "shell/main.js", mark: "k10-unspent", line: "      throw R.refuse(\"This Studio keeps another signing key, so the copy was not restored.\");" },
  { leg: "ls14", file: "shell/main.js", mark: "k10-mark", line: "" },
  { leg: "ls20", file: "src/licence-client.mjs", mark: "s4-before-moved", line: "  if (true) return { answer: a, state: next };" },
  { leg: "ls20", file: "src/licence-client.mjs", mark: "s4-before-sealed", line: "" },
  { leg: "ls20", file: "shell/main.js", mark: "s4-moved-said", line: "    signinMoved: false," },
  { leg: "ls14", file: "shell/main.js", mark: "k10-spend", line: "" },
  { leg: "ls14", file: "shell/main.js", mark: "k10-relay", line: "  return true;" },
  { leg: "ls14", file: "shell/main.js", mark: "k10-made", line: "" },
  /* f9-watch-unlock is no longer proved here (the test architect, 2026-11-22): the watch runs only where Studio works, and a
     Studio that works is not paused, so the pause cannot flip under it and the lazy unlock is never reached (ls17's own note).
     The mark stays in shell/main.js; whether the line is still wanted is the lead engineer's. */
  { leg: "ls18", file: "shell/main.js", mark: "f8-absorb-memo", line: "" },
  { leg: "ls19", file: "shell/main.js", mark: "f8-absorb-opened", line: "    absorbMemo.set(path.resolve(folder), { rev, lead });" },
  /* The paid end (piece S-0, ls21). */
  { leg: "ls1", file: "src/licence-client.mjs", mark: "keep-shown", line: "  ;" },
  { leg: "ls15", file: "shell/main.js", mark: "shown-trial-ended", line: "" },
  /* The gate on this Studio's own seat certificate (review xi; Max, 2026-11-22 15:37). */
  { leg: "lsx1", file: "service/licence/core.mjs", mark: "studio-signin", line: "      const studio = undefined;" },
  { leg: "lsx1", file: "src/licence-client.mjs", mark: "studio-keep", line: "  const studio = null;" },
  { leg: "lsx3", file: "shell/main.js", mark: "state-read", line: "  catch { throw new Error(\"the state does not parse\"); }" },
  { leg: "lsx3", file: "shell/main.js", mark: "state-seat", line: "  catch (e) { held = !!e && [\"EPERM\", \"EACCES\", \"EBUSY\"].indexOf(e.code) >= 0; if (!held) throw e; st = null; }" },
  { leg: "lsx1", file: "shell/main.js", mark: "works-seat", line: "  return !!lic && lic.root === true && [\"trial\", \"active\", \"held\"].indexOf(lic.status) >= 0;" },
  { leg: "lsx1", file: "shell/main.js", mark: "seat-held", line: "  const cert = held ? null" },
  { leg: "lsx1", file: "shell/main.js", mark: "seat-check", line: "  if (false) return false;" },
  { leg: "ls15", file: "src/licence-client.mjs", mark: "studio-over", line: "  if (false) {" },
];
function plantsTree() {
  const copy = path.join(ROOT, "scratch", "licence-studio-plants");
  clearScratch(copy);
  for (const dir of ["src", "shell", "ui", "tests"]) fs.cpSync(path.join(ROOT, dir), path.join(copy, dir), { recursive: true });
  fs.cpSync(path.join(ROOT, "service", "licence"), path.join(copy, "service", "licence"), { recursive: true });
  fs.cpSync(path.join(ROOT, "engine", "pinned"), path.join(copy, "engine", "pinned"), { recursive: true });
  fs.copyFileSync(path.join(ROOT, "package.json"), path.join(copy, "package.json"));
  return copy;
}
function planted(tree, p) {
  const at = path.join(tree, p.file), was = fs.readFileSync(at);
  const lines = was.toString("utf8").split("\n");
  const hits = lines.map((l, i) => (l.indexOf("/* plant:" + p.mark + " */") >= 0 ? i : -1)).filter((i) => i >= 0);
  if (hits.length !== 1) return { ran: false, why: "the mark " + p.mark + " is on " + hits.length + " lines of " + p.file };
  lines[hits[0]] = p.line;
  fs.writeFileSync(at, lines.join("\n"));
  let r = null;
  try {
    r = spawnSync(process.execPath, [path.join(tree, "tests", "licence-studio.mjs")], { cwd: tree, encoding: "utf8", timeout: 240000,
      env: Object.assign({}, process.env, { LICENCE_STUDIO_ONLY: p.leg }) });
  } finally { fs.writeFileSync(at, was); }
  const fails = ((r && r.stdout) || "").split("\n").filter((l) => /^ {2}FAIL /.test(l));
  return { ran: true, red: !!r && r.status !== 0 && fails.length > 0, out: fails.map((l) => l.trim().split(" ")[1]).join(","), fails };
}
const FILES = ["src/licence-client.mjs", "shell/main.js", "src/licence.mjs", "src/wire.cjs", "service/licence/core.mjs"];

async function main(argv) {
  clearScratch(SCRATCH);
  const before = Object.fromEntries(FILES.map((f) => [f, sha(fs.readFileSync(path.join(ROOT, f)))]));
  for (const name of Object.keys(LEGS)) {
    if (ONLY && name !== ONLY) continue;
    try { await LEGS[name](); } catch (e) { check(false, name + " threw: " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join(" / ") : e)); }
  }
  if (!ONLY && PLANTS_OFF) {
    for (const p of PLANTS) skip("ls12 plant " + p.mark + " in " + p.file + " turns " + p.leg + " red (ETIUDA_PLANTS=off)");
    skip("ls12z the real files are byte for byte as before the plants (ETIUDA_PLANTS=off)");
  } else if (!ONLY) {
    const tree = plantsTree();
    /* LICENCE_STUDIO_PLANT=<mark> runs that plant alone and prints its leg's FAIL lines whole, to be read. */
    const one = process.env.LICENCE_STUDIO_PLANT || "";
    for (const p of PLANTS.filter((x) => !one || x.mark === one)) {
      const r = planted(tree, p);
      if (one) (r.fails || []).forEach((l) => process.stdout.write("  (planted " + p.mark + ")" + l + NL));
      check(r.ran && r.red, "ls12 plant " + p.mark + " in " + p.file + " turns " + p.leg + " red: " + (r.ran ? r.out || "green" : r.why));
    }
    if (!argv.includes("--keep")) dropScratch(tree, "licence-studio plants");
    const after = Object.fromEntries(FILES.map((f) => [f, sha(fs.readFileSync(path.join(ROOT, f)))]));
    check(FILES.every((f) => before[f] === after[f]), "ls12z the real files are byte for byte as before the plants");
  }
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "licence-studio");
  process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + " plants=" + PLANTS.length + NL);
  if (!ONLY && !process.env.LICENCE_STUDIO_PLANT && asserted + skipped !== EXPECTED) {
    process.stdout.write("SUITE DID NOT COMPLETE: " + (asserted + skipped) + " of " + EXPECTED + " checks ran" + NL);
    return 78;
  }
  process.stdout.write("licence-studio  " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)" + NL);
  return Math.min(failed, 77);
}

main(process.argv.slice(2)).then((c) => process.exit(c), (e) => { process.stderr.write(String(e && e.stack || e) + NL); process.exit(2); });
