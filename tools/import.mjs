/* THE IMPORTER FROM THE COMMAND LINE, until the wizard screens arrive (course node 10).
 *
 *     node tools/import.mjs <macros.csv> <out folder> [--id x] [--primary en]
 *                           [--map "<header>=<field>[.<lang>]" ...] [--drop "<header>" ...]
 *
 *     node tools/import.mjs --paste <out folder> [--plain <file>] [--html <file>]
 *                           [--id x] [--primary en] [--map ...] [--drop ...]
 *
 * --paste reads a paste instead of a file. --plain is the plain text and --html is the HTML,
 * when both were offered; with no --plain the plain text is read from stdin. src/paste.mjs
 * splits that text into rows, and the importer below is the one a file goes through. A paste
 * with no reply in it exits 2 and writes nothing.
 *
 * It writes two files into the out folder and nothing else: `<id>.draft.json`, which is the
 * draft catalog as a format 2 document, and `<id>.lint.json`, the report beside it. The draft
 * is named draft rather than `.ec` on purpose - NOTHING PUBLISHES FROM AN IMPORT (spec 3.1),
 * and a file a desk would load is not what an import produces. Publishing is tools/publish.mjs.
 *
 * EXIT CODES, because a wizard is not the only caller: 0 with no error, 1 with at least one
 * error finding (the draft is still written, because a report about a file that does not exist
 * helps nobody), 2 for a refusal that stopped the import.
 *
 * A DRAFT AWAITING A LANGUAGE EXITS 0, and that is the decision of board item 493 rather than a
 * gap here: a pile carrying one language is a state on the way to a catalog, not a broken
 * import, so it exits as it stands and the line below says what it is waiting for. Publishing
 * it is still refused, by the pinned engine's lint at tools/publish.mjs and not by this file.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { importCsv, writeImport, NO_PRIMARY } from "../src/import.mjs";
import { PASTE_NAME, pasteCsv, splitPaste, pasteOverride } from "../src/paste.mjs";
import { detect } from "../src/lang.mjs";

function die(line) { process.stderr.write("import  " + line + "\n"); process.exit(2); }

function parse(argv) {
  const out = { _: [], override: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--map") {
      const v = argv[++i] || "";
      const at = v.indexOf("=");
      if (at < 1) die("--map wants <header>=<field>[.<lang>], got " + JSON.stringify(v));
      out.override[v.slice(0, at)] = v.slice(at + 1);
    } else if (a === "--drop") {
      out.override[argv[++i] || ""] = null;
    } else if (a.startsWith("--")) {
      out[a.slice(2)] = (argv[i + 1] && !argv[i + 1].startsWith("--")) ? argv[++i] : true;
    } else out._.push(a);
  }
  return out;
}

async function runImport(opts, outDir) {
  let made;
  try {
    made = await importCsv(opts);
  } catch (e) {
    /* The screen answers this one with its mapping table; here the table is two flags. */
    const flags = !(e && e.said && e.said.frame === NO_PRIMARY) ? ""
      : opts.isPaste ? " (pass --lang <code> to say which)" : " (--map <header>=body.<code>, or --primary <code>)";
    die((e && e.message ? e.message : String(e)) + flags);
  }

  const { catalog, report } = made;
  /* A paste has no column to name its language: where none was given and the text did not say, the draft keeps
     the code it was made with, and the report and the line say that code was assumed (the test architect, 12:10). */
  const assumed = !!(opts.isPaste && !opts.hasLang && report.languages[0] && report.languages[0].detected == null);
  if (assumed) report.languageDetected = false;
  /* The same writer the Import wizard lands through, so that a draft made on the screen and a
     draft made here are the same bytes rather than two files that agree today. */
  const { draftAt, lintAt } = writeImport(outDir, catalog, report);

  const say = l => process.stdout.write("import  " + l + "\n");
  say(report.counts.cards + " card(s), " + report.counts.macros + " macro(s), "
    + report.counts.intents + " intent(s), " + report.counts.cats + " category/ies,"
    + " read as " + report.encoding + ", primary " + report.primary);
  say("languages: " + report.languages.map(l => l.code + " from "
    + (l.column ? JSON.stringify(l.column) : "nothing") + ", text reads "
    + (l.detected || "undetermined")).join("; "));
  if (assumed) say("Language not detected; assumed " + String(report.primary).toUpperCase() + ". Use --lang <code> to set it.");
  say("columns: " + report.columns.filter(c => c.field).length + " mapped, "
    + report.columns.filter(c => !c.field).length + " unclaimed");
  say("duplicates: " + report.duplicates.exact.length + " exact, "
    + report.duplicates.near.length + " near at title " + report.duplicates.thresholds.title);
  say("placeholders: " + report.placeholders.mapped.reduce((n, x) => n + x.n, 0)
    + " translated, " + report.placeholders.flagged.reduce((n, x) => n + x.n, 0) + " flagged");
  /* THE BAG'S LINE SAYS WHAT THE BAGS BUY, NOT HOW MANY THERE ARE (board 597, 585): a count of
     keywords is a number nobody can act on, and the words that appear nowhere in a card's own
     text are the whole of what having a bag is worth. The report names them card by card. */
  say("keywords: " + report.keywords.carrying + " card(s) with a bag, " + report.keywords.words
    + " word(s), " + report.keywords.only + " of them nowhere in the card's own text"
    + (report.keywords.repeatOnly ? ", " + report.keywords.repeatOnly
       + " bag(s) that repeat the card entirely and could be emptied" : ""));
  say("engine lint at pin " + String(report.pin).slice(0, 7) + ": "
    + report.engineLint.errors + " error(s), " + report.engineLint.warnings + " warning(s)"
    + (report.engineLint.awaiting ? ", and " + report.engineLint.awaiting
       + " of its error(s) are one language's absence (raw: " + report.engineLint.raw.errors
       + " error(s))" : ""));
  say(report.errors + " error(s), " + report.warnings + " warning(s) and "
    + report.awaiting + " awaiting in all");
  report.findings.filter(f => f.severity === "awaiting").forEach(f =>
    say("AWAITING " + String(f.lang).toUpperCase() + ": " + f.what));
  say("wrote " + draftAt);
  say("wrote " + lintAt);
  say("NOTHING IS PUBLISHED: review the report, then node tools/publish.mjs <project folder>");
  process.exit(report.errors ? 1 : 0);
}

/* THE SAME OPTIONS A FILE GETS. --map and --drop are already on args.override, and --id and
   --primary mean what they mean for a file. The file name the report and the stem are taken
   from is the CSV the wizard writes, so the two doors name the source the same way. */
async function fromPaste(args) {
  if (typeof args.paste !== "string")
    die("usage: node tools/import.mjs --paste <out folder> [--plain <file>] [--html <file>]"
      + " [--lang <code>] [--id x] [--primary en]");
  let plain;
  if (typeof args.plain === "string") {
    if (!fs.existsSync(args.plain)) die("no file at " + args.plain);
    plain = fs.readFileSync(args.plain, "utf8");
  } else plain = fs.readFileSync(0, "utf8");
  let html = "";
  if (typeof args.html === "string") {
    if (!fs.existsSync(args.html)) die("no file at " + args.html);
    html = fs.readFileSync(args.html, "utf8");
  }
  const pieces = splitPaste(plain, html);
  if (!pieces.length) die("the paste has no reply in it");
  const lang = typeof args.lang === "string" ? args.lang
    : (typeof args.primary === "string" ? args.primary : null);
  const override = Object.assign({}, lang ? pasteOverride(lang) : {}, args.override);
  const file = path.join(os.tmpdir(), "etiuda-studio-paste", PASTE_NAME);
  await runImport({
    text: pasteCsv(pieces), file, override,
    primary: lang || null,
    isPaste: true,
    hasLang: !!lang,
    id: typeof args.id === "string" ? args.id : null,
  }, args.paste);
}

async function main(argv) {
  const args = parse(argv);
  if (Object.prototype.hasOwnProperty.call(args, "paste")) return fromPaste(args);
  if (args._.length < 2)
    die("usage: node tools/import.mjs <macros.csv> <out folder> [--id x]"
      + " [--primary en] [--map \"<header>=<field>[.<lang>]\"] [--drop \"<header>\"]"
      + "\n       node tools/import.mjs --paste <out folder> [--plain <file>] [--html <file>]"
      + " [--lang <code>] [--id x] [--primary en]");
  const [csv, outDir] = args._;
  if (!fs.existsSync(csv)) die("no CSV at " + csv);
  await runImport({
    file: csv, override: args.override,
    primary: typeof args.primary === "string" ? args.primary : null,
    id: typeof args.id === "string" ? args.id : null,
  }, outDir);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]))
  main(process.argv.slice(2));

export { parse };
