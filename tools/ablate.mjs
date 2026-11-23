#!/usr/bin/env node
/* DOES A GATE MEASURE ANYTHING? The control is to take the behaviour away and see who says so.
 *
 *     node tools/ablate.mjs plan
 *     node tools/ablate.mjs sweep [--mode noop|identity] [--budget 75] [--only <m.mjs>]
 *     node tools/ablate.mjs total [--mode noop|identity]
 *     node tools/ablate.mjs exports [--sample 5] [--budget 75]
 *     node tools/ablate.mjs mutate <mode> [module...] | mutate-one <mode> <module> <name>
 *     node tools/ablate.mjs verify <mode> [module...] | restore
 *
 * WHAT IT DOES TO A MODULE IS THE WHOLE OF ITS HONESTY. An ES module's exports are LIVE
 * BINDINGS, so reassigning an exported function declaration inside the module changes what every
 * importer sees while the declaration's own source text stays byte for byte intact. Nothing is
 * rebuilt because there is nothing to rebuild, and no gate reads src/ as text, so the mutation
 * reaches the subject the moment it is written. Measured on a fixture before it was used here:
 * a name exported through a trailing block and a name exported inline both go away for the
 * importer; a `const` arrow does not, which is why those are counted unablatable and left alone.
 *
 * THE LIVENESS FLOOR. Next door the floor is "rebuild, hash the artefact, find the marker in it".
 * That is vacuous here, because the module file IS the artefact, so this rig uses two clauses:
 *
 *   1. The mutation is on disk and ONLY there: `git diff --name-only` equals exactly the set
 *      asked for, each of those carries the marker, and nothing untracked appeared. A case that
 *      fails this is REFUSED, never recorded "not noticed".
 *   2. The gate must have EVALUATED the module it is credited with noticing. tools/ablate-touch.mjs
 *      registers a loader hook through --import that records every src/*.mjs the gate process
 *      loads, and the hook is inherited by the Electron child, so a window gate's main-process
 *      loads are recorded too. A gate that reddens without the module in its record is written
 *      RED-UNSEEN rather than NOTICED.
 *
 * THE INSTRUMENT IS CONSERVATIVE, so it can only flatter a gate: an unablatable export is left
 * alone, and a gate is credited with noticing on its exit code, which is the weakest thing a gate
 * can say.
 *
 * THE TREE COMES BACK CLEAN. Restore is `git checkout -- src/` to HEAD after every case, checked
 * with `git status --porcelain`, so any edit of your own in src/ must be committed first.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const SRC = join(ROOT, "src");
const MARK = "/*ablate:";
const TOUCH = join(HERE, "ablate-touch.mjs");
const RUNS = join(HERE, "..", "..", "etiuda-runs", "ablate-studio");

const modules = () => readdirSync(SRC).filter((f) => f.endsWith(".mjs")).sort();

/* Every exported name, and whether its binding can be reassigned. */
function surface(file) {
  const text = readFileSync(join(SRC, file), "utf8");
  const names = new Set();
  for (const m of text.matchAll(/^export\s*\{([\s\S]*?)\}\s*;?\s*$/gm))
    for (const raw of m[1].split(",")) {
      const n = raw.trim().split(/\s+as\s+/)[0].trim();
      if (n) names.add(n);
    }
  for (const m of text.matchAll(/^export\s+(?:async\s+)?function\s+([A-Za-z0-9_$]+)/gm))
    names.add(m[1]);
  const fns = [];
  const other = [];
  for (const n of names) {
    const decl = new RegExp(
      "^(?:export\\s+)?(?:async\\s+)?function\\s+" + n.replace(/\$/g, "\\$") + "\\s*\\(",
      "m",
    );
    (decl.test(text) ? fns : other).push(n);
  }
  return { file, text, fns: fns.sort(), other: other.sort() };
}

const lineFor = (mode, n) => (mode === "noop" ? `${n} = function () {};` : `${n} = ${n};`);

function mutate(mode, files, only) {
  let total = 0;
  for (const f of files) {
    const s = surface(f);
    if (s.text.includes(MARK)) throw new Error("already mutated: " + f);
    const names = only ? s.fns.filter((n) => n === only) : s.fns;
    if (only && !names.length) throw new Error("not an ablatable export: " + f + " " + only);
    if (!names.length) continue;
    writeFileSync(
      join(SRC, f),
      s.text + `\n${MARK}${mode}*/\n` + names.map((n) => lineFor(mode, n)).join("\n") + "\n",
    );
    total += names.length;
  }
  return total;
}

/* Floor clause 1. */
function verify(mode, files) {
  const want = new Set(files.map((f) => "src/" + f));
  const git = (...a) => execFileSync("git", ["-C", ROOT, ...a], { encoding: "utf8" }).split("\n").filter(Boolean);
  const changed = git("diff", "--name-only");
  const untracked = git("ls-files", "-o", "--exclude-standard");
  const problems = [];
  for (const c of changed) if (!want.has(c)) problems.push("changed but not asked: " + c);
  for (const f of files) {
    const has = readFileSync(join(SRC, f), "utf8").includes(MARK + mode);
    if (!has && surface(f).fns.length) problems.push("no marker in " + f);
    if (has && !changed.includes("src/" + f)) problems.push("marker but git sees no change: " + f);
  }
  if (untracked.length) problems.push("untracked appeared: " + untracked.join(","));
  if (problems.length) {
    console.log("REFUSED\n  " + problems.join("\n  "));
    return false;
  }
  return true;
}

function restore() {
  execFileSync("git", ["-C", ROOT, "checkout", "--", "src/"], { stdio: "ignore" });
  const dirty = execFileSync("git", ["-C", ROOT, "status", "--porcelain"], { encoding: "utf8" }).trim();
  if (dirty) {
    console.log("DIRTY AFTER RESTORE:\n" + dirty);
    process.exit(4);
  }
}

/* The gates of npm test, run SINGLY rather than as the && chain, so a red gate does not hide the
   ones after it. Ordered cheapest first from a timing file if one has been written. */
function gates() {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  return pkg.scripts.test.split("&&").map((s) => s.trim().replace(/^node\s+/, "")).filter(Boolean);
}

function runGate(gate, loadLog) {
  const r = spawnSync(process.execPath, [gate], {
    cwd: ROOT,
    encoding: "utf8",
    env: {
      ...process.env,
      NODE_OPTIONS: `--import ${pathToFileURL(TOUCH).href}`,
      ABLATE_TOUCH: loadLog,
    },
  });
  const out = (r.stdout || "") + (r.stderr || "");
  return {
    exit: r.status === null ? 99 : r.status,
    ok: (out.match(/^ {2}ok/gm) || []).length,
    fail: (out.match(/^ {2}(FAIL|not ok|x )/gm) || []).length,
    out,
  };
}

function loaded(logPath, file) {
  try {
    return readFileSync(logPath, "utf8").split("\n").includes(file);
  } catch {
    return false;
  }
}

/* One case: mutate, floor, run gates in order, stop at the first red or at the budget. */
function oneCase(mode, file, only, order, budget, tag) {
  mkdirSync(RUNS, { recursive: true });
  const log = join(RUNS, "loads-" + tag + ".txt");
  rmSync(log, { force: true });
  mutate(mode, [file], only);
  if (!verify(mode, [file])) {
    restore();
    return { verdict: "REFUSED", gate: "-", ran: 0 };
  }
  const t0 = Date.now();
  let verdict = "BLIND";
  let gate = "-";
  let ran = 0;
  for (const g of order) {
    const r = runGate(g, log);
    ran += 1;
    if (r.exit !== 0) {
      verdict = loaded(log, file) ? "NOTICED" : "RED-UNSEEN";
      gate = g.replace(/^tests\//, "").replace(/\.mjs$/, "");
      break;
    }
    if (budget && (Date.now() - t0) / 1000 >= budget) {
      verdict = "BLIND-CAPPED";
      break;
    }
  }
  restore();
  rmSync(log, { force: true });
  return { verdict, gate, ran, secs: Math.round((Date.now() - t0) / 1000) };
}

const argv = process.argv.slice(2);
const cmd = argv[0];
const flag = (name, dflt) => {
  const i = argv.indexOf("--" + name);
  return i === -1 ? dflt : argv[i + 1];
};
const mode = flag("mode", "noop");
if (mode !== "noop" && mode !== "identity") throw new Error("mode is noop or identity");

if (cmd === "plan") {
  let f = 0, o = 0;
  for (const m of modules()) {
    const s = surface(m);
    f += s.fns.length;
    o += s.other.length;
    console.log(`${m.padEnd(18)} ablatable=${String(s.fns.length).padStart(3)} unablatable=${String(s.other.length).padStart(3)}  ${s.other.join(" ")}`);
  }
  console.log(`#counts modules=${modules().length} ablatable=${f} unablatable=${o}`);
} else if (cmd === "mutate") {
  console.log(`mutated ${mutate(mode, argv.length > 2 ? argv.slice(2) : modules())} export(s)`);
} else if (cmd === "mutate-one") {
  mutate(mode, [argv[2]], argv[3]);
  console.log(`mutated ${argv[2]} ${argv[3]}`);
} else if (cmd === "verify") {
  process.exitCode = verify(mode, argv.length > 2 ? argv.slice(2) : modules()) ? 0 : 3;
} else if (cmd === "restore") {
  restore();
  console.log("tree clean");
} else if (cmd === "total") {
  const all = modules();
  const n = mutate(mode, all);
  if (!verify(mode, all)) {
    restore();
    process.exit(3);
  }
  mkdirSync(RUNS, { recursive: true });
  const log = join(RUNS, "loads-total.txt");
  rmSync(log, { force: true });
  let green = 0, ok = 0, fail = 0;
  for (const g of gates()) {
    const r = runGate(g, log);
    if (r.exit === 0) green += 1;
    ok += r.ok;
    fail += r.fail;
    console.log(`  ${r.exit === 0 ? "GREEN" : "red  "} ${g.padEnd(28)} exit=${r.exit} ok=${r.ok} fail=${r.fail}`);
  }
  restore();
  console.log(`#counts mode=${mode} exports=${n} gates=${gates().length} green=${green} ok=${ok} fail=${fail}`);
} else if (cmd === "sweep") {
  const only = flag("only", null);
  const budget = Number(flag("budget", 0));
  const order = gates();
  const list = only ? [only] : modules();
  /* A REFUSED CASE EXITS 3, ballot 4 of the fourth meeting (2026-09-23): the floor refusing a
     case means that module was never measured, and before this the run still exited 0 with the
     case counted as notNoticed. `verify` already exits 3 on the same refusal. */
  let noticed = 0, blind = 0, refused = 0;
  for (const m of list) {
    const r = oneCase(mode, m, null, order, budget, m);
    if (r.verdict === "NOTICED") noticed += 1;
    else blind += 1;
    if (r.verdict === "REFUSED") refused += 1;
    console.log(`  ${m.padEnd(18)} ${r.verdict.padEnd(13)} ${r.gate.padEnd(16)} ran=${r.ran} ${r.secs}s`);
  }
  console.log(`#counts mode=${mode} modules=${list.length} noticed=${noticed} notNoticed=${blind}`);
  if (refused) process.exitCode = 3;
} else if (cmd === "exports") {
  const sample = Number(flag("sample", 1));
  const budget = Number(flag("budget", 75));
  const order = gates();
  const cases = [];
  for (const m of modules()) for (const n of surface(m).fns) cases.push([m, n]);
  const taken = cases.filter((_, i) => i % sample === 0);
  let noticed = 0, other = 0, refused = 0;
  for (const [m, n] of taken) {
    const r = oneCase(mode, m, n, order, budget, m + "-" + n);
    if (r.verdict === "NOTICED") noticed += 1;
    else other += 1;
    if (r.verdict === "REFUSED") refused += 1;
    console.log(`  ${(m + " " + n).padEnd(36)} ${r.verdict.padEnd(13)} ${r.gate.padEnd(16)} ran=${r.ran} ${r.secs}s`);
  }
  console.log(`#counts mode=${mode} exports=${cases.length} sampled=${taken.length} noticed=${noticed} notNoticed=${other}`);
  if (refused) process.exitCode = 3;
} else {
  console.log("plan | sweep | total | exports | mutate | mutate-one | verify | restore");
  process.exitCode = 2;
}
