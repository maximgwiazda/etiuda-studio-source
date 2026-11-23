/* THE RING: THE FILE THAT TELLS A DESK WHICH KEY TO TRUST FOR WHICH CATALOG. Board 605, ruled
 * by Maxim on 2026-09-20 at 21:37.
 *
 *     import { RING_FILE, entryFor, addToRing, readRingFile } from "./src/ring.mjs";
 *
 * THE ENGINE READS IT AND STUDIO WRITES IT, and the format is the engine's own: one JSON
 * document beside the catalogs, a LIST of entries, each entry binding ONE public key to ONE
 * catalog id. A key listed for one catalog says nothing about another. The shape, the file name
 * and the two header fields are declared in the engine's src/modules/catalog-v2.js (V2_RING_FILE,
 * V2_RING_FORMAT, V2_RING_KIND, v2RingRead) and restated here for the same reason SIG_ALG is
 * restated in src/sign.mjs: they are three constants a writer cannot function without, and
 * tests/catalog-sig.mjs holds all three equal to the engine's own declarations, so a drift is a
 * red gate rather than a file a desk quietly drops.
 *
 * WHY THERE IS NO READER HERE, and why the merge below is not one. CLAUDE.md forbids a second
 * implementation of anything the engine declares, and the engine's reader is v2RingRead: it
 * folds the file into {catalog:{keyId:public}} and drops what it cannot use. That is the right
 * answer for a desk and the wrong one for a writer, because folding loses the order, the notes
 * and every field this build does not know. So the merge below reads the file as JSON and
 * treats every entry already in it as OPAQUE - it is copied through untouched, whatever it says
 * - and validates exactly one thing, the entry it is about to add. Studio therefore never
 * decides whether somebody else's entry is good; the desk does, which is where that decision
 * belongs.
 *
 * WHEN AN ENTRY IS WRITTEN, which is the sharp edge of the ruling. An entry binds a key to a
 * CATALOG ID, and a key is made with no catalog in view (at a press in Settings, or by the first
 * publish or seal before anything is signed), so there is no entry to write when a key is made
 * and this module is not called there. It is called at PUBLISH, when a key has just signed a
 * catalog whose id is therefore known and correct, and the ring is written into the same folder
 * as the .ec, which is the folder the desks read. A key that has never signed anything has no
 * entry anywhere, and that is not a gap: there is nothing to say about it yet. `node tools/sign.mjs
 * ring` is the other door, for a lead who knows the id before the first publication or who is
 * writing a ring for a catalog published elsewhere.
 *
 * THE RING BESIDE THE CATALOG IS AS TRUSTWORTHY AS THE SHARE. Anybody who can replace the .ec on
 * a share can replace the ring beside it. A desk outside any team reads this one file in its own
 * catalog folder and trusts what it lists; a desk that has joined a team trusts the lead key it
 * pinned when it joined, and the ring adds nothing for it (the engine's catalogLeadOk, and its
 * badge too once the engine's trust-pin lands). Nobody carries this file by hand.
 * docs/signing-keys.md says this to the lead.
 *
 * IT NEVER WRITES A PRIVATE KEY, which is the one failure here that would be catastrophic and
 * silent, and the guarantee is structural rather than careful: this module imports neither
 * unlockKey nor crypto, takes no passphrase in any argument, and builds an entry only out of a
 * readKeyFile result, whose whole content is the keyId and the public half. There is no path
 * through this file along which a private key could arrive. tests/catalog-sig.mjs 6c searches
 * the written bytes as well, because a structural argument that nobody rechecks is a comment.
 *
 * THE SENTENCES BELOW ARE ENGLISH `throw new Error`, deliberately: each names a file or a tool
 * and reports a fault in the machinery rather than in what a person did, which is the
 * repository's line between a plain throw and a refusal frame. The day the ring gets a screen,
 * every one of these that a person can cause becomes a frame in src/refusal.mjs with a Polish
 * pair, and tests/polish.mjs will say so.
 */
import fs from "node:fs";
import path from "node:path";
import { readKeyFile } from "./sign.mjs";
import * as Engine from "./engine.mjs";
import { writeWhole } from "./whole-write.cjs";
import { jsonText as json } from "./plain-json.mjs";

/* The engine's V2_RING_FILE, V2_RING_KIND and V2_RING_FORMAT. Asserted equal, not assumed. */
const RING_FILE = "etiuda-ring.json";
const RING_KIND = "etiuda-ring";
const RING_FORMAT = 1;


/** The ring file that goes beside a catalog in a folder. */
function ringPath(folder) { return path.join(path.resolve(String(folder || ".")), RING_FILE); }

/** An empty ring, which is what a folder that has none is treated as. */
function emptyRing() { return { format: RING_FORMAT, kind: RING_KIND, keys: [] }; }

/**
 * The file as it stands, or null where there is none. It REFUSES rather than returning an empty
 * ring on anything it does not recognise, because the caller's next act is to write the file
 * back: a ring Studio could not read is a ring Studio must not replace. The desk's own reader
 * does the opposite and is right to - an unreadable ring there costs a customer nothing but the
 * trust it would have added, while here it would cost them the file.
 */
function readRingFile(file) {
  const at = path.resolve(String(file || ""));
  if (!fs.existsSync(at)) return null;
  let doc;
  try { doc = JSON.parse(fs.readFileSync(at, "utf8").replace(/^\uFEFF/, "")); }
  catch (e) {
    throw new Error("the ring at " + at + " is not JSON: " + e.message + "; it has not been"
      + " touched. Move it aside yourself if you mean to start again");
  }
  if (!doc || typeof doc !== "object" || Array.isArray(doc) || doc.kind !== RING_KIND)
    throw new Error("the file at " + at + " is not an Etiuda ring (kind "
      + JSON.stringify(doc && doc.kind != null ? doc.kind : null) + "); it has not been touched");
  if (+doc.format !== RING_FORMAT)
    throw new Error("the ring at " + at + " is format " + JSON.stringify(doc.format)
      + " and this Studio writes format " + RING_FORMAT + "; a newer Studio wrote it and"
      + " merging into it would drop what this one cannot see");
  if (!Array.isArray(doc.keys))
    throw new Error("the ring at " + at + " has no list of keys; it has not been touched");
  return { file: at, doc };
}

/**
 * One entry, out of a key file and a catalog id. Both ids are held to the ENGINE'S own id shape
 * rather than to a rule of Studio's, so an entry the desk would drop cannot be written here:
 * v2RingRead tests both against V2_ID_RE and says nothing on a screen when it drops one.
 *
 * @param {object} read   a readKeyFile result: keyId, public, and no private half at all.
 * @param {string} catalogId  the id the catalog declares, which is inside its signed bytes.
 * @param {string} [note]  free text for an administrator. The desk never reads it.
 */
async function entryFor(read, catalogId, note) {
  const F = await Engine.format();
  const id = String(catalogId == null ? "" : catalogId);
  if (!F.idOk(id))
    throw new Error("a ring entry wants the id the catalog declares, and " + JSON.stringify(id)
      + " is not one: an id is 3 to 64 characters of a-z, 0-9 and hyphen, starting with a"
      + " letter or a digit");
  if (!read || !F.idOk(String(read.keyId || "")))
    throw new Error("a ring entry wants a key file whose keyId is an id the format accepts,"
      + " and this one is " + JSON.stringify(read ? String(read.keyId || "") : null));
  if (!/^[0-9a-f]{64}$/.test(String(read.public || "")))
    throw new Error("a ring entry wants the 32-byte public half as 64 lower-case hex"
      + " characters, and this key file's is " + JSON.stringify(String(read.public || "")));
  const entry = { catalog: id, keyId: String(read.keyId),
                  alg: String((read.doc || {}).alg || ""), public: String(read.public) };
  if (note != null && String(note).trim()) entry.note = String(note).trim();
  return entry;
}

/**
 * The entry into the file at `file`, merged. Returns what happened rather than throwing on the
 * ordinary cases, because publish calls this after the catalog is already on disk.
 *
 * MERGING IS APPENDING, AND THAT IS THE WHOLE POINT OF ITEM 2. A rotation leaves the old key
 * trusted while the editions it signed are still in use, so a second entry for one catalog must
 * leave the first exactly where it was; and a second publisher writing into a shared folder must
 * not remove the first one's. Nothing here ever deletes an entry. Taking a key OUT of a ring is
 * an administrator's act on their own copy, with a text editor, and docs/signing-keys.md says so.
 *
 * IT IS READ-MODIFY-WRITE AND IT IS NOT ATOMIC. Two publishes into one share folder at the same
 * instant can lose the later entry, and on a folder one manager publishes into that cannot
 * happen. A lock is the wrong answer on a network share (a stale one strands the folder); the
 * right one, the day two publishers share a folder, is to write a second file rather than merge
 * into one, and the desk reads one ring, in its catalog folder, so that would be a format
 * decision rather than a locking one. Named here because a silent loss of trust material is
 * exactly the kind of thing that gets found a year late.
 *
 * TWO PUBLIC KEYS UNDER ONE KEY ID IS THE ONE CASE THAT REFUSES. The desk keeps the first and
 * says so in a problem line nobody will read; here it means either the key file was replaced
 * under the same name or the ring belongs to somebody else, and both are worth stopping for.
 */
function addToRing(file, entry, o) {
  const dry = !!(o && o.dry);
  const at = path.resolve(String(file || ""));
  const had = readRingFile(at);
  const doc = had ? had.doc : emptyRing();
  const keys = doc.keys;
  const same = keys.filter(e => e && typeof e === "object"
    && String(e.catalog) === entry.catalog && String(e.keyId) === entry.keyId);
  const clash = same.filter(e => String(e.public) !== entry.public);
  if (clash.length)
    throw new Error("the ring at " + at + " already binds key id " + entry.keyId + " to catalog "
      + entry.catalog + " with a different public half; one key id names one key, so this is"
      + " either a replaced key file or somebody else's ring. It has not been touched");
  if (same.length)
    return { file: at, doc, added: false, entries: keys.length,
             why: "that key is already in the ring for " + entry.catalog };
  keys.push(entry);
  /* A DRY RUN IS EVERY CHECK AND NO WRITE, and it exists for publish: every refusal this module
     can raise is raised from what is on disk before the publish writes its first byte, so a
     corrupt ring or an id the format would drop costs the person nothing, exactly as a wrong
     passphrase does. The real call then re-reads, because the file is on a share somebody else
     may have written to in between, and the merge has to be over what is there now. */
  if (dry) return { file: at, doc, added: true, entries: keys.length, dry: true,
                    why: "would " + (had ? "add to" : "write") + " the ring at " + at };
  fs.mkdirSync(path.dirname(at), { recursive: true });
  /* Whole or not at all (src/whole-write.cjs): half a ring is a file readRingFile refuses, which
     would stop every later signed publish into this folder until somebody moved it aside. */
  writeWhole(at, json(doc));
  return { file: at, doc, added: true, entries: keys.length,
           why: (had ? "added to" : "wrote") + " the ring at " + at };
}

/** The whole act, as publish and the command line both want it: key file plus catalog id plus
 *  the folder the catalog went into. */
async function ringFor(o) {
  const opts = o || {};
  const read = typeof opts.key === "string" ? readKeyFile(opts.key) : opts.key;
  if (!read) throw new Error("no signing key file at "
    + path.resolve(String(opts.key || "")));
  const entry = await entryFor(read, opts.catalog, opts.note);
  return addToRing(opts.file ? path.resolve(String(opts.file)) : ringPath(opts.folder), entry,
                   { dry: !!opts.dry });
}

export { RING_FILE, RING_KIND, RING_FORMAT, ringPath, readRingFile, entryFor, addToRing, ringFor };
