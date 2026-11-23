/* A PROPOSED CATALOG AGAINST A FLATTEN KEY AND THE SOURCE FILE.
 *
 *     node tools/score.mjs <proposed.ec|draft.json> <replies.key.json> <replies.txt>
 *
 * Prints the invention count first, then verbatim bodies, card boundaries, language, intent
 * and category. Every number's method is in the JSON on stdout after the lines, unless
 * --no-json. EXIT 0 scored, 2 a refusal. Prints counts only: no title, body, macro or intent
 * wording.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scoreCatalog, printScore } from "./import-bench/score.mjs";
import { readCatalogDocument } from "../src/diff.mjs";

function die(line) { process.stderr.write("score  " + line + "\n"); process.exit(2); }

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
  if (args._.length < 3)
    die("usage: node tools/score.mjs <proposed.ec|draft.json> <replies.key.json> <replies.txt>");
  const proposedAt = path.resolve(args._[0]);
  const keyAt = path.resolve(args._[1]);
  const textAt = path.resolve(args._[2]);
  if (!fs.existsSync(proposedAt)) die("no proposed catalog at " + proposedAt);
  if (!fs.existsSync(keyAt)) die("no key at " + keyAt);
  if (!fs.existsSync(textAt)) die("no source at " + textAt);
  let proposed, key, source;
  try { proposed = readCatalogDocument(proposedAt); }
  catch (e) { die(e && e.message ? e.message : String(e)); }
  try { key = JSON.parse(fs.readFileSync(keyAt, "utf8")); }
  catch (e) { die("key is not JSON: " + (e && e.message ? e.message : String(e))); }
  source = fs.readFileSync(textAt, "utf8");
  let report;
  try { report = scoreCatalog(proposed, key, source); }
  catch (e) { die(e && e.message ? e.message : String(e)); }
  printScore(report);
  if (!args["no-json"])
    process.stdout.write(JSON.stringify(report, null, 1) + "\n");
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]))
  main(process.argv.slice(2));
