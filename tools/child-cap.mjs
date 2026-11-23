/* THE CHILD-CAP GUARD: a new test file starts at most five child processes (regimen rule 11).
 *
 * Statically counts child process call sites in JavaScript sources. A call inside a loop
 * counts once: this is a static count, and that is its known blind spot.
 *
 * How .exec() is counted: we inspect imports and requires for node:child_process and child_process
 * to collect names bound to it (such as cp or child_process). Calls to .exec( are only counted if
 * the receiver is one of those bound names; bare exec( calls without a dot receiver are also
 * counted. Regular expression calls like re.exec() or /regex/.exec() are ignored because their
 * receiver is not bound to child_process.
 *
 * Two shapes are not a child's start, and are not counted (2026-11-17, when a stand-in for child_process met this guard):
 *   - a member call of the spawn family on an object the file itself makes with a literal (`const fake = {}`; `fake.spawnSync(`):
 *     the receiver is shown to be the file's own. A literal that names a binding of child_process keeps the module's own
 *     functions and is not such an object. A receiver the tool cannot place is STILL COUNTED, as before: unknown counts.
 *   - a method's definition: the family's name, its parenthesised parameters, then `{` directly (`execFileSync(file, args) {`).
 *     A call is never followed by `{` directly.
 * The names bound to child_process are collected whole first: a default or namespace import, a require, a dynamic import, and a
 * plain alias of any of those.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/* Shared test helpers in this tree that start a child process. */
export const SHARED_HELPERS = [
  // tests/shell-door.mjs:532: openStudio starts the app
  "openStudio",
  // tests/shell-door.mjs:637: runStudio starts the app
  "runStudio",
  // tests/shell-door.mjs:354: processTable lists processes through a child
  "processTable",
  // tests/shell-door.mjs:334: windowsOf reads a process's windows through a child
  "windowsOf",
  // tests/shipped-sample.mjs:51: sampleIsShipped asks git through a child
  "sampleIsShipped",
  // tests/plants-tree.mjs:140: plantsTree starts a child process
  "plantsTree",
  // tests/deny-binds.mjs:23: denyBinds sets and takes back a deny through icacls
  "denyBinds",
];

/* Strip comments while preserving code, string literals and character offsets. */
function stripComments(source) {
  let out = "";
  let i = 0;
  const n = source.length;
  while (i < n) {
    const c = source[i];
    const d = source[i + 1];
    // Line comment
    if (c === "/" && d === "/") {
      while (i < n && source[i] !== "\n") {
        out += " ";
        i++;
      }
      continue;
    }
    // Block comment
    if (c === "/" && d === "*") {
      out += "  ";
      i += 2;
      while (i < n && !(source[i] === "*" && source[i + 1] === "/")) {
        out += source[i] === "\n" ? "\n" : " ";
        i++;
      }
      if (i < n) {
        out += "  ";
        i += 2;
      }
      continue;
    }
    // String literal
    if (c === "'" || c === '"') {
      const q = c;
      out += c;
      i++;
      while (i < n && source[i] !== q) {
        if (source[i] === "\\") {
          out += source[i] + (source[i + 1] || "");
          i += 2;
          continue;
        }
        out += source[i++];
      }
      if (i < n) out += source[i++];
      continue;
    }
    // Template literal
    if (c === "`") {
      out += c;
      i++;
      while (i < n && source[i] !== "`") {
        if (source[i] === "\\") {
          out += source[i] + (source[i + 1] || "");
          i += 2;
          continue;
        }
        out += source[i++];
      }
      if (i < n) out += source[i++];
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

/* Statically find all child process starting call sites in a JavaScript source. */
export function findChildCalls(source) {
  const code = stripComments(source || "");

  // Collect names bound to child_process via import or require
  const bindings = new Set(["child_process"]);
  const importRe = /\bimport\s+(?:\*\s+as\s+([A-Za-z0-9_$]+)|([A-Za-z0-9_$]+))\s+from\s+['"](?:node:)?child_process['"]/g;
  let m;
  while ((m = importRe.exec(code)) !== null) {
    const name = m[1] || m[2];
    if (name) bindings.add(name);
  }
  const requireRe = /\b(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:nodeRequire|require)\s*\(\s*['"](?:node:)?child_process['"]\s*\)/g;
  while ((m = requireRe.exec(code)) !== null) {
    if (m[1]) bindings.add(m[1]);
  }
  /* A dynamic import: const cp = await import("node:child_process"), with or without the await or a parenthesis round it. */
  const dynamicRe = /\b(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*\(?\s*(?:await\s+)?import\s*\(\s*['"](?:node:)?child_process['"]\s*\)/g;
  while ((m = dynamicRe.exec(code)) !== null) {
    if (m[1]) bindings.add(m[1]);
  }
  /* A plain alias of a binding (const run = cp), followed until no new name appears. */
  const aliasRe = /\b(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*([A-Za-z0-9_$]+)\s*(?=[;,\r\n])/g;
  for (let grew = true; grew;) {
    grew = false;
    aliasRe.lastIndex = 0;
    while ((m = aliasRe.exec(code)) !== null) {
      if (bindings.has(m[2]) && !bindings.has(m[1])) { bindings.add(m[1]); grew = true; }
    }
  }
  /* The file's own objects: a name the file itself makes with an object literal, and that is no binding. A member call of the
     spawn family on one of these starts nothing; on any other receiver the tool cannot place, it still counts. */
  const own = new Set();
  const ownRe = /\b(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*\{/g;
  while ((m = ownRe.exec(code)) !== null) {
    if (!m[1] || bindings.has(m[1])) continue;
    /* The literal's own text, to its matching brace (strings skipped). One that names a binding of child_process keeps the
       module's own functions (const saved = { execFileSync: cp.execFileSync }) and is no object of the file's own. */
    let depth = 0, i = m.index + m[0].length - 1;
    const from = i;
    for (; i < code.length; i++) {
      const ch = code[i];
      if (ch === '"' || ch === "'" || ch === "`") {
        for (i++; i < code.length && code[i] !== ch; i++) if (code[i] === "\\") i++;
        continue;
      }
      if (ch === "{") depth++;
      else if (ch === "}") { depth--; if (depth === 0) break; }
    }
    const body = code.slice(from, i + 1);
    let keeps = false;
    for (const name of bindings) if (new RegExp("(?<![\\w$])" + name.replace(/[$]/g, "\\$&") + "(?![\\w$])").test(body)) keeps = true;
    if (!keeps) own.add(m[1]);
  }
  /* A method's definition, not a call: from the opening parenthesis at `open`, its matching close (strings skipped), then `{`
     directly. */
  const definesAt = (open) => {
    let depth = 0, i = open;
    for (; i < code.length; i++) {
      const ch = code[i];
      if (ch === '"' || ch === "'" || ch === "`") {
        for (i++; i < code.length && code[i] !== ch; i++) if (code[i] === "\\") i++;
        continue;
      }
      if (ch === "(") depth++;
      else if (ch === ")") { depth--; if (depth === 0) break; }
    }
    if (i >= code.length) return false;
    let j = i + 1;
    while (j < code.length && /\s/.test(code[j])) j++;
    return code[j] === "{";
  };

  const calls = [];

  // 1. Spawning calls: spawn, spawnSync, execSync, execFile, execFileSync, fork
  // Bare: spawn( or member: cp.spawnSync(
  const spawnMemberRe = /(?<![\w$.])([A-Za-z0-9_$]+)\.(spawn|spawnSync|execSync|execFile|execFileSync|fork)\s*\(/g;
  while ((m = spawnMemberRe.exec(code)) !== null) {
    if (/\bfunction\s*$/.test(code.slice(0, m.index))) continue;
    if (!bindings.has(m[1]) && own.has(m[1])) continue; /* the file's own object: nothing starts */
    calls.push({ index: m.index, name: m[1] + "." + m[2] });
  }
  const spawnBareRe = /(?<![\w$.])(spawn|spawnSync|execSync|execFile|execFileSync|fork)\s*\(/g;
  while ((m = spawnBareRe.exec(code)) !== null) {
    if (/\bfunction\s*$/.test(code.slice(0, m.index))) continue;
    if (definesAt(m.index + m[0].length - 1)) continue; /* a method's definition */
    calls.push({ index: m.index, name: m[1] });
  }

  // 2. exec calls: bare exec( or receiver.exec( where receiver is bound to child_process
  const execMemberRe = /(?<![\w$.])([A-Za-z0-9_$]+)\.exec\s*\(/g;
  while ((m = execMemberRe.exec(code)) !== null) {
    if (/\bfunction\s*$/.test(code.slice(0, m.index))) continue;
    if (bindings.has(m[1])) {
      calls.push({ index: m.index, name: m[1] + ".exec" });
    }
  }
  const execBareRe = /(?<![\w$.])exec\s*\(/g;
  while ((m = execBareRe.exec(code)) !== null) {
    if (/\bfunction\s*$/.test(code.slice(0, m.index))) continue;
    if (definesAt(m.index + m[0].length - 1)) continue; /* a method's definition */
    calls.push({ index: m.index, name: "exec" });
  }

  // 3. Headless browser launches: puppeteer.launch, chromium.launch, firefox.launch, webkit.launch
  const browserRe = /(?<![\w$.])(puppeteer|chromium|firefox|webkit)\.launch\s*\(/g;
  while ((m = browserRe.exec(code)) !== null) {
    if (/\bfunction\s*$/.test(code.slice(0, m.index))) continue;
    calls.push({ index: m.index, name: m[1] + ".launch" });
  }

  // 4. Shared test helpers from SHARED_HELPERS
  for (const helper of SHARED_HELPERS) {
    const helperMemberRe = new RegExp(`(?<![\\w$.])([A-Za-z0-9_$]+)\\.${helper}\\s*\\(`, "g");
    while ((m = helperMemberRe.exec(code)) !== null) {
      if (/\bfunction\s*$/.test(code.slice(0, m.index))) continue;
      calls.push({ index: m.index, name: m[1] + "." + helper });
    }
    const helperBareRe = new RegExp(`(?<![\\w$.])${helper}\\s*\\(`, "g");
    while ((m = helperBareRe.exec(code)) !== null) {
      if (/\bfunction\s*$/.test(code.slice(0, m.index))) continue;
      calls.push({ index: m.index, name: helper });
    }
  }

  // Sort calls by their appearance in the source code
  calls.sort((a, b) => a.index - b.index);
  return calls.map(c => c.name);
}

/* Statically count the child process starting call sites in a JavaScript source. */
export function countChildren(source) {
  return findChildCalls(source).length;
}

/* List added test files under tests/ matching .js, .mjs or .cjs from git diff. */
export function addedTestFiles(base, cwd) {
  const target = base || "main";
  const root = cwd || process.cwd();
  let stdout = "";
  try {
    stdout = execFileSync("git", ["diff", "--name-only", "--diff-filter=A", `${target}...HEAD`], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (err) {
    const raw = (err.stderr || err.message || "").toString("utf8").trim();
    const firstLine = raw.split(/\r?\n/)[0] || "unknown git error";
    process.stderr.write(`child-cap: git diff --name-only --diff-filter=A ${target}...HEAD failed: ${firstLine}\n`);
    process.exit(78);
  }
  return stdout
    .split(/\r?\n/)
    .map(line => line.trim().replace(/\\/g, "/"))
    .filter(file => file.startsWith("tests/") && /\.(js|mjs|cjs)$/.test(file));
}

/* Check a list of [{file, source}] against the cap of 5 child processes. */
export function checkFiles(files) {
  if (!files || files.length === 0) {
    return {
      ok: true,
      lines: [
        "  ok   child-cap no new test files",
        "#counts checks=0 failed=0",
      ],
    };
  }
  let failed = 0;
  const lines = [];
  for (const item of files) {
    const file = item && item.file ? item.file : "unknown";
    const source = item && item.source ? item.source : "";
    const names = findChildCalls(source);
    const count = names.length;
    if (count > 5) {
      failed++;
      lines.push(
        `  FAIL child-cap ${file} starts ${count} child processes, over the cap of 5 (regimen rule 11; static count: ${names.join(", ")})`
      );
    } else {
      lines.push(`  ok   child-cap ${file} starts ${count} child process(es)`);
    }
  }
  lines.push(`#counts checks=${files.length} failed=${failed}`);
  return { ok: failed === 0, lines };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const base = process.argv[2] || "main";
  /* A BASE WITH NO HISTORY (2026-11-23). The public repository's first tree has no tree before it, so its area is planned
     against the empty tree (.github/workflows/hosted-area.yml): every file is in its diff, and none is a test file new against a
     commit, which is what rule 11 judges. A base that is a tree and not a commit is said so and judged as nothing new. */
  const isTree = spawnSync("git", ["cat-file", "-t", base], { encoding: "utf8" });
  if (isTree.status === 0 && isTree.stdout.trim() === "tree") {
    process.stdout.write("  ok   child-cap the base " + base + " is a tree with no history, so no test file is new against it\n#counts checks=0 failed=0\n");
    process.exit(0);
  }
  const added = addedTestFiles(base);
  const files = added.map(file => ({
    file,
    source: fs.readFileSync(path.resolve(process.cwd(), file), "utf8"),
  }));
  const result = checkFiles(files);
  for (const line of result.lines) {
    process.stdout.write(line + "\n");
  }
  process.exit(result.ok ? 0 : 1);
}
