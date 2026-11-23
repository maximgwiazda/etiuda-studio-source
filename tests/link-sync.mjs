/* A LINKED COPY, AND "BRING UP TO THE ORIGINAL" (board 962, added 2026-11-08 16:36; the form settled 16:37).
 *
 *     node tests/link-sync.mjs [--keep]
 *
 * Driven in node through src/studio.mjs, as the shell's verbs call it: an original is made and published, a linked copy is
 * made from it, the copy is given a place of its own and published there, and then the original and the copy are each
 * edited and the original published again. The legs, each of which went red before src/link.mjs and its two hooks were
 * written (the report names the reds):
 *
 *   ls1 a press brings the original's edition as a proposal in the copy's review queue and changes nothing published:
 *       the copy's draft, archive and place, and the original's whole folder, byte for byte.
 *   ls2 a field the copy changed beside a change the original made to it is a conflict row; a field only the original
 *       changed is a row with no conflict (the control); a field only the copy changed is no row at all.
 *   ls3 a second press with nothing new answers brought: false and leaves the copy's folder byte for byte.
 *   ls4 the newer-edition sign: clear on a fresh copy, set once the original publishes, clear again after a press.
 *   ls5 deciding the proposal lands the accepted rows in the copy's draft, and the next press reads against the edition
 *       then brought, so nothing already decided is offered again.
 *   ls6 while a press's file still waits undecided, a second press after a newer publish keeps the base the copy saw.
 *   ls7 the copy keeps its own id, starts with no team or place, and records the link (the original's id, the edition).
 *   974m8a a second make of a linked copy is the copy already held, and the list names that one link (board 974, maturity 8).
 *
 * BOARD 962, STAGE 7, V3 (2026-11-09): the original as a catalog of the team this Studio follows as a teammate (src/member.mjs).
 * A central Studio leads a sealed relay team and publishes by Studio's own publish under its signing key; an office Studio
 * joins it with its member key, is admitted, and follows it on the relay. Each leg builds its own two Studios, and each went red on the V2
 * branch, where no take exists:
 *
 *   962s7g "Take as a base" from the followed edition makes a catalog with a new id, rev 0, no signature, the edition kept byte
 *          for byte under linked/, and a link naming the team and no folder; its in-use names the central catalog by the desk's
 *          own pin and reaches the central mirror as a member's in-use.ec; a catalog the team does not hold is refused
 *   974m8b a second take of that catalog is the copy the office already holds (board 974, maturity 8)
 *   962s7h after the central removes a card, changes a variable and edits a card, the office's press offers each against the
 *          kept base with no conflict; the office's own added card is never offered for removal; a card both edited, and a tag
 *          both added under one id with different words, are conflicts
 *   962s7i the office's published edition carries no field naming the central (its catalog id, team id, lead key id, lead
 *          public key, lead's name, all searched for in the bytes, the same search finding the id in the office's project.json),
 *          is signed by the office's own key, and has no head field outside Studio's known header (unknownHeadKeys)
 *   962s7j the newer sign: clear after the take, set after the central publishes, clear after the press; and after a removal
 *          at the central the copy's original is not found and a press is refused, the draft untouched
 *
 * LINK_ONLY=<leg> runs one V3 leg alone, as the plants phase does in a scratch copy (tests/plant-copy.mjs); ETIUDA_PLANTS=off
 * skips that phase.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { PROJECT_FILE, DRAFT_FILE } from "../src/publish.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import * as Engine from "../src/engine.mjs";
import * as K from "../src/team-store.mjs";
import * as Relay from "../src/relay.mjs";
import { makeInvite, newSecret } from "../src/invite.mjs";
import { makeKeyFile, readKeyFile, unlockKey } from "../src/sign.mjs";
import { newTeam, withChannel, writeTeam, heldTeam, newEpoch } from "../src/team.mjs";
import { relayWorld, makeVault, hex, placeGrant, GRANT_ROOTS, memberSeat } from "./relay-lab.mjs";
import { copyPlants } from "./plant-copy.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "link-sync");
const EXPECTED = 12;
const SELF = fileURLToPath(import.meta.url);
const ONLY = process.env.LINK_ONLY || "";

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const readJson = (f) => JSON.parse(fs.readFileSync(f, "utf8"));

/** Every file under `dir` by relative path, with its sha256: two such maps equal are two folders byte for byte. */
function treeOf(dir, skip) {
  const out = {};
  const walk = (at, rel) => {
    let names = [];
    try { names = fs.readdirSync(at, { withFileTypes: true }); } catch { return; }
    for (const d of names) {
      const r = rel ? rel + "/" + d.name : d.name;
      if (skip && skip(r)) continue;
      if (d.isDirectory()) walk(path.join(at, d.name), r);
      else out[r] = crypto.createHash("sha256").update(fs.readFileSync(path.join(at, d.name))).digest("hex");
    }
  };
  walk(dir, "");
  return JSON.stringify(out, Object.keys(out).sort());
}
/* project.json carries the open's stamp, which every open rewrites; it is compared without it. */
const recordOf = (dir) => { const r = readJson(path.join(dir, PROJECT_FILE)); delete r.opened; return JSON.stringify(r); };

async function lsLegs() {
  const S = await import("../src/studio.mjs");
  const Link = await import("../src/link.mjs");
  const root = path.join(SCRATCH, "projects");
  const shareA = path.join(SCRATCH, "share-a"), shareB = path.join(SCRATCH, "share-b");
  [root, shareA, shareB].forEach((d) => fs.mkdirSync(d, { recursive: true }));
  const en = [{ code: "en", name: "English" }];

  /* ---- the original, published once ------------------------------------------------------------------------------- */
  const o = await S.newProject(root, "Varnel tosk", en);
  const shelf = (await S.addTag(o.dir, "shelf", { en: "General" }));
  const sid = (shelf.tag || shelf).id;
  const ids = [];
  for (const t of ["Alpha", "Bravo", "Charlie"]) ids.push((await S.addCard(o.dir, sid, t, t + " answer, as first written.")).card.id);
  const [cA, cB, cC] = ids;
  await S.publishProject(o.dir, { folder: shareA, notes: "one" });

  /* ---- ls7: the copy -------------------------------------------------------------------------------------------- */
  const copy = await S.makeLinkedCopy(o.dir);
  const cRec = readJson(path.join(copy.dir, PROJECT_FILE));
  const oRev1 = readJson(path.join(o.dir, PROJECT_FILE)).rev;
  check(!!copy.draft && copy.draft.id !== o.draft.id && cRec.id === copy.draft.id && !cRec.folder && !cRec.sealedTeam
        && !!cRec.linked && cRec.linked.from === o.draft.id && cRec.linked.brought && cRec.linked.brought.rev === oRev1
        && path.dirname(copy.dir) === root && copy.draft.cards.length === 3 && copy.draft.rev === 0,
    "ls7 a linked copy has an id of its own, no place and no team, sits beside the original, holds the original's"
    + " published cards at rev 0, and records the original's id and the edition it was made from: "
    + JSON.stringify({ ownId: copy.draft.id !== o.draft.id, folder: cRec.folder || null, linked: cRec.linked || null,
      cards: copy.draft.cards.length }));

  /* ---- ls4, first half: a fresh copy shows no sign ---------------------------------------------------------------- */
  const fresh = await S.linkedState(copy.dir);
  const opened = await S.openProject(copy.dir);
  const plain = await S.openProject(o.dir);
  check(!!fresh && fresh.found === true && fresh.newer === false && !!opened.linked && opened.linked.newer === false
        && plain.linked === null,
    "ls4a a fresh copy knows its original and shows no newer edition, through linkedState and through the open; the"
    + " original, which is no copy, has no link: " + JSON.stringify({ fresh, plain: plain.linked }));

  /* The copy goes to its own team's place and publishes there. */
  S.setPublishFolder(copy.dir, shareB);
  await S.publishProject(copy.dir, { folder: shareB, notes: "copy one" });

  /* ---- each side edits; the original publishes again -------------------------------------------------------------- */
  await S.saveCard(o.dir, cA, { body: { en: "Alpha answer, as the original rewrote it." } });   /* both change A */
  await S.saveCard(o.dir, cB, { body: { en: "Bravo answer, as the original rewrote it." } });   /* only the original changes B */
  /* The copy publishes its own edits three times, so no edition near its rev is the original's: read against the copy's
     own archive, as any other file of its id is, the original's rows would undo the copy's edits without a conflict. */
  await S.saveCard(copy.dir, cA, { body: { en: "Alpha answer, as the copy rewrote it." } });    /* both change A */
  await S.publishProject(copy.dir, { folder: shareB, notes: "copy two" });
  await S.saveCard(copy.dir, cC, { body: { en: "Charlie answer, as the copy first rewrote it." } });
  await S.publishProject(copy.dir, { folder: shareB, notes: "copy three" });
  await S.saveCard(copy.dir, cC, { body: { en: "Charlie answer, as the copy rewrote it." } });  /* only the copy changes C */
  await S.publishProject(copy.dir, { folder: shareB, notes: "copy four" });
  await S.publishProject(o.dir, { folder: shareA, notes: "two" });
  const oRev2 = readJson(path.join(o.dir, PROJECT_FILE)).rev;

  const signed = await S.linkedState(copy.dir);
  check(!!signed && signed.newer === true && signed.latest && signed.latest.rev === oRev2 && signed.brought.rev === oRev1,
    "ls4b once the original publishes, the copy shows a newer edition: " + JSON.stringify(signed));

  /* ---- ls1: the press ---------------------------------------------------------------------------------------------- */
  const keepCopy = (r) => r === PROJECT_FILE || r.startsWith("inbox/") || r.startsWith("linked/");
  const before = { copy: treeOf(copy.dir, keepCopy), shareB: treeOf(shareB), orig: treeOf(o.dir, (r) => r === PROJECT_FILE),
                   origRec: recordOf(o.dir), shareA: treeOf(shareA) };
  const press = await S.bringUpToOriginal(copy.dir);
  const listed = await S.listProposals(copy.dir);
  const row = (listed.proposals || []).find((p) => p.file === press.file);
  check(press.brought === true && press.rev === oRev2 && !!row && row.ok && row.linked === o.draft.id && row.changes > 0
        && treeOf(copy.dir, keepCopy) === before.copy && treeOf(shareB) === before.shareB
        && treeOf(o.dir, (r) => r === PROJECT_FILE) === before.orig && recordOf(o.dir) === before.origRec
        && treeOf(shareA) === before.shareA,
    "ls1 a press brings the original's rev " + oRev2 + " into the copy's review queue as a proposal, and the copy's draft,"
    + " archive and place and the original's folder and place are byte for byte as they were: "
    + JSON.stringify({ press, row: row ? { ok: row.ok, linked: row.linked, changes: row.changes } : null,
      copySame: treeOf(copy.dir, keepCopy) === before.copy, shareBSame: treeOf(shareB) === before.shareB,
      origSame: treeOf(o.dir, (r) => r === PROJECT_FILE) === before.orig && recordOf(o.dir) === before.origRec }));

  /* ---- ls2: conflicts ------------------------------------------------------------------------------------------------- */
  const look = await S.openProposal(copy.dir, press.file);
  const rows = (look && (look.changes || look.rows)) || [];
  const keyed = (id) => rows.filter((c) => String(c.key || "").startsWith("card:" + id));
  const a = keyed(cA), b = keyed(cB), c = keyed(cC);
  check(a.length === 1 && a[0].conflict === true,
    "ls2a the field the copy changed beside the original's change to it is one conflict row: "
    + JSON.stringify(a.map((x) => ({ key: x.key, conflict: x.conflict }))));
  check(b.length === 1 && b[0].conflict === false && c.length === 0,
    "ls2b CONTROL: the field only the original changed is a row with no conflict, and the field only the copy changed is"
    + " no row at all, so nothing the copy wrote is offered for undoing: "
    + JSON.stringify({ b: b.map((x) => ({ key: x.key, conflict: x.conflict })), c: c.map((x) => x.key) }));

  /* ---- ls3: a second press with nothing new ------------------------------------------------------------------------ */
  const still = treeOf(copy.dir, (r) => r === PROJECT_FILE);
  const stillRec = recordOf(copy.dir);
  const again = await S.bringUpToOriginal(copy.dir);
  check(again.brought === false && treeOf(copy.dir, (r) => r === PROJECT_FILE) === still && recordOf(copy.dir) === stillRec,
    "ls3 a second press with nothing new brings nothing and leaves the copy's folder and record byte for byte: "
    + JSON.stringify(again));

  /* ---- ls4, second half: the sign clears ---------------------------------------------------------------------------- */
  const cleared = await S.linkedState(copy.dir);
  check(!!cleared && cleared.newer === false && cleared.brought.rev === oRev2 && cleared.waiting === press.file,
    "ls4c after the press the sign is clear and the copy names the file waiting in its queue: " + JSON.stringify(cleared));

  /* ---- ls6: a newer publish while the file still waits keeps the base the copy saw ---------------------------------- */
  await S.saveCard(o.dir, cC, { title: { en: "Charlie, retitled by the original" } });
  await S.publishProject(o.dir, { folder: shareA, notes: "three" });
  const oRev3 = readJson(path.join(o.dir, PROJECT_FILE)).rev;
  const third = await S.bringUpToOriginal(copy.dir);
  const look3 = await S.openProposal(copy.dir, third.file);
  const rows3 = (look3 && (look3.changes || look3.rows)) || [];
  check(third.brought === true && third.rev === oRev3 && third.base === oRev1 && third.file === press.file
        && rows3.some((x) => String(x.key).startsWith("card:" + cB) && !x.conflict)
        && rows3.some((x) => String(x.key).startsWith("card:" + cC + ":title")),
    "ls6 a press after a newer publish, while the earlier file waits undecided, replaces it and keeps rev " + oRev1
    + " as the base, so the original's earlier change is still offered beside the new one: "
    + JSON.stringify({ third, keys: rows3.map((x) => x.key + (x.conflict ? " (conflict)" : "")) }));

  /* ---- ls5: deciding it, then the next press reads against what was decided ----------------------------------------- */
  const decisions = {};
  rows3.forEach((x) => { decisions[x.key] = String(x.key).startsWith("card:" + cA) ? "reject" : "accept"; });
  const decided = await S.decideProposal(copy.dir, third.file, decisions, "Bring up to the original", null);
  const draft = readJson(path.join(copy.dir, DRAFT_FILE));
  const card = (id) => draft.cards.find((x) => x.id === id);
  await S.saveCard(o.dir, cB, { title: { en: "Bravo, retitled by the original" } });
  await S.publishProject(o.dir, { folder: shareA, notes: "four" });
  const fourth = await S.bringUpToOriginal(copy.dir);
  const look4 = await S.openProposal(copy.dir, fourth.file);
  const keys4 = ((look4 && (look4.changes || look4.rows)) || []).map((x) => x.key);
  check(decided.ok && !!decided.decidedTo && card(cB).body.en === "Bravo answer, as the original rewrote it."
        && card(cA).body.en === "Alpha answer, as the copy rewrote it."
        && card(cC).title.en === "Charlie, retitled by the original" && card(cC).body.en === "Charlie answer, as the copy rewrote it.",
    "ls5a deciding the proposal lands the accepted rows in the copy's draft, keeps the rejected conflict as the copy wrote"
    + " it, and leaves the queue: " + JSON.stringify({ ok: decided.ok, decidedTo: !!decided.decidedTo,
      a: card(cA).body.en, b: card(cB).body.en, c: [card(cC).title.en, card(cC).body.en] }));
  check(fourth.brought === true && fourth.base === oRev3 && keys4.length === 1 && keys4[0] === "card:" + cB + ":title.en",
    "ls5b the next press reads against the edition then brought, so only the original's newest change is offered: "
    + JSON.stringify({ fourth, keys4 }));

  /* src/studio.mjs's inbox and src/link.mjs's are one folder. */
  if (Link.INBOX !== path.basename(listed.inbox)) { failed++; process.stderr.write("  FAIL the inbox names differ\n"); }

  /* BOARD 974, MATURITY 8. A second make is the copy this Studio already holds, and the list names that one link. */
  const heldRow = (await S.listProjects(root)).projects.find((p) => p.dir === copy.dir);
  const secondCopy = await S.makeLinkedCopy(o.dir);
  const heldCount = (await S.listProjects(root)).projects
    .filter((p) => p.linked && p.linked.from === o.draft.id && !p.linked.team).length;
  check(!!heldRow && !!heldRow.linked && heldRow.linked.from === o.draft.id && !heldRow.linked.team
        && secondCopy.dir === copy.dir && heldCount === 1,
    "974m8a a second linked copy is the copy already held, and the list names that one link: "
    + JSON.stringify({ linked: heldRow && heldRow.linked, second: secondCopy && secondCopy.dir, first: copy.dir, heldCount }));
}

/* ---- board 962, stage 7, V3: a followed team's catalog as the original ------------------------------------------------ */

const PASS = "harbour-lamp-passphrase";
const EN = [{ code: "en", name: "English" }];
const HOURS = { morning: "08:00", afternoon: "12:00", evening: "18:00" };
const readSafe = (f) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return null; } };
const said = (e) => String(e && e.message) + " " + JSON.stringify((e && e.said) || {});

/* A Studio's signing key in `ud`, opened. */
async function studioKey(ud) {
  fs.mkdirSync(ud, { recursive: true });
  const keyAt = path.join(ud, "signing-key.json");
  fs.writeFileSync(keyAt, JSON.stringify(await makeKeyFile({ passphrase: PASS }), null, 1) + "\n");
  const read = readKeyFile(keyAt);
  return { ud, keyAt, read, open: unlockKey(read, PASS) };
}

/** Two Studios in this process. The central leads a sealed relay team listing one catalog, three cards and the hours,
 *  published at rev 1 by Studio's own publish under its signing key; the office joins with its member key, is admitted by the
 *  central's watchAdmit, and follows the team by src/member.mjs's own run. Throwaway keys and invented words only. */
async function world(name) {
  const S = await import("../src/studio.mjs");
  const M = await import("../src/member.mjs");
  const Link = await import("../src/link.mjs");
  const rw = await relayWorld();
  const lab = path.join(SCRATCH, name);
  const croot = path.join(lab, "central-projects");
  const oroot = path.join(lab, "office-projects"), oshare = path.join(lab, "office-share");
  [croot, oroot, oshare].forEach((d) => fs.mkdirSync(d, { recursive: true }));

  const c = await studioKey(path.join(lab, "central"));
  c.tf = K.teamsFile(c.ud); c.vault = makeVault();
  placeGrant(c.keyAt, c.open.public);
  const p = await S.newProject(croot, "Harbour lamps", EN);
  const shelf = await S.addTag(p.dir, "shelf", { en: "General" });
  const sid = (shelf.tag || shelf).id;
  const cards = {};
  for (const t of ["Alpha", "Bravo", "Charlie"]) cards[t] = (await S.addCard(p.dir, sid, t, t + " answer, as first written.")).card.id;
  await S.saveVariables(p.dir, { hours: HOURS });
  const catId = readJson(path.join(p.dir, DRAFT_FILE)).id;
  const teamId = "t-" + hex(8), teamKey = crypto.randomBytes(32), rt = Relay.relayId();
  K.keepTeamKey(c.tf, c.vault, teamId, 1, teamKey);
  const mirror = K.keepRelay(c.tf, teamId, rt, Relay.RELAY_URL);
  fs.mkdirSync(mirror, { recursive: true });
  let team = newTeam({ id: teamId, catalogs: [catId], lead: { keyId: c.open.keyId, public: c.open.public }, sealed: true, exportsSealed: true });
  team = withChannel(team, { kind: "relay", rt, url: Relay.RELAY_URL }, { format: 1, kind: "etiuda-ring", keys: [] });
  await writeTeam(mirror, team, { key: c.keyAt, passphrase: PASS });
  const lt = rw.transport("central");
  const runner = Relay.relayRunner({ roots: GRANT_ROOTS, teamsFile: c.tf, vault: c.vault, keyFile: c.keyAt, secret: () => PASS,
    request: lt.request, connect: lt.connect, watch: false, pollMs: 1e9, say: () => {} });
  const box = Relay.leadOpened(c.keyAt, PASS).box.public;
  const secret = newSecret(), ri = Relay.relayInvite(secret);
  const made = makeInvite({ team: teamId, folder: mirror, lead: { keyId: c.open.keyId, public: c.open.public, box } }, "Central lead", secret, Date.now(),
    undefined, { rt, url: Relay.RELAY_URL, token: ri.token, inv: ri.inv });
  K.keepInvite(c.tf, c.vault, teamId, { id: made.id, secret, made: made.made, expires: made.expires, name: made.name, relay: ri });
  await runner.sync(); await runner.idle();

  S.setPublishFolder(p.dir, mirror);
  let day = 0;
  const publish = async () => {
    day++;
    const r = await S.publishProject(p.dir, { folder: mirror, key: c.keyAt, passphrase: PASS, teamKeys: K.teamKeysOf(c.tf, c.vault),
      now: "2026-11-0" + day + "T08:00:00.000Z" });
    await runner.sync(); await runner.idle();
    return r;
  };
  await publish();

  const o = await studioKey(path.join(lab, "office"));
  o.tf = K.teamsFile(o.ud); o.vault = makeVault(); o.memberFile = path.join(o.ud, "member-key.json");
  const joined = M.joinTeam({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, text: made.link, name: "Office Studio",
    signingPublic: o.open.public });
  const ot = rw.transport("office");
  const f = M.startFollow({ teamsFile: o.tf, vault: o.vault, memberFile: o.memberFile, seat: memberSeat(o.memberFile), signingPublic: o.open.public,
    request: ot.request, connect: ot.connect, pollMs: 1e9, watch: false });
  const kicks = async (n) => { for (let i = 0; i < (n || 3); i++) { f.kick(); await f.idle(); } };
  await kicks(3);
  await runner.sync(); await runner.idle();
  const admitted = await S.watchAdmit(mirror, c.keyAt, PASS, { auto: false, teamKeys: K.teamKeysOf(c.tf, c.vault),
    invites: K.inviteBookOf(c.tf, c.vault), teamsFile: c.tf });
  for (const x of admitted.spent || []) K.endInvite(c.tf, teamId, x.invite, "spent", x.desk);
  await Relay.answerAdmitted(runner, { teamsFile: c.tf, vault: c.vault, team: teamId, folder: mirror, spent: admitted.spent });
  await kicks(2);
  for (let i = 0; i < 3; i++) { await runner.sync(); await runner.idle(); await kicks(2); }

  /* What the shell hands the thread (shell/main.js followedNow), made by the same function. */
  const followed = (text) => Link.followedFor(o.tf, o.vault, { text });
  const take = async () => S.takeBase(catId, { followed: await followed(true), root: oroot });
  const remove = async () => {
    const h = await heldTeam(mirror, { key: c.keyAt });
    const next = await newEpoch(h.team, { key: c.keyAt, remove: joined.member, secret: PASS });
    await writeTeam(mirror, next.team, { key: c.keyAt, passphrase: PASS });
    K.keepTeamKey(c.tf, c.vault, teamId, 2, next.teamKey);
    await runner.sync(); await runner.idle();
    await kicks(3);
  };
  const stop = async () => { try { await f.stop(); } catch {} try { await runner.stop(); } catch {} };
  return { S, M, Link, mirror, runner, oshare, oroot, c, o, p, sid, cards, catId, teamId, teamKey, joined, f, kicks, publish, followed, take, remove, stop };
}

const V3 = {};

V3["962s7g"] = async () => {
  const w = await world("s7g");
  try {
    const eds = await w.followed(true);
    const ed = eds && eds.editions.find((e) => e.catalog === w.catId);
    const t = await w.take();
    const rec = readJson(path.join(t.dir, PROJECT_FILE)), draft = readJson(path.join(t.dir, DRAFT_FILE));
    const kept = path.join(t.dir, "linked", "rev-1.ec");
    const keptSame = !!ed && fs.existsSync(kept) && fs.readFileSync(kept, "utf8") === ed.text;
    const pin = ed ? Engine.deskRules().signedSha(JSON.parse(ed.text)) : "";
    const link = rec.linked || {};
    const linkOk = link.from === w.catId && link.team === w.teamId && !("dir" in link) && !!link.brought && link.brought.rev === 1
      && link.brought.edition === (ed && ed.file);
    const own = draft.id !== w.catId && rec.id === draft.id && draft.rev === 0 && !draft.sig && !draft.evaluation && draft.cards.length === 3
      && !rec.folder && path.dirname(t.dir) === w.oroot && t.draft && t.draft.id === draft.id;
    const inUse = !!t.inUse && t.inUse.id === w.catId && t.inUse.rev === 1 && /^sha256:[0-9a-f]{64}$/.test(pin) && t.inUse.sha256 === pin;
    /* The shell's write after a take (shell/main.js inUseUp), and the run that sends it. */
    w.M.writeInUse({ teamsFile: w.o.tf, vault: w.o.vault, memberFile: w.o.memberFile, signingPublic: w.o.open.public, catalog: t.inUse });
    await w.f.settle(10000);
    await w.runner.sync(); await w.runner.idle();
    const env = readSafe(path.join(w.mirror, "desks", w.joined.member, "in-use.ec"));
    let up = null;
    try { up = JSON.parse(Engine.sealRules().openSealed(w.teamKey, env)).catalog; } catch { up = null; }
    const reached = !!up && up.id === w.catId && up.rev === 1 && up.sha256 === pin;
    let other = false;
    try { await w.S.takeBase("c-" + hex(8), { followed: await w.followed(true), root: w.oroot }); }
    catch (e) { other = said(e).indexOf("no edition of that catalog") >= 0; }
    check(!!ed && keptSame && linkOk && own && inUse && reached && other,
      "962s7g Take as a base makes a catalog with an id of its own at rev 0, unsigned, in the office's root " + own + ", keeps the"
      + " followed edition byte for byte under linked/ " + keptSame + ", links it by team and no folder " + linkOk + " ("
      + JSON.stringify(link) + "), names the central catalog by the desk's pin for the in-use file " + inUse + ", which reaches the"
      + " central share " + reached + "; a catalog the team does not hold is refused " + other);
    const againTake = await w.take();
    let officeDirs = 0;
    try {
      officeDirs = fs.readdirSync(w.oroot).filter((n) => {
        try { return fs.statSync(path.join(w.oroot, n)).isDirectory(); } catch { return false; }
      }).length;
    } catch { officeDirs = -1; }
    check(againTake.dir === t.dir && officeDirs === 1,
      "974m8b a second take is the copy the office already holds: "
      + JSON.stringify({ first: t.dir, second: againTake && againTake.dir, officeDirs }));
  } finally { await w.stop(); }
};

V3["962s7h"] = async () => {
  const w = await world("s7h");
  try {
    const S = w.S, t = await w.take(), o = t.dir, cen = w.p.dir;
    /* The office's own work on its base. */
    const delta = (await S.addCard(o, w.sid, "Delta", "Delta answer, the office's own.")).card.id;
    await S.saveCard(o, w.cards.Charlie, { body: { en: "Charlie answer, as the office rewrote it." } });
    const oTag = await S.addTag(o, "request", { en: "Support" });
    /* The central's, published as rev 2. */
    await S.deleteCard(cen, w.cards.Bravo);
    await S.saveVariables(cen, { hours: Object.assign({}, HOURS, { evening: "17:00" }) });
    await S.saveCard(cen, w.cards.Alpha, { body: { en: "Alpha answer, as the central rewrote it." } });
    await S.saveCard(cen, w.cards.Charlie, { body: { en: "Charlie answer, as the central rewrote it." } });
    const cTag = await S.addTag(cen, "request", { en: "Support" });
    const tagId = (cTag.tag || cTag).id;
    await S.renameTag(cen, tagId, { en: "Support line" });
    await w.publish();
    await w.kicks(4);
    const press = await S.bringUpToOriginal(o, { followed: await w.followed(true) });
    const look = await S.openProposal(o, press.file);
    const rows = (look && (look.changes || look.rows)) || [];
    const keys = rows.map((x) => x.key + (x.conflict ? " (conflict)" : ""));
    const one = (k) => rows.filter((x) => x.key === k);
    const plain = (k) => one(k).length === 1 && one(k)[0].conflict === false;
    const held = (k) => one(k).length === 1 && one(k)[0].conflict === true;
    const vars = rows.filter((x) => String(x.key).startsWith("header:variables"));
    const offered = press.brought === true && press.rev === 2 && plain("card-:" + w.cards.Bravo) && plain("card:" + w.cards.Alpha + ":body.en")
      && vars.length >= 1 && vars.every((x) => x.conflict === false);
    check(offered, "962s7h the central's removal of a card, its change to a variable and its edit of a card are each offered against"
      + " the kept base with no conflict: " + JSON.stringify(keys));
    const sameTag = (oTag.tag || oTag).id === tagId;
    const tagHeld = rows.some((x) => String(x.key).replace(/^tag[+-]?:/, "").split(":")[0] === tagId && x.conflict === true);
    const neverOwn = !rows.some((x) => String(x.key).indexOf(delta) >= 0);
    check(neverOwn && held("card:" + w.cards.Charlie + ":body.en") && sameTag && tagHeld,
      "962s7h the office's own card is never offered for removal " + neverOwn + ", a card both edited is a conflict "
      + held("card:" + w.cards.Charlie + ":body.en") + ", and a tag both added under one id (" + sameTag + ") with different words is a"
      + " conflict " + tagHeld + ": " + JSON.stringify(keys));
  } finally { await w.stop(); }
};

V3["962s7i"] = async () => {
  const w = await world("s7i");
  try {
    const t = await w.take();
    await w.S.saveCard(t.dir, w.cards.Alpha, { body: { en: "Alpha answer, in the office's words." } });
    w.S.setPublishFolder(t.dir, w.oshare);
    await w.S.publishProject(t.dir, { folder: w.oshare, key: w.o.keyAt, passphrase: PASS, now: "2026-11-09T09:00:00.000Z" });
    const files = fs.readdirSync(w.oshare).filter((n) => /\.ec$/i.test(n));
    const text = files.length === 1 ? fs.readFileSync(path.join(w.oshare, files[0]), "utf8") : "";
    const marks = { catalog: w.catId, team: w.teamId, leadKeyId: w.c.open.keyId, leadPublic: w.c.open.public, leadName: "Central lead" };
    const found = Object.keys(marks).filter((k) => text.indexOf(marks[k]) >= 0);
    /* The same search finds the link where it is kept, the office's own record, so a search that matches nothing is not blind. */
    const rec = fs.readFileSync(path.join(t.dir, PROJECT_FILE), "utf8");
    const control = rec.indexOf(marks.catalog) >= 0 && rec.indexOf(marks.team) >= 0;
    const doc = text ? JSON.parse(text) : {};
    const R = await import("../src/review.mjs");
    const unknown = R.unknownHeadKeys(doc, Engine.namedFields().head);
    const ownSig = !!doc.sig && doc.sig.keyId === w.o.open.keyId;
    check(files.length === 1 && found.length === 0 && control && ownSig && unknown.length === 0,
      "962s7i the office's published edition names nothing of the central (found " + JSON.stringify(found) + "; the same search finds"
      + " the link in the office's project.json " + control + "), is signed by the office's own key " + ownSig + ", and has no head"
      + " field outside the known header " + JSON.stringify(unknown) + " (" + files.length + " edition)");
  } finally { await w.stop(); }
};

V3["962s7j"] = async () => {
  const w = await world("s7j");
  try {
    const t = await w.take();
    const state = async () => w.Link.linkState(t.dir, { followed: await w.followed(false) });
    const s0 = await state();
    await w.S.saveCard(w.p.dir, w.cards.Bravo, { body: { en: "Bravo answer, as the central rewrote it." } });
    await w.publish();
    await w.kicks(4);
    const s1 = await state();
    const opened = await w.S.openProject(t.dir, { followed: await w.followed(false) });
    const press = await w.S.bringUpToOriginal(t.dir, { followed: await w.followed(true) });
    const s2 = await state();
    await w.remove();
    const s3 = await state();
    const before = fs.readFileSync(path.join(t.dir, DRAFT_FILE), "utf8");
    let refused = false;
    try { await w.S.bringUpToOriginal(t.dir, { followed: await w.followed(true) }); }
    catch (e) { refused = said(e).indexOf("out of reach from here") >= 0; }
    const same = fs.readFileSync(path.join(t.dir, DRAFT_FILE), "utf8") === before;
    const ok = !!s0 && s0.found && s0.team === w.teamId && s0.newer === false && !!s1 && s1.newer === true && !!s1.latest && s1.latest.rev === 2
      && !!opened.linked && opened.linked.newer === true && press.brought === true && press.rev === 2 && !!s2 && s2.newer === false
      && !!s2.brought && s2.brought.rev === 2 && !!s3 && s3.found === false && refused && same;
    check(ok, "962s7j the newer sign is clear after the take, set once the central publishes (through the open too), clear after the"
      + " press; after a removal at the central the original is not found and a press is refused with the draft untouched: "
      + JSON.stringify({ s0: s0 && [s0.found, s0.newer], s1: s1 && [s1.newer, s1.latest], open: opened.linked && opened.linked.newer,
        press: [press.brought, press.rev], s2: s2 && [s2.newer, s2.brought], s3: s3 && s3.found, refused, same }));
  } finally { await w.stop(); }
};
const V3_CHECKS = { "962s7g": 2, "962s7h": 2, "962s7i": 1, "962s7j": 1 };

const PLANTS = [
  { mark: "962s7g-kept", leg: "962s7g", rel: "src/link.mjs", line: "  /* the edition not kept */" },
  { mark: "962s7g-inuse", leg: "962s7g", rel: "src/link.mjs", line: "  pin = \"sha256:\" + sha256(Buffer.from(JSON.stringify(signed), \"utf8\"));" },
  { mark: "962s7g-strip", leg: "962s7g", rel: "src/link.mjs", line: "  [\"hash\", \"modified\", \"notes\"].forEach((k) => { delete draft[k]; });" },
  { mark: "962s7i-id", leg: "962s7i", rel: "src/link.mjs", line: "  draft.id = String(draft.id);" },
  { mark: "962s7h-sync", leg: "962s7h", rel: "src/link.mjs", line: "    pending: undefined });" },
  { mark: "962s7j-kind", leg: "962s7j", rel: "src/link.mjs", line: "  if (false) kind = \"team\";" },
  { mark: "962s7j-state", leg: "962s7j", rel: "src/link.mjs", line: "  on = TEAM_ID.test(team) && !!f && f.team === team;" },
];

async function main(argv) {
  clearScratch(SCRATCH);
  if (!ONLY) await lsLegs();
  for (const name of Object.keys(V3)) {
    if (ONLY && name !== ONLY) continue;
    const was = asserted;
    try { await V3[name](); }
    catch (e) { failed++; asserted++; process.stderr.write("  FAIL " + name + " threw: " + String(e && e.stack || e).split("\n").slice(0, 4).join(" | ") + "\n"); }
    /* A leg that threw counts its unrun checks as failed, so the count below still holds. */
    while (asserted - was < V3_CHECKS[name]) { asserted++; failed++; }
  }
  const plantsOff = process.env.ETIUDA_PLANTS === "off";
  if (!ONLY) copyPlants({ root: ROOT, self: SELF, label: "link-sync", onlyVar: "LINK_ONLY", plants: PLANTS, check, skip: (l) => process.stdout.write("  skip " + l + "\n"), timeout: 240000 });
  const expected = ONLY ? (V3_CHECKS[ONLY] || 0)
    : EXPECTED + Object.values(V3_CHECKS).reduce((a, b) => a + b, 0) + (plantsOff ? 0 : PLANTS.length + 1);

  process.stdout.write("\nlink-sync  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  if (asserted !== expected) {
    process.stderr.write("link-sync  expected " + expected + " assertions, ran " + asserted + "\n");
    failed++;
  }
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "link-sync");
  else process.stdout.write("link-sync  kept " + SCRATCH + "\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch((e) => {
  process.stderr.write("link-sync  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
