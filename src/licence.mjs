/* LICENCE HANDLING: SPEC 3.8 AND 5.4, AS RULED AT THE FOURTH MEETING (board 745).
 *
 *     import { readLicenceFile, verifyLicence, licenceState, formatLicenceHeader,
 *              createTestLicence, createTestDelegation, createTestTrialLicence, defaultLicenceFile, contextFor, packagedAt,
 *              releasedIn, trustedKeyNow,
 *              revocationsHold, readRevocations, laterRevocations, revokedFileFor, revokedCopyFor, keptRevocations, createTestRevocations,
 *              LICENCE_KIND, LICENCE_FORMAT, LICENCE_FILE, LICENCE_FILE_MAX, DEVICES_PER_SEAT, TRIAL_DAYS, TRIAL_KIND, TRIAL_FORMAT, TRIAL_PAUSED, HELD_SAID,
 *              REVOCATIONS_KIND, REVOKED_FILE, PACKAGED,
 *              seenNow, seenFrom, onSeen, seenSign, seenHolds } from "./src/licence.mjs";
 *
 * A LICENCE IS READ BY ITS OWN DATES, AND NO BUILD IS "NEWER" THAN IT (Max, 2026-11-17 20:41, "I agree with your recommendation", to a
 * paid licence that ends stopping Studio as it stops the desk). The EULA sells a licence once, with the versions released in the
 * twelve months after purchase; `updatesUntil` states them and is shown, and nothing here compares it with the day a build was
 * released: no mark is put on what a build publishes, and no state is "newer". A paid licence's end is its paid time
 * (`paidUntil`: ms timestamp, or a day string whose last paid day still works), from which its state is `paid-ended`, paused and
 * unable to publish; a file without `paidUntil` (an older shape) reads active as before. A file older Studios wrote, or one that itself carries a field named for either
 * old mark, is read as any paid file is. Format 1 counted desks and locked
 * publishing thirty days after an expiry date, which sold a subscription nobody offers.
 *
 * THE COUNT IS THE EULA'S: a seat is one named person, up to three devices they work on. The file
 * states how many seats and names nobody: the EULA keeps "named person" and the customer keeps the
 * list of names, so neither Studio nor the service that issues licences ever holds a customer's
 * staff (the licence service's design of 2026-09-24, lines 28 to 32). Format 3 carries `seats`;
 * format 2 carried `persons`, the names, and is still read, its seats being how many it names. The
 * three is a term of the EULA rather than a field of the file, so a file cannot say four. Nothing
 * here counts devices, because nothing here phones home: enforcement is contractual (spec 5.2),
 * and the file makes the count visible.
 *
 * THE ROOT SIGNS A LICENCE, OR CERTIFIES THE KEY THAT DID (licence service S1). A licence is accepted when the root
 * signed it, or when it carries, in `via`, a delegation the root signed that certifies for "licence" the key which signed
 * the licence, and the licence was issued inside the delegation's window. Nothing else is accepted, and no licence
 * accepted before is refused. `via` is inside the licence's own signature, and the window is read from the licence's
 * `issued` day and never from today, so a licence keeps working after its delegation ends, as use does not expire.
 *
 * A KEY THE ROOT REVOKED SIGNS NOTHING STUDIO ACCEPTS (audit 6; licence service S6, the test architect's condition on S1).
 * A leaked service key could sign licences back-dated into its delegation's window, so the root, offline, signs a list of
 * revoked service keys ("etiuda-revocations": a serial and the keys' public halves), which reaches Studio by the quiet check
 * and is kept beside the licence file (REVOKED_FILE). A licence a delegate signed whose `via` names a key on the list is
 * refused `revoked`; a licence the root itself signed is never on it. The kept list never goes back: a newer one is taken
 * only when its serial is higher and it still names every key the kept one names (laterRevocations), so a service, or the
 * network, handing an older list or a shorter one takes nothing off it. The service re-signs a revoked key's licences
 * with its new key at the next check, so a customer's licence comes back by itself.
 *
 * A FILE THAT CANNOT BE USED IS NO LICENCE, NOT A REFUSAL. Damaged, empty, from another format,
 * signed by somebody else, or genuine but unreadable because this copy has no key to check it
 * with: every one of these is read as no licence at all, and the state, `none`, names the file and why
 * (`unusable`). A refusal there read as a fault in the catalog, and the last of them blamed the
 * customer for a key the vendor had not yet built in. No licence cannot publish, and Studio does not work (the shell's studioWorks):
 * there is no period of use without one.
 *
 * A FILE ANOTHER PROGRAM HAS OPEN RESTS ON WHAT THIS COMPUTER ALREADY VERIFIED THERE (review xi, A1; Claude alpha, 2026-11-22:
 * held may keep a person working only on something already verified on that computer, never on an unsigned file's say-so).
 * A read refused with EPERM, EACCES or EBUSY is asked again for half a second, as renamePatiently does (src/whole-write.cjs).
 * If it is still held, the licence this computer last verified at that path is read again by its own dates and the floor
 * below: running, the state is `held`, publishing stays open and the sentence says the file could not be read, so a scanner
 * or a sync client holding it never stops a paying lead; ended, it is that ended state. With none verified there, it is no
 * licence, `unreadable`, naming the file. The next look reads the file again. Nothing here is a field a licence file can
 * carry: a file that parses to any object is judged as a licence, never as held.
 *
 * NOTHING HERE COUNTS A PERIOD OF USE WITHOUT A LICENCE. A copy's first run is read by nothing; a trial is a signed licence,
 * below. Nothing here connects: any call is the shell's, through src/wire.cjs, and carries no customer content (CLAUDE.md).
 *
 * A TRIAL IS A SIGNED LICENCE TOO (decisions: "trials are signed licences too", 2026-09-24 02:03 and
 * 2026-10-06 21:26), and the one licence that ends by the clock. The licence service signs it at a
 * sign-in in its own kind, TRIAL_KIND, so that no reader older than this one takes it for a licence
 * for ever (an older copy reads it `unreadable`, which is no licence), with `ends`, the trial's end in
 * milliseconds, inside its signature. Until then it is honoured as a licence; from
 * then on its state is `trial-ended`, and as the record says for after the trial (decisions 2026-09-24
 * 02:01 and 02:03), publishing, reading statistics and taking proposals pause with one calm sentence
 * while editing, lint and export stay open (`paused`). A full licence is read exactly as before: nothing
 * on its path reads `ends` or today.
 *
 * THE CLOCK A LICENCE IS READ BY CANNOT BE SET BACK PAST WHAT THIS COPY HAS ALREADY SEEN. The record's
 * clock check "counts from the later of today and the last published edition" (decisions 2026-09-24
 * 02:36), and the licence's own `issued` day, which the service writes afresh at each quiet check, is a
 * day that has certainly come: so a trial's or a paid period's now is the latest of this computer's clock, the start
 * of the licence's `issued` day and the newest time this computer has seen (review xi, A4), which never moves back and
 * so is at least the moment of the last edition published here. No archive folder's name is read as a day (review xi,
 * B6): a folder anyone can make, so `9999-01-01` ended a current licence and `9999-99-99` reopened an ended one. A time
 * seen ahead, by a clock once carried forward, is righted by the next licence the service issues (a later `issued`),
 * as the desk's own clock is righted by its next certificate.
 *
 * WHAT THIS COMPUTER HAS SEEN, kept (review xi, A1, A3, A4): the licence last verified at each path, the newest revoked
 * keys' list beside each licence, never losing a key, and that newest time. The shell keeps it across a restart
 * (seenNow, seenFrom, onSeen), its digest sealed by the system's keyring (seenDigest; seenSign and seenHolds mark one by a key
 * instead, for a caller that holds one open), and hands it to the publish thread, which runs apart (`o.seen`). A snapshot whose
 * seal does not hold is not taken. Deleting every trace of it is a fresh
 * computer's state, which only a gate on the service's signed seat certificate can tell apart (a question for Max).
 */
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifySignature, signDocument, delegationRules } from "./sign.mjs";
import { createRequire } from "node:module";
/* The sign-in lab (src/signin-lab.cjs). A copy of this module alone, as legs plant one, has no lab beside it, and reads as today. */
const signinLab = (() => { try { return createRequire(import.meta.url)("./signin-lab.cjs"); } catch { return { lab: null }; } })();

const LICENCE_KIND = "etiuda-studio-license";
/* THE TRIAL'S LICENCE: its own kind and its own format, read only by a copy that knows it ends. */
const TRIAL_KIND = "etiuda-studio-trial-license";
const TRIAL_FORMAT = 1;
/* THE ONE CALM SENTENCE after a trial's end, a frame the page says in either language (ui/lang.js): the publish cover's line,
   publishing's refusal, and the shell's for statistics and proposals are all this one. */
const TRIAL_PAUSED = "The trial ended on {DATE}. Publishing, statistics and proposals are paused until a licence is"
  + " bought; editing, checks and export stay open. Signing in then brings the licence here.";
/* THE SENTENCE WHEN THE LICENCE FILE IS HELD OPEN, on the licence line and the publish cover. Publishing stays open.
   It is not the pause above. */
const HELD_SAID = "The licence file could not be read just now, perhaps because another program has it open."
  + " Publishing goes on as normal, and Studio tries again at its next look.";
/* The format every licence is written in; NAMED_FORMAT is the one before it, still read. */
const LICENCE_FORMAT = 3;
const NAMED_FORMAT = 2;
const LICENCE_FILE = "etiuda-studio-license.js";
const DEVICES_PER_SEAT = 3;
const TRIAL_DAYS = 14;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/* THE VENDOR ROOT PUBLIC KEY IS EMBEDDED IN STUDIO; PRIVATE KEY LIVES OFFLINE (spec 5.4).
 * Maxim made it (board 742) on 2026-10-20 and its public half is the line below as 64 hex
 * characters: keyId `etiuda-root`, filled on 2026-10-20. The code compares no key ids, only this
 * public half against a licence's signature, so the keyId is named here and not carried in the value.
 * A copy with no key at all still reads a genuine licence as `nokey`, its own fault, and says so.
 */
const EMBEDDED_VENDOR_ROOT_KEY = "f78558260ad75c094052f936326a63bffb1a581ac8b91d898ae1fd01b61127ee";

/* PACKAGED IS WHERE THIS MODULE WAS LOADED FROM, not a flag anybody passes. electron-builder
   packs src/ into app.asar (asar: true), so a module running out of an installed copy has
   app.asar in its own path and one running out of a checkout does not. A caller cannot claim
   either, which is the point: in a packaged build nothing injected is honoured (finding 31). */
const HERE = path.dirname(fileURLToPath(import.meta.url));
function packagedAt(dir) { return /[\\/]app\.asar([\\/]|$)/i.test(String(dir || "")); }
const PACKAGED = packagedAt(HERE);

/** The `released` date a package.json carries, or null. electron-builder.js writes it into the
 *  packaged copy only, so a checkout's own package.json has none. */
function releasedIn(file) {
  try {
    const v = JSON.parse(fs.readFileSync(String(file), "utf8").replace(/^\uFEFF/, "")).released;
    return DATE.test(String(v || "")) ? String(v) : null;
  } catch { return null; }
}
const OWN_RELEASE = releasedIn(path.join(HERE, "..", "package.json"));

const dateOr = v => (v != null && DATE.test(String(v)) ? String(v) : null);
/** This machine's calendar day, which is the day a person would name; never UTC's. */
const localDay = (d = new Date()) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0")
  + "-" + String(d.getDate()).padStart(2, "0");

/**
 * The key a licence is checked against and the release date of the running build.
 * A development tree takes either from a caller or from STUDIO_VENDOR_KEY and STUDIO_RELEASED,
 * which is how the gates reach every state; a packaged build takes the embedded key and the date
 * it was packaged with, and nothing else. No caller hands in a licence state whole: publishFull
 * computes it from the file every time. `lab`, the sign-in lab a development Studio took from
 * ETIUDA_SIGNIN_LAB (src/signin-lab.cjs, null installed), puts its root in place of the key a caller does not name.
 */
function contextFor(opts, env, packaged, ownRelease, lab) {
  const o = opts || {}, e = env || {};
  if (packaged) return { packaged: true, trustedKey: EMBEDDED_VENDOR_ROOT_KEY,
                         released: dateOr(ownRelease) };
  return {
    packaged: false,
    trustedKey: o.trustedKey || (lab && lab.root) || e.STUDIO_VENDOR_KEY || EMBEDDED_VENDOR_ROOT_KEY,
    released: dateOr(o.released) || dateOr(e.STUDIO_RELEASED) || dateOr(ownRelease),
  };
}
const contextOf = opts => contextFor(opts, process.env, PACKAGED, OWN_RELEASE, signinLab.lab);
/** The root's public half this copy checks a licence and a revoked keys' list against: the embedded one when packaged, and in a
 *  development tree STUDIO_VENDOR_KEY's where a gate sets it. */
const trustedKeyNow = () => contextOf({}).trustedKey;

function defaultUserData() {
  if (process.env.APPDATA) return path.join(process.env.APPDATA, "Etiuda Studio");
  const home = process.env.HOME || "";
  if (process.platform === "darwin")
    return path.join(home, "Library", "Application Support", "Etiuda Studio");
  return path.join(home, ".config", "etiuda-studio");
}

function defaultLicenceFile(userData) {
  return path.join(userData || defaultUserData(), LICENCE_FILE);
}

/* A READ OF A FILE ANOTHER PROGRAM HAS OPEN IS REFUSED ON WINDOWS for as long as it holds it, the
   same half-second and the same three codes renamePatiently asks again (src/whole-write.cjs). */
const BUSY = ["EPERM", "EACCES", "EBUSY"];
const TRIES = 10, PAUSE_MS = 50;
/* A licence file past this is unusable, refused before it is read or canonicalised: the quiet check takes no answer over
   256 KiB (licence-client.mjs ANSWER_MAX), so only a file made by hand could reach it. */
const LICENCE_FILE_MAX = 1024 * 1024;
const nap = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
/* Not a field of the file. A parsed object never carries this, so a licence that says "held" is still a licence. */
const HELD_MARK = Symbol("held");

/** The bytes at `at`, asked again while the refusal is one of BUSY. Null when nothing is there.
 *  A folder throws EISDIR at once. A busy file still busy on the last try throws that refusal. */
function readLicenceText(at) {
  for (let i = 1; ; i++) {
    try {
      if (!fs.existsSync(at)) return null;
      if (fs.statSync(at).isDirectory()) {
        const err = new Error("a folder");
        err.code = "EISDIR";
        throw err;
      }
      if (fs.statSync(at).size > LICENCE_FILE_MAX) { const err = new Error("too large"); err.code = "EFBIG"; throw err; } /* plant:licence-size */
      return fs.readFileSync(at, "utf8");
    } catch (e) {
      if (i >= TRIES || !e || BUSY.indexOf(e.code) < 0) throw e; /* plant:held-retry */
      nap(PAUSE_MS);
    }
  }
}

/**
 * Reads a licence file: raw JSON, or `window.E_LICENSE = {...};`. Null when there is no file;
 * `{ malformed: true }` when there is something at the path that cannot be read as one: a folder,
 * or a file that does not parse. A file the system will not open, after the half-second above, is
 * the held mark and not malformed: it is not a licence that failed to verify, and it does not
 * pause. A file that cannot be used is no licence, so no way of failing to read one throws
 * (board 931, condition 9).
 */
function readLicenceFile(file) {
  if (!file) return null;
  const at = path.resolve(String(file));
  let raw;
  try {
    const text = readLicenceText(at);
    if (text == null) return null;
    raw = text.replace(/^\uFEFF/, "").trim();
  } catch (e) {
    if (e && BUSY.indexOf(e.code) >= 0) {
      const doc = {};
      doc[HELD_MARK] = String(e.code);
      return doc;
    }
    return { malformed: true };
  }
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return { malformed: true };
    return parsed;
  } catch { /* the assignment form, below */ }
  const name = raw.indexOf("E_LICENSE");
  const eq = name < 0 ? -1 : raw.indexOf("=", name);
  if (eq < 0) return { malformed: true };
  try {
    const parsed = JSON.parse(raw.slice(eq + 1).trim().replace(/;\s*$/, ""));
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return { malformed: true };
    return parsed;
  }
  catch { return { malformed: true }; }
}

/* WHY A FILE CANNOT BE USED, as a code the screen says in either language and a sentence the
   command line and the record keep in English. `nokey` is this program's fault and is worded as
   one. */
const REASONS = {
  unreadable: "the file cannot be read as a licence",
  format: "the file is a licence of another format than this version reads",
  signature: "the signature does not match the file",
  nokey: "this copy of Etiuda Studio carries no key to check a licence with yet",
  delegation: "the delegation the file carries does not let its key sign this licence on the day it was issued",
  delegator: "the delegation the file carries was not signed by the vendor root",
  revoked: "the key that signed the file has been revoked by Etiuda",
};
const invalid = reason => ({ valid: false, reason, error: REASONS[reason] });

/* ONE SHAPE PER FORMAT: format 3 states a positive whole number of seats and carries no names;
   format 2 names its persons, as it always did, and anything else it carries is what it carried. */
function shapeOk(doc) {
  const count = doc.format === NAMED_FORMAT
    ? Array.isArray(doc.persons) && doc.persons.length > 0
      && doc.persons.every(p => typeof p === "string" && p.trim() !== "")
    : Number.isSafeInteger(doc.seats) && doc.seats > 0 && !("persons" in doc);
  return typeof doc.org === "string" && doc.org.trim() !== "" && count
    && DATE.test(String(doc.updatesUntil || ""));
}

/* THE DELEGATION A LICENCE MAY CARRY (`via`, licence service S1). The root key stays offline and never signs online, so
   it certifies the licence service's key with an `etiuda-delegation`, the very document the relay's grants already carry
   (the pinned relay/core.cjs: DELEGATION_KIND, DELEGATION_FIELDS, delegationBytes). The kind and the field names are
   written out here and the bytes and the longest span are read through src/sign.mjs's delegationRules, so a delegation
   Studio accepts is one the relay accepts. THE WINDOW IS THE LICENCE'S OWN `issued` DAY AGAINST THE UTC DAYS OF `from`
   AND `until`, NEVER TODAY: a licence goes on working after its delegation ends (the file's header; decisions 2026-10-20 11:51). */
const DELEGATION_KIND = "etiuda-delegation";
const DELEGATION_FIELDS = ["kind", "format", "key", "may", "from", "until", "sig"];
const MAY_MAX = 16;
const plain = v => !!v && typeof v === "object" && !Array.isArray(v);
const exactly = (o, names) => Object.keys(o).every(k => names.includes(k)) && names.every(k => Object.hasOwn(o, k));
const utcDay = ms => { const t = new Date(ms); return Number.isNaN(t.getTime()) ? null : t.toISOString().slice(0, 10); };

/** True where `d` is a delegation that lets its key sign a licence issued on `issued`: shape, `may`, span and window.
 *  The root's signature is judged after this, never before. */
function delegationCovers(d, issued, rules) {
  if (!plain(d) || d.kind !== DELEGATION_KIND || d.format !== 1 || !exactly(d, DELEGATION_FIELDS)) return false;
  if (!plain(d.key) || !exactly(d.key, ["id", "pub"]) || !rules.isId(d.key.id) || !/^[0-9a-f]{64}$/.test(String(d.key.pub))) return false;
  if (!Array.isArray(d.may) || d.may.length < 1 || d.may.length > MAY_MAX || !d.may.every(m => typeof m === "string")) return false;
  if (!plain(d.sig) || !exactly(d.sig, ["alg", "keyId", "value"]) || d.sig.alg !== "ed25519" || !rules.isId(d.sig.keyId)
      || !/^[0-9a-f]{128}$/.test(String(d.sig.value))) return false;
  if (!Number.isSafeInteger(d.from) || !Number.isSafeInteger(d.until)) return false;
  if (d.until <= d.from) return false; /* plant:via-order */
  if (!d.may.includes("licence")) return false; /* plant:via-may */
  if (d.until - d.from > rules.maxMs) return false; /* plant:via-span */
  const first = utcDay(d.from), last = utcDay(d.until);
  if (!first || !last || !DATE.test(String(issued || ""))) return false;
  return first <= issued && issued <= last; /* plant:via-window */
}

/* THE REVOKED KEYS' LIST (S6), signed by the root over a line form, as the licence service's requests are: the kind's line,
   the serial, the keys' public halves sorted and comma-joined. Its shape is exact: a whole serial from 1, at most
   REVOKED_MAX keys, each 64 hex, strictly in order so none is named twice. */
const REVOCATIONS_KIND = "etiuda-revocations";
const REVOKED_FILE = "etiuda-studio-revoked.json", REVOKED_COPY = "etiuda-studio-revoked-kept.json";
const REVOKED_MAX = 256;
const REVOCATION_FIELDS = ["kind", "format", "serial", "keys", "sig"];
const revocationBytes = r => Buffer.from(REVOCATIONS_KIND + "\n" + r.serial + "\n" + r.keys.join(","), "utf8");
function revocationsShaped(r) {
  if (!plain(r) || r.kind !== REVOCATIONS_KIND || r.format !== 1 || !exactly(r, REVOCATION_FIELDS)) return false;
  if (!Number.isSafeInteger(r.serial) || r.serial < 1 || !Array.isArray(r.keys) || r.keys.length > REVOKED_MAX) return false;
  if (!r.keys.every((k, i) => /^[0-9a-f]{64}$/.test(String(k)) && (i === 0 || r.keys[i - 1] < k))) return false;
  return plain(r.sig) && exactly(r.sig, ["alg", "keyId", "value"]) && r.sig.alg === "ed25519"
    && typeof r.sig.keyId === "string" && /^[0-9a-f]{128}$/.test(String(r.sig.value));
}
/** True where `r` is a revoked keys' list of the exact shape that the root whose public half is `trusted` signed. */
function revocationsHold(r, trusted) {
  if (!revocationsShaped(r) || !/^[0-9a-f]{64}$/.test(String(trusted || ""))) return false;
  try {
    const key = crypto.createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"),
      Buffer.from(trusted, "hex")]), format: "der", type: "spki" });
    return crypto.verify(null, revocationBytes(r), key, Buffer.from(r.sig.value, "hex")); /* plant:revoked-sig */
  } catch { return false; }
}
/** Where the list is kept: beside the licence file. */
function revokedFileFor(licenceFile) { return path.join(path.dirname(path.resolve(String(licenceFile || ""))), REVOKED_FILE); }
/** Its second copy, beside it, written with it, so one file deleted, locked, broken or put back older never clears a list that held. */
function revokedCopyFor(licenceFile) { return path.join(path.dirname(path.resolve(String(licenceFile || ""))), REVOKED_COPY); }
/** The list at `file` where the root `trusted` signed it, else null. */
function readRevocations(file, trusted) {
  try {
    const r = JSON.parse(fs.readFileSync(String(file), "utf8").replace(/^\uFEFF/, ""));
    return revocationsHold(r, trusted) ? r : null;
  } catch { return null; }
}
/**
 * Whether `next` may replace `kept` (either may be null): {take, why}. It is taken only where the root signed it, and, where
 * a list is kept, its serial is higher and it names every key the kept one names, so the list never rolls back; the same list
 * again is kept as it is.
 */
function laterRevocations(kept, next, trusted) {
  if (next === null || next === undefined) return { take: false, why: "none" };
  if (!revocationsHold(next, trusted)) return { take: false, why: "unsigned" };
  if (!kept) return { take: true, why: null };
  if (next.serial === kept.serial && next.keys.join(",") === kept.keys.join(",")) return { take: false, why: "same" };
  if (next.serial <= kept.serial) return { take: false, why: "older" }; /* plant:revoked-serial */
  if (!kept.keys.every(k => next.keys.includes(k))) return { take: false, why: "fewer" }; /* plant:revoked-fewer */
  return { take: true, why: null };
}
/**
 * The list kept beside `licenceFile` that holds: of its two copies, the one with the higher serial, which names every key the
 * other names (laterRevocations), else null. Nothing that holds is no list, and revokes nothing, so a good licence keeps working.
 */
function keptRevocations(licenceFile, trusted, handed) {
  const onDisk = diskRevocations(licenceFile, trusted);
  /* THE NEWEST LIST EVER SEEN beside this licence (review xi, A3): this process's, and the shell's snapshot where handed in. */
  const key = listKey(licenceFile, trusted), mem = SEEN.lists.get(key) || null;
  const before = mergedRevocations(mem, seenList(handed));
  const merged = mergedRevocations(onDisk, before);
  if (merged && (!mem || merged.serial > mem.serial || merged.keys.length > mem.keys.length)) {
    SEEN.lists.set(key, { serial: merged.serial, keys: merged.keys.slice() });
    tellSeen();
  }
  return mergedRevocations(onDisk, before); /* plant:seen-list */
}
/** The list the two files beside `licenceFile` hold, alone: the higher serial of the copies that hold, else null. What is seen
 *  is not read, so a list deleted or broken on disk shows here, and the quiet check is asked to bring it back (planFor). */
function diskRevocations(licenceFile, trusted) {
  const first = readRevocations(revokedFileFor(licenceFile), trusted);
  let copy = null;
  copy = readRevocations(revokedCopyFor(licenceFile), trusted); /* plant:revoked-copy */
  if (!first || !copy) return first || copy;
  return copy.serial > first.serial ? copy : first;
}
/**
 * Two lists as one that takes no key off (review xi, A3): the later serial, naming every key either names; a list read from
 * disk that already names every key at a serial no older is itself. Each is a root-signed list or a kept {serial, keys};
 * either may be null.
 */
function mergedRevocations(disk, before) {
  if (!before) return disk || null;
  if (!disk) return { serial: before.serial, keys: before.keys.slice() };
  const keys = Array.from(new Set(disk.keys.concat(before.keys))).sort();
  if (keys.length === disk.keys.length && disk.serial >= before.serial) return disk;
  return { serial: Math.max(disk.serial, before.serial), keys };
}
/** A kept list's shape, {serial, keys}, as the snapshot carries it; else null. */
function seenList(r) {
  return plain(r) && Number.isSafeInteger(r.serial) && r.serial >= 1 && Array.isArray(r.keys) && r.keys.length <= REVOKED_MAX
    && r.keys.every(k => /^[0-9a-f]{64}$/.test(String(k))) ? { serial: r.serial, keys: r.keys.map(String) } : null;
}
/** The revoked keys `o` names (`o.revoked`, a list of public halves), else the list kept beside `o.file`, else none. */
function revokedOf(o, trusted) {
  const opts = o || {};
  if (Array.isArray(opts.revoked)) return opts.revoked.map(String);
  if (!opts.file) return [];
  const r = keptRevocations(opts.file, trusted, opts.seen && opts.seen.revoked);
  return r ? r.keys.slice() : [];
}

/* A TRIAL'S SHAPE: an `issued` day, an end in milliseconds, and nothing a full licence counts by, so neither form can be
   read as the other. */
function trialShapeOk(doc) {
  return Number.isSafeInteger(doc.ends) && doc.ends > 0 && DATE.test(String(doc.issued || ""))
    && !("updatesUntil" in doc) && !("seats" in doc) && !("persons" in doc);
}

/** How many seats a licence of either format holds; a format-2 file's names are counted, never kept. */
const seatsOf = doc => (doc.format === NAMED_FORMAT ? doc.persons.length : doc.seats);

/**
 * Structure first, then the Ed25519 signature: the vendor root's own, as ever, so a licence the root signed is accepted
 * whatever else it carries and none accepted before is refused. Failing that, where the licence carries a `via`, the
 * delegation is judged in full, then the root's signature on it, then the licence's signature under the key it certifies.
 * @returns {Promise<{valid:boolean, reason:string|null, error:string|null}>}
 */
async function verifyLicence(doc, o) {
  if (!doc || typeof doc !== "object" || doc.malformed || (doc.kind !== LICENCE_KIND && doc.kind !== TRIAL_KIND)) /* plant:txlh-kind */
    return invalid("unreadable");
  if (doc.kind === TRIAL_KIND) {
    if (doc.format !== TRIAL_FORMAT) return invalid("format");
    if (!trialShapeOk(doc)) return invalid("unreadable"); /* plant:trial-shape */
  } else {
    if (doc.format !== LICENCE_FORMAT && doc.format !== NAMED_FORMAT) return invalid("format");
    if (!shapeOk(doc)) return invalid("unreadable");
  }
  const trusted = contextOf(o).trustedKey;
  if (!trusted) return invalid("nokey");
  /* KEPT, decision 44 (Claude alpha, 2026-11-13): a licence the root signs by hand, offline, is the emergency route, the one way to
     a licence besides signing in; it is this line and the client's E2 alone. */
  if (await verifySignature(doc, trusted)) return { valid: true, reason: null, error: null, root: true }; /* plant:root-first */
  if (doc.via === undefined) return invalid("signature"); /* plant:via-absent */
  const rules = delegationRules();
  if (!delegationCovers(doc.via, doc.issued, rules)) return invalid("delegation"); /* plant:txlh-today */
  if (!rules.signedBy(doc.via, trusted)) return invalid("delegator"); /* plant:via-root */
  /* The licence names the key that signed it, and the relay refuses a grant whose key id is not its delegation's (via-key). */
  if (!doc.sig || doc.sig.keyId !== doc.via.key.id) return invalid("signature"); /* plant:via-key */
  if (!await verifySignature(doc, doc.via.key.pub)) return invalid("signature"); /* plant:via-licence */
  /* A key the root revoked (the list `o.revoked` names, or the one kept beside `o.file`) signs nothing accepted (S6). */
  if (revokedOf(o, trusted).includes(doc.via.key.pub)) return invalid("revoked"); /* plant:revoked */
  return { valid: true, reason: null, error: null };
}

/**
 * Whether `via`, a delegation another signed document carries, lets its key sign for "licence" on the UTC day `day` (YYYY-MM-DD),
 * the root this copy trusts signed it, and the root has not revoked its key (`o` as verifyLicence's: o.revoked or o.file). The
 * document's own signature, under via.key.pub, is the caller's to check (a desk's seat certificate, src/desk-seat.mjs).
 */
function viaHolds(via, day, o) {
  const trusted = contextOf(o).trustedKey;
  if (!trusted) return false;
  const rules = delegationRules();
  if (!delegationCovers(via, day, rules)) return false;
  if (!rules.signedBy(via, trusted)) return false;
  return !revokedOf(o, trusted).includes(via.key.pub);
}

/* THE CLOCK A TRIAL IS READ BY, in milliseconds: the latest of `now` (ms, or a date or time as text; this computer's clock
   when absent) and the UTC start of each day named, so a clock set back reads as the last day this copy is sure has come. */
function trialNow(now, days) {
  let at = typeof now === "number" ? now : now != null && String(now) !== "" ? Date.parse(String(now)) : Date.now();
  if (!Number.isFinite(at)) at = Date.now();
  for (const d of days) {
    const day = dateOr(String(d || "").slice(0, 10));
    const t = day ? Date.parse(day + "T00:00:00Z") : NaN;
    if (Number.isFinite(t)) at = Math.max(at, t); /* plant:trial-floor */
  }
  return at;
}

/** Paid end from a licence's `paidUntil` (ms integer, or YYYY-MM-DD whose last paid day still works), or null when absent. */
function paidEnd(v) {
  if (typeof v === "number" && Number.isFinite(v)) return { ms: v, until: localDay(new Date(v)) };
  if (typeof v === "string" && DATE.test(v)) return { ms: Date.parse(v + "T00:00:00Z") + 86400000, until: v }; /* plant:paid-day-string */
  return null;
}

/** A file the system would not open, over a licence this computer verified there that is running: open, so it never stops a
 *  paying lead. */
function heldOpen(root) {
  return Object.assign({
    status: "held", canPublish: true, paused: false,
    trial: null, unusable: null,
  }, root === true ? { root: true } : {});
}
/** A file the system would not open, with no licence verified there on this computer: no licence, and it says why. */
function unreadHeld(file, code) {
  return { status: "none", paused: false, canPublish: false, trial: null,
    unusable: { file: file || null, reason: "unreadable", error: REASONS.unreadable + (typeof code === "string" && code ? " (" + code + ")" : "") } };
}

/* ---- what this computer has seen (review xi) ---------------------------------------------------------------------- */

/* This process's: the licence verified at each path, the newest list beside each licence (by its folder and the root), and the
   newest time seen, with the `issued` day it is anchored to. `told` is the time last handed to onSeen's listener. */
const SEEN = { floor: 0, anchor: 0, told: 0, licences: new Map(), lists: new Map() };
const SEEN_STEP = 3600000;
let seenListener = null;
const fileKey = (file) => path.resolve(String(file || ""));
const listKey = (file, trusted) => path.dirname(fileKey(file)) + "|" + String(trusted || "");
function tellSeen() { if (typeof seenListener === "function") { try { seenListener(); } catch { /* the keeper's own fault */ } } }
/** `fn` is called with nothing whenever what is seen changes in a way worth keeping; null stops it. */
function onSeen(fn) { seenListener = typeof fn === "function" ? fn : null; }
/** What this process has seen for the licence at `file` under the root `trusted`, as plain JSON: {floor, anchor, revoked, licence}. */
function seenNow(file, trusted) {
  const lic = SEEN.licences.get(fileKey(file)) || null, list = SEEN.lists.get(listKey(file, trusted)) || null;
  return { floor: SEEN.floor, anchor: SEEN.anchor, revoked: list ? { serial: list.serial, keys: list.keys.slice() } : null,
    licence: lic ? JSON.parse(JSON.stringify(lic)) : null };
}
/** Takes a snapshot back (one whose mark the caller has checked): it only adds, never lowers what this process holds. */
function seenFrom(snap, file, trusted) {
  if (!plain(snap)) return;
  if (Number.isSafeInteger(snap.anchor) && snap.anchor > SEEN.anchor) SEEN.anchor = snap.anchor;
  if (Number.isSafeInteger(snap.floor) && snap.floor > SEEN.floor) { SEEN.floor = snap.floor; SEEN.told = snap.floor; }
  const key = listKey(file, trusted), had = SEEN.lists.get(key) || null, merged = mergedRevocations(had, seenList(snap.revoked));
  if (merged) SEEN.lists.set(key, { serial: merged.serial, keys: merged.keys.slice() });
  if (plain(snap.licence) && !SEEN.licences.has(fileKey(file))) SEEN.licences.set(fileKey(file), snap.licence);
}
const seenBytes = (snap) => Buffer.from("etiuda-studio-seen" + String.fromCharCode(10) + JSON.stringify(snap), "utf8");
/** The SHA-256, 64 hex, of `snap`'s bytes: what the shell seals with the system's keyring beside the snapshot, so a snapshot edited or
 *  put back from another computer is not taken (the shell's seenStart), without opening the signing key at each change. */
function seenDigest(snap) { return crypto.createHash("sha256").update(seenBytes(snap)).digest("hex"); }
/** The mark, 128 hex, of `snap` by the private half `privateKey` (a KeyObject: this Studio's own signing key). */
function seenSign(snap, privateKey) { return crypto.sign(null, seenBytes(snap), privateKey).toString("hex"); }
/** Whether `mark` is the mark of `snap` by the key whose public half is `pub` (64 hex). */
function seenHolds(snap, mark, pub) {
  if (!plain(snap) || !/^[0-9a-f]{128}$/.test(String(mark || "")) || !/^[0-9a-f]{64}$/.test(String(pub || ""))) return false;
  try {
    const key = crypto.createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(pub, "hex")]), format: "der", type: "spki" });
    return crypto.verify(null, seenBytes(snap), key, Buffer.from(mark, "hex"));
  } catch { return false; }
}
/**
 * The newest time seen (review xi, A4), moved on by `at` and anchored to the licence's `issued` day: a licence issued later
 * than the anchor rights a time carried ahead, to the later of its day and `at`; otherwise it never moves back. `S` is this
 * process's (and then a step worth keeping is told) or a handed snapshot's copy.
 */
function floorOf(S, at, issued) {
  const day = dateOr(String(issued || "").slice(0, 10)), issuedAt = day ? Date.parse(day + "T00:00:00Z") : NaN;
  const was = { floor: S.floor, anchor: S.anchor };
  if (Number.isFinite(issuedAt) && issuedAt > S.anchor) { S.anchor = issuedAt; S.floor = Math.max(issuedAt, at); }
  else S.floor = Math.max(S.floor, at);
  if (S === SEEN && (S.anchor !== was.anchor || S.floor - S.told >= SEEN_STEP || S.floor < was.floor)) { S.told = S.floor; tellSeen(); }
  return S.floor;
}
/** The clock's keeper for one call: a handed snapshot's copy, this process's where no clock was handed in, else none. */
function floorFor(opts) {
  if (plain(opts.seen)) return { floor: Number(opts.seen.floor) || 0, anchor: Number(opts.seen.anchor) || 0, told: 0 };
  return opts.now == null ? SEEN : null;
}
/**
 * The clock a seat certificate is read by (review xi, A4; the gate on it, Max 2026-11-22 15:37): the latest of `opts.now` (this computer's
 * clock when absent), the start of `issued`'s day (ms or YYYY-MM-DD: a day the service has certainly seen) and the newest time seen, as
 * licenceState reads a licence by; `issued` later than the anchor rights a time carried ahead.
 */
function clockFor(o, issued) {
  const opts = o || {};
  const day = typeof issued === "number" && Number.isFinite(issued) ? new Date(issued).toISOString().slice(0, 10) : dateOr(String(issued || "").slice(0, 10));
  const at = trialNow(opts.now, [day]);
  const S = floorFor(opts);
  return S ? floorOf(S, at, day) : at;
}
/** The licence verified at `file`, as the snapshot handed in or this process holds it; else null. */
function verifiedAt(opts, file) {
  if (plain(opts.seen)) return plain(opts.seen.licence) ? opts.seen.licence : null;
  return file ? SEEN.licences.get(file) || null : null;
}

/**
 * The state publishing acts on and the cover says.
 * @param {object|null} doc  a readLicenceFile answer, or null for no file
 * @param {object} [o]  o.file (named in `unusable`, and beside which the revoked keys' list is kept), o.revoked (a list
 *                      that stands in for the kept one), o.now (the trial's clock),
 *                      o.seen (what the shell has seen, seenNow's snapshot, which the publish thread is handed),
 *                      o.trustedKey (a development tree only; see contextFor)
 */
async function licenceState(doc, o) {
  const opts = o || {};
  const file = opts.file ? fileKey(opts.file) : "";
  if (doc && doc[HELD_MARK]) {
    /* Held: only a licence this computer verified at that path, read again by its own dates and the floor (review xi, A1). */
    const before = verifiedAt(opts, file);
    if (!before || before[HELD_MARK]) return unreadHeld(file, doc[HELD_MARK]); /* plant:seen-held */
    const again = await licenceState(before, opts);
    if (again.status === "trial" || again.status === "active") return heldOpen(again.root === true); /* plant:held-open */
    return again;
  }

  const ver = doc ? await verifyLicence(doc, opts) : null;
  /* What this computer verified at the path, kept for a later held read; a missing file, or one that reads and is no licence,
     forgets it. A handed snapshot is the shell's, and is not written here. */
  if (file && !plain(opts.seen)) {
    const had = SEEN.licences.get(file) || null;
    if (doc && ver.valid) {
      if (!had || JSON.stringify(had) !== JSON.stringify(doc)) { SEEN.licences.set(file, doc); tellSeen(); }
    } else if (had) { SEEN.licences.delete(file); tellSeen(); }
  }
  if (!doc || !ver.valid) {
    /* NO LICENCE: a missing file, or one that cannot be used, which names itself and why. It stops; nothing counts a period for it. */
    return {
      status: "none", canPublish: false, paused: false, trial: null,
      unusable: doc ? { file: opts.file ? path.resolve(String(opts.file)) : null,
                        reason: ver.reason, error: ver.error } : null,
    };
  }

  /* A LICENCE THE ROOT SIGNED BY HAND (decision 44's emergency route, kept by Max's ruling of 2026-11-22 15:37 as the one narrow path for a
     customer who cannot sign in) says so, `root`, for it alone makes Studio work with no seat certificate (the shell's studioWorks). */
  const root = ver.root === true ? { root: true } : {};
  /* plant:eval-ended stood on the evaluation period's end, which is gone with the period; the mark stays until the plant guard has a way to retire one. */

  /* THE CLOCK THIS LICENCE IS READ BY: the latest of this computer's clock and the licence's issued day, and the newest time
     this computer has seen (review xi, A4); never an archive folder's name (B6). */
  let at = trialNow(opts.now, [doc.issued]); /* plant:paid-floor */
  const S = floorFor(opts);
  if (S) at = floorOf(S, at, doc.issued); /* plant:seen-floor */

  /* A TRIAL'S LICENCE: a licence until its end by the clock above, then the pause the record names. No release date locks
     it, as it states no updates; its end is the one date it carries. */
  if (doc.kind === TRIAL_KIND) {
    const over = at >= doc.ends; /* plant:trial-over */
    return {
      ...root, status: over ? "trial-ended" : "trial", unusable: null,
      canPublish: !over, paused: over,
      trial: { until: localDay(new Date(doc.ends)), ends: doc.ends, over, signed: true },
      org: null, contact: "", seats: null, devicesEach: null, edition: String(doc.edition || "studio"),
      issued: String(doc.issued), updatesUntil: null,
    };
  }

  const base = {
    ...root, unusable: null, trial: null, paused: false,
    org: String(doc.org), contact: String(doc.contact || ""),
    seats: seatsOf(doc), devicesEach: DEVICES_PER_SEAT,
    edition: String(doc.edition || "studio"), issued: String(doc.issued || ""),
    updatesUntil: String(doc.updatesUntil),
  };
  const end = paidEnd(doc.paidUntil);
  if (end) {
    const over = at >= end.ms; /* plant:paid-over */
    if (over) return Object.assign(base, { status: "paid-ended", canPublish: false, paused: true, paidUntil: end.until });
  }
  return Object.assign(base, { status: "active", canPublish: true });
}

/** One line of English, for the command line and the record. */
function formatLicenceHeader(state) {
  const s = state || {};
  if (s.status === "trial") return "Trial licence until " + s.trial.until;
  if (s.status === "trial-ended")
    return "The trial ended on " + s.trial.until + " · publishing, reading statistics and taking proposals are paused";
  if (s.status === "paid-ended")
    return "The paid period ended on " + s.paidUntil + " · publishing, reading statistics and taking proposals are paused";
  if (s.status === "held") return HELD_SAID;
  if (s.status === "active")
    return s.org + " · " + s.seats + " seat" + (s.seats === 1 ? "" : "s") + ", "
      + s.devicesEach + " devices each · updates until " + s.updatesUntil;
  return "No licence"
    + (s.unusable ? " · " + (s.unusable.file || "the licence file") + " was not used: "
      + s.unusable.error : "");
}

/**
 * A signed licence, for the gates and for the vendor's own issuing script: format 3, one seat
 * unless the fields say how many. A gate that wants a format-2 file passes `format: 2` and its
 * `persons`, and then no seat count is added.
 * @param {object} fields  org, seats, updatesUntil and the rest
 */
async function createTestLicence(fields, privateKey, keyId) {
  const doc = Object.assign({
    format: LICENCE_FORMAT,
    kind: LICENCE_KIND,
    org: "Test Org",
    contact: "test@example.com",
    edition: "studio",
    features: ["publish", "sign", "ai"],
    issued: "2026-09-01",
    updatesUntil: "2027-09-01",
  }, fields || {});
  if (!("seats" in doc) && !("persons" in doc)) doc.seats = 1;
  return signDocument(doc, { privateKey, keyId: String(keyId || "vendor-root") });
}

/**
 * A trial's licence, signed as the licence service signs one, for the gates: `ends` (ms), `issued` and `via` from the fields,
 * the given private half signing.
 */
async function createTestTrialLicence(fields, privateKey, keyId) {
  const doc = Object.assign({ kind: TRIAL_KIND, format: TRIAL_FORMAT, edition: "studio", issued: "2026-09-01",
    ends: Date.parse("2026-09-15T00:00:00Z") }, fields || {});
  return signDocument(doc, { privateKey, keyId: String(keyId || "vendor-root") });
}

/**
 * A revoked keys' list signed as the root signs one, for the gates: `keys` (public halves, any order) and `serial`. The
 * vendor's own will be made offline, as a delegation is, by a command not yet written (S7's or after).
 */
function createTestRevocations(fields, rootPrivateKey, rootKeyId) {
  const f = fields || {};
  const r = { kind: REVOCATIONS_KIND, format: 1, serial: f.serial === undefined ? 1 : f.serial,
              keys: Array.from(new Set((f.keys || []).map(String))).sort(),
              sig: { alg: "ed25519", keyId: String(rootKeyId || "etiuda-root") } };
  r.sig.value = crypto.sign(null, revocationBytes(r), rootPrivateKey).toString("hex");
  return r;
}

/**
 * A delegation signed as the root signs one, for the gates and for the vendor's own issuing script: `key` ({id, pub}) may
 * do `may` from `from` until `until` (milliseconds). The licence it certifies is made with createTestLicence, the
 * delegation in `via` and the certified key's private half signing.
 * @param {object} fields  key, may, from, until
 */
function createTestDelegation(fields, rootPrivateKey, rootKeyId) {
  const f = fields || {};
  const d = { kind: DELEGATION_KIND, format: 1, key: f.key, may: f.may, from: f.from, until: f.until,
              sig: { alg: "ed25519", keyId: String(rootKeyId || "etiuda-root") } };
  d.sig.value = crypto.sign(null, delegationRules().bytes(d), rootPrivateKey).toString("hex");
  return d;
}

export {
  readLicenceFile, verifyLicence, viaHolds, licenceState, formatLicenceHeader, createTestLicence, createTestDelegation, createTestTrialLicence,
  defaultLicenceFile, contextFor, packagedAt, releasedIn, localDay, trustedKeyNow,
  revocationsHold, readRevocations, laterRevocations, revokedFileFor, revokedCopyFor, keptRevocations, diskRevocations, createTestRevocations,
  seenNow, seenFrom, onSeen, seenSign, seenHolds, seenDigest, clockFor,
  LICENCE_KIND, LICENCE_FORMAT, LICENCE_FILE, LICENCE_FILE_MAX, DEVICES_PER_SEAT, TRIAL_DAYS, TRIAL_KIND, TRIAL_FORMAT, TRIAL_PAUSED, HELD_SAID, REVOCATIONS_KIND, REVOKED_FILE,
  EMBEDDED_VENDOR_ROOT_KEY, PACKAGED,
};
