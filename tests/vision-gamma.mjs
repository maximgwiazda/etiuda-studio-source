/* Claudia γ's five vision ideas, as they paint and as they write (board 862): node tests/vision-gamma.mjs [--keep].
 * The page's own code runs on tests/page-stand-in.mjs against the real verbs and a real project, as tests/bulk-page.mjs
 * does: every leg reads markup, state and files, never layout, focus or motion. How the ideas look and move is Maxim's eye
 * on the preview. */
import "./licensed-env.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as S from "../src/studio.mjs";
import * as Engine from "../src/engine.mjs";
import { DRAFT_FILE, archivedCatalog, editionsIn } from "../src/publish.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { loadPage } from "./page-stand-in.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "vision-gamma");
const EXPECTED = 54;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const wire = (p) => Promise.resolve(p)
  .then(v => JSON.parse(JSON.stringify(Object.assign({ error: null }, v))))
  .catch(e => ({ error: e && e.message ? e.message : String(e), said: (e && e.said) || null, disk: !!(e && e.disk) }));
const bytes = (dir) => fs.readFileSync(path.join(dir, DRAFT_FILE));
const draftOf = (dir) => JSON.parse(bytes(dir).toString("utf8"));
const text = (html) => String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").replace(/&#39;/g, "'").trim();
const count = (html, needle) => String(html).split(needle).length - 1;
const el = (attrs) => ({ getAttribute: (k) => (attrs[k] == null ? null : attrs[k]), setAttribute() {}, classList: { toggle() {}, add() {}, remove() {} } });

const VERBS = ["moveCards", "undoBulk", "saveCard", "cardHistory", "findPlaces", "replacePlaces", "retireCards", "deleteCards",
  "dismissLikely", "commitCards", "dismissMany", "changesSince", "undoChange"];

async function main(argv) {
  clearScratch(SCRATCH);
  const root = path.join(SCRATCH, "projects");
  fs.mkdirSync(root, { recursive: true });
  const made = await S.newProject(root, "Vision gamma", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }]);
  const dir = made.dir;
  const shelf = {};
  for (const [k, en, pl] of [["del", "Delivery", "Dostawa"], ["ret", "Returns", "Zwroty"], ["ws", "Workshops", "Warsztaty"]])
    shelf[k] = (await S.addTag(dir, "shelf", { en, pl })).tag.id;
  const card = {};
  const LONG = "The parcel leaves the studio on the next working day and travels by courier. A refund goes back the way you paid.";
  for (const [k, sh, title, body] of [["a", "del", "Courier, what it costs", "Courier costs 18 zł in Poland."],
    ["b", "del", "Parcel on its way", LONG], ["c", "ret", "Return, one piece", "One piece can come back on its own."],
    ["d", "ret", "Refund, when it reaches you", "The refund leaves us within three days."]])
    card[k] = (await S.addCard(dir, shelf[sh], title, body)).card.id;

  const calls = [];
  const api = {};
  for (const k of VERBS) api[k] = (...a) => { calls.push(k); return wire(S[k](...a)); };
  const home = loadPage({ api, uiLang: "en" });
  const P = home.page;
  const open = await wire(S.openProject(dir));
  Object.assign(P.S, { open, screen: "project", section: "cards", lang: "en" });
  const mainHtml = () => home.node("#main").innerHTML;
  /* the stand-in answers every selector; the screens these legs paint hold no ".after" line */
  home.doc.absent = new Set(["#main .after, #dlg .after"]);

  /* ---- 1. SHELVES ------------------------------------------------------------------------------ */

  const cycle = [0, 1, 2, 6, 3, 7, 4];
  const looks = open.looks || {};
  check([shelf.del, shelf.ret, shelf.ws].every((id, i) => looks[id] && looks[id].hue === cycle[i] && /<path|<rect|<circle/.test(looks[id].icon)),
    "g1a the open carries each category's dress as a desk deals it, by its place among the shelves: hues "
    + JSON.stringify([shelf.del, shelf.ret, shelf.ws].map(id => looks[id] && looks[id].hue)));
  const L = Engine.catLooks();
  check(L.lookOf({ id: "t-x", hue: 6, icon: "gift" }, 0, "Delivery").hue === 6 && L.lookOf({ id: "t-x", hue: 5 }, 0, "Delivery").hue === 0
        && L.lookOf({ id: "t-x" }, 0, "Refunds") .icon === L.lookOf({ id: "t-y" }, 3, "Money back").icon,
    "g1b CONTROL: a hue the catalog declares is kept, a retired one is dealt again, and the drawing follows the name's hint");

  P.paintChrome();
  const chrome = home.node("#chrome").innerHTML;
  check(/data-act="cards-as" data-v="table"/.test(chrome) && /aria-label="View"/.test(chrome)
        && /role="radio" aria-checked="true"[^>]*data-act="cards-as" data-v="table"/.test(chrome) && /data-v="shelves" tabindex="0">Shelves</.test(chrome),
    "g1c the cards' chrome offers Table and Shelves, Table chosen: " + text(chrome).slice(0, 120));
  P.S.section = "lint"; P.paintChrome();
  check(!/data-act="cards-as"/.test(home.node("#chrome").innerHTML), "g1d CONTROL: the Lint list's chrome does not");
  P.S.section = "cards";

  P.ACTS["cards-as"](el({ "data-v": "shelves" }));
  const sh = mainHtml();
  const order = [...sh.matchAll(/<section class="shelf[^"]*" data-shelf="([^"]+)" data-ec="(\d)"/g)].map(m => [m[1], +m[2]]);
  check(P.S.cardsAs === "shelves" && JSON.stringify(order.map(x => x[0])) === JSON.stringify([shelf.del, shelf.ret, shelf.ws])
        && order.every(([id, ec]) => ec === looks[id].hue) && count(sh, '<article class="tile') === 4,
    "g1e Shelves paints a shelf per category in the catalog's order, in each one's hue, with the 4 cards as tiles");
  check(/<section class="shelf folded" data-shelf="[^"]+" data-ec="\d" aria-label="Workshops">/.test(sh)
        && /class="cat-dot" data-ec="0"/.test(sh) && /data-act="pick" data-id="[^"]+" data-ec="1"/.test(sh),
    "g1f the empty category is folded to its spine, each head wears the desk's dot, and a tile is a pick in its shelf's hue");

  P.S.q = "refund"; P.paint();
  const found = mainHtml();
  check(count(found, '<article class="tile') === 2 && /<section class="shelf folded"[^>]*aria-label="Workshops"/.test(found)
        && !/<section class="shelf folded"[^>]*aria-label="Returns"/.test(found) && count(found, '<mark class="hit">') >= 3
        && /<p class="tile-b">A <mark class="hit">refund<\/mark> goes back the way you paid\.<\/p>/.test(found),
    "g1g a search keeps the tiles it finds, marks its word, and a word found far into a card shows its own sentence");
  check(/^Found:\s2\scards, in\s2\scategories\.$/.test(home.node("#said").textContent),
    "g1h and says what is left for the ear: " + home.node("#said").textContent);
  P.S.q = "";

  const before = bytes(dir);
  /* the journal as it stood before the act, read raw from changes.json and not through the list's filter, so a reversal
     joined into the act's entry (a delete and its undo) shows too: an Undo leaves it so (undoBulk is not journalled) */
  const listOf = async (d) => { try { return JSON.stringify(JSON.parse(fs.readFileSync(path.join(d, "changes.json"), "utf8")).list.map(e => e.n)); }
    catch (e) { return "none"; } };
  const journalWas = await listOf(dir);
  await P.shvMoveTo(card.a, shelf.ret);
  check(draftOf(dir).cards.find(c => c.id === card.a).shelf === shelf.ret && calls.includes("moveCards")
        && P.S.open.draft.cards.find(c => c.id === card.a).shelf === shelf.ret,
    "g1i a tile carried to Returns moves the card there, in the file and in the page");
  P.paintUndo();
  check(/^Moved “Courier, what it costs” to “Returns”\.$/.test(P.S.undo && P.S.undo.said) && /Undo/.test(home.node("#undo").innerHTML)
        && home.node("#said").textContent === P.S.undo.said,
    "g1j the undo bar says which card went where and offers Undo, and the line is said: " + (P.S.undo && P.S.undo.said));
  await P.ACTS["card-undo"]();
  const journalNow = await listOf(dir);
  check(Buffer.compare(bytes(dir), before) === 0 && journalNow === journalWas,
    "g1k one Undo puts the file back byte for byte, and the Changes list as it was: " + journalWas + " then " + journalNow);

  const Q = loadPage({ api, uiLang: "pl" }).page;
  Object.assign(Q.S, { open: await wire(S.openProject(dir)), screen: "project", section: "cards", lang: "pl", cardsAs: "shelves" });
  await Q.shvMoveTo(card.c, shelf.del);
  check(/^Przeniesiono kartę „Return, one piece” do kategorii „Delivery”\.$/.test(Q.S.undo && Q.S.undo.said),
    "g1l in Polish the line is Claudette's: " + (Q.S.undo && Q.S.undo.said));
  await Q.ACTS["card-undo"]();

  /* ---- 2. IN THE MARGIN ------------------------------------------------------------------------ */

  /* a project of its own, so that its two findings are the only ones */
  const dir2 = (await S.newProject(root, "Margin", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }])).dir;
  const del2 = (await S.addTag(dir2, "shelf", { en: "Delivery", pl: "Dostawa" })).tag.id;
  card.e = (await S.addCard(dir2, del2, "Replacement, on its way", "Thank you for waiting. We will send you a replacement today, as promised.")).card.id;
  card.f = (await S.addCard(dir2, del2, "Postage back", "The postage is on its way back.")).card.id;
  await S.saveCard(dir2, card.f, { body: { pl: "Koszt przesyłki zwrócę jeszcze dziś." } });
  Object.assign(P.S, { open: await wire(S.openProject(dir2)), section: "cards", lang: "en", cardsAs: "table", sel: card.e, q: "" });
  const sugE = P.S.open.likely[card.e];
  P.paint();
  const ed = mainHtml();
  check(!!sugE && sugE.lang === "en" && /<div class="mg-field"><div class="mg-mirror" aria-hidden="true">Thank you for waiting\. <span class="mg-w">We<\/span> <span class="mg-w">will<\/span>/.test(ed)
        && /<textarea class="ta tall" data-f="body" data-l="en" aria-description="Checks: “We will send you a replacement today” reads like a commitment\.">/.test(ed),
    "g2a the open card's English box carries the phrase under a wave in its mirror, and says it to the ear");
  const bubE = (/<div class="bub mg-bub"[\s\S]*?<\/div><\/div>/.exec(ed) || [""])[0];
  check(text(bubE).startsWith("Reads like " + P.ruleSaid(sugE.kind) + ". If the card commits the firm, mark it, and desks show it with a stamp.")
        && /data-act="mg-mark"/.test(bubE) && /data-act="mg-not"/.test(bubE) && /1\sof\s2 · <kbd>F8<\/kbd>: next/.test(bubE)
        && !/id="cardLikely"/.test(ed),
    "g2b the bubble under the box names the kind, offers both answers and the walk (1 of 2), and the commitment box no longer says it: " + text(bubE));
  P.S.lang = "pl"; P.paint();
  check(!/class="bub mg-bub"/.test(mainHtml()) && /id="cardLikely"/.test(mainHtml()),
    "g2c CONTROL: with the finding's language off screen the bubble stays under the commitment box, as before");
  P.S.lang = "en";

  /* F8 under the places overlay is the overlay's: the walk stays where it is (the test architect's read of vision-alpha) */
  const selWas = P.S.sel, placesWere = P.S.places;
  P.S.places = { list: [] };
  P.mgKey({ key: "F8", preventDefault() {} });
  const underPlaces = P.S.sel;
  P.S.places = placesWere;
  check(underPlaces === selWas, "g2h F8 under the places overlay walks nothing: " + JSON.stringify([selWas === card.e, underPlaces === card.e]));
  P.mgKey({ key: "F8", preventDefault() {} });
  check(P.S.sel === card.f && P.S.lang === "pl" && /^Finding\s2\sof\s2:\s“Postage back”, PL text\.$/.test(home.node("#said").textContent)
        && /class="bub mg-bub"/.test(mainHtml()) && /<span class="mg-w">zwrócę<\/span>/.test(mainHtml()),
    "g2d F8 opens the next finding's card in its language, Polish, draws its wave and says where it is: " + home.node("#said").textContent);
  P.ACTS["mg-mark"]();
  await P.flush();
  check(draftOf(dir2).cards.find(c => c.id === card.f).commits === true && /^Marked as a commitment\. Still to answer:\s1\. F8: next$/.test(P.S.mgDone.said)
        && /<p class="mg-said" id="mgBub">/.test(P.mgSlot(P.S.open.draft.cards.find(c => c.id === card.f), "pl")),
    "g2e Mark as a commitment ticks the card's own commitment in the file, and the bubble folds to a line: " + P.S.mgDone.said);

  P.S.sel = card.e; P.S.lang = "en"; P.paint();
  const draftBefore = bytes(dir2);
  await P.ACTS["mg-not"]();
  const notes = JSON.parse(fs.readFileSync(path.join(dir2, "project.json"), "utf8")).notPromises || {};
  check(notes[card.e] === sugE.phrase && Buffer.compare(bytes(dir2), draftBefore) === 0 && P.S.mgDone.said === "Every finding is answered."
        && !P.S.open.likely[card.e],
    "g2f Not a commitment is the project's own dismissal, the catalog untouched, and with none left the line says so: " + P.S.mgDone.said);

  const QP = loadPage({ api, uiLang: "pl" }).page;
  await S.saveCard(dir2, card.f, { commits: false });
  Object.assign(QP.S, { open: await wire(S.openProject(dir2)), screen: "project", section: "cards", lang: "pl", sel: card.f });
  QP.paint();
  const qb = QP.mgSlot(QP.S.open.draft.cards.find(c => c.id === card.f), "pl");
  check(text(qb).startsWith("Brzmi jak " + QP.ruleSaid(QP.S.open.likely[card.f].kind) + ". Jeśli karta zobowiązuje firmę")
        && /1\sz\s1 · <kbd>F8<\/kbd>: następna/.test(qb),
    "g2g in Polish the bubble is Claudette's: " + text(qb).slice(0, 90));

  /* ---- 3. BY KIND ------------------------------------------------------------------------------ */

  const dir3 = (await S.newProject(root, "By kind", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }])).dir;
  const sh3 = (await S.addTag(dir3, "shelf", { en: "Returns", pl: "Zwroty" })).tag.id;
  const k = {};
  for (const [key, title, body] of [["d1", "Refund, three days", "The refund leaves us within three days."],
    ["d2", "Refund, reaching the card", "The refund reaches your card within three days of the parcel."],
    ["l1", "Postage back", "I'll refund the postage today."],
    ["d3", "Refund, back the way you paid", "The parcel travels by courier. A refund goes back the way you paid, and the money shows in a few days."],
    ["n1", "Refund, sent", "I've refunded the full amount."]])
    k[key] = (await S.addCard(dir3, sh3, title, body)).card.id;
  const R = loadPage({ api, uiLang: "en" });
  R.doc.absent = new Set(["#main .after, #dlg .after"]);
  const B = R.page;
  Object.assign(B.S, { open: await wire(S.openProject(dir3)), screen: "project", section: "lint", lfilter: "all", lang: "en" });
  const lint = () => R.node("#main").innerHTML;
  const kindsOf = (h) => [...h.matchAll(/<section class="bk-g([^"]*)" data-k="(\w+)">/g)].map(m => m[2] + (m[1].includes("done") ? "*" : ""));
  B.paint();
  const l0 = lint();
  check(JSON.stringify(kindsOf(l0)) === JSON.stringify(["dated", "later", "done"])
        && /<p class="lede" id="bkLede">5\sfindings in\s3\skinds\. Open a kind, untick what is not a commitment, and mark the rest in one press\.<\/p>/.test(l0)
        && /<b>A thing promised by a date<\/b><small>“The refund leaves us within three days”, and\s2\smore<\/small>/.test(l0)
        && /<span class="bk-c">3<\/span> of\s3/.test(l0) && /aria-label="Arrange"/.test(l0) && count(l0, "reads like a commitment") === 0
        && /<table><tr><th><\/th><th>Finding/.test(l0) && /Awaiting its PL text on\s5\scards\./.test(l0),
    "g3a the Lint page opens on its likely commitments by kind, the largest first, each named and counted, and the other findings keep their table: "
    + JSON.stringify(kindsOf(l0)));
  B.ACTS["lint-as"](el({ "data-v": "list" }));
  /* MOVED (board 1016, item 8): old, One list drew the five commitment rows at once; new, it draws one line "Promise suggestions: 5", and opening it (lint-sug) draws the five as before. */
  const shut = lint();
  B.ACTS["lint-sug"]();
  check(B.S.lintAs === "list" && /Promise suggestions: 5/.test(shut.replace(/ /g, " ")) && count(shut, "reads like a commitment") === 0
        && count(lint(), "reads like a commitment") === 5 && !/class="bk-g/.test(lint()) && /data-act="lint-as" data-v="kind"/.test(lint()),
    "g3b CONTROL: One list is the table as it was behind one promise line that opens it, the way back to the kinds above it");
  B.ACTS["lint-sug"]();
  B.ACTS["lint-as"](el({ "data-v": "kind" }));

  B.ACTS["bk-open"](el({ "data-k": "dated" }));
  B.paintMain();
  const l1 = lint();
  check(/<section class="bk-g open" data-k="dated">/.test(l1) && count(l1, 'class="bk-row"') === 3 && count(l1, 'data-act="bk-tick"') === 3
        && /aria-checked="true" data-act="bk-tick" data-id="[^"]+" tabindex="0" aria-label="Commitment: “The refund leaves us within three days”"/.test(l1)
        && /Mark the ticked as commitments<span class="count">3<\/span>/.test(l1) && /data-act="bk-none">None are commitments</.test(l1),
    "g3c a kind opens to its findings, all ticked, with Mark the ticked (3) and None are commitments");
  B.ACTS["bk-tick"](el({ "data-id": k.d2 }));
  B.paintMain();
  check(/Mark the ticked as commitments<span class="count">2<\/span>/.test(lint()) && /Unticked:\s1\. They stay, to be answered one by one\./.test(lint()),
    "g3d unticking one leaves two to mark and says the unticked one stays");
  const pre = bytes(dir3), journal3 = await listOf(dir3);
  await B.ACTS["bk-mark"]();
  const marked = draftOf(dir3).cards.filter(c => c.commits).map(c => c.id).sort();
  check(JSON.stringify(marked) === JSON.stringify([k.d1, k.d3].sort()) && calls.includes("commitCards")
        && /^Marked as commitments:\s2\. Still to answer:\s3\.$/.test(R.node("#said").textContent) && B.S.undo && /^Marked as commitments:\s2\.$/.test(B.S.undo.said),
    "g3e Mark marks exactly the two ticked cards in the file, as one change on the undo bar, and says what is left: " + R.node("#said").textContent);
  B.paintMain();
  check(/<section class="bk-g open" data-k="dated">/.test(lint()) && count(lint(), 'class="bk-row"') === 1
        && /data-act="bk-none">The rest are not commitments</.test(lint()) && /<span class="bk-c">1<\/span> of\s3/.test(lint())
        && /style="width:66\.7%"/.test(lint()),
    "g3f the kind stays open on the one left, its meter two thirds full, and offers The rest are not commitments");
  await B.ACTS["bk-none"]();
  B.paintMain();
  const notes3 = JSON.parse(fs.readFileSync(path.join(dir3, "project.json"), "utf8")).notPromises || {};
  check(notes3[k.d2] === "The refund reaches your card within three days of the parcel" && calls.includes("dismissMany")
        && JSON.stringify(kindsOf(lint())) === JSON.stringify(["later", "done", "dated*"])
        && /Answered:\s2\scommitments,\s1\snot\./.test(lint()) && /<span class="bk-c">0<\/span> of\s3/.test(lint()),
    "g3g the rest are turned down in the project, and the kind, answered, sinks to the foot and says how: " + JSON.stringify(kindsOf(lint())));
  await B.ACTS["card-undo"]();
  const journal3now = await listOf(dir3);
  check(Buffer.compare(bytes(dir3), pre) === 0 && journal3now === journal3,
    "g3h the undo bar's Undo takes both marks back, the file and the Changes list as they were: " + journal3 + " then " + journal3now);

  const wires = [["commitCards", "studio:cards-commit"], ["dismissMany", "studio:cards-not-promise"]];
  const mainJs = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8"), pre2 = fs.readFileSync(path.join(ROOT, "shell", "preload.js"), "utf8");
  check(wires.every(([v, ch]) => typeof S[v] === "function" && new RegExp('^answer\\("' + ch + '"[^\\n]*\\n\\s*(const[^\\n]*\\n\\s*)?return thread\\.call\\("' + v + '"', "m").test(mainJs)
        && new RegExp("^  " + v + ": [^\\n]*\\n?[^\\n]*ipcRenderer\\.invoke\\(\"" + ch + "\"", "m").test(pre2)),
    "g3i both verbs are wired end to end: src/studio.mjs, a channel in shell/main.js through answer(), and the preload's bridge");

  const RP = loadPage({ api, uiLang: "pl" });
  Object.assign(RP.page.S, { open: await wire(S.openProject(dir3)), screen: "project", section: "lint", lfilter: "all", lang: "pl" });
  RP.page.paintMain();
  check(/4\suwagi w\s3\srodzajach\. W każdym rodzaju wystarczy/.test(RP.node("#main").innerHTML) && /<b>Rzecz obiecana na termin<\/b>/.test(RP.node("#main").innerHTML),
    "g3j in Polish the lede is Claudette's, a finding counted as uwaga: " + text(RP.node("#main").innerHTML).slice(0, 120));

  /* ---- 4. THE TRAY ----------------------------------------------------------------------------- */

  Object.assign(P.S, { open: await wire(S.openProject(dir)), screen: "project", section: "cards", lang: "en", cardsAs: "table", sel: null,
    q: "", find: null, ticks: new Set(), tickAt: null, undo: null });
  P.paint();
  P.ACTS.tick(el({ "data-id": card.d }));
  P.ACTS.tick(el({ "data-id": card.a }));
  const bar4 = () => home.node("#bulk").innerHTML;
  const chips4 = () => [...bar4().matchAll(/<span class="tray-chip" data-id="([^"]+)"><svg class="cat-dot" data-ec="(\d)"/g)].map(m => [m[1], +m[2]]);
  check(/^<div class="tr-top"><b title="Shift\+click ticks a range"><span class="tr-n">2<\/span>\scards ticked<\/b>/.test(bar4())
        && JSON.stringify(chips4()) === JSON.stringify([[card.d, looks[shelf.ret].hue], [card.a, looks[shelf.del].hue]])
        && /aria-label="Untick “Courier, what it costs”"/.test(bar4()) && /data-act="tray-replace"/.test(bar4())
        && /Kept through searches/.test(bar4()) && /data-act="bulk-untick">Untick all</.test(bar4()),
    "g4a the tray names the ticked cards in the order ticked, each in its category's dress with its own cross, and says they are kept");
  check(/^Ticked “Courier, what it costs”\. Ticked in all:\s2\.$/.test(home.node("#said").textContent),
    "g4b a tick is said with the count: " + home.node("#said").textContent);
  P.S.q = "refund"; P.paint();
  check(P.S.ticks.size === 2 && chips4().length === 2 && !P.visibleCards().some(c => c.id === card.a),
    "g4c CONTROL: a search that hides a ticked card keeps it ticked and in the tray");
  P.S.q = ""; P.paint();
  P.ACTS.tick(el({ "data-id": card.c }));
  P.ACTS["tray-out"](el({ "data-id": card.c }));
  check(P.S.ticks.size === 2 && !P.S.ticks.has(card.c) && !chips4().some(x => x[0] === card.c),
    "g4d a chip's cross unticks that card and no other");

  await P.onTicked((d, ids) => api.moveCards(d, ids, shelf.ws), true);
  check(draftOf(dir).cards.filter(c => c.shelf === shelf.ws).map(c => c.id).sort().join() === [card.a, card.d].sort().join()
        && P.S.ticks.size === 2 && chips4().every(x => x[1] === looks[shelf.ws].hue),
    "g4e Move moves the tray's cards and keeps them in the tray, each chip now in its new category's dress");

  P.ACTS["tray-replace"]();
  P.S.q = "refund"; P.paintChrome(); P.paintMain();
  for (let i = 0; i < 1250 && !(P.S.find && P.S.find.rows); i++) await new Promise(r => setTimeout(r, 20));
  const strip4 = mainHtml();
  check(P.S.find && P.S.find.scope && P.S.find.scope.size === 2 && /placeholder="Find in the ticked cards"/.test(home.node("#chrome").innerHTML)
        && /<span class="chip tr-scope">Ticked:\s2\scards<\/span>/.test(strip4)
        && /^2\splaces in\s1\sof the\s2\sticked cards$/.test(P.findSaid(P.findCounts()))
        && count(P.findTable(), 'data-act="find-tick" data-key=') === 1,
    "g4f Replace in these is find and replace bounded to the tray: its scope said, its count, one row though the word stands in an unticked card too: "
    + P.findSaid(P.findCounts()) + "; rows " + (P.S.find && P.S.find.rows ? P.S.find.rows.length : "none")
    + "; scope " + !!(P.S.find && P.S.find.scope));
  P.S.find.to = "repayment";
  await P.ACTS["find-do"]();
  const after4 = draftOf(dir).cards;
  check(/repayment leaves us/.test(after4.find(c => c.id === card.d).body.en) && /A refund goes back/.test(after4.find(c => c.id === card.b).body.en)
        && P.S.ticks.size === 2,
    "g4g the replace writes the ticked card and leaves the unticked one as it was, the tray still holding its two");

  /* ---- 5. SINCE THE LAST EDITION --------------------------------------------------------------- */

  const dir5 = (await S.newProject(root, "Since", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }])).dir;
  const s5a = (await S.addTag(dir5, "shelf", { en: "Delivery", pl: "Dostawa" })).tag.id;
  const s5b = (await S.addTag(dir5, "shelf", { en: "Returns", pl: "Zwroty" })).tag.id;
  const c5 = {};
  for (const [key, title, body] of [["a", "Parcel today", "The parcel goes today."], ["b", "Parcel back", "A parcel comes back to us."],
    ["c", "Opening hours", "We are open until six."]])
    c5[key] = (await S.addCard(dir5, s5a, title, body)).card.id;
  const share5 = path.join(SCRATCH, "share5");
  fs.mkdirSync(share5, { recursive: true });
  await S.publishProject(dir5, { folder: share5, notes: "first" });
  /* An edition an older Studio published carries the mark it stamped; this one is put back the way that Studio wrote it. */
  const edition5 = editionsIn(dir5).slice(-1)[0], at5 = path.join(dir5, "archive", edition5, "catalog.ec");
  const older5 = JSON.parse(fs.readFileSync(at5, "utf8"));
  older5.evaluation = "evaluation";
  fs.writeFileSync(at5, JSON.stringify(older5, null, 1) + "\n");
  const marked5 = archivedCatalog(dir5, edition5);
  const since5 = await S.changesSince(dir5);
  check(marked5.evaluation === "evaluation" && !("evaluation" in draftOf(dir5)) && since5.list.length === 0,
    "g5q a draft compared with an edition an older Studio stamped with its evaluation mark, of the same content, is the same: mark "
    + JSON.stringify(marked5.evaluation) + ", " + since5.list.length + " change(s)");
  const H = loadPage({ api, uiLang: "en" });
  H.doc.absent = new Set(["#main .after, #dlg .after"]);
  const V = H.page;
  Object.assign(V.S, { open: await wire(S.openProject(dir5)), screen: "project", section: "changes", lang: "en" });
  const chg = () => H.node("#main").innerHTML;
  await V.chgLoad();
  V.paint();
  check(/<h1 id="chgH">The draft is the same as rev\s1 \(\S+\)<\/h1>/.test(chg()) && /data-act="section" data-v="changes" tabindex="0"><span class="rl">[\s\S]*?Changes<\/span><span class="num"><\/span>/.test(H.node("#rail").innerHTML),
    "g5a after a publish the rail has Changes with no count, and the page says the draft is the same as the edition");

  await S.saveCard(dir5, c5.c, { body: { en: "We are open until seven." } });
  await S.saveCard(dir5, c5.c, { body: { en: "We are open until seven on weekdays." } });
  await S.saveCard(dir5, c5.a, { body: { en: "The parcel goes today, by courier." } });
  await S.replacePlaces(dir5, { find: "parcel", replace: "package", whole: true }, [c5.a, c5.b]);
  await S.moveCards(dir5, [c5.b], s5b);
  await V.chgLoad();
  V.paint();
  const lines = () => [...chg().matchAll(/<span class="chg-l"><b>([^<]*)<\/b>(?:<small>([^<]*)<\/small>)?/g)].map(m => m[1] + (m[2] ? " | " + m[2] : ""));
  check(/<h1 id="chgH">4\schanges since rev\s1 \(\S+\)<\/h1>/.test(chg()) && /together they make rev\s2\./.test(chg())
        && JSON.stringify(lines()) === JSON.stringify(["Moved to “Returns”:\u00a01\u00a0card.", "Replaced “parcel” with “package” | 4\u00a0places in\u00a02\u00a0cards",
          "Edited the English of “Parcel today” | 3\u00a0words", "Edited the English of “Opening hours” | 3\u00a0words"])
        && V.S.open.changes === 4 && /data-act="publish">[\s\S]*?Publish rev\s2</.test(chg()),
    "g5b four changes newest first, two saves of one card's text as one, each with its size, and Publish rev 2: " + JSON.stringify(lines()));

  const nOf = (re) => (V.S.chg.list.find(e => re.test(V.chgLine(e).line)) || {}).n;
  const pre5 = draftOf(dir5);
  await V.ACTS["chg-undo"](el({ "data-n": String(nOf(/Opening hours/)) }));
  const d5 = draftOf(dir5), byId = (d, id) => d.cards.find(c => c.id === id);
  check(byId(d5, c5.c).body.en === "We are open until six." && byId(d5, c5.b).shelf === s5b && /package/.test(byId(d5, c5.b).body.en)
        && V.S.chg.list.length === 3 && /^Undone: Edited the English of “Opening hours”$/.test(H.node("#said").textContent),
    "g5c the oldest change undone on its own: its card's text is back and every newer change stands: " + H.node("#said").textContent);
  const before5 = bytes(dir5);
  await V.ACTS["chg-undo"](el({ "data-n": String(nOf(/Parcel today/)) }));
  check(Buffer.compare(bytes(dir5), before5) === 0 && /has changed since/.test(V.errText ? V.errText() : String(V.S.err)),
    "g5d CONTROL: a change whose card has changed since is refused, the file as it was: " + (V.errText ? V.errText() : ""));
  V.S.err = null;

  const nRep = nOf(/^Replaced/);
  V.S.chgSel = nRep; V.paint();
  check(count(chg(), 'data-act="chg-spot"') === 4 && /<del>parcel<\/del><ins>package<\/ins>/.test(chg()),
    "g5e the replace's detail lists its four places, each struck and written, each with Undo here");
  await V.ACTS["chg-spot"](el({ "data-n": String(nRep), "data-i": "1" }));
  V.S.chgSel = nRep; V.paint();
  const d5b = draftOf(dir5);
  check(/The parcel goes today/.test(byId(d5b, c5.a).body.en) && byId(d5b, c5.a).title.en === "package today" && /package/.test(byId(d5b, c5.b).body.en)
        && count(chg(), 'data-act="chg-spot"') === 3 && /<span class="n">undone<\/span>/.test(chg()),
    "g5f Undo here puts back that one place and leaves the other three: " + byId(d5b, c5.a).title.en + " / " + byId(d5b, c5.a).body.en);

  const raw = JSON.parse(bytes(dir5).toString("utf8"));
  raw.cards.find(c => c.id === c5.c).body.en = "We are open until five.";
  fs.writeFileSync(path.join(dir5, DRAFT_FILE), JSON.stringify(raw, null, 2));
  await V.chgLoad(); V.paint();
  check(lines().indexOf("Edited the English of “Opening hours” | 1\u00a0word") >= 0,
    "g5g a card changed outside Studio is found against the last edition and listed as a change of its own");
  await V.ACTS["chg-undo"](el({ "data-n": String(nOf(/Opening hours/)) }));
  check(byId(draftOf(dir5), c5.c).body.en === "We are open until six.", "g5h and undoing it puts back the edition's words");

  await S.publishProject(dir5, { folder: share5, notes: "second" });
  Object.assign(V.S, { open: await wire(S.openProject(dir5)) });
  await V.chgLoad(); V.paint();
  check(/The draft is the same as rev\s2/.test(chg()) && V.S.open.changes === 0, "g5i a publish starts the list again");

  const wires5 = [["changesSince", "studio:changes"], ["undoChange", "studio:change-undo"]];
  const main5 = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8"), pre5b = fs.readFileSync(path.join(ROOT, "shell", "preload.js"), "utf8");
  check(wires5.every(([v, ch]) => typeof S[v] === "function" && new RegExp('^answer\\("' + ch + '"[^\\n]*\\n\\s*return thread\\.call\\("' + v + '"', "m").test(main5)
        && new RegExp("^  " + v + ": [^\\n]*ipcRenderer\\.invoke\\(\"" + ch + "\"", "m").test(pre5b)),
    "g5j both verbs are wired end to end");
  await S.saveCard(dir5, c5.a, { body: { en: "The parcel goes tomorrow." } });
  const HP = loadPage({ api, uiLang: "pl" });
  Object.assign(HP.page.S, { open: await wire(S.openProject(dir5)), screen: "project", section: "changes", lang: "pl" });
  await HP.page.chgLoad(); HP.page.paint();
  check(/<h1 id="chgH">1\szmiana od wersji\s2 \(\S+\)<\/h1>/.test(HP.node("#main").innerHTML) && /Zmieniono tekst EN karty „package today”/.test(HP.node("#main").innerHTML),
    "g5k in Polish the page is Claudette's: " + text(HP.node("#main").innerHTML).slice(0, 120));

  /* a journal that cannot be written: its file's place taken by a folder */
  const jAt = path.join(dir5, "changes.json");
  fs.rmSync(jAt, { force: true }); fs.mkdirSync(jAt);
  let jSaved = null;
  try { jSaved = await S.saveCard(dir5, c5.b, { body: { en: "A package comes back to the studio." } }); } catch (e) { jSaved = { error: e.message }; }
  fs.rmSync(jAt, { recursive: true, force: true });
  check(jSaved && !jSaved.error && byId(draftOf(dir5), c5.b).body.en === "A package comes back to the studio.",
    "g5l a journal that cannot be written never fails the save it records: " + (jSaved && jSaved.error ? jSaved.error : "saved"));

  /* THE RAIL'S COUNT IS THE LIST'S (the test architect's read of 2026-10-07): a save and a save back inside the joining
     window answered 1 while the page listed 0, and an undone delete answered 2, counted before its entry left. */
  const dir6 = (await S.newProject(root, "Counts", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }])).dir;
  const s6 = (await S.addTag(dir6, "shelf", { en: "Delivery", pl: "Dostawa" })).tag.id;
  const c6 = (await S.addCard(dir6, s6, "Opening hours", "We are open until six.")).card.id;
  const shown6 = async () => (await S.changesSince(dir6)).list.filter(e => e.n > 0).length;
  await S.saveCard(dir6, c6, { body: { en: "We are open until seven." } });
  const back6 = await S.saveCard(dir6, c6, { body: { en: "We are open until six." } });
  const listed6 = await shown6(), list6 = await listOf(dir6);
  await S.deleteCard(dir6, c6);
  const undone6 = await S.undoDelete(dir6);
  const relisted6 = await shown6(), list6b = await listOf(dir6);
  check(back6.changes === listed6 && undone6.changes === relisted6 && list6b === list6,
    "g5m the count a verb answers is the list's: a save and a save back " + back6.changes + " against " + listed6
    + ", an undone delete " + undone6.changes + " against " + relisted6 + ", the list " + list6 + " then " + list6b);

  /* THE REST OF THE CATALOG IS A CHANGE TOO (the test architect's read of 2026-10-07): a category renamed after a publish
     left the page saying the draft was the same as the edition, and the count at 0. */
  const dir7 = (await S.newProject(root, "Rest", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }])).dir;
  const s7 = (await S.addTag(dir7, "shelf", { en: "Delivery", pl: "Dostawa" })).tag.id;
  await S.addCard(dir7, s7, "Parcel today", "The parcel goes today.");
  await S.publishProject(dir7, { folder: share5, notes: "first" });
  const tags7 = JSON.stringify(draftOf(dir7).tags);
  const renamed7 = await S.renameTag(dir7, s7, { en: "Shipping", pl: "Wysyłka" });
  Object.assign(V.S, { open: await wire(S.openProject(dir7)), screen: "project", section: "changes", lang: "en", chgSel: null });
  await V.chgLoad(); V.paint();
  const said7 = [chg().match(/<h1 id="chgH">([^<]*)</)[1], JSON.stringify(lines()), renamed7.changes, V.S.open.changes];
  await V.ACTS["chg-undo"](el({ "data-n": String(nOf(/^Changed the categories$/)) }));
  await V.chgLoad(); V.paint();
  check(/^1\schange since rev\s1 \(\S+\)$/.test(said7[0]) && said7[1] === JSON.stringify(["Changed the categories"]) && said7[2] === 1 && said7[3] === 1
        && JSON.stringify(draftOf(dir7).tags) === tags7 && /The draft is the same as rev\s1/.test(chg()) && V.S.open.changes === 0,
    "g5n a category renamed after a publish is a change, listed and counted, and undone on its own the draft's categories are"
    + " the edition's again: " + JSON.stringify(said7));
  const raw7 = JSON.parse(bytes(dir7).toString("utf8"));
  raw7.tags[0].label.en = "Post";
  fs.writeFileSync(path.join(dir7, DRAFT_FILE), JSON.stringify(raw7, null, 2));
  await V.chgLoad(); V.paint();
  const hand7 = [chg().match(/<h1 id="chgH">([^<]*)</)[1], JSON.stringify(lines())];
  await V.ACTS["chg-undo"](el({ "data-n": String(nOf(/^Changed the categories$/)) }));
  check(/^1\schange since rev\s1 \(\S+\)$/.test(hand7[0]) && hand7[1] === JSON.stringify(["Changed the categories"])
        && JSON.stringify(draftOf(dir7).tags) === tags7,
    "g5o a category changed outside Studio is found against the edition as one line, and undoing it puts the edition's back: "
    + JSON.stringify(hand7));

  /* PLACES IN ONE FIELD, EACH UNDONE ON ITS OWN, IN EVERY ORDER (the test architect's read of 2026-10-07): a replace with
     three places in one body, by a longer word and by a shorter, each place undone alone in three orders. Each undo must
     put back its own place, so the text after each step is the replaced text with exactly the undone places restored,
     and after the third it is the text as it was. The recorded places shift by the replacements before them, and the
     places after an undone one shift by the difference; leave either out and the text comes back wrong. */
  const dir8 = (await S.newProject(root, "Places", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }])).dir;
  const s8 = (await S.addTag(dir8, "shelf", { en: "Delivery", pl: "Dostawa" })).tag.id;
  const ORIG8 = "A cat sat. The cat ran. One more cat.";
  const c8 = (await S.addCard(dir8, s8, "Cats", ORIG8)).card.id;
  const wrong8 = [];
  for (const to of ["tiger", "ox"]) for (const order of [[0, 1, 2], [2, 1, 0], [1, 2, 0]]) {
    await S.saveCard(dir8, c8, { body: { en: ORIG8 } });
    await S.replacePlaces(dir8, { find: "cat", replace: to, whole: true }, [c8]);
    const n8 = (await S.changesSince(dir8)).list.find(e => e.did && e.did.kind === "replace").n;
    const done = new Set();
    for (const i of order) {
      try { await S.undoChange(dir8, n8, i); } catch (e) { wrong8.push(to + " " + order.join("") + " at " + i + " refused: " + e.message); break; }
      done.add(i);
      let k = -1;
      const want = ORIG8.replace(/\bcat\b/g, () => (done.has(++k) ? "cat" : to));
      const got = draftOf(dir8).cards.find(c => c.id === c8).body.en;
      if (got !== want) wrong8.push(to + " " + order.join("") + " after " + i + ": " + got);
    }
  }
  check(wrong8.length === 0, "g5p three places in one body, by a longer and a shorter word, each undone on its own in three"
    + " orders, each step putting back its own place: " + (wrong8.length ? JSON.stringify(wrong8.slice(0, 3)) : "6 of 6 runs right"));

  process.stdout.write("\nvision-gamma  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  if (asserted !== EXPECTED) {
    process.stderr.write("vision-gamma  expected " + EXPECTED + " assertions, ran " + asserted + "\n");
    failed++;
  }
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "vision-gamma");
  else process.stdout.write("vision-gamma  kept " + SCRATCH + "\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("vision-gamma  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
