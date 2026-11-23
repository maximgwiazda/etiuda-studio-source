/* THE INTENTS AND THE CATEGORIES, EDITED ON THE SCREEN, AGAINST THE SAME CATALOG BUILT BY HAND.
 *
 *     node tests/tags-screen.mjs [--keep]
 *
 * THE ORACLE IS A SECOND IMPLEMENTATION, not src/studio.mjs's opinion of itself. The five acts
 * the screen performs - add, rename, reorder, delete, and the delete that is refused - are
 * applied a second time in this file, to the same starting catalog, by hand: the id comes from
 * the PINNED format's own `tagId`, the hash from its own `contentHash`, and the file is written
 * by the one JSON writer this repository has. The claim is then byte equality between the two
 * files, which is the same claim tests/import-screen.mjs and tests/review-screen.mjs hold their
 * screens to. A leg that called the module the screen calls and compared the answers would be
 * asserting that a function equals itself.
 *
 * THE SECOND ORACLE IS THE PINNED ENGINE'S OWN READER. Byte equality with a hand-built file says
 * the two agree; it does not say either is a catalog a desk would load. So the edited draft goes
 * through the pinned `loadCatalog` and `lintCatalog`, and the ORDER is read back out of the
 * runtime shape the engine maps it into - because the runtime links an intent by POSITION, so
 * "moved one place up on the screen" is only true if the engine's own arrays say so.
 *
 * THE ID IS THE THING MOST WORTH MEASURING HERE. A rename that moved the id would be invisible
 * on the screen and catastrophic on a desk: every card's link and every desk's personal layer is
 * keyed by it (engine item 340). So the id is read before and after the rename, and it is also
 * held against `tagId` of the ORIGINAL name rather than merely against itself, which is what
 * says it was minted once from the name it was made with.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { openStudio } from "./shell-door.mjs";
import * as Engine from "../src/engine.mjs";
import { json, PROJECT_FILE, DRAFT_FILE } from "../src/publish.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { pressWhen, settleOn } from "./press.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "tags-screen");
const ID = "tagscreen-catalog";
const NAME = "Tags, EN and PL";

/* The names the acts use. Invented words, so that nothing in this file can collide with a word
   the interface itself paints and be read as agreement when it is a coincidence. */
const NEW_INTENT = "Ondrave plasule";
const RENAMED_EN = "Ondrave plasib";
const RENAMED_PL = "Widuma tosork";
const THROWAWAY = "Sarnesk kelbun";

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sha = p => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex").slice(0, 16);

/* ---- the catalog both sides start from -------------------------------------------------------
 *
 * Built here rather than imported from a CSV so that every link in it is known to this file:
 * three intents, two categories, four cards, and the cards point at the tags in a pattern the
 * assertions below name one by one. Both languages on every card, because the pinned lint
 * demands Polish on a card whatever the catalog's langs say. */
function startingCatalog(F) {
  const shelves = ["Greeting", "Refunds"].map(n =>
    ({ id: F.tagId(n), kind: "shelf", label: { en: n, pl: n + " PL" } }));
  const requests = ["Asked twice", "Baggage", "Cancelled"].map(n =>
    ({ id: F.tagId(n), kind: "request", clause: { en: n, pl: n + " PL" } }));
  const cards = [
    { id: "c-one", shelf: shelves[0].id, requests: [requests[0].id] },
    { id: "c-two", shelf: shelves[0].id, requests: [requests[0].id, requests[1].id] },
    { id: "c-three", shelf: shelves[1].id, requests: [requests[2].id] },
    { id: "c-four", shelf: shelves[1].id },
  ].map((c, i) => Object.assign(c, {
    bodyShape: "plain",
    title: { en: "Card " + (i + 1), pl: "Karta " + (i + 1) },
    body: { en: "Widuma tosork sarnesk plasib " + (i + 1) + ".",
            pl: "Widuma tosork sarnesk plasib " + (i + 1) + "." },
  }));
  const cat = {
    format: F.FORMAT, kind: F.KIND, id: ID, name: NAME, rev: 0,
    langs: [{ code: "en", label: "EN" }, { code: "pl", label: "PL" }],
    commentLang: "en", tags: shelves.concat(requests), cards, minEngine: "2.0.0",
  };
  cat.hash = F.contentHash(cat);
  return cat;
}

function plant(root, folder, catalog) {
  const dir = path.join(root, folder);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, DRAFT_FILE), json(catalog), "utf8");
  fs.writeFileSync(path.join(dir, PROJECT_FILE),
    json({ id: catalog.id, name: catalog.name, rev: 0, edition: "", draft: DRAFT_FILE,
           folder: null }), "utf8");
  return dir;
}

/* ---- the same five acts, by hand -------------------------------------------------------------
 *
 * The second implementation. It knows nothing of src/studio.mjs: it appends a tag whose id is
 * the pinned format's slug of the name it was made with, sets the two clause languages, swaps
 * the last two request SLOTS of the tags array (which is the file's own order and therefore the
 * runtime's), adds and removes a throwaway so that its absence is proved rather than assumed,
 * and rehashes with the engine's own function.
 */
function byHand(F, start) {
  const cat = JSON.parse(JSON.stringify(start));
  const id = F.tagId(NEW_INTENT);
  cat.tags.push({ id, kind: "request", clause: { en: RENAMED_EN, pl: RENAMED_PL } });
  /* The throwaway is added and deleted, so the hand-built file simply never carries it. That is
     what the screen's half has to end up agreeing with. */
  const slots = cat.tags.map((t, i) => (t.kind === "request" ? i : -1)).filter(i => i >= 0);
  const a = slots[slots.length - 1], b = slots[slots.length - 2];
  const keep = cat.tags[a]; cat.tags[a] = cat.tags[b]; cat.tags[b] = keep;
  delete cat.hash; delete cat.sig;
  cat.hash = F.contentHash(cat);
  return cat;
}

/* COUNTS:PREDICATES
   Members that must be there, in order where the order is the claim.
   One more member still passes. A missing member is named. A floor stays
   where a scanner that saw nothing would otherwise pass. */
function missingMembers(seen, required, ordered) {
  const have = (seen || []).map(s => String(s));
  if (!ordered) return required.filter(name => have.indexOf(String(name)) < 0);
  let from = 0;
  const missing = [];
  for (const name of required) {
    const at = have.indexOf(String(name), from);
    if (at < 0) missing.push(name);
    else from = at + 1;
  }
  return missing;
}

/* MOVED AT BOARD 1018, PIECES C AND A (not run by the builder: this is a window leg). Was: the Intents table's heads before
   Cards are the shown languages alone, ["English"]. Now an intent's row holds its name (the topic), its clause and its
   comment action, a field each per shown language, so the heads before Cards are those three for English. */
const TAG_HEADS = ["Name (English)", "Cards"];
const TAG_LANGS = ["Name (English)", "Clause (English)", "Comment action (English)"];
function tagHeadsHeld(heads) {
  const list = (heads || []).map(s => String(s));
  const missing = missingMembers(list, TAG_HEADS, true);
  const cardsAt = list.indexOf("Cards");
  const before = (cardsAt < 0 ? list : list.slice(0, cardsAt)).filter(s => s !== "");
  if (before.length !== TAG_LANGS.length || before.some((s, i) => s !== TAG_LANGS[i])) {
    before.forEach(s => { if (TAG_LANGS.indexOf(s) < 0) missing.push(s); });
    TAG_LANGS.forEach(s => { if (before.indexOf(s) < 0) missing.push(s); });
  }
  if (list.length < TAG_HEADS.length) missing.push("columns under " + TAG_HEADS.length);
  return { ok: missing.length === 0, missing };
}
/* COUNTS:END */

async function main(argv) {
  const keep = argv.indexOf("--keep") >= 0;
  clearScratch(SCRATCH);
  const projects = path.join(SCRATCH, "projects");
  fs.mkdirSync(projects, { recursive: true });
  const F = await Engine.format();
  const start = startingCatalog(F);
  const dir = plant(projects, ID, start);
  const draftAt = path.join(dir, DRAFT_FILE);
  const before = fs.readFileSync(draftAt);

  const studio = await openStudio("tests/tags-screen.mjs", { words: true,
    projects, userDataDir: path.join(SCRATCH, "ud"),
  });

  let idAfterRename = "", refusal = null, refusedCards = [], catRefusal = "";
  let jumped = null, orderOnScreen = [];
  try {
    const page = studio.page;
    const press = async (sel, ms) => {
      await pressWhen(page, sel, { who: "tests/tags-screen.mjs" });
      await sleep(ms || 350);
    };
    const type = async (sel, v) => {
      await page.evaluate((s, value) => {
        const e = document.querySelector(s);
        if (!e) throw new Error("nothing at " + s);
        e.value = value; e.dispatchEvent(new Event("input", { bubbles: true }));
      }, sel, v);
      await sleep(150);
    };
    const state = async (js) => JSON.parse(await page.evaluate("JSON.stringify(" + js + ")"));

    /* From the Library (board 982 E, 2026-11-11): Overview shows a catalog only once it has been opened, so a planted one is
       opened from there. */
    await press('#rail [data-act="home"][data-v="library"]', 400);
    await press('[data-act="open"][data-dir="' + dir.replace(/\\/g, "\\\\") + '"]', 900);
    await press('[data-act="section"][data-v="intents"]', 500);
    await settleOn(page, '(window.STUDIO_READY || {}).screen === "intents"', { bound: 30000 });

    const first = await state(`{
      rows: document.querySelectorAll("#main tbody tr, #main table tr").length,
      heads: Array.from(document.querySelectorAll("#main th")).map(e => e.textContent),
      fields: Array.from(document.querySelectorAll("#main input[data-tag]")).map(e => e.value),
      h1: (document.querySelector("#main h1") || {}).textContent || "",
      add: (document.querySelector('[data-act="tag-new"]') || {}).textContent || "",
    }`);
    check(first.h1 === "Intents" && first.add === "New intent"
      && first.fields.join("|") === "Asked twice|Baggage|Cancelled",
      "1a the Intents section lists the three intents as fields, under the rail's own word: "
      + JSON.stringify(first.fields));
    const heads1 = tagHeadsHeld(first.heads);
    check(heads1.ok,
      /* Was: "1b one column per shown language, the count of cards beside it". */
      "1b the name, the clause and the comment action per shown language, the count of cards beside them"
      + (heads1.missing.length ? ", missing " + heads1.missing.join(", ") : "")
      + ": " + JSON.stringify(first.heads));

    /* ---- the delete that is refused ---------------------------------------------------------- */
    const usedId = F.tagId("Asked twice");
    await press('[data-act="tag-del"][data-id="' + usedId + '"]', 600);
    await settleOn(page, '((document.querySelector("#main .dashed") || {}).textContent || "").trim() !== ""', { bound: 30000 });
    const refused = await state(`{
      note: (document.querySelector("#main .dashed") || {}).textContent || "",
      cards: Array.from(document.querySelectorAll("#main .pane:last-of-type .t-title")).map(e => e.textContent),
      jumps: document.querySelectorAll('[data-act="jump"]').length,
      fields: Array.from(document.querySelectorAll("#main input[data-tag]")).map(e => e.value),
    }`);
    refusal = refused.note; refusedCards = refused.cards;
    check(refused.fields.length === 3 && Buffer.compare(before, fs.readFileSync(draftAt)) === 0,
      "2a an intent two cards point at is not deleted, and the draft on disk is byte for byte"
      + " what it was before the press");
    check(refused.cards.join("|") === "Card 1|Card 2" && refused.jumps === 2,
      "2b the two cards that point at it are named, each with the lint list's own Jump: "
      + JSON.stringify(refused.cards));

    await press('[data-act="jump"]', 600);
    await settleOn(page, '(window.STUDIO_READY || {}).screen === "cards"', { bound: 30000 });
    jumped = await state(`{ screen: window.STUDIO_READY.screen,
      title: (document.querySelector("#main .pane h3.t") || {}).textContent || "" }`);
    await press('[data-act="section"][data-v="intents"]', 500);

    /* ---- add, rename in both languages, move ------------------------------------------------- */
    await press('[data-act="tag-new"]', 450);
    /* A refused name stays in its field to be corrected (sense pass item 14). */
    await type("#newTag", "?");
    await press('[data-act="do-tag-new"]', 600);
    await settleOn(page, '((document.querySelector("#dlg .kv .n") || {}).textContent || "").length > 0', { bound: 30000 });
    const kept = await state(`{ v: (document.querySelector("#newTag") || {}).value,
      said: (document.querySelector("#dlg .kv .n") || {}).textContent || "" }`);
    check(kept.v === "?" && kept.said.length > 0,
      "3z a refused name is still in its field beside the refusal: " + JSON.stringify(kept));
    await type("#newTag", NEW_INTENT);
    await press('[data-act="do-tag-new"]', 800);
    await settleOn(page, 'document.querySelectorAll("#main input[data-tag]").length === 4', { bound: 30000 });
    const added = await state(`{
      fields: Array.from(document.querySelectorAll("#main input[data-tag]")).map(e => e.value),
      ids: Array.from(document.querySelectorAll("#main input[data-tag]")).map(e => e.getAttribute("data-tag")),
      rail: (document.querySelector('#rail a[data-v="intents"] .num') || {}).textContent || "",
      cover: !document.querySelector("#scrim").hidden,
    }`);
    idAfterRename = added.ids[added.ids.length - 1];
    check(!added.cover && added.fields.length === 4 && added.rail === "4",
      "3a the new intent lands at the foot of the list and the rail's count follows it (rail "
      + added.rail + ")");
    check(added.ids[3] === F.tagId(NEW_INTENT),
      "3b with the id the pinned format's own tagId gives its name: " + added.ids[3]);

    await press('[data-act="lang"][data-v="both"]', 450);
    await type('input[data-tag="' + added.ids[3] + '"][data-l="en"]', RENAMED_EN);
    await sleep(700);
    await type('input[data-tag="' + added.ids[3] + '"][data-l="pl"]', RENAMED_PL);
    await sleep(900);
    const renamed = await state(`{
      ids: Array.from(document.querySelectorAll('#main input[data-tag][data-l="en"]')).map(e => e.getAttribute("data-tag")),
      en: (document.querySelector('input[data-tag="${added.ids[3]}"][data-l="en"]') || {}).value || "",
      pl: (document.querySelector('input[data-tag="${added.ids[3]}"][data-l="pl"]') || {}).value || "",
    }`);
    check(renamed.en === RENAMED_EN && renamed.pl === RENAMED_PL
      && renamed.ids[3] === F.tagId(NEW_INTENT),
      "3c renamed in both languages and the id is still the one minted from the name it was"
      + " made with, " + JSON.stringify(F.tagId(NEW_INTENT)) + ", not "
      + JSON.stringify(F.tagId(RENAMED_EN)));

    /* BOARD 479: THE ARROWS KEEP THEIR GLYPH AND GAIN THEIR WORD WHERE A GLYPH'S WORD GOES.
       Read off every row rather than off the first, because the buttons are built per row and a
       word put on one of them would be a word on one of them. The claim a person can check is
       what the eye sees: a button showing a drawing and no text, which answers with a word when
       it is hovered and to a screen reader. */
    const arrows = await state(`Array.from(document.querySelectorAll('#main [data-act="tag-up"],'
      + ' #main [data-act="tag-down"]')).map(b => ({ act: b.getAttribute("data-act"),
        title: b.title, label: b.getAttribute("aria-label"),
        word: b.textContent.trim(), svg: b.querySelectorAll("svg").length }))`);
    const wrongArrow = arrows.find(b => b.word !== "" || b.svg !== 1
      || b.title !== (b.act === "tag-up" ? "Move up" : "Move down")
      || b.label !== b.title);
    check(arrows.length === 8 && !wrongArrow,
      "3d1 all " + arrows.length + " reorder arrows show one drawing and no word, and each"
      + " answers with its own - Move up or Move down - as its tooltip and its accessible name"
      + (wrongArrow ? ": " + JSON.stringify(wrongArrow) : ""));

    await press('[data-act="tag-up"][data-id="' + added.ids[3] + '"]', 700);
    await settleOn(page, 'Array.from(document.querySelectorAll(\'#main input[data-tag][data-l="en"]\')).map(e => e.value).indexOf(' + JSON.stringify(RENAMED_EN) + ') === 2', { bound: 30000 });
    orderOnScreen = (await state(`Array.from(document.querySelectorAll('#main input[data-tag][data-l="en"]')).map(e => e.value)`));
    check(orderOnScreen.join("|") === "Asked twice|Baggage|" + RENAMED_EN + "|Cancelled",
      "3d one press of the up arrow moves it one place among the intents: "
      + JSON.stringify(orderOnScreen));

    /* ---- one added and deleted, so that delete is proved rather than assumed ------------------ */
    await press('[data-act="tag-new"]', 450);
    await type("#newTag", THROWAWAY);
    await press('[data-act="do-tag-new"]', 800);
    await settleOn(page, 'document.querySelectorAll(\'#main input[data-tag][data-l="en"]\').length === 5', { bound: 30000 });
    const five = await state(`document.querySelectorAll('#main input[data-tag][data-l="en"]').length`);
    await press('[data-act="tag-del"][data-id="' + F.tagId(THROWAWAY) + '"]', 800);
    await settleOn(page, 'document.querySelectorAll(\'#main input[data-tag][data-l="en"]\').length === 4', { bound: 30000 });
    const four = await state(`{
      n: document.querySelectorAll('#main input[data-tag][data-l="en"]').length,
      rail: (document.querySelector('#rail a[data-v="intents"] .num') || {}).textContent || "",
    }`);
    check(five === 5 && four.n === 4 && four.rail === "4",
      "3e an intent nothing points at is deleted on the press (" + five + " intents, then "
      + four.n + ", rail " + four.rail + ")");

    /* ---- the categories, and the engine's own sentence ---------------------------------------- */
    await press('[data-act="section"][data-v="categories"]', 500);
    await press('[data-act="tag-del"][data-id="' + F.tagId("Greeting") + '"]', 700);
    await settleOn(page, '((document.querySelector("#main .dashed") || {}).textContent || "").trim() !== ""', { bound: 30000 });
    const cat = await state(`{
      note: (document.querySelector("#main .dashed") || {}).textContent || "",
      cards: Array.from(document.querySelectorAll("#main .pane:last-of-type .t-title")).map(e => e.textContent),
      h1: (document.querySelector("#main h1") || {}).textContent || "",
      add: (document.querySelector('[data-act="tag-new"]') || {}).textContent || "",
    }`);
    catRefusal = cat.note;
    check(cat.h1 === "Categories" && cat.add === "New category"
      && cat.cards.join("|") === "Card 1|Card 2",
      "4a a category two cards sit in is refused the same way, and names them: "
      + JSON.stringify(cat.cards));
    check(/Move or delete cards in this category first/.test(cat.note),
      "4b in the engine's own sentence for that refusal: " + JSON.stringify(cat.note));
  } finally {
    await studio.shut();
  }
  await sleep(400);

  /* ---- the two files ---------------------------------------------------------------------- */

  const want = path.join(SCRATCH, "by-hand.json");
  fs.writeFileSync(want, json(byHand(F, start)), "utf8");
  const a = sha(want), b = sha(draftAt);
  check(a === b, "5a the draft the screen wrote and the catalog built by hand from the pinned"
    + " format are the same file, sha256 " + a + " against " + b);

  const onDisk = JSON.parse(fs.readFileSync(draftAt, "utf8"));
  const bare = Object.assign({}, onDisk); delete bare.hash; delete bare.sig;
  check(onDisk.hash === F.contentHash(bare),
    "5b carrying the engine's own content hash over what it holds (" + onDisk.hash + ")");
  check(!(onDisk.tags || []).some(t => t.id === F.tagId(THROWAWAY)),
    "5c and no trace of the intent that was added and deleted again");

  /* ---- the pinned engine reads it, and the ORDER is the engine's own ------------------------- */

  const { loadCatalog, lintCatalog } = Engine.lint();
  let read = null, err = null;
  try { read = loadCatalog(draftAt); } catch (e) { err = e; }
  check(!!read && !err, "6a the pinned engine's own loadCatalog reads the edited draft"
    + (err ? ": " + err.message : ""));
  const l = lintCatalog(read);
  check(l.errors.length === 0 && l.warnings.length === 0,
    "6b and its lint is silent on it: " + l.errors.length + " error(s), "
    + l.warnings.length + " warning(s)"
    + (l.errors.length ? " " + JSON.stringify(l.errors) : "")
    + (l.warnings.length ? " " + JSON.stringify(l.warnings) : ""));

  /* THE RUNTIME LINKS AN INTENT BY POSITION, so this is the assertion that says the arrow moved
     anything at all: the engine's own mapping of the file, not the file's own order. */
  check(read.intents.en.join("|") === "Asked twice|Baggage|" + RENAMED_EN + "|Cancelled",
    "6c the engine maps the file to intents in the order the screen shows them: "
    + JSON.stringify(read.intents.en));
  check(read.intents.pl[2] === RENAMED_PL && read.intentIds[2] === F.tagId(NEW_INTENT),
    "6d with the Polish clause and the original id index-aligned beside it ("
    + read.intentIds[2] + ")");
  /* A card links by index in the runtime shape, so a move that had not carried the links with it
     would show here as a card pointing at the wrong intent. */
  const two = read.cards.find(c => c.id === "c-two");
  check(two.intents.join(",") === "0,1",
    "6e and the card that points at the first two intents still points at those two ("
    + JSON.stringify(two.intents) + ")");

  /* ---- what the refusals said --------------------------------------------------------------- */

  /* THE BRACKETED PLURAL IS GONE SINCE BOARD 523: a count in a refusal is a counted noun, in
     English as on a screen, because Polish cannot write "2 karta(y)" at all. */
  check(/Asked twice is on 2 cards\./.test(refusal),
    "7a the intent refusal names the tag and the number of cards: " + JSON.stringify(refusal));
  check(refusedCards.length === 2 && jumped && jumped.screen === "cards"
    && jumped.title === "Card 1",
    "7b and Jump goes from the refusal to the first of those cards, opened in the editor (screen "
    + (jumped && jumped.screen) + ", " + JSON.stringify(jumped && jumped.title) + ")");
  check(catRefusal.indexOf("Greeting is on 2 cards.") === 0,
    "7c the category refusal is the same shape: " + JSON.stringify(catRefusal));

  if (!keep) dropScratch(SCRATCH, "tags-screen");
  process.stdout.write("tags-screen  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("tags-screen  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
