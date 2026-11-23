/* A CELL A SPREADSHEET WOULD RUN IS EXPORTED AS TEXT, AND READ BACK AS THE SAME TEXT.
 *
 *     node tests/import-formula.mjs [--keep]
 *
 * Six leads, = + - @ tab and CR, in the three files an export writes and in a paste. Before
 * the prefix the bytes are the formula. After it, each lead is an apostrophe and the field is
 * quoted, and importing that file returns the text that was exported. The cover's first cell
 * is that same text.
 *
 * A value whose own first character is the apostrophe and whose second is a lead comes back
 * without the apostrophe: the marker and that text are the same bytes. The plant lifts the
 * prefix. ETIUDA_PLANTS=off skips that proof and prints NOT RUN.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exportCsv } from "../src/export-csv.mjs";
import { importCsv } from "../src/import.mjs";
import { pasteCsv } from "../src/paste.mjs";
import { importPlan } from "../src/studio.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { copyPlants } from "./plant-copy.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "import-formula");
const SELF = fileURLToPath(import.meta.url);
const ONLY = process.env.IMPORT_FORMULA_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";

const TITLE = "=cmd|'/C calc'!A0";
const BODY = "-1+1";
const NOTE = "@sum";
const BAG = "\tbag";
const ROLE = "=ROLE";
const LABEL = "=SHELF";
const CLAUSE = "+CLAUSE";
const CR = "\rcr";
const COMMA = "=foo,bar";
const LITERAL = "'=literal";

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

function catalog() {
  return {
    format: 2, kind: "etiuda-catalog", id: "formula-desk", rev: 1,
    langs: [{ code: "en", label: "EN" }], commentLang: "en",
    role: [ROLE],
    tags: [
      { id: "t-lamps", kind: "shelf", label: { en: LABEL } },
      { id: "t-ask", kind: "request", clause: { en: CLAUSE } },
    ],
    cards: [
      { id: "c-lamp", shelf: "t-lamps", title: { en: TITLE }, body: { en: BODY },
        note: { en: NOTE }, k: BAG, requests: ["t-ask"] },
      { id: "c-plain", shelf: "t-lamps", title: { en: "Ordinary" },
        body: { en: "A plain reply." }, note: { en: CR } },
      { id: "c-apos", shelf: "t-lamps", title: { en: LITERAL }, body: { en: COMMA } },
    ],
  };
}

function card(back, id) {
  return (back.catalog.cards || []).find(c => c.id === id);
}

async function main() {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });

  if (want("iu3")) {
    const pasted = pasteCsv([
      { title: "=cmd", body: "+plus" },
      { title: "-minus", body: "@at" },
      { title: "\ttab", body: "\rcr" },
      { title: "=", body: COMMA },
    ]);
    const wantPaste = [
      '"Title","Text"',
      '"\'=cmd","\'+plus"',
      '"\'-minus","\'@at"',
      '"\'\ttab","\'\rcr"',
      '"\'=","\'=foo,bar"',
    ].join("\r\n") + "\r\n";
    check(pasted === wantPaste,
      "iu3 pasteCsv quotes the six leads, with the apostrophe inside the quotes: "
      + JSON.stringify(pasted));

    const out = path.join(SCRATCH, "out");
    await exportCsv({ catalog: catalog(), out });
    const macros = fs.readFileSync(path.join(out, "macros.csv"), "utf8");
    const cats = fs.readFileSync(path.join(out, "categories.csv"), "utf8");
    const intents = fs.readFileSync(path.join(out, "intents.csv"), "utf8");
    const held = [
      [macros, "\"'=cmd|'/C calc'!A0\"", "title"],
      [macros, "\"'-1+1\"", "body"],
      [macros, "\"'@sum\"", "note"],
      [macros, "\"'\tbag\"", "keywords"],
      [macros, "\"'=ROLE\"", "role"],
      [macros, "\"'=foo,bar\"", "a lead that contains a comma"],
      [macros, "\"'\rcr\"", "a CR lead"],
      [cats, "\"'=SHELF\"", "category label"],
      [intents, "\"'+CLAUSE\"", "intent clause"],
    ];
    held.forEach(([file, needle, name]) => {
      check(file.includes(needle),
        "iu3 " + name + " is quoted with a leading apostrophe: " + JSON.stringify(needle));
    });
    check(macros.includes(",Ordinary,") && !macros.includes("\"'Ordinary\""),
      "iu3 a title with none of the six leads is written unchanged");

    const back = await importCsv({ file: path.join(out, "macros.csv"), id: "formula-desk" });
    const lamp = card(back, "c-lamp");
    const plain = card(back, "c-plain");
    const apos = card(back, "c-apos");
    const shelf = (back.catalog.tags || []).find(t => t.kind === "shelf");
    const request = (back.catalog.tags || []).find(t => t.kind === "request");
    check(lamp && lamp.title.en === TITLE && lamp.body.en === BODY && lamp.note.en === NOTE
          && lamp.k === BAG,
      "iu3 importing the export returns the card text: "
      + JSON.stringify(lamp && { title: lamp.title.en, body: lamp.body.en, note: lamp.note.en, k: lamp.k }));
    check(Array.isArray(back.catalog.role) && back.catalog.role[0] === ROLE,
      "iu3 the role comes back as " + JSON.stringify(back.catalog.role));
    check(shelf && shelf.label.en === LABEL,
      "iu3 the category label comes back as " + JSON.stringify(shelf && shelf.label.en));
    check(request && request.clause.en === CLAUSE,
      "iu3 the intent clause comes back as " + JSON.stringify(request && request.clause.en));
    check(plain && plain.note.en === CR,
      "iu3 a CR lead comes back as the CR: " + JSON.stringify(plain && plain.note.en));
    check(apos && apos.title.en === "=literal" && apos.body.en === COMMA,
      "iu3 a text that is an apostrophe and then a lead comes back without the apostrophe, and a"
      + " lead with a comma comes back whole: "
      + JSON.stringify(apos && { title: apos.title.en, body: apos.body.en }));

    const plan = await importPlan(SCRATCH, path.join(out, "macros.csv"), {}, "");
    const shown = (plan.columns || []).find(c => c.header === "title_en");
    check(shown && shown.first === TITLE && plan.refusal == null,
      "iu3 the cover shows the title that lands, not the apostrophe: "
      + JSON.stringify(shown && shown.first)
      + (plan.refusal ? " refusal " + plan.refusal : ""));
  }

  if (!ONLY) {
    copyPlants({
      root: ROOT, self: SELF, label: "import-formula", onlyVar: "IMPORT_FORMULA_ONLY",
      check, skip, timeout: 180000,
      plants: [
        { mark: "csv-formula", leg: "iu3", rel: "src/csv.mjs",
          line: "  if (FORMULA_LEAD.test(s)) return s;" },
      ],
    });
  }

  if (!process.argv.includes("--keep")) dropScratch(SCRATCH, "import-formula");
  process.stdout.write("import-formula: " + asserted + " assertion(s), " + skipped
    + " skipped, " + failed + " failure(s)"
    + (PLANTS_OFF ? " (ETIUDA_PLANTS=off)" : "") + "\n");
  process.exit(failed ? 1 : 0);
}

main().catch(e => {
  process.stderr.write("import-formula: REFUSED " + (e && e.stack ? e.stack : e) + "\n");
  process.exit(2);
});
