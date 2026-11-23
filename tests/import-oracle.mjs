/* THE IMPORT MODEL'S ORACLE, WITH NO MODEL IN IT.
 *
 *     node tests/import-oracle.mjs [--keep]
 *
 * Two claims the tools could get wrong, and the oracle is never the importer:
 *   1  the original catalog, scored as a perfect import of its own flattening, is perfect
 *   2  Studio's present CSV importer, fed the flattened file, scores near nothing
 *   6  neither tool is shipped: every module under src/ is reached from shell/ or ui/
 *
 * A scorer that cannot recognise a right answer is worse than none. A flattener that is too
 * tidy makes the CSV importer look like a shapeless-file reader. The invented sample only;
 * the employer's catalog is a one-off counts-only run outside this file.
 *
 * Mutations 3 and 4 are the teeth: a joined body is a merge, a nonce body is an invention.
 * They fail if the scorer always reports perfect.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { flattenCatalog, writeFlatten } from "../tools/import-bench/flatten.mjs";
import { scoreCatalog } from "../tools/import-bench/score.mjs";
import { importCsv } from "../src/import.mjs";
import { readCatalogDocument } from "../src/diff.mjs";
import { v2BodyTools } from "../src/engine.mjs";
import { shippedSample, sampleIsShipped } from "./shipped-sample.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { withoutComments } from "./source-text.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "import-oracle");
const NONCE = "qzxvpl-not-in-source-603";

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

/* THE SAMPLE IS THE ONE THE ENGINE SHIPS AT STUDIO'S PIN (2026-09-25), read by
   tests/shipped-sample.mjs, never the fixtures folder's copy, which went stale. No sample is a
   failure: a leg about the shipped sample that reads nothing has not been run. */
function samplePath() {
  try { return shippedSample().at; }
  catch (e) { process.stderr.write("  FAIL the shipped sample could not be read: " + e.message + "\n"); return null; }
}

function filledBodies(catalog) {
  let n = 0;
  (catalog.cards || []).forEach(c => {
    const body = c.body || {};
    Object.keys(body).forEach(k => { if (String(body[k] || "").trim()) n++; });
  });
  return n;
}

function cardsWithIntent(catalog) {
  return (catalog.cards || []).filter(c => Array.isArray(c.requests) && c.requests.length).length;
}

function run(args) {
  return spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8" });
}

async function main(argv) {
  const sampleAt = samplePath();
  if (!sampleAt) {
    process.stdout.write("import-oracle: 0 assertion(s), NO VERDICT, the shipped sample was not read\n");
    process.exit(78);
  }
  const shipped = sampleIsShipped(sampleAt);
  check(shipped.ok, "0s the sample these legs read is the engine's shell/sample-catalog.ec at the"
    + " pin " + shipped.pin + ": blob " + shipped.got.slice(0, 12) + " against " + shipped.want.slice(0, 12));

  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });

  const catalog = readCatalogDocument(sampleAt);
  const tools = v2BodyTools();
  const filled = filledBodies(catalog);
  const nCards = (catalog.cards || []).length;
  const nIntent = cardsWithIntent(catalog);

  /* ---- 1. FLATTEN, AND THE ORIGINAL CATALOG IS A PERFECT IMPORT ----------------------------- */

  const made = flattenCatalog(catalog, { tools });
  const outDir = path.join(SCRATCH, "flat");
  const { textAt, keyAt } = writeFlatten(outDir, made.text, made.key);
  const seps = made.key.ragged.separators;
  check(made.key.stretches.length === filled,
    "1a stretch count equals independently counted non-empty bodies ["
    + made.key.stretches.length + " stretches, " + filled + " filled]");
  check(made.key.catalog.cards === nCards,
    "1b key card count is the catalog's [" + made.key.catalog.cards + "]");
  check(seps.none + seps.blank + seps.heading === Math.max(0, made.key.stretches.length - 1),
    "1c every gap after the first stretch is none, blank or heading ["
    + JSON.stringify(seps) + "]");
  check(made.key.stretches.every(s => made.text.slice(s.start, s.end).length === s.end - s.start
      && made.text.slice(s.start, s.end).length > 0),
    "1d every stretch offset slices a non-empty piece of the text file");
  check(!/"id"\s*:/.test(made.text) && !/bodyShape/.test(made.text)
      && !/\[step\]/.test(made.text) && !/\[alt\]/.test(made.text),
    "1e the text file carries no id field, no bodyShape and no marker line");

  const perfect = scoreCatalog(catalog, made.key, made.text, { tools });
  check(perfect.invention.n === 0 && perfect.verbatim.n === filled
      && perfect.verbatim.of === filled,
    "1f original catalog invention 0, verbatim every filled body ["
    + perfect.invention.n + " invented, " + perfect.verbatim.n + "/" + perfect.verbatim.of
    + " verbatim]");
  check(perfect.boundaries.exact === nCards && perfect.boundaries.split === 0
      && perfect.boundaries.merged === 0 && perfect.boundaries.missed === 0
      && perfect.boundaries.inexact === 0,
    "1g original catalog every card boundary exact ["
    + JSON.stringify(perfect.boundaries) + "]");
  check(perfect.language.right === nCards && perfect.language.of === nCards,
    "1h original catalog every exact card has the right language ["
    + perfect.language.right + "/" + perfect.language.of + "]");
  check(perfect.category.right === nCards && perfect.category.of === nCards,
    "1i original catalog every exact card has the right category ["
    + perfect.category.right + "/" + perfect.category.of + "]");
  check(perfect.intent.right === nIntent && perfect.intent.of === nIntent,
    "1j original catalog every keyed intent lands ["
    + perfect.intent.right + "/" + perfect.intent.of + ", catalog cards with requests "
    + nIntent + "]");

  const cliFlat = run(["tools/flatten.mjs", sampleAt, path.join(SCRATCH, "cli-flat")]);
  check(cliFlat.status === 0, "1k tools/flatten.mjs exit 0 [" + cliFlat.status + "]");
  const cliScore = run(["tools/score.mjs", sampleAt,
    path.join(SCRATCH, "cli-flat", "replies.key.json"),
    path.join(SCRATCH, "cli-flat", "replies.txt"), "--no-json"]);
  check(cliScore.status === 0 && /invention 0 of /.test(cliScore.stdout || ""),
    "1l tools/score.mjs of the original catalog prints invention 0, exit 0");

  /* ---- 2. THE PRESENT IMPORTER ON THE SHAPELESS FILE ---------------------------------------- */

  let imported = { catalog: { cards: [], tags: [], langs: [] }, refused: null };
  try {
    imported = await importCsv({ file: textAt, id: "flat-import", name: "flat import" });
  } catch (e) {
    imported.refused = e && e.message ? e.message : String(e);
  }
  const present = scoreCatalog(imported.catalog, made.key, made.text, { tools });
  const presentCards = (imported.catalog.cards || []).length;
  check(present.boundaries.exact === 0,
    "2a present CSV importer exact boundaries 0 of " + nCards
    + " [" + present.boundaries.exact + " exact, " + presentCards + " proposed, refused "
    + (imported.refused ? "yes" : "no") + "]");
  check(present.boundaries.exact / nCards < 0.1,
    "2b and exact/true is under a tenth, or the flattener is too tidy ["
    + present.boundaries.exact + "/" + nCards + "]");
  check(present.invention.n === present.invention.of
      || presentCards === 0,
    "2c proposed bodies are all invented, or there are no proposed cards ["
    + present.invention.n + " invented of " + present.invention.of + ", "
    + presentCards + " proposed]");

  /* ---- 3. A JOINED BODY IS A MERGE ---------------------------------------------------------- */

  const joined = JSON.parse(JSON.stringify(catalog));
  joined.cards = [{
    id: "c-joined-oracle",
    shelf: catalog.cards[0].shelf,
    bodyShape: "plain",
    body: { en: made.key.stretches.map(s => made.text.slice(s.start, s.end)).join("\n") },
  }];
  const mergeScore = scoreCatalog(joined, made.key, made.text, { tools });
  check(mergeScore.boundaries.merged === nCards && mergeScore.boundaries.exact === 0
      && mergeScore.boundaries.proposedCards === 1,
    "3a one proposed body that contains every stretch merges every true card ["
    + "merged " + mergeScore.boundaries.merged + " exact " + mergeScore.boundaries.exact
    + " proposed " + mergeScore.boundaries.proposedCards + "]");

  /* ---- 4. A NONCE BODY IS AN INVENTION ------------------------------------------------------ */

  const fake = JSON.parse(JSON.stringify(catalog));
  fake.cards = [{
    id: "c-nonce-oracle",
    shelf: catalog.cards[0].shelf,
    bodyShape: "plain",
    body: { en: NONCE },
  }];
  check(made.text.indexOf(NONCE) < 0,
    "4a the nonce is not in the source file");
  const invScore = scoreCatalog(fake, made.key, made.text, { tools });
  check(invScore.invention.n === 1 && invScore.invention.of === 1
      && invScore.verbatim.n === 0 && invScore.boundaries.missed === nCards,
    "4b a nonce body is invention 1 of 1 and misses every true card ["
    + "invented " + invScore.invention.n + "/" + invScore.invention.of
    + " missed " + invScore.boundaries.missed + "]");

  check(fs.existsSync(textAt) && fs.existsSync(keyAt),
    "5 the two files the tools write are the text and the key [" + textAt + "]");

  /* 6. THE FLATTENER AND THE SCORER ARE THE HARNESS'S, AND src/ IS WHAT SHIPS (board 858, P1).
     electron-builder.js packs src/** whole, so a module only a gate or a command line imports
     went to every customer. Reached means named in a quoted path ("../x.mjs") by shell/ or ui/, or
     by a src module already reached, until nothing grows; every src module must be reached. The
     control erases the product's every naming of csv.mjs and the same walk must lose it.
     A NAMING IN A COMMENT IS NOT A NAMING (board 858, Claudius δ's carve): every text is read with
     its comments taken out by tests/source-text.mjs, strings kept, so a module the product names
     only in a comment ships unreached and 6 says so; 6c plants one. */
  {
    const listed = (d) => fs.readdirSync(path.join(ROOT, d)).filter(f => /\.(m?js|cjs|html)$/.test(f))
      .map(f => [f, withoutComments(fs.readFileSync(path.join(ROOT, d, f), "utf8"), f)]);
    const src = new Map(listed("src"));
    const quoted = (m) => new RegExp("[\"'`/]" + m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[\"'`]");
    const walk = (erase, plant) => {
      const shown = (t) => erase ? t.split(erase).join("") : t;
      const mods = Array.from(src.keys()).filter(f => /\.(m?js|cjs)$/.test(f)).concat(plant ? [plant.module] : []);
      const own = (m) => plant && m === plant.module ? plant.text : src.get(m);
      const texts = listed("shell").concat(listed("ui")).map(x => shown(x[1])), reached = new Set();
      if (plant) texts.push(withoutComments(plant.page, "app.js"));
      for (let grew = true; grew;) {
        grew = false;
        for (const m of mods) if (!reached.has(m) && texts.some(t => quoted(m).test(t))) {
          reached.add(m); texts.push(shown(own(m))); grew = true;
        }
      }
      return mods.filter(m => !reached.has(m));
    };
    const mods = Array.from(src.keys()).filter(f => /\.(m?js|cjs)$/.test(f));
    const unshipped = walk(null);
    check(mods.length > 30 && unshipped.length === 0 && !fs.existsSync(path.join(ROOT, "src", "flatten.mjs"))
          && !fs.existsSync(path.join(ROOT, "src", "score.mjs")),
      "6 every one of src/'s " + mods.length + " modules is reached from shell/ or ui/, and the flattener and the scorer"
      + " are not among them" + (unshipped.length ? "; reached by nothing: " + JSON.stringify(unshipped) : ""));
    const lost = walk("csv.mjs");
    check(lost.indexOf("csv.mjs") > -1,
      "6b CONTROL: every naming of csv.mjs erased, the walk loses it: " + JSON.stringify(lost));
    const zz = (page) => walk(null, { module: "zz.mjs", text: "export const zz = 1;\n", page });
    const inLine = zz('// a later idea: import("../src/zz.mjs")\n'), inBlock = zz('/* import("../src/zz.mjs") */\n');
    const inCode = zz('const u = "file:///*", r = /[//]/; const later = () => import("../src/zz.mjs"); // */\n');
    check(inLine.indexOf("zz.mjs") > -1 && inBlock.indexOf("zz.mjs") > -1 && inCode.indexOf("zz.mjs") < 0,
      "6c CONTROL: a module the page names only in a line or a block comment is reached by nothing, and the same"
      + " naming in code reaches it, behind a string and a regex holding a comment's opener: "
      + JSON.stringify([inLine, inBlock, inCode]));
  }

  if (!argv.includes("--keep")) dropScratch(SCRATCH, "import-oracle");
  process.stdout.write("import-oracle: " + asserted + " assertion(s), " + failed
    + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]))
  main(process.argv.slice(2)).catch(e => {
    process.stderr.write("import-oracle: REFUSED " + (e && e.stack ? e.stack : e) + "\n");
    process.exit(2);
  });
