/* SYNC-CONFLICT COPIES, RECOGNISED BY IDENTITY (board 945, item 3).
 *
 *     node tests/sync-conflict.mjs
 *
 * THE CLAIM. A copy a sync client leaves beside a file (OneDrive's name-COMPUTER, Dropbox's
 * "name (conflicted copy ...)", "name (1)", and the same tails on etiuda-team.json) is not a
 * second catalog and not a second team. Desk proposals that are one catalog under two such
 * names are one proposal, the newest genuine rev. The team file read is the genuine sibling
 * signed by the same lead at a higher epoch or rev, and the floor still applies. Publishing
 * does not refuse merely because that copy is sitting beside the name, and nothing in the
 * folder is renamed or deleted.
 *
 * Invented catalogs, keys and teams only. A plant child is this file again, with one guarding
 * line removed by a loader that never writes the checkout.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as Engine from "../src/engine.mjs";
import * as S from "../src/studio.mjs";
import * as T from "../src/team.mjs";
import { suggestFileName, publishFull, editionsIn, ARCHIVE, CATALOG_IN_ARCHIVE } from "../src/publish.mjs";
import { makeKeyFile, readKeyFile, unlockKey, signDocument } from "../src/sign.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SELF = fileURLToPath(import.meta.url);
const PLANT = process.env.ETIUDA_F3_PLANT || "";
const SCRATCH = path.join(ROOT, "scratch", PLANT ? "sync-conflict-" + PLANT.replace(/[^a-z0-9]+/gi, "-") : "sync-conflict");
const EXPECTED = 21;
const NL = String.fromCharCode(10);
const PREFIX = "etiuda-desk-branch" + NL;
const PASS = "a passphrase for the lead's key in this gate";
const PLANTS = {
  "plant:f3-one-proposal": "src/studio.mjs",
  "plant:f3-team-read": "src/team.mjs",
  "plant:f3-no-elsewhere": "src/publish.mjs",
};

/* ETIUDA_PLANTS=off (a merge's area run) skips the plant legs f3q, f3r and f3s and counts them toward EXPECTED; the release
   profile runs with plants on, so they still run there. */
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + NL);
  else { failed++; process.stderr.write("  FAIL " + line + NL); }
}
function skip(line) {
  skipped++;
  process.stdout.write("  SKIP  " + line + NL);
}
async function leg(line, fn) {
  try { check(!!(await fn()), line); }
  catch (e) { check(false, line + " (threw: " + String(e && e.message || e).split(NL)[0].slice(0, 200) + ")"); }
}
async function plantedLeg(line, tag) {
  if (PLANTS_OFF) skip(line + " (ETIUDA_PLANTS=off)");
  else await leg(line, async () => plantLeg(tag));
}
const clone = (v) => JSON.parse(JSON.stringify(v));
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const shaText = (t) => crypto.createHash("sha256").update(Buffer.from(t)).digest("hex");

async function engineFrom(src, tag) {
  return import("data:text/javascript;base64," + Buffer.from(src).toString("base64") + "#" + tag);
}

async function kit() {
  const F = await Engine.format();
  const V = Engine.sigRules();
  const pinSrc = fs.readFileSync(path.join(ROOT, "engine", "pinned", "src", "modules", "catalog-v2.js"), "utf8");
  const E = await engineFrom(pinSrc, "pinned-" + (PLANT || "main"));
  const pinOf = (doc) => "sha256:" + shaText(Buffer.from(V.v2SignedBytes(doc)));
  const deskFile = (desk, from, o) => {
    const opts = o || {};
    const doc = clone(E.catalogToV2(E.catalogFromV2(clone(from))));
    if (opts.edit) opts.edit(doc);
    doc.id = opts.id || (desk.id + "-" + shaText(Buffer.from(String(opts.grewId || from.id))).slice(0, 8));
    doc.rev = opts.rev || 3;
    doc.date = "2026-10-28";
    doc.modified = true;
    if (opts.grew !== null) doc.grew = opts.grew || { id: String(from.id), rev: Number(from.rev), sha: pinOf(from) };
    else delete doc.grew;
    doc.desk = clone(desk.block);
    delete doc.hash;
    delete doc.sig;
    doc.hash = F.contentHash(doc);
    doc.sig = { alg: "Ed25519", keyId: desk.id };
    doc.sig.value = crypto.sign(null, Buffer.concat([Buffer.from(PREFIX, "utf8"), Buffer.from(V.v2SignedBytes(doc))]),
      desk.pair.privateKey).toString("hex");
    return doc;
  };
  return { F, deskFile };
}

function newDesk(name) {
  const pair = crypto.generateKeyPairSync("ed25519");
  const raw = pair.publicKey.export({ type: "spki", format: "der" }).subarray(-32);
  const id = "k-" + shaText(raw).slice(0, 16);
  const block = { id, key: raw.toString("hex"), box: shaText("box of " + id), name };
  return { id, block, pair };
}

function place(folder, doc, name) {
  const at = path.join(folder, name);
  fs.mkdirSync(path.dirname(at), { recursive: true });
  fs.writeFileSync(at, JSON.stringify(doc, null, 1) + NL);
  return at;
}

async function published(root, share, name) {
  fs.mkdirSync(root, { recursive: true });
  fs.mkdirSync(share, { recursive: true });
  const made = await S.newProject(root, name, [{ code: "en", name: "English" }]);
  const dir = made.dir;
  const shelf = (await S.addTag(dir, "shelf", { en: "General" })).tag.id;
  await S.addCard(dir, shelf, "Lamp", "The lamp answer, in full.");
  const pub = await S.publishProject(dir, { folder: share, notes: "Edition 1.", now: "2026-10-28T09:00:00.000Z" });
  const eds = editionsIn(dir);
  const from = readJson(path.join(dir, ARCHIVE, eds[eds.length - 1], CATALOG_IN_ARCHIVE));
  return { dir, share, pub, from, id: from.id };
}

async function leadKey() {
  const keyAt = path.join(SCRATCH, "lead-key.json");
  const made = await makeKeyFile({ passphrase: PASS });
  fs.writeFileSync(keyAt, JSON.stringify(made, null, 1) + NL);
  const read = readKeyFile(keyAt);
  const open = unlockKey(read, PASS);
  const lead = { keyId: read.keyId, public: read.public };
  const sign = async (id, epoch, rev, who, key) => {
    const doc = {
      format: 1, kind: "etiuda-team", id, catalogs: ["lamp-board"],
      lead: who, sealed: false, exportsSealed: false, epoch, roster: [], rev,
      channel: { kind: "folder" },
    };
    return JSON.stringify(await signDocument(doc, { privateKey: key.privateKey, keyId: key.keyId }), null, 1) + NL;
  };
  return { keyAt, open, lead, sign };
}

function writeTeamFile(dir, name, text) {
  fs.mkdirSync(dir, { recursive: true });
  const at = path.join(dir, name);
  fs.writeFileSync(at, text);
  return at;
}

function tagHits(file, tag) {
  const text = fs.readFileSync(file, "utf8");
  const needle = "/* " + tag + " */";
  let n = 0, i = 0;
  while ((i = text.indexOf(needle, i)) >= 0) { n++; i += needle.length; }
  return n;
}

function hookFiles() {
  const dir = path.join(os.tmpdir(), "etiuda-f3-studio-hook");
  fs.mkdirSync(dir, { recursive: true });
  const hook = path.join(dir, "f3-hook.mjs");
  const reg = path.join(dir, "f3-reg.mjs");
  fs.writeFileSync(hook, [
    "import fs from \"node:fs\";",
    "import { fileURLToPath } from \"node:url\";",
    "const TAG = process.env.ETIUDA_F3_PLANT || \"\";",
    "const needle = \"/* \" + TAG + \" */\";",
    "export async function load(url, context, nextLoad) {",
    "  if (!TAG || url.slice(0, 5) !== \"file:\") return nextLoad(url, context);",
    "  let file;",
    "  try { file = fileURLToPath(url); } catch { return nextLoad(url, context); }",
    "  if (!/[\\\\/]src[\\\\/](?:team|studio|publish)\\.mjs$/i.test(file)) return nextLoad(url, context);",
    "  const text = fs.readFileSync(file, \"utf8\");",
    "  if (text.indexOf(needle) < 0) return nextLoad(url, context);",
    "  const nl = text.indexOf(\"\\r\\n\") >= 0 ? \"\\r\\n\" : \"\\n\";",
    "  const source = text.split(nl).filter(line => line.indexOf(needle) < 0).join(nl);",
    "  return { format: \"module\", source, shortCircuit: true };",
    "}",
    "",
  ].join(NL));
  fs.writeFileSync(reg, [
    "import { register } from \"node:module\";",
    "await register(new URL(\"./f3-hook.mjs\", import.meta.url).href, { parentURL: import.meta.url });",
    "",
  ].join(NL));
  return reg;
}

function plantLeg(tag) {
  const rel = PLANTS[tag];
  const file = path.join(ROOT, rel);
  const before = sha(file);
  const hits = tagHits(file, tag);
  if (hits !== 1) return false;
  const reg = hookFiles();
  const env = Object.assign({}, process.env, { ETIUDA_F3_PLANT: tag });
  delete env["ETIUDA_" + "WINDOWS"];
  const child = spawnSync(process.execPath, ["--import", pathToFileURL(reg).href, SELF], {
    cwd: ROOT, encoding: "utf8", timeout: 120000, windowsHide: true, env,
  });
  const after = sha(file);
  const said = String(child.stdout || "") + String(child.stderr || "");
  const red = child.status === 0 && said.indexOf("PLANT-RED " + tag) >= 0;
  if (!red) process.stderr.write("       plant " + tag + " status " + child.status + " " + said.split(NL).slice(-4).join(" | ").slice(0, 240) + NL);
  return red && after === before && hits === 1;
}

async function proposalScene(k) {
  const scene = await published(path.join(SCRATCH, "rows-projects"), path.join(SCRATCH, "rows-share"), "Desk rows");
  const ala = newDesk("Ala");
  const ola = newDesk("Ola");
  const edit = (words) => (d) => { d.cards[0].body.en = words; };
  const lamp = k.deskFile(ala, scene.from, { rev: 2, edit: edit("Desk wording two.") });
  const lampCopy = k.deskFile(ala, scene.from, { rev: 6, edit: edit("Desk wording six.") });
  const bad = k.deskFile(ala, scene.from, { rev: 9, edit: edit("Desk wording nine.") });
  bad.sig.value = bad.sig.value.slice(0, -1) + (bad.sig.value.endsWith("0") ? "1" : "0");
  const other = k.deskFile(ala, scene.from, { id: ala.id + "-other01", rev: 1, edit: edit("Another catalog's wording.") });
  const tie = k.deskFile(ola, scene.from, { rev: 4, edit: edit("Ola, equal.") });
  const tieCopy = k.deskFile(ola, scene.from, { rev: 4, edit: edit("Ola, the copy.") });
  const root = path.join(scene.share, "desks");
  const paths = [
    place(path.join(root, ala.id), lamp, "lamp.ec"),
    place(path.join(root, ala.id), lampCopy, "lamp (1).ec"),
    place(path.join(root, ala.id), bad, "lamp-bad.ec"),
    place(path.join(root, ala.id), other, "other-board.ec"),
    place(path.join(root, ola.id), tie, "tie.ec"),
    place(path.join(root, ola.id), tieCopy, "tie (1).ec"),
  ];
  const before = paths.map(sha);
  return { scene, ala, ola, paths, before };
}

function rowsOf(list, deskId) {
  return list.filter(p => p.desk && p.desk.id === deskId).map(p => ({ name: p.name, rev: p.rev, ok: p.ok }));
}

async function plantProposals() {
  const k = await kit();
  const scene = await proposalScene(k);
  const list = (await S.listProposals(scene.scene.dir)).proposals;
  const ala = rowsOf(list, scene.ala.id).filter(p => p.name !== "other-board.ec" && p.name !== "lamp-bad.ec");
  if (ala.length === 1 && ala[0].rev === 6 && ala[0].name === "lamp (1).ec") return "new";
  if (ala.length >= 2 && ala.some(p => p.rev === 6) && ala.some(p => p.rev === 2)) return "old";
  process.stderr.write("       plant proposals " + JSON.stringify(ala) + NL);
  return "broken";
}

async function plantTeam() {
  const keys = await leadKey();
  const id = "t-" + crypto.randomBytes(8).toString("hex");
  const dir = path.join(SCRATCH, "plant-team");
  writeTeamFile(dir, "etiuda-team.json", await keys.sign(id, 1, 1, keys.lead, keys.open));
  writeTeamFile(dir, "etiuda-team (1).json", await keys.sign(id, 1, 4, keys.lead, keys.open));
  const read = await T.readTeam(dir);
  const rev = read.team ? read.team.rev : null;
  const base = path.basename(read.at || "");
  if (rev === 4 && base === "etiuda-team (1).json") return "new";
  if (rev === 1 && base === "etiuda-team.json") return "old";
  process.stderr.write("       plant team rev " + rev + " at " + base + NL);
  return "broken";
}

async function plantElsewhere() {
  const folder = path.join(SCRATCH, "plant-suggest");
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, "guide (1).ec"), JSON.stringify({ id: "lamp-board" }) + NL);
  const name = await suggestFileName("Guide", folder, "lamp-board");
  if (name === "guide.ec") return "new";
  if (name === "guide (1).ec") return "old";
  process.stderr.write("       plant suggest " + JSON.stringify(name) + NL);
  return "broken";
}

async function planted(tag) {
  if (tag === "plant:f3-one-proposal") return plantProposals();
  if (tag === "plant:f3-team-read") return plantTeam();
  if (tag === "plant:f3-no-elsewhere") return plantElsewhere();
  return "broken";
}

async function runAll() {
  const k = await kit();
  const keys = await leadKey();
  const scene = await proposalScene(k);
  const list1 = (await S.listProposals(scene.scene.dir)).proposals;
  const list2 = (await S.listProposals(scene.scene.dir)).proposals;
  const ala = (list) => rowsOf(list, scene.ala.id).filter(p => p.name !== "other-board.ec" && p.name !== "lamp-bad.ec");
  const sameBytes = scene.paths.every((p, i) => sha(p) === scene.before[i]);

  await leg("f3a two genuine desk files under a conflict name are one proposal, the newest rev, the other catalog stays, and a second listing agrees", async () => {
    const a = ala(list1), b = ala(list2);
    const other = list1.filter(p => p.name === "other-board.ec");
    const ok = a.length === 1 && a[0].rev === 6 && a[0].name === "lamp (1).ec" && a[0].ok
      && b.length === 1 && b[0].rev === 6 && b[0].name === "lamp (1).ec"
      && other.length === 1 && sameBytes;
    if (!ok) process.stderr.write("       f3a " + JSON.stringify({ a, b, other: other.map(p => p.name), sameBytes }) + NL);
    return ok;
  });

  await leg("f3b an equal rev keeps the name that is not the conflict copy", async () => {
    const ola = rowsOf(list1, scene.ola.id);
    const ok = ola.length === 1 && ola[0].name === "tie.ec" && ola[0].rev === 4 && ola[0].ok;
    if (!ok) process.stderr.write("       f3b " + JSON.stringify(ola) + NL);
    return ok;
  });

  await leg("f3c a higher file whose signature does not verify is not a proposal", async () => {
    const bad = list1.filter(p => p.name === "lamp-bad.ec");
    return bad.length === 0;
  });

  const teamDir = (name) => path.join(SCRATCH, name);
  const idOf = () => "t-" + crypto.randomBytes(8).toString("hex");

  await leg("f3d a genuine team sibling at a higher rev is the team file, and every copy stays byte for byte", async () => {
    const id = idOf();
    const dir = teamDir("team-high");
    const canon = writeTeamFile(dir, "etiuda-team.json", await keys.sign(id, 1, 1, keys.lead, keys.open));
    const mid = writeTeamFile(dir, "etiuda-team.sync-conflict-20261028-090000-ABCD.json", await keys.sign(id, 1, 2, keys.lead, keys.open));
    const sib = writeTeamFile(dir, "etiuda-team (1).json", await keys.sign(id, 1, 4, keys.lead, keys.open));
    const before = [canon, mid, sib].map(sha);
    const read = await T.readTeam(dir);
    const ok = !!read.team && read.valid && read.team.rev === 4 && read.team.id === id
      && path.basename(read.at) === "etiuda-team (1).json"
      && [canon, mid, sib].every((p, i) => sha(p) === before[i]);
    if (!ok) process.stderr.write("       f3d rev " + (read.team && read.team.rev) + " at " + path.basename(read.at || "") + NL);
    return ok;
  });

  await leg("f3e a lower genuine sibling is ignored and the canonical file stays the one read", async () => {
    const id = idOf();
    const dir = teamDir("team-low");
    const canon = writeTeamFile(dir, "etiuda-team.json", await keys.sign(id, 1, 4, keys.lead, keys.open));
    const sib = writeTeamFile(dir, "etiuda-team (1).json", await keys.sign(id, 1, 1, keys.lead, keys.open));
    const before = [sha(canon), sha(sib)];
    const read = await T.readTeam(dir);
    return !!read.team && read.team.rev === 4 && path.basename(read.at) === "etiuda-team.json"
      && sha(canon) === before[0] && sha(sib) === before[1];
  });

  await leg("f3f a higher sibling whose signature does not verify is ignored", async () => {
    const id = idOf();
    const dir = teamDir("team-badsig");
    writeTeamFile(dir, "etiuda-team.json", await keys.sign(id, 1, 2, keys.lead, keys.open));
    const bad = await keys.sign(id, 1, 9, keys.lead, keys.open);
    const flipped = bad.replace(/"value": "([0-9a-f])/, (m, ch) => "\"value\": \"" + (ch === "0" ? "1" : "0"));
    writeTeamFile(dir, "etiuda-team (conflicted copy 2026-10-28).json", flipped);
    const read = await T.readTeam(dir);
    return !!read.team && read.team.rev === 2 && path.basename(read.at) === "etiuda-team.json";
  });

  await leg("f3g a missing canonical file is read from a genuine higher sibling, and the canonical name is not created", async () => {
    const id = idOf();
    const dir = teamDir("team-missing");
    const sib = writeTeamFile(dir, "etiuda-team (1).json", await keys.sign(id, 1, 4, keys.lead, keys.open));
    const before = sha(sib);
    const read = await T.readTeam(dir);
    const ok = !!read.team && read.valid && read.team.rev === 4 && path.basename(read.at) === "etiuda-team (1).json"
      && !fs.existsSync(path.join(dir, "etiuda-team.json")) && sha(sib) === before;
    if (!ok) process.stderr.write("       f3g rev " + (read.team && read.team.rev) + " at " + path.basename(read.at || "") + NL);
    return ok;
  });

  await leg("f3h a sibling that is not a team file, with no canonical file, is no team and does not throw", async () => {
    const dir = teamDir("team-garbage");
    writeTeamFile(dir, "etiuda-team (1).json", "not a team file" + NL);
    let threw = false, read = null;
    try { read = await T.readTeam(dir); } catch { threw = true; }
    return !threw && !!read && read.team === null && !fs.existsSync(path.join(dir, "etiuda-team.json"));
  });

  await leg("f3i a higher sibling of another team, or signed by another lead, is ignored", async () => {
    const id = idOf();
    const otherId = idOf();
    const dir = teamDir("team-foreign");
    const made = await makeKeyFile({ passphrase: PASS });
    const otherAt = path.join(SCRATCH, "other-lead.json");
    fs.writeFileSync(otherAt, JSON.stringify(made, null, 1) + NL);
    const otherRead = readKeyFile(otherAt);
    const otherOpen = unlockKey(otherRead, PASS);
    const otherLead = { keyId: otherRead.keyId, public: otherRead.public };
    writeTeamFile(dir, "etiuda-team.json", await keys.sign(id, 1, 3, keys.lead, keys.open));
    writeTeamFile(dir, "etiuda-team (1).json", await keys.sign(otherId, 1, 8, keys.lead, keys.open));
    writeTeamFile(dir, "etiuda-team-LAPTOP.json", await keys.sign(id, 1, 9, otherLead, otherOpen));
    const read = await T.readTeam(dir);
    return !!read.team && read.team.rev === 3 && read.team.id === id && path.basename(read.at) === "etiuda-team.json";
  });

  await leg("f3j a higher epoch wins over a higher rev at the older epoch", async () => {
    const id = idOf();
    const dir = teamDir("team-epoch");
    writeTeamFile(dir, "etiuda-team.json", await keys.sign(id, 1, 9, keys.lead, keys.open));
    writeTeamFile(dir, "etiuda-team (1).json", await keys.sign(id, 2, 1, keys.lead, keys.open));
    const read = await T.readTeam(dir);
    const ok = !!read.team && read.team.epoch === 2 && read.team.rev === 1;
    if (!ok) process.stderr.write("       f3j epoch " + (read.team && read.team.epoch) + " rev " + (read.team && read.team.rev) + NL);
    return ok;
  });

  await leg("f3k the floor still refuses a lower file after a higher sibling was held, and neither file is removed", async () => {
    const id = idOf();
    const dir = teamDir("team-floor");
    const canon = path.join(dir, "etiuda-team.json");
    const sib = path.join(dir, "etiuda-team (1).json");
    writeTeamFile(dir, "etiuda-team.json", await keys.sign(id, 1, 1, keys.lead, keys.open));
    writeTeamFile(dir, "etiuda-team (1).json", await keys.sign(id, 1, 4, keys.lead, keys.open));
    const high = await T.heldTeam(dir, { key: keys.keyAt });
    const floor = T.revFloor(keys.keyAt, id, keys.lead.public);
    writeTeamFile(dir, "etiuda-team.json", await keys.sign(id, 1, 2, keys.lead, keys.open));
    writeTeamFile(dir, "etiuda-team (1).json", await keys.sign(id, 1, 3, keys.lead, keys.open));
    const before = [sha(canon), sha(sib)];
    const low = await T.heldTeam(dir, { key: keys.keyAt });
    const floorAfter = T.revFloor(keys.keyAt, id, keys.lead.public);
    const ok = !!high.team && high.team.rev === 4 && floor && floor.epoch === 1 && floor.rev === 4
      && low.team === null && low.older === true
      && floorAfter && floorAfter.rev === 4 && floorAfter.epoch === 1
      && sha(canon) === before[0] && sha(sib) === before[1];
    if (!ok) process.stderr.write("       f3k high " + (high.team && high.team.rev) + " floor " + JSON.stringify(floor)
      + " low " + (low.team && low.team.rev) + " older " + low.older + " floorAfter " + JSON.stringify(floorAfter) + NL);
    return ok;
  });

  await leg("f3l the next write goes to the canonical name, one above the sibling that was read, and the sibling is untouched", async () => {
    const id = idOf();
    const dir = teamDir("team-write");
    const sib = writeTeamFile(dir, "etiuda-team (1).json", await keys.sign(id, 1, 4, keys.lead, keys.open));
    writeTeamFile(dir, "etiuda-team.json", await keys.sign(id, 1, 1, keys.lead, keys.open));
    const before = sha(sib);
    const held = await T.heldTeam(dir, { key: keys.keyAt });
    if (!held.team) { process.stderr.write("       f3l held nothing: " + held.reason + NL); return false; }
    const wrote = await T.writeTeam(dir, held.team, { key: keys.keyAt, passphrase: PASS });
    const onDisk = readJson(path.join(dir, "etiuda-team.json"));
    const ok = wrote.team.rev === 5 && onDisk.rev === 5 && path.basename(wrote.at) === "etiuda-team.json"
      && sha(sib) === before && fs.existsSync(sib);
    if (!ok) process.stderr.write("       f3l wrote " + (wrote.team && wrote.team.rev) + " disk " + onDisk.rev + NL);
    return ok;
  });

  await leg("f3m a second publish does not refuse because a conflict copy holds the catalog, and that copy is left as it was", async () => {
    const scene2 = await published(path.join(SCRATCH, "pub-projects"), path.join(SCRATCH, "pub-share"), "Guide");
    const fixed = readJson(path.join(scene2.dir, "project.json")).fileName;
    const stem = String(fixed).replace(/\.ec$/i, "");
    const ec = path.join(scene2.share, fixed);
    const sib = path.join(scene2.share, stem + " (1).ec");
    fs.copyFileSync(ec, sib);
    const before = sha(sib);
    fs.unlinkSync(ec);
    const pub = await S.publishProject(scene2.dir, { folder: scene2.share, notes: "Edition 2.", now: "2026-10-28T10:00:00.000Z" });
    const ok = pub && !pub.refused && pub.rev === 2 && fs.existsSync(ec) && readJson(ec).rev === 2 && sha(sib) === before;
    if (!ok) process.stderr.write("       f3m " + JSON.stringify(pub && { rev: pub.rev, refused: pub.refused, file: fixed }) + NL);
    return ok;
  });

  await leg("f3n a suggestion names the catalog's own file, not the conflict copy that already holds it", async () => {
    const folder = path.join(SCRATCH, "suggest");
    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(path.join(folder, "guide (conflicted copy 2026-10-28).ec"), JSON.stringify({ id: "lamp-board" }) + NL);
    const drop = path.join(SCRATCH, "suggest-drop");
    fs.mkdirSync(drop, { recursive: true });
    fs.writeFileSync(path.join(drop, "guide-LAPTOP.ec"), JSON.stringify({ id: "lamp-board" }) + NL);
    const a = await suggestFileName("Guide", folder, "lamp-board");
    const b = await suggestFileName("Guide", drop, "lamp-board");
    const ok = a === "guide.ec" && b === "guide.ec";
    if (!ok) process.stderr.write("       f3n " + JSON.stringify({ a, b }) + NL);
    return ok;
  });

  await leg("f3o a copy that is not a conflict sibling is still suggested, and a different file name is still refused", async () => {
    const root = path.join(SCRATCH, "kept-projects");
    const share = path.join(SCRATCH, "kept-share");
    fs.mkdirSync(root, { recursive: true });
    fs.mkdirSync(share, { recursive: true });
    const made = await S.newProject(root, "Kept copy", [{ code: "en", name: "English" }]);
    const dir = made.dir;
    const shelf = (await S.addTag(dir, "shelf", { en: "General" })).tag.id;
    await S.addCard(dir, shelf, "Lamp", "The lamp answer, in full.");
    const id = readJson(path.join(dir, "draft.json")).id;
    const twin = path.join(share, "desk-copy.ec");
    fs.writeFileSync(twin, JSON.stringify({ id }) + NL);
    const before = sha(twin);
    const suggested = await suggestFileName("Kept copy", share, id);
    let err = null;
    try {
      await publishFull({ project: dir, folder: share, now: "2026-10-28T11:00:00.000Z", fileName: "other-name" });
    } catch (e) { err = e; }
    const said = err ? String(err.message || "") : "";
    const ok = suggested === "desk-copy.ec" && said.indexOf("desk-copy.ec") >= 0 && said.indexOf("another name") >= 0
      && editionsIn(dir).length === 0 && sha(twin) === before;
    if (!ok) process.stderr.write("       f3o suggested " + JSON.stringify(suggested) + " said " + said.slice(0, 160) + NL);
    return ok;
  });

  await leg("f3p the conflict tail is (n), a conflicted copy, OneDrive's hyphen and Syncthing, and a chosen name such as guide-v2 matches the hyphen", async () => {
    const pred = T.conflictSiblingName;
    if (typeof pred !== "function") return false;
    return pred("guide.ec", "guide (1).ec")
      && pred("guide.ec", "guide (1) (2).ec")
      && pred("guide.ec", "guide (conflicted copy 2026-10-28).ec")
      && pred("guide.ec", "guide-LAPTOP.ec")
      && pred("guide.ec", "guide.sync-conflict-20261028-120000-ABCD.ec")
      && pred("guide.ec", "guide-v2.ec")
      && pred("guide.ec", "guide_conf(1).ec")
      && pred("guide.ec", "guide_conf(2).ec")
      && pred("etiuda-team.json", "etiuda-team_conf(1).json")
      && !pred("guide.ec", "guide_config.ec")
      && !pred("guide.ec", "guide_conf.ec")
      && pred("etiuda-team.json", "etiuda-team-backup.json")
      && !pred("guide.ec", "desk-copy.ec")
      && !pred("guide.ec", "guide.ec")
      && !pred("guide.ec", "notes.json");
  });

  await leg("f4a Drive support_conf(1).ec in folder does not cause a twin refusal, and suggestion names catalog file", async () => {
    const folder = path.join(SCRATCH, "suggest-conf");
    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(path.join(folder, "support_conf(1).ec"), JSON.stringify({ id: "lamp-board" }) + NL);
    fs.writeFileSync(path.join(folder, "support (conflicted copy 2026-10-28).ec"), JSON.stringify({ id: "lamp-board" }) + NL);
    const a = await suggestFileName("Support", folder, "lamp-board");
    const ok = a === "support.ec";
    if (!ok) process.stderr.write("       f4a suggested " + JSON.stringify(a) + NL);
    return ok;
  });

  await leg("f4b Drive etiuda-team_conf(1).json at a higher rev is taken as the team file, and every copy stays byte for byte", async () => {
    const id = idOf();
    const dir = teamDir("team-drive-conf");
    const canon = writeTeamFile(dir, "etiuda-team.json", await keys.sign(id, 1, 1, keys.lead, keys.open));
    const sib = writeTeamFile(dir, "etiuda-team_conf(1).json", await keys.sign(id, 1, 4, keys.lead, keys.open));
    const known = writeTeamFile(dir, "etiuda-team (conflicted copy 2026-10-28).json", await keys.sign(id, 1, 2, keys.lead, keys.open));
    const before = [canon, sib, known].map(sha);
    const read = await T.readTeam(dir);
    const ok = !!read.team && read.valid && read.team.rev === 4 && read.team.id === id
      && path.basename(read.at) === "etiuda-team_conf(1).json"
      && [canon, sib, known].every((p, i) => sha(p) === before[i]);
    if (!ok) process.stderr.write("       f4b rev " + (read.team && read.team.rev) + " at " + path.basename(read.at || "") + NL);
    return ok;
  });

  await plantedLeg("f3q removing the proposal collapse lists both desk files, and src/studio.mjs is unchanged", "plant:f3-one-proposal");
  await plantedLeg("f3r removing the team-sibling choice reads the canonical rev, and src/team.mjs is unchanged", "plant:f3-team-read");
  await plantedLeg("f3s removing the conflict filter suggests the conflict copy, and src/publish.mjs is unchanged", "plant:f3-no-elsewhere");

  process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + NL);
  if (asserted + skipped !== EXPECTED) {
    process.stderr.write("SUITE DID NOT COMPLETE: " + (asserted + skipped) + " of " + EXPECTED + " checks ran" + NL);
    process.exitCode = 2;
  } else if (failed) process.exitCode = 1;
}

async function main() {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  try {
    if (PLANT) {
      let kind = "broken";
      try { kind = await planted(PLANT); }
      catch (e) { process.stderr.write("plant child threw: " + String(e && e.message || e) + NL); kind = "broken"; }
      if (kind === "old") process.stdout.write("PLANT-RED " + PLANT + NL);
      else process.stderr.write("plant child " + kind + NL);
      process.exitCode = kind === "old" ? 0 : (kind === "new" ? 1 : 2);
      return;
    }
    await runAll();
  } finally {
    dropScratch(SCRATCH, "sync-conflict");
  }
}

main().catch(e => {
  process.stderr.write(String(e && e.stack || e) + NL);
  process.exitCode = 2;
});
