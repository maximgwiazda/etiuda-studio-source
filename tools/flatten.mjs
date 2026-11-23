/* A CATALOG TO A SHAPELESS PILE OF REPLIES, WITH THE ANSWER BESIDE IT.
 *
 *     node tools/flatten.mjs <catalog.ec|catalog.json> <out folder>
 *
 * Writes replies.txt and replies.key.json into the out folder and nothing else. The text file
 * is what a customer would paste; the key is not. EXIT 0 wrote the files, 2 a refusal.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { flattenCatalog, writeFlatten } from "./import-bench/flatten.mjs";
import { readCatalogDocument } from "../src/diff.mjs";

function die(line) { process.stderr.write("flatten  " + line + "\n"); process.exit(2); }

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

function main(argv) {
  const args = parse(argv);
  if (args._.length < 2)
    die("usage: node tools/flatten.mjs <catalog.ec|catalog.json> <out folder>");
  const file = path.resolve(args._[0]);
  const outDir = path.resolve(args._[1]);
  if (!fs.existsSync(file)) die("no catalog at " + file);
  let catalog;
  try { catalog = readCatalogDocument(file); }
  catch (e) { die(e && e.message ? e.message : String(e)); }
  let made;
  try { made = flattenCatalog(catalog); }
  catch (e) { die(e && e.message ? e.message : String(e)); }
  const { textAt, keyAt } = writeFlatten(outDir, made.text, made.key);
  const say = l => process.stdout.write("flatten  " + l + "\n");
  say(made.key.stretches.length + " stretch(es) from " + made.key.catalog.cards
    + " card(s), seed " + made.key.ragged.seed);
  const s = made.key.ragged.separators;
  say("gaps none " + s.none + ", blank " + s.blank + ", heading " + s.heading);
  say("wrote " + textAt);
  say("wrote " + keyAt);
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]))
  main(process.argv.slice(2));
