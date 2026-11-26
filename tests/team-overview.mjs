/* THE TEAM READER AND THE OVERVIEW SCREEN (board 962 stage 1).
 *
 *     node tests/team-overview.mjs [--keep]
 *
 * gate-kind: node
 *
 * Claims:
 *   1  the team reader returns every team this Studio leads from teams.json with no project open
 *   2  a folder away shows last known from teams.json, marked as away
 *   3  two teams (folder and relay) are returned with their connection, lead print, catalogs, project and count against 30
 *   4  a foreign catalog shows name and edition only, with foreign: true, and no content
 *   5  no team key, card or secret reaches the page
 *   6  the overview HTML at nothing connected shows the two branches, relay and shared folder, and ways to connect
 *   7  the overview HTML at 15 teammates draws map A with four rows, trunk and four columns
 *   8  the overview HTML at 17 teammates shows up to 16 teammates and says how many more with a way to the screen in 3
 *   9  the overview HTML at two teams shows one map at a time with a tab per team
 *  10  a tampered team file isn't believed, with a plant on the verification
 *  11  a publish with the desk's file unchanged reads behind
 *  12  a desk's changed copy isn't foreign
 *  13  no key file, or a key on a passphrase, reads without a throw
 *  14  an away folder shows its last-known catalog and stamp, said as such
 *  15  editionsOf runs once per project per call, not per teammate
 *  16  a validly signed team file by another key is not believed where teams.json names the lead
 *  962s5x  a team of two catalogs: each teammate's catalog is named, and judged current, by its own library project, and the old
 *      `project` still names the first beside `projects` (board 962 stage 5, T3)
 *  962t5g  the reader marks a team sealed where teams.json and its file both say so, and led where its lead is this Studio's key
 *  962t5h  a team of two catalogs is named by both on the Teams screen, its tab and its map, with a way into each; Add a catalog to
 *      this team lists only the library's catalogs with no team and sends the one pressed; a Plain team offers none (board 962
 *      stage 5, T5)
 *  974s4  a version read without the box is blank, and the first call that has the passphrase reads it again (board 974, security 4)
 *  974m4  the card says inviting and letting in teammates needs a catalog, and a lead can end an empty team, freeing its slot.
 *      A team with a teammate or a catalog draws no End. An empty team's End leaves the key backup holding the team's key.
 *  974e1  a team with one live invitation draws no End, and the same team once that invitation is spent or cancelled draws it.
 *  974m8  a lead holding a linked copy is shown it, and a catalog with no copy still offers to make one
 */
import "./reg-stand-on.mjs";
import { licensedOpts } from "./licensed.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as Engine from "../src/engine.mjs";
import { makeKeyFile, readKeyFile, unlockKey, ensureLeadBox, signDocument } from "../src/sign.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { loadPage } from "./page-stand-in.mjs";
import { seatEnv } from "./seated.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "team-overview");

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

const ONLY = process.env.TEAM_OVERVIEW_ONLY || "";
async function leg(line, fn) {
  /* One leg by its first word, for the plants below, which prove each deciding line in a scratch copy. */
  if (ONLY && (/^(\S+)/.exec(line) || [])[1] !== ONLY) return;
  try { check(!!(await fn()), line); }
  catch (e) { check(false, line + " (threw: " + String(e && e.message || e).split("\n")[0].slice(0, 160) + ")"); }
}

const rawPublic = (k) => crypto.createPublicKey(k).export({ type: "spki", format: "der" }).subarray(-32);
const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex");

function newDesk(name) {
  const sign = crypto.generateKeyPairSync("ed25519"), box = crypto.generateKeyPairSync("x25519");
  const key = rawPublic(sign.privateKey).toString("hex");
  const id = "k-" + sha256(Buffer.from(key, "hex")).slice(0, 16);
  const block = { id, key, box: rawPublic(box.privateKey).toString("hex"), name: name || id };
  return { id, name: block.name, block, pub: key, pair: sign, boxKey: box.privateKey, signKey: sign.privateKey };
}

function writeEc(file, team, inner, key) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const seal = Engine.sealRules();
  fs.writeFileSync(file, JSON.stringify(seal.sealCatalog(key || team.key, team.id, team.epoch, JSON.stringify(inner)), null, 1) + "\n", "utf8");
}

function inUseDoc(desk, cat) {
  const D = Engine.deskRules();
  const out = {
    format: 1,
    kind: "etiuda-in-use",
    desk: { id: desk.id, key: desk.pub, box: "ab".repeat(32), name: desk.name },
    at: "2026-11-04T12:00:00.000Z",
    catalog: { id: cat.id, rev: cat.rev, sha256: cat.sha256 || sha256(Buffer.from(cat.title || cat.name || "")), signer: "", source: "file", title: cat.title || cat.name },
    sig: { alg: "Ed25519", keyId: desk.id }
  };
  out.sig.value = crypto.sign(null, D.branchSignedBytes(out), desk.pair.privateKey).toString("hex");
  return out;
}

function writeStatsDoc(file, leadBoxPub, leadKeyId, teamId, desk, engineVer) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const inner = {
    format: 1,
    kind: "etiuda-stats-answer",
    engine: engineVer || "2.0.0",
    desk: desk.id,
    sig: { alg: "Ed25519", keyId: desk.id }
  };
  inner.sig.value = crypto.sign(null, Engine.statsRules().statsAnswerSignedBytes(inner), desk.pair.privateKey).toString("hex");
  const env = Engine.statsRules().sealStatsLead(leadBoxPub, teamId, leadKeyId, desk.id, JSON.stringify(inner));
  fs.writeFileSync(file, JSON.stringify(env, null, 1) + "\n", "utf8");
}

const LEFT_EN = "This Studio left the team, and its copy of the team's files went to the Recycle Bin.";
const KEPT_EN = "This Studio left the team, but its copy of the team's files could not be moved to the Recycle Bin, so it stays in Studio's own folder on this computer.";
const LEFT_PL = "To Studio opuściło zespół, a kopia plików zespołu trafiła do Kosza.";
const KEPT_PL = "To Studio opuściło zespół, ale kopii plików zespołu nie udało się przenieść do Kosza, więc zostaje w folderze Studia na tym komputerze.";

/** What do-follow-leave says for a shell answer `res`, in English or Polish. */
async function toastOf(res, lang) {
  const P = loadPage({
    uiLang: lang === "pl" ? "pl" : undefined,
    api: {
      followLeave: async () => res,
      projects: async () => ({ root: "C:\\Projects", projects: [] }),
      teams: async () => ({ teams: [] }),
      followState: async () => ({ follow: null }),
    },
  });
  P.page.S.cover = "follow-leave";
  P.page.S.follow = { team: "t-1122334455667788", channel: "relay", leadName: "Ada", state: "following", catalogs: [] };
  await P.page.ACTS["do-follow-leave"]();
  return String((P.node("#said") && P.node("#said").textContent) || "");
}

const samePath = (a, b) => process.platform === "win32"
  ? path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase()
  : path.resolve(a) === path.resolve(b);

/** One studio:follow-leave through shell/main.js. `trash` is the Recycle Bin. */
async function driveLeave({ ud, vault, trash }) {
  const Module = (await import("node:module")).default;
  const { createRequire } = await import("node:module");
  const req = createRequire(import.meta.url);
  const load = Module._load;
  const handlers = {};
  const calls = [];
  const fakeElectron = {
    app: { getPath: () => ud, whenReady: () => new Promise(() => {}), on() {}, commandLine: { appendSwitch() {}, hasSwitch: () => false }, quit() {}, requestSingleInstanceLock: () => true },
    ipcMain: { handle: (ch, fn) => { handlers[ch] = fn; }, on() {} },
    BrowserWindow: class Win {
      constructor() { this.webContents = { id: 1, on() {}, once() {}, send() {}, setWindowOpenHandler() {} }; }
      static fromWebContents() { return null; }
      static getAllWindows() { return []; }
      on() {} once() {} isDestroyed() { return false; } isMaximized() { return false; } isMinimized() { return false; }
      close() {} focus() {} restore() {} loadFile() {} show() {} setMinimumSize() {}
    },
    Menu: { setApplicationMenu() {}, buildFromTemplate: () => ({}) },
    dialog: { showMessageBox: () => Promise.resolve({ response: 0 }) },
    nativeTheme: { themeSource: "system", shouldUseDarkColors: false },
    clipboard: { writeText() {} },
    safeStorage: {
      isEncryptionAvailable: () => true,
      encryptString: (s) => vault.seal(s),
      decryptString: (b) => vault.open(b),
    },
    screen: { getAllDisplays: () => [], getPrimaryDisplay: () => ({ bounds: {}, workAreaSize: {} }), on() {} },
    session: { defaultSession: { setPermissionRequestHandler() {}, setPermissionCheckHandler() {}, setDevicePermissionHandler() {} } },
    shell: {
      openPath: () => Promise.resolve(""),
      trashItem: (p) => { calls.push(String(p)); return trash(p); },
    },
    net: { fetch: () => Promise.reject(new Error("no network")) },
  };
  const threadMock = { call: () => Promise.resolve({}) };
  const MAIN_PATH = path.join(ROOT, "shell", "main.js");
  Module._load = function (request) {
    if (request === "electron") return fakeElectron;
    if (/studio-thread\.cjs$/.test(String(request))) return threadMock;
    return load.apply(this, arguments);
  };
  try {
    delete req.cache[MAIN_PATH];
    req(MAIN_PATH);
    if (!handlers["studio:follow-leave"]) throw new Error("studio:follow-leave handler not registered");
    const fakeEvt = { senderFrame: { parent: null, url: pathToFileURL(path.resolve(ROOT, "ui", "index.html")).href } };
    const res = await handlers["studio:follow-leave"](fakeEvt);
    return { res, calls };
  } finally {
    Module._load = load;
    delete req.cache[MAIN_PATH];
  }
}

/** A followed team whose mirror is a real folder, sealed with `vault`, so the shell can open it. */
async function followedLab(name) {
  const { makeVault } = await import("./relay-lab.mjs");
  const K = await import("../src/team-store.mjs");
  const Relay = await import("../src/relay.mjs");
  const lab = path.join(SCRATCH, name);
  const ud = path.join(lab, "ud");
  fs.mkdirSync(ud, { recursive: true });
  const vault = makeVault();
  const teamId = "t-" + crypto.randomBytes(8).toString("hex");
  const member = "k-" + crypto.randomBytes(8).toString("hex");
  K.keepFollowing(K.teamsFile(ud), vault, teamId, {
    channel: "relay", relay: { rt: "ab".repeat(16), url: Relay.RELAY_URL }, member, leadName: "Ada",
  }, {
    lead: { keyId: "k-" + "ab".repeat(8), public: crypto.randomBytes(32).toString("hex") },
    chain: [], keys: {}, invite: null,
  });
  const mirror = path.join(ud, "following", teamId);
  fs.mkdirSync(mirror, { recursive: true });
  fs.writeFileSync(path.join(mirror, "kept.txt"), "mirror\n");
  return { ud, vault, mirror };
}

/**
 * Claim 18's check against `mainPath` (the checkout, or a scratch copy whose in-use write was lifted).
 * Answers the parts, and `check`, which is the conjunction the leg returns. A missing in-use file is a
 * failed check, not a throw, so a plant can show which part failed.
 */
async function baseTakeOutcome(mainPath, labName) {
  const lab = path.join(SCRATCH, labName);
  fs.mkdirSync(lab, { recursive: true });
  const croot = path.join(lab, "central-projects");
  const oroot = path.join(lab, "office-projects"), oud = path.join(lab, "office-ud");
  [croot, oroot, oud].forEach((d) => fs.mkdirSync(d, { recursive: true }));

  const S = await import("../src/studio.mjs");
  const M = await import("../src/member.mjs");
  const K = await import("../src/team-store.mjs");
  const Relay = await import("../src/relay.mjs");
  const TeamMod = await import("../src/team.mjs");
  const { makeInvite, newSecret } = await import("../src/invite.mjs");
  const { relayWorld, makeVault, placeGrant, GRANT_ROOTS, memberSeat } = await import("./relay-lab.mjs");
  const PASS = "passphrase-for-test-12345678";
  const rw = await relayWorld();

  const cud = path.join(lab, "central-ud");
  fs.mkdirSync(cud, { recursive: true });
  const cKeyAt = path.join(cud, "signing-key.json");
  fs.writeFileSync(cKeyAt, JSON.stringify(await makeKeyFile({ passphrase: PASS }), null, 1) + "\n");
  const cKey = unlockKey(readKeyFile(cKeyAt), PASS);
  placeGrant(cKeyAt, cKey.public);
  const ctf = K.teamsFile(cud);
  const cVault = makeVault();

  const cp = await S.newProject(croot, "Central Catalog", ["en"]);
  const shelf = await S.addTag(cp.dir, "shelf", { en: "General" });
  const sid = (shelf.tag || shelf).id;
  await S.addCard(cp.dir, sid, "First Card", "First body");
  const cDraft = JSON.parse(fs.readFileSync(path.join(cp.dir, "draft.json"), "utf8"));
  const catId = cDraft.id;

  const teamId = "t-" + crypto.randomBytes(8).toString("hex"), teamKey = crypto.randomBytes(32), rt = Relay.relayId();
  K.keepTeamKey(ctf, cVault, teamId, 1, teamKey);
  const share = K.keepRelay(ctf, teamId, rt, Relay.RELAY_URL);
  fs.mkdirSync(share, { recursive: true });
  let teamDoc = TeamMod.newTeam({ id: teamId, catalogs: [catId], lead: { keyId: cKey.keyId, public: cKey.public }, sealed: true, exportsSealed: true });
  teamDoc = TeamMod.withChannel(teamDoc, { kind: "relay", rt, url: Relay.RELAY_URL }, { format: 1, kind: "etiuda-ring", keys: [] });
  await TeamMod.writeTeam(share, teamDoc, { key: cKeyAt, passphrase: PASS });
  const lt = rw.transport("central");
  const runner = Relay.relayRunner({ roots: GRANT_ROOTS, teamsFile: ctf, vault: cVault, keyFile: cKeyAt, secret: () => PASS,
    request: lt.request, connect: lt.connect, watch: false, pollMs: 1e9, say: () => {} });

  const box = Relay.leadOpened(cKeyAt, PASS).box.public;
  const secret = newSecret(), ri = Relay.relayInvite(secret);
  const made = makeInvite({ team: teamId, folder: share, lead: { keyId: cKey.keyId, public: cKey.public, box } }, "Lead", secret, Date.now(),
    undefined, { rt, url: Relay.RELAY_URL, token: ri.token, inv: ri.inv });
  K.keepInvite(ctf, cVault, teamId, { id: made.id, secret, made: made.made, expires: made.expires, name: made.name, relay: ri });
  S.setPublishFolder(cp.dir, share);
  await S.publishProject(cp.dir, { folder: share, key: cKeyAt, passphrase: PASS, teamKeys: K.teamKeysOf(ctf, cVault), now: "2026-11-09T10:00:00.000Z", ...(await licensedOpts()) });
  await runner.sync(); await runner.idle();

  const oKeyAt = path.join(oud, "signing-key.json");
  fs.writeFileSync(oKeyAt, JSON.stringify(await makeKeyFile({ passphrase: PASS }), null, 1) + "\n");
  const oKey = unlockKey(readKeyFile(oKeyAt), PASS);
  const otf = K.teamsFile(oud);
  const oVault = makeVault();
  const oMemberFile = path.join(oud, "member-key.json");

  const joined = M.joinTeam({ teamsFile: otf, vault: oVault, memberFile: oMemberFile, text: made.link, name: "Office", signingPublic: oKey.public });
  const ot = rw.transport("office");
  const followRun = M.startFollow({ teamsFile: otf, vault: oVault, memberFile: oMemberFile, seat: memberSeat(oMemberFile), signingPublic: oKey.public,
    request: ot.request, connect: ot.connect, pollMs: 1e9, watch: false });
  for (let i = 0; i < 3; i++) { followRun.kick(); await followRun.idle(); }
  await runner.sync(); await runner.idle();
  const admitted = await S.watchAdmit(share, cKeyAt, PASS, { auto: false, teamKeys: K.teamKeysOf(ctf, cVault), invites: K.inviteBookOf(ctf, cVault), teamsFile: ctf });
  for (const x of admitted.spent || []) K.endInvite(ctf, teamId, x.invite, "spent", x.desk);
  await Relay.answerAdmitted(runner, { teamsFile: ctf, vault: cVault, team: teamId, folder: share, spent: admitted.spent });
  for (let i = 0; i < 2; i++) { followRun.kick(); await followRun.idle(); }
  for (let i = 0; i < 3; i++) {
    await runner.sync(); await runner.idle();
    followRun.kick(); await followRun.idle();
  }
  await followRun.stop();
  await runner.stop();

  const Module = (await import("node:module")).default;
  const { createRequire } = await import("node:module");
  const req = createRequire(import.meta.url);
  const load = Module._load;
  const handlers = {};
  const fakeElectron = {
    app: { getPath: () => oud, whenReady: () => new Promise(() => {}), on() {}, commandLine: { appendSwitch() {}, hasSwitch: () => false }, quit() {}, requestSingleInstanceLock: () => true },
    ipcMain: { handle: (ch, fn) => { handlers[ch] = fn; }, on() {} },
    BrowserWindow: class Win {
      constructor() { this.webContents = { id: 1, on() {}, once() {}, send() {}, setWindowOpenHandler() {} }; }
      static fromWebContents() { return null; }
      static getAllWindows() { return []; }
      on() {} once() {} isDestroyed() { return false; } isMaximized() { return false; } isMinimized() { return false; }
      close() {} focus() {} restore() {} loadFile() {} show() {} setMinimumSize() {}
    },
    Menu: { setApplicationMenu() {}, buildFromTemplate: () => ({}) },
    dialog: { showMessageBox: () => Promise.resolve({ response: 0 }) },
    nativeTheme: { themeSource: "system", shouldUseDarkColors: false },
    clipboard: { writeText() {} },
    safeStorage: {
      isEncryptionAvailable: () => true,
      encryptString: (s) => oVault.seal(s),
      decryptString: (b) => oVault.open(b),
    },
    screen: { getAllDisplays: () => [], getPrimaryDisplay: () => ({ bounds: {}, workAreaSize: {} }), on() {} },
    session: { defaultSession: { setPermissionRequestHandler() {}, setPermissionCheckHandler() {}, setDevicePermissionHandler() {} } },
    shell: { openPath: () => Promise.resolve(""), trashItem: () => Promise.resolve() },
    net: { fetch: () => Promise.reject(new Error("no network")) },
  };
  const threadMock = { call: (verb, ...args) => S[verb](...args) };
  const treeRoot = path.resolve(path.dirname(mainPath), "..");
  const envWas = { STUDIO_PROJECTS: process.env.STUDIO_PROJECTS, STUDIO_SIGNING_KEY: process.env.STUDIO_SIGNING_KEY, STUDIO_KEY_PASSPHRASE: process.env.STUDIO_KEY_PASSPHRASE };
  process.env.STUDIO_PROJECTS = oroot;
  process.env.STUDIO_SIGNING_KEY = oKeyAt;
  process.env.STUDIO_KEY_PASSPHRASE = PASS;
  /* A Studio that works, as a lead's does (the gate refuses a closed channel of one that does not). */
  for (const [k, v] of Object.entries(await seatEnv(oud, true, {}))) { if (v === null) delete process.env[k]; else process.env[k] = v; }
  Module._load = function (request) {
    if (request === "electron") return fakeElectron;
    if (/studio-thread\.cjs$/.test(String(request))) return threadMock;
    return load.apply(this, arguments);
  };

  let res = null;
  try {
    delete req.cache[mainPath];
    req(mainPath);
    if (!handlers["studio:base-take"]) throw new Error("studio:base-take handler not registered");
    const fakeEvt = { senderFrame: { parent: null, url: pathToFileURL(path.resolve(treeRoot, "ui", "index.html")).href } };
    res = await handlers["studio:base-take"](fakeEvt, catId);
  } finally {
    Module._load = load;
    delete req.cache[mainPath];
    for (const k of Object.keys(envWas)) {
      if (envWas[k] === undefined) delete process.env[k];
      else process.env[k] = envWas[k];
    }
  }

  const out = { newIdOk: false, rev0Ok: false, inUseStripped: false, inUseWritten: false, inUseOk: false, check: false };
  if (!res || !res.dir || !fs.existsSync(res.dir)) return out;
  const draftJson = JSON.parse(fs.readFileSync(path.join(res.dir, "draft.json"), "utf8"));
  out.newIdOk = !!(draftJson.id && draftJson.id !== catId);
  out.rev0Ok = draftJson.rev === 0;
  out.inUseStripped = res.inUse === undefined;
  const inUsePath = path.join(oud, "following", teamId, "desks", joined.member, "in-use.ec");
  out.inUseWritten = fs.existsSync(inUsePath);
  if (out.inUseWritten) {
    try {
      const inUseBytes = fs.readFileSync(inUsePath, "utf8");
      const openedInUse = JSON.parse(Engine.sealRules().openSealed(teamKey, JSON.parse(inUseBytes)));
      out.inUseOk = !!(openedInUse && openedInUse.kind === "etiuda-in-use"
        && openedInUse.desk && openedInUse.desk.id === joined.member
        && openedInUse.catalog && openedInUse.catalog.id === catId
        && openedInUse.catalog.rev === 1
        && /^sha256:[0-9a-f]{64}$/.test(openedInUse.catalog.sha256));
    } catch { out.inUseOk = false; }
  }
  out.check = out.newIdOk && out.rev0Ok && out.inUseStripped && out.inUseWritten && out.inUseOk;
  return out;
}

async function main(argv) {
  const keep = argv.indexOf("--keep") >= 0;
  clearScratch(SCRATCH);

  const ud = path.join(SCRATCH, "ud");
  /* Team 1 is on the relay, its folder the mirror the reader looks in (was: a team kept for a shared folder; the shared-folder team is
     removed, Max, 2026-11-22 15:37, and what is held of one is fh1 to fh3 below). */
  const rt1 = "11112222333344445555666677778888";
  const share1 = path.join(ud, "relay", rt1);
  const share2 = path.join(SCRATCH, "share2");
  const projectsRoot = path.join(SCRATCH, "projects");
  fs.mkdirSync(ud, { recursive: true });
  fs.mkdirSync(share1, { recursive: true });
  fs.mkdirSync(share2, { recursive: true });
  fs.mkdirSync(projectsRoot, { recursive: true });

  const PASS = "passphrase-for-test-lead";
  const leadKey = await makeKeyFile({ passphrase: PASS });
  const leadKeyPath = path.join(ud, "lead-key.json");
  fs.writeFileSync(leadKeyPath, JSON.stringify(leadKey, null, 1) + "\n");
  const readKf = readKeyFile(leadKeyPath);
  const leadBox = ensureLeadBox(readKf, unlockKey(readKf, PASS));

  const team1Id = "t-0000000000000001";
  const team1Key = crypto.randomBytes(32);
  const team2Id = "t-0000000000000002";
  const team2Key = crypto.randomBytes(32);

  // Setup Project 1
  const proj1Dir = path.join(projectsRoot, "Harbourlight");
  fs.mkdirSync(proj1Dir, { recursive: true });
  fs.writeFileSync(path.join(proj1Dir, "project.json"), JSON.stringify({
    displayName: "Harbourlight Insurance",
    folder: share1,
    id: "c-harbour",
    rev: 14,
    draft: { id: "c-harbour", rev: 14 }
  }, null, 1) + "\n");

  // Setup Desks for Team 1
  const alice = newDesk("Alice");
  const bob = newDesk("Bob");
  const foreignDesk = newDesk("Charlie");

  const leadUnlocked = unlockKey(readKf, PASS);

  const hpke = Engine.hpkeRules();
  const aliceWrap = hpke.wrapTeamKey(team1Key, alice.block.box, team1Id, 1, alice.id);
  const bobWrap = hpke.wrapTeamKey(team1Key, bob.block.box, team1Id, 1, bob.id);
  const foreignWrap = hpke.wrapTeamKey(team1Key, foreignDesk.block.box, team1Id, 1, foreignDesk.id);

  // Write Team 1 etiuda-team.json (signed by lead)
  const team1Doc = {
    format: 1,
    kind: "etiuda-team",
    id: team1Id,
    epoch: 1,
    rev: 1,
    sealed: true,
    exportsSealed: true,
    lead: { keyId: leadKey.keyId, public: leadKey.public, box: leadBox.public },
    catalogs: ["c-harbour"],
    channel: { kind: "relay", rt: rt1, url: "https://etiuda.dev" },
    roster: [
      { desk: alice.block, name: "Alice", wrap: aliceWrap },
      { desk: bob.block, name: "Bob", wrap: bobWrap },
      { desk: foreignDesk.block, name: "Charlie", wrap: foreignWrap }
    ]
  };
  const signedTeam1 = await signDocument(team1Doc, { privateKey: leadUnlocked.privateKey, keyId: leadUnlocked.keyId });
  fs.writeFileSync(path.join(share1, "etiuda-team.json"), JSON.stringify(signedTeam1, null, 1) + "\n");

  // Alice uses c-harbour at rev 14 (current) and has stats
  writeEc(path.join(share1, "desks", alice.id, "in-use.ec"), { id: team1Id, key: team1Key, epoch: 1 },
    inUseDoc(alice, { id: "c-harbour", rev: 14, title: "Harbourlight Insurance" }));
  writeStatsDoc(path.join(share1, "desks", alice.id, "stats.estat"), leadBox.public, leadKey.keyId, team1Id, alice, "2.0.4");

  // Bob has no in-use and no stats (just admitted)

  // Charlie uses a foreign catalog not in team1Doc.catalogs
  writeEc(path.join(share1, "desks", foreignDesk.id, "in-use.ec"), { id: team1Id, key: team1Key, epoch: 1 },
    inUseDoc(foreignDesk, { id: "c-foreign-999", rev: 2, title: "External Guide" }));

  // Write Team 2 etiuda-team.json in share2 (a relay team with mirror, signed by lead)
  const relayRt = "1234567890abcdef1234567890abcdef";
  const relayMirrorDir = path.join(ud, "relay-mirror", relayRt);
  fs.mkdirSync(relayMirrorDir, { recursive: true });
  const dorota = newDesk("Dorota");
  const dorotaWrap = hpke.wrapTeamKey(team2Key, dorota.block.box, team2Id, 1, dorota.id);
  const team2Doc = {
    format: 1,
    kind: "etiuda-team",
    id: team2Id,
    epoch: 1,
    rev: 1,
    sealed: true,
    exportsSealed: true,
    lead: { keyId: leadKey.keyId, public: leadKey.public, box: leadBox.public },
    catalogs: ["c-northwind"],
    channel: { kind: "relay", rt: relayRt, url: "https://etiuda.dev" },
    roster: [
      { desk: dorota.block, name: "Dorota", wrap: dorotaWrap }
    ]
  };
  const signedTeam2 = await signDocument(team2Doc, { privateKey: leadUnlocked.privateKey, keyId: leadUnlocked.keyId });
  fs.writeFileSync(path.join(relayMirrorDir, "etiuda-team.json"), JSON.stringify(signedTeam2, null, 1) + "\n");

  // Write teams.json in ud
  const teamsJsonPath = path.join(ud, "teams.json");
  const teamsJson = {
    format: 1,
    kind: "etiuda-studio-teams",
    teams: {
      [team1Id]: {
        folder: share1,
        relay: { rt: rt1, url: "https://etiuda.dev" },
        sealed: true,
        file: signedTeam1
      },
      [team2Id]: {
        folder: relayMirrorDir,
        relay: { rt: relayRt, url: "https://etiuda.dev" },
        sealed: true,
        file: signedTeam2
      }
    }
  };
  fs.writeFileSync(teamsJsonPath, JSON.stringify(teamsJson, null, 1) + "\n");

  const teamKeysMap = {
    [team1Id]: { 1: team1Key },
    [team2Id]: { 1: team2Key }
  };

  // Import team-reader
  let Reader = null;
  try {
    Reader = await import("../src/team-reader.mjs");
  } catch (e) {
    process.stderr.write("src/team-reader.mjs not loaded: " + String(e && e.message || e) + "\n");
  }

  // --- Claim 1: One team read ---
  await leg("1 the team reader returns team and teammate fields with no project open", async () => {
    if (!Reader || !Reader.readAllTeams) return false;
    const res = await Reader.readAllTeams({
      userData: ud,
      teamsFile: teamsJsonPath,
      projectsRoot,
      keyFile: leadKeyPath,
      passphrase: PASS,
      teamKeys: teamKeysMap
    });
    if (!res || !Array.isArray(res.teams)) return false;
    const t1 = res.teams.find((t) => t.id === team1Id);
    if (!t1) return false;
    if (t1.connection !== "relay") return false;
    if (!t1.leadPrint || t1.leadPrint.length !== 16) return false;
    if (!Array.isArray(t1.catalogs) || !t1.catalogs.includes("c-harbour")) return false;
    if (!t1.project || t1.project.name !== "Harbourlight Insurance") return false;
    if (t1.teammates.length !== 3) return false;

    const al = t1.teammates.find((m) => m.id === alice.id);
    if (!al || al.name !== "Alice" || al.kind !== "desk" || !al.admitted) return false;
    if (!al.catalog || al.catalog.title !== "Harbourlight Insurance" || al.catalog.rev !== 14 || al.catalog.foreign) return false;
    if (!al.catalog.current || al.catalog.behind) return false;
    if (!al.lastHeard) return false;
    if (al.version !== "2.0.4" || !al.statistics) return false;

    const b = t1.teammates.find((m) => m.id === bob.id);
    if (!b || b.name !== "Bob" || !b.admitted || b.catalog !== null || b.statistics) return false;

    return true;
  });

  /* BOARD 974, SECURITY 4. Claim 1 has already opened Alice's stats with the box, so the file is rewritten and its stamp moved
     on, or the blank read would be served from that earlier open. */
  await leg("974s4 a version read without the box is read again on the first call that has it", async () => {
    if (!Reader || !Reader.readAllTeams) return false;
    const statsAt = path.join(share1, "desks", alice.id, "stats.estat");
    writeStatsDoc(statsAt, leadBox.public, leadKey.keyId, team1Id, alice, "2.0.4");
    const st = fs.statSync(statsAt);
    const later = new Date(st.mtimeMs + 5000);
    fs.utimesSync(statsAt, later, later);
    const read = async (passphrase) => {
      const res = await Reader.readAllTeams({
        userData: ud, teamsFile: teamsJsonPath, projectsRoot, keyFile: leadKeyPath, passphrase, teamKeys: teamKeysMap
      });
      const t1 = res.teams.find((t) => t.id === team1Id);
      return t1 && t1.teammates.find((m) => m.id === alice.id);
    };
    const without = await read(undefined);
    if (!without || without.version !== "" || !without.statistics) return false;
    const withPass = await read(PASS);
    return !!(withPass && withPass.version === "2.0.4" && withPass.statistics);
  });

  // --- Claim 2: A relay mirror away (was: a shared folder away; a team kept for a folder is held, fh1) ---
  await leg("2 a relay mirror that is away shows last known from teams.json, marked as away (was: a folder that is away)", async () => {
    if (!Reader || !Reader.readAllTeams) return false;
    const awayUd = path.join(SCRATCH, "away-ud");
    fs.mkdirSync(awayUd, { recursive: true });
    const awayTeamsPath = path.join(awayUd, "teams.json");
    const awayTeamId = "t-00000000000000aa";
    const awayDoc = {
      format: 1,
      kind: "etiuda-studio-teams",
      teams: {
        [awayTeamId]: {
          folder: path.join(awayUd, "relay", rt1),
          relay: { rt: rt1, url: "https://etiuda.dev" },
          file: {
            format: 2,
            id: awayTeamId,
            lead: { keyId: leadKey.keyId, public: leadKey.public },
            catalogs: ["c-away"],
            roster: [{ desk: { id: "k-1111111111111111", name: "AwayDesk" }, wrap: "wrap" }]
          }
        }
      }
    };
    fs.writeFileSync(awayTeamsPath, JSON.stringify(awayDoc, null, 1) + "\n");
    const res = await Reader.readAllTeams({
      userData: awayUd,
      teamsFile: awayTeamsPath,
      projectsRoot,
      keyFile: leadKeyPath,
      teamKeys: {}
    });
    if (!res || !res.teams.length) return false;
    const t = res.teams[0];
    return t.away === true && t.id === awayTeamId && t.teammates.length === 1 && t.teammates[0].name === "AwayDesk";
  });

  // --- Claim 3: Two teams, both on the relay (was: folder and relay; the folder one is held, fh1) ---
  await leg("3 two relay teams returned with connection, lead print and catalogs (was: a folder team and a relay team)", async () => {
    if (!Reader || !Reader.readAllTeams) return false;
    const res = await Reader.readAllTeams({
      userData: ud,
      teamsFile: teamsJsonPath,
      projectsRoot,
      keyFile: leadKeyPath,
      teamKeys: teamKeysMap
    });
    if (!res || res.teams.length !== 2) return false;
    const first = res.teams.find((t) => t.id === team1Id);
    const relayTeam = res.teams.find((t) => t.id === team2Id);
    return !!(first && relayTeam && first.connection === "relay" && relayTeam.connection === "relay" && first.held !== true
      && first.leadPrint.length === 16 && first.catalogs.includes("c-harbour") && relayTeam.teammates.length === 1);
  });

  /* THE SHARED-FOLDER TEAM IS HELD, NOT SYNCED (the folder team's removal, Max, 2026-11-22 15:37: "remove it, burn it with fire"):
     a team in teams.json with a folder and no relay is named from the copy Studio kept and marked `held`, nothing is read from or
     written to its folder, the watch passes it by, and the screens say once that it no longer syncs. fh1 to fh3. */
  const heldUd = path.join(SCRATCH, "held-ud");
  const heldShare = path.join(SCRATCH, "held-share");
  const heldTeamId = "t-00000000000000f1", heldRelayId = "t-00000000000000f2", heldRt = "abcdef1234567890abcdef1234567890";
  const heldCarol = newDesk("Carol");
  fs.mkdirSync(heldUd, { recursive: true });
  fs.mkdirSync(path.join(heldShare, "desks", heldCarol.id), { recursive: true });
  const heldKey = crypto.randomBytes(32);
  const heldDoc = {
    format: 1, kind: "etiuda-team", id: heldTeamId, epoch: 1, rev: 1, sealed: true, exportsSealed: true,
    lead: { keyId: leadKey.keyId, public: leadKey.public, box: leadBox.public }, catalogs: ["c-harbour"], channel: { kind: "folder" },
    roster: [{ desk: heldCarol.block, name: "Carol", wrap: Engine.hpkeRules().wrapTeamKey(heldKey, heldCarol.block.box, heldTeamId, 1, heldCarol.id) }]
  };
  const heldSigned = await signDocument(heldDoc, { privateKey: leadUnlocked.privateKey, keyId: leadUnlocked.keyId });
  fs.writeFileSync(path.join(heldShare, "etiuda-team.json"), JSON.stringify(heldSigned, null, 1) + "\n");
  writeEc(path.join(heldShare, "desks", heldCarol.id, "in-use.ec"), { id: heldTeamId, key: heldKey, epoch: 1 },
    inUseDoc(heldCarol, { id: "c-harbour", rev: 14, title: "Harbourlight Insurance" }));
  writeStatsDoc(path.join(heldShare, "desks", heldCarol.id, "stats.estat"), leadBox.public, leadKey.keyId, heldTeamId, heldCarol, "2.0.4");
  fs.writeFileSync(path.join(heldShare, "extra.txt"), "keep\n");
  const heldTeamsPath = path.join(heldUd, "teams.json");
  fs.writeFileSync(heldTeamsPath, JSON.stringify({ format: 1, kind: "etiuda-studio-teams", teams: {
    [heldTeamId]: { folder: heldShare, sealed: true, file: heldSigned },
    [heldRelayId]: { folder: path.join(heldUd, "relay", heldRt), relay: { rt: heldRt, url: "https://etiuda.dev" }, sealed: true, file: signedTeam2 }
  } }, null, 1) + "\n");
  /* Every file under a folder, by name, size and time: a listing before and after says nothing on disk changed. */
  const listing = (dir) => {
    const out = [];
    const walk = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
        const at = path.join(d, e.name), st = fs.statSync(at);
        out.push(path.relative(dir, at) + ":" + (e.isDirectory() ? "dir" : st.size) + ":" + Math.round(st.mtimeMs));
        if (e.isDirectory()) walk(at);
      }
    };
    walk(dir);
    return out.join("\n");
  };
  const heldReadAll = () => Reader.readAllTeams({ userData: heldUd, teamsFile: heldTeamsPath, projectsRoot, keyFile: leadKeyPath, passphrase: PASS,
    teamKeys: { [heldTeamId]: { 1: heldKey } } });

  await leg("fh1 a team kept for a shared folder is held: the reader marks it held with no teammate, reads nothing under its folder and changes nothing there", async () => {
    if (!Reader || !Reader.readAllTeams) return false;
    const before = listing(heldShare);
    const under = path.resolve(heldShare).toLowerCase();
    const reads = [], writes = [];
    const tapped = ["readFileSync", "readdirSync", "openSync", "statSync", "lstatSync", "existsSync", "readFile", "readdir", "opendirSync",
      "writeFileSync", "appendFileSync", "mkdirSync", "rmSync", "unlinkSync", "renameSync", "copyFileSync", "utimesSync"];
    const writeSet = new Set(["writeFileSync", "appendFileSync", "mkdirSync", "rmSync", "unlinkSync", "renameSync", "copyFileSync", "utimesSync"]);
    const kept = {};
    for (const n of tapped) {
      kept[n] = fs[n];
      fs[n] = function (p, ...a) {
        const at = path.resolve(String(p)).toLowerCase();
        if (at === under || at.startsWith(under + path.sep)) (writeSet.has(n) ? writes : reads).push(n + ":" + p);
        return kept[n].call(this, p, ...a);
      };
    }
    let res = null;
    try { res = await heldReadAll(); } finally { for (const n of tapped) fs[n] = kept[n]; }
    const t = res && res.teams.find((x) => x.id === heldTeamId);
    const r = res && res.teams.find((x) => x.id === heldRelayId);
    const ok = !!t && t.held === true && t.connection === "folder" && t.teammates.length === 0 && t.led === false && t.away === false
      && t.catalogs.includes("c-harbour") && reads.length === 0 && writes.length === 0 && listing(heldShare) === before && !!r && r.held !== true;
    if (!ok) process.stderr.write("fh1 " + JSON.stringify({ held: t && t.held, teammates: t && t.teammates.length, reads: reads.length, writes: writes.length,
      same: listing(heldShare) === before, relayHeld: r && r.held }) + "\n");
    return ok;
  });

  await leg("fh2 the watch passes a held folder team by and admits nobody at its folder, and says why", async () => {
    const Store = await import("../src/team-store.mjs");
    const Studio = await import("../src/studio.mjs");
    const watched = Store.watchedTeams(heldTeamsPath).map((x) => x.team);
    const before = listing(heldShare);
    const got = await Studio.watchAdmit(heldShare, leadKeyPath, PASS, { teamKeys: { [heldTeamId]: { 1: heldKey } }, teamsFile: heldTeamsPath });
    const after = listing(heldShare);
    const ok = watched.length === 1 && watched[0] === heldRelayId && !!got && got.admitted.length === 0 && got.reason === "folder" && after === before;
    if (!ok) process.stderr.write("fh2 " + JSON.stringify({ watched, admitted: got && got.admitted, reason: got && got.reason, same: after === before }) + "\n");
    return ok;
  });

  await leg("fh3 the Connections map and the Team screen say once, in English and Polish, that a held folder team no longer syncs, and draw no roster, map or folder row for it", async () => {
    const res = await heldReadAll();
    const held = res.teams.find((x) => x.id === heldTeamId);
    const sentence = (lang, name) => lang === "pl"
      ? name + " korzysta ze wspólnego folderu, którego Etiuda Studio już nie obsługuje: to, co to Studio ma z tego zespołu, zostaje bez zmian, a nowe zaproszenie od lidera zespołu przywróci zespół."
      : name + " works through a shared folder, which Etiuda Studio no longer follows: what this Studio has of it stays as it is, and a new invitation from the team's lead brings the team back.";
    const lib = [{ dir: "C:\\Harbour", id: "c-harbour", name: "Harbourlight Insurance", counts: { cards: 1 }, rev: 14, folder: heldShare }];
    const seen = {};
    for (const lang of ["en", "pl"]) {
      const P = loadPage({ uiLang: lang === "pl" ? "pl" : undefined, api: { teams: () => Promise.resolve({ teams: [held] }), projects: () => Promise.resolve({ root: "C:\\Projects", projects: lib }) } });
      Object.assign(P.page.S, { screen: "projects", home: "team", projects: lib, teams: [held], teamTab: 0, host: { tour: { offered: true } } });
      P.page.paintTeams();
      const teamHtml = P.node("#main").innerHTML;
      Object.assign(P.page.S, { home: "overview" });
      P.page.paintProjects();
      const mapHtml = P.node("#main").innerHTML;
      const plain = (h) => h.replace(/&#39;/g, "'").replace(/&amp;/g, "&");
      const once = (h) => plain(h).split(sentence(lang, "Harbourlight Insurance")).length === 2;
      /* The project's own Team screen at that folder: the same one line, once, and no roster. */
      P.page.S.teams = [held];
      const bodyHtml = P.page.__get("desksBodyHtml")({ team: { id: heldTeamId, catalogs: 1, roster: [] }, folder: heldShare, requests: [] }, "C:\\Harbour");
      seen[lang] = once(teamHtml) && once(mapHtml) && once(bodyHtml) && !/Roster|Asking to join|Lista członków/.test(bodyHtml) && teamHtml.indexOf("data-held-folder") >= 0
        && !/Roster|Asking to join|Who can read what you publish|Lista członków|Shared folder|Wspólny folder|reads this folder|czyta ten folder/.test(teamHtml)
        && mapHtml.indexOf("fam15") < 0 && !/reads this folder|czyta ten folder/.test(mapHtml);
    }
    if (!(seen.en && seen.pl)) process.stderr.write("fh3 " + JSON.stringify(seen) + "\n");
    return seen.en && seen.pl;
  });

  // --- Claim 4: Foreign catalog shows name and edition only, no content ---
  await leg("4 a foreign catalog shows name and edition only, foreign: true, and no content", async () => {
    if (!Reader || !Reader.readAllTeams) return false;
    const res = await Reader.readAllTeams({
      userData: ud,
      teamsFile: teamsJsonPath,
      projectsRoot,
      keyFile: leadKeyPath,
      teamKeys: teamKeysMap
    });
    const t1 = res.teams.find((t) => t.id === team1Id);
    const ch = t1.teammates.find((m) => m.id === foreignDesk.id);
    if (!ch || !ch.catalog) return false;
    if (ch.catalog.foreign !== true) return false;
    if (ch.catalog.title !== "External Guide") return false;
    if (ch.catalog.rev !== 2) return false;
    // Must NOT contain cards or catalog document body
    if (ch.catalog.cards !== undefined || ch.catalog.content !== undefined) return false;
    return true;
  });

  // --- Claim 5: No team key or card reaches the page ---
  await leg("5 no team key, secret or card reaches the page result", async () => {
    if (!Reader || !Reader.readAllTeams) return false;
    const res = await Reader.readAllTeams({
      userData: ud,
      teamsFile: teamsJsonPath,
      projectsRoot,
      keyFile: leadKeyPath,
      teamKeys: teamKeysMap
    });
    const serialized = JSON.stringify(res);
    if (serialized.includes("teamKey") || serialized.includes(team1Key.toString("hex")) || serialized.includes(team2Key.toString("hex"))) return false;
    if (serialized.includes('"cards":') || serialized.includes('"secret":')) return false;
    return true;
  });

  // --- Claim 6: Overview HTML at nothing connected ---
  await leg("6 overview HTML at nothing connected shows the relay as its one branch and no shared folder (was: relay and folder branches, until 2026-11-20)", async () => {
    const P = loadPage({ api: { teams: () => Promise.resolve({ teams: [] }), projects: () => Promise.resolve({ root: "C:\\Projects", projects: [] }) } });
    P.page.S.screen = "projects";
    P.page.S.projects = [];
    P.page.S.teams = [];
    P.page.paintProjects();
    const html = P.node("#main").innerHTML;
    // Must have connections header
    const hasHead = html.includes("Connections") && html.includes("nothing connected");
    // Must have the one branch, the relay, and no shared folder (the owner, 2026-11-17 19:02: folder teams are removed)
    const hasRelay = html.includes("The relay") && html.includes("teammates join by invitation");
    const hasFolder = !html.includes("A shared folder") && !html.includes("teammates share one folder");
    // Must have This Studio
    const hasStudio = html.includes("This Studio");
    return hasHead && hasRelay && hasFolder && hasStudio;
  });

  // --- Claim 7: Overview HTML at 15 teammates ---
  await leg("7 overview HTML at 15 teammates draws map A with four rows and four columns", async () => {
    const T15_NAMES = ["Anna", "Marek", "Ola", "Dorota", "Kuba", "Tomek", "Ewa", "Piotr", "Kasia", "Michał", "Zofia", "Paweł", "Iga", "Bartek", "Biurko 16"];
    const t15Teammates = T15_NAMES.map((name, i) => ({
      id: "k-" + (1000 + i),
      name,
      kind: "desk",
      admitted: i < 14,
      version: "2.0.0",
      catalog: { title: "Harbourlight Insurance", rev: i === 5 ? 13 : 14, foreign: false, current: i !== 5, behind: i === 5 },
      lastHeard: "2026-11-04T12:00:00.000Z",
      statistics: true
    }));
    const team15 = {
      id: "t-team15",
      connection: "relay",
      leadPrint: "7f3a19c2e04b0000",
      catalogs: ["c-harbour"],
      project: { id: "c-harbour", name: "Harbourlight Insurance", dir: "C:\\Harbour", rev: 14 },
      teammates: t15Teammates,
      count: 15
    };
    const P = loadPage({ api: { teams: () => Promise.resolve({ teams: [team15] }), projects: () => Promise.resolve({ root: "C:\\Projects", projects: [{ dir: "C:\\Harbour", name: "Harbourlight Insurance", counts: { cards: 312 }, rev: 14 }] }) } });
    P.page.S.screen = "projects";
    P.page.S.projects = [{ dir: "C:\\Harbour", name: "Harbourlight Insurance", counts: { cards: 312 }, rev: 14 }];
    P.page.S.teams = [team15];
    P.page.paintProjects();
    const html = P.node("#main").innerHTML;
    // Map A elements
    const hasFam = html.includes('class="fam') || html.includes("fam15");
    const hasAnna = html.includes("Anna");
    const hasBartek = html.includes("Bartek");
    const hasKeys = html.includes("has the new edition") && html.includes("named, not admitted");
    // All 15 names present
    const allNamesPresent = T15_NAMES.every((n) => html.includes(n));
    return hasFam && hasAnna && hasBartek && hasKeys && allNamesPresent;
  });

  // --- Claim 8: Overview HTML at 17 teammates ---
  await leg("8 overview HTML at 17 teammates shows up to 16 teammates and says how many more", async () => {
    const t17Teammates = Array.from({ length: 17 }, (_, i) => ({
      id: "k-" + (2000 + i),
      name: "Teammate " + (i + 1),
      kind: "desk",
      admitted: true,
      version: "2.0.0",
      catalog: { title: "Harbourlight", rev: 14, foreign: false, current: true, behind: false },
      lastHeard: "2026-11-04T12:00:00.000Z",
      statistics: true
    }));
    const team17 = {
      id: "t-team17",
      connection: "relay",
      folder: "",
      relay: { rt: "0123456789abcdef0123456789abcdef", url: "https://etiuda.dev" },
      leadPrint: "7f3a19c2e04b0000",
      catalogs: ["c-harbour"],
      project: { id: "c-harbour", name: "Harbourlight Insurance", dir: "C:\\Harbour", rev: 14 },
      teammates: t17Teammates,
      count: 17
    };
    const P = loadPage({ api: { teams: () => Promise.resolve({ teams: [team17] }), projects: () => Promise.resolve({ root: "C:\\Projects", projects: [{ dir: "C:\\Harbour", name: "Harbourlight Insurance", counts: { cards: 312 }, rev: 14 }] }) } });
    P.page.S.screen = "projects";
    P.page.S.projects = [{ dir: "C:\\Harbour", name: "Harbourlight Insurance", counts: { cards: 312 }, rev: 14 }];
    P.page.S.teams = [team17];
    P.page.paintProjects();
    const html = P.node("#main").innerHTML;
    // First 16 teammates rendered, and indicator for remaining 1 more teammate with a way to teams screen
    const hasMore = /more teammate/i.test(html) && (html.includes('data-act="to-teams"') || html.includes('data-act="view-teams"'));
    const hasTeammate1 = html.includes("Teammate 1");
    const hasTeammate16 = html.includes("Teammate 16");
    return hasMore && hasTeammate1 && hasTeammate16;
  });

  // --- Claim 9: Overview HTML at two teams ---
  await leg("9 overview HTML at two teams shows tab per team and one map at a time", async () => {
    const tA = {
      id: "t-alpha",
      connection: "relay",
      leadPrint: "aaaa111122223333",
      catalogs: ["c-alpha"],
      project: { id: "c-alpha", name: "Alpha Project", dir: "C:\\Alpha", rev: 5 },
      teammates: [{ id: "k-1", name: "Alice", kind: "desk", admitted: true, catalog: { title: "Alpha", rev: 5, current: true } }],
      count: 1
    };
    const tB = {
      id: "t-beta",
      connection: "relay",
      folder: "",
      relay: { rt: "0123456789abcdef0123456789abcdef", url: "https://etiuda.dev" },
      leadPrint: "bbbb111122223333",
      catalogs: ["c-beta"],
      project: { id: "c-beta", name: "Beta Project", dir: "C:\\Beta", rev: 2 },
      teammates: [{ id: "k-2", name: "Bob", kind: "desk", admitted: true, catalog: { title: "Beta", rev: 2, current: true } }],
      count: 1
    };
    const P = loadPage({ api: { teams: () => Promise.resolve({ teams: [tA, tB] }), projects: () => Promise.resolve({ root: "C:\\Projects", projects: [{ dir: "C:\\Alpha", name: "Alpha Project", counts: { cards: 10 }, rev: 5 }, { dir: "C:\\Beta", name: "Beta Project", counts: { cards: 20 }, rev: 2 }] }) } });
    P.page.S.screen = "projects";
    P.page.S.projects = [{ dir: "C:\\Alpha", name: "Alpha Project", counts: { cards: 10 }, rev: 5 }, { dir: "C:\\Beta", name: "Beta Project", counts: { cards: 20 }, rev: 2 }];
    P.page.S.teams = [tA, tB];
    P.page.paintProjects();
    const html = P.node("#main").innerHTML;
    // Team tabs present
    const hasTabs = html.includes('class="teams"') && html.includes("Alpha Project") && html.includes("Beta Project");
    return hasTabs;
  });

  // --- Claim 10: a tampered team file isn't believed, with a plant on the verification ---
  await leg("10 a tampered team file isn't believed, with a plant on the verification", async () => {
    if (!Reader || !Reader.readAllTeams) return false;
    const tamperedUd = path.join(SCRATCH, "tampered-ud");
    const tamperedShare = path.join(tamperedUd, "relay", rt1);
    fs.mkdirSync(tamperedShare, { recursive: true });
    // Write tampered team file: take signedTeam1, but tamper with its roster by adding Eve
    const eveDesk = newDesk("Eve");
    const tamperedDoc = JSON.parse(JSON.stringify(signedTeam1));
    tamperedDoc.roster.push({ desk: eveDesk.block, name: "Eve", wrap: "fake-wrap" });
    // Note: sig is NOT recomputed, so the signature does not verify under lead key
    fs.writeFileSync(path.join(tamperedShare, "etiuda-team.json"), JSON.stringify(tamperedDoc, null, 1) + "\n");

    const tamperedTeamsPath = path.join(tamperedUd, "teams.json");
    fs.writeFileSync(tamperedTeamsPath, JSON.stringify({
      format: 1,
      kind: "etiuda-studio-teams",
      teams: {
        [team1Id]: {
          folder: tamperedShare,
          relay: { rt: rt1, url: "https://etiuda.dev" },
          sealed: true,
          file: signedTeam1
        }
      }
    }, null, 1) + "\n");

    // 1. Without plant: tampered file must NOT be believed
    const res = await Reader.readAllTeams({
      userData: tamperedUd,
      teamsFile: tamperedTeamsPath,
      projectsRoot,
      keyFile: leadKeyPath,
      passphrase: PASS,
      teamKeys: teamKeysMap
    });
    if (!res || !Array.isArray(res.teams) || !res.teams.length) return false;
    const t = res.teams[0];
    // Must NOT be marked away (file is present on disk)
    if (t.away) return false;
    // Eve must NOT be in teammates, and roster must not be shown
    if (t.teammates && t.teammates.some((m) => m.name === "Eve")) return false;
    // Must say so: unreadable should be set
    if (!t.unreadable && !t.reason) return false;

    // 2. Plant check: lifting plant:tr-verify makes the tampered file believed. A proof, not a gate.
    if (process.env.ETIUDA_PLANTS === "off") return true;
    /* In a scratch copy of the tree, never in the checkout: a killed run must not leave the verification lifted. */
    const { plantsTree, dropPlantsTree } = await import("./plants-tree.mjs");
    let tree = null, plantLifts = false;
    try {
      tree = plantsTree(ROOT, "team-overview");
      const readerFile = path.join(tree, "src", "team-reader.mjs");
      const text = fs.readFileSync(readerFile, "utf8");
      const nl = text.includes("\r\n") ? "\r\n" : "\n";
      const lines = text.split(nl);
      const plantIdx = lines.findIndex((l) => l.includes("/* plant:tr-verify */"));
      if (plantIdx < 0) return false;

      // Lift the verification by replacing the plant line
      lines[plantIdx] = "        const genuine = JSON.parse(fs.readFileSync(path.join(folder, \"etiuda-team.json\"), \"utf8\")); /* plant:tr-verify */";
      fs.writeFileSync(readerFile, lines.join(nl));

      const code = `
        import { readAllTeams } from ${JSON.stringify(pathToFileURL(readerFile).href + "?t=" + Date.now())};
        const r = await readAllTeams({
          userData: ${JSON.stringify(tamperedUd)},
          teamsFile: ${JSON.stringify(tamperedTeamsPath)},
          projectsRoot: ${JSON.stringify(projectsRoot)},
          keyFile: ${JSON.stringify(leadKeyPath)},
          passphrase: ${JSON.stringify(PASS)},
          teamKeys: ${JSON.stringify(teamKeysMap)}
        });
        const hasEve = r.teams[0] && r.teams[0].teammates && r.teams[0].teammates.some(m => m.name === "Eve");
        process.stdout.write(JSON.stringify({ hasEve }));
      `;
      const child = spawnSync(process.execPath, ["--input-type=module", "-e", code], { encoding: "utf8", timeout: 30000 });
      let childRes = null;
      try { childRes = JSON.parse(child.stdout.trim()); } catch {}
      plantLifts = !!(childRes && childRes.hasEve);
    } finally {
      if (tree) dropPlantsTree(tree, ROOT);
    }
    return plantLifts;
  });

  // --- Claim 11: a publish with the desk's file unchanged reads behind ---
  await leg("11 a publish with the desk's file unchanged reads behind", async () => {
    if (!Reader || !Reader.readAllTeams) return false;
    // Update Harbourlight project.json to rev 15 (simulating a publish)
    // Alice's in-use.ec remains unchanged at rev 14
    const pjPath = path.join(proj1Dir, "project.json");
    const pjOrig = fs.readFileSync(pjPath, "utf8");
    try {
      fs.writeFileSync(pjPath, JSON.stringify({
        displayName: "Harbourlight Insurance",
        folder: share1,
        id: "c-harbour",
        rev: 15,
        draft: { id: "c-harbour", rev: 14 }
      }, null, 1) + "\n");

      const res = await Reader.readAllTeams({
        userData: ud,
        teamsFile: teamsJsonPath,
        projectsRoot,
        keyFile: leadKeyPath,
        passphrase: PASS,
        teamKeys: teamKeysMap
      });
      if (!res || !Array.isArray(res.teams)) return false;
      const t1 = res.teams.find((t) => t.id === team1Id);
      if (!t1) return false;
      const al = t1.teammates.find((m) => m.id === alice.id);
      if (!al || !al.catalog) return false;
      if (al.catalog.rev !== 14) return false;
      // Must read behind: true and current: false
      if (!al.catalog.behind || al.catalog.current) return false;
      return true;
    } finally {
      fs.writeFileSync(pjPath, pjOrig);
    }
  });

  // --- Claim 12: a desk's changed copy isn't foreign ---
  await leg("12 a desk's changed copy isn't foreign", async () => {
    if (!Reader || !Reader.readAllTeams) return false;
    // catalog-use must export classify
    let CatUse = null;
    try { CatUse = await import("../src/catalog-use.mjs"); } catch {}
    if (!CatUse || typeof CatUse.classify !== "function") return false;

    // Desk Alice has a changed copy of c-harbour: same catalog id, rev 14,
    // but a sha256 that does NOT match any archived edition
    const changedDoc = inUseDoc(alice, {
      id: "c-harbour",
      rev: 14,
      title: "Harbourlight Insurance",
      sha256: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    });
    const aliceInUsePath = path.join(share1, "desks", alice.id, "in-use.ec");
    const aliceOrig = fs.readFileSync(aliceInUsePath);
    try {
      writeEc(aliceInUsePath, { id: team1Id, key: team1Key, epoch: 1 }, changedDoc);

      const res = await Reader.readAllTeams({
        userData: ud,
        teamsFile: teamsJsonPath,
        projectsRoot,
        keyFile: leadKeyPath,
        passphrase: PASS,
        teamKeys: teamKeysMap
      });
      if (!res || !Array.isArray(res.teams)) return false;
      const t1 = res.teams.find((t) => t.id === team1Id);
      if (!t1) return false;
      const al = t1.teammates.find((m) => m.id === alice.id);
      if (!al || !al.catalog) return false;
      // Changed copy of this project's catalog MUST NOT be foreign
      if (al.catalog.foreign !== false) return false;
      if (al.catalog.title !== "Harbourlight Insurance") return false;
      if (al.catalog.rev !== 14) return false;
      return true;
    } finally {
      fs.writeFileSync(aliceInUsePath, aliceOrig);
    }
  });

  // --- Claim 13: no key file, or a key on a passphrase, reads without a throw ---
  await leg("13 no key file, or a key on a passphrase, reads without a throw", async () => {
    if (!Reader || !Reader.readAllTeams) return false;
    // 1. Without keyFile
    const resNoKey = await Reader.readAllTeams({
      userData: ud,
      teamsFile: teamsJsonPath,
      projectsRoot,
      keyFile: null,
      teamKeys: teamKeysMap
    });
    if (!resNoKey || !Array.isArray(resNoKey.teams)) return false;

    // 2. With keyFile but without passphrase (key on passphrase)
    const resNoPass = await Reader.readAllTeams({
      userData: ud,
      teamsFile: teamsJsonPath,
      projectsRoot,
      keyFile: leadKeyPath,
      passphrase: "",
      teamKeys: teamKeysMap
    });
    if (!resNoPass || !Array.isArray(resNoPass.teams)) return false;

    // 3. With non-existent keyFile
    const resMissingKey = await Reader.readAllTeams({
      userData: ud,
      teamsFile: teamsJsonPath,
      projectsRoot,
      keyFile: path.join(ud, "non-existent-key.json"),
      teamKeys: teamKeysMap
    });
    if (!resMissingKey || !Array.isArray(resMissingKey.teams)) return false;

    return true;
  });

  // --- Claim 14: an away folder shows its last-known catalog and stamp, said as such ---
  await leg("14 an away folder shows its last-known catalog and stamp, said as such", async () => {
    if (!Reader || !Reader.readAllTeams) return false;
    // First, read when share1 is online to record last-known facts
    const onlineRes = await Reader.readAllTeams({
      userData: ud,
      teamsFile: teamsJsonPath,
      projectsRoot,
      keyFile: leadKeyPath,
      passphrase: PASS,
      teamKeys: teamKeysMap
    });
    const tOnline = onlineRes.teams.find((t) => t.id === team1Id);
    const alOnline = tOnline && tOnline.teammates.find((m) => m.id === alice.id);
    if (!alOnline || !alOnline.catalog || !alOnline.lastHeard) return false;
    const expectedStamp = alOnline.lastHeard;
    const expectedTitle = alOnline.catalog.title;
    const expectedRev = alOnline.catalog.rev;

    // Move share1 away by renaming the directory
    const share1Away = share1 + "-moved-away";
    fs.renameSync(share1, share1Away);
    try {
      const awayRes = await Reader.readAllTeams({
        userData: ud,
        teamsFile: teamsJsonPath,
        projectsRoot,
        keyFile: leadKeyPath,
        passphrase: PASS,
        teamKeys: teamKeysMap
      });
      if (!awayRes || !Array.isArray(awayRes.teams)) return false;
      const t1 = awayRes.teams.find((t) => t.id === team1Id);
      if (!t1) return false;
      // Said as such: team must be marked as away
      if (t1.away !== true) return false;
      const al = t1.teammates.find((m) => m.id === alice.id);
      if (!al) return false;
      // Must show last-known catalog and stamp
      if (!al.catalog || al.catalog.title !== expectedTitle || al.catalog.rev !== expectedRev) return false;
      if (!al.lastHeard || al.lastHeard !== expectedStamp) return false;
      return true;
    } finally {
      if (fs.existsSync(share1Away) && !fs.existsSync(share1)) {
        fs.renameSync(share1Away, share1);
      }
    }
  });

  // --- Claim 15: editionsOf runs once per project per call ---
  await leg("15 editionsOf runs once per project per overview call, not per teammate", async () => {
    if (!Reader || !Reader.readAllTeams) return false;
    const projDir = path.join(projectsRoot, "Harbourlight");
    const archiveDir = path.join(projDir, "archive");
    const edDir = path.join(archiveDir, "2026-11-01-001");
    fs.mkdirSync(edDir, { recursive: true });
    fs.writeFileSync(path.join(edDir, "catalog.json"), JSON.stringify({
      format: 2, id: "c-harbour", rev: 14, title: "Harbourlight Insurance"
    }));

    let archiveReads = 0;
    const origReaddir = fs.readdirSync;
    fs.readdirSync = function (p, opts) {
      if (typeof p === "string" && path.resolve(p) === path.resolve(archiveDir)) {
        archiveReads++;
      }
      return origReaddir.apply(this, arguments);
    };

    try {
      const res = await Reader.readAllTeams({
        userData: ud,
        teamsFile: teamsJsonPath,
        projectsRoot,
        keyFile: leadKeyPath,
        passphrase: PASS,
        teamKeys: teamKeysMap
      });
      if (!res || !Array.isArray(res.teams)) return false;
      return archiveReads === 1;
    } finally {
      fs.readdirSync = origReaddir;
      fs.rmSync(archiveDir, { recursive: true, force: true });
    }
  });

  // --- Claim 16: validly signed team file by another key is not believed where teams.json names lead ---
  await leg("16 a validly signed team file by another key is not believed where teams.json names the lead", async () => {
    if (!Reader || !Reader.readAllTeams) return false;
    const fakeKey = crypto.generateKeyPairSync("ed25519");
    const fakePub = rawPublic(fakeKey.privateKey).toString("hex");
    const fakeUd = path.join(ud, "fake-ud");
    const fakeDir = path.join(fakeUd, "relay", rt1);
    fs.mkdirSync(fakeDir, { recursive: true });

    const fakeTeamDoc = {
      format: 1,
      kind: "etiuda-team",
      id: "t-9988776655443322",
      epoch: 1,
      rev: 1,
      sealed: true,
      exportsSealed: true,
      catalogs: ["c-harbour"],
      channel: { kind: "relay", rt: rt1, url: "https://etiuda.dev" },
      lead: { keyId: "k-fake", public: fakePub },
      roster: []
    };
    const signedFake = await signDocument(fakeTeamDoc, { privateKey: fakeKey.privateKey, keyId: "k-fake" });
    fs.writeFileSync(path.join(fakeDir, "etiuda-team.json"), JSON.stringify(signedFake, null, 1) + "\n");

    const fakeTf = path.join(fakeUd, "teams.json");
    fs.writeFileSync(fakeTf, JSON.stringify({
      format: 1,
      kind: "etiuda-studio-teams",
      teams: {
        ["t-9988776655443322"]: {
          folder: fakeDir,
          relay: { rt: rt1, url: "https://etiuda.dev" },
          sealed: true,
          file: {
            format: 1,
            kind: "etiuda-team",
            id: "t-9988776655443322",
            epoch: 1,
            rev: 1,
            lead: { keyId: leadKey.keyId, public: leadKey.public }
          }
        }
      }
    }, null, 1) + "\n");

    try {
      const res = await Reader.readAllTeams({
        userData: fakeUd,
        teamsFile: fakeTf,
        keyFile: null
      });
      if (!res || !Array.isArray(res.teams) || !res.teams.length) return false;
      const t = res.teams[0];
      return !!(t.unreadable || t.reason);
    } finally {
      fs.rmSync(fakeDir, { recursive: true, force: true });
      fs.rmSync(fakeUd, { recursive: true, force: true });
    }
  });

  await leg("962s5x a team of two catalogs: each teammate's catalog is named and judged by its own project, and project stays beside projects", async () => {
    if (!Reader || !Reader.readAllTeams) return false;
    const teamAt = path.join(share1, "etiuda-team.json"), useAt = path.join(share1, "desks", foreignDesk.id, "in-use.ec");
    const teamWas = fs.readFileSync(teamAt), useWas = fs.readFileSync(useAt), tjWas = fs.readFileSync(teamsJsonPath);
    const proj2Dir = path.join(projectsRoot, "Second-Light");
    try {
      fs.mkdirSync(proj2Dir, { recursive: true });
      fs.writeFileSync(path.join(proj2Dir, "project.json"), JSON.stringify({ displayName: "Second Light", folder: share1, id: "c-second", rev: 3,
        draft: { id: "c-second", rev: 3 } }, null, 1) + "\n");
      const two = JSON.parse(JSON.stringify(team1Doc));
      delete two.sig;
      two.catalogs = ["c-harbour", "c-second"];
      const signedTwo = await signDocument(two, { privateKey: leadUnlocked.privateKey, keyId: leadUnlocked.keyId });
      fs.writeFileSync(teamAt, JSON.stringify(signedTwo, null, 1) + "\n");
      const tj = JSON.parse(tjWas.toString("utf8"));
      if (tj.teams && tj.teams[team1Id]) tj.teams[team1Id].file = signedTwo;
      fs.writeFileSync(teamsJsonPath, JSON.stringify(tj, null, 1) + "\n");
      writeEc(useAt, { id: team1Id, key: team1Key, epoch: 1 }, inUseDoc(foreignDesk, { id: "c-second", rev: 3, title: "Second Light as the desk calls it" }));
      const res = await Reader.readAllTeams({ userData: ud, teamsFile: teamsJsonPath, projectsRoot, keyFile: leadKeyPath, teamKeys: teamKeysMap });
      const t1 = res.teams.find((t) => t.id === team1Id);
      const ch = t1 && t1.teammates.find((m) => m.id === foreignDesk.id);
      const al = t1 && t1.teammates.find((m) => m.id === alice.id);
      const named = !!ch && !!ch.catalog && ch.catalog.title === "Second Light" && ch.catalog.rev === 3 && ch.catalog.foreign === false
        && ch.catalog.current === true;
      const first = !!al && !!al.catalog && al.catalog.title === "Harbourlight Insurance" && al.catalog.rev === 14;
      const both = !!t1 && !!t1.project && t1.project.id === "c-harbour" && Array.isArray(t1.projects)
        && t1.projects.map((p) => p.id).sort().join(",") === "c-harbour,c-second";
      if (!(named && first && both)) process.stderr.write("962s5x " + JSON.stringify({ named, first, both, ch: ch && ch.catalog, projects: t1 && t1.projects }) + "\n");
      return named && first && both;
    } finally {
      fs.writeFileSync(teamAt, teamWas);
      fs.writeFileSync(useAt, useWas);
      fs.writeFileSync(teamsJsonPath, tjWas);
      fs.rmSync(proj2Dir, { recursive: true, force: true });
    }
  });

  /* BOARD 962 STAGE 5, T5: what the cover's third choice and the Teams screen's "Add a catalog to this team" list from. */
  await leg("962t5g the reader marks each team sealed only where teams.json and the team file both say so, and led only where its"
    + " lead is this Studio's key", async () => {
    if (!Reader || !Reader.readAllTeams) return false;
    const tjWas = fs.readFileSync(teamsJsonPath);
    const otherPath = path.join(ud, "other-key.json");
    try {
      const read = async (keyFile) => (await Reader.readAllTeams({ userData: ud, teamsFile: teamsJsonPath, projectsRoot, keyFile, teamKeys: teamKeysMap })).teams;
      const mine = await read(leadKeyPath);
      fs.writeFileSync(otherPath, JSON.stringify(await makeKeyFile({ passphrase: "another-lead-entirely" }), null, 1) + "\n");
      const theirs = await read(otherPath);
      const tj = JSON.parse(tjWas.toString("utf8"));
      tj.teams[team1Id].sealed = false;
      fs.writeFileSync(teamsJsonPath, JSON.stringify(tj, null, 1) + "\n");
      const plain = await read(leadKeyPath);
      const by = (list, id) => list.find((t) => t.id === id) || {};
      const f = { mine: by(mine, team1Id).sealed === true && by(mine, team1Id).led === true && by(mine, team2Id).sealed === true && by(mine, team2Id).led === true,
        theirs: by(theirs, team1Id).led === false && by(theirs, team2Id).led === false,
        plain: by(plain, team1Id).sealed === false && by(plain, team2Id).sealed === true };
      if (!Object.keys(f).every((k) => f[k])) process.stderr.write("962t5g " + JSON.stringify(f) + "\n");
      return Object.keys(f).every((k) => f[k]);
    } finally {
      fs.writeFileSync(teamsJsonPath, tjWas);
    }
  });

  await leg("962t5h a team of two catalogs is named by both on its Teams row, its tab and its map, with a way into each; its row offers"
    + " Add a catalog to this team, listing only this library's catalogs with no team, and the press sends that catalog and the team;"
    + " a Plain team's row offers none", async () => {
    const TID = "t-00000000000000a1", PID = "t-00000000000000b2";
    const two = { id: TID, connection: "relay", folder: "", relay: { rt: "0123456789abcdef0123456789abcdef", url: "https://etiuda.dev" }, sealed: true, led: true, leadPrint: "aaaa111122223333", catalogs: ["c-harbour", "c-second"],
      project: { id: "c-harbour", name: "Harbourlight Insurance", dir: "C:\\Harbour", rev: 14 },
      projects: [{ id: "c-harbour", name: "Harbourlight Insurance", dir: "C:\\Harbour", rev: 14 }, { id: "c-second", name: "Second Light", dir: "C:\\Second", rev: 3 }],
      teammates: [{ id: "k-1", name: "Alice", kind: "desk", admitted: true, catalog: { title: "Second Light", rev: 3, current: true } }], count: 1 };
    const plainTeam = { id: PID, connection: "relay", folder: "", relay: { rt: "0123456789abcdef0123456789abcdef", url: "https://etiuda.dev" }, sealed: false, led: true, leadPrint: "bbbb111122223333", catalogs: ["c-plain"],
      project: { id: "c-plain", name: "Plain Ledger", dir: "C:\\Plain", rev: 1 }, projects: [{ id: "c-plain", name: "Plain Ledger", dir: "C:\\Plain", rev: 1 }],
      teammates: [], count: 0 };
    const lib = [{ dir: "C:\\Harbour", id: "c-harbour", name: "Harbourlight Insurance", counts: { cards: 1 }, rev: 14, folder: "C:\\quay" },
      { dir: "C:\\Second", id: "c-second", name: "Second Light", counts: { cards: 1 }, rev: 3, folder: "C:\\quay" },
      { dir: "C:\\Plain", id: "c-plain", name: "Plain Ledger", counts: { cards: 1 }, rev: 1, folder: "C:\\plain" },
      { dir: "C:\\Loose", id: "c-loose", name: "Loose Leaf", counts: { cards: 1 }, rev: 2, folder: null }];
    const chose = [];
    const P = loadPage({ api: { teams: () => Promise.resolve({ teams: [two, plainTeam] }), projects: () => Promise.resolve({ root: "C:\\Projects", projects: lib }),
      teamChoose: (dir, team) => { chose.push([dir, team]); return Promise.resolve({ error: null, folder: "C:\\quay", team: { id: team }, carried: true, relay: false }); } } });
    /* The tour offered already, so a whole paint after the press does not reach for the tour's module, which the stand-in cannot load. */
    Object.assign(P.page.S, { screen: "projects", home: "team", projects: lib, teams: [two, plainTeam], teamTab: 0, host: { tour: { offered: true } } });
    P.page.paintTeams();
    const rowTwo = P.node("#main").innerHTML;
    P.page.S.teamTab = 1;
    P.page.paintTeams();
    const rowPlain = P.node("#main").innerHTML;
    P.page.S.teamTab = 0;
    P.page.paintTeams();
    const named = /<h3>[^<]*Harbourlight Insurance[^<]*Second Light/.test(rowTwo);
    const ways = (rowTwo.match(/data-act="open"/g) || []).length === 2;
    const offered = new RegExp('data-act="team-add-catalog" data-team="' + TID + '"').test(rowTwo) && !/team-add-catalog/.test(rowPlain);
    P.page.ACTS["team-add-catalog"]({ getAttribute: (k) => (k === "data-team" ? TID : null) });
    const listed = P.node("#main").innerHTML;
    const picks = (listed.match(/data-act="team-add-pick" data-dir="[^"]*"/g) || []).map((m) => m.replace(/.*data-dir="|"$/g, ""));
    const onlyLoose = picks.length === 1 && picks[0] === "C:\\Loose" && /Loose Leaf/.test(listed);
    await P.page.ACTS["team-add-pick"]({ getAttribute: (k) => (k === "data-dir" ? "C:\\Loose" : k === "data-team" ? TID : null) });
    const pressed = chose.length === 1 && chose[0][0] === "C:\\Loose" && chose[0][1] === TID;
    Object.assign(P.page.S, { screen: "projects", home: "overview", teams: [two, plainTeam], teamTab: 0 });
    P.page.paintProjects();
    const lib2 = P.node("#main").innerHTML;
    const tabAndMap = /data-act="team-tab"[^>]*>.*?Harbourlight Insurance[^<]*Second Light/.test(lib2)
      && /class="nm">Harbourlight Insurance[^<]*Second Light</.test(lib2);
    const f = { named, ways, offered, onlyLoose, pressed, tabAndMap };
    if (!Object.keys(f).every((k) => f[k])) process.stderr.write("962t5h " + JSON.stringify(Object.assign(f, { picks, chose })) + "\n");
    return Object.keys(f).every((k) => f[k]);
  });

  await leg("Finding 11: empty Library says There is no catalog in the Library yet., while Library with teams says Every catalog in the Library has a team already.", async () => {
    const TID = "t-00000000000000a1";
    const team = { id: TID, connection: "relay", folder: "", relay: { rt: "0123456789abcdef0123456789abcdef", url: "https://etiuda.dev" }, sealed: true, led: true, leadPrint: "aaaa111122223333", catalogs: ["c-harbour"],
      project: { id: "c-harbour", name: "Harbourlight Insurance", dir: "C:\\Harbour", rev: 14 },
      projects: [{ id: "c-harbour", name: "Harbourlight Insurance", dir: "C:\\Harbour", rev: 14 }],
      teammates: [], count: 0 };
    const P = loadPage({ api: { teams: () => Promise.resolve({ teams: [team] }), projects: () => Promise.resolve({ root: "C:\\Projects", projects: [] }) } });
    Object.assign(P.page.S, { screen: "projects", home: "team", projects: [], teams: [team], teamTab: 0, host: { tour: { offered: true } } });
    P.page.paintTeams();
    P.page.ACTS["team-add-catalog"]({ getAttribute: (k) => (k === "data-team" ? TID : null) });
    const emptyLibHtml = P.node("#main").innerHTML;
    const emptyLibSaid = /There is no catalog in the Library yet\./.test(emptyLibHtml);

    // Now test with catalogs that already have teams
    const fullLib = [{ dir: "C:\\Harbour", id: "c-harbour", name: "Harbourlight Insurance", counts: { cards: 1 }, rev: 14, folder: "C:\\quay" }];
    P.page.S.projects = fullLib;
    P.page.paintTeams();
    const fullLibHtml = P.node("#main").innerHTML;
    const fullLibSaid = /Every catalog in the Library has a team already\./.test(fullLibHtml);

    return emptyLibSaid && fullLibSaid;
  });

  // --- Claim 17: Followed row in Settings, Teams and covers in both languages ---
  await leg("17 followed row in Settings, Teams and covers in both languages", async () => {
    const unesc = (h) => String(h).replace(/&#39;/g, "'");

    // 17.1 When not following
    const P = loadPage({ api: { teams: () => Promise.resolve({ teams: [] }), projects: () => Promise.resolve({ root: "C:\\Projects", projects: [] }), followState: () => Promise.resolve({ follow: null }) } });
    P.page.S.screen = "settings";
    P.page.S.sx = { sec: "teams", q: "" };
    P.page.S.follow = null;
    P.node("#main").innerHTML = P.page.settingsPageHtml();
    const htmlEn = unesc(P.node("#main").innerHTML);
    const hasRowEn = htmlEn.includes("The team this Studio is on") && htmlEn.includes("Join a team as a teammate");

    const Pl = loadPage({ uiLang: "pl", api: { teams: () => Promise.resolve({ teams: [] }), projects: () => Promise.resolve({ root: "C:\\Projects", projects: [] }), followState: () => Promise.resolve({ follow: null }) } });
    Pl.page.S.screen = "settings";
    Pl.page.S.sx = { sec: "teams", q: "" };
    Pl.page.S.follow = null;
    Pl.node("#main").innerHTML = Pl.page.settingsPageHtml();
    const htmlPl = unesc(Pl.node("#main").innerHTML);
    const hasRowPl = htmlPl.includes("Zespół, którego członkiem jest to Studio") && htmlPl.includes("Dołącz do zespołu jako członek");

    // 17.2 Joining cover in both languages
    P.page.S.cover = "follow-join";
    P.page.paintCoverOnly();
    const covEn = unesc(P.node("#dlg").innerHTML);
    const covEnOk = covEn.includes("Join a team as a teammate") && covEn.includes("The invitation from the team's lead")
      && !covEn.includes("Check code") && covEn.includes("Ask to join");

    Pl.page.S.cover = "follow-join";
    Pl.page.paintCoverOnly();
    const covPl = unesc(Pl.node("#dlg").innerHTML);
    const covPlOk = covPl.includes("Dołącz do zespołu jako członek") && covPl.includes("Zaproszenie od lidera zespołu")
      && !covPl.includes("Kod kontrolny") && covPl.includes("Poproś o dołączenie");

    // 17.3 Followed row when following with various states
    P.page.S.cover = null;
    P.page.S.follow = {
      team: "t-1122334455667788", channel: "relay", leadName: "Ada", state: "joining",
      catalogs: [{ catalog: "Harbour lamps", rev: 2 }]
    };
    P.node("#main").innerHTML = P.page.settingsPageHtml();
    const joinEn = unesc(P.node("#main").innerHTML);
    const joinEnOk = joinEn.includes("Led by Ada") && joinEn.includes("the Etiuda relay")
      && joinEn.includes("Waiting for the team's lead to let this Studio in")
      && (joinEn.includes("Harbour lamps, rev 2") || joinEn.includes("Harbour lamps, rev\u00a02"))
      && joinEn.includes("Make a linked copy")
      && joinEn.includes("Leave the team");

    Pl.page.S.cover = null;
    Pl.page.S.follow = {
      team: "t-1122334455667788", channel: "relay", leadName: "Ada", state: "joining",
      catalogs: [{ catalog: "Harbour lamps", rev: 2 }]
    };
    Pl.node("#main").innerHTML = Pl.page.settingsPageHtml();
    const joinPl = unesc(Pl.node("#main").innerHTML);
    const joinPlOk = joinPl.includes("Prowadzi: Ada") && joinPl.includes("przekaźnik Etiudy")
      && joinPl.includes("Oczekiwanie na przyjęcie przez lidera zespołu")
      && (joinPl.includes("Harbour lamps, wer. 2") || joinPl.includes("Harbour lamps, wer.\u00a02"))
      && joinPl.includes("Utwórz połączoną kopię") && joinPl.includes("Opuść zespół");

    // 17.4 Not reached and removed states
    P.page.S.follow.state = "not-reached";
    P.node("#main").innerHTML = P.page.settingsPageHtml();
    const nrEn = unesc(P.node("#main").innerHTML).includes("Out of reach from here");
    Pl.page.S.follow.state = "not-reached";
    Pl.node("#main").innerHTML = Pl.page.settingsPageHtml();
    const nrPl = unesc(Pl.node("#main").innerHTML).includes("Poza zasięgiem");

    P.page.S.follow.state = "removed";
    P.node("#main").innerHTML = P.page.settingsPageHtml();
    const remEn = unesc(P.node("#main").innerHTML).includes("This Studio is no longer on the team.")
      && unesc(P.node("#main").innerHTML).includes("Catalogs made from the team's editions stay as they are.");
    Pl.page.S.follow.state = "removed";
    Pl.node("#main").innerHTML = Pl.page.settingsPageHtml();
    const remPl = unesc(Pl.node("#main").innerHTML).includes("To Studio nie jest już członkiem zespołu.")
      && unesc(Pl.node("#main").innerHTML).includes("Katalogi utworzone z wydań zespołu zostają bez zmian.");

    // 17.5 Leave confirmation in both languages
    P.page.S.cover = "follow-leave";
    P.page.paintCoverOnly();
    const lcovEn = unesc(P.node("#dlg").innerHTML).includes("Leave the team")
      && unesc(P.node("#dlg").innerHTML).includes("Catalogs made from the team's editions stay as they are.");

    Pl.page.S.cover = "follow-leave";
    Pl.page.paintCoverOnly();
    const lcovPl = unesc(Pl.node("#dlg").innerHTML).includes("Opuść zespół")
      && unesc(Pl.node("#dlg").innerHTML).includes("Katalogi utworzone z wydań zespołu zostają bez zmian.");

    // 17.6 Catalog details linked to followed team out of reach
    const Pdet = loadPage({ api: { teams: () => Promise.resolve({ teams: [] }), projects: () => Promise.resolve({ root: "C:\\Projects", projects: [] }) } });
    Pdet.page.S.screen = "project";
    Pdet.page.S.section = "settings";
    Pdet.page.S.open = {
      dir: "C:\\Projects\\Copy",
      project: { name: "Copy", rev: 0, tags: [] },
      langs: { rows: [] },
      editions: [],
      linked: { from: "cat-orig", team: "t-central", found: false, name: "Original" }
    };
    Pdet.page.paintMain();
    const detEn = unesc(Pdet.node("#main").innerHTML).includes("the team that holds the original is out of reach from here, so nothing was brought")
      && unesc(Pdet.node("#main").innerHTML).includes("Bring up to the original");

    const PdetPl = loadPage({ uiLang: "pl", api: { teams: () => Promise.resolve({ teams: [] }), projects: () => Promise.resolve({ root: "C:\\Projects", projects: [] }) } });
    PdetPl.page.S.screen = "project";
    PdetPl.page.S.section = "settings";
    PdetPl.page.S.open = {
      dir: "C:\\Projects\\Copy",
      project: { name: "Copy", rev: 0, tags: [] },
      langs: { rows: [] },
      editions: [],
      linked: { from: "cat-orig", team: "t-central", found: false, name: "Original" }
    };
    PdetPl.page.paintMain();
    const detPl = unesc(PdetPl.node("#main").innerHTML).includes("zespół, w którym jest oryginał, jest stąd nieosiągalny, więc nic nie zostało pobrane")
      && unesc(PdetPl.node("#main").innerHTML).includes("Pobierz zmiany z oryginału");

    return hasRowEn && hasRowPl && covEnOk && covPlOk && joinEnOk && joinPlOk && nrEn && nrPl && remEn && remPl && lcovEn && lcovPl && detEn && detPl;
  });

  // --- Claim 18: studio:base-take end to end ---
  await leg("18 studio:base-take end to end opens project with new id and rev 0, writes in-use.ec with id, rev, sha", async () => {
    const o = await baseTakeOutcome(path.join(ROOT, "shell", "main.js"), "take-e2e");
    return o.check;
  });

  /* Claim 18 drives a take that already existed, so the guard is proved by lifting it. The lift is
     inUseUp not writing the member's in-use file. ETIUDA_PLANTS=off skips it, as claim 10's plant does. */
  await leg("18p lifting inUseUp's write in a scratch copy makes claim 18 fail", async () => {
    if (process.env.ETIUDA_PLANTS === "off") return true;
    const mark = "/* plant:to18-inuse */";
    const livePath = path.join(ROOT, "shell", "main.js");
    const live = fs.readFileSync(livePath, "utf8");
    if (!live.includes(mark)) throw new Error("plant marker absent on inUseUp");
    const { plantsTree, dropPlantsTree } = await import("./plants-tree.mjs");
    let tree = null;
    try {
      tree = plantsTree(ROOT, "team-overview-18");
      const mainFile = path.join(tree, "shell", "main.js");
      const text = fs.readFileSync(mainFile, "utf8");
      const nl = text.includes("\r\n") ? "\r\n" : "\n";
      const lines = text.split(nl);
      const idx = lines.findIndex((l) => l.includes(mark));
      if (idx < 0) throw new Error("plant marker absent in the scratch copy");
      const pad = lines[idx].match(/^\s*/)[0];
      lines[idx] = pad + "void catalog; " + mark;
      fs.writeFileSync(mainFile, lines.join(nl));
      if (fs.readFileSync(livePath, "utf8") !== live) throw new Error("the checkout's shell changed");
      const lifted = fs.readFileSync(mainFile, "utf8").split(nl)[idx];
      if (lifted.includes("writeInUse")) throw new Error("the scratch copy still writes in-use");
      const o = await baseTakeOutcome(mainFile, "take-e2e-plant");
      if (o.check !== false || !o.newIdOk || !o.rev0Ok || !o.inUseStripped || o.inUseWritten !== false) {
        throw new Error("claim 18 did not fail on the lifted write " + JSON.stringify({
          check: o.check, newIdOk: o.newIdOk, rev0Ok: o.rev0Ok, inUseStripped: o.inUseStripped, inUseWritten: o.inUseWritten,
        }));
      }
      return fs.readFileSync(livePath, "utf8") === live;
    } finally {
      if (tree) dropPlantsTree(tree, ROOT);
    }
  });

  /* A refused Recycle Bin says the copy stayed. A move, and a leave with no mirror, say it went. */
  await leg("19 a leave whose Recycle Bin refuses says the copy stayed and returns trashed false; a move says it went", async () => {
    const refused = await followedLab("leave-refused");
    const bad = await driveLeave({
      ud: refused.ud, vault: refused.vault,
      trash: () => Promise.reject(new Error("the Recycle Bin refused")),
    });
    const keptEn = await toastOf(bad.res, "en");
    const keptPl = await toastOf(bad.res, "pl");
    const lineOf = (said) => said === KEPT_EN || said === KEPT_PL ? "kept" : said === LEFT_EN || said === LEFT_PL ? "success" : "other";
    if (keptEn !== KEPT_EN || keptPl !== KEPT_PL || !bad.res || bad.res.trashed !== false) {
      throw new Error("refused trashed=" + String(bad.res && bad.res.trashed) + " en=" + lineOf(keptEn) + " pl=" + lineOf(keptPl));
    }
    if (!(bad.res.error == null && bad.calls.length === 1 && samePath(bad.calls[0], refused.mirror)
      && fs.existsSync(path.join(refused.mirror, "kept.txt")))) {
      throw new Error("refused call error=" + String(bad.res.error) + " calls=" + bad.calls.length);
    }

    const moved = await followedLab("leave-moved");
    const good = await driveLeave({
      ud: moved.ud, vault: moved.vault,
      trash: () => Promise.resolve(),
    });
    const leftEn = await toastOf(good.res, "en");
    const leftPl = await toastOf(good.res, "pl");
    if (leftEn !== LEFT_EN || leftPl !== LEFT_PL || !good.res || good.res.trashed !== true) {
      throw new Error("moved trashed=" + String(good.res && good.res.trashed) + " en=" + (leftEn === LEFT_EN ? "success" : "other") + " pl=" + (leftPl === LEFT_PL ? "success" : "other"));
    }
    if (!(good.res.error == null && good.calls.length === 1 && samePath(good.calls[0], moved.mirror))) {
      throw new Error("moved call error=" + String(good.res && good.res.error) + " calls=" + good.calls.length);
    }

    const noneUd = path.join(SCRATCH, "leave-none", "ud");
    fs.mkdirSync(noneUd, { recursive: true });
    const { makeVault } = await import("./relay-lab.mjs");
    const none = await driveLeave({
      ud: noneUd, vault: makeVault(),
      trash: () => Promise.reject(new Error("should not be asked")),
    });
    const noneEn = await toastOf(none.res, "en");
    if (!none.res || none.res.trashed !== true || none.res.left !== false || none.calls.length !== 0 || noneEn !== LEFT_EN) {
      throw new Error("no-mirror trashed=" + String(none.res && none.res.trashed) + " left=" + String(none.res && none.res.left) + " calls=" + none.calls.length + " en=" + (noneEn === LEFT_EN ? "success" : "other"));
    }
    return true;
  });

  await leg("962s6u3 on the Teams screen: both presses on each listed catalog of a sealed team; the orphan shown by its title or id;"
    + " an empty team; the move cover's heading, three counts and Review first; a refusal shows its sentence; the two toasts; in both languages", async () => {
    const TID1 = "t-00000000000000a1", TID2 = "t-00000000000000a2", TID_EMPTY = "t-00000000000000a3", PID = "t-00000000000000b2";
    const left = [], moved = [];
    let leaveResult = { error: null, team: { id: TID1 }, removed: 1, relay: false };
    let moveResult = { error: null, team: { id: TID2 }, carried: true, relay: false };

    const two = {
      id: TID1, connection: "relay", folder: "", relay: { rt: "0123456789abcdef0123456789abcdef", url: "https://etiuda.dev" }, sealed: true, led: true, leadPrint: "aaaa111122223333",
      catalogs: ["c-harbour", "c-second", "c-orphan-title", "c-orphan-notitle"],
      project: { id: "c-harbour", name: "Harbourlight Insurance", dir: "C:\\Harbour", rev: 14 },
      projects: [
        { id: "c-harbour", name: "Harbourlight Insurance", dir: "C:\\Harbour", rev: 14 },
        { id: "c-second", name: "Second Light", dir: "C:\\Second", rev: 3 }
      ],
      teammates: [
        { id: "k-1", name: "Alice", kind: "desk", admitted: true, catalog: { title: "Second Light", rev: 3, current: true } },
        { id: "k-2", name: "Bob", kind: "desk", admitted: true, catalog: { title: "Orphan Book", rev: 1, current: true } }
      ],
      count: 2
    };

    const targetTeam = {
      id: TID2, connection: "relay", folder: "", relay: { rt: "rt-2", url: "etiuda.dev" }, sealed: true, led: true,
      leadPrint: "cccc111122223333", catalogs: ["c-other"],
      project: { id: "c-other", name: "Other Catalog", dir: "C:\\Other", rev: 1 },
      projects: [{ id: "c-other", name: "Other Catalog", dir: "C:\\Other", rev: 1 }],
      teammates: [
        { id: "k-3", name: "Charlie", kind: "desk", admitted: true },
        { id: "k-4", name: "Dana", kind: "desk", admitted: true }
      ],
      count: 2
    };

    const emptyTeam = {
      id: TID_EMPTY, connection: "relay", folder: "", relay: { rt: "0123456789abcdef0123456789abcdef", url: "https://etiuda.dev" }, sealed: true, led: true, leadPrint: "dddd111122223333",
      catalogs: [], project: null, projects: [], teammates: [], count: 0
    };

    const plainTeam = {
      id: PID, connection: "relay", folder: "", relay: { rt: "0123456789abcdef0123456789abcdef", url: "https://etiuda.dev" }, sealed: false, led: true, leadPrint: "bbbb111122223333",
      catalogs: ["c-plain"], project: { id: "c-plain", name: "Plain Ledger", dir: "C:\\Plain", rev: 1 },
      projects: [{ id: "c-plain", name: "Plain Ledger", dir: "C:\\Plain", rev: 1 }], teammates: [], count: 0
    };

    const lib = [
      { dir: "C:\\Harbour", id: "c-harbour", name: "Harbourlight Insurance", counts: { cards: 1 }, rev: 14, folder: "C:\\quay" },
      { dir: "C:\\Second", id: "c-second", name: "Second Light", counts: { cards: 1 }, rev: 3, folder: "C:\\quay" },
      { dir: "C:\\Other", id: "c-other", name: "Other Catalog", counts: { cards: 1 }, rev: 1, folder: "" },
      { dir: "C:\\Plain", id: "c-plain", name: "Plain Ledger", counts: { cards: 1 }, rev: 1, folder: "C:\\plain" }
    ];

    const proposalsForSecond = {
      inbox: "C:\\Second\\inbox",
      proposals: [
        { file: "C:\\Second\\inbox\\alice.ec", ok: true, pending: 2, desk: { id: "k-1", name: "Alice" } }
      ]
    };

    const makePage = (uiLang = "en") => loadPage({
      uiLang,
      api: {
        teams: () => Promise.resolve({ teams: [two, targetTeam, emptyTeam, plainTeam] }),
        projects: () => Promise.resolve({ root: "C:\\Projects", projects: lib }),
        open: (dir) => Promise.resolve({
          dir, name: "Second Light", id: "c-second", editions: [],
          counts: { cards: 1, intents: 0, cats: 0, rv: 0 }, lint: { errors: 0, warnings: 0, rows: [] },
          draft: { langs: [{ code: "en" }], cards: [], rules: [] },
          langs: { rows: [{ code: "en", name: "English" }], commentLang: "en" },
          project: { id: "c-second", title: "Second Light", rev: 3, folder: "C:\\quay" }
        }),
        proposals: (dir) => Promise.resolve(dir === "C:\\Second" ? proposalsForSecond : { proposals: [] }),
        teamLeave: (dir, teamId, catalog) => {
          left.push([dir, teamId, catalog]);
          return Promise.resolve(leaveResult);
        },
        teamMoveCatalog: (dir, toTeam) => {
          moved.push([dir, toTeam]);
          return Promise.resolve(moveResult);
        }
      }
    });

    // 1. English
    const P = makePage();
    Object.assign(P.page.S, {
      screen: "projects", home: "team", projects: lib, teams: [two, targetTeam, emptyTeam, plainTeam],
      teamTab: 0, host: { tour: { offered: true } }
    });
    P.page.paintTeams();
    const rowTwoEn = P.node("#main").innerHTML;
    P.page.S.teamTab = 2; P.page.paintTeams();
    const rowEmptyEn = P.node("#main").innerHTML;
    P.page.S.teamTab = 3; P.page.paintTeams();
    const rowPlainEn = P.node("#main").innerHTML;
    P.page.S.teamTab = 0; P.page.paintTeams();

    const bothPresses = /data-act="team-catalog-leave"[^>]*data-dir="C:\\Second"/.test(rowTwoEn)
      && /data-act="team-catalog-move"[^>]*data-dir="C:\\Second"/.test(rowTwoEn)
      && /Take off this team/.test(rowTwoEn) && /Move to another team…/.test(rowTwoEn);

    const orphanTitle = /Orphan Book, not among this Studio(&#39;|')s catalogs/.test(rowTwoEn)
      && /data-act="team-catalog-leave"[^>]*data-team="t-00000000000000a1"[^>]*data-cat="c-orphan-title"/.test(rowTwoEn);

    const orphanNoTitle = /catalog c-orphan-notitle, not among this Studio(&#39;|')s catalogs/.test(rowTwoEn)
      && /data-act="team-catalog-leave"[^>]*data-team="t-00000000000000a1"[^>]*data-cat="c-orphan-notitle"/.test(rowTwoEn);

    const emptyTeamSaid = /This team holds no catalog\./.test(rowEmptyEn);
    const plainOffersNone = !/team-catalog-leave/.test(rowPlainEn) && !/team-catalog-move/.test(rowPlainEn);

    // Press Take off on orphan through the cover
    await P.page.ACTS["team-catalog-leave"]({
      getAttribute: (k) => (k === "data-dir" ? "" : k === "data-team" ? TID1 : k === "data-cat" ? "c-orphan-title" : null)
    });
    await P.page.ACTS["do-team-catalog-leave"]();
    const leftOrphan = left.length === 1 && left[0][0] === "" && left[0][1] === TID1 && left[0][2] === "c-orphan-title";
    const toastLeave = (P.node("#said") && P.node("#said").textContent.indexOf("The catalog is off the team, and it publishes nowhere until it is given a team.") >= 0)
      || /The catalog is off the team, and it publishes nowhere until it is given a team\./.test(P.node("#main").innerHTML);

    // Open Move cover for Second Light
    await P.page.ACTS["team-catalog-move"]({
      getAttribute: (k) => (k === "data-dir" ? "C:\\Second" : k === "data-team" ? TID1 : k === "data-cat" ? "c-second" : null)
    });
    const dlgEn = P.node("#dlg").innerHTML;
    const coverHeading = /Move Second Light to another team/.test(dlgEn);
    const count1 = /Teammates on Harbourlight Insurance, Second Light working in this catalog now, each keeping the edition it has: 1\./.test(dlgEn.replace(/\u00a0/g, " "));
    const count2 = /Teammates on Harbourlight Insurance, Second Light with changes to it waiting in review, which are withdrawn once it leaves: 1\./.test(dlgEn.replace(/\u00a0/g, " "));
    const reviewFirst = /data-act="move-review-first"/.test(dlgEn) && /Review first/.test(dlgEn);
    const count3 = /Teammates on Other Catalog who will receive it: 2\./.test(dlgEn.replace(/\u00a0/g, " "));

    // Press Review first
    await P.page.ACTS["move-review-first"]();
    const reviewed = P.page.S.section === "proposals" && P.page.S.cover === null;

    // Reopen move cover and test refusal then success
    P.page.S.screen = "projects"; P.page.S.home = "team"; P.page.S.teamTab = 0;
    await P.page.ACTS["team-catalog-move"]({
      getAttribute: (k) => (k === "data-dir" ? "C:\\Second" : k === "data-team" ? TID1 : k === "data-cat" ? "c-second" : null)
    });
    const REFUSAL_MSG = "This catalog is on that team already, so it was not moved. Nothing was changed.";
    moveResult = { error: REFUSAL_MSG };
    await P.page.ACTS["do-team-move-catalog"]();
    const dlgRefused = P.node("#dlg").innerHTML;
    const refusalShown = P.page.S.cover === "team-move" && dlgRefused.indexOf(REFUSAL_MSG) >= 0;

    // Successful move
    moveResult = { error: null, team: { id: TID2 }, carried: true, relay: true };
    await P.page.ACTS["do-team-move-catalog"]();
    const movedOk = moved.length >= 1 && moved[moved.length - 1][0] === "C:\\Second" && moved[moved.length - 1][1] === TID2
      && P.page.S.cover === null;
    const toastMove = (P.node("#said") && P.node("#said").textContent.indexOf("The catalog is on Other Catalog now.") >= 0)
      || /The catalog is on Other Catalog now\./.test(P.node("#main").innerHTML);

    // 2. Polish
    const P_PL = makePage("pl");
    P_PL.sandbox.STUDIO_T.force("pl");
    Object.assign(P_PL.page.S, {
      screen: "projects", home: "team", projects: lib, teams: [two, targetTeam, emptyTeam, plainTeam],
      teamTab: 0, host: { tour: { offered: true } }
    });
    P_PL.page.paintTeams();
    const rowTwoPl = P_PL.node("#main").innerHTML;
    P_PL.page.S.teamTab = 2; P_PL.page.paintTeams();
    const rowEmptyPl = P_PL.node("#main").innerHTML;
    P_PL.page.S.teamTab = 0; P_PL.page.paintTeams();

    const pressesPl = /Odłącz od tego zespołu/.test(rowTwoPl) && /Przenieś do innego zespołu…/.test(rowTwoPl);
    const orphanTitlePl = /Orphan Book, poza katalogami tego Studia/.test(rowTwoPl);
    const orphanNoTitlePl = /katalog c-orphan-notitle, poza katalogami tego Studia/.test(rowTwoPl);
    const emptyTeamPl = /Ten zespół nie ma żadnego katalogu\./.test(rowEmptyPl);

    await P_PL.page.ACTS["team-catalog-move"]({
      getAttribute: (k) => (k === "data-dir" ? "C:\\Second" : k === "data-team" ? TID1 : k === "data-cat" ? "c-second" : null)
    });
    const dlgPl = P_PL.node("#dlg").innerHTML;
    const coverHeadingPl = /Przeniesienie katalogu Second Light do innego zespołu/.test(dlgPl);
    const count1Pl = /Członkowie zespołu Harbourlight Insurance, Second Light, którzy teraz pracują w tym katalogu i zachowają swoje wydanie: 1\./.test(dlgPl.replace(/\u00a0/g, " "));
    const count2Pl = /Członkowie zespołu Harbourlight Insurance, Second Light ze zmianami czekającymi na przegląd, które zostaną wycofane, gdy katalog odejdzie: 1\./.test(dlgPl.replace(/\u00a0/g, " "));
    const reviewFirstPl = /Najpierw przegląd/.test(dlgPl);
    const count3Pl = /Członkowie zespołu Other Catalog, do których trafi: 2\./.test(dlgPl.replace(/\u00a0/g, " "));
    const moveBtnPl = /Przenieś do tego zespołu/.test(dlgPl);

    const f = {
      bothPresses, orphanTitle, orphanNoTitle, emptyTeamSaid, plainOffersNone, leftOrphan, toastLeave,
      coverHeading, count1, count2, reviewFirst, count3, reviewed, refusalShown, movedOk, toastMove,
      pressesPl, orphanTitlePl, orphanNoTitlePl, emptyTeamPl, coverHeadingPl, count1Pl, count2Pl, reviewFirstPl, count3Pl, moveBtnPl
    };
    if (!Object.keys(f).every((k) => f[k])) process.stderr.write("962s6u3 " + JSON.stringify(f) + "\n");
    return Object.keys(f).every((k) => f[k]);
  });

  await leg("take-off cover: the row's press opens the cover and calls nothing; the cover shows the heading and both lines with the title and team filled in, in English and in Polish; Cancel and Escape close it and call nothing; the cover's press calls teamLeave once with the same arguments the row's press used to; the orphan row does the same", async () => {
    const TID1 = "t-00000000000000a1";
    const left = [];
    let leaveResult = { error: null, team: { id: TID1 }, removed: 1, relay: false };

    const two = {
      id: TID1, connection: "relay", folder: "", relay: { rt: "0123456789abcdef0123456789abcdef", url: "https://etiuda.dev" }, sealed: true, led: true, leadPrint: "aaaa111122223333",
      catalogs: ["c-harbour", "c-second", "c-orphan-title", "c-orphan-notitle"],
      project: { id: "c-harbour", name: "Harbourlight Insurance", dir: "C:\\Harbour", rev: 14 },
      projects: [
        { id: "c-harbour", name: "Harbourlight Insurance", dir: "C:\\Harbour", rev: 14 },
        { id: "c-second", name: "Second Light", dir: "C:\\Second", rev: 3 }
      ],
      teammates: [
        { id: "k-1", name: "Alice", kind: "desk", admitted: true, catalog: { title: "Second Light", rev: 3, current: true } },
        { id: "k-2", name: "Bob", kind: "desk", admitted: true, catalog: { title: "Orphan Book", rev: 1, current: true } }
      ],
      count: 2
    };

    const lib = [
      { dir: "C:\\Harbour", id: "c-harbour", name: "Harbourlight Insurance", counts: { cards: 1 }, rev: 14, folder: "C:\\quay" },
      { dir: "C:\\Second", id: "c-second", name: "Second Light", counts: { cards: 1 }, rev: 3, folder: "C:\\quay" }
    ];

    const makePage = (uiLang = "en") => loadPage({
      uiLang,
      api: {
        teams: () => Promise.resolve({ teams: [two] }),
        projects: () => Promise.resolve({ root: "C:\\Projects", projects: lib }),
        teamLeave: (dir, teamId, catalog) => {
          left.push([dir, teamId, catalog]);
          return Promise.resolve(leaveResult);
        }
      }
    });

    const sendEscape = (p) => {
      for (const h of p.doc.heard) {
        if (h.type === "keydown") h.fn({ key: "Escape" });
      }
    };

    // 1. English
    const P = makePage();
    Object.assign(P.page.S, {
      screen: "projects", home: "team", projects: lib, teams: [two], teamTab: 0, host: { tour: { offered: true } }
    });
    P.page.paintTeams();

    // 1a. Normal catalog row press opens cover and calls nothing
    await P.page.ACTS["team-catalog-leave"]({
      getAttribute: (k) => (k === "data-dir" ? "C:\\Second" : k === "data-team" ? TID1 : k === "data-cat" ? "c-second" : null)
    });
    const coverOpenEn = P.page.S.cover === "team-leave" && left.length === 0;
    const dlgEn = P.node("#dlg").innerHTML.replace(/&#39;/g, "'");
    const headingEn = /Take Second Light off Harbourlight Insurance, Second Light\?/.test(dlgEn);
    const line1En = /Its editions leave the team's place, so the catalog leaves the Library on every teammate's desk and no new edition of it reaches them\./.test(dlgEn);
    const line2En = /Adding it to Harbourlight Insurance, Second Light again and publishing brings it back\./.test(dlgEn);
    const hasCancelEn = /data-act="cover-close"/.test(dlgEn) && /Cancel/.test(dlgEn);
    const hasPressEn = /data-act="do-team-catalog-leave"/.test(dlgEn) && /Take off this team/.test(dlgEn);

    // 1b. Cancel closes cover and calls nothing
    P.page.ACTS["cover-close"]();
    const cancelClosedEn = P.page.S.cover === null && left.length === 0;

    // 1c. Escape closes cover and calls nothing
    await P.page.ACTS["team-catalog-leave"]({
      getAttribute: (k) => (k === "data-dir" ? "C:\\Second" : k === "data-team" ? TID1 : k === "data-cat" ? "c-second" : null)
    });
    sendEscape(P);
    const escClosedEn = P.page.S.cover === null && left.length === 0;

    // 1d. Cover press calls teamLeave once with the same arguments
    await P.page.ACTS["team-catalog-leave"]({
      getAttribute: (k) => (k === "data-dir" ? "C:\\Second" : k === "data-team" ? TID1 : k === "data-cat" ? "c-second" : null)
    });
    await P.page.ACTS["do-team-catalog-leave"]();
    const calledOnceEn = left.length === 1
      && left[0][0] === "C:\\Second" && left[0][1] === TID1 && left[0][2] === "c-second"
      && P.page.S.cover === null;

    // 1e. Orphan row does the same (title and no-title)
    left.length = 0;
    await P.page.ACTS["team-catalog-leave"]({
      getAttribute: (k) => (k === "data-dir" ? "" : k === "data-team" ? TID1 : k === "data-cat" ? "c-orphan-title" : null)
    });
    const orphanCoverOpenEn = P.page.S.cover === "team-leave" && left.length === 0;
    const dlgOrphanEn = P.node("#dlg").innerHTML.replace(/&#39;/g, "'");
    const orphanHeadingEn = /Take Orphan Book off Harbourlight Insurance, Second Light\?/.test(dlgOrphanEn);
    const orphanLine1En = /Its editions leave the team's place, so the catalog leaves the Library on every teammate's desk and no new edition of it reaches them\./.test(dlgOrphanEn);
    const orphanLine2En = /Adding it to Harbourlight Insurance, Second Light again and publishing brings it back\./.test(dlgOrphanEn);

    // Cancel on orphan
    P.page.ACTS["cover-close"]();
    const orphanCancelClosedEn = P.page.S.cover === null && left.length === 0;

    // Escape on orphan
    await P.page.ACTS["team-catalog-leave"]({
      getAttribute: (k) => (k === "data-dir" ? "" : k === "data-team" ? TID1 : k === "data-cat" ? "c-orphan-title" : null)
    });
    sendEscape(P);
    const orphanEscClosedEn = P.page.S.cover === null && left.length === 0;

    // Cover press on orphan
    await P.page.ACTS["team-catalog-leave"]({
      getAttribute: (k) => (k === "data-dir" ? "" : k === "data-team" ? TID1 : k === "data-cat" ? "c-orphan-title" : null)
    });
    await P.page.ACTS["do-team-catalog-leave"]();
    const orphanCalledOnceEn = left.length === 1
      && left[0][0] === "" && left[0][1] === TID1 && left[0][2] === "c-orphan-title"
      && P.page.S.cover === null;

    // Orphan with no title (uses cat id)
    left.length = 0;
    await P.page.ACTS["team-catalog-leave"]({
      getAttribute: (k) => (k === "data-dir" ? "" : k === "data-team" ? TID1 : k === "data-cat" ? "c-orphan-notitle" : null)
    });
    const dlgOrphanNoTitleEn = P.node("#dlg").innerHTML.replace(/&#39;/g, "'");
    const orphanNoTitleHeadingEn = /Take c-orphan-notitle off Harbourlight Insurance, Second Light\?/.test(dlgOrphanNoTitleEn);
    await P.page.ACTS["do-team-catalog-leave"]();
    const orphanNoTitleCalledEn = left.length === 1
      && left[0][0] === "" && left[0][1] === TID1 && left[0][2] === "c-orphan-notitle";

    // 2. Polish
    const P_PL = makePage("pl");
    P_PL.sandbox.STUDIO_T.force("pl");
    Object.assign(P_PL.page.S, {
      screen: "projects", home: "team", projects: lib, teams: [two], teamTab: 0, host: { tour: { offered: true } }
    });
    P_PL.page.paintTeams();

    left.length = 0;
    // 2a. Normal catalog in Polish
    await P_PL.page.ACTS["team-catalog-leave"]({
      getAttribute: (k) => (k === "data-dir" ? "C:\\Second" : k === "data-team" ? TID1 : k === "data-cat" ? "c-second" : null)
    });
    const coverOpenPl = P_PL.page.S.cover === "team-leave" && left.length === 0;
    const dlgPl = P_PL.node("#dlg").innerHTML;
    const headingPl = /Odłączyć katalog Second Light od zespołu Harbourlight Insurance, Second Light\?/.test(dlgPl);
    const line1Pl = /Jego wydania znikną z miejsca zespołu, więc katalog zniknie z Biblioteki na stanowiskach wszystkich członków zespołu i nie dotrze do nich żadne nowe wydanie\./.test(dlgPl);
    const line2Pl = /Ponowne dodanie go do zespołu Harbourlight Insurance, Second Light i opublikowanie przywraca go\./.test(dlgPl);
    const hasCancelPl = /data-act="cover-close"/.test(dlgPl) && /Anuluj/.test(dlgPl);
    const hasPressPl = /data-act="do-team-catalog-leave"/.test(dlgPl) && /Odłącz od tego zespołu/.test(dlgPl);

    // Cancel in Polish
    P_PL.page.ACTS["cover-close"]();
    const cancelClosedPl = P_PL.page.S.cover === null && left.length === 0;

    // Escape in Polish
    await P_PL.page.ACTS["team-catalog-leave"]({
      getAttribute: (k) => (k === "data-dir" ? "C:\\Second" : k === "data-team" ? TID1 : k === "data-cat" ? "c-second" : null)
    });
    sendEscape(P_PL);
    const escClosedPl = P_PL.page.S.cover === null && left.length === 0;

    // Cover press in Polish
    await P_PL.page.ACTS["team-catalog-leave"]({
      getAttribute: (k) => (k === "data-dir" ? "C:\\Second" : k === "data-team" ? TID1 : k === "data-cat" ? "c-second" : null)
    });
    await P_PL.page.ACTS["do-team-catalog-leave"]();
    const calledOncePl = left.length === 1
      && left[0][0] === "C:\\Second" && left[0][1] === TID1 && left[0][2] === "c-second"
      && P_PL.page.S.cover === null;

    // 2b. Orphan in Polish
    left.length = 0;
    await P_PL.page.ACTS["team-catalog-leave"]({
      getAttribute: (k) => (k === "data-dir" ? "" : k === "data-team" ? TID1 : k === "data-cat" ? "c-orphan-title" : null)
    });
    const orphanCoverOpenPl = P_PL.page.S.cover === "team-leave" && left.length === 0;
    const dlgOrphanPl = P_PL.node("#dlg").innerHTML;
    const orphanHeadingPl = /Odłączyć katalog Orphan Book od zespołu Harbourlight Insurance, Second Light\?/.test(dlgOrphanPl);
    const orphanLine1Pl = /Jego wydania znikną z miejsca zespołu, więc katalog zniknie z Biblioteki na stanowiskach wszystkich członków zespołu i nie dotrze do nich żadne nowe wydanie\./.test(dlgOrphanPl);
    const orphanLine2Pl = /Ponowne dodanie go do zespołu Harbourlight Insurance, Second Light i opublikowanie przywraca go\./.test(dlgOrphanPl);

    // Cover press on orphan in Polish
    await P_PL.page.ACTS["do-team-catalog-leave"]();
    const orphanCalledOncePl = left.length === 1
      && left[0][0] === "" && left[0][1] === TID1 && left[0][2] === "c-orphan-title"
      && P_PL.page.S.cover === null;

    // Orphan with no title in Polish
    left.length = 0;
    await P_PL.page.ACTS["team-catalog-leave"]({
      getAttribute: (k) => (k === "data-dir" ? "" : k === "data-team" ? TID1 : k === "data-cat" ? "c-orphan-notitle" : null)
    });
    const dlgOrphanNoTitlePl = P_PL.node("#dlg").innerHTML;
    const orphanNoTitleHeadingPl = /Odłączyć katalog c-orphan-notitle od zespołu Harbourlight Insurance, Second Light\?/.test(dlgOrphanNoTitlePl);
    await P_PL.page.ACTS["do-team-catalog-leave"]();
    const orphanNoTitleCalledPl = left.length === 1
      && left[0][0] === "" && left[0][1] === TID1 && left[0][2] === "c-orphan-notitle";

    const f = {
      coverOpenEn, headingEn, line1En, line2En, hasCancelEn, hasPressEn, cancelClosedEn, escClosedEn, calledOnceEn,
      orphanCoverOpenEn, orphanHeadingEn, orphanLine1En, orphanLine2En, orphanCancelClosedEn, orphanEscClosedEn, orphanCalledOnceEn,
      orphanNoTitleHeadingEn, orphanNoTitleCalledEn,
      coverOpenPl, headingPl, line1Pl, line2Pl, hasCancelPl, hasPressPl, cancelClosedPl, escClosedPl, calledOncePl,
      orphanCoverOpenPl, orphanHeadingPl, orphanLine1Pl, orphanLine2Pl, orphanCalledOncePl,
      orphanNoTitleHeadingPl, orphanNoTitleCalledPl
    };
    if (!Object.keys(f).every((k) => f[k])) process.stderr.write("takeoff-cover " + JSON.stringify(f) + "\n");
    return Object.keys(f).every((k) => f[k]);
  });

  /* BOARD 974, MATURITY 4. The share's team file is left where it is: ending frees this Studio's slot. */
  await leg("974m4 the card says inviting and letting in teammates needs a catalog, and a lead can end the team", async () => {
    const TID = "t-00000000000000e4", PID = "t-00000000000000e5";
    const empty = { id: TID, connection: "relay", folder: "", relay: { rt: "0123456789abcdef0123456789abcdef", url: "https://etiuda.dev" }, sealed: true, led: true, leadPrint: "eeee111122223333",
      catalogs: [], project: null, projects: [], teammates: [], count: 0 };
    const plain = { id: PID, connection: "relay", folder: "", relay: { rt: "0123456789abcdef0123456789abcdef", url: "https://etiuda.dev" }, sealed: false, led: true, leadPrint: "ffff111122223333",
      catalogs: [], project: null, projects: [], teammates: [], count: 0 };
    const ended = [];
    let gone = false;
    const api = {
      teams: () => Promise.resolve({ teams: gone ? [plain] : [empty, plain] }),
      projects: () => Promise.resolve({ root: "C:\\Projects", projects: [] }),
      teamEnd: (id) => { ended.push(id); gone = true; return Promise.resolve({ ended: id, teamsCount: 2 }); }
    };
    const paint = (lang, idx = 0) => {
      const P = loadPage({ uiLang: lang, api });
      if (lang === "pl") P.sandbox.STUDIO_T.force("pl");
      Object.assign(P.page.S, { screen: "projects", home: "team", projects: [], teams: [empty, plain], teamTab: idx, host: { tour: { offered: true } } });
      P.page.paintTeams();
      return P;
    };
    const P = paint("en", 0);
    const rowE = P.node("#main").innerHTML;
    P.page.S.teamTab = 1; P.page.paintTeams();
    const rowP = P.node("#main").innerHTML;
    P.page.S.teamTab = 0; P.page.paintTeams();
    const said = /Invite a teammate is offered here once the team holds a catalog, so an empty team starts with Add a catalog to this team\./.test(rowE) && !/Invite a teammate is offered here/.test(rowP);
    const btn = new RegExp('data-act="team-end" data-team="' + TID + '"').test(rowE) && !/data-act="team-end"/.test(rowP);
    const act = P.page.ACTS["team-end"];
    if (typeof act === "function") await act({ getAttribute: (k) => (k === "data-team" ? TID : null) });
    const after = P.node("#main").innerHTML;
    const freed = ended.length === 1 && ended[0] === TID && after.indexOf(TID) < 0 && after.indexOf(PID) >= 0;
    const rowEp = paint("pl", 0).node("#main").innerHTML;
    const pl = /Przycisk Zaproś członka zespołu pojawia się tutaj, gdy zespół ma katalog, więc pusty zespół zaczyna od przycisku Dodaj katalog do tego zespołu\./.test(rowEp)
      && /Zakończ ten zespół/.test(rowEp);
    const Store = await import("../src/team-store.mjs");
    const Studio = await import("../src/studio.mjs");
    const shareFile = path.join(share1, "etiuda-team.json");
    const shareBefore = fs.readFileSync(shareFile);
    const before = Store.studioTeammates(teamsJsonPath).teamsCount;
    const otherPath = path.join(ud, "end-other-key.json");
    fs.writeFileSync(otherPath, JSON.stringify(await makeKeyFile({ passphrase: "another-lead-entirely" }), null, 1) + "\n");
    let refused = "";
    try { await Studio.endLedTeam(team1Id, otherPath, { teamsFile: teamsJsonPath, userData: ud }); }
    catch (e) { refused = String(e && e.message || e); }
    const heldOff = Store.studioTeammates(teamsJsonPath).teamsCount === before && /not ended/.test(refused);
    let endedHere = null;
    if (typeof Studio.endLedTeam === "function") {
      endedHere = await Studio.endLedTeam(team1Id, leadKeyPath, { teamsFile: teamsJsonPath, userData: ud });
    }
    const slot = before === 2 && !!endedHere && endedHere.ended === team1Id && endedHere.teamsCount === 1
      && Store.studioTeammates(teamsJsonPath).teamsCount === 1
      && fs.readFileSync(shareFile).equals(shareBefore);
    /* A team with a teammate, and a team with a catalog, are sealed and led, so they take a catalog. End is not drawn. */
    const MID = "t-00000000000000e6", CID = "t-00000000000000e7";
    const mate = { id: MID, connection: "relay", folder: "", relay: { rt: "0123456789abcdef0123456789abcdef", url: "https://etiuda.dev" }, sealed: true, led: true, leadPrint: "aaaa111122223333",
      catalogs: [], project: null, projects: [], teammates: [{ id: "k-1111111111111111", name: "Ada", kind: "desk", admitted: true }], count: 1 };
    const catTeam = { id: CID, connection: "relay", folder: "", relay: { rt: "0123456789abcdef0123456789abcdef", url: "https://etiuda.dev" }, sealed: true, led: true, leadPrint: "bbbb111122223333",
      catalogs: ["c-one"], project: { id: "c-one", name: "One", dir: "C:\\One", rev: 1 },
      projects: [{ id: "c-one", name: "One", dir: "C:\\One", rev: 1 }], teammates: [], count: 0 };
    const drawOf = (teams, idx) => {
      const Q = loadPage({ api: { teams: () => Promise.resolve({ teams }), projects: () => Promise.resolve({ root: "C:\\Projects", projects: [] }) } });
      Object.assign(Q.page.S, { screen: "projects", home: "team", projects: [], teams, teamTab: idx, host: { tour: { offered: true } } });
      Q.page.paintTeams();
      return Q.node("#main").innerHTML;
    };
    const mateRow = drawOf([mate, catTeam], 0);
    const catRow = drawOf([mate, catTeam], 1);
    const noMate = mateRow.length > 0 && !/data-act="team-end"/.test(mateRow) && /data-act="team-add-catalog"/.test(mateRow);
    const noCat = catRow.length > 0 && !/data-act="team-end"/.test(catRow) && /data-act="team-add-catalog"/.test(catRow);
    /* An empty team this key leads: ending frees the slot, and the key backup made from the rows the shell sends still holds the key. */
    const { makeVault } = await import("./relay-lab.mjs");
    const vault = makeVault();
    const emptyId = "t-00000000000000e8";
    const emptyKey = crypto.randomBytes(32);
    const emptyUd = path.join(SCRATCH, "end-empty-ud");
    fs.mkdirSync(emptyUd, { recursive: true });
    const emptyFile = path.join(emptyUd, "teams.json");
    Store.keepTeamKey(emptyFile, vault, emptyId, 1, emptyKey);
    Store.chooseSealed(emptyFile, emptyId, true, null, {
      id: emptyId, epoch: 1, lead: { keyId: leadKey.keyId, public: leadKey.public }, catalogs: [], roster: []
    });
    let endedEmpty = null;
    try { endedEmpty = await Studio.endLedTeam(emptyId, leadKeyPath, { teamsFile: emptyFile, userData: emptyUd }); }
    catch (e) { endedEmpty = null; }
    let emptyDoc = {};
    try { emptyDoc = JSON.parse(fs.readFileSync(emptyFile, "utf8")); } catch { emptyDoc = {}; }
    const slotGone = !!endedEmpty && endedEmpty.ended === emptyId
      && Store.keptTeam(emptyFile, emptyId) === null
      && Store.studioTeammates(emptyFile).teamsCount === 0
      && !(emptyDoc.teams && Object.prototype.hasOwnProperty.call(emptyDoc.teams, emptyId));
    const rows = typeof Store.epochRowsOf === "function" ? Store.epochRowsOf(emptyFile, vault) : [];
    const copyAt = path.join(emptyUd, "key-backup.json");
    const BACKUP_PASS = "backup-passphrase-for-the-ended-team";
    let openedEpochs = [];
    if (rows.length) {
      await Studio.backupKey(copyAt, leadKeyPath, PASS, BACKUP_PASS, { epochs: rows });
      const opened = Studio.openBackup(copyAt, BACKUP_PASS);
      openedEpochs = opened && Array.isArray(opened.epochs) ? opened.epochs : [];
    }
    const hit = openedEpochs.find((r) => r && r.team === emptyId && r.epoch === 1);
    const kept = slotGone && !!(hit && Buffer.isBuffer(hit.key) && hit.key.equals(emptyKey));
    const mainJs = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
    const wired = mainJs.indexOf("K.epochRowsOf(at, vault") >= 0;
    const f = { said, btn, freed, pl, heldOff, slot, noMate, noCat, kept, wired };
    if (!Object.keys(f).every((k) => f[k])) process.stderr.write("974m4 " + JSON.stringify(f) + "\n");
    return Object.keys(f).every((k) => f[k]);
  });

  /* BOARD 974, the test architect's E1. A live invitation is someone End would strand. Spent and cancelled are not. */
  await leg("974e1 a team with one live invitation draws no End, and once it is spent or cancelled it does", async () => {
    const Store = await import("../src/team-store.mjs");
    const Studio = await import("../src/studio.mjs");
    const { newSecret, INVITE_PREFIX } = await import("../src/invite.mjs");
    const Ir = Engine.inviteRules();
    const makeLocalInvite = (t, name, sec, at) => {
      const d = { team: t.team, folder: t.folder, lead: { keyId: t.lead.keyId, public: t.lead.public, name }, secret: sec };
      const ms = new Date(at).getTime();
      return { blob: INVITE_PREFIX + Buffer.from(JSON.stringify(d), "utf8").toString("base64url"),
        id: Ir.inviteIdOf(sec),
        name, made: new Date(ms).toISOString(), expires: new Date(ms + 7 * 86400000).toISOString() };
    };
    const { makeVault } = await import("./relay-lab.mjs");
    const TID = "t-00000000000000e9";
    const PERSON = "Rowan Quinn";
    const dir = path.join(SCRATCH, "end-invite-ud");
    const emptyRoot = path.join(SCRATCH, "end-invite-projects");
    fs.mkdirSync(dir, { recursive: true });
    fs.mkdirSync(emptyRoot, { recursive: true });
    const file = path.join(dir, "teams.json");
    const vault = makeVault();
    const key = crypto.randomBytes(32);
    const lead = { keyId: leadKey.keyId, public: leadKey.public };
    Store.keepTeamKey(file, vault, TID, 1, key);
    /* The invitation is kept while the team still lists a catalog, then the catalog leaves. The book is the team's own. */
    Store.chooseSealed(file, TID, true, null, { id: TID, epoch: 1, sealed: true, lead, catalogs: ["c-once"], roster: [] });
    /* On the relay (was: kept for a shared folder, which is held and ended by no press; fh1). */
    Store.keepRelay(file, TID, rt1, "https://etiuda.dev");
    /* Made an hour before the run: an invitation lives seven days by the machine's clock, so a fixed date runs out. */
    const madeAt = new Date(Date.now() - 3600000).toISOString();
    const secret = newSecret();
    const made = makeLocalInvite({ team: TID, folder: "C:\\left", lead }, "Lead", secret, madeAt);
    Store.keepInvite(file, vault, TID, { id: made.id, secret, made: made.made, expires: made.expires, name: made.name, person: PERSON });
    Store.chooseSealed(file, TID, true, null, { id: TID, epoch: 1, sealed: true, lead, catalogs: [], roster: [] });
    const still = Store.invitesOf(file, TID).filter((i) => i.state === "live");
    const held = still.length === 1 && still[0].id === made.id;
    const draw = async () => {
      const res = await Reader.readAllTeams({ userData: dir, teamsFile: file, projectsRoot: emptyRoot, keyFile: leadKeyPath });
      const teams = res.teams || [];
      const t = teams.find((x) => x && x.id === TID) || null;
      const Q = loadPage({
        api: {
          teams: () => Promise.resolve({ teams }),
          projects: () => Promise.resolve({ root: "C:\\Projects", projects: [] })
        }
      });
      Object.assign(Q.page.S, { screen: "projects", home: "team", projects: [], teams, teamTab: 0, host: { tour: { offered: true } } });
      Q.page.paintTeams();
      return { html: Q.node("#main").innerHTML, team: t, raw: JSON.stringify(res) };
    };
    const endShown = (html) => new RegExp('data-act="team-end" data-team="' + TID + '"').test(html);
    const openTeam = (t) => !!(t && t.sealed === true && t.led === true
      && !(t.catalogs && t.catalogs.length) && !(t.projects && t.projects.length)
      && !(t.teammates && t.teammates.length));
    const leaked = (raw, html, id, sec, code, blob) => [id, sec, code, blob, PERSON].some((s) => s && (raw.includes(s) || html.includes(s)));
    const live = await draw();
    const open = openTeam(live.team);
    const noEnd = open && !endShown(live.html);
    const counted = !!(live.team && live.team.liveInvites === 1);
    const quiet = !leaked(live.raw, live.html, made.id, secret, made.code, made.blob);
    Store.endInvite(file, TID, made.id, "spent");
    const spent = await draw();
    const spentDraws = openTeam(spent.team) && endShown(spent.html) && !(spent.team && spent.team.liveInvites > 0);
    const secret2 = newSecret();
    const made2 = makeLocalInvite({ team: TID, folder: "C:\\left", lead }, "Lead", secret2, madeAt);
    Store.keepInvite(file, vault, TID, { id: made2.id, secret: secret2, made: made2.made, expires: made2.expires, name: made2.name, person: PERSON });
    const again = await draw();
    const noEndAgain = openTeam(again.team) && !endShown(again.html) && again.team.liveInvites === 1
      && !leaked(again.raw, again.html, made2.id, secret2, made2.code, made2.blob);
    Store.endInvite(file, TID, made2.id, "withdrawn");
    const cancelled = await draw();
    const cancelledDraws = openTeam(cancelled.team) && endShown(cancelled.html) && !(cancelled.team && cancelled.team.liveInvites > 0);
    const secret3 = newSecret();
    const made3 = makeLocalInvite({ team: TID, folder: "C:\\left", lead }, "Lead", secret3, madeAt);
    Store.keepInvite(file, vault, TID, { id: made3.id, secret: secret3, made: made3.made, expires: made3.expires, name: made3.name, person: PERSON });
    let refusedMsg = "";
    try { await Studio.endLedTeam(TID, leadKeyPath, { teamsFile: file, userData: dir }); }
    catch (e) { refusedMsg = String(e && e.message || e); }
    const refused = /can be ended/.test(refusedMsg) && Store.keptTeam(file, TID) !== null
      && Store.invitesOf(file, TID).some((i) => i.id === made3.id && i.state === "live");
    const f = { held, open, noEnd, counted, quiet, spentDraws, noEndAgain, cancelledDraws, refused };
    if (!Object.keys(f).every((k) => f[k])) process.stderr.write("974e1 " + JSON.stringify(f) + "\n");
    return Object.keys(f).every((k) => f[k]);
  });

  /* BOARD 974, MATURITY 8. The copy already held is what the screen shows; the make button stays where none is held. */
  await leg("974m8 a lead holding a linked copy is shown it", async () => {
    const team = "t-1122334455667788";
    const copyLib = { dir: "C:\\Projects\\Varnel copy", name: "Varnel (linked copy)", linked: { from: "c-varnel", team: null } };
    const copyBase = { dir: "C:\\Projects\\Lamps copy", name: "Lamps base", linked: { from: "c-lamps", team } };
    const api = {
      teams: () => Promise.resolve({ teams: [] }),
      projects: () => Promise.resolve({ root: "C:\\Projects", projects: [] }),
      followState: () => Promise.resolve({ follow: null })
    };
    const follow = {
      team, channel: "relay", leadName: "Ada", state: "following",
      catalogs: [
        { catalog: "c-lamps", title: "Harbour lamps", rev: 2 },
        { catalog: "c-other", title: "Other lamps", rev: 1 }
      ]
    };
    const openOrig = {
      dir: "C:\\Projects\\Varnel", name: "Varnel", id: "c-varnel",
      project: { id: "c-varnel", name: "Varnel", rev: 1, tags: [], folder: null },
      langs: { rows: [], commentLang: "en", of: { cards: 0, intents: 0 }, reads: "en" },
      editions: []
    };
    const paintFollow = (lang) => {
      const P = loadPage({ uiLang: lang, api });
      if (lang === "pl") P.sandbox.STUDIO_T.force("pl");
      Object.assign(P.page.S, { screen: "settings", sx: { sec: "teams", q: "" }, projects: [copyLib, copyBase], follow });
      P.node("#main").innerHTML = P.page.settingsPageHtml();
      return P.node("#main").innerHTML;
    };
    const sliceAt = (html, a, b) => html.slice(html.indexOf(a), html.indexOf(b));
    const en = paintFollow("en");
    const lamps = sliceAt(en, "Harbour lamps", "Other lamps");
    const other = en.slice(en.indexOf("Other lamps"));
    const shown = lamps.indexOf('data-act="open"') >= 0 && lamps.indexOf("C:\\Projects\\Lamps copy") >= 0
      && lamps.indexOf("Lamps base") >= 0 && lamps.indexOf("follow-base-take") < 0;
    const still = other.indexOf('data-act="follow-base-take"') >= 0 && other.indexOf('data-catalog="c-other"') >= 0;
    const pl = paintFollow("pl");
    const lampsPl = sliceAt(pl, "Harbour lamps", "Other lamps");
    const shownPl = lampsPl.indexOf('data-act="open"') >= 0 && lampsPl.indexOf("Utwórz połączoną kopię") < 0
      && pl.indexOf("Other lamps") >= 0 && pl.slice(pl.indexOf("Other lamps")).indexOf("Utwórz połączoną kopię") >= 0;
    const paintOrig = (lang) => {
      const P = loadPage({ uiLang: lang, api });
      if (lang === "pl") P.sandbox.STUDIO_T.force("pl");
      Object.assign(P.page.S, { screen: "project", section: "settings", projects: [copyLib, copyBase], open: openOrig });
      P.page.paintMain();
      return P.node("#main").innerHTML;
    };
    const det = paintOrig("en");
    const lib = det.indexOf("Varnel (linked copy)") >= 0 && det.indexOf('data-act="open"') >= 0
      && det.indexOf("C:\\Projects\\Varnel copy") >= 0 && det.indexOf('data-act="link-copy"') < 0
      && det.indexOf("Linked copy") >= 0;
    const detPl = paintOrig("pl");
    const libPl = detPl.indexOf("Varnel (linked copy)") >= 0 && detPl.indexOf("Połączona kopia") >= 0
      && detPl.indexOf("Utwórz połączoną kopię") < 0 && detPl.indexOf('data-act="link-copy"') < 0;
    const f = { shown, still, shownPl, lib, libPl };
    if (!Object.keys(f).every((k) => f[k])) process.stderr.write("974m8 " + JSON.stringify(f) + "\n");
    return Object.keys(f).every((k) => f[k]);
  });

  /* BOARD 994: THE UNCONNECTED MAP NEVER CUTS A PLACE'S WORDS, in either language. Each place is drawn with no fixed width
     (the sheet's .fam0 rules make it as wide as its words) and at least as wide as the page's own estimate of its words
     (famGuess, which the connected map uses where the page cannot measure); the stages never overlap, stand at least 40 px
     apart, and the invitation card stands beside the map only where both fit. Red on 5016b500: "Członkowie zespołu" in a
     150 px box and "teammates join by invitation" in a 232 px one. */
  await leg("994a the unconnected Overview map's places are as wide as their words in English and Polish, apart and uncut", async () => {
    const sheet = fs.readFileSync(path.join(ROOT, "ui", "index.html"), "utf8");
    const f = {
      sheetFold: /\.fam0 \.dm-fold\{width:max-content;max-width:none\}/.test(sheet),
      sheetDesk: /\.fam0 \.dm-desk\{width:max-content\}/.test(sheet),
      sheetScroll: /\.fam0\{overflow-x:auto/.test(sheet)
    };
    for (const lang of ["en", "pl"]) {
      const P = loadPage({ uiLang: lang });
      const html = P.page.noneHtml(true);
      const places = [];
      const re = /<div class="dm-(fold|desk)[^"]*"[^>]*style="([^"]*)"[\s\S]*?<span class="nm">([^<]*)<\/span>(?:<span class="(?:sub|st)"><span class="v">([^<]*)<\/span>)?/g;
      let m;
      while ((m = re.exec(html))) {
        const st = m[2], num = (k) => { const x = new RegExp("(?:^|;)" + k + ":(-?[0-9.]+)px").exec(st); return x ? Number(x[1]) : null; };
        const words = (s) => String(s || "").replace(/&amp;/g, "&").replace(/&#39;/g, "'");
        places.push({ fold: m[1] === "fold", left: num("left"), width: num("width"), minw: num("min-width"), nm: words(m[3]), sub: words(m[4]) });
      }
      const guess = (p) => P.page.famGuess(p.nm, p.sub || "", p.fold);
      f[lang + "Four"] = places.length === 4;
      f[lang + "NoFixed"] = places.every((p) => p.width == null);
      f[lang + "Wide"] = places.every((p) => p.minw != null && p.minw >= guess(p));
      const [s, c1, d1, d2] = places;
      f[lang + "Apart"] = places.length === 4 && d1.left === d2.left
        && c1.left - (s.left + s.minw) >= 40 && d1.left - (c1.left + c1.minw) >= 40;
      const lay = P.page.noneLay;
      const w = [s.minw, c1.minw, Math.max(d1.minw, d2.minw)];
      f[lang + "Rooms"] = typeof lay === "function" && [840, 872, 1020, 1308, 1600].every((room) => {
        const { geo, under } = lay(w[0], w[1], w[2], room);
        /* The drawing is as wide as its places and no wider: a floor of 1012 made the map's box scroll sideways at every
           window under about 1270 px though the places fitted (the product designer's pictures of 2026-11-12 07:53). */
        const gaps = geo.x2 - (geo.x1 + w[0]) >= 48 && geo.xd - (geo.x2 + w[1]) >= 40 && geo.right === geo.xd + w[2] && geo.W === geo.right + 22;
        return gaps && (under || geo.right + 22 <= room - 242);
      });
      if (lang === "pl") f.plWords = places.some((p) => p.nm === "Członkowie zespołu") && places.some((p) => p.sub === "członkowie dołączają przez zaproszenie");
      if (lang === "en") f.enSpacing = typeof lay === "function" && lay(w[0], w[1], w[2], 1600).geo.x2 === 296 && !lay(w[0], w[1], w[2], 1600).under;
    }
    if (!Object.keys(f).every((k) => f[k])) process.stderr.write("994a " + JSON.stringify(f) + "\n");
    return Object.keys(f).every((k) => f[k]);
  });

  /* THE DECIDING LINES OF fh1 TO fh3, each proved in a scratch copy of the tree: with the line lifted, its leg is red and the
     checkout is unchanged. Not run with ETIUDA_PLANTS=off or for one leg. */
  const FH_PLANTS = [
    ["fh-held-reader", "src/team-reader.mjs", "fh1", "    if (isRelay === null) {"],
    ["fh-watch-relay-only", "src/team-store.mjs", "fh2",
      "  return Object.keys(doc.teams).filter(t => TEAM_ID.test(t) && doc.teams[t] && typeof doc.teams[t].folder === \"string\" && doc.teams[t].folder)"],
    ["fh-admit-held", "src/studio.mjs", "fh2", "  if (false) return Object.assign(none, { reason: \"folder\" });"],
    ["fh-held-map", "ui/app.js", "fh3", "    const map = curTeam ? map15Html(curTeam) : noneHtml(hasProjects);"],
    ["fh-held-team", "ui/app.js", "fh3", "      const inner = false ? heldFolderHtml(curTeam)"],
    ["fh-held-desks", "ui/app.js", "fh3", "    if (false)"],
  ];
  if (process.env.ETIUDA_PLANTS !== "off" && !ONLY) {
    await leg("fhP the deciding lines of fh1 to fh3 each turn their leg red in a scratch copy, and the checkout is unchanged", async () => {
      const { plantsTree, treeSha, dropPlantsTree } = await import("./plants-tree.mjs");
      const was = treeSha(ROOT), copy = plantsTree(ROOT, "team-overview-fh");
      const bad = [];
      try {
        for (const [mark, rel, legId, line] of FH_PLANTS) {
          const at = path.join(copy, rel), text = fs.readFileSync(at, "utf8"), lines = text.split("\n");
          const hits = lines.map((l, i) => (l.indexOf("/* plant:" + mark + " */") >= 0 ? i : -1)).filter((i) => i >= 0);
          if (hits.length !== 1) { bad.push(mark + " on " + hits.length + " lines"); continue; }
          const planted = lines.slice(); planted[hits[0]] = line;
          fs.writeFileSync(at, planted.join("\n"));
          const child = spawnSync(process.execPath, [path.join(copy, "tests", "team-overview.mjs")], { cwd: copy, encoding: "utf8", timeout: 180000,
            env: Object.assign({}, process.env, { TEAM_OVERVIEW_ONLY: legId, ETIUDA_PLANTS: "off" }) });
          fs.writeFileSync(at, text);
          const red = String(child.stderr || "").indexOf("FAIL " + legId) >= 0 && child.status !== 0;
          if (!red) bad.push(mark + " left " + legId + " green");
        }
      } finally { dropPlantsTree(copy, ROOT); }
      if (bad.length) process.stderr.write("fhP " + bad.join("; ") + "\n");
      return !bad.length && treeSha(ROOT) === was;
    });
  }

  if (!keep) dropScratch(SCRATCH);
  process.stdout.write("\nteam-overview  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch((err) => {
  process.stderr.write("team-overview threw: " + String(err && err.stack || err) + "\n");
  process.exit(1);
});
