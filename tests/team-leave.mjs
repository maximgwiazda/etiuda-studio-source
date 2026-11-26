/* A CATALOG TAKEN OFF ITS TEAM, AND MOVED TO ANOTHER OF THE LEAD'S TEAMS (board 962 stage 6, U1; the design note
 * team-962-stage6-design-2026-11-09, 3.1 and 3.2, with its "After Argon" amendments).
 *
 *     node tests/team-leave.mjs
 *
 * gate-kind: node
 *
 * tl1    on a folder team of two catalogs, B taken off: rev plus one listing A only, the ring file without B's entry and with A's,
 *        B's file gone from the root and A's byte for byte, no head written at the folder (was: the head naming A only), B's project with no team and no folder
 * tl2    on a relay mirror, B taken off: the ring inside the signed team file without B's entry and every other entry as it was, B's
 *        file gone from the mirror, B's project with no relay; no head written by the leave, which is left to the runner
 * tl3    the one catalog of a folder team taken off: the team stays, listing none, with no head written, no catalog file and no ring left
 * tl3b   the head stays where a file at the root does not open under the keys held, or opens as no catalog with an id (headGone), so
 *        a key this Studio lacks or a file it cannot read never hides a catalog the team still leads
 * 962s6a a leave stopped after each step (2, 3, 4, 5), then pressed again, ends whole, and a desk reads nothing of B after step 2
 * 962s6b through the shell, B moved from team X to team Y, stopped after each step of the leave and of the choose: at no stop do X
 *        and Y both list B, the project names the move, and a second press finishes it: Y lists B, B's edition is sealed for Y at
 *        Y's root, B's project points at Y with no move standing; a move stopped part way and pressed towards X is put back on X
 * 962s6c two moves in opposite directions at once (B from X to Y, C from Y to X) both finish; neither waits forever
 * 962s6d a publish with no sealing is refused, nothing written, where the folder holds this Studio's sealed team file that does
 *        not list the catalog, another Studio's sealed team file, no team file while teams.json keeps the folder as a sealed team,
 *        an older team file of this Studio's put back saying it does not seal, or where the publish holds no key; a folder whose
 *        team the lead turned to Plain here, and a folder with no team, still take it in the clear
 * tl4    through the shell's studio:team-leave, refused by its sentence with nothing written: a move or handover of the team under
 *        way, a catalog part way through a move, a catalog on no team, a move to the team it is on; then one lands and the kept
 *        team file stops listing B; a catalog the team lists with no project in this library is taken off by team and id
 * tl4r   on a relay team, refused with nothing written: the relay not told of a move, past its grant, its licence revoked
 * tl5    the team lock a catalog part way through a move takes is its old team's
 * tl7    a move whose old team's place has not taken the leave (a relay team, offline) stops with the catalog on no team and the
 *        move standing, said so, and the new team untouched
 * tl1015a    (board 1015) a team catalog's `adopted` entry goes with the catalog when it is taken off the team
 * lgt1   a project naming a relay team this Studio holds no keys for (a fresh profile after a reinstall): lists, opens, publish refused with
 *        nothing written, its Team facts offer to let go, and letting go through the shell clears the mark and the dead mirror place only;
 *        then it can choose a team and start one again
 * lgt2   a team this Studio holds is never offered for letting go, and a let-go asked for it is refused with nothing written
 * lgt4   a teams file that will not read, and one a newer Studio wrote: no let-go offered, letGoTeam refuses, project.json byte for byte
 * lgt3   the Team screen's line, action and question (page stand-in): Cancel asks nothing, Let go asks the shell once
 * tlP    plants proved in a scratch copy
 */
import "./reg-stand-on.mjs";
import { licensedOpts } from "./licensed.mjs";
const LIC = await licensedOpts();
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
const SCRATCH = path.join(ROOT, "scratch", "team-leave");
const nodeRequire = createRequire(import.meta.url);
/* THE PROJECTS FOLDER'S HOLD IS THE STUDIO'S OWN PRESENCE, NOT A WRITE BY A VERB. A Studio takes a hold file in a projects folder that can be
   shared (src/root-hold.cjs), and a folder on a disk other than the system's is taken as one: a checkout on D: with the system on C:, as a
   hosted Windows runner has it, holds every scratch projects folder, where a desk's checkout on its system disk holds none. So a snapshot
   that judges "nothing written" leaves the hold file out (its probe, lock and temporary names included), and a shell a leg is done with
   quits as Studio quits, letting the hold go, so that the next shell in this one process is not refused as another copy of Studio. */
const HOLD_NAME = nodeRequire("../src/root-hold.cjs").HOLD_FILE;
const isHoldPath = (rel) => String(rel).split("/").some((n) => n === HOLD_NAME || n.startsWith(HOLD_NAME + "."));
const NL = "\n";
const PASS = "harbour-lamp-passphrase";
const ONLY = process.env.TEAM_LEAVE_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const EXPECTED = 18;

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
  try { check(!!(await fn()), line); } catch (err) { check(false, line + " (threw: " + String(err && err.stack || err).split("\n").slice(0, 3).join(" / ") + ")"); }
}
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const said = (e) => String(e && (e.said && (e.said.frame || e.said.text || e.said)) || (e && e.message) || "");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms) {
  const end = Date.now() + ms;
  for (;;) { if (fn()) return true; if (Date.now() > end) return false; await wait(100); }
}
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

/* A Studio leading two sealed folder teams: X at `share` with catalogs A and B (B chosen into it, its edition sealed at the root),
   and Y at `share2` with catalog C. `o.noChoose` leaves B on a place of its own with no team. */
async function world(tag, o) {
  const opts = o || {};
  const ud = path.join(SCRATCH, tag);
  clearScratch(ud);
  const projects = path.join(ud, "projects");
  fs.mkdirSync(projects, { recursive: true });
  const keyPath = path.join(ud, Sign.KEY_FILE);
  fs.writeFileSync(keyPath, JSON.stringify(await Sign.makeKeyFile({ passphrase: PASS }), null, 1) + NL);
  const keyDoc = Sign.readKeyFile(keyPath);
  const share = path.join(ud, "share"), share2 = path.join(ud, "share2"), own = path.join(ud, "own-b");
  for (const d of [share, share2, own]) fs.mkdirSync(d, { recursive: true });
  const make = async (name, title) => {
    const dir = (await Studio.newProject(projects, name, [{ code: "en", name: "English" }])).dir;
    const shelf = (await Studio.addTag(dir, "shelf", { en: "General" })).tag.id;
    await Studio.addCard(dir, shelf, title, "The answer, in full.");
    return dir;
  };
  const A = await make("Alpha", "Alpha card"), B = await make("Beta", "Beta card"), C = await make("Gamma", "Gamma card");
  await Studio.setPublishFolder(A, share);
  await Studio.setPublishFolder(B, own);
  await Studio.setPublishFolder(C, share2);
  const tf = Store.teamsFile(ud);
  const teamId = "t-" + crypto.randomBytes(8).toString("hex"), teamKey = crypto.randomBytes(32);
  const teamY = "t-" + crypto.randomBytes(8).toString("hex"), keyY = crypto.randomBytes(32);
  Store.keepTeamKey(tf, TEST_VAULT, teamId, 1, teamKey);
  Store.keepTeamKey(tf, TEST_VAULT, teamY, 1, keyY);
  const teamKeys = { [teamId]: { 1: teamKey }, [teamY]: { 1: keyY } };
  const sx = await olderFolderTeam(A, { key: keyPath, passphrase: PASS, teamId, teamKeys });
  Store.chooseSealed(tf, teamId, true, share, sx.written);
  /* A relay world makes a third team, the most a Studio leads, so it has no Y. */
  if (!opts.noY) {
    const sy = await olderFolderTeam(C, { key: keyPath, passphrase: PASS, teamId: teamY, teamKeys });
    Store.chooseSealed(tf, teamY, true, share2, sy.written);
  } else Store.forgetTeam(tf, teamY);
  const signed = { leadKey: keyPath, key: keyPath, passphrase: PASS, userData: ud, ...(await licensedOpts()) };
  await Studio.publishProject(A, Object.assign({ folder: share, notes: "A one.", now: "2026-11-09T07:00:00.000Z", teamKeys }, signed));
  if (!opts.noY) await Studio.publishProject(C, Object.assign({ folder: share2, notes: "C one.", now: "2026-11-09T07:02:00.000Z", teamKeys }, signed));
  await Studio.publishProject(B, Object.assign({ folder: own, notes: "B one.", now: "2026-11-09T07:05:00.000Z", teamKeys: {} }, signed));
  const idOf = (dir) => String(Pub.readProject(dir).draft.id);
  const w = { ud, projects, keyPath, keyDoc, share, share2, own, A, B, C, tf, teamId, teamKey, teamY, keyY, teamKeys, idA: idOf(A), idB: idOf(B), idC: idOf(C) };
  if (!opts.noChoose) {
    const r = await Studio.chooseTeam(B, chooseOpts(w));
    Store.chooseSealed(tf, teamId, true, share, r.written);
    /* B publishes once on its team, so the head names both catalogs (a choose leaves the folder's head as the last publish wrote it). */
    await Studio.publishProject(B, Object.assign({ folder: share, notes: "B two.", now: "2026-11-09T07:10:00.000Z", teamKeys }, signed));
    Store.chooseSealed(tf, teamId, true, share, (await Team.heldTeam(share, { key: keyPath })).team);
  }
  return w;
}
const chooseOpts = (w, more) => Object.assign({ key: w.keyPath, passphrase: PASS, teamId: w.teamId, folder: w.share, work: w.share,
  relay: null, elsewhere: [], teamKeys: w.teamKeys, userData: w.ud }, more || {});
const leaveOpts = (w, more) => Object.assign({ key: w.keyPath, passphrase: PASS, teamId: w.teamId, folder: w.share, work: w.share,
  relay: null, root: w.projects, teamKeys: w.teamKeys, userData: w.ud }, more || {});
const projectOf = (dir) => JSON.parse(fs.readFileSync(path.join(dir, "project.json"), "utf8"));
const teamAt = (dir) => { try { return JSON.parse(fs.readFileSync(Team.teamPath(dir), "utf8")); } catch { return null; } };
const lists = (dir, id) => { const t = teamAt(dir); return !!t && Array.isArray(t.catalogs) && t.catalogs.indexOf(id) >= 0; };
const ringOf = (dir) => { try { return (Ring.readRingFile(Ring.ringPath(dir)) || {}).doc || null; } catch { return null; } };
/* The .ec files at `dir` sealed for `team` that open as `id`. */
const filesOf = (dir, team, id, keys) => fs.readdirSync(dir).filter((n) => /\.ec$/i.test(n)).filter((n) => {
  try { const d = JSON.parse(fs.readFileSync(path.join(dir, n), "utf8")); return d.kind === Engine.sealRules().SEALED_KIND && d.team === team && Pub.holdsId(path.join(dir, n), id, keys); } catch { return false; }
});
const headEditions = (dir) => { try { return (JSON.parse(fs.readFileSync(path.join(dir, Relay.HEAD_NAME), "utf8")).editions || []).map((e) => e.catalog).sort(); } catch { return null; } };
const freed = (dir) => { const p = projectOf(dir); return !p.sealedTeam && !p.folder && !p.relay && !p.place; };

/* A relay team for catalog D, started as the shell starts one, with B chosen into it (`o.noChoose` leaves B out). */
async function relayWorld(tag, o) {
  const w = await world(tag, { noChoose: true, noY: true });
  const D = (await Studio.newProject(w.projects, "Delta", [{ code: "en", name: "English" }])).dir;
  const shelf = (await Studio.addTag(D, "shelf", { en: "General" })).tag.id;
  await Studio.addCard(D, shelf, "Delta card", "The answer, in full.");
  const rt = Relay.relayId(), relayTeam = "t-" + crypto.randomBytes(8).toString("hex"), relayKey = crypto.randomBytes(32);
  Store.keepTeamKey(w.tf, TEST_VAULT, relayTeam, 1, relayKey);
  const mirror = Store.keepRelay(w.tf, relayTeam, rt, Relay.RELAY_URL);
  const teamKeys = Object.assign({}, w.teamKeys, { [relayTeam]: { 1: relayKey } });
  /* MOVED 2026-11-26 with the folder remnants' retirement. Was: startRelayTeam(D, ...) made the team and took D in one call. Now: the team is made on its own and D joins it by chooseTeam. */
  await Studio.startRelayTeam(null, { key: w.keyPath, passphrase: PASS, teamId: relayTeam, rt, url: Relay.RELAY_URL, mirror, teamKeys, userData: w.ud });
  const r = await Studio.chooseTeam(D, { key: w.keyPath, passphrase: PASS, teamId: relayTeam, folder: mirror, work: mirror, relay: { rt, url: Relay.RELAY_URL },
    elsewhere: [], teamKeys, userData: w.ud });
  Store.chooseSealed(w.tf, relayTeam, true, mirror, r.written);
  const out = Object.assign(w, { D, rt, relayTeam, relayKey, mirror, teamKeys, idD: String(Pub.readProject(D).draft.id) });
  if (!(o && o.noChoose)) {
    const c = await Studio.chooseTeam(w.B, chooseOpts(out, { teamId: relayTeam, folder: mirror, work: mirror, relay: { rt, url: Relay.RELAY_URL } }));
    Store.chooseSealed(w.tf, relayTeam, true, mirror, c.written);
  }
  return out;
}

// ---- the shell, under a stub electron (as tests/team-choose.mjs loads it) ------------------------------------------------------------
async function loadShell(ud, thread, more) {
  const Module = nodeRequire("node:module");
  const main = path.join(ROOT, "shell", "main.js"), ui = path.join(ROOT, "ui", "index.html");
  const got = { handlers: {}, windows: [], appOn: {} };
  class Win {
    constructor() { this.webContents = { id: 1, on() {}, once() {}, send() {}, setWindowOpenHandler() {}, getURL: () => pathToFileURL(ui).href }; got.windows.push(this); }
    on() {} once() {} isDestroyed() { return false; } isMaximized() { return false; } isMinimized() { return false; }
    close() {} focus() {} restore() {} loadFile() {} show() {} showInactive() {} setMinimumSize() {}
  }
  const electron = {
    app: { commandLine: { appendSwitch() {}, hasSwitch: () => false, removeSwitch() {} }, getPath: () => ud, getVersion: () => "0.0.0",
      getLocale: () => "en-GB", requestSingleInstanceLock: () => true, whenReady: () => Promise.resolve(),
      on: (t, fn) => { (got.appOn[t] = got.appOn[t] || []).push(fn); }, quit() {}, exit() {} },
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
    STUDIO_PROJECTS: path.join(ud, "projects"), STUDIO_SIGNING_KEY: path.join(ud, Sign.KEY_FILE), STUDIO_TEST_RELAY_SYNC: "none",
    /* A folder team's place takes a leave within its syncer's settle, and on a machine running four heavy lanes that took longer
       than 300 ms: 962s6b's and 962s6c's moves stopped on "has not yet taken the change" three runs of three in one worktree while the folds ran,
       and passed there once the load fell (the test architect, 2026-11-11). Three seconds, under the product's eight; tl7, whose
       refusal is this wait running out on an offline relay, keeps 300 ms. */
    STUDIO_MOVE_SETTLE_MS: "3000" }, more || {});
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
      /* Done is Studio's quit: its will-quit handlers let the projects folder's hold go and end the relay (was: endRelay alone, which left
         the hold taken, so on a runner's D: the next shell met "Another copy of Etiuda Studio" in 962s6b). */
      done: async () => {
        const quits = got.appOn["will-quit"] || [];
        try {
          if (quits.length) { for (const fn of quits) await Promise.race([Promise.resolve().then(fn), new Promise((r) => setTimeout(r, 3000))]); }
          else if (shell.endRelay) await Promise.race([shell.endRelay(), new Promise((r) => setTimeout(r, 3000))]);
        } catch { /* exit stops it */ }
        restore();
      } };
  } catch (err) { restore(); throw err; }
}
const studioThread = (verb, ...a) => { if (typeof Studio[verb] === "function") return Studio[verb](...a); throw new Error("no verb " + verb); };
/* The thread, with one verb stopped after a step: the options it is handed are the second argument of every verb used here. */
const stoppingThread = (stop) => (verb, ...a) => {
  if (stop && verb === stop.verb) a[1] = Object.assign({}, a[1], { stopAfter: stop.at });
  return studioThread(verb, ...a);
};
const errorOf = (r) => JSON.stringify(r && r.error || "");

// ---- the legs ----------------------------------------------------------------------------------------------------------------------
/* What a whole leave of B off X leaves behind. */
function leftWhole(w, before, aBytes) {
  const after = teamAt(w.share);
  const listed = !!after && after.rev === before.rev + 1 && JSON.stringify(after.catalogs) === JSON.stringify([w.idA]);
  const ring = ringOf(w.share) || { keys: [] };
  const ringOk = !ring.keys.some((k) => k && k.catalog === w.idB) && ring.keys.some((k) => k && k.catalog === w.idA);
  const fileGone = filesOf(w.share, w.teamId, w.idB, w.teamKeys).length === 0;
  const aSame = filesOf(w.share, w.teamId, w.idA, w.teamKeys).every((n) => aBytes[n] === sha(fs.readFileSync(path.join(w.share, n)))) && Object.keys(aBytes).length > 0;
  /* No head at the folder: Studio writes none there any more (was: the head naming A only). */
  const head = headEditions(w.share) === null;
  const project = freed(w.B);
  return { listed, ringOk, fileGone, aSame, head, project };
}
const aBytesOf = (w) => Object.fromEntries(filesOf(w.share, w.teamId, w.idA, w.teamKeys).map((n) => [n, sha(fs.readFileSync(path.join(w.share, n)))]));

await leg("tl1 on a folder team of two catalogs, B taken off: rev plus one listing A only, the ring without B and with A, B's file gone and A's unchanged, no head written, B's project free (was: the head naming A only)", async () => {
  const w = await world("tl1");
  const before = teamAt(w.share), aBytes = aBytesOf(w);
  const had = lists(w.share, w.idB) && filesOf(w.share, w.teamId, w.idB, w.teamKeys).length === 1 && headEditions(w.share) === null;
  /* Another key is not the team's lead: refused by the thread itself, nothing written. */
  const other = path.join(w.ud, "other-key.json");
  fs.writeFileSync(other, JSON.stringify(await Sign.makeKeyFile({ passphrase: PASS }), null, 1) + NL);
  const was = snap({ share: w.share, b: w.B });
  const ours = await refusedBy(Studio.leaveTeam(w.B, leaveOpts(w, { key: other })), "The team file in {FOLDER} is not the team this Studio leads, so the catalog") === true
    && snap({ share: w.share, b: w.B }) === was;
  const r = await Studio.leaveTeam(w.B, leaveOpts(w));
  const out = Object.assign({ had, ours, removed: r.removed === 1 }, leftWhole(w, before, aBytes));
  const ok = Object.values(out).every((v) => v === true);
  if (!ok) process.stderr.write("tl1 " + JSON.stringify(out) + NL);
  return ok;
});

await leg("tl2 on a relay mirror, B taken off: the ring inside the signed team file without B, B's file gone from the mirror, B's project with no relay, the head left to the runner", async () => {
  const w = await relayWorld("tl2");
  const before = (await Team.heldTeam(w.mirror, { key: w.keyPath })).team;
  const had = before.catalogs.indexOf(w.idB) >= 0 && before.ring.keys.some((k) => k && k.catalog === w.idB) && filesOf(w.mirror, w.relayTeam, w.idB, w.teamKeys).length === 1;
  const r = await Studio.leaveTeam(w.B, leaveOpts(w, { teamId: w.relayTeam, folder: w.mirror, work: w.mirror, relay: { rt: w.rt, url: Relay.RELAY_URL } }));
  const after = (await Team.heldTeam(w.mirror, { key: w.keyPath })).team;
  const out = {
    had,
    listed: !!after && after.rev === before.rev + 1 && JSON.stringify(after.catalogs) === JSON.stringify([w.idD]),
    ring: !!after && !after.ring.keys.some((k) => k && k.catalog === w.idB)
      && JSON.stringify(after.ring.keys) === JSON.stringify(before.ring.keys.filter((k) => !(k && k.catalog === w.idB))),
    fileGone: filesOf(w.mirror, w.relayTeam, w.idB, w.teamKeys).length === 0,
    ringFile: !(ringOf(w.mirror) || { keys: [] }).keys.some((k) => k && k.catalog === w.idB),
    project: freed(w.B),
    runner: !fs.existsSync(path.join(w.mirror, Relay.HEAD_NAME)),
  };
  const ok = Object.values(out).every((v) => v === true);
  if (!ok) process.stderr.write("tl2 " + JSON.stringify(out) + NL);
  return ok;
});

await leg("tl3 the one catalog of a folder team taken off: the team stays listing none, with no head written, no catalog file and no ring left (was: with the head deleted)", async () => {
  const w = await world("tl3", { noChoose: true });
  const had = !fs.existsSync(path.join(w.share, Relay.HEAD_NAME)) && filesOf(w.share, w.teamId, w.idA, w.teamKeys).length === 1;
  const r = await Studio.leaveTeam(w.A, leaveOpts(w));
  const after = teamAt(w.share);
  const out = {
    had,
    team: !!after && Array.isArray(after.catalogs) && after.catalogs.length === 0 && after.id === w.teamId,
    noHead: !fs.existsSync(path.join(w.share, Relay.HEAD_NAME)),
    noFile: fs.readdirSync(w.share).filter((n) => /\.ec$/i.test(n)).length === 0,
    noRing: !fs.existsSync(Ring.ringPath(w.share)),
    project: freed(w.A),
  };
  const ok = Object.values(out).every((v) => v === true);
  if (!ok) process.stderr.write("tl3 " + JSON.stringify(out) + NL);
  return ok;
});

await leg("tl3b the head stays where a file at the root does not open under the keys held, or opens as no catalog with an id, and goes where every file opens as one", async () => {
  const w = await world("tl3b", { noChoose: true });
  const held = (await Team.heldTeam(w.share, { key: w.keyPath })).team;
  const none = Object.assign({}, held, { catalogs: [] });
  const gone = Relay.headGone(w.share, none, w.teamKeys[w.teamId]);
  const kept = Relay.headGone(w.share, none, {});
  const stillLed = Relay.headGone(w.share, held, w.teamKeys[w.teamId]);
  /* A file that reads as JSON and is no catalog with an id (a stand-in a fixture or a broken writer left) keeps the head too. */
  fs.writeFileSync(path.join(w.share, "stray.ec"), JSON.stringify({ kind: "etiuda-sealed-catalog", team: w.teamId, epoch: 1, rev: 1 }) + NL);
  const stray = Relay.headGone(w.share, none, w.teamKeys[w.teamId]);
  const ok = gone === true && kept === false && stillLed === false && stray === false;
  if (!ok) process.stderr.write("tl3b " + JSON.stringify({ gone, kept, stillLed, stray }) + NL);
  return ok;
});

await leg("962s6a a leave stopped after each step (2, 3, 4, 5), then pressed again, ends whole, and after step 2 the team lists B nowhere", async () => {
  const out = {};
  for (const at of [2, 3, 4, 5]) {
    const w = await world("s6a-" + at);
    const before = teamAt(w.share), aBytes = aBytesOf(w);
    let stopped = false;
    try { await Studio.leaveTeam(w.B, leaveOpts(w, { stopAfter: at })); } catch (e) { stopped = new RegExp("step " + at).test(String(e && e.message)); }
    const mid = !lists(w.share, w.idB) && projectOf(w.B).sealedTeam === w.teamId;
    await Studio.leaveTeam(w.B, leaveOpts(w));
    const end = leftWhole(w, before, aBytes);
    out[at] = stopped && mid && Object.values(end).every((v) => v === true) ? true : { stopped, mid, end };
  }
  const ok = Object.values(out).every((v) => v === true);
  if (!ok) process.stderr.write("962s6a " + JSON.stringify(out) + NL);
  return ok;
});

/* What a whole move of B from X to Y leaves behind. */
function movedWhole(w) {
  const p = projectOf(w.B);
  return {
    xDrops: !lists(w.share, w.idB) && filesOf(w.share, w.teamId, w.idB, w.teamKeys).length === 0,
    yLists: lists(w.share2, w.idB) && filesOf(w.share2, w.teamY, w.idB, w.teamKeys).length === 1,
    project: p.sealedTeam === w.teamY && path.resolve(String(p.folder || "")) === path.resolve(w.share2) && !p.moving,
    kept: (() => { const kx = Store.keptTeam(w.tf, w.teamId), ky = Store.keptTeam(w.tf, w.teamY); return kx.file.catalogs.indexOf(w.idB) < 0 && ky.file.catalogs.indexOf(w.idB) >= 0; })(),
  };
}
await leg("962s6b B moved from X to Y through the shell, stopped after each step: never on both teams, the move named, and a second press finishes it; one stopped part way is put back on X", async () => {
  const out = {};
  const stops = [{ verb: "leaveTeam", at: 2 }, { verb: "leaveTeam", at: 3 }, { verb: "leaveTeam", at: 4 }, { verb: "leaveTeam", at: 5 },
    { verb: "chooseTeam", at: 4 }, { verb: "chooseTeam", at: 5 }, null];
  for (const stop of stops) {
    const tag = stop ? stop.verb.slice(0, 5) + stop.at : "whole";
    const w = await world("s6b-" + tag);
    let midOk = true;
    if (stop) {
      const sh = await loadShell(w.ud, stoppingThread(stop));
      try {
        const r = await sh.ask("studio:team-move-catalog", w.B, w.teamY);
        const p = projectOf(w.B);
        midOk = !!r && !!r.error && !(lists(w.share, w.idB) && lists(w.share2, w.idB)) && !!p.moving && p.moving.from === w.teamId && p.moving.to === w.teamY
          ? true : { r: errorOf(r).slice(0, 120), both: lists(w.share, w.idB) && lists(w.share2, w.idB), moving: p.moving || null };
      } finally { await sh.done(); }
    }
    const sh = await loadShell(w.ud, studioThread);
    let r = null;
    try { r = await sh.ask("studio:team-move-catalog", w.B, w.teamY); } finally { await sh.done(); }
    const end = movedWhole(w);
    out[tag] = midOk === true && !!r && !r.error && Object.values(end).every((v) => v === true) ? true : { midOk, r: errorOf(r).slice(0, 160), end };
  }
  /* Put back: a move stopped after the leave's step 4, pressed towards X, puts B back on X and leaves Y as it was. */
  const w = await world("s6b-back");
  const yBefore = snap({ y: w.share2 });
  const sh1 = await loadShell(w.ud, stoppingThread({ verb: "leaveTeam", at: 4 }));
  try { await sh1.ask("studio:team-move-catalog", w.B, w.teamY); } finally { await sh1.done(); }
  const sh2 = await loadShell(w.ud, studioThread);
  let back = null;
  try { back = await sh2.ask("studio:team-move-catalog", w.B, w.teamId); } finally { await sh2.done(); }
  const p = projectOf(w.B);
  out.back = !!back && !back.error && lists(w.share, w.idB) && filesOf(w.share, w.teamId, w.idB, w.teamKeys).length === 1 && !lists(w.share2, w.idB)
    && p.sealedTeam === w.teamId && !p.moving && snap({ y: w.share2 }) === yBefore ? true : { back: errorOf(back).slice(0, 160), p };
  const ok = Object.values(out).every((v) => v === true);
  if (!ok) process.stderr.write("962s6b " + JSON.stringify(out).slice(0, 1500) + NL);
  return ok;
});

await leg("962s6c two moves in opposite directions at once (B from X to Y, C from Y to X) both finish, neither waits forever", async () => {
  const w = await world("s6c");
  const sh = await loadShell(w.ud, studioThread);
  let res = null;
  try {
    const one = sh.ask("studio:team-move-catalog", w.B, w.teamY), two = sh.ask("studio:team-move-catalog", w.C, w.teamId);
    let timer = null;
    res = await Promise.race([Promise.all([one, two]), new Promise((r) => { timer = setTimeout(() => r("timed out"), 30000); })]);
    if (timer) clearTimeout(timer);
  } finally { if (res !== "timed out") await sh.done(); }
  const ok = Array.isArray(res) && res.every((r) => r && !r.error) && lists(w.share2, w.idB) && !lists(w.share, w.idB)
    && lists(w.share, w.idC) && !lists(w.share2, w.idC) && projectOf(w.B).sealedTeam === w.teamY && projectOf(w.C).sealedTeam === w.teamId;
  if (!ok) process.stderr.write("962s6c " + JSON.stringify(Array.isArray(res) ? res.map(errorOf) : res).slice(0, 400) + NL);
  return ok;
});

const CLEAR = "{FOLDER} is the place of a sealed team, and this catalog is not one of its catalogs";
await leg("962s6d a publish with no sealing is refused into a sealed team's place, nothing written, in five ways; a Plain team's folder and a folder with no team still take it", async () => {
  const out = {};
  const signedFor = (w) => ({ leadKey: w.keyPath, key: w.keyPath, passphrase: PASS, teamKeys: w.teamKeys, userData: w.ud, now: "2026-11-09T08:00:00.000Z", ...LIC });
  const refusedInto = async (w, folder, extra) => {
    const was = snap({ f: folder, b: w.B });
    const r = await refusedBy(Studio.publishProject(w.B, Object.assign({ folder, notes: "B two." }, signedFor(w), extra || {})), CLEAR);
    return r === true && snap({ f: folder, b: w.B }) === was ? true : r;
  };
  /* 1. This Studio's own sealed team, not listing B. */
  const w = await world("s6d", { noChoose: true });
  out.own = await refusedInto(w, w.share);
  /* 2. Another Studio's sealed team file. */
  const theirs = path.join(w.ud, "theirs"), otherKey = path.join(w.ud, "other-key.json");
  fs.mkdirSync(theirs, { recursive: true });
  fs.writeFileSync(otherKey, JSON.stringify(await Sign.makeKeyFile({ passphrase: PASS }), null, 1) + NL);
  const od = Sign.readKeyFile(otherKey);
  await Team.writeTeam(theirs, Team.newTeam({ catalogs: ["far-quay"], lead: { keyId: od.keyId, public: od.public }, sealed: true, exportsSealed: true }), { key: otherKey, passphrase: PASS });
  out.another = await refusedInto(w, theirs);
  /* 3. No key at all: a publish that cannot sign. */
  out.noKey = await refusedInto(w, w.share, { key: undefined, leadKey: undefined, passphrase: undefined });
  /* 4. An older file of this Studio's own put back, saying it does not seal, while teams.json keeps the team sealed. */
  const w4 = await world("s6d-back", { noChoose: true });
  /* Written by the fixture (was: Studio's Plain and Sealed switches; they write no folder team now, team-seal fh5). */
  const heldB = (await Team.heldTeam(w4.share, { key: w4.keyPath })).team;
  const plainWritten = (await Team.writeTeam(w4.share, Team.withSealed(heldB, false, null), { key: w4.keyPath, passphrase: PASS })).team;
  const plainBytes = fs.readFileSync(Team.teamPath(w4.share));
  const again = { written: (await Team.writeTeam(w4.share, Team.withSealed(plainWritten, true, null), { key: w4.keyPath, passphrase: PASS })).team };
  Store.chooseSealed(w4.tf, w4.teamId, true, w4.share, again.written);
  fs.writeFileSync(Team.teamPath(w4.share), plainBytes);
  out.rolledBack = await refusedInto(w4, w4.share);
  /* 5. The team file gone from the share, teams.json keeping the folder as this Studio's sealed team. */
  fs.renameSync(Team.teamPath(w4.share), path.join(w4.ud, "team-aside.json"));
  out.fileGone = await refusedInto(w4, w4.share);
  /* Controls: the lead turns the team to Plain here (its file says so, teams.json says so), and B goes out in the clear; a folder
     with no team takes B as it did. */
  fs.writeFileSync(Team.teamPath(w4.share), plainBytes);
  Store.chooseSealed(w4.tf, w4.teamId, false, w4.share);
  let plain = null;
  try { plain = await Studio.publishProject(w4.B, Object.assign({ folder: w4.share, notes: "B plain." }, signedFor(w4), { unsealed: [w4.teamId] })); } catch (e) { plain = said(e); }
  out.plainLands = !!plain && typeof plain === "object" && !plain.refused && fs.existsSync(String(plain.ec || "")) ? true : String(plain).slice(0, 160);
  let free = null;
  try { free = await Studio.publishProject(w.B, Object.assign({ folder: w.own, notes: "B free." }, signedFor(w))); } catch (e) { free = said(e); }
  out.noTeamLands = !!free && typeof free === "object" && !free.refused && fs.existsSync(String(free.ec || "")) ? true : String(free).slice(0, 160);
  const ok = Object.values(out).every((v) => v === true);
  if (!ok) process.stderr.write("962s6d " + JSON.stringify(out).slice(0, 1200) + NL);
  return ok;
});

await leg("tl4 through the shell's studio:team-leave, refused with nothing written (under way, part way through a move, on no team, a move to its own team); then one lands and the kept file stops listing B; an orphan id is taken off by team and id", async () => {
  const w = await world("tl4");
  const sh = await loadShell(w.ud, studioThread);
  const out = {};
  try {
    const storeAt = path.join(w.ud, "studio.json");
    const storeWas = fs.existsSync(storeAt) ? fs.readFileSync(storeAt, "utf8") : null;
    const look = () => snap({ share: w.share, share2: w.share2, b: w.B }) + (fs.existsSync(w.tf) ? sha(fs.readFileSync(w.tf)) : "");
    const refusedWith = async (job, frame) => { const was = look(); const r = await job(); return !!r && !!r.error && JSON.stringify(r).indexOf(frame.slice(0, 40)) >= 0 && look() === was ? true : errorOf(r).slice(0, 160); };
    const leave = () => sh.ask("studio:team-leave", w.B);
    const putStore = (patch) => fs.writeFileSync(storeAt, JSON.stringify(Object.assign(storeWas ? JSON.parse(storeWas) : {}, patch), null, 1) + NL);
    putStore({ handover: { team: w.teamId, step: "(ii)" } });
    out.handover = await refusedWith(leave, "A move or a handover of this team is under way, so no catalog can be taken off");
    if (storeWas === null) fs.writeFileSync(storeAt, "{}\n"); else fs.writeFileSync(storeAt, storeWas);
    const pj = projectOf(w.B);
    fs.writeFileSync(path.join(w.B, "project.json"), JSON.stringify(Object.assign({}, pj, { moving: { from: w.teamId, to: w.teamY } }), null, 1) + NL);
    out.partWay = await refusedWith(leave, "This catalog is part way through a move to another team.");
    fs.writeFileSync(path.join(w.B, "project.json"), JSON.stringify(pj, null, 1) + NL);
    const loose = (await Studio.newProject(w.projects, "Loose", [{ code: "en", name: "English" }])).dir;
    out.onNone = await refusedWith(() => sh.ask("studio:team-leave", loose), "This catalog is on no team, so there is no team to take it off.");
    out.same = await refusedWith(() => sh.ask("studio:team-move-catalog", w.B, w.teamId), "This catalog is on that team already, so it was not moved.");
    out.notKept = await refusedWith(() => sh.ask("studio:team-leave", "", "t-0123456789abcdef", w.idA), "This Studio does not lead that team as a sealed one, so no catalog was taken off");
    const r = await leave();
    const kept = Store.keptTeam(w.tf, w.teamId);
    /* The share takes the leave from the outbox; the press waits for it briefly, and this leg longer. */
    const onShare = await until(() => !lists(w.share, w.idB) && filesOf(w.share, w.teamId, w.idB, w.teamKeys).length === 0, 20000);
    out.lands = !!r && !r.error && onShare && freed(w.B) && !!kept && kept.file.catalogs.indexOf(w.idB) < 0 && r.removed === 1
      ? true : JSON.stringify({ r: errorOf(r).slice(0, 120), onShare, freed: freed(w.B), kept: kept && kept.file.catalogs, removed: r && r.removed });
    /* A catalog the team lists with no project in this library: A's project moved out of the library, A taken off by team and id. */
    fs.renameSync(w.A, path.join(w.ud, "alpha-elsewhere"));
    const o = await sh.ask("studio:team-leave", "", w.teamId, w.idA);
    const gone = await until(() => !lists(w.share, w.idA) && filesOf(w.share, w.teamId, w.idA, w.teamKeys).length === 0 && !fs.existsSync(path.join(w.share, Relay.HEAD_NAME)), 20000);
    out.orphan = !!o && !o.error && gone ? true : JSON.stringify({ o: errorOf(o).slice(0, 120), gone });
  } finally { await sh.done(); }
  const ok = Object.values(out).every((v) => v === true);
  if (!ok) process.stderr.write("tl4 " + JSON.stringify(out).slice(0, 1200) + NL);
  return ok;
});

await leg("tl4r on a relay team, studio:team-leave refused with nothing written: past its grant, its licence revoked (fetching, and fetched with none); then one lands", async () => {
  const w = await relayWorld("tl4r");
  const sh = await loadShell(w.ud, studioThread);
  const out = {};
  try {
    const look = () => snap({ mirror: w.mirror, b: w.B });
    const refusedWith = async (frame) => { const was = look(); const r = await sh.ask("studio:team-leave", w.B); return !!r && !!r.error && JSON.stringify(r).indexOf(frame.slice(0, 50)) >= 0 && look() === was ? true : errorOf(r).slice(0, 160); };
    Store.markRelay(w.tf, w.relayTeam, { lapse: { state: "read-only", until: Date.now() - 86400000, readOnly: Date.now() - 3600000, swept: Date.now() + 86400000 * 30, at: Date.now() } });
    out.grant = await refusedWith("The relay licence for this team has ended, so no catalog can be taken off");
    Store.markRelay(w.tf, w.relayTeam, { lapse: null });
    Store.markRelay(w.tf, w.relayTeam, { revoked: true, revokedNone: false });
    out.revoked = await refusedWith("The relay no longer accepts this team's relay licence, so no catalog can be taken off it until Studio has a new one. Studio is fetching");
    Store.markRelay(w.tf, w.relayTeam, { revokedNone: true });
    out.revokedNone = await refusedWith("The relay no longer accepts this team's relay licence, so no catalog can be taken off it until Studio has a new one. Nothing");
    Store.markRelay(w.tf, w.relayTeam, { revoked: false, revokedNone: false });
    const r = await sh.ask("studio:team-leave", w.B);
    out.lands = !!r && !r.error && r.relay === true && !lists(w.mirror, w.idB) && freed(w.B) ? true : errorOf(r).slice(0, 160);
  } finally { await sh.done(); }
  const ok = Object.values(out).every((v) => v === true);
  if (!ok) process.stderr.write("tl4r " + JSON.stringify(out).slice(0, 1000) + NL);
  return ok;
});

await leg("tl5 the team lock a catalog part way through a move takes is its old team's", async () => {
  const w = await world("tl5");
  const pj = projectOf(w.B);
  const next = Object.assign({}, pj, { moving: { from: w.teamId, to: w.teamY } });
  delete next.sealedTeam; next.folder = null;
  fs.writeFileSync(path.join(w.B, "project.json"), JSON.stringify(next, null, 1) + NL);
  const sh = await loadShell(w.ud, studioThread);
  let k = null;
  try { k = typeof sh.shell.teamKeyFor === "function" ? await sh.shell.teamKeyFor(w.B) : "no teamKeyFor"; } finally { await sh.done(); }
  const ok = k === w.teamId;
  if (!ok) process.stderr.write("tl5 " + JSON.stringify({ k, want: w.teamId }) + NL);
  return ok;
});

await leg("tl7 a move whose old team's place has not taken the leave (a relay team, offline) stops with B on no team and the move standing, said so, and the new team untouched", async () => {
  const w = await relayWorld("tl7");
  const xBefore = snap({ x: w.share });
  const sh = await loadShell(w.ud, studioThread, { STUDIO_MOVE_SETTLE_MS: "300" });
  let r = null;
  try { r = await sh.ask("studio:team-move-catalog", w.B, w.teamId); } finally { await sh.done(); }
  const p = projectOf(w.B);
  const out = {
    said: !!r && !!r.error && errorOf(r).indexOf("The catalog is off its old team, and that team's place has not yet taken the change") >= 0,
    off: !lists(w.mirror, w.idB) && !lists(w.share, w.idB),
    standing: !!p.moving && p.moving.from === w.relayTeam && p.moving.to === w.teamId && !p.sealedTeam,
    untouched: snap({ x: w.share }) === xBefore,
  };
  const ok = Object.values(out).every((v) => v === true);
  if (!ok) process.stderr.write("tl7 " + JSON.stringify(Object.assign(out, { r: errorOf(r).slice(0, 160) })) + NL);
  return ok;
});

await leg("tl1015a (board 1015) a team catalog's `adopted` entry goes with the catalog: B chosen with an entry, then taken off, the team file lists no entry and no key for it and is otherwise as before B joined", async () => {
  const w = await world("tl1015a", { noChoose: true });
  const before = teamAt(w.share);
  const entry = { desk: "k-" + "a1".repeat(8), original: sha("lovelace-tide-notes") };
  const pj = projectOf(w.B);
  fs.writeFileSync(path.join(w.B, "project.json"), JSON.stringify(Object.assign({}, pj, { adoptedFrom: entry }), null, 1) + NL);
  await Studio.chooseTeam(w.B, chooseOpts(w));
  const joined = teamAt(w.share);
  const wrote = Array.isArray(joined.adopted) && joined.adopted.length === 1 && joined.adopted[0].catalog === w.idB
    && joined.adopted[0].desk === entry.desk && joined.adopted[0].original === entry.original;
  await Studio.leaveTeam(w.B, leaveOpts(w));
  const after = teamAt(w.share);
  const strip = (t) => { const o = JSON.parse(JSON.stringify(t)); ["sig", "rev", "recovery"].forEach((k) => { delete o[k]; }); return o; };
  const out = { wrote, pruned: !("adopted" in after) && after.catalogs.indexOf(w.idB) < 0, otherwiseAsBefore: JSON.stringify(strip(after)) === JSON.stringify(strip(before)) };
  const ok = Object.values(out).every((v) => v === true);
  if (!ok) process.stderr.write("tl1015a " + JSON.stringify(out) + NL);
  return ok;
});

// ---- letting go of a team this Studio holds no keys for (board 1015; the lead engineer's read of 2026-11-19) ----------------------------
/* A project that names a relay team this Studio holds no keys for: the shape a fresh profile leaves (a reinstall, or a projects folder
   copied to a new computer). Its project.json carries the seal mark and the relay place of the old profile, and teams.json has no row. */
async function staleProject(w, name) {
  const dir = (await Studio.newProject(w.projects, name, [{ code: "en", name: "English" }])).dir;
  const shelf = (await Studio.addTag(dir, "shelf", { en: "General" })).tag.id;
  await Studio.addCard(dir, shelf, name + " card", "The answer, in full.");
  const rt = Relay.relayId(), team = "t-" + crypto.randomBytes(8).toString("hex");
  const old = path.join(w.ud + "-old-profile", "relay", rt);
  fs.writeFileSync(path.join(dir, "project.json"), JSON.stringify(Object.assign(projectOf(dir), { sealedTeam: team, folder: old,
    relay: { rt, url: Relay.RELAY_URL, lead: w.keyDoc.public } }), null, 1) + NL);
  return { dir, rt, team, old };
}
/* Every file under the studio's user data and the old profile's place, by sha256, less any path matching `skip`. */
const lookAt = (w, s, skip) => {
  const all = JSON.parse(snap({ ud: w.ud, old: path.dirname(path.dirname(s.old)) }));
  /* The licence record (licence-service.json) is the shell's own, kept as soon as it has seen the licence file (the seen record, a
     coalescing chain since fold 97, no longer a 2 s delay that outlived these legs); a team's let-go never writes it. */
  for (const k of Object.keys(all)) if ((skip && skip.test(k)) || /licence-service\.json$/.test(k) || isHoldPath(k)) delete all[k];
  return JSON.stringify(all);
};
const noMark = (p) => { const q = Object.assign({}, p); delete q.sealedTeam; delete q.relay; return q; };
const differing = (a, b) => Object.keys(Object.assign({}, a, b)).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k])).sort().join();

await leg("lgt1 a project naming a relay team this Studio holds no keys for lists, opens (only the open stamped) and refuses to publish with nothing written; its Team facts offer to let go; letting go through the shell clears the team mark and the place at the dead mirror and nothing else; then the project can choose a team and start one again", async () => {
  const w = await world("lgt1", { noChoose: true, noY: true });
  const s = await staleProject(w, "Stale"), s2 = await staleProject(w, "Stale two");
  const sh = await loadShell(w.ud, studioThread);
  const out = {};
  try {
    out.lists = Studio.listProjects(w.projects).projects.filter((p) => path.resolve(p.dir) === path.resolve(s.dir)).length === 1;
    const was = projectOf(s.dir);
    await Studio.openProject(s.dir, { userData: w.ud });
    const opened = projectOf(s.dir);
    out.opens = ["opened", "draft,opened"].indexOf(differing(was, opened)) >= 0;
    const mirror = Store.relayMirror(w.tf, s.rt);
    const kept = lookAt(w, s);
    out.publishRefused = (await refusedBy(Studio.publishProject(s.dir, Object.assign({ folder: mirror, notes: "No team.", userData: w.ud, teamKeys: w.teamKeys },
      { leadKey: w.keyPath, key: w.keyPath, passphrase: PASS, ...(await licensedOpts()) })), "has published sealed for team")) === true
      && lookAt(w, s) === kept && !fs.existsSync(mirror) && !fs.existsSync(s.old);
    const facts = await Studio.teamFacts(s.dir, { key: w.keyPath, userData: w.ud });
    out.offered = facts.letGo === true && facts.mark === s.team && facts.file === "none" && !facts.team;
    const desks = await sh.ask("studio:desks", s.dir);
    out.desksOffer = !!desks && !desks.error && desks.letGo === true;
    /* Before: choosing a team is refused for the stale mark. */
    out.refusedBefore = (await refusedBy(Studio.chooseTeam(s2.dir, chooseOpts(w)), "This catalog has a team already, so it did not join another.")) === true;
    const restBefore = lookAt(w, s, /projects\/Stale\/project\.json$/);
    const r = await sh.ask("studio:team-let-go", s.dir);
    const after = projectOf(s.dir);
    out.cleared = !!r && !r.error && differing(after, noMark(opened)) === "folder" && after.folder === null && !("sealedTeam" in after) && !("relay" in after);
    out.nothingElse = lookAt(w, s, /projects\/Stale\/project\.json$/) === restBefore && !fs.existsSync(mirror) && !fs.existsSync(s.old);
    const again = await Studio.teamFacts(s.dir, { key: w.keyPath, userData: w.ud });
    out.noLonger = again.letGo === false && !again.mark;
    /* After: the other stale project lets go the same way and then joins a team of this Studio. */
    const r2 = await sh.ask("studio:team-let-go", s2.dir);
    const joined = r2 && !r2.error ? await Studio.chooseTeam(s2.dir, chooseOpts(w)).catch((e) => ({ error: said(e) })) : { error: "let go refused" };
    out.chooses = !!joined && !joined.error && !!joined.team && projectOf(s2.dir).sealedTeam === w.teamId;
    /* And the first can be put on a team again: the catalog is on none after the let-go. MOVED 2026-11-26: was "the relay handler no longer says it has a team already"
       (studio:team-relay on the catalog, retired: a team is made with no catalog, and a catalog joins one by the choose). */
    const rejoined = await Studio.chooseTeam(s.dir, chooseOpts(w)).catch((e) => ({ error: said(e) }));
    out.starts = !!rejoined && !rejoined.error && projectOf(s.dir).sealedTeam === w.teamId;
  } finally { await sh.done(); }
  const ok = Object.values(out).every((v) => v === true);
  if (!ok) process.stderr.write("lgt1 " + JSON.stringify(out) + NL);
  return ok;
});

await leg("lgt2 a team this Studio holds is never offered for letting go, and a let-go asked for it is refused with nothing written: the team file gone from its share with the team kept, a relay team whose row is kept, a teams file that will not read, a project with no team", async () => {
  const w = await world("lgt2", { noChoose: true, noY: true });
  const s = await staleProject(w, "Stale");
  const sh = await loadShell(w.ud, studioThread);
  const out = {};
  try {
    /* A project on a team kept here whose file has gone from the share: today's line stays, and no let-go. */
    fs.renameSync(Team.teamPath(w.share), path.join(w.ud, "team-aside.json"));
    const gone = await Studio.teamFacts(w.A, { key: w.keyPath, userData: w.ud });
    out.keptNotOffered = gone.mark === w.teamId && gone.file === "none" && gone.letGo === false;
    const was = lookAt(w, s);
    const r = await sh.ask("studio:team-let-go", w.A);
    out.keptRefused = !!r && !!r.error && lookAt(w, s) === was && projectOf(w.A).sealedTeam === w.teamId;
    /* A relay team this Studio keeps a row for, its mirror gone: the row decides. */
    const held = await staleProject(w, "Held");
    Store.keepTeamKey(w.tf, TEST_VAULT, held.team, 1, crypto.randomBytes(32));
    Store.keepRelay(w.tf, held.team, held.rt, Relay.RELAY_URL);
    const rowOnly = await Studio.teamFacts(held.dir, { key: w.keyPath, userData: w.ud });
    out.rowNotOffered = rowOnly.mark === held.team && rowOnly.letGo === false;
    const was2 = lookAt(w, s);
    const r3 = await sh.ask("studio:team-let-go", held.dir);
    out.rowRefused = !!r3 && !!r3.error && lookAt(w, s) === was2 && projectOf(held.dir).sealedTeam === held.team;
    /* A relay row with no key in it (what opening such a project through the shell leaves) holds nothing: still offered. */
    const bare = await staleProject(w, "Bare");
    Store.keepRelay(w.tf, bare.team, bare.rt, Relay.RELAY_URL);
    out.keylessOffered = (await Studio.teamFacts(bare.dir, { key: w.keyPath, userData: w.ud })).letGo === true;
    /* A teams file that will not read says nothing of who holds what, so it offers nothing. */
    const bad = path.join(w.ud, "bad-teams.json");
    fs.writeFileSync(bad, "{ not json");
    const unreadable = await Studio.teamFacts(s.dir, { key: w.keyPath, teamsFile: bad });
    out.unreadableNotOffered = unreadable.mark === s.team && unreadable.letGo === false;
    /* No team mark at all: nothing to let go. */
    const loose = (await Studio.newProject(w.projects, "Loose", [{ code: "en", name: "English" }])).dir;
    const none = await Studio.teamFacts(loose, { key: w.keyPath, userData: w.ud });
    const was3 = lookAt(w, s);
    const r4 = await sh.ask("studio:team-let-go", loose);
    out.noneRefused = none.letGo === false && !!r4 && !!r4.error && lookAt(w, s) === was3;
    /* The stale project is still the stale project after every refusal above. */
    out.staleStill = projectOf(s.dir).sealedTeam === s.team && !!projectOf(s.dir).relay;
  } finally { await sh.done(); }
  const ok = Object.values(out).every((v) => v === true);
  if (!ok) process.stderr.write("lgt2 " + JSON.stringify(out) + NL);
  return ok;
});

await leg("lgt4 a teams file that will not read, and one a newer Studio wrote, each offer no let-go and make letGoTeam refuse with project.json byte for byte as it was, through the thread and (the newer one) through the shell", async () => {
  const w = await world("lgt4", { noChoose: true, noY: true });
  const s = await staleProject(w, "Stale");
  const out = {};
  const bytes = () => sha(fs.readFileSync(path.join(s.dir, "project.json")));
  const was = bytes();
  const bad = path.join(w.ud, "bad-teams.json"), newer = path.join(w.ud, "newer-teams.json");
  fs.writeFileSync(bad, "{ not json");
  fs.writeFileSync(newer, JSON.stringify({ format: 999, kind: "etiuda-studio-teams", writtenBy: "9.9.9", teams: {} }, null, 1) + NL);
  const look = lookAt(w, s);
  for (const [name, file] of [["unreadable", bad], ["newer", newer]]) {
    const facts = await Studio.teamFacts(s.dir, { key: w.keyPath, teamsFile: file });
    out[name + "Facts"] = facts.mark === s.team && facts.letGo === false;
    out[name + "Refused"] = (await refusedBy(Studio.letGoTeam(s.dir, { teamsFile: file }), "so nothing was let go")) === true && bytes() === was && lookAt(w, s) === look;
  }
  /* The same, through the shell, with this Studio's own teams file replaced by the newer one. */
  const kept = fs.readFileSync(w.tf);
  fs.writeFileSync(w.tf, fs.readFileSync(newer));
  const sh = await loadShell(w.ud, studioThread);
  try {
    const r = await sh.ask("studio:team-let-go", s.dir);
    out.shellRefused = !!r && !!r.error && bytes() === was;
  } finally { await sh.done(); fs.writeFileSync(w.tf, kept); }
  const ok = Object.values(out).every((v) => v === true);
  if (!ok) process.stderr.write("lgt4 " + JSON.stringify(out) + NL);
  return ok;
});

await leg("lgt3 the Team screen offers 'Let go of the team…' only where the facts say so, in place of the line about the team file; the question says what stays and what ends; Cancel changes and asks nothing; Let go asks the shell once and the screen is read again", async () => {
  const { loadPage } = await import("./page-stand-in.mjs");
  const ENT = { "&#39;": "'", "&quot;": "\"", "&lt;": "<", "&gt;": ">", "&amp;": "&" };
  const textOf = (html) => String(html).replace(/<[^>]*>/g, " ").replace(/&#39;|&quot;|&lt;|&gt;|&amp;/g, (m) => ENT[m]).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  const TEAM = "t-0f1e2d3c4b5a6978";
  const asked = [];
  const facts = (letGo) => ({ folder: "C:\\profile\\relay\\0a", file: "none", signing: "lead-key", inside: false, keyHeld: false, canKeep: true, mark: TEAM,
    requests: [], invites: [], keyOpens: true, autoAdmit: false, team: null, uses: [], letGo });
  const out = {};
  const open = (lang, letGo) => {
    const home = loadPage({ api: { teamLetGo: async (dir) => { asked.push(dir); return { letGo: true }; }, desks: async () => facts(false) }, uiLang: lang });
    const P = home.page;
    P.S.open = { dir: "C:\\harbour", editions: [], name: "Harbour tide", project: { sealedTeam: TEAM } };
    P.S.screen = "projects"; P.S.home = "team"; P.S.teamDir = "C:\\harbour"; P.S.lang = "en";
    P.S.desks = facts(letGo);
    P.paintMain();
    return { home, P, text: textOf(home.node("#main").innerHTML), html: home.node("#main").innerHTML };
  };
  const en = open("en", true), pl = open("pl", true), no = open("en", false);
  const LINE = "This project belongs to a team whose keys are not in this Studio, so nothing can be published to it from here. Letting go of the team leaves the draft as it is and lets the project make or choose a team again.";
  out.shown = en.text.indexOf(LINE) >= 0 && en.text.indexOf("Let go of the team…") >= 0 && /data-act="team-letgo-ask"/.test(en.html)
    && en.text.indexOf("The team file has gone from this folder") < 0;
  out.polish = pl.text.indexOf("Odłącz zespół…") >= 0 && pl.text.indexOf("zespołu, którego kluczy nie ma w tym Studiu") >= 0;
  /* MOVED 2026-11-26: with no team file and no keys to let go of, the page says the catalog is on no team (was: the folder's line, The team file has gone from this folder). */
  out.notShown = no.text.indexOf("Let go of the team…") < 0 && !/team-letgo-ask/.test(no.html) && no.text.indexOf("The team file has gone from this folder") < 0
    && no.text.indexOf("This catalog is on no team") >= 0;
  /* The question, then Cancel. */
  await en.P.ACTS["team-letgo-ask"]();
  en.P.paintCoverOnly();
  const dlg = textOf(en.home.node("#dlg").innerHTML);
  out.question = en.P.S.cover === "team-letgo" && dlg.indexOf("Let go of the team for this project?") >= 0
    && dlg.indexOf("The team's members keep what they already have. This Studio can no longer publish to that team. The catalog's draft stays as it is.") >= 0
    && /data-act="do-team-letgo"/.test(en.home.node("#dlg").innerHTML) && dlg.indexOf("Let go") >= 0 && dlg.indexOf("Cancel") >= 0;
  await en.P.ACTS["cover-close"]();
  out.cancel = !en.P.S.cover && asked.length === 0;
  /* Let go. */
  await en.P.ACTS["team-letgo-ask"]();
  await en.P.ACTS["do-team-letgo"]();
  out.pressed = asked.length === 1 && asked[0] === "C:\\harbour" && !en.P.S.cover && !!en.P.S.desks && en.P.S.desks.letGo === false;
  const ok = Object.values(out).every((v) => v === true);
  if (!ok) process.stderr.write("lgt3 " + JSON.stringify(out).slice(0, 1200) + " | " + en.text.slice(0, 500) + NL);
  return ok;
});

// ---- plants, each proved in a scratch copy ----------------------------------------------------------------------------------------
const PLANTS = [
  ["without-catalog", "src/team.mjs", "tl1", "  ;"],
  ["without-catalog-ring", "src/team.mjs", "tl2", "  ;"],
  ["adopted-prune", "src/team.mjs", "tl1015a", "  ;"],
  ["leave-team-write", "src/studio.mjs", "tl1", "        written = base;"],
  ["leave-take-file", "src/studio.mjs", "tl1", "    continue;"],
  ["leave-ring", "src/studio.mjs", "tl1", "    ;"],
  ["leave-project", "src/studio.mjs", "tl1", "    ;"],
  ["leave-ours", "src/studio.mjs", "tl1", "  ;"],
  ["leave-moving", "src/studio.mjs", "962s6b", "    ;"],
  ["choose-drops-moving", "src/studio.mjs", "962s6b", "  ;"],
  ["clear-into-sealed", "src/publish.mjs", "962s6d", "    ;"],
  ["place-under-way", "shell/main.js", "tl4", "  ;"],
  ["place-kept", "shell/main.js", "tl4", "    ;"],
  ["place-revoked", "shell/main.js", "tl4r", "    ;"],
  ["place-grant", "shell/main.js", "tl4r", "    ;"],
  ["leave-part-way", "shell/main.js", "tl4", "    ;"],
  ["leave-keep-file", "shell/main.js", "tl4", "    ;"],
  ["move-same", "shell/main.js", "tl4", "  ;"],
  ["move-sorted", "shell/main.js", "962s6c", "  const order = [from, to];"],
  ["move-settled", "shell/main.js", "tl7", "    ;"],
  ["key-for-moving", "shell/main.js", "tl5", "  ;"],
  ["move-back-free", "shell/main.js", "962s6b", "    if (false) {"],
  ["head-gone-known", "src/relay.mjs", "tl3b", "  return names.every((n) => !!catalogIn(folder, n, keys));"],
  ["letgo-row", "src/team-store.mjs", "lgt2", "  ;"],
  ["letgo-held", "src/studio.mjs", "lgt2", "  return !!mark && !!tf;"],
  ["letgo-refuse", "src/studio.mjs", "lgt2", "  ;"],
  ["letgo-mirror", "src/studio.mjs", "lgt1", "  ;"],
  ["letgo-write", "src/studio.mjs", "lgt1", "  ;"],
  ["letgo-shown", "ui/app.js", "lgt3", "    const letGoNow = !t;"],
  ["letgo-newer", "src/team-store.mjs", "lgt4", "  ;"],
  ["letgo-unreadable", "src/team-store.mjs", "lgt4", "  if (!d) return \"none\";"],
];
if (PLANTS_OFF || ONLY) {
  skip("tlP plants proved in a scratch copy (" + (PLANTS_OFF ? "ETIUDA_PLANTS=off" : "one leg") + ")");
} else {
  await leg("tlP plants proved in a scratch copy, each turning its leg red, the checkout unchanged", async () => {
    const { plantsTree, treeSha, dropPlantsTree } = await import("./plants-tree.mjs");
    const was = treeSha(ROOT), copy = plantsTree(ROOT, "team-leave");
    const bad = [];
    try {
      for (const [mark, rel, legId, line] of PLANTS) {
        const at = path.join(copy, rel), text = fs.readFileSync(at, "utf8"), lines = text.split("\n");
        const hits = lines.map((l, i) => (l.indexOf("/* plant:" + mark + " */") >= 0 ? i : -1)).filter((i) => i >= 0);
        if (hits.length !== 1) { bad.push(mark + " on " + hits.length + " lines"); continue; }
        const planted = lines.slice(); planted[hits[0]] = line;
        fs.writeFileSync(at, planted.join("\n"));
        const child = spawnSync(process.execPath, [path.join(copy, "tests", "team-leave.mjs")], { cwd: copy, encoding: "utf8", timeout: 180000,
          env: Object.assign({}, process.env, { TEAM_LEAVE_ONLY: legId, ETIUDA_PLANTS: "off" }) });
        fs.writeFileSync(at, text);
        const red = String(child.stderr || "").indexOf("FAIL " + legId) >= 0 && child.status !== 0;
        if (!red) bad.push(mark + " left " + legId + " green" + (child.error ? " (" + String(child.error.code || child.error) + ")" : ""));
      }
    } finally { dropPlantsTree(copy, ROOT); }
    if (bad.length) process.stderr.write("tlP " + bad.join("; ") + NL);
    return !bad.length && treeSha(ROOT) === was;
  });
}

process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + NL);
if (!ONLY && asserted + skipped !== EXPECTED) {
  process.stderr.write("SUITE DID NOT COMPLETE: " + (asserted + skipped) + " of " + EXPECTED + " checks ran" + NL);
  process.exit(78);
}
process.stdout.write("team-leave  " + (asserted - failed) + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)" + NL);
process.exit(failed > 0 ? 1 : 0);
