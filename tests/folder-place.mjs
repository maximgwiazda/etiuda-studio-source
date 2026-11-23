/* A folder team's place, relative to the sync root (board 945, item 4). Node only, no window.
 * It starts no program of its own: fp9 and fp11 stand a require in, and src/sync-roots.cjs gets a stand-in (below).
 *
 *     node tests/folder-place.mjs
 *
 * The portable checks run Studio's placeRules(), which reads the slices (shellText), the path a shipped Studio runs.
 * fp9 still slices liveSyncIo from a full shell that carries it: ETIUDA_ENGINE_SHELL when that file has placeResolve,
 * else the pinned shell, else a sibling engine worktree named eng-f4. With no such shell, fp9 fails closed.
 *
 *   fp1  an old project, and a relay team, resolve as they do today
 *   fp2  a folder under one user's OneDrive is recorded, and the other user's OneDrive is where this computer reads it
 *   fp3  a UNC path resolves as itself
 *   fp4  a root that is absent falls back to the absolute path and says so
 *   fp6  choosing a folder writes the place; the same folder through the reader keeps it; a different folder clears it
 *   fp7  a mapped share resolves to this computer's own letter
 *   fp8  on a pin carrying the place rules, the pinned reader is not null, and the slices carry the pure rules only
 *   fp9  the sliced record read starts no program but reg.exe at its fixed path, inside five seconds
 *   fp10 the shipped path: with nothing handed in, choosing a folder, an invitation and the folder read back each get the
 *        place from the slices, through the records Studio's own src/sync-roots.cjs reads, once
 *   fp11 src/sync-roots.cjs asks the engine's own six reads, word for word, and its io gives the same records as the
 *        engine's liveSyncIo on the same answers; off Windows it starts nothing and names no root
 *   fp12 the shipped read, started once for real, prints nothing when a key is absent
 *   fp13 a lead's Studio on a default Drive install, no DefaultMountPoint anywhere, writes a folder's place on Drive as the
 *        desk reads it: Drive's folder as the root, the part after it as the path, which a Polish desk resolves
 *   fp14 an ordinary place, a OneDrive folder, is read through the four reads it always was, and no folder is listed
 *   fp15 a record read the five-second deadline cut short is read again once a minute has passed, a whole one kept (a stand-in reg)
 *   fp16 the same partial record is reused inside that minute, so the reads are not started again; the clock is moved
 *   and, in a scratch copy, plant:st-drive-keep turns fp13 red, plant:st-look-skip turns fp14 red, plant:r13-roots-whole fp15,
 *        plant:r13-roots-soon fp16
 *
 * THE REG TOOL IS NEVER STARTED by fp9 to fp11. Before Studio's modules load, the child_process that src/sync-roots.cjs
 * requires is a stand-in that answers from a table (its parent's file name decides, nothing else is touched), so fp10
 * runs the shipped file on this computer and reads no registry. That is why the src imports below are dynamic. fp12 is
 * the one start of the real file, in a child, and it reads that child's stderr. The same file's fs is a stand-in too: its
 * one listing (dirList) answers G: from a lab folder and every other letter as absent, so no drive of this computer is read.
 */
import "./reg-stand-on.mjs";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import Module from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dropScratch } from "./scratch.mjs";
import { copyPlants } from "./plant-copy.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LAB = path.join(os.tmpdir(), "etiuda-folder-place-" + crypto.randomBytes(4).toString("hex"));
const CARL_ROOT = path.join(LAB, "carl", "OneDrive");
/* The answers the stand-in gives src/sync-roots.cjs: one OneDrive account, at CARL_ROOT, the mapped letter Z:, and nothing else. */
const shippedCalls = [];
function shippedReg(file, args, opts) {
  shippedCalls.push({ file: file, args: args, opts: opts });
  const name = String(args && args[4] || "");
  const text = name === "UserFolder"
    ? "HKEY_CURRENT_USER\\Software\\Microsoft\\OneDrive\\Accounts\\Personal\r\n    UserFolder    REG_SZ    " + CARL_ROOT + "\r\n"
    : name === "RemotePath" ? "HKEY_CURRENT_USER\\Network\\Z\r\n    RemotePath    REG_SZ    \\\\files\\dept\r\n" : "";
  return opts && opts.encoding && opts.encoding !== "buffer" ? text : Buffer.from(text, "utf8");
}
/* G: as the lab folder DRIVE_G, for the one listing src/sync-roots.cjs makes; every listing it is asked for is kept. */
const DRIVE_G = path.join(LAB, "drive-g");
const listed = [];
function labList(dir) {
  listed.push(String(dir));
  const m = /^([A-Za-z]):\\?(.*)$/.exec(String(dir));
  if (m && m[1].toUpperCase() === "G") return fs.promises.readdir(path.join(DRIVE_G, m[2] || ""));
  return Promise.reject(Object.assign(new Error("absent"), { code: "ENOENT" }));
}
const syncFs = new Proxy(fs, { get(o, k) { if (k === "promises") return { readdir: labList }; const v = o[k]; return typeof v === "function" ? v.bind(o) : v; } });
const realLoad = Module._load;
Module._load = function (request, parent) {
  const fromSync = parent && /[\\/]src[\\/]sync-roots\.cjs$/.test(String(parent.filename || ""));
  if (fromSync && (request === "node:child_process" || request === "child_process")) return { execFileSync: shippedReg };
  if (fromSync && (request === "node:fs" || request === "fs")) return syncFs;
  return realLoad.apply(this, arguments);
};
const Engine = await import("../src/engine.mjs");
const { newProject, setPublishFolder } = await import("../src/studio.mjs");
const Store = await import("../src/team-store.mjs");
const EXPECTED = 21;
const OffWindows = (await import("./off-windows.cjs")).default;
/* fp13 and fp14 stand aside off Windows (Claude gamma's Linux sweep, 2026-11-14), and their scratch-copy plants with them: they
   hold the places Windows gives (Drive for desktop's G: and its DriveFS reads, OneDrive, a mapped letter), and off Windows
   nothing is looked at, the desk refuses a Windows-written path by design, and the reads start nothing, which fp11 holds.
   Their old off-Windows branches read red for the leg (fp13 hands an invitation a Windows path, by Claude gamma's reading; fp14
   still expected four reads where none start, read from the code and not rerun on Linux). Each skip counts toward EXPECTED as the plants' skips do. */
const PLACE_ASIDE = {
  fp13: "a default Drive for desktop install is Windows' (G:\\Shared drives, the DriveFS reads); off Windows nothing is looked at and the desk refuses a Windows-written path by design",
  fp14: "the four reads and the OneDrive and mapped-letter places are Windows'; off Windows the reads start nothing, which fp11 holds",
};
const placeAside = (id) => OffWindows.standAside(id, PLACE_ASIDE[id]);
function skipAside(line) { asserted++; console.log("  skip " + line); }
const SELF = fileURLToPath(import.meta.url);
/* ETIUDA_PLANTS=off (a merge's area run, and each plant's own child) counts the scratch-copy plants as skipped. */
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
let asserted = 0, failed = 0;
function check(ok, line) {
  asserted++;
  if (ok) console.log("  ok   " + line);
  else { failed++; console.log("  FAIL " + line); }
}

/* A const ends at the semicolon outside its brackets, as the engine's sliceAt does. A function still ends at its brace.
   fp9 uses this on the full shell, to hold the engine's own record read. The portable checks do not: they call placeRules. */
function sliceAny(src, marker) {
  const at = src.indexOf(marker);
  if (at < 0) throw new Error("no " + JSON.stringify(marker) + " in the shell");
  if (src.indexOf(marker, at + 1) >= 0) throw new Error(JSON.stringify(marker) + " is in the shell twice");
  const isFn = marker.startsWith("function");
  let par = 0, brk = 0, brc = 0, sawBrace = false;
  for (let i = at; i < src.length; i++) {
    const ch = src[i];
    if (ch === "(") par++; else if (ch === ")") par--;
    else if (ch === "[") brk++; else if (ch === "]") brk--;
    else if (ch === "{") { brc++; sawBrace = true; }
    else if (ch === "}") {
      brc--;
      if (isFn && sawBrace && !par && !brk && !brc) return src.slice(at, i + 1);
    } else if (ch === ";" && !isFn && !par && !brk && !brc) return src.slice(at, i + 1);
  }
  throw new Error("an unterminated declaration: " + marker);
}
const PLACE_DECLS = ["function placeKindOk(", "function driveTops(", "function placeSlash(", "function placeLeaf(", "function placeJoin(",
  "function placeUnder(", "function placeRest(", "function syncRootsFrom(", "function placeOf(",
  "function placeCandidates(", "function placeResolve(", "function placeKept(", "function readSyncRecords("];

function engineShell() {
  const candidates = [];
  if (process.env.ETIUDA_ENGINE_SHELL) candidates.push(process.env.ETIUDA_ENGINE_SHELL);
  candidates.push(path.join(ROOT, "engine", "pinned", "shell", "main.js"));
  /* A worktree of the engine beside this checkout, used when the pin does not yet carry placeResolve. */
  candidates.push(path.resolve(ROOT, "..", "eng-f4", "shell", "main.js"));
  for (let i = 0; i < candidates.length; i++) {
    try {
      const text = fs.readFileSync(candidates[i], "utf8");
      if (text.indexOf("function placeResolve(") >= 0) return { path: candidates[i], text: text };
    } catch (e) { /* the next candidate */ }
  }
  return null;
}

function blobDoc(blob) {
  const raw = String(blob || "");
  const cut = raw.indexOf(":");
  return JSON.parse(Buffer.from(raw.slice(cut + 1), "base64url").toString("utf8"));
}

const shell = engineShell();
let fns = null, sliceErr = "";
try {
  fns = Engine.placeRules();
  if (!fns) sliceErr = "the pinned reader is null";
} catch (e) { sliceErr = e && e.message ? e.message : "placeRules failed"; }

let exitCode = 1;
try {
  const lead = crypto.generateKeyPairSync("ed25519");
  const pub = lead.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  const team = "t-" + crypto.randomBytes(8).toString("hex");
  const storedOnly = { folder: "C:\\quay\\catalogs" };
  check(Store.folderHere(storedOnly) === "C:\\quay\\catalogs"
      && Store.folderHere({ folder: "C:\\lead\\share", relay: { rt: "ab".repeat(16), url: "https://etiuda.dev" } },
        { teamsFile: path.join(LAB, "teams.json") }) === path.join(LAB, "relay", "ab".repeat(16)),
    "fp1 an old project returns its stored folder, and a relay team still names this computer's mirror");

  const blocked = !fns || !shell ? (sliceErr || "no shell here carries placeResolve") : "";
  if (blocked) {
    check(false, "fp2 an invitation written under one user's OneDrive resolves under another's: " + blocked);
    check(false, "fp3 a UNC path resolves as itself: " + blocked);
    check(false, "fp4 a root that is absent falls back and says so: " + blocked);
    check(false, "fp6 choosing a folder writes the place: " + blocked);
    check(false, "fp7 a mapped share resolves to this computer's letter: " + blocked);
    check(false, "fp8 the pinned reader is not null: " + blocked);
    check(false, "fp9 the sliced record read starts no program but reg.exe: " + blocked);
    check(false, "fp10 the shipped path gets a place with nothing handed in: " + blocked);
    check(false, "fp11 src/sync-roots.cjs asks the engine's six reads and gives its records: " + blocked);
    check(false, "fp13 a default Drive install writes a Drive folder's place as the desk reads it: " + blocked);
    check(false, "fp14 an ordinary place is read through its four reads and lists no folder: " + blocked);
  } else {
    fs.mkdirSync(LAB, { recursive: true });
    const annaRoot = path.join(LAB, "anna", "OneDrive");
    const annaFolder = path.join(annaRoot, "Etiuda");
    const benRoot = path.join(LAB, "ben", "OneDrive");
    const benFolder = path.join(benRoot, "Etiuda");
    const elsewhere = path.join(LAB, "elsewhere");
    fs.mkdirSync(annaFolder, { recursive: true });
    fs.mkdirSync(elsewhere, { recursive: true });
    const annaRoots = fns.syncRootsFrom({ onedrive: [annaRoot] });
    const benRoots = fns.syncRootsFrom({ onedrive: [benRoot] });
    const made = await newProject(path.join(LAB, "projects"), "Place", ["en"]);
    const dir = made.dir;
    setPublishFolder(dir, annaFolder, { placeFns: fns, roots: annaRoots });
    const project = JSON.parse(fs.readFileSync(path.join(dir, "project.json"), "utf8"));
    const here = Store.folderHere(project, { placeFns: fns, roots: benRoots });
    const said = typeof Store.folderSaid === "function" ? Store.folderSaid(project, { placeFns: fns, roots: benRoots }) : null;
    check(!!project.place && project.place.kind === "onedrive" && project.place.rel === "Etiuda"
        && here === benFolder && !!said && said.how === "root" && said.why === "" && said.path === benFolder,
      "fp2 a folder under one user's OneDrive is recorded, and the other user's OneDrive is where this computer reads it: "
      + (project.place ? project.place.kind + " " + project.place.rel : "no place") + ", here " + here);

    const unc = "\\\\files\\dept\\Etiuda";
    const uncPlace = fns.placeOf(unc, annaRoots);
    const uncSaid = typeof Store.folderSaid === "function"
      ? Store.folderSaid({ folder: unc, place: uncPlace }, { placeFns: fns, roots: benRoots, present: function () { return false; } })
      : null;
    check(!!uncPlace && uncPlace.kind === "unc" && !!uncSaid && uncSaid.path === unc && uncSaid.how === "root" && uncSaid.why === ""
        && Store.folderHere({ folder: unc, place: uncPlace }, { placeFns: fns, roots: benRoots }) === unc,
      "fp3 a UNC path resolves as itself: " + (uncSaid ? uncSaid.how + " " + uncSaid.path : "not said"));

    const absent = typeof Store.folderSaid === "function"
      ? Store.folderSaid(project, { placeFns: fns, roots: [], present: function (p) { return p === project.folder; } })
      : null;
    const gone = typeof Store.folderSaid === "function"
      ? Store.folderSaid(project, { placeFns: fns, roots: [], present: function () { return false; } })
      : null;
    check(!!absent && absent.path === project.folder && absent.how === "absolute" && absent.why === "absent"
        && !!gone && gone.how === "ask" && gone.why === "absent"
        && Store.folderHere(project, { placeFns: fns, roots: [], present: function () { return false; } }) === project.folder,
      "fp4 a root that is absent falls back to the absolute path and says so, and asks when that path is not there: "
      + (absent ? absent.how + "/" + absent.why : "not said"));

    const kept = JSON.parse(fs.readFileSync(path.join(dir, "project.json"), "utf8"));
    setPublishFolder(dir, annaFolder, { placeFns: fns, roots: annaRoots });
    const still = JSON.parse(fs.readFileSync(path.join(dir, "project.json"), "utf8"));
    setPublishFolder(dir, elsewhere, { placeFns: fns, roots: annaRoots });
    const cleared = JSON.parse(fs.readFileSync(path.join(dir, "project.json"), "utf8"));
    check(!!kept.place && !!still.place && still.place.kind === "onedrive" && still.place.rel === kept.place.rel
        && cleared.place === undefined && cleared.folder === path.resolve(elsewhere),
      "fp6 choosing a folder writes the place, the same folder through the reader keeps it, and a different folder clears it: "
      + (still.place ? "kept" : "wiped") + ", cleared " + (cleared.place === undefined));

    const writerMap = fns.syncRootsFrom({ mapped: [{ letter: "Z:", remote: "\\\\files\\dept" }] });
    const readerMap = fns.syncRootsFrom({ mapped: [{ letter: "Y:", remote: "\\\\files\\dept" }] });
    const mappedPlace = fns.placeOf("Z:\\Etiuda", writerMap);
    const mappedSaid = typeof Store.folderSaid === "function"
      ? Store.folderSaid({ folder: "Z:\\Etiuda", place: mappedPlace }, { placeFns: fns, roots: readerMap })
      : null;
    check(!!mappedPlace && mappedPlace.kind === "mapped" && mappedPlace.root === "\\\\files\\dept" && mappedPlace.rel === "Etiuda"
        && !!mappedSaid && mappedSaid.path === "Y:\\Etiuda" && mappedSaid.how === "root",
      "fp7 a mapped share resolves to this computer's own letter: " + (mappedSaid ? mappedSaid.path : "not said"));

    let agreed = false, pure = false, fromErr = "";
    try {
      const slices = fs.readFileSync(path.join(ROOT, "engine", "pinned", ".shell-slices.js"), "utf8");
      pure = slices.indexOf("function placeResolve(") >= 0 && slices.indexOf("function readSyncRecords(") >= 0
        && slices.indexOf("function liveSyncIo(") < 0 && slices.indexOf("execFileSync") < 0
        && slices.indexOf("child_process") < 0;
      const again = fns.placeOf(path.join(annaRoot, "Etiuda"), annaRoots);
      agreed = !!again && again.rel === "Etiuda" && again.kind === "onedrive";
    } catch (e) { fromErr = e && e.message ? e.message : "placeRules failed"; }
    check(!!fns && agreed && pure,
      "fp8 on a pin carrying the place rules, the pinned reader is not null, and the slices carry the pure rules only: "
      + (agreed ? "agrees" : "differs") + ", pure " + pure + (fromErr ? " " + fromErr : ""));

    const calls = [];
    const REG = "C:\\Windows\\System32\\reg.exe";
    const wantArgs = [
      ["query", "HKCU\\Software\\Microsoft\\OneDrive\\Accounts", "/s", "/v", "UserFolder"],
      ["query", "HKCU\\Software\\Google\\DriveFS", "/s", "/v", "DefaultMountPoint"],
      ["query", "HKLM\\SOFTWARE\\Policies\\Google\\DriveFS", "/s", "/v", "DefaultMountPoint"],
      ["query", "HKLM\\SOFTWARE\\Google\\DriveFS", "/s", "/v", "DefaultMountPoint"],
      ["query", "HKLM\\SOFTWARE\\WOW6432Node\\Google\\DriveFS", "/s", "/v", "DefaultMountPoint"],
      ["query", "HKCU\\Network", "/s", "/v", "RemotePath"]
    ];
    const regTextFor = function (args) {
      const key = String(args && args[1] || "");
      const name = String(args && args[4] || "");
      if (name === "UserFolder") return [
        "HKEY_CURRENT_USER\\Software\\Microsoft\\OneDrive\\Accounts\\Personal",
        "    UserFolder    REG_SZ    C:\\Users\\ann\\OneDrive",
        "",
        "HKEY_CURRENT_USER\\Software\\Microsoft\\OneDrive\\Accounts\\Business1",
        "    UserFolder    REG_SZ    C:\\Users\\ann\\OneDrive - Northwind",
        "",
        "End of search: 2 match(es) found.",
        ""
      ].join("\r\n");
      if (name === "DefaultMountPoint" && key.indexOf("HKCU\\") === 0) return [
        "HKEY_CURRENT_USER\\Software\\Google\\DriveFS",
        "    DefaultMountPoint    REG_SZ    G:\\",
        ""
      ].join("\r\n");
      if (name === "DefaultMountPoint" && key.indexOf("HKLM\\") === 0) return [
        "HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Google\\DriveFS",
        "    DefaultMountPoint    REG_SZ    H:\\",
        ""
      ].join("\r\n");
      if (name === "RemotePath") return [
        "HKEY_CURRENT_USER\\Network\\Z",
        "    RemotePath    REG_SZ    \\\\files\\dept",
        ""
      ].join("\r\n");
      return "";
    };
    const spy = function (file, args, opts) {
      calls.push({ file: file, args: args, opts: opts });
      const text = regTextFor(args);
      if (opts && opts.encoding && opts.encoding !== "buffer") return text;
      return Buffer.from(text, "utf8");
    };
    const requireSpy = function (name) {
      if (name === "node:child_process" || name === "child_process") return { execFileSync: spy, execFile: function () { throw new Error("execFile"); } };
      if (name === "node:fs" || name === "fs") return {
        readFileSync: function (p) {
          const at = String(p);
          if (at.indexOf("Roaming") >= 0 && /\\Dropbox\\info\.json$/i.test(at))
            return JSON.stringify({ personal: { path: "C:\\Users\\ann\\Dropbox" } });
          return "";
        }
      };
      throw new Error("require " + name);
    };
    let ioErr = "", records = null, fnText = "";
    const annEnv = {
      APPDATA: "C:\\Users\\ann\\AppData\\Roaming",
      LOCALAPPDATA: "C:\\Users\\ann\\AppData\\Local",
      OneDriveConsumer: "C:\\Users\\ann\\OneDrive"
    };
    try {
      const markers = ["const { execFile, execFileSync } =", "const fs = require(\"node:fs\");", "const REG_TOOL ="]
        .concat(PLACE_DECLS).concat(["function liveSyncIo("]);
      const body = markers.map(function (m) { return sliceAny(shell.text, m); }).join("\n");
      fnText = sliceAny(shell.text, "function liveSyncIo(");
      /* THE ENGINE'S REG GUARD: a pin that carries it passes every reg call's options through regOpts
         (shell/win-proxy.cjs), which outside Electron lets a call go ahead only where the function that runs it is a
         stand-in carrying the guard's mark. The slice is given the pin's own guard and the spy carries the mark, so the
         read below is the pinned one, guard included. A pin from before the guard names none and is given none. */
      let regOpts = function (run, opts) { return opts; };
      if (fnText.indexOf("regOpts(") >= 0) {
        regOpts = Module.createRequire(import.meta.url)(path.join(path.dirname(shell.path), "win-proxy.cjs")).regOpts;
        spy[Symbol.for("etiuda.reg-stand")] = true;
      }
      const loaded = new Function("crypto", "Buffer", "require", "process", "regOpts",
        body + "\nreturn { readSyncRecords };")(crypto, Buffer, requireSpy, { platform: "win32", env: annEnv }, regOpts);
      records = loaded.readSyncRecords(null);
    } catch (e) { ioErr = e && e.message ? e.message : "live slice failed"; }
    const programs = calls.map(function (c) { return String(c.file); });
    const argsOk = calls.length === wantArgs.length && wantArgs.every(function (w, i) { return JSON.stringify(calls[i].args) === JSON.stringify(w); });
    const optsOk = calls.length > 0 && calls.every(function (c) {
      return c.opts && c.opts.windowsHide === true && typeof c.opts.timeout === "number" && c.opts.timeout >= 1 && c.opts.timeout <= 5000;
    });
    const onlyReg = programs.length > 0 && programs.every(function (p) { return p === REG; })
      && !/powershell|pwsh|cmd\.exe/i.test(programs.join("\n"))
      && fnText.indexOf("powershell") < 0 && fnText.indexOf("require(") < 0
      && fnText.indexOf("execFileSync(REG_TOOL") >= 0;
    const gdrive = records && records.gdrive ? records.gdrive.slice().sort().join("|") : "";
    const mapped = records && records.mapped && records.mapped[0];
    check(!!records && onlyReg && argsOk && optsOk && !ioErr
        && records.onedrive && records.onedrive.join("|") === "C:\\Users\\ann\\OneDrive"
        && records.onedriveBusiness && records.onedriveBusiness.join("|") === "C:\\Users\\ann\\OneDrive - Northwind"
        && gdrive === "G:|H:"
        && records.dropbox && records.dropbox.join("|") === "C:\\Users\\ann\\Dropbox"
        && mapped && mapped.letter === "Z:" && mapped.remote === "\\\\files\\dept",
      "fp9 the sliced record read starts no program but reg.exe at its fixed path, inside the policy read's five seconds: "
      + (ioErr || programs.join(", ") || "no program")
      + (argsOk ? "" : " args") + (optsOk ? "" : " timeout")
      + ", onedrive " + (records && records.onedrive ? records.onedrive.join("|") : "")
      + ", gdrive " + gdrive);

    /* fp10, THE SHIPPED PATH: nothing handed in, so each caller takes Engine.placeRules() (the slices, shellText) and
       the records the injected src/sync-roots.cjs reads, through the stand-in's one OneDrive account. The four reads are
       made once, at the first caller that needed them, and kept. */
    const carlFolder = path.join(CARL_ROOT, "Etiuda");
    fs.mkdirSync(carlFolder, { recursive: true });
    let shipErr = "", carlProject = {}, carlSaid = {}, carlHere = "";
    try {
      const carlMade = await newProject(path.join(LAB, "projects-carl"), "Carl", ["en"]);
      setPublishFolder(carlMade.dir, carlFolder);
      carlProject = JSON.parse(fs.readFileSync(path.join(carlMade.dir, "project.json"), "utf8"));
      carlSaid = Store.folderSaid(carlProject) || {};
      carlHere = Store.folderHere(carlProject);
    } catch (e) { shipErr = e && e.message ? e.message : "the shipped path threw"; }
    const same = function (a, b) { return typeof a === "string" && !!a && path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase(); };
    const placed = function (p) { return !!p && p.kind === "onedrive" && p.rel === "Etiuda"; };
    const askedOnce = shippedCalls.length === wantArgs.length && shippedCalls.every(function (c, i) {
      return c.file === REG && JSON.stringify(c.args) === JSON.stringify(wantArgs[i]) && !!c.opts && c.opts.windowsHide === true
        && typeof c.opts.timeout === "number" && c.opts.timeout >= 1 && c.opts.timeout <= 5000
        && (i === 0 || c.opts.timeout <= shippedCalls[i - 1].opts.timeout);
    });
    const shipSaid = (shipErr || ("project " + (carlProject.place ? carlProject.place.kind + " " + carlProject.place.rel : "no place")
      + ", read " + carlSaid.how + "/" + carlSaid.why)) + ", reg reads " + shippedCalls.length;
    if (process.platform === "win32")
      check(!shipErr && placed(carlProject.place) && carlSaid.how === "root" && same(carlSaid.path, carlFolder)
          && same(carlHere, carlFolder) && askedOnce,
        "fp10 the shipped path, nothing handed in: choosing a folder and the folder read back each take the place"
        + " from the slices, through src/sync-roots.cjs's four reads made once: " + shipSaid);
    else
      check(!shipErr && !carlProject.place && carlSaid.why === "plain" && shippedCalls.length === 0,
        "fp10 off Windows the shipped path starts nothing and keeps the absolute path: " + shipSaid);

    /* fp11, STUDIO'S OWN READ IS THE ENGINE'S: the four reads, the deadline and the tool's path appear in
       src/sync-roots.cjs as the pinned shell writes them. The call is that one, with stderr ignored so a missing key
       stays off the log. The file's io, loaded on the same answers fp9 gave the engine's liveSyncIo, gives the same
       records. Off Windows the same file starts nothing and names no root. */
    let twinErr = "", twin = null, wordsOk = false, offRoots = -1;
    const twinCalls = [], offCalls = [];
    try {
      const studioText = fs.readFileSync(path.join(ROOT, "src", "sync-roots.cjs"), "utf8");
      const asks = function (t) { return t.match(/\["query",[^\]]*\]/g) || []; };
      const engineAsks = asks(fnText);
      const once = function (t, line) { return t.split(line).length === 2; };
      /* The engine's call, as a pin with the reg guard writes it and as one from before it did. Studio's own read
         carries no guard: its legs stand a require in before the file loads (the head of this file). */
      const engineOpts = "{ windowsHide: true, timeout: left, encoding: \"buffer\", maxBuffer: 1024 * 1024 }";
      const engineCall = fnText.indexOf("regOpts(") >= 0
        ? "execFileSync(REG_TOOL, queries[i], regOpts(execFileSync, " + engineOpts + "))"
        : "execFileSync(REG_TOOL, queries[i], " + engineOpts + ")";
      const studioCall = "execFileSync(REG_TOOL, queries[i], { windowsHide: true, timeout: left, encoding: \"buffer\", maxBuffer: 1024 * 1024, stdio: [\"ignore\", \"pipe\", \"ignore\"] })";
      wordsOk = engineAsks.length === 6 && JSON.stringify(asks(studioText)) === JSON.stringify(engineAsks)
        && once(studioText, sliceAny(shell.text, "const REG_TOOL ="))
        && once(studioText, "const deadline = Date.now() + 5000;") && once(fnText, "const deadline = Date.now() + 5000;")
        && once(fnText, engineCall) && once(studioText, studioCall);
      const load = function (platform, seen) {
        const mod = { exports: {} };
        const req = function (name) {
          if (name === "node:child_process") return { execFileSync: function (file, args, opts) {
            seen.push({ file: file, args: args, opts: opts });
            return Buffer.from(regTextFor(args), "utf8");
          } };
          if (name === "node:fs") return requireSpy("node:fs");
          throw new Error("require " + name);
        };
        new Function("require", "module", "exports", "process", "Buffer", studioText)(req, mod, mod.exports, { platform: platform, env: annEnv }, Buffer);
        return mod.exports.syncIo();
      };
      twin = fns.readSyncRecords(load("win32", twinCalls));
      offRoots = fns.syncRootsFrom(fns.readSyncRecords(load("linux", offCalls))).length;
    } catch (e) { twinErr = e && e.message ? e.message : "src/sync-roots.cjs did not load"; }
    check(!twinErr && wordsOk && !!records && JSON.stringify(twin) === JSON.stringify(records)
        && twinCalls.length === 6 && twinCalls.every(function (c) { return c.file === REG; }) && offCalls.length === 0 && offRoots === 0,
      "fp11 src/sync-roots.cjs asks the engine's six reads word for word and gives the records the engine's liveSyncIo gives on"
      + " the same answers; off Windows it starts nothing and names no root: "
      + (twinErr || ("words " + wordsOk + ", same " + (JSON.stringify(twin) === JSON.stringify(records))
        + ", reads " + twinCalls.length + ", off Windows " + offCalls.length + " started, " + offRoots + " root(s)")));

    /* fp13, A DEFAULT DRIVE INSTALL (board 955, condition 2): the stand-in names no DefaultMountPoint anywhere, and G: holds
       Drive's two folders. The place is written after the look, through the shipped path, nothing handed in, and a desk
       whose Drive is H: in Polish reads it with the pin's own rule. A mapped network letter (Z:, from the stand-in's
       Network key) is never listed. */
    const POLISH_MINE = "M" + String.fromCharCode(0xf3) + "j dysk";
    const POLISH_SHARED = "Dyski wsp" + String.fromCharCode(0xf3, 0x142) + "dzielone";
    fs.mkdirSync(path.join(DRIVE_G, "Shared drives", "Team"), { recursive: true });
    fs.mkdirSync(path.join(DRIVE_G, "My Drive"), { recursive: true });
    const driveFolder = "G:\\Shared drives\\Team";
    const driveSaid = (p) => (p ? p.kind + " " + (p.root || "") + " / " + p.rel : "no place");
    const onDrive = (p) => !!p && p.kind === "gdrive" && p.root === "Shared drives" && p.rel === "Team";
    let gErr = "", gPlace = null, gBack = null;
    const lookFrom = listed.length;
    try {
      gPlace = await Store.placeForLooked(driveFolder);
      const polish = fns.syncRootsFrom({ gdrive: ["H:"], gdriveSeen: [{ root: "H:", tops: [POLISH_MINE, POLISH_SHARED], links: [] }] });
      gBack = fns.placeResolve(driveFolder, gPlace, polish);
    } catch (e) { gErr = e && e.message ? e.message : "the Drive path threw"; }
    const looked = listed.slice(lookFrom);
    const fp13Aside = placeAside("fp13");
    if (fp13Aside) skipAside(fp13Aside);
    else
      check(!gErr && onDrive(gPlace) && !!gBack && gBack.how === "root"
          && gBack.path === "H:\\" + POLISH_SHARED + "\\Team" && looked.indexOf("G:\\") >= 0 && looked.indexOf("Z:\\") < 0,
        "fp13 a lead's Studio on a default Drive install writes G:\\Shared drives\\Team's place as the desk reads it, Drive's folder"
        + " as the root and the part after it as the path, and a Polish desk lands in its own spelling: "
        + (gErr || ("place " + driveSaid(gPlace)
          + ", desk " + (gBack ? gBack.how + " " + gBack.path : "none") + ", listed " + looked.length + (looked.indexOf("Z:\\") >= 0 ? ", Z: listed" : ""))));

    /* fp14, AN ORDINARY PLACE: a OneDrive folder, and a folder on the mapped letter Z:, are placed as before with nothing
       listed, and the records are the four reads they always were, beside the two machine-wide DriveFS queries. */
    const ordinaryFrom = listed.length;
    let oErr = "", oCarl = null, oMapped = null;
    try {
      oCarl = await Store.placeForLooked(carlFolder);
      oMapped = await Store.placeForLooked("Z:\\Etiuda");
    } catch (e) { oErr = e && e.message ? e.message : "the ordinary path threw"; }
    const added = ["HKLM\\SOFTWARE\\Google\\DriveFS", "HKLM\\SOFTWARE\\WOW6432Node\\Google\\DriveFS"];
    const fourBefore = wantArgs.filter((w) => added.indexOf(w[1]) < 0);
    const ordinaryAsked = shippedCalls.filter((c) => added.indexOf(String(c.args && c.args[1])) < 0).map((c) => JSON.stringify(c.args));
    const fourKept = fourBefore.length === 4 && JSON.stringify(ordinaryAsked) === JSON.stringify(fourBefore.map((w) => JSON.stringify(w)));
    const fp14Aside = placeAside("fp14");
    if (fp14Aside) skipAside(fp14Aside);
    else check(!oErr && listed.length === ordinaryFrom && fourKept
        && !!oCarl && oCarl.kind === "onedrive" && oCarl.rel === "Etiuda" && !!oMapped && oMapped.kind === "mapped",
      "fp14 an ordinary place, a OneDrive folder and one on a mapped letter, is placed as before and lists no folder, through the"
      + " four reads it always was: " + (oErr || ((oCarl ? oCarl.kind : "none") + ", " + (oMapped ? oMapped.kind : "none")
        + ", listed " + (listed.length - ordinaryFrom) + ", four kept " + fourKept + " of " + shippedCalls.length + " reads")));
  }
  /* fp12. The six reads stay the engine's. A key that is not there makes reg.exe exit non-zero and write a
     complaint; that complaint is not a fault, so the shipped call keeps it off stderr. */
  const quietCall = 'execFileSync(REG_TOOL, queries[i], { windowsHide: true, timeout: left, encoding: "buffer", maxBuffer: 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] })';
  let quietNamed = false, quietErr = "", quietStatus = null, quietFail = "";
  try {
    const studioText = fs.readFileSync(path.join(ROOT, "src", "sync-roots.cjs"), "utf8");
    quietNamed = studioText.split(quietCall).length === 2;
    const child = spawnSync(process.execPath, ["-e", "require(" + JSON.stringify(path.join(ROOT, "src", "sync-roots.cjs")) + ").syncIo()"],
      { encoding: "utf8", timeout: 20000, windowsHide: true });
    quietErr = String(child.stderr || "");
    quietStatus = child.status;
    if (child.error) quietFail = child.error.message;
  } catch (e) { quietFail = e && e.message ? e.message : "the quiet read did not start"; }
  const quiet = !quietFail && quietStatus === 0 && quietErr.replace(/\s+/g, "") === "";
  /* fp15, A PARTIAL READ IS NOT KEPT (Grok's review 13, finding 7): where the deadline cuts a read short, the records are read
     again at the next ask, not kept for the life of the process; a whole read is kept. The reg tool is a stand-in here. */
  let partialErr = "", partial = null;
  try {
    const studioText = fs.readFileSync(path.join(ROOT, "src", "sync-roots.cjs"), "utf8");
    const seen = [];
    let slow = true;
    const req = (name) => {
      if (name === "node:child_process") return { execFileSync: (file, args) => {
        seen.push(String(args[1]));
        if (slow && args[4] === "RemotePath") throw Object.assign(new Error("timed out"), { code: "ETIMEDOUT" });
        return Buffer.from(args[4] === "RemotePath" ? "HKEY_CURRENT_USER" + String.fromCharCode(92) + "Network" + String.fromCharCode(92) + "Z" + String.fromCharCode(13, 10) + "    RemotePath    REG_SZ    unc-root" + String.fromCharCode(13, 10) : "", "utf8");
      } };
      if (name === "node:fs") return fs;
      throw new Error("require " + name);
    };
    const mod = { exports: {} };
    new Function("require", "module", "exports", "process", "Buffer", studioText)(req, mod, mod.exports, { platform: "win32", env: {} }, Buffer);
    const key = "HKCU:" + String.fromCharCode(92) + "Network" + String.fromCharCode(92) + "Z";
    const first = mod.exports.syncIo().reg(key, "RemotePath"), afterFirst = seen.length;
    slow = false;
    /* The minute has passed. Nothing waits: the partial record's own clock is moved. */
    mod.exports.syncIo.partialAt = Date.now() - 60000;
    const second = mod.exports.syncIo().reg(key, "RemotePath"), afterSecond = seen.length;
    mod.exports.syncIo();
    partial = { first, afterFirst, second, afterSecond, afterThird: seen.length };
  } catch (e) { partialErr = e && e.message ? e.message : "src/sync-roots.cjs did not load"; }
  check(!partialErr && !!partial && partial.first === "" && partial.afterFirst === 6 && partial.second === "unc-root" && partial.afterSecond === 12
      && partial.afterThird === 12,
    "fp15 a record read the deadline cut short is read again once a minute has passed, and a whole read is kept: " + (partialErr || JSON.stringify(partial)));
  /* fp16, A PARTIAL READ IS REUSED FOR A MINUTE: the next ask inside that minute starts no read. Once the minute has passed
     the records are read again, and a whole read is kept. The clock is moved. The reg tool is a stand-in. */
  let soonErr = "", soon = null;
  try {
    const studioText = fs.readFileSync(path.join(ROOT, "src", "sync-roots.cjs"), "utf8");
    const seen = [];
    let slow = true;
    const req = (name) => {
      if (name === "node:child_process") return { execFileSync: (file, args) => {
        seen.push(String(args[1]));
        if (slow && args[4] === "RemotePath") throw Object.assign(new Error("timed out"), { code: "ETIMEDOUT" });
        return Buffer.from(args[4] === "RemotePath" ? "HKEY_CURRENT_USER" + String.fromCharCode(92) + "Network" + String.fromCharCode(92) + "Z" + String.fromCharCode(13, 10) + "    RemotePath    REG_SZ    unc-root" + String.fromCharCode(13, 10) : "", "utf8");
      } };
      if (name === "node:fs") return fs;
      throw new Error("require " + name);
    };
    const mod = { exports: {} };
    new Function("require", "module", "exports", "process", "Buffer", studioText)(req, mod, mod.exports, { platform: "win32", env: {} }, Buffer);
    const key = "HKCU:" + String.fromCharCode(92) + "Network" + String.fromCharCode(92) + "Z";
    const io = mod.exports.syncIo;
    const first = io().reg(key, "RemotePath"), afterFirst = seen.length;
    const second = io().reg(key, "RemotePath"), afterSecond = seen.length;
    slow = false;
    io.partialAt = Date.now() - 60000;
    const third = io().reg(key, "RemotePath"), afterThird = seen.length;
    io();
    soon = { first, afterFirst, second, afterSecond, third, afterThird, afterFourth: seen.length };
  } catch (e) { soonErr = e && e.message ? e.message : "src/sync-roots.cjs did not load"; }
  check(!soonErr && !!soon && soon.first === "" && soon.afterFirst === 6 && soon.second === "" && soon.afterSecond === 6
      && soon.third === "unc-root" && soon.afterThird === 12 && soon.afterFourth === 12,
    "fp16 a record the deadline cut short is reused for a minute, then read again, and a whole read is kept: " + (soonErr || JSON.stringify(soon)));
  check(quietNamed && quiet,
    "fp12 an absent key prints nothing to stderr, and the read asks reg with stderr ignored: "
    + (quietNamed ? "call" : "call missing") + ", status " + quietStatus
    + (quietFail ? " " + quietFail : "") + ", stderr " + JSON.stringify(quietErr.slice(0, 180)));
  /* The two guards Studio adds, each lifted in a scratch copy: the look's answer kept for the place rules, and an ordinary
     place left unlooked at. */
  const PLACE_PLANTS = [
    { mark: "st-drive-keep", leg: "fp13", rel: "src/engine.mjs", line: "    /* plant:st-drive-keep lifted */" },
    { mark: "st-look-skip", leg: "fp14", rel: "src/engine.mjs", line: "  /* plant:st-look-skip lifted */" },
    { mark: "st-place-look", leg: "fp13", rel: "src/team-store.mjs", line: "  /* plant:st-place-look lifted */" },
    { mark: "r13-roots-whole", leg: "fp15", rel: "src/sync-roots.cjs", line: "  /* plant:r13-roots-whole lifted */" },
    { mark: "r13-roots-soon", leg: "fp16", rel: "src/sync-roots.cjs", line: "  held = false;" },
  ];
  /* Every plant here turns fp13 or fp14 red, so where those stand aside each plant stands aside with its leg, counted as the
     phase counts its own skips, and nothing is copied. */
  if (PLACE_PLANTS.every((p) => placeAside(p.leg))) {
    for (const p of PLACE_PLANTS) skipAside("plant " + p.mark + " turns " + p.leg + " red in a scratch copy: " + placeAside(p.leg));
    skipAside("the checkout is unchanged after the scratch-copy plants of folder-place: no copy was made, every plant standing aside");
  } else copyPlants({
    root: ROOT, self: SELF, label: "folder-place", onlyVar: "FOLDER_PLACE_ONLY", timeout: 180000,
    plants: PLACE_PLANTS,
    check, skip: (line) => { asserted++; console.log("  skip " + line + (PLANTS_OFF ? "" : " (plants on, yet skipped)")); },
  });
  console.log("#counts checks=" + asserted + " failed=" + failed + " expected=" + EXPECTED);
  if (asserted < EXPECTED) {
    console.log("SUITE DID NOT COMPLETE: " + asserted + " of " + EXPECTED + " checks ran");
    exitCode = 78;
  } else {
    console.log(failed ? "  RESULT: FAIL " + failed + " of " + asserted : "  RESULT: ok " + asserted + " check(s)");
    exitCode = Math.min(failed, 63);
  }
} catch (e) {
  console.log("FAIL folder-place threw: " + (e && e.stack ? e.stack : e));
  exitCode = 1;
} finally {
  dropScratch(LAB, "folder-place");
}
process.exit(exitCode);
