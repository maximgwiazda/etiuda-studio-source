/* LAND WRITES THE BYTES THE COVER SHOWED, OR IT WRITES NOTHING.
 *
 *     node tests/import-shown.mjs [--keep]
 *
 * A plan remembers the sha256 of the file it read. Land with that hash, after the file has
 * been saved again, is refused and no project is created. Land with no hash still writes,
 * which is every caller that has no cover. Land with the hash of the file as it is now
 * writes that file.
 *
 * The plant lifts the comparison. ETIUDA_PLANTS=off skips that proof and prints NOT RUN.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { importPlan, importLand } from "../src/studio.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { copyPlants } from "./plant-copy.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "import-shown");
const SELF = fileURLToPath(import.meta.url);
const ONLY = process.env.IMPORT_SHOWN_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const FRAME = "the file has changed since it was shown, so nothing from it has gone in;"
  + " chosen again, it shows what it holds now";

let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}
function skip(line) {
  skipped++;
  process.stdout.write("  NOT RUN " + line + "\n");
}
const want = (id) => !ONLY || ONLY === id;
const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const csv = (title, body) => '"Title","Text"\r\n"' + title + '","' + body + '"\r\n';

function titleIn(dir) {
  const name = fs.readdirSync(dir).find(n => n.endsWith(".draft.json"));
  if (!name) return "";
  const doc = JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
  const card = (doc.cards || [])[0];
  const title = card && card.title;
  return title ? (title.en || Object.keys(title).map(k => title[k])[0] || "") : "";
}

async function main() {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });

  if (want("iu4")) {
    const projects = path.join(SCRATCH, "projects");
    fs.mkdirSync(projects, { recursive: true });
    const file = path.join(SCRATCH, "shown.csv");
    fs.writeFileSync(file, csv("Shown title", "Shown body text."));
    const plan = await importPlan(projects, file, {}, "");
    check(plan && plan.fingerprint === sha(file) && plan.refusal == null,
      "iu4 the plan's fingerprint is the sha256 of the bytes the cover read: "
      + (plan && plan.fingerprint ? plan.fingerprint.slice(0, 12) : "none"));

    fs.writeFileSync(file, csv("Other title", "Other body text."));
    let refused = null;
    try { await importLand(projects, file, {}, "", plan.fingerprint); }
    catch (e) { refused = e; }
    const kids = fs.readdirSync(projects);
    check(!!(refused && refused.said && refused.said.frame === FRAME) && kids.length === 0,
      "iu4 a file saved again between the cover and Land is refused and nothing is written: "
      + (refused && refused.said ? refused.said.frame : (refused ? refused.message : "no refusal"))
      + "; projects " + kids.join(","));

    const open = await importLand(projects, file, {}, "", "");
    check(open && open.dir && titleIn(open.dir) === "Other title",
      "iu4 Land with no fingerprint still writes, and it writes the file as it is now: "
      + (open && open.dir ? titleIn(open.dir) : "nothing"));

    const steady = path.join(SCRATCH, "steady.csv");
    fs.writeFileSync(steady, csv("Steady title", "Steady body text."));
    const again = await importPlan(projects, steady, {}, "");
    const landed = await importLand(projects, steady, {}, "", again.fingerprint);
    check(landed && landed.dir && titleIn(landed.dir) === "Steady title"
          && again.fingerprint === sha(steady),
      "iu4 Land with the hash of the file as it is now writes that file: "
      + (landed && landed.dir ? titleIn(landed.dir) : "nothing"));
  }

  if (!ONLY) {
    copyPlants({
      root: ROOT, self: SELF, label: "import-shown", onlyVar: "IMPORT_SHOWN_ONLY",
      check, skip, timeout: 180000,
      plants: [
        { mark: "file-changed", leg: "iu4", rel: "src/studio.mjs",
          line: "  if (false) throw refuse(FILE_CHANGED);" },
      ],
    });
  }

  if (!process.argv.includes("--keep")) dropScratch(SCRATCH, "import-shown");
  process.stdout.write("import-shown: " + asserted + " assertion(s), " + skipped
    + " skipped, " + failed + " failure(s)"
    + (PLANTS_OFF ? " (ETIUDA_PLANTS=off)" : "") + "\n");
  process.exit(failed ? 1 : 0);
}

main().catch(e => {
  process.stderr.write("import-shown: REFUSED " + (e && e.stack ? e.stack : e) + "\n");
  process.exit(2);
});
