/* DESKS ASKING TO JOIN A TEAM, ON THE LEAD'S SIDE. Board 834, step 12, slice 5.
 *
 *     import { listJoins, refuseJoin, admitWaiting, inviteSightings, closeRequest, relayAsk } from "./src/join.mjs";
 *
 * NO CODE IS TYPED HERE (board 1017). A request that proves an invitation this Studio made is let in with nobody pressing
 * anything, when Studio next sees it (Claude alpha's ruling of 2026-10-13 11:30: issuing the invitation is the lead's consent),
 * and on the relay a request at the standing door is let in where its certificate names a person this team knows. These are
 * admitWaiting, the watch's admission. The six digits a desk once showed and a lead typed, the opening and the reveal that made them,
 * went with the shared folder's join: a team is joined over the relay alone.
 *
 * THE OLD REQUEST OF A MEMBER SINCE REMOVED IS NOT AN ASK (board 885, S1). A desk admitted may leave its request
 * on the share until it next runs, and once it is off the roster that request would read as asking again. A removal marks
 * it in the file of openings, `removed: true` beside whatever its entry held, so the engine's joinOpening answers the desk
 * exactly as before and listJoins leaves that request out. A request the desk makes anew commits to a new nonce, which no
 * mark names, and is listed, opened and admitted as any request is.
 *
 * THE FILE OF OPENINGS IS THE LEAD'S, SIGNED (board 974, security 7). Every write signs the whole file with the lead's key over
 * the pinned shell's joinsSignedBytes, the bytes a desk's joinOpening checks, so a caller that writes one hands in the opened key
 * (`signer`, {privateKey, keyId}). A file that does not hold under the lead of the team held here says nothing: no refusal, no
 * removal, and none of its entries is carried into the next file signed.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import * as Engine from "./engine.mjs";
import { admitAsked } from "./team.mjs";
import { inviteState, shownName } from "./invite.mjs";
import { writeWhole } from "./whole-write.cjs";
import { parsePlain } from "./plain-json.mjs";
import { readWithin, TEAM_READ_MAX } from "./share-read.cjs";


/* A share file past the team-file cap is unread and counts as absent. Anything that will not parse does too. */
function readJson(file) {
  try {
    const text = readWithin(file, TEAM_READ_MAX).toString("utf8").replace(/^\uFEFF/, "");
    return parsePlain(text);
  } catch { return null; }
}
function requestOf(folder, id) {
  return readJson(path.join(path.resolve(String(folder || ".")), "desks", id, "join.json"));
}
function joinsPath(folder) {
  return path.join(path.resolve(String(folder || ".")), Engine.joinRules().JOINS_NAME);
}
const SPKI_ED25519 = Buffer.from("302a300506032b6570032100", "hex");
/* The file of openings as read, where the lead of `team` signed it; null for any other file, unsigned or signed by anyone else. */
function joinsHeld(joins, team) {
  const J = Engine.joinRules(), sig = joins && joins.sig, pub = team && team.lead ? String(team.lead.public) : "";
  if (!joins || joins.kind !== J.JOINS_KIND || joins.team !== team.id || !Array.isArray(joins.open) || !sig || sig.alg !== "Ed25519"
    || !/^[0-9a-f]{128}$/.test(String(sig.value)) || !/^[0-9a-f]{64}$/.test(pub)) return null;
  try {
    const key = crypto.createPublicKey({ key: Buffer.concat([SPKI_ED25519, Buffer.from(pub, "hex")]), format: "der", type: "spki" });
    return crypto.verify(null, J.joinsSignedBytes(joins), key, Buffer.from(String(sig.value), "hex")) ? joins : null;
  } catch { return null; }
}
/* Signs and writes the whole file of openings for `team`, its entries `open`. A key that is not the team's lead writes nothing. */
function writeJoins(folder, team, open, signer) {
  const J = Engine.joinRules();
  if (!signer || !signer.privateKey) throw new Error("the file of openings is signed by the team's lead, and no key was opened to sign it; nothing was written");
  const doc = { format: 1, kind: J.JOINS_KIND, team: team.id, lead: { keyId: team.lead.keyId, public: team.lead.public }, open: open,
                sig: { alg: "Ed25519", keyId: String(signer.keyId || "") } };
  doc.sig.value = crypto.sign(null, J.joinsSignedBytes(doc), signer.privateKey).toString("hex");
  if (!joinsHeld(doc, team)) throw new Error("the key opened is not the lead of team " + team.id + "; the file of openings was not written");
  writeWhole(joinsPath(folder), JSON.stringify(doc, null, 1) + "\n");
}
/* Writes this desk's entry in the file of openings, every other desk's for the same team kept where the lead signed the file. */
function putOpening(folder, team, entry, signer) {
  const held = joinsHeld(readJson(joinsPath(folder)), team);
  writeJoins(folder, team, (held ? held.open.filter(e => e && e.desk !== entry.desk) : []).concat([entry]), signer);
}
/* Whether the file of openings, as joinsHeld answered it, marks this very request (desk and commitment) as a removed member's old one. */
function removedMark(held, id, commit) {
  return !!held && held.open.some(e => !!e && e.desk === id && e.commit === commit && e.removed === true);
}
function admittedNow(team, d) {
  return (team.roster || []).some(e => e && e.desk && e.desk.id === d.id && e.desk.key === d.key && e.desk.box === d.box
    && e.wrap && e.wrap.epoch === team.epoch);
}

/* Every genuine request to join `team` in the folder's desks/ that is still asking: [{id, doc}], by desk id. A desk already
   admitted with the same keys, a request refused here, and the old request of a member since removed, are left out. */
function asking(root, team) {
  const J = Engine.joinRules();
  let ids = [];
  try { ids = fs.readdirSync(path.join(root, "desks")).filter(n => /^k-[0-9a-f]{16}$/.test(n)).sort(); } catch { return []; }
  const out = [], held = team ? joinsHeld(readJson(joinsPath(root)), team) : null;
  for (const id of ids) {
    const doc = requestOf(root, id);
    if (!doc || !team || doc.team !== team.id || !J.joinGenuine(doc, id) || admittedNow(team, doc.desk)) continue;
    const said = J.joinOpening(held, team.id, id, doc.commit, [team.lead.public]);
    if ((said && said.refused) || removedMark(held, id, doc.commit)) continue;
    out.push({ id, doc });
  }
  return out;
}
/* Requests by the time each says it asked, then by desk id, a request with no readable time last. */
function firstAsked(a, b) {
  const at = r => (typeof r.doc.date === "string" && Number.isFinite(Date.parse(r.doc.date)) ? Date.parse(r.doc.date) : Infinity);
  return at(a) - at(b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0); /* plant:spend-first-asked */
}
/* The time this Studio first saw `row`'s request, from the book's seen map, or null where none is recorded. */
function seenMillis(row, invites) {
  const inv = row && row.doc && row.doc.invite && typeof row.doc.invite === "object" ? row.doc.invite : null;
  const id = inv && typeof inv.id === "string" ? inv.id : "";
  const book = id && invites && typeof invites === "object" && !Array.isArray(invites) ? invites[id] : null;
  const seen = book && book.seen && typeof book.seen === "object" && !Array.isArray(book.seen) ? book.seen[row.id] : null;
  const ms = typeof seen === "string" ? Date.parse(seen) : NaN;
  return Number.isFinite(ms) ? ms : null;
}
/* Where this Studio has a time for both, the earlier sight wins. Otherwise the time the request states, then the desk id. */
function orderWaiting(a, b, invites) {
  const as = seenMillis(a, invites), bs = seenMillis(b, invites);
  if (as != null && bs != null && as !== bs) return as - bs; /* plant:seen-order */
  return firstAsked(a, b);
}
/* Invitations two or more still-asking requests share at the earliest time this Studio saw any of them. A request with no
   recorded time is not a tie: the order of the time it states still decides, as it did before this Studio kept those times. */
function tiedInvites(folder, team, invites, now) {
  const root = path.resolve(String(folder || "."));
  const byInv = new Map();
  for (const row of asking(root, team)) {
    if (inviteState(row.doc, team, invites, now) !== "valid") continue;
    const id = String(row.doc.invite.id);
    if (!byInv.has(id)) byInv.set(id, []);
    byInv.get(id).push(row);
  }
  const out = new Set();
  for (const [id, rows] of byInv) {
    if (rows.length < 2) continue;
    const times = rows.map((r) => seenMillis(r, invites));
    if (times.some((t) => t == null)) continue;
    const earliest = Math.min(...times);
    if (times.filter((t) => t === earliest).length >= 2) out.add(id); /* plant:seen-tie */
  }
  return out;
}
/** Genuine requests naming an invitation, for the book to record who this Studio saw: {invite, desk, name}. Nothing is written. */
function inviteSightings(folder, team) {
  const out = [];
  for (const { id, doc } of asking(path.resolve(String(folder || ".")), team)) {
    if (!doc.invite || typeof doc.invite !== "object" || typeof doc.invite.id !== "string") continue;
    out.push({ invite: String(doc.invite.id), desk: id, name: typeof doc.desk.name === "string" ? doc.desk.name : "" });
  }
  return out;
}
/* What a request says it is, as a label: "desk" where it says nothing, as every desk's request did before board 885. */
const kindOf = (doc) => (typeof doc.desk.kind === "string" && doc.desk.kind ? doc.desk.kind : "desk");

/** Every genuine request to join `team` in the folder's desks/, newest first, each with where it stands: "asks" (not opened
 *  here), "opened" (waiting for the desk to answer), "ready" (the code can be typed), or "spent" (answered to an opening
 *  this Studio does not hold, so the desk asks again). A desk already admitted with the same keys, a request refused
 *  here, and the old request of a member since removed, are left out. Each row also says what the desk says it is
 *  (`kind`), the door it came by (`door`, "invitation" where it carries one, else "folder"), and, for an invitation, where
 *  that invitation stands by the book `o.invites` at `o.now` (`invite`, src/invite.mjs inviteState): "valid" lets it in
 *  with no code. */
function listJoins(folder, team, o) {
  const opts = o || {}, root = path.resolve(String(folder || "."));
  const tied = tiedInvites(root, team, opts.invites, opts.now);
  const out = asking(root, team).map(({ id, doc }) => {
    /* THE NAME THE LEAD READS BEFORE LETTING A DESK IN (the read's R4) is the request's own text, so it is shown without the
       characters that turn or hide text, by the rule the desk's reader holds a lead's name to (src/invite.mjs shownName). */
    const inviteId = doc.invite && typeof doc.invite === "object" && typeof doc.invite.id === "string" ? doc.invite.id : "";
    const row = { id: id, name: typeof doc.desk.name === "string" ? shownName(doc.desk.name) : "", key: doc.desk.key, asked: String(doc.date || ""),
             kind: kindOf(doc), door: doc.invite === undefined ? "folder" : "invitation",
             invite: inviteState(doc, team, opts.invites, opts.now), inviteId: inviteId };
    if (inviteId && tied.has(inviteId)) row.tied = true;
    return row;
  });
  return out.sort((a, b) => (a.asked < b.asked ? 1 : a.asked > b.asked ? -1 : 0));
}

/* WHICH KINDS AUTOMATIC JOINING LETS IN: desks. Whether it lets a Studio in too is the design's question 6 (board 885,
   lead-engineer-2026-10-12-board885-design.md, section 6), Maxim's and unanswered; until he answers, a request of any
   other kind that names no invitation waits for the lead, as every such request does with the switch off. */
const AUTO_ADMIT_KINDS = ["desk"];

/** The held team with the desks asking to join it that join with nobody pressing anything (board 885, S2), the watch's
 *  admission. A request that proves a live invitation of this team (src/invite.mjs inviteState "valid", by the book
 *  `invites` at `now`) is let in, its invitation spent, and one invitation lets one desk in: a second request naming it
 *  reads it as spent, from the roster just made. A request whose invitation does not hold is never let in here, since a
 *  proof that fails is a forgery or a reuse; it is left asking with inviteState's word, which the Desks screen says. A
 *  request that names no invitation is let in only where `known(id, doc)` says its desk carries a seat certificate naming
 *  a person this team already admitted (the person's own sign-in, board 980), and its kind is one AUTO_ADMIT_KINDS names
 *  ("kind" where it is not); otherwise it is left, and `refused` lists each door request `known` refused ({desk, door}). A team
 *  not on the relay is let nobody in. `skipped` says, per desk, why it waits; `spent` pairs each invitation used with its desk;
 *  `doors` lists each known desk let in at the standing door ({desk, door, box}). Nothing is written. */
function admitWaiting(folder, team, teamKey, invites, now, asked, canAdmit, known) {
  const root = path.resolve(String(folder || "."));
  let out = team;
  const admitted = [], skipped = [], spent = [], doors = [], refused = [];
  const onRelay = !!(team && team.channel && team.channel.kind === "relay");
  /* A team kept for a shared folder is held and admits nobody (the folder team's removal): nothing is read, nothing is written.
     plant:a3-known stood on the folder team's known-person door, which is gone with it; the mark stays until the plant guard has a way to retire one. */
  if (!onRelay) return { team: out, admitted, skipped, spent, doors, refused }; /* plant:fh-admit-wait */
  const tied = tiedInvites(root, team, invites, now);
  /* In the order this Studio first saw them, so of two requests naming one invitation the first one seen is the one it
     lets in. A request with no recorded time keeps the order of the time it states. Two or more that share the earliest
     sight of one invitation are a tie: nobody is let in, and nobody is refused, until the lead admits one. */
  for (const { id, doc } of asking(root, team).sort((a, b) => orderWaiting(a, b, invites))) {
    const invId = doc.invite && typeof doc.invite === "object" && typeof doc.invite.id === "string" ? String(doc.invite.id) : "";
    if (invId && tied.has(invId)) { skipped.push({ id: id, why: "tie" }); continue; }
    /* A request with no invitation is asked of `known` before the teammates' limit, so one that will not be let in never takes a
       place, and a refused door request is handed back to be dropped at once rather than waiting as "limit" at every pass. */
    const knownHere = doc.invite === undefined && typeof known === "function" && known(id, doc) === true;
    const doorId = typeof doc.door === "string" && /^[0-9a-f]{32}$/.test(doc.door) ? doc.door : "";
    /* THE STANDING DOOR (board 980, A4): on the relay a request with no invitation is let in only where its certificate names a
       person this team knows, and a request that came by the door and is refused so (a stranger, a removed person, a certificate
       that does not stand) is handed back to be dropped at the relay. With no `known` (no licence reference kept) it waits. */
    const doorRefused = doc.invite === undefined && !knownHere; /* plant:rs914-admit */
    if (doorRefused) { /* plant:a4-relay-known */
      if (doorId && typeof known === "function") refused.push({ desk: id, door: doorId });
      continue;
    }
    if (typeof canAdmit === "function") {
      const allow = canAdmit(id, doc);
      if (allow !== true) {
        skipped.push({ id: id, why: typeof allow === "string" ? allow : "limit" });
        continue;
      }
    }
    if (doc.invite !== undefined) {
      const st = inviteState(doc, out, invites, now);
      if (st !== "valid") { skipped.push({ id: id, why: st }); continue; }
      const reqAsked = typeof asked === "function" ? asked(id) : (asked && typeof asked === "object" ? asked[id] : null);
      out = admitAsked(out, doc, id, teamKey, { door: "invitation", invite: doc.invite.id, asked: reqAsked });
      spent.push({ invite: String(doc.invite.id), desk: id });
    } else {
      if (AUTO_ADMIT_KINDS.indexOf(kindOf(doc)) < 0) { skipped.push({ id: id, why: "kind" }); continue; }
      out = admitAsked(out, doc, id, teamKey, { door: "auto" });
      if (doorId) doors.push({ desk: id, door: doorId, box: String(doc.desk.box) });
    }
    admitted.push(id);
  }
  return { team: out, admitted, skipped, spent, doors, refused };
}

/** Says no to a desk's request, in the file of openings signed by `signer`. */
function refuseJoin(folder, team, id, signer) {
  const J = Engine.joinRules(), doc = requestOf(folder, String(id));
  if (!doc || !team || doc.team !== team.id || !J.joinGenuine(doc, String(id)))
    throw new Error("there is no genuine request to join this team from desk " + id + "; nothing was refused");
  putOpening(folder, team, { desk: doc.desk.id, commit: doc.commit, refused: true }, signer);
  return listJoins(folder, team);
}

/** Marks the request to join that desk `id` still has on the share, if it has one for this team, as the old request of a
 *  member since removed, keeping whatever its entry in the file of openings held where the lead signed it, the file signed by
 *  `signer`, and forgets any opening held for it.
 *  Answers {at, prev}, the file of openings and its text before (null where there was none), for a caller that must put it
 *  back, or null where nothing was written. */
function closeRequest(folder, team, id, signer) {
  const J = Engine.joinRules(), doc = requestOf(folder, String(id));
  if (!doc || !team || doc.team !== team.id || !J.joinGenuine(doc, String(id))) return null;
  const at = joinsPath(folder);
  let prev = null;
  try { prev = readWithin(at, TEAM_READ_MAX).toString("utf8"); }
  catch (e) {
    if (e && e.code === "EFBIG") return null;
    if (!e || e.code !== "ENOENT") throw e;
  }
  const held = joinsHeld(readJson(at), team);
  const same = held ? held.open.find(e => !!e && e.desk === doc.desk.id && e.commit === doc.commit) : null;
  putOpening(folder, team, Object.assign({}, same || { desk: doc.desk.id, commit: doc.commit }, { removed: true }), signer);
  return { at, prev };
}

/** The request desk `id` has on the share, as the lead's answer on the relay reads it (board 922): {doc, inviteId, deskId,
 *  deskBox}, the request itself, the book's id of the invitation it names and the box it signed, or null where the request is
 *  not genuine, is not for the team `teamId`, or names no invitation or no box. Nothing is written. */
function relayAsk(folder, teamId, id) {
  const J = Engine.joinRules(), doc = requestOf(folder, String(id));
  if (!doc || doc.team !== String(teamId) || !J.joinGenuine(doc, String(id))) return null;
  const inviteId = doc.invite && typeof doc.invite === "object" && typeof doc.invite.id === "string" ? doc.invite.id : "";
  const deskBox = doc.desk && typeof doc.desk.box === "string" ? doc.desk.box : "";
  if (!/^[0-9a-f]{16}$/.test(inviteId) || !/^[0-9a-f]{64}$/.test(deskBox)) return null;
  return { doc, inviteId, deskId: String(doc.desk.id), deskBox };
}

/** The seat document a request to join carries inside it ({format: 2, desk, certificate}, as seat.json holds it), where the request
 *  at desks/<id>/join.json is that desk's own and genuine, or null. A request at the relay's standing door uploads nothing else, so
 *  its certificate rides in it. Nothing is checked here but the request: src/desk-seat.mjs checkSeat judges the certificate. */
function seatAsked(folder, id) {
  const J = Engine.joinRules(), doc = requestOf(folder, String(id));
  if (!doc || !J.joinGenuine(doc, String(id)) || !doc.seat || typeof doc.seat !== "object" || Array.isArray(doc.seat)) return null;
  return doc.seat;
}

export { listJoins, refuseJoin, admitWaiting, inviteSightings, closeRequest, relayAsk, seatAsked, AUTO_ADMIT_KINDS };
