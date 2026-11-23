/* THE MAP FROM A FILE TO THE GATES THAT READ IT. Node only.
 *
 *     node tests/gates-for.mjs
 *
 * A throwaway tree, with git's index as the tracked set and a copy of tools/gates-for.mjs, holds
 * three gates. One reads a file only through path.join of a root and two pieces. One reads a file
 * only by importing a module that imports it. One calls the window wall and reads a third file.
 * A file none of them names is the control. One reads a file only through a template literal whose
 * ${ROOT} is already folded. One loads a child only through execSync of a node command string.
 * A second tree's main joins ROOT and "src" inside a function, and the window gate is named for a
 * file under that directory.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const TOOL = path.join(ROOT, "tools", "gates-for.mjs");
/* 24 legs as before, plus one check per relay-studio plant edge (255: A4's Studio half added seven, and the test architect's
   990437b4 retired the moved-line plant s3c-note; 260: the door-finding's rsDoorSvc added five), five hand controls (gf26 to
   gf30), the alias parts (gf31), and studio-edges' four (gf32 to gf35; gf36 went with tests/folder-mirror-studio.mjs, A-S5). */
/* THE FLOOR MOVES WITH THE PLANTS: 34 fixed checks (24 legs, gf26 to gf35 and the hand controls) and one gf25 per relay-studio plant edge,
   counted from tests/relay-studio.mjs by the very pattern gf25 walks, so a branch that adds or retires a plant no longer stops a fold
   (it stopped folds 64 and 65 at 319 and 320). A count of edges under 200 is a broken read, not a retirement, and is red (gf37). */
const PLANT_EDGES = (fs.readFileSync(path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), "tests", "relay-studio.mjs"), "utf8")
  .match(/leg:\s*"([^"]+)"\s*,\s*file:\s*"([^"]+)"/g) || []).length;
const EXPECTED = 34 + PLANT_EDGES + 1 + 2; /* +2 a producer script's step is no gate (gf38, gf39) */

/* GIT-ENV: git must use the throwaway tree, never a GIT_DIR the caller exported. */
function gitEnv() {
  const env = { ...process.env };
  delete env.GIT_DIR;
  delete env.GIT_INDEX_FILE;
  delete env.GIT_WORK_TREE;
  return env;
}
function git(args, cwd) {
  return execFileSync("git", args, { cwd, encoding: "utf8", env: gitEnv() });
}

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}

function write(rel, text) {
  const at = path.join(lab, rel);
  fs.mkdirSync(path.dirname(at), { recursive: true });
  fs.writeFileSync(at, text);
}

const lab = fs.mkdtempSync(path.join(os.tmpdir(), "gates-for-plant-"));
let rows = null, raw = "";
try {
  write("package.json", JSON.stringify({
    main: "shell/main.js",
    scripts: {
      test: "node tests/read-join.mjs && node tests/read-mod.mjs && node tests/read-cjs.mjs && node tests/reads-screen.mjs && node tests/read-pin.mjs && node tests/read-tpl.mjs && node tests/read-exec.mjs",
    },
  }, null, 2) + "\n");
  write("shell/main.js", "\"use strict\";\nrequire(\"./loaded.js\");\n");
  write("shell/loaded.js", "module.exports = { n: 1 };\n");
  write("ui/pane.js", "module.exports = \"pane\";\n");
  write("engine/pinned/leaf.js", "module.exports = { pin: 1 };\n");
  write("tools/engine-pin", "plant-pin\n");
  write("tools/engine-modules.txt", "src/modules/words.js\n");
  write("data/tpl.json", "tpl-body\n");
  write("tests/read-tpl.mjs", [
    "import fs from \"node:fs\";",
    "import path from \"node:path\";",
    "import { fileURLToPath } from \"node:url\";",
    "const HERE = path.dirname(fileURLToPath(import.meta.url));",
    "const ROOT = path.resolve(HERE, \"..\");",
    "const text = fs.readFileSync(`${ROOT}/data/tpl.json`, \"utf8\");",
    "process.exit(text === \"tpl-body\\n\" ? 0 : 1);",
    "",
  ].join("\n"));
  write("data/exec.txt", "exec-body\n");
  write("tests/exec-child.mjs", [
    "import fs from \"node:fs\";",
    "import path from \"node:path\";",
    "import { fileURLToPath } from \"node:url\";",
    "const HERE = path.dirname(fileURLToPath(import.meta.url));",
    "const ROOT = path.resolve(HERE, \"..\");",
    "fs.readFileSync(path.join(ROOT, \"data\", \"exec.txt\"), \"utf8\");",
    "",
  ].join("\n"));
  write("tests/read-exec.mjs", [
    "import { execSync } from \"node:child_process\";",
    "execSync(\"node tests/exec-child.mjs\");",
    "",
  ].join("\n"));
  write("tests/read-pin.mjs", [
    "import { createRequire } from \"node:module\";",
    "import path from \"node:path\";",
    "import { fileURLToPath } from \"node:url\";",
    "const require = createRequire(import.meta.url);",
    "const HERE = path.dirname(fileURLToPath(import.meta.url));",
    "require(path.join(HERE, \"..\", \"engine\", \"pinned\", \"leaf.js\"));",
    "process.exit(0);",
    "",
  ].join("\n"));
  write("data/joined.txt", "joined-body\n");
  write("data/unread.txt", "nobody\n");
  write("data/screen.txt", "screen-body\n");
  write("src/leaf.mjs", "export const leaf = 1;\n");
  write("src/mid.mjs", "export { leaf } from \"./leaf.mjs\";\n");
  write("lib/leaf.cjs", "module.exports = { n: 2 };\n");
  write("lib/mid.cjs", "module.exports = require(\"./leaf.cjs\");\n");
  write("tests/read-join.mjs", [
    "import fs from \"node:fs\";",
    "import path from \"node:path\";",
    "import { fileURLToPath } from \"node:url\";",
    "const HERE = path.dirname(fileURLToPath(import.meta.url));",
    "const ROOT = path.resolve(HERE, \"..\");",
    "const text = fs.readFileSync(path.join(ROOT, \"data\", \"joined.txt\"), \"utf8\");",
    "process.exit(text === \"joined-body\\n\" ? 0 : 1);",
    "",
  ].join("\n"));
  write("tests/read-mod.mjs", [
    "import { leaf } from \"../src/mid.mjs\";",
    "process.exit(leaf === 1 ? 0 : 1);",
    "",
  ].join("\n"));
  write("tests/read-cjs.mjs", [
    "import { createRequire } from \"node:module\";",
    "const require = createRequire(import.meta.url);",
    "const leaf = require(\"../lib/mid.cjs\");",
    "process.exit(leaf.n === 2 ? 0 : 1);",
    "",
  ].join("\n"));
  write("tests/reads-screen.mjs", [
    "import fs from \"node:fs\";",
    "import path from \"node:path\";",
    "import { fileURLToPath } from \"node:url\";",
    "const HERE = path.dirname(fileURLToPath(import.meta.url));",
    "const ROOT = path.resolve(HERE, \"..\");",
    "fs.readFileSync(path.join(ROOT, \"data\", \"screen.txt\"), \"utf8\");",
    "window" + "Wall(\"plant\");",
    "",
  ].join("\n"));
  fs.mkdirSync(path.join(lab, "tools"), { recursive: true });
  fs.copyFileSync(TOOL, path.join(lab, "tools", "gates-for.mjs"));
  git(["init", "-q"], lab);
  git(["add", "--", "package.json", "data", "src", "lib", "tests", "ui", "shell", "tools", "engine"], lab);

  const ask = (file) => {
    const res = spawnSync(process.execPath, ["tools/gates-for.mjs", file], { cwd: lab, encoding: "utf8" });
    const out = String(res.stdout || "") + String(res.stderr || "");
    const line = (out.trim().split(/\r?\n/).pop() || "");
    let json = null;
    try { json = JSON.parse(line); } catch (e) { json = null; }
    return { code: res.status, out, json };
  };

  const join = ask("data/joined.txt");
  raw = join.out;
  const names = j => (j && j.gates || []).map(g => g.gate).sort();
  check(join.code === 0 && names(join.json).join() === "tests/read-join.mjs",
    "gf1 a file read only through path.join of a root and two pieces names that gate and no other: "
    + JSON.stringify(names(join.json)) + (join.json ? "" : " (no JSON; " + join.out.trim().slice(0, 180) + ")"));
  const jg = (join.json && join.json.gates || []).find(g => g.gate === "tests/read-join.mjs");
  check(!!jg && jg.kind === "node" && jg.command === "node tests/read-join.mjs" && jg.via.join() === "npm test"
        && jg.chains.length === 1 && jg.chains[0].chain.join(" -> ").indexOf("data/joined.txt") > -1
        && jg.chains[0].chain[jg.chains[0].chain.length - 1] === "tests/read-join.mjs",
    "gf2 that gate is node, runs as node tests/read-join.mjs under npm test, and the chain ends at the gate: "
    + JSON.stringify(jg && { kind: jg.kind, command: jg.command, via: jg.via, chain: jg.chains[0] && jg.chains[0].chain }));

  const mod = ask("src/leaf.mjs");
  const mg = (mod.json && mod.json.gates || []).find(g => g.gate === "tests/read-mod.mjs");
  check(mod.code === 0 && names(mod.json).join() === "tests/read-mod.mjs"
        && !!mg && mg.chains[0].chain.join(" -> ") === "src/leaf.mjs -> src/mid.mjs -> tests/read-mod.mjs",
    "gf3 a file reached only through a second module names that gate, through the module: "
    + JSON.stringify(mg && mg.chains[0].chain) + " gates " + JSON.stringify(names(mod.json)));

  const cjs = ask("lib/leaf.cjs");
  const cg = (cjs.json && cjs.json.gates || []).find(g => g.gate === "tests/read-cjs.mjs");
  check(cjs.code === 0 && names(cjs.json).join() === "tests/read-cjs.mjs"
        && !!cg && cg.chains[0].chain.join(" -> ") === "lib/leaf.cjs -> lib/mid.cjs -> tests/read-cjs.mjs",
    "gf4 the same through require of a second module: "
    + JSON.stringify(cg && cg.chains[0].chain) + " gates " + JSON.stringify(names(cjs.json)));

  const none = ask("data/unread.txt");
  check(none.code === 0 && names(none.json).length === 0 && /no gate reads it/.test(none.out),
    "gf5 a file no gate reads names no gate: " + JSON.stringify(names(none.json))
    + (none.json ? "" : " (no JSON)"));

  const screen = ask("data/screen.txt");
  const sg = (screen.json && screen.json.gates || []).find(g => g.gate === "tests/reads-screen.mjs");
  check(screen.code === 0 && names(screen.json).join() === "tests/reads-screen.mjs" && !!sg && sg.kind === "window",
    "gf6 a file read only by a gate that calls the window wall is that gate, and it is window: "
    + JSON.stringify(sg && { gate: sg.gate, kind: sg.kind }) + " gates " + JSON.stringify(names(screen.json)));

  const self = ask("tests/read-join.mjs");
  check(self.code === 0 && names(self.json).indexOf("tests/read-join.mjs") > -1,
    "gf7 the gate's own file names the gate: " + JSON.stringify(names(self.json)));

  const pane = ask("ui/pane.js");
  const shellFile = ask("shell/loaded.js");
  const paneGate = (pane.json && pane.json.gates || []).find(g => g.gate === "tests/reads-screen.mjs");
  const shellGate = (shellFile.json && shellFile.json.gates || []).find(g => g.gate === "tests/reads-screen.mjs");
  check(pane.code === 0 && !!paneGate && paneGate.kind === "window"
        && shellFile.code === 0 && !!shellGate && shellGate.kind === "window",
    "gf9 a window gate is named for a ui file and for a file the shell main loads: "
    + JSON.stringify({ pane: paneGate && { gate: paneGate.gate, kind: paneGate.kind },
      shell: shellGate && { gate: shellGate.gate, kind: shellGate.kind },
      paneGates: names(pane.json), shellGates: names(shellFile.json) }));

  const pin = ask("tools/engine-pin");
  check(pin.code === 0 && names(pin.json).indexOf("tests/read-pin.mjs") > -1,
    "gf10 a gate that requires a pinned path is named for the pin file: " + JSON.stringify(names(pin.json)));

  fs.rmSync(path.join(lab, "src", "leaf.mjs"));
  const gone = ask("src/leaf.mjs");
  check(gone.code === 0 && names(gone.json).indexOf("tests/read-mod.mjs") > -1,
    "gf11 a tracked file gone from disk still names the gate that imports it: " + JSON.stringify(names(gone.json)));

  const decoy = fs.mkdtempSync(path.join(os.tmpdir(), "gates-for-decoy-"));
  try {
    git(["init", "-q"], decoy);
    const env = { ...process.env, GIT_DIR: decoy };
    delete env.GIT_INDEX_FILE;
    delete env.GIT_WORK_TREE;
    const res = spawnSync(process.execPath, ["tools/gates-for.mjs", "ui/pane.js"], { cwd: lab, encoding: "utf8", env });
    const line = (String(res.stdout || "").trim().split(/\r?\n/).pop() || "");
    let json = null;
    try { json = JSON.parse(line); } catch (e) { json = null; }
    const listed = git(["ls-files", "-z"], decoy).split("\0").filter(Boolean);
    const named = names(json).indexOf("tests/reads-screen.mjs") > -1;
    check(res.status === 0 && listed.length === 0 && named,
      "gf12 GIT_DIR set by the caller leaves that repo's index empty (" + listed.length
      + " entries) and the lab's window gate is still named: " + JSON.stringify(names(json)));
  } finally {
    try { fs.rmSync(decoy, { recursive: true, force: true }); } catch (e) { /* the decoy's own directory */ }
  }

  const tpl = ask("data/tpl.json");
  check(tpl.code === 0 && names(tpl.json).join() === "tests/read-tpl.mjs",
    "gf13 a file read only through a template literal names that gate: " + JSON.stringify(names(tpl.json))
    + (tpl.json ? "" : " (no JSON)"));

  const execd = ask("data/exec.txt");
  check(execd.code === 0 && names(execd.json).join() === "tests/read-exec.mjs",
    "gf14 a file read by a child loaded through execSync of a node command names that gate: "
    + JSON.stringify(names(execd.json)) + (execd.json ? "" : " (no JSON)"));

  const lab2 = fs.mkdtempSync(path.join(os.tmpdir(), "gates-for-lazy-"));
  try {
    const write2 = (rel, text) => {
      const at = path.join(lab2, rel);
      fs.mkdirSync(path.dirname(at), { recursive: true });
      fs.writeFileSync(at, text);
    };
    write2("package.json", JSON.stringify({
      main: "shell/main.js",
      scripts: { test: "node tests/reads-app.mjs" },
    }, null, 2) + "\n");
    write2("shell/main.js", [
      "\"use strict\";",
      "const path = require(\"path\");",
      "const { pathToFileURL } = require(\"url\");",
      "const ROOT = path.resolve(__dirname, \"..\");",
      "function lazy(file) {",
      "  let mod = null;",
      "  return async () => mod || (mod = import(pathToFileURL(path.join(ROOT, \"src\", file)).href));",
      "}",
      "const studio = lazy(\"studio.mjs\");",
      "",
    ].join("\n"));
    write2("src/" + "studio.mjs", "export const n = 1;\n");
    write2("src/" + "only-lazy.mjs", "export const n = 2;\n");
    write2("ui/pane.js", "module.exports = \"pane\";\n");
    write2("tests/reads-app.mjs", [
      "import fs from \"node:fs\";",
      "fs.readFileSync(\"nope.txt\");",
      "window" + "Wall(\"plant\");",
      "",
    ].join("\n"));
    fs.mkdirSync(path.join(lab2, "tools"), { recursive: true });
    fs.copyFileSync(TOOL, path.join(lab2, "tools", "gates-for.mjs"));
    git(["init", "-q"], lab2);
    git(["add", "--", "package.json", "shell", "src", "ui", "tests", "tools"], lab2);
    const res = spawnSync(process.execPath, ["tools/gates-for.mjs", "src/" + "only-lazy.mjs"], { cwd: lab2, encoding: "utf8" });
    const line = (String(res.stdout || "").trim().split(/\r?\n/).pop() || "");
    let json = null;
    try { json = JSON.parse(line); } catch (e) { json = null; }
    const gate = (json && json.gates || []).find(g => g.gate === "tests/reads-app.mjs");
    check(res.status === 0 && !!gate && gate.kind === "window",
      "gf15 a window gate is named for a src file the app reaches only by joining ROOT inside a function: "
      + JSON.stringify(gate && { gate: gate.gate, kind: gate.kind }) + " gates " + JSON.stringify(names(json)));
  } finally {
    try { fs.rmSync(lab2, { recursive: true, force: true }); } catch (e) { /* the lazy plant's own directory */ }
  }

  const gfTool = await import("../tools/gates-for.mjs");
  const sharedList = gfTool.SHARED || [];
  const required = [
    "package.json", "package-lock.json", "electron-builder.js", "tools/package.mjs",
    "tools/release.mjs", "tests/relay-lab.mjs", "tests/scratch.mjs",
    "tools/gate-run.mjs", "tools/gates-for.mjs", "tools/engine-pin"
  ];
  const allInShared = required.every(f => sharedList.includes(f));
  const isSharedFn = typeof gfTool.isSharedCode === "function";
  const identifies = isSharedFn && required.every(f => gfTool.isSharedCode(f));
  check(Array.isArray(gfTool.SHARED) && allInShared && identifies,
    "gf16 SHARED list is exported and isSharedCode identifies all members and config: "
    + (Array.isArray(gfTool.SHARED) ? (allInShared && identifies ? sharedList.join(", ") : "missing entries") : "not exported"));

  const toolsOnlyFn = typeof gfTool.isGateToolsOnly === "function" ? gfTool.isGateToolsOnly : () => "not exported";
  const toolCases = [
    [["tools/gate-run.mjs"], true],
    [["tools/gates-for.mjs", "tests/gate-run.mjs", "tests/gates-for.mjs"], true],
    [["tools\\gate-run.mjs"], true],
    [["tools/gate-run.mjs", "src/leaf.mjs"], false],
    [["tools/gate-run.mjs", "package.json"], false],
    [["tools/machine-lock.mjs"], false],
    [["tools/child-cap.mjs"], true],
    [[], false],
  ];
  const toolMisses = toolCases.filter(([files, want]) => toolsOnlyFn(files) !== want);
  check(toolMisses.length === 0,
    "gf17 a diff is confined to the gate tools only when every file is gate-run, gates-for or their own tests: "
    + (toolMisses.length ? "wrong on " + JSON.stringify(toolMisses.map(([f]) => f)) : toolCases.length + " cases right"));

  /* A diff that adds, removes or renames a file under tests/ selects chain-split (the test architect's edge, 2026-10-28:
     child-cap's test file reached no chain on a tools-only merge). Staged in a lab repository against its main. */
  const listLab = fs.mkdtempSync(path.join(os.tmpdir(), "gates-for-list-"));
  let listCases = [];
  try {
    fs.mkdirSync(path.join(listLab, "tests"));
    fs.mkdirSync(path.join(listLab, "src"));
    for (const f of ["tests/a.mjs", "tests/old.mjs", "src/x.mjs"]) fs.writeFileSync(path.join(listLab, f), "// " + f + "\n");
    git(["init", "-q", "-b", "main"], listLab);
    git(["add", "."], listLab);
    git(["-c", "user.name=lab", "-c", "user.email=lab@example.invalid", "commit", "-q", "-m", "lab"], listLab);
    fs.writeFileSync(path.join(listLab, "tests", "a.mjs"), "// changed\n");
    fs.writeFileSync(path.join(listLab, "tests", "b.mjs"), "// added\n");
    fs.rmSync(path.join(listLab, "tests", "old.mjs"));
    const listFn = typeof gfTool.testsListChanged === "function" ? gfTool.testsListChanged : () => "not exported";
    listCases = [
      [["tests/a.mjs"], false],
      [["tests/b.mjs"], true],
      [["tests/old.mjs"], true],
      [["tests/old.mjs", "tests/b.mjs"], true],
      [["src/x.mjs", "tests/a.mjs"], false],
      [[], false],
    ].map(([files, want]) => [files, want, listFn(listLab, files, "main")]);
  } finally {
    try { fs.rmSync(listLab, { recursive: true, force: true }); } catch (e) { /* the leg's own directory */ }
  }
  const listMisses = listCases.filter(([, want, got]) => got !== want);
  check(listCases.length === 6 && listMisses.length === 0,
    "gf18 a test file added, removed or renamed against the base selects chain-split, a test file only changed does not: "
    + (listMisses.length ? "wrong on " + JSON.stringify(listMisses) : listCases.length + " cases right"));

  const scanMiss = [];
  if (!gfTool.SCANS || typeof gfTool.globMatches !== "function") scanMiss.push("SCANS missing");
  else {
    const tracked = git(["ls-files", "-z"], ROOT).split("\0").filter(Boolean);
    for (const [leg, globs] of Object.entries(gfTool.SCANS)) {
      if (!Array.isArray(globs) || !globs.length) { scanMiss.push(leg + " empty"); continue; }
      for (const g of globs) if (!tracked.some(f => gfTool.globMatches(g, f))) scanMiss.push(leg + " " + g);
    }
  }
  check(scanMiss.length === 0,
    "gf19 every scan glob matches a tracked file: "
    + (scanMiss.length ? scanMiss.join("; ") : Object.keys(gfTool.SCANS).length + " legs"));

  /* A directory the relay-studio gate only copies is not reach. A file it imports stays,
     and a directory it lists and reads stays. The lab's suite is tests/relay-studio.mjs so
     the narrowing applies; the same copy in any other gate is left as it was. */
  const copyLab = fs.mkdtempSync(path.join(os.tmpdir(), "gates-for-copy-"));
  let copyReach = "not run";
  try {
    const writeCopy = (rel, text) => {
      const at = path.join(copyLab, rel);
      fs.mkdirSync(path.dirname(at), { recursive: true });
      fs.writeFileSync(at, text);
    };
    writeCopy("package.json", JSON.stringify({ scripts: { test: "node tests/relay-studio.mjs" } }) + "\n");
    writeCopy("src/plain.mjs", "export const n = 1;\n");
    writeCopy("src/relay.mjs", "export const n = 2;\n");
    writeCopy("tests/kept.mjs", "export const kept = 1;\n");
    writeCopy("tests/left-out.mjs", "export const n = 3;\n");
    writeCopy("tests/relay-studio.mjs", [
      "import fs from \"node:fs\";",
      "import path from \"node:path\";",
      "import { fileURLToPath } from \"node:url\";",
      "import { kept } from \"./kept.mjs\";",
      "const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), \"..\");",
      "for (const dir of [\"src\", \"tests\"]) {",
      "  fs.cpSync(path.join(ROOT, dir), path.join(ROOT, \"copy\", dir), { recursive: true });",
      "}",
      "for (const dir of [\"src\"]) {",
      "  const dpath = path.join(ROOT, dir);",
      "  for (const name of fs.readdirSync(dpath)) fs.readFileSync(path.join(dpath, name));",
      "}",
      "process.exit(kept === 1 ? 0 : 1);",
      "",
    ].join("\n"));
    git(["init", "-q", "-b", "main"], copyLab);
    git(["add", "."], copyLab);
    git(["-c", "user.name=lab", "-c", "user.email=lab@example.invalid", "commit", "-q", "-m", "lab"], copyLab);
    const names = (file) => gfTool.gatesFor(copyLab, [file]).some(r => r.gate === "tests/relay-studio.mjs");
    const left = names("tests/left-out.mjs");
    const kept = names("tests/kept.mjs");
    const plain = names("src/plain.mjs");
    const relay = names("src/relay.mjs");
    copyReach = "left=" + left + " kept=" + kept + " plain=" + plain + " relay=" + relay;
    check(left === false && kept === true && plain === true && relay === true,
      "gf21 a tests file the relay-studio gate only copies does not reach it, and an import and a listed src file do: " + copyReach);
  } catch (e) {
    check(false, "gf21 the copy lab did not run: " + (e && e.message || e));
  } finally {
    try { fs.rmSync(copyLab, { recursive: true, force: true }); } catch (e) { /* the leg's own directory */ }
  }

  const declaredAbs = path.join(lab, "tests", "reads-declared.mjs");
  write("tests/reads-declared.mjs", [
    "/* THE DECLARED NODE GATE.",
    " *",
    " * gate-kind: node",
    " */",
    "import fs from \"node:fs\";",
    "window" + "Wall(\"plant\");",
    "",
  ].join("\n"));
  const undeclaredAbs = path.join(lab, "tests", "reads-screen.mjs");
  const decKind = typeof gfTool.windowKind === "function" ? gfTool.windowKind(declaredAbs) : "not exported";
  const undecKind = typeof gfTool.windowKind === "function" ? gfTool.windowKind(undeclaredAbs) : "not exported";
  check(decKind === "node" && undecKind === "window",
    "gf20 windowKind honours gate-kind: node in the header: declared=" + decKind + " undeclared=" + undecKind);

  /* Legs 1 & 2: A file read that src/engine.mjs makes under the pinned engine resolves to
     engine/pinned/<path>, never to Studio's file of the same relative name. */
  const shellRows = gfTool.gatesFor(ROOT, ["shell/main.js"]).map(r => r.gate);
  const pinnedShellRows = gfTool.gatesFor(ROOT, ["engine/pinned/shell/main.js"]).map(r => r.gate);
  check(!shellRows.includes("tests/acceptance.mjs") && pinnedShellRows.includes("tests/acceptance.mjs"),
    "gf22 gates-for shell/main.js no longer lists tests/acceptance.mjs and engine/pinned/shell/main.js does: shell="
    + shellRows.includes("tests/acceptance.mjs") + " pinned=" + pinnedShellRows.includes("tests/acceptance.mjs"));
  check(shellRows.includes("tests/ipc-coerce.mjs"),
    "gf23 gates reading Studio's own shell/main.js (tests/ipc-coerce.mjs) remain listed: "
    + shellRows.includes("tests/ipc-coerce.mjs"));

  /* Leg 4: Planted removal of PINNED resolution turns Leg 1 red, honours ETIUDA_PLANTS=off. */
  const plantsOff = process.env.ETIUDA_PLANTS === "off";
  if (plantsOff) {
    check(true, "gf24 planted removal of PINNED resolution turns Leg 1 red (ETIUDA_PLANTS=off)");
  } else {
    const origToolText = fs.readFileSync(TOOL, "utf8");
    const GUARD = 'if (typeof pinned === "string") { /* plant:pinned-resolve */';
    const plantedToolText = origToolText.replace(GUARD, 'if (false && typeof pinned === "string") { /* plant:pinned-resolve */');
    const plantedOk = plantedToolText !== origToolText;
    let turnedRed = false;
    try {
      fs.writeFileSync(TOOL, plantedToolText);
      const res = spawnSync(process.execPath, [
        "-e",
        'import("./tools/gates-for.mjs").then(gf => { const g = gf.gatesFor(".", ["shell/main.js"]).map(r => r.gate); process.exit(g.includes("tests/acceptance.mjs") ? 0 : 1); });'
      ], { cwd: ROOT, encoding: "utf8" });
      turnedRed = res.status === 0;
    } finally {
      fs.writeFileSync(TOOL, origToolText);
    }
    check(plantedOk && turnedRed,
      "gf24 planted removal of PINNED resolution turns Leg 1 red: planted=" + plantedOk + " turnedRed=" + turnedRed);
  }

  /* Part edges. Each plant names a leg and a file; that file must select the leg.
     While relayStudioParts is missing every one of these is red. */
  const suiteText = fs.readFileSync(path.join(ROOT, "tests", "relay-studio.mjs"), "utf8");
  const plantPairs = [];
  const plantRe = /leg:\s*"([^"]+)"\s*,\s*file:\s*"([^"]+)"/g;
  let plantMatch;
  while ((plantMatch = plantRe.exec(suiteText))) plantPairs.push([plantMatch[1], plantMatch[2]]);
  const partsOf = typeof gfTool.relayStudioParts === "function" ? gfTool.relayStudioParts : () => [];
  const idsOf = typeof gfTool.relayStudioPartIds === "function" ? gfTool.relayStudioPartIds : () => [];
  const partsCache = new Map();
  const partsFor = (file) => {
    if (!partsCache.has(file)) partsCache.set(file, partsOf(ROOT, [file]));
    return partsCache.get(file);
  };
  for (const [leg, file] of plantPairs) {
    check(partsFor(file).includes(leg), "gf25 plant " + leg + " on " + file + " selects that part");
  }
  const partIds = idsOf(ROOT);
  const shellParts = partsFor("shell/main.js");
  check(shellParts.includes("rs926a") && !shellParts.includes("rs2") && partIds.length > shellParts.length && shellParts.length > 0,
    "gf26 shell/main.js selects a proper subset, includes rs926a, excludes rs2: " + shellParts.length + " of " + partIds.length);
  const uiParts = partsFor("ui/app.js");
  check(uiParts.includes("rs926d") && !uiParts.includes("rs2"),
    "gf27 ui/app.js includes rs926d and excludes rs2: " + uiParts.length);
  const studioParts = partsFor("src/studio.mjs");
  check(studioParts.includes("rs926a") && !studioParts.includes("rs1"),
    "gf28 src/studio.mjs includes rs926a and excludes rs1: " + studioParts.length);
  const statsFn = typeof gfTool.relayStudioParts === "function";
  const statsParts = statsFn ? gfTool.relayStudioParts(ROOT, ["src/stats-book.mjs"]) : ["missing"];
  check(statsFn && statsParts.length === 0,
    "gf29 src/stats-book.mjs selects no relay part: " + (statsFn ? String(statsParts.length) : "relayStudioParts missing"));
  const relayParts = partsFor("src/relay.mjs");
  check(relayParts.includes("rs9") && relayParts.includes("rs9k"),
    "gf30 src/relay.mjs includes rs9 and rs9k: " + relayParts.length);
  const edgeMap = typeof gfTool.relayStudioEdges === "function" ? gfTool.relayStudioEdges(ROOT) : new Map();
  let shared = "";
  if (edgeMap && typeof edgeMap.forEach === "function") {
    edgeMap.forEach((set, file) => {
      if (shared) return;
      if (set.has("rsho_c3") && set.has("rsho_e1") && set.has("rsho_c4") && set.has("rsho_c1a")
          && set.has("rsho_c5") && set.has("rsho_c1b")) shared = file;
    });
  }
  check(partIds.includes("rsho_e1") && partIds.includes("rsho_c1a") && partIds.includes("rsho_c1b") && shared !== "",
    "gf31 alias parts rsho_e1, rsho_c1a and rsho_c1b are part ids and share an edge with the part they name: " + (shared || "none"));
  /* studio-edges, 2026-11-10. One gatesFor of the real tree. shell/main.js was already
     asked above (shellRows). A packaging bitmap is reach only when a leg follows
     shell/main.js's open-ended packaging join or electron-builder's globs. */
  const trackedNow = git(["ls-files", "-z"], ROOT).split("\0").filter(Boolean);
  const bitmap = trackedNow.find(f => f.startsWith("packaging/installer/")) || "";
  const edgeFiles = [bitmap, "ui/app.js", "ui/lang.js", "shell/preload.js", "src/relay.mjs",
    "tests/relay-lab.mjs", "electron-builder.js"].filter(Boolean);
  const edgeRows = gfTool.gatesFor(ROOT, edgeFiles);
  const edgeHit = (gate, file) => edgeRows.some(r => r.gate === gate && r.chains.some(c => c.file === file));
  check(!!bitmap && !edgeHit("tests/relay-e2e.mjs", bitmap),
    "gf32 a packaging bitmap does not select relay-e2e: " + bitmap
    + " relay=" + edgeHit("tests/relay-e2e.mjs", bitmap));
  check(!shellRows.includes("tests/relay-e2e.mjs"),
    "gf33 shell/main.js does not select relay-e2e: relay=" + shellRows.includes("tests/relay-e2e.mjs"));
  check(!edgeHit("tests/relay-e2e.mjs", "ui/app.js") && !edgeHit("tests/relay-e2e.mjs", "ui/lang.js"),
    "gf34 neither ui/app.js nor ui/lang.js selects relay-e2e: "
    + "app relay=" + edgeHit("tests/relay-e2e.mjs", "ui/app.js")
    + " lang relay=" + edgeHit("tests/relay-e2e.mjs", "ui/lang.js"));
  check(edgeHit("tests/relay-e2e.mjs", "src/relay.mjs") && edgeHit("tests/relay-e2e.mjs", "tests/relay-lab.mjs"),
    "gf35 relay-e2e still runs for src/relay.mjs and tests/relay-lab.mjs: relay="
    + edgeHit("tests/relay-e2e.mjs", "src/relay.mjs") + " lab=" + edgeHit("tests/relay-e2e.mjs", "tests/relay-lab.mjs"));

  check(PLANT_EDGES >= 200 && plantPairs.length === PLANT_EDGES, "gf37 the floor read " + PLANT_EDGES + " relay-studio plant edges, the same " + plantPairs.length + " gf25 walked, and not a broken read (at least 200)");
  /* PRODUCERS ARE NOT GATES (the test architect, 2026-11-19): a brief that ran every node gate gates-for named built a 118 MB installer
     through tools/package.mjs. A script that starts, builds, packages or releases names no gate; a judging script's step still does. */
  {
    const lab4 = fs.mkdtempSync(path.join(os.tmpdir(), "gates-for-producers-"));
    try {
      const put = (rel, text) => { fs.mkdirSync(path.dirname(path.join(lab4, rel)), { recursive: true }); fs.writeFileSync(path.join(lab4, rel), text); };
      put("package.json", JSON.stringify({ scripts: { test: "node tests/judge.mjs", package: "node tools/package.mjs", "package:linux": "node tools/package-linux.mjs",
        release: "node tools/release.mjs", build: "node tools/build-it.mjs", prestart: "node tools/pre.mjs" } }));
      const reads = "import \"../src/x.js\";\n";
      put("src/x.js", "export const x = 1;\n");
      for (const f of ["tests/judge.mjs", "tools/package.mjs", "tools/package-linux.mjs", "tools/release.mjs", "tools/build-it.mjs", "tools/pre.mjs"]) put(f, reads);
      fs.copyFileSync(TOOL, path.join(lab4, "tools", "gates-for.mjs"));
      git(["init", "-q"], lab4);
      git(["add", "--", "package.json", "src", "tools", "tests"], lab4);
      const gatesOf = () => {
        const res = spawnSync(process.execPath, ["tools/gates-for.mjs", "src/x.js"], { cwd: lab4, encoding: "utf8" });
        let json = null;
        try { json = JSON.parse((String(res.stdout || "").trim().split(/\r?\n/).pop() || "")); } catch (e) { json = null; }
        return { status: res.status, gates: (json && json.gates || []).map(g => g.gate).sort() };
      };
      const got = gatesOf();
      check(got.status === 0 && got.gates.join() === "tests/judge.mjs",
        "gf38 a change read by a judging script and by start, build, package and release scripts names the judging script's step alone: "
        + JSON.stringify(got));
      const gfLab = path.join(lab4, "tools", "gates-for.mjs");
      const gfText = fs.readFileSync(gfLab, "utf8");
      const gfPlanted = gfText.split("\n").map(l => l.includes("/* plant:gf-producers */") ? "" : l).join("\n");
      fs.writeFileSync(gfLab, gfPlanted);
      const lifted = gatesOf();
      fs.writeFileSync(gfLab, gfText);
      check(gfPlanted !== gfText && lifted.gates.includes("tools/package.mjs") && lifted.gates.includes("tools/release.mjs"),
        "gf39 plant: lifting plant:gf-producers names the producers again, so gf38 would go red: " + JSON.stringify(lifted));
    } finally {
      try { fs.rmSync(lab4, { recursive: true, force: true }); } catch (e) { /* the producers lab's own directory */ }
    }
  }

  check(asserted === EXPECTED - 1, "gf8 every leg ran: " + (asserted + 1) + " of " + EXPECTED);
} catch (e) {
  check(false, "gf the plant did not run: " + (e && e.stack || e));
} finally {
  try { fs.rmSync(lab, { recursive: true, force: true }); } catch (e) { /* the plant's own directory */ }
}

process.stdout.write("#counts checks=" + asserted + " failed=" + failed + " expected=" + EXPECTED + "\n");
process.stdout.write(failed ? "RESULT: FAIL " + failed + " failed\n" : "RESULT: ok " + asserted + " check(s)\n");
process.exit(failed ? 1 : 0);
