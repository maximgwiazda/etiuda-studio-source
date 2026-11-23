/* SIGNING: THE KEY FILE, AND THE BYTES. Board 605, ruled by Maxim on 2026-09-19 at 21:37.
 *
 *     import { makeKeyFile, readKeyFile, unlockKey, signCatalog } from "./src/sign.mjs";
 *
 * WHAT IS SIGNED IS NOT THE FILE. Ed25519 over the canonical form of the document with `hash`
 * off, `sig.value` off, and `sig.alg` and `sig.keyId` on. Two consequences fall straight out of
 * that and both are proved in tests/catalog-sig.mjs rather than assumed: a catalog saved with
 * CRLF verifies exactly as the same catalog saved with LF, because no byte of the file is in
 * the signature; and a key whose value is an explicit `null` is IN the signature, because
 * canonical form keeps a null and drops only an undefined, so anything that quietly normalises
 * a null away between signing and verifying breaks the signature.
 *
 * THE FOLD IS THE ENGINE'S, SLICED, NOT RETYPED - src/engine.mjs sigRules(), and `sigSource()`
 * says which engine it was read from, so a report can never guess. Studio kept a copy of the
 * fold for pins older than the engine's 53023ce until board 858 (P2): the drift gate keeps any
 * such pin out, so the copy could not run.
 *
 * THE PRIVATE HALF IS WRAPPED AND THE PUBLIC HALF IS NOT, so the settings row can show WHICH key
 * their catalogs will carry, and what a desk must be told to trust, without unlocking anything.
 * Two wraps (Maxim, 2026-10-07 20:42, amending 2026-09-19): the key Studio signs with is sealed by
 * the operating system under the lead's own sign-in (`wrap.kdf` "os", opened by the shell's vault
 * and handed here as the secret), and a passphrase wraps only a backup copy, which is the same
 * file a passphrase-wrapped key always was, so the command line still reads one.
 *
 * scrypt AND AES-256-GCM, both from node's own crypto and no dependency added. GCM rather than
 * CBC because a wrong passphrase must FAIL rather than hand back plausible rubbish that then
 * throws somewhere less obvious, and the public half and the keyId are the additional data, so
 * a file whose keyId was edited by hand will not open at all: a key file that could be made to
 * claim another key's name is a key file that can be used to lie about who published.
 *
 * WHAT IS NOT HERE, on purpose (Maxim, 2026-09-19 21:37): no timestamping, no chain, no key
 * fetching, no trust in a clock, no rotation and no revocation. A catalog carries one signature
 * by one key; a desk either knows that key or does not.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import * as Engine from "./engine.mjs";
import { readJson } from "./plain-json.mjs";
import { writeWhole, OWNER_ONLY } from "./whole-write.cjs";

const KEY_KIND = "etiuda-studio-signing-key";
const KEY_SCHEMA = 1;
const SIG_ALG = "Ed25519";                     /* the engine's V2_SIG_ALG; asserted equal */
const KEY_FILE = "signing-key.json";

/* scrypt's cost. N=32768, r=8, p=1 needs 128*N*r = 32 MiB, which is exactly node's default
   maxmem, so the ceiling is raised here rather than the cost lowered: a local file guarded by
   a person's passphrase is worth more than the hundred milliseconds. Measured on this desk at
   about 90 ms per unlock, and a publish unlocks once. */
const KDF = { kdf: "scrypt", N: 32768, r: 8, p: 1, len: 32, maxmem: 96 * 1024 * 1024 };
const CIPHER = "aes-256-gcm";

/* THE OPERATING SYSTEM'S WRAP: `private` is what the shell's vault sealed (base64), and nothing here can open it. */
const OS_WRAP = "os";

/** Where a key file sits when nobody names one: beside Studio's own settings, which is what
 *  "beside Studio" means on a desk - the same folder the shell keeps studio.json in. */
function defaultKeyFile(userData) { return path.join(String(userData || ""), KEY_FILE); }

/* ---- the bytes ------------------------------------------------------------------------------ */

let RULE = null;
/** The fold, from the pinned engine. Cached because a publish asks for it twice and a gate a
 *  hundred times. */
function ruleNow() {
  if (RULE) return RULE;
  const r = Engine.sigRules();
  RULE = { bytes: (cat) => r.v2SignedBytes(cat), alg: r.V2_SIG_ALG, from: r.from };
  return RULE;
}
async function sigRule() { return ruleNow(); }

/** Which statement of the fold this process is using, for a report that must not guess. */
async function sigSource() { return (await sigRule()).from; }

/** The exact bytes Ed25519 signs and a desk verifies. */
async function signedBytes(catalog) {
  const rule = await sigRule();
  return Buffer.from(rule.bytes(catalog));
}

/* ---- the key file --------------------------------------------------------------------------- */

/** The engine's own id shape, so a keyId cannot be something the format would not accept. */
async function keyIdOk(id) {
  const F = await Engine.format();
  return F.idOk(String(id || ""));
}

/** A keyId nobody has to invent: the public key's own fingerprint. Derived rather than random
 *  so that the same key can never appear under two names, and short enough to read aloud. */
function keyIdFor(publicHex) {
  return "studio-" + crypto.createHash("sha256")
    .update(Buffer.from(String(publicHex), "hex")).digest("hex").slice(0, 16);
}

function wrapKey(passphrase, salt) {
  return crypto.scryptSync(Buffer.from(String(passphrase), "utf8"), salt, KDF.len,
    { N: KDF.N, r: KDF.r, p: KDF.p, maxmem: KDF.maxmem });
}

/** The additional data the wrap is bound to: the two fields a reader trusts without the
 *  passphrase. Editing either in the file makes the private half refuse to open. */
function aadOf(keyId, publicHex) {
  return Buffer.from(KEY_KIND + "\n" + keyId + "\n" + publicHex, "utf8");
}

/**
 * Generate a pair and return the key file's content. Nothing is written here; the caller
 * chooses the path, because "beside Studio" is the shell's userData on a desk and a scratch
 * folder in a gate.
 * @param {object} o  o.passphrase (required), o.keyId (optional, derived when absent)
 */
async function makeKeyFile(o) {
  const opts = o || {};
  const passphrase = String(opts.passphrase == null ? "" : opts.passphrase);
  if (!passphrase) throw new Error("a signing key needs a passphrase; pass one with"
    + " --passphrase-file or in STUDIO_KEY_PASSPHRASE");
  return passphraseFile(await makePair(opts.keyId), passphrase);
}

/** A fresh pair: its keyId, its public half and its private half as PKCS#8 DER in hex. Nothing is written or wrapped. */
async function makePair(id) {
  const pair = crypto.generateKeyPairSync("ed25519");
  const publicHex = pair.publicKey.export({ type: "spki", format: "der" })
    .subarray(-32).toString("hex");
  const keyId = String(id || keyIdFor(publicHex));
  if (!await keyIdOk(keyId))
    throw new Error("a keyId is the engine's own id shape (lower case, digits and hyphens,"
      + " 3 to 64 characters): " + JSON.stringify(keyId));
  return { keyId, public: publicHex, der: pair.privateKey.export({ type: "pkcs8", format: "der" }).toString("hex") };
}

/** The key file for `pair` ({keyId, public, der}) under `passphrase`: a key made at the command line, and every backup copy. */
function passphraseFile(pair, passphrase) {
  if (!String(passphrase == null ? "" : passphrase)) throw new Error("a passphrase-wrapped key file needs a passphrase");
  const keyId = String(pair.keyId), publicHex = String(pair.public);
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(CIPHER, wrapKey(passphrase, salt), iv);
  cipher.setAAD(aadOf(keyId, publicHex));
  const der = Buffer.from(String(pair.der), "hex");
  const sealed = Buffer.concat([cipher.update(der), cipher.final()]);
  const file = {
    kind: KEY_KIND, schema: KEY_SCHEMA, alg: SIG_ALG,
    keyId, public: publicHex,
    wrap: { kdf: KDF.kdf, N: KDF.N, r: KDF.r, p: KDF.p, cipher: CIPHER,
            salt: salt.toString("hex"), iv: iv.toString("hex"),
            tag: cipher.getAuthTag().toString("hex") },
    private: sealed.toString("hex"),
  };
  return copyBox(file, pair);
}

/** The key file for `pair` whose private half the shell's vault sealed as `sealed` (bytes): what Studio signs with. */
function osFile(pair, sealed) {
  if (!sealed || !Buffer.from(sealed).length) throw new Error("the operating system sealed nothing, so no key file was made");
  return copyBox({ kind: KEY_KIND, schema: KEY_SCHEMA, alg: SIG_ALG, keyId: String(pair.keyId), public: String(pair.public),
           wrap: { kdf: OS_WRAP }, private: Buffer.from(sealed).toString("base64") }, pair);
}

/** The key file as a reader without the passphrase sees it: the path, the keyId and the public
 *  half, which is everything the settings row shows and everything a desk needs told. Returns
 *  null where there is no file, and throws where there is one that is not a key file: a file
 *  that is there and wrong is a thing to say, and an absent one is a state. */
function readKeyFile(file) {
  const at = path.resolve(String(file || ""));
  if (!fs.existsSync(at)) return null;
  let doc;
  try { doc = readJson(at); }
  catch (e) { throw new Error("the key file at " + at + " is not JSON: " + e.message); }
  if (!doc || doc.kind !== KEY_KIND)
    throw new Error("the file at " + at + " is not an Etiuda Studio signing key");
  if (+doc.schema !== KEY_SCHEMA)
    throw new Error("the key file at " + at + " is schema " + doc.schema + " and this Studio"
      + " reads schema " + KEY_SCHEMA);
  if (doc.alg !== SIG_ALG)
    throw new Error("the key file at " + at + " names algorithm " + JSON.stringify(doc.alg)
      + " and this Studio signs with " + SIG_ALG);
  if (!/^[0-9a-f]{64}$/.test(String(doc.public || "")))
    throw new Error("the key file at " + at + " has no 32-byte public half");
  return { file: at, keyId: String(doc.keyId || ""), public: String(doc.public),
           kept: (doc.wrap || {}).kdf === OS_WRAP ? OS_WRAP : "passphrase", doc };
}

/** The private half, for one signature. `passphrase` is the secret this process was handed: the passphrase of a
 *  passphrase-wrapped file, or for one the operating system keeps, the PKCS#8 DER in hex the shell's vault opened. Never
 *  stored, never logged and never written into the catalog. */
function unlockKey(read, passphrase) {
  const doc = read && read.doc ? read.doc : read;
  const w = (doc || {}).wrap || {};
  if (w.kdf === OS_WRAP) return checkedOpen(doc, () => {
    if (!/^[0-9a-f]+$/.test(String(passphrase || ""))) throw new Error("not opened");
    return crypto.createPrivateKey({ key: Buffer.from(String(passphrase), "hex"), format: "der", type: "pkcs8" });
  }, "the signing key did not open: the sign-in on this computer does not hold it");
  if (w.kdf !== KDF.kdf || w.cipher !== CIPHER)
    throw new Error("the key file's wrap is " + JSON.stringify(w.kdf + "/" + w.cipher)
      + " and this Studio opens " + KDF.kdf + "/" + CIPHER);
  const key = crypto.scryptSync(Buffer.from(String(passphrase == null ? "" : passphrase), "utf8"),
    Buffer.from(String(w.salt || ""), "hex"), KDF.len,
    { N: +w.N || KDF.N, r: +w.r || KDF.r, p: +w.p || KDF.p, maxmem: KDF.maxmem });
  const de = crypto.createDecipheriv(CIPHER, key, Buffer.from(String(w.iv || ""), "hex"));
  de.setAAD(aadOf(String(doc.keyId || ""), String(doc.public || "")));
  de.setAuthTag(Buffer.from(String(w.tag || ""), "hex"));
  let der;
  try { der = Buffer.concat([de.update(Buffer.from(String(doc.private || ""), "hex")),
                             de.final()]); }
  catch (e) {
    /* GCM's tag failing means one of two things and a person cannot tell them apart from here,
       so the sentence names both rather than guessing at the likelier. */
    throw new Error("the key file did not open: the passphrase is wrong, or the file has been"
      + " edited since it was made");
  }
  return checkedOpen(doc, () => crypto.createPrivateKey({ key: der, format: "der", type: "pkcs8" }));
}
function checkedOpen(doc, open, said) {
  let privateKey;
  try { privateKey = open(); } catch (e) { throw new Error(said || (e && e.message) || String(e)); }
  /* THE FILE'S OWN CLAIM IS CHECKED AGAINST THE KEY IT CARRIES. The public half is what a desk
     will be told to trust; a file whose public half does not belong to its private half would
     produce signatures nobody could verify, and it would do it silently. */
  const derived = crypto.createPublicKey(privateKey)
    .export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  if (derived !== String(doc.public))
    throw new Error("the key file's public half is not the public half of the key it carries");
  const opened = { privateKey, keyId: String(doc.keyId || ""), public: derived };
  const packed = boxPack(doc);
  if (packed) opened.box = packed;
  return opened;
}

/** The opened key as a pair passphraseFile or osFile wraps again: how a backup is made and a restore kept. */
function pairOf(open) {
  const out = { keyId: open.keyId, public: open.public,
           der: open.privateKey.export({ type: "pkcs8", format: "der" }).toString("hex") };
  if (open.box) out.box = { public: open.box.public, iv: open.box.iv, ct: open.box.ct };
  return out;
}

/* THE LEAD'S BOX, an X25519 key sealed under the signing key's own seed (HKDF-SHA256, info etiuda-lead-box),
   so it lives in the same file and travels with every backup and restore. The ciphertext is bound to the
   seed, not to the outer wrap, which is why a passphrase copy and an operating-system copy carry it unchanged. */
const BOX_INFO = "etiuda-lead-box";
function boxKeyOf(open) {
  const seed = seedOf(open);
  return Buffer.from(crypto.hkdfSync("sha256", seed, Buffer.alloc(0), BOX_INFO, 32));
}
function boxAad(keyId, publicHex) {
  return Buffer.from(String(keyId) + "\n" + String(publicHex), "utf8");
}
function boxPack(doc) {
  const b = doc && doc.box;
  if (!b || typeof b !== "object" || Array.isArray(b)) return null;
  if (typeof b.public !== "string" || typeof b.iv !== "string" || typeof b.ct !== "string") return null;
  if (!b.public || !b.iv || !b.ct) return null;
  return { public: b.public, iv: b.iv, ct: b.ct };
}
function copyBox(file, pair) {
  const b = pair && pair.box;
  if (!b || typeof b.public !== "string" || typeof b.iv !== "string" || typeof b.ct !== "string") return file;
  if (!b.public || !b.iv || !b.ct) return file;
  file.box = { public: b.public, iv: b.iv, ct: b.ct };
  return file;
}
function freshBox() {
  const pair = crypto.generateKeyPairSync("x25519");
  return { public: pair.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex"),
           secretKey: pair.privateKey };
}
function sealBox(open, box) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv(CIPHER, boxKeyOf(open), iv);
  c.setAAD(boxAad(open.keyId, box.public));
  const der = box.secretKey.export({ type: "pkcs8", format: "der" });
  const ct = Buffer.concat([c.update(der), c.final(), c.getAuthTag()]);
  return { public: box.public, iv: iv.toString("hex"), ct: ct.toString("hex") };
}
function openBox(open, packed) {
  if (!packed || !/^[0-9a-f]{64}$/.test(packed.public) || !/^[0-9a-f]{24}$/.test(packed.iv)
      || !/^[0-9a-f]+$/.test(packed.ct) || packed.ct.length % 2 !== 0) return null;
  const ct = Buffer.from(packed.ct, "hex");
  if (ct.length < 17) return null;
  try {
    const d = crypto.createDecipheriv(CIPHER, boxKeyOf(open), Buffer.from(packed.iv, "hex"));
    d.setAAD(boxAad(open.keyId, packed.public));
    d.setAuthTag(ct.subarray(ct.length - 16));
    const der = Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]);
    const secretKey = crypto.createPrivateKey({ key: der, format: "der", type: "pkcs8" });
    const pub = crypto.createPublicKey(secretKey).export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
    if (pub !== packed.public) return null;
    return { public: pub, secretKey };
  } catch { return null; }
}
/** The box the key file carries, opened. No box yet means one is made and the file is rewritten with nothing
 *  else changed. A box that does not open throws, and the caller writes nothing of the team. */
function ensureLeadBox(read, open) {
  const packed = boxPack(read && read.doc);
  if (packed) {
    const got = openBox(open, packed);
    if (!got) throw new Error("the lead's box did not open, so nothing was written");
    return got;
  }
  const box = freshBox();
  const doc = JSON.parse(JSON.stringify(read.doc));
  doc.box = sealBox(open, box);
  writeWhole(read.file, JSON.stringify(doc, null, 1) + "\n", { mode: OWNER_ONLY });
  return box;
}
/** THE TEAM'S BOX CARRIED TO A NEW KEY (Max's ruling of 2026-11-01 06:13: a handover for a new computer keeps the team's lead
 *  box). `box` is the box the old key opened; it is sealed into the key file `read` under that file's own seed, as ensureLeadBox
 *  seals a fresh one, and returned. A file already carrying that very box is left as it is. A file carrying another box throws
 *  and nothing is written, since that box may be another team's. */
function keepLeadBox(read, open, box) {
  if (!box || !/^[0-9a-f]{64}$/.test(String(box.public)) || !box.secretKey) throw new Error("no box to keep, so nothing was written");
  const packed = boxPack(read && read.doc);
  if (packed) {
    const got = openBox(open, packed);
    if (!got) throw new Error("the lead's box did not open, so nothing was written");
    if (got.public !== box.public) throw new Error("the new key already carries a box of its own, so the team's box cannot be kept; nothing was written");
    return got;
  }
  const doc = JSON.parse(JSON.stringify(read.doc));
  doc.box = sealBox(open, box);
  writeWhole(read.file, JSON.stringify(doc, null, 1) + "\n", { mode: OWNER_ONLY });
  return box;
}
/** The box the key file already carries, or null when it carries none. A box that does not open throws. */
function openLeadBox(read, open) {
  const packed = boxPack(read && read.doc);
  if (!packed) return null;
  const got = openBox(open, packed);
  if (!got) throw new Error("the lead's box did not open");
  return got;
}

/* The signing key's seed: the last 32 bytes of Node's 48-byte PKCS8 export. Any other length is refused, so a change of encoding
   derives no other box or recovery secret. */
function seedOf(open) {
  const der = open.privateKey.export({ type: "pkcs8", format: "der" });
  /* plant:seed-shape */
  if (der.length !== 48) throw new Error("the signing key's private half is not in the shape this Studio reads, so nothing was derived from it");
  return der.subarray(-32);
}
/* THE STATISTICS BOX, derived from the signing key's own seed (HKDF-SHA256, info etiuda-stats-box): every team file this Studio
   signs names its public half as lead.stats, and the desks seal their statistics to it, so it changes with the key and a key
   handed on opens nothing sealed after the handover. Nothing is stored. */
const STATS_BOX_INFO = "etiuda-stats-box";
const PKCS8_X25519 = Buffer.from("302e020100300506032b656e04220420", "hex");
function statsBoxOf(open) {
  const seed = seedOf(open);
  /* plant:stats-box-seed */
  const raw = Buffer.from(crypto.hkdfSync("sha256", seed, Buffer.alloc(0), STATS_BOX_INFO, 32));
  const secretKey = crypto.createPrivateKey({ key: Buffer.concat([PKCS8_X25519, raw]), format: "der", type: "pkcs8" });
  return { public: crypto.createPublicKey(secretKey).export({ type: "spki", format: "der" }).subarray(-32).toString("hex"), secretKey };
}
/** The keys a desk's statistics may be sealed to, as this Studio opens them: the statistics box, then the lead's box, which a team
 *  file from before the statistics box names. None where the key file carries no lead's box, as before; one that does not open
 *  throws, as openLeadBox does. */
function statsKeysOf(read, open) {
  const box = openLeadBox(read, open);
  return box ? [statsBoxOf(open).secretKey, box.secretKey] : [];
}

/* THE TEAM KEY'S RECOVERY COPY OPENS WITH THE SIGNING KEY (Claudia's P2, taken 2026-10-07 21:19): the secret it is wrapped
   under is derived from the private half, so the one backup of the signing key brings every team back, and the copy keeps
   the shape the engine's team reader accepts (scrypt and AES-256-GCM, src/team.mjs withRecovery). */
function recoverySecret(open) {
  const seed = seedOf(open);
  return Buffer.from(crypto.hkdfSync("sha256", seed, Buffer.alloc(0), "etiuda-team-recovery", 32)).toString("hex");
}

/* ---- signing --------------------------------------------------------------------------------- */

/**
 * Sign any format-conforming document (catalog, licence, etc.):
 * alg and keyId first, the bytes taken with the value absent, the value written last.
 * @returns {object} a NEW document; the one handed in is not touched.
 */
async function signDocument(doc, o) {
  const opts = o || {};
  if (!opts.privateKey) throw new Error("signing wants an unlocked private key");
  const rule = await sigRule();
  const out = JSON.parse(JSON.stringify(doc));
  out.sig = { alg: rule.alg, keyId: String(opts.keyId || "") };
  const data = await signedBytes(out);
  out.sig.value = crypto.sign(null, data, opts.privateKey).toString("hex");
  return out;
}

/**
 * The catalog with a signature on it, exactly as the engine's own tests/catalog-sig.js attaches
 * one: alg and keyId first, the bytes taken with the value absent, the value written last.
 * @returns {object} a NEW document; the one handed in is not touched.
 */
async function signCatalog(catalog, o) {
  return signDocument(catalog, o);
}

/**
 * Verify an Ed25519 signature on any format-conforming document (catalog, licence, etc.)
 * over the canonical form with hash off, sig.value off, and sig.alg and sig.keyId on.
 * @param {object} doc  The signed document
 * @param {string} publicHex 32-byte Ed25519 public key as 64 hex characters
 * @returns {Promise<boolean>}
 */
async function verifySignature(doc, publicHex) {
  return signatureHolds(doc, publicHex);
}

/** verifySignature without the promise, for a caller that cannot wait (src/relay.mjs editionsLed, which signs a head). */
function signatureHolds(doc, publicHex) {
  if (!doc || !doc.sig || typeof doc.sig !== "object") return false;
  const sig = doc.sig;
  if (sig.alg !== SIG_ALG) return false;
  if (!sig.value || typeof sig.value !== "string") return false;
  const pubHex = String(publicHex || "");
  if (!/^[0-9a-f]{64}$/i.test(pubHex)) return false;
  if (!/^[0-9a-f]{128}$/i.test(sig.value)) return false;
  const data = Buffer.from(ruleNow().bytes(doc));
  const pubKey = crypto.createPublicKey({
    key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(pubHex, "hex")]),
    format: "der",
    type: "spki",
  });
  return crypto.verify(null, data, pubKey, Buffer.from(sig.value, "hex"));
}

/**
 * The pinned relay's own word on a delegation, which the root signs and a licence may carry: the longest it may run
 * (milliseconds), whether a string is a key id the format accepts, and whether `rootPub` (64 hex characters) signed `d`
 * over the pin's own delegationBytes, and `bytes` for a signer (the vendor's own issuing script and the gates). Read through the pin, as src/relay.mjs reads its grants, so what Studio accepts is
 * what the relay accepts and nothing here retypes the bytes.
 */
function delegationRules() {
  const R = Engine.relayRules(), C = R.core;
  return {
    maxMs: C.DELEGATION_MAX_MS,
    bytes: (d) => C.delegationBytes(d),
    isId: (id) => typeof id === "string" && R.blob.isId(id),
    signedBy(d, rootPub) {
      const sig = d && d.sig && d.sig.value;
      if (!/^[0-9a-f]{64}$/.test(String(rootPub || "")) || !/^[0-9a-f]{128}$/.test(String(sig || ""))) return false;
      try {
        const key = crypto.createPublicKey({
          key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(rootPub, "hex")]),
          format: "der", type: "spki" });
        return crypto.verify(null, C.delegationBytes(d), key, Buffer.from(sig, "hex"));
      } catch { return false; }
    },
  };
}

export { makeKeyFile, makePair, passphraseFile, delegationRules, osFile, pairOf, recoverySecret, ensureLeadBox, keepLeadBox, openLeadBox, statsBoxOf, statsKeysOf, OS_WRAP, readKeyFile, unlockKey, signCatalog, signDocument, verifySignature, signatureHolds,
         signedBytes, sigSource, keyIdFor, wrapKey,
         defaultKeyFile,
         KEY_KIND, KEY_SCHEMA, SIG_ALG, KEY_FILE, KDF, CIPHER };

