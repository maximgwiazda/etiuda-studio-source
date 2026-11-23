/* FRAMED IMPORT NOTES AND COVER FINDINGS (Hydrogen, 2026-11-16).
 *
 * gate-kind: node
 *
 *     node tests/import-frames.mjs
 *
 * Oracle for the framed import notes across src/source.mjs, src/mapping.mjs, src/import.mjs,
 * src/import-text.mjs, src/lint-said.mjs and ui/lang.js.
 *
 * Expected table rows per copywriter words file:
 *   - words-studio-import-notes-2026-11-15.md:       30 rows framed (1..10, 12, 14, 15, 17, 25..32, 34..36, 39, 40, 41..45, 48).
 *     (11 & 16 already framed before this build; 21..24, 46, 47 are internal codes shown via 5..8, 43, 44;
 *      33 is marked "offered: no note shows it today"; 13, 18, 19, 20, 37, 38 route to List 2.)
 *   - words-studio-import-notes-2-2026-11-15.md:     29 rows framed (1..5, 6, 7, 85, 87, 88, 90, 91, 92, 97, 98, 99, 101, 102, 103, 108, 110, 112, 115..122).
 *     (41 format-2 refusals stay as written inside "Etiuda's checks: {LINE}"; 111 is List 1 #12.)
 *   - words-studio-import-findings-2026-11-15.md:   5 items (1, 2, 3, 4a, 4b) share the 5 cover sites of List 1 #41, #42, #45, #43, #44
 *     under the cover's lower-case note rule (0 separate rows).
 *
 * Rule 3 base counts on commit b26b020a:
 *   clean:    1 ["warning"]
 *   dupid:    2 ["warning","error"]
 *   orphan:   2 ["warning","warning"]
 *   missing:  3 ["warning","warning","awaiting"]
 *   encoding: 3 ["warning","warning","note"]
 *   oneLang:  2 ["warning","awaiting"]
 *   f10a:     4 ["warning","warning","note","awaiting"]
 *   model:    2 ["awaiting","error"]
 *
 * Rules:
 *   r1  Every framed note raised through real code renders character-for-character in EN and PL.
 *   r2  No count bends a noun across counts 1, 2 and 5 in EN or PL.
 *   r3  Nothing is lost: note count, severities and order match base fixtures.
 *   r4  Completeness scan of src/ finds no unframed joined note() call, proved with a planted line.
 *   r5  Unframed engine lines stay verbatim inside "Etiuda's checks: {LINE}" in EN and PL.
 *
 * Rule 4 blind spots (named rather than silent):
 *   - A message joined into a variable before calling note(), noteOf(), engineNote() or
 *     findings.push() (for example `const m = "x: " + n; note("warning", m);`): note() and
 *     findings.push() legitimately receive variables holding noteOf() objects, so a call-site
 *     scan cannot reject bare identifiers there.
 *   - Any custom wrapper helper other than note(), noteOf(), engineNote() and findings.push().
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { zip } from "../tools/fixtures/workbook.mjs";
import { examine } from "../src/source.mjs";
import { mapHeaders } from "../src/mapping.mjs";
import { importCsv, awaitingOver } from "../src/import.mjs";
import { importText } from "../src/import-text.mjs";
import * as LintSaid from "../src/lint-said.mjs";
import { noteOf } from "../src/refusal.mjs";
import * as Engine from "../src/engine.mjs";
import { loadPage } from "./page-stand-in.mjs";
import { withoutComments } from "./source-text.mjs";
import { copyPlants } from "./plant-copy.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SELF = fileURLToPath(import.meta.url);
const SCRATCH = path.join(ROOT, "scratch", "import-frames");
const ONLY = process.env.IMPORT_FRAMES_ONLY || "";
const want = (id) => !ONLY || ONLY === id;

let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
function skip(line) {
  skipped++;
  process.stdout.write("  NOT RUN " + line + "\n");
}

/* ---- Expected wording table copied verbatim from the words files --------------------------- */

const WORDS_LIST1 = {
  "1": {
    en: "ask a model to find the cards in the text",
    pl: "poproś model o znalezienie kart w tekście",
  },
  "2": {
    en: "every sheet in this workbook is empty",
    pl: "wszystkie arkusze w tym skoroszycie są puste",
  },
  "3": {
    en: 'sheets with content in this workbook: {N}. Only "{SHEET}" was read; import the others separately',
    pl: "arkusze z zawartością w tym skoroszycie: {N}. Odczytano tylko \u201E{SHEET}\u201D; pozostałe należy zaimportować osobno",
  },
  "4": {
    en: "not read on a sheet: {WHAT} (parts: {N}). Such content cannot become cards",
    pl: "nie odczytano z arkusza: {WHAT} (części: {N}). Z takiej zawartości nie da się utworzyć kart",
  },
  "5": {
    en: "the cell {REF} is formatted as a date and was read as the number the file holds, not converted, because a workbook counts its dates from a starting day of its own",
    pl: "komórka {REF} ma format daty i odczytano ją jako liczbę zapisaną w pliku, bez przeliczania, bo skoroszyt liczy daty od własnego dnia początkowego",
  },
  "6": {
    en: "the cell {REF} holds a formula and no saved result, so it was read as empty. Open the workbook, let it calculate, save it and import again",
    pl: "komórka {REF} zawiera formułę bez zapisanego wyniku, więc odczytano ją jako pustą. Należy otworzyć skoroszyt, poczekać na przeliczenie, zapisać go i zaimportować ponownie",
  },
  "7": {
    en: "the cell {REF} holds a spreadsheet error and was read as that error's own text",
    pl: "komórka {REF} zawiera błąd arkusza i odczytano ją jako tekst tego błędu",
  },
  "8": {
    en: "the cell {REF} points at text this workbook does not hold",
    pl: "komórka {REF} wskazuje tekst, którego ten skoroszyt nie zawiera",
  },
  "9": {
    en: "merged regions on the sheet: {N}. The value of each is in its top-left cell and the rest of the region is empty in the file, so a merged heading reads as one cell and blanks",
    pl: "scalone obszary w arkuszu: {N}. Wartość każdego jest w jego lewej górnej komórce, a reszta obszaru jest w pliku pusta, więc scalony nagłówek zostanie odczytany jako jedna komórka i puste pola",
  },
  "10": {
    en: "the sheet has no cell with anything in it",
    pl: "w arkuszu nie ma żadnej komórki z zawartością",
  },
  "12-count": {
    en: "this draft is waiting for its {LANG} text: the catalog declares {LANGS}, and cards lacking {LANG}: {N} of {TOTAL}. A language beyond the first is optional, so the import stands as it is and the gap is shown here once rather than on every card. It publishes as it stands, and what is still missing is counted on the publish cover and in the release notes.",
    pl: "ten szkic czeka na tekst w języku {LANG}: katalog deklaruje {LANGS}, a karty bez języka {LANG}: {N} z {TOTAL}. Język inny niż pierwszy jest opcjonalny, więc import zostaje taki, jaki jest, a brak widać tu raz, a nie przy każdej karcie. Katalog publikuje się w tej postaci, a to, czego jeszcze brakuje, jest podane na ekranie publikacji i w informacjach o wydaniu.",
  },
  "12-says": {
    en: 'this draft is waiting for its {LANG} text: the catalog declares {LANGS}, and the engine says "{SAYS}". A language beyond the first is optional, so the import stands as it is and the gap is shown here once rather than on every card. It publishes as it stands, and what is still missing is counted on the publish cover and in the release notes.',
    pl: "ten szkic czeka na tekst w języku {LANG}: katalog deklaruje {LANGS}, a silnik podaje: \u201E{SAYS}\u201D. Język inny niż pierwszy jest opcjonalny, więc import zostaje taki, jaki jest, a brak widać tu raz, a nie przy każdej karcie. Katalog publikuje się w tej postaci, a to, czego jeszcze brakuje, jest podane na ekranie publikacji i w informacjach o wydaniu.",
  },
  "14": {
    en: "category keys declared in categories.csv that no row uses, so no category was made for them: {N} ({LIST}). An empty category is the first thing a customer sees go wrong",
    pl: "klucze kategorii zadeklarowane w categories.csv, których nie używa żaden wiersz, więc nie powstała dla nich kategoria: {N} ({LIST}). Pusta kategoria to pierwszy błąd, który widzi klient",
  },
  "15": {
    en: "intent clauses declared in intents.csv that no row names: {N} ({LIST}{MORE})",
    pl: "frazy intencji zadeklarowane w intents.csv, których nie wskazuje żaden wiersz: {N} ({LIST}{MORE})",
  },
  "17-plain": {
    en: "cards with search keywords: {K} of {C}. Keywords in all: {W}; found nowhere in the card's own title, body, note or category label: {O}. Only those add anything: every other keyword repeats a word the card already says, and the card is found without it. The keywords found only there are content, and content belongs in the card's text.",
    pl: "karty ze słowami kluczowymi: {K} z {C}. Słowa kluczowe łącznie: {W}; niewystępujące w tytule, treści, notatce ani nazwie kategorii karty: {O}. Tylko one coś dodają: każde inne słowo kluczowe powtarza słowo, które karta już zawiera, i karta znajduje się bez niego. Słowa kluczowe, które są tylko tam, to treść, a treść powinna być w tekście karty.",
  },
  "17-repeats": {
    en: "cards with search keywords: {K} of {C}. Keywords in all: {W}; found nowhere in the card's own title, body, note or category label: {O}. Only those add anything: every other keyword repeats a word the card already says, and the card is found without it. Cards whose keywords only repeat the card, and could be emptied with nothing lost: {R}. The keywords found only there are content, and content belongs in the card's text.",
    pl: "karty ze słowami kluczowymi: {K} z {C}. Słowa kluczowe łącznie: {W}; niewystępujące w tytule, treści, notatce ani nazwie kategorii karty: {O}. Tylko one coś dodają: każde inne słowo kluczowe powtarza słowo, które karta już zawiera, i karta znajduje się bez niego. Karty, których słowa kluczowe tylko powtarzają kartę i można je usunąć bez straty: {R}. Słowa kluczowe, które są tylko tam, to treść, a treść powinna być w tekście karty.",
  },
  "25": { en: "a drawing or a floating image", pl: "rysunek lub obraz pływający" },
  "26": { en: "a chart", pl: "wykres" },
  "27": { en: "an embedded picture", pl: "osadzony obraz" },
  "28": { en: "a cell comment", pl: "komentarz do komórki" },
  "29": { en: "a threaded comment", pl: "komentarz w wątku" },
  "30": { en: "a pivot table", pl: "tabela przestawna" },
  "31": { en: "a pivot table", pl: "tabela przestawna" },
  "32": { en: "an embedded object", pl: "osadzony obiekt" },
  "34": {
    en: "the file is not valid UTF-8 and was read as {ENC}; byte sequences a UTF-8 reader would have replaced: {N}. Check the letters of any card that looked wrong before this catalog goes out",
    pl: "plik nie jest poprawnym UTF-8 i odczytano go jako {ENC}; sekwencje bajtów, które czytnik UTF-8 by zastąpił: {N}. Przed wysłaniem katalogu należy sprawdzić litery w kartach, które wyglądały źle",
  },
  "35": {
    en: "joins proposed by the joining pass and refused, because their pieces are not one unbroken stretch of the file: {N}. Those cards are in the queue as the first pass proposed them",
    pl: "połączenia zaproponowane podczas łączenia i odrzucone, bo ich części nie tworzą jednego ciągłego fragmentu pliku: {N}. Te karty są w kolejce w postaci z pierwszego przebiegu",
  },
  "36": {
    en: "a card came back with no title and was given its own first line; proposal {I}",
    pl: "karta wróciła bez tytułu, więc jej tytułem został jej pierwszy wiersz; propozycja {I}",
  },
  "39": {
    en: "a proposal was refused before it reached the queue: {WHY}{LANGPART}{SPAN}",
    pl: "propozycję odrzucono, zanim trafiła do kolejki: {WHY}{LANGPART}{SPAN}",
  },
  "40": {
    en: "proposed bodies made of spans that are each in the file but not as one piece, so they join text from more than one place: {N}. The score counts such a body as invented, and a reader should look at them",
    pl: "proponowane treści złożone z fragmentów, z których każdy jest w pliku, ale nie w jednym kawałku, więc łączą tekst z różnych miejsc: {N}. Wynik liczy taką treść jako wymyśloną i należy się im przyjrzeć",
  },
  "41": {
    en: 'hidden rows read on the sheet "{SHEET}": {N}. They are in the import',
    pl: "ukryte wiersze odczytane z arkusza \u201E{SHEET}\u201D: {N}. Są w imporcie",
  },
  "42": {
    en: 'the sheet "{SHEET}" is hidden, and no visible sheet has anything in its cells, so the import is this sheet\'s cells',
    pl: "arkusz \u201E{SHEET}\u201D jest ukryty, a w komórkach żadnego widocznego arkusza nic nie ma, więc import pochodzi z komórek tego arkusza",
  },
  "43": {
    en: 'the cell {REF} shows "{SHOWN}" and was read as that text, not as the stored number "{STORED}"',
    pl: "komórka {REF} pokazuje \u201E{SHOWN}\u201D i odczytano ją jako ten tekst, a nie jako zapisaną liczbę \u201E{STORED}\u201D",
  },
  "44": {
    en: 'the cell {REF} has a number format this import cannot show, so the stored number "{STORED}" was kept',
    pl: "komórka {REF} ma format liczby, którego ten import nie odtwarza, więc zachowano zapisaną liczbę \u201E{STORED}\u201D",
  },
  "45": {
    en: "labels renamed by categories.csv beside the file: {N}. {LIST}{MORE}",
    pl: "etykiety zmienione przez plik categories.csv obok pliku: {N}. {LIST}{MORE}",
  },
  "48": {
    en: "the file is not valid UTF-8 and was read as {ENC}; byte offsets a UTF-8 reader would have replaced: {LIST}. Check the letters of any card that looked wrong before this catalog goes out",
    pl: "plik nie jest poprawnym UTF-8 i odczytano go jako {ENC}; pozycje bajtów, które czytnik UTF-8 by zastąpił: {LIST}. Przed wysłaniem katalogu należy sprawdzić litery w kartach, które wyglądały źle",
  },
};

const WORDS_LIST2 = {
  "1": {
    en: 'the column override names a column the file does not have: "{H}"',
    pl: "ręczne przypisanie wskazuje kolumnę, której nie ma w pliku: \u201E{H}\u201D",
  },
  "2": {
    en: 'the column override sends "{H}" to "{F}", which is no field',
    pl: "ręczne przypisanie kieruje kolumnę \u201E{H}\u201D do pola \u201E{F}\u201D, które nie istnieje",
  },
  "3": {
    en: "the column override sends \"{H}\" to {F}, which takes one value per language: write {F}.en or {F}.pl",
    pl: "ręczne przypisanie kieruje kolumnę \u201E{H}\u201D do pola {F}, które ma osobną wartość dla każdego języka: należy wpisać {F}.en albo {F}.pl",
  },
  "4": {
    en: "columns claiming {F}: {N} ({LIST}). Name one in the override table",
    pl: "kolumny przypisane do pola {F}: {N} ({LIST}). Należy wskazać jedną w tabeli przypisań",
  },
  "5": {
    en: "columns claiming {F}{LANGPART}: {N}. Name one in the override table",
    pl: "kolumny przypisane do pola {F}{LANGPART}: {N}. Należy wskazać jedną w tabeli przypisań",
  },
  "6": {
    en: "the engine reports a language awaiting text under a name this draft does not declare: {LINE}",
    pl: "silnik zgłasza język oczekujący na tekst pod nazwą, której ten szkic nie deklaruje: {LINE}",
  },
  "7": {
    en: "the engine could not be asked which of its findings the absence of {LANG} causes, because the test catalog added findings of its own: {N} (the first: {FIRST}). So all of them stand as errors",
    pl: "nie dało się ustalić, które ustalenia silnika wynikają z braku języka {LANG}, bo katalog testowy dodał własne: {N} (pierwsze: {FIRST}). Dlatego wszystkie pozostają błędami",
  },
  "85": {
    en: '"fav" is a key kept for Favourites, so it cannot name a category',
    pl: "\u201Efav\u201D to klucz zarezerwowany dla Ulubionych, więc nie może oznaczać kategorii",
  },
  "87": {
    en: '{NAME} names a category that does not exist: "{K}"',
    pl: "{NAME} wskazuje kategorię, która nie istnieje: \u201E{K}\u201D",
  },
  "88": {
    en: '{NAME} gives the category "{K}" no text: remove that key instead',
    pl: "{NAME} nie podaje żadnego tekstu dla kategorii \u201E{K}\u201D: lepiej usunąć ten klucz",
  },
  "90": {
    en: 'the categories always shown name one that does not exist: "{K}"',
    pl: "wśród kategorii wyświetlanych zawsze jest taka, która nie istnieje: \u201E{K}\u201D",
  },
  "91": {
    en: 'the opening category names one that does not exist: "{K}"',
    pl: "kategoria otwierająca wskazuje kategorię, która nie istnieje: \u201E{K}\u201D",
  },
  "92": {
    en: "the intents' fields {K} and {PRIMARY} hold different numbers of entries ({A} against {N}). Entries are matched by place, so a slipped row pairs the wrong ones",
    pl: "pola {K} i {PRIMARY} w intencjach mają różną liczbę pozycji ({A} wobec {N}). Pozycje są dopasowywane według kolejności, więc przesunięty wiersz łączy niewłaściwe pary",
  },
  "97": {
    en: "the title ({KEY}) is required",
    pl: "tytuł ({KEY}) jest wymagany",
  },
  "98": {
    en: "the {LANG} text ({KEY}) is required",
    pl: "treść w języku {LANG} ({KEY}) jest wymagana",
  },
  "99": {
    en: 'unknown category: "{C}"',
    pl: "nieznana kategoria: \u201E{C}\u201D",
  },
  "101": {
    en: "the intent link {X} is out of range: the intents run from 0 to {MAX}",
    pl: "powiązanie z intencją {X} jest poza zakresem: intencje mają numery od 0 do {MAX}",
  },
  "102": {
    en: 'the intent link "{X}" is not a number. It works on this computer but can break in a file passed to others',
    pl: "powiązanie z intencją \u201E{X}\u201D nie jest liczbą. Działa na tym komputerze, ale w pliku przekazanym innym może przestać działać",
  },
  "103": {
    en: "the intent link {X} is out of range",
    pl: "powiązanie z intencją {X} jest poza zakresem",
  },
  "108": {
    en: "Steps without Alternatives do nothing: the blocks split only when the card has Alternatives",
    pl: "Kroki bez Wariantów niczego nie zmieniają: bloki dzielą się tylko wtedy, gdy karta ma Warianty",
  },
  "110": {
    en: "the {PRIMARY} text has blocks: {BASE}, and the {LANG} text: {N}. Copies at the same place will not match",
    pl: "bloki w treści w języku {PRIMARY}: {BASE}, a w języku {LANG}: {N}. Kopie na tych samych miejscach nie będą sobie odpowiadać",
  },
  "112": {
    en: 'the team list has the same entry twice: "{W}"',
    pl: "lista zespołu zawiera ten sam wpis dwa razy: \u201E{W}\u201D",
  },
  "115": { en: "it points at no part of the file", pl: "nie wskazuje żadnego fragmentu pliku" },
  "116": { en: "its text is not in the file", pl: "jej tekstu nie ma w pliku" },
  "117": { en: "one of its parts is empty", pl: "jeden z jej fragmentów jest pusty" },
  "118": { en: "its text is not in the file", pl: "jej tekstu nie ma w pliku" },
  "119": { en: "it reworded the text, which was not asked for", pl: "przeredagowała tekst, o co nie proszono" },
  "120": { en: "it has no text", pl: "nie ma tekstu" },
  "121": { en: "it has no reply text", pl: "nie ma treści odpowiedzi" },
  "122": { en: "a reply text has no language code", pl: "treść odpowiedzi nie ma kodu języka" },
};

const put = (tpl, vars) => {
  let out = String(tpl);
  for (const [k, v] of Object.entries(vars || {})) out = out.split("{" + k + "}").join(String(v));
  return out;
};
const norm = (s) => String(s || "").replace(/\u00a0/g, " ");

/* ---- Synthetic xlsx builder matching tests/workbook.mjs ------------------------------------ */

const CONTENT_TYPES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
  + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
  + '<Default Extension="xml" ContentType="application/xml"/>'
  + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
  + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
  + '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>'
  + '</Types>';
const ROOT_RELS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
  + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
  + '</Relationships>';
const STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  + '<styleSheet xmlns="http://schemas.openxmlformats.org/package/2006/main">'
  + '<numFmts count="3">'
  + '<numFmt numFmtId="164" formatCode="000"/>'
  + '<numFmt numFmtId="165" formatCode="&quot;$&quot;#,##0.00"/>'
  + '<numFmt numFmtId="166" formatCode="yyyy-mm-dd"/>'
  + '</numFmts>'
  + '<cellXfs count="6">'
  + '<xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>'
  + '<xf numFmtId="9" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/>'
  + '<xf numFmtId="11" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/>'
  + '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/>'
  + '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/>'
  + '<xf numFmtId="166" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/>'
  + '</cellXfs></styleSheet>';

function escXml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function makeBook(sheets, strings, extraParts) {
  const wbSheets = sheets.map((s, i) => '<sheet name="' + escXml(s.name) + '" sheetId="' + (i + 1) + '"'
    + (s.hidden ? ' state="hidden"' : '') + ' r:id="rId' + (i + 1) + '"/>').join("");
  const wbRels = sheets.map((s, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join("")
    + '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
    + '<Relationship Id="rId' + (sheets.length + 2) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>';
  const files = {
    "[Content_Types].xml": Buffer.from(CONTENT_TYPES),
    "_rels/.rels": Buffer.from(ROOT_RELS),
    "xl/workbook.xml": Buffer.from('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + wbSheets + '</sheets></workbook>'),
    "xl/_rels/workbook.xml.rels": Buffer.from('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + wbRels + '</Relationships>'),
    "xl/styles.xml": Buffer.from(STYLES),
    "xl/sharedStrings.xml": Buffer.from('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' + (strings || []).map(x => "<si><t>" + escXml(x) + "</t></si>").join("") + "</sst>"),
  };
  sheets.forEach((s, i) => {
    const rowsXml = (s.rows || []).map(r => {
      const cellsXml = (r.cells || []).map(c => {
        const st = c.s != null ? ' s="' + c.s + '"' : "";
        if (c.inline != null) return '<c r="' + c.ref + '"' + st + ' t="inlineStr"><is><t>' + escXml(c.inline) + '</t></is></c>';
        if (c.str != null) return '<c r="' + c.ref + '"' + st + ' t="s"><v>' + c.str + '</v></c>';
        if (c.err != null) return '<c r="' + c.ref + '"' + st + ' t="e"><v>' + escXml(c.err) + '</v></c>';
        if (c.formula != null && c.v == null) return '<c r="' + c.ref + '"' + st + '><f>' + escXml(c.formula) + '</f></c>';
        if (c.n != null) return '<c r="' + c.ref + '"' + st + '><v>' + c.n + '</v></c>';
        return "";
      }).join("");
      return '<row r="' + r.r + '"' + (r.hidden ? ' hidden="1"' : "") + ">" + cellsXml + "</row>";
    }).join("");
    const mergesXml = (s.merges && s.merges.length)
      ? "<mergeCells>" + s.merges.map(m => '<mergeCell ref="' + m + '"/>').join("") + "</mergeCells>" : "";
    files["xl/worksheets/sheet" + (i + 1) + ".xml"] = Buffer.from('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' + rowsXml + "</sheetData>" + mergesXml + "</worksheet>");
  });
  for (const [k, v] of Object.entries(extraParts || {})) files[k] = Buffer.from(String(v));
  return zip(Object.entries(files).map(([name, data]) => ({ name, data })));
}

/* ---- Completeness scanner (Rule 4) --------------------------------------------------------- */

const IMPORT_FRAME_CONSTS = new Set(["tail", "lead", "end"]);

function skipBalancedBraces(src, i) {
  let depth = 1;
  for (; i < src.length && depth > 0; i++) {
    const ch = src[i];
    if (ch === "'" || ch === '"' || ch === "`") { i = readString(src, i).end - 1; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
  }
  return i;
}

function readString(src, i) {
  const q = src[i];
  let hasInterp = false;
  for (i++; i < src.length; i++) {
    const ch = src[i];
    if (ch === "\\") { i++; continue; }
    if (q === "`" && ch === "$" && src[i + 1] === "{") {
      hasInterp = true;
      i = skipBalancedBraces(src, i + 2) - 1;
      continue;
    }
    if (ch === q) return { end: i + 1, hasInterp };
  }
  return { end: src.length, hasInterp };
}

function splitCallArgs(src, openIdx) {
  const args = [];
  let depth = 1, argStart = openIdx + 1;
  for (let i = openIdx + 1; i < src.length && depth > 0; i++) {
    const ch = src[i];
    if (ch === "'" || ch === '"' || ch === "`") { i = readString(src, i).end - 1; continue; }
    if (ch === "(" || ch === "[" || ch === "{") { depth++; continue; }
    if (ch === ")" || ch === "]" || ch === "}") {
      depth--;
      if (depth === 0) { args.push({ start: argStart, end: i }); break; }
      continue;
    }
    if (depth === 1 && ch === ",") {
      args.push({ start: argStart, end: i });
      argStart = i + 1;
    }
  }
  return args;
}

function skipCallParens(src, openIdx) {
  const args = splitCallArgs(src, openIdx);
  return args.length ? args[args.length - 1].end + 1 : openIdx + 2;
}

function exprIsJoined(src, start, end) {
  for (let i = start; i < end; i++) {
    const ch = src[i];
    if (ch === "'" || ch === '"' || ch === "`") {
      const s = readString(src, i);
      if (s.hasInterp) return true;
      i = s.end - 1;
      continue;
    }
    if (ch === "(") {
      const before = src.slice(Math.max(0, i - 20), i);
      if (/\b(?:noteOf|engineNote)\s*$/.test(before)) { i = skipCallParens(src, i) - 1; continue; }
      if (/\.\s*(?:concat|join)\s*$/.test(before)) return true;
    }
    if (ch === "+" && src[i + 1] !== "+" && src[i - 1] !== "+") return true;
  }
  return false;
}

function isLiteralPlusChain(src, start, end, allowedIds) {
  let i = start, expectOperand = true, count = 0;
  while (i < end) {
    if (/\s/.test(src[i])) { i++; continue; }
    if (expectOperand) {
      const ch = src[i];
      if (ch === "'" || ch === '"' || ch === "`") {
        const s = readString(src, i);
        if (s.hasInterp) return false;
        i = s.end;
        count++;
        expectOperand = false;
        continue;
      }
      if (/[A-Za-z_$]/.test(ch)) {
        let j = i + 1;
        while (j < end && /[A-Za-z0-9_$]/.test(src[j])) j++;
        const id = src.slice(i, j);
        if (!allowedIds.has(id)) return false;
        i = j;
        count++;
        expectOperand = false;
        continue;
      }
      return false;
    }
    if (src[i] === "+" && src[i + 1] !== "+") { i++; expectOperand = true; continue; }
    return false;
  }
  return count > 0 && !expectOperand;
}

function allowedLiteralConsts(clean, rel, beforeIdx) {
  if (rel !== "src/import.mjs") return new Set();
  const ok = new Set();
  const head = clean.slice(0, beforeIdx);
  for (const name of IMPORT_FRAME_CONSTS) {
    const re = new RegExp("\\bconst\\s+" + name + "\\s*=([^;]+);", "g");
    const matches = [...head.matchAll(re)];
    const last = matches.length ? matches[matches.length - 1] : null;
    if (last && isLiteralPlusChain(last[1], 0, last[1].length, new Set())) {
      ok.add(name);
    }
  }
  return ok;
}

export function findJoinedNotes(clean, rel) {
  const hits = [];
  const seen = new Set();
  const lines = clean.split(/\r?\n/);
  const record = (idx) => {
    const lineNo = clean.slice(0, idx).split(/\r?\n/).length;
    const key = rel + ":" + lineNo;
    if (!seen.has(key)) {
      seen.add(key);
      hits.push({ file: rel, line: lineNo, text: lines[lineNo - 1].trim() });
    }
  };
  const re = /\b(note|noteOf|engineNote|findings\.push)\s*\(/g;
  let m;
  while ((m = re.exec(clean)) !== null) {
    const kind = m[1];
    const openIdx = m.index + m[0].length - 1;
    const before = clean.slice(Math.max(0, m.index - 20), m.index);
    if (/\bfunction\s+$/.test(before)) continue;
    const args = splitCallArgs(clean, openIdx);
    if (kind === "note") {
      if (args.length >= 2 && exprIsJoined(clean, args[1].start, args[1].end)) record(m.index);
    } else if (kind === "noteOf") {
      const allowedIds = allowedLiteralConsts(clean, rel, m.index);
      if (!args.length || !isLiteralPlusChain(clean, args[0].start, args[0].end, allowedIds)) record(m.index);
    } else if (kind === "engineNote") {
      const allowedIds = allowedLiteralConsts(clean, rel, m.index);
      const arg = args.length ? clean.slice(args[0].start, args[0].end).trim() : "";
      const isBareId = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(arg);
      if (!args.length || (!isBareId && !isLiteralPlusChain(clean, args[0].start, args[0].end, allowedIds))) record(m.index);
    } else if (kind === "findings.push") {
      if (args.some(a => exprIsJoined(clean, a.start, a.end))) record(m.index);
    }
  }
  return hits;
}

export function scanJoinedNotes(srcDir) {
  const hits = [];
  for (const name of fs.readdirSync(srcDir).sort()) {
    if (!name.endsWith(".mjs")) continue;
    const rel = path.posix.join("src", name);
    const clean = withoutComments(fs.readFileSync(path.join(srcDir, name), "utf8"), rel);
    hits.push(...findJoinedNotes(clean, rel));
  }
  return hits;
}

/* ---- Rule 1: Each framed note is said exactly ---------------------------------------------- */

async function rule1(enPage, plPage) {
  const sayBoth = (f) => ({ en: enPage.noteText(f), pl: plPage.noteText(f) });
  const assertPair = (id, note, wantEn, wantPl) => {
    const got = sayBoth(note);
    const ok = !!note && !!note.said && norm(got.en) === norm(wantEn) && norm(got.pl) === norm(wantPl);
    check(ok, "r1." + id + " " + JSON.stringify(got.en).slice(0, 80)
      + (ok ? "" : "\n    got EN:  " + JSON.stringify(got.en) + "\n    want EN: " + JSON.stringify(wantEn)
        + "\n    got PL:  " + JSON.stringify(got.pl) + "\n    want PL: " + JSON.stringify(wantPl)));
  };

  /* List 1 #1..#10, #25..#32, #41..#44 through examine() */
  const emptyWb = examine({ buf: makeBook([{ name: "Blank", rows: [] }], []) });
  assertPair("1", emptyWb.fork.paths[1], WORDS_LIST1["1"].en, WORDS_LIST1["1"].pl);
  assertPair("2", emptyWb.notes[0], WORDS_LIST1["2"].en, WORDS_LIST1["2"].pl);

  const emptyCellsSheet = examine({ buf: makeBook([{ name: "EmptyCells", rows: [{ r: 1, cells: [{ ref: "A1", inline: "   " }] }] }], []) });
  assertPair("10", emptyCellsSheet.notes[0], WORDS_LIST1["10"].en, WORDS_LIST1["10"].pl);

  const richWb = examine({
    buf: makeBook([
      {
        name: "Primary",
        merges: ["A1:B1"],
        rows: [
          { r: 1, hidden: true, cells: [{ ref: "A1", inline: "Title" }, { ref: "B1", str: 99 }] },
          { r: 2, cells: [
            { ref: "A2", n: "45000", s: 5 },
            { ref: "B2", formula: "1+1" },
            { ref: "C2", err: "#DIV/0!" },
            { ref: "D2", n: "0.5", s: 1 },
            { ref: "E2", n: "1234", s: 2 },
          ] },
        ],
      },
      { name: "ExtraSheet", rows: [{ r: 1, cells: [{ ref: "A1", inline: "x" }] }] },
    ], ["ok"], {
      "xl/drawings/drawing1.xml": "<x/>",
      "xl/charts/chart1.xml": "<x/>",
      "xl/media/image1.png": "x",
      "xl/comments1.xml": "<x/>",
      "xl/threadedComments/t1.xml": "<x/>",
      "xl/pivotCache/c1.xml": "<x/>",
      "xl/embeddings/e1.bin": "x",
    }),
  });
  const byEn = (list, re) => list.find(n => re.test(enPage.noteText(n)));
  assertPair("41", byEn(richWb.notes, /^hidden rows read/), put(WORDS_LIST1["41"].en, { SHEET: "Primary", N: 1 }), put(WORDS_LIST1["41"].pl, { SHEET: "Primary", N: 1 }));
  assertPair("3", byEn(richWb.notes, /^sheets with content/), put(WORDS_LIST1["3"].en, { N: 2, SHEET: "Primary" }), put(WORDS_LIST1["3"].pl, { N: 2, SHEET: "Primary" }));
  assertPair("5", byEn(richWb.notes, /^the cell A2 is formatted/), put(WORDS_LIST1["5"].en, { REF: "A2" }), put(WORDS_LIST1["5"].pl, { REF: "A2" }));
  assertPair("6", byEn(richWb.notes, /^the cell B2 holds a formula/), put(WORDS_LIST1["6"].en, { REF: "B2" }), put(WORDS_LIST1["6"].pl, { REF: "B2" }));
  assertPair("7", byEn(richWb.notes, /^the cell C2 holds a spreadsheet error/), put(WORDS_LIST1["7"].en, { REF: "C2" }), put(WORDS_LIST1["7"].pl, { REF: "C2" }));
  assertPair("8", byEn(richWb.notes, /^the cell B1 points at text/), put(WORDS_LIST1["8"].en, { REF: "B1" }), put(WORDS_LIST1["8"].pl, { REF: "B1" }));
  assertPair("43", byEn(richWb.notes, /^the cell D2 shows/), put(WORDS_LIST1["43"].en, { REF: "D2", SHOWN: "50%", STORED: "0.5" }), put(WORDS_LIST1["43"].pl, { REF: "D2", SHOWN: "50%", STORED: "0.5" }));
  assertPair("44", byEn(richWb.notes, /^the cell E2 has a number/), put(WORDS_LIST1["44"].en, { REF: "E2", STORED: "1234" }), put(WORDS_LIST1["44"].pl, { REF: "E2", STORED: "1234" }));
  assertPair("9", byEn(richWb.notes, /^merged regions/), put(WORDS_LIST1["9"].en, { N: 1 }), put(WORDS_LIST1["9"].pl, { N: 1 }));

  for (const [id, idx] of [["25", "25"], ["26", "26"], ["27", "27"], ["28", "28"], ["29", "29"], ["30", "30"], ["32", "32"]]) {
    const u = byEn(richWb.notes, new RegExp("^not read on a sheet: " + WORDS_LIST1[idx].en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assertPair("4+" + id, u,
      put(WORDS_LIST1["4"].en, { WHAT: WORDS_LIST1[idx].en, N: 1 }),
      put(WORDS_LIST1["4"].pl, { WHAT: WORDS_LIST1[idx].pl, N: 1 }));
  }
  const pivBoth = examine({ buf: makeBook([{ name: "P", rows: [{ r: 1, cells: [{ ref: "A1", inline: "Title" }] }] }], [], { "xl/pivotTables/p1.xml": "<x/>" }) });
  assertPair("4+31", byEn(pivBoth.notes, /^not read on a sheet/),
    put(WORDS_LIST1["4"].en, { WHAT: WORDS_LIST1["31"].en, N: 1 }),
    put(WORDS_LIST1["4"].pl, { WHAT: WORDS_LIST1["31"].pl, N: 1 }));

  const hiddenWb = examine({ buf: makeBook([{ name: "Secret", hidden: true, rows: [{ r: 1, cells: [{ ref: "A1", inline: "Title" }] }] }], []) });
  assertPair("42", byEn(hiddenWb.notes, /^the sheet/), put(WORDS_LIST1["42"].en, { SHEET: "Secret" }), put(WORDS_LIST1["42"].pl, { SHEET: "Secret" }));

  /* List 2 #1..#5 through mapHeaders + importCsv */
  const ov1 = mapHeaders(["Body"], { Ghost: "title.en" });
  assertPair("L2.1", (ov1.errorNotes || [])[0], put(WORDS_LIST2["1"].en, { H: "Ghost" }), put(WORDS_LIST2["1"].pl, { H: "Ghost" }));
  const ov2 = mapHeaders(["Body"], { Body: "bogus" });
  assertPair("L2.2", (ov2.errorNotes || [])[0], put(WORDS_LIST2["2"].en, { H: "Body", F: "bogus" }), put(WORDS_LIST2["2"].pl, { H: "Body", F: "bogus" }));
  const ov3 = mapHeaders(["Body"], { Body: "body" });
  assertPair("L2.3", (ov3.errorNotes || [])[0], put(WORDS_LIST2["3"].en, { H: "Body", F: "body" }), put(WORDS_LIST2["3"].pl, { H: "Body", F: "body" }));
  const ov4 = mapHeaders(["Category", "Folder"], {});
  assertPair("L2.4", (ov4.errorNotes || [])[0], put(WORDS_LIST2["4"].en, { F: "shelf", N: 2, LIST: '"Category", "Folder"' }), put(WORDS_LIST2["4"].pl, { F: "shelf", N: 2, LIST: '"Category", "Folder"' }));
  const ov5a = mapHeaders(["Body", "Answer"], {});
  assertPair("L2.5a", (ov5a.errorNotes || [])[0], put(WORDS_LIST2["5"].en, { F: "body", LANGPART: " with no language named", N: 2 }), put(WORDS_LIST2["5"].pl, { F: "body", LANGPART: " bez wskazanego języka", N: 2 }));
  const ov5b = mapHeaders(["body_en", "Body (en)"], {});
  assertPair("L2.5b", (ov5b.errorNotes || [])[0], put(WORDS_LIST2["5"].en, { F: "body", LANGPART: ".en", N: 2 }), put(WORDS_LIST2["5"].pl, { F: "body", LANGPART: ".en", N: 2 }));

  /* List 1 #12, #14, #15, #17, #34, #45 and List 2 #6, #7 via importCsv / awaitingOver */
  const sib = path.join(SCRATCH, "sib");
  fs.mkdirSync(sib, { recursive: true });
  const keys9 = ["k1", "k2", "k3", "k4", "k5", "k6", "k7", "k8", "k9"];
  fs.writeFileSync(path.join(sib, "macros.csv"),
    ["Title,Body,Category,Intents,Keywords"]
      .concat(keys9.map((k, idx) => "T" + (idx + 1) + ",Plain reply words about " + k + " here," + k + ",ask,plain extra" + idx))
      .join("\n"), "utf8");
  fs.writeFileSync(path.join(sib, "categories.csv"),
    ["key,label"].concat(keys9.map(k => k + ",L" + k.slice(1))).concat(["unused1,U1", "unused2,U2"]).join("\n"), "utf8");
  fs.writeFileSync(path.join(sib, "intents.csv"),
    ["clause_en"].concat(["ask", "i1", "i2", "i3", "i4", "i5", "i6", "i7"]).join("\n"), "utf8");
  const sibRep = await importCsv({ file: path.join(sib, "macros.csv"), id: "frames-sib" });

  assertPair("45", byEn(sibRep.report.findings, /^labels renamed/),
    put(WORDS_LIST1["45"].en, {
      N: 9,
      LIST: keys9.slice(0, 8).map(k => '"' + k + '" as "L' + k.slice(1) + '"').join(", "),
      MORE: ", and the rest: 1",
    }),
    put(WORDS_LIST1["45"].pl, {
      N: 9,
      LIST: keys9.slice(0, 8).map(k => "\u201E" + k + "\u201D jako \u201EL" + k.slice(1) + "\u201D").join(", "),
      MORE: ", pozostałe: 1",
    }));
  assertPair("14", byEn(sibRep.report.findings, /^category keys declared/),
    put(WORDS_LIST1["14"].en, { N: 2, LIST: "unused1, unused2" }),
    put(WORDS_LIST1["14"].pl, { N: 2, LIST: "unused1, unused2" }));
  assertPair("15", byEn(sibRep.report.findings, /^intent clauses declared/),
    put(WORDS_LIST1["15"].en, { N: 7, LIST: "i1; i2; i3; i4; i5; i6", MORE: ", and the rest: 1" }),
    put(WORDS_LIST1["15"].pl, { N: 7, LIST: "i1; i2; i3; i4; i5; i6", MORE: ", pozostałe: 1" }));
  assertPair("17-plain", byEn(sibRep.report.findings, /^cards with search keywords/),
    put(WORDS_LIST1["17-plain"].en, { K: 9, C: 9, W: 18, O: 9 }),
    put(WORDS_LIST1["17-plain"].pl, { K: 9, C: 9, W: 18, O: 9 }));

  const repCsv = await importCsv({
    dir: SCRATCH,
    text: "Title,Body,Keywords\nOne,Refund today please,refund\nTwo,Delivery tomorrow,custom\n",
  });
  assertPair("17-repeats", byEn(repCsv.report.findings, /^cards with search keywords/),
    put(WORDS_LIST1["17-repeats"].en, { K: 2, C: 2, W: 2, O: 1, R: 1 }),
    put(WORDS_LIST1["17-repeats"].pl, { K: 2, C: 2, W: 2, O: 1, R: 1 }));

  assertPair("12-count", byEn(repCsv.report.findings, /^this draft is waiting/),
    put(WORDS_LIST1["12-count"].en, { LANG: "Polish", LANGS: "en", N: 2, TOTAL: 2 }),
    put(WORDS_LIST1["12-count"].pl, { LANG: "Polski", LANGS: "en", N: 2, TOTAL: 2 }));

  const encHead = Buffer.from("Title,Body\r\nSee,caf", "utf8");
  const encFile = path.join(SCRATCH, "cp1252.csv");
  fs.writeFileSync(encFile, Buffer.concat([encHead, Buffer.from([0xE0]), Buffer.from("\r\n")]));
  const encRes = await importCsv({ file: encFile, id: "frames-enc" });
  assertPair("34", byEn(encRes.report.findings, /^the file is not valid UTF-8/),
    put(WORDS_LIST1["34"].en, { ENC: "windows-1252", N: encHead.length }),
    put(WORDS_LIST1["34"].pl, { ENC: "windows-1252", N: encHead.length }));

  const stubCat = { langs: [{ code: "en" }, { code: "pl" }], cards: [{ id: "c-1", title: { en: "Hi" }, body: { en: "Body" } }] };
  const stubUnk = awaitingOver(stubCat, { errors: [], warnings: [], awaiting: ["zz: 1 card(s) lacking text"] }, () => ({ errors: [], warnings: [] }), ["en", "pl"], () => "h");
  assertPair("L2.6", stubUnk.notes[0],
    put(WORDS_LIST2["6"].en, { LINE: "zz: 1 card(s) lacking text" }),
    put(WORDS_LIST2["6"].pl, { LINE: "zz: 1 card(s) lacking text" }));

  const stubSays = awaitingOver(stubCat, { errors: [], warnings: [], awaiting: ["pl: unparsed awaiting shape"] }, () => ({ errors: [], warnings: [] }), ["en", "pl"], () => "h");
  assertPair("12-says", stubSays.rows[0],
    put(WORDS_LIST1["12-says"].en, { LANG: "Polish", LANGS: "en, pl", SAYS: "pl: unparsed awaiting shape" }),
    put(WORDS_LIST1["12-says"].pl, { LANG: "Polski", LANGS: "en, pl", SAYS: "pl: unparsed awaiting shape" }));

  const stubFail = awaitingOver({ langs: [{ code: "en" }], cards: [{ id: "c-1", title: { en: "Hi" }, body: { en: "Body" } }] },
    { errors: ["card 1 (\"Hi\"): Polish (pl) is required"], warnings: [] },
    () => ({ errors: ["card 1 (\"Hi\"): Polish (pl) is required", "probe extra 1", "probe extra 2"] }),
    ["en", "pl"], () => "h");
  assertPair("L2.7", stubFail.notes[0],
    put(WORDS_LIST2["7"].en, { LANG: "Polish", N: 2, FIRST: "probe extra 1" }),
    put(WORDS_LIST2["7"].pl, { LANG: "Polski", N: 2, FIRST: "probe extra 1" }));

  /* List 1 #35, #36, #39, #40, #48 & List 2 #115..#122 through importText */
  const txtHead = Buffer.from("Greeting\nHello, caf", "utf8");
  const looseHead = "Goodbye, thank you very much for reaching out to our support desk today";
  const looseTail = "please feel completely free to let us know if anything else at all helps.";
  const txtTail = Buffer.from(" is a full greeting that goes past the minimum anchor length needed here.\n\nFarewell\n" + looseHead + " and " + looseTail + "\n", "utf8");
  const txtFile = path.join(SCRATCH, "model-src.txt");
  fs.writeFileSync(txtFile, Buffer.concat([txtHead, Buffer.from([0xE0]), txtTail]));
  const goodSpan = "is a full greeting that goes past the minimum anchor length needed here.";
  const refOut = await importText({
    file: txtFile, id: "frames-text", join: false,
    ask: async () => ({
      ok: true,
      text: JSON.stringify({
        categories: [{ key: "gen", label: "Gen" }],
        intents: [],
        cards: [
          { title: {}, category: "gen", intents: [], bodies: [{ lang: "en", spans: [{ text: goodSpan }, { from: looseHead, to: looseTail, chars: 300 }] }] },
          { title: { en: "R115" }, category: "gen", intents: [], bodies: [{ lang: "en", spans: [] }] },
          { title: { en: "R116" }, category: "gen", intents: [], bodies: [{ lang: "en", spans: [{ text: "not in source" }] }] },
          { title: { en: "R117" }, category: "gen", intents: [], bodies: [{ lang: "en", spans: [{ text: "" }] }] },
          { title: { en: "R118" }, category: "gen", intents: [], bodies: [{ lang: "en", spans: [{ from: "anchor not present here at all in the file", to: "tail not present here at all in the file", chars: 80 }] }] },
          { title: { en: "R119" }, category: "gen", intents: [], bodies: [{ lang: "en", spans: [{ text: "reworded reply", was: goodSpan }] }] },
          { title: { en: "R120" }, category: "gen", intents: [], bodies: [{ lang: "en", spans: [{ text: "\n\n" }] }] },
          { title: { en: "R121" }, category: "gen", intents: [], bodies: [] },
          { title: { en: "R122" }, category: "gen", intents: [], bodies: [{ spans: [{ text: goodSpan }] }] },
        ],
      }),
    }),
  });
  assertPair("48", byEn(refOut.report.findings, /^the file is not valid UTF-8/),
    put(WORDS_LIST1["48"].en, { ENC: "windows-1252", LIST: txtHead.length }),
    put(WORDS_LIST1["48"].pl, { ENC: "windows-1252", LIST: txtHead.length }));
  assertPair("36", byEn(refOut.report.findings, /^a card came back with no title/),
    put(WORDS_LIST1["36"].en, { I: 0 }),
    put(WORDS_LIST1["36"].pl, { I: 0 }));
  assertPair("40", byEn(refOut.report.findings, /^proposed bodies/),
    put(WORDS_LIST1["40"].en, { N: 1 }),
    put(WORDS_LIST1["40"].pl, { N: 1 }));
  for (const [id, reWhy, lang, at] of [
    ["115", WORDS_LIST2["115"], "en", null],
    ["116", WORDS_LIST2["116"], "en", 0],
    ["117", WORDS_LIST2["117"], "en", 0],
    ["118", WORDS_LIST2["118"], "en", 0],
    ["119", WORDS_LIST2["119"], "en", 0],
    ["120", WORDS_LIST2["120"], "en", null],
    ["121", WORDS_LIST2["121"], "", null],
    ["122", WORDS_LIST2["122"], "", null],
  ]) {
    const lp = lang ? " (" + lang + ")" : "";
    const spEn = at == null ? "" : ", span " + at;
    const spPl = at == null ? "" : ", fragment " + at;
    const wantEn = put(WORDS_LIST1["39"].en, { WHY: reWhy.en, LANGPART: lp, SPAN: spEn });
    const wantPl = put(WORDS_LIST1["39"].pl, { WHY: reWhy.pl, LANGPART: lp, SPAN: spPl });
    const match = refOut.report.findings.find(f => norm(enPage.noteText(f)) === wantEn);
    assertPair("39+" + id, match, wantEn, wantPl);
  }

  /* #35 join refused */
  const joinFile = path.join(SCRATCH, "join-refused.txt");
  const enA = "First answer text that is definitely long enough to be its own anchor in the source text.";
  const mid = "Intervening sentence that belongs to no card and breaks contiguity.";
  const enB = "Second answer text that is also definitely long enough to act as another anchor here.";
  fs.writeFileSync(joinFile, [enA, mid, enB].join("\n"), "utf8");
  let joinCalls = 0;
  const joinOut = await importText({
    file: joinFile, id: "frames-join", join: "ask",
    ask: async () => {
      if (++joinCalls === 2) return { ok: true, text: JSON.stringify({ joins: [[0, 1]] }) };
      return {
        ok: true,
        text: JSON.stringify({
          categories: [{ key: "gen", label: "Gen" }], intents: [],
          cards: [
            { title: { en: "C0" }, category: "gen", intents: [], bodies: [{ lang: "en", spans: [{ text: enA }] }] },
            { title: { en: "C1" }, category: "gen", intents: [], bodies: [{ lang: "en", spans: [{ text: enB }] }] },
          ],
        }),
      };
    },
  });
  assertPair("35", byEn(joinOut.report.findings, /^joins proposed/),
    put(WORDS_LIST1["35"].en, { N: 1 }),
    put(WORDS_LIST1["35"].pl, { N: 1 }));

  /* List 2 15 engine lines through Engine.lint().lintCatalog + importLintSaid */
  const { lintCatalog } = Engine.lint();
  const engineNote = (line) => noteOf("Etiuda's checks: {LINE}", {
    LINE: (LintSaid.importLintSaid || LintSaid.lintSaid)(line) || line,
  });
  const baseCat = () => ({
    format: 1, kind: "playbook-catalog", id: "eng-probe", rev: 1,
    langs: [{ code: "en", label: "EN" }, { code: "pl", label: "PL" }],
    categories: { gen: "Gen" },
    cards: [{ t: "T1", c: "gen", en: "B1", pl: "T1" }],
  });
  const engCheck = (id, line, wantEn, wantPl) => {
    assertPair(id, engineNote(line),
      "Etiuda's checks: " + wantEn,
      "kontrola Etiudy: " + wantPl);
  };
  const d85 = baseCat(); d85.categories.fav = "Fav";
  const l85 = lintCatalog(d85).errors.find(e => /reserved category key/.test(e));
  engCheck("E85", l85, WORDS_LIST2["85"].en, WORDS_LIST2["85"].pl);

  engCheck("E87", 'categoriesPl names a category that does not exist: "ghost"',
    put(WORDS_LIST2["87"].en, { NAME: "the Polish category names", K: "ghost" }),
    put(WORDS_LIST2["87"].pl, { NAME: "nazwy kategorii w języku Polski", K: "ghost" }));
  engCheck("E88", 'categoriesPl["k-1"] is empty - drop the key instead',
    put(WORDS_LIST2["88"].en, { NAME: "the Polish category names", K: "k-1" }),
    put(WORDS_LIST2["88"].pl, { NAME: "nazwy kategorii w języku Polski", K: "k-1" }));
  engCheck("E90", 'roles.always names a category that does not exist: "missing-cat"',
    put(WORDS_LIST2["90"].en, { K: "missing-cat" }),
    put(WORDS_LIST2["90"].pl, { K: "missing-cat" }));
  engCheck("E91", 'roles.opener names a category that does not exist: "open-cat"',
    put(WORDS_LIST2["91"].en, { K: "open-cat" }),
    put(WORDS_LIST2["91"].pl, { K: "open-cat" }));
  const d92 = baseCat(); d92.intents = { en: ["ask", "pay"], pl: ["pytaj", "płać"], cat: ["gen", "gen"], cmt: ["one"] };
  const l92 = lintCatalog(d92).warnings.find(w => /alignment is positional/.test(w));
  engCheck("E92", l92,
    put(WORDS_LIST2["92"].en, { K: "cmt", PRIMARY: "en", A: 1, N: 2 }),
    put(WORDS_LIST2["92"].pl, { K: "cmt", PRIMARY: "en", A: 1, N: 2 }));
  engCheck("E92-clause", 'intents.cat length 2 != intents.clause length 3 (engine pads, but alignment is positional - check for a slipped row)',
    put(WORDS_LIST2["92"].en, { K: "cat", PRIMARY: "clause", A: 2, N: 3 }),
    put(WORDS_LIST2["92"].pl, { K: "cat", PRIMARY: "clause", A: 2, N: 3 }));

  const l97 = 'card 1 ("T1"): title (t) is required';
  engCheck("E97", l97, 'card 1 ("T1"): ' + put(WORDS_LIST2["97"].en, { KEY: "t" }), 'karta 1 ("T1"): ' + put(WORDS_LIST2["97"].pl, { KEY: "t" }));
  const d98 = baseCat(); d98.cards[0].en = "";
  const l98 = lintCatalog(d98).errors.find(e => /is required/.test(e));
  engCheck("E98", l98, 'card 1 ("T1"): ' + put(WORDS_LIST2["98"].en, { LANG: "English", KEY: "en" }), 'karta 1 ("T1"): ' + put(WORDS_LIST2["98"].pl, { LANG: "Angielski", KEY: "en" }));
  engCheck("E99", 'card 1 ("T1"): unknown category "cat-x"',
    'card 1 ("T1"): ' + put(WORDS_LIST2["99"].en, { C: "cat-x" }),
    'karta 1 ("T1"): ' + put(WORDS_LIST2["99"].pl, { C: "cat-x" }));
  engCheck("E101", 'card 1 ("T1"): intent link 9 is out of range (0..2)',
    'card 1 ("T1"): ' + put(WORDS_LIST2["101"].en, { X: 9, MAX: 2 }),
    'karta 1 ("T1"): ' + put(WORDS_LIST2["101"].pl, { X: 9, MAX: 2 }));
  engCheck("E102", 'card 1 ("T1"): intent link "i:x" is not numeric - fine locally, fragile in a distributed file',
    'card 1 ("T1"): ' + put(WORDS_LIST2["102"].en, { X: "i:x" }),
    'karta 1 ("T1"): ' + put(WORDS_LIST2["102"].pl, { X: "i:x" }));
  engCheck("E103", 'card 1 ("T1"): intent link i:7 is out of range',
    'card 1 ("T1"): ' + put(WORDS_LIST2["103"].en, { X: "i:7" }),
    'karta 1 ("T1"): ' + put(WORDS_LIST2["103"].pl, { X: "i:7" }));
  engCheck("E108", 'card 1 ("T1"): seq without alt does nothing (blocks only split when alt is set)',
    'card 1 ("T1"): ' + WORDS_LIST2["108"].en,
    'karta 1 ("T1"): ' + WORDS_LIST2["108"].pl);
  engCheck("E110", 'card 1 ("T1"): 2 EN blocks vs 1 PL blocks - copies at the same index will diverge',
    'card 1 ("T1"): ' + put(WORDS_LIST2["110"].en, { PRIMARY: "English", BASE: 2, LANG: "Polish", N: 1 }),
    'karta 1 ("T1"): ' + put(WORDS_LIST2["110"].pl, { PRIMARY: "Angielski", BASE: 2, LANG: "Polski", N: 1 }));
  const d112 = baseCat(); d112.who = ["Alex", "alex"];
  const l112 = lintCatalog(d112).warnings.find(w => /duplicate entry/.test(w));
  engCheck("E112", l112, put(WORDS_LIST2["112"].en, { W: "alex" }), put(WORDS_LIST2["112"].pl, { W: "alex" }));
}

/* ---- Rule 2: No count bends a noun across 1, 2 and 5 in EN and PL --------------------------- */

function rule2(enPage, plPage) {
  const skeleton = (s, n) => norm(s).replace(new RegExp("\\b" + n + "\\b", "g"), "{COUNT}");
  const cases = [
    ["3", (n) => noteOf(WORDS_LIST1["3"].en, { N: n, SHEET: "S" })],
    ["4", (n) => noteOf(WORDS_LIST1["4"].en, { WHAT: { frame: "a chart" }, N: n })],
    ["9", (n) => noteOf(WORDS_LIST1["9"].en, { N: n })],
    ["12", (n) => noteOf("{FIRST} {THEN}", {
      FIRST: { frame: "this draft is waiting for its {LANG} text: the catalog declares {LANGS}, and cards lacking {LANG}: {N} of {TOTAL}.", vars: { LANG: { frame: "Polish" }, LANGS: "en", N: n, TOTAL: 9 } },
      THEN: { frame: "A language beyond the first is optional, so the import stands as it is and the gap is shown here once rather than on every card. It publishes as it stands, and what is still missing is counted on the publish cover and in the release notes." },
    })],
    ["14", (n) => noteOf(WORDS_LIST1["14"].en, { N: n, LIST: "a" })],
    ["15", (n) => noteOf(WORDS_LIST1["15"].en, { N: n, LIST: "a", MORE: "" })],
    ["15-more", (n) => noteOf(WORDS_LIST1["15"].en, { N: 10, LIST: "a", MORE: { frame: ", and the rest: {M}", vars: { M: n } } })],
    ["17", (n) => noteOf(WORDS_LIST1["17-repeats"].en.replace(" Cards", " {R}").replace("The keywords", "The keywords"), { K: n, C: 9, W: n, O: n, R: n })],
    ["34", (n) => noteOf(WORDS_LIST1["34"].en, { ENC: "windows-1252", N: n })],
    ["35", (n) => noteOf(WORDS_LIST1["35"].en, { N: n })],
    ["40", (n) => noteOf(WORDS_LIST1["40"].en, { N: n })],
    ["41", (n) => noteOf(WORDS_LIST1["41"].en, { SHEET: "S", N: n })],
    ["45", (n) => noteOf(WORDS_LIST1["45"].en, { N: n, LIST: "x", MORE: "" })],
    ["L2.4", (n) => noteOf(WORDS_LIST2["4"].en, { F: "shelf", N: n, LIST: "A" })],
    ["L2.5", (n) => noteOf(WORDS_LIST2["5"].en, { F: "body", LANGPART: ".en", N: n })],
    ["L2.7", (n) => noteOf(WORDS_LIST2["7"].en, { LANG: { frame: "Polish" }, N: n, FIRST: "x" })],
    ["E110", (n) => noteOf(WORDS_LIST2["110"].en, { PRIMARY: { frame: "English" }, BASE: n, LANG: { frame: "Polish" }, N: n })],
  ];
  for (const [id, make] of cases) {
    const enS = [1, 2, 5].map(n => skeleton(enPage.noteText(make(n)), n));
    const plS = [1, 2, 5].map(n => skeleton(plPage.noteText(make(n)), n));
    const ok = enS[0] === enS[1] && enS[1] === enS[2] && plS[0] === plS[1] && plS[1] === plS[2];
    check(ok, "r2." + id + " counts 1, 2, 5 keep fixed nouns in EN and PL"
      + (ok ? "" : "\n    EN: " + JSON.stringify(enS) + "\n    PL: " + JSON.stringify(plS)));
  }
}

/* ---- Rule 3: Nothing is lost on base fixtures ----------------------------------------------- */

async function rule3() {
  const dir = path.join(SCRATCH, "r3");
  fs.mkdirSync(dir, { recursive: true });
  const gen = (name, seed, rows, faults) => {
    const out = path.join(dir, name);
    const r = spawnSync(process.execPath, ["tools/fixtures/generate.mjs", "--no-scan", "--seed", String(seed), "--rows", String(rows), "--out", out, ...faults.map(f => "--" + f)], { cwd: ROOT, encoding: "utf8" });
    if (r.status !== 0) throw new Error(r.stderr);
    return { dir: out, csv: path.join(out, "macros.csv") };
  };
  const clean = gen("clean", 7, 40, []);
  const dupid = gen("dupid", 11, 40, ["duplicate-id"]);
  const orphan = gen("orphan", 11, 40, ["orphan-category"]);
  const missing = gen("missing", 11, 40, ["missing-second-language"]);
  const enc = gen("encoding", 11, 40, ["wrong-encoding"]);

  const BASE = {
    clean: ["warning"],
    dupid: ["warning", "error"],
    orphan: ["warning", "warning"],
    missing: ["warning", "warning", "awaiting"],
    encoding: ["warning", "warning", "note"],
    oneLang: ["warning", "awaiting"],
    f10a: ["warning", "warning", "note", "awaiting"],
    model: ["awaiting", "error"],
  };
  const f10Dir = path.join(dir, "f10a");
  fs.mkdirSync(f10Dir, { recursive: true });
  fs.writeFileSync(path.join(f10Dir, "replies.csv"), "Title,Body,Category\nA refund,We refund within fourteen days.,refunds\nThe same,The words are the same as the key.,same\nAn extra,This key is not in the sibling.,minted\n");
  fs.writeFileSync(path.join(f10Dir, "categories.csv"), "key,label\nrefunds,not the cell\nsame,same\nspare,nobody used this\n");

  const runs = [
    ["clean", (await importCsv({ file: clean.csv })).report.findings],
    ["dupid", (await importCsv({ file: dupid.csv })).report.findings],
    ["orphan", (await importCsv({ file: orphan.csv })).report.findings],
    ["missing", (await importCsv({ file: missing.csv })).report.findings],
    ["encoding", (await importCsv({ file: path.join(enc.dir, "macros-cp1252.csv"), id: "r3-enc" })).report.findings],
    ["oneLang", (await importCsv({ file: clean.csv, override: { title_pl: null, body_pl: null } })).report.findings],
    ["f10a", (await importCsv({ file: path.join(f10Dir, "replies.csv"), id: "r3-f10a" })).report.findings],
    ["model", (await importText({
      text: "Greeting\nHello there, this is the first reply we send when a customer writes in asking about an order.\n\nFarewell\nThank you very much for reaching out to us today, please let us know if you need anything else.\n",
      id: "r3-model", join: false,
      ask: async () => ({
        ok: true,
        text: JSON.stringify({
          categories: [{ key: "general", label: "General" }], intents: [],
          cards: [
            { title: { en: "Greeting" }, category: "general", intents: [], bodies: [{ lang: "en", spans: [{ text: "Hello there, this is the first reply we send when a customer writes in asking about an order." }] }] },
            { title: { en: "Bad" }, category: "general", intents: [], bodies: [{ lang: "en", spans: [{ text: "Invented reply text that is not in the file." }] }] },
          ],
        }),
      }),
    })).report.findings],
  ];
  for (const [k, got] of runs) {
    const sevs = got.map(f => f.severity);
    const same = sevs.length === BASE[k].length && sevs.every((s, i) => s === BASE[k][i]);
    check(same, "r3." + k + " preserves count, severity and order: " + JSON.stringify(sevs)
      + (same ? "" : " expected " + JSON.stringify(BASE[k])));
  }
}

/* ---- Rule 4: Completeness scan ------------------------------------------------------------- */

function rule4() {
  const hits = scanJoinedNotes(path.join(ROOT, "src"));
  const planted = 'if (false) note("warning", "rows found: " + n);';
  const plantedHits = findJoinedNotes(planted, "<planted>");
  check(plantedHits.length === 1, "r4.proof scanner catches planted joined note(): " + planted);
  const plantedNoteOf = 'if (false) note("warning", noteOf("rows: " + n));';
  const plantedNoteOfHits = findJoinedNotes(plantedNoteOf, "<planted>");
  check(plantedNoteOfHits.length === 1, "r4.proof2 scanner catches planted joined noteOf(): " + plantedNoteOf);
  const shapes = [
    ['template', 'note("warning", `rows: ${n}`)'],
    ['noteOf+vars', 'note("warning", noteOf("rows: " + n, { n }))'],
    ['awaiting', 'note("awaiting", "rows: " + n)'],
    ['var-sev', 'note(sev, "rows: " + n)'],
    ['concat', 'note("warning", "rows: ".concat(n))'],
    ['array-join', 'note("warning", ["rows:", n].join(" "))'],
    ['findings-push', 'findings.push({ what: "rows: " + n })'],
  ];
  for (const [label, code] of shapes) {
    check(findJoinedNotes(code, "<probe>").length === 1, "r4.shape catches " + label + ": " + code);
  }
  const controls = [
    ['noteOf-vars-expr', 'note("warning", noteOf("rows: {N}", { N: n + 1 }))'],
    ['engineNote-id', 'note("error", engineNote(e))'],
  ];
  for (const [label, code] of controls) {
    check(findJoinedNotes(code, "<control>").length === 0, "r4.control allows " + label + ": " + code);
  }
  check(hits.length === 0, "r4 scan of src/ finds 0 joined unframed note() calls: " + JSON.stringify(hits));
}

/* ---- Rule 5: Unframed line stays verbatim in "Etiuda's checks: {LINE}" --------------------- */

function rule5(enPage, plPage) {
  const engineNote = (line) => noteOf("Etiuda's checks: {LINE}", {
    LINE: (LintSaid.importLintSaid || LintSaid.lintSaid)(line) || line,
  });
  for (const raw of [
    "an unknown future engine rule on card 1",
    "an unknown future engine warning on tag 2",
  ]) {
    const f = engineNote(raw);
    const en = enPage.noteText(f), pl = plPage.noteText(f);
    check(en === "Etiuda's checks: " + raw && pl === "kontrola Etiudy: " + raw,
      "r5 unframed line verbatim in EN and PL: " + JSON.stringify([en, pl]));
  }
}

const PLANTS = [
  { mark: "hidden-read", leg: "r1", rel: "src/source.mjs", line: "    void sheet;" },
  { mark: "frames-count", leg: "r2", rel: "ui/lang.js", line: '      if (vars && vars.N === 1) return s + " (one)";' },
  { mark: "sibling-label", leg: "r3", rel: "src/import.mjs", line: "    void shelfOrder;" },
  { mark: "frames-scan", leg: "r4", rel: "src/import-text.mjs", line: '  if (false) note("warning", "rows: " + n);' },
  { mark: "frames-unframed", leg: "r5", rel: "src/lint-said.mjs", line: '  if (!said) return { frame: "other", vars: {} };' },
];

async function main() {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const enPage = loadPage({ api: {}, uiLang: "en" }).page;
  const plPage = loadPage({ api: {}, uiLang: "pl" }).page;
  if (want("r1")) await rule1(enPage, plPage);
  if (want("r2")) rule2(enPage, plPage);
  if (want("r3")) await rule3();
  if (want("r4")) rule4();
  if (want("r5")) rule5(enPage, plPage);
  if (!ONLY) {
    copyPlants({ root: ROOT, self: SELF, label: "import-frames", onlyVar: "IMPORT_FRAMES_ONLY", plants: PLANTS, check, skip });
  }
  dropScratch(SCRATCH, "import-frames");
  process.stdout.write("import-frames " + asserted + " assertion(s), " + failed + " failure(s), " + skipped + " skipped\n");
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  process.stderr.write("FAIL import-frames " + (err && err.stack ? err.stack : err) + "\n");
  process.exit(1);
});
