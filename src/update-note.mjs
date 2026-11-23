/* THE VERSION NOTE (board 991): what tells this Studio that a newer one is out, and nothing else.
 *
 *     import { readNote, laterNote, look, offerOf, putOff, releasePage, noteBytes, makeNote, NOTE_MAX } from "./update-note.mjs";
 *
 * Max's ruling of 2026-10-06 (22:07 and 22:28): "Each program reads a small signed version note (form B) from etiuda.dev and
 * offers the update itself". Until installers are signed the offer opens the release page in the browser and installs
 * nothing, so nothing here fetches, runs or writes anything a note names: the one thing a note leads to is a page opened by
 * the shell (releasePage).
 *
 * THE FORMAT IS THE OFFICE'S FILE, NOT THIS ONE: the lead engineer's note of 2026-11-11, which the desk
 * verifies against too, so the two programs read one note alike. In short: a JSON object of exactly eight keys, at most
 * NOTE_MAX bytes of printable ASCII, every field bounded, signed by the vendor root with Ed25519 over a line form whose first
 * line is the note's own (NOTE_KIND), as the root's other offline documents are (the revoked keys' list in src/licence.mjs,
 * the delegation and the grant in the relay's core). The catalog fold is not used: it begins "{" and is what the root signs
 * licences with, so a note in it would be told from a licence only by a field each reader must remember to check.
 *
 * A NOTE IS TAKEN WHOLE OR NOT AT ALL. readNote runs every check in the format's order and answers the first failure as a
 * reason; nothing of a refused note is used. The serial never goes back (laterNote): a note is taken only over none, or over
 * a lower serial; the same note again changes nothing; a lower serial, or the same serial with any field different, is
 * refused and the kept note stands, so an old note served again can neither hide a newer one nor bring back an offer gone.
 *
 * THE OFFER (offerOf) is the product designer's ruling of 2026-11-11 17:35: it stands while the kept note's version is above
 * the running one, and goes for good once they are equal; "Later" puts the strip off for seven days for that version alone,
 * and a newer version shows at once; the status bar's mark and About ignore the put-off. Nothing shows when no note is kept.
 */
import crypto from "node:crypto";

const NOTE_KIND = "etiuda-update-note";
const NOTE_FORMAT = 1;
const NOTE_MAX = 1024;
const NOTE_FIELDS = ["kind", "format", "app", "serial", "version", "released", "url", "sig"];
const NOTE_APPS = ["desk", "studio"];
const SERIAL_MAX = 999999999;
const VERSION_RE = /^(0|[1-9][0-9]{0,2})\.(0|[1-9][0-9]{0,2})\.(0|[1-9][0-9]{0,2})$/;
const DAY_RE = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/;
const URL_MAX = 200;
const URL_RE = /^https:\/\/etiuda\.dev(\/[A-Za-z0-9][A-Za-z0-9._-]{0,63}){1,8}\/?$/;
const KEY_ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const PUT_OFF_MS = 7 * 24 * 60 * 60 * 1000;
const SPKI_ED25519 = Buffer.from("302a300506032b6570032100", "hex");

const plain = (v) => v !== null && typeof v === "object" && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
const exactly = (o, keys) => { const k = Object.keys(o); return k.length === keys.length && keys.every((x) => k.indexOf(x) >= 0); };

/** The bytes the root signs: the note's own line, then format, app, serial, version, released and url, one per line. */
function noteBytes(n) {
  return Buffer.from([NOTE_KIND, String(n.format), String(n.app), String(n.serial), String(n.version), String(n.released),
    String(n.url)].join("\n"), "utf8");
}

/** A day of the form YYYY-MM-DD, years 2020 to 2099, that the calendar has. */
function dayOk(s) {
  const m = DAY_RE.exec(String(s));
  if (!m) return false;
  const y = +m[1], mo = +m[2], d = +m[3];
  if (y < 2020 || y > 2099) return false;
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
}

/** Why the parsed object `n` is not a note of the format's shape for `app` (checks 4 to 12), or null where it is. */
function shapeWhy(n, app) {
  if (!plain(n)) return "not-object";
  if (!exactly(n, NOTE_FIELDS)) return "fields";
  if (n.kind !== NOTE_KIND) return "kind";
  if (n.format !== NOTE_FORMAT) return "format";
  if (NOTE_APPS.indexOf(n.app) < 0) return "app";
  if (n.app !== app) return "other-app"; /* plant:un-app */
  if (typeof n.serial !== "number" || !Number.isSafeInteger(n.serial) || n.serial < 1 || n.serial > SERIAL_MAX) return "serial";
  if (typeof n.version !== "string" || !VERSION_RE.test(n.version)) return "version";
  if (typeof n.released !== "string" || !dayOk(n.released)) return "released";
  if (typeof n.url !== "string" || n.url.length > URL_MAX || !URL_RE.test(n.url)) return "url"; /* plant:un-url */
  const s = n.sig;
  if (!plain(s) || !exactly(s, ["alg", "keyId", "value"]) || s.alg !== "ed25519" || typeof s.keyId !== "string"
      || !KEY_ID_RE.test(s.keyId) || typeof s.value !== "string" || !/^[0-9a-f]{128}$/.test(s.value)) return "sig-shape";
  return null;
}

/** Whether the root whose public half is `root` (64 hex) signed `n` over noteBytes. A throw is a no. */
function signedBy(n, root) {
  if (!/^[0-9a-f]{64}$/.test(String(root || ""))) return false;
  try {
    const key = crypto.createPublicKey({ key: Buffer.concat([SPKI_ED25519, Buffer.from(root, "hex")]), format: "der", type: "spki" });
    return crypto.verify(null, noteBytes(n), key, Buffer.from(n.sig.value, "hex")); /* plant:un-sig */
  } catch { return false; }
}

/**
 * A note read from `body` (bytes or a string, the whole response body) for `app` ("desk" or "studio") under the root `root`:
 * {ok: true, note} where every check of the format's 1 to 13 holds, else {ok: false, why}. The serial (14) is laterNote's.
 */
function readNote(body, app, root) {
  const bytes = Buffer.isBuffer(body) ? body : body instanceof Uint8Array ? Buffer.from(body)
    : typeof body === "string" ? Buffer.from(body, "utf8") : null;
  if (!bytes) return { ok: false, why: "none" };
  if (bytes.length > NOTE_MAX) return { ok: false, why: "size" }; /* plant:un-size */
  for (const b of bytes) if (!(b === 0x09 || b === 0x0a || b === 0x0d || (b >= 0x20 && b <= 0x7e))) return { ok: false, why: "bytes" };
  let n;
  try { n = JSON.parse(bytes.toString("latin1")); } catch { return { ok: false, why: "json" }; }
  const why = shapeWhy(n, app);
  if (why) return { ok: false, why };
  if (!signedBy(n, root)) return { ok: false, why: "signature" };
  return { ok: true, note: n };
}

/** The same note, field by field: what the signature covers, and the signature itself. */
function sameNote(a, b) {
  return noteBytes(a).equals(noteBytes(b)) && a.sig.value === b.sig.value;
}

/**
 * Whether `next` (a note readNote passed) may replace `kept` (a note, or null): {take, why}. Taken over none or over a lower
 * serial; the same note again is "same"; a lower serial is "older", and the same serial with anything else is "conflict".
 */
function laterNote(kept, next) {
  if (!next) return { take: false, why: "none" };
  if (!kept) return { take: true, why: null };
  if (next.serial === kept.serial) return sameNote(kept, next) ? { take: false, why: "same" } : { take: false, why: "conflict" };
  if (next.serial < kept.serial) return { take: false, why: "older" }; /* plant:un-serial */
  return { take: true, why: null };
}

/** The three numbers of a version, or null. */
function parts(v) {
  const m = VERSION_RE.exec(String(v || ""));
  return m ? [+m[1], +m[2], +m[3]] : null;
}
/** Above zero where `a` is the higher version, below where `b` is, zero where equal; null where either is not a version. */
function compareVersions(a, b) {
  const x = parts(a), y = parts(b);
  if (!x || !y) return null;
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

/**
 * The state kept beside Studio's settings, as read back: {note, putOff, looked}, each checked again here, so a file edited by
 * hand or damaged reads as nothing kept. `note` passes readNote again, its signature included.
 */
function keptOf(state, app, root) {
  const s = plain(state) ? state : {};
  let note = null;
  if (plain(s.note)) {
    const r = readNote(JSON.stringify(s.note), app, root);
    if (r.ok) note = r.note;
  }
  const p = s.putOff;
  const putOffOk = plain(p) && typeof p.version === "string" && VERSION_RE.test(p.version)
    && typeof p.until === "number" && Number.isFinite(p.until);
  const l = s.looked;
  const lookedOk = plain(l) && typeof l.at === "number" && Number.isFinite(l.at) && typeof l.read === "boolean";
  return { note, putOff: putOffOk ? { version: p.version, until: p.until } : null,
    looked: lookedOk ? { at: l.at, read: l.read } : null };
}

/**
 * One look at the service: `get()` answers {status, bytes} or throws (the shell passes wire.cjs's licenceNote, a leg a stand-in),
 * and the state to keep comes back with `why`, the look's outcome. `looked.read` says whether the latest look took a note or
 * saw the same one kept, at or above the running version, which is what About says "the newest" on; a refused note leaves the
 * kept one as it was.
 */
async function look(o) {
  const opts = o || {};
  const app = opts.app, root = opts.root, now = Number(opts.now);
  const kept = keptOf(opts.state, app, root);
  let got = null, why = null;
  try { got = await opts.get(); } catch { why = "unreached"; }
  let read = null;
  if (!why) {
    if (!got || got.status !== 200) why = "status";
    else { read = readNote(got.bytes, app, root); if (!read.ok) why = read.why; }
  }
  let note = kept.note;
  let takenOrSame = false;
  if (!why) {
    const later = laterNote(kept.note, read.note);
    if (later.take) { note = read.note; takenOrSame = true; }
    else if (later.why === "same") takenOrSame = true;
    else why = later.why;
  }
  /* Only a note taken or kept the same is weighed: a look that read none (down, a status, refused) is failed already. */
  const versionOk = !opts.running || (takenOrSame && compareVersions(read.note.version, opts.running) !== null
    && compareVersions(read.note.version, opts.running) >= 0);
  const readOk = takenOrSame && versionOk;
  return { state: { note, putOff: kept.putOff, looked: { at: now, read: readOk } }, why };
}

/**
 * The offer the kept state makes against the running version `running`, at `now`: null where none stands, else {version,
 * released, url, strip}, `strip` false while "Later" puts that version off. About's line is aboutOf's.
 */
function offerOf(state, running, now, app, root) {
  const kept = keptOf(state, app, root);
  if (!kept.note) return null;
  const c = compareVersions(kept.note.version, running);
  if (c === null || c <= 0) return null; /* plant:un-equal */
  const p = kept.putOff;
  const putOffNow = !!p && p.version === kept.note.version && Number(now) < p.until; /* plant:un-putoff */
  return { version: kept.note.version, released: kept.note.released, url: kept.note.url, strip: !putOffNow };
}

/** What About says beside the running version: "offer" (with the offer), "newest", or "unchecked". */
function aboutOf(state, running, now, app, root) {
  const offer = offerOf(state, running, now, app, root);
  if (offer) return { said: "offer", offer };
  const kept = keptOf(state, app, root);
  return { said: kept.looked && kept.looked.read ? "newest" : "unchecked", offer: null };
}

/** The state with the offered version put off for seven days from `now`; unchanged where no offer stands. */
function putOff(state, running, now, app, root) {
  const kept = keptOf(state, app, root);
  const offer = offerOf(state, running, now, app, root);
  if (!offer) return { note: kept.note, putOff: kept.putOff, looked: kept.looked };
  return { note: kept.note, putOff: { version: offer.version, until: Number(now) + PUT_OFF_MS }, looked: kept.looked };
}

/** The release page to open: the offer's url where it is still one the format admits, else "". Nothing else is ever opened. */
function releasePage(offer) {
  const url = offer && typeof offer.url === "string" ? offer.url : "";
  return url.length <= URL_MAX && URL_RE.test(url) ? url : "";
}

/**
 * A note signed with `privateKey` (a KeyObject): the fields of `f` (app, serial, version, released, url) and `keyId`. Used by
 * the offline command (tools/sign.mjs note) and the legs; it refuses a note this module would not read back.
 */
function makeNote(f, privateKey, keyId) {
  const n = unsigned(f, keyId);
  const why = fieldsWhy(f, keyId);
  if (why) throw new Error(why);
  n.sig.value = crypto.sign(null, noteBytes(n), privateKey).toString("hex");
  return n;
}
function unsigned(f, keyId) {
  const g = f || {};
  return { kind: NOTE_KIND, format: NOTE_FORMAT, app: g.app, serial: g.serial, version: g.version, released: g.released,
    url: g.url, sig: { alg: "ed25519", keyId: String(keyId || "etiuda-root"), value: "0".repeat(128) } };
}
const FIELD_SAID = { app: "the app", "other-app": "the app", serial: "the serial", version: "the version", released: "the release day",
  url: "the release page's address", "sig-shape": "the key's id" };
/** Why a note of the fields `f` would be refused by every reader, as a sentence, or null where none would refuse it. */
function fieldsWhy(f, keyId) {
  const why = shapeWhy(unsigned(f, keyId), (f || {}).app);
  return why ? (FIELD_SAID[why] || why) + " is not one every reader takes, so no note was made" : null;
}

/* AN ADMINISTRATOR TURNS THE HOURLY LOOK OFF (Claude α's decision 10, 2026-11-11): StudioNoUpdateCheck under
   HKLM\SOFTWARE\Policies\Etiuda, as `reg query` prints the key (src/ai-policy.cjs reads it; the desk's value beside it is
   DeskNoUpdateCheck). Set to anything but 0, as a DWORD or a string, Studio asks for no version note and offers none; absent,
   empty or 0 leaves the look on. Only the key's own values count, never a subkey's. */
function noUpdateFrom(text) {
  let own = false, off = false;
  for (const line of String(text || "").split(/\r?\n/)) {
    if (/^HKEY_/i.test(line)) { own = /^HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Etiuda$/i.test(line.trim()); continue; }
    const m = own ? /^ {4}(\S(?:.*?\S)?) {4}(REG_[A-Z_]+)(?: {4}(.*))?$/.exec(line) : null;
    if (!m || m[1].toLowerCase() !== "studionoupdatecheck") continue;
    const v = String(m[3] || "").trim();
    off = !(v === "" || v === "0" || /^0x0+$/i.test(v));
  }
  return off;
}

export { noUpdateFrom, readNote, laterNote, look, keptOf, offerOf, aboutOf, putOff, releasePage, noteBytes, makeNote, fieldsWhy, compareVersions,
  NOTE_KIND, NOTE_FORMAT, NOTE_MAX, NOTE_FIELDS, NOTE_APPS, SERIAL_MAX, URL_RE, URL_MAX, VERSION_RE, PUT_OFF_MS };
