/* LICENCE HANDLING: SPEC 3.8 AND 5.4, AS MAXIM RULED IT AT THE FOURTH MEETING (board 745).
 *
 *     node tests/licence-handling.mjs [--keep]
 *
 * A licence carries the versions released in the twelve months after purchase, and a build
 * released after those months is read as every other build is (Max, 2026-11-17 20:41: a paid licence that ends stops
 * Studio, so no build is "newer" than a licence). With no licence, nothing is open: no period is counted for it. The file
 * states a count of seats with three devices
 * each, as the EULA does, and names nobody: the customer keeps the list of names (the licence
 * service's design of 2026-09-24, lines 28 to 32). An organisation's trial is fourteen days.
 *
 * Every leg runs inside `leg()`, which turns a throw into a failure of that leg alone, so that
 * run against the licence handling this replaced the gate reads red leg by leg rather than dying
 * at the first missing export. That run is the red half; it is in the report of board 745.
 *
 *   1  a licence states its seats and the date its updates end, and both reach the header; a format-2
 *      licence, which named its persons, still reads with their number as its seats; a count that is
 *      not a positive whole number, or names beside the count, is not a licence
 *   2  a tampered licence fails verification
 *   3  a build released after the updates is read as one released inside them, and today's date
 *      moves nothing; neither publishes with a mark
 *   4  an unusable licence file reads as no licence, naming the file and the reason
 *   5  no licence stops, on every day, whatever first-run day is handed in
 *   6  in a packaged build nothing but the embedded key and the build's own date is honoured
 *   7  the release date is fixed at packaging, into the packaged package.json
 *   8  a build released after the updates publishes, and read, diff, the audit and export stay open
 *   9  the vendor root key is embedded, byte for byte, and a licence signed by any other key is
 *      refused as not the root's (board 742)
 *  10  a folder where the licence file should be, or a file that does not parse, is an unusable
 *      licence: no licence, the same sentence, no raw error from the publish (board 931, condition 9)
 *  11  the publish cover's licence line says seats, in English and in Polish, and names nobody
 *  12  a licence signed by a key the root's delegation certifies for "licence" is accepted when it was issued inside the
 *      delegation's window, by the licence's own day and never today's, and nothing else is; each check has a plant that
 *      turns it red (licence service S1; 12k and 12l the test architect's E1 and E2)
 *  13  a licence a delegate signed is refused `revoked` when its key is on the root-signed revoked keys' list kept beside the
 *      licence file, or handed in; a list the root did not sign revokes nothing; a root-signed licence is never revoked;
 *      and the kept list never rolls back (licence service S6, the test architect's condition on S1). Run with leg 12 and
 *      its plants, each of which turns its leg red
 *  14  a trial is a signed licence that ends by the clock ("trials are signed licences too"): honoured as a licence until
 *      its end, no mark, and after it the pause the record names for after the trial, in one calm sentence, publishing
 *      refused and nothing written while diff and export stay open; a clock set back reads no earlier than the licence's
 *      issued day or a time this computer has already seen; one shape per form, and a full licence read exactly as before. Its state
 *      legs run with their plants (LICENCE_TRIAL_PLANT=<name> runs one and prints its FAIL lines)
 *  15  a licence file the system will not open (EPERM, EACCES, EBUSY) is asked again for half a
 *      second. Still held over a licence this computer verified there, it is `held`: a valid file does not pause or stop,
 *      and the sentence says the file could not be read. One that frees within the half-second is
 *      read, and the licence stands. A file that was read and does not parse stays section 10
 *  16  a paid licence stating its paid end (paidUntil, from the licence service's piece S-0) is active until its paid end, then
 *      `paid-ended`, paused and unable to publish, while one without paidUntil reads as before; each check has a plant that turns
 *      it red (LICENCE_PAID_PLANT=<name> runs one)
 *  18  what this computer has already verified and seen (review xi): a held file rests only on a licence verified at that path,
 *      read again by its own dates, and is otherwise no licence; the newest revoked keys' list ever seen never loses a key,
 *      and is kept in a snapshot this Studio's key marks; the clock never moves back past a time seen, unless a licence the
 *      service issued later rights it; and publishing never reads an archive folder's name as a day
 *      (LICENCE_SEEN_PLANT=<name> runs one plant)
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { importCsv } from "../src/import.mjs";
import { publishFull, readProject, NOTES_IN_ARCHIVE, RELEASE_IN_ARCHIVE, REPORT_IN_ARCHIVE,
         CATALOG_IN_ARCHIVE } from "../src/publish.mjs";
import { diffEditions, exportEdition, publishPlan, newProject, openProject, builtLangs } from "../src/studio.mjs";
import { auditFor } from "../src/audit.mjs";
import * as L from "../src/licence.mjs";
import * as Engine from "../src/engine.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { plantText } from "./plant-copy.mjs";
import { loadPage } from "./page-stand-in.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "licence-handling-legs");
const require = createRequire(import.meta.url);

/* ETIUDA_PLANTS=off (a merge's area run) skips each plant check (5p, 12p, 14p, 15p, 15q, 16p) and counts it; the release profile
   runs with plants on, so they still run there. */
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
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
/* The field a desk reads. Absent is null, so a present empty string cannot pass as none. */
function editionField(pub) {
  if (!pub || !pub.ec || !fs.existsSync(pub.ec)) return undefined;
  const doc = JSON.parse(fs.readFileSync(pub.ec, "utf8"));
  return Object.prototype.hasOwnProperty.call(doc, "evaluation") ? doc.evaluation : null;
}
async function leg(name, fn) {
  try { await fn(); }
  catch (e) { check(false, name + " threw: " + (e && e.message ? e.message : String(e))); }
}
async function refusal(fn) {
  try { await fn(); return null; } catch (e) { return e; }
}

async function project(name, id) {
  const dir = path.join(SCRATCH, name);
  fs.mkdirSync(dir, { recursive: true });
  const csv = path.join(dir, "macros.csv");
  const CRLF = "\r\n";
  fs.writeFileSync(csv, "id,category,title_en,body_en" + CRLF
    + '"c-card-1","cat-general","Greeting","Hello customer."' + CRLF
    + '"c-card-2","cat-general","Signoff","Best regards."' + CRLF, "utf8");
  const made = await importCsv({ file: csv, id, name: id });
  fs.writeFileSync(path.join(dir, "draft.json"), JSON.stringify(made.catalog, null, 1) + "\n");
  fs.writeFileSync(path.join(dir, "project.json"), JSON.stringify(
    { id: made.catalog.id, rev: 0, edition: "" }, null, 1) + "\n");
  return { dir, catalog: made.catalog };
}

const writeLicence = (file, doc) =>
  fs.writeFileSync(file, "window.E_LICENSE = " + JSON.stringify(doc, null, 1) + ";\n", "utf8");
const editions = dir => fs.existsSync(path.join(dir, "archive"))
  ? fs.readdirSync(path.join(dir, "archive")).length : 0;

async function main(argv) {
  const keep = argv.includes("--keep");
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  delete process.env.STUDIO_VENDOR_KEY; delete process.env.STUDIO_RELEASED;
  delete process.env.STUDIO_LICENSE_FILE; delete process.env.STUDIO_LICENCE_FILE;

  /* A throwaway vendor key, made here and gone with the scratch folder. The root key is embedded
     in src/licence.mjs (board 742) and its private half lives offline, so the licences signed in
     this file are signed by this one and handed in as the key to check them with. */
  const pair = crypto.generateKeyPairSync("ed25519");
  const rootPub = pair.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  const sign = fields => L.createTestLicence(fields, pair.privateKey, "vendor-root-test");

  const payload = {
    org: "Acme sp. z o.o.", contact: "cx-ops@example.com",
    seats: 2,
    issued: "2026-09-01", updatesUntil: "2027-09-01",
  };
  const good = await sign(payload);
  const licFile = path.join(SCRATCH, "etiuda-studio-license.js");
  writeLicence(licFile, good);
  const K = { trustedKey: rootPub };

  /* ---- 1. SEATS, THREE DEVICES EACH, AND THE END OF UPDATES -------------------------------- */

  await leg("1", async () => {
    const back = L.readLicenceFile(licFile);
    check(back && back.format === 3 && L.LICENCE_FORMAT === 3 && back.kind === L.LICENCE_KIND
          && back.seats === 2 && !("persons" in back) && !("desks" in back)
          && back.updatesUntil === "2027-09-01" && !("expires" in back),
      "1a the licence file is format 3 and carries a seat count and updatesUntil, no names, no desk"
      + " count and no expiry: " + JSON.stringify(back && Object.keys(back)));
    const v = await L.verifyLicence(back, K);
    check(v.valid === true && v.reason == null, "1b and it verifies against the vendor key");
    const st = await L.licenceState(back, Object.assign({ released: "2026-10-01" }, K));
    check(st.status === "active" && st.canPublish && !("evaluation" in st) && st.seats === 2
          && st.devicesEach === 3 && L.DEVICES_PER_SEAT === 3
          && st.updatesUntil === "2027-09-01" && !("names" in st) && !("persons" in st),
      "1c its state is active with two seats at three devices each, and no names: "
      + JSON.stringify({ status: st.status, seats: st.seats, devicesEach: st.devicesEach }));
    const header = L.formatLicenceHeader(st);
    check(/Acme sp\. z o\.o\./.test(header) && /2 seats/.test(header) && !/person/.test(header)
          && /3 devices each/.test(header) && /updates until 2027-09-01/.test(header)
          && !/desk/i.test(header),
      "1d the header says the EULA's count and the end of updates: " + JSON.stringify(header));
    /* A format-2 licence, as Studio issued them before format 3: the persons by name, no seats. */
    const { seats: _two, ...unnamed } = payload;
    const legacy = fields => sign(Object.assign({}, unnamed, { format: 2 }, fields));
    const noOne = await legacy({ persons: [] });
    const vNoOne = await L.verifyLicence(noOne, K);
    check(vNoOne.valid === false && vNoOne.reason === "unreadable",
      "1e CONTROL: a format-2 licence naming nobody is not a licence: " + JSON.stringify(vNoOne));

    /* THE SEAT COUNT (the licence service's design of 2026-09-24, lines 28 to 32): format 3
       states it, format 2 stated it as names and still reads as their number, and nothing else
       is a licence. */
    const four = await sign({ format: 3, org: "Fennick Lato", seats: 4, issued: "2026-10-01", updatesUntil: "2027-10-01" });
    const vFour = await L.verifyLicence(four, K);
    const sFour = await L.licenceState(four, Object.assign({ released: "2026-10-20" }, K));
    const hFour = L.formatLicenceHeader(sFour);
    check(four.format === 3 && !("persons" in four) && vFour.valid === true && sFour.status === "active"
          && sFour.seats === 4 && /Fennick Lato · 4 seats, 3 devices each/.test(hFour),
      "1f a format-3 licence stating 4 seats is accepted and shown as 4: "
      + JSON.stringify({ format: four.format, reason: vFour.reason, status: sFour.status, seats: sFour.seats,
        header: hFour }));
    const three = await legacy({ persons: ["Ilsa Wroden", "Teodor Malk", "Brena Ostik"] });
    const vThree = await L.verifyLicence(three, K);
    const sThree = await L.licenceState(three, Object.assign({ released: "2026-10-20" }, K));
    const hThree = L.formatLicenceHeader(sThree);
    check(three.format === 2 && three.persons.length === 3 && !("seats" in three) && vThree.valid === true
          && sThree.status === "active" && sThree.seats === 3 && !("names" in sThree)
          && /3 seats, 3 devices each/.test(hThree) && !/Ilsa|Teodor|Brena/.test(JSON.stringify(sThree) + hThree),
      "1g a format-2 licence naming three persons is still accepted and shown as 3 seats, no name carried on: "
      + JSON.stringify({ reason: vThree.reason, status: sThree.status, seats: sThree.seats, header: hThree }));
    const badCounts = { zero: 0, negative: -2, fraction: 2.5, text: "4" };
    const saidBad = {};
    for (const k of Object.keys(badCounts)) {
      const doc = await sign(Object.assign({}, payload, { seats: badCounts[k] }));
      saidBad[k] = doc.format === 3 ? (await L.verifyLicence(doc, K)).reason : "format " + doc.format;
    }
    check(Object.values(saidBad).every(r => r === "unreadable"),
      "1h a format-3 licence whose seats are 0, a negative, a fraction or a string is not a licence: "
      + JSON.stringify(saidBad));
    const both = await sign(Object.assign({}, payload, { persons: ["Wiesa Tomczal", "Oren Palik"] }));
    const vBoth = await L.verifyLicence(both, K);
    check(both.format === 3 && both.seats === 2 && vBoth.valid === false && vBoth.reason === "unreadable",
      "1i a format-3 licence that names persons beside its seats is not a licence, one shape per format: "
      + JSON.stringify({ format: both.format, reason: vBoth.reason }));
  });

  /* ---- 2. TAMPERING ------------------------------------------------------------------------- */

  await leg("2", async () => {
    const bent = (k, v) => Object.assign(JSON.parse(JSON.stringify(good)), { [k]: v });
    const tries = {
      seats: bent("seats", good.seats + 1),
      org: bent("org", "Other sp. z o.o."),
      updatesUntil: bent("updatesUntil", "2031-09-01"),
    };
    const sigBent = JSON.parse(JSON.stringify(good));
    sigBent.sig.value = (sigBent.sig.value[0] === "0" ? "1" : "0") + sigBent.sig.value.slice(1);
    tries.sig = sigBent;
    const said = {};
    for (const k of Object.keys(tries)) said[k] = (await L.verifyLicence(tries[k], K)).reason;
    check(Object.values(said).every(r => r === "signature"),
      "2a a seat added, the organisation renamed, the updates lengthened or the signature bent"
      + " each fail on the signature: " + JSON.stringify(said));
    const other = crypto.generateKeyPairSync("ed25519").publicKey
      .export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
    check((await L.verifyLicence(good, { trustedKey: other })).reason === "signature",
      "2b and a licence signed by any key but the vendor's fails the same way");
  });

  /* ---- 3. NO BUILD IS NEWER THAN A LICENCE (decisions 2026-10-20 10:47, reversed by Max, 2026-11-17 20:41) ------- */

  await leg("3", async () => {
    const at = (released, now) => L.licenceState(good, Object.assign({ released, now }, K));
    const within = await at("2027-08-31", "2041-01-01");
    check(within.status === "active" && within.canPublish === true && within.paused === false
          && !("watermark" in within),
      "3a a build released inside the twelve months publishes with the licence fourteen years"
      + " after they ended, and with no mark: " + within.status);
    const edge = await at("2027-09-01", "2041-01-01");
    check(edge.status === "active" && edge.canPublish === true && edge.paused === false
          && !("watermark" in edge),
      "3b and so does one released on the last day of them, with no mark: " + edge.status);
    const after = await at("2027-09-02", "2026-09-23");
    check(after.status === "active" && after.canPublish === true && after.paused === false
          && !("watermark" in after) && !("released" in after) && after.updatesUntil === "2027-09-01"
          && L.formatLicenceHeader(after) === L.formatLicenceHeader(within),
      "3c a build released the day after is read as every other build is: active, open, no mark, and its header the"
      + " same: " + after.status + " " + L.formatLicenceHeader(after));
    const sameEarly = await at("2027-09-02", "2027-01-01");
    const sameLate = await at("2027-09-02", "2099-01-01");
    const withinEarly = await at("2027-08-31", "2026-01-01");
    check(sameEarly.status === "active" && sameLate.status === "active" && withinEarly.status === "active",
      "3d CONTROL, today's date moves nothing: the same build and licence read the same across"
      + " seventy years of it: " + [sameEarly.status, sameLate.status, withinEarly.status]);
    const unreleased = await at(null, "2099-01-01");
    check(unreleased.status === "active", "3e a development tree, which has no release date, reads the same");

    const inside = await project("proj-inside", "inside-cat");
    const pub = await publishFull({ project: inside.dir, now: "2041-01-01T10:00:00",
      notes: "long after the updates ended", licenceFile: licFile, trustedKey: rootPub,
      released: "2027-08-31" });
    const report = JSON.parse(fs.readFileSync(path.join(pub.archive, REPORT_IN_ARCHIVE), "utf8"));
    check(fs.existsSync(pub.ec) && !("evaluation" in report) && !("watermark" in report),
      "3f publishFull publishes under the licence in 2041 with a build of 2027-08-31, and its report holds no mark: "
      + JSON.stringify(Object.keys(report).filter(k => /evaluation|watermark/.test(k))));
    check(editionField(pub) === null,
      "3f2 a catalog published under a valid licence carries no evaluation field: "
      + JSON.stringify(editionField(pub)));

    const newerProj = await project("proj-newer", "newer-cat");
    const pubNewer = await publishFull({ project: newerProj.dir, now: "2027-01-01T10:00:00",
      notes: "a build released after the updates", licenceFile: licFile, trustedKey: rootPub,
      released: "2027-09-02" });
    const reportNewer = JSON.parse(fs.readFileSync(path.join(pubNewer.archive, REPORT_IN_ARCHIVE), "utf8"));
    const notesNewer = fs.readFileSync(path.join(pubNewer.archive, RELEASE_IN_ARCHIVE), "utf8");
    check(fs.existsSync(pubNewer.ec) && !("watermark" in reportNewer) && !("evaluation" in reportNewer)
          && !/evaluation/i.test(notesNewer),
      "3g and publishFull publishes that build with no mark, and the release notes do not call it an evaluation licence");
    check(editionField(pubNewer) === null,
      "3g2 and the edition carries no evaluation field: " + JSON.stringify(editionField(pubNewer)));
    const plan = await publishPlan(newerProj.dir, { licenceFile: licFile, trustedKey: rootPub,
      released: "2027-09-02" });
    check(plan.licence && plan.licence.status === "active" && plan.licence.canPublish === true
          && plan.licence.paused === false
          && plan.licence.updatesUntil === "2027-09-01" && !("released" in plan.licence)
          && plan.licence.file === path.resolve(licFile) && !("locks" in plan.licence),
      "3h the cover's plan says the same state the publisher acts on, and no lock date:"
      + " " + JSON.stringify(plan.licence));
  });

  /* ---- 4. AN UNUSABLE LICENCE IS NO LICENCE, NAMING THE FILE AND THE REASON (30) ------ */

  await leg("4", async () => {
    const files = {
      unreadable: ["damaged-license.js", "window.E_LICENSE = { not json"],
      empty: ["empty-license.js", ""],
      signature: ["bent-license.js", null],
      format: ["old-license.js", null],
    };
    const bent = JSON.parse(JSON.stringify(good)); bent.org = "Somebody Else";
    const old = await sign(Object.assign({}, payload, { format: 1 }));
    for (const k of Object.keys(files)) {
      const at = path.join(SCRATCH, files[k][0]);
      if (k === "signature") writeLicence(at, bent);
      else if (k === "format") writeLicence(at, old);
      else fs.writeFileSync(at, files[k][1], "utf8");
      files[k] = at;
    }
    const want = { unreadable: "unreadable", empty: "unreadable", signature: "signature",
                   format: "format" };
    const got = {};
    for (const k of Object.keys(files)) {
      const st = await L.licenceState(L.readLicenceFile(files[k]),
        Object.assign({ file: files[k] }, K));
      got[k] = st;
    }
    check(Object.keys(got).every(k => got[k].status === "none" && got[k].canPublish === false && got[k].paused === false
          && got[k].unusable && got[k].unusable.file === path.resolve(files[k])
          && got[k].unusable.reason === want[k]),
      "4a a damaged, an empty, a bent and an old-format file each read as no licence, naming the"
      + " file and the reason: " + JSON.stringify(Object.fromEntries(Object.entries(got)
        .map(([k, s]) => [k, s.status + "/" + (s.unusable || {}).reason]))));
    /* The root key is embedded now, so a copy with no key is a copy of the module with its key line
       planted null, beside a sign.mjs that re-exports the real one (as tests/sellable.mjs plants). */
    const planted = path.join(SCRATCH, "no-key-copy", "src");
    fs.mkdirSync(planted, { recursive: true });
    fs.writeFileSync(path.join(planted, "licence.mjs"), fs.readFileSync(path.join(ROOT, "src", "licence.mjs"), "utf8")
      .replace(/const EMBEDDED_VENDOR_ROOT_KEY = [^;\n]*;/, "const EMBEDDED_VENDOR_ROOT_KEY = null;"));
    fs.writeFileSync(path.join(planted, "sign.mjs"),
      "export * from " + JSON.stringify(pathToFileURL(path.join(ROOT, "src", "sign.mjs")).href) + ";\n");
    const NoKey = await import(pathToFileURL(path.join(planted, "licence.mjs")).href);
    const noKey = await NoKey.licenceState(good, { file: licFile });
    check(NoKey.EMBEDDED_VENDOR_ROOT_KEY === null && noKey.status === "none" && noKey.unusable
          && noKey.unusable.reason === "nokey"
          && /this copy of Etiuda Studio/.test(noKey.unusable.error)
          && !/configured/.test(noKey.unusable.error),
      "4b a genuine licence a copy with no key (planted null) has no key to check reads as no licence,"
      + " and the reason is the program's, not the customer's: " + JSON.stringify(noKey.unusable));
    const none = await L.licenceState(null, {});
    check(none.status === "none" && none.unusable === null,
      "4c CONTROL: no file at all is no licence with nothing unusable to name");

    const proj = await project("proj-unusable", "unusable-cat");
    const e = await refusal(() => publishFull({ project: proj.dir, now: "2026-09-23T10:00:00",
      notes: "over a damaged licence", licenceFile: files.unreadable, trustedKey: rootPub }));
    check(e && !e.said && !/catalog|lint/i.test(e.message) && editions(proj.dir) === 0,
      "4d and a publish over a damaged file refuses, in a sentence that does not read as a catalog fault, and writes nothing: "
      + JSON.stringify(e && e.message));
    const plan = await publishPlan(proj.dir, { licenceFile: files.signature, trustedKey: rootPub });
    check(plan.licence.status === "none" && plan.licence.unusable
          && plan.licence.unusable.reason === "signature"
          && plan.licence.file === path.resolve(files.signature),
      "4e and the cover's plan carries the file and the reason: "
      + JSON.stringify(plan.licence.unusable));
  });

  /* ---- 5. NO LICENCE STOPS: NO PERIOD IS COUNTED FOR IT ------------------------------------- */

  await leg("5", async () => {
    const day = async now => L.licenceState(null, { now, trialFrom: "2026-09-10" });
    const d1 = await day("2026-09-10"), d14 = await day("2026-09-23"), d15 = await day("2026-09-24");
    check(L.TRIAL_DAYS === 14 && [d1, d14, d15].every(s => s.status === "none" && s.canPublish === false
          && s.paused === false && s.trial === null)
          && L.formatLicenceHeader(d14) === "No licence",
      "5a with no licence nothing is open on any day, the first, the fourteenth or the fifteenth, whatever first-run day"
      + " is handed in: " + JSON.stringify([d1.status, d14.status, d15.status]));

    const none = path.join(SCRATCH, "no-licence-none.js");
    const proj = await project("proj-none", "none-cat");
    const before = editions(proj.dir);
    const e = await refusal(() => publishFull({ project: proj.dir, now: "2026-09-23T10:00:00",
      notes: "the fourteenth day", licenceFile: none, trustedKey: rootPub, trialFrom: "2026-09-10" }));
    check(e && /holds no licence/.test(e.message) && editions(proj.dir) === before,
      "5b publishFull with no licence refuses and writes nothing, on what was the fourteenth day too: "
      + JSON.stringify(e && e.message));
    const plan = await publishPlan(proj.dir, { licenceFile: none, trustedKey: rootPub, now: "2026-09-24T10:00:00" });
    check(plan.licence.status === "none" && plan.licence.paused === false
          && plan.licence.canPublish === false && !!plan.lint,
      "5c the cover says there is no licence and its lint is still there: "
      + JSON.stringify([plan.licence.status, plan.licence.paused]));
    const withPub = await project("proj-none-export", "none-export-cat");
    const first = await publishFull({ project: withPub.dir, now: "2026-09-23T10:00:00", notes: "under a licence",
      licenceFile: licFile, trustedKey: rootPub });
    const out = path.join(SCRATCH, "exported-none.ec");
    const exp = exportEdition(withPub.dir, first.edition, out);
    check(exp.bytes > 0 && Buffer.compare(fs.readFileSync(out),
          fs.readFileSync(path.join(withPub.dir, "archive", first.edition, CATALOG_IN_ARCHIVE))) === 0,
      "5d an edition published under a licence still exports byte for byte on a copy that now holds none: " + exp.bytes);
    const bad = path.join(SCRATCH, "none-damaged.js");
    fs.writeFileSync(bad, "not a licence", "utf8");
    const late = await L.licenceState(L.readLicenceFile(bad), { file: bad, now: "2026-09-24", trialFrom: "2026-09-10" });
    check(late.status === "none" && late.unusable && late.unusable.reason === "unreadable"
          && /was not used/.test(L.formatLicenceHeader(late)),
      "5e an unusable file is no licence on every day, and the header still names the file: " + L.formatLicenceHeader(late));
  });

  /* ---- 6. A PACKAGED BUILD HONOURS NOTHING INJECTED (finding 31) ---------------------------- */

  await leg("6", async () => {
    const env = { STUDIO_VENDOR_KEY: rootPub, STUDIO_RELEASED: "2020-01-01" };
    const opts = { trustedKey: rootPub, released: "2020-01-01" };
    const dev = L.contextFor(opts, env, false, "2027-12-31");
    const dEnv = L.contextFor({}, env, false, null);
    const shipped = L.contextFor(opts, env, true, "2027-12-31");
    check(dev.trustedKey === rootPub && dev.released === "2020-01-01"
          && dEnv.trustedKey === rootPub && dEnv.released === "2020-01-01",
      "6a CONTROL: a development tree takes the key and the release date from a caller or from"
      + " STUDIO_VENDOR_KEY and STUDIO_RELEASED, which is how every gate reaches the lock");
    check(shipped.trustedKey === L.EMBEDDED_VENDOR_ROOT_KEY && shipped.released === "2027-12-31",
      "6b a packaged build takes neither: only the embedded key and the date it was packaged"
      + " with: " + JSON.stringify(shipped));
    const inAsar = path.join("C:", "Program Files", "Etiuda Studio", "resources", "app.asar", "src");
    check(L.packagedAt(inAsar) === true && L.packagedAt(path.join(ROOT, "src")) === false
          && L.PACKAGED === false,
      "6c and packaged means the module was loaded out of app.asar, which this tree is not");
  });

  /* ---- 7. THE RELEASE DATE IS FIXED AT PACKAGING -------------------------------------------- */

  await leg("7", async () => {
    const cfgAt = require.resolve("../electron-builder.js");
    const load = envDate => {
      delete require.cache[cfgAt];
      if (envDate == null) delete process.env.ETIUDA_STUDIO_RELEASED;
      else process.env.ETIUDA_STUDIO_RELEASED = envDate;
      try { return require(cfgAt); } finally { delete process.env.ETIUDA_STUDIO_RELEASED; }
    };
    const today = L.localDay();
    const cfg = load(null), pinned = load("2027-03-04");
    check(cfg.extraMetadata && cfg.extraMetadata.released === today
          && pinned.extraMetadata.released === "2027-03-04",
      "7a electron-builder writes the day of packaging into the packaged package.json as"
      + " `released`, or the day ETIUDA_STUDIO_RELEASED names: "
      + JSON.stringify([cfg.extraMetadata, pinned.extraMetadata]));
    let bad = null;
    try { load("next tuesday"); } catch (e) { bad = e.message; }
    check(bad && /ETIUDA_STUDIO_RELEASED/.test(bad),
      "7b and a release date that is not a date refuses the build: " + JSON.stringify(bad));
    const pkgAt = path.join(SCRATCH, "package.json");
    fs.writeFileSync(pkgAt, JSON.stringify({ name: "x", released: "2027-03-04" }));
    check(L.releasedIn(pkgAt) === "2027-03-04"
          && L.releasedIn(path.join(ROOT, "package.json")) === null,
      "7c the running build reads it back from its own package.json, and this tree's has none");
  });

  /* ---- 8. A BUILD RELEASED AFTER THE UPDATES PUBLISHES, AND READ, DIFF, THE AUDIT AND EXPORT STILL WORK ---------- */

  await leg("8", async () => {
    const proj = await project("proj-after", "after-cat");
    const pub = await publishFull({ project: proj.dir, now: "2026-09-23T10:00:00",
      notes: "the edition from inside the twelve months", licenceFile: licFile,
      trustedKey: rootPub, released: "2027-08-31" });
    const second = await publishFull({ project: proj.dir, now: "2026-09-24T10:00:00",
      notes: "the edition from the newer build", licenceFile: licFile, trustedKey: rootPub,
      released: "2027-09-02" });
    const report2 = JSON.parse(fs.readFileSync(path.join(second.archive, REPORT_IN_ARCHIVE), "utf8"));
    check(second.edition !== pub.edition && !("watermark" in report2) && !("evaluation" in report2),
      "8a the build released after the updates publishes on this project, with no mark, and is not paused: "
      + JSON.stringify(Object.keys(report2).filter(k => /evaluation|watermark/.test(k))));
    const back = readProject(proj.dir);
    const diff = await diffEditions(proj.dir, pub.edition, pub.edition);
    const audit = await auditFor(proj.dir, pub.edition);
    const out = path.join(SCRATCH, "exported-after.ec");
    const exp = exportEdition(proj.dir, pub.edition, out);
    check(back.draft.cards.length === 2 && diff.same === true && audit.cards.length === 2
          && exp.bytes > 0 && Buffer.compare(fs.readFileSync(out),
            fs.readFileSync(path.join(proj.dir, "archive", pub.edition, CATALOG_IN_ARCHIVE))) === 0,
      "8b and the project still reads, diffs, audits and exports, byte for byte");
    const notes = fs.readFileSync(path.join(pub.archive, NOTES_IN_ARCHIVE), "utf8");
    check(notes.trim() === "the edition from inside the twelve months",
      "8c the customer's notes are kept byte for byte");
  });

  /* ---- 9. THE VENDOR ROOT KEY IS EMBEDDED, AND ONLY IT (board 742) --------------------------- */

  await leg("9", async () => {
    /* The root's public half as `node tools/sign.mjs show` prints it for keyId etiuda-root. It is
       written out here on purpose: a byte changed in src/licence.mjs must be red, and a test that
       read the constant back would agree with any value. */
    const ROOT_PUBLIC = "f78558260ad75c094052f936326a63bffb1a581ac8b91d898ae1fd01b61127ee";
    check(L.EMBEDDED_VENDOR_ROOT_KEY === ROOT_PUBLIC,
      "9a the embedded vendor root key is the root's public half, byte for byte: "
      + JSON.stringify(L.EMBEDDED_VENDOR_ROOT_KEY));
    const packaged = L.contextFor({ trustedKey: rootPub }, { STUDIO_VENDOR_KEY: rootPub }, true, null);
    const bare = L.contextFor({}, {}, false, null);
    check(packaged.trustedKey === ROOT_PUBLIC && bare.trustedKey === ROOT_PUBLIC,
      "9b a packaged build checks against it whatever is handed in, and a development tree with"
      + " nothing handed in does too: " + JSON.stringify([packaged.trustedKey, bare.trustedKey]));
    const v = await L.verifyLicence(good);
    const st = await L.licenceState(good, { file: licFile });
    check(v.valid === false && v.reason === "signature" && st.status === "none"
          && st.unusable && st.unusable.reason === "signature",
      "9c a genuine licence signed by a throwaway key, with no key handed in, is refused as not the"
      + " root's and reads as no licence: " + JSON.stringify([v.reason, st.status,
        st.unusable && st.unusable.reason]));
    const proj = await project("proj-throwaway", "throwaway-cat");
    const refused = await refusal(() => publishFull({ project: proj.dir, now: "2026-10-20T10:00:00",
      notes: "over a licence the root did not sign", licenceFile: licFile }));
    check(refused && editions(proj.dir) === 0,
      "9d and a publish over it refuses and writes nothing, as with no licence: " + JSON.stringify(refused && refused.message));
    const src = fs.readFileSync(path.join(ROOT, "src", "licence.mjs"), "utf8");
    const above = src.slice(0, src.indexOf("const EMBEDDED_VENDOR_ROOT_KEY"));
    const note = above.slice(above.lastIndexOf("/* THE VENDOR ROOT PUBLIC KEY"));
    check(/etiuda-root/.test(note) && !/Maxim makes it|Until then/.test(note)
          && !/[A-Za-z]:[\\/]|\\|iCloud|key\.json/i.test(note),
      "9e the comment above the key says it is filled, names keyId etiuda-root and holds no path");
  });

  /* ---- 10. A FOLDER, OR A FILE THAT DOES NOT PARSE, IS AN UNUSABLE LICENCE (board 931, condition 9) ----
     A file the system will not open is not this. It is `held`, section 15. */

  await leg("10", async () => {
    /* A file the system will not open cannot be made the same way on every machine, so the read of one path is made to
       fail with the system's own code (EACCES) and every other path reads as it does. The licence in it is a good one, so
       the read alone can be what is wrong. */
    const locked = path.join(SCRATCH, "locked-license.js");
    writeLicence(locked, good);
    const folder = path.join(SCRATCH, "folder-license.js");
    fs.mkdirSync(folder, { recursive: true });
    const damagedAt = path.join(SCRATCH, "damaged-ten-license.js");
    fs.writeFileSync(damagedAt, "window.E_LICENSE = { not json", "utf8");
    /* Since review xi (A1) a held file rests only on a licence this computer verified at that path, so this one is read once
       first, as Studio reads it at its first look; with none verified it is no licence (leg 18, xi1a). */
    await L.licenceState(L.readLicenceFile(locked), Object.assign({ file: locked }, K));
    const realRead = fs.readFileSync;
    const stateOf = async at => {
      let doc, thrown = null;
      try { doc = L.readLicenceFile(at); } catch (e) { thrown = e; }
      return { thrown, doc, st: thrown ? null : await L.licenceState(doc, Object.assign({ file: at }, K)) };
    };
    const unusable = (got, at) => !got.thrown && got.st.status === "none" && got.st.canPublish === false
      && got.st.unusable
      && got.st.unusable.file === path.resolve(at) && got.st.unusable.reason === "unreadable";
    fs.readFileSync = function (p, ...rest) {
      if (typeof p === "string" && path.resolve(p) === path.resolve(locked)) {
        const e = new Error("EACCES: permission denied, open '" + p + "'");
        e.code = "EACCES"; e.errno = -13; e.syscall = "open"; e.path = p;
        throw e;
      }
      return realRead.call(this, p, ...rest);
    };
    try {
      const gLocked = await stateOf(locked), gFolder = await stateOf(folder), gDamaged = await stateOf(damagedAt);
      const SAID = "the file cannot be read as a licence";
      check(!gLocked.thrown && gLocked.st.status === "held" && gLocked.st.paused === false
            && gLocked.st.canPublish === true && !("watermark" in gLocked.st)
            && gLocked.st.unusable == null && L.formatLicenceHeader(gLocked.st) === L.HELD_SAID
            && unusable(gDamaged, damagedAt) && gDamaged.st.unusable.error === SAID,
        "10a a licence file this computer verified, which the system then will not open, is held, not paused, and says it could not be read;"
        + " a file that does not parse is still unusable, in the old sentence: "
        + JSON.stringify(gLocked.thrown ? gLocked.thrown.message : [gLocked.st.status, L.formatLicenceHeader(gLocked.st)]));
      check(unusable(gFolder, folder) && gFolder.st.unusable.error === SAID,
        "10b a folder where the licence file should be is an unusable licence in the same words: "
        + JSON.stringify(gFolder.thrown ? gFolder.thrown.message : gFolder.st.unusable));

      const proj = await project("proj-locked", "locked-cat");
      let pubErr = null, pub = null;
      try { pub = await publishFull({ project: proj.dir, now: "2026-10-20T10:00:00",
        notes: "over a licence file the system will not open", licenceFile: locked, trustedKey: rootPub }); }
      catch (e) { pubErr = e; }
      const report = pub ? JSON.parse(realRead(path.join(pub.archive, REPORT_IN_ARCHIVE), "utf8")) : null;
      const rel = pub ? realRead(path.join(pub.archive, RELEASE_IN_ARCHIVE), "utf8") : "";
      const plan = await publishPlan(proj.dir, { licenceFile: locked, trustedKey: rootPub });
      check(!pubErr && pub && fs.existsSync(pub.ec) && !("evaluation" in report) && !("watermark" in report)
            && !/evaluation/i.test(rel)
            && plan.licence.status === "held" && plan.licence.paused === false && plan.licence.canPublish === true
            && plan.licence.unusable == null && plan.licence.file === path.resolve(locked),
        "10c and a publish over that file the system will not open succeeds with no mark, and the cover's plan"
        + " says held and does not pause: " + JSON.stringify(pubErr ? pubErr.message : [report && Object.keys(report).filter(k => /evaluation|watermark/.test(k)), plan.licence && plan.licence.status]));

      const gone = L.readLicenceFile(path.join(SCRATCH, "no-such-license.js"));
      const fine = L.readLicenceFile(licFile);
      check(gone === null && fine && fine.kind === L.LICENCE_KIND && fine.seats === 2,
        "10d CONTROL: with the failing read in place, a path with nothing at it is still no file and a readable licence"
        + " still reads");

      const notObjects = ["null", "false", "0", "42", "\"text\"", "[]"];
      const results = notObjects.map((txt, i) => {
        const p = path.join(SCRATCH, "lic-not-object-" + i + ".json");
        fs.writeFileSync(p, txt, "utf8");
        return L.readLicenceFile(p);
      });
      const allMalformed = results.every(r => r && r.malformed === true);
      check(allMalformed, "10e a licence file whose JSON is not an object (null, false, 0, 42, a string, an array) reads as a file that cannot be used: " + JSON.stringify(results));

      const assignTexts = ["window.E_LICENSE = null;", "window.E_LICENSE = 42;", "window.E_LICENSE = [];", "window.E_LICENSE = \"text\";"];
      const results2 = assignTexts.map((txt, i) => {
        const p = path.join(SCRATCH, "lic-assign-not-object-" + i + ".js");
        fs.writeFileSync(p, txt, "utf8");
        return L.readLicenceFile(p);
      });
      check(results2.every(r => r && r.malformed === true), "10f a licence file in the window.E_LICENSE = form whose value is not an object (null, 42, an array, a string) reads as a file that cannot be used: " + JSON.stringify(results2));
    } finally { fs.readFileSync = realRead; }
  });

  /* ---- 11. THE COVER'S LICENCE LINE SAYS SEATS, IN BOTH LANGUAGES -------------------------- */

  await leg("11", async () => {
    /* The press painted on tests/page-stand-in.mjs as tests/publish-press.mjs paints it, over the
       plan publishPlan makes from a format-3 licence of four seats. */
    const at = path.join(SCRATCH, "seats-license.js");
    writeLicence(at, await sign({ org: "Fennick Lato", seats: 4, issued: "2026-10-01", updatesUntil: "2027-10-01" }));
    const root = path.join(SCRATCH, "cover-projects");
    fs.mkdirSync(root, { recursive: true });
    const made = await newProject(root, "Cover", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }]);
    const plan = await publishPlan(made.dir, { licenceFile: at, trustedKey: rootPub, released: "2026-10-20" });
    const opened = JSON.parse(JSON.stringify(await openProject(made.dir)));
    const NB = String.fromCharCode(160);
    const said = h => String(h).replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"').replace(/&amp;/g, "&").split(NB).join(" ").replace(/\s+/g, " ").trim();
    const lineIn = uiLang => {
      const home = loadPage({ api: {}, uiLang });
      if (uiLang === "pl") home.sandbox.STUDIO_T.set("pl");
      Object.assign(home.page.S, { open: opened, screen: "project", section: "cards", lang: "en", uiLang, plan,
        planDesks: null, cover: "publish", host: { tour: { offered: true }, langs: builtLangs() } });
      return said((/data-gate="licence">([^]*?)<\/div><\/div>/.exec(home.page.coverHtml()) || [])[1] || "");
    };
    const en = lineIn("en"), pl = lineIn("pl");
    check(plan.licence.seats === 4 && !("persons" in plan.licence)
          && en.indexOf("Fennick Lato, seats: 4, devices per seat: 3, updates until 2027-10-01") >= 0
          && !/person/i.test(en),
      "11a the cover's licence line says the seats in English: " + JSON.stringify(en));
    check(pl.indexOf("Fennick Lato, miejsca: 4, urządzenia na miejsce: 3, aktualizacje do 2027-10-01") >= 0
          && !/osob|stanowisk/i.test(pl),
      "11b and in Polish, a seat being a place and never the desk's word: " + JSON.stringify(pl));
  });

  /* ---- 12. A LICENCE THE ROOT'S DELEGATE SIGNED (licence service S1) --------------------------- */

  /* The root signs online never, so it certifies the licence service's key with an `etiuda-delegation`, the document the
     relay's grants carry, and a licence holds it whole in `via`. The delegations here are signed through the PINNED core's
     own delegationBytes, not through anything of src/licence.mjs, so the oracle is the relay's. The window is the licence's
     own `issued` day against the UTC days of `from` and `until`; today is never an input.

     The legs run through `delegated(M, chk)`, once against the real module and, for the plants, against copies of it with
     one line changed (as tests/sellable.mjs plants its key line). A plant is the line a careless edit would break; its
     copy must turn the leg named red. `LICENCE_PLANT=<name>` runs the legs for real against one plant, to read the FAIL
     line, and `LICENCE_MODULE=<file>` runs them against another module, which is how they read red on main. */
  const CORE = Engine.relayRules().core;
  const svc = crypto.generateKeyPairSync("ed25519"), svc2 = crypto.generateKeyPairSync("ed25519");
  const pubOf = k => k.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  const SVC = { id: "licence-service-test", pub: pubOf(svc) }, SVC2 = { id: "licence-service-two", pub: pubOf(svc2) };
  const DAY = 86400000;
  const FROM = Date.UTC(2026, 0, 10, 15, 0, 0), UNTIL = Date.UTC(2026, 11, 20, 9, 0, 0);
  const delegate = (f, signer) => {
    const d = { kind: "etiuda-delegation", format: 1, key: f.key || SVC, may: f.may || ["licence"],
                from: f.from === undefined ? FROM : f.from, until: f.until === undefined ? UNTIL : f.until,
                sig: { alg: "ed25519", keyId: "etiuda-root" } };
    d.sig.value = crypto.sign(null, CORE.delegationBytes(d), signer || pair.privateKey).toString("hex");
    return d;
  };
  const clone = o => JSON.parse(JSON.stringify(o));

  const delegated = async (M, chk) => {
    const lic = (issued, via, key, kid) => M.createTestLicence(Object.assign({}, payload, { issued, via }),
      (key || svc).privateKey, kid || SVC.id);
    const ok = async (doc, o) => (await M.verifyLicence(doc, Object.assign({}, K, o))).valid === true;
    const why = async (doc, o) => (await M.verifyLicence(doc, Object.assign({}, K, o))).reason;
    const via = delegate({});

    const a = await lic("2026-06-01", via);
    const sa = await M.licenceState(a, Object.assign({ released: "2026-10-01" }, K));
    chk(await ok(a) && sa.status === "active" && sa.canPublish === true && !("evaluation" in sa)
        && sa.org === payload.org && sa.seats === 2,
      "12a a licence signed by a key a root-signed delegation certifies for \"licence\" is accepted, and its state is"
      + " active: " + JSON.stringify([await why(a), sa.status]));

    const onlyGrant = await lic("2026-06-01", delegate({ may: ["relay-grant"] }));
    const both = await lic("2026-06-01", delegate({ may: ["relay-grant", "licence"] }));
    chk(await why(onlyGrant) === "delegation",
      "12b the same with `may` holding only \"relay-grant\" is refused: " + JSON.stringify(await why(onlyGrant)));
    chk(await ok(both),
      "12b2 CONTROL: a `may` holding \"relay-grant\" and \"licence\" is accepted: " + JSON.stringify(await why(both)));

    const before = await lic("2026-01-09", via), first = await lic("2026-01-10", via);
    const last = await lic("2026-12-20", via), after = await lic("2026-12-21", via);
    chk(await why(before) === "delegation",
      "12c1 a licence issued a day before the delegation's `from` is refused: " + JSON.stringify(await why(before)));
    chk(await ok(last),
      "12c2 and one issued on its last day is accepted: " + JSON.stringify(await why(last)));
    chk(await why(after) === "delegation",
      "12c3 and one issued the day after its last day is refused: " + JSON.stringify(await why(after)));
    chk(await ok(first),
      "12c4 CONTROL: one issued on its first day is accepted: " + JSON.stringify(await why(first)));

    const other = crypto.generateKeyPairSync("ed25519");
    const forged = await lic("2026-06-01", delegate({}, other.privateKey));
    chk(await why(forged) === "delegator",
      "12d a delegation the root did not sign (another key signed it) is refused: " + JSON.stringify(await why(forged)));

    const long = await lic("2026-06-01", delegate({ until: FROM + 367 * DAY }));
    const year = await lic("2026-06-01", delegate({ until: FROM + 366 * DAY }));
    chk(await why(long) === "delegation",
      "12e a delegation whose span is over 366 days is refused: " + JSON.stringify(await why(long)));
    chk(await ok(year),
      "12e2 CONTROL: one of exactly 366 days is accepted: " + JSON.stringify(await why(year)));

    const bent = clone(a); bent.via.may = ["licence", "relay-grant"];
    const longer = clone(a); longer.via.until = UNTIL + 10 * DAY;
    /* Under the same key id, so the key id rule (12l) passes and the licence's own signature is what refuses it. */
    const swappedIn = clone(a); swappedIn.via = delegate({ key: { id: SVC.id, pub: SVC2.pub } });
    chk(await why(bent) === "delegator" && await why(longer) === "delegator",
      "12f1 a licence whose `via` was edited after signing (a use added, a window lengthened) is refused: "
      + JSON.stringify([await why(bent), await why(longer)]));
    chk(await why(swappedIn) === "signature",
      "12f2 and so is one given another root-signed delegation, for a key that did not sign it: "
      + JSON.stringify(await why(swappedIn)));
    const wrongKey = await lic("2026-06-01", via, svc2, SVC.id);
    chk(await why(wrongKey) === "signature",
      "12f3 and one signed by a key its delegation does not certify: " + JSON.stringify(await why(wrongKey)));

    const rooted = await sign(payload);
    chk(await ok(rooted) && (await M.licenceState(rooted, Object.assign({ released: "2026-10-01" }, K))).status === "active",
      "12g a root-signed licence with no `via` is accepted as it was: " + JSON.stringify(await why(rooted)));
    const strangerSigned = await M.createTestLicence(Object.assign({}, payload), svc2.privateKey, "not-the-root");
    chk(await why(strangerSigned) === "signature",
      "12m and one with no `via` that another key signed is refused, so a licence made by hand stands on the root's signature alone"
      + " (decision 44): " + JSON.stringify(await why(strangerSigned)));

    const ofNull = await sign(Object.assign({}, payload, { via: null }));
    const ofJunk = await sign(Object.assign({}, payload, { via: "junk" }));
    chk(await ok(ofNull) && await ok(ofJunk),
      "12i a licence the root signed is accepted whatever `via` it carries (null, a string), for none accepted before is"
      + " refused: " + JSON.stringify([await why(ofNull), await why(ofJunk)]));
    const svcNull = await lic("2026-06-01", null), svcJunk = await lic("2026-06-01", "junk");
    chk(await why(svcNull) === "delegation" && await why(svcJunk) === "delegation",
      "12j and one a delegate signed with no usable `via` is refused: "
      + JSON.stringify([await why(svcNull), await why(svcJunk)]));
    /* The test architect's E1 and E2 on S1: a delegation that ends where or before it starts, on one UTC day, covers
       nothing, and a licence whose sig.keyId is not its delegation's key id is refused, both as the relay refuses them. */
    const backwards = delegate({ from: FROM, until: FROM - 3600000 });
    const onItsDay = await lic("2026-01-10", backwards);
    chk(await why(onItsDay) === "delegation",
      "12k a delegation whose until is not after its from covers no day, not even the one both fall on: " + JSON.stringify(await why(onItsDay)));
    const misnamed = await lic("2026-06-01", delegate({}), svc, "licence-service-other");
    chk(await why(misnamed) === "signature",
      "12l a licence signed by the delegated key under another key id than the delegation's is refused: " + JSON.stringify(await why(misnamed)));

    const late = { now: "2027-12-21T10:00:00" };
    const sl = await M.licenceState(a, Object.assign({ released: "2026-10-01" }, K, late));
    chk(await ok(a, late) && await ok(last, late) && sl.status === "active" && sl.canPublish === true,
      "12h a delegated licence checked a year after its delegation ended is still accepted, active and publishing: "
      + JSON.stringify([await why(a, late), sl.status]));

    /* ---- 13. A KEY THE ROOT REVOKED (licence service S6) ---- */
    const other2 = crypto.generateKeyPairSync("ed25519");
    const listOf = (keys, serial, signer) => M.createTestRevocations({ keys, serial }, (signer || pair).privateKey, "etiuda-root");
    const dir13 = path.join(SCRATCH, "revoked-" + Math.random().toString(16).slice(2));
    fs.mkdirSync(dir13, { recursive: true });
    const file13 = path.join(dir13, L.LICENCE_FILE);
    fs.writeFileSync(file13, JSON.stringify(a));
    const keep13 = (r) => fs.writeFileSync(path.join(dir13, L.REVOKED_FILE), JSON.stringify(r));
    keep13(listOf([SVC.pub]));
    const st13 = await M.licenceState(M.readLicenceFile(file13), Object.assign({ file: file13, released: "2026-10-01" }, K));
    chk(await why(a, { file: file13 }) === "revoked" && st13.status === "none" && st13.unusable
        && st13.unusable.reason === "revoked",
      "13a a licence whose delegate's key is on the root-signed list kept beside it is refused revoked, and reads as"
      + " no licence, saying why: " + JSON.stringify([await why(a, { file: file13 }), st13.status, st13.unusable && st13.unusable.reason]));
    /* 13b and 13c beside a licence of their own: beside file13 the list 13a read is seen, and a list once seen there never loses
       a key (review xi, A3; leg 18). They stood beside file13, over 13a's list, before. */
    const dir13b = path.join(SCRATCH, "revoked-other-" + Math.random().toString(16).slice(2));
    fs.mkdirSync(dir13b, { recursive: true });
    const file13b = path.join(dir13b, L.LICENCE_FILE);
    fs.writeFileSync(file13b, JSON.stringify(a));
    const keep13b = (r) => fs.writeFileSync(path.join(dir13b, L.REVOKED_FILE), JSON.stringify(r));
    keep13b(listOf([SVC2.pub]));
    const rootedHere = await sign(payload);
    keep13b(listOf([SVC2.pub, rootPub].sort(), 2));
    chk(await ok(a, { file: file13b }) && await ok(rootedHere, { file: file13b }),
      "13b CONTROL: a list naming other keys (the root's own among them) leaves the licence, and a root-signed one, accepted: "
      + JSON.stringify([await why(a, { file: file13b }), await why(rootedHere, { file: file13b })]));
    const dir13c = path.join(SCRATCH, "revoked-forged-" + Math.random().toString(16).slice(2));
    fs.mkdirSync(dir13c, { recursive: true });
    const file13c = path.join(dir13c, L.LICENCE_FILE);
    fs.writeFileSync(file13c, JSON.stringify(a));
    fs.writeFileSync(path.join(dir13c, L.REVOKED_FILE), JSON.stringify(listOf([SVC.pub], 1, other2)));
    chk(await ok(a, { file: file13c }),
      "13c a list another key signed revokes nothing: " + JSON.stringify(await why(a, { file: file13c })));
    chk(await why(a, { revoked: [SVC.pub] }) === "revoked" && await ok(a, { revoked: [] }),
      "13d a list handed in stands in for the kept one: " + JSON.stringify([await why(a, { revoked: [SVC.pub] }), await why(a, { revoked: [] })]));
    const l2 = listOf([SVC.pub], 2), l3 = listOf([SVC.pub, SVC2.pub].sort(), 3), l3less = listOf([SVC2.pub], 4);
    const l1 = listOf([SVC.pub, SVC2.pub].sort(), 1), forgedList = listOf([SVC.pub, SVC2.pub].sort(), 9, other2);
    const t = (k, n) => M.laterRevocations(k, n, rootPub);
    chk(t(null, l2).take === true && t(l2, l3).take === true && t(l3, l2).why === "older" && t(l3, l1).why === "older"
        && t(l3, l3less).why === "fewer" && t(l3, forgedList).why === "unsigned" && t(l3, null).take === false
        && t(l3, l3).why === "same",
      "13e the kept list never rolls back: a higher serial naming every kept key is taken; an older serial, one that drops a"
      + " key, one the root did not sign, or none, is not: " + JSON.stringify([t(null, l2), t(l2, l3), t(l3, l2), t(l3, l1),
        t(l3, l3less), t(l3, forgedList), t(l3, null), t(l3, l3)].map(x => x.why || x.take)));
    /* A list that held, taken as the quiet check takes it (licence-client.mjs take), is not cleared by its file deleted, broken or
       put back older: Grok's review 15, finding 2. Nothing kept at all still revokes nothing (13b). */
    const Cl = await import(pathToFileURL(path.join(ROOT, "src", "licence-client.mjs")).href);
    const dir13f = path.join(SCRATCH, "revoked-kept-" + Math.random().toString(16).slice(2));
    fs.mkdirSync(dir13f, { recursive: true });
    const file13f = path.join(dir13f, L.LICENCE_FILE), side13f = path.join(dir13f, L.REVOKED_FILE);
    fs.writeFileSync(file13f, JSON.stringify(a));
    const took13f = await Cl.take({ revoked: listOf([SVC.pub], 5) }, { licenceFile: file13f, trustedKey: rootPub });
    const held13f = await why(a, { file: file13f });
    fs.rmSync(side13f, { force: true });
    const deleted13f = await why(a, { file: file13f });
    /* The files' own list, apart from what this process has seen (review xi, A3): the copy still holds it after a restart. */
    const disk13f = M.diskRevocations ? M.diskRevocations(file13f, rootPub) : null;
    fs.writeFileSync(side13f, "{");
    const broken13f = await why(a, { file: file13f });
    fs.writeFileSync(side13f, JSON.stringify(listOf([SVC2.pub], 1)));
    const older13f = await why(a, { file: file13f });
    chk(took13f.revoked === "kept" && held13f === "revoked" && deleted13f === "revoked" && broken13f === "revoked" && older13f === "revoked"
        && !!disk13f && disk13f.serial === 5,
      "13f a list the quiet check took still revokes with its file deleted, broken, or put back as an older list, and its copy"
      + " on disk still holds it: " + JSON.stringify([took13f.revoked, held13f, deleted13f, broken13f, older13f, disk13f && disk13f.serial]));
    /* Grok's review 15, finding 4: a licence file past the cap is refused as unusable before it is read or canonicalised. */
    const cap12n = M.LICENCE_FILE_MAX || 1024 * 1024, big12n = path.join(dir13f, "big-" + L.LICENCE_FILE);
    fs.writeFileSync(big12n, JSON.stringify(Object.assign({}, a, { pad: "x".repeat(cap12n) })));
    const bigRead = M.readLicenceFile(big12n), plainRead = M.readLicenceFile(file13f);
    chk(!!bigRead && bigRead.malformed === true && !!plainRead && plainRead.kind === a.kind && !plainRead.malformed,
      "13g a licence file over LICENCE_FILE_MAX (" + cap12n + " bytes) reads as a file that cannot be used, and one under it reads: "
      + JSON.stringify([bigRead && (bigRead.malformed ? "malformed" : bigRead.kind), plainRead && plainRead.kind]));
  };

  /* One line of src/licence.mjs, changed. `reds` are the legs that must read red against the copy. */
  const PLANTS = [
    { name: "via-ignored", reds: ["12a", "12c2", "12h"],
      from: "if (doc.via === undefined) return invalid(\"signature\"); /* plant:via-absent */", to: "return invalid(\"signature\");" },
    { name: "may-unchecked", reds: ["12b"],
      from: "if (!d.may.includes(\"licence\")) return false; /* plant:via-may */", to: "" },
    { name: "window-from", reds: ["12c1"], from: "return first <= issued && issued <= last;", to: "return issued <= last;" },
    { name: "window-last-day", reds: ["12c2"], from: "return first <= issued && issued <= last;",
      to: "return first <= issued && issued < last;" },
    { name: "window-until", reds: ["12c3"], from: "return first <= issued && issued <= last;", to: "return first <= issued;" },
    { name: "root-unchecked", reds: ["12d", "12f1"],
      from: "if (!rules.signedBy(doc.via, trusted)) return invalid(\"delegator\"); /* plant:via-root */", to: "" },
    { name: "span-unchecked", reds: ["12e"],
      from: "if (d.until - d.from > rules.maxMs) return false; /* plant:via-span */", to: "" },
    { name: "licence-unsigned", reds: ["12f2", "12f3"],
      from: "if (!await verifySignature(doc, doc.via.key.pub)) return invalid(\"signature\"); /* plant:via-licence */", to: "" },
    { name: "root-skipped", reds: ["12g", "12i"],
      from: "if (await verifySignature(doc, trusted)) return { valid: true, reason: null, error: null, root: true }; /* plant:root-first */", to: "" },
    /* The hand-signed licence, the emergency route (decision 44): a root-first line that skips the root's signature takes any file. */
    { name: "root-unverified", reds: ["12m"],
      from: "if (await verifySignature(doc, trusted)) return { valid: true, reason: null, error: null, root: true }; /* plant:root-first */",
      to: "if (doc.via === undefined || await verifySignature(doc, trusted)) return { valid: true, reason: null, error: null };" },
    { name: "root-refuses-via", reds: ["12i"], from: "if (await verifySignature(doc, trusted)) return {",
      to: "if (doc.via === undefined && await verifySignature(doc, trusted)) return {" },
    { name: "via-falsy", reds: ["12j"], from: "if (doc.via === undefined) return invalid(\"signature\"); /* plant:via-absent */",
      to: "if (!doc.via) return invalid(\"signature\");" },
    { name: "order-unchecked", reds: ["12k"], from: "if (d.until <= d.from) return false; /* plant:via-order */", to: "" },
    { name: "keyid-unchecked", reds: ["12l"],
      from: "if (!doc.sig || doc.sig.keyId !== doc.via.key.id) return invalid(\"signature\"); /* plant:via-key */", to: "" },
    { name: "window-today", reds: ["12h"], from: "delegationCovers(doc.via, doc.issued, rules)",
      to: "delegationCovers(doc.via, String((o && o.now) || new Date().toISOString()).slice(0, 10), rules)" },
    { name: "revoked-ignored", reds: ["13a", "13d"],
      from: "if (revokedOf(o, trusted).includes(doc.via.key.pub)) return invalid(\"revoked\"); /* plant:revoked */", to: "" },
    { name: "revoked-unsigned", reds: ["13c", "13e"],
      from: "return crypto.verify(null, revocationBytes(r), key, Buffer.from(r.sig.value, \"hex\")); /* plant:revoked-sig */", to: "return true;" },
    { name: "revoked-rollback", reds: ["13e"],
      from: "if (next.serial <= kept.serial) return { take: false, why: \"older\" }; /* plant:revoked-serial */", to: "" },
    { name: "revoked-copy-unread", reds: ["13f"],
      from: "copy = readRevocations(revokedCopyFor(licenceFile), trusted); /* plant:revoked-copy */", to: "" },
    { name: "licence-size-unchecked", reds: ["13g"],
      from: "if (fs.statSync(at).size > LICENCE_FILE_MAX) { const err = new Error(\"too large\"); err.code = \"EFBIG\"; throw err; } /* plant:licence-size */", to: "" },
    { name: "revoked-shrinks", reds: ["13e"],
      from: "if (!kept.keys.every(k => next.keys.includes(k))) return { take: false, why: \"fewer\" }; /* plant:revoked-fewer */", to: "" },
  ];
  const plantedModule = async name => {
    const p = PLANTS.find(x => x.name === name);
    if (!p) throw new Error("no plant named " + name);
    const real = fs.readFileSync(path.join(ROOT, "src", "licence.mjs"), "utf8");
    const next = plantText(real, p.from, p.to, "src/licence.mjs");
    const dir = path.join(SCRATCH, "plant-" + name, "src");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "licence.mjs"), next);
    fs.writeFileSync(path.join(dir, "sign.mjs"),
      "export * from " + JSON.stringify(pathToFileURL(path.join(ROOT, "src", "sign.mjs")).href) + ";\n");
    return import(pathToFileURL(path.join(dir, "licence.mjs")).href + "?plant=" + name);
  };

  const wantPlant = process.env.LICENCE_PLANT, wantModule = process.env.LICENCE_MODULE;
  if (wantPlant || wantModule) {
    await leg("12", async () => delegated(wantPlant ? await plantedModule(wantPlant)
      : await import(pathToFileURL(path.resolve(wantModule)).href), check));
  } else {
    await leg("12", async () => {
      await delegated(L, check);
      for (const p of PLANTS) {
        if (PLANTS_OFF) { skip("12p plant " + p.name + " turns " + p.reds.join(" and ") + " red (ETIUDA_PLANTS=off)"); continue; }
        const seen = [];
        await delegated(await plantedModule(p.name), (cond, line) => { if (!cond) seen.push(String(line).split(" ")[0]); });
        check(p.reds.every(id => seen.includes(id)),
          "12p plant " + p.name + " turns " + p.reds.join(" and ") + " red: " + JSON.stringify(seen));
      }
    });
  }

  /* ---- 14. A TRIAL IS A SIGNED LICENCE THAT ENDS BY THE CLOCK ---------------------------------------------------------
     The record: "trials are signed licences too" (2026-09-24 02:03; 2026-10-06 21:26), and "With a lapsed, absent or
     unusable licence, or after the trial, Publish, reading statistics and taking proposals pause with one calm sentence;
     editing, lint and export stay open" (2026-09-24 02:01; 2026-09-24 02:03). The legs on the state run through
     `trialled(M, chk)`, against the real module and the plants below, as leg 12's do; the publish legs on the real one. */
  const ENDS = Date.UTC(2026, 5, 15, 9, 0, 0), HOUR = 3600000;
  const trialled = async (M, chk) => {
    const TV = delegate({});
    const tri = f => M.createTestTrialLicence(Object.assign({ issued: "2026-06-01", ends: ENDS, via: TV }, f), svc.privateKey, SVC.id);
    const why = async doc => (await M.verifyLicence(doc, K)).reason;
    const st = (doc, o) => M.licenceState(doc, Object.assign({ released: "2026-10-01" }, K, o));
    const t = await tri({});
    const during = await st(t, { now: ENDS - HOUR });
    chk(await why(t) === null && t.kind === M.TRIAL_KIND && during.status === "trial" && during.canPublish === true
        && !("evaluation" in during) && !("watermark" in during) && during.paused === false && during.trial.ends === ENDS,
      "14a a trial's licence the delegated key signed, an hour before its end, is a licence: it publishes, with no mark: "
      + JSON.stringify([await why(t), during.status]));
    const ended = await st(t, { now: ENDS });
    chk(ended.status === "trial-ended" && ended.canPublish === false && ended.paused === true
        && !("evaluation" in ended),
      "14b at its end, by the clock, it is the trial ended: publishing and the rest paused: "
      + JSON.stringify([ended.status, ended.canPublish, ended.paused]));
    const early = Date.UTC(2026, 5, 2);
    const reissued = await tri({ issued: "2026-06-16" });
    const byIssued = await st(reissued, { now: early });
    /* Was a last edition's name handed in as lastEdition; since review xi (A4, B6) the newest time this computer has seen. */
    const anchored = Date.UTC(2026, 5, 1);
    const byEdition = await st(t, { now: early, seen: { floor: Date.UTC(2026, 5, 16), anchor: anchored } });
    const stillOn = await st(t, { now: early, seen: { floor: Date.UTC(2026, 5, 10), anchor: anchored } });
    chk(byIssued.status === "trial-ended" && byEdition.status === "trial-ended" && stillOn.status === "trial",
      "14c with the clock set back inside the trial, a licence issued after its end, or a time this computer has already seen"
      + " after it, still reads ended; a time seen inside the trial leaves it on: " + JSON.stringify([byIssued.status, byEdition.status, stillOn.status]));
    const bent = clone(t); bent.ends = ENDS + 365 * DAY;
    chk(await why(bent) === "signature",
      "14d its end is inside its signature: an end moved by hand fails on it: " + JSON.stringify(await why(bent)));
    const asFull = await tri({ updatesUntil: "2099-01-01" }), seated = await tri({ seats: 3 }), f2 = await tri({ format: 2 });
    const noEnd = await tri({ ends: undefined }), dayEnd = await tri({ ends: "2026-06-15" });
    const fullEnds = await sign(Object.assign({}, payload, { ends: Date.UTC(2026, 0, 1) }));
    const fe = await st(fullEnds, { now: "2041-01-01T10:00:00Z" });
    chk(await why(asFull) === "unreadable" && await why(seated) === "unreadable" && await why(f2) === "format"
        && await why(noEnd) === "unreadable" && await why(dayEnd) === "unreadable"
        && fe.status === "active" && fe.canPublish === true && fe.paused === false && fe.trial === null,
      "14e one shape per form: a trial's licence carrying an updates date or seats, of another format, or with no end in ms, is"
      + " not one; and a full licence carrying an `ends` is read exactly as before, active in 2041: "
      + JSON.stringify([await why(asFull), await why(seated), await why(f2), await why(noEnd), await why(dayEnd), fe.status]));
    const newer = await st(t, { now: ENDS - HOUR, released: "2099-01-01" });
    chk(newer.status === "trial" && newer.canPublish === true,
      "14f no release date locks a trial's licence, which states no updates: " + newer.status);
    chk(M.formatLicenceHeader(during) === "Trial licence until 2026-06-15"
        && /^The trial ended on 2026-06-15 · publishing, reading statistics and taking proposals are paused$/.test(M.formatLicenceHeader(ended)),
      "14g the header says the trial's licence and its end, and after it the pause: "
      + JSON.stringify([M.formatLicenceHeader(during), M.formatLicenceHeader(ended)]));
  };
  const TRIAL_PLANTS = [
    { name: "trial-forever", reds: ["14b", "14c"], from: "const over = at >= doc.ends; /* plant:trial-over */", to: "const over = false;" },
    { name: "trial-clock-today", reds: ["14c"],
      from: "if (Number.isFinite(t)) at = Math.max(at, t); /* plant:trial-floor */", to: "" },
    { name: "trial-any-shape", reds: ["14e"], from: "if (!trialShapeOk(doc)) return invalid(\"unreadable\"); /* plant:trial-shape */", to: "" },
    { name: "trial-unknown", reds: ["14a"], from: "(doc.kind !== LICENCE_KIND && doc.kind !== TRIAL_KIND)", to: "doc.kind !== LICENCE_KIND" },
  ];
  const plantedTrial = async p => {
    const real = fs.readFileSync(path.join(ROOT, "src", "licence.mjs"), "utf8");
    const next = plantText(real, p.from, p.to, "src/licence.mjs");
    const dir = path.join(SCRATCH, "plant-" + p.name, "src");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "licence.mjs"), next);
    fs.writeFileSync(path.join(dir, "sign.mjs"),
      "export * from " + JSON.stringify(pathToFileURL(path.join(ROOT, "src", "sign.mjs")).href) + ";\n");
    return import(pathToFileURL(path.join(dir, "licence.mjs")).href + "?plant=" + p.name);
  };
  const wantTrialPlant = process.env.LICENCE_TRIAL_PLANT;
  await leg("14", async () => {
    if (wantTrialPlant) { await trialled(await plantedTrial(TRIAL_PLANTS.find(x => x.name === wantTrialPlant)), check); return; }
    await trialled(L, check);
    for (const p of TRIAL_PLANTS) {
      if (PLANTS_OFF) { skip("14p plant " + p.name + " turns " + p.reds.join(" and ") + " red (ETIUDA_PLANTS=off)"); continue; }
      const seen = [];
      await trialled(await plantedTrial(p), (cond, line) => { if (!cond) seen.push(String(line).split(" ")[0]); });
      check(p.reds.every(id => seen.includes(id)), "14p plant " + p.name + " turns " + p.reds.join(" and ") + " red: " + JSON.stringify(seen));
    }

    /* Publishing acts on it: the trial's licence file as the service writes it, beside the project. */
    const TV = delegate({});
    const trialFile = path.join(SCRATCH, "trial-license.js");
    /* Signed by the root, the one narrow path publishing still takes from a file (Max, 2026-11-22 15:37); it was the service's, which
       publishing no longer reads (xi8a). */
    writeLicence(trialFile, await L.createTestTrialLicence({ issued: "2026-06-01", ends: ENDS }, pair.privateKey, "vendor-root-test"));
    const proj = await project("proj-trial", "trial-cat");
    const pub = await publishFull({ project: proj.dir, now: "2026-06-15T07:00:00Z", notes: "inside the trial",
      licenceFile: trialFile, trustedKey: rootPub, released: "2026-10-01" });
    const report = JSON.parse(fs.readFileSync(path.join(pub.archive, REPORT_IN_ARCHIVE), "utf8"));
    const rel = fs.readFileSync(path.join(pub.archive, RELEASE_IN_ARCHIVE), "utf8");
    check(fs.existsSync(pub.ec) && !("evaluation" in report) && !("watermark" in report) && !/evaluation/i.test(rel),
      "14h publishFull under the trial's licence, two hours before its end, publishes with no mark: "
      + JSON.stringify(Object.keys(report).filter(k => /evaluation|watermark/.test(k))));
    const before = editions(proj.dir), ecBefore = fs.readFileSync(pub.ec);
    const e = await refusal(() => publishFull({ project: proj.dir, now: "2026-06-15T10:00:00Z", notes: "after the trial",
      licenceFile: trialFile, trustedKey: rootPub, released: "2026-10-01" }));
    check(e && e.said && e.said.frame === L.TRIAL_PAUSED && e.said.vars.DATE === "2026-06-15" && editions(proj.dir) === before
        && Buffer.compare(fs.readFileSync(pub.ec), ecBefore) === 0
        && /^The trial ended on 2026-06-15\. Publishing, statistics and proposals are paused until a licence is bought; editing, checks and export stay open\. Signing in then brings the licence here\.$/.test(e.message),
      "14i an hour after its end publishFull refuses in the one calm sentence, a frame the page says in Polish, and writes nothing: "
      + JSON.stringify(e && e.message));
    const plan = await publishPlan(proj.dir, { licenceFile: trialFile, trustedKey: rootPub, released: "2026-10-01" });
    const out = path.join(SCRATCH, "exported-trial.ec");
    const exp = exportEdition(proj.dir, pub.edition, out);
    const diff = await diffEditions(proj.dir, pub.edition, pub.edition);
    check(plan.licence.status === "trial-ended" && plan.licence.paused === true && plan.licence.canPublish === false
        && !!plan.lint && exp.bytes > 0 && diff.same === true
        && Buffer.compare(fs.readFileSync(out), fs.readFileSync(path.join(proj.dir, "archive", pub.edition, CATALOG_IN_ARCHIVE))) === 0,
      "14j after it the cover's plan says the trial ended and paused, its lint still there, and the edition still diffs and exports,"
      + " byte for byte: " + JSON.stringify([plan.licence.status, plan.licence.paused, exp.bytes]));
    /* The clock set back after an edition dated past the end: published under a paid licence, the trial's file put back. */
    const proj2 = await project("proj-trial-back", "trial-back-cat");
    await publishFull({ project: proj2.dir, now: "2026-06-20T10:00:00Z", notes: "a paid licence, after the trial",
      licenceFile: licFile, trustedKey: rootPub, released: "2026-10-01" });
    const n2 = editions(proj2.dir);
    /* The shell's floor saw that publish (review xi, A4), and hands it in; the archive folder's name is no longer read (B6). */
    const seen2 = { floor: Date.parse("2026-06-20T10:00:00Z"), anchor: Date.parse("2026-09-01T00:00:00Z") };
    const e2 = await refusal(() => publishFull({ project: proj2.dir, now: "2026-06-10T10:00:00Z", notes: "the clock set back",
      licenceFile: trialFile, trustedKey: rootPub, released: "2026-10-01", seen: seen2 }));
    const plan2 = await publishPlan(proj2.dir, { licenceFile: trialFile, trustedKey: rootPub, released: "2026-10-01", now: "2026-06-10T10:00:00Z", seen: seen2 });
    check(e2 && e2.said && e2.said.frame === L.TRIAL_PAUSED && editions(proj2.dir) === n2 && plan2.licence.status === "trial-ended",
      "14k with the clock set back to inside the trial after this computer published past its end (the floor the shell hands in),"
      + " the publish still refuses, and the cover says so: " + JSON.stringify([e2 && e2.message, plan2.licence.status]));
  });

  /* ---- 15. A FILE THE SYSTEM WILL NOT OPEN IS HELD, AND IT DOES NOT PAUSE ---------------------------
     EPERM, EACCES and EBUSY are asked again for half a second, as renamePatiently does. Still held over a
     licence this computer verified there (review xi, A1; leg 18 for none verified), the
     state is `held`: publishing stays open, and the licence line says the
     file could not be read. A file that frees on a later try within that half-second is the licence it
     holds. Read as no licence it would stop. */

  await leg("15", async () => {
    const SAID = "The licence file could not be read just now, perhaps because another program has it open."
      + " Publishing goes on as normal, and Studio tries again at its next look.";
    const NOW = "2026-10-26";
    const busyAt = path.join(SCRATCH, "held-busy-license.js");
    const freeAt = path.join(SCRATCH, "held-frees-license.js");
    writeLicence(busyAt, good);
    writeLicence(freeAt, good);
    const realRead = fs.readFileSync;
    const opts = { trustedKey: rootPub, now: NOW };
    /* `freeAfter` is how many reads still throw. Null throws on every read. */
    const stub = (at, code, freeAfter) => {
      let reads = 0;
      fs.readFileSync = function (p, ...rest) {
        if (typeof p === "string" && path.resolve(p) === path.resolve(at)) {
          reads += 1;
          if (freeAfter == null || reads <= freeAfter) {
            const err = new Error(code + ": permission denied, open '" + p + "'");
            err.code = code; err.errno = -1; err.syscall = "open"; err.path = p;
            throw err;
          }
        }
        return realRead.call(this, p, ...rest);
      };
      return () => reads;
    };
    const pageLine = (st, file) => {
      const home = loadPage({ api: {}, uiLang: "en" });
      const said = home.page.licenceSaid({
        status: st.status, paused: st.paused, canPublish: st.canPublish, file,
        trial: st.trial, unusable: st.unusable,
      });
      return String(said && said.v || "").replace(/<[^>]*>/g, "");
    };

    /* Read once first, as Studio reads it at its first look: since review xi (A1) a held file rests only on a licence this
       computer verified at that path (leg 18). */
    await L.licenceState(L.readLicenceFile(busyAt), Object.assign({ file: busyAt }, opts));
    const countBusy = stub(busyAt, "EBUSY", null);
    let stBusy = null, line = "", pubErr = null, pub = null, plan = null, report = null, afterRead = 0;
    try {
      const doc = L.readLicenceFile(busyAt);
      afterRead = countBusy();
      stBusy = await L.licenceState(doc, Object.assign({ file: busyAt }, opts));
      line = pageLine(stBusy, path.resolve(busyAt));
      const proj = await project("proj-held", "held-cat");
      try {
        pub = await publishFull({ project: proj.dir, now: NOW + "T10:00:00", notes: "over a held licence",
          licenceFile: busyAt, trustedKey: rootPub });
      } catch (e) { pubErr = e; }
      if (pub) report = JSON.parse(realRead(path.join(pub.archive, REPORT_IN_ARCHIVE), "utf8"));
      plan = await publishPlan(proj.dir, { licenceFile: busyAt, trustedKey: rootPub,
        now: NOW + "T10:00:00" });
    } finally { fs.readFileSync = realRead; }
    const rel = pub ? realRead(path.join(pub.archive, RELEASE_IN_ARCHIVE), "utf8") : "";
    check(afterRead === 10 && stBusy && stBusy.status === "held" && stBusy.paused === false
          && stBusy.canPublish === true && !("watermark" in stBusy) && !("evaluation" in stBusy)
          && stBusy.trial == null && L.HELD_SAID === SAID && L.formatLicenceHeader(stBusy) === SAID
          && line === SAID && !pubErr && report && !("evaluation" in report) && !("watermark" in report)
          && !/evaluation/i.test(rel)
          && plan && plan.licence.status === "held" && plan.licence.paused === false && plan.licence.canPublish === true,
      "15a a valid licence this computer verified, then held with EBUSY, is not paused or stopped; it publishes with"
      + " no mark and no note of one, and the licence line says the file could not be read: "
      + JSON.stringify({ reads: afterRead, status: stBusy && stBusy.status, paused: stBusy && stBusy.paused, line,
        pub: pubErr ? pubErr.message : (report && Object.keys(report).filter(k => /evaluation|watermark/.test(k))) }));
    check(editionField(pub) === null,
      "15f a held publish writes no evaluation field, so no desk is marked for a file another program had open: "
      + JSON.stringify(editionField(pub)));

    const countFree = stub(freeAt, "EBUSY", 2);
    let stFree = null, docFree = null;
    try {
      docFree = L.readLicenceFile(freeAt);
      stFree = await L.licenceState(docFree, Object.assign({ file: freeAt }, opts));
    } finally { fs.readFileSync = realRead; }
    check(countFree() === 3 && docFree && docFree.kind === L.LICENCE_KIND && docFree.seats === 2
          && stFree && stFree.status === "active" && stFree.paused === false && stFree.canPublish === true
          && !("watermark" in stFree),
      "15b a file held for two reads and free on the third is read within the half-second, and the licence"
      + " stands: "
      + JSON.stringify({ reads: countFree(), kind: docFree && docFree.kind, status: stFree && stFree.status,
        paused: stFree && stFree.paused }));

    const wordAt = path.join(SCRATCH, "held-word-license.js");
    fs.writeFileSync(wordAt, "{\"held\":true}\n", "utf8");
    const wordDoc = L.readLicenceFile(wordAt);
    const wordSt = await L.licenceState(wordDoc, Object.assign({ file: wordAt }, opts));
    check(wordDoc && wordDoc.held === true && wordDoc.kind == null && wordSt.status === "none"
          && wordSt.paused === false && wordSt.canPublish === false,
      "15c a file that reads, and is not a licence, is no licence, even when its text"
      + " carries the word held: " + (wordSt && wordSt.status));

    if (PLANTS_OFF) {
      skip("15p plant held-open, which reads a held file as no licence, stops a copy with a good licence another program has open (ETIUDA_PLANTS=off)");
      skip("15q plant held-retry, which gives up on the first refusal, does not read a file that frees on the third try (ETIUDA_PLANTS=off)");
      return;
    }
    const src = realRead(path.join(ROOT, "src", "licence.mjs"), "utf8");
    /* Since review xi (A1) the line opens a held file over a licence verified there; the plant reads it as no licence. */
    const openLine = "    if (again.status === \"trial\" || again.status === \"active\") return heldOpen(again.root === true); /* plant:held-open */";
    const onceOpen = src.split(openLine).length === 2;
    const openDir = path.join(SCRATCH, "plant-held-open", "src");
    fs.mkdirSync(openDir, { recursive: true });
    fs.writeFileSync(path.join(openDir, "licence.mjs"), onceOpen ? src.split(openLine).join("    return unreadHeld(file); /* plant:held-open */") : src);
    fs.writeFileSync(path.join(openDir, "sign.mjs"),
      "export * from " + JSON.stringify(pathToFileURL(path.join(ROOT, "src", "sign.mjs")).href) + ";\n");
    const PlantedOpen = onceOpen
      ? await import(pathToFileURL(path.join(openDir, "licence.mjs")).href + "?plant=held-open") : null;
    let stuck = null;
    if (PlantedOpen) {
      await PlantedOpen.licenceState(PlantedOpen.readLicenceFile(busyAt), Object.assign({ file: busyAt }, opts));
      stub(busyAt, "EBUSY", null);
      try {
        stuck = await PlantedOpen.licenceState(PlantedOpen.readLicenceFile(busyAt),
          Object.assign({ file: busyAt }, opts));
      } finally { fs.readFileSync = realRead; }
    }
    check(onceOpen && stuck && stuck.canPublish === false && stuck.status === "none",
      "15p plant held-open, which reads a held file as no licence, stops a copy with a good licence another program has open: "
      + (stuck ? stuck.status + " canPublish=" + stuck.canPublish : "the line is not in src/licence.mjs once"));

    const retryLine = "      if (i >= TRIES || !e || BUSY.indexOf(e.code) < 0) throw e; /* plant:held-retry */";
    const onceRetry = src.split(retryLine).length === 2;
    const retryDir = path.join(SCRATCH, "plant-held-retry", "src");
    fs.mkdirSync(retryDir, { recursive: true });
    fs.writeFileSync(path.join(retryDir, "licence.mjs"),
      onceRetry ? src.split(retryLine).join("      throw e; /* plant:held-retry */") : src);
    fs.writeFileSync(path.join(retryDir, "sign.mjs"),
      "export * from " + JSON.stringify(pathToFileURL(path.join(ROOT, "src", "sign.mjs")).href) + ";\n");
    const PlantedRetry = onceRetry
      ? await import(pathToFileURL(path.join(retryDir, "licence.mjs")).href + "?plant=held-retry") : null;
    let missed = null, missedReads = 0;
    if (PlantedRetry) {
      const countMiss = stub(freeAt, "EBUSY", 2);
      try {
        const missedDoc = PlantedRetry.readLicenceFile(freeAt);
        missed = await PlantedRetry.licenceState(missedDoc, Object.assign({ file: freeAt }, opts));
        missedReads = countMiss();
      } finally { fs.readFileSync = realRead; }
    }
    check(onceRetry && missed && missed.status !== "active" && missedReads === 1,
      "15q plant held-retry, which gives up on the first refusal, does not read a file that frees on the third try: "
      + JSON.stringify({ reads: missedReads, status: missed && missed.status }));
  });

  /* ---- 16. A PAID LICENCE STATING ITS PAID END STOPS AT THAT END (review 4, finding 1) --------------------------------
     From piece S-0 the licence service states `paidUntil` (ms) on every paid licence (Max, 2026-11-17 20:41, "I agree with your
     recommendation", to a paid licence that ends stopping Studio as it stops the desk). Until its paid end (or with no
     paidUntil, an older shape) it reads active as before; from its paid end (or after its last paid day when given as YYYY-MM-DD)
     it is `paid-ended`, paused and cannot publish. Run against the real module and the plants below (LICENCE_PAID_PLANT=<name>
     runs one and prints its FAIL lines). */
  const PAID_AT = Date.UTC(2027, 0, 1);
  const paidRead = async (M, chk) => {
    const withEnd = await sign(Object.assign({}, payload, { paidUntil: PAID_AT }));
    const v = await M.verifyLicence(withEnd, K), v0 = await M.verifyLicence(good, K);
    chk(v.valid === true && v0.valid === true && withEnd.paidUntil === PAID_AT,
      "16a a paid licence carrying paidUntil is a licence, as the same licence without it is: " + JSON.stringify([v.reason, v0.reason]));
    const st = (doc, now, extra) => M.licenceState(doc, Object.assign({ released: "2026-10-01", now }, K, extra || {}));
    const before = [await st(withEnd, PAID_AT - DAY), await st(good, PAID_AT - DAY)];
    const atEnd = await st(withEnd, PAID_AT);
    const after = [await st(withEnd, PAID_AT + 400 * DAY), await st(good, PAID_AT + 400 * DAY)];
    chk(before[0].status === "active" && before[0].canPublish === true && before[0].paused === false
          && JSON.stringify(before[0]) === JSON.stringify(before[1])
          && atEnd.status === "paid-ended" && atEnd.canPublish === false && atEnd.paused === true
          && after[0].status === "paid-ended" && after[0].canPublish === false && after[0].paused === true
          && after[0].paidUntil === M.localDay(new Date(PAID_AT))
          && after[1].status === "active" && after[1].canPublish === true && after[1].paused === false,
      "16b before its paid end a paid file is active and reads as one without it; at and after its paid end it is paid-ended,"
      + " paused and cannot publish, while one without paidUntil stays active: "
      + JSON.stringify([before[0].status, atEnd.status, after[0].status, after[1].status]));

    const withDay = await sign(Object.assign({}, payload, { paidUntil: "2027-01-01" }));
    const onLast = await st(withDay, "2027-01-01");
    const onLastLate = await st(withDay, "2027-01-01T23:00:00Z");
    const afterDay = await st(withDay, "2027-01-02");
    const hdr = M.formatLicenceHeader(afterDay);
    chk(onLast.status === "active" && onLast.canPublish === true && onLast.paused === false
          && onLastLate.status === "active" && onLastLate.canPublish === true && onLastLate.paused === false
          && afterDay.status === "paid-ended" && afterDay.canPublish === false && afterDay.paused === true
          && afterDay.paidUntil === "2027-01-01"
          && /^The paid period ended on 2027-01-01 · publishing, reading statistics and taking proposals are paused$/.test(hdr),
      "16c a paid file with a day-string paidUntil stays active on its last paid day and is paid-ended the next day, with its header line: "
      + JSON.stringify([onLast.status, onLastLate.status, afterDay.status, hdr]));

    const early = PAID_AT - 10 * DAY;
    /* Was a last edition's name handed in as lastEdition; since review xi (A4, B6) the newest time this computer has seen. */
    const anchored = Date.parse(payload.issued + "T00:00:00Z");
    const byEdition = await st(withEnd, early, { seen: { floor: Date.UTC(2027, 0, 2), anchor: anchored } });
    const stillOn = await st(withEnd, early, { seen: { floor: Date.UTC(2026, 11, 30), anchor: anchored } });
    const reissued = await sign(Object.assign({}, payload, { issued: "2027-01-02", paidUntil: PAID_AT }));
    const byIssued = await st(reissued, early);
    chk(byEdition.status === "paid-ended" && byEdition.canPublish === false && stillOn.status === "active"
          && byIssued.status === "paid-ended" && byIssued.canPublish === false,
      "16d with the clock set back before paidUntil, a time this computer has seen, or a licence issued, past the paid end still"
      + " reads paid-ended, while an earlier time seen leaves it active: " + JSON.stringify([byEdition.status, stillOn.status, byIssued.status]));
  };
  const PAID_PLANTS = [
    { name: "paid-until-refused", reds: ["16a"], from: "&& DATE.test(String(doc.updatesUntil || \"\"));",
      to: "&& DATE.test(String(doc.updatesUntil || \"\")) && !(\"paidUntil\" in doc);" },
    { name: "paid-forever", reds: ["16b", "16c", "16d"], from: "const over = at >= end.ms; /* plant:paid-over */",
      to: "const over = false;" },
    { name: "paid-day-string", reds: ["16c"],
      from: "if (typeof v === \"string\" && DATE.test(v)) return { ms: Date.parse(v + \"T00:00:00Z\") + 86400000, until: v }; /* plant:paid-day-string */",
      to: "" },
    { name: "paid-clock-today", reds: ["16d"],
      from: "let at = trialNow(opts.now, [doc.issued]); /* plant:paid-floor */",
      to: "let at = trialNow(opts.now, []);" },
  ];
  /* Each plant's copy of src/licence.mjs by its exact text, found once, as 5p plants its line. */
  const plantedReader = async p => {
    const real = fs.readFileSync(path.join(ROOT, "src", "licence.mjs"), "utf8");
    if (real.split(p.from).length !== 2) throw new Error("plant " + p.name + ": its line is not in src/licence.mjs once");
    const dir = path.join(SCRATCH, "plant-" + p.name, "src");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "licence.mjs"), real.split(p.from).join(p.to));
    fs.writeFileSync(path.join(dir, "sign.mjs"),
      "export * from " + JSON.stringify(pathToFileURL(path.join(ROOT, "src", "sign.mjs")).href) + ";\n");
    return import(pathToFileURL(path.join(dir, "licence.mjs")).href + "?plant=" + p.name);
  };
  const wantPaidPlant = process.env.LICENCE_PAID_PLANT;
  await leg("16", async () => {
    if (wantPaidPlant) { await paidRead(await plantedReader(PAID_PLANTS.find(x => x.name === wantPaidPlant)), check); return; }
    await paidRead(L, check);
    for (const p of PAID_PLANTS) {
      if (PLANTS_OFF) { skip("16p plant " + p.name + " turns " + p.reds.join(" and ") + " red (ETIUDA_PLANTS=off)"); continue; }
      const seen = [];
      await paidRead(await plantedReader(p), (cond, line) => { if (!cond) seen.push(String(line).split(" ")[0]); });
      check(p.reds.every(id => seen.includes(id)), "16p plant " + p.name + " turns " + p.reds.join(" and ") + " red: " + JSON.stringify(seen));
    }

    /* Publishing offline after paidUntil refuses and writes no edition (probe A7's criterion). */
    const paidFile = path.join(SCRATCH, "paid-end-license.js");
    writeLicence(paidFile, await sign(Object.assign({}, payload, { paidUntil: PAID_AT })));
    const proj = await project("proj-paid-end", "paid-end-cat");
    const pub = await publishFull({ project: proj.dir, now: "2026-12-31T10:00:00Z", notes: "before paid end",
      licenceFile: paidFile, trustedKey: rootPub, released: "2026-10-01" });
    const before = editions(proj.dir), ecBefore = fs.readFileSync(pub.ec);
    const e = await refusal(() => publishFull({ project: proj.dir, now: "2027-01-02T10:00:00Z", notes: "after paid end",
      licenceFile: paidFile, trustedKey: rootPub, released: "2026-10-01" }));
    const plan = await publishPlan(proj.dir, { licenceFile: paidFile, trustedKey: rootPub, released: "2026-10-01", now: "2027-01-02" });
    check(fs.existsSync(pub.ec) && e !== null && /paid period ended on 2027-01-01/.test(e.message)
        && editions(proj.dir) === before && Buffer.compare(fs.readFileSync(pub.ec), ecBefore) === 0
        && plan.licence.status === "paid-ended" && plan.licence.canPublish === false && plan.licence.paused === true,
      "16e offline past paidUntil publishFull refuses and writes nothing, and publishPlan says paid-ended and paused: "
      + JSON.stringify([e ? e.message : null, plan.licence.status, plan.licence.canPublish, plan.licence.paused]));
  });

  /* ---- 17. NO LICENCE STATE, VALUE OR LINE SAYS "EVALUATION" OR "NEWER" (piece S-2) --------------------------------------
     Max, 2026-11-17 20:41 ("I agree with your recommendation"): a paid licence that ends stops Studio as it stops the desk, so Studio
     has no evaluation period and no build "newer" than a licence's updates. An older file that carries either mark is read as every
     paid file is read, never refused for carrying it; a copy with no licence it can use holds no licence, and that stops. Until the
     paid end is judged by the licence file itself (the fourth review's finding 1), a paid file in place is `active` on every day (16b)
     and the end of a paid time is the file the service set aside, which reads as no licence. */
  const MARKS = /["'](evaluation|evaluation-ended|newer)["']|EVAL_PAUSED|trialFrom|\bevaluation\s*:/;
  await leg("17", async () => {
    const at = (doc, o) => L.licenceState(doc, Object.assign({ released: "2027-09-02", now: "2027-06-01" }, K, o || {}));
    const older = await sign(Object.assign({}, payload, { updatesUntil: "2027-09-01" }));
    const later = await sign(Object.assign({}, payload, { updatesUntil: "2028-09-01" }));
    const stNewer = await at(older), stLater = await at(later);
    const omit = (s) => JSON.stringify(Object.assign({}, s, { updatesUntil: 0 }));
    check(stNewer.status === "active" && stNewer.canPublish === true && stNewer.paused === false && !("watermark" in stNewer)
          && !("evaluation" in stNewer) && omit(stNewer) === omit(stLater) && !/evaluation|mark/i.test(L.formatLicenceHeader(stNewer)),
      "17a a paid file whose updates ended before the build was released is read as every paid file is: active, open, no mark, no"
      + " evaluation field, and its state is a later file's but for the date: " + JSON.stringify(stNewer) + " " + L.formatLicenceHeader(stNewer));
    const carrying = await sign(Object.assign({}, payload, { evaluation: "evaluation", status: "newer" }));
    const v = await L.verifyLicence(carrying, K), stCarry = await at(carrying, { released: "2027-08-01" });
    check(v.valid === true && stCarry.status === "active" && stCarry.canPublish === true && !("evaluation" in stCarry),
      "17b a signed file that itself carries an evaluation field and a status of newer is a licence, never refused for"
      + " carrying them, and is read by its paid dates alone: " + JSON.stringify([v.reason, stCarry.status]));

    const none = [["no file", null], ["a damaged file", { malformed: true }], ["a bent signature", Object.assign({}, good, { org: "Other" })]];
    for (const [what, doc] of none) {
      const st = await at(doc, { trialFrom: "2027-05-30", file: licFile });
      check(st.status === "none" && st.canPublish === false && st.paused === false && !("watermark" in st) && st.trial === null
            && !("evaluation" in st) && !/evaluation/i.test(L.formatLicenceHeader(st)),
        "17c " + what + " is no licence, which stops, with fourteen days from a first run named and still nothing open (the day is"
        + " read by nothing): " + JSON.stringify(st.status) + " " + L.formatLicenceHeader(st));
    }
    const named = await at({ malformed: true }, { file: licFile });
    check(named.unusable && named.unusable.file === path.resolve(licFile) && named.unusable.reason === "unreadable",
      "17c2 CONTROL: a file that cannot be used is still named with its reason, so the cover can say which and why: "
      + JSON.stringify(named.unusable));

    const here = await project("proj-s2-none", "s2-none-cat");
    const gone = path.join(SCRATCH, "s2-no-licence.js");
    const e = await refusal(() => publishFull({ project: here.dir, now: "2027-06-01T10:00:00", notes: "no licence", licenceFile: gone,
      trustedKey: rootPub, trialFrom: "2027-05-30" }));
    check(e && !/evaluation/i.test(e.message) && editions(here.dir) === 0 && !fs.existsSync(path.join(here.dir, "archive", "report.json")),
      "17d publishFull with no licence refuses, in no sentence about an evaluation, and writes no edition: " + (e ? e.message : "it published"));

    const old = await project("proj-s2-old", "s2-old-cat");
    fs.writeFileSync(path.join(old.dir, "draft.json"), JSON.stringify(Object.assign({}, old.catalog, { evaluation: "evaluation" }), null, 1) + "\n");
    const pub = await publishFull({ project: old.dir, now: "2027-06-01T10:00:00", notes: "an older draft carrying the mark",
      licenceFile: licFile, trustedKey: rootPub, released: "2027-09-02" });
    const report = JSON.parse(fs.readFileSync(path.join(pub.archive, REPORT_IN_ARCHIVE), "utf8"));
    const rel = fs.readFileSync(path.join(pub.archive, RELEASE_IN_ARCHIVE), "utf8");
    check(fs.existsSync(pub.ec) && editionField(pub) === null && !("evaluation" in report) && !("watermark" in report) && !/evaluation/i.test(rel),
      "17e a draft an older Studio left carrying an evaluation mark is published under a paid file with no"
      + " mark in the edition, the report or the notes: " + JSON.stringify([editionField(pub), Object.keys(report).filter(k => /evaluation|watermark/.test(k))]));
    const plan = await publishPlan(here.dir, { licenceFile: licFile, trustedKey: rootPub, released: "2027-09-02", now: "2027-06-01" });
    check(plan.licence && plan.licence.status === "active" && plan.licence.canPublish === true,
      "17f the cover's plan for a build released after the updates says active: " + JSON.stringify(plan.licence));

    const read = f => fs.readFileSync(path.join(ROOT, f), "utf8").split("\n").filter(l => !/^\s*(\/\*|\*|\/\/)/.test(l)).join("\n");
    /* Studio's module keeps its readers that strip the field from an older edition (src/studio.mjs NOT_OTHER), so it is held to the first-run day alone. */
    const FIRST_RUN = /EVAL_PAUSED|trialFrom/;
    const found = ["src/licence.mjs", "src/publish.mjs", "src/studio.mjs", "shell/main.js", "ui/app.js"]
      .map(f => [f, (read(f).match(new RegExp((f === "src/studio.mjs" ? FIRST_RUN : MARKS).source, "g")) || [])]).filter(x => x[1].length);
    check(found.length === 0,
      "17g no line of code in the licence, the publish, Studio's module, the shell or the page names the evaluation states or the"
      + " newer one, or the first-run day: " + JSON.stringify(found));
    const lang = fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8");
    check(!/evaluation (mark|mode|period)|Evaluation mode|updates ended on \{DATE\}|came out after the licence's updates/.test(lang),
      "17h no line of ui/lang.js speaks of the evaluation mark, mode or period, or of a version that came out after a licence's updates");
    const stops = async (M) => { const st = await M.licenceState(null, K); return st.status === "none" && st.canPublish === false; };
    check(await stops(L), "17i a copy with no licence cannot publish");
    if (PLANTS_OFF) skip("17p plant none-open, which lets no licence publish, turns 17i red (ETIUDA_PLANTS=off)");
    else check(!(await stops(await plantedReader({ name: "none-open", from: 'status: "none", canPublish: false,', to: 'status: "none", canPublish: true,' }))),
      "17p plant none-open, which lets no licence publish, turns 17i red");
  });

  /* ---- 18. WHAT THIS COMPUTER HAS ALREADY VERIFIED AND SEEN (review xi of 2026-11-22: A1, A3, A4, B6) -------------------
     A1: a licence file the system will not open (EPERM, EACCES, EBUSY) rests only on a licence this computer already verified
     at that path, read again by its own dates; with none verified it is no licence, "unreadable", and never publishes on its
     own say-so. A3: the newest revoked keys' list ever seen is kept, so a list deleted, put back older or shorter never takes
     a key off; and it outlives a restart in a snapshot this Studio's own key marks. A4: the clock a licence is read by is the
     newest time ever seen, never moving back, unless a licence the service issued later rights it. B6: publishing judges the
     paid period by the licence and that floor, never by an archive folder's name. Run against the real module and the plants
     below (LICENCE_SEEN_PLANT=<name> runs one and prints its FAIL lines). */
  const seenRead = async (M, chk) => {
    const att = async (fn) => { try { return await fn(); } catch (e) { return { threw: String(e && e.message || e) }; } };
    const realRead = fs.readFileSync;
    const holdOn = (at) => {
      fs.readFileSync = function (p, ...rest) {
        if (typeof p === "string" && path.resolve(p) === path.resolve(at)) {
          const err = new Error("EBUSY: resource busy or locked, open '" + p + "'");
          err.code = "EBUSY"; err.errno = -4082; err.syscall = "open"; err.path = p;
          throw err;
        }
        return realRead.call(this, p, ...rest);
      };
      return () => { fs.readFileSync = realRead; };
    };
    const tag = Math.random().toString(16).slice(2);
    const dirOf = (n) => { const d = path.join(SCRATCH, "seen-" + n + "-" + tag); fs.mkdirSync(d, { recursive: true }); return d; };
    const stOf = async (at, extra) => {
      const off = extra && extra.held ? holdOn(at) : null;
      try {
        return await M.licenceState(M.readLicenceFile(at), Object.assign({ file: at }, K, extra && extra.opts || {}));
      } finally { if (off) off(); }
    };
    const said = (s) => s && (s.threw || [s.status, s.canPublish, s.unusable && s.unusable.reason].join(","));

    /* A1 */
    const neverAt = path.join(dirOf("never"), L.LICENCE_FILE);
    writeLicence(neverAt, good);
    const never = await att(() => stOf(neverAt, { held: true }));
    chk(!never.threw && never.status === "none" && never.canPublish === false && never.paused === false
          && !!never.unusable && never.unusable.reason === "unreadable" && never.unusable.file === path.resolve(neverAt),
      "xi1a a licence file the system will not open, with no licence verified at that path on this computer, is no licence:"
      + " it says unreadable and names the file, and cannot publish: " + said(never));
    const onAt = path.join(dirOf("on"), L.LICENCE_FILE);
    writeLicence(onAt, good);
    const onFirst = await att(() => stOf(onAt));
    const onHeld = await att(() => stOf(onAt, { held: true }));
    chk(!onHeld.threw && onFirst.status === "active" && onHeld.status === "held" && onHeld.canPublish === true && onHeld.paused === false,
      "xi1b CONTROL: the same file held after this computer verified a current licence there stays open, held, and publishes,"
      + " so a scanner or a sync client holding it strands nobody: " + said(onFirst) + " then " + said(onHeld));
    const trialAt = path.join(dirOf("trial"), L.LICENCE_FILE);
    const tEnds = Date.UTC(2026, 0, 15);
    writeLicence(trialAt, await M.createTestTrialLicence({ issued: "2026-01-01", ends: tEnds }, pair.privateKey, "test-root"));
    const tOn = await att(() => stOf(trialAt, { opts: { now: tEnds - DAY } }));
    const tHeldLate = await att(() => stOf(trialAt, { held: true, opts: { now: tEnds + DAY } }));
    chk(tOn.status === "trial" && !tHeldLate.threw && tHeldLate.status === "trial-ended" && tHeldLate.canPublish === false,
      "xi1c a held file over a trial this computer verified is read again by that trial's own end: past it, it is the trial"
      + " ended and cannot publish: " + said(tOn) + " then " + said(tHeldLate));
    const goneAt = path.join(dirOf("gone"), L.LICENCE_FILE);
    writeLicence(goneAt, good);
    await att(() => stOf(goneAt));
    fs.writeFileSync(goneAt, "not a licence\n");
    const goneBad = await att(() => stOf(goneAt));
    const goneHeld = await att(() => stOf(goneAt, { held: true }));
    chk(goneBad.status === "none" && !goneHeld.threw && goneHeld.status === "none" && goneHeld.canPublish === false,
      "xi1d a licence verified once and then replaced by a file that reads and is no licence is forgotten: held after that,"
      + " it is no licence: " + said(goneBad) + " then " + said(goneHeld));

    /* A3 */
    const listOf = (keys, serial) => M.createTestRevocations({ keys, serial }, pair.privateKey, "etiuda-root");
    const viaA = delegate({});
    const a = await M.createTestLicence(Object.assign({}, payload, { issued: "2026-06-01", via: viaA }), svc.privateKey, SVC.id);
    const whyOf = async (file) => { const r = await att(() => M.verifyLicence(a, Object.assign({ file }, K))); return r.threw || r.reason; };
    const revDir = dirOf("rev"), revAt = path.join(revDir, L.LICENCE_FILE);
    fs.writeFileSync(revAt, JSON.stringify(a));
    const both = (r) => { fs.writeFileSync(path.join(revDir, L.REVOKED_FILE), JSON.stringify(r)); fs.writeFileSync(path.join(revDir, "etiuda-studio-revoked-kept.json"), JSON.stringify(r)); };
    both(listOf([SVC.pub], 2));
    const r0 = await whyOf(revAt);
    fs.rmSync(path.join(revDir, L.REVOKED_FILE), { force: true });
    fs.rmSync(path.join(revDir, "etiuda-studio-revoked-kept.json"), { force: true });
    const rGone = await whyOf(revAt);
    chk(r0 === "revoked" && rGone === "revoked",
      "xi3a a key on a list this computer has seen stays revoked with both copies of the list deleted: " + JSON.stringify([r0, rGone]));
    both(listOf([SVC2.pub], 3));
    const rFewer = await whyOf(revAt);
    both(listOf([SVC2.pub], 1));
    const rOlder = await whyOf(revAt);
    chk(rFewer === "revoked" && rOlder === "revoked",
      "xi3b and with both copies replaced by a later signed list that drops it, or by an older one, it is still revoked: "
      + JSON.stringify([rFewer, rOlder]));
    const markPair = crypto.generateKeyPairSync("ed25519");
    const markPub = markPair.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
    const snap = await att(() => M.seenNow(revAt, rootPub));
    const mark = await att(() => M.seenSign(snap, markPair.privateKey));
    const holds = await att(() => M.seenHolds(snap, mark, markPub));
    const bent = snap && !snap.threw ? JSON.parse(JSON.stringify(snap)) : {};
    if (bent.revoked) bent.revoked.keys = [];
    const bentHolds = await att(() => M.seenHolds(bent, mark, markPub));
    const otherHolds = await att(() => M.seenHolds(snap, mark, pubOf(svc)));
    chk(holds === true && bentHolds === false && otherHolds === false && !!snap.revoked && snap.revoked.keys.includes(SVC.pub),
      "xi3c what this computer has seen is kept as a snapshot this Studio's own key marks: the mark holds for it, and not for"
      + " it edited, or under another key: " + JSON.stringify([snap && (snap.threw || snap.revoked), holds, bentHolds, otherHolds]));

    /* A4 */
    const fAt = path.join(dirOf("floor"), L.LICENCE_FILE);
    const trialDoc = await M.createTestTrialLicence({ issued: "2026-01-01", ends: tEnds }, pair.privateKey, "test-root");
    writeLicence(fAt, trialDoc);
    const June = Date.UTC(2026, 5, 1), Jan2 = Date.UTC(2026, 0, 2);
    const back = await att(() => stOf(fAt, { opts: { now: Jan2, seen: { floor: June, anchor: Date.UTC(2026, 0, 1) } } }));
    chk(!back.threw && back.status === "trial-ended" && back.canPublish === false,
      "xi4a with the clock set back to inside a trial after this computer saw a time past its end, the trial still reads ended: " + said(back));
    const paidDoc = await sign(Object.assign({}, payload, { issued: "2026-06-01", paidUntil: "2026-12-31" }));
    const pAt = path.join(dirOf("anchor"), L.LICENCE_FILE);
    writeLicence(pAt, paidDoc);
    const righted = await att(() => stOf(pAt, { opts: { now: Date.UTC(2026, 5, 2), seen: { floor: Date.UTC(2028, 0, 1), anchor: Date.UTC(2026, 0, 1) } } }));
    chk(!righted.threw && righted.status === "active" && righted.canPublish === true,
      "xi4b CONTROL: a time seen ahead (a clock once carried forward) is righted by a licence the service issued later, so a paying"
      + " lead is not ended by it: " + said(righted));
    const realNow = Date.now;
    let mJune = null, mJan = null;
    const memAt = path.join(dirOf("mem"), L.LICENCE_FILE);
    writeLicence(memAt, trialDoc);
    try {
      Date.now = () => June;
      mJune = await att(() => stOf(memAt));
      Date.now = () => Jan2;
      mJan = await att(() => stOf(memAt));
    } finally { Date.now = realNow; }
    chk(mJune && mJune.status === "trial-ended" && mJan && !mJan.threw && mJan.status === "trial-ended",
      "xi4c asked as the shell asks, with no clock handed in, a clock set back after a later one was seen still reads the trial"
      + " ended: " + said(mJune) + " then " + said(mJan));
  };
  const SEEN_PLANTS = [
    { name: "seen-held-open", reds: ["xi1a"], from: "return unreadHeld(file, doc[HELD_MARK]); /* plant:seen-held */", to: "return heldOpen();" },
    { name: "seen-list-disk", reds: ["xi3a", "xi3b"], from: "return mergedRevocations(onDisk, before); /* plant:seen-list */", to: "return onDisk;" },
    { name: "seen-floor-off", reds: ["xi4a", "xi4c"], from: "if (S) at = floorOf(S, at, doc.issued); /* plant:seen-floor */", to: "" },
  ];
  const wantSeenPlant = process.env.LICENCE_SEEN_PLANT;
  await leg("18", async () => {
    if (wantSeenPlant) { await seenRead(await plantedReader(SEEN_PLANTS.find(x => x.name === wantSeenPlant)), check); return; }
    await seenRead(L, check);
    for (const p of SEEN_PLANTS) {
      if (PLANTS_OFF) { skip("xi9p plant " + p.name + " turns " + p.reds.join(" and ") + " red (ETIUDA_PLANTS=off)"); continue; }
      const seen = [];
      let planted = null;
      try { planted = await plantedReader(p); } catch (e) { check(false, "xi9p plant " + p.name + ": " + e.message); continue; }
      await seenRead(planted, (cond, line) => { if (!cond) seen.push(String(line).split(" ")[0]); });
      check(p.reds.every(id => seen.includes(id)), "xi9p plant " + p.name + " turns " + p.reds.join(" and ") + " red: " + JSON.stringify(seen));
    }

    /* A1 and B6 through publishing itself, on the real modules. */
    const realRead = fs.readFileSync;
    const holdOn = (at) => {
      fs.readFileSync = function (p, ...rest) {
        if (typeof p === "string" && path.resolve(p) === path.resolve(at)) {
          const err = new Error("EBUSY: resource busy or locked, open '" + p + "'");
          err.code = "EBUSY"; err.syscall = "open"; err.path = p;
          throw err;
        }
        return realRead.call(this, p, ...rest);
      };
      return () => { fs.readFileSync = realRead; };
    };
    const pubDir = path.join(SCRATCH, "seen-pub-" + Math.random().toString(16).slice(2));
    fs.mkdirSync(pubDir, { recursive: true });
    const lockedAt = path.join(pubDir, "never-" + L.LICENCE_FILE);
    writeLicence(lockedAt, good);
    const p1 = await project("proj-xi-held", "xi-held-cat");
    let e1 = null, off = holdOn(lockedAt);
    try { await publishFull({ project: p1.dir, now: "2026-10-20T10:00:00", notes: "x", licenceFile: lockedAt, trustedKey: rootPub }); }
    catch (e) { e1 = e; } finally { off(); }
    check(!!e1 && /holds no licence/.test(String(e1.message)) && editions(p1.dir) === 0,
      "xi1e a publish over a licence file the system will not open, with nothing verified at that path, is refused as no licence"
      + " and writes no edition: " + (e1 ? e1.message : "it published"));
    const keptAt = path.join(pubDir, "kept-" + L.LICENCE_FILE);
    writeLicence(keptAt, good);
    let snap = null, e2 = null;
    try {
      await L.licenceState(L.readLicenceFile(keptAt), Object.assign({ file: keptAt }, K));
      snap = L.seenNow(keptAt, rootPub);
    } catch (e) { e2 = e; }
    const p2 = await project("proj-xi-kept", "xi-kept-cat");
    off = holdOn(keptAt);
    let pub2 = null;
    try { pub2 = await publishFull({ project: p2.dir, now: "2026-10-20T10:00:00", notes: "x", licenceFile: keptAt, trustedKey: rootPub, seen: snap }); }
    catch (e) { e2 = e; } finally { off(); }
    check(!e2 && pub2 && fs.existsSync(pub2.ec),
      "xi1f CONTROL: handed what this computer verified (the shell's snapshot, as the publish thread is handed it), a publish over"
      + " the same licence held by another program goes on: " + (e2 ? e2.message : "published"));

    const p3 = await project("proj-xi-folder", "xi-folder-cat");
    fs.mkdirSync(path.join(p3.dir, "archive", "9999-01-01"), { recursive: true });
    const paidAt = path.join(pubDir, "paid-" + L.LICENCE_FILE);
    writeLicence(paidAt, await sign(Object.assign({}, payload, { paidUntil: "2027-01-01" })));
    let e3 = null, pub3 = null;
    try { pub3 = await publishFull({ project: p3.dir, now: "2026-10-20T10:00:00", notes: "x", licenceFile: paidAt, trustedKey: rootPub }); }
    catch (e) { e3 = e; }
    /* The folder holds no edition, so the publish may still stop at reading it; what it must not say is that the paid period ended. */
    let plan3 = null;
    try { plan3 = await publishPlan(p3.dir, { licenceFile: paidAt, trustedKey: rootPub, now: "2026-10-20T10:00:00" }); } catch (e) { plan3 = { threw: e.message }; }
    check(!/paid period ended/.test(String(e3 && e3.message)) && (!!pub3 || !!e3) && plan3 && plan3.licence && plan3.licence.status === "active",
      "xi6a an archive folder named for a day after a current paid licence's end does not end it, for the publish or its cover: "
      + JSON.stringify([e3 ? e3.message : "published", plan3 && (plan3.threw || plan3.licence && plan3.licence.status)]));
    const p4 = await project("proj-xi-nan", "xi-nan-cat");
    fs.mkdirSync(path.join(p4.dir, "archive", "9999-99-99"), { recursive: true });
    const endedAt = path.join(pubDir, "ended-" + L.LICENCE_FILE);
    writeLicence(endedAt, await L.createTestTrialLicence({ issued: "2026-01-01", ends: Date.UTC(2026, 0, 15) }, pair.privateKey, "test-root"));
    let e4 = null;
    try { await publishFull({ project: p4.dir, now: "2026-06-01T10:00:00", notes: "x", licenceFile: endedAt, trustedKey: rootPub }); }
    catch (e) { e4 = e; }
    check(!!e4 && /trial ended/i.test(String(e4.message)),
      "xi6b and a folder whose name only looks like a day does not reopen an ended trial: " + (e4 ? e4.message : "it published"));

    const shellText = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
    const studioText = fs.readFileSync(path.join(ROOT, "src", "studio.mjs"), "utf8");
    const pubCall = shellText.slice(shellText.indexOf("thread.call(\"publishProject\""), shellText.indexOf("thread.call(\"publishProject\"") + 600);
    const planCall = shellText.slice(shellText.indexOf("thread.call(\"publishPlan\""), shellText.indexOf("thread.call(\"publishPlan\"") + 600);
    const clocked = (shellText.match(/L\.licenceState\([^)]*\)[^;]*;/g) || []).filter(s => /\bnow\s*:/.test(s));
    check(/\bseen:\s*await seenFor\(\)/.test(pubCall) && /\bseen:\s*await seenFor\(\)/.test(planCall) && clocked.length === 0
          && /seen:\s*opts\.seen/.test(studioText) && /\.seenFrom\(/.test(shellText) && /\.onSeen\(/.test(shellText) && /\.seenDigest\(/.test(shellText),
      "xi4d the shell keeps what it has seen (taken back at start where its sealed digest opens to it, kept as it changes), reads every licence"
      + " with no clock of its own, and hands the publish and its cover that snapshot: " + JSON.stringify(clocked));

    /* A2 and the gate on the certificate (Max, 2026-11-22 15:37): the publish thread, handed this Studio's own seat certificate, publishes on
       it with no licence file at all; a certificate for another key, or one past its end, is no licence. */
    const Sign = await import(pathToFileURL(path.join(ROOT, "src", "sign.mjs")).href);
    const Seat = await import(pathToFileURL(path.join(ROOT, "src", "desk-seat.mjs")).href);
    const keyDoc = await Sign.makeKeyFile({ passphrase: "xi7 passphrase" }), otherDoc = await Sign.makeKeyFile({ passphrase: "xi7 other" });
    const keyAt = path.join(pubDir, "xi7-key.json");
    fs.writeFileSync(keyAt, JSON.stringify(keyDoc, null, 1) + "\n");
    const HOUR7 = 3600000;
    const certFor = (desk, issued, until) => {
      const c = { kind: "etiuda-seat-certificate", format: 1, licence: "a".repeat(32), desk, person: "b".repeat(64), code: "0123456789ABCDEF",
        issued, until, via: delegate({}), sig: { alg: "Ed25519", keyId: SVC.id } };
      c.sig.value = crypto.sign(null, Seat.certBytes(c), svc.privateKey).toString("hex");
      return c;
    };
    const nowMs = Date.now();
    const mine = certFor(keyDoc.public, nowMs - HOUR7, nowMs + 5 * DAY);
    const theirs = certFor(otherDoc.public, nowMs - HOUR7, nowMs + 5 * DAY);
    const ran = certFor(keyDoc.public, nowMs - 40 * DAY + HOUR7, nowMs - 10 * DAY);
    const noFile = path.join(pubDir, "absent-" + L.LICENCE_FILE);
    const pubOn = async (name, seat) => {
      const pj = await project("proj-xi7-" + name, "xi7-" + name + "-cat");
      try { const r = await publishFull({ project: pj.dir, notes: "x", licenceFile: noFile, trustedKey: rootPub, leadKey: keyAt, seat }); return r && r.ec && fs.existsSync(r.ec) ? "published" : "nothing"; }
      catch (e) { return String(e && e.message); }
    };
    const onMine = await pubOn("mine", mine), onTheirs = await pubOn("theirs", theirs), onRan = await pubOn("ran", ran);
    check(onMine === "published",
      "xi7a handed this Studio's own seat certificate, the publish goes on with no licence file at all: " + onMine);
    check(/holds no licence/.test(onTheirs) && /holds no licence/.test(onRan),
      "xi7b CONTROL: a certificate for another key, or one past its end, is no licence to publish on: " + JSON.stringify([onTheirs, onRan]));

    /* The licence file goes as an everyday entitlement (Max, 2026-11-22 15:37; Claudius's pass of 17:50): a current licence the service
       issued, with no certificate, publishes nothing; a licence the root signed still does (xi6a, and every leg on licensed.mjs). */
    const svcFile = path.join(pubDir, "service-" + L.LICENCE_FILE);
    writeLicence(svcFile, await L.createTestLicence(Object.assign({}, payload, { issued: "2026-06-01", via: delegate({}) }), svc.privateKey, SVC.id));
    const svcState = await L.licenceState(L.readLicenceFile(svcFile), Object.assign({ file: svcFile }, K));
    const p8 = await project("proj-xi8-service", "xi8-service-cat");
    let e8 = null;
    try { await publishFull({ project: p8.dir, notes: "x", licenceFile: svcFile, trustedKey: rootPub }); } catch (e) { e8 = e; }
    check(svcState.status === "active" && !!e8 && /holds no licence/.test(String(e8.message)) && editions(p8.dir) === 0,
      "xi8a a current licence file the service issued, with no seat certificate, publishes nothing: " + JSON.stringify([svcState.status, e8 ? e8.message : "it published"]));
    /* The cover's line for a licence held by sign-in whose organisation, seats and updates nobody has said (a placeholder, the copywriter's). */
    const home8 = loadPage({ api: {}, uiLang: "en" }), home8pl = loadPage({ api: {}, uiLang: "pl" });
    const said8 = (pg) => String((pg.page.licenceSaid({ status: "active", paused: false, canPublish: true, file: null, org: null, seats: null, devicesEach: null,
      updatesUntil: null, trial: null, unusable: null }) || {}).v || "").replace(/<[^>]*>/g, "");
    const en8 = said8(home8), pl8 = said8(home8pl);
    check(en8 === "A licence is held through this account's sign-in; its organisation and seats show once the service has answered." && !!pl8 && pl8 !== en8 && !/null/.test(en8 + pl8),
      "xi8b the cover says a licence held by sign-in in its own words, in English and Polish, never null for what nobody said: " + JSON.stringify([en8, pl8]));
  });

  if (!keep) dropScratch(SCRATCH, "licence-handling");
  process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + "\n");
  process.stdout.write("licence-handling: " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("licence-handling: REFUSED " + (e && e.stack ? e.stack : e) + "\n");
  process.exit(1);
});
