/* STUDIO'S QUEUE BY SIGNATURE AND GREW-FROM, AND THE TEAM FILE'S ROSTER (board 834, step 8).
 *
 *     node tests/desk-queue.mjs [--keep]
 *
 * THE CLAIM. A desk writes its own signed file into desks/<id>/ of the folder a catalog is published
 * to. Studio lists it beside the inbox; where it is genuine and grew from the project, it is that
 * desk's proposal against the edition its grew pins, so its removals are offered and the lead's
 * edits since are left out; a refused row comes back only when the desk changes it; the desk is
 * named by itself, and no team file's roster renames it, whoever signed the file. Opened as a project, a desk's
 * file is a new catalog that starts its own lineage, no grew. Section 1 is the design note's oracle.
 *
 * HOW A DESK FILE IS MADE HERE, so the fixture is not the code under test: the published edition is
 * passed through the pinned engine's own load and export (catalogFromV2, catalogToV2, as
 * tests/format-pass.mjs does), edited, and signed as the desk's shell signs, the desk prefix and the
 * engine's signed bytes (sigRules), with node's own crypto. Nothing below calls a desk-file function
 * of Studio's to build one.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import * as Engine from "../src/engine.mjs";
import * as S from "../src/studio.mjs";
import { reviewProposal, readLog } from "../src/review.mjs";
import { DRAFT_FILE, PROJECT_FILE, ARCHIVE, CATALOG_IN_ARCHIVE, editionsIn } from "../src/publish.mjs";
import { makeKeyFile } from "../src/sign.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { loadPage } from "./page-stand-in.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "desk-queue");
const EXPECTED = 23;
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
  catch (e) { check(false, line + " (threw: " + String(e && e.message || e).split(NL)[0].slice(0, 160) + ")"); }
}
const clone = (v) => JSON.parse(JSON.stringify(v));
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex");
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const keysOf = (r) => (r && r.changes ? r.changes.map(c => c.key + (c.conflict ? " (held)" : "")).sort() : []);

async function engineFrom(src, tag) {
  return import("data:text/javascript;base64," + Buffer.from(src).toString("base64") + "#" + tag);
}

/* ---- the desks ------------------------------------------------------------------------------ */

function newDesk(name) {
  const pair = crypto.generateKeyPairSync("ed25519");
  const raw = pair.publicKey.export({ type: "spki", format: "der" }).subarray(-32);
  const id = "k-" + sha256(raw).slice(0, 16);
  const block = { id, key: raw.toString("hex"), box: sha256("box of " + id) };
  if (name) block.name = name;
  return { id, block, pair };
}

async function main(argv) {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const F = await Engine.format();
  const V = Engine.sigRules();
  const pinSrc = fs.readFileSync(path.join(ROOT, "engine", "pinned", "src", "modules", "catalog-v2.js"), "utf8");
  const E = await engineFrom(pinSrc, "pinned");
  const pinOf = (doc) => "sha256:" + sha256(Buffer.from(V.v2SignedBytes(doc)));

  /* The desk's write: the engine's projection of an edition, edited, and signed under the prefix. */
  const deskFile = (desk, from, o) => {
    const opts = o || {};
    const doc = clone(E.catalogToV2(E.catalogFromV2(clone(from))));
    if (opts.edit) opts.edit(doc);
    doc.id = opts.id || (desk.id + "-" + sha256(Buffer.from(String(opts.grewId || from.id))).slice(0, 8));
    doc.rev = opts.rev || 3; doc.date = "2026-10-04"; doc.modified = true;
    if (opts.grew !== null) doc.grew = opts.grew || { id: String(from.id), rev: Number(from.rev), sha: pinOf(from) };
    else delete doc.grew;
    doc.desk = clone(desk.block);
    delete doc.hash; delete doc.sig;
    doc.hash = F.contentHash(doc);
    doc.sig = { alg: "Ed25519", keyId: desk.id };
    doc.sig.value = crypto.sign(null, Buffer.concat([Buffer.from(PREFIX, "utf8"), Buffer.from(V.v2SignedBytes(doc))]),
      desk.pair.privateKey).toString("hex");
    return doc;
  };
  const place = (folder, doc, name) => {
    const at = path.join(folder, name);
    fs.mkdirSync(path.dirname(at), { recursive: true });
    fs.writeFileSync(at, JSON.stringify(doc, null, 1) + "\n");
    return at;
  };

  /* ---- the project: six cards in two languages, published four times, then a fifth ---------- */

  const projects = path.join(SCRATCH, "projects");
  const SHARE = path.join(SCRATCH, "share");
  fs.mkdirSync(projects, { recursive: true });
  const made = await S.newProject(projects, "Desk queue", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }]);
  const dir = made.dir;
  const shelf = ((await S.addTag(dir, "shelf", { en: "General", pl: "Ogolne" })).tag).id;
  const ids = {};
  for (const k of ["x", "y", "z", "w", "u", "v"]) {
    ids[k] = (await S.addCard(dir, shelf, "Card " + k, "The " + k + " answer, in full.")).card.id;
    await S.saveCard(dir, ids[k], { title: { pl: "Karta " + k }, body: { pl: "Odpowiedz " + k + "." } });
  }
  for (let rev = 1; rev <= 4; rev++) {
    await S.saveCard(dir, ids.u, { body: { en: "The u answer, edition " + rev + "." } });
    await S.publishProject(dir, { folder: SHARE, notes: "Edition " + rev + ".", now: "2026-10-0" + rev + "T09:00:00.000Z" });
  }
  const eds = editionsIn(dir);
  const rev4 = readJson(path.join(dir, ARCHIVE, eds[eds.length - 1], CATALOG_IN_ARCHIVE));
  /* Since rev 4 the lead changed z and published rev 5, and then changed w and did not publish. */
  await S.saveCard(dir, ids.z, { body: { en: "The z answer, as the lead rewrote it." } });
  await S.publishProject(dir, { folder: SHARE, notes: "Edition 5.", now: "2026-10-05T09:00:00.000Z" });
  await S.saveCard(dir, ids.w, { body: { en: "The w answer, as the lead rewrote it today." } });
  const projectId = rev4.id;
  const deskDir = (desk) => path.join(SHARE, "desks", desk.id);
  const fileOf = (desk) => path.join(deskDir(desk), "desk-queue-" + sha256(Buffer.from(projectId)).slice(0, 8) + ".ec");

  const ala = newDesk("Ala");
  const yAla = "The y answer, as Ala would say it.";
  const alaDoc = deskFile(ala, rev4, { edit: d => {
    d.cards = d.cards.filter(c => c.id !== ids.x);
    d.cards.find(c => c.id === ids.y).body.en = yAla;
  } });
  const alaAt = place(SHARE, alaDoc, path.relative(SHARE, fileOf(ala)));
  const pending = (r) => (r && r.pending ? r.pending.map(c => c.key).sort() : []);
  const X_GOES = "card-:" + ids.x, Y_CHANGES = "card:" + ids.y + ":body.en";

  /* ---- 1. THE ORACLE ------------------------------------------------------------------------- */

  await leg("dq1a the queue lists a desk's genuine file grown from this catalog, beside the inbox, as this catalog's"
    + " own and under the desk's name", async () => {
    const list = (await S.listProposals(dir)).proposals;
    const row = list.find(p => p.file === alaAt);
    return row && row.ok && !row.foreign && row.desk && row.desk.name === "Ala" && row.desk.id === ala.id;
  });
  let r1 = null;
  await leg("dq1b THE ORACLE: a desk file grown from rev 4 that deletes x and edits y, where the lead changed z and w"
    + " since, offers exactly the removal of x and the change of y, neither held", async () => {
    r1 = await reviewProposal({ project: dir, file: alaAt, rules: [], write: false });
    process.stdout.write("       rows " + JSON.stringify(keysOf(r1)) + "\n");
    return r1.ok && same(keysOf(r1), [X_GOES, Y_CHANGES].sort());
  });
  await leg("dq1d THE CONTROL: the same file pinning an edition no archived one hashes to has no base, so nothing"
    + " is left out and every row is held, the lead's z and w included", async () => {
    const unpinned = deskFile(ala, rev4, { grew: { id: projectId, rev: 4, sha: "sha256:" + "0".repeat(64) }, edit: d => {
      d.cards = d.cards.filter(c => c.id !== ids.x); d.cards.find(c => c.id === ids.y).body.en = yAla;
    } });
    const at = place(SHARE, unpinned, path.relative(SHARE, fileOf(ala)) + ".unpinned.ec");
    const r = await reviewProposal({ project: dir, file: at, rules: [], write: false });
    fs.rmSync(at);
    const held = r.changes.filter(c => c.conflict).map(c => c.key);
    return r.ok && held.length === r.changes.length && held.indexOf("card:" + ids.z + ":body.en") >= 0
      && held.indexOf("card:" + ids.w + ":body.en") >= 0 && held.indexOf(X_GOES) >= 0;
  });
  const copyA = path.join(projects, "accept-all");
  fs.cpSync(dir, copyA, { recursive: true });
  await leg("dq1c Accept all takes both, keeps the lead's z and w, and the record says the desk's name and id",
    async () => {
      const r = await reviewProposal({ project: copyA, file: alaAt, rules: [{ verb: "accept", pattern: "*" }], write: true });
      const draft = readJson(path.join(copyA, DRAFT_FILE)), log = readLog(copyA);
      const card = (k) => draft.cards.find(c => c.id === ids[k]);
      const entry = log.reviews[log.reviews.length - 1];
      return r.ok && r.applied.length === 2 && !card("x") && card("y").body.en === yAla
        && /lead rewrote it\.$/.test(card("z").body.en) && /lead rewrote it today\.$/.test(card("w").body.en)
        && entry.from === "Ala" && entry.desk === ala.id && log.decided.every(d => d.desk === ala.id);
    });

  /* A KEPT SHARED CARD (board 1013): a custom card carrying `from: {desk, card}` in the keeper's own desk file. The row's card
     must reach the page whole, `from` included, so that the page can group every keeper's copy of one shared card. */
  await leg("dq1e a desk file's added card keeps its `from` in the row's card, as the file wrote it, and a card without one"
    + " carries none", async () => {
    const keptShare = path.join(SCRATCH, "kept-share");
    const keeper = newDesk("Bea");
    const FROM = { desk: "k-0123456789abcdef", card: "c-shared-lamp" };
    const doc = deskFile(keeper, rev4, { edit: d => {
      const a = clone(d.cards[0]); a.id = "c-kept-one"; a.from = clone(FROM); d.cards.push(a);
      const b = clone(d.cards[0]); b.id = "c-plain-two"; d.cards.push(b);
    } });
    const at = place(keptShare, doc, path.join("desks", keeper.id, "kept.ec"));
    const o = await S.openProposal(dir, at);
    const add = (id) => (o.changes || []).find(c => c.op === "add" && c.scope === "card" && c.id === id);
    const one = add("c-kept-one"), two = add("c-plain-two");
    return o.ok && !!one && !!two && same(one.to && one.to.from, FROM) && !(two.to && two.to.from);
  });

  /* ---- 2. THE CONTROLS ------------------------------------------------------------------------ */

  /* The same content as an inbox file: today's two paths, this catalog's own export and another catalog's. */
  const inbox = path.join(dir, S.INBOX);
  const own = clone(alaDoc); delete own.desk; delete own.grew; delete own.sig;
  own.id = projectId; own.rev = 4; delete own.hash; own.hash = F.contentHash(own);
  const ownAt = place(inbox, own, "own-export.ec");
  const other = clone(own); other.id = "c-another0catalog"; other.rev = 1; delete other.hash; other.hash = F.contentHash(other);
  const otherAt = place(inbox, other, "plain-export.ec");
  await leg("dq2a THE CONTROL: the same edits as an inbox export of this catalog give today's rows, and as another"
    + " catalog's export no removal, both with no desk", async () => {
    const a = await reviewProposal({ project: dir, file: ownAt, rules: [], write: false });
    const b = await reviewProposal({ project: dir, file: otherAt, rules: [], write: false });
    process.stdout.write("       own " + JSON.stringify(keysOf(a)) + ", another " + JSON.stringify(keysOf(b)) + "\n");
    return a.ok && b.ok && same(keysOf(a), [X_GOES, Y_CHANGES].sort()) && !a.foreign && b.foreign
      && keysOf(b).indexOf(X_GOES) < 0 && keysOf(b).some(k => k.indexOf(Y_CHANGES) === 0) && !a.desk && !b.desk;
  });
  fs.rmSync(ownAt); fs.rmSync(otherAt);

  /* A refused row is remembered for that desk and by its value alone. */
  const copyR = path.join(projects, "refused");
  fs.cpSync(dir, copyR, { recursive: true });
  await leg("dq2b a refused row stays away while the desk's value stands, the lead's own edit of that field"
    + " included, and comes back when the desk changes it", async () => {
    await reviewProposal({ project: copyR, file: alaAt, rules: [{ verb: "reject", pattern: Y_CHANGES }], write: true });
    const after = await reviewProposal({ project: copyR, file: alaAt, rules: [], write: false });
    await S.saveCard(copyR, ids.y, { body: { en: "The y answer, as the lead put it meanwhile." } });
    const leadMoved = await reviewProposal({ project: copyR, file: alaAt, rules: [], write: false });
    const changed = deskFile(ala, rev4, { rev: 4, edit: d => {
      d.cards = d.cards.filter(c => c.id !== ids.x); d.cards.find(c => c.id === ids.y).body.en = "Ala's second wording.";
    } });
    const at2 = place(SHARE, changed, path.relative(SHARE, fileOf(ala)) + ".later.ec");
    const deskMoved = await reviewProposal({ project: copyR, file: at2, rules: [], write: false });
    fs.rmSync(at2);
    process.stdout.write("       pending after the refusal " + JSON.stringify(pending(after)) + ", after the lead's edit "
      + JSON.stringify(pending(leadMoved)) + ", after the desk's " + JSON.stringify(pending(deskMoved)) + "\n");
    return same(pending(after), [X_GOES]) && same(pending(leadMoved), [X_GOES])
      && pending(deskMoved).indexOf(Y_CHANGES) >= 0;
  });
  const ola = newDesk("Ola");
  await leg("dq2c THE CONTROL: another desk proposing the value refused for Ala is asked afresh", async () => {
    const olaAt = place(SHARE, deskFile(ola, rev4, { edit: d => { d.cards.find(c => c.id === ids.y).body.en = yAla; } }),
      path.relative(SHARE, fileOf(ola)));
    const r = await reviewProposal({ project: copyR, file: olaAt, rules: [], write: false });
    fs.rmSync(path.dirname(olaAt), { recursive: true });
    return r.ok && same(pending(r), [Y_CHANGES]);
  });

  await leg("dq2e two desks' refusals of the same row, written to one log, are kept apart: after Ola refuses Y in her"
    + " own wording, Ala's refusal of Y still stands", async () => {
    const copyE = path.join(projects, "two-desks");
    fs.cpSync(dir, copyE, { recursive: true });
    await reviewProposal({ project: copyE, file: alaAt, rules: [{ verb: "reject", pattern: Y_CHANGES }], write: true });
    const olaAt = place(SHARE, deskFile(ola, rev4, { edit: d => { d.cards.find(c => c.id === ids.y).body.en = "Ola's own wording."; } }),
      path.relative(SHARE, fileOf(ola)));
    const olaR = await reviewProposal({ project: copyE, file: olaAt, rules: [{ verb: "reject", pattern: Y_CHANGES }], write: true });
    fs.rmSync(path.dirname(olaAt), { recursive: true });
    const kept = readLog(copyE).decided.filter(d => d.key === Y_CHANGES).map(d => d.desk || "-").sort();
    const again = await reviewProposal({ project: copyE, file: alaAt, rules: [], write: false });
    process.stdout.write("       Y refused for " + JSON.stringify(kept.map(k => k.slice(0, 8))) + ", Ala pending after Ola's refusal "
      + JSON.stringify(pending(again)) + NL);
    return olaR.ok && same(kept, [ala.id, ola.id].sort()) && again.ok && pending(again).indexOf(Y_CHANGES) < 0;
  });

  /* What is not a desk's genuine proposal is no row. */
  const bent = clone(alaDoc); bent.cards.find(c => c.id === ids.y).body.en += " One more.";
  const bentAt = place(SHARE, bent, path.join("desks", ala.id, "bent.ec"));
  const misplacedAt = place(SHARE, alaDoc, path.join("desks", ola.id, "misplaced.ec"));
  const elsewhere = deskFile(ala, rev4, { grewId: "c-some0other0one", grew: { id: "c-some0other0one", rev: 1, sha: pinOf(rev4) } });
  const elsewhereAt = place(SHARE, elsewhere, path.join("desks", ala.id, "elsewhere.ec"));
  await leg("dq2d THE CONTROL: a desk file whose signature fails, one in a folder not its desk's, and one grown from"
    + " another catalog are not listed", async () => {
    const files = (await S.listProposals(dir)).proposals.map(p => p.file);
    return files.indexOf(alaAt) >= 0 && [bentAt, misplacedAt, elsewhereAt].every(f => files.indexOf(f) < 0);
  });
  [bentAt, misplacedAt, elsewhereAt].forEach(f => fs.rmSync(f));
  fs.rmSync(deskDir(ola), { recursive: true, force: true });

  /* ---- 3. THE ROSTER ------------------------------------------------------------------------- */

  const keyAt = path.join(SCRATCH, "lead-key.json");
  const keyFile = await makeKeyFile({ passphrase: PASS });
  fs.writeFileSync(keyAt, JSON.stringify(keyFile, null, 1) + "\n");
  const teamAt = path.join(SHARE, "etiuda-team.json");
  await leg("dq3a the team file Studio writes, with Ala on its roster as Front desk, reads whole by the engine's"
    + " own reader and verifies under its lead's key", async () => {
    const T = await import("../src/team.mjs");
    const team = T.withDesk(T.newTeam({ catalogs: [projectId], lead: { keyId: keyFile.keyId, public: keyFile.public } }),
      ala.block, "Front desk");
    await T.writeTeam(SHARE, team, { key: keyAt, passphrase: PASS });
    const R = Engine.teamRules(), read = R.v2TeamRead(fs.readFileSync(teamAt, "utf8"));
    return read.team && !read.problems.length && await R.v2TeamSigState(read.team) === R.states.valid
      && read.team.roster.length === 1 && read.team.roster[0].name === "Front desk";
  });
  await leg("dq3b a roster that verifies, naming Ala Front desk, renames nobody in the queue: the list's row, the"
    + " opened file's attribution and the record of a decision taken with no name typed all say Ala", async () => {
    const row = (await S.listProposals(dir)).proposals.find(p => p.file === alaAt);
    const open = await S.openProposal(dir, alaAt, {});
    const copyN = path.join(projects, "named");
    fs.cpSync(dir, copyN, { recursive: true });
    await S.decideProposal(copyN, alaAt, { [X_GOES]: "reject" }, "", "");
    const log = readLog(copyN), entry = log.reviews[log.reviews.length - 1];
    return row.desk.name === "Ala" && open.deskName === "Ala" && entry.from === "Ala";
  });
  const teamBytes = fs.existsSync(teamAt) ? fs.readFileSync(teamAt, "utf8") : "";
  await leg("dq3d a team file is written only with the key it names as the lead's: another key is refused and the"
    + " file keeps its bytes", async () => {
    const T = await import("../src/team.mjs");
    const otherKey = path.join(SCRATCH, "other-key.json");
    fs.writeFileSync(otherKey, JSON.stringify(await makeKeyFile({ passphrase: PASS }), null, 1) + "\n");
    const was = (await T.readTeam(SHARE)).team;
    let refused = "";
    try { await T.writeTeam(SHARE, T.withDesk(was, ola.block, "Ola's"), { key: otherKey, passphrase: PASS }); }
    catch (e) { refused = String(e && e.message); }
    return /not the one it names/.test(refused) && fs.readFileSync(teamAt, "utf8") === teamBytes;
  });
  await leg("dq3e a team file signed by another key that verifies under it, naming Ala Mallory, renames nobody: the"
    + " list's row, the opened file's attribution and the record of a decision taken with no name typed all say Ala",
    async () => {
    const T = await import("../src/team.mjs");
    const otherKey = path.join(SCRATCH, "other-key.json"), theirs = readJson(otherKey);
    const forged = T.withDesk(T.newTeam({ catalogs: [projectId], lead: { keyId: theirs.keyId, public: theirs.public } }),
      ala.block, "Mallory");
    await T.writeTeam(SHARE, forged, { key: otherKey, passphrase: PASS });
    const verifies = (await T.readTeam(SHARE)).valid;
    const row = (await S.listProposals(dir)).proposals.find(p => p.file === alaAt);
    const open = await S.openProposal(dir, alaAt, {});
    const copyM = path.join(projects, "forged");
    fs.cpSync(dir, copyM, { recursive: true });
    await S.decideProposal(copyM, alaAt, { [X_GOES]: "reject" }, "", "");
    const log = readLog(copyM), entry = log.reviews[log.reviews.length - 1];
    fs.writeFileSync(teamAt, teamBytes);
    process.stdout.write("       the forged file verifies " + verifies + ", named " + JSON.stringify([row && row.desk
      && row.desk.name, open.deskName, entry.from]) + NL);
    return verifies && row && row.desk && row.desk.name === "Ala" && open.deskName === "Ala" && entry.from === "Ala";
  });

  /* ---- 4. A DESK'S FILE OPENED AS A PROJECT IS A NEW CATALOG (item B of step 7c) ------------------ */

  const maker = newDesk("Ewa"), looseId = "c-made0from0nothing";
  const fromNothing = deskFile(maker, rev4, { grew: null, grewId: looseId, rev: 2 });
  const nothingAt = place(SHARE, fromNothing, path.join("desks", maker.id, "Etiuda catalog-" + sha256(Buffer.from(looseId)).slice(0, 8) + ".ec"));
  const imported = path.join(SCRATCH, "imported");
  fs.mkdirSync(imported, { recursive: true });
  let fromNothingProject = null;
  await leg("dq4a a desk's file made from nothing, opened as a project, is a new catalog: a new id, no grew (it starts"
    + " its own lineage), no desk block, no signature, at no edition, its hash whole", async () => {
    const p = await S.upgradeLand(imported, nothingAt, "");
    fromNothingProject = p.dir;
    const draft = readJson(path.join(p.dir, DRAFT_FILE)), proj = readJson(path.join(p.dir, PROJECT_FILE));
    process.stdout.write("       id " + JSON.stringify(draft.id) + ", grew " + JSON.stringify(draft.grew || null) + "\n");
    return draft.id !== fromNothing.id && F.idOk(draft.id) && proj.id === draft.id && proj.rev === 0
      && !("grew" in draft)
      && !("desk" in draft) && !("sig" in draft) && !("modified" in draft)
      && draft.hash === F.contentHash(draft) && Engine.lint().lintCatalog(draft).errors.length === 0
      && path.basename(p.dir) === path.basename(nothingAt, ".ec");
  });
  await leg("dq4b a desk's file that grew from a catalog, opened as a project, is a new catalog under a new id with no"
    + " grew, neither the desk file itself nor the catalog the desk file grew from", async () => {
    const p = await S.upgradeLand(imported, alaAt, "");
    const draft = readJson(path.join(p.dir, DRAFT_FILE));
    process.stdout.write("       grew " + JSON.stringify(draft.grew || null) + ", the desk file grew from " + JSON.stringify(alaDoc.grew.id) + "\n");
    return draft.id !== alaDoc.id && draft.id !== projectId
      && !("grew" in draft) && !("desk" in draft);
  });
  await leg("dq4c THE CONTROL: a catalog that is no desk's file keeps its id, as before", async () => {
    const plainAt = place(SCRATCH, rev4, "plain.ec");
    const p = await S.upgradeLand(path.join(SCRATCH, "imported-plain"), plainAt, "");
    return readJson(path.join(p.dir, DRAFT_FILE)).id === projectId;
  });
  await leg("dq4d a desk's file made from nothing is not a row of a project's queue: it grew from no catalog", async () => {
    const files = (await S.listProposals(dir)).proposals.map(p => p.file);
    return files.indexOf(nothingAt) < 0 && files.indexOf(alaAt) >= 0;
  });

  /* ---- 5. WORDS: what the engine does not name is no word ------------------------------------- */

  await leg("dq5a a card arriving from a desk carrying the converter's `src` and a key no engine names lists"
    + " neither among its words, and still lists its Polish title and body", async () => {
    const withNew = deskFile(ala, rev4, { rev: 5, edit: d => {
      d.cards.push({ id: "c-arriving-card", shelf: shelf, bodyShape: "plain", title: { en: "Arriving", pl: "Przychodzi" },
                     body: { en: "It arrives.", pl: "Przychodzi tutaj." }, src: "the old file, line 4", later: "a newer build's text" });
    } });
    const at = place(SHARE, withNew, path.relative(SHARE, fileOf(ala)) + ".new.ec");
    const open = await S.openProposal(dir, at, { lang: "en" });
    fs.rmSync(at);
    const row = open.changes.find(c => c.key === "card+:c-arriving-card");
    const fields = ((row && row.also) || []).map(a => a.field + (a.lang ? "." + a.lang : ""));
    process.stdout.write("       words " + JSON.stringify(fields) + "\n");
    return row && fields.indexOf("src") < 0 && fields.indexOf("later") < 0
      && fields.indexOf("title.pl") >= 0 && fields.indexOf("body.pl") >= 0;
  });
  /* The engine names a card's `address` from 0936d59 on, so the pin alone would drop it as unnamed until it moves
     there: the named list here names it whatever the pin, which is the state the review meets after the move. */
  await leg("dq5b a card's form of address is a setting and no word, though the engine names it; CONTROL: its note is"
    + " still a word", async () => {
    const pinned = Engine.namedFields();
    const named = { card: pinned.card.concat("address"), head: pinned.head };
    const change = { scope: "card", op: "add", key: "card+:c-addressed", id: "c-addressed",
      to: { id: "c-addressed", shelf: shelf, title: { en: "Addressed", pl: "Zwrot" }, body: { en: "Hello.", pl: "Witaj." },
            note: { en: "For a returning guest." }, address: { en: "titleSurname", pl: "titleFirst" } } };
    const fields = (S.alsoOf(change, "en", readJson(path.join(dir, DRAFT_FILE)), null, named) || [])
      .map(a => a.field + (a.lang ? "." + a.lang : ""));
    process.stdout.write("       words " + JSON.stringify(fields) + "\n");
    return fields.every(f => f.indexOf("address") !== 0) && fields.indexOf("note.en") >= 0 && fields.indexOf("body.pl") >= 0;
  });

  /* ---- 6. THE PAGE ----------------------------------------------------------------------------- */

  /* MOVED WITH BOARD 1016 ITEM 7: the attribution is the stack's, under Apply, since the table decides nothing. Old: "the page
     starts the attribution from the name the desk goes by, and a name typed is kept", read off the table's field; new: the
     same of the stack's (stkFrom, the name a file's accepted rows are attributed to). */
  await leg("dq6a the stack attributes a desk's file to the name the desk goes by, and a name typed is kept", async () => {
    const { page } = loadPage({ api: {} });
    page.S.stack = { from: {} };
    const stkFrom = page.__get("stkFrom");
    const first = stkFrom("desk.ec", { deskName: "Front desk", importedFrom: null, name: "desk.ec" });
    page.S.stack.from["desk.ec"] = "Typed by hand";
    const typed = stkFrom("desk.ec", { deskName: "Ola", importedFrom: null, name: "desk.ec" });
    return first === "Front desk" && typed === "Typed by hand";
  });
  await leg("dq6b the list says a desk row's name beside From a teammate", async () => {
    const { page, node } = loadPage({ api: {} });
    page.S.rv = page.rvState({ inbox: "inbox", proposals: [
      { name: "desk-queue.ec", file: alaAt, ok: true, foreign: false, rev: 3, proposes: { removed: 1, changes: 1 },
        pending: 2, desk: { id: ala.id, name: "Front desk" } }] });
    page.paintProposalList();
    return /From a teammate<\/span> Front desk/.test(node("#main").innerHTML);
  });

  /* ---- 7. WHAT THE QUEUE NEVER DOES ------------------------------------------------------------ */

  await leg("dq7a deciding a desk's proposal leaves its file where it is, byte for byte", async () => {
    const before = fs.readFileSync(alaAt, "utf8");
    const copyD = path.join(projects, "decided");
    fs.cpSync(dir, copyD, { recursive: true });
    const r = await S.decideProposal(copyD, alaAt, { [X_GOES]: "accept", [Y_CHANGES]: "accept" }, "", "");
    return r.ok && r.decidedTo === null && fs.readFileSync(alaAt, "utf8") === before;
  });

  if (argv.indexOf("--keep") < 0) dropScratch(SCRATCH, "desk-queue");
  process.stdout.write("#counts checks=" + asserted + " failed=" + failed + " expected=" + EXPECTED + "\n");
  if (asserted !== EXPECTED) {
    process.stderr.write("SUITE DID NOT COMPLETE: " + asserted + " of " + EXPECTED + " checks ran\n");
    return 78;
  }
  process.stdout.write("\ndesk-queue  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  return failed ? 1 : 0;
}

main(process.argv.slice(2)).then(c => process.exit(c), e => {
  process.stderr.write(String(e && e.stack || e) + "\n"); process.exit(2);
});
