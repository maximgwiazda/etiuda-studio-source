/* ONE LEG PER CLAIM THE CSV EXPORT COULD GET WRONG.
 *
 *     node tests/export-csv.mjs [--keep]
 *
 * Six claims. In the first three the oracle is the importer, never the exporter:
 *   1  import of the export reproduces the draft byte for byte, through tools/import.mjs
 *   2  a seeded pile imported, exported, then imported gives the same draft
 *   3  and a catalog carrying keyword bags still does, which the seeded piles cannot ask: the
 *      generator writes no keyword column, so every leg above would stay green on an exporter
 *      that dropped the bag entirely (board 597)
 * and in the last three it is the catalog the lead had, or the bytes the export wrote before (board 897):
 *   4  a catalog in two languages, exported and imported back, has every card's shape and parts, and
 *      every language's labels and clauses under their own language, which a seeded pile cannot ask:
 *      the generator writes no marker, no second-language label and no second-language clause
 *   5  a pile with no marker in it imports as it did before the importer read a shape: every card
 *      plain, the macro count the rows with a primary body, one label per shelf and one clause per intent
 *   6  a catalog in one language exports the three files it wrote before, byte for byte
 *
 * The importer already exists and already has its own oracle; legs 1 to 3 only ask whether
 * the bytes it writes from the exporter's CSV are the bytes it wrote from the pile.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { importCsv, writeImport } from "../src/import.mjs";
import { exportCsv } from "../src/export-csv.mjs";
import * as Engine from "../src/engine.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "export-csv-legs");

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

function pile(name, seed, rows) {
  const out = path.join(SCRATCH, "piles", name);
  const r = spawnSync(process.execPath, ["tools/fixtures/generate.mjs", "--seed", String(seed),
    "--rows", String(rows), "--out", out], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) throw new Error("the generator refused: " + (r.stderr || r.stdout));
  return { dir: out, csv: path.join(out, "macros.csv") };
}

function run(args) {
  return spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8" });
}

/* THE LEAD'S CATALOG FOR LEG 4, invented words only. Three languages, commented in the second, so an
   export that took the comment language as primary would put the second language's clauses in the
   column the importer files under the first, and an export or import that carried only the first
   language after the primary would lose the third. Two shelves labelled in all three, an intent with a
   clause in all three, a card of alternatives (the first labelled), a card of steps and a plain card. Bodies are in the
   engine's own encoding: a marker line opens each part. */
function twoLanguages() {
  return {
    format: 2, kind: "etiuda-catalog", id: "lamp-house", rev: 1,
    langs: [{ code: "en", label: "EN" }, { code: "pl", label: "PL" }, { code: "de", label: "DE" }], commentLang: "pl",
    tags: [
      { id: "t-lanterns", kind: "shelf", label: { en: "Lanterns", pl: "Latarnie", de: "Laternen" } },
      { id: "t-ferries", kind: "shelf", label: { en: "Ferries", pl: "Promy", de: "Fähren" } },
      { id: "t-lamp-oil", kind: "request", clause: { en: "where can I buy lamp oil", pl: "gdzie kupię olej do lampy",
        de: "wo kaufe ich Lampenöl" } },
    ],
    cards: [
      { id: "c-wick-trim", shelf: "t-lanterns", bodyShape: "alts",
        title: { en: "Trimming a wick", pl: "Przycinanie knota", de: "Den Docht schneiden" },
        body: { en: "[alt: brief]\nTrim the wick to a finger's width.\n\n[alt]\nTrim the wick to a finger's width,"
                  + " then wipe the glass chimney before striking the match.",
                pl: "[alt: krótko]\nPrzytnij knot na szerokość palca.\n\n[alt]\nPrzytnij knot na szerokość palca,"
                  + " a potem przetrzyj szklany klosz, zanim zapalisz zapałkę.",
                de: "[alt: kurz]\nSchneide den Docht auf Fingerbreite.\n\n[alt]\nSchneide den Docht auf Fingerbreite"
                  + " und wische den Glaszylinder ab, bevor du das Streichholz anreißt." },
        requests: ["t-lamp-oil"] },
      { id: "c-ferry-ramp", shelf: "t-ferries", bodyShape: "steps",
        title: { en: "Boarding at the ramp", pl: "Wejście po rampie", de: "An der Rampe an Bord" },
        body: { en: "[step]\nShow the brass token at the foot of the ramp.\n\n[step]\nWait for the second bell before you cross.",
                pl: "[step]\nPokaż mosiężny żeton u stóp rampy.\n\n[step]\nZaczekaj na drugi dzwonek, zanim przejdziesz.",
                de: "[step]\nZeige die Messingmarke am Fuß der Rampe.\n\n[step]\nWarte auf die zweite Glocke, bevor du hinübergehst." } },
      { id: "c-ferry-hours", shelf: "t-ferries", bodyShape: "plain",
        title: { en: "Ferry hours", pl: "Godziny promu", de: "Fährzeiten" },
        body: { en: "The ferry leaves on the hour until the harbour lamps are lit.",
                pl: "Prom odpływa o pełnych godzinach, dopóki nie zapalą się latarnie w porcie.",
                de: "Die Fähre legt zur vollen Stunde ab, bis die Hafenlaternen brennen." } },
    ],
  };
}

/* What a lead would call the catalog they exported, said loss by loss so a red names it: the languages in
   their order, the number of shelves and intents, and for every card its shape and, in every language, its
   title, its body, its parts by the pinned engine's own block count, its shelf's label and its intents'
   clauses. Cards are matched by id, which the export writes; shelves and intents by the card that names them,
   because the importer mints an intent's id from its clause. */
function lostOnTheWay(want, got, ecBlocks) {
  const lost = [];
  const codesOf = (cat) => (cat.langs || []).map(l => l.code);
  const tagOf = (cat, id) => (cat.tags || []).find(t => t && t.id === id) || {};
  const kinds = (cat, kind) => (cat.tags || []).filter(t => t && t.kind === kind).length;
  const said = (v) => JSON.stringify(v === undefined ? null : v);
  if (codesOf(got).join(" ") !== codesOf(want).join(" "))
    lost.push("languages " + codesOf(got).join(" ") + " for " + codesOf(want).join(" "));
  ["shelf", "request"].forEach(kind => {
    if (kinds(got, kind) !== kinds(want, kind)) lost.push(kind + "s " + kinds(got, kind) + " for " + kinds(want, kind));
  });
  for (const w of want.cards) {
    const g = (got.cards || []).find(c => c && c.id === w.id);
    if (!g) { lost.push("card " + w.id); continue; }
    if (g.bodyShape !== w.bodyShape) lost.push("shape " + w.id + " " + g.bodyShape + " for " + w.bodyShape);
    for (const code of codesOf(want)) {
      const at = w.id + " " + code;
      ["title", "body"].forEach(f => { if ((g[f] || {})[code] !== (w[f] || {})[code]) lost.push(f + " " + at); });
      const parts = ecBlocks((w.body || {})[code], w.bodyShape);
      const gotParts = ecBlocks((g.body || {})[code], g.bodyShape);
      if (gotParts !== parts) lost.push("parts " + at + " " + gotParts + " for " + parts);
      const label = (tagOf(got, g.shelf).label || {})[code], wantLabel = (tagOf(want, w.shelf).label || {})[code];
      if (label !== wantLabel) lost.push("label " + at + " " + said(label) + " for " + said(wantLabel));
      const clauses = (g.requests || []).map(id => (tagOf(got, id).clause || {})[code]);
      const wantClauses = (w.requests || []).map(id => (tagOf(want, id).clause || {})[code]);
      if (said(clauses) !== said(wantClauses)) lost.push("clauses " + at + " " + said(clauses) + " for " + said(wantClauses));
    }
  }
  return lost;
}

/* LEG 5'S PILE: no marker anywhere a marker counts, and three cells that look like one to a careless reader (a
   first line opening "[Step 1]", a first line "[alternative]" and a [step] inside a sentence) and a numbered list,
   none of which the engine reads as a marker, so each must stay plain. Two languages, and sibling tables with
   no label_<code> or clause_<code> column, as every pile before board 897 had. */
const PILE_CSV = [
  "id,category,title_en,title_pl,body_en,body_pl,intents",
  '"p-hatch","hatches","Opening the hatch","Otwieranie luku","[Step 1] Lift the latch.' + "\n"
    + 'Then push the hatch outward.","[Krok 1] Podnieś zasuwkę.' + "\n" + 'Potem pchnij luk na zewnątrz.","how do I open the hatch"',
  '"p-cliff","routes","The cliff path","Ścieżka nad klifem","[alternative]' + "\n" + 'Take the cliff path when the tide is in.",'
    + '"[inaczej]' + "\n" + 'Idź ścieżką nad klifem, gdy jest przypływ.",""',
  '"p-dunes","routes","Crossing the dunes","Przez wydmy","1. Follow the posts.' + "\n" + '2. Keep the sea on your left.",'
    + '"1. Idź wzdłuż słupków.' + "\n" + '2. Morze miej po lewej stronie.","how do I cross the dunes"',
  '"p-stool","hatches","The stool by the door","Stołek przy drzwiach","The [step] stool stands by the door.",'
    + '"Stołek [step] stoi przy drzwiach.",""',
  '"p-unwritten","hatches","A card still to write","Karta do napisania","","",""',
].join("\r\n") + "\r\n";
const PILE_CATEGORIES = "key,label\r\nhatches,Hatches\r\nroutes,Routes\r\n";
const PILE_INTENTS = "clause_en\r\nhow do I open the hatch\r\nhow do I cross the dunes\r\n";

/* LEG 6'S CATALOG, in one language, commented in it, with every shape and an intent, and the three files the export
   wrote for it before board 897, measured from Studio main b3d4d36's src/export-csv.mjs. */
function oneLanguage() {
  return {
    format: 2, kind: "etiuda-catalog", id: "salt-store", rev: 1,
    langs: [{ code: "en", label: "EN" }], commentLang: "en",
    tags: [
      { id: "t-barrels", kind: "shelf", label: { en: "Barrels" } },
      { id: "t-scales", kind: "shelf", label: { en: "Scales" } },
      { id: "t-weigh-salt", kind: "request", clause: { en: "how is the salt weighed" } },
    ],
    cards: [
      { id: "c-barrel-lid", shelf: "t-barrels", bodyShape: "alts", title: { en: "Sealing a barrel" },
        body: { en: "[alt: short]\nPress the lid down with both palms.\n\n[alt]\nPress the lid down with both palms, then tap the rim all round." } },
      { id: "c-scale-zero", shelf: "t-scales", bodyShape: "steps", title: { en: "Setting the scale" },
        body: { en: "[step]\nEmpty the pan.\n\n[step]\nTurn the brass knob until the needle rests on the line." },
        requests: ["t-weigh-salt"] },
      { id: "c-scale-hours", shelf: "t-scales", bodyShape: "plain", title: { en: "When the scale is free" },
        body: { en: "The scale is free every morning before the carts arrive." } },
    ],
  };
}
const ONE_LANGUAGE_FILES = {
  "macros.csv": [
    "id,category,title_en,body_en,note_en,keywords,intents,role",
    'c-barrel-lid,barrels,Sealing a barrel,"[alt: short]\nPress the lid down with both palms.\n\n[alt]\nPress the lid down with'
      + ' both palms, then tap the rim all round.",,,,',
    'c-scale-zero,scales,Setting the scale,"[step]\nEmpty the pan.\n\n[step]\nTurn the brass knob until the needle rests on the'
      + ' line.",,,how is the salt weighed,',
    "c-scale-hours,scales,When the scale is free,The scale is free every morning before the carts arrive.,,,,",
  ],
  "categories.csv": ["key,label", "barrels,Barrels", "scales,Scales"],
  "intents.csv": ["clause_en", "how is the salt weighed"],
};

async function main(argv) {
  const digest = p => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");

  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });

  /* ---- 1. IMPORT OF THE EXPORT IS THE DRAFT ------------------------------------------------ */

  const one = pile("one", 7, 20);
  const first = await importCsv({ file: one.csv, id: "export-one", name: "Export one" });
  const draftDir = path.join(SCRATCH, "draft-one");
  const { draftAt } = writeImport(draftDir, first.catalog, first.report);
  const csvOut = path.join(SCRATCH, "csv-one");
  const exp = run(["tools/export-csv.mjs", draftAt, csvOut]);
  check(exp.status === 0 && fs.existsSync(path.join(csvOut, "macros.csv")),
    "1a the command writes the importer's three files, exit " + exp.status
    + (exp.status === 0 ? "" : "; " + String(exp.stderr || exp.stdout).split("\n")[0]));
  const backDir = path.join(SCRATCH, "back-one");
  const back = run(["tools/import.mjs", path.join(csvOut, "macros.csv"), backDir,
    "--id", "export-one", "--name", "Export one"]);
  const backDraft = path.join(backDir, "export-one.draft.json");
  check(back.status === 0 && fs.existsSync(backDraft),
    "1b tools/import.mjs reads that export, exit " + back.status);
  check(fs.existsSync(backDraft) && digest(draftAt) === digest(backDraft),
    "1c and the draft comes back byte for byte ["
    + (fs.existsSync(backDraft) ? digest(backDraft).slice(0, 12) : "none") + "]");

  /* ---- 2. A SEEDED PILE, THREE STEPS ------------------------------------------------------- */

  const two = pile("two", 11, 24);
  const impDir = path.join(SCRATCH, "imp-two");
  const imp = run(["tools/import.mjs", two.csv, impDir, "--id", "export-two", "--name", "Export two"]);
  const impDraft = path.join(impDir, "export-two.draft.json");
  check(imp.status === 0 && fs.existsSync(impDraft),
    "2a the seeded pile imports, exit " + imp.status);
  const csvTwo = path.join(SCRATCH, "csv-two");
  const expTwo = run(["tools/export-csv.mjs", impDraft, csvTwo]);
  check(expTwo.status === 0 && fs.existsSync(path.join(csvTwo, "macros.csv"))
        && fs.existsSync(path.join(csvTwo, "categories.csv"))
        && fs.existsSync(path.join(csvTwo, "intents.csv")),
    "2b then exports to macros.csv, categories.csv and intents.csv, exit " + expTwo.status);
  const backTwoDir = path.join(SCRATCH, "back-two");
  const backTwo = run(["tools/import.mjs", path.join(csvTwo, "macros.csv"), backTwoDir,
    "--id", "export-two", "--name", "Export two"]);
  const backTwoDraft = path.join(backTwoDir, "export-two.draft.json");
  check(backTwo.status === 0 && fs.existsSync(backTwoDraft)
        && digest(impDraft) === digest(backTwoDraft),
    "2c and the second import is the first draft, byte for byte ["
    + (fs.existsSync(backTwoDraft) ? digest(backTwoDraft).slice(0, 12) : "none") + "]");

  /* ---- 3. A CATALOG THAT CARRIES BAGS ------------------------------------------------------
   *
   * Invented at this keyboard rather than generated, because the generator has no keyword
   * column and a column it does not write cannot be round-tripped through it. Three cards on
   * purpose: one with a bag, one with an empty cell and one with a cell of nothing but spaces,
   * so that the byte-for-byte oracle also answers the question an eye would miss - a card with
   * no bag must come back with no `k` AT ALL rather than with an empty string, which the file
   * would carry into every desk's content hash.
   */
  const CRLF = String.fromCharCode(13, 10);
  const BAG_CSV = "id,category,title_en,body_en,keywords" + CRLF
    + '"x-one","glass","Echo stamp","The echo stamp is issued at the counter.","lantern ferry"'
    + CRLF
    + '"x-two","glass","Quill badge","The quill badge is handed over at the gate.",""' + CRLF
    + '"x-three","glass","Pane list","The pane list names what is behind each opening.","   "'
    + CRLF;
  const bagDir = path.join(SCRATCH, "bag-src");
  fs.mkdirSync(bagDir, { recursive: true });
  const bagCsvAt = path.join(bagDir, "macros.csv");
  fs.writeFileSync(bagCsvAt, BAG_CSV, "utf8");
  const bagDraftDir = path.join(SCRATCH, "bag-draft");
  const bagImp = run(["tools/import.mjs", bagCsvAt, bagDraftDir,
    "--id", "export-bag", "--name", "Export bag"]);
  const bagDraft = path.join(bagDraftDir, "export-bag.draft.json");
  const bagCards = fs.existsSync(bagDraft)
    ? JSON.parse(fs.readFileSync(bagDraft, "utf8")).cards : [];
  check(bagImp.status === 0 && bagCards.length === 3 && bagCards[0].k === "lantern ferry"
        && !("k" in bagCards[1]) && !("k" in bagCards[2]),
    "3a the hand-written pile imports with one bag and two cards that have none at all, not two"
    + " with an empty one [" + bagCards.map(c => JSON.stringify(c.k)).join(" ") + "]");
  const bagCsvOut = path.join(SCRATCH, "csv-bag");
  const bagExp = run(["tools/export-csv.mjs", bagDraft, bagCsvOut]);
  const bagHead = bagExp.status === 0
    ? fs.readFileSync(path.join(bagCsvOut, "macros.csv"), "utf8").split(CRLF)[0] : "";
  check(bagExp.status === 0 && bagHead.split(",").includes("keywords"),
    "3b the export writes the keyword column, once and with no language on it [" + bagHead + "]");
  const bagBackDir = path.join(SCRATCH, "back-bag");
  const bagBack = run(["tools/import.mjs", path.join(bagCsvOut, "macros.csv"), bagBackDir,
    "--id", "export-bag", "--name", "Export bag"]);
  const bagBackDraft = path.join(bagBackDir, "export-bag.draft.json");
  check(bagBack.status === 0 && fs.existsSync(bagBackDraft)
        && digest(bagDraft) === digest(bagBackDraft),
    "3c and the draft comes back byte for byte, bags and all ["
    + (fs.existsSync(bagBackDraft) ? digest(bagBackDraft).slice(0, 12) : "none") + "]");

  const { ecBlocks } = Engine.countRules();
  const { lintCatalog } = Engine.lint();
  const F = await Engine.format();

  /* ---- 4. TWO LANGUAGES, OUT AND BACK (board 897) -------------------------------------------
   *
   * Through the two functions Studio's own doors call: exportCards calls exportCsv (bw11 in
   * tests/bulk-wiring.mjs holds that), and the Import wizard reads the folder through importCsv.
   */
  const lead = twoLanguages();
  lead.hash = F.contentHash(lead);
  const leadLint = lintCatalog(lead);
  check(!leadLint.errors.length,
    "4a the lead's catalog is one the pinned engine's lint passes, so what comes back is compared with a real catalog"
    + (leadLint.errors.length ? " [" + leadLint.errors.slice(0, 2).join(" | ") + "]" : ""));
  const twoOut = path.join(SCRATCH, "csv-two-languages");
  await exportCsv({ catalog: lead, out: twoOut });
  const twoBack = await importCsv({ file: path.join(twoOut, "macros.csv"), id: "lamp-house" });
  const lost = lostOnTheWay(lead, twoBack.catalog, ecBlocks);
  check(!lost.length,
    "4b and imported back it has every card's shape and parts, and every language's titles, bodies, labels and clauses"
    + " under their own language" + (lost.length ? " [lost: " + lost.join("; ") + "]" : ""));
  /* The count the import reports, held to a number written here rather than to the same ecBlocks 4b compares
     parts by, so a pin whose block count changed reddens a Studio leg: two parts of alternatives, two steps and
     one plain body. */
  check(twoBack.report.counts.macros === 5,
    "4d the import reports the primary language's five blocks, two alternatives, two steps and one plain body ["
    + twoBack.report.counts.macros + "]");
  const backLint = lintCatalog(twoBack.catalog);
  check(!backLint.errors.length,
    "4c and the pinned engine's lint passes the catalog that came back"
    + (backLint.errors.length ? " [" + backLint.errors.slice(0, 2).join(" | ") + "]" : ""));

  /* ---- 5. A PILE WITH NO MARKER IMPORTS AS IT DID ---------------------------------------- */

  const pileDir = path.join(SCRATCH, "pile-no-marker");
  fs.mkdirSync(pileDir, { recursive: true });
  fs.writeFileSync(path.join(pileDir, "macros.csv"), PILE_CSV, "utf8");
  fs.writeFileSync(path.join(pileDir, "categories.csv"), PILE_CATEGORIES, "utf8");
  fs.writeFileSync(path.join(pileDir, "intents.csv"), PILE_INTENTS, "utf8");
  const plain = await importCsv({ file: path.join(pileDir, "macros.csv"), id: "no-marker" });
  const shapes = plain.catalog.cards.map(c => c.bodyShape);
  check(shapes.length === 5 && shapes.every(s => s === "plain"),
    "5a a pile whose cells only look like markers imports every card plain [" + shapes.join(" ") + "]");
  /* The rows with a primary body, counted from the sheet's own cells by this file, not by the importer. */
  const withBody = PILE_CSV.split("\r\n").slice(1).filter(Boolean).filter(r => !/^"p-unwritten"/.test(r)).length;
  check(plain.report.counts.macros === withBody && withBody === 4,
    "5b its macro count is the rows with a primary body, as before [" + plain.report.counts.macros + " of " + withBody + "]");
  const keysOf = (kind, field) => plain.catalog.tags.filter(t => t.kind === kind).map(t => Object.keys(t[field] || {}).join("+"));
  const labels = keysOf("shelf", "label"), clauses = keysOf("request", "clause");
  check(labels.length === 2 && labels.every(k => k === "en") && clauses.length === 2 && clauses.every(k => k === "en"),
    "5c and tables with no label_<code> or clause_<code> column give each shelf and each intent its primary words alone"
    + " [" + labels.concat(clauses).join(" ") + "]");

  /* ---- 6. ONE LANGUAGE EXPORTS AS IT DID ------------------------------------------------- */

  const oneOut = path.join(SCRATCH, "csv-one-language");
  await exportCsv({ catalog: oneLanguage(), out: oneOut });
  const differ = Object.keys(ONE_LANGUAGE_FILES).filter(n =>
    !fs.existsSync(path.join(oneOut, n))
    || fs.readFileSync(path.join(oneOut, n), "utf8") !== ONE_LANGUAGE_FILES[n].join("\r\n") + "\r\n");
  check(!differ.length,
    "6a a catalog in one language exports the three files it did before board 897, byte for byte"
    + (differ.length ? " [differ: " + differ.join(" ") + "]" : ""));

  if (!argv.includes("--keep")) dropScratch(SCRATCH, "export-csv");
  process.stdout.write("export-csv-legs: " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]))
  main(process.argv.slice(2)).catch(e => {
    process.stderr.write("export-csv-legs: REFUSED " + (e && e.stack ? e.stack : e) + "\n");
    process.exit(2);
  });
