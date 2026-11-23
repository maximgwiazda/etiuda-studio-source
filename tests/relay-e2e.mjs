/* A LEAD AND A DESK MEET THROUGH THE RELAY (board 900, relay slice 1, step 6).
 *
 *     node tests/relay-e2e.mjs        exit code is the number of failed checks, capped at 63; 78 where it did not complete
 *
 * Studio as it runs, its own verbs over its own files: a project published into a team on the relay (src/studio.mjs
 * publishProject into the mirror src/team-store.mjs keeps), its invitations made by src/invite.mjs and src/relay.mjs, its
 * admissions by the watch's own watchAdmit, a removal by removeMember, and the relay kept in step by src/relay.mjs's runner.
 * The desk is the pinned engine's own shell/main.js, loaded in bare node as the engine's tests/relay-channel.mjs loads it,
 * joining by the invitation Studio made. The relay is the pinned engine's, in memory (tests/relay-lab.mjs).
 *
 *   re1  Studio's team file and edition reach the desk's mirror through the relay; the desk takes Studio's invitation, its
 *        join.json reaches Studio's mirror, Studio reads it and lets it in, and the desk loads the edition
 *   re9  after that publish, the pinned desk receives Studio's head and shows the edition Studio published, and its time
 *   re2  the desk's own files (the request's removal, in-use where the desk writes one) reach Studio, and the invitation
 *        is let go once the desk has read its wrap
 *   re3  a forged, a replayed and a misplaced blob from a colleague's place are each dropped and said by Studio, and its
 *        mirror is as it was
 *   re4  an epoch move: Studio takes the colleague off with a new key while the desk is offline; the desk, back, reaches
 *        the new team file and key with no step through Studio's real agreement (the box whose public half is lead.box),
 *        and loads the edition published under the new key; the colleague is refused
 *   re5  PLANT: the agreement wired from another box (src/relay.mjs, plant rs-agree) leaves the desk stranded at the old
 *        key, so re4 goes red; the file comes back by sha256
 *   re7  N2 of the slice 1 review: the invitation Studio makes from its own inviteTarget carries the lead's box, the same
 *        value the team file names as lead.box; a desk that asks by it before any copy is up, so holding no team file, is
 *        admitted while offline, its invitation let go past its end, and back 45 days on joins by itself through that box
 *   re8  PLANTS: the box left out of the invitation (src/invite.mjs, plant rs-invite-box) and left out of the target
 *        (src/studio.mjs, plant rs-target-box) each turn re7 red; each file comes back by sha256
 *
 * BOARD 922, THE LEAD'S ANSWER (a second scenario, answers(), on a relay and a lead of its own):
 *   re10 C8 (b) of the test architect: a desk has asked by an invitation, 31 minutes pass on the lab's clock, the lead refuses
 *        and writes "refused" through its channel, and the desk shows refused; the invitation is withdrawn in the book and its
 *        drop waits, the relay still holding it bound so the desk can read the answer
 *   re11 the lead admits a desk the watch lets in and writes "joined"; the desk's answer reads joined before it is enrolled,
 *        the invitation is not dropped, and once the roster is enrolled the desk reads the team
 *   re12 a week after the refusal (the weekly hold the invitation's own life gives) the drop is sent, and the relay keeps
 *        of the invitation only that it was spent
 *   re13 a refusal of a request that names a live invitation with a proof that is not its secret's writes no answer and
 *        ends nothing
 *   re14 to re19 PLANTS: the channel's writeAnswer lifted (re10), the joined answer lifted (re11), the mark for the drop
 *        lifted (re12), the hold lifted so the drop goes at once (re10), the proof check lifted (re13), the sync's check of the
 *        hold lifted (re10); each file comes back by sha256
 *
 * BOARD 922, THE TEST ARCHITECT'S E1 AND CLAUDE ALPHA'S Q1 (the same second scenario):
 *   re20 E1: the lead refuses with the relay not answering; the invitation is withdrawn in the book at once, the answer is kept owed
 *        on its row and the lead told; the next sync that reaches the relay writes it, the desk shows refused, and the hold on the
 *        drop counts from the write
 *   re21 E1: the same with no runner at all; the first sync that has one writes the answer before the drop can go
 *   re22 Q1: the refusal of a desk that opened the wrap says the team is to move to a new key and marks its invitation for the one
 *        confirm; the refusal of a desk whose invitation the relay reports unused moves nothing
 *   re23 E1: an owed answer whose invitation ended before the relay was reached is let go, and the invitation is dropped
 *   re24 to re31 PLANTS: the owed mark lifted (re20), the sync's write of owed answers lifted (re20), the drop's wait for an owed
 *        answer lifted (re21), the end of an owed answer lifted (re23), a refusal with no runner let go as before (re21), the used
 *        reading made false (re22) and true (re22), the mark for the confirm lifted (re22); each file comes back by sha256
 *
 * RELAY FINDING 1, STUDIO'S LEAD HALF (a third scenario, devices(); the test architect's condition of 2026-11-01 01:43): two lead
 * channels on one key, A and B, B behind on the team file with a list it has not enrolled:
 *   re32 B catches up before it posts /devices: its one list is read from A's newest file, carries that file's epoch and rev
 *        signed, is taken, and the relay's roster stays whole
 *   re33 with B's catch-up withheld (the since list answered 503), its list from the older file is refused replay-rev and the
 *        roster stays whole; B catches up and posts once more, from the newest file, and that list is taken
 *   re34 with the catch-up withheld through the retry, both lists are refused replay-rev, the roster stays whole, and B says it as
 *        the relay's out-of-step refusals are said on the Desks screen; the next sync, its catch-up served, posts and is taken
 *   re35 to re38 PLANTS: the catch-up lifted (re32), the list's file left out (re34), the retry lifted (re33), the out-of-step
 *        line lifted (re34); each file comes back by sha256
 *
 * Throwaway keys and invented words only; machine policy is a stand-in that answers every registry question as unset; no
 * window, no host. The lab folder under scratch/ is left in place.
 *
 * Plants are written in a scratch copy (tests/plants-tree.mjs). This checkout's tracked files are only read.
 * RELAY_E2E_HOLD=1 is the kill switch: it writes the first plant into that copy, says WINDOW, and waits. */
process.removeAllListeners("warning");
process.on("warning", () => {});

import { regStand } from "./reg-stand-on.mjs";
import { licensedOpts } from "./licensed.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import * as Engine from "../src/engine.mjs";
import * as K from "../src/team-store.mjs";
import * as Studio from "../src/studio.mjs";
import { makeInvite, newSecret } from "../src/invite.mjs";
import { makeKeyFile } from "../src/sign.mjs";
import { heldTeam, newTeam, withChannel, withDesk, writeTeam } from "../src/team.mjs";
import { relayWorld, makeVault, keyPair, boxPair, agreeWith, deskProgram, settle, until, labDir, put, read, hex, sha, wait, placeGrant, GRANT_ROOTS, GRANT_ROOT_PUB, deskCert } from "./relay-lab.mjs";
import { olderFolderTeam } from "./older-folder-team.mjs"; /* a team at the relay mirror is made by the fixture, not by Studio's Sealed switch, which writes no team at a folder (the folder team's removal) */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SELF = fileURLToPath(import.meta.url);
const nodeRequire = createRequire(import.meta.url);
/* The module this step adds, asked for on its own, so a tree without it says so in a leg rather than not at all. */
const Relay = await import("../src/relay.mjs").catch((e) => ({ missing: String(e && e.message || e) }));
const PASS = "lantern-quay-passphrase";
/* RELAY_E2E_ONLY: "" runs every plant and then the three scenarios; "1" is the first scenario alone, as its plants' children run
   it; "answers" is the second (board 922) alone, and "devices" the third (relay finding 1), each as its plants' children run it. */
const MODE = process.env.RELAY_E2E_ONLY || "";
/* 32 is the suite as it stood, plus the checkout sha256 after the plants phase; relay finding 1 adds re32 to re34 and the plants
   re35 to re38. */
const EXPECTED = 40, EXPECTED_MAIN = 7, EXPECTED_ANSWERS = 8, EXPECTED_DEVICES = 3;

/* Each plant is one source line taken out; the leg it names must go red in a child run against the planted tree. */
const PLANTS = [
  { name: "re5", leg: "re4", file: "src/relay.mjs", mark: "rs-agree", says: "Studio's agreement wired from another box than lead.box leaves the desk stranded",
    line: "      agree: (peer) => agreeFrom({ secretKey: crypto.generateKeyPairSync(\"x25519\").privateKey })(peer)," },
  { name: "re8a", leg: "re7", file: "src/invite.mjs", mark: "rs-invite-box", says: "the invitation written without the lead's box",
    line: "  if (false) doc.lead.box = \"\";" },
  { name: "re8b", leg: "re7", file: "src/studio.mjs", mark: "rs-target-box", says: "the target named without the lead's box",
    line: "  return { team: h.team.id, folder: h.folder, lead: { keyId: h.team.lead.keyId, public: h.team.lead.public } };" },
  /* Board 922, the lead's answer. Each runs the second scenario alone in its child. */
  { name: "re14", leg: "re10", only: "answers", file: "src/relay.mjs", mark: "s922-write", says: "the channel's writeAnswer never called, so no answer is written",
    line: "        return { ok: true };" },
  { name: "re15", leg: "re11", only: "answers", file: "src/relay.mjs", mark: "s922-joined", says: "no joined answer written for a desk the watch admitted",
    line: "    const r = { ok: true, none: true };" },
  { name: "re16", leg: "re10", only: "answers", file: "src/relay.mjs", mark: "s922-drop", says: "a refused invitation never marked to be dropped by its answer",
    line: "    ;" },
  { name: "re17", leg: "re10", only: "answers", file: "src/relay.mjs", mark: "s922-hold", says: "the drop sent at once and not after the week",
    line: "    const after = now;" },
  { name: "re18", leg: "re13", only: "answers", file: "src/relay.mjs", mark: "s922-valid", says: "a refusal answered whatever the request's proof",
    line: "    if (false) return none;" },
  { name: "re19", leg: "re10", only: "answers", file: "src/relay.mjs", mark: "s922-held", says: "the sync's drop sent whatever the hold on it",
    line: "    const drop = all.filter((i) => i.gone && i.registered && !i.dropped).map((i) => i.inv);" },
  /* Board 922, E1 and Q1. */
  { name: "re24", leg: "re20", only: "answers", file: "src/relay.mjs", mark: "s922-owed", says: "a refusal's answer never kept owed, nor the invitation marked gone",
    line: "  ;" },
  { name: "re25", leg: "re20", only: "answers", file: "src/relay.mjs", mark: "s922-owed-sync", says: "the sync never writing an owed answer",
    line: "      if (false)" },
  { name: "re26", leg: "re21", only: "answers", file: "src/relay.mjs", mark: "s922-owed-held", says: "the drop sent whatever answer is still owed",
    line: "    const all = Store.relayInvitesOf(d.teamsFile, d.vault, t.team, call.t);" },
  { name: "re27", leg: "re23", only: "answers", file: "src/relay.mjs", mark: "s922-owed-end", says: "an owed answer kept past its invitation's end",
    line: "      if (false) continue;" },
  { name: "re28", leg: "re21", only: "answers", file: "src/relay.mjs", mark: "s922-runner", says: "a refusal with no runner let go without a trace, as before",
    line: "  if (!answer || !runner || typeof runner.answer !== \"function\") return none;" },
  { name: "re29", leg: "re22", only: "answers", file: "src/relay.mjs", mark: "s922-used", says: "every refused desk taken as not having used its invitation",
    line: "  const used = false;" },
  { name: "re30", leg: "re22", only: "answers", file: "src/relay.mjs", mark: "s922-used", says: "every refused desk taken as having used its invitation",
    line: "  const used = true;" },
  { name: "re31", leg: "re22", only: "answers", file: "src/relay.mjs", mark: "s922-move", says: "the invitation of a desk that used it never marked for the confirm",
    line: "  ;" },
  /* Relay finding 1, Studio's lead half. Each runs the third scenario alone in its child. */
  { name: "re35", leg: "re32", only: "devices", file: "src/relay.mjs", mark: "df-catch", says: "no catch-up before the list is posted",
    line: "      ;" },
  { name: "re36", leg: "re34", only: "devices", file: "src/relay.mjs", mark: "df-from", says: "the list posted without the team file it was read from",
    line: "  const f = undefined;" },
  { name: "re37", leg: "re33", only: "devices", file: "src/relay.mjs", mark: "df-retry", says: "a list refused replay-rev neither caught up nor posted again",
    line: "      if (false) {" },
  { name: "re38", leg: "re34", only: "devices", file: "src/relay.mjs", mark: "df-said", says: "a list refused twice not said where the relay's out-of-step refusals are",
    line: "        ;" },
];

/* THE RELAY MAKES A TEAM ONLY UNDER A GRANT (board 935, slice G3): the lead of each leg holds one, placed beside its key file by the lab's root. */
const granted = (keyAt, pub) => placeGrant(keyAt, pub);

let asserted = 0, failed = 0;
function check(ok, line) {
  asserted++;
  if (ok) console.log("  ok   " + line);
  else { failed++; console.log("  FAIL " + line); }
}

/* Machine policy and the proxy as unset: every reg call is answered by the shared stand-in (tests/reg-stand-on.mjs, imported first)
   as reg.exe answers a key that is not there, and counted; nothing reaches the machine's registry. This leg had a stand-in of its
   own until 2026-11-17: its wrappers did not carry the mark the pinned desk's guard asks for, so at a pin with the engine's managed
   floor the desk's policy read was refused, the desk waited, and it took no invitation. */

/* The desk: the pinned shell/main.js in bare node from a copy of the pinned shell/, its relay reached through the lab. Since the relay's
   seat wall (engine fold 119) a desk holds a seat certificate, so each desk signs in first, as the engine's own tests/relay-channel.mjs
   seats its desks: the pinned sign-in lab (ETIUDA_SIGNIN_LAB, read at the shell's start) names the lab's root, its provider and service
   answer here, and the service's certificate is the lab's (tests/relay-lab.mjs deskCert) at the relay's clock. Loading is async. */
function deskLoader(world, lab) {
  const APP = path.join(lab, "app");
  const signinLab = path.join(lab, "signin-lab.json");
  fs.writeFileSync(signinLab, JSON.stringify({ service: "http://127.0.0.1:1/", root: GRANT_ROOT_PUB,
    provider: { id: "lab", clientId: "lab-client", scope: "openid", authorize: "http://127.0.0.1:1/auth", token: "http://127.0.0.1:1/token", issuer: "http://127.0.0.1:1" } }), "utf8");
  const nonces = new Map(), backs = [];
  /* The desk shell's own clock, which a leg may move on as it moves the relay's and Studio's (re7: a computer whose clock has moved).
     The shell reads Date through the stand-in below, the real clock plus `skew`; nothing else about the shell is touched. */
  const deskClock = { skew: 0 };
  class DeskDate extends Date {
    constructor(...a) { if (a.length) super(...a); else super(Date.now() + deskClock.skew); }
    static now() { return Date.now() + deskClock.skew; }
  }
  const labShell = { openExternal(url) {
    const u = new URL(String(url));
    if (u.origin + u.pathname !== "http://127.0.0.1:1/auth") return Promise.reject(new Error("unexpected external url"));
    const code = "lab-code-" + hex(8);
    nonces.set(code, u.searchParams.get("nonce"));
    backs.push(fetch(u.searchParams.get("redirect_uri") + "/?state=" + encodeURIComponent(u.searchParams.get("state")) + "&code=" + encodeURIComponent(code),
      { redirect: "follow" }).then((r) => r.arrayBuffer()).catch(() => {}));
    return Promise.resolve();
  } };
  const answerJson = (o) => Promise.resolve(new Response(JSON.stringify(o), { status: 200, headers: { "content-type": "application/json" } }));
  function labFetch(url, init) {
    const u = String(url);
    if (!u.startsWith("http://127.0.0.1:1/")) return null;
    if (u.endsWith("/token")) {
      const code = new URLSearchParams(Buffer.from(init && init.body ? init.body : "").toString("utf8")).get("code") || "";
      const nonce = nonces.get(code), now = Math.floor((Date.now() + deskClock.skew) / 1000); /* the provider answers by the desk's clock, so a token is not past its end */
      nonces.delete(code);
      const claims = Object.assign({ iss: "http://127.0.0.1:1", aud: "lab-client", sub: "sub-1", iat: now, exp: now + 3600 }, nonce ? { nonce } : {});
      return answerJson({ token_type: "Bearer", expires_in: 3600, refresh_token: "rt-1", id_token: Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url") + "."
        + Buffer.from(JSON.stringify(claims)).toString("base64url") + ".sig" });
    }
    if (u.endsWith("/signin/desk")) {
      const ask = JSON.parse(Buffer.from(init.body).toString("utf8"));
      return answerJson({ ok: true, code: "ABCDEFGHJKMNPQRS", certificate: deskCert(ask.desk, Math.max(1, world.R.clock.now)) });
    }
    return null;
  }
  const directSession = { defaultSession: new Proxy({ resolveProxy: () => Promise.resolve("DIRECT") }, { get: (o, k) => (k in o ? o[k] : inert) }) };
  fs.cpSync(path.join(ROOT, "engine", "pinned", "shell"), path.join(APP, "shell"), { recursive: true });
  const SRC = fs.readFileSync(path.join(APP, "shell", "main.js"), "utf8");
  const EXPOSE = ["readCatalog", "catalogFolder", "relayRun", "heedTeam"];
  const noop = () => {};
  const inert = new Proxy(function () {}, { get: () => inert, set: () => true, apply: () => undefined });
  const FRAME = { parent: null, url: "file:///C:/lab/engine/etiuda.html" };
  const eventFor = () => ({ sender: { id: 1, once: noop }, senderFrame: FRAME, returnValue: undefined });
  const t = world.transport("desk");
  globalThis.WebSocket = class {
    constructor(url, opts) {
      this.readyState = 1;
      this.h = t.connect(url, (opts && opts.headers) || {}, {
        message: (m) => { if (this.onmessage) this.onmessage({ data: m }); },
        close: () => { this.readyState = 3; if (this.onclose) this.onclose(); },
      });
      if (!this.h) setImmediate(() => { this.readyState = 3; if (this.onclose) this.onclose(); });
    }
    send() {}
    close() { if (this.h) this.h.close(); }
  };
  const load = async function (name) {
    const ud = path.join(lab, name);
    fs.mkdirSync(ud, { recursive: true });
    if (!fs.existsSync(path.join(ud, "desk.json")))
      fs.writeFileSync(path.join(ud, "desk.json"), JSON.stringify({ kind: "etiuda-desk", schema: 1, keys: { eCatalogFolder: path.join(lab, name + "-share"), eUiLang: "en" } }), "utf8");
    fs.mkdirSync(path.join(lab, name + "-share"), { recursive: true });
    const said = [], on = {}, invoke = {};
    const quiet = { log: (s) => said.push(String(s)), error: (s) => said.push("ERR " + String(s)), warn: noop, info: noop };
    const safeStorage = {
      isEncryptionAvailable: () => true,
      encryptString: (s) => Buffer.from(Buffer.from(String(s), "utf8").map((b) => b ^ 0x5a)),
      decryptString: (b) => Buffer.from(Buffer.from(b).map((x) => x ^ 0x5a)).toString("utf8"),
    };
    const net = { fetch: (url, init) => { const signin = labFetch(url, init); if (signin) return signin;
      t.log.push(init.method + " " + url); if (t.down) return Promise.reject(new Error("down")); return world.relayFetch(url, init); } };
    const electron = {
      app: { getPath: () => ud, setPath: noop, requestSingleInstanceLock: () => false, quit: noop, on: noop,
        getVersion: () => "0.0.0", whenReady: () => new Promise(noop), commandLine: { appendSwitch: noop } },
      ipcMain: { on: (ch, fn) => { on[ch] = fn; }, handle: (ch, fn) => { invoke[ch] = fn; } },
      BrowserWindow: inert, Menu: inert, dialog: inert, net, protocol: inert, session: directSession, shell: labShell,
      screen: inert, systemPreferences: inert, nativeTheme: { themeSource: "system" }, safeStorage, powerMonitor: inert,
    };
    const wasLab = process.env.ETIUDA_SIGNIN_LAB;
    process.env.ETIUDA_SIGNIN_LAB = signinLab;
    let api = null;
    try {
      api = new Function("require", "__dirname", "__filename", "module", "exports", "console", "Date",
        SRC + "\nreturn { " + EXPOSE.join(", ") + " };")(
        (n) => (n === "electron" ? electron : nodeRequire(n)),
        path.join(APP, "shell"), path.join(APP, "shell", "main.js"), { exports: {} }, {}, quiet, DeskDate);
    } finally { if (wasLab === undefined) delete process.env.ETIUDA_SIGNIN_LAB; else process.env.ETIUDA_SIGNIN_LAB = wasLab; }
    const ask = (ch, ...args) => Promise.resolve(invoke[ch](eventFor(), ...args));
    const sync = (ch, ...args) => { const ev = eventFor(); if (on[ch]) on[ch](ev, ...args); return ev.returnValue; };
    const envelope = () => JSON.parse(fs.readFileSync(path.join(ud, "desk.json"), "utf8"));
    const kick = async () => { const ch = api.relayRun(); if (ch) { ch.kick(); await ch.idle(); } return ch; };
    /* The sign-in, as a person makes it: the desk's seat is held once the service's answer is taken. */
    sync("etiuda:signin-click", "lab");
    const view = await ask("etiuda:signin", "lab");
    while (backs.length) await Promise.allSettled(backs.splice(0));
    if (!view || view.signedIn !== "lab" || (view.seat !== "held" && view.seat !== "lapsed")) throw new Error("the lab sign-in did not seat desk " + name + ": " + JSON.stringify(view));
    return { api, ask, sync, said, ud, envelope, kick, t };
  };
  load.clock = deskClock;
  return load;
}
const revOf = (text) => { try { return JSON.parse(text).rev; } catch { return null; } };

async function main() {
  const world = await relayWorld(), lab = labDir("relay-e2e");
  /* ---- Studio: a key, a project, a sealed team on the relay, an edition published into its mirror ---- */
  const ud = path.join(lab, "studio-ud");
  fs.mkdirSync(ud, { recursive: true });
  const keyAt = path.join(ud, "studio-key.json");
  const lead = await makeKeyFile({ passphrase: PASS });
  fs.writeFileSync(keyAt, JSON.stringify(lead, null, 1) + "\n");
  granted(keyAt, lead.public);
  const teamsFile = K.teamsFile(ud), vault = makeVault();
  const teamId = "t-" + hex(8), rt = Relay.relayId(), key1 = crypto.randomBytes(32);
  K.keepTeamKey(teamsFile, vault, teamId, 1, key1);
  const mirror = K.keepRelay(teamsFile, teamId, rt, Relay.RELAY_URL);
  fs.mkdirSync(mirror, { recursive: true });
  const made0 = await Studio.newProject(path.join(lab, "projects"), "Lantern Quay", [{ code: "en", name: "English" }]);
  const proj = made0.dir;
  const shelf = (await Studio.addTag(proj, "shelf", { en: "Openers" })).tag.id;
  await Studio.addCard(proj, shelf, "Warm opening", "Good day, and welcome to Lantern Quay.");
  Studio.setPublishFolder(proj, mirror);
  await olderFolderTeam(proj, { relay: true, key: keyAt, passphrase: PASS, teamId, teamKeys: K.teamKeysOf(teamsFile, vault) });
  const sealedHere = (await heldTeam(mirror, { key: keyAt })).team;
  await writeTeam(mirror, withChannel(sealedHere, { kind: "relay", rt, url: Relay.RELAY_URL }, { format: 1, kind: "etiuda-ring", keys: [] }),
    { key: keyAt, passphrase: PASS });
  const pub1 = await Studio.publishProject(proj, { folder: mirror, notes: "Edition one.", now: "2026-10-18T07:00:00.000Z",
    leadKey: keyAt, teamKeys: K.teamKeysOf(teamsFile, vault), key: keyAt, passphrase: PASS, ...(await licensedOpts()) });
  const st = world.transport("studio"), studioSaid = [];
  /* Two knobs for re7, idle until then: Studio's uploads held (its POSTs to the relay still answered), and its clock moved on. */
  let holdPuts = false, skew = 0;
  const studioRequest = (method, url, headers, body) => (holdPuts && method === "PUT" ? Promise.reject(new Error("the lab holds Studio's uploads"))
    : st.request(method, url, headers, body));
  const runner = Relay.relayRunner({ roots: GRANT_ROOTS, teamsFile, vault, keyFile: keyAt, secret: () => PASS, request: studioRequest, connect: st.connect,
    watch: false, pollMs: 1e9, say: (l) => studioSaid.push(l), clock: () => Date.now() + skew });
  const sync = async () => { await runner.sync(); await runner.idle(); await runner.sync(); await runner.idle(); };
  await sync();
  const leadKeyId = lead.keyId, leadPub = lead.public;
  const target = { team: teamId, folder: mirror, lead: { keyId: leadKeyId, public: leadPub } };
  const invite = (name) => {
    const secret = newSecret(), ri = Relay.relayInvite(secret);
    const made = makeInvite(target, name, secret, Date.now(), undefined, { rt, url: Relay.RELAY_URL, token: ri.token, inv: ri.inv });
    K.keepInvite(teamsFile, vault, teamId, { id: made.id, secret, made: made.made, expires: made.expires, name: made.name, relay: ri });
    return { made, ri, secret };
  };
  const admit = async () => {
    const r = await Studio.watchAdmit(mirror, keyAt, PASS, { auto: false, teamKeys: K.teamKeysOf(teamsFile, vault),
      invites: K.inviteBookOf(teamsFile, vault), teamsFile });
    for (const x of r.spent || []) K.endInvite(teamsFile, teamId, x.invite, "spent", x.desk);
    return r;
  };

  /* ---- the desk takes Studio's invitation ---- */
  const forD = invite("Ada Quay");
  await sync();
  const load = deskLoader(world, lab);
  const D = await load("desk-nine");
  const offer = await D.ask("etiuda:team-join", "read", forD.made.blob);
  const taken = await D.ask("etiuda:team-join", "invite", forD.made.blob, "Desk Nine", forD.made.code);
  const me = await D.ask("etiuda:branch-identity", false);
  const joinRel = "desks/" + me.id + "/join.json";
  const asked = await until(async () => { await D.kick(); await sync(); return !!read(mirror, joinRel); }, 25000);
  const teamAtDesk = read(path.join(D.ud, "relay", rt), "etiuda-team.json");
  /* A colleague, the pinned layer as a desk runs it, joining by an invitation of its own. */
  const X = Object.assign(keyPair(true), { box: boxPair() }), xHeld = new Map();
  const forX = invite("Ada Quay");
  await sync();
  const pinX = { teamId, rt, lead: { keyId: leadKeyId, public: leadPub } };
  const xLab = path.join(lab, "colleague");
  fs.mkdirSync(xLab, { recursive: true });
  const colleague = (name, transport) => deskProgram(world, xLab, name, X, { transport, channel: { rt, url: Relay.RELAY_URL, pin: () => pinX,
    keyFor: (e) => xHeld.get(e) || null, sealEpoch: () => (xHeld.size ? Math.max(...xHeld.keys()) : null), agree: agreeWith(X.box),
    invite: () => ({ inv: forX.ri.inv, token: forX.ri.token, seal: forX.ri.seal }),
    onTeam: () => {
      let doc = null;
      try { doc = JSON.parse(read(path.join(xLab, name), "etiuda-team.json")); } catch { return; }
      const mine = (doc.roster || []).find((e) => e && e.desk && e.desk.id === X.keyId);
      const k = mine ? Engine.hpkeRules().unwrapTeamKey(X.box.priv, mine.wrap, teamId, doc.epoch, X.keyId) : null;
      if (k) xHeld.set(doc.epoch, k);
    } } });
  const x = colleague("x");
  const J = Engine.joinRules(), I = Engine.inviteRules(), nonce = hex(32), commit = J.joinCommit(teamId, X.pub, X.box.pub, nonce);
  const req = { format: 1, kind: J.JOIN_KIND, team: teamId, desk: { id: X.keyId, key: X.pub, box: X.box.pub, name: "Desk Ten" },
    date: new Date().toISOString(), commit, invite: { id: I.inviteIdOf(forX.secret), proof: I.memberProof(forX.secret, commit) } };
  req.sig = { alg: "Ed25519", keyId: X.keyId };
  req.sig.value = crypto.sign(null, J.joinSignedBytes(req), X.privateKey).toString("hex");
  put(x.mirror, "desks/" + X.keyId + "/join.json", JSON.stringify(req, null, 1) + "\n");
  x.ch.start(); await settle(x.ch);
  await sync();
  const r1 = await admit();
  await sync();
  const loaded = await until(async () => { await D.kick(); return revOf(D.sync("etiuda:catalog") || "") === pub1.rev; }, 10000);
  await settle(x.ch);
  check(!!offer && !!offer.offer && offer.offer.relay === "etiuda.dev" && taken && !taken.refused && asked && !!teamAtDesk
    && (r1.admitted || []).indexOf(me.id) >= 0 && (r1.admitted || []).indexOf(X.keyId) >= 0 && loaded && xHeld.has(1),
    "re1 the desk takes Studio's relay invitation (offer from " + (offer && offer.offer && offer.offer.relay) + "), reads the team file Studio"
    + " wrote " + !!teamAtDesk + ", its join.json reaches Studio's mirror " + asked + " and Studio's watch lets it in "
    + ((r1.admitted || []).indexOf(me.id) >= 0) + ", and the desk loads the edition Studio published into its mirror: "
    + (loaded ? "rev " + pub1.rev + " loaded" : "not loaded (" + D.said.filter((l) => /relay/.test(l)).slice(-2).join(" / ") + ")"));

  /* The head written at that publish, as the pinned desk's own shell shows it. */
  {
    const catalogId = JSON.parse(fs.readFileSync(path.join(proj, "project.json"), "utf8")).id;
    const mirrorD = path.join(D.ud, "relay", rt);
    let head = null;
    try { head = JSON.parse(read(mirrorD, "etiuda-head.json")); } catch { head = null; }
    const run = D.api.relayRun();
    let news = null;
    try { news = run && run.program && typeof run.program.headNews === "function" ? run.program.headNews(Date.now()) : null; } catch { news = null; }
    const entry = head && Array.isArray(head.editions) ? head.editions.filter((e) => e && e.catalog === catalogId)[0] : null;
    check(!!entry && entry.rev === pub1.rev && entry.edition === pub1.edition && entry.published === pub1.edition
      && head.v === 1 && head.team === teamId && Number.isFinite(head.t)
      && !!news && news.shown === true && news.blocked === false && news.edition === pub1.edition && news.published === pub1.edition,
      "re9 the desk receives Studio's head after the publish and shows the edition Studio published: "
      + (news && news.shown ? news.edition + ", published " + news.published : "nothing shown")
      + ", rev " + (entry ? entry.rev : "none") + " against " + pub1.rev + " (" + pub1.edition + ")");
  }

  /* ---- the desk's own files back, and the invitation let go once it has read its wrap ---- */
  await D.ask("etiuda:team-join", "view");
  const gone = await until(async () => { await D.kick(); await sync(); return read(mirror, joinRel) === null; }, 25000);
  const useRel = "desks/" + me.id + "/in-use.ec";
  const deskUse = read(path.join(D.ud, "relay", rt), useRel);
  const useBack = deskUse === null ? "the desk wrote none" : (await until(async () => { await D.kick(); await sync(); return read(mirror, useRel) === deskUse; }, 25000)) ? "reached Studio" : "MISSING";
  fs.unlinkSync(path.join(x.mirror, "desks", X.keyId, "join.json"));
  await settle(x.ch); await sync();
  const lets = K.relayInvitesOf(teamsFile, vault, teamId);
  const letGo = lets.length === 2 && lets.every((i) => i.gone && i.dropped);
  check(gone && letGo && useBack !== "MISSING",
    "re2 the desk's own files reach Studio: its request removed once it is admitted " + gone + ", in-use " + useBack + "; and each invitation is"
    + " let go once its desk has read its wrap, its copy superseded and its token dropped " + letGo);

  /* ---- a forged, a replayed and a misplaced blob from the colleague's place, each dropped and said by Studio ---- */
  const useX = "desks/" + X.keyId + "/in-use.ec";
  put(x.mirror, useX, "{\"inUse\":\"lantern-quay one\"}\n");
  await settle(x.ch); await sync();
  const first = world.blobsBy(rt, X.keyId).filter((b) => !b.del).sort((a, b) => b.seq - a.seq)[0];
  const stash = world.recordOf(rt, first.id);
  put(x.mirror, useX, "{\"inUse\":\"lantern-quay two\"}\n");
  await settle(x.ch); await sync();
  const before = { use: read(mirror, useX), edition: read(mirror, path.basename(pub1.ec)), team: read(mirror, "etiuda-team.json") };
  const saidFrom = studioSaid.length;
  const latest = world.recordOf(rt, world.blobsBy(rt, X.keyId).filter((b) => !b.del).sort((a, b) => b.seq - a.seq)[0].id);
  const forgedCt = Buffer.from(latest.ct); forgedCt[forgedCt.length - 1] ^= 1;
  world.inject(rt, Object.assign({}, latest.rec, { id: hex(16), supersedes: null }), forgedCt);
  world.store(rt).del("tomb:" + stash.rec.id);
  world.inject(rt, Object.assign({}, stash.rec), stash.ct);
  const B = world.B;
  const misplaced = B.seal({ relayTeamId: rt, epoch: 1, teamKey: xHeld.get(1), writer: { keyId: X.keyId, privateKey: X.privateKey },
    path: path.basename(pub1.ec), body: "{\"kind\":\"etiuda-sealed\",\"note\":\"a colleague's edition at the lead's root\"}\n",
    counter: Date.now() + 60000, place: "desk:" + X.keyId, kind: "file" });
  world.inject(rt, { id: misplaced.id, supersedes: null, epoch: 1, writer: X.keyId, counter: misplaced.counter, del: false,
    sig: misplaced.signature, nonce: misplaced.nonce, place: "desk:" + X.keyId }, misplaced.ciphertext);
  await sync();
  const words = studioSaid.slice(saidFrom);
  const count = (reason) => words.filter((l) => l.indexOf(B.REASONS[reason]) >= 0).length;
  const same = read(mirror, useX) === before.use && read(mirror, path.basename(pub1.ec)) === before.edition && read(mirror, "etiuda-team.json") === before.team;
  check(count("bad-signature") >= 1 && count("replay-counter") >= 1 && count("outside-place") >= 1 && same && before.use === "{\"inUse\":\"lantern-quay two\"}\n",
    "re3 a forged, a replayed and a misplaced blob from the colleague's place are each dropped and said by Studio, its mirror as it was: said"
    + " bad-signature " + count("bad-signature") + ", replay-counter " + count("replay-counter") + ", outside-place " + count("outside-place")
    + ", the mirror " + (same ? "unchanged" : "CHANGED"));

  /* ---- an epoch move while the desk is offline ---- */
  D.t.down = true;
  await D.kick();
  const r2 = await Studio.removeMember(proj, keyAt, teamId, X.keyId, PASS, { confirm: true, teamKeys: K.teamKeysOf(teamsFile, vault),
    invites: K.inviteBookOf(teamsFile, vault), teamsFile });
  K.keepTeamKey(teamsFile, vault, teamId, r2.team.epoch, Buffer.from(r2.teamKey));
  if (r2.removedDesk) K.markRemoved(teamsFile, teamId, r2.removedDesk, r2.removedAt, r2.team.epoch, r2.removedFiles);
  await Studio.addCard(proj, shelf, "Second opening", "Good evening from Lantern Quay.");
  const pub3 = await Studio.publishProject(proj, { folder: mirror, notes: "Edition three.", now: "2026-10-18T08:30:00.000Z",
    leadKey: keyAt, teamKeys: K.teamKeysOf(teamsFile, vault), key: keyAt, passphrase: PASS, ...(await licensedOpts()) });
  await sync();
  D.t.down = false;
  /* The page's next read, as the mirror's watch prompts it in the app. */
  const reached = await until(async () => { await D.kick(); return revOf(D.api.readCatalog() || "") === pub3.rev; }, 12000);
  const seen = (D.envelope().teamEpochSeen || {})[teamId];
  const leadBox = JSON.parse(read(mirror, "etiuda-team.json")).lead.box;
  const boxNow = Relay.leadOpened(keyAt, PASS).box.public;
  await settle(x.ch);
  /* Told at once on its socket, or at its next ask: either way said once. */
  const xOut = x.said.some((l) => l.indexOf(B.REASONS.removed) >= 0) && !xHeld.has(2);
  check(r2.team.epoch === 2 && reached && seen === 2 && leadBox === boxNow && xOut,
    "re4 an epoch move while the desk is offline: Studio takes the colleague off with a new key, and the desk, back, reaches the new team file"
    + " and key with no step through Studio's agreement by the box the team file names as lead.box (" + (leadBox === boxNow) + "): epoch seen "
    + seen + ", the edition published under the new key " + (reached ? "loaded, rev " + pub3.rev : "NOT loaded (" + revOf(D.api.readCatalog() || "") + ")")
    + "; the colleague taken off holds no new key and is refused " + xOut);
  await x.ch.stop();
  const ch = D.api.relayRun(); if (ch) await ch.stop();

  /* ---- N2: the invitation carries the lead's box, and a desk admitted while offline joins through it ---- */
  const targetNow = await Studio.inviteTarget(proj, keyAt);
  const secretE = newSecret(), riE = Relay.relayInvite(secretE);
  const madeE = makeInvite(targetNow, "Bo Lantern", secretE, Date.now(), undefined, { rt, url: Relay.RELAY_URL, token: riE.token, inv: riE.inv });
  K.keepInvite(teamsFile, vault, teamId, { id: madeE.id, secret: secretE, made: madeE.made, expires: madeE.expires, name: madeE.name, relay: riE });
  const inBlob = JSON.parse(Buffer.from(madeE.blob.slice(12), "base64url").toString("utf8")).lead.box;
  const fileBox = JSON.parse(read(mirror, "etiuda-team.json")).lead.box;
  const carries = /^[0-9a-f]{64}$/.test(String(fileBox)) && inBlob === fileBox && targetNow.lead.box === fileBox;
  /* The token registered, no copy up: the desk asks holding no team file. */
  holdPuts = true;
  await sync();
  const loadE = deskLoader(world, lab);
  const E = await loadE("desk-twelve");
  await E.ask("etiuda:team-join", "read", madeE.blob);
  const takenE = await E.ask("etiuda:team-join", "invite", madeE.blob, "Desk Twelve", madeE.code);
  const meE = await E.ask("etiuda:branch-identity", false);
  const sentE = await until(async () => { await E.kick(); return world.blobsBy(rt, meE.id).length > 0; }, 25000);
  const heldAtAsk = read(path.join(E.ud, "relay", rt), "etiuda-team.json") !== null;
  E.t.down = true;
  await E.kick();
  /* Admitted while away; the invitation past its end is let go before it is back. */
  holdPuts = false;
  const askedE = await until(async () => { await sync(); return !!read(mirror, "desks/" + meE.id + "/join.json"); }, 25000);
  const r3 = await admit();
  await sync();
  const DAY = 24 * 60 * 60 * 1000;
  skew = 45 * DAY; world.R.clock.now = Date.now() + skew;
  await sync();
  const iE = K.relayInvitesOf(teamsFile, vault, teamId, Date.now() + skew).find((i) => i.id === madeE.id);
  const copyE = world.entries(rt).filter(([k, v]) => k.startsWith("blob:") && v.place === "invite:" + riE.inv).map(([, v]) => v).sort((a, b) => b.seq - a.seq)[0];
  const letGoE = !!iE && iE.gone && iE.dropped && !!copyE && copyE.del === true;
  E.t.down = false;
  /* Back on a computer whose clock has moved 45 days, as the relay's and Studio's have: the desk's own throttle on a seat renewal
     (signinSeatRenewAt, stamped by the sign-in's press) is read against its clock, which in the lab had moved seconds. */
  loadE.clock.skew = skew;
  const joinedE = await until(async () => { await E.kick(); return revOf(E.api.readCatalog() || "") === pub3.rev; }, 12000);
  check(carries && !!takenE && !takenE.refused && sentE && !heldAtAsk && askedE && (r3.admitted || []).indexOf(meE.id) >= 0 && letGoE && joinedE,
    "re7 N2: the invitation Studio makes carries the lead's box, the team file's lead.box " + carries + "; the desk asks by it before any copy is"
    + " up " + sentE + ", holding " + (heldAtAsk ? "a team file" : "no team file") + ", its request at Studio " + askedE + ", admitted while away "
    + ((r3.admitted || []).indexOf(meE.id) >= 0) + ", the invitation let go past its end " + letGoE + "; back 45 days on it joins by itself: "
    + (joinedE ? "rev " + pub3.rev + " loaded" : "NOT loaded (" + E.said.filter((l) => /relay|team/.test(l)).slice(-2).join(" / ") + ")"));
  const chE = E.api.relayRun(); if (chE) await chE.stop();
  await runner.stop();
  check(regStand.held() && world.foreign.length === 0, "re6 no registry question reached the machine (" + regStand.said() + ") and"
    + " no call left the lab (" + world.foreign.length + ")");
}

/* ---- BOARD 922: THE LEAD'S ANSWER TO A DESK THAT ASKED BY A RELAY INVITATION ----------------------------------------------
   A second scenario, its own relay and its own lead, because it moves the lab's clock by days and the first must not meet that.
   The lead's side is what shell/main.js does with src/relay.mjs: the thread's refuseDeskJoin and watchAdmit, then answerJoin
   or answerAdmitted on the runner. Each desk is the pinned shell, joining by an invitation that carries the lead's box. */
const DAY = 24 * 60 * 60 * 1000;
async function answers() {
  const world = await relayWorld(), lab = labDir("relay-e2e-922");
  const ud = path.join(lab, "studio-ud");
  fs.mkdirSync(ud, { recursive: true });
  const keyAt = path.join(ud, "studio-key.json");
  const lead = await makeKeyFile({ passphrase: PASS });
  fs.writeFileSync(keyAt, JSON.stringify(lead, null, 1) + "\n");
  granted(keyAt, lead.public);
  const teamsFile = K.teamsFile(ud), vault = makeVault();
  const teamId = "t-" + hex(8), rt = Relay.relayId();
  K.keepTeamKey(teamsFile, vault, teamId, 1, crypto.randomBytes(32));
  const mirror = K.keepRelay(teamsFile, teamId, rt, Relay.RELAY_URL);
  fs.mkdirSync(mirror, { recursive: true });
  const made0 = await Studio.newProject(path.join(lab, "projects"), "Harbour Quay", [{ code: "en", name: "English" }]);
  const proj = made0.dir;
  const shelf = (await Studio.addTag(proj, "shelf", { en: "Openers" })).tag.id;
  await Studio.addCard(proj, shelf, "Warm opening", "Good day, and welcome to Harbour Quay.");
  Studio.setPublishFolder(proj, mirror);
  await olderFolderTeam(proj, { relay: true, key: keyAt, passphrase: PASS, teamId, teamKeys: K.teamKeysOf(teamsFile, vault) });
  const sealedHere = (await heldTeam(mirror, { key: keyAt })).team;
  await writeTeam(mirror, withChannel(sealedHere, { kind: "relay", rt, url: Relay.RELAY_URL }, { format: 1, kind: "etiuda-ring", keys: [] }),
    { key: keyAt, passphrase: PASS });
  const pub1 = await Studio.publishProject(proj, { folder: mirror, notes: "Edition one.", now: "2026-10-19T07:00:00.000Z",
    leadKey: keyAt, teamKeys: K.teamKeysOf(teamsFile, vault), key: keyAt, passphrase: PASS, ...(await licensedOpts()) });
  const st = world.transport("studio"), studioSaid = [];
  let skew = 0;
  const runner = Relay.relayRunner({ roots: GRANT_ROOTS, teamsFile, vault, keyFile: keyAt, secret: () => PASS, request: st.request, connect: st.connect,
    watch: false, pollMs: 1e9, say: (l) => studioSaid.push(l), clock: () => Date.now() + skew });
  const sync = async () => { await runner.sync(); await runner.idle(); await runner.sync(); await runner.idle(); };
  await sync();
  /* Asked for on their own, so a tree without them says so in a leg and not by a throw. */
  const answerJoin = Relay.answerJoin || (async () => ({ ok: false, reason: "missing" }));
  const answerAdmitted = Relay.answerAdmitted || (async () => []);
  const target = await Studio.inviteTarget(proj, keyAt);
  const J = Engine.joinRules(), I = Engine.inviteRules();
  /* `ahead` makes the invitation later, so its own end falls after the week the refusal holds the drop for. */
  const invite = (name, ahead) => {
    const secret = newSecret(), ri = Relay.relayInvite(secret);
    const made = makeInvite(target, name, secret, Date.now() + (ahead || 0), undefined, { rt, url: Relay.RELAY_URL, token: ri.token, inv: ri.inv });
    K.keepInvite(teamsFile, vault, teamId, { id: made.id, secret, made: made.made, expires: made.expires, name: made.name, relay: ri });
    return { made, ri, secret };
  };
  const loadDesk = deskLoader(world, lab);
  /* A desk takes a new invitation and its request reaches Studio's mirror; nothing is admitted or refused. */
  const askBy = async (name, as, ahead) => {
    const f = invite(name, ahead);
    await sync();
    const Dk = await loadDesk(as);
    await Dk.ask("etiuda:team-join", "read", f.made.blob);
    const took = await Dk.ask("etiuda:team-join", "invite", f.made.blob, name + "'s desk", f.made.code);
    const who = await Dk.ask("etiuda:branch-identity", false);
    const there = await until(async () => { await Dk.kick(); await sync(); return !!read(mirror, "desks/" + who.id + "/join.json"); }, 25000);
    return { f, Dk, who, took: !!took && !took.refused, there, ok: !!took && !took.refused && there };
  };
  const view = async (Dk) => { await Dk.kick(); return Dk.ask("etiuda:team-join", "view"); };
  const now = () => Date.now() + skew;
  const refuse = async (id) => {
    await Studio.refuseDeskJoin(proj, keyAt, id, { invites: K.inviteBookOf(teamsFile, vault), now: now(), passphrase: PASS });
    return answerJoin(runner, { teamsFile, vault, team: teamId, folder: mirror, desk: id, answer: "refused", now: now() });
  };
  const admit = async () => {
    const r = await Studio.watchAdmit(mirror, keyAt, PASS, { auto: false, teamKeys: K.teamKeysOf(teamsFile, vault),
      invites: K.inviteBookOf(teamsFile, vault), teamsFile });
    for (const x of r.spent || []) K.endInvite(teamsFile, teamId, x.invite, "spent", x.desk);
    return r;
  };
  const answerBlob = (f) => world.entries(rt).some(([k, v]) => k.startsWith("blob:") && v.place === "answer:" + f.ri.inv);
  const relayRow = (f) => K.relayInvitesOf(teamsFile, vault, teamId, now()).find((i) => i.id === f.made.id) || null;
  const bookRow = (f) => K.invitesOf(teamsFile, teamId, now()).find((i) => i.id === f.made.id) || null;
  /* A genuine request that proves invitation `f`'s secret from a desk that never reached the relay: the invitation is unused there. */
  const askUnused = (f) => {
    const Z = Object.assign(keyPair(true), { box: boxPair() });
    const zCommit = J.joinCommit(teamId, Z.pub, Z.box.pub, hex(32));
    const zReq = { format: 1, kind: J.JOIN_KIND, team: teamId, desk: { id: Z.keyId, key: Z.pub, box: Z.box.pub, name: "Desk Twelve" },
      date: new Date().toISOString(), commit: zCommit, invite: { id: I.inviteIdOf(f.secret), proof: I.memberProof(f.secret, zCommit) } };
    zReq.sig = { alg: "Ed25519", keyId: Z.keyId };
    zReq.sig.value = crypto.sign(null, J.joinSignedBytes(zReq), Z.privateKey).toString("hex");
    put(mirror, "desks/" + Z.keyId + "/join.json", JSON.stringify(zReq, null, 1) + "\n");
    return Z.keyId;
  };

  /* ---- re10 (C8 b): the lead refuses 31 minutes after the upload, on the lab's clock, and the desk shows refused ---- */
  const R = await askBy("Cy Quay", "desk-fifteen", 5 * DAY);
  skew = 31 * 60 * 1000;
  world.R.clock.now = Date.now() + skew;
  const refused = await refuse(R.who.id);
  /* The answer written marks the invitation to be dropped itself, before any sync: nothing owed, its hold started. */
  const rowR0 = relayRow(R.f);
  const markedR = !!rowR0 && !rowR0.owed && Number.isFinite(rowR0.dropAfter);
  await sync();
  const shown = await until(async () => { const v = await view(R.Dk); return !!v.join && v.join.state === "refused"; }, 25000);
  const recR = world.store(rt).get("inv:" + R.f.ri.inv), rowR = relayRow(R.f), bookR = bookRow(R.f);
  check(R.ok && refused.ok === true && refused.answered === "refused" && answerBlob(R.f) && shown && markedR
    && !!recR && recR.uploaded === true && !!bookR && bookR.state === "withdrawn" && !!rowR && rowR.gone === true && rowR.dropped === false,
    "re10 C8 (b): the desk asks by an invitation, 31 minutes pass on the lab's clock, the lead refuses and writes the answer " + (refused.ok === true && answerBlob(R.f))
    + ", and the desk shows refused " + shown + "; the invitation is withdrawn in the book " + (!!bookR && bookR.state === "withdrawn")
    + " and its drop waits, the relay still holding it bound " + (!!recR && recR.uploaded === true)
    + ", marked to be dropped by the answer itself, nothing owed " + markedR
    + "; ask taken " + R.took + ", join file " + R.there
    + (refused.ok === true ? "" : " (answer: " + JSON.stringify(refused) + ")"));

  /* ---- re11: the lead admits, the answer reads joined, the invitation is not dropped, and the desk is then enrolled and reads the team ---- */
  const A = await askBy("Di Quay", "desk-sixteen");
  const adm = await admit();
  const told = await answerAdmitted(runner, { teamsFile, vault, team: teamId, folder: mirror, spent: adm.spent, now: now() });
  const joined = await until(async () => { const v = await view(A.Dk); return !!v.joined; }, 25000);
  const rowA = relayRow(A.f), recA = world.store(rt).get("inv:" + A.f.ri.inv);
  const aBlob = answerBlob(A.f);
  await sync();
  const loadedA = await until(async () => { await A.Dk.kick(); return revOf(A.Dk.api.readCatalog() || "") === pub1.rev; }, 12000);
  check(A.ok && (adm.admitted || []).indexOf(A.who.id) >= 0 && Array.isArray(told) && told.length === 0 && aBlob && joined
    && !!rowA && rowA.gone === false && rowA.dropped === false && !!recA && recA.uploaded === true && loadedA,
    "re11 the lead admits the desk (" + ((adm.admitted || []).indexOf(A.who.id) >= 0) + ") and writes joined " + aBlob + ", the desk's answer reads joined "
    + joined + " before it is enrolled, the invitation is not dropped " + (!!rowA && !rowA.gone && !rowA.dropped && !!recA && recA.uploaded === true)
    + ", and once the roster is enrolled the desk reads the team: " + (loadedA ? "rev " + pub1.rev + " loaded" : "NOT loaded")
    + "; ask taken " + A.took + ", join file " + A.there);

  /* ---- re13: a refusal of a request whose proof is not valid writes no answer and ends no invitation ---- */
  const V = invite("Eli Quay");
  await sync();
  const Y = Object.assign(keyPair(true), { box: boxPair() });
  const commit = J.joinCommit(teamId, Y.pub, Y.box.pub, hex(32));
  const req = { format: 1, kind: J.JOIN_KIND, team: teamId, desk: { id: Y.keyId, key: Y.pub, box: Y.box.pub, name: "Desk Eleven" },
    date: new Date().toISOString(), commit, invite: { id: I.inviteIdOf(V.secret), proof: hex(32) } };
  req.sig = { alg: "Ed25519", keyId: Y.keyId };
  req.sig.value = crypto.sign(null, J.joinSignedBytes(req), Y.privateKey).toString("hex");
  put(mirror, "desks/" + Y.keyId + "/join.json", JSON.stringify(req, null, 1) + "\n");
  const forged = await refuse(Y.keyId);
  const recV = world.store(rt).get("inv:" + V.ri.inv), rowV = relayRow(V), bookV = bookRow(V);
  check(forged.ok === true && forged.none === true && !answerBlob(V) && !!recV && recV.spent === false && !!bookV && bookV.state === "live"
    && !!rowV && rowV.gone === false,
    "re13 a request that names a live invitation with a proof that is not its secret's, refused, writes no answer " + !answerBlob(V)
    + " and ends nothing: the invitation stays live " + (!!bookV && bookV.state === "live") + " and unspent at the relay " + (!!recV && recV.spent === false));

  /* ---- re20 (E1 of the test architect's verdict on 922's Studio half): the relay does not answer when the lead refuses. The
     invitation is withdrawn in the book at once, the answer is kept owed on its row, the lead is told, and the next sync that
     reaches the relay writes it; the hold on the drop counts from then ---- */
  const E = await askBy("Fay Quay", "desk-seventeen", 5 * DAY);
  st.down = true;
  const owedE = await refuse(E.who.id);
  const relE1 = relayRow(E.f), bookE1 = bookRow(E.f);
  const heldE = E.ok && owedE.ok === false && owedE.said === Relay.ANSWER_UNSENT && owedE.saidPl === Relay.ANSWER_UNSENT_PL && !answerBlob(E.f)
    && !!bookE1 && bookE1.state === "withdrawn" && !!relE1 && relE1.gone === true && relE1.dropped === false
    && !!relE1.owed && relE1.owed.desk === E.who.id && relE1.owed.answer === "refused" && relE1.dropAfter === null;
  skew += 60 * 1000;
  world.R.clock.now = Date.now() + skew;
  await sync();
  const stillE = !!relayRow(E.f) && !!relayRow(E.f).owed && !answerBlob(E.f) && relayRow(E.f).dropped === false;
  st.down = false;
  const reachedAt = now();
  await sync();
  const shownE = await until(async () => { const v = await view(E.Dk); return !!v.join && v.join.state === "refused"; }, 25000);
  const relE2 = relayRow(E.f), recE = world.store(rt).get("inv:" + E.f.ri.inv);
  check(heldE && stillE && answerBlob(E.f) && shownE && !!relE2 && relE2.owed === null && relE2.dropped === false
    && Number.isFinite(relE2.dropAfter) && relE2.dropAfter >= reachedAt + Relay.ANSWER_HOLD_MS && !!recE && recE.uploaded === true,
    "re20 E1: the lead refuses with the relay not answering, and the invitation is withdrawn in the book at once " + (!!bookE1 && bookE1.state === "withdrawn")
    + " with the answer kept owed and the lead told " + (heldE && stillE) + "; when the relay is reached the sync writes it " + answerBlob(E.f)
    + ", the desk shows refused " + shownE + ", and the drop is held a week from then " + (!!relE2 && Number.isFinite(relE2.dropAfter) && relE2.dropAfter >= reachedAt + Relay.ANSWER_HOLD_MS)
    + "; ask taken " + E.took + ", join file " + E.there
    + (owedE.ok === false ? "" : " (answer: " + JSON.stringify(owedE) + ")"));

  /* ---- re21: no runner at all when the lead refuses (Studio not yet running its relay): the same, and the sync's drop does not
     overtake the owed answer ---- */
  const F = await askBy("Gus Quay", "desk-eighteen", 5 * DAY);
  await Studio.refuseDeskJoin(proj, keyAt, F.who.id, { invites: K.inviteBookOf(teamsFile, vault), now: now(), passphrase: PASS });
  const noRunner = await answerJoin(null, { teamsFile, vault, team: teamId, folder: mirror, desk: F.who.id, answer: "refused", now: now() });
  const relF1 = relayRow(F.f), bookF1 = bookRow(F.f);
  const heldF = F.ok && noRunner.ok === false && noRunner.said === Relay.ANSWER_UNSENT && !answerBlob(F.f) && !!bookF1 && bookF1.state === "withdrawn"
    && !!relF1 && relF1.gone === true && relF1.dropped === false && !!relF1.owed;
  await sync();
  const shownF = await until(async () => { const v = await view(F.Dk); return !!v.join && v.join.state === "refused"; }, 25000);
  const relF2 = relayRow(F.f), recF = world.store(rt).get("inv:" + F.f.ri.inv);
  check(heldF && answerBlob(F.f) && shownF && !!relF2 && relF2.owed === null && relF2.dropped === false && !!recF && recF.uploaded === true,
    "re21 E1: the lead refuses with no runner, the invitation is withdrawn and the answer owed " + heldF + "; the first sync that has a runner writes it "
    + answerBlob(F.f) + " before the drop can go, the desk shows refused " + shownF + " and the relay still holds the invitation bound " + (!!recF && recF.uploaded === true)
    + "; ask taken " + F.took + ", join file " + F.there);

  /* ---- re22 (Q1, Claude alpha's ruling of 2026-10-20 07:47): a refusal of a desk whose invitation the relay reports used asks for the
     new key, and one whose invitation it reports unused moves nothing ---- */
  const U = invite("Hal Quay", 5 * DAY);
  await sync();
  const unusedRefused = await refuse(askUnused(U));
  const relU = relayRow(U), bookU = bookRow(U), relRq = relayRow(R.f);
  check(refused.ok === true && refused.move === true && refused.id === R.f.made.id && !!relRq && relRq.pendingMove === true
    && unusedRefused.ok === true && unusedRefused.answered === "refused" && unusedRefused.move === false && answerBlob(U)
    && !!bookU && bookU.state === "withdrawn" && !!relU && relU.gone === true && relU.pendingMove === false,
    "re22 Q1: the refusal of the desk that opened the wrap (re10) says the team is to move to a new key " + (refused.move === true)
    + " and marks its invitation for the one confirm " + (!!relRq && relRq.pendingMove === true) + "; the refusal of a desk whose invitation the relay reports unused answers "
    + (unusedRefused.answered || "nothing") + " and moves nothing " + (unusedRefused.move === false && !!relU && relU.pendingMove === false));

  /* ---- re23: an owed answer whose invitation ends before the relay is reached is let go, and the invitation is dropped ---- */
  const G = await askBy("Ivy Quay", "desk-nineteen", 6 * DAY);

  /* What the relay keeps of an invitation: its live row, or, once pruned, the spent marker the hardened relay keeps apart
     under sp: (engine 487d99eb, H5), so the scans never meet it. */
  const keptOf = (inv) => world.store(rt).get("inv:" + inv) || world.store(rt).get("sp:" + inv);
  /* ---- re12: a week after the refusal the drop is sent, and the relay's record of the invitation is dropped ---- */
  const before = world.store(rt).get("inv:" + R.f.ri.inv);
  skew += 7 * DAY + 60000;
  world.R.clock.now = Date.now() + skew;
  await sync();
  const after = keptOf(R.f.ri.inv), rowR2 = relayRow(R.f);
  check(!!before && before.uploaded === true && !!after && after.spent === true && after.uploaded !== true && !after.key && !!rowR2 && rowR2.dropped === true,
    "re12 the refused invitation is dropped by the lead's signed call once the week is over: the relay held it bound until then "
    + (!!before && before.uploaded === true) + " and now keeps of it only that it was spent " + (!!after && after.spent === true && after.uploaded !== true && !after.key)
    + ", and the lead's book marks it dropped " + (!!rowR2 && rowR2.dropped === true));

  /* ---- re23 (the second half): G is refused with the relay not answering, and its invitation ends before the relay is reached ---- */
  st.down = true;
  const owedG = await refuse(G.who.id);
  const relG1 = relayRow(G.f);
  skew += 7 * DAY;
  world.R.clock.now = Date.now() + skew;
  await sync();
  const relG2 = relayRow(G.f);
  st.down = false;
  await sync();
  const relG3 = relayRow(G.f), recG = keptOf(G.f.ri.inv);
  check(G.ok && owedG.ok === false && !!relG1 && !!relG1.owed && !!relG2 && relG2.owed === null && relG2.dropped === false && !answerBlob(G.f)
    && !!relG3 && relG3.dropped === true && !!recG && recG.spent === true && recG.uploaded !== true,
    "re23 E1: an owed answer whose invitation ended before the relay was reached is let go, not written " + (!!relG2 && relG2.owed === null && !answerBlob(G.f))
    + ", and the invitation is then dropped by the lead's signed call " + (!!relG3 && relG3.dropped === true) + " and unbound at the relay " + (!!recG && recG.uploaded !== true)
    + "; ask taken " + G.took + ", join file " + G.there);
  for (const Dk of [R.Dk, A.Dk, E.Dk, F.Dk, G.Dk]) { const c = Dk.api.relayRun(); if (c) await c.stop(); }
  await runner.stop();
}

/* RELAY FINDING 1, STUDIO'S LEAD HALF (a third scenario, devices(), on a relay and a team of its own): two Studios on one lead
   key, A and B, each with its own teams file and mirror, the key file copied as a second computer of the lead holds it. A moves
   the roster on while B is away; B, back with an older team file in its mirror and a list it has not enrolled, is the Studio that
   could cut desks off. The relay's roster is read from its own store (dev: and gone: rows). */
async function devices() {
  const world = await relayWorld(), lab = labDir("relay-e2e-devices");
  const udA = path.join(lab, "a-ud"), udB = path.join(lab, "b-ud");
  fs.mkdirSync(udA, { recursive: true }); fs.mkdirSync(udB, { recursive: true });
  const keyA = path.join(udA, "studio-key.json"), keyB = path.join(udB, "studio-key.json");
  const lead = await makeKeyFile({ passphrase: PASS });
  fs.writeFileSync(keyA, JSON.stringify(lead, null, 1) + "\n");
  fs.copyFileSync(keyA, keyB);
  granted(keyA, lead.public); granted(keyB, lead.public);
  const vault = makeVault(), teamId = "t-" + hex(8), rt = Relay.relayId(), key1 = crypto.randomBytes(32);
  const fileA = K.teamsFile(udA), fileB = K.teamsFile(udB);
  K.keepTeamKey(fileA, vault, teamId, 1, key1); K.keepTeamKey(fileB, vault, teamId, 1, key1);
  const mirrorA = K.keepRelay(fileA, teamId, rt, Relay.RELAY_URL), mirrorB = K.keepRelay(fileB, teamId, rt, Relay.RELAY_URL);
  fs.mkdirSync(mirrorA, { recursive: true }); fs.mkdirSync(mirrorB, { recursive: true });
  const desks = [1, 2, 3, 4, 5, 6].map(() => Object.assign(keyPair(true), { box: boxPair() }));
  let team = newTeam({ id: teamId, catalogs: ["quay-lamps"], lead: { keyId: lead.keyId, public: lead.public }, sealed: true, exportsSealed: true });
  team = withChannel(withDesk(team, { id: desks[0].keyId, key: desks[0].pub, box: desks[0].box.pub }),
    { kind: "relay", rt, url: Relay.RELAY_URL }, { format: 1, kind: "etiuda-ring", keys: [] });
  await writeTeam(mirrorA, team, { key: keyA, passphrase: PASS });
  /* A adds the next desk to its roster: a new team file, its rev the one A's list is read from. */
  const addOnA = async (d) => {
    const h = (await heldTeam(mirrorA, { key: keyA })).team;
    return (await writeTeam(mirrorA, withDesk(h, { id: d.keyId, key: d.pub, box: d.box.pub }), { key: keyA, passphrase: PASS })).team;
  };
  const tA = world.transport("studio-a"), tB = world.transport("studio-b"), saidB = [];
  /* B's own /devices posts from `from` on in its transport's record, each body read back with the relay's answer to it. */
  const postsB = (from) => tB.sent.slice(from).filter((s) => s.indexOf("POST ") === 0 && /\/t\/[0-9a-f]{32}\/devices\n/.test(s))
    .map((s) => { try { return JSON.parse(s.slice(s.lastIndexOf("\n{") + 1)); } catch { return null; } });
  const answersB = [];
  const rawB = tB.request;
  tB.request = async (method, url, headers, body) => {
    const res = await rawB(method, url, headers, body);
    if (method === "POST" && /\/devices$/.test(String(url))) {
      let error = "";
      try { error = JSON.parse(Buffer.from(res.bytes || []).toString("utf8")).error || ""; } catch { error = ""; }
      answersB.push({ status: res.status, error });
    }
    return res;
  };
  /* The catch-up lifted: the relay's since list answered 503 to B, until `upTo` posts of B's /devices are made. */
  let withhold = -1;
  tB.answer = async (method, url) => {
    if (withhold < 0 || method !== "GET" || !/\/since\/\d+$/.test(String(url))) return null;
    if (answersB.length >= withhold) return null;
    return { status: 503, header: () => null, bytes: Buffer.from(JSON.stringify({ error: "unavailable" }), "utf8") };
  };
  const runnerA = Relay.relayRunner({ roots: GRANT_ROOTS, teamsFile: fileA, vault, keyFile: keyA, secret: () => PASS,
    request: tA.request, connect: tA.connect, watch: false, pollMs: 1e9 });
  const runnerB = Relay.relayRunner({ roots: GRANT_ROOTS, teamsFile: fileB, vault, keyFile: keyB, secret: () => PASS,
    request: tB.request, connect: tB.connect, watch: false, pollMs: 1e9, say: (l) => saidB.push(l) });
  const syncA = async () => { await runnerA.sync(); await runnerA.idle(); };
  const syncB = async () => { await runnerB.sync(); await runnerB.idle(); };
  const roster = () => {
    const s = world.store(rt);
    return desks.map((d) => (s && s.get("dev:" + d.keyId) ? "on" : s && s.get("gone:" + d.keyId) ? "gone" : "-")).join(",");
  };
  const rowB = () => K.relayTeams(fileB).find((w) => w.team === teamId) || {};
  const fromOf = (p) => (p && p.from ? p.from.epoch + "/" + p.from.rev : "none");
  try {
    /* A makes the team on the relay with one desk; B, a second computer of the lead, reads it and goes away before its next sync. */
    await syncA();
    await syncB();
    const atB = await heldTeam(mirrorB, { key: keyB });
    await runnerB.stop();
    /* ---- re32: A moves on while B is away; B, back, catches up before it posts ---- */
    const rev2 = (await addOnA(desks[1])).rev;
    await syncA();
    const before32 = roster(), mark32 = tB.sent.length, ans32 = answersB.length;
    await syncB();
    const p32 = postsB(mark32), a32 = answersB.slice(ans32), after32 = roster();
    const mirror32 = (await heldTeam(mirrorB, { key: keyB })).team;
    check(!!atB.team && atB.team.rev < rev2 && before32 === "on,on,-,-,-,-" && p32.length === 1 && !!p32[0] && fromOf(p32[0]) === "1/" + rev2
      && p32[0].keys.length === 2 && a32.length === 1 && a32[0].status === 200 && after32 === "on,on,-,-,-,-" && !!mirror32 && mirror32.rev === rev2,
      "re32 a Studio behind on the team file catches up before it posts /devices: B read rev " + (atB.team ? atB.team.rev : "none")
      + " before A wrote rev " + rev2 + ", and back it posts " + p32.length + " list(s), from " + fromOf(p32[0]) + " with "
      + (p32[0] ? p32[0].keys.length : 0) + " desk(s), answered " + a32.map((a) => a.status + (a.error ? " " + a.error : "")).join(", ")
      + "; the relay's roster " + before32 + " then " + after32);

    /* ---- re33: B fetches a newer file without enrolling it and goes away; A moves on again; back, B's catch-up is withheld once ---- */
    const rev3 = (await addOnA(desks[2])).rev;
    await syncA();
    { const ch = runnerB.channel(teamId); if (ch) { ch.kick(); await ch.idle(); } }
    await runnerB.stop();
    const behind33 = (await heldTeam(mirrorB, { key: keyB })).team;
    const rev4 = (await addOnA(desks[3])).rev;
    await syncA();
    const mark33 = tB.sent.length, ans33 = answersB.length;
    withhold = ans33 + 1;
    await syncB();
    withhold = -1;
    const p33 = postsB(mark33), a33 = answersB.slice(ans33), after33 = roster();
    const enrolled33 = rowB().enrolled === sha(JSON.stringify(Relay.devicesOf((await heldTeam(mirrorB, { key: keyB })).team)));
    check(!!behind33 && behind33.rev === rev3 && p33.length === 2 && fromOf(p33[0]) === "1/" + rev3 && a33.length === 2
      && a33[0].error === "replay-rev" && fromOf(p33[1]) === "1/" + rev4 && p33[1].keys.length === 4 && a33[1].status === 200
      && after33 === "on,on,on,on,-,-" && enrolled33,
      "re33 with B's catch-up withheld, its list from the older file (" + fromOf(p33[0]) + ") is refused "
      + (a33[0] ? a33[0].status + " " + a33[0].error : "not posted") + " and the relay's roster stays whole, " + after33
      + "; B catches up and posts once more, from " + fromOf(p33[1]) + " with " + (p33[1] ? p33[1].keys.length : 0) + " desk(s), answered "
      + (a33[1] ? a33[1].status : "nothing") + ", and keeps it as enrolled " + enrolled33);

    /* ---- re34: the same with the catch-up withheld through the retry: refused twice, the roster whole, and said ---- */
    const rev5 = (await addOnA(desks[4])).rev;
    await syncA();
    { const ch = runnerB.channel(teamId); if (ch) { ch.kick(); await ch.idle(); } }
    await runnerB.stop();
    const rev6 = (await addOnA(desks[5])).rev;
    await syncA();
    const mark34 = tB.sent.length, ans34 = answersB.length, said34 = saidB.length;
    withhold = Infinity;
    await syncB();
    withhold = -1;
    const p34 = postsB(mark34), a34 = answersB.slice(ans34), after34 = roster(), note34 = rowB().syncNote;
    const saidLine = saidB.slice(said34).some((l) => l.indexOf(world.B.REASONS["replay-rev"]) >= 0);
    await syncB();
    const healed = roster(), p34b = postsB(mark34).slice(p34.length);
    check(p34.length === 2 && a34.length === 2 && a34.every((a) => a.error === "replay-rev") && fromOf(p34[0]) === "1/" + rev5
      && fromOf(p34[1]) === "1/" + rev5 && after34 === "on,on,on,on,on,on" && note34 === "out-of-step" && saidLine
      && p34b.length === 1 && fromOf(p34b[0]) === "1/" + rev6 && healed === "on,on,on,on,on,on",
      "re34 with B's catch-up withheld through its retry, both lists from rev " + rev5 + " are refused ("
      + a34.map((a) => a.status + " " + a.error).join(", ") + ") and the relay's roster stays whole, " + after34
      + "; B says it where it says the relay was not kept in step (" + (note34 || "no line") + ", said " + saidLine
      + "), and the next sync, its catch-up served, posts from " + fromOf(p34b[0]) + ": " + healed);
  } finally {
    await runnerA.stop();
    await runnerB.stop();
  }
}

/* One plant, in `tree` (a scratch copy), never in this checkout. `hold` waits after the write
   so a kill during the wait runs no restore and still leaves this checkout untouched. */
/* How long each plant child took in this process, by the scenario it runs, read by plantOne() to size the next child's timeout. */
const childMs = {};
function plantOne(tree, p, hold) {
  const at = path.join(tree, p.file), was = fs.readFileSync(at), want = sha(was);
  const lines = was.toString("utf8").split("\n");
  const hits = lines.map((l, i) => (l.indexOf("/* plant:" + p.mark + " */") >= 0 ? i : -1)).filter((i) => i >= 0);
  let red = false, back = false, out = "";
  if (hits.length === 1) {
    lines[hits[0]] = p.line;
    fs.writeFileSync(at, lines.join("\n"));
    try {
      if (hold) {
        const flag = process.env.RELAY_E2E_HOLD_FLAG || "";
        if (flag) fs.appendFileSync(flag, "WINDOW\n");
        process.stdout.write("WINDOW\n");
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 120000);
        red = true;
      } else {
        const childScript = path.join(tree, "tests", "relay-e2e.mjs");
        const env = Object.assign({}, process.env, { RELAY_E2E_ONLY: p.only || "1" });
        delete env.RELAY_E2E_HOLD;
        delete env.RELAY_E2E_HOLD_FLAG;
        /* THE CHILD'S TIMEOUT FOLLOWS THE SCENARIO'S OWN MEASURED TIME, not one figure for all. re5 and re8a take 197 to 231 s alone
           and timed out under lock contention at a flat 240 s (MACHINE, 2026-11-23). The bound is three times the longest this process
           measured for a child of the same scenario, and never under 240 s; the first child of a scenario has no measure yet and
           gets 720 s, three times the slowest first child seen alone (re5, 231 s). A timeout is still no verdict (red stays false, so the check fails), never a pass. */
        const key = env.RELAY_E2E_ONLY, started = Date.now();
        const timeout = childMs[key] ? Math.max(240000, 3 * childMs[key]) : 720000;
        const r = spawnSync(process.execPath, [childScript], { cwd: tree, encoding: "utf8", timeout, env });
        childMs[key] = Math.max(childMs[key] || 0, Date.now() - started);
        out = (r.stdout || "").split("\n").filter((l) => l.indexOf("FAIL " + p.leg) >= 0).join(" ").slice(0, 240);
        red = (r.stdout || "").indexOf("FAIL " + p.leg) >= 0;
      }
    } finally { fs.writeFileSync(at, was); }
    back = sha(fs.readFileSync(at)) === want;
  }
  return { hits: hits.length, red, back, out };
}

async function withPlantCopy(label, fn) {
  const plants = await import("./plants-tree.mjs");
  const before = plants.treeSha(ROOT);
  let tree = null;
  try {
    tree = plants.plantsTree(ROOT, label);
    await fn(tree, before);
  } finally {
    plants.dropPlantsTree(tree, ROOT);
  }
}

try {
  if (process.env.RELAY_E2E_HOLD === "1") {
    await withPlantCopy("relay-e2e-hold", async (tree) => {
      const flag = process.env.RELAY_E2E_HOLD_FLAG || "";
      if (flag) fs.writeFileSync(flag, "COPY " + tree + "\n");
      process.stdout.write("PLANT-COPY " + tree + "\n");
      plantOne(tree, PLANTS[0], true);
    });
  } else {
    if (!MODE) {
      if (process.env.ETIUDA_PLANTS === "off") {
        console.log("relay-e2e: plants skipped (ETIUDA_PLANTS=off)");
      } else {
        /* The plants first, each in a child of the scratch copy, so the green run below is this process's own. */
        await withPlantCopy("relay-e2e", async (tree, before) => {
          const { treeSha } = await import("./plants-tree.mjs");
          for (const p of PLANTS) {
            const r = plantOne(tree, p, false);
            check(r.hits === 1 && r.red && r.back, p.name + " PLANT: " + p.says + ", so " + p.leg + " goes red (" + (r.red ? "red" : "STILL GREEN")
              + "), and " + p.file + " comes back by sha256 " + r.back + (r.out ? ": " + r.out : ""));
          }
          const held = treeSha(ROOT) === before;
          check(held, "the checkout's sha256 over src/, shell/ and ui/ is unchanged after the plants phase");
        });
      }
    }
    if (!MODE || MODE === "1") await main();
    if (!MODE || MODE === "answers") await answers();
    if (!MODE || MODE === "devices") await devices();
  }
} catch (e) {
  check(false, "harness: " + (e && e.stack ? e.stack.split("\n").slice(0, 4).join(" / ") : e));
}
/* The hold waits inside the copy, then this process drops the copy and stops. It is not the suite. */
if (process.env.RELAY_E2E_HOLD === "1") {
  console.log("#counts checks=" + asserted + " failed=" + failed + " expected=0");
  console.log(failed ? "  RESULT: FAIL " + failed + " of " + asserted : "  RESULT: ok hold");
  process.exit(failed ? 1 : 0);
}
const want = MODE === "1" ? EXPECTED_MAIN : MODE === "answers" ? EXPECTED_ANSWERS : MODE === "devices" ? EXPECTED_DEVICES : EXPECTED;
const skipCount = process.env.ETIUDA_PLANTS === "off" ? PLANTS.length + 1 : 0;
console.log("#counts checks=" + asserted + " failed=" + failed + (skipCount ? " skipped=" + skipCount : "") + " expected=" + want);
if (asserted + skipCount < want) { console.log("SUITE DID NOT COMPLETE: " + asserted + " of " + want + " checks ran"); process.exit(78); }
console.log(failed ? "  RESULT: FAIL " + failed + " of " + asserted : "  RESULT: ok " + asserted + " check(s)");
process.exit(Math.min(failed, 63));
