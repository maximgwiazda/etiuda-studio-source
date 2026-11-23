/* NEW CARD, DUPLICATE AND DELETE ANSWER WITH THE ONE CARD, NOT THE CATALOG (board 808, studio-4).
 *
 *     node tests/card-verbs.mjs [--keep]
 *
 * Each of the three verbs used to hand back the draft's whole `cards` array, which crossed the
 * worker and then the window's bridge for a press that changes one row. The page now places the
 * card itself (ui/app.js, tookCard), so what this holds is the contract it places by: the
 * answer carries the card and no list, and the file's order after the verb is the order before
 * it with that one card appended, put straight after the card it was copied from, or taken out.
 * The order is read from the draft on disk, never from the answer.
 *
 * Section 5 is what a delete does to the links that name the card (board 834, step 11, S3a): they go
 * with it, Undo puts them back in order, and a card no one links to leaves every other card as it was.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DRAFT_FILE } from "../src/publish.mjs";
import * as Engine from "../src/engine.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "card-verbs");
const EXPECTED = 16;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

async function main(argv) {
  clearScratch(SCRATCH);
  const S = await import("../src/studio.mjs");
  const root = path.join(SCRATCH, "projects");
  fs.mkdirSync(root, { recursive: true });
  const made = await S.newProject(root, "Card verbs", [{ code: "en", name: "English" }]);
  const dir = made.dir;
  const t0 = await S.addTag(dir, "shelf", { en: "General" });
  const shelf = (t0.tag || t0).id;
  const order = () => JSON.parse(fs.readFileSync(path.join(dir, DRAFT_FILE), "utf8"))
    .cards.map(c => c.id);
  for (const w of ["Alpha", "Bravo", "Charlie", "Delta"])
    await S.addCard(dir, shelf, w, "The " + w.toLowerCase() + " answer, in full.");

  const before = order();
  const add = await S.addCard(dir, shelf, "Echo", "The echo answer, in full.");
  check(add.card && add.card.title.en === "Echo" && !("cards" in add),
    "1a New card answers with the card it made and no list of the catalog's cards: "
    + JSON.stringify(Object.keys(add).filter(k => k === "card" || k === "cards")));
  check(order().join(",") === before.concat([add.card.id]).join(","),
    "1b and the file holds it last: " + order().join(","));

  const was = order();
  const dup = await S.duplicateCard(dir, before[1]);
  check(dup.card && dup.card.id !== before[1] && dup.from === before[1] && !("cards" in dup),
    "2a Duplicate answers with the copy and the card it came from, and no list: "
    + JSON.stringify([dup.card && dup.card.id, dup.from, "cards" in dup]));
  const want = was.slice(); want.splice(was.indexOf(dup.from) + 1, 0, dup.card.id);
  check(order().join(",") === want.join(","),
    "2b and the file holds the copy straight after the card it came from: " + order().join(","));
  check(JSON.stringify(dup.card) !== "{}" && dup.card.body && dup.card.body.en
    === "The bravo answer, in full.",
    "2c the copy it answers with is the whole card, so the row it paints is the file's");

  const was2 = order();
  const del = await S.deleteCard(dir, before[2]);
  check(del.card && del.card.id === before[2] && del.deleted === true && !("cards" in del),
    "3a Delete card answers with the id it took out and no list: "
    + JSON.stringify([del.card, "cards" in del]));
  check(order().join(",") === was2.filter(id => id !== before[2]).join(","),
    "3b and the file is the order before it with that one card gone: " + order().join(","));

  /* THE CONTROL: what the page still needs besides the card travels as it did. */
  check(del.counts && del.lint && Array.isArray(del.awaiting) && Array.isArray(del.tags),
    "4a the counts, the lint, the awaiting state and the tags still come with every answer");

  /* ---- 5. THE LINKS THAT NAME A DELETED CARD (board 834, step 11, S3a) ---------------------------- */

  const F = await Engine.format();
  const file = () => path.join(dir, DRAFT_FILE);
  const bytes = () => fs.readFileSync(file());
  const draftNow = () => JSON.parse(bytes().toString("utf8"));
  const card = (d, id) => d.cards.find(c => c.id === id);
  const [A, B, C, D, E] = order().slice(0, 5);
  /* A -> [B, C] and E -> [C, D] are written by hand, and a verb then rewrites the file in Studio's own form, so the
     bytes compared below are bytes Studio wrote. */
  const d5 = draftNow();
  card(d5, A).next = [{ to: B }, { to: C }];
  card(d5, E).next = [{ to: C }, { to: D }];
  delete d5.hash; d5.hash = F.contentHash(d5);
  fs.writeFileSync(file(), JSON.stringify(d5, null, 1) + "\n");
  await S.retireCard(dir, D); await S.restoreCard(dir, D);
  const others = (d, ...ids) => JSON.stringify(d.cards.filter(c => !ids.includes(c.id)));

  const base = bytes();
  await S.deleteCard(dir, B);
  check(JSON.stringify(card(draftNow(), A).next) === JSON.stringify([{ to: C }]) && !card(draftNow(), B)
        && JSON.stringify(card(draftNow(), E).next) === JSON.stringify([{ to: C }, { to: D }]),
    "5a deleting a card drops the links to it from the cards that held them, and from no other: A holds "
    + JSON.stringify(card(draftNow(), A).next));
  await S.undoDelete(dir);
  check(Buffer.compare(bytes(), base) === 0 && JSON.stringify(card(draftNow(), A).next) === JSON.stringify([{ to: B }, { to: C }]),
    "5b Undo gives the links back in their order, the file byte for byte as it was before the delete");

  await S.deleteCards(dir, [B]);
  check(JSON.stringify(card(draftNow(), A).next) === JSON.stringify([{ to: C }]),
    "5c a bulk delete of one card drops the link to it too: A holds " + JSON.stringify(card(draftNow(), A).next));
  await S.undoBulk(dir);
  const bulk = await S.deleteCards(dir, [B, C]);
  const dBulk = draftNow();
  check(bulk.did.cards === 2 && !("next" in card(dBulk, A)) && JSON.stringify(card(dBulk, E).next) === JSON.stringify([{ to: D }]),
    "5d a bulk delete of B and C leaves A with no `next` key at all, not an empty list, and E with the one link still alive: "
    + JSON.stringify(Object.keys(card(dBulk, A))));
  await S.undoBulk(dir);
  check(Buffer.compare(bytes(), base) === 0,
    "5e Undo after the bulk delete puts the file back byte for byte");

  /* THE CONTROLS: a card no other card links to goes alone, and every other card keeps its bytes. */
  const lone = (await S.addCard(dir, shelf, "Foxtrot", "The foxtrot answer, in full.")).card.id;
  const withLone = bytes();
  await S.deleteCard(dir, lone);
  check(others(draftNow(), lone) === others(JSON.parse(withLone.toString("utf8")), lone),
    "5f CONTROL: deleting a card no one links to leaves every other card as it was, by its bytes");
  await S.undoDelete(dir);
  await S.deleteCards(dir, [lone]);
  check(others(draftNow(), lone) === others(JSON.parse(withLone.toString("utf8")), lone),
    "5g CONTROL: the same for a bulk delete");
  await S.undoBulk(dir);
  await S.deleteCards(dir, [A, B]);
  check(JSON.stringify(card(draftNow(), E).next) === JSON.stringify([{ to: C }, { to: D }]) && !card(draftNow(), A),
    "5h CONTROL: a bulk delete holding both a card and the card it linked to leaves a third card's links alone");
  await S.undoBulk(dir);

  process.stdout.write("\ncard-verbs  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  if (asserted !== EXPECTED) {
    process.stderr.write("card-verbs  expected " + EXPECTED + " assertions, ran " + asserted + "\n");
    failed++;
  }
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "card-verbs");
  else process.stdout.write("card-verbs  kept " + SCRATCH + "\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("card-verbs  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
