/* AN AUTHOR ON A BAD DAY (sense pass 2, findings 8, 13, 14, 18, 29, 35 and 37).
 *
 *     node tests/bad-day.mjs [--keep]
 *
 * THE CRITERION, one sentence for every leg below: an author on a bad day never loses a project,
 * an edit or release notes they typed, never leaves a desk half a catalog, always learns what
 * happened in words they can act on rather than a raw Node error, and never publishes somewhere
 * no desk reads without being told.
 * The bad days are made rather than described: a write killed half way, a draft damaged from
 * outside, a share on a drive letter that is not there, a read-only file, a second launch.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { openStudio, runStudio } from "./shell-door.mjs";
import { listProjects, newProject, addTag, addCard, openProject, saveCard, rootFor, publishProject } from "../src/studio.mjs";
import { diskRefusal } from "../src/refusal.mjs";
import { editionsIn, publishFull, ARCHIVE, NOTES_IN_ARCHIVE, PROJECT_FILE, CATALOG_IN_ARCHIVE } from "../src/publish.mjs";
import { makeKeyFile } from "../src/sign.mjs";
import { RING_FILE } from "../src/ring.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { pressWhen, settleOn } from "./press.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "bad-day");

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sha = p => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const readJson = p => JSON.parse(fs.readFileSync(p, "utf8"));
const parses = p => { try { readJson(p); return true; } catch { return false; } };
/* The read-only bit, by Windows' own tool: node's chmod sets it too, but attrib is what a
   person would use and it is what the share's own refusal looks like. */
const readOnly = (p, on) => spawnSync("attrib", [on ? "+R" : "-R", p], { encoding: "utf8" });
/* A project's rename is its folder's, which the parent refuses while nobody may add a folder to it
   (measured: a write inside the project still goes through). */
const noNewFolder = (p, on) => spawnSync("icacls", on ? [p, "/deny", process.env.USERNAME + ":(AD)"]
  : [p, "/remove:d", process.env.USERNAME], { encoding: "utf8" });

/** A drive letter nothing is mounted on, which is what an unmapped share looks like. */
function freeDrive() {
  for (const l of "QRSTUVWXYJKLMNOP") if (!fs.existsSync(l + ":\\")) return l + ":";
  return "";
}

const DAMAGED = "{FILE} is damaged and cannot be read, so this catalog cannot open. Studio has"
  + " left the file as it is; every published rev is kept whole in {ARCHIVE}.";

/** THE CUT: every write to a draft lands half its bytes and throws, whichever primitive does it,
 *  which is what a process killed mid-write leaves behind. `run` is called with it in force, and
 *  `on` widens it to other files. */
async function withCut(run, on) {
  const real = { wfs: fs.writeFileSync, ws: fs.writeSync, open: fs.openSync };
  const fdPath = new Map();
  const hit = (p) => (on || /draft\.json/).test(String(p));
  const killed = () => Object.assign(new Error("killed mid-write"), { code: "EKILLED" });
  fs.openSync = function (p, ...a) { const fd = real.open.call(fs, p, ...a); fdPath.set(fd, String(p)); return fd; };
  fs.writeFileSync = function (p, data, ...a) {
    if (!hit(p)) return real.wfs.call(fs, p, data, ...a);
    const s = String(data); real.wfs.call(fs, p, s.slice(0, s.length >> 1), ...a); throw killed();
  };
  fs.writeSync = function (fd, data, ...a) {
    if (!hit(fdPath.get(fd))) return real.ws.call(fs, fd, data, ...a);
    const s = String(data); real.ws.call(fs, fd, s.slice(0, s.length >> 1)); throw killed();
  };
  try { return await run(); }
  finally { fs.writeFileSync = real.wfs; fs.writeSync = real.ws; fs.openSync = real.open; }
}

async function makeProject(root) {
  const { dir } = await newProject(root, "Harbour Parcels", ["en", "pl"]);
  const cat1 = (await addTag(dir, "shelf", { en: "Deliveries", pl: "Dostawy" })).tag;
  await addTag(dir, "shelf", { en: "Returns", pl: "Zwroty" });
  const req1 = (await addTag(dir, "request", { en: "Track parcel", pl: "Sledz paczke" })).tag;
  await addCard(dir, cat1.id, "Late parcel", "We'll send a new one tomorrow.", "plain",
    { title: { pl: "Opozniona paczka" }, body: { pl: "Wyslemy nowa jutro." }, requests: [req1.id] });
  await addCard(dir, cat1.id, "Return cost", "The return is free of charge.", "plain",
    { title: { pl: "Koszt zwrotu" }, body: { pl: "Zwrot jest bezplatny." } });
  await addCard(dir, cat1.id, "Postage refund", "We'll refund the postage today.", "plain",
    { title: { pl: "Zwrot wysylki" }, body: { pl: "Zwrocimy koszt dzis." } });
  await publishFull({ project: dir, notes: "First edition." });
  return { dir };
}

async function nodeHalf() {
  const root = path.join(SCRATCH, "node");
  fs.mkdirSync(root, { recursive: true });
  const { dir } = await makeProject(root);
  const opened = await openProject(dir);
  const draftAt = path.join(dir, opened.project.draft);

  /* ---- 1. A WRITE CUT OFF HALF WAY (finding 8) -------------------------------------------- */
  let threw = "";
  await withCut(async () => {
    try { await saveCard(dir, opened.draft.cards[0].id, { body: { en: "typed on a bad day" } }); }
    catch (e) { threw = e.code || e.message; }
  });
  check(threw === "EKILLED" && parses(draftAt)
        && listProjects(root).projects.some(p => p.dir === dir && !p.unreadable),
    "1a a card save killed half way leaves the draft whole and the project on the list (the save"
    + " threw " + threw + ")");
  /* THE CONTROL: the same cut over an in-place write of a copy truncates it, so 1a is the
     writer's doing and not a cut that never bit. */
  const copy = path.join(root, "control.draft.json");
  fs.copyFileSync(draftAt, copy);
  await withCut(async () => {
    try { fs.writeFileSync(copy, fs.readFileSync(draftAt, "utf8")); } catch { /* the cut */ }
  });
  check(!parses(copy), "1b CONTROL: the same cut over a write in place leaves half a file");
  fs.rmSync(copy);

  /* ---- 1. A DRAFT DAMAGED FROM OUTSIDE (finding 8) ---------------------------------------- */
  fs.writeFileSync(draftAt, fs.readFileSync(draftAt, "utf8").slice(0, 200));
  const was = sha(draftAt);
  const row = listProjects(root).projects.find(p => p.dir === dir);
  check(row && row.unreadable === draftAt,
    "1c a draft damaged from outside keeps its row, which names the file: "
    + JSON.stringify(row && row.unreadable));
  let said = null;
  try { await openProject(dir); } catch (e) { said = e.said; }
  check(said && said.frame === DAMAGED && said.vars.FILE === draftAt
        && said.vars.ARCHIVE === path.join(dir, ARCHIVE) && sha(draftAt) === was,
    "1d and opening it says so in a frame naming the file and the archive, and writes nothing: "
    + JSON.stringify(said && said.frame));

  /* ---- 2. A FAULT OF THE DISK IS SAID AS THE WAY ON (finding 13) -------------------------- */
  const P = "Z:\\share\\x.ec";
  const frameOf = code => {
    const r = diskRefusal(Object.assign(new Error(code + ": raw"), { code, path: P }));
    return r.said ? { frame: r.said.frame, P: r.said.vars.P, disk: r.disk } : null;
  };
  const gone = frameOf("ENOENT"), held = frameOf("EPERM"), full = frameOf("ENOSPC");
  check(gone && held && full && [gone, held, full].every(f => f.P === P && f.disk === true)
        && new Set([gone.frame, held.frame, full.frame]).size === 3
        && /reach/.test(gone.frame) && /read-only/.test(held.frame) && /full/.test(full.frame),
    "2a out of reach, read-only and full are three frames naming the path, marked as the disk's");
  const eio = Object.assign(new Error("EIO: raw"), { code: "EIO", path: P });
  check(diskRefusal(eio) === eio && !eio.said,
    "2b CONTROL: a fault nobody at the desk can act on passes through as it was");

  /* ---- 5. OPEN A FOLDER ON A PROJECT'S OWN FOLDER (finding 29) ----------------------------- */
  const onProject = rootFor(dir), onParent = rootFor(root);
  check(onProject.root === root && onProject.open === dir && onParent.root === root
        && onParent.open === null && listProjects(dir).projects.length === 0,
    "5a a project's own folder picked as the root lands on its parent and opens it (the"
    + " folder itself lists no project, which is what emptied the list)");

  /* ---- 9. A PUBLISH CUT OFF HALF WAY ---------------------------------------------------- */
  const root9 = path.join(SCRATCH, "publish");
  fs.mkdirSync(root9, { recursive: true });
  const nine = (await makeProject(root9)).dir;
  const share = path.join(root9, "share");
  const lic = { folder: share };
  const edit = async (text) => {
    const o = await openProject(nine);
    await saveCard(nine, o.draft.cards[0].id, { body: { en: text } });
  };
  const ecAt = (await publishProject(nine, lic)).ec, wasEc = sha(ecAt);
  await edit("a second revision");
  let cut = "";
  await withCut(async () => {
    try { await publishProject(nine, lic); } catch (e) { cut = e.code || e.message; }
  }, /\.ec(\.|$)/);
  check(cut === "EKILLED" && parses(ecAt) && sha(ecAt) === wasEc
        && fs.readdirSync(share).every(n => !/\.tmp$/.test(n)),
    "9a a publish killed half way through the catalog leaves the one on the share whole and as"
    + " it was, with nothing beside it (the publish threw " + cut + ")");
  const eds9 = editionsIn(nine).length;
  await edit("a third revision");
  cut = "";
  await withCut(async () => {
    try { await publishProject(nine, lic); } catch (e) { cut = e.code || e.message; }
  }, /catalog\.ec(\.|$)/);
  const inArchive = editionsIn(nine).slice(eds9)
    .map(e => path.join(nine, ARCHIVE, e, CATALOG_IN_ARCHIVE)).filter(p => fs.existsSync(p));
  check(cut === "EKILLED" && inArchive.every(parses),
    "9b and one killed half way through the archive's copy leaves no half copy there ("
    + inArchive.length + " copy written)");
  /* THE CONTROL IS THE DESK'S OWN LISTING, read out of the pinned engine: the sibling a whole
     write goes through is never offered as a catalog. The listing asks folderAnswers first, so
     that and the state it reads come with it, as the shell declares them at start: no folder down. */
  const desk = fs.readFileSync(path.join(ROOT, "engine", "pinned", "shell", "main.js"), "utf8");
  const deskDecl = (marker) => {
    const at = desk.indexOf(marker);
    if (at < 0) throw new Error("no " + JSON.stringify(marker) + " in the pinned shell/main.js");
    if (!marker.startsWith("function")) return desk.slice(at, desk.indexOf("\n", at));
    for (let k = desk.indexOf("{", at), depth = 0; k < desk.length; k++) {
      if (desk[k] === "{") depth++;
      else if (desk[k] === "}" && !--depth) return desk.slice(at, k + 1);
    }
    throw new Error("could not find the end of " + marker + " in the pinned shell/main.js");
  };
  const listing = ["let folderDown =", "function folderAnswers(", "function ecFilesIn("].map(deskDecl);
  const ecFilesIn = new Function("fs", "path", "const shareUnread = () => false;\n" + listing.join("\n") + "\nreturn ecFilesIn;")(fs, path);
  const sibling = ecAt + "." + process.pid + ".tmp";
  fs.writeFileSync(sibling, "{");
  const offered = ecFilesIn(share).map(f => path.basename(f));
  fs.rmSync(sibling);
  check(offered.length === 1 && offered[0] === path.basename(ecAt),
    "9c CONTROL: the pinned desk lists the catalog and not the sibling it is written through: "
    + JSON.stringify(offered));

  /* ---- 9. THE ARCHIVE HOLDS EVERY EDITION A DESK IS GIVEN (sense pass 3, item 5) ----------- */
  const archived = () => editionsIn(nine).map(e => path.join(nine, ARCHIVE, e, CATALOG_IN_ARCHIVE))
    .filter(parses).map(readJson);
  const newest = () => archived().slice(-1)[0] || null;
  const shared = readJson(ecAt), kept = newest();
  const staged = fs.readdirSync(nine).filter(n => /\.tmp$/.test(n));
  check(!!kept && kept.hash === shared.hash && !staged.length,
    "9f after both cuts the share holds the archive's newest edition and nothing the archive lacks"
    + " (share rev " + shared.rev + ", archive's newest " + (kept ? "rev " + kept.rev : "none")
    + ", " + staged.length + " staging folder(s) left)");
  let retry = "";
  try { await publishProject(nine, lic); } catch (e) { retry = e.message; }
  const out = readJson(ecAt), keptOut = newest();
  check(!retry && !!keptOut && keptOut.hash === out.hash && out.rev > shared.rev,
    "9g and the next publish goes through, the archive holding what the share was given (rev "
    + out.rev + (retry ? ", refused: " + retry.slice(0, 90) : "") + ")");
  await edit("a fourth revision");
  cut = "";
  await withCut(async () => {
    try { await publishProject(nine, lic); } catch (e) { cut = e.code || e.message; }
  }, /project\.json(\.|$)/);
  const spent = readJson(ecAt).rev;
  await edit("a fifth revision");
  try { await publishProject(nine, lic); } catch { /* counted below */ }
  const revs = archived().map(c => c.rev);
  check(cut === "EKILLED" && readJson(ecAt).rev === spent + 1 && new Set(revs).size === revs.length,
    "9h a publish cut off at the project's own record has still spent its rev: the next takes rev "
    + readJson(ecAt).rev + " after " + spent + ", and no rev is archived twice [" + revs + "]");

  /* ---- 9. A SIGNED PUBLISH CUT OFF HALF WAY THROUGH THE RING ------------------------------ */
  const rootR = path.join(SCRATCH, "ring");
  fs.mkdirSync(rootR, { recursive: true });
  const ringProject = (await makeProject(rootR)).dir;
  const shareR = path.join(rootR, "share");
  const PASS = "a passphrase for the bad day";
  const keyAt = async (name) => {
    const at = path.join(rootR, name);
    fs.writeFileSync(at, JSON.stringify(await makeKeyFile({ passphrase: PASS }), null, 1) + "\n");
    return at;
  };
  const firstKey = await keyAt("first-key.json"), secondKey = await keyAt("second-key.json");
  const signed = (key) => publishFull({ project: ringProject, folder: shareR, key, passphrase: PASS });
  const editR = async (text) => {
    const o = await openProject(ringProject);
    await saveCard(ringProject, o.draft.cards[0].id, { body: { en: text } });
  };
  await signed(firstKey);
  const ringAt = path.join(shareR, RING_FILE), wasRing = sha(ringAt);
  await editR("signed by a second key");
  cut = "";
  await withCut(async () => {
    try { await signed(secondKey); } catch (e) { cut = e.code || e.message; }
  }, /etiuda-ring\.json(\.|$)/);
  check(cut === "EKILLED" && parses(ringAt) && sha(ringAt) === wasRing
        && fs.readdirSync(shareR).every(n => !/\.tmp$/.test(n)),
    "9d a signed publish killed half way through the ring leaves the ring on the share whole and"
    + " as it was, with nothing beside it (the publish threw " + cut + ")");
  await editR("signed by a second key, once more");
  let again = "";
  try { await signed(secondKey); } catch (e) { again = e.message; }
  const entries = parses(ringAt) ? readJson(ringAt).keys.length : -1;
  check(!again && entries === 2,
    "9e and the next signed publish goes through and adds its key to the ring (" + entries
    + " entries" + (again ? ", refused: " + again.slice(0, 80) : "") + ")");
}

async function windowHalf() {
  const projects = path.join(SCRATCH, "projects");
  fs.mkdirSync(projects, { recursive: true });
  const { dir } = await makeProject(projects);
  const id = readJson(path.join(dir, PROJECT_FILE)).id;
  const draftAt = path.join(dir, readJson(path.join(dir, PROJECT_FILE)).draft);
  const ud = path.join(SCRATCH, "ud");
  /* A CLOSE HERE IS A CLOSE, as tests/window-place.mjs plants it: since board 969 (2026-11-08) a window closed with the store
     saying nothing goes to the tray, and the window's close event comes before the page's beforeunload, so the page's hold
     (ui/app.js, THE WINDOW CLOSES ONCE EVERY EDIT IS ON DISK), which 8e, 4d and 4c are about, was never reached and 4c's
     process stayed up hidden. The profile chooses Quit on close, so the page's hold is what holds the close. */
  fs.mkdirSync(ud, { recursive: true });
  fs.writeFileSync(path.join(ud, "studio.json"), JSON.stringify({ format: 1, writtenBy: "0.1.0", quitOnClose: true }), "utf8");
  const studio = await openStudio("tests/bad-day.mjs", { words: true,
    projects, userDataDir: ud, env: { STUDIO_TEST_ROOT: dir } });
  const page = studio.page;
  const press = async (sel, ms) => {
    await pressWhen(page, sel, { who: "tests/bad-day.mjs" });
    /* the press draws the edition going out once the file is written: Escape finishes it, as a person's would */
    if (sel === '[data-act="do-publish"]') await page.evaluate(() => { if (document.querySelector("#prGo[aria-busy]"))
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
    await sleep(ms || 500);
  };
  const put = async (sel, v) => {
    const hit = await page.evaluate((s, value) => { const e = document.querySelector(s); if (!e) return false;
      e.value = value; e.dispatchEvent(new Event("input", { bubbles: true })); return true; }, sel, v);
    if (!hit) throw new Error("nothing at " + sel);
    await sleep(150);
  };
  const append = async (sel, v) => {
    const now = await page.evaluate((s) => { const e = document.querySelector(s); return e ? e.value : null; }, sel);
    if (now == null) throw new Error("nothing at " + sel);
    await put(sel, now + v);
  };
  const value = (sel) => page.evaluate((s) => { const e = document.querySelector(s);
    return e ? e.value : null; }, sel);
  const coverSaid = () => page.evaluate(() => {
    const e = document.querySelector("#dlg [data-err]"); return e ? e.textContent : ""; });
  const boxes = () => page.evaluate(() =>
    Array.from(document.querySelectorAll("#main .dashed")).map(e => e.textContent).join(" | "));
  const setFolder = (f) => {
    const p = readJson(path.join(dir, PROJECT_FILE)); p.folder = f;
    fs.writeFileSync(path.join(dir, PROJECT_FILE), JSON.stringify(p, null, 1));
  };
  const cover = async (notes, folder) => {
    await press('[data-act="publish"]', 900);
    if (folder) {
      await settleOn(page, '!!document.querySelector("#notes") || !!document.querySelector(\'#dlg [data-act="team-where"]\')', { bound: 30000 });
      if (!(await page.$("#notes")))
        throw new Error("page did not hold folder " + folder + ": Publish asked where the team meets, so the open project has no place");
    }
    await put("#notes", notes);
  };
  /* THE LIBRARY HOLDS THE TABLE (board 982 E, 2026-11-11): Overview keeps up to four opened catalogs as cards and no rows, so
     every read of a row, and every F2 on one, is made on the Library. Once chosen it stays the home tab's screen. */
  const toLibrary = async () => {
    await press('[data-act="to-projects"]', 700);
    await press('#rail [data-act="home"][data-v="library"]', 400);
    await settleOn(page, 'document.querySelectorAll("#main tr[data-dir]").length > 0', { bound: 30000 });
  };
  /* WHAT THE OPEN PROJECT HOLDS AS ITS FOLDER, read where the screen says it: Settings' Writes to (the row's Written to cell,
     which this read until then, left the Library with board 982 E). A folder planted on disk is only the page's once this
     says it, so a publish is pressed only then. */
  const folderHeld = async (folder) => {
    await press('[data-act="section"][data-v="settings"]', 600);
    await settleOn(page, "Array.from(document.querySelectorAll('#main .kv .mono')).some((e) => e.textContent === "
      + JSON.stringify(folder) + ")", { bound: 15000 });
    const held = await page.evaluate((f) => Array.from(document.querySelectorAll("#main .kv .mono"))
      .some((e) => e.textContent === f), folder);
    if (!held) throw new Error("page did not hold folder " + folder + ": Settings' Writes to does not name it");
    /* Back to the cards, where an open lands and where section 4 picks its rows. */
    await press('[data-act="section"][data-v="cards"]', 600);
    await settleOn(page, '(window.STUDIO_READY || {}).screen === "cards"', { bound: 30000 });
  };
  /* Opens the very row a check read, by its data-dir, not the first row of the list (the test architect, 22:32). */
  const openRow = async (d) => {
    const hit = await page.evaluate((d) => {
      const tr = Array.from(document.querySelectorAll('#main tr[data-act="open"]')).find(r => r.getAttribute("data-dir") === d);
      if (tr) tr.click();
      return !!tr;
    }, d);
    if (!hit) throw new Error("no project row for " + d);
    await sleep(1200);
  };

  try {
    /* ---- 5. THE PROJECT'S OWN FOLDER, PICKED (finding 29) ---------------------------------- */
    await press('[data-act="pick-root"]', 1500);
    await settleOn(page, 'document.querySelectorAll(\'#tabs .tab[data-act="to-project"]\').length > 0', { bound: 30000 });
    const landed = await page.evaluate(() => ({
      tabs: document.querySelectorAll('#tabs .tab[data-act="to-project"]').length,
      on: (document.querySelector("#tabs .tab.on") || { getAttribute: () => "" }).getAttribute("data-dir") }));
    const store = readJson(path.join(ud, "studio.json"));
    await press('[data-act="to-projects"]', 700);
    await settleOn(page, 'document.querySelectorAll("#main [data-proj]").length > 0', { bound: 30000 });
    const rows = await page.evaluate(() => document.querySelectorAll("#main [data-proj]").length);
    check(landed.tabs === 1 && landed.on === dir && path.resolve(store.root) === path.resolve(projects) && rows === 1,
      "5b Open a folder answered with a project's own folder opens that project, and the list"
      + " behind it is its parent's with the project on it (" + rows + " row, root "
      + JSON.stringify(store.root) + ")");
    await press('[data-act="open"]', 1200);

    /* ---- 3. PUBLISH WITH NO FOLDER CHOSEN (findings 14 and 18) ---------------------------- */
    const edsBefore = editionsIn(dir).length;
    await press('[data-act="publish"]', 900);
    await settleOn(page, '!document.querySelector("#scrim").hidden && !!document.querySelector(\'#dlg [data-act="team-where"]\')', { bound: 30000 });
    const noFolderOffer = await page.evaluate(() => !document.querySelector('#dlg [data-act="team-where"][data-v="folder"]'));
    const chooseBtn = await page.evaluate(() => (document.querySelector('#dlg [data-act="do-team-seal"]') || {}).textContent || "");
    check(noFolderOffer && chooseBtn.trim() !== "" && !(await page.$("#notes"))
          && editionsIn(dir).length === edsBefore
          && readJson(path.join(dir, PROJECT_FILE)).folder == null,
      "3a Publish with no place chosen offers the relay and no shared folder (was: the folder's own choose button, until 2026-11-20), writes no edition, records no"
      + " folder, and asks for no notes yet: " + JSON.stringify(chooseBtn));
    await press('[data-act="cover-close"]', 500);

    /* ---- 3. A SHARE THAT IS NOT CONNECTED (findings 13 and 18) ----------------------------- */
    const drive = freeDrive();
    const away = drive + "\\share\\catalogs";
    setFolder(away);
    await toLibrary();
    await openRow(dir);
    await folderHeld(away);
    await cover("notes for a share that is away", away);
    await press('[data-act="do-publish"]', 2500);
    await settleOn(page, '((document.querySelector("#dlg .pw-refuse") || {}).textContent || "").trim() !== ""', { bound: 30000 });
    const saidAway = await coverSaid();
    check(drive && saidAway.indexOf("Could not reach") === 0 && saidAway.indexOf(drive) > 0
          && !/ENOENT|EPERM/.test(saidAway)
          && await value("#notes") === "notes for a share that is away"
          && editionsIn(dir).length === edsBefore,
      "3b a folder on a drive that is not there is said as out of reach, with the notes kept and"
      + " no edition written: " + JSON.stringify(saidAway));
    await press('[data-act="cover-close"]', 500);

    /* ---- 3. A READ-ONLY FILE WHERE THE CATALOG GOES, THEN FREED ----------------------------- */
    const share = path.join(SCRATCH, "share");
    fs.mkdirSync(share, { recursive: true });
    /* The name is fixed when makeProject publishes into its own folder, as the slug of its own name, and the share holds a file of this catalog under it. */
    const ec = path.join(share, "harbour-parcels.ec");
    fs.writeFileSync(ec, JSON.stringify({ id }));
    readOnly(ec, true);
    setFolder(share);
    await toLibrary();
    await openRow(dir);
    await folderHeld(share);
    await cover("notes that reach the archive", share);
    await press('[data-act="do-publish"]', 2500);
    await settleOn(page, '((document.querySelector("#dlg .pw-refuse") || {}).textContent || "").trim() !== ""', { bound: 30000 });
    const saidHeld = await coverSaid();
    check(saidHeld.indexOf("Could not write to") === 0 && saidHeld.indexOf(ec) > 0
          && await value("#notes") === "notes that reach the archive",
      "3c a read-only file on the share is said as read-only, with the notes kept: "
      + JSON.stringify(saidHeld));
    readOnly(ec, false);
    await press('[data-act="do-publish"]', 3000);
    const eds = editionsIn(dir);
    const notes = eds.length > edsBefore
      ? fs.readFileSync(path.join(dir, ARCHIVE, eds[eds.length - 1], NOTES_IN_ARCHIVE), "utf8") : "";
    check(!(await page.$("#notes")) && notes.trim() === "notes that reach the archive"
          && readJson(ec).id === id,
      "3d CONTROL: once the file is free the same press publishes, and the notes typed before"
      + " the refusal are the ones in the archive");

    /* ---- 4. A CARD SAVE THE DISK REFUSES (finding 13) ---------------------------------------- */
    const ids = readJson(draftAt).cards.map(c => c.id);
    await press('tr[data-act="pick"][data-id="' + ids[0] + '"]', 700);
    readOnly(draftAt, true);
    await append('textarea[data-f="body"][data-l="en"]', " ALPHA");
    await settleOn(page, '((document.querySelector("#main .dashed") || {}).textContent || "").trim() !== ""', { bound: 30000 });
    const refused = await boxes();
    const kept = await value('textarea[data-f="body"][data-l="en"]');
    check(refused.indexOf("Could not write to") === 0 && refused.indexOf(draftAt) > 0
          && /ALPHA$/.test(kept || ""),
      "4a a card save into a read-only draft says so, naming the draft, and the edit stays on the"
      + " screen: " + JSON.stringify(refused));
    readOnly(draftAt, false);
    await press('tr[data-act="pick"][data-id="' + ids[1] + '"]', 700);
    await append('textarea[data-f="body"][data-l="en"]', " BETA");
    await sleep(2000);
    const d = readJson(draftAt);
    const body = (cid) => (d.cards.find(c => c.id === cid).body || {}).en || "";
    check(/ALPHA$/.test(body(ids[0])) && /BETA$/.test(body(ids[1])) && !(await boxes()),
      "4b once the draft is writable the next edit saves the refused one with it, and the"
      + " sentence goes");

    /* ---- 6. THE CARDS LEDE WITH A LANGUAGE AWAITING (finding 37) ----------------------------- */
    await press('[data-act="lang"][data-v="pl"]', 700);
    await page.evaluate(() => {
      const t = document.querySelector('textarea[data-f="body"][data-l="pl"]');
      t.value = ""; t.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await sleep(1500);
    const lede = await page.evaluate(() =>
      (document.querySelector("#main .pad>.lede") || {}).textContent || "");
    const rail = +(await page.evaluate(() =>
      (document.querySelector('#rail a[data-v="lint"] .num') || {}).textContent || "0"));
    await press('[data-act="section"][data-v="lint"]', 900);
    await settleOn(page, '(window.STUDIO_READY || {}).screen === "lint"', { bound: 30000 });
    const waiting = await page.evaluate(() => Array.from(document.querySelectorAll("#main tr"))
      .filter(r => /Awaiting/.test(r.textContent)).length);
    /* The test's own created cards hold likely commitments, and since S3e each
       is a suggestion the rail counts and the lede, which counts what is unfixed, does not. SINCE BY KIND (board 862,
       vision-gamma) the Lint page opens with the unanswered likely commitments grouped by kind, each kind's count of
       what is left in its `.bk-c`, and only the other suggestions keep a `.chip.note` row in the table, so the leg
       reads both. It also wants one at least: the cards hold them, and a reading of none would pass a rail that
       forgot suggestions, as the old reading of the table alone would have once By kind took the rows away. */
    const suggested = await page.evaluate(() => document.querySelectorAll("#main tr .chip.note").length
      + Array.from(document.querySelectorAll("#main .bk-g .bk-c")).reduce((n, e) => n + (+e.textContent || 0), 0));
    const said37 = +((/(\d+) (?:lint )?finding/.exec(lede) || [])[1] || -1);
    check(waiting > 0 && suggested > 0 && said37 >= 0 && said37 + waiting + suggested === rail,
      "6a the cards lede counts errors and warnings and not a language awaiting nor a suggestion: " + said37
      + " in the lede, " + waiting + " awaiting, " + suggested + " suggested, " + rail + " on the rail ("
      + JSON.stringify(lede) + ")");

    /* ---- 8. A CATEGORY AND A PROJECT NAME THE DISK REFUSES ---------------------------------- */
    await press('[data-act="section"][data-v="categories"]', 700);
    await press('[data-act="lang"][data-v="en"]', 700);
    await settleOn(page, 'document.querySelectorAll(\'#main input[data-tag][data-l="en"]\').length > 0', { bound: 30000 });
    const tagIds = await page.evaluate(() => Array.from(
      document.querySelectorAll('#main input[data-tag][data-l="en"]')).map(e => e.getAttribute("data-tag")));
    const tagSel = (i) => '#main input[data-tag="' + tagIds[i] + '"][data-l="en"]';
    const labelOf = (i) => ((readJson(draftAt).tags.find(t => t.id === tagIds[i]) || {}).label || {}).en;
    readOnly(draftAt, true);
    await put(tagSel(0), "Kept on a bad day");
    await settleOn(page, '((document.querySelector("#main .dashed") || {}).textContent || "").trim() !== ""', { bound: 30000 });
    const tagSaid = await boxes();
    await press('[data-act="section"][data-v="cards"]', 700);
    await press('[data-act="section"][data-v="categories"]', 700);
    await settleOn(page, '(window.STUDIO_READY || {}).screen === "categories"', { bound: 30000 });
    const tagKept = await value(tagSel(0));
    check(tagIds.length > 1 && tagSaid.indexOf("Could not write to") === 0
          && tagKept === "Kept on a bad day" && labelOf(0) !== tagKept,
      "8a a category renamed into a read-only draft says so, and the typed name is still in its"
      + " field after leaving the section and coming back: " + JSON.stringify(tagKept));
    /* 8a2 THE RACE THE SETTLE ABOVE NO LONGER REACHES: a lead who types and leaves at once, before the refusal has come
       (about 3.6 s of retries). The refusal runs keepTag whichever screen shows, so the name must be there on return. */
    await put(tagSel(1), "Typed and left at once");
    await press('[data-act="section"][data-v="cards"]', 100);
    await press('[data-act="section"][data-v="categories"]', 700);
    await settleOn(page, '(window.STUDIO_READY || {}).screen === "categories"', { bound: 30000 });
    await settleOn(page, '(document.querySelector(' + JSON.stringify(tagSel(1)) + ') || {}).value === "Typed and left at once"', { bound: 30000 });
    const leftKept = await value(tagSel(1)), leftSaid = await boxes();
    check(leftKept === "Typed and left at once" && leftSaid.indexOf("Could not write to") === 0 && labelOf(1) !== leftKept,
      "8a2 a category name typed into a read-only draft and left at once is still in its field on return, and the refusal"
      + " is said: " + JSON.stringify([leftKept, leftSaid.slice(0, 40)]));
    readOnly(draftAt, false);
    await put(tagSel(1), "Saved with it");
    await sleep(1500);
    check(labelOf(0) === "Kept on a bad day" && labelOf(1) === "Saved with it" && !(await boxes()),
      "8b once the draft is writable the next rename saves the refused one with it, and the"
      + " sentence goes");
    const renamed = path.join(projects, "Harbour, kept");
    await press('[data-act="to-projects"]', 700);
    await settleOn(page, 'document.querySelectorAll("#main table tr").length >= 2', { bound: 30000 });
    noNewFolder(projects, true);
    /* F2 starts the rename where the name stands, Enter keeps it (board 901). */
    await page.evaluate(() => {
      const tr = document.querySelector("#main table tr:nth-child(2)");
      if (tr) tr.focus();
    });
    await page.keyboard.press("F2");
    await settleOn(page, '!!document.querySelector("#main input[data-naming][data-proj]")', { bound: 30000 });
    await page.evaluate((v) => {
      const e = document.querySelector("#main input[data-naming][data-proj]");
      e.value = v; e.dispatchEvent(new Event("input", { bubbles: true }));
    }, "Harbour, kept");
    await page.keyboard.press("Enter");
    /* The shell asks the refused move again for a few seconds, so what a person sees is waited for, not slept past. */
    await settleOn(page, '/^Could not write to/.test((document.querySelector("#main .dashed") || {}).textContent || "")', { bound: 15000 });
    const nameSaid = await boxes();
    /* Opening sends the kept name, is refused again, and still opens: the row is read once that has settled. */
    await press('[data-act="open"]', 200);
    await settleOn(page, '(window.STUDIO_READY || {}).screen !== "projects"', { bound: 30000 });
    await press('[data-act="to-projects"]', 200);
    const rowSel = '#main [data-proj="' + dir.replace(/\\/g, "\\\\") + '"]';
    await settleOn(page, "(document.querySelector(" + JSON.stringify(rowSel) + ') || {}).textContent === "Harbour, kept"', { bound: 15000 });
    const nameKept = await page.evaluate((sel) => (document.querySelector(sel) || {}).textContent || "", rowSel);
    check(nameSaid.indexOf("Could not write to") === 0 && nameKept === "Harbour, kept"
          && fs.existsSync(dir) && !fs.existsSync(renamed),
      "8c a project renamed where its folder cannot move says so, and the typed name is still in its"
      + " field after opening the project and coming back: " + JSON.stringify([nameKept, nameSaid.slice(0, 40)]));
    noNewFolder(projects, false);
    await press('[data-act="open"]', 1200);
    check(fs.existsSync(renamed) && !fs.existsSync(dir),
      "8d once the folder can move, opening the project sends the refused name with nothing"
      + " typed again, and the folder is renamed: " + JSON.stringify(fs.readdirSync(projects)));
    /* Back to the folder the rest of this half reads, renamed back through F2 and Enter. */
    await press('[data-act="to-projects"]', 700);
    await settleOn(page, 'document.querySelectorAll("#main table tr").length >= 2', { bound: 30000 });
    await page.evaluate(() => {
      const tr = document.querySelector("#main table tr:nth-child(2)");
      if (tr) tr.focus();
    });
    await page.keyboard.press("F2");
    await settleOn(page, '!!document.querySelector("#main input[data-naming][data-proj]")', { bound: 30000 });
    await page.evaluate((v) => {
      const e = document.querySelector("#main input[data-naming][data-proj]");
      e.value = v; e.dispatchEvent(new Event("input", { bubbles: true }));
    }, path.basename(dir));
    await page.keyboard.press("Enter");
    await sleep(2000);
    await press('[data-act="open"]', 1200);
    /* The window answering at all is half of this: a project renamed there and back once froze it for good (ui/app.js
       moveProject, found by this leg on 2e5901d, where the next press timed out). */
    check(fs.existsSync(dir) && !fs.existsSync(renamed),
      "8d2 a project renamed there and back with none opened between leaves the window answering, and the folder back: "
      + JSON.stringify(fs.readdirSync(projects)));
    if (!fs.existsSync(dir)) throw new Error("the project did not come back to " + dir + ", so nothing after 8d can run");
    /* A close with nothing waiting but a refused rename. 8f's successful save also clears the
       held close's force, which 4d relies on. */
    await press('[data-act="section"][data-v="categories"]', 700);
    await press('[data-act="lang"][data-v="en"]', 700);
    readOnly(draftAt, true);
    await put(tagSel(0), "Held at the close");
    await sleep(1500);
    await pressWhen(page, '[data-act="win-close"]', { who: "tests/bad-day.mjs" });
    /* The close sends the kept rename once more and the disk is asked again for seconds, so the hold is final only when
       the bar has said "held" and still says it after a beat. Lifting the read-only flag sooner lets that send land, and
       the window then closes, as it should. */
    const heldSaid = '(document.querySelector(".sb-st") || { dataset: {} }).dataset.state === "held"';
    await settleOn(page, heldSaid, { bound: 15000 }).catch(() => null);
    await sleep(600);
    await settleOn(page, heldSaid, { bound: 15000 }).catch(() => null);
    const stayed = studio.child.exitCode === null;
    const heldTag = stayed ? await boxes() : "";
    check(stayed && heldTag.indexOf("Could not write to") === 0,
      "8e a close with only a refused category rename waiting is held, with the sentence on"
      + " screen (" + (stayed ? "held" : "closed, the rename not on disk: "
      + JSON.stringify(labelOf(0))) + ")");
    if (!stayed) throw new Error("the window closed at 8e, so nothing after it can run");
    readOnly(draftAt, false);
    await put(tagSel(1), "Saved after the held close");
    await sleep(1500);
    check(labelOf(0) === "Held at the close" && labelOf(1) === "Saved after the held close"
          && !(await boxes()),
      "8f once the draft is writable the next rename saves the one the close held");

    /* ---- 7. A SECOND LAUNCH ON THE SAME PROFILE (finding 35) --------------------------------- */
    const t0 = Date.now();
    const second = runStudio("tests/bad-day.mjs", { projects, userDataDir: ud, timeout: 30000 });
    const ms = Date.now() - t0;
    const alive = await page.evaluate(() => !!window.STUDIO_READY).catch(() => false);
    check(second.status === 0 && !second.error && alive,
      "7a a second launch on the same profile hands over and exits (" + ms + " ms, status "
      + second.status + ") and the first window still answers");

    /* ---- 4. A CLOSE WITH AN EDIT STILL WAITING FOR ITS SAVE (finding 13) ---------------------- */
    await press('[data-act="section"][data-v="cards"]', 700);
    await press('[data-act="lang"][data-v="en"]', 700);
    await press('tr[data-act="pick"][data-id="' + ids[2] + '"]', 700);
    readOnly(draftAt, true);
    await append('textarea[data-f="body"][data-l="en"]', " DELTA");
    await pressWhen(page, '[data-act="win-close"]', { who: "tests/bad-day.mjs" });
    await settleOn(page, heldSaid, { bound: 15000 }).catch(() => null);
    await sleep(600);
    await settleOn(page, heldSaid, { bound: 15000 }).catch(() => null);
    const held = await boxes();
    check(studio.child.exitCode === null && held.indexOf("Could not write to") === 0,
      "4d a close while the disk refuses the edit is held, with the sentence on screen");
    readOnly(draftAt, false);
    await append('textarea[data-f="body"][data-l="en"]', " GAMMA");
    await page.evaluate(() => document.querySelector('[data-act="win-close"]').click()).catch(() => {});
    let gone = false;
    for (let i = 0; i < 40 && !gone; i++) { await sleep(250); gone = studio.child.exitCode !== null; }
    const closed = readJson(draftAt);
    check(gone && /DELTA GAMMA$/.test((closed.cards.find(c => c.id === ids[2]).body || {}).en || ""),
      "4c once the disk takes it, a close pressed inside the save's debounce sends the held edit"
      + " and the new one first, then closes");
  } finally {
    await studio.shut();
  }
}

async function main(argv) {
  const keep = argv.indexOf("--keep") >= 0;
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  await nodeHalf();
  await windowHalf();
  if (!keep) dropScratch(SCRATCH, "bad-day");
  process.stdout.write("bad-day  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("bad-day  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
