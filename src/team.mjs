/* THE TEAM FILE: THE ROSTER OF DESKS THE LEAD HAS MET. Board 834, step 8 of the branches plan.
 *
 *     import { readTeam, heldTeam, heldCopy, newTeam, withSealed, withChannel, withDesk, withoutDesk, admit, admitRequest, admitAsked, newEpoch,
 *       withRecovery, openRecovery, recoveryOf, writeTeam, rosterName, revsFile, revFloor } from "./src/team.mjs";
 *
 * ONE PER SHARED FOLDER, BESIDE THE CATALOGS, SIGNED BY THE LEAD'S KEY. The shape, the name and the
 * reader are the engine's (catalog-v2.js V2_TEAM_FILE, v2TeamRead, v2TeamSigState, through
 * src/engine.mjs teamRules), so this module writes the file and asks the engine what it says.
 *
 * WITH ENCRYPTION OFF, ADDING A DESK IS LABELLING, NOT PERMISSION (design note, section 6). The
 * roster holds each desk's own block as its file carries it, and the name the lead gave it. An admitted desk's entry also
 * carries the team key wrapped to its box (step 12), by the pinned engine's HPKE and binding (src/engine.mjs hpkeRules).
 *
 * A FILE THAT VERIFIES IS WHOLE, NOT THE LEAD'S: its signature holds under the lead key the file
 * names itself, and anybody who can write the share can sign one. So the queue reads no name from
 * it until a team is tied to a key this Studio holds.
 *
 * HELD IS A MARK ON THE OBJECT, NOT IN THE FILE: heldTeam, newTeam and a verb given a held team hand back a held one, and
 * admit and writeTeam take nothing else, so a roster nobody here signed is never wrapped to or signed. A copy (a clone, or
 * a team sent to another thread) is not held: read, admit and write in one place.
 *
 * THE FILE'S REVISION AND CHANNEL (board 900, the relay's step 1). writeTeam signs `rev`, one higher than the file it
 * replaces, the team handed in and the floor below, and `channel`, the folder unless withChannel names a relay, whose
 * ring then rides inside the signed file. The floor is the highest rev this Studio has written or held for a team under
 * its lead key at that key's highest epoch, kept beside the key file; heldTeam refuses a file below it, a lower rev at
 * the same epoch or an epoch below the floor, which is an older file put back on the share. writeTeam refuses a team handed in
 * below the floor in the same way, a kept copy included, before anything is signed or written (board 929).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import * as Engine from "./engine.mjs";
import { readKeyFile, unlockKey, signDocument, wrapKey, recoverySecret, ensureLeadBox, statsBoxOf, KDF, CIPHER } from "./sign.mjs";
import { RING_KIND, RING_FORMAT } from "./ring.mjs";
import { writeWhole } from "./whole-write.cjs";
import { readWithin, TEAM_READ_MAX } from "./share-read.cjs";
import { jsonText as json } from "./plain-json.mjs";
import { hintOf } from "./desk-seat.mjs";

const HELD = new WeakSet();
const hold = t => { HELD.add(t); return t; };
const isHeld = t => !!t && typeof t === "object" && HELD.has(t);
const NOT_HELD = "this team was not taken through heldTeam or made here, so its roster is not known to be the lead's";

/** Where a folder's team file sits. */
function teamPath(folder) {
  return path.join(path.resolve(String(folder || ".")), Engine.teamRules().V2_TEAM_FILE);
}

/** A sync client's copy of one file: the same extension, and the stem is the canonical stem plus
 *  one conflict tail. The tails are ` (1)`, ` (conflicted copy ...)`, OneDrive's `-COMPUTER`,
 *  Syncthing's `.sync-conflict-` and Drive's `_conf(n)`. A hyphen tail also matches a chosen name such as guide-v2.
 *  Two catalogs whose ids differ stay two proposals, and a team file that is not genuine is not
 *  the one read. Nothing here renames or deletes the copy. */
function conflictSiblingName(canonical, name) {
  const c = path.basename(String(canonical || ""));
  const n = path.basename(String(name || ""));
  if (!c || !n) return false;
  const cExt = path.extname(c), nExt = path.extname(n);
  if (!cExt || cExt.toLowerCase() !== nExt.toLowerCase()) return false;
  const cStem = c.slice(0, -cExt.length), nStem = n.slice(0, -nExt.length);
  if (!cStem || nStem.length <= cStem.length) return false;
  if (nStem.slice(0, cStem.length).toLowerCase() !== cStem.toLowerCase()) return false;
  const tail = nStem.slice(cStem.length);
  if (/^( \(\d+\))+$/.test(tail)) return true;
  if (/^ \(.*conflicted copy.*\)$/i.test(tail)) return true;
  if (/^-[A-Za-z0-9][A-Za-z0-9-]{0,62}$/.test(tail)) return true;
  if (/^\.sync-conflict-/.test(tail)) return true;
  if (/^(_conf\(\d+\))+$/i.test(tail)) return true;
  return false;
}

function teamRank(team) {
  if (!team || typeof team !== "object") return null;
  const rev = revOf(team);
  if (!Number.isInteger(team.epoch) || team.epoch < 1 || rev === null) return null;
  return { epoch: team.epoch, rev };
}

/* Strictly newer: a higher epoch, or the same epoch and a higher rev. Equal is not newer. */
function teamAhead(team, cur) {
  if (!cur) return true;
  const a = teamRank(team), b = teamRank(cur);
  if (!a) return false;
  if (!b) return true;
  if (a.epoch !== b.epoch) return a.epoch > b.epoch;
  return a.rev > b.rev;
}

/* The sibling has to be the same team and the same lead where the canonical file parses as one. */
function sameTeamLead(team, cur) {
  if (!cur || !team) return true;
  if (cur.id && team.id !== cur.id) return false;
  const cl = cur.lead, tl = team.lead;
  if (cl && typeof cl === "object" && cl.keyId && cl.public) {
    if (!tl || tl.keyId !== cl.keyId || tl.public !== cl.public) return false;
  }
  return true;
}

async function readOneTeam(T, text) {
  const read = T.v2TeamRead(text);
  const state = read.team ? await T.v2TeamSigState(read.team) : T.states.none;
  return { team: read.team, problems: read.problems, state, valid: state === T.states.valid };
}

/** The folder's team file as the engine reads it: `team` null where there is none or it will not
 *  read, `problems` the engine's lines, `state` its signature against its own lead key.
 *  A conflict sibling that is a genuine team file at a higher epoch or rev, under the same team
 *  and lead where the canonical file parses, is the one read. `at` is that file, or the canonical
 *  path where none is taken. A sibling that is not genuine, or lower, stays on disk. A file larger
 *  than the desk's team-file cap is left unread, as the pinned shell leaves it. */
async function readTeam(folder) {
  const T = Engine.teamRules();
  const root = path.resolve(String(folder || "."));
  const at = path.join(root, T.V2_TEAM_FILE);
  let text = null, thrown = null;
  try { text = readWithin(at, TEAM_READ_MAX).toString("utf8").replace(/^\uFEFF/, ""); }
  catch (e) { if (!e || (e.code !== "ENOENT" && e.code !== "EFBIG")) thrown = e; }
  const canon = await readOneTeam(T, text);
  let best = { at, team: canon.team, problems: canon.problems, state: canon.state, valid: canon.valid };
  let names = [];
  try { names = fs.readdirSync(root); } catch { names = []; }
  for (const name of names.filter(n => conflictSiblingName(T.V2_TEAM_FILE, n)).sort()) {
    const sib = path.join(root, name);
    let sibText = null;
    try { sibText = readWithin(sib, TEAM_READ_MAX).toString("utf8").replace(/^\uFEFF/, ""); }
    catch { continue; }
    const read = await readOneTeam(T, sibText);
    if (!read.valid || !read.team) continue;
    if (canon.team && !sameTeamLead(read.team, canon.team)) continue;
    if (teamAhead(read.team, best.team)) best = { at: sib, team: read.team, problems: read.problems, state: read.state, valid: true }; /* plant:f3-team-read */
  }
  if (thrown && best.at === at) throw thrown;
  return { at: best.at, team: best.team, problems: best.problems, state: best.state, valid: best.valid };
}

/* ---- the revision's floor, beside the key file ------------------------------------------------------------------------ */
const REVS_FILE = "team-revs.json";
const REVS_KIND = "etiuda-studio-team-revs";
const own = (o, k) => !!o && typeof o === "object" && !Array.isArray(o) && Object.prototype.hasOwnProperty.call(o, k);

/** A team file's revision: absent is 0, and null where it is not a whole number from 0, by the pinned desk's teamRevOf. */
function revOf(team) {
  if (!team) return 0;
  return Engine.teamFileRules().teamRevOf(team);
}

/** Where the floors for the teams led under the key file `keyFile` are kept. */
function revsFile(keyFile) { return path.join(path.dirname(path.resolve(String(keyFile || ""))), REVS_FILE); }

/* A floor file that is not there or will not read floors nothing. */
function readRevs(keyFile) {
  try {
    const d = JSON.parse(fs.readFileSync(revsFile(keyFile), "utf8").replace(/^\uFEFF/, ""));
    if (d && d.kind === REVS_KIND && own(d, "teams") && typeof d.teams === "object" && !Array.isArray(d.teams)) return d;
  } catch { /* none yet */ }
  return { format: 1, kind: REVS_KIND, teams: {} };
}

/** The floor kept for team `team`: {epoch, rev}, or null. */
function revFloor(keyFile, team, lead) {
  const teams = readRevs(keyFile).teams, byKey = own(teams, String(team)) ? teams[String(team)] : null;
  if (!byKey) return null;
  let teamFloor = null;
  if (Number.isInteger(byKey.epoch) && byKey.epoch >= 1 && Number.isSafeInteger(byKey.rev) && byKey.rev >= 0) {
    teamFloor = { epoch: byKey.epoch, rev: byKey.rev };
  }
  let best = teamFloor ? { epoch: teamFloor.epoch, rev: teamFloor.rev } : null;
  for (const k of Object.keys(byKey)) {
    if (k === "epoch" || k === "rev") continue;
    const f = byKey[k];
    if (f && Number.isInteger(f.epoch) && f.epoch >= 1 && Number.isSafeInteger(f.rev) && f.rev >= 0) {
      if (!best || f.epoch > best.epoch || (f.epoch === best.epoch && f.rev > best.rev)) {
        best = { epoch: f.epoch, rev: f.rev };
      }
    }
  }
  return best;
}

/* The floor raised to this team file's epoch and rev: by a newer epoch, or a higher rev at its own. A file at a newer epoch
   with no rev raises the floor to that epoch at rev 0 and never deletes it, so the older epoch's file put back is still below
   it (board 931). Where no floor is kept, a floor of 0 refuses nothing and is not kept. */
function raiseRevFloor(keyFile, team) {
  const rev = revOf(team), had = revFloor(keyFile, team.id);
  if (rev === null || (!had && !rev) || (had && (team.epoch < had.epoch || (team.epoch === had.epoch && rev <= had.rev)))) return;
  const d = readRevs(keyFile), byKey = own(d.teams, team.id) && typeof d.teams[team.id] === "object" ? d.teams[team.id] : {};
  const lead = team.lead && team.lead.public ? String(team.lead.public) : "";
  byKey.epoch = team.epoch; byKey.rev = rev; if (lead) byKey[lead] = { epoch: team.epoch, rev }; /* plant:tr2j */
  d.teams[team.id] = byKey;
  writeWhole(revsFile(keyFile), JSON.stringify(d, null, 1) + "\n");
}

/** A FORK SET THIS STUDIO'S FILE ASIDE (Claude alpha's ruling of 2026-11-23 00:37): the floor kept for `team` comes down to that
 *  team file's epoch and rev, the relay's that stands, so heldTeam reads it although this Studio had written a later one that never
 *  went up. The floor it replaces is kept beside it as `aside`, never lost. Nothing is written where the floor is not above it. */
function forkRevFloor(keyFile, team) {
  const rev = revOf(team), had = revFloor(keyFile, team.id);
  if (rev === null || !had || team.epoch > had.epoch || (team.epoch === had.epoch && rev >= had.rev)) return false;
  const d = readRevs(keyFile), was = own(d.teams, team.id) && typeof d.teams[team.id] === "object" ? d.teams[team.id] : {};
  const lead = team.lead && team.lead.public ? String(team.lead.public) : "";
  const next = { epoch: team.epoch, rev, aside: (Array.isArray(was.aside) ? was.aside : []).concat([{ epoch: had.epoch, rev: had.rev }]) };
  if (lead) next[lead] = { epoch: team.epoch, rev };
  d.teams[team.id] = next;
  writeWhole(revsFile(keyFile), JSON.stringify(d, null, 1) + "\n");
  return true;
}

/** The folder's team as readTeam reads it, held, only where it names the lead key in the key file `o.key` and verifies
 *  under it, and is not below the floor kept for it; otherwise `team` is null and `reason` says why, with `older` where
 *  a lower rev at the floor's epoch, or an epoch below it, was put back. The only way a team on the share becomes one
 *  Studio writes. */
async function heldTeam(folder, o) {
  const opts = o || {}, key = readKeyFile(opts.key);
  if (!key) throw new Error("no signing key file at " + path.resolve(String(opts.key || "")));
  const read = await readTeam(folder), t = read.team;
  let reason = !t ? "there is no team file here that the engine reads whole"
    : !t.lead || t.lead.keyId !== key.keyId || t.lead.public !== key.public ? "this team names another lead key than this Studio's"
    : !read.valid ? "this team's signature does not verify under its lead key, so it changed after it was signed" : "";
  const rev = reason ? 0 : revOf(t), floor = reason ? null : revFloor(opts.key, t.id, t.lead.public);
  const older = !!floor && rev !== null && (t.epoch < floor.epoch || (floor.epoch === t.epoch && rev < floor.rev)); /* plant:tr2f */
  if (!reason && rev === null) reason = "this team file's rev is not a whole number from 0, so nothing in it is used";
  if (older) reason = "this team file is older than one this Studio has already seen for team " + t.id + " ("
    + (t.epoch < floor.epoch
      ? "key number " + t.epoch + ", below " + floor.epoch + " at rev " + rev
      : "rev " + rev + ", below " + floor.rev + " at key number " + t.epoch)
    + "), so it was put back on the share and nothing in it is used";
  if (!reason) {
    try { raiseRevFloor(opts.key, t); } catch { /* a floor that cannot be written leaves the read as it was */ }
  }
  return Object.assign(read, { team: reason ? null : hold(t), reason }, older ? { older: true } : {});
}

/** A new team for these catalogs, led by this key: the first epoch, nobody met, unsealed unless `o.sealed` and
 *  `o.exportsSealed` say otherwise. `o.id` names it where the caller kept its key under that id first. */
function newTeam(o) {
  const T = Engine.teamRules(), opts = o || {};
  const id = opts.id == null ? "t-" + crypto.randomBytes(8).toString("hex") : String(opts.id);
  if (!T.V2_TEAM_ID_RE.test(id)) throw new Error("a team id is t- and 16 lower-case hex characters");
  return hold({ format: T.V2_TEAM_FORMAT, kind: T.V2_TEAM_KIND, id,
                catalogs: (opts.catalogs || []).map(String),
                lead: { keyId: String(opts.lead.keyId), public: String(opts.lead.public) },
                sealed: opts.sealed === true, exportsSealed: opts.exportsSealed === true, epoch: 1, roster: [] });
}

/** The held team saying `sealed`, and where it seals, listing `catalog` among its catalogs. Nothing is written. */
function withSealed(team, sealed, catalog) {
  if (!isHeld(team)) throw new Error(NOT_HELD + "; nothing changed");
  const out = JSON.parse(JSON.stringify(team));
  out.sealed = sealed === true;
  if (out.sealed && catalog != null && out.catalogs.indexOf(String(catalog)) < 0) out.catalogs.push(String(catalog));
  return hold(out);
}

/** What a catalog made from a member's desk file keeps of it (board 1015): {desk, original}, the author's desk id and the SHA-256 hex
 *  of the personal catalog's id, or null where either is not what it should be. The id itself is never kept: a personal catalog's id
 *  can carry its author's name, and every member reads the team file. */
function adoptedFromOf(from) {
  if (!from || typeof from !== "object") return null;
  const desk = String(from.desk || ""), original = String(from.original || "");
  return /^k-[0-9a-f]{16}$/.test(desk) && /^[0-9a-f]{64}$/.test(original) ? { desk, original } : null;
}

/** The held team listing `catalog` among its catalogs, and, where the team carries a ring inside its signed file (always on the
 *  relay), with `entry`, the lead's ring entry for that catalog, merged in as addToRing merges: an entry already there is kept,
 *  and the same key id under another public key for that catalog is refused. Nothing is written (board 962 stage 5, chooseTeam). */
function withCatalog(team, catalog, entry, adopted) {
  if (!isHeld(team)) throw new Error(NOT_HELD + "; nothing changed");
  const id = String(catalog == null ? "" : catalog);
  if (!id) throw new Error("a catalog id is needed; nothing changed");
  const out = JSON.parse(JSON.stringify(team));
  if (out.catalogs.indexOf(id) < 0) out.catalogs.push(id);
  if (ringDoc(out.ring) && entry) {
    if (String(entry.catalog) !== id || !entry.keyId || !entry.public)
      throw new Error("the ring entry must be the lead's own for catalog " + id + "; nothing changed");
    const same = out.ring.keys.filter((k) => k && String(k.catalog) === id && k.keyId === entry.keyId);
    if (same.some((k) => k.public !== entry.public))
      throw new Error("the team's ring already holds key " + entry.keyId + " for catalog " + id + " under another public key; nothing changed");
    if (!same.length) out.ring.keys.push(JSON.parse(JSON.stringify(entry))); /* plant:with-catalog-ring */
  }
  const from = adoptedFromOf(adopted);
  if (from) out.adopted = (Array.isArray(out.adopted) ? out.adopted.filter((a) => !a || String(a.catalog) !== id) : []).concat([{ catalog: id, desk: from.desk, original: from.original }]); /* plant:adopted-write */
  return hold(out);
}

/** The held team no longer listing `catalog`, and, where the team carries a ring inside its signed file, with every ring entry for
 *  that catalog dropped, whatever key it names: the catalog has left the team's place, so no key is vouched for it there. A team
 *  may be left with no catalog (board 962 stage 6, 3.1). Nothing is written. */
function withoutCatalog(team, catalog) {
  if (!isHeld(team)) throw new Error(NOT_HELD + "; nothing changed");
  const id = String(catalog == null ? "" : catalog);
  if (!id) throw new Error("a catalog id is needed; nothing changed");
  const out = JSON.parse(JSON.stringify(team));
  out.catalogs = out.catalogs.filter((c) => String(c) !== id); /* plant:without-catalog */
  if (ringDoc(out.ring)) out.ring.keys = out.ring.keys.filter((k) => !(k && String(k.catalog) === id)); /* plant:without-catalog-ring */
  if (Array.isArray(out.adopted)) out.adopted = out.adopted.filter((a) => !a || String(a.catalog) !== id); /* plant:adopted-prune */
  if (Array.isArray(out.adopted) && !out.adopted.length) delete out.adopted;
  return hold(out);
}

/** The held team saying how its desks prove their persons (board 980, stage 3): `hint` as src/desk-seat.mjs hintOf reads one,
 *  {providers: [{id, issuer, clientId, allow}]}, signed inside the file so a desk already in learns which provider admits it; null
 *  takes it off. A hint a desk would not read is refused. Nothing is written. */
function withSignin(team, hint) {
  if (!isHeld(team)) throw new Error(NOT_HELD + "; nothing changed");
  const out = JSON.parse(JSON.stringify(team));
  if (hint == null) { delete out.signin; return hold(out); }
  const read = hintOf(hint);
  if (!read) throw new Error("a team's sign-in names one to four providers, each with its issuer, client id and the organisations it admits; nothing changed");
  out.signin = read; /* plant:s3-team-hint */
  return hold(out);
}

/* The channel a team names, as a desk reads it, by the pinned desk's own teamChannelOf (board 900; this and revOf restated
   it until the pin carried it): absent is the folder, and a relay is named by its relay team id, 32 lower-case hex
   characters, and an https address. Anything the desk would not heed is refused. */
function channelOf(team) {
  const c = Engine.teamFileRules().teamChannelOf({ channel: team.channel });
  if (c) return c;
  throw new Error("a team's channel is the folder, or a relay named by its relay team id and an https address; nothing was written");
}
const ringDoc = g => !!g && typeof g === "object" && !Array.isArray(g) && g.kind === RING_KIND && +g.format === RING_FORMAT
  && Array.isArray(g.keys);

/** The held team on `channel`, {kind: "folder"} or {kind: "relay", rt, url}. On the relay `ring`, a ring document, rides
 *  inside the signed file and the desks read no ring beside it; where none is given the team's own is kept. A folder team
 *  may embed its ring too. Nothing is written. */
function withChannel(team, channel, ring) {
  if (!isHeld(team)) throw new Error(NOT_HELD + "; nothing changed");
  const out = JSON.parse(JSON.stringify(team));
  out.channel = channelOf({ channel: channel == null ? undefined : JSON.parse(JSON.stringify(channel)) });
  const g = ring === undefined ? out.ring : ring;
  if (out.channel.kind === "relay") {
    if (!ringDoc(g)) throw new Error("a team on the relay carries its ring inside the signed file, and no ring was given; nothing changed");
    out.ring = JSON.parse(JSON.stringify(g));
  } else if (ringDoc(ring)) { /* plant:folder-with-channel-ring */
    out.ring = JSON.parse(JSON.stringify(ring));
  } else {
    delete out.ring;
  }
  return hold(out);
}

/** The held team with `ring`, a ring document, embedded inside it; null deletes the embedded ring. Nothing is written. */
function withRing(team, ring) {
  if (!isHeld(team)) throw new Error(NOT_HELD + "; nothing changed");
  const out = JSON.parse(JSON.stringify(team));
  if (ring == null) delete out.ring;
  else if (ringDoc(ring)) out.ring = JSON.parse(JSON.stringify(ring)); /* plant:folder-with-ring */
  else throw new Error("the ring must be a ring document; nothing changed");
  return hold(out);
}

/** The held team saying whether a desk's Export of its sealed catalog stays sealed (23b-B). Nothing is written. */
function withExportsSealed(team, sealed) {
  if (!isHeld(team)) throw new Error(NOT_HELD + "; nothing changed");
  const out = JSON.parse(JSON.stringify(team));
  out.exportsSealed = sealed === true;
  return hold(out);
}

/** The held team saying whether the desks may share a card with a named teammate (board 1013, piece 6). Off is written as
 *  `sharing: "off"`; on is the field absent, so a team file published before this switch reads on and its bytes do not change.
 *  Nothing is written. */
function withSharing(team, on) {
  if (!isHeld(team)) throw new Error(NOT_HELD + "; nothing changed");
  const out = JSON.parse(JSON.stringify(team));
  if (on === true) delete out.sharing;
  else out.sharing = "off"; /* plant:sharing-field */
  return hold(out);
}

/** A team document this Studio kept, held where it names the lead key in the key file `o.key` and verifies under it, as
 *  heldTeam takes one from the share; otherwise `team` is null and `reason` says why. */
async function heldCopy(doc, o) {
  const opts = o || {}, key = readKeyFile(opts.key), T = Engine.teamRules();
  if (!key) throw new Error("no signing key file at " + path.resolve(String(opts.key || "")));
  const read = T.v2TeamRead(doc == null ? null : JSON.stringify(doc)), t = read.team;
  const reason = !t ? "this copy is not a team file the engine reads whole"
    : !t.lead || t.lead.keyId !== key.keyId || t.lead.public !== key.public ? "this copy names another lead key than this Studio's"
    : await T.v2TeamSigState(t) !== T.states.valid ? "this copy's signature does not verify under its lead key" : "";
  return { team: reason ? null : hold(t), reason };
}

/** The team with this desk on its roster under `name`, or renamed where it is there already. Its
 *  block is the desk's own, as its genuine file carries it. An empty name leaves the desk's own.
 *  A desk already there keeps its key and box: another one is refused, and changes only through admit. */
function withDesk(team, desk, name) {
  return placeDesk(team, desk, name, false);
}

/** The held team without desk `id` on its roster, at the same key number: for a desk whose yes the relay refused because the desk
 *  had taken its request back there (E4 of relay-life-h345), which was never enrolled and so is not removed, and no key moves.
 *  A desk not on the roster leaves the team as it is. Nothing is written. */
function withoutDesk(team, id) {
  if (!isHeld(team)) throw new Error(NOT_HELD + "; nothing changed");
  const out = JSON.parse(JSON.stringify(team));
  out.roster = (out.roster || []).filter(e => !(e && e.desk && e.desk.id === String(id)));
  return hold(out);
}

/** The held team with handover step `step` appended and lead set to `newLead`. Nothing is written. */
function withHandover(team, step, newLead) {
  if (!isHeld(team)) throw new Error(NOT_HELD + "; nothing changed");
  const out = JSON.parse(JSON.stringify(team));
  const list = Array.isArray(out.handover) ? out.handover.slice() : [];

  /* Refuse handover to a key already in the chain and bound chain to HANDOVER_STEPS (8) */
  /* plant:handover-cycle-bound */
  if (true) {
    if (list.length >= 8) {
      throw new Error("This team has been handed to a new key 8 times, the most a team can be. A further key leads a new team: on the Team screen, Start a new team here. Nothing was changed.");
    }
    const toPub = step && step.to && step.to.public;
    const initialLeadPub = (team.lead && team.lead.public) || (list[0] && list[0].from && list[0].from.public);
    const seenPubs = new Set();
    if (initialLeadPub) seenPubs.add(initialLeadPub);
    for (const s of list) {
      if (s && s.from && s.from.public) seenPubs.add(s.from.public);
      if (s && s.to && s.to.public) seenPubs.add(s.to.public);
    }
    if (toPub && seenPubs.has(toPub)) {
      throw new Error("This team has already been led by that signing key. A handover cannot return to a key already in the chain; nothing was changed.");
    }
  }

  out.handover = list.concat([step]);
  out.lead = Object.assign({}, newLead);
  return hold(out);
}

/* WHAT A MEMBER SAYS IT IS (board 885): a label carried from its own signed request onto the roster, granting nothing.
   Only desks join today; a Studio joins by the same doors once S4 and S5 land, and any other word is not carried. */
const KINDS = ["desk", "studio"];

function placeDesk(team, desk, name, rekey) {
  const out = JSON.parse(JSON.stringify(team));
  const block = { id: String(desk.id), key: String(desk.key), box: String(desk.box) };
  if (typeof desk.name === "string" && desk.name) block.name = desk.name;
  if (typeof desk.kind === "string" && KINDS.indexOf(desk.kind) >= 0) block.kind = desk.kind;
  const entry = { desk: block };
  if (String(name || "").trim()) entry.name = String(name).trim();
  const i = out.roster.findIndex(e => e && e.desk && e.desk.id === block.id);
  if (i >= 0 && !rekey && (out.roster[i].desk.key !== block.key || out.roster[i].desk.box !== block.box))
    throw new Error("desk " + block.id + " is on the roster with another key or box, which changes only by admitting"
      + " the desk's own file; nothing changed");
  if (i < 0) out.roster.push(entry); else out.roster[i] = Object.assign({}, out.roster[i], entry);
  return isHeld(team) ? hold(out) : out;
}

/** The held team with this desk admitted: on the roster as withDesk puts it, its entry carrying `teamKey` wrapped to its
 *  box for the team's epoch. `doc` is the desk's own file or join request as read from `desks/<folder>/`, and it must be
 *  genuine there by the pinned engine's deskFileGenuine, whose signature covers the box. Nothing is written. */
function admit(team, doc, folder, teamKey) {
  if (!isHeld(team)) throw new Error(NOT_HELD + "; nothing was wrapped");
  const b = doc && doc.desk;
  if (!Engine.deskRules().deskFileGenuine(doc, String(folder == null ? "" : folder)) || !/^[0-9a-f]{64}$/.test(String(b.box)))
    throw new Error("a desk is admitted by its own file, genuine in its own folder by the engine's desk rule, box"
      + " included; nothing was wrapped");
  const out = placeDesk(team, b, "", true);
  const e = out.roster.find(x => x && x.desk && x.desk.id === b.id);
  e.wrap = Engine.hpkeRules().wrapTeamKey(teamKey, b.box, out.id, out.epoch, b.id);
  return out;
}

/** The held team with a desk admitted by its own request to join this team, as src/join.mjs takes one once the lead has
 *  typed its code: genuine in its own folder by the pinned engine's joinGenuine, and revealed. Nothing is written. */
function admitRequest(team, request, folder, teamKey) {
  if (!isHeld(team)) throw new Error(NOT_HELD + "; nothing was wrapped");
  const b = request && request.desk;
  if (!Engine.joinRules().joinGenuine(request, String(folder == null ? "" : folder)) || request.team !== team.id
    || request.reveal === undefined)
    throw new Error("a desk is admitted here by its own request to join this team, genuine in its own folder and revealed;"
      + " nothing was wrapped");
  const out = placeDesk(team, b, "", true);
  const e = out.roster.find(x => x && x.desk && x.desk.id === b.id);
  e.wrap = Engine.hpkeRules().wrapTeamKey(teamKey, b.box, out.id, out.epoch, b.id);
  return out;
}

/** The held team with a desk admitted by its own request to join this team with no code (board 885, S2): genuine in its
 *  own folder by the pinned engine's joinGenuine, its proof of an invitation or the lead's auto-admit having been checked
 *  by the caller (src/join.mjs). `how` labels the entry, which grants nothing: {door: "invitation", invite: the
 *  invitation's id}, which also keeps that invitation from letting a second desk in, or {door: "auto"}. Nothing is written. */
function admitAsked(team, request, folder, teamKey, how) {
  if (!isHeld(team)) throw new Error(NOT_HELD + "; nothing was wrapped");
  const b = request && request.desk, o = how || {};
  if (o.door !== "invitation" && o.door !== "auto")
    throw new Error("a desk is let in with no code only by an invitation or by the lead's auto-admit; nothing was wrapped");
  if (o.door === "invitation" && !/^[0-9a-f]{16}$/.test(String(o.invite)))
    throw new Error("a desk let in by an invitation names that invitation's id; nothing was wrapped");
  if (!Engine.joinRules().joinGenuine(request, String(folder == null ? "" : folder)) || request.team !== team.id)
    throw new Error("a desk is admitted here by its own request to join this team, genuine in its own folder; nothing was wrapped");
  const out = placeDesk(team, b, "", true);
  const e = out.roster.find(x => x && x.desk && x.desk.id === b.id);
  e.wrap = Engine.hpkeRules().wrapTeamKey(teamKey, b.box, out.id, out.epoch, b.id);
  e.door = o.door;
  if (o.door === "invitation") e.invite = String(o.invite); else delete e.invite;
  if (o.asked && typeof o.asked === "object" && typeof o.asked.id === "string") {
    e.asked = { id: String(o.asked.id), epoch: Number(o.asked.epoch || 1), counter: Number(o.asked.counter || 0) };
  }
  return out;
}

/** The next epoch with `o.remove` (a desk id or a list) off the roster: a fresh team key, wrapped again for each admitted
 *  desk that remains, and the recovery copy, where the team keeps one, under the signing key `o.secret` opens (or `o.recoveryPassphrase`).
 *  `o.teamKey`, 32 bytes, is used where the caller has already kept the new key; otherwise a new one is made. Returns {team,
 *  teamKey} and writes nothing. The wraps go to the roster the team names, so only a team signed by the key this
 *  Studio holds (`o.key`, the key file) is taken: one that verifies under a lead key it names itself is refused. */
async function newEpoch(team, o) {
  const opts = o || {}, T = Engine.teamRules(), W = Engine.hpkeRules();
  const held = readKeyFile(opts.key);
  if (!held) throw new Error("no signing key file at " + path.resolve(String(opts.key || "")));
  const ours = !!team && !!team.lead && team.lead.keyId === held.keyId && team.lead.public === held.public;
  if (!ours || await T.v2TeamSigState(team) !== T.states.valid)
    throw new Error("a new team key is made only for a team file signed by this Studio's own key; nothing was wrapped");
  const gone = [].concat(opts.remove == null ? [] : opts.remove).map(String);
  gone.forEach(id => {
    if (!team.roster.some(e => e && e.desk && e.desk.id === id)) throw new Error("desk " + id + " is not on the roster; nothing changed");
  });
  const again = opts.recoveryPassphrase || (opts.secret ? recoveryOf(opts.key, opts.secret) : "");
  if (team.recovery !== undefined && !again)
    throw new Error("this team keeps a recovery copy, which a new team key wraps again under the signing key; nothing changed");
  let teamKey;
  if (opts.teamKey != null) {
    teamKey = Buffer.from(opts.teamKey);
    if (teamKey.length !== 32) throw new Error("a team key is 32 bytes; nothing was wrapped");
  } else teamKey = crypto.randomBytes(32);
  let out = JSON.parse(JSON.stringify(team));
  delete out.sig;
  delete out.recovery;
  out.epoch = team.epoch + 1;
  out.roster = out.roster.filter(e => gone.indexOf(e.desk.id) < 0).map(e => e.wrap === undefined ? e
    : Object.assign({}, e, { wrap: W.wrapTeamKey(teamKey, e.desk.box, out.id, out.epoch, e.desk.id) }));
  if (team.recovery !== undefined) out = withRecovery(out, teamKey, again);
  return { team: hold(out), teamKey };
}

/** The secret the lead's recovery copy is wrapped under: derived from the signing key in `keyFile`, opened by `secret`
 *  (src/sign.mjs recoverySecret), so the key's backup copy is the team's too. Throws where the key does not open. */
function recoveryOf(keyFile, secret) {
  const read = readKeyFile(keyFile);
  if (!read) throw new Error("no signing key file at " + path.resolve(String(keyFile || "")));
  return recoverySecret(unlockKey(read, secret));
}

/* The recovery copy's associated data: a copy moved into another team or epoch does not open. */
function recoveryAad(team) {
  return Buffer.from("etiuda-team-recovery\n" + team.id + "\n" + team.epoch, "utf8");
}

/** The team with the lead's recovery copy of `teamKey` under `passphrase`, by the scrypt and AES-256-GCM wrap of
 *  Studio's signing key (sign.mjs wrapKey). The passphrase is not kept. */
function withRecovery(team, teamKey, passphrase) {
  if (!Buffer.isBuffer(teamKey) || teamKey.length !== 32) throw new Error("a team key is 32 bytes");
  if (!String(passphrase == null ? "" : passphrase)) throw new Error("the recovery copy needs the lead's passphrase");
  const out = JSON.parse(JSON.stringify(team)), salt = crypto.randomBytes(16), iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv(CIPHER, wrapKey(passphrase, salt), iv);
  c.setAAD(recoveryAad(out));
  const ct = Buffer.concat([c.update(teamKey), c.final(), c.getAuthTag()]);
  out.recovery = { epoch: out.epoch, kdf: KDF.kdf, N: KDF.N, r: KDF.r, p: KDF.p, cipher: CIPHER,
                   salt: salt.toString("hex"), iv: iv.toString("hex"), ct: ct.toString("hex") };
  return isHeld(team) ? hold(out) : out;
}

/** The team key from the lead's recovery copy, or null: a wrong passphrase, another team or epoch, or no copy. */
function openRecovery(team, passphrase) {
  try {
    const rc = team && team.recovery;
    if (!rc || rc.epoch !== team.epoch || rc.kdf !== KDF.kdf || rc.cipher !== CIPHER
      || rc.N !== KDF.N || rc.r !== KDF.r || rc.p !== KDF.p) return null;
    const ct = Buffer.from(String(rc.ct), "hex");
    if (ct.length !== 48) return null;
    const d = crypto.createDecipheriv(CIPHER, wrapKey(String(passphrase == null ? "" : passphrase), Buffer.from(String(rc.salt), "hex")),
      Buffer.from(String(rc.iv), "hex"), { authTagLength: 16 });
    d.setAAD(recoveryAad(team));
    d.setAuthTag(ct.subarray(32));
    return Buffer.concat([d.update(ct.subarray(0, 32)), d.final()]);
  } catch { return null; }
}

/** Sign the held team with the lead's key and write it beside the catalogs, by replacement. A key
 *  that is not the team's lead is refused before anything is written, and so are a team that is not
 *  held, a team below the floor kept for it (the refusal carries `older: true`) and a file the engine's own reader would not
 *  read whole. */
async function writeTeam(folder, team, o) {
  const opts = o || {}, T = Engine.teamRules();
  const read = readKeyFile(opts.key);
  if (!read) throw new Error("no signing key file at " + path.resolve(String(opts.key || "")));
  if (!team || !team.lead || read.keyId !== team.lead.keyId || read.public !== team.lead.public)
    throw new Error("the team file is the lead's, and this key is not the one it names; nothing was written");
  if (!isHeld(team)) throw new Error(NOT_HELD + "; nothing was written");
  /* THE FLOOR HOLDS FOR EVERY TEAM HANDED IN, WHEREVER IT CAME FROM (board 929): heldTeam guards the share's file, but a team
     this Studio kept and put back where the share's file has gone never passed it, and was signed again at its older epoch
     under a fresh rev, listing a desk removed since. A team below the floor kept for it, an epoch below the floor's or a rev
     below it at the floor's epoch, is refused before anything is signed or written, with `older` set for the caller to say.
     A team at the floor's rev is the one this Studio last wrote or held, and signs the next rev as ever. */
  /* A TEAM HANDED IN BEHIND THE FILE IT WOULD REPLACE IS STALE (board 962 stage 5, the backstop of the team lock): where the file
     at the folder is this team's, under this lead, genuine, and at a higher epoch or rev than the team handed in, another writer
     moved it on since the caller read it, and signing the caller's copy would undo that writer's change under a fresh rev. So it
     is refused before the floor is asked, with `stale` set and nothing written, and the caller reads the file again. A writer
     outside the lock is what this catches: another computer of the lead, or a sync landing the relay's newer file. */
  let there = null;
  try { const r = await readTeam(folder); if (r.team && r.valid && r.team.id === team.id && r.team.lead && r.team.lead.public === team.lead.public) there = r.team; }
  catch (e) {
    /* A file that is there and will not be read may be newer: it is not written over (the review of 973f615f). */
    throw Object.assign(new Error("the team file at " + path.resolve(String(folder || ".")) + " could not be read ("
      + String(e && e.code || e && e.message || e) + "), so it was not written over; nothing was written"), { unreadable: true });
  }
  if (there && teamRank(team) && teamAhead(there, team)) /* plant:stale-team */
    throw Object.assign(new Error("the team file at " + path.resolve(String(folder || ".")) + " moved on since it was read (rev " + revOf(there)
      + " at key number " + there.epoch + "), so this older copy was not signed; nothing was written"), { stale: true });
  const floor = revFloor(opts.key, team.id, team.lead.public), had = revOf(team);
  if (floor && (team.epoch < floor.epoch || (had !== null && team.epoch === floor.epoch && had < floor.rev))) /* plant:tr2i */
    throw Object.assign(new Error("this team is older than one this Studio has already seen for team " + team.id + " ("
      + (team.epoch < floor.epoch ? "key number " + team.epoch + ", below " + floor.epoch : "rev " + had + ", below " + floor.rev
        + " at key number " + team.epoch) + "); nothing was written"), { older: true });
  const open = unlockKey(read, opts.passphrase);
  /* The lead's box is written on every team file this Studio signs, and on no other field. An existing team
     gains it at the next write. A box that does not open throws here, before either file is replaced. */
  const box = ensureLeadBox(read, open);
  const doc = JSON.parse(JSON.stringify(team));
  delete doc.sig;
  doc.lead = Object.assign({}, doc.lead, { box: box.public }); /* plant:txsl-891sa */
  /* The statistics box follows the signing key, so a team handed on names the new key's (src/sign.mjs statsBoxOf). */
  /* plant:stats-box-named */
  doc.lead.stats = statsBoxOf(open).public;
  doc.channel = channelOf(doc);
  if (doc.channel.kind === "relay") {
    if (!ringDoc(doc.ring)) throw new Error("a team on the relay carries its ring inside the signed file, and this one has none; nothing was written");
  } else if (!ringDoc(doc.ring)) { /* plant:folder-write-team-ring */
    delete doc.ring;
  }
  doc.rev = await nextRev(folder, doc, opts.key);
  const signed = await signDocument(doc, { privateKey: open.privateKey, keyId: open.keyId });
  const back = T.v2TeamRead(JSON.stringify(signed));
  if (!back.team || back.problems.length || await T.v2TeamSigState(back.team) !== T.states.valid)
    throw new Error("the engine does not read this team file whole, so nothing was written: "
      + JSON.stringify(back.problems));
  const at = teamPath(folder);
  writeWhole(at, json(signed));
  try { raiseRevFloor(opts.key, signed); } catch { /* the file is written; heldTeam raises the floor at its next read */ }
  return { at, team: hold(signed) };
}

/* One higher than the team file at the folder where it is this team's under this lead key, than the team handed in, and
   than the floor kept for it. A file written before revisions counts as 0. */
async function nextRev(folder, team, keyFile) {
  let there = 0;
  try {
    const read = await readTeam(folder), t = read.team;
    if (t && read.valid && t.id === team.id && t.lead && t.lead.public === team.lead.public) there = revOf(t) || 0;
  } catch (e) {
    throw Object.assign(new Error("the team file at " + path.resolve(String(folder || ".")) + " could not be read ("
      + String(e && e.code || e && e.message || e) + "), so it was not written over; nothing was written"), { unreadable: true });
  }
  const floor = revFloor(keyFile, team.id, team.lead.public);
  const rev = Math.max(revOf(team) || 0, there, floor ? floor.rev : 0) + 1;
  if (!Number.isSafeInteger(rev)) throw new Error("this team's rev has no next number; nothing was written");
  return rev;
}

/** The name the lead gave this desk, or null. */
function rosterName(team, deskId) {
  const e = ((team && team.roster) || []).find(x => x && (
    (x.desk && x.desk.id === String(deskId)) || (x.id === String(deskId))
  ));
  if (!e) return null;
  if (typeof e.rosterName === "string" && e.rosterName.trim()) return e.rosterName.trim();
  if (e.desk && typeof e.name === "string" && e.name.trim()) return e.name.trim();
  return null;
}

export { teamPath, readTeam, heldTeam, heldCopy, newTeam, withSealed, withCatalog, withoutCatalog, withExportsSealed, withSharing, withSignin, withChannel, withRing, withDesk, withoutDesk, withHandover, admit, admitRequest, admitAsked, newEpoch, withRecovery, openRecovery, recoveryOf,
  writeTeam, rosterName, revsFile, revFloor, raiseRevFloor, forkRevFloor, conflictSiblingName };
