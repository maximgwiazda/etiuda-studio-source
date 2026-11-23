/* A PROJECT HAS TWO NAMES AND EACH IS KEPT WHERE IT BELONGS (board 18, decisions 2026-09-29 21:30).
 *
 *     node tests/file-name.mjs [--keep]
 *
 * THE DISPLAY NAME is free text in project.json and nowhere else; THE FILE NAME is a lower-case
 * slug fixed at the first publish, changed only by changeFileName, and never by anything that
 * happens to the display name. Every leg here is measured on disk: the bytes of the share, the
 * draft, the archive and the ring, before and after.
 *
 * THE SLUG TABLE IS LITERAL. Its expectations are written out below and never computed by the code
 * under test, so a function that returned a wrong answer consistently could not agree with it.
 *
 * THE PLANTED FAULTS ARE THE POINT OF THE ALL-OR-NOTHING LEGS: a move refused and a write refused,
 * each raised by wrapping fs.renameSync for one path, and after each the folder, the name and the
 * file name are exactly what they were. The wrapper is the one tests/bad-day.mjs uses for writes.
 *
 * Nothing here is a catalog of anybody's: every draft is invented, and the piles come from the
 * committed generator.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";
import * as Engine from "../src/engine.mjs";
import * as Pub from "../src/publish.mjs";
import * as S from "../src/studio.mjs";
import { diskRefusal } from "../src/refusal.mjs";
import { makeKeyFile } from "../src/sign.mjs";
import { RING_FILE } from "../src/ring.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import OffWindows from "./off-windows.cjs";
import { writeWhole, renamePatiently, tempName, TRIES, PAUSE_MS, BUSY } from "../src/whole-write.cjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "file-name");
const CLOCK = "2026-09-30T09:00:00.000Z";
const CLOCK2 = "2026-10-01T09:00:00.000Z";
const PASS = "a passphrase nobody uses twice";
const PROJECT_FILE = "project.json", DRAFT_FILE = "draft.json";

let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
/* A skip is not a pass, and it is said and counted. Only fn-13d uses it, off Windows (tests/off-windows.cjs). */
function skip(line) { skipped++; process.stdout.write("  SKIP  " + line + "\n"); }

const readJson = p => JSON.parse(fs.readFileSync(p, "utf8"));
const sha = p => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const ecs = d => fs.existsSync(d) ? fs.readdirSync(d).filter(n => /\.ec$/.test(n)).sort() : [];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const CATALOG_IN_ARCHIVE = Pub.CATALOG_IN_ARCHIVE, REPORT = Pub.REPORT_IN_ARCHIVE;

/** Every file under a folder with its digest, for a before and an after. */
function tree(dir) {
  const out = {};
  const walk = (d) => {
    if (!fs.existsSync(d)) return;
    for (const n of fs.readdirSync(d).sort()) {
      const at = path.join(d, n);
      if (fs.statSync(at).isDirectory()) walk(at);
      else out[path.relative(dir, at).split(path.sep).join("/")] = sha(at);
    }
  };
  walk(dir);
  return out;
}

/** A call's answer or its error, so a missing verb is a failed leg and not a crashed file. */
async function got(fn) {
  try { return { v: await fn() }; } catch (e) { return { e }; }
}

/** A leg that throws is a failed check naming itself, and the file goes on to the next. */
async function leg(id, fn) {
  try { await fn(); }
  catch (e) { check(false, id + " threw " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join(" | ") : e)); }
}

/** A rename refused for the paths `when` picks, as a disk that will not take it refuses. */
async function withRenameFault(when, run) {
  const real = fs.renameSync;
  fs.renameSync = function (a, b) {
    if (when(String(a), String(b)))
      throw Object.assign(new Error("EACCES: planted refusal"), { code: "EACCES", path: String(a), dest: String(b) });
    return real.apply(fs, arguments);
  };
  try { return await run(); } finally { fs.renameSync = real; }
}

/** A catalog of two invented cards, whose words differ by `word` so no two projects match. */
function catalogOf(F, id, word) {
  const shelf = { id: F.tagId("Greeting"), kind: "shelf", label: { en: "Greeting", pl: "Powitanie" } };
  const cat = {
    format: F.FORMAT, kind: F.KIND, id, rev: 0,
    langs: [{ code: "en", label: "EN" }, { code: "pl", label: "PL" }],
    commentLang: "en", tags: [shelf], minEngine: "2.0.0",
    cards: [1, 2].map(i => ({
      id: "c-" + i, shelf: shelf.id, bodyShape: "plain",
      title: { en: "Card " + i, pl: "Karta " + i },
      body: { en: "Widuma tosork " + word + " plasib " + i + ".",
              pl: "Widuma tosork " + word + " plasib " + i + "." },
    })),
  };
  cat.hash = F.contentHash(cat);
  return cat;
}

let F = null, seq = 0;
/** A project folder planted by hand: `home` is the folder's name, `id` its catalog id. */
function plant(root, home, id, extra) {
  const dir = path.join(root, home);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, DRAFT_FILE), Pub.json(catalogOf(F, id, "w" + (++seq))), "utf8");
  fs.writeFileSync(path.join(dir, PROJECT_FILE),
    Pub.json(Object.assign({ id, rev: 0, edition: "", draft: DRAFT_FILE, folder: null }, extra || {})), "utf8");
  return dir;
}

/** Another catalog's file, as a share might hold beside ours. */
function otherCatalog(at, id) {
  fs.mkdirSync(path.dirname(at), { recursive: true });
  fs.writeFileSync(at, Pub.json(catalogOf(F, id, "other")), "utf8");
}

/** A drive letter nothing is mounted on, which is what an unmapped share looks like. */
function freeDrive() {
  for (const l of "QRSTUVWXYJKLMNOP") if (!fs.existsSync(l + ":\\")) return l + ":";
  return "";
}

async function main(argv) {
  const keep = argv.indexOf("--keep") >= 0;
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  F = await Engine.format();

  /* ---- 1. THE SLUG, AND THE NAME A COLLISION STEPS ROUND ------------------------------------ */

  await leg("fn-1", async () => {
    /* LITERAL EXPECTATIONS: the first five and the last two computed with the pinned slug on
       2026-09-30, the device and extension rows added by the design. */
    const table = [
      ["Acme Support", "acme-support"],
      ["Obsługa klienta, PL i EN", "obsluga-klienta-pl-i-en"],
      ["ŻÓŁĆ gęślą", "zolc-gesla"],
      ["  Returns / Refunds?  ", "returns-refunds"],
      ["Support: billing (2026)", "support-billing-2026"],
      ["CON", "con-catalog"],
      ["nul", "nul-catalog"],
      ["acme.EC", "acme"],
      ["Каталог", ""],
      ["!!!", ""],
      ["", ""],
      ["a".repeat(70) + " tail", "a".repeat(64)],
      ["3f2b9c1e-8a4d-4c55-9a51-2f0d3e1b7c90", "3f2b9c1e-8a4d-4c55-9a51-2f0d3e1b7c90"],
    ];
    const wrong = [];
    for (const [text, want] of table) {
      const r = await got(() => Pub.fileSlug(text));
      if (r.e || r.v !== want) wrong.push(JSON.stringify(text.slice(0, 12)) + " gave "
        + JSON.stringify(r.e ? String(r.e.message).slice(0, 40) : r.v) + " not " + JSON.stringify(want));
    }
    check(wrong.length === 0, "fn-1a the slug table holds on all " + table.length
      + " rows, its expectations written as literals" + (wrong.length ? ": " + wrong.join("; ") : ""));

    const share = path.join(SCRATCH, "s1-share");
    otherCatalog(path.join(share, "acme-support.ec"), "another-catalog");
    const nowhere = await got(() => Pub.suggestFileName("Acme Support", null, "mine-1"));
    const taken = await got(() => Pub.suggestFileName("Acme Support", share, "mine-1"));
    fs.writeFileSync(path.join(share, "acme-support-2.ec"), "not a catalog at all", "utf8");
    const twice = await got(() => Pub.suggestFileName("Acme Support", share, "mine-1"));
    check(nowhere.v === "acme-support.ec" && taken.v === "acme-support-2.ec"
          && twice.v === "acme-support-3.ec",
      "fn-1b with no folder nothing is checked, a name another catalog holds steps to -2, and a"
      + " file that will not parse counts as taken and steps to -3: "
      + JSON.stringify([nowhere.v, taken.v, twice.v]));

    const mine = path.join(SCRATCH, "s1-mine");
    fs.mkdirSync(mine, { recursive: true });
    fs.writeFileSync(path.join(mine, "acme-support.ec"), Pub.json({ id: "mine-1" }), "utf8");
    const own = await got(() => Pub.suggestFileName("Acme Support", mine, "mine-1"));
    check(own.v === "acme-support.ec",
      "fn-1c a name this catalog's own file holds is the one suggested: " + JSON.stringify(own.v));

    const long = "a".repeat(64);
    const longShare = path.join(SCRATCH, "s1-long");
    otherCatalog(path.join(longShare, long + ".ec"), "another-catalog");
    const cut = await got(() => Pub.suggestFileName(long, longShare, "mine-1"));
    check(cut.v === "a".repeat(62) + "-2.ec",
      "fn-1d a 64-character stem that is taken is cut to 62 and takes -2: " + JSON.stringify(cut.v));

    const empty = await got(() => Pub.suggestFileName("Каталог", null, "mine-1"));
    check(empty.v === "catalog.ec",
      "fn-1e a name with no letter or digit in it is suggested as catalog.ec: " + JSON.stringify(empty.v));
  });

  /* ---- 2. THE FIRST PUBLISH OF A NEW PROJECT, AND THE NAME THAT MUST NOT TRAVEL ------------- */

  const root2 = path.join(SCRATCH, "s2-projects");
  const share2 = path.join(SCRATCH, "s2-share");
  let dir2 = null, id2 = null, fileName2 = null;
  const SHOWN = "Qorvath Blemish 7431 Ünique";
  await leg("fn-2", async () => {
    fs.mkdirSync(root2, { recursive: true });
    const opened = await S.newProject(root2, "  " + SHOWN + "  ");
    dir2 = opened.dir; id2 = opened.project.id;
    const at = path.join(dir2, PROJECT_FILE);
    check(readJson(at).displayName === SHOWN && opened.name === SHOWN,
      "fn-2a a new project stores the typed text, trimmed and otherwise verbatim, in project.json and"
      + " answers it as its name: " + JSON.stringify(readJson(at).displayName));
    fs.writeFileSync(path.join(dir2, DRAFT_FILE), Pub.json(catalogOf(F, id2, "nonce")), "utf8");
    S.setPublishFolder(dir2, share2);

    const plan = await got(() => S.publishPlan(dir2, {}));
    fileName2 = "qorvath-blemish-7431-unique.ec";
    check(plan.v && plan.v.name === SHOWN && plan.v.fileName === fileName2 && plan.v.fileFixed === false,
      "fn-2b the plan answers the display name, and the suggested file name as not yet fixed: "
      + JSON.stringify(plan.v ? [plan.v.name, plan.v.fileName, plan.v.fileFixed] : String(plan.e)));

    const pub = await got(() => S.publishProject(dir2, { now: CLOCK }));
    const project = readJson(at);
    const edition = Pub.editionsIn(dir2)[0];
    const report = edition ? readJson(path.join(dir2, "archive", edition, REPORT)) : {};
    check(pub.v && same(ecs(share2), [fileName2]) && project.fileName === fileName2
          && report.file === fileName2,
      "fn-2c the first publish writes the suggested name into the share, records it as fileName in"
      + " project.json and as file in the edition's report: " + JSON.stringify(ecs(share2)));

    const nonce = Buffer.from(SHOWN, "utf8");
    const holds = [path.join(share2, ecs(share2)[0] || "none"), path.join(dir2, DRAFT_FILE),
                   edition ? path.join(dir2, "archive", edition, CATALOG_IN_ARCHIVE) : "none"]
      .filter(p => fs.existsSync(p)).map(p => fs.readFileSync(p).includes(nonce));
    check(holds.length === 3 && holds.every(x => !x),
      "fn-2d the display name is in none of the .ec, the draft and the archive's copy of the"
      + " catalog: " + JSON.stringify(holds));

    const again = await got(() => S.publishProject(dir2, { now: CLOCK }));
    check(again.v && same(ecs(share2), [fileName2]) && readJson(at).rev === 2,
      "fn-2e a second publish writes the same file name, and the share still holds one .ec: "
      + JSON.stringify(ecs(share2)));

    const list = S.listProjects(root2).projects[0];
    const open = await S.openProject(dir2);
    const plan2 = await S.publishPlan(dir2, {});
    check(list.name === SHOWN && open.name === SHOWN && plan2.name === SHOWN
          && list.fileName === fileName2 && open.fileName === fileName2
          && plan2.fileName === fileName2 && plan2.fileFixed === true,
      "fn-2f the list, the open and the plan answer the display name and the fixed file name: "
      + JSON.stringify([list.name, list.fileName, open.fileName, plan2.fileName, plan2.fileFixed]));
  });

  /* ---- 3. AN EXPLICIT FIRST NAME, AND ONE THAT MAY NOT COME AFTER --------------------------- */

  await leg("fn-3", async () => {
    const root = path.join(SCRATCH, "s3");
    const share = path.join(SCRATCH, "s3-share");
    const dir = plant(root, "Third one", "third-catalog");
    const first = await got(() => Pub.publishFull({ project: dir, folder: share, now: CLOCK,
      fileName: "My Own Name.EC" }));
    check(first.v && same(ecs(share), ["my-own-name.ec"])
          && readJson(path.join(dir, PROJECT_FILE)).fileName === "my-own-name.ec",
      "fn-3a a publish handed an explicit first name writes that name's slug and records it: "
      + JSON.stringify(ecs(share)));

    const before = tree(share);
    const bytes = fs.readFileSync(path.join(dir, PROJECT_FILE));
    const other = await got(() => Pub.publishFull({ project: dir, folder: share, now: CLOCK, fileName: "Different" }));
    check(other.e && !other.e.said && same(tree(share), before) && Pub.editionsIn(dir).length === 1
          && fs.readFileSync(path.join(dir, PROJECT_FILE)).equals(bytes),
      "fn-3b a different name handed once the name is fixed is a fault of the caller, a plain Error,"
      + " and nothing is written: " + JSON.stringify(other.e ? String(other.e.message).slice(0, 60) : "no error"));

    const equal = await got(() => Pub.publishFull({ project: dir, folder: share, now: CLOCK, fileName: "my-own-name" }));
    check(equal.v && same(ecs(share), ["my-own-name.ec"]),
      "fn-3c the same name handed again is not a fault, and the share still holds one .ec");

    const fresh = plant(root, "Fourth one", "fourth-catalog");
    const nothing = await got(() => Pub.publishFull({ project: fresh, folder: share, now: CLOCK,
      fileName: "Каталог" }));
    check(nothing.e && nothing.e.said && Pub.editionsIn(fresh).length === 0 && ecs(share).length === 1,
      "fn-3d an explicit name with no letter or digit in it is refused, in a frame, before anything"
      + " is written: " + JSON.stringify(nothing.e ? nothing.e.message : "no error"));
  });

  /* ---- 4. A PUBLISH NEVER WRITES OVER ANOTHER CATALOG --------------------------------------- */

  await leg("fn-4", async () => {
    const root = path.join(SCRATCH, "s4");
    const share = path.join(SCRATCH, "s4-share");
    const dir = plant(root, "Collide", "collide-catalog");
    otherCatalog(path.join(share, "taken.ec"), "another-catalog");
    const before = tree(share), bytes = fs.readFileSync(path.join(dir, PROJECT_FILE));
    const r = await got(() => Pub.publishFull({ project: dir, folder: share, now: CLOCK, fileName: "taken" }));
    check(r.e && r.e.said && r.e.said.vars.FILE === "taken.ec" && same(tree(share), before)
          && Pub.editionsIn(dir).length === 0 && !fs.existsSync(path.join(dir, "archive"))
          && fs.readFileSync(path.join(dir, PROJECT_FILE)).equals(bytes),
      "fn-4a a publish handed the name of another catalog's file is refused in a frame naming the"
      + " file: that file's sha256, the edition count, the archive and project.json are as they were ("
      + JSON.stringify(r.e && r.e.said ? r.e.said.vars.FILE : String(r.e)) + ")");

    fs.writeFileSync(path.join(share, "torn.ec"), "{ half a catalog", "utf8");
    const before2 = tree(share);
    const torn = await got(() => Pub.publishFull({ project: dir, folder: share, now: CLOCK, fileName: "torn" }));
    check(torn.e && torn.e.said && same(tree(share), before2) && Pub.editionsIn(dir).length === 0,
      "fn-4b a file that will not parse counts as another catalog, and is left as it was");

    const late = plant(root, "Late clash", "late-catalog");
    const lateShare = path.join(SCRATCH, "s4-late");
    await Pub.publishFull({ project: late, folder: lateShare, now: CLOCK, fileName: "late" });
    otherCatalog(path.join(lateShare, "late.ec"), "another-catalog");
    const beforeLate = tree(lateShare);
    const l = await got(() => Pub.publishFull({ project: late, folder: lateShare, now: CLOCK2 }));
    check(l.e && l.e.said && same(tree(lateShare), beforeLate) && Pub.editionsIn(late).length === 1,
      "fn-4c the refusal holds at every publish and not only the first: a later publish over"
      + " another catalog's file is refused, and no edition is archived");

    const suggest = plant(root, "Suggest Me", "suggest-catalog");
    const sShare = path.join(SCRATCH, "s4-suggest");
    otherCatalog(path.join(sShare, "suggest-me.ec"), "another-catalog");
    S.setPublishFolder(suggest, sShare);
    const plan = await got(() => S.publishPlan(suggest, {}));
    const pub = await got(() => S.publishProject(suggest, { now: CLOCK }));
    check(plan.v && plan.v.fileName === "suggest-me-2.ec" && pub.v
          && same(ecs(sShare), ["suggest-me-2.ec", "suggest-me.ec"])
          && readJson(path.join(sShare, "suggest-me.ec")).id === "another-catalog",
      "fn-4d a first publish whose suggestion is taken goes out under -2, the plan having said so,"
      + " and the other catalog's file is untouched: " + JSON.stringify(ecs(sShare)));

    /* A SHARE THAT ALREADY HOLDS THIS CATALOG UNDER ANOTHER NAME: the suggestion takes that name, so the
       plan never offers one the publish would refuse, and no second file with the id is written. */
    const acme = plant(root, "Acme Support", "acme-catalog", { displayName: "Acme Support" });
    const aShare = path.join(SCRATCH, "s4-acme");
    otherCatalog(path.join(aShare, "desk-copy.ec"), "acme-catalog");
    S.setPublishFolder(acme, aShare);
    const aPlan = await got(() => S.publishPlan(acme, {}));
    const aPub = await got(() => S.publishProject(acme, { now: CLOCK }));
    check(aPlan.v && aPlan.v.fileName === "desk-copy.ec" && aPlan.v.fileFixed === false && aPub.v
          && !aPub.v.refused && same(ecs(aShare), ["desk-copy.ec"])
          && readJson(path.join(aShare, "desk-copy.ec")).rev === 1
          && readJson(path.join(acme, PROJECT_FILE)).fileName === "desk-copy.ec",
      "fn-4e a first publish into a share that holds this catalog as desk-copy.ec is suggested that name,"
      + " goes out under it, and writes no second file: " + JSON.stringify([aPlan.v && aPlan.v.fileName,
        aPub.e ? String(aPub.e.message).slice(0, 60) : "published", ecs(aShare)]));

    /* THE COVER'S FILE NAME, EDITED WHILE A DESK COPY EXISTS (board 831). A project that has never
       been published has no Change file name row, so the refusal points at the field on this screen. */
    const COVER_FRAME = "{FOLDER} already holds {FILE}, which is this catalog's file under another name, so"
      + " nothing was published. Putting {FILE} back as the file name on this screen, or taking that file"
      + " out of the folder, lets the publish go out.";
    const edited = plant(root, "Edited cover", "edited-catalog");
    const eShare = path.join(SCRATCH, "s4-edited");
    otherCatalog(path.join(eShare, "desk-copy.ec"), "edited-catalog");
    const editedBefore = tree(eShare);
    const editedBytes = fs.readFileSync(path.join(edited, PROJECT_FILE));
    const editedRefusal = await got(() => Pub.publishFull({ project: edited, folder: eShare, now: CLOCK,
      fileName: "other-name" }));
    check(editedRefusal.e && editedRefusal.e.said && editedRefusal.e.said.frame === COVER_FRAME
          && editedRefusal.e.said.vars.FILE === "desk-copy.ec"
          && editedRefusal.e.said.vars.FOLDER === path.resolve(eShare)
          && editedRefusal.e.said.frame.indexOf("Change file name in Catalog details") < 0
          && same(tree(eShare), editedBefore) && Pub.editionsIn(edited).length === 0
          && fs.readFileSync(path.join(edited, PROJECT_FILE)).equals(editedBytes),
      "fn-4f a never-published project whose cover file name was edited while a desk copy exists is"
      + " refused in the cover's sentence, naming that copy, and nothing is written: "
      + JSON.stringify(editedRefusal.e && editedRefusal.e.said ? editedRefusal.e.said.frame.slice(0, 70)
        : String(editedRefusal.e)));
  });

  /* ---- 5 AND 6. WHAT WAS PUBLISHED BEFORE THIS BUILD, AND A PUBLISH CUT OFF ----------------- */

  await leg("fn-5", async () => {
    const root = path.join(SCRATCH, "s5");
    const share = path.join(SCRATCH, "s5-share");
    const dir = plant(root, "Legacy One", "legacy-catalog");
    await Pub.publishFull({ project: dir, folder: share, now: CLOCK, fileName: "temporary" });
    /* Made into what an earlier build left: <id>.ec on the share, no fileName, and a report with
       no file in it. */
    fs.renameSync(path.join(share, "temporary.ec"), path.join(share, "legacy-catalog.ec"));
    const at = path.join(dir, PROJECT_FILE);
    const project = readJson(at); delete project.fileName;
    fs.writeFileSync(at, Pub.json(project), "utf8");
    const rep = path.join(dir, "archive", Pub.editionsIn(dir)[0], REPORT);
    const report = readJson(rep); delete report.file;
    fs.writeFileSync(rep, Pub.json(report), "utf8");

    const plan = await got(() => S.publishPlan(dir, {}));
    const list = S.listProjects(root).projects[0];
    const r = await got(() => Pub.publishFull({ project: dir, folder: share, now: CLOCK2 }));
    check(r.v && same(ecs(share), ["legacy-catalog.ec"])
          && readJson(at).fileName === "legacy-catalog.ec"
          && plan.v && plan.v.fileName === "legacy-catalog.ec" && plan.v.fileFixed === true
          && list.fileName === "legacy-catalog.ec",
      "fn-5a a project published before this build keeps its <id>.ec: the plan and the list say so,"
      + " the next publish writes it and records it, and the share still holds one .ec: "
      + JSON.stringify(ecs(share)));
  });

  await leg("fn-6", async () => {
    const root = path.join(SCRATCH, "s6");
    const share = path.join(SCRATCH, "s6-share");
    const dir = plant(root, "Cut Off", "cutoff-catalog");
    await Pub.publishFull({ project: dir, folder: share, now: CLOCK, fileName: "x" });
    const at = path.join(dir, PROJECT_FILE);
    const project = readJson(at); delete project.fileName;
    fs.writeFileSync(at, Pub.json(project), "utf8");
    const rep = path.join(dir, "archive", Pub.editionsIn(dir)[0], REPORT);
    check(readJson(rep).file === "x.ec", "fn-6a the archived report says which name the edition went out under");
    const r = await got(() => Pub.publishFull({ project: dir, folder: share, now: CLOCK2 }));
    check(r.v && same(ecs(share), ["x.ec"]) && readJson(at).fileName === "x.ec",
      "fn-6b a project whose record was never written writes the name the archive's last report"
      + " gives, and the share still holds one .ec: " + JSON.stringify(ecs(share)));
  });

  /* ---- 7. THE CSV SHAPE KEEPS <id>.ec, WHICH tests/round-trip.mjs IS THE CONTRACT OF -------- */

  await leg("fn-7", async () => {
    const out = path.join(SCRATCH, "s7-pile");
    const gen = spawnSync(process.execPath, ["tools/fixtures/generate.mjs", "--seed", "11",
      "--rows", "12", "--out", out], { cwd: ROOT, encoding: "utf8" });
    if (gen.status !== 0) throw new Error("the generator refused: " + (gen.stderr || gen.stdout));
    const folder = path.join(SCRATCH, "s7-share");
    const r = await got(() => Pub.publish({ csv: path.join(out, "macros.csv"), folder, id: "csv-shape-id" }));
    check(r.v && path.basename(r.v) === "csv-shape-id.ec" && same(ecs(folder), ["csv-shape-id.ec"]),
      "fn-7a the CSV shape still writes <id>.ec: " + JSON.stringify(ecs(folder)));
  });

  /* ---- 8. THE CHANGE MOVES THE ONE FILE AND NOTHING ELSE ------------------------------------ */

  await leg("fn-8", async () => {
    const root = path.join(SCRATCH, "s8");
    const share = path.join(SCRATCH, "s8-share");
    const dir = plant(root, "Signed one", "signed-catalog");
    const keyAt = path.join(SCRATCH, "s8-key.json");
    fs.writeFileSync(keyAt, JSON.stringify(await makeKeyFile({ passphrase: PASS }), null, 1) + "\n", "utf8");
    await Pub.publishFull({ project: dir, folder: share, now: CLOCK, key: keyAt, passphrase: PASS,
      fileName: "Signed first" });
    /* A desk's live answer and the lead's counting period, the two files live statistics keep on the share (board 891). */
    fs.mkdirSync(path.join(share, "desks", "k-0123456789abcdef"), { recursive: true });
    fs.writeFileSync(path.join(share, "desks", "k-0123456789abcdef", "stats.estat"), "planted answer", "utf8");
    fs.writeFileSync(path.join(share, "stats-span.json"), "planted span", "utf8");
    S.setPublishFolder(dir, share);

    const beforeShare = tree(share), beforeDir = tree(dir);
    const projectBefore = readJson(path.join(dir, PROJECT_FILE));
    const moved = await got(() => S.changeFileName(dir, "Signed Renamed"));
    const afterShare = tree(share), afterDir = tree(dir);
    const projectAfter = readJson(path.join(dir, PROJECT_FILE));

    const oldGone = !fs.existsSync(path.join(share, "signed-first.ec"));
    check(moved.v && moved.v.fileName === "signed-renamed.ec" && moved.v.moved === true && oldGone
          && afterShare["signed-renamed.ec"] === beforeShare["signed-first.ec"],
      "fn-8a the old name is gone and the new name holds the same sha256: "
      + JSON.stringify(moved.v || String(moved.e)));

    const rest = k => Object.keys(k).filter(n => !/\.ec$/.test(n)).sort().map(n => n + "=" + k[n]);
    check(same(rest(afterShare), rest(beforeShare)) && Object.keys(afterShare).length === Object.keys(beforeShare).length
          && afterShare[RING_FILE] === beforeShare[RING_FILE]
          && !!beforeShare["desks/k-0123456789abcdef/stats.estat"] && !!beforeShare["stats-span.json"]
          && afterShare["desks/k-0123456789abcdef/stats.estat"] === beforeShare["desks/k-0123456789abcdef/stats.estat"]
          && afterShare["stats-span.json"] === beforeShare["stats-span.json"],
      "fn-8b the ring, a desk's live answer and the counting period on the share are byte-identical afterwards");

    const archiveOf = t => Object.keys(t).filter(n => n.indexOf("archive/") === 0).sort().map(n => n + "=" + t[n]);
    check(archiveOf(afterDir).length > 0 && same(archiveOf(afterDir), archiveOf(beforeDir))
          && afterDir[DRAFT_FILE] === beforeDir[DRAFT_FILE],
      "fn-8c the draft and every file of the archive are byte-identical afterwards ("
      + archiveOf(afterDir).length + " archive files)");

    const expect = Object.assign({}, projectBefore, { fileName: "signed-renamed.ec" });
    check(same(projectAfter, expect) && projectAfter.id === "signed-catalog"
          && readJson(path.join(dir, DRAFT_FILE)).id === "signed-catalog",
      "fn-8d project.json differs in fileName alone, and the id in it and in the draft is the same");

    const V = Engine.sigRules(), R = Engine.ringRules();
    const doc = readJson(path.join(share, "signed-renamed.ec"));
    const ring = R.v2RingRead(fs.readFileSync(path.join(share, RING_FILE), "utf8")).ring;
    const state = await V.v2SigState(doc, ring);
    check(doc.sig && state === V.states.valid,
      "fn-8e the signed catalog, moved, still reads valid against the ring beside it by the pinned"
      + " engine's own check: " + state);

    const next = await got(() => Pub.publishFull({ project: dir, folder: share, now: CLOCK2, key: keyAt, passphrase: PASS }));
    check(next.v && same(ecs(share), ["signed-renamed.ec"]),
      "fn-8f the next publish writes only the new name: " + JSON.stringify(ecs(share)));

    /* THE RING NAMES A KEY AND A CATALOG ID (criterion 1), and no byte of the display name. */
    const NONCE = "Zevrant Ulmo 5519";
    const named = await S.newProject(path.join(SCRATCH, "s8-named"), NONCE);
    const ringShare = path.join(SCRATCH, "s8-named-share");
    await Pub.publishFull({ project: named.dir, folder: ringShare, key: keyAt, passphrase: PASS,
      override: "an empty sample", now: CLOCK });
    const ringBytes = fs.readFileSync(path.join(ringShare, RING_FILE));
    check(ringBytes.length > 0 && !ringBytes.includes(Buffer.from(NONCE, "utf8")),
      "fn-8g the ring written beside a signed publish of a named project carries no byte of the display"
      + " name (" + ringBytes.length + " bytes)");
  });

  /* ---- 9. THE CHANGE REFUSES WHOLE ---------------------------------------------------------- */

  await leg("fn-9", async () => {
    const root = path.join(SCRATCH, "s9");
    let n = 0;
    /** A project published once to its own share under "orig name", ready to be changed. */
    const ready = async () => {
      n++;
      const dir = plant(root, "Change " + n, "change-" + n + "-catalog");
      const share = path.join(SCRATCH, "s9-share-" + n);
      await Pub.publishFull({ project: dir, folder: share, now: CLOCK, fileName: "orig name" });
      S.setPublishFolder(dir, share);
      return { dir, share };
    };
    const snap = ({ dir, share }) => ({ share: tree(share), dir: tree(dir) });
    const untouched = (a, b) => same(a.share, b.share) && same(a.dir, b.dir);

    const t = await ready(); otherCatalog(path.join(t.share, "wanted.ec"), "another-catalog");
    let was = snap(t);
    let r = await got(() => S.changeFileName(t.dir, "Wanted"));
    check(r.e && r.e.said && r.e.said.vars.FILE === "wanted.ec" && r.e.said.vars.NAME === "orig-name.ec"
          && untouched(was, snap(t)),
      "fn-9a a name the folder already holds is refused, naming it and the name kept, with the share,"
      + " the archive and project.json byte-identical: " + JSON.stringify(r.e ? r.e.message : "no error"));

    const o = await ready(); otherCatalog(path.join(o.share, "orig-name.ec"), "another-catalog");
    was = snap(o);
    r = await got(() => S.changeFileName(o.dir, "Fresh"));
    check(r.e && r.e.said && r.e.said.vars.FILE === "orig-name.ec" && untouched(was, snap(o)),
      "fn-9b an old file that is another catalog stays where it is, and nothing is recorded: "
      + JSON.stringify(r.e ? r.e.message : "no error"));

    const away = await ready();
    const drive = freeDrive();
    S.setPublishFolder(away.dir, drive + "\\share\\catalogs");
    const bytes = tree(away.dir);
    r = await got(() => S.changeFileName(away.dir, "Elsewhere"));
    const said = r.e ? diskRefusal(r.e) : null;
    check(drive && said && said.disk === true && said.said && /reach/.test(said.said.frame)
          && same(tree(away.dir), bytes),
      "fn-9c a share out of reach is said as the disk's refusal to reach it, and nothing is recorded: "
      + JSON.stringify(said ? said.message : "no error"));

    const e = await ready(); was = snap(e);
    const nothing = await got(() => S.changeFileName(e.dir, "Каталог"));
    const blank = await got(() => S.changeFileName(e.dir, "   "));
    check(nothing.e && nothing.e.said && blank.e && blank.e.said && untouched(was, snap(e)),
      "fn-9d a name with no letter or digit in it, and a blank one, are refused in a frame with nothing moved");

    const same_ = await ready(); was = snap(same_);
    const a = await got(() => S.changeFileName(same_.dir, "Orig Name"));
    const b = await got(() => S.changeFileName(same_.dir, "orig-name.ec"));
    check(a.v && b.v && a.v.moved === false && b.v.moved === false && a.v.fileName === "orig-name.ec"
          && untouched(was, snap(same_)),
      "fn-9e the same name, typed two ways, moves nothing and refuses nothing");

    const mv = await ready(); was = snap(mv);
    const noMove = await withRenameFault((from) => /orig-name\.ec$/.test(from),
      () => got(() => S.changeFileName(mv.dir, "Elsewhere")));
    check(noMove.e && diskRefusal(noMove.e).disk === true && untouched(was, snap(mv)),
      "fn-9f PLANTED: the move refused leaves the old file where it was and records nothing");

    const wr = await ready(); was = snap(wr);
    const noWrite = await withRenameFault((from, to) => /project\.json$/.test(to),
      () => got(() => S.changeFileName(wr.dir, "Elsewhere")));
    check(noWrite.e && diskRefusal(noWrite.e).disk === true && untouched(was, snap(wr))
          && fs.existsSync(path.join(wr.share, "orig-name.ec"))
          && !fs.existsSync(path.join(wr.share, "elsewhere.ec")),
      "fn-9g PLANTED: project.json refused after the move puts the file back, so the name and the"
      + " file are as before");

    /* No folder recorded: a project published from the command line with --folder only. */
    const bare = plant(root, "Bare", "bare-catalog");
    const bareShare = path.join(SCRATCH, "s9-bare-share");
    await Pub.publishFull({ project: bare, folder: bareShare, now: CLOCK, fileName: "orig name" });
    const shareBefore = tree(bareShare);
    const rec = await got(() => S.changeFileName(bare, "Recorded only"));
    check(rec.v && rec.v.moved === false && readJson(path.join(bare, PROJECT_FILE)).fileName === "recorded-only.ec"
          && same(tree(bareShare), shareBefore),
      "fn-9h with no folder recorded the new name is recorded and nothing moves");

    const gone = await ready();
    fs.rmSync(path.join(gone.share, "orig-name.ec"));
    const rec2 = await got(() => S.changeFileName(gone.dir, "Not there yet"));
    const pub = await got(() => Pub.publishFull({ project: gone.dir, folder: gone.share, now: CLOCK2 }));
    check(rec2.v && rec2.v.moved === false && pub.v && same(ecs(gone.share), ["not-there-yet.ec"]),
      "fn-9i an old file absent from the folder has the new name recorded, and the next publish writes it");

    const never = plant(root, "Never published", "never-catalog");
    const fault = await got(() => S.changeFileName(never, "Anything"));
    check(fault.e && !fault.e.said,
      "fn-9j a project never published has no file name to change, and asking is a fault of the caller");

    /* THE DOUBLE FAILURE: the record refused after the move, and the move back refused too. */
    const dbl = await ready();
    const recordAt = path.join(dbl.dir, PROJECT_FILE), oldAt = path.join(dbl.share, "orig-name.ec");
    const newAt = path.join(dbl.share, "second-name.ec");
    const recordBefore = fs.readFileSync(recordAt);
    const stuck = await withRenameFault((from, to) => /project\.json$/.test(to) || from === newAt,
      () => got(() => S.changeFileName(dbl.dir, "Second Name")));
    check(stuck.e && stuck.e.said && stuck.e.message.indexOf("second-name.ec") >= 0
          && stuck.e.message.indexOf("orig-name.ec") >= 0 && same(ecs(dbl.share), ["second-name.ec"])
          && fs.readFileSync(recordAt).equals(recordBefore),
      "fn-9k PLANTED: the record refused and the file not put back either is refused in words naming both"
      + " files, with the file where it lies and the record as it was: "
      + JSON.stringify(stuck.e ? stuck.e.message.slice(0, 90) : "no error"));
    const shareStuck = tree(dbl.share), editionsStuck = Pub.editionsIn(dbl.dir).length;
    const blocked = await got(() => Pub.publishFull({ project: dbl.dir, folder: dbl.share, now: CLOCK2 }));
    check(blocked.e && blocked.e.said && blocked.e.said.vars.FILE === "second-name.ec"
          && same(tree(dbl.share), shareStuck) && Pub.editionsIn(dbl.dir).length === editionsStuck
          && !fs.existsSync(oldAt),
      "fn-9l the next publish is refused, naming the copy, and writes no second file with the same id:"
      + " " + JSON.stringify(ecs(dbl.share)));
    check(blocked.e && blocked.e.said
          && blocked.e.said.frame.indexOf("Change file name in Catalog details") >= 0
          && blocked.e.said.frame.indexOf("on this screen") < 0,
      "fn-9n a published project keeps today's Catalog details sentence, and is not sent to the cover's"
      + " File name: " + JSON.stringify(blocked.e && blocked.e.said
        ? blocked.e.said.frame.slice(blocked.e.said.frame.indexOf("Choosing")) : "no frame"));
    const mended = await got(() => S.changeFileName(dbl.dir, "Second Name"));
    const after = await got(() => Pub.publishFull({ project: dbl.dir, folder: dbl.share, now: CLOCK2 }));
    check(mended.v && mended.v.moved === false && readJson(recordAt).fileName === "second-name.ec"
          && after.v && same(ecs(dbl.share), ["second-name.ec"]),
      "fn-9m choosing the name the file lies under repairs the record, and the next publish goes out"
      + " under it alone: " + JSON.stringify(ecs(dbl.share)));
  });

  /* ---- 10. THE DISPLAY NAME AND THE FOLDER: ALL OR NOTHING ---------------------------------- */

  await leg("fn-10", async () => {
    const root = path.join(SCRATCH, "s10");
    const plain = plant(root, "Plain Folder", "plain-catalog");
    const list = S.listProjects(root).projects[0];
    const open = await S.openProject(plain);
    const plan = await S.publishPlan(plain, {});
    check(list.name === "Plain Folder" && open.name === "Plain Folder" && plan.name === "Plain Folder"
          && !("displayName" in readJson(path.join(plain, PROJECT_FILE))),
      "fn-10a a project with no name answers its folder's name from the list, the open and the plan,"
      + " and neither the list nor the open writes a name in: " + JSON.stringify([list.name, open.name, plan.name]));

    /* THE DISPLAY RENAME OF A PUBLISHED PROJECT (section 2's): the folder follows, the file does not. */
    const share = share2;
    const shareBefore = tree(share);
    const NEW = "Ondrave plasule, EN & PL";
    const r = await got(() => S.renameProject(dir2, NEW));
    const to = path.join(root2, NEW);
    const at = path.join(to, PROJECT_FILE);
    check(r.v && r.v.name === NEW && r.v.dir === to && fs.existsSync(to) && !fs.existsSync(dir2)
          && readJson(at).displayName === NEW && readJson(at).fileName === fileName2
          && same(tree(share), shareBefore) && same(ecs(share), [fileName2]),
      "fn-10b a display rename moves the folder by the stem rule and stores the text verbatim, and"
      + " the file name and every byte on the share are untouched: " + JSON.stringify(r.v || String(r.e)));
    dir2 = to;

    const same_ = await S.newProject(root, "Acme Support");
    const stem = await got(() => S.renameProject(same_.dir, "Acme Support."));
    check(stem.v && stem.v.dir === same_.dir && fs.existsSync(same_.dir)
          && readJson(path.join(same_.dir, PROJECT_FILE)).displayName === "Acme Support.",
      "fn-10c a rename whose stem is the folder's own moves nothing and still stores the name");

    const busy = await S.newProject(root, "Busy folder");
    const clash = await S.newProject(root, "Taken folder");
    const bytesB = fs.readFileSync(path.join(busy.dir, PROJECT_FILE));
    const refused = await got(() => S.renameProject(busy.dir, "Taken folder"));
    check(refused.e && refused.e.said && fs.readFileSync(path.join(busy.dir, PROJECT_FILE)).equals(bytesB)
          && fs.existsSync(clash.dir),
      "fn-10d a folder the name would give that is taken refuses, and the name is not written");

    /* THE TWO PLANTED FAILURES: the folder refused, then project.json refused after the folder moved. */
    const p1 = await S.newProject(root, "Move refused");
    const b1 = tree(p1.dir);
    const m1 = await withRenameFault((from) => from === p1.dir, () => got(() => S.renameProject(p1.dir, "Moved elsewhere")));
    check(m1.e && diskRefusal(m1.e).disk === true && fs.existsSync(p1.dir)
          && !fs.existsSync(path.join(root, "Moved elsewhere")) && same(tree(p1.dir), b1),
      "fn-10e PLANTED: the folder move refused leaves the folder, its name and its file name as they were");

    const p2 = await S.newProject(root, "Write refused");
    const b2 = tree(p2.dir);
    const target = path.join(root, "Written elsewhere");
    const m2 = await withRenameFault((from, dest) => dest === path.join(target, PROJECT_FILE),
      () => got(() => S.renameProject(p2.dir, "Written elsewhere")));
    check(m2.e && diskRefusal(m2.e).disk === true && fs.existsSync(p2.dir) && !fs.existsSync(target)
          && same(tree(p2.dir), b2),
      "fn-10f PLANTED: the name refused after the folder moved puts the folder back, so the folder,"
      + " the name and the file name are as they were");

    /* A NAME THE STEM RULE CHANGES, so the display name and the folder part company: the folder's
       name is not the typed text, and every answer is the typed text. */
    const TYPED = "Qorvath / Blemish: 7431?";
    const made = await S.newProject(root, TYPED);
    S.setPublishFolder(made.dir, path.join(SCRATCH, "s10-share"));
    const list1 = S.listProjects(root).projects.find(p => p.dir === made.dir);
    const open1 = await S.openProject(made.dir), plan1 = await S.publishPlan(made.dir, {});
    const pub1 = await got(() => S.publishProject(made.dir, { override: "an empty sample", now: CLOCK }));
    const notes1 = pub1.v && pub1.v.archive
      ? fs.readFileSync(path.join(pub1.v.archive, Pub.RELEASE_IN_ARCHIVE), "utf8") : "";
    check(path.basename(made.dir) !== TYPED && list1.name === TYPED && open1.name === TYPED
          && plan1.name === TYPED && notes1.indexOf(TYPED) >= 0,
      "fn-10g a display name the folder rule changes is what the list, the open, the plan and the release"
      + " notes answer, and not the folder's: " + JSON.stringify([path.basename(made.dir), list1.name, open1.name,
        plan1.name, notes1.indexOf(TYPED) >= 0]));

    /* AN OLDER RECORD'S `name` IS NEITHER READ NOR REWRITTEN (0a0e104): the folder's name shows. */
    const stale = plant(root, "Renamed since", "stale-catalog", { name: "Name typed in August" });
    const staleAt = path.join(stale, PROJECT_FILE);
    const listS = S.listProjects(root).projects.find(p => p.dir === stale);
    const openS = await S.openProject(stale), planS = await S.publishPlan(stale, {});
    check(listS.name === "Renamed since" && openS.name === "Renamed since" && planS.name === "Renamed since"
          && readJson(staleAt).name === "Name typed in August" && !("displayName" in readJson(staleAt)),
      "fn-10h a record with a stale name and no displayName shows its folder's name from the list, the open"
      + " and the plan, and neither writes a display name nor touches the stale one: "
      + JSON.stringify([listS.name, openS.name, planS.name]));
    const fresh = await got(() => S.renameProject(stale, "Fresh words"));
    const freshAt = path.join(root, "Fresh words", PROJECT_FILE);
    check(fresh.v && readJson(freshAt).displayName === "Fresh words" && readJson(freshAt).name === "Name typed in August",
      "fn-10i a rename writes displayName and leaves the stale name exactly as it was");

    /* THE DOUBLE FAILURE: the name refused after the folder moved, and the folder not put back either. */
    const p3 = await S.newProject(root, "Double moved from");
    const to3 = path.join(root, "Double moved to");
    const both = await withRenameFault((from, dest) => dest === path.join(to3, PROJECT_FILE) || from === to3,
      () => got(() => S.renameProject(p3.dir, "Double moved to")));
    const lies = S.listProjects(root).projects.find(p => p.dir === to3);
    const opens = await got(() => S.openProject(to3));
    check(both.e && both.e.said && both.e.message.indexOf(p3.dir) >= 0 && both.e.message.indexOf(to3) >= 0
          && fs.existsSync(to3) && !fs.existsSync(p3.dir) && lies && opens.v && opens.v.name === "Double moved from",
      "fn-10j PLANTED: the name refused and the folder not put back either is refused in words naming both"
      + " folders, and the project stays listed and openable where it lies: "
      + JSON.stringify(both.e ? both.e.message.slice(0, 80) : "no error"));
  });

  /* ---- 11. A CATALOG BROUGHT IN KEEPS THE NAME DESKS KNOW IT BY ----------------------------- */

  await leg("fn-11", async () => {
    const root = path.join(SCRATCH, "s11");
    const share = path.join(SCRATCH, "s11-share");
    fs.mkdirSync(root, { recursive: true });
    const file = path.join(SCRATCH, "s11-src", "desk-own-name.ec");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Pub.json(catalogOf(F, "brought-in-catalog", "brought")), "utf8");
    const landed = await got(() => S.upgradeLand(root, file, "Brought in"));
    const dir = landed.v ? landed.v.dir : "";
    check(landed.v && readJson(path.join(dir, PROJECT_FILE)).fileNameFrom === "desk-own-name.ec",
      "fn-11a a catalog brought in records the file it came from: "
      + JSON.stringify(landed.v ? readJson(path.join(dir, PROJECT_FILE)).fileNameFrom : String(landed.e)));
    S.setPublishFolder(dir, share);
    const plan = await got(() => S.publishPlan(dir, {}));
    const pub = await got(() => S.publishProject(dir, { now: CLOCK }));
    check(plan.v && plan.v.fileName === "desk-own-name.ec" && plan.v.fileFixed === false && pub.v
          && same(ecs(share), ["desk-own-name.ec"]),
      "fn-11b its first publish suggests that file's name, and writes it: " + JSON.stringify(ecs(share)));
  });

  /* ---- 12. THE COMMAND LINE AND THE SCREEN REACH ONE NAME BY ONE RULE ----------------------- */

  await leg("fn-12", async () => {
    const a = plant(path.join(SCRATCH, "s12-a"), "Same Words, EN plus PL", "cli-catalog");
    const b = plant(path.join(SCRATCH, "s12-b"), "Same Words, EN plus PL", "screen-catalog");
    const shareA = path.join(SCRATCH, "s12-share-a"), shareB = path.join(SCRATCH, "s12-share-b");
    S.setPublishFolder(a, shareA); S.setPublishFolder(b, shareB);
    const planned = await got(() => S.publishPlan(a, {}));
    const cli = spawnSync(process.execPath, ["tools/publish.mjs", a, "--folder", shareA, "--now", CLOCK],
      { cwd: ROOT, encoding: "utf8" });
    const screen = await got(() => S.publishProject(b, { now: CLOCK }));
    check(cli.status === 0 && screen.v && same(ecs(shareA), ecs(shareB)) && ecs(shareA).length === 1
          && planned.v && ecs(shareA)[0] === planned.v.fileName,
      "fn-12a tools/publish.mjs and the screen's publish write the same file name, the one the plan"
      + " gave: " + JSON.stringify([ecs(shareA), ecs(shareB), planned.v && planned.v.fileName]));
  });

  /* ---- 13. SAFER WRITES ON A SHARED FOLDER (board 945, item 1) ------------------------------ */

  await leg("fn-13", async () => {
    const root = path.join(SCRATCH, "s13");
    fs.mkdirSync(root, { recursive: true });

    /* 13a: Temporary names unique per write (process, thread and a random part), in target's directory,
            removed on every failure path */
    const targetA = path.join(root, "temp-test.txt");
    const t1 = tempName(targetA), t2 = tempName(targetA);
    const pidPart = "." + process.pid + ".";
    check(t1 !== t2 && path.dirname(t1) === root && /\.tmp$/.test(t1) && t1.indexOf(pidPart) >= 0,
      "fn-13a temporary names are unique per write, in the target's own directory, with pid, thread and random parts: "
      + JSON.stringify([path.basename(t1), path.basename(t2)]));

    /* failure path: write failure cleans up temporary file */
    const realWrite = fs.writeSync;
    fs.writeSync = function (...a) { throw Object.assign(new Error("disk full"), { code: "ENOSPC" }); };
    let threwWrite = null;
    try { writeWhole(targetA, "data"); } catch (e) { threwWrite = e; }
    finally { fs.writeSync = realWrite; }
    const tmpsAfterWriteFail = fs.readdirSync(root).filter(n => /\.tmp$/.test(n));
    check(threwWrite && threwWrite.code === "ENOSPC" && threwWrite.path === targetA && tmpsAfterWriteFail.length === 0,
      "fn-13a1 a failed write throws naming the target and removes the temporary file: "
      + JSON.stringify([threwWrite && threwWrite.code, threwWrite && threwWrite.path, tmpsAfterWriteFail]));

    /* 13b: Two writers to one target at once leave one whole file and no stray temporary */
    const targetB = path.join(root, "two-writers.txt");
    const textA = "A".repeat(100000);
    const textB = "B".repeat(100000);
    const wwPath = path.resolve(ROOT, "src", "whole-write.cjs");
    const writerCode = `
      const { parentPort, workerData } = require("node:worker_threads");
      const { writeWhole } = require(workerData.ww);
      try {
        writeWhole(workerData.target, workerData.text);
        parentPort.postMessage({ ok: true });
      } catch (e) {
        parentPort.postMessage({ ok: false, error: e.message, code: e.code });
      }
    `;
    const w1 = new Worker(writerCode, { eval: true, workerData: { ww: wwPath, target: targetB, text: textA } });
    const w2 = new Worker(writerCode, { eval: true, workerData: { ww: wwPath, target: targetB, text: textB } });
    const [res1, res2] = await Promise.all([
      new Promise(r => w1.on("message", r)),
      new Promise(r => w2.on("message", r)),
    ]);
    await Promise.all([w1.terminate(), w2.terminate()]);
    const finalB = fs.existsSync(targetB) ? fs.readFileSync(targetB, "utf8") : "";
    const tmpsB = fs.readdirSync(root).filter(n => /\.tmp$/.test(n));
    check(res1.ok && res2.ok && (finalB === textA || finalB === textB) && tmpsB.length === 0,
      "fn-13b two writers to one target at once leave one whole file and no stray temporary: "
      + JSON.stringify([res1.ok, res2.ok, finalB === textA ? "A" : finalB === textB ? "B" : "corrupted", tmpsB]));

    /* 13c: A target held open is replaced once released inside the window */
    const targetC = path.join(root, "held-inside.txt");
    fs.writeFileSync(targetC, "initial bytes before hold", "utf8");
    const holderCode = `
      const { parentPort, workerData } = require("node:worker_threads");
      const fs = require("node:fs");
      let fd = null;
      try {
        fd = fs.openSync(workerData.target, "r");
        parentPort.postMessage({ held: true });
      } catch (e) { parentPort.postMessage({ held: false, error: e.message }); }
      if (workerData.releaseAfterMs) {
        setTimeout(() => {
          try { fs.closeSync(fd); fd = null; } catch {}
          parentPort.postMessage({ released: true });
        }, workerData.releaseAfterMs);
      }
      parentPort.on("message", (msg) => {
        if (msg === "close" && fd !== null) {
          try { fs.closeSync(fd); fd = null; } catch {}
          parentPort.postMessage({ closed: true });
        }
      });
    `;
    const wHoldInside = new Worker(holderCode, { eval: true, workerData: { target: targetC, releaseAfterMs: 600 } });
    await new Promise(r => wHoldInside.on("message", m => { if (m.held) r(); }));
    writeWhole(targetC, "replaced once released inside window");
    await wHoldInside.terminate();
    const finalC = fs.readFileSync(targetC, "utf8");
    const tmpsC = fs.readdirSync(root).filter(n => /\.tmp$/.test(n));
    check(finalC === "replaced once released inside window" && tmpsC.length === 0,
      "fn-13c a target held open is replaced once released inside the window: "
      + JSON.stringify([finalC, tmpsC]));

    /* 13d: A target held open past the window is refused cleanly, old bytes intact */
    /* It stands aside off Windows (Claude gamma's Linux sweep, 2026-11-14): Linux replaces a file another reader holds open, so
       there is no sharing violation for writeWhole to refuse and the leg has no fault to hold there. */
    const aside13d = OffWindows.standAside("fn-13d",
      "Linux replaces a file another reader holds open, so there is no sharing violation for writeWhole to refuse");
    if (aside13d) skip(aside13d);
    else {
      const targetD = path.join(root, "held-past.txt");
      const oldBytesD = "untouched old bytes that must survive";
      fs.writeFileSync(targetD, oldBytesD, "utf8");
      const wHoldPast = new Worker(holderCode, { eval: true, workerData: { target: targetD, releaseAfterMs: 0 } });
      await new Promise(r => wHoldPast.on("message", m => { if (m.held) r(); }));
      let threwPast = null;
      try {
        writeWhole(targetD, "should never replace target");
      } catch (e) {
        threwPast = e;
      }
      wHoldPast.postMessage("close");
      await new Promise(r => wHoldPast.on("message", m => { if (m.closed) r(); }));
      await wHoldPast.terminate();
      const finalD = fs.readFileSync(targetD, "utf8");
      const tmpsD = fs.readdirSync(root).filter(n => /\.tmp$/.test(n));
      check(threwPast && BUSY.indexOf(threwPast.code) >= 0 && threwPast.path === targetD
            && finalD === oldBytesD && tmpsD.length === 0,
        "fn-13d a target held open past the window is refused cleanly, old bytes intact: "
        + JSON.stringify([threwPast && threwPast.code, threwPast && threwPast.path, finalD === oldBytesD, tmpsD]));
    }
  });

  if (!keep) dropScratch(SCRATCH, "file-name");
  process.stdout.write("file-name  " + asserted + " assertion(s), " + (skipped ? skipped + " skipped, " : "") + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("file-name  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
