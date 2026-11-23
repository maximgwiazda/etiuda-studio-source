/* Find and replace, the acts on several cards, random card ids and the sheet round trip, on the verbs (board 834, step 10, C09):
 * node tests/bulk.mjs [--keep]. The oracle is the shipped sample at the pin (Mirabelka, 248 cards) and counts made here by
 * regular expressions of this file's own, never by src/bulk.mjs. Markup is tests/bulk-page.mjs, the wiring tests/bulk-wiring.mjs. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import * as S from "../src/studio.mjs";
import { DRAFT_FILE } from "../src/publish.mjs";
import { importCsv } from "../src/import.mjs";
import { rows as csvRows, csvOf } from "../src/csv.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { shippedSample } from "./shipped-sample.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "bulk");
const EXPECTED = 78;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const draftAt = (dir) => path.join(dir, DRAFT_FILE);
const bytes = (dir) => fs.readFileSync(draftAt(dir));
const draftOf = (dir) => JSON.parse(bytes(dir).toString("utf8"));
const same = (a, b) => Buffer.compare(a, b) === 0;
async function refusal(p) { try { await p; return null; } catch (e) { return e; } }

/* counts by expressions written here: every place of a text in the bodies, and in the facts */
const ALNUM = "\\p{L}\\p{N}";
const rx = (text, whole, matchCase) => new RegExp((whole ? "(?<![" + ALNUM + "])" : "") + text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  + (whole ? "(?![" + ALNUM + "])" : ""), "gu" + (matchCase ? "" : "i"));
const hits = (t, re) => (String(t == null ? "" : t).match(re) || []).length;
const inBodies = (d, re) => d.cards.reduce((n, c) => n + Object.values(c.body || {}).reduce((m, t) => m + hits(t, re), 0), 0);
const inTitles = (d, re) => d.cards.reduce((n, c) => n + Object.values(c.title || {}).reduce((m, t) => m + hits(t, re), 0), 0);
const inFacts = (d, re) => hits(d.facts, re);

async function main(argv) {
  clearScratch(SCRATCH);
  const root = path.join(SCRATCH, "projects");
  fs.mkdirSync(root, { recursive: true });
  const made = await S.upgradeLand(root, shippedSample().at, "Mirabelka");
  const dir = made.dir;
  const d0 = draftOf(dir);
  const before0 = bytes(dir);
  check(d0.cards.length === 248 && typeof d0.facts === "string" && d0.cards.every(c => !c.retired),
    "bk0a the project is the shipped sample: " + d0.cards.length + " cards, quick facts a text, none retired");

  /* ---- 1. FIND ------------------------------------------------------------------------------- */

  const f18 = await S.findPlaces(dir, { find: "18 zł", replace: "19 zł" });
  const rows18 = f18.rows.filter(r => r.kind === "card");
  check(f18.places === 8 && rows18.reduce((n, r) => n + r.places.length, 0) === 6
        && f18.rows.filter(r => r.kind === "facts").map(r => r.places.length).join() === "2" && f18.rows.length === 4,
    "bk1a `18 zł` has 8 places, 6 in bodies (3 cards, both languages) and 2 in the quick facts, in 4 rows: "
    + f18.places + " in " + f18.rows.length);
  check(f18.places === inBodies(d0, rx("18 zł", true)) + inFacts(d0, rx("18 zł", true)),
    "bk1b CONTROL: the same count made by a regular expression of this test's own, over the file: "
    + (inBodies(d0, rx("18 zł", true)) + inFacts(d0, rx("18 zł", true))));
  const body = (r) => r.rows.filter(x => x.kind === "card").reduce((n, x) => n + x.places.length, 0);
  const kWhole = await S.findPlaces(dir, { find: "kurier" });
  const kAny = await S.findPlaces(dir, { find: "kurier", whole: false });
  check(body(kWhole) === 15 && body(kAny) === 34,
    "bk1c whole words: `kurier` has 15 places in the titles and bodies (3 + 12) and does not touch `kuriera` (34 with Whole words off): "
    + body(kWhole) + " and " + body(kAny));
  check(body(kWhole) === inBodies(d0, rx("kurier", true)) + inTitles(d0, rx("kurier", true))
        && body(kAny) === inBodies(d0, rx("kurier", false)) + inTitles(d0, rx("kurier", false)) && kWhole.places === 17,
    "bk1d CONTROL: both counts agree with this test's own expressions, and the two in the quick facts make 17: " + kWhole.places);
  const kCase = await S.findPlaces(dir, { find: "kurier", matchCase: true });
  check(body(kCase) === inBodies(d0, rx("kurier", true, true)) + inTitles(d0, rx("kurier", true, true)) && body(kCase) < body(kWhole),
    "bk1e Match case drops the capitalised places: " + body(kCase) + " against " + body(kWhole));
  const pax = await S.findPlaces(dir, { find: "PAX" });
  const tokenBodies = inBodies(d0, /\{PAX\}/g);
  check(pax.places === 0 && tokenBodies > 0,
    "bk1f a token is not matched inside its braces: `PAX` finds " + pax.places + " places in a catalog with " + tokenBodies + " `{PAX}`");
  const paxWhole = await S.findPlaces(dir, { find: "{PAX}" });
  check(body(paxWhole) === tokenBodies,
    "bk1g CONTROL: typing the whole token finds all of them, " + body(paxWhole) + " of " + tokenBodies);
  const none = await S.findPlaces(dir, { find: "" });
  check(none.places === 0 && none.rows.length === 0, "bk1h nothing typed, nothing found");
  const titleLines = kWhole.rows.flatMap(r => r.places.filter(p => p.field === "title").map(p => r.kind + ":" + p.lang));
  const firstTitled = kWhole.rows.find(r => r.places.some(p => p.field === "title"));
  const order = firstTitled.places.map(p => p.field);
  check(titleLines.length === 3 && titleLines.every(l => l === "card:pl") && order.indexOf("body") > order.lastIndexOf("title")
        && kAny.rows.reduce((n, r) => n + r.places.filter(p => p.field === "title").length, 0) === 6,
    "bk1i a title match is a place of its own, marked with its language and the field, ahead of that card's body places: 3 whole-word and 6 any-form in the titles, "
    + titleLines.join());
  const kIds = kWhole.rows.filter(r => r.kind === "card").map(r => r.key);
  const noted = d0.cards.filter(c => c.note).length;
  const swap = await S.replacePlaces(dir, { find: "kurier", replace: "przewoźnik" }, kWhole.rows.map(r => r.key));
  const dK = draftOf(dir);
  const keep = (d) => JSON.stringify(d.cards.map(c => [c.k, c.note]));
  check(inTitles(dK, rx("kurier", true)) === 0 && inBodies(dK, rx("kurier", true)) === 0 && inTitles(dK, rx("przewoźnik", true)) === 3
        && swap.did.places === 17 && keep(dK) === keep(d0) && noted > 0,
    "bk1j replacing `kurier` reaches the titles too (3) and the bodies and the facts, and leaves every card's keywords and notes exactly as they were ("
    + noted + " cards carry a note): " + swap.did.places + " places");
  await S.undoBulk(dir);
  check(same(bytes(dir), before0), "bk1k CONTROL: one undo puts the titles and bodies back byte for byte");

  /* ---- 2. REPLACE, AND TAKING IT BACK -------------------------------------------------------- */

  const before = bytes(dir);
  const all = f18.rows.map(r => r.key);
  const spared = rows18[0];
  const some = await S.replacePlaces(dir, { find: "18 zł", replace: "19 zł" }, all.filter(k => k !== spared.key));
  let d1 = draftOf(dir);
  check(some.did.places === 8 - spared.places.length && inBodies(d1, rx("18 zł", true)) + inFacts(d1, rx("18 zł", true)) === spared.places.length,
    "bk2a unticking one row leaves exactly that row's places: " + spared.places.length + " left of 8");
  check(d1.cards.find(c => c.id === spared.id).body.pl.includes("18 zł")
        && JSON.stringify(d1.cards.filter(c => !f18.rows.some(r => r.key === c.id)))
           === JSON.stringify(d0.cards.filter(c => !f18.rows.some(r => r.key === c.id))),
    "bk2b the unticked card and every card with no place are untouched");
  const back1 = await S.undoBulk(dir);
  check(same(bytes(dir), before) && back1.undone === true,
    "bk2c one undo puts the draft back byte for byte");
  const full = await S.replacePlaces(dir, { find: "18 zł", replace: "19 zł" }, all);
  d1 = draftOf(dir);
  check(inBodies(d1, rx("18 zł", true)) + inFacts(d1, rx("18 zł", true)) === 0
        && inBodies(d1, rx("19 zł", true)) + inFacts(d1, rx("19 zł", true)) === 8 && full.did.places === 8
        && full.did.cards === 3 && full.draft.facts === d1.facts,
    "bk2d all ticked: 0 of `18 zł` and 8 of `19 zł` in the draft, three cards and the facts, and the answer carries the draft");
  check(d1.hash !== d0.hash && d1.cards.length === 248, "bk2e the catalog's hash moved and no card was lost");
  await S.undoBulk(dir);
  check(same(bytes(dir), before), "bk2f the undo of the whole replacement is byte for byte too");
  /* C09 row 1: the answer says whether the quick facts were among the places, so the undo bar can say where they were */
  const cardsOnly = await S.replacePlaces(dir, { find: "18 zł", replace: "19 zł" }, all.filter(k => rows18.some(r => r.key === k)));
  check(full.did.facts === true && cardsOnly.did.facts === false && cardsOnly.did.cards === 3 && cardsOnly.did.places === 6,
    "bk2k a replace says whether the quick facts were among its places: " + full.did.facts + " with them, " + cardsOnly.did.facts
    + " with the three cards alone (" + cardsOnly.did.places + " places)");
  await S.undoBulk(dir);
  check(same(bytes(dir), before), "bk2l CONTROL: the cards-only replacement is taken back byte for byte too");
  const gone = await refusal(S.undoBulk(dir));
  check(!!gone && /no longer remembers this change/.test(gone.message), "bk2g CONTROL: a second undo has nothing to take back, and says so");
  await S.replacePlaces(dir, { find: "18 zł", replace: "19 zł" }, all);
  await S.saveCard(dir, spared.id, { k: "something typed after" });
  const afterEdit = bytes(dir);
  const late = await refusal(S.undoBulk(dir));
  check(!!late && same(bytes(dir), afterEdit),
    "bk2h CONTROL: an undo after another change is refused and the draft is left as it is");
  /* restore the baseline for the sections below */
  fs.writeFileSync(draftAt(dir), before);
  const lit = await S.replacePlaces(dir, { find: "18 zł", replace: "$& ($1) zł" }, all);
  d1 = draftOf(dir);
  check(inBodies(d1, /\$& \(\$1\) zł/g) === 6 && lit.did.places === 8,
    "bk2i the replacement is literal: `$&` and `$1` are written as typed");
  fs.writeFileSync(draftAt(dir), before);
  const nothing = await S.replacePlaces(dir, { find: "18 zł", replace: "x" }, []);
  check(nothing.refused === "no places" && same(bytes(dir), before),
    "bk2j nothing ticked writes nothing");

  /* ---- 3. SEVERAL CARDS AT ONCE -------------------------------------------------------------- */

  const ids3 = d0.cards.slice(10, 13).map(c => c.id);
  const ret = await S.retireCards(dir, ids3);
  d1 = draftOf(dir);
  check(ret.did.cards === 3 && d1.cards.filter(c => c.retired === true).length === 3
        && ids3.every(id => d1.cards.find(c => c.id === id).retired === true),
    "bk3a retiring 3 ticked cards puts 3 flags in the draft: " + d1.cards.filter(c => c.retired).length);
  await S.undoBulk(dir);
  check(same(bytes(dir), before) && draftOf(dir).cards.every(c => !c.retired),
    "bk3b one undo takes all 3 flags off, byte for byte");
  /* W3e: an act that changes nothing writes nothing and says so, as the replace that finds no place does */
  await S.retireCards(dir, ids3);
  const retiredBytes = bytes(dir);
  const again = await S.retireCards(dir, ids3);
  check(again.refused === "no changes" && same(bytes(dir), retiredBytes) && again.did === undefined,
    "bk3h retiring cards that are all retired already writes nothing and answers refused, never a count of 0: " + JSON.stringify(again.refused));
  const mixed = await S.retireCards(dir, [ids3[0], d0.cards[20].id]);
  check(mixed.did && mixed.did.cards === 1 && draftOf(dir).cards.find(c => c.id === d0.cards[20].id).retired === true,
    "bk3i CONTROL: a list with one retired card and one not still retires the one, and counts one: " + JSON.stringify(mixed.did));
  fs.writeFileSync(draftAt(dir), before);
  const target = d0.tags.filter(t => t.kind === "shelf").find(t => t.id !== d0.cards[10].shelf).id;
  const mv = await S.moveCards(dir, ids3, target);
  d1 = draftOf(dir);
  check(mv.did.cards === ids3.filter(id => d0.cards.find(c => c.id === id).shelf !== target).length
        && ids3.every(id => d1.cards.find(c => c.id === id).shelf === target),
    "bk3c moving to a category files every ticked card there and no other: " + mv.did.cards + " moved");
  const mvBytes = bytes(dir);
  const mvAgain = await S.moveCards(dir, ids3, target);
  check(mvAgain.refused === "no changes" && same(bytes(dir), mvBytes) && mvAgain.did === undefined,
    "bk3j moving cards to the category they are all in already writes nothing and answers refused: " + JSON.stringify(mvAgain.refused));
  await S.undoBulk(dir);
  check(same(bytes(dir), before), "bk3k CONTROL: the undo is still the first move's, byte for byte, after the refused one");
  const noShelf = await refusal(S.moveCards(dir, ids3, "t-nowhere"));
  check(!!noShelf && same(bytes(dir), before), "bk3d CONTROL: a category the catalog lacks is refused and nothing is written");
  const del = await S.deleteCards(dir, ids3);
  d1 = draftOf(dir);
  check(del.did.cards === 3 && d1.cards.length === 245 && ids3.every(id => !d1.cards.some(c => c.id === id)),
    "bk3e deleting 3 ticked cards takes exactly those: " + d1.cards.length + " left");
  await S.undoBulk(dir);
  check(same(bytes(dir), before) && draftOf(dir).cards.map(c => c.id).join() === d0.cards.map(c => c.id).join(),
    "bk3f one undo puts all 3 back, at their places, byte for byte");
  const miss = await refusal(S.retireCards(dir, [ids3[0], "c-not-a-card"]));
  check(!!miss && same(bytes(dir), before) && /c-not-a-card/.test(miss.message),
    "bk3g CONTROL: a list holding a card that is not there is refused whole, naming it, with nothing written");

  /* ---- 4. A NEW CARD'S ID IS RANDOM ---------------------------------------------------------- */

  const RANDOM = /^c-[0-9a-f]{32}$/;
  const shelf = d0.cards[0].shelf;
  const title = "Delivery, how much it costs and when it arrives";
  const add1 = await S.addCard(dir, shelf, title, "Body.");
  const add2 = await S.addCard(dir, shelf, title, "Body.");
  const dup = await S.duplicateCard(dir, d0.cards[3].id);
  check(RANDOM.test(add1.card.id) && RANDOM.test(add2.card.id) && add1.card.id !== add2.card.id && RANDOM.test(dup.card.id),
    "bk4a a card made on the screen and a duplicate each get a random id of the shape c- and 32 hex: " + add1.card.id);
  check(!/deliver|how-much/.test(add1.card.id) && !dup.card.id.includes(d0.cards[3].id.slice(2, 12)),
    "bk4b the id does not contain its title's slug, the original's id, or any word");
  fs.writeFileSync(draftAt(dir), before);
  const F = await (await import("../src/engine.mjs")).format();
  check(F.cardId(title) !== add1.card.id && d0.cards.every(c => F.idOk(c.id)),
    "bk4c CONTROL: the title's own slug (the pinned format's cardId) is a different string, and the sample's old ids are still ids of the format");

  /* ---- 5. THE SHEET ROUND TRIP --------------------------------------------------------------- */

  const out = path.join(SCRATCH, "sheet");
  const ex = await S.exportCards(dir, null, out);
  const macros = path.join(out, "macros.csv");
  const grid = csvRows(fs.readFileSync(macros, "utf8"), ",");
  const head = grid[0];
  check(ex.cards === 248 && head[0] === "id" && grid.length === 249 && ex.files.length === 3 && ex.files.every(f => fs.existsSync(f)),
    "bk5a the export is three files, `id` first, a row for each of the 248 cards: " + head.slice(0, 3).join(","));
  const noEdit = await S.sheetPlan(dir, macros);
  check(noEdit.counts.changed === 0 && noEdit.counts.added === 0 && noEdit.counts.missing === 0
        && noEdit.counts.unchanged === 248 && noEdit.same === true && noEdit.diff.rows.length === 0,
    "bk5b export then import with no edit: 0 changes, " + JSON.stringify(noEdit.counts));
  const col0 = (n) => grid[0].indexOf(n);
  const crlf = path.join(out, "crlf.csv");
  fs.writeFileSync(crlf, fs.readFileSync(macros, "utf8").replace(/\r?\n/g, "\r\n"));
  const planCrlf = await S.sheetPlan(dir, crlf);
  check(planCrlf.counts.changed === 0 && planCrlf.counts.unchanged === 248 && planCrlf.same,
    "bk5b2 the same sheet saved with Windows line ends, inside its cells too, is still 0 changes: " + JSON.stringify(planCrlf.counts));
  const under = grid.map(r => r.slice());
  under[3][0] = under[3][0].replace(/-/g, "_");
  const underFile = path.join(out, "under.csv");
  fs.writeFileSync(underFile, csvOf(under));
  const planUnder = await S.sheetPlan(dir, underFile);
  check(planUnder.counts.added === 0 && planUnder.counts.unchanged === 248 && planUnder.counts.missing === 0,
    "bk5b3 a sheet that spells an id with underscores still matches its card, as the importer has always read them: " + JSON.stringify(planUnder.counts));
  check(noEdit.notRead === true && planCrlf.notRead === true,
    "bk5b4 a sheet with an intents or a role column is said not to be read for them: " + noEdit.notRead);
  const slim = path.join(out, "slim.csv");
  fs.writeFileSync(slim, csvOf(grid.map((r, i) => [r[col0("id")], r[col0("category")], r[col0("title_en")], r[col0("body_en")], r[col0("title_pl")], r[col0("body_pl")]])));
  const planSlim = await S.sheetPlan(dir, slim);
  check(planSlim.notRead === false && planSlim.counts.unchanged === 248,
    "bk5b5 CONTROL: a sheet with neither column is not said to be: " + planSlim.notRead + ", " + JSON.stringify(planSlim.counts));
  const land0 = await S.sheetLand(dir, macros, noEdit.fingerprint);
  check(land0.refused === "no changes" && same(bytes(dir), before), "bk5c landing a sheet with no changes writes nothing");

  const col = (name) => head.indexOf(name);
  const edit = grid.map(r => r.slice());
  const retitled = edit[5][0], rebodied = edit[9][0], dropped = edit[20][0];
  edit[5][col("title_en")] = "A title written in the spreadsheet";
  edit[9][col("body_pl")] = edit[9][col("body_pl")] + " Dziękujemy za cierpliwość.";
  const fresh = new Array(head.length).fill("");
  fresh[col("category")] = edit[2][col("category")];
  fresh[col("title_en")] = "Brand new row"; fresh[col("body_en")] = "Added in the sheet.";
  fresh[col("title_pl")] = "Całkiem nowy wiersz"; fresh[col("body_pl")] = "Dodane w arkuszu.";
  edit.push(fresh);
  edit.splice(20, 1);
  const edited = path.join(out, "edited.csv");
  fs.writeFileSync(edited, csvOf(edit));
  const plan = await S.sheetPlan(dir, edited);
  check(plan.counts.changed === 2 && plan.counts.added === 1 && plan.counts.unchanged === 245 && plan.counts.missing === 1,
    "bk5d the edited sheet: 2 changed, 1 new, 1 missing from the sheet, 245 unchanged: " + JSON.stringify(plan.counts));
  const lines = plan.diff.rows.map(r => r.what);
  check(lines.some(l => l === "changed card " + retitled + " title.en") && lines.some(l => l === "changed card " + rebodied + " body.pl")
        && lines.length === 2 && plan.diff.rows.every(r => r.was !== null && r.becomes !== null),
    "bk5e the Archive's three columns show exactly the two changes, the retitled card by its own id: " + lines.join(" | "));
  check(plan.added.length === 1 && RANDOM.test(plan.added[0].id) && plan.added[0].title === "Brand new row" && plan.added[0].row === 249,
    "bk5f the row with no id is a new card with a random id, and the plan names its row: " + plan.added[0].id + " row " + plan.added[0].row);
  check(plan.missing.length === 1 && plan.missing[0].id === dropped, "bk5g the card the sheet lacks is named as missing: " + plan.missing[0].id);
  check(same(bytes(dir), before), "bk5h planning writes nothing");
  const land = await S.sheetLand(dir, edited, plan.fingerprint);
  d1 = draftOf(dir);
  const was = (id) => d0.cards.find(c => c.id === id), now = (id) => d1.cards.find(c => c.id === id);
  check(now(retitled).title.en === "A title written in the spreadsheet" && now(retitled).id === retitled
        && now(rebodied).body.pl === was(rebodied).body.pl + " Dziękujemy za cierpliwość.",
    "bk5i landed: the retitled card is itself, with its id, and the body carries the added sentence");
  check(!!now(dropped) && JSON.stringify(now(dropped)) === JSON.stringify(was(dropped)) && d1.cards.length === 249,
    "bk5j landed: the missing card is left exactly as it was, and there are 249 cards");
  const born = d1.cards[d1.cards.length - 1];
  check(RANDOM.test(born.id) && born.shelf === edit[2][col("category")].replace(/^/, "t-") && born.bodyShape === "plain"
        && d1.cards.map(c => c.id).filter(id => was(id)).join() === d0.cards.map(c => c.id).join(),
    "bk5k landed: the new card is last, in the category the sheet named, and every old id is where it was");
  check(land.did.kind === "sheet" && land.did.cards === 3 && land.draft.cards.length === 249,
    "bk5l it is one change, said in the answer: " + JSON.stringify(land.did));
  await S.undoBulk(dir);
  check(same(bytes(dir), before), "bk5m one undo puts the whole sheet back, byte for byte");

  /* a row with an id the draft does not know, a repeat, a missing title, an undeclared language, a blank cell and a move */
  const odd = grid.map(r => r.slice());
  const keepId = "c-from-another-catalog";
  const rowWith = (id, over) => { const r = new Array(head.length).fill(""); r[0] = id; Object.entries(over).forEach(([k, v]) => { r[col(k)] = v; }); return r; };
  const cat = edit[2][col("category")];
  odd.push(rowWith(keepId, { category: cat, title_en: "Known elsewhere", body_en: "Kept id.", title_pl: "Znane gdzie indziej", body_pl: "Zachowane id." }));
  odd.push(rowWith(odd[3][0], { category: cat, title_en: "Same id again" }));
  odd.push(rowWith("", { category: cat, body_en: "No title at all." }));
  odd.push(rowWith("", { title_en: "No category", body_en: "x", title_pl: "Bez kategorii", body_pl: "x" }));
  odd[4][col("body_en")] = "";
  const otherShelf = d0.tags.filter(t => t.kind === "shelf").find(t => t.id !== d0.cards[5].shelf).id;
  odd[6][col("category")] = otherShelf.replace(/^t-/, "");
  const oddFile = path.join(out, "odd.csv");
  fs.writeFileSync(oddFile, csvOf(odd));
  const op = await S.sheetPlan(dir, oddFile);
  check(op.counts.added === 1 && op.added[0].id === keepId,
    "bk5n a row whose id is unknown to the catalog is a new card and keeps the id it wrote: " + (op.added[0] || {}).id);
  const kinds = op.notes.map(n => n.kind + "@" + n.row).sort().join();
  check(kinds === ["category@" + (odd.length + 0), "title@" + (odd.length - 1), "twice@" + (odd.length - 2)].sort().join(),
    "bk5o a repeated id, a row with no title and a new row with no category are skipped with their rows named: " + kinds);
  check(op.counts.changed === 1 && op.diff.rows.some(r => r.what === "moved card " + odd[6][0]),
    "bk5p a category changed in the sheet moves the card, and a blank cell takes nothing away: " + op.counts.changed + " changed");
  const dBlank = (await S.sheetLand(dir, oddFile, op.fingerprint)).draft;
  check(dBlank.cards.find(c => c.id === odd[4][0]).body.en === d0.cards.find(c => c.id === odd[4][0]).body.en,
    "bk5q a cell left blank in the sheet leaves the card's text alone");
  fs.writeFileSync(draftAt(dir), before);
  const wide = grid.map((r, i) => r.concat(i === 0 ? ["body_de"] : [i === 3 ? "Deutsch" : ""]));
  const wideFile = path.join(out, "wide.csv");
  fs.writeFileSync(wideFile, csvOf(wide));
  const wp = await S.sheetPlan(dir, wideFile);
  check(wp.skippedLangs.join() === "de" && wp.counts.changed === 0, "bk5r a language the catalog does not declare is named and changes nothing: " + wp.skippedLangs);
  const bare = grid.map(r => r.slice(1));
  const bareFile = path.join(out, "bare.csv");
  fs.writeFileSync(bareFile, csvOf(bare));
  const nb = await refusal(S.sheetPlan(dir, bareFile));
  check(!!nb && /matched to cards by an id column/.test(nb.message) && same(bytes(dir), before),
    "bk5s CONTROL: a sheet with no id column is refused, because every row would look new");

  /* ---- 5b. THE SHEET THAT LANDS IS THE ONE THAT WAS SHOWN (the test architect's P5 and P6) ------------------ */

  const shaOf = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
  const shown = await S.sheetPlan(dir, edited);
  check(shown.fingerprint === shaOf(edited) + ":" + d0.hash || shown.fingerprint === shaOf(edited) + ":" + draftOf(dir).hash,
    "bk5v the plan carries a fingerprint, the sha256 of the sheet's bytes and the draft's hash, made here by a line of this test's own: "
    + String(shown.fingerprint).slice(0, 24) + "...");
  await S.saveCard(dir, d0.cards[100].id, { k: "typed after the plan" });
  const afterSave = bytes(dir);
  const p5 = await refusal(S.sheetLand(dir, edited, shown.fingerprint));
  check(!!p5 && /^the catalog has changed/.test(p5.message) && same(bytes(dir), afterSave),
    "bk5w P5: a card saved after the plan, and the sheet is refused, saying the catalog changed; the card's edit is still there and nothing was written: " + (p5 && p5.message));
  fs.writeFileSync(draftAt(dir), before);
  const shown2 = await S.sheetPlan(dir, edited);
  const edit2 = edit.slice(0, 1).concat(edit.slice(31));
  edit2[3][col("title_en")] = "One more edit made after the plan";
  const edited0 = fs.readFileSync(edited);
  fs.writeFileSync(edited, csvOf(edit2));
  const p6 = await refusal(S.sheetLand(dir, edited, shown2.fingerprint));
  check(!!p6 && /^the sheet has changed/.test(p6.message) && same(bytes(dir), before),
    "bk5x P6: the sheet saved again after the plan (one more edit, 30 rows gone), and it is refused, saying the sheet changed, with nothing written: " + (p6 && p6.message));
  fs.writeFileSync(edited, edited0);
  const noFp = await refusal(S.sheetLand(dir, edited));
  check(!!noFp && same(bytes(dir), before),
    "bk5y CONTROL: a land with no fingerprint at all is refused too, so leaving it out is no way round: " + (noFp && noFp.message));

  /* THE SHEET'S FILE NAME CANNOT REFUSE IT: the importer takes a catalog id from the name, and a two-character name is no id */
  const shortNames = [];
  for (const name of ["ab.csv", "1.csv", "Арк.csv"]) {
    const at = path.join(out, name);
    fs.copyFileSync(edited, at);
    const r = await refusal(S.sheetPlan(dir, at));
    const pl = r ? null : await S.sheetPlan(dir, at);
    shortNames.push(name + ":" + (r ? "REFUSED" : JSON.stringify(pl.counts)));
  }
  const want = JSON.stringify({ changed: 2, added: 1, unchanged: 245, missing: 1 });
  check(shortNames.every(n => n.endsWith(":" + want)),
    "bk5z a sheet named ab.csv, 1.csv or Арк.csv is read like edited.csv (2 changed, 1 new, 245 unchanged, 1 missing): " + shortNames.join(" "));

  /* ---- 5c. CLAUSES THE OTHER LEGS LEFT TO CHANCE (the test architect's M2 to M5) -------------------------- */

  /* M2: a blank category cell on an existing card leaves its category; the importer would file it under the first shelf */
  const m2 = grid.map(r => r.slice());
  const firstCat = m2[1][col("category")];
  const moved = m2.findIndex((r, i) => i > 1 && r[col("category")] !== firstCat);
  m2[moved][col("category")] = "";
  const m2f = path.join(out, "blank-category.csv");
  fs.writeFileSync(m2f, csvOf(m2));
  const m2p = await S.sheetPlan(dir, m2f);
  check(m2p.counts.changed === 0 && m2p.diff.rows.length === 0 && m2p.counts.unchanged === 248 && m2p.counts.added === 0,
    "bk5aa M2: a card whose category cell is blank in the sheet keeps its category (row " + (moved + 1) + " is not under the first shelf): " + JSON.stringify(m2p.counts));

  /* M3 and the rest of a new category: made once, labelled by the sheet's key, for a moved card and a new row alike */
  const m3 = grid.map(r => r.slice());
  m3[moved][col("category")] = "brand-new-key";
  const row3 = new Array(head.length).fill("");
  row3[col("category")] = "brand-new-key"; row3[col("title_en")] = "In the new category"; row3[col("body_en")] = "Body."; row3[col("title_pl")] = "W nowej kategorii"; row3[col("body_pl")] = "Treść.";
  m3.push(row3);
  const m3f = path.join(out, "new-category.csv");
  fs.writeFileSync(m3f, csvOf(m3));
  const m3p = await S.sheetPlan(dir, m3f);
  check(m3p.diff.rows.some(r => /^added +shelf t-brand-new-key/.test(r.what)),
    "bk5ab M3: a category the catalog lacks is shown as an added category in the table: " + m3p.diff.rows.map(r => r.what).join(" | "));
  const m3d = (await S.sheetLand(dir, m3f, m3p.fingerprint)).draft;
  const newShelves = m3d.tags.filter(t => t.kind === "shelf" && t.id === "t-brand-new-key");
  check(newShelves.length === 1 && newShelves[0].label.en === "brand-new-key" && m3d.cards.find(c => c.id === m2[moved][0]).shelf === "t-brand-new-key"
        && m3d.cards[m3d.cards.length - 1].shelf === "t-brand-new-key" && m3d.tags.length === d0.tags.length + 1,
    "bk5ac M3: the category is made once, labelled by the sheet's key, the moved card and the new row both stand in it, and no other tag appeared");
  await S.undoBulk(dir);
  check(same(bytes(dir), before), "bk5ad and one undo takes the new category away with the rest, byte for byte");

  /* M4 and M5: keywords and notes from the sheet are applied, to a card that exists and to a new row */
  const m4 = grid.map(r => r.slice());
  m4[7][col("keywords")] = "words typed in the sheet";
  m4[7][col("note_en")] = "A note typed in the sheet";
  const row4 = new Array(head.length).fill("");
  row4[col("category")] = m4[2][col("category")]; row4[col("title_en")] = "With extras"; row4[col("body_en")] = "Body."; row4[col("title_pl")] = "Z dodatkami"; row4[col("body_pl")] = "Treść.";
  row4[col("keywords")] = "kw of the new row"; row4[col("note_pl")] = "Notatka nowego wiersza";
  m4.push(row4);
  const m4f = path.join(out, "keywords-notes.csv");
  fs.writeFileSync(m4f, csvOf(m4));
  const m4p = await S.sheetPlan(dir, m4f);
  check(m4p.counts.changed === 1 && m4p.counts.added === 1 && m4p.diff.rows.length === 2 && m4p.diff.rows.some(r => r.what === "changed card " + m4[7][0] + " k") && m4p.diff.rows.some(r => r.what.startsWith("changed card " + m4[7][0] + " note")),
    "bk5ae M4 and M5: the plan shows the keywords and the note typed in the sheet as changes of that card: " + m4p.diff.rows.map(r => r.what).join(" | "));
  const m4d = (await S.sheetLand(dir, m4f, m4p.fingerprint)).draft;
  const c7 = m4d.cards.find(c => c.id === m4[7][0]), cn = m4d.cards[m4d.cards.length - 1];
  check(c7.k === "words typed in the sheet" && c7.note.en === "A note typed in the sheet" && cn.k === "kw of the new row" && cn.note.pl === "Notatka nowego wiersza",
    "bk5af M4 and M5: landed, the card carries the keywords and the note, and so does the new row's card");
  fs.writeFileSync(draftAt(dir), before);

  /* M6: bodyShape preserved on an edited card, and inferred from markers on a new card */
  await S.saveCard(dir, m4[7][0], { replies: { shape: "steps", blocks: [{ text: { en: "A step." }, label: {} }] } });
  const m6 = grid.map(r => r.slice());
  m6[7][col("body_en")] = ""; m6[7][col("body_pl")] = "";
  m6[7][col("note_en")] = "A note on the steps card.";
  m6[8][col("body_en")] = "[step]\nFirst step\n\n[step]\nSecond step";
  m6[8][col("body_pl")] = "[step]\nKrok pierwszy\n\n[step]\nKrok drugi";
  const row6 = new Array(head.length).fill("");
  row6[col("category")] = m6[2][col("category")]; row6[col("title_en")] = "New shaped card";
  row6[col("body_en")] = "[step]\nFirst step\n\n[step]\nSecond step";
  row6[col("title_pl")] = "Nowa karta"; row6[col("body_pl")] = "[step]\nKrok pierwszy\n\n[step]\nKrok drugi";
  m6.push(row6);
  const m6f = path.join(out, "shaped-cards.csv");
  fs.writeFileSync(m6f, csvOf(m6));
  const m6p = await S.sheetPlan(dir, m6f);
  const m6d = (await S.sheetLand(dir, m6f, m6p.fingerprint)).draft;
  const c7m = m6d.cards.find(c => c.id === m4[7][0]), c8m = m6d.cards.find(c => c.id === m4[8][0]), cnm = m6d.cards[m6d.cards.length - 1];
  check(c8m.bodyShape === "steps" && c7m.bodyShape === "steps" && cnm.bodyShape === "steps",
    "bk5ag M6: a body changed into steps becomes steps, an unchanged body keeps the card's shape, and a new card takes the shape its body implies: " + c8m.bodyShape + ", " + c7m.bodyShape + ", " + cnm.bodyShape);
  await S.undoBulk(dir);

  /* ---- 6. EXPORTING THE TICKED CARDS --------------------------------------------------------- */

  const pick = [d0.cards[40].id, d0.cards[7].id, d0.cards[200].id];
  const part = path.join(SCRATCH, "part");
  const px = await S.exportCards(dir, pick, part);
  const pg = csvRows(fs.readFileSync(path.join(part, "macros.csv"), "utf8"), ",");
  check(px.cards === 3 && pg.length === 4 && pg.slice(1).map(r => r[0]).join() === [d0.cards[7].id, d0.cards[40].id, d0.cards[200].id].join()
        && pg[0][0] === "id",
    "bk6a the ticked cards alone, in the draft's order, `id` first: " + pg.slice(1).map(r => r[0]).join(","));
  const catsAll = csvRows(fs.readFileSync(path.join(part, "categories.csv"), "utf8"), ",").length;
  check(catsAll === d0.tags.filter(t => t.kind === "shelf").length + 1, "bk6b the categories file is whole either way: " + catsAll + " lines");
  const unk = await refusal(S.exportCards(dir, ["c-not-a-card"], part));
  check(!!unk, "bk6c CONTROL: a card that is not there is refused");
  const back = await importCsv({ file: path.join(part, "macros.csv") });
  check(back.catalog.cards.map(c => c.id).sort().join() === pick.slice().sort().join(),
    "bk6d the importer reads the partial export back with the same three ids");
  const idless = path.join(SCRATCH, "idless.csv");
  fs.writeFileSync(idless, csvOf([["title_en", "body_en", "category"], ["Hello there", "Body", "general"]]));
  const old = await importCsv({ file: idless });
  const minted = await importCsv({ file: idless, mintId: () => "c-" + "a".repeat(32) });
  check(old.catalog.cards[0].id === "c-general-hello-there" && minted.catalog.cards[0].id === "c-" + "a".repeat(32),
    "bk6e CONTROL: the importer still mints from the title where no mint is handed it (the command line, the wizard): " + old.catalog.cards[0].id);

  process.stdout.write("\nbulk  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  if (asserted !== EXPECTED) {
    process.stderr.write("bulk  expected " + EXPECTED + " assertions, ran " + asserted + "\n");
    failed++;
  }
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "bulk");
  else process.stdout.write("bulk  kept " + SCRATCH + "\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("bulk  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
