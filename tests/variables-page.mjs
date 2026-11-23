/* THE VARIABLES PAGE AND A CARD USING VARIABLES: node tests/variables-page.mjs [--keep].
 *
 * Maxim, 2026-10-06 21:51: "I think that "A Rules, read as a mail filter's" is the most sensible." And 22:03: "Agreed on
 * 2. A card using variables, in Studio's editor". The design is Claudia's sheet of that day, the words Claudette's
 * (state/drafts/variables-2026-10-06.md in the office), whose pairs WORDS below copies so that a word changed in either
 * place without the other reddens 1a. What a rule writes is the pinned engine's variables.js, loaded here as the page
 * loads it; nothing in this file restates a rule.
 *
 * The page runs on tests/page-stand-in.mjs over the real verbs of src/studio.mjs on a scratch project, as
 * tests/studio-about.mjs does. Markup, state and files only.
 *
 *   1  the words are the draft's pairs, English and Polish; the lint's three new lines have frames
 *   2  saveVariables writes the format's key whole, takes it away when emptied, and the engine's reader takes the file
 *   3  the page lists Etiuda's own in order and the team's under them, and opens one
 *   4  the team's address: a choice writes the engine's own rules for it, its examples are the engine's answer, and
 *      Back to Etiuda's own takes it away with an Undo that brings it back
 *   5  a variable made from nothing: its name refused until it is one, refused when taken, kept once it is; its rules
 *      added, conditioned, worded, moved and deleted, Otherwise last throughout
 *   6  the hours: a moved evening is kept, an order that cannot be is not, and Etiuda's own is said under it
 *   7  a card using variables: Insert variable, the chips with what they write for the test customer, the inline form
 *      explained rule by rule, Another customer, and a token taken in where the { was typed
 *   8  the lint knows a team's token, says a short inline form, and lists a card overriding the address
 *  10  a variables save that lands takes back a forced close, as every other saver does
 *
 * WHAT IT CANNOT SEE, said rather than implied: layout, the menus' place, drag itself (the move is driven by its
 * function), the caret, focus, the contenteditable's own editing, and how any of it looks, which is Maxim's eye. A window
 * leg for those is "argued after midnight" in the report that added this file, not run.
 *
 * Node only, no window, no Electron. Exit 0 when every check holds, 1 when any fails.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as S from "../src/studio.mjs";
import * as Engine from "../src/engine.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { loadPage } from "./page-stand-in.mjs";
import { LINT_FRAMES } from "../src/lint-said.mjs";
import { DRAFT_FILE } from "../src/publish.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "variables-page");
const EXPECTED = 38;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}
const wire = (p) => Promise.resolve(p)
  .then(v => JSON.parse(JSON.stringify(Object.assign({ error: null }, v))))
  .catch(e => ({ error: e && e.message ? e.message : String(e), said: (e && e.said) || null, disk: !!(e && e.disk) }));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const el = (attrs, more) => Object.assign({ getAttribute: (k) => (attrs[k] == null ? null : attrs[k]) }, more || {});
const text = (h) => String(h || "").replace(/<[^>]*>/g, "").split("&quot;").join('"').split("&#39;").join("'")
  .split("&lt;").join("<").split("&gt;").join(">").split("&amp;").join("&");

/* The pinned engine's two modules as the page loads them: imported by the renderer, evaluated here, since this
   package is CommonJS and an ES module .js cannot be imported in node (src/engine.mjs v2BodyTools does the same). */
function engineVars() {
  const mod = (f, names) => new Function(fs.readFileSync(path.join(Engine.PINNED, "src", "modules", f), "utf8")
    .replace(/\nexport \{[\s\S]*$/, "\n") + "\nreturn {" + names.join(",") + "};")();
  const src = fs.readFileSync(path.join(Engine.PINNED, "src", "modules", "variables.js"), "utf8");
  const names = (/\nexport \{([\s\S]*)\};?\s*$/.exec(src) || [, ""])[1].split(",").map(s => s.trim()).filter(Boolean);
  return Object.assign(mod("variables.js", names), mod("polish.js", ["plVocative", "zForm"]));
}

/* CLAUDETTE'S PAIRS, as the draft writes them. A key ending " ##" and a word is one English sentence with two Polish ones. */
const WORDS = [
  ["A1", "Variables", "Zmienne"],
  ["A2", "Words a desk writes in as a card is copied, chosen by the hour, the language, the customer's name and gender, the intent and the agent. Change Etiuda's own, or make your own.", "Słowa, które stanowisko wstawia w chwili kopiowania karty, dobrane do godziny, języka, imienia i płci klienta, intencji i agenta. Wbudowane można zmieniać, a własne tworzyć od zera."],
  ["A3", "New variable", "Nowa zmienna"], ["A4", "Etiuda's own", "Wbudowane"], ["A5", "Your team's", "Własne"],
  ["A6", "Your team's variables gather here.", "Tu pojawią się własne zmienne zespołu."],
  ["A7", "Etiuda's own ##chip", "wbudowana"], ["A8", "your team's", "własna"], ["A9", "changed", "zmieniona"], ["A10", "new", "nowa"],
  ["A11", "Greeting by the hour", "Powitanie dobrane do godziny"], ["A12", "The customer, addressed", "Zwrot do klienta"],
  ["A13", "The customer's full name, for a mention", "Imię i nazwisko klienta, do wzmianki"],
  ["A14", "Words by the customer's gender", "Słowa dobrane do płci klienta"], ["A15", "Words by the time of day", "Słowa dobrane do pory dnia"],
  ["A16", "The intent picked", "Wybrana intencja"], ["A17", "The chat's topic", "Temat rozmowy"],
  ["A18", "The agent's name as customers see it", "Imię agenta widoczne dla klientów"], ["A19", "The agent's initials", "Inicjały agenta"],
  ["A20", "Who is on the chat, for a note", "Kto jest po drugiej stronie czatu, do notatki"], ["A21", "What was done, for a note", "Co zrobiono, do notatki"],
  ["A23", "Back to Etiuda's own", "Przywróć ustawienia domyślne"], ["A24", "Restored Etiuda's own {VAR}.", "Przywrócono domyślne ustawienia {VAR}."],
  ["A25", "Delete", "Usuń"], ["A26", "Deleted the variable {VAR}.", "Usunięto zmienną {VAR}."],
  ["A27", "Name, in capitals", "Nazwa wielkimi literami"], ["A28", "What it is for", "Do czego służy"],
  ["A29", "Capital letters and digits, starting with a letter.", "Wielkie litery i cyfry, na początku litera."],
  ["A30", "{VAR} is already a variable here.", "Zmienna {VAR} już tu jest."],
  ["A31", "How the team addresses customers", "Jak zespół zwraca się do klientów"], ["A32", "Polish cards", "Karty po polsku"],
  ["A33", "First name ##address", "Po imieniu"], ["A34", "Pani or Pan, with the first name", "Pani lub Pan z imieniem"],
  ["A35", "Pani or Pan, with the surname", "Pani lub Pan z nazwiskiem"], ["A36", "No name", "Bez imienia"],
  ["A37", "English cards", "Karty po angielsku"], ["A38", "Title and surname", "Tytuł i nazwisko"],
  ["A39", "The desk reads the customer's gender from the first name, and the agent corrects it in one click.", "Płeć klienta stanowisko odczytuje z imienia, a agent poprawia ją jednym kliknięciem."],
  ["A41", "Rules: the first that fits writes its words", "Reguły: słowa wstawia pierwsza pasująca"],
  ["A42", "If", "Jeśli"], ["A43", "Write", "Wstaw"], ["A44", "or", "lub"], ["A45", "and", "i"], ["A46", "Add a condition", "Dodaj warunek"],
  ["A47", "Otherwise", "W innym razie"], ["A48", "Add a rule", "Dodaj regułę"], ["A49", "Rule {N}", "Reguła {N}"],
  ["A50", "Drag to change the order", "Przeciągnij, aby zmienić kolejność"], ["A51", "Remove this rule", "Usuń tę regułę"],
  ["A52", "Choose a condition", "Wybierz warunek"], ["A53", "Etiuda's own: {VALUE}", "Domyślnie: {VALUE}"], ["A54", "left blank", "puste"],
  ["A55", "The clock", "Zegar"], ["A56", "Time", "Godzina"], ["A57", "Day of the week", "Dzień tygodnia"], ["A58", "Date", "Data"],
  ["A59", "Time of day", "Pora dnia"], ["A60a", "The card", "Karta"], ["A60b", "Language", "Język"], ["A61", "The customer", "Klient"],
  ["A62", "Full name", "Imię i nazwisko"], ["A63", "First name", "Imię"], ["A64", "Gender", "Płeć"], ["A65", "The chat", "Rozmowa"],
  ["A66", "Intent", "Intencja"], ["A67", "Number of intents", "Liczba intencji"], ["A68", "Topic", "Temat"], ["A69", "The desk", "Stanowisko"],
  ["A70", "Agent", "Agent"], ["A71", "Role", "Rola"],
  ["A72", "is", "to"], ["A73", "is not", "to nie"], ["A74", "is one of", "jest wśród"], ["A75", "is before", "przed"], ["A76", "is after", "po"],
  ["A77", "is more than", "jest większa niż"], ["A78", "is less than", "jest mniejsza niż"], ["A79", "is set", "ma wartość"],
  ["A80", "is not set", "nie ma wartości"],
  ["A81", "male", "męska"], ["A82", "female", "żeńska"], ["A83", "nonbinary", "niebinarna"], ["A84", "morning", "ranek"],
  ["A85", "afternoon", "popołudnie"], ["A86", "evening", "wieczór"], ["A87", "not set ##value", "brak"],
  ["A88", "One picked", "Jedna wybrana"], ["A89", "Several picked", "Kilka wybranych"],
  ["A90", "The hours, shared with {DAYPART}", "Godziny pór dnia, wspólne z {DAYPART}"],
  ["A91", "Morning from", "Ranek od"], ["A92", "Afternoon from", "Popołudnie od"], ["A93", "Evening from", "Wieczór od"],
  ["A94", "first name, vocative", "imię w wołaczu"], ["A95", "first name", "imię"], ["A96", "surname", "nazwisko"],
  ["A97", "the intent's own words", "słowa intencji"], ["A98", "the intents, joined with “and”", "intencje połączone słowem „oraz”"],
  ["A99", "In a card", "W karcie"], ["A100", "{WORDS} ({DAY}, {TIME})", "{WORDS} ({DAY}, {TIME})"],
  ["A101", "This card's own words, rule by rule:", "Własne słowa karty, reguła po regule:"],
  ["E1", "Insert variable", "Wstaw zmienną"], ["E2", "or type { in the text", "lub wpisz { w tekście"],
  ["E3", "words by gender", "słowa według płci"], ["E4", "words by the hour", "słowa według pory dnia"],
  ["E5", "As {NAME} would read them on {DAY} at {TIME}", "Tak przeczyta je {NAME}: {DAY}, {TIME}"],
  ["E6", "Shown for {NAME} ({GENDER}), {DAY} {TIME}, {INTENT}", "Pokazano dla: {NAME} (płeć {GENDER}), {DAY}, {TIME}, {INTENT}"],
  ["E7", "Another customer", "Inny klient"],
  ["E8", "{TOKEN} gives this card's own words to each rule of {VAR}, in order:", "{TOKEN} daje kolejnym regułom zmiennej {VAR} własne słowa tej karty:"],
  ["E9", "{RULE}: {WORDS}", "{RULE}: {WORDS}"], ["E10", "{RULE}: the first words stand in", "{RULE}: wstawiane są pierwsze słowa"],
  ["L1", "This card gives {VAR} fewer words than it has rules; the rest write the first.", "Ta karta podaje dla {VAR} mniej słów, niż zmienna ma reguł; w pozostałych wstawiane są pierwsze."],
  ["L2", "This card gives {GENDER} no words for nonbinary, so for a nonbinary customer the desk leaves that place to the agent.", "Ta karta nie podaje słów {GENDER} dla płci niebinarnej, więc przy płci niebinarnej stanowisko zostawi to miejsce agentowi."],
  ["L4", "This card sets {PAX} by hand, apart from the catalog's address.", "Ta karta ustawia {PAX} ręcznie, niezależnie od zwrotu w katalogu."],
];

async function main(argv) {
  clearScratch(SCRATCH);
  const root = path.join(SCRATCH, "projects");
  fs.mkdirSync(root, { recursive: true });
  const made = await S.newProject(root, "Variables page", [{ code: "pl" }, { code: "en" }]);
  const dir = made.dir;
  const shelf = (await S.addTag(dir, "shelf", { pl: "Dostawa", en: "Delivery" })).tag.id;
  const late = (await S.addTag(dir, "request", { pl: "opóźnioną dostawą", en: "a late delivery" })).tag.id;
  const back = (await S.addTag(dir, "request", { pl: "zwrotem", en: "a return" })).tag.id;
  const cardId = (await S.addCard(dir, shelf, "Spóźnienie", "{GREET}, {PAX}.")).card.id;
  const draftAt = () => path.join(dir, JSON.parse(fs.readFileSync(path.join(dir, "project.json"), "utf8")).draft || DRAFT_FILE);
  const file = () => JSON.parse(fs.readFileSync(draftAt(), "utf8"));
  const VARS = engineVars();

  const api = {
    saveVariables: (d, v) => wire(S.saveVariables(d, v)),
    saveCard: (d, i, p) => wire(S.saveCard(d, i, p)),
    saveFacts: (d, t) => wire(S.saveFacts(d, t)),
  };
  const pageIn = (uiLang) => {
    const home = loadPage({ api, uiLang, vars: VARS });
    return { home, P: home.page };
  };
  const openIn = async (P, section) => {
    const open = await wire(S.openProject(dir));
    Object.assign(P.S, { open, screen: "project", section: section || "variables", lang: "both" });
    return open;
  };

  /* ---- 1. THE WORDS ------------------------------------------------------------------------------------------------ */
  {
    const en = pageIn("en").P, pl = pageIn("pl").P;
    const off = WORDS.filter(([, e, p]) => en.T(e) !== e.replace(/ ##[a-z]+$/, "") || pl.T(e) !== p).map(r => r[0]);
    check(off.length === 0, "1a each of the draft's " + WORDS.length + " pairs is ui/lang.js's, English as written and Polish as written"
      + (off.length ? "; off: " + off.join(", ") : ""));
    const frames = LINT_FRAMES.map(f => f[0]);
    check(["L1", "L2", "L4"].every(id => frames.indexOf(WORDS.find(w => w[0] === id)[1]) >= 0),
      "1b the lint's three lines are frames, so a Polish screen says them");
    check(en.T("Etiuda's own ##chip") === "Etiuda's own" && pl.T("Etiuda's own") === "Wbudowane" && pl.T("Etiuda's own ##chip") === "wbudowana",
      "1c one English sentence, two Polish ones: the word after ## tells them apart and is never shown");
  }

  /* ---- 2. THE VERB ------------------------------------------------------------------------------------------------- */
  {
    const v = { list: [{ name: "REPLYBY", about: "When our email will come", rules: [
      { name: "Courier", when: [{ fact: "intent", op: "oneof", value: [late] }], write: { pl: "gdy kurier odpowie", en: "as soon as the courier answers" } },
      { when: [], write: { pl: "w ciągu godziny", en: "within the hour" } }] }] };
    const r = await wire(S.saveVariables(dir, v));
    const f = file();
    const V2 = Engine.v2BodyTools ? null : null; void V2;
    check(!r.error && JSON.stringify(f.variables) === JSON.stringify(v) && /^djb2:/.test(f.hash),
      "2a saveVariables writes the format's key whole and the draft's hash after it");
    const lint = r.lint || {};
    check(lint.errors === 0, "2b and the engine's reader, through the lint, takes the file: " + JSON.stringify({ errors: lint.errors, warnings: lint.warnings }));
    await wire(S.saveVariables(dir, { list: [] }));
    check(!("variables" in file()), "2c emptied, the key goes: a catalog that has no variables carries none");
  }

  /* ---- 3. THE PAGE --------------------------------------------------------------------------------------------------- */
  {
    const { home, P } = pageIn("en");
    await openIn(P);
    P.paint();
    const main = home.node("#main").innerHTML;
    check(text(main).indexOf("Your team's variables gather here.") >= 0 && /<h1>Variables<\/h1>/.test(main)
          && main.indexOf("Words a desk writes in") >= 0 && /data-act="vr-new"/.test(main),
      "3b the title, the summary, New variable, and the team's empty group saying what gathers there");
    check(/class="vr-li on"[^>]*data-v="PAX"/.test(main) && main.indexOf("How the team addresses customers") >= 0,
      "3c the page opens on {PAX}, with the team's address at its head");
    const rail = home.node("#rail").innerHTML;
    check(/data-v="variables"[^>]*>.*Variables.*<span class="num">11<\/span>/.test(rail), "3d the rail's row, under Quick facts, counting 11");
  }

  /* ---- 4. THE TEAM'S ADDRESS ------------------------------------------------------------------------------------------ */
  {
    const { home, P } = pageIn("en");
    await openIn(P);
    P.paint();
    P.ACTS["vr-pax"](el({ "data-l": "pl", "data-v": "titleFirst" }));
    await P.flushVars();
    const want = VARS.varAddressRules("titleFirst", "first");
    check(JSON.stringify(file().variables) === JSON.stringify({ list: [{ name: "PAX", rules: want }] }),
      "4a Pani or Pan, with the first name, writes the engine's own rules for that choice");
    P.paint();
    const main = home.node("#main").innerHTML;
    const ex = [...main.matchAll(/<span class="vr-ex">([^<]*)<\/span>/g)].map(m => text(m[1]));
    check(ex.slice(3, 6).join("|") === "Anna: Pani Anno|Tomasz: Panie Tomaszu|Kim: Kim",
      "4b the choice's examples are the engine's answer for a female, a male and an open name (by the first name, never \"Państwo\" in one person's slot since engine 41b180d1): " + JSON.stringify(ex.slice(3, 6)));
    P.ACTS["vr-pax"](el({ "data-l": "en", "data-v": "titleSurname" }));
    await P.flushVars();
    const pax = file().variables.list[0];
    check(pax.rules[0].write.en === "Mr {@surname}" && JSON.stringify(pax.rules) === JSON.stringify(VARS.varAddressRules("titleFirst", "titleSurname")),
      "4c English cards, Title and surname, joins the Polish choice in the same rules");
    P.ACTS["vr-back"]();
    await P.flushVars();
    const bar = home.node("#undo").innerHTML;
    check(!("variables" in file()) && text(bar).indexOf("Restored Etiuda's own {PAX}.") >= 0 && /data-act="card-undo"/.test(bar),
      "4d Back to Etiuda's own takes the rules away, and the bar says so with an Undo: " + JSON.stringify(text(bar)));
    await P.ACTS["card-undo"]();
    await P.flushVars();
    check(file().variables && file().variables.list[0].name === "PAX" && P.S.undo === null, "4e and Undo brings them back");
    P.ACTS["vr-back"](); await P.flushVars(); P.S.undo = null;
  }

  /* ---- 5. A VARIABLE MADE FROM NOTHING ---------------------------------------------------------------------------------- */
  {
    const { home, P } = pageIn("en");
    await openIn(P);
    P.paint();
    P.ACTS["vr-new"]();
    const nameEl = (v) => el({ "data-vr": "name" }, { value: v, parentNode: { querySelector: () => null }, insertAdjacentHTML() {} });
    P.vrInput(nameEl("replyBy"));
    const bad = P.vrNameSaid("replyBy", null), taken = P.vrNameSaid("GREET", null);
    check(!file().variables && bad === "Capital letters and digits, starting with a letter."
          && taken === "{GREET} is already a variable here.",
      "5a a name that will not do is said and nothing is written; a name taken is said too");
    P.vrInput(nameEl("REPLYBY"));
    await P.flushVars();
    const made = (file().variables || { list: [] }).list.find(d => d.name === "REPLYBY");
    check(!!made && P.S.vr.name === "REPLYBY" && made.rules.length === 2 && made.rules[1].when.length === 0,
      "5b once it is a name it is kept, with one empty rule and Otherwise");
    P.ACTS["vr-fact"](el({ "data-act": "vr-fact", "data-ri": "0", "data-ci": "0", "data-v": "intent" }));
    P.vrInput(el({ "data-vr": "op", "data-ri": "0", "data-ci": "0" }, { value: "oneof" }));
    P.vrInput(el({ "data-vr": "oneof-add", "data-ri": "0", "data-ci": "0" }, { value: back }));
    P.vrInput(el({ "data-vr": "oneof-add", "data-ri": "0", "data-ci": "0" }, { value: back }));
    const wnode = { childNodes: [{ nodeType: 3, nodeValue: "jutro, " },
      { nodeType: 1, nodeName: "SPAN", getAttribute: (k) => (k === "data-w" ? "first-voc" : null), childNodes: [] }] };
    P.vrInput(el({ "data-vr": "write", "data-ri": "0", "data-l": "pl" }, wnode));
    P.ACTS["vr-rule-add"]();
    P.ACTS["vr-fact"](el({ "data-act": "vr-fact", "data-ri": "1", "data-ci": "0", "data-v": "weekday" }));
    await P.flushVars();
    let d = file().variables.list.find(x => x.name === "REPLYBY");
    check(JSON.stringify(d.rules[0].when) === JSON.stringify([{ fact: "intent", op: "oneof", value: [late, back] }])
          && d.rules[0].write.pl === "jutro, {@first-voc}" && d.rules.length === 3
          && JSON.stringify(d.rules[1].when) === JSON.stringify([{ fact: "weekday", op: "is", value: 6 }]),
      "5c a condition chosen, its comparison turned to one of, a value added once however often it is offered, the words with the desk's own chip, a second rule: "
      + JSON.stringify(d.rules.slice(0, 2)));
    P.vrMoveRule(1, 0);
    await P.flushVars();
    d = file().variables.list.find(x => x.name === "REPLYBY");
    const moved = d.rules[0].when[0].fact === "weekday" && d.rules[2].when.length === 0;
    P.vrMoveRule(0, 2);
    await P.flushVars();
    d = file().variables.list.find(x => x.name === "REPLYBY");
    check(moved && d.rules[2].when.length === 0 && d.rules[1].when[0].fact === "weekday",
      "5d a rule dragged up moves, and one dragged past the end stops above Otherwise, which stays last");
    P.paint();
    const main = home.node("#main").innerHTML;
    check(/<span class="chip vr-w" contenteditable="false" data-w="first-voc">first name, vocative<\/span>/.test(main)
          && main.indexOf(">Otherwise<") >= 0 && main.indexOf('title="Drag to change the order"') >= 0,
      "5e the words show the chip by its name, Otherwise heads the last rule, and a rule can be dragged");
    P.ACTS["vr-del"]();
    await P.flushVars();
    check(!(file().variables || { list: [] }).list.some(x => x.name === "REPLYBY") && text(home.node("#undo").innerHTML).indexOf("Deleted the variable {REPLYBY}.") >= 0,
      "5f Delete takes it away, with an Undo");
    await P.ACTS["card-undo"](); await P.flushVars(); P.S.undo = null;

    // 5g: typing HOURS letter by letter keeps one variable, HOURS, with the field still focused
    P.ACTS["vr-new"]();
    const mainBefore = home.node("#main").innerHTML;
    ["H", "HO", "HOU", "HOUR", "HOURS"].forEach((s) => {
      P.vrInput(nameEl(s));
    });
    await P.flushVars();
    const list = (file().variables || { list: [] }).list;
    const hoursCount = list.filter((x) => x.name === "HOURS").length;
    const hCount = list.filter((x) => x.name === "H").length;
    const mainAfter = home.node("#main").innerHTML;
    check(hoursCount === 1 && hCount === 0 && list.length === 2 && P.S.vr.name === "HOURS" && mainAfter === mainBefore,
      "5g typing HOURS letter by letter keeps one variable, HOURS, with no intermediate variables and no repaint dropping focus");

    // 5h: picking another variable while a new draft has text in it asks before discarding
    P.ACTS["vr-new"]();
    P.vrInput(nameEl("draftName"));
    P.ACTS["vr-open"](el({ "data-v": "PAX" }));
    const asked = P.S.cover === "vr-discard" && P.S.vr.fresh !== null && P.S.vr.name === "";
    P.ACTS["cover-close"]();
    const kept = P.S.cover === null && P.S.vr.fresh !== null && P.S.vr.name === "";
    P.ACTS["vr-open"](el({ "data-v": "PAX" }));
    P.ACTS["vr-discard-go"]();
    const gone = P.S.cover === null && P.S.vr.fresh === null && P.S.vr.name === "PAX";
    check(asked && kept && gone,
      "5h picking another variable while a draft has text asks before discarding, Cancel keeps the draft, and Discard opens the picked variable");

    // 5i: picking another variable on an empty draft opens without asking
    P.ACTS["vr-new"]();
    P.ACTS["vr-open"](el({ "data-v": "PAX" }));
    check(!P.S.cover && P.S.vr.fresh === null && P.S.vr.name === "PAX",
      "5i picking another variable on an empty draft opens without asking");
  }

  /* ---- 6. THE HOURS --------------------------------------------------------------------------------------------------- */
  {
    const { home, P } = pageIn("en");
    await openIn(P);
    P.S.vr = { name: "GREET" };
    P.paint();
    P.vrInput(el({ "data-vr": "hour", "data-k": "evening" }, { value: "17:00" }));
    await P.flushVars();
    const kept = (file().variables || {}).hours;
    P.vrInput(el({ "data-vr": "hour", "data-k": "evening" }, { value: "11:00" }));
    await P.flushVars();
    check(kept && kept.evening === "17:00" && file().variables.hours.evening === "17:00",
      "6a an evening moved to 17:00 is kept, and one before the afternoon is not: " + JSON.stringify(file().variables.hours));
    P.S.vr.hours = null; P.paint();
    const main = home.node("#main").innerHTML;
    check(text(main).indexOf("Etiuda's own: 18:00") >= 0 && /data-v="GREET"[^>]*>.*?changed/.test(main.replace(/\n/g, "")),
      "6b Etiuda's own hour is said under the moved one, and the list marks {GREET} changed");
    P.ACTS["vr-back"](); await P.flushVars(); P.S.undo = null;
    const left = file().variables || {};
    check(!left.hours && !(left.list || []).some(x => x.name === "GREET"), "6c Back to Etiuda's own puts the hours back");
  }

  /* ---- 7. A CARD USING VARIABLES --------------------------------------------------------------------------------------- */
  {
    await wire(S.saveVariables(dir, { list: [{ name: "PAX", rules: VARS.varAddressRules("titleFirst", "first") },
      { name: "REPLYBY", rules: [{ when: [{ fact: "gender", op: "is", value: "m" }], write: { pl: "jutro" } }, { when: [], write: { pl: "dziś" } }] }] }));
    const { home, P } = pageIn("en");
    await openIn(P, "cards");
    P.S.sel = cardId;
    const body = "{GREET}, {PAX}. Czy {GENDER:otrzymał Pan|otrzymała Pani} wiadomość {REPLYBY}? {NOPE}";
    const ed = P.editorHtml(P.cardById(cardId));
    check(ed.indexOf('data-act="vr-insert"') >= 0 && text(ed).indexOf("Insert variable") >= 0 && text(ed).indexOf("or type { in the text") >= 0,
      "7a under the text, Insert variable and the line beside it");
    const chips = P.chipsFor(body, "pl");
    const pairs = [...chips.matchAll(/<span class="vr-pair"><span class="chip">([^<]*)<\/span><span class="vr-val">([^<]*)<\/span><\/span>/g)]
      .map(m => text(m[1]) + "=" + text(m[2]));
    check(pairs.join("|") === "{GREET}=Dzień dobry|{PAX}=Pani Anno|{GENDER:otrzymał Pan|otrzymała Pani}=otrzymała Pani|{REPLYBY}=dziś"
          && /<span class="chip err">\{NOPE\}<\/span>/.test(chips),
      "7b each chip says what it writes for Anna on Tuesday at 17:20, and a token nobody defines stays an error: " + JSON.stringify(pairs));
    check(text(chips).indexOf("Shown for Anna Kowalska (female), Tuesday 17:20, opóźnioną dostawą") >= 0 && /data-act="vr-test"/.test(chips),
      "7c the customer is said above the chips, with Another customer beside it");
    const inl = text(chips);
    check(inl.indexOf("{GENDER:otrzymał Pan|otrzymała Pani} gives this card's own words to each rule of {GENDER}, in order:") >= 0
          && inl.indexOf("Male: otrzymał Pan") >= 0 && inl.indexOf("Female: otrzymała Pani") >= 0
          && inl.indexOf("This card gives {GENDER} no words for nonbinary") >= 0,
      "7d the inline form explained rule by rule, the nonbinary place left to the agent said");
    P.ACTS["vr-test"]();
    const chips2 = P.chipsFor(body, "pl");
    check(text(chips2).indexOf("Shown for Tomasz Nowak (male)") >= 0 && chips2.indexOf(">Panie Tomaszu<") >= 0 && chips2.indexOf(">jutro<") >= 0,
      "7e Another customer turns the chips to Tomasz, his address and the team's own word for him");
    P.S.vrTest = 0;
    const menu = P.vrInsHtml("pl");
    const items = [...menu.matchAll(/data-act="vr-ins" data-v="([^"]+)"/g)].map(m => m[1]);
    check(items[0] === "REPLYBY" && items.indexOf("GREET") > 0 && text(menu).indexOf("words by gender") >= 0
          && text(menu).indexOf("As Anna Kowalska would read them on Tuesday at 17:20") >= 0,
      "7f the insert menu: the team's first, then Etiuda's own with what each writes now, read for the test customer");
    /* the { typed, then a variable chosen: the token takes the brace's place */
    const ta = { value: "Dzień dobry {", selectionStart: 13, selectionEnd: 13, focus() {}, setSelectionRange() {} };
    const doc = home.doc, was = doc.querySelector;
    doc.querySelector = (sel) => (/textarea\[data-f="body"\]/.test(sel) ? ta : was.call(doc, sel));
    P.S.vrIns = { l: "pl", brace: true };
    P.vrInsTake("NAME");
    doc.querySelector = was;
    check(ta.value === "Dzień dobry {NAME}" && P.cardById(cardId).body.pl === "Dzień dobry {NAME}" && P.S.vrIns === null,
      "7g a variable chosen after a typed { takes the brace's place, and the card keeps the text");
    await P.flush();
  }

  /* ---- 8. THE LINT --------------------------------------------------------------------------------------------------- */
  {
    await wire(S.saveCard(dir, cardId, { body: { pl: "{REPLYBY:a} {GENDER:Pan|Pani}, {PAX}" } }));
    const r = await wire(S.saveVariables(dir, file().variables));
    const open = await wire(S.openProject(dir));
    const lines = JSON.stringify(open.lint);
    check(lines.indexOf("{REPLYBY} in the") < 0 && lines.indexOf("fewer words than it has rules") >= 0
          && lines.indexOf("no words for nonbinary") >= 0 && !r.error,
      "8a the lint knows the team's token, says the short inline form and the missing nonbinary word");
    await wire(S.saveCard(dir, cardId, { body: { pl: "Pytanie od {PAX}" } }));
    const f = file(); const c = f.cards.find(x => x.id === cardId); c.paxOwn = 1;
    delete f.hash; fs.writeFileSync(draftAt(), JSON.stringify(f));
    const open2 = await wire(S.openProject(dir));
    check(JSON.stringify(open2.lint).indexOf("sets {PAX} by hand, apart from the catalog") >= 0,
      "8b a card overriding {PAX} under the team's address is listed");
  }

  /* ---- 9. POLISH --------------------------------------------------------------------------------------------------- */
  {
    const { home, P } = pageIn("pl");
    await openIn(P);
    P.S.vr = { name: "PAX" };
    P.paint();
    const t = text(home.node("#main").innerHTML);
    check(t.indexOf("Zmienne") >= 0 && t.indexOf("Wbudowane") >= 0 && t.indexOf("wbudowana") >= 0 && t.indexOf("Po imieniu") >= 0
          && t.indexOf("Jak zespół zwraca się do klientów") >= 0 && t.indexOf("W innym razie") >= 0,
      "9a the page speaks Polish whole, the group and the chip each in their own form");
  }

  /* ---- 10. A SAVE THAT LANDS UNFORCES THE NEXT CLOSE --------------------------------------------------------------
     A close the disk refused sets closeForced, so the next close sends once more and goes whatever the answer. A save
     that lands afterwards has to take that back, or the close after a second refusal drops the refused edit without
     the held close first. The card, facts, tag and project savers did; the variables' did not (board 858, P7). Driven
     on the stand-in with the flag set and the verb answering yes; the facts' saver is the control. */
  {
    const yes = { saveVariables: async () => ({ error: null }), saveFacts: async () => ({ error: null, facts: "" }) };
    const after = async (flush, slot, job) => {
      const P = loadPage({ api: yes, uiLang: "en", vars: VARS }).page;
      P.__set("closeForced", true); P.__set(slot, job);
      const done = await P[flush]();
      return { done, forced: P.__get("closeForced") };
    };
    const vars = await after("flushVars", "varsPending", { dir: "d", variables: {} });
    const facts = await after("flushFacts", "factsPending", { dir: "d", text: "" });
    check(facts.done === true && facts.forced === false,
      "10a CONTROL: a facts save that lands takes the forced close back: " + JSON.stringify(facts));
    check(vars.done === true && vars.forced === false,
      "10b a variables save that lands takes the forced close back, as the facts' does: " + JSON.stringify(vars));
  }

  process.stdout.write("\nvariables-page  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  if (asserted !== EXPECTED) {
    process.stderr.write("variables-page  expected " + EXPECTED + " assertions, ran " + asserted + "\n");
    failed++;
  }
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "variables-page");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch((e) => {
  process.stdout.write("  FAIL the run threw: " + String(e && e.stack || e).split("\n").slice(0, 5).join(" | ") + "\n");
  process.exit(1);
});
