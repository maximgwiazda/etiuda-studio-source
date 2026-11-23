/* ONE FAILING CATALOG PER LINT RULE, AND A CLEAN TWIN.
 *
 *     node tests/lint-pairs.mjs [--dir <folder>] [--only <key>]
 *
 * A rule that has never rejected anything has been written rather than tested, and a lint is a
 * verifier of somebody's work, so it carries this seat's own failure mode twice over. Each rule
 * of spec section 3.4 gets a catalog that fails exactly it and a twin differing in the fault
 * alone; the runner hands both to the PINNED engine's own linter and asserts that the first is
 * caught and the second is silent in every list the linter returns - errors, warnings, and the
 * awaiting class of board 505, which is where a missing second language went when it stopped
 * being an error per card.
 *
 * WHY THE TWIN MUST BE SILENT AND NOT MERELY DIFFERENT. A fixture pair where the bad one is
 * noisier proves the linter reacted to something. Silence on the twin is what proves it reacted
 * to the fault: it is the separating control, and it is why every twin here differs from its
 * failing partner in one field.
 *
 * WHERE THE PINNED ENGINE HAS NO RULE the pair is still written, and the runner does not take
 * the absence on trust. It asserts the failing fixture passes, prints NOT RUN by the rule's
 * name, and turns RED the day a finding appears, because that is the day rules.json became
 * wrong. An excuse list keyed by a name goes stale in silence otherwise.
 *
 * The fixtures are invented catalogs in the v2 format, carried as .json rather than .ec so that
 * this repository's rule against a catalog file stands untouched: the .ec container is that
 * JSON on its own, so the bytes are what the engine reads either way.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const PINNED = path.join(ROOT, "engine", "pinned");
const require = createRequire(import.meta.url);

function lintOf() {
  const at = path.join(PINNED, "tests", "test.js");
  if (!fs.existsSync(at)) {
    process.stderr.write("lint-pairs: no pinned engine at " + at
      + "\n            run node tools/engine-fetch.mjs first; this gate has no linter of its own\n");
    process.exit(3);
  }
  let pin = "unknown";
  try { pin = JSON.parse(fs.readFileSync(path.join(PINNED, ".engine-pin.json"), "utf8")).pin; }
  catch (e) { /* the drift gate is what makes this loud */ }
  return { lint: require(at).lintCatalog, pin };
}

/* The distance between two strings in single-character edits. This is a MEASURING INSTRUMENT
   and not a lint rule: Studio re-implements nothing the engine has, and the engine has no
   near-duplicate rule at all. What it produces is the curve a threshold would be chosen from. */
function editDistance(a, b) {
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++)
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

function read(dir, name) {
  const at = path.join(dir, name);
  if (!fs.existsSync(at)) throw new Error("no fixture at " + at);
  return JSON.parse(fs.readFileSync(at, "utf8"));
}

function main(argv) {
  const arg = (n, d) => { const i = argv.indexOf(n); return i > -1 && argv[i + 1] != null ? argv[i + 1] : d; };
  const dir = path.resolve(arg("--dir", path.join(HERE, "lint-pairs")));
  const only = arg("--only", null);
  const table = JSON.parse(fs.readFileSync(path.join(dir, "rules.json"), "utf8"));
  const { lint, pin } = lintOf();

  process.stdout.write("lint-pairs: the linter of engine " + pin.slice(0, 7)
    + ", " + table.rules.length + " rule(s) of spec 3.4 over " + dir + "\n");

  let asserted = 0, failed = 0;
  const notRun = [];
  for (const rule of table.rules) {
    if (only && rule.key !== only) continue;
    const bad = lint(read(dir, rule.key + ".bad.json"));
    const good = lint(read(dir, rule.key + ".good.json"));
    /* ALL THREE LISTS, since the pin moved to an engine with board 505's awaiting class: a twin
       that is silent in two of them and speaks in the third is not silent. `|| []` and not a
       bare read, because an engine before 505 returns no such list at all and the twin's silence
       there is then over the two lists it does have. */
    const all = r => r.errors.concat(r.warnings, r.awaiting || []);
    const re = new RegExp(rule.expect);

    if (rule.implemented) {
      const hit = (bad[rule.severity] || []).filter(s => re.test(s));
      if (!hit.length) {
        failed++;
        process.stderr.write("  FAIL " + rule.key + ": the failing fixture was not caught. "
          + rule.severity + " were " + JSON.stringify(bad[rule.severity]) + "\n");
      } else if (all(good).length) {
        failed++;
        process.stderr.write("  FAIL " + rule.key + ": the clean twin is not silent - "
          + JSON.stringify(all(good)) + "\n");
      } else {
        asserted++;
        process.stdout.write("  ok   " + rule.key + " (" + rule.severity.replace(/s$/, "")
          + "): " + hit[0] + "; the twin says nothing\n");
      }
      continue;
    }

    /* Not implemented, and that is a measurement rather than a claim. */
    if (all(bad).length) {
      failed++;
      process.stderr.write("  FAIL " + rule.key + ": rules.json says the pinned engine has no"
        + " such rule and the failing fixture produced " + JSON.stringify(all(bad))
        + ". If the rule has landed, set implemented to true and give expect its real text.\n");
    } else if (all(good).length) {
      failed++;
      process.stderr.write("  FAIL " + rule.key + ": the clean twin is not silent - "
        + JSON.stringify(all(good)) + "\n");
    } else {
      notRun.push(rule.key);
      process.stdout.write("  NOT RUN " + rule.key + ": " + rule.why
        + " (proved: the failing fixture passes the pinned lint in silence)\n");
    }
  }

  /* ---- the curve, where a pair would be a lie ---- */
  if (!only) {
    const c = table.curve;
    const cat = read(dir, c.file);
    const first = cat.cards[0].title.en;
    const r = lint(cat);
    const rows = cat.cards.slice(1).map(card => {
      const t = card.title.en;
      const d = editDistance(first, t);
      return { id: card.id, distance: d,
               similarity: Math.round((1 - d / Math.max(first.length, t.length)) * 1000) / 1000 };
    });
    process.stdout.write("  NOT RUN near-duplicate-title: " + c.why + "\n");
    process.stdout.write("    curve over " + first.length + " characters, edits then similarity: "
      + rows.map(x => x.distance + " -> " + x.similarity.toFixed(3)).join(", ") + "\n");
    if (r.errors.length + r.warnings.length) {
      failed++;
      process.stderr.write("  FAIL near-duplicate-title: the curve fixture is meant to be a legal"
        + " catalog and the pinned lint said " + JSON.stringify(r.errors.concat(r.warnings)) + "\n");
    }
  }

  process.stdout.write("lint-pairs: " + asserted + " rule(s) asserted, " + notRun.length
    + " NOT RUN (" + (notRun.join(", ") || "none") + "), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

export { editDistance, lintOf };

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]))
  main(process.argv.slice(2));
