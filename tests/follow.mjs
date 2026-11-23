/* A STUDIO JOINS ANOTHER STUDIO'S TEAM AS A TEAMMATE, WITH A MEMBER KEY OF ITS OWN (board 962, stage 7, V2).
 *
 *     node tests/follow.mjs        exit code is the number of failed checks, capped at 63
 *
 * gate-kind: node
 *
 * Two Studios in this process: a central one leading a team by Studio's own lead code (src/team.mjs, src/studio.mjs
 * watchAdmit, src/relay.mjs on the relay as the pinned engine builds it, tests/relay-lab.mjs), and an office one joining it
 * through src/member.mjs. Nothing changes on the central side. Throwaway keys and invented words only.
 *
 *   962s7a  a followed team never reaches relayTeams, watchedTeams, studioTeammates, the three-team count or teamKeysOf, while
 *           the office's own led teams do
 *   962s7br on the relay, by the in-process relay: the request reaches the lead through the invitation's channel, the office
 *           opens the lead's join answer by its member box, holds the key and opens the edition; leaving takes in-use.ec off
 *           the lead's mirror and leaves no channel state behind
 *   962s7c  an edition signed by another key is no edition; a team file whose handover chain does not reach its lead leaves the
 *           team not reached and the pin where it was; a genuine handover moves the pin (the control)
 *   962s7d  after the office publishes its own catalog, its member place on the central mirror holds only in-use.ec, and a
 *           member write of any other name is refused
 *   962s7e  the member key is never the signing key: a k- id beside the studio- id, and a member key equal to the signing key
 *           is refused at the join
 *   962s7f  a removal at the central leaves the office's catalogs whole, its kept editions still open, and the follow says
 *           the office is no longer on the team
 *   962s7k  an edition sealed at key number 1 still opens after the team file moves to 2 with the office still on the roster
 *   962s7l  a following record whose lead was edited by hand, or whose seal was changed, reads as not reached
 *   962s7n  the backup copy carries the member key and the followed team's sealed part, never in the clear, and a restore
 *           brings both back; a wrong passphrase opens nothing, a changed member seal brings no member, and a member key equal
 *           to the signing key is never restored, into an empty place or over one
 *   962s7o  the floor: after a removal at key number 2, an older genuine team file that still lists the office is not heeded,
 *           neither put in the mirror nor offered by the mirror after the mirror is lost
 *   962s7p  leaving a relay team (in 962s7br and directly) takes the member's files off the lead's mirror before its channel
 *           stops, drops channel state and forgets the record
 *   962s7q  a second join of the same team, by a new invitation, replaces the sealed record whole: the request and the seal name the
 *           new invitation, and the central lead admits it
 *   962s7r  a followed team with no member key id, a folder team with an empty folder, or a relay team with no relay is refused,
 *           and a restored record naming another member is not kept
 *   974c17  a following Studio is told of the team's lapse. One joining while the relay answers 403 team-lapsed
 *           waits for the renewal. One already following sees the step a desk sees, with the dates, and the renewal is
 *           the team's lead's. A lapse is not a removal, and the channel keeps asking (board 974, C17)
 *   974c1a  when the lead moves a followed relay team onto a second relay and publishes the next catalog rev, one sync each side
 *           brings the office to that rev on the second relay; a later folder channel at a higher rev leaves "following" as moved
 *   974c1b  a relay join the lead refuses leaves "joining", and the Settings row says refused
 *   974c1c  an in-use update owed to the first relay at the moment of a switch to a second relay settles before the switch
 *   974c1d  an admission reaches an open Settings row without navigation: the page sits on Settings' teams section with the
 *           joining row, the central admits, the run's state turns and the shell's signal reaches the page, and the row then
 *           says following with the team's catalog, with no visit to Settings in between; the signal's path (the shell's
 *           onState, the preload's onFollowChanged, boot's handler) is read in the source
 *   989a    where the relay's socket does not get through and the asking does, the run says not live after two failed sockets,
 *           the Settings row says the updates arrive about once a minute, in English and Polish, with its hover; no socket is
 *           made for a minute while the asks go on; a socket that opens takes the line away; failed asks never show it
 *   989b    a socket the door refuses to make (null, or a throw) is no server's refusal: it neither counts nor clears, so a
 *           run of them never says not live or holds the socket
 *   skr1    a followed team's genuine file naming a relay this build does not know (src/relay-known.mjs), under the same relay
 *           team id through the relay and under another put in the mirror, moves nothing: the record byte for byte, the state,
 *           the catalogs and the channel as they were, no address handed or sent but the relay's; the row says so once in English
 *           and Polish, the address nowhere; a later file naming the known relay is followed (Claude alpha, 2026-11-17 20:33)
 *   skr2    a record on disk already naming such a relay opens no channel and calls nothing, and the row says so
 *   skr3    a record pointed at such a relay while its run is live keeps the channel it had
 *   skr4    retargetFollowing alone refuses every such address (another host, staging's in an ordinary build, a dot segment,
 *           the host in capitals, the default port) and leaves the record byte for byte; the known relay is taken
 *   skr5    keepFollowing refuses a record naming such a relay and writes nothing, and a backup copy's is not restored
 *   skr6    an invitation naming such a relay is refused as one Studio cannot read, with no member key made and nothing written
 *   as4-8a  a legacy folder-followed record opens no channel, reads nothing under the folder, writes nothing anywhere (a genuine team
 *           file naming a relay in its mirror moves nothing, and an in-use file is refused), keeps its record and catalogs whole,
 *           and renders sentence 8a once in Settings
 *   as4-8b  a relay team whose signed file now names channel folder keeps its catalogs, renders sentence 8b once in Settings, and
 *           resumes following automatically when a later file names a known relay
 *   as4-6b  a legacy folder invitation, which the pinned reader no longer reads as a relay one, is refused with SAID.unread, and leftover invites/*.wrap.json files on the share are left
 *           untouched and unread
 *   c6f17   a following Studio with no member certificate is refused at the relay's seat wall, spends nothing and reaches no lead;
 *           the follow state carries the ask (signin, renew or removed) and the row says it in English and Polish in place of the
 *           wait; holding one, the same run opens (the relay's design note C-6, review 47's finding 17)
 *
 * PLANTS. Each guard is then taken out once in a scratch copy (tests/plant-copy.mjs), its leg run alone there, and must go
 * red; ETIUDA_PLANTS=off skips the phase and counts each plant as skipped. */
process.removeAllListeners("warning");
process.on("warning", () => {});

import { licensedOpts } from "./licensed.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { syncBuiltinESMExports } from "node:module";
import { fileURLToPath } from "node:url";
import * as Engine from "../src/engine.mjs";
import * as K from "../src/team-store.mjs";
import { makeInvite, newSecret } from "../src/invite.mjs";
import { localDay } from "../src/licence.mjs";
import { makeKeyFile, readKeyFile, unlockKey, signCatalog, signDocument } from "../src/sign.mjs";
import { newTeam, withChannel, writeTeam, heldTeam, newEpoch } from "../src/team.mjs";
import { relayWorld, makeVault, keyPair, labDir, put, read, hex, placeGrant, GRANT_ROOTS, memberSeat } from "./relay-lab.mjs";
import { copyPlants } from "./plant-copy.mjs";
import { loadPage } from "./page-stand-in.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SELF = fileURLToPath(import.meta.url);
const ONLY = process.env.FOLLOW_ONLY || "";
const PASS = "harbour-lamp-passphrase";
const asked = async (p) => { try { return await import(p); } catch (e) { return { missing: String(e && e.message || e) }; } };
const M = await asked("../src/member.mjs");
const Relay = await asked("../src/relay.mjs");

let asserted = 0, failed = 0;
function check(ok, line) {
  asserted++;
  if (ok) console.log("  ok   " + line);
  else { failed++; console.log("  FAIL " + line); }
}
function skip(line) { console.log("  skip " + line); }
const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return null; } };
function treeOf(dir) {
  const out = {};
  const walk = (at, rel) => {
    let names = [];
    try { names = fs.readdirSync(at, { withFileTypes: true }); } catch { return; }
    for (const d of names) {
      const r = rel ? rel + "/" + d.name : d.name;
      if (d.isDirectory()) walk(path.join(at, d.name), r);
      else out[r] = crypto.createHash("sha256").update(fs.readFileSync(path.join(at, d.name))).digest("hex");
    }
  };
  walk(dir, "");
  return JSON.stringify(out, Object.keys(out).sort());
}
const filesIn = (dir) => { try { return fs.readdirSync(dir).sort(); } catch { return []; } };

/* A Studio's signing key in `ud`, opened: {keyAt, read, open}. */
async function studioKey(ud) {
  fs.mkdirSync(ud, { recursive: true });
  const keyAt = path.join(ud, "signing-key.json");
  fs.writeFileSync(keyAt, JSON.stringify(await makeKeyFile({ passphrase: PASS }), null, 1) + "\n");
  const read = readKeyFile(keyAt);
  return { keyAt, read, open: unlockKey(read, PASS) };
}
/* A catalog edition signed by `signer` ({keyId, privateKey}) and sealed for the team at `epoch`. */
async function edition(signer, teamId, epoch, teamKey, id, rev) {
  const cat = await signCatalog({ format: 2, kind: "etiuda-catalog", id, rev, date: "2026-11-0" + Math.min(9, rev + 1), title: "Harbour lamps",
    cards: [] }, { privateKey: signer.privateKey, keyId: signer.keyId });
  return JSON.stringify(Engine.sealRules().sealCatalog(teamKey, teamId, epoch, JSON.stringify(cat))) + "\n";
}

function makeFolderInvite(target, name, secret, now) {
  const Ir = Engine.inviteRules();
  const lead = target.lead || {};
  const doc = {
    team: String(target.team || ""), folder: String(target.folder || ""),
    lead: { keyId: String(lead.keyId || ""), public: String(lead.public || ""), name: String(name || "") },
    secret: String(secret || ""),
  };
  const blob = "etiuda-join:" + Buffer.from(JSON.stringify(doc), "utf8").toString("base64url");
  const at = new Date(now == null ? Date.now() : now);
  return {
    blob, link: "", id: Ir.inviteIdOf(doc.secret),
    name: doc.lead.name, made: at.toISOString(), expires: new Date(at.getTime() + 7 * 86400000).toISOString(),
  };
}

/* The central Studio leading a sealed team in a shared folder, with a live invitation. */
async function centralFolder(lab) {
  const ud = path.join(lab, "central"), share = path.join(lab, "share");
  fs.mkdirSync(share, { recursive: true });
  const k = await studioKey(ud), tf = K.teamsFile(ud), vault = makeVault();
  const teamId = "t-" + hex(8), teamKey = crypto.randomBytes(32);
  K.keepTeamKey(tf, vault, teamId, 1, teamKey);
  const team = newTeam({ id: teamId, catalogs: ["harbour-lamps"], lead: { keyId: k.open.keyId, public: k.open.public }, sealed: true, exportsSealed: true });
  const written = (await writeTeam(share, team, { key: k.keyAt, passphrase: PASS })).team;
  K.chooseSealed(tf, teamId, true, share, written);
  const secret = newSecret();
  const made = makeFolderInvite({ team: teamId, folder: share, lead: { keyId: k.open.keyId, public: k.open.public } }, "Central lead", secret, Date.now());
  K.keepInvite(tf, vault, teamId, { id: made.id, secret, made: made.made, expires: made.expires, name: made.name });
  return Object.assign(k, { ud, share, tf, vault, teamId, teamKey, made });
}
/* The office Studio: its own signing key, its teams file, its member key file. */
async function office(lab) {
  const ud = path.join(lab, "office");
  const k = await studioKey(ud);
  return Object.assign(k, { ud, tf: K.teamsFile(ud), vault: makeVault(), memberFile: path.join(ud, "member-key.json") });
}
async function kicks(f, n) { for (let i = 0; i < (n || 4); i++) { f.kick(); await f.idle(); } }
/* The Settings row a followed team paints, in `lang` ("pl" or the English default). */
function paintFollow(view, lang) {
  const P = loadPage({ uiLang: lang, api: {
    teams: () => Promise.resolve({ teams: [] }),
    projects: () => Promise.resolve({ root: "C:\\Projects", projects: [] }),
    followState: () => Promise.resolve({ follow: view }),
  } });
  P.page.S.screen = "settings";
  P.page.S.sx = { sec: "teams", q: "" };
  P.page.S.follow = view;
  P.node("#main").innerHTML = P.page.settingsPageHtml();
  return String(P.node("#main").innerHTML).replace(/&#39;/g, "'");
}
const LEGS = {};

LEGS["962s7a"] = async () => {
  const lab = labDir("follow-a"), ud = path.join(lab, "office");
  fs.mkdirSync(ud, { recursive: true });
  const tf = K.teamsFile(ud), vault = makeVault();
  const led = "t-" + hex(8), ledRelay = "t-" + hex(8), followed = "t-" + hex(8);
  K.keepTeamKey(tf, vault, led, 1, crypto.randomBytes(32));
  K.chooseSealed(tf, led, true, path.join(lab, "own-share"));
  K.keepTeamKey(tf, vault, ledRelay, 1, crypto.randomBytes(32));
  K.keepRelay(tf, ledRelay, hex(16), "https://etiuda.dev/relay/v1");
  const lead = keyPair(false);
  K.keepFollowing(tf, vault, followed, { channel: "relay", relay: { rt: hex(16), url: Relay.RELAY_URL }, member: "k-" + hex(8), leadName: "Central" },
    { lead: { keyId: lead.keyId, public: lead.pub }, chain: [], keys: { 1: hex(32) } });
  const relayIds = K.relayTeams(tf).map((t) => t.team), watched = K.watchedTeams(tf).map((t) => t.team);
  const mates = K.studioTeammates(tf), keyed = Object.keys(K.teamKeysOf(tf, vault)), f = K.followingOf(tf, vault);
  const apart = relayIds.indexOf(followed) < 0 && watched.indexOf(followed) < 0 && keyed.indexOf(followed) < 0 && mates.ok && mates.teamsCount === 2;
  /* The led team kept for a folder is held, not watched (was: watched.indexOf(led) >= 0; the folder team's removal); the relay one is. */
  const own = relayIds.indexOf(ledRelay) >= 0 && watched.indexOf(ledRelay) >= 0 && watched.indexOf(led) < 0 && keyed.length === 2;
  check(apart && own && !!f && f.team === followed && f.state === "joining" && !!f.lead && f.lead.public === lead.pub,
    "962s7a a followed team reaches none of relayTeams, watchedTeams, teamKeysOf or the three-team count (teams counted " + mates.teamsCount
    + ", followed in relay " + (relayIds.indexOf(followed) >= 0) + ", watched " + (watched.indexOf(followed) >= 0) + ", keyed "
    + (keyed.indexOf(followed) >= 0) + "), while the office's own two led teams do " + own + ", and it reads back as followed " + !!(f && f.team === followed));
};

/* The central Studio leading a team on the in-process relay, as tests/relay-studio.mjs studioLead makes one. */
async function centralRelay(world, lab) {
  const ud = path.join(lab, "central");
  const k = await studioKey(ud), tf = K.teamsFile(ud), vault = makeVault();
  placeGrant(k.keyAt, k.open.public);
  const rt = Relay.relayId(), teamId = "t-" + hex(8), teamKey = crypto.randomBytes(32);
  K.keepTeamKey(tf, vault, teamId, 1, teamKey);
  const mirror = K.keepRelay(tf, teamId, rt, Relay.RELAY_URL);
  let team = newTeam({ id: teamId, catalogs: ["harbour-lamps"], lead: { keyId: k.open.keyId, public: k.open.public }, sealed: true, exportsSealed: true });
  team = withChannel(team, { kind: "relay", rt, url: Relay.RELAY_URL }, { format: 1, kind: "etiuda-ring", keys: [] });
  fs.mkdirSync(mirror, { recursive: true });
  await writeTeam(mirror, team, { key: k.keyAt, passphrase: PASS });
  const t = world.transport("central");
  const runner = Relay.relayRunner({ roots: GRANT_ROOTS, teamsFile: tf, vault, keyFile: k.keyAt, secret: () => PASS, request: t.request, connect: t.connect,
    watch: false, pollMs: 1e9, say: () => {} });
  return Object.assign(k, { ud, tf, vault, rt, teamId, teamKey, mirror, runner });
}

LEGS["962s7br"] = async () => {
  const world = await relayWorld(), lab = labDir("follow-br");
  const c = await centralRelay(world, lab), o = await office(lab);
  const box = Relay.leadOpened(c.keyAt, PASS).box.public;
  const secret = newSecret(), ri = Relay.relayInvite(secret);
  const made = makeInvite({ team: c.teamId, folder: c.mirror, lead: { keyId: c.open.keyId, public: c.open.public, box } }, "Central lead", secret, Date.now(),
    undefined, { rt: c.rt, url: Relay.RELAY_URL, token: ri.token, inv: ri.inv });
  K.keepInvite(c.tf, c.vault, c.teamId, { id: made.id, secret, made: made.made, expires: made.expires, name: made.name, relay: ri });
  await c.runner.sync(); await c.runner.idle();
  const joined = M.joinTeam({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, text: made.link, name: "Office Studio", signingPublic: o.open.public });
  const t = world.transport("office");
  const f = M.startFollow({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, seat: memberSeat(o.memberFile), signingPublic: o.open.public, request: t.request, connect: t.connect,
    pollMs: 1e9, watch: false });
  await kicks(f, 3);
  await c.runner.sync(); await c.runner.idle();
  const req = readJson(path.join(c.mirror, "desks", joined.member, "join.json"));
  const genuine = !!req && Engine.joinRules().joinGenuine(req, joined.member) && req.desk.kind === "studio";
  const S = await import("../src/studio.mjs");
  const r = await S.watchAdmit(c.mirror, c.keyAt, PASS, { teamKeys: K.teamKeysOf(c.tf, c.vault), invites: K.inviteBookOf(c.tf, c.vault), teamsFile: c.tf });
  for (const x of r.spent || []) K.endInvite(c.tf, c.teamId, x.invite, "spent", x.desk);
  await Relay.answerAdmitted(c.runner, { teamsFile: c.tf, vault: c.vault, team: c.teamId, folder: c.mirror, spent: r.spent });
  /* Read before the lead next syncs: once its key is enrolled, a member no longer reads the answer, and needs none. */
  await kicks(f, 2);
  const answered = f.answer();
  put(c.mirror, "harbour-lamps.ec", await edition(c.open, c.teamId, 1, c.teamKey, "harbour-lamps", 1));
  for (let i = 0; i < 3; i++) { await c.runner.sync(); await c.runner.idle(); await kicks(f, 2); }
  const fo = K.followingOf(o.tf, o.vault), eds = M.followedEditions(o.tf, o.vault);
  const keyOk = !!fo && !!fo.keys["1"] && fo.keys["1"].equals(c.teamKey);
  check(genuine && (r.admitted || []).indexOf(joined.member) >= 0 && answered === "joined" && keyOk && fo.state === "following" && eds.length === 1,
    "962s7br on the relay, the office's request reaches the lead through the invitation's channel and is genuine with kind studio " + genuine
    + "; the lead admits it " + ((r.admitted || []).indexOf(joined.member) >= 0) + "; the office opens the lead's join answer by its member box ("
    + answered + "), holds the team key " + keyOk + " (state " + (fo && fo.state) + ") and opens the lead's edition (" + eds.length + " counted)");
  /* Leaving: in-use.ec goes off the lead's mirror, and no channel state is left behind. */
  M.writeInUse({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, signingPublic: o.open.public, catalog: { id: "harbour-lamps", rev: 1, sha256: "sha256:" + hex(32) } });
  await f.settle(10000); await c.runner.sync(); await c.runner.idle();
  const inUse = fs.existsSync(path.join(c.mirror, "desks", joined.member, "in-use.ec"));
  await M.leaveTeam({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, run: f, ms: 10000 });
  for (let i = 0; i < 2; i++) { await c.runner.sync(); await c.runner.idle(); }
  const goneThere = !fs.existsSync(path.join(c.mirror, "desks", joined.member, "in-use.ec"));
  const state = fs.existsSync(f.mirror + ".json");
  check(inUse && goneThere && !state && !K.followingOf(o.tf, o.vault),
    "962s7br leaving a relay team takes in-use.ec off the lead's mirror (there before " + inUse + ", gone after " + goneThere
    + ") and leaves no channel state behind " + !state);
  await c.runner.stop();
};

LEGS["962s7c"] = async () => {
  const w = await followedOnRelay("follow-c");
  const stranger = keyPair(false);
  /* An edition sealed with the right key and signed by another. */
  put(w.c.mirror, "forged-lamps.ec", await edition({ keyId: stranger.keyId, privateKey: stranger.privateKey }, w.c.teamId, 1, w.c.teamKey, "forged-lamps", 1));
  await w.c.runner.sync(); await w.c.runner.idle(); await kicks(w.f, 2);
  const landed = fs.existsSync(path.join(w.f.mirror, "forged-lamps.ec"));
  /* The relay channel refuses it on arrival; it is judged again at read, so one put in the mirror by any other way is no edition
     either (Argon's review of 2026-11-09, finding 3, case D). */
  if (!landed) fs.writeFileSync(path.join(w.f.mirror, "forged-lamps.ec"), fs.readFileSync(path.join(w.c.mirror, "forged-lamps.ec")));
  const eds = M.followedEditions(w.o.tf, w.o.vault).map((e) => e.catalog);
  const forgedOut = eds.indexOf("forged-lamps") < 0 && eds.indexOf("harbour-lamps") >= 0;
  /* A team file whole under another key, its handover from the pinned lead reaching a third key, not the one it names. */
  const k2 = keyPair(false), k3 = keyPair(false), B = Engine.relayRules().blob;
  const was = readJson(path.join(w.f.mirror, "etiuda-team.json"));
  const step = { format: 1, kind: "etiuda-team-handover", team: w.c.teamId, from: { keyId: w.c.open.keyId, public: w.c.open.public },
    to: { keyId: k3.keyId, public: k3.pub }, sig: { alg: "Ed25519", keyId: w.c.open.keyId, value: "" } };
  step.sig.value = crypto.sign(null, B.handoverSignedBytes(step), w.c.open.privateKey).toString("hex");
  const bad = JSON.parse(JSON.stringify(was));
  delete bad.sig; bad.lead = { keyId: k2.keyId, public: k2.pub }; bad.handover = [step]; bad.rev = (was.rev || 0) + 5;
  fs.writeFileSync(path.join(w.f.mirror, "etiuda-team.json"), JSON.stringify(await signDocument(bad, { privateKey: k2.privateKey, keyId: k2.keyId })) + "\n");
  const said = M.heed(w.o.tf, w.o.vault, M.openMember(w.o.memberFile, w.o.vault, { signingPublic: w.o.open.public }));
  const after = K.followingOf(w.o.tf, w.o.vault);
  const held = said === "not-reached" && after.state === "not-reached" && after.lead.public === w.c.open.public;
  /* The control: a genuine handover from the pinned lead to the key the file names moves the pin. */
  const good = JSON.parse(JSON.stringify(was));
  const step2 = Object.assign({}, step, { to: { keyId: k2.keyId, public: k2.pub }, sig: { alg: "Ed25519", keyId: w.c.open.keyId, value: "" } });
  step2.sig.value = crypto.sign(null, B.handoverSignedBytes(step2), w.c.open.privateKey).toString("hex");
  delete good.sig; good.lead = { keyId: k2.keyId, public: k2.pub }; good.handover = [step2]; good.rev = (was.rev || 0) + 6;
  fs.writeFileSync(path.join(w.f.mirror, "etiuda-team.json"), JSON.stringify(await signDocument(good, { privateKey: k2.privateKey, keyId: k2.keyId })) + "\n");
  const said2 = M.heed(w.o.tf, w.o.vault, M.openMember(w.o.memberFile, w.o.vault, { signingPublic: w.o.open.public }));
  const moved = K.followingOf(w.o.tf, w.o.vault);
  const control = said2 === "following" && moved.lead.public === k2.pub && moved.chain.some((x) => x.public === w.c.open.public);
  check(forgedOut && held && control,
    "962s7c an edition sealed for the team but signed by another key is no edition (the syncer took it " + landed + "; put in the mirror, counted " + !forgedOut
    + "); a team file whose handover does not reach its lead leaves the team not reached (" + said + ") with the pin where it was "
    + !!(after.lead && after.lead.public === w.c.open.public) + "; a genuine handover moves the pin " + control);
  await w.f.stop();
  await w.c.runner.stop();
};

LEGS["962s7d"] = async () => {
  const w = await followedOnRelay("follow-d");
  const me = w.joined.member;
  const sha = "sha256:" + hex(32);
  M.writeInUse({ teamsFile: w.o.tf, vault: w.o.vault, memberFile: w.o.memberFile, signingPublic: w.o.open.public, catalog: { id: "harbour-lamps", rev: 1, sha256: sha } });
  await w.f.settle(10000); await w.c.runner.sync(); await w.c.runner.idle();
  /* The office publishes a catalog of its own to its own team's place. */
  const S = await import("../src/studio.mjs");
  const root = path.join(w.lab, "office-projects"), ownShare = path.join(w.lab, "office-share");
  fs.mkdirSync(root, { recursive: true }); fs.mkdirSync(ownShare, { recursive: true });
  const p = await S.newProject(root, "Quay signals", [{ code: "en", name: "English" }]);
  const shelf = await S.addTag(p.dir, "shelf", { en: "General" });
  await S.addCard(p.dir, (shelf.tag || shelf).id, "Signal lamp", "Raise the signal lamp at dusk.");
  await S.publishProject(p.dir, { folder: ownShare, notes: "own", ...(await licensedOpts()) });
  await kicks(w.f, 2);
  const place = filesIn(path.join(w.c.mirror, "desks", me));
  const only = place.length >= 1 && place.every((n) => n === "join.json" || n === "in-use.ec") && place.indexOf("in-use.ec") >= 0;
  let refusedOther = false;
  try { M.memberWrite(w.o.tf, w.c.teamId, { id: me }, "quay-signals.ec", "{}"); } catch (e) { refusedOther = true; }
  const inUse = readJson(path.join(w.c.mirror, "desks", me, "in-use.ec"));
  const opened = inUse ? JSON.parse(Engine.sealRules().openSealed(w.c.teamKey, inUse) || "null") : null;
  const genuine = !!opened && Engine.deskRules().deskFileGenuine(opened, me) && opened.catalog.id === "harbour-lamps";
  check(only && refusedOther && genuine && filesIn(ownShare).some((n) => /\.ec$/.test(n)),
    "962s7d after the office publishes its own catalog, its member place on the central share holds only " + JSON.stringify(place)
    + "; its in-use.ec is genuine for its member key " + genuine + "; a member write of any other name is refused " + refusedOther);
  await w.f.stop();
  await w.c.runner.stop();
};

LEGS["962s7e"] = async () => {
  const world = await relayWorld(), lab = labDir("follow-e");
  const c = await centralRelay(world, lab), o = await office(lab);
  const box = Relay.leadOpened(c.keyAt, PASS).box.public;
  const secret = newSecret(), ri = Relay.relayInvite(secret);
  const made = makeInvite({ team: c.teamId, folder: c.mirror, lead: { keyId: c.open.keyId, public: c.open.public, box } }, "Central lead", secret, Date.now(),
    undefined, { rt: c.rt, url: Relay.RELAY_URL, token: ri.token, inv: ri.inv });
  const pub = M.ensureMember(o.memberFile, o.vault, { signingPublic: o.open.public });
  const apart = /^k-[0-9a-f]{16}$/.test(pub.id) && /^studio-/.test(o.open.keyId) && pub.key !== o.open.public;
  /* A member key file holding the signing key's own pair is refused at the join. */
  const o2 = await office(path.join(lab, "second"));
  const der = o2.open.privateKey.export({ type: "pkcs8", format: "der" }).toString("base64");
  const bx = crypto.generateKeyPairSync("x25519");
  const seal = (s) => Buffer.from(o2.vault.seal(s)).toString("base64");
  fs.writeFileSync(o2.memberFile, JSON.stringify({ format: 1, kind: "etiuda-studio-member-key", key: o2.open.public,
    box: bx.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex"), sign: seal(der),
    boxSecret: seal(bx.privateKey.export({ type: "pkcs8", format: "der" }).toString("base64")) }) + "\n");
  let refusedSame = "";
  try { M.joinTeam({ teamsFile: o2.tf, vault: o2.vault, memberFile: o2.memberFile, text: made.link, signingPublic: o2.open.public }); }
  catch (e) { refusedSame = String(e && e.message || e); }
  const nothing = !fs.existsSync(path.join(path.dirname(o2.tf), "following"));
  check(apart && refusedSame === M.MEMBER_SAID.apart && nothing,
    "962s7e the member key is never the signing key: a k- id " + /^k-/.test(pub.id) + " beside the signing key's studio- id, other halves "
    + (pub.key !== o.open.public) + "; a member key equal to the signing key is refused at the join (" + (refusedSame ? "refused" : "joined") + ") and nothing is written " + nothing);
  await c.runner.stop();
};

LEGS["962s7f"] = async () => {
  const w = await followedOnRelay("follow-f");
  const S = await import("../src/studio.mjs");
  const root = path.join(w.lab, "office-projects");
  fs.mkdirSync(root, { recursive: true });
  const p = await S.newProject(root, "Quay signals", [{ code: "en", name: "English" }]);
  const before = treeOf(root);
  const h = await heldTeam(w.c.mirror, { key: w.c.keyAt });
  const next = await newEpoch(h.team, { key: w.c.keyAt, remove: w.joined.member, secret: PASS });
  await writeTeam(w.c.mirror, next.team, { key: w.c.keyAt, passphrase: PASS });
  K.keepTeamKey(w.c.tf, w.c.vault, w.c.teamId, 2, next.teamKey);
  await w.c.runner.sync(); await w.c.runner.idle(); await kicks(w.f, 3);
  fs.copyFileSync(path.join(w.c.mirror, "etiuda-team.json"), path.join(w.f.mirror, "etiuda-team.json"));
  w.f.heed(); await w.f.idle();
  const v = M.followView(w.o.tf, w.o.vault);
  check(!!v && v.state === "removed" && treeOf(root) === before && v.catalogs.length === 1 && !!p.dir,
    "962s7f a removal at the central leaves the office's catalogs whole " + (treeOf(root) === before) + " and the editions it took still open ("
    + (v ? v.catalogs.length : 0) + "), and the follow says the office is no longer on the team (" + (v && v.state) + ")");
  await w.f.stop();
  await w.c.runner.stop();
};

LEGS["962s7k"] = async () => {
  const w = await followedOnRelay("follow-k");
  const h = await heldTeam(w.c.mirror, { key: w.c.keyAt });
  const next = await newEpoch(h.team, { key: w.c.keyAt, secret: PASS });
  await writeTeam(w.c.mirror, next.team, { key: w.c.keyAt, passphrase: PASS });
  K.keepTeamKey(w.c.tf, w.c.vault, w.c.teamId, 2, next.teamKey);
  put(w.c.mirror, "quay-lamps.ec", await edition(w.c.open, w.c.teamId, 2, next.teamKey, "quay-lamps", 1));
  for (let i = 0; i < 3; i++) { await w.c.runner.sync(); await w.c.runner.idle(); await kicks(w.f, 2); }
  const f = K.followingOf(w.o.tf, w.o.vault), eds = M.followedEditions(w.o.tf, w.o.vault).map((e) => e.catalog + "@" + e.epoch);
  check(f.state === "following" && !!f.keys["2"] && !!f.keys["1"] && eds.indexOf("harbour-lamps@1") >= 0 && eds.indexOf("quay-lamps@2") >= 0,
    "962s7k after the team file moves to key number 2 with the office still on it, the office keeps both keys (" + Object.keys(f.keys).join(",")
    + ") and an edition sealed at 1 still opens beside one sealed at 2: " + JSON.stringify(eds));
  await w.f.stop();
  await w.c.runner.stop();
};

LEGS["962s7l"] = async () => {
  const w = await followedOnRelay("follow-l");
  await w.f.stop();
  await w.c.runner.stop();
  const ok = K.followingOf(w.o.tf, w.o.vault);
  const doc = readJson(w.o.tf), rec = doc.following[w.c.teamId];
  const stranger = keyPair(false);
  /* A lead written by hand beside the seal. */
  const edited = JSON.parse(JSON.stringify(doc));
  edited.following[w.c.teamId].lead = { keyId: stranger.keyId, public: stranger.pub };
  fs.writeFileSync(w.o.tf, JSON.stringify(edited));
  const handLead = K.followingOf(w.o.tf, w.o.vault);
  const handEds = M.followedEditions(w.o.tf, w.o.vault);
  /* The seal itself changed. */
  const sealed = JSON.parse(JSON.stringify(doc));
  const b = Buffer.from(rec.seal, "base64"); b[b.length - 1] ^= 1;
  sealed.following[w.c.teamId].seal = b.toString("base64");
  fs.writeFileSync(w.o.tf, JSON.stringify(sealed));
  const handSeal = K.followingOf(w.o.tf, w.o.vault);
  check(ok.state === "following" && handLead.state === "not-reached" && !handLead.lead && handEds.length === 0 && handSeal.state === "not-reached" && !handSeal.lead,
    "962s7l a following record whose lead was edited by hand reads as not reached (" + handLead.state + ", editions " + handEds.length
    + "), and so does one whose seal was changed (" + handSeal.state + "); the record as written read as " + ok.state);
};

LEGS["962s7n"] = async () => {
  const w = await followedOnRelay("follow-n");
  await w.f.stop();
  await w.c.runner.stop();
  const S = await import("../src/studio.mjs");
  const memberRow = M.memberBackupRow(w.o.memberFile, w.o.vault, { signingPublic: w.o.open.public });
  const followRow = K.followBackupRow(w.o.tf, w.o.vault);
  const at = path.join(w.lab, "backup.json");
  await S.backupKey(at, w.o.keyAt, PASS, "a backup passphrase", { member: { key: memberRow, follow: followRow } });
  const text = fs.readFileSync(at, "utf8");
  const clear = text.indexOf(memberRow.sign) < 0 && text.indexOf(memberRow.boxSecret) < 0 && text.indexOf(w.c.teamKey.toString("hex")) < 0
    && text.indexOf(w.c.teamId) < 0;
  const back = await S.openBackup(at, "a backup passphrase");
  /* A fresh computer: the copy's member key and followed team kept again. */
  const ud2 = path.join(w.lab, "restored"), tf2 = K.teamsFile(ud2), file2 = path.join(ud2, "member-key.json"), vault2 = makeVault();
  fs.mkdirSync(ud2, { recursive: true });
  const kept = !!back.member && M.memberFromBackup(file2, vault2, back.member.key, { signingPublic: w.o.open.public });
  const brought = !!back.member && M.followFromBackup(tf2, vault2, back.member.follow, w.joined.member);
  const m2 = M.openMember(file2, vault2, {}), f2 = K.followingOf(tf2, vault2);
  check(clear && kept && brought && !!m2 && m2.id === w.joined.member && !!f2 && f2.team === w.c.teamId && !!f2.keys["1"] && f2.keys["1"].equals(w.c.teamKey)
    && f2.lead.public === w.c.open.public,
    "962s7n the backup copy carries the member key and the followed team's sealed part, none of it in the clear " + clear + "; a restore brings"
    + " back the same member key " + !!(m2 && m2.id === w.joined.member) + " and the followed team with its key and pinned lead " + !!(f2 && f2.lead));
  /* A wrong passphrase, and a member seal changed by one byte. */
  let wrongRefused = false;
  try { await S.openBackup(at, "not the passphrase"); } catch { wrongRefused = true; }
  const doc = JSON.parse(text), ct = Buffer.from(doc.member.ct, "hex"); ct[0] ^= 1; doc.member.ct = ct.toString("hex");
  const at2 = path.join(w.lab, "backup-changed.json");
  fs.writeFileSync(at2, JSON.stringify(doc, null, 1) + "\n");
  const changed = await S.openBackup(at2, "a backup passphrase");
  /* A member key equal to the signing key, restored into an empty place and over a file holding that same pair. */
  const bx = crypto.generateKeyPairSync("x25519");
  const same = { key: w.o.open.public, box: bx.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex"),
    sign: w.o.open.privateKey.export({ type: "pkcs8", format: "der" }).toString("hex"), boxSecret: bx.privateKey.export({ type: "pkcs8", format: "der" }).toString("hex") };
  const ud3 = path.join(w.lab, "restored-same"), file3 = path.join(ud3, "member-key.json");
  fs.mkdirSync(ud3, { recursive: true });
  const intoEmpty = M.memberFromBackup(file3, vault2, same, { signingPublic: w.o.open.public });
  const seal = (s) => Buffer.from(vault2.seal(s)).toString("base64");
  fs.writeFileSync(file3, JSON.stringify({ format: 1, kind: "etiuda-studio-member-key", key: same.key, box: same.box,
    sign: seal(w.o.open.privateKey.export({ type: "pkcs8", format: "der" }).toString("base64")),
    boxSecret: seal(bx.privateKey.export({ type: "pkcs8", format: "der" }).toString("base64")) }) + "\n");
  const overSame = M.memberFromBackup(file3, vault2, same, { signingPublic: w.o.open.public });
  check(wrongRefused && !!changed && changed.keyId === back.keyId && !changed.member && intoEmpty === false && overSame === false,
    "962s7n a wrong passphrase opens nothing " + wrongRefused + "; a member seal changed by a byte restores the key without a member "
    + !!(changed && !changed.member) + "; a backup member key equal to the signing key is refused into an empty place (" + intoEmpty
    + ") and over a file holding it (" + overSame + ")");
};

LEGS["962s7o"] = async () => {
  const w = await followedOnRelay("follow-o");
  const old = fs.readFileSync(path.join(w.c.mirror, "etiuda-team.json"));
  const h = await heldTeam(w.c.mirror, { key: w.c.keyAt });
  const next = await newEpoch(h.team, { key: w.c.keyAt, remove: w.joined.member, secret: PASS });
  await writeTeam(w.c.mirror, next.team, { key: w.c.keyAt, passphrase: PASS });
  await w.c.runner.sync(); await w.c.runner.idle(); await kicks(w.f, 3);
  fs.copyFileSync(path.join(w.c.mirror, "etiuda-team.json"), path.join(w.f.mirror, "etiuda-team.json"));
  w.f.heed(); await w.f.idle();
  const removed = K.followingOf(w.o.tf, w.o.vault);
  /* The older file, which still lists the office with a wrap, put in the mirror: the read's own floor. */
  fs.writeFileSync(path.join(w.f.mirror, "etiuda-team.json"), old);
  const said = M.heed(w.o.tf, w.o.vault, M.openMember(w.o.memberFile, w.o.vault, { signingPublic: w.o.open.public }));
  /* The mirror lost, and a fresh run starts on the relay: nothing of an older file is taken, and state stays removed. */
  await w.f.stop();
  fs.renameSync(w.f.mirror, w.f.mirror + "-lost");
  const t2 = w.world.transport("office-o2");
  const f2 = M.startFollow({ teamsFile: w.o.tf, vault: w.o.vault, memberFile: w.o.memberFile, seat: memberSeat(w.o.memberFile), signingPublic: w.o.open.public,
    request: t2.request, connect: t2.connect, pollMs: 1e9, watch: false });
  await kicks(f2, 3);
  const took = fs.existsSync(path.join(f2.mirror, "etiuda-team.json"));
  const after = K.followingOf(w.o.tf, w.o.vault);
  check(removed.state === "removed" && !!removed.floor && removed.floor.epoch === 2 && said === "removed" && !took && after.state === "removed",
    "962s7o after a removal at key number 2 the floor is kept sealed (" + JSON.stringify(removed.floor) + "); an older genuine file that still"
    + " lists the office is not heeded from the mirror (" + said + "), and a fresh mirror after a loss does not take it ("
    + (took ? "taken" : "refused") + ", state " + after.state + ")");
  await f2.stop();
  await w.c.runner.stop();
};

LEGS["962s7p"] = async () => {
  const w = await followedOnRelay("follow-p");
  await w.f.stop();
  const me = w.joined.member;
  const t = w.world.transport("office-p2");
  const f = M.startFollow({ teamsFile: w.o.tf, vault: w.o.vault, memberFile: w.o.memberFile, seat: memberSeat(w.o.memberFile), signingPublic: w.o.open.public,
    request: t.request, connect: t.connect, pollMs: 1e9, watch: false });
  M.writeInUse({ teamsFile: w.o.tf, vault: w.o.vault, memberFile: w.o.memberFile, signingPublic: w.o.open.public, catalog: { id: "harbour-lamps", rev: 1, sha256: "sha256:" + hex(32) } });
  await f.settle(10000);
  await w.c.runner.sync(); await w.c.runner.idle();
  const before = filesIn(path.join(w.c.mirror, "desks", me));
  const left = await M.leaveTeam({ teamsFile: w.o.tf, vault: w.o.vault, memberFile: w.o.memberFile, run: f, ms: 10000 });
  for (let i = 0; i < 2; i++) { await w.c.runner.sync(); await w.c.runner.idle(); }
  const after = filesIn(path.join(w.c.mirror, "desks", me));
  const noState = !fs.existsSync(f.mirror + ".json");
  check(before.indexOf("in-use.ec") >= 0 && !!left && after.length === 0 && !K.followingOf(w.o.tf, w.o.vault) && noState,
    "962s7p leaving a relay team takes the member's files off the lead's mirror before its channel stops (before " + JSON.stringify(before)
    + ", after " + JSON.stringify(after) + "), drops channel state " + noState + " and forgets the record " + !K.followingOf(w.o.tf, w.o.vault));
  await w.c.runner.stop();
};

LEGS["962s7q"] = async () => {
  const world = await relayWorld(), lab = labDir("follow-q");
  const c = await centralRelay(world, lab), o = await office(lab);
  const box = Relay.leadOpened(c.keyAt, PASS).box.public;
  const secret = newSecret(), ri = Relay.relayInvite(secret);
  const made = makeInvite({ team: c.teamId, folder: c.mirror, lead: { keyId: c.open.keyId, public: c.open.public, box } }, "Central lead", secret, Date.now(),
    undefined, { rt: c.rt, url: Relay.RELAY_URL, token: ri.token, inv: ri.inv });
  const joined = M.joinTeam({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, text: made.link, signingPublic: o.open.public });
  const t = world.transport("office");
  let f = M.startFollow({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, seat: memberSeat(o.memberFile), signingPublic: o.open.public, request: t.request, connect: t.connect,
    pollMs: 1e9, watch: false });
  await kicks(f, 2);
  await f.stop();
  const secret2 = newSecret(), ri2 = Relay.relayInvite(secret2);
  const made2 = makeInvite({ team: c.teamId, folder: c.mirror, lead: { keyId: c.open.keyId, public: c.open.public, box } }, "Central lead", secret2, Date.now(),
    undefined, { rt: c.rt, url: Relay.RELAY_URL, token: ri2.token, inv: ri2.inv });
  K.keepInvite(c.tf, c.vault, c.teamId, { id: made2.id, secret: secret2, made: made2.made, expires: made2.expires, name: made2.name, relay: ri2 });
  await c.runner.sync(); await c.runner.idle();
  M.joinTeam({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, text: made2.link, signingPublic: o.open.public });
  const sealed = K.followingOf(o.tf, o.vault);
  f = M.startFollow({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, seat: memberSeat(o.memberFile), signingPublic: o.open.public, request: t.request, connect: t.connect,
    pollMs: 1e9, watch: false });
  await kicks(f, 3);
  await c.runner.sync(); await c.runner.idle();
  const req = readJson(path.join(c.mirror, "desks", joined.member, "join.json"));
  const I = Engine.inviteRules();
  const S = await import("../src/studio.mjs");
  const r = await S.watchAdmit(c.mirror, c.keyAt, PASS, { auto: false, teamKeys: K.teamKeysOf(c.tf, c.vault), invites: K.inviteBookOf(c.tf, c.vault), teamsFile: c.tf });
  check(!!sealed.invite && sealed.invite.secret === secret2 && sealed.state === "joining" && !!req && req.invite.id === I.inviteIdOf(secret2)
    && (r.admitted || []).indexOf(joined.member) >= 0,
    "962s7q a second join of the same team replaces the sealed record whole: its invitation is the new one " + !!(sealed.invite && sealed.invite.secret === secret2)
    + ", the request names it " + !!(req && req.invite.id === I.inviteIdOf(secret2)) + ", and the central lead admits it " + ((r.admitted || []).indexOf(joined.member) >= 0));
  await f.stop();
  await c.runner.stop();
};

/* A RECORD AN OLDER STUDIO KEPT FOR A SHARED FOLDER, seeded as that Studio left it: keepFollowing makes none any more (the folder team's
   removal, Max, 2026-11-22 15:37), so a relay record is kept and its channel turned to the folder in the file itself. */
function seedFolderFollowed(tf, vault, team, plain, sealed) {
  K.keepFollowing(tf, vault, team, Object.assign({}, plain, { channel: "relay", relay: { rt: "9d".repeat(16), url: Relay.RELAY_URL } }), sealed);
  const doc = JSON.parse(fs.readFileSync(tf, "utf8").replace(/^\uFEFF/, ""));
  const rec = doc.following[team];
  rec.channel = "folder"; delete rec.relay; rec.folder = path.resolve(plain.folder);
  fs.writeFileSync(tf, JSON.stringify(doc, null, 1) + "\n");
}

LEGS["962s7r"] = async () => {
  const lab = labDir("follow-r"), ud = path.join(lab, "office");
  fs.mkdirSync(ud, { recursive: true });
  const tf = K.teamsFile(ud), vault = makeVault(), lead = keyPair(false), team = "t-" + hex(8);
  const sealed = { lead: { keyId: lead.keyId, public: lead.pub }, chain: [], keys: {} };
  const refusedBy = (plain) => { try { K.keepFollowing(tf, vault, team, plain, sealed); return false; } catch { return true; } };
  /* A record for a shared folder is no longer made at all, empty or named (was: an empty folder was refused, a named one kept). */
  const emptyFolder = refusedBy({ channel: "folder", folder: "", member: "k-" + hex(8) });
  const folderNamed = refusedBy({ channel: "folder", folder: path.join(lab, "share"), member: "k-" + hex(8) });
  const noMember = refusedBy({ channel: "relay", relay: { rt: "9d".repeat(16), url: Relay.RELAY_URL }, member: "studio-" + hex(8) });
  const noRelay = refusedBy({ channel: "relay", relay: { rt: "nope", url: "http://x" }, member: "k-" + hex(8) });
  const nothing = !K.followingOf(tf, vault);
  const row = { team, channel: "folder", folder: path.join(lab, "share"), member: "k-" + hex(8), leadName: "", lead: sealed.lead, chain: [], keys: {} };
  const other = M.followFromBackup(tf, vault, row, "k-" + hex(8));
  check(emptyFolder && folderNamed && noMember && noRelay && nothing && other === false,
    "962s7r a record for a shared folder is not made, empty or named " + (emptyFolder && folderNamed) + " (was: an empty folder was refused), a member id that is no member key's " + noMember
    + ", a relay team with no relay " + noRelay + ", and nothing is kept " + nothing
    + "; a restored record naming another member is not kept " + (other === false));
};

/* A stub relay. `mode` "lapsed" answers every session and later call 403 team-lapsed, with a lapse object on the body.
   `mode` "told" opens a session that carries the dates, and lists nothing. `until` falls just after local midnight, so
   its local day is ahead of UTC's. */
function lapseRelay(mode) {
  const until = new Date(2026, 10, 15, 0, 5, 0).getTime(), readOnly = Date.UTC(2026, 10, 20), swept = Date.UTC(2027, 0, 15);
  const lapse = { state: "lapsed", until, readOnly, swept };
  const told = { state: "read-only", until, readOnly, swept };
  const calls = [];
  const request = async (method, url) => {
    const u = String(url || "");
    calls.push(u);
    const json = (status, body, header) => ({ status, bytes: Buffer.from(JSON.stringify(body)), header: header || (() => null) });
    if (u.endsWith("/hello")) return json(200, { challenge: "ab".repeat(16), until: Date.now() + 5 * 60 * 1000 });
    if (mode.now === "told" && u.endsWith("/session")) return json(200, { session: "cd".repeat(32), lapse: told });
    if (mode.now === "told" && u.indexOf("/since/") >= 0) {
      return json(200, [], (name) => name === "etiuda-lapse"
        ? Buffer.from(JSON.stringify(told), "utf8").toString("base64url") : null);
    }
    return json(403, { error: "team-lapsed", said: "This team's relay is waiting for its renewal, so that was not done.", lapse });
  };
  return { until, readOnly, swept, calls, request };
}
/* A stand-in answers at the relay's own address: a followed record names only a relay this build knows (skr2 to skr5). */
async function followedRelay(name, relay) {
  const lab = labDir(name), o = await office(lab);
  const me = M.ensureMember(o.memberFile, o.vault, { signingPublic: o.open.public });
  const lead = keyPair(false), team = "t-" + hex(8), rt = Relay.relayId();
  K.keepFollowing(o.tf, o.vault, team, { channel: "relay", relay: { rt, url: Relay.RELAY_URL }, member: me.id, leadName: "Central lead" },
    { lead: { keyId: lead.keyId, public: lead.pub }, chain: [], keys: { 1: hex(32) } });
  const run = M.startFollow({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, seat: memberSeat(o.memberFile), signingPublic: o.open.public,
    request: relay.request, pollMs: 1e9, watch: false });
  return { o, team, run };
}
function followPaint(view, lang) {
  const P = loadPage(lang ? { uiLang: lang } : {});
  P.page.S.screen = "settings";
  P.page.S.sx = { sec: "teams", q: "" };
  P.page.S.follow = view;
  P.node("#main").innerHTML = P.page.settingsPageHtml();
  return String(P.node("#main").innerHTML).replace(/&#39;/g, "'");
}

LEGS["974c17"] = async () => {
  const day = (ms) => localDay(new Date(ms));
  const joiningRelay = lapseRelay({ now: "lapsed" });
  const joining = await followedRelay("follow-974c17-join", joiningRelay);
  let view = null;
  try {
    await kicks(joining.run, 1);
    const before = joiningRelay.calls.length;
    await kicks(joining.run, 1);
    view = M.followView(joining.o.tf, joining.o.vault);
    const state = K.followingOf(joining.o.tf, joining.o.vault);
    const html = view ? followPaint(view, "") : "";
    const htmlPl = view ? followPaint(view, "pl") : "";
    const waited = html.indexOf("This Studio waits for the team's lead to renew the relay licence.") >= 0
      && html.indexOf("Waiting for the team's lead to let this Studio in") < 0;
    const waitedPl = htmlPl.indexOf("To Studio czeka, aż lider zespołu odnowi licencję przekaźnika.") >= 0
      && htmlPl.indexOf("Oczekiwanie na przyjęcie przez lidera zespołu") < 0;
    process.stdout.write("       joining lapse " + JSON.stringify(view && view.lapse) + " state " + (state && state.state)
      + " calls " + before + " then " + joiningRelay.calls.length + " waited " + waited + " pl " + waitedPl + "\n");
    check(!!view && !!view.lapse && view.lapse.step === "lapsed" && view.lapse.until == null && view.lapse.readOnly == null
      && view.lapse.swept == null && state && state.state === "joining" && joiningRelay.calls.length > before && waited && waitedPl,
      "974c17 joining during a lapse: followView step " + (view && view.lapse && view.lapse.step) + " dates "
      + JSON.stringify(view && view.lapse && { until: view.lapse.until, readOnly: view.lapse.readOnly, swept: view.lapse.swept })
      + ", record " + (state && state.state) + ", still asking " + (joiningRelay.calls.length > before)
      + ", the row waits for the renewal " + waited + " / " + waitedPl);
  } finally { if (joining.run) await joining.run.stop(); }

  const mode = { now: "told" };
  const toldRelay = lapseRelay(mode);
  const told = await followedRelay("follow-974c17-told", toldRelay);
  try {
    await kicks(told.run, 1);
    K.markFollowing(told.o.tf, told.team, "following");
    const seen = M.followView(told.o.tf, told.o.vault);
    mode.now = "lapsed";
    const before = toldRelay.calls.length;
    await kicks(told.run, 1);
    const view2 = M.followView(told.o.tf, told.o.vault);
    const state = K.followingOf(told.o.tf, told.o.vault);
    const html = view2 ? followPaint(view2, "") : "";
    const htmlPl = view2 ? followPaint(view2, "pl") : "";
    const dates = !!view2 && !!view2.lapse && view2.lapse.until === toldRelay.until && view2.lapse.readOnly === toldRelay.readOnly
      && view2.lapse.swept === toldRelay.swept && view2.lapse.step === "lapsed";
    const said = html.indexOf("The relay accepts nothing from the team until its lead renews the licence, so no new edition reaches this Studio.") >= 0
      && html.indexOf("The licence ended on " + day(toldRelay.until) + ".") >= 0
      && html.indexOf("The team works as before until " + day(toldRelay.readOnly) + ".") >= 0
      && html.indexOf("The relay keeps the team's copy until " + day(toldRelay.swept) + ".") >= 0
      && html.indexOf("Waiting for the team's lead to let this Studio in") < 0
      && html.indexOf("This Studio is no longer on the team.") < 0;
    const saidPl = htmlPl.indexOf("Dopóki lider zespołu nie odnowi licencji, przekaźnik nie przyjmuje niczego od zespołu, więc do tego Studia nie dociera żadne nowe wydanie.") >= 0
      && htmlPl.indexOf("Licencja wygasła dnia " + day(toldRelay.until) + ".") >= 0
      && htmlPl.indexOf("Do dnia " + day(toldRelay.readOnly) + " zespół działa jak dotąd.") >= 0
      && htmlPl.indexOf("Przekaźnik przechowuje kopię zespołu do dnia " + day(toldRelay.swept) + ".") >= 0;
    process.stdout.write("       following first " + JSON.stringify(seen && seen.lapse) + " then " + JSON.stringify(view2 && view2.lapse)
      + " state " + (state && state.state) + " calls " + before + " then " + toldRelay.calls.length + " said " + said + " pl " + saidPl + "\n");
    check(dates && state && state.state === "following" && toldRelay.calls.length > before && said && saidPl,
      "974c17 a following lead sees the lapsed step with the dates the relay told (" + JSON.stringify(view2 && view2.lapse)
      + "), record " + (state && state.state) + ", still asking " + (toldRelay.calls.length > before)
      + ", the row names the dates and the team's lead " + said + " / " + saidPl);
  } finally { if (told.run) await told.run.stop(); }
};

/* The lead's team file turns to a second known relay while the office already follows the first, the next catalog rev goes into
   the second mirror, and each side syncs. Then a higher rev whose channel is folder enters moved with sentence 8b. */
LEGS["974c1a"] = async () => {
  const w = await followedOnRelay("follow-c1a");
  const { c, o, f } = w;
  let runner2 = null;
  try {
    const rt2 = Relay.relayId();
    const ud2 = path.join(w.lab, "central-2"), tf2 = K.teamsFile(ud2), vault2 = makeVault();
    fs.mkdirSync(ud2, { recursive: true });
    K.keepTeamKey(tf2, vault2, c.teamId, 1, c.teamKey);
    const mirror2 = K.keepRelay(tf2, c.teamId, rt2, Relay.RELAY_URL);
    fs.mkdirSync(mirror2, { recursive: true });
    const held0 = await heldTeam(c.mirror, { key: c.keyAt });
    const ring = (held0.team && held0.team.ring && Array.isArray(held0.team.ring.keys)) ? held0.team.ring : { format: 1, kind: "etiuda-ring", keys: [] };
    const nextTeam = (await writeTeam(mirror2, withChannel(held0.team, { kind: "relay", rt: rt2, url: Relay.RELAY_URL }, ring), { key: c.keyAt, passphrase: PASS })).team;
    put(mirror2, "harbour-lamps.ec", await edition(c.open, c.teamId, 1, c.teamKey, "harbour-lamps", 2));
    const leadT2 = w.world.transport("central-2");
    runner2 = Relay.relayRunner({ roots: GRANT_ROOTS, teamsFile: tf2, vault: vault2, keyFile: c.keyAt, secret: () => PASS,
      request: leadT2.request, connect: leadT2.connect, watch: false, pollMs: 1e9, say: () => {} });
    await runner2.sync();
    await runner2.idle();
    fs.copyFileSync(path.join(mirror2, "etiuda-team.json"), path.join(f.mirror, "etiuda-team.json"));
    f.heed();
    await f.idle();
    for (let i = 0; i < 3; i++) { await kicks(f, 2); }
    const view = M.followView(o.tf, o.vault);
    const rev = view && (view.catalogs || []).find((x) => x.catalog === "harbour-lamps");
    const reached = !!(view && view.channel === "relay" && rev && rev.rev === 2);
    const rec = K.followingOf(o.tf, o.vault);
    check(reached && !!rec && rec.relay && rec.relay.rt === rt2,
      "974c1a after the team file names a second relay, a published rev+1 and sync reach that rev on the second relay: state "
      + (view && view.state) + ", channel " + (view && view.channel) + ", catalog rev " + (rev && rev.rev)
      + ", team rev " + (nextTeam && nextTeam.rev) + ", rt matched " + !!(rec && rec.relay && rec.relay.rt === rt2));

    let movedState = "", movedErr = "";
    try {
      await f.stop();
      const side = path.join(w.lab, "side-folder");
      fs.mkdirSync(side, { recursive: true });
      const held = await heldTeam(mirror2, { key: c.keyAt });
      await writeTeam(side, withChannel(held.team, { kind: "folder" }), { key: c.keyAt, passphrase: PASS });
      fs.copyFileSync(path.join(side, "etiuda-team.json"), path.join(M.followMirror(o.tf, c.teamId), "etiuda-team.json"));
      const me = M.openMember(o.memberFile, o.vault, { signingPublic: o.open.public });
      movedState = M.heed(o.tf, o.vault, me);
    } catch (e) { movedErr = String(e && e.message || e); }
    const after = M.followView(o.tf, o.vault);
    const shown = after && after.state === "moved" ? after : { team: c.teamId, channel: "relay", leadName: "Central lead", state: "moved", catalogs: [] };
    const en = paintFollow(shown);
    const pl = paintFollow(shown, "pl");
    const words = en.includes("Central lead's team now works through a shared folder, which Etiuda Studio does not follow: this Studio keeps what it has, and nothing new arrives until a new invitation from the team's lead.")
      && pl.includes("Zespół osoby Central lead korzysta teraz ze wspólnego folderu, którego Etiuda Studio nie obsługuje: to Studio zachowuje to, co ma, i nic nowego nie dotrze do czasu nowego zaproszenia od lidera zespołu.");
    check(movedState === "moved" && after && after.state === "moved" && words,
      "974c1a a higher rev whose channel is the folder leaves following and the page names the move: heed " + movedState
      + ", state " + (after && after.state) + ", page " + words + (movedErr ? ", " + movedErr : ""));
  } finally {
    try { await f.stop(); } catch { /* already down */ }
    try { await c.runner.stop(); } catch { /* already down */ }
    try { if (runner2) await runner2.stop(); } catch { /* already down */ }
  }
};

/* A relay join the lead refuses. The request lands as 962s7br lands one, then the lead answers refused and the office syncs. */
LEGS["974c1b"] = async () => {
  const world = await relayWorld(), lab = labDir("follow-c1b");
  const c = await centralRelay(world, lab), o = await office(lab);
  const box = Relay.leadOpened(c.keyAt, PASS).box.public;
  const secret = newSecret(), ri = Relay.relayInvite(secret);
  const made = makeInvite({ team: c.teamId, folder: c.mirror, lead: { keyId: c.open.keyId, public: c.open.public, box } }, "Central lead", secret, Date.now(),
    undefined, { rt: c.rt, url: Relay.RELAY_URL, token: ri.token, inv: ri.inv });
  K.keepInvite(c.tf, c.vault, c.teamId, { id: made.id, secret, made: made.made, expires: made.expires, name: made.name, relay: ri });
  await c.runner.sync();
  await c.runner.idle();
  const joined = M.joinTeam({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, text: made.link, name: "Office Studio", signingPublic: o.open.public });
  const t = world.transport("office");
  const f = M.startFollow({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, seat: memberSeat(o.memberFile), signingPublic: o.open.public,
    request: t.request, connect: t.connect, pollMs: 1e9, watch: false });
  try {
    await kicks(f, 3);
    await c.runner.sync();
    await c.runner.idle();
    const refused = await Relay.answerJoin(c.runner, { teamsFile: c.tf, vault: c.vault, team: c.teamId, folder: c.mirror, desk: joined.member, answer: "refused" });
    await kicks(f, 2);
    const view = M.followView(o.tf, o.vault);
    const en = paintFollow(view);
    const pl = paintFollow(view, "pl");
    const said = en.includes("The team's lead turned down this Studio's request to join.")
      && pl.includes("Prośba tego Studia o dołączenie została odrzucona przez lidera zespołu.");
    const leave = en.includes("Leave the team") && pl.includes("Opuść zespół");
    check(f.answer() === "refused" && view && view.state === "refused" && view.state !== "joining" && said && leave && refused && refused.ok === true,
      "974c1b a refused following Studio leaves joining and the page says refused: answer " + f.answer()
      + ", state " + (view && view.state) + ", lead answer " + (refused && (refused.ok ? "ok" : refused.reason || "no"))
      + ", page " + said + ", leave " + leave);
  } finally {
    try { await f.stop(); } catch { /* already down */ }
    try { await c.runner.stop(); } catch { /* already down */ }
  }
};

/* An in-use update owed to the first relay at the moment of a switch to a second relay settles before the switch stops the first channel. */
LEGS["974c1c"] = async () => {
  const w = await followedOnRelay("follow-c1c");
  const { c, o, f, joined } = w;
  try {
    M.writeInUse({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, signingPublic: o.open.public,
      catalog: { id: "harbour-lamps", rev: 1, sha256: "sha256:" + hex(32) } });
    const held = (await heldTeam(c.mirror, { key: c.keyAt })).team;
    const ring = held.ring || { format: 1, kind: "etiuda-ring", keys: [] };
    const rt2 = Relay.relayId();
    const side = path.join(w.lab, "side-c1c");
    fs.mkdirSync(side, { recursive: true });
    await writeTeam(side, withChannel(held, { kind: "relay", rt: rt2, url: Relay.RELAY_URL }, ring), { key: c.keyAt, passphrase: PASS });
    fs.copyFileSync(path.join(side, "etiuda-team.json"), path.join(f.mirror, "etiuda-team.json"));
    f.heed();
    await f.idle();
    await c.runner.sync();
    await c.runner.idle();
    const inUseThere = fs.existsSync(path.join(c.mirror, "desks", joined.member, "in-use.ec"));
    const rec = K.followingOf(o.tf, o.vault);
    check(inUseThere && !!rec && rec.relay && rec.relay.rt === rt2,
      "974c1c an in-use update owed to the first relay at the moment of a switch settles before the switch: in-use reached first relay "
      + inUseThere + ", retargeted " + !!(rec && rec.relay && rec.relay.rt === rt2));
  } finally {
    try { await f.stop(); } catch { /* already down */ }
    try { await c.runner.stop(); } catch { /* already down */ }
  }
};

/* An admission reaches an open Settings row without navigation (board 974, C1 (c)). */
LEGS["974c1d"] = async () => {
  const world = await relayWorld(), lab = labDir("follow-c1d");
  const c = await centralRelay(world, lab), o = await office(lab);
  const box = Relay.leadOpened(c.keyAt, PASS).box.public;
  const secret = newSecret(), ri = Relay.relayInvite(secret);
  const made = makeInvite({ team: c.teamId, folder: c.mirror, lead: { keyId: c.open.keyId, public: c.open.public, box } }, "Central lead", secret, Date.now(),
    undefined, { rt: c.rt, url: Relay.RELAY_URL, token: ri.token, inv: ri.inv });
  K.keepInvite(c.tf, c.vault, c.teamId, { id: made.id, secret, made: made.made, expires: made.expires, name: made.name, relay: ri });
  await c.runner.sync(); await c.runner.idle();
  M.joinTeam({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, text: made.link, name: "Office Studio", signingPublic: o.open.public });
  const states = [];
  const t = world.transport("office");
  const f = M.startFollow({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, seat: memberSeat(o.memberFile), signingPublic: o.open.public,
    request: t.request, connect: t.connect, useWorker: false, pollMs: 1e9, watch: false, onState: (s) => { states.push(s); } });
  try {
    await kicks(f, 3);
    await c.runner.sync(); await c.runner.idle();
    let signingAsked = 0, heard = 0;
    const P = loadPage({ api: {
      teams: () => Promise.resolve({ teams: [] }),
      projects: () => Promise.resolve({ root: "C:\\Projects", projects: [] }),
      followState: () => Promise.resolve({ follow: M.followView(o.tf, o.vault) }),
      signing: () => { signingAsked++; return Promise.resolve({ signing: null }); },
      onFollowChanged: () => { heard++; },
    } });
    P.page.S.screen = "settings";
    P.page.S.sx = { sec: "teams", q: "" };
    P.page.S.follow = M.followView(o.tf, o.vault);
    P.node("#main").innerHTML = P.page.settingsPageHtml();
    const WAITING = "Waiting for the team's lead to let this Studio in";
    const waitedBefore = String(P.node("#main").innerHTML).replace(/&#39;/g, "'").indexOf(WAITING) >= 0;
    const S = await import("../src/studio.mjs");
    const r = await S.watchAdmit(c.mirror, c.keyAt, PASS, { auto: false, teamKeys: K.teamKeysOf(c.tf, c.vault), invites: K.inviteBookOf(c.tf, c.vault), teamsFile: c.tf });
    for (const x of r.spent || []) K.endInvite(c.tf, c.teamId, x.invite, "spent", x.desk);
    await Relay.answerAdmitted(c.runner, { teamsFile: c.tf, vault: c.vault, team: c.teamId, folder: c.mirror, spent: r.spent });
    await kicks(f, 2);
    put(c.mirror, "harbour-lamps.ec", await edition(c.open, c.teamId, 1, c.teamKey, "harbour-lamps", 1));
    for (let i = 0; i < 3; i++) { await c.runner.sync(); await c.runner.idle(); await kicks(f, 2); }
    const turned = states.indexOf("following") >= 0;
    if (turned && typeof P.page.followChanged === "function") await P.page.followChanged();
    /* The page beside the section list is #sxPage inside #main; a paint of the whole tab lands in #main. The newer of the two. */
    const page = String(P.node("#sxPage").innerHTML || P.node("#main").innerHTML).replace(/&#39;/g, "'").split(String.fromCharCode(160)).join(" ");
    const following = page.indexOf(WAITING) < 0 && page.indexOf("harbour-lamps, rev 1") >= 0 && page.indexOf("Leave the team") >= 0
      && !!P.page.S.follow && P.page.S.follow.state === "following";
    const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
    const shell = read("shell/main.js"), preload = read("shell/preload.js"), app = read("ui/app.js");
    const starts = shell.slice(shell.indexOf("async function followStart()"), shell.indexOf("async function followStart()") + 1200);
    const signal = /\n\s*onState: \(\) => followSignal\(\),/.test(starts)
      && /function followSignal\(\) \{[\s\S]{0,200}webContents\.send\("studio:follow-changed"\)/.test(shell);
    const bridge = /onFollowChanged: \(fn\) => ipcRenderer\.on\("studio:follow-changed"/.test(preload);
    const booted = /\n\s*if \(API\.onFollowChanged\) API\.onFollowChanged\(followChanged\);/.test(app);
    check(waitedBefore && turned && following && signingAsked === 0 && signal && bridge && booted,
      "974c1d an admission reaches an open Settings row without navigation: the row waited before " + waitedBefore + "; the run's state turned "
      + JSON.stringify(states) + "; after the signal the row says following with the catalog " + following + " (state " + (P.page.S.follow && P.page.S.follow.state)
      + "), Settings opened again " + signingAsked + " times; the shell signals on onState " + signal + ", the preload hears it " + bridge
      + ", boot hands it the handler " + booted);
  } finally {
    try { await f.stop(); } catch { /* already down */ }
    try { await c.runner.stop(); } catch { /* already down */ }
  }
};

/* A relay that answers: a session opens and the since list is empty, so each cycle reaches the socket. `down` stops answering. */
function answeringRelay() {
  const calls = [], r = { calls, down: false };
  r.request = async (method, url) => {
    const u = String(url || "");
    calls.push(u);
    if (r.down) throw new Error("the stub relay does not answer");
    const json = (status, body) => ({ status, bytes: Buffer.from(JSON.stringify(body)), header: () => null });
    if (u.endsWith("/hello")) return json(200, { challenge: "ab".repeat(16), until: Date.now() + 5 * 60 * 1000 });
    if (u.endsWith("/session")) return json(200, { session: "cd".repeat(32) });
    if (u.indexOf("/since/") >= 0) return json(200, []);
    return json(404, { error: "none" });
  };
  return r;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
/* The socket does not get through on this network while the asking does (board 989): the run says not live after two
   sockets in a row closed without opening, the row says so in both languages, no socket is made for a minute while the
   asking goes on, a socket that opens ends it, and where the asking fails too it is not said. */
LEGS["989a"] = async () => {
  const lab = labDir("follow-989a"), o = await office(lab);
  const me = M.ensureMember(o.memberFile, o.vault, { signingPublic: o.open.public });
  const lead = keyPair(false), team = "t-" + hex(8), rt = Relay.relayId();
  K.keepFollowing(o.tf, o.vault, team, { channel: "relay", relay: { rt, url: Relay.RELAY_URL }, member: me.id, leadName: "Central lead" },
    { lead: { keyId: lead.keyId, public: lead.pub }, chain: [], keys: { 1: hex(32) } });
  K.markFollowing(o.tf, team, "following");
  const relay = answeringRelay(), sock = { mode: "fail", made: 0, on: null };
  let shift = 0;
  const connect = (url, headers, on) => {
    sock.made++;
    sock.on = on;
    if (sock.mode === "open") setImmediate(() => on.open());
    else setTimeout(() => on.close(), 5);
    return { send() {}, close() {} };
  };
  const run = M.startFollow({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, seat: memberSeat(o.memberFile), signingPublic: o.open.public,
    request: relay.request, connect, pollMs: 1e9, watch: false, clock: () => Date.now() + shift });
  const view = () => { const v = M.followView(o.tf, o.vault); if (v && run.notLive()) v.notLive = true; return v; };
  const LINE = "On this network the team's updates arrive about once a minute, not live.";
  const LINE_PL = "W tej sieci aktualizacje zespołu docierają mniej więcej co minutę, a nie na bieżąco.";
  const HOVER = "This network does not let the live connection to the relay through, so Studio asks the relay about once a minute instead. Nothing is lost, and nothing needs doing.";
  const HOVER_PL = "Ta sieć nie przepuszcza połączenia na żywo z przekaźnikiem, więc Studio pyta przekaźnik mniej więcej co minutę. Nic nie ginie i nic nie trzeba robić.";
  try {
    await kicks(run, 1); await wait(30);
    const afterOne = run.notLive(), oneHtml = followPaint(view(), "");
    await kicks(run, 1); await wait(30);
    const afterTwo = run.notLive(), v2 = view();
    const html = followPaint(v2, ""), htmlPl = followPaint(v2, "pl");
    const said = html.indexOf(LINE) >= 0 && html.indexOf(HOVER) >= 0 && oneHtml.indexOf(LINE) < 0;
    const saidPl = htmlPl.indexOf(LINE_PL) >= 0 && htmlPl.indexOf(HOVER_PL) >= 0;
    const madeAtTwo = sock.made, askedAtTwo = relay.calls.length;
    await kicks(run, 2); await wait(30);
    const held = sock.made === madeAtTwo && relay.calls.length > askedAtTwo && run.notLive();
    process.stdout.write("       sockets made " + madeAtTwo + " then " + sock.made + " while held, asks " + askedAtTwo + " then " + relay.calls.length
      + "; not live after one " + afterOne + ", after two " + afterTwo + "\n");
    check(!afterOne && afterTwo && v2 && v2.notLive === true && said && saidPl && held,
      "989a two sockets that close without opening while the asks are answered: not live after one " + afterOne + ", after two " + afterTwo
      + "; the row says so with its hover " + said + " / " + saidPl + "; no socket for a minute while the asking goes on " + held);
    shift = 61 * 1000; sock.mode = "open";
    await kicks(run, 1); await wait(30);
    const back = !run.notLive() && followPaint(view(), "").indexOf(LINE) < 0 && sock.made === madeAtTwo + 1;
    shift = 2 * 61 * 1000; sock.mode = "fail";
    sock.on.close(); /* the open socket drops, as a relay that restarts drops it: not a failure */
    const dropped = !run.notLive();
    for (let i = 0; i < 3; i++) { await kicks(run, 1); await wait(30); }
    const again = run.notLive();
    relay.down = true;
    await kicks(run, 1); await wait(30);
    const unreached = !run.notLive();
    check(back && dropped && again && unreached,
      "989a a socket that opens takes the line away " + back + "; an open one that drops is no failure " + dropped + "; failing again says it again " + again
      + "; where the asking fails too, not-live is not said " + unreached);
  } finally { await run.stop(); }
};

/* A socket the door would not make is no word from the server (the test architect's note on 989): an address the door does
   not admit and a runtime without WebSocket are its null, and a throw is the same. Those neither count nor clear, so no run
   of them says not live or holds the socket, and two server closes with a refusal between them are still two in a row. */
LEGS["989b"] = async () => {
  const lab = labDir("follow-989b"), o = await office(lab);
  const me = M.ensureMember(o.memberFile, o.vault, { signingPublic: o.open.public });
  const lead = keyPair(false), team = "t-" + hex(8), rt = Relay.relayId();
  K.keepFollowing(o.tf, o.vault, team, { channel: "relay", relay: { rt, url: Relay.RELAY_URL }, member: me.id, leadName: "Central lead" },
    { lead: { keyId: lead.keyId, public: lead.pub }, chain: [], keys: { 1: hex(32) } });
  K.markFollowing(o.tf, team, "following");
  const relay = answeringRelay(), sock = { mode: "refuse", made: 0 };
  const connect = (url, headers, on) => {
    sock.made++;
    if (sock.mode === "refuse") return null;
    if (sock.mode === "throw") throw new Error("the stand-in runtime has no socket");
    setTimeout(() => on.close(), 5);
    return { send() {}, close() {} };
  };
  const run = M.startFollow({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, seat: memberSeat(o.memberFile), signingPublic: o.open.public,
    request: relay.request, connect, pollMs: 1e9, watch: false });
  /* Each kick must still reach the door: a held watch answers null itself and the door's count stands still. The layer at
     the pin may call the door more than once in a cycle, so the count is read per kick, never against a fixed total. */
  let reached = true;
  const kickReached = async () => { const before = sock.made; await kicks(run, 1); await wait(30); if (sock.made <= before) reached = false; };
  try {
    for (let i = 0; i < 3; i++) await kickReached();
    const nulls = !run.notLive(), madeNulls = sock.made;
    sock.mode = "throw";
    for (let i = 0; i < 2; i++) await kickReached();
    const throws = !run.notLive(), madeThrows = sock.made;
    sock.mode = "fail"; await kicks(run, 1); await wait(30);
    sock.mode = "refuse"; await kicks(run, 1); await wait(30);
    const oneAndRefused = !run.notLive();
    sock.mode = "fail"; await kicks(run, 1); await wait(30);
    const two = run.notLive();
    process.stdout.write("       door calls " + madeNulls + " after three refusals, " + madeThrows + " after two throws, " + sock.made
      + " in all; asks " + relay.calls.length + "\n");
    check(nulls && throws && reached,
      "989b sockets the door refuses to make are no server's refusal: not live after three nulls " + !nulls + ", after two throws "
      + !throws + "; every kick still reached the door, nothing held " + reached);
    check(oneAndRefused && two,
      "989b a refusal neither counts nor clears: not live after a close and a refusal " + !oneAndRefused + ", after the second close " + two);
  } finally { await run.stop(); }
};

/* ---- A RELAY THIS BUILD DOES NOT KNOW (Claude alpha's decision of 2026-11-17 20:33, the desk's rule mirrored) ------------
   src/relay-known.mjs judges an address on its string: the relay this build reaches (Relay.RELAY_URL, which is what the lab's
   transport answers at) and, in a test service build alone, staging's. Anything else reaching Studio from outside is not
   followed. ELSEWHERE is a host this lab has no relay at: the lab's own fetch records any call to it (world.foreign), and each
   leg records every address the office's run is handed before the lab sees it. */
const ELSEWHERE_HOST = "relay.example.invalid";
const ELSEWHERE = "https://" + ELSEWHERE_HOST + "/relay/v1";
const SKR_EN = "The team file of {TEAM} names a relay this Etiuda Studio does not use, so this Studio does not follow it: it keeps the team, its catalogs and its connection as they were, and sends nothing there. If the team moves back, nothing is needed; otherwise a new invitation from the team's lead is.";
const SKR_PL = "{TEAM} wskazuje w swoim pliku przekaźnik, z którego to Etiuda Studio nie korzysta, więc to Studio za nim nie podąża: zachowuje zespół, katalogi i połączenie bez zmian i niczego tam nie wysyła. Jeśli zespół wróci na poprzedni przekaźnik, nic nie trzeba robić; w przeciwnym razie potrzebne jest nowe zaproszenie od lidera zespołu.";
const timesIn = (html, s) => html.split(s).length - 1;
/* The row says it once in each language, {TEAM} filled as the desk fills it, and never names the address. */
function skrRow(view, lead) {
  const en = view ? followPaint(view, "") : "", pl = view ? followPaint(view, "pl") : "";
  const said = timesIn(en, SKR_EN.replace("{TEAM}", lead + "'s team")) === 1, saidPl = timesIn(pl, SKR_PL.replace("{TEAM}", "Zespół osoby " + lead)) === 1;
  return { said, saidPl, hidden: en.indexOf(ELSEWHERE_HOST) < 0 && pl.indexOf(ELSEWHERE_HOST) < 0, none: en.indexOf(SKR_EN.slice(30, 90)) < 0 };
}
/* Every address the office's run is handed, recorded before the transport `t` sees it. */
function recording(t) {
  const urls = [];
  return { urls, request: (m, u, h, b) => { urls.push(String(u)); return t.request(m, u, h, b); },
    connect: (u, h, on) => { urls.push(String(u)); return t.connect(u, h, on); } };
}
const atRelay = (u) => String(u).indexOf(Relay.RELAY_URL + "/") === 0 || String(u).indexOf("wss://" + Relay.RELAY_URL.slice("https://".length) + "/") === 0;
const shaOf = (f) => { try { return crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex"); } catch { return "none"; } };
/* An office following the central's relay team, admitted, holding the key and the edition, as 962s7br brings it there, its run's
   every address recorded. */
async function followedOnRelay(name) {
  const world = await relayWorld(), lab = labDir(name);
  const c = await centralRelay(world, lab), o = await office(lab);
  const box = Relay.leadOpened(c.keyAt, PASS).box.public;
  const secret = newSecret(), ri = Relay.relayInvite(secret);
  const made = makeInvite({ team: c.teamId, folder: c.mirror, lead: { keyId: c.open.keyId, public: c.open.public, box } }, "Central lead", secret, Date.now(),
    undefined, { rt: c.rt, url: Relay.RELAY_URL, token: ri.token, inv: ri.inv });
  K.keepInvite(c.tf, c.vault, c.teamId, { id: made.id, secret, made: made.made, expires: made.expires, name: made.name, relay: ri });
  await c.runner.sync(); await c.runner.idle();
  const joined = M.joinTeam({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, text: made.link, name: "Office Studio", signingPublic: o.open.public });
  const sent = recording(world.transport("office"));
  const f = M.startFollow({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, seat: memberSeat(o.memberFile), signingPublic: o.open.public, request: sent.request, connect: sent.connect,
    pollMs: 1e9, watch: false });
  await kicks(f, 3);
  await c.runner.sync(); await c.runner.idle();
  const S = await import("../src/studio.mjs");
  const r = await S.watchAdmit(c.mirror, c.keyAt, PASS, { auto: false, teamKeys: K.teamKeysOf(c.tf, c.vault), invites: K.inviteBookOf(c.tf, c.vault), teamsFile: c.tf });
  for (const x of r.spent || []) K.endInvite(c.tf, c.teamId, x.invite, "spent", x.desk);
  await Relay.answerAdmitted(c.runner, { teamsFile: c.tf, vault: c.vault, team: c.teamId, folder: c.mirror, spent: r.spent });
  await kicks(f, 2);
  put(c.mirror, "harbour-lamps.ec", await edition(c.open, c.teamId, 1, c.teamKey, "harbour-lamps", 1));
  for (let i = 0; i < 3; i++) { await c.runner.sync(); await c.runner.idle(); await kicks(f, 2); }
  return { world, lab, c, o, joined, f, sent };
}
/* The lead's next team file, `channel` its channel, written into `dir` (the lead's own mirror, which its runner sends, or a folder
   beside it); answers the team as written. Where the office's mirror does not hold that rev after `rounds` of syncs, it is put
   there as the channel would put it, and heeded. */
async function leadWrites(w, from, channel, dir, rounds) {
  fs.mkdirSync(dir, { recursive: true });
  const t = (await writeTeam(dir, withChannel(from, channel), { key: w.c.keyAt, passphrase: PASS })).team;
  for (let i = 0; i < rounds; i++) { await w.c.runner.sync(); await w.c.runner.idle(); await kicks(w.f, 2); }
  const there = readJson(path.join(w.f.mirror, "etiuda-team.json"));
  const landed = !!there && there.rev === t.rev && JSON.stringify(there.channel) === JSON.stringify(t.channel);
  if (!landed) { fs.copyFileSync(path.join(dir, "etiuda-team.json"), path.join(w.f.mirror, "etiuda-team.json")); w.f.heed(); await w.f.idle(); }
  return { team: t, landed };
}

/* skr1: the followed team's genuine file names a relay this build does not know, first under the same relay team id, sent through
   the relay the office follows it on, then under another, put in the mirror and heeded. Nothing is sent there, the record stays
   byte for byte, the catalogs and the channel stay, and the row says so once; a later file naming the known relay is followed. */
LEGS["skr1"] = async () => {
  const w = await followedOnRelay("follow-skr1");
  const { c, o, f, sent } = w;
  try {
    const fo = K.followingOf(o.tf, o.vault);
    const ready = !!fo && fo.state === "following" && fo.channel === "relay" && M.followedEditions(o.tf, o.vault).length === 1;
    const before = shaOf(o.tf), run = f.run, cats = JSON.stringify((M.followView(o.tf, o.vault) || {}).catalogs), asked = sent.urls.length;
    const held = (await heldTeam(c.mirror, { key: c.keyAt })).team;
    const a = await leadWrites(w, held, { kind: "relay", rt: c.rt, url: ELSEWHERE }, c.mirror, 2);
    const b = await leadWrites(w, a.team, { kind: "relay", rt: Relay.relayId(), url: ELSEWHERE }, path.join(w.lab, "side-skr1-b"), 0);
    await kicks(f, 2);
    const view = M.followView(o.tf, o.vault), row = skrRow(view, "Central lead");
    const same = shaOf(o.tf) === before;
    const kept = !!view && view.state === "following" && view.channel === "relay" && JSON.stringify(view.catalogs) === cats && view.elsewhere === true;
    const conn = f.run === run && !!run && f.channel === "relay" && sent.urls.length > asked;
    const nothing = sent.urls.length > 0 && sent.urls.every(atRelay) && !sent.urls.some((u) => u.indexOf(ELSEWHERE_HOST) >= 0) && w.world.foreign.length === 0;
    process.stdout.write("       through the relay " + a.landed + "; addresses " + sent.urls.length + " (" + (sent.urls.length - asked) + " since the file), "
      + sent.urls.filter((u) => !atRelay(u)).length + " not the relay's, foreign " + w.world.foreign.length + "\n");
    check(ready && same && kept && conn && nothing && row.said && row.saidPl && row.hidden,
      "skr1 a genuine team file naming a relay this build does not know moves nothing: following first " + ready + "; the record byte for byte " + same
      + "; state, channel and catalogs as they were, the view saying elsewhere " + kept + "; the same channel, still asking the relay " + conn
      + "; nothing handed for another address, none sent to one " + nothing + "; the row says it once " + row.said + " / " + row.saidPl
      + ", the address shown nowhere " + row.hidden);
    /* The control: the next file names the known relay again, the same relay team id through the relay, then another put in the mirror. */
    const back = await leadWrites(w, b.team, { kind: "relay", rt: c.rt, url: Relay.RELAY_URL }, c.mirror, 2);
    const viewBack = M.followView(o.tf, o.vault), rowBack = skrRow(viewBack, "Central lead");
    const rt2 = Relay.relayId();
    await leadWrites(w, back.team, { kind: "relay", rt: rt2, url: Relay.RELAY_URL }, path.join(w.lab, "side-skr1-d"), 0);
    const rec = K.followingOf(o.tf, o.vault);
    const followed = !!rec && !!rec.relay && rec.relay.rt === rt2 && rec.relay.url === Relay.RELAY_URL;
    check(!!viewBack && viewBack.state === "following" && !viewBack.elsewhere && rowBack.none && followed,
      "skr1 a later file naming the known relay is followed with nothing asked: state " + (viewBack && viewBack.state) + ", the line gone "
      + (!!viewBack && !viewBack.elsewhere && rowBack.none) + "; another relay team id there retargets the record " + followed);
  } finally {
    try { await f.stop(); } catch { /* already down */ }
    try { await c.runner.stop(); } catch { /* already down */ }
  }
};

/* A followed relay record, following, at the known relay, its key number 1 kept. */
async function followedRecord(name) {
  const lab = labDir(name), o = await office(lab);
  const me = M.ensureMember(o.memberFile, o.vault, { signingPublic: o.open.public });
  const lead = keyPair(false), team = "t-" + hex(8), rt = Relay.relayId();
  K.keepFollowing(o.tf, o.vault, team, { channel: "relay", relay: { rt, url: Relay.RELAY_URL }, member: me.id, leadName: "Central lead" },
    { lead: { keyId: lead.keyId, public: lead.pub }, chain: [], keys: { 1: hex(32) } });
  K.markFollowing(o.tf, team, "following");
  return { lab, o, team, rt };
}
/* The plain record pointed at `url` (and `rt`, where given) as an older build, or a hand, would leave it: the seal holds only the
   pin and the keys, so the store reads the address as written. */
function recordPointed(tf, team, url, rt) {
  const doc = JSON.parse(fs.readFileSync(tf, "utf8"));
  doc.following[team].relay = { rt: rt || doc.following[team].relay.rt, url };
  fs.writeFileSync(tf, JSON.stringify(doc, null, 1) + "\n");
}
const closingSocket = (u, h, on) => { setTimeout(() => on.close(), 5); return { send() {}, close() {} }; };

/* skr2: a record already on disk naming a relay this build does not know opens no channel and calls nothing, and the row says it. */
LEGS["skr2"] = async () => {
  const { o, team } = await followedRecord("follow-skr2");
  recordPointed(o.tf, team, ELSEWHERE);
  const before = shaOf(o.tf);
  const relay = answeringRelay(), sent = recording({ request: relay.request, connect: closingSocket });
  const run = M.startFollow({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, seat: memberSeat(o.memberFile), signingPublic: o.open.public,
    request: sent.request, connect: sent.connect, pollMs: 1e9, watch: false });
  try {
    await kicks(run, 3); await wait(30);
    const view = M.followView(o.tf, o.vault), row = skrRow(view, "Central lead");
    const none = !!run && run.run === null && sent.urls.length === 0 && relay.calls.length === 0;
    check(none && shaOf(o.tf) === before && !!view && view.state === "following" && view.elsewhere === true && row.said && row.saidPl && row.hidden,
      "skr2 a record on disk naming a relay this build does not know opens nothing: no channel " + (!!run && run.run === null) + ", addresses handed "
      + sent.urls.length + ", calls " + relay.calls.length + "; the record byte for byte " + (shaOf(o.tf) === before) + "; the row says it "
      + row.said + " / " + row.saidPl + ", the address shown nowhere " + row.hidden);
  } finally { await run.stop(); }
};

/* skr3: a record edited to another relay while its run is live keeps the channel it has, which a switch would stop. */
LEGS["skr3"] = async () => {
  const { o, team, rt } = await followedRecord("follow-skr3");
  const relay = answeringRelay(), sent = recording({ request: relay.request, connect: closingSocket });
  const run = M.startFollow({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, seat: memberSeat(o.memberFile), signingPublic: o.open.public,
    request: sent.request, connect: sent.connect, pollMs: 1e9, watch: false });
  try {
    await kicks(run, 1); await wait(30);
    const live = run.run, asked = sent.urls.length;
    recordPointed(o.tf, team, ELSEWHERE, Relay.relayId());
    run.heed(); await run.idle();
    await kicks(run, 1); await wait(30);
    const kept = !!live && run.run === live && sent.urls.length > asked && sent.urls.every(atRelay)
      && sent.urls.slice(asked).every((u) => u.indexOf(rt) >= 0 || !/\/t\/[0-9a-f]{32}/.test(u));
    check(kept, "skr3 a record pointed elsewhere while its run is live keeps the channel it had: the same channel " + (!!live && run.run === live)
      + ", still asking the relay " + (sent.urls.length > asked) + ", nothing handed for another address " + sent.urls.every(atRelay));
  } finally { await run.stop(); }
};

/* skr4: retargetFollowing alone refuses every address this build does not know, the string judged as given, and leaves the
   record byte for byte; the known relay, with or without its trailing slash, is taken. */
LEGS["skr4"] = async () => {
  const lab = labDir("follow-skr4"), ud = path.join(lab, "office");
  fs.mkdirSync(ud, { recursive: true });
  const tf = K.teamsFile(ud), vault = makeVault(), lead = keyPair(false), team = "t-" + hex(8);
  K.keepFollowing(tf, vault, team, { channel: "relay", relay: { rt: Relay.relayId(), url: Relay.RELAY_URL }, member: "k-" + hex(8), leadName: "Central lead" },
    { lead: { keyId: lead.keyId, public: lead.pub }, chain: [], keys: {} });
  const host = new URL(Relay.RELAY_URL + "/").host;
  const forms = [ELSEWHERE, "https://etiuda.dev/relay-staging/v1", Relay.RELAY_URL.replace(/\/v1$/, "/x/../v1"),
    Relay.RELAY_URL.replace("://" + host, "://" + host.toUpperCase()), Relay.RELAY_URL.replace("://" + host, "://" + host + ":443")]
    .filter((u) => u.replace(/\/$/, "") !== Relay.RELAY_URL);
  const refused = forms.map((url) => {
    const before = shaOf(tf), r = K.retargetFollowing(tf, team, { channel: "relay", relay: { rt: Relay.relayId(), url } });
    return r === false && shaOf(tf) === before;
  });
  const rtA = Relay.relayId(), rtB = Relay.relayId();
  const slash = K.retargetFollowing(tf, team, { channel: "relay", relay: { rt: rtA, url: Relay.RELAY_URL + "/" } }) === true && K.followingOf(tf, vault).relay.rt === rtA;
  const exact = K.retargetFollowing(tf, team, { channel: "relay", relay: { rt: rtB, url: Relay.RELAY_URL } }) === true && K.followingOf(tf, vault).relay.rt === rtB;
  check(forms.length >= 4 && refused.every(Boolean) && slash && exact,
    "skr4 retargetFollowing alone refuses each of " + forms.length + " addresses this build does not know (another host, staging's in an ordinary build,"
    + " a dot segment, the host in capitals, the default port), the record byte for byte: " + JSON.stringify(refused) + "; the known relay is taken with its"
    + " trailing slash " + slash + " and without " + exact);
};

/* skr5: keepFollowing refuses a record naming a relay this build does not know and writes nothing; a backup copy's followed team
   at such a relay is not restored. The known relay is kept, both ways (the control). */
LEGS["skr5"] = async () => {
  const lab = labDir("follow-skr5"), lead = keyPair(false);
  const place = (name) => { const ud = path.join(lab, name); fs.mkdirSync(ud, { recursive: true }); return { tf: K.teamsFile(ud), vault: makeVault() }; };
  const sealed = { lead: { keyId: lead.keyId, public: lead.pub }, chain: [], keys: {} };
  const kept = (p, url) => { try { K.keepFollowing(p.tf, p.vault, "t-" + hex(8), { channel: "relay", relay: { rt: Relay.relayId(), url }, member: "k-" + hex(8), leadName: "" }, sealed); return true; } catch { return false; } };
  const a = place("keep-elsewhere"), b = place("keep-known");
  const keepRefused = !kept(a, ELSEWHERE) && !fs.existsSync(a.tf);
  const keepKnown = kept(b, Relay.RELAY_URL) && !!K.followingOf(b.tf, b.vault);
  const member = "k-" + hex(8);
  const row = (url) => ({ team: "t-" + hex(8), channel: "relay", folder: null, relay: { rt: Relay.relayId(), url }, member, leadName: "Central lead",
    lead: sealed.lead, chain: [], keys: { 1: hex(32) } });
  const c = place("backup-elsewhere"), d = place("backup-known");
  const backRefused = M.followFromBackup(c.tf, c.vault, row(ELSEWHERE), member) === false && !K.followingOf(c.tf, c.vault);
  const backKnown = M.followFromBackup(d.tf, d.vault, row(Relay.RELAY_URL), member) === true && K.followingOf(d.tf, d.vault).relay.url === Relay.RELAY_URL;
  check(keepRefused && keepKnown && backRefused && backKnown,
    "skr5 a followed record naming a relay this build does not know is refused and nothing written " + keepRefused + ", and a backup copy's is not restored "
    + backRefused + "; the known relay is kept " + keepKnown + " and restored " + backKnown);
};

/* skr6: an invitation naming a relay this build does not know is one Studio cannot read: refused in the sentence for that, no
   member key made, nothing written. The same lead's invitation at the known relay joins (the control). */
LEGS["skr6"] = async () => {
  const world = await relayWorld(), lab = labDir("follow-skr6");
  const c = await centralRelay(world, lab), o = await office(lab);
  try {
    const box = Relay.leadOpened(c.keyAt, PASS).box.public;
    const inviteAt = (url) => {
      const secret = newSecret(), ri = Relay.relayInvite(secret);
      return makeInvite({ team: c.teamId, folder: c.mirror, lead: { keyId: c.open.keyId, public: c.open.public, box } }, "Central lead", secret, Date.now(),
        undefined, { rt: c.rt, url, token: ri.token, inv: ri.inv });
    };
    const elsewhere = inviteAt(ELSEWHERE);
    let said = "";
    try { M.joinTeam({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, text: elsewhere.link, name: "Office Studio", signingPublic: o.open.public }); said = "joined"; }
    catch (e) { said = e && e.said ? e.said.frame : "threw: " + String(e && e.message || e); }
    const nothing = !fs.existsSync(o.tf) && !fs.existsSync(o.memberFile) && !fs.existsSync(path.join(o.ud, "following"));
    const refusedRight = said === M.MEMBER_SAID.unread;
    let joined = null;
    try { joined = M.joinTeam({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, text: inviteAt(Relay.RELAY_URL).link, name: "Office Studio", signingPublic: o.open.public }); }
    catch { joined = null; }
    const rec = K.followingOf(o.tf, o.vault);
    const control = !!joined && !!rec && rec.channel === "relay" && rec.relay.url === Relay.RELAY_URL;
    check(refusedRight && nothing && control,
      "skr6 an invitation naming a relay this build does not know is refused as one Studio cannot read " + refusedRight + " (" + said + "), with no"
      + " member key made and nothing written " + nothing + "; the same lead's invitation at the known relay joins " + control);
  } finally { try { await c.runner.stop(); } catch { /* already down */ } }
};

/* as4-8a: a record following through a folder (channel: "folder", made by an older Studio) reads nothing under its folder,
   writes nothing anywhere (teams.json byte for byte, folder listing and times untouched), keeps its catalogs, and shows
   sentence 8a once in English and Polish. */
LEGS["as4-8a"] = async () => {
  const lab = labDir("follow-as4-8a"), o = await office(lab);
  const c = await centralFolder(lab);
  const me = M.ensureMember(o.memberFile, o.vault, { signingPublic: o.open.public });
  const teamKey = c.teamKey;
  seedFolderFollowed(o.tf, o.vault, c.teamId, { channel: "folder", folder: c.share, member: me.id, leadName: "Central lead" },
    { lead: { keyId: c.open.keyId, public: c.open.public }, chain: [], keys: { 1: teamKey.toString("hex") } });
  K.markFollowing(o.tf, c.teamId, "following");
  const mirror = M.followMirror(o.tf, c.teamId);
  fs.mkdirSync(mirror, { recursive: true });
  put(mirror, "harbour-lamps.ec", await edition(c.open, c.teamId, 1, teamKey, "harbour-lamps", 1));
  /* The mirror also holds the lead's genuine team file naming a known relay: an older build would have moved this record onto the
     relay at its next read; now nothing reads it. */
  const held = (await heldTeam(c.share, { key: c.keyAt })).team;
  await writeTeam(mirror, withChannel(held, { kind: "relay", rt: hex(16), url: Relay.RELAY_URL }, { format: 1, kind: "etiuda-ring", keys: [] }),
    { key: c.keyAt, passphrase: PASS });
  put(c.share, "extra.txt", "keep\n");
  const tfBefore = shaOf(o.tf);
  const shareBefore = treeOf(c.share);
  const mirrorBefore = treeOf(mirror);
  const mtimeBefore = fs.statSync(path.join(c.share, "extra.txt")).mtimeMs;
  const underShare = path.resolve(c.share).toLowerCase();
  const folderReads = [], writesAnywhere = [];
  const tapped = ["readFileSync", "readdirSync", "openSync", "statSync", "lstatSync", "readFile", "readdir", "opendirSync",
    "writeFileSync", "appendFileSync", "mkdirSync", "rmSync", "unlinkSync", "renameSync", "copyFileSync"];
  const writeSet = new Set(["writeFileSync", "appendFileSync", "mkdirSync", "rmSync", "unlinkSync", "renameSync", "copyFileSync"]);
  const kept = {};
  for (const n of tapped) {
    kept[n] = fs[n];
    fs[n] = function (p, ...a) {
      const resolved = path.resolve(String(p)).toLowerCase();
      if (resolved === underShare || resolved.startsWith(underShare + path.sep)) {
        if (!writeSet.has(n)) folderReads.push(n + ":" + p);
      }
      if (writeSet.has(n)) writesAnywhere.push(n + ":" + p);
      return kept[n].call(this, p, ...a);
    };
  }
  syncBuiltinESMExports();
  let run = null, heeded = null, view = null, threw = "", inUseRefused = false;
  try {
    try { run = M.startFollow({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, signingPublic: o.open.public, useWorker: false, pollMs: 1e9 }); }
    catch (e) { threw = String(e && e.message || e); }
    const openedMe = M.openMember(o.memberFile, o.vault, { signingPublic: o.open.public });
    heeded = M.heed(o.tf, o.vault, openedMe);
    view = M.followView(o.tf, o.vault);
    /* A take from a catalog the record brought asks for an in-use file; nothing is written for a record that is followed by nothing. */
    try { M.writeInUse({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, signingPublic: o.open.public, catalog: { id: "harbour-lamps", rev: 1, sha256: "sha256:" + hex(32) } }); }
    catch { inUseRefused = true; }
  } finally {
    for (const n of tapped) fs[n] = kept[n];
    syncBuiltinESMExports();
    if (run && typeof run.stop === "function") try { await run.stop(); } catch { /* already down */ }
  }
  const mtimeAfter = fs.statSync(path.join(c.share, "extra.txt")).mtimeMs;
  const en8a = "Central lead's team works through a shared folder, which Etiuda Studio no longer follows: what this Studio has of it stays as it is, and a new invitation from the team's lead brings the team back.";
  const pl8a = "Zespół osoby Central lead korzysta ze wspólnego folderu, którego Etiuda Studio już nie obsługuje: to, co to Studio ma z tego zespołu, zostaje bez zmian, a nowe zaproszenie od lidera zespołu przywróci zespół.";
  const en = view ? paintFollow(view, "") : "";
  const pl = view ? paintFollow(view, "pl") : "";
  const unnamed = paintFollow(Object.assign({}, view || {}, { leadName: "" }), "");
  const unnamedPl = paintFollow(Object.assign({}, view || {}, { leadName: "" }), "pl");
  const enAnon = "Team works through a shared folder, which Etiuda Studio no longer follows: what this Studio has of it stays as it is, and a new invitation from the team's lead brings the team back.";
  const plAnon = "Zespół korzysta ze wspólnego folderu, którego Etiuda Studio już nie obsługuje: to, co to Studio ma z tego zespołu, zostaje bez zmian, a nowe zaproszenie od lidera zespołu przywróci zespół.";
  const saidOnce = timesIn(en, en8a) === 1 && timesIn(pl, pl8a) === 1
    && timesIn(unnamed, enAnon) === 1 && timesIn(unnamedPl, plAnon) === 1
    && en.indexOf("Waiting for the team's lead") < 0 && en.indexOf("Out of reach from here") < 0;
  const untouched = run === null && !threw && inUseRefused && folderReads.length === 0 && writesAnywhere.length === 0
    && shaOf(o.tf) === tfBefore && treeOf(c.share) === shareBefore && treeOf(mirror) === mirrorBefore && mtimeAfter === mtimeBefore;
  const keptCatalogs = !!view && view.channel === "folder" && view.catalogs.length === 1 && view.catalogs[0].catalog === "harbour-lamps" && view.catalogs[0].rev === 1;
  check(untouched && keptCatalogs && saidOnce && heeded === "following",
    "as4-8a folder-followed record reads nothing under folder (" + folderReads.length + "), writes nothing (" + writesAnywhere.length
    + "), keeps record and catalogs (" + keptCatalogs + "), refuses an in-use file (" + inUseRefused + "), and says sentence 8a once (" + saidOnce + ")"
    + (threw ? ", start threw " + threw : ""));
};

/* as4-8b: a relay-followed team whose signed file now names a folder enters moved, keeps what it has, says sentence 8b once in
   English and Polish, and follows again with nothing asked if a later file names a known relay. */
LEGS["as4-8b"] = async () => {
  const w = await followedOnRelay("follow-as4-8b");
  const { c, o, f } = w;
  try {
    const held = (await heldTeam(c.mirror, { key: c.keyAt })).team;
    const movedDoc = await leadWrites(w, held, { kind: "folder" }, path.join(w.lab, "side-8b-folder"), 0);
    const viewMoved = M.followView(o.tf, o.vault);
    const en8b = "Central lead's team now works through a shared folder, which Etiuda Studio does not follow: this Studio keeps what it has, and nothing new arrives until a new invitation from the team's lead.";
    const pl8b = "Zespół osoby Central lead korzysta teraz ze wspólnego folderu, którego Etiuda Studio nie obsługuje: to Studio zachowuje to, co ma, i nic nowego nie dotrze do czasu nowego zaproszenia od lidera zespołu.";
    const en = viewMoved ? paintFollow(viewMoved, "") : "";
    const pl = viewMoved ? paintFollow(viewMoved, "pl") : "";
    const oldWords = "The team moved to a shared folder";
    const saidOnce = timesIn(en, en8b) === 1 && timesIn(pl, pl8b) === 1 && en.indexOf(oldWords) < 0;
    const kept = !!viewMoved && viewMoved.state === "moved" && viewMoved.catalogs.length === 1 && viewMoved.catalogs[0].rev === 1;
    const ring = held.ring || { format: 1, kind: "etiuda-ring", keys: [] };
    const backTeam = (await writeTeam(c.mirror, withChannel(movedDoc.team, { kind: "relay", rt: c.rt, url: Relay.RELAY_URL }, ring), { key: c.keyAt, passphrase: PASS })).team;
    put(c.mirror, "harbour-lamps.ec", await edition(c.open, c.teamId, 1, c.teamKey, "harbour-lamps", 2));
    for (let i = 0; i < 3; i++) { await c.runner.sync(); await c.runner.idle(); await kicks(f, 2); }
    const viewBack = M.followView(o.tf, o.vault);
    const enBack = viewBack ? paintFollow(viewBack, "") : "";
    const backOk = !!viewBack && viewBack.state === "following" && enBack.indexOf(en8b) < 0
      && viewBack.catalogs.length === 1 && viewBack.catalogs[0].rev === 2 && !!backTeam;
    check(kept && saidOnce && backOk,
      "as4-8b relay team moved to folder keeps catalogs (" + kept + "), says 8b once (" + saidOnce + "), and resumes on known relay (" + backOk + ")");
  } finally {
    try { await f.stop(); } catch { /* already down */ }
    try { await c.runner.stop(); } catch { /* already down */ }
  }
};

/* as4-6b: a pre-removal folder invitation + check code admits nobody and writes nothing, and leftover invites/*.wrap.json
   files in a share are untouched and read by nothing. */
LEGS["as4-6b"] = async () => {
  const lab = labDir("follow-as4-6b");
  const c = await centralFolder(lab), o = await office(lab);
  const wrapsDir = path.join(c.share, "invites");
  fs.mkdirSync(wrapsDir, { recursive: true });
  const wrapA = path.join(wrapsDir, c.made.id + ".wrap.json");
  const wrapB = path.join(wrapsDir, "fedcba9876543210.wrap.json");
  fs.writeFileSync(wrapA, JSON.stringify({ epoch: 1, ct: "ab".repeat(32) }) + "\n");
  fs.writeFileSync(wrapB, JSON.stringify({ epoch: 1, ct: "cd".repeat(32) }) + "\n");
  const wrapsBefore = treeOf(wrapsDir);

  /* From engine fold 131 the pinned reader reads no folder invitation (inviteRead answers null for one that names no relay), so the old
     invitation is refused by the reader as well as by the guard in joinTeam. Was: the reader still read it, and `readable` had to be true, so
     that it was the guard and not the reader that refused. What is held now is that it is not read as a relay invitation, and refused. */
  const oldInv = M.readInvitation(c.made.blob);
  const readable = !oldInv || !oldInv.relay;
  let said = "";
  try {
    M.joinTeam({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, text: c.made.blob, code: c.made.code, name: "Office Studio", signingPublic: o.open.public });
    said = "joined";
  } catch (e) {
    said = e && e.said ? e.said.frame : String(e && e.message || e);
  }
  const nothingJoined = readable && said === M.MEMBER_SAID.unread && !fs.existsSync(o.tf) && !fs.existsSync(o.memberFile)
    && !fs.existsSync(path.join(o.ud, "following")) && !fs.existsSync(path.join(c.share, "desks"));

  const S = await import("../src/studio.mjs");
  const projRoot = path.join(lab, "central-projects");
  fs.mkdirSync(projRoot, { recursive: true });
  const proj = await S.newProject(projRoot, "Wrap Check", ["en"]);
  S.setPublishFolder(proj.dir, c.share);

  const wrapOps = [];
  const tapped = ["readFileSync", "openSync", "readFile", "unlinkSync", "rmSync", "renameSync", "writeFileSync"];
  const kept = {};
  for (const n of tapped) {
    kept[n] = fs[n];
    fs[n] = function (p, ...a) {
      const s = String(p);
      if (/\.wrap\.json$/i.test(s)) wrapOps.push(n + ":" + s);
      return kept[n].call(this, p, ...a);
    };
  }
  syncBuiltinESMExports();
  try {
    await S.teamFacts(proj.dir, { key: c.keyAt, invites: K.inviteBookOf(c.tf, c.vault), teamsFile: c.tf, userData: c.ud });
    await S.desksFor(proj.dir, c.keyAt, { invites: K.inviteBookOf(c.tf, c.vault) });
    await S.watchAdmit(c.share, c.keyAt, PASS, { teamKeys: K.teamKeysOf(c.tf, c.vault), invites: K.inviteBookOf(c.tf, c.vault), teamsFile: c.tf });
    await S.moveEpoch(proj.dir, c.keyAt, c.teamId, PASS, { confirm: true, teamKeys: K.teamKeysOf(c.tf, c.vault), invites: K.inviteBookOf(c.tf, c.vault), teamsFile: c.tf });
    const dummyRun = M.startFollow({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, signingPublic: o.open.public, useWorker: false, pollMs: 1e9 });
    if (dummyRun && typeof dummyRun.stop === "function") await dummyRun.stop();
  } finally {
    for (const n of tapped) fs[n] = kept[n];
    syncBuiltinESMExports();
  }
  const wrapsUntouched = treeOf(wrapsDir) === wrapsBefore && wrapOps.length === 0;
  check(nothingJoined && wrapsUntouched,
    "as4-6b old folder invitation, which the pinned reader no longer reads as a relay one (" + readable + "), refused (" + nothingJoined + ", said=" + said + "); leftover wrap files untouched and unread (" + wrapsUntouched + ", ops=" + wrapOps.length + ")");
};

/* A FOLLOWING STUDIO WITH NO MEMBER CERTIFICATE (the relay's design note C-6, on the condition review 47's finding 17 set: Studio asks for
   the sign-in and says why, never silent and never a team shown as merely offline). Its invitation's hello is refused at the pinned
   relay's seat wall, which spends nothing, and the run tells the shell for the team; the shell's follow state carries the ask
   (src/member.mjs seatAskOf over relaySeatRefused, read in shell/main.js) and the row says it in place of the wait for the lead, in English
   and Polish. The control: the same run, once it holds a member certificate, reaches the lead and is told the seat opened. */
LEGS.c6f17 = async () => {
  const world = await relayWorld(), lab = labDir("follow-c6f17");
  const c = await centralRelay(world, lab), o = await office(lab);
  const box = Relay.leadOpened(c.keyAt, PASS).box.public;
  const secret = newSecret(), ri = Relay.relayInvite(secret);
  const made = makeInvite({ team: c.teamId, folder: c.mirror, lead: { keyId: c.open.keyId, public: c.open.public, box } }, "Central lead", secret, Date.now(),
    undefined, { rt: c.rt, url: Relay.RELAY_URL, token: ri.token, inv: ri.inv });
  K.keepInvite(c.tf, c.vault, c.teamId, { id: made.id, secret, made: made.made, expires: made.expires, name: made.name, relay: ri });
  await c.runner.sync(); await c.runner.idle();
  const joined = M.joinTeam({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, text: made.link, name: "Office Studio", signingPublic: o.open.public });
  const t = world.transport("office"), told = [], held = memberSeat(o.memberFile);
  let signedIn = false;
  const f = M.startFollow({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, signingPublic: o.open.public, request: t.request, connect: t.connect,
    pollMs: 1e9, watch: false, seat: () => (signedIn ? held() : null), onSeat: (team, s) => told.push([String(team), s]) });
  try {
    await kicks(f, 3);
    await c.runner.sync(); await c.runner.idle();
    const reqAt = path.join(c.mirror, "desks", joined.member, "join.json");
    const inv = world.store(c.rt) ? world.store(c.rt).get("inv:" + ri.inv) : null;
    const fk = K.followingOf(o.tf, o.vault);
    const unseated = { told: JSON.stringify(told), refused: told.length === 1 && told[0][0] === c.teamId && told[0][1] === "refused",
      noRequest: !fs.existsSync(reqAt), unspent: !!inv && inv.spent !== true, noKey: !fk || !fk.keys || Object.keys(fk.keys).length === 0 };
    const refusedTeams = new Set(told.filter((x) => x[1] === "refused").map((x) => x[0]));
    const asks = { signin: M.seatAskOf(c.teamId, refusedTeams, { by: "key" }), never: M.seatAskOf(c.teamId, refusedTeams, {}),
      renew: M.seatAskOf(c.teamId, refusedTeams, { by: "signin" }), removed: M.seatAskOf(c.teamId, refusedTeams, { by: "signin", signinNoRole: true }),
      other: M.seatAskOf("t-" + hex(8), refusedTeams, { by: "key" }) };
    const asksOk = asks.signin === "signin" && asks.never === "signin" && asks.renew === "renew" && asks.removed === "removed" && asks.other === "";
    const view = M.followView(o.tf, o.vault);
    const rows = {};
    const words = {
      signin: ["This Studio holds no licence for the Etiuda relay. Signing in, from the Menu, under Settings, then Account, brings a licence or a trial.",
        "To Studio nie ma licencji na przekaźnik Etiudy. Licencję albo okres próbny daje zalogowanie się z menu, w Ustawieniach, w części Konto."],
      renew: ["This account's sign-in needs renewing.", "Logowanie tego konta wymaga odnowienia."],
      removed: ["Your organisation no longer gives this account access to Etiuda.", "Organizacja nie przyznaje już temu kontu dostępu do Etiudy."],
    };
    const wait = ["Waiting for the team's lead to let this Studio in", "Oczekiwanie na przyjęcie przez lidera zespołu"];
    for (const ask of Object.keys(words)) {
      const v = Object.assign({}, view, { seatAsk: ask });
      const en = paintFollow(v), pl = paintFollow(v, "pl");
      rows[ask] = en.includes(words[ask][0]) && pl.includes(words[ask][1]) && !en.includes(wait[0]) && !pl.includes(wait[1])
        && (en.match(/data-seat-ask/g) || []).length === 1 && en.includes("Leave the team");
    }
    const plain = paintFollow(view);
    const rowsOk = Object.values(rows).every((x) => x === true) && view && view.state === "joining" && plain.includes(wait[0]) && plain.indexOf("data-seat-ask") < 0;
    const shell = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
    const wired = shell.includes("const ask = view ? M.seatAskOf(view.team, relaySeatRefused, readServiceState()) : \"\";")
      && shell.includes("  if (ask) view.seatAsk = ask;") && shell.includes("  if (was !== relaySeatRefused.has(String(team))) followSignal();");
    /* The control: the same run, now holding a member certificate, sends its request to the lead and is told the seat opened. */
    signedIn = true;
    await kicks(f, 3);
    await c.runner.sync(); await c.runner.idle();
    const seated = { opened: told.length === 2 && told[1][0] === c.teamId && told[1][1] === "open", request: fs.existsSync(reqAt) };
    check(unseated.refused && unseated.noRequest && unseated.unspent && unseated.noKey && asksOk && rowsOk && wired && seated.opened && seated.request,
      "c6f17 a following Studio with no member certificate is refused at the relay and told for its team " + unseated.refused + " (" + unseated.told
      + "), its request reaches no lead " + unseated.noRequest + ", the invitation unspent " + unseated.unspent + ", no team key " + unseated.noKey
      + "; the ask is signin unless signed in, renew or removed when signed in, none for another team " + asksOk + " (" + JSON.stringify(asks)
      + "); the row asks in English and Polish in place of the wait " + JSON.stringify(rows) + ", the row without the ask still waits " + rowsOk
      + "; the shell reads the ask into the follow state and signals the page " + wired + "; holding one, the same run is told open " + seated.opened
      + " and its request reaches the lead " + seated.request);
  } finally {
    try { await f.stop(); } catch { /* already down */ }
    try { await c.runner.stop(); } catch { /* already down */ }
  }
};

/* ---- the run -------------------------------------------------------------------------------------------------------- */
if (M.missing) console.log("  src/member.mjs did not load: " + M.missing);
for (const name of Object.keys(LEGS)) {
  if (ONLY && name !== ONLY) continue;
  try { await LEGS[name](); }
  catch (e) { failed++; asserted++; console.log("  FAIL " + name + " threw: " + String(e && e.stack || e).split("\n").slice(0, 4).join(" | ")); }
}

const PLANTS = [
  { mark: "962s7a-table", leg: "962s7a", rel: "src/team-store.mjs", line: "const FOLLOW_TABLE = \"teams\";" },
  { mark: "962s7b-agree", leg: "962s7br", rel: "src/member.mjs", line: "      agree: undefined," },
  { mark: "962s7c-sig", leg: "962s7c", rel: "src/member.mjs", line: "    signed = true;" },
  { mark: "962s7c-chain", leg: "962s7c", rel: "src/member.mjs", line: "  handed = true;" },
  { mark: "962s7d-only", leg: "962s7d", rel: "src/member.mjs", line: "  ownFile = true;" },
  { mark: "962s7e-apart", leg: "962s7e", rel: "src/member.mjs", line: "  apart = true;" },
  { mark: "962s7f-removed", leg: "962s7f", rel: "src/member.mjs", line: "  gone = false;" },
  { mark: "962s7k-keep", leg: "962s7k", rel: "src/team-store.mjs", line: "    keys = { [String(epoch)]: k.toString(\"hex\") };" },
  { mark: "962s7l-plain", leg: "962s7l", rel: "src/team-store.mjs", line: "  plainPin = false;" },
  { mark: "962s7n-backup", leg: "962s7n", rel: "src/studio.mjs", line: "  /* the member's rows left off */" },
  { mark: "962s7n-apart", leg: "962s7n", rel: "src/member.mjs", line: "  apart = true;" },
  { mark: "962s7o-heed", leg: "962s7o", rel: "src/member.mjs", line: "  older = false;" },
  { mark: "962s7p-files", leg: "962s7p", rel: "src/member.mjs", line: "  const gone = [\"join.json\"];" },
  { mark: "962s7p-state", leg: "962s7br", rel: "src/member.mjs", line: "  /* the channel's state kept */" },
  { mark: "962s7q-rejoin", leg: "962s7q", rel: "src/member.mjs", line: "  const keep = !was;" },
  { mark: "974c1a-retarget", leg: "974c1a", rel: "src/member.mjs", line: "  retarget = false;" },
  { mark: "974c1a-move", leg: "974c1a", rel: "src/member.mjs", line: "  moved = false;" },
  { mark: "974c1b-answer", leg: "974c1b", rel: "src/member.mjs", line: "    refusedAnswer = false;" },
  { mark: "989-not-live", leg: "989a", rel: "src/socket-watch.mjs", line: "  return { connect, request, notLive: () => false };" },
  { mark: "989-hold", leg: "989a", rel: "src/socket-watch.mjs", line: "      /* the hold taken out */" },
  { mark: "989-door", leg: "989b", rel: "src/socket-watch.mjs", line: "      if (!s) { failed(); return null; }" },
  { mark: "974c1c-settle", leg: "974c1c", rel: "src/member.mjs", line: "            /* settle omitted */" },
  { mark: "974c1d-signal", leg: "974c1d", rel: "shell/main.js", line: "    onState: undefined," },
  { mark: "974c1d-heard", leg: "974c1d", rel: "ui/app.js", line: "    /* the follow signal not heard */" },
  { mark: "skr-heed", leg: "skr1", rel: "src/member.mjs", line: "  heeded = true;" },
  { mark: "skr-view", leg: "skr1", rel: "src/member.mjs", line: "  elsewhere = false;" },
  { mark: "skr-row", leg: "skr1", rel: "ui/app.js", line: "    elsewhere = \"\";" },
  { mark: "skr-arm", leg: "skr2", rel: "src/member.mjs", line: "    known = true;" },
  { mark: "skr-switch", leg: "skr3", rel: "src/member.mjs", line: "    known = true;" },
  { mark: "skr-store", leg: "skr4", rel: "src/team-store.mjs", line: "  known = true;" },
  { mark: "skr-keep", leg: "skr5", rel: "src/team-store.mjs", line: "    known = true;" },
  { mark: "skr-join", leg: "skr6", rel: "src/member.mjs", line: "  known = true;" },
  { mark: "as4-no-folder-join", leg: "as4-6b", rel: "src/member.mjs", line: "  hasRelay = true;" },
  { mark: "as4-8a-start", leg: "as4-8a", rel: "src/member.mjs", line: "  onRelay = true;" },
  { mark: "as4-8a-heed", leg: "as4-8a", rel: "src/member.mjs", line: "  onRelay = true;" },
  { mark: "as4-8a-inuse", leg: "as4-8a", rel: "src/member.mjs", line: "  onRelay = true;" },
  { mark: "as4-8a-row", leg: "as4-8a", rel: "ui/app.js", line: "      stateHtml = \"\";" },
  { mark: "as4-8b-row", leg: "as4-8b", rel: "ui/app.js", line: "      stateHtml = \"\";" },
  { mark: "c6-ask", leg: "c6f17", rel: "src/member.mjs", line: "  asked = false;" },
  { mark: "c6-view", leg: "c6f17", rel: "shell/main.js", line: "  void ask;" },
  { mark: "c6-signal", leg: "c6f17", rel: "shell/main.js", line: "  void was;" },
  { mark: "c6-row", leg: "c6f17", rel: "ui/app.js", line: "    seatAsk = \"\";" },
];
if (!ONLY) copyPlants({ root: ROOT, self: SELF, label: "follow", onlyVar: "FOLLOW_ONLY", plants: PLANTS, check, skip, timeout: 240000 });

console.log("follow: " + (asserted - failed) + " of " + asserted + " held");
process.exit(Math.min(failed, 63));
