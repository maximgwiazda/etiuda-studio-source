/* THE CATALOG SIGNATURE, HELD TO THE ENGINE'S OWN VERDICT. Board 605 and 615.
 *
 *     node tests/catalog-sig.mjs [--keep]
 *
 * WHAT IS BEING PROVED. Studio signs; a desk verifies. Nothing Studio can say about its own
 * signature is worth anything, so every leg below that claims a state reads it from the
 * ENGINE'S OWN v2SigState, sliced out of the engine's own text and run unchanged, and the four
 * states are driven one each: valid, invalid, unknown, none.
 *
 * WHICH ENGINE, AND WHY THE QUESTION IS ASKED OUT LOUD (board 510). Two engines are in
 * circulation at every pin move, so leg 1a prints the engine the rule was read from and at what
 * commit. It is the pin's: the fallback to the engine's main for a pin older than the signature
 * (53023ce) went with board 858, the drift gate keeping any such pin out.
 *
 * THE TWO SHARP EDGES OF 615 ARE SECTION 3, and each is proved rather than assumed:
 *   - line endings. The signature covers the canonical form of the DOCUMENT, so a file saved
 *     CRLF must verify exactly as the same file saved LF. The control is that the two files
 *     really do differ in their bytes, or the leg would be comparing a file with itself.
 *   - an explicit null. Canonical form drops an undefined and KEEPS a null, so a null is inside
 *     the signature: a reader that normalised one away would break every signature silently.
 *     The leg proves both halves - a null survives a round trip through the file and verifies,
 *     and removing it changes the signed bytes - and then answers the other half of the
 *     question by measurement: whether Studio's own writer emits a null at all.
 *
 * THE RING IS SECTION 6, AND IT IS THE OTHER HALF OF THE SAME CLAIM. A signature a desk cannot
 * attribute is worth nothing, so Studio writes the file that binds a public key to a CATALOG ID
 * (board 605, Maxim 2026-09-20 21:37) and every leg there reads that file back through the
 * ENGINE'S OWN v2RingRead rather than by looking at the JSON: a leg that asserted the shape by
 * eye would pass while the engine dropped every entry. The binding is the point - a key listed
 * for one catalog does not vouch for another - and a rotation is two entries for one catalog,
 * so writing the second must leave the first exactly where it was.
 *
 * THE KEY FILE IS SECTION 5. A wrong passphrase must refuse rather than hand back rubbish, and
 * a key file whose keyId was edited by hand must refuse too, because the keyId is what a desk
 * is told to trust and a file that can be made to claim another key's name can be used to lie
 * about who published.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as Engine from "../src/engine.mjs";
import { importCsv } from "../src/import.mjs";
import { publishFull, PROJECT_FILE, DRAFT_FILE, ARCHIVE, CATALOG_IN_ARCHIVE,
         RELEASE_IN_ARCHIVE, NOTES_IN_ARCHIVE, REPORT_IN_ARCHIVE } from "../src/publish.mjs";
import { makeKeyFile, readKeyFile, unlockKey, signCatalog, signedBytes, sigSource } from "../src/sign.mjs";
import { RING_FILE, RING_KIND, RING_FORMAT, ringPath, ringFor } from "../src/ring.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "catalog-sig");
const CLOCK = "2026-09-20T09:00:00";
const PASS = "a passphrase nobody uses twice";
/* 2q's four spellings. The passphrase is not hex, so its base64 is of the utf8 bytes; a hex secret's is of the key. */
const spellingsOf = (secret) => {
  const s = String(secret == null ? "" : secret);
  const asHex = /^[0-9a-fA-F]+$/.test(s) && s.length % 2 === 0;
  const bytes = Buffer.from(s, asHex ? "hex" : "utf8");
  return [s, s.toUpperCase(), bytes.toString("base64"), bytes.toString("base64url")];
};

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

/* THE ENGINE'S OWN SIGNATURE AND RING, FROM THE PIN. Until board 858 (P2) each fell back to the
 * engine's main where the pin predated it; the drift gate keeps any such pin out. */
const engineRule = () => Engine.sigRules();
const ringRule = () => Engine.ringRules();

/** A macro pile from the committed generator, never a catalog of anybody's. */
function pile(name, seed, rows) {
  const out = path.join(SCRATCH, "piles", name);
  const r = spawnSync(process.execPath,
    ["tools/fixtures/generate.mjs", "--seed", String(seed), "--rows", String(rows), "--out", out],
    { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) throw new Error("the generator refused: " + (r.stderr || r.stdout));
  return path.join(out, "macros.csv");
}

async function project(name, csv, id) {
  const dir = path.join(SCRATCH, name);
  fs.mkdirSync(dir, { recursive: true });
  const made = await importCsv({ file: csv, id, name: id });
  fs.writeFileSync(path.join(dir, DRAFT_FILE), JSON.stringify(made.catalog, null, 1) + "\n");
  fs.writeFileSync(path.join(dir, PROJECT_FILE), JSON.stringify(
    { id: made.catalog.id, rev: 0, edition: "" }, null, 1) + "\n");
  return { dir, catalog: made.catalog };
}

/** Every path in a document whose value is an explicit null. The answer to half of 615. */
function nullsIn(v, at, out) {
  at = at || "$"; out = out || [];
  if (v === null) { out.push(at); return out; }
  if (v && typeof v === "object") {
    if (Array.isArray(v)) v.forEach((x, i) => nullsIn(x, at + "[" + i + "]", out));
    else Object.keys(v).forEach(k => nullsIn(v[k], at + "." + k, out));
  }
  return out;
}

const sha = b => crypto.createHash("sha256").update(b).digest("hex").slice(0, 12);

async function main(argv) {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const V = engineRule();

  /* ---- 1. whose rule this is ---------------------------------------------------------------- */

  check(typeof V.v2SigState === "function" && V.states.valid === "valid",
    "1a the signature's rule is read from " + V.from);
  check(V.V2_SIG_ALG === "Ed25519" && (await sigSource()).length > 0,
    "1b the algorithm is the engine's own " + JSON.stringify(V.V2_SIG_ALG) + ", and Studio's"
    + " bytes come from " + (await sigSource()));

  /* THE BYTES, BYTE FOR BYTE, over the shapes canonical form can differ on: what src/sign.mjs
     signs is what the engine's own v2SignedBytes gives. A divergence of one byte is a signature no
     desk can verify. (Until board 858 this held Studio's own copy of the fold, now gone.) */
  const shapes = [
    { name: "a plain document", doc: { format: 2, kind: "etiuda-catalog", id: "c-a", name: "A" } },
    { name: "an explicit null", doc: { format: 2, id: "c-a", note: null, name: "A" } },
    { name: "an undefined beside it", doc: { format: 2, id: "c-a", note: undefined, name: "A" } },
    { name: "a nested array", doc: { a: [1, [2, null], { b: "c" }], id: "c-a" } },
    { name: "a signature already on it",
      doc: { id: "c-a", hash: "djb2:1", sig: { alg: "Ed25519", keyId: "k-1", value: "ff" } } },
    { name: "a sig with nothing in it", doc: { id: "c-a", sig: {} } },
    { name: "non-ascii text", doc: { id: "c-a", name: "zażółć gęślą jaźń —  " } },
  ];
  const F = await Engine.format();
  const mine = await Promise.all(shapes.map(s => signedBytes(s.doc)));
  const theirs = shapes.map(s => Buffer.from(V.v2SignedBytes(s.doc)));
  const differ = shapes.filter((s, i) => !mine[i].equals(theirs[i])).map(s => s.name);
  check(differ.length === 0,
    "1c the bytes Studio signs are the engine's own on all " + shapes.length
    + " shapes (" + theirs.reduce((n, b) => n + b.length, 0) + " bytes compared)"
    + (differ.length ? ": " + differ.join(", ") : ""));

  /* THE CONTROL FOR 1c. A comparison that could not fail proves nothing, so a fold that keeps
     the signature's own value - the single mistake this rule exists to prevent - is compared
     the same way and must differ on the one shape that carries a value. */
  const wrongFold = (cat) => { const c = Object.assign({}, cat); delete c.hash; return c; };
  const wrong = shapes.map(s => Buffer.from(new TextEncoder().encode(F.canonical(wrongFold(s.doc)))));
  const caught = shapes.filter((s, i) => !wrong[i].equals(theirs[i])).map(s => s.name);
  check(caught.length === 1 && caught[0] === "a signature already on it",
    "1d and the comparison can fail: a fold that keeps sig.value differs on exactly the shape"
    + " that has one (" + JSON.stringify(caught) + ")");

  /* ---- 2. the four states, each read from the engine ----------------------------------------- */

  const keyDoc = await makeKeyFile({ passphrase: PASS });
  const keyAt = path.join(SCRATCH, "signing-key.json");
  fs.writeFileSync(keyAt, JSON.stringify(keyDoc, null, 1) + "\n", "utf8");
  const read = readKeyFile(keyAt);
  const open = unlockKey(read, PASS);

  const base = {
    format: 2, kind: "etiuda-catalog", id: "c-sig-fixture", name: "Signature fixture",
    date: "2026-09-20", rev: 1, langs: [{ code: "en", name: "English" }],
    tags: [{ id: "t-one", kind: "shelf", name: { en: "One" } }],
    cards: [{ id: "c-one", bodyShape: "plain", shelf: "t-one",
              title: { en: "A card" }, body: { en: "A body with words in it." } }],
  };
  base.hash = F.contentHash(base);
  const signed = await signCatalog(base, { privateKey: open.privateKey, keyId: open.keyId });

  /* THE SHAPE OF THE RING FOLLOWS THE ENGINE IN USE, AND IS NOT KNOWN HERE. Before the engine's
     0f09226 v2SigState took a flat {keyId:public} map; after it, {catalogId:{keyId:public}}, and
     the old shape handed to the new engine reads `unknown` on a catalog that is perfectly signed
     - safe, and silent enough to cost a day at the pin move. src/engine.mjs reads which it is
     off the engine's own text (`binds`), so these legs say the same thing on both sides of that
     pin and section 6 below is where the binding itself is proved. */
  const flat = { [open.keyId]: open.public };
  const deskRing = (catId, keys) => ({ [catId]: keys });
  const ring = deskRing(base.id, flat);

  check(await V.v2SigState(signed, ring) === V.states.valid,
    "2a a catalog Studio signed verifies valid through the engine's own v2SigState, key "
    + open.keyId);

  const bent = JSON.parse(JSON.stringify(signed));
  const body = bent.cards[0].body.en;
  bent.cards[0].body.en = body.slice(0, 3) + String.fromCharCode(body.charCodeAt(3) ^ 1)
    + body.slice(4);
  const st2 = await V.v2SigState(bent, ring);
  check(st2 === V.states.invalid,
    "2b one character of one body changed and the same key verifies invalid: " + st2
    + " (" + JSON.stringify(body.slice(0, 6)) + " -> "
    + JSON.stringify(bent.cards[0].body.en.slice(0, 6)) + ")");

  const foreign = JSON.parse(JSON.stringify(signed));
  const other = await makeKeyFile({ passphrase: PASS });
  foreign.sig.keyId = other.keyId;
  const st3 = await V.v2SigState(foreign, ring);
  check(st3 === V.states.unknown,
    "2c a key the desk's ring does not hold verifies unknown rather than invalid: " + st3);
  /* THE CONTROL FOR 2c. Unknown must mean "not in this ring" and not "any other keyId", so the
     same document is verified against a ring that DOES hold the other key: the signature is
     then genuinely wrong and the state must be invalid. */
  const st3b = await V.v2SigState(foreign,
    deskRing(base.id, Object.assign({}, flat, { [other.keyId]: other.public })));
  check(st3b === V.states.invalid,
    "2d and with that foreign key in the ring the same document verifies invalid, so unknown"
    + " names the ring rather than the signature: " + st3b);

  const none = JSON.parse(JSON.stringify(signed));
  delete none.sig;
  check(await V.v2SigState(none, ring) === V.states.none,
    "2e an unsigned catalog verifies none, which is what every catalog published so far is");

  /* ---- 3. the two sharp edges of 615 --------------------------------------------------------- */

  const lfAt = path.join(SCRATCH, "lf.ec");
  const crlfAt = path.join(SCRATCH, "crlf.ec");
  const lfText = JSON.stringify(signed, null, 1) + "\n";
  fs.writeFileSync(lfAt, lfText, "utf8");
  fs.writeFileSync(crlfAt, lfText.split("\n").join("\r\n"), "utf8");
  const lfBytes = fs.readFileSync(lfAt), crlfBytes = fs.readFileSync(crlfAt);
  const fromLf = JSON.parse(fs.readFileSync(lfAt, "utf8"));
  const fromCrlf = JSON.parse(fs.readFileSync(crlfAt, "utf8"));
  const stLf = await V.v2SigState(fromLf, ring), stCrlf = await V.v2SigState(fromCrlf, ring);
  check(stLf === V.states.valid && stCrlf === V.states.valid,
    "3a the same catalog saved LF and CRLF both verify valid (" + stLf + ", " + stCrlf + "):"
    + " the bytes signed are the canonical form of the document, not the file");
  check(!lfBytes.equals(crlfBytes) && crlfBytes.length > lfBytes.length,
    "3b and the two files really are different files: " + lfBytes.length + " bytes sha "
    + sha(lfBytes) + " against " + crlfBytes.length + " bytes sha " + sha(crlfBytes));

  /* THE NULL. Both halves: a null survives the file and is inside the signature. */
  const withNull = JSON.parse(JSON.stringify(base));
  withNull.cards[0].note = null;
  delete withNull.hash;
  withNull.hash = F.contentHash(withNull);
  const signedNull = await signCatalog(withNull, { privateKey: open.privateKey, keyId: open.keyId });
  const nullAt = path.join(SCRATCH, "null.ec");
  fs.writeFileSync(nullAt, JSON.stringify(signedNull, null, 1) + "\n", "utf8");
  const backFromFile = JSON.parse(fs.readFileSync(nullAt, "utf8"));
  const stNull = await V.v2SigState(backFromFile, ring);
  check(stNull === V.states.valid && backFromFile.cards[0].note === null,
    "3c an explicit null survives the write and the read and the catalog still verifies valid: "
    + stNull);

  const dropped = JSON.parse(JSON.stringify(signedNull));
  delete dropped.cards[0].note;
  const stDropped = await V.v2SigState(dropped, ring);
  const bytesWith = Buffer.from(V.v2SignedBytes(signedNull));
  const bytesWithout = Buffer.from(V.v2SignedBytes(dropped));
  check(stDropped === V.states.invalid && bytesWith.length - bytesWithout.length === 12,
    "3d and dropping that null breaks the signature (" + stDropped + "): it is worth "
    + (bytesWith.length - bytesWithout.length) + " bytes of the signed form, so anything that"
    + " normalises a null away between signing and verifying invalidates the file");

  /* ---- 4. publish, end to end ---------------------------------------------------------------- */

  const csv = pile("sig", 11, 9);
  const signedProject = await project("signed", csv, "sig-signed");
  const plainProject = await project("plain", csv, "sig-plain");

  const gotSigned = await publishFull({ project: signedProject.dir, now: CLOCK,
    key: keyAt, passphrase: PASS, notes: "the signed one" });
  const gotPlain = await publishFull({ project: plainProject.dir, now: CLOCK,
    notes: "the unsigned one" });

  const onDisk = JSON.parse(fs.readFileSync(gotSigned.ec, "utf8"));
  /* THE RING IS BUILT FOR THIS CATALOG, not reused from section 2. `ring` above is bound to
     "c-sig-fixture" and this document is "sig-signed", and a bound engine answers `unknown` to
     that pairing - correctly, which 6h proves on purpose. While the pin predated the ring the
     shape was flat and the id was not looked at, so the wrong ring passed this leg for as long
     as `binds` was false; it went red the hour the pin crossed 0f09226, which is exactly what
     the note at 2a said would happen. Bind to the document's own id and the leg asks its own
     question again. */
  const stPub = await V.v2SigState(onDisk, deskRing(onDisk.id, flat));
  check(stPub === V.states.valid && gotSigned.sig.keyId === open.keyId,
    "4a a catalog published with a key verifies valid off the disk: " + stPub + ", key "
    + gotSigned.sig.keyId);

  const archived = fs.readFileSync(path.join(gotSigned.archive, CATALOG_IN_ARCHIVE));
  check(archived.equals(fs.readFileSync(gotSigned.ec)),
    "4b the archived copy is the published file byte for byte, signature included (sha "
    + sha(archived) + ")");

  const notes = fs.readFileSync(path.join(gotSigned.archive, RELEASE_IN_ARCHIVE), "utf8");
  const plainNotes = fs.readFileSync(path.join(gotPlain.archive, RELEASE_IN_ARCHIVE), "utf8");
  check(notes.indexOf("signed with key `" + open.keyId + "`") > -1
        && /, unsigned\./.test(plainNotes) && gotPlain.sig === null,
    "4c the release notes say which on their face, both ways: "
    + JSON.stringify((notes.split("\n").filter(l => /^Built against/.test(l))[0] || "")) + " and "
    + JSON.stringify((plainNotes.split("\n").filter(l => /^Built against/.test(l))[0] || "")));

  /* THE HASH AND THE SIGNATURE ARE TWO CHECKS OVER THE SAME CONTENT AND NEITHER MOVES THE OTHER.
     The same document is hashed with the signature on it and with the signature taken off, by
     the ENGINE'S OWN contentHash, and both must equal the hash the file carries: a desk's hash
     check therefore reads the same on a signed file as on the unsigned one it was made from.
     Two documents cannot be compared here - two projects have two ids and so two hashes. */
  const plainOnDisk = JSON.parse(fs.readFileSync(gotPlain.ec, "utf8"));
  const withoutSig = Object.assign({}, onDisk); delete withoutSig.sig;
  check(F.contentHash(onDisk) === onDisk.hash && F.contentHash(withoutSig) === onDisk.hash
        && !plainOnDisk.sig,
    "4d signing does not move the content hash: the engine recomputes " + onDisk.hash
    + " from the signed file and the same from it with the signature taken off");

  /* DETERMINISM SURVIVES THE SIGNATURE. Ed25519 as RFC 8032 defines it takes no randomness, so
     the same document signed twice by the same key is the same bytes; a scheme that salted
     would have broken Clement's byte-for-byte gate without breaking any signature, which is the
     kind of thing that gets discovered a month later. */
  const twice = await signCatalog(base, { privateKey: open.privateKey, keyId: open.keyId });
  check(twice.sig.value === signed.sig.value,
    "4e the same catalog signed twice gives the same signature, so a determinism gate still"
    + " holds over a signed publish (" + twice.sig.value.slice(0, 16) + "...)");

  /* A KEY AND NO PASSPHRASE REFUSES, AND COSTS NOTHING: no edition, no archive folder. */
  const thirdProject = await project("refused", csv, "sig-refused");
  let refusal = "";
  try {
    await publishFull({ project: thirdProject.dir, now: CLOCK, key: keyAt });
  } catch (e) { refusal = e.message; }
  const leftBehind = fs.existsSync(path.join(thirdProject.dir, ARCHIVE))
    ? fs.readdirSync(path.join(thirdProject.dir, ARCHIVE)) : [];
  check(/needs its passphrase/.test(refusal) && leftBehind.length === 0
        && !fs.readdirSync(thirdProject.dir).some(n => /\.ec$/.test(n)),
    "4f a key with no passphrase refuses rather than publishing unsigned, and writes nothing: "
    + JSON.stringify(refusal.slice(0, 60)) + ", " + leftBehind.length + " edition(s) archived");

  /* THE PINNED ENGINE IS OLDER THAN THE SIGNATURE AND MUST STILL READ THE FILE. A desk that has
     not been updated meets a signed catalog as a catalog with one field it does not know; if
     that field were an error, signing would break every desk in the field on the day it landed.
     Measured against the pin rather than reasoned about. */
  const { lintCatalog } = Engine.lint();
  const oldVerdict = lintCatalog(onDisk);
  check(oldVerdict.errors.length === 0,
    "4g the pinned engine " + Engine.pin().commit.slice(0, 7) + ", which predates the signature,"
    + " reads the signed file with " + oldVerdict.errors.length + " error(s) and "
    + oldVerdict.warnings.length + " warning(s): an unupdated desk still opens it");

  /* AND THE OTHER HALF OF 615, ANSWERED BY MEASUREMENT RATHER THAN BY OPINION: whether Studio's
     own writer puts a null in a published catalog at all. */
  const nulls = nullsIn(plainOnDisk);
  /* ASSERTED, NOT MERELY PRINTED. This leg read `check(true, ...)` until 2026-09-20 and so passed
     whatever the walk found, which made it a sentence in the log rather than a gate: a writer
     that started emitting nulls would have changed the number in the line and nothing else. The
     claim is that Studio's writer emits NONE, and a null is inside the signed bytes (3c/3d), so
     one appearing is a change to what a desk verifies. Its teeth were proved by planting
     `plainOnDisk.cards[0].note = null` above this line and watching 4h fail. */
  check(nulls.length === 0,
    "4h Studio's writer emitted " + nulls.length + " explicit null(s) in a published catalog of "
    + (plainOnDisk.cards || []).length + " cards and " + (plainOnDisk.tags || []).length
    + " tags" + (nulls.length ? " at " + nulls.slice(0, 4).join(", ") : "")
    + " (walked every value of the written .ec)");

  /* ---- 5. the key file ------------------------------------------------------------------------ */

  check(read.keyId === keyDoc.keyId && read.public === keyDoc.public
        && !JSON.stringify(read.doc.wrap).includes(PASS),
    "5a the keyId and the public half are readable with no passphrase, which is what the"
    + " settings row shows and what a desk is told: " + read.keyId);

  let wrongPass = "";
  const handed = PASS + "!";
  try { unlockKey(read, handed); } catch (e) { wrongPass = e.message; }
  const leaked = spellingsOf(handed).filter((x) => x && wrongPass.indexOf(x) >= 0);
  check(/did not open/.test(wrongPass) && leaked.length === 0,
    "5b a wrong passphrase refuses rather than handing back rubbish, and the refusal carries none of it");

  const edited = JSON.parse(JSON.stringify(keyDoc));
  edited.keyId = other.keyId;
  let editedSaid = "";
  try { unlockKey(edited, PASS); } catch (e) { editedSaid = e.message; }
  check(/did not open/.test(editedSaid),
    "5c a key file whose keyId was edited by hand does not open at all, so it cannot be made to"
    + " claim another key's name: " + JSON.stringify(editedSaid.slice(0, 48)));

  const again = spawnSync(process.execPath, ["tools/sign.mjs", "make", "--out", keyAt],
    { cwd: ROOT, encoding: "utf8", env: Object.assign({}, process.env,
      { STUDIO_KEY_PASSPHRASE: PASS }) });
  check(again.status === 2 && /already a key file/.test(again.stderr),
    "5d the command line refuses to write over a key file, because a catalog signed with the"
    + " old key can be verified with nothing else: exit " + again.status);

  const inArgv = spawnSync(process.execPath,
    ["tools/sign.mjs", "make", "--out", path.join(SCRATCH, "never.json"), "--passphrase", "x"],
    { cwd: ROOT, encoding: "utf8" });
  check(inArgv.status === 2 && /no --passphrase/.test(inArgv.stderr)
        && !fs.existsSync(path.join(SCRATCH, "never.json")),
    "5e and it refuses a passphrase in the argument list, which every process on the machine"
    + " can read: exit " + inArgv.status);

  /* ---- 6. the ring, which is what a desk is actually told ------------------------------------ */

  const R = ringRule();
  check(typeof R.v2RingRead === "function",
    "6a the ring's reader is the engine's own, read from " + R.from);
  check(R.V2_RING_FILE === RING_FILE && +R.V2_RING_FORMAT === RING_FORMAT
        && R.V2_RING_KIND === RING_KIND,
    "6b Studio's three restated constants are the engine's own: " + JSON.stringify(RING_FILE)
    + ", format " + RING_FORMAT + ", kind " + JSON.stringify(RING_KIND));

  /* THE PUBLISH IN SECTION 4 WROTE ONE, and this is the whole claim of the item: a file Studio
     wrote, read by the engine's reader with nothing dropped, and the catalog Studio signed
     verifying VALID through the ring that came out of it. Read back from disk, not from what
     publish returned. */
  const ringAt = ringPath(path.dirname(gotSigned.ec));
  const ringText = fs.existsSync(ringAt) ? fs.readFileSync(ringAt, "utf8") : "";
  const readBack = R.v2RingRead(ringText);
  const stRing = await R.v2SigState(onDisk, readBack.ring);
  check(ringAt === path.join(path.dirname(gotSigned.ec), RING_FILE) && stRing === R.states.valid
        && readBack.problems.length === 0,
    "6c a signed publish wrote " + RING_FILE + " beside the .ec and the engine's own v2RingRead"
    + " takes it with " + readBack.problems.length + " problem(s), after which that catalog"
    + " verifies " + stRing + " through it"
    + (readBack.problems.length ? ": " + readBack.problems.join("; ") : ""));

  /* AND THE UNSIGNED PUBLISH WROTE NONE. A ring beside an unsigned catalog would name a key
     nothing carries, which is a desk being told to trust something for no reason. */
  check(!fs.existsSync(ringPath(path.dirname(gotPlain.ec))),
    "6d an unsigned publish wrote no ring at all, so a ring file means a key signed something");

  /* NO PRIVATE KEY IN THE FILE. The one failure here that would be catastrophic and silent, so
     it is searched for in the written bytes rather than argued from the code: the private half
     in both encodings anything might have used, the passphrase, and the wrapped blob out of the
     key file. THE CONTROL IS IN THE SAME LEG - the public half must be found by the same search
     - because a search that finds nothing proves nothing until it is shown to find something. */
  const der = open.privateKey.export({ type: "pkcs8", format: "der" });
  const passSpelt = spellingsOf(PASS);
  const hunt = [
    ["the private key, pkcs8 der as hex", der.toString("hex")],
    ["the private key, pkcs8 der as upper hex", der.toString("hex").toUpperCase()],
    ["the private key, pkcs8 der as base64", der.toString("base64")],
    ["the private key, pkcs8 der as base64url", der.toString("base64url")],
    ["its raw 32 bytes as hex", der.subarray(-32).toString("hex")],
    ["its raw 32 bytes as upper hex", der.subarray(-32).toString("hex").toUpperCase()],
    ["its raw 32 bytes as base64", der.subarray(-32).toString("base64")],
    ["its raw 32 bytes as base64url", der.subarray(-32).toString("base64url")],
    ["the passphrase", passSpelt[0]],
    ["the passphrase in upper case", passSpelt[1]],
    ["the passphrase as base64", passSpelt[2]],
    ["the passphrase as base64url", passSpelt[3]],
    ["the key file's wrapped private half", String(keyDoc.private)],
    ["the key file's salt", String(keyDoc.wrap.salt)],
  ];
  const archiveFiles = [REPORT_IN_ARCHIVE, NOTES_IN_ARCHIVE, RELEASE_IN_ARCHIVE].map((n) => path.join(gotSigned.archive, n));
  /* Every file the publish wrote, not the three named ones alone. A directory that cannot be listed fails the leg:
     an unreadable file is not a clean one. */
  const readTree = (dir) => {
    const parts = [];
    let ok = true, n = 0;
    const walk = (d, depth) => {
      if (depth > 8) { ok = false; return; }
      let names;
      try { names = fs.readdirSync(d); }
      catch (e) { ok = false; return; }
      for (const name of names) {
        const p = path.join(d, name);
        let st;
        try { st = fs.statSync(p); }
        catch (e) { ok = false; continue; }
        if (st.isDirectory()) walk(p, depth + 1);
        else {
          n += 1;
          try { parts.push(fs.readFileSync(p).toString("utf8")); }
          catch (e) { ok = false; }
        }
      }
    };
    if (!dir || !fs.existsSync(dir)) return { text: "", ok: false, n: 0 };
    try {
      const st = fs.statSync(dir);
      if (!st.isDirectory()) return { text: fs.readFileSync(dir).toString("utf8"), ok: true, n: 1 };
      walk(dir, 0);
    } catch (e) { ok = false; }
    return { text: parts.join("\n"), ok, n };
  };
  const editionFiles = readTree(gotSigned.archive);
  const shareFiles = readTree(path.dirname(gotSigned.ec));
  const hunted = ringText + "\n" + editionFiles.text + "\n" + shareFiles.text;
  const found = hunt.filter(([, needle]) => needle && hunted.indexOf(needle) > -1).map(([name]) => name);
  const fields = new Set();
  JSON.parse(ringText).keys.forEach(e => Object.keys(e).forEach(k => fields.add(k)));
  const strange = Array.from(fields).filter(k =>
    ["catalog", "keyId", "alg", "public", "note"].indexOf(k) < 0);
  check(found.length === 0 && strange.length === 0 && archiveFiles.every((p) => fs.existsSync(p))
        && editionFiles.ok && shareFiles.ok && ringText.indexOf(open.public) > -1,
    "6e the ring holds the public half and none of the " + hunt.length + " private things"
    + " hunted for in its " + Buffer.byteLength(ringText) + " bytes, in every file under the"
    + " signed edition's archive folder (" + editionFiles.n + ") or in any file in the share"
    + " folder (" + shareFiles.n + "), and its entries carry no"
    + " field outside the five the format has (" + Array.from(fields).sort().join(", ") + ")"
    + (found.length ? ": FOUND " + found.join(", ") : ""));

  /* ---- the rotation: a second key for one catalog, and both editions still verify ----------- */

  const secondKeyAt = path.join(SCRATCH, "signing-key-2.json");
  const secondDoc = await makeKeyFile({ passphrase: PASS });
  fs.writeFileSync(secondKeyAt, JSON.stringify(secondDoc, null, 1) + "\n", "utf8");
  const firstEc = fs.readFileSync(gotSigned.ec);
  const second = await publishFull({ project: signedProject.dir, now: "2026-09-21T09:00:00",
    key: secondKeyAt, passphrase: PASS, notes: "the one after the rotation" });
  const afterText = fs.readFileSync(ringAt, "utf8");
  const after = R.v2RingRead(afterText);
  const forCat = after.ring[onDisk.id] || {};
  const oldStill = await R.v2SigState(JSON.parse(firstEc.toString("utf8")), after.ring);
  const newOne = await R.v2SigState(JSON.parse(fs.readFileSync(second.ec, "utf8")), after.ring);
  check(Object.keys(forCat).length === 2 && forCat[open.keyId] === open.public
        && oldStill === R.states.valid && newOne === R.states.valid,
    "6f a second key published for the same catalog left the first in the ring, "
    + Object.keys(forCat).length + " keys for " + onDisk.id + ", and the edition signed by each"
    + " verifies: the old one " + oldStill + ", the new one " + newOne);

  /* THE CONTROL FOR 6f, and the reason the entry is a list rather than a map keyed by catalog:
     the second write must not have REPLACED the first, so the file itself is read and the first
     entry must still be there, in its place, with the bytes it was written with. */
  const entries = JSON.parse(afterText).keys;
  const firstEntry = JSON.parse(ringText).keys[0];
  check(entries.length === 2
        && JSON.stringify(entries[0]) === JSON.stringify(firstEntry),
    "6g and the file grew rather than changed: " + entries.length + " entries, the first of them"
    + " the bytes the first publish wrote (" + JSON.stringify(firstEntry.keyId) + ")");

  /* ---- the binding: a ring for one catalog does not vouch for another ----------------------- */

  const otherCat = JSON.parse(JSON.stringify(base));
  otherCat.id = "c-sig-elsewhere";
  delete otherCat.hash;
  otherCat.hash = F.contentHash(otherCat);
  const otherSigned = await signCatalog(otherCat,
    { privateKey: open.privateKey, keyId: open.keyId });
  const stElsewhere = await R.v2SigState(otherSigned, after.ring);
  const ownAt = path.join(SCRATCH, "elsewhere", RING_FILE);
  await ringFor({ key: read, catalog: otherCat.id, file: ownAt });
  const ownRing = R.v2RingRead(fs.readFileSync(ownAt, "utf8"));
  const stOwn = await R.v2SigState(otherSigned, ownRing.ring);
  check(stElsewhere === R.states.unknown && stOwn === R.states.valid,
    "6h a ring Studio wrote for " + onDisk.id + " does not vouch for " + otherCat.id
    + " signed by the same key (" + stElsewhere + "), and the same document under its own"
    + " catalog's entry is " + stOwn + ": the entry binds a key to a catalog, not to a desk");

  /* ---- what the merge must never do --------------------------------------------------------- */

  /* AN ENTRY STUDIO DID NOT WRITE SURVIVES A MERGE, fields and all. The file is on a share and
     an administrator has a text editor: a writer that rebuilt it from its own model would take
     out the note explaining why a superseded key is still listed, and another publisher's
     catalog with it. */
  const foreignEntry = { catalog: "some-other-catalog", keyId: "studio-" + "0".repeat(16),
    alg: "Ed25519", public: "b".repeat(64), note: "somebody else's, with a field to come",
    placedBy: "a later Studio" };
  const doc = JSON.parse(afterText);
  doc.keys.unshift(foreignEntry);
  fs.writeFileSync(ringAt, JSON.stringify(doc, null, 1) + "\n", "utf8");
  const third = await publishFull({ project: signedProject.dir, now: "2026-09-22T09:00:00",
    key: keyAt, passphrase: PASS, notes: "the third" });
  const merged = JSON.parse(fs.readFileSync(ringAt, "utf8"));
  check(JSON.stringify(merged.keys[0]) === JSON.stringify(foreignEntry)
        && merged.keys.length === 3 && third.ring && third.ring.added === false,
    "6i an entry Studio did not write survives a publish untouched, unknown field and all, and"
    + " the key that was already there was not written twice: " + merged.keys.length
    + " entries, " + JSON.stringify(merged.keys[0].placedBy) + " still on the first");

  /* A RING STUDIO CANNOT READ IS A RING STUDIO MUST NOT REPLACE, and the refusal costs the
     publish nothing because it is raised before the first byte is written: no .ec, no archive,
     no edition. A writer that started again on a file it could not parse would delete the trust
     of every other publisher on that share. */
  const brokenAt = path.join(SCRATCH, "broken");
  fs.mkdirSync(brokenAt, { recursive: true });
  const rubbish = "{ this is not JSON, and somebody's ring was here\n";
  fs.writeFileSync(path.join(brokenAt, RING_FILE), rubbish, "utf8");
  let ringRefusal = "";
  try {
    await publishFull({ project: plainProject.dir, folder: brokenAt, now: CLOCK,
      key: keyAt, passphrase: PASS, notes: "into a folder with a broken ring" });
  } catch (e) { ringRefusal = e.message; }
  check(/is not JSON/.test(ringRefusal)
        && fs.readFileSync(path.join(brokenAt, RING_FILE), "utf8") === rubbish
        && !fs.readdirSync(brokenAt).some(n => /\.ec$/.test(n)),
    "6j a ring Studio cannot read refuses the publish and is left byte for byte as it was, with"
    + " no catalog written beside it: " + JSON.stringify(ringRefusal.slice(0, 48)));

  /* ---- the key that has not published anything yet ----------------------------------------- */

  /* THE SHARP EDGE OF THE RULING. An entry binds a key to a catalog id, and a key is generated
     in Settings with no catalog in view, so there is nothing to write at key generation: a key
     that has never signed has no entry anywhere. This is the door for the manager who knows the
     id first, and it needs no passphrase, which is the measurement below - the environment is
     cleared of one and the command still writes the entry. */
  const freshAt = path.join(SCRATCH, "fresh-key.json");
  const freshDoc = await makeKeyFile({ passphrase: PASS });
  fs.writeFileSync(freshAt, JSON.stringify(freshDoc, null, 1) + "\n", "utf8");
  const cliRing = path.join(SCRATCH, "cli", RING_FILE);
  const env = Object.assign({}, process.env);
  delete env.STUDIO_KEY_PASSPHRASE;
  const cli = spawnSync(process.execPath, ["tools/sign.mjs", "ring", "--out", freshAt,
    "--catalog", "a-catalog-not-yet-published", "--ring", cliRing,
    "--note", "written before the first edition"],
    { cwd: ROOT, encoding: "utf8", env });
  const cliRead = fs.existsSync(cliRing) ? R.v2RingRead(fs.readFileSync(cliRing, "utf8")) : null;
  check(cli.status === 0 && cliRead && cliRead.problems.length === 0
        && (cliRead.ring["a-catalog-not-yet-published"] || {})[freshDoc.keyId] === freshDoc.public,
    "6k a key that has published nothing is bound to an id from the command line with no"
    + " passphrase anywhere, and the engine reads the file: exit " + cli.status + ", "
    + (cliRead ? cliRead.problems.length : "no") + " problem(s)");

  /* AND IT REFUSES AN ID THE FORMAT WOULD NOT ACCEPT, rather than writing an entry the desk
     drops in silence. The id is held to the ENGINE'S idOk, not to a rule of Studio's. */
  const badCli = spawnSync(process.execPath, ["tools/sign.mjs", "ring", "--out", freshAt,
    "--catalog", "Not An Id", "--ring", path.join(SCRATCH, "never", RING_FILE)],
    { cwd: ROOT, encoding: "utf8", env });
  check(badCli.status === 2 && !fs.existsSync(path.join(SCRATCH, "never", RING_FILE)),
    "6l and an id the format refuses writes no file at all: exit " + badCli.status + ", "
    + JSON.stringify(String(badCli.stderr || "").trim().slice(0, 56)));

  if (!argv.includes("--keep")) dropScratch(SCRATCH, "catalog-sig");
  process.stdout.write("catalog-sig: " + asserted + " assertion(s), " + failed + " failure(s), "
    + "rule from " + V.from + "\n");
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]))
  main(process.argv.slice(2)).catch(e => {
    process.stderr.write("catalog-sig: REFUSED " + (e && e.stack ? e.stack : e) + "\n");
    process.exit(2);
  });
