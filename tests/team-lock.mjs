/* THE TEAM-ACT LOCK: one lock per team across every team act (board 962 stage 5).
 *
 *     node tests/team-lock.mjs
 *
 * gate-kind: node
 *
 * 1. tl1: a relay team's removal held on the relay's answer and a second act on the same team: the second runs only after the first ends and sees its result
 * 2. tl2: two teams' acts do not wait on each other
 * 3. tl3: a nested same-key act throws, and with its plant lifted it times out
 * 4. tl5: a watch started during an act runs outside it once the act ends, and admits with no nested act (its syncer half went with
 *    Studio's shared-folder syncer, A-S5)
 * 5. tl6: a runner write during an act completes (board 962 stage 5, T3)
 * 6. tl7: a lend that outlives its act, the lent write and the next act never overlapping (T3 round two)
 * 7. tl8: a sync run once inside an act finishes its team write, every relayOnce in an act lent (T3 round two)
 * 8. tl9: a folder team an older Studio kept a mirror of (A-S5): that mirror, its owed outbox and a newer team file in it, is left
 *    byte for byte through a start, a watch look and the Desks screen, which reads the team at its folder and not the mirror
 * 9. tlP: plants proved in scratch copy (team-act, team-act-nested, team-watch-exit, team-lend, team-act-inline, relay-once-lent)
 */
import "./reg-stand-on.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as Engine from "../src/engine.mjs";
import * as Sign from "../src/sign.mjs";
import * as Team from "../src/team.mjs";
import * as Store from "../src/team-store.mjs";
import * as Relay from "../src/relay.mjs";
import * as Ring from "../src/ring.mjs";
import * as Studio from "../src/studio.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { seatEnv } from "./seated.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "team-lock");
const nodeRequire = createRequire(import.meta.url);
const NL = "\n";
const TEAM_NAME = "etiuda-team.json";
const EXPECTED = 9;
const ONLY = process.env.TEAM_LOCK_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";

let asserted = 0, failed = 0, skipped = 0;

function check(cond, line) {
  asserted++;
  if (cond) {
    process.stdout.write("  ok   " + line + NL);
  } else {
    failed++;
    process.stderr.write("  FAIL " + line + NL);
  }
}

function skip(line) {
  skipped++;
  process.stdout.write("  SKIP " + line + NL);
}

async function leg(line, fn) {
  const m = /^(\S+)/.exec(line);
  const id = m ? m[1] : line;
  if (ONLY && id !== ONLY) return;
  try {
    const ok = await fn();
    /* "skip": the scene could not be set, so the leg proves nothing either way (tl1 under load, the test architect, 2026-11-09). */
    if (ok === "skip") { skip(line); return; }
    check(ok, line);
  } catch (err) {
    check(false, line + " (threw: " + String(err && err.message || err) + ")");
  }
}

const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
function newTestKey() {
  const privateKey = crypto.generateKeyPairSync("ed25519").privateKey;
  const pub = crypto.createPublicKey(privateKey).export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  return { pub, id: "studio-" + sha(Buffer.from(pub, "hex")).slice(0, 16), privateKey };
}

const ROOTK = newTestKey();

const TEST_VAULT = {
  isEncryptionAvailable: () => true,
  available: () => true,
  seal: (t) => Buffer.from("sealed:" + Buffer.from(String(t), "utf8").reverse().toString("hex"), "utf8"),
  open: (b) => {
    const t = Buffer.from(b).toString("utf8");
    if (!t.startsWith("sealed:")) throw new Error("not sealed here");
    return Buffer.from(t.slice(7), "hex").reverse().toString("utf8");
  },
  encryptString: (s) => Buffer.from("sealed:" + Buffer.from(String(s), "utf8").reverse().toString("hex"), "utf8"),
  decryptString: (b) => {
    const t = Buffer.from(b).toString("utf8");
    if (!t.startsWith("sealed:")) throw new Error("not sealed here");
    return Buffer.from(t.slice(7), "hex").reverse().toString("utf8");
  },
};

function validGrantFor(pub) {
  const now = Date.now();
  const g = {
    kind: "etiuda-relay-grant",
    format: 1,
    lead: pub,
    issued: now,
    until: now + 30 * 24 * 3600 * 1000,
    paid: true,
    sig: { alg: "ed25519", keyId: ROOTK.id, value: "" },
  };
  const bytes = Engine.relayRules().core.grantBytes(g);
  const sig = crypto.sign(null, bytes, ROOTK.privateKey).toString("hex");
  g.sig.value = sig;
  return g;
}

async function loadShellForLock(ud, mockRelay) {
  const Module = nodeRequire("node:module");
  const main = path.join(ROOT, "shell", "main.js");
  const ui = path.join(ROOT, "ui", "index.html");
  const got = { handlers: {}, windows: [], said: [], calls: [], shell: null };

  class Win {
    constructor() {
      this.webContents = {
        id: 1,
        on() {},
        once() {},
        send() {},
        setWindowOpenHandler() {},
        getURL: () => pathToFileURL(ui).href,
      };
      got.windows.push(this);
    }
    on() {}
    once() {}
    isDestroyed() { return false; }
    isMaximized() { return false; }
    isMinimized() { return false; }
    close() {}
    focus() {}
    restore() {}
    loadFile() {}
    show() {}
    showInactive() {}
    setMinimumSize() {}
  }

  const electron = {
    app: {
      commandLine: { appendSwitch() {}, hasSwitch: () => false, removeSwitch() {} },
      getPath: () => ud,
      getVersion: () => "0.0.0",
      getLocale: () => "en-GB",
      requestSingleInstanceLock: () => true,
      whenReady: () => Promise.resolve(),
      on() {},
      quit() {},
      exit() {},
    },
    BrowserWindow: Object.assign(Win, { fromWebContents: () => got.windows[0] || null, getAllWindows: () => got.windows }),
    Menu: { setApplicationMenu() {}, buildFromTemplate: () => ({ popup() {} }) },
    dialog: {
      showMessageBox: () => Promise.resolve({ response: 0 }),
      showOpenDialog: () => Promise.resolve({ canceled: true, filePaths: [] }),
      showSaveDialog: () => Promise.resolve({ canceled: true, filePath: "" }),
    },
    nativeTheme: { themeSource: "system", shouldUseDarkColors: false },
    clipboard: { writeText() {} },
    safeStorage: TEST_VAULT,
    screen: { getAllDisplays: () => [], getPrimaryDisplay: () => ({}), on() {}, removeListener() {} },
    session: {
      defaultSession: {
        setPermissionRequestHandler() {},
        setPermissionCheckHandler() {},
        setDevicePermissionHandler() {},
        setSpellCheckerLanguages() {},
        setSpellCheckerDictionaryDownloadURL() {},
        setSpellCheckerEnabled() {},
      },
    },
    shell: { openPath: () => Promise.resolve(""), trashItem: () => Promise.resolve() },
    ipcMain: { handle: (ch, fn) => { got.handlers[ch] = fn; }, on() {} },
    net: { fetch: () => Promise.reject(new Error("network forbidden")) },
  };

  const thread = {
    call: async (verb, ...a) => {
      if (typeof Studio[verb] === "function") return Studio[verb](...a);
      throw new Error("studio verb " + verb + " not implemented");
    },
  };

  const quiet = { on() {}, unref() {}, kill() {}, pid: 0, stdout: { on() {} }, stderr: { on() {} }, stdin: { end() {}, write() {} } };
  const cp = {
    execFileSync: () => "",
    execSync: () => "",
    spawnSync: () => ({ status: 0, stdout: "", stderr: "" }),
    execFile: () => quiet,
    spawn: () => quiet,
    exec: () => quiet,
    fork: () => quiet,
  };

  const env = {
    STUDIO_NO_PROXY_SERVER: "off",
    STUDIO_TEST_OFFSCREEN: "1",
    STUDIO_VENDOR_KEY: ROOTK.pub,
    STUDIO_RELAY_ROOT: ROOTK.pub,
    STUDIO_KEY_PASSPHRASE: "passphrase",
    STUDIO_PROJECTS: path.join(ud, "projects"),
  };
  const was = {};
  /* A Studio that works, as a lead's does (the gate refuses a closed channel of one that does not). */
  Object.assign(env, await seatEnv(ud, true, env, ROOTK.privateKey), env);
  for (const k of Object.keys(env)) { was[k] = process.env[k]; process.env[k] = env[k]; }

  delete nodeRequire.cache[nodeRequire.resolve(path.join(ROOT, "src", "wire.cjs"))];
  const load = Module._load, write = process.stderr.write, before = new Set(Object.keys(nodeRequire.cache));

  Module._load = function (req) {
    if (req === "electron") return electron;
    if (req === "node:child_process" || req === "child_process") return cp;
    if (/studio-thread\.cjs$/.test(req)) return thread;
    return load.apply(this, arguments);
  };

  const dropCache = () => {
    delete nodeRequire.cache[main];
    for (const k of Object.keys(nodeRequire.cache)) if (!before.has(k)) delete nodeRequire.cache[k];
  };

  const restore = () => {
    Module._load = load;
    process.stderr.write = write;
    dropCache();
    for (const k of Object.keys(was)) {
      if (was[k] === undefined) delete process.env[k];
      else process.env[k] = was[k];
    }
  };

  try {
    dropCache();
    got.shell = nodeRequire(main);
    const wire = nodeRequire(path.join(ROOT, "src", "wire.cjs"));
    wire.relayConnect = () => null;
    wire.relayRequest = async (method, url, headers, body) => {
      got.calls.push({ method, url, headers, body });
      if (mockRelay) return mockRelay(method, url, headers, body);
      return { status: 200, bytes: Buffer.from(JSON.stringify({ ok: true })), header: () => null };
    };

    const event = { senderFrame: { parent: null, url: pathToFileURL(ui).href }, sender: got.windows[0] && got.windows[0].webContents };
    return {
      shell: got.shell,
      ask: async (ch, ...a) => {
        const fn = got.handlers[ch];
        if (!fn) throw new Error("no handler for " + ch);
        return fn(event, ...a);
      },
      done: () => restore(),
      calls: got.calls,
    };
  } catch (err) {
    restore();
    throw err;
  }
}

async function makeTestWorld(tag, o = {}) {
  const ud = path.join(SCRATCH, tag);
  fs.mkdirSync(ud, { recursive: true });

  const keyPath = path.join(ud, Sign.KEY_FILE);
  const leadDoc = await Sign.makeKeyFile({ passphrase: "passphrase" });
  fs.writeFileSync(keyPath, JSON.stringify(leadDoc, null, 1) + "\n");
  const keyDoc = Sign.readKeyFile(keyPath);

  const grant = validGrantFor(keyDoc.public);
  fs.writeFileSync(Relay.grantFileOf(keyPath), JSON.stringify(grant, null, 1) + "\n");

  const projDir = path.join(ud, "projects", "proj1");
  fs.mkdirSync(projDir, { recursive: true });
  fs.mkdirSync(path.join(projDir, "archive"), { recursive: true });

  const shareDir = path.join(ud, "share1");
  fs.mkdirSync(shareDir, { recursive: true });

  const teamId = o.teamId || ("t-" + crypto.randomBytes(8).toString("hex"));
  const teamKey = crypto.randomBytes(32);
  const epoch = 1;
  const rt = o.relay ? Relay.relayId() : "";
  const tf = Store.teamsFile(ud);
  const workDir = o.relay ? Store.keepRelay(tf, teamId, rt, Relay.RELAY_URL) : shareDir;
  fs.mkdirSync(workDir, { recursive: true });

  const draft = {
    id: "cat1",
    schema: 1,
    title: { en: "Test Catalog" },
    languages: ["en"],
    primary: "en",
  };
  fs.writeFileSync(path.join(projDir, "draft.json"), JSON.stringify(draft, null, 1) + "\n");

  const projectJson = {
    folder: workDir,
    sealedTeam: teamId,
    draft: "draft.json",
    rev: 1,
  };
  if (o.relay) projectJson.relay = { rt, url: Relay.RELAY_URL, lead: keyDoc.public };
  fs.writeFileSync(path.join(projDir, "project.json"), JSON.stringify(projectJson, null, 1) + "\n");

  const ringDoc = { format: Ring.RING_FORMAT, kind: Ring.RING_KIND, keys: [{ catalog: "cat1", keyId: keyDoc.keyId, public: keyDoc.public }] };
  /* newTeam names no channel, so a relay world's team file is put on the relay here (it was a folder team's file, and a watch that no longer
     admits at a folder said nothing of the difference until tl5 moved to the relay; the folder team's removal). */
  const plainTeam = Team.newTeam({
    id: teamId,
    catalogs: ["cat1"],
    lead: { keyId: keyDoc.keyId, public: keyDoc.public },
    sealed: true,
    exportsSealed: true,
    channel: o.relay ? { kind: "relay", rt, url: Relay.RELAY_URL } : { kind: "folder" },
    ring: o.relay ? ringDoc : undefined,
  });
  const initialTeam = o.relay ? Team.withChannel(plainTeam, { kind: "relay", rt, url: Relay.RELAY_URL }, ringDoc) : plainTeam;

  fs.writeFileSync(path.join(workDir, Relay.RING_FILE), JSON.stringify(ringDoc, null, 1) + "\n");

  const writtenTeam = await Team.writeTeam(workDir, initialTeam, { key: keyPath, passphrase: "passphrase" });

  Store.keepTeamKey(tf, TEST_VAULT, teamId, epoch, teamKey);
  Store.chooseSealed(tf, teamId, true, workDir, writtenTeam.written);
  if (o.relay) Store.markRelay(tf, teamId, { created: true, lead: keyDoc.public });

  return { ud, projDir, shareDir: workDir, teamId, teamKey, epoch, keyDoc, writtenTeam, tf, rt };
}

/* A desk's genuine request to join, signed under the pinned join rule, proving an invitation where given. */
function askToJoin(share, teamId, inv) {
  const Ji = Engine.joinRules();
  const pair = crypto.generateKeyPairSync("ed25519");
  const raw = (key) => key.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  const pub = raw(pair.publicKey);
  const desk = Ji.branchIdOf(pub);
  const box = raw(crypto.generateKeyPairSync("x25519").publicKey);
  const commit = Ji.joinCommit(teamId, pub, box, crypto.randomBytes(32).toString("hex"));
  const doc = { format: 1, kind: Ji.JOIN_KIND, team: teamId, desk: { id: desk, key: pub, box, name: "Nela" }, date: new Date().toISOString(), commit };
  if (inv) doc.invite = { id: inv.id, proof: Engine.inviteRules().memberProof(inv.secret, commit) };
  /* The signature covers alg and keyId and not the value, so the value is written after the bytes are taken. */
  doc.sig = { alg: "Ed25519", keyId: desk };
  doc.sig.value = crypto.sign(null, Ji.joinSignedBytes(doc), pair.privateKey).toString("hex");
  fs.mkdirSync(path.join(share, "desks", desk), { recursive: true });
  fs.writeFileSync(path.join(share, "desks", desk, "join.json"), JSON.stringify(doc));
  return desk;
}

function admittedInvite(reply, desk) {
  const roster = reply && reply.team && Array.isArray(reply.team.roster) ? reply.team.roster : [];
  return roster.some((entry) => entry && entry.id === desk && entry.door === "invitation");
}

function trapErr() {
  const lines = [];
  const prev = process.stderr.write;
  process.stderr.write = (chunk, ...rest) => {
    lines.push(Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk));
    return prev.call(process.stderr, chunk, ...rest);
  };
  return { text: () => lines.join(""), stop: () => { process.stderr.write = prev; } };
}

function within(ms, job) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timed out")), ms);
    Promise.resolve(job).then((value) => { clearTimeout(timer); resolve(value); }, (err) => { clearTimeout(timer); reject(err); });
  });
}

async function stopShell(sh) {
  try {
    if (sh.shell && typeof sh.shell.endRelay === "function") {
      await Promise.race([sh.shell.endRelay(), new Promise((resolve) => setTimeout(resolve, 3000))]);
    }
  } catch { /* the process exit stops what is left */ }
  sh.done();
}

// ---- The legs -----------------------------------------------------------------------------------

await leg("tl1 a relay team's removal held on the relay's answer and a second act on the same team: the second runs only after the first ends and sees its result", async () => {
  clearScratch(path.join(SCRATCH, "tl1"));
  const w = await makeTestWorld("tl1", { relay: true });
  const pair = crypto.generateKeyPairSync("ed25519");
  const raw = (k) => k.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  const deskPub = raw(pair.publicKey), deskId = Engine.joinRules().branchIdOf(deskPub), deskBox = raw(crypto.generateKeyPairSync("x25519").publicKey);
  const keyAt = path.join(w.ud, Sign.KEY_FILE);
  const held0 = await Team.heldTeam(w.shareDir, { key: keyAt });
  let withDesk = Team.withDesk(held0.team, { id: deskId, key: deskPub, box: deskBox }, "Nela");
  const entry = withDesk.roster.find((x) => x && x.desk && x.desk.id === deskId);
  if (entry) entry.wrap = Engine.hpkeRules().wrapTeamKey(w.teamKey, deskBox, w.teamId, w.epoch, deskId);
  const written0 = await Team.writeTeam(w.shareDir, withDesk, { key: keyAt, passphrase: "passphrase" });
  Store.chooseSealed(w.tf, w.teamId, true, w.shareDir, written0.written);

  let holdRelay = false;
  let releaseHold = () => {};
  const holdGate = new Promise((resolve) => { releaseHold = resolve; });
  let inHold = false;
  let enteredHold = () => {};
  const holdEntered = new Promise((resolve) => { enteredHold = resolve; });
  const okJson = (obj) => ({ status: 200, bytes: Buffer.from(JSON.stringify(obj)), header: () => null });
  const mockRelay = async (method, url) => {
    if (holdRelay && !inHold) {
      inHold = true;
      enteredHold();
      await holdGate;
    }
    if (/\/hello$/.test(url)) return okJson({ ok: true, challenge: "0123456789abcdef0123456789abcdef" });
    if (/\/session$/.test(url)) return okJson({ ok: true, session: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef", invite: false });
    if (/\/since\/\d+$/.test(url)) return okJson([]);
    return okJson({ ok: true });
  };

  const sh = await loadShellForLock(w.ud, mockRelay);
  try {
    await sh.shell.relaySync();
    const runner = sh.shell.relayRunnerNow();
    if (runner && typeof runner.idle === "function") await runner.idle();

    holdRelay = true;
    const actPromise = sh.ask("studio:member-remove", w.projDir, w.teamId, deskId, true);

    let early = null;
    await Promise.race([holdEntered, actPromise.then((v) => { early = { answered: v }; }, (e) => { early = { threw: String(e && e.message || e) }; }),
      new Promise((r) => setTimeout(r, 60000))]);

    if (!inHold) {
      console.log("       tl1: the removal never reached the relay's answer: " + JSON.stringify(early || { waited: "60 s" }).slice(0, 300));
      return false;
    }

    let secondActStarted = false;
    let secondActSawRemoved = false;

    const secondPromise = (async () => {
      if (typeof sh.shell?.teamAct === "function") {
        return sh.shell.teamAct(w.teamId, async () => {
          secondActStarted = true;
          const facts = await Studio.teamFacts(w.projDir, { key: keyAt, userData: w.ud });
          secondActSawRemoved = !!(facts && facts.team && facts.team.epoch === 2
            && !(facts.team.roster || []).some((m) => m && m.id === deskId));
          return { ok: true };
        });
      }
      return null;
    })();

    await new Promise((r) => setTimeout(r, 50));
    const interleaved = secondActStarted;

    releaseHold();
    const actRes = await actPromise;
    await secondPromise;

    const ok = !interleaved && secondActStarted && secondActSawRemoved && !!(actRes && actRes.removed);
    if (!ok) console.log("       tl1: " + JSON.stringify({ interleaved, secondActStarted, secondActSawRemoved, removed: actRes && actRes.removed || null, actError: actRes && actRes.error || null }));
    return ok;
  } finally {
    releaseHold();
    await stopShell(sh);
  }
});

await leg("tl2 two teams' acts do not wait on each other", async () => {
  const w1 = await makeTestWorld("tl2-a");
  const w2 = await makeTestWorld("tl2-b");
  const sh = await loadShellForLock(w1.ud);
  try {
    if (typeof sh.shell?.teamAct !== "function") return false;

    let releaseTeam1;
    const team1Gate = new Promise((resolve) => { releaseTeam1 = resolve; });
    let team1Running = false;

    const p1 = sh.shell.teamAct(w1.teamId, async () => {
      team1Running = true;
      await team1Gate;
      return "team1-done";
    });

    for (let i = 0; i < 200; i++) {
      if (team1Running) break;
      await new Promise((r) => setTimeout(r, 10));
    }

    let team2Done = false;
    const p2 = sh.shell.teamAct(w2.teamId, async () => {
      team2Done = true;
      return "team2-done";
    });

    const res2 = await p2;
    const team2FinishedBefore1 = team2Done && team1Running && (res2 === "team2-done");

    releaseTeam1();
    await p1;

    return team2FinishedBefore1;
  } finally {
    sh.done();
  }
});

await leg("tl3 a nested same-key act throws, and with its plant lifted it times out", async () => {
  const w = await makeTestWorld("tl3");
  const sh = await loadShellForLock(w.ud);
  try {
    if (typeof sh.shell?.teamAct !== "function") return false;

    let thrown = null;
    try {
      await sh.shell.teamAct(w.teamId, async () => {
        await sh.shell.teamAct(w.teamId, async () => {
          return "nested-inner";
        });
      });
    } catch (e) {
      thrown = e;
    }

    return thrown !== null && /nested/i.test(thrown.message || String(thrown));
  } finally {
    sh.done();
  }
});

await leg("tl5 a watch started during an act runs outside it once the act ends, and admits with no nested act", async () => {
  clearScratch(path.join(SCRATCH, "tl5"));
  /* On the relay (was: a team kept for a shared folder, which the watch no longer looks at; the folder team's removal). */
  const w = await makeTestWorld("tl5", { relay: true });
  const sh = await loadShellForLock(w.ud);
  const err = trapErr();
  try {
    if (typeof sh.shell.teamWatch !== "function") return false;
    for (let i = 0; i < 200; i++) {
      if (!sh.shell.teamWatchNow()) break;
      await new Promise((r) => setTimeout(r, 25));
    }
    const invSecret = crypto.randomBytes(16).toString("hex");
    const invId = Engine.inviteRules().inviteIdOf(invSecret);
    Store.keepInvite(w.tf, TEST_VAULT, w.teamId, {
      id: invId, secret: invSecret, made: new Date().toISOString(),
      expires: new Date(Date.now() + 86400000).toISOString(), name: "Lead",
    });
    const desk = askToJoin(w.shareDir, w.teamId, { id: invId, secret: invSecret });
    let watchJob = null;
    await sh.shell.teamAct(w.teamId, async () => {
      watchJob = sh.shell.teamWatch(w.shareDir);
      await new Promise((r) => setTimeout(r, 300));
    });
    let jobRes = null;
    try { if (watchJob) jobRes = await within(25000, watchJob); } catch { return false; }
    for (let i = 0; i < 40; i++) {
      const running = sh.shell.teamWatchNow();
      if (!running) break;
      try { await within(25000, running); } catch { break; }
    }
    const reply = await within(15000, sh.ask("studio:desks", w.projDir));
    const said = err.text();
    const stopped = said.indexOf("the team watch stopped") >= 0;
    const nested = said.indexOf("teamAct nested") >= 0;
    const ok = admittedInvite(reply, desk) && !stopped && !nested;
    if (!ok) process.stderr.write("tl5 " + JSON.stringify({ admitted: admittedInvite(reply, desk), stopped, nested, said: said.slice(0, 300), joinStill: fs.existsSync(path.join(w.shareDir, "desks", String(desk), "join.json")),
      teamRoster: (() => { try { return JSON.parse(fs.readFileSync(path.join(w.shareDir, "etiuda-team.json"), "utf8")).roster.length; } catch { return -1; } })(), desk, jobRes: JSON.stringify(jobRes),
      reply: JSON.stringify(reply).slice(0, 200) }) + "\n");
    return ok;
  } finally {
    err.stop();
    await stopShell(sh);
  }
});

/* Board 962 stage 5, T3 (the test architect's read of T1 r2): the relay runner's team writes take the lock through the runner's own
   way in (runnerTeamAct, its d.teamAct). The relay sync runs outside every act, so its write reaches the lock from outside the act
   that awaits it: lent by that act's awaited sync, it completes inside the act; with no lend it waits for the act to end. */
await leg("tl6 a runner write during an act completes: waiting outside the act, it runs once the act awaits the sync, and a lend ends with the act", async () => {
  const w = await makeTestWorld("tl6");
  const sh = await loadShellForLock(w.ud);
  try {
    const S = sh.shell;
    if (typeof S.runnerTeamAct !== "function" || typeof S.lendingTo !== "function") return false;
    const free = await within(2000, S.runnerTeamAct(w.teamId, async () => "free"));
    let holding = false, wrote = false, sawInside = false, go;
    const proceed = new Promise((r) => { go = r; });
    const act = S.teamAct(w.teamId, async () => {
      holding = true;
      const { write } = await proceed;
      await S.lendingTo(() => write);
      sawInside = wrote;
    });
    for (let i = 0; i < 100 && !holding; i++) await new Promise((r) => setTimeout(r, 5));
    const write = S.runnerTeamAct(w.teamId, async () => { wrote = true; });
    await new Promise((r) => setTimeout(r, 60));
    const waited = !wrote;
    go({ write });
    let completed = false;
    try { await within(3000, act); completed = true; } catch { completed = false; }
    /* A second act lends nothing: a write from outside waits for it to end, so the first act's lend did not outlive it. */
    let wrote2 = false, endB;
    const holdB = new Promise((r) => { endB = r; });
    let inB = false;
    const actB = S.teamAct(w.teamId, async () => { inB = true; await holdB; });
    for (let i = 0; i < 100 && !inB; i++) await new Promise((r) => setTimeout(r, 5));
    const write2 = S.runnerTeamAct(w.teamId, async () => { wrote2 = true; });
    await new Promise((r) => setTimeout(r, 60));
    const heldBack = !wrote2;
    endB();
    await within(3000, actB);
    await within(3000, write2);
    const ok = free === "free" && waited && completed && sawInside && heldBack && wrote2;
    if (!ok) process.stderr.write("tl6 " + JSON.stringify({ free, waited, completed, sawInside, heldBack, wrote2 }) + NL);
    return ok;
  } finally {
    await stopShell(sh);
  }
});

/* Round two of T3 (the test architect's read of 973f615f, 1): a sync the act asked without awaiting keeps its lend past the act's last
   line. The runner write it let in must return before the next act on the team starts its body: the two never overlap. */
await leg("tl7 a lend that outlives its act: the lent runner write and the next act's body never overlap", async () => {
  const w = await makeTestWorld("tl7");
  const sh = await loadShellForLock(w.ud);
  try {
    const S = sh.shell;
    if (typeof S.runnerTeamAct !== "function" || typeof S.lendingTo !== "function") return false;
    const order = [];
    let holding = false, go;
    const proceed = new Promise((r) => { go = r; });
    const act = S.teamAct(w.teamId, async () => {
      holding = true;
      const { write } = await proceed;
      S.lendingTo(() => write);
      order.push("act-end");
    });
    for (let i = 0; i < 100 && !holding; i++) await new Promise((r) => setTimeout(r, 5));
    const write = S.runnerTeamAct(w.teamId, async () => {
      order.push("write-in");
      await new Promise((r) => setTimeout(r, 150));
      order.push("write-out");
    });
    await new Promise((r) => setTimeout(r, 30));
    const next = S.teamAct(w.teamId, async () => { order.push("next-body"); });
    go({ write });
    await within(5000, act); await within(5000, next); await within(5000, write);
    const i = order.indexOf("write-in"), o = order.indexOf("write-out"), n = order.indexOf("next-body");
    const apart = i >= 0 && o > i && n >= 0 && (n > o || n < i);
    if (!apart) process.stderr.write("tl7 " + JSON.stringify(order) + NL);
    return apart;
  } finally {
    await stopShell(sh);
  }
});

/* Round two of T3 (the read of 973f615f, 2): a sync run once from inside an act (relayOnce) runs the runner outside every act; lent, a
   team write in it finishes. Every relayOnce inside an act goes through that lend: the one bare call left is relaySync's own. */
await leg("tl8 a sync run once inside an act with a team write in it finishes, and every relayOnce in an act is lent", async () => {
  const w = await makeTestWorld("tl8");
  const sh = await loadShellForLock(w.ud);
  try {
    const S = sh.shell;
    if (typeof S.relayOnceLent !== "function" || typeof S.outsideActs !== "function") return false;
    let wrote = false, done = false;
    const job = () => S.outsideActs(async () => {
      await new Promise((r) => setTimeout(r, 10));
      return S.runnerTeamAct(w.teamId, async () => { wrote = true; });
    });
    try { await within(3000, S.teamAct(w.teamId, () => S.relayOnceLent(job))); done = true; } catch { done = false; }
    const src = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
    const bare = (src.match(/await relayOnce\(\)/g) || []).length;
    const ok = done && wrote && bare === 1 && /relayBusy = activeTeamActs\.exit[\s\S]{0,400}await relayOnce\(\)/.test(src);
    if (!ok) process.stderr.write("tl8 " + JSON.stringify({ done, wrote, bare }) + NL);
    return ok;
  } finally {
    await stopShell(sh);
  }
});

// ---- Plant verification -------------------------------------------------------------------------

async function runPlantProof(tag, legId, fileRel, timeoutMs, hangs) {
  const { plantsTree, treeSha, dropPlantsTree } = await import("./plants-tree.mjs");
  const beforeSha = treeSha(ROOT);
  const targetRel = fileRel || "shell/main.js";
  const targetAbs = path.join(ROOT, targetRel);
  const fileSha = () => crypto.createHash("sha256").update(fs.readFileSync(targetAbs)).digest("hex");
  const want = fileSha();
  const copy = plantsTree(ROOT, "team-lock-plant-" + tag);
  let red = false, hits = 0, why = "";
  try {
    const at = path.join(copy, targetRel);
    const text = fs.readFileSync(at, "utf8");
    const nl = text.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
    const lines = text.split(nl);
    const mark = "/* plant:" + tag + " */";
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].indexOf(mark) >= 0) hits++;
    }
    if (hits === 1) {
      fs.writeFileSync(at, lines.filter((l) => l.indexOf(mark) < 0).join(nl));
      /* A leg that skips (its scene not set, under load) proves nothing about the plant, so it is tried again, three times at most. */
      for (let attempt = 0; attempt < 3; attempt++) {
        const child = spawnSync(process.execPath, [path.join(copy, "tests", "team-lock.mjs")], {
          cwd: copy,
          encoding: "utf8",
          timeout: timeoutMs || 60000,
          env: Object.assign({}, process.env, { TEAM_LOCK_ONLY: legId, ETIUDA_PLANTS: "off" }),
        });
        const said = String(child.stdout || "") + String(child.stderr || "");
        /* A child the timeout killed has status null: it neither failed nor passed, so it is not read as red (the test architect,
           2026-11-09: three team-lock reds under load, each 1 failed and 1 skipped, green alone). */
        const killed = child.status === null;
        red = said.indexOf("FAIL " + legId) >= 0 || (killed ? !!hangs : child.status !== 0); /* plant:tlp-killed-not-red */
        if (red) break;
        if (killed) { why = legId + " timed out at " + (timeoutMs || 60000) + " ms"; continue; }
        if (said.indexOf("SKIP " + legId) >= 0) { why = legId + " skipped: its scene was not set"; continue; }
        why = "";
        break;
      }
    }
  } finally {
    dropPlantsTree(copy, ROOT);
  }
  const back = fileSha() === want && treeSha(ROOT) === beforeSha;
  /* Three tries that never set the scene prove nothing about the plant either way: "skip", with the cause. */
  if (hits === 1 && !red && back && why) return { skip: why };
  return hits === 1 && red && back;
}

/* A-S5: Studio keeps no mirror of a team's folder since its shared-folder syncer went. What an older build left under
   folder-mirror/<team>/ is the lead's own (an edition its outbox still owed among it), so it is neither read as the team, nor
   written, nor removed; the team is read and written at its folder, as it always was where no mirror ran. */
await leg("tl9 an older Studio's mirror of a folder team, its owed outbox and a newer team file in it, is left byte for byte through a start, a watch look and the Desks screen, which reads the team at its folder", async () => {
  clearScratch(path.join(SCRATCH, "tl9"));
  const w = await makeTestWorld("tl9");
  const mirror = path.join(w.ud, "folder-mirror", w.teamId);
  fs.mkdirSync(mirror, { recursive: true });
  const atShare = (await Team.heldTeam(w.shareDir, { key: path.join(w.ud, Sign.KEY_FILE) })).team;
  /* Signed by the lead's key from a copy of its file elsewhere, so the revision floor kept beside the real one does not rise. */
  const keyCopy = path.join(SCRATCH, "tl9-older-build", Sign.KEY_FILE);
  fs.mkdirSync(path.dirname(keyCopy), { recursive: true });
  fs.copyFileSync(path.join(w.ud, Sign.KEY_FILE), keyCopy);
  await Team.writeTeam(mirror, Team.withCatalog(atShare, "mirror-only"), { key: keyCopy, passphrase: "passphrase" });
  fs.writeFileSync(path.join(mirror, ".primed"), "");
  fs.writeFileSync(path.join(mirror, "unsent.ec"), "an edition the older build had not sent yet.");
  fs.writeFileSync(path.join(mirror, ".outbox.json"), JSON.stringify({ kind: "etiuda-folder-outbox", format: 1,
    owed: { "unsent.ec": { owe: true, sha: crypto.createHash("sha256").update("an edition the older build had not sent yet.").digest("hex") } } }));
  /* Every entry under the mirror, folders included, by its path, mtime and (for a file) sha256. */
  const treeNow = () => {
    const out = [];
    const walk = (dir) => fs.readdirSync(dir).sort().forEach((n) => {
      const at = path.join(dir, n), st = fs.statSync(at), rel = path.relative(mirror, at);
      if (st.isDirectory()) { out.push([rel + "/", st.mtimeMs]); walk(at); }
      else out.push([rel, st.mtimeMs, crypto.createHash("sha256").update(fs.readFileSync(at)).digest("hex")]);
    });
    walk(mirror);
    return JSON.stringify(out);
  };
  const before = treeNow();
  const sh = await loadShellForLock(w.ud);
  try {
    for (let i = 0; i < 200; i++) {
      if (!sh.shell.teamWatchNow()) break;
      await new Promise((r) => setTimeout(r, 25));
    }
    await within(25000, sh.shell.teamWatch(w.shareDir));
    const reply = await within(15000, sh.ask("studio:desks", w.projDir));
    const after = treeNow();
    const atFolder = !!reply && !reply.error && !!reply.team && reply.team.id === w.teamId && reply.team.catalogs === atShare.catalogs.length
      && path.resolve(String(reply.folder || "")) === path.resolve(w.shareDir);
    const ok = before === after && atFolder;
    if (!ok) process.stderr.write("tl9 " + JSON.stringify({ same: before === after, atFolder, error: reply && reply.error,
      catalogs: reply && reply.team && reply.team.catalogs, folder: reply && reply.folder }) + NL);
    return ok;
  } finally {
    await stopShell(sh);
  }
});

if (PLANTS_OFF) {
  skip("tlP plants proved in scratch copy (ETIUDA_PLANTS=off)");
} else {
  await leg("tlP plants proved in scratch copy", async () => {
    const plants = [
      ["team-act", "tl1", "shell/main.js", 90000],
      /* tl3's plant shows itself as a hang, so for it alone a child the timeout killed is the red. */
      ["team-act-nested", "tl3", "shell/main.js", 15000, true],
      ["team-watch-exit", "tl5", "shell/main.js", 60000],
      ["team-lend", "tl6", "shell/main.js", 30000],
      ["team-act-inline", "tl7", "shell/main.js", 30000],
      ["relay-once-lent", "tl8", "shell/main.js", 30000],
    ];
    const skipped = [];
    for (const [tag, legId, file, to, hangs] of plants) {
      const ok = await runPlantProof(tag, legId, file, to, hangs);
      if (ok && typeof ok === "object" && ok.skip) { skipped.push(tag + ": " + ok.skip); continue; }
      if (!ok) {
        process.stderr.write("Plant proof failed for " + tag + " (" + legId + ")\n");
        return false;
      }
    }
    if (skipped.length) { console.log("       tlP: not proved under load: " + skipped.join("; ")); return "skip"; }
    return true;
  });
}

process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + NL);
/* A single leg (TEAM_LOCK_ONLY, the plant child) must be able to pass. The full count is required only of a whole run. */
if (!ONLY && asserted + skipped !== EXPECTED) {
  process.stderr.write("SUITE DID NOT COMPLETE: " + (asserted + skipped) + " of " + EXPECTED + " checks ran" + NL);
  process.exit(78);
}
process.stdout.write("team-lock  " + (asserted - failed) + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)" + NL);
process.exit(failed > 0 ? 1 : 0);
