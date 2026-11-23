/* shell-readers: the pinned shell files Studio ships are the ones it reads, held without a window (the test
 * architect's read, 2026-11-03 12:23).
 *   sr2  Studio's shell/ and src/ read no pinned shell file but tests/shell-shipped.mjs's and the fetch-only main.js
 *   sr3  the scan sees a read: planted reads of a new file, by require path and by at(), are both named
 * Node only. No window. tests/installer.mjs 2f then proves the installed asar carries exactly this set. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SHELL_SHIPPED, SHELL_KEPT_OUT } from "./shell-shipped.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let failed = 0, asserted = 0;
const check = (ok, what) => { asserted++; if (!ok) failed++; process.stdout.write((ok ? "  ok   " : "  FAIL ") + what + "\n"); };

/* A read of a pinned shell file, as Studio writes one: a path through engine/pinned/shell/, or at("shell", ...). The
   policy ADMLs are read by a pattern over the pin's manifest, so a shell/policy/ path in a pattern counts as the ADMLs. */
function readsIn(text) {
  const out = new Set();
  for (const m of text.matchAll(/engine\/pinned\/shell\/([\w./-]+?\.(?:cjs|js|mjs|json|admx|adml|nsh))/g)) out.add("engine/pinned/shell/" + m[1]);
  for (const m of text.matchAll(/\bat\(\s*"shell"((?:\s*,\s*"[^"]+")+)\s*\)/g))
    out.add("engine/pinned/shell/" + [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]).join("/"));
  return [...out];
}
const walk = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : []).flatMap((d) => d.isDirectory()
  ? walk(path.join(dir, d.name)) : /\.(c|m)?js$/.test(d.name) ? [path.join(dir, d.name)] : []);
const known = new Set(SHELL_SHIPPED.map((s) => s.file).concat(SHELL_KEPT_OUT));
const stray = [];
for (const f of walk(path.join(ROOT, "shell")).concat(walk(path.join(ROOT, "src")))) {
  const text = fs.readFileSync(f, "utf8");
  readsIn(text).filter((r) => !known.has(r)).forEach((r) => stray.push(r + " in " + path.relative(ROOT, f).split(path.sep).join("/")));
}
check(stray.length === 0, "sr2 Studio's shell and src read no other pinned shell file: " + (stray.length ? stray.join(", ") : "none"));

const planted = readsIn('const d = require("../engine/pinned/shell/debug-helper.cjs");\nconst x = at("shell", "relay", "spare.cjs");');
check(planted.indexOf("engine/pinned/shell/debug-helper.cjs") > -1 && planted.indexOf("engine/pinned/shell/relay/spare.cjs") > -1,
  "sr3 the scan names a planted read by require path and by at(): " + JSON.stringify(planted));

process.stdout.write("shell-readers  " + asserted + " assertion(s), " + failed + " failure(s)\n");
process.exit(failed ? 1 : 0);
