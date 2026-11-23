/* THE TEAMS THIS STUDIO LEADS, BETWEEN SESSIONS (board 834): <userData>/teams.json, never studio.json. Each epoch's key is
 * sealed for this Windows account by `vault` (Electron's safeStorage in the shell, as the desk keeps its own), and a key it
 * will not open is handed to nobody. `sealed: false` is the lead's own Plain, which src/publish.mjs takes as `unsealed`:
 * the share's team file cannot say it, since anybody who writes the share can write one. `file` is the last team file this
 * Studio wrote, public halves and wraps only, so one taken away can be put back. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { writeWhole } from "./whole-write.cjs";
import Saved from "./saved-format.cjs";
import { shownName } from "./invite.mjs";
import * as Engine from "./engine.mjs";
import { conflictSiblingName, revFloor } from "./team.mjs";
import { relayKnown } from "./relay-known.mjs";

const TEAMS_FILE = "teams.json";
const KIND = "etiuda-studio-teams";
const TEAM_ID = /^t-[0-9a-f]{16}$/;
const DESK_ID = /^k-[0-9a-f]{16}$/;
/* Keys of a team this Studio has ended. Beside `teams`, never inside it, so the slot is free and the backup copy still
   carries every epoch. The seals are the ones the team entry held. */
const KEY_BACKUP = "keyBackup";

export const MAX_TEAMS = 3; /* plant:cap-teams */
export const MAX_TEAMMATES = 30; /* plant:cap-teammates */

export const REFUSAL_TEAMMATES_LIMIT = "This Studio already has 30 teammates, open invitations included, so a new one can join only once a place frees.";
export const REFUSAL_TEAMS_LIMIT = "This Studio already leads three teams, the most it can, so a new one cannot be made.";
export const REFUSAL_TEAMS_UNREADABLE = "The teams file cannot be read, so no invitation was made.";

/** Where a Studio whose user data is `userData` keeps its teams. */
function teamsFile(userData) { return path.join(path.resolve(String(userData || ".")), TEAMS_FILE); }

/* The file as read. One that is there and will not read is refused for a write, never replaced: it holds the only copy of the
   keys, and a write over it would lose every team it names. A read for a publish takes it as empty, which seals nothing. */
function readTeams(file, forWrite) {
  let text;
  try { text = fs.readFileSync(file, "utf8"); }
  catch (e) { if (e && e.code === "ENOENT") return { format: 1, kind: KIND, teams: {} }; if (forWrite) throw e; return { format: 1, kind: KIND, teams: {} }; }
  let d = null;
  try { d = JSON.parse(text.replace(/^\uFEFF/, "")); } catch { d = null; }
  /* A FILE A NEWER STUDIO WROTE (updates 2) holds keys this version must not lose: refused for a write, naming the version,
     and read for a publish as holding none. Never an older copy in its place, and never written over. */
  const newer = Saved.savedNewer(d);
  if (newer) { if (forWrite) throw new Error(Saved.newerLine(newer) + " (" + file + ")"); return { format: 1, kind: KIND, teams: {} }; } /* plant:u2-teams-newer */
  if (d && d.kind === KIND && d.teams && typeof d.teams === "object" && !Array.isArray(d.teams)) return d;
  if (forWrite) throw new Error(file + " is not a teams file this Studio reads, and it is left as it is; nothing was written");
  return { format: 1, kind: KIND, teams: {} };
}
/* Every write of the file, stamped with the format and this Studio's version (src/saved-format.cjs). */
function putTeams(file, doc) { writeWhole(file, JSON.stringify(Saved.stamped(doc), null, 1) + "\n"); }
/** Null where this Studio reads `file`; else {format, version} of the newer Studio that wrote it (updates 2). */
function teamsNewer(file) {
  try { return Saved.savedNewer(JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""))); } catch { return null; }
}
function entry(doc, team) {
  if (!TEAM_ID.test(String(team))) throw new Error("a team id is t- and 16 lower-case hex characters");
  const own = Object.prototype.hasOwnProperty.call(doc.teams, team) ? doc.teams[team] : null;
  return doc.teams[team] = Object.assign({ keys: {} }, own && typeof own === "object" ? own : {});
}
function openOne(vault, sealed) {
  try {
    const key = Buffer.from(String(vault.open(Buffer.from(String(sealed), "base64"))), "base64");
    return key.length === 32 ? key : null;
  } catch { return null; }
}

/** Keep `key` (32 bytes) for the team's epoch, sealed by the vault. Refused where the vault cannot seal, and where that epoch
 *  already holds another key: a key for an epoch never changes. */
function keepTeamKey(file, vault, team, epoch, key) {
  if (!Buffer.isBuffer(key) && !(key instanceof Uint8Array)) throw new Error("a team key is 32 bytes");
  const k = Buffer.from(key);
  if (k.length !== 32) throw new Error("a team key is 32 bytes");
  if (!Number.isInteger(epoch) || epoch < 1) throw new Error("a team key is kept under a whole number from 1");
  let can = false;
  try { can = !!vault && vault.available(); } catch { can = false; }
  if (!can) throw new Error("this computer cannot keep a key sealed for this " + (process.platform === "win32" ? "Windows " : "")
    + "account, so no team key was kept");
  const doc = readTeams(file, true), e = entry(doc, String(team));
  const was = Object.prototype.hasOwnProperty.call(e.keys, String(epoch)) ? openOne(vault, e.keys[String(epoch)]) : null;
  if (Object.prototype.hasOwnProperty.call(e.keys, String(epoch)) && !(was && was.equals(k)))
    throw new Error("team " + team + " already keeps a different key under the same number; nothing was written");
  e.keys[String(epoch)] = Buffer.from(vault.seal(k.toString("base64"))).toString("base64");
  putTeams(file, doc);
}

/** Take a team out of the file whole: only for one that was never written to a share. */
function forgetTeam(file, team) {
  const doc = readTeams(file, true);
  if (!Object.prototype.hasOwnProperty.call(doc.teams, String(team))) return;
  delete doc.teams[String(team)];
  putTeams(file, doc);
}

/* The sealed key strings on a team entry, copied, so the backup table does not share the entry's object. */
function sealMap(keys) {
  const out = {};
  if (!keys || typeof keys !== "object" || Array.isArray(keys)) return out;
  Object.keys(keys).forEach((ep) => {
    if (typeof keys[ep] === "string" && keys[ep]) out[String(ep)] = keys[ep];
  });
  return out;
}
function keyBackupTable(doc) {
  const t = doc && doc[KEY_BACKUP];
  return t && typeof t === "object" && !Array.isArray(t) ? t : {};
}
/** End a team this Studio leads: the local slot goes, and the share's team file stays where it is. The team's keys move
 *  to the key backup table, still sealed, so a later backup copy holds them. */
function endTeam(file, team) {
  const doc = readTeams(file, true);
  const id = String(team);
  if (!Object.prototype.hasOwnProperty.call(doc.teams, id)) return;
  const e = doc.teams[id];
  const seals = sealMap(e && e.keys);
  if (TEAM_ID.test(id) && Object.keys(seals).length) {
    const table = keyBackupTable(doc);
    const row = { keys: seals };
    const pending = pendingList(e);
    if (pending.length) row.pending = pending;
    table[id] = row;
    doc[KEY_BACKUP] = table;
  }
  delete doc.teams[id];
  putTeams(file, doc);
}

/** Record the lead's choice for a team, the folder it is for and, where given, the team file as this Studio last wrote it. */
function chooseSealed(file, team, sealed, folder, written) {
  const doc = readTeams(file, true), e = entry(doc, String(team));
  e.sealed = sealed === true;
  if (folder) e.folder = path.resolve(String(folder));
  if (written && typeof written === "object") e.file = JSON.parse(JSON.stringify(written));
  putTeams(file, doc);
}

/** Every key the vault opens, as src/publish.mjs and src/review.mjs take them: {team id: {epoch: 32 bytes}}. */
function teamKeysOf(file, vault) {
  const doc = readTeams(file, false), out = {};
  Object.keys(doc.teams).forEach(t => {
    const keys = (doc.teams[t] && doc.teams[t].keys) || {};
    Object.keys(keys).forEach(ep => {
      const k = openOne(vault, keys[ep]);
      if (k) (out[t] = out[t] || {})[ep] = k;
    });
  });
  return out;
}

/* A key kept before the team file moves (a removal keeps the next epoch's key, then asks the share to write). Until that
   write lands the epoch is pending: it still opens what is sealed for it, and it is not treated as the current epoch. */
function pendingList(e) {
  const raw = e && Array.isArray(e.pending) ? e.pending : [];
  return raw.map(Number).filter((n) => Number.isInteger(n) && n >= 1);
}

/** Mark the key kept for `epoch` as not yet written into the team file. */
function markKeyPending(file, team, epoch) {
  if (!Number.isInteger(epoch) || epoch < 1) throw new Error("a pending key is a whole number from 1");
  const doc = readTeams(file, true), e = entry(doc, String(team));
  const list = pendingList(e);
  if (list.indexOf(epoch) >= 0) return;
  list.push(epoch);
  list.sort((a, b) => a - b);
  e.pending = list;
  putTeams(file, doc);
}

/** The team file at `epoch` has been written, so the key kept for it is current. Any pending marks at or below `epoch`
 *  are cleared. Nothing is written where none were pending. */
function clearKeyPending(file, team, epoch) {
  const n = Number(epoch);
  if (!Number.isInteger(n) || n < 1) return;
  const doc = readTeams(file, true);
  if (!Object.prototype.hasOwnProperty.call(doc.teams, String(team))) return;
  const e = doc.teams[String(team)];
  if (!e || typeof e !== "object" || !Array.isArray(e.pending)) return;
  const was = pendingList(e);
  const list = was.filter((x) => x > n);
  if (list.length === was.length) return;
  if (list.length) e.pending = list;
  else delete e.pending;
  putTeams(file, doc);
}

/** Epochs kept ahead of each team's file: {team id: [epoch]}. Empty where none are waiting. */
function pendingEpochsOf(file) {
  const doc = readTeams(file, false), out = {};
  Object.keys(doc.teams).forEach((t) => {
    const list = pendingList(doc.teams[t]);
    if (list.length) out[t] = list;
  });
  return out;
}

/* Keys the backup table still holds after a team was ended, opened the same way as a live team's. A seal that does not
   open is absent. A live team is not read here. */
function endedKeysOf(file, vault) {
  const doc = readTeams(file, false), table = keyBackupTable(doc), out = {};
  Object.keys(table).forEach((t) => {
    if (!TEAM_ID.test(t)) return;
    const keys = table[t] && table[t].keys;
    if (!keys || typeof keys !== "object") return;
    Object.keys(keys).forEach((ep) => {
      const k = openOne(vault, keys[ep]);
      if (k) (out[t] = out[t] || {})[ep] = k;
    });
  });
  return out;
}
function endedPendingOf(file) {
  const doc = readTeams(file, false), table = keyBackupTable(doc), out = {};
  Object.keys(table).forEach((t) => {
    if (!TEAM_ID.test(t)) return;
    const list = pendingList(table[t]);
    if (list.length) out[t] = list;
  });
  return out;
}
/** Every epoch the key backup should carry: the live teams, then a team this Studio has ended. `held`, where the shell
 *  has already opened the live keys, is those keys and their pending marks, so a failed live read is not tried again.
 *  A live key wins where the same epoch is also in the backup table. One row is {team, epoch, key, pending?}. */
function epochRowsOf(file, vault, held) {
  const live = held && held.keys && typeof held.keys === "object" && !Array.isArray(held.keys) ? held.keys : teamKeysOf(file, vault);
  let pending = {};
  if (held && held.pending && typeof held.pending === "object" && !Array.isArray(held.pending)) pending = held.pending;
  else { try { pending = pendingEpochsOf(file); } catch { pending = {}; } }
  const keys = {};
  Object.keys(live).forEach((t) => {
    if (live[t] && typeof live[t] === "object") keys[t] = live[t];
  });
  const ended = endedKeysOf(file, vault);
  Object.keys(ended).forEach((t) => {
    const have = keys[t] && typeof keys[t] === "object" ? keys[t] : null;
    keys[t] = have ? Object.assign({}, ended[t], have) : ended[t];
  });
  let endedPending = {};
  try { endedPending = endedPendingOf(file); } catch { endedPending = {}; }
  const waitFor = {};
  Object.keys(endedPending).forEach((t) => { waitFor[t] = endedPending[t]; });
  Object.keys(pending).forEach((t) => { if (Array.isArray(pending[t])) waitFor[t] = pending[t]; });
  const rows = [];
  Object.keys(keys).forEach((team) => {
    if (!TEAM_ID.test(String(team))) return;
    const byEpoch = keys[team] && typeof keys[team] === "object" ? keys[team] : {};
    const wait = new Set((Array.isArray(waitFor[team]) ? waitFor[team] : []).map(Number));
    Object.keys(byEpoch).forEach((ep) => {
      const epoch = Number(ep);
      let key;
      try { key = Buffer.from(byEpoch[ep]); } catch { return; }
      if (!Number.isInteger(epoch) || epoch < 1 || key.length !== 32) return;
      const row = { team, epoch, key };
      if (wait.has(epoch)) row.pending = true;
      rows.push(row);
    });
  });
  return rows;
}

/** The teams the lead has turned to Plain here. */
function unsealedOf(file) {
  const doc = readTeams(file, false);
  return Object.keys(doc.teams).filter(t => doc.teams[t] && doc.teams[t].sealed === false);
}

/** What this Studio knows of one team without opening a key: its choice, its folder, its epochs and its kept file. */
function keptTeam(file, team) {
  const doc = readTeams(file, false), e = Object.prototype.hasOwnProperty.call(doc.teams, String(team)) ? doc.teams[String(team)] : null;
  if (!e) return null;
  return { sealed: e.sealed === true ? true : e.sealed === false ? false : null, folder: e.folder || null,
           epochs: Object.keys(e.keys || {}).map(Number).filter(Number.isFinite).sort((a, b) => a - b), file: e.file || null,
           relay: relayIn(e) ? { rt: e.relay.rt, url: e.relay.url } : null };
}

/** Whether this Studio holds the team a project names, from teams.json alone: "held" where a row is kept for the team (by its id, or by
 *  the relay team id the project's place names) and the row holds a key, "none" where the file is not there or reads whole and keeps no
 *  such row (a relay row with no key in it, which opening a project on a team this Studio cannot open leaves, holds nothing), and
 *  "unreadable" where it is there and will not read, or a newer Studio wrote it, which says nothing of who holds what. */
function teamHeldBy(file, mark) {
  let text;
  try { text = fs.readFileSync(file, "utf8"); } catch (e) { return e && e.code === "ENOENT" ? "none" : "unreadable"; }
  let d = null;
  try { d = JSON.parse(text.replace(/^﻿/, "")); } catch { d = null; }
  if (d && Saved.savedNewer(d)) return "unreadable"; /* plant:letgo-newer */
  if (!d || d.kind !== KIND || !d.teams || typeof d.teams !== "object" || Array.isArray(d.teams)) return "unreadable"; /* plant:letgo-unreadable */
  const m = mark || {}, rows = d.teams;
  const keyed = (e) => !!e && typeof e === "object" && !!e.keys && typeof e.keys === "object" && Object.keys(e.keys).length > 0;
  if (m.team && Object.prototype.hasOwnProperty.call(rows, String(m.team)) && keyed(rows[String(m.team)])) return "held"; /* plant:letgo-row */
  if (m.rt && Object.keys(rows).some(t => relayIn(rows[t]) && rows[t].relay.rt === String(m.rt) && keyed(rows[t]))) return "held";
  return "none";
}

/** The team this Studio last wrote for a folder, by its kept copy: what the Desks screen offers to put back. */
function teamForFolder(file, folder) {
  const doc = readTeams(file, false), at = path.resolve(String(folder || ""));
  const hit = Object.keys(doc.teams).filter(t => doc.teams[t] && typeof doc.teams[t].folder === "string" && samePath(path.resolve(doc.teams[t].folder), at) && doc.teams[t].file);
  return hit.length === 1 ? hit[0] : null;
}

/* ---- invitations (board 885, S2) -------------------------------------------------------------------------------------
 * An invitation is kept under its team as {secret, made, expires, name, state}, the secret sealed by the vault as a team
 * key is, and `state` "live" until it is "spent" at an admission or "withdrawn" by the lead; an ended one keeps its record,
 * so a request that names it again is told why, and loses its secret, which has nothing left to prove. */
const INVITE_ID = /^[0-9a-f]{16}$/;
const INVITE_SECRET = /^[0-9a-f]{32}$/;
const invitesIn = (e) => (e && e.invites && typeof e.invites === "object" && !Array.isArray(e.invites) ? e.invites : {});

/** Keep a new invitation for `team`: {id, secret, made, expires, name}, and for a team on the relay `relay`: {inv, token,
 *  seal}, the relay's id for it (32 hex), the token whose sha256 the relay is told (64 hex) and the 32-byte key the team file's
 *  copy for it is sealed under, the last two sealed by the vault. Refused where the vault cannot seal, and where the id is
 *  kept already. */
function keepInvite(file, vault, team, inv) {
  const i = inv || {};
  if (!INVITE_ID.test(String(i.id)) || !INVITE_SECRET.test(String(i.secret))) throw new Error("an invitation is an id of 16 and a secret of 32 lower-case hex characters");
  let can = false;
  try { can = !!vault && vault.available(); } catch { can = false; }
  if (!can) throw new Error("this computer cannot keep an invitation sealed for this account, so none was kept");
  const doc = readTeams(file, true), e = entry(doc, String(team));
  const list = invitesIn(e);
  if (Object.prototype.hasOwnProperty.call(list, String(i.id))) throw new Error("invitation " + i.id + " is kept already; nothing was written");
  list[String(i.id)] = { secret: Buffer.from(vault.seal(String(i.secret))).toString("base64"), made: String(i.made || ""),
    expires: String(i.expires || ""), name: String(i.name || ""), state: "live" };
  if (i.relay !== undefined) {
    const r = i.relay || {}, seal = Buffer.isBuffer(r.seal) || r.seal instanceof Uint8Array ? Buffer.from(r.seal) : null;
    if (!RELAY_INV.test(String(r.inv)) || !RELAY_TOKEN.test(String(r.token)) || !seal || seal.length !== 32)
      throw new Error("a relay invitation is an id of 32 and a token of 64 lower-case hex characters, and a 32-byte key; nothing was written");
    list[String(i.id)].relay = { inv: String(r.inv), token: Buffer.from(vault.seal(String(r.token))).toString("base64"),
      seal: Buffer.from(vault.seal(seal.toString("base64"))).toString("base64") };
  }
  list[String(i.id)].person = typeof i.person === "string" ? shownName(i.person) : ""; /* plant:s3-person */
  e.invites = list;
  putTeams(file, doc);
}

/** A team's invitations as the page may see them, newest first: {id, made, expires, name, person, relay, used, state,
 *  pendingMove}. `person` is the name the lead gave, kept in this book only. `relay` is whether it names a relay team.
 *  `used` is the relay's first-use time in milliseconds, or null. `pendingMove` keeps a withdrawn row up until its
 *  confirm moves the epoch. `state` is "expired" for a live one past its end at `now`. `reopened` marks a live one whose desk
 *  took its request back at the relay (reviveInvite). Never a secret. */
function invitesOf(file, team, now) {
  const doc = readTeams(file, false), e = Object.prototype.hasOwnProperty.call(doc.teams, String(team)) ? doc.teams[String(team)] : null;
  const when = now == null ? Date.now() : new Date(now).getTime(), list = invitesIn(e);
  return Object.keys(list).filter(id => INVITE_ID.test(id) && list[id] && typeof list[id] === "object").map(id => {
    const r = list[id], live = r.state === "live";
    const row = { id, made: String(r.made || ""), expires: String(r.expires || ""), name: String(r.name || ""),
             person: typeof r.person === "string" ? r.person : "", relay: !!(r.relay && typeof r.relay === "object"),
             used: r.relay && Number.isFinite(r.relay.relayUsed) ? r.relay.relayUsed : null,
             pendingMove: !!(r.relay && r.relay.pendingMove === true),
             state: live && !(Date.parse(String(r.expires || "")) > when) ? "expired" : live ? "live" : String(r.state || "") };
    if (r.relay && r.relay.registered === true) row.registered = true;
    if (r.relay && r.relay.reopened === true && row.state === "live") row.reopened = true;
    return row;
  }).sort((a, b) => (a.made < b.made ? 1 : a.made > b.made ? -1 : 0));
}

/** How many invitations of `team` can still let a desk in at `now`. The same row invitesOf calls live, and the same
 *  facts inviteState requires before it checks a proof: state live, not past its end, a secret still kept, and not
 *  already named on `roster`. A relay invitation and a folder invitation are that same row. A number, and nothing else. */
function liveInvitesOf(file, team, now, roster) {
  const doc = readTeams(file, false);
  const e = Object.prototype.hasOwnProperty.call(doc.teams, String(team)) ? doc.teams[String(team)] : null;
  const when = now == null ? Date.now() : new Date(now).getTime();
  const used = new Set();
  if (Array.isArray(roster)) for (const row of roster) {
    if (row && typeof row.invite === "string" && row.invite) used.add(row.invite);
  }
  const list = invitesIn(e);
  let n = 0;
  for (const id of Object.keys(list)) {
    const r = list[id];
    if (!INVITE_ID.test(id) || !r || typeof r !== "object" || r.state !== "live") continue;
    if (!(Date.parse(String(r.expires || "")) > when)) continue;
    if (typeof r.secret !== "string" || !r.secret) continue;
    if (used.has(id)) continue;
    n++;
  }
  return n;
}

/** Every invitation this Studio made, by id, for the thread to check a request's proof against: {team, state, expires,
 *  secret}, the secret opened by the vault for a live one alone, and absent where it will not open. */
function inviteBookOf(file, vault) {
  const doc = readTeams(file, false), out = {};
  Object.keys(doc.teams).forEach(t => {
    const list = invitesIn(doc.teams[t]);
    Object.keys(list).forEach(id => {
      const r = list[id];
      if (!INVITE_ID.test(id) || !r || typeof r !== "object") return;
      const b = { team: t, state: String(r.state || ""), expires: String(r.expires || "") };
      if (b.state === "live" && r.secret) {
        try {
          const s = String(vault.open(Buffer.from(String(r.secret), "base64")));
          if (INVITE_SECRET.test(s)) b.secret = s;
        } catch { /* a secret this account cannot open proves nothing */ }
      }
      const seen = seenOf(r.seen);
      if (Object.keys(seen).length) b.seen = seen;
      out[id] = b;
    });
  });
  return out;
}

/* The times this Studio first saw a request naming an invitation: desk id to an ISO time. A key that is not a desk id, or a
   time that does not parse, is left out. This stays on this computer's teams file. The page's invitation row does not carry it. */
function seenOf(raw) {
  const out = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const id of Object.keys(raw)) {
    if (!DESK_ID.test(id)) continue;
    const at = raw[id];
    if (typeof at !== "string" || !Number.isFinite(Date.parse(at))) continue;
    out[id] = at;
  }
  return out;
}

/** Writes, once, the time this Studio first saw each request in `sightings` ({invite, desk}) that names a kept invitation
 *  of `team`. A desk already recorded keeps the time it was first seen. Answers {invite id: {desk id: iso}} for every
 *  invitation of the team that has a time. Nothing is written where every named desk was already seen. */
function noteFirstSeen(file, team, sightings, now) {
  const stamp = new Date(now == null ? Date.now() : now).toISOString();
  const doc = readTeams(file, true);
  const out = {};
  if (!Object.prototype.hasOwnProperty.call(doc.teams, String(team))) return out;
  const e = doc.teams[String(team)], list = invitesIn(e);
  let wrote = false;
  for (const row of Array.isArray(sightings) ? sightings : []) {
    const id = row && typeof row.invite === "string" ? row.invite : "";
    const desk = row && typeof row.desk === "string" ? row.desk : "";
    if (!INVITE_ID.test(id) || !DESK_ID.test(desk)) continue;
    const rec = Object.prototype.hasOwnProperty.call(list, id) ? list[id] : null;
    if (!rec || typeof rec !== "object") continue;
    const seen = seenOf(rec.seen);
    if (!Object.prototype.hasOwnProperty.call(seen, desk)) {
      seen[desk] = stamp;
      rec.seen = seen;
      wrote = true;
    }
  }
  if (wrote) {
    e.invites = list;
    putTeams(file, doc);
  }
  for (const id of Object.keys(list)) {
    const rec = list[id];
    if (!INVITE_ID.test(id) || !rec || typeof rec !== "object") continue;
    const seen = seenOf(rec.seen);
    if (Object.keys(seen).length) out[id] = seen;
  }
  return out;
}

/* A desk this Studio refused because its invitation was already used: {desk, name, at}, kept on that invitation until the
   lead dismisses it or the team moves to a new key. A desk id that is not one, or a time that does not parse, is left out.
   The name is the one the lead would have read. This stays on this computer's teams file. The page's invitation row does not carry it. */
function triedOf(raw) {
  const out = [];
  if (!Array.isArray(raw)) return out;
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const desk = typeof row.desk === "string" ? row.desk : "";
    const at = row.at;
    if (!DESK_ID.test(desk) || typeof at !== "string" || !Number.isFinite(Date.parse(at))) continue;
    out.push({ desk: desk, name: shownName(row.name), at: at });
  }
  return out;
}

/** The refused attempts this Studio has kept for `team`: {invite, desk, name, at}, in the book's order. A fresh read of the file. */
function noticesOf(file, team) {
  const doc = readTeams(file, false);
  const e = Object.prototype.hasOwnProperty.call(doc.teams, String(team)) ? doc.teams[String(team)] : null;
  const list = invitesIn(e), out = [];
  for (const id of Object.keys(list)) {
    const rec = list[id];
    if (!INVITE_ID.test(id) || !rec || typeof rec !== "object") continue;
    for (const row of triedOf(rec.tried)) out.push({ invite: id, desk: row.desk, name: row.name, at: row.at });
  }
  return out;
}

/** Writes, once each, that a desk in `sightings` ({invite, desk, name}) was refused because that invitation was already used.
 *  A desk already recorded is left as it was. The time is the one this Studio first saw the request, where the book or `invites`
 *  has it, and otherwise `now`. Nothing is written where every named desk was already recorded. The invitation's seen times stay. */
function noteTried(file, team, sightings, invites, now) {
  const fallback = new Date(now == null ? Date.now() : now).toISOString();
  const doc = readTeams(file, true);
  if (!Object.prototype.hasOwnProperty.call(doc.teams, String(team))) return false;
  const e = doc.teams[String(team)], list = invitesIn(e);
  const book = invites && typeof invites === "object" && !Array.isArray(invites) ? invites : {};
  let wrote = false;
  for (const row of Array.isArray(sightings) ? sightings : []) {
    const id = row && typeof row.invite === "string" ? row.invite : "";
    const desk = row && typeof row.desk === "string" ? row.desk : "";
    if (!INVITE_ID.test(id) || !DESK_ID.test(desk)) continue;
    const rec = Object.prototype.hasOwnProperty.call(list, id) ? list[id] : null;
    if (!rec || typeof rec !== "object") continue;
    const tried = triedOf(rec.tried);
    if (tried.some((t) => t.desk === desk)) continue;
    const fromBook = book[id] && book[id].seen && typeof book[id].seen === "object" ? book[id].seen[desk] : "";
    const fromFile = seenOf(rec.seen)[desk] || "";
    const stamp = (typeof fromBook === "string" && Number.isFinite(Date.parse(fromBook)) ? fromBook : "")
      || (typeof fromFile === "string" && Number.isFinite(Date.parse(fromFile)) ? fromFile : "")
      || fallback;
    const shown = shownName(row && row.name);
    tried.push({ desk: String(desk), name: shown, at: stamp }); rec.tried = tried; wrote = true; /* plant:seen-shown */
  }
  if (wrote) {
    e.invites = list;
    putTeams(file, doc);
  }
  return wrote;
}

/** Takes one refused attempt off invitation `invite`: the desk the lead dismissed. Nothing is written where it was not kept. */
function dismissTried(file, team, invite, desk) {
  const id = String(invite || ""), who = String(desk || "");
  if (!INVITE_ID.test(id) || !DESK_ID.test(who)) return false;
  const doc = readTeams(file, true);
  if (!Object.prototype.hasOwnProperty.call(doc.teams, String(team))) return false;
  const e = doc.teams[String(team)], list = invitesIn(e);
  const rec = Object.prototype.hasOwnProperty.call(list, id) ? list[id] : null;
  if (!rec || typeof rec !== "object") return false;
  const had = triedOf(rec.tried);
  const tried = had.filter((t) => t.desk !== who);
  if (tried.length === had.length) return false;
  if (tried.length) rec.tried = tried;
  else delete rec.tried;
  e.invites = list;
  putTeams(file, doc);
  return true;
}

/** Forgets every refused attempt this Studio kept for `team`. Nothing is written where none was kept. A key move calls this
 *  once the new key is in the team file, so the line does not outlive the remedy. */
function clearTried(file, team) {
  const doc = readTeams(file, true);
  if (!Object.prototype.hasOwnProperty.call(doc.teams, String(team))) return false;
  const e = doc.teams[String(team)], list = invitesIn(e);
  let wrote = false;
  for (const id of Object.keys(list)) {
    const rec = list[id];
    if (!rec || typeof rec !== "object" || !triedOf(rec.tried).length) continue;
    delete rec.tried;
    wrote = true;
  }
  if (!wrote) return false;
  e.invites = list;
  putTeams(file, doc);
  return true;
}

/** The secret of the team's live invitation `id`, opened by the vault, or null. */
function inviteSecretOf(file, vault, team, id) {
  const b = inviteBookOf(file, vault)[String(id)];
  return b && b.team === String(team) && b.state === "live" && b.secret ? b.secret : null;
}

/** Forgets the secret of invitation `id` and leaves the record, so an invitation past its end can no longer be sealed
 *  again. An invitation with no secret is left as it is. Admitted and withdrawn invitations already lose it in endInvite. */
function forgetInviteSecret(file, team, id) {
  const doc = readTeams(file, true);
  if (!Object.prototype.hasOwnProperty.call(doc.teams, String(team))) return false;
  const e = doc.teams[String(team)], list = invitesIn(e);
  const r = Object.prototype.hasOwnProperty.call(list, String(id)) ? list[String(id)] : null;
  if (!r || typeof r !== "object" || !r.secret) return false;
  delete r.secret;
  e.invites = list;
  putTeams(file, doc);
  return true;
}

/** Ends the team's invitation `id`: "spent" by the desk it let in, or "withdrawn" by the lead. Its secret goes, and its
 *  record stays. An invitation already ended keeps its first end. Answers whether anything was written.
 *  A relay invitation spent by a desk keeps its sealed secret until it is let go (`gone`, markRelayInvite): until the relay has
 *  enrolled that desk's key, the desk may still take its request back there, and the invitation is then live again (reviveInvite). */
function endInvite(file, team, id, how, desk, now) {
  if (how !== "spent" && how !== "withdrawn" && how !== "ended") throw new Error("an invitation ends spent, withdrawn or ended");
  const doc = readTeams(file, true);
  if (!Object.prototype.hasOwnProperty.call(doc.teams, String(team))) return false;
  const e = doc.teams[String(team)], list = invitesIn(e), r = Object.prototype.hasOwnProperty.call(list, String(id)) ? list[String(id)] : null;
  if (!r || typeof r !== "object" || r.state !== "live") return false;
  let keep = false;
  keep = how === "spent" && !!desk && !!r.relay && typeof r.relay === "object" && r.relay.gone !== true; /* plant:e4s-keep-secret */
  if (!keep) delete r.secret;
  if (r.relay && typeof r.relay === "object") delete r.relay.reopened;
  r.state = how;
  r.ended = new Date(now == null ? Date.now() : now).toISOString();
  if (how === "spent" && desk) r.desk = String(desk);
  e.invites = list;
  putTeams(file, doc);
  return true;
}

/** A relay invitation the book calls spent, live again: its desk took its request back at the relay before its key was enrolled
 *  (E4 of relay-life-h345), so the yes it was given stands for nothing and the same invitation lets that desk ask again. Its
 *  desk is kept, so its key opens that desk's requests and no other's (src/relay.mjs). It is marked `reopened` for the Desks
 *  row until it is next used, ended or let go. Only where its sealed secret is still kept and it has not been let go. Answers
 *  whether anything was written. */
function reviveInvite(file, team, id, desk) {
  const doc = readTeams(file, true);
  if (!Object.prototype.hasOwnProperty.call(doc.teams, String(team))) return false;
  const e = doc.teams[String(team)], list = invitesIn(e), r = Object.prototype.hasOwnProperty.call(list, String(id)) ? list[String(id)] : null;
  if (!r || typeof r !== "object" || (r.state !== "spent" && r.state !== "live") || !r.secret || !r.relay || r.relay.gone === true) return false;
  r.state = "live";
  delete r.ended;
  if (desk && !r.desk) r.desk = String(desk);
  r.relay.reopened = true; /* plant:e4s-reopened */
  e.invites = list;
  putTeams(file, doc);
  return true;
}

/* ---- the relay (board 900, relay slice 1, step 5) ---------------------------------------------------------------------
 * A team on the relay keeps {rt, url} under its entry, and its folder is the mirror the channel layer keeps in step with the
 * relay, <the user data folder>/relay/<rt>/, so the watch, the Desks screen and every led-team read find it as they find a
 * share. Beside them the lead's bookkeeping of the relay's own calls: whether its space was made, the last enrolled set of
 * desks and its rev, the last head written. A relay invitation keeps {inv, token, seal} beside its secret until the desk it
 * let in has read its wrap, and is then let go (`gone`), its token and key dropped. A desk taken off the team keeps a
 * record (`removed`): its key, when, at which new key number, and the files its folder held then, which stay the record of
 * what it said while trusted (Claude alpha's ruling of 2026-10-17 11:01). */
const RELAY_RT = /^[0-9a-f]{32}$/;
const RELAY_INV = /^[0-9a-f]{32}$/;
const RELAY_TOKEN = /^[0-9a-f]{64}$/;
const relayIn = (e) => !!e && !!e.relay && typeof e.relay === "object" && RELAY_RT.test(String(e.relay.rt)) && typeof e.relay.url === "string";

/** Where the mirror of the relay team `rt` sits for the Studio whose teams file is `file`. */
function relayMirror(file, rt) {
  if (!RELAY_RT.test(String(rt))) throw new Error("a relay team id is 32 lower-case hex characters");
  return path.join(path.dirname(path.resolve(String(file))), "relay", String(rt));
}

/* The place functions, from the caller or from the pin. Null where the pin does not carry them yet: the stored absolute
   path then stands, which is what a record without a place has always done. */
function placeFnsOf(opts, need) {
  const o = opts || {};
  if (o.placeFns && typeof o.placeFns[need] === "function") return o.placeFns;
  try {
    const live = Engine.placeRules();
    if (live && typeof live[need] === "function") return live;
  } catch (e) { /* the pin has no place rule */ }
  return null;
}
/** Where this computer would read `project`, and which way that was found: {path, how, why}. how is "root" for a sync
 *  root of the same kind, "absolute" for the path the record stored, "ask" where neither is there. why is "" for a root,
 *  "plain" for a record with no place, "absent" where this computer has no root of that kind, "missing" where the folder
 *  is not there. Never throws. */
function folderSaid(project, opts) {
  const stored = project && project.folder ? String(project.folder) : "";
  const o = opts || {};
  const rules = placeFnsOf(o, "placeResolve");
  if (!rules || !project || !project.place) return { path: stored, how: stored ? "absolute" : "ask", why: "plain" };
  try {
    const roots = o.roots !== undefined ? o.roots : rules.syncRootsFrom(rules.readSyncRecords(o.io == null ? null : o.io));
    const got = rules.placeResolve(stored, project.place, roots, typeof o.present === "function" ? o.present : undefined);
    if (!got || typeof got.path !== "string") return { path: stored, how: "absolute", why: "plain" };
    return got;
  } catch (e) { return { path: stored, how: "absolute", why: "plain" }; }
}
/** The place of `folder` against the records `opts` names, or null where it sits under none. `opts.roots` is the list
 *  syncRootsFrom returns; omitted, the pin's own records are read. */
function placeFor(folder, opts) {
  const o = opts || {};
  const rules = placeFnsOf(o, "placeOf");
  if (!rules) return null;
  try {
    const roots = o.roots !== undefined ? o.roots : rules.syncRootsFrom(rules.readSyncRecords(o.io == null ? null : o.io));
    return rules.placeOf(String(folder || ""), roots) || null;
  } catch (e) { return null; }
}
/** placeFor after a look for Drive's roots wherever the folder could be on Drive (src/engine.mjs driveLookFor), so a place on
 *  a default Drive install is written as the desk reads it (board 955, condition 2). */
async function placeForLooked(folder, opts) {
  await Engine.driveLookFor(folder); /* plant:st-place-look */
  return placeFor(folder, opts);
}
/* The folder this computer reads a project from. A relay team's shared project.json keeps the folder of the computer
   that made the team. Another computer of the same lead names its own mirror, from the relay team id and its own teams
   file, and nothing here writes that path back. With no teams file named, the stored folder stands. A folder team whose
   record carries a place is read from this computer's root of that kind; how "ask" keeps the stored path, and the
   existing picker is the ask. */
function folderHere(project, opts) {
  const stored = project && project.folder ? String(project.folder) : null;
  const rt = project && project.relay && RELAY_RT.test(String(project.relay.rt || "")) ? String(project.relay.rt) : "";
  const o = opts || {};
  const tf = typeof o.teamsFile === "string" && o.teamsFile ? o.teamsFile : (o.userData ? teamsFile(o.userData) : "");
  if (rt && tf) {
    try { return relayMirror(tf, rt); } catch { return stored; } /* plant:h2-mirror */
  }
  const said = folderSaid(project, o);
  if (!said || said.how === "ask" || !said.path) return stored;
  return said.path;
}

/* Two paths are one place: the same letters, except on Windows, where case does not tell two folders apart. */
const samePath = (a, b) => (process.platform === "win32" ? a.toLowerCase() === b.toLowerCase() : a === b);

/** Record that `team` works through the relay team `rt` at `url`: its folder becomes the mirror, which is answered. */
function keepRelay(file, team, rt, url) {
  const doc = readTeams(file, true), e = entry(doc, String(team));
  if (relayIn(e) && e.relay.rt !== String(rt)) throw new Error("team " + team + " is on another relay team already; nothing was written");
  e.relay = Object.assign({}, relayIn(e) ? e.relay : {}, { rt: String(rt), url: String(url) });
  e.folder = relayMirror(file, rt); /* plant:rs-mirror */
  putTeams(file, doc);
  return e.folder;
}

/* What the relay was last given and told for a team (board 935, G2 on Studio's side): `granted`, the end and paid of the last grant
   the relay took, by the create or the grant route; `lapse`, where the relay last said the team stands, {state, until, readOnly,
   swept} as its told() answers, with `at`, when Studio first heard that; `lapseShown`, the step of the lapse the lead was last
   given as a notice, once the lead dismissed it; `lead`, the public half of the key the team was made with on the relay, the only
   key the relay renews it for; `refusedLead`, the key of a held grant the relay refused as another lead's, posted no more while the
   held grant names it; `remade`, true from the moment the space is to be made again after a sweep until the channel has started
   over with it; `taken`, true once the relay refused that create because another key holds the team's place, with `takenUntil`,
   the end of the grant it was judged under; `takenFirst`, true where that was its first create; `grantKey`, the service key that signed the grant the relay last took, "" where
   the root signed it or nothing was kept; `revoked`, true once the relay refused that key, until a hello, a session or a
   grant the relay accepts; `revokedNone`, true once the fetch for a new licence has finished without one the relay accepts;
   `syncNote`, the refusal the relay's last look gave this team's background sync (team-size, out-of-step, out-of-step-3
   or rate), "" once a later look succeeds, or "elsewhere" for a team whose relay this build does not reach (src/relay.mjs); `syncStreak`, how many out-of-step looks have followed one another.
   Each is null or "" where nothing was kept, as for a team made before these were kept. */
const HEX64 = /^[0-9a-f]{64}$/;
const grantedOf = (g) => (g && typeof g === "object" && Number.isSafeInteger(g.until) ? { until: g.until, paid: g.paid === true } : null);
const instant = (v) => (Number.isSafeInteger(v) ? v : null);
function lapseKept(l) {
  if (!l || typeof l !== "object" || typeof l.state !== "string") return null;
  return { state: l.state, until: instant(l.until), readOnly: instant(l.readOnly), swept: instant(l.swept), at: instant(l.at) };
}

const SYNC_NOTES = ["team-size", "out-of-step", "out-of-step-3", "rate", "elsewhere"];
function syncNoteKept(v) {
  if (SYNC_NOTES.indexOf(v) >= 0) return v;
  if (typeof v !== "string") return "";
  const m = /^refused:(\d+)(?::(.*))?$/.exec(v);
  if (!m) return "";
  const status = m[1], err = m[2];
  if (err && /^[a-z0-9-]{1,40}$/.test(err)) return "refused:" + status + ":" + err;
  return "refused:" + status;
}
const syncStreakKept = (v) => (Number.isSafeInteger(v) && v > 0 ? v : 0);
/* The standing door as the relay last took it (src/relay.mjs keepDoor): the lead key that posted it, then its licence references,
   "<64 hex>:<32 hex>,<32 hex>", or "" where this Studio never posted one. */
const doorKept = (v) => (typeof v === "string" && /^[0-9a-f]{64}:(?:[0-9a-f]{32}(?:,[0-9a-f]{32}){0,3})?$/.test(v) ? v : "");

/** Every team on the relay: {team, rt, url, folder, created, devicesRev, enrolled, headAt, headStamp, granted, lapse, lapseShown, lead,
 *  refusedLead, remade, taken, takenUntil, takenFirst, grantKey, revoked, revokedNone, syncNote, syncStreak, door}. */
function relayTeams(file) {
  const doc = readTeams(file, false);
  return Object.keys(doc.teams).filter(t => TEAM_ID.test(t) && relayIn(doc.teams[t])).map(t => {
    const r = doc.teams[t].relay;
    return { team: t, rt: r.rt, url: r.url, folder: relayMirror(file, r.rt), created: r.created === true,
      devicesRev: Number.isSafeInteger(r.devicesRev) ? r.devicesRev : 0, enrolled: String(r.enrolled || ""),
      headAt: Number.isFinite(r.headAt) ? r.headAt : 0, headStamp: String(r.headStamp || ""),
      granted: grantedOf(r.granted), lapse: lapseKept(r.lapse), lapseShown: String(r.lapseShown || ""),
      lead: HEX64.test(String(r.lead || "")) ? String(r.lead) : "", refusedLead: HEX64.test(String(r.refusedLead || "")) ? String(r.refusedLead) : "",
      remade: r.remade === true, taken: r.taken === true, takenUntil: Number.isSafeInteger(r.takenUntil) ? r.takenUntil : 0,
      takenFirst: r.takenFirst === true, grantKey: HEX64.test(String(r.grantKey || "")) ? String(r.grantKey) : "", revoked: r.revoked === true, revokedNone: r.revokedNone === true,
      syncNote: syncNoteKept(r.syncNote), syncStreak: syncStreakKept(r.syncStreak),
      door: doorKept(r.door) };
  });
}

/* THE REQUEST EACH DESK LAST ASKED WITH, as this Studio fetched it signed by that desk (src/relay.mjs leadChannel): {id, epoch,
   counter} by desk key id, under the team's relay record. A record moves only forward, by the signed epoch and then counter, so a
   relay serving an older request again does not move it back. A withdrawal counts only where it supersedes the request kept here. */
const ASKED_ID = /^[0-9a-f]{32}$/;
const askedRec = (v) => (v && typeof v === "object" && ASKED_ID.test(String(v.id)) && Number.isSafeInteger(v.epoch) && Number.isSafeInteger(v.counter)
  ? { id: String(v.id), epoch: v.epoch, counter: v.counter } : null);

/** Keeps `rec` ({id, epoch, counter}) as the request desk `desk` last asked with in `team`, where it is later than the one kept.
 *  Answers whether anything was written. */
function markAsked(file, team, desk, rec) {
  const r = askedRec(rec);
  if (!r || !/^k-[0-9a-f]{16}$/.test(String(desk))) return false;
  const doc = readTeams(file, true);
  const e = Object.prototype.hasOwnProperty.call(doc.teams, String(team)) ? doc.teams[String(team)] : null;
  if (!relayIn(e)) return false;
  const all = e.relay.asked && typeof e.relay.asked === "object" && !Array.isArray(e.relay.asked) ? e.relay.asked : {};
  const was = askedRec(all[String(desk)]);
  if (was && (was.epoch > r.epoch || (was.epoch === r.epoch && was.counter >= r.counter))) return false; /* plant:rp-forward */
  all[String(desk)] = r;
  e.relay.asked = all;
  putTeams(file, doc);
  return true;
}

/** The request desk `desk` last asked with in `team`, as markAsked kept it, or null. */
function askedOf(file, team, desk) {
  const doc = readTeams(file, false);
  const e = Object.prototype.hasOwnProperty.call(doc.teams, String(team)) ? doc.teams[String(team)] : null;
  if (!relayIn(e) || !e.relay.asked || typeof e.relay.asked !== "object") return null;
  return Object.prototype.hasOwnProperty.call(e.relay.asked, String(desk)) ? askedRec(e.relay.asked[String(desk)]) : null;
}

/** The lead's bookkeeping of the relay's calls for `team`, merged: created, devicesRev, enrolled, headAt, headStamp, granted, lapse,
 *  lapseShown, lead, refusedLead, remade, taken, takenUntil, takenFirst, grantKey, revoked, revokedNone, syncNote, syncStreak. */
function markRelay(file, team, patch) {
  const doc = readTeams(file, true);
  const e = Object.prototype.hasOwnProperty.call(doc.teams, String(team)) ? doc.teams[String(team)] : null;
  if (!relayIn(e)) return false;
  const p = patch || {};
  for (const k of ["created", "devicesRev", "enrolled", "headAt", "headStamp", "lapseShown", "lead", "refusedLead", "remade", "taken", "takenUntil", "takenFirst", "grantKey", "revoked", "revokedNone"]) if (p[k] !== undefined) e.relay[k] = p[k];
  if (p.door !== undefined) e.relay.door = doorKept(p.door);
  if (p.granted !== undefined) e.relay.granted = grantedOf(p.granted);
  if (p.lapse !== undefined) e.relay.lapse = lapseKept(p.lapse);
  if (p.syncNote !== undefined) e.relay.syncNote = syncNoteKept(p.syncNote);
  if (p.syncStreak !== undefined) e.relay.syncStreak = syncStreakKept(p.syncStreak);
  putTeams(file, doc);
  return true;
}

/** A team's relay invitations, newest first: {id, inv, made, expires, desk, state, registered, dropped, gone, dropAfter, owed} and,
 *  where it is not gone and the vault opens them, `token` and `seal` (32 bytes). `owed` is the answer the lead has not yet been able
 *  to write for the desk ({desk, box, answer}, public values only), or null (board 922). `state` is "expired" for a live or a spent one past its
 *  end: a spent invitation's copy waits for its desk until then and no longer (N1 of the slice 1 review), and a desk admitted
 *  while away finds its own copy after it by the lead's box its invitation names (F6). */
function relayInvitesOf(file, vault, team, now) {
  const doc = readTeams(file, false), e = Object.prototype.hasOwnProperty.call(doc.teams, String(team)) ? doc.teams[String(team)] : null;
  const when = now == null ? Date.now() : new Date(now).getTime(), list = invitesIn(e);
  return Object.keys(list).filter(id => INVITE_ID.test(id) && list[id] && list[id].relay && RELAY_INV.test(String(list[id].relay.inv))).map(id => {
    const r = list[id], x = r.relay, live = r.state === "live";
    const out = { id, inv: x.inv, made: String(r.made || ""), expires: String(r.expires || ""), desk: String(r.desk || ""),
      state: (live || r.state === "spent") && !(Date.parse(String(r.expires || "")) > when) ? "expired" : String(r.state || ""), /* plant:rs-spent-ends */
      registered: x.registered === true, dropped: x.dropped === true, gone: x.gone === true, pendingMove: x.pendingMove === true,
      wrappedEpoch: Number.isSafeInteger(x.wrappedEpoch) ? x.wrappedEpoch : 0,
      relayState: x.relayState === "unused" || x.relayState === "used" || x.relayState === "asked" ? x.relayState : "",
      relayUsed: Number.isFinite(x.relayUsed) ? x.relayUsed : null,
      dropAfter: Number.isFinite(x.dropAfter) ? x.dropAfter : null, owed: answerOwedOf(x.answerOwed) };
    if (!out.gone && vault) {
      try {
        const token = String(vault.open(Buffer.from(String(x.token), "base64")));
        const seal = Buffer.from(String(vault.open(Buffer.from(String(x.seal), "base64"))), "base64");
        if (RELAY_TOKEN.test(token) && seal.length === 32) { out.token = token; out.seal = seal; }
      } catch { /* one this account cannot open makes no copy */ }
    }
    return out;
  }).sort((a, b) => (a.made < b.made ? 1 : a.made > b.made ? -1 : 0));
}

/* An owed answer as the book keeps it: {desk, box, answer} with a desk's key id, its box (64 hex) and "refused" or "joined", or null. */
function answerOwedOf(v) {
  if (!v || typeof v !== "object") return null;
  const ok = /^k-[0-9a-f]{16}$/.test(String(v.desk)) && /^[0-9a-f]{64}$/.test(String(v.box)) && (v.answer === "refused" || v.answer === "joined");
  return ok ? { desk: String(v.desk), box: String(v.box), answer: String(v.answer) } : null;
}

/** Marks a relay invitation: `registered` or `dropped` with the relay, or `gone`, let go, which drops its token and key.
 *  `dropAfter` (ms) holds back the drop of a gone one until then: the lead has answered a refused desk, which reads that answer
 *  only while the relay still holds the invitation bound (board 922). `answerOwed` ({desk, box, answer}) keeps an answer the
 *  lead could not write at once until the sync writes it, and null clears it. */
function markRelayInvite(file, team, id, patch) {
  const doc = readTeams(file, true);
  const e = Object.prototype.hasOwnProperty.call(doc.teams, String(team)) ? doc.teams[String(team)] : null;
  const list = invitesIn(e), r = Object.prototype.hasOwnProperty.call(list, String(id)) ? list[String(id)] : null;
  if (!r || !r.relay) return false;
  const p = patch || {};
  if (p.registered === true) r.relay.registered = true;
  /* Registered with a relay that has since lost it (a sweep): registered again at the next sync, with its wrap. */
  if (p.registered === false) { delete r.relay.registered; delete r.relay.wrappedEpoch; }
  if (p.dropped === true) r.relay.dropped = true;
  if (p.pendingMove === true) r.relay.pendingMove = true;
  if (p.pendingMove === false) r.relay.pendingMove = false;
  if (Number.isSafeInteger(p.wrappedEpoch) && p.wrappedEpoch >= 1) r.relay.wrappedEpoch = p.wrappedEpoch;
  if (p.relayState === "unused" || p.relayState === "used" || p.relayState === "asked") r.relay.relayState = p.relayState;
  if (Number.isFinite(p.relayUsed)) r.relay.relayUsed = p.relayUsed;
  if (p.gone === true) { r.relay.gone = true; delete r.relay.token; delete r.relay.seal; delete r.relay.reopened; if (r.state !== "live") delete r.secret; }
  if (Number.isFinite(p.dropAfter)) r.relay.dropAfter = p.dropAfter;
  if (p.answerOwed === null) delete r.relay.answerOwed;
  else if (answerOwedOf(p.answerOwed)) r.relay.answerOwed = answerOwedOf(p.answerOwed);
  putTeams(file, doc);
  return true;
}

/** Records desk `desk` ({id, key}) taken off `team` at `at` (ms) by the move to key number `epoch`, with `files`
 *  ({path: sha256 hex}), what its folder held then. A desk recorded already is replaced when the new removal's epoch
 *  is later (or, at an equal epoch, its `at` later); kept otherwise. */
function markRemoved(file, team, desk, at, epoch, files) {
  const d = desk || {};
  if (!/^k-[0-9a-f]{16}$/.test(String(d.id)) || !/^[0-9a-f]{64}$/.test(String(d.key))) throw new Error("a removed desk is named by its id and key");
  const doc = readTeams(file, true), e = entry(doc, String(team));
  const was = e.removed && typeof e.removed === "object" && !Array.isArray(e.removed) ? e.removed : {};
  if (Object.prototype.hasOwnProperty.call(was, d.id)) {
    const prev = was[d.id] || {};
    const replace = Number(epoch) > Number(prev.epoch) || (Number(epoch) === Number(prev.epoch) && Number(at) > Number(prev.at)); /* plant:rs923-c5 */
    if (!replace) return false;
  }
  const kept = {};
  Object.keys(files || {}).forEach(k => { if (/^[0-9a-f]{64}$/.test(String(files[k]))) kept[k] = String(files[k]); });
  was[d.id] = { key: String(d.key), at: Number(at), epoch: Number(epoch), files: kept };
  e.removed = was;
  putTeams(file, doc);
  return true;
}

/** The desks taken off `team`, by id: {key, at, epoch, files}. */
function removedOf(file, team, opts) {
  const strict = !!(opts && opts.strict);
  const doc = readTeams(file, strict), e = Object.prototype.hasOwnProperty.call(doc.teams, String(team)) ? doc.teams[String(team)] : null;
  if (strict && e && e.removed !== undefined && (e.removed === null || typeof e.removed !== "object" || Array.isArray(e.removed))) {
    throw new Error(file + " has an unreadable removal record");
  }
  const was = e && e.removed && typeof e.removed === "object" && !Array.isArray(e.removed) ? e.removed : {}, out = {};
  Object.keys(was).forEach(id => {
    const r = was[id];
    if (/^k-[0-9a-f]{16}$/.test(id) && r && /^[0-9a-f]{64}$/.test(String(r.key)) && Number.isFinite(r.at))
      out[id] = { key: r.key, at: r.at, epoch: Number(r.epoch) || 0, files: r.files && typeof r.files === "object" ? r.files : {} };
  });
  return out;
}

/** Strict reader of `removedOf`: throws when the teams file exists and cannot be read or used. */
function removedOfStrict(file, team) {
  return removedOf(file, team, { strict: true });
}

/** The teams the watch looks at: every team on the relay, whose folder is its mirror. A team kept for a shared folder is held and
 *  no longer watched: Studio reads nothing there and writes nothing there (the folder team's removal). */
function watchedTeams(file) {
  const doc = readTeams(file, false);
  return Object.keys(doc.teams).filter(t => TEAM_ID.test(t) && doc.teams[t] && relayIn(doc.teams[t]) && typeof doc.teams[t].folder === "string" && doc.teams[t].folder) /* plant:fh-watch-relay-only */
    .map(t => ({ team: t, folder: doc.teams[t].folder }));
}

/** How many desks this Studio has admitted, over every team's kept file: what makes the backup disc matter (K9c), read
 *  without a share, and rising when an admission writes the kept copy again. */
function admittedOf(file) {
  const doc = readTeams(file, false), seen = new Set();
  Object.keys(doc.teams).forEach(t => {
    const roster = (doc.teams[t] && doc.teams[t].file && doc.teams[t].file.roster) || [];
    roster.forEach(e => { if (e && e.desk && e.wrap !== undefined) seen.add(t + "/" + e.desk.id); });
  });
  return seen.size;
}

function verifyTeamSync(content, expectedLead) {
  try {
    const T = Engine.teamRules();
    const v = T.v2TeamRead(content);
    const t = v && v.team;
    if (!t || !t.sig || !t.sig.value || !t.lead || !t.lead.public) return null;
    if (expectedLead) {
      const expPub = typeof expectedLead === "string" ? expectedLead : expectedLead.public;
      const expKeyId = typeof expectedLead === "object" ? expectedLead.keyId : null;
      if (expPub && t.lead.public !== expPub) return null;
      if (expKeyId && t.lead.keyId !== expKeyId) return null;
    }
    const data = T.v2SignedBytes(t);
    const pubHex = t.lead.public;
    const spki = Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(pubHex, "hex")]);
    const pubKey = crypto.createPublicKey({ key: spki, format: "der", type: "spki" });
    const sigBytes = Buffer.from(t.sig.value, "hex");
    if (!crypto.verify(null, data, pubKey, sigBytes)) return null;
    return t;
  } catch {
    return null;
  }
}

/* team-revs.json sits beside the signing key. That key is kept in the same folder as teams.json, unless the caller names another. */
function floorKeyFile(teamsPath, opts) {
  const named = opts && typeof opts.key === "string" ? opts.key : "";
  if (named) return named;
  return path.join(path.dirname(path.resolve(String(teamsPath || "."))), "signing-key.json");
}

/* A file's place in the order heldTeam uses: a higher epoch, or the same epoch and a higher rev. */
function teamRank(teamObj) {
  if (!teamObj || typeof teamObj !== "object") return null;
  const rev = Engine.teamFileRules().teamRevOf(teamObj);
  if (!Number.isInteger(teamObj.epoch) || teamObj.epoch < 1 || rev === null) return null;
  return { epoch: teamObj.epoch, rev };
}

function teamIsNewer(candidate, current) {
  const next = teamRank(candidate), had = teamRank(current);
  if (!next) return false;
  if (!had) return true;
  if (next.epoch !== had.epoch) return next.epoch > had.epoch;
  return next.rev > had.rev;
}

/* True where the file is older than the floor kept for it, or its rev is not a whole number. With no floor kept, nothing is below one. */
function revBelowFloor(teamObj, keyFile) {
  if (!teamObj || typeof teamObj !== "object" || !teamObj.id) return false;
  const floor = revFloor(keyFile, teamObj.id);
  if (!floor) return false;
  const rev = Engine.teamFileRules().teamRevOf(teamObj);
  if (rev === null || !Number.isInteger(teamObj.epoch)) return true;
  return teamObj.epoch < floor.epoch || (teamObj.epoch === floor.epoch && rev < floor.rev); /* plant:962s5-floor */
}

/* The newest genuine file in the folder for this team: the canonical file, or a conflict sibling ahead of it, as readTeam takes. */
function newestVerifiedTeam(folder, teamId, expectedLead) {
  let names = [];
  try { names = fs.readdirSync(folder); } catch { return null; }
  const canonical = "etiuda-team.json";
  let best = null;
  const consider = (name) => {
    let text = null;
    try { text = fs.readFileSync(path.join(folder, name), "utf8"); } catch { return; }
    const verified = verifyTeamSync(text, expectedLead);
    if (!verified || verified.id !== teamId) return;
    if (!best || teamIsNewer(verified, best)) best = verified;
  };
  if (names.indexOf(canonical) >= 0) consider(canonical);
  for (const name of names) {
    if (name === canonical || !conflictSiblingName(canonical, name)) continue;
    consider(name);
  }
  return best;
}

/** The teammates and teams this Studio leads across teams.json: distinct roster desk IDs and open invitations.
 *  A share file below the floor kept for that team is not counted; the kept copy is, where it clears the floor.
 *  Where every copy is below the floor, the read is unreadable and an admission is refused. */
function studioTeammates(file, opts) {
  const o = opts || {};
  const when = o.now == null ? Date.now() : new Date(o.now).getTime();
  const keyFile = floorKeyFile(file, o);
  let raw;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch (e) {
    if (e && e.code === "ENOENT") {
      return { ok: true, teamsCount: 0, count: 0, rosterDesks: new Set(), openInvites: new Set() };
    }
    return { ok: false, unreadable: true, error: e };
  }
  let doc;
  try {
    doc = JSON.parse(raw.replace(/^\uFEFF/, ""));
  } catch (e) {
    return { ok: false, unreadable: true, error: e };
  }
  if (!doc || doc.kind !== KIND || !doc.teams || typeof doc.teams !== "object" || Array.isArray(doc.teams)) {
    return { ok: false, unreadable: true, error: new Error("invalid teams format") };
  }

  const teamIds = Object.keys(doc.teams).filter((t) => TEAM_ID.test(t));
  const rosterDesks = new Set();
  const openInvites = new Set();
  let belowFloor = false;

  for (const tid of teamIds) {
    const ent = doc.teams[tid];
    if (!ent || typeof ent !== "object") continue;

    let teamObj = null;
    let folder = "";
    if (ent.relay && ent.relay.rt) {
      folder = relayMirror(file, ent.relay.rt);
    } else if (typeof ent.folder === "string" && ent.folder) {
      folder = ent.folder;
    }

    const expectedLead = (ent.file && ent.file.lead) || ent.lead || (ent.relay && ent.relay.lead ? { public: ent.relay.lead } : null);
    const diskTeam = folder ? newestVerifiedTeam(folder, tid, expectedLead) : null;
    const kept = ent.file && typeof ent.file === "object" ? ent.file : null;
    const diskOk = diskTeam && !revBelowFloor(diskTeam, keyFile) ? diskTeam : null;
    const keptOk = kept && !revBelowFloor(kept, keyFile) ? kept : null;
    if (!diskOk && !keptOk && (diskTeam || kept)) belowFloor = true;
    teamObj = diskOk || keptOk;

    if (teamObj && Array.isArray(teamObj.roster)) {
      for (const m of teamObj.roster) {
        const deskId = m && m.desk && typeof m.desk.id === "string" ? m.desk.id
          : (m && typeof m.id === "string" ? m.id : null);
        if (deskId) rosterDesks.add(deskId);
      }
    }

    const invites = invitesIn(ent);
    for (const invId of Object.keys(invites)) {
      if (!INVITE_ID.test(invId)) continue;
      const inv = invites[invId];
      if (!inv || typeof inv !== "object") continue;
      if (inv.state === "live") {
        const exp = Date.parse(String(inv.expires || ""));
        if (Number.isFinite(exp) && exp > when) {
          openInvites.add(invId);
        }
      }
    }
  }

  if (belowFloor) {
    return { ok: false, unreadable: true, error: new Error("a team file is older than the floor this Studio keeps, so the roster was not counted") };
  }

  return {
    ok: true,
    teamsCount: teamIds.length,
    rosterDesks,
    openInvites,
    count: rosterDesks.size + openInvites.size,
  };
}

/* ---- A TEAM THIS STUDIO FOLLOWS (board 962, stage 7, V2) ------------------------------------------------------------
 * A Studio may sit on another Studio's team as a teammate, with a member key of its own (src/member.mjs), as a desk does.
 * That team is kept in a table of its own, `following`, beside `teams` and never inside it, so every reader of `teams`
 * (relayTeams, watchedTeams, studioTeammates and the three-team count, teamKeysOf, the relay runner) reads
 * only the teams this Studio leads, and cannot run a followed team as led. A record is {channel: "relay", relay {rt, url}, member (the member key's id), leadName, joined, state, seal}. What the trust of the team
 * rests on, the lead pinned at the join, the chain of leads it was handed through, every team key by its number and the
 * invitation while the join is under way, is in `seal` alone, sealed by the vault as a team key is, so a hand edit of the
 * plain file cannot swap the lead (Argon's review of 2026-11-09, finding 3). A record carrying any of those in plain, or a
 * seal that does not open as this team's, reads as not reached. One followed team per Studio (stage 7's question 4). A record an older
 * Studio kept with channel "folder" is still read, held as it is and said once on its row, and no new one is written. */
const FOLLOW_TABLE = "following"; /* plant:962s7a-table */
const FOLLOW_STATES = ["joining", "following", "not-reached", "removed", "refused", "moved"];
const followTable = (doc) => (doc && doc[FOLLOW_TABLE] && typeof doc[FOLLOW_TABLE] === "object" && !Array.isArray(doc[FOLLOW_TABLE]) ? doc[FOLLOW_TABLE] : {});
const own = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);

/* The sealed part of a record, opened: {team, lead, chain, keys, invite}, or null where the record carries a pin in plain, or
   the seal does not open, or opens as another team's. */
function followSealOpen(vault, team, rec) {
  if (!rec || typeof rec !== "object") return null;
  let plainPin = false;
  plainPin = ["lead", "chain", "keys", "invite"].some((k) => own(rec, k)); /* plant:962s7l-plain */
  if (plainPin) return null;
  let s = null;
  try { s = JSON.parse(String(vault.open(Buffer.from(String(rec.seal || ""), "base64")))); } catch { s = null; }
  if (!s || typeof s !== "object" || s.team !== String(team) || !s.lead || typeof s.lead.keyId !== "string"
    || !/^[0-9a-f]{64}$/.test(String(s.lead.public))) return null;
  const chain = Array.isArray(s.chain) ? s.chain.filter((k) => k && typeof k.keyId === "string" && /^[0-9a-f]{64}$/.test(String(k.public)))
    .map((k) => ({ keyId: k.keyId, public: k.public })) : [];
  const keys = {};
  if (s.keys && typeof s.keys === "object") for (const ep of Object.keys(s.keys)) {
    if (/^[1-9][0-9]*$/.test(ep) && /^[0-9a-f]{64}$/.test(String(s.keys[ep]))) keys[ep] = String(s.keys[ep]);
  }
  const inv = s.invite && typeof s.invite === "object" && /^[0-9a-f]{32}$/.test(String(s.invite.secret)) ? s.invite : null;
  return { team: s.team, lead: { keyId: s.lead.keyId, public: s.lead.public }, chain, keys, invite: inv, floor: floorKept(s.floor) };
}
/* The highest team file heeded, {epoch, rev}, or null. */
function floorKept(v) {
  return v && typeof v === "object" && Number.isInteger(v.epoch) && v.epoch >= 1 && Number.isSafeInteger(v.rev) && v.rev >= 0
    ? { epoch: v.epoch, rev: v.rev } : null;
}
function followSealOf(vault, sealed) {
  return Buffer.from(vault.seal(JSON.stringify(sealed))).toString("base64");
}
function vaultCan(vault) { try { return !!vault && vault.available(); } catch { return false; } }

/** Starts following `team`: `plain` {channel: "relay", relay {rt, url}, member, leadName}, `sealed` {lead, chain, keys, invite}.
 *  Refused where the vault cannot seal, where this Studio leads that team, where it follows another team already, where the
 *  member id is not a member key's, and where the team is not on a relay (a record for a shared folder is no longer made). The same team
 *  kept again is replaced whole: a new join starts from its own invitation and nothing of the last one's seal. */
function keepFollowing(file, vault, team, plain, sealed) {
  if (!TEAM_ID.test(String(team))) throw new Error("a team id is t- and 16 lower-case hex characters");
  if (!vaultCan(vault)) throw new Error("this computer cannot keep a key sealed for this account, so no team was followed");
  const doc = readTeams(file, true), p = plain || {}, s = sealed || {};
  if (own(doc.teams, String(team))) throw new Error("this Studio leads team " + team + ", so it does not follow it");
  const table = followTable(doc);
  if (Object.keys(table).some((t) => t !== String(team))) throw new Error("this Studio follows another team already; nothing was written");
  if (!DESK_ID.test(String(p.member || ""))) throw new Error("a followed team is kept under a member key's id; nothing was written");
  /* A team is followed through the relay alone. A record an older Studio kept for a shared folder is still read (followingOf) and said
     once on its row, and is never written again. plant:962s7r-folder stood on the folder record's absolute-path check, which is gone with
     the record; the mark stays until the plant guard has a way to retire one. */
  if (p.channel !== "relay") throw new Error("a team is followed through the relay alone; nothing was written");
  if (!p.relay || !RELAY_RT.test(String(p.relay.rt)) || !/^https:\/\//.test(String(p.relay.url))) throw new Error("a followed relay team names its relay; nothing was written");
  /* Only a relay this build knows (src/relay-known.mjs): an invitation, a restored backup or any later caller naming another
     is refused here, the last wall, so no record is written pointing elsewhere. */
  let known = true;
  known = relayKnown(p.relay.url); /* plant:skr-keep */
  if (!known) throw new Error("a followed relay team names a relay this build does not use; nothing was written");
  const rec = { channel: "relay", member: String(p.member || ""),
    leadName: typeof p.leadName === "string" ? p.leadName : "", joined: String(p.joined || new Date().toISOString()), state: "joining" };
  rec.relay = { rt: String(p.relay.rt || ""), url: String(p.relay.url || "") };
  rec.seal = followSealOf(vault, { team: String(team), lead: s.lead, chain: Array.isArray(s.chain) ? s.chain : [], keys: s.keys || {},
    invite: s.invite || null, floor: floorKept(s.floor) });
  table[String(team)] = rec;
  doc[FOLLOW_TABLE] = table;
  putTeams(file, doc);
}

/** The team this Studio follows, or null: {team, channel, folder, relay, member, leadName, joined, state, lead, chain, keys,
 *  invite}, `keys` as {epoch: 32 bytes}. A record whose seal does not open as its own reads with state "not-reached" and no
 *  lead, chain, keys or invite. */
function followingOf(file, vault) {
  const doc = readTeams(file, false), table = followTable(doc);
  const team = Object.keys(table).filter((t) => TEAM_ID.test(t)).sort()[0];
  if (!team) return null;
  const rec = table[team] || {};
  const out = { team, channel: rec.channel === "relay" ? "relay" : "folder", folder: rec.channel === "relay" ? null : String(rec.folder || ""),
    relay: rec.channel === "relay" && rec.relay ? { rt: String(rec.relay.rt || ""), url: String(rec.relay.url || "") } : null,
    member: String(rec.member || ""), leadName: typeof rec.leadName === "string" ? rec.leadName : "", joined: String(rec.joined || ""),
    state: FOLLOW_STATES.indexOf(rec.state) >= 0 ? rec.state : "joining", lead: null, chain: [], keys: {}, invite: null, floor: null };
  const s = vault ? followSealOpen(vault, team, rec) : null;
  if (!s) { out.state = "not-reached"; return out; }
  out.lead = s.lead; out.chain = s.chain; out.invite = s.invite; out.floor = s.floor;
  for (const ep of Object.keys(s.keys)) out.keys[ep] = Buffer.from(s.keys[ep], "hex");
  return out;
}

/** Sets a followed team's plain state ("joining", "following", "not-reached", "removed", "refused", "moved"). */
function markFollowing(file, team, state) {
  if (FOLLOW_STATES.indexOf(state) < 0) throw new Error("a followed team's state is one of " + FOLLOW_STATES.join(", "));
  const doc = readTeams(file, true), table = followTable(doc);
  if (!own(table, String(team)) || table[String(team)].state === state) return false;
  table[String(team)].state = state;
  putTeams(file, doc);
  return true;
}

/** Points a followed team at a relay the signed team file named. The seal and the state stay. A folder move is not
 *  retargeted here: the file names no folder. False where the record is missing, or the relay is not one this store keeps,
 *  or not one this build knows (src/relay-known.mjs): the store is the last wall, whoever calls it, and the record is then left
 *  byte for byte. */
function retargetFollowing(file, team, plain) {
  const doc = readTeams(file, true), table = followTable(doc);
  if (!own(table, String(team))) return false;
  const p = plain || {};
  if (p.channel !== "relay" || !p.relay || !RELAY_RT.test(String(p.relay.rt)) || !/^https:\/\//.test(String(p.relay.url))) return false;
  let known = true;
  known = relayKnown(p.relay.url); /* plant:skr-store */
  if (!known) return false;
  const rec = table[String(team)], rt = String(p.relay.rt), url = String(p.relay.url);
  if (rec.channel === "relay" && rec.relay && rec.relay.rt === rt && rec.relay.url === url) return false;
  rec.channel = "relay";
  rec.relay = { rt, url };
  delete rec.folder;
  putTeams(file, doc);
  return true;
}

/* Rewrites the sealed part of the followed team's record through `fn(sealed)`, which answers the new sealed part. Refused
   where the record's seal does not open: a record that reads as not reached is never sealed again over, which would make an
   edited file good. */
function resealFollowing(file, vault, team, fn) {
  if (!vaultCan(vault)) throw new Error("this computer cannot keep a key sealed for this account, so nothing was written");
  const doc = readTeams(file, true), table = followTable(doc);
  if (!own(table, String(team))) throw new Error("this Studio does not follow team " + team + "; nothing was written");
  const rec = table[String(team)], s = followSealOpen(vault, team, rec);
  if (!s) throw new Error("the record of team " + team + " does not open as this Studio sealed it; nothing was written");
  const next = fn(s);
  rec.seal = followSealOf(vault, { team: String(team), lead: next.lead, chain: next.chain || [], keys: next.keys || {}, invite: next.invite || null,
    floor: floorKept(next.floor) });
  putTeams(file, doc);
}

/** Keeps the followed team's key for `epoch` beside every key kept before it, as a desk keeps teamKeys[team][epoch]: an edition
 *  sealed at an earlier number still opens once the team file has moved on. A number never changes its key. */
function keepFollowKey(file, vault, team, epoch, key) {
  const k = Buffer.from(key || []);
  if (k.length !== 32 || !Number.isInteger(epoch) || epoch < 1) throw new Error("a team key is 32 bytes under a whole number from 1");
  let wrote = false;
  resealFollowing(file, vault, team, (s) => {
    const was = s.keys[String(epoch)];
    if (was && was !== k.toString("hex")) throw new Error("team " + team + " already keeps a different key under the same number; nothing was written");
    if (was) return s;
    wrote = true;
    let keys = s.keys;
    keys = Object.assign({}, s.keys, { [String(epoch)]: k.toString("hex") }); /* plant:962s7k-keep */
    return Object.assign({}, s, { keys });
  });
  return wrote;
}

/** Takes the followed team out of the file: its keys and its pin go with it. */
function forgetFollowing(file, team) {
  const doc = readTeams(file, true), table = followTable(doc);
  if (!own(table, String(team))) return false;
  delete table[String(team)];
  doc[FOLLOW_TABLE] = table;
  putTeams(file, doc);
  return true;
}

/** The followed team's record as the backup copy carries it: {team, channel, folder, relay, member, leadName, lead, chain, keys
 *  (hex)}, or null where none is followed or its seal does not open. The invitation is not carried. */
function followBackupRow(file, vault) {
  const f = followingOf(file, vault);
  if (!f || !f.lead) return null;
  const keys = {};
  for (const ep of Object.keys(f.keys)) keys[ep] = f.keys[ep].toString("hex");
  return { team: f.team, channel: f.channel, folder: f.folder, relay: f.relay, member: f.member, leadName: f.leadName, lead: f.lead,
    chain: f.chain, keys, floor: f.floor };
}

export { TEAMS_FILE, teamsFile, teamsNewer, keepTeamKey, markKeyPending, clearKeyPending, pendingEpochsOf, epochRowsOf, forgetTeam, endTeam, chooseSealed, teamKeysOf, unsealedOf, keptTeam, teamHeldBy, teamForFolder, admittedOf, studioTeammates,
  keepInvite, invitesOf, liveInvitesOf, inviteBookOf, inviteSecretOf, noteFirstSeen, noticesOf, noteTried, dismissTried, clearTried, endInvite, reviveInvite, forgetInviteSecret, watchedTeams,
  relayMirror, folderHere, folderSaid, placeFor, placeForLooked, keepRelay, relayTeams, markRelay, markAsked, askedOf, relayInvitesOf, markRelayInvite, markRemoved, removedOf, removedOfStrict,
  keepFollowing, followingOf, markFollowing, retargetFollowing, resealFollowing, keepFollowKey, forgetFollowing, followBackupRow };
