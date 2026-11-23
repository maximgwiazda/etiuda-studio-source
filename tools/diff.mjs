/* WHAT CHANGED BETWEEN TWO REVISIONS.
 *
 *     node tools/diff.mjs <a> <b> [--paths] [--width 70]
 *     node tools/diff.mjs <project folder> <edition a> <edition b> [--paths]
 *
 * `a` and `b` are either catalog files (.ec, .json, or the sibling-script container) or, with a
 * project folder first, two edition names out of its archive. The comparison is over the
 * format's own structure rather than over the text of the file; the rule is written at the head
 * of src/diff.mjs.
 *
 * `--paths` prints what changed without the words on either side. The default prints the values,
 * because Studio runs on the machine of whoever owns the content and a diff that will not say
 * what changed is a diff nobody can review; `--paths` is there for the day somebody wants to
 * paste the output somewhere.
 *
 * EXIT CODES: 0 the two are identical, 1 they differ, 2 something could not be read. Identical
 * exits 0 so that a script can ask "did this publish change anything" and get an answer.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as Engine from "../src/engine.mjs";
import { diffCatalogs, diffLines, summary, readCatalogDocument } from "../src/diff.mjs";
import { archivedCatalog, editionsIn, ARCHIVE, CATALOG_IN_ARCHIVE } from "../src/publish.mjs";

function die(line) { process.stderr.write("diff  " + line + "\n"); process.exit(2); }

/* A catalog document, from a .ec, a .json or the one-assignment sibling container. The reader
   moved to src/diff.mjs when the review queue needed the same one; this name stays because it
   is what this file's own text calls it. */
const read = readCatalogDocument;

async function main(argv) {
  const rest = argv.filter(a => !a.startsWith("--"));
  const flags = argv.filter(a => a.startsWith("--"));
  const widthAt = argv.indexOf("--width");
  const width = widthAt > -1 ? Number(argv[widthAt + 1]) || 70 : 70;
  const values = !flags.includes("--paths");
  if (rest.length < 2) die("usage: node tools/diff.mjs <a> <b> [--paths]"
    + "  |  node tools/diff.mjs <project folder> <edition a> <edition b> [--paths]");

  let A, B, whatA, whatB;
  if (rest.length >= 3 && fs.existsSync(rest[0]) && fs.statSync(rest[0]).isDirectory()) {
    const [dir, ea, eb] = rest;
    const have = editionsIn(dir);
    for (const e of [ea, eb]) if (!have.includes(e))
      die("the archive at " + path.join(dir, ARCHIVE) + " has no edition " + e
        + "; it has " + (have.join(", ") || "none"));
    A = archivedCatalog(dir, ea); B = archivedCatalog(dir, eb);
    whatA = ea + "/" + CATALOG_IN_ARCHIVE; whatB = eb + "/" + CATALOG_IN_ARCHIVE;
  } else {
    for (const f of rest.slice(0, 2)) if (!fs.existsSync(f)) die("nothing at " + f);
    try { A = read(rest[0]); B = read(rest[1]); }
    catch (e) { die(e.message); }
    whatA = path.basename(rest[0]); whatB = path.basename(rest[1]);
  }

  const F = await Engine.format();
  const d = diffCatalogs(A, B, F.canonical, { values });
  process.stdout.write("diff  " + whatA + "  ->  " + whatB + "\n");
  if (d.same) {
    process.stdout.write("diff  identical over every field the format has\n");
    process.exit(0);
  }
  diffLines(d, { values, width }).forEach(l => process.stdout.write("  " + l + "\n"));
  process.stdout.write("diff  " + summary(d) + "\n");
  process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]))
  main(process.argv.slice(2)).catch(e => die(e && e.stack ? e.stack : String(e)));

export { read };
