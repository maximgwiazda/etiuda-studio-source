/* THE AUDIT PACK: WHAT IT SAYS, AND THE TWO WAYS IT COULD LIE. Board 606 and 607, spec 3.2.
 *
 *     node tests/audit.mjs [--keep]
 *
 * The pack's whole value is one distinction: a card that entered by an acceptance somebody took,
 * against a card the owner typed with nothing behind it. Everything else in it - the counts, the
 * folder, the README - is arrangement. So this gate is built around two failing cases rather than
 * around the feature, and both were written before the assertions that pass.
 *
 * CONTROL ONE: TWO PROJECTS WITH THE SAME PUBLISHED BYTES AND DIFFERENT PROVENANCE. One card is
 * changed by the owner typing in the authoring program; in the second project the identical
 * change arrives as an agent's export and is accepted in the review queue. The two catalogs are
 * asserted byte for byte identical, so nothing in the file itself can tell them apart, and the
 * pack is required to say "written here" of the first and "accepted, by <account>, at <time>,
 * from <proposal>" of the second. A pack that read the catalog rather than the archive passes
 * neither arm; a pack that called every changed card approved passes the second and fails the
 * first; one that called every changed card unapproved does the reverse.
 *
 * CONTROL TWO: A PACK ALTERED AFTER IT LEFT. The written folder is copied and one character of
 * one card's text is changed in the catalog inside it. `verifyPack` reads that folder and nothing
 * else, exactly as an auditor's copy would be read, and is required to refuse it on the content
 * hash and on the signature while the untouched copy passes both. The leg is therefore on the
 * recomputation rather than on the presence of a hash field.
 *
 * CONTROL THREE: AN EDITION FROM BEFORE THE RECORD EXISTED. A third copy has its first edition's
 * acceptances.json deleted, which is what every edition already in a customer's archive looks
 * like. The cards that came in with that edition must read "unaccounted for" and be counted as
 * such, rather than quietly reading as unchanged - a pack that turned an absent record into an
 * approval is the exact failure this item exists to prevent.
 *
 * THE CLOCK IS FIXED (`--now`) EXCEPT WHERE THE STAMP IS THE SUBJECT: tests/acceptance.mjs
 * already holds the review stamp to a real clock read either side of the decision, so this gate
 * asserts that the stamp reaches the pack rather than re-deriving where it came from.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { importCsv } from "../src/import.mjs";
import { publishFull, PROJECT_FILE, DRAFT_FILE, ARCHIVE,
         ACCEPTANCES_IN_ARCHIVE, CATALOG_IN_ARCHIVE } from "../src/publish.mjs";
import { saveCard } from "../src/studio.mjs";
import { makeKeyFile } from "../src/sign.mjs";
import { newTeam, withChannel, writeTeam } from "../src/team.mjs";
import { RELAY_URL, relayId } from "../src/relay.mjs";
import { auditFor, writePack, verifyPack, LIMITS, README_IN_PACK,
         PUBLIC_KEY_IN_PACK, RECORD_CSV } from "../src/audit.mjs";
import { table } from "../src/csv.mjs";
import * as Engine from "../src/engine.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "audit-legs");
const CLOCK = "2026-09-20T09:00:00";
const WHO = "the agent at desk 9";
const PASS = "a passphrase this gate invents";
const TAIL = "\nGrelira thelork ustuma widesk.";

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

const readJson = p => JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, ""));
const cardOf = (cat, id) => (cat.cards || []).find(c => c.id === id);

function pile(name, seed, rows) {
  const out = path.join(SCRATCH, "piles", name);
  const r = spawnSync(process.execPath, ["tools/fixtures/generate.mjs", "--seed", String(seed),
    "--rows", String(rows), "--out", out], { cwd: ROOT, encoding: "utf8" });
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

function copyTree(from, to) {
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from, { withFileTypes: true }).forEach(e => {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copyTree(a, b); else fs.copyFileSync(a, b);
  });
}

const rowFor = (pack, id) => pack.cards.find(c => c.id === id) || {};

/* A claim that the program asks nothing over a network is false while src/wire.cjs names the
   relay and the licence service. The pack's third limit and both licence pages are the words a
   person reads; the Polish of that limit is the pair beside it in ui/lang.js. */
function falseNetwork(text) {
  return /asks anything over a network|no network request|makes no network|contains no network|o nic nie pyta przez sieć/i.test(String(text || ""));
}
function polishOf(limit) {
  const langText = fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8");
  const at = langText.indexOf(JSON.stringify(limit));
  if (at < 0) return "";
  const m = /:\s*\n?\s*"((?:[^"\\]|\\.)*)"/.exec(langText.slice(at + JSON.stringify(limit).length));
  return m ? JSON.parse('"' + m[1] + '"') : "";
}

/* THE TWO LICENCE PAGES DENY NOTHING THE CODE DOES, the engine's [2g/5] in Studio's shape (tests/test.js there), so the pair
   cannot drift apart. Each denial stands against a fact read from the code. The relay and the licence service are read where
   0-net reads them, and refuse when not found. The clipboard read is searched for across shell/ and src/, and Studio has none
   today, so that denial is held only once one exists; the search is held to the clipboard writes it must find beside it, so a
   pattern that reads nothing refuses rather than passes. While the relay exists both pages also name it, its sealing and the EU.
   Studio ships no helper executable, so the engine's caret.exe has no pair here. Text is read with its line breaks folded,
   because a page wraps "Unii\nEuropejskiej". */
function pagesTrue() {
  const wireText = fs.readFileSync(path.join(ROOT, "src", "wire.cjs"), "utf8");
  const code = ["shell", "src"].flatMap(d => fs.readdirSync(path.join(ROOT, d)).filter(f => /\.(c|m)?js$/.test(f))
    .map(f => fs.readFileSync(path.join(ROOT, d, f), "utf8")));
  const writes = code.filter(t => /clipboard\.writeText\(/.test(t)).length;
  const facts = {
    relay: wireText.includes('"https://etiuda.dev/relay/v1/"'),
    licence: /const LICENCE_ORIGIN = "https:\/\/etiuda\.dev\/licence\/v1\/"/.test(wireText),
    clipboard: code.some(t => /clipboard\.read(Text|HTML|RTF|Image|Bookmark|Buffer)?\(/.test(t)),
  };
  const DENY = [
    ["relay", /\bno network (request|call|connection|access)|makes no (network )?connection|(never|does not|doesn't) (connect|contact)s?\b|works (entirely |fully )?offline|(asks|sends) (anything|nothing) over a network/i],
    ["relay", /bez (połączenia z |dostępu do )?(sieci|internetu)|nie łączy się|nie (nawiązuje|wykonuje|wysyła) żadnych (połączeń|zapytań)|przez sieć o nic|działa (całkowicie |wyłącznie )?offline/i],
    ["licence", /no (online )?licen[cs]e (check|call|service)|checks no licen[cs]e/i],
    ["licence", /nie sprawdza (żadnej )?licencji|bez (sprawdzania|kontroli) licencji/i],
    ["clipboard", /(never|does not|doesn't) reads? the clipboard|only writes? (to )?the clipboard/i],
    ["clipboard", /nie (czyta|odczytuje) schowka|do schowka tylko zapisuje/i],
  ];
  const NAME = { en: [/\brelay\b/i, /\bsealed\b/i, /European Union/], pl: [/przekaźnik/i, /zapieczętowan/i, /Unii Europejskiej/] };
  const said = (raw, lang) => {
    const text = String(raw).replace(/\s+/g, " ");
    return DENY.filter(([f, re]) => facts[f] && re.test(text)).map(([f, re]) => f + " denied (" + text.match(re)[0] + ")")
      .concat(facts.relay ? NAME[lang].filter(re => !re.test(text)).map(re => "the relay's " + re.source + " not named") : []);
  };
  const bad = ["relay", "licence"].filter(f => !facts[f]).map(f => "the code fact " + f + " is not where this check reads it");
  if (!writes) bad.push("the clipboard search finds not even the writes, so it reads nothing");
  const pages = { en: fs.readFileSync(path.join(ROOT, "packaging", "license_en.txt"), "utf8"),
                  pl: fs.readFileSync(path.join(ROOT, "packaging", "license_pl.txt"), "utf8") };
  ["en", "pl"].forEach(l => said(pages[l], l).forEach(x => bad.push("license_" + l + ".txt: " + x)));
  /* The control, on a clean sentence: it passes, and one planted denial in each language, the relay struck, and a sentence
     broken across lines are each read as they should be. */
  const CLEAN = { en: "Files pass through the relay sealed and are stored in the European Union.",
                  pl: "Pliki przechodzą przez przekaźnik zapieczętowane i są przechowywane w Unii Europejskiej." };
  const planted = [said(CLEAN.en, "en").length, said(CLEAN.pl, "pl").length,
                   said(CLEAN.en + " The program makes no network connection.", "en").length,
                   said(CLEAN.pl + " Program nie łączy się z siecią.", "pl").length,
                   said(CLEAN.en.replace(/relay/gi, "service"), "en").length,
                   said(CLEAN.pl.replace("Unii Europejskiej", "Unii\nEuropejskiej"), "pl").length,
                   said(CLEAN.en + " It checks no\nlicence.", "en").length];
  if (planted.join() !== "0,0,1,1,1,0,1") bad.push("the control reads " + planted.join() + ", not 0,0,1,1,1,0,1");
  check(!bad.length, "0-netp both licence pages deny none of " + Object.keys(facts).filter(f => facts[f]).join(", ")
    + " and name the relay, its sealing and the EU; clipboard read in the code " + facts.clipboard + " (writes found in "
    + writes + " file(s)); a planted denial in each language, the relay struck and a wrapped line are each read right"
    + (bad.length ? ": " + bad.join("; ") : ""));
}

async function main(argv) {
  const wireText = fs.readFileSync(path.join(ROOT, "src", "wire.cjs"), "utf8");
  const relayNamed = wireText.includes('"https://etiuda.dev/relay/v1/"');
  const licenceNamed = /const LICENCE_ORIGIN = "https:\/\/etiuda\.dev\/licence\/v1\/"/.test(wireText);
  const plLimit = polishOf(LIMITS[2]);
  const enLic = fs.readFileSync(path.join(ROOT, "packaging", "license_en.txt"), "utf8");
  const plLic = fs.readFileSync(path.join(ROOT, "packaging", "license_pl.txt"), "utf8");
  const saidNet = [LIMITS.join("\n"), plLimit, enLic, plLic].filter(falseNetwork);
  check(relayNamed && licenceNamed && saidNet.length === 0 && plLimit.length > 40,
    "0-net the pack's third limit and both licence pages do not say the program asks nothing over a network,"
    + " while wire.cjs names the relay and the licence service: relay " + relayNamed + ", licence " + licenceNamed
    + (saidNet.length ? "; still said in " + saidNet.length + " text(s)" : "")
    + (plLimit ? "" : "; the Polish pair of the third limit is missing"));
  pagesTrue();

  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const F = await Engine.format();
  const ACCOUNT = String(os.userInfo().username);

  const keyAt = path.join(SCRATCH, "signing-key.json");
  fs.writeFileSync(keyAt, JSON.stringify(await makeKeyFile({ passphrase: PASS }), null, 1) + "\n",
    "utf8");
  const KEY = { key: keyAt, passphrase: PASS };

  /* ---- the two projects, identical in everything but how one card's change arrived --------- */

  const csv = pile("head", 41, 14);
  const typed = await project("typed", csv, "audit-pile");
  const queued = await project("queued", csv, "audit-pile");

  const firstA = await publishFull(Object.assign({ project: typed.dir,
    folder: path.join(SCRATCH, "out-typed"), notes: "the first", now: CLOCK }, KEY));
  const firstB = await publishFull(Object.assign({ project: queued.dir,
    folder: path.join(SCRATCH, "out-queued"), notes: "the first", now: CLOCK }, KEY));
  const published = readJson(firstA.ec);
  const ids = published.cards.map(c => c.id);
  const MOVED = ids[3], STILL = ids[9];

  check(fs.readFileSync(firstA.ec, "utf8") === fs.readFileSync(firstB.ec, "utf8"),
    "0a the two projects publish the same first edition byte for byte, so nothing after this"
    + " can be told apart by the catalog");

  /* The owner types the change into one project. */
  await saveCard(typed.dir, MOVED,
    { body: { en: cardOf(readJson(path.join(typed.dir, DRAFT_FILE)), MOVED).body.en + TAIL } });

  /* The identical change arrives at the other as an agent's export, and is accepted. */
  const proposal = JSON.parse(JSON.stringify(published));
  cardOf(proposal, MOVED).body.en += TAIL;
  proposal.modified = true;
  delete proposal.hash; delete proposal.sig;
  proposal.hash = F.contentHash(proposal);
  const proposalAt = path.join(SCRATCH, "from-desk-9.ec");
  fs.writeFileSync(proposalAt, JSON.stringify(proposal, null, 1) + "\n", "utf8");
  const KEYNAME = "card:" + MOVED + ":body.en";
  const decided = spawnSync(process.execPath, ["tools/review.mjs", queued.dir, proposalAt,
    "--from", WHO, "--accept", KEYNAME], { cwd: ROOT, encoding: "utf8" });
  check(decided.status === 0, "0b the queue accepted the identical change, exit "
    + decided.status + (decided.status ? ": " + decided.stderr : ""));

  const secondA = await publishFull(Object.assign({ project: typed.dir,
    folder: path.join(SCRATCH, "out-typed"), notes: "the second", now: CLOCK }, KEY));
  const secondB = await publishFull(Object.assign({ project: queued.dir,
    folder: path.join(SCRATCH, "out-queued"), notes: "the second", now: CLOCK }, KEY));

  /* ---- 1. THE DISTINCTION, WHICH IS THE WHOLE ITEM ----------------------------------------- */

  /* Since board 982 an edition dates each changed card by when its change was recorded, the typed one by its save and
     the accepted one by its acceptance, so the two second editions are one catalog apart from that one card's date (and
     the hash and signature over it). */
  const sansDates = (at) => {
    const o = readJson(at);
    delete o.hash; delete o.sig;
    (o.cards || []).forEach(c => { delete c.changedAt; });
    (o.tags || []).forEach(t => { delete t.changedAt; });
    return F.canonical(o);
  };
  const datedA = readJson(secondA.ec).cards.filter(c => c.changedAt), datedB = readJson(secondB.ec).cards.filter(c => c.changedAt);
  check(sansDates(secondA.ec) === sansDates(secondB.ec)
        && datedA.map(c => c.id).join() === MOVED && datedB.map(c => c.id).join() === MOVED,
    "1a THE CONTROL'S PREMISE: the second editions are the same catalog but for when the one change was recorded (only "
    + MOVED + " is dated, in each), so the two packs below differ only in what the archive remembers, " + secondA.edition);

  const packA = await auditFor(typed.dir, secondA.edition, { keyFile: keyAt });
  const packB = await auditFor(queued.dir, secondB.edition, { keyFile: keyAt });
  const a = rowFor(packA, MOVED), b = rowFor(packB, MOVED);

  check(a.how === "written" && a.by === null && a.keys.length === 0,
    "1b the card the owner typed reads " + JSON.stringify(a.how) + " with no account and no"
    + " decision behind it");
  check(b.how === "accepted" && b.by === ACCOUNT && b.keys.join(",") === KEYNAME
        && b.from === WHO && /^\d{4}-\d{2}-\d{2}T/.test(String(b.at)),
    "1c THE CONTROL: the identical change that came through the queue reads "
    + JSON.stringify(b.how) + ", decided by " + JSON.stringify(b.by) + " at "
    + JSON.stringify(b.at) + " on " + JSON.stringify(b.keys.join(",")) + " from "
    + JSON.stringify(b.from) + " - so 1b is a leg on the value and not on the shape");
  check(packA.counts.accepted === 0 && packA.counts.written === 1
        && packB.counts.accepted === 1 && packB.counts.written === 0,
    "1d and the counts follow the rows: typed " + JSON.stringify(packA.counts)
    + ", queued " + JSON.stringify(packB.counts));
  /* UNCHANGED IS NOT A SYNONYM FOR APPROVED. Both projects' first editions were an import with
     no decision behind any card, so every unchanged card traces back to a card written there;
     a pack that counted 13 unchanged beside 0 unaccounted for and said nothing else would read
     as "everything was approved", which is the one sentence this artefact must never suggest. */
  check(packA.counts.unchangedAccepted === 0 && packA.counts.unchangedWritten === 13
        && packB.counts.unchangedAccepted === 0 && packB.counts.unchangedWritten === 13
        && rowFor(packA, STILL).origin === "written",
    "1f and the unchanged ones say how they got into the edition they have stood since: "
    + packA.counts.unchangedAccepted + " accepted there, " + packA.counts.unchangedWritten
    + " written there, because the first edition was an import and nobody decided anything");
  check(packA.counts.cards === 14 && packA.counts.unchanged === 13
        && packA.counts.unaccounted === 0 && rowFor(packA, STILL).how === "unchanged"
        && rowFor(packA, STILL).since === firstA.edition,
    "1e every other card is unchanged since the edition it came in with ("
    + packA.counts.unchanged + " of " + packA.counts.cards + ", " + STILL + " since "
    + rowFor(packA, STILL).since + ")");

  /* ---- 2. THE EDITION'S OWN CHECKS ---------------------------------------------------------- */

  check(packA.catalog.ok && packA.catalog.hash === packA.catalog.recomputed,
    "2a the archived catalog's content hash recomputes over the bytes the archive kept: "
    + packA.catalog.hash);
  check(packA.signature.present && packA.signature.state === "valid"
        && packA.signature.keyId === readJson(keyAt).keyId,
    "2b and its signature is valid through the engine's own v2SigState against the key file's"
    + " public half, key " + packA.signature.keyId + " (" + packA.signature.rule + ")");
  check(packA.person.verified === false && /not verified/.test(packA.person.statement)
        && packA.limits.length === 3 && packA.limits.every(l => l.length > 40),
    "2c the pack carries the unverified-account statement and all three of board 607's limits");

  /* ---- 3. THE FOLDER THAT LEAVES THE BUILDING ----------------------------------------------- */

  /* THE PERSON PICKS A PLACE TO PUT A PACK, NOT A FOLDER TO BECOME ONE, so the folder chosen
     here already holds something of somebody else's and the leg below requires it to still be
     there afterwards. Writing seven files straight into whatever was picked would scatter them
     through a Documents folder, and the README of a second edition would then overwrite the
     first while leaving that edition's catalog beside it. */
  const chosen = path.join(SCRATCH, "the-auditors-folder");
  fs.mkdirSync(chosen, { recursive: true });
  fs.writeFileSync(path.join(chosen, "somebody-elses-notes.txt"), "not ours\n", "utf8");
  const wrote = await writePack(queued.dir, secondB.edition, chosen, { keyFile: keyAt });
  const out = wrote.folder;
  const names = wrote.files.map(f => f.name);
  const onDisk = fs.readdirSync(out).sort();
  check(names.slice().sort().join(",") === onDisk.join(","),
    "3a the pack names every file it wrote and wrote every file it names: " + onDisk.join(", "));
  check(path.basename(out) === "audit-" + published.id + "-" + secondB.edition
        && fs.readdirSync(chosen).sort().join(",")
           === [path.basename(out), "somebody-elses-notes.txt"].sort().join(","),
    "3a1 in a folder of its own named for the catalog and the edition, "
    + JSON.stringify(path.basename(out)) + ", beside what was already in the folder somebody"
    + " picked: " + JSON.stringify(fs.readdirSync(chosen)));
  let twice = null;
  try { await writePack(queued.dir, secondB.edition, chosen, { keyFile: keyAt }); }
  catch (e) { twice = e && e.message ? e.message : String(e); }
  check(twice && /already holds an audit pack/.test(twice)
        && fs.readdirSync(out).sort().join(",") === onDisk.join(","),
    "3a2 and a second pack of the same edition into the same folder refuses rather than writing"
    + " over the first: " + JSON.stringify(String(twice).slice(0, 60)));
  const ecName = onDisk.find(n => /^catalog-.+\.json$/.test(n));
  check(fs.readFileSync(path.join(out, ecName)).equals(
        fs.readFileSync(path.join(queued.dir, ARCHIVE, secondB.edition, CATALOG_IN_ARCHIVE))),
    "3b the catalog in it is the archived file byte for byte, " + ecName + ", a copy rather"
    + " than a re-serialisation");
  check(fs.existsSync(path.join(out, ACCEPTANCES_IN_ARCHIVE))
        && fs.readFileSync(path.join(out, ACCEPTANCES_IN_ARCHIVE)).equals(
           fs.readFileSync(path.join(queued.dir, ARCHIVE, secondB.edition,
                                     ACCEPTANCES_IN_ARCHIVE))),
    "3c and so is the acceptance record");
  const readme = fs.readFileSync(path.join(out, README_IN_PACK), "utf8");
  check(LIMITS.every(l => readme.includes(l.split("\n")[0].slice(0, 40)))
        && readme.includes("not verified")
        && names.every(n => readme.includes(n)),
    "3d the README states all three limits, says the name is not verified, and names each of"
    + " the " + names.length + " files");
  const rows = table(fs.readFileSync(path.join(out, RECORD_CSV), "utf8")).rows;
  const csvRow = rows.find(r => r.card === MOVED);
  check(rows.length === 14 && csvRow && csvRow["how it got here"] === "accepted"
        && csvRow["who decided"] === ACCOUNT,
    "3e the approval record is one row per card read back through this tree's own CSV reader ("
    + rows.length + " rows), and " + MOVED + " reads "
    + JSON.stringify(csvRow ? csvRow["how it got here"] : null) + " by "
    + JSON.stringify(csvRow ? csvRow["who decided"] : null));
  check(fs.readFileSync(path.join(out, PUBLIC_KEY_IN_PACK), "utf8").trim()
        === readJson(keyAt).public,
    "3f and the public half of the signing key is in it, so the signature can be checked by"
    + " somebody who has never seen this machine");

  /* ---- 4. THE STRANGER'S REPETITION, AND THE PACK THAT WAS ALTERED -------------------------- */

  const clean = await verifyPack(out);
  check(clean.ok && clean.hash.ok && clean.signature.state === "valid"
        && clean.signature.detachedAgrees === true,
    "4a a reader with the folder and nothing else recomputes the hash, verifies the signature"
    + " and finds the detached .sig equal to the one inside: " + JSON.stringify(clean.hash.ok)
    + ", " + clean.signature.state);

  const bent = path.join(SCRATCH, "pack-altered");
  copyTree(out, bent);
  const bentAt = path.join(bent, ecName);
  const before = fs.readFileSync(bentAt, "utf8");
  const doc = JSON.parse(before);
  const body = doc.cards[0].body.en;
  const swap = body[0] === "Z" ? "Y" : "Z";
  doc.cards[0].body.en = swap + body.slice(1);
  const after = JSON.stringify(doc, null, 1) + "\n";
  fs.writeFileSync(bentAt, after, "utf8");
  const differ = Array.from(before).filter((ch, i) => ch !== after[i]).length;
  check(before.length === after.length && differ === 1,
    "4b THE CONTROL IS ONE CHARACTER: the altered copy differs from the pack's catalog in "
    + differ + " byte(s) of " + before.length + ", " + JSON.stringify(body[0]) + " to "
    + JSON.stringify(swap) + " in the first card's text");
  const broken = await verifyPack(bent);
  check(!broken.ok && !broken.hash.ok && broken.hash.stored !== broken.hash.recomputed
        && broken.signature.state === "invalid",
    "4c and the same reader refuses it: the hash stored says " + broken.hash.stored
    + " and recomputes as " + broken.hash.recomputed + ", the signature reads "
    + broken.signature.state);

  /* ---- 4d. THE UNSIGNED PACK, WHICH IS THE DEFAULT AND WAS THE UNTESTED ARM ----------------
   *
   * Signing is optional (board 605) and a project with no key publishes unsigned, so the file
   * list of a pack is not one list but two: the signed one carries the detached signature and
   * the public key and the unsigned one carries neither. The README is the INDEX of the folder,
   * so the way this fails is that it promises a file nobody put there - which leg 3a catches by
   * holding the names the pack reports to the names on the disk, and which it can only catch on
   * an arm it is actually run on.
   */
  const bare = await project("bare", csv, "audit-bare");
  const bareFirst = await publishFull({ project: bare.dir,
    folder: path.join(SCRATCH, "out-bare"), notes: "unsigned", now: CLOCK });
  const bareAt = (await writePack(bare.dir, bareFirst.edition,
    path.join(SCRATCH, "pack-bare"), {})).folder;
  const bareNames = fs.readdirSync(bareAt).sort();
  const bareReadme = fs.readFileSync(path.join(bareAt, README_IN_PACK), "utf8");
  check(bareNames.join(",") === [README_IN_PACK, RECORD_CSV, ACCEPTANCES_IN_ARCHIVE,
        "catalog-" + bareFirst.edition + ".json", "first-edition.txt"].sort().join(",")
        && !bareReadme.includes(PUBLIC_KEY_IN_PACK) && !bareReadme.includes(".json.sig"),
    "4d a pack of an unsigned edition holds five files rather than seven and its README names"
    + " neither the signature nor a public key: " + bareNames.join(", "));
  check(/published unsigned/.test(bareReadme),
    "4e and says so in the line where a signature would have been, rather than leaving the"
    + " reader to notice a missing file");
  const bareV = await verifyPack(bareAt);
  check(bareV.ok && bareV.hash.ok && !bareV.signature.present
        && bareV.signature.state === "none",
    "4f and it still verifies in a stranger's hands on the one check it can offer: the content"
    + " hash recomputes and the signature reads " + bareV.signature.state);

  /* ---- 5. AN EDITION FROM BEFORE THE RECORD EXISTED ------------------------------------------ */

  const old = path.join(SCRATCH, "pruned");
  copyTree(queued.dir, old);
  fs.rmSync(path.join(old, ARCHIVE, firstB.edition, ACCEPTANCES_IN_ARCHIVE), { force: true });
  const packC = await auditFor(old, secondB.edition, { keyFile: keyAt });
  check(packC.counts.unaccounted === 13 && packC.counts.unchanged === 0
        && packC.counts.accepted === 1,
    "5a with the first edition's record deleted, the 13 cards that came in with it read"
    + " unaccounted for rather than unchanged, and the one card this edition decided still"
    + " reads accepted: " + JSON.stringify(packC.counts));
  check(packC.editions.some(e => e.edition === firstB.edition && e.record === false)
        && rowFor(packC, STILL).how === "unaccounted",
    "5b and the pack names the edition that cannot answer, rather than leaving the reader to"
    + " infer it from a blank");

  /* ---- 6. THE COMMAND LINE, WHICH IS THE OTHER DOOR ----------------------------------------- */

  const cli = spawnSync(process.execPath, ["tools/audit.mjs", queued.dir,
    "--edition", secondB.edition, "--key", keyAt], { cwd: ROOT, encoding: "utf8" });
  check(cli.status === 0 && cli.stdout.includes("1 accepted")
        && cli.stdout.includes(MOVED + " ") && cli.stdout.includes(ACCOUNT),
    "6a `node tools/audit.mjs` prints the same account of the same edition, exit " + cli.status);
  const verify = spawnSync(process.execPath, ["tools/audit.mjs", "--verify", out],
    { cwd: ROOT, encoding: "utf8" });
  const refuse = spawnSync(process.execPath, ["tools/audit.mjs", "--verify", bent],
    { cwd: ROOT, encoding: "utf8" });
  check(verify.status === 0 && /VERIFIED/.test(verify.stdout)
        && refuse.status === 1 && /NOT VERIFIED/.test(refuse.stdout),
    "6b and --verify exits 0 on the pack and 1 on the altered copy, which is a finding rather"
    + " than a fault: " + verify.status + " and " + refuse.status);

  /* ---- 7. AFTER A KEY ROTATION, AN OLD EDITION'S PACK NAMES THE KEY THAT SIGNED IT ----------
   *
   * Sense pass item 12. docs/signing-keys.md's rotation: edition one is signed with key A, the
   * project then signs with key B, and the ring beside the catalog gains B beside A. A pack of
   * edition one asked for with the key file this copy now holds (B) once wrote B's public half
   * under A's id, and a stranger's verifyPack then read an untouched catalog as INVALID. The key
   * that goes into a pack is the one whose id the signature names: the key file when it is that
   * key, else the ring beside the published catalog, else none, and none reads `unknown`.
   * A relay team keeps that ring inside the signed team file. A folder team may keep the ring
   * file in the primed work mirror rather than on the share a person is shown.
   */
  const keyA = path.join(SCRATCH, "key-a.json"), keyB = path.join(SCRATCH, "key-b.json");
  fs.writeFileSync(keyA, JSON.stringify(await makeKeyFile({ passphrase: PASS }), null, 1) + "\n");
  fs.writeFileSync(keyB, JSON.stringify(await makeKeyFile({ passphrase: PASS }), null, 1) + "\n");
  const A = readJson(keyA), B = readJson(keyB);
  const rot = await project("rotated", csv, "audit-rotated");
  const oldEd = await publishFull({ project: rot.dir, notes: "signed with A", now: CLOCK,
    key: keyA, passphrase: PASS });
  const newEd = await publishFull({ project: rot.dir, notes: "signed with B",
    now: "2026-09-21T09:00:00", key: keyB, passphrase: PASS });
  const ringKeys = readJson(path.join(rot.dir, "etiuda-ring.json")).keys.map(k => k.keyId);
  check(A.keyId !== B.keyId && ringKeys.join(",") === [A.keyId, B.keyId].join(","),
    "7a THE PREMISE: two editions of one project signed with two keys, and the ring beside the"
    + " catalog holds both, in the order they signed: " + ringKeys.join(", "));

  const oldPack = await auditFor(rot.dir, oldEd.edition, { keyFile: keyB });
  check(oldPack.signature.keyId === A.keyId && oldPack.signature.key
        && oldPack.signature.key.keyId === A.keyId && oldPack.signature.key.public === A.public
        && oldPack.signature.state === "valid",
    "7b the pack of the edition A signed, asked for while this copy holds B, carries A's public"
    + " half and reads valid: " + JSON.stringify({ sig: oldPack.signature.keyId,
      key: oldPack.signature.key && oldPack.signature.key.keyId, state: oldPack.signature.state }));
  const oldOut = (await writePack(rot.dir, oldEd.edition, path.join(SCRATCH, "pack-rot-old"),
    { keyFile: keyB })).folder;
  const oldV = await verifyPack(oldOut);
  const oldReadme = fs.readFileSync(path.join(oldOut, README_IN_PACK), "utf8");
  check(oldV.ok && oldV.signature.state === "valid" && oldV.signature.publicKey === A.public
        && oldReadme.includes("key " + A.keyId) && !oldReadme.includes(B.keyId),
    "7c and the folder verifies in a stranger's hands, its README naming key A and never B: "
    + oldV.signature.state);

  const newOut = (await writePack(rot.dir, newEd.edition, path.join(SCRATCH, "pack-rot-new"),
    { keyFile: keyB })).folder;
  const newV = await verifyPack(newOut);
  check(newV.ok && newV.signature.state === "valid" && newV.signature.publicKey === B.public,
    "7d CONTROL: the edition B signed still gets B, from the key file itself");

  const lost = path.join(SCRATCH, "rotated-no-ring");
  copyTree(rot.dir, lost);
  fs.rmSync(path.join(lost, "etiuda-ring.json"));
  const lostOut = (await writePack(lost, oldEd.edition, path.join(SCRATCH, "pack-rot-lost"),
    { keyFile: keyB })).folder;
  const lostV = await verifyPack(lostOut);
  check(!fs.existsSync(path.join(lostOut, PUBLIC_KEY_IN_PACK))
        && lostV.signature.state === "unknown" && lostV.hash.ok,
    "7e and with the ring gone there is no key to give: no public-key file, and the signature"
    + " reads unknown rather than invalid while the hash still recomputes: "
    + lostV.signature.state);

  /* A relay team keeps the ring inside the signed team file and writes no etiuda-ring.json. */
  const relayHome = path.join(SCRATCH, "rotated-relay");
  copyTree(rot.dir, relayHome);
  fs.rmSync(path.join(relayHome, "etiuda-ring.json"));
  const relayFolder = path.join(SCRATCH, "relay-team-folder");
  fs.mkdirSync(relayFolder, { recursive: true });
  const relayProj = readJson(path.join(relayHome, PROJECT_FILE));
  relayProj.folder = relayFolder;
  fs.writeFileSync(path.join(relayHome, PROJECT_FILE), JSON.stringify(relayProj, null, 1) + "\n");
  const ringDoc = readJson(path.join(rot.dir, "etiuda-ring.json"));
  const rt = relayId();
  let relayTeam = newTeam({ lead: { keyId: A.keyId, public: A.public }, catalogs: [relayProj.id] });
  relayTeam = withChannel(relayTeam, { kind: "relay", rt, url: RELAY_URL }, ringDoc);
  await writeTeam(relayFolder, relayTeam, { key: keyA, passphrase: PASS });
  const relayPack = await auditFor(relayHome, oldEd.edition, { keyFile: keyB });
  check(relayPack.signature.state === "valid"
        && relayPack.signature.key && relayPack.signature.key.public === A.public
        && relayPack.signature.key.keyId === A.keyId
        && !fs.existsSync(path.join(relayHome, "etiuda-ring.json"))
        && !fs.existsSync(path.join(relayFolder, "etiuda-ring.json"))
        && fs.existsSync(path.join(relayFolder, "etiuda-team.json")),
    "7f a relay team keeps the ring inside the signed team file: the pack of the edition A signed,"
    + " asked for while this copy holds B, carries A's public half and reads "
    + relayPack.signature.state + ", and neither folder has etiuda-ring.json");

  /* ---- the verdict -------------------------------------------------------------------------- */

  process.stdout.write("\naudit  " + asserted + " assertion(s), " + failed + " failed\n");
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "audit");
  process.stdout.write("RESULT: " + (failed ? "FAIL" : "PASS") + "\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("audit  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
