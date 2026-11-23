/* A DRAFT BACK TO THE IMPORTER'S OWN COLUMN SHAPE.
 *
 *     node tools/export-csv.mjs <project folder | draft.json> <out folder>
 *
 * Writes three files the importer already reads: macros.csv (one row per card), categories.csv
 * (key, label, then label_<code> for each language after the first), intents.csv (clause_<primary>,
 * then clause_<code> likewise). The writer is src/export-csv.mjs,
 * which Studio ships as a button (C09); this file is the command line over it.
 *
 * EXIT CODES: 0 wrote the files, 2 anything that stopped the export.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exportCsv } from "../src/export-csv.mjs";

function die(line) { process.stderr.write("export-csv  " + line + "\n"); process.exit(2); }

function parse(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) out[a.slice(2)] = (argv[i + 1] && !argv[i + 1].startsWith("--"))
      ? argv[++i] : true;
    else out._.push(a);
  }
  return out;
}

async function main(argv) {
  const args = parse(argv);
  if (args._.length < 2)
    die("usage: node tools/export-csv.mjs <project folder | draft.json> <out folder>");
  let done;
  try { done = await exportCsv({ project: args._[0], out: args._[1] }); }
  catch (e) { die(e && e.message ? e.message : String(e)); }
  const say = l => process.stdout.write("export-csv  " + l + "\n");
  say(done.cards + " card(s), " + done.intents + " intent(s), " + done.cats + " category/ies,"
    + " primary " + done.primary);
  say("wrote " + done.macros);
  say("wrote " + done.categories);
  say("wrote " + done.intents);
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]))
  main(process.argv.slice(2)).catch(e => die(e && e.stack ? e.stack : String(e)));

export { exportCsv, parse };
