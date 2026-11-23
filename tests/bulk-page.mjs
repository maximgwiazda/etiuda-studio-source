/* The page of bulk upkeep, as it paints (board 834, step 10, C09): node tests/bulk-page.mjs [--keep].
 * The page's own code runs on tests/page-stand-in.mjs against the real verbs and a real project; every leg reads markup,
 * state and files, never layout, focus or events. How it looks is Maxim's eye, and what to look at is in the report. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as S from "../src/studio.mjs";
import { DRAFT_FILE } from "../src/publish.mjs";
import { rows as csvRows, csvOf } from "../src/csv.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { loadPage } from "./page-stand-in.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "bulk-page");
const EXPECTED = 49;
const NB = String.fromCharCode(160);

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const wire = (p) => Promise.resolve(p)
  .then(v => JSON.parse(JSON.stringify(Object.assign({ error: null }, v))))
  .catch(e => ({ error: e && e.message ? e.message : String(e), said: (e && e.said) || null, disk: !!(e && e.disk) }));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const bytes = (dir) => fs.readFileSync(path.join(dir, DRAFT_FILE));
const draftOf = (dir) => JSON.parse(bytes(dir).toString("utf8"));
const text = (html) => String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").replace(/&middot;/g, "·").replace(/&#39;/g, "'").trim();
const count = (html, needle) => String(html).split(needle).length - 1;
const el = (attrs) => ({ getAttribute: (k) => (attrs[k] == null ? null : attrs[k]) });
/* A ceiling, not a delay: the wait returns as soon as f holds. Callers that pass ms keep their own. */
async function until(f, ms) { for (let i = 0; i < (ms || 25000) / 20; i++) { if (f()) return true; await sleep(20); } return f(); }

async function main(argv) {
  clearScratch(SCRATCH);
  const root = path.join(SCRATCH, "projects");
  fs.mkdirSync(root, { recursive: true });
  const made = await S.newProject(root, "Bulk page", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }]);
  const dir = made.dir;
  const shelfA = (await S.addTag(dir, "shelf", { en: "Delivery", pl: "Dostawa" })).tag.id;
  const shelfB = (await S.addTag(dir, "shelf", { en: "Workshops", pl: "Warsztaty" })).tag.id;
  const ids = [];
  const PRICE = [1, 1, 1, 0, 0, 0];
  for (let i = 0; i < 6; i++) {
    const r = await S.addCard(dir, i < 3 ? shelfA : shelfB, "Card " + "ABCDEF"[i], "Courier costs " + (PRICE[i] ? "18 zł" : "20 zł") + " in Poland.");
    ids.push(r.card.id);
    /* the first card also holds a word form, so that Whole words and Match case change what a search for kurier finds */
    await S.saveCard(dir, r.card.id, { body: { pl: "Kurier kosztuje " + (PRICE[i] ? "18 zł" : "20 zł") + " w Polsce" + (i === 0 ? ", a kurierem 25 zł." : ".") } });
  }
  await S.saveFacts(dir, "Poland: courier 18 zł, locker 14 zł.\nW Polsce kurier kosztuje 18 zł.");

  const calls = [];
  const api = { calls };
  const lastArgs = {};
  for (const k of ["findPlaces", "replacePlaces", "retireCards", "moveCards", "deleteCards", "undoBulk", "undoDelete", "exportCards",
    "sheetPlan", "sheetLand", "cardHistory", "saveCard"]) api[k] = (...a) => { calls.push(k); lastArgs[k] = a; return wire(S[k](...a)); };
  api.importPick = () => { calls.push("importPick"); return Promise.resolve({ error: null, file: SHEET }); };
  api.csvPick = () => { calls.push("csvPick"); return Promise.resolve({ error: null, folder: path.join(SCRATCH, "out") }); };
  const SHEET = path.join(SCRATCH, "sheet.csv");

  const home = loadPage({ api, uiLang: "en" });
  const P = home.page;
  const open = await wire(S.openProject(dir));
  Object.assign(P.S, { open, screen: "project", section: "cards", lang: "en" });
  const mainHtml = () => home.node("#main").innerHTML;
  const barHtml = () => home.node("#bulk").innerHTML;
  const rowsOf = () => (home.sandbox.__tables.slice(-1)[0] || {}).__rows || [];
  const before = bytes(dir);

  /* ---- 1. THE TICK COLUMN -------------------------------------------------------------------- */

  P.paint();
  const table0 = P.tableHtml(P.visibleCards());
  check(/<th class="tk"><span class="cbx" role="checkbox" aria-checked="false" data-act="tick-all" tabindex="0" aria-label="Cards">/.test(table0)
        && count(table0, 'data-act="tick"') === 6 && count(table0, 'aria-checked="false"') === 7,
    "bp1a markup: the table's head and each of its 6 rows carry a tick, none on, the head's named for the reader");
  const tickOf = (html, id) => new RegExp('<span class="cbx( on)?" role="checkbox" aria-checked="(\\w+)" data-act="tick" data-id="' + id + '"').exec(html);
  P.ACTS.tick(el({ "data-id": ids[1] }));
  const t1 = P.tableHtml(P.visibleCards());
  check(tickOf(t1, ids[1])[2] === "true" && tickOf(t1, ids[0])[2] === "false" && tickOf(t1, ids[2])[2] === "false" && P.S.ticks.size === 1,
    "bp1b a press ticks that card's row and no other");
  P.__set ? P.__set("shiftNow", true) : null;
  P.ACTS.tick(el({ "data-id": ids[4] }));
  P.__set("shiftNow", false);
  check([...P.S.ticks].sort().join() === ids.slice(1, 5).sort().join(),
    "bp1c a Shift+click ticks the range from the last ticked card to this one, in the order the table shows: " + P.S.ticks.size + " ticked");
  P.ACTS.tick(el({ "data-id": ids[3] }));
  check(!P.S.ticks.has(ids[3]) && P.S.ticks.size === 3, "bp1d CONTROL: a press on a ticked card takes the tick off, and only that one");
  P.ACTS["tick-all"]();
  check(P.S.ticks.size === 6, "bp1e the head's tick ticks every card the table shows");
  P.ACTS["tick-all"]();
  check(P.S.ticks.size === 0, "bp1f and a second press takes them all off");

  /* ---- 2. THE BAR ---------------------------------------------------------------------------- */

  P.paintBulk();
  check(home.node("#bulk").hidden === true && barHtml() === "", "bp2a with nothing ticked there is no bar");
  [ids[0], ids[1], ids[2]].forEach(id => P.ACTS.tick(el({ "data-id": id })));
  const bar = barHtml();
  /* Since the tray (board 862, tests/vision-gamma.mjs section 4) the bar names the ticked cards, offers Replace in these, says
     the ticks are kept through searches and unticks all; Shift+click's range is its head's tooltip. */
  check(home.node("#bulk").hidden === false && text(bar).startsWith("3 cards ticked Card A Card B Card C Move to a category Delivery Workshops Replace in these Retire Export to a spreadsheet Delete Kept through searches")
        && /title="Shift\+click ticks a range"/.test(bar) && /data-act="bulk-untick">Untick all</.test(bar)
        && /<select class="btn sm" id="bulkMove"/.test(bar) && count(bar, "<option") === 3,
    "bp2b with 3 ticked the bar says so, offers each category to move to, Retire, Export to a spreadsheet, Delete (not Delete card, it acts on every ticked card) and Untick all: " + text(bar));
  P.S.find = { whole: true, matchCase: false, to: "", rows: null, places: 0, off: new Set(), asked: null };
  P.paintBulk();
  check(home.node("#bulk").hidden === true, "bp2c CONTROL: while find and replace is up the bar is not");
  P.S.find = null;
  P.paintBulk();

  /* ---- 3. RETIRE THE TICKED, AND ONE UNDO -------------------------------------------------- */

  await P.ACTS["bulk-retire"]();
  const afterRetire = draftOf(dir);
  check(afterRetire.cards.filter(c => c.retired).length === 3 && calls.includes("retireCards") && P.S.ticks.size === 0,
    "bp3a Retire on 3 ticked cards puts 3 flags in the draft file and clears the ticks");
  P.paintUndo();
  const undoBar = home.node("#undo").innerHTML;
  check(home.node("#undo").hidden === false && text(undoBar).startsWith("Retired: 3 cards.") && /data-act="card-undo"/.test(undoBar),
    "bp3b the undo bar says what was done and offers Undo: " + text(undoBar));
  check(P.S.open.draft.cards.filter(c => c.retired).length === 3 && home.node("#bulk").hidden === true,
    "bp3c the page's own draft took the change and the bar went with the ticks");
  await P.ACTS["card-undo"]();
  check(Buffer.compare(bytes(dir), before) === 0 && P.S.undo === null && P.S.open.draft.cards.every(c => !c.retired),
    "bp3d one Undo takes all 3 flags off, in the file byte for byte and in the page");

  /* A RETIRE THAT CHANGES NOTHING WRITES NOTHING (W3e), as the replace that finds no place does: the cards are retired already,
     so the second press refuses, the file is as it was, the ticks stay, and the bar never says "Retired: 0 cards." */
  [ids[0], ids[1], ids[2]].forEach(id => P.ACTS.tick(el({ "data-id": id })));
  await P.ACTS["bulk-retire"]();
  const retiredFile = bytes(dir);
  [ids[0], ids[1], ids[2]].forEach(id => P.ACTS.tick(el({ "data-id": id })));
  await P.ACTS["bulk-retire"]();
  check(Buffer.compare(bytes(dir), retiredFile) === 0 && P.S.ticks.size === 3 && !!P.S.undo && /^Retired:\s3\scards\.$/.test(P.S.undo.said),
    "bp3e Retire on cards that are all retired already writes no file, keeps the ticks and leaves the first act's bar as it was: "
    + (P.S.undo && P.S.undo.said));
  check(!/\b0\b/.test(P.S.undo.said) && calls.filter(c => c === "retireCards").length === 3,
    "bp3f CONTROL: the second press did reach the node half (3 retire calls in all) and no line says 0 cards");
  await P.ACTS["card-undo"]();
  check(Buffer.compare(bytes(dir), before) === 0, "bp3g and the Undo that is still on offer is the first act's, byte for byte");
  P.S.ticks = new Set(); P.S.tickAt = null;

  /* ---- 4. MOVE AND DELETE THE TICKED ---------------------------------------------------------- */

  [ids[0], ids[1]].forEach(id => P.ACTS.tick(el({ "data-id": id })));
  await P.ACTS["bulk-delete"]();
  check(draftOf(dir).cards.length === 4 && P.S.open.draft.cards.length === 4 && /Deleted: 2/.test(text(home.node("#undo").innerHTML) || (P.paintUndo(), text(home.node("#undo").innerHTML))),
    "bp4a Delete on 2 ticked cards takes exactly those, and the undo bar says so");
  await P.ACTS["card-undo"]();
  check(Buffer.compare(bytes(dir), before) === 0 && P.S.open.draft.cards.length === 6, "bp4b and Undo puts both back, byte for byte");

  /* ---- 5. FIND AND REPLACE ------------------------------------------------------------------- */

  P.S.q = "18 zł";
  P.ACTS["find-open"]();
  await until(() => P.S.find && P.S.find.rows !== null);
  P.S.find.to = "19 zł";
  P.findBodyPaint();
  const k0 = P.findCounts();
  const strip = P.findStrip();
  check(k0.places === 8 && k0.ticked === 8 && k0.cards === 3 && k0.facts === true && P.S.find.rows.length === 4,
    "bp5a `18 zł` in the page's find: 8 places, all ticked, 3 cards and the quick facts, in 4 rows");
  check(text(strip) === "Replace with Whole words Match case 8 places: 3 cards, Quick facts Replace the ticked (8) Close",
    "bp5b the strip reads Replace with, Whole words, Match case, the count and the button: " + text(strip));
  check(/class="cbx on" role="checkbox" aria-checked="true" data-act="find-whole"/.test(strip) && /class="cbx" role="checkbox" aria-checked="false" data-act="find-case"/.test(strip)
        && /data-act="find-do">[^]*Replace the ticked \(8\)/.test(strip) && /data-act="find-close">Close</.test(strip),
    "bp5c Whole words is on, Match case is off, the button counts 8");
  const prev = P.findTable();
  check(count(prev, "<del>18 zł</del><ins>19 zł</ins>") === 8 && count(prev, 'data-act="find-tick"') === 4 && /<th>Preview<\/th>/.test(prev)
        && /<td class="t-title">Quick facts<\/td>/.test(prev) && count(prev, '<span class="chip">PL</span>') === 3,
    "bp5d the preview has a row for each card and the facts, each place struck and replaced, the language on the line");
  P.ACTS["find-tick"](el({ "data-key": ids[1] }));
  check(P.findCounts().ticked === 6 && /Replace the ticked \(6\)/.test(text(home.node("#findDo").innerHTML)) && /aria-checked="false" data-act="find-tick" data-key="/.test(P.findTable()),
    "bp5e unticking one row takes its places off the button: 6 of 8");
  await P.ACTS["find-do"]();
  const d1 = draftOf(dir);
  const left = (d) => d.cards.reduce((n, c) => n + Object.values(c.body).filter(t => t.includes("18 zł")).length, 0);
  check(calls.includes("replacePlaces") && left(d1) === 2 && d1.cards.reduce((n, c) => n + Object.values(c.body).filter(t => t.includes("19 zł")).length, 0) === 4
        && !d1.facts.includes("18 zł") && d1.facts.split("19 zł").length - 1 === 2 && d1.cards.find(c => c.id === ids[1]).body.en.includes("18 zł"),
    "bp5f Replace the ticked changes the 6 ticked places and leaves the unticked card as it was");
  check(P.S.find === null && P.S.q === "" && /Replaced: 6 places \(2 cards, Quick facts\)\./.test(text(P.S.undo.said)) ,
    "bp5g the strip closes, the search is cleared, and the undo bar says what was replaced: " + (P.S.undo && P.S.undo.said));
  await P.ACTS["card-undo"]();
  check(Buffer.compare(bytes(dir), before) === 0, "bp5h one Undo puts the whole replacement back, byte for byte");

  P.S.q = "kurier"; P.S.find = null;
  P.ACTS["find-open"]();
  await until(() => P.S.find && P.S.find.rows !== null);
  const whole = P.findCounts().places;
  P.ACTS["find-whole"]();
  P.S.find.rows = null;
  await until(() => P.S.find.rows !== null);
  check(whole > 0 && P.S.find.whole === false && P.findCounts().places >= whole,
    "bp5i turning Whole words off asks again with the new setting: " + whole + " places, then " + P.findCounts().places);
  P.ACTS["find-close"]();
  check(P.S.find === null, "bp5j Close puts the table back");

  /* the test architect's M11 and M11b: the two ticks are what the page sends, and what comes back differs by them */
  P.S.q = "kurier"; P.S.find = null;
  P.ACTS["find-open"]();
  await until(() => P.S.find && P.S.find.rows !== null);
  const places = () => P.findCounts().places;
  const ask = async (toggle) => { P.ACTS[toggle](); P.S.find.rows = null; await until(() => P.S.find.rows !== null); return lastArgs.findPlaces[1]; };
  check(places() === 7 && lastArgs.findPlaces[1].whole === true && lastArgs.findPlaces[1].matchCase === false,
    "bp5m kurier with the two ticks as they open (Whole words on, Match case off) is sent so and finds 7 places (6 bodies, 1 in the quick facts): " + places());
  const a1 = await ask("find-whole");
  check(a1.whole === false && a1.matchCase === false && places() === 8,
    "bp5n turning Whole words off sends whole:false and the search finds the word form too, 8 places: " + JSON.stringify(a1) + " " + places());
  await ask("find-whole");
  const a2 = await ask("find-case");
  check(a2.matchCase === true && a2.whole === true && places() === 1,
    "bp5o turning Match case on sends matchCase:true and the capitalised Kurier no longer matches kurier, only the lower-case one in the facts does, 1 place: " + JSON.stringify(a2) + " " + places());
  const a3 = await ask("find-case");
  check(a3.matchCase === false && places() === 7, "bp5p and turning it off again sends matchCase:false and finds the 7 again: " + places());
  P.ACTS["find-close"]();
  P.S.q = "";

  P.S.find = { whole: true, matchCase: false, to: "Item", rows: (await S.findPlaces(dir, { find: "Card" })).rows, places: 0, off: new Set(), asked: null };
  const tprev = P.findTable();
  check(P.S.find.rows.length === 6 && count(tprev, '<span class="chip">title</span>') === 6 && count(tprev, '<span class="chip">EN</span>') === 6
        && /<span class="chip">EN<\/span><span class="chip">title<\/span><del>Card<\/del><ins>Item<\/ins> A/.test(tprev),
    "bp5k a title match is its own preview line, marked with its language and the word title, struck and replaced like a body's");
  P.S.find = null;
  const plp = loadPage({ api, uiLang: "pl" }).page;
  Object.assign(plp.S, { open, screen: "project", section: "cards", lang: "en" });
  plp.S.find = { whole: true, matchCase: false, to: "Pozycja", rows: (await S.findPlaces(dir, { find: "Card" })).rows, places: 0, off: new Set(), asked: null };
  check(count(plp.findTable(), '<span class="chip">tytuł</span>') === 6, "bp5l in Polish the mark is tytuł");

  /* ---- 6. THE IMPORT SCREEN ------------------------------------------------------------------ */

  P.S.section = "import";
  P.paintImportAffordance();
  const imp = mainHtml();
  check(/<h1>Spreadsheet<\/h1>/.test(imp) && /To a spreadsheet/.test(imp) && /data-act="csv-export-all">[^]*Export the cards to CSV/.test(imp)
        && /From a spreadsheet/.test(imp) && /data-act="sheet-pick">[^]*Choose a spreadsheet/.test(imp),
    "bp6a markup: the page offers the export button and, below, a spreadsheet to choose");
  calls.length = 0;
  P.ACTS.section(el({ "data-v": "import" }));
  check(!calls.includes("importPick") && P.S.section === "import",
    "bp6b the rail's Import row opens this page and no longer opens the wizard's file picker");

  await S.exportCards(dir, null, path.join(SCRATCH, "x"));
  const grid = csvRows(fs.readFileSync(path.join(SCRATCH, "x", "macros.csv"), "utf8"), ",");
  const head = grid[0], col = (n) => head.indexOf(n);
  const edit = grid.map(r => r.slice());
  edit[2][col("title_en")] = "Retitled in the sheet";
  edit[3][col("body_pl")] = edit[3][col("body_pl")] + " Dziękujemy.";
  const fresh = new Array(head.length).fill("");
  fresh[col("category")] = edit[1][col("category")];
  fresh[col("title_en")] = "Fresh card"; fresh[col("body_en")] = "Fresh body.";
  fresh[col("title_pl")] = "Nowa karta"; fresh[col("body_pl")] = "Nowa treść.";
  edit.push(fresh);
  edit.splice(5, 1);
  fs.writeFileSync(SHEET, csvOf(edit));
  await P.ACTS["sheet-pick"]();
  const NOTREAD = "Intents and roles are edited in Studio itself, so the sheet's columns for them are passed over.";
  check(calls.includes("importPick") && calls.includes("sheetPlan") && P.S.sheet && P.S.sheet.plan.counts.changed === 2,
    "bp6c choosing a sheet reads it against the draft and keeps the answer: " + JSON.stringify(P.S.sheet && P.S.sheet.plan.counts));
  const pane = P.sheetPane();
  check(/Changed 2 · New 1 · Unchanged 3 · Not in the sheet 1/.test(text(pane)) && /matched by the id column/.test(text(pane))
        && /<th>What changes<\/th><th>Was<\/th><th>Becomes<\/th>/.test(pane) && /new card, row 7/.test(text(pane))
        && /not in the sheet/.test(text(pane)) && /stays as it is/.test(text(pane)) && /Put into the draft \(3 cards\)/.test(text(pane)),
    "bp6d markup: the counts, the Archive's three columns, the new card with its row, the missing one left alone, and the button: " + text(pane).slice(0, 220));
  check(P.S.sheet.plan.notRead === true && text(pane).includes(NOTREAD),
    "bp6d2 a sheet with an intents or a role column carries the one line saying they are not read");
  const slimPlan = JSON.parse(JSON.stringify(P.S.sheet.plan)); slimPlan.notRead = false;
  const keepSheet = P.S.sheet; P.S.sheet = { dir: keepSheet.dir, file: keepSheet.file, plan: slimPlan };
  check(!text(P.sheetPane()).includes(NOTREAD), "bp6d3 CONTROL: a sheet with neither column does not");
  P.S.sheet = keepSheet;
  check(Buffer.compare(bytes(dir), before) === 0, "bp6e reading the sheet wrote nothing");
  await P.ACTS["sheet-land"]();
  const d2 = draftOf(dir);
  check(d2.cards.length === 7 && d2.cards[6].title.en === "Fresh card" && /^c-[0-9a-f]{32}$/.test(d2.cards[6].id) && P.S.sheet === null
        && /Taken from the sheet: 3/.test(text(P.S.undo.said)),
    "bp6f Put into the draft lands the 3 cards as one change and says so in the undo bar");
  await P.ACTS["card-undo"]();
  check(Buffer.compare(bytes(dir), before) === 0 && P.S.open.draft.cards.length === 6, "bp6g and one Undo takes the whole sheet back, byte for byte");

  /* ---- 7. IN POLISH -------------------------------------------------------------------------- */

  const pl = loadPage({ api, uiLang: "pl" });
  const Q = pl.page;
  Object.assign(Q.S, { open: await wire(S.openProject(dir)), screen: "project", section: "cards", lang: "en" });
  Q.paint();
  [ids[0], ids[1], ids[2]].forEach(id => Q.ACTS.tick(el({ "data-id": id })));
  const pb = text(pl.node("#bulk").innerHTML);
  check(/3 zaznaczone karty Card A Card B Card C Przenieś do kategorii/.test(pb) && /Wycofaj/.test(pb)
        && /Eksportuj do arkusza Usuń Zaznaczenie zostaje przy każdym wyszukiwaniu Odznacz wszystkie/.test(pb)
        && /title="Shift\+klik zaznacza zakres"/.test(pl.node("#bulk").innerHTML),
    "bp7a the bar in Polish, in the sheet's words: " + pb);
  Q.S.q = "18 zł";
  Q.S.find = { whole: true, matchCase: false, to: "19 zł", rows: null, places: 0, off: new Set(), asked: null };
  Q.S.find.rows = (await S.findPlaces(dir, { find: "18 zł" })).rows;
  const ps = text(Q.findStrip());
  check(/Zamień na/.test(ps) && /Całe słowa/.test(ps) && /Wielkość liter/.test(ps) && /8 miejsc: 3 karty, Szybkie fakty/.test(ps)
        && /Zamień zaznaczone \(8\)/.test(ps) && /Zamknij/.test(ps) && /Podgląd/.test(text(Q.findTable())),
    "bp7b the strip and the preview in Polish, with the sheet's own count line: " + ps);
  Q.S.find = null;
  Q.S.section = "import";
  Q.S.sheet = { dir: Q.S.open.dir, file: SHEET, plan: await S.sheetPlan(dir, SHEET) };
  const pp = text(Q.sheetPane());
  check(/dopasowanie po kolumnie id/.test(pp) && /Zmienione: 2 · Nowe: 1 · Bez zmian: 3 · Brak w arkuszu: 1/.test(pp) && /nowa karta, wiersz 7/.test(pp)
        && /nie ma w arkuszu/.test(pp) && /zostaje bez zmian/.test(pp) && /Wprowadź do szkicu \(3 karty\)/.test(pp),
    "bp7c the sheet's pane in Polish: " + pp.slice(0, 200));
  Q.S.undo = { dir, bulk: true, said: Q.bulkSaid({ kind: "retire", cards: 3 }) };
  check(/^Wycofano:\s3\skarty\.$/.test(Q.S.undo.said), "bp7d the undo bar's line after a Retire is Claudette's Polish: " + Q.S.undo.said);

  /* ---- 8. THE CARDS TABLE IS WHAT IT WAS -------------------------------------------------- */

  P.S.section = "cards"; P.S.ticks = new Set(); P.S.find = null; P.S.sheet = null; P.S.cardView = "active";
  P.paint();
  /* each row is also the card's object since board 901, and wears its two marks before its act */
  check(rowsOf().length === 6 && rowsOf().every(r => /^<tr class="pick" data-ctx="card" data-where="card" data-act="pick" data-id="/.test(r) && !/ ret"/.test(r)),
    "bp8a CONTROL: with nothing ticked the table's rows are the same six rows, each still a pick");
  check(P.visibleCards().length === 6 && P.S.ticks.size === 0, "bp8b and the page holds no tick it was not given");

  process.stdout.write("\nbulk-page  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  if (asserted !== EXPECTED) {
    process.stderr.write("bulk-page  expected " + EXPECTED + " assertions, ran " + asserted + "\n");
    failed++;
  }
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "bulk-page");
  else process.stdout.write("bulk-page  kept " + SCRATCH + "\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("bulk-page  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
