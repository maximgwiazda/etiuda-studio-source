/* THE RELAY, ON THE LEAD'S SIDE (board 900, relay slice 1, step 5).
 *
 *     import { RELAY_URL, relayId, agreeFrom, leadOpened, leadChannel, relaySpace, devicesOf, headOf, relayRunner }
 *       from "./src/relay.mjs";
 *
 * THE MIRROR IS THE TEAM FOLDER. A team on the relay keeps its folder at <user data>/relay/<relay team id>/
 * (src/team-store.mjs keepRelay), and the same channel layer the desk runs, the pinned engine's shell/relay/channel.cjs,
 * keeps it in step with the relay while Studio runs: what Studio writes in its own place there goes out sealed under the
 * team key and signed by the lead's key, and what the desks write in their own places comes in judged by the signed team
 * file alone. Every reader and writer above it works on the mirror as on a share, so nothing above the layer changes for a
 * team on the relay, and nothing at all for a team on a folder.
 *
 * WHAT THE LEAD ALONE DOES, beside the layer, each a call the lead's key signs over the relay's own bytes (relay/core.cjs):
 * making the team's space; enrolling the roster's desks, the list replacing the last, so a desk taken off is withdrawn by
 * being left out; registering an invitation's token by its sha256, and dropping it once the invitation is let go. And the
 * head: the shape a desk accepts, {v, team, epoch, rev, editions, t, sig}, each led catalog's newest published edition in
 * editions, signed over the head prefix, written every five minutes while Studio runs and whenever an edition at the root
 * moves, which a desk shows by its age and never blocks on (ruled 2026-10-16 19:47). Nothing private is in any of these:
 * ids, public keys, hashes and numbers.
 *
 * AN INVITATION'S COPY STAYS UNTIL ITS DESK HAS READ ITS WRAP. The lead seals the team file once more under each live relay
 * invitation's own key (the layer's joining bootstrap), and keeps that copy after the invitation lets its desk in, until the
 * desk has opened its wrap: the sign is that the desk, holding the team key, deleted its own request (the desk's joinView),
 * so its join.json is gone from the mirror by its signed deletion. Only then is the invitation let go, its copy superseded
 * by the lead's signed deletion. An invitation withdrawn or past its end, spent or not, is let go at once, and so is one whose
 * desk is no longer on the team: Studio's removal lets it go before the new team file is written (src/studio.mjs
 * removeMember), and the next sync lets go any it finds left (N1 of the slice 1 review).
 *
 * THE LEAD'S ANSWER (board 922). A desk that asked by a relay invitation reads only the lead's answer to its request until its
 * key is enrolled, so the lead writes one for each request it settles: answerJoin, below, which shell/main.js asks for on a
 * refusal and answerAdmitted asks for on an admission by the watch.
 *
 * THE AGREEMENT IS THE LEAD BOX'S (F1; the test architect's condition 4 of 2026-10-18): `agree` is the X25519 of the very
 * box whose public half every team file Studio signs names as lead.box (src/sign.mjs ensureLeadBox, src/team.mjs
 * writeTeam), opened from the key file at each call, so after a move each remaining desk opens its own copy of the new team
 * file. A box of any other key makes copies no desk opens, and nothing says so.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import * as Engine from "./engine.mjs";
import * as Store from "./team-store.mjs";
import { heldTeam, withChannel, withoutDesk, writeTeam } from "./team.mjs";
import { sealWrap, inviteState, INVITE_DAYS } from "./invite.mjs";
import { relayAsk } from "./join.mjs";
import { readKeyFile, unlockKey, openLeadBox, keyIdFor, signatureHolds } from "./sign.mjs";
import { RING_FILE, ringPath } from "./ring.mjs";
import { writeWhole } from "./whole-write.cjs";
import { readWithin, TEAM_READ_MAX } from "./share-read.cjs";
import { readJson } from "./plain-json.mjs";
import { relayKnown } from "./relay-known.mjs";
import { createRequire } from "node:module";

/* The address is decided once, in src/wire.cjs, by the same installed-copy test and the same shape as the licence
 * origin. A team file names it without the shape's trailing slash, which is the form this constant has always had;
 * the channel strips a trailing slash before it calls, and the door's prefix keeps the slash. */
const require = createRequire(import.meta.url);
const { RELAY_ORIGIN, RELAY_TEST } = require("./wire.cjs");
const RELAY_URL = RELAY_ORIGIN.replace(/\/$/, "");
/* WHERE A NEW TEAM IS MADE: staging's relay in a test service build (src/wire.cjs RELAY_TEST, Max 2026-11-13 10:26), the relay
   anywhere else. Only a team made here or moved here from a folder takes it; a team already held keeps the address its record
   names, and a record naming none was made before records named one, on the relay, so RELAY_URL stays the fallback. */
const NEW_TEAMS_URL = (RELAY_TEST || RELAY_ORIGIN).replace(/\/$/, ""); /* plant:rts-new-teams */
const GRANT_FILE = "relay-grant.json";
const HEAD_NAME = "etiuda-head.json";
const HEAD_MS = 5 * 60 * 1000;
const RT_RE = /^[0-9a-f]{32}$/;
const DESK_KEY = /^k-[0-9a-f]{16}$/;
const X25519_SPKI = Buffer.from("302a300506032b656e032100", "hex");
const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex");
const base = (url) => String(url || "").replace(/\/+$/, "");
/* Whether this build reaches the relay a team's record names: the relay, or staging's in a test service build (src/wire.cjs), the
   address read as new URL writes it. Any other is a team this build does not reach (the runner's sync, below), which it calls nothing
   for: a team a Test Service build made on staging's relay, held again by an ordinary build. */
function relayReached(url) {
  let at = "";
  try { at = new URL(base(url) + "/").href; } catch { return false; }
  return at === RELAY_ORIGIN || (!!RELAY_TEST && at === RELAY_TEST);
}
/* A door's address as the licence service judges it (service/licence/core.mjs doorRelayOk): the string itself, one trailing slash
   taken off, against the relay this build reaches, nothing resolved; the service refuses a whole set for one address it does not
   hold, so a record that only resolves to the relay (a dot segment, the default port) is never sent. The judgement is
   src/relay-known.mjs relayKnown, the one a followed team is held to as well. */
function doorRelayExact(url) {
  return relayKnown(url); /* plant:rts-door-exact */
}

/** A new relay team id: 16 random bytes, 32 lower-case hex characters, never the team's own id. */
function relayId() { return crypto.randomBytes(16).toString("hex"); }

/** The agreement of the lead's box (src/sign.mjs openLeadBox: {public, secretKey}) with another box given as 64 hex: 32
 *  bytes, or null. */
function agreeFrom(box) {
  return (peer) => {
    if (!box || !box.secretKey || !/^[0-9a-f]{64}$/.test(String(peer))) return null;
    try {
      return crypto.diffieHellman({ privateKey: box.secretKey,
        publicKey: crypto.createPublicKey({ key: Buffer.concat([X25519_SPKI, Buffer.from(String(peer), "hex")]), format: "der", type: "spki" }) });
    } catch { return null; }
  };
}

/** The lead's signing key in `keyFile` opened by `secret`, with the box it keeps: {open, box}, or null where it does not
 *  open. The box is the one whose public half writeTeam names as lead.box; none is made here. */
function leadOpened(keyFile, secret) {
  if (!secret) return null;
  let read = null;
  try { read = readKeyFile(keyFile); } catch { return null; }
  if (!read) return null;
  try { const open = unlockKey(read, secret); return { open, box: openLeadBox(read, open) }; } catch { return null; }
}

/* ---- the lead's signed calls --------------------------------------------------------------------------------------- */

const signHex = (open, bytes) => crypto.sign(null, bytes, open.privateKey).toString("hex");

async function post(request, url, json, headers) {
  const h = Object.assign({ "content-type": "application/json" }, headers || {});
  const res = await request("POST", url, h, Buffer.from(JSON.stringify(json), "utf8"));
  let body = null;
  try { body = JSON.parse(Buffer.from(res && res.bytes ? res.bytes : []).toString("utf8")); } catch { body = null; }
  return { status: res ? res.status : 0, json: body };
}
/* A call that sends no body, read the same way as `post`'s answer. */
async function get(request, url, headers) {
  const res = await request("GET", url, Object.assign({}, headers || {}));
  let body = null;
  try { body = JSON.parse(Buffer.from(res && res.bytes ? res.bytes : []).toString("utf8")); } catch { body = null; }
  return { status: res ? res.status : 0, json: body };
}
function refusedOf(r) {
  const j = r && r.json;
  return { ok: false, reason: j && typeof j.error === "string" ? j.error : "status-" + (r ? r.status : 0),
    said: j && typeof j.said === "string" ? j.said : "The relay answered " + (r ? r.status : 0) + "." };
}

/* ---- THE GRANT (board 935, slice G3) ---------------------------------------------------------------------------------------
 * The relay makes a team only under a grant: a document the vendor's root key signed over this lead's public key, with the dates
 * it holds for and whether the licence is paid (tools/sign.mjs grant makes one). Studio keeps it in relay-grant.json in the folder
 * its signing key sits in, and judges it with the pinned relay's own grantOk before any request is made, so a lead without one
 * sends nothing and is told so at the place it chooses the relay (shell/main.js studio:team-relay). Only a leg names other roots
 * than the pinned constant, through `roots`; production code passes none. Each refusal is the copywriter's (2026-11-17), with no shared
 * folder offered in its place now that folder teams are gone. */
const GRANT_SAID = {
  nokey: "A licence for the Etiuda relay names this Studio's signing key, and there is none yet: make one first from the Menu, under Settings, then Signing key, with Make a signing key.",
  none: "This Studio holds no licence for the Etiuda relay. Signing in, from the Menu, under Settings, then Account, brings a licence or a trial.",
  ended: "The licence for the Etiuda relay ended on {DATE}.",
  lead: "The licence for the Etiuda relay names a different signing key from this Studio's, as happens when the key is made again after the licence was issued.",
  future: "This computer's clock reads a time before the licence for the Etiuda relay begins; once the clock is right, the licence holds.",
  other: "The licence file for the Etiuda relay is damaged, or was not issued by Etiuda.",
};
const NO_GRANT_SAID = GRANT_SAID.none;

/** Where the grant sits: beside the signing key file, in the folder STUDIO_SIGNING_KEY names for a gate or Studio's settings folder. */
function grantFileOf(keyFile) { return path.join(path.dirname(path.resolve(String(keyFile || ""))), GRANT_FILE); }

/** The grant Studio holds beside `keyFile`, as the document it is, or null where there is no file or it does not read as one. */
function readGrant(keyFile) {
  try { return readJson(grantFileOf(keyFile), { plain: true }); } catch { return null; }
}

/** Null where `grant` holds for the lead whose public half is `leadPub` at `now` (ms), by the pinned relay's own grantOk; else the
 *  refusal a caller returns without sending anything: {ok: false, reason: "grant", why, said, ...vars}, `why` the pinned core's own word
 *  for it ("ended", "lead", "signature" and so on, "none" for no grant, "nokey" for no key). `roots` is for legs only. */
function grantRefusal(grant, leadPub, now, roots, revoked) {
  const C = Engine.relayRules().core;
  const bad = (why) => {
    const said = GRANT_SAID[why] || GRANT_SAID.other; /* plant:n1-case */
    const out = { ok: false, reason: "grant", why, said };
    if (why === "ended" && grant && grant.until != null) {
      out.vars = { DATE: new Date(grant.until).toISOString().slice(0, 10) };
    }
    return out;
  };
  if (leadPub === null || leadPub === undefined) return bad("nokey");
  if (grant === null || grant === undefined) return bad("none");
  if (!/^[0-9a-f]{64}$/.test(String(leadPub)) || !Number.isSafeInteger(now)) return bad("setup");
  const list = Array.isArray(revoked) ? revoked : (revoked && Array.isArray(revoked.keys) ? revoked.keys : []);
  const signer = grantKeyOf(grant);
  if (signer && list.indexOf(signer) >= 0) return { ok: false, reason: "revoked", why: "revoked", said: REVOKED_SAID }; /* plant:g3-revoked-list */
  if (C.grantOk(grant, String(leadPub), now, roots)) return null; /* plant:g3-ok */
  return bad(C.grantWhy(grant, String(leadPub), now, roots));
}

/** The team's space made on the relay by the lead's signed request: `o` {url, rt, open, request, t, grant, roots}. {ok} or a
 *  refusal. The request carries `o.grant` and is signed over its hash (the pinned create2Bytes); with no grant, or one that has
 *  ended, names another key or does not verify, nothing is sent and the refusal is {ok: false, reason: "grant"}. The same lead
 *  asking again is answered as made. */
async function relaySpace(o) {
  const C = Engine.relayRules().core;
  if (!RT_RE.test(String(o.rt))) throw new Error("a relay team id is 32 lower-case hex characters");
  const no = grantRefusal(o.grant, o.open.public, o.t, o.roots, o.revokedKeys || o.revoked); /* plant:g3-judge */
  if (no) return no;
  const r = await post(o.request, base(o.url) + "/teams", { rt: o.rt, lead: { keyId: o.open.keyId, pub: o.open.public }, t: o.t, grant: o.grant,
    sig: signHex(o.open, C.create2Bytes(o.rt, o.open.keyId, o.t, o.grant)) }); /* plant:g3-create2 */
  return r.status === 200 ? { ok: true } : refusedOf(r);
}

/* ---- THE LAPSE (board 935, G2 on Studio's side) ----------------------------------------------------------------------------
 * The relay keeps the end of the latest grant it was given and stands the team where those ends put it (relay/core.cjs lapseOf): a
 * paid team works 30 days past its grant's end and reads only to 90, a trial's stops at its end and is swept 30 days on. It hears
 * of a later grant only by the grant route, POST /t/<relay team id>/grant {grant}, and answers it with where the team then stands.
 * So whenever Studio holds a grant that ends later than the relay was last given or told (the quiet check kept one, a purchase
 * activated one), the runner's next sync posts it, before any other call the team owes, and keeps the answer's lapse. A refusal
 * changes nothing and is said as the relay's other refusals are; the grant is posted again at the next sync.
 *
 * WHERE THE TEAM STANDS is the relay's word, told to the lead alone: on the grant route's answer, on a session's and on since's
 * etiuda-lapse header (the lead channel hears the last two, below). Between tellings it is read from the told instants by the
 * pinned lapseOf itself, over the row those instants come from, so a team told working whose grant has since ended reads as
 * working past its end, then read-only, without the relay having to say so again. Nothing here removes anything from the mirror. */
const LAPSE_STATES = ["working", "read-only", "lapsed", "gone"];

/** A lapse as the relay tells it, {state, until, readOnly, swept}, read field by field, or null where it is not one. */
function lapseRead(l) {
  if (!l || typeof l !== "object" || Array.isArray(l) || LAPSE_STATES.indexOf(l.state) < 0) return null;
  const at = (v) => (v === null || Number.isSafeInteger(v));
  if (!at(l.until) || !at(l.readOnly) || !at(l.swept)) return null;
  return { state: l.state, until: l.until, readOnly: l.readOnly, swept: l.swept };
}
/** The lapse in a since answer's etiuda-lapse header (base64url of JSON), or null. */
function lapseOfHeader(v) {
  if (typeof v !== "string" || v.length > 1024 || !/^[A-Za-z0-9_-]+$/.test(v)) return null;
  try { return lapseRead(JSON.parse(Buffer.from(v, "base64url").toString("utf8"))); } catch { return null; }
}

/** Whether `grant` is owed to the relay for the kept relay team `t` (relayTeams' row): it ends later than the grant the relay last
 *  took, or as late and paid where that one was not, or later than the end the relay last told; and for a team whose last grant
 *  was never kept, as one made before this was kept, it is owed once. A grant that ends no later, signed by another key, is not
 *  owed here. A signer the relay has answered revoked is posted by that path, not by this. */
function owesGrant(t, grant) {
  if (!grant || typeof grant !== "object" || !Number.isSafeInteger(grant.until)) return false;
  /* A grant the relay refused as another lead's (a key made again) waits until the held grant names another key. */
  if (t && t.refusedLead && grant.lead === t.refusedLead) return false; /* plant:g2s-lead-hold */
  const g = t && t.granted, l = t && t.lapse;
  if (!g) return true; /* plant:g2s-unknown */
  if (grant.until > g.until) return true; /* plant:g2s-later */
  if (grant.until === g.until && grant.paid === true && g.paid !== true) return true;
  return !!l && Number.isSafeInteger(l.until) && l.until < grant.until; /* plant:g2s-told */
}

/* The relay renews a team only for the key it was made with. A key made again holds a licence, and a grant, for itself alone; the
   team on the relay stays with the old key, so this is what the refusal of its grant says, the Licence cover's sentence beside it. */
const OTHER_LEAD_SAID = "The relay renews this team only for the signing key it was made with, and this Studio's key has been made again since, so the licence does not reach the team. To keep it, restore that key's backup copy from the Menu, under Settings, then Signing key, or make the team again and invite its desks anew.";

/* A team whose space, swept, another key made first: the relay refuses its own lead's create. Claudette's words (ui/lang.js). */
/* The relay's answers to a lead's own create that mean another key holds the team's id; every other refusal is tried again.
   swept-other-lead is the swept id kept for its own lead. not-enrolled is a live team row under another lead. */
const TAKEN_REASONS = ["not-enrolled", "swept-other-lead"]; /* plant:rr-swept-other */
const TAKEN_SAID = "The licence is renewed, but this team could not be brought back to the relay: since its copy was deleted, its place there has been taken by another key. To carry on through the relay, make the team again and invite its teammates anew. Nothing on the team's computers or in Studio has been deleted.";
/* A first create refused because another key holds the id: Claudette's words (ui/lang.js). */
const TAKEN_SAID_FIRST = "This team could not be set up on the relay: its place there is already held by another key. Make the team again, which gives it a new place, and invite its teammates. Nothing on the team's computers or in Studio has been deleted.";
/* Claudette's words, 2026-10-27 */
const FIRST_UNREAD_SAID = "This team's place on the relay belongs to the signing key of the computer that made it, and this computer has a key of its own. To work with the team here, restore that key's backup copy from the Menu, under Settings, then Signing key, and then press Check now, under Settings, then Licence. If this computer is to lead with its own key instead, press Start a new team here on the Team screen and invite its teammates anew. Nothing on the team's computers or in Studio has been deleted.";
/* One lead key holds at most 25 live teams. The relay answers the create with this reason, and the press says so. */
const TEAM_COUNT_SAID = "This team was not made: this Studio's signing key already holds 25 teams on the relay, the most it may. A place frees when the relay deletes a team's copy after its licence ends, or write to us through etiuda.dev. Nothing on the team's computers or in Studio was changed.";
/* The relay refused a grant, or a hello or a session standing on one, because its service key is on the root's revoked list.
   Two sentences (ui/lang.js): REVOKED_SAID while a new licence is being fetched, REVOKED_NONE once that fetch has finished
   without a grant the relay accepts. The cover follows the row. */
const REVOKED_SAID = "The relay no longer accepts the key that signed this team's relay licence, so Studio is fetching a new licence from the licence service. This normally takes minutes, at most an hour, and nothing needs doing here. Until then the team keeps working with the catalog it has, but nothing new reaches it through the relay, and Studio cannot publish through it.";
const REVOKED_NONE = "The relay no longer accepts the key that signed this team's relay licence, and Studio could not get a new licence for it yet. Check now, under Menu, then Settings, then Licence, tries again; if it still finds none, write to us through etiuda.dev. Until then the team keeps working with the catalog it has, but nothing new reaches it through the relay, and Studio cannot publish through it.";
const REVOKED_HOUR_MS = 60 * 60 * 1000;
const REVOKED_RETRY_MS = 5 * 60 * 1000;

/* The team file in a mirror, unread past the desk's cap. Absent or larger than that cap is thrown. */
function teamFileText(folder) {
  return readWithin(path.join(path.resolve(String(folder || "")), Engine.teamRules().V2_TEAM_FILE), TEAM_READ_MAX).toString("utf8");
}

/** The public half of the lead the team file in the mirror names, or "" where there is none that reads. */
function mirrorLead(folder) {
  let text = null;
  try { text = teamFileText(folder); } catch { return ""; }
  const read = Engine.teamRules().v2TeamRead(String(text).replace(/^\uFEFF/, ""));
  const pub = read && read.team && read.team.lead ? String(read.team.lead.public || "") : "";
  return /^[0-9a-f]{64}$/.test(pub) ? pub : "";
}

/** The grant `o.grant` posted to the team's grant route: `o` {url, rt, request, grant}. {ok: true, lapse} with the answer's lapse (null
 *  where it held none), or the relay's refusal. The body is the grant alone, which names the lead and nothing else. */
async function renewGrant(o) {
  const r = await post(o.request, base(o.url) + "/t/" + o.rt + "/grant", { grant: o.grant }); /* plant:g2s-route */
  if (r.status !== 200) return refusedOf(r);
  return { ok: true, lapse: lapseRead(r.json && r.json.lapse) };
}

/* Copywriter's words for relay refusals at the handover step, 2026-10-29. */
const HANDOVER_GONE_SAID = "The relay no longer keeps this team, as its licence has ended, so it was not handed over and nothing changed. To go on with the new key, sign in with an account that holds a licence, from the Menu, under Settings, then Account, and start a new team here on the Team screen.";
const HANDOVER_NOGRANT_SAID = "The licence service gave no licence for the new key, so the team was not handed over and stays as it was, under the old key. Signing in again moves the licence to the new key: Use another account, under the Menu, Settings, then Account, signs in afresh, with the same account or another. Then hand the team over again, and if that is refused too, write to us through etiuda.dev.";
const HANDOVER_COUNT_SAID = "The new signing key already leads 25 teams on the relay, the most it may, so this team was not handed over and stays as it was, under the old key. A place frees when the relay deletes a team's copy after its licence ends, or write to us through etiuda.dev.";
const HANDOVER_CATCHALL_SAID = "The relay did not take the handover just now, so the team stays as it was, under the old key. Nothing is lost; hand the team over again shortly.";
/* The copywriter's line of 2026-11-11 (board 931), as she fitted it to board 984 (d60a996ec): restoring the old key's backup copy keeps it aside where
   step (iii) reads it (board 984, studio:key-restore in shell/main.js), and the handover then ends. */
const HANDOVER_OLD_KEY_SAID = "On the relay the new signing key already leads the team, but the team file is not yet signed under it: that last step needs the old signing key, which is no longer on this computer. Once the old key's backup copy is restored, from the Menu, under Settings, then Signing key, Studio signs the team file and the handover ends.";

/* A relay handover parked after the relay has taken the lead still needs the old signing key to sign the team file.
   The record names that need, and the Desks screen is given one line. Anything earlier, or a folder handover, is left alone. */
function handoverNeedsOldKey(ho) {
  if (!ho || ho.kind !== "relay" || ho.step !== "(iii)") return null;
  return {
    handover: Object.assign({}, ho, { needs: "the old signing key, to sign the team file" }),
    said: HANDOVER_OLD_KEY_SAID,
  };
}

/** Moves the relay's lead for team `o.rt` to the new signing key `o.newPub`: `o` {url, rt, request, oldOpen, newKeyId, newPub, t, grant}.
 *  Signed by the old lead's key over leadBytes. {ok: true, lead, lapse} on success, or a refusal with the copywriter's exact words. */
async function handoverLead(o) {
  const C = Engine.relayRules().core;
  if (!RT_RE.test(String(o.rt))) throw new Error("a relay team id is 32 lower-case hex characters");
  const bytes = C.leadBytes(o.rt, String(o.newKeyId), String(o.newPub), o.t);
  const sig = signHex(o.oldOpen, bytes); /* plant:relay-lead-move */
  let r = null;
  try {
    r = await post(o.request, base(o.url) + "/t/" + o.rt + "/lead", {
      to: { keyId: String(o.newKeyId), pub: String(o.newPub) },
      t: o.t,
      sig,
      grant: o.grant
    });
  } catch {
    return { ok: false, reason: "status-0", said: HANDOVER_CATCHALL_SAID, status: 0 };
  }
  if (r.status === 200 && r.json && r.json.ok === true) {
    return { ok: true, lead: r.json.lead, lapse: lapseRead(r.json.lapse) };
  }
  const err = (r.json && typeof r.json.error === "string") ? r.json.error : "";
  let said = HANDOVER_CATCHALL_SAID;
  if (err === "not-enrolled") said = HANDOVER_GONE_SAID;
  else if (err === "bad-grant" || err === "revoked") said = HANDOVER_NOGRANT_SAID;
  else if (err === "team-count") said = HANDOVER_COUNT_SAID;
  return { ok: false, reason: err || ("status-" + (r ? r.status : 0)), said, status: r ? r.status : 0 };
}
function isDefiniteRefusal(res) {
  if (!res || res.status === 0) return false;
  const r = String(res.reason || "");
  return r === "team-count" || r === "bad-grant" || r === "revoked" || r === "not-enrolled" || r === "nonce-stale";
}
/** The service key that signed `grant`, or "" where the root signed it. A root is never the revoked service key. */
function grantKeyOf(grant) {
  const pub = grant && grant.via && grant.via.key ? grant.via.key.pub : "";
  return /^[0-9a-f]{64}$/.test(String(pub || "")) ? String(pub) : "";
}

/** Where a team stands at `now` by the lapse the relay last told (`lapse`, as relayTeams keeps it): null where none was told or the
 *  team works inside its grant; else {step, until, readOnly, swept}, `step` one of "grace" (working past the grant's end), "read-only",
 *  "lapsed" and "gone", and each instant in ms or null. The told instants are read back into the row they come from (the latest
 *  grant's end, and the latest paid end where the read-only time says there is one) and stood there by the pinned lapseOf. */
function lapseStep(lapse, now) {
  const l = lapse && typeof lapse === "object" ? lapse : null;
  if (!l || LAPSE_STATES.indexOf(l.state) < 0) return null;
  const C = Engine.relayRules().core;
  let state = l.state;
  if (Number.isSafeInteger(l.until) && Number.isSafeInteger(l.swept)) {
    const p = Number.isSafeInteger(l.readOnly) ? l.swept - C.READ_AFTER_MS : null;
    const row = p === null ? { until: l.until, paid: false } : p >= l.until ? { until: l.until, paid: true } : { until: l.until, paid: false, paidUntil: p };
    state = C.lapseOf(row, now).state; /* plant:g2s-step */
  }
  if (state === "working" && !(Number.isSafeInteger(l.until) && now >= l.until)) return null; /* plant:g2s-inside */
  return { step: state === "working" ? "grace" : state, until: l.until, readOnly: l.readOnly, swept: l.swept };
}

/** The devices the relay is to enrol for a signed team file: each desk its roster names whose id is its key's branch id, by
 *  the layer's own rosterOf, as {id, pub, desk}, in id order. A desk the roster no longer names is left out, which withdraws
 *  it. */
function devicesOf(team) {
  const C = Engine.relayRules().channel;
  return C.rosterOf(team).map((d) => ({ id: d.keyId, pub: d.public, desk: d.deskId }))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
/* `from` is the epoch and rev of the signed team file the list was read from (relay finding 1): signed with the list and sent
   beside it, so the relay, once it holds one, refuses a list read from an older file, or one naming none, as replay-rev. */
async function enrol(o, keys, rev, from) {
  const C = Engine.relayRules().core;
  const f = from && Number.isSafeInteger(from.epoch) && Number.isSafeInteger(from.rev) ? { epoch: from.epoch, rev: from.rev } : undefined; /* plant:df-from */
  const body = { keys, rev, t: o.t, sig: signHex(o.open, C.devicesBytes(o.rt, rev, o.t, keys, f)) }; /* plant:rs9-sent */
  if (f !== undefined) body.from = f;
  const r = await post(o.request, base(o.url) + "/t/" + o.rt + "/devices", body);
  return r.status === 200 ? { ok: true } : refusedOf(r);
}
/* The bytes a lead signs for invites. With no wraps, that is the pinned invitesBytes, so an add that carries a wrap is
   still the pin's signature (the wrap rides inside the add). A re-seal names wraps, and those bytes are the same prefix
   plus the canonical {add, drop, wraps}: the third signed field. */
function invitesSignedBytes(rt, t, add, drop, wraps) {
  const C = Engine.relayRules().core;
  if (wraps === undefined) return C.invitesBytes(rt, t, add, drop); /* plant:s3-wraps-bytes */
  return Buffer.from("etiuda-relay-invites\n" + rt + "\n" + t + "\n" + C.canon({ add, drop, wraps }), "utf8");
}
async function invites(o, add, drop, wraps) {
  const body = { add, drop, t: o.t, sig: signHex(o.open, invitesSignedBytes(o.rt, o.t, add, drop, wraps)) };
  if (wraps !== undefined) body.wraps = wraps;
  const r = await post(o.request, base(o.url) + "/t/" + o.rt + "/invites", body);
  if (r.status !== 200) return refusedOf(r);
  const j = r.json && typeof r.json === "object" ? r.json : {};
  return { ok: true, dropped: Array.isArray(j.dropped) ? j.dropped.map(String) : [],
    used: Array.isArray(j.used) ? j.used.map(String) : [] };
}
/* The lead's door call: the licence references `refs` a certified desk may ask by, signed over the pinned doorBytes, an empty list
   closing the door. {ok: true}, or the relay's refusal. */
async function postDoor(o, refs) {
  const C = Engine.relayRules().core, list = [].concat(refs || []);
  const r = await post(o.request, base(o.url) + "/t/" + o.rt + "/door", { refs: list, t: o.t, sig: signHex(o.open, C.doorBytes(o.rt, o.t, list)) });
  return r.status === 200 ? { ok: true } : refusedOf(r);
}
/* What cancelling one invitation does. It decides and it does not move the epoch: the caller marks the book, then
   moves, so a confirm drops in the same sync as the other wraps, just before them. A row the book already calls used or asked,
   or one whose drop is waiting on a confirm, posts nothing until that confirm. A row believed unused is dropped, and
   an answer that names it as used asks for one confirm before any move. */
async function cancelInvitation(o) {
  const x = o || {}, id = String(x.id || "");
  if (x.pending === true) {
    if (x.confirm !== true) return { ok: true, needsConfirm: true, dropNow: false, moveNow: false };
    return { ok: true, needsConfirm: false, dropNow: false, moveNow: true };
  }
  if (x.knownUsed === true) {
    if (x.confirm !== true) return { ok: true, needsConfirm: true, dropNow: false, moveNow: false };
    return { ok: true, needsConfirm: false, dropNow: false, moveNow: true };
  }
  if (!x.call) return { ok: false, reason: "key", said: "The signing key does not open on this computer, so the relay waits." };
  const answer = await invites(x.call, [], [id]);
  if (!answer.ok) return answer;
  const wasUsed = (answer.used || []).indexOf(id) >= 0; /* plant:s3-cancel */
  if (wasUsed && x.confirm !== true) return { ok: true, needsConfirm: true, dropNow: true, moveNow: false, used: answer.used };
  if (wasUsed) return { ok: true, needsConfirm: false, dropNow: true, moveNow: true, used: answer.used };
  return { ok: true, needsConfirm: false, dropNow: true, moveNow: false, used: answer.used };
}
/* The book after that decision, before any epoch move. A drop that has already happened is marked dropped, so the next
   sync does not send it again, and a confirm still owing its drop is marked gone and not dropped, so that drop rides
   with the other wraps. pendingMove keeps the row until the move, and only where the answer asked for a confirm. */
function noteCancel(file, team, id, decision) {
  const d = decision || {};
  if (d.ok !== true) return false;
  if (d.dropNow === true) {
    Store.endInvite(file, team, id, "withdrawn");
    const patch = { gone: true, dropped: true };
    if (d.needsConfirm === true || d.moveNow === true) patch.pendingMove = true;
    return Store.markRelayInvite(file, team, id, patch);
  }
  if (d.moveNow === true) {
    Store.endInvite(file, team, id, "withdrawn"); /* plant:s3c-end */
    return Store.markRelayInvite(file, team, id, { gone: true, pendingMove: true });
  }
  return false;
}
/* The lead's own session, opened for this call and kept nowhere. The channel's session stays its own. Invitation states
   are answered only to a session whose key is the lead's. */
async function leadSession(o) {
  try {
    const C = Engine.relayRules().core;
    const hello = await post(o.request, base(o.url) + "/t/" + o.rt + "/hello", {});
    const challenge = hello.status === 200 && hello.json && typeof hello.json.challenge === "string" ? hello.json.challenge : "";
    if (!/^[0-9a-f]{32}$/.test(challenge)) return "";
    const key = o.open.keyId;
    /* On a team whose licence follows Entra the lead's session carries its seat's certificate; with none held, nothing is sent. */
    const seat = typeof o.seat === "function" ? o.seat() : null;
    const ses = await post(o.request, base(o.url) + "/t/" + o.rt + "/session",
      Object.assign({ challenge, key, pub: o.open.public, sig: signHex(o.open, C.helloBytes(o.rt, challenge, key)) }, seat ? { seat } : {})); /* plant:c1-states-seat */
    return ses.status === 200 && ses.json && typeof ses.json.session === "string" ? ses.json.session : "";
  } catch {
    return "";
  }
}
/* Each invitation as the relay reports it, from the relay's own route, GET /t/<relay team id>/states, answered only to the
   lead's session (relay/core.cjs statesFor): {id, state, used}, or null where it will not say. The relay's {states: [{id,
   state, usedAt}]} is read here and the caller keeps its own names: `used` is the first-use time in milliseconds (the
   relay's `usedAt`), and null where the relay has not got one. */
async function hearStates(o) {
  const session = await leadSession(o);
  if (!/^[0-9a-f]{64}$/.test(session)) return null;
  const r = await get(o.request, base(o.url) + "/t/" + o.rt + "/states", { authorization: "Bearer " + session }); /* plant:rs934-states */
  if (r.status !== 200 || !r.json || !Array.isArray(r.json.states)) return null;
  return r.json.states.filter((row) => !!row && typeof row === "object")
    .map((row) => ({ id: row.id, state: row.state, used: Number.isFinite(row.usedAt) ? row.usedAt : null }));
}
/* One invitation registered: its token's hash, and the wrap of the current team key where the secret and the key are
   both here. A wrap that will not seal is left off, and the token is still registered. */
function addRow(i, book, teamKey, rt, team) {
  const row = { id: i.inv, hash: sha256(Buffer.from(i.token, "utf8")) };
  const until = Date.parse(String(i.expires || ""));
  if (Number.isFinite(until)) row.until = until; /* plant:s3-until */
  const secret = book && book[i.id] ? book[i.id].secret : "";
  if (!secret || !teamKey || !team) return row;
  const wrap = sealWrap({ secret, rt, teamId: team.id, invitationId: i.inv, epoch: team.epoch, key: teamKey });
  if (wrap) row.wrap = wrap;
  return row;
}
/* Invitations still to be sealed under the current epoch: registered, not yet admitted, not dropped in this call,
   opened ones included (the book still calls them live). One already sealed at this epoch is left. The secret stays in
   the vault until the invitation is admitted, dropped or ends. */
function resealOf(all, drop, book, teamKey, rt, team) {
  const dropSet = new Set(drop), out = [];
  for (const i of all) {
    if (i.gone || i.state !== "live" || !i.registered || dropSet.has(i.inv) || i.wrappedEpoch === team.epoch) continue;
    const secret = book && book[i.id] ? book[i.id].secret : "";
    if (!secret || !teamKey) continue;
    const wrap = sealWrap({ secret, rt, teamId: team.id, invitationId: i.inv, epoch: team.epoch, key: teamKey });
    if (wrap) out.push({ id: i.inv, wrap });
  }
  return out;
}

/** What a new invitation of a team on the relay carries beside its secret: the relay's id for it (16 random bytes), the
 *  token the desk opens its one session with (32 random bytes, the relay told only its sha256), and the key the team file's
 *  copy for it is sealed under, which the desk derives from the same secret (the layer's inviteSealKey). */
function relayInvite(secret) {
  const C = Engine.relayRules().channel, seal = C.inviteSealKey(String(secret || ""));
  if (!seal) throw new Error("an invitation's secret is 32 lower-case hex characters");
  return { inv: relayId(), token: crypto.randomBytes(32).toString("hex"), seal };
}

/* ---- the head ------------------------------------------------------------------------------------------------------- */

/* A short text the desk will show. The same bounds as the pinned channel's headTextOk: one bad entry refuses the head. */
function headTextOk(s, max) {
  return typeof s === "string" && s.length >= 1 && s.length <= max && !/[\u0000-\u001f\u007f]/.test(s);
}

/* The catalog inside one file at the mirror's root, or null. A sealed envelope opens with the key of the epoch it names. */
function catalogIn(folder, name, keys) {
  let doc = null;
  try { doc = JSON.parse(fs.readFileSync(path.join(folder, name), "utf8").replace(/^\uFEFF/, "")); } catch { return null; }
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return null;
  const seal = Engine.sealRules();
  if (doc.kind === seal.SEALED_KIND) {
    const key = keys ? keys[doc.epoch] : null;
    if (!key) return null;
    let text = null;
    try { text = seal.openSealed(key, doc); } catch { text = null; }
    if (typeof text !== "string") return null;
    try { doc = JSON.parse(text); } catch { return null; }
    if (!doc || typeof doc !== "object" || Array.isArray(doc)) return null;
  }
  return doc;
}

/* Each catalog the team leads, its newest published edition at the mirror's root: the catalog id, the rev, the dated
   edition and that same date as the publish time. The catalog carries no clock beside the date the publish stamped, and
   the desk shows that date. An entry the desk would refuse is left out.

   ONLY THE TEAM'S LEAD KEY MOVES THE HEAD (Grok's review 9 of the relay member, finding 1, 2026-11-15). The head is signed, and a
   desk on a team takes a catalog only where the lead key it pinned signed it (the pin's shell/main.js catalogLeadOk), so an edition
   is named only where its signature holds under `team.lead.public`. A plain file at the root, one sealed under the team key that
   every desk holds, or one another key signed, whatever rev and date it claims, moves nothing.
   A FILE THAT DOES NOT OPEN OR VERIFY TAKES NOTHING OFF IT EITHER. Such a file may be the edition of a catalog the head already
   names (sealed for an epoch this Studio does not hold, or put there by another hand), so for a catalog the team still lists the
   head this lead last signed is read beside the files (`o.leads`, the publics whose head is taken, the team's lead by default; a
   handover passes the old lead's too): where the files are in doubt for a catalog, one that verified naming its id, or any one
   that did not open as a catalog naming an id, the head keeps the better of the edition it named and the one found. With every
   file opening and verifying, a catalog with no edition at the root leaves the head as before. `o.unread`, an array where given,
   is handed the name of each file in doubt, for the caller to say. */
function editionsLed(folder, team, keys, o) {
  const opts = o || {};
  const led = new Set((Array.isArray(team.catalogs) ? team.catalogs : []).map(String));
  const idOk = Engine.relayRules().blob.isId;
  const lead = team && team.lead && /^[0-9a-f]{64}$/.test(String(team.lead.public || "")) ? String(team.lead.public) : "";
  const holds = (doc, pub) => { try { return !!pub && signatureHolds(doc, pub); } catch { return false; } };
  let names = [];
  try { names = fs.readdirSync(folder).filter((n) => /\.ec$/i.test(n)).sort(); } catch { names = []; }
  const best = new Map(), doubt = new Set();
  let blind = false;
  const unread = (name) => { if (Array.isArray(opts.unread)) opts.unread.push(name); };
  for (const name of names) {
    const cat = catalogIn(folder, name, keys);
    if (!cat || typeof cat.id !== "string" || !cat.id) { blind = true; unread(name); continue; } /* plant:m9-blind */
    const catalogId = cat.id;
    if (!led.has(catalogId) || !idOk(catalogId)) continue;
    if (!holds(cat, lead)) { doubt.add(catalogId); unread(name); continue; } /* plant:m9-lead-signed */
    const rev = cat.rev;
    if (!Number.isSafeInteger(rev) || rev < 0) continue;
    const edition = typeof cat.date === "string" ? cat.date : "";
    if (!headTextOk(edition, 80)) continue;
    const prev = best.get(catalogId);
    if (!prev || rev > prev.rev || (rev === prev.rev && edition > prev.edition)) /* plant:rs5-first */
      best.set(catalogId, { catalog: catalogId, rev, edition, published: edition });
  }
  if (blind || doubt.size) {
    for (const e of headNamed(folder, team, Array.isArray(opts.leads) ? opts.leads : [lead])) {
      if (!led.has(e.catalog) || !(blind || doubt.has(e.catalog))) continue;
      const found = best.get(e.catalog);
      if (!found || e.rev > found.rev || (e.rev === found.rev && e.edition > found.edition)) best.set(e.catalog, e); /* plant:m9-keep-named */
    }
  }
  return Array.from(best.values()).sort((a, b) => (a.catalog < b.catalog ? -1 : a.catalog > b.catalog ? 1 : 0));
}

/* The editions the head at `folder` names, where it is this team's and one of `leads` signed it, judged as the pinned desk judges a head
   (channel.cjs headJudged: its signedBytes under HEAD_PREFIX, blob.cjs verifySigned, headEditions, which refuses the whole head for one
   entry out of shape); [] for no head, another team's, or a signature that does not hold. */
function headNamed(folder, team, leads) {
  const C = Engine.relayRules().channel, B = Engine.relayRules().blob;
  let doc = null;
  try { doc = JSON.parse(fs.readFileSync(path.join(folder, HEAD_NAME), "utf8").replace(/^\uFEFF/, "")); } catch { return []; }
  if (!doc || typeof doc !== "object" || Array.isArray(doc) || doc.v !== 1 || doc.team !== String(team.id) || !doc.sig || typeof doc.sig !== "object") return [];
  let bytes = null;
  try { bytes = C.signedBytes(doc); } catch { return []; }
  const signedBy = (pub) => { try { return /^[0-9a-f]{64}$/.test(String(pub || "")) && B.verifySigned(String(pub), C.HEAD_PREFIX, bytes, doc.sig.value) === true; } catch { return false; } };
  if (!leads.some(signedBy)) return []; /* plant:m9-named-signed */
  let list = null;
  try { list = C.headEditions(doc.editions); } catch { list = null; }
  return (list || []).filter((e) => headTextOk(e.edition, 80) && headTextOk(e.published, 80));
}

/* WHETHER THE HEAD SHOULD GO (board 962 stage 6, 3.1 step 3): the team leads no catalog with an edition at the root, and every .ec
   there opens under `keys` as a catalog naming its id, so the emptiness is known and not a key this Studio lacks or a file it cannot
   read. A head left standing then names catalogs the team no longer lists, which a desk's headView already ignores; one deleted where
   a file only failed to open would hide a catalog the team still leads, so that case keeps the head as it was. */
function headGone(folder, team, keys) {
  if (editionsLed(folder, team, keys).length) return false;
  let names = [];
  try { names = fs.readdirSync(folder).filter((n) => /\.ec$/i.test(n)); } catch { return false; }
  return names.every((n) => { const c = catalogIn(folder, n, keys); return !!c && typeof c.id === "string" && !!c.id; }); /* plant:head-gone-known */
}

/** The head the lead signs for `team` at `t`, the shape the pinned desk accepts: {v: 1, team, epoch, rev, editions, t,
 *  sig}. `editions` is each led catalog's newest published edition. Signed over the layer's head prefix and the canonical
 *  bytes the desk's headJudged checks. */
function headOf(open, team, t, editions) {
  const C = Engine.relayRules().channel;
  const doc = { v: 1, team: String(team.id), epoch: team.epoch, rev: team.rev, editions: editions, t: t,
    sig: { alg: "Ed25519", keyId: open.keyId } };
  doc.sig.value = signHex(open, Buffer.concat([Buffer.from(C.HEAD_PREFIX, "utf8"), C.signedBytes(doc)]));
  return doc;
}
/* What moves the head besides its five minutes: the editions at the mirror's root, by name and bytes. */
function rootStamp(folder) {
  let names = [];
  try { names = fs.readdirSync(folder).filter((n) => /\.ec$/i.test(n)).sort(); } catch { names = []; }
  return sha256(names.map((n) => { let b = ""; try { b = sha256(fs.readFileSync(path.join(folder, n))); } catch { b = "-"; } return n + "=" + b; }).join("\n"));
}

/* ---- the channel ---------------------------------------------------------------------------------------------------- */

/* One channel's calls while a catch-up before a move is in flight (board 911, F-omega1). The pinned channel does not say
   whether the catch-up inside a cycle finished, so the request handed to it is wrapped and the calls kept here. */
const catchNotes = new WeakMap();
/* The pinned channel's since page (channel.cjs SINCE_MAX). It is not exported, and that catch-up ends on a short page (since
   engine 7f52282d, on one that names nothing past where it was asked from: channel.cjs pageEnds). */
const SINCE_PAGE = 1000;

/** The headers a since page lists, by blob id. An item at `to:<desk id>` (the relay's addressed place, board 1013) is a desk's mail to
 *  another desk: no desk's file and no team blob, so it is passed over and never taken for either. An entry with no id is too. */
function listedMetas(list) {
  const out = new Map();
  if (!Array.isArray(list)) return out;
  for (const e of list) {
    if (!e || !e.meta || typeof e.meta.id !== "string") continue;
    if (typeof e.meta.place === "string" && e.meta.place.startsWith("to:")) continue; /* plant:rs-to-passed */
    out.set(e.meta.id, e.meta);
  }
  return out;
}

/* AN INVITATION'S KEY OPENS ONLY ITS OWN DESK'S REQUEST (E4 of relay-life-h345). The pinned channel tries every invitation key
   it is handed on every request a desk sent by an invitation, and a request names no invitation the relay or the channel could
   check. So where the book knows which desk an invitation's key belongs to (it let that desk in, src/team-store.mjs endInvite),
   a blob another key sent sealed under that invitation's key is not handed to the channel at all: it is answered as no longer
   served, which the channel passes over. `m` is the blob's header as the relay serves it, `ct` its ciphertext. */
function sealedUnder(rt, m, ct, key) {
  const B = Engine.relayRules().blob;
  const bytes = Buffer.from(ct || []), k = Buffer.from(key || []);
  const aad = B.aadOf({ relayTeamId: rt, epoch: m.epoch, id: m.id, supersedes: m.supersedes == null ? null : m.supersedes,
    writerKeyId: m.writer, counter: m.counter });
  if (!aad || k.length !== 32 || typeof m.nonce !== "string" || !/^[0-9a-f]{24}$/.test(m.nonce) || bytes.length <= B.TAG_BYTES) return false;
  try {
    const dc = crypto.createDecipheriv("aes-256-gcm", k, Buffer.from(m.nonce, "hex"), { authTagLength: B.TAG_BYTES });
    dc.setAAD(aad);
    dc.setAuthTag(bytes.subarray(bytes.length - B.TAG_BYTES));
    dc.update(bytes.subarray(0, bytes.length - B.TAG_BYTES));
    dc.final();
    return true;
  } catch { return false; }
}
/* Whether `ct` under the header `m` carries its writer's own upload signature: `pub` must be the key the writer's id is made from
   (k- and the first 16 hex of its sha256), and the signature over the blob's header fields and ciphertext must hold under it. */
function signedBy(rt, m, ct) {
  const B = Engine.relayRules().blob;
  if (typeof m.pub !== "string" || !/^[0-9a-f]{64}$/.test(m.pub) || !DESK_KEY.test(String(m.writer))) return false;
  if ("k-" + sha256(Buffer.from(m.pub, "hex")).slice(0, 16) !== m.writer) return false;
  const aad = B.aadOf({ relayTeamId: rt, epoch: m.epoch, id: m.id, supersedes: m.supersedes == null ? null : m.supersedes,
    writerKeyId: m.writer, counter: m.counter });
  try { return !!aad && B.verifyUpload(m.pub, aad, Buffer.from(ct || []), m.sig) === true; } catch { return false; }
}
function servedMeta(res) {
  const h = res && typeof res.header === "function" ? res.header("etiuda-blob") : null;
  if (typeof h !== "string" || !h) return null;
  try { const m = JSON.parse(Buffer.from(h, "base64url").toString("utf8")); return m && typeof m === "object" ? m : null; } catch { return null; }
}
const NOT_SERVED = Buffer.from(JSON.stringify({ error: "superseded" }), "utf8");

/** The channel layer over a led team's mirror, as the desk's shell makes its own: `o` {rt, url, mirror, team, lead {keyId,
 *  public}, open() the signing key opened or null, agree(box), keyFor(epoch), sealEpoch(), inviteKeys(), bound(), request,
 *  connect, say, onTeam, clock, watch, pollMs, onAsked(writer, {id, epoch, counter})}. `bound()` lists the invitation keys whose
 *  desk the book knows, {key, desk}: a request another desk sealed under one of them is left out (sealedUnder), and so is any blob
 *  whose header cannot be read while one is bound. `onAsked` is told each request a desk sent by its invitation that carries that
 *  desk's own signature (signedBy). Its record sits beside the mirror (<mirror>.json), so the floors survive a restart. */
function leadChannel(o) {
  const C = Engine.relayRules().channel;
  const note = { seen: [], on: false };
  const listed = new Map();
  const request = async (method, url, headers, body) => {
    let res = await o.request(method, url, headers, body);
    if (typeof o.onLapse === "function") heardLapse(o.onLapse, method, String(url), res);
    if (typeof o.bound === "function" && method === "GET" && res && res.status === 200) {
      const u = String(url);
      if (/\/since\/\d+$/.test(u)) {
        listed.clear();
        try {
          const list = JSON.parse(Buffer.from(res.bytes || []).toString("utf8"));
          for (const [id, m] of listedMetas(list)) listed.set(id, m);
        } catch { /* a list that does not read is the channel's to judge */ }
      } else if (/\/b\/[0-9a-f]{32}$/.test(u)) {
        const id = u.slice(-32), head = servedMeta(res);
        const m = head && head.id === id ? head : listed.get(id) || null;
        const bound = o.bound() || [];
        /* A blob whose header cannot be read is not handed over while any invitation key is bound: the channel would try the
           keys it holds on it with no writer to bind them to. */
        if (!m && bound.length) {
          if (typeof o.say === "function") o.say("a file the relay served without its header was left out.");
          res = { status: 410, bytes: NOT_SERVED, header: () => null };
        } else if (m && typeof m.pub === "string" && m.writer !== o.lead.keyId) {
          const others = bound.filter((b) => b && b.desk !== m.writer);
          if (others.some((b) => sealedUnder(o.rt, m, res.bytes, b.key))) { /* plant:e4s-bound */
            if (typeof o.say === "function") o.say("a request from " + m.writer + " sealed under another desk's invitation was left out.");
            res = { status: 410, bytes: NOT_SERVED, header: () => null };
          } else if (typeof m.box === "string") {
            /* A request at the standing door: the relay serves the box its door hello signed beside it. It came by no invitation, so it
               is not kept as one's request: a withdrawal of it is never read as an invitation's (withdrawnOff). */
          } else if (m.del !== true && typeof o.onAsked === "function" && signedBy(o.rt, m, res.bytes)) {
            /* A request a desk sent by its invitation, its upload signature holding under the key its id is made from: kept as the
               request that desk last asked with, so only a withdrawal of that very request counts (withdrawnOff). */
            o.onAsked(String(m.writer), { id: String(m.id), epoch: m.epoch, counter: m.counter }); /* plant:rp-asked */
          }
        }
      }
    }
    if (note.on) {
      const u = String(url);
      let json = null;
      if (method === "GET" && /\/since\/\d+$/.test(u)) {
        try { json = JSON.parse(Buffer.from(res && res.bytes ? res.bytes : []).toString("utf8")); } catch { json = null; }
      }
      note.seen.push({ method: method, url: u, status: res && typeof res.status === "number" ? res.status : 0, json: json });
    }
    return res;
  };
  const ch = C.createChannel({ rt: o.rt, url: o.url, mirror: o.mirror, stateFile: o.mirror + ".json", write: writeWhole, /* plant:rs-floors */
    pin: () => ({ teamId: o.team, rt: o.rt, lead: { keyId: o.lead.keyId, public: o.lead.public } }),
    /* The lead's box, its public half: the pinned channel makes the key a request at the standing door is sealed under from it, so
       with none no door request opens. */
    me: () => { const k = o.open(); return k ? { keyId: k.keyId, public: k.public, privateKey: k.privateKey, place: "root", box: typeof o.box === "function" ? String(o.box() || "") : "" } : null; }, /* plant:a4-me-box */
    agree: o.agree, keyFor: o.keyFor, sealEpoch: o.sealEpoch, inviteKeys: o.inviteKeys,
    request, connect: o.connect, say: o.say, onTeam: o.onTeam, onHere: o.onHere, clock: o.clock, watch: o.watch, pollMs: o.pollMs, /* plant:rs-watch */
    seat: o.seat, seatRenew: o.seatRenew, onSeat: o.onSeat }); /* plant:c1-lead-seat */
  catchNotes.set(ch, note);
  return ch;
}

/* The lapse a call's answer tells: a session's in its body, since's in its etiuda-lapse header. Anything else tells none. */
function heardLapse(to, method, url, res) {
  if (!res || res.status !== 200) return;
  let l = null;
  if (method === "POST" && /\/t\/[0-9a-f]{32}\/session$/.test(url)) {
    try { const j = JSON.parse(Buffer.from(res.bytes || []).toString("utf8")); l = lapseRead(j && j.lapse); } catch { l = null; }
  } else if (method === "GET" && /\/t\/[0-9a-f]{32}\/since\/\d+$/.test(url) && typeof res.header === "function") {
    l = lapseOfHeader(res.header("etiuda-lapse")); /* plant:g2s-since */
  }
  if (l) to(l);
}

/* ---- the runner: every team this Studio leads on the relay ----------------------------------------------------------- */

/** Whether the desk `id` is on the team file's roster at all. */
function onRoster(team, id) {
  return (team.roster || []).some((e) => e && e.desk && e.desk.id === id);
}

/** Whether the desk `id` an invitation let in has read its wrap: on the roster with a wrap of the team's key number, and its
 *  request gone from the mirror by its own signed deletion. */
function wrapRead(team, folder, id) {
  if (!/^k-[0-9a-f]{16}$/.test(String(id))) return false;
  const on = (team.roster || []).some((e) => e && e.desk && e.desk.id === id && e.wrap && e.wrap.epoch === team.epoch);
  return on && !fs.existsSync(path.join(folder, "desks", id, "join.json"));
}

/** The epoch of the team file in `folder`, or null where that file is absent or will not read. The channel seals at this
 *  epoch, not at a key kept before the file moves. */
function mirrorEpoch(folder, teamsFile, team, lead) {
  let text = null;
  try { text = teamFileText(folder); }
  catch { return null; }
  const read = Engine.teamRules().v2TeamRead(String(text).replace(/^\uFEFF/, ""));
  const t = read && read.team;
  const n = t && t.epoch;
  if (!Number.isInteger(n) || n < 1) return null;
  if (teamsFile && t && (!lead || (t.lead && t.lead.keyId === lead.keyId && t.lead.public === lead.public))) {
    Store.clearKeyPending(teamsFile, team || t.id, n); /* plant:rs920-stale */
  }
  return n;
}

/** Runs the relay for every team the teams file `d.teamsFile` keeps on it: `d` {teamsFile, vault, keyFile, secret() the
 *  signing key's secret now or "", request, connect, say, clock, watch, pollMs, roots, onLapse(team) told when the relay says something
 *  new of where a team stands, fetchGrant() the quiet check asked at once when a revoked key cannot be posted past,
 *  revokedKeys() the service keys the licence root has revoked, doorRefs() the licence references the standing door is open to, none
 *  where the lead is not signed in, serviceDoors(doors) the set of this lead key's open doors handed to the licence service,
 *  answering {ok}}. `sync()` makes the lead's calls each team
 *  owes and starts, keeps or stops its channel; `stop()` stops them all. The space of a team is made under the grant held beside
 *  `keyFile` (relay-grant.json, above), judged under `roots` where a leg names them and under the vendor's root where none is named. */
function relayRunner(d) {
  const clock = typeof d.clock === "function" ? d.clock : Date.now;
  const tell = typeof d.say === "function" ? d.say : () => {};
  /* This team's own revoked line, until the next sync: the channel's "signed by a revoked key". A different 403, and any other
     team's line, is said. */
  const muted = new Set();
  const say = (line) => {
    const text = String(line);
    const who = (/^relay of team ([^:]+): /.exec(text) || [])[1] || "";
    if (who && muted.has(who) && text.indexOf("signed by a revoked key") >= 0) return; /* plant:rr-hide-403 */
    tell(text);
  };
  const saidRevoked = new Set(), saidNone = new Set(), refusedSigner = new Set();
  const revokedSince = new Map(), lastFetched = new Map();
  function clearRevokedTracking(team) {
    saidRevoked.delete(team);
    saidNone.delete(team);
    for (const k of revokedSince.keys()) if (k.startsWith(team + ":")) revokedSince.delete(k); /* plant:rr-clear-tracking */
    for (const k of lastFetched.keys()) if (k.startsWith(team + ":")) lastFetched.delete(k);
  }
  let recovering = false;
  const channels = new Map();
  const opened = () => leadOpened(d.keyFile, d.secret ? d.secret() : "");
  const keysOf = (team) => Store.teamKeysOf(d.teamsFile, d.vault)[team] || {};
  /* THE RUNNER'S TEAM WRITES TAKE THE TEAM'S LOCK (board 962 stage 5, T3; the shell's teamAct, handed in as d.teamAct). Each reads
     the team file afresh inside the lock, so an act that wrote it in between is built on and not undone, and writeTeam's stale
     refusal (a writer outside the lock) reads it once more. Without a teamAct, as in a gate that makes a runner alone, the write
     runs as it did. The shell lends an act's lock to the sync that act awaits, so a write here during that act completes. */
  const teamWrite = (team, fn) => (typeof d.teamAct === "function" ? d.teamAct(team, fn) : fn()); /* plant:rs-team-act */
  /* The team file this Studio last wrote, kept as teams.json's entry.file, so a kept copy restored later is not refused as older
     than the floor this write raised (Argon's finding 9b). A team this computer keeps no record of is left as it is. */
  const keepWritten = (team, written) => {
    try { const k = Store.keptTeam(d.teamsFile, team); if (k && written) Store.chooseSealed(d.teamsFile, team, k.sealed === true, null, written); } /* plant:rs-keep-file */
    catch (e) { say("relay of team " + team + ": the team file written could not be kept on this computer - " + String(e && e.message || e)); }
  };
  /* Read the relay team afresh and write `change(team)` once; a stale refusal reads it once more. Null where the file is not this
     relay team's any longer, or where change answers null (nothing to write). */
  async function rewriteTeam(t, secret, change) {
    for (let round = 0; ; round++) {
      const fresh = (await heldTeam(t.folder, { key: d.keyFile })).team;
      if (!fresh || !fresh.channel || fresh.channel.kind !== "relay" || fresh.channel.rt !== t.rt) return null;
      /* A gate's hook only (the shell never passes it): another writer between this read and the write, to drive the stale re-read. */
      if (typeof d.afterTeamRead === "function") await d.afterTeamRead(t.team, round);
      const next = change(fresh);
      if (!next) return fresh;
      try {
        const written = (await writeTeam(t.folder, next, { key: d.keyFile, passphrase: secret })).team;
        keepWritten(t.team, written);
        return written;
      } catch (e) { if (e && e.stale && round === 0) continue; throw e; } /* plant:rs-stale-again */
    }
  }
  /* The pinned channel asks inviteKeys when it opens what arrived (catchUp, retryPending) and when it seals the copies
     it owes (flush, before that function's first await, so the frame is flush). A spent invitation's seal still seals
     its copy until that desk has read its wrap (relay-e2e re7, N1). Until then it also opens what the desk it let in sends by
     that invitation, its request taken back at the relay above all (E4 of relay-life-h345), and nothing any other desk sends:
     its key is bound to that desk (`bound`, leadChannel), so it opens no join it did not carry (board 914). A spent seal whose
     desk the book does not name opens nothing. One whose own end has passed, its desk named, still opens that desk's withdrawal
     until the sync lets it go, as the relay takes a withdrawal until its keep ends (G1 of the test architect's triage). A
     withdrawn seal, or one past its end with no desk, is handed to neither, and flush is never handed one past its end. */
  const sealRows = (team) => Store.relayInvitesOf(d.teamsFile, d.vault, team, clock()).filter((i) => !i.gone && i.seal);
  const sealsFor = (team, copies) => sealRows(team)
    .filter((i) => i.state === "live" || (i.state === "spent" && (copies || DESK_KEY.test(i.desk))) /* plant:e4s-open */
      || (!copies && i.state === "expired" && DESK_KEY.test(i.desk))) /* plant:e4s-expired */
    .map((i) => ({ id: i.inv, key: i.seal }));
  const boundFor = (team) => sealRows(team)
    .filter((i) => (i.state === "live" || i.state === "spent" || i.state === "expired") && DESK_KEY.test(i.desk)).map((i) => ({ key: i.seal, desk: i.desk }));

  /* Where the relay says the team stands, kept when it says something new, with when it was first heard. */
  function keepLapse(team, l, at) {
    const row = Store.relayTeams(d.teamsFile).find((w) => w.team === team);
    if (!row || !l) return;
    const was = row.lapse;
    if (was && was.state === l.state && was.until === l.until && was.readOnly === l.readOnly && was.swept === l.swept) return;
    Store.markRelay(d.teamsFile, team, { lapse: Object.assign({}, l, { at: Math.floor(at) }) }); /* plant:g2s-keep */
    if (typeof d.onLapse === "function") { try { d.onLapse(team); } catch { /* the word is kept; a listener does not stop the sync */ } }
  }

  /* Every call the runner makes, so a revoked answer on a grant, a hello or a session is read here. The pinned channel
     turns an unknown reason into "answered 403"; the body still carries the relay's word, and this reads it before that. */
  function revokedError(res) {
    try {
      const j = JSON.parse(Buffer.from(res && res.bytes ? res.bytes : []).toString("utf8"));
      return !!(j && j.error === "revoked");
    } catch { return false; }
  }
  const rawRequest = d.request;
  /* A hello, a session or a grant the relay accepted clears a revoked mark. The relay may have taken a grant this Studio
     did not itself post. Any other 200 leaves the mark. */
  function acceptRevoked(url) {
    const found = /\/t\/([0-9a-f]{32})\/(hello|session|grant)$/.exec(String(url).split("?")[0]);
    if (!found) return;
    const row = Store.relayTeams(d.teamsFile).find((w) => w.rt === found[1]);
    if (!row || !row.revoked) return;
    clearRevokedTracking(row.team);
    Store.markRelay(d.teamsFile, row.team, { revoked: false, revokedNone: false });
    if (typeof d.onLapse === "function") { try { d.onLapse(row.team); } catch { /* the record is kept; a listener does not stop the sync */ } }
  }
  async function relayCall(method, url, headers, body) {
    let res = await rawRequest(method, url, headers, body);
    const path = String(url).split("?")[0];
    if (!recovering && revokedError(res)) {
      recovering = true;
      let replaced = false;
      try { replaced = await meetRevoked(path, body); }
      catch { /* the sentence is already said; a fault in the fetch leaves the cover as it is */ }
      finally { recovering = false; }
      if (replaced) { /* plant:rr-retry-call */
        res = await rawRequest(method, url, headers, body);
        if (res && res.status === 200) acceptRevoked(path);
      }
    } else if (res && res.status === 200) acceptRevoked(path); /* plant:rr-clear-hello */
    noteSyncRefusal(method, path, body, res);
    return res;
  }
  /* The fetch finished, or was not run, and nothing was posted. The cover leaves the fetching sentence. */
  function noneLeft(team) {
    Store.markRelay(d.teamsFile, team, { revoked: true, revokedNone: true }); /* plant:rr-none */
    if (!saidNone.has(team)) {
      saidNone.add(team);
      say("relay of team " + team + ": " + REVOKED_NONE);
      if (typeof d.onLapse === "function") { try { d.onLapse(team); } catch { /* the record is kept; a listener does not stop the sync */ } }
    }
  }
  /* The relay answered revoked. Say the fetching sentence and mark the row first, so the cover shows it while the fetch
     is in flight. Post any held or fetched grant whose signer is not the one the relay refused and not on the revoked
     list. The signer to avoid is the grantKey the row kept, never whatever is on disk: an empty grantKey is a team
     saved before the field, and the file may already be the replacement. owesGrant is not asked. */
  async function meetRevoked(url, body) {
    const found = /\/t\/([0-9a-f]{32})(?:\/|$)/.exec(url);
    let rt = found ? found[1] : "";
    if (!rt) {
      try {
        const j = JSON.parse(Buffer.from(body || []).toString("utf8"));
        if (j && /^[0-9a-f]{32}$/.test(String(j.rt || ""))) rt = String(j.rt);
      } catch { rt = ""; }
    }
    const teams = Store.relayTeams(d.teamsFile);
    const row = rt ? teams.find((w) => w.rt === rt) : (teams.length === 1 ? teams[0] : null);
    if (!row) return;
    const team = row.team;
    if (row.revokedNone) { /* plant:rr-restart-none */
      if (!saidNone.has(team)) {
        saidNone.add(team);
        say("relay of team " + team + ": " + REVOKED_NONE);
        if (typeof d.onLapse === "function") { try { d.onLapse(team); } catch { /* listener */ } }
      }
    } else {
      Store.markRelay(d.teamsFile, team, { revoked: true, revokedNone: false });
      if (!saidRevoked.has(team)) {
        saidRevoked.add(team);
        say("relay of team " + team + ": " + REVOKED_SAID); /* plant:rr-say-fetching */
        if (typeof d.onLapse === "function") { try { d.onLapse(team); } catch { /* the record is kept; a listener does not stop the sync */ } }
      }
    }
    muted.add(team);
    const x = opened();
    if (!x) { noneLeft(team); return false; }
    const now = Math.floor(clock());
    const held = readGrant(d.keyFile);
    const avoided = row.grantKey || ""; /* plant:rr-avoid-held */
    const list = typeof d.revokedKeys === "function" ? [].concat(await d.revokedKeys() || []) : [];
    const postable = (g) => {
      if (!g || grantRefusal(g, x.open.public, now, d.roots) !== null) return false;
      const signer = grantKeyOf(g);
      if (refusedSigner.has(team + ":" + signer)) return false;
      if (signer && list.indexOf(signer) >= 0) return false;
      if (!signer) return true;
      return signer !== avoided;
    };
    const posted = async (g) => {
      const r = await renewGrant({ url: row.url, rt: row.rt, request: relayCall, grant: g });
      if (r.ok) {
        clearRevokedTracking(team);
        Store.markRelay(d.teamsFile, team, { granted: g, grantKey: grantKeyOf(g), revoked: false, revokedNone: false, refusedLead: "", taken: false });
        if (r.lapse) keepLapse(team, r.lapse, now);
        return true;
      }
      if (r.reason === "revoked") refusedSigner.add(team + ":" + grantKeyOf(g));
      /* A swept space answers a renewal not-enrolled, and the worker has already refused the grant that was in force. The grant
         just held is one the relay will take, so the space is made again now, in the pass that fetched it. */
      else if (r.reason === "not-enrolled") {
        const x2 = opened();
        const teamRow = Store.relayTeams(d.teamsFile).find((w) => w.team === team);
        if (x2 && teamRow && teamRow.taken !== true) {
          const made = await remake(teamRow, { url: teamRow.url, rt: teamRow.rt, open: x2.open, request: relayCall, t: now, revokedKeys: list }, g, x2);
          if (made.ok && !made.taken) return true;
          if (!made.taken && made.said) say("relay of team " + team + ": " + made.said);
          return false;
        }
        say("relay of team " + team + ": " + r.said);
      }
      else say("relay of team " + team + ": " + r.said);
      return false;
    };
    if (postable(held) && await posted(held)) return true;
    const before = grantKeyOf(held);
    const fetchedKey = team + ":" + (avoided || before || "none");
    if (!revokedSince.has(fetchedKey)) revokedSince.set(fetchedKey, row.revokedNone ? now - REVOKED_HOUR_MS : now);
    const last = lastFetched.get(fetchedKey) || 0;
    const pastHour = (now - revokedSince.get(fetchedKey)) >= REVOKED_HOUR_MS;
    const retryEvery = pastHour ? REVOKED_HOUR_MS : REVOKED_RETRY_MS; /* plant:rr-slow-hourly */
    const dueFetch = asking || !lastFetched.has(fetchedKey) || (now - last >= retryEvery); /* plant:rr-retry-fetch */
    if (dueFetch && typeof d.fetchGrant === "function") {
      lastFetched.set(fetchedKey, now);
      try {
        await d.fetchGrant(); /* plant:rr-revoked-fetch */
      } catch { /* a fetch that fails, or is not reached, leaves the cover on the nothing-found sentence */ }
    }
    const fresh = readGrant(d.keyFile);
    /* The grant just refused is not posted again. One the fetch kept, or one that was not postable as held, is. */
    const other = fresh && (grantKeyOf(fresh) !== before || !postable(held));
    if (other && postable(fresh) && await posted(fresh)) return true;
    /* plant:rr-first-none */
    const expired = (now - revokedSince.get(fetchedKey)) >= REVOKED_HOUR_MS; /* plant:rr-hour-expired */
    if (asking || expired) noneLeft(team); /* plant:rr-ask-none */
    return false;
  }

  /* A LOOK is one channel cycle for a team (board 932, condition 6). A refusal the relay answers during it is kept for the
     Desks screen: team-size, which is also what the live-file cap answers, rate, and bad-signature, replay-counter or epoch
     on an upload. The third out-of-step look in a row for that team is kept as out-of-step-3. A look that succeeds, and
     recorded none of these, clears the line and the count. What the sync retries, when, and what it keeps, is unchanged. */
  const SYNC_OUT = ["bad-signature", "replay-counter", "epoch"];
  const looks = new Map();
  function lookOf(team) {
    let n = looks.get(team);
    if (!n) {
      const row = Store.relayTeams(d.teamsFile).find((w) => w.team === team);
      n = { open: false, waiting: false, gen: 0, kinds: new Set(), succeeded: false,
        streak: row && Number.isSafeInteger(row.syncStreak) && row.syncStreak > 0 ? row.syncStreak : 0 };
      looks.set(team, n);
    }
    return n;
  }
  function beginLook(team) {
    const n = lookOf(team);
    if (n.open) return;
    n.open = true;
    n.gen += 1;
    n.kinds = new Set();
    n.succeeded = false;
  }
  function writeSyncNote(team, note, streak) {
    const row = Store.relayTeams(d.teamsFile).find((w) => w.team === team);
    const was = row ? String(row.syncNote || "") : "";
    Store.markRelay(d.teamsFile, team, { syncNote: note, syncStreak: streak });
    if (note !== was && typeof d.onSyncNote === "function") {
      try { d.onSyncNote(team); } catch { /* the line is kept; a listener does not stop the sync */ }
    }
  }
  function finishLook(team) {
    const n = looks.get(team);
    if (!n || !n.open) return;
    n.open = false;
    if (n.kinds.size === 0) {
      if (n.succeeded) { n.streak = 0; writeSyncNote(team, "", 0); }
      return;
    }
    let kind = "";
    if (n.kinds.has("team-size")) kind = "team-size";
    else if (n.kinds.has("out-of-step")) {
      n.streak += 1; /* plant:rs932-streak */
      kind = n.streak >= 3 ? "out-of-step-3" : "out-of-step";
    } else if (n.kinds.has("rate")) kind = "rate";
    else {
      for (const k of n.kinds) { kind = k; break; }
    }
    if (kind) writeSyncNote(team, kind, n.streak);
  }
  function armFinish(team, ch) {
    const n = lookOf(team);
    if (!ch || n.waiting) return;
    n.waiting = true;
    const gen = n.gen;
    ch.idle().then(() => {
      const cur = looks.get(team);
      if (!cur) return;
      cur.waiting = false;
      if (cur.gen !== gen || !cur.open) return;
      finishLook(team);
    }, () => { const cur = looks.get(team); if (cur) cur.waiting = false; });
  }
  function markHere(team) {
    const n = lookOf(team);
    if (!n.open) {
      const row = Store.relayTeams(d.teamsFile).find((w) => w.team === team);
      if (n.streak !== 0 || (row && row.syncNote)) { n.streak = 0; writeSyncNote(team, "", 0); }
      return;
    }
    n.succeeded = true;
    finishLook(team);
  }
  function teamOfCall(url, body) {
    const pathOnly = String(url).split("?")[0];
    const found = /\/t\/([0-9a-f]{32})(?:\/|$)/.exec(pathOnly);
    let rt = found ? found[1] : "";
    if (!rt && /\/teams$/.test(pathOnly)) {
      try {
        const j = JSON.parse(Buffer.from(body || []).toString("utf8"));
        if (j && /^[0-9a-f]{32}$/.test(String(j.rt || ""))) rt = String(j.rt);
      } catch { rt = ""; }
    }
    if (!rt) return "";
    const row = Store.relayTeams(d.teamsFile).find((w) => w.rt === rt);
    return row ? row.team : "";
  }
  function noteSyncRefusal(method, url, body, res) {
    if (!res || res.status === 200) return;
    let error = "";
    try {
      const j = JSON.parse(Buffer.from(res.bytes || []).toString("utf8"));
      error = j && typeof j.error === "string" ? j.error : "";
    } catch { error = ""; }
    const upload = method === "PUT" && /\/b\/[0-9a-f]{32}(?:$|\?)/.test(String(url).split("?")[0]);
    let kind = "";
    if (error === "team-size") kind = "team-size";
    else if (error === "rate") kind = "rate";
    else if (upload && SYNC_OUT.indexOf(error) >= 0) kind = "out-of-step";
    else {
      const statusReasons = Engine.relayRules().statusReasons;
      if (!error || !statusReasons.has(error)) {
        const status = Number.isSafeInteger(res.status) ? res.status : 0;
        const valid = typeof error === "string" && /^[a-z0-9-]{1,40}$/.test(error);
        kind = "refused:" + status + (valid ? ":" + error : "");
      }
    }
    const team = teamOfCall(url, body);
    if (!team) return;
    noteKind(team, kind);
  }
  function noteKind(team, kind) {
    const n = lookOf(team);
    if (!n.open) { beginLook(team); const c = channels.get(team); if (c) armFinish(team, c.ch); }
    n.kinds.add(kind); /* plant:rs932-note */
  }

  function channelFor(t) {
    let read = null;
    try { read = readKeyFile(d.keyFile); } catch { read = null; }
    if (!read) return null;
    const ch = leadChannel({ rt: t.rt, url: t.url, mirror: t.folder, team: t.team, lead: { keyId: read.keyId, public: read.public },
      open: () => { const x = opened(); return x ? x.open : null; },
      agree: (peer) => { const x = opened(); return x && x.box ? agreeFrom(x.box)(peer) : null; }, /* plant:rs-agree */
      box: () => { const x = opened(); return x && x.box ? x.box.public : ""; },
      keyFor: (e) => keysOf(t.team)[e] || null,
      onLapse: (l) => keepLapse(t.team, l, clock()), /* plant:g2s-heard */
      onHere: () => markHere(t.team),
      sealEpoch: () => mirrorEpoch(t.folder, d.teamsFile, t.team, read), /* plant:rs920-seal */
      inviteKeys: () => sealsFor(t.team, /\bat flush \(/.test(new Error().stack || "")), /* plant:rs-copies */ /* plant:rs914-open */
      bound: () => boundFor(t.team),
      onAsked: (writer, rec) => Store.markAsked(d.teamsFile, t.team, writer, rec),
      seat: d.seat, seatRenew: d.seatRenew, onSeat: d.onSeat ? (s) => d.onSeat(t.team, s) : undefined,
      request: relayCall, connect: d.connect, say: (l) => say("relay of team " + t.team + ": " + l), clock, watch: d.watch, pollMs: d.pollMs }); /* plant:s2-said */
    const rawKick = ch.kick.bind(ch);
    ch.kick = () => { beginLook(t.team); rawKick(); armFinish(t.team, ch); };
    return ch;
  }
  /* The team's channel as it should run now: one kept for another relay team id or another lead key is stopped, and one not
     running is made and started. {c, started}, `started` true where it was started here (its start runs a cycle), and c null
     where the signing key's file does not read. */
  async function openChannel(t) {
    let c = channels.get(t.team);
    const x = opened();
    const pub = x && x.open ? x.open.public : "";
    if (c && (c.rt !== t.rt || (pub && c.lead && c.lead !== pub))) { channels.delete(t.team); await c.ch.stop(); c = null; }
    if (c) return { c, started: false };
    const ch = channelFor(t);
    if (!ch) return { c: null, started: false };
    /* A space made again (remake): the channel starts over with the relay before its first cycle. */
    if (Store.relayTeams(d.teamsFile).some((w) => w.team === t.team && w.remade)) {
      ch.program.forgetRelay(); /* plant:rr-forget */
      Store.markRelay(d.teamsFile, t.team, { remade: false });
    }
    c = { ch, rt: t.rt, lead: pub }; channels.set(t.team, c); ch.start();
    armFinish(t.team, ch);
    return { c, started: true };
  }
  /* CAUGHT UP BEFORE THE LIST (relay finding 1, Studio's lead half; the test architect's condition of 2026-11-01 01:43). Two
     Studios on one lead key each read the roster from their own mirror, so the one that is behind would enrol a list that leaves
     out desks the other let in since. Before a list is posted, the team's channel runs one cycle, which catches up before it
     flushes, started here where it is not running, and the list is read from the team file as it then stands. A catch-up that
     does not finish (the relay not answering) still posts: the list carries the file it was read from, which the relay judges. */
  async function caughtUp(t) {
    let open = null;
    try { open = await openChannel(t); } catch { open = null; }
    if (!open || !open.c) return;
    try { open.c.ch.kick(); await open.c.ch.idle(); } catch { /* what was fetched before stands; the relay judges the list's file */ }
  }
  /* The team file in the mirror, where it is still this team's on the relay, or null. */
  async function relayTeamIn(t) {
    const tm = (await heldTeam(t.folder, { key: d.keyFile })).team;
    return tm && tm.channel && tm.channel.kind === "relay" && tm.channel.rt === t.rt ? tm : null;
  }
  const fileOf = (team) => ({ epoch: team.epoch, rev: team.rev });
  /* An invitation is let go once withdrawn or past its end, and a spent one once its desk has read its wrap or is no longer
     on the team: a desk taken off reads no team file written after (N1 of the slice 1 review). `offOnly` lets go only a spent
     one whose desk is off the team: the rest still open that desk's withdrawal for the enrol below (E4 of relay-life-h345). */
  function letGo(t, team, at, offOnly) {
    for (const i of Store.relayInvitesOf(d.teamsFile, d.vault, t.team, at)) {
      if (i.gone) continue;
      const read = i.state === "spent" && wrapRead(team, t.folder, i.desk); /* plant:rs-wrap-read */
      const off = i.state === "spent" && !onRoster(team, i.desk); /* plant:rs-off-roster */
      if (offOnly ? off : (i.state === "withdrawn" || i.state === "expired" || read || off)) {
        Store.markRelayInvite(d.teamsFile, t.team, i.id, { gone: true });
        if (i.state === "expired") Store.forgetInviteSecret(d.teamsFile, t.team, i.id); /* plant:s3-forget */
      }
    }
  }

  /* THE TEAM AFTER THE SWEEP (Claude alpha's ruling of 2026-10-25, option (b)). The relay answers a renewal not-enrolled only once it
     holds nothing of the team, its copy swept after the licence ended. With a grant that covers today, the space is made again under
     the same relay team id and lead key by the same signed create; the channel starts over with the relay at its next start, so the
     mirror's root, the latest edition and the team file among it, goes up again (sync, below); the roster as it stands is enrolled
     at once, so a desk still on it comes back by its kept key and one taken off meanwhile does not; each invitation still live is
     registered again. Nothing in the mirror or the project is removed. {ok, t} with the team's row as it now stands, or the refusal. */
  /* The lead the team file names: the one in this computer's mirror, or, when that file is not there yet, the copy this
     Studio kept, then the teams row. A refused create under another key than that one is another lead's team, not a place taken. */
  function leadRecorded(t) {
    const fromMirror = mirrorLead(t.folder);
    if (fromMirror) return fromMirror;
    const kept = Store.keptTeam(d.teamsFile, t.team);
    const fromKept = kept && kept.file && kept.file.lead ? String(kept.file.lead.public || "") : "";
    if (/^[0-9a-f]{64}$/.test(fromKept)) return fromKept;
    return /^[0-9a-f]{64}$/.test(String(t.lead || "")) ? String(t.lead) : "";
  }

  async function remake(t, call, grant, x) {
    /* Only under the key the team was made with: its desks hold that lead's key as the team's, and a space under another would
       be a team none of them follows. */
    const made = leadRecorded(t);
    if (made && made !== x.open.public) {
      Store.markRelay(d.teamsFile, t.team, { refusedLead: grant.lead });
      return { ok: false, reason: "lead", said: OTHER_LEAD_SAID };
    }
    /* Marked before the create is posted, each safe to repeat, so that whatever becomes of the create's answer (lost with a quit
       or a dropped connection after the relay made the space) the next sync enrols the roster, registers the live invitations
       again and starts the channel over. */
    Store.markRelay(d.teamsFile, t.team, { enrolled: "", remade: true }); /* plant:rr-early */
    for (const i of Store.relayInvitesOf(d.teamsFile, d.vault, t.team, call.t)) {
      if (!i.gone && i.state === "live" && i.registered) Store.markRelayInvite(d.teamsFile, t.team, i.id, { registered: false });
    }
    const c = channels.get(t.team);
    if (c) { channels.delete(t.team); await c.ch.stop(); }
    const r = await relaySpace(Object.assign({ grant, roots: d.roots }, call)); /* plant:rr-remake */
    if (!r.ok) {
      const named = leadRecorded(t);
      if (placeTaken(r) && named && named !== x.open.public) {
        Store.markRelay(d.teamsFile, t.team, { refusedLead: grant.lead });
        return { ok: false, reason: "lead", said: OTHER_LEAD_SAID };
      }
      return placeTaken(r) ? taken(t, grant) : r;
    }
    clearRevokedTracking(t.team); /* plant:rr-remake-tracking */
    /* The space made again holds no door, so the next sync posts it again where the lead still has one. */
    Store.markRelay(d.teamsFile, t.team, { created: true, granted: grant, lead: x.open.public, refusedLead: "", lapse: null, taken: false, grantKey: grantKeyOf(grant), revoked: false, revokedNone: false, door: "" });
    if (typeof d.onLapse === "function") { try { d.onLapse(t.team); } catch { /* the record is kept; a listener does not stop the sync */ } }
    return { ok: true, t: Store.relayTeams(d.teamsFile).find((w) => w.team === t.team) || t };
  }
  /* Whether the relay refused the lead's own create because another key holds the id: only by an answer in TAKEN_REASONS. Any other
     refusal, an outage or a wrong route among them, and no answer at all, is tried again at the next sync. */
  const placeTaken = (r) => !!r && TAKEN_REASONS.indexOf(r.reason) >= 0; /* plant:rr-taken-reasons */
  /* The team's place on the relay held by another key, at its first create (`first`) or at a remake: said once, kept with the end
     of the grant it was judged under, and nothing
     posted for the team again until a later grant is held or the lead asks (Check now). */
  function taken(t, grant, first) {
    Store.markRelay(d.teamsFile, t.team, { taken: true, takenUntil: grant && Number.isSafeInteger(grant.until) ? grant.until : 0, takenFirst: first === true }); /* plant:rr-taken */
    say("relay of team " + t.team + ": " + (first === true ? TAKEN_SAID_FIRST : TAKEN_SAID));
    if (typeof d.onLapse === "function") { try { d.onLapse(t.team); } catch { /* the record is kept; a listener does not stop the sync */ } }
    return { ok: true, team: false, taken: true };
  }

  /* THE STANDING DOOR (board 980, A4): the licence references a desk's seat certificate may name to ask to join with no invitation,
     posted while the lead is signed in (`d.doorRefs()`, its own licence's) and closed by an empty list once it is not. A Studio that
     never posted one posts nothing while it has none to post, so one that never signed in sends nothing new. The door taken is kept
     with the key that posted it, since a handover clears it at the relay. A refusal is said where the sync's are and asked again at
     the next sync; it stops nothing else. */
  async function keepDoor(t, call) {
    const C = Engine.relayRules().core;
    const want = typeof d.doorRefs === "function" ? [].concat(d.doorRefs() || []) : [];
    const refs = Array.from(new Set(want.map(String).filter((r) => /^[0-9a-f]{32}$/.test(r)))).sort().slice(0, C.DOOR_REFS_MAX);
    const now = call.open.public + ":" + refs.join(",");
    const was = typeof t.door === "string" ? t.door : "";
    if (now === was) return;
    if (!refs.length && !/:[0-9a-f]/.test(was)) return; /* plant:a4-door-never */
    const r = await postDoor(call, refs); /* plant:a4-door-post */
    if (r.ok) Store.markRelay(d.teamsFile, t.team, { door: now });
  }

  /* What the lead owes the relay for one team, in order: its space, the enrolled desks, the invitations, the head and the
     ring inside the team file. Answers {ok} or the first refusal; what is done is kept, so the next sync goes on from it. */
  async function duties(t) {
    const x = opened();
    if (!x) return { ok: false, reason: "key", said: "The signing key does not open on this computer, so the relay waits." };
    const call = { url: t.url, rt: t.rt, open: x.open, request: relayCall, t: Math.floor(clock()), seat: d.seat };
    const grant = readGrant(d.keyFile);
    const askAgain = asking || (!!grant && Number.isSafeInteger(grant.until) && grant.until > t.takenUntil);
    if (t.taken && !askAgain) return { ok: true, team: false, taken: true }; /* plant:rr-held */
    if (!t.created) {
      const list = typeof d.revokedKeys === "function" ? [].concat(await d.revokedKeys() || []) : [];
      const r = await relaySpace(Object.assign({ grant, roots: d.roots, revokedKeys: list }, call)); /* plant:rs-space */
      if (!r.ok) {
        if (r.reason === "revoked") {
          await meetRevoked(call.url + "/t/" + t.rt, JSON.stringify({ rt: t.rt }));
          return { ok: true, team: false, revoked: true };
        }
        /* Not marked made, and not retried as a place taken: the press that asked takes itself back and says this. */
        if (r.reason === "team-count") return { ok: false, reason: "team-count", said: TEAM_COUNT_SAID }; /* plant:rs932-count */
        /* Refused for its place: the team file here names another lead key (this one made again since), which is what the refusal
           says; otherwise another key holds the id, and the team is taken, as a remake's would be. */
        const made = mirrorLead(t.folder), other = !!made && made !== x.open.public;
        const named = leadRecorded(t);
        const restored = !made && !!named && named === x.open.public; /* plant:n1-unread-restored */
        /* N1 of the second computer: a mirror that names no lead yet is a computer that has not read the team from the relay, as a
           second computer of the lead whose own new key is not the one the team was made with. The place may be the lead's own,
           so it is not marked taken and not said as another key's; it is said as that, and the next sync, or Check now once the
           key's backup copy is restored, asks again. */
        if (placeTaken(r) && !made && !restored) return { ok: false, reason: "lead-unread", said: FIRST_UNREAD_SAID }; /* plant:n1-unread */
        if (placeTaken(r) && other) return { ok: false, reason: "lead", said: OTHER_LEAD_SAID };
        return placeTaken(r) ? taken(t, grant, true) : r; /* plant:rr-first-taken */
      }
      clearRevokedTracking(t.team);
      Store.markRelay(d.teamsFile, t.team, { created: true, granted: grant, lead: x.open.public, grantKey: grantKeyOf(grant), revoked: false, revokedNone: false, taken: false });
    } else if (owesGrant(t, grant) && grantRefusal(grant, x.open.public, call.t, d.roots) === null) { /* plant:rr-cover */
      /* A later grant the relay has not been given: posted before any other call, since a lapsed team takes none of them. */
      const r = await renewGrant(Object.assign({ grant }, call)); /* plant:g2s-post */
      if (r.ok) { /* plant:g2s-ok */
        clearRevokedTracking(t.team);
        Store.markRelay(d.teamsFile, t.team, { granted: grant, refusedLead: "", taken: false, grantKey: grantKeyOf(grant), revoked: false, revokedNone: false }); /* plant:g2s-granted */
        if (r.lapse) keepLapse(t.team, r.lapse, call.t); /* plant:g2s-taken */
      } else if (r.reason === "not-enrolled") { /* plant:rr-swept */
        const again = await remake(t, call, grant, x);
        if (!again.ok || again.taken) return again.reason === "revoked" ? { ok: true, team: false, revoked: true } : again;
        t = again.t;
      } else if (r.reason === "revoked") {
        const row = Store.relayTeams(d.teamsFile).find((w) => w.team === t.team);
        /* The fetch inside that renewal makes a swept space again, and the row it wrote is the one this pass enrols. */
        if (row && row.remade === true && row.revoked === false) t = row;
        else if (!row || row.revoked) return { ok: true, team: false, revoked: true };
      } else {
        /* Refused, and the grant names another key than the one the team was made with: the relay will refuse it every time, so it
           is held until the grant names another key, and said as what it is. Any other refusal is posted again at the next sync. */
        const made = leadRecorded(t);
        const other = r.reason === "bad-grant" && !!made && grant.lead !== made;
        if (other) Store.markRelay(d.teamsFile, t.team, { refusedLead: grant.lead }); /* plant:g2s-lead-mark */
        /* The relay's clock does not take the grant, or the team's id is now another key's: a create under this key tells the two
           apart, as the relay answers this lead's own team as made and refuses one another key holds. */
        if (!other && r.reason === "bad-grant") {
          const p = await relaySpace(Object.assign({ grant, roots: d.roots }, call)); /* plant:rr-probe */
          if (!p.ok && placeTaken(p)) {
            const named = leadRecorded(t);
            if (named && named !== x.open.public) {
              Store.markRelay(d.teamsFile, t.team, { refusedLead: grant.lead });
              say("relay of team " + t.team + ": " + OTHER_LEAD_SAID);
              return { ok: false, reason: "lead", said: OTHER_LEAD_SAID };
            }
            return taken(t, grant);
          }
          if (p.ok) {
            /* A repeat create answers 200 and leaves the grant in force, so the record is not moved onto the grant just posted. */
            clearRevokedTracking(t.team);
            Store.markRelay(d.teamsFile, t.team, { refusedLead: "", taken: false, revoked: false, revokedNone: false }); /* plant:pg-probe-keep */
          }
        }
        say("relay of team " + t.team + ": " + (other ? OTHER_LEAD_SAID : r.said)); /* plant:g2s-refused */
      }
    }
    const held = await heldTeam(t.folder, { key: d.keyFile });
    let team = held.team;
    if (!team || !team.channel || team.channel.kind !== "relay" || team.channel.rt !== t.rt) {
      if (team && team.channel && team.channel.kind === "folder") {
        const all = Store.relayInvitesOf(d.teamsFile, d.vault, t.team, call.t);
        const drop = all.filter((i) => i.gone && i.registered && !i.dropped && !(i.dropAfter > call.t)).map((i) => i.inv);
        if (drop.length) {
          const r = await invites(call, [], drop);
          if (!r.ok) return r;
          for (const inv of drop) {
            const i = all.find((v) => v.inv === inv);
            if (i) Store.markRelayInvite(d.teamsFile, t.team, i.id, { dropped: true });
          }
        }
      }
      return { ok: true, team: false };
    }
    /* A spent invitation whose desk is off the team file this computer holds is let go first, before any cycle of the channel
       below: the catch-up flushes, and a flush seals the team file's copy under every spent invitation not yet let go, so a desk
       taken off by an epoch move nobody marked would be handed what the lead wrote after its removal (rs11, the test
       architect's of 2026-11-01 20:23). The rest wait for the enrol, as a withdrawal is opened under its invitation's key. */
    letGo(t, team, call.t, true); /* plant:dfx-let-go */
    let keys = devicesOf(team), enrolled = sha256(JSON.stringify(keys));
    if (enrolled !== t.enrolled) {
      await caughtUp(t); /* plant:df-catch */
      const newest = await relayTeamIn(t);
      if (newest) { team = newest; keys = devicesOf(team); enrolled = sha256(JSON.stringify(keys)); }
    }
    if (enrolled !== t.enrolled) {
      let rev = Math.max(t.devicesRev + 1, call.t);
      let r = await enrol(call, keys, rev, fileOf(team)); /* plant:rs-enrol */
      /* A desk let in whose request was taken back at the relay first: the relay enrols no key of a withdrawn request and changes
         nothing in the set (E4 of relay-life-h345). That desk leaves the signed roster and its invitation is live again, so the
         rest are enrolled now and a later ask by the same invitation is let in as a first one. */
      if (!r.ok && r.reason === "withdrawn") {
        const off = await withdrawnOff(t, call, team); /* plant:e4s-withdrawn */
        if (off) {
          team = off; keys = devicesOf(team); enrolled = sha256(JSON.stringify(keys));
          rev += 1;
          r = await enrol(call, keys, rev, fileOf(team));
        }
      }
      /* Refused as read from an older team file than the relay's last list (or with a rev it has passed): another computer of
         the lead moved the roster on since this one caught up. It catches up once more and posts once more; refused again, it is
         said where the relay's other out-of-step refusals are, and the next sync posts again. */
      if (!r.ok && r.reason === "replay-rev") { /* plant:df-retry */
        await caughtUp(t);
        const newest = await relayTeamIn(t);
        if (newest) { team = newest; keys = devicesOf(team); enrolled = sha256(JSON.stringify(keys)); }
        rev = Math.max(rev + 1, Math.floor(clock()));
        r = await enrol(call, keys, rev, fileOf(team));
        if (!r.ok && r.reason === "replay-rev") noteKind(t.team, "out-of-step"); /* plant:df-said */
      }
      if (!r.ok) return r;
      Store.markRelay(d.teamsFile, t.team, { devicesRev: rev, enrolled });
    }
    /* Again on the team as it now stands: caught up, or with a withdrawn desk taken off. */
    letGo(t, team, call.t);
    /* An invitation whose refusal is still owed to its desk is not dropped until the sync has written the answer (board 922, E1). */
    const all = Store.relayInvitesOf(d.teamsFile, d.vault, t.team, call.t).map((i) => (i.owed ? Object.assign({}, i, { dropAfter: Infinity }) : i)); /* plant:s922-owed-held */
    const book = Store.inviteBookOf(d.teamsFile, d.vault);
    const teamKey = (keysOf(t.team) || {})[team.epoch];
    const add = all.filter((i) => !i.gone && i.token && !i.registered && i.state === "live")
      .map((i) => addRow(i, book, teamKey, t.rt, team)); /* plant:s3-add-wrap */
    /* A refused desk's invitation waits out its hold: the desk reads the lead's answer only while the relay holds it bound. */
    const drop = all.filter((i) => i.gone && i.registered && !i.dropped && !(i.dropAfter > call.t)).map((i) => i.inv); /* plant:s922-held */
    const wraps = resealOf(all, drop, book, teamKey, t.rt, team); /* plant:s3-reseal */
    const markDropped = (ids) => { for (const inv of ids) { const i = all.find((v) => v.inv === inv); Store.markRelayInvite(d.teamsFile, t.team, i.id, { dropped: true }); } };
    /* Drops go first in a call of their own wherever adds or reseals ride beside them: a team past its grant takes a drop-only call
       and refuses the rest, so letting an invitation go never waits on a renewal. */
    let alone = false;
    alone = drop.length > 0 && (add.length > 0 || wraps.length > 0); /* plant:rs987-drops-alone */
    let rest = drop;
    if (alone) {
      const r = await invites(call, [], drop);
      if (!r.ok) return r;
      markDropped(drop);
      rest = [];
    }
    if (add.length || rest.length || wraps.length) {
      const r = await invites(call, add, rest, wraps.length ? wraps : undefined); /* plant:rs-register */
      /* A refusal is not done: the drop is sent again at the next sync, so a withdrawn invitation's token does not stay live (board 914). */
      if (!r.ok) return r; /* plant:rs914-retry */
      for (const a of add) {
        const i = all.find((v) => v.inv === a.id);
        Store.markRelayInvite(d.teamsFile, t.team, i.id, a.wrap ? { registered: true, wrappedEpoch: team.epoch } : { registered: true });
      }
      for (const w of wraps) {
        const i = all.find((v) => v.inv === w.id);
        if (i) Store.markRelayInvite(d.teamsFile, t.team, i.id, { wrappedEpoch: team.epoch });
      }
      markDropped(rest);
    }
    /* The relay's word for each invitation still open, including one just registered. A read that fails leaves the last
       time. A used time of null does not wipe a time already kept. */
    const oweStates = all.some((i) => !i.gone && (i.registered || add.some((a) => a.id === i.inv)));
    if (oweStates) {
      try {
        const heard = await hearStates(call); /* plant:s3-states */
        if (Array.isArray(heard)) {
          for (const row of heard) {
            if (!row || typeof row !== "object") continue;
            const i = all.find((v) => v.inv === row.id);
            if (!i) continue;
            const patch = {};
            if (row.state === "unused" || row.state === "used" || row.state === "asked") patch.relayState = row.state;
            if (Number.isFinite(row.used)) patch.relayUsed = row.used;
            if (patch.relayState || Number.isFinite(patch.relayUsed)) Store.markRelayInvite(d.teamsFile, t.team, i.id, patch);
          }
        }
      } catch { /* the last time stays; a states read does not stop the sync */ }
    }
    await keepDoor(t, call);
    let now = team;
    const ring = ringIn(t.folder);
    if (ring && Engine.relayRules().channel.canon(ring) !== Engine.relayRules().channel.canon(team.ring || null)) {
      const secret = d.secret ? d.secret() : "";
      if (secret) {
        const canon = Engine.relayRules().channel.canon;
        now = (await teamWrite(t.team, () => rewriteTeam(t, secret,
          (fresh) => (canon(ring) === canon(fresh.ring || null) ? null : withChannel(fresh, fresh.channel, ring))))) || now;
      }
    }
    const stamp = rootStamp(t.folder) + "|" + now.epoch + "|" + now.rev;
    const unread = [];
    const editions = editionsLed(t.folder, now, keysOf(t.team), { unread });
    /* A head that names no edition is not written, so none is written until a catalog at the root publishes one; and where one
       stands and the team now leads no edition (its last catalog taken off, board 962 stage 6), it is deleted, and the channel owes
       the relay that deletion like any other root file's (headGone says when). The stamp is kept either way: the next change of
       that root is what writes. */
    if (call.t - t.headAt >= HEAD_MS || stamp !== t.headStamp) {
      if (unread.length && stamp !== t.headStamp)
        say("relay of team " + t.team + ": " + unread.length + " file(s) at the root did not open, or were not signed by this team's lead key, so the head keeps what it named for them");
      if (editions.length) writeWhole(path.join(t.folder, HEAD_NAME), JSON.stringify(headOf(x.open, now, call.t, editions), null, 1) + "\n"); /* plant:rs-head */
      else if (headGone(t.folder, now, keysOf(t.team))) { try { fs.unlinkSync(path.join(t.folder, HEAD_NAME)); } catch { /* none stood */ } } /* plant:rs-head-gone */
      Store.markRelay(d.teamsFile, t.team, { headAt: call.t, headStamp: stamp }); /* plant:rs9-keys */
    }
    return { ok: true, team: true };
  }

  /* WHOSE REQUEST THE RELAY HOLDS AS TAKEN BACK, read from the relay itself on the lead's own session: every blob it still serves,
     from the start of the team's sequence. A blob carrying `pub` is a desk's upload by its invitation, and the pin takes a deletion
     there only as that desk's own request taken back (admitWithdraw: the key the invitation's session bound, superseding the very
     request it asked with, the key not enrolled). So a desk whose newest such blob is a deletion has withdrawn and not asked again.
     The relay serves the deletion until its keep ends, the same keep that holds the key withdrawn, so this is found whatever order
     the watch, the channel and the book's dates met in, and whatever this Studio fetched or missed (G1 of the test architect's
     triage). The relay's "used" is never read as a withdrawal (H1). What the relay lists is only where to look: nothing is taken
     from it until the desk's own proof is read (proved, below). {session, metas}, `metas` a Map of desk key id to the header of
     that desk's newest such deletion as listed, or null where the relay does not answer. */
  async function withdrawalsAt(call) {
    const session = await leadSession(call);
    if (!/^[0-9a-f]{64}$/.test(session)) return null;
    const newest = new Map();
    let seq = 0;
    for (let round = 0; round < 1000; round++) {
      const r = await get(call.request, base(call.url) + "/t/" + call.rt + "/since/" + seq, { authorization: "Bearer " + session });
      if (r.status !== 200 || !Array.isArray(r.json)) return null;
      for (const e of r.json) {
        if (!e || !Number.isSafeInteger(e.seq) || !e.meta || typeof e.meta !== "object") continue;
        if (e.seq > seq) seq = e.seq;
        const m = e.meta;
        if (typeof m.pub === "string" && DESK_KEY.test(String(m.writer))) newest.set(String(m.writer), m); /* plant:e4s-evidence */
      }
      if (r.json.length < SINCE_PAGE) break;
    }
    return { session, metas: new Map(Array.from(newest).filter(([, m]) => m.del === true)) };
  }

  /* THE DESK'S OWN PROOF THAT IT TOOK ITS REQUEST BACK (H2 of the test architect's read of 4df646e). The signed roster is what
     keeps membership from resting on the relay, so a desk comes off it only on what the desk itself signed: the deletion's bytes,
     fetched, verified under the very key the roster holds for that desk (the header's `pub` must be that key, and the upload
     signature over the blob's own header fields and ciphertext must hold under it), and opened under a seal of an invitation the
     book binds to that desk, to read that it deletes that desk's own request, desks/<id>/join.json. Neither the listed `del` nor
     anything else the relay says counts: the signature does not cover `del`, so a request relabelled a deletion is read as the
     request it is. The deletion's signed `supersedes` must name the request that desk last asked with as this Studio fetched it
     (markAsked), so an old withdrawal served again after the desk asked anew is not taken, whatever the mirror holds since. And the
     request must be gone from the mirror the channel keeps, caught up before. True only on all of these. */
  /* The later of two asked records by (epoch, counter), the same forward-only rule markAsked keeps. */
  function laterAsked(a, b) {
    if (!a) return b || null;
    if (!b) return a;
    const aEpoch = Number(a.epoch) || 0, bEpoch = Number(b.epoch) || 0;
    if (bEpoch > aEpoch) return b;
    if (bEpoch === aEpoch && (Number(b.counter) || 0) > (Number(a.counter) || 0)) return b;
    return a;
  }

  async function proved(t, call, session, entry, m) {
    const B = Engine.relayRules().blob;
    const id = String(entry.desk.id), pub = String(entry.desk.key || "");
    if (m.writer !== id || m.pub !== pub || !/^[0-9a-f]{32}$/.test(String(m.id))) return false;
    /* Only a withdrawal of the request that desk last asked with, as this Studio fetched it signed: an older withdrawal served again
       after the desk asked anew supersedes an older request and takes no one off. */
    const asked = laterAsked(Store.askedOf(d.teamsFile, t.team, id), entry && entry.asked ? entry.asked : null); /* plant:sc-asked */
    if (!asked || m.supersedes !== asked.id) return false; /* plant:rp-supersedes */
    if (fs.existsSync(path.join(t.folder, "desks", id, "join.json"))) return false;
    const res = await call.request("GET", base(call.url) + "/t/" + call.rt + "/b/" + m.id, { authorization: "Bearer " + session });
    if (!res || res.status !== 200) return false;
    const ct = Buffer.from(res.bytes || []);
    const seals = Store.relayInvitesOf(d.teamsFile, d.vault, t.team, call.t).filter((i) => !i.gone && i.seal && (i.desk === id || (entry && entry.invite && i.id === entry.invite)));
    for (const i of seals) {
      const r = B.openBlob({ relayTeamId: call.rt, blob: { id: m.id, epoch: m.epoch, supersedes: m.supersedes == null ? null : m.supersedes,
        writerKeyId: id, counter: m.counter, nonce: m.nonce, signature: m.sig, ciphertext: ct },
        trust: { desks: [{ deskId: id, keyId: id, public: pub }] }, epoch: m.epoch, counters: {}, teamKey: i.seal });
      if (!r || !r.ok) continue; /* plant:e4s-signed */
      if (r.kind === "delete" && String(r.path).toLowerCase() === ("desks/" + id + "/join.json").toLowerCase()) return true; /* plant:e4s-proof */
    }
    return false;
  }

  /* THE DESKS WHOSE REQUEST WAS TAKEN BACK AT THE RELAY (E4 of relay-life-h345), after the relay refused a set that would enrol one
     of their keys as withdrawn; the refusal names no key. The channel is caught up first, so the withdrawal reaches the mirror where
     a seal still opens it. Then each desk on the roster the relay lists as withdrawn (withdrawalsAt) whose own proof holds (proved)
     is taken off the signed roster, at the same key number, since its key was never enrolled, and an invitation of the book still
     spent by that desk is live again
     with the same key, bound to the same desk; one past its own end is let go as any. Answers the team as written, or null where
     none is found, the relay does not answer, or the signing key does not open; the refusal then stands and the next sync asks
     again. */
  async function withdrawnOff(t, call, team) {
    const secret = d.secret ? d.secret() : "";
    if (!secret) return null;
    const c = channels.get(t.team);
    if (c) { try { c.ch.kick(); await c.ch.idle(); } catch { /* what was fetched before stands */ } }
    let held = null;
    try { held = await withdrawalsAt(call); } catch { held = null; }
    if (!held || !held.metas.size) return null;
    const off = [];
    const provedOf = async (e) => { try { return await proved(t, call, held.session, e, held.metas.get(e.desk.id)); } catch { return false; } };
    for (const e of team.roster || []) {
      if (e && e.desk && held.metas.has(e.desk.id) && await provedOf(e)) off.push(e.desk.id); /* plant:e4s-taken */
    }
    if (!off.length) return null;
    const written = await teamWrite(t.team, () => rewriteTeam(t, secret, (fresh) => {
      let next = fresh;
      for (const id of off) if ((next.roster || []).some((e) => e && e.desk && e.desk.id === id)) next = withoutDesk(next, id);
      return next === fresh ? null : next;
    }));
    if (!written) return null;
    const rows = Store.relayInvitesOf(d.teamsFile, d.vault, t.team, call.t).filter((i) => !i.gone && (i.state === "spent" || i.state === "live"));
    for (const id of off) {
      for (const i of rows) {
        if (i.desk === id) Store.reviveInvite(d.teamsFile, t.team, i.id); /* plant:e4s-revive */
        else if (team.roster && team.roster.some((e) => e && e.desk && e.desk.id === id && e.invite === i.id)) Store.reviveInvite(d.teamsFile, t.team, i.id, id); /* plant:sc-revive */
      }
      say("relay of team " + t.team + ": desk " + id + " took its request back at the relay, so it was not let in.");
    }
    return written;
  }

  /* The lead's answer to one desk's request, written on the team's own channel (the pinned channel's writeAnswer): `spec`
     {inv, deskId, deskBox, answer}, the lead's box added here from the key the channel agrees with. {ok: true}, or the
     channel's own refusal as it said it (replay-counter on a second write; the relay not answering). */
  async function answerOn(team, spec) {
    const c = channels.get(team), x = opened();
    if (!c || !x || !x.box) return { ok: false, reason: "channel", said: "The relay's channel for this team is not running, or the signing key does not open." };
    try {
      await c.ch.idle();
      return await c.ch.writeAnswer(Object.assign({}, spec, { leadBox: x.box.public })); /* plant:s922-write */
    } catch (e) { return { ok: false, reason: "fault", said: String(e && e.message || e) }; }
  }

  /* THE ANSWERS THE LEAD OWES (board 922, E1 of the test architect's verdict on the Studio half). A refusal whose answer the relay did
     not take at once is kept on its invitation's row, the invitation already withdrawn; this writes each when the relay is reached, and
     the hold on the invitation's drop counts from the write. An answer whose invitation has ended is let go: the relay no longer holds
     the desk bound to read it, and the invitation is then dropped as any other. */
  async function writeOwed(t) {
    for (const i of Store.relayInvitesOf(d.teamsFile, d.vault, t.team, clock())) {
      if (!i.owed) continue;
      if (!(Date.parse(String(i.expires || "")) > clock())) { Store.markRelayInvite(d.teamsFile, t.team, i.id, { answerOwed: null }); continue; } /* plant:s922-owed-end */
      const r = await answerOn(t.team, { inv: i.inv, deskId: i.owed.desk, deskBox: i.owed.box, answer: i.owed.answer });
      if (r && (r.ok === true || (r.reason === "replay-counter" && typeof r.floor !== "number"))) Store.markRelayInvite(d.teamsFile, t.team, i.id, { answerOwed: null, dropAfter: clock() + ANSWER_HOLD_MS }); /* plant:s922-replay */ /* plant:s922-floor */
    }
  }

  /* THE DOOR REQUESTS THE WATCH REFUSED (board 980, A4): each dropped at the relay by the lead's signed invites call, as an
     invitation is, which ends that request's session; a desk refused so asks again by a new request once it may. Each id is sent
     once while this runner runs, and a refusal is asked again at the next look. */
  const doorsDropped = new Set();
  async function dropDoors(team, ids) {
    const t = Store.relayTeams(d.teamsFile).find((w) => w.team === team), x = opened();
    if (!t || !x) return { ok: false, reason: "key", said: "The signing key does not open on this computer, so the relay waits." };
    const fresh = Array.from(new Set([].concat(ids || []).map(String).filter((i) => RT_RE.test(i) && !doorsDropped.has(team + "|" + i))));
    if (!fresh.length) return { ok: true, dropped: [] };
    const r = await invites({ url: t.url, rt: t.rt, open: x.open, request: relayCall, t: Math.floor(clock()) }, [], fresh); /* plant:a4-door-drop */
    if (r.ok) for (const i of fresh) doorsDropped.add(team + "|" + i);
    return r;
  }

  /* THE DOORS AT THE LICENCE SERVICE (board 980, the door-finding; Max, 2026-11-12 18:46 and 18:57): after each sync, the teams
     whose standing door this key holds open at the relay (`door`, which keepDoor posts only while the lead is signed in) are set at
     the service through d.serviceDoors, each {team, rt, url, keyId, box}, so that a desk the licence certifies is handed them and a
     new computer finds its team with no invitation. Set only when the set differs from the one the service last took in this run;
     once a run, at its first sync, where this key ever held a door (so a door closed while Studio was shut is cleared there), and
     never where it held none, so a Studio that never signed in sends nothing. A team ended or handed over leaves the set at the next
     sync, and the door closed at sign-out makes the empty set. A key whose id is not its canonical one (a chosen id) sets nothing,
     since the service takes no id but that. A refusal or no answer is quiet and asked again at the next sync.
     NO TEAM'S DOOR IS DROPPED FOR ANOTHER'S (Grok's review 9 of the relay member, finding 2, 2026-11-15). The service takes at most
     SERVICE_DOORS doors for one key and deletes the ones a set leaves out. A Studio leads at most MAX_TEAMS (src/team-store.mjs, 3),
     far inside that, but a restore adds the teams of a key backup without that cap (shell/main.js relaysBack), so past it the
     doors kept are the ones the service already took in this run, then the teams in the order this Studio came to hold them (the
     teams file's own order), never the order of their ids, where a new team sorting early took an old team's place. A door left
     out is said, once for each set left out, and it is set the moment a place frees. */
  let serviceDoorsTaken = null, serviceDoorsHeld = new Set(), serviceDoorsLeft = "";
  /* The doors the licence service takes in one lead's set (service/licence/core.mjs DOORS_PER_LEAD); tests/relay-studio.mjs rsm9c holds
     the two equal. */
  const SERVICE_DOORS = 16;
  const DOOR_URL_SHAPE = /^https:\/\/[a-z0-9.-]+(?::[0-9]{1,5})?(?:\/[A-Za-z0-9._~-]+)*\/?$/;
  async function keepServiceDoors() {
    if (typeof d.serviceDoors !== "function") return;
    const x = opened();
    if (!x || !x.box || x.open.keyId !== keyIdFor(x.open.public)) return; /* plant:sd-key-id */
    const teams = Store.relayTeams(d.teamsFile), mine = x.open.public + ":";
    const eligible = teams.filter((t) => t.created && !t.taken && !t.revoked && (!t.lead || t.lead === x.open.public)
      && t.door.startsWith(mine) && /:[0-9a-f]/.test(t.door) /* plant:sd-open */
      && t.url.length <= 256 && DOOR_URL_SHAPE.test(t.url)
      && doorRelayExact(t.url)) /* plant:rts-door */
      .map((t) => ({ team: t.team, rt: t.rt, url: t.url, keyId: x.open.keyId, box: x.box.public }));
    const ranked = eligible.filter((t) => serviceDoorsHeld.has(t.team)).concat(eligible.filter((t) => !serviceDoorsHeld.has(t.team))); /* plant:m9-doors-held */
    const doors = ranked.slice(0, SERVICE_DOORS).sort((a, b) => (a.team < b.team ? -1 : a.team > b.team ? 1 : 0));
    const left = ranked.slice(SERVICE_DOORS).map((t) => t.team).sort();
    const leftSaid = "the licence service keeps the doors of at most " + SERVICE_DOORS + " teams for one signing key, so the door of team "
      + left.join(", team ") + " is not set there and a new computer finds it only by an invitation; it is set once another team's door closes";
    if (left.join(",") !== serviceDoorsLeft) {
      serviceDoorsLeft = left.join(",");
      if (left.length) say(leftSaid); /* plant:m9-doors-said */
    }
    const now = mine + JSON.stringify(doors);
    if (now === serviceDoorsTaken) return; /* plant:sd-once */
    if (serviceDoorsTaken === null && !doors.length && !teams.some((t) => t.door.startsWith(mine))) return; /* plant:sd-never */
    let r = null;
    try { r = await d.serviceDoors(doors); } catch { r = null; }
    if (r && r.ok === true) { serviceDoorsTaken = now; serviceDoorsHeld = new Set(doors.map((t) => t.team)); } /* plant:sd-taken */
  }

  /* `o.askTaken`: a team marked taken is asked again at this sync (Check now). */
  let asking = false;
  async function sync(o) {
    muted.clear();
    asking = !!(o && o.askTaken); /* plant:rr-ask */
    const teams = Store.relayTeams(d.teamsFile), want = new Set(teams.map((t) => t.team)), out = [];
    for (const [team, c] of Array.from(channels)) if (!want.has(team)) { channels.delete(team); await c.ch.stop(); }
    for (const t of teams) {
      /* A TEAM THIS BUILD DOES NOT REACH (Max, 2026-11-13 10:26, on the test service build's relay): nothing is called for it, no
         channel runs and no door is set for it (keepServiceDoors), and the Desks screen says so (syncNote "elsewhere", the
         copywriter's words); its record, key and mirror are left as they are (tests/relay-studio.mjs rts1). A team this build
         reaches drops that line at once, whatever its look then brings. */
      if (!relayReached(t.url)) { /* plant:rts-elsewhere */
        const held = channels.get(t.team);
        if (held) { channels.delete(t.team); await held.ch.stop(); }
        if (t.syncNote !== "elsewhere") { writeSyncNote(t.team, "elsewhere", 0); say("relay of team " + t.team + ": its relay is not one this build reaches, so nothing is sent for it"); }
        out.push({ team: t.team, ok: false, reason: "elsewhere" });
        continue;
      }
      if (t.syncNote === "elsewhere") writeSyncNote(t.team, "", 0); /* plant:rts-elsewhere-clear */
      try { fs.mkdirSync(t.folder, { recursive: true }); } catch (e) { say("the relay's mirror " + t.folder + " could not be made - " + e.message); continue; }
      beginLook(t.team);
      let r;
      try { r = await duties(t); } catch (e) { r = { ok: false, reason: "fault", said: String(e && e.message || e) }; }
      if (!r.ok) say("relay of team " + t.team + ": " + r.said);
      const c = channels.get(t.team);
      /* A team whose place another key holds runs no channel. */
      if (r.taken || r.reason === "lead-unread" || r.reason === "team-count") { if (c) { channels.delete(t.team); await c.ch.stop(); } out.push(Object.assign({ team: t.team }, r)); continue; }
      const open = await openChannel(t);
      if (open.c && !open.started) { open.c.ch.kick(); armFinish(t.team, open.c.ch); }
      if (Store.relayInvitesOf(d.teamsFile, d.vault, t.team, clock()).some((i) => i.owed)) /* plant:s922-owed-sync */
        await writeOwed(t).catch((e) => say("relay of team " + t.team + ": an owed answer could not be written - " + String(e && e.message || e)));
      out.push(Object.assign({}, r, { team: t.team }));
    }
    await keepServiceDoors();
    return out;
  }

  return {
    sync,
    channel: (team) => (channels.has(team) ? channels.get(team).ch : null),
    idle: async () => { for (const c of channels.values()) await c.ch.idle(); },
    answer: answerOn,
    dropDoors,
    /* What the relay says now of the invitation `inv` of `team`: "unused", "used" or "asked", or null where it does not say. */
    heardState: async (team, inv) => {
      try { /* a team not on the relay, a key that does not open, a relay that does not answer: no word */
        const t = Store.relayTeams(d.teamsFile).find((w) => w.team === team), x = opened();
        const rows = await hearStates({ url: t.url, rt: t.rt, open: x.open, request: relayCall, seat: d.seat });
        const row = Array.isArray(rows) ? rows.find((r) => r && r.id === inv) : null;
        return row && (row.state === "unused" || row.state === "used" || row.state === "asked") ? row.state : null;
      } catch { return null; }
    },
    request: relayCall,
    stopTeam: async (team) => { const c = channels.get(team); if (c) { channels.delete(team); await c.ch.stop(); } },
    stop: async () => { const all = Array.from(channels.values()); channels.clear(); for (const c of all) await c.ch.stop(); },
  };
}

/* The ring a publish wrote at the mirror's root, as a document, or null: on the relay it rides inside the signed team file,
   and the desks read no ring beside it. */
function ringIn(folder) {
  try {
    const g = JSON.parse(fs.readFileSync(ringPath(folder), "utf8").replace(/^﻿/, ""));
    return g && typeof g === "object" && !Array.isArray(g) && Array.isArray(g.keys) ? g : null;
  } catch { return null; }
}

/* ONE CATCH-UP BEFORE A MOVE THAT DROPS A DESK (board 911). The channel has no separate catch-up call: kick runs one
   cycle, which catches up before it flushes, and idle waits until that cycle is done. Where that catch-up finished,
   what the desk stored while trusted is in the mirror before the epoch moves. Where it did not (no session, a listed file
   the channel still holds at idle, the last since page not 200 or not short, or a blob served as anything but 200, 404 or
   410, wherever it stands in the kick), the move is not held, and the lead is told
   that the statistics may leave out what the desk sent since Studio last caught up with it. A listed blob answered 401
   is not judged by that 401: the channel reopens the session and asks again, and that retried call is the answer. */
const CATCH_UP_SAID = "Studio is offline, so the statistics may leave out what this teammate sent since Studio last caught up with it.";
const CATCH_UP_SAID_PL = "Studio nie ma połączenia, więc w statystykach może zabraknąć tego, co przyszło od tego członka zespołu, odkąd Studio ostatnio pobrało jego dane.";
/* The GET of this blob after a 401. authed reopens the session and asks once more; the calls between the 401 and that
   GET are the reopen. A since page or a different blob is not the retry, and no retry means the blob was not served. */
function blobRetried(list, i, blobId) {
  let j = i;
  while (j < list.length) {
    const r = list[j], ru = String(r && r.url || "");
    const isGet = !!(r && r.method === "GET");
    const isBlob = isGet && /\/b\/[0-9a-f]{32}$/.test(ru);
    const isSince = isGet && /\/since\/\d+$/.test(ru);
    if (isSince || (isBlob && !ru.endsWith("/b/" + blobId))) return { call: null, next: i };
    j += 1;
    if (isBlob) return { call: r, next: j };
  }
  return { call: null, next: i };
}
/* Whether the calls of one kick are a catch-up that did not finish, in whatever order the channel made them: nothing here
   leans on a blob's GET following its list entry, since the pinned channel holds a desk's listed file and fetches it once
   the list is read (channel.cjs catchUp, landLater). Every GET of a blob whose answer, after a 401's retry, is not 200, 404
   or 410 is a miss wherever it stands; the last since page must be answered 200 with a list, so a page refused with no good
   page after it is a miss; and that last page must be short. A kick whose calls were not noted is a miss. */
function catchUpMissed(calls) {
  if (!Array.isArray(calls)) return true;
  let last = null;
  for (let i = 0; i < calls.length; i++) {
    const c = calls[i], url = String(c && c.url || "");
    if (!(c && c.method === "GET")) continue;
    if (/\/since\/\d+$/.test(url)) { last = c; continue; }
    const blob = /\/b\/([0-9a-f]{32})$/.exec(url);
    if (!blob) continue;
    const answered = c.status === 401 ? blobRetried(calls, i + 1, blob[1]).call : c;
    if (!answered || (answered.status !== 200 && answered.status !== 404 && answered.status !== 410)) return true; /* plant:rs-catch-closed */
  }
  return !last || last.status !== 200 || !Array.isArray(last.json) || last.json.length >= SINCE_PAGE;
}
/* Whether the channel still holds, at idle, a file the relay listed and the mirror lacks: one a catch-up page held for the
   list's end (program.later(), let go only once it landed, was refused, or the relay said it is gone) or a handover held so
   (program.ahead()). The wire cannot show such a file: it may have had no fetch in this kick, or one answered 200 without
   its description (channel.cjs landLater, its stay). A channel that cannot say is taken as holding one. */
function heldAtIdle(ch) {
  const p = ch && ch.program;
  if (!p || typeof p.later !== "function" || typeof p.ahead !== "function") return true;
  const later = p.later(), ahead = p.ahead();
  return !Array.isArray(later) || !Array.isArray(ahead) || later.length > 0 || ahead.length > 0;
}
async function catchUpBeforeMove(runner, teamId) {
  const ch = runner && typeof runner.channel === "function" ? runner.channel(teamId) : null;
  const offline = { ok: false, offline: true, said: CATCH_UP_SAID, saidPl: CATCH_UP_SAID_PL };
  if (!ch) return offline;
  const note = catchNotes.get(ch);
  if (note) { note.seen = []; note.on = true; }
  ch.kick(); /* plant:rs-catch-before */
  await ch.idle();
  const seen = note ? note.seen.slice() : null;
  if (note) note.on = false;
  if (heldAtIdle(ch)) return offline; /* plant:rs-catch-idle */
  const ran = ch.online() && !catchUpMissed(seen); /* plant:rs-catch-held */
  if (!ran) return offline; /* plant:rs-catch-offline */
  return { ok: true, offline: false };
}

/* ---- THE LEAD'S ANSWER TO A DESK THAT ASKED BY A RELAY INVITATION (board 922, Studio's half) -----------------------------
 * A desk that joins by a relay invitation uploads its one request and from then on reads only the lead's answer to it, by the
 * invitation's id, sealed to its box (the pinned channel's pullAnswer). Nothing else of the team reaches it until its key is
 * enrolled. So the lead answers each request it settles: "refused" when it refuses, "joined" when the watch lets the desk in.
 * A request that came by no relay invitation is not answered here, and nothing about it changes.
 *
 * ON A REFUSAL the invitation is withdrawn in the book at once, whatever the relay does, and the answer is written; one the relay
 * did not take is kept owed on the invitation's row, and the runner's sync writes it when the relay is reached (writeOwed). The
 * invitation's drop is sent by the lead's signed call at the next sync, held back for ANSWER_HOLD_MS, the week an invitation is good
 * for, counted from the write: the relay ends the desk's read the moment the invitation is dropped, so a drop sent with the answer
 * would leave a desk that polls once a minute, or is away for a weekend, waiting for ever. A refusal is answered only for a request
 * that proves a live invitation of this Studio's: a colleague's request that names another's invitation with a proof that fails is a
 * forgery, and refusing it must not use up the real invitation's one answer or drop it.
 *
 * A REFUSED DESK THAT USED ITS INVITATION HOLDS THE TEAM'S KEY (Q1, Claude alpha's ruling of 2026-10-20 07:47): it opened the wrap on
 * yes. So a refusal of a desk whose invitation the relay reports used marks the row for the one confirm of Cancel
 * (studio:invite-cancel), which then moves the team to a new key as it does for a cancelled used invitation; the reply says so in
 * `move`. One the relay reports unused moves nothing.
 *
 * ON AN ADMISSION the answer is written before the desk's key is enrolled, and the invitation is not dropped: enrolment ends
 * the invitation's session, and the existing path lets the invitation go once its desk has read its wrap.
 *
 * Where no answer can be written at once (no runner, the relay not answering) the caller says so to the lead, in the sentence below. */
const ANSWER_HOLD_MS = INVITE_DAYS * 24 * 60 * 60 * 1000;
const ANSWER_UNSENT = "The refusal stands. The relay did not take the answer, so Studio will send it when it next reaches the relay, and the teammate is told then.";
const ANSWER_UNSENT_PL = "Odmowa pozostaje w mocy. Przekaźnik nie przyjął odpowiedzi, więc Studio wyśle ją, gdy następnym razem połączy się z przekaźnikiem, a członek zespołu dowie się o niej wtedy.";

/* Whether the desk used the invitation `row`, as the relay reports it: asked of the relay now, and where it does not answer, its last
   word the book kept. False only where the relay says unused; a request is here, so an invitation the relay was never heard on is
   taken as used. */
async function usedAt(runner, team, row) {
  let heard = null;
  if (runner && typeof runner.heardState === "function") { try { heard = await runner.heardState(team, row.inv); } catch { heard = null; } } /* plant:s922-fresh */
  if (heard === "used" || heard === "asked") return true;
  if (heard === "unused") return false;
  return row.relayState !== "unused";
}

/** The answer `o.answer` ("refused" or "joined") to desk `o.desk`'s request in `o.folder`, the mirror of the relay team `o.team`
 *  (the book's team id), on `runner`'s channel: `o` {teamsFile, vault, team, folder, desk, answer, now}. {ok: true, none: true}
 *  where this is not a request that came by one of this team's relay invitations, or not one to answer; {ok: true, answered,
 *  inv} once the channel took it; {ok: false, reason, said, saidPl} where it did not. A refusal also answers `id`, the book's id of
 *  the invitation, and `move`, whether the desk used the invitation, so that the team is to move to a new key on the one confirm;
 *  `runner` may be null, and the refusal is then owed. */
async function answerJoin(runner, o) {
  const x = o || {}, answer = x.answer === "joined" || x.answer === "refused" ? x.answer : "";
  const none = { ok: true, none: true };
  if (!answer || (answer === "joined" && (!runner || typeof runner.answer !== "function"))) return none; /* plant:s922-runner */
  if (!Store.relayTeams(x.teamsFile).some((w) => w.team === x.team)) return none;
  const ask = relayAsk(x.folder, x.team, x.desk);
  if (!ask) return none;
  const now = Number.isFinite(x.now) ? x.now : Date.now();
  const row = Store.relayInvitesOf(x.teamsFile, x.vault, x.team, now).find((i) => i.id === ask.inviteId);
  if (!row || row.dropped) return none;
  if (answer === "joined") {
    /* The invitation the watch just spent for this very desk (src/team-store.mjs endInvite records it). */
    if (row.desk !== ask.deskId) return none;
  } else {
    /* Only a request that proves the invitation's secret; the book is read here, at the call. */
    if (inviteState(ask.doc, { id: x.team }, Store.inviteBookOf(x.teamsFile, x.vault), now) !== "valid") return none; /* plant:s922-valid */
  }
  const spec = { inv: row.inv, deskId: ask.deskId, deskBox: ask.deskBox, answer: answer };
  if (answer === "joined") {
    const j = await runner.answer(x.team, spec);
    if (!j || j.ok !== true) return { ok: false, reason: j && j.reason ? String(j.reason) : "fault" };
    return { ok: true, answered: "joined", inv: row.inv };
  }
  const used = await usedAt(runner, x.team, row); /* plant:s922-used */
  /* Withdrawn in the book at once, whatever the relay does, and the answer kept owed on the row until it is written. */
  Store.endInvite(x.teamsFile, x.team, row.id, "withdrawn", undefined, now);
  Store.markRelayInvite(x.teamsFile, x.team, row.id, { gone: true, answerOwed: { desk: ask.deskId, box: ask.deskBox, answer: "refused" } }); /* plant:s922-owed */
  if (used) Store.markRelayInvite(x.teamsFile, x.team, row.id, { pendingMove: true }); /* plant:s922-move */
  const r = runner && typeof runner.answer === "function" ? await runner.answer(x.team, spec) : null;
  const out = { id: row.id, inv: row.inv, move: used };
  if (!r || r.ok !== true) return Object.assign(out, { ok: false, reason: r && r.reason ? String(r.reason) : "fault", said: ANSWER_UNSENT, saidPl: ANSWER_UNSENT_PL });
  const after = now + ANSWER_HOLD_MS; /* plant:s922-hold */
  Store.markRelayInvite(x.teamsFile, x.team, row.id, { gone: true, answerOwed: null, dropAfter: after }); /* plant:s922-drop */
  return Object.assign(out, { ok: true, answered: "refused" });
}

/** "joined" for each desk the watch has just let in: `o` as answerJoin's, with `spent` the admission's pairs ({invite, desk}),
 *  each invitation already ended as spent by its desk. The refusals, with each one's reason, in a list; empty where all went. */
async function answerAdmitted(runner, o) {
  const x = o || {}, refused = [];
  for (const s of Array.isArray(x.spent) ? x.spent : []) {
    const r = await answerJoin(runner, Object.assign({}, x, { desk: s && s.desk, answer: "joined" })); /* plant:s922-joined */
    if (r && r.ok === false) refused.push(r);
  }
  return refused;
}

/** "joined" for each desk the watch let in at the team's standing door (board 980, A4): `o` {team, doors}, `doors` watchAdmit's
 *  ({desk, door, box}), each answer written at the relay's id its request named, sealed to the box it signed, as an invitation's.
 *  Nothing is dropped: enrolment ends that request's session. The refusals, each with its reason; empty where all went. */
async function answerDoors(runner, o) {
  const x = o || {}, refused = [];
  if (!runner || typeof runner.answer !== "function") return refused;
  for (const g of Array.isArray(x.doors) ? x.doors : []) {
    if (!g || !RT_RE.test(String(g.door)) || !DESK_KEY.test(String(g.desk)) || !/^[0-9a-f]{64}$/.test(String(g.box))) continue;
    const r = await runner.answer(x.team, { inv: String(g.door), deskId: String(g.desk), deskBox: String(g.box), answer: "joined" }); /* plant:a4-door-joined */
    if (!r || r.ok !== true) refused.push({ ok: false, reason: r && r.reason ? String(r.reason) : "fault", desk: String(g.desk) });
  }
  return refused;
}

export { postDoor, answerDoors, RELAY_URL, NEW_TEAMS_URL, HEAD_NAME, HEAD_MS, RING_FILE, GRANT_FILE, NO_GRANT_SAID, GRANT_SAID, relayId, relayInvite, agreeFrom, leadOpened, relaySpace, grantFileOf, readGrant,
  grantRefusal, devicesOf, enrol, headOf, headGone, leadChannel, listedMetas, ringIn, editionsLed,
  relayRunner, wrapRead, catchUpBeforeMove, invites as leadInvites, invitesSignedBytes, cancelInvitation, noteCancel,
  answerJoin, answerAdmitted, ANSWER_HOLD_MS, ANSWER_UNSENT, ANSWER_UNSENT_PL, lapseRead, lapseOfHeader, owesGrant, renewGrant, handoverLead, leadSession, isDefiniteRefusal,
  HANDOVER_GONE_SAID, HANDOVER_NOGRANT_SAID, HANDOVER_COUNT_SAID, HANDOVER_CATCHALL_SAID, HANDOVER_OLD_KEY_SAID, handoverNeedsOldKey, lapseStep, OTHER_LEAD_SAID, TAKEN_SAID, TAKEN_SAID_FIRST, TAKEN_REASONS, REVOKED_SAID, REVOKED_NONE, FIRST_UNREAD_SAID, TEAM_COUNT_SAID,
  REVOKED_HOUR_MS, REVOKED_RETRY_MS };
