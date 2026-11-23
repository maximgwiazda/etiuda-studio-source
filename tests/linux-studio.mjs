/* THE UBUNTU STUDIO, launched: the installed program on a Linux display, asked to spell.
 *
 *     xvfb-run -a -s "-screen 0 1280x900x24" node tests/linux-studio.mjs [<program>]
 *
 * with the window wall's variable set to today's date for that one command, never as root (Chromium
 * refuses its sandbox there), after the .deb is installed; <program> is /opt/Etiuda Studio/etiuda-studio
 * unless named. Not in npm test: it needs the installed package and a display.
 *
 * WHAT IT HOLDS. Studio on Linux checks English and Polish spelling from the dictionaries its package
 * carries and asks nothing of the network for them (shell/main.js, spellingFromPackage). One launch through
 * the door (tests/shell-door.mjs runStudio), its own user-data and projects folders, STUDIO_GATE=spelling,
 * Chromium's net log written into the lab:
 *   1a the program launched, painted and closed by itself, its gate's own verdict ok=1
 *   2a the shell copied the package's two dictionaries into the profile byte for byte, under Chromium's casing
 *   2b a misspelt English word, typed and right-clicked, is reported misspelt with suggestions, the right word among them
 *   2c the same for a misspelt Polish word
 *   2D CONTROL: the same two words spelt right are reported as no misspelling, so 2b and 2c can fail
 *   3a the net log names no http or https address
 *   3b and no dictionary at any address, file:// included, since the package's were where Chromium reads them
 *   4a the installed app.asar carries engine/pinned/.shell-slices.js as this tree's bytes, and the pinned shell
 *      files the packaging config names (the slices Studio reads), not a fixed pair of paths
 *   4b the fresh launch plants nothing in the projects folder
 * The words and the reports are the gate's own lines (studio-spelling), never a customer's text.
 *
 * Exit code is the number of failed checks, or 78 where the run produced no verdict.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { runStudio } from "./shell-door.mjs";
import { windowWall } from "./window-wall.mjs";
import { SHELL_SHIPPED } from "./shell-shipped.mjs";

const WHO = "tests/linux-studio.mjs";
const EXPECTED = 9;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SLICES = "engine/pinned/.shell-slices.js";
const PROGRAM = path.resolve(process.argv[2] || "/opt/Etiuda Studio/etiuda-studio");
const NAMES = ["en-US-10-1.bdic", "pl-PL-3-0.bdic"];

/** One allowlist pattern against one path. `**` is a tree, `*` is one segment, and anything else is exact. */
export function globAdmits(pat, file) {
  const p = String(pat).replace(/\\/g, "/");
  const f = String(file).replace(/\\/g, "/");
  if (p === f) return true;
  if (p.endsWith("/**")) {
    const pfx = p.slice(0, -3);
    return f === pfx || f.startsWith(pfx + "/");
  }
  if (p.endsWith("/*")) {
    const pfx = p.slice(0, -2);
    if (f.startsWith(pfx + "/") && f.slice(pfx.length + 1).indexOf("/") < 0) return true;
  }
  // A star inside a segment matches within that segment, as electron-builder's own glob does
  // (electron-builder.js leaves the policy note out of the asar by such a pattern).
  if (p.indexOf("*") < 0 || p.indexOf("**") >= 0) return false;
  const esc = (seg) => seg.split("*").map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join("[^/]*");
  const re = new RegExp("^" + p.split("/").map(esc).join("/") + "$");
  return re.test(f);
}

/** Whether `files` (electron-builder's allowlist, later negation winning) admits `file`. */
export function filesAdmit(files, file) {
  let on = false;
  for (const pat of files || []) {
    const neg = String(pat).startsWith("!");
    const body = neg ? String(pat).slice(1) : String(pat);
    if (globAdmits(body, file)) on = !neg;
  }
  return on;
}

/** The pinned shell files `files` names under `root`, later negation winning. */
export function shellNamedBy(files, root) {
  const dir = path.join(root, "engine", "pinned", "shell");
  const found = [];
  const walk = (at, rel) => {
    for (const name of fs.readdirSync(at)) {
      const abs = path.join(at, name);
      const next = rel ? rel + "/" + name : name;
      if (fs.statSync(abs).isDirectory()) walk(abs, next);
      else found.push("engine/pinned/shell/" + next);
    }
  };
  if (fs.existsSync(dir)) walk(dir, "");
  return found.filter((file) => filesAdmit(files, file)).sort();
}

/** True when the packaging config names exactly the pinned shell files Studio reads. */
export function pinnedShellHolds(files, root) {
  const named = shellNamedBy(files, root);
  const read = SHELL_SHIPPED.map((s) => s.file).sort();
  if (named.length !== read.length) return false;
  for (let i = 0; i < named.length; i++) if (named[i] !== read[i]) return false;
  return named.length > 0;
}

function invokedAsMain() {
  const arg = process.argv[1];
  if (!arg) return false;
  return path.resolve(arg) === fileURLToPath(import.meta.url);
}

let asserted = 0, failed = 0;
function check(ok, line) {
  asserted++;
  if (ok) console.log("  ok   " + line);
  else { failed++; console.log("  FAIL " + line); }
}
function noVerdict(why) { console.log("  SUITE DID NOT COMPLETE: " + why); process.exit(78); }

function runLinuxStudio() {
if (process.platform !== "linux") noVerdict(WHO + " is the Ubuntu build's, and this is " + process.platform);
if (!fs.existsSync(PROGRAM)) noVerdict(WHO + " needs the installed program: " + PROGRAM + " is not there");
if (!process.env.DISPLAY) noVerdict(WHO + " needs a display; run it under xvfb-run");
if (typeof process.getuid === "function" && process.getuid() === 0) noVerdict(WHO + " runs as root, where Chromium refuses its sandbox");
windowWall(WHO);

const LAB = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-linux-studio-"));
try {
  const ud = path.join(LAB, "user-data"), projects = path.join(LAB, "projects"), net = path.join(LAB, "net.json");
  fs.mkdirSync(projects, { recursive: true });
  const r = runStudio(WHO, { exe: PROGRAM, userDataDir: ud, projects, timeout: 90000, args: ["--log-net-log=" + net],
    env: { STUDIO_GATE: "spelling", STUDIO_TEST_OFFSCREEN: null } });
  const out = String(r.stdout || "");
  const gate = out.split("\n").find(l => l.startsWith("studio-launch ")) || "";
  check(r.status === 0 && / ok=1( |$)/.test(gate), "1a the installed program launched, painted and closed by itself: exit "
    + r.status + ", " + (gate || "no gate line; stderr " + String(r.stderr || "").split("\n").slice(-3).join(" | ")));

  const carried = path.join(path.dirname(PROGRAM), "resources", "dictionaries"), into = path.join(ud, "Dictionaries");
  const same = NAMES.filter(n => { try { return fs.readFileSync(path.join(into, n)).equals(fs.readFileSync(path.join(carried, n))); } catch { return false; } });
  check(same.length === 2, "2a the shell copied the package's two dictionaries into the profile byte for byte: "
    + JSON.stringify(same) + " of " + JSON.stringify(fs.existsSync(into) ? fs.readdirSync(into) : []));

  const said = {};
  for (const l of out.split("\n").filter(x => x.startsWith("studio-spelling "))) {
    const m = /^studio-spelling word=("[^"]*") misspelt=(null|"[^"]*") suggestions=(.*)$/.exec(l);
    if (m) said[JSON.parse(m[1])] = { misspelt: JSON.parse(m[2]), suggestions: JSON.parse(m[3]) };
  }
  const of = w => said[w] || { misspelt: null, suggestions: null };
  check(of("teh").misspelt === "teh" && (of("teh").suggestions || []).indexOf("the") > -1,
    "2b the misspelt English word teh is reported misspelt, with suggestions, the among them: " + JSON.stringify(of("teh")));
  check(of("dzienkujemy").misspelt === "dzienkujemy" && (of("dzienkujemy").suggestions || []).indexOf("dzi\u0119kujemy") > -1,
    "2c the misspelt Polish word dzienkujemy is reported misspelt, with suggestions, dzi\u0119kujemy among them: " + JSON.stringify(of("dzienkujemy")));
  check(of("the").misspelt === "" && of("dzi\u0119kujemy").misspelt === "" && Object.keys(said).length === 4,
    "2D CONTROL: the same words spelt right are reported as no misspelling, so 2b and 2c can fail: "
    + JSON.stringify([of("the"), of("dzi\u0119kujemy")]));

  let log = "";
  try { log = fs.readFileSync(net, "utf8"); } catch { log = ""; }
  const web = [...new Set(log.match(/"url":"https?:[^"]*"/g) || [])];
  check(log.length > 0 && web.length === 0, "3a Studio asks nothing of the web, with spelling in use: " + log.length
    + " byte(s) of net log, " + web.length + " http or https address(es)" + (web.length ? ": " + web.join(", ") : ""));
  const dict = [...new Set(log.match(/"url":"[^"]*\.bdic"/g) || [])];
  check(log.length > 0 && dict.length === 0, "3b and asks for no dictionary at any address, file:// included: " + dict.length
    + (dict.length ? ": " + dict.join(", ") : ""));

  /* The slices are read by the package's own copy, so 4a reads the installed asar, not the .deb's or the tree's. */
  const asar = createRequire(import.meta.url)("@electron/asar"), asarAt = path.join(path.dirname(PROGRAM), "resources", "app.asar");
  const listed = asar.listPackage(asarAt).map(p => p.replace(/\\/g, "/").replace(/^\//, ""));
  let slicesSame = false;
  try { slicesSame = listed.indexOf(SLICES) > -1
    && asar.extractFile(asarAt, SLICES.split("/").join(path.sep)).equals(fs.readFileSync(path.join(ROOT, SLICES))); } catch { slicesSame = false; }
  /* listPackage names folders as well as files (Claude gamma's Ubuntu walk, 2026-11-09: 15 entries against 10 files), so
     only the entries the archive holds as files are compared with the files the config names. */
  const isFileIn = p => { try { const st = asar.statFile(asarAt, p.split("/").join(path.sep)); return !!st && !("files" in st); } catch { return false; } };
  const shellIn = listed.filter(p => p.indexOf("engine/pinned/shell/") === 0).filter(isFileIn).sort();
  /* What the package carries is the set electron-builder.js names, which is the pinned shell Studio reads. */
  const builder = createRequire(import.meta.url)(path.join(ROOT, "electron-builder.js"));
  const named = shellNamedBy(builder.files, ROOT);
  const holds = pinnedShellHolds(builder.files, ROOT);
  check(slicesSame && holds && JSON.stringify(shellIn) === JSON.stringify(named), "4a the installed app.asar carries " + SLICES + " as this tree's bytes"
    + (slicesSame ? "" : " (NOT SO)") + ", and the pinned shell files the packaging config names"
    + (holds ? "" : " (the config does not name what Studio reads)") + ": " + JSON.stringify(shellIn));
  /* No catalog is planted on a fresh launch (build A: the sample catalog is opened as a file, not planted). */
  const planted = fs.readdirSync(projects);
  check(planted.length === 0, "4b a fresh launch plants no project into the projects folder: "
    + JSON.stringify(planted));
} catch (e) {
  failed++;
  console.log("  FAIL " + String((e && e.stack) || e).split("\n").slice(0, 3).join(" | "));
} finally {
  fs.rmSync(LAB, { recursive: true, force: true });
}

console.log("#counts checks=" + asserted + " failed=" + failed + " expected=" + EXPECTED);
if (asserted < EXPECTED) noVerdict(asserted + " of " + EXPECTED + " checks ran");
console.log(failed ? "  RESULT: FAIL " + failed + " of " + asserted : "  RESULT: ok " + asserted + " check(s)");
process.exit(Math.min(failed, 63));
}

if (invokedAsMain()) runLinuxStudio();
