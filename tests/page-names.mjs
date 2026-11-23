/* ONE NAME, ONE DECLARATION, IN THE PAGE'S OWN SCOPE (the test architect's read of vision-gamma, 2026-10-07).
 *
 *     node tests/page-names.mjs
 *
 * ui/app.js is one function's body, and three branches built on it at once. Two of them declared a helper of the same
 * name, `glide`, outside every conflict hunk, so a merge resolved hunk by hunk kept both: a second `function` of a
 * name silently answers every call to the first (Projects as places' tier names reached the vision ideas' glide, and
 * the stand-in, whose elements have no animate(), could not see it), and a second `const` of a name (`M_EASE`) stops
 * the page from parsing at all. Neither is a conflict to git. This leg reads the page as a merge leaves it.
 *
 *   pn1  ui/app.js compiles (vm.Script), so no `const`, `let` or `class` name is declared twice in one scope
 *   pn2  no name is declared twice at the page's top level, the IIFE's own body: a line indented two spaces and
 *        opening with function, async function, function*, const, let, var or class, read with comments taken out
 *        by tests/source-text.mjs; the first name of each declaration is the one read
 *   pn3  CONTROLS, on the page itself: a second `function` of the page's first function's name, planted before the
 *        closing line, is listed by pn2's reading, and a second `const` of its first const's name fails pn1's
 *
 * What it cannot see: a duplicate in a nested function's scope that is a `function` (legal there too), and the second
 * and later names of `const a = 1, b = 2`; neither shape occurs at the page's top level on 2026-10-07.
 *
 * Node only, no window. Exit 0 when every check holds, 1 when any fails.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { withoutComments } from "./source-text.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const EXPECTED = 4;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}

/** Whether the text compiles, and the engine's own words when it does not. */
export function compiles(text) {
  try { new vm.Script(text, { filename: "app.js" }); return ""; } catch (e) { return String(e && e.message); }
}

const DECL = /^ {2}(?:async\s+)?(?:function\s*\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm;
/** Every name declared twice or more at the page's top level, sorted, each with its line numbers. */
export function repeated(text) {
  const plain = withoutComments(text, "app.js");
  const at = new Map();
  for (const m of plain.matchAll(DECL)) {
    const line = plain.slice(0, m.index).split("\n").length;
    if (!at.has(m[1])) at.set(m[1], []);
    at.get(m[1]).push(line);
  }
  return [...at].filter(([, lines]) => lines.length > 1).map(([n, lines]) => n + "@" + lines.join(",")).sort();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const app = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
  const said = compiles(app);
  check(said === "", "pn1 ui/app.js compiles: " + (said || "yes"));
  const twice = repeated(app);
  const names = (withoutComments(app, "app.js").match(DECL) || []).length;
  check(twice.length === 0 && names > 300,
    "pn2 each of the " + names + " top-level declarations of ui/app.js names its own name: repeated " + JSON.stringify(twice));

  const close = app.lastIndexOf("\n})();");
  const plant = (line) => app.slice(0, close) + "\n" + line + app.slice(close);
  const firstFn = /^ {2}function\s+([A-Za-z_$][\w$]*)/m.exec(withoutComments(app, "app.js"));
  const fname = firstFn ? firstFn[1] : "glide";
  const fn = repeated(plant("  function " + fname + "() { return null; }"));
  check(!!firstFn && fn.some(n => n.indexOf(fname + "@") === 0),
    "pn3a CONTROL: a second function " + fname + " planted at the top level is listed: " + JSON.stringify(fn));
  const firstConst = /^ {2}const\s+([A-Za-z_$][\w$]*)/m.exec(withoutComments(app, "app.js"));
  const cs = compiles(plant("  const " + (firstConst ? firstConst[1] : "M_EASE") + " = 0;"));
  check(close > 0 && !!firstConst && cs.indexOf("'" + firstConst[1] + "' has already been declared") >= 0,
    "pn3b CONTROL: a second const " + (firstConst ? firstConst[1] : "?") + " planted at the top level does not compile: " + cs);

  if (asserted !== EXPECTED) { failed++; process.stdout.write("  FAIL expected " + EXPECTED + " checks, ran " + asserted + "\n"); }
  console.log("#counts checks=" + asserted + " failed=" + failed);
  console.log("page-names: " + asserted + " check(s), " + failed + " failure(s)");
  process.exit(failed ? 1 : 0);
}
