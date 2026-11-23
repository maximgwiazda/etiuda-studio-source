/* A CARD MADE, COPIED AND TAKEN AWAY ON THE SCREEN, AGAINST THE SAME CATALOG BUILT BY HAND.
 *
 *     node tests/cards-screen.mjs [--keep]
 *
 * THE ORACLE IS A SECOND IMPLEMENTATION, not src/studio.mjs's opinion of itself. The acts the
 * screen performs are applied a second time in this file, to the same starting catalog, by
 * hand: the ids come from the PINNED format's own `cardId`, the hash from its own
 * `contentHash`, and the file is written by the one JSON writer this repository has. The claim
 * is then byte equality between the two files, which is what tests/tags-screen.mjs and
 * tests/import-screen.mjs hold their screens to. A leg that called the module the screen calls
 * and compared the answers would be asserting that a function equals itself.
 *
 * THE SECOND ORACLE IS THE PINNED ENGINE'S OWN READER. Byte equality with a hand-built file
 * says the two agree; it does not say either is a catalog a desk would load. So the edited
 * draft goes through the pinned `loadCatalog` and `lintCatalog` at the end, and the card the
 * screen made is found in the runtime shape, in the category it was made in.
 *
 * A CARD THE INTENTS REACH IS DELETED LIKE ANY OTHER (Maxim, 2026-09-22), and the intents it
 * named stay in the catalog: the link lives on the card, so nothing is left dangling.
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
const SCRATCH = path.join(ROOT, "scratch", "cards-screen");
const ID = "cardscreen-catalog";
const NAME = "Cards, EN and PL";

/* Invented words, so that nothing in this file can collide with a word the interface paints and
   be read as agreement when it is a coincidence. */
const NEW_TITLE = "Ondrave plasule";
const NEW_PL = "Widuma tosork";
const NEW_BODY_EN = "Sarnesk kelbun ondrave.";
const NEW_BODY_PL = "Sarnesk kelbun widuma.";

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
 * Two categories, two intents, three cards, and exactly one of the cards carries intent links -
 * which is the card the duplicate is made from, so that the copy carries them too and the
 * delete of the copy is a delete of a linked card. Both languages on every card, because the pinned lint
 * demands Polish on a card whatever the catalog's langs say. */
function startingCatalog(F) {
  const shelves = ["Greeting", "Refunds"].map(n =>
    ({ id: F.tagId(n), kind: "shelf", label: { en: n, pl: n + " PL" } }));
  const requests = ["Asked twice", "Baggage"].map(n =>
    ({ id: F.tagId(n), kind: "request", clause: { en: n, pl: n + " PL" } }));
  const cards = [
    { id: "c-one", shelf: shelves[0].id },
    { id: "c-two", shelf: shelves[0].id, requests: [requests[0].id, requests[1].id] },
    { id: "c-three", shelf: shelves[1].id },
  ].map((c, i) => Object.assign(c, {
    title: { en: "Card " + (i + 1), pl: "Karta " + (i + 1) },
    body: { en: "Widuma tosork sarnesk plasib " + (i + 1) + ".",
            pl: "Widuma tosork sarnesk plasib " + (i + 1) + "." },
    bodyShape: "plain",
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

/* ---- the same acts, by hand ------------------------------------------------------------------
 *
 * The second implementation. It knows nothing of src/studio.mjs: it appends a card whose id is
 * the one the screen made (random since C09, so it is read off the screen and not derived), in the second category, fills its
 * two languages in the order the screen's own patch fills them, and rehashes with the engine's
 * own function. The duplicate is added and deleted again, so the hand-built file simply never
 * carries it - which is what the screen's half has to end up agreeing with.
 *
 * THE KEY ORDER IS THE SCREEN'S and it is worth one line of explanation: a card is made with
 * its title, then its body is written by a later save, so `body` lands after `bodyShape` rather
 * than before it as the importer writes one. The content hash is over the canonical form, whose
 * keys are sorted, so nothing about the catalog depends on this - but the bytes do, and the
 * bytes are what is being compared.
 */
function byHand(F, start, id) {
  const cat = JSON.parse(JSON.stringify(start));
  const shelf = cat.tags.filter(t => t.kind === "shelf")[1].id;
  const card = { id, shelf };
  card.title = { en: NEW_TITLE };
  card.bodyShape = "plain";
  card.title = Object.assign({}, card.title, { pl: NEW_PL });
  card.body = { en: NEW_BODY_EN, pl: NEW_BODY_PL };
  cat.cards.push(card);
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

const CARD_IDS = ["c-one", "c-two", "c-three"];
const CARD_ACTS = ["Duplicate", "Retire", "Delete card"];
const FILTER_WORDS = ["Active", "Retired", "All"];
function filterHeld(view) {
  const labels = ((view || {}).labels || []).map(s => String(s));
  const missing = [];
  if (view && view.inHead) missing.push("filter in the heading");
  if (labels.length !== 0) labels.forEach(l => missing.push(l));
  FILTER_WORDS.forEach(w => { if (labels.some(l => l.indexOf(w) >= 0)) missing.push("filter word " + w); });
  return { ok: missing.length === 0, missing };
}
function cardsAtRestHeld(s) {
  const missing = missingMembers(s.ids, CARD_IDS, true);
  if (!s.head) missing.push("heading row");
  if ((s.rows || 0) < CARD_IDS.length + 1) missing.push("rows under " + (CARD_IDS.length + 1));
  if ((s.acts || []).length !== 0) (s.acts || []).forEach(a => missing.push("act present " + a));
  const filt = filterHeld(s.view);
  return { ok: missing.length === 0 && filt.ok, missing: missing.concat(filt.missing) };
}
const CORNER_ACTS = ["key-backup", "disc-review", "card-new"];
function cornerDiscsHeld(corner) {
  const acts = (corner || []).map(d => d.act);
  const missing = missingMembers(acts, CORNER_ACTS, true);
  (corner || []).filter(d => d.act !== "card-new").forEach(d => {
    if (d.vis !== "hidden") missing.push(d.act + " visible");
    if (d.tab !== -1) missing.push(d.act + " tab " + d.tab);
  });
  const neu = (corner || []).find(d => d.act === "card-new");
  if (neu && neu.vis !== "visible") missing.push("card-new not visible");
  if (acts.length < CORNER_ACTS.length) missing.push("discs under " + CORNER_ACTS.length);
  return { ok: missing.length === 0, missing };
}
function cardActsHeld(acts) {
  const missing = missingMembers(acts, CARD_ACTS, true);
  if ((acts || []).length < CARD_ACTS.length) missing.push("acts under " + CARD_ACTS.length);
  return { ok: missing.length === 0, missing };
}
function cardsLandedHeld(s, newId) {
  const need = CARD_IDS.concat([newId]);
  const missing = missingMembers(s.ids, need, false);
  if (!s.head) missing.push("heading row");
  if ((s.rows || 0) < need.length + 1) missing.push("rows under " + (need.length + 1));
  return { ok: missing.length === 0, missing };
}
function cardsFitHeld(u) {
  const names = (u.actNames || []).map(s => String(s).trim());
  const missing = missingMembers(names, CARD_ACTS, true);
  const rights = u.acts || [];
  if (rights.length !== names.length) missing.push("edges " + rights.length + " names " + names.length);
  rights.forEach((x, i) => { if (!(x <= u.edge)) missing.push((names[i] || ("act " + i)) + " past the corner"); });
  if ((u.taken || []).length !== 0) missing.push("covered " + (u.taken || []).join(", "));
  if ((u.discs || 0) < 1) missing.push("no disc");
  if (names.length < CARD_ACTS.length) missing.push("acts under " + CARD_ACTS.length);
  return { ok: missing.length === 0, missing };
}
function cardsGoneActsHeld(s) {
  const missing = [];
  if ((s.acts || []).length !== 0) (s.acts || []).forEach(a => missing.push("act present " + a));
  const filt = filterHeld(s.view);
  return { ok: missing.length === 0 && filt.ok, missing: missing.concat(filt.missing) };
}
const NEW_CARD_HEADS = ["Card", "Category", "Text"];
function newCardHeadsHeld(heads) {
  const missing = missingMembers(heads, NEW_CARD_HEADS, true);
  if ((heads || []).length < NEW_CARD_HEADS.length) missing.push("rows under " + NEW_CARD_HEADS.length);
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

  const studio = await openStudio("tests/cards-screen.mjs", {
    projects, userDataDir: path.join(SCRATCH, "ud"),
  });

  let made = null, dup = null, gone = null, lintAfterDup = 0, newId = "", dupId = "";
  const RANDOM = /^c-[0-9a-f]{32}$/;
  try {
    const page = studio.page;
    const press = async (sel, ms) => {
      await pressWhen(page, sel, { who: "tests/cards-screen.mjs" });
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

    await press('[data-act="open"][data-dir="' + dir.replace(/\\/g, "\\\\") + '"]', 900);
    await settleOn(page, 'document.querySelectorAll("#main table tr").length > 0', { bound: 30000 });

    /* THE CORNER, READ AS IT IS PAINTED (board 616). The edge and its ink are read off
       getComputedStyle rather than off a class, because A3 is a claim about 1px of border and
       a class says only that this file and that one agree about a word. The mark's own ink is
       measured the same way, off a scratch element, so nothing here writes a colour down. */
    const CORNER = `Array.from(document.querySelectorAll("#discs .disc")).map(e => ({
      act: e.getAttribute("data-act"), live: e.classList.contains("live"),
      vis: getComputedStyle(e).visibility, tab: e.tabIndex,
      edge: getComputedStyle(e).borderTopStyle, ink: getComputedStyle(e).borderTopColor }))`;
    const MARK_INK = `(function () { const p = document.createElement("span");
      p.style.color = "var(--mark)"; document.body.appendChild(p);
      const v = getComputedStyle(p).color; p.remove(); return v; })()`;
    const newDisc = (s) => s.corner.find(d => d.act === "card-new") || {};
    /* THE THREE THINGS C07 PUT ON THIS SCREEN, read as painted. The filter sits in the Card column's heading
       since R2 (2026-10-06: Active, Retired, All, each with its count, the first one on) and is not there while
       no card is retired; the acts are the row under the table, which holds the picked card's three: Duplicate,
       Retire, Delete card, in that order. */
    const VIEW = `{
      labels: Array.from(document.querySelectorAll('#main .viewbar [data-act="card-view"]')).map(e => e.textContent),
      on: Array.from(document.querySelectorAll('#main .viewbar [data-act="card-view"].on')).map(e => e.textContent),
      inHead: !!document.querySelector("#main table tr:first-child th .viewbar") }`;
    const ACTS = `Array.from(document.querySelectorAll('#main .row2.acts [data-act^="card-"]')).map(e => e.textContent)`;
    /* The count follows its word after a no-break space, so that the two cannot be parted at a line end. */
    const viewIs = (v, a, r, n) => r === 0 ? filterHeld(v).ok
      : v.labels.join("|") === ["Active\u00a0" + a, "Retired\u00a0" + r, "All\u00a0" + n].join("|")
        && v.on.join("|") === "Active\u00a0" + a && v.inHead;

    const first = await state(`{
      rows: document.querySelectorAll("#main table tr").length,
      ids: Array.from(document.querySelectorAll("#main tr[data-id]")).map(e => e.getAttribute("data-id")),
      head: !!document.querySelector("#main table thead, #main table tr:first-child th"),
      acts: ${ACTS},
      view: ${VIEW},
      rail: (document.querySelector('#rail a[data-v="cards"] .num') || {}).textContent || "",
      corner: ${CORNER},
    }`);
    const rest = cardsAtRestHeld(first);
    check(rest.ok,
      "1a the cards table opens with the three cards under a heading, no filter while none is"
      + " retired, and none of the card acts under it with nothing picked"
      + (rest.missing.length ? ", missing " + rest.missing.join(", ") : "")
      + ": " + JSON.stringify(first.view)
      + " and " + JSON.stringify(first.acts));
    /* C1, THE ENGINE'S OWN ANSWER WHEN NOTHING WAITS (Maxim, 2026-09-20, against his designer's
       C2). This project has no inbox at all, so the two review discs must be gone the way
       .fab-clear is gone - out of sight AND out of the tab order - rather than merely dim. */
    const quiet = first.corner.filter(d => d.act !== "card-new");
    const discs1 = cornerDiscsHeld(first.corner);
    check(discs1.ok,
      "1a2 with nothing waiting the two review discs, and with no key the backup disc, are not there and take no focus"
      + (discs1.missing.length ? ", missing " + discs1.missing.join(", ") : "")
      + " (" + JSON.stringify(first.corner.filter(d => d.act !== "card-new").map(d => d.act + " " + d.vis + " tab" + d.tab))
      + "), and the New card disc is");
    check(!newDisc(first).live && newDisc(first).edge === "dashed",
      "1a3 and its edge is dashed with nothing open, which is the state A3's effect is read"
      + " against (" + newDisc(first).edge + ")");

    /* ---- one made ---------------------------------------------------------------------------- */
    await press('[data-act="card-new"]', 450);
    await settleOn(page, '!document.querySelector("#scrim").hidden && !!(document.querySelector("#dlg h2") || {}).textContent', { bound: 30000 });
    const cover = await state(`{
      cats: Array.from(document.querySelectorAll("#newCardCat option")).map(e => e.textContent),
      heads: Array.from(document.querySelectorAll("#dlg .kv .k")).map(e => e.textContent),
      h2: (document.querySelector("#dlg h2") || {}).textContent || "",
    }`);
    const heads1 = newCardHeadsHeld(cover.heads);
    check(cover.h2 === "New card" && heads1.ok
      && cover.cats.join("|") === "Greeting|Refunds",
      "1b the cover asks for the title, the category and the text, and offers the catalog's own"
      + " two categories"
      + (heads1.missing.length ? ", missing " + heads1.missing.join(", ") : "")
      + ": " + JSON.stringify(cover.cats));

    await type("#newCard", NEW_TITLE);
    await type("#newCardCat", F.tagId("Refunds"));
    await type("#newCardBody", NEW_BODY_EN);
    await press('[data-act="do-card-new"]', 900);
    await settleOn(page, 'document.querySelectorAll("#main tr[data-id]").length > 0', { bound: 30000 });
    made = await state(`{
      rows: document.querySelectorAll("#main table tr").length,
      ids: Array.from(document.querySelectorAll("#main tr[data-id]")).map(e => e.getAttribute("data-id")),
      head: !!document.querySelector("#main table thead, #main table tr:first-child th"),
      rail: (document.querySelector('#rail a[data-v="cards"] .num') || {}).textContent || "",
      lint: (document.querySelector('#rail a[data-v="lint"] .num') || {}).textContent || "",
      editor: ((document.querySelector("#main .pane h3.t") || {}).firstChild || {}).textContent || "",
      shelf: (document.querySelector('[data-f="shelf"]') || {}).value || "",
      id: (document.querySelector("#main tr.sel") || { getAttribute: () => "" }).getAttribute("data-id") || "",
      cover: !document.querySelector("#scrim").hidden,
      acts: ${ACTS},
      view: ${VIEW},
    }`);
    newId = made.id;
    const landed = cardsLandedHeld(made, newId);
    check(!made.cover && landed.ok && made.rail === "4" && made.editor === NEW_TITLE
      && made.shelf === F.tagId("Refunds") && RANDOM.test(newId),
      "1c the card lands in the chosen category with its editor open and the rail's count"
      + " following"
      + (landed.missing.length ? ", missing " + landed.missing.join(", ") : "")
      + " (rail " + made.rail + ", shelf " + made.shelf + ")");
    const acts1 = cardActsHeld(made.acts);
    check(acts1.ok && viewIs(made.view, 4, 0, 4),
      "1d and the acts about a card, Duplicate, Retire and Delete card in that order, appear now"
      + " that one is picked, still no filter with none retired"
      + (acts1.missing.length ? ", missing " + acts1.missing.join(", ") : "")
      + (filterHeld(made.view).missing.length ? ", " + filterHeld(made.view).missing.join(", ") : "")
      + ": " + JSON.stringify(made.acts) + " and " + JSON.stringify(made.view));
    /* BORN WITH ITS TEXT (sense pass item 25): no error, and the one row is the Polish it is
       awaiting, which a card born without a body used to silence. */
    const bornLint = Engine.lint().lintCatalog(JSON.parse(fs.readFileSync(draftAt, "utf8")));
    check(made.lint === "1" && bornLint.errors.length === 0
      && (bornLint.awaiting || []).some(a => /^pl: 1 card/.test(a)),
      "1e a card made with its text is no lint error, and the Polish it lacks is counted as"
      + " awaiting: rail " + made.lint + ", " + JSON.stringify({ errors: bornLint.errors,
        awaiting: bornLint.awaiting }));

    /* A3, THE FIRST DISC'S EFFECT, AND THE ONE PLACE IT FIRES (board 616). The card just made
       is open in the editor, which is what "in the authoring space" means on this screen: the
       dashed edge closes to a solid ring in the marker pen's own token and the glyph goes with
       it. The second half is the leg with the teeth - the SAME card is still the picked one on
       the Intents section and the effect has to be gone there, which is what fails if the
       state is read off S.sel alone. */
    const authoring = await state(`{ corner: ${CORNER}, mark: ${MARK_INK} }`);
    check(newDisc(authoring).live && newDisc(authoring).edge === "solid"
      && newDisc(authoring).ink === authoring.mark,
      "1f the disc's dashed edge closes while a card is open, in the token the marker pen uses"
      + " and not in a colour of its own: " + newDisc(authoring).edge + " "
      + newDisc(authoring).ink + " against --mark at " + authoring.mark);

    await press('[data-act="section"][data-v="intents"]', 500);
    await settleOn(page, '(window.STUDIO_READY || {}).screen === "intents"', { bound: 30000 });
    const elsewhere = await state(`{ corner: ${CORNER},
      picked: !!document.querySelector("#main table tr.sel") }`);
    check(!newDisc(elsewhere).live && newDisc(elsewhere).edge === "dashed",
      "1g and nowhere else: on the Intents section the same card is still the picked one and"
      + " the edge is open again (" + newDisc(elsewhere).edge + ")");
    await press('[data-act="section"][data-v="cards"]', 600);
    await settleOn(page, '(window.STUDIO_READY || {}).screen === "cards"', { bound: 30000 });
    const back = await state(`{ corner: ${CORNER},
      editor: ((document.querySelector("#main .pane h3.t") || {}).firstChild || {}).textContent || "" }`);
    check(back.editor === NEW_TITLE && newDisc(back).live,
      "1h and back on the cards section with the editor still on the card, the edge closes"
      + " again: " + JSON.stringify(back.editor));

    /* AND THE CORNER HAS TAKEN NOTHING ELSE'S PLACE. A control fixed over a screen can sit on
       top of a button, and this one did: with a card picked, the cards screen pins Duplicate
       and Delete card to the foot of the pad and `document.elementFromPoint` at the middle of
       Delete card answered a disc, until the sheet gave that row the corner's width
       (2026-09-21). THE RULE IS THE BROWSER'S OWN and not arithmetic written here: every
       interactive element is asked whether its own centre still answers itself. */
    const UNDER = `(function () {
      const discs = Array.from(document.querySelectorAll("#discs .disc"))
        .filter(e => getComputedStyle(e).visibility === "visible");
      const taken = [];
      document.querySelectorAll("button,a,input,select,textarea,[data-act]").forEach(e => {
        if (e.closest("#discs")) return;
        const r = e.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        if (at && at.closest("#discs")) taken.push((e.getAttribute("data-act") || e.tagName)
          + " " + (e.textContent || "").replace(/\s+/g, " ").trim().slice(0, 20));
      });
      return { taken: taken, discs: discs.length,
               actNames: Array.from(document.querySelectorAll("#main .row2.acts button"))
                 .map(e => (e.textContent || "").trim()),
               acts: Array.from(document.querySelectorAll("#main .row2.acts button"))
                 .map(e => Math.round(e.getBoundingClientRect().right)),
               edge: Math.round((document.querySelector("#discs")
                 || { getBoundingClientRect: () => ({ left: 0 }) }).getBoundingClientRect().left),
               vw: innerWidth };
    })()`;
    const under = await state(UNDER);
    /* THREE ACTS ARE WIDER THAN TWO, so the reading at the launch window, where they fit, is not
       the one that matters: the same question is asked again at Studio's own minimum, 900 by 560,
       through the same override setViewport uses and taken off again, since an override left on
       would move every click that follows. */
    const cdp = await page.createCDPSession();
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 900, height: 560, deviceScaleFactor: 1, mobile: false });
    await sleep(500);
    const tight = await state(UNDER);
    await cdp.send("Emulation.clearDeviceMetricsOverride");
    await cdp.detach();
    await sleep(500);
    const wide = cardsFitHeld(under), narrow = cardsFitHeld(tight);
    check(wide.ok && narrow.ok && tight.vw === 900,
      "1i and the corner has taken no control's place, at the launch window and at Studio's own 900 wide"
      + (wide.missing.length ? ", at the launch window missing " + wide.missing.join(", ") : "")
      + (narrow.missing.length ? ", at 900 missing " + narrow.missing.join(", ") : "")
      + ": with " + under.discs + " disc(s) over the screen every interactive element's centre still"
      + " answers itself " + JSON.stringify(under.taken) + " and " + JSON.stringify(tight.taken)
      + ", the card acts ending at " + JSON.stringify(under.acts) + " against the corner's left"
      + " edge at " + under.edge + " (" + under.vw + " wide), and at " + JSON.stringify(tight.acts)
      + " against " + tight.edge + " (" + tight.vw + " wide)");

    /* The two languages filled through the editor, so that what is compared at the end is a
       catalog a desk could load rather than a stub. */
    await press('[data-act="lang"][data-v="both"]', 450);
    await type('[data-f="title"][data-l="pl"]', NEW_PL);
    await type('[data-f="body"][data-l="en"]', NEW_BODY_EN);
    await type('[data-f="body"][data-l="pl"]', NEW_BODY_PL);
    await sleep(900);

    /* ---- one copied -------------------------------------------------------------------------- */
    await press('[data-act="pick"][data-id="c-two"]', 500);
    await press('[data-act="card-dup"]', 900);
    await settleOn(page, 'document.querySelectorAll("#main tr[data-id]").length > 4', { bound: 30000 });
    dup = await state(`{
      rows: Array.from(document.querySelectorAll("#main tr[data-id]")).map(e => e.getAttribute("data-id")),
      rail: (document.querySelector('#rail a[data-v="cards"] .num') || {}).textContent || "",
      lint: (document.querySelector('#rail a[data-v="lint"] .num') || {}).textContent || "",
      intents: Array.from(document.querySelectorAll('#intentChips .chip')).map(e => e.getAttribute("data-id")),
    }`);
    lintAfterDup = +dup.lint;
    dupId = dup.rows[2] || "";
    check(dup.rows.join("|") === "c-one|c-two|" + dupId + "|c-three|" + newId && RANDOM.test(dupId)
      && dup.rail === "5",
      "2a the copy lands directly under the card it was made from, with a random id of its own: "
      + JSON.stringify(dup.rows));
    check(dup.intents.length === 2 && dup.intents.every(Boolean) && dup.intents[0] !== dup.intents[1],
      "2b carrying the same two intent links: " + JSON.stringify(dup.intents));
    check(lintAfterDup >= 1,
      "2c and the lint says so - two cards sharing a category and a title is the pinned"
      + " linter's own duplicate (" + lintAfterDup + " finding(s))");

    /* ---- the linked copy, taken away in one press ------------------------------------------- */
    await press('[data-act="card-del"]', 900);
    await settleOn(page, 'document.querySelectorAll("#main tr[data-id]").length === 4', { bound: 30000 });
    gone = await state(`{
      rows: Array.from(document.querySelectorAll("#main tr[data-id]")).map(e => e.getAttribute("data-id")),
      rail: (document.querySelector('#rail a[data-v="cards"] .num') || {}).textContent || "",
      acts: ${ACTS},
      view: ${VIEW},
      note: (document.querySelector("#main .dashed") || {}).textContent || "",
      corner: ${CORNER},
    }`);
    const left = JSON.parse(fs.readFileSync(draftAt, "utf8"));
    check(gone.rows.join("|") === "c-one|c-two|c-three|" + newId
      && gone.rail === "4",
      "3a a card two intents reach goes in one press, and the rail follows: "
      + JSON.stringify(gone.rows));
    check(left.cards.every(c => c.id !== dupId)
      && left.tags.filter(t => t.kind === "request").length === 2
      && left.cards.find(c => c.id === "c-two").requests.length === 2,
      "3b the file agrees, and both intents stay in it, still on the card the copy was made from");
    const goneActs = cardsGoneActsHeld(gone);
    check(goneActs.ok && viewIs(gone.view, 4, 0, 4) && !gone.note && !newDisc(gone).live,
      "3d nothing is picked afterwards, so the acts about a card are gone with it, no filter with"
      + " none retired, the refusal is gone, and the corner's edge opens again"
      + (goneActs.missing.length ? ", missing " + goneActs.missing.join(", ") : "")
      + ": " + JSON.stringify(gone.acts) + " and " + JSON.stringify(gone.view));

    /* ---- a tab closes on the middle button (sense pass item 27) ----------------------------- */
    const tabs = () => state(`{
      tabs: Array.from(document.querySelectorAll("#tabs .tab")).map(e => e.getAttribute("data-act")),
      screen: !!document.querySelector('#tabs .tab.on[data-act="to-projects"]'),
    }`);
    const middle = async (sel) => {
      const box = JSON.parse(await page.evaluate(`JSON.stringify((function () {
        const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      })())`));
      await page.mouse.click(box.x, box.y, { button: "middle" });
      await sleep(700);
    };
    const open1 = await tabs();
    await middle('#tabs .tab[data-act="to-projects"]');
    const kept = await tabs();
    check(open1.tabs.filter(t => t === "to-project").length === 1
      && JSON.stringify(kept.tabs) === JSON.stringify(open1.tabs),
      "6a CONTROL: the middle button on the Projects tab closes nothing, it is not a project's: "
      + JSON.stringify(kept.tabs));
    await middle('#tabs .tab[data-act="to-project"]');
    const shut6 = await tabs();
    check(shut6.tabs.indexOf("to-project") < 0 && shut6.screen,
      "6b the middle button on the open project's tab closes it and returns to Projects: "
      + JSON.stringify(shut6));
  } finally {
    await studio.shut();
  }
  await sleep(400);

  /* ---- the two files ---------------------------------------------------------------------- */

  const want = path.join(SCRATCH, "by-hand.json");
  fs.writeFileSync(want, json(byHand(F, start, newId)), "utf8");
  const a = sha(want), b = sha(draftAt);
  check(a === b, "4a the draft the screen wrote and the catalog built by hand from the pinned"
    + " format are the same file, sha256 " + a + " against " + b);

  const onDisk = JSON.parse(fs.readFileSync(draftAt, "utf8"));
  const bare = Object.assign({}, onDisk); delete bare.hash; delete bare.sig;
  check(onDisk.hash === F.contentHash(bare),
    "4b carrying the engine's own content hash over what it holds (" + onDisk.hash + ")");
  check(!(onDisk.cards || []).some(c => c.id === dupId),
    "4c and no trace of the card that was copied and deleted again");

  /* ---- the pinned engine reads it ----------------------------------------------------------- */

  const { loadCatalog, lintCatalog } = Engine.lint();
  let read = null, err = null;
  try { read = loadCatalog(draftAt); } catch (e) { err = e; }
  check(!!read && !err, "5a the pinned engine's own loadCatalog reads the edited draft"
    + (err ? ": " + err.message : ""));
  const l = lintCatalog(read);
  check(l.errors.length === 0 && l.warnings.length === 0,
    "5b and its lint is silent on it: " + l.errors.length + " error(s), "
    + l.warnings.length + " warning(s)"
    + (l.errors.length ? " " + JSON.stringify(l.errors) : "")
    + (l.warnings.length ? " " + JSON.stringify(l.warnings) : ""));
  const born = read.cards.find(c => c.id === newId);
  check(!!born && born.c === F.tagId("Refunds") && born.t === NEW_TITLE
    && born.en === NEW_BODY_EN && born.pl === NEW_BODY_PL,
    "5c and the card made on the screen is in the runtime shape, in the category it was made"
    + " in, with both languages on it (" + (born && born.c) + ")");

  if (!keep) dropScratch(SCRATCH, "cards-screen");
  process.stdout.write("cards-screen  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("cards-screen  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
