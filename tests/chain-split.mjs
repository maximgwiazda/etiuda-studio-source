/* THE NODE CHAIN AND THE WINDOW CHAIN ARE TWO LISTS, AND EVERY tests/ SCRIPT IS ON ONE OR NAMED.
 *
 * gate-kind: node
 *
 *     node tests/chain-split.mjs
 *
 * npm test is the node chain. npm run windows is the window chain, and nothing in this file runs
 * it. A day without the window run still runs every node leg, because the node chain has no
 * window leg in it to throw at the wall and stop the rest.
 *
 * HOW A FILE IS CLASSED, so a second tool can redo it. tools/gates-for.mjs lex() blanks comments
 * and string literals and keeps regex literals. maskedCallsWindow is then true when that text
 * calls openStudio, runStudio, wallOrThrow, windowWall or shellLaunch (a definition is not a
 * call; shellLaunchRefusal is not a call; name.call( counts; an identifier assigned from one of
 * those names, or from object.name, and then called, counts). That is the file's own source.
 * A key of NODE_DESPITE_CALL is classed node before that call test.
 *
 * A leg that only reaches a window through a helper is still a window leg. Every function in a
 * tests/ script is sliced from its `function` keyword to the matching brace. A function is hot
 * when its slice calls a window name, or calls a function in the same file that is hot. An
 * exported hot function is a window export. A static `import { name as local } from "./x.mjs"`
 * whose target is a window export, and a call of `local(`, makes the importer a window leg.
 * Imports that leave tests/ are not followed. A dynamic import is not a static binding; the
 * alias rule still sees `go = door.runStudio` in the importer's own source.
 *
 * WHAT IS REFUSED, each line naming the file: a tests/ script in neither chain; the same file
 * in both; a window leg in the node chain; a window leg absent from the window chain; a node
 * leg in the window chain; a node leg absent from the node chain; a helper named below that is
 * gone or that a chain has reached; a name in NODE_DESPITE_CALL whose file is gone or whose
 * masked source calls no window name; an alone marker that is not the exact line, or that sits
 * past the first 15 lines. Scripts are .mjs, .js and .cjs under tests/ at any depth.
 * The chain controls at the bottom are miniature lists, not this tree. The marker controls are
 * the strings beside them.
 *
 * node tests/chain-split.mjs --list prints the class of every script and then judges.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lex, maskedCallsWindow } from "../tools/gates-for.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TESTS = path.join(ROOT, "tests");

/* Not gates of either chain. A name that a chain reaches, or a name with no file, is stale. */
const HELPERS = {
  "tests/card-life-fixture.mjs": "the project the card-life legs build, not a gate",
  "tests/crash-guard.cjs": "the uncaught exception guard loaded into Electron main process, not a gate",
  "tests/debug-port.mjs": "the port the door connects on, not a gate",
  "tests/d1-stand-in.mjs": "the stand-in D1 the licence service legs run the service over, not a gate",
  "tests/fixtures/licence-workerd-entry.mjs": "the Worker entry licence-workerd bundles under its test root, not a gate",
  "tests/desk-emitter.mjs": "the statistics answer the stats legs import, not a gate",
  "tests/install-plan.mjs": "the plan install-plan-selftest drives; it does not install",
  "tests/install-guard.cjs": "the read-only guard the installer legs require, not a gate (its leg is tests/install-guard-selftest.js)",
  "tests/installer.mjs": "machine gate, npm run installer; it builds and installs, so it is not in either chain",
  "tests/licensed.mjs": "the paid licence a leg that publishes through the node modules puts beside it first (a publish with no licence refuses), not a gate",
  "tests/licensed-env.mjs": "the import that puts tests/licensed.mjs's licence on a whole process, not a gate",
  "tests/launch-wait.mjs": "the wait the door calls, not a gate",
  "tests/leak-hunt-preload.cjs": "the preload leak-hunt loads, not a gate",
  "tests/login-run-stub.mjs": "the Windows Run key as Electron keeps it, for reset-studio and settings-prefs, not a gate",
  "tests/linux-studio.mjs": "machine gate for an installed build on a Linux display, not in either chain",
  "tests/off-windows.mjs": "the notice launch-door holds; not a gate of either chain",
  "tests/off-windows.cjs": "the stand-aside decision the Windows-only legs call, not a gate (its leg is tests/off-windows-selftest.mjs)",
  "tests/older-folder-team.mjs": "the team an older Studio kept for a shared folder, written by the fixture for the legs that still read one, not a gate",
  "tests/page-stand-in.mjs": "the page stand-in the node legs load, not a gate",
  "tests/plant-copy.mjs": "the scratch-copy plants phase the fd legs' suites call, each child running one leg, not a gate",
  "tests/js-literals.mjs": "the literal tokeniser plant-hold and chosen-said import, not a gate",
  "tests/plants-tree.mjs": "the scratch copy the plants phases plant in and the checkout sha256 they compare, not a gate",
  "tests/press.mjs": "key and settle helpers for a page the caller already has, not a gate",
  "tests/relay-lab.mjs": "the relay in memory the relay legs share, not a gate",
  "tests/desk-listed-stand.mjs": "the pinned desk reading a catalog Studio published from an import, which tests/catalog-use.mjs 890sq loads, not a gate",
  "tests/reg-stand.cjs": "the stand-in for reg.exe every shell-loading leg installs, not a gate",
  "tests/reg-stand-on.mjs": "the import that installs tests/reg-stand.cjs first, not a gate",
  "tests/deny-binds.mjs": "whether a deny ACE binds the running account, which folder-check, shell-guards and stats-export ask before a deny check, not a gate",
  "tests/scratch.mjs": "the scratch-folder helper, not a gate",
  "tests/seated.mjs": "the signed-in profile every leg that loads the shell puts on it first (the gate refuses a Studio that does not work), not a gate",
  "tests/shell-shipped.mjs": "the pinned shell files Studio ships, each beside its reader, for installer 2f and shell-readers, not a gate",
  "tests/screen-walk.mjs": "a walk of a page the caller already opened, not a gate",
  "tests/win-proxy-oracle.mjs": "the pinned win-proxy.cjs answered from planted reg text, which settings-screen 0b imports, not a gate",
  "tests/shell-door.mjs": "the door the window legs call, not a gate",
  "tests/shipped-sample.mjs": "the pinned sample the import legs read, not a gate",
  "tests/source-text.mjs": "the comment scanner the text legs share, not a gate",
  "tests/stub-model.mjs": "the child import-model spawns, not a gate",
  "tests/update-install.mjs": "machine gate, npm run update-install and npm run all-users-install, not in either chain",
  "tests/window-wall.mjs": "the wall the door and the machine gates call, not a gate",
};

/* Node despite a window call. A key with no file, or whose masked source no longer calls a window name, is stale. */
const NODE_DESPITE_CALL = {
  "tests/no-crash-dialog.mjs": "the window leg is walled behind the window wall and not run in the node chain",
  "tests/shell-guards.mjs": "calls runStudio only with an exe that does not exist; no window opens",
};

const NODE_SCRIPT = "test";
const WINDOW_SCRIPT = "windows";

/* Nightly-only legs (rule 7): load-sensitive legs and self-tests that run only in nightly */
export const NIGHTLY_ONLY = [
  "tests/plants-drop.mjs",
  "tests/machine-lock.mjs",
];

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

/* The exact alone line. A line whose trim is this, in the first 15 lines, is the marker.
   Any other line that is that comment's shape is a misspelling, and the exact line later is
   late. The runner that would read it is not in this tree: npm test is the shell's own chain. */
const ALONE_MARKER = "/* run: alone (timing) */";
const ALONE_SHAPED = /^\/\*[ \t]*run:[ \t]*alone\b.*\*\/$/;
const ALONE_SLASH = /^\/\/[ \t]*run:[ \t]*alone\b/;

export function aloneMarkerFaults(text) {
  const faults = [];
  const lines = String(text).split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t === ALONE_MARKER) {
      if (i >= 15) faults.push({ line: i + 1, why: "sits past the first 15 lines" });
      continue;
    }
    if (ALONE_SHAPED.test(t) || ALONE_SLASH.test(t)) faults.push({ line: i + 1, why: "is misspelt" });
  }
  return faults;
}

export function chainFiles(script) {
  const out = [];
  for (const part of String(script || "").split("&&")) {
    const m = /^\s*node\s+(\S+)/.exec(part.trim());
    if (!m) continue;
    let rel = m[1].replace(/\\/g, "/");
    if (rel.startsWith("./")) rel = rel.slice(2);
    out.push(rel);
  }
  return out;
}

function scriptsUnder(dir, prefix) {
  const out = [];
  for (const name of fs.readdirSync(dir).sort()) {
    const abs = path.join(dir, name);
    const rel = prefix + name;
    const st = fs.statSync(abs);
    if (st.isDirectory()) {
      if (name === "node_modules") continue;
      out.push(...scriptsUnder(abs, rel + "/"));
      continue;
    }
    if (/\.(mjs|js|cjs)$/.test(name)) out.push(rel.split(path.sep).join("/"));
  }
  return out;
}

function skipParens(s, i) {
  let d = 0;
  for (; i < s.length; i++) {
    if (s[i] === "(") d++;
    else if (s[i] === ")") { d--; if (d === 0) return i + 1; }
  }
  return -1;
}

function braceBody(s, i) {
  const at = s.indexOf("{", i);
  if (at < 0) return "";
  let d = 0;
  for (let j = at; j < s.length; j++) {
    if (s[j] === "{") d++;
    else if (s[j] === "}") { d--; if (d === 0) return s.slice(at, j + 1); }
  }
  return s.slice(at);
}

/* Functions in one masked script: name, whether it is exported, and its brace body. */
export function functionsIn(masked) {
  const out = [];
  const re = /(export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g;
  let m;
  while ((m = re.exec(masked))) {
    const after = skipParens(masked, m.index + m[0].length - 1);
    if (after < 0) continue;
    out.push({ name: m[2], exported: !!m[1], body: braceBody(masked, after) });
  }
  return out;
}

function locallyHot(fns) {
  const hot = new Set();
  let grew = true;
  while (grew) {
    grew = false;
    for (const fn of fns) {
      if (hot.has(fn.name)) continue;
      if (maskedCallsWindow(fn.body)) { hot.add(fn.name); grew = true; continue; }
      for (const name of hot) {
        if (new RegExp("\\b" + name + "\\s*\\(").test(fn.body)) { hot.add(fn.name); grew = true; break; }
      }
    }
  }
  return hot;
}

export function windowExports(masked) {
  const fns = functionsIn(masked);
  const hot = locallyHot(fns);
  return fns.filter(fn => fn.exported && hot.has(fn.name)).map(fn => fn.name);
}

function importedBindings(masked, strings) {
  const out = [];
  const re = /import\s*\{([^}]+)\}\s*from\s*"\uE000(\d+)\uE001"/g;
  let m;
  while ((m = re.exec(masked))) {
    const spec = strings[Number(m[2])] || "";
    for (const part of m[1].split(",")) {
      const p = part.trim();
      if (!p) continue;
      const as = /^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/.exec(p);
      if (as) out.push({ imported: as[1], local: as[2], spec });
      else {
        const name = /^([A-Za-z_$][\w$]*)$/.exec(p);
        if (name) out.push({ imported: name[1], local: name[1], spec });
      }
    }
  }
  return out;
}

function resolveSpec(fromRel, spec) {
  if (!spec.startsWith(".")) return null;
  const rel = path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), spec));
  if (rel !== "tests" && !rel.startsWith("tests/")) return null;
  return rel;
}

/** "window" or "node" for one tests/ script. `lexed` is a map rel -> {masked, strings}. */
export function kindOf(rel, lexed) {
  if (Object.prototype.hasOwnProperty.call(NODE_DESPITE_CALL, rel)) return "node";
  const own = lexed.get(rel);
  if (!own) return "node";
  if (maskedCallsWindow(own.masked)) return "window";
  const hot = hotExportsOf(lexed);
  for (const b of importedBindings(own.masked, own.strings)) {
    const target = resolveSpec(rel, b.spec);
    if (!target || !hot.get(target) || !hot.get(target).has(b.imported)) continue;
    if (new RegExp("\\b" + b.local + "\\s*\\(").test(own.masked)) return "window";
  }
  return "node";
}

function hotExportsOf(lexed) {
  const local = new Map();
  for (const [rel, got] of lexed) local.set(rel, new Set(windowExports(got.masked)));
  const fnsOf = new Map();
  for (const [rel, got] of lexed) fnsOf.set(rel, functionsIn(got.masked));
  let grew = true;
  while (grew) {
    grew = false;
    for (const [rel, got] of lexed) {
      const hot = local.get(rel);
      const fns = fnsOf.get(rel);
      for (const b of importedBindings(got.masked, got.strings)) {
        const target = resolveSpec(rel, b.spec);
        if (!target || !local.get(target) || !local.get(target).has(b.imported)) continue;
        for (const fn of fns) {
          if (hot.has(fn.name)) continue;
          if (new RegExp("\\b" + b.local + "\\s*\\(").test(fn.body)) {
            hot.add(fn.name);
            grew = true;
          }
        }
      }
    }
  }
  const out = new Map();
  for (const [rel, got] of lexed) {
    const hot = local.get(rel);
    const names = new Set(functionsIn(got.masked).filter(fn => fn.exported && hot.has(fn.name)).map(fn => fn.name));
    out.set(rel, names);
  }
  return out;
}

export function judgeSets({ files, kindOf: kind, nodeList, windowList, nightlyList = [], helpers, despite, callsWindow }) {
  const failures = [];
  const inNode = new Set(nodeList);
  const inWin = new Set(windowList);
  const inNight = new Set(nightlyList);
  const fileSet = new Set(files);
  const push = (file, why) => failures.push({ file, why });
  for (const rel of files) {
    if (Object.prototype.hasOwnProperty.call(helpers, rel)) continue;
    const node = inNode.has(rel);
    const win = inWin.has(rel);
    const night = inNight.has(rel);
    const k = kind(rel);
    if (node && win) push(rel, "in both the node chain and the window chain");
    if (node && night) push(rel, "in both the node chain and the nightly list");
    if (win && night) push(rel, "in both the window chain and the nightly list");
    if (!node && !win && !night) push(rel, "in neither list");
    if (k === "window" && node) push(rel, "a window leg in the node chain");
    if (k === "node" && win) push(rel, "a node leg in the window chain");
    if (k === "window" && !win) push(rel, "a window leg absent from the window chain");
    if (k === "node" && !node && !night) push(rel, "a node leg absent from the node chain");
  }
  for (const rel of inNight) {
    if (!fileSet.has(rel)) push(rel, "listed in nightly but not a tests script");
  }
  for (const rel of Object.keys(helpers)) {
    if (!helpers[rel]) push(rel, "named as not a gate with no reason");
    if (!fileSet.has(rel) || inNode.has(rel) || inWin.has(rel) || inNight.has(rel))
      push(rel, "named as not a gate but reached or gone");
  }
  for (const rel of Object.keys(despite || {})) {
    const calls = fileSet.has(rel) && typeof callsWindow === "function" && !!callsWindow(rel);
    if (!calls) push(rel, "named as node despite a call but calls no window name");
  }
  for (const rel of new Set([...inNode, ...inWin, ...inNight])) {
    if (!fileSet.has(rel)) push(rel, "listed but not a tests script");
  }
  failures.sort((a, b) => a.file < b.file ? -1 : a.file > b.file ? 1 : (a.why < b.why ? -1 : a.why > b.why ? 1 : 0));
  return failures;
}

function lexTree(files) {
  const lexed = new Map();
  for (const rel of files) {
    const text = fs.readFileSync(path.join(ROOT, rel), "utf8");
    lexed.set(rel, lex(text));
  }
  return lexed;
}

function judgeTree(files, nodeList, windowList, nightlyList = NIGHTLY_ONLY) {
  const lexed = lexTree(files);
  return {
    lexed,
    failures: judgeSets({
      files, nodeList, windowList, nightlyList, helpers: HELPERS,
      despite: NODE_DESPITE_CALL,
      callsWindow: rel => {
        const own = lexed.get(rel);
        return !!(own && maskedCallsWindow(own.masked));
      },
      kindOf: rel => kindOf(rel, lexed),
    }),
  };
}

function one(failures, file, why) {
  return failures.filter(f => f.file === file && f.why === why).length === 1;
}

/* Miniature lists. Each control is one plant the disk leg also has to refuse, named. */
function controls() {
  const files = ["tests/a.mjs", "tests/w.mjs", "tests/n.mjs", "tests/h.mjs"];
  const kind = rel => rel === "tests/w.mjs" ? "window" : "node";
  const helpers = { "tests/h.mjs": "a helper, not a gate" };
  const clean = judgeSets({ files, kindOf: kind, nodeList: ["tests/a.mjs", "tests/n.mjs"], windowList: ["tests/w.mjs"], helpers });
  check(clean.length === 0, "cs0 a node chain, a window chain and a named helper refuse nothing (" + clean.length + ")");
  const neither = judgeSets({
    files: files.concat(["tests/z.mjs"]), kindOf: kind,
    nodeList: ["tests/a.mjs", "tests/n.mjs"], windowList: ["tests/w.mjs"], helpers,
  });
  check(one(neither, "tests/z.mjs", "in neither list"),
    "cs1 a new tests/ script in neither list is refused by name: "
    + neither.filter(f => f.file === "tests/z.mjs").map(f => f.why).join("; "));
  const moved = judgeSets({
    files, kindOf: kind, nodeList: ["tests/a.mjs", "tests/n.mjs", "tests/w.mjs"], windowList: [], helpers,
  });
  check(one(moved, "tests/w.mjs", "a window leg in the node chain"),
    "cs2 a window leg in the node chain is refused by name: "
    + moved.filter(f => f.file === "tests/w.mjs").map(f => f.why).join("; "));
  const both = judgeSets({
    files, kindOf: kind, nodeList: ["tests/a.mjs", "tests/n.mjs"], windowList: ["tests/w.mjs", "tests/n.mjs"], helpers,
  });
  check(one(both, "tests/n.mjs", "in both the node chain and the window chain"),
    "cs3 a file in both lists is refused by name: "
    + both.filter(f => f.file === "tests/n.mjs").map(f => f.why).join("; "));
  const dropped = judgeSets({
    files, kindOf: kind, nodeList: ["tests/a.mjs"], windowList: ["tests/w.mjs"], helpers,
  });
  check(one(dropped, "tests/n.mjs", "a node leg absent from the node chain"),
    "cs4 a node leg removed from the node chain is refused by name: "
    + dropped.filter(f => f.file === "tests/n.mjs").map(f => f.why).join("; "));
  const over = "tests/shell-guards.mjs";
  /* Built in two halves so this file's own text holds no call: launch-door 4e counts the files that do. */
  const lexed = new Map([[over, lex("run" + "Studio()\n")]]);
  const planted = judgeSets({
    files: ["tests/a.mjs", over],
    kindOf: rel => kindOf(rel, lexed),
    nodeList: ["tests/a.mjs"],
    windowList: [over],
    helpers: {},
    despite: NODE_DESPITE_CALL,
    callsWindow: rel => {
      const own = lexed.get(rel);
      return !!(own && maskedCallsWindow(own.masked));
    },
  });
  check(one(planted, over, "a node leg in the window chain"),
    "cs5 an override file on the window chain is refused by name: "
    + planted.filter(f => f.file === over).map(f => f.why).join("; "));
  check(aloneMarkerFaults(ALONE_MARKER + "\n").length === 0,
    "cs6 the exact alone marker on line 1 is kept");
  const miss = aloneMarkerFaults("/* run: alone */\n");
  check(miss.length === 1 && miss[0].line === 1 && miss[0].why === "is misspelt",
    "cs7 a misspelt alone marker is refused: " + miss.map(f => "line " + f.line + " " + f.why).join("; "));
  const late = Array.from({ length: 15 }, () => "// pad").join("\n") + "\n" + ALONE_MARKER + "\n";
  const lateFaults = aloneMarkerFaults(late);
  check(lateFaults.length === 1 && lateFaults[0].line === 16 && lateFaults[0].why === "sits past the first 15 lines",
    "cs8 an alone marker past the first 15 lines is refused: "
    + lateFaults.map(f => "line " + f.line + " " + f.why).join("; "));

  const nightClean = judgeSets({
    files: files.concat(["tests/k.mjs"]),
    kindOf: kind,
    nodeList: ["tests/a.mjs", "tests/n.mjs"],
    windowList: ["tests/w.mjs"],
    nightlyList: ["tests/k.mjs"],
    helpers,
  });
  check(nightClean.length === 0, "cs10 a nightly-only leg in nightlyList and absent from nodeList is valid (" + nightClean.length + ")");

  const nightBoth = judgeSets({
    files: files.concat(["tests/k.mjs"]),
    kindOf: kind,
    nodeList: ["tests/a.mjs", "tests/n.mjs", "tests/k.mjs"],
    windowList: ["tests/w.mjs"],
    nightlyList: ["tests/k.mjs"],
    helpers,
  });
  check(one(nightBoth, "tests/k.mjs", "in both the node chain and the nightly list"),
    "cs11 a leg in both the node chain and the nightly list is refused by name: "
    + nightBoth.filter(f => f.file === "tests/k.mjs").map(f => f.why).join("; "));
}

function main() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const nodeList = chainFiles(pkg.scripts && pkg.scripts[NODE_SCRIPT]);
  const windowList = chainFiles(pkg.scripts && pkg.scripts[WINDOW_SCRIPT]);
  const nightlyList = NIGHTLY_ONLY;
  const files = scriptsUnder(TESTS, "tests/");
  const { lexed, failures } = judgeTree(files, nodeList, windowList, nightlyList);
  if (process.argv.includes("--list")) {
    const rows = files.map(rel => kindOf(rel, lexed) + " " + rel);
    process.stdout.write(rows.join("\n") + "\n");
  }
  if (!failures.length) {
    const nodeN = nodeList.length, winN = windowList.length, nightN = nightlyList.length, helpN = Object.keys(HELPERS).length;
    check(true, "chain-split every tests script is in one chain or named: " + nodeN + " node, "
      + winN + " window, " + nightN + " nightly, " + helpN + " not gates, " + files.length + " scripts");
  } else {
    for (const f of failures) check(false, "chain-split refuses " + f.file + ": " + f.why);
  }
  check(nodeList.includes("tests/leak-hunt.mjs") && !nightlyList.includes("tests/leak-hunt.mjs"),
    "cs12 leak-hunt back in the merge chain: in nodeList=" + nodeList.includes("tests/leak-hunt.mjs")
    + " in nightlyList=" + nightlyList.includes("tests/leak-hunt.mjs"));
  check(nodeList.includes("tests/kill-tree.mjs") && !nightlyList.includes("tests/kill-tree.mjs"),
    "cs13 kill-tree back in the merge chain: in nodeList=" + nodeList.includes("tests/kill-tree.mjs")
    + " in nightlyList=" + nightlyList.includes("tests/kill-tree.mjs"));
  check(nodeList.includes("tests/clear-memory.mjs") && !nightlyList.includes("tests/clear-memory.mjs"),
    "cs14 clear-memory in the node chain: in nodeList=" + nodeList.includes("tests/clear-memory.mjs")
    + " in nightlyList=" + nightlyList.includes("tests/clear-memory.mjs"));
  const markerBad = [];
  for (const rel of files) {
    for (const f of aloneMarkerFaults(fs.readFileSync(path.join(ROOT, rel), "utf8")))
      markerBad.push({ file: rel, line: f.line, why: f.why });
  }
  if (!markerBad.length) {
    check(true, "cs9 every alone marker is the exact line in the first 15 lines");
  } else {
    for (const f of markerBad)
      check(false, "chain-split refuses " + f.file + ": the alone marker at line " + f.line + " " + f.why);
  }
  controls();
  process.stdout.write("#counts checks=" + asserted + " failures=" + failed + "\n");
  process.stdout.write("chain-split " + (failed ? "FAILED " + failed + " of " : "passed ") + asserted + " check(s)\n");
  process.exit(failed ? 1 : 0);
}

const invoked = process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();
if (invoked) main();
