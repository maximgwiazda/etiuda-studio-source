/* A TEAM THAT SEALS: STUDIO READS A DESK'S SEALED FILE AND PUBLISHES SEALED (board 834, step 12, S6's Studio half).
 *
 *     node tests/team-seal.mjs [--keep]
 *
 * THE CLAIM. A desk in a sealed team writes its own file as an envelope (the engine's shell from ea26623). Studio, handed
 * the team key for that envelope's team and epoch, lists and reviews it as that desk's genuine proposal, with exactly the
 * rows of the same file unsealed; without the key it is no row, as before. Where the team file beside the catalogs is
 * this Studio's own, lists the catalog and says `sealed`, a publish writes the share's copy sealed for the team's epoch,
 * the signed catalog inside byte for byte as the archive keeps it; where Studio cannot seal it (no team key, a team file
 * not its own, a working copy inside the share) nothing is written. A folder with no team file, or a team that does not
 * seal, publishes in the clear as before. Once a project has published sealed, no team file can send it out in the clear
 * again; only the lead's own Plain can (section 3). A sealed export handed in to the project's inbox opens with the team key
 * like any export, and one no key here opens is a refusal row; the same envelope anywhere else is not opened (section 4).
 *
 * THE ENVELOPE IS MADE AND OPENED HERE with node's own AES-256-GCM and the associated data written out below, as the
 * engine's shell/main.js states it (sealCatalog, openSealed), so the fixture is not Studio's slice of it. The desk's
 * file is made as tests/desk-queue.mjs makes one: the engine's projection of an edition, edited, signed under the desk
 * prefix with node's own crypto.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import * as Engine from "../src/engine.mjs";
import * as S from "../src/studio.mjs";
import { reviewProposal, readLog } from "../src/review.mjs";
import { publishFull, editionsIn, ARCHIVE, CATALOG_IN_ARCHIVE, DRAFT_FILE } from "../src/publish.mjs";
import { makeKeyFile, readKeyFile, unlockKey, signDocument } from "../src/sign.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "team-seal");
const EXPECTED = 29;
const NL = String.fromCharCode(10);
const PREFIX = "etiuda-desk-branch" + NL;
const PASS = "a passphrase for the lead's key in this gate";

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
/* A leg whose code is not there yet is a red leg and not a crashed file. */
async function leg(line, fn) {
  try { check(!!(await fn()), line); }
  catch (e) { check(false, line + " (threw: " + String(e && e.message || e).split(NL)[0].slice(0, 200) + ")"); }
}
const clone = (v) => JSON.parse(JSON.stringify(v));
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex");
const keysOf = (r) => (r && r.changes ? r.changes.map(c => c.key + (c.conflict ? " (held)" : "")).sort() : []);
const throwsOn = async (fn) => { try { await fn(); return ""; } catch (e) { return String(e && e.message || e); } };
const filesUnder = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d =>
  d.isDirectory() ? filesUnder(path.join(dir, d.name)) : [path.join(dir, d.name)]);
const holding = (dir, needle) => filesUnder(dir).filter(f => fs.readFileSync(f, "utf8").indexOf(needle) >= 0).length;

/* The engine's envelope, written out: AES-256-GCM, a 12-byte nonce, the tag at the end of ct, aad kind, team and epoch. */
const AAD = (team, epoch) => Buffer.from("etiuda-sealed" + NL + team + NL + epoch, "utf8");
function sealAsDesk(key, team, epoch, text) {
  const nonce = crypto.randomBytes(12), c = crypto.createCipheriv("aes-256-gcm", key, nonce);
  c.setAAD(AAD(team, epoch));
  const ct = Buffer.concat([c.update(text, "utf8"), c.final(), c.getAuthTag()]);
  return { format: 2, kind: "etiuda-sealed", team, epoch, nonce: nonce.toString("hex"), ct: ct.toString("hex") };
}
function openAsDesk(key, doc) {
  try {
    const ct = Buffer.from(doc.ct, "hex"), d = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(doc.nonce, "hex"));
    d.setAAD(AAD(doc.team, doc.epoch));
    d.setAuthTag(ct.subarray(ct.length - 16));
    return Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]).toString("utf8");
  } catch { return null; }
}

function newDesk(name) {
  const pair = crypto.generateKeyPairSync("ed25519");
  const raw = pair.publicKey.export({ type: "spki", format: "der" }).subarray(-32);
  const id = "k-" + sha256(raw).slice(0, 16);
  return { id, block: { id, key: raw.toString("hex"), box: sha256("box of " + id), name }, pair };
}

async function engineFrom(src, tag) {
  return import("data:text/javascript;base64," + Buffer.from(src).toString("base64") + "#" + tag);
}

async function main(argv) {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const F = await Engine.format();
  const V = Engine.sigRules();
  const E = await engineFrom(fs.readFileSync(path.join(ROOT, "engine", "pinned", "src", "modules", "catalog-v2.js"), "utf8"), "pinned");
  const pinOf = (doc) => "sha256:" + sha256(Buffer.from(V.v2SignedBytes(doc)));
  const T = await import("../src/team.mjs");

  /* ---- the project, published once in the clear into a folder with no team file ------------- */
  const projects = path.join(SCRATCH, "projects"), SHARE = path.join(SCRATCH, "share");
  fs.mkdirSync(projects, { recursive: true });
  const dir = (await S.newProject(projects, "Team seal", [{ code: "en", name: "English" }])).dir;
  const shelf = ((await S.addTag(dir, "shelf", { en: "General" })).tag).id;
  const ids = {};
  for (const k of ["x", "y", "z"]) ids[k] = (await S.addCard(dir, shelf, "Card " + k, "The " + k + " answer, in full.")).card.id;
  const first = await S.publishProject(dir, { folder: SHARE, notes: "Edition 1.", now: "2026-10-01T09:00:00.000Z" });
  const ec = first.ec, rev1 = readJson(path.join(dir, ARCHIVE, editionsIn(dir)[0], CATALOG_IN_ARCHIVE));
  const projectId = rev1.id;

  /* ---- 1. A desk's sealed file --------------------------------------------------------------- */
  /* The desk's write, as its shell writes it: signed, then `JSON.stringify(sealCatalog(...), null, 1)` of the signed text. */
  const deskFile = (desk, edit) => {
    const doc = clone(E.catalogToV2(E.catalogFromV2(clone(rev1))));
    edit(doc);
    doc.id = desk.id + "-" + sha256(Buffer.from(projectId)).slice(0, 8);
    doc.rev = 2; doc.date = "2026-10-04"; doc.modified = true;
    doc.grew = { id: projectId, rev: 1, sha: pinOf(rev1) };
    doc.desk = clone(desk.block);
    delete doc.hash; delete doc.sig;
    doc.hash = F.contentHash(doc);
    doc.sig = { alg: "Ed25519", keyId: desk.id };
    doc.sig.value = crypto.sign(null, Buffer.concat([Buffer.from(PREFIX, "utf8"), Buffer.from(V.v2SignedBytes(doc))]),
      desk.pair.privateKey).toString("hex");
    return doc;
  };
  const TEAM = "t-" + crypto.randomBytes(8).toString("hex"), TK = crypto.randomBytes(32), TK2 = crypto.randomBytes(32);
  const keys = { [TEAM]: { 2: TK } };
  const ala = newDesk("Ala"), bea = newDesk("Bea");
  const yAla = "The y answer, as Ala would say it.", zBea = "The z answer, as Bea would say it.";
  const alaDoc = deskFile(ala, d => { d.cards.find(c => c.id === ids.y).body.en = yAla; });
  const alaText = JSON.stringify(alaDoc, null, 1) + "\n";
  const name = "team-seal-" + sha256(Buffer.from(projectId)).slice(0, 8) + ".ec";
  const alaAt = path.join(SHARE, "desks", ala.id, name), beaAt = path.join(SHARE, "desks", bea.id, name);
  fs.mkdirSync(path.dirname(alaAt), { recursive: true });
  fs.writeFileSync(alaAt, JSON.stringify(sealAsDesk(TK, TEAM, 2, alaText), null, 1) + "\n");
  fs.mkdirSync(path.dirname(beaAt), { recursive: true });
  fs.writeFileSync(beaAt, JSON.stringify(deskFile(bea, d => { d.cards.find(c => c.id === ids.z).body.en = zBea; }), null, 1) + "\n");
  /* The oracle: the same desk file, unsealed, reviewed in the same place. */
  const twin = await reviewProposal({ project: dir, file: alaAt, proposal: clone(alaDoc), rules: [], write: false });
  const Y_CHANGES = "card:" + ids.y + ":body.en";

  await leg("ts1a a desk's file sealed for its team, handed the team key for its epoch, is listed as that desk's genuine"
    + " proposal against this catalog with the rows of the same file unsealed (red where Studio reads the envelope as no"
    + " desk's file and lists nothing)", async () => {
    const row = (await S.listProposals(dir, { teamKeys: keys })).proposals.find(p => p.file === alaAt);
    process.stdout.write("       row " + JSON.stringify(row ? { ok: row.ok, desk: row.desk, changes: row.changes } : null)
      + ", twin rows " + JSON.stringify(keysOf(twin)) + "\n");
    return twin.ok && JSON.stringify(keysOf(twin)) === JSON.stringify([Y_CHANGES]) && !!row && row.ok && !row.foreign
      && !!row.desk && row.desk.id === ala.id && row.desk.name === "Ala" && row.changes === twin.changes.length;
  });
  await leg("ts1b reviewed by its file alone, as the deciding verbs read it, the sealed file gives the twin's rows and"
    + " names the desk (red where the envelope is no desk's file)", async () => {
    const r = await reviewProposal({ project: dir, file: alaAt, rules: [], write: false, teamKeys: keys });
    return r.ok && JSON.stringify(keysOf(r)) === JSON.stringify(keysOf(twin)) && !!r.desk && r.desk.id === ala.id;
  });
  await leg("ts1c opened and decided by the screen's two verbs, handed the key, the sealed file's row is accepted into"
    + " the working copy under the desk's name (red where the verbs read the envelope as no proposal)", async () => {
    const copyA = path.join(projects, "accept");
    fs.cpSync(dir, copyA, { recursive: true });
    const o = await S.openProposal(copyA, alaAt, { teamKeys: keys });
    const d = await S.decideProposal(copyA, alaAt, { [Y_CHANGES]: "accept" }, "", "", { teamKeys: keys });
    const draft = readJson(path.join(copyA, DRAFT_FILE)), log = readLog(copyA);
    const entry = log.reviews[log.reviews.length - 1];
    return o.ok && !!o.desk && o.desk.id === ala.id && d.ok && d.applied.length === 1
      && draft.cards.find(c => c.id === ids.y).body.en === yAla && entry.from === "Ala" && entry.desk === ala.id;
  });
  await leg("ts1A THE CONTROL: an unsealed desk file lists and reviews as before, with team keys handed or not", async () => {
    const without = (await S.listProposals(dir)).proposals.find(p => p.file === beaAt);
    const withKeys = (await S.listProposals(dir, { teamKeys: keys })).proposals.find(p => p.file === beaAt);
    const r = await reviewProposal({ project: dir, file: beaAt, rules: [], write: false, teamKeys: keys });
    return !!without && without.ok && without.desk.id === bea.id && !!withKeys && withKeys.ok && withKeys.changes === without.changes
      && r.ok && JSON.stringify(keysOf(r)) === JSON.stringify(["card:" + ids.z + ":body.en"]);
  });
  await leg("ts1B THE CONTROL: with no team key, or only another epoch's, the sealed file is no row and reviews as no"
    + " proposal of this desk, as before", async () => {
    const none = (await S.listProposals(dir)).proposals.find(p => p.file === alaAt);
    const other = (await S.listProposals(dir, { teamKeys: { [TEAM]: { 1: TK2 } } })).proposals.find(p => p.file === alaAt);
    const r = await reviewProposal({ project: dir, file: alaAt, rules: [], write: false, teamKeys: { [TEAM]: { 2: TK2 } } });
    return !none && !other && !(r.ok && r.desk);
  });

  /* ---- 4. A sealed export handed in to the inbox (6b-A) ------------------------------------------
     A desk's Export of a sealed catalog is a new catalog (its own id, rev 1), sealed for the team as the engine's shell
     exportText seals it; somebody hands it to the lead and it lands in the inbox. The oracle is the same export in the
     clear, dropped in a second copy of the project's inbox. */
  const EXPORTED = "The x answer, as an export put it.";
  const exported = (() => {
    const doc = clone(E.catalogToV2(E.catalogFromV2(clone(rev1))));
    doc.cards.find(c => c.id === ids.x).body.en = EXPORTED;
    doc.id = crypto.randomUUID(); doc.rev = 1; doc.date = "2026-10-05";
    delete doc.hash; delete doc.sig; delete doc.notes;
    doc.hash = F.contentHash(doc);
    return JSON.stringify(doc, null, 1) + "\n";
  })();
  const inboxOf = (d) => path.join(d, "inbox");
  const clearDir = path.join(projects, "export-clear"), sealDir = path.join(projects, "export-sealed");
  fs.cpSync(dir, clearDir, { recursive: true });
  fs.cpSync(dir, sealDir, { recursive: true });
  fs.mkdirSync(inboxOf(clearDir), { recursive: true });
  fs.mkdirSync(inboxOf(sealDir), { recursive: true });
  const clearAt = path.join(inboxOf(clearDir), "handed-in.ec"), sealAt = path.join(inboxOf(sealDir), "handed-in.ec");
  fs.writeFileSync(clearAt, exported);
  const envelopeText = JSON.stringify(sealAsDesk(TK, TEAM, 2, exported), null, 1) + "\n";
  fs.writeFileSync(sealAt, envelopeText);
  const clearRow = (await S.listProposals(clearDir)).proposals.find(p => p.file === clearAt);
  const clearTwin = await reviewProposal({ project: clearDir, file: clearAt, rules: [], write: false });
  await leg("ts4a a sealed export handed in to the inbox, the team key for its epoch handed in, is listed as the same"
    + " export in the clear is, any export's row and no desk's (red where the envelope is read as no catalog)", async () => {
    const row = (await S.listProposals(sealDir, { teamKeys: keys })).proposals.find(p => p.file === sealAt);
    process.stdout.write("       row " + JSON.stringify(row ? { ok: row.ok, foreign: row.foreign, desk: row.desk,
      changes: row.changes, refusal: row.refusal } : null) + ", twin " + JSON.stringify(clearRow ? { ok: clearRow.ok,
      changes: clearRow.changes } : null) + "\n");
    return !!clearRow && clearRow.ok && clearRow.changes >= 1 && !!row && row.ok && row.desk === null
      && row.foreign === clearRow.foreign && row.changes === clearRow.changes && row.proposes !== null
      && JSON.stringify(row.proposes) === JSON.stringify(clearRow.proposes);
  });
  await leg("ts4b opened and decided by the screen's two verbs, handed the key, its rows are the twin's and one accepted"
    + " lands in the working copy; the file stays an envelope wherever it goes (red where the verbs read no catalog)", async () => {
    const o = await S.openProposal(sealDir, sealAt, { teamKeys: keys });
    const r = await reviewProposal({ project: sealDir, file: sealAt, rules: [], write: false, teamKeys: keys,
      inbox: inboxOf(sealDir) });
    const want = keysOf(clearTwin), pick = (clearTwin.changes || [])[0];
    const d = pick ? await S.decideProposal(sealDir, sealAt, { [pick.key]: "accept" }, "Ola", "", { teamKeys: keys }) : null;
    const draft = readJson(path.join(sealDir, DRAFT_FILE));
    return o.ok && r.ok && JSON.stringify(keysOf(r)) === JSON.stringify(want) && !!d && d.ok && d.applied.length === 1
      && JSON.stringify(draft).indexOf(EXPORTED) >= 0
      && filesUnder(sealDir).filter(f => path.basename(f) === "handed-in.ec")
        .every(f => fs.readFileSync(f, "utf8") === envelopeText)
      && holding(inboxOf(sealDir), EXPORTED) === 0;
  });
  const wrongDir = path.join(projects, "export-wrong");
  fs.cpSync(dir, wrongDir, { recursive: true });
  fs.mkdirSync(inboxOf(wrongDir), { recursive: true });
  const wrongAt = path.join(inboxOf(wrongDir), "handed-in.ec");
  fs.writeFileSync(wrongAt, envelopeText);
  await leg("ts4A THE CONTROL: with no team key, another epoch's or another team's, the sealed export is a refusal row,"
    + " and neither verb lands anything from it", async () => {
    const tries = [null, { [TEAM]: { 1: TK } }, { [TEAM]: { 2: TK2 } }, { ["t-" + "0".repeat(16)]: { 2: TK } }];
    const rows = [];
    for (const k of tries) rows.push((await S.listProposals(wrongDir, k ? { teamKeys: k } : undefined)).proposals
      .find(p => p.file === wrongAt));
    const before = fs.readFileSync(path.join(wrongDir, DRAFT_FILE), "utf8");
    const o = await S.openProposal(wrongDir, wrongAt, { teamKeys: { [TEAM]: { 2: TK2 } } });
    process.stdout.write("       refused " + JSON.stringify(rows.map(r => r ? (r.ok ? "ok" : String(r.refusal).slice(0, 80)) : null)) + "\n");
    return rows.every(r => !!r && !r.ok && !!r.refusal) && !o.ok
      && fs.readFileSync(path.join(wrongDir, DRAFT_FILE), "utf8") === before && holding(wrongDir, EXPORTED) === 0;
  });
  await leg("ts4B THE CONTROL: the same envelope outside the inbox and the desks' folders, in a folder also called inbox, is"
    + " not opened, key or no key (red where the inbox is matched by its folder's name)", async () => {
    const elsewhere = path.join(sealDir, "elsewhere", "inbox", "handed-in.ec");
    fs.mkdirSync(path.dirname(elsewhere), { recursive: true });
    fs.writeFileSync(elsewhere, envelopeText);
    const r = await reviewProposal({ project: sealDir, file: elsewhere, rules: [], write: false, teamKeys: keys,
      inbox: inboxOf(sealDir) });
    const o = await S.openProposal(sealDir, elsewhere, { teamKeys: keys });
    return !r.ok && !o.ok;
  });

  /* ---- 2. Publishing where the team seals ----------------------------------------------------- */
  const keyAt = path.join(SCRATCH, "lead-key.json"), otherAt = path.join(SCRATCH, "other-key.json");
  const lead = await makeKeyFile({ passphrase: PASS }), other = await makeKeyFile({ passphrase: PASS });
  fs.writeFileSync(keyAt, JSON.stringify(lead, null, 1) + "\n");
  fs.writeFileSync(otherAt, JSON.stringify(other, null, 1) + "\n");
  const team = T.newTeam({ catalogs: [projectId], lead: { keyId: lead.keyId, public: lead.public } });
  const LK = crypto.randomBytes(32), leadKeys = { [team.id]: { 1: LK } };
  const pub = (o) => publishFull(Object.assign({ project: dir, folder: SHARE, key: keyAt, passphrase: PASS }, o));
  const archived = () => fs.readFileSync(path.join(dir, ARCHIVE, editionsIn(dir).slice(-1)[0], CATALOG_IN_ARCHIVE), "utf8");

  /* The team as writeTeam hands it back, at the rev it wrote: a later write starts from it, since writeTeam refuses a copy
     below the floor it keeps (board 929). */
  let teamHeld = team;
  await leg("ts2A THE CONTROL: a folder with no team file, and then a team of this Studio's that does not seal, publish the"
    + " share's copy in the clear as before", async () => {
    const plain1 = readJson(ec);
    teamHeld = (await T.writeTeam(SHARE, team, { key: keyAt, passphrase: PASS })).team;
    const r = await pub({ teamKeys: leadKeys, now: "2026-10-02T09:00:00.000Z" });
    const plain2 = readJson(ec);
    return plain1.id === projectId && plain1.rev === 1 && plain2.id === projectId && plain2.rev === 2 && !r.sealed
      && fs.readFileSync(ec, "utf8") === archived();
  });

  /* A folder publish embeds the ring in the team file (board 945 item 6), raising its rev; the held team is read again so the
     next write is not refused as older than the one this Studio has seen. */
  teamHeld = (await T.heldTeam(SHARE, { key: keyAt })).team;
  const sealedTeam = Object.assign(teamHeld, { sealed: true });
  await T.writeTeam(SHARE, sealedTeam, { key: keyAt, passphrase: PASS });
  await S.saveCard(dir, ids.x, { body: { en: "The x answer, only in the sealed edition." } });
  await leg("ts2a where this Studio's own team at the folder lists the catalog and says sealed, the share's copy is an"
    + " envelope for the team's epoch, and the team key opens it to the signed catalog byte for byte as the archive keeps"
    + " it (red where the copy goes out in the clear)", async () => {
    const r = await pub({ teamKeys: leadKeys, now: "2026-10-03T09:00:00.000Z" });
    const env = readJson(ec), inner = openAsDesk(LK, env);
    process.stdout.write("       share's copy " + JSON.stringify({ kind: env.kind, team: env.team === team.id, epoch: env.epoch,
      opens: inner !== null, sealed: r.sealed }) + "\n");
    return env.kind === "etiuda-sealed" && env.team === team.id && env.epoch === 1 && inner !== null && inner === archived()
      && JSON.parse(inner).rev === 3 && JSON.parse(inner).sig && r.sealed && r.sealed.team === team.id
      && holding(SHARE, "only in the sealed edition") === 0;
  });
  await leg("ts2b the next sealed publish finds its own sealed copy under its name and replaces it, edition raised (red"
    + " where a sealed copy reads as another catalog's file and the publish is refused)", async () => {
    await S.saveCard(dir, ids.x, { body: { en: "The x answer, again only in the sealed edition." } });
    await pub({ teamKeys: leadKeys, now: "2026-10-04T09:00:00.000Z" });
    const inner = openAsDesk(LK, readJson(ec));
    return inner !== null && JSON.parse(inner).rev === 4 && holding(SHARE, "again only in the sealed edition") === 0;
  });

  /* Each refusal leaves the share's file and the archive exactly as they were. */
  const unmoved = async (fn, why, where) => {
    const before = fs.readFileSync(ec, "utf8"), eds = editionsIn(dir).length;
    const said = await throwsOn(fn);
    process.stdout.write("       refused: " + JSON.stringify(said.slice(0, 160)) + "\n");
    return why.test(said) && fs.readFileSync(ec, "utf8") === before && editionsIn(dir).length === eds
      && holding(where || SHARE, "never published") === 0;
  };
  await S.saveCard(dir, ids.x, { body: { en: "The x answer, never published." } });
  await leg("ts2c a sealed team and no team key for its epoch, from the publish verb or the screen's, writes nothing"
    + " (red where it is published in the clear)", async () =>
    await unmoved(() => pub({ now: "2026-10-05T09:00:00.000Z" }), /does not hold the team's current key/)
    && await unmoved(() => pub({ teamKeys: { [team.id]: { 2: LK } }, now: "2026-10-05T09:00:00.000Z" }), /does not hold the team's current key/)
    && await unmoved(() => S.publishProject(dir, { folder: SHARE, now: "2026-10-05T09:00:00.000Z" }), /seals this catalog/));
  await leg("ts2d a team file at the folder that seals this catalog and is not this Studio's own, signed by another lead"
    + " key or changed after signing, or one that does not read whole, writes nothing (red where it is published in the"
    + " clear)", async () => {
    const theirs = T.newTeam({ catalogs: [projectId], lead: { keyId: other.keyId, public: other.public } });
    theirs.sealed = true;
    const ours = fs.readFileSync(T.teamPath(SHARE), "utf8");
    await T.writeTeam(SHARE, theirs, { key: otherAt, passphrase: PASS });
    const a = await unmoved(() => pub({ teamKeys: Object.assign({ [theirs.id]: { 1: LK } }, leadKeys), now: "2026-10-05T09:00:00.000Z" }), /not this Studio.s own/);
    const changed = JSON.parse(ours);
    changed.exportsSealed = true;
    fs.writeFileSync(T.teamPath(SHARE), JSON.stringify(changed, null, 1) + "\n");
    const b = await unmoved(() => pub({ teamKeys: leadKeys, now: "2026-10-05T09:00:00.000Z" }), /not this Studio.s own/);
    fs.writeFileSync(T.teamPath(SHARE), ours.slice(0, Math.floor(ours.length / 2)));
    const c = await unmoved(() => pub({ teamKeys: leadKeys, now: "2026-10-05T09:00:00.000Z" }), /does not read whole/);
    fs.writeFileSync(T.teamPath(SHARE), ours);
    return a && b && c;
  });
  await leg("ts2e a sealed publish whose working copy sits inside the folder it publishes to writes nothing (red where it"
    + " is published, the catalog in the clear beside the envelope)", async () => {
    const inside = path.join(SHARE, "projects-here");
    fs.cpSync(dir, inside, { recursive: true });
    const ok = await unmoved(() => publishFull({ project: inside, folder: SHARE, key: keyAt, passphrase: PASS,
      teamKeys: leadKeys, now: "2026-10-05T09:00:00.000Z" }), /inside the folder/, path.join(SHARE, "desks"));
    fs.rmSync(inside, { recursive: true, force: true });
    return ok;
  });
  /* THE ROLLBACK (the test architect's read of this half, leg 3). A desk removed at epoch 2 kept the epoch 1 file, which
     was on the share, and writes it back: it is this Studio's own, signed, and its epoch's key is still held. Where the
     keys handed in include a newer epoch of the team than the file at the folder, nothing may be written. */
  await leg("ts2g the folder holds this Studio's own team file at epoch 1 and the keys for epochs 1 and 2 are both handed"
    + " in: nothing is written, neither sealed for epoch 1 nor in the clear, and the refusal says the file is older than a"
    + " key held (red where the share's copy is sealed for epoch 1)", async () =>
    await unmoved(() => pub({ teamKeys: { [team.id]: { 1: LK, 2: TK2 } }, now: "2026-10-05T09:00:00.000Z" }),
      /is older than a team key this Studio holds/));
  await leg("ts2G THE CONTROL: where the team file is at epoch 2 and the keys for epochs 1 and 2 are handed in, the share's"
    + " copy is sealed for epoch 2 as before, and opens with epoch 2's key and not epoch 1's", async () => {
    const at1 = (await T.heldTeam(SHARE, { key: keyAt })).team;
    const e2 = await T.newEpoch(at1, { key: keyAt });
    await T.writeTeam(SHARE, e2.team, { key: keyAt, passphrase: PASS });
    const r = await pub({ teamKeys: { [team.id]: { 1: LK, 2: e2.teamKey } }, now: "2026-10-05T09:00:00.000Z" });
    const env = readJson(ec);
    return env.epoch === 2 && r.sealed && r.sealed.epoch === 2 && openAsDesk(e2.teamKey, env) === archived()
      && openAsDesk(LK, env) === null;
  });
  /* ---- 3. Once sealed, sealed (the test architect's read of this half) -------------------------------------------------
     After a sealed publish the project remembers its team, and what the folder's team file says can no longer send it out
     in the clear: only the lead's own Plain, handed in as `unsealed`, does. Epoch 3 is made here so every key is in reach. */
  const at2 = (await T.heldTeam(SHARE, { key: keyAt })).team;
  const e3 = await T.newEpoch(at2, { key: keyAt });
  await T.writeTeam(SHARE, e3.team, { key: keyAt, passphrase: PASS });
  const K3 = { [team.id]: { 3: e3.teamKey } };
  fs.rmSync(ec);                         /* sealed for epoch 2, whose key stayed inside ts2G */
  await pub({ teamKeys: K3, now: "2026-10-06T09:00:00.000Z" });
  const teamText = fs.readFileSync(T.teamPath(SHARE), "utf8");
  const putTeam = (doc) => fs.writeFileSync(T.teamPath(SHARE), typeof doc === "string" ? doc : JSON.stringify(doc, null, 1) + "\n");
  /* this Studio's own signature over a changed team, made with the key file directly rather than through src/team.mjs */
  const signedOwn = async (change) => {
    const d = JSON.parse(teamText);
    delete d.sig;
    change(d);
    const open = unlockKey(readKeyFile(keyAt), PASS);
    return signDocument(d, { privateKey: open.privateKey, keyId: open.keyId });
  };
  const markOf = () => readJson(path.join(dir, "project.json")).sealedTeam;
  await leg("ts3a the project has published sealed and the team file is deleted: nothing is written, and the refusal says"
    + " the folder holds no team file (red where the share's copy goes out in the clear)", async () => {
    fs.rmSync(T.teamPath(SHARE));
    return await unmoved(() => pub({ teamKeys: K3, now: "2026-10-07T09:00:00.000Z" }), /published sealed for team .*no team file now/);
  });
  await leg("ts3b the project has published sealed and the team file is replaced by a whole, unsigned one saying not sealed:"
    + " nothing is written, and the refusal says the file is not this Studio's own (red where it goes out in the clear)", async () => {
    const d = JSON.parse(teamText);
    d.sealed = false; delete d.sig;
    putTeam(d);
    return await unmoved(() => pub({ teamKeys: K3, now: "2026-10-07T09:00:00.000Z" }), /published sealed for team .*not this Studio.s own/);
  });
  await leg("ts3c the project has published sealed and the team file is this Studio's own, signed, saying not sealed, as an"
    + " older file written back would: nothing is written without the lead's Plain (red where it goes out in the clear)", async () => {
    putTeam(await signedOwn(d => { d.sealed = false; }));
    return await unmoved(() => pub({ teamKeys: K3, now: "2026-10-07T09:00:00.000Z" }), /does not seal this catalog.*Desks screen/);
  });
  await leg("ts3d the project has published sealed and the team file drops the catalog from its list: nothing is written"
    + " (red where it goes out in the clear)", async () => {
    const d = JSON.parse(teamText);
    d.catalogs = []; delete d.sig;
    putTeam(d);
    return await unmoved(() => pub({ teamKeys: K3, now: "2026-10-07T09:00:00.000Z" }), /published sealed for team .*not this Studio.s own/);
  });
  await leg("ts3e the project's memory that it sealed survives the verbs that rewrite its record (opening it, choosing its"
    + " folder, saving a card): with the team file deleted after them, nothing is written (red where any of them forgets)", async () => {
    await S.openProject(dir);
    S.setPublishFolder(dir, SHARE);
    await S.saveCard(dir, ids.z, { body: { en: "The z answer, never published either." } });
    fs.rmSync(T.teamPath(SHARE), { force: true });
    return markOf() === team.id
      && await unmoved(() => pub({ teamKeys: K3, now: "2026-10-07T09:00:00.000Z" }), /no team file now/);
  });
  /* ts3f WAS: the window's own publish, handed the lead's key file for its public half alone and the team key, writes the share's
     copy sealed for epoch 3 and unsigned, with no passphrase asked. NOW: earlier editions of this catalog were signed, so an
     unsigned one is refused before anything is written (Grok review mu, B2), the share's copy and the archive untouched. */
  await leg("ts3f the window's own publish, handed the lead's key file for its public half alone and the team key after signed"
    + " editions, is refused before anything is written, saying earlier editions were signed (red where it writes an unsigned sealed copy)", async () => {
    putTeam(teamText);
    return await unmoved(() => S.publishProject(dir, { folder: SHARE, leadKey: keyAt, teamKeys: K3, now: "2026-10-08T09:00:00.000Z" }),
      /earlier editions of this catalog were signed/i);
  });
  await leg("ts3A THE CONTROL: the lead's own Plain, handed in as unsealed with the team file saying so, publishes in the"
    + " clear and the project forgets it sealed, so a later publish with the team file deleted goes out in the clear too", async () => {
    putTeam(await signedOwn(d => { d.sealed = false; }));
    const a = await pub({ teamKeys: K3, unsealed: [team.id], now: "2026-10-09T09:00:00.000Z" });
    const clear1 = fs.readFileSync(ec, "utf8") === archived() && !a.sealed && markOf() === undefined;
    fs.rmSync(T.teamPath(SHARE), { force: true });
    const b = await pub({ teamKeys: K3, now: "2026-10-10T09:00:00.000Z" });
    return clear1 && !b.sealed && fs.readFileSync(ec, "utf8") === archived() && readJson(ec).id === projectId;
  });
  await leg("ts2f the team key is in no file of the share or the project, in five spellings", async () => {
    const spell = [LK.toString("hex"), LK.toString("hex").toUpperCase(), LK.toString("base64"), LK.toString("base64url"),
      "[" + Array.from(LK).join(",") + "]"];
    const found = filesUnder(SCRATCH).filter(f => { const t = fs.readFileSync(f, "utf8").replace(/\s+/g, "");
      return spell.some(s => t.indexOf(s) >= 0); });
    return found.length === 0 && filesUnder(SCRATCH).length > 10;
  });

  /* ---- fh4 to fh6: STUDIO WRITES NO TEAM AT A SHARED FOLDER (the folder team's removal, Max, 2026-11-22 15:37: "remove it, burn it with fire") ----
     setTeamSealed, the verb behind the Sealed and Plain switches and the shell's studio:team-sealed, used to make a new team at a plain folder
     and to rewrite a folder team's file. It writes a team on the relay alone now; a folder asked for either is refused in one sentence and
     nothing is written. No move path is added: a team is started on the relay by its own verb (studio:team-relay). */
  const FH_REFUSED = /makes a team on the Etiuda relay, not in a shared folder/;
  const fhKeyAt = path.join(SCRATCH, "fh-lead-key.json");
  fs.writeFileSync(fhKeyAt, JSON.stringify(await makeKeyFile({ passphrase: PASS }), null, 1) + "\n");
  const fhLead = readKeyFile(fhKeyAt);
  const fhProject = async (name, share) => {
    const d = (await S.newProject(projects, name, [{ code: "en", name: "English" }])).dir;
    fs.mkdirSync(share, { recursive: true });
    S.setPublishFolder(d, share);
    return { dir: d, catalog: readJson(path.join(d, "draft.json")).id };
  };
  const fhTeamFor = (catalog, relay) => {
    let t = T.newTeam({ catalogs: [catalog], lead: { keyId: fhLead.keyId, public: fhLead.public }, sealed: true, exportsSealed: true });
    if (relay) t = T.withChannel(t, { kind: "relay", rt: "8c".repeat(16), url: "https://etiuda.dev" }, { format: 1, kind: "etiuda-ring", keys: [] });
    return t;
  };
  await leg("fh4 Sealed at a folder with no team writes no team: the verb refuses in one sentence, no team file lands and the project keeps no seal mark (was: it made a new team there)", async () => {
    const share = path.join(SCRATCH, "fh4-share"), p = await fhProject("Fh four", share);
    const said = await throwsOn(() => S.setTeamSealed(p.dir, true, { key: fhKeyAt, passphrase: PASS, teamId: "t-" + crypto.randomBytes(8).toString("hex") }));
    const ok = FH_REFUSED.test(said) && !fs.existsSync(T.teamPath(share)) && !readJson(path.join(p.dir, "project.json")).sealedTeam;
    if (!ok) process.stderr.write("fh4 " + JSON.stringify({ said, file: fs.existsSync(T.teamPath(share)) }) + NL);
    return ok;
  });
  await leg("fh5 Plain on a team kept for a folder is refused and the team file's bytes stay as they were (was: the file was rewritten at that folder)", async () => {
    const share = path.join(SCRATCH, "fh5-share"), p = await fhProject("Fh five", share);
    await T.writeTeam(share, fhTeamFor(p.catalog, false), { key: fhKeyAt, passphrase: PASS });
    const before = fs.readFileSync(T.teamPath(share), "utf8");
    const said = await throwsOn(() => S.setTeamSealed(p.dir, false, { key: fhKeyAt, passphrase: PASS }));
    const ok = FH_REFUSED.test(said) && fs.readFileSync(T.teamPath(share), "utf8") === before;
    if (!ok) process.stderr.write("fh5 " + JSON.stringify({ said, same: fs.readFileSync(T.teamPath(share), "utf8") === before }) + NL);
    return ok;
  });
  await leg("fh6 THE CONTROL: Plain on a team on the relay is written as before, the file still naming the relay", async () => {
    const share = path.join(SCRATCH, "fh6-share"), p = await fhProject("Fh six", share);
    await T.writeTeam(share, fhTeamFor(p.catalog, true), { key: fhKeyAt, passphrase: PASS });
    const before = fs.readFileSync(T.teamPath(share), "utf8");
    const r = await S.setTeamSealed(p.dir, false, { key: fhKeyAt, passphrase: PASS });
    const now = readJson(T.teamPath(share));
    const ok = !!r.written && r.written.sealed === false && now.sealed === false && !!now.channel && now.channel.kind === "relay" && fs.readFileSync(T.teamPath(share), "utf8") !== before;
    if (!ok) process.stderr.write("fh6 " + JSON.stringify({ written: r.written && r.written.sealed, channel: now.channel }) + NL);
    return ok;
  });

  /* THE DECIDING LINE OF fh4 AND fh5, proved in a scratch copy: lifted, both legs are red and the checkout is unchanged. */
  if (process.env.ETIUDA_PLANTS === "off") {
    asserted++; process.stdout.write("  SKIP fhP the deciding line of fh4 and fh5 turns them red in a scratch copy (ETIUDA_PLANTS=off)" + NL);
  } else {
    await leg("fhP the deciding line of fh4 and fh5 turns each red in a scratch copy, and the checkout is unchanged", async () => {
      const { spawnSync } = await import("node:child_process");
      const { plantsTree, treeSha, dropPlantsTree } = await import("./plants-tree.mjs");
      const was = treeSha(ROOT), copy = plantsTree(ROOT, "team-seal-fh"), bad = [];
      try {
        const at = path.join(copy, "src", "studio.mjs"), text = fs.readFileSync(at, "utf8"), lines = text.split(NL);
        const hits = lines.map((l, i) => (l.indexOf("/* plant:fh-seal-relay-only */") >= 0 ? i : -1)).filter((i) => i >= 0);
        if (hits.length !== 1) bad.push("on " + hits.length + " lines");
        else {
          const planted = lines.slice(); planted[hits[0]] = "  void 0;";
          fs.writeFileSync(at, planted.join(NL));
          const child = spawnSync(process.execPath, [path.join(copy, "tests", "team-seal.mjs")], { cwd: copy, encoding: "utf8", timeout: 170000,
            env: Object.assign({}, process.env, { ETIUDA_PLANTS: "off" }) });
          for (const id of ["fh4", "fh5"]) if (String(child.stderr || "").indexOf("FAIL " + id) < 0) bad.push("left " + id + " green");
          if (String(child.stderr || "").indexOf("FAIL fh6") >= 0) bad.push("turned the control red");
        }
      } finally { dropPlantsTree(copy, ROOT); }
      if (bad.length) process.stderr.write("fhP " + bad.join("; ") + NL);
      return !bad.length && treeSha(ROOT) === was;
    });
  }

  if (argv.indexOf("--keep") < 0) dropScratch(SCRATCH, "team-seal");
  process.stdout.write("#counts checks=" + asserted + " failed=" + failed + " expected=" + EXPECTED + "\n");
  if (asserted !== EXPECTED) {
    process.stderr.write("SUITE DID NOT COMPLETE: " + asserted + " of " + EXPECTED + " checks ran\n");
    return 78;
  }
  process.stdout.write("\nteam-seal  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  return failed ? 1 : 0;
}

main(process.argv.slice(2)).then(c => process.exit(c), e => {
  process.stderr.write(String(e && e.stack || e) + "\n"); process.exit(2);
});
