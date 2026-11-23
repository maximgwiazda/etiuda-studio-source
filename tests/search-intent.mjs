/* THE CARDS SEARCH FINDS A CARD BY ITS INTENTS' NAMES, the other half of what its box promises ("Search cards, intents and
 * categories"); tests/search-category.mjs holds the categories.
 *
 *     node tests/search-intent.mjs
 *
 * Was: "An intent's name is the tag's `clause`". Now (board 1018, piece C): an intent is named by its `topic`, and by its
 * `clause` where it has none, and the search reads both; this leg's intents carry clauses alone, so what it holds is the
 * fallback, and tests/topic-first.mjs tpf4 holds the topic (a category's name is its `label`); a card carries intents as a list of ids in
 * `requests`. The page runs on tests/page-stand-in.mjs over a draft written in the leg; visibleCards() is the list the table,
 * "tick all" and the ticked bar read. Markup and state only.
 *
 *   sbi1  an intent's name finds the cards that carry it, and not those that do not
 *   sbi2  the name in the other declared language finds them too
 *   sbi3  a card carrying two intents is found under either
 *   sbi4  an intent ticked or unticked on a card (the page writes c.requests in place) moves the card in and out of the result
 *   sbi5  an intent renamed (the tag list is replaced) is found under the new name and no longer the old
 *   sbi6  a category's name is not read as an intent's, nor an intent's as a category's: the two kinds keep their own cards
 *   sbi7  the table paints the cards visibleCards() lists (paintCardsOnce builds its own list; see sbc8 in the category leg)
 *   sbi8  every leg ran
 *
 * WHAT IT CANNOT SEE, said rather than implied: how the table looks while a search is on, which is Maxim's eye.
 *
 * PROVED BY MAKING IT FAIL: SEARCH_INTENT_APP=<a copy of ui/app.js> reads that copy instead. The tree before the intents were
 * read (e029abe) reddens sbi1 to sbi5 and sbi6 stays green; a copy whose intent text is cached on the per-card cache reddens sbi4 to sbi6 (the cache carries the
 * earlier answer into the later legs); a copy that keeps one
 * map for both kinds of tag reddens sbi6.
 *
 * Node only, no window, no Electron. Exit 0 when every check holds, 1 when any fails.
 */
import fs from "node:fs";
import path from "node:path";
import { loadPage } from "./page-stand-in.mjs";

const EXPECTED = 8;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}

const source = process.env.SEARCH_INTENT_APP ? fs.readFileSync(path.resolve(process.env.SEARCH_INTENT_APP), "utf8") : undefined;

function main() {
  const { page: P, sandbox } = loadPage({ uiLang: "en", source });
  const shelf = (id, en, pl) => ({ id, kind: "shelf", label: { en, pl } });
  const intent = (id, en, pl) => ({ id, kind: "request", clause: { en, pl } });
  const card = (id, sh, title, body, requests) => ({ id, shelf: sh, title: { en: title, pl: title }, body: { en: body, pl: body }, requests });
  const draft = {
    langs: [{ code: "en" }, { code: "pl" }],
    tags: [shelf("s1", "Delivery", "Dostawa"), intent("r1", "Where is my parcel", "Gdzie jest paczka"),
      intent("r2", "Return an item", "Zwrot towaru")],
    cards: [
      card("c-alpha", "s1", "Card A", "Parcels leave on Monday.", ["r1"]),
      card("c-beta", "s1", "Card B", "Lockers are open all week.", ["r1", "r2"]),
      card("c-gamma", "s1", "Card C", "Bring your own apron.", ["r2"]),
      card("c-delta", "s1", "Card D", "Nothing else here.", []),
    ],
  };
  P.S.open = { draft, awaiting: [] };
  P.S.screen = "project"; P.S.section = "cards";
  const find = (q) => { P.S.q = q; return P.visibleCards().map((c) => c.id).sort().join(","); };
  /* the ids of the rows the table painted for q, read from the stand-in's table (markup, not layout) */
  const painted = (q) => {
    P.S.q = q; P.paintCards();
    const rows = (sandbox.__tables.slice(-1)[0] || {}).__rows || [];
    return rows.map((r) => (/data-id="([^"]*)"/.exec(r) || [])[1]).sort().join(",");
  };

  check(find("where is my") === "c-alpha,c-beta" && find("return an item") === "c-beta,c-gamma",
    "sbi1 an intent's name finds the cards that carry it: where is my " + find("where is my") + "; return an item " + find("return an item"));
  check(find("gdzie jest") === "c-alpha,c-beta" && find("ZWROT") === "c-beta,c-gamma",
    "sbi2 the Polish names find them, capitals aside: gdzie jest " + find("gdzie jest") + "; ZWROT " + find("ZWROT"));
  check(find("where is my").split(",").indexOf("c-beta") >= 0 && find("return an item").split(",").indexOf("c-beta") >= 0,
    "sbi3 c-beta carries two intents and is found under either: where is my " + find("where is my") + "; return an item " + find("return an item"));

  draft.cards[2].requests = ["r1", "r2"];
  draft.cards[0].requests = [];
  check(find("where is my") === "c-beta,c-gamma" && find("zwrot") === "c-beta,c-gamma",
    "sbi4 c-gamma ticked r1 and c-alpha unticked it, in place: where is my " + find("where is my") + "; zwrot " + find("zwrot"));

  draft.tags = [shelf("s1", "Delivery", "Dostawa"), intent("r1", "Track an order", "Sledz zamowienie"), intent("r2", "Return an item", "Zwrot towaru")];
  P.S.open = { draft, awaiting: [] };
  check(find("track an order") === "c-beta,c-gamma" && find("sledz") === "c-beta,c-gamma" && find("where is my") === "",
    "sbi5 r1 renamed: track an order " + find("track an order") + "; sledz " + find("sledz") + "; where is my " + JSON.stringify(find("where is my")));

  draft.cards.forEach((c) => { c.requests = []; });
  draft.cards[3].shelf = "s9"; draft.cards[3].requests = ["s1"];
  draft.cards[0].shelf = "r2";
  P.S.open = { draft, awaiting: [] };
  check(find("delivery") === "c-beta,c-gamma" && find("return an item") === "" && find("dostawa") === "c-beta,c-gamma",
    "sbi6 an id of one kind is not read as the other's: c-delta, on no category, lists the shelf id s1 as an intent and c-alpha has the intent id"
    + " r2 as its shelf, and neither is found by those names: delivery " + find("delivery") + "; return an item " + JSON.stringify(find("return an item")));

  draft.tags = [shelf("s1", "Delivery", "Dostawa"), intent("r1", "Where is my parcel", "Gdzie jest paczka"), intent("r2", "Return an item", "Zwrot towaru")];
  draft.cards.forEach((c) => { c.requests = []; });
  draft.cards[0].requests = ["r1"]; draft.cards[1].requests = ["r1", "r2"]; draft.cards[2].requests = ["r2"];
  draft.cards[3].shelf = "s1"; draft.cards[0].shelf = "s1";
  P.S.open = { draft, awaiting: [], lint: { errors: 0, warnings: 0 } };
  const a = painted("gdzie jest"), b = painted("zwrot"), z = painted("zzz-nowhere");
  check(a !== "" && a === find("gdzie jest") && b !== "" && b === find("zwrot") && z === "" && painted("") === find(""),
    "sbi7 the table paints the cards visibleCards() lists, found by intent alone: gdzie jest " + a + "; zwrot " + b
    + "; zzz-nowhere " + JSON.stringify(z) + "; empty " + painted("").split(",").length + " rows");

  check(asserted + 1 === EXPECTED, "sbi8 every leg ran: " + (asserted + 1) + " of " + EXPECTED + " assertion(s)");
  process.stdout.write("search-intent: " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

try { main(); }
catch (e) {
  process.stderr.write("  FAIL tests/search-intent.mjs threw: " + (e && e.stack || e) + "\n");
  process.exit(1);
}
