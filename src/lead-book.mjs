/* THE LEAD'S BOOK IN THE TEAM FILE (board 945, item 8).
 *
 *     import { sealLeadBook, openLeadBook, shapeBook, absorbLeadBook, publishLeadBook } from "./src/lead-book.mjs";
 *
 * Invitations, desks taken off the team, and the catalog copies this Studio has handled live in
 * teams.json on one computer. A second computer of the same lead reads only the team file, so those records travel
 * in a sibling of the recovery copy, `leadBook`, sealed the same way: scrypt and AES-256-GCM under the passphrase
 * src/team.mjs recoveryOf derives from the signing key. The share and the relay see the kdf and the ciphertext.
 *
 * The recovery copy is not the place for this. Its ciphertext is the team key and a tag, 48 bytes, and it is bound to
 * the epoch; a longer one is dropped by the engine's reader, and with it the copy an older Studio opens the team key
 * from. This book's associated data is the team id and not the epoch, so the clone a new epoch makes still opens.
 *
 * What is sealed: {v, invites, removed, handled, unopened}. An invitation keeps the state the
 * profile stores (live, spent, withdrawn; the page's "expired" is a live one past its end, and the page's "used" is
 * spent) and, while it is live, the secret the other computer needs to admit a desk. A removed desk keeps the key
 * the profile's record needs as well as when, the epoch and the files. A handled id is an ask id from the landing
 * record's done list. An unopened copy keeps its id and the sha256 of the bytes, not the path of the project on this
 * computer. Each list has a bound; what is past it is dropped from the front of the order below.
 *
 * A file from before this field is read as it was: no book changes nothing. Withdrawing or spending is never turned
 * back by an older live record. Two computers that each
 * made an invitation keep both, by id.
 */
import crypto from "node:crypto";
import { wrapKey, KDF, CIPHER } from "./sign.mjs";
import { withRecovery, openRecovery, recoveryOf, writeTeam } from "./team.mjs";
import { keepInvite, invitesOf, inviteBookOf, endInvite, relayInvitesOf, markRelayInvite,
  markRemoved, removedOf, keepTeamKey, teamKeysOf } from "./team-store.mjs";

const MAX_INVITES = 64;
const MAX_REMOVED = 64;
const MAX_HANDLED = 256;
const TEAM_ID = /^t-[0-9a-f]{16}$/;
const INVITE_ID = /^[0-9a-f]{16}$/;
const INVITE_SECRET = /^[0-9a-f]{32}$/;
const DESK_ID = /^k-[0-9a-f]{16}$/;
const HEX64 = /^[0-9a-f]{64}$/;
const RELAY_INV = /^[0-9a-f]{32}$/;
const RELAY_TOKEN = /^[0-9a-f]{64}$/;
/* A new spent or withdrawn row has no secret left to carry. keepInvite requires one, and endInvite then deletes it.
   Never used for a live row: a live invitation with no real secret is skipped. */
const PLACEHOLDER_SECRET = "0".repeat(32);

function leadBookAad(team) {
  return Buffer.from("etiuda-team-leadbook\n" + team.id + "\n", "utf8");
}

function copyFiles(files) {
  const out = {};
  if (!files || typeof files !== "object" || Array.isArray(files)) return out;
  Object.keys(files).forEach((k) => { if (typeof k === "string" && HEX64.test(String(files[k]))) out[k] = String(files[k]); });
  return out;
}

/* Drop order, from the front: an invitation that is live and past its end, then spent, then withdrawn, then the oldest
   live by when it was made, and the same made time by id. A removal drops the oldest `at` first, the same time by id.
   Handled ids and unopened copies share one budget: handled ids from the front, and unopened copies only once those are gone. */
function inviteRank(id, row, now) {
  const when = Date.parse(String(row.expires || ""));
  const expired = row.state === "live" && !(when > now);
  const kind = expired ? 0 : row.state === "spent" ? 1 : row.state === "withdrawn" ? 2 : 3;
  const made = Date.parse(String(row.made || ""));
  return { kind, made: Number.isFinite(made) ? made : 0, id };
}

function relaySeal(relay) {
  if (!relay || typeof relay !== "object") return null;
  if (!RELAY_INV.test(String(relay.inv || "")) || !RELAY_TOKEN.test(String(relay.token || ""))) return null;
  let seal = null;
  try { seal = Buffer.from(String(relay.seal || ""), "base64"); } catch { seal = null; }
  if (!seal || seal.length !== 32) return null;
  const out = { inv: String(relay.inv), token: String(relay.token), seal: seal.toString("base64") };
  if (relay.registered === true) out.registered = true;
  if (relay.dropped === true) out.dropped = true;
  if (relay.gone === true) out.gone = true;
  if (relay.pendingMove === true) out.pendingMove = true;
  if (relay.relayState === "unused" || relay.relayState === "used" || relay.relayState === "asked") out.relayState = relay.relayState;
  if (Number.isFinite(relay.relayUsed)) out.relayUsed = relay.relayUsed;
  if (Number.isSafeInteger(relay.wrappedEpoch) && relay.wrappedEpoch >= 1) out.wrappedEpoch = relay.wrappedEpoch;
  if (DESK_ID.test(String(relay.desk || ""))) out.desk = String(relay.desk);
  return out;
}

function copyInvite(id, row) {
  const state = row && (row.state === "live" || row.state === "spent" || row.state === "withdrawn") ? row.state : "";
  if (!INVITE_ID.test(id) || !state) return null;
  const out = { made: String(row.made || ""), expires: String(row.expires || ""), state,
    name: typeof row.name === "string" ? row.name : "", person: typeof row.person === "string" ? row.person : "" };
  if (state === "live" && INVITE_SECRET.test(String(row.secret || ""))) out.secret = String(row.secret);
  if (DESK_ID.test(String(row.desk || ""))) out.desk = String(row.desk);
  /* A spent or withdrawn row carries no relay fields: endInvite would keep a placeholder secret where a relay row names a desk. */
  if (state === "live") {
    const relay = relaySeal(row.relay);
    if (relay) out.relay = relay;
  }
  return out;
}

/** The book cut to its bounds at `now` (the clock now, where it is left out). */
function shapeBook(raw, now) {
  const src = raw && typeof raw === "object" ? raw : {};
  const when = now == null ? Date.now() : new Date(now).getTime();
  const invitesIn = src.invites && typeof src.invites === "object" && !Array.isArray(src.invites) ? src.invites : {};
  const ranked = [];
  Object.keys(invitesIn).forEach((id) => {
    const row = copyInvite(id, invitesIn[id]);
    if (!row) return;
    ranked.push(Object.assign({ row }, inviteRank(id, row, when)));
  });
  ranked.sort((a, b) => a.kind - b.kind || a.made - b.made || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  while (ranked.length > MAX_INVITES) ranked.shift();
  const invites = {};
  ranked.forEach((r) => { invites[r.id] = r.row; });
  const removedIn = src.removed && typeof src.removed === "object" && !Array.isArray(src.removed) ? src.removed : {};
  const gone = [];
  Object.keys(removedIn).forEach((id) => {
    const r = removedIn[id];
    if (!DESK_ID.test(id) || !r || !HEX64.test(String(r.key || "")) || !Number.isFinite(Number(r.at))) return;
    gone.push({ id, at: Number(r.at), rec: { key: String(r.key), at: Number(r.at), epoch: Number(r.epoch) || 0, files: copyFiles(r.files) } });
  });
  gone.sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  while (gone.length > MAX_REMOVED) gone.shift();
  const removed = {};
  gone.forEach((r) => { removed[r.id] = r.rec; });
  const handled = (Array.isArray(src.handled) ? src.handled : []).filter((id) => typeof id === "string" && id.length > 0 && id.length <= 200);
  const unopened = (Array.isArray(src.unopened) ? src.unopened : []).filter((u) => u && typeof u.id === "string" && u.id.length > 0
    && u.id.length <= 200 && HEX64.test(String(u.sha256 || ""))).map((u) => ({ id: u.id, sha256: String(u.sha256) }));
  let drop = handled.length + unopened.length - MAX_HANDLED;
  let keptHandled = handled, keptUnopened = unopened;
  if (drop > 0) {
    const fromHandled = Math.min(handled.length, drop);
    keptHandled = handled.slice(fromHandled);
    drop -= fromHandled;
    if (drop > 0) keptUnopened = unopened.slice(drop);
  }
  return { v: 1, invites, removed, handled: keptHandled, unopened: keptUnopened };
}

/** Seal `payload` onto `team` as `leadBook`, in place, so a held team stays held. The passphrase is the recovery one. */
function sealLeadBook(team, passphrase, payload) {
  if (!team || typeof team !== "object" || !TEAM_ID.test(String(team.id || "")))
    throw new Error("the lead's book is sealed for a team; nothing was written");
  if (!String(passphrase == null ? "" : passphrase)) throw new Error("the lead's book needs the recovery passphrase; nothing was written");
  const body = Buffer.from(JSON.stringify(shapeBook(payload, Date.now())), "utf8");
  const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv(CIPHER, wrapKey(passphrase, salt), iv);
  c.setAAD(leadBookAad(team));
  const ct = Buffer.concat([c.update(body), c.final(), c.getAuthTag()]);
  const sealed = { v: 1, kdf: KDF.kdf, N: KDF.N, r: KDF.r, p: KDF.p, cipher: CIPHER,
    salt: salt.toString("hex"), iv: iv.toString("hex") };
  sealed.ct = ct.toString("hex"); /* plant:f8-seal */
  team.leadBook = sealed;
  return team;
}

/** The book `passphrase` opens, or null. */
function openLeadBook(team, passphrase) {
  try {
    const b = team && team.leadBook;
    if (!b || b.v !== 1 || b.kdf !== KDF.kdf || b.cipher !== CIPHER || b.N !== KDF.N || b.r !== KDF.r || b.p !== KDF.p) return null;
    const hexCt = String(b.ct || "");
    if (!/^[0-9a-f]+$/.test(hexCt) || hexCt.length < 32 || hexCt.length % 2 !== 0) return null;
    const ct = Buffer.from(hexCt, "hex");
    const d = crypto.createDecipheriv(CIPHER, wrapKey(String(passphrase == null ? "" : passphrase), Buffer.from(String(b.salt), "hex")),
      Buffer.from(String(b.iv), "hex"), { authTagLength: 16 });
    d.setAAD(leadBookAad(team));
    d.setAuthTag(ct.subarray(ct.length - 16));
    const payload = JSON.parse(Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]).toString("utf8"));
    if (!payload || payload.v !== 1) return null;
    return payload;
  } catch { return null; }
}

function relayPatch(relay) {
  const p = {};
  if (!relay) return p;
  if (relay.registered === true) p.registered = true;
  if (relay.dropped === true) p.dropped = true;
  if (relay.gone === true) p.gone = true;
  if (relay.pendingMove === true) p.pendingMove = true;
  if (Number.isSafeInteger(relay.wrappedEpoch) && relay.wrappedEpoch >= 1) p.wrappedEpoch = relay.wrappedEpoch;
  if (relay.relayState === "unused" || relay.relayState === "used" || relay.relayState === "asked") p.relayState = relay.relayState;
  if (Number.isFinite(relay.relayUsed)) p.relayUsed = relay.relayUsed;
  return p;
}

/* By id. A live row that is not here is kept, secret and relay fields with it. A spent or withdrawn row that is not here
   is kept and then ended, so the secret does not stay. A row this computer already ended is left ended. A live row this
   computer still calls live is left as it is. */
function mergeInvites(file, vault, teamId, invites, now) {
  const book = inviteBookOf(file, vault);
  Object.keys(invites || {}).forEach((incomingId) => {
    const row = copyInvite(incomingId, invites[incomingId]);
    if (!row) return;
    const local = book[incomingId];
    if (local && local.team === teamId) {
      if ((row.state === "spent" || row.state === "withdrawn") && local.state === "live")
        endInvite(file, teamId, incomingId, row.state, row.state === "spent" ? row.desk : undefined, now);
      return;
    }
    if (local) return;
    if (row.state === "live") {
      if (!row.secret) return;
      const made = { id: incomingId, secret: row.secret, made: row.made, expires: row.expires, name: row.name, person: row.person };
      if (row.relay) {
        const seal = Buffer.from(row.relay.seal, "base64");
        made.relay = { inv: row.relay.inv, token: row.relay.token, seal };
      }
      keepInvite(file, vault, teamId, made);
      const patch = relayPatch(row.relay);
      if (Object.keys(patch).length) markRelayInvite(file, teamId, incomingId, patch);
      return;
    }
    keepInvite(file, vault, teamId, { id: incomingId, secret: PLACEHOLDER_SECRET, made: row.made, expires: row.expires,
      name: row.name, person: row.person });
    endInvite(file, teamId, incomingId, row.state, row.state === "spent" ? row.desk : undefined, now);
  });
}

function mergeRemoved(file, teamId, removed) {
  Object.keys(removed || {}).forEach((incomingId) => {
    const r = removed[incomingId];
    if (!r) return;
    try { markRemoved(file, teamId, { id: incomingId, key: r.key }, r.at, r.epoch, r.files || {}); }
    catch { /* a record that is not a desk id and a key is not kept */ }
  });
}

/* Into the landing record the caller holds. An unopened sha already kept for that id is left. Answers whether it changed. */
function mergeHandled(ledger, book) {
  if (!ledger || typeof ledger !== "object" || !book) return false;
  if (!ledger.done || typeof ledger.done !== "object" || Array.isArray(ledger.done)) ledger.done = {};
  if (!ledger.unopened || typeof ledger.unopened !== "object" || Array.isArray(ledger.unopened)) ledger.unopened = {};
  let changed = false;
  (book.handled || []).forEach((incomingId) => {
    if (typeof incomingId !== "string" || !incomingId || ledger.done[incomingId] === true) return;
    ledger.done[incomingId] = true;
    changed = true;
  });
  (book.unopened || []).forEach((u) => {
    if (!u || typeof u.id !== "string" || !u.id || !HEX64.test(String(u.sha256 || "")) || ledger.unopened[u.id]) return;
    ledger.unopened[u.id] = { sha256: String(u.sha256) };
    changed = true;
  });
  return changed;
}

/** The profile's book, after `absorb` has merged the file into it. */
function payloadOf(o) {
  const file = o.teamsFile, id = o.team.id, now = o.now;
  const stored = inviteBookOf(file, o.vault);
  const relayRows = relayInvitesOf(file, o.vault, id, now);
  const invites = {};
  invitesOf(file, id, now).forEach((row) => {
    const local = stored[row.id];
    if (!local || local.team !== id) return;
    const state = local.state === "live" || local.state === "spent" || local.state === "withdrawn" ? local.state : "";
    if (!state) return;
    const rec = { made: row.made, expires: row.expires, state, name: row.name, person: row.person };
    if (state === "live" && local.secret) rec.secret = local.secret;
    const rel = relayRows.find((r) => r.id === row.id);
    if (state === "live" && rel && rel.token && rel.seal) {
      rec.relay = { inv: rel.inv, token: rel.token, seal: Buffer.from(rel.seal).toString("base64"),
        registered: rel.registered === true, dropped: rel.dropped === true, gone: rel.gone === true,
        pendingMove: rel.pendingMove === true, relayState: rel.relayState || "", relayUsed: rel.relayUsed,
        wrappedEpoch: rel.wrappedEpoch, desk: rel.desk || "" };
    } else if (state === "spent" && rel && DESK_ID.test(String(rel.desk || ""))) rec.desk = String(rel.desk);
    invites[row.id] = rec;
  });
  const ledger = o.ledger && typeof o.ledger === "object" ? o.ledger : {};
  const handled = Object.keys(ledger.done && typeof ledger.done === "object" ? ledger.done : {});
  const unopened = [];
  const waiting = ledger.unopened && typeof ledger.unopened === "object" ? ledger.unopened : {};
  Object.keys(waiting).forEach((incomingId) => {
    const sha = waiting[incomingId] && waiting[incomingId].sha256;
    if (HEX64.test(String(sha || ""))) unopened.push({ id: incomingId, sha256: String(sha) });
  });
  return { v: 1, invites, removed: removedOf(file, id), handled, unopened };
}

/** Merge `team`'s book into this computer's profile. Nothing is written to the share. The recovery copy has to open;
 *  a team file with no book changes nothing and still counts as opened. The key that copy opens is kept for this
 *  computer (keepTeamKey): the other computer may have rotated the epoch, and the book alone does not carry the key. */
async function absorbLeadBook(o) {
  const opts = o || {}, team = opts.team;
  let pass = "";
  try { pass = opts.recoveryPassphrase || recoveryOf(opts.keyFile, opts.secret); }
  catch { return { opened: false }; }
  const openedKey = openRecovery(team, pass);
  if (!openedKey) return { opened: false };
  /* A key already kept for this epoch is left as it is, so a watch that reads the book again does not rewrite the file. */
  let already = false;
  try {
    const had = team && opts.teamsFile && opts.vault ? teamKeysOf(opts.teamsFile, opts.vault) : null;
    const got = had && team && had[team.id] && had[team.id][team.epoch];
    already = !!(got && Buffer.from(got).equals(openedKey));
  } catch { already = false; }
  let saveKey = false;
  saveKey = !already && !!(team && opts.teamsFile && opts.vault && Number.isInteger(team.epoch)); /* plant:fl4-keep-key */
  let keptKey = already;
  if (saveKey) {
    try { keepTeamKey(opts.teamsFile, opts.vault, team.id, team.epoch, openedKey); keptKey = true; }
    catch { keptKey = false; /* a different key under the same number stands, or this computer cannot seal */ }
  }
  if (!team.leadBook) return { opened: true, book: false, keptKey };
  const book = openLeadBook(team, pass);
  if (!book) return { opened: true, book: false };
  mergeInvites(opts.teamsFile, opts.vault, team.id, book.invites, opts.now);
  mergeRemoved(opts.teamsFile, team.id, book.removed);
  const ledger = mergeHandled(opts.ledger, book);
  return { opened: true, book: true, ledger, keptKey };
}

/** Seal this computer's book onto `team` and write the team file. Where the recovery copy does not open and `teamKey`
 *  is the team's key, the copy is wrapped first and the book is sealed onto that. */
async function publishLeadBook(o) {
  const opts = o || {};
  const signing = opts.passphrase || opts.secret;
  const recoveryPass = opts.recoveryPassphrase || recoveryOf(opts.keyFile, signing);
  let team = opts.team;
  if (!openRecovery(team, recoveryPass)) {
    const key = opts.teamKey == null ? null : Buffer.from(opts.teamKey);
    if (!key || key.length !== 32) throw new Error("the recovery copy does not open, so the lead's book was not written");
    team = withRecovery(team, key, recoveryPass);
  }
  await absorbLeadBook(Object.assign({}, opts, { team, recoveryPassphrase: recoveryPass }));
  sealLeadBook(team, recoveryPass, payloadOf(Object.assign({}, opts, { team })));
  return writeTeam(opts.folder, team, { key: opts.keyFile, passphrase: signing });
}

export { MAX_INVITES, MAX_REMOVED, MAX_HANDLED, shapeBook, sealLeadBook, openLeadBook, absorbLeadBook, publishLeadBook };
