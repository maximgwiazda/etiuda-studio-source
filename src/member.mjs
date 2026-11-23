/* A STUDIO ON ANOTHER STUDIO'S TEAM, AS A TEAMMATE (board 962, stage 7, V2).
 *
 *     import { memberKeyFile, ensureMember, openMember, readInvitation, joinTeam, startFollow, followedEditions, writeInUse,
 *       leaveTeam } from "./src/member.mjs";
 *
 * Max, 2026-11-04 16:06: "we want both Desks and Studios to be able to join as teammates for a given Studio." A Studio joins
 * as a desk does, and nothing changes on the side of the Studio it joins: its roster already carries a member's kind. So this
 * Studio holds, for that one team, what a desk holds:
 *
 *  - A MEMBER KEY OF ITS OWN (member-key.json beside signing-key.json): a k- id made from the public half as a desk's is, an
 *    Ed25519 pair that signs only this member's own files (its request to join, its in-use.ec) and an X25519 box the lead wraps
 *    the team key to, the private halves sealed by the vault as the signing key's are. The signing key is never a member
 *    anywhere, and a member key equal to it is refused (the relay refuses a device whose key is the team's lead key besides).
 *  - THE TEAM IT FOLLOWS, in teams.json's `following` table (src/team-store.mjs), apart from the teams it leads, the lead it
 *    joined under, the chain it was handed through and every team key by its number sealed by the vault.
 *  - ITS OWN MIRROR, <userData>/following/<team id>/, apart from every led team's, kept in step by the pinned desk's own channel
 *    layer on the relay (shell/relay/channel.cjs, as the desk runs it, place desk:<member id>, agreeing by the member box).
 *
 * WHAT IS READ FROM THE MIRROR IS JUDGED AT READ, never trusted because it is there: a team file counts only where it is whole
 * under the lead it names and that lead is the pinned one or one the file's handovers reach from it; an edition counts only as
 * a sealed envelope for this team that opens with a kept key and whose catalog verifies under the pinned lead or a key of the
 * chain. The ring is never read for trust. Anything else leaves the team "not reached", and the pin is never moved by anything
 * but a genuine handover.
 *
 * WHAT GOES UPWARD is a member's request and one in-use.ec, and nothing else: memberWrite refuses any other name, so neither a
 * working copy nor a figure of this Studio's own reaches the central Studio (stage 7, question 5). */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import * as Engine from "./engine.mjs";
import * as Store from "./team-store.mjs";
import { shownName } from "./invite.mjs";
import { socketWatch } from "./socket-watch.mjs";
import { relayKnown } from "./relay-known.mjs";

const require = createRequire(import.meta.url);
const { writeWhole } = require("./whole-write.cjs");

const MEMBER_FILE = "member-key.json";
const MEMBER_KIND = "etiuda-studio-member-key";
const FOLLOW_DIR = "following";
const TEAM_NAME = "etiuda-team.json";
const IN_USE_KIND = "etiuda-in-use";
/* The only files a member writes in its own place. */
const MEMBER_FILES = ["join.json", "in-use.ec"];
const HEX64 = /^[0-9a-f]{64}$/;
const ED_SPKI = Buffer.from("302a300506032b6570032100", "hex");
const X_SPKI = Buffer.from("302a300506032b656e032100", "hex");

/* The words a refusal says. */
const SAID = {
  unread: "This is not an invitation Studio can read, so it did not ask to join.",
  noVault: "This computer cannot keep a key sealed for this account, so Studio did not ask to join.",
  leads: "This Studio leads that team, so it cannot join it as a teammate.",
  followsOne: "This Studio is already a teammate on another team, and it can be on one only, so it did not ask to join. Leave that team first.",
  apart: "This Studio's member key is the same as its signing key, so it did not ask to join.",
  none: "This Studio is not a teammate on any team.",
  notOwn: "A teammate writes only its request to join and the catalog it has in use, so nothing else was written.",
};
function refused(line) { const e = new Error(line); e.said = { frame: line, vars: {} }; return e; }

const rawPublic = (k) => k.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex");
function vaultCan(vault) { try { return !!vault && vault.available(); } catch { return false; } }

/** Where a Studio whose user data is `userData` keeps its member key. */
function memberKeyFile(userData) { return path.join(path.resolve(String(userData || ".")), MEMBER_FILE); }
/** Where the mirror of the followed team `team` sits for the Studio whose teams file is `teamsFile`. */
function followMirror(teamsFile, team) {
  if (!/^t-[0-9a-f]{16}$/.test(String(team))) throw new Error("a team id is t- and 16 lower-case hex characters");
  return path.join(path.dirname(path.resolve(String(teamsFile))), FOLLOW_DIR, String(team));
}

/* ---- the member key ----------------------------------------------------------------------------------------------- */

function readMemberDoc(file) {
  let d = null;
  try { d = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return null; }
  if (!d || d.kind !== MEMBER_KIND || !HEX64.test(String(d.key)) || !HEX64.test(String(d.box)) || typeof d.sign !== "string" || typeof d.boxSecret !== "string") return null;
  return d;
}
/** The member key's public halves, {id, key, box}, without opening anything; null where there is none. */
function memberPublic(file) {
  const d = readMemberDoc(file);
  return d ? { id: Engine.joinRules().branchIdOf(d.key), key: d.key, box: d.box } : null;
}
/* Whether the member key stands apart from this Studio's signing key, whose public half is `signingPublic`. */
function apartFrom(pub, signingPublic) {
  let apart = true;
  apart = !signingPublic || String(pub) !== String(signingPublic); /* plant:962s7e-apart */
  return apart;
}
/** The member key opened by the vault: {id, key, box, privateKey, boxKey}, or null where there is none, it does not open, its
 *  halves do not match, or it is this Studio's signing key (`o.signingPublic`). */
function openMember(file, vault, o) {
  const d = readMemberDoc(file);
  if (!d) return null;
  try {
    const privateKey = crypto.createPrivateKey({ key: Buffer.from(String(vault.open(Buffer.from(d.sign, "base64"))), "base64"), format: "der", type: "pkcs8" });
    const boxKey = crypto.createPrivateKey({ key: Buffer.from(String(vault.open(Buffer.from(d.boxSecret, "base64"))), "base64"), format: "der", type: "pkcs8" });
    const key = rawPublic(crypto.createPublicKey(privateKey)), box = rawPublic(crypto.createPublicKey(boxKey));
    if (key !== d.key || box !== d.box) return null;
    if (!apartFrom(key, o && o.signingPublic)) return null;
    return { id: Engine.joinRules().branchIdOf(key), key, box, privateKey, boxKey };
  } catch { return null; }
}
/** The member key, made once on first need and kept sealed by the vault: {id, key, box}. Refused where the vault cannot seal,
 *  and where the key there is this Studio's signing key. A key there that does not open is never replaced in silence: it is
 *  refused, so the lead learns this Studio rejoins under a new key only by being told. */
function ensureMember(file, vault, o) {
  if (!vaultCan(vault)) throw refused(SAID.noVault);
  const was = readMemberDoc(file);
  if (was) {
    const open = openMember(file, vault, o);
    if (!open) throw refused(apartFrom(was.key, o && o.signingPublic) ? SAID.noVault : SAID.apart);
    return { id: open.id, key: open.key, box: open.box };
  }
  const s = crypto.generateKeyPairSync("ed25519"), b = crypto.generateKeyPairSync("x25519");
  const seal = (k) => Buffer.from(vault.seal(k.export({ type: "pkcs8", format: "der" }).toString("base64"))).toString("base64");
  const doc = { format: 1, kind: MEMBER_KIND, key: rawPublic(s.publicKey), box: rawPublic(b.publicKey), sign: seal(s.privateKey), boxSecret: seal(b.privateKey) };
  if (!apartFrom(doc.key, o && o.signingPublic)) throw refused(SAID.apart);
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  writeWhole(file, JSON.stringify(doc, null, 1) + "\n");
  return { id: Engine.joinRules().branchIdOf(doc.key), key: doc.key, box: doc.box };
}
/** The member key as the backup copy carries it, {key, box, sign, boxSecret} with the private halves as pkcs8 DER in hex, or
 *  null. The caller seals it under the signing key's seed. */
function memberBackupRow(file, vault, o) {
  const m = openMember(file, vault, o);
  if (!m) return null;
  return { key: m.key, box: m.box, sign: m.privateKey.export({ type: "pkcs8", format: "der" }).toString("hex"),
    boxSecret: m.boxKey.export({ type: "pkcs8", format: "der" }).toString("hex") };
}
/** Keeps a member key a backup copy brought back, sealed by this computer's vault. A member key already here that is another
 *  stays, and false is answered. */
function memberFromBackup(file, vault, row, o) {
  if (!row || !vaultCan(vault)) return false;
  let apart = true;
  apart = apartFrom(row.key, o && o.signingPublic); /* plant:962s7n-apart */
  if (!apart) return false;
  const was = readMemberDoc(file);
  if (was) return was.key === row.key && !!openMember(file, vault, o);
  try {
    const sk = crypto.createPrivateKey({ key: Buffer.from(String(row.sign), "hex"), format: "der", type: "pkcs8" });
    const bk = crypto.createPrivateKey({ key: Buffer.from(String(row.boxSecret), "hex"), format: "der", type: "pkcs8" });
    if (rawPublic(crypto.createPublicKey(sk)) !== row.key || rawPublic(crypto.createPublicKey(bk)) !== row.box) return false;
    const seal = (k) => Buffer.from(vault.seal(k.export({ type: "pkcs8", format: "der" }).toString("base64"))).toString("base64");
    writeWhole(file, JSON.stringify({ format: 1, kind: MEMBER_KIND, key: row.key, box: row.box, sign: seal(sk), boxSecret: seal(bk) }, null, 1) + "\n");
    return true;
  } catch { return false; }
}

/* ---- the invitation and the request ------------------------------------------------------------------------------- */

/** The invitation in `text` as the pinned desk reads it, or null. */
function readInvitation(text) {
  try { return Engine.inviteRules().inviteRead(String(text == null ? "" : text), process.platform !== "win32"); } catch { return null; }
}
/** The request to join a member writes, signed by its member key under the join prefix, its kind "studio", carrying the
 *  invitation's id and its proof over the commitment; the pinned joinGenuine reads it as any desk's. */
function joinRequest(inv, me, name, now) {
  const J = Engine.joinRules(), I = Engine.inviteRules();
  const nonce = crypto.randomBytes(32).toString("hex"), commit = J.joinCommit(inv.team, me.key, me.box, nonce);
  const desk = { id: me.id, key: me.key, box: me.box };
  const shown = shownName(String(name || "")).trim().slice(0, 120);
  if (shown) desk.name = shown;
  desk.kind = "studio";
  const doc = { format: 1, kind: J.JOIN_KIND, team: inv.team, desk, date: new Date(now == null ? Date.now() : now).toISOString(), commit,
    invite: { id: I.inviteIdOf(inv.secret), proof: I.memberProof(inv.secret, commit) } };
  doc.sig = { alg: "Ed25519", keyId: me.id };
  doc.sig.value = crypto.sign(null, J.joinSignedBytes(doc), me.privateKey).toString("hex");
  return doc;
}

/* ---- the member's own place --------------------------------------------------------------------------------------- */

/** Writes `text` at desks/<member id>/<name> in the followed mirror, or removes it where `text` is null. Only a member's own
 *  two files: anything else is refused. */
function memberWrite(teamsFile, team, me, name, text) {
  let ownFile = false;
  ownFile = MEMBER_FILES.indexOf(String(name)) >= 0; /* plant:962s7d-only */
  if (!ownFile || !/^k-[0-9a-f]{16}$/.test(String(me && me.id))) throw refused(SAID.notOwn);
  const mirror = followMirror(teamsFile, team), rel = "desks/" + me.id + "/" + name, at = path.join(mirror, "desks", me.id, name);
  if (text === null) { try { fs.unlinkSync(at); } catch (e) { if (!e || e.code !== "ENOENT") throw e; } }
  else { fs.mkdirSync(path.dirname(at), { recursive: true }); writeWhole(at, String(text)); }
  return rel;
}

/* ---- judging what the mirror holds -------------------------------------------------------------------------------- */

const sameKey = (a, b) => !!a && !!b && a.keyId === b.keyId && a.public === b.public;
/** The team file `doc` judged for the followed team `team` under the pinned lead `pin`: {doc, path} where it is whole under the
 *  lead it names and that lead is the pin or one its handovers reach from the pin (`path` the keys passed through, the pin
 *  first), else null. */
function judgeTeam(doc, team, pin) {
  const F = Engine.folderRules();
  if (!doc || typeof doc !== "object" || doc.id !== team || !pin || !F.teamWhole(doc)) return null;
  if (sameKey(doc.lead, pin)) return { doc, path: [] };
  let handed = false;
  handed = F.handedTo(doc, pin); /* plant:962s7c-chain */
  return handed ? { doc, path: F.handedPath(doc, pin) } : null;
}
function teamFileIn(mirror) {
  try { return JSON.parse(fs.readFileSync(path.join(mirror, TEAM_NAME), "utf8").replace(/^\uFEFF/, "")); } catch { return null; }
}
/* A RELAY THIS BUILD DOES NOT KNOW (Claude alpha's decision of 2026-11-17 20:33, the desk's rule mirrored). A followed team whose
   genuine file, at or above the floor, names a relay src/relay-known.mjs does not take is not followed there: heed uses nothing
   of that file, so the record, the team's catalogs and the channel it had stay as they were and nothing is sent there; a record
   already naming one (an older build's, or a hand's) opens no channel (armRelay). The row says so, the address never shown
   (followView's elsewhere). Whether `doc` is such a file for the record `f`: */
function fileElsewhere(f, doc) {
  if (!f || !f.lead || !doc || !judgeTeam(doc, f.team, f.lead)) return false;
  const rev = Engine.teamFileRules().teamRevOf(doc);
  if (rev === null || (!!f.floor && (doc.epoch < f.floor.epoch || (doc.epoch === f.floor.epoch && rev < f.floor.rev)))) return false;
  const ch = Engine.teamFileRules().teamChannelOf(doc);
  return !!ch && ch.kind === "relay" && !relayKnown(ch.url);
}
/* Whether the record `f` itself names a relay this build does not know. */
const recordElsewhere = (f) => !!f && f.channel === "relay" && !!f.relay && !relayKnown(f.relay.url);
/** Every edition of the followed team the mirror holds that counts, the newest of each catalog: [{catalog, rev, date, file, epoch,
 *  text}]. A file counts only as a sealed envelope for this team that opens with a kept key and whose catalog verifies under the
 *  pinned lead or a key of the chain; a plain catalog, another team's envelope and anything signed by another key count for
 *  nothing. Empty where nothing is followed or its record does not open. */
function followedEditions(teamsFile, vault) {
  const f = Store.followingOf(teamsFile, vault);
  if (!f || !f.lead) return [];
  const mirror = followMirror(teamsFile, f.team), S = Engine.sealRules(), F = Engine.folderRules();
  const signers = [f.lead].concat(f.chain || []);
  let names = [];
  try { names = fs.readdirSync(mirror).filter((n) => /\.ec$/i.test(n)).sort(); } catch { names = []; }
  const best = new Map();
  for (const name of names) {
    let env = null;
    try { env = JSON.parse(fs.readFileSync(path.join(mirror, name), "utf8").replace(/^\uFEFF/, "")); } catch { continue; }
    if (!env || env.kind !== S.SEALED_KIND || env.team !== f.team) continue;
    const key = f.keys[String(env.epoch)];
    const text = key ? S.openSealed(key, env) : null;
    if (typeof text !== "string") continue;
    let cat = null;
    try { cat = JSON.parse(text); } catch { continue; }
    if (!cat || typeof cat.id !== "string" || !Number.isSafeInteger(cat.rev)) continue;
    let signed = false;
    signed = signers.some((k) => F.catalogSigValid(cat, k.public) === true); /* plant:962s7c-sig */
    if (!signed) continue;
    const prev = best.get(cat.id);
    if (!prev || cat.rev > prev.rev) best.set(cat.id, { catalog: cat.id, rev: cat.rev, date: typeof cat.date === "string" ? cat.date : "", file: name, epoch: env.epoch, text });
  }
  return Array.from(best.values()).sort((a, b) => (a.catalog < b.catalog ? -1 : a.catalog > b.catalog ? 1 : 0));
}

/** Reads the followed team's file from its mirror and acts on it as a desk heeds its team: a genuine handover moves the pin, a
 *  wrap of this member's moves its key into the store beside every key kept before, a roster that has left this member off says
 *  it is no longer on the team, and anything that does not judge says not reached. Answers the state. */
function heed(teamsFile, vault, me) {
  const f = Store.followingOf(teamsFile, vault);
  if (!f) return null;
  /* A record that follows through a folder (an older Studio's) is read by nothing now: the state it has, nothing moved, nothing
     retargeted, whatever its mirror holds. */
  let onRelay = false;
  onRelay = f.channel === "relay"; /* plant:as4-8a-heed */
  if (!onRelay) return f.state;
  if (!f.lead) return "not-reached";
  const mirror = followMirror(teamsFile, f.team), doc = teamFileIn(mirror);
  if (!doc) return f.state;
  const judged = judgeTeam(doc, f.team, f.lead);
  if (!judged) { Store.markFollowing(teamsFile, f.team, "not-reached"); return "not-reached"; }
  /* THE FLOOR: the highest team file heeded is kept in the sealed record, so after a mirror lost or a restore an older genuine
     file (one that still lists this member, say) is not heeded again, as the desk's syncer keeps its own (Argon's V2 review,
     finding 4). The syncer is handed the same floor; this is the read's own check. */
  const rev = Engine.teamFileRules().teamRevOf(doc);
  if (rev === null) return f.state;
  let older = false;
  older = !!f.floor && (doc.epoch < f.floor.epoch || (doc.epoch === f.floor.epoch && rev < f.floor.rev)); /* plant:962s7o-heed */
  if (older) return f.state;
  /* A file naming a relay this build does not know is used for nothing, before anything of it is kept (fileElsewhere). */
  let heeded = true;
  heeded = !fileElsewhere(f, doc); /* plant:skr-heed */
  if (!heeded) return f.state;
  const raise = !f.floor || doc.epoch > f.floor.epoch || rev > f.floor.rev;
  if (!sameKey(doc.lead, f.lead) || raise) {
    Store.resealFollowing(teamsFile, vault, f.team, (s) => {
      const chain = s.chain.slice();
      for (const k of judged.path) if (!chain.some((c) => c.public === k.public)) chain.push({ keyId: k.keyId, public: k.public });
      return Object.assign({}, s, { lead: { keyId: doc.lead.keyId, public: doc.lead.public }, chain, floor: { epoch: doc.epoch, rev } });
    });
  }
  /* A channel the file names and this record does not. A relay this build knows is followed (one it does not know returned
     above, and the store refuses it besides): the record points at it and the run re-arms on its next look. A folder, while
     this record is on the relay, cannot be followed, because the file names no folder. */
  const ch = Engine.teamFileRules().teamChannelOf(doc);
  let retarget = false;
  retarget = !!(ch && ch.kind === "relay" && !(f.channel === "relay" && f.relay && f.relay.rt === ch.rt)); /* plant:974c1a-retarget */
  if (retarget) Store.retargetFollowing(teamsFile, f.team, { channel: "relay", relay: { rt: ch.rt, url: ch.url } });
  let moved = false;
  moved = !!(ch && ch.kind === "folder" && f.channel === "relay"); /* plant:974c1a-move */
  if (moved) { Store.markFollowing(teamsFile, f.team, "moved"); return "moved"; }
  const mine = (doc.roster || []).find((e) => e && e.desk && e.desk.id === me.id);
  if (mine) {
    const key = mine.wrap && mine.wrap.epoch === doc.epoch ? Engine.hpkeRules().unwrapTeamKey(me.boxKey, mine.wrap, f.team, doc.epoch, me.id) : null;
    if (!key) {
      const stay = f.state === "following" ? "following" : (f.state === "refused" ? "refused" : "joining");
      Store.markFollowing(teamsFile, f.team, stay);
      return stay;
    }
    Store.keepFollowKey(teamsFile, vault, f.team, doc.epoch, key);
    /* Holding the key, the member takes its request back, as the desk's joinView does: the lead lets the invitation go then. */
    if (fs.existsSync(path.join(mirror, "desks", me.id, "join.json"))) memberWrite(teamsFile, f.team, me, "join.json", null);
    /* On the relay the invitation's session still reads the lead's answer after the wrap has opened, and the relay itself ends
       the token once the lead lets it go, so the channel is handed the invitation as the desk's is until this Studio leaves. */
    Store.markFollowing(teamsFile, f.team, "following");
    return "following";
  }
  let gone = false;
  gone = f.state === "following" || f.state === "removed" || Object.keys(f.keys).length > 0; /* plant:962s7f-removed */
  if (f.state === "refused") { Store.markFollowing(teamsFile, f.team, "refused"); return "refused"; }
  const now = gone ? "removed" : "joining";
  Store.markFollowing(teamsFile, f.team, now);
  return now;
}

/* ---- joining, following and leaving -------------------------------------------------------------------------------- */

/** Joins the team an invitation names, as a teammate: reads the invitation by the pinned desk's reader, refuses any invitation
 *  without a relay, makes the member key on first need, keeps the followed team and writes the request into the member's
 *  own place. `o` {teamsFile, vault, memberFile, text, name, signingPublic, now}. Answers {team, channel, member, leadName}. */
function joinTeam(o) {
  const x = o || {};
  const inv = readInvitation(x.text);
  if (!inv) throw refused(SAID.unread);
  /* An invitation with no relay (an older folder invitation) cannot be taken: refused in the same sentence, no member key
     made, nothing written. */
  let hasRelay = false;
  hasRelay = !!inv.relay; /* plant:as4-no-folder-join */
  if (!hasRelay) throw refused(SAID.unread);
  /* An invitation naming a relay this build does not know (src/relay-known.mjs) is one Studio cannot read, as the desk answers
     one: no member key is made, nothing is written, and nothing is sent there. */
  let known = true;
  known = relayKnown(inv.relay.url); /* plant:skr-join */
  if (!known) throw refused(SAID.unread);
  if (!vaultCan(x.vault)) throw refused(SAID.noVault);
  if (Store.keptTeam(x.teamsFile, inv.team)) throw refused(SAID.leads);
  const was = Store.followingOf(x.teamsFile, x.vault);
  if (was && was.team !== inv.team) throw refused(SAID.followsOne);
  const pub = ensureMember(x.memberFile, x.vault, { signingPublic: x.signingPublic });
  const me = openMember(x.memberFile, x.vault, { signingPublic: x.signingPublic });
  if (!me || me.id !== pub.id) throw refused(SAID.noVault);
  const channel = "relay";
  /* A join of the team already followed replaces its record whole: the old invitation's seal and the channel's record of it go,
     so the new request is read and sealed under its own invitation (Argon's V2 review, finding 2). The shell stops the run first. */
  const keep = true; /* plant:962s7q-rejoin */
  if (was) { try { fs.rmSync(followMirror(x.teamsFile, inv.team) + ".json", { force: true }); } catch { /* none kept */ } }
  if (keep) {
    Store.keepFollowing(x.teamsFile, x.vault, inv.team,
      { channel, folder: "", relay: { rt: inv.relay.rt, url: inv.relay.url }, member: me.id,
        leadName: typeof inv.lead.name === "string" ? inv.lead.name : "", joined: new Date(x.now == null ? Date.now() : x.now).toISOString() },
      { lead: { keyId: inv.lead.keyId, public: inv.lead.public }, chain: [], keys: {},
        invite: { secret: inv.secret, box: inv.lead.box || "", relay: { inv: inv.relay.inv, token: inv.relay.token } } });
  }
  fs.mkdirSync(followMirror(x.teamsFile, inv.team), { recursive: true });
  memberWrite(x.teamsFile, inv.team, me, "join.json", JSON.stringify(joinRequest(inv, me, x.name, x.now), null, 1) + "\n");
  return { team: inv.team, channel, member: me.id, leadName: typeof inv.lead.name === "string" ? inv.lead.name : "" };
}

/** The X25519 agreement of the member box with another box given as 64 hex: 32 bytes, or null. */
function agreeOf(boxKey) {
  return (peer) => {
    if (!boxKey || !HEX64.test(String(peer))) return null;
    try {
      return crypto.diffieHellman({ privateKey: boxKey, publicKey: crypto.createPublicKey({ key: Buffer.concat([X_SPKI, Buffer.from(String(peer), "hex")]), format: "der", type: "spki" }) });
    } catch { return null; }
  };
}

/** Keeps the followed team in step: on the relay the pinned channel layer as a desk runs it, place desk:<member id>, agreeing by
 *  the member box. A record whose channel is not the relay (an older folder record) starts nothing, reads nothing from its folder
 *  and writes nothing. `o` {teamsFile, vault, memberFile, signingPublic, request, connect, say, clock, pollMs, watch, onState}.
 *  Answers {team, channel, mirror, kick, idle, stop, heed, answer(), run} or null where nothing is followed, its channel is not
 *  the relay, or the member key does not open. */
function startFollow(o) {
  const x = o || {};
  const f = Store.followingOf(x.teamsFile, x.vault);
  let onRelay = false;
  onRelay = !!f && f.channel === "relay"; /* plant:as4-8a-start */
  if (!f || !onRelay) return null;
  const me = openMember(x.memberFile, x.vault, { signingPublic: x.signingPublic });
  if (!me) return null;
  const mirror = followMirror(x.teamsFile, f.team);
  fs.mkdirSync(mirror, { recursive: true });
  const now = () => Store.followingOf(x.teamsFile, x.vault) || f;
  const keyFor = (epoch) => { const k = now().keys[String(epoch)]; return k ? Buffer.from(k) : null; };
  const pin = () => { const c = now(); return c.lead ? { keyId: c.lead.keyId, public: c.lead.public } : null; };
  let last = f.state, answered = null, transport = null, stopped = false, switchWait = null, switching = false;
  const tell = (state) => { if (state && state !== last) { last = state; if (typeof x.onState === "function") x.onState(state); } };
  /* The lead's refusal is a state, not only an answer the channel remembered. The plant line is the whole decision. */
  function noteRefusal(a) {
    let refusedAnswer = false;
    refusedAnswer = a === "refused"; /* plant:974c1b-answer */
    if (!refusedAnswer) return;
    try { Store.markFollowing(x.teamsFile, f.team, "refused"); } catch { /* said at the next look */ }
    tell("refused");
  }
  function heedNow() {
    let s = null;
    try { s = heed(x.teamsFile, x.vault, me); } catch (e) { s = null; }
    tell(s);
    if (!stopped && needsSwitch(now())) queueSwitch();
    return s;
  }
  /* Only toward a relay the record names, and only one this build knows: a record that names another (a hand's edit while this
     runs) keeps the channel it has, which a switch would stop for one that never opens. A folder the file names, while the
     record is on the relay, has no path to arm. */
  function needsSwitch(rec) {
    if (!rec || !transport || stopped || rec.state === "moved" || rec.state === "removed" || rec.state === "refused") return false;
    if (rec.channel !== "relay" || !rec.relay || !rec.relay.rt) return false;
    let known = true;
    known = !recordElsewhere(rec); /* plant:skr-switch */
    if (!known) return false;
    return transport.kind !== "relay" || transport.rt !== rec.relay.rt;
  }
  /* Each relay channel is watched between it and the door, so the row can say when the socket does not get through (board 989,
     src/socket-watch.mjs). A record naming a relay this build does not know (an older build's, or a hand's) opens no channel at
     all: null, and nothing is called for the team, which the row says (followView's elsewhere). */
  function armRelay(rec) {
    let known = true;
    known = !recordElsewhere(rec); /* plant:skr-arm */
    if (!known) return null;
    const C = Engine.relayRules().channel;
    const watch = socketWatch({ clock: x.clock });
    const ch = C.createChannel({ rt: rec.relay.rt, url: rec.relay.url, mirror, stateFile: mirror + ".json", write: writeWhole,
      pin: () => ({ teamId: rec.team, rt: rec.relay.rt, lead: pin() }),
      me: () => ({ keyId: me.id, public: me.key, privateKey: me.privateKey, place: "desk:" + me.id, box: me.box }),
      agree: agreeOf(me.boxKey), /* plant:962s7b-agree */
      keyFor, sealEpoch: () => { const eps = Object.keys(now().keys).map(Number); return eps.length ? Math.max(...eps) : null; },
      invite: () => { const c = now(); const i = c.invite; return i && i.relay ? { inv: i.relay.inv, token: i.relay.token, seal: C.inviteSealKey(i.secret), box: i.box || undefined } : null; },
      onTeam: heedNow, onAnswer: (a) => { answered = a; noteRefusal(a); }, onRemoved: () => { try { Store.markFollowing(x.teamsFile, rec.team, "removed"); } catch { /* said at the next look */ } tell("removed"); },
      request: watch.request(x.request), connect: watch.connect(x.connect), say: x.say, clock: x.clock, watch: x.watch, pollMs: x.pollMs,
      /* A team whose licence follows Entra asks this Studio's session for its person's lead-seat certificate, named for the member key. */
      seat: x.seat, seatRenew: x.seatRenew, onSeat: x.onSeat ? (s) => x.onSeat(rec.team, s) : undefined }); /* plant:c1-member-seat */
    ch.start();
    const settle = async (ms) => {
      let timer = null;
      const late = new Promise((r) => { timer = setTimeout(r, Number(ms) || 0); if (timer.unref) timer.unref(); });
      const sent = (async () => { for (let i = 0; i < 3; i++) { ch.kick(); await ch.idle(); } })();
      try { await Promise.race([sent, late]); } finally { clearTimeout(timer); }
    };
    return { kind: "relay", rt: rec.relay.rt, run: ch, kick: () => ch.kick(), idle: () => ch.idle(), settle, stop: () => ch.stop(), notLive: watch.notLive };
  }
  /* After onChange returns. idle captures switchWait before its first await, so this job is the one it waits for.
     A missing relay transport is not armed. */
  function queueSwitch() {
    if (stopped || switchWait) return switchWait;
    let finish = null;
    const job = new Promise((resolve) => { finish = resolve; });
    switchWait = job;
    setImmediate(() => {
      const run = (async () => {
        if (stopped || switching) return;
        const rec = now();
        if (!needsSwitch(rec)) return;
        if (typeof x.request !== "function" || typeof x.connect !== "function") return;
        switching = true;
        const prev = transport;
        try {
          if (prev) {
            try { if (typeof prev.settle === "function") await prev.settle(5000); /* plant:974c1c-settle */ } catch { /* stopped all the same */ }
            try { await prev.stop(); } catch { /* the next channel still starts */ }
          }
          if (stopped) return;
          transport = armRelay(rec);
          if (transport) transport.kick();
        } finally { switching = false; }
      })();
      run.then(() => { if (switchWait === job) switchWait = null; finish(); }, () => { if (switchWait === job) switchWait = null; finish(); });
    });
    return job;
  }
  async function idle() {
    const waited = switchWait;
    if (transport) await transport.idle();
    const job = waited || switchWait;
    if (job) { await job; if (transport) await transport.idle(); }
  }
  transport = armRelay(f);
  return {
    team: f.team,
    get channel() { return (now() || f).channel; },
    mirror,
    get run() { return transport ? transport.run : null; },
    kick: () => { if (transport && !stopped) transport.kick(); },
    idle, settle: (ms) => (transport && transport.settle ? transport.settle(ms) : Promise.resolve(false)),
    stop: async () => { stopped = true; if (transport) await transport.stop(); },
    heed: heedNow, answer: () => answered,
    /* True while the relay's socket does not get through and the asking does (board 989). */
    notLive: () => !stopped && !!transport && typeof transport.notLive === "function" && transport.notLive(),
  };
}

/** Writes the in-use file a member names its catalog in by: `catalog` {id, rev, sha256}, signed by the member key as a desk's
 *  file is and sealed for the team under the newest key kept. */
function writeInUse(o) {
  const x = o || {};
  const f = Store.followingOf(x.teamsFile, x.vault);
  const me = openMember(x.memberFile, x.vault, { signingPublic: x.signingPublic });
  if (!f || !f.lead || !me) throw refused(SAID.none);
  /* A record that follows through a folder (an older Studio's) is followed by nothing now, so nothing is written for it, not even
     into the mirror: the shell's inUseUp takes a refusal as "waits for the next take". */
  let onRelay = false;
  onRelay = f.channel === "relay"; /* plant:as4-8a-inuse */
  if (!onRelay) throw refused(SAID.none);
  const eps = Object.keys(f.keys).map(Number);
  if (!eps.length) throw refused(SAID.none);
  const epoch = Math.max(...eps), c = x.catalog || {};
  const doc = { format: 1, kind: IN_USE_KIND, desk: { id: me.id, key: me.key, box: me.box }, at: new Date(x.now == null ? Date.now() : x.now).toISOString(),
    catalog: { id: String(c.id || ""), rev: Number.isSafeInteger(c.rev) ? c.rev : 0, sha256: String(c.sha256 || "") }, sig: { alg: "Ed25519", keyId: me.id } };
  doc.sig.value = crypto.sign(null, Engine.deskRules().branchSignedBytes(doc), me.privateKey).toString("hex");
  const sealed = Engine.sealRules().sealCatalog(f.keys[String(epoch)], f.team, epoch, JSON.stringify(doc));
  return memberWrite(x.teamsFile, f.team, me, "in-use.ec", JSON.stringify(sealed) + "\n");
}

/** Leaves the followed team: both of this member's files are taken off its place (sent by the relay channel), the run `o.run`
 *  is given up to `o.ms` to send that and is stopped, and only then do the record and the relay channel's state leave, so a
 *  later join starts from nothing of this one. Answers {team, mirror} for the shell to move the mirror to the Recycle Bin, or
 *  null where nothing is followed. Every edition already taken stays where it was taken. */
async function leaveTeam(o) {
  const x = o || {};
  const f = Store.followingOf(x.teamsFile, x.vault);
  if (!f) return null;
  const pub = memberPublic(x.memberFile);
  const mirror = followMirror(x.teamsFile, f.team);
  const gone = MEMBER_FILES.slice(); /* plant:962s7p-files */
  for (const name of gone) {
    if (!pub || !fs.existsSync(path.join(mirror, "desks", pub.id, name))) continue;
    try { memberWrite(x.teamsFile, f.team, pub, name, null); } catch { /* the record goes all the same */ }
  }
  if (x.run) {
    try { if (typeof x.run.settle === "function") await x.run.settle(x.ms == null ? 5000 : x.ms); } catch { /* stopped all the same */ }
    try { await x.run.stop(); } catch { /* already down */ }
  }
  Store.forgetFollowing(x.teamsFile, f.team);
  fs.rmSync(mirror + ".json", { force: true }); /* plant:962s7p-state */
  return { team: f.team, mirror };
}

/** Keeps the followed team a backup copy brought back (src/team-store.mjs followBackupRow's row), as followed, with its pin and
 *  its keys, sealed by this computer's vault. A team followed here already stays, and false is answered. */
function followFromBackup(teamsFile, vault, row, memberId) {
  if (!row || typeof row !== "object" || !/^t-[0-9a-f]{16}$/.test(String(row.team)) || !row.lead || !HEX64.test(String(row.lead.public))) return false;
  if (typeof memberId !== "string" || !memberId || row.member !== memberId) return false; /* required: no caller skips the member check */
  if (Store.followingOf(teamsFile, vault)) return false;
  const keys = {};
  for (const ep of Object.keys(row.keys || {})) if (/^[1-9][0-9]*$/.test(ep) && HEX64.test(String(row.keys[ep]))) keys[ep] = String(row.keys[ep]);
  try {
    Store.keepFollowing(teamsFile, vault, row.team, { channel: row.channel, folder: row.folder || "", relay: row.relay || null, member: row.member,
      leadName: row.leadName }, { lead: { keyId: String(row.lead.keyId), public: String(row.lead.public) }, chain: Array.isArray(row.chain) ? row.chain : [], keys, invite: null,
      floor: row.floor || null });
    Store.markFollowing(teamsFile, row.team, "following");
    return true;
  } catch { return false; }
}

/** The lapse a desk's channel would show, read from that channel's own state file (the pinned layer already keeps it, and
 *  keeps asking). Null where nothing was told, or where the step a desk shows is none. No second reading of a refusal body. */
function followLapseOf(teamsFile, team) {
  const C = Engine.relayRules().channel;
  let raw = null;
  try { raw = JSON.parse(fs.readFileSync(followMirror(teamsFile, team) + ".json", "utf8")); } catch { raw = null; }
  const st = C.stateOf(raw, Date.now());
  if (!st.lapse) return null;
  const now = Date.now() + (Number.isSafeInteger(st.skew) ? st.skew : 0);
  const step = C.lapseStep(st.lapse, now);
  if (!step) return null;
  return { step, until: st.lapse.until, readOnly: st.lapse.readOnly, swept: st.lapse.swept };
}

/** The followed team as a page may see it: {team, channel, leadName, state, catalogs: [{catalog, rev, date}],
 *  pending: [catalog id]}, and, where the relay has told a lapse, lapse {step, until, readOnly, swept} as a desk shows it, and
 *  elsewhere: true where the team names a relay this build does not know (fileElsewhere).
 *  Or null. `catalogs` are the editions the mirror holds; `pending` the catalog ids the team file lists with no edition
 *  yet, so a Studio can say it is waiting. No key, no secret and no roster. A lapse does not change the record's state:
 *  a sweep is not a removal, and the channel keeps asking. (Board 974: C12's pending, C17's lapse, merged in fold 9.) */
function followView(teamsFile, vault) {
  const f = Store.followingOf(teamsFile, vault);
  if (!f) return null;
  const editions = followedEditions(teamsFile, vault);
  const held = new Set(editions.map((e) => e.catalog));
  const doc = teamFileIn(followMirror(teamsFile, f.team));
  const listed = doc && Array.isArray(doc.catalogs) ? doc.catalogs : [];
  const pending = [];
  for (const catalogId of listed) {
    if (typeof catalogId === "string" && catalogId && !held.has(catalogId) && pending.indexOf(catalogId) < 0) pending.push(catalogId);
  }
  const view = { team: f.team, channel: f.channel, leadName: f.leadName, state: f.state,
    catalogs: editions.map((e) => ({ catalog: e.catalog, rev: e.rev, date: e.date })),
    pending };
  const lapse = f.channel === "relay" ? followLapseOf(teamsFile, f.team) : null;
  if (lapse) view.lapse = lapse;
  /* True while the record, or the team's genuine file, names a relay this build does not know: the row says that the team is not
     followed there, never the address. Gone once a file names a known one again. */
  let elsewhere = false;
  elsewhere = f.channel === "relay" && (recordElsewhere(f) || fileElsewhere(f, doc)); /* plant:skr-view */
  if (elsewhere) view.elsewhere = true;
  return view;
}

/** What the followed team's row asks where the team's relay refused this Studio's seat (the relay's design note C-6, on the condition
 *  review 47's finding 17 set: with no member certificate Studio asks for the sign-in and says why, never silent and never a team shown
 *  as merely offline). `refused` holds the teams whose relay last refused the seat (the shell's relaySeatRefused, told by the channel's
 *  onSeat) and `st` is the shell's service state: "" where `team` is not among them; "signin" where this Studio is not signed in, so it
 *  holds no member certificate; "removed" where it is and the service found no role; "renew" where the certificate it holds did not hold. */
function seatAskOf(team, refused, st) {
  let asked = false;
  asked = !!refused && typeof refused.has === "function" && refused.has(String(team)); /* plant:c6-ask */
  if (!asked) return "";
  const s = st && typeof st === "object" ? st : {};
  if (s.by !== "signin") return "signin";
  return s.signinNoRole === true ? "removed" : "renew";
}

export { MEMBER_FILE, MEMBER_FILES, FOLLOW_DIR, SAID as MEMBER_SAID, memberKeyFile, followMirror, memberPublic, openMember, ensureMember,
  memberBackupRow, memberFromBackup, followFromBackup, readInvitation, joinRequest, memberWrite, judgeTeam, followedEditions, heed, joinTeam, agreeOf,
  startFollow, writeInUse, leaveTeam, followView, seatAskOf };
