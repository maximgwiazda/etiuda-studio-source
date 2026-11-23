/* ONE LEG PER PROMISE PUBLISH MAKES. Course node 7.
 *
 *     node tests/publish.mjs [--keep]
 *
 * The four promises, and each is asserted against something other than the publisher's own
 * account of itself: it REFUSES a catalog the pinned engine's lint calls broken, and goes
 * anyway on a recorded override; it stamps the edition under a clock this file chooses, by a
 * step held to the ENGINE's own order of editions; it leaves an archive that still holds the bytes it wrote; and two archived
 * revisions diff into exactly the changes that were made between them.
 *
 * The fifth is determinism, which Clement's gate expects: the same project published twice with
 * the same clock gives the same bytes. It is asserted over two independent copies of one
 * project rather than over two publishes of one, because the second publish of one project is a
 * different revision by design and would rightly differ.
 *
 * THE BROKEN CATALOG IS BROKEN BY THE ENGINE'S RULE, not by one invented here, AND BY A RULE
 * THAT HOLDS ON EITHER PIN: one card's title in the PRIMARY language is emptied, which spec 2.7
 * requires of every card and which every engine this build can be pinned to calls an error. It
 * used to be broken with --missing-second-language, and that stopped being an error the day the
 * engine gave the state a class of its own (505, board 510) - a refusal leg resting on it would
 * have gone quietly green and then red at the next pin move rather than measuring the refusal.
 *
 * A DRAFT AWAITING A LANGUAGE PUBLISHES (Maxim, board 510, 2026-09-18) and says what it is
 * waiting for, per language, in the release notes and in the archived report. That is section
 * 1's second half, and it is asserted on either pin because the classifier under it asks the
 * engine differentially where the engine has no class of its own to answer with.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as Engine from "../src/engine.mjs";
import * as T from "../src/team.mjs";
import { importCsv } from "../src/import.mjs";
import { publishFull, editionsIn, archivedCatalog, stampEdition, editionRules,
         PROJECT_FILE, DRAFT_FILE, ARCHIVE, CATALOG_IN_ARCHIVE, RELEASE_IN_ARCHIVE,
         NOTES_IN_ARCHIVE, REPORT_IN_ARCHIVE } from "../src/publish.mjs";
import { diffCatalogs } from "../src/diff.mjs";
import { makeKeyFile, readKeyFile, unlockKey } from "../src/sign.mjs";
import * as Studio from "../src/studio.mjs";
import { loadPage } from "./page-stand-in.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { engineRepo, gitText, blob } from "../tools/engine-fetch.mjs";
import { writeSpan } from "../src/stats.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "publish-legs");
const CLOCK = "2026-09-17T09:00:00";

/* ETIUDA_PLANTS=off (a merge's area run) skips the plant leg 9p and counts it; PUBLISH_NO_PLANTS, which 9p's own children
   carry, is the same switch folded in. The release profile runs with plants on, so 9p still runs there. */
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off" || !!process.env.PUBLISH_NO_PLANTS;
let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
function skip(line) {
  skipped++;
  process.stdout.write("  SKIP  " + line + "\n");
}

function pile(name, seed, rows, faults) {
  const out = path.join(SCRATCH, "piles", name);
  const args = ["tools/fixtures/generate.mjs", "--seed", String(seed), "--rows", String(rows),
                "--out", out].concat(faults.map(f => "--" + f));
  const r = spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) throw new Error("the generator refused: " + (r.stderr || r.stdout));
  return path.join(out, "macros.csv");
}

/* NO LEG HERE BRANCHES ON THE PIN ANY MORE, and that is the point of section 1's shape: the
   refusal is driven by a fault spec 2.7 makes an error on every engine, and the awaiting state
   is driven through the classifier, which asks an engine without a class of its own
   differentially. A leg that has to ask which engine it is talking to is a leg that will be
   wrong on one of them. */

/** A project folder from a CSV: the importer's draft plus the project record. The override is
 *  the importer's own, so a leg can drop a column at the door as a vendor export would, and
 *  `hurt` is a hand on the draft after the import, for a fault no vendor export carries. Such a
 *  hand leaves the draft's own hash stale and that is harmless: the publisher strips and
 *  recomputes the hash before it lints, and says at length why. */
async function project(name, csv, id, override, hurt) {
  const dir = path.join(SCRATCH, name);
  fs.mkdirSync(dir, { recursive: true });
  const made = await importCsv({ file: csv, id, name: id, override: override || null });
  if (hurt) hurt(made.catalog);
  fs.writeFileSync(path.join(dir, DRAFT_FILE), JSON.stringify(made.catalog, null, 1) + "\n");
  fs.writeFileSync(path.join(dir, PROJECT_FILE),
    JSON.stringify({ id: made.catalog.id, rev: 0, edition: "" }, null, 1) + "\n");
  return { dir, catalog: made.catalog, report: made.report };
}

const copyTree = (a, b) => fs.cpSync(a, b, { recursive: true });

/** A verdict in one phrase, for a leg that has to print the same fact on either pin. */
const said = v => v.errors + " error(s)"
  + ((v.awaiting || []).length
     ? " and " + v.awaiting.map(a => a.lang + " over " + a.cards + " card(s)").join(", ")
       + " awaiting"
     : "");

/* ---- 9b. A PUBLISH INTO A FOLDER THAT HOLDS A TEAM FILE WRITES NO TEAM FILE AND NO HEAD (the folder team's removal) ----
   Was: THE HEAD CANNOT BE WRITTEN AFTER THE EDITION LANDED (the test architect's follow-up to board 945 item 6), where the publish embedded
   the ring in the team file and wrote etiuda-head.json at a shared folder, and rolled forward when it could not. Studio writes neither now
   (Max, 2026-11-22 15:37: "remove it, burn it with fire"): the edition and the ring land, and the team file and the head are not touched.
   plant:publish-roll-forward and plant:publish-roll-log (the log's twice: in the page and in 9p's plant) stood on the roll-forward and its log (the old 9p proved them), which are gone; plant:publish-roll-log; the marks stay
   until the plant guard has a way to retire one. */
async function leg9b(cleanCsv, PASS) {
  const share = path.join(SCRATCH, "team-folder-share-b");
  fs.mkdirSync(share, { recursive: true });
  const pB = await project("team-folder-project-b", cleanCsv, "pilot-team-b");
  const keyDoc = await makeKeyFile({ passphrase: PASS });
  const keyFile = path.join(SCRATCH, "pilot-lead-key-b.json");
  fs.writeFileSync(keyFile, JSON.stringify(keyDoc, null, 1) + "\n");
  await T.writeTeam(share, T.newTeam({ id: "t-" + crypto.randomBytes(8).toString("hex"), catalogs: ["pilot-team-b"],
    lead: { keyId: keyDoc.keyId, public: keyDoc.public }, sealed: false }), { key: keyFile, passphrase: PASS });
  const teamFile = path.join(share, "etiuda-team.json"), headFile = path.join(share, "etiuda-head.json");
  const teamBytes = fs.readFileSync(teamFile, "utf8");
  let first = null, threw = "", logged = [];
  const origStderrWrite = process.stderr.write;
  process.stderr.write = (chunk, enc, cb) => {
    logged.push(Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk));
    if (typeof enc === "function") enc(); else if (typeof cb === "function") cb();
    return true;
  };
  try { first = await publishFull({ project: pB.dir, folder: share, key: keyFile, passphrase: PASS, now: "2026-10-29T10:00:00.000Z" }); }
  catch (e) { threw = e && e.message ? e.message : String(e); }
  finally { process.stderr.write = origStderrWrite; }
  const recorded = JSON.parse(fs.readFileSync(path.join(pB.dir, PROJECT_FILE), "utf8"));
  check(!threw && !!first && first.rev === 1 && fs.readFileSync(teamFile, "utf8") === teamBytes && !fs.existsSync(headFile)
      && first.team === undefined && first.head === undefined && first.ringHeadLater === undefined,
    "9b1 a publish into a folder that holds a team file leaves the team file's bytes as they were, writes no etiuda-head.json and answers no team, head or ringHeadLater"
    + " (was: an I/O throw writing the head after the edition landed did not turn the publish into a failure): "
    + JSON.stringify([threw, first && first.rev, fs.existsSync(headFile)]));
  check(!!first && fs.existsSync(first.ec) && fs.existsSync(first.archive) && recorded.rev === 1,
    "9b2 the edition is in the share and the archive, and the project record has moved to rev 1");
  let second = null, loggedSecond = [];
  process.stderr.write = (chunk, enc, cb) => {
    loggedSecond.push(Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk));
    if (typeof enc === "function") enc(); else if (typeof cb === "function") cb();
    return true;
  };
  try { second = await publishFull({ project: pB.dir, folder: share, key: keyFile, passphrase: PASS, now: "2026-10-29T11:00:00.000Z" }); }
  catch { second = null; }
  finally { process.stderr.write = origStderrWrite; }
  check(!!second && second.rev === 2 && fs.readFileSync(teamFile, "utf8") === teamBytes && !fs.existsSync(headFile),
    "9b3 the next publish writes none either: rev 2, the team file as it was and still no head (was: the next publish wrote the head naming rev 2)");
  check(logged.length === 0 && loggedSecond.length === 0,
    "9b4 nothing is logged to stderr by either publish (was: the catch logged the error writing the team file or head): " + JSON.stringify([logged, loggedSecond]));
}

/* ONE WRITE OF ANOTHER STUDIO'S, MADE WHILE THIS PUBLISH IS UNDER WAY: the first fs.writeFileSync whose path ends in `tail`
   first runs `act` (synchronous, the bytes made beforehand), as a second Studio leading the same team writing the share between
   this publish's first read and its write of the edition. The archive's notes.md is written between the two. */
function meanwhile(tail, act) {
  const write = fs.writeFileSync;
  let done = false;
  fs.writeFileSync = function (at, ...rest) {
    if (!done && typeof at === "string" && at.endsWith(tail)) { done = true; fs.writeFileSync = write; act(write); }
    return write.call(fs, at, ...rest);
  };
  return () => { fs.writeFileSync = write; return done; };
}

/* ---- r2. A NEWER EDITION AT THE DESTINATION IS NEVER WRITTEN OVER BY A LOWER ONE (Grok's review 29, finding 2) ----------
   The next rev counted past the project's record and the archive, never the .ec it replaces, so a newer edition at that name
   (another Studio's of the same catalog, or a project record that lost a publish) was overwritten by a lower one. Now a
   publish counts past the destination's own rev too and says so, and where the destination moves on while the edition is
   being made, nothing is written and the next publish goes above it. */
async function legR2(cleanCsv, PASS) {
  const share = path.join(SCRATCH, "r2-share");
  const pR = await project("r2-project", cleanCsv, "r2-pile");
  const keyDoc = await makeKeyFile({ passphrase: PASS });
  const keyFile = path.join(SCRATCH, "r2-lead-key.json");
  fs.writeFileSync(keyFile, JSON.stringify(keyDoc, null, 1) + "\n");
  const first = await publishFull({ project: pR.dir, folder: share, key: keyFile, passphrase: PASS, now: "2026-11-15T09:00:00.000Z" });
  /* Another Studio's rev 5 of the same catalog, signed by the same lead, at the destination. */
  const newer = (rev) => {
    const doc = JSON.parse(fs.readFileSync(first.ec, "utf8"));
    doc.rev = rev;
    return JSON.stringify(doc, null, 1) + "\n";
  };
  fs.writeFileSync(first.ec, newer(5));
  let second = null, threw = "";
  try { second = await publishFull({ project: pR.dir, folder: share, key: keyFile, passphrase: PASS, now: "2026-11-15T10:00:00.000Z" }); }
  catch (e) { threw = e && e.message ? e.message : String(e); }
  const onDisk = JSON.parse(fs.readFileSync(first.ec, "utf8"));
  check(!threw && !!second && second.rev === 6 && onDisk.rev === 6 && second.folderNewer === 5,
    "r2a a publish over a newer edition of the same catalog at its name counts past it (rev 6 over rev 5, the project at 1) and says"
    + " the folder held rev 5; it is never written over by a lower rev: " + JSON.stringify([threw.slice(0, 80), second && second.rev, onDisk.rev, second && second.folderNewer]));
  /* The destination moves on to rev 9 while the edition is being made: nothing is written there, the archive takes nothing. */
  const editionsBefore = editionsIn(pR.dir).length;
  const undo = meanwhile(NOTES_IN_ARCHIVE, (write) => write(first.ec, newer(9)));
  let third = null, refused = "";
  try { third = await publishFull({ project: pR.dir, folder: share, key: keyFile, passphrase: PASS, now: "2026-11-15T11:00:00.000Z" }); }
  catch (e) { refused = e && e.message ? e.message : String(e); }
  const hooked = undo();
  const after = JSON.parse(fs.readFileSync(first.ec, "utf8"));
  check(hooked && !third && /rev 9/.test(refused) && after.rev === 9 && editionsIn(pR.dir).length === editionsBefore,
    "r2b where the destination moves to rev 9 while the edition (rev 7) is made, nothing is written there and the archive takes"
    + " nothing, and the refusal says so: " + JSON.stringify([hooked, third && third.rev, after.rev, refused.slice(0, 120)]));
  let fourth = null;
  try { fourth = await publishFull({ project: pR.dir, folder: share, key: keyFile, passphrase: PASS, now: "2026-11-15T12:00:00.000Z" }); }
  catch { fourth = null; }
  check(!!fourth && fourth.rev === 10 && JSON.parse(fs.readFileSync(first.ec, "utf8")).rev === 10,
    "r2c and the next publish goes above it, rev 10: " + (fourth && fourth.rev));
}

/* ---- s1. NO UNSIGNED EDITION AFTER SIGNED ONES (Grok's review mu, 2026-11-22, the second B) -------------------------------
   A signing key whose private half would not open reached the publisher as no key at all, and the edition went out unsigned over
   the signed ones, which every desk that trusts the lead refuses. Now a publish with no key, where the archive's last edition or
   the file it would replace was signed, is refused and writes nothing; the cover says so beforehand (publishPlan's
   signedBefore); and a first edition with no key publishes unsigned as it always did. */
async function legS1(cleanCsv, PASS) {
  const { publishPlan } = await import("../src/studio.mjs");
  const share = path.join(SCRATCH, "s1-share");
  const pS = await project("s1-project", cleanCsv, "s1-pile");
  const keyDoc = await makeKeyFile({ passphrase: PASS });
  const keyFile = path.join(SCRATCH, "s1-lead-key.json");
  fs.writeFileSync(keyFile, JSON.stringify(keyDoc, null, 1) + "\n");
  const planFirst = await publishPlan(pS.dir, { folder: share });
  const first = await publishFull({ project: pS.dir, folder: share, key: keyFile, passphrase: PASS, now: "2026-11-22T09:00:00.000Z" });
  const bytes = fs.readFileSync(first.ec), editions = editionsIn(pS.dir).length;
  const planAfter = await publishPlan(pS.dir, { folder: share });
  /* The key named for its public half only, as the screen names it when the private half will not open. */
  /* The screen's words are the refusal's frame (src/refusal.mjs); the Error's message is the command line's, which names --key. */
  let second = null, refused = "";
  try { second = await publishFull({ project: pS.dir, folder: share, leadKey: keyFile, now: "2026-11-22T10:00:00.000Z" }); }
  catch (e) { refused = e && e.said && e.said.frame ? e.said.frame : (e && e.message ? e.message : String(e)); }
  check(!!first.sig && !second && /earlier editions of this catalog were signed/i.test(refused) && /Settings, then Signing key/.test(refused)
        && Buffer.compare(fs.readFileSync(first.ec), bytes) === 0 && editionsIn(pS.dir).length === editions,
    "pbs1a with no key that opens, a publish after a signed edition is refused, saying where the key is restored, and the signed file"
    + " and the archive are as they were: " + JSON.stringify([!!first.sig, second && second.rev, refused.slice(0, 120)]));
  check(planFirst.signedBefore === false && planAfter.signedBefore === true,
    "pbs1b the cover's plan says whether an earlier edition was signed: none before the first, signed after it: "
    + JSON.stringify([planFirst.signedBefore, planAfter.signedBefore]));
  /* The same catalog's signed file in another project's folder: the file the publish would replace is signed, the archive empty. */
  const pT = await project("s1-other", cleanCsv, "s1-pile");
  let third = null, refusedT = "";
  try { third = await publishFull({ project: pT.dir, folder: share, now: "2026-11-22T11:00:00.000Z" }); }
  catch (e) { refusedT = e && e.message ? e.message : String(e); }
  check(!third && /earlier editions of this catalog were signed/i.test(refusedT) && Buffer.compare(fs.readFileSync(first.ec), bytes) === 0,
    "pbs1c where the file it would replace is signed, an unsigned publish is refused and that file stays: " + refusedT.slice(0, 100));
  /* CONTROL: a first edition with no key goes out unsigned, as before. */
  const pU = await project("s1-unsigned", cleanCsv, "s1-unsigned-pile");
  let plain = null, threw = "";
  try { plain = await publishFull({ project: pU.dir, folder: path.join(SCRATCH, "s1-plain-share"), now: "2026-11-22T12:00:00.000Z" }); }
  catch (e) { threw = e && e.message ? e.message : String(e); }
  let again = null;
  try { again = plain ? await publishFull({ project: pU.dir, folder: path.join(SCRATCH, "s1-plain-share"), now: "2026-11-22T13:00:00.000Z" }) : null; }
  catch (e) { threw = threw || (e && e.message ? e.message : String(e)); }
  check(!threw && !!plain && !plain.sig && !!again && again.rev === 2 && !again.sig,
    "pbs1d CONTROL: with no key and nothing signed before, a first edition and the next go out unsigned as before: " + threw.slice(0, 100));
}

/* ---- r1. NO SEAL IS WRITTEN UNDER AN EPOCH THE TEAM HAS MOVED PAST (Grok's review 29, finding 1) ------------------------
   The seal's epoch was chosen before the lint, the signature and the archive, and written at the end with no read between, so a
   second Studio's removal landing in between (the team file at epoch 2, the edition resealed) was written over by a seal under
   epoch 1, which the removed desk still opens. Now the team file is read again at the write, and a team moved on refuses it. */
async function legR1(cleanCsv, PASS) {
  const share = path.join(SCRATCH, "r1-share"), aside = path.join(SCRATCH, "r1-aside");
  fs.mkdirSync(share, { recursive: true }); fs.mkdirSync(aside, { recursive: true });
  const pR = await project("r1-project", cleanCsv, "r1-pile");
  const keyDoc = await makeKeyFile({ passphrase: PASS });
  const keyFile = path.join(SCRATCH, "r1-lead-key.json");
  fs.writeFileSync(keyFile, JSON.stringify(keyDoc, null, 1) + "\n");
  const team = T.newTeam({ id: "t-" + crypto.randomBytes(8).toString("hex"), catalogs: ["r1-pile"],
    lead: { keyId: keyDoc.keyId, public: keyDoc.public }, sealed: false });
  await T.writeTeam(share, team, { key: keyFile, passphrase: PASS });
  await T.writeTeam(share, Object.assign((await T.heldTeam(share, { key: keyFile })).team, { sealed: true }), { key: keyFile, passphrase: PASS });
  const K1 = crypto.randomBytes(32), S = Engine.sealRules();
  const first = await publishFull({ project: pR.dir, folder: share, key: keyFile, passphrase: PASS, now: "2026-11-15T09:00:00.000Z",
    teamKeys: { [team.id]: { 1: K1 } } });
  /* The other Studio's removal, made aside under its own copy of the lead's key (its own floor of the team, as another computer
     keeps): the team at epoch 2 under a new key, and the edition resealed under it. */
  const keyB = path.join(aside, "lead-key-b.json");
  fs.copyFileSync(keyFile, keyB);
  const held1 = (await T.heldTeam(share, { key: keyB })).team;
  const next = await T.newEpoch(held1, { key: keyB });
  fs.copyFileSync(path.join(share, "etiuda-team.json"), path.join(aside, "etiuda-team.json"));
  await T.writeTeam(aside, next.team, { key: keyB, passphrase: PASS });
  const team2 = fs.readFileSync(path.join(aside, "etiuda-team.json"));
  const clear1 = S.openSealed(K1, JSON.parse(fs.readFileSync(first.ec, "utf8")));
  const resealed = JSON.stringify(S.sealCatalog(next.teamKey, team.id, 2, clear1), null, 1) + "\n";
  const editionsBefore = editionsIn(pR.dir).length;
  const undo = meanwhile(NOTES_IN_ARCHIVE, (write) => {
    write(path.join(share, "etiuda-team.json"), team2);
    write(first.ec, resealed);
  });
  let second = null, refused = "";
  try { second = await publishFull({ project: pR.dir, folder: share, key: keyFile, passphrase: PASS, now: "2026-11-15T10:00:00.000Z",
    teamKeys: { [team.id]: { 1: K1 } } }); }
  catch (e) { refused = e && e.message ? e.message : String(e); }
  const hooked = undo();
  const env = JSON.parse(fs.readFileSync(first.ec, "utf8"));
  const oldOpens = S.openSealed(K1, env) !== null;
  check(hooked && !second && env.epoch === 2 && !oldOpens && editionsIn(pR.dir).length === editionsBefore && /key/.test(refused),
    "r1a a removal landing at epoch 2 while a publish sealed for epoch 1 is under way: nothing is written over the resealed edition, the"
    + " removed desk's epoch-1 key opens nothing there, the archive takes nothing, and the refusal says the team's key moved: "
    + JSON.stringify([hooked, second && second.rev, env.epoch, oldOpens, refused.slice(0, 400)]));
  let third = null;
  try { third = await publishFull({ project: pR.dir, folder: share, key: keyFile, passphrase: PASS, now: "2026-11-15T11:00:00.000Z",
    teamKeys: { [team.id]: { 1: K1, 2: next.teamKey } } }); }
  catch { third = null; }
  const env3 = third ? JSON.parse(fs.readFileSync(first.ec, "utf8")) : null;
  check(!!third && third.sealed && third.sealed.epoch === 2 && !!env3 && env3.epoch === 2 && S.openSealed(K1, env3) === null,
    "r1b and once the new key is held here the next publish seals under epoch 2: " + JSON.stringify(third && third.sealed));
}

/* ---- p1. THE OLDEST DESK READS WHAT THIS STUDIO WRITES (the version policy Max adopted 2026-11-01 01:27, point 1) ------
   The test architect's leg: "Studio main's published edition, team file and envelopes are read by the oldest supported
   desk, 2.0.0's readers as pinned in a fixture, with nothing refused and nothing shown as corrupt. A leg in Studio also
   refuses a raised minEngine that no feature asked for." The fixture is tools/engine-oldest, whose comment says why it
   names the commit it names; that commit's catalog-v2.js and shell/main.js are read out of the engine's object database
   and run as they stand. */
function oldestFixture() {
  const text = fs.readFileSync(path.join(ROOT, "tools", "engine-oldest"), "utf8");
  const val = (k) => { const m = new RegExp("^" + k + "=(\\S+)\\s*$", "m").exec(text); return m ? m[1] : ""; };
  return { commit: val("OLDEST_COMMIT"), version: val("OLDEST_VERSION") };
}
function oldestBlob(repo, commit, rel) {
  const r = gitText(repo, ["rev-parse", commit + ":" + rel]);
  if (r.status !== 0) throw new Error("the oldest desk's " + rel + " is not at " + commit + ": " + r.err);
  return blob(repo, r.out.trim()).toString("utf8");
}
async function legP1(cleanCsv, PASS) {
  const fix = oldestFixture();
  const repo = engineRepo({}).dir;
  const where = "the oldest desk " + fix.commit.slice(0, 8);
  const Old = await import("data:text/javascript;base64," + Buffer.from(oldestBlob(repo, fix.commit, "src/modules/catalog-v2.js")).toString("base64")
    + "#oldest-" + fix.commit.slice(0, 8));
  const oldShell = oldestBlob(repo, fix.commit, "shell/main.js");
  const OldSeal = Engine.sealRulesFrom(oldShell, where), OldStats = Engine.statsRulesFrom(oldShell, where);

  const share = path.join(SCRATCH, "oldest-share");
  fs.mkdirSync(share, { recursive: true });
  const pO = await project("oldest-project", cleanCsv, "oldest-desk");
  /* A draft that carries a raised minEngine of its own, as an import of a newer desk's file would: no feature asked for it. */
  const draftAt = path.join(pO.dir, DRAFT_FILE), draft = JSON.parse(fs.readFileSync(draftAt, "utf8"));
  draft.minEngine = "2.4.0";
  fs.writeFileSync(draftAt, JSON.stringify(draft, null, 1) + "\n");
  const keyDoc = await makeKeyFile({ passphrase: PASS });
  const keyFile = path.join(SCRATCH, "oldest-lead-key.json");
  fs.writeFileSync(keyFile, JSON.stringify(keyDoc, null, 1) + "\n");
  const team = T.newTeam({ id: "t-" + crypto.randomBytes(8).toString("hex"), catalogs: ["oldest-desk"],
    lead: { keyId: keyDoc.keyId, public: keyDoc.public }, sealed: false });
  await T.writeTeam(share, team, { key: keyFile, passphrase: PASS });
  const held = (await T.heldTeam(share, { key: keyFile })).team;
  await T.writeTeam(share, Object.assign(held, { sealed: true }), { key: keyFile, passphrase: PASS });
  const TK = crypto.randomBytes(32);
  const done = await publishFull({ project: pO.dir, folder: share, key: keyFile, passphrase: PASS, now: "2026-11-01T09:00:00.000Z",
    teamKeys: { [team.id]: { 1: TK } } });
  const archived = JSON.parse(fs.readFileSync(path.join(pO.dir, ARCHIVE, editionsIn(pO.dir).slice(-1)[0], CATALOG_IN_ARCHIVE), "utf8"));
  const open = unlockKey(readKeyFile(keyFile), PASS);
  writeSpan(share, "this-month", open, new Date(2026, 10, 1, 9, 0, 0));

  /* The edition, as the archive keeps it in the clear and as the share's envelope holds it. */
  const env = JSON.parse(fs.readFileSync(done.ec, "utf8"));
  const inner = OldSeal.openSealed(TK, env);
  let innerProblems = ["(did not open)"], innerRead = false;
  if (typeof inner === "string") {
    const doc = JSON.parse(inner);
    innerProblems = Old.v2Problems(doc);
    try { innerRead = !!Old.catalogFromV2(doc); } catch { innerRead = false; }
  }
  check(fix.commit.length === 40 && Old.isV2(archived) && Old.v2Problems(archived).length === 0 && innerRead
    && innerProblems.length === 0 && done.sealed && done.sealed.team === team.id,
    "p1a " + where + " opens the sealed edition this Studio published and reads it, the archive's copy and the envelope's, with"
    + " no problem: " + JSON.stringify({ archive: Old.v2Problems(archived), sealed: innerProblems, read: innerRead }));
  const teamText = fs.readFileSync(path.join(share, "etiuda-team.json"), "utf8");
  const teamRead = Old.v2TeamRead(teamText);
  const teamState = teamRead.team ? await Old.v2TeamSigState(teamRead.team) : null;
  check(!!teamRead.team && teamRead.problems.length === 0 && teamState === Old.V2_SIG_VALID,
    "p1b " + where + " reads the team file this Studio wrote and finds its signature valid: "
    + JSON.stringify({ problems: teamRead.problems, state: teamState }));
  const span = OldStats.spanDocument(fs.readFileSync(path.join(share, "stats-span.json"), "utf8"));
  check(!!span && OldStats.spanGenuine(span, { keyId: open.keyId, public: open.public }) && span.span === "this-month",
    "p1c " + where + " reads the statistics span this Studio signed as genuine: " + JSON.stringify(span && span.span));
  /* The sealed envelope is format 2 as the engine's own sealCatalog writes it and its openSealed asks for it, at the pin and
     at the oldest desk alike; the condition's "format 1" for it is Argon's reading, which the engine's text does not bear. */
  check(env.format === 2 && teamRead.team && teamRead.team.format === 1 && span && span.format === 1 && archived.format === 2,
    "p1d this Studio writes catalog format 2, format 1 for the team file and the span, and the sealed envelope in the format 2"
    + " the oldest desk's openSealed takes: "
    + JSON.stringify([archived.format, teamRead.team && teamRead.team.format, env.format, span && span.format]));
  check(archived.minEngine === fix.version && JSON.parse(inner || "{}").minEngine === fix.version,
    "p1e a draft carrying minEngine 2.4.0 with no feature asking for it publishes for " + fix.version + ", the oldest desk's"
    + " version, and not above it (red where the edition keeps the raised stamp): " + JSON.stringify(archived.minEngine));
}

async function main(argv) {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const F = await Engine.format();

  /* PUBLISH_ONLY=p1 runs section p1 alone, for p1p's scratch copy. */
  if (process.env.PUBLISH_ONLY === "p1") {
    await legP1(pile("clean", 7, 40, []), "a passphrase nobody uses twice");
    if (!argv.includes("--keep")) dropScratch(SCRATCH, "publish");
    process.stdout.write("publish-legs: " + asserted + " assertion(s), " + failed + " failure(s)\n");
    process.exit(failed ? 1 : 0);
  }

  /* PUBLISH_ONLY=r1 runs leg r1 alone, for r1p's scratch copy. */
  if (process.env.PUBLISH_ONLY === "r1") {
    await legR1(pile("clean", 7, 40, []), "a passphrase nobody uses twice");
    if (!argv.includes("--keep")) dropScratch(SCRATCH, "publish");
    process.stdout.write("publish-legs: " + asserted + " assertion(s), " + failed + " failure(s)\n");
    process.exit(failed ? 1 : 0);
  }

  /* PUBLISH_ONLY=r2 runs leg r2 alone, for r2p's scratch copy. */
  if (process.env.PUBLISH_ONLY === "r2") {
    await legR2(pile("clean", 7, 40, []), "a passphrase nobody uses twice");
    if (!argv.includes("--keep")) dropScratch(SCRATCH, "publish");
    process.stdout.write("publish-legs: " + asserted + " assertion(s), " + failed + " failure(s)\n");
    process.exit(failed ? 1 : 0);
  }

  /* PUBLISH_ONLY=s1 runs leg s1 alone, for s1p's scratch copy. */
  if (process.env.PUBLISH_ONLY === "s1") {
    await legS1(pile("clean", 7, 40, []), "a passphrase nobody uses twice");
    if (!argv.includes("--keep")) dropScratch(SCRATCH, "publish");
    process.stdout.write("publish-legs: " + asserted + " assertion(s), " + failed + " failure(s)\n");
    process.exit(failed ? 1 : 0);
  }

  /* PUBLISH_ONLY=9b runs leg 9b alone: 9p's scratch copies need only it, so the proof does not run the whole file twice. */
  if (process.env.PUBLISH_ONLY === "9b") {
    await leg9b(pile("clean", 7, 40, []), "a passphrase nobody uses twice");
    if (!argv.includes("--keep")) dropScratch(SCRATCH, "publish");
    process.stdout.write("publish-legs: " + asserted + " assertion(s), " + failed + " failure(s)\n");
    process.exit(failed ? 1 : 0);
  }

  /* ---- 1. THE REFUSAL, THE OVERRIDE, AND THE STATE THAT IS NEITHER ------------------------ */

  const plainCsv = pile("plain", 11, 40, []);
  /* Broken by spec 2.7's own rule - a card with no title and a card with no body in the PRIMARY
     language - rather than by a second language's absence, which is a state and not a fault
     since board 510. Two faults, so that a count reads as a count. */
  const broken = await project("broken", plainCsv, "broken-pile", null, (c) => {
    c.cards[2].title.en = "";
    c.cards[5].body.en = "";
  });
  const folder = path.join(SCRATCH, "broken-out");
  let refusal = null;
  try { await publishFull({ project: broken.dir, folder, now: CLOCK }); }
  catch (e) { refusal = e; }
  check(refusal && refusal.refusal === "lint" && refusal.lint.errors.length === 2
        && /2 error\(s\) and nothing was published/.test(refusal.message),
    "1a a catalog the pinned lint calls broken is refused, and the refusal says so ("
    + (refusal ? refusal.lint.errors.length : "none") + " error(s): "
    + (refusal ? JSON.stringify(refusal.lint.errors) : "") + ")");

  /* THE SECOND IMPLEMENTATION OF "WHAT THE ENGINE SAYS": the same document the publisher lints,
     built here by the publisher's own recipe (the draft with the revision and the edition on it
     and the hash recomputed last) and handed to the pinned lintCatalog directly. The edition
     under this clock over an empty archive is the one leg 2a asserts. */
  const brokenDoc = Object.assign({}, broken.catalog, { rev: 1, date: "2026-09-17" });
  delete brokenDoc.hash; delete brokenDoc.sig;
  brokenDoc.hash = F.contentHash(brokenDoc);
  const engineSaid = Engine.lint().lintCatalog(brokenDoc);
  check(refusal && refusal.lint.errors.slice().sort().join("|")
        === engineSaid.errors.slice().sort().join("|"),
    "1b and they are the ENGINE's own lines over that exact document, not a count of Studio's: "
    + engineSaid.errors.length + " line(s) either way");
  check(!fs.existsSync(folder) || !fs.readdirSync(folder).length,
    "1c and NOTHING was written: " + (fs.existsSync(folder)
      ? fs.readdirSync(folder).length + " file(s) in the out folder" : "no out folder at all"));
  check(!editionsIn(broken.dir).length,
    "1d and no edition was archived, so a refused publish does not spend one");

  const NOTE = "Two cards go out with a gap in the English while the desk waits on the vendor.";
  const forced = await publishFull({ project: broken.dir, folder, notes: "pilot", override: NOTE,
                                     now: CLOCK });
  check(fs.existsSync(forced.ec) && forced.rev === 1,
    "1e the override publishes it: rev " + forced.rev + ", " + path.basename(forced.ec));
  const forcedNotes = fs.readFileSync(forced.releaseNotes, "utf8");
  const forcedReport = JSON.parse(fs.readFileSync(path.join(forced.archive, REPORT_IN_ARCHIVE), "utf8"));
  const over = forced.lint.errors.length + " error(s)";
  check(forcedNotes.includes(NOTE) && forcedReport.override === NOTE
        && forcedNotes.includes("**Published over " + over + " on an override note.**"),
    "1f and the note is RECORDED in both the release notes and the archived report, naming what"
    + " it was published over (" + over + "), so the decision travels with the file rather than"
    + " living in somebody's memory");
  check(forcedReport.lint.errorLines.length === forced.lint.errors.length
        && forcedReport.lint.errorLines.join("") === forced.lint.errors.slice().sort().join(""),
    "1g with every error it went out over listed, not just counted ("
    + forcedReport.lint.errorLines.length + " error line(s))");

  /* 510: A ONE-LANGUAGE DRAFT PUBLISHES, AND THE FILE SAYS WHAT IT IS WAITING FOR. Maxim ruled
     it on 2026-09-18: the absence of a second language is a state, so it takes no override note
     and no tick, and the count per language is what travels instead. The pile is the same one
     with its Polish columns dropped at the door, which is the shape a vendor export arrives in.
     Asserted on either pin: where the engine has no awaiting class of its own the classifier
     asks it differentially, which is why the count below is the engine's either way. */
  const oneLang = await project("one-language", plainCsv, "one-language-pile",
                                { title_pl: null, body_pl: null });
  const oneFolder = path.join(SCRATCH, "one-language-out");
  const oneDone = await publishFull({ project: oneLang.dir, folder: oneFolder, notes: "pilot",
                                      now: CLOCK });
  check(fs.existsSync(oneDone.ec) && oneDone.rev === 1 && oneDone.lint.errors.length === 0
        && oneDone.awaiting.length === 1 && oneDone.awaiting[0].lang === "pl"
        && oneDone.awaiting[0].cards === oneLang.catalog.cards.length,
    "1h a draft carrying one language PUBLISHES with no note at all, and what it is waiting for"
    + " is counted per language [" + said({ errors: oneDone.lint.errors.length,
      awaiting: oneDone.awaiting }) + ", " + path.basename(oneDone.ec) + "]");
  const oneNotes = fs.readFileSync(oneDone.releaseNotes, "utf8");
  const oneReport = JSON.parse(fs.readFileSync(path.join(oneDone.archive, REPORT_IN_ARCHIVE), "utf8"));
  check(oneNotes.includes("1 language(s) awaiting text.")
        && oneNotes.includes("- awaiting: pl, " + oneLang.catalog.cards.length
                             + " card(s) lacking text")
        && oneNotes.indexOf("on an override note") < 0
        && oneReport.override === null
        && oneReport.lint.awaitingLines.length === 1,
    "1i and the archive note carries that count per language with no override anywhere in it, so"
    + " nobody reads the file as finished [" + JSON.stringify(oneReport.lint.awaitingLines) + "]");

  /* ---- 2. THE EDITION STAMP, AGAINST A FIXED CLOCK ----------------------------------------- */

  /* The rule itself first, driven directly under a clock of ours. The step is Studio's own
     (src/publish.mjs); today, the parts and the order are the pin's. */
  const rules = editionRules(CLOCK);
  const table = [["", "2026-09-17"], ["2026-09-17", "2026-09-17a"], ["2026-09-17a", "2026-09-17b"],
                 ["2026-09-17z", "2026-09-17aa"], ["2026-09-17zz", "2026-09-17aaa"],
                 ["2026-09-17az", "2026-09-17ba"], ["2026-09-20b", "2026-09-20c"],
                 [" 2026-09-17 ", "2026-09-17a"], ["2026-09-10c", "2026-09-17"],
                 ["2026-09-17A", "2026-09-17"], ["not a date", "2026-09-17"]];
  check(table.every(([from, to]) => rules.proposeEdition(from) === to),
    "2a the edition rule under our clock: "
    + table.map(([f, t]) => JSON.stringify(f) + "->" + rules.proposeEdition(f)).join(" "));
  /* THE STEP MUST BE THE ENGINE'S SUCCESSOR: a desk orders editions by catalogEditionOlder, so a
     step that skips a run or goes backwards publishes an edition a desk misorders. 702 steps from
     "a" must visit every one- and two-letter run once, each newer than the last on the pin. */
  const walk = ["a"];
  for (let i = 1; i < 26 + 26 * 26; i++) walk.push(rules.nextEditionLetters(walk[i - 1]));
  const day = (s) => "2026-09-17" + s;
  const newer = walk.every((s, i) => !i || rules.catalogEditionOlder(day(walk[i - 1]), day(s)));
  const runs = new Set(walk.filter(s => /^[a-z]{1,2}$/.test(s)));
  check(newer && runs.size === 702 && rules.nextEditionLetters(walk[701]) === "aaa",
    "2f each step is the next edition by the pinned engine's own order: " + runs.size
    + " of 702 short runs visited, every step newer " + newer + ", after \"" + walk[701]
    + "\" comes \"" + rules.nextEditionLetters(walk[701]) + "\"");
  check(stampEdition(rules, "2026-09-17", ["2026-09-17a", "2026-09-17b"]) === "2026-09-17c",
    "2b and an edition already in the archive is stepped over rather than written on ["
    + stampEdition(rules, "2026-09-17", ["2026-09-17a", "2026-09-17b"]) + "]");

  const cleanCsv = pile("clean", 7, 40, []);
  const p2 = await project("editions", cleanCsv, "edition-pile");
  const out2 = path.join(SCRATCH, "editions-out");
  const seq = [];
  let ec2At = "";
  for (let i = 0; i < 3; i++) {
    const done = await publishFull({ project: p2.dir, folder: out2, now: CLOCK });
    seq.push(done.edition); ec2At = done.ec;
  }
  check(seq.join(",") === "2026-09-17,2026-09-17a,2026-09-17b",
    "2c three publishes on one clock walk the day's letters: " + seq.join(", "));
  const proj2 = JSON.parse(fs.readFileSync(path.join(p2.dir, PROJECT_FILE), "utf8"));
  check(proj2.rev === 3 && proj2.edition === "2026-09-17b",
    "2d and the project record moved with them: rev " + proj2.rev + ", edition " + proj2.edition);
  const ec2 = JSON.parse(fs.readFileSync(ec2At, "utf8"));
  check(ec2.rev === 3 && ec2.date === "2026-09-17b" && ec2.hash === F.contentHash(
          Object.assign({}, ec2, { hash: undefined, sig: undefined })),
    "2e the .ec at the top carries the newest of them and its own content hash checks out ["
    + ec2.date + " rev " + ec2.rev + " " + ec2.hash + "]");

  /* ---- 3. THE ARCHIVE --------------------------------------------------------------------- */

  const have = editionsIn(p2.dir);
  check(have.join(",") === seq.join(","),
    "3a every edition is archived, in the engine's own order: " + have.join(", "));
  const wanted = [CATALOG_IN_ARCHIVE, NOTES_IN_ARCHIVE, RELEASE_IN_ARCHIVE, REPORT_IN_ARCHIVE];
  const missing = [];
  have.forEach(e => wanted.forEach(f => {
    if (!fs.existsSync(path.join(p2.dir, ARCHIVE, e, f))) missing.push(e + "/" + f);
  }));
  check(!missing.length, "3b each holds its catalog, its notes, its release notes and its report ("
    + have.length * wanted.length + " file(s), " + missing.length + " missing)");
  const first = archivedCatalog(p2.dir, have[0]);
  check(first.rev === 1 && first.date === have[0],
    "3c and an archived revision is still itself: " + have[0] + " holds rev " + first.rev);
  let blocked = null;
  try {
    fs.writeFileSync(path.join(p2.dir, PROJECT_FILE),
      JSON.stringify(Object.assign({}, proj2, { edition: "2026-09-16" }), null, 1));
    await publishFull({ project: p2.dir, folder: out2, now: CLOCK, archive: p2.dir });
  } catch (e) { blocked = e; }
  check(editionsIn(p2.dir).length === 4,
    "3d an archived edition is immutable: a publish whose project claims an older edition takes"
    + " the next free one rather than the taken one (" + editionsIn(p2.dir).join(", ") + ")");

  /* ---- 4. THE DIFF BETWEEN TWO REVISIONS --------------------------------------------------- */

  const p4 = await project("diffed", cleanCsv, "diff-pile");
  const out4 = path.join(SCRATCH, "diff-out");
  const a = await publishFull({ project: p4.dir, folder: out4, now: CLOCK });
  const draft = JSON.parse(fs.readFileSync(path.join(p4.dir, DRAFT_FILE), "utf8"));
  const shelves = draft.tags.filter(t => t.kind === "shelf");
  const movedId = draft.cards[0].id, changedId = draft.cards[1].id;
  const removedId = draft.cards[draft.cards.length - 1].id;
  const otherShelf = shelves.find(s => s.id !== draft.cards[0].shelf).id;
  draft.cards[0].shelf = otherShelf;
  draft.cards[1].body.en = draft.cards[1].body.en + " One more sentence.";
  draft.cards.pop();
  draft.cards.push({ id: "c-a-brand-new-card", shelf: shelves[0].id, bodyShape: "plain",
                     title: { en: "A brand new card", pl: "Nowa karta" },
                     body: { en: "Text of the new card.", pl: "Tekst nowej karty." } });
  fs.writeFileSync(path.join(p4.dir, DRAFT_FILE), JSON.stringify(draft, null, 1) + "\n");
  const b = await publishFull({ project: p4.dir, folder: out4, now: CLOCK });

  const d = diffCatalogs(archivedCatalog(p4.dir, a.edition), archivedCatalog(p4.dir, b.edition),
                         F.canonical);
  check(d.cards.added.map(c => c.id).join() === "c-a-brand-new-card"
        && d.cards.removed.map(c => c.id).join() === removedId,
    "4a the diff names the one card added and the one removed, by id [+"
    + d.cards.added.map(c => c.id).join() + " -" + d.cards.removed.map(c => c.id).join() + "]");
  check(d.cards.moved.length === 1 && d.cards.moved[0].id === movedId
        && d.cards.moved[0].to === otherShelf,
    "4b a card that changed shelf is called MOVED separately, because that is the change an"
    + " author most often makes by accident [" + movedId + " -> " + otherShelf + "]");
  check(d.cards.changed.some(c => c.id === changedId
          && c.fields.some(f => f.path === "body.en")),
    "4c an edited body is one row naming the field path, not a replaced card [body.en on "
    + changedId + "]");
  check(d.header.some(h => h.field === "rev") && d.header.some(h => h.field === "date")
        && !d.header.some(h => h.field === "hash"),
    "4d the header rows are rev and date and NOT hash, which is derived from everything the"
    + " rest of the report has just listed [" + d.header.map(h => h.field).join(" ") + "]");
  const same = diffCatalogs(archivedCatalog(p4.dir, a.edition), archivedCatalog(p4.dir, a.edition),
                            F.canonical);
  check(same.same, "4e and a revision against itself is identical, so the rule is not simply"
    + " always finding something");

  const cli = spawnSync(process.execPath, ["tools/diff.mjs", p4.dir, a.edition, b.edition, "--paths"],
    { cwd: ROOT, encoding: "utf8" });
  check(cli.status === 1 && /added   card c-a-brand-new-card/.test(cli.stdout)
        && /moved   card/.test(cli.stdout) && !/One more sentence/.test(cli.stdout),
    "4f node tools/diff.mjs <project> <a> <b> --paths prints the same findings and none of the"
    + " words, exit " + cli.status + " (" + cli.stdout.trim().split("\n").length + " lines)");
  const withValues = spawnSync(process.execPath, ["tools/diff.mjs", p4.dir, a.edition, b.edition],
    { cwd: ROOT, encoding: "utf8" });
  check(/One more sentence/.test(withValues.stdout),
    "4g and without --paths it shows what the text became, which is what makes it reviewable");

  /* ---- 5. DETERMINISM --------------------------------------------------------------------- */

  /* Two independent copies of one project, one clock. Publishing the SAME project twice is a
     second revision by design, so copying is the only honest way to ask this question. Each copy
     keeps the folder's name, which is the project's, and the release notes are headed by it. */
  const src = path.join(SCRATCH, "det-src");
  const one = path.join(SCRATCH, "det-1", "det"), two = path.join(SCRATCH, "det-2", "det");
  const p5 = await project("det-src", cleanCsv, "det-pile");
  copyTree(src, one); copyTree(src, two);
  const r1 = await publishFull({ project: one, folder: path.join(one, "out"), now: CLOCK,
                                 notes: "the same notes" });
  const r2 = await publishFull({ project: two, folder: path.join(two, "out"), now: CLOCK,
                                 notes: "the same notes" });
  const bytes = f => fs.readFileSync(f);
  check(bytes(r1.ec).equals(bytes(r2.ec)),
    "5a the same project published twice on the same clock gives the same .ec BYTES ("
    + bytes(r1.ec).length + " bytes, sha of neither needed: Buffer.equals)");
  check(bytes(r1.releaseNotes).equals(bytes(r2.releaseNotes)),
    "5b and the same release notes, so nothing written carries a timestamp or a run id");
  check(r1.edition === r2.edition && r1.rev === r2.rev && r1.report.hash === r2.report.hash,
    "5c on the same edition " + r1.edition + ", rev " + r1.rev + ", hash " + r1.report.hash);
  const later = editionRules("2026-09-18T09:00:00");
  check(later.proposeEdition("") === "2026-09-18",
    "5d and the clock is the ONLY thing that moves it: the same call a day later reads "
    + later.proposeEdition(""));
  void p5;

  /* ---- 6. THE GATE'S OWN CONTRACT ---------------------------------------------------------- */

  /* publish({csv, folder}) is what tests/round-trip.mjs calls, and it must return a path
     PRIMITIVE: node's own path validation rejects a String object, and the gate hands the
     return value straight to fs.existsSync. */
  const mod = await import(pathToFileURL(path.join(ROOT, "src", "publish.mjs")).href);
  const gateOut = path.join(SCRATCH, "gate-out");
  const gateEc = await mod.publish({ csv: cleanCsv, folder: gateOut });
  check(typeof gateEc === "string" && fs.existsSync(gateEc),
    "6a publish({csv,folder}) returns a string primitive the gate can hand to fs.existsSync ["
    + typeof gateEc + "]");
  check(fs.readdirSync(gateOut).filter(n => /\.ec$/i.test(n)).length === 1,
    "6b and leaves exactly one .ec in the folder the desk will read, nothing else it can list ("
    + fs.readdirSync(gateOut).join(", ") + ")");
  check(fs.existsSync(path.join(gateOut, ".studio", ARCHIVE)),
    "6c with the archive under a dot-folder the shell's own listing cannot see: it filters"
    + " *.ec in the folder itself and does not recurse (shell/main.js ecFilesIn)");

  /* ---- 7. THE LEAD'S NOTE GOES INTO THE EDITION (C08, Studio's half) ------------------------ */

  /* The engine's own v2Problems and content hash, run from the pinned text rather than restated.
     The module has no imports of its own, and this tree is CommonJS, so the text is taken whole
     without its export line (as src/engine.mjs does for the body tools). */
  const V2 = new Function(fs.readFileSync(path.join(ROOT, "engine", "pinned", "src", "modules",
    "catalog-v2.js"), "utf8").replace(/\nexport \{[\s\S]*$/, "\n")
    + "\nreturn { v2Problems, v2ContentHash };")();
  const NOTE_EN = "  The first card now carries the new greeting.  ";
  const NOTE_PL = "Pierwsza karta ma teraz nowe powitanie.";
  const PASS = "a passphrase nobody uses twice";
  const leadSrc = await project("lead-src", cleanCsv, "lead-pile");
  const codes = leadSrc.catalog.langs.map(l => l.code);
  const lead = (name) => {
    const d = path.join(SCRATCH, name, "lead");
    copyTree(path.join(SCRATCH, "lead-src"), d);
    return d;
  };
  const read = f => JSON.parse(fs.readFileSync(f, "utf8"));

  const withNote = lead("lead-a");
  const gotNote = await publishFull({ project: withNote, folder: path.join(withNote, "out"),
    now: CLOCK, notes: "archive words", leadNotes: { en: NOTE_EN, pl: NOTE_PL } });
  const onDisk = read(gotNote.ec);
  check(codes.join(",") === "en,pl" && onDisk.notes && onDisk.notes.en === NOTE_EN.trim()
        && onDisk.notes.pl === NOTE_PL && Object.keys(onDisk.notes).join(",") === "en,pl",
    "7a publishing with a note per language writes both into the edition, trimmed, in the"
    + " catalog's own order [" + JSON.stringify(onDisk.notes) + "]");
  const archived = read(path.join(gotNote.archive, CATALOG_IN_ARCHIVE));
  check(!!archived.notes && JSON.stringify(archived.notes) === JSON.stringify(onDisk.notes)
        && archived.hash === onDisk.hash,
    "7b and the archived copy is the same document, so the archive and the share cannot differ"
    + " on what the desks were told");
  const problems = V2.v2Problems(onDisk);
  check(!!onDisk.notes && problems.length === 0 && V2.v2ContentHash(onDisk) === onDisk.hash,
    "7c the pinned engine's v2Problems finds nothing in it and its content hash is the file's own"
    + " (" + problems.length + " problem(s)" + (problems.length ? ": " + problems.join(" | ") : "") + ")");
  /* The control that 7c can fail: the same reader refuses a note in a language the catalog does
     not declare, so a clean answer above is the reader looking and finding nothing. */
  const stray = JSON.parse(JSON.stringify(onDisk));
  stray.notes = Object.assign({}, stray.notes, { xx: "a stray" });
  check(V2.v2Problems(stray).some(m => /^notes\.xx: a language this catalog does not declare/.test(m)),
    "7d and that same v2Problems does refuse a note in an undeclared language ["
    + V2.v2Problems(stray).join(" | ") + "]");
  const archNotes = fs.readFileSync(path.join(gotNote.archive, NOTES_IN_ARCHIVE), "utf8");
  check(archNotes === "archive words\n" && !archNotes.includes(NOTE_PL),
    "7e the archive's notes.md is still the author's account and carries none of the lead's note");

  /* THE SIGNATURE COVERS THE NOTE. A key signs the finished document, so a note written before
     the signature verifies, and one letter of it changed afterwards does not. */
  const keyDoc = await makeKeyFile({ passphrase: PASS });
  const keyAt = path.join(SCRATCH, "lead-key.json");
  fs.writeFileSync(keyAt, JSON.stringify(keyDoc, null, 1) + "\n", "utf8");
  const open = unlockKey(readKeyFile(keyAt), PASS);
  const signedDir = lead("lead-signed");
  const gotSigned = await publishFull({ project: signedDir, folder: path.join(signedDir, "out"),
    now: CLOCK, key: keyAt, passphrase: PASS, leadNotes: { en: NOTE_EN, pl: NOTE_PL } });
  const SG = Engine.sigRules();
  const signedDoc = read(gotSigned.ec);
  const ringFor = (id) => ({ [id]: { [open.keyId]: open.public } });
  const stValid = await SG.v2SigState(signedDoc, ringFor(signedDoc.id));
  check(stValid === SG.states.valid && V2.v2Problems(signedDoc).length === 0
        && signedDoc.notes && signedDoc.notes.pl === NOTE_PL,
    "7f a signed publish with notes verifies VALID through the engine's own v2SigState, with"
    + " v2Problems still clean [" + stValid + "]");
  const bentDoc = JSON.parse(JSON.stringify(signedDoc));
  bentDoc.notes = Object.assign({}, bentDoc.notes);
  bentDoc.notes.pl = String(bentDoc.notes.pl).replace("Pierwsza", "Pierwsze");
  const stBent = await SG.v2SigState(bentDoc, ringFor(bentDoc.id));
  check(!!signedDoc.notes && stBent === SG.states.invalid,
    "7g and one letter of the note changed afterwards reads INVALID, so the signature does cover"
    + " it [" + stBent + "]");
  const bentMark = JSON.parse(JSON.stringify(signedDoc));
  bentMark.evaluation = "newer";
  const stMark = await SG.v2SigState(bentMark, ringFor(bentMark.id));
  check(!("evaluation" in signedDoc) && stMark === SG.states.invalid,
    "7g2 a publish writes no evaluation field, and adding one afterwards"
    + " reads INVALID, so the signature covers every key [" + stMark + ", field "
    + JSON.stringify(signedDoc.evaluation) + "]");

  /* THE CONTROL: NO NOTE, THE SAME FILE. Nothing given, an empty table, and a table of blanks
     all publish the same bytes, and those bytes carry no notes key. Against a note, the only
     things that move are the key and the hash that covers it. */
  const noneDir = lead("lead-none"), emptyDir = lead("lead-empty"), blankDir = lead("lead-blank");
  const gotNone = await publishFull({ project: noneDir, folder: path.join(noneDir, "out"),
    now: CLOCK, notes: "archive words" });
  const gotEmpty = await publishFull({ project: emptyDir, folder: path.join(emptyDir, "out"),
    now: CLOCK, notes: "archive words", leadNotes: {} });
  const gotBlank = await publishFull({ project: blankDir, folder: path.join(blankDir, "out"),
    now: CLOCK, notes: "archive words", leadNotes: { en: "   ", pl: "" } });
  const bytesOf = r => fs.readFileSync(r.ec);
  check(bytesOf(gotNone).equals(bytesOf(gotEmpty)) && bytesOf(gotNone).equals(bytesOf(gotBlank))
        && !("notes" in read(gotNone.ec)),
    "7h a publish with no note, an empty table or a table of blanks gives the SAME .ec bytes ("
    + bytesOf(gotNone).length + "), and none of them carries a notes key");
  const minus = JSON.parse(JSON.stringify(onDisk));
  delete minus.notes; delete minus.hash;
  minus.hash = F.contentHash(minus);
  check(JSON.stringify(minus) === JSON.stringify(read(gotNone.ec)),
    "7i and the noted edition, with its notes taken out and the hash recomputed, is the plain"
    + " edition field for field: the note is the only thing the option changed");
  let undeclared = null;
  const badOut = path.join(SCRATCH, "lead-bad-out");
  try { await publishFull({ project: lead("lead-bad"), folder: badOut, now: CLOCK,
                            leadNotes: { en: "x", de: "y" } }); }
  catch (e) { undeclared = e; }
  check(undeclared && /does not declare/.test(undeclared.message) && !fs.existsSync(badOut),
    "7j a note in a language the catalog does not declare is refused before anything is written ["
    + (undeclared ? undeclared.message : "published") + "]");

  /* THE COVER: one box per declared language, and Publish hands the page's note to the verb as a
     table. Run on the page's own code over a stand-in DOM (tests/page-stand-in.mjs), reading
     markup and the arguments of the call; the real window is the publish screen leg's. */
  const coverDir = lead("lead-cover");
  const plan = JSON.parse(JSON.stringify(await Studio.publishPlan(coverDir)));
  const asked = [];
  const stub = { publish: (dir, o) => { asked.push(o); return Promise.resolve({ error: "stopped here" }); } };
  const pg = loadPage({ api: stub, uiLang: "en" });
  const opened = JSON.parse(JSON.stringify(await Studio.openProject(coverDir)));
  Object.assign(pg.page.S, { open: opened, plan, cover: "publish", screen: "project",
                             section: "cards", lang: "en" });
  pg.page.paint();
  const dlg = pg.node("#dlg").innerHTML;
  check((plan.langs || []).join(",") === "en,pl" && dlg.includes('id="leadNote-en"')
        && dlg.includes('id="leadNote-pl"') && (dlg.match(/data-lead="/g) || []).length === 2
        && dlg.includes('id="notes"'),
    "7k the cover paints one note box per declared language beside the archive's Notes box ["
    + (dlg.match(/id="leadNote-[a-z-]+"/g) || []).join(", ") + "]");
  pg.node("#notes").value = "archive words";
  pg.node("#leadNote-en").value = "  " + NOTE_EN + "  ";
  pg.node("#leadNote-pl").value = "";
  await pg.page.ACTS["do-publish"]({ getAttribute: () => null });
  check(asked.length === 1 && asked[0].notes === "archive words"
        && JSON.stringify(asked[0].leadNotes) === JSON.stringify({ en: NOTE_EN.trim() }),
    "7l Publish hands the verb the filled box as a table and leaves the blank one out ["
    + JSON.stringify(asked[0] && asked[0].leadNotes) + "]");
  pg.node("#leadNote-en").value = "";
  await pg.page.ACTS["do-publish"]({ getAttribute: () => null });
  check(asked.length === 2 && asked[1].leadNotes === undefined,
    "7m and with every box blank it hands over no table at all");

  /* THE SCREEN'S VERB CARRIES IT: publishProject is what the shell calls for the page, and it
     must pass the table on to the publisher rather than drop it. */
  const verbDir = lead("lead-verb");
  const viaVerb = await Studio.publishProject(verbDir, { folder: path.join(verbDir, "out"),
    now: CLOCK, notes: "archive words", leadNotes: { en: NOTE_EN, pl: NOTE_PL } });
  const verbDoc = read(viaVerb.ec);
  check(!!verbDoc.notes && verbDoc.notes.en === NOTE_EN.trim() && verbDoc.notes.pl === NOTE_PL
        && V2.v2Problems(verbDoc).length === 0,
    "7n and Studio.publishProject, the verb the window calls, writes the same note into the edition ["
    + JSON.stringify(verbDoc.notes) + "]");
  /* THE SCREEN'S VERB SIGNS (publish-screen-never-signs, the Studio batch of 2026-10-12): handed the key and its secret, as
     the shell now hands them, publishProject passes both to the publisher, whose signature verifies against the key; 7n's
     edition, published with neither, carries none. */
  const signVerbDir = lead("lead-verb-signed");
  const viaSigned = await Studio.publishProject(signVerbDir, { folder: path.join(signVerbDir, "out"), now: CLOCK,
    key: keyAt, passphrase: PASS });
  const verbSigned = read(viaSigned.ec);
  check(verbSigned.sig && verbSigned.sig.keyId === open.keyId && !verbDoc.sig
        && await Engine.sigRules().v2SigState(verbSigned, { [verbSigned.id]: { [open.keyId]: open.public } }) === Engine.sigRules().states.valid,
    "7n2 Studio.publishProject handed the key and its secret signs the edition, and the signature verifies; 7n's carries none");

  /* AN OLDER NOTE IN THE DRAFT (14i, the lead engineer's to decide): a draft can carry a `notes` table it did not get
     from this cover, one a review brought in, and the cover shows no such note. A publish with no note sends none. */
  const olderNote = (name) => {
    const d = lead(name), at = path.join(d, DRAFT_FILE), draft = read(at);
    draft.notes = { en: "An older note nobody wrote for this edition.", pl: "Starsza notka, nie do tego wydania." };
    fs.writeFileSync(at, JSON.stringify(draft, null, 1) + "\n");
    return d;
  };
  const oldDir = olderNote("lead-older");
  const gotOld = await publishFull({ project: oldDir, folder: path.join(oldDir, "out"), now: CLOCK, notes: "archive words" });
  check(!("notes" in read(gotOld.ec)) && bytesOf(gotOld).equals(bytesOf(gotNone)),
    "7o a draft carrying an older note, published with none, gives an edition with no notes key, byte for byte the"
    + " edition of the same draft without that note [" + JSON.stringify(read(gotOld.ec).notes || null) + "]");
  const newDir = olderNote("lead-newer");
  const gotNew = await publishFull({ project: newDir, folder: path.join(newDir, "out"), now: CLOCK,
    notes: "archive words", leadNotes: { en: NOTE_EN } });
  check(JSON.stringify(read(gotNew.ec).notes) === JSON.stringify({ en: NOTE_EN.trim() }),
    "7p CONTROL: published with a note, the edition carries that note alone, nothing of the older one ["
    + JSON.stringify(read(gotNew.ec).notes) + "]");

  /* ---- 8. THE COUNTS ARE THE DESK'S (board 858, P5) ----------------------------------------
   * The release notes say how many macros, intents and categories the edition carries, and the
   * desk's Library row says the same of the file. The desk counts a macro per BODY BLOCK, a steps
   * or alts body splitting by its markers and paragraphs (the pinned shell's ecCounts and
   * ecBlocks); the publisher counted one per card. The oracle is sliced here from the pinned
   * shell/main.js, not asked of the publisher, and read over the file the publisher wrote. */
  {
    const shellSrc = fs.readFileSync(path.join(ROOT, "engine", "pinned", "shell", "main.js"), "utf8");
    const decl = (m) => {
      const i = shellSrc.indexOf(m);
      if (i < 0) throw new Error("the pinned shell has no " + m);
      if (!m.startsWith("function")) return shellSrc.slice(i, shellSrc.indexOf("\n", i));
      for (let k = shellSrc.indexOf("{", i), depth = 0; k < shellSrc.length; k++) {
        if (shellSrc[k] === "{") depth++;
        else if (shellSrc[k] === "}" && !--depth) return shellSrc.slice(i, k + 1);
      }
      throw new Error("no end to " + m);
    };
    const desk = new Function([decl("const EC_MARKER ="), decl("function ecBlocks("), decl("function ecCounts(")]
      .join("\n") + "\nreturn ecCounts;")();
    const counted = async (name, shape, edit, override) => {
      const p = await project(name, cleanCsv, name + "-pile");
      const at = path.join(p.dir, DRAFT_FILE), dr = JSON.parse(fs.readFileSync(at, "utf8"));
      if (shape) Object.assign(dr.cards[0], shape);
      if (edit) edit(dr);
      fs.writeFileSync(at, JSON.stringify(dr, null, 1) + "\n");
      const got = await publishFull({ project: p.dir, folder: path.join(p.dir, "out"), now: CLOCK, override });
      const n = desk(read(got.ec));
      const notes = fs.readFileSync(path.join(got.archive, RELEASE_IN_ARCHIVE), "utf8");
      const said = (w) => +((new RegExp("^- (\\d+) " + w + "$", "m").exec(notes) || [])[1]);
      return { counts: got.counts, desk: { macros: n.macros, intents: n.intents, cats: n.cats },
               said: { macros: said("macros"), intents: said("intents"), cats: said("categories") } };
    };
    const agree = (r) => ["macros", "intents", "cats"].every(k => r.counts[k] === r.desk[k] && r.said[k] === r.desk[k]);
    const plain = await counted("counts-plain", null);
    check(agree(plain), "8a CONTROL: an edition of plain cards counts as the desk counts it, in the result and the"
      + " release notes: " + JSON.stringify(plain));
    const two = (a, b) => "[step]\n" + a + "\n[step]\n" + b;
    const steps = await counted("counts-steps", { bodyShape: "steps",
      body: { en: two("Check the order.", "Send the note."), pl: two("Sprawdź zamówienie.", "Wyślij notkę.") } });
    check(agree(steps) && steps.desk.macros === plain.desk.macros + 1,
      "8b a two-step card is two macros, in the result and the release notes, as the desk's row says: "
      + JSON.stringify(steps));
    /* The desk offers intents only where a request has a clause in the primary language, and counts none
       otherwise; every request in the fixture has one, so 8a and 8b cannot tell that rule from a tag count
       (the test architect's read of 2026-10-07). Here no request keeps its primary clause; the lint refuses each, so it
       goes out over them on a note, as such a file can. */
    const noClause = await counted("counts-no-clause", null, (dr) => {
      const code = dr.langs[0].code;
      (dr.tags || []).filter(t => t.kind === "request").forEach(t => { if (t.clause) delete t.clause[code]; });
    }, NOTE);
    check(agree(noClause) && noClause.desk.intents === 0 && plain.desk.intents > 0,
      "8c with no request clause in the primary language, no intents, in the result and the release notes, as the"
      + " desk's row says, where the same project with its clauses has " + plain.desk.intents + ": " + JSON.stringify(noClause));
  }

  /* ---- 9. FOLDER TEAM: NO EMBEDDED RING AND NO HEAD ON PUBLISH (was: EMBEDDED RING AND SIGNED HEAD ON PUBLISH, board 945 item 6) --------
     Studio writes neither at a shared folder now (the folder team's removal, Max, 2026-11-22 15:37): the ring file lands beside the catalog
     as at any folder, and the team file and the head are left alone. 9a3, 9a6, 9a7 and 9a11 are the old claims turned over; 9a8 and 9a9, which
     read the head's shape and signature, are retired with the head (the relay runner writes the relay's, and its tests hold it). */
  {
    const teamFolderShare = path.join(SCRATCH, "team-folder-share");
    fs.mkdirSync(teamFolderShare, { recursive: true });
    const pTeam = await project("team-folder-project", cleanCsv, "pilot-team");
    const pTeamKey = await makeKeyFile({ passphrase: PASS });
    const pTeamKeyFile = path.join(SCRATCH, "pilot-lead-key.json");
    fs.writeFileSync(pTeamKeyFile, JSON.stringify(pTeamKey, null, 1) + "\n");
    const teamId = "t-" + crypto.randomBytes(8).toString("hex");
    const teamInit = T.newTeam({
      id: teamId,
      catalogs: ["pilot-team"],
      lead: { keyId: pTeamKey.keyId, public: pTeamKey.public },
      sealed: false,
    });
    await T.writeTeam(teamFolderShare, teamInit, { key: pTeamKeyFile, passphrase: PASS });
    const initialTeam = (await T.heldTeam(teamFolderShare, { key: pTeamKeyFile })).team;
    check(initialTeam && initialTeam.ring === undefined,
      "9a0 initial folder team has no embedded ring");
    check(!fs.existsSync(path.join(teamFolderShare, "etiuda-head.json")),
      "9a1 initial folder share has no etiuda-head.json");

    // Publish to this folder with key and passphrase
    const teamBeforeText = fs.readFileSync(path.join(teamFolderShare, "etiuda-team.json"), "utf8");
    const pubRes = await publishFull({
      project: pTeam.dir,
      folder: teamFolderShare,
      key: pTeamKeyFile,
      passphrase: PASS,
      now: "2026-10-29T10:00:00.000Z",
    });

    const shareTeamFile = path.join(teamFolderShare, "etiuda-team.json");
    const shareHeadFile = path.join(teamFolderShare, "etiuda-head.json");
    const shareRingFile = path.join(teamFolderShare, "etiuda-ring.json");

    check(fs.existsSync(shareRingFile), "9a2 etiuda-ring.json is written beside the catalog");

    const looseRingDoc = JSON.parse(fs.readFileSync(shareRingFile, "utf8").replace(/^\uFEFF/, ""));
    const teamAfterText = fs.readFileSync(shareTeamFile, "utf8");
    const teamAfterDoc = JSON.parse(teamAfterText.replace(/^\uFEFF/, ""));
    const teamEngineRead = Engine.teamRules().v2TeamRead(teamAfterText);
    const teamSigState = await Engine.teamRules().v2TeamSigState(teamEngineRead.team);

    check(teamAfterText === teamBeforeText && teamAfterDoc.ring === undefined,
      "9a3 folder publish leaves etiuda-team.json as it was, with no ring embedded (was: it embedded the ring, matching etiuda-ring.json)");
    check(!!teamEngineRead.team && teamEngineRead.problems.length === 0,
      "9a4 engine v2TeamRead accepts the folder team file with no problems");
    check(teamSigState === Engine.teamRules().states.valid,
      "9a5 engine v2TeamSigState validates the folder team file");

    const engChannelPath = path.resolve(ROOT, "..", "eng-f6", "shell", "relay", "channel.cjs");
    const Ch = fs.existsSync(engChannelPath) ? (await import("node:module")).createRequire(import.meta.url)(engChannelPath) : Engine.relayRules().channel;
    const ChProg = Ch.createProgram({ pin: { teamId, keyId: pTeamKey.keyId, public: pTeamKey.public } });
    const chReadRing = ChProg.readRing({ teamDoc: teamAfterDoc, looseRing: looseRingDoc });
    check(chReadRing.source === "loose" && JSON.stringify(chReadRing.ring) === JSON.stringify(looseRingDoc),
      "9a6 channel readRing reads the loose ring where the folder team file embeds none: " + chReadRing.source + " (was: it accepted the embedded ring)");

    check(!fs.existsSync(shareHeadFile), "9a7 folder publish writes no etiuda-head.json (was: it wrote one)");

    // Second publish: publish rev 2 with the same key
    const rev1TeamRev = teamAfterDoc.rev;
    await publishFull({
      project: pTeam.dir,
      folder: teamFolderShare,
      key: pTeamKeyFile,
      passphrase: PASS,
      now: "2026-10-29T11:00:00.000Z",
    });

    const teamAfter2Text = fs.readFileSync(shareTeamFile, "utf8");
    const teamAfter2Doc = JSON.parse(teamAfter2Text.replace(/^\uFEFF/, ""));
    check(teamAfter2Doc.rev === rev1TeamRev,
      "9a10 second publish with unchanged ring leaves team rev unchanged: " + teamAfter2Doc.rev);

    check(!fs.existsSync(shareHeadFile),
      "9a11 second publish writes no etiuda-head.json either (was: it updated the head to rev 2 with the new edition time)");
  }

  await leg9b(cleanCsv, PASS);
  await legP1(cleanCsv, PASS);
  await legR2(cleanCsv, PASS);
  await legS1(cleanCsv, PASS);
  await legR1(cleanCsv, PASS);

  /* The plants of r2, in a scratch copy and never in this checkout: the destination's rev not read turns r2a red, and the read
     at the write dropped turns r2b red. */
  if (PLANTS_OFF) {
    skip("r2p the plants of r2a and r2b (plants off)");
  } else {
    const { plantsTree, treeSha, dropPlantsTree } = await import("./plants-tree.mjs");
    const sha = () => crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, "src", "publish.mjs"))).digest("hex");
    const before = treeSha(ROOT), want = sha(), copy = plantsTree(ROOT, "publish-r2");
    const got = {};
    try {
      const at = path.join(copy, "src", "publish.mjs"), buf = fs.readFileSync(at), text = buf.toString("utf8");
      const nl = text.indexOf("\r\n") >= 0 ? "\r\n" : "\n", lines = text.split(nl);
      for (const [mark, swap, red] of [["/* plant:r2-dest-rev */", "  const atRev = 0;", "r2a"], ["/* plant:r2-moved-on */", "", "r2b"]]) {
        const hits = lines.filter((l) => l.indexOf(mark) >= 0).length;
        if (hits !== 1) { got[red] = "mark on " + hits + " lines"; continue; }
        fs.writeFileSync(at, lines.map((l) => (l.indexOf(mark) >= 0 ? swap : l)).join(nl));
        const child = spawnSync(process.execPath, [path.join(copy, "tests", "publish.mjs")], { cwd: copy, encoding: "utf8", timeout: 240000,
          env: Object.assign({}, process.env, { PUBLISH_NO_PLANTS: "1", PUBLISH_ONLY: "r2" }) });
        const said = String(child.stdout || "") + String(child.stderr || "");
        got[red] = new RegExp("FAIL " + red).test(said) ? "red" : "green: " + said.slice(0, 300);
        fs.writeFileSync(at, buf);
      }
    } finally { dropPlantsTree(copy, ROOT); }
    check(got.r2a === "red" && got.r2b === "red" && sha() === want && treeSha(ROOT) === before,
      "r2p the destination's rev not read turns r2a red, the read at the write dropped turns r2b red, and this checkout is unchanged: "
      + JSON.stringify(got));
  }

  /* The plants of s1, in a scratch copy and never in this checkout: the publisher's refusal lifted turns pbs1a and pbs1c red, and
     the plan's reading lifted turns pbs1b red. */
  if (PLANTS_OFF) {
    skip("s1p the plants of pbs1a, pbs1b and pbs1c (plants off)");
  } else {
    const { plantsTree, treeSha, dropPlantsTree } = await import("./plants-tree.mjs");
    const files = ["src/publish.mjs", "src/studio.mjs"];
    const shaOf = () => files.map((f) => crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, f))).digest("hex")).join(",");
    const before = treeSha(ROOT), want = shaOf(), copy = plantsTree(ROOT, "publish-s1");
    const got = {};
    try {
      for (const [file, mark, swap, reds, greens] of [
        ["src/publish.mjs", "/* plant:s1-signed-before */", "  ;", ["pbs1a", "pbs1c"], ["pbs1b", "pbs1d"]],
        ["src/studio.mjs", "/* plant:s1-plan */", "    signedBefore: false,", ["pbs1b"], ["pbs1a", "pbs1c", "pbs1d"]]]) {
        const at = path.join(copy, file), buf = fs.readFileSync(at), text = buf.toString("utf8");
        const nl = text.indexOf("\r\n") >= 0 ? "\r\n" : "\n", lines = text.split(nl);
        const hits = lines.filter((l) => l.indexOf(mark) >= 0).length;
        if (hits !== 1) { got[mark] = "mark on " + hits + " lines"; continue; }
        fs.writeFileSync(at, lines.map((l) => (l.indexOf(mark) >= 0 ? swap : l)).join(nl));
        const child = spawnSync(process.execPath, [path.join(copy, "tests", "publish.mjs")], { cwd: copy, encoding: "utf8", timeout: 240000,
          env: Object.assign({}, process.env, { PUBLISH_NO_PLANTS: "1", PUBLISH_ONLY: "s1" }) });
        const said = String(child.stdout || "") + String(child.stderr || "");
        const alone = reds.every((r) => new RegExp("FAIL " + r).test(said)) && greens.every((g) => !new RegExp("FAIL " + g).test(said));
        got[mark] = alone ? "red" : "not red alone: " + said.slice(0, 300);
        fs.writeFileSync(at, buf);
      }
    } finally { dropPlantsTree(copy, ROOT); }
    check(Object.values(got).length === 2 && Object.values(got).every((v) => v === "red") && shaOf() === want && treeSha(ROOT) === before,
      "s1p the publisher's refusal lifted turns pbs1a and pbs1c red and only those, the plan's reading lifted turns pbs1b red alone,"
      + " and this checkout is unchanged: " + JSON.stringify(got));
  }

  /* The plant of r1a, in a scratch copy and never in this checkout: the team file's read at the write dropped turns r1a red. */
  if (PLANTS_OFF) {
    skip("r1p the plant of r1a (plants off)");
  } else {
    const { plantsTree, treeSha, dropPlantsTree } = await import("./plants-tree.mjs");
    const sha = () => crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, "src", "publish.mjs"))).digest("hex");
    const before = treeSha(ROOT), want = sha(), copy = plantsTree(ROOT, "publish-r1");
    let got = "";
    try {
      const at = path.join(copy, "src", "publish.mjs"), text = fs.readFileSync(at, "utf8");
      const nl = text.indexOf("\r\n") >= 0 ? "\r\n" : "\n", lines = text.split(nl), mark = "/* plant:r1-key-moved */";
      const hits = lines.filter((l) => l.indexOf(mark) >= 0).length;
      if (hits !== 1) got = "mark on " + hits + " lines";
      else {
        fs.writeFileSync(at, lines.map((l) => (l.indexOf(mark) >= 0 ? "        ;" : l)).join(nl));
        const child = spawnSync(process.execPath, [path.join(copy, "tests", "publish.mjs")], { cwd: copy, encoding: "utf8", timeout: 240000,
          env: Object.assign({}, process.env, { PUBLISH_NO_PLANTS: "1", PUBLISH_ONLY: "r1" }) });
        const said = String(child.stdout || "") + String(child.stderr || "");
        got = /FAIL r1a/.test(said) ? "red" : "green: " + said.slice(0, 300);
      }
    } finally { dropPlantsTree(copy, ROOT); }
    check(got === "red" && sha() === want && treeSha(ROOT) === before,
      "r1p the team file's read at the write dropped turns r1a red, and this checkout is unchanged: " + got);
  }

  /* The plant of p1e, in a scratch copy and never in this checkout: removing the stamp of the floor turns p1e red. */
  if (PLANTS_OFF) {
    skip("p1p the plant of p1e (plants off)");
  } else {
    const { plantsTree, treeSha, dropPlantsTree } = await import("./plants-tree.mjs");
    const sha = () => crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, "src", "publish.mjs"))).digest("hex");
    const before = treeSha(ROOT), want = sha(), copy = plantsTree(ROOT, "publish-p1");
    let hits = 0, red = false, back = false, detail = "";
    try {
      const at = path.join(copy, "src", "publish.mjs"), buf = fs.readFileSync(at), text = buf.toString("utf8");
      const nl = text.indexOf("\r\n") >= 0 ? "\r\n" : "\n", lines = text.split(nl), mark = "/* plant:p1-min-engine */";
      lines.forEach((l) => { if (l.indexOf(mark) >= 0) hits++; });
      if (hits === 1) {
        fs.writeFileSync(at, lines.filter((l) => l.indexOf(mark) < 0).join(nl));
        const child = spawnSync(process.execPath, [path.join(copy, "tests", "publish.mjs")], { cwd: copy, encoding: "utf8", timeout: 240000,
          env: Object.assign({}, process.env, { PUBLISH_NO_PLANTS: "1", PUBLISH_ONLY: "p1" }) });
        const said = String(child.stdout || "") + String(child.stderr || "");
        red = /FAIL p1e/.test(said) && !/FAIL p1[abcd]/.test(said);
        if (!red) detail = "status " + (child && child.status) + " " + said.slice(0, 400);
        fs.writeFileSync(at, buf);
        back = crypto.createHash("sha256").update(fs.readFileSync(at)).digest("hex") === want;
      }
    } finally { dropPlantsTree(copy, ROOT); }
    check(hits === 1 && red && back && sha() === want && treeSha(ROOT) === before,
      "p1p removing the floor's stamp turns p1e red and only p1e, the copy's sha256 is put back, and this checkout is unchanged " + detail);
  }

  if (!argv.includes("--keep")) dropScratch(SCRATCH, "publish");
  process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + "\n");
  process.stdout.write("publish-legs: " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]))
  main(process.argv.slice(2)).catch(e => {
    process.stderr.write("publish-legs: REFUSED " + (e && e.stack ? e.stack : e) + "\n");
    process.exit(2);
  });
