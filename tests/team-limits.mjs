/* THE THIRTY TEAMMATES LIMIT AND THE THREE TEAMS LIMIT (board 962 stage 2).
 *
 *     node tests/team-limits.mjs [--keep]
 *
 * gate-kind: node
 *
 * Claims:
 *   1  at 29, 30 and past 30 by invitation: 29 can invite, 30 and past 30 refused
 *   2  at 29, 30 and past 30 by admitDesks: 29 can admit new, 30 and past 30 refused
 *   3  at 29, 30 and past 30 by watchAdmit: 29 can admit new, 30 and past 30 not admitted
 *   4  a roster member is always let in, even at 30 or past 30 (admitDesks and watchAdmit)
 *   5  an expired invitation frees its place so that an invitation and admission succeed
 *   6  a desk in two teams of this Studio is counted once towards the 30
 *   7  a teammate of kind studio is counted as one towards the 30
 *   8  making a fourth team is refused with Claudette's sentence
 *   9  a Studio already past three teams keeps them all and cannot add one
 *  10  a teams file that cannot be read refuses a new invitation and says so
 *  11  a forged share roster neither fills the count nor lets it overshoot
 *  12  a skip at the limit is said once and not again
 *  13  a signed team file below the floor is not counted: 30 at rev 3 stays 30 when rev 1
 *      with 29 is put back, a 31st is refused, and a genuine newer rev is counted as it is
 *  14  a signing key kept away from teams.json still makes the count read that key's floor
 */
import "./reg-stand-on.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as Engine from "../src/engine.mjs";
import { makeKeyFile } from "../src/sign.mjs";
import { makeInvite } from "../src/invite.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { copyPlants } from "./plant-copy.mjs";
import * as Studio from "../src/studio.mjs";
import * as TeamStore from "../src/team-store.mjs";
import { newTeam as plainNewTeam, writeTeam, withRecovery, recoveryOf, withDesk, withoutDesk, revFloor, revsFile, withChannel } from "../src/team.mjs";
/* Every fixture team is on the relay: Studio no longer admits at a team kept for a shared folder (the folder team's removal), so the watch's limits
   are those of a relay team (was: a team with no channel, which is the folder's). */
const newTeam = (o) => withChannel(plainNewTeam(o), { kind: "relay", rt: "5a".repeat(16), url: "https://etiuda.dev" }, { format: 1, kind: "etiuda-ring", keys: [] });
import { seatEnv } from "./seated.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SELF = path.join(ROOT, "tests", "team-limits.mjs");
const SCRATCH = path.join(ROOT, "scratch", "team-limits");
const PASS = "test-passphrase-limits";

const ONLY = process.env.TEAM_LIMITS_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

async function leg(line, fn) {
  try { check(!!(await fn()), line); }
  catch (e) { check(false, line + " (threw: " + String(e && e.message || e).split("\n")[0].slice(0, 160) + ")"); }
}

const rawPublic = (k) => crypto.createPublicKey(k).export({ type: "spki", format: "der" }).subarray(-32);
const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex");

function newDesk(name, kind) {
  const sign = crypto.generateKeyPairSync("ed25519"), box = crypto.generateKeyPairSync("x25519");
  const key = rawPublic(sign.privateKey).toString("hex");
  const id = Engine.joinRules().branchIdOf(key);
  const block = { id, key, box: rawPublic(box.privateKey).toString("hex"), name: name || id, kind: kind || "desk" };
  return { id, name: block.name, block, pub: key, pair: sign, boxKey: box.privateKey, signKey: sign.privateKey };
}

const VAULT = {
  available: () => true,
  seal: (t) => Buffer.from("sealed:" + Buffer.from(String(t), "utf8").reverse().toString("hex"), "utf8"),
  open: (b) => {
    const t = Buffer.from(b).toString("utf8");
    if (!t.startsWith("sealed:")) throw new Error("not sealed here");
    return Buffer.from(t.slice(7), "hex").reverse().toString("utf8");
  }
};

async function writeLeadKey(filePath) {
  const leadKey = await makeKeyFile({ passphrase: PASS });
  fs.writeFileSync(filePath, JSON.stringify(leadKey, null, 1) + "\n");
  return leadKey;
}

function writeProjectJson(dir, title, draftId, folder) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "project.json"), JSON.stringify({
    format: 1,
    kind: "etiuda-project",
    title: title || "Project",
    draft: "draft.json",
    folder: folder || null,
  }, null, 1) + "\n");
  fs.writeFileSync(path.join(dir, "draft.json"), JSON.stringify({
    format: 1,
    kind: "etiuda-catalog",
    id: draftId || "cat-1",
    rev: 1,
    cards: [],
  }, null, 1) + "\n");
}

function askJoin(share, teamId, inv, deskObj) {
  const Jr = Engine.joinRules();
  const d = deskObj || newDesk();
  const pub = d.pub, id = d.id, box = d.block.box;
  const nonce = crypto.randomBytes(32).toString("hex");
  const commit = Jr.joinCommit(teamId, pub, box, nonce);
  const doc = {
    format: 1,
    kind: Jr.JOIN_KIND,
    team: teamId,
    desk: { id, key: pub, box, name: d.name, kind: d.block.kind },
    date: new Date().toISOString(),
    commit,
  };
  if (inv) doc.invite = { id: inv.id, proof: Engine.inviteRules().memberProof(inv.secret, commit) };
  doc.sig = { alg: "Ed25519", keyId: id };
  doc.sig.value = crypto.sign(null, Jr.joinSignedBytes(doc), d.pair.privateKey).toString("hex");
  fs.mkdirSync(path.join(share, "desks", id), { recursive: true });
  fs.writeFileSync(path.join(share, "desks", id, "join.json"), JSON.stringify(doc, null, 1));
  return { id, desk: d, doc, nonce };
}

const LEGS = {};

// tl1: at 29, 30 and past 30 by invitation
LEGS["tl-inv-29"] = async () => {
  const dir = path.join(SCRATCH, "inv29");
  const ud = path.join(dir, "ud"), share = path.join(dir, "share"), proj = path.join(dir, "proj");
  fs.mkdirSync(ud, { recursive: true }); fs.mkdirSync(share, { recursive: true });
  const keyFile = path.join(dir, "lead.key");
  const leadKey = await writeLeadKey(keyFile);
  const teamId = "t-" + crypto.randomBytes(8).toString("hex");
  const teamKey = crypto.randomBytes(32);
  const tf = TeamStore.teamsFile(ud);

  // 29 roster desks
  const roster = [];
  for (let i = 0; i < 29; i++) {
    const d = newDesk("desk-" + i);
    roster.push({ desk: d.block, name: d.name });
  }
  let team = newTeam({ id: teamId, catalogs: ["cat-1"], lead: { keyId: leadKey.keyId, public: leadKey.public }, sealed: true });
  team.roster = roster;
  await writeTeam(share, withRecovery(team, teamKey, recoveryOf(keyFile, PASS)), { key: keyFile, passphrase: PASS });

  TeamStore.keepTeamKey(tf, VAULT, teamId, 1, teamKey);
  TeamStore.chooseSealed(tf, teamId, true, share, team);
  writeProjectJson(proj, "Proj", "cat-1", share);

  // At 29, inviteTarget should succeed
  const target = await Studio.inviteTarget(proj, keyFile, { userData: ud, teamsFile: tf });
  const inv = makeInvite(target, "Alice", crypto.randomBytes(16).toString("hex"), Date.now(), undefined,
    { rt: "00".repeat(16), url: "https://relay.test/relay/v1", token: "11".repeat(32), inv: "22".repeat(16) });
  return !!inv && !!inv.id;
};

LEGS["tl-inv-30"] = async () => {
  const dir = path.join(SCRATCH, "inv30");
  const ud = path.join(dir, "ud"), share = path.join(dir, "share"), proj = path.join(dir, "proj");
  fs.mkdirSync(ud, { recursive: true }); fs.mkdirSync(share, { recursive: true });
  const keyFile = path.join(dir, "lead.key");
  const leadKey = await writeLeadKey(keyFile);
  const teamId = "t-" + crypto.randomBytes(8).toString("hex");
  const teamKey = crypto.randomBytes(32);
  const tf = TeamStore.teamsFile(ud);

  // 30 roster desks
  const roster = [];
  for (let i = 0; i < 30; i++) {
    const d = newDesk("desk-" + i);
    roster.push({ desk: d.block, name: d.name });
  }
  let team = newTeam({ id: teamId, catalogs: ["cat-1"], lead: { keyId: leadKey.keyId, public: leadKey.public }, sealed: true });
  team.roster = roster;
  await writeTeam(share, withRecovery(team, teamKey, recoveryOf(keyFile, PASS)), { key: keyFile, passphrase: PASS });

  TeamStore.keepTeamKey(tf, VAULT, teamId, 1, teamKey);
  TeamStore.chooseSealed(tf, teamId, true, share, team);
  writeProjectJson(proj, "Proj", "cat-1", share);

  // At 30, inviteTarget must refuse
  let err = null;
  try {
    await Studio.inviteTarget(proj, keyFile, { userData: ud, teamsFile: tf });
  } catch (e) {
    err = e;
  }
  return err && err.message === "This Studio already has 30 teammates, open invitations included, so a new one can join only once a place frees.";
};

LEGS["tl-inv-past30"] = async () => {
  const dir = path.join(SCRATCH, "invPast30");
  const ud = path.join(dir, "ud"), share = path.join(dir, "share"), proj = path.join(dir, "proj");
  fs.mkdirSync(ud, { recursive: true }); fs.mkdirSync(share, { recursive: true });
  const keyFile = path.join(dir, "lead.key");
  const leadKey = await writeLeadKey(keyFile);
  const teamId = "t-" + crypto.randomBytes(8).toString("hex");
  const teamKey = crypto.randomBytes(32);
  const tf = TeamStore.teamsFile(ud);

  // 31 roster desks
  const roster = [];
  for (let i = 0; i < 31; i++) {
    const d = newDesk("desk-" + i);
    roster.push({ desk: d.block, name: d.name });
  }
  let team = newTeam({ id: teamId, catalogs: ["cat-1"], lead: { keyId: leadKey.keyId, public: leadKey.public }, sealed: true });
  team.roster = roster;
  await writeTeam(share, withRecovery(team, teamKey, recoveryOf(keyFile, PASS)), { key: keyFile, passphrase: PASS });

  TeamStore.keepTeamKey(tf, VAULT, teamId, 1, teamKey);
  TeamStore.chooseSealed(tf, teamId, true, share, team);
  writeProjectJson(proj, "Proj", "cat-1", share);

  let err = null;
  try {
    await Studio.inviteTarget(proj, keyFile, { userData: ud, teamsFile: tf });
  } catch (e) {
    err = e;
  }
  return err && err.message === "This Studio already has 30 teammates, open invitations included, so a new one can join only once a place frees.";
};

// RETIRED, P2 (an admission is no longer made by a code typed in a row, so admitDesks is gone): tl2, tl-admit-desks-29, -30 and -past30, "at 29, 30 and past 30 by admitDesks: 29 can admit new, 30 and past 30 refused". The limit is held at the invitation (tl1) and at the watch's admission (tl3).

// tl3: at 29, 30 and past 30 by watchAdmit
LEGS["tl-watch-admit-29"] = async () => {
  const dir = path.join(SCRATCH, "watch29");
  const ud = path.join(dir, "ud"), share = path.join(dir, "share");
  fs.mkdirSync(ud, { recursive: true }); fs.mkdirSync(share, { recursive: true });
  const keyFile = path.join(dir, "lead.key");
  const leadKey = await writeLeadKey(keyFile);
  const teamId = "t-" + crypto.randomBytes(8).toString("hex");
  const teamKey = crypto.randomBytes(32);
  const tf = TeamStore.teamsFile(ud);

  const roster = [];
  for (let i = 0; i < 29; i++) {
    const d = newDesk("desk-" + i);
    roster.push({ desk: d.block, name: d.name });
  }
  let team = newTeam({ id: teamId, catalogs: ["cat-1"], lead: { keyId: leadKey.keyId, public: leadKey.public }, sealed: true });
  team.roster = roster;
  await writeTeam(share, withRecovery(team, teamKey, recoveryOf(keyFile, PASS)), { key: keyFile, passphrase: PASS });

  TeamStore.keepTeamKey(tf, VAULT, teamId, 1, teamKey);
  TeamStore.chooseSealed(tf, teamId, true, share, team);

  const invSecret = crypto.randomBytes(16).toString("hex");
  const invId = Engine.inviteRules().inviteIdOf(invSecret);
  TeamStore.keepInvite(tf, VAULT, teamId, {
    id: invId, secret: invSecret, made: new Date().toISOString(),
    expires: new Date(Date.now() + 86400000).toISOString(), name: "Lead",
  });

  const candidate = newDesk("candidate-w29");
  const asked = askJoin(share, teamId, { id: invId, secret: invSecret }, candidate);

  const r = await Studio.watchAdmit(share, keyFile, PASS, {
    userData: ud, teamsFile: tf, teamKeys: { [teamId]: { 1: teamKey } }, invites: TeamStore.inviteBookOf(tf, VAULT), now: Date.now()
  });
  return r && r.admitted && r.admitted.includes(asked.id);
};

LEGS["tl-watch-admit-30"] = async () => {
  const dir = path.join(SCRATCH, "watch30");
  const ud = path.join(dir, "ud"), share = path.join(dir, "share");
  fs.mkdirSync(ud, { recursive: true }); fs.mkdirSync(share, { recursive: true });
  const keyFile = path.join(dir, "lead.key");
  const leadKey = await writeLeadKey(keyFile);
  const teamId = "t-" + crypto.randomBytes(8).toString("hex");
  const teamKey = crypto.randomBytes(32);
  const tf = TeamStore.teamsFile(ud);

  const roster = [];
  for (let i = 0; i < 30; i++) {
    const d = newDesk("desk-" + i);
    roster.push({ desk: d.block, name: d.name });
  }
  let team = newTeam({ id: teamId, catalogs: ["cat-1"], lead: { keyId: leadKey.keyId, public: leadKey.public }, sealed: true });
  team.roster = roster;
  await writeTeam(share, withRecovery(team, teamKey, recoveryOf(keyFile, PASS)), { key: keyFile, passphrase: PASS });

  TeamStore.keepTeamKey(tf, VAULT, teamId, 1, teamKey);
  TeamStore.chooseSealed(tf, teamId, true, share, team);

  const invSecret = crypto.randomBytes(16).toString("hex");
  const invId = Engine.inviteRules().inviteIdOf(invSecret);
  TeamStore.keepInvite(tf, VAULT, teamId, {
    id: invId, secret: invSecret, made: new Date().toISOString(),
    expires: new Date(Date.now() + 86400000).toISOString(), name: "Lead",
  });

  const candidate = newDesk("candidate-w30");
  const asked = askJoin(share, teamId, { id: invId, secret: invSecret }, candidate);

  const r = await Studio.watchAdmit(share, keyFile, PASS, {
    userData: ud, teamsFile: tf, teamKeys: { [teamId]: { 1: teamKey } }, invites: TeamStore.inviteBookOf(tf, VAULT), now: Date.now()
  });
  // Must NOT be admitted
  const admitted = r && r.admitted && r.admitted.includes(asked.id);
  const skipped = r && r.skipped && r.skipped.some(s => s.id === asked.id);
  return !admitted && skipped;
};

LEGS["tl-watch-admit-past30"] = async () => {
  const dir = path.join(SCRATCH, "watchPast30");
  const ud = path.join(dir, "ud"), share = path.join(dir, "share");
  fs.mkdirSync(ud, { recursive: true }); fs.mkdirSync(share, { recursive: true });
  const keyFile = path.join(dir, "lead.key");
  const leadKey = await writeLeadKey(keyFile);
  const teamId = "t-" + crypto.randomBytes(8).toString("hex");
  const teamKey = crypto.randomBytes(32);
  const tf = TeamStore.teamsFile(ud);

  const roster = [];
  for (let i = 0; i < 32; i++) {
    const d = newDesk("desk-" + i);
    roster.push({ desk: d.block, name: d.name });
  }
  let team = newTeam({ id: teamId, catalogs: ["cat-1"], lead: { keyId: leadKey.keyId, public: leadKey.public }, sealed: true });
  team.roster = roster;
  await writeTeam(share, withRecovery(team, teamKey, recoveryOf(keyFile, PASS)), { key: keyFile, passphrase: PASS });

  TeamStore.keepTeamKey(tf, VAULT, teamId, 1, teamKey);
  TeamStore.chooseSealed(tf, teamId, true, share, team);

  const candidate = newDesk("candidate-wpast30");
  const asked = askJoin(share, teamId, null, candidate);

  const r = await Studio.watchAdmit(share, keyFile, PASS, {
    userData: ud, teamsFile: tf, teamKeys: { [teamId]: { 1: teamKey } }, auto: true, now: Date.now()
  });
  return r && (!r.admitted || !r.admitted.includes(asked.id));
};

// tl4: a roster member is always let in (tested at 30 and past 30 on watchAdmit)
LEGS["tl-roster-always-let-in"] = async () => {
  const dir = path.join(SCRATCH, "rosterAlways");
  const ud = path.join(dir, "ud"), share = path.join(dir, "share"), proj = path.join(dir, "proj");
  fs.mkdirSync(ud, { recursive: true }); fs.mkdirSync(share, { recursive: true });
  const keyFile = path.join(dir, "lead.key");
  const leadKey = await writeLeadKey(keyFile);
  const teamId = "t-" + crypto.randomBytes(8).toString("hex");
  const teamKey = crypto.randomBytes(32);
  const tf = TeamStore.teamsFile(ud);

  // 30 desks
  const rosterDesks = [];
  const roster = [];
  for (let i = 0; i < 30; i++) {
    const d = newDesk("desk-" + i);
    rosterDesks.push(d);
    roster.push({ desk: d.block, name: d.name });
  }
  let team = newTeam({ id: teamId, catalogs: ["cat-1"], lead: { keyId: leadKey.keyId, public: leadKey.public }, sealed: true });
  team.roster = roster;
  await writeTeam(share, withRecovery(team, teamKey, recoveryOf(keyFile, PASS)), { key: keyFile, passphrase: PASS });

  TeamStore.keepTeamKey(tf, VAULT, teamId, 1, teamKey);
  TeamStore.chooseSealed(tf, teamId, true, share, team);
  writeProjectJson(proj, "Proj", "cat-1", share);

  // Existing desk 0 rejoins via watchAdmit with a live invitation
  const invSecret = crypto.randomBytes(16).toString("hex");
  const invId = Engine.inviteRules().inviteIdOf(invSecret);
  TeamStore.keepInvite(tf, VAULT, teamId, {
    id: invId, secret: invSecret, made: new Date().toISOString(),
    expires: new Date(Date.now() + 86400000).toISOString(), name: "Lead",
  });
  const existingDesk = rosterDesks[0];
  const askedWatch = askJoin(share, teamId, { id: invId, secret: invSecret }, existingDesk);
  const rWatch = await Studio.watchAdmit(share, keyFile, PASS, {
    userData: ud, teamsFile: tf, teamKeys: { [teamId]: { 1: teamKey } }, invites: TeamStore.inviteBookOf(tf, VAULT), now: Date.now()
  });
  const watchOk = rWatch && rWatch.admitted && rWatch.admitted.includes(existingDesk.id);

  // RETIRED, P2: "existing desk 1 rejoins via admitDesks" (no code door); the roster member let in by the watch is the leg's whole.

  return watchOk;
};

// tl5: an expired invitation frees its place
LEGS["tl-expired-invite-frees-place"] = async () => {
  const dir = path.join(SCRATCH, "expiredInvite");
  const ud = path.join(dir, "ud"), share = path.join(dir, "share"), proj = path.join(dir, "proj");
  fs.mkdirSync(ud, { recursive: true }); fs.mkdirSync(share, { recursive: true });
  const keyFile = path.join(dir, "lead.key");
  const leadKey = await writeLeadKey(keyFile);
  const teamId = "t-" + crypto.randomBytes(8).toString("hex");
  const teamKey = crypto.randomBytes(32);
  const tf = TeamStore.teamsFile(ud);

  // 29 roster desks
  const roster = [];
  for (let i = 0; i < 29; i++) {
    const d = newDesk("desk-" + i);
    roster.push({ desk: d.block, name: d.name });
  }
  let team = newTeam({ id: teamId, catalogs: ["cat-1"], lead: { keyId: leadKey.keyId, public: leadKey.public }, sealed: true });
  team.roster = roster;
  await writeTeam(share, withRecovery(team, teamKey, recoveryOf(keyFile, PASS)), { key: keyFile, passphrase: PASS });

  TeamStore.keepTeamKey(tf, VAULT, teamId, 1, teamKey);
  TeamStore.chooseSealed(tf, teamId, true, share, team);
  writeProjectJson(proj, "Proj", "cat-1", share);

  // Add an expired invitation (expires in the past)
  const expiredId = crypto.randomBytes(8).toString("hex");
  const past = new Date(Date.now() - 3600000).toISOString();
  TeamStore.keepInvite(tf, VAULT, teamId, {
    id: expiredId,
    secret: crypto.randomBytes(16).toString("hex"),
    made: new Date(Date.now() - 7200000).toISOString(),
    expires: past,
    name: "Old Expired",
    state: "live"
  });

  // Because it expired, teammate count is 29 (not 30).
  // A new invitation must be allowed:
  const target = await Studio.inviteTarget(proj, keyFile, { userData: ud, teamsFile: tf, now: Date.now() });
  return !!target;
};

// tl6: a desk in two teams counted once
LEGS["tl-desk-two-teams-counted-once"] = async () => {
  const dir = path.join(SCRATCH, "twoTeamsOneDesk");
  const ud = path.join(dir, "ud");
  const share1 = path.join(dir, "share1"), share2 = path.join(dir, "share2");
  const proj1 = path.join(dir, "proj1");
  fs.mkdirSync(ud, { recursive: true }); fs.mkdirSync(share1, { recursive: true }); fs.mkdirSync(share2, { recursive: true });
  const keyFile = path.join(dir, "lead.key");
  const leadKey = await writeLeadKey(keyFile);
  const tf = TeamStore.teamsFile(ud);

  const sharedDesk = newDesk("shared-desk");
  const roster1 = [{ desk: sharedDesk.block, name: sharedDesk.name }];
  const roster2 = [{ desk: sharedDesk.block, name: sharedDesk.name }];

  // 14 unique in team 1 -> total 15
  for (let i = 0; i < 14; i++) {
    const d = newDesk("t1-desk-" + i);
    roster1.push({ desk: d.block, name: d.name });
  }
  // 14 unique in team 2 -> total 15
  for (let i = 0; i < 14; i++) {
    const d = newDesk("t2-desk-" + i);
    roster2.push({ desk: d.block, name: d.name });
  }

  const team1Id = "t-" + crypto.randomBytes(8).toString("hex");
  const team2Id = "t-" + crypto.randomBytes(8).toString("hex");
  const key1 = crypto.randomBytes(32), key2 = crypto.randomBytes(32);

  let t1 = newTeam({ id: team1Id, catalogs: ["cat-1"], lead: { keyId: leadKey.keyId, public: leadKey.public }, sealed: true });
  t1.roster = roster1;
  await writeTeam(share1, withRecovery(t1, key1, recoveryOf(keyFile, PASS)), { key: keyFile, passphrase: PASS });

  let t2 = newTeam({ id: team2Id, catalogs: ["cat-2"], lead: { keyId: leadKey.keyId, public: leadKey.public }, sealed: true });
  t2.roster = roster2;
  await writeTeam(share2, withRecovery(t2, key2, recoveryOf(keyFile, PASS)), { key: keyFile, passphrase: PASS });

  TeamStore.keepTeamKey(tf, VAULT, team1Id, 1, key1);
  TeamStore.chooseSealed(tf, team1Id, true, share1, t1);
  TeamStore.keepTeamKey(tf, VAULT, team2Id, 1, key2);
  TeamStore.chooseSealed(tf, team2Id, true, share2, t2);
  writeProjectJson(proj1, "P1", "cat-1", share1);

  // Distinct desks across team 1 and team 2 is 1 + 14 + 14 = 29 (not 30!)
  // So inviting on team 1 should succeed
  const target = await Studio.inviteTarget(proj1, keyFile, { userData: ud, teamsFile: tf });
  return !!target;
};

// tl7: a kind studio counted once
LEGS["tl-kind-studio-counted-once"] = async () => {
  const dir = path.join(SCRATCH, "kindStudio");
  const ud = path.join(dir, "ud"), share = path.join(dir, "share"), proj = path.join(dir, "proj");
  fs.mkdirSync(ud, { recursive: true }); fs.mkdirSync(share, { recursive: true });
  const keyFile = path.join(dir, "lead.key");
  const leadKey = await writeLeadKey(keyFile);
  const teamId = "t-" + crypto.randomBytes(8).toString("hex");
  const teamKey = crypto.randomBytes(32);
  const tf = TeamStore.teamsFile(ud);

  const roster = [];
  // 1 teammate of kind studio
  const studioTeammate = newDesk("office-studio", "studio");
  roster.push({ desk: studioTeammate.block, name: studioTeammate.name });

  // 29 other desks => total 30
  for (let i = 0; i < 29; i++) {
    const d = newDesk("desk-" + i);
    roster.push({ desk: d.block, name: d.name });
  }
  let team = newTeam({ id: teamId, catalogs: ["cat-1"], lead: { keyId: leadKey.keyId, public: leadKey.public }, sealed: true });
  team.roster = roster;
  await writeTeam(share, withRecovery(team, teamKey, recoveryOf(keyFile, PASS)), { key: keyFile, passphrase: PASS });

  TeamStore.keepTeamKey(tf, VAULT, teamId, 1, teamKey);
  TeamStore.chooseSealed(tf, teamId, true, share, team);
  writeProjectJson(proj, "Proj", "cat-1", share);

  // Exactly 30 teammates (1 studio + 29 desks) -> inviteTarget must refuse
  let err = null;
  try {
    await Studio.inviteTarget(proj, keyFile, { userData: ud, teamsFile: tf });
  } catch (e) {
    err = e;
  }
  return err && err.message === "This Studio already has 30 teammates, open invitations included, so a new one can join only once a place frees.";
};

// tl8: the fourth team refused
LEGS["tl-fourth-team-refused"] = async () => {
  const dir = path.join(SCRATCH, "fourthTeam");
  const ud = path.join(dir, "ud");
  fs.mkdirSync(ud, { recursive: true });
  const tf = TeamStore.teamsFile(ud);
  const keyFile = path.join(dir, "lead.key");
  const leadKey = await writeLeadKey(keyFile);

  // Set up 3 existing teams in teams.json
  for (let i = 1; i <= 3; i++) {
    const tid = "t-" + String(i).padStart(16, "0");
    const s = path.join(dir, "share" + i);
    fs.mkdirSync(s, { recursive: true });
    const k = crypto.randomBytes(32);
    const tm = newTeam({ id: tid, catalogs: ["cat-" + i], lead: { keyId: leadKey.keyId, public: leadKey.public }, sealed: true });
    await writeTeam(s, withRecovery(tm, k, recoveryOf(keyFile, PASS)), { key: keyFile, passphrase: PASS });
    TeamStore.keepTeamKey(tf, VAULT, tid, 1, k);
    TeamStore.chooseSealed(tf, tid, true, s, tm);
  }

  // Attempting to make a 4th team via setTeamSealed
  const proj4 = path.join(dir, "proj4"), share4 = path.join(dir, "share4");
  fs.mkdirSync(share4, { recursive: true });
  writeProjectJson(proj4, "P4", "cat-4", share4);

  let err = null;
  try {
    await Studio.setTeamSealed(proj4, true, {
      userData: ud,
      teamsFile: tf,
      key: keyFile,
      passphrase: PASS,
      teamId: "t-" + "4".padStart(16, "0"),
    });
  } catch (e) {
    err = e;
  }
  return err && err.message === "This Studio already leads three teams, the most it can, so a new one cannot be made.";
};

// tl9: a Studio already past three keeping them all
LEGS["tl-past-three-kept"] = async () => {
  const dir = path.join(SCRATCH, "pastThree");
  const ud = path.join(dir, "ud");
  fs.mkdirSync(ud, { recursive: true });
  const tf = TeamStore.teamsFile(ud);
  const keyFile = path.join(dir, "lead.key");
  const leadKey = await writeLeadKey(keyFile);

  // Set up 4 existing teams in teams.json
  for (let i = 1; i <= 4; i++) {
    const tid = "t-" + String(i).padStart(16, "0");
    const s = path.join(dir, "share" + i);
    fs.mkdirSync(s, { recursive: true });
    const k = crypto.randomBytes(32);
    const tm = newTeam({ id: tid, catalogs: ["cat-" + i], lead: { keyId: leadKey.keyId, public: leadKey.public }, sealed: true });
    await writeTeam(s, withRecovery(tm, k, recoveryOf(keyFile, PASS)), { key: keyFile, passphrase: PASS });
    TeamStore.keepTeamKey(tf, VAULT, tid, 1, k);
    TeamStore.chooseSealed(tf, tid, true, s, tm);
  }

  // All 4 teams remain in teams.json
  const raw = JSON.parse(fs.readFileSync(tf, "utf8"));
  const count4 = Object.keys(raw.teams).length === 4;

  // Making a 5th team is refused
  const proj5 = path.join(dir, "proj5"), share5 = path.join(dir, "share5");
  fs.mkdirSync(share5, { recursive: true });
  writeProjectJson(proj5, "P5", "cat-5", share5);

  let err = null;
  try {
    await Studio.setTeamSealed(proj5, true, {
      userData: ud,
      teamsFile: tf,
      key: keyFile,
      passphrase: PASS,
      teamId: "t-" + "5".padStart(16, "0"),
    });
  } catch (e) {
    err = e;
  }
  const refused5 = err && err.message === "This Studio already leads three teams, the most it can, so a new one cannot be made.";

  // Still 4 teams kept
  const rawAfter = JSON.parse(fs.readFileSync(tf, "utf8"));
  const countStill4 = Object.keys(rawAfter.teams).length === 4;

  return count4 && refused5 && countStill4;
};

// tl10: a teams file that cannot be read refuses a new invitation and says so
LEGS["tl-unreadable-teams"] = async () => {
  const dir = path.join(SCRATCH, "unreadableTeams");
  const ud = path.join(dir, "ud"), share = path.join(dir, "share"), proj = path.join(dir, "proj");
  fs.mkdirSync(ud, { recursive: true }); fs.mkdirSync(share, { recursive: true });
  const keyFile = path.join(dir, "lead.key");
  await writeLeadKey(keyFile);
  writeProjectJson(proj, "Proj", "cat-1", share);

  const tf = TeamStore.teamsFile(ud);
  fs.writeFileSync(tf, "{ this is corrupted json! not a teams file", "utf8");

  let err = null;
  try {
    await Studio.inviteTarget(proj, keyFile, { userData: ud, teamsFile: tf });
  } catch (e) {
    err = e;
  }
  return err && err.message === "The teams file cannot be read, so no invitation was made.";
};

// tl11: a forged share roster neither fills the count nor lets it overshoot
LEGS["tl-forged-share-roster"] = async () => {
  const dir = path.join(SCRATCH, "forgedRoster");
  const ud = path.join(dir, "ud"), share = path.join(dir, "share");
  fs.mkdirSync(ud, { recursive: true }); fs.mkdirSync(share, { recursive: true });
  const keyFile = path.join(dir, "lead.key");
  const leadKey = await writeLeadKey(keyFile);
  const tf = TeamStore.teamsFile(ud);
  const teamId = "t-" + crypto.randomBytes(8).toString("hex");
  const teamKey = crypto.randomBytes(32);

  // Set up team with 2 genuine teammates in teams.json
  const roster2 = [
    { desk: newDesk("desk-1").block, name: "Desk 1" },
    { desk: newDesk("desk-2").block, name: "Desk 2" },
  ];
  let team = newTeam({ id: teamId, catalogs: ["cat-1"], lead: { keyId: leadKey.keyId, public: leadKey.public }, sealed: true });
  team.roster = roster2;
  await writeTeam(share, withRecovery(team, teamKey, recoveryOf(keyFile, PASS)), { key: keyFile, passphrase: PASS });
  TeamStore.keepTeamKey(tf, VAULT, teamId, 1, teamKey);
  TeamStore.chooseSealed(tf, teamId, true, share, team);

  // An attacker puts a forged etiuda-team.json in the share folder with 30 fake teammates
  const fakeRoster30 = [];
  for (let i = 0; i < 30; i++) {
    const d = newDesk("fake-" + i);
    fakeRoster30.push({ desk: d.block, name: d.name });
  }
  const forged30 = Object.assign({}, team, { roster: fakeRoster30 });
  delete forged30.sig;
  fs.writeFileSync(path.join(share, "etiuda-team.json"), JSON.stringify(forged30, null, 1) + "\n");

  const tm1 = TeamStore.studioTeammates(tf);
  const notFilled = tm1.count === 2; // Must NOT be filled by forged 30

  // Now test overshooting: genuine team in teams.json has 30 teammates
  const roster30 = [];
  for (let i = 0; i < 30; i++) {
    const d = newDesk("genuine-" + i);
    roster30.push({ desk: d.block, name: d.name });
  }
  const team30 = newTeam({ id: teamId, catalogs: ["cat-1"], lead: { keyId: leadKey.keyId, public: leadKey.public }, sealed: true });
  team30.roster = roster30;
  TeamStore.chooseSealed(tf, teamId, true, share, team30);

  // Attacker puts forged etiuda-team.json in share folder with 0 teammates
  const forged0 = Object.assign({}, team30, { roster: [] });
  delete forged0.sig;
  fs.writeFileSync(path.join(share, "etiuda-team.json"), JSON.stringify(forged0, null, 1) + "\n");

  const tm2 = TeamStore.studioTeammates(tf);
  const notOvershot = tm2.count === 30; // Must NOT drop to 0

  return notFilled && notOvershot;
};

const nodeRequire = createRequire(import.meta.url);

async function loadTestShell(ud) {
  const Module = nodeRequire("module");
  const handlers = {};
  const windows = [];
  class Win {
    constructor() { this.webContents = { on() {}, once() {}, send() {}, setWindowOpenHandler() {} }; }
    on() {} once() {} show() {} showInactive() {} setMinimumSize() {} loadFile() {} isDestroyed() { return false; }
  }
  const electron = {
    app: {
      getPath: () => ud,
      getLocale: () => "en-GB",
      requestSingleInstanceLock: () => true,
      getVersion: () => "0.0.0",
      commandLine: { appendSwitch() {}, hasSwitch: () => false, removeSwitch() {} },
      on() {},
      whenReady: () => Promise.resolve(),
      quit() {}
    },
    BrowserWindow: Object.assign(Win, { getAllWindows: () => windows, fromWebContents: () => windows[0] }),
    Menu: { setApplicationMenu() {}, buildFromTemplate: () => ({ popup() {} }) },
    dialog: { showMessageBox: () => Promise.resolve({ response: 0 }) },
    nativeTheme: { themeSource: "system" },
    clipboard: { writeText() {} },
    safeStorage: {
      isEncryptionAvailable: () => true,
      encryptString: (s) => Buffer.from(s),
      decryptString: (b) => Buffer.from(b).toString("utf8")
    },
    screen: { getAllDisplays: () => [], getPrimaryDisplay: () => ({}), on() {}, removeListener() {} },
    session: {
      defaultSession: {
        setPermissionRequestHandler() {}, setPermissionCheckHandler() {}, setDevicePermissionHandler() {},
        setSpellCheckerLanguages() {}, setSpellCheckerDictionaryDownloadURL() {}, setSpellCheckerEnabled() {}
      }
    },
    shell: { openPath: () => Promise.resolve(""), trashItem: () => Promise.resolve() },
    ipcMain: { handle: (ch, fn) => { handlers[ch] = fn; }, on() {} },
  };
  const thread = {
    call: async (verb, ...a) => {
      if (typeof Studio[verb] === "function") return Studio[verb](...a);
      return {};
    }
  };
  /* A Studio that works, as a lead's does (the gate keeps the watch from one that does not). */
  for (const [k, v] of Object.entries(await seatEnv(ud, true, {}))) { if (v === null) delete process.env[k]; else process.env[k] = v; }
  const mainPath = path.resolve(ROOT, "shell", "main.js");
  const origLoad = Module._load;
  const before = new Set(Object.keys(nodeRequire.cache));
  Module._load = function (req) {
    if (req === "electron") return electron;
    if (/studio-thread\.cjs$/.test(req)) return thread;
    return origLoad.apply(this, arguments);
  };
  try {
    delete nodeRequire.cache[mainPath];
    const mod = nodeRequire(mainPath);
    return {
      mod,
      handlers,
      ask: async (ch, ...a) => {
        const ui = path.resolve(ROOT, "ui", "index.html");
        const ev = { senderFrame: { parent: null, url: pathToFileURL(ui).href } };
        return handlers[ch] ? handlers[ch](ev, ...a) : null;
      },
      done: () => {
        Module._load = origLoad;
        delete nodeRequire.cache[mainPath];
        for (const k of Object.keys(nodeRequire.cache)) if (!before.has(k)) delete nodeRequire.cache[k];
      }
    };
  } catch (e) {
    Module._load = origLoad;
    throw e;
  }
}

// tl12: a skip at the limit is said once and not again
LEGS["tl-skip-limit-said-once"] = async () => {
  const dir = path.join(SCRATCH, "skipLimitSaidOnce");
  const ud = path.join(dir, "ud"), share = path.join(dir, "share"), proj = path.join(ud, "Etiuda Studio", "proj");
  fs.mkdirSync(ud, { recursive: true }); fs.mkdirSync(share, { recursive: true });
  const keyFile = path.join(ud, "signing-key.json");
  const leadKey = await writeLeadKey(keyFile);
  const teamId = "t-" + crypto.randomBytes(8).toString("hex");
  const teamKey = crypto.randomBytes(32);
  const tf = TeamStore.teamsFile(ud);

  const roster = [];
  for (let i = 0; i < 30; i++) {
    const d = newDesk("desk-" + i);
    roster.push({ desk: d.block, name: d.name });
  }
  let team = newTeam({ id: teamId, catalogs: ["cat-1"], lead: { keyId: leadKey.keyId, public: leadKey.public }, sealed: true });
  team.roster = roster;
  await writeTeam(share, withRecovery(team, teamKey, recoveryOf(keyFile, PASS)), { key: keyFile, passphrase: PASS });

  const SHELL_VAULT = {
    available: () => true,
    seal: (s) => Buffer.from(String(s)),
    open: (b) => Buffer.from(b).toString("utf8"),
  };
  TeamStore.keepTeamKey(tf, SHELL_VAULT, teamId, 1, teamKey);
  TeamStore.chooseSealed(tf, teamId, true, share, team);
  /* The team is on the relay, its folder standing for the mirror the watch reads (was: a team kept for a shared folder, which the watch
     passes by now; the folder team's removal). */
  { const doc = JSON.parse(fs.readFileSync(tf, "utf8")); doc.teams[teamId].relay = { rt: "5a".repeat(16), url: "https://etiuda.dev" }; fs.writeFileSync(tf, JSON.stringify(doc, null, 1) + "\n"); }
  const invSecret = crypto.randomBytes(16).toString("hex");
  const invId = Engine.inviteRules().inviteIdOf(invSecret);
  TeamStore.keepInvite(tf, SHELL_VAULT, teamId, {
    id: invId, secret: invSecret, made: new Date().toISOString(),
    expires: new Date(Date.now() + 86400000).toISOString(), name: "Lead",
  });
  writeProjectJson(proj, "Proj", "cat-1", share);

  process.env.STUDIO_KEY_PASSPHRASE = PASS;

  // 31st desk asks to join with that invitation
  const candidate = newDesk("candidate-31");
  const asked = askJoin(share, teamId, { id: invId, secret: invSecret }, candidate);

  const sh = await loadTestShell(ud);
  try {
    if (sh.mod && sh.mod.watchOnce) {
      await sh.mod.watchOnce(share);
    }

    const d1 = await sh.ask("studio:desks", proj);
    const d2 = await sh.ask("studio:desks", proj);

    const once = !!(d1 && d1.limitSkipped === "A teammate is waiting to join, but this Studio already has 30, open invitations included. Its request waits until a place frees.")
      && !!(d2 && !d2.limitSkipped);

    const lang = fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8");
    const app = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
    const langHasWords = lang.indexOf('"A teammate is waiting to join, but this Studio already has 30, open invitations included. Its request waits until a place frees.":') >= 0;
    const appHasDataAttr = app.indexOf("data-limit-skipped") >= 0;

    return once && langHasWords && appHasDataAttr;
  } finally {
    sh.done();
  }
};

// 962s5-teammates-floor: a signed file below the floor does not shrink the count.
LEGS["962s5-teammates-floor"] = async () => {
  const dir = path.join(SCRATCH, "revFloor");
  const ud = path.join(dir, "ud"), share = path.join(dir, "share"), proj = path.join(dir, "proj");
  fs.mkdirSync(ud, { recursive: true }); fs.mkdirSync(share, { recursive: true });
  const keyFile = path.join(ud, "signing-key.json");
  const leadKey = await writeLeadKey(keyFile);
  const teamId = "t-" + crypto.randomBytes(8).toString("hex");
  const teamKey = crypto.randomBytes(32);
  const tf = TeamStore.teamsFile(ud);
  const wrap = (t) => withRecovery(t, teamKey, recoveryOf(keyFile, PASS));

  const roster = [];
  for (let i = 0; i < 29; i++) {
    const d = newDesk("desk-" + i);
    roster.push({ desk: d.block, name: d.name });
  }
  let team = newTeam({ id: teamId, catalogs: ["cat-1"], lead: { keyId: leadKey.keyId, public: leadKey.public }, sealed: true });
  team.roster = roster;
  const w1 = await writeTeam(share, wrap(team), { key: keyFile, passphrase: PASS });
  const rev1Bytes = fs.readFileSync(w1.at);
  const w2 = await writeTeam(share, wrap(w1.team), { key: keyFile, passphrase: PASS });
  const extra = newDesk("desk-extra");
  const w3 = await writeTeam(share, wrap(withDesk(w2.team, extra.block, extra.name)), { key: keyFile, passphrase: PASS });

  TeamStore.keepTeamKey(tf, VAULT, teamId, 1, teamKey);
  TeamStore.chooseSealed(tf, teamId, true, share, w3.team);
  writeProjectJson(proj, "Proj", "cat-1", share);

  const floor = revFloor(keyFile, teamId);
  fs.writeFileSync(path.join(share, "etiuda-team.json"), rev1Bytes);
  const rolled = JSON.parse(fs.readFileSync(path.join(share, "etiuda-team.json"), "utf8"));
  const tm = TeamStore.studioTeammates(tf);
  let inviteErr = null;
  try {
    await Studio.inviteTarget(proj, keyFile, { userData: ud, teamsFile: tf });
  } catch (e) {
    inviteErr = e;
  }
  const held30 = !!(w1.team && w1.team.rev === 1 && w3.team && w3.team.rev === 3 && w3.team.roster.length === 30
    && floor && floor.epoch === 1 && floor.rev === 3
    && rolled.rev === 1 && rolled.roster.length === 29
    && tm.ok === true && tm.count === 30 && tm.rosterDesks.has(extra.id));
  const refused = !!(inviteErr && inviteErr.message === TeamStore.REFUSAL_TEAMMATES_LIMIT);

  let slim = w3.team;
  const drop = w3.team.roster.slice(0, 3).map((e) => e.desk.id);
  for (const id of drop) slim = withoutDesk(slim, id);
  const w4 = await writeTeam(share, wrap(slim), { key: keyFile, passphrase: PASS });
  const tmNew = TeamStore.studioTeammates(tf);
  const newer = !!(w4.team && w4.team.rev === 4 && tmNew.ok === true && tmNew.count === 27 && !tmNew.rosterDesks.has(drop[0]));

  process.stdout.write("       rev1 " + (w1.team && w1.team.rev) + " rev3 " + (w3.team && w3.team.rev)
    + " floor " + JSON.stringify(floor) + " rolledRev " + rolled.rev + " rolledRoster " + rolled.roster.length
    + " count " + tm.count + " has30th " + tm.rosterDesks.has(extra.id)
    + " invite " + JSON.stringify(inviteErr && inviteErr.message)
    + " newerRev " + (w4.team && w4.team.rev) + " newerCount " + tmNew.count + "\n");
  return held30 && refused && newer;
};

/* A key kept away from teams.json. The floor file sits beside the key, so a count that guesses
   signing-key.json beside teams.json does not see it and lets the invitation through. */
LEGS["tl-moved-key-floor"] = async () => {
  const dir = path.join(SCRATCH, "movedKey");
  const ud = path.join(dir, "ud"), share = path.join(dir, "share"), proj = path.join(dir, "proj");
  const keyDir = path.join(dir, "moved");
  fs.mkdirSync(ud, { recursive: true });
  fs.mkdirSync(share, { recursive: true });
  fs.mkdirSync(keyDir, { recursive: true });
  const keyFile = path.join(keyDir, "signing-key.json");
  const leadKey = await writeLeadKey(keyFile);
  const teamId = "t-" + crypto.randomBytes(8).toString("hex");
  const teamKey = crypto.randomBytes(32);
  const tf = TeamStore.teamsFile(ud);
  const team = newTeam({ id: teamId, catalogs: ["cat-1"], lead: { keyId: leadKey.keyId, public: leadKey.public }, sealed: true });
  const w = await writeTeam(share, withRecovery(team, teamKey, recoveryOf(keyFile, PASS)), { key: keyFile, passphrase: PASS });
  TeamStore.keepTeamKey(tf, VAULT, teamId, 1, teamKey);
  TeamStore.chooseSealed(tf, teamId, true, share, w.team);
  writeProjectJson(proj, "Proj", "cat-1", share);
  const floorRev = (w.team && Number.isInteger(w.team.rev) ? w.team.rev : 0) + 5;
  fs.writeFileSync(revsFile(keyFile), JSON.stringify({
    format: 1, kind: "etiuda-studio-team-revs",
    teams: { [teamId]: { epoch: w.team.epoch, rev: floorRev } }
  }, null, 1) + "\n");
  const shellText = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  /* MOVED 2026-11-26: three sites passed the key's own path (P2 took the desk-admit one), and now two: studio:team-sealed, the third, went with the Sealed switch (the pass over
     the retired folder mechanics). The floor itself did not move: invite-make below still answers the unreadable-teams refusal from the key's floor file. The control reads the
     same text with one site made bare and must fail the count. */
  const SITES = 2, siteCount = (t) => ({ passed: t.split("studioTeammates(at, { key: await keyFileNow() })").length - 1, bare: (t.match(/studioTeammates\(at\)/g) || []).length });
  const { passed, bare } = siteCount(shellText);
  const planted = siteCount(shellText.replace("studioTeammates(at, { key: await keyFileNow() })", "studioTeammates(at)"));
  const controlRed = !(planted.passed === SITES && planted.bare === 0);
  const guessedRevs = path.join(ud, "team-revs.json");
  const wasKey = process.env.STUDIO_SIGNING_KEY;
  const wasPass = process.env.STUDIO_KEY_PASSPHRASE;
  process.env.STUDIO_SIGNING_KEY = keyFile;
  process.env.STUDIO_KEY_PASSPHRASE = PASS;
  let said = "";
  try {
    const sh = await loadTestShell(ud);
    try {
      const r = await sh.ask("studio:invite-make", proj, "Ada", "");
      said = r && r.error ? String(r.error) : "";
    } finally { sh.done(); }
  } finally {
    if (wasKey === undefined) delete process.env.STUDIO_SIGNING_KEY; else process.env.STUDIO_SIGNING_KEY = wasKey;
    if (wasPass === undefined) delete process.env.STUDIO_KEY_PASSPHRASE; else process.env.STUDIO_KEY_PASSPHRASE = wasPass;
  }
  process.stdout.write("       moved floorRev " + floorRev + " passed " + passed + " bare " + bare
    + " guessedRevs " + fs.existsSync(guessedRevs) + " invite " + JSON.stringify(said) + "\n");
  /* P2: four sites asked the count with the key's own path; the desk-admit verb was one of them, and went with the code door, so three did; two do since 2026-11-26. */
  return passed === SITES && bare === 0 && controlRed && !fs.existsSync(guessedRevs) && said === TeamStore.REFUSAL_TEAMS_UNREADABLE;
};

const PLANTS = [
  { mark: "cap-teammates", leg: "tl-inv-30", rel: "src/team-store.mjs", line: "export const MAX_TEAMMATES = Infinity; /* plant:cap-teammates */" },
  { mark: "cap-teams", leg: "tl-fourth-team-refused", rel: "src/team-store.mjs", line: "export const MAX_TEAMS = Infinity; /* plant:cap-teams */" },
  { mark: "962s5-floor", leg: "962s5-teammates-floor", rel: "src/team-store.mjs", line: "  return false; /* plant:962s5-floor */" },
];

async function main(argv) {
  const keep = argv.indexOf("--keep") >= 0;
  clearScratch(SCRATCH);

  for (const name of Object.keys(LEGS)) {
    if (ONLY && name !== ONLY) continue;
    await leg(name, LEGS[name]);
  }

  if (!ONLY) {
    copyPlants({
      root: ROOT,
      self: SELF,
      label: "team-limits",
      onlyVar: "TEAM_LIMITS_ONLY",
      plants: PLANTS,
      check,
      skip: (line) => process.stdout.write("  SKIP " + line + "\n"),
    });
  }

  if (!keep) dropScratch(SCRATCH, "tests/team-limits.mjs");
  process.stdout.write("#counts checks=" + asserted + " failures=" + failed + "\n");
  process.stdout.write("team-limits " + (failed ? "FAILED " + failed + " of " : "passed ") + asserted + " check(s)\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch((e) => {
  process.stderr.write("team-limits: " + (e && e.stack || e) + "\n");
  process.exit(2);
});
