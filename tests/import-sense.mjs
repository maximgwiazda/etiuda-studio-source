/* THE IMPORT, FROM A PERSON'S FILE TO A PLAN, AS THE SENSE PASS OF 2026-09-22 MET IT.
 *
 *     node tests/import-sense.mjs [--keep]
 *
 * One section per finding of the pass's import half that is fixed below the screen: each leg
 * is a file somebody on a Polish desk actually has, and what the plan makes of it. Every input
 * is invented here, from a seed of a few lines of generic support wording, and written to
 * scratch; nothing is committed but this generator.
 *
 *   1  the separator and the code page (item 1): semicolons, tabs, windows-1250, UTF-16
 *   2  a text file of replies read by its blank lines (item 2)
 *   3  Polish content under bare headings is Polish (item 3)
 *   4  a heading nobody listed can still be mapped (item 4)
 *  18  landing one's own import is attributed without a flag (item 18)
 *  42  the queue knows one's own import (item 42)
 *  19  a decided proposal leaves the inbox (item 19)
 *  20  the picker sees a workbook and an export, and an export has a door (item 20)
 *  13  names and identities are not minted from accidents (item 13)
 *  21  an import meeting a card already here empties nothing (Studio polish 04, item 1)
 *
 * EACH SECTION CARRIES ITS OWN CONTROL, the file the fix must NOT change, because every one of
 * these is a guess about bytes and a guess that rescues one file by breaking another has made
 * things worse.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { examine } from "../src/source.mjs";
import { importPlan, importLand, openProposal, decideProposal, listProposals, INBOX,
         DECIDED } from "../src/studio.mjs";
import { importCsv, REPORT_KIND as IMPORT_REPORT_KIND } from "../src/import.mjs";
import { json, PROJECT_FILE, DRAFT_FILE } from "../src/publish.mjs";
import { reviewProposal } from "../src/review.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "import-sense");

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

/* ---- the invented content ------------------------------------------------------------------ */

const EN = [
  ["Order shipped", "Thank you for waiting; the parcel left today, and it arrives in three days.", "orders"],
  ["Refund started", "The refund is on its way. It shows on the statement within five days.", "payments"],
  ["Password reset", "Use the link on the sign-in page, then check the spam folder as well.", "account"],
  ["Closing the chat", "Is there anything else I can help with today?", "general"],
];
/* Every Polish letter, upper and lower case, somewhere in these, so that a code page that
   loses one loses it visibly: the pass saw "Środki" arrive as "rod". */
const PL = [
  ["Zamówienie wysłane", "Dziękujemy za cierpliwość. Paczka wyszła dziś i dotrze w ciągu trzech dni.", "zamowienia"],
  ["Zwrot rozpoczęty", "Środki wrócą na konto, może trochę później; zwykle w ciągu pięciu dni.", "platnosci"],
  ["Łączenie kont", "Dzień dobry. Żeby połączyć konta, proszę kliknąć odnośnik w wiadomości.", "konto"],
  ["Źródło błędu", "UWAGA: ŻEBY ZMIENIĆ HASŁO, PROSZĘ OTWORZYĆ ZAŁĄCZNIK. SZCZEGÓŁY DO KOŃCA DNIA.", "ogolne"],
];
const HEAD = ["Title", "Body", "Category"];
const q = (s) => /[",;\r\n\t]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
const csv = (rows, sep) => rows.map(r => r.map(q).join(sep)).join("\r\n") + "\r\n";

/* windows-1250 by table, so the generator does not lean on the decoder it is testing. */
const CP1250 = { "ą": 0xB9, "ć": 0xE6, "ę": 0xEA, "ł": 0xB3, "ń": 0xF1, "ó": 0xF3, "ś": 0x9C,
  "ź": 0x9F, "ż": 0xBF, "Ą": 0xA5, "Ć": 0xC6, "Ę": 0xCA, "Ł": 0xA3, "Ń": 0xD1, "Ó": 0xD3,
  "Ś": 0x8C, "Ź": 0x8F, "Ż": 0xAF };
const CP1252 = { "é": 0xE9, "è": 0xE8, "à": 0xE0, "ô": 0xF4, "ç": 0xE7, "ê": 0xEA, "û": 0xFB };
const bytesBy = (map) => (s) => Buffer.from(Array.from(s).map(ch => {
  if (map[ch] != null) return map[ch];
  if (ch.charCodeAt(0) > 0x7F) throw new Error("the generator has no byte for " + ch);
  return ch.charCodeAt(0);
}));
const enc1250 = bytesBy(CP1250), enc1252 = bytesBy(CP1252);
const utf16le = (s) => Buffer.concat([Buffer.from([0xFF, 0xFE]), Buffer.from(s, "utf16le")]);
const bom8 = (s) => Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from(s, "utf8")]);

function write(name, bytes) {
  const at = path.join(SCRATCH, "in", name);
  fs.mkdirSync(path.dirname(at), { recursive: true });
  fs.writeFileSync(at, bytes);
  return at;
}
const cellsOf = (src, col) => src.table.rows.map(r => r[col]);
const allText = (src) => JSON.stringify(src.table);

async function main(argv) {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const projects = path.join(SCRATCH, "projects");
  fs.mkdirSync(projects, { recursive: true });

  /* ---- 1. the separator and the code page (item 1) --------------------------------------- */

  const plSemi = csv([HEAD, ...PL], ";");
  const want = PL.map(r => r[1]);

  const c1 = examine({ buf: enc1250(plSemi) });
  check(c1.shape === "table" && c1.table.head.join("|") === HEAD.join("|")
    && c1.encoding === "windows-1250"
    && JSON.stringify(cellsOf(c1, "Body")) === JSON.stringify(want),
    "1a what Excel on a Polish desk saves as CSV, semicolons in windows-1250, is a table of "
    + c1.table.head.length + " column(s) read as " + c1.encoding + ", every Polish letter intact"
    + " (" + JSON.stringify(String(cellsOf(c1, "Body")[1] || "").slice(0, 12)) + ")");

  const c2 = examine({ buf: bom8(plSemi) });
  check(c2.shape === "table" && c2.encoding === "utf-8"
    && JSON.stringify(cellsOf(c2, "Body")) === JSON.stringify(want),
    "1b the same semicolons as Excel's CSV UTF-8, with its byte order mark: a table of "
    + c2.table.head.length + " column(s)");

  const c3 = examine({ buf: enc1250(csv([HEAD, ...PL], ",")) });
  check(c3.shape === "table" && c3.encoding === "windows-1250"
    && JSON.stringify(cellsOf(c3, "Title")) === JSON.stringify(PL.map(r => r[0]))
    && !/[³¹¿£¥¯œæ]/.test(allText(c3)),
    "1c commas in windows-1250 are read as windows-1250, not labelled 1252 and mangled: "
    + JSON.stringify(cellsOf(c3, "Title")[0]) + ", read as " + c3.encoding);

  const tsv = csv([HEAD, ...EN], "\t");
  const f1 = examine({ text: tsv });
  check(f1.shape === "table" && f1.table.head.join("|") === HEAD.join("|")
    && cellsOf(f1, "Body")[0] === EN[0][1],
    "1d a tab-separated file is a table of " + f1.table.head.length + " column(s), and the"
    + " semicolon and comma inside its first body stay in the body");

  const u16 = examine({ buf: utf16le(csv([HEAD, ...PL], "\t")) });
  check(u16.shape === "table" && u16.encoding === "utf-16le"
    && JSON.stringify(cellsOf(u16, "Body")) === JSON.stringify(want),
    "1e Excel's Unicode text, UTF-16 with tabs, is a table read as " + u16.encoding);

  /* THE CONTROLS. A comma file whose prose carries semicolons stays a comma table, since the
     rows agree on commas; a French file in windows-1252 stays 1252, because its accents are
     letters there and not Polish letters in 1250; and the ordinary UTF-8 comma file is read
     exactly as it always was. */
  const semisInProse = [HEAD, ...EN.map(r => [r[0], r[1] + "; see also; the help page", r[2]])];
  const k1 = examine({ text: csv(semisInProse, ",") });
  check(k1.shape === "table" && k1.table.head.length === 3
    && /; see also; the help page$/.test(cellsOf(k1, "Body")[0]),
    "1f CONTROL: a comma file with semicolons in its prose is still a comma table of "
    + k1.table.head.length + " column(s), its semicolons kept in the text");

  const WEST = [["Titre", "Corps"], ["Réponse", "Voilà, c'est très bien noté à côté."],
              ["Fermeture", "Merci, à bientôt; bonne soirée."], ["Délai", "Reçu, en tête."]];
  const k2 = examine({ buf: enc1252(csv(WEST, ",")) });
  check(k2.encoding === "windows-1252" && cellsOf(k2, "Corps")[0] === WEST[1][1],
    "1g CONTROL: a French file in windows-1252 is read as " + k2.encoding + ", "
    + JSON.stringify(cellsOf(k2, "Corps")[0]));

  const k3 = examine({ text: csv([HEAD, ...EN], ",") });
  check(k3.shape === "table" && k3.encoding === "utf-8" && k3.table.head.length === 3
    && cellsOf(k3, "Body")[0] === EN[0][1],
    "1h CONTROL: the ordinary UTF-8 comma file is the table it always was");

  /* AND THE PLAN SAYS IT, because the plan is what the wizard paints: the semicolon file used
     to end at the no-plan screen with Cancel alone. */
  const p1 = await importPlan(projects, write("pl-excel.csv", enc1250(plSemi)), {}, "");
  check(!p1.refusal && p1.encoding === "windows-1250" && p1.cols === 3
    && p1.report.counts.cards === PL.length,
    "1i the Polish Excel file makes a plan of " + (p1.report ? p1.report.counts.cards : 0)
    + " card(s) over " + p1.cols + " column(s), encoding named " + p1.encoding
    + (p1.refusal ? "; refused: " + p1.refusal : ""));

  /* ---- 2. a text file of replies is read by its blank lines (item 2) --------------------- */

  const CR = "\r\n";
  const blocksText = (blocks) => blocks.map(b => b.join(CR)).join(CR + CR) + CR;
  /* Eight replies, a title line over a body of two or three lines, alternating: 3 + 4 lines is
     a cycle of 7, which the line reading found and called certain. */
  const BODY = [
    "Thank you for waiting.", "The parcel left the warehouse today.",
    "It should arrive within three working days.", "Tracking follows by e-mail.",
  ];
  const eight = [];
  for (let i = 0; i < 8; i++)
    eight.push(["Reply " + (i + 1)].concat(BODY.slice(0, i % 2 ? 3 : 2).map(l => l + " (" + (i + 1) + ")")));
  const e8 = examine({ text: blocksText(eight) });
  check(e8.shape !== "periodic" && e8.table.rows.length === 8
    && e8.table.rows.every((r, i) => r[e8.table.head[0]] === eight[i].join("\n")),
    "2a eight replies of three and four lines are eight cells, one per reply, not "
    + (e8.periodic ? "a cycle of " + e8.periodic.period : "a cycle") + " (shape " + e8.shape
    + ", " + e8.table.rows.length + " row(s))");

  /* Six titled replies, two of whose bodies run to a second line: the pass's g3. */
  const six = EN.concat(EN.slice(0, 2)).map((r, i) =>
    [r[0] + " " + (i + 1), r[1]].concat(i === 1 || i === 4 ? ["And a second line."] : []));
  const g3 = examine({ text: blocksText(six) });
  check(g3.table.rows.length === 6 && g3.table.head[0] === "blocks"
    && g3.table.rows[0].blocks.split("\n")[0] === six[0][0],
    "2b six titled replies with two two-line bodies are six cells, each with its title on"
    + " top, not " + 13 + " line-cells with titles and bodies mixed (" + g3.table.rows.length
    + " row(s))");

  const one = examine({ text: blocksText(EN.map(r => [r[1]])) });
  check(one.table.rows.length === EN.length && one.table.rows[0].blocks === EN[0][1],
    "2c a file of one-line replies between blank lines keeps its first reply as a reply,"
    + " not as the column's name: " + one.table.rows.length + " of " + EN.length + " row(s)");

  /* THE CONTROLS. Title over body, blank, and again, is the cycle it always was; a one-column
     CSV with a heading keeps its heading; a quoted field with a blank line inside it is one
     field, not two blocks. */
  const pairs = EN.concat(EN.slice(0, 2)).map((r, i) => [r[0] + " " + (i + 1), r[1]]);
  const g2 = examine({ text: blocksText(pairs) });
  check(g2.shape === "periodic" && g2.periodic.period === 2 && g2.table.rows.length === 6,
    "2d CONTROL: title over body in every block is still a cycle of "
    + (g2.periodic ? g2.periodic.period : "-") + " with " + g2.table.rows.length + " row(s)");

  const col = examine({ text: "Body" + CR + EN.map(r => q(r[1])).join(CR) + CR });
  check(col.table.head[0] === "Body" && col.table.rows.length === EN.length,
    "2e CONTROL: a one-column CSV headed Body keeps Body as its name and " + EN.length
    + " row(s) under it (" + col.table.rows.length + ")");

  const quoted = examine({ text: "Body" + CR + '"First paragraph.' + CR + CR
    + 'Second paragraph."' + CR + '"Another reply."' + CR });
  check(quoted.table.head[0] === "Body" && quoted.table.rows.length === 2
    && /First paragraph\.\r\n\r\nSecond/.test(quoted.table.rows[0].Body),
    "2f CONTROL: a quoted field holding a blank line is one field of a headed column, not two"
    + " blocks (" + quoted.table.rows.length + " row(s))");

  /* ---- 3. Polish content under bare headings is Polish (item 3) -------------------------- */

  const plan = (name, text, override) =>
    importPlan(projects, write(name, Buffer.from(text, "utf8")), override || {}, "");
  const langErr = (p) => ((p.report || {}).findings || [])
    .filter(f => f.severity === "error" && /is headed \w+ and reads as/.test(f.what)).length;

  const e1 = await plan("pl-bare.csv", csv([HEAD, ...PL], ","));
  check(!e1.refusal && e1.langs.join(",") === "pl" && e1.report.primary === "pl"
    && langErr(e1) === 0,
    "3a Polish text under the bare headings Title and Body is a Polish catalog: langs "
    + JSON.stringify(e1.langs) + ", " + langErr(e1) + " header-against-text error(s)");

  const e2 = await plan("pl-bare-body-pl.csv", csv([HEAD, ...PL], ","), { Body: "body.pl" });
  check(!e2.refusal && e2.langs.join(",") === "pl",
    "3b and the mapping table's Text, Polish says the same by hand: langs "
    + JSON.stringify(e2.langs));

  const k4 = await plan("en-bare.csv", csv([HEAD, ...EN], ","));
  check(!k4.refusal && k4.langs.join(",") === "en" && langErr(k4) === 0,
    "3c CONTROL: English under bare headings is still English: " + JSON.stringify(k4.langs));

  const k5 = await plan("pl-under-en.csv", csv([["Title (EN)", "Body (EN)", "Category"], ...PL], ","));
  check(!k5.refusal && k5.langs[0] === "en" && langErr(k5) === 1,
    "3d CONTROL: a heading that NAMES a language still wins over the text, and the"
    + " disagreement is still an error for a person to settle: langs " + JSON.stringify(k5.langs)
    + ", " + langErr(k5) + " error(s)");

  /* ---- 4. a heading nobody listed can still be mapped (item 4) --------------------------- */

  const d1 = await plan("pl-headings.csv", csv([["Tytuł", "Treść", "Kategoria"], ...PL], ","));
  check(!d1.refusal && d1.langs.join(",") === "pl"
    && d1.columns.map(c => c.field).join(",") === "title,body,shelf",
    "4a Polish headings map by themselves: Tytuł, Treść and Kategoria become "
    + (d1.columns ? d1.columns.map(c => c.field).join(", ") : "NOTHING, refused: " + d1.refusal));

  const ODD = ["Snippet", "Wording", "Bucket"];
  const h1 = await plan("odd.csv", csv([ODD, ...EN], ","));
  check(!!h1.refusal && Array.isArray(h1.columns)
    && h1.columns.map(c => c.header).join("|") === ODD.join("|")
    && h1.columns[1].first === EN[0][1] && !!h1.fields && !!h1.fields.body,
    "4b headings no alias knows are refused WITH the mapping table: " + (h1.columns
      ? h1.columns.length + " column(s), each with its first row beside it"
      : "no columns, so the screen has nothing to offer but Cancel"));

  const h2 = await plan("odd.csv", csv([ODD, ...EN], ","), { Wording: "body", Snippet: "title" });
  check(!h2.refusal && h2.report.counts.cards === EN.length && h2.langs.join(",") === "en",
    "4c and choosing Text for one of them in that table makes the plan: "
    + (h2.report ? h2.report.counts.cards + " card(s)" : "refused: " + h2.refusal));

  const blocksPlan = await plan("replies.txt", blocksText(six));
  const blocksPicked = blocksPlan.columns ? await plan("replies.txt", blocksText(six),
    { blocks: "body" }) : null;
  check(!!blocksPlan.refusal && !!blocksPlan.columns && !!blocksPicked && !blocksPicked.refusal
    && blocksPicked.report.counts.cards === six.length,
    "4d a text file of replies ends at the mapping table too, and Text for its blocks makes "
    + (blocksPicked && blocksPicked.report ? blocksPicked.report.counts.cards : 0)
    + " card(s) of " + six.length + " replies");

  const k6 = await plan("empty-body.csv", "Title,Body" + CR);
  check(!!k6.refusal && k6.columns === undefined,
    "4e CONTROL: a refusal the mapping cannot answer (a heading and no rows) carries no table,"
    + " and ends at the no-plan screen as before: " + JSON.stringify(k6.refusal));

  /* A HELPDESK'S OWN HEADINGS (Studio polish 04, item 7): the reply under "Comment", its
     language named in words. The file had to be mapped by hand, column by column. */
  const byName = await plan("macros-comment.csv", csv([["Title", "Comment (English)",
    "Comment (Polish)", "Category"], ...EN.map((r, i) => [r[0], r[1], PL[i][1], r[2]])], ","));
  const becameOf = (p) => (p.columns || []).map(c => c.header + "=" + c.field
    + (c.lang ? "." + c.lang : "")).join(", ");
  check(!byName.refusal && byName.langs.join(",") === "en,pl"
    && becameOf(byName) === "Title=title, Comment (English)=body.en, Comment (Polish)=body.pl,"
      + " Category=shelf",
    "4f a helpdesk's Comment (English) and Comment (Polish) are the text in two languages: "
    + (byName.refusal ? "refused: " + byName.refusal : becameOf(byName)));
  const words = await plan("words.csv", csv([["Tytuł (polski)", "Treść (polski)",
    "Body (Deutsch)"], ...PL.map(r => [r[0], r[1], "Guten Tag."])], ","));
  check(!words.refusal && becameOf(words) === "Tytuł (polski)=title.pl, Treść (polski)=body.pl,"
      + " Body (Deutsch)=body.de",
    "4g and a language is read by its name in English, in Polish or in itself: "
    + (words.refusal ? "refused: " + words.refusal : becameOf(words)));
  const noted = await plan("body-and-comment.csv", csv([["Title", "Body", "Comment"],
    ...EN.map(r => [r[0], r[1], "internal"])], ","));
  check(!noted.refusal && becameOf(noted) === "Title=title, Body=body, Comment=note"
    && becameOf(await plan("body-engineering.csv", csv([["Title", "Body (Engineering)"],
      ...EN.map(r => [r[0], r[1]])], ","))) === "Title=title, Body (Engineering)=null",
    "4h CONTROL: beside a Body the Comment is still the card's note, and a word in brackets that"
    + " is no language names none: " + becameOf(noted));

  /* ---- 18 and 42. the queue knows the person's own import ------------------------------- */

  /* A project, and the same file imported into it the way the wizard's Into this catalog does:
     a proposal in the inbox and the importer's report beside it. */
  const homeAt = path.join(projects, "home");
  fs.mkdirSync(homeAt, { recursive: true });
  const homeMade = await importCsv({ text: csv([HEAD, ...EN.slice(0, 2)], ","),
    id: "home-catalog", name: "Home" });
  fs.writeFileSync(path.join(homeAt, DRAFT_FILE), json(homeMade.catalog), "utf8");
  fs.writeFileSync(path.join(homeAt, PROJECT_FILE), json({ id: "home-catalog", name: "Home",
    rev: 0, edition: "", draft: DRAFT_FILE, folder: null }), "utf8");
  const mine = write("my-replies.csv", Buffer.from(csv([HEAD, ...EN], ","), "utf8"));
  const landed = await importLand(projects, mine, {}, homeAt);
  const opened = await openProposal(homeAt, landed.file);
  const said = opened.notes.map(n => n.message).join(" | ");
  check(opened.ok && opened.importedFrom === "my-replies.csv"
    && opened.notes.length === 1 && /imported here from my-replies\.csv/.test(said)
    && !/different catalog|modified: true|made against rev|claims rev/.test(said),
    "42a the queue says the person's own import came from the file they chose, and none of"
    + " the stranger's notes: " + JSON.stringify(said.slice(0, 90)));
  check(opened.foreign === true && opened.proposes && opened.proposes.cards > 0,
    "42b and it is still read as cards coming in, which is the design: "
    + JSON.stringify(opened.proposes));

  /* The same file dropped into the inbox with no report beside it is somebody else's. */
  const dropped = path.join(homeAt, INBOX, "dropped.ec");
  fs.copyFileSync(landed.file, dropped);
  const stranger = await openProposal(homeAt, dropped);
  const strangerSaid = stranger.notes.map(n => n.message).join(" | ");
  check(stranger.ok && !stranger.importedFrom
    && /different catalog/.test(strangerSaid) && /modified: true/.test(strangerSaid),
    "42c CONTROL: the same bytes with no importer's report beside them are still a document"
    + " from elsewhere, with both of its notes");
  check(IMPORT_REPORT_KIND === "etiuda-studio-import-report"
    && fs.readFileSync(path.join(ROOT, "src", "review.mjs"), "utf8")
      .indexOf('const IMPORT_KIND = "' + IMPORT_REPORT_KIND + '"') >= 0,
    "42d the kind src/review.mjs recognises is the kind src/import.mjs writes, "
    + JSON.stringify(IMPORT_REPORT_KIND));

  const noFrom = await reviewProposal({ project: homeAt, file: landed.file,
    rules: [{ verb: "accept", pattern: "*" }], write: false });
  check(!noFrom.ok && /attributable/.test(noFrom.refusal) && !/--from/.test(noFrom.refusal),
    "18a a decision with nobody named is still refused, in words that name no flag: "
    + JSON.stringify(String(noFrom.refusal).slice(0, 70)));

  /* ---- 19. a decided proposal leaves the inbox ------------------------------------------- */

  const shelfAt = path.join(projects, "shelf");
  fs.mkdirSync(shelfAt, { recursive: true });
  fs.writeFileSync(path.join(shelfAt, DRAFT_FILE), json(homeMade.catalog), "utf8");
  fs.writeFileSync(path.join(shelfAt, PROJECT_FILE), json({ id: "home-catalog", name: "Shelf",
    rev: 0, edition: "", draft: DRAFT_FILE, folder: null }), "utf8");
  const sheet = write("sheet.csv", Buffer.from(csv([HEAD, ...EN], ","), "utf8"));
  const first = await importLand(projects, sheet, {}, shelfAt);
  const firstOpen = await openProposal(shelfAt, first.file);
  const all = {};
  firstOpen.changes.forEach(c => { all[c.key] = "accept"; });
  const keys = Object.keys(all);
  /* One row left undecided first: the file must stay, because something in it still waits. */
  const partial = Object.assign({}, all); delete partial[keys[0]];
  const half = await decideProposal(shelfAt, first.file, partial, "sheet.csv", null);
  check(half.ok && half.pending.length === 1 && half.decidedTo === null
    && fs.existsSync(first.file),
    "19a CONTROL: a land that leaves a row waiting leaves the file in the inbox ("
    + (half.pending || []).length + " waiting)");

  const again = await importLand(projects, sheet, {}, shelfAt).catch(e => e);
  check(again instanceof Error && /with 1 row still waiting/.test(again.message),
    "19b and importing the same file name then is refused, saying what is really waiting: "
    + JSON.stringify(String(again.message || "").replace(/^.* with /, "with ")));

  const rest = await decideProposal(shelfAt, first.file, all, "sheet.csv", null);
  const decidedDir = path.join(shelfAt, DECIDED);
  const listed = (await listProposals(shelfAt)).proposals.map(p => p.name);
  check(rest.ok && rest.pending.length === 0 && !fs.existsSync(first.file)
    && fs.existsSync(path.join(decidedDir, "sheet.ec"))
    && fs.existsSync(path.join(decidedDir, "sheet.lint.json"))
    && listed.indexOf("sheet.ec") < 0,
    "19c once nothing in it waits, the file and its report leave the inbox for "
    + DECIDED + "/ and the list no longer shows it: " + JSON.stringify(listed));

  fs.writeFileSync(sheet, csv([HEAD, ...EN.map(r => [r[0], r[1] + " Updated.", r[2]])], ","));
  const second = await importLand(projects, sheet, {}, shelfAt).catch(e => e);
  check(!(second instanceof Error) && fs.existsSync(second.file),
    "19d so the updated sheet imports under the same name, where it was refused for ever: "
    + (second instanceof Error ? second.message : path.basename(second.file)));
  const secondOpen = await openProposal(shelfAt, second.file);
  const allTwo = {};
  secondOpen.changes.forEach(c => { allTwo[c.key] = "reject"; });
  const done2 = await decideProposal(shelfAt, second.file, allTwo, "sheet.csv", null);
  check(done2.ok && fs.existsSync(path.join(decidedDir, "sheet-2.ec"))
    && fs.existsSync(path.join(decidedDir, "sheet.ec")),
    "19e and the second, decided too, is kept beside the first rather than over it: "
    + JSON.stringify(fs.readdirSync(decidedDir)));

  /* ---- 21. an import that meets a card already here (polish 04, item 1) ------------------
   *
   * A row of the file carries the id of a card the project already has, and the file has no
   * column for most of what that card holds. What the file does not carry must be left as it is:
   * the queue offered to empty every such field, and Accept all took it. */
  const RICH = [["id", "Category", "Title_en", "Title_pl", "Body_en", "Body_pl", "Note_en",
                 "Intents", "Keywords"],
    ["back-in-stock", "orders", "Back in stock", "Znowu dostępne", "It is back on the shelf.",
     "Znowu jest na półce.", "Check the storeroom first.", "restock", "restock shelf"],
    ["order-shipped", "orders", "Order shipped", "Wysłane", EN[0][1], PL[0][1], "", "", ""]];
  const richMade = await importCsv({ text: csv(RICH, ","), id: "rich-home", name: "Rich" });
  const richDraft = richMade.catalog;
  const richShelf = richDraft.tags.find(t => t.kind === "shelf");
  Object.assign(richShelf, { icon: "parcel", hue: 3 });
  richShelf.label.pl = "Zamówienia";
  richDraft.cards.find(c => c.id === "back-in-stock").intentTop = true;
  const richAt = (name) => {
    const at = path.join(projects, name);
    fs.mkdirSync(at, { recursive: true });
    fs.writeFileSync(path.join(at, DRAFT_FILE), json(richDraft), "utf8");
    fs.writeFileSync(path.join(at, PROJECT_FILE), json({ id: "rich-home", name: "Rich",
      rev: 0, edition: "", draft: DRAFT_FILE, folder: null }), "utf8");
    return at;
  };
  const THIN = [["id", "Category", "Title", "Body"],
    ["back-in-stock", "orders", "Back in stock", "From Monday it is back on the shelf."],
    ["gift-wrap", "orders", "Gift wrap", "Every order can be wrapped at no charge."]];
  const had = richDraft.cards.find(c => c.id === "back-in-stock");
  const on21 = (c) => (c.scope === "card" && c.id === "back-in-stock")
    || (c.scope === "tag" && c.id === richShelf.id);

  const rich1 = richAt("rich-one");
  const thin1 = await importLand(projects, write("helpdesk-macros.csv",
    Buffer.from(csv(THIN, ","), "utf8")), {}, rich1);
  const seen21 = await reviewProposal({ project: rich1, file: thin1.file, rules: [], write: false });
  const emptying = seen21.changes.filter(c => on21(c) && c.to === undefined);
  check(seen21.ok && emptying.length === 0,
    "21a a row meeting a card already here offers to empty none of the fields the file has no"
    + " column for: " + emptying.length + " such row(s) " + JSON.stringify(emptying.map(c => c.key)));
  check(seen21.changes.some(c => c.key === "card:back-in-stock:body.en")
    && seen21.changes.some(c => c.key === "card+:gift-wrap"),
    "21b while what the file does say still arrives: its body for that card as a change, and its"
    + " new card as an addition");

  /* BY KEY: the file's first import has nothing to be read against, so a row meeting a card
     here is held back from a star (src/review.mjs classify) and is accepted by its own key. */
  const all21 = await reviewProposal({ project: rich1, file: thin1.file,
    rules: seen21.changes.map(c => ({ verb: "accept", pattern: c.key })),
    from: "helpdesk-macros.csv", write: true });
  const after21 = JSON.parse(fs.readFileSync(path.join(rich1, DRAFT_FILE), "utf8"));
  const card21 = after21.cards.find(c => c.id === "back-in-stock");
  const shelf21 = after21.tags.find(t => t.id === richShelf.id);
  const kept = ["title.pl", "body.pl", "note.en", "k", "requests", "intentTop"].filter(p => {
    const get = (o) => p.split(".").reduce((v, k) => (v == null ? v : v[k]), o);
    return JSON.stringify(get(card21)) === JSON.stringify(get(had));
  });
  check(all21.ok && card21.body.en === THIN[1][3] && kept.length === 6
    && shelf21.icon === "parcel" && shelf21.hue === 3 && shelf21.label.pl === "Zamówienia",
    "21c and every row accepted lands the file's body while the card keeps " + kept.length
    + " of 6 fields"
    + " the file never had (" + kept.join(", ") + ") and its category keeps its icon, colour"
    + " and Polish label");

  const rich2 = richAt("rich-two");
  const same21 = await importLand(projects, write("rich-home.csv",
    Buffer.from(csv(THIN, ","), "utf8")), {}, rich2);
  const seenSame = await reviewProposal({ project: rich2, file: same21.file, rules: [],
    write: false });
  check(seenSame.ok && seenSame.importedFrom === "rich-home.csv"
    && !seenSame.changes.some(c => c.op === "remove" || c.scope === "header")
    && seenSame.changes.map(c => c.key).join() === seen21.changes.map(c => c.key).join(),
    "21d a file whose name makes the project's own id is still the person's import: the same "
    + seen21.changes.length + " row(s), no removal of the cards it leaves out and no header row ("
    + seenSame.changes.filter(c => c.op === "remove" || c.scope === "header").length + ")");

  const F21 = await (await import("../src/engine.mjs")).format();
  const rich3 = richAt("rich-three");
  const desk21 = JSON.parse(JSON.stringify(richDraft));
  delete desk21.cards.find(c => c.id === "back-in-stock").note;
  desk21.modified = true;
  delete desk21.hash; desk21.hash = F21.contentHash(desk21);
  const deskAt = path.join(rich3, INBOX, "from-a-desk.ec");
  fs.mkdirSync(path.dirname(deskAt), { recursive: true });
  fs.writeFileSync(deskAt, json(desk21), "utf8");
  const seenDesk = await reviewProposal({ project: rich3, file: deskAt, rules: [], write: false });
  check(seenDesk.ok && !seenDesk.foreign
    && seenDesk.changes.some(c => c.key === "card:back-in-stock:note" && c.to === undefined),
    "21e CONTROL: this catalog's own export from a desk that deleted a note still offers the"
    + " deletion; the rule is about what arrives from outside");

  /* ---- 20. the picker sees a workbook and an export, and an export has a door ------------ */

  const EXPORTS = {
    "macros-actions": { macros: EN.map((r, i) => ({ id: "m" + i, title: r[2] + "::" + r[0],
      description: "", actions: [{ field: "comment_value", value: r[1] }] })) },
    "folders-responses": { folders: [{ name: "orders", canned_responses: EN.map((r, i) =>
      ({ id: "f" + i, title: r[0], content: r[1] })) }] },
    "templates-list": { templates: EN.map((r, i) => ({ id: "t" + i, name: r[0],
      body: "<p>" + r[1] + "</p>", folder_id: r[2] })) },
    "macros-list": { macros: EN.map((r, i) => ({ id: "l" + i, name: r[0],
      actions: [{ name: "setResponseText", arguments: { body_text: r[1] } }] })) },
  };
  const readAll = Object.keys(EXPORTS).map(shape => {
    const s = examine({ text: JSON.stringify(EXPORTS[shape], null, 1) });
    return { shape, ok: s.source === "export" && s.shape === "table"
      && s.table.head.join(",") === "id,shelf,title,body,note,requests,role"
      && s.table.rows.length === EN.length && s.table.rows[0].body === EN[0][1] };
  });
  check(readAll.every(x => x.ok),
    "20a each of the four JSON exports is read as a table of the seven columns the command line"
    + " writes, " + EN.length + " row(s), the reply in the body: "
    + readAll.map(x => x.shape + (x.ok ? "" : " WRONG")).join(", "));

  const ex = await plan("macros.json", JSON.stringify(EXPORTS["macros-actions"]));
  check(!ex.refusal && ex.report.counts.cards === EN.length
    && ex.columns.find(c => c.header === "body").field === "body",
    "20b and a picked export makes a plan like any table: "
    + (ex.report ? ex.report.counts.cards + " card(s)" : "refused: " + ex.refusal));

  const odd = await plan("odd.json", JSON.stringify({ items: [{ a: 1 }] }));
  check(!!odd.refusal && /none of the exports Studio reads/.test(odd.refusal)
    && odd.read.shape === "unread",
    "20c a JSON file of no known shape is refused by name, not read as a column of braces: "
    + JSON.stringify(String(odd.refusal).slice(0, 60)));

  const brace = examine({ text: "{greeting},Body\r\nHello,Thank you for writing.\r\n"
    + "Bye,See you soon.\r\n" });
  check(brace.source === "csv" && brace.shape === "table",
    "20d CONTROL: a CSV that merely starts with a brace is still a CSV (" + brace.source + ", "
    + brace.shape + ")");

  /* THE NATIVE DIALOG CANNOT BE DRIVEN, so the filter is read where it is written: the list of
     extensions and the All files entry, over shell/main.js's own text. */
  const mainText = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  const extLine = (mainText.match(/const PICKER_EXTENSIONS = \[([^\]]*)\]/) || [])[1] || "";
  const exts = extLine.split(",").map(x => x.trim().replace(/"/g, ""));
  check(["csv", "tsv", "txt", "xlsx", "json"].every(x => exts.indexOf(x) >= 0)
    && /extensions: PICKER_EXTENSIONS \}/.test(mainText) && /extensions: \["\*"\] \}/.test(mainText),
    "20e the import picker lists " + exts.join(", ") + " and then All files, read over"
    + " shell/main.js since no gate can press the native dialog");

  /* ---- 13. names and identities are not minted from accidents --------------------------- */

  const n1 = await plan("replies.tsv", csv([HEAD, ...EN], "\t"));
  check(!n1.refusal && n1.name === "replies" && n1.id === null,
    "13a the catalog is named by the file without its extension, whatever the extension, and its id is"
    + " made when it lands rather than from that name: "
    + JSON.stringify(n1.name) + ", id " + n1.id);

  const UIDS = ["ord_ship_1", "pay_refund_2", "acc_reset_3", "gen_close_4"];
  const u1 = await plan("underscored.csv",
    csv([["id", ...HEAD], ...EN.map((r, i) => [UIDS[i], ...r])], ","));
  const u1made = await importCsv({ text: csv([["id", ...HEAD], ...EN.map((r, i) => [UIDS[i], ...r])], ",") });
  const lostNotes = u1.report.findings.filter(f => /carr(y|ies) an id|carries the id/.test(f.what));
  check(JSON.stringify(u1made.catalog.cards.map(c => c.id))
      === JSON.stringify(UIDS.map(x => x.replace(/_/g, "-"))) && lostNotes.length === 0,
    "13b ids written with underscores keep their identity with the hyphen in its place, and no"
    + " row is warned about: " + JSON.stringify(u1made.catalog.cards.map(c => c.id)));

  const BAD = ["A!", "B!", "C!", "D!"];
  const b1 = await importCsv({ text: csv([["id", ...HEAD], ...EN.map((r, i) => [BAD[i], ...r])], ",") });
  /* The count after a colon and the first three named, since polish 04 framed the note. */
  const badNotes = b1.report.findings.filter(f => /id is not 3 to 64/.test(f.what));
  check(badNotes.length === 1 && /: 4\. The first of them: /.test(badNotes[0].what)
    && (badNotes[0].what.match(/ -> /g) || []).length === 3,
    "13c ids the format cannot hold at all are one note for all the rows, not one per row: "
    + badNotes.length + " note(s), " + JSON.stringify(String((badNotes[0] || {}).what).slice(0, 60)));

  const noCat = await importCsv({ text: csv([["Title", "Body"], ...EN.map(r => [r[0], r[1]])], ",") });
  check(noCat.catalog.cards.every(c => c.id.indexOf("imported") < 0),
    "13d with no category column the minted ids are the titles' alone, not c-imported-<title>: "
    + JSON.stringify(noCat.catalog.cards.slice(0, 2).map(c => c.id)));
  const withCat = await importCsv({ text: csv([HEAD, ...EN], ",") });
  check(withCat.catalog.cards[0].id.indexOf(EN[0][2]) >= 0,
    "13e CONTROL: with a category column the category still leads the minted id: "
    + withCat.catalog.cards[0].id);

  if (!argv.includes("--keep")) dropScratch(SCRATCH, "import-sense");
  process.stdout.write("import-sense: " + asserted + " assertion(s), " + failed
    + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => { process.stderr.write(String(e && e.stack || e) + "\n");
  process.exit(1); });
