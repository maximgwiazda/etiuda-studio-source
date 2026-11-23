/* THE GATE OF THE COURSE'S "GOAL AND THE HALT", WRITTEN BEFORE THE THING IT JUDGES.
 *
 *     node tests/round-trip.mjs
 *     node tests/round-trip.mjs --csv <macros.csv> --folder <dir> [--manifest <manifest.json>]
 *     node tests/round-trip.mjs --control --csv <macros.csv> [--ec <catalog.json>]
 *
 * A CSV goes in, a draft catalog comes out, publish writes an unsigned .ec into a folder, a
 * second process - a desk with eCatalogFolder pinned there - offers it and does not load it on
 * its own, and the counts the Library row shows equal the counts computed from the CSV.
 *
 * TODAY IT FAILS CLOSED AT THE FIRST MISSING PIECE and says which. That is the point of writing
 * it now: a gate written after the thing it judges is written to the thing's shape, and this one
 * has to be written to the promise's shape while the promise is all there is. The stages that
 * can run today do run today, and --control runs exactly those, so the arithmetic is proved
 * before there is anything to do arithmetic about.
 *
 * THE DESK STAGE GOES THROUGH THE PINNED HARNESS'S OWN LAUNCHER since 2026-09-17 (board item
 * 471), never child_process.spawn: E.shellLaunch refuses a launch with no user-data folder of
 * its own, one aimed at this machine's profile, one with nothing confining the catalog folder,
 * and one taken while the engine's reinstall loop holds the desk lock. guardControl() below puts
 * an unconfined launch to that guard before the stage launches anything, so a pin that slipped
 * back behind the guard is red here rather than quiet.
 *
 * BARE, IT IS THE GATE IN `npm test` (sense pass item 40): two piles from the committed
 * generator, one with commas and the same one with semicolons, each taken through every stage.
 *
 * THE DESK STAGE WAS WRITTEN 2026-09-17 and the refusal it replaced is gone. Until then it was a
 * readiness check and a recorded recipe rather than a body of plausible puppeteer that had never
 * been driven, because a check that has never rejected anything has been written rather than
 * tested, and one that has never RUN is worse. It drives the PINNED shell over a lab copy, or the
 * packaged desk ETIUDA_DESK_EXE names, and says which.
 *
 * WHERE THE EXPECTED NUMBERS COME FROM, and the rule is the whole of the claim. The counts are
 * computed here, from the CSV, by the rules written at EXPECTED below. They are NOT read from
 * the catalog the publisher wrote and they are not the engine's opinion of anything: an oracle
 * that asks the subject is the early-victory failure with extra steps. The pinned shell's own
 * ecCounts is a SECOND arm over the published file, and the two arms have to agree with the
 * desk's row for the gate to be green.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { clearScratch } from "./scratch.mjs";
import { wallOrThrow } from "./window-wall.mjs";
import { waitLaunchGone } from "./launch-wait.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const PINNED = path.join(ROOT, "engine", "pinned");
const require = createRequire(import.meta.url);

/* WHERE THE DESK IS: the pinned shell in a lab unless ETIUDA_DESK_EXE names a packaged build,
   and the stage names whichever it used, because a gate that drove a build nobody can identify
   has proved nothing about the build that ships. */
async function deskLab(dir, opts) {
  const { readPin, engineRepo, gitText, blob, readPinnedOrBuilt } =
    await import(pathToFileURL(path.join(ROOT, "tools", "engine-fetch.mjs")).href);
  const pin = (opts && opts.pin) || readPin(path.join(ROOT, "tools", "engine-pin")).pin;
  const repo = (opts && opts.repo) || engineRepo({}).dir;
  const pinnedDir = (opts && opts.pinnedDir) || PINNED;
  const fromPin = (rel) => {
    const bytes = readPinnedOrBuilt(repo, pin, pinnedDir, rel); /* plant:rt-built-page */
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), bytes);
  };
  clearScratch(dir);
  /* The whole shell, so a module the pin's main.js gains can't stop the lab with a crash dialog on the desk (page-watch.cjs did). */
  gitText(repo, ["ls-tree", "-r", "--name-only", pin, "--", "shell"]).out.trim().split("\n").filter(Boolean)
    .concat(["engine/etiuda.html", "engine/etiuda.csp.json"]).forEach(fromPin);
  fs.writeFileSync(path.join(dir, "package.json"),
    JSON.stringify({ name: "etiuda-round-trip-desk", version: "0.0.0", main: "shell/main.js" }));
  fs.mkdirSync(path.join(dir, "documents"), { recursive: true });
  return { lab: dir, docs: path.join(dir, "documents"), pin: pin.slice(0, 7) };
}

/* A PORT THE OPERATING SYSTEM CHOSE, not one this file guessed. Two gates running at once on a
   fixed port is a flake that reads as a product fault. */
function freePort() {
  const net = require("node:net");
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const p = srv.address().port;
      srv.close(() => resolve(p));
    });
  });
}

/* THE LIBRARY ROW'S SMALL PRINT, back into numbers. The row renders one line: parts separated by
   a middot with spaces, each count a figure, a NON-BREAKING space and a noun. Anchored on the
   noun rather than on the position, because the edition and the disk time come and go from the
   front of that line depending on what the file declares. Singular and plural both, since a
   catalog of one card says "1 card". `cats` is spelled "categories" or "category" there, which
   is the one place this gate's key and the desk's word differ. */
function metaCounts(meta) {
  const NBSP = String.fromCharCode(160);
  const parts = String(meta || "").split(" " + String.fromCharCode(183) + " ");
  const out = {};
  const take = (key, ...nouns) => {
    for (const p of parts) {
      const m = new RegExp("^([0-9]+)" + NBSP + "(" + nouns.join("|") + ")$").exec(p);
      if (m) { out[key] = +m[1]; return; }
    }
  };
  take("cards", "cards", "card");
  take("macros", "macros", "macro");
  take("intents", "intents", "intent");
  take("cats", "categories", "category");
  return out;
}

/* ---- CSV, RFC 4180, including the quoted field with a newline in it ---------------------- */

/* THE SEPARATOR, BY THIS GATE'S OWN RULE and not by importing src/csv.mjs's delimiterOf, so that
   a publisher which misread a separator cannot agree with the gate by sharing its mistake: the
   separator is the one of comma, semicolon and tab under which the header has two or more cells
   and every row that is not blank has exactly as many; of several, the one giving most cells. */
const SEPARATORS = [",", ";", "\t"];
function separatorOf(text) {
  let best = ",", width = 1;
  SEPARATORS.forEach(sep => {
    const all = csvRows(text, sep).filter(r => r.some(v => String(v).trim()));
    const w = all.length ? all[0].length : 0;
    if (w > width && all.every(r => r.length === w)) { best = sep; width = w; }
  });
  return best;
}

function parseCsv(text) {
  const rows = csvRows(text, separatorOf(text));
  if (!rows.length) throw new Error("the CSV has no rows at all");
  const head = rows[0].map(h => h.trim());
  return rows.slice(1).filter(r => r.some(v => String(v).trim()))
    .map(r => { const o = {}; head.forEach((h, j) => { o[h] = r[j] == null ? "" : r[j]; }); return o; });
}

function csvRows(text, sep) {
  const s = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
  const rows = [];
  let row = [], field = "", quoted = false, i = 0;
  while (i < s.length) {
    const c = s[i];
    if (quoted) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i += 2; continue; }
        quoted = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"' && field === "") { quoted = true; i++; continue; }
    if (c === sep) { row.push(field); field = ""; i++; continue; }
    if (c === "\r" && s[i + 1] === "\n") { row.push(field); rows.push(row); row = []; field = ""; i += 2; continue; }
    if (c === "\n" || c === "\r") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
    field += c; i++;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** The same table written with another separator, quoting any cell that carries it, a quote or
 *  a line break: the semicolon pile a spreadsheet on a Polish desk saves. */
function withSeparator(text, sep) {
  const cell = v => /["\r\n]/.test(v) || v.indexOf(sep) >= 0 ? '"' + v.replace(/"/g, '""') + '"' : v;
  return csvRows(text, separatorOf(text)).map(r => r.map(cell).join(sep)).join("\r\n") + "\r\n";
}

/* ---- the expected counts, computed here and from the CSV alone --------------------------- */

/* THE COUNT SET, AND A DISAGREEMENT THIS SEAT DID NOT INVENT. The shell's own comment over
 * ipcMain.handle("etiuda:catalog-files") says "its five counts"; the row renders four numbers,
 * and the handler returns four numbers a catalog decides (cards, macros, intents, categories)
 * beside a name, an edit time and an edition. So this gate compares FOUR and names them, and
 * the fifth is an open question for whoever wrote the comment rather than a number this gate
 * will guess at. Adding one is a row here and a rule beside it.
 *
 * The rules, each stated so that a second tool could be written from the sentence:
 *   cards       one row of the CSV is one card, blank rows dropped.
 *   macros      body blocks in the primary language, by the pinned engine's ecBlocks: a plain
 *               body is one block, so for a pile of plain bodies this is the count of rows with
 *               a non-empty primary body; a body written in the engine's own steps or alts
 *               encoding counts the blocks its marker lines divide it into.
 *   intents     distinct non-empty clauses over the intents column, split on ";" and trimmed.
 *   categories  distinct category keys named by at least one row. A shelf no card stands on is
 *               a shelf the importer has no reason to mint, and that is a CONTRACT on the
 *               publisher rather than an observation: a publisher that mints the unused ones
 *               makes this gate red, and the disagreement is then settled deliberately.
 */
const COUNT_KEYS = ["cards", "macros", "intents", "cats"];
/* The desk keys that say its tour was taken and its invite answered, as the engine's suites seed them. */
const TOUR_SEEN = { eTourDone_v3: "1", eTourInvite_v3: "1" };

function expected(rows, opts) {
  const lang = (opts && opts.primary) || "en";
  const body = "body_" + lang;
  const uniq = (list) => new Set(list.filter(v => String(v).trim())).size;
  const intents = new Set();
  rows.forEach(r => String(r.intents || "").split(";").map(x => x.trim())
    .filter(Boolean).forEach(x => intents.add(x)));
  return {
    cards: rows.length,
    macros: rows.filter(r => String(r[body] || "").trim()).length,
    intents: intents.size,
    cats: uniq(rows.map(r => r.category)),
  };
}

/* ---- the second arm: the pinned shell's own counting rules -------------------------------- */

/* Sliced out of the pinned shell by source text, the way the engine's own harness slices the
   reader out of src/: a copy retyped here would be a second implementation of the engine's
   rule, which this repository forbids and which would in any case agree with itself. The slice
   fails LOUDLY when a declaration moves, which is the reminder that the pin has drifted. */
function shellCounts() {
  const at = path.join(PINNED, "shell", "main.js");
  if (!fs.existsSync(at)) return null;
  const src = fs.readFileSync(at, "utf8");
  const decl = (marker) => {
    const i = src.indexOf(marker);
    if (i < 0) throw new Error("the pinned shell has no " + JSON.stringify(marker)
      + "; the count rules have moved and this slice must follow them");
    if (!marker.startsWith("function")) {
      const nl = src.indexOf("\n", i);
      return src.slice(i, nl);
    }
    let depth = 0, j = src.indexOf("{", i);
    for (let k = j; k < src.length; k++) {
      if (src[k] === "{") depth++;
      else if (src[k] === "}") { depth--; if (!depth) return src.slice(i, k + 1); }
    }
    throw new Error("could not find the end of " + marker);
  };
  const body = [decl("const EC_MARKER ="), decl("function ecBlocks("), decl("function ecCounts(")]
    .join("\n");
  return new Function(body + "\nreturn { ecCounts: ecCounts, ecBlocks: ecBlocks };")();
}

/** The catalog document as the desk reads it: .ec is that JSON on its own, and the sibling
 *  container is the same JSON behind one assignment. */
function readCatalogFile(file) {
  const raw = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "").trim();
  try { return JSON.parse(raw); }
  catch (e) {
    const at = raw.indexOf("E_CATALOG"), eq = at > -1 ? raw.indexOf("=", at) : -1;
    if (eq < 0) throw new Error("not a catalog document and no catalog assignment in " + file);
    return JSON.parse(raw.slice(eq + 1).trim().replace(/;\s*$/, ""));
  }
}

function countsOfFile(file) {
  const S = shellCounts();
  if (!S) throw new Error("no pinned shell at " + path.join(PINNED, "shell", "main.js"));
  const data = readCatalogFile(file);
  const n = S.ecCounts(data);
  return { cards: Array.isArray(data.cards) ? data.cards.length : -1,
           macros: n.macros, intents: n.intents, cats: n.cats };
}

/* ---- the control over the door ------------------------------------------------------------ */

/* A GUARD NOBODY HAS SEEN REFUSE ANYTHING IS A GUARD NOBODY HAS PROVED IS THERE, and the way this
 * gate would quietly return to launching the app itself is a pin slipping back behind the engine's
 * 698eb73. So an unconfined launch - no --user-data-dir at all - is put to the PINNED
 * shellLaunch in a child process, with node as a stand-in shell whose whole job is to write a
 * marker file. Both halves are read, because a guard that refused AFTER spawning would pass on
 * the exit code alone: exit 78, the harness's NO_VERDICT, and no marker on disk.
 */
function guardControl() {
  const { spawnSync } = require("node:child_process");
  const lab = path.join(ROOT, "scratch", "round-trip", "guard");
  clearScratch(lab);
  fs.mkdirSync(lab, { recursive: true });
  const marker = path.join(lab, "spawned.txt");
  const standIn = path.join(lab, "stand-in-shell.js");
  const driver = path.join(lab, "unconfined-launch.js");
  const q = JSON.stringify;   /* a Windows path into a JS literal, backslashes and all */
  fs.writeFileSync(standIn, "require(\"fs\").writeFileSync(process.argv[2], \"spawned\");\n", "utf8");
  fs.writeFileSync(driver,
    "const E = require(" + q(path.join(PINNED, "tests", "engine.js")) + ");\n"
    + "E.shellLaunch(\"round-trip guard control\", process.execPath,\n"
    + "  [" + q(standIn) + ", " + q(marker) + "], { stdio: \"ignore\" });\n"
    + "console.log(\"ALLOWED\");\n", "utf8");
  const r = spawnSync(process.execPath, [driver], { encoding: "utf8" });
  const said = String((r.stdout || "") + (r.stderr || "")).trim().replace(/\s+/g, " ");
  if (fs.existsSync(marker))
    throw new Error("the guard control SPAWNED: the pinned shellLaunch let a launch with no"
      + " --user-data-dir through and " + marker + " was written. " + said);
  if (r.status !== 78)
    throw new Error("the guard control was not refused: the pinned shellLaunch exited "
      + r.status + ", wanted 78. " + said);
  /* THE LOCK, IN THE GUARD'S OWN WORDS. While the engine's reinstall loop holds the desk, every
     launch this file makes is refused, the control's among them, and the refusal names the
     holder. Said here rather than left to the clause below, which would report the stand-off as
     a control that proved nothing; the rule itself is not restated, only its answer read. */
  if (/holds the desk/.test(said))
    throw new Error("another run holds the desk lock, so this gate stands off: " + said);
  if (said.indexOf("--user-data-dir") < 0)
    throw new Error("the guard control was refused for some other reason than the missing"
      + " user-data folder, so it proves nothing about this pin: " + said);
  return "the pinned guard refused a launch with no --user-data-dir, exit 78, nothing spawned";
}

/* ---- the stages -------------------------------------------------------------------------- */

const STAGES = [
  {
    key: "csv",
    what: "the CSV parses and its columns are the ones the importer maps",
    ready: st => fs.existsSync(st.csv) || "no CSV at " + st.csv,
    run: st => {
      st.rows = parseCsv(fs.readFileSync(st.csv, "utf8"));
      const need = ["id", "category", "body_en"];
      const missing = need.filter(k => !(k in (st.rows[0] || {})));
      if (missing.length) throw new Error("the CSV has no column " + missing.join(", "));
      return st.rows.length + " row(s), " + Object.keys(st.rows[0]).length + " column(s)";
    },
  },
  {
    key: "expect",
    what: "the counts the published catalog will be held to, computed from the CSV alone",
    ready: st => !!st.rows || "the CSV stage did not run",
    run: st => {
      st.expected = expected(st.rows);
      if (st.manifest) {
        /* The generator's manifest is a second opinion on the same CSV, and where the two
           disagree the gate says so rather than preferring either. */
        const m = JSON.parse(fs.readFileSync(st.manifest, "utf8"));
        const said = m.counts || {};
        const clash = [];
        if (said.rows != null && said.rows !== st.expected.cards)
          clash.push("cards " + st.expected.cards + " here against rows " + said.rows + " in the manifest");
        if (said.categoriesUsed != null && said.categoriesUsed !== st.expected.cats)
          clash.push("categories " + st.expected.cats + " here against " + said.categoriesUsed + " in the manifest");
        if (clash.length) throw new Error("the CSV and its manifest disagree: " + clash.join("; "));
      }
      return COUNT_KEYS.map(k => k + " " + st.expected[k]).join(", ")
        + (st.manifest ? "; the generator's manifest agrees" : "");
    },
  },
  {
    key: "publish",
    what: "Studio turns the CSV into a draft, lints it and writes one unsigned .ec into the folder",
    /* THE PIECE THAT DOES NOT EXIST. Nothing under src/ here publishes anything yet, which is
       course nodes 6 and 7. The readiness check names the entry point rather than a folder, so
       the day it appears this stage runs without an edit. */
    ready: st => {
      const entry = path.join(ROOT, "src", "publish.mjs");
      if (!fs.existsSync(entry)) return "no publisher at " + entry + " (course nodes 6 and 7)";
      if (!st.folder) return "no --folder given for the publisher to write into";
      return true;
    },
    run: async st => {
      /* THE ONE LINE OF THIS GATE THE LEAD ENGINEER TOUCHED, 2026-09-17. ACCEPTED, same day, by
         the seat that owns this file: `import()` of a bare Windows path throws
         ERR_UNSUPPORTED_ESM_URL_SCHEME on protocol "c:", so the stage could not run at all on
         the desk it was written for, pathToFileURL is the documented way, and nothing about what
         is checked or what counts as a pass moved. The bug was this seat's and the repair is
         kept. */
      const mod = await import(pathToFileURL(path.join(ROOT, "src", "publish.mjs")).href);
      st.ec = await mod.publish({ csv: st.csv, folder: st.folder });
      return "wrote " + st.ec;
    },
  },
  {
    key: "file",
    what: "the .ec is there and the PINNED shell's own rules count it",
    ready: st => {
      if (!st.ec) return "no .ec from the publish stage";
      if (!fs.existsSync(st.ec)) return "the publisher named " + st.ec + " and nothing is there";
      if (!fs.existsSync(path.join(PINNED, "shell", "main.js")))
        return "no pinned shell; run node tools/engine-fetch.mjs";
      return true;
    },
    run: st => {
      st.fromFile = countsOfFile(st.ec);
      const clash = COUNT_KEYS.filter(k => st.fromFile[k] !== st.expected[k]);
      if (clash.length)
        throw new Error("the file disagrees with the CSV on " + clash.map(k =>
          k + " (" + st.expected[k] + " expected, " + st.fromFile[k] + " in the file)").join(", "));
      return COUNT_KEYS.map(k => k + " " + st.fromFile[k]).join(", ") + ", all equal to the CSV's";
    },
  },
  {
    key: "pin",
    what: "a second desk's user-data folder, with eCatalogFolder pinned at the published folder",
    ready: st => {
      const at = path.join(PINNED, "tests", "engine.js");
      if (!fs.existsSync(at)) return "no pinned harness at " + at;
      if (!st.folder) return "no --folder to pin at";
      return true;
    },
    /* The folder through the engine's own pinCatalogFolder, never written in by hand: the shell
       reads the catalog folder BEFORE the user-data folder, so an unpinned launch on a working
       desk counts somebody else's cards as this fixture's. */
    run: st => {
      const E = require(path.join(PINNED, "tests", "engine.js"));
      st.userData = st.userData || path.join(ROOT, "scratch", "round-trip", "desk");
      E.pinCatalogFolder(st.userData, st.folder);
      /* PAST THE FIRST RUN, as the engine's own tests/catalog-watch.js puts its desk: a first
         run's tour holds the catalog offer back until it ends, and this gate is about the offer. */
      const file = path.join(st.userData, "desk.json");
      const doc = JSON.parse(fs.readFileSync(file, "utf8"));
      Object.assign(doc.keys, TOUR_SEEN);
      fs.writeFileSync(file, JSON.stringify(doc), "utf8");
      const back = JSON.parse(fs.readFileSync(file, "utf8"));
      const got = (back.keys || {})[E.CATALOG_FOLDER_KEY];
      if (path.resolve(String(got)) !== path.resolve(st.folder))
        throw new Error("the folder did not pin: desk.json says " + JSON.stringify(got));
      const seen = Object.keys(TOUR_SEEN).filter(k => back.keys[k] === TOUR_SEEN[k]);
      return E.CATALOG_FOLDER_KEY + " read back from desk.json as " + got + ", past the first run ("
        + seen.join(", ") + ")";
    },
  },
  {
    key: "desk",
    what: "the desk launches offscreen, offers the file and loads nothing on its own",
    /* WRITTEN 2026-09-17, against the packaged desk at ../etiuda-dist/win-unpacked/Etiuda.exe.
       The recipe it replaces was recorded here from the engine's tests/shell-smoke.js and is
       followed to the letter: spawn with --remote-debugging-port=<free> and
       --user-data-dir=<the folder the pin stage wrote>, under E.offscreenEnv(), which sets
       ETIUDA_TEST_OFFSCREEN=1 over whatever the ambient environment says; poll
       puppeteer.connect({ browserURL, defaultViewport: null }) for twenty seconds; take the page
       by URL rather than by order; kill by pid in a finally, never by image name.

       WHAT THIS STAGE ASSERTS, and it is two things, not one. The desk OFFERS the published
       file - an offer on screen - and it LOADS NOTHING on its own, which is the "and the halt"
       half of the course's promise and the half a green would otherwise skip: a desk that
       silently applied a catalog a Studio publish dropped into a folder would be a product
       deciding for the person at the desk. Both are read out of the DOM; neither is looked at.
       The counts for the compare stage come from the Library row, which is the desk's own
       arithmetic over the file, and not from the file this gate already parsed. */
    ready: st => {
      const exe = st.deskExe || process.env.ETIUDA_DESK_EXE || null;
      if (exe && !fs.existsSync(exe)) return "no desk executable at " + exe + "; unset ETIUDA_DESK_EXE"
        + " to drive the pinned shell";
      if (!exe && !fs.existsSync(path.join(PINNED, "shell", "main.js")))
        return "no pinned shell; run node tools/engine-fetch.mjs";
      if (!st.userData) return "the pin stage left no user-data folder";
      if (!st.ec) return "the publish stage named no file";
      /* A pin older than the engine's 698eb73 has no guarded launcher, and this stage will not
         fall back to spawning the app itself: that fallback is what 471 was. */
      const E = require(path.join(PINNED, "tests", "engine.js"));
      if (typeof E.shellLaunch !== "function")
        return "the pinned harness has no shellLaunch; the pin is behind the engine's 698eb73"
          + " (bump ENGINE_PIN, run node tools/engine-fetch.mjs)";
      return true;
    },
    run: async st => {
      const E = require(path.join(PINNED, "tests", "engine.js"));
      const puppeteer = require("puppeteer-core");
      const packaged = st.deskExe || process.env.ETIUDA_DESK_EXE || null;
      const { electronExe } = await import("./shell-door.mjs");
      const lab = await deskLab(path.join(path.dirname(st.userData), "desk-lab"));
      const exe = packaged || electronExe();
      const port = await freePort();
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      const said = [];
      st.guard = guardControl();
      /* THE ONE DOOR, AND STUDIO GOES THROUGH IT. On 2026-09-17 two labs on one desk wrote the
         real profile because the rule was written down in five places and enforced in none, and
         this gate was one of the two suspects. A refusal exits 78 before anything is spawned, so
         nothing is owed a kill and an exit of 78 from this gate is the guard speaking rather than
         a stage failing. Nothing in this file calls child_process.spawn at all; the one
         spawnSync is the control's, and it drives node rather than the app. */
      wallOrThrow("Studio round-trip, desk stage");
      const child = E.shellLaunch("Studio round-trip, desk stage", exe,
        (packaged ? [] : [lab.lab])
          .concat(["--remote-debugging-port=" + port, "--user-data-dir=" + st.userData]),
        { stdio: ["ignore", "pipe", "pipe"],
          env: E.offscreenEnv({ ETIUDA_TEST_DOCUMENTS: lab.docs }) });
      /* THE DOOR'S KILL, NOT A THIRD COPY OF IT, board item 629. This was taskkill and nothing
         else, which is a sentence about Windows inside a stage that is already about Windows -
         but it was the third copy of a rule tests/shell-door.mjs exports, and the copies were
         already unequal. Imported here rather than at the top of the file because this module is
         imported by tests/import.mjs for its CSV parser, and a top-level import would pull
         puppeteer-core into a gate that has no window. */
      const { killTree, waitGone, shellDidNotStart } = await import("./shell-door.mjs");
      const kill = () => waitGone(killTree(child.pid));
      child.stdout.on("data", d => said.push(String(d).trim()));
      child.stderr.on("data", d => said.push(String(d).trim()));
      let b = null;
      try {
        for (let i = 0; i < 40 && !b; i++) {
          await sleep(500);
          try { b = await puppeteer.connect({ browserURL: "http://127.0.0.1:" + port, defaultViewport: null }); } catch (x) { /* not up yet */ }
        }
        if (!b) {
          await kill();
          const gone = child.exitCode !== null && child.exitCode !== undefined ? child.exitCode : child.signalCode;
          const why = gone !== null && gone !== undefined
            ? "the shell exited " + gone + ": " + said.filter(Boolean).join(" | ")
            : "the desk did not answer on the debugging port within 20 s: " + said.filter(Boolean).join(" | ");
          shellDidNotStart(why);
        }
        /* BY URL AND NOT BY ORDER. With more than one page open, pages()[0] is an order and not
           a choice; the engine's own page is the one whose URL ends in the engine's file. */
        const pages = await b.pages();
        const page = pages.filter(p => /etiuda\.html$/i.test(p.url()))[0] || pages[0];
        if (!page) throw new Error("the desk opened no page at all");
        await waitLaunchGone(page, { who: "tests/round-trip.mjs desk stage" });
        await sleep(3500);

        const offer = await page.evaluate(() => ({
          offer: !!document.querySelector("#ecYes"),
          asked: (document.querySelector("#ecAsk") || {}).textContent || "",
          cards: document.querySelectorAll("#list .card").length,
          name: (window.pack && window.pack.catalogName) || "",
        }));
        /* THE HALT FIRST, AND THAT ORDERING IS THE POINT. Once a catalog has been accepted the
           desk stops offering it, so with the offer read first the two clauses collapse into
           one and "loads nothing" is never the reason a run is refused - it would be reachable
           only in theory and no control could make it fire. Measured 2026-09-17: a user-data
           folder where the offer had been accepted by hand refuses HERE with 40 cards, and an
           empty catalog folder refuses BELOW with 0. One control each. */
        if (offer.cards !== 0)
          throw new Error("the desk has a catalog loaded and nothing here accepted one: "
            + offer.cards + " card(s) are in the list. Either the desk applied a file on its own,"
            + " which is the halt this stage exists to hold, or the user-data folder carries an"
            + " earlier acceptance and is not the clean desk this gate claims to drive");
        if (!offer.offer)
          throw new Error("no offer on screen for " + path.basename(st.ec) + "; the desk saw "
            + offer.cards + " card(s) and " + said.join(" | "));

        /* The Library, opened the way a person opens it, and its row for the published file.
           The meta line is middot-separated and its counts carry a non-breaking space. */
        const rows = await page.evaluate(async () => {
          const wait = ms => new Promise(r => setTimeout(r, ms));
          /* EACH PRESS WAITS FOR WHAT IT PRESSES, up to ten seconds, rather than a fixed time
             after the press before it (tests/press.mjs says why); the step still names what
             never came. */
          const when = async (find) => {
            const t0 = performance.now();
            for (;;) { const e = find(); if (e || performance.now() - t0 > 10000) return e; await wait(50); }
          };
          const btn = await when(() => document.getElementById("settingsBtn"));
          if (!btn) return { step: "no settings button within 10 s" };
          btn.click(); await wait(400);
          const item = await when(() => document.querySelector('#settingsMenu [data-act="manage"]'));
          if (!item) return { step: "no Library item in the menu within 10 s" };
          item.click(); await wait(1200);
          const fold = await when(() => document.querySelector('#modalCard details.manage-sec[data-mg="data"]'));
          if (!fold) return { step: "no catalog fold within 10 s" };
          if (!fold.open) fold.querySelector("summary").click();
          await wait(1200);
          return { step: "open", rows: Array.from(document.querySelectorAll("#mgCatList .ec-row")).map(r => ({
            name: (r.querySelector(".ec-name b") || {}).textContent || "",
            meta: (r.querySelector(".ec-meta") || {}).textContent || "",
            loaded: r.classList.contains("is-loaded"),
          })) };
        });
        if (rows.step !== "open") throw new Error("the Library did not open: " + rows.step);
        const row = (rows.rows || []).filter(r => r.name === path.basename(st.ec))[0];
        if (!row) throw new Error("no Library row named " + path.basename(st.ec) + ", only "
          + JSON.stringify((rows.rows || []).map(r => r.name)));
        if (row.loaded) throw new Error("the Library marks " + path.basename(st.ec) + " as loaded, and nothing accepted it");
        st.fromRow = metaCounts(row.meta);
        st.deskSaid = { exe: packaged || "the pinned shell " + lab.pin + " in " + lab.lab,
                        row: row.meta };
        const missing = COUNT_KEYS.filter(k => typeof st.fromRow[k] !== "number");
        if (missing.length)
          throw new Error("the row's small print carries no " + missing.join(", ") + ": " + JSON.stringify(row.meta));
        return st.deskSaid.exe + ": offered " + path.basename(st.ec) + " and loaded nothing (" + offer.cards + " cards on screen), row "
          + JSON.stringify(row.meta) + "; " + st.guard;
      } finally {
        try { if (b) b.disconnect(); } catch (x) { /* already gone */ }
        await kill();
        await sleep(600);
      }
    },
  },
  {
    key: "compare",
    what: "the Library row's numbers equal the CSV's, count by count",
    ready: st => st.fromRow ? true : "the desk stage produced no row",
    run: st => {
      const clash = COUNT_KEYS.filter(k => st.fromRow[k] !== st.expected[k]);
      if (clash.length) throw new Error("the row disagrees on " + clash.join(", "));
      return COUNT_KEYS.map(k => k + " " + st.fromRow[k]).join(", ");
    },
  },
];

/* ---- running them ------------------------------------------------------------------------ */

/* The control runs the stages that need no publisher and no desk. The "file" stage is not
   among them: it compares a published catalog with the CSV that produced it, and an .ec handed
   in from elsewhere is not that. --ec in control mode therefore gets its own line below, which
   proves the slice of the pinned shell's counting rules works and claims nothing more. */
const CONTROL_STAGES = ["csv", "expect", "pin"];

/* THE TWO PILES OF THE BARE RUN: the generator's, and the same bytes rewritten with semicolons,
   which is how a spreadsheet on a Polish desk saves it. Seeded, so a red names a reproducible
   file, and written under scratch/ because generated output is never committed. */
function selfPiles() {
  const { spawnSync } = require("node:child_process");
  const home = path.join(ROOT, "scratch", "round-trip", "self");
  clearScratch(home);
  const comma = path.join(home, "comma");
  const r = spawnSync(process.execPath, [path.join(ROOT, "tools", "fixtures", "generate.mjs"),
    "--seed", "40", "--rows", "24", "--out", comma], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) throw new Error("the generator refused: " + (r.stderr || r.stdout));
  const semi = path.join(home, "semicolon");
  fs.mkdirSync(semi, { recursive: true });
  const text = fs.readFileSync(path.join(comma, "macros.csv"), "utf8");
  fs.writeFileSync(path.join(semi, "macros.csv"), withSeparator(text, ";"), "utf8");
  fs.copyFileSync(path.join(comma, "manifest.json"), path.join(semi, "manifest.json"));
  return [comma, semi].map(dir => ({
    label: path.basename(dir), csv: path.join(dir, "macros.csv"),
    manifest: path.join(dir, "manifest.json"), folder: path.join(dir, "folder"),
    userData: path.join(dir, "desk"),
  }));
}

async function runStages(st, stages, label) {
  const at = label ? label + " " : "";
  for (const stage of stages) {
    const ok = stage.ready(st);
    if (ok !== true) {
      process.stderr.write("  HALT at " + at + stage.key + ": " + ok + "\n");
      process.stderr.write("round-trip: not ready. " + stage.what + "\n");
      return 2;
    }
    let said;
    try { said = await stage.run(st); }
    catch (e) {
      process.stderr.write("  FAIL " + at + stage.key + ": " + e.message + "\n");
      return 1;
    }
    process.stdout.write("  ok   " + at + stage.key + ": " + said + "\n");
  }
  return 0;
}

async function main(argv) {
  const arg = (n, d) => { const i = argv.indexOf(n); return i > -1 && argv[i + 1] != null ? argv[i + 1] : d; };
  const control = argv.includes("--control");
  if (!control && arg("--csv", null) == null) {
    const piles = selfPiles();
    process.stdout.write("round-trip: " + STAGES.length + " stage(s) over " + piles.length
      + " generated pile(s): " + piles.map(p => p.label).join(", ") + "\n");
    for (const st of piles) {
      fs.mkdirSync(st.folder, { recursive: true });
      const code = await runStages(st, STAGES, st.label);
      if (code) process.exit(code);
    }
    process.stdout.write("round-trip: " + STAGES.length + " stage(s) passed over "
      + piles.length + " pile(s)\n");
    process.exit(0);
  }
  const st = {
    csv: path.resolve(arg("--csv", "")),
    folder: arg("--folder", null) ? path.resolve(arg("--folder")) : null,
    manifest: arg("--manifest", null) ? path.resolve(arg("--manifest")) : null,
    ec: arg("--ec", null) ? path.resolve(arg("--ec")) : null,
  };
  if (control && !st.folder) st.folder = path.join(ROOT, "scratch", "round-trip", "folder");
  if (control) fs.mkdirSync(st.folder, { recursive: true });

  const stages = control ? STAGES.filter(s => CONTROL_STAGES.includes(s.key)) : STAGES;
  process.stdout.write("round-trip: " + (control ? "CONTROL, " + stages.length
    + " stage(s) that can run with no publisher" : STAGES.length + " stage(s)") + "\n");

  const code = await runStages(st, stages, "");
  if (code) process.exit(code);
  if (control) try {
    process.stdout.write("  ok   guard: " + guardControl() + "\n");
  } catch (e) {
    process.stderr.write("  FAIL guard: " + e.message + "\n");
    process.exit(1);
  }
  if (control && st.ec) try {
    const n = countsOfFile(st.ec);
    process.stdout.write("  ok   counts of " + path.basename(st.ec)
      + " by the pinned shell's own ecCounts: " + COUNT_KEYS.map(k => k + " " + n[k]).join(", ")
      + "\n");
  } catch (e) {
    process.stderr.write("  FAIL counts of " + path.basename(st.ec) + ": " + e.message + "\n");
    process.exit(1);
  }
  process.stdout.write("round-trip: " + stages.length + " stage(s) passed"
    + (control ? "; this is the control and not the gate" : "") + "\n");
  process.exit(0);
}

export { parseCsv, separatorOf, withSeparator, expected, countsOfFile, shellCounts, readCatalogFile, COUNT_KEYS, STAGES,
         guardControl, deskLab };

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]))
  main(process.argv.slice(2));
