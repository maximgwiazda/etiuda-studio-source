/* THE CARDS SEARCH READS AS THE DESKS' SEARCH DOES (author-search-is-not-the-desks-search, the Studio batch of 2026-10-12):
 * the typed text split on spaces as the desks split it, each term found somewhere on the card, in any order, as a piece
 * of its folded text or as a word the pinned engine's rule matches (src/modules/words.js: Polish letters folded, a shared
 * stem of five), in the title, the text, the keywords, the note and the category's and intents' names; a card found only
 * by its keywords or its note says so under its tile. sw10 holds the answers to the pinned desks' own composition
 * (card-search.js cardMatchesSearch over spell.js cardSearchTerms) over a fixed list of searches.
 *
 *     node tests/search-words.mjs
 *
 * The page runs on tests/page-stand-in.mjs, where a dynamic import cannot run, so the leg imports the pinned words.js
 * itself and hands it to the page as the module would arrive. visibleCards() is the list the table and the shelves read.
 *
 *   sw1  words in any order find a card the phrase as typed does not
 *   sw2  Polish letters typed bare find the card that carries them, and a shared stem finds an inflected word
 *   sw3  every word must be found: one word the card does not hold leaves it out
 *   sw4  the keywords are read, and the tile says the word was found there
 *   sw5  the note is read, and the tile says so
 *   sw6  an intent's name is read word by word too
 *   sw7  each matched word is marked in a tile's title, and nothing else
 *   sw8  CONTROL: with the engine's rule not yet here, the phrase is looked for as before, and sw1's words find nothing
 *   sw10 over a fixed list of searches, the cards Studio finds are the cards the pinned desks' search finds, run from the
 *        pinned card-search.js and spell.js over the same cards read by the pinned catalogFromV2: pieces of words
 *        ("fund", "789", "okin"), a hyphen, single letters, folds, stems, several words; and the three differences Studio
 *        means, each by name: it reads a card's identifier, its intents' names, and its category's name in every language
 *   sw11 a fold the stem cannot mask: "laka" and "zolw" find "Łąka i żółw", "gęś" finds the bare-lettered text's twin,
 *        and the word found is marked in the tile with its own letters
 *   sw12 the prefix floor is 5 and the stem floor is 4: a shared five matches, and refuse does not match refund
 *   sw9  every leg ran
 *
 * THE TYPO ARM IS NOT READ HERE. spell.js correctTerm replaces a term of five letters or more that reaches nothing
 * with a catalog word one edit away, and it reads the desk's card list. This file never fills that list, so sw10 compares
 * the composition against an empty vocabulary: a green sw10 is not a reading of editDistance1, and "refnud" staying
 * unmatched is the empty list. Studio's own search splits the typed text and does not call correctTerm. A desk on an
 * older release than Studio's pin may search by an older rule, which nothing here can see. The prefix floor and the stem floor are sw12.
 *
 * WHAT IT CANNOT SEE: how the marks and the line under a tile look, which is Maxim's eye. Node only, no window.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadPage } from "./page-stand-in.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPECTED = 12;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}

async function main() {
  /* words.js has no imports, so its text runs as a module of its own, as tests/desk-emitter.mjs runs the engine's */
  const wordsSrc = fs.readFileSync(path.join(ROOT, "engine", "pinned", "src", "modules", "words.js"), "utf8");
  const WORDS = await import("data:text/javascript;base64," + Buffer.from(wordsSrc).toString("base64"));
  const { page: P } = loadPage({ uiLang: "en" });
  const shelf = (id, en, pl) => ({ id, kind: "shelf", label: { en, pl } });
  const intent = (id, en, pl) => ({ id, kind: "request", clause: { en, pl } });
  const card = (id, title, body, more) => Object.assign({ id, shelf: "s1", title: { en: title, pl: title }, body: { en: body, pl: body },
    requests: [] }, more || {});
  const draft = {
    langs: [{ code: "en" }, { code: "pl" }],
    tags: [shelf("s1", "Delivery", "Dostawa"), intent("r1", "Where is my parcel", "Gdzie jest paczka")],
    cards: [
      card("c-one", "Open the parcel lockers", "They stay open all week."),
      card("c-two", "Przesyłka w drodze", "Zmianą adresu zajmie się kurier."),
      card("c-three", "Card three", "Nothing about it here.", { k: "ABC123 courierless" }),
      card("c-four", "Card four", "Plain text only.", { note: { en: "Escalate to the lead.", pl: "" } }),
      card("c-five", "Card five", "Some other text.", { requests: ["r1"] }),
      card("c-six", "Courier hours", "When the courier calls.", { k: "courier" }),
    ],
  };
  P.S.open = { draft, awaiting: [] };
  P.S.screen = "project"; P.S.section = "cards";
  const find = (q) => { P.S.q = q; return P.visibleCards().map((c) => c.id).sort().join(","); };
  const tile = P.__get("tileHtml"), rowCtx = P.__get("rowCtx");
  const tileOf = (id, q) => { P.S.q = q; return tile(draft.cards.find((c) => c.id === id), q.trim().toLowerCase(), rowCtx()); };

  /* the control first, before the rule arrives: the phrase as typed, as before */
  const before = [find("lockers parcel"), find("open the parcel")];
  P.__set("WORDS", WORDS);

  check(find("lockers parcel") === "c-one" && find("PARCEL open") === "c-one",
    "sw1 words in any order find the card: lockers parcel " + find("lockers parcel") + "; PARCEL open " + find("PARCEL open"));
  check(find("przesylka") === "c-two" && find("zmiany") === "c-two",
    "sw2 Polish letters typed bare, and a shared stem, find the card: przesylka " + find("przesylka") + "; zmiany " + find("zmiany"));
  check(find("parcel banana") === "",
    "sw3 every word must be found, so a word no card holds leaves them all out: " + (find("parcel banana") || "none"));
  check(find("abc123") === "c-three" && /class="tile-why">Found in its keywords</.test(tileOf("c-three", "abc123"))
        && !/tile-why/.test(tileOf("c-one", "parcel")) && !/tile-why/.test(tileOf("c-six", "courier")),
    "sw4 the keywords are read, and the tile found there says so, while one found by its title does not: " + find("abc123"));
  check(find("escalate lead") === "c-four" && /class="tile-why">Found in its note</.test(tileOf("c-four", "escalate")),
    "sw5 the note is read, and the tile says so: " + find("escalate lead"));
  check(find("parcel where") === "c-five" && find("paczka gdzie") === "c-five",
    "sw6 an intent's name is read word by word: parcel where " + find("parcel where") + "; paczka gdzie " + find("paczka gdzie"));
  const marked = tileOf("c-one", "lockers open");
  const marks = [...marked.matchAll(/<mark class="hit">([^<]*)<\/mark>/g)].map((m) => m[1]);
  check(marks.slice(0, 2).join(",") === "Open,lockers" && marks.indexOf("parcel") < 0,
    "sw7 each word matched is marked in the tile, and no other: " + marks.join(","));
  check(before[0] === "" && before[1] === "c-one",
    "sw8 CONTROL: before the engine's rule arrives the phrase is looked for, so lockers parcel finds nothing and the phrase"
    + " finds its card: " + JSON.stringify(before));
  /* sw10: the desks' own composition, from the pinned modules, over the same cards */
  const LAB = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-search-desks-"));
  fs.cpSync(path.join(ROOT, "engine", "pinned", "src", "modules"), path.join(LAB, "m"), { recursive: true });
  fs.writeFileSync(path.join(LAB, "m", "package.json"), '{"type":"module"}');
  const hadWindow = globalThis.window;
  globalThis.window = globalThis.window || { innerWidth: 1280, innerHeight: 800 };
  const D = (n) => import(pathToFileURL(path.join(LAB, "m", n)).href);
  const CS = await D("card-search.js"), SP = await D("spell.js"), CV2 = await D("catalog-v2.js"), CMOD = await D("content-model.js");
  const dcard = (id, title, body, more) => Object.assign({ id, shelf: "s1", title: { en: title, pl: title }, body: { en: body, pl: body },
    bodyShape: "plain", requests: [] }, more || {});
  const ddraft = { format: 2, kind: CV2.V2_KIND, id: "k-0000000000000000", rev: 1, langs: [{ code: "en" }, { code: "pl" }],
    tags: [shelf("s1", "Delivery", "Delivery")],
    cards: [
      dcard("c-d1", "Refund policy", "Quote booking XYZ789 when you write."),
      dcard("c-d2", "Łąka i żółw", "Spacer po łące z gęsią."),
      dcard("c-d3", "Send an e-mail", "Write to the mail desk."),
      dcard("c-d4", "Przesyłka w drodze", "Kurier dzwoni przed dostawą."),
      dcard("c-d5", "Changing the address", "We change it before dispatch.", { k: "courierless" }),
      dcard("c-d6", "Card six", "Plain text only.", { note: { en: "Escalate to the lead by mail.", pl: "Przekaż prowadzącemu." } }),
    ] };
  /* list A: one category name in both languages and no intent, so the comparison is the composition alone; list B: the
     same cards with the category's Polish name and an intent, for the three differences Studio means */
  const ddraftB = JSON.parse(JSON.stringify(ddraft));
  ddraftB.tags = [shelf("s1", "Delivery", "Dostawa"), intent("r1", "Where is my parcel", "Gdzie jest paczka")];
  ddraftB.cards[4].requests = ["r1"];
  const sides = (doc) => {
    const cat = CV2.catalogFromV2(doc);
    Object.keys(CMOD.CATS).forEach((k) => { delete CMOD.CATS[k]; });
    Object.assign(CMOD.CATS, cat.categories || {});
    const { page } = loadPage({ uiLang: "en" });
    page.S.open = { draft: doc, awaiting: [] };
    page.S.screen = "project"; page.S.section = "cards";
    page.__set("WORDS", WORDS);
    return { desk: (q) => (cat.cards || []).filter((m) => CS.cardMatchesSearch(m, SP.cardSearchTerms(q))).map((m) => m.id).sort().join(","),
             studio: (q) => { page.S.q = q; return page.visibleCards().map((c) => c.id).sort().join(","); }, page };
  };
  const A = sides(ddraft);
  const deskFind = A.desk, studioFind = A.studio, P2 = A.page;
  const SAME = ["fund", "789", "okin", "sylka", "przesylka", "e-mail", "mail", "w", "a", "z", "refund", "change",
    "changing address", "address changing", "kurier dzwoni", "escalate", "courier", "delivery", "laka", "zolw", "gęś",
    "nothing-here", "refnud"];
  const differ = SAME.map((q) => [q, studioFind(q), deskFind(q)]).filter((r) => r[1] !== r[2]);
  const B = sides(ddraftB);
  const MEANT = [["c-d5", "the identifier"], ["parcel where", "an intent's name"], ["dostawa", "the category's Polish name"]]
    .map(([q, why]) => [q, why, B.studio(q), B.desk(q)]);
  const meantOk = MEANT[0][2] === "c-d5" && MEANT[0][3] === "" && MEANT[1][2] === "c-d5" && MEANT[1][3] === ""
    && MEANT[2][2] === "c-d1,c-d2,c-d3,c-d4,c-d5,c-d6" && MEANT[2][3] === "c-d4";
  check(differ.length === 0 && meantOk && deskFind("fund") === "c-d1" && studioFind("okin") === "c-d1",
    "sw10 over " + SAME.length + " searches Studio finds the cards the pinned desks' search finds"
    + (differ.length ? ", but not for " + JSON.stringify(differ) : "") + "; it differs only where it means to: "
    + JSON.stringify(MEANT.map((m) => m[1] + " " + m[2] + "/" + (m[3] || "none"))));
  const lakaTile = (() => { P2.S.q = "laka"; return P2.__get("tileHtml")(ddraft.cards[1], "laka", P2.__get("rowCtx")()); })();
  check(studioFind("laka") === "c-d2" && studioFind("zolw") === "c-d2" && studioFind("gęś") === "c-d2"
        && /<mark class="hit">Łąka<\/mark>/.test(lakaTile),
    "sw11 a fold the stem cannot mask: laka " + studioFind("laka") + ", zolw " + studioFind("zolw") + ", gęś " + studioFind("gęś")
    + ", and the tile marks Łąka with its own letters");
  /* Prefix 5 to 4 leaves sw2 green and lets refuse match refund. Stem 4 to 3 stays green everywhere
     but here: sw12 pins the constant, which is what a planted 3 has to redden. */
  check(WORDS.WORD_PREFIX_MIN === 5 && WORDS.WORD_STEM_MIN === 4
        && WORDS.wordMatchesTerm("zmiana", "zmiany") === true
        && WORDS.wordMatchesTerm("refuse", "refund") === false,
    "sw12 the prefix floor is 5 and the stem floor is 4: zmianą's fold matches zmiany, and refuse does not match refund ("
    + WORDS.WORD_PREFIX_MIN + ", " + WORDS.WORD_STEM_MIN + ", " + WORDS.wordMatchesTerm("zmiana", "zmiany") + ", " + WORDS.wordMatchesTerm("refuse", "refund") + ")");
  if (hadWindow === undefined) delete globalThis.window; else globalThis.window = hadWindow;

  check(asserted === EXPECTED - 1, "sw9 every leg ran: " + (asserted + 1) + " of " + EXPECTED);
}

main().then(() => {
  console.log("#counts checks=" + asserted + " failed=" + failed + " expected=" + EXPECTED);
  console.log(failed ? "RESULT: FAIL " + failed + " failed" : "RESULT: ok " + asserted + " check(s)");
  process.exit(failed ? 1 : 0);
}, (e) => { console.log("  FAIL " + (e && e.stack || e)); console.log("RESULT: FAIL the leg did not complete"); process.exit(1); });
