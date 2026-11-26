/* Studio's install plan, held at node level: every argument vector, every key and path, and every
 * clause of every verdict in tests/install-plan.mjs, each against a planted flaw.
 *
 *   node tests/install-plan-selftest.mjs
 *
 * WHAT IT PROVES AND WHAT IT CANNOT. It proves that the update and all-users legs pass the
 * installer what NSIS reads as meant, look where electron-builder writes, and judge the facts they
 * collect so that each broken fact reddens its own row and nothing else. It cannot prove that the
 * facts tests/update-install.mjs collects on a real desk are the true ones: that needs an
 * installer, a machine window, and for the all-users leg an elevated shell.
 *
 * THE METHOD FOR THE VERDICTS, the engine's: one set of good facts green in every row, one mutant
 * per clause reddening exactly its own row, and a judge fed nothing reddening every row.
 *
 * Exit code is the number of failed checks, capped at 63. */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import * as P from "./install-plan.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const require = createRequire(import.meta.url);
let checks = 0, fails = 0;
const notRun = [];
const ok = (cond, what) => { checks++; console.log((cond ? "  ok   " : "  FAIL ") + what); if (!cond) fails++; };
const skip = (id, why) => { notRun.push(id + ", " + why); console.log("  NOT RUN " + id + ": " + why); };

/* ---- 1. the GUID ------------------------------------------------------------------------------ */

const DNS_NS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
ok(P.uuidV5("www.example.com", DNS_NS) === "2ed6657d-e927-568b-95e1-2665a8aea6a2",
  "1a uuidV5 gives the published v5 answer for www.example.com in the DNS namespace");
let U = null;
try { U = require(require.resolve("builder-util-runtime", { paths: [ROOT] })).UUID; } catch (e) { U = null; }
if (U) {
  /* As NsisTarget.js calls it, the namespace PARSED to bytes; given the string it answers another
     GUID, which is how the engine's copy of this leg first went red on 2026-09-28. */
  const theirs = U.v5("app.etiuda.studio", U.parse(P.BUILDER_NS));
  ok(theirs === P.appGuid("app.etiuda.studio"),
    "1b Studio's registry GUID is electron-builder's own: " + P.appGuid("app.etiuda.studio") + " against " + theirs);
} else skip("1b", "builder-util-runtime is not installed");
let nsTarget = "";
try {
  const f = path.join(path.dirname(require.resolve("app-builder-lib/package.json", { paths: [ROOT] })),
                      "out", "targets", "nsis", "NsisTarget.js");
  nsTarget = (/ELECTRON_BUILDER_NS_UUID\s*=\s*[\w.]*UUID\.parse\("([0-9a-f-]{36})"\)/.exec(fs.readFileSync(f, "utf8")) || [])[1] || "none found";
} catch (e) { nsTarget = ""; }
if (nsTarget) ok(nsTarget === P.BUILDER_NS, "1d electron-builder's NsisTarget.js parses the namespace " + nsTarget + ", the plan's own");
else skip("1d", "app-builder-lib is not installed");
const appId = (/appId:\s*"([^"]+)"/.exec(fs.readFileSync(path.join(ROOT, "electron-builder.js"), "utf8")) || [])[1];
ok(appId === "app.etiuda.studio" && P.appGuid(appId) !== P.appGuid("app.etiuda.desktop"),
  "1c Studio's appId is read as " + JSON.stringify(appId) + " and its GUID is not the desk's, so the two"
  + " products' installers never update or uninstall each other");

/* THE HELPERS ARE THE ENGINE'S TEXT, held to the pin's tests/install-plan.js. Read as a blob out of
   the engine repository at the pin, the way tests/shipped-sample.mjs reads the sample, and NOT
   fetched into engine/pinned: everything there ships inside Studio's installer, and a test file has
   no business in a customer's app.asar (board 858, H1). Until 2026-10-07 this leg looked in
   engine/pinned, where nothing fetches the file, and printed NOT RUN on every run for want of a
   copy the pin had carried since f839ca2. A missing engine repository or file is a FAIL, never a
   NOT RUN: the leg means the pin's text and must not quietly read nothing. 1f holds the shipping
   half: the file is not in engine/pinned. */
{
  const span = t => { const a = t.indexOf("/* electron-builder's namespace"), b = t.indexOf("/** The newer setup run over the older copy");
    return a < 0 || b < 0 ? null : t.slice(a, b).replace(/^export /gm, "").replace(/\r\n/g, "\n"); };
  const ours = span(fs.readFileSync(path.join(HERE, "install-plan.mjs"), "utf8"));
  let theirs = null, why = "";
  try {
    const F = await import("../tools/engine-fetch.mjs");
    const { pin } = F.readPin(path.join(ROOT, "tools", "engine-pin"));
    const repo = F.engineRepo();
    const sha = F.gitText(repo.dir, ["rev-parse", "--verify", "--quiet", pin + ":tests/install-plan.js"]).out.trim();
    if (/^[0-9a-f]{40}$/.test(sha)) theirs = span(F.blob(repo.dir, sha).toString("utf8"));
    else why = "the pin " + pin.slice(0, 7) + " has no tests/install-plan.js in " + repo.dir;
  } catch (e) { why = String((e && e.message) || e); }
  ok(!!ours && !!theirs && ours === theirs, "1e the helpers above the verdicts are the pin's tests/install-plan.js, text for text ("
    + (ours ? ours.length : 0) + " chars here, " + (theirs ? theirs.length : 0) + " in the pin's blob)" + (why ? ": " + why : ""));
  ok(!fs.existsSync(path.join(ROOT, "engine", "pinned", "tests", "install-plan.js")),
    "1f the plan's engine copy is read from the repository and not fetched into engine/pinned, which ships");
}

/* ---- 2. the argument vectors ------------------------------------------------------------------ */

const DIR = "C:\\Users\\lab\\etiuda-studio-update-x\\app";
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
ok(eq(P.installArgs({ mode: "user", dir: DIR }), ["/S", "/currentuser", "/D=" + DIR])
   && eq(P.installArgs({ mode: "machine", dir: DIR }), ["/S", "/allusers", "/D=" + DIR])
   && eq(P.installArgs({ mode: "user" }), ["/S", "/currentuser"])
   && eq(P.uninstallArgs("machine"), ["/S", "/allusers"]) && eq(P.plainArgs(DIR), ["/S", "/D=" + DIR]),
  "2a the vectors: per user and all users with /D last, the update with no /D, the uninstallers by context,"
  + " and A10's plain vector with none");
for (const [what, o, re] of [["a space", { mode: "user", dir: "C:\\Program Files\\Etiuda Studio" }, /space/],
                             ["a quote", { mode: "user", dir: "C:\\lab\\\"x" }, /quote/],
                             ["a relative path", { mode: "user", dir: "lab\\app" }, /absolute/]]) {
  let said = "";
  try { P.installArgs(o); said = "ACCEPTED"; } catch (e) { said = e.message; }
  ok(re.test(said), "2c installArgs refuses " + what + ": " + said);
}
for (const [what, a, m, re] of [["/D not last", ["/S", "/D=" + DIR, "/currentuser"], "user", /only last/],
                                ["no /S", ["/currentuser"], "user", /not silent/],
                                ["the other context", ["/S", "/currentuser"], "machine", /alone was meant/],
                                ["no context flag", P.plainArgs(DIR), "machine", /alone was meant/]])
  ok(re.test(P.argsFault(a, m)), "2e argsFault catches " + what + ": " + P.argsFault(a, m));
ok(P.argsFault(P.installArgs({ mode: "machine", dir: DIR }), "machine") === "", "2d and passes the plan's own all-users vector");

/* ---- 3. the keys and the folders ---------------------------------------------------------------- */

const G = P.appGuid("app.etiuda.studio");
const km = P.registryKeys("machine", G);
ok(km.uninstall === "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\" + G && km.install === "HKLM:\\Software\\" + G
   && P.registryKeys("user", G).install === "HKCU:\\Software\\" + G, "3a the keys: " + km.uninstall + " and its HKCU twin");
const H = P.scratchHome("C:\\lab\\etiuda-studio-update-x");
ok(Object.values(H.places).concat([H.documents]).every(p => p.toLowerCase().indexOf(H.HOME.toLowerCase() + "\\") === 0)
   && H.env.APPDATA === H.places.ApplicationData, "3b the scratch home's places are all under " + H.HOME);
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
ok(P.userDataName(pkg) === "etiuda-studio", "3c Studio's user-data folder is named " + JSON.stringify(P.userDataName(pkg))
  + " by Electron's rule, the tree's package.json having no productName");
ok(P.defaultUserInstallDir(H.places.LocalApplicationData, "Etiuda Studio").endsWith("\\Programs\\Etiuda Studio"),
  "3d the default per-user folder: " + P.defaultUserInstallDir(H.places.LocalApplicationData, "Etiuda Studio"));

/* ---- 4. the verdicts, each clause against its own planted flaw ------------------------------- */

function holdJudge(name, judge, facts, mutants) {
  const bad = judge(facts).filter(r => !r.ok);
  ok(bad.length === 0, "4 " + name + ": the good facts are green in all " + judge(facts).length + " rows"
    + (bad.length ? "; RED: " + bad.map(r => r.id + " " + r.what).join(" | ") : ""));
  const empty = judge({}).filter(r => r.ok);
  ok(empty.length === 0, "4 " + name + ": fed no facts, every row is red (" + empty.length + " green: " + empty.map(r => r.id).join(", ") + ")");
  const ids = new Set();
  for (const [what, patch, want] of mutants) {
    const f = JSON.parse(JSON.stringify(facts));
    patch(f);
    const red = judge(f).filter(r => !r.ok).map(r => r.id);
    ids.add(want);
    ok(red.length === 1 && red[0] === want, "4 " + name + " mutant, " + what + ": reddens " + JSON.stringify(red) + ", want [\"" + want + "\"]");
  }
  const uncovered = judge(facts).map(r => r.id).filter(id => !ids.has(id));
  ok(uncovered.length === 0, "4 " + name + ": every row has a mutant of its own" + (uncovered.length ? "; NONE FOR " + uncovered.join(", ") : ""));
}

const APP = "C:\\lab\\app", EXE = APP + "\\Etiuda Studio.exe";
holdJudge("judgeUpdate", P.judgeUpdate, {
  setupExit: 0, dir: APP, exe: EXE, exeThere: true, installLocation: APP,
  defaultDir: "C:\\lab\\home\\AppData\\Local\\Programs\\Etiuda Studio", defaultDirExists: false,
  programOld: "a".repeat(64), programNew: "b".repeat(64), programTree: "b".repeat(64), oldOnlyGone: true, besideClear: true,
  appKeys: 1, keyName: G, keyBefore: G, version: "0.1.1", wantVersion: "0.1.1",
  uninstallString: "\"" + APP + "\\Uninstall Etiuda Studio.exe\" /currentuser", nameOld: "etiuda-studio", nameNew: "etiuda-studio",
  shortcuts: { desktop: { count: 1, target: EXE, hotkey: "Ctrl+Alt+S" }, startMenu: { count: 1, target: EXE } }, hotkeyWant: "Ctrl+Alt+S",
  storeBefore: "d".repeat(64), storeAfter: "d".repeat(64),
  projectsBefore: { "retail\\project.json": "e".repeat(64) }, projectsAfter: { "retail\\project.json": "e".repeat(64) },
  cacheExists: false,
}, [
  ["the setup exited 199", f => { f.setupExit = 199; }, "U1"],
  ["a second copy in the default folder", f => { f.defaultDirExists = true; }, "U2"],
  ["the key names another folder", f => { f.installLocation = "C:\\elsewhere"; }, "U2"],
  ["the older ui still there", f => { f.programNew = f.programOld; }, "U3"],
  ["the older copy is this tree's program", f => { f.programOld = f.programTree; }, "U3"],
  ["the old copy's own file survived", f => { f.oldOnlyGone = false; }, "U4"],
  ["the staging folder left beside the install", f => { f.besideClear = false; }, "U4"],
  ["two uninstall keys", f => { f.appKeys = 2; }, "U5"],
  ["the older version on the key", f => { f.version = "0.1.0"; }, "U5"],
  ["the newer build renamed, its store elsewhere", f => { f.nameNew = "Etiuda Studio"; }, "U5b"],
  ["a Start Menu shortcut to another folder", f => { f.shortcuts.startMenu.target = "C:\\old\\Etiuda Studio.exe"; }, "U6"],
  ["the person's hotkey lost", f => { f.shortcuts.desktop.hotkey = ""; }, "U6b"],
  ["the store rewritten", f => { f.storeAfter = "f".repeat(64); }, "U8"],
  ["a project file changed", f => { f.projectsAfter["retail\\project.json"] = "0".repeat(64); }, "U8b"],
  ["the cached setup left", f => { f.cacheExists = true; }, "U9"],
]);
holdJudge("judgeUpdatedRun", P.judgeUpdatedRun, {
  ok: true, rows: 3, wantRows: 3, keysBefore: { root: "C:\\lab\\home\\Work\\projects", theme: "dark", trialFrom: "2026-09-29" },
  keysAfter: { root: "C:\\lab\\home\\Work\\projects", theme: "dark", trialFrom: "2026-09-29" },
  controlOk: true, controlRows: 0, controlNone: true,
}, [
  ["the chosen folder forgotten, the default listed", f => { f.rows = 0; }, "U10"],
  ["the probe did not paint", f => { f.ok = false; }, "U10"],
  ["the trial restarted", f => { f.keysAfter.trialFrom = "2026-10-01"; }, "U10c"],
  ["the theme lost", f => { delete f.keysAfter.theme; }, "U10c"],
  ["the control still lists projects", f => { f.controlRows = 3; f.controlNone = false; }, "U11"],
]);
const PM = "C:\\lab\\pm";
holdJudge("judgeAllUsers", P.judgeAllUsers, {
  setupExit: 0, exeThere: true, dir: PM, machineKeys: 1, machineLocation: PM,
  uninstallString: "\"" + PM + "\\Uninstall Etiuda Studio.exe\" /allusers", userKeysAdded: 0, machineInstallKey: PM,
  commonDesktop: 1, commonPrograms: 1, userDesktop: 0, userPrograms: 0, userCacheExists: false, machineCacheExists: false,
  ok: true, storeInHome: true, goneSeconds: 5, exeAfter: false, machineKeysAfter: 0, machineInstallKeyAfter: "",
  commonDesktopAfter: 0, commonProgramsAfter: 0, storeKept: true, perUserExit: 0, perUserKeys: 1, perUserMachineKeys: 0,
}, [
  ["the elevated install exited 2", f => { f.setupExit = 2; }, "A1"],
  ["the key under HKCU instead", f => { f.machineKeys = 0; f.userKeysAdded = 1; }, "A2"],
  ["the install key names nothing", f => { f.machineInstallKey = ""; }, "A3"],
  ["the shortcut in the user's own Start Menu", f => { f.commonPrograms = 0; f.userPrograms = 1; }, "A4"],
  ["the user's cached setup left", f => { f.userCacheExists = true; }, "A6"],
  ["the store under the install folder", f => { f.storeInHome = false; }, "A7"],
  ["the HKLM install key left behind", f => { f.machineInstallKeyAfter = PM; }, "A8"],
  ["the user's store removed", f => { f.storeKept = false; }, "A9"],
  ["the plain install went per machine", f => { f.perUserKeys = 0; f.perUserMachineKeys = 1; }, "A10"],
]);

/* ---- 5. the gate uses the judges it is held to ------------------------------------------------ */

const strip = t => t.replace(/\/\*[\s\S]*?\*\//g, "").split(/\r?\n/).map(l => l.replace(/(^|\s)\/\/.*$/, "")).join("\n");
const gateSrc = strip(fs.readFileSync(path.join(HERE, "update-install.mjs"), "utf8"));
const calls = ["judgeUpdate", "judgeUpdatedRun", "judgeAllUsers", "argsFault", "installArgs", "uninstallArgs", "plainArgs"]
  .map(n => [n, (gateSrc.match(new RegExp("\\bP\\." + n + "\\(", "g")) || []).length]);
ok(calls.every(([, n]) => n > 0), "5a tests/update-install.mjs calls every judge and vector builder, by regex for `P.<name>(`"
  + " over its code with comments dropped: " + calls.map(([k, n]) => k + " " + n).join(", "));
ok(!/\bP\.judge/.test(strip("/* P.judgeUpdate( */ // P.judgeAllUsers(\n1")), "5b control: a call kept only in comments is not counted");

/* ---- 6. the version comparison and the three outcomes, the desk's cases ----------------------- */
/* These hold the JavaScript twin, compareSemver here as in the engine's tests/install-plan.js. The installer's own
   CompareSemver in packaging/installer-pages.nsh is held only by reading: no leg runs NSIS. */

for (const [a, b, want, what] of [
  ["2.0.0-dev", "2.0.0", -1, "2.0.0-dev is older than 2.0.0"],
  ["2.0.0", "2.0.0", 0, "equal strings are the same"],
  ["2.0.1", "2.0.0", 1, "2.0.1 is newer than 2.0.0"],
  ["1.9.9", "2.0.0", -1, "1.9.9 is older than 2.0.0"],
  ["2.0.0-dev", "2.0.0-rc.1", -1, "dev is older than rc.1"],
  ["2.0.0-beta.2", "2.0.0-beta.11", -1, "beta.2 is older than beta.11"],
  ["2.0.0-alpha", "2.0.0-alpha.1", -1, "fewer pre-release fields is older"],
  ["2.0.0+build1", "2.0.0+build2", 0, "build metadata is ignored"],
  ["invalid", "2.0.0", null, "an unparseable version answers null"],
  ["", "2.0.0", null, "an empty version answers null"],
]) {
  let got; try { got = P.compareSemver(a, b); } catch (e) { got = "THREW"; }
  ok(got === want, "6a semver: " + what + " (" + a + " against " + b + ": " + got + ")");
}
for (const [inst, cur, outcome, action] of [["1.9.0", "2.0.0", "older", "Update"], ["2.0.0", "2.0.0", "same", "Reinstall"],
  ["2.1.0", "2.0.0", "newer", "Reinstall"], ["", "2.0.0", "unreadable", "Reinstall"], [null, "2.0.0", "unreadable", "Reinstall"]]) {
  const o = P.recogniseOutcome(inst, cur);
  ok(o === outcome && P.recogniseAction(o) === action, "6b installed " + JSON.stringify(inst) + " against " + cur + ": " + o + ", " + P.recogniseAction(o));
}

/* ---- 7. Studio's installer recognises an existing installation as the desk's does -------------- */
/* Read from packaging/installer-pages.nsh and the pinned hooks it includes; NSIS itself is held only by reading. */
{
  const NSH = fs.readFileSync(path.join(ROOT, "packaging", "installer-pages.nsh"), "utf8");
  const CUT_AT = path.join(ROOT, "engine", "pinned", ".installer-hooks.nsh");
  if (!fs.existsSync(CUT_AT)) skip("7", "engine/pinned/.installer-hooks.nsh is not fetched (node tools/engine-fetch.mjs)");
  else {
    const CUT = fs.readFileSync(CUT_AT, "utf8");
    const R = P.readStudioRecognition(NSH, CUT);
    ok(R.inserted && R.outerOnly && R.beforeFiles, "7a customInit calls the recognition in the outer copy of an interactive install"
      + " (not under /S, not in the elevated copy), before any file is written");
    ok(R.outcomes && R.cancelQuits, "7b it asks with the four texts (older, same, newer, unreadable) and Cancel quits before anything changes");
    ok(!P.readStudioRecognition(NSH.replace(/(\$\{IfNot\} \$\{Silent\}\r?\n)(\s*\$\{IfNot\} \$\{UAC_IsInnerInstance\})/, "$2"), CUT).outerOnly,
      "7a control: the call outside the /S test reads red");
    ok(R.toFront, "7c the elevated copy is brought to the front before its first two pages are passed");
    ok(R.compare === 1 && R.recognise === 1 && R.stale === 1, "7d each of CompareSemver, RecogniseExistingInstallation and"
      + " un.RemoveStaleLinks reaches makensis once, Studio's copy or the pin's: " + [R.compare, R.recognise, R.stale].join(", "));
    ok(R.sameAsPin, "7e where the pinned hooks carry the three functions, Studio's copy is the desk's byte for byte");
    const fnText = name => (new RegExp("^[ \\t]*Function " + name + "\\b[^\\n]*\\n[\\s\\S]*?^[ \\t]*FunctionEnd", "m").exec(NSH) || [""])[0];
    const pinned = (guarded) => CUT + "\n!macro customLater\n" + (guarded ? "  !ifndef INSTALL_CHECKS_OWN_COPY\n" : "")
      + fnText("CompareSemver") + "\n" + (guarded ? "  !endif\n" : "") + "!macroend\n";
    ok(P.readStudioRecognition(NSH, pinned(true)).compare === 1, "7d control: a pin carrying the function under the define emits it once");
    ok(P.readStudioRecognition(NSH, pinned(false)).compare === 2, "7d control: a pin carrying it with no define reads two");
    /* More than one, not exactly two: from fc5b2aab the pin carries its own guarded copy too, so with the define dropped
       Studio's copy, the pin's and the planted one would all reach makensis (three). */
    ok(P.readStudioRecognition(NSH.replace(/^!define INSTALL_CHECKS_OWN_COPY\r?$/m, ""), pinned(true)).compare > 1,
      "7d control: Studio's define dropped while its copy stays reads more than one");
    ok(!P.readStudioRecognition(NSH, pinned(true).replace(/(Function CompareSemver\r?\n)/, "$1    Nop\n")).sameAsPin,
      "7e control: the pin's copy one line different reads red");
    const words = [["RecogniseOlderText", "is installed on this computer, and this installer holds", "a ten instalator zawiera nowszą wersję"],
      ["RecogniseSameText", "is already installed on this computer, the same version as this installer", "tej samej co w instalatorze"],
      ["RecogniseNewerText", "is installed on this computer, which is newer than this installer's", "nowszej niż wersja"],
      ["RecogniseUnreadableText", "is already installed on this computer, but its version cannot be read", "ale nie da się odczytać jego wersji"],
      ["etiudaSetupNotFinished", "did not finish. Running the installer again may help", "nie została ukończona. Pomóc może"]];
    const lines = NSH.split(/\r?\n/).filter(l => /^\s*LangString\s/.test(l));
    ok(words.every(([k, en, pl]) => lines.some(l => l.includes("LangString " + k + " ") && l.includes(en) && l.includes("${PRODUCT_NAME}"))
      && lines.some(l => l.includes("LangString " + k + " ") && l.includes(pl) && l.includes("${PRODUCT_NAME}"))),
      "7f the copywriter's words for both installers, English and Polish, with the product's own name for the app: "
      + words.map(([k]) => k).join(", "));
  }
}

/* ---- 8. where the install is registered, and where its shortcuts go, in both modes ------------ */
/* The engine's tests/install-plan-selftest.js 10, over app-builder-lib's templates as installed here and Studio's script
   with the pinned hooks it includes. NSIS itself is held only by reading. */
{
  const T = P.nsisTemplates(ROOT);
  const CUT_AT = path.join(ROOT, "engine", "pinned", ".installer-hooks.nsh");
  const NSH = fs.readFileSync(path.join(ROOT, "packaging", "installer-pages.nsh"), "utf8")
    + "\n" + (fs.existsSync(CUT_AT) ? fs.readFileSync(CUT_AT, "utf8") : "");
  const CALLER = { kind: "Section", name: "un.StaleLinks" };
  const S = P.readInstallScopes(T, NSH, CALLER);
  ok(Object.values(T).every(s => s.length > 0), "8a the six templates are read from app-builder-lib as installed: "
    + Object.entries(T).map(([k, v]) => k + " " + v.length).join(", "));
  ok(S.writes && S.modes && S.order && S.unDeletes, "8b the uninstall key is written to SHELL_CONTEXT (HKCU per user, HKLM for"
    + " all users) after the files and before the shortcuts, and the uninstaller deletes it from the same context");
  ok(S.view && S.readsBoth, "8c the recognition reads DisplayVersion under that key in HKLM and HKCU, in the view the write uses");
  ok(S.unpaired.length === 0, "8d every block of Studio's script and the pinned hooks that changes the shell context changes it back: "
    + (S.unpaired.join(", ") || "none unpaired"));
  ok(P.readInstallScopes(T, NSH + "\n!ifdef BUILD_UNINSTALLER\nSection \"un.X\"\n  SetShellVarContext current\nSectionEnd\n!endif\n", CALLER).unpaired.length === 1,
    "8d control: a section that sets the current user's context and leaves it reads red");
  ok(S.linksFromContext && S.bothAfterMode, "8e install and uninstall build the shortcuts from $SMPROGRAMS and $DESKTOP after the mode has set the context");
  ok(S.staleBoth && S.staleCalled, "8f the uninstaller also removes a shortcut of the same name in the other scope when no"
    + " installation is registered there, puts the context back, and leaves it under --keep-shortcuts");
  ok(!P.readInstallScopes(T, NSH.replace(/(ReadRegStr \$0 HKLM "\$\{INSTALL_REGISTRY_KEY\}" InstallLocation\s*\r?\n\s*)\$\{If\} \$0 == ""/, "$1${If} 1 == 1"), CALLER).staleBoth,
    "8f control: the all-users shortcut removed even while an all-users copy is registered reads red");
  ok(!P.readInstallScopes(T, NSH.replace(/\s*Call un\.RemoveStaleLinks/, ""), CALLER).staleCalled,
    "8f control: the removal never called reads red");
}

/* ---- 9. the template patches, applied to copies --------------------------------------------- */
{
  const patch = require(path.join(ROOT, "tools", "patch-nsis.cjs"));
  const os = require("node:os");
  const lab = fs.mkdtempSync(path.join(os.tmpdir(), "studio-nsis-patch-"));
  let status = {}, twice = false;
  try {
    const from = patch.getPaths(ROOT), to = patch.getPaths(lab);
    fs.mkdirSync(path.dirname(to.multiUserUi), { recursive: true });
    fs.copyFileSync(from.multiUserUi, to.multiUserUi);
    fs.copyFileSync(from.installSection, to.installSection);
    status = patch.applyNsisPatches(lab);
    const once = fs.readFileSync(to.multiUserUi, "utf8") + fs.readFileSync(to.installSection, "utf8");
    patch.applyNsisPatches(lab);
    twice = once === fs.readFileSync(to.multiUserUi, "utf8") + fs.readFileSync(to.installSection, "utf8");
  } catch (e) { status = { error: e.message }; }
  fs.rmSync(lab, { recursive: true, force: true });
  ok(status.multiUserUiPatched === true, "9a the outer copy reads the elevated child's exit code and says the installation did not finish");
  ok(status.installSectionPatched === true, "9b the elevated copy closes a running Studio before it copies files");
  ok(twice, "9c the patch applied a second time changes nothing");
  const pkg = fs.readFileSync(path.join(ROOT, "tools", "package.mjs"), "utf8"), eb = fs.readFileSync(path.join(ROOT, "electron-builder.js"), "utf8");
  ok(/applyNsisPatches\(ROOT\)[\s\S]{0,120}verifyNsisPatches\(ROOT\)[\s\S]{0,80}if \(!nsisStatus\.applied\)/.test(pkg)
    && /beforePack:[\s\S]{0,200}applyNsisPatches\(\)[\s\S]{0,80}verifyNsisPatches\(\)/.test(eb),
    "9d npm run package and electron-builder's beforePack both apply the patches and refuse to build when they read back missing");
  /* The patched leave function is compiled into the uninstaller as well. A definition under
     !ifndef BUILD_UNINSTALLER is then missing there, and makensis refuses the uninstaller. */
  const uninstallerLangCount = (text, name) => {
    const stack = [], re = new RegExp("^LangString\\s+" + name + "\\b");
    let visible = 0;
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim();
      if (/^!ifndef\s+BUILD_UNINSTALLER\b/.test(t)) { stack.push(true); continue; }
      if (/^!if(?:def|ndef|macrodef)?\b/.test(t)) { stack.push(false); continue; }
      if (/^!endif\b/.test(t)) { stack.pop(); continue; }
      if (stack.indexOf(true) > -1) continue;
      if (re.test(t)) visible++;
    }
    return visible;
  };
  const pages = fs.readFileSync(path.join(ROOT, "packaging", "installer-pages.nsh"), "utf8");
  ok(uninstallerLangCount(pages, "etiudaSetupNotFinished") === 2,
    "9e the did-not-finish string is defined for the uninstaller compile too, not only the installer's: "
    + uninstallerLangCount(pages, "etiudaSetupNotFinished"));
  ok(uninstallerLangCount(pages.replace(/LangString etiudaSetupNotFinished/g, "!ifndef BUILD_UNINSTALLER\nLangString etiudaSetupNotFinished"), "etiudaSetupNotFinished") === 0,
    "9e control: the same string put back under !ifndef BUILD_UNINSTALLER reads none");
}
/* ---- 6. Remove my data puts the all-users shell context back -------------------------------- */

const nsh = fs.readFileSync(path.join(ROOT, "packaging", "installer-pages.nsh"), "utf8");
const contextFault = P.uninstallContextFault(nsh);
ok(contextFault === "", "6a the uninstaller puts SetShellVarContext all back after Remove my data on the all-users path"
  + (contextFault ? ": " + contextFault : ""));
const contextCut = nsh.replace(/SetShellVarContext\s+all/g, "SetShellVarContext current");
ok(P.uninstallContextFault(contextCut) !== "", "6b a script that never switches back to all is refused: "
  + P.uninstallContextFault(contextCut));

/* ---- 11. every message box answers a silent run --------------------------------------------- */
/* NSIS shows a MessageBox that has no /SD even under /S, so one such box hangs a silent push nobody watches. This scan is
   its own, not the patch tool's: the whole template folder as the tool leaves it (on a copy) every .nsh under
   packaging/, and the pinned hooks installer-pages.nsh includes.
   A box this leg should pass unanswered goes in EXEMPT as "file:line why"; none does. */
{
  const osx = require("node:os");
  const EXEMPT = [];
  const ANSWER = /\/SD\s+ID(?:OK|CANCEL|ABORT|RETRY|IGNORE|YES|NO)\b/i;
  const boxes = (text, name) => {
    const out = { total: 0, open: [] };
    const lines = String(text).split(/\r?\n/);
    let inBlock = false;
    for (let i = 0; i < lines.length; i++) {
      const at = i + 1;
      let line = lines[i];
      while (/\\\s*$/.test(line) && i + 1 < lines.length) line = line.replace(/\\\s*$/, " ") + lines[++i];
      let t = line.trim();
      if (inBlock) { const e = t.indexOf("*/"); if (e < 0) continue; inBlock = false; t = t.slice(e + 2).trim(); }
      if (t.startsWith("/*")) { const e = t.indexOf("*/", 2); if (e < 0) { inBlock = true; continue; } t = t.slice(e + 2).trim(); }
      if (/^[;#]/.test(t) || !/\bmessagebox\b/i.test(t)) continue;
      out.total++;
      if (!ANSWER.test(t) && !EXEMPT.some(x => x.split(" ")[0] === name + ":" + at)) out.open.push(name + ":" + at);
    }
    return out;
  };
  const walk = (dir, base) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => d.isDirectory()
    ? walk(path.join(dir, d.name), base) : /\.(nsh|nsi)$/i.test(d.name) ? [path.relative(base, path.join(dir, d.name)).replace(/\\/g, "/")] : []);
  const sweep = (dir, files) => files.reduce((acc, f) => {
    const r = boxes(fs.readFileSync(path.join(dir, f), "utf8"), f);
    acc.total += r.total; acc.open.push(...r.open); return acc;
  }, { total: 0, open: [] });

  const patchTool = require(path.join(ROOT, "tools", "patch-nsis.cjs"));
  const from = path.dirname(patchTool.getPaths(ROOT).multiUserUi);
  const lab = fs.mkdtempSync(path.join(osx.tmpdir(), "studio-nsis-silent-"));
  const to = path.dirname(patchTool.getPaths(lab).multiUserUi);
  let status = {}, files = [], after = { total: 0, open: ["not read"] }, twice = false, text = {};
  try {
    fs.cpSync(from, to, { recursive: true });
    status = patchTool.applyNsisPatches(lab);
    files = walk(to, to);
    for (const f of files) text[f] = fs.readFileSync(path.join(to, f), "utf8");
    after = sweep(to, files);
    patchTool.applyNsisPatches(lab);
    twice = files.every(f => fs.readFileSync(path.join(to, f), "utf8") === text[f]);
  } catch (e) { status = { error: e.message }; }

  ok(files.length >= 10 && after.total >= 10 && after.open.length === 0,
    "11a every MessageBox in the patched templates carries a silent default: " + files.length + " files, " + after.total
    + " boxes, unanswered " + (after.open.join(", ") || "none"));
  const HOOKS = "engine/pinned/.installer-hooks.nsh";
  if (!fs.existsSync(path.join(ROOT, HOOKS))) skip("11b", HOOKS + " is not fetched (node tools/engine-fetch.mjs)");
  else {
    const own = walk(path.join(ROOT, "packaging"), ROOT).concat([HOOKS]);
    const mine = sweep(ROOT, own);
    ok(own.includes("packaging/installer-pages.nsh") && mine.total >= 3 && mine.open.length === 0,
      "11b and every box in the .nsh files this tree includes: " + own.join(", ") + ", " + mine.total + " boxes, unanswered "
      + (mine.open.join(", ") || "none"));
  }
  const nsi = text["installer.nsi"] || "";
  const plant = nsi.replace(/("Unable to elevate, error \$0")\s*\/SD IDOK/, "$1");
  ok(plant !== nsi && boxes(plant, "installer.nsi").open.length === 1,
    "11c control: the silent elevation box with its default taken out reads red");
  const answers = [["installer.nsi", /"Unable to elevate, error \$0" \/SD IDOK\b/],
    ["include/installUtil.nsh", /"\$\(uninstallFailed\): \$R0" \/SD IDOK\b/],
    ["include/webPackage.nsh", /"Unable to download application package[^"]*" \/SD IDCANCEL IDRETRY download/],
    ["uninstaller.nsh", /"\$\(areYouSureToUninstall\)" \/SD IDOK IDOK \+2/]];
  const wrong = answers.filter(([f, re]) => !re.test(text[f] || "")).map(([f]) => f);
  ok(wrong.length === 0, "11d each box answers with the choice that ends the run without losing data (OK where OK is the only"
    + " button or goes on as the silent run already does, Cancel on the download retry, which retried would loop): "
    + (wrong.join(", ") || "all as chosen"));
  ok(status.silentDefaultsPatched === true && status.applied === true && twice,
    "11e the patch tool reads its own boxes back answered, and applied a second time changes nothing: " + JSON.stringify(status));
  let refused = null;
  try {
    fs.appendFileSync(path.join(to, "common.nsh"), "\n  MessageBox MB_OK \"a box no silent run answers\"\n");
    refused = patchTool.verifyNsisPatches(lab);
  } catch (e) { refused = { error: e.message }; }
  ok(refused && refused.applied === false && (refused.unanswered || []).some(u => /^common\.nsh:/.test(u)),
    "11f control: a new unanswered box in a template makes the patch tool refuse the build: "
    + JSON.stringify(refused && refused.unanswered));
  fs.rmSync(lab, { recursive: true, force: true });
}

/* ---- 12. the exit codes a deployment tool reads, each held to its path and to the list IT reads --------------- */
/* The list is docs/silent-install.md's table. Every SetErrorLevel the patched templates and this tree's includes can set is
   in it or named in INNER; portable.nsi is the portable target's, which this tree does not build. Each path is planted on a
   copy. The app-open code is the pinned engine's hook, so it follows the engine pin. */
{
  const osx = require("node:os");
  const DOC = "docs/silent-install.md";
  const hooksAt = path.join(ROOT, "engine", "pinned", ".installer-hooks.nsh");
  const APP_OPEN = { file: "engine/pinned/.installer-hooks.nsh", text: () => (fs.existsSync(hooksAt) ? fs.readFileSync(hooksAt, "utf8") : "") };
  const INNER = { "0x666666": "the elevated copy telling its outer copy it was not an administrator, which the outer copy answers with 740" };
  const listed = {};
  const docText = fs.existsSync(path.join(ROOT, DOC)) ? fs.readFileSync(path.join(ROOT, DOC), "utf8") : "";
  for (const m of docText.matchAll(/^\|\s*(\d+)\s*\|\s*([^|]+)\|/gm)) listed[m[1]] = m[2].trim();
  ok(Object.keys(listed).sort().join(",") === "0,1618,2,740", "12a the list IT reads (" + DOC + ") gives exactly 0, 1618, 740 and 2: "
    + Object.keys(listed).join(", "));
  ok(/still open/.test(listed["1618"] || "") && /another [\w ]*installer/.test(listed["1618"] || "") && /administrator/.test(listed["740"] || ""),
    "12b and says 1618 for the app still open or another installer running, 740 for no administrator rights");

  const patchTool = require(path.join(ROOT, "tools", "patch-nsis.cjs"));
  const lab = fs.mkdtempSync(path.join(osx.tmpdir(), "studio-nsis-codes-"));
  const to = path.dirname(patchTool.getPaths(lab).multiUserUi);
  const T = {};
  try {
    fs.cpSync(path.dirname(patchTool.getPaths(ROOT).multiUserUi), to, { recursive: true });
    patchTool.applyNsisPatches(lab);
    const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => e.isDirectory() ? walk(path.join(d, e.name))
      : /\.(nsh|nsi)$/i.test(e.name) && (T[path.relative(to, path.join(d, e.name)).replace(/\\/g, "/")] = fs.readFileSync(path.join(d, e.name), "utf8")));
    walk(to);
  } catch (e) { console.log("  (the template copy failed: " + e.message + ")"); }
  fs.rmSync(lab, { recursive: true, force: true });

  /* After the elevation call, before its Quit: 740 for a failed or declined elevation, a runas by a non-administrator, and an
     elevated copy that was not an administrator, and no other code set there. */
  const elevation = text => {
    const i = String(text).indexOf("!insertmacro UAC_RunElevated"), q = i < 0 ? -1 : text.indexOf("Quit", i);
    if (q < 0) return false;
    const s = text.slice(i, q);
    return /\$\{If\} \$0 <> 0\s+SetErrorLevel 740/.test(s) && /\$\{ElseIf\} \$1 = 3\s+SetErrorLevel 740/.test(s)
      && /\$\{ElseIf\} \$1 = 1\s+\$\{AndIf\} \$2 = 0x666666\s+SetErrorLevel 740/.test(s) && (s.match(/SetErrorLevel/g) || []).length === 3;
  };
  ok(elevation(T["installer.nsi"]) && elevation(T["multiUser.nsh"]),
    "12c an all-users run that cannot get administrator rights ends with 740, in the silent installer and the uninstaller");
  ok(!elevation(String(T["installer.nsi"]).replace(/SetErrorLevel 740/, "SetErrorLevel 2")),
    "12c control: one of the three elevation paths left at 2 reads red");
  const second = text => /\n\s*notfound:\r?\n\s*SetErrorLevel 1618\r?\n\s*Abort\b/.test(String(text));
  const one = T["include/allowOnlyOneInstallerInstance.nsh"];
  ok(second(one), "12d a second copy of the installer, started while one runs, ends with 1618");
  ok(!second(String(one).replace(/\n\s*SetErrorLevel 1618/, "")), "12d control: the code taken out reads red");
  const appOpen = text => {
    const m = (/!macro customCheckAppRunning\r?\n([\s\S]*?)!macroend/.exec(String(text)) || [])[1] || "";
    return /SetErrorLevel 1618\r?\n\s*Quit\b/.test(m) && (m.match(/SetErrorLevel/g) || []).length === 1;
  };
  const open = APP_OPEN.text();
  if (!open) skip("12e", APP_OPEN.file + " is not fetched (node tools/engine-fetch.mjs)");
  else {
    ok(appOpen(open), "12e the app still open after the wait ends a silent run with 1618 (" + APP_OPEN.file + ", customCheckAppRunning,"
      + " the engine's at the pin)");
    ok(!appOpen(open.replace("SetErrorLevel 1618", "SetErrorLevel 2")), "12e control: the old 2 put back reads red");
  }

  const codes = files => {
    const sets = {};
    for (const [name, text] of files) String(text).split(/\r?\n/).forEach((l, i) => {
      const m = /^\s*SetErrorLevel\s+(\S+)/.exec(l);
      if (m) (sets[m[1]] = sets[m[1]] || []).push(name + ":" + (i + 1));
    });
    return { sets, stray: Object.keys(sets).filter(v => !(v in listed) && !(v in INNER)) };
  };
  const own = ["packaging", "packaging/installer"].flatMap(d => fs.readdirSync(path.join(ROOT, d)).filter(f => /\.nsh$/i.test(f))
    .map(f => [d + "/" + f, fs.readFileSync(path.join(ROOT, d, f), "utf8")]));
  const files = Object.keys(T).filter(f => f !== "portable.nsi").map(f => [f, T[f]]).concat([[APP_OPEN.file, open]], own);
  const C = codes(files);
  ok(Object.keys(T).length >= 10 && C.stray.length === 0 && ["740", "1618", "2"].every(v => v in C.sets),
    "12f every code a silent run can end with is on the list or named here, and each listed failure code has its path: "
    + Object.keys(C.sets).map(v => v + " at " + C.sets[v].join(" ")).join("; ") + (C.stray.length ? "; not listed: " + C.stray.join(", ") : ""));
  ok(codes(files.concat([["planted", "  SetErrorLevel 3"]])).stray.join() === "3", "12f control: a code set nowhere on the list reads red");
}

/* ---- 13. the machine-wide install a deployment tool runs, the engine's section 13 for Studio ------------------ */
/* Read only, on a copy of the templates as this tree's patch tool leaves them: no leg here compiles or runs NSIS, and no
   all-users install has run on any machine. The close check is the pinned engine's hook, so the notes are held to the pin. */
{
  const osx = require("node:os");
  const patchTool = require(path.join(ROOT, "tools", "patch-nsis.cjs"));
  const lab = fs.mkdtempSync(path.join(osx.tmpdir(), "studio-nsis-machine-"));
  const to = path.dirname(patchTool.getPaths(lab).multiUserUi);
  const T = {};
  let status = {};
  try {
    fs.cpSync(path.dirname(patchTool.getPaths(ROOT).multiUserUi), to, { recursive: true });
    status = patchTool.applyNsisPatches(lab);
    for (const f of ["assistedInstaller.nsh", "include/extractAppPackage.nsh"]) T[f] = fs.readFileSync(path.join(to, f), "utf8");
  } catch (e) { status = { error: e.message }; }
  fs.rmSync(lab, { recursive: true, force: true });
  const macro = (text, name) => (new RegExp("!macro " + name + "(?: [^\\r\\n]*)?\\r?\\n([\\s\\S]*?)!macroend").exec(String(text)) || [])[1] || "";

  const unattended = text => {
    const m = macro(text, "initMultiUser");
    const cur = m.indexOf('${GetOptions} $R0 "/currentuser" $R1'), choice = m.indexOf('${if} $hasPerUserInstallation == "1"');
    const at = m.indexOf("!ifndef BUILD_UNINSTALLER", cur);
    if (cur < 0 || choice < 0 || at < 0 || at > choice) return false;
    const b = m.slice(at, choice);
    return /^!ifndef BUILD_UNINSTALLER\s+\$\{If\} \$\{Silent\}\s+\$\{AndIf\} \$\{UAC_IsAdmin\}\s/.test(b)
      && /\$\{GetOptions\} \$R0 "\/allusers" \$R1\s+\$\{If\} \$\{Errors\}\s+\$\{GetOptions\} \$R0 "\/currentuser" \$R1\s+\$\{If\} \$\{Errors\}\s+Push \$R2\s+Push \$R3\s+Push \$R4\s+StrCpy \$R4 "0"/.test(b)
      && /whoami\.exe" \/user \/FO CSV \/NH \| "\$SYSDIR\\findstr\.exe" \/C:"\\"S-1-5-18\\""`\s+Pop \$R2\s+\$\{If\} \$R2 == "0"\s+StrCpy \$R4 "1"/.test(b)
      && /GetCurrentProcessId\(\) i \.R2'\s+System::Call 'kernel32::ProcessIdToSessionId\(i R2, \*i \.R3\) i \.R2'\s+\$\{If\} \$R2 <> 0\s+\$\{AndIf\} \$R3 == "0"\s+StrCpy \$R4 "1"/.test(b)
      && /\$\{If\} \$R4 == "1"\s+StrCpy \$hasPerMachineInstallation "1"\s+StrCpy \$hasPerUserInstallation "0"\s+\$\{EndIf\}\s+Pop \$R4\s+Pop \$R3\s+Pop \$R2\s/.test(b)
      && (b.match(/\$hasPer\w+Installation/g) || []).length === 2 && /!endif\s*$/.test(b);
  };
  const A = T["assistedInstaller.nsh"] || "";
  ok(unattended(A) && status.machineWidePatched === true && status.applied === true,
    "13a a silent run with neither switch, by the system account or by an elevated administrator in session 0, chooses all users"
    + " before the mode is set; every other run keeps today's choice: " + JSON.stringify({ machineWidePatched: status.machineWidePatched, applied: status.applied }));
  ok(!unattended(A.replace("${AndIf} ${UAC_IsAdmin}", "")), "13a control: the administrator test taken out reads red");
  ok(!unattended(A.replace('${AndIf} $R3 == "0"', '${AndIf} $R3 == "1"')), "13a control: session 1, a person's own, taken for the unattended one reads red");

  const lockedExtract = text => /"\$\(appCannotBeClosed\)" \/SD IDCANCEL IDCANCEL AbortExtract7za/.test(String(text))
    && /\n\s*AbortExtract7za:\r?\n\s*SetErrorLevel 1618\r?\n(?:!ifmacrodef etiudaStageAbort\r?\n\s*!insertmacro etiudaStageAbort\r?\n!endif\r?\n)?\s*Quit\b/.test(String(text));
  const X = T["include/extractAppPackage.nsh"] || "";
  ok(lockedExtract(X), "13b a file still locked after about a minute of tries ends a silent run with 1618 before the in-place overwrite that ignores errors");
  ok(!lockedExtract(X.replace("/SD IDCANCEL IDCANCEL", "/SD IDRETRY IDCANCEL")), "13b control: the silent Retry put back reads red");
  /* The retry window before that 1618 (Claude alpha's ruling (2), 2026-11-11 18:49): 30 tries 2 s apart, about a minute. */
  const retryWindow = text => /\n\s*\$\{if\} \$R1 < 30\r?\n/.test(String(text)) && /\n\s*RetryExtract7za:\r?\n\s*Sleep 2000\r?\n/.test(String(text));
  ok(retryWindow(X), "13b a locked file is tried 30 times 2 s apart, about a minute, before the 1618");
  ok(!retryWindow(X.replace("${if} $R1 < 30", "${if} $R1 < 5")), "13b control: the template's five tries put back reads red");
  ok(!retryWindow(X.replace(/(RetryExtract7za:\r?\n\s*)Sleep 2000/, "$1Sleep 1000")), "13b control: the template's one-second wait put back reads red");

  const DOC = path.join(ROOT, "docs", "silent-install.md");
  const doc = fs.existsSync(DOC) ? fs.readFileSync(DOC, "utf8") : "";
  const key = id => "HKEY_LOCAL_MACHINE\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\" + P.appGuid(id);
  const told = d => d.includes(key("app.etiuda.studio")) && d.includes("/S /allusers") && d.includes("/S /currentuser")
    && /no installer log/i.test(d) && /DisplayVersion/.test(d);
  ok(told(doc), "13c docs/silent-install.md gives IT both commands, the detection key the installer writes (" + P.appGuid("app.etiuda.studio")
    + "), DisplayVersion, and that there is no installer log");
  ok(!told(doc.split(P.appGuid("app.etiuda.studio")).join(P.appGuid("app.etiuda.desktop"))), "13c control: the desk's key in Studio's notes reads red");

  /* The pinned hook decides whether the close check looks in every session; the notes must say what the pin does, so a pin
     move that brings the engine's cross-session check turns this red until the notes follow it. */
  const hooksAt = path.join(ROOT, "engine", "pinned", ".installer-hooks.nsh");
  const hook = fs.existsSync(hooksAt) ? fs.readFileSync(hooksAt, "utf8") : "";
  const everySession = text => /\$\{If\} \$installMode == "all"\s+StrCpy \$R5 ""/.test(macro(text, "customCheckAppRunning"));
  const saysEvery = d => /looks for an open copy in every session/.test(d), saysOne = d => /sees only the installing account's open copy/.test(d);
  const notesMatch = (h, d) => (everySession(h) ? saysEvery(d) && !saysOne(d) : saysOne(d) && !saysEvery(d));
  if (!hook) skip("13d", "engine/pinned/.installer-hooks.nsh is not fetched (node tools/engine-fetch.mjs)");
  else {
    ok(notesMatch(hook, doc), "13d the notes say which sessions the close check looks in as the pinned hook does: "
      + (everySession(hook) ? "every session" : "the installing account alone") + " at this pin");
    const other = everySession(hook) ? hook.replace(/(\$\{If\} \$installMode == "all"\s+)StrCpy \$R5 ""/, "$1StrCpy $R5 $R5")
      : hook.replace(/!macro customCheckAppRunning\r?\n/, '!macro customCheckAppRunning\n  ${If} $installMode == "all"\n    StrCpy $R5 ""\n');
    ok(!notesMatch(other, doc), "13d control: the pin's close check turned the other way, with the notes unchanged, reads red");
  }
}

/* ---- 14. nothing a non-administrator can write is run, or removed by a walk that follows a link, elevated -------- */
/* The engine's section 14 (board 995) for Studio. Read only, on a copy of the templates as this tree's patch tool leaves
   them, on packaging/installer-pages.nsh and on the pin's five-hook cut it includes; nothing here compiles or runs NSIS.
   HKCU, the per-user folder and the roaming folder are that account's to write, and RMDir /r follows a junction. */
{
  const osx = require("node:os");
  const patchTool = require(path.join(ROOT, "tools", "patch-nsis.cjs"));
  const lab = fs.mkdtempSync(path.join(osx.tmpdir(), "studio-nsis-owner-"));
  const to = path.dirname(patchTool.getPaths(lab).multiUserUi);
  const T = {};
  let status = {};
  const walkDir = (d, rel = "") => fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
    const r = rel ? rel + "/" + e.name : e.name;
    if (e.isDirectory()) return walkDir(path.join(d, e.name), r);
    if (/\.(nsh|nsi)$/i.test(e.name)) T[r] = fs.readFileSync(path.join(d, e.name), "utf8");
  });
  try {
    fs.cpSync(path.dirname(patchTool.getPaths(ROOT).multiUserUi), to, { recursive: true });
    status = patchTool.applyNsisPatches(lab);
    walkDir(to);
  } catch (e) { status = { error: e.message }; }
  fs.rmSync(lab, { recursive: true, force: true });
  const PAGES = "packaging/installer-pages.nsh", CUT = "engine/pinned/.installer-hooks.nsh", TURN = "packaging/installer/turning.nsh";
  const NSH = fs.readFileSync(path.join(ROOT, PAGES), "utf8");
  const HOOKS = fs.existsSync(path.join(ROOT, CUT)) ? fs.readFileSync(path.join(ROOT, CUT), "utf8") : "";
  const TURNING = fs.existsSync(path.join(ROOT, TURN)) ? fs.readFileSync(path.join(ROOT, TURN), "utf8") : "";
  const macro = (text, name) => (new RegExp("!macro " + name + "(?: [^\\r\\n]*)?\\r?\\n([\\s\\S]*?)!macroend").exec(String(text)) || [])[1] || "";
  const code = text => String(text).split(/\r?\n/).map(l => l.trim()).filter(l => l && !/^[#;]/.test(l));
  /* The template files Studio's assisted build compiles: portable.nsi is another target, oneClick.nsh another mode. */
  const built = tpl => Object.keys(tpl).filter(f => !/^(portable\.nsi|oneClick\.nsh)$/.test(f));
  /* Lines inside the !else of a directive the build satisfies (the then-branch compiles, the else does not). */
  const deadElse = (text, satisfied) => {
    const dead = new Set(), stack = [];
    String(text).split(/\r?\n/).forEach((raw, i) => {
      const t = raw.trim();
      const m = /^!(ifdef|ifmacrodef|ifndef|ifmacrondef|if)\b\s*(\S*)/.exec(t);
      if (m) { stack.push({ sat: (m[1] === "ifdef" || m[1] === "ifmacrodef") && satisfied(m[1], m[2]), inElse: false }); return; }
      if (/^!else\b/.test(t) && stack.length) { stack[stack.length - 1].inElse = true; return; }
      if (/^!endif\b/.test(t)) { stack.pop(); return; }
      if (stack.some(s => s.sat && s.inElse)) dead.add(i);
    });
    return dead;
  };
  const defines = nsh => new Set((String(nsh).match(/^[ \t]*!define[ \t]+(\w+)/gm) || []).map(l => l.trim().split(/\s+/)[1]));
  const macros = nsh => new Set((String(nsh).match(/^[ \t]*!macro[ \t]+(\w+)/gm) || []).map(l => l.trim().split(/\s+/)[1]));
  const satisfiedBy = nsh => { const d = defines(nsh), m = macros(nsh); return (kind, name) => (kind === "ifdef" ? d.has(name) : m.has(name)); };
  /* The templates see everything the include defines; the include's own files see only the cut, which comes first. */
  const liveLines = (tpl, by) => {
    const out = [];
    for (const f of Object.keys(tpl)) {
      const dead = deadElse(tpl[f], by);
      String(tpl[f]).split(/\r?\n/).forEach((l, i) => { if (!dead.has(i) && l.trim() && !/^\s*[#;]/.test(l)) out.push({ f, i: i + 1, l: l.trim() }); });
    }
    return out;
  };
  const builtOf = tpl => Object.fromEntries(built(tpl).map(f => [f, tpl[f]]));
  const own = (nsh, hooks) => ({ [PAGES]: nsh, [CUT]: hooks, [TURN]: TURNING });
  const live = (tpl, nsh, hooks) => liveLines(builtOf(tpl), satisfiedBy(nsh + "\n" + hooks))
    .concat(liveLines(own(nsh, hooks), satisfiedBy(hooks)));
  if (!HOOKS) skip("14", CUT + " is not fetched (node tools/engine-fetch.mjs)");
  else {
    /* 14a: every program run is a system tool, this install's own program, run as the person, or the old uninstaller;
       and the uninstaller HKCU names is reached in an elevated instance only through the unelevated one. */
    const EXEC = /\b(ExecWait|ExecShellWait|ExecShell|Exec|nsExec::Exec\w*)\b/;
    const macroLines = (text, names) => {
      const out = new Set();
      let open = false;
      String(text || "").split(/\r?\n/).forEach((raw, i) => {
        const t = raw.trim(), m = /^!macro\s+(\S+)/.exec(t);
        if (m) open = names.indexOf(m[1]) > -1;
        if (open) out.add(i + 1);
        if (/^!macroend\b/.test(t)) open = false;
      });
      return out;
    };
    const execStray = (tpl, nsh, hooks = HOOKS) => {
      const stray = [];
      /* The template's own close check, inserted only where no customCheckAppRunning is, which the pin's cut defines. */
      const unused = macros(nsh + "\n" + hooks).has("customCheckAppRunning")
        ? macroLines(tpl["include/allowOnlyOneInstallerInstance.nsh"], ["KILL_PROCESS", "FIND_PROCESS", "IS_POWERSHELL_AVAILABLE", "_CHECK_APP_RUNNING"])
        : new Set();
      /* Run as the person: the lines of a macro inserted only as etiudaAsUser's RUN, never straight into an elevated instance. */
      const allOwn = nsh + "\n" + hooks;
      const viaAsUser = [...new Set((allOwn.match(/!insertmacro etiudaAsUser (\w+)/g) || []).map(s => s.split(" ").pop()))]
        .filter(n => !new RegExp("!insertmacro " + n + "\\b").test(allOwn));
      const asUserOwn = macroLines(nsh, viaAsUser), asUserHooks = macroLines(hooks, viaAsUser);
      for (const { f, i, l } of live(tpl, nsh, hooks)) {
        if (!EXEC.test(l) || /^!define\b/.test(l) || f === "include/StdUtils.nsh" || f === "include/UAC.nsh") continue;
        if (f === "include/allowOnlyOneInstallerInstance.nsh" && unused.has(i)) continue;
        if (/\$\{StdUtils\.ExecShellAsUser\}/.test(l)) continue;
        if (f === "include/installUtil.nsh" && /^ExecWait '"\$uninstallerFileName(Temp)?" \/S \/KEEP_APP_DATA \$0 _\?=\$installationDir' \$R0$/.test(l)) continue;
        if ((f === PAGES && asUserOwn.has(i)) || (f === CUT && asUserHooks.has(i))) continue;
        if (/^nsExec::Exec `"\$(SYSDIR\\[\w.]+\.exe|CmdPath|PowerShellPath)"/.test(l)) continue;
        if ((f === PAGES || f === CUT || f === TURN)
          && /^nsExec::Exec(\s+\/TIMEOUT=\d+)? `"\$(SYSDIR\\[\w.]+\.exe|INSTDIR\\\$\{APP_EXECUTABLE_FILENAME\}|etiudaStage\\\$\{APP_EXECUTABLE_FILENAME\})"/.test(l)) continue;
        stray.push(f + ":" + i + " " + l.slice(0, 70));
      }
      return stray;
    };
    const asUserHolds = nsh => {
      const b = code(macro(nsh, "etiudaAsUser"));
      const go = b.findIndex(l => /^Goto etiudaAsUserCall\$\{ETIUDA_AS_USER_N\}$/.test(l));
      const seg = b.indexOf("etiudaAsUserRun${ETIUDA_AS_USER_N}:"), runAt = b.indexOf("!insertmacro ${RUN}");
      const ret = b.indexOf("Return", seg), call = b.indexOf("etiudaAsUserCall${ETIUDA_AS_USER_N}:");
      const via = b.indexOf("!insertmacro UAC_AsUser_Call Label etiudaAsUserRun${ETIUDA_AS_USER_N} ${UAC_SYNCREGISTERS}");
      return b.indexOf("${If} ${UAC_IsInnerInstance}") > -1 && go > -1 && seg === go + 1 && runAt === seg + 1 && ret === runAt + 1
        && call === ret + 1 && via === call + 1 && !b.some(l => /\b(Goto|Call)\s+:?etiudaAsUserRun/.test(l))
        && /StrCpy \$R9 "unreached"/.test(b.slice(0, go).join("\n"));
    };
    const hkcuAsUser = (tpl, nsh) => {
      const sec = code(tpl["installSection.nsh"] || "");
      const call = "!insertmacro uninstallOldVersion HKEY_CURRENT_USER";
      const guarded = sec.includes(call) && sec.every((l, k) => l !== call
        || (sec[k - 1] === "!else" && sec[k - 2] === "!insertmacro etiudaOldUserCopy" && sec[k - 3] === "!ifmacrodef etiudaOldUserCopy"));
      const m = code(macro(nsh, "etiudaOldUserCopy"));
      const inner = m.indexOf("${If} ${UAC_IsInnerInstance}"), outer = m.lastIndexOf("${Else}");
      if (!guarded || !macros(nsh).has("etiudaOldUserCopy") || inner !== 0 || outer < 0) return { ok: false };
      /* The inner branch runs it only inside etiudaAsUser, whose segment the elevated instance jumps over and reaches only
         through UAC_AsUser_Call; started elevated, the file is not run at all: it is left to that account's next sign-in (HKCU
         RunOnce, /currentuser /S /KEEP_APP_DATA) and the finish page says so. Was (before engine 22d3af9c): the copy stayed
         registered and the finish page said so ($(etiudaOldCopyLeft)). Now: the RunOnce line, then $(etiudaOldCopyGoes);
         tests/studio-installer-mends.mjs sm4a holds the line's switches. */
      const body = m.slice(inner, outer);
      const run = (body.map(l => /^!insertmacro etiudaAsUser (\w+)$/.exec(l)).find(Boolean) || [])[1] || "";
      const ranThere = code(macro(nsh, run)).filter(l => l === call).length === 1;
      const rest = m.slice(outer);
      const left = !rest.includes(call) && !rest.some(l => /uninstallOldVersion|ExecWait|Exec\b/.test(l))
        && rest.includes("ReadRegStr $R9 HKCU \"${UNINSTALL_REGISTRY_KEY}\" UninstallString")
        && rest.indexOf("WriteRegStr HKCU \"Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce\" \"${APP_ID}.per-user-copy\" \"$R9 /currentuser /S /KEEP_APP_DATA\"") > rest.indexOf("${If} $R9 != \"\"")
        && rest.indexOf("StrCpy $etiudaFinishText \"$(etiudaOldCopyGoes)\"") > rest.indexOf("${If} $R9 != \"\"");
      return { ok: !!run && asUserHolds(nsh) && ranThere && !body.includes(call) && left };
    };
    const hk = hkcuAsUser(T, NSH), stray = execStray(T, NSH);
    ok(status.asItsOwnerPatched === true && hk.ok && stray.length === 0,
      "14a in an all-users install the uninstaller HKCU names runs only as its own account, through the unelevated instance"
      + " (UAC_AsUser_Call), and every other program run is a system tool, this install's own program, or run as the person: "
      + JSON.stringify({ asItsOwnerPatched: status.asItsOwnerPatched, asUser: hk.ok, stray }));
    ok(!hkcuAsUser(T, NSH.replace(/(\$\{Else\}\r?\n)(\s*# An installer started elevated)/, "$1    !insertmacro uninstallOldVersion HKEY_CURRENT_USER\n$2")).ok,
      "14a control: an installer started elevated running that uninstaller itself, as the template did, reads red");
    ok(!hkcuAsUser(T, NSH.replace("StrCpy $etiudaFinishText \"$(etiudaOldCopyGoes)\"", "Nop")).ok,
      "14a control: the copy left to the next sign-in without a word on the finish page reads red");
    ok(!hkcuAsUser(T, NSH.replace(/\n\s*WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce"[^\n]*/, "")).ok,
      "14a control: the copy left registered with nothing to remove it, as before engine 22d3af9c, reads red");
    const plainSec = T["installSection.nsh"] ? T["installSection.nsh"].replace(/!ifmacrodef etiudaOldUserCopy\r?\n\s*!insertmacro etiudaOldUserCopy\r?\n\s*!else\r?\n\s*(!insertmacro uninstallOldVersion HKEY_CURRENT_USER\r?\n\s*!insertmacro handleUninstallResult HKEY_CURRENT_USER)\r?\n\s*!endif/, "$1") : "";
    ok(!hkcuAsUser(Object.assign({}, T, { "installSection.nsh": plainSec }), NSH).ok,
      "14a control: the template's elevated run, as this tree's patch tool left it before fix 6, reads red");
    ok(!hkcuAsUser(T, NSH.replace(/\n\s*Goto etiudaAsUserCall\$\{ETIUDA_AS_USER_N\}\r?\n/, "\n")).ok,
      "14a control: the elevated instance falling into the segment instead of jumping over it reads red");
    ok(!hkcuAsUser(T, NSH.replace("!insertmacro UAC_AsUser_Call Label etiudaAsUserRun${ETIUDA_AS_USER_N} ${UAC_SYNCREGISTERS}", "Call :etiudaAsUserRun${ETIUDA_AS_USER_N}")).ok,
      "14a control: the segment called in the elevated instance rather than through UAC_AsUser_Call reads red");
    ok(!hkcuAsUser(T, NSH.replace(/(\n\s*)!insertmacro etiudaAsUser etiudaOldUserCopyRun/, "$1!insertmacro etiudaOldUserCopyRun")).ok,
      "14a control: the run macro inserted straight into the elevated instance reads red");
    ok(execStray(T, NSH.replace("!macro customInit\n", "!macro customInit\n  ExecWait '\"$R0\"'\n")).length === 1,
      "14a control: a program named by a register, run from Studio's include, reads red");
    ok(execStray(Object.assign({}, T, { "installSection.nsh": T["installSection.nsh"] + "\nExec '\"$INSTDIR\\x.exe\"'\n" }), NSH).length === 1,
      "14a control: a program run from a template line the inventory does not know reads red");
    ok(execStray(T, NSH, HOOKS.replace("!insertmacro etiudaAsUser etiudaAskCloseRun", "!insertmacro etiudaAskCloseRun")).length >= 1,
      "14a control: etiudaAskCloseRun inserted directly instead of through etiudaAsUser reads red");

    /* 14b: RMDir /r, which follows a junction, is used only over the installer's own $PLUGINSDIR; Studio's Remove my data
       and the template's --delete-app-data removal go through the pin's walk. */
    const rmdirStray = (tpl, nsh, hooks = HOOKS) => live(tpl, nsh, hooks)
      .filter(({ l }) => /^RMDir\s+\/r\b/i.test(l) && !/^RMDir\s+\/r\s+"?\$PLUGINSDIR\\/i.test(l)).map(({ f, i, l }) => f + ":" + i + " " + l);
    const rs = rmdirStray(T, NSH);
    /* The folder is named by its package define, as the desk's step names it; the literal is the older spelling. */
    const dataWalks = /Push "\$APPDATA\\(?:etiuda-studio|\$\{APP_PACKAGE_NAME\})\\\$R2"\r?\n\s*Call un\.etiudaRemoveTree/.test(macro(NSH, "studioRemoveUserDataSection"));
    ok(rs.length === 0 && dataWalks && status.asItsOwnerPatched === true,
      "14b no RMDir /r runs over anything but the installer's own $PLUGINSDIR: Studio's Remove my data, the install folder and"
      + " the template's --delete-app-data removal go through the walk: " + JSON.stringify(rs));
    ok(rmdirStray(T, NSH.replace(/Push "\$APPDATA\\(?:etiuda-studio|\$\{APP_PACKAGE_NAME\})\\\$R2"\r?\n\s*Call un\.etiudaRemoveTree/, "RMDir /r \"$APPDATA\\${APP_PACKAGE_NAME}\\$R2\"")).length === 1,
      "14b control: Studio's RMDir /r of a folder under its roaming folder put back reads red");
    ok(rmdirStray(T, NSH, HOOKS.replace(/!define ETIUDA_REMOVE_TREE\b/g, "!define ETIUDA_REMOVE_TREE_GONE")).length === 3,
      "14b control: the walk's define gone from the cut, the template's three RMDir /r of $APPDATA compile again and read red");
    ok(rmdirStray(Object.assign({}, T, { "uninstaller.nsh": (T["uninstaller.nsh"] || "").replace(/!ifdef ETIUDA_REMOVE_TREE\r?\n\s*Push "\$APPDATA\\\$\{APP_FILENAME\}"\r?\n\s*Call \$\{ETIUDA_REMOVE_TREE\}\r?\n\s*!else\r?\n\s*(RMDir \/r "\$APPDATA\\\$\{APP_FILENAME\}")\r?\n\s*!endif/, "$1") }), NSH).length === 1,
      "14b control: one of the template's RMDir /r of $APPDATA unwrapped, as the patch tool left it before fix 6, reads red");

    /* 14d: the finish page carries the case's sentence, the copywriter's Studio line (words-995, revised 09:12), in English
       and Polish; Modern UI's own text is the default, so every other install shows the page as before.
       Was: etiudaOldCopyLeft, always. Now: the string the etiudaOldUserCopy that compiles names (the cut's wherever it defines
       one, else Studio's own): etiudaOldCopyLeft, the copywriter's line, for a pin before engine 22d3af9c; etiudaOldCopyGoes,
       the copywriter's words (Etiuda Studio for the program), from that pin on, whose copy is left to the
       next sign-in. */
    const finishName = (nsh, hooks) => {
      const m = macros(hooks).has("etiudaOldUserCopy") ? macro(hooks, "etiudaOldUserCopy") : macro(nsh, "etiudaOldUserCopy");
      return (/StrCpy \$etiudaFinishText "\$\((etiudaOldCopy\w+)\)"/.exec(m) || [])[1] || "";
    };
    const FINISH = finishName(NSH, HOOKS);
    const LINE_EN = "Etiuda Studio is installed. Another copy, installed for one account only, is also on this computer. Nothing is"
      + " wrong: it can be removed in that account, from the list of installed apps in Windows.";
    /* Moved 2026-11-23 to the copywriter's shorter words (commit 6411401d, which moved packaging/installer-pages.nsh and sm3 of
       tests/studio-installer-mends.mjs and left this check on the longer ones; the pin then named etiudaOldCopyGoes, so the old
       words were read for the first time). The old sentence, English: "Etiuda Studio is installed for all users. The copy installed
       earlier for this account alone is removed the next time this account signs in to Windows; this account's data for Etiuda
       Studio stays as it is." */
    const GOES_EN = "Etiuda Studio is installed for all users. The copy installed earlier for this account alone is removed at its next"
      + " Windows sign-in; the account's data stays.";
    const GOES_PL = "Program Etiuda Studio jest zainstalowany dla wszystkich użytkowników. Wcześniejsza kopia tylko dla tego konta"
      + " zostanie usunięta przy jego następnym logowaniu do Windows; dane konta zostają.";
    const GOES_TAIL = " ; the copywriter's words";
    const LINE_PL = "Etiuda Studio jest zainstalowana. Na tym komputerze jest też inna kopia, zainstalowana tylko dla jednego konta."
      + " Wszystko jest w porządku: można ją usunąć na tym koncie, z listy zainstalowanych aplikacji w Windows.";
    const finishSays = (nsh, name = FINISH) => {
      const lines = String(nsh).split(/\r?\n/);
      const at = lines.findIndex(l => l.trim() === "!define MUI_FINISHPAGE_TEXT \"$etiudaFinishText\"");
      const guard = at > -1 ? lines.slice(0, at).reverse().find(x => /^\s*!(ifndef|ifdef|endif)\b/.test(x)) || "" : "";
      const init = code(macro(nsh, "customInit"));
      const lang = macro(nsh, "TurnLang ID") || (/!macro TurnLang ID\r?\n([\s\S]*?)!macroend/.exec(nsh) || [])[1] || "";
      const langLines = lang.split(/\r?\n/);
      const defs = langLines.map((l, i) => ({ l: l.trim(), guarded: langLines.slice(0, i).reverse().find(x => /^\s*!(ifndef|endif)\b/.test(x)) }))
        .filter(x => new RegExp("^LangString " + name + " \\$\\{ID\\} \"[^\"]+\"(?: ; the copywriter's words)?$").test(x.l));
      const pl = lang.indexOf("!if ${ID} == 1045"), other = lang.indexOf("!else", pl);
      const text = d => /"([^"]+)"(?: ; the copywriter's words)?$/.exec(d.l)[1];
      const worded = name === "etiudaOldCopyLeft" ? (pd, ed) => text(pd) === LINE_PL && text(ed) === LINE_EN
        : name === "etiudaOldCopyGoes" ? (pd, ed) => text(pd) === GOES_PL && text(ed) === GOES_EN && pd.l.endsWith(GOES_TAIL) && ed.l.endsWith(GOES_TAIL)
        : () => false;
      const plDef = defs.find(d => lang.indexOf(d.l) > pl && lang.indexOf(d.l) < other), enDef = defs.find(d => lang.indexOf(d.l) > other);
      return at > -1 && /^\s*!ifndef\s+BUILD_UNINSTALLER\b/.test(guard) && /^Var etiudaFinishText$/m.test(nsh)
        && init[0] === "StrCpy $etiudaFinishText \"$(MUI_TEXT_FINISH_INFO_TEXT)\""
        && defs.length === 2 && defs.every(d => d.guarded && /!ifndef BUILD_UNINSTALLER/.test(d.guarded))
        && !!plDef && !!enDef && worded(plDef, enDef)
        && /!define MUI_FINISHPAGE_RUN\b/.test(T["assistedInstaller.nsh"] || "");
    };
    ok(finishSays(NSH), "14d the finish page's text is Modern UI's own unless the per-user copy was met, then the sentence the"
      + " compiled etiudaOldUserCopy names (" + (FINISH || "none") + (FINISH === "etiudaOldCopyLeft" ? ", the copywriter's Studio line of words-995" : ", the copywriter's words")
      + "), a language string in English and Polish in the installer pass only; the page keeps its Run box, so the label"
      + " stays 195 by 40 dialog units (" + LINE_EN.length + " and " + LINE_PL.length + " characters)");
    ok(!finishSays(NSH.replace(/^\s*StrCpy \$etiudaFinishText "\$\(MUI_TEXT_FINISH_INFO_TEXT\)"\r?\n/m, "")),
      "14d control: no default, so every other install's finish page would be blank, reads red");
    ok(!finishSays(NSH.replace(new RegExp("\\n\\s*LangString " + (FINISH || "etiudaOldCopyLeft") + " \\$\\{ID\\} \"(?:Program )?Etiuda Studio jest[^\\n]*"), "")),
      "14d control: the Polish branch without its string reads red");
    ok(!finishSays(NSH.replace("!define MUI_FINISHPAGE_TEXT \"$etiudaFinishText\"", "")),
      "14d control: the page left on Modern UI's fixed text reads red");
    ok(!finishSays(NSH.split("Etiuda Studio is installed").join("Etiuda is installed")),
      "14d control: the desk's line in place of Studio's reads red");

    /* 14e: every program Studio's include runs is named by its full path, so a planted copy beside the installer, or one
       earlier on PATH, is never what runs (the class of CVE-2024-27303 and CVE-2026-82649). A line that starts cmd.exe is
       read on: the program after /C and after each pipe must be named the same way. Every line, live or not. */
    const RUNS = /\b(ExecWait|ExecShellWait|ExecShell|Exec|nsExec::\w+|ExecDos::\w+|ExecCmd::\w+|UAC_AsUser_ExecShell|StdUtils\.ExecShell\w*)\b/;
    const FULL = /^["'`]*\$(SYSDIR|WINDIR|INSTDIR|PLUGINSDIR|etiudaStage)\\([^"'`\s$]+\.exe|\$\{APP_EXECUTABLE_FILENAME\})["'`]*$/i;
    const asUserRuns = (() => {
      const combined = NSH + "\n" + HOOKS;
      const onlyVia = [...new Set((combined.match(/!insertmacro etiudaAsUser (\w+)/g) || []).map(s => s.split(" ").pop()))]
        .filter(n => !new RegExp("!insertmacro " + n + "\\b").test(combined));
      return { nsh: macroLines(NSH, onlyVia), hooks: macroLines(HOOKS, onlyVia) };
    })();
    const unnamed = files => {
      const out = [];
      for (const [f, text] of Object.entries(files)) String(text).split(/\r?\n/).forEach((raw, i) => {
        const l = raw.trim();
        if (!l || /^[#;]/.test(l) || /^!(define|macro)\b/.test(l) || !RUNS.test(l)) return;
        const after = l.slice(l.search(RUNS)).replace(/^\S+\s*/, "").replace(/^\/TIMEOUT=\d+\s+/i, "").replace(/^\/OEM\s+/i, "");
        const cmd = after.replace(/^`/, "").replace(/`.*$/, "");
        const first = (/^("[^"]*"|'[^']*'|\S+)/.exec(cmd) || [""])[0];
        if ((f === PAGES && asUserRuns.nsh.has(i + 1) || f === CUT && asUserRuns.hooks.has(i + 1)) && /^"?\$R4"?$/i.test(first)) return;
        const progs = [first];
        if (/\\cmd\.exe"?$/i.test(first)) {
          const rest = cmd.slice(first.length);
          const c = /\s\/C\s+("[^"]*"|\S+)/i.exec(rest);
          if (c) progs.push(c[1]);
          for (const p of rest.matchAll(/\|\s*("[^"]*"|\S+)/g)) progs.push(p[1]);
        }
        const bad = progs.filter(p => !FULL.test(p));
        if (bad.length) out.push(f + ":" + (i + 1) + " " + bad.join(" "));
      });
      return out;
    };
    const mine = own(NSH, HOOKS), named = unnamed(mine);
    const counted = Object.values(mine).reduce((n, t) => n + code(t).filter(l => RUNS.test(l) && !/^!(define|macro)\b/.test(l)).length, 0);
    ok(named.length === 0 && counted >= 4, "14e every program Studio's include runs is named by its full path, after /C and"
      + " after each pipe too: " + counted + " lines in " + Object.keys(mine).join(", ") + ", unnamed " + (named.join("; ") || "none"));
    const kill = "nsExec::Exec `\"$SYSDIR\\cmd.exe\" /C \"$SYSDIR\\taskkill.exe\" /IM \"${APP_EXECUTABLE_FILENAME}\"";
    ok(HOOKS.includes(kill) && unnamed(own(NSH, HOOKS.replace(kill, "nsExec::Exec `taskkill /IM \"${APP_EXECUTABLE_FILENAME}\""))).length === 1,
      "14e control: the template's bare taskkill, as its KILL_PROCESS runs it, in place of the hook's reads red");
    ok(unnamed(own(NSH, HOOKS.replace(kill, "nsExec::Exec `\"$SYSDIR\\cmd.exe\" /C taskkill.exe /IM \"${APP_EXECUTABLE_FILENAME}\""))).length === 1,
      "14e control: a bare program after cmd.exe's /C reads red");
    ok(unnamed(own(NSH, HOOKS.replace("| \"$SYSDIR\\findstr.exe\"", "| findstr"))).length >= 1,
      "14e control: a bare program after a pipe reads red");
    ok(unnamed(own(NSH.replace("!macro customInit\n", "!macro customInit\n  ExecWait '\"$TEMP\\x.exe\"'\n"), HOOKS)).length === 1,
      "14e control: a program in a folder its user can write, from Studio's own file, reads red");
  }
}

/* ---- 15. the NSIS that compiles the installer, read without fetching it, the engine's section 15 ------------- */

/* Board 996. makensis writes its stub into every installer, and before NSIS 3.12 that stub lets a standard user become
   SYSTEM while an installer runs as SYSTEM. electron-builder 26 compiles with its legacy NSIS 3.04 unless the config's
   top-level toolsets.nsis names a newer bundle; app-builder-lib maps each value to one archive by file name and pins it
   by SHA-256. This reads the pin against that table and fetches nothing: tests/nsis-compile.mjs reads the version the
   resolved makensis prints. */
{
  let cfg = null, table = null;
  try { cfg = require(path.join(ROOT, "electron-builder.js")); } catch (e) { cfg = null; }
  try { table = require(require.resolve("app-builder-lib/out/toolsets/windows", { paths: [ROOT] })).nsisChecksums; } catch (e) { table = null; }
  const bundleOf = (c, t) => {
    const value = c && c.toolsets && c.toolsets.nsis;
    const files = (value && t && t[value]) || {};
    const file = Object.keys(files).find(f => /^nsis-bundle-\d+\.\d+\.tar\.gz$/.test(f));
    if (!file) return null;
    const [, major, minor] = /^nsis-bundle-(\d+)\.(\d+)/.exec(file);
    return { value, file, major: Number(major), minor: Number(minor), sha: files[file] };
  };
  const fixed = (c, t) => {
    const b = bundleOf(c, t);
    return !!b && (b.major > 3 || (b.major === 3 && b.minor >= 12)) && /^[0-9a-f]{64}$/.test(String(b.sha));
  };
  if (!cfg || !table) skip("15a", "electron-builder.js or app-builder-lib could not be read");
  else {
    const b = bundleOf(cfg, table);
    ok(fixed(cfg, table), "15a the config pins electron-builder's NSIS toolset to a bundle of NSIS 3.12 or later, pinned by"
      + " SHA-256 in app-builder-lib: " + (b ? "toolsets.nsis " + JSON.stringify(b.value) + ", " + b.file : "toolsets.nsis "
      + JSON.stringify(cfg.toolsets && cfg.toolsets.nsis) + ", the legacy NSIS 3.04"));
    ok(!fixed(Object.assign({}, cfg, { toolsets: undefined }), table),
      "15a control: no toolsets key, electron-builder's legacy NSIS 3.04, reads red");
    ok(!fixed(Object.assign({}, cfg, { toolsets: { nsis: "0.0.0" } }), table), "15a control: the legacy value \"0.0.0\" reads red");
    ok(!b || !fixed(cfg, Object.assign({}, table, { [b.value]: { "nsis-bundle-3.11.tar.gz": b.sha } })),
      "15a control: a bundle of 3.11 under the same value reads red");
    ok(!b || !fixed(cfg, Object.assign({}, table, { [b.value]: { [b.file]: "" } })), "15a control: a bundle with no checksum reads red");
  }
  /* 15b: elevate.exe stays out of the install. electron-builder copies it to resources\ for electron-updater's per-machine
     updates; Studio has no electron-updater and its installer never runs it (the all-users route is the UAC plug-in's,
     and the per-user copy's uninstaller runs through UAC_AsUser_Call), and perMachine true would override the switch. */
  const noElevate = c => !!c && !!c.nsis && c.nsis.packElevateHelper === false && c.nsis.perMachine !== true;
  if (cfg) {
    ok(noElevate(cfg), "15b the installer packs no elevate.exe: nsis.packElevateHelper is false and perMachine is not true");
    ok(!noElevate(Object.assign({}, cfg, { nsis: Object.assign({}, cfg.nsis, { packElevateHelper: undefined }) })),
      "15b control: the switch left at electron-builder's default reads red");
    ok(!noElevate(Object.assign({}, cfg, { nsis: Object.assign({}, cfg.nsis, { perMachine: true }) })),
      "15b control: perMachine true, which makes electron-builder ignore the switch, reads red");
  }
}

/* ---- 16. an upgrade is all or nothing: staged beside the install, then swapped, the engine's section 16 ---- */
/* Read only, on a copy of the templates as the patch tool leaves them, on engine/pinned/.installer-hooks.nsh, and on
   packaging/installer-pages.nsh: nothing here compiles or runs NSIS. Each row has a control beside it that puts the old order
   or the old step back and must read red. */
{
  const osx = require("node:os");
  const patchTool = require(path.join(ROOT, "tools", "patch-nsis.cjs"));
  const lab = fs.mkdtempSync(path.join(osx.tmpdir(), "studio-nsis-swap-"));
  const to = path.dirname(patchTool.getPaths(lab).multiUserUi);
  let S = "", X = "", I = "", T = "", A = "", status = {};
  try {
    fs.cpSync(path.dirname(patchTool.getPaths(ROOT).multiUserUi), to, { recursive: true });
    status = patchTool.applyNsisPatches(lab);
    S = fs.readFileSync(path.join(to, "installSection.nsh"), "utf8").replace(/\r\n/g, "\n");
    A = fs.readFileSync(path.join(to, "assistedInstaller.nsh"), "utf8").replace(/\r\n/g, "\n");
    X = fs.readFileSync(path.join(to, "include", "extractAppPackage.nsh"), "utf8").replace(/\r\n/g, "\n");
    I = fs.readFileSync(path.join(to, "include", "installer.nsh"), "utf8").replace(/\r\n/g, "\n");
    T = fs.readFileSync(path.join(to, "installer.nsi"), "utf8").replace(/\r\n/g, "\n");
  } catch (e) { status = { error: e.message }; }
  fs.rmSync(lab, { recursive: true, force: true });
  const CUT_AT = path.join(ROOT, "engine", "pinned", ".installer-hooks.nsh");
  const HOOKS = fs.existsSync(CUT_AT) ? fs.readFileSync(CUT_AT, "utf8").replace(/\r\n/g, "\n") : "";
  const PAGES = fs.readFileSync(path.join(ROOT, "packaging", "installer-pages.nsh"), "utf8").replace(/\r\n/g, "\n");
  const NSH = HOOKS + "\n" + PAGES;
  /* THE PIN'S TWO SHAPES. From engine 22d3af9c the cut reads the install's own list (etiuda-files.ini): a stage is whole only with
     every listed file at its size, the folder's other files go back at the swap, and the copy aside stays until the new copy has
     started. A pin before it carries the shapes these checks were first written for. Each check below that the engine moved at
     22d3af9c holds the shape the pin carries, Was for a pin before, Now from it on, as the engine's own install-plan-selftest
     moved them; tests/studio-installer-mends.mjs holds what Studio carries for the list. */
  const LISTED = HOOKS.indexOf("etiuda-files.ini") > -1;
  const macro = (text, name) => (new RegExp("\\n!macro " + name + "(?: [^\\n]*)?\\n([\\s\\S]*?)\\n!macroend").exec("\n" + String(text)) || [])[1] || "";
  const code = text => String(text).split("\n").filter(l => !/^\s*[#;]/.test(l)).join("\n");
  const at = (text, s) => String(text).indexOf(s);
  const defsOf = text => ["ETIUDA_STAGE_SUFFIX", "ETIUDA_ASIDE_SUFFIX"].map(n => (new RegExp("!define " + n + " \"([^\"]+)\"").exec(text) || [])[1] || "");
  const BESIDE = P.BESIDE || [".setup-staging", ".setup-previous"];

  /* 16a. The extract goes into the stage: after the links are read, before the app is closed, and the template's own write
     into the folder compiled only where no stage is defined. */
  const stagedFirst = (s, nsh) => {
    const stage = /\n!ifmacrodef etiudaStageBegin\n  !insertmacro etiudaStageBegin\n  !ifdef UNINSTALLER_ICON\n    File \/oname=uninstallerIcon\.ico "\$\{UNINSTALLER_ICON\}"\n  !endif\n  !insertmacro installApplicationFiles\n  !insertmacro etiudaStageEnd\n!endif\n/.exec(s);
    const link = at(s, "!insertmacro setLinkVars"), close = at(s, "!insertmacro CHECK_APP_RUNNING");
    const inPlaceOnlyWithout = /\nSetOutPath \$INSTDIR\n\n!ifmacrondef etiudaStageBegin\n  !ifdef UNINSTALLER_ICON\n[^\n]*\n  !endif\n\n  !insertmacro installApplicationFiles\n!endif\n/.test(s)
      && (s.match(/!insertmacro installApplicationFiles/g) || []).length === 2;
    const b = code(macro(nsh, "etiudaStageBegin"));
    const outs = b.match(/SetOutPath [^\n]*/g) || [];
    const into = outs[outs.length - 1] === "SetOutPath \"$etiudaStage\"" && /StrCpy \$etiudaBase \$INSTDIR\n/.test(b)
      && /StrCpy \$etiudaStage "\$etiudaBase\$\{ETIUDA_STAGE_SUFFIX\}"/.test(b) && !!defsOf(nsh)[0];
    return !!stage && link > -1 && stage.index > link && stage.index < close && inPlaceOnlyWithout && into;
  };
  ok(stagedFirst(S, NSH) && status.swapPatched === true,
    "16a the new files are extracted into <folder>" + defsOf(NSH)[0] + " beside the install, after the links are read and before the"
    + " app is closed, and the template's own write into the folder compiles only where no stage is defined: "
    + JSON.stringify(status.swapMissing || status.error || "no swapPatched"));
  ok(!stagedFirst(S.replace("!ifmacrondef etiudaStageBegin", "!ifmacrodef etiudaStageBegin"), NSH),
    "16a control: the template's write into the folder compiled beside the stage again reads red");
  ok(!stagedFirst(S, NSH.replace("  SetOutPath \"$etiudaStage\"\n!macroend", "  SetOutPath \"$INSTDIR\"\n!macroend")),
    "16a control: the extract pointed at the install folder again reads red");

  /* 16b. The older copy's uninstaller runs after the stage is complete and the swap is made, and only where it still has a
     folder of its own. */
  const oldAfter = s => {
    const end = at(s, "!insertmacro etiudaStageEnd"), swap = at(s, "!ifmacrodef etiudaSwap\n  !insertmacro etiudaSwap\n");
    const un = /\n  \$\{if\} \$etiudaRunOld == "1"\n    !insertmacro uninstallOldVersion SHELL_CONTEXT\n    !insertmacro handleUninstallResult SHELL_CONTEXT\n  \$\{endIf\}\n!else\n/.exec(s);
    const first = at(s, "!insertmacro uninstallOldVersion SHELL_CONTEXT");
    return end > -1 && swap > end && !!un && un.index > swap && first > swap;
  };
  ok(oldAfter(S), "16b the older copy's uninstaller is not run before every file is staged and the folders are swapped, and then only"
    + " while $etiudaRunOld is 1");
  ok(!oldAfter(S.replace("!insertmacro setLinkVars\n", "!insertmacro setLinkVars\n!insertmacro uninstallOldVersion SHELL_CONTEXT\n!insertmacro handleUninstallResult SHELL_CONTEXT\n")),
    "16b control: electron-builder's order put back, the uninstaller before the stage, reads red");

  /* 16c. A failed extract leaves the install folder untouched: nothing writes it before the swap, every way out before the
     swap takes back the stage and nothing else, and an incomplete stage is never swapped in. */
  const untouched = (s, x, nsh) => {
    const beforeSwap = s.slice(0, Math.max(0, at(s, "!ifmacrodef etiudaSwap")));
    const noWrite = at(s, "!ifmacrodef etiudaSwap") > -1 && beforeSwap.indexOf("SetOutPath $INSTDIR") < 0;
    const cancel = /\n\s*AbortExtract7za:\n\s*SetErrorLevel 1618\n!ifmacrodef etiudaStageAbort\n\s*!insertmacro etiudaStageAbort\n!endif\n\s*Quit\b/.test(x);
    const retry = /"\$\(appCannotBeClosed\)" \/SD IDCANCEL IDCANCEL AbortExtract7za[\s\S]*?\n!ifmacrodef etiudaStageAbort\n\s*StrCpy \$R1 0\n\s*Goto RetryExtract7za\n!endif\n\s*RMDir \/r "\$PLUGINSDIR\\7z-out"\n/.test(x);
    const close = /!ifmacrodef etiudaStageAbort\n\s*!insertmacro etiudaStageAbort\n\s*!endif\n\s*SetErrorLevel 1618\n\s*Quit\b/.test(macro(nsh, "customCheckAppRunning"));
    return noWrite && cancel && retry && close;
  };
  ok(untouched(S, X, NSH), "16c nothing writes the install folder before the swap, and the three ways out before it (Cancel on a locked"
    + " extract, the app still open, and Retry, which copies into the stage again rather than over the folder) keep the stage"
    + " from being half-swapped");
  ok(!untouched(S, X.replace(/(SetErrorLevel 1618\n)!ifmacrodef etiudaStageAbort\n\s*!insertmacro etiudaStageAbort\n!endif\n/, "$1"), NSH),
    "16c control: Cancel on a locked extract leaving the stage reads red");
  ok(!untouched(S, X.replace(/\n!ifmacrodef etiudaStageAbort\n\s*StrCpy \$R1 0\n\s*Goto RetryExtract7za\n!endif/, ""), NSH),
    "16c control: Retry falling through to the in-place overwrite that ignores errors reads red");
  ok(!untouched(S, X, NSH.replace(/(\n\s*)!ifmacrodef etiudaStageAbort\n\s*!insertmacro etiudaStageAbort\n\s*!endif(\n\s*SetErrorLevel 1618)/, "$2")),
    "16c control: the app still open leaving the stage reads red");
  const onlyStage = nsh => {
    const ab = code(macro(nsh, "etiudaStageAbort"));
    const gone = ab.match(/\b(RMDir|Delete|Rename|CopyFiles)\b[^\n]*|!insertmacro etiudaRemoveTree [^\n]*/g) || [];
    const b = code(macro(nsh, "etiudaStageBegin"));
    const touched = (b.match(/\b(RMDir|Delete|Rename|CopyFiles)\b[^\n]*|!insertmacro etiudaRemoveTree [^\n]*/g) || []).sort();
    return gone.length === 3 && gone[0] === "!insertmacro etiudaRemoveTree \"$etiudaStage\"" && gone.slice(1).every(l => l.indexOf("$LOCALAPPDATA\\") > -1)
      /* Was: the stage's start also removed the copy aside whole. Now (LISTED) it is cleared by its own list at the swap. */
      && JSON.stringify(touched) === JSON.stringify((LISTED ? [] : ["!insertmacro etiudaRemoveTree \"$etiudaAside\""])
        .concat(["!insertmacro etiudaRemoveTree \"$etiudaStage\"", "RMDir \"$etiudaBase\""]))
      && (b.match(/!insertmacro etiudaRenameRetry [^\n]*/g) || []).join() === "!insertmacro etiudaRenameRetry \"$etiudaAside\" \"$etiudaBase\"";
  };
  ok(onlyStage(NSH), "16c taking the stage back removes the stage and the updater's setup copy and nothing else, and the stage's start"
    + " clears only what an earlier run left beside the folder, after moving an older copy back where a swap was cut short");
  ok(!onlyStage(NSH.replace("    SetOutPath $PLUGINSDIR\n    !insertmacro etiudaRemoveTree \"$etiudaStage\"", "    SetOutPath $PLUGINSDIR\n    !insertmacro etiudaRemoveTree \"$INSTDIR\"")),
    "16c control: taking the stage back by removing the install folder reads red");
  const wholeOnly = nsh => {
    const e = code(macro(nsh, "etiudaStageEnd"));
    return /\$\{IfNot\} \$\{FileExists\} "\$etiudaStage\\\$\{APP_EXECUTABLE_FILENAME\}"/.test(e)
      && /\$\{IfNot\} \$\{FileExists\} "\$etiudaStage\\\$\{UNINSTALL_FILENAME\}"/.test(e)
      /* Was: at least 99 per cent of the size electron-builder measured. Now (LISTED): every listed file at its size. */
      && (LISTED ? /Call etiudaStageWhole\n\s*Pop \$0\n\s*\$\{If\} \$0 != "1"\n\s*StrCpy \$1 "0"/.test(e)
        : /\$\{GetSize\} "\$etiudaStage" "\/S=0K" \$0 \$3 \$4\n\s*IntOp \$0 \$0 \* 100\n\s*IntOp \$3 \$\{APP_64_UNPACKED_SIZE\} \* 99\n\s*\$\{If\} \$0 < \$3\n\s*StrCpy \$1 "0"/.test(e))
      && /\$\{If\} \$1 != "1"\n[\s\S]*?!insertmacro etiudaStageAbort\n[\s\S]*?SetErrorLevel 2\n\s*Quit\b/.test(e);
  };
  ok(wholeOnly(NSH), "16c a stage without the program, its uninstaller, or " + (LISTED ? "every file its list names at its size" : "99 per cent"
    + " of the size electron-builder measured") + " is taken back and the run ends 2 before the app is closed");
  ok(!wholeOnly(LISTED ? NSH.replace("  Call etiudaStageWhole\n", "") : NSH.replace("IntOp $3 ${APP_64_UNPACKED_SIZE} * 99", "IntOp $3 0 * 99")),
    "16c control: " + (LISTED ? "the stage judged without its list" : "the size left unchecked") + " reads red");

  /* 16d. The swap: out of both folders, the older copy aside, the stage into its place, and the older copy put back where the
     second rename will not go; each rename tried as a locked extract is. */
  const swapRestores = nsh => {
    const m = code(macro(nsh, "etiudaSwap"));
    const cwd = at(m, "SetOutPath $PLUGINSDIR"), aside = at(m, "!insertmacro etiudaRenameRetry \"$etiudaBase\" \"$etiudaAside\"");
    const into = at(m, "!insertmacro etiudaRenameRetry \"$etiudaStage\" \"$etiudaBase\""), back = at(m, "!insertmacro etiudaRenameRetry \"$etiudaAside\" \"$etiudaBase\"");
    const guarded = /\$\{If\} \$\{FileExists\} "\$etiudaBase\\\$\{APP_EXECUTABLE_FILENAME\}"\n\s*!insertmacro etiudaRenameRetry "\$etiudaBase" "\$etiudaAside"\n\s*\$\{If\} \$0 != "moved"\n[\s\S]*?!insertmacro etiudaStageAbort\n\s*SetErrorLevel 1618\n\s*Quit\n\s*\$\{EndIf\}\n\s*StrCpy \$etiudaAsideMade "1"/.test(m);
    const restore = /!insertmacro etiudaRenameRetry "\$etiudaStage" "\$etiudaBase"\n\s*\$\{If\} \$0 != "moved"\n\s*\$\{If\} \$etiudaAsideMade == "1"\n\s*!insertmacro etiudaRenameRetry "\$etiudaAside" "\$etiudaBase"\n\s*\$\{If\} \$0 != "moved"\n[\s\S]*?SetErrorLevel 2\n\s*Quit\n\s*\$\{EndIf\}\n\s*StrCpy \$etiudaAsideMade "0"\n\s*\$\{EndIf\}\n[\s\S]*?!insertmacro etiudaStageAbort\n\s*SetErrorLevel 1618\n\s*Quit\b/.test(m);
    const r = code(macro(nsh, "etiudaRenameRetry"));
    const tries = /Rename "\$\{FROM\}" "\$\{TO\}"/.test(r) && /\$\{If\} \$0 < 30\n\s*Sleep 2000/.test(r)
      && /MessageBox MB_RETRYCANCEL\|MB_ICONEXCLAMATION "\$\(appCannotBeClosed\)" \/SD IDCANCEL IDRETRY/.test(r);
    return cwd > -1 && cwd < aside && aside < into && into < back && guarded && restore && tries;
  };
  ok(swapRestores(NSH), "16d the swap leaves both folders first, sets the older copy aside, renames the stage into its place, and"
    + " where that will not go puts the older copy back and ends 1618 (2 only if even that fails); each rename tried 30 times 2 s apart");
  ok(!swapRestores(NSH.replace("        !insertmacro etiudaRenameRetry \"$etiudaAside\" \"$etiudaBase\"\n", "")),
    "16d control: the older copy left aside when the stage cannot take its place reads red");
  /* Was: from "Push $0, SetOutPath, ${If} ${FileExists}". Now (LISTED): from the swap's first lines, since a copy aside left by an
     earlier update is dropped by its list straight after SetOutPath. */
  ok(!swapRestores(LISTED ? NSH.replace("!macro etiudaSwap\n  Push $0\n  SetOutPath $PLUGINSDIR\n", "!macro etiudaSwap\n  Push $0\n")
    : NSH.replace("  Push $0\n  SetOutPath $PLUGINSDIR\n  ${If} ${FileExists} \"$etiudaBase", "  Push $0\n  ${If} ${FileExists} \"$etiudaBase")),
    "16d control: the installer still working inside the folder it renames reads red");

  /* 16e. The registration is never removed where the older copy's folder is the one replaced, and written again at once where it
     was elsewhere; the copy aside goes only after the new one is registered. */
  const keepsRegistration = (s, nsh) => {
    const m = code(macro(nsh, "etiudaSwap"));
    const same = /ReadRegStr \$0 SHELL_CONTEXT "\$\{INSTALL_REGISTRY_KEY\}" InstallLocation\n\s*!insertmacro etiudaTrimSlashes \$0\n\s*\$\{If\} \$0 == \$etiudaBase\n\s*StrCpy \$etiudaRunOld "0"/.test(m)
      && /StrCpy \$etiudaRunOld "1"/.test(code(macro(nsh, "etiudaStageBegin")));
    const swap = at(s, "  !insertmacro etiudaSwap\n"), reg = at(s, "!insertmacro registryAddInstallInfo");
    const cust = at(s, "!insertmacro customInstall\n"), drop = at(s, "  !insertmacro etiudaDropAside\n");
    const order = swap > -1 && reg > swap && cust > reg && drop > cust;
    const goesOn = ["customUnInstallCheck", "customUnInstallCheckCurrentUser"]
      .every(n => { const b = code(macro(nsh, n)); return !!b.trim() && !/\b(Quit|Abort|SetErrorLevel)\b/.test(b); });
    const d = code(macro(nsh, "etiudaDropAside"));
    /* Was: the copy aside went here, after customInstall. Now (LISTED): it stays until the new copy has started (shell/main.js
       setAsideDrop), so nothing here touches it. */
    const dropOnly = LISTED ? !/etiudaAside/.test(d) && (d.match(/\b(RMDir|Delete|Rename)\b|etiudaRemoveTree/g) || []).length === 0
      : /\$\{If\} \$etiudaAsideMade == "1"\n\s*!insertmacro etiudaRemoveTree "\$etiudaAside"\n\s*\$\{EndIf\}/.test(d)
        && (d.match(/\b(RMDir|Delete|Rename)\b|etiudaRemoveTree/g) || []).length === 1;
    return same && order && goesOn && dropOnly;
  };
  ok(keepsRegistration(S, NSH), "16e where the older copy was in the folder replaced its uninstaller is not run, so its registration stands"
    + " until written over; elsewhere it runs after the swap and a failure there is noted, not obeyed; "
    + (LISTED ? "the copy aside stays until the new copy has started" : "the copy aside goes after customInstall"));
  ok(!keepsRegistration(S, NSH.replace("${If} $0 == $etiudaBase", "${If} $0 == $etiudaStage")),
    "16e control: the uninstaller run over the folder just replaced reads red");
  ok(!keepsRegistration(S, NSH.replace("    DetailPrint `The older copy's uninstaller ended with $R0.`", "    SetErrorLevel 2\n    Quit")),
    "16e control: electron-builder's stop on an older uninstaller's failure put back reads red");
  ok(!keepsRegistration(S.replace("!insertmacro registryAddInstallInfo\n", "!insertmacro etiudaDropAside\n!insertmacro registryAddInstallInfo\n")
    .replace(/\n!ifmacrodef etiudaDropAside\n  !insertmacro etiudaDropAside\n!endif/, ""), NSH),
    "16e control: the copy aside dropped before the new one is registered reads red");

  /* 16f. Where the swap's macros live: in the installer compile alone, after customUnInstall, inside the pinned cut. */
  const placed = nsh => {
    const un = at(nsh, "\n!macro customUnInstall\n"), block = at(nsh, "\n!ifndef BUILD_UNINSTALLER\n!define ETIUDA_STAGE_SUFFIX");
    const last = at(nsh, "\n!macro etiudaDropAside\n"), end = last < 0 ? -1 : nsh.indexOf("\n!endif\n", last);
    const fn = at(nsh, "\nFunction etiudaDropOldFiles\n");
    return un > -1 && block > un && end > block && (fn < 0 || (fn > block && fn < end)) && ["etiudaTrimSlashes", "etiudaFailBox", "etiudaStageAbort", "etiudaStageBegin", "etiudaStageEnd",
      "etiudaRenameRetry", "etiudaSwap", "customUnInstallCheck", "customUnInstallCheckCurrentUser", "etiudaDropAside"]
      .every(n => { const i = at(nsh, "\n!macro " + n + "\n") > -1 ? at(nsh, "\n!macro " + n + "\n") : at(nsh, "\n!macro " + n + " "); return i > block && i < end; });
  };
  ok(placed(HOOKS), "16f the swap's macros are defined for the installer compile alone, after customUnInstall, in the pinned cut");
  ok(!placed(HOOKS.replace("\n!ifndef BUILD_UNINSTALLER\n!define ETIUDA_STAGE_SUFFIX", "\n!define ETIUDA_STAGE_SUFFIX")),
    "16f control: the block compiled into the uninstaller too reads red");

  /* 16g. The gate looks where the installer writes, and IT is told what an upgrade now does. */
  ok(JSON.stringify(defsOf(NSH)) === JSON.stringify(BESIDE),
    "16g the installer stages beside the folder under the suffixes update-install expects: " + JSON.stringify(defsOf(NSH)) + " against " + JSON.stringify(BESIDE));
  ok(JSON.stringify(defsOf(NSH.replace("\".setup-previous\"", "\".old\""))) !== JSON.stringify(BESIDE), "16g control: another suffix reads red");
  const doc = (/^[\s\S]*?(?=\r?\n## )/.exec(fs.readFileSync(path.join(ROOT, "docs", "silent-install.md"), "utf8")) || [""])[0];
  const told = d => d.indexOf(BESIDE[0]) > -1 && /a failed upgrade leaves the old version as it was/.test(d) && !/leave the app absent/.test(d);
  ok(told(doc), "16g docs/silent-install.md says an upgrade is staged in <folder>" + BESIDE[0] + " and a failed one leaves the old version as it was");
  ok(!told(doc + "\na failed upgrade can leave the app absent until the deployment tool retries."), "16g control: the old sentence back reads red");

  /* 16h. The person's shortcuts on an upgrade (Claude alpha's ruling, 2026-11-12 00:41): kept where the folder is unchanged,
     since their target still stands; made again where it changed. */
  const cfgText = fs.readFileSync(path.join(ROOT, "electron-builder.js"), "utf8");
  const keepsShortcuts = (s, nsh, tpl) => {
    const m = code(macro(nsh, "etiudaSwap"));
    const same = /\$\{If\} \$0 == \$etiudaBase\n\s*StrCpy \$etiudaRunOld "0"\n\s*StrCpy \$keepShortcuts "true"\n\s*\$\{Else\}\n/.test(m)
      && (m.match(/\$keepShortcuts/g) || []).length === 1;
    const decided = at(s, "StrCpy $keepShortcuts \"false\""), swap = at(s, "  !insertmacro etiudaSwap\n");
    const links = at(s, "!insertmacro addStartMenuLink $keepShortcuts"), desk = at(s, "!insertmacro addDesktopLink $keepShortcuts");
    const order = decided > -1 && swap > decided && links > swap && desk > links;
    const branches = ["addStartMenuLink", "addDesktopLink"].every(n => {
      const b = macro(tpl, n), f = b.search(/\$keepShortcuts\s+==\s+"false"/), c = b.indexOf("CreateShortCut"), e = b.indexOf("${elseif}");
      return f > -1 && c > f && e > c;
    }) && !/createDesktopShortcut\s*:\s*["']always/.test(cfgText);
    return same && order && branches;
  };
  ok(keepsShortcuts(S, NSH, I), "16h an upgrade into the folder already registered keeps the person's shortcuts as they are (the keep branch,"
    + " decided after the template's own choice and before the links are made); one into another folder makes them again at the new target");
  ok(!keepsShortcuts(S, NSH.replace("    StrCpy $keepShortcuts \"true\"\n", ""), I), "16h control: the shortcuts made again on an upgrade in place reads red");
  ok(!keepsShortcuts(S, NSH.replace("    StrCpy $keepShortcuts \"true\"\n  ${Else}\n", "  ${Else}\n    StrCpy $keepShortcuts \"true\"\n"), I),
    "16h control: the old shortcuts kept when the folder changed, their target gone, reads red");

  /* 16i. The older folder after an upgrade that changed the folder: only what the installer itself wrote goes, by its own list,
     the new folder it has just written; a folder only once empty; nothing retried, nothing failing the run. */
  const replayDrop = (nsh, fsys, locked, block, opt = {}) => {
    const body = (/\nFunction etiudaDropOldFiles\n([\s\S]*?)\nFunctionEnd/.exec(nsh) || [])[1];
    const mbody = block === undefined ? macro(nsh, "etiudaDropOld") : block;
    if (!body || !mbody) return null;
    const links = fsys.links || (fsys.links = new Map());
    const lines = code(body).split("\n").map(l => l.trim()).filter(Boolean);
    const mlines = code(mbody).split("\n").map(l => l.trim()).filter(Boolean);
    const labels = {};
    lines.forEach((l, i) => { if (/^\w+:$/.test(l)) labels[l.slice(0, -1)] = i; });
    const V = { $etiudaBase: opt.base || "N", $etiudaStage: "S", $etiudaDropRoot: "", $etiudaDropList: "", $R0: "", $R1: "", $R2: "", $R3: "", $0: "kept" }, stack = [], finds = [];
    const val = tok => tok.replace(/^"|"$/g, "").replace(/\$\{DIR\}/g, opt.dir || "O").replace(/\$\{APP_EXECUTABLE_FILENAME\}/g, "Etiuda Studio.exe")
      .replace(/\$(etiudaBase|etiudaStage|etiudaDropRoot|etiudaDropList|R[0-9]|[0-9])/g, (m) => V[m]);
    const follow = (p, last) => {
      for (let n = 0; n < 50; n++) {
        let moved = false;
        for (const [l, t] of links) {
          if (p.startsWith(l + "\\")) { p = t + p.slice(l.length); moved = true; break; }
          if (last && p === l) { p = t; moved = true; break; }
        }
        if (!moved) return p;
      }
      throw new Error("a link loop");
    };
    const parentOf = p => follow(p, false), fullOf = p => follow(p, true);
    const isDir = p => fsys.dirs.has(fullOf(p));
    const kids = p => { const d = fullOf(p); return [...fsys.dirs, ...fsys.files, ...links.keys()].filter(q => q.startsWith(d + "\\") && q.slice(d.length + 1).indexOf("\\") < 0).map(q => q.slice(d.length + 1)).sort(); };
    const attrs = p => { const q = parentOf(p); if (links.has(q)) return 0x410; const f = fullOf(p); return fsys.dirs.has(f) ? 0x10 : fsys.files.has(f) ? 0x20 : -1; };
    const unlinkOr = (p, then) => { const q = parentOf(p); if (links.has(q)) { links.delete(q); return; } then(q); };
    const del = p => unlinkOr(p, q => { if (!locked.has(q)) fsys.files.delete(q); });
    const rmdirOne = p => unlinkOr(p, q => { if (fsys.dirs.has(q) && kids(q).length === 0) fsys.dirs.delete(q); });
    const rmdirAll = p => {
      const d = fullOf(p);
      for (const [l, t] of [...links]) if (l.startsWith(d + "\\")) { links.delete(l); rmdirAll(t); }
      [...fsys.files, ...fsys.dirs].filter(q => q === d || q.startsWith(d + "\\")).forEach(q => { fsys.files.delete(q); fsys.dirs.delete(q); });
    };
    const removeTree = p => {
      const a = attrs(p);
      if (a === -1) return;
      if (a & 0x400) { unlinkOr(p, () => {}); return; }
      if (!(a & 0x10)) { del(p); return; }
      kids(p).forEach(k => removeTree(p + "\\" + k));
      rmdirOne(p);
    };
    const reg = r => (/^r(\d)$/.test(r) ? "$" + r.slice(1) : "$" + r);
    const sysAttr = l => { const m = /^System::Call 'kernel32::GetFileAttributesW\(w (\w+)\) i \.(\w+)'$/.exec(l); if (!m) return false; V[reg(m[2])] = String(attrs(V[reg(m[1])])); return true; };
    const toks = l => (l.match(/"[^"]*"|\S+/g) || []);
    const rmdir = t => (t[1] === "/r" ? rmdirAll(val(t[t.length - 1])) : rmdirOne(val(t[t.length - 1])));
    let steps = 0;
    const run = () => {
      for (let pc = 0; pc < lines.length; pc++) {
        if (++steps > 20000) throw new Error("runaway");
        const t = toks(lines[pc]), op = t[0], go = lab => { if (lab === "0" || lab === undefined) return; pc = labels[lab]; };
        if (/^\w+:$/.test(op)) continue;
        if (sysAttr(lines[pc])) continue;
        if (op === "Exch") { const top = stack.pop(); stack.push(V[t[1]]); V[t[1]] = top; }
        else if (op === "Push") stack.push(val(t[1]));
        else if (op === "Pop") V[t[1]] = stack.pop();
        else if (op === "StrCpy" && t.length === 3) V[t[1]] = val(t[2]);
        else if (op === "IntOp" && t[3] === "&") V[t[1]] = String(Number(val(t[2])) & Number(t[4]));
        else if (op === "IntCmp") { const a = Number(val(t[1])), b = Number(val(t[2])); go(a === b ? t[3] : a < b ? t[4] : t[5]); }
        else if (op === "FindFirst") { const dir = val(t[3]).replace(/\\\*\.\*$/, ""); finds.push(isDir(dir) ? [".", ".."].concat(kids(dir)) : []); V[t[1]] = String(finds.length - 1); V[t[2]] = finds[finds.length - 1].shift() || ""; }
        else if (op === "FindNext") V[t[2]] = finds[+V[t[1]]].shift() || "";
        else if (op === "FindClose") { /* nothing held */ }
        else if (op === "StrCmp") { if (val(t[1]) === val(t[2])) go(t[3]); else go(t[4]); }
        else if (op === "IfFileExists") { if (isDir(val(t[1]).replace(/\\\*\.\*$/, ""))) go(t[2]); else go(t[3]); }
        else if (op === "Goto") go(t[1]);
        else if (op === "Call") run();
        else if (op === "Delete") del(val(t[t.length - 1]));
        else if (op === "RMDir") rmdir(t);
        else throw new Error("the replay does not know " + op);
      }
    };
    const live = [];
    for (const l of mlines) {
      if (++steps > 20000) throw new Error("runaway");
      const on = live.every(Boolean), t = toks(l), op = t[0];
      if (op === "${If}") {
        const c = t.slice(1);
        let yes;
        if (c[0] === "${FileExists}") { const p = val(c[1]); yes = /\\\*\.\*$/.test(p) ? isDir(p.replace(/\\\*\.\*$/, "")) : (fsys.files.has(fullOf(p)) || isDir(p)); }
        else if (c[1] === "==" || c[1] === "!=") yes = (val(c[0]) === val(c[2])) === (c[1] === "==");
        else if (c[1] === "=") yes = Number(val(c[0])) === Number(val(c[2]));
        else throw new Error("the replay does not know the test " + l);
        live.push(on && yes);
        continue;
      }
      if (op === "${Else}") { const was = live.pop(); live.push(live.every(Boolean) && !was); continue; }
      if (op === "${EndIf}") { live.pop(); continue; }
      if (!on) continue;
      if (sysAttr(l)) continue;
      if (op === "Push") stack.push(val(t[1]));
      else if (op === "Pop") V[t[1]] = stack.pop();
      else if (op === "StrCpy" && t.length === 3) V[t[1]] = val(t[2]);
      else if (op === "IntOp" && t[3] === "&") V[t[1]] = String(Number(val(t[2])) & Number(t[4]));
      else if (op === "Call" && t[1] === "etiudaDropOldFiles") run();
      else if (op === "!insertmacro" && t[1] === "etiudaRemoveTree") removeTree(val(t[2]));
      else if (op === "RMDir") rmdir(t);
      else if (op === "ClearErrors" || op === "DetailPrint") { /* no flag held, nothing shown */ }
      else throw new Error("the replay does not know " + l);
    }
    if (stack.length || V.$0 !== "kept") throw new Error("the stack or $0 was not left as found");
    return fsys;
  };
  const tree = () => ({
    dirs: new Set(["N", "N\\resources", "N\\locales", "N\\swiftshader", "O", "O\\resources", "O\\locales", "O\\swiftshader"]),
    files: new Set(["N\\Etiuda Studio.exe", "N\\Uninstall Etiuda Studio.exe", "N\\resources\\app.asar", "N\\locales\\pl.pak", "N\\swiftshader\\vk.dll",
      "O\\Etiuda Studio.exe", "O\\Uninstall Etiuda Studio.exe", "O\\resources\\app.asar", "O\\resources\\gone-in-the-new.bin", "O\\locales\\pl.pak",
      "O\\locales\\gone-in-the-new.pak", "O\\swiftshader\\vk.dll", "O\\swiftshader\\gone-in-the-new.dll", "O\\my-notes.txt"]),
  });
  const newUntouched = r => [...r.files].filter(f => f.startsWith("N\\")).length === 5
    && ["N", "N\\resources", "N\\locales", "N\\swiftshader"].every(d => r.dirs.has(d));
  const dropsOwnOnly = nsh => {
    let r;
    try { r = replayDrop(nsh, tree(), new Set(["O\\Uninstall Etiuda Studio.exe"])); } catch (e) { return false; }
    if (!r) return false;
    const left = [...r.files].filter(f => f.startsWith("O\\")).sort();
    const planted = JSON.stringify(left) === JSON.stringify(["O\\Uninstall Etiuda Studio.exe", "O\\my-notes.txt", "O\\swiftshader\\gone-in-the-new.dll"])
      && r.dirs.has("O\\swiftshader") && r.dirs.has("O");
    let clean;
    try { const t2 = tree(); ["O\\swiftshader\\gone-in-the-new.dll", "O\\my-notes.txt"].forEach(f => t2.files.delete(f)); clean = replayDrop(nsh, t2, new Set()); } catch (e) { return false; }
    const allGone = ![...clean.files].some(f => f.startsWith("O\\")) && ![...clean.dirs].some(d => d === "O" || d.startsWith("O\\"));
    const d = code(macro(nsh, "etiudaDropOld"));
    const root = /\$\{If\} \$\{DIR\} != ""\n[\s\S]*?StrCpy \$etiudaDropRoot \$\{DIR\}\n[\s\S]*?Push ""\n\s*Call etiudaDropOldFiles\n[\s\S]*?\n\s*RMDir "\$etiudaDropRoot"\n/.test(d)
      && /ClearErrors/.test(d) && !/SetErrorLevel|Quit|Sleep|MessageBox|Rename|Delete/.test(d);
    const fnText = (/\nFunction etiudaDropOldFiles\n([\s\S]*?)\nFunctionEnd/.exec(nsh) || [])[1] || "";
    const quick = !/\b(Sleep|MessageBox|SetErrorLevel|Quit|Abort)\b|\/REBOOTOK|\/r\b/.test(code(fnText));
    return newUntouched(r) && newUntouched(clean) && planted && allGone && root && quick;
  };
  ok(dropsOwnOnly(NSH), "16i the older folder loses only the files the installer has just written by the same names, outside the two trees"
    + " that go whole (16l): a person's file and a file the new version no longer has stay, a locked one stays without a retry or a"
    + " failure, a folder goes only once empty, the new folder is never touched, and a folder holding nothing else goes whole");
  ok(!dropsOwnOnly(NSH.replace("FindFirst $R1 $R2 \"$etiudaDropList$R0\\*.*\"", "FindFirst $R1 $R2 \"$etiudaDropRoot$R0\\*.*\"")
    .replace("IfFileExists \"$etiudaDropList$R0\\$R2\\*.*\"", "IfFileExists \"$etiudaDropRoot$R0\\$R2\\*.*\"")),
    "16i control: the older folder's own listing taken as the list, so the person's file goes, reads red");
  ok(!dropsOwnOnly(NSH.replace("      RMDir \"$etiudaDropRoot$R0\\$R2\"", "      RMDir /r \"$etiudaDropRoot$R0\\$R2\"")),
    "16i control: a subfolder removed whole, with what the person put in it, reads red");
  const oldChosen = nsh => {
    const o = code(macro(nsh, "etiudaOldFolder")), s = code(macro(nsh, "etiudaSwap")), a = code(macro(nsh, "etiudaDropAside"));
    return /StrCpy \$\{OUT\} ""/.test(o) && /\$\{If\} \$3 >= 4\n\s*\$\{AndIf\} \$\{FileExists\} "\$\{DIR\}\\\$\{APP_EXECUTABLE_FILENAME\}"/.test(o)
      && (o.match(/\$\{If\} \$4 != \$[12]\n/g) || []).length === 2
      && /\$\{Else\}\n\s*!insertmacro etiudaOldFolder \$0 \$etiudaOldDir\n/.test(s)
      && /ReadRegStr \$0 HKCU "\$\{INSTALL_REGISTRY_KEY\}" InstallLocation\n\s*!insertmacro etiudaTrimSlashes \$0\n\s*!insertmacro etiudaOldFolder \$0 \$etiudaOldUserDir/.test(s)
      && /!insertmacro etiudaDropOld \$etiudaOldDir\n/.test(a) && /StrCpy \$R8 \$etiudaOldUserDir\n/.test(a)
      && /StrCpy \$etiudaOldDir ""\n\s*StrCpy \$etiudaOldUserDir ""/.test(code(macro(nsh, "etiudaStageBegin")));
  };
  ok(oldChosen(NSH), "16i the older folder is the one registered elsewhere (or this account's per-user copy an all-users install replaces),"
    + " read before its uninstaller runs, and only if it held the program and is no drive root, not the new folder, not inside it, not"
    + " holding it; it is emptied after the new copy is registered");
  ok(!oldChosen(NSH.replace("    ${If} $4 != $1\n", "    ${If} 1 == 1\n")), "16i control: a folder holding the new one taken as the older folder reads red");

  /* 16j. $INSTDIR trimmed once in init (Argon's review 5): customInit runs in .onInit after initMultiUser has read /D,
     before any page and the install section; the trim is unconditional before the first branch, silent or not. */
  const trimsInit = (nsh, nsi) => {
    const c = code(macro(nsh, "customInit")).split("\n").map(l => l.trim()).filter(Boolean);
    const trimAt = c.indexOf("!insertmacro etiudaTrimSlashes $INSTDIR"), branch = c.findIndex(l => /^\$\{(If|IfNot)\}/.test(l));
    const first = trimAt > -1 && branch > trimAt;
    const multi = at(nsi, "!insertmacro initMultiUser"), init = at(nsi, "!insertmacro customInit"), sect = at(nsi, "Section \"install\"");
    const order = multi > -1 && init > multi && sect > init;
    const loop = /StrCpy \$R9 \$\{VAR\} 1 -1\n\s*\$\{If\} \$R9 != "\\"\n\s*\$\{AndIf\} \$R9 != "\/"\n\s*\$\{ExitDo\}\n\s*\$\{EndIf\}\n\s*StrCpy \$\{VAR\} \$\{VAR\} -1\n/
      .test(code(macro(nsh, "etiudaTrimSlashes")));
    const wroteLoc = /WriteRegStr SHELL_CONTEXT "\$\{UNINSTALL_REGISTRY_KEY\}" "InstallLocation" "\$INSTDIR"/.test(code(macro(nsh, "customInstall")));
    const comparesRun = /StrCpy \$R8 `"\$INSTDIR\\\$\{APP_EXECUTABLE_FILENAME\}"`/.test(code(macro(nsh, "customUnInstall")));
    return first && order && loop && wroteLoc && comparesRun;
  };
  ok(trimsInit(NSH, T), "16j $INSTDIR loses a trailing backslash once, in customInit before its first branch, after initMultiUser has read"
    + " /D and before the install section sets $appExe, so InstallLocation written and the Run compare meet without a backslash");
  ok(!trimsInit(NSH.replace("  !insertmacro etiudaTrimSlashes $INSTDIR\n", ""), T),
    "16j control: the trim taken out, \"/D=C:\\Apps\\Etiuda Studio\\\" kept whole into $appExe, reads red");
  ok(!trimsInit(NSH.replace("  !insertmacro etiudaTrimSlashes $INSTDIR\n  ${IfNot} ${Silent}\n", "  ${IfNot} ${Silent}\n  !insertmacro etiudaTrimSlashes $INSTDIR\n"), T),
    "16j control: the trim made for an interactive run alone, a silent /D left untrimmed, reads red");

  /* 16k. A stage that survives its removal is refused (Argon's review 5, 7). */
  const refusesSurvivor = nsh => {
    const b = code(macro(nsh, "etiudaStageBegin"));
    const m = /\n\s*!insertmacro etiudaRemoveTree "\$etiudaStage"\n\s*\$\{If\} \$\{FileExists\} "\$etiudaStage\\\*\.\*"\n\s*\$\{OrIf\} \$\{FileExists\} "\$etiudaStage"\n([\s\S]*?)\n\s*\$\{EndIf\}\n\s*ClearErrors\n\s*CreateDirectory "\$etiudaStage"\n/.exec(b);
    if (!m) return false;
    const block = m[1];
    return /!insertmacro etiudaFailBox 1618\n\s*SetErrorLevel 1618\n\s*Quit$/.test(block.trim())
      && !/\b(RMDir|Delete|Rename|CopyFiles|CreateDirectory|SetOutPath)\b|etiudaStageAbort/.test(block)
      && at(b, "SetOutPath $PLUGINSDIR") > -1 && at(b, "SetOutPath $PLUGINSDIR") < m.index;
  };
  ok(refusesSurvivor(NSH), "16k a stage folder still there after its removal is refused before CreateDirectory: the run ends 1618, writes"
    + " nothing, and never renames another account's folder into place");
  ok(!refusesSurvivor(NSH.replace(/(\n  !insertmacro etiudaRemoveTree "\$etiudaStage"\n)(?:  #[^\n]*\n)*  \$\{If\} \$\{FileExists\} "\$etiudaStage\\\*\.\*"\n[\s\S]*?\n  \$\{EndIf\}\n/, "$1")),
    "16k control: the surviving folder reused, as at 5bff2b4d, reads red");
  ok(!refusesSurvivor(NSH.replace(/(is still there after its removal[^\n]*\n    !insertmacro etiudaFailBox 1618\n)    SetErrorLevel 1618\n    Quit\n/, "$1")),
    "16k control: the refusal noted and the run going on into that folder reads red");

  /* 16l. The older folder's resources and locales trees go whole where it held the program (Argon's review 5, 9). */
  const wholeTrees = nsh => {
    let r, bare;
    try {
      r = replayDrop(nsh, tree(), new Set());
      const t2 = tree(); t2.files.delete("O\\Etiuda Studio.exe"); bare = replayDrop(nsh, t2, new Set());
    } catch (e) { return false; }
    if (!r || !bare) return false;
    const gone = ["O\\resources", "O\\locales"].every(d => !r.dirs.has(d) && ![...r.files].some(f => f.startsWith(d + "\\")));
    const rootKept = r.dirs.has("O") && r.files.has("O\\my-notes.txt") && r.files.has("O\\swiftshader\\gone-in-the-new.dll");
    const heldBack = bare.files.has("O\\resources\\gone-in-the-new.bin") && bare.files.has("O\\locales\\gone-in-the-new.pak");
    const d = code(macro(nsh, "etiudaDropOld"));
    const rs = d.match(/!insertmacro etiudaRemoveTree [^\n]*/g) || [];
    const only = JSON.stringify(rs) === JSON.stringify(["!insertmacro etiudaRemoveTree \"$etiudaDropRoot\\resources\"", "!insertmacro etiudaRemoveTree \"$etiudaDropRoot\\locales\""])
      && !/RMDir \/r/.test(d);
    const held = at(d, "${FileExists} \"$etiudaDropRoot\\${APP_EXECUTABLE_FILENAME}\""), walk = at(d, "Call etiudaDropOldFiles");
    return gone && rootKept && heldBack && only && held > -1 && held < walk && walk < at(d, rs[0] || "\u0000");
  };
  ok(wholeTrees(NSH), "16l the older folder's resources and locales go whole where it held the program, a file only the older version"
    + " shipped with them; where it no longer holds the program they stay; the folder's own RMDir stays non-recursive");
  ok(!wholeTrees(NSH.replace("        !insertmacro etiudaRemoveTree \"$etiudaDropRoot\\resources\"\n        !insertmacro etiudaRemoveTree \"$etiudaDropRoot\\locales\"\n", "")),
    "16l control: the two trees left to the walk, as at 5bff2b4d, an older version's file keeping them, reads red");
  ok(!wholeTrees(NSH.replace("      ${If} ${FileExists} \"$etiudaDropRoot\\${APP_EXECUTABLE_FILENAME}\"\n        StrCpy $0 \"1\"\n      ${EndIf}\n", "      StrCpy $0 \"1\"\n")),
    "16l control: the trees removed from a folder that no longer holds the program reads red");
  ok(!wholeTrees(NSH.replace("      RMDir \"$etiudaDropRoot\"\n", "      RMDir /r \"$etiudaDropRoot\"\n")),
    "16l control: the older folder removed whole, a person's file with it, reads red");

  /* 16q. No link is entered in a folder another account may write (repair 10). */
  const SYS = (n, ...f) => ({ dirs: [n], files: f.map(x => n + "\\" + x) });
  const plant = (base, links, ...extra) => {
    const t = base; t.links = new Map(links);
    for (const e of extra) { e.dirs.forEach(d => t.dirs.add(d)); e.files.forEach(f => t.files.add(f)); }
    return t;
  };
  const noLinkEntered = nsh => {
    let below, mid, root;
    try {
      below = replayDrop(nsh, plant(tree(), [["O\\resources\\sub", "SYS1"]], SYS("SYS1", "keep.dll", "app.asar")), new Set());
      const t2 = tree();
      [...t2.files].filter(f => f.startsWith("O\\swiftshader\\")).forEach(f => t2.files.delete(f)); t2.dirs.delete("O\\swiftshader");
      mid = replayDrop(nsh, plant(t2, [["O\\swiftshader", "SYS2"]], SYS("SYS2", "vk.dll", "keep.dll")), new Set());
      const t3 = tree();
      [...t3.files].filter(f => f.startsWith("O\\")).forEach(f => t3.files.delete(f)); [...t3.dirs].filter(d => d === "O" || d.startsWith("O\\")).forEach(d => t3.dirs.delete(d));
      root = replayDrop(nsh, plant(t3, [["O", "SYS3"]], { dirs: ["SYS3", "SYS3\\resources", "SYS3\\locales"],
        files: ["SYS3\\Etiuda Studio.exe", "SYS3\\resources\\app.asar", "SYS3\\locales\\pl.pak"] }), new Set());
    } catch (e) { return false; }
    if (!below || !mid || !root) return false;
    const whole = (r, ...f) => f.every(x => r.files.has(x));
    return whole(below, "SYS1\\keep.dll", "SYS1\\app.asar") && !below.links.has("O\\resources\\sub") && !below.dirs.has("O\\resources")
      && whole(mid, "SYS2\\vk.dll", "SYS2\\keep.dll") && !mid.links.has("O\\swiftshader")
      && whole(root, "SYS3\\Etiuda Studio.exe", "SYS3\\resources\\app.asar", "SYS3\\locales\\pl.pak") && root.links.has("O")
      && newUntouched(below) && newUntouched(mid) && newUntouched(root);
  };
  ok(noLinkEntered(NSH), "16q no junction in the older folder is entered: one below resources, one standing where the new version has"
    + " a folder, and an older folder that is itself one are each removed as a link or left, the folders they point at whole");
  ok(!noLinkEntered(NSH.replace("        !insertmacro etiudaRemoveTree \"$etiudaDropRoot\\resources\"\n", "        RMDir /r \"$etiudaDropRoot\\resources\"\n")),
    "16q control: resources removed with RMDir /r again, as at 9cb2a8ff, the junction below it followed, reads red");
  ok(!noLinkEntered(NSH.replace(/(IfFileExists "\$etiudaDropList\$R0\\\$R2\\\*\.\*" 0 etiudaDropOldFile\n)[\s\S]*?\n      etiudaDropOldDir:\n/, "$1")),
    "16q control: the walk descending wherever the list has a folder, as at abb9c4c2, a junction there entered, reads red");
  ok(!noLinkEntered(NSH.replace("    ${If} $0 = 0x10\n", "    ${If} 0x10 = 0x10\n")),
    "16q control: an older folder that is itself a junction taken as a folder, the trees removed through it, reads red");

  /* A small LogicLib reader for 16m to 16o (repairs 3, 3b, 4 and 6). */
  const runLL = (text, w) => {
    const fsys = { dirs: new Set(w.dirs || []), files: new Set(w.files || []) };
    const V = Object.assign({}, w.V), locks = Object.assign({}, w.locks || {}), out = { exec: [], runs: [], drops: [], level: null, quit: false, V, fsys };
    const lines = code(text).split("\n").map(l => l.trim()).filter(Boolean);
    const val = s => String(s).replace(/^"([\s\S]*)"$|^`([\s\S]*)`$/, (m, a, b) => (a !== undefined ? a : b))
      .replace(/\$\{APP_EXECUTABLE_FILENAME\}/g, "Etiuda Studio.exe").replace(/\$\{APP_FILENAME\}/g, "Etiuda Studio").replace(/\$\{INSTALL_REGISTRY_KEY\}/g, "KEY")
      .replace(/\$(INSTDIR|appExe|installMode|etiuda[A-Za-z]+|R[0-9]|[0-9])/g, m => { if (!(m in V)) throw new Error("undeclared " + m); return V[m]; });
    const norm = p => p.replace(/\\{2,}/g, "\\").replace(/\\+$/, "");
    const has = p => fsys.files.has(norm(p)) || fsys.dirs.has(norm(p));
    const exists = p => (/\\\*\.\*$/.test(p) ? fsys.dirs.has(norm(p.replace(/\\\*\.\*$/, ""))) : has(p));
    const under = (q, p) => q === p || q.startsWith(p + "\\");
    const rename = (a, b) => {
      a = norm(a); b = norm(b);
      if (locks[a] > 0) { locks[a]--; return false; }
      if (!has(a) || has(b)) return false;
      for (const set of [fsys.files, fsys.dirs]) [...set].filter(q => under(q, a)).forEach(q => { set.delete(q); set.add(b + q.slice(a.length)); });
      return true;
    };
    const test = c => {
      if (c[0] === "${FileExists}") return exists(val(c[1]));
      if (c[0] === "${Silent}") return !!w.silent;
      if (c[0] === "${UAC_IsInnerInstance}") return !!w.inner;
      if (c[0] === "${UAC_IsAdmin}") return !!w.admin;
      if (c[1] === "==" || c[1] === "!=") return (val(c[0]).toLowerCase() === val(c[2]).toLowerCase()) === (c[1] === "==");
      throw new Error("the reader does not know the test " + c.join(" "));
    };
    const frames = [], stack = [];
    let asUser = 0, steps = 0;
    for (let k = 0; k < lines.length; k++) {
      if (++steps > 20000) throw new Error("runaway");
      const l = lines[k];
      if (l === "@asuser+") { asUser++; continue; }
      if (l === "@asuser-") { asUser--; continue; }
      const t = l.match(/"[^"]*"|`[^`]*`|\S+/g) || [], op = t[0], on = frames.every(f => f.v);
      if (op === "${If}" || op === "${IfNot}") { frames.push({ v: on && (test(t.slice(1)) === (op === "${If}")), on }); continue; }
      if (op === "${AndIf}" || op === "${AndIfNot}") { const f = frames[frames.length - 1]; f.v = f.v && f.on && (test(t.slice(1)) === (op === "${AndIf}")); continue; }
      if (op === "${OrIf}") { const f = frames[frames.length - 1]; f.v = f.on && (f.v || test(t.slice(1))); continue; }
      if (op === "${Else}" || op === "!else") { const f = frames[frames.length - 1]; f.v = f.on && !f.v; continue; }
      if (op === "${EndIf}" || op === "!endif") { frames.pop(); continue; }
      if (op === "!ifmacrodef") { frames.push({ v: t.slice(1).filter(x => x !== "&").every(x => (w.macros || []).includes(x)), on }); continue; }
      if (!on) continue;
      if (op === "!insertmacro" && (w.expand || []).includes(t[1])) {
        if (!(w.macros || []).includes(t[1])) throw new Error("no macro " + t[1]);
        lines.splice(k + 1, 0, ...code(macro(w.nsh, t[1])).split("\n").map(x => x.trim()).filter(Boolean));
        continue;
      }
      if (op === "!insertmacro" && t[1] === "etiudaAsUser") {
        V.$R9 = "unreached";
        if (w.inner && w.outer) lines.splice(k + 1, 0, "@asuser+", ...code(macro(w.nsh, t[2])).split("\n").map(x => x.trim()).filter(Boolean), "@asuser-");
        continue;
      }
      if (op === "Push") stack.push(val(t[1]));
      else if (op === "Pop") V[t[1]] = stack.pop();
      else if (op === "StrCpy" && t.length === 3) V[t[1]] = val(t[2]);
      else if (op === "ReadRegStr" && val(t[3]) === "KEY" && t[4] === "InstallLocation") V[t[1]] = (w.reg || {})[t[2]] || "";
      else if (op === "!insertmacro" && t[1] === "etiudaTrimSlashes") V[t[2]] = V[t[2]].replace(/[\\/]+$/, "");
      else if (op === "!insertmacro" && t[1] === "etiudaRenameRetry") {
        let moved = false;
        for (let i = 0; i < 30 && !moved; i++) moved = rename(val(t[2]), val(t[3]));
        V.$0 = moved ? "moved" : "stuck";
      }
      else if (op === "Rename") rename(val(t[1]), val(t[2]));
      else if ((op === "RMDir" && t[1] === "/r") || (op === "!insertmacro" && t[1] === "etiudaRemoveTree")) {
        const p = norm(val(t[2])); for (const set of [fsys.files, fsys.dirs]) [...set].filter(q => under(q, p)).forEach(q => set.delete(q));
      }
      else if (op === "RMDir") { const p = norm(val(t[1])); if (fsys.dirs.has(p) && ![...fsys.files, ...fsys.dirs].some(q => q.startsWith(p + "\\"))) fsys.dirs.delete(p); }
      else if (op === "!insertmacro" && t[1] === "etiudaDropOld") out.drops.push({ dir: val(t[2]), asUser: asUser > 0 });
      else if (op === "nsExec::Exec") { const c = val(t[t.length - 1]); out.exec.push(c); out.runs.push({ cmd: c, asUser: asUser > 0 }); stack.push("0"); }
      else if (op === "SetErrorLevel") out.level = t[1];
      else if (op === "Quit") { out.quit = true; return out; }
      else if (op === "DetailPrint" || (op === "!insertmacro" && t[1] === "etiudaFailBox")) { /* nothing shown here */ }
      else throw new Error("the reader does not know " + l);
    }
    return out;
  };
  const withApp = d => ({ dirs: [d, d + "\\resources"], files: [d + "\\Etiuda Studio.exe", d + "\\resources\\app.asar"] });
  const join = (...ws) => ({ dirs: [].concat(...ws.map(x => x.dirs || [])), files: [].concat(...ws.map(x => x.files || [])) });
  const holds = (r, d) => r.fsys.files.has(d + "\\Etiuda Studio.exe") && r.fsys.files.has(d + "\\resources\\app.asar");

  /* 16m. An older copy left aside goes back by the program's presence, with the swap's retry, and is never removed while it is
     the only copy (repair 4). */
  const asideSeg = nsh => {
    const b = code(macro(nsh, "etiudaStageBegin")), from = at(b, "SetOutPath $PLUGINSDIR");
    /* Now (LISTED): the segment ends before the refusal of a folder that is not ours, which the engine's installer-mends im1e holds. */
    const refusal = LISTED ? at(b, "${If} ${FileExists} \"$etiudaBase\\*.*\"") : -1;
    const to2 = refusal > -1 ? refusal : at(b, "!insertmacro etiudaRemoveTree \"$etiudaStage\"");
    return from > -1 && to2 > from ? b.slice(from + "SetOutPath $PLUGINSDIR".length, to2) : "";
  };
  const restoresAside = nsh => {
    const seg = asideSeg(nsh);
    if (!seg) return false;
    const V = { $etiudaBase: "B", $etiudaAside: "A", $etiudaStage: "S", $0: "x" };
    let r;
    try {
      r = {
        cutShort: runLL(seg, Object.assign({ V }, withApp("A"))),
        emptyLeft: runLL(seg, Object.assign({ V }, join(withApp("A"), { dirs: ["B"] }))),
        strayLeft: runLL(seg, Object.assign({ V }, join(withApp("A"), { dirs: ["B"], files: ["B\\stray.log"] }))),
        stuck: runLL(seg, Object.assign({ V, locks: { A: 1000 } }, withApp("A"))),
        briefLock: runLL(seg, Object.assign({ V, locks: { A: 3 } }, withApp("A"))),
        both: runLL(seg, Object.assign({ V }, join(withApp("A"), withApp("B")))),
        none: runLL(seg, Object.assign({ V }, withApp("B"))),
      };
    } catch (e) { return false; }
    const goesOn = x => !x.quit, refused = x => x.quit && x.level === "1618";
    return goesOn(r.cutShort) && holds(r.cutShort, "B") && !r.cutShort.fsys.dirs.has("A")
      && goesOn(r.emptyLeft) && holds(r.emptyLeft, "B")
      && refused(r.strayLeft) && holds(r.strayLeft, "A") && r.strayLeft.fsys.files.has("B\\stray.log")
      && refused(r.stuck) && holds(r.stuck, "A")
      && goesOn(r.briefLock) && holds(r.briefLock, "B")
      /* Was: the copy aside was removed here once the folder held the program. Now (LISTED): it stays for the swap, which drops it
         by its own list. */
      && goesOn(r.both) && holds(r.both, "B") && (LISTED ? r.both.fsys.dirs.has("A") : !r.both.fsys.dirs.has("A"))
      && goesOn(r.none) && holds(r.none, "B");
  };
  ok(restoresAside(NSH), "16m an older copy aside with no program in the folder goes back with the swap's retry, into the folder only where"
    + " it is gone or empty; one that cannot go back (a file left in the folder, a lasting lock) ends the run 1618 with the copy aside as it"
    + " was; " + (LISTED ? "where the folder holds the program it stays for the swap to drop by its list" : "it is removed only where the folder holds the program"));
  const asideAt9cb = "\n  ${IfNot} ${FileExists} \"$etiudaBase\\*.*\"\n  ${AndIf} ${FileExists} \"$etiudaAside\\${APP_EXECUTABLE_FILENAME}\"\n"
    + "    Rename \"$etiudaAside\" \"$etiudaBase\"\n  ${EndIf}";
  ok(!restoresAside(NSH.replace(LISTED ? /\n  \$\{If\} \$\{FileExists\} "\$etiudaAside\\\$\{APP_EXECUTABLE_FILENAME\}"\n[\s\S]*?(?=\n  # AN INSTALL NEVER REMOVES)/
    : /\n  \$\{If\} \$\{FileExists\} "\$etiudaAside\\\$\{APP_EXECUTABLE_FILENAME\}"\n[\s\S]*?(?=\n  !insertmacro etiudaRemoveTree "\$etiudaAside")/, () => asideAt9cb)),
    "16m control: 9cb2a8ff's lines put back, the move back only into a folder wholly absent and the copy aside then removed regardless, reads red");
  ok(!restoresAside(NSH.replace("      !insertmacro etiudaRenameRetry \"$etiudaAside\" \"$etiudaBase\"\n", "      Rename \"$etiudaAside\" \"$etiudaBase\"\n")),
    "16m control: one plain Rename in place of the retry, a brief lock then ending the run, reads red");
  ok(!restoresAside(NSH.replace(/\n  \$\{If\} \$\{FileExists\} "\$etiudaAside\\\$\{APP_EXECUTABLE_FILENAME\}"\n  \$\{AndIfNot\} \$\{FileExists\} "\$etiudaBase\\\$\{APP_EXECUTABLE_FILENAME\}"\n    DetailPrint[\s\S]*?\n    Quit\n  \$\{EndIf\}/, "")),
    "16m control: the refusal taken out, the only copy then removed with the copy aside, reads red");

  /* 16n. The running Studio is asked to close through a copy of the program the run can reach, and no program a non-administrator
     may write runs elevated (repairs 3 and 3b). */
  const closeSeg = nsh => {
    const m = code(macro(nsh, "customCheckAppRunning"));
    const own = at(m, "/FI \"USERNAME eq %USERNAME%\" /FI \"IMAGENAME eq");
    const from = own < 0 ? -1 : m.indexOf("${If} ${FileExists} \"$INSTDIR\\${APP_EXECUTABLE_FILENAME}\"", own);
    const to2 = m.indexOf("nsExec::Exec `\"$SYSDIR\\cmd.exe\" /C \"$SYSDIR\\taskkill.exe\"", from);
    return from > -1 && to2 > from ? m.slice(from, to2) : "";
  };
  const closesThrough = nsh => {
    const seg = closeSeg(nsh);
    if (!seg) return false;
    const swap = ["etiudaAskClose", "_UAC_IsInnerInstance", "etiudaStageBegin", "etiudaAsUser"], expand = ["etiudaAskClose"];
    const V = { $INSTDIR: "N", $R4: "", $R8: "", $R9: "msg", $etiudaStage: "N.setup-staging", $0: "" };
    const plainV = { $INSTDIR: "N", $R4: "", $R8: "", $R9: "msg", $0: "" };
    const stage = withApp("N.setup-staging");
    const asked = r => r.runs.map(x => ((/^"([^"]*)" --update-close$/.exec(x.cmd) || [])[1] || "?").replace(/\\{2,}/g, "\\") + (x.asUser ? " (as the person)" : "")).join(" + ");
    const run = (o, fsw) => runLL(seg, Object.assign({ nsh, expand }, o, fsw));
    let r, kept;
    try {
      const inner = run({ V, macros: swap, inner: true, outer: true, reg: { HKCU: "U" } }, join(withApp("U"), stage));
      kept = inner.V.$R9 === "msg";
      r = {
        inPlace: asked(run({ V, macros: swap }, join(withApp("N"), stage))),
        moved: asked(run({ V, macros: swap, reg: { HKCU: "U" } }, join(withApp("U"), stage))),
        toAllUsers: asked(inner),
        innerInPlace: asked(run({ V, macros: swap, inner: true, outer: true, reg: { HKCU: "U" } }, join(withApp("N"), withApp("U"), stage))),
        innerStale: asked(run({ V, macros: swap, inner: true, outer: true, reg: { HKCU: "Gone" } }, stage)),
        unreached: asked(run({ V, macros: swap, inner: true, outer: false, reg: { HKCU: "U" } }, join(withApp("U"), stage))),
        emptyKey: asked(run({ V, macros: swap, inner: true, outer: true, reg: {} }, { files: ["\\Etiuda Studio.exe"] })),
        noMacro: asked(run({ V: plainV, macros: [] }, withApp("N"))),
        noMacroMoved: asked(run({ V: plainV, macros: [], reg: { HKCU: "U" } }, withApp("U"))),
      };
    } catch (e) { return false; }
    return kept && r.inPlace === "N\\Etiuda Studio.exe" && r.moved === "N.setup-staging\\Etiuda Studio.exe"
      && r.toAllUsers === "U\\Etiuda Studio.exe (as the person)" && r.innerInPlace === "N\\Etiuda Studio.exe (as the person)"
      && r.innerStale === "N.setup-staging\\Etiuda Studio.exe (as the person)" && r.unreached === "" && r.emptyKey === ""
      && r.noMacro === "N\\Etiuda Studio.exe" && r.noMacroMoved === "";
  };
  ok(closesThrough(NSH), "16n --update-close goes, in the inner instance of an all-users install, from the unelevated one as the person"
    + " ($INSTDIR's program, else the one that person's HKCU names, else the staged one; nothing where it cannot be reached); in any other"
    + " run through $INSTDIR's program, else the staged one, never HKCU's; and without the macro through $INSTDIR's alone");
  ok(!closesThrough(NSH.replace("    !insertmacro etiudaAsUser etiudaAskCloseRun\n", "    !insertmacro etiudaAskCloseRun\n")),
    "16n control: the HKCU program run in the elevated instance, as f4cc93fb did (board 995's class), reads red");
  ok(!closesThrough(NSH.replace("        !ifmacrodef etiudaAskClose & _UAC_IsInnerInstance\n          !insertmacro etiudaAskClose\n        !else\n", "        !insertmacro etiudaAskClose\n        !ifmacrodef etiudaAskClose_none\n")),
    "16n control: the macro inserted unguarded, where an uninstaller without UAC.nsh would fail to compile, reads red");
  ok(!closesThrough(NSH.replace("    ${If} $R9 != \"\"\n    ${AndIf} ${FileExists} \"$R9\\${APP_EXECUTABLE_FILENAME}\"", "    ${If} ${FileExists} \"$R9\\${APP_EXECUTABLE_FILENAME}\"")),
    "16n control: an empty InstallLocation taken as a folder, the program at the drive's root asked, reads red");
  ok(!closesThrough(NSH.replace(/(!macro etiudaAskClose\n  \$\{If\} \$\{UAC_IsInnerInstance\}\n)    Push \$R9\n([\s\S]*?)    Pop \$R9\n/, "$1$2")),
    "16n control: the close check's Retry text in $R9 left overwritten by the person's side, reads red");

  /* 16o. An interactive Update goes back into the registered folder that instFilesPre nested (repair 6). */
  const nestSeg = nsh => {
    const b = code(macro(nsh, "etiudaStageBegin")), to2 = at(b, "StrCpy $etiudaBase $INSTDIR");
    return to2 > -1 ? b.slice(0, to2) : "";
  };
  const unnests = (nsh, s, a) => {
    const seg = nestSeg(nsh);
    const pre = (/\n\s*Function instFilesPre\n([\s\S]*?)\n\s*FunctionEnd/.exec(a) || [])[1] || "";
    const nests = /\$\{StrContains\} \$0 "\$\{APP_FILENAME\}" \$INSTDIR\n\s*\$\{If\} \$0 == ""\n\s*StrCpy \$INSTDIR "\$INSTDIR\\\$\{APP_FILENAME\}"/.test(pre)
      && /allowToChangeInstallationDirectory\s*:\s*true/.test(cfgText);
    const order = at(s, "StrCpy $appExe \"$INSTDIR\\${APP_EXECUTABLE_FILENAME}\"") > -1
      && at(s, "StrCpy $appExe \"$INSTDIR\\${APP_EXECUTABLE_FILENAME}\"") < at(s, "!insertmacro etiudaStageBegin");
    if (!seg || !nests || !order) return false;
    const V = { $INSTDIR: "D\\Etiuda Studio", $appExe: "D\\Etiuda Studio\\Etiuda Studio.exe", $0: "x" };
    const run = (o, fsw) => runLL(seg, Object.assign({ V }, o, fsw));
    let r;
    try {
      r = {
        nested: run({ reg: { SHELL_CONTEXT: "D\\" } }, join(withApp("D"), { dirs: ["D\\Etiuda Studio"] })),
        silent: run({ silent: true, reg: { SHELL_CONTEXT: "D" } }, withApp("D")),
        realThere: run({ reg: { SHELL_CONTEXT: "D" } }, join(withApp("D"), withApp("D\\Etiuda Studio"))),
        noProgram: run({ reg: { SHELL_CONTEXT: "D" } }, { dirs: ["D"] }),
        other: run({ reg: { SHELL_CONTEXT: "E" } }, withApp("E")),
      };
    } catch (e) { return false; }
    const kept = x => x.V.$INSTDIR === "D\\Etiuda Studio" && x.V.$appExe === "D\\Etiuda Studio\\Etiuda Studio.exe" && !x.quit;
    return r.nested.V.$INSTDIR === "D" && r.nested.V.$appExe === "D\\Etiuda Studio.exe" && !r.nested.quit
      && kept(r.silent) && kept(r.realThere) && kept(r.noProgram) && kept(r.other);
  };
  ok(unnests(NSH, S, A), "16o an interactive Update that instFilesPre nested into <registered folder>\\Etiuda Studio installs into the registered"
    + " folder, $appExe with it, where that folder holds the program and the nested one does not; a silent /D, a real copy in the nested folder,"
    + " or a registered folder without the program keeps $INSTDIR");
  ok(!unnests(NSH.replace("      StrCpy $appExe \"$INSTDIR\\${APP_EXECUTABLE_FILENAME}\"\n", ""), S, A),
    "16o control: $INSTDIR moved back and $appExe left on the nested path reads red");
  ok(!unnests(NSH.replace("  ${IfNot} ${Silent}\n    ReadRegStr $0 SHELL_CONTEXT", "  ${If} 1 == 1\n    ReadRegStr $0 SHELL_CONTEXT"), S, A),
    "16o control: a silent /D, the deployment tool's own choice, moved too reads red");
  ok(!unnests(NSH.replace("    ${AndIfNot} ${FileExists} \"$INSTDIR\\${APP_EXECUTABLE_FILENAME}\"\n", ""), S, A),
    "16o control: a real copy in the nested folder taken over reads red");
  const toldNested = d => /names a folder inside or above the registered one keeps the old copy there,\s+no longer registered, to be removed by hand\./.test(d);
  ok(toldNested(doc), "16o docs/silent-install.md says a deployment tool naming a folder inside or above the registered one keeps the old copy there, unregistered");
  ok(!toldNested(doc.replace("keeps the old copy there", "moves the old copy")), "16o control: the sentence gone or changed reads red");

  /* 16p. A copy cut short is taken back by the staged names (repair 8). */
  const takesBack = nsh => {
    const m = code(macro(nsh, "etiudaSwap"));
    const blk = /CopyFiles \/SILENT "\$etiudaStage\\\*\.\*" "\$etiudaBase"\n\s*\$\{If\} \$\{Errors\}\n([\s\S]*?)\n\s*!insertmacro etiudaStageAbort\n\s*SetErrorLevel 1618\n\s*Quit\n/.exec(m);
    const asideOnce = (m.match(/etiudaRenameRetry "\$etiudaBase" "\$etiudaAside"/g) || []).length === 1
      && /\$\{If\} \$\{FileExists\} "\$etiudaBase\\\$\{APP_EXECUTABLE_FILENAME\}"\n\s*!insertmacro etiudaRenameRetry "\$etiudaBase" "\$etiudaAside"/.test(m);
    if (!blk || !asideOnce) return false;
    const fsys = {
      dirs: new Set(["S", "S\\resources", "S\\locales", "N", "N\\resources", "N\\locales", "N\\notes"]),
      files: new Set(["S\\Etiuda Studio.exe", "S\\Uninstall Etiuda Studio.exe", "S\\resources\\app.asar", "S\\locales\\pl.pak",
        "N\\Etiuda Studio.exe", "N\\resources\\app.asar", "N\\locales\\pl.pak", "N\\resources\\mine.txt", "N\\deploy.log", "N\\notes\\mine.txt"]),
    };
    let r;
    try { r = replayDrop(nsh, fsys, new Set(), blk[1]); } catch (e) { return false; }
    if (!r) return false;
    const left = [...r.files].filter(f => f.startsWith("N\\")).sort();
    return JSON.stringify(left) === JSON.stringify(["N\\deploy.log", "N\\notes\\mine.txt", "N\\resources\\mine.txt"])
      && r.dirs.has("N") && r.dirs.has("N\\notes") && r.dirs.has("N\\resources") && !r.dirs.has("N\\locales")
      && [...r.files].filter(f => f.startsWith("S\\")).length === 4;
  };
  ok(takesBack(NSH), "16p a copy into a folder holding no program that fails is taken back by the staged names before the stage goes: the"
    + " person's files there stay, the half-copied program goes, and such a folder is never set aside");
  ok(!takesBack(NSH.replace(/(      DetailPrint `Cannot copy the staged files into "\$etiudaBase"[^\n]*\n)[\s\S]*?(\n      !insertmacro etiudaStageAbort\n)/, "$1$2")),
    "16p control: the failed copy left half-written reads red");
  ok(!takesBack(NSH.replace("      StrCpy $etiudaDropList $etiudaStage\n", "      StrCpy $etiudaDropList $etiudaBase\n")),
    "16p control: the folder's own listing taken as the list, the person's files deleted, reads red");
  ok(!takesBack(NSH.replace("  ${If} ${FileExists} \"$etiudaBase\\${APP_EXECUTABLE_FILENAME}\"\n    !insertmacro etiudaRenameRetry \"$etiudaBase\" \"$etiudaAside\"",
    "  ${If} ${FileExists} \"$etiudaBase\\*.*\"\n    !insertmacro etiudaRenameRetry \"$etiudaBase\" \"$etiudaAside\"")),
    "16p control: any folder with files set aside, a person's files then removed with the aside, reads red");

  /* 16r. Nothing may Quit between the swap and the registration (repair 1). */
  const TPL = {};
  try {
    const lab2 = fs.mkdtempSync(path.join(osx.tmpdir(), "studio-nsis-quit-"));
    const to2 = path.dirname(patchTool.getPaths(lab2).multiUserUi);
    fs.cpSync(path.dirname(patchTool.getPaths(ROOT).multiUserUi), to2, { recursive: true });
    patchTool.applyNsisPatches(lab2);
    const walk = (d, rel) => fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
      const r = rel ? rel + "/" + e.name : e.name;
      if (e.isDirectory()) return walk(path.join(d, e.name), r);
      if (/\.(nsh|nsi)$/i.test(e.name)) TPL[r] = fs.readFileSync(path.join(d, e.name), "utf8").replace(/\r\n/g, "\n");
    });
    walk(to2, "");
    fs.rmSync(lab2, { recursive: true, force: true });
  } catch (e) { /* an empty TPL reads red below */ }
  const noQuitAfterSwap = (nsh, tpl) => {
    const sec = tpl["installSection.nsh"] || "", from = at(sec, "  !insertmacro etiudaSwap\n"), to3 = at(sec, "!insertmacro registryAddInstallInfo");
    if (from < 0 || to3 < from) return { ok: false, why: "no region" };
    const texts = [nsh].concat(Object.keys(tpl).filter(f => !/^(portable\.nsi|oneClick\.nsh)$/.test(f)).map(f => tpl[f]));
    const defs = new Set(texts.flatMap(t => (t.match(/^[ \t]*!macro[ \t]+\w+/gm) || []).map(l => l.trim().split(/\s+/)[1])));
    const nshMacros = new Set((nsh.match(/^[ \t]*!macro[ \t]+\w+/gm) || []).map(l => l.trim().split(/\s+/)[1]));
    const findMacro = name => {
      for (const t of texts) {
        const m = new RegExp("\\n[ \\t]*!macro " + name + "((?:[ \\t]+\\w+)*)[ \\t]*\\n([\\s\\S]*?)\\n[ \\t]*!macroend").exec("\n" + t);
        if (m) return { params: m[1].trim() ? m[1].trim().split(/\s+/) : [], body: m[2] };
      }
      return null;
    };
    const findFn = name => {
      for (const t of texts) { const m = new RegExp("\\nFunction " + name + "\\n([\\s\\S]*?)\\nFunctionEnd").exec("\n" + t); if (m) return m[1]; }
      return null;
    };
    const live = body => {
      const out = [], st = [];
      for (const raw of String(body).split("\n")) {
        const l = raw.trim();
        if (!l || /^[#;]/.test(l)) continue;
        const m = /^!(ifmacrodef|ifmacrondef|ifdef|ifndef|if)\b\s*(\S*)/.exec(l);
        if (m) { st.push(m[1] === "ifmacrodef" ? defs.has(m[2]) : m[1] === "ifmacrondef" ? !defs.has(m[2]) : null); continue; }
        if (/^!else\b/.test(l)) { const v = st.pop(); st.push(v === null ? null : !v); continue; }
        if (/^!endif\b/.test(l)) { st.pop(); continue; }
        if (st.every(v => v !== false)) out.push(l);
      }
      return out;
    };
    const quits = [], unknown = [], seen = new Set();
    const handled = key => {
      const fn = findFn("handleUninstallResult") || "";
      const name = key === "SHELL_CONTEXT" ? "customUnInstallCheck" : "customUnInstallCheckCurrentUser";
      const shape = new RegExp("\"\\$rootKey_uninstallResult\" == \"" + key + "\"\\n\\s*!ifmacrodef " + name + "\\n\\s*!insertmacro " + name + "\\n\\s*Return\\n").test(fn);
      return shape && nshMacros.has(name) ? name : null;
    };
    const visit = (lines, depth, where) => {
      if (depth > 14) { unknown.push("too deep at " + where); return; }
      for (const l of lines) {
        if (/^(Quit|Abort)\b/i.test(l) || /\$\{\|\}\s*(Quit|Abort)\b/i.test(l)) quits.push(where + ": " + l);
        let m = /^!insertmacro\s+(\S+)\s*(.*)$/i.exec(l), name, args = [];
        const c = /^Call\s+(\S+)$/i.exec(l);
        if (m) { name = m[1]; args = (m[2].match(/"[^"]*"|`[^`]*`|\S+/g) || []); }
        if (!m && !c) continue;
        if (m && name === "handleUninstallResult") {
          const via = handled(args[0]);
          if (!via) { quits.push(where + ": handleUninstallResult " + args[0] + " reaches the template's Quit"); continue; }
          name = via; args = [];
        }
        const key = (c ? "fn:" + c[1] : name + " " + args.join(" "));
        if (seen.has(key)) continue;
        seen.add(key);
        if (c) {
          if (/^:/.test(c[1]) || c[1] === "handleUninstallResult") continue;
          const fb = findFn(c[1]);
          if (fb === null) { unknown.push(where + ": Call " + c[1]); continue; }
          visit(live(fb), depth + 1, c[1]);
          continue;
        }
        const mm = findMacro(name);
        if (!mm) { unknown.push(where + ": !insertmacro " + name); continue; }
        let body = mm.body;
        mm.params.forEach((p, k) => { body = body.split("${" + p + "}").join((args[k] || "").replace(/^"|"$/g, "")); });
        visit(live(body), depth + 1, name);
      }
    };
    visit(live(sec.slice(from + "  !insertmacro etiudaSwap\n".length, to3)), 0, "installSection.nsh");
    const sw = live(macro(nsh, "etiudaSwap")), post = sw.indexOf("ReadRegStr $0 SHELL_CONTEXT \"${INSTALL_REGISTRY_KEY}\" InstallLocation");
    const swapQuits = sw.map((l, i) => (/^Quit\b/.test(l) ? i : -1)).filter(i => i > -1);
    if (post < 0 || swapQuits.some(i => i > post)) quits.push("etiudaSwap: a Quit after the swap");
    visit(sw.slice(post), 0, "etiudaSwap after the swap");
    const iaf = live((findMacro("installApplicationFiles") || {}).body || "");
    const unStaged = iaf[iaf.length - 1] === "File \"/oname=${UNINSTALL_FILENAME}\" \"${UNINSTALLER_OUT_FILE}\""
      && /\$\{IfNot\} \$\{FileExists\} "\$etiudaStage\\\$\{UNINSTALL_FILENAME\}"/.test(code(macro(nsh, "etiudaStageEnd")));
    return { ok: quits.length === 0 && unknown.length === 0 && unStaged && seen.size > 0, quits, unknown, unStaged, reached: [...seen].map(k => k.split(" ")[0]) };
  };
  const nq = noQuitAfterSwap(NSH, TPL);
  ok(nq.ok, "16r nothing between the swap and the registration can Quit, every macro and function in reach followed, and the uninstaller"
    + " the registration names is staged and checked before the swap: " + JSON.stringify({ quits: nq.quits, unknown: nq.unknown, unStaged: nq.unStaged, reached: nq.reached }));
  ok(!noQuitAfterSwap(NSH.replace("!macro customUnInstallCheckCurrentUser\n", "!macro customUnInstallCheckCurrentUserGone\n"), TPL).ok,
    "16r control: this account's copy's failed uninstall left to the template's Quit reads red");
  ok(!noQuitAfterSwap(NSH.replace("  StrCpy $R9 \"ran\"\n  ${If} ${Errors}\n", "  StrCpy $R9 \"ran\"\n  Quit\n  ${If} ${Errors}\n"), TPL).ok,
    "16r control: a Quit in what runs as the person after the swap (etiudaOldUserCopyRun) reads red");
  ok(!noQuitAfterSwap(NSH, Object.assign({}, TPL, { "include/installer.nsh": (TPL["include/installer.nsh"] || "").replace(/\n\s*File "\/oname=\$\{UNINSTALL_FILENAME\}" "\$\{UNINSTALLER_OUT_FILE\}"/, "") })).ok,
    "16r control: the uninstaller no longer written by installApplicationFiles, so never staged, reads red");

  /* 16s. The older folder read from HKCU is emptied only as the person. */
  const freshT = () => ({
    dirs: new Set(["T", "T\\Etiuda Studio", "T\\Etiuda Studio\\resources", "T\\Etiuda Studio\\locales", "T\\Etiuda Studio\\swiftshader", "U"]),
    files: new Set(["T\\Etiuda Studio\\Etiuda Studio.exe", "T\\Etiuda Studio\\Uninstall Etiuda Studio.exe", "T\\Etiuda Studio\\resources\\app.asar", "T\\Etiuda Studio\\locales\\pl.pak",
      "T\\Etiuda Studio\\swiftshader\\vk.dll"]),
    links: new Map([["U\\j", "T"]]),
  });
  const plainU = () => ({
    dirs: new Set(["T", "T\\Etiuda Studio", "T\\Etiuda Studio\\resources", "U", "U\\Etiuda Studio", "U\\Etiuda Studio\\resources"]),
    files: new Set(["T\\Etiuda Studio\\Etiuda Studio.exe", "T\\Etiuda Studio\\resources\\app.asar", "U\\Etiuda Studio\\Etiuda Studio.exe", "U\\Etiuda Studio\\resources\\app.asar", "U\\Etiuda Studio\\mine.txt"]),
    links: new Map(),
  });
  const freshWhole = r => ["T\\Etiuda Studio\\Etiuda Studio.exe", "T\\Etiuda Studio\\resources\\app.asar"].every(f => r.files.has(f));
  const dropsAsPerson = nsh => {
    const body = macro(nsh, "etiudaDropAside");
    if (!body) return false;
    const V = { $etiudaAsideMade: "0", $etiudaAside: "A", $etiudaOldDir: "", $etiudaOldUserDir: "", $etiudaBase: "T\\Etiuda Studio", $installMode: "all",
      $R7: "", $R8: "", $R9: "msg", $0: "" };
    const macros = ["etiudaAsUser", "etiudaDropOldRun", "etiudaDropOld", "etiudaRemoveTree"];
    const replay = (w, tree) => {
      const r = runLL(body, Object.assign({ nsh, expand: [], macros }, w));
      const fsys = tree();
      for (const d of r.drops) {
        const person = d.asUser || !w.admin;
        const locked = new Set(person ? [...fsys.files].filter(f => f.startsWith("T\\")) : []);
        replayDrop(nsh, fsys, locked, undefined, { dir: d.dir, base: "T\\Etiuda Studio" });
      }
      return { r, fsys };
    };
    let a, b, c, d, e, f;
    try {
      a = replay({ V: Object.assign({}, V, { $etiudaOldUserDir: "U\\j\\Etiuda Studio" }), inner: true, outer: true, admin: true }, freshT);
      b = replay({ V: Object.assign({}, V, { $etiudaOldUserDir: "U\\j\\Etiuda Studio" }), inner: true, outer: false, admin: true }, freshT);
      c = replay({ V: Object.assign({}, V, { $etiudaOldUserDir: "U\\j\\Etiuda Studio" }), inner: false, admin: true }, freshT);
      d = replay({ V: Object.assign({}, V, { $etiudaOldUserDir: "U\\Etiuda Studio" }), inner: true, outer: true, admin: true }, plainU);
      e = replay({ V: Object.assign({}, V, { $installMode: "CurrentUser", $etiudaOldDir: "U\\j\\Etiuda Studio" }), admin: true }, freshT);
      f = replay({ V: Object.assign({}, V, { $installMode: "CurrentUser", $etiudaOldDir: "U\\Etiuda Studio" }), admin: false }, plainU);
    } catch (x) { return false; }
    const userDrops = x => x.r.drops.filter(q => /^U\\/.test(q.dir));
    return [a, b, c, e].every(x => freshWhole(x.fsys))
      && userDrops(a).length === 1 && userDrops(a)[0].asUser && a.r.V.$R9 === "msg"
      && userDrops(b).length === 0 && userDrops(c).length === 0 && userDrops(e).length === 0
      && userDrops(d).length === 1 && userDrops(d)[0].asUser && !d.fsys.files.has("U\\Etiuda Studio\\Etiuda Studio.exe") && d.fsys.files.has("U\\Etiuda Studio\\mine.txt") && freshWhole(d.fsys)
      && userDrops(f).length === 1 && !f.fsys.files.has("U\\Etiuda Studio\\Etiuda Studio.exe") && freshWhole(f.fsys);
  };
  ok(dropsAsPerson(NSH), "16s the older folder HKCU names is emptied only as the person: through the unelevated instance in an all-users"
    + " install (none reached, or started elevated, it is left), in a per-user install only by an unelevated run; a junction above it"
    + " pointing at the new install's parent leaves the fresh copy whole, and a plain older folder is still emptied of the program");
  ok(!dropsAsPerson(NSH.replace(/(\n  \$\{If\} \$installMode == "all"\n[\s\S]*?)\n    \$\{If\} \$etiudaOldUserDir != ""\n[\s\S]*?\n    \$\{EndIf\}\n(  \$\{Else\}\n)/, "$1\n    !insertmacro etiudaDropOld $etiudaOldUserDir\n$2")),
    "16s control: the per-user copy's folder emptied elevated, the fresh copy deleted through the junction, reads red");
  ok(!dropsAsPerson(NSH.replace(/(  \$\{Else\}\n)    \$\{IfNot\} \$\{UAC_IsAdmin\}\n      (!insertmacro etiudaDropOld \$etiudaOldDir\n)    \$\{EndIf\}\n/, "$1    $2")),
    "16s control: a per-user install started elevated emptying HKCU's folder reads red");

  /* 16t. Statically: etiudaDropOld is inserted three times and no more. */
  const dropReachedAsPerson = nsh => {
    const inserts = (String(nsh).match(/!insertmacro etiudaDropOld\b[^\n]*/g) || []).map(s => s.trim());
    const a = code(macro(nsh, "etiudaDropAside")), run = code(macro(nsh, "etiudaDropOldRun"));
    const runVia = (String(nsh).match(/!insertmacro etiudaDropOldRun\b[^\n]*/g) || []).length === 0
      && (String(nsh).match(/!insertmacro etiudaAsUser etiudaDropOldRun\n/g) || []).length === 1;
    const allBranch = /\$\{If\} \$installMode == "all"\n\s*!insertmacro etiudaDropOld \$etiudaOldDir\n/.test(a);
    const userVia = /\$\{If\} \$etiudaOldUserDir != ""\n\s*\$\{AndIf\} \$\{UAC_IsInnerInstance\}\n[\s\S]*?StrCpy \$R8 \$etiudaOldUserDir\n[\s\S]*?!insertmacro etiudaAsUser etiudaDropOldRun\n/.test(a);
    const perUser = /\$\{Else\}\n\s*\$\{IfNot\} \$\{UAC_IsAdmin\}\n\s*!insertmacro etiudaDropOld \$etiudaOldDir\n\s*\$\{EndIf\}\n\s*\$\{EndIf\}/.test(a);
    const inRun = /StrCpy \$etiudaBase \$R7\n\s*!insertmacro etiudaDropOld \$R8\n/.test(run);
    return JSON.stringify(inserts.sort()) === JSON.stringify(["!insertmacro etiudaDropOld $R8", "!insertmacro etiudaDropOld $etiudaOldDir", "!insertmacro etiudaDropOld $etiudaOldDir"])
      && runVia && allBranch && userVia && perUser && inRun && !/etiudaDropOld \$etiudaOldUserDir/.test(nsh);
  };
  ok(dropReachedAsPerson(NSH), "16t etiudaDropOld runs over HKCU's folder only as the person: in etiudaDropOldRun, inserted only as"
    + " etiudaAsUser's RUN, or in a per-user install under ${IfNot} ${UAC_IsAdmin}; HKLM's keeps its elevated drop");
  ok(!dropReachedAsPerson(NSH.replace("      !insertmacro etiudaAsUser etiudaDropOldRun\n", "      !insertmacro etiudaDropOldRun\n")),
    "16t control: the run inserted straight into the elevated instance reads red");

  /* 16u. No plug-in command at file level before electron-builder's !addplugindir (makensis 3.12, board 996). */
  const pluginAtFileLevel = texts => {
    const out = [];
    for (const [name, text] of texts) {
      let depth = 0;
      String(text).split("\n").forEach((raw, i) => {
        const l = raw.trim();
        if (/^!macro\s/.test(l)) depth++;
        else if (/^!macroend\b/.test(l)) depth--;
        else if (depth === 0 && !/^[#;]/.test(l) && /^\S*\w+::\w+/.test(l.replace(/^\$\{\w+\}\s*/, ""))) out.push(name + ":" + (i + 1) + " " + l.slice(0, 60));
      });
    }
    return out;
  };
  let TURN = "", ALLUSERS = "";
  try { TURN = fs.readFileSync(path.join(ROOT, "packaging", "installer", "turning.nsh"), "utf8").replace(/\r\n/g, "\n"); } catch (e) { TURN = ""; }
  try { ALLUSERS = fs.readFileSync(path.join(ROOT, "packaging", "installer", "allusers-folder.nsh"), "utf8").replace(/\r\n/g, "\n"); } catch (e) { ALLUSERS = ""; }
  const pf = pluginAtFileLevel([["engine/pinned/.installer-hooks.nsh", HOOKS], ["packaging/installer-pages.nsh", PAGES],
    ["packaging/installer/turning.nsh", TURN], ["packaging/installer/allusers-folder.nsh", ALLUSERS]]);
  ok(pf.length === 0 && /!insertmacro etiudaDropOldFilesFunction/.test(macro(HOOKS, "customHeader")),
    "16u no plug-in command is compiled where the include is read, before electron-builder's !addplugindir (makensis 3.12"
    + " refuses every later one); etiudaDropOldFiles compiles from customHeader: " + JSON.stringify(pf));
  ok(pluginAtFileLevel([["engine/pinned/.installer-hooks.nsh", HOOKS.replace("!macro etiudaDropOldFilesFunction\n", "!macro etiudaDropOldFilesFunction\n!macroend\n")]]).length > 0,
    "16u control: the walk's function back at file level reads red");
}

/* ---- 17. the welcome says what the next page offers, the engine's section 17 --------------------------------------- */
/* oneClick false and perMachine false make electron-builder's assisted installer draw its install-mode page (for this
   account, or for everyone on this computer, which elevates), the route a company's machine-wide install takes. A welcome
   that says the install is for this Windows account only is then untrue before the person's first choice (the first and
   last minutes triage, item 1, 2026-11-10). The leg pins the meaning, both choices named and no "only", in both languages;
   the words are the copywriter's, and a rewording of hers moves the patterns with it. */
{

  const NSH = fs.readFileSync(path.join(ROOT, "packaging", "installer-pages.nsh"), "utf8");
  let cfg = null, assisted = "";
  try { cfg = require(path.join(ROOT, "electron-builder.js")); } catch (e) { cfg = null; }
  try {
    const lib = path.dirname(require.resolve("app-builder-lib/package.json", { paths: [ROOT] }));
    assisted = fs.readFileSync(path.join(lib, "templates", "nsis", "assistedInstaller.nsh"), "utf8");
  } catch (e) { assisted = ""; }
  const modeOffered = c => !!c && !!c.nsis && c.nsis.oneClick === false && c.nsis.perMachine !== true
    && /!ifndef INSTALL_MODE_PER_ALL_USERS\r?\n\s*!insertmacro PAGE_INSTALL_MODE/.test(assisted);
  const welcomes = nsh => (String(nsh).match(/^\s*LangString TurnWelcomeText \$\{ID\} "[^"\n]*"/gm) || []);
  const honest = (nsh, c) => {
    const w = welcomes(nsh);
    const pl = w.filter(l => /Dalej/.test(l)), en = w.filter(l => !/Dalej/.test(l));
    return modeOffered(c) && w.length === 2 && en.length === 1 && pl.length === 1
      && w.every(l => !/account only|only for this|tylko (dla )?tego konta/i.test(l))
      && /everyone on this computer/i.test(en[0]) && /wszystkich użytkowników/i.test(pl[0]);
  };
  ok(honest(NSH, cfg), "17a the welcome names both installs the next page offers, this account or everyone on this computer, and no"
    + " \"only\", in English and Polish: " + JSON.stringify({ modeOffered: modeOffered(cfg), welcomes: welcomes(NSH).map(l => l.slice(0, 170)) }));
  const ONE = "Setup installs it for this Windows account only, so no administrator rights are needed for the folder it suggests. ";
  ok(!honest(NSH.replace(/(LangString TurnWelcomeText \$\{ID\} "Etiuda Studio is[^"\n]*?\$\\r\$\\n\$\\r\$\\n)[^"\n]*?(If Etiuda Studio is open)/, "$1" + ONE + "$2"), cfg),
    "17a control: the English sentence of 2026-11-10 put back reads red");
  ok(!!cfg && !honest(NSH, Object.assign({}, cfg, { nsis: Object.assign({}, cfg.nsis, { perMachine: true }) })),
    "17a control: with perMachine true there is no choice to name, and the leg reads red rather than pass on words alone");
}

/* ---- 18. no installer script on the window thread while a section runs --------------------------------------------
   The turning sidebar and header run a timer (nsDialogs::CreateTimer, TurnTick) on the window thread, and NSIS runs the install and
   uninstall sections on a second thread over the same stack and registers; with a long loop in the section the two collide (the desk's
   Setup hung, Studio's re-entered the "already installed" box until it crashed). Held by reading, timing-free: in the installer and in
   the uninstaller, every timer the script creates is killed by a callback that runs before the section starts (the Installing page's
   PRE or SHOW, set by the defines left at the end of customPageAfterChangeDir for the installer or customUnWelcomePage for the
   uninstaller, or the LEAVE of the last page those macros insert), nothing a section runs creates one, and the "already installed"
   question is asked at most once per run (a variable of its own, not a register, tested at its first use and set before the MessageBox). Restarting on the Finish page (customFinishPage,
   customUninstallPage) is read and reported. Comment lines are skipped; ${TURN_PFX} is read as "" and "un.", as TurnEmit inserts it. */
function turnHazard(src) {
  const lines = String(src).split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !/^[#;]/.test(l));
  const macros = {}, funcs = {}, sections = [];
  for (let i = 0; i < lines.length; i++) {
    let m = /^!macro\s+(\S+)/.exec(lines[i]);
    if (m) { const body = []; for (i++; i < lines.length && !/^!macroend\b/.test(lines[i]); i++) body.push(lines[i]); macros[m[1]] = body; }
  }
  const addFunc = (name, body) => {
    const variants = /\$\{TURN_PFX\}/.test(name + body.join("\n")) ? ["", "un."] : [null];
    for (const v of variants) {
      const sub = (s) => (v === null ? s : s.replace(/\$\{TURN_PFX\}/g, v));
      funcs[sub(name)] = body.map(sub);
    }
  };
  for (let i = 0; i < lines.length; i++) {
    let m = /^Function\s+(\S+)/.exec(lines[i]);
    if (m) { const body = []; for (i++; i < lines.length && !/^FunctionEnd\b/.test(lines[i]); i++) body.push(lines[i]); addFunc(m[1], body); continue; }
    m = /^Section\b/.exec(lines[i]);
    if (m) { const body = []; for (i++; i < lines.length && !/^SectionEnd\b/.test(lines[i]); i++) body.push(lines[i]); sections.push(body); }
  }
  /* What a body reaches: its lines, the functions it calls and the macros it inserts, transitively. */
  const reach = (body, seen) => {
    const s = seen || new Set(), out = [];
    for (const l of body) {
      out.push(l);
      const c = /^Call\s+(\S+)/.exec(l), mi = /^!insertmacro\s+(\S+)/.exec(l);
      const key = c ? "f:" + c[1] : mi ? "m:" + mi[1] : "";
      if (!key || s.has(key)) continue;
      s.add(key);
      const next = c ? funcs[c[1]] : macros[mi[1]];
      if (next) out.push(...reach(next, s));
    }
    return out;
  };
  const kills = (name) => !!funcs[name] && reach(funcs[name]).some((l) => /nsDialogs::KillTimer\b/.test(l));
  const creates = (body) => reach(body).some((l) => /nsDialogs::CreateTimer\b|user32::SetTimer\b/i.test(l));
  /* The pages a hook macro inserts, in order, each with its callbacks, and the defines left after the last one (they go to the next page). */
  const pagesOf = (macro) => {
    const pages = [];
    let pend = {};
    for (const l of macros[macro] || []) {
      const d = /^!define\s+MUI_PAGE_CUSTOMFUNCTION_(PRE|SHOW|LEAVE)\s+(\S+)/.exec(l);
      if (d) { pend[d[1].toLowerCase()] = d[2]; continue; }
      if (/^!insertmacro\s+MUI_(UN)?PAGE_(?!INIT\b)\w+/.test(l)) { pages.push(pend); pend = {}; continue; }
      const c = /^(?:Uninst)?Page\s+custom\s+(\S+)(?:\s+(\S+))?/.exec(l);
      if (c) { pages.push({ pre: c[1], leave: c[2] }); pend = {}; }
    }
    return { pages, trailing: pend };
  };
  const killersBefore = (macro) => {
    const p = pagesOf(macro), cands = [p.trailing.pre, p.trailing.show];
    if (p.pages.length) cands.push(p.pages[p.pages.length - 1].leave);
    return cands.filter(Boolean).filter(kills);
  };
  const finishRestarts = (macro, trailingToo) => {
    const p = pagesOf(macro), cands = [];
    for (const pg of p.pages) cands.push(pg.pre, pg.show);
    if (trailingToo) cands.push(p.trailing.pre, p.trailing.show);
    return cands.filter(Boolean).some((n) => funcs[n] && creates(funcs[n]));
  };
  const timer = lines.some((l) => /nsDialogs::CreateTimer\b|user32::SetTimer\b/i.test(l));
  const r = { timer, installerKill: killersBefore("customPageAfterChangeDir"), uninstallerKill: killersBefore("customUnWelcomePage"),
    sectionCreates: [], finishRestart: { installer: finishRestarts("customFinishPage", false), uninstaller: finishRestarts("customUninstallPage", true) },
    guard: "n/a", faults: [] };
  const sectionSide = sections.map((b, i) => ["Section#" + (i + 1), b])
    .concat(Object.keys(macros).filter((n) => /^custom(Install|UnInstall|RemoveFiles|CheckAppRunning|UnInstallCheck\w*)$/.test(n)).map((n) => [n, macros[n]]));
  for (const [n, b] of sectionSide) if (creates(b)) r.sectionCreates.push(n);
  if (timer) {
    if (!r.installerKill.length) r.faults.push("the installer's timer runs on into the Installing page: no callback before the section kills it");
    if (!r.uninstallerKill.length) r.faults.push("the uninstaller's timer runs on into the Uninstalling page: no callback before the section kills it");
  }
  if (r.sectionCreates.length) r.faults.push("a section starts a timer: " + r.sectionCreates.join(", "));
  const rec = funcs.RecogniseExistingInstallation;
  if (rec) {
    const box = rec.findIndex((l) => /^MessageBox\b/.test(l));
    let guarded = false;
    if (box > -1) for (let i = 0; i < box && !guarded; i++) {
      const set = /^StrCpy\s+(\$\w+)\s+"?[^"\s]+"?\s*$/.exec(rec[i]);
      if (!set) continue;
      if (/^\$R?\d$/.test(set[1])) continue;
      const v = set[1].replace(/\$/g, "\\$"), test = new RegExp("^(\\$\\{(If|IfNot|OrIf|AndIf)\\}\\s+" + v + "\\s|StrCmp\\s+" + v + "\\s)");
      const first = rec.findIndex((l) => new RegExp(v + "(?!\\w)").test(l));
      guarded = first > -1 && first < i && test.test(rec[first]);
    }
    r.guard = guarded ? "guarded" : "unguarded";
    if (!guarded) r.faults.push("the \"already installed\" question is not guarded to once per run");
  }
  r.ok = !r.faults.length;
  return r;
}
/* A mended copy of a script, for the rows' controls: the timer killed on the Installing and Uninstalling pages and restarted on Finish,
   and the question asked once. Written here, not taken from any mend. */
function turnMended(src, drop) {
  const d = drop || {};
  let s = String(src);
  const KILL = ["Function RnrStopTurn", "Push $0", "GetFunctionAddress $0 TurnTick", "nsDialogs::KillTimer $0", "Pop $0", "FunctionEnd",
    "Function un.RnrStopTurn", "Push $0", "GetFunctionAddress $0 un.TurnTick", "nsDialogs::KillTimer $0", "Pop $0", "FunctionEnd",
    "Function RnrRestartTurn", "StrCpy $TurnReady \"\"", "Call TurnPrepare", "FunctionEnd"];
  s += "\n" + KILL.join("\n") + "\n";
  if (!d.installer) s += "!macro customPageAfterChangeDir\n!define MUI_PAGE_CUSTOMFUNCTION_SHOW RnrStopTurn\n!macroend\n";
  s += "!macro customFinishPage\n!define MUI_PAGE_CUSTOMFUNCTION_SHOW RnrRestartTurn\n!insertmacro MUI_PAGE_FINISH\n!macroend\n";
  if (!d.uninstaller) s = s.replace(/(!macro customUnWelcomePage[\s\S]*?)(\n\s*!macroend)/, "$1\n!define MUI_PAGE_CUSTOMFUNCTION_SHOW un.RnrStopTurn$2");
  if (!d.guard) s = s.replace(/(\n\s*Function RecogniseExistingInstallation\s*\n)/, "$1${If} $RnrAsked == \"1\"\nReturn\n${EndIf}\nStrCpy $RnrAsked \"1\"\n");
  if (d.sectionTimer) s += "!macro customInstall\nGetFunctionAddress $0 TurnTick\nnsDialogs::CreateTimer $0 33\n!macroend\n";
  return s;
}
const T18_FILE = path.join(HERE, "..", "packaging", "installer-pages.nsh"), T18_NAME = "packaging/installer-pages.nsh";
{
  const T18 = fs.readFileSync(T18_FILE, "utf8");
  const r = turnHazard(T18);
  ok(r.ok, "18a " + T18_NAME + ": the turning timer is killed before the install and the uninstall sections start, no section starts one, and the"
    + " \"already installed\" question is guarded to once per run: " + JSON.stringify({ timer: r.timer, installerKill: r.installerKill, uninstallerKill: r.uninstallerKill,
      sectionCreates: r.sectionCreates, finishRestart: r.finishRestart, guard: r.guard, faults: r.faults }));
  const m = (d) => turnHazard(turnMended(T18, d));
  ok(m().ok, "18a control: the same script with the timer killed on the Installing and Uninstalling pages and the question guarded reads green");
  ok(!m({ installer: true }).ok && m({ installer: true }).faults.length === 1, "18a control: without the installer's kill, red in that row alone");
  ok(!m({ uninstaller: true }).ok && m({ uninstaller: true }).faults.length === 1, "18a control: without the uninstaller's kill, red in that row alone");
  ok(!m({ guard: true }).ok && m({ guard: true }).faults.length === 1, "18a control: without the once-per-run guard, red in that row alone");
  ok(!m({ sectionTimer: true }).ok && m({ sectionTimer: true }).faults.length === 1, "18a control: a timer started from customInstall reads red");
}

console.log("\n#counts checks=" + checks + " failures=" + fails + " notRun=" + notRun.length);
console.log("install-plan-selftest " + (fails ? "FAILED " + fails + " of " : "passed ") + checks + " check(s)");
process.exit(fails ? Math.min(fails, 63) : 0);
