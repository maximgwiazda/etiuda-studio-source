/* CUT TEXT FADES, NOTHING ENDS IN AN ELLIPSIS (Maxim, 2026-10-06 22:20, on the leftovers' sheet):
 * "Make sure there is nothing in Studio that shortens itself with ellipsis. All text must shorten
 * with fade off, as it does in Desk. Of course ellipsis that is chosen deliberately for some other
 * reason, can stay."
 *
 * Node only, no window. What it holds:
 *   1. the sheet: no `text-overflow:ellipsis` and no `line-clamp` anywhere in ui/index.html (the whole
 *      file, not only its <style>, in any letter case), and every rule in the <style> that clips a single
 *      line (overflow hidden with white-space nowrap) is a box ui/app.js's cut pass measures (CUT_SEL) or
 *      is named below as a box that is not text;
 *   2. the code: every string literal holding an ellipsis (typed, escaped as … or \u{2026}, or an
 *      entity), three dots, or the words "ellipsis" or "line-clamp", in ui/, src/ and shell/, is one of
 *      the deliberate ones listed below with its reason; and no code, comments apart, builds one with
 *      fromCharCode(8230) or sets textOverflow or lineClamp; so a new cut with dots goes red;
 *   3. the pass itself, on a stand-in page with laid-out numbers: a line whose ink runs past its
 *      box is marked on that side and given its words as a tooltip, a line that fits is not, and a
 *      box of lines that runs out is cut at its foot;
 *   4. the words a page's own code cuts (the file's cells, a find's context, a quoted clause, a
 *      diff's window) reach the screen faded at the cut end, with no dots.
 * A planted line with a cut and an ellipsis, a planted sheet rule, and every other way back listed above
 * are found (the controls), and a comment that only speaks of them is not.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { loadPage } from "./page-stand-in.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), "utf8");
let failures = 0, legs = 0;
function check(ok, what) { legs++; if (!ok) failures++; console.log((ok ? "  ok   " : "  FAIL ") + what); }

/* ---- 1. the sheet ----------------------------------------------------------------------------- */

const SHEET = read("ui", "index.html");
const cssOf = (html) => {
  const a = html.indexOf("<style>"), b = html.indexOf("</style>");
  if (a < 0 || b < a) throw new Error("fade-off: no <style> in the sheet");
  return html.slice(a, b).replace(/\/\*[\s\S]*?\*\//g, "");
};
/** The whole file with its comments taken out, CSS and HTML: a rule or a style attribute anywhere in it counts. */
const uncommentedHtml = (html) => html.replace(/<!--[\s\S]*?-->/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
const SHEET_ELLIPSIS = /text-overflow\s*:\s*ellipsis/i, SHEET_CLAMP = /line-clamp/i;
/** Every rule that clips one line: its selector list and declarations. */
function clippers(css) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  for (let m; (m = re.exec(css));) {
    const d = m[2];
    if (/overflow(-x)?\s*:\s*(hidden|clip)/i.test(d) && /white-space\s*:\s*nowrap/i.test(d))
      out.push(m[1].trim().replace(/\s+/g, " "));
  }
  return out;
}
/* Boxes that clip a line and are not a line of text a reader is meant to finish. */
const NOT_TEXT = {
  ".tab": "a tab is a row of boxes; its name is .tab .nm, which is measured, and Projects keeps its width",
  ".sbar": "the status bar is a row of boxes; the one that can be long, the folder, is .sbar .sb-dir",
  ".sr": "the words a screen reader hears, one pixel square on purpose",
};
const APP = read("ui", "app.js");
const cutSel = (src) => {
  const m = /const CUT_SEL = ([^;]+);/.exec(src);
  if (!m) return null;
  return vm.runInNewContext(m[1]).split(",").map((s) => s.trim());
};
function sheetFaults(html, app) {
  const css = cssOf(html), whole = uncommentedHtml(html), sel = cutSel(app) || [];
  const f = [];
  if (SHEET_ELLIPSIS.test(whole)) f.push("text-overflow:ellipsis");
  if (SHEET_CLAMP.test(whole)) f.push("line-clamp");
  clippers(css).forEach((s) => s.split(",").map((x) => x.trim()).forEach((one) => {
    if (sel.indexOf(one) < 0 && !NOT_TEXT[one]) f.push("unmeasured " + one);
  }));
  return f;
}
const sel = cutSel(APP);
check(!!sel && sel.length >= 8, "1a ui/app.js names the boxes its cut pass measures (CUT_SEL): " + JSON.stringify(sel));
const sheetNow = sheetFaults(SHEET, APP);
check(sheetNow.length === 0, "1b the sheet carries no ellipsis and no line clamp, and every rule clipping one line is measured"
  + " or named as no text: " + JSON.stringify(sheetNow));
const planted = SHEET.replace("</style>", ".planted-a{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n"
  + ".planted-b{display:-webkit-box;-webkit-line-clamp:2}\n</style>");
const plantedF = sheetFaults(planted, APP);
check(plantedF.join("|") === "text-overflow:ellipsis|line-clamp|unmeasured .planted-a",
  "1c CONTROL: a planted rule with an ellipsis and an unmeasured clip, and a planted clamp, are all three found: " + JSON.stringify(plantedF));
/* The other ways in: capitals, and a style attribute or a second style block outside the one the sheet's rules sit in.
   Each alone, so none hides behind another. */
const sheetPlants = {
  "capitals in a rule": (h) => h.replace("</style>", ".planted-c{TEXT-OVERFLOW:ELLIPSIS}\n</style>"),
  "a clamp in capitals": (h) => h.replace("</style>", ".planted-d{-WEBKIT-LINE-CLAMP:2}\n</style>"),
  "an ellipsis in a style attribute in the body": (h) => h.replace("<body>", '<body><div style="white-space:nowrap;text-overflow: ellipsis">x</div>'),
  "a clamp in a style attribute in the body": (h) => h.replace("<body>", '<body><div style="-webkit-line-clamp:3">x</div>'),
  "a rule in a second style block": (h) => h.replace("</body>", "<style>.planted-e{text-overflow:ellipsis}</style></body>"),
};
const sheetMiss = Object.keys(sheetPlants).filter((k) => sheetFaults(sheetPlants[k](SHEET), APP).length === 0);
const sheetSaid = sheetFaults(SHEET.replace("<body>", "<body><!-- text-overflow:ellipsis and line-clamp are not used here -->"), APP);
check(sheetMiss.length === 0 && sheetSaid.length === 0,
  "1e CONTROL: " + Object.keys(sheetPlants).length + " more ways to put a cut back in the sheet are each found alone (not found: "
  + JSON.stringify(sheetMiss) + "), and an HTML comment that only names them is not: " + JSON.stringify(sheetSaid));
const shellPages = fs.readdirSync(path.join(ROOT, "shell")).filter((f) => /\.(html|css)$/.test(f));
check(shellPages.every((f) => !SHEET_ELLIPSIS.test(uncommentedHtml(read("shell", f))) && !SHEET_CLAMP.test(uncommentedHtml(read("shell", f)))),
  "1d the shell carries no sheet of its own that cuts with an ellipsis (" + shellPages.length + " page(s) of its own)");

/* ---- 2. the code ------------------------------------------------------------------------------- */

/** The string literals of a JavaScript source, comments and regular expressions skipped. Template
 *  literals give their text outside ${...}; a regex is told from a division by the token before it. */
function literals(src, comments) {
  const out = [];
  let i = 0, prev = "";
  const n = src.length;
  const regexOk = () => prev === "" || /[(,=:[!&|?{};+\-*%<>~^]$/.test(prev) || /\b(return|typeof|case|of|in|do|else|void|delete|new|throw|yield|await)$/.test(prev);
  function readString(q) {
    let s = "";
    i++;
    while (i < n && src[i] !== q) {
      if (src[i] === "\\") { s += src[i] + src[i + 1]; i += 2; continue; }
      s += src[i++];
    }
    i++;
    return s;
  }
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === "/" && d === "/") { const from = i; while (i < n && src[i] !== "\n") i++; if (comments) comments.push([from, i]); continue; }
    if (c === "/" && d === "*") { const from = i, e = src.indexOf("*/", i + 2); i = e < 0 ? n : e + 2; if (comments) comments.push([from, i]); continue; }
    if (c === "'" || c === '"') { out.push(readString(c)); prev = "x"; continue; }
    if (c === "`" ) {
      let s = ""; i++;
      while (i < n && src[i] !== "`") {
        if (src[i] === "\\") { s += src[i] + src[i + 1]; i += 2; continue; }
        if (src[i] === "$" && src[i + 1] === "{") {
          /* the expression inside is code: scan it with the same reader, to its closing brace */
          i += 2; let depth = 1; const from = i;
          while (i < n && depth) {
            const ch = src[i];
            if (ch === "'" || ch === '"') { out.push(readString(ch)); continue; }
            if (ch === "{") depth++;
            else if (ch === "}") depth--;
            i++;
          }
          s += "${" + src.slice(from, i - 1) + "}";
          continue;
        }
        s += src[i++];
      }
      i++;
      out.push(s); prev = "x"; continue;
    }
    if (c === "/" && regexOk()) {
      i++; let cls = false;
      while (i < n) {
        const ch = src[i];
        if (ch === "\\") { i += 2; continue; }
        if (ch === "[") cls = true; else if (ch === "]") cls = false;
        else if (ch === "/" && !cls) break;
        else if (ch === "\n") break;
        i++;
      }
      i++;
      while (/[a-z]/.test(src[i] || "")) i++;
      prev = "x"; continue;
    }
    if (/\s/.test(c)) { i++; continue; }
    if (/[\w$]/.test(c)) { let w = ""; while (i < n && /[\w$]/.test(src[i])) w += src[i++]; prev = w; continue; }
    prev = c;
    i++;
  }
  return out;
}
/* An ellipsis however a literal writes it: typed, three dots, escaped (…, \u{2026}), an entity, or named in words. */
const DOTS = /…|\.\.\.|\\u2026|\\u\{0*2026\}|&hellip;|&#0*8230;|&#x0*2026;|ellipsis|line-clamp/i;
/* And in code, outside any literal's reach: built from its code point, or set through the style object. */
const BUILT = [[/fromCharCode\s*\([^)]*\b(8230|0x2026)\b/i, "fromCharCode(8230)"], [/textOverflow/, "textOverflow"], [/[Ll]ineClamp/, "lineClamp"]];
/** The source with its comments taken out, which is where a word about an ellipsis is allowed to sit. */
function uncommented(src) {
  const comments = [];
  literals(src, comments);
  let out = "", at = 0;
  comments.forEach(([a, b]) => { out += src.slice(at, a) + " "; at = b; });
  return out + src.slice(at);
}
/* The deliberate ones, each with its reason. An ellipsis that names an act opening a further step is
   the desk's own convention (its menu says "Show tour…"); a state in progress is unfinished, not cut. */
const KEPT = {
  "ui/app.js": {
    "Drafting…": "the drafting job's row while the organisation's model works: in progress, not cut (board 992)",
    "Applying: {N}…": "the review door's Apply button while the decided answers are being written: in progress, not cut (the copywriter's words for the door)",
    "Testing…": "the AI service's connection test while it runs: in progress, not cut (board 992)",
    "Splitting…": "the import's row while the organisation's model splits the replies: in progress, not cut (board 992)",
    "Splitting… part {N} of {TOTAL}": "the import's row while the organisation's model splits a part: in progress, not cut (board 992)",
    "<textarea class=\"ta\" id=\"followInvite\" autocomplete=\"off\" placeholder=\"etiuda-join:…\"></textarea></div>": "the join cover's placeholder, the shape of an invitation to paste, not a cut (board 962 stage 7, V4)",
    "Change folder…": "a button that opens the folder picker",
    "Settings…": "a Menu row that opens the Settings cover",
    "Add seats…": "Buy's button where the account already pays, which opens its subscription at the payment provider (board 1020)",
    "Show tour…": "a Menu row that opens the tour, the desk's own wording",
    "Clear local memory…": "a Menu row that opens its cover",
    "Remove the signing key…": "an act that opens its warning",
    "Export a plain copy…": "a button that opens the save dialog",
    "Save the drafts as files…": "the stopped door's way out, which opens the save dialog for each project's catalog files (S-3)",
    "Export to Excel…": "a button that opens the save dialog for the statistics workbook",
    "Restore it from a backup copy…": "a button that opens the picker for a backup copy (K8)",
    "This computer cannot open the team's newest file until Studio's signing key is restored here from its backup copy: in the Menu, under Settings, then Signing key, “Restore it from a backup copy…”. Until then it cannot publish or change the team's members; nothing is lost.": "the Desks screen's restore line, which names the Settings press “Restore it from a backup copy…” by its own words (the copywriter's, 2026-11-23)",
    "Restore a backup…": "a button that opens the picker for a backup copy (K4, K7)",
    "Make a backup copy…": "a button that opens the backup copy's cover (K6)",
    "Make another…": "the same button once a copy exists",
    "Let go of the team…": "an act that opens its question (the Team screen, a team this Studio holds no keys for)",
    "Save the copy…": "the cover's act, which opens the save dialog",
    "Choose…": "a button that opens the picker for another copy",
    "Start a new team here…": "a button that opens the new team's cover",
    "Licence…": "a button in Settings that opens the Licence cover (licence service S6)",
    "Invite a teammate…": "a button that opens the invitation's cover, which asks the lead's name (board 885, S2)",
    "Save the template…": "a button that opens the folder dialog for the IT department's template (sense pass finding 17)",
    "Publish sealed…": "a button on a plain team's removal cover that opens the seal switch's own cover (sense pass finding 4)",
    "Restore to the draft…": "a button on each Archive row that opens the rollback's cover (Studio 1, the edition rollback)",
    "Move to another team…": "a button that opens the move catalog cover",
    "Make another team…": "a button on Team that opens the picker of catalogs with no team, to start another team",
    "Choose the backup copy…": "Account's Carry on from another computer: a button that opens the picker for the signing key's backup copy (A6)",
    "Open the folder…": "the same group's second step: a button that opens the folder picker for the projects on a share (A6)",
    "Accept…": "the button of the row a naming waits as under Seat in Account: it opens the bubble that asks, and moves nothing itself (board 1011)",
    "saving the draft…": "the status bar while a save is on its way: in progress, not cut",
    "Press keys…": "a shortcut row while it waits for the keys to record: in progress, not cut (board 965, S4b)",
    "...": "the dots src/diff.mjs and src/commitment.mjs put in their text, which the screen takes off and fades (diffSide, phraseHtml)",
    "{GENDER:…|…|…}": "the inline form's places, as Claudette writes the token on the Variables page (board 845, A14), not a cut",
    "{DAYPART:…|…}": "the same, A15",
    "{…}": "a variable not yet named, its places as above",
    "…": "one place per rule in the inline form a card may write, under In a card (board 845, A101), and the short card id on the statistics lists, the first six and the last four with this between them (board 976, item 9)",
    "…\\\\": "the mark before the last two steps of a folder chip, where the earlier steps are cut (board 976, item 11)",
  },
  "ui/lang.js": {
    "Let go of the team…": "the key of the English above", "Odłącz zespół…": "its Polish",
    "Applying: {N}…": "the key of the English above (the review door)", "Zastosowywanie: {N}…": "its Polish",
    "Testing…": "the key of the English above (board 992)",
    "Sprawdzanie…": "its Polish (board 992)",
    "Drafting…": "the key of the English above (board 992)",
    "Szkicowanie…": "its Polish (board 992)",
    "Splitting…": "the key of the English above (board 992)",
    "Dzielenie…": "its Polish (board 992)",
    "Splitting… part {N} of {TOTAL}": "the key of the English above (board 992)",
    "Dzielenie… część {N} z {TOTAL}": "its Polish (board 992)",
    "Change folder…": "the key of the English above", "Zmień folder…": "its Polish",
    "Clear local memory…": "the key of the English above", "Wyczyść pamięć lokalną…": "its Polish",
    "Remove the signing key…": "the key of the English above", "Usuń klucz podpisu…": "its Polish",
    "Settings…": "the key", "Ustawienia…": "its Polish",
    "Add seats…": "the key (board 1020)", "Dodaj miejsca…": "its Polish",
    "Show tour…": "the key", "Pokaż przewodnik…": "its Polish",
    "saving the draft…": "the key", "zapisywanie szkicu…": "its Polish",
    "Press keys…": "the key", "Naciśnij klawisze…": "its Polish",
    "Export a plain copy…": "the key", "Eksportuj jawną kopię…": "its Polish",
    "Save the drafts as files…": "the key", "Zapisz wersje robocze jako pliki…": "its Polish (S-3)",
    "Export to Excel…": "the key", "Eksportuj do Excela…": "its Polish",
    "Restore it from a backup copy…": "the key", "Przywróć go z kopii zapasowej…": "its Polish",
    "This computer cannot open the team's newest file until Studio's signing key is restored here from its backup copy: in the Menu, under Settings, then Signing key, “Restore it from a backup copy…”. Until then it cannot publish or change the team's members; nothing is lost.": "the restore line's key, naming the press", "Ten komputer nie może otworzyć najnowszego pliku zespołu, dopóki klucz podpisu Studia nie zostanie tu przywrócony z kopii zapasowej: w menu, w Ustawieniach, w części Klucz podpisu, polecenie „Przywróć go z kopii zapasowej…”. Do tego czasu nie może publikować ani zmieniać członków zespołu; nic nie przepada.": "its Polish",
    "Restore a backup…": "the key", "Przywróć z kopii…": "its Polish",
    "Make a backup copy…": "the key", "Utwórz kopię zapasową…": "its Polish",
    "Make another…": "the key", "Utwórz kolejną…": "its Polish",
    "Save the copy…": "the key", "Zapisz kopię…": "its Polish",
    "Choose…": "the key", "Wybierz…": "its Polish",
    "Start a new team here…": "the key", "Załóż tu nowy zespół…": "its Polish",
    "Licence…": "the key", "Licencja…": "its Polish",
    "Invite a teammate…": "the key", "Zaproś członka zespołu…": "its Polish",
    "Save the template…": "the key", "Zapisz szablon…": "its Polish",
    "Publish sealed…": "the key", "Publikuj zapieczętowane…": "its Polish",
    "Restore to the draft…": "the key", "Przywróć do szkicu…": "its Polish",
    "Move to another team…": "the key of the English above", "Przenieś do innego zespołu…": "its Polish",
    "Make another team…": "the key of the English above", "Utwórz kolejny zespół…": "its Polish",
    "Choose the backup copy…": "the key", "Wybierz kopię zapasową…": "its Polish",
    "Open the folder…": "the key", "Otwórz folder…": "its Polish",
    "Accept…": "the key", "Przyjmij…": "its Polish",
    "To restore the signing key, pick the file Studio wrote with Make a backup copy…, whose name begins etiuda-studio-key- unless it was renamed; {FILE} is not such a copy.": "W10: the sentence names the button Make a backup copy…, whose ellipsis is its own",
    "Aby przywrócić klucz podpisu, wystarczy wybrać plik zapisany przez Studio przyciskiem Utwórz kopię zapasową…; jeśli nie zmieniono mu nazwy, zaczyna się od etiuda-studio-key-. Plik {FILE} nie jest taką kopią.": "its Polish, naming Utwórz kopię zapasową…",
  },
  "src/studio.mjs": {
    "To restore the signing key, pick the file Studio wrote with Make a backup copy…, whose name begins etiuda-studio-key- unless it was renamed; {FILE} is not such a copy.": "W10: readBackup's refusal, the same sentence, naming the button by its label",
  },
  "src/diff.mjs": {
    "...": "the lines a person reads as plain text, outside Studio too (tools/diff.mjs, the release notes, the audit's export), where no fade exists; on screen the cut end fades (diffSide)",
  },
  "src/commitment.mjs": {
    "...": "the quoted clause is the key a dismissal is kept under, so its text stays as it was; on screen the cut end fades (phraseHtml)",
  },
  "src/adapt.mjs": {
    "\\u2026":"the character the HTML entity &hellip; stands for, decoded from an imported file's own text (the import's faithfulness build): the person's ellipsis, not a cut",
  },
  "src/paste.mjs": {
    "\\u2026": "the character the HTML entity &hellip; stands for, decoded from a pasted document's own text (board 956, row 2): the person's ellipsis, not a cut",
  },
  "shell/main.js": {
    " text only, as one JSON object and nothing else: {\"title\": {\"<language code>\": \"...\"}, \"body\": {\"<language code>\":": "the shape the customer's model is asked to answer in, part of the prompt sent on the lead's act and never shown on a screen (board 992), not a cut",
    " \"...\"}, \"category\": \"a category name\", \"intents\": [\"an intent name\"]}": "the shape the customer's model is asked to answer in, part of the prompt sent on the lead's act and never shown on a screen (board 992), not a cut",
  },
  "src/import-text.mjs": {
    '{"cards":[{"title":{"<lang>":"..."},"category":"<short-key>",': "a placeholder in the shape a model is asked to answer in, not a cut",
    '  "categoryLabel":{"<lang>":"..."},"intents":["<what the customer asked>"],': "the same placeholder shape",
    '  "bodies":[{"lang":"<code>","spans":[{"from":"...","to":"...","chars":0}]}]}]}': "the same placeholder shape",
    '   characters may instead be given whole, as {"text":"..."}, copied exactly.': "the same placeholder shape",
  },
};
const SOURCES = ["ui/app.js", "ui/lang.js", "ui/icons.js"]
  .concat(fs.readdirSync(path.join(ROOT, "src")).filter((f) => /\.(mjs|cjs|js)$/.test(f)).map((f) => "src/" + f))
  .concat(fs.readdirSync(path.join(ROOT, "shell")).filter((f) => /\.(js|cjs|mjs|html)$/.test(f)).map((f) => "shell/" + f));
/* Three dots kept for the screen's own handling of them are counted, so a new pair of dots is still found. */
const TIMES = { "ui/app.js": { "...": 2, "…": 2 }, "src/diff.mjs": { "...": 3 }, "src/commitment.mjs": { "...": 1 } };
function codeFaults(file, src) {
  const kept = KEPT[file] || {}, times = TIMES[file] || {}, seen = {};
  const code = uncommented(src);
  return literals(src).filter((s) => {
    if (!DOTS.test(s)) return false;
    if (!Object.prototype.hasOwnProperty.call(kept, s)) return true;
    seen[s] = (seen[s] || 0) + 1;
    return Object.prototype.hasOwnProperty.call(times, s) && seen[s] > times[s];
  }).map((s) => file + " " + JSON.stringify(s))
    .concat(BUILT.filter(([re]) => re.test(code)).map(([, name]) => file + " builds a cut with " + name));
}
const found = [];
let scanned = 0;
SOURCES.forEach((f) => { const src = read(f); scanned += literals(src).length; found.push(...codeFaults(f, src)); });
check(found.length === 0 && scanned > 5000,
  "2a every string literal with an ellipsis or three dots in ui/, src/ and shell/ is one of the deliberate ones, each with its"
  + " reason (" + SOURCES.length + " files, " + scanned + " literals read): " + JSON.stringify(found));
const keptSeen = [];
Object.keys(KEPT).forEach((f) => { const ls = literals(read(f)); Object.keys(KEPT[f]).forEach((k) => { if (ls.indexOf(k) < 0) keptSeen.push(f + " " + k); }); });
check(keptSeen.length === 0, "2b every deliberate one listed is still in its file, so the list cannot outlive its reasons: " + JSON.stringify(keptSeen));
const plantedCode = APP + '\nconst shortName = (s) => s.length > 20 ? s.slice(0, 20) + "…" : s;\nconst tail = (s) => s.slice(0, 9) + `...`;\n';
const plantedFound = codeFaults("ui/app.js", plantedCode);
check(plantedFound.length === 2, "2c CONTROL: a planted cut with an ellipsis and one with three dots in a template are both found: "
  + JSON.stringify(plantedFound));
check(literals('const r = /a\\.\\.\\.b/.test(x) ? "x" : 1 / 2; const y = "z";').join("|") === "x|z",
  "2d CONTROL: the reader skips a regular expression and a division, and reads the strings around them");
/* Every other way back, planted alone at the foot of the real file, each found; and the same words in comments, found nowhere. */
const codePlants = {
  "a string with the escape": 'const a = "\\u2026";',
  "a string with the braced escape": 'const a = "\\u{2026}";',
  "an entity by name": 'const a = "&hellip;";',
  "an entity by number": 'const a = "&#8230;";',
  "an entity in hex": 'const a = "&#x2026;";',
  "fromCharCode(8230)": "const a = String.fromCharCode(8230);",
  "fromCharCode(0x2026) among others": "const a = String.fromCharCode(0x2018, 0X2026);",
  "textOverflow set in code": "const a = (el) => { el.style.textOverflow = mode; };",
  "lineClamp set in code": "const a = (el) => { el.style.webkitLineClamp = 2; };",
  "a string that says ellipsis": 'const a = "text-overflow: Ellipsis";',
  "a string that says line-clamp": "const a = '-webkit-line-clamp:2';",
  "a template that says ellipsis": "const a = `<i style=\"text-overflow:ellipsis\">${x}</i>`;",
};
const codeMiss = Object.keys(codePlants).filter((k) => codeFaults("ui/app.js", APP + "\n" + codePlants[k] + "\n").length === 0);
check(codeMiss.length === 0, "2e CONTROL: " + Object.keys(codePlants).length + " more ways to bring an ellipsis back into the code are each found alone"
  + " (not found: " + JSON.stringify(codeMiss) + ")");
const commentsOnly = APP + "\n// textOverflow, lineClamp, fromCharCode(8230), \\u2026, &hellip; and ellipsis, said in a line comment\n"
  + "/* line-clamp and an ellipsis …, said in a block comment */\n";
check(codeFaults("ui/app.js", commentsOnly).length === 0 && codeFaults("ui/app.js", APP).length === 0,
  "2f CONTROL: the same words in a comment are not a cut, and the file as it stands has none: " + JSON.stringify(codeFaults("ui/app.js", commentsOnly)));

/* ---- 3. the cut pass, on laid-out numbers ------------------------------------------------------- */

const P = loadPage({ api: null, uiLang: "en", source: APP.replace("  boot();\n})();",
  "  window.__cut = { cutPass, cutSides, CUT_SEL, CUT_FOOT, set: (r) => { cutRange = r; } };\n  boot();\n})();") });
const C = P.sandbox.__cut;
check(!!C && typeof C.cutPass === "function", "3a the page has its cut pass");
/** A laid-out box: its rect, its padding, its ink's left and right, its classes and title as written. */
function box(rect, ink, text, more) {
  const cls = new Set();
  const attrs = Object.assign({}, (more && more.attrs) || {});
  return Object.assign({
    rect, ink, textContent: text, scrollHeight: 0, clientHeight: 0,
    getBoundingClientRect: () => rect,
    classList: { toggle(c, on) { if (on) cls.add(c); else cls.delete(c); }, contains: (c) => cls.has(c) },
    hasAttribute: (k) => Object.prototype.hasOwnProperty.call(attrs, k),
    setAttribute(k, v) { attrs[k] = String(v); },
    get title() { return attrs.title; }, set title(v) { attrs.title = v; },
    cls, attrs,
  }, more || {});
}
const R = (l, r) => ({ left: l, right: r, top: 0, bottom: 20, width: r - l, height: 20 });
const lines = [
  box(R(0, 100), R(0, 140), "A long project name"),                  // runs past its right
  box(R(0, 100), R(0, 90), "Short"),                                  // fits
  box(R(0, 100), R(-30, 100), "Scrolled to its end"),                // runs past its left
  box(R(0, 100), R(0, 150), "Has its own title", { attrs: { title: "the folder" } }),
];
const feet = [box(R(0, 100), R(0, 100), "Two lines and more", { scrollHeight: 60, clientHeight: 40 }),
  box(R(0, 100), R(0, 100), "Two lines", { scrollHeight: 40, clientHeight: 40 })];
let inkOf = null;
C.set({ selectNodeContents(el) { inkOf = el; }, getBoundingClientRect() { return inkOf.ink; } });
const doc = P.doc;
const qsa = doc.querySelectorAll;
doc.querySelectorAll = (s) => (s === C.CUT_SEL ? lines : s === C.CUT_FOOT ? feet : qsa.call(doc, s));
P.sandbox.getComputedStyle = () => ({ borderLeftWidth: "0", borderRightWidth: "0", paddingLeft: "0", paddingRight: "0" });
C.cutPass();
const st = (b) => [...b.cls].sort().concat(b.attrs.title !== undefined ? ["title=" + JSON.stringify(b.attrs.title)] : []).join(" ");
check(st(lines[0]) === 'cut-r is-cut title="A long project name"', "3b a line running past its right edge fades there and its words are its tooltip: " + st(lines[0]));
check(st(lines[1]) === "", "3c CONTROL: a line that fits is neither faded nor given a tooltip: " + JSON.stringify(st(lines[1])));
check(st(lines[2]) === 'cut-l is-cut title="Scrolled to its end"', "3d a line whose ink starts before its box fades at its left: " + st(lines[2]));
check(st(lines[3]) === 'cut-r is-cut title="the folder"', "3e a box with a tooltip of its own keeps it, faded all the same: " + st(lines[3]));
check(st(feet[0]) === 'cut-b title="Two lines and more"' && st(feet[1]) === "",
  "3f a box of lines that runs out is cut at its foot, one that holds its lines is not: " + st(feet[0]) + " / " + JSON.stringify(st(feet[1])));
const heard = { ink: R(0, 400) }, seen = { ink: R(0, 95) };
const folder = box(R(0, 100), R(0, 400), "Catalog folder: Projects/one Projects/one", { querySelector: (s) => (s === ":scope > .sr" ? heard : null),
  childNodes: [heard, seen] });
const folderCut = box(R(0, 100), R(0, 400), "Catalog folder: Projects/one Projects/one", { querySelector: (s) => (s === ":scope > .sr" ? heard : null),
  childNodes: [heard, { ink: R(0, 130) }] });
lines.push(folder, folderCut);
C.cutPass();
check(st(folder) === "" && st(folderCut) === 'cut-r is-cut title="Catalog folder: Projects/one Projects/one"',
  "3h words only a screen reader hears are not the line: the folder that fits is whole, the one that does not fades: "
  + JSON.stringify(st(folder)) + " / " + st(folderCut));
lines[0].ink = R(0, 90);
C.cutPass();
check(st(lines[0]) === 'title=""', "3g a line that fits again loses its fade, and its tooltip empties rather than leaving: " + st(lines[0]));

/* ---- 4. the words a page's own code cuts --------------------------------------------------------- */

const H = loadPage({ api: null, uiLang: "en", source: APP.replace("  boot();\n})();",
  "  window.__cutw = { cutHtml, phraseHtml, diffSide, wizCellHtml };\n  boot();\n})();") }).sandbox.__cutw;
check(H.cutHtml("abcdefgh", false, true) === 'abcde<span class="fo-r">fgh</span>'
  && H.cutHtml("abcdefgh", true, false) === '<span class="fo-l">abc</span>defgh'
  && H.cutHtml("a<b>c", false, false) === "a&lt;b&gt;c",
  "4a a cut end fades over its last or first three characters, and words not cut are written as they are");
const cell = H.wizCellHtml("x".repeat(146));
check(cell === "x".repeat(115) + '<span class="fo-r">xxx</span>' && H.wizCellHtml("short") === "short",
  "4b a cell of the file longer than 118 characters is cut there and fades, with no ellipsis: " + JSON.stringify(cell.slice(110)));
check(H.phraseHtml("We will refund every penny within thirty days of the parcel...") === 'We will refund every penny within thirty days of the par<span class="fo-r">cel</span>'
  && H.phraseHtml("The postage is on us") === "The postage is on us",
  "4c a quoted clause the commitment rule cut loses its dots and fades; one it did not cut is as it was");
const row = { was: "...abc def ghi...", becomes: "...abc dXf ghi", cut: { was: { l: true, r: true }, becomes: { l: true, r: false } } };
check(H.diffSide(row, "was") === '<span class="fo-l">abc</span> def <span class="fo-r">ghi</span>'
  && H.diffSide(row, "becomes") === '<span class="fo-l">abc</span> dXf ghi'
  && H.diffSide({ was: "...as written...", cut: null }, "was") === "...as written...",
  "4d a diff's side cut by its window loses the line's dots and fades at the cut end; a side the window did not cut keeps dots that are its own words");

const D = await import(new URL("../src/diff.mjs", import.meta.url));
const B = await import(new URL("../src/bulk.mjs", import.meta.url));
const canon = (v) => JSON.stringify(v);
const before = { cards: [{ id: "a", shelf: "s", title: { en: "x" }, body: { en: "0123456789".repeat(12) } }] };
const after = { cards: [{ id: "a", shelf: "s", title: { en: "x" }, body: { en: "0123456789".repeat(6) + "Z" + "0123456789".repeat(6) } }] };
const dd = D.diffCatalogs(before, after, canon, { values: true });
const cuts = [];
const withCuts = D.diffLines(dd, { values: true, width: 70, cuts });
check(JSON.stringify(withCuts) === JSON.stringify(D.diffLines(dd, { values: true, width: 70 }))
  && /^changed card a body\.en {2}\.\.\..*\.\.\. {2}-> {2}\.\.\..*\.\.\.$/.test(withCuts[0])
  && JSON.stringify(cuts) === JSON.stringify([{ was: { l: true, r: true }, becomes: { l: true, r: true } }]),
  "4e the diff's lines are the lines they were, dots and all, and beside them each side's cut ends: " + JSON.stringify(cuts));
const rows = D.diffRows(withCuts, cuts);
check(rows.length === 1 && rows[0].cut === cuts[0] && rows[0].was.startsWith("...") && !/\.\.\./.test(H.diffSide(rows[0], "was")),
  "4f a row carries its line's cut, and the screen's side has no dots");
const ctxOf = (text) => {
  const draft = { langs: [{ code: "en" }], cards: [{ id: "c", title: { en: "t" }, body: { en: text } }] };
  const r = B.findRows(draft, { find: "needle" });
  return r && r.rows[0] && r.rows[0].places[0];
};
const far = ctxOf("x".repeat(200) + " needle " + "y".repeat(200)), near = ctxOf("a needle b");
check(!!far && far.preCut === true && far.postCut === true && !/\.\.\./.test(far.pre + far.post)
  && !!near && near.preCut === false && near.postCut === false && near.pre === "a " && near.post === " b",
  "4g a find's context says which ends it cut, with no dots in the words: " + JSON.stringify(far && { preCut: far.preCut, postCut: far.postCut, pre: far.pre.slice(-6) }));

console.log(legs + " leg(s), " + failures + " failure(s)");
process.exit(failures ? 1 : 0);
