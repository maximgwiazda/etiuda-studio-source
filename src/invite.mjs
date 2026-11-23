/* AN INVITATION TO A TEAM THIS STUDIO LEADS, ON THE LEAD'S SIDE (board 885, S2).
 *
 *     import { makeInvite, inviteState, newSecret, INVITE_DAYS } from "./src/invite.mjs";
 *
 * WHAT A DESK TAKES IS THE PINNED SHELL'S. The blob is "etiuda-join:" and base64url of {team, folder, lead {keyId, public,
 * name}, secret}, the shape the desk's inviteRead reads; the id and the proof are the desk's own inviteIdOf and
 * memberProof (src/engine.mjs inviteRules); no check code is made, the desk asks for none. Studio keeps no second copy of any of them: a blob is read back
 * by the desk's reader before it is handed to anyone, and one the desk would read otherwise is refused here.
 *
 * THE SECRET IS A BEARER CREDENTIAL until it is spent: anyone holding the blob can make a valid proof for a desk of their
 * own (the test architect's verdict on the engine's join-invite, R4). So each invitation lets one desk in, it ends after
 * INVITE_DAYS, and the secret is kept only sealed by the vault (src/team-store.mjs), never in the page and never on the
 * share. A request that proves one joins with nobody pressing anything (Claude alpha's ruling of 2026-10-13 11:30: issuing
 * it through the organisation's channel is the lead's consent), and the Desks screen then shows the desk among the members
 * by invitation, where Remove, with a new team key, undoes it.
 *
 * WHY SEVEN DAYS. The blob travels through the organisation's own mail or chat and is pasted once. A week covers a weekend
 * and a message left unread for a few working days; past that, a blob found later in a mailbox or a chat log is dead, and
 * the lead makes another in one press, which costs nothing. */
import crypto from "node:crypto";
import * as Engine from "./engine.mjs";
import { refuse } from "./refusal.mjs";
import { teamsFile, studioTeammates, MAX_TEAMMATES, REFUSAL_TEAMMATES_LIMIT, REFUSAL_TEAMS_UNREADABLE } from "./team-store.mjs";
import { hintOf } from "./desk-seat.mjs";

const INVITE_PREFIX = "etiuda-join:";
const INVITE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
const NAME_MAX = 120;

/** A fresh secret: 128 bits, as 32 lower-case hex characters. */
function newSecret() {
  return crypto.randomBytes(16).toString("hex");
}

/* The lead's name as a desk's confirm will show it: the characters the desk's reader refuses in a name (its own
   INVITE_HIDDEN_RE, and the control characters) taken out, runs of space made one, at most 120. */
function shownName(name) {
  const hidden = new RegExp(Engine.inviteRules().INVITE_HIDDEN_RE.source, "g");
  const plain = Array.from(String(name == null ? "" : name).replace(hidden, ""))
    .map(c => (c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127 ? " " : c)).join("");
  return plain.replace(/\s+/g, " ").trim().slice(0, NAME_MAX).trim();
}

/** The invitation to `target` ({team, folder, lead: {keyId, public}}, as inviteTarget in src/studio.mjs answers it) under
 *  `secret`, naming the lead `name`, made at `now`: {blob, link, id, code, name, made, expires}. The blob is read back by the
 *  pinned desk's inviteRead (on this system's kind of path unless `posix` says otherwise) and must give back the same
 *  team, folder, lead and secret, or nothing is made. Nothing is written. `link` is https://etiuda.dev/join# and the
 *  same document, so the secret stays in the fragment. The blob stays etiuda-join: which is what a pasted invitation is. No invitation
 *  is made for a team kept for a shared folder (the folder team's removal): without `relay` nothing is made.
 *
 *  ON THE RELAY (board 900, the protocol's section 7) `relay` is {rt, url, token, inv}: the relay team id and the relay's
 *  address in place of the folder, the token whose sha256 the lead registers with the relay and the relay's id for the
 *  invitation, the desk's half reading {rt, url, token, inv}. The folder is then not written at all, as the desk refuses an
 *  invitation naming both, and the read back must give the same four. It carries the lead's box too, where the target names
 *  one (`lead.box`, the team file's own), so a desk admitted while away finds its own copy of the team file by it before it
 *  holds any team file (the desk's F6; N2 of the slice 1 review).
 *
 *  THE SIGN-IN HINT (board 980, stage 3): where the target names one (`signin`, src/desk-seat.mjs hintFor, from a lead that
 *  signed in), the invitation carries it, so a desk knows before its one request, and before it can read the team file, that
 *  the team admits by sign-in and with which provider (Argon 2's remedy). A pin that does not yet read it still accepts the
 *  blob, as with a place; one that reads it must give it back the same. */
function makeInvite(target, name, secret, now, posix, relay) {
  const t = target || {}, r = relay || null;
  if (!r || typeof r !== "object") throw refuse("There is no team here led from this Studio, so nobody can be invited.");
  const tf = t.teamsFile || (t.userData ? teamsFile(t.userData) : "");
  if (tf) {
    const tm = studioTeammates(tf, { now });
    if (!tm.ok && tm.unreadable) throw refuse(REFUSAL_TEAMS_UNREADABLE);
    if (tm.count >= MAX_TEAMMATES) throw refuse(REFUSAL_TEAMMATES_LIMIT);
  }
  const I = Engine.inviteRules();
  const lead = t.lead || {};
  const doc = { team: String(t.team || ""), relay: { rt: String(r.rt || ""), url: String(r.url || ""), token: String(r.token || ""), inv: String(r.inv || "") } }; /* plant:rs-invite-relay */
  doc.lead = { keyId: String(lead.keyId || ""), public: String(lead.public || ""), name: shownName(name) };
  if (/^[0-9a-f]{64}$/.test(String(lead.box || ""))) doc.lead.box = String(lead.box); /* plant:rs-invite-box */
  doc.secret = String(secret || "");
  const hint = t.signin ? hintOf(t.signin) : null;
  if (hint) doc.signin = hint; /* plant:s3-invite-hint */
  const payload = Buffer.from(JSON.stringify(doc), "utf8").toString("base64url");
  const blob = INVITE_PREFIX + payload;
  const link = "https://etiuda.dev/join#" + payload; /* plant:s3-link */
  const back = I.inviteRead(blob, posix === undefined ? process.platform !== "win32" : posix === true);
  const relayBack = !!back && !!back.relay && back.relay.rt === doc.relay.rt && back.relay.url === doc.relay.url
    && back.relay.token === doc.relay.token && back.relay.inv === doc.relay.inv;
  /* A reader that gives the hint back gives it as the hint or as its providers alone (the desk's inviteRead of stage 3 does the
     latter); either way they are the providers written, or nothing is made. */
  const backHint = back && back.signin !== undefined ? (Array.isArray(back.signin) ? back.signin : back.signin && back.signin.providers) : undefined;
  const hintOk = backHint === undefined || JSON.stringify(backHint) === JSON.stringify(doc.signin ? doc.signin.providers : undefined);
  if (!back || back.team !== doc.team || (back.folder !== undefined && back.folder !== "") || back.secret !== doc.secret || !relayBack
    || back.lead.keyId !== doc.lead.keyId || back.lead.public !== doc.lead.public || back.lead.name !== doc.lead.name
    || String(back.lead.box || "") !== String(doc.lead.box || "") || !hintOk)
    throw refuse("A desk would read {FOLDER} differently from how it is written here, so no invitation was made.", { FOLDER: doc.relay.url });
  const at = new Date(now == null ? Date.now() : now);
  if (!Number.isFinite(at.getTime())) throw new Error("an invitation is made at a time, and none was given");
  return { blob, link, id: I.inviteIdOf(doc.secret), name: doc.lead.name,
           made: at.toISOString(), expires: new Date(at.getTime() + INVITE_DAYS * DAY_MS).toISOString() };
}

/** Which form of an invitation `clipText` gives for `form`: "link" where the invitation has an https link and `form` is
 *  not "text", otherwise "text". */
function clipForm(made, form) {
  return form !== "text" && made && typeof made.link === "string" && made.link !== "" ? "link" : "text";
}

/** What goes on the clipboard. The https link is the default for a relay team, since the join page it opens is online with
 *  the relay (Maxim, 2026-10-20 10:53: "Why as text? I will want to test all kind of invitations/connections"); `form` "text"
 *  asks for the etiuda-join: text, which a person pastes in Etiuda. */
function clipText(made, form) {
  if (!made || typeof made.blob !== "string") return "";
  if (clipForm(made, form) === "text") return made.blob;
  return made.link; /* plant:s3-clip */
}

/** Where a request's invitation stands for `team` (a team file as held, its roster read for an invitation already used),
 *  by the book of this Studio's invitations ({id: {team, state, expires, secret}}, src/team-store.mjs inviteBookOf), at
 *  `now`: "" where the request carries none; "valid" where its id names a live invitation of this team and its proof is
 *  the pinned memberProof of that invitation's secret over the request's commitment; otherwise why not: "unknown" (no
 *  invitation of this Studio's, or one whose secret is not here), "other" (another team's), "spent", "withdrawn",
 *  "expired", or "proof" (made under another secret, or over another commitment). */
function inviteState(doc, team, book, now) {
  if (!doc || doc.invite === undefined) return "";
  const inv = doc.invite, id = inv && typeof inv === "object" ? String(inv.id || "") : "";
  const b = id && book && typeof book === "object" && Object.prototype.hasOwnProperty.call(book, id) ? book[id] : null;
  if (!b || typeof b !== "object") return "unknown";
  if (!team || b.team !== team.id) return "other";
  if (b.state === "spent" || ((team.roster || []).some(e => !!e && e.invite === id))) return "spent";
  if (b.state === "withdrawn") return "withdrawn";
  const when = now == null ? Date.now() : new Date(now).getTime();
  if (!(Date.parse(String(b.expires || "")) > when)) return "expired";
  const I = Engine.inviteRules();
  if (b.state !== "live" || typeof b.secret !== "string" || I.inviteIdOf(b.secret) !== id) return "unknown";
  const want = I.memberProof(b.secret, doc.commit), got = String(inv.proof || "");
  return !!want && got.length === want.length && crypto.timingSafeEqual(Buffer.from(want), Buffer.from(got)) ? "valid" : "proof";
}

/* THE WRAP (slice 3, item 1). The wrap key is 32 bytes of HKDF-SHA256 over the secret's 16 bytes, an empty salt and the
   info etiuda-invite-wrap. The associated data is UTF-8 etiuda-invite-wrap, the relay team, the team, the relay invitation
   id and the epoch, each on its own line. The wrap is {epoch, ct}: ct is hex of a 12-byte nonce, then AES-256-GCM of the
   JSON {epoch, key} with key as 64 hex, then the 16-byte tag. The relay stores it and cannot open it. */
const WRAP_INFO = "etiuda-invite-wrap";

function wrapKeyOf(secret) {
  if (typeof secret !== "string" || !/^[0-9a-f]{32}$/.test(secret)) return null;
  return Buffer.from(crypto.hkdfSync("sha256", Buffer.from(secret, "hex"), Buffer.alloc(0), Buffer.from(WRAP_INFO, "utf8"), 32));
}

function wrapAdOf(rt, teamId, invitationId, epoch) {
  return Buffer.from(WRAP_INFO + "\n" + rt + "\n" + teamId + "\n" + invitationId + "\n" + epoch + "\n", "utf8");
}

/** Seal `o.key` (32 bytes) for the invitation: {epoch, ct}, or null where the secret, the ids or the key will not seal.
 *  `o` is {secret, rt, teamId, invitationId, epoch, key}. The plaintext is JSON.stringify({epoch, key}) with key as 64 hex. */
function sealWrap(o) {
  const x = o || {};
  const key = wrapKeyOf(String(x.secret || ""));
  const teamKey = Buffer.isBuffer(x.key) || x.key instanceof Uint8Array ? Buffer.from(x.key) : Buffer.alloc(0);
  const epoch = x.epoch;
  const rt = String(x.rt || ""), teamId = String(x.teamId || ""), invitationId = String(x.invitationId || "");
  if (!key || teamKey.length !== 32 || !Number.isSafeInteger(epoch) || epoch < 1) return null;
  if (!/^[0-9a-f]{32}$/.test(rt) || !/^[0-9a-f]{32}$/.test(invitationId) || teamId.length < 1) return null;
  const plain = Buffer.from(JSON.stringify({ epoch, key: teamKey.toString("hex") }), "utf8");
  const nonce = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key, nonce);
  c.setAAD(wrapAdOf(rt, teamId, invitationId, epoch));
  const ct = Buffer.concat([nonce, c.update(plain), c.final(), c.getAuthTag()]);
  return { epoch, ct: ct.toString("hex") };
}

/** Open a wrap sealed as sealWrap seals it. `o` is {secret, relayTeamId, teamId, invitationId, wrap, teamDoc}. Where
 *  `teamDoc` is given, its epoch must be the wrap's. A bad tag, a moved id or a mismatched epoch opens nothing. */
function openWrap(o) {
  const x = o || {}, wrap = x.wrap;
  if (!wrap || typeof wrap !== "object" || !Number.isSafeInteger(wrap.epoch) || wrap.epoch < 1) return null;
  if (x.teamDoc && x.teamDoc.epoch !== wrap.epoch) return null;
  const key = wrapKeyOf(String(x.secret || ""));
  if (!key || typeof wrap.ct !== "string" || !/^[0-9a-f]+$/.test(wrap.ct) || wrap.ct.length % 2 !== 0) return null;
  const raw = Buffer.from(wrap.ct, "hex");
  if (raw.length < 28) return null;
  try {
    const d = crypto.createDecipheriv("aes-256-gcm", key, raw.subarray(0, 12));
    d.setAAD(wrapAdOf(String(x.relayTeamId || ""), String(x.teamId || ""), String(x.invitationId || ""), wrap.epoch));
    d.setAuthTag(raw.subarray(raw.length - 16));
    const parsed = JSON.parse(Buffer.concat([d.update(raw.subarray(12, raw.length - 16)), d.final()]).toString("utf8"));
    if (!parsed || parsed.epoch !== wrap.epoch || typeof parsed.key !== "string" || !/^[0-9a-f]{64}$/.test(parsed.key)) return null;
    return { epoch: parsed.epoch, key: Buffer.from(parsed.key, "hex") };
  } catch { return null; }
}

export { makeInvite, clipText, clipForm, inviteState, newSecret, shownName, sealWrap, openWrap, INVITE_DAYS, INVITE_PREFIX };
