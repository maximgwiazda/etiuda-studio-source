/* THE CARDS SEARCH FINDS A CARD BY ITS CATEGORY'S NAME, the promise its own box makes ("Search cards, intents and categories").
 *
 *     node tests/search-category.mjs
 *
 * ui/app.js's matches() read a card's titles, bodies and id and nothing else, so a search for a category's name found only the
 * cards that happened to say it. The page runs on tests/page-stand-in.mjs over a draft written in the leg; visibleCards() is the
 * list the table, "tick all" and the ticked bar read, so what it returns is what the person sees. Markup and state only.
 *
 *   sbc1  a category's name finds the cards in that category, and not those that merely sit beside it
 *   sbc2  the name in the other declared language finds them too, as a card's text is searched in every language
 *   sbc3  capitals do not matter, as for the card's own words
 *   sbc4  a card moved to another category (the page writes c.shelf in place) is found under the new name and no longer the old
 *   sbc5  a category renamed (the tag list is replaced) is found under the new name and no longer the old
 *   sbc6  what search read before it still reads: a word in a body, an id, nothing for a word that is nowhere, all for no word
 *   sbc7  a category's name and a card's own words are one OR: a card whose text says the word stays when its category does not
 *   sbc8  the table paints the cards visibleCards() returns: ui/app.js builds the table's list in paintCardsOnce, apart from
 *         visibleCards(), so sbc1 to sbc7 alone say nothing about the rows on the screen
 *   sbc9  every leg ran
 *
 * WHAT IT CANNOT SEE, said rather than implied: how the table looks while a search is on, which is Maxim's eye. The intents
 * half of the box's promise is tests/search-intent.mjs.
 *
 * PROVED BY MAKING IT FAIL: SEARCH_CATEGORY_APP=<a copy of ui/app.js> reads that copy instead. main's ui/app.js reddens sbc1 to
 * sbc5 and sbc7; a copy whose category text is kept inside the per-card cache (so it goes stale on a move) reddens sbc4, sbc5
 * and sbc7 only.
 *
 * Node only, no window, no Electron. Exit 0 when every check holds, 1 when any fails.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPage } from "./page-stand-in.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXPECTED = 9;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}

const source = process.env.SEARCH_CATEGORY_APP ? fs.readFileSync(path.resolve(process.env.SEARCH_CATEGORY_APP), "utf8") : undefined;

function main() {
  const { page: P, sandbox } = loadPage({ uiLang: "en", source });
  const tag = (id, en, pl) => ({ id, kind: "shelf", label: { en, pl } });
  const card = (id, shelf, title, body) => ({ id, shelf, title: { en: title, pl: title }, body: { en: body, pl: body }, requests: [] });
  const draft = {
    langs: [{ code: "en" }, { code: "pl" }],
    tags: [tag("s1", "Delivery", "Dostawa"), tag("s2", "Workshops", "Warsztaty")],
    cards: [
      card("c-alpha", "s1", "Card A", "Parcels leave on Monday."),
      card("c-beta", "s1", "Card B", "Lockers are open all week."),
      card("c-gamma", "s2", "Card C", "Bring your own apron."),
      card("c-delta", "s2", "Card D", "Our delivery partner is not a workshop."),
    ],
  };
  P.S.open = { draft, awaiting: [], lint: { errors: 0, warnings: 0 } };
  P.S.screen = "project"; P.S.section = "cards";
  const find = (q) => { P.S.q = q; return P.visibleCards().map((c) => c.id).sort().join(","); };
  /* the ids of the rows the table painted for q, read from the stand-in's table (markup, not layout) */
  const painted = (q) => {
    P.S.q = q; P.paintCards();
    const rows = (sandbox.__tables.slice(-1)[0] || {}).__rows || [];
    return rows.map((r) => (/data-id="([^"]*)"/.exec(r) || [])[1]).sort().join(",");
  };

  check(find("delivery") === "c-alpha,c-beta,c-delta",
    "sbc1 a search for the category's name finds its two cards (and the third card that says the word itself), not the Workshops cards"
    + " that do not: " + find("delivery"));
  check(find("warsztaty") === "c-delta,c-gamma" && find("dostawa") === "c-alpha,c-beta",
    "sbc2 the Polish names find their categories' cards: warsztaty " + find("warsztaty") + "; dostawa " + find("dostawa"));
  check(find("WORKSHOPS") === find("workshops") && find("workshops") === "c-delta,c-gamma",
    "sbc3 capitals do not matter: WORKSHOPS " + find("WORKSHOPS"));

  draft.cards[0].shelf = "s2";
  check(find("workshops") === "c-alpha,c-delta,c-gamma" && find("dostawa") === "c-beta",
    "sbc4 c-alpha moved in place to Workshops: workshops " + find("workshops") + "; dostawa " + find("dostawa"));

  draft.tags = [tag("s1", "Shipping", "Wysylka"), tag("s2", "Workshops", "Warsztaty")];
  P.S.open = { draft, awaiting: [] };
  check(find("shipping") === "c-beta" && find("wysylka") === "c-beta" && find("dostawa") === "",
    "sbc5 Delivery renamed Shipping: shipping " + find("shipping") + "; wysylka " + find("wysylka") + "; dostawa " + JSON.stringify(find("dostawa")));

  check(find("apron") === "c-gamma" && find("c-beta") === "c-beta" && find("zzz-nowhere") === "" && find("").split(",").length === 4,
    "sbc6 a body word, an id, a word nowhere and no word at all read as before: apron " + find("apron") + "; c-beta " + find("c-beta")
    + "; zzz-nowhere " + JSON.stringify(find("zzz-nowhere")) + "; empty " + find("").split(",").length + " cards");

  draft.cards[3].body = { en: "Parcels, delivery and nothing else.", pl: "Paczki." };
  P.S.open = { draft, awaiting: [] };
  check(find("parcels") === "c-alpha,c-delta" && find("shipping") === "c-beta",
    "sbc7 a card's own words and its category's name are an OR: parcels " + find("parcels") + "; shipping " + find("shipping"));

  P.S.open = { draft, awaiting: [], lint: { errors: 0, warnings: 0 } };
  const a = painted("shipping"), b = painted("warsztaty"), z = painted("zzz-nowhere");
  check(a !== "" && a === find("shipping") && b !== "" && b === find("warsztaty") && z === "" && painted("") === find(""),
    "sbc8 the table paints the cards visibleCards() lists, found by category alone: shipping " + a + "; warsztaty " + b
    + "; zzz-nowhere " + JSON.stringify(z) + "; empty " + painted("").split(",").length + " rows");

  check(asserted + 1 === EXPECTED, "sbc9 every leg ran: " + (asserted + 1) + " of " + EXPECTED + " assertion(s)");
  process.stdout.write("search-category: " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

try { main(); }
catch (e) {
  process.stderr.write("  FAIL tests/search-category.mjs threw: " + (e && e.stack || e) + "\n");
  process.exit(1);
}
