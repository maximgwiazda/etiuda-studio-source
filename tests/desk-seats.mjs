/* A DESK'S SEAT, AS ITS LEAD SEES IT (board 980; the person's own sign-in, Claude alpha's night decision 18).
 *
 *     node tests/desk-seats.mjs
 *
 * THE CRITERION (Max, 2026-11-12 02:07: "Yes, absolutely make sign-in the agent's own."; Claude alpha's ruling 4, his words: the
 * seat certificate, "and no token or name ever reaching a lead"): the desk signs its person in to the licence service itself and
 * writes the certificate it is given as seat.json; the lead's Studio checks it and sends nothing; a seat never removes a desk, since
 * a removal re-keys the whole team; a lead that did not sign in reads nothing.
 *
 * A real folder team in scratch, its lead key made here and its desks let in by the watch's own admission (watchAdmit); each
 * desk's seat.json written as the interface of 2026-11-12 states the desk writes it, format 2, its certificate signed here by a
 * test service key under a delegation from a test root, which this process trusts as a development tree does (STUDIO_VENDOR_KEY).
 * Nothing reaches a network, a provider or the licence service: the service's own certificates, and its refusals, are
 * tests/licence-service.mjs s71 to s79, and tests/signin-renewal.mjs sr5 takes one end to end. No window.
 *
 *   ds1  a certificate for this Studio's licence, this desk's roster key and a time ahead is taken: the desk counts as seated,
 *        by the certificate's person and code
 *   ds2  refused: a forged signature, another licence's reference, a certificate for another desk's key (written into this desk's
 *        folder, or moved from another desk's), an expired one, one whose delegation the root did not sign, one running past
 *        thirty days, and format 1, the retired sealed token, read as nothing even where it carries a good certificate
 *   ds2c the certificate's bytes are requests.mjs seatCertBytes, restated in src/desk-seat.mjs from its own line
 *   ds2d a desk-only licence's certificate (deskOnly: true, the line "desk-only" in its bytes) is taken; the field taken off, put
 *        on or false is not; its bytes are requests.mjs seatCertBytes too
 *   ds2e a Studio's member certificate (member: true, the line "member" in its bytes; the addendum on the member certificate) is no
 *        desk's seat: refused, and stripped of its mark it fails the signature; its bytes are requests.mjs seatCertBytes too
 *   ds3  Free seat: a seat the lead freed stays freed while the desk shows the certificate it had, and a newer certificate seats
 *        it again; the team file is the same bytes after, the desk on it with its wrap, the key number unchanged
 *   ds4  removal is never called, and no forward is ever sent: no path names a removal, seat/desk or a token's forward
 *   ds5  the hint: an invitation carries it from a signed-in lead and none otherwise; the team file is signed with it, and loses
 *        it when the lead no longer signed in; a hint a desk would not read is refused; personal accounts stay allowed
 *        (ds5d: a pin whose reader gives back the providers alone still takes the invitation)
 *   ds6  the floor: a lead with no licence reference from a sign-in reads no desk's seat
 *   ds7  the freeing is a signed request through the one door, by the certificate's person
 *   ds8  the Desks screen says each member's seat to a signed-in lead, and Free seat presses the shell's channel; no Free
 *        seat where the shell says this lead may not free it (decision 46)
 *   ds9  A3 on a folder team: a desk asking to join with no invitation, its certificate naming a person a roster desk's names, is let
 *        in with nobody acting and automatic joining off; another person's, another licence's, or any with no reference kept, waits
 *   ds10 a person the lead admitted to the team by code (the Team screen's Admit, recorded in team-people.json beside Studio's
 *        settings): a desk whose certificate names them is let in with nobody acting, their first desk included; a stranger's, or
 *        one admitted to another team, waits
 *   ds11 a seat the lead freed is known by no certificate issued before the freeing, so that person's desk asking with no
 *        invitation waits until certificates issued after it stand; the book keeps whose a desk was once its seat is freed or run out
 *   ds12 A4, a relay team's standing door: a request at the door, its certificate inside it, naming a known person (a roster desk's,
 *        or one admitted by code) is let in with nobody acting and handed back with its door id for the lead's answer; with no
 *        reference kept it waits and nothing is dropped
 *   ds13 a stranger's certified desk at the door, or one of another licence, is not let in and is handed back to be dropped
 *   ds14 a person marked removed is not let in at the door until admitted again, whatever a roster desk of theirs holds
 *   ds18 a desk whose request to join carries one seat document and whose seat.json is a later, different one (or expired or
 *        signed out) is read by seat.json, not the request: Desks state, Free seat, and the same-person set
 *   ds19 a desk's seat.json, and a renewed one, each move the watch's stamp of the team's folder, so the look they move reads them;
 *        the shell's Desks answer carries the seat book (re-aimed from folder-mirror-studio fms48, A-S5)
 *   ds20 board 1017, fold 95's B: at a relay team's door a person the lead's list (person/list) shows added, seated and on this team
 *        is kept from it (src/desk-seat.mjs joinedPeople) and their desk let in with nobody acting; seated false, the lead's other
 *        relay team, not added or not listed: not let in, handed back to be dropped
 *   ds21 a kept Join goes when the list shows seated false or no longer lists them, a read naming nobody on the team ignored; a code
 *        admission is left; a removed person is taken back only by a list asked after the service answered the removal
 *   ds22 one look at a relay team's door driven (src/desk-seat.mjs doorLook): no read on a quiet look, one read and a second pass
 *        where a request is refused, nothing dropped while no read may be made, the first pass's refusals dropped with no list at all
 *
 * PLANTED FAULTS, each in a scratch copy (tests/plant-copy.mjs, and tests/plants-tree.mjs for ds18), turn their leg red: the format not read (ds2), the delegation
 * not judged (ds2), the end not read (ds2), a freed seat seated again by its old certificate (ds3), a known person's desk not let
 * in (ds9), any person's desk let in (ds9), an admitted person's desk not let in (ds10),
 * a freed person known by an old certificate (ds11), any door request let in (ds13), a removed person known again (ds14), the request's seat read ahead of seat.json (ds18), a seat.json the watch's stamp does not see (ds19). ETIUDA_PLANTS=off skips that phase and counts each plant as skipped.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as Engine from "../src/engine.mjs";
import * as Studio from "../src/studio.mjs";
import * as D from "../src/desk-seat.mjs";
import * as JOIN from "../src/join.mjs";
import * as C from "../src/licence-client.mjs";
import * as L from "../src/licence.mjs";
import * as Q from "../service/licence/requests.mjs";
import { makeKeyFile, readKeyFile } from "../src/sign.mjs";
import { newTeam, withRecovery, writeTeam, heldTeam, withSignin, withChannel } from "../src/team.mjs";
import { makeInvite, newSecret } from "../src/invite.mjs";
import { copyPlants } from "./plant-copy.mjs";
import { plantsTree, treeSha, dropPlantsTree } from "./plants-tree.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const SCRATCH = path.join(ROOT, "scratch", "desk-seats");
const EXPECTED = 65; /* 47 at the merge base, 17 more on main, 1 more on the folder removal */
/* DESK_SEATS_ONLY=<leg id> runs that leg alone, for a planted control. */
const ONLY = process.env.DESK_SEATS_ONLY || "";
const PASS = "harbour-lamp-passphrase";
const TID = "4f1c2a9e-0b7d-4e55-9a31-6c2d8e0f7a12";
const CONSUMERS = "9188040d-6c67-4c5b-b112-36a304b66dad";
const HINT = { providers: [{ id: "microsoft", issuer: "https://login.microsoftonline.com/{tenantid}/v2.0", clientId: "6f2b1c0e-3a4d-4b8e-9c71-2d5e8f0a1b33", allow: [TID] }] };
const MS = { id: "microsoft", issuer: HINT.providers[0].issuer, clientId: HINT.providers[0].clientId };
const DAY = 24 * 3600000;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
function skip(line) {
  asserted++;
  process.stdout.write("  SKIP " + line + "\n");
}
async function leg(line, fn) {
  if (ONLY && line.split(" ")[0] !== ONLY) return;
  try { check(!!(await fn()), line); }
  catch (e) { check(false, line + " (threw: " + String(e && e.stack || e).split("\n").slice(0, 3).join(" | ").slice(0, 300) + ")"); }
}

const raw = (k) => k.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
const b64u = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
/* A recorded-shape Microsoft ID token (claims as the v2.0 reference names them), unsigned, for the hint's organisation alone. */
function idToken(c) {
  const now = Math.floor((c.now || Date.now()) / 1000);
  return b64u({ typ: "JWT", alg: "RS256", kid: "stand-in" }) + "." + b64u({ aud: MS.clientId, iss: "https://login.microsoftonline.com/" + (c.tid || TID) + "/v2.0",
    iat: now - 60, nbf: now - 60, exp: now + 3600, sub: c.sub, tid: c.tid || TID, oid: crypto.randomUUID() }) + "." + Buffer.from("stand-in").toString("base64url");
}

/* THE TRUST: a test root this process trusts (a development tree's STUDIO_VENDOR_KEY), a service key it delegates for "licence",
   and a second root's delegation, which nobody here trusts. */
const keyOf = (pk) => ({ privateKey: pk, pub: raw(crypto.createPublicKey(pk)) });
const ROOTK = keyOf(crypto.generateKeyPairSync("ed25519").privateKey), OTHER_ROOT = keyOf(crypto.generateKeyPairSync("ed25519").privateKey);
const SERVICEK = keyOf(crypto.generateKeyPairSync("ed25519").privateKey);
const SERVICE_ID = "studio-" + crypto.createHash("sha256").update(Buffer.from(SERVICEK.pub, "hex")).digest("hex").slice(0, 16);
process.env.STUDIO_VENDOR_KEY = ROOTK.pub;
const NOW = Date.now();
const delegationBy = (root) => L.createTestDelegation({ key: { id: SERVICE_ID, pub: SERVICEK.pub }, may: ["licence", "relay-grant"],
  from: NOW - 60 * DAY, until: NOW + 300 * DAY }, root.privateKey, "etiuda-root-test");
const DELEGATION = delegationBy(ROOTK), STRANGER = delegationBy(OTHER_ROOT);
const REF = "5a".repeat(16), OTHER_REF = "6b".repeat(16);
const personOf = (word) => crypto.createHash("sha256").update("pseudonym\n" + word).digest("hex");
const codeOf = (word) => Array.from(crypto.createHash("sha256").update("code\n" + word).digest(), (b) => "0123456789ABCDEFGHJKMNPQRSTVWXYZ"[b & 31]).slice(0, 16).join("");
/** A seat certificate as the licence service makes one (service/licence/core.mjs certificateFor), signed over requests.mjs
 *  seatCertBytes by `o.signer` (the delegated service key) with `o.via` (the delegation). */
function certFor(deskKey, o) {
  const issued = o.issued !== undefined ? o.issued : NOW - 60000;
  const cert = { kind: "etiuda-seat-certificate", format: 1, licence: o.licence || REF, desk: deskKey, person: personOf(o.person), code: codeOf(o.person),
    issued, until: o.until !== undefined ? o.until : issued + 30 * DAY, via: o.via || DELEGATION, sig: { alg: "Ed25519", keyId: SERVICE_ID } };
  if (o.deskOnly !== undefined) cert.deskOnly = o.deskOnly;
  if (o.member !== undefined) cert.member = o.member;
  cert.sig.value = crypto.sign(null, Buffer.from(Q.seatCertBytes(cert)), (o.signer || SERVICEK).privateKey).toString("hex");
  return cert;
}

/* A desk: its signing pair, id and box, and a genuine request to join (proving `inv` where given). */
function makeDesk(share, teamId, name, inv) {
  const J = Engine.joinRules();
  const pair = crypto.generateKeyPairSync("ed25519");
  const pub = raw(pair.publicKey), id = J.branchIdOf(pub), box = raw(crypto.generateKeyPairSync("x25519").publicKey);
  const nonce = crypto.randomBytes(32).toString("hex");
  const commit = J.joinCommit(teamId, pub, box, nonce);
  const doc = { format: 1, kind: J.JOIN_KIND, team: teamId, desk: { id, key: pub, box, name }, date: "2026-11-11T21:00:00.000Z",
    commit };
  if (inv) doc.invite = { id: inv.id, proof: Engine.inviteRules().memberProof(inv.secret, commit) };
  doc.sig = { alg: "Ed25519", keyId: id };
  doc.sig.value = crypto.sign(null, J.joinSignedBytes(doc), pair.privateKey).toString("hex");
  fs.mkdirSync(path.join(share, "desks", id), { recursive: true });
  fs.writeFileSync(path.join(share, "desks", id, "join.json"), JSON.stringify(doc));
  return { id, pub, priv: pair.privateKey, box };
}

/* A folder team with `n` desks admitted by invitation, and the seat.json writer. */
async function teamWith(n, tag) {
  const base = path.join(SCRATCH, tag), share = path.join(base, "share");
  fs.mkdirSync(path.join(share, "desks"), { recursive: true });
  const keyAt = path.join(base, "lead-key.json");
  const lead = await makeKeyFile({ passphrase: PASS });
  fs.writeFileSync(keyAt, JSON.stringify(lead, null, 1) + "\n");
  const teamKey = crypto.randomBytes(32);
  let team = newTeam({ catalogs: ["harbour-lamps"], lead: { keyId: lead.keyId, public: lead.public } });
  /* On the relay (was: a team kept for a shared folder; Studio admits nobody at one now, the folder team's removal): the doors are the relay's. */
  team = withChannel(team, { kind: "relay", rt: "3c".repeat(16), url: "https://etiuda.dev/relay/v1/" }, { format: 1, kind: "etiuda-ring", keys: [] });
  team = withRecovery(team, teamKey, PASS);
  team = (await writeTeam(share, team, { key: keyAt, passphrase: PASS })).team;
  const desks = [], invites = {};
  for (let i = 0; i < n; i++) {
    const sec = newSecret(), invId = Engine.inviteRules().inviteIdOf(sec);
    const inv = { id: invId, team: team.id, secret: sec, made: new Date(NOW - DAY).toISOString(), expires: new Date(NOW + 6 * DAY).toISOString(), state: "live" };
    invites[invId] = inv;
    desks.push(makeDesk(share, team.id, "Harbour " + (i + 1), inv));
  }
  const teamKeys = { [team.id]: { 1: teamKey } };
  await Studio.watchAdmit(share, keyAt, PASS, { teamKeys, invites });
  const held = (await heldTeam(share, { key: keyAt })).team;
  /* The desk's own write (the interface): format 2, the desk's id, the certificate, straight into share/desks/<id>/seat.json
     (the folder Studio reads, standing for the share as a desk's syncer would leave it, with no separate lead mirror) unless `o.into`. */
  const seat = (desk, o) => {
    const certificate = o.certificate || certFor((o.keyOf || desk).pub, o);
    const doc = { format: 2, desk: (o.as || desk).id, certificate };
    fs.writeFileSync(path.join(share, "desks", (o.into || desk).id, "seat.json"), JSON.stringify(doc));
    return doc;
  };
  const proofs = (o) => Studio.seatProofs(share, keyAt, PASS, Object.assign({ hint: HINT, ref: REF, teamKeys }, o || {}));
  return { share, keyAt, lead, team: held, desks, seat, proofs, teamKeys };
}
const teamFile = (share) => fs.readFileSync(path.join(share, "etiuda-team.json"), "utf8");

/* A relay team as its mirror holds it: a folder team with one desk let in, whose seat.json is written straight into
   w.share/desks/<id>/seat.json (standing here for the relay's mirror, which Studio's watchAdmit reads directly) naming "kasia",
   signed again with the relay channel (as src/relay.mjs's mirror carries it). Nothing reaches a relay: the watch reads the mirror alone. */
async function relayTeamWith(tag) {
  const w = await teamWith(1, tag);
  w.seat(w.desks[0], { person: "kasia" }); /* writes straight into w.share/desks/<id>/seat.json (the relay's mirror, read by Studio) */
  const team = withChannel(w.team, { kind: "relay", rt: "3c".repeat(16), url: "https://etiuda.dev/relay/v1/" }, { format: 1, kind: "etiuda-ring", keys: [] });
  w.team = (await writeTeam(w.share, team, { key: w.keyAt, passphrase: PASS })).team;
  return w;
}
/* A desk's request at the relay team's standing door, as the desk's channel uploads it: its own request to join, carrying its seat
   ({format: 2, desk, certificate}) and the relay's id for the request (`door`), both under the desk's own signature. */
function doorDesk(w, name, o) {
  const J = Engine.joinRules();
  const pair = crypto.generateKeyPairSync("ed25519");
  const pub = raw(pair.publicKey), id = J.branchIdOf(pub), box = raw(crypto.generateKeyPairSync("x25519").publicKey);
  const door = crypto.randomBytes(16).toString("hex");
  const commit = J.joinCommit(w.team.id, pub, box, crypto.randomBytes(32).toString("hex"));
  const doc = { format: 1, kind: J.JOIN_KIND, team: w.team.id, desk: { id, key: pub, box, name }, date: "2026-11-12T05:00:00.000Z",
    commit, seat: { format: 2, desk: id, certificate: certFor(pub, o) } };
  if (o.inv) doc.invite = { id: o.inv.id, proof: Engine.inviteRules().memberProof(o.inv.secret, commit) };
  if (!o.noDoor) doc.door = door;
  doc.sig = { alg: "Ed25519", keyId: id };
  doc.sig.value = crypto.sign(null, J.joinSignedBytes(doc), pair.privateKey).toString("hex");
  fs.mkdirSync(path.join(w.share, "desks", id), { recursive: true });
  fs.writeFileSync(path.join(w.share, "desks", id, "join.json"), JSON.stringify(doc));
  return { id, pub, box, door };
}

async function main() {
  clearScratch(SCRATCH);
  const now = Date.now();

  await leg("ds1 a certificate for this Studio's licence, the roster's key for its desk and a time ahead is taken, and the desk counts as seated by its person", async () => {
    const w = await teamWith(2, "ds1");
    const [x, y] = w.desks;
    /* Writes straight into w.share/desks/<x.id>/seat.json (the folder Studio reads, standing for the share as a desk's syncer would leave it). */
    w.seat(x, { person: "mira" });
    const r = await w.proofs();
    const got = r.opened[x.id].got;
    const book = D.seatBook({}, r.opened, now);
    return w.team.roster.length === 2 && got.ok === true && got.person === personOf("mira") && got.code === codeOf("mira")
      && book.desks[x.id].state === "seated" && book.desks[x.id].seat === personOf("mira") && book.desks[y.id].state === "none" && !book.desks[y.id].seat
      && r.opened[y.id].got === null;
  });

  await leg("ds2 refused: a forged signature, another licence's reference, another desk's key, an expired certificate, a delegation the root did not sign, one past thirty days, and format 1", async () => {
    const w = await teamWith(2, "ds2");
    const [x, y] = w.desks;
    /* Each write lands straight in w.share/desks/<id>/seat.json (the folder Studio reads, standing for the share as a desk's syncer would leave it). */
    const why = async (o, desk) => { w.seat(desk || x, o); return (await w.proofs()).opened[(o.into || desk || x).id].got; };
    const forged = await why({ person: "p", signer: keyOf(crypto.generateKeyPairSync("ed25519").privateKey) });
    const elsewhere = await why({ person: "p", licence: OTHER_REF });
    const otherKey = await why({ person: "p", keyOf: y });
    const moved = await why({ person: "p", into: y, as: x });
    const expired = await why({ person: "p", issued: now - 31 * DAY, until: now - DAY });
    const stranger = await why({ person: "p", via: STRANGER });
    const long = await why({ person: "p", until: now + 40 * DAY });
    /* Writes straight into w.share/desks/<x.id>/seat.json (the folder Studio reads, standing for the share as a desk's syncer would leave it). */
    fs.writeFileSync(path.join(w.share, "desks", x.id, "seat.json"), JSON.stringify({ format: 1, desk: x.id, sealed: { kind: "etiuda-seat-sealed" }, sig: {} }));
    const r = await w.proofs();
    const old = r.opened[x.id].got;
    const book = D.seatBook({}, r.opened, now);
    /* Writes straight into w.share/desks/<x.id>/seat.json (the folder Studio reads, standing for the share as a desk's syncer would leave it). */
    const good = w.seat(x, { person: "p" });
    fs.writeFileSync(path.join(w.share, "desks", x.id, "seat.json"), JSON.stringify(Object.assign({}, good, { format: 1 })));
    const oldShape = (await w.proofs()).opened[x.id].got;
    const seen = { forged: forged.why, elsewhere: elsewhere.why, otherKey: otherKey.why, moved: moved.why, expired: expired.why, stranger: stranger.why, long: long.why, old: old.why, oldShape: oldShape.why };
    const want = { forged: "sig", elsewhere: "licence", otherKey: "desk", moved: "desk", expired: "expired", stranger: "delegation", long: "shape", old: "shape", oldShape: "shape" };
    return JSON.stringify(seen) === JSON.stringify(want) && book.desks[x.id].state === "bad" && !book.desks[x.id].seat
      && D.seatBook({}, { [x.id]: { key: x.pub, got: elsewhere } }, now).desks[x.id].state === "elsewhere"
      && D.seatBook({}, { [x.id]: { key: x.pub, got: expired } }, now).desks[x.id].state === "expired" || (console.error("ds2 " + JSON.stringify(seen)), false);
  });

  await leg("ds2c the certificate's bytes are requests.mjs seatCertBytes, restated in src/desk-seat.mjs from its own line", async () => {
    const c = certFor("ab".repeat(32), { person: "p" });
    return Buffer.compare(D.certBytes(c), Buffer.from(Q.seatCertBytes(c))) === 0 && D.CERT_LINE === Q.DOMAINS.seatCert;
  });

  await leg("ds2d a desk-only licence's certificate is taken, its field signed; taken off, put on or false it is not; its bytes are seatCertBytes", async () => {
    const pair = crypto.generateKeyPairSync("ed25519"), pub = raw(pair.publicKey), id = Engine.deskRules().branchIdOf(pub);
    const o = { desk: id, deskKey: pub, ref: REF, now: NOW }, doc = (c) => ({ format: 2, desk: id, certificate: c });
    const only = certFor(pub, { person: "solo", deskOnly: true }), stripped = Object.assign({}, only);
    delete stripped.deskOnly;
    const added = Object.assign(certFor(pub, { person: "solo" }), { deskOnly: true }), falsy = certFor(pub, { person: "solo", deskOnly: false });
    const why = (c) => { const r = D.checkSeat(doc(c), o); return r.ok ? "ok" : r.why; };
    return why(only) === "ok" && why(certFor(pub, { person: "solo" })) === "ok" && why(stripped) === "sig" && why(added) === "sig" && why(falsy) === "shape"
      && Buffer.compare(D.certBytes(only), Buffer.from(Q.seatCertBytes(only))) === 0 && D.certBytes(only).toString("utf8").endsWith("\ndesk-only")
      || (console.error("ds2d " + JSON.stringify([why(only), why(stripped), why(added), why(falsy)])), false);
  });

  await leg("ds2e a Studio's member certificate, its mark signed, is no desk's seat: refused, and stripped of its mark it fails the signature; its bytes are seatCertBytes", async () => {
    const pair = crypto.generateKeyPairSync("ed25519"), pub = raw(pair.publicKey), id = Engine.deskRules().branchIdOf(pub);
    const o = { desk: id, deskKey: pub, ref: REF, now: NOW }, doc = (c) => ({ format: 2, desk: id, certificate: c });
    const marked = certFor(pub, { person: "solo", member: true }), stripped = Object.assign({}, marked);
    delete stripped.member;
    const why = (c) => { const r = D.checkSeat(doc(c), o); return r.ok ? "ok" : r.why; };
    return why(marked) === "shape" && why(stripped) === "sig" && why(certFor(pub, { person: "solo" })) === "ok"
      && Buffer.compare(D.certBytes(marked), Buffer.from(Q.seatCertBytes(marked))) === 0 && D.certBytes(marked).toString("utf8").endsWith("\nmember")
      || (console.error("ds2e " + JSON.stringify([why(marked), why(stripped)])), false);
  });

  await leg("ds3 a seat the lead freed stays freed while the desk shows its old certificate, and a newer one seats it again; the team file is the same bytes after", async () => {
    const w = await teamWith(1, "ds3");
    const [x] = w.desks;
    /* Both writes go straight into w.share/desks/<x.id>/seat.json (the folder Studio reads, standing for the share as a desk's syncer would leave it). */
    w.seat(x, { person: "ola", issued: now - 3600000 });
    const b1 = D.seatBook({}, (await w.proofs()).opened, now);
    const before = teamFile(w.share);
    const freed = D.seatFreed(b1, personOf("ola"), now);
    const still = D.seatBook(freed, (await w.proofs()).opened, now + 1000);
    w.seat(x, { person: "ola", issued: now + 2000 });
    const again = D.seatBook(still, (await w.proofs()).opened, now + 3000);
    const held = (await heldTeam(w.share, { key: w.keyAt })).team;
    return b1.desks[x.id].state === "seated" && freed.desks[x.id].state === "freed" && !freed.desks[x.id].seat
      && still.desks[x.id].state === "freed" && !still.desks[x.id].seat && again.desks[x.id].state === "seated" && again.desks[x.id].seat === personOf("ola")
      && before === teamFile(w.share) && held.roster.some((e) => e.desk.id === x.id && e.wrap) && held.epoch === w.team.epoch;
  });

  await leg("ds4 no path names a removal, seat/desk or a token's forward: src/desk-seat.mjs, the thread's seatProofs, the shell's seat pass and Free seat, the client", async () => {
    const seatSrc = fs.readFileSync(path.join(ROOT, "src", "desk-seat.mjs"), "utf8");
    const studio = fs.readFileSync(path.join(ROOT, "src", "studio.mjs"), "utf8");
    const shell = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
    const client = fs.readFileSync(path.join(ROOT, "src", "licence-client.mjs"), "utf8");
    const between = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i + 1); return i >= 0 && j > i ? s.slice(i, j) : ""; };
    const proofs = between(studio, "async function seatProofs(", "/* THE SEALED EDITIONS AT THE EPOCH JUST CLOSING.");
    const pass = between(shell, "const deskSeatLib = lazy(", 'answer("studio:licence-check"');
    const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
    const removal = /removeMember|newEpoch|withoutDesk|closeRequest|member-remove|moveEpoch/;
    const forward = /seat\/desk|forwardDesk|seatDeskBytes|sealSeat|openSeat|hpkeOpen/;
    return !!proofs && !!pass && [seatSrc, proofs, pass].every((s) => !removal.test(code(s)) && !forward.test(code(s)))
      && !/seat\/desk|forwardDesk|seatDeskBytes/.test(code(client)) && C.forwardDesk === undefined && !/licenceRequest/.test(code(between(pass, "async function seatPass(", "/** Where each desk")));
  });

  const SAMPLE_RELAY = { rt: "00".repeat(16), url: "https://relay.etiuda.test/relay/v1", token: "11".repeat(32), inv: "22".repeat(16) };
  await leg("ds5 an invitation from a signed-in lead carries the hint, read back the same, and one from any other lead carries none", async () => {
    const w = await teamWith(0, "ds5");
    const target = { team: w.team.id, folder: w.share, lead: { keyId: w.team.lead.keyId, public: w.team.lead.public } };
    const blob = (t) => JSON.parse(Buffer.from(makeInvite(t, "Harbour lead", newSecret(), now, undefined, SAMPLE_RELAY).blob.slice("etiuda-join:".length), "base64url").toString("utf8"));
    const withHint = blob(Object.assign({}, target, { signin: HINT })), without = blob(target);
    const junk = blob(Object.assign({}, target, { signin: { providers: [{ id: "microsoft", issuer: "http://insecure.example", clientId: "x", allow: "everyone" }] } }));
    return JSON.stringify(withHint.signin) === JSON.stringify(D.hintOf(HINT)) && without.signin === undefined && junk.signin === undefined;
  });

  await leg("ds5d a pin whose reader gives the hint back as its providers (the desk's inviteRead of stage 3) still makes the invitation, and one that reads other providers makes none", async () => {
    const w = await teamWith(0, "ds5d");
    const target = { team: w.team.id, folder: w.share, lead: { keyId: w.team.lead.keyId, public: w.team.lead.public }, signin: HINT };
    const I = Engine.inviteRules(), real = I.inviteRead;
    const fromBlob = (blob) => JSON.parse(Buffer.from(String(blob).slice("etiuda-join:".length), "base64url").toString("utf8"));
    let made = null, refused = false;
    try {
      I.inviteRead = (blob, posix) => Object.assign(real(blob, posix), { signin: fromBlob(blob).signin.providers.slice(0, 8) });
      made = makeInvite(target, "Harbour lead", newSecret(), now, undefined, SAMPLE_RELAY);
      I.inviteRead = (blob, posix) => Object.assign(real(blob, posix), { signin: [Object.assign({}, fromBlob(blob).signin.providers[0], { allow: "personal" })] });
      try { makeInvite(target, "Harbour lead", newSecret(), now, undefined, SAMPLE_RELAY); } catch { refused = true; }
    } finally { I.inviteRead = real; }
    return !!made && JSON.stringify(fromBlob(made.blob).signin) === JSON.stringify(D.hintOf(HINT)) && refused;
  });

  await leg("ds5b the team file is signed with the hint, keeps it while it stands, and loses it when the lead no longer signed in", async () => {
    const w = await teamWith(1, "ds5b");
    const r1 = await w.proofs();
    const t1 = (await heldTeam(w.share, { key: w.keyAt })).team;
    const r2 = await w.proofs();
    const r3 = await w.proofs({ hint: null });
    const t3 = (await heldTeam(w.share, { key: w.keyAt })).team;
    return r1.hinted === true && JSON.stringify(t1.signin) === JSON.stringify(D.hintOf(HINT)) && r2.hinted === false
      && r3.hinted === true && t3.signin === undefined && t3.roster.length === 1;
  });

  await leg("ds5c a hint a desk would not read is refused by the team file; personal accounts stay allowed", async () => {
    const t = newTeam({ catalogs: ["harbour-lamps"], lead: { keyId: "studio-0123456789abcdef", public: "ab".repeat(32) } });
    let refused = false;
    try { withSignin(t, { providers: [{ id: "microsoft", issuer: MS.issuer, clientId: MS.clientId, allow: ["not a domain!"] }] }); } catch { refused = true; }
    const personalMs = D.hintFor(MS, D.orgOf(MS, idToken({ sub: "p", tid: CONSUMERS })));
    const google = { id: "google", issuer: "https://accounts.google.com", clientId: "1234-abc.apps.googleusercontent.com" };
    const gTok = (hd) => b64u({ alg: "RS256" }) + "." + b64u(Object.assign({ iss: "https://accounts.google.com", sub: "g1", exp: 9e9 }, hd ? { hd } : {})) + ".x";
    return refused && personalMs.providers[0].allow === "personal" && D.orgOf(google, gTok(null)) === "personal"
      && D.orgOf(google, gTok("Harbour-Tools.example")) === "harbour-tools.example"
      && JSON.stringify(D.hintFor(MS, TID).providers[0].allow) === JSON.stringify([TID]) && D.hintFor(null, TID) === null;
  });

  await leg("ds6 a lead with no licence reference from a sign-in reads no desk's seat", async () => {
    const w = await teamWith(1, "ds6");
    /* Writes straight into w.share/desks/<id>/seat.json (the folder Studio reads, standing for the share as a desk's syncer would leave it). */
    w.seat(w.desks[0], { person: "p" });
    const r = await w.proofs({ ref: "" });
    return !!r.team && Object.keys(r.opened).length === 0 && Object.keys(D.seatBook({}, r.opened, now).desks).length === 0;
  });

  await leg("ds6b the shell reads desks' seats only where the lead signed in and kept its licence reference, and the pass stops on it", async () => {
    const shell = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
    const client = fs.readFileSync(path.join(ROOT, "src", "licence-client.mjs"), "utf8");
    const GUARDS = ['if (st.by !== "signin" || typeof st.signinOrg !== "string" || !st.signinOrg) return null; /* plant:s3-hint-floor */',
      'return st.by === "signin" && typeof st.licenceRef === "string" && /^[0-9a-f]{32}$/.test(st.licenceRef) ? st.licenceRef : "";',
      "if (!ref || !r || !r.team) return; /* plant:s3-pass-floor */", "delete next.licenceRef;"];
    const holds = (text) => GUARDS.every((g) => text.includes(g)) && /next\.licenceRef = a\.ref;/.test(client);
    /* Each guard planted away in memory turns this leg red; with ETIUDA_PLANTS=off the plants are not made (plant-hold pk-off). */
    const plantsHold = process.env.ETIUDA_PLANTS === "off" || GUARDS.every((g) => !holds(shell.split(g).join("")));
    return holds(shell) && plantsHold;
  });

  await leg("ds6c nothing local waits on a sign-in: a desk with no seat, or one that is not read, keeps its place and wrap on the roster", async () => {
    const w = await teamWith(2, "ds6c");
    /* Writes straight into w.share/desks/<id>/seat.json (the folder Studio reads, standing for the share as a desk's syncer would leave it). */
    fs.writeFileSync(path.join(w.share, "desks", w.desks[1].id, "seat.json"), "{\"format\":2}");
    const r = await w.proofs();
    const p = D.seatBook({}, r.opened, now);
    const held = (await heldTeam(w.share, { key: w.keyAt })).team;
    return p.desks[w.desks[0].id].state === "none" && p.desks[w.desks[1].id].state === "bad"
      && w.desks.every((d) => held.roster.some((e) => e.desk.id === d.id && e.wrap));
  });

  await leg("ds7 the freeing is signed by the lead over requests.mjs's bytes, by route name through the one door, naming the certificate's person", async () => {
    const lead = crypto.generateKeyPairSync("ed25519");
    const open = { privateKey: lead.privateKey, public: raw(lead.publicKey) };
    const sent = [];
    const ask = async (route, bytes) => { sent.push({ route, body: JSON.parse(Buffer.from(bytes).toString("utf8")) }); return { status: 200, bytes: Buffer.from("{\"ok\":true}") }; };
    const person = certFor("cd".repeat(32), { person: "p" }).person;
    await C.freeSeat(ask, open, "desk", person, 1793610000001);
    const [b] = sent.map((x) => x.body);
    const verify = (bytes, sig) => crypto.verify(null, Buffer.from(bytes), lead.publicKey, Buffer.from(sig, "hex"));
    return sent.length === 1 && sent[0].route === "seat/free" && Object.keys(b).sort().join() === "kind,lead,person,sig,t" && b.person === person
      && verify(Q.seatFreeBytes({ kind: "desk", person, lead: open.public, t: b.t }), b.sig);
  });

  await leg("ds7b the watch wakes on a desk's new seat: the folder's stamp moves when a seat.json is written", async () => {
    const { folderStamp } = await import("../src/team-watch.mjs");
    const w = await teamWith(1, "ds7b");
    const a = folderStamp(w.share, new Map());
    /* Writes straight into w.share/desks/<id>/seat.json (the folder folderStamp watches, standing for the share as a desk's syncer would leave it). */
    w.seat(w.desks[0], { person: "p" });
    return a !== folderStamp(w.share, new Map());
  });

  await leg("ds8 the Desks screen says each member's seat to a signed-in lead, in both languages, and Free seat frees by the shell's channel; a lead not signed in sees neither", async () => {
    const { loadPage } = await import("./page-stand-in.mjs");
    const A = "k-a11ce0a11ce0a111", B = "k-b22df0b22df0b222", C = "k-c33ef0c33ef0c333";
    const member = (id, name) => ({ id, name, own: "", rosterName: null, said: name, invite: "", key: id.slice(2), admitted: true, kind: "desk", door: "auto", version: "", below: false });
    const facts = (signedIn) => ({ error: null, folder: "C:/share", file: "ours", signing: "studio-0123456789abcdef", inside: false, canKeep: true, mark: null,
      restorable: null, requests: [], keyHeld: true, keyOpens: true, invites: [],
      team: { id: "t-0123456789abcdef", epoch: 1, catalogs: 1, sealed: false, lists: true, exportsSealed: false, recovery: true, relay: true, leadPrint: "0123456789abcdef",
        roster: [member(A, "Harbour one"), member(B, "Harbour two"), member(C, "Harbour three")] },
      /* C holds a seat this lead may not free (decision 46): the shell's `free` false, so no Free seat on its row. */
      seats: { signedIn, desks: { [A]: { state: "seated", held: true, free: true }, [B]: { state: "desks", held: false }, [C]: { state: "seated", held: true, free: false } } } });
    let signedIn = true;
    const freed = [];
    const api = { desks: async () => facts(signedIn), seatFree: async (dir, id) => { freed.push([dir, id]); return facts(signedIn); } };
    const project = { dir: "C:/Projects/harbour", name: "Harbour", editions: [{ n: 1 }], counts: { cards: 0, intents: 0, cats: 0, rv: 0 },
      lint: { errors: 0, warnings: 0, notes: 0, suggestions: 0 }, draft: { langs: [{ code: "en" }], cards: [], rules: [] },
      project: { id: "p-0123456789abcdef", title: "Harbour", rev: 0, folder: "C:/share", fileName: "harbour.ec" } };
    const seen = {};
    for (const lang of ["en", "pl"]) {
      const home = loadPage({ api, uiLang: lang }), P = home.page, T = P.T;
      Object.assign(P.S, { open: JSON.parse(JSON.stringify(project)), screen: "projects", home: "team", teamDir: project.dir, lang: "en", host: { tour: { offered: true } } });
      signedIn = true;
      await P.desksLoad();
      const h = home.node("#main").innerHTML;
      seen[lang] = h.includes(T("has a seat")) && h.includes(T("the person's fourth desk, so no seat").replace(/'/g, "&#39;"))
        && (h.match(/data-act="seat-free"/g) || []).length === 1 && h.includes('data-act="seat-free" data-id="' + A + '"')
        && (lang === "en" || T("has a seat") !== "has a seat");
      if (lang === "en") {
        /* The press as the page's click handler makes it: the act named by the button, handed the button. */
        await P.__get("ACTS")["seat-free"]({ getAttribute: (n) => (n === "data-id" ? A : null) });
        signedIn = false;
        await P.desksLoad();
        const off = home.node("#main").innerHTML;
        seen.press = freed.length === 1 && freed[0][0] === project.dir && freed[0][1] === A;
        seen.off = !/data-act="seat-free"/.test(off) && !off.includes("has a seat") && !off.includes("data-seat=");
      }
    }
    return Object.values(seen).every((v) => v === true) || (console.error("ds8 " + JSON.stringify(seen)), false);
  });

  await leg("ds9 a desk asking to join with no invitation, its certificate naming a person a roster desk's names, is let in with nobody acting; another person's, another licence's, or with no reference kept, waits", async () => {
    const w = await teamWith(1, "ds9");
    const [a] = w.desks;
    /* All four writes go straight into w.share/desks/<id>/seat.json (the folder Studio reads, standing for the share as a desk's syncer would leave it). */
    w.seat(a, { person: "kasia" });
    const known = makeDesk(w.share, w.team.id, "Kasia's second"), stranger = makeDesk(w.share, w.team.id, "Stranger"), other = makeDesk(w.share, w.team.id, "Elsewhere");
    w.seat(known, { person: "kasia" });
    w.seat(stranger, { person: "piotr" });
    w.seat(other, { person: "kasia", licence: OTHER_REF });
    const unkept = await Studio.watchAdmit(w.share, w.keyAt, PASS, { auto: false, teamKeys: w.teamKeys, seatRef: "" });
    const r = await Studio.watchAdmit(w.share, w.keyAt, PASS, { auto: false, teamKeys: w.teamKeys, seatRef: REF });
    const held = (await heldTeam(w.share, { key: w.keyAt })).team;
    const on = (d) => held.roster.some((e) => e.desk.id === d.id && e.wrap);
    return unkept.admitted.length === 0 && r.admitted.length === 1 && r.admitted[0] === known.id && on(known) && !on(stranger) && !on(other)
      && held.roster.find((e) => e.desk.id === known.id).door === "auto" || (console.error("ds9 " + JSON.stringify({ unkept: unkept.admitted, r: r.admitted })), false);
  });

  await leg("ds10 a desk whose certificate names a person the lead admitted to this team by code is let in with nobody acting, the person's first desk included, from the record given or the shell's team-people.json; a stranger's, or one admitted to another team, waits", async () => {
    const w = await teamWith(0, "ds10");
    const first = makeDesk(w.share, w.team.id, "Kit's first"), stranger = makeDesk(w.share, w.team.id, "Stranger");
    /* Both writes go straight into w.share/desks/<id>/seat.json (the folder Studio reads, standing for the share as a desk's syncer would leave it). */
    w.seat(first, { person: "kit" });
    w.seat(stranger, { person: "zed" });
    const kit = { [personOf("kit")]: { code: codeOf("kit"), at: NOW } };
    const elsewhere = await Studio.watchAdmit(w.share, w.keyAt, PASS, { auto: false, teamKeys: w.teamKeys, seatRef: REF, people: { "t-elsewhere": kit } });
    const r = await Studio.watchAdmit(w.share, w.keyAt, PASS, { auto: false, teamKeys: w.teamKeys, seatRef: REF, people: { [w.team.id]: kit } });
    const held = (await heldTeam(w.share, { key: w.keyAt })).team;
    const on = (d) => held.roster.some((e) => e.desk.id === d.id && e.wrap);
    /* The same from the file the shell writes, read where the watch is handed Studio's settings folder. */
    const v = await teamWith(0, "ds10-file");
    const again = makeDesk(v.share, v.team.id, "Kit's first");
    /* Writes straight into v.share/desks/<id>/seat.json (the folder Studio reads, standing for the share as a desk's syncer would leave it). */
    v.seat(again, { person: "kit" });
    const ud = path.join(SCRATCH, "ds10-userdata");
    fs.mkdirSync(ud, { recursive: true });
    fs.writeFileSync(path.join(ud, "team-people.json"), JSON.stringify({ [v.team.id]: kit }));
    const fromFile = await Studio.watchAdmit(v.share, v.keyAt, PASS, { auto: false, teamKeys: v.teamKeys, seatRef: REF, userData: ud });
    return elsewhere.admitted.length === 0 && r.admitted.length === 1 && r.admitted[0] === first.id && on(first) && !on(stranger)
      && held.roster.find((e) => e.desk.id === first.id).door === "auto" && fromFile.admitted.length === 1 && fromFile.admitted[0] === again.id
      || (console.error("ds10 " + JSON.stringify({ elsewhere: elsewhere.admitted, r: r.admitted, fromFile: fromFile.admitted })), false);
  });

  await leg("ds11 a seat the lead freed is known by no certificate issued before the freeing: that person's desk asking with no invitation waits, from the book given or the shell's desk-seats.json, and is let in once certificates issued after it stand; the book keeps whose a desk was once its seat is freed or run out", async () => {
    const w = await teamWith(1, "ds11");
    const [a] = w.desks;
    /* All four writes go straight into w.share/desks/<id>/seat.json (the folder Studio reads, standing for the share as a desk's syncer would leave it). */
    w.seat(a, { person: "lena", issued: NOW - 3600000 });
    const second = makeDesk(w.share, w.team.id, "Lena's second");
    w.seat(second, { person: "lena", issued: NOW - 3600000 });
    const book = { [w.team.id]: { desks: { [a.id]: { state: "freed", seat: "", code: "", until: 0, freed: { seat: personOf("lena"), at: NOW - 1000 } } } } };
    const given = await Studio.watchAdmit(w.share, w.keyAt, PASS, { auto: false, teamKeys: w.teamKeys, seatRef: REF, seatBooks: book });
    const ud = path.join(SCRATCH, "ds11-userdata");
    fs.mkdirSync(ud, { recursive: true });
    fs.writeFileSync(path.join(ud, "desk-seats.json"), JSON.stringify(book));
    const fromFile = await Studio.watchAdmit(w.share, w.keyAt, PASS, { auto: false, teamKeys: w.teamKeys, seatRef: REF, userData: ud });
    w.seat(a, { person: "lena", issued: NOW });
    w.seat(second, { person: "lena", issued: NOW });
    const later = await Studio.watchAdmit(w.share, w.keyAt, PASS, { auto: false, teamKeys: w.teamKeys, seatRef: REF, seatBooks: book });
    const got = { ok: true, person: personOf("lena"), code: codeOf("lena"), issued: NOW, until: NOW + DAY };
    const seated = D.seatBook({}, { [a.id]: { key: a.pub, got } }, NOW);
    const freed = D.seatFreed(seated, personOf("lena"), NOW + 1);
    const runOut = D.seatBook(seated, { [a.id]: { key: a.pub, got: { ok: false, why: "expired" } } }, NOW + 2 * DAY);
    const lasts = [seated, freed, runOut].map((b) => b.desks[a.id].last);
    return given.admitted.length === 0 && fromFile.admitted.length === 0 && later.admitted.length === 1 && later.admitted[0] === second.id
      && lasts.every((p) => p === personOf("lena")) && !runOut.desks[a.id].seat
      || (console.error("ds11 " + JSON.stringify({ given: given.admitted, fromFile: fromFile.admitted, later: later.admitted, lasts })), false);
  });

  /* ---- A4, the relay team's standing door: a request at the door carries its certificate inside it ----------------------- */
  await leg("ds12 on a relay team a request at the standing door, its certificate inside it naming a person a roster desk's names or one admitted by code, is let in with nobody acting and handed back for the lead's answer at its id; with no reference kept it waits and nothing is dropped", async () => {
    /* relayTeamWith writes seat.json straight into w.share/desks/<id>/seat.json (the relay's mirror, read by Studio). */
    const w = await relayTeamWith("ds12");
    const known = doorDesk(w, "Kasia's second", { person: "kasia" }), byCode = doorDesk(w, "Kit's first", { person: "kit" });
    const kit = { [personOf("kit")]: { code: codeOf("kit"), at: NOW } };
    const unkept = await Studio.watchAdmit(w.share, w.keyAt, PASS, { auto: false, teamKeys: w.teamKeys, seatRef: "", people: { [w.team.id]: kit } });
    const r = await Studio.watchAdmit(w.share, w.keyAt, PASS, { auto: true, teamKeys: w.teamKeys, seatRef: REF, people: { [w.team.id]: kit } });
    const held = (await heldTeam(w.share, { key: w.keyAt })).team;
    const on = (d) => held.roster.some((e) => e.desk.id === d.id && e.wrap && e.door === "auto");
    const doors = JSON.stringify((r.doors || []).slice().sort((a, b) => (a.desk < b.desk ? -1 : 1)));
    const want = JSON.stringify([known, byCode].map((d) => ({ desk: d.id, door: d.door, box: d.box })).sort((a, b) => (a.desk < b.desk ? -1 : 1)));
    return unkept.admitted.length === 0 && (unkept.dropDoors || []).length === 0 && r.admitted.length === 2 && on(known) && on(byCode)
      && held.channel.kind === "relay" && doors === want && (r.dropDoors || []).length === 0
      || (console.error("ds12 " + JSON.stringify({ unkept: unkept.admitted, r: r.admitted, doors: r.doors, drop: r.dropDoors })), false);
  });

  await leg("ds13 on a relay team a stranger's certified desk at the door is not let in, automatic joining on or off, and its request is handed back to be dropped, as is one whose certificate is another licence's; a request that names no door id is left as it is", async () => {
    /* relayTeamWith writes seat.json straight into w.share/desks/<id>/seat.json (the relay's mirror, read by Studio). */
    const w = await relayTeamWith("ds13");
    const stranger = doorDesk(w, "Stranger", { person: "piotr" }), other = doorDesk(w, "Elsewhere", { person: "kasia", licence: OTHER_REF });
    const quiet = doorDesk(w, "No door id", { person: "zed", noDoor: true });
    const r = await Studio.watchAdmit(w.share, w.keyAt, PASS, { auto: true, teamKeys: w.teamKeys, seatRef: REF });
    const held = (await heldTeam(w.share, { key: w.keyAt })).team;
    const drop = (r.dropDoors || []).map((x) => x.desk + ":" + x.door).sort();
    return r.admitted.length === 0 && held.roster.length === 1
      && JSON.stringify(drop) === JSON.stringify([stranger, other].map((d) => d.id + ":" + d.door).sort()) && !drop.some((x) => x.startsWith(quiet.id))
      || (console.error("ds13 " + JSON.stringify({ r: r.admitted, drop })), false);
  });

  await leg("ds14 a person marked removed is not let in at the door, whatever a roster desk of theirs holds or a code admission said, and the request is handed back to be dropped; admitted again, their next desk is let in", async () => {
    /* relayTeamWith writes seat.json straight into w.share/desks/<id>/seat.json (the relay's mirror, read by Studio). */
    const w = await relayTeamWith("ds14");
    const again = doorDesk(w, "Kasia's new", { person: "kasia" });
    const removed = { [w.team.id]: { [personOf("kasia")]: { code: codeOf("kasia"), at: NOW - 2000, removed: NOW - 1000 } } };
    const ud = path.join(SCRATCH, "ds14-userdata");
    fs.mkdirSync(ud, { recursive: true });
    fs.writeFileSync(path.join(ud, "team-people.json"), JSON.stringify(removed));
    const held = await Studio.watchAdmit(w.share, w.keyAt, PASS, { auto: false, teamKeys: w.teamKeys, seatRef: REF, userData: ud });
    const readmitted = { [w.team.id]: { [personOf("kasia")]: { code: codeOf("kasia"), at: NOW } } };
    const r = await Studio.watchAdmit(w.share, w.keyAt, PASS, { auto: false, teamKeys: w.teamKeys, seatRef: REF, people: readmitted });
    return held.admitted.length === 0 && (held.dropDoors || []).length === 1 && held.dropDoors[0].desk === again.id
      && r.admitted.length === 1 && r.admitted[0] === again.id
      || (console.error("ds14 " + JSON.stringify({ held: held.admitted, drop: held.dropDoors, r: r.admitted })), false);
  });

  await leg("ds15 strangers at the door with the roster at 29 of 30: a request with no invitation is asked of known() before the teammates' limit, so a stranger never takes the last place, is handed back to be dropped rather than waiting as \"limit\", and the known desk is let in, on a relay team and on a folder team", async () => {
    const results = [];
    /* The relay only (was: relay and folder; a team kept for a shared folder admits nobody now, ds20). */
    for (const relay of [true]) {
      /* When relay is true, relayTeamWith writes seat.json straight into w.share/desks/<id>/seat.json (the relay's mirror, read by Studio). */
      const w = relay ? await relayTeamWith("ds15r") : await teamWith(1, "ds15f");
      const strangers = [doorDesk(w, "Stranger one", { person: "piotr" }), doorDesk(w, "Stranger two", { person: "zofia" })];
      const friend = doorDesk(w, "Kasia's second", { person: "kasia" });
      /* The limit as studio.mjs's canAdmit keeps it: 29 teammates, room for one more, each place taken as it is granted. */
      let count = 29, granted = [];
      const canAdmit = (id) => { if (count < 30) { count++; granted.push(id); return true; } return "limit"; };
      const known = (id) => id === friend.id;
      const teamKey = w.teamKeys[w.team.id][1];
      const r = JOIN.admitWaiting(w.share, w.team, teamKey, {}, NOW, null, canAdmit, known);
      const drop = (r.refused || []).map((x) => x.desk).sort();
      results.push({ relay, admitted: r.admitted, granted, limit: r.skipped.filter((s) => s.why === "limit").map((s) => s.id), drop,
        ok: r.admitted.length === 1 && r.admitted[0] === friend.id && JSON.stringify(granted) === JSON.stringify([friend.id])
          && !r.skipped.some((s) => s.why === "limit")
          && (relay ? JSON.stringify(drop) === JSON.stringify(strangers.map((d) => d.id).sort()) : drop.length === 0) });
    }
    return results.every((x) => x.ok) || (console.error("ds15 " + JSON.stringify(results)), false);
  });

  await leg("ds20 a team kept for a shared folder admits nobody: a request proving a live invitation and a known person's desk both wait, nothing is let in, no door is answered or dropped, and the team is handed back as it was (was: the known person's desk was let in on a folder team, ds9)", async () => {
    const w = await teamWith(1, "ds20");
    w.seat(w.desks[0], { person: "kasia" });
    const friend = makeDesk(w.share, w.team.id, "Kasia's second");
    w.seat(friend, { person: "kasia" });
    const sec = newSecret(), invId = Engine.inviteRules().inviteIdOf(sec);
    const inv = { id: invId, team: w.team.id, secret: sec, made: new Date(NOW - DAY).toISOString(), expires: new Date(NOW + 6 * DAY).toISOString(), state: "live" };
    const proving = makeDesk(w.share, w.team.id, "By invitation", inv);
    const folderTeam = withChannel(w.team, { kind: "folder" });
    const r = JOIN.admitWaiting(w.share, folderTeam, w.teamKeys[w.team.id][1], { [invId]: inv }, NOW, null, () => true, (id) => id === friend.id);
    return r.admitted.length === 0 && r.skipped.length === 0 && r.spent.length === 0 && r.doors.length === 0 && r.refused.length === 0 && r.team === folderTeam
      && !!proving.id
      || (console.error("ds20 " + JSON.stringify({ admitted: r.admitted, skipped: r.skipped, spent: r.spent, doors: r.doors, refused: r.refused })), false);
  });

  await leg("ds16 a certificate under a revoked service key names no known person: watchAdmit given the revoked list lets the known person's desk wait, and given none lets it in; and every watchAdmit and seatProofs call the shell makes hands over the revoked list (revokedKeysNow)", async () => {
    const run = async (revoked, tag) => {
      const w = await teamWith(1, tag);
      /* Both writes go straight into w.share/desks/<id>/seat.json (the folder Studio reads, standing for the share as a desk's syncer would leave it). */
      w.seat(w.desks[0], { person: "kasia" });
      const known = makeDesk(w.share, w.team.id, "Kasia's second");
      w.seat(known, { person: "kasia" });
      const r = await Studio.watchAdmit(w.share, w.keyAt, PASS, Object.assign({ teamKeys: w.teamKeys, seatRef: REF }, revoked ? { revoked } : {}));
      return r.admitted.length;
    };
    const cut = await run([SERVICEK.pub], "ds16-revoked"), open = await run([], "ds16-none");
    /* The shell's calls, each from its thread.call to the call's close, carry the revoked list. */
    const shell = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
    const calls = (text) => [...text.matchAll(/thread\.call\("(watchAdmit|seatProofs)",[\s\S]*?\)\);/g)].map((m) => m[0]);
    const carry = (text) => { const c = calls(text); return c.length >= 2 && c.every((x) => /revoked: await revokedKeysNow\(\)/.test(x)); };
    /* Each call's revoked list planted away in memory turns this leg red; with ETIUDA_PLANTS=off the plants are not made (plant-hold pk-off). */
    const plantsHold = process.env.ETIUDA_PLANTS === "off" || calls(shell).every((x) => !carry(shell.split(x).join(x.replace(/revoked: await revokedKeysNow\(\), /, ""))));
    return cut === 0 && open === 1 && carry(shell) && plantsHold
      || (console.error("ds16 " + JSON.stringify({ cut, open, calls: calls(shell).map((x) => x.slice(0, 40) + (/revoked:/.test(x) ? " +revoked" : " -revoked")) })), false);
  });

  await leg("ds17 a seat file whose issued lies past the Date range is shape, read alone and in the pass, and the team's other desks are still judged", async () => {
    const w = await teamWith(2, "ds17");
    const [a, b] = w.desks, far = 8640000000000001;
    /* Both writes go straight into w.share/desks/<id>/seat.json (the folder Studio reads, standing for the share as a desk's syncer would leave it). */
    w.seat(a, { person: "kasia", issued: far, until: far + 1000 });
    w.seat(b, { person: "piotr" });
    let alone = null, r = null;
    try { alone = D.checkSeat(JSON.parse(fs.readFileSync(path.join(w.share, "desks", a.id, "seat.json"), "utf8")), { desk: a.id, deskKey: a.pub, ref: REF, now: NOW }).why; }
    catch { alone = "threw"; }
    try { r = await w.proofs(); } catch { r = null; }
    const got = (d) => r && r.opened[d.id] && r.opened[d.id].got;
    return alone === "shape" && !!got(a) && got(a).why === "shape" && !!got(b) && got(b).ok === true
      || (console.error("ds17 " + JSON.stringify({ alone, pass: r ? { a: got(a), b: got(b) && got(b).ok } : "threw" })), false);
  });

  await leg("ds18 a desk whose request to join carries one seat document and whose seat.json is a later, different one (or expired or signed out) is read by seat.json, not the request: Desks state, what Free seat would send, and the same-person set", async () => {
    const w = await teamWith(0, "ds18");
    const invSecret = newSecret(), invId = Engine.inviteRules().inviteIdOf(invSecret);
    const invites = { [invId]: { id: invId, team: w.team.id, secret: invSecret, made: new Date(now - DAY).toISOString(), expires: new Date(now + 6 * DAY).toISOString(), state: "live" } };
    /* A desk admitted with a request to join (w.share/desks/<a.id>/join.json) carrying an in-date seat for "mira". */
    const a = doorDesk(w, "Harbour one", { person: "mira", issued: now - 2 * DAY, until: now + 28 * DAY, noDoor: true, inv: { id: invId, secret: invSecret } });
    await Studio.watchAdmit(w.share, w.keyAt, PASS, { teamKeys: w.teamKeys, invites });
    /* Before any seat.json arrives, the request's copy stands in. */
    const b0 = D.seatBook({}, (await w.proofs()).opened, now);
    /* Case 1: a later, different in-date seat.json ("piotr") reaches w.share/desks/<a.id>/seat.json (standing for the lead's mirror). */
    w.seat(a, { person: "piotr", issued: now - 60000 });
    const b1 = D.seatBook({}, (await w.proofs()).opened, now);
    const piotrSecond = makeDesk(w.share, w.team.id, "Piotr's second");
    /* Writes straight into w.share/desks/<piotrSecond.id>/seat.json (standing for the lead's mirror). */
    w.seat(piotrSecond, { person: "piotr" });
    /* Asking desk whose join.json carries "piotr" while its w.share/desks/<miraSecond.id>/seat.json (the lead's mirror) carries "mira". */
    const miraSecond = doorDesk(w, "Mira's second", { person: "piotr", issued: now - 2 * DAY, until: now + 28 * DAY, noDoor: true });
    w.seat(miraSecond, { person: "mira", issued: now - 60000 });
    const admit1 = await Studio.watchAdmit(w.share, w.keyAt, PASS, { teamKeys: w.teamKeys, seatRef: REF });

    /* Case 2a: request's seat is still in date ("mira"), while w.share/desks/<a.id>/seat.json (the lead's mirror) holds an expired certificate. */
    w.seat(a, { person: "mira", issued: now - 31 * DAY, until: now - DAY });
    const b2 = D.seatBook(b1, (await w.proofs()).opened, now);
    const admit2 = await Studio.watchAdmit(w.share, w.keyAt, PASS, { teamKeys: w.teamKeys, seatRef: REF });

    /* Case 2b: request's seat is still in date ("mira"), while w.share/desks/<a.id>/seat.json (the lead's mirror) is cleared / signed out ({format:2}). */
    fs.writeFileSync(path.join(w.share, "desks", a.id, "seat.json"), "{\"format\":2}");
    const b3 = D.seatBook(b2, (await w.proofs()).opened, now);
    const admit3 = await Studio.watchAdmit(w.share, w.keyAt, PASS, { teamKeys: w.teamKeys, seatRef: REF });

    const case0 = b0.desks[a.id].state === "seated" && b0.desks[a.id].seat === personOf("mira");
    const case1 = b1.desks[a.id].state === "seated" && b1.desks[a.id].seat === personOf("piotr")
      && b1.desks[a.id].code === codeOf("piotr") && b1.desks[a.id].seat !== personOf("mira")
      && admit1.admitted.length === 1 && admit1.admitted[0] === piotrSecond.id;
    const case2a = b2.desks[a.id].state === "expired" && !b2.desks[a.id].seat && admit2.admitted.length === 0;
    const case2b = b3.desks[a.id].state === "bad" && !b3.desks[a.id].seat && admit3.admitted.length === 0;
    return case0 && case1 && case2a && case2b
      || (console.error("ds18 " + JSON.stringify({ case0, case1, case2a, case2b, s1: b1.desks[a.id].state, a1: admit1.admitted, s2: b2.desks[a.id].state, a2: admit2.admitted, s3: b3.desks[a.id].state, a3: admit3.admitted })), false);
  });

  /* Re-aimed from tests/folder-mirror-studio.mjs fms48 when Studio's shared-folder syncer went (A-S5): the half of it that is the
     seat door. Its other half, a seat.json landing in a mirror through that syncer, went with the syncer; a relay team's mirror
     is read as this folder is, by the same watch. */
  await leg("ds19 a desk's seat.json moves the watch's stamp of the team's folder, so the look it moves reads it, and a renewed one moves it again; and the shell's Desks answer carries the seat book", async () => {
    const w = await teamWith(1, "ds19");
    const [x] = w.desks;
    const W = await import("../src/team-watch.mjs");
    const stamp = () => W.folderStamp(w.share, new Map());
    const s0 = stamp();
    w.seat(x, { person: "mira", issued: now - 60000 });
    const s1 = stamp();
    const b1 = D.seatBook({}, (await w.proofs()).opened, now);
    await new Promise((r) => setTimeout(r, 40));
    w.seat(x, { person: "mira", issued: now - 30000 });
    const s2 = stamp();
    /* The shell's Desks answer: withLapse hands the page the seat book the watch's pass kept (seatsShown); planted away in memory it
       is red, and ETIUDA_PLANTS=off makes no plant (plant-hold pk-off). */
    const shell = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
    const GUARD = "withLicence.seats = await seatsShown(withLicence.team.id); /* plant:s3-desks-seats */";
    const carries = (text) => text.includes(GUARD) && /async function withLapse\(/.test(text);
    const plantHolds = process.env.ETIUDA_PLANTS === "off" || !carries(shell.split(GUARD).join(""));
    const ok = s0 !== s1 && s1 !== s2 && b1.desks[x.id] && b1.desks[x.id].state === "seated" && carries(shell) && plantHolds;
    if (!ok) console.error("ds19 " + JSON.stringify({ moved1: s0 !== s1, moved2: s1 !== s2, state: b1.desks[x.id] && b1.desks[x.id].state, carries: carries(shell), plantHolds }));
    return ok;
  });

  /* ---- board 1017, fold 95's B: a member seated by their own Join is let in at their relay team's door ------------------- */
  await leg("ds20 at a relay team's door a desk whose certificate names a person the lead's list shows added, seated and on this team is let in with nobody acting, kept from the list; one listed seated false, on the lead's other relay team, not added, or not listed is not let in and is handed back to be dropped", async () => {
    /* relayTeamWith writes seat.json straight into w.share/desks/<id>/seat.json (the relay's mirror, read by Studio). */
    const w = await relayTeamWith("ds20");
    const other = "t-" + "0f".repeat(8);
    const jo = doorDesk(w, "Jo's first", { person: "jo" }), freed = doorDesk(w, "Fen's", { person: "fen" }), moved = doorDesk(w, "Oli's", { person: "oli" });
    const bare = doorDesk(w, "Nia's", { person: "nia" }), unlisted = doorDesk(w, "Una's", { person: "una" }), notAdded = doorDesk(w, "Ned's", { person: "ned" });
    const listed = [{ person: personOf("jo"), team: w.team.id, seated: true }, { person: personOf("fen"), team: w.team.id, seated: false },
      { person: personOf("oli"), team: other, seated: true }, { person: personOf("nia"), added: false }, { person: personOf("ned"), added: false, team: w.team.id, seated: true }];
    const people = D.joinedPeople({}, w.team.id, listed, NOW) || {};
    const r = await Studio.watchAdmit(w.share, w.keyAt, PASS, { auto: false, teamKeys: w.teamKeys, seatRef: REF, people });
    const drop = (r.dropDoors || []).map((x) => x.desk).sort();
    const kept = Object.keys(people[w.team.id] || {});
    return r.admitted.length === 1 && r.admitted[0] === jo.id && JSON.stringify(kept) === JSON.stringify([personOf("jo")])
      && people[w.team.id][personOf("jo")].via === "join" && !people[other]
      && JSON.stringify(drop) === JSON.stringify([freed.id, moved.id, bare.id, unlisted.id, notAdded.id].sort())
      || (console.error("ds20 " + JSON.stringify({ r: r.admitted, kept, drop })), false);
  });

  /* MOVED (the test architect's read of c2ccb0e1, findings 1 and 4). Old sentence: "a member kept from the list stays known past its window and goes
     when it shows them seated false; an admission by code is left as it is; a person the lead removed is taken back only by a read after the removal
     with no withdrawal owed". New (moved again for the read of ec990251, which held the service's place time against Studio's removal time, two
     clocks): the list names every Join of the lead's teams, so a kept Join missing from it goes too; a read naming no row on the team is ignored; a
     removed person comes back only by a list asked after the service answered the removal. */
  await leg("ds21 a member kept from the list goes when it shows them seated false or no longer lists them, a read naming nobody on the team being ignored; an admission by code is left as it is; a person the lead removed is taken back only by a list asked after the service answered the removal, never while it is owed, and never on a mark with no answer", async () => {
    /* relayTeamWith writes seat.json straight into w.share/desks/<id>/seat.json (the relay's mirror, read by Studio). */
    const w = await relayTeamWith("ds21");
    const T = w.team.id, JO = personOf("jo"), KIT = personOf("kit"), REM = personOf("rem");
    const kept = D.joinedPeople({}, T, [{ person: JO, team: T, seated: true }], NOW);
    const again = D.joinedPeople(kept, T, [{ person: JO, team: T, seated: true }], NOW + DAY);
    const missing = D.joinedPeople(kept, T, [{ person: personOf("ann"), team: T, seated: true }], NOW + DAY);
    /* MOVED (the test architect's read of ff35a9e5, finding 5): old, a read naming nobody on the team changed nothing; new, it drops nothing and marks
       the kept Join unsure, once, until a read naming the team confirms it. */
    const blank = D.joinedPeople(kept, T, [], NOW + DAY);
    const ignored = [D.joinedPeople(blank, T, [{ person: JO, team: null }], NOW + DAY)];
    const sure = blank ? D.joinedPeople(blank, T, [{ person: JO, team: T, seated: true }], NOW + DAY) : null;
    const byCode = Object.assign({}, kept, { [T]: Object.assign({}, kept[T], { [KIT]: { code: codeOf("kit"), at: NOW } }) });
    const gone = D.joinedPeople(byCode, T, [{ person: JO, team: T, seated: false }, { person: KIT, team: T, seated: false }], NOW + 2 * DAY);
    /* On a team of its own, where no roster desk's certificate names Jo (a roster person is known by that path, ds9 and ds12). */
    const v = await relayTeamWith("ds21-after");
    const third = doorDesk(v, "Jo's third", { person: "jo" });
    const after = await Studio.watchAdmit(v.share, v.keyAt, PASS, { auto: false, teamKeys: v.teamKeys, seatRef: REF, people: gone ? { [v.team.id]: gone[T] } : {} });
    const keptHere = await Studio.watchAdmit(v.share, v.keyAt, PASS, { auto: false, teamKeys: v.teamKeys, seatRef: REF, people: { [v.team.id]: kept[T] } });
    const row = [{ person: REM, team: T, seated: true }];
    const mark = (extra) => ({ [T]: { [REM]: Object.assign({ via: "join", at: NOW - 3000, removed: NOW - 1000 }, extra) } });
    const stillOut = [D.joinedPeople(mark({ withdraw: true, ackAt: NOW - 500 }), T, row, NOW), D.joinedPeople(mark({ unplace: true, ackAt: NOW - 500 }), T, row, NOW),
      D.joinedPeople(mark({}), T, row, NOW + DAY), D.joinedPeople(mark({ ackAt: NOW + 500 }), T, row, NOW)];
    const fresh = D.joinedPeople(mark({ ackAt: NOW - 500 }), T, row, NOW);
    return !!kept && kept[T][JO].via === "join" && kept[T][JO].at === NOW && again === null && !!missing && !missing[T][JO] && ignored.every((x) => x === null)
      && !!blank && blank[T][JO].unsure === true && blank[T][JO].via === "join" && !!sure && !("unsure" in sure[T][JO])
      && !!gone && !gone[T][JO] && !!gone[T][KIT] && gone[T][KIT].code === codeOf("kit")
      && after.admitted.length === 0 && (after.dropDoors || []).some((x) => x.desk === third.id) && keptHere.admitted.length === 1 && keptHere.admitted[0] === third.id
      && stillOut.every((x) => x === null) && !!fresh && fresh[T][REM].via === "join" && fresh[T][REM].at === NOW && !("removed" in fresh[T][REM])
      || (console.error("ds21 " + JSON.stringify({ kept, again, missing, blank, ignored, sure, gone, after: after.admitted, keptHere: keptHere.admitted, stillOut, fresh })), false);
  });

  /* MOVED (the test architect's read of c2ccb0e1: ds22's shell half matched the source). Old sentence: "a refused request at the door is dropped only
     once a list read after it was first refused still refuses it, and every one where no list is to be had; the shell reads the list and keeps its
     Joins before the watch's admission and on the people screen, drops only what that leaves, and counts a kept Join as its own admission for Remove".
     New: the look itself (src/desk-seat.mjs doorLook, the shell's own) is driven with the watch's admission stood in. */
  await leg("ds22 one look at the door, driven: the first pass admits without the kept Joins and reads nothing where it refuses nothing; a refused request makes one read at or after the look, the Joins it names kept, a second pass by that read's own rows, and a drop of what that still refuses; a read naming nobody on the team admits nobody by older kept Joins; no read allowed now drops nothing and asks a later look; no list at all drops the first pass's refusals; the shell hands its watch to that look", async () => {
    const T = "t-" + "ab".repeat(8), JO = personOf("jo"), STALE = personOf("old");
    const run = async (o) => {
      let store = o.store || { [T]: { [STALE]: { via: "join", at: 1 } } };
      const calls = { admit: [], fresh: [], drop: [], relook: 0 };
      const admit = async (people) => {
        calls.admit.push(Object.keys(people[T] || {}));
        const known = new Set(Object.keys(people[T] || {}));
        const asking = o.asking || [];
        return { admitted: asking.filter((x) => known.has(x.person)).map((x) => x.desk), dropDoors: asking.filter((x) => !known.has(x.person)).map((x) => ({ desk: x.desk, door: x.door })) };
      };
      const r = await D.doorLook({ team: T, lookAt: 1000, people: () => store, admit,
        fresh: async (since) => { calls.fresh.push(since); return o.fresh; },
        keep: (people, at) => { const next = D.joinedPeople(store, T, people, at); if (next) store = next; },
        drop: async (refused) => { calls.drop.push(refused.map((x) => x.desk)); }, relook: () => { calls.relook++; } });
      return { r, calls, store };
    };
    const jo = { desk: "k-" + "1a".repeat(8), door: "d1", person: JO }, eve = { desk: "k-" + "2b".repeat(8), door: "d2", person: personOf("eve") };
    const quiet = await run({ asking: [], fresh: { at: 1001, people: [] } });
    const member = await run({ asking: [jo, eve], fresh: { at: 1001, people: [{ person: JO, team: T, seated: true }] } });
    const blank = await run({ asking: [jo], store: { [T]: { [JO]: { via: "join", at: 1 } } }, fresh: { at: 1001, people: [{ person: JO, team: null }] } });
    const wait = await run({ asking: [jo], fresh: null });
    const noList = await run({ asking: [jo, eve], fresh: false });
    const shell = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8").replace(/\r\n/g, "\n");
    const parts = {
      quiet: quiet.r.passes === 1 && quiet.calls.fresh.length === 0 && quiet.calls.drop.length === 0 && JSON.stringify(quiet.calls.admit) === "[[]]",
      member: member.r.passes === 2 && JSON.stringify(member.calls.fresh) === "[1000]" && JSON.stringify(member.calls.admit) === JSON.stringify([[], [JO]])
        && JSON.stringify(member.calls.drop) === JSON.stringify([[eve.desk]]) && !member.store[T][STALE] && member.store[T][JO].via === "join",
      wait: wait.r.read === "wait" && wait.calls.drop.length === 0 && wait.calls.relook === 1 && wait.calls.admit.length === 1,
      blank: blank.r.passes === 2 && JSON.stringify(blank.calls.admit) === "[[],[]]" && JSON.stringify(blank.calls.drop) === JSON.stringify([[jo.desk]])
        && !!blank.store[T][JO],
      noList: noList.r.read === "no-list" && JSON.stringify(noList.calls.drop) === JSON.stringify([[jo.desk, eve.desk]]) && noList.calls.admit.length === 1,
      shell: shell.includes("await (await deskSeatLib()).doorLook({ team: t.team, lookAt: Date.now(), people: readTeamPeople, admit: admitOnce,")
        && shell.includes("fresh: (since) => joinedFresh(t.team, since), keep: (people, at) => joinedKept(t.team, people, at),")
        && /answer\("studio:person-confirm"[\s\S]{0,900}joinList = Object\.assign\(\{\}, joinList, \{ at: 0 \}\);/.test(shell)
        && shell.includes("(typeof m[person].code === \"string\" || m[person].via === \"join\")"),
    };
    return Object.values(parts).every(Boolean) || (console.error("ds22 " + JSON.stringify({ parts, member: member.calls, blank: blank.calls, wait: wait.calls, noList: noList.calls })), false);
  });

  /* ---- planted faults, each in a scratch copy ------------------------------------------------------------------------ */
  if (!ONLY) {
    copyPlants({ root: ROOT, self: SELF, label: "desk-seats", onlyVar: "DESK_SEATS_ONLY", check: (ok, line) => check(ok, line), skip, plants: [
      { mark: "a1-format", leg: "ds2", rel: "src/desk-seat.mjs", line: "  if (!plain(doc) || !plain(doc.certificate)) return { ok: false, why: \"shape\" };" },
      { mark: "a1-via", leg: "ds2", rel: "src/desk-seat.mjs", line: "  if (c.sig.keyId !== c.via.key.id) return { ok: false, why: \"delegation\" };" },
      { mark: "a1-until", leg: "ds2", rel: "src/desk-seat.mjs", line: "  void x.now;" },
      { mark: "a1-day-range", leg: "ds17", rel: "src/desk-seat.mjs", line: "  ;" },
      { mark: "a1-day-finite", leg: "ds17", rel: "src/desk-seat.mjs", line: "const utcDay = (ms) => new Date(ms).toISOString().slice(0, 10);" },
      { mark: "a1-desk-only-bytes", leg: "ds2d", rel: "src/desk-seat.mjs", line: "    .concat([])" },
      { mark: "a1-member-bytes", leg: "ds2e", rel: "src/desk-seat.mjs", line: "    ;" },
      { mark: "a1-member-field", leg: "ds2e", rel: "src/desk-seat.mjs", line: "  const fields = (c.pooled === true ? CERT_FIELDS.concat([\"pooled\"]) : CERT_FIELDS).concat(c.deskOnly === true ? [\"deskOnly\"] : [], c.member === true ? [\"member\"] : []);" },
      { mark: "a1-desk-only-field", leg: "ds2d", rel: "src/desk-seat.mjs", line: "  const fields = c.deskOnly !== undefined ? CERT_FIELDS.concat([\"deskOnly\"]) : CERT_FIELDS;" },
      { mark: "a1-freed", leg: "ds3", rel: "src/desk-seat.mjs", line: "      if (false) e.state = \"freed\";" },
      { mark: "fh-admit-wait", leg: "ds20", rel: "src/join.mjs", line: "  if (false) return { team: out, admitted, skipped, spent, doors, refused };" },
      { mark: "a3-person", leg: "ds9", rel: "src/studio.mjs", line: "      return c.ok === true;" },
      { mark: "nd20-admitted", leg: "ds10", rel: "src/studio.mjs", line: "    void admittedPeople;" },
      { mark: "a3-freed", leg: "ds11", rel: "src/studio.mjs", line: "    const stands = (got) => got && got.ok === true;" },
      { mark: "a4-relay-known", leg: "ds13", rel: "src/join.mjs", line: "    if (false) {" },
      { mark: "a4-removed", leg: "ds14", rel: "src/studio.mjs", line: "    void people.removed;" },
      { mark: "jd-added", leg: "ds20", rel: "src/desk-seat.mjs", line: "    && row.team === teamId && row.seated === true;" },
      { mark: "jd-team", leg: "ds20", rel: "src/desk-seat.mjs", line: "    && row.added !== false && row.seated === true;" },
      { mark: "jd-seated", leg: "ds20", rel: "src/desk-seat.mjs", line: "    && row.added !== false && row.team === teamId;" },
      { mark: "jd-drop", leg: "ds21", rel: "src/desk-seat.mjs", line: "    void e;" },
      { mark: "jd-removed", leg: "ds21", rel: "src/desk-seat.mjs", line: "    void was;" },
      { mark: "jd-no-team", leg: "ds21", rel: "src/desk-seat.mjs", line: "  const names = true;" },
      { mark: "jd-unsure", leg: "ds21", rel: "src/desk-seat.mjs", line: "      void e;" },
      { mark: "jd-second", leg: "ds22", rel: "src/desk-seat.mjs", line: "  const second = (await o.admit(o.people())) || {}; void bare;" },
      { mark: "jd-without", leg: "ds22", rel: "src/desk-seat.mjs", line: "      m[p] = e;" },
      { mark: "jd-wait", leg: "ds22", rel: "src/desk-seat.mjs", line: "  if (!got) { await o.drop(refused); return { passes: 1, read: \"wait\", dropped: refused }; }" },
      { mark: "jd-drop-after", leg: "ds22", rel: "src/desk-seat.mjs", line: "  void still;" },
      { mark: "jd-shell-look", leg: "ds22", rel: "shell/main.js", line: "            await (async (o) => { await o.admit(o.people()); })({ lookAt: Date.now(), people: readTeamPeople, admit: admitOnce," },
      { mark: "jd-shell-confirm", leg: "ds22", rel: "shell/main.js", line: "  void joinList;" },
      { mark: "jd-shell-here", leg: "ds22", rel: "shell/main.js", line: "  return Object.values(people).some((m) => m && typeof m === \"object\" && m[person] && typeof m[person].code === \"string\");" },
      { mark: "s3-seat-stamp", leg: "ds19", rel: "src/team-watch.mjs", line: "    id + \":seat=\"," },
    ] });
    if (process.env.ETIUDA_PLANTS === "off") {
      skip("plant seat-file-first turns ds18 red in a scratch copy (ETIUDA_PLANTS=off)");
    } else {
      const before = treeSha(ROOT);
      const copy = plantsTree(ROOT, "desk-seats-file-first");
      let rosterRed = false, askRed = false, restored = false;
      try {
        const at = path.join(copy, "src", "studio.mjs");
        const rawStudio = fs.readFileSync(at, "utf8");
        const runLeg = () => spawnSync(process.execPath, [path.join(copy, "tests", "desk-seats.mjs")], {
          cwd: copy, encoding: "utf8", timeout: 120000,
          env: Object.assign({}, process.env, { DESK_SEATS_ONLY: "ds18", ETIUDA_PLANTS: "off" }),
        });
        const rosterFrom = "readSeat(folder, id) || seatAsked(folder, id)";
        const rosterTo = "seatAsked(folder, id) || readSeat(folder, id)";
        if (rawStudio.split(rosterFrom).length === 2) {
          fs.writeFileSync(at, rawStudio.replace(rosterFrom, rosterTo));
          const r1 = runLeg();
          const out1 = String(r1.stdout || "") + String(r1.stderr || "");
          rosterRed = r1.status !== 0 && r1.status !== null && out1.includes("FAIL ds18");
          fs.writeFileSync(at, rawStudio);
        }
        const askFrom = "readSeat(h.folder, desk) || seatAsked(h.folder, desk)";
        const askTo = "seatAsked(h.folder, desk) || readSeat(h.folder, desk)";
        if (rawStudio.split(askFrom).length === 2) {
          fs.writeFileSync(at, rawStudio.replace(askFrom, askTo));
          const r2 = runLeg();
          const out2 = String(r2.stdout || "") + String(r2.stderr || "");
          askRed = r2.status !== 0 && r2.status !== null && out2.includes("FAIL ds18");
          fs.writeFileSync(at, rawStudio);
        }
        restored = fs.readFileSync(at, "utf8") === rawStudio;
      } finally {
        dropPlantsTree(copy, ROOT);
      }
      check(rosterRed && askRed && restored && treeSha(ROOT) === before,
        "plant seat-file-first (roster and asking desk preferring request over seat.json) turns ds18 red in a scratch copy, checkout unchanged");
    }
  }

  process.stdout.write("#counts checks=" + asserted + " skipped=0 failed=" + failed + " expected=" + EXPECTED + "\n");
  if (!ONLY && asserted !== EXPECTED) { process.stderr.write("SUITE DID NOT COMPLETE: " + asserted + " of " + EXPECTED + " checks ran\n"); process.exitCode = 1; }
  if (failed) process.exitCode = 1;
  else dropScratch(SCRATCH);
  process.stdout.write("\ndesk-seats  " + asserted + " assertion(s), " + failed + " failure(s)\n");
}

main().catch((e) => { process.stderr.write(String(e && e.stack || e) + "\n"); process.exitCode = 1; });
