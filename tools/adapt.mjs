/* A SOURCE-SHAPE EXPORT INTO THE IMPORTER'S CSV.
 *
 *     node tools/adapt.mjs <shape> <export.json> <out.csv>
 *
 * Columns id, shelf, title, body, note, requests, role; requests and role empty, because
 * the JSON shapes do not carry them. The importer already reads this CSV; this file writes it.
 * csv-columns has no branch here: that pile is already a CSV and the importer maps its headers.
 *
 * EXIT CODES: 0 wrote the CSV, 2 a refusal that names the field it could not read.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { adapt, htmlToText, fromMacrosActions, fromFoldersResponses, fromTemplatesList,
         fromMacrosList, COLUMNS, SHAPES } from "../src/adapt.mjs";

/* THE RULES LIVE IN src/adapt.mjs SINCE THE SENSE PASS OF 2026-09-22 (item 20), so the
   installed program reads an export the way this door does. What stays here is the command
   line's: the arguments, the CSV written out, and the exit codes. */
function die(line) { process.stderr.write("adapt  " + line + "\n"); process.exit(2); }

function csvField(v) {
  const s = String(v == null ? "" : v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function csv(rows) {
  return rows.map(r => r.map(csvField).join(",")).join("\r\n") + "\r\n";
}

function main(argv) {
  if (argv.length < 3)
    die("usage: node tools/adapt.mjs <shape> <export.json> <out.csv>");
  const shape = argv[0], src = argv[1], dest = argv[2];
  if (!SHAPES.includes(shape))
    die("shape is " + SHAPES.join(" or ") + ", got " + JSON.stringify(shape));
  if (!fs.existsSync(src)) die("no export at " + src);
  let doc;
  try { doc = JSON.parse(fs.readFileSync(src, "utf8").replace(/^\uFEFF/, "")); }
  catch (e) { die("the export is not JSON"); }
  let table;
  try { table = adapt(shape, doc); }
  catch (e) { die(e && e.message ? e.message : String(e)); }
  const lines = [COLUMNS].concat(table.map(r => COLUMNS.map(c => r[c])));
  fs.mkdirSync(path.dirname(path.resolve(dest)), { recursive: true });
  fs.writeFileSync(dest, csv(lines), "utf8");
  process.stdout.write("adapt  " + table.length + " row(s) from " + shape + " into " + dest + "\n");
}

export { adapt, htmlToText, fromMacrosActions, fromFoldersResponses,
         fromTemplatesList, fromMacrosList, COLUMNS, SHAPES };

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]))
  main(process.argv.slice(2));
