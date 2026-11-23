/* THE TEAM FILE CARRIES THE WRAPS: ADMISSION, A NEW EPOCH, AND THE LEAD'S RECOVERY COPY (board 834, step 12, S3).
 *
 *     node tests/team-wraps.mjs [--keep]
 *
 * THE CLAIM. Admitting a desk wraps the team key to its box for the team's epoch, and the desk's own private key opens
 * it; removing a desk starts a new epoch whose key the removed desk cannot open, though it still opens what it had. The
 * lead's recovery copy opens under the passphrase and nothing else. The team key is nowhere in the clear: not in the
 * team file and not in the folder. Wraps go only to a roster in a team file signed by the key this Studio holds: a team
 * comes in through heldTeam or not at all, and a desk is admitted only by its own genuine file, box included.
 *
 * THE DESKS ARE MODELS MADE HERE with node's own crypto, an Ed25519 pair and an X25519 pair each, the id taken from the
 * key as the design note says, so the fixture is not the code under test. The binding is checked once against the
 * pinned engine's hpkeOpen with info and aad written out below, so Studio's wrap is held to the rule as carved and not
 * only to itself.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import * as Engine from "../src/engine.mjs";
import { makeKeyFile } from "../src/sign.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "team-wraps");
const EXPECTED = 19;
const NL = String.fromCharCode(10);
const PASS = "a passphrase for the lead's key in this gate";
const RECOVER = "the lead's recovery passphrase in this gate";

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
/* A leg whose code is not there yet is a red leg and not a crashed file. */
async function leg(line, fn) {
  try { check(!!(await fn()), line); }
  catch (e) { check(false, line + " (threw: " + String(e && e.message || e).split(NL)[0].slice(0, 160) + ")"); }
}
const clone = (v) => JSON.parse(JSON.stringify(v));
const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex");
const rawPublic = (k) => crypto.createPublicKey(k).export({ type: "spki", format: "der" }).subarray(-32);
const throwsOn = async (fn) => { try { await fn(); return ""; } catch (e) { return String(e && e.message || e); } };

function newDesk(name) {
  const sign = crypto.generateKeyPairSync("ed25519"), box = crypto.generateKeyPairSync("x25519");
  const key = rawPublic(sign.privateKey).toString("hex");
  const id = "k-" + sha256(Buffer.from(key, "hex")).slice(0, 16);
  const block = { id, key, box: rawPublic(box.privateKey).toString("hex") };
  if (name) block.name = name;
  return { id, block, boxKey: box.privateKey, signKey: sign.privateKey };
}
/* A desk's own file as its shell signs one: the block, signed by `by`'s key under the desk prefix, written out here. */
const DESK_PREFIX = "etiuda-desk-branch" + NL;
function ownFile(by, block) {
  const doc = { desk: clone(block || by.block) };
  doc.sig = { alg: "Ed25519", keyId: doc.desk.id };
  doc.sig.value = crypto.sign(null, Buffer.concat([Buffer.from(DESK_PREFIX, "utf8"),
    Buffer.from(Engine.sigRules().v2SignedBytes(doc))]), by.signKey).toString("hex");
  return doc;
}
/* Every place a key's bytes could be written as text, in every file under a folder. */
function filesUnder(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d =>
    d.isDirectory() ? filesUnder(path.join(dir, d.name)) : [path.join(dir, d.name)]);
}
/* The byte list is how JSON.stringify writes a Buffer left on a team object, and it is sought with whitespace stripped
 * because writeTeam indents it a number to a line. */
function spellings(key) {
  return [key.toString("hex"), key.toString("hex").toUpperCase(), key.toString("base64"), key.toString("base64url"),
    "[" + Array.from(key).join(",") + "]", key.toString("latin1")];
}
const stripped = t => t.replace(/\s+/g, "");

async function main(argv) {
  clearScratch(SCRATCH);
  const SHARE = path.join(SCRATCH, "share");
  fs.mkdirSync(SHARE, { recursive: true });
  const R = Engine.teamRules();
  let T = null, W = null;
  try { T = await import("../src/team.mjs"); W = Engine.hpkeRules(); } catch (e) { process.stderr.write(String(e) + NL); }

  const keyAt = path.join(SCRATCH, "lead-key.json"), otherAt = path.join(SCRATCH, "other-key.json");
  const lead = await makeKeyFile({ passphrase: PASS }), other = await makeKeyFile({ passphrase: PASS });
  fs.writeFileSync(keyAt, JSON.stringify(lead, null, 1) + "\n");
  fs.writeFileSync(otherAt, JSON.stringify(other, null, 1) + "\n");
  const impostorAt = path.join(SCRATCH, "impostor-key.json");
  const impostor = await makeKeyFile({ passphrase: PASS, keyId: lead.keyId });
  fs.writeFileSync(impostorAt, JSON.stringify(impostor, null, 1) + "\n");
  const teamAt = path.join(SHARE, "etiuda-team.json");
  const ala = newDesk("Ala"), ola = newDesk("Ola"), stranger = newDesk("Ewa");
  const key1 = crypto.randomBytes(32);
  const readBack = async () => {
    const read = R.v2TeamRead(fs.readFileSync(teamAt, "utf8"));
    return { team: read.team, problems: read.problems, state: read.team ? await R.v2TeamSigState(read.team) : null };
  };
  const entry = (team, desk) => team.roster.find(e => e.desk.id === desk.id);

  /* ---- 1. ADMISSION ------------------------------------------------------------------------- */

  let epoch1 = null, bytes1 = "";
  await leg("tw1a admitting Ala and Ola wraps the team key to each box: the file reads whole by the engine's reader,"
    + " verifies under the lead's key, and each desk's own private key opens its own wrap to the team key", async () => {
    let team = Object.assign(T.newTeam({ catalogs: ["c-team-wraps"], lead: { keyId: lead.keyId, public: lead.public } }),
      { sealed: true });
    team = T.admit(T.admit(team, ownFile(ala), ala.id, key1), ownFile(ola), ola.id, key1);
    team = T.withRecovery(team, key1, RECOVER);
    await T.writeTeam(SHARE, team, { key: keyAt, passphrase: PASS });
    bytes1 = fs.readFileSync(teamAt, "utf8");
    const b = await readBack();
    epoch1 = b.team;
    const opened = [ala, ola].map(d => W.unwrapTeamKey(d.boxKey, entry(b.team, d).wrap, b.team.id, 1, d.id));
    return !b.problems.length && b.state === R.states.valid && b.team.epoch === 1
      && opened.every(k => Buffer.isBuffer(k) && k.equals(key1));
  });
  await leg("tw1b the binding as carved: the pinned engine's own hpkeOpen, given info \"etiuda-team-key\\n\" + team + \"\\n\""
    + " + epoch and the desk id as aad, opens Ala's wrap to the team key; given the epoch or desk changed, it opens nothing",
    async () => {
    const w = entry(epoch1, ala).wrap, H = Engine.hpkeRules();
    const open = (ep, desk) => H.hpkeOpen(ala.boxKey, Buffer.from(w.enc, "hex"),
      Buffer.from("etiuda-team-key" + NL + epoch1.id + NL + ep, "utf8"), Buffer.from(desk, "utf8"), Buffer.from(w.ct, "hex"));
    const right = open(1, ala.id);
    return right && right.equals(key1) && open(2, ala.id) === null && open(1, ola.id) === null;
  });
  await leg("tw1c a wrap copied onto Ola's entry, into another team or into another epoch does not open for Ala's key",
    async () => {
    const w = entry(epoch1, ala).wrap;
    return [W.unwrapTeamKey(ala.boxKey, w, epoch1.id, 1, ola.id),
      W.unwrapTeamKey(ala.boxKey, w, "t-" + "0".repeat(16), 1, ala.id),
      W.unwrapTeamKey(ala.boxKey, Object.assign({}, w, { epoch: 2 }), epoch1.id, 2, ala.id)].every(k => k === null);
  });
  await leg("tw1d THE CONTROL: another desk's key opens no wrap in the file", async () =>
    epoch1.roster.every(e => W.unwrapTeamKey(stranger.boxKey, e.wrap, epoch1.id, 1, e.desk.id) === null
      && W.unwrapTeamKey(stranger.boxKey, e.wrap, epoch1.id, 1, stranger.id) === null));
  const fresh = () => T.newTeam({ catalogs: ["c-team-wraps"], lead: { keyId: lead.keyId, public: lead.public } });
  await leg("tw1e THE CONTROL: a block whose id is not the one its key makes is refused, and nothing is wrapped", async () => {
    const forged = ownFile(stranger, Object.assign({}, ala.block, { box: stranger.block.box, key: stranger.block.key }));
    const said = await throwsOn(() => T.admit(fresh(), forged, ala.id, key1));
    return /own file/.test(said);
  });
  await leg("tw1f a desk's real id and key with another desk's box is refused, and nothing is wrapped that the other key"
    + " opens: Ala's own file with Ewa's box put in after Ala signed, the same block signed by Ewa's key, and the bare block",
    async () => {
    const block = Object.assign({}, ala.block, { box: stranger.block.box });
    const boxed = clone(ownFile(ala));
    boxed.desk.box = stranger.block.box;
    const tries = [boxed, ownFile(stranger, block), block].map(doc => {
      try {
        const t = T.admit(fresh(), doc, ala.id, key1), e = t.roster.find(x => x.desk.id === ala.id);
        return "admitted; Ewa's key opens it: " + !!(e && W.unwrapTeamKey(stranger.boxKey, e.wrap, t.id, t.epoch, ala.id));
      } catch (x) { return String(x && x.message || x); }
    });
    process.stdout.write("       " + JSON.stringify(tries.map(s => s.slice(0, 60))) + NL);
    return tries.every(s => /own file/.test(s));
  });
  /* Ala admitted and written in a folder of her own, then `block` put on her entry through withDesk, written, taken back
   * through heldTeam and into a new epoch. Whatever refused along the way, the folder's team then goes into an epoch too,
   * so the leg reads the wraps a lead would hand out next, not the step that refused. */
  const reboxed = async (dir, block, name) => {
    fs.mkdirSync(dir, { recursive: true });
    await T.writeTeam(dir, T.admit(Object.assign(fresh(), { sealed: true }), ownFile(ala), ala.id, key1), { key: keyAt, passphrase: PASS });
    const said = await throwsOn(async () => {
      const h = await T.heldTeam(dir, { key: keyAt });
      await T.writeTeam(dir, T.withDesk(h.team, block, name), { key: keyAt, passphrase: PASS });
    });
    const next = await T.newEpoch((await T.heldTeam(dir, { key: keyAt })).team, { key: keyAt });
    const e = entry(next.team, ala), opens = k => W.unwrapTeamKey(k, e.wrap, next.team.id, next.team.epoch, ala.id);
    const ewa = opens(stranger.boxKey), own = opens(ala.boxKey);
    process.stdout.write("       " + JSON.stringify(said.slice(0, 60)) + "; epoch " + next.team.epoch + ", Ewa opens Ala's wrap: "
      + !!ewa + ", Ala opens it: " + !!(own && own.equals(next.teamKey)) + NL);
    return { said, name: e.name, box: e.desk.box, ewa: !!ewa, own: !!(own && own.equals(next.teamKey)) };
  };
  await leg("tw1g a box swapped under a held team's wrap does not reach the next epoch: after withDesk with Ala's id and key"
    + " and Ewa's box, the epoch after it keeps Ala's box on her entry, her key opens her wrap and Ewa's opens nothing",
    async () => {
    const r = await reboxed(path.join(SCRATCH, "rebox"), Object.assign({}, ala.block, { box: stranger.block.box }), "Ala");
    return r.box === ala.block.box && r.own && !r.ewa;
  });
  await leg("tw1h THE CONTROL: a rename with Ala's own block is written, and in the epoch after it Ala's key opens her wrap"
    + " under the new name and Ewa's opens nothing", async () => {
    const r = await reboxed(path.join(SCRATCH, "rename"), ala.block, "Front desk");
    return r.said === "" && r.name === "Front desk" && r.box === ala.block.box && r.own && !r.ewa;
  });

  /* ---- 2. A NEW EPOCH ON REMOVAL ------------------------------------------------------------- */

  let epoch2 = null, key2 = null;
  await leg("tw2a after Ola is removed the epoch is one higher, Ola is off the roster, and Ala's own key opens her new wrap"
    + " to a new team key", async () => {
    const next = await T.newEpoch(epoch1, { key: keyAt, remove: ola.id, recoveryPassphrase: RECOVER });
    await T.writeTeam(SHARE, next.team, { key: keyAt, passphrase: PASS });
    const b = await readBack();
    epoch2 = b.team; key2 = next.teamKey;
    const mine = W.unwrapTeamKey(ala.boxKey, entry(b.team, ala).wrap, b.team.id, 2, ala.id);
    return !b.problems.length && b.state === R.states.valid && b.team.epoch === 2 && !entry(b.team, ola)
      && b.team.roster.length === 1 && Buffer.isBuffer(key2) && !key2.equals(key1) && mine && mine.equals(key2);
  });
  await leg("tw2b the removed desk still opens its old wrap to the old key, and opens nothing in the new epoch", async () => {
    const old = R.v2TeamRead(bytes1).team;
    const kept = W.unwrapTeamKey(ola.boxKey, entry(old, ola).wrap, old.id, 1, ola.id);
    const tries = epoch2.roster.map(e => W.unwrapTeamKey(ola.boxKey, e.wrap, epoch2.id, 2, e.desk.id))
      .concat([W.unwrapTeamKey(ola.boxKey, entry(epoch2, ala).wrap, epoch2.id, 2, ola.id)]);
    return kept && kept.equals(key1) && tries.every(k => k === null);
  });

  /* ---- 3. THE LEAD'S RECOVERY COPY ----------------------------------------------------------- */

  await leg("tw3a the recovery copy opens under the lead's passphrase to each epoch's own key, and to nothing under"
    + " another passphrase, moved to another team or epoch", async () => {
    const old = R.v2TeamRead(bytes1).team;
    const a = T.openRecovery(old, RECOVER), b = T.openRecovery(epoch2, RECOVER);
    const nots = [T.openRecovery(epoch2, "not the passphrase"),
      T.openRecovery(Object.assign(clone(epoch2), { id: "t-" + "0".repeat(16) }), RECOVER),
      T.openRecovery(Object.assign(clone(epoch2), { recovery: old.recovery }), RECOVER),
      T.openRecovery(Object.assign(clone(old), { epoch: 2, recovery: Object.assign({}, old.recovery, { epoch: 2 }) }), RECOVER)];
    return a && a.equals(key1) && b && b.equals(key2) && nots.every(k => k === null);
  });

  /* ---- 4. THE KEY IS NOWHERE IN THE CLEAR ---------------------------------------------------- */

  await leg("tw4a THE CONTROL: neither epoch's team key, in hex, upper-case hex, base64, base64url, as a JSON byte list or as"
    + " its raw bytes, is in the team file's bytes of either epoch or in any file under the gate's folder", async () => {
    const files = filesUnder(SCRATCH), texts = files.map(f => fs.readFileSync(f, "latin1")).concat([bytes1]);
    const found = [key1, key2].flatMap(spellings).filter(s => texts.some(t => t.indexOf(s) >= 0 || stripped(t).indexOf(s) >= 0));
    process.stdout.write("       " + files.length + " file(s) read, " + found.length + " spelling(s) found" + NL);
    return files.length >= 3 && found.length === 0;
  });

  /* ---- 5. NO ROSTER IS TRUSTED FROM A SELF-KEYED FILE ---------------------------------------- */

  await leg("tw5a THE CONTROL: a new epoch is refused on a team file signed by another key that names itself lead, on the"
    + " lead's own file with a desk added after signing, on a team with a recovery copy but no passphrase, and on a file"
    + " that verifies under another key naming the lead's own keyId", async () => {
    const theirs = T.admit(Object.assign(T.newTeam({ catalogs: ["c-team-wraps"], lead: { keyId: other.keyId, public: other.public } }),
      { sealed: true }), ownFile(stranger), stranger.id, key1);
    fs.mkdirSync(path.join(SCRATCH, "theirs"), { recursive: true });
    const selfKeyed = (await T.writeTeam(path.join(SCRATCH, "theirs"), theirs, { key: otherAt, passphrase: PASS })).team;
    const posing = T.admit(Object.assign(T.newTeam({ catalogs: ["c-team-wraps"], lead: { keyId: impostor.keyId, public: impostor.public } }),
      { sealed: true }), ownFile(stranger), stranger.id, key1);
    fs.mkdirSync(path.join(SCRATCH, "posing"), { recursive: true });
    const forged = (await T.writeTeam(path.join(SCRATCH, "posing"), posing, { key: impostorAt, passphrase: PASS })).team;
    const forgedWhole = forged.lead.keyId === lead.keyId && forged.lead.public !== lead.public
      && await R.v2TeamSigState(forged) === R.states.valid;
    const added = clone(epoch2);
    added.roster.push({ desk: stranger.block, wrap: entry(epoch2, ala).wrap });
    const said = [
      await throwsOn(() => T.newEpoch(selfKeyed, { key: keyAt, remove: [] })),
      await throwsOn(() => T.newEpoch(selfKeyed, { key: otherAt, remove: [] }).then(r => { if (r) throw new Error("ok"); })),
      await throwsOn(() => T.newEpoch(added, { key: keyAt, remove: ala.id, recoveryPassphrase: RECOVER })),
      await throwsOn(() => T.newEpoch(epoch2, { key: keyAt, remove: [] })),
      await throwsOn(() => T.newEpoch(forged, { key: keyAt, remove: [] })),
    ];
    process.stdout.write("       " + JSON.stringify(said.map(s => s.slice(0, 60))) + ", the posing file verifies: " + forgedWhole + NL);
    return /signed by this Studio/.test(said[0]) && said[1] === "ok" && /signed by this Studio/.test(said[2])
      && /recovery/.test(said[3]) && forgedWhole && /signed by this Studio/.test(said[4]);
  });

  /* ---- 6. THE BINDING'S SOURCE --------------------------------------------------------------- */

  await leg("tw6a the binding comes from the pin and from nowhere else: the pinned shell declares all four wrap declarations, the"
    + " text run is theirs, and a copy of the pinned shell lacking any one of them is refused, naming it", async () => {
    const H = Engine.hpkeRules();
    const PIN = (/^ENGINE_PIN=([0-9a-f]{40})\s*$/m.exec(fs.readFileSync(path.join(ROOT, "tools", "engine-pin"), "utf8")) || [])[1] || "";
    const text = fs.readFileSync(path.join(ROOT, "engine", "pinned", "shell", "main.js"), "utf8");
    const MARKERS = ["const TEAM_WRAP_LABEL =", "function teamWrapInfo(", "function wrapTeamKey(", "function unwrapTeamKey("];
    const refused = MARKERS.map(m => {
      const gone = text.replace(m, "REMOVED");
      let e = null;
      try { Engine.hpkeRulesFrom(gone, "a pin without the declaration"); } catch (x) { e = x; }
      return gone !== text && !!e && e.message.indexOf(JSON.stringify(m)) >= 0;
    });
    process.stdout.write("       the wrap's binding ran from " + H.from + " at pin " + PIN.slice(0, 7) + ", " + MARKERS.length
      + " declaration(s) in the pinned shell, " + refused.filter(Boolean).length + " refusal(s) with one removed" + NL);
    return H.from === "the pinned engine" && typeof H.pinnedWrap === "string"
      && MARKERS.every(m => text.indexOf(m) >= 0 && H.pinnedWrap.indexOf(m) >= 0) && refused.every(Boolean);
  });
  await leg("tw6b a pinned shell lacking an HPKE declaration is refused, naming the declaration it lacks", async () => {
    const src = fs.readFileSync(path.join(ROOT, "engine", "pinned", "shell", "main.js"), "utf8");
    let e = null;
    try { Engine.hpkeRulesFrom(src.replace("function hpkeOpen(", "function hpkeOpenOld("), "a pin before HPKE"); }
    catch (x) { e = x; }
    /* The quoted marker, as tw6a matches, and not the bare name: a slicer that skipped the missing declaration
       would fail with a ReferenceError naming hpkeOpen too (the test architect's read of 2026-10-07). */
    return !!e && e.message.indexOf(JSON.stringify("function hpkeOpen(")) >= 0;
  });

  /* ---- 7. THE HELD TEAM DOOR ------------------------------------------------------------------- */

  const TAMPERED = path.join(SCRATCH, "tampered");
  let tamperedBytes = "";
  try {
    const grown = JSON.parse(fs.readFileSync(teamAt, "utf8"));
    grown.roster.push({ desk: stranger.block });
    fs.mkdirSync(TAMPERED, { recursive: true });
    fs.writeFileSync(path.join(TAMPERED, "etiuda-team.json"), JSON.stringify(grown, null, 1) + NL);
    tamperedBytes = fs.readFileSync(path.join(TAMPERED, "etiuda-team.json"), "utf8");
  } catch (e) { process.stderr.write("  the lead's file was not there to tamper with: " + String(e && e.message) + NL); }
  await leg("tw7a heldTeam gives no team, and says why, for the lead's own file with a desk added after signing, a file signed"
    + " by another key that names itself lead, and one that verifies under another key naming the lead's own keyId", async () => {
    const folders = [TAMPERED, path.join(SCRATCH, "theirs"), path.join(SCRATCH, "posing")];
    const plain = await Promise.all(folders.map(f => T.readTeam(f)));
    const held = await Promise.all(folders.map(f => T.heldTeam(f, { key: keyAt })));
    process.stdout.write("       read " + JSON.stringify(plain.map(r => r.state)) + ", held "
      + JSON.stringify(held.map(h => h.reason)) + NL);
    return plain[0].state === R.states.invalid && plain[1].valid && plain[2].valid
      && held.every(h => h.team === null && typeof h.reason === "string" && h.reason.length > 0);
  });
  await leg("tw7b THE READ'S LAUNDERING: the lead's file with a desk added after signing, as readTeam reads it, is neither"
    + " admitted onto nor signed: admit refuses it, writeTeam refuses it with a desk labelled on, and the file keeps its bytes",
    async () => {
    const was = (await T.readTeam(TAMPERED)).team;
    const said = [await throwsOn(() => T.admit(was, ownFile(ola), ola.id, key2)),
      await throwsOn(() => T.writeTeam(TAMPERED, T.withDesk(was, ola.block, "Ola"), { key: keyAt, passphrase: PASS }))];
    const after = await T.readTeam(TAMPERED);
    process.stdout.write("       " + JSON.stringify(said.map(s => s.slice(0, 60))) + ", afterwards " + after.state + NL);
    return said.every(s => /heldTeam/.test(s)) && tamperedBytes.length > 0
      && fs.readFileSync(path.join(TAMPERED, "etiuda-team.json"), "utf8") === tamperedBytes && after.state === R.states.invalid;
  });
  await leg("tw7c THE CONTROL: the lead's own file comes back through heldTeam, and admitting Ola onto it by her own file"
    + " and writing it gives a file that reads whole, verifies under the lead's key, and opens to the team key for Ola",
    async () => {
    const h = await T.heldTeam(SHARE, { key: keyAt });
    await T.writeTeam(SHARE, T.admit(h.team, ownFile(ola), ola.id, key2), { key: keyAt, passphrase: PASS });
    const b = await readBack(), k = W.unwrapTeamKey(ola.boxKey, entry(b.team, ola).wrap, b.team.id, 2, ola.id);
    return h.reason === "" && !b.problems.length && b.state === R.states.valid && b.team.roster.length === 2
      && !!k && k.equals(key2);
  });

  await leg("tw8 a team file carrying the lead's book still reads whole under the pinned engine, the recovery copy still opens,"
    + " and the book still opens after a new epoch", async () => {
    let Book = null;
    try { Book = await import("../src/lead-book.mjs"); } catch { Book = null; }
    if (!Book) return false;
    const held = await T.heldTeam(SHARE, { key: keyAt });
    const pass = T.recoveryOf(keyAt, PASS);
    Book.sealLeadBook(held.team, pass, { v: 1, invites: {}, removed: {}, handled: [], unopened: [] });
    await T.writeTeam(SHARE, held.team, { key: keyAt, passphrase: PASS });
    const back = await T.readTeam(SHARE);
    const R2 = Engine.teamRules();
    const sig = await R2.v2TeamSigState(back.team);
    const key = T.openRecovery(back.team, RECOVER);
    const moved = await T.newEpoch(back.team, { key: keyAt, secret: PASS });
    const book = Book.openLeadBook(moved.team, pass);
    const text = fs.readFileSync(teamAt, "utf8");
    return !back.problems.length && sig === R2.states.valid && !!back.team.leadBook && !!key && key.equals(key2)
      && !!book && book.v === 1 && text.indexOf("\"ct\"") >= 0 && T.openRecovery(moved.team, pass) && T.openRecovery(moved.team, pass).equals(moved.teamKey);
  });

  if (argv.indexOf("--keep") < 0) dropScratch(SCRATCH, "team-wraps");
  process.stdout.write("#counts checks=" + asserted + " failed=" + failed + " expected=" + EXPECTED + "\n");
  if (asserted !== EXPECTED) {
    process.stderr.write("SUITE DID NOT COMPLETE: " + asserted + " of " + EXPECTED + " checks ran\n");
    return 78;
  }
  process.stdout.write("\nteam-wraps  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  return failed ? 1 : 0;
}

main(process.argv.slice(2)).then(c => process.exit(c), e => {
  process.stderr.write(String(e && e.stack || e) + "\n"); process.exit(2);
});
