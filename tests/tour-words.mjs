/* THE TOUR'S WORDS (Argon's first-day review, F10).
 *
 *     node tests/tour-words.mjs
 *
 * The page runs on tests/page-stand-in.mjs over the tour's own array. The steps' words themselves (tw1, tw2, tw4,
 * tw5) were retired on 2026-11-11 (Max 18:54, Claude α's ruling 19:10): each could go red only when the words were
 * changed on purpose; tests/tour.mjs section 2 holds every step's strings to the table.
 *
 *   tw3  the shell refuses a stored step past the last one, so its ceiling is the number of steps.
 *
 * Plants run in a scratch copy (tests/plant-copy.mjs), each child running one leg (TOUR_WORDS_ONLY).
 * ETIUDA_PLANTS=off skips that phase and counts each plant skipped.
 *
 * Node only, no window, no Electron. Exit 0 when every check holds, 1 when any fails.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPage } from "./page-stand-in.mjs";
import { copyPlants } from "./plant-copy.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const EXPECTED = 3;
const SELF = fileURLToPath(import.meta.url);
const ONLY = process.env.TOUR_WORDS_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
let skipped = 0;
function skip(line) {
  skipped++;
  process.stdout.write("  SKIP  " + line + "\n");
}

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}
const want = (id) => !ONLY || ONLY === id;

const home = loadPage({ uiLang: "en" });
const tour = home.page.__get("TOUR");

if (want("tw3")) {
  const shell = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  const n = /const TOUR_STEPS = (\d+);/.exec(shell);
  const ceiling = n ? Number(n[1]) : null;
  check(ceiling === tour.length && tour.length === 10,
    "tw3 the shell's resume ceiling is the number of steps: TOUR_STEPS " + ceiling + ", steps " + tour.length);
}

if (!ONLY) {
  copyPlants({
    root: ROOT, self: SELF, label: "tour-words", onlyVar: "TOUR_WORDS_ONLY", check, skip,
    plants: [
      { mark: "f10-count", leg: "tw3", rel: "shell/main.js",
        line: "const TOUR_STEPS = 9;" },
    ],
  });
}

process.stdout.write("tour-words  " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)"
  + (PLANTS_OFF ? " (ETIUDA_PLANTS=off)" : "") + "\n");
process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + "\n");
if (!ONLY && asserted + skipped !== EXPECTED) {
  process.stdout.write("tour-words  expected " + EXPECTED + " assertions, ran " + (asserted + skipped) + "\n");
  failed++;
}
process.exit(failed ? 1 : 0);
