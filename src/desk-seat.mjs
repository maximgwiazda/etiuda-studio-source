/* A DESK'S SEAT, AS ITS LEAD SEES IT (board 980; the person's own sign-in, Claude alpha's night decision 18).
 *
 *     import { hintFor, hintOf, orgOf, readSeat, checkSeat, seatBook, seatFreed, certBytes } from "./src/desk-seat.mjs";
 *
 * THE CRITERION (Max, 2026-11-12 02:07: "Yes, absolutely make sign-in the agent's own."; Claude alpha's ruling 4, his words: the
 * seat certificate, "and no token or name ever reaching a lead"): the desk signs its person in to the licence service itself, and
 * what its lead's Studio sees of that person is a certificate the service signed, naming pseudonyms only. A seat is never a
 * reason to remove a desk, since a removal re-keys the whole team (src/team.mjs newEpoch); nothing local on the desk waits on a
 * sign-in; personal Google and Microsoft accounts stay allowed, and personal use with no team needs no sign-in.
 *
 * THE HINT. A desk on a relay team uploads its one request before it can read the team file, so the invitation itself says that
 * the team admits by sign-in and with which provider (Argon 2's remedy), and so does the team file, for a desk already in:
 * `signin: {providers: [{id, issuer, clientId, allow}]}`, stage 1's provider shape, `allow` the lead's own organisation as its
 * token named it (a tenant id, a Workspace domain) or "personal". Only a lead that signed in writes one (hintFor), so a team led
 * by a lead not signed in carries none.
 *
 * THE SEAT, desks/<id>/seat.json beside the desk's own files (on the relay, in the mirror, as stats.estat comes), written whole by
 * the desk at each new certificate, neither sealed nor signed by the desk, since it holds pseudonyms only and the certificate
 * binds the desk's key and is signed by the service:
 *   { format: 2, desk: "k-...", certificate: { kind: "etiuda-seat-certificate", format: 1, licence, desk, person, code, issued,
 *     until, via, sig: {alg: "Ed25519", keyId, value} } }
 * Format 1, a token sealed to the lead, is retired and read as nothing. The lead's Studio takes a certificate (checkSeat) only
 * where its delegation traces to the root this copy trusts and may sign "licence" on the day it was issued, the delegated key
 * signed certBytes, it is not past `until` and runs no longer than PROOF_MS, `licence` is the reference this Studio's own quiet
 * check was answered, and `desk` is the key the team's roster names that desk by. Nothing is sent anywhere for it.
 *
 * WHAT THE LEAD DOES WITH IT (seatBook, run at the watch): each roster desk's state, for the Desks screen: "seated" with the
 * certificate's person (the service's pseudonym of that person on this licence), which Free seat frees at the service by
 * seat/free; "expired", "elsewhere" (a certificate of another licence), "bad" or "none". A seat the lead freed stays "freed"
 * until the desk brings a certificate issued after the freeing. The book (desk-seats.json beside Studio's settings) holds
 * pseudonyms, codes and times, never a token or a name. Nothing here removes, re-keys or writes the team. */
import crypto from "node:crypto";
import path from "node:path";
import * as Engine from "./engine.mjs";
import { readWithin, TEAM_READ_MAX } from "./share-read.cjs";
import { parsePlain } from "./plain-json.mjs";
import { viaHolds } from "./licence.mjs";

const DAY = 24 * 3600000;
const SEAT_FILE = "seat.json", SEAT_FORMAT = 2;
const CERT_KIND = "etiuda-seat-certificate", CERT_FORMAT = 1;
/* requests.mjs DOMAINS.seatCert, the line seatCertBytes begins with, restated so that this file, which src/team.mjs and
   src/invite.mjs load, needs nothing outside src/; tests/desk-seats.mjs holds certBytes equal to seatCertBytes. */
const CERT_LINE = "etiuda-seat-certificate";
const CERT_FIELDS = ["kind", "format", "licence", "desk", "person", "code", "issued", "until", "via", "sig"];
/* The service's PROOF_DAYS: a certificate runs no longer than a seat goes unproved (service/licence/core.mjs). */
const PROOF_MS = 30 * DAY;
/* The condition Max agreed to (22:14, as Claude alpha gave it at 22:15): "Studio caps one person at three active desks". The
   licence service counts it and certifies no fourth desk (service/licence/core.mjs DESKS_PER_PERSON). */
const DESKS_PER_PERSON = 3;
const CONSUMERS_TENANT = "9188040d-6c67-4c5b-b112-36a304b66dad";
const HEX64 = /^[0-9a-f]{64}$/, HEX32 = /^[0-9a-f]{32}$/, DESK_RE = /^k-[0-9a-f]{16}$/, CODE_RE = /^[0-9A-HJKMNP-TV-Z]{16}$/;
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DOMAIN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const SPKI_ED25519 = Buffer.from("302a300506032b6570032100", "hex");
const plain = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const exactly = (o, names) => Object.keys(o).every((k) => names.includes(k)) && names.every((k) => Object.hasOwn(o, k));

/* ---- the hint ------------------------------------------------------------------------------------------------------- */

/* The claims of an ID token, unverified: the lead's Studio reads only what the hint needs; the service verifies. */
function claimsOf(jwt) {
  const parts = String(jwt || "").split(".");
  if (parts.length !== 3) return null;
  try {
    const c = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return plain(c) ? c : null;
  } catch { return null; }
}

/** The organisation an ID token of `provider` (Studio's provider configuration) names, as a hint's `allow` holds it: Microsoft's
 *  tenant id, or "personal" for the consumers tenant; Google's hd domain, or "personal" where it has none; null where the token
 *  or the provider says nothing a hint could carry (a third provider names its own `allow` when one comes). */
function orgOf(provider, idToken) {
  const c = claimsOf(idToken);
  if (!c || !provider) return null;
  if (provider.id === "microsoft") {
    const tid = String(c.tid || "").toLowerCase();
    if (!GUID.test(tid)) return null;
    return tid === CONSUMERS_TENANT ? "personal" : tid;
  }
  if (provider.id === "google") {
    if (c.hd === undefined || c.hd === null || c.hd === "") return "personal";
    const hd = String(c.hd).toLowerCase();
    return DOMAIN.test(hd) ? hd : null;
  }
  return null;
}

/** A hint as a desk reads it, normalised, or null where it is not one: {providers: [{id, issuer, clientId, allow}]}, one to
 *  four providers, each with an id, an https issuer, a client id, and `allow` "personal" or one to sixteen tenants or domains. */
function hintOf(h) {
  if (!plain(h) || !Array.isArray(h.providers) || h.providers.length < 1 || h.providers.length > 4) return null;
  const out = [];
  for (const p of h.providers) {
    if (!plain(p) || !/^[a-z][a-z0-9-]{1,30}$/.test(String(p.id)) || typeof p.issuer !== "string" || !/^https:\/\/[^\s]{1,300}$/.test(p.issuer)
      || typeof p.clientId !== "string" || !/^[A-Za-z0-9._-]{1,200}$/.test(p.clientId)) return null;
    let allow = null;
    if (p.allow === "personal") allow = "personal";
    else if (Array.isArray(p.allow) && p.allow.length >= 1 && p.allow.length <= 16
      && p.allow.every((a) => typeof a === "string" && (GUID.test(a) || DOMAIN.test(a)))) allow = p.allow.map((a) => a.toLowerCase());
    if (!allow) return null;
    out.push({ id: p.id, issuer: p.issuer, clientId: p.clientId, allow });
  }
  return { providers: out };
}

/** The hint a lead signed in with `provider` (Studio's provider configuration, src/licence-client.mjs) writes for its desks,
 *  `org` the organisation its own token named (orgOf): that provider alone, admitting that organisation, or its personal
 *  accounts. Null where the lead did not sign in, or its provider has no client id: no hint. */
function hintFor(provider, org) {
  if (!provider || typeof org !== "string" || !org) return null;
  return hintOf({ providers: [{ id: provider.id, issuer: provider.issuer, clientId: provider.clientId, allow: org === "personal" ? "personal" : [org] }] });
}

/* ---- the certificate ------------------------------------------------------------------------------------------------ */

/** The bytes a seat certificate's signature covers: CERT_LINE, then the format, the licence's reference, the desk key, the
 *  person's pseudonym, the code, issued, until and the signing key's id, one a line, then "pooled", "desk-only" and "member" where
 *  each field is true (requests.mjs seatCertBytes). A Studio's member certificate (member: true) is no desk's seat, so checkSeat's
 *  field list refuses it. */
function certBytes(c) {
  const x = plain(c) ? c : {};
  const fields = [x.format, x.licence, x.desk, x.person, x.code, x.issued, x.until, plain(x.sig) ? x.sig.keyId : undefined]
    .concat(x.pooled === true ? ["pooled"] : []) /* plant:a1-pooled-bytes */
    .concat(x.deskOnly === true ? ["desk-only"] : []) /* plant:a1-desk-only-bytes */
    .concat(x.member === true ? ["member"] : []); /* plant:a1-member-bytes */
  return Buffer.from(CERT_LINE + "\n" + fields.map(String).join("\n"), "utf8");
}
const publicKeyOf = (hex) => crypto.createPublicKey({ key: Buffer.concat([SPKI_ED25519, Buffer.from(String(hex), "hex")]), format: "der", type: "spki" });
/* Null for an instant past the Date range, which toISOString throws on: such a certificate is shape (checkSeat). */
const utcDay = (ms) => { const t = new Date(ms); return Number.isNaN(t.getTime()) ? null : t.toISOString().slice(0, 10); }; /* plant:a1-day-finite */

/**
 * A seat.json as this lead takes it: `o` {desk (the roster's id), deskKey (the roster's key for it), ref (the licence reference
 * this Studio's quiet check was answered), now (ms), and verifyLicence's o.revoked or o.file where kept}. {ok: true, person, code,
 * issued, until} where its certificate stands; else {ok: false, why}: "shape" (no format 2, or a certificate of another form),
 * "desk" (another desk's file, or a certificate for another key), "delegation", "sig", "licence" (another licence's), or
 * "expired".
 */
function checkSeat(doc, o) {
  const x = o || {};
  if (!plain(doc) || doc.format !== SEAT_FORMAT || !plain(doc.certificate)) return { ok: false, why: "shape" }; /* plant:a1-format */
  const c = doc.certificate;
  const fields = (c.pooled === true ? CERT_FIELDS.concat(["pooled"]) : CERT_FIELDS).concat(c.deskOnly === true ? ["deskOnly"] : []); /* plant:a1-desk-only-field */ /* plant:a1-member-field */
  if (!exactly(c, fields) || c.kind !== CERT_KIND || c.format !== CERT_FORMAT || !HEX32.test(String(c.licence)) || !HEX64.test(String(c.desk))
    || !HEX64.test(String(c.person)) || !CODE_RE.test(String(c.code)) || !Number.isSafeInteger(c.issued) || !Number.isSafeInteger(c.until)
    || c.issued <= 0 || c.until <= c.issued || c.until - c.issued > PROOF_MS
    || !plain(c.sig) || !exactly(c.sig, ["alg", "keyId", "value"]) || c.sig.alg !== "Ed25519" || !/^[0-9a-f]{128}$/.test(String(c.sig.value)))
    return { ok: false, why: "shape" };
  if (utcDay(c.issued) === null || utcDay(c.until) === null) return { ok: false, why: "shape" }; /* plant:a1-day-range */
  const rosterKey = DESK_RE.test(String(x.desk)) && doc.desk === x.desk && HEX64.test(String(x.deskKey))
    && Engine.deskRules().branchIdOf(String(x.deskKey)) === x.desk;
  if (!rosterKey || c.desk !== x.deskKey) return { ok: false, why: "desk" }; /* plant:a1-desk */
  if (!viaHolds(c.via, utcDay(c.issued), x) || c.sig.keyId !== c.via.key.id) return { ok: false, why: "delegation" }; /* plant:a1-via */
  let good = false;
  try { good = crypto.verify(null, certBytes(c), publicKeyOf(c.via.key.pub), Buffer.from(String(c.sig.value), "hex")); } catch { good = false; }
  if (!good) return { ok: false, why: "sig" }; /* plant:a1-sig */
  if (!HEX32.test(String(x.ref)) || c.licence !== x.ref) return { ok: false, why: "licence" }; /* plant:a1-ref */
  if (!(c.until > Number(x.now))) return { ok: false, why: "expired" }; /* plant:a1-until */
  return { ok: true, person: c.person, code: c.code, issued: c.issued, until: c.until };
}

/**
 * THIS STUDIO'S OWN SEAT CERTIFICATE, as its gate takes it (review xi; Max, 2026-11-22 15:37: Studio's gate rests on the sign-in's seat
 * certificate alone): `c` the certificate, `o` {key (this Studio's signing key's public half, 64 hex), now (ms: the floor's clock), and
 * viaHolds's o.trustedKey, o.revoked or o.file}. Judged as checkSeat judges a desk's, the desk being this key: its shape, unmarked; the
 * delegation tracing to the root on the day it was issued and not revoked; the delegated key's signature; naming this key; not past
 * `until`. Answers checkSeat's {ok, ...} or {ok: false, why}.
 */
function checkOwnSeat(c, o) {
  const x = o || {};
  if (!HEX64.test(String(x.key))) return { ok: false, why: "desk" };
  const id = Engine.deskRules().branchIdOf(String(x.key));
  return checkSeat({ format: SEAT_FORMAT, desk: id, certificate: c }, Object.assign({}, x, { desk: id, deskKey: String(x.key),
    ref: plain(c) ? c.licence : "" })); /* plant:own-seat */
}

/** The seat.json in the desk's folder at `folder` (the share, or the relay's mirror), parsed, or null where there is none or it
 *  is past the share's read cap or not plain JSON. */
function readSeat(folder, desk) {
  if (!DESK_RE.test(String(desk))) return null;
  try {
    return parsePlain(readWithin(path.join(path.resolve(String(folder)), "desks", String(desk), SEAT_FILE), TEAM_READ_MAX).toString("utf8").replace(/^\uFEFF/, ""));
  } catch { return null; }
}

/* ---- the book ------------------------------------------------------------------------------------------------------- */

const STATE_OF = Object.freeze({ expired: "expired", licence: "elsewhere" });

/**
 * One team's book after a look at the watch: `book` as kept ({desks: {id: entry}}), `opened` {desk id: {key, got}} for every desk
 * now on the roster, `got` what checkSeat made of its seat.json (null where it has none), `now` ms. An entry is {state, seat,
 * code, until, freed}: "seated" with `seat` the certificate's person; "freed" where the lead freed that person's seat after the
 * certificate was issued (`freed` {seat, at}), until the desk brings a newer one; else "expired", "elsewhere", "bad" or "none",
 * holding no seat. `last` is the person a standing certificate last named on that desk, whatever its state now, so a removal
 * still knows whose admission to forget. A desk off the roster is forgotten. Pure: it sends and writes nothing.
 */
function seatBook(book, opened, now) {
  const was = plain(book) && plain(book.desks) ? book.desks : {};
  const roster = plain(opened) ? opened : {};
  const next = {};
  for (const desk of Object.keys(roster).sort()) {
    const old = plain(was[desk]) ? was[desk] : {};
    const freed = plain(old.freed) && typeof old.freed.seat === "string" && Number.isFinite(old.freed.at) ? old.freed : null;
    const got = roster[desk] ? roster[desk].got : null;
    const e = { state: "none", seat: "", code: "", until: 0 };
    const last = (typeof old.seat === "string" && old.seat) || (typeof old.last === "string" && old.last) || "";
    if (last) e.last = last;
    if (freed) e.freed = freed;
    if (got && got.ok === true) {
      if (freed && freed.seat === got.person && got.issued <= freed.at) e.state = "freed"; /* plant:a1-freed */
      else { Object.assign(e, { state: "seated", seat: got.person, code: got.code, until: got.until, last: got.person }); delete e.freed; }
    } else if (got) e.state = STATE_OF[got.why] || "bad";
    next[desk] = e;
  }
  return { desks: next };
}

/** The book after the lead freed the seat `seat` (the certificate's person) at `now`: every desk that held it holds nothing, kept
 *  as it is on the roster, and is seated again only by a certificate issued after now. */
function seatFreed(book, seat, now) {
  const desks = plain(book) && plain(book.desks) ? book.desks : {};
  const at = Number.isFinite(now) ? now : Date.now();
  const out = {};
  for (const d of Object.keys(desks)) out[d] = desks[d] && desks[d].seat === seat
    ? Object.assign({}, desks[d], { seat: "", state: "freed", freed: { seat, at } }) : desks[d];
  return { desks: out };
}

/* ---- a member seated by their own Join (board 1017, fold 95's B) ------------------------------------------------------ */

/** Whether `row` of the lead's list (person/list) shows its person added, seated and on team `teamId`, the asker's own team, which alone the list names. */
function onTeamRow(row, teamId) {
  return plain(row) && HEX64.test(String(row.person))
    && row.added !== false /* plant:jd-added */ && row.team === teamId /* plant:jd-team */ && row.seated === true; /* plant:jd-seated */
}

/**
 * The people of relay team `teamId` (team-people.json's {team id: {person: entry}}, as `all`) after a read of the lead's list (person/list's rows,
 * `listed`, read at `listAt` ms). Max, 2026-11-16: "one seamless step, optimally without any codes to write down or share with other people"; an
 * invited member is seated by their own Join. The list names every person the lead's own admission placed on one of its own teams, whatever their
 * last sign-in (core.mjs person/list), so it is the whole of the team's Joins:
 *   - a person it shows added, seated and on this team is kept as {via: "join", at}, so the watch's admission (src/studio.mjs watchAdmit, `known`)
 *     lets their desk in at the door with nobody acting;
 *   - a kept Join it does not show so (seated false, another team, not added, or missing, as after a withdrawal by the owner or on the lead's
 *     other computer) goes;
 *   - a person the lead removed is taken back only where the service has acknowledged the removal (person/withdraw, of the licence or of this
 *     team alone: no `withdraw` or `unplace` still owed) at `ackAt`, and this list was asked after that: the service had then already taken
 *     them off the team, so a row placing them on it again is a place made after the removal, never one that merely still says seated. Both
 *     times are this computer's, one clock (the test architect's reads of c2ccb0e1 and ec990251);
 *   - a read that names no row on this team at all (the lead's door not yet set at the service, so the list names none of its teams) drops
 *     nothing, but marks each kept Join `unsure` until a read naming the team confirms or drops it, so an unconfirmed Join does not count as
 *     a team the person is still in when the lead removes them elsewhere (the shell's inOtherTeams; the test architect's read of ff35a9e5,
 *     finding 5); the watch's second pass admits by the read's own rows alone (doorLook);
 *   - an entry by code is left as its admission wrote it.
 * Pure: the caller writes the answer; null where nothing changes.
 */
function joinedPeople(all, teamId, listed, listAt) {
  const book = plain(all) ? all : {};
  const mine = plain(book[teamId]) ? Object.assign({}, book[teamId]) : {};
  const rows = Array.isArray(listed) ? listed : [];
  let moved = false;
  const names = rows.some((row) => plain(row) && row.team === teamId); /* plant:jd-no-team */
  if (!names) {
    for (const p of Object.keys(mine)) {
      const e = mine[p];
      if (plain(e) && e.via === "join" && !Number.isFinite(e.removed) && e.unsure !== true) { mine[p] = Object.assign({}, e, { unsure: true }); moved = true; } /* plant:jd-unsure */
    }
    return moved ? Object.assign({}, book, { [teamId]: mine }) : null;
  }
  const on = new Map();
  for (const row of rows) if (onTeamRow(row, teamId)) on.set(row.person, row);
  for (const [p] of on) {
    const was = plain(mine[p]) ? mine[p] : null;
    if (was && !Number.isFinite(was.removed)) {
      if (was.unsure === true) { const sure = Object.assign({}, was); delete sure.unsure; mine[p] = sure; moved = true; }
      continue;
    }
    if (was && !(was.withdraw !== true && was.unplace !== true && Number.isFinite(was.ackAt) && Number(listAt) > was.ackAt)) continue; /* plant:jd-removed */
    mine[p] = { via: "join", at: Number.isFinite(listAt) ? listAt : Date.now() };
    moved = true;
  }
  for (const p of Object.keys(mine)) {
    const e = mine[p];
    if (plain(e) && e.via === "join" && !Number.isFinite(e.removed) && !on.has(p)) { delete mine[p]; moved = true; } /* plant:jd-drop */
  }
  return moved ? Object.assign({}, book, { [teamId]: mine }) : null;
}

/** `all` with every kept Join that is not marked removed taken out: what the watch's first pass at a door admits by, so no desk is let in on a
 *  Join the service has not confirmed at this look. A removed mark stays, so a removed person stays out. */
function withoutJoins(all) {
  const book = plain(all) ? all : {};
  const out = {};
  for (const id of Object.keys(book)) {
    if (!plain(book[id])) { out[id] = book[id]; continue; }
    const m = {};
    for (const p of Object.keys(book[id])) {
      const e = book[id][p];
      if (!(plain(e) && e.via === "join" && !Number.isFinite(e.removed))) m[p] = e; /* plant:jd-without */
    }
    out[id] = m;
  }
  return out;
}

/**
 * ONE LOOK AT A RELAY TEAM'S DOOR (board 1017's B; the test architect's findings 2 to 4 on c2ccb0e1). The first pass admits by the people kept
 * without their Joins. Only where it refuses a request is the lead's list read, at or after the look's start, so the service is asked once per
 * look that holds a refused request and never on a quiet one; the Joins it names are kept, and a second pass admits by them. What that pass still
 * refuses is dropped at the relay. Where no read may be made now (its spacing or hourly budget) nothing is dropped and a later look is asked for;
 * where no list is to be had at all (not signed in, not a relay team, never answered) the first pass's refusals are dropped, as before Joins were
 * read. The second pass admits by the Joins this read itself confirms, never by older kept ones. `o`: {team, lookAt, people() -> team-people
 * as kept, admit(people) -> the watch's answer, fresh(since) -> {at, people} | null | false, keep(people, at), drop(refused), relook()}.
 * Answers {passes, read: "none" | "fresh" | "wait" | "no-list", dropped}.
 */
async function doorLook(o) {
  const first = (await o.admit(withoutJoins(o.people()))) || {};
  const refused = Array.isArray(first.dropDoors) ? first.dropDoors : [];
  if (!refused.length) return { passes: 1, read: "none", dropped: [] };
  const got = await o.fresh(o.lookAt);
  if (got === false) { await o.drop(refused); return { passes: 1, read: "no-list", dropped: refused }; }
  if (!got) { o.relook(); return { passes: 1, read: "wait", dropped: [] }; } /* plant:jd-wait */
  await o.keep(got.people, got.at);
  const bare = withoutJoins(o.people());
  const second = (await o.admit(joinedPeople(bare, o.team, got.people, got.at) || bare)) || {}; /* plant:jd-second */
  const still = Array.isArray(second.dropDoors) ? second.dropDoors : [];
  if (still.length) await o.drop(still); /* plant:jd-drop-after */
  return { passes: 2, read: "fresh", dropped: still };
}

export { hintFor, hintOf, orgOf, readSeat, checkSeat, checkOwnSeat, certBytes, seatBook, seatFreed, claimsOf, joinedPeople, withoutJoins, doorLook,
  DESKS_PER_PERSON, PROOF_MS, SEAT_FILE, SEAT_FORMAT, CERT_KIND, CERT_FORMAT, CERT_LINE };
