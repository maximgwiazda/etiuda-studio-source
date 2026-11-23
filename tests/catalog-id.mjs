/* A NEW CATALOG'S ID IS RANDOM, MADE ONCE, AND KEPT BY EVERY EDITION (Studio item 2, the desk's 14).
 *
 *     node tests/catalog-id.mjs [--keep]
 *
 * Both doors that make a catalog from nothing are driven in node: New project, and an import that
 * lands as a new project. Each id is read off the disk and held to the pinned engine's id rule and
 * to not being the slug of the name it was made under. The folder IS the project's name, by the
 * engine's own rule for a catalog's file name, and the record carries the typed name where the draft carries none;
 * a rename renames the folder and moves nothing inside it. Two editions published from one
 * project are read back for the id they carry. An import into an existing project is the
 * control: its pile keeps an id of its own, as the review queue needs.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as Engine from "../src/engine.mjs";
import { DRAFT_FILE, PROJECT_FILE, RELEASE_IN_ARCHIVE } from "../src/publish.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "catalog-id");
const EXPECTED = 20;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const readJson = (f) => JSON.parse(fs.readFileSync(f, "utf8"));

async function main(argv) {
  clearScratch(SCRATCH);
  const S = await import("../src/studio.mjs");
  const F = await Engine.format();
  const root = path.join(SCRATCH, "projects"), share = path.join(SCRATCH, "share");
  fs.mkdirSync(root, { recursive: true }); fs.mkdirSync(share, { recursive: true });
  const en = [{ code: "en", name: "English" }];

  /* ---- 1. New project ----------------------------------------------------------------------- */
  const a = await S.newProject(root, "Zubynt ondrave", en);
  const b = await S.newProject(root, "Ondrave plasule", en);
  const twinRoot = path.join(SCRATCH, "elsewhere");
  fs.mkdirSync(twinRoot, { recursive: true });
  const twin = await S.newProject(twinRoot, "Zubynt ondrave", en);
  const ids = [a.draft.id, b.draft.id, twin.draft.id];
  check(ids.every((id) => F.idOk(id)) && a.draft.id !== F.slug("Zubynt ondrave") && b.draft.id !== F.slug("Ondrave plasule")
        && new Set(ids).size === 3,
    "1a a new project's catalog id passes the format's id rule, is not the slug of its name, and is not"
    + " derived from it at all: two projects of one name, in two folders, get two ids: " + JSON.stringify(ids));
  const aRec = readJson(path.join(a.dir, PROJECT_FILE)), aDraft = readJson(path.join(a.dir, DRAFT_FILE));
  check(path.basename(a.dir) === "Zubynt ondrave" && a.name === "Zubynt ondrave" && aRec.id === a.draft.id
        && aDraft.id === a.draft.id && aRec.displayName === "Zubynt ondrave" && !("name" in aDraft),
    "1b its folder is the name as typed, which is the name the project answers with, the project record and"
    + " the draft on disk carry the same id, and only the record carries a name: " + JSON.stringify({ folder: path.basename(a.dir),
      name: a.name, record: aRec.id, named: ["name" in aRec, "name" in aDraft] }));
  const z = await S.newProject(root, "Zb", en).catch((e) => e);
  const odd = await S.newProject(root, 'A/B: "C"?', en).catch((e) => e);
  const dev = await S.newProject(root, "CON", en).catch((e) => e);
  check(!!z.draft && F.idOk(z.draft.id) && path.basename(z.dir) === "Zb"
        && !!odd.draft && path.basename(odd.dir) === "A-B- -C--" && !!dev.draft && path.basename(dev.dir) === "CON-project",
    "1c a name too short to be an id makes a project, a character Windows refuses in a folder is replaced"
    + " by the engine's file rule, and a device name in capitals still takes its suffix: " + JSON.stringify({
      short: z.draft ? path.basename(z.dir) : String(z.message || z),
      odd: odd.draft ? path.basename(odd.dir) : String(odd.message || odd),
      device: dev.draft ? path.basename(dev.dir) : String(dev.message || dev) }));

  /* ---- 2. Every edition keeps it ------------------------------------------------------------- */
  const t = await S.addTag(a.dir, "shelf", { en: "General" });
  await S.addCard(a.dir, (t.tag || t).id, "Alpha", "The alpha answer, in full.");
  const pub1 = await S.publishProject(a.dir, { folder: share, notes: "one" });
  const ed1 = readJson(pub1.ec);
  const head1 = fs.readFileSync(path.join(pub1.archive, RELEASE_IN_ARCHIVE), "utf8").split(/\r?\n/)[0];
  await S.addCard(a.dir, (t.tag || t).id, "Bravo", "The bravo answer, in full.");
  const ed2 = readJson((await S.publishProject(a.dir, { folder: share, notes: "two" })).ec);
  check(ed1.id === a.draft.id && ed2.id === a.draft.id && ed2.rev > ed1.rev && !("name" in ed1)
        && head1 === "# Zubynt ondrave rev " + ed1.rev + " (" + ed1.date + ")",
    "2a two editions published from it carry the id it was made with, at rising revisions, no name, and"
    + " release notes headed by the folder's: " + JSON.stringify([ed1.id === a.draft.id, ed2.id === a.draft.id, ed1.rev, ed2.rev, "name" in ed1, head1]));

  /* ---- 3. An import that lands as a new project ----------------------------------------------- */
  const csv = path.join(SCRATCH, "Widuma sheet.csv");
  fs.writeFileSync(csv, "title,body\nTosan widil,Farlil zubork.\nKelbun sarnesk,Ondrave plasule.\n", "utf8");
  const plan = await S.importPlan(root, csv, {}, "");
  const landed = await S.importLand(root, csv, {}, "");
  const lid = landed.draft && landed.draft.id;
  check(!!lid && F.idOk(lid) && lid !== F.slug("Widuma sheet") && readJson(path.join(landed.dir, PROJECT_FILE)).id === lid
        && plan.id === null && plan.dir === landed.dir && path.basename(landed.dir) === "Widuma sheet"
        && plan.name === "Widuma sheet" && landed.name === "Widuma sheet" && !("name" in landed.draft),
    "3a an import landing as a new project gets a random id of its own too, in a folder named after the"
    + " file, and its plan names that folder and no id: " + JSON.stringify({ plan: [plan.id, path.basename(plan.dir)],
      landed: path.basename(landed.dir) }));
  /* THE FILES INSIDE ARE NAMED AFTER THE FOLDER TOO, never after the id: a person opening the
     project on the share meets them, and a random id as a file name reads as nothing. */
  const named = fs.readdirSync(landed.dir).filter((n) => /\.(draft|lint)\.json$/.test(n)).sort();
  const drafted = readJson(path.join(landed.dir, PROJECT_FILE)).draft;
  check(JSON.stringify(named) === JSON.stringify(["Widuma sheet.draft.json", "Widuma sheet.lint.json"])
        && drafted === "Widuma sheet.draft.json",
    "3c and the draft and its report inside are named after the folder, not the id: "
    + JSON.stringify({ named, drafted }));
  const short = path.join(SCRATCH, "ab.csv");
  fs.writeFileSync(short, "title,body\nTosan widil,Farlil zubork.\n", "utf8");
  const shortLand = await S.importLand(root, short, {}, "").catch((e) => e);
  check(!!shortLand.draft && F.idOk(shortLand.draft.id) && path.basename(shortLand.dir) === "ab",
    "3b a file whose name is too short to be an id lands as a project all the same: "
    + JSON.stringify(shortLand.draft ? path.basename(shortLand.dir) : String(shortLand.message || shortLand)));

  /* ---- 4. The control: a pile imported INTO a project keeps its own ---------------------------- */
  const into = await S.importLand(root, csv, {}, b.dir);
  const pile = readJson(into.file);
  check(into.into === true && pile.id === F.slug("Widuma sheet") && pile.id !== b.draft.id,
    "4a CONTROL: a sheet imported into an existing project is a pile under an id of its own, not the"
    + " project's and not random, as the review queue reads it: " + JSON.stringify(pile.id));

  /* ---- 5. A rename renames the folder ----------------------------------------------------------- */
  const eds = fs.readdirSync(path.join(a.dir, "archive")).sort();
  /* A record written before the name left the format still carries a `name`, and nothing reads it: the folder's name
     shows until the project is renamed, and the rename writes displayName and leaves the old key as it was. */
  const olderRecord = Object.assign(readJson(path.join(a.dir, PROJECT_FILE)), { name: "A name from an older record" });
  delete olderRecord.displayName;
  fs.writeFileSync(path.join(a.dir, PROJECT_FILE), JSON.stringify(olderRecord, null, 1), "utf8");
  const listedStale = S.listProjects(root).projects.map((p) => p.name);
  const openedStale = await S.openProject(a.dir);
  const moved = await S.renameProject(a.dir, "Zubynt Ondrave, EN").catch((e) => e);
  const after = moved.dir ? readJson(path.join(moved.dir, DRAFT_FILE)) : {};
  const listed = S.listProjects(root).projects.map((p) => p.name);
  check(!!moved.dir && path.basename(moved.dir) === "Zubynt Ondrave, EN" && moved.name === "Zubynt Ondrave, EN"
        && !fs.existsSync(a.dir) && after.id === a.draft.id && !("name" in after)
        && JSON.stringify(fs.readdirSync(path.join(moved.dir, "archive")).sort()) === JSON.stringify(eds)
        && listed.indexOf("Zubynt Ondrave, EN") > -1 && listed.indexOf("Zubynt ondrave") < 0
        && listed.indexOf("A name from an older record") < 0
        && listedStale.indexOf("Zubynt ondrave") > -1 && listedStale.indexOf("A name from an older record") < 0
        && openedStale.name === "Zubynt ondrave"
        && readJson(path.join(moved.dir, PROJECT_FILE)).name === "A name from an older record"
        && readJson(path.join(moved.dir, PROJECT_FILE)).displayName === "Zubynt Ondrave, EN",
    "5a a rename renames the project's folder, the list shows the new name, and the id, the draft and every"
    + " archived edition move with it untouched: " + JSON.stringify({ folder: moved.dir ? path.basename(moved.dir) : String(moved.message || moved),
      oldGone: !fs.existsSync(a.dir), id: after.id === a.draft.id, editions: eds.length }));
  const taken = await S.renameProject(moved.dir, "Ondrave plasule").catch((e) => e);
  check(!taken.dir && /already a folder/.test(String(taken.message || "")) && fs.existsSync(moved.dir) && fs.existsSync(b.dir),
    "5b a rename onto a folder already there refuses and moves neither: " + String(taken.message || JSON.stringify(taken)));
  const cased = await S.renameProject(moved.dir, "zubynt ondrave, en").catch((e) => e);
  check(!!cased.dir && fs.readdirSync(root).indexOf("zubynt ondrave, en") > -1
        && fs.readdirSync(root).indexOf("Zubynt Ondrave, EN") < 0,
    "5c a rename that changes only the case is made, not refused as the same folder: "
    + JSON.stringify(cased.dir ? path.basename(cased.dir) : String(cased.message || cased)));

  /* A PUBLISH FOLDER INSIDE THE PROJECT would travel with a renamed folder and leave the desks reading a path that
     is gone, while the next publish re-made a folder under the old name that no list shows. So such a rename
     refuses and names the folder, whether the share lies inside the project or is the project's own folder. */
  const shares = [path.join(b.dir, "share"), b.dir], refusedInside = [];
  for (const at of shares) {
    if (fs.existsSync(b.dir)) S.setPublishFolder(b.dir, at);
    refusedInside.push(await S.renameProject(b.dir, "Ondrave plasule, PL").catch((e) => e));
  }
  check(refusedInside.every((r, i) => !r.dir && !!r.said && r.said.vars.DIR === shares[i]
          && String(r.message || "").indexOf(shares[i]) > -1)
        && fs.existsSync(b.dir) && !fs.existsSync(path.join(root, "Ondrave plasule, PL"))
        && readJson(path.join(b.dir, PROJECT_FILE)).folder === b.dir,
    "5d a rename of a project whose publish folder lies inside it, or is its own folder, refuses, names that"
    + " folder, and moves nothing: " + JSON.stringify(refusedInside.map((r) => r.dir ? "renamed to " + path.basename(r.dir)
      : String(r.message || r).slice(0, 60))));

  /* A CHANGE OF CASE ALONE MOVES NOTHING, so a publish folder inside the project does not stop it: 5c's rule met
     by 5d's refusal. The share is still there afterwards, for the folder is the same one to Windows, and the
     record keeps the path it had. Both layouts of 5d are tried, the share below the project and the project itself. */
  const caseNames = ["ONDRAVE PLASULE", "ondrave plasule"], casedInside = [];
  let holder = b.dir;
  for (const [i, to] of caseNames.entries()) {
    const at = i === 0 ? path.join(holder, "share") : holder;
    S.setPublishFolder(holder, at);
    const got = await S.renameProject(holder, to).catch((e) => e);
    casedInside.push({ to, got, at });
    if (got.dir) holder = got.dir;
  }
  const onDisk = fs.readdirSync(root);
  /* WHETHER A CHANGE OF CASE IS THE SAME FOLDER IS THE DISK'S ANSWER, and Linux's is no: there the cased name is
     another folder, the share inside would move with it, and the rename refuses as 5d's does. The disk is asked
     once, by a folder made under one spelling and looked for under another. */
  const probe = path.join(root, "case-probe-aB");
  fs.mkdirSync(probe);
  const caseBlind = fs.existsSync(path.join(root, "CASE-PROBE-AB"));
  fs.rmdirSync(probe);
  const said = JSON.stringify(casedInside.map((c) => c.got.dir
    ? "renamed to " + path.basename(c.got.dir) : String(c.got.message || c.got).slice(0, 60)));
  if (caseBlind) check(casedInside.every((c) => !!c.got.dir && path.basename(c.got.dir) === c.to)
        && onDisk.indexOf("ondrave plasule") > -1 && onDisk.indexOf("Ondrave plasule") < 0 && onDisk.indexOf("ONDRAVE PLASULE") < 0
        && readJson(path.join(holder, PROJECT_FILE)).folder === casedInside[1].at,
    "5e a rename that changes only the case is made while the publish folder lies inside the project, or is its own"
    + " folder, and the record keeps the folder it had: " + said);
  else check(casedInside.every((c) => !c.got.dir && !!c.got.said) && holder === b.dir
        && onDisk.indexOf("Ondrave plasule") > -1 && onDisk.indexOf("ondrave plasule") < 0 && onDisk.indexOf("ONDRAVE PLASULE") < 0
        && readJson(path.join(holder, PROJECT_FILE)).folder === casedInside[1].at,
    "5e on a disk that tells case apart (Linux), a rename that changes only the case is another folder, so with the"
    + " publish folder inside the project, or the project's own, it refuses as 5d does and moves nothing: " + said);

  /* A NAME THAT IS THE SAME UP TO CASE IN JAVASCRIPT IS NOT ALWAYS THE SAME FOLDER TO WINDOWS: a sharp s upper-cased
     as the capital sharp s names a new folder, so the share inside would move with it, and the rename refuses as 5d's. */
  const sharp = await S.newProject(root, "Ondra\u00dfe", en);
  S.setPublishFolder(sharp.dir, path.join(sharp.dir, "share"));
  const sharpTo = await S.renameProject(sharp.dir, "ONDRA\u1e9eE").catch((e) => e);
  check(!sharpTo.dir && !!sharpTo.said && fs.existsSync(path.join(sharp.dir, PROJECT_FILE)),
    "5f a rename that only looks like a change of case, a sharp s to a capital one, refuses while the publish folder"
    + " lies inside: " + JSON.stringify(sharpTo.dir ? "renamed to " + path.basename(sharpTo.dir) : String(sharpTo.message || sharpTo).slice(0, 60)));

  /* ---- 6. A draft written before the name left the format ------------------------------------------ */
  /* Every draft Studio wrote before carries a name, and nothing may show it: the open, the publish plan, the list
     and the audit record all name the folder. The edition published from such a draft still carries the stale
     name, so the audit below reads a catalog that has one. */
  const home = cased.dir, folderName = path.basename(cased.dir), OLD = "Tosan older draft";
  const draftAt = path.join(home, DRAFT_FILE);
  const stale = Object.assign(readJson(draftAt), { name: OLD });
  if (stale.hash) { const bare = Object.assign({}, stale); delete bare.hash; delete bare.sig; stale.hash = F.contentHash(bare); }
  fs.writeFileSync(draftAt, JSON.stringify(stale, null, 1), "utf8");
  const opened = await S.openProject(home).catch((e) => e);
  check(opened.name === folderName && (opened.draft || {}).name === OLD,
    "6a a project whose draft carries a name opens under its folder's: " + JSON.stringify(opened.name || String(opened.message || opened)));
  const planned = await S.publishPlan(home).catch((e) => e);
  check(planned.name === folderName,
    "6b and its publish plan names the folder: " + JSON.stringify(planned.name || String(planned.message || planned)));
  const listedOld = S.listProjects(root).projects.map((p) => p.name);
  check(listedOld.indexOf(folderName) > -1 && listedOld.indexOf(OLD) < 0,
    "6c and the list names the folder: " + JSON.stringify(listedOld));
  const pub3 = await S.publishProject(home, { notes: "three" });
  const ed3 = pub3.ec ? readJson(pub3.ec) : {};
  const pack = pub3.edition ? await S.auditEdition(home, pub3.edition).catch((e) => e) : {};
  /* THE FIRST CLAUSE OF 6d IS THE POINT OF IT AND IS NEVER DROPPED: it is what proves the audit was fed an edition that
     carries a name. If publish ever stops writing the name, the clause goes red, and the repair is to feed the audit an
     archived edition that still carries one instead, never to delete the clause: editions already in an archive keep
     their name whatever publish does later, so the audit needs this guard for as long as they exist. */
  check(ed3.name === OLD && pack.edition === pub3.edition && pack.name === folderName,
    "6d the edition published from it still carries the stale name, and the audit record of that edition names"
    + " the folder: " + JSON.stringify({ edition: "name" in ed3, audit: pack.name || String(pack.message || pack) }));
  /* AN IMPORT INTO THE PROJECT shows the folder's name in its plan and in its landing, whatever the draft carries. */
  const draftNamed = readJson(draftAt).name === OLD;
  const planInto = await S.importPlan(root, csv, {}, home).catch((e) => e);
  const landInto = await S.importLand(root, csv, {}, home).catch((e) => e);
  check(draftNamed && !!planInto.into && planInto.into.name === folderName && landInto.into === true && landInto.name === folderName,
    "6e an import into a project whose draft carries a name shows the folder's: " + JSON.stringify({ draftNamed,
      plan: planInto.into ? planInto.into.name : String(planInto.message || planInto),
      landed: landInto.into === true ? landInto.name : String(landInto.message || landInto) }));
  /* THE RELEASE NOTES OF THAT EDITION are headed by the folder's name too. */
  const head3 = pub3.archive ? fs.readFileSync(path.join(pub3.archive, RELEASE_IN_ARCHIVE), "utf8").split(/\r?\n/)[0] : "";
  /* Board 902: the rev first and the dated edition after it, in parentheses. */
  check(!!ed3.date && head3 === "# " + folderName + " rev " + ed3.rev + " (" + ed3.date + ")",
    "6f and the release notes of the edition published from it are headed by the folder's name: " + JSON.stringify(head3));

  process.stdout.write("\ncatalog-id  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  if (asserted !== EXPECTED) {
    process.stderr.write("catalog-id  expected " + EXPECTED + " assertions, ran " + asserted + "\n");
    failed++;
  }
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "catalog-id");
  else process.stdout.write("catalog-id  kept " + SCRATCH + "\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch((e) => {
  process.stderr.write("catalog-id  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
