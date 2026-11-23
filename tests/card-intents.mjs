/* ASSIGNED INTENTS AS CHIPS WITH SEARCH PICKER (board 960).
 *
 *     node tests/card-intents.mjs [--keep]
 *
 * Today every intent was a checkbox row at the bottom of the editor. Assigned intents become chips with a remove
 * button; a search field filters the catalog's intents by what is typed in the shown language and offers those not
 * yet on the card; Category and Intent move to the top of the editor before the language blocks (retBox first);
 * and with 75 intents the editor no longer grows by 75 rows.
 *
 *   ci1  75 catalog intents do not make 75 checkbox rows in the editor
 *   ci2  Category and Intent sit near the top of the editor, after retBox and before the language blocks
 *   ci3  assigned intents show as chips, each with a remove button
 *   ci4  search filters catalog intents in the shown language and offers only those not yet assigned
 *   ci5  search with no match shows the copywriter's sentence
 *   ci6  Escape in the search closes the list and leaves the field
 *   ci7  add and remove update c.requests and trigger save
 *   ci8  lint focus for requests lands on the new search control
 *   ci9  all checks ran
 *
 * Node only, no window, no Electron.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPage } from "./page-stand-in.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

function makeIntents(count) {
  const list = [];
  for (let i = 1; i <= count; i++) {
    const pad = String(i).padStart(2, "0");
    list.push({
      id: "in-" + pad,
      kind: "request",
      clause: { en: "Intent " + pad, pl: "Intencja " + pad },
    });
  }
  return list;
}

function run() {
  const home = loadPage({ uiLang: "en" });
  const P = home.page;
  const catalogIntents = makeIntents(75);
  // Give intent 10 a distinct phrase for search filtering
  catalogIntents[9].clause = { en: "Delivery tracking inquiry", pl: "Sledzenie przesylki" };
  // Give intent 20 another distinct phrase
  catalogIntents[19].clause = { en: "Package return request", pl: "Zwrot paczki" };

  const saved = [];
  P.__set("queueSave", (id, patch) => { saved.push({ id, patch }); });

  const draft = {
    langs: [{ code: "en" }, { code: "pl" }],
    tags: [
      { id: "s1", kind: "shelf", label: { en: "Orders", pl: "Zamowienia" } },
      ...catalogIntents,
    ],
    cards: [
      {
        id: "c1",
        shelf: "s1",
        title: { en: "Card 1", pl: "Karta 1" },
        body: { en: "Body 1", pl: "Tresc 1" },
        note: { en: "Note 1", pl: "Notatka 1" },
        requests: ["in-01", "in-02"],
      },
      {
        id: "c2",
        shelf: "s1",
        title: { en: "Card 2", pl: "Karta 2" },
        body: { en: "Body 2", pl: "Tresc 2" },
        requests: [],
      },
    ],
  };

  P.S.host = { tour: { offered: true }, langs: { builtIn: ["en", "pl"], endonyms: { en: "English", pl: "Polski" } } };
  P.S.open = {
    dir: "D:\\test-proj",
    name: "TestProj",
    draft,
    awaiting: [],
    lint: { errors: 0, warnings: 0, rows: [] },
    editions: [],
    langs: { rows: [{ code: "en" }, { code: "pl" }] },
  };
  P.S.screen = "project";
  P.S.section = "cards";
  P.S.sel = "c1";
  P.S.lang = "en";

  const card1 = P.cardById("c1");
  const html = P.editorHtml(card1);

  // ci1: 75 catalog intents do not make 75 checkbox rows in the editor
  const cbxCount = (html.match(/data-act="intent"/g) || []).length;
  check(cbxCount === 0, "ci1a the editor contains no intent checkbox rows with 75 intents (found " + cbxCount + ")");
  const row2Count = (html.match(/class="row2"/g) || []).length;
  check(row2Count < 10, "ci1b the editor has no 75 row2 elements (found " + row2Count + ")");

  // ci2: Category and Intent sit near the top of the editor, after retBox and before language blocks
  const retIdx = html.indexOf('class="ret-box"');
  const catIdx = html.indexOf('data-f="shelf"');
  const intIdx = html.indexOf('id="cardIntents"');
  const blkIdx = html.indexOf('data-f="title"');
  check(catIdx > 0 && intIdx > 0, "ci2a Category and Intent containers are present in editorHtml");
  check(catIdx < blkIdx && intIdx < blkIdx, "ci2b Category and Intent move before language blocks (cat: " + catIdx + ", int: " + intIdx + ", blocks: " + blkIdx + ")");
  if (retIdx >= 0) check(retIdx < catIdx && retIdx < intIdx, "ci2c retBox stays before Category and Intent");

  // ci3: Assigned intents show as chips, each with a remove button
  check(/class="chips"/.test(html) && /class="chip"/.test(html), "ci3a assigned intents show inside .chips container as .chip");
  check(/data-act="intent-remove"[^>]*data-id="in-01"/.test(html), "ci3b chip in-01 carries a remove button with data-act=\"intent-remove\"");
  check(/data-act="intent-remove"[^>]*data-id="in-02"/.test(html), "ci3c chip in-02 carries a remove button with data-act=\"intent-remove\"");

  // ci4: Search filters catalog intents in the shown language and offers only those not yet assigned
  check(typeof P.intentFound === "function", "ci4b P.intentFound is defined");
  if (typeof P.intentFound === "function") {
    const unassigned = P.intentFound(card1, "");
    check(unassigned.length === 73, "ci4c with empty query, offers all 73 unassigned intents");
    check(unassigned.every(t => t.id !== "in-01" && t.id !== "in-02"), "ci4d offers do not include already assigned intents");

    const filtered = P.intentFound(card1, "tracking");
    check(filtered.length === 1 && filtered[0].id === "in-10", "ci4e searching 'tracking' filters to intent 10");

    // Polish screen language
    P.S.lang = "pl";
    const filteredPl = P.intentFound(card1, "paczki");
    check(filteredPl.length === 1 && filteredPl[0].id === "in-20", "ci4f on Polish screen, filters in Polish ('paczki' finds intent 20)");
    P.S.lang = "en";
  }

  // ci5: Search with no match shows copywriter sentence
  if (typeof P.intentFoundHtml === "function") {
    P.S.intentPick = { q: "nonexistent xyz", at: 0, open: true };
    const emptyHtml = P.intentFoundHtml(card1);
    check(emptyHtml.indexOf("No intent matches this.") >= 0, "ci5a search with no match shows 'No intent matches this.'");

    const homePl = loadPage({ uiLang: "pl" });
    const PPl = homePl.page;
    PPl.S.host = P.S.host;
    PPl.S.open = P.S.open;
    PPl.S.screen = "project";
    PPl.S.section = "cards";
    PPl.S.sel = "c1";
    PPl.S.lang = "pl";
    PPl.S.intentPick = { dir: P.S.open.dir, id: "c1", q: "nonexistent xyz", at: 0, open: true };
    const emptyHtmlPl = PPl.intentFoundHtml(card1);
    check(emptyHtmlPl.indexOf("Żadna intencja do tego nie pasuje.") >= 0, "ci5b on Polish screen, shows 'Żadna intencja do tego nie pasuje.'");
    const edPl = PPl.editorHtml(card1);
    check(edPl.indexOf("Szukaj intencji do dodania") >= 0, "ci5c Polish editor shows placeholder 'Szukaj intencji do dodania'");
    check(edPl.indexOf("Usuń z tej karty: Intencja 01") >= 0, "ci5d Polish editor shows chip remove title 'Usuń z tej karty: Intencja 01'");
  } else {
    check(false, "ci5a intentFoundHtml is defined");
  }

  // ci6: Escape in search closes list and leaves search
  if (typeof P.intentKey === "function") {
    let blurred = false;
    const dummyEl = {
      id: "intentFind",
      closest: () => null,
      getAttribute: () => null,
      blur() { blurred = true; },
    };
    P.S.intentPick = { q: "abc", at: 0, open: true };
    const res = P.intentKey({
      target: dummyEl,
      key: "Escape",
      preventDefault() {},
      stopPropagation() {},
    });
    check(res === "close" && P.S.intentPick && !P.S.intentPick.open && blurred, "ci6 Escape in search closes list and blurs the field");
  } else {
    check(false, "ci6 intentKey is defined");
  }

  // ci7: Add and remove reach c.requests and trigger save
  saved.length = 0;
  if (typeof P.intentAdd === "function") {
    P.intentAdd(card1, "in-10");
    check(card1.requests.indexOf("in-10") >= 0, "ci7a intentAdd adds in-10 to card requests");
    check(saved.length > 0 && saved[saved.length - 1].patch.requests.indexOf("in-10") >= 0, "ci7b intentAdd triggers queueSave with new requests");
  } else {
    check(false, "ci7a intentAdd is defined");
  }

  if (typeof P.intentRemove === "function") {
    P.intentRemove(card1, "in-01");
    check(card1.requests.indexOf("in-01") < 0, "ci7c intentRemove removes in-01 from card requests");
    check(saved.length > 0 && saved[saved.length - 1].patch.requests.indexOf("in-01") < 0, "ci7d intentRemove triggers queueSave without in-01");
  } else {
    check(false, "ci7c intentRemove is defined");
  }

  // ci8: Lint focus for requests lands on the new search control
  if (typeof P.focusFinding === "function") {
    let focused = null;
    const origQuery = home.doc.querySelector;
    home.doc.querySelector = (sel) => {
      const el = origQuery ? origQuery.call(home.doc, sel) : { focus() {} };
      el.focus = () => { focused = sel; };
      return el;
    };
    const found = P.focusFinding("cards", "c1", "requests", "");
    check(found && focused === "#intentFind", "ci8 focusFinding for requests targets #intentFind (got: " + focused + ")");
    home.doc.querySelector = origQuery;
  } else {
    check(false, "ci8 focusFinding is available");
  }

  check(asserted >= 18, "ci9 all checks ran (" + asserted + " assertions, " + failed + " failures)");
  process.stdout.write("card-intents  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  if (failed > 0) process.exit(1);
}

run();
