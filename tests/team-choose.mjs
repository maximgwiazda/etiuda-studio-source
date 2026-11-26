/* A CATALOG CHOOSES ITS TEAM (board 962 stage 5, T3; the design note team-962-stage5-design-2026-11-08, 3.1 and 3.6's backstop).
 *
 *     node tests/team-choose.mjs
 *
 * gate-kind: node
 *
 * tc1   on a folder team, catalog B joins A's team: rev plus one listing both, the share's ring vouching both, B's edition sealed
 *       under the team key at the root, B's project pointed at the share under the team, and the head's editions naming both
 * tc2   on a relay mirror, B joins A's team: the ring inside the signed team file vouches both, the project names the relay and lead
 * tc3   refused by its sentence with nothing written: B has a team, another key's team, a Plain team, B's id on another team of
 *       this Studio, B's fixed file name held by another catalog at the root
 * tc4   through the shell's studio:team-choose, refused by its sentence with nothing written: a move of the team under way, a
 *       handover under way, a team this Studio does not keep, a relay team whose move the relay was not told of, a relay team past its
 *       grant; and one that lands
 * tc5   a choose stopped after step 4 and after step 5, then pressed again, ends whole
 * tc6   a publish from the screen writes the team file inside the team's lock, and keeps the file it wrote as entry.file
 * tc7   a team file at the catalog's own place that cannot be read refuses the choose, nothing written (T3 round two)
 * tc8   writeTeam refuses to write over a team file it cannot read (T3 round two)
 * 962s5v writeTeam handed a team below the file's rev refuses it as stale and writes nothing, under this key file and under a
 *       copy of the key with no floor beside it (the lead's other computer)
 * 1013sw1 the lead's switch for sharing cards (board 1013, piece 6): off writes sharing "off" into the signed team file, on takes it
 *       out, a team file with no field reads on and its bytes do not change, and the verb answers the screen's facts
 * 962s5k a handover writes relay.lead into every library project of the team, not only the one pressed
 * tc9   on a folder team, the choose writes no head: none stood before and none stands after, the catalog still carried (was: the head named
 *       the joining catalog at the choose, before any publish, beside the team's other catalog; Studio writes no head at a shared folder now)
 * tc1015a (board 1015) a team catalog made from a member's genuine desk file is listed in the team file's `adopted` as {catalog, desk, original},
 *       original the SHA-256 of the personal id, never the id; the pinned engine reads the file whole and its answers do not move
 * tcP   plants proved in a scratch copy
 */
import "./reg-stand-on.mjs";
import { licensedOpts } from "./licensed.mjs";
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
import * as Pub from "../src/publish.mjs";
import * as Studio from "../src/studio.mjs";
import { clearScratch } from "./scratch.mjs";
import { seatEnv } from "./seated.mjs";
import { olderFolderTeam } from "./older-folder-team.mjs"; /* the folder team is made by the fixture, not by Studio (the folder team's removal) */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "team-choose");
const nodeRequire = createRequire(import.meta.url);
const NL = "\n";
const PASS = "harbour-lamp-passphrase";
const ONLY = process.env.TEAM_CHOOSE_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const EXPECTED = 14;

let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + NL);
  else { failed++; process.stderr.write("  FAIL " + line + NL); }
}
function skip(line) { skipped++; process.stdout.write("  SKIP " + line + NL); }
async function leg(line, fn) {
  const id = (/^(\S+)/.exec(line) || [])[1] || line;
  if (ONLY && id !== ONLY) return;
  try { check(!!(await fn()), line); } catch (err) { check(false, line + " (threw: " + String(err && err.message || err) + ")"); }
}
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const said = (e) => String(e && (e.said && (e.said.frame || e.said.text || e.said)) || (e && e.message) || "");
function snap(dirs) {
  const out = {};
  const walk = (d, rel) => {
    let ents = [];
    try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const p = path.join(d, e.name), r = rel ? rel + "/" + e.name : e.name;
      if (e.isDirectory()) walk(p, r); else out[r] = sha(fs.readFileSync(p));
    }
  };
  for (const [k, d] of Object.entries(dirs)) walk(d, k);
  return JSON.stringify(out);
}
async function refusedBy(job, frame) {
  try { await job; return "landed"; } catch (e) { const t = said(e); return t.indexOf(frame.slice(0, 40)) >= 0 ? true : t; }
}

const TEST_VAULT = {
  isEncryptionAvailable: () => true, available: () => true,
  seal: (t) => Buffer.from("sealed:" + Buffer.from(String(t), "utf8").reverse().toString("hex"), "utf8"),
  open: (b) => { const t = Buffer.from(b).toString("utf8"); if (!t.startsWith("sealed:")) throw new Error("not sealed here"); return Buffer.from(t.slice(7), "hex").reverse().toString("utf8"); },
  encryptString: (s) => Buffer.from("sealed:" + Buffer.from(String(s), "utf8").reverse().toString("hex"), "utf8"),
  decryptString: (b) => { const t = Buffer.from(b).toString("utf8"); if (!t.startsWith("sealed:")) throw new Error("not sealed here"); return Buffer.from(t.slice(7), "hex").reverse().toString("utf8"); },
};

/* A Studio with catalog A on a sealed folder team that has published, and catalog B published to a place of its own, with no team. */
async function folderWorld(tag, o) {
  const ud = path.join(SCRATCH, tag);
  clearScratch(ud);
  const projects = path.join(ud, "projects");
  fs.mkdirSync(projects, { recursive: true });
  const keyPath = path.join(ud, Sign.KEY_FILE);
  fs.writeFileSync(keyPath, JSON.stringify(await Sign.makeKeyFile({ passphrase: PASS }), null, 1) + NL);
  const keyDoc = Sign.readKeyFile(keyPath);
  const share = path.join(ud, "share"), own = path.join(ud, "own-b");
  fs.mkdirSync(share, { recursive: true }); fs.mkdirSync(own, { recursive: true });
  const make = async (name, title) => {
    const dir = (await Studio.newProject(projects, name, [{ code: "en", name: "English" }])).dir;
    const shelf = (await Studio.addTag(dir, "shelf", { en: "General" })).tag.id;
    await Studio.addCard(dir, shelf, title, "The answer, in full.");
    return dir;
  };
  const A = await make("Alpha", "Alpha card"), B = await make("Beta", "Beta card");
  await Studio.setPublishFolder(A, share);
  await Studio.setPublishFolder(B, own);
  const tf = Store.teamsFile(ud);
  const teamId = "t-" + crypto.randomBytes(8).toString("hex"), teamKey = crypto.randomBytes(32);
  Store.keepTeamKey(tf, TEST_VAULT, teamId, 1, teamKey);
  const teamKeys = { [teamId]: { 1: teamKey } };
  const sealed = await olderFolderTeam(A, { key: keyPath, passphrase: PASS, teamId, teamKeys });
  Store.chooseSealed(tf, teamId, true, share, sealed.written);
  const signed = { leadKey: keyPath, key: keyPath, passphrase: PASS, ...(await licensedOpts()) };
  if (!(o && o.quietA)) await Studio.publishProject(A, Object.assign({ folder: share, notes: "A one.", now: "2026-11-08T07:00:00.000Z", teamKeys }, signed));
  await Studio.publishProject(B, Object.assign({ folder: own, notes: "B one.", now: "2026-11-08T07:05:00.000Z", teamKeys: {} }, signed));
  const idOf = (dir) => String(Pub.readProject(dir).draft.id);
  return { ud, projects, keyPath, keyDoc, share, own, A, B, tf, teamId, teamKey, teamKeys, idA: idOf(A), idB: idOf(B) };
}
const chooseOpts = (w, more) => Object.assign({ key: w.keyPath, passphrase: PASS, teamId: w.teamId, folder: w.share, work: w.share,
  relay: null, elsewhere: [], teamKeys: w.teamKeys, userData: w.ud }, more || {});
const projectOf = (dir) => JSON.parse(fs.readFileSync(path.join(dir, "project.json"), "utf8"));

/* A relay team for A, started as the shell starts one, with B published to a place of its own. */
async function relayWorld(tag) {
  const w = await folderWorld(tag);
  const C = await Studio.newProject(w.projects, "Gamma", [{ code: "en", name: "English" }]);
  const shelf = (await Studio.addTag(C.dir, "shelf", { en: "General" })).tag.id;
  await Studio.addCard(C.dir, shelf, "Gamma card", "The answer, in full.");
  const rt = Relay.relayId(), teamId = "t-" + crypto.randomBytes(8).toString("hex"), teamKey = crypto.randomBytes(32);
  Store.keepTeamKey(w.tf, TEST_VAULT, teamId, 1, teamKey);
  const mirror = Store.keepRelay(w.tf, teamId, rt, Relay.RELAY_URL);
  const teamKeys = Object.assign({}, w.teamKeys, { [teamId]: { 1: teamKey } });
  const r = await Studio.startRelayTeam(C.dir, { key: w.keyPath, passphrase: PASS, teamId, rt, url: Relay.RELAY_URL, mirror, teamKeys, userData: w.ud });
  Store.chooseSealed(w.tf, teamId, true, mirror, r.written);
  return Object.assign(w, { C: C.dir, rt, relayTeam: teamId, relayKey: teamKey, mirror, teamKeys, idC: String(Pub.readProject(C.dir).draft.id) });
}

// ---- the shell, under a stub electron ---------------------------------------------------------------------------------------------
/* A lead signed in, the path a customer walks: with a provider offered, a Studio nobody signed in to holds publishing to a team,
   statistics and proposals (night decision 16; sign-in.mjs si77 and licence-studio ls16a hold that state). */
const signedIn = (ud) => fs.writeFileSync(path.join(ud, "licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft" }));
async function loadShell(ud, thread, more) {
  const Module = nodeRequire("node:module");
  const main = path.join(ROOT, "shell", "main.js"), ui = path.join(ROOT, "ui", "index.html");
  const got = { handlers: {}, windows: [] };
  class Win {
    constructor() { this.webContents = { id: 1, on() {}, once() {}, send() {}, setWindowOpenHandler() {}, getURL: () => pathToFileURL(ui).href }; got.windows.push(this); }
    on() {} once() {} isDestroyed() { return false; } isMaximized() { return false; } isMinimized() { return false; }
    close() {} focus() {} restore() {} loadFile() {} show() {} showInactive() {} setMinimumSize() {}
  }
  const electron = {
    app: { commandLine: { appendSwitch() {}, hasSwitch: () => false, removeSwitch() {} }, getPath: () => ud, getVersion: () => "0.0.0",
      getLocale: () => "en-GB", requestSingleInstanceLock: () => true, whenReady: () => Promise.resolve(), on() {}, quit() {}, exit() {} },
    BrowserWindow: Object.assign(Win, { fromWebContents: () => got.windows[0] || null, getAllWindows: () => got.windows }),
    Menu: { setApplicationMenu() {}, buildFromTemplate: () => ({ popup() {} }) },
    dialog: { showMessageBox: () => Promise.resolve({ response: 0 }), showOpenDialog: () => Promise.resolve({ canceled: true, filePaths: [] }),
      showSaveDialog: () => Promise.resolve({ canceled: true, filePath: "" }) },
    nativeTheme: { themeSource: "system", shouldUseDarkColors: false }, clipboard: { writeText() {} }, safeStorage: TEST_VAULT,
    screen: { getAllDisplays: () => [], getPrimaryDisplay: () => ({}), on() {}, removeListener() {} },
    session: { defaultSession: { setPermissionRequestHandler() {}, setPermissionCheckHandler() {}, setDevicePermissionHandler() {},
      setSpellCheckerLanguages() {}, setSpellCheckerDictionaryDownloadURL() {}, setSpellCheckerEnabled() {} } },
    shell: { openPath: () => Promise.resolve(""), trashItem: () => Promise.resolve() },
    ipcMain: { handle: (ch, fn) => { got.handlers[ch] = fn; }, on() {} },
    net: { fetch: () => Promise.reject(new Error("network forbidden")) },
  };
  const quiet = { on() {}, unref() {}, kill() {}, pid: 0, stdout: { on() {} }, stderr: { on() {} }, stdin: { end() {}, write() {} } };
  const cp = { execFileSync: () => "", execSync: () => "", spawnSync: () => ({ status: 0, stdout: "", stderr: "" }), execFile: () => quiet, spawn: () => quiet, exec: () => quiet, fork: () => quiet };
  const env = Object.assign({ STUDIO_NO_PROXY_SERVER: "off", STUDIO_TEST_OFFSCREEN: "1", STUDIO_KEY_PASSPHRASE: PASS,
    STUDIO_PROJECTS: path.join(ud, "projects"), STUDIO_SIGNING_KEY: path.join(ud, Sign.KEY_FILE), STUDIO_TEST_RELAY_SYNC: "none" }, more || {});
  const was = {};
  /* A Studio that works, as a lead's does (the gate refuses a closed channel of one that does not). */
  Object.assign(env, await seatEnv(ud, true, (more || {})), (more || {}));
  for (const k of Object.keys(env)) { was[k] = process.env[k]; process.env[k] = env[k]; }
  const load = Module._load, before = new Set(Object.keys(nodeRequire.cache));
  const dropCache = () => { delete nodeRequire.cache[main]; for (const k of Object.keys(nodeRequire.cache)) if (!before.has(k)) delete nodeRequire.cache[k]; };
  Module._load = function (req) {
    if (req === "electron") return electron;
    if (req === "node:child_process" || req === "child_process") return cp;
    if (/studio-thread\.cjs$/.test(req)) return { call: async (verb, ...a) => thread(verb, ...a) };
    return load.apply(this, arguments);
  };
  const restore = () => { Module._load = load; dropCache(); for (const k of Object.keys(was)) { if (was[k] === undefined) delete process.env[k]; else process.env[k] = was[k]; } };
  try {
    dropCache();
    const shell = nodeRequire(main);
    const event = { senderFrame: { parent: null, url: pathToFileURL(ui).href }, sender: got.windows[0] && got.windows[0].webContents };
    return { shell, ask: async (ch, ...a) => { const fn = got.handlers[ch]; if (!fn) throw new Error("no handler for " + ch); return fn(event, ...a); },
      done: async () => { try { if (shell.endRelay) await Promise.race([shell.endRelay(), new Promise((r) => setTimeout(r, 3000))]); } catch { /* exit stops it */ } restore(); } };
  } catch (err) { restore(); throw err; }
}
const studioThread = (verb, ...a) => { if (typeof Studio[verb] === "function") return Studio[verb](...a); throw new Error("no verb " + verb); };

// ---- the legs ----------------------------------------------------------------------------------------------------------------------
await leg("tc1 on a folder team, B joins A's team: rev plus one listing both, the ring vouching both, B sealed at the root, B pointed at the share, the head naming both", async () => {
  const w = await folderWorld("tc1");
  const before = (await Team.readTeam(w.share)).team;
  const r = await Studio.chooseTeam(w.B, chooseOpts(w));
  const after = (await Team.heldTeam(w.share, { key: w.keyPath })).team;
  const listed = !!after && after.rev === before.rev + 1 && after.catalogs.indexOf(w.idA) >= 0 && after.catalogs.indexOf(w.idB) >= 0;
  const ring = (Ring.readRingFile(Ring.ringPath(w.share)) || {}).doc || { keys: [] };
  const vouched = [w.idA, w.idB].every((id) => ring.keys.some((k) => k && (k.catalog === id || (Array.isArray(k.catalogs) && k.catalogs.indexOf(id) >= 0)) && k.public === w.keyDoc.public));
  const name = Pub.fixedName(w.B, projectOf(w.B), w.idB, w.B);
  const sealedThere = !!name && Pub.holdsId(path.join(w.share, name), w.idB, w.teamKeys) && !Pub.holdsId(path.join(w.share, name), w.idB, {});
  const p = projectOf(w.B);
  const pointed = path.resolve(p.folder) === path.resolve(w.share) && p.sealedTeam === w.teamId && !p.relay;
  const eds = Relay.editionsLed(w.share, after, w.teamKeys[w.teamId]).map((e) => e && e.catalog).sort();
  const head = eds.indexOf(w.idA) >= 0 && eds.indexOf(w.idB) >= 0;
  const ok = listed && vouched && sealedThere && pointed && head && r.carried === true;
  if (!ok) process.stderr.write("tc1 " + JSON.stringify({ listed, vouched, sealedThere, pointed, head, eds, carried: r.carried }) + NL);
  return ok;
});

await leg("tc2 on a relay mirror, B joins A's team: the ring inside the signed team file vouches both, the project names the relay and the lead", async () => {
  const w = await relayWorld("tc2");
  const before = (await Team.heldTeam(w.mirror, { key: w.keyPath })).team;
  const r = await Studio.chooseTeam(w.B, chooseOpts(w, { teamId: w.relayTeam, folder: w.mirror, work: w.mirror, relay: { rt: w.rt, url: Relay.RELAY_URL } }));
  const after = (await Team.heldTeam(w.mirror, { key: w.keyPath })).team;
  const listed = !!after && after.rev === before.rev + 1 && after.catalogs.indexOf(w.idC) >= 0 && after.catalogs.indexOf(w.idB) >= 0;
  const inside = !!after && !!after.ring && after.ring.keys.some((k) => k && k.catalog === w.idB && k.public === w.keyDoc.public);
  const p = projectOf(w.B);
  const pointed = path.resolve(p.folder) === path.resolve(w.mirror) && p.sealedTeam === w.relayTeam && !!p.relay && p.relay.rt === w.rt && p.relay.lead === w.keyDoc.public;
  const ok = listed && inside && pointed && r.carried === true;
  if (!ok) process.stderr.write("tc2 " + JSON.stringify({ listed, inside, pointed, carried: r.carried }) + NL);
  return ok;
});

await leg("tc3 refused by its sentence with nothing written: has a team, another key's team, a Plain team, the id on another team, a same-named file", async () => {
  const w = await folderWorld("tc3");
  const look = () => snap({ share: w.share, b: w.B, own: w.own });
  const out = {};
  /* B has a team: its project names one. */
  const pj = projectOf(w.B), withTeam = Object.assign({}, pj, { sealedTeam: "t-" + "a".repeat(16) });
  fs.writeFileSync(path.join(w.B, "project.json"), JSON.stringify(withTeam, null, 1) + NL);
  let was = look();
  out.has = await refusedBy(Studio.chooseTeam(w.B, chooseOpts(w)), "This catalog has a team already") === true && look() === was;
  fs.writeFileSync(path.join(w.B, "project.json"), JSON.stringify(pj, null, 1) + NL);
  /* Another key's team: this Studio's key is not the one the team names. */
  const other = path.join(w.ud, "other-key.json");
  fs.writeFileSync(other, JSON.stringify(await Sign.makeKeyFile({ passphrase: PASS }), null, 1) + NL);
  was = look();
  out.other = await refusedBy(Studio.chooseTeam(w.B, chooseOpts(w, { key: other })), "The team file in {FOLDER} is not the team") === true && look() === was;
  /* The id on another team of this Studio. */
  was = look();
  out.elsewhere = await refusedBy(Studio.chooseTeam(w.B, chooseOpts(w, { elsewhere: [w.idB] })), "This catalog is on another team") === true && look() === was;
  /* A same-named file holding another catalog at the root: A's own edition put there under B's fixed name. */
  const name = Pub.fixedName(w.B, projectOf(w.B), w.idB, w.B), aName = Pub.fixedName(w.A, projectOf(w.A), w.idA, w.A);
  fs.copyFileSync(path.join(w.share, aName), path.join(w.share, name));
  was = look();
  out.taken = await refusedBy(Studio.chooseTeam(w.B, chooseOpts(w)), "{FOLDER} already holds {FILE}, which is another catalog, so this catalog did not join") === true && look() === was;
  fs.renameSync(path.join(w.share, name), path.join(w.ud, "moved-aside.ec"));
  /* A Plain team: no catalog can choose it. */
  /* Written by the fixture (was: Studio's Plain switch; it writes no folder team now, team-seal fh5). */
  const held0 = (await Team.heldTeam(w.share, { key: w.keyPath })).team;
  await Team.writeTeam(w.share, Team.withSealed(held0, false, null), { key: w.keyPath, passphrase: PASS });
  was = look();
  out.plain = await refusedBy(Studio.chooseTeam(w.B, chooseOpts(w)), "This team's catalogs go out in the clear") === true && look() === was;
  const ok = Object.values(out).every((v) => v === true);
  if (!ok) process.stderr.write("tc3 " + JSON.stringify(out) + NL);
  return ok;
});

await leg("tc4 through the shell: a handover under way, a team not kept here, past its grant, its licence revoked (fetching, and fetched with none), each refused with nothing written; then one lands", async () => {
  const w = await relayWorld("tc4");
  const sh = await loadShell(w.ud, studioThread);
  const out = {};
  try {
    const storeAt = path.join(w.ud, "studio.json");
    const storeWas = fs.existsSync(storeAt) ? fs.readFileSync(storeAt, "utf8") : null;
    const look = () => snap({ share: w.share, mirror: w.mirror, b: w.B });
    const ask = () => sh.ask("studio:team-choose", w.B, w.relayTeam);
    const refusedWith = async (frame) => { const was = look(); const r = await ask(); return !!r && !!r.error && JSON.stringify(r).indexOf(frame.slice(0, 40)) >= 0 && look() === was ? true : r; };
    const putStore = (patch) => fs.writeFileSync(storeAt, JSON.stringify(Object.assign(storeWas ? JSON.parse(storeWas) : {}, patch), null, 1) + NL);
    putStore({ handover: { team: w.relayTeam, step: "(ii)" } });
    out.handover = await refusedWith("A move or a handover of this team is under way");
    if (storeWas === null) fs.writeFileSync(storeAt, "{}\n"); else fs.writeFileSync(storeAt, storeWas);
    /* A team this Studio does not keep: refused in the choose's sentence. */
    { const was = look(); const r = await sh.ask("studio:team-choose", w.B, "t-0123456789abcdef");
      out.notKept = !!r && !!r.error && JSON.stringify(r).indexOf("This Studio does not lead that team as a sealed one") >= 0 && look() === was ? true : r; }
    Store.markRelay(w.tf, w.relayTeam, { lapse: { state: "read-only", until: Date.now() - 86400000, readOnly: Date.now() - 3600000, swept: Date.now() + 86400000 * 30, at: Date.now() } });
    out.grant = await refusedWith("The relay licence for this team has ended");
    Store.markRelay(w.tf, w.relayTeam, { lapse: null });
    /* A licence the relay no longer accepts has its own line (words-t3 item 10): while Studio fetches a new one it says so, and
       once the fetch has come back with none it drops that clause and keeps the rest. */
    const revokedSays = async (fetching) => { const was = look(); const r = await ask(); const said = JSON.stringify(r || "");
      return !!r && !!r.error && said.indexOf("The relay no longer accepts this team's relay licence") >= 0
        && (said.indexOf("Studio is fetching it") >= 0) === fetching && look() === was ? true : r; };
    Store.markRelay(w.tf, w.relayTeam, { revoked: true, revokedNone: false });
    out.revoked = await revokedSays(true);
    Store.markRelay(w.tf, w.relayTeam, { revokedNone: true });
    out.revokedNone = await revokedSays(false);
    Store.markRelay(w.tf, w.relayTeam, { revoked: false, revokedNone: false });
    const r = await ask();
    const kept = Store.keptTeam(w.tf, w.relayTeam);
    out.lands = !!r && !r.error && r.relay === true && !!kept && !!kept.file && kept.file.catalogs.indexOf(w.idB) >= 0 ? true : r;
  } finally { await sh.done(); }
  const ok = Object.values(out).every((v) => v === true);
  if (!ok) process.stderr.write("tc4 " + JSON.stringify(out).slice(0, 600) + NL);
  return ok;
});

await leg("tc5 a choose stopped after step 4 and after step 5, then pressed again, ends whole", async () => {
  const w4 = await folderWorld("tc5a");
  let stop4 = false;
  try { await Studio.chooseTeam(w4.B, chooseOpts(w4, { stopAfter: 4 })); } catch (e) { stop4 = /step 4/.test(String(e && e.message)); }
  const mid4 = (await Team.heldTeam(w4.share, { key: w4.keyPath })).team;
  const name4 = Pub.fixedName(w4.B, projectOf(w4.B), w4.idB, w4.B);
  const listedNoFile = !!mid4 && mid4.catalogs.indexOf(w4.idB) >= 0 && !fs.existsSync(path.join(w4.share, name4)) && !projectOf(w4.B).sealedTeam;
  const headSilent = Relay.editionsLed(w4.share, mid4, w4.teamKeys[w4.teamId]).every((e) => e.catalog !== w4.idB);
  await Studio.chooseTeam(w4.B, chooseOpts(w4));
  const end4 = (await Team.heldTeam(w4.share, { key: w4.keyPath })).team;
  const whole4 = end4.rev === mid4.rev && fs.existsSync(path.join(w4.share, name4)) && projectOf(w4.B).sealedTeam === w4.teamId;
  const w5 = await folderWorld("tc5b");
  let stop5 = false;
  try { await Studio.chooseTeam(w5.B, chooseOpts(w5, { stopAfter: 5 })); } catch (e) { stop5 = /step 5/.test(String(e && e.message)); }
  const name5 = Pub.fixedName(w5.B, projectOf(w5.B), w5.idB, w5.B);
  const mid5 = fs.existsSync(path.join(w5.share, name5)) && !projectOf(w5.B).sealedTeam;
  await Studio.chooseTeam(w5.B, chooseOpts(w5));
  const whole5 = projectOf(w5.B).sealedTeam === w5.teamId && path.resolve(projectOf(w5.B).folder) === path.resolve(w5.share);
  const ok = stop4 && listedNoFile && headSilent && whole4 && stop5 && mid5 && whole5;
  if (!ok) process.stderr.write("tc5 " + JSON.stringify({ stop4, listedNoFile, headSilent, whole4, stop5, mid5, whole5 }) + NL);
  return ok;
});

await leg("962s5v writeTeam handed a team below the file's rev refuses it as stale and writes nothing, under this key file and under a copy of the key with no floor beside it", async () => {
  const w = await folderWorld("s5v");
  const old = (await Team.heldTeam(w.share, { key: w.keyPath })).team;
  await Team.writeTeam(w.share, Team.withExportsSealed(old, !old.exportsSealed), { key: w.keyPath, passphrase: PASS });
  const bytes = fs.readFileSync(Team.teamPath(w.share));
  let here = null;
  try { await Team.writeTeam(w.share, old, { key: w.keyPath, passphrase: PASS }); here = "written"; } catch (e) { here = e && e.stale === true ? "stale" : String(e && e.message); }
  const sameHere = sha(fs.readFileSync(Team.teamPath(w.share))) === sha(bytes);
  /* The lead's other computer: the same key, no floor beside it, holding the older copy. */
  const away = path.join(w.ud, "other-computer");
  fs.mkdirSync(away, { recursive: true });
  const awayKey = path.join(away, Sign.KEY_FILE);
  fs.copyFileSync(w.keyPath, awayKey);
  const copy = (await Team.heldCopy(JSON.parse(JSON.stringify(old)), { key: awayKey })).team;
  let there = null;
  try { await Team.writeTeam(w.share, copy, { key: awayKey, passphrase: PASS }); there = "written"; } catch (e) { there = e && e.stale === true ? "stale" : String(e && e.message); }
  const sameThere = sha(fs.readFileSync(Team.teamPath(w.share))) === sha(bytes);
  const ok = here === "stale" && sameHere && there === "stale" && sameThere;
  if (!ok) process.stderr.write("962s5v " + JSON.stringify({ here, sameHere, there, sameThere }) + NL);
  return ok;
});

await leg("1013sw1 the lead's switch for sharing cards: off writes sharing off into the signed team file, on takes the field out, a team file with no field reads on and its bytes do not change", async () => {
  const w = await folderWorld("sw1");
  const o = { teamKeys: w.teamKeys };
  const strip = (t) => { const x = JSON.parse(JSON.stringify(t)); delete x.sig; delete x.rev; delete x.sharing; delete x.recovery; return x; };
  const was = (await Team.heldTeam(w.share, { key: w.keyPath })).team;
  const unchanged = was.sharing === undefined && JSON.stringify(Team.withSharing(was, true)) === JSON.stringify(was);
  const offR = await Studio.setTeamSharing(w.A, w.keyPath, false, PASS, o);
  const offRead = await Team.readTeam(w.share), off = (await Team.heldTeam(w.share, { key: w.keyPath })).team;
  const onR = await Studio.setTeamSharing(w.A, w.keyPath, true, PASS, o);
  const onRead = await Team.readTeam(w.share), on = (await Team.heldTeam(w.share, { key: w.keyPath })).team;
  const f = { unchanged, offField: !!off && off.sharing === "off" && offRead.valid === true && off.rev === was.rev + 1,
    offFacts: offR.team.sharing === "off" && !!offR.written && offR.written.sharing === "off",
    onGone: !!on && on.sharing === undefined && !("sharing" in on) && onRead.valid === true && on.rev === off.rev + 1,
    onFacts: onR.team.sharing === undefined, rest: JSON.stringify(strip(off)) === JSON.stringify(strip(was)) && JSON.stringify(strip(on)) === JSON.stringify(strip(was)) };
  const ok = Object.keys(f).every((k) => f[k]);
  if (!ok) process.stderr.write("1013sw1 " + JSON.stringify(f) + NL);
  return ok;
});

await leg("962s5k a handover writes relay.lead into every library project of the team, not only the one pressed", async () => {
  const w = await relayWorld("s5k");
  await Studio.chooseTeam(w.B, chooseOpts(w, { teamId: w.relayTeam, folder: w.mirror, work: w.mirror, relay: { rt: w.rt, url: Relay.RELAY_URL } }));
  const newKey = path.join(w.ud, "new-key.json");
  fs.writeFileSync(newKey, JSON.stringify(await Sign.makeKeyFile({ passphrase: PASS }), null, 1) + NL);
  const fresh = Sign.readKeyFile(newKey);
  await Studio.handoverTeam(w.C, { key: newKey, passphrase: PASS, oldKey: w.keyPath, oldPassphrase: PASS, folder: w.mirror, projectsRoot: w.projects,
    userData: w.ud, teamKeys: w.teamKeys });
  const c = projectOf(w.C), b = projectOf(w.B), a = projectOf(w.A);
  const ok = c.relay.lead === fresh.public && b.relay && b.relay.lead === fresh.public && !a.relay;
  if (!ok) process.stderr.write("962s5k " + JSON.stringify({ c: c.relay && c.relay.lead === fresh.public, b: b.relay && b.relay.lead === fresh.public }) + NL);
  return ok;
});

await leg("tc6 a publish from the screen runs inside the team's lock and writes no team file (was: it wrote the team file inside the lock and kept it as teams.json's entry.file)", async () => {
  const w = await folderWorld("tc6", { quietA: true });
  signedIn(w.ud);
  const sh = await loadShell(w.ud, studioThread);
  try {
    if (typeof sh.shell.teamAct !== "function") return false;
    let release;
    const held = new Promise((r) => { release = r; });
    let inAct = false;
    const act = sh.shell.teamAct(w.teamId, async () => { inAct = true; await held; });
    for (let i = 0; i < 100 && !inAct; i++) await new Promise((r) => setTimeout(r, 5));
    let landed = false;
    const pub = sh.ask("studio:publish", w.A, { notes: "A one." }).then((r) => { landed = true; return r; });
    /* Long enough for a publish with no lock to land and write its team file (about a second here). */
    const revsNow = () => [w.share].map((d) => { try { const t = JSON.parse(fs.readFileSync(Team.teamPath(d), "utf8")); return t.id === w.teamId ? t.rev : -1; } catch { return -1; } });
    for (let i = 0; i < 40 && !landed; i++) await new Promise((r) => setTimeout(r, 100));
    const waited = !landed && Math.max(...revsNow()) <= 1;
    release();
    await act;
    const r = await pub;
    const revs = revsNow();
    /* The publish writes no team file at a shared folder any more (the folder team's removal), so the team file stays at its rev and the
       page is handed none (was: the file it wrote was kept as teams.json's entry.file, at a rev above 1). */
    const hidden = !!r && r.teamWritten === undefined;
    const ok = waited && !!r && !r.error && !r.refused && Math.max(...revs) === 1 && hidden;
    if (!ok) process.stderr.write("tc6 " + JSON.stringify({ waited, error: r && (r.error || r.refused), revs, hidden }) + NL);
    return ok;
  } finally { await sh.done(); }
});

await leg("tc7 a team file at the catalog's own place that cannot be read refuses the choose, the target team and the project unchanged", async () => {
  const w = await folderWorld("tc7");
  /* A team file that will not read: a folder in its place, so reading it throws as an unreadable file does. */
  fs.mkdirSync(path.join(w.own, "etiuda-team.json"), { recursive: true });
  const was = snap({ share: w.share, b: w.B });
  const r = await refusedBy(Studio.chooseTeam(w.B, chooseOpts(w)), "The team file in {FOLDER} does not read whole, so it is left as it is.");
  const ok = r === true && snap({ share: w.share, b: w.B }) === was;
  if (!ok) process.stderr.write("tc7 " + JSON.stringify({ r }) + NL);
  return ok;
});

await leg("tc8 writeTeam refuses to write over a team file it cannot read, and leaves it there", async () => {
  const w = await folderWorld("tc8");
  const t = (await Team.heldTeam(w.share, { key: w.keyPath })).team;
  const odd = path.join(w.ud, "odd-place");
  fs.mkdirSync(path.join(odd, "etiuda-team.json"), { recursive: true });
  let r = null;
  try { await Team.writeTeam(odd, t, { key: w.keyPath, passphrase: PASS }); r = "written"; } catch (e) { r = e && e.unreadable === true ? "unreadable" : String(e && e.message); }
  const there = fs.statSync(path.join(odd, "etiuda-team.json")).isDirectory();
  const ok = r === "unreadable" && there;
  if (!ok) process.stderr.write("tc8 " + JSON.stringify({ r, there }) + NL);
  return ok;
});

await leg("tc9 on a folder team, the choose writes no head: none stood before and none stands after, and the catalog is still carried (was: the head named the joining catalog at the choose)", async () => {
  const w = await folderWorld("tc9");
  const headIds = () => { try { return (JSON.parse(fs.readFileSync(path.join(w.share, Relay.HEAD_NAME), "utf8")).editions || []).map((e) => e.catalog).sort(); } catch { return null; } };
  const before = headIds();
  const r = await Studio.chooseTeam(w.B, chooseOpts(w));
  const after = headIds();
  const ok = before === null && r.carried === true && after === null;
  if (!ok) process.stderr.write("tc9 " + JSON.stringify({ before, after, carried: r.carried }) + NL);
  return ok;
});

/* THE TEAM FILE NAMES WHAT WAS MADE OF A MEMBER'S DESK FILE (board 1015, piece 1): `adopted`, one {catalog, desk, original} per team
   catalog the lead made from a member's genuine desk file, `original` the SHA-256 of the personal catalog's id and never the id (a
   personal catalog's id can carry its author's name, and every member reads this file). The pinned engine reads the file whole and
   heeds it as it does without the list, and its lineage, chain and team-listing answers do not move. */
const ORIGINAL_ID = "lovelace-tide-notes";
function pinnedDesk() {
  const src = fs.readFileSync(path.join(ROOT, "engine", "pinned", "shell", "main.js"), "utf8");
  const lineOf = (marker) => {
    const at = src.indexOf(marker);
    if (at < 0 || src.indexOf(marker, at + marker.length) >= 0) throw new Error("slice " + marker);
    const start = src.lastIndexOf("\n", at) + 1, end = src.indexOf("\n", at);
    const line = src.slice(start, end < 0 ? src.length : end).trim();
    if (!line.endsWith(";")) throw new Error("not one line " + marker);
    return line;
  };
  const fnOf = (marker) => {
    const at = src.indexOf(marker);
    if (at < 0 || src.indexOf(marker, at + marker.length) >= 0) throw new Error("slice " + marker);
    let depth = 0, started = false, str = "";
    for (let i = at; i < src.length; i++) {
      const c = src[i];
      if (str) { if (c === "\\") { i++; continue; } if (c === str) str = ""; continue; }
      if (c === "\"" || c === "'") { str = c; continue; }
      if (c === "{") { depth++; started = true; }
      else if (c === "}") { depth--; if (started && depth === 0) return src.slice(at, i + 1); }
    }
    throw new Error("unclosed " + marker);
  };
  const body = [lineOf("const PIN_RE ="), lineOf("const LINEAGE_MAX ="),
    "let lineageAsked = null; let catalogLineage = {}; const catalogLineageSha = {}; let catalogRoots = {};",
    "function persistDeskEnvelope() {} function firstHopSha() { return \"\"; } function leadSignedPin() { return false; }",
    fnOf("function lineageOf("), fnOf("function lineageOfId("), fnOf("function chainListed("), fnOf("function teamListedDoc("),
    "return { lineageOf, chainListed, teamListedDoc };"].join("\n");
  return new Function("catalogSigValid", body)(Engine.folderRules().catalogSigValid);
}
async function genuineDeskFile() {
  const D = Engine.deskRules(), pair = crypto.generateKeyPairSync("ed25519");
  const pub = pair.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  const id = D.branchIdOf(pub);
  const doc = { format: 2, kind: "etiuda-catalog", id: ORIGINAL_ID, rev: 3, name: "Tide notes", langs: [{ code: "en", label: "English" }],
    tags: [{ id: "t-gen", kind: "shelf", label: { en: "General" } }],
    cards: [{ id: "c-one", shelf: "t-gen", bodyShape: "plain", title: { en: "Tide" }, body: { en: "The tide board hangs at the shed." } }],
    desk: { id, key: pub, box: "cd".repeat(32), name: "Ada desk" }, sig: { alg: "Ed25519", keyId: id } };
  doc.sig.value = crypto.sign(null, D.branchSignedBytes(doc), pair.privateKey).toString("hex");
  if (!D.deskFileGenuine(doc, id)) throw new Error("the desk file made for this leg is not genuine");
  return { doc, deskId: id };
}
await leg("tc1015a a team catalog made from a member's desk file is listed in `adopted` as {catalog, desk, sha256 of the original}, signed, whole and heeded by the pinned engine as without it, its lineage and listing answers unmoved; a catalog not made from one adds no entry", async () => {
  const w = await folderWorld("tc1015a");
  const E = Engine, T = Engine.teamRules();
  const beforeText = fs.readFileSync(Team.teamPath(w.share), "utf8");
  const { doc, deskId } = await genuineDeskFile();
  const temp = path.join(w.ud, "temp-copy");
  const landed = await Studio.landCatalog(w.projects, doc, temp, { title: "Tide notes", lang: "en" });
  const newId = String(Pub.readProject(landed.dir).draft.id);
  const want = { catalog: newId, desk: deskId, original: sha(ORIGINAL_ID) };
  await Studio.chooseTeam(landed.dir, chooseOpts(w));
  const afterText = fs.readFileSync(Team.teamPath(w.share), "utf8"), after = JSON.parse(afterText), before = JSON.parse(beforeText);
  const out = {};
  out.entry = Array.isArray(after.adopted) && after.adopted.length === 1 && JSON.stringify(after.adopted[0]) === JSON.stringify(want)
    && Object.keys(after.adopted[0]).sort().join() === "catalog,desk,original";
  out.digestOnly = afterText.indexOf(ORIGINAL_ID) < 0 && /^[0-9a-f]{64}$/.test(String((after.adopted || [{}])[0].original));
  const strip = (t) => { const o = JSON.parse(JSON.stringify(t)); ["sig", "rev", "adopted", "catalogs", "ring", "recovery"].forEach((k) => { delete o[k]; }); return o; };
  out.nothingElse = JSON.stringify(strip(after)) === JSON.stringify(strip(before));
  /* (a) whole and heeded: Studio's own reading, and the pinned engine's reader and its desk's check. */
  const own = await Team.readTeam(w.share);
  const read = T.v2TeamRead(afterText), unsigned = JSON.parse(afterText); delete unsigned.adopted;
  const readWithout = T.v2TeamRead(JSON.stringify(unsigned));
  out.studioReads = !!own.team && own.valid === true && JSON.stringify(own.team.adopted) === JSON.stringify(after.adopted);
  out.engineWhole = !!read.team && !read.problems.length && await T.v2TeamSigState(read.team) === T.states.valid && E.folderRules().teamWhole(after) === true
    && E.folderRules().teamWhole(JSON.parse(beforeText)) === true;
  out.coveredBySig = E.folderRules().teamWhole(unsigned) === false; /* the list is under the lead's signature */
  out.sameCatalogs = !!read.team && !!readWithout.team && JSON.stringify(read.team.catalogs) === JSON.stringify(readWithout.team.catalogs);
  /* (b) the pinned desk's answers for the team catalog, with the list and without it. */
  const open = Sign.unlockKey(Sign.readKeyFile(w.keyPath), PASS);
  const teamCat = { format: 2, kind: "etiuda-catalog", id: newId, rev: 1, name: "Tide notes", cards: [] };
  const signedCat = await Sign.signDocument(JSON.parse(JSON.stringify(teamCat)), { privateKey: open.privateKey, keyId: open.keyId });
  const answers = (team) => {
    const P = pinnedDesk(), use = { catalogs: team.catalogs.map(String), seal: { lead: { public: String(team.lead.public) } } };
    return [signedCat, teamCat, { format: 2, kind: "etiuda-catalog", id: "elsewhere-notes", cards: [] }].map((d) =>
      ({ lineage: P.lineageOf(d), chain: P.chainListed(d, use.catalogs), listed: P.teamListedDoc(d, use) }));
  };
  const a = answers(read.team), b = answers(readWithout.team);
  out.answersSame = JSON.stringify(a) === JSON.stringify(b) && a[0].listed === true && a[0].chain === true && a[1].listed === false && a[2].chain === false;
  /* A catalog not made from a desk file joins and adds no entry. */
  await Studio.chooseTeam(w.B, chooseOpts(w));
  const last = JSON.parse(fs.readFileSync(Team.teamPath(w.share), "utf8"));
  out.noEntryForB = last.catalogs.indexOf(w.idB) >= 0 && Array.isArray(last.adopted) && last.adopted.length === 1 && last.adopted[0].catalog === newId;
  /* A hand import of the same genuine desk file (upgradeLand) keeps the same record; a file that is not a desk's keeps none. */
  const hand = path.join(w.ud, "hand.ec");
  fs.writeFileSync(hand, JSON.stringify(doc));
  const handed = await Studio.upgradeLand(w.projects, hand, "Hand import");
  const plain = path.join(w.ud, "plain.ec"), bare = JSON.parse(JSON.stringify(doc)); delete bare.desk; delete bare.sig;
  fs.writeFileSync(plain, JSON.stringify(bare));
  const plainLanded = await Studio.upgradeLand(w.projects, plain, "Plain import");
  out.handImport = JSON.stringify(projectOf(handed.dir).adoptedFrom) === JSON.stringify({ desk: deskId, original: sha(ORIGINAL_ID) }) && !("adoptedFrom" in projectOf(plainLanded.dir));
  const ok = Object.values(out).every((v) => v === true);
  if (!ok) process.stderr.write("tc1015a " + JSON.stringify(out) + NL);
  return ok;
});

// ---- plants, each proved in a scratch copy ----------------------------------------------------------------------------------------
const PLANTS = [
  ["stale-team", "src/team.mjs", "962s5v", "  if (false)"],
  ["with-catalog-ring", "src/team.mjs", "tc2", "    ;"],
  ["choose-has-team", "src/studio.mjs", "tc3", "  ;"],
  ["choose-elsewhere", "src/studio.mjs", "tc3", "  ;"],
  ["choose-ours", "src/studio.mjs", "tc3", "  ;"],
  ["choose-sealed", "src/studio.mjs", "tc3", "  ;"],
  ["choose-taken", "src/studio.mjs", "tc3", "  if (false)"],
  ["choose-carry", "src/studio.mjs", "tc1", "  const carried = null;"],
  ["choose-project", "src/studio.mjs", "tc1", "  ;"],
  ["handover-every-lead", "src/studio.mjs", "962s5k", "    ;"],
  ["sharing-field", "src/team.mjs", "1013sw1", "  else ;"],
  ["place-under-way", "shell/main.js", "tc4", "  ;"],
  ["place-kept", "shell/main.js", "tc4", "  ;"],
  ["place-grant", "shell/main.js", "tc4", "    ;"],
  ["place-revoked", "shell/main.js", "tc4", "    ;"],
  ["adopted-write", "src/team.mjs", "tc1015a", "  ;"],
  ["choose-own-unread", "src/studio.mjs", "tc7", "      ;"],
  ["publish-team-act", "shell/main.js", "tc6", "  const r = await (async (fn) => fn())(async () => {"],
];
if (PLANTS_OFF || ONLY) {
  skip("tcP plants proved in a scratch copy (" + (PLANTS_OFF ? "ETIUDA_PLANTS=off" : "one leg") + ")");
} else {
  await leg("tcP plants proved in a scratch copy, each turning its leg red, the checkout unchanged", async () => {
    const { plantsTree, treeSha, dropPlantsTree } = await import("./plants-tree.mjs");
    const was = treeSha(ROOT), copy = plantsTree(ROOT, "team-choose");
    const bad = [];
    try {
      for (const [mark, rel, legId, line] of PLANTS) {
        const at = path.join(copy, rel), text = fs.readFileSync(at, "utf8"), lines = text.split("\n");
        const hits = lines.map((l, i) => (l.indexOf("/* plant:" + mark + " */") >= 0 ? i : -1)).filter((i) => i >= 0);
        if (hits.length !== 1) { bad.push(mark + " on " + hits.length + " lines"); continue; }
        const planted = lines.slice(); planted[hits[0]] = line;
        fs.writeFileSync(at, planted.join("\n"));
        const child = spawnSync(process.execPath, [path.join(copy, "tests", "team-choose.mjs")], { cwd: copy, encoding: "utf8", timeout: 120000,
          env: Object.assign({}, process.env, { TEAM_CHOOSE_ONLY: legId, ETIUDA_PLANTS: "off" }) });
        fs.writeFileSync(at, text);
        const red = String(child.stderr || "").indexOf("FAIL " + legId) >= 0 && child.status !== 0;
        if (!red) bad.push(mark + " left " + legId + " green");
      }
    } finally { dropPlantsTree(copy, ROOT); }
    if (bad.length) process.stderr.write("tcP " + bad.join("; ") + NL);
    return !bad.length && treeSha(ROOT) === was;
  });
}

process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + NL);
if (!ONLY && asserted + skipped !== EXPECTED) {
  process.stderr.write("SUITE DID NOT COMPLETE: " + (asserted + skipped) + " of " + EXPECTED + " checks ran" + NL);
  process.exit(78);
}
process.stdout.write("team-choose  " + (asserted - failed) + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)" + NL);
process.exit(failed > 0 ? 1 : 0);
