/* FIVE FINDINGS OF THE MENDED WINDOW LEGS, HELD WITHOUT A WINDOW (board 1019, the test architect's finds of 2026-11-22).
 *
 *     node tests/windowleg-finds.mjs
 *
 * gate-kind: node
 *
 * tests/rename-project.mjs 1a and tests/polish.mjs 4a, 5a, 6b and 7a run in a window and so stand behind the window wall. Each
 * found a fault in the product, not in the leg, and each of the five is a thing a page stand-in or a reading of source text can
 * hold, so that a fault of the kind is red in the node chain and not only on the day a window is opened.
 *
 *   wlf1 the Library row's Published cell says the rev first and the dated edition after it, less prominent, in the dim small
 *        type (.mono) (Maxim, 2026-10-16 06:59: "can we have both, with rev more prominent, and dated edition less so?"); a
 *        row with no date says the rev alone, and a catalog never published says "not yet", in English and in Polish
 *   wlf2 every T() of ui/app.js whose argument is no literal is one polish.mjs 4a names (its INDIRECT list, read out of that
 *        file), and every literal is a pair of the table (5a): the band's first tab says Team, Library or Overview by a T() at
 *        each word, so the scan reads the words, and the same tab says Biblioteka in Polish
 *   wlf3 the line a stack card gives for a request sent again is whole sentences handed to T(), the two forms of it, in Polish
 *        too, with who and when
 *   wlf4 Settings' Keyboard shortcuts rows and the registry's labels say Ctrl+Up and Delete in Polish as the table gives them
 *        ("Ctrl+strzalka w gore", "Usun"), and every other chord as its own text, in English as it was
 *   wlf5 every refusal frame the node half builds is a pair of the table or a declared NO_TWIN (polish.mjs 7a), which asks
 *        that a frame be written as double-quoted literals joined by +, the quotes inside it escaped, and never as a name that
 *        is no capitals or as a local function called refuse: the scan reads the frame whole, and the table's key is the same
 *        string. The reading is polish.mjs's own scanner (framesIn), taken out of that file's text so there is one of it.
 *
 * THE PLANTS (tests/plant-copy.mjs), each in a scratch copy of the tree and each turning its own leg red alone: the cell without
 * its date (wlf1), the chosen-word T() (wlf2), the sent line's T() over a chosen constant (wlf2), the same line without its dropped form (wlf3), the chord's plain text (wlf4),
 * a frame's tail back in a variable (wlf5), a column override note back in single quotes (wlf5) and the licence refusal's local
 * wrapper back under the name refuse (wlf5).
 *
 * Node only, no window. Exit 0 when every check holds, 1 when any fails.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPage } from "./page-stand-in.mjs";
import { copyPlants } from "./plant-copy.mjs";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const ONLY = process.env.WLF_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const EXPECTED = 5 + 8 + 1 + 1;
const NB = String.fromCharCode(160);

let asserted = 0, failed = 0, skipped = 0;
function check(ok, line, detail) {
  asserted++;
  if (ok) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + (detail ? ": " + JSON.stringify(detail).slice(0, 900) : "") + "\n"); }
}
function skip(line) { skipped++; process.stdout.write("  SKIP  " + line + "\n"); }
const want = (id) => !ONLY || ONLY === id;
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const flat = (s) => String(s).split(NB).join(" ");
const textOf = (h) => flat(String(h).replace(/<svg[^]*?<\/svg>/g, "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());

/* ---- wlf1: the Library row ------------------------------------------------------------------------------------------------ */
if (want("wlf1")) {
  const cellsOf = (lang) => {
    const home = loadPage({ api: {}, uiLang: lang });
    const P = home.page;
    const mk = (dir, name, rev, edition) => ({ dir, name, rev, edition, counts: { cards: 3 }, langs: ["en", "pl"], edited: Date.now(), changes: 0, checks: 0 });
    P.S.projects = [mk("C:\\harbour", "Harbour tide", 1, "2026-09-17"), mk("C:\\pier", "Pier signs", 4, ""), mk("C:\\quay", "Quay ropes", 0, "")];
    P.S.screen = "projects"; P.S.home = "library";
    P.paintMain();
    const html = home.node("#main").innerHTML;
    const out = {};
    for (const [dir, name] of [["harbour", "Harbour tide"], ["pier", "Pier signs"], ["quay", "Quay ropes"]]) {
      const at = html.indexOf('title="' + name + '"');
      const row = html.slice(html.lastIndexOf("<tr", at), html.indexOf("</tr>", at));
      const tds = row.match(/<td[^>]*>[^]*?<\/td>/g) || [];
      out[dir] = { cell: tds[7] || "", text: textOf(tds[7] || "") };
    }
    return out;
  };
  const en = cellsOf("en"), pl = cellsOf("pl");
  check(en.harbour.text === "rev 1 2026-09-17" && /^<td>rev(?: |&nbsp;|\u00a0)1 <span class="mono">2026-09-17<\/span><\/td>$/.test(en.harbour.cell.split(NB).join(" "))
    && en.pier.text === "rev 4" && !/mono/.test(en.pier.cell) && en.quay.text === "not yet"
    && pl.harbour.text === "wersja 1 2026-09-17" && /<span class="mono">2026-09-17<\/span>/.test(pl.harbour.cell) && pl.pier.text === "wersja 4",
    "wlf1 the Library's Published cell says the rev, then the dated edition in the dim small type, and the rev alone where there is no date", { en, pl });
}

/* ---- wlf2 and wlf5 read polish.mjs's own scanner out of its text ---------------------------------------------------------- */
let scan = null;
function scanner() {
  if (scan) return scan;
  const lines = read("tests/polish.mjs").split("\n");
  const from = lines.findIndex((l) => /^function callsIn/.test(l));
  const to = lines.findIndex((l) => /COUNTS:PREDICATES/.test(l));
  const lp = lines.findIndex((l) => /^\s*function listIn\(/.test(l));
  let le = -1;
  for (let i = lp + 1; i < lines.length; i++) if (/^ {2}}$/.test(lines[i])) { le = i; break; }
  if (from < 0 || to < from || lp < 0 || le < 0) throw new Error("tests/polish.mjs has moved its scanner (callsIn, framesIn, listIn)");
  const { literalsOf, framesIn } = new Function(lines.slice(from, to).join("\n") + "\nreturn { literalsOf, framesIn };")();
  const listIn = new Function(lines.slice(lp, le + 1).join("\n") + "\nreturn listIn;")();
  const text = lines.join("\n");
  const at = text.indexOf("const INDIRECT = [");
  const block = text.slice(at, text.indexOf("];", at) + 1).replace(/[/][*][^]*?[*][/]/g, " ");
  const INDIRECT = new Function(block.replace(/^const INDIRECT = /, "return ") + ";")();
  const lang = read("ui/lang.js");
  const declared = new Set();
  const re = /"((?:[^"\\]|\\.)*)":\s*\n?\s*"((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = re.exec(lang))) declared.add(JSON.parse('"' + m[1] + '"'));
  listIn(lang, "NO_TWIN", "{", "\n  };").forEach((s) => declared.add(s));
  scan = { literalsOf, framesIn, INDIRECT, declared };
  return scan;
}

if (want("wlf2")) {
  const { literalsOf, INDIRECT, declared } = scanner();
  const lit = literalsOf(read("ui/app.js"));
  const same = lit.indirect.slice().sort().join("|") === INDIRECT.slice().sort().join("|");
  const undeclared = Array.from(new Set(lit.strings.filter((s) => !declared.has(s))));
  const tab = (lang, home) => {
    const h = loadPage({ api: {}, uiLang: lang });
    h.page.S.screen = "projects"; h.page.S.home = home; h.page.S.projects = [];
    h.page.paintTabs();
    return textOf(h.node("#tabs").innerHTML);
  };
  /* The home tab keeps the name Overview whichever of its three places is chosen (Max, 26 November); the rail names the place. */
  const saysEn = ["team", "library", "overview"].every((h) => tab("en", h).startsWith("Overview"));
  const saysPl = ["team", "library", "overview"].every((h) => tab("pl", h).startsWith("Przegląd"));
  check(same && undeclared.length === 0 && saysEn && saysPl,
    "wlf2 no T() of ui/app.js has an argument the language scan cannot read but the twenty polish.mjs 4a names, every literal is a pair, and the first tab says its screen in both languages",
    { indirectNow: lit.indirect.filter((x) => INDIRECT.indexOf(x) < 0), undeclared: undeclared.slice(0, 3), saysEn, saysPl });
}

/* ---- wlf3: the stack card's sent-again line -------------------------------------------------------------------------------- */
if (want("wlf3")) {
  const card = (lang, changed) => {
    const h = loadPage({ api: {}, uiLang: lang });
    return textOf(h.page.stkCardHtml({ kind: "team", tag: "Tag", title: "Title", body: "<p>Body</p>", changed }));
  };
  const when = "2026-11-20T10:05:00";
  const enW = card("en", { who: "Pier desk", at: when }), enD = card("en", { who: "Pier desk", at: when, dropped: true });
  const plW = card("pl", { who: "Pier desk", at: when }), plD = card("pl", { who: "Pier desk", at: when, dropped: true });
  check(/Pier desk sent this again at 10:05\./.test(enW) && !/dropped/.test(enW)
    && /Pier desk sent this again at 10:05, so the earlier answer was dropped\./.test(enD)
    && /Stanowisko Pier desk przesłało to ponownie o 10:05\./.test(plW) && !/wcześniejsza/.test(plW) && /Stanowisko Pier desk przesłało to ponownie o 10:05, więc wcześniejsza decyzja przestała obowiązywać./.test(plD),
    "wlf3 a stack card's sent-again line is the sentence of its two forms, said in English and in Polish with who and when", { enW, enD, plW, plD });
}

/* ---- wlf4: two chords in Polish -------------------------------------------------------------------------------------------- */
if (want("wlf4")) {
  const rows = (lang) => {
    const h = loadPage({ api: {}, uiLang: lang });
    return h.page.sxKeysRows().join("\n");
  };
  const buttons = (html) => (html.match(/<button[^>]*sc-bind[^>]*>[^<]*<\/button>/g) || []).map((b) => b.replace(/<[^>]*>/g, ""));
  const en = buttons(rows("en")), pl = buttons(rows("pl"));
  const lang = read("ui/lang.js");
  const plUp = (lang.match(/"Ctrl\+Up":\s*"([^"]*)"/) || [])[1], plDel = (lang.match(/"Delete":\s*"([^"]*)"/) || [])[1];
  check(plUp && plDel && en.indexOf("Ctrl+Up") >= 0 && en.indexOf("Delete") >= 0 && pl.indexOf(plUp) >= 0 && pl.indexOf(plDel) >= 0
    && pl.indexOf("Ctrl+Up") < 0 && pl.indexOf("Delete") < 0 && pl.indexOf("Ctrl+Z") >= 0 && pl.indexOf("F2") >= 0,
    "wlf4 Settings' shortcut rows say Ctrl+Up and Delete in Polish as the table gives them, every other chord as its own text, and English as it was", { en: en.slice(0, 40), pl: pl.slice(0, 40), plUp, plDel });
}

/* ---- wlf5: every refusal frame is read whole and is a pair ------------------------------------------------------------------ */
if (want("wlf5")) {
  const { framesIn, declared } = scanner();
  const files = fs.readdirSync(path.join(ROOT, "src")).filter((n) => n.endsWith(".mjs")).map((n) => "src/" + n).concat(["shell/main.js"]);
  const frames = new Set();
  files.forEach((rel) => framesIn(read(rel)).forEach((f) => frames.add(f)));
  const bare = Array.from(frames).filter((f) => !declared.has(f));
  const named = ["this draft is waiting for its {LANG} text: the catalog declares {LANGS}, and cards lacking {LANG}: {N} of {TOTAL}. A language beyond the first is optional, so the import stands as it is and the gap is shown here once rather than on every card. It publishes as it stands, and what is still missing is counted on the publish cover and in the release notes.",
    "the column override names a column the file does not have: \"{H}\""];
  const seen = named.filter((f) => frames.has(f));
  check(bare.length === 0 && seen.length === named.length,
    "wlf5 every refusal frame the node half builds, " + frames.size + " read whole, is a pair of the table or a declared NO_TWIN, among them the import's awaiting note and the column override's", { bare: bare.slice(0, 4), seen: seen.length });
}

copyPlants({
  root: ROOT, self: SELF, label: "windowleg-finds", onlyVar: "WLF_ONLY", check, skip,
  plants: [
    { mark: "wf-dated", leg: "wlf1", rel: "ui/app.js", line: '      + "<td>" + esc(publishedWords(p)) + "</td>"' },
    { mark: "wf-home", leg: "wlf2", rel: "ui/app.js", line: '      + \' data-act="to-projects" tabindex="0">\' + I("home") + esc(T(S.home === "team" ? "Team" : S.home === "library" ? "Library" : "Overview")) + "</span>");' },
    { mark: "stk-sent", leg: "wlf2", rel: "ui/app.js", line: '    const sent = changed ? T(changed.dropped ? sentDrop : sentWhen, sentVars) : "";' },
    { mark: "stk-sent", leg: "wlf3", rel: "ui/app.js", line: '    const sent = changed ? T("{DESK} sent this again at {TIME}.", sentVars) : "";' },
    { mark: "wf-chord", leg: "wlf4", rel: "ui/app.js", line: "  const chordSaid = (text) => text;" },
    { mark: "wf-tail", leg: "wlf5", rel: "src/import.mjs", line: "          + tailLine," },
    { mark: "wf-override", leg: "wlf5", rel: "src/mapping.mjs", line: "      errorNotes.push(noteOf('the column override names a column the file does not have: \"{H}\"'," },
    { mark: "wf-refuse", leg: "wlf5", rel: "shell/main.js", line: '  if (st.by !== "signin") throw refuse("person-lead");' },
  ],
});

if (!ONLY) check(asserted + skipped + 1 === EXPECTED, "wlf0 every leg ran: " + (asserted + skipped + 1) + " of " + EXPECTED + (skipped ? ", " + skipped + " skipped" : ""));
process.stdout.write("windowleg-finds: " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)" + (PLANTS_OFF ? " (ETIUDA_PLANTS=off)" : "") + "\n");
process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + "\n");
process.exit(failed ? 1 : 0);
