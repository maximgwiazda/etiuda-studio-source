/* A LEAD REMOVES A MEMBER, FORWARD ONLY. The new epoch, the wraps, the resealed edition and the confirm.
 *
 *     node tests/team-remove.mjs
 *
 * The page's half is tests/team-desks.mjs and the shell's is tests/shell-guards.mjs. This file calls src/studio.mjs
 * removeMember on a project and a share made here, with three admitted desks (the middle one removed), the removed one's
 * old request to join still on the share, and sealed editions, and no window. A removal made to fail is made to fail by a
 * folder planted where src/whole-write.cjs puts its sibling, which no system lets a file be opened over.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as Engine from "../src/engine.mjs";
import { makeKeyFile, unlockKey } from "../src/sign.mjs";
import { jsonText } from "../src/plain-json.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "team-remove");
const EXPECTED = 20;
const ONLY = process.env.TEAM_REMOVE_ONLY || "";
const NL = String.fromCharCode(10);
const PASS = "a passphrase for the lead's key in this gate";

/* ETIUDA_PLANTS=off (a merge's area run) skips the plant legs rmP and rmPE1 and counts them toward EXPECTED; the release
   profile runs with plants on, so they still run there. */
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
function skip(line) {
  skipped++;
  process.stdout.write("  SKIP  " + line + "\n");
}
async function leg(line, fn) {
  if (ONLY && !line.startsWith(ONLY)) return;
  try { check(!!(await fn()), line); }
  catch (e) { check(false, line + " (threw: " + String(e && e.message || e).split(NL)[0].slice(0, 180) + ")"); }
}
async function plantedLeg(line, fn) {
  if (ONLY && !line.startsWith(ONLY)) return;
  if (PLANTS_OFF) skip(line + " (ETIUDA_PLANTS=off)");
  else await leg(line, fn);
}
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const throwsOn = async (fn) => { try { await fn(); return ""; } catch (e) { return String(e && e.message || e); } };
const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex");
const rawPublic = (k) => crypto.createPublicKey(k).export({ type: "spki", format: "der" }).subarray(-32);
const spellings = (k) => [k.toString("hex"), k.toString("hex").toUpperCase(), k.toString("base64"), k.toString("base64url"),
  "[" + Array.from(k).join(",") + "]"];
const filesUnder = (dir) => !fs.existsSync(dir) ? [] : fs.readdirSync(dir, { withFileTypes: true }).flatMap(d =>
  d.isDirectory() ? filesUnder(path.join(dir, d.name)) : [path.join(dir, d.name)]);
const holds = (dir, k) => filesUnder(dir).filter(f => {
  const t = fs.readFileSync(f, "utf8").replace(/\s+/g, "");
  return spellings(k).some(s => t.indexOf(s) >= 0);
});
function newDesk(name) {
  const sign = crypto.generateKeyPairSync("ed25519"), box = crypto.generateKeyPairSync("x25519");
  const key = rawPublic(sign.privateKey).toString("hex");
  const id = "k-" + sha256(Buffer.from(key, "hex")).slice(0, 16);
  const block = { id, key, box: rawPublic(box.privateKey).toString("hex"), name };
  return { id, block, boxKey: box.privateKey, signKey: sign.privateKey };
}
const DESK_PREFIX = "etiuda-desk-branch" + NL;
function ownFile(by) {
  const doc = { desk: JSON.parse(JSON.stringify(by.block)) };
  doc.sig = { alg: "Ed25519", keyId: doc.desk.id };
  doc.sig.value = crypto.sign(null, Buffer.concat([Buffer.from(DESK_PREFIX, "utf8"),
    Buffer.from(Engine.sigRules().v2SignedBytes(doc))]), by.signKey).toString("hex");
  return doc;
}
function snap(dir) {
  return filesUnder(dir).sort().map(f => path.relative(dir, f) + "\n" + fs.readFileSync(f)).join("\n---\n");
}
function sealAt(at, key, team, epoch, obj) {
  const text = JSON.stringify(obj);
  fs.mkdirSync(path.dirname(at), { recursive: true });
  fs.writeFileSync(at, jsonText(Engine.sealRules().sealCatalog(key, team, epoch, text)));
  return text;
}
function openAt(at, key) {
  try { return Engine.sealRules().openSealed(key, readJson(at)); } catch { return null; }
}
/* A desk's request to join as an admission by its code leaves it: revealed, and answered to the lead's opening. */
function oldRequest(by, team, lead) {
  const J = Engine.joinRules(), nonce = crypto.randomBytes(32).toString("hex"), leadNonce = crypto.randomBytes(32).toString("hex");
  const desk = { id: by.block.id, key: by.block.key, box: by.block.box, name: by.block.name };
  const doc = { format: 1, kind: J.JOIN_KIND, team, desk, date: "2026-10-12T09:00:00.000Z",
    commit: J.joinCommit(team, desk.key, desk.box, nonce), reveal: nonce,
    opened: { lead: { keyId: lead.keyId, public: lead.public }, nonce: leadNonce } };
  doc.sig = { alg: "Ed25519", keyId: desk.id };
  doc.sig.value = crypto.sign(null, J.joinSignedBytes(doc), by.signKey).toString("hex");
  return { doc, leadNonce };
}

async function main() {
  clearScratch(SCRATCH);
  const SHARE = path.join(SCRATCH, "share");
  const ud = path.join(SCRATCH, "user-data");
  fs.mkdirSync(SHARE, { recursive: true });
  fs.mkdirSync(ud, { recursive: true });
  const S = await import("../src/studio.mjs");
  const T = await import("../src/team.mjs");
  const K = await import("../src/team-store.mjs");
  const W = Engine.hpkeRules();
  const keyAt = path.join(SCRATCH, "lead-key.json");
  const lead = await makeKeyFile({ passphrase: PASS });
  fs.writeFileSync(keyAt, JSON.stringify(lead, null, 1) + "\n");
  const opened = await S.newProject(path.join(SCRATCH, "projects"), "Harbour lamps", [{ code: "en", name: "English" }]);
  const dir = opened.dir, catId = opened.draft.id;
  S.setPublishFolder(dir, SHARE);
  const TEAM = "t-" + crypto.randomBytes(8).toString("hex");
  const key1 = crypto.randomBytes(32);
  const ala = newDesk("Ala"), ola = newDesk("Ola"), uma = newDesk("Uma");
  let team = Object.assign(T.newTeam({ id: TEAM, catalogs: [catId], lead: { keyId: lead.keyId, public: lead.public },
    sealed: true, exportsSealed: true }));
  team = T.admit(T.admit(T.admit(team, ownFile(ala), ala.id, key1), ownFile(ola), ola.id, key1), ownFile(uma), uma.id, key1);
  team = T.withRecovery(team, key1, T.recoveryOf(keyAt, PASS));
  await T.writeTeam(SHARE, team, { key: keyAt, passphrase: PASS });
  const lamp = { id: "c-north-lamp", rev: 2, edition: "2026-10-02" };
  const lampOld = { id: "c-north-lamp", rev: 1, edition: "2026-10-01" };
  const lampTie = { id: "c-north-lamp", rev: 2, edition: "2026-10-02" };
  const harbour = { id: "c-harbour", rev: 4, edition: "2026-09-01" };
  sealAt(path.join(SHARE, "north-lamp.ec"), key1, TEAM, 1, lamp);
  sealAt(path.join(SHARE, "north-lamp-b.ec"), key1, TEAM, 1, lampTie);
  sealAt(path.join(SHARE, "north-lamp-old.ec"), key1, TEAM, 1, lampOld);
  sealAt(path.join(SHARE, "harbour.ec"), key1, TEAM, 1, harbour);
  /* One catalog, one edition date, two revisions: the higher revision is the newer, and it is second by name. */
  const tideLow = { id: "c-tide", rev: 2, edition: "2026-10-05" }, tideHigh = { id: "c-tide", rev: 3, edition: "2026-10-05" };
  sealAt(path.join(SHARE, "tide-a.ec"), key1, TEAM, 1, tideLow);
  sealAt(path.join(SHARE, "tide-b.ec"), key1, TEAM, 1, tideHigh);
  sealAt(path.join(SHARE, "archive", "kept.ec"), key1, TEAM, 1, lamp);
  fs.writeFileSync(path.join(SHARE, "plain-note.ec"), jsonText({ id: "c-plain-note", rev: 1, edition: "2026-08-01" }));
  /* Ola's request to join, as her admission by code left it on the share, and the lead's file of openings answering it. */
  const J = Engine.joinRules(), olaAsked = oldRequest(ola, TEAM, lead);
  fs.mkdirSync(path.join(SHARE, "desks", ola.id), { recursive: true });
  fs.writeFileSync(path.join(SHARE, "desks", ola.id, "join.json"), JSON.stringify(olaAsked.doc, null, 1) + NL);
  const joins = { format: 1, kind: J.JOINS_KIND, team: TEAM, lead: { keyId: lead.keyId, public: lead.public },
    open: [{ desk: ola.id, commit: olaAsked.doc.commit, nonce: olaAsked.leadNonce }], sig: { alg: "Ed25519", keyId: lead.keyId } };
  joins.sig.value = crypto.sign(null, J.joinsSignedBytes(joins), unlockKey(lead, PASS).privateKey).toString("hex");
  fs.writeFileSync(path.join(SHARE, J.JOINS_NAME), JSON.stringify(joins, null, 1) + NL);
  const otherTeam = "t-" + "ab".repeat(8);
  sealAt(path.join(SHARE, "other-team.ec"), key1, otherTeam, 1, { id: "c-other", rev: 1, edition: "2026-08-02" });
  const keys = { [TEAM]: { 1: key1 } };
  const nextKey = crypto.randomBytes(32);
  const vault = {
    available: () => true,
    seal(text) {
      const iv = crypto.randomBytes(12), c = crypto.createCipheriv("aes-256-gcm", crypto.createHash("sha256").update("vault").digest(), iv);
      return Buffer.concat([iv, c.update(String(text), "utf8"), c.final(), c.getAuthTag()]);
    },
    open(bytes) {
      const b = Buffer.from(bytes), d = crypto.createDecipheriv("aes-256-gcm", crypto.createHash("sha256").update("vault").digest(), b.subarray(0, 12));
      d.setAuthTag(b.subarray(b.length - 16));
      return Buffer.concat([d.update(b.subarray(12, b.length - 16)), d.final()]).toString("utf8");
    },
  };
  const teamsAt = K.teamsFile(ud);
  K.keepTeamKey(teamsAt, vault, TEAM, 1, key1);
  const stay = ["north-lamp-old.ec", "tide-a.ec", "plain-note.ec", "other-team.ec", path.join("archive", "kept.ec")]
    .map(n => [n, fs.readFileSync(path.join(SHARE, n))]);
  const teamBytes = () => fs.readFileSync(path.join(SHARE, "etiuda-team.json"));
  const before = snap(SHARE);
  const call = (extra) => S.removeMember(dir, keyAt, TEAM, ola.id, PASS, Object.assign({ confirm: true, teamKeys: keys, nextKey, nextEpoch: 2 }, extra || {}));

  /* The final rename whole-write uses is the moment a sync client can see the file. The team file's rename has to come
     before any resealed edition's, on a removal and on a move that removes nobody. */
  const normDir = (p) => path.resolve(p).replace(/[\\/]+$/, "").toLowerCase();
  async function writeOrder(dir, fn) {
    const order = [], root = normDir(dir), real = fs.renameSync;
    fs.renameSync = (from, to, ...rest) => {
      const out = real.call(fs, from, to, ...rest);
      if (typeof to === "string" && normDir(path.dirname(to)) === root) {
        const base = path.basename(to);
        if (base === "etiuda-team.json" || /\.ec$/i.test(base)) order.push(base);
      }
      return out;
    };
    try { return { result: await fn(), order }; }
    finally { fs.renameSync = real; }
  }
  const revsAt = T.revsFile(keyAt);
  const revsSnap = () => fs.existsSync(revsAt) ? fs.readFileSync(revsAt) : null;
  const revsBack = (bytes) => {
    if (bytes == null) { if (fs.existsSync(revsAt)) fs.rmSync(revsAt); }
    else fs.writeFileSync(revsAt, bytes);
  };
  const namesOf = (dir) => filesUnder(dir).map((f) => path.relative(dir, f)).sort().join("\n");
  const teamFirst = (order, resealed) => {
    const at = order.indexOf("etiuda-team.json");
    return at >= 0 && resealed.length > 0 && resealed.every((n) => order.indexOf(n) > at);
  };

  await leg("rmA a removal and a move each write the team file before any resealed edition, delete nothing, and the team"
    + " file carries the new epoch's wraps while an earlier edition stays as it was", async () => {
    const heldRevs = revsSnap();
    const copyOf = (name) => { const to = path.join(SCRATCH, name); fs.cpSync(SHARE, to, { recursive: true }); return to; };
    const wrapsNow = (dir) => {
      const doc = readJson(path.join(dir, "etiuda-team.json"));
      return { epoch: doc.epoch, recovery: doc.recovery && doc.recovery.epoch,
        wraps: (doc.roster || []).map((e) => e && e.wrap ? e.wrap.epoch : null) };
    };
    try {
      const gone = copyOf("order-remove");
      const oldRemove = fs.readFileSync(path.join(gone, "north-lamp-old.ec")), namesRemove = namesOf(gone);
      const remove = await writeOrder(gone, () => call({ folder: gone }));
      /* The removal raised the floor. The move reads an epoch-1 copy, so the floor goes back between them. */
      revsBack(heldRevs);
      const moveDir = copyOf("order-move");
      const oldMove = fs.readFileSync(path.join(moveDir, "north-lamp-old.ec")), namesMove = namesOf(moveDir);
      const move = await writeOrder(moveDir, () => S.moveEpoch(dir, keyAt, TEAM, PASS,
        { confirm: true, teamKeys: keys, nextKey: crypto.randomBytes(32), nextEpoch: 2, folder: moveDir }));
      const rw = wrapsNow(gone), mw = wrapsNow(moveDir);
      const f = {
        removeOrder: teamFirst(remove.order, remove.result.resealed || []),
        moveOrder: teamFirst(move.order, move.result.resealed || []),
        removeKept: namesOf(gone) === namesRemove && fs.readFileSync(path.join(gone, "north-lamp-old.ec")).equals(oldRemove),
        moveKept: namesOf(moveDir) === namesMove && fs.readFileSync(path.join(moveDir, "north-lamp-old.ec")).equals(oldMove),
        removeWraps: rw.epoch === 2 && rw.recovery === 2 && rw.wraps.length === 2 && rw.wraps.every((e) => e === 2),
        moveWraps: mw.epoch === 2 && mw.recovery === 2 && mw.wraps.length === 3 && mw.wraps.every((e) => e === 2),
      };
      const ok = Object.keys(f).every((k) => f[k] === true);
      if (!ok) process.stderr.write("  rmA " + JSON.stringify({ f, remove: remove.order, move: move.order }) + NL);
      return ok;
    } finally { revsBack(heldRevs); }
  });

  if (ONLY === "rmA") {
    if (process.argv.indexOf("--keep") < 0) dropScratch(SCRATCH, "team-remove");
    process.stdout.write("#counts checks=" + asserted + " failed=" + failed + " expected=1\n");
    if (asserted !== 1) {
      process.stderr.write("SUITE DID NOT COMPLETE: " + asserted + " of 1 checks ran\n");
      return 78;
    }
    process.stdout.write("team-remove  " + asserted + " assertion(s), " + failed + " failure(s)\n");
    return failed ? 1 : 0;
  }

  await leg("rm0 without confirm the team file and every edition are byte for byte as they were, and the answer refuses", async () => {
    const r = await S.removeMember(dir, keyAt, TEAM, ola.id, PASS, { confirm: false, teamKeys: keys });
    const quiet = await S.removeMember(dir, keyAt, TEAM, ola.id, PASS, { teamKeys: keys });
    return snap(SHARE) === before && r.removed === false && r.refused === "not confirmed" && !r.teamKey
      && quiet.removed === false && teamBytes().equals(fs.readFileSync(path.join(SHARE, "etiuda-team.json")));
  });

  await leg("rm4 a team that is not this folder's, or a member who is not on the roster, writes nothing", async () => {
    const was = snap(SHARE);
    const wrong = await throwsOn(() => S.removeMember(dir, keyAt, "t-" + "cd".repeat(8), ola.id, PASS, { confirm: true, teamKeys: keys }));
    const mid = snap(SHARE);
    const gone = await throwsOn(() => S.removeMember(dir, keyAt, TEAM, "k-" + "ab".repeat(8), PASS, { confirm: true, teamKeys: keys }));
    return /holds a different team/.test(wrong) && /not on the team's list/.test(gone) && mid === was && snap(SHARE) === was;
  });

  await leg("rm5 a current-epoch file that does not open refuses the removal and writes nothing", async () => {
    const was = snap(SHARE);
    const said = await throwsOn(() => S.removeMember(dir, keyAt, TEAM, ola.id, PASS,
      { confirm: true, teamKeys: { [TEAM]: { 1: crypto.randomBytes(32) } } }));
    return /does not open/.test(said) && snap(SHARE) === was;
  });

  /* E5: each write the removal makes, made to fail in turn. The sibling src/whole-write.cjs writes first is planted as a
     folder, so the write cannot open it, on Windows and Linux alike. The files the removal reseals are dated in the past
     before each try, so a file the removal wrote and then put back says so by its time while its bytes say it is back. A try
     that goes through, or leaves the share changed, is red here, and the share is put back from a copy so the legs after
     this one read the share they were written for. */
  await leg("rm6 a team write that fails, and a failing mark on the member's old request each"
    + " throw, and leave the team file, the file of openings and every edition byte for byte as they were, a file of openings"
    + " that was not there included, and the rev floor as it was", async () => {
    let was = snap(SHARE);
    const COPY = SHARE + "-before-rm6";
    fs.cpSync(SHARE, COPY, { recursive: true });
    const putBack = () => { fs.rmSync(SHARE, { recursive: true, force: true }); fs.cpSync(COPY, SHARE, { recursive: true }); };
    const revsBefore = revsSnap();
    const floorNow = () => revsBefore == null ? !fs.existsSync(revsAt)
      : fs.existsSync(revsAt) && fs.readFileSync(revsAt).equals(revsBefore);
    const floorBack = () => {
      if (revsBefore == null) { if (fs.existsSync(revsAt)) fs.rmSync(revsAt); }
      else fs.writeFileSync(revsAt, revsBefore);
    };
    const realOpen = fs.openSync;
    const failAt = async (name) => {
      const prefix = path.join(SHARE, name) + ".";
      fs.openSync = (p, ...a) => {
        if (typeof p === "string" && p.startsWith(prefix) && p.endsWith(".tmp")) {
          const err = new Error("simulated write refusal");
          err.code = "EISDIR";
          throw err;
        }
        return realOpen.call(fs, p, ...a);
      };
      let said = "";
      try { said = await throwsOn(call); } finally { fs.openSync = realOpen; }
      const floor = floorNow();
      const same = snap(SHARE) === was;
      if (!said || !same) putBack();
      if (!floor) floorBack();
      return { name, said: said.slice(0, 60), same, floor };
    };
    const teamWrite = await failAt("etiuda-team.json");
    const mark = await failAt(J.JOINS_NAME);
    /* With no file of openings on the share, the mark makes one; a team write that then fails leaves none. */
    const joinsAt = path.join(SHARE, J.JOINS_NAME), outer = was;
    fs.renameSync(joinsAt, path.join(SCRATCH, "joins-aside.json"));
    was = snap(SHARE);
    const bare = await failAt("etiuda-team.json");
    const none = !fs.existsSync(joinsAt);
    if (!none) putBack();
    fs.renameSync(path.join(SCRATCH, "joins-aside.json"), joinsAt);
    if (snap(SHARE) !== outer) putBack();
    const f = {
      team: !!teamWrite.said && teamWrite.same && teamWrite.floor,
      mark: !!mark.said && mark.same && mark.floor,
      noneBefore: !!bare.said && bare.same && bare.floor && none };
    const ok = Object.keys(f).every(k => f[k]);
    if (!ok) process.stderr.write("  rm6 " + JSON.stringify({ f, teamWrite, mark, bare }) + NL);
    return ok;
  });

  await leg("rm9 a team write that fails puts the invitation secret back and leaves the team file as it was, and a retry"
    + " then removes the member and spends that invitation", async () => {
    const teamAt = path.join(SHARE, "etiuda-team.json");
    const copy = SHARE + "-before-rm9";
    fs.cpSync(SHARE, copy, { recursive: true });
    const teamsBefore = fs.readFileSync(teamsAt);
    const revsAt = T.revsFile(keyAt);
    const revsBefore = fs.existsSync(revsAt) ? fs.readFileSync(revsAt) : null;
    const putBack = () => {
      fs.rmSync(SHARE, { recursive: true, force: true });
      fs.cpSync(copy, SHARE, { recursive: true });
      fs.writeFileSync(teamsAt, teamsBefore);
      if (revsBefore == null) { if (fs.existsSync(revsAt)) fs.rmSync(revsAt); }
      else fs.writeFileSync(revsAt, revsBefore);
      fs.rmSync(copy, { recursive: true, force: true });
    };
    let plant = "";
    try {
      const invite = crypto.randomBytes(8).toString("hex");
      const secret = crypto.randomBytes(16).toString("hex");
      const heldNow = await T.heldTeam(SHARE, { key: keyAt });
      heldNow.team.roster.find((e) => e.desk.id === ola.id).invite = invite;
      await T.writeTeam(SHARE, heldNow.team, { key: keyAt, passphrase: PASS });
      K.keepInvite(teamsAt, vault, TEAM, { id: invite, secret, made: "2026-10-17T00:00:00.000Z",
        expires: "2026-11-17T00:00:00.000Z", name: "gate" });
      const beforeTeam = fs.readFileSync(teamAt);
      const realOpen = fs.openSync;
      const prefix = teamAt + ".";
      fs.openSync = (p, ...a) => {
        if (typeof p === "string" && p.startsWith(prefix) && p.endsWith(".tmp")) {
          const err = new Error("simulated write refusal");
          err.code = "EISDIR";
          throw err;
        }
        return realOpen.call(fs, p, ...a);
      };
      const said = await throwsOn(() => call({ teamsFile: teamsAt }));
      fs.openSync = realOpen;
      const inv = (readJson(teamsAt).teams[TEAM].invites || {})[invite];
      const opened = K.inviteSecretOf(teamsAt, vault, TEAM, invite);
      const failed = { threw: !!said, same: beforeTeam.equals(fs.readFileSync(teamAt)),
        secret: !!inv && inv.state === "live" && opened === secret };
      const removed = failed.same ? await call({ teamsFile: teamsAt }) : null;
      const spent = (K.invitesOf(teamsAt, TEAM).find((i) => i.id === invite) || {}).state === "spent";
      const gone = removed ? !(await T.heldTeam(SHARE, { key: keyAt })).team.roster.some((e) => e.desk.id === ola.id) : false;
      const ok = failed.threw && failed.same && failed.secret && !!removed && removed.removed === ola.id
        && removed.epoch === 2 && spent && gone && !K.inviteSecretOf(teamsAt, vault, TEAM, invite);
      if (!ok) process.stderr.write("  rm9 " + JSON.stringify({ said: String(said).slice(0, 80), failed, spent, gone,
        epoch: removed && removed.epoch }) + NL);
      return ok;
    } finally {
      if (plant) { try { fs.rmdirSync(plant); } catch { /* already gone */ } }
      putBack();
    }
  });

  /* The test architect's E1: once the team file lands, a failure rolls forward, not back.
     The reseal fails after the team file, a desk reads the new file between, the next attempt
     completes, and the desk opens every edition with no second E+1 key. */
  await leg("rmE1 the reseal fails after the team file, a desk reads the new file between, the next attempt completes, and the desk opens every edition with no second E+1 key", async () => {
    const copy = SHARE + "-before-rmE1";
    fs.cpSync(SHARE, copy, { recursive: true });
    const revsHeld = revsSnap();
    const putBack = () => {
      fs.rmSync(SHARE, { recursive: true, force: true });
      fs.cpSync(copy, SHARE, { recursive: true });
      revsBack(revsHeld);
      fs.rmSync(copy, { recursive: true, force: true });
    };
    try {
      const realOpen = fs.openSync;
      const prefix = path.join(SHARE, "north-lamp.ec") + ".";
      fs.openSync = (p, ...a) => {
        if (typeof p === "string" && p.startsWith(prefix) && p.endsWith(".tmp")) {
          const err = new Error("simulated reseal failure");
          err.code = "EISDIR";
          throw err;
        }
        return realOpen.call(fs, p, ...a);
      };
      let said = "";
      try { said = await throwsOn(() => call()); }
      finally { fs.openSync = realOpen; }

      /* A desk reads the new file between: the team file landed at epoch 2 and stayed; desk unwraps its key. */
      const teamMid = readJson(path.join(SHARE, "etiuda-team.json"));
      const alaEntry = (teamMid.roster || []).find((e) => e && e.desk && e.desk.id === ala.id);
      const deskKey = alaEntry && alaEntry.wrap ? W.unwrapTeamKey(ala.boxKey, alaEntry.wrap, teamMid.id, teamMid.epoch, ala.id) : null;

      /* In between: harbour.ec was already resealed to epoch 2; north-lamp.ec is still readable under epoch 1. */
      const harbourMid = deskKey ? openAt(path.join(SHARE, "harbour.ec"), deskKey) : null;
      const lampMid = openAt(path.join(SHARE, "north-lamp.ec"), key1);

      /* The next attempt completes: */
      const done2 = await call();

      /* The desk opens every edition with no second E+1 key: */
      const resealing = ["harbour.ec", "north-lamp.ec", "north-lamp-b.ec", "tide-b.ec"];
      const everyOpens = !!deskKey && resealing.every((n) => openAt(path.join(SHARE, n), deskKey) != null);
      const noSecondKey = !!done2 && Buffer.isBuffer(done2.teamKey) && deskKey && done2.teamKey.equals(deskKey)
        && (nextKey == null || done2.teamKey.equals(nextKey));
      const teamFinal = readJson(path.join(SHARE, "etiuda-team.json"));

      const f = {
        threw: !!said,
        teamLandedMid: teamMid.epoch === 2 && !(teamMid.roster || []).some((e) => e && e.desk && e.desk.id === ola.id),
        deskKey: !!deskKey,
        harbourMid: !!harbourMid,
        lampMid: !!lampMid,
        completed: !!done2 && done2.removed === ola.id && done2.epoch === 2,
        everyOpens,
        noSecondKey,
        finalEpoch: teamFinal.epoch === 2,
      };
      const ok = Object.keys(f).every((k) => f[k] === true);
      if (!ok) process.stderr.write("  rmE1 " + JSON.stringify(f) + NL);
      return ok;
    } finally {
      putBack();
    }
  });

  if (ONLY === "rmE1") {
    if (process.argv.indexOf("--keep") < 0) dropScratch(SCRATCH, "team-remove");
    process.stdout.write("#counts checks=" + asserted + " failed=" + failed + " expected=1\n");
    if (asserted !== 1) {
      process.stderr.write("SUITE DID NOT COMPLETE: " + asserted + " of 1 checks ran\n");
      return 78;
    }
    process.stdout.write("team-remove  " + asserted + " assertion(s), " + failed + " failure(s)\n");
    return failed ? 1 : 0;
  }

  /* C2 of board 974 (the test architect's triage of 2026-11-10, security 2): once a removal's team file has landed, a reseal
     that failed is completed with no further act by the lead, by the watch's own pass (src/studio.mjs resealBehind, which
     shell/main.js watchOnce calls at the next start, focus or change), and never by a publish. The write of the first edition
     the removal reseals is refused EBUSY at its sibling, which is how src/whole-write.cjs writeWhole opens it, for as long as
     the removal runs. Before the pass that edition is still sealed at key number 1, so the removed member's key opens the
     newest edition; after it, only key number 2 does. */
  const passKeys = () => ({ [TEAM]: { 1: key1, 2: nextKey } });
  const resealPass = async (folder) => typeof S.resealBehind === "function"
    ? S.resealBehind(folder, keyAt, { teamKeys: passKeys() }) : null;
  const newestFour = ["harbour.ec", "north-lamp.ec", "north-lamp-b.ec", "tide-b.ec"];
  await leg("rmC2 a removal whose first edition's reseal is refused EBUSY after the team file landed is completed by the"
    + " watch's own pass with no publish: that edition, and every other newest edition, opens with key number 2 only, and"
    + " an older revision stays as it was", async () => {
    const copy = SHARE + "-before-rmC2";
    fs.cpSync(SHARE, copy, { recursive: true });
    const revsHeld = revsSnap();
    const putBack = () => {
      fs.rmSync(SHARE, { recursive: true, force: true });
      fs.cpSync(copy, SHARE, { recursive: true });
      revsBack(revsHeld);
      fs.rmSync(copy, { recursive: true, force: true });
    };
    try {
      const realOpen = fs.openSync, root = normDir(SHARE);
      let first = "";
      fs.openSync = (p, ...a) => {
        if (typeof p === "string" && normDir(path.dirname(p)) === root) {
          const m = /^(.+\.ec)\.[^\\/]*\.tmp$/i.exec(path.basename(p));
          if (m && !first) first = m[1];
          if (m && m[1] === first) {
            const err = new Error("EBUSY: resource busy or locked, open '" + p + "'");
            err.code = "EBUSY";
            throw err;
          }
        }
        return realOpen.call(fs, p, ...a);
      };
      let said = "";
      try { said = await throwsOn(() => call()); }
      finally { fs.openSync = realOpen; }
      const at = path.join(SHARE, first || "none.ec");
      const mid = { epoch: fs.existsSync(at) ? readJson(at).epoch : null, oldOpens: openAt(at, key1) != null,
        team: readJson(path.join(SHARE, "etiuda-team.json")).epoch };
      const published = fs.readdirSync(SHARE).filter((n) => /\.ec$/i.test(n)).sort().join();
      /* A pass that holds another key at number 1 (one set aside, say) cannot open that edition: it is owed, never skipped as done. */
      const wrong = typeof S.resealBehind === "function"
        ? await S.resealBehind(SHARE, keyAt, { teamKeys: { [TEAM]: { 1: crypto.randomBytes(32), 2: nextKey } } }) : null;
      const pass = await resealPass(SHARE);
      const after = newestFour.map((n) => ({ n, epoch: readJson(path.join(SHARE, n)).epoch,
        newOnly: openAt(path.join(SHARE, n), nextKey) != null && openAt(path.join(SHARE, n), key1) == null }));
      const f = {
        refused: /EBUSY/.test(said) && newestFour.indexOf(first) >= 0,
        landedFirst: mid.team === 2 && mid.epoch === 1 && mid.oldOpens,
        noPublish: fs.readdirSync(SHARE).filter((n) => /\.ec$/i.test(n)).sort().join() === published,
        completed: after.every((x) => x.epoch === 2 && x.newOnly),
        olderStays: readJson(path.join(SHARE, "north-lamp-old.ec")).epoch === 1
          && openAt(path.join(SHARE, "north-lamp-old.ec"), key1) === JSON.stringify(lampOld),
        answered: !!pass && Array.isArray(pass.resealed) && pass.resealed.indexOf(first) >= 0,
        unopenedOwed: !!wrong && wrong.owed === true && Array.isArray(wrong.resealed) && wrong.resealed.indexOf(first) < 0,
      };
      const ok = Object.keys(f).every((k) => f[k] === true);
      if (!ok) process.stderr.write("  rmC2 " + JSON.stringify({ f, first, said: said.slice(0, 80), mid, after, wrong }) + NL);
      return ok;
    } finally {
      putBack();
    }
  });

  /* Board 978. Once the team file has landed, the removal is recorded and the cover says so, whatever the reseal does.
     A team file that never lands records nothing and keeps the disk refusal the cover has now. */
  const OWED_EN = "{NAME} is off the team. One catalog, {FILE}, has not yet been sealed again for the team as it now stands. Studio tries again each time it checks the team's folder, and at its next start, so it finishes by itself while Studio is open.";
  const OWED_PL = "{NAME} nie jest już członkiem zespołu. Jeden katalog, plik {FILE}, nie został jeszcze ponownie zapieczętowany dla zespołu w nowym składzie. Studio ponawia próbę przy każdym sprawdzeniu folderu zespołu i przy następnym uruchomieniu, więc dokończy to samo, gdy będzie otwarte.";
  const fillSaid = (frame, vars) => String(frame).replace(/\{(\w+)\}/g, (m, k) =>
    vars && Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : m);
  const htmlText = (html) => String(html == null ? "" : html).replace(/<[^>]*>/g, " ")
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ").trim();
  async function removalCover(reply, lang) {
    const { loadPage } = await import("./page-stand-in.mjs");
    const dir = "C:/Projects/harbour";
    const desks = {
      error: null, folder: "C:/share", id: catId, mark: null, signing: "studio-lead", file: "ours",
      reason: "", inside: false, keyHeld: true, canKeep: true, restorable: null, requests: [],
      team: { id: TEAM, epoch: 1, sealed: true, lists: true, exportsSealed: true, roster: [
        { id: ola.id, name: "Ola", own: "", key: ola.id.slice(2), admitted: true },
        { id: ala.id, name: "Ala", own: "", key: ala.id.slice(2), admitted: true }] },
    };
    const api = { memberRemove: async () => JSON.parse(JSON.stringify(reply)) };
    const home = loadPage({ api, uiLang: lang });
    const P = home.page;
    const open = { dir, name: "Harbour", editions: ["2026-10-02"],
      counts: { cards: 1, intents: 0, cats: 1, rv: 2 },
      lint: { errors: 0, warnings: 0, notes: 0, suggestions: 0 },
      draft: { langs: [{ code: "en" }], cards: [], rules: [] },
      project: { id: catId, title: "Harbour", rev: 2, folder: "C:/share", fileName: "harbour.ec" } };
    Object.assign(P.S, { open, screen: "projects", home: "team", teamDir: open.dir, lang: lang || "en", desks,
      dkNote: null, err: null, cover: null, memberName: "", teamWant: "", memberGoing: "" });
    P.ACTS["member-remove"]({ getAttribute: () => ola.id });
    await P.ACTS["do-member-remove"]();
    return {
      cover: htmlText(home.node("#dlg").innerHTML),
      main: htmlText(home.node("#main").innerHTML),
      note: Array.isArray(P.S.dkNote) ? P.S.dkNote.join(" ") : "",
      open: P.S.cover === "team",
      going: P.S.memberGoing,
      roster: (P.S.desks && P.S.desks.team && Array.isArray(P.S.desks.team.roster) ? P.S.desks.team.roster : []).map((r) => r.id),
    };
  }
  function holdShare(tag) {
    const copy = SHARE + "-before-" + tag;
    fs.cpSync(SHARE, copy, { recursive: true });
    const revsHeld = revsSnap();
    const teamsHeld = fs.existsSync(teamsAt) ? fs.readFileSync(teamsAt) : null;
    const putBack = () => {
      fs.rmSync(SHARE, { recursive: true, force: true });
      fs.cpSync(copy, SHARE, { recursive: true });
      revsBack(revsHeld);
      fs.rmSync(copy, { recursive: true, force: true });
      if (teamsHeld == null) { if (fs.existsSync(teamsAt)) fs.rmSync(teamsAt); }
      else fs.writeFileSync(teamsAt, teamsHeld);
    };
    return putBack;
  }

  await leg("rm978 a removal whose first edition write is refused after the team file lands leaves the removal record and"
    + " the note, and the cover says the teammate is removed and that catalog's reseal is still owed", async () => {
    const putBack = holdShare("rm978");
    try {
      const realOpen = fs.openSync, root = normDir(SHARE);
      let first = "";
      fs.openSync = (p, ...a) => {
        if (typeof p === "string" && normDir(path.dirname(p)) === root) {
          const m = /^(.+\.ec)\.[^\\/]*\.tmp$/i.exec(path.basename(p));
          if (m && !first) first = m[1];
          if (m && m[1] === first) {
            const err = new Error("EBUSY: resource busy or locked, open '" + p + "'");
            err.code = "EBUSY";
            throw err;
          }
        }
        return realOpen.call(fs, p, ...a);
      };
      let caught = null;
      try { await call({ teamsFile: teamsAt }); }
      catch (e) { caught = e; }
      finally { fs.openSync = realOpen; }
      const rec = (K.removedOf(teamsAt, TEAM) || {})[ola.id] || null;
      const teamNow = readJson(path.join(SHARE, "etiuda-team.json"));
      const onRoster = (teamNow.roster || []).some((e) => e && e.desk && e.desk.id === ola.id);
      const frame = caught && caught.said && caught.said.frame;
      const vars = (caught && caught.said && caught.said.vars) || {};
      const shellReply = {
        error: caught ? String(caught.message || "") : "",
        said: caught && caught.said ? caught.said : null,
        resealOwed: caught && caught.resealOwed ? caught.resealOwed : "",
        removed: ola.id,
      };
      const en = await removalCover(shellReply, "en");
      const pl = await removalCover(shellReply, "pl");
      const enLine = fillSaid(OWED_EN, { NAME: "Ola", FILE: first });
      const plLine = fillSaid(OWED_PL, { NAME: "Ola", FILE: first });
      const f = {
        threw: !!(caught && /EBUSY/.test(String(caught.message || "")) && String(caught.message || "").indexOf("try again") < 0),
        owed: !!(caught && caught.landed === true && caught.resealOwed === first && newestFour.indexOf(first) >= 0),
        frame: frame === OWED_EN && vars.NAME === "Ola" && vars.FILE === first,
        recorded: !!(rec && rec.key === ola.block.key && rec.epoch === 2),
        off: teamNow.epoch === 2 && !onRoster,
        cover: en.open && en.cover.indexOf(enLine) >= 0 && en.cover.indexOf("try again") < 0,
        note: en.note.indexOf("Ola is no longer on the team.") >= 0,
        polish: pl.open && pl.cover.indexOf(plLine) >= 0 && pl.cover.indexOf(enLine) < 0,
      };
      const ok = Object.keys(f).every((k) => f[k] === true);
      if (!ok) process.stderr.write("  detail " + JSON.stringify({ f, first, frame, vars, rec: !!rec,
        cover: en.cover.slice(0, 180), note: en.note, pl: pl.cover.slice(0, 180) }) + NL);
      return ok;
    } finally {
      putBack();
    }
  });

  await leg("rm978b a removal whose team file write is refused records nothing and the cover keeps the error it has now", async () => {
    const putBack = holdShare("rm978b");
    try {
      const realOpen = fs.openSync;
      fs.openSync = (p, ...a) => {
        if (typeof p === "string" && path.basename(p).indexOf("etiuda-team.json.") === 0 && /\.tmp$/i.test(p)) {
          const err = new Error("EBUSY: resource busy or locked, open '" + p + "'");
          err.code = "EBUSY";
          throw err;
        }
        return realOpen.call(fs, p, ...a);
      };
      let caught = null;
      try { await call({ teamsFile: teamsAt }); }
      catch (e) { caught = e; }
      finally { fs.openSync = realOpen; }
      const { diskRefusal } = await import("../src/refusal.mjs");
      const disk = diskRefusal(caught);
      const rec = (K.removedOf(teamsAt, TEAM) || {})[ola.id] || null;
      const teamNow = readJson(path.join(SHARE, "etiuda-team.json"));
      const onRoster = (teamNow.roster || []).some((e) => e && e.desk && e.desk.id === ola.id);
      const reply = {
        error: disk && disk.message ? disk.message : String(caught && caught.message || ""),
        said: disk && disk.said ? disk.said : null,
      };
      const en = await removalCover(reply, "en");
      const f = {
        threw: !!caught && !(caught && caught.landed),
        nothing: !rec && onRoster && teamNow.epoch === 1,
        noOwed: !(caught && (caught.resealOwed || (caught.said && caught.said.frame === OWED_EN))),
        cover: en.open && /try again/.test(en.cover) && en.cover.indexOf("is removed") < 0 && !en.note,
      };
      const ok = Object.keys(f).every((k) => f[k] === true);
      if (!ok) process.stderr.write("  detail " + JSON.stringify({ f, code: caught && caught.code, path: caught && caught.path,
        said: caught && caught.said, message: String(caught && caught.message || "").slice(0, 160),
        cover: en.cover.slice(0, 200), note: en.note, epoch: teamNow.epoch, onRoster, rec: !!rec }) + NL);
      return ok;
    } finally {
      putBack();
    }
  });

  /* Tau 2 of the Grok review of 2026-11-22 (verified A): Remove of a person with more than one computer, where one computer's
     removal was refused after another came off (the shell's stillOn and gone, shell/main.js studio:member-remove). The cover
     stays, says how many computers are still on the team in its own words and never that the person is off, drops the
     computer that came off, and stands on the one still there, so Remove pressed again takes it off. */
  const PARTIAL_EN = "This teammate is still on the team: some of their computers could not be taken off. Still on the team: {N}. Remove tries them again.";
  const PARTIAL_PL = "Ta osoba nadal jest w zespole: nie udało się odłączyć części jej komputerów. Nadal w zespole: {N}. Przycisk Usuń spróbuje ponownie.";
  await leg("rmTau2 a Remove that took one computer of the person off and not another keeps the cover, says how many are still"
    + " on the team, never that the person is off, and stands on the computer still there", async () => {
    const reply = {
      error: "EBUSY: resource busy or locked, open 'etiuda-team.json'",
      said: { frame: PARTIAL_EN, vars: { N: 1 } },
      removed: ola.id, stillOn: [ala.id], gone: [ola.id], team: { id: TEAM, epoch: 2 },
    };
    const en = await removalCover(reply, "en");
    const pl = await removalCover(reply, "pl");
    const enLine = fillSaid(PARTIAL_EN, { N: 1 }), plLine = fillSaid(PARTIAL_PL, { N: 1 });
    const f = {
      cover: en.open && en.cover.indexOf(enLine) >= 0,
      notDone: en.note.indexOf("no longer on the team") < 0 && en.cover.indexOf("is off the team") < 0 && en.main.indexOf("no longer on the team") < 0,
      going: en.going === ala.id,
      roster: JSON.stringify(en.roster) === JSON.stringify([ala.id]),
      polish: pl.open && pl.cover.indexOf(plLine) >= 0 && pl.cover.indexOf(enLine) < 0,
    };
    const ok = Object.keys(f).every((k) => f[k] === true);
    if (!ok) process.stderr.write("  detail " + JSON.stringify({ f, cover: en.cover.slice(0, 240), note: en.note, going: en.going,
      roster: en.roster, pl: pl.cover.slice(0, 240) }) + NL);
    return ok;
  });

  /* Argon's second route for C2: two Studios on one lead key, each with its own copy of the team's files (a mirror). The
     first publishes a newer revision sealed at key number 1 that has not reached the second's copy when the second removes
     a member, so the second's removal reseals only the older revision it holds. The copy the sync then makes keeps the
     higher revision, as the syncer's floor does (engine shell/folder/syncer.cjs floorHolds: a root edition's rev under its
     signer only rises), and the team file at key number 2 reaches the first. The newest edition is then sealed at key number
     1 under a team at key number 2, and the removed member's key opens it. Each Studio's own pass completes it. */
  await leg("rmC2b two Studios on one lead key: a newer revision sealed at key number 1 that reaches the share after the other"
    + " Studio's removal is the newest edition and opens with the removed member's key, and either Studio's own pass seals it"
    + " at key number 2 with no publish", async () => {
    const revsHeld = revsSnap();
    const one = path.join(SCRATCH, "c2b-studio-one"), two = path.join(SCRATCH, "c2b-studio-two");
    try {
      fs.cpSync(SHARE, one, { recursive: true });
      fs.cpSync(SHARE, two, { recursive: true });
      const lampNew = { id: "c-north-lamp", rev: 3, edition: "2026-10-03" };
      sealAt(path.join(one, "north-lamp.ec"), key1, TEAM, 1, lampNew);
      const removed = await call({ folder: two });
      /* The sync, as the syncer's floor lands it: the higher revision wins at its path, and the team file at the newer key
         number reaches the other copy. */
      fs.copyFileSync(path.join(one, "north-lamp.ec"), path.join(two, "north-lamp.ec"));
      fs.copyFileSync(path.join(two, "etiuda-team.json"), path.join(one, "etiuda-team.json"));
      const lampAt = path.join(two, "north-lamp.ec");
      const route = { removed: !!removed && removed.epoch === 2, team: readJson(path.join(two, "etiuda-team.json")).epoch === 2,
        sealedOld: readJson(lampAt).epoch === 1, oldOpens: openAt(lampAt, key1) === JSON.stringify(lampNew) };
      const passTwo = await resealPass(two);
      const passOne = await resealPass(one);
      const closed = [one, two].every((d) => {
        const at = path.join(d, "north-lamp.ec");
        return readJson(at).epoch === 2 && openAt(at, nextKey) === JSON.stringify(lampNew) && openAt(at, key1) == null;
      });
      const f = { route: Object.keys(route).every((k) => route[k] === true), closed,
        answered: !!passTwo && !!passOne && (passTwo.resealed || []).indexOf("north-lamp.ec") >= 0
          && (passOne.resealed || []).indexOf("north-lamp.ec") >= 0 };
      const ok = Object.keys(f).every((k) => f[k] === true);
      if (!ok) process.stderr.write("  rmC2b " + JSON.stringify({ f, route }) + NL);
      return ok;
    } finally {
      revsBack(revsHeld);
      fs.rmSync(one, { recursive: true, force: true });
      fs.rmSync(two, { recursive: true, force: true });
    }
  });

  let done = null;
  await leg("rm1 three admitted and the middle one removed: a new epoch, the removed member off the roster and no wrap in it"
    + " opening to her box, and each member who remains unwraps the new key with its own box key and opens every resealed"
    + " edition with it", async () => {
    done = await call();
    const held = await T.heldTeam(SHARE, { key: keyAt }), t = held.team;
    const unwrap = (box, e, id) => { try { return W.unwrapTeamKey(box, e.wrap, t.id, t.epoch, id); } catch { return null; } };
    const each = [ala, uma].map(m => {
      const e = t.roster.find(x => x.desk.id === m.id);
      const k = e && e.wrap ? unwrap(m.boxKey, e, m.id) : null;
      return !!k && k.equals(done.teamKey) && done.resealed.length > 0
        && done.resealed.every(n => openAt(path.join(SHARE, n), k) != null);
    });
    const hers = t.roster.some(e => e.wrap && (unwrap(ola.boxKey, e, e.desk.id) || unwrap(ola.boxKey, e, ola.id)));
    const f = { epoch: done.epoch === 2 && t.epoch === 2 && done.removed === ola.id, off: !t.roster.some(e => e.desk.id === ola.id)
      && t.roster.length === 2, eachOpens: each, hersOpens: hers, fresh: !done.teamKey.equals(key1) };
    const ok = f.epoch && f.off && each.every(Boolean) && !hers && f.fresh;
    if (!ok) process.stderr.write("  rm1 " + JSON.stringify(f) + NL);
    return ok;
  });

  await leg("rm8 the resealed edition opens under the key this removal was handed, the one kept for the new epoch"
    + " before the share moved, and the key that was removed does not open it", async () => {
    if (!done || !Buffer.isBuffer(done.teamKey)) return false;
    const text = openAt(path.join(SHARE, "north-lamp.ec"), nextKey);
    const ok = done.teamKey.equals(nextKey) && !!text && text.indexOf("c-north-lamp") >= 0
      && openAt(path.join(SHARE, "north-lamp.ec"), key1) == null;
    if (!ok) process.stderr.write("  rm8 " + JSON.stringify({ same: !!(done.teamKey && done.teamKey.equals(nextKey)),
      opens: !!text }) + NL);
    return ok;
  });

  await leg("rm2 the newest edition of each catalog (both of a tie, and of two revisions with one edition date only the higher)"
    + " is sealed again, its envelope naming the team and the new epoch and opening under the key that epoch names, not the"
    + " old one; an older revision, the lower revision of that date, the archive, a plain file and another team's file are"
    + " unchanged", async () => {
    const byEpoch = { 1: key1, 2: done.teamKey };
    const newest = ["north-lamp.ec", "north-lamp-b.ec", "harbour.ec", "tide-b.ec"];
    const labelled = newest.every(n => {
      const env = readJson(path.join(SHARE, n)), k = byEpoch[env.epoch];
      return env.team === TEAM && env.epoch === done.epoch && !!k && openAt(path.join(SHARE, n), k) != null
        && openAt(path.join(SHARE, n), key1) == null;
    });
    const older = ["north-lamp-old.ec", "tide-a.ec"].map(n => [n, readJson(path.join(SHARE, n))]);
    const oldStays = older.every(([n, env]) => env.epoch === 1 && openAt(path.join(SHARE, n), byEpoch[env.epoch]) != null)
      && openAt(path.join(SHARE, "north-lamp-old.ec"), key1) === JSON.stringify(lampOld)
      && openAt(path.join(SHARE, "tide-a.ec"), key1) === JSON.stringify(tideLow);
    const left = stay.every(([n, b]) => fs.readFileSync(path.join(SHARE, n)).equals(b));
    const innerText = openAt(path.join(SHARE, "north-lamp.ec"), byEpoch[2]), tideText = openAt(path.join(SHARE, "tide-b.ec"), byEpoch[2]);
    const inner = innerText ? JSON.parse(innerText) : {}, tide = tideText ? JSON.parse(tideText) : {};
    const f = { labelled, oldStays, left, inner: inner.rev === 2 && inner.id === "c-north-lamp", tide: tide.rev === 3,
      resealed: done.resealed.slice().sort().join() === newest.slice().sort().join() ? true : done.resealed };
    const ok = Object.keys(f).every(k => f[k] === true);
    if (!ok) process.stderr.write("  rm2 " + JSON.stringify(f) + NL);
    return ok;
  });

  await leg("rm3 the epoch just closed keeps its key beside the new one, and neither key is in the share in the clear", async () => {
    K.keepTeamKey(teamsAt, vault, TEAM, 2, done.teamKey);
    const got = K.teamKeysOf(teamsAt, vault);
    const a = got[TEAM][1], b = got[TEAM][2];
    return Buffer.isBuffer(a) && a.equals(key1) && Buffer.isBuffer(b) && b.equals(done.teamKey)
      && holds(SHARE, key1).length === 0 && holds(SHARE, done.teamKey).length === 0;
  });

  /* E4: the module's answer as the page would get it, once the shell has taken out the key and the written file. */
  await leg("rm7 the removal's answer, with teamKey and written taken out as the shell takes them, holds no spelling of either"
    + " key, no bytes anywhere, and no wrap or ciphertext", async () => {
    const r = Object.assign({}, done);
    delete r.teamKey;
    delete r.written;
    const found = [];
    const walk = (v, at) => {
      if (Buffer.isBuffer(v) || ArrayBuffer.isView(v) || v instanceof ArrayBuffer) { found.push(at + " is bytes"); return; }
      if (!v || typeof v !== "object") return;
      Object.keys(v).forEach(k => { if (k === "wrap" || k === "ct") found.push(at + "." + k); walk(v[k], at + "." + k); });
    };
    walk(r, "answer");
    const text = JSON.stringify(r).replace(/\s+/g, "");
    const spelt = [key1, done.teamKey].filter(k => spellings(k).some(s => text.indexOf(s) >= 0)).length;
    if (found.length || spelt) process.stderr.write("  rm7 " + JSON.stringify({ found, spelt }) + NL);
    return Buffer.isBuffer(done.teamKey) && found.length === 0 && spelt === 0 && r.removed === ola.id;
  });

  await leg("rm10 a second Studio's totals include a desk this one removed, after it reads the team file", async () => {
    let Book = null, Removed = null;
    try { Book = await import("../src/lead-book.mjs"); Removed = await import("../src/removed.mjs"); }
    catch { Book = null; }
    if (!Book || !done || !done.removedDesk) return false;
    K.keepTeamKey(teamsAt, vault, TEAM, done.epoch, done.teamKey);
    K.markRemoved(teamsAt, TEAM, done.removedDesk, done.removedAt, done.epoch, done.removedFiles);
    const held = await T.heldTeam(SHARE, { key: keyAt });
    const revBefore = held.team && held.team.rev;
    const wrote = await Book.publishLeadBook({ folder: SHARE, team: held.team, keyFile: keyAt, secret: PASS,
      teamsFile: teamsAt, vault, teamKey: done.teamKey, now: Date.now() });
    const udB = path.join(SCRATCH, "user-data-b");
    fs.mkdirSync(udB, { recursive: true });
    const fileB = K.teamsFile(udB);
    const read = await T.readTeam(SHARE);
    await Book.absorbLeadBook({ team: read.team, keyFile: keyAt, secret: PASS, teamsFile: fileB, vault, folder: SHARE, now: Date.now() });
    const got = K.removedOf(fileB, TEAM)[ola.id];
    const heldFiles = Removed.removedHeld(SHARE, K.removedOf(fileB, TEAM));
    const text = fs.readFileSync(path.join(SHARE, "etiuda-team.json"), "utf8");
    return !!got && got.key === done.removedDesk.key && got.epoch === done.epoch
      && got.files["desks/" + ola.id + "/join.json"] === done.removedFiles["desks/" + ola.id + "/join.json"]
      && heldFiles[ola.id] && heldFiles[ola.id]["desks/" + ola.id + "/join.json"]
      && text.indexOf(done.removedDesk.key) < 0 && wrote.team.rev > revBefore;
  });

  await plantedLeg("rmP removing the line that writes the team file before the editions turns rmA red, and this checkout is unchanged", async () => {
    const { plantsTree, treeSha, dropPlantsTree } = await import("./plants-tree.mjs");
    const before = treeSha(ROOT);
    const studioAt = path.join(ROOT, "src", "studio.mjs");
    const fileSha = () => crypto.createHash("sha256").update(fs.readFileSync(studioAt)).digest("hex");
    const want = fileSha();
    const copy = plantsTree(ROOT, "team-remove-f7");
    let red = false, hits = 0, detail = "";
    try {
      const at = path.join(copy, "src", "studio.mjs");
      const text = fs.readFileSync(at, "utf8");
      const nl = text.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
      const lines = text.split(nl);
      const mark = "/* plant:f7-team-first */";
      for (let i = 0; i < lines.length; i++) if (lines[i].indexOf(mark) >= 0) hits++;
      if (hits === 1) {
        fs.writeFileSync(at, lines.filter((l) => l.indexOf(mark) < 0).join(nl));
        const child = spawnSync(process.execPath, [path.join(copy, "tests", "team-remove.mjs")], {
          cwd: copy, encoding: "utf8", timeout: 120000,
          env: Object.assign({}, process.env, { TEAM_REMOVE_ONLY: "rmA" }),
        });
        const said = String(child.stdout || "") + String(child.stderr || "");
        red = said.indexOf("FAIL rmA") >= 0;
        if (!red) detail = "status " + (child && child.status) + " " + said.slice(0, 500);
      }
    } finally {
      dropPlantsTree(copy, ROOT);
    }
    const back = fileSha() === want && treeSha(ROOT) === before;
    const ok = hits === 1 && red && back;
    if (!ok) process.stderr.write("  rmP " + JSON.stringify({ hits, red, back, detail }) + NL);
    return ok;
  });

  await plantedLeg("rmPE1 removing the line that keeps the landed team file on a later failure turns rmE1 red, and this checkout is unchanged", async () => {
    const { plantsTree, treeSha, dropPlantsTree } = await import("./plants-tree.mjs");
    const before = treeSha(ROOT);
    const studioAt = path.join(ROOT, "src", "studio.mjs");
    const fileSha = () => crypto.createHash("sha256").update(fs.readFileSync(studioAt)).digest("hex");
    const want = fileSha();
    const copy = plantsTree(ROOT, "team-remove-f7-e1");
    let red = false, hits = 0, detail = "";
    try {
      const at = path.join(copy, "src", "studio.mjs");
      const text = fs.readFileSync(at, "utf8");
      const nl = text.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
      const lines = text.split(nl);
      const mark = "/* plant:f7-roll-forward */";
      for (let i = 0; i < lines.length; i++) if (lines[i].indexOf(mark) >= 0) hits++;
      if (hits === 1) {
        fs.writeFileSync(at, lines.filter((l) => l.indexOf(mark) < 0).join(nl));
        const child = spawnSync(process.execPath, [path.join(copy, "tests", "team-remove.mjs")], {
          cwd: copy, encoding: "utf8", timeout: 120000,
          env: Object.assign({}, process.env, { TEAM_REMOVE_ONLY: "rmE1" }),
        });
        const said = String(child.stdout || "") + String(child.stderr || "");
        red = said.indexOf("FAIL rmE1") >= 0;
        if (!red) detail = "status " + (child && child.status) + " " + said.slice(0, 500);
      }
    } finally {
      dropPlantsTree(copy, ROOT);
    }
    const back = fileSha() === want && treeSha(ROOT) === before;
    const ok = hits === 1 && red && back;
    if (!ok) process.stderr.write("  rmPE1 " + JSON.stringify({ hits, red, back, detail }) + NL);
    return ok;
  });

  if (process.argv.indexOf("--keep") < 0) dropScratch(SCRATCH, "team-remove");
  process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + "\n");
  if (asserted + skipped !== EXPECTED) {
    process.stderr.write("SUITE DID NOT COMPLETE: " + (asserted + skipped) + " of " + EXPECTED + " checks ran\n");
    return 78;
  }
  process.stdout.write("team-remove  " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)\n");
  return failed ? 1 : 0;
}

main().then(c => process.exit(c), e => {
  process.stderr.write(String(e && e.stack || e) + "\n"); process.exit(2);
});
