/* A PASTE SPLITS WITHOUT A MODEL, AND THE IMPORTER THEN READS IT AS A FILE.
 *
 *     node tests/paste.mjs
 *
 * Each leg is a failure the splitter would have if it cut on every line, searched ahead for
 * a later heading, read a heading out of a script or a comment, decoded an entity twice, or
 * wrote a CSV a semicolon could re-separate. The command line and writePaste are held to the
 * same bytes importCsv writes from those pieces. No window: tests/paste-screen.mjs is that leg.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { delimiterOf, table } from "../src/csv.mjs";
import { importCsv, writeImport } from "../src/import.mjs";
import { PASTE_NAME, pasteCsv, splitPaste } from "../src/paste.mjs";
import { json, PROJECT_FILE, DRAFT_FILE } from "../src/publish.mjs";
import { writePaste, importLand, openProposal } from "../src/studio.mjs";
import { parse } from "../tools/import.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "paste");
const PASTE_FILE = path.join(os.tmpdir(), "etiuda-studio-paste", PASTE_NAME);

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
function same(got, want, line) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  check(ok, line + (ok ? "" : "\n       got " + JSON.stringify(got)));
}
const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");

const EN_A = "Open the account page and choose Reset. The link is for you and it arrives by email.";
const EN_B = "An order is on the Orders page once payment has cleared and you can see it from there.";

function cli(args, input) {
  const opts = { cwd: ROOT, encoding: "utf8" };
  if (input != null) opts.input = input;
  return spawnSync(process.execPath, ["tools/import.mjs"].concat(args), opts);
}

async function main() {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });

  /* 1. A blank line splits two replies, and the words stay as they were. */
  same(splitPaste("Reset a password\nOpen the page.\n\nWhere an order is\nLook under Orders.\nIt lists the last six.\n", ""), [
    { title: "Reset a password", body: "Open the page." },
    { title: "Where an order is", body: "Look under Orders.\nIt lists the last six." },
  ], "1 a blank line splits two replies, titles and bodies verbatim");

  /* 2. A second non-blank line with no blank stays in the body. A per-line cut would make three. */
  same(splitPaste("Only title\nstill the body\nand more", ""), [
    { title: "Only title", body: "still the body\nand more" },
  ], "2 a second line with no blank stays in the body");

  /* 3. Two blank lines are one boundary, not an empty piece. */
  same(splitPaste("A title\nbody a\n\n\nB title\nbody b\n", ""), [
    { title: "A title", body: "body a" },
    { title: "B title", body: "body b" },
  ], "3 a double blank makes no empty piece");

  /* 4. A line of spaces, and a line of only a no-break space, are blanks. */
  same(splitPaste("Title one\n \n\u00a0\nTitle two\nbody\n", ""), [
    { title: "Title one", body: "" },
    { title: "Title two", body: "body" },
  ], "4 a line of spaces and a line of nbsp are blanks");

  /* 5. HTML headings split a plain text that has no blank line. Without the HTML it is one piece.
     The tag's case does not matter. A heading of a different case is not this line. */
  const joined = "Alpha\nunder alpha\nBeta\nunder beta";
  same(splitPaste(joined, "<h1>Alpha</h1><p>under alpha</p><H2>Beta</H2>"), [
    { title: "Alpha", body: "under alpha" },
    { title: "Beta", body: "under beta" },
  ], "5 h1 and h2 split a paste that has no blank line");
  same(splitPaste(joined, ""), [
    { title: "Alpha", body: "under alpha\nBeta\nunder beta" },
  ], "5 the same plain text with no HTML is one piece");
  same(splitPaste("Intro\nalpha\nbody", "<h1>Alpha</h1>"), [
    { title: "Intro", body: "alpha\nbody" },
  ], "5 a heading whose case differs is not this line");

  /* 6. Paragraphs are not headings. The plain text's own blank line still splits. */
  const blanked = "One title\nbody one\n\nTwo title\nbody two";
  const paras = "<p>One title</p><p>body one</p><p>Two title</p><p>body two</p>";
  same(splitPaste(blanked, paras), splitPaste(blanked, ""),
    "6 HTML of only p tags does not invent a split");
  check(splitPaste(blanked, paras).length === 2, "6 and the plain text's blank line still splits");

  /* 7. One unmatched heading does not stop the rest. Beta splits even with Alpha waiting. */
  same(splitPaste("Intro line\nBeta\nunder beta", "<h1>Alpha</h1><h2>Beta</h2>"), [
    { title: "Intro line", body: "" },
    { title: "Beta", body: "under beta" },
  ], "7 an unmatched earlier heading does not prevent a later heading from splitting");

  /* 8. A heading that is a whole line splits with no blank, and that line is the next title.
     The same heading text a second time, with no second heading, stays in the body. */
  same(splitPaste("Before\nAlpha\nafter alpha", "<h1>Alpha</h1>"), [
    { title: "Before", body: "" },
    { title: "Alpha", body: "after alpha" },
  ], "8 a heading that is a whole line splits, and that line is the title");
  same(splitPaste("Alpha\nBeta\nunder", "<h1>Alpha</h1><h2>Beta</h2>"), [
    { title: "Alpha", body: "" },
    { title: "Beta", body: "under" },
  ], "8 consecutive headings leave the first piece an empty body");
  same(splitPaste("Alpha\nbody\nAlpha\nmore", "<h1>Alpha</h1>"), [
    { title: "Alpha", body: "body\nAlpha\nmore" },
  ], "8 one heading does not split the same words a second time");

  /* 9. The piece keeps the plain text. The match may collapse spaces; the stored title does not.
     An entity is decoded once, so a heading written as an escaped entity matches that text. */
  const raw = "Caf\u00e9, really.\nThe words {{customer.name}} and %%ticket_id%% stay.\nZażółć\nunder the heading";
  const html9 = "<h1>Caf&eacute;, really.</h1><h2>Za&#380;&#243;&#322;&#263;</h2>";
  same(splitPaste(raw, html9), [
    { title: "Caf\u00e9, really.", body: "The words {{customer.name}} and %%ticket_id%% stay." },
    { title: "Zażółć", body: "under the heading" },
  ], "9 accents, punctuation and placeholders stay, and a numeric heading matches the plain line");
  same(splitPaste("Hello  world\nbody here", "<h1>Hello world</h1>"), [
    { title: "Hello  world", body: "body here" },
  ], "9 two spaces in the plain title are kept when the HTML collapsed them");
  same(splitPaste("Intro\n&eacute;\nbody", "<h1>&amp;eacute;</h1>"), [
    { title: "Intro", body: "" },
    { title: "&eacute;", body: "body" },
  ], "9 an escaped entity is decoded once");
  same(splitPaste("Caf\u00e9\nbody", "<h1>Caf&#233;</h1>"), [
    { title: "Caf\u00e9", body: "body" },
  ], "9 a decimal reference matches the plain letter");
  same(splitPaste("Caf\u00e9 line\nbody", "<h1>Caf&#xE9; line</h1>"), [
    { title: "Caf\u00e9 line", body: "body" },
  ], "9 a hex reference matches the plain letter");
  same(splitPaste("Cafe\u00a0line\nbody", "<h1>Cafe line</h1>"), [
    { title: "Cafe\u00a0line", body: "body" },
  ], "9 a no-break space in the plain line matches a space in the heading, and the line is kept");

  /* 10. The importer, not the splitter, translates a placeholder, and it trims a cell as a file's. */
  const marked = splitPaste(
    "  Reset a password  \n  Tell {{customer.name}} the link is for you. The ticket is %%ticket_id%%.  \n\n"
    + "Where an order is\n" + EN_B + "\n", "");
  check(marked[0].body.indexOf("{{customer.name}}") >= 0 && marked[0].body.indexOf("%%ticket_id%%") >= 0,
    "10 the piece still holds both placeholders");
  const csv10 = pasteCsv(marked);
  const viaText = await importCsv({ text: csv10, file: PASTE_FILE, id: "paste-leg" });
  const csvAt = path.join(SCRATCH, "leg10.csv");
  fs.writeFileSync(csvAt, csv10, "utf8");
  const viaFile = await importCsv({ file: csvAt, id: "paste-leg" });
  const body0 = viaText.catalog.cards[0].body.en;
  check(body0.indexOf("{PAX}") >= 0 && body0.indexOf("{{customer.name}}") < 0
    && body0.indexOf("%%ticket_id%%") >= 0,
    "10 importCsv translates {{customer.name}} to {PAX} and leaves %%ticket_id%%: " + body0);
  check(viaText.catalog.cards[0].title.en === "Reset a password",
    "10 importCsv trims the title's ends and keeps the words: " + viaText.catalog.cards[0].title.en);
  check(JSON.stringify(viaText.catalog) === JSON.stringify(viaFile.catalog),
    "10 the same CSV bytes, as text or as a file, are the same catalog");

  /* 11. A Windows clipboard header is not a heading. The h1 inside the HTML still splits. */
  const wrapped = "Version:1.0\r\nStartHTML:0000000100\r\n<h1>Decoy</h1>\r\n"
    + "<html><body><h1>Real title</h1><p>x</p><h2>Other title</h2></body></html>";
  const plain11 = "Real title\nunder real\nOther title\nunder other";
  same(splitPaste(plain11, wrapped), [
    { title: "Real title", body: "under real" },
    { title: "Other title", body: "under other" },
  ], "11 a CF_HTML prefix is not a heading, and the h1 inside still splits");
  same(splitPaste(plain11, ""), [
    { title: "Real title", body: "under real\nOther title\nunder other" },
  ], "11 without that HTML the same plain text is one piece");

  /* 12. A heading inside script, style or a comment is not a heading. An unclosed h1 is not one.
     An empty heading is not one, so the next real heading still matches. */
  const hidden = "<script><h1>Hidden</h1></script><style><h1>Styled</h1></style>"
    + "<!-- <h1>Noted</h1> --><h1>Shown</h1><h2>Next</h2>";
  same(splitPaste("Shown\nbody\nNext\nmore", hidden), [
    { title: "Shown", body: "body" },
    { title: "Next", body: "more" },
  ], "12 script, style and a comment do not supply a heading");
  same(splitPaste("Intro\nAlpha\nunder", "<h1>Alpha"), [
    { title: "Intro", body: "Alpha\nunder" },
  ], "12 an unclosed h1 is not a heading");
  same(splitPaste("Intro\nReal\nbody", "<h1>   </h1><h1>Real</h1>"), [
    { title: "Intro", body: "" },
    { title: "Real", body: "body" },
  ], "12 an empty heading is skipped and the next heading still splits");

  /* 13. CRLF and LF are the same pieces, and the body is joined with \\n. The splitter does not trim. */
  const lf = "First title\nfirst body\n\nSecond title\nsecond body\n";
  const crlf = "First title\r\nfirst body\r\n\r\nSecond title\r\nsecond body\r\n";
  same(splitPaste(crlf, ""), splitPaste(lf, ""), "13 CRLF splits as LF does");
  check(splitPaste(crlf, "")[1].body === "second body" && splitPaste("Hello \nbody", "")[0].title === "Hello ",
    "13 the body has no carriage return, and a trailing space on the title stays");

  /* 14. Nothing to read is no pieces, HTML headings included. */
  check(splitPaste("", "<h1>Nope</h1>").length === 0, "14 empty plain text is no pieces");
  check(splitPaste("  \n\u00a0\n\t", "<h1>Nope</h1>").length === 0, "14 whitespace-only plain text is no pieces");

  /* 15. A semicolon, a tab and a newline stay inside the Text cell. A quote in the title comes back. */
  const awkward = pasteCsv([
    { title: 'He said "hi"', body: "a;b\tand\nstill one" },
    { title: "Second title", body: EN_B },
  ]);
  check(delimiterOf(awkward) === ",", "15 the separator is a comma: " + JSON.stringify(delimiterOf(awkward)));
  const parsed = table(awkward, ",");
  check(parsed.head.join("|") === "Title|Text" && parsed.rows.length === 2,
    "15 the table is two columns and two rows: " + parsed.head.join("|") + " x " + parsed.rows.length);
  check(parsed.rows[0].Title === 'He said "hi"' && parsed.rows[0].Text === "a;b\tand\nstill one",
    "15 a quote, a semicolon, a tab and a newline round-trip in one cell");

  /* 16. The command line's --paste writes the draft importCsv writes from the same pieces. */
  const plain16 = "How to reset a password\n" + EN_A + "\nWhere an order is\n" + EN_B;
  const html16 = "<h1>How to reset a password</h1><h2>Where an order is</h2>";
  const pieces16 = splitPaste(plain16, html16);
  check(pieces16.length === 2, "16 the sample paste is two pieces: " + pieces16.length);
  const made16 = await importCsv({
    text: pasteCsv(pieces16), file: PASTE_FILE, id: "paste-fixed",
  });
  const wantDir = path.join(SCRATCH, "want");
  writeImport(wantDir, made16.catalog, made16.report);
  const plainAt = path.join(SCRATCH, "plain.txt");
  const htmlAt = path.join(SCRATCH, "page.html");
  fs.writeFileSync(plainAt, plain16, "utf8");
  fs.writeFileSync(htmlAt, html16, "utf8");
  const outDir = path.join(SCRATCH, "cli");
  const ran = cli(["--paste", outDir, "--plain", plainAt, "--html", htmlAt, "--id", "paste-fixed"]);
  check(ran.status === 0, "16 --paste exits 0: " + ran.status + " " + (ran.stderr || "").slice(0, 200));
  check(/2 card\(s\)/.test(ran.stdout || ""), "16 and it says 2 cards: " + JSON.stringify((ran.stdout || "").split("\n")[0]));
  const bare = cli(["--paste", path.join(SCRATCH, "bare"), "--plain", plainAt, "--id", "paste-fixed"]);
  check(bare.status === 0 && /1 card\(s\)/.test(bare.stdout || ""),
    "16 the same plain text with no HTML is 1 card: " + JSON.stringify((bare.stdout || "").split("\n")[0]));
  const draftCli = path.join(outDir, "paste-fixed.draft.json");
  const draftWant = path.join(wantDir, "paste-fixed.draft.json");
  check(fs.existsSync(draftCli) && sha(draftCli) === sha(draftWant),
    "16 the draft matches importCsv of the same pieces");
  check(sha(path.join(outDir, "paste-fixed.lint.json")) === sha(path.join(wantDir, "paste-fixed.lint.json")),
    "16 and so does the report beside it");
  const stdIn = cli(["--paste", path.join(SCRATCH, "stdin"), "--html", htmlAt, "--id", "paste-fixed"], plain16);
  check(stdIn.status === 0 && fs.existsSync(path.join(SCRATCH, "stdin", "paste-fixed.draft.json"))
    && sha(path.join(SCRATCH, "stdin", "paste-fixed.draft.json")) === sha(draftWant),
    "16 with no --plain, stdin is the plain text and the draft matches");
  const emptyAt = path.join(SCRATCH, "empty.txt");
  fs.writeFileSync(emptyAt, " \n\u00a0\n", "utf8");
  const none = cli(["--paste", path.join(SCRATCH, "none"), "--plain", emptyAt]);
  check(none.status === 2 && /the paste has no reply in it/.test(none.stderr || "")
    && !fs.existsSync(path.join(SCRATCH, "none", "pasted.draft.json")),
    "16 an empty paste exits 2 and writes no draft: " + none.status + " " + JSON.stringify(none.stderr));
  const flagged = parse(["a.csv", "out", "--id", "abc"]);
  const pasted = parse(["--paste", "out", "--plain", "p.txt", "--html", "h.html", "--id", "abc", "--drop", "Notes"]);
  check(flagged._.join(",") === "a.csv,out" && flagged.paste == null && flagged.id === "abc",
    "16 a file import's arguments are unchanged");
  check(pasted.paste === "out" && pasted.plain === "p.txt" && pasted.html === "h.html"
    && pasted.id === "abc" && pasted._.length === 0 && pasted.override.Notes === null,
    "16 --paste takes the out folder, and --drop still reaches the importer");

  /* 17. writePaste writes that CSV and nothing else, and refuses an empty paste without replacing it. */
  const wrote = writePaste(plain16, html16);
  const wroteAt = wrote && wrote.file;
  check(wroteAt && wroteAt !== PASTE_FILE && wrote.replies === 2 && wrote.oneBlock === false
    && fs.readFileSync(wroteAt, "utf8") === pasteCsv(pieces16),
    "17 writePaste's file is pasteCsv of the same pieces, its own file, and not the one-block notice");
  check(!fs.existsSync(path.join(path.dirname(wroteAt), "categories.csv")),
    "17 and it writes no categories.csv beside it");
  const fromVerb = await importCsv({ file: wroteAt, id: "paste-fixed" });
  const verbDir = path.join(SCRATCH, "verb");
  writeImport(verbDir, fromVerb.catalog, fromVerb.report);
  check(sha(path.join(verbDir, "paste-fixed.draft.json")) === sha(draftWant),
    "17 importCsv of the file writePaste wrote matches the command line's draft");
  const before = fs.readFileSync(wroteAt, "utf8");
  let refusal = null;
  try { writePaste(" \n\u00a0\n", "<h1>Nope</h1>"); }
  catch (e) { refusal = e; }
  check(!!refusal && refusal.said && refusal.said.frame === "the paste has no reply in it"
    && fs.readFileSync(wroteAt, "utf8") === before,
    "17 an empty paste is refused and the file already there is left as it was");
  const secondFile = writePaste(plain16 + "\n\nOther title\nOther body\n", "");
  check(secondFile && secondFile.file !== wroteAt && fs.readFileSync(wroteAt, "utf8") === before,
    "17 a second paste is a second file, and the first file's bytes are still there");

  /* 18 to 22. The copywriter's conditions that are code (board 956, round 2). A missing
     export or a sentence not yet in the table fails here, before the change that lands it. */
  const pasteApi = await import("../src/paste.mjs");
  const pasteHasReply = pasteApi.pasteHasReply;
  const pasteAccount = pasteApi.pasteAccount;
  const pasteOverride = pasteApi.pasteOverride;
  const langJs = fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8");
  const appJs = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
  const hasPair = (en, pl) => langJs.indexOf(JSON.stringify(en) + ": " + JSON.stringify(pl)) >= 0
    || langJs.indexOf(JSON.stringify(en) + ":\n") >= 0 && langJs.indexOf(JSON.stringify(pl)) >= 0;

  /* 18. Nothing pasted, or only whitespace, is not a reply. The screen keeps the press
     waiting; the command line's refusal in leg 16 stays for a caller that has no press. */
  check(typeof pasteHasReply === "function"
    && pasteHasReply("") === false && pasteHasReply(" \n\u00a0\n\t") === false
    && pasteHasReply("A title") === true,
    "18 pasteHasReply is false for empty and whitespace, and true for a line");
  check(hasPair("Split into cards opens once text is pasted above.",
      "Podział na karty będzie możliwy, gdy powyżej pojawi się wklejony tekst.")
    && appJs.indexOf('T("Split into cards opens once text is pasted above.")') >= 0,
    "18 the waiting line is her sentence, and the page says it");

  /* 19. One block with nothing to split on is one card, and the notice says so. A heading
     that is only the first line's title is not that case: the notice would be false. */
  const onePlain = "Only title\nstill the body";
  const accounted = typeof pasteAccount === "function" ? pasteAccount(onePlain, "") : null;
  check(!!accounted && accounted.replies === 1 && accounted.oneBlock === true
    && splitPaste(onePlain, "").length === 1,
    "19 one block with nothing to split on is one card, and the notice applies");
  const titled = typeof pasteAccount === "function"
    ? pasteAccount("Alpha\nunder alpha", "<h1>Alpha</h1>") : null;
  check(!!titled && titled.replies === 1 && titled.oneBlock === false,
    "19 a heading used only as the first line's title does not take the notice");
  const splitOn = typeof pasteAccount === "function" ? pasteAccount("A title\n\nB title", "") : null;
  check(!!splitOn && splitOn.replies === 2 && splitOn.oneBlock === false,
    "19 a blank line between two replies is not the one-block notice");
  const missed = typeof pasteAccount === "function"
    ? pasteAccount(onePlain, "<h1>Nowhere</h1>") : null;
  check(!!missed && missed.replies === 1 && missed.oneBlock === true,
    "19 a heading that matches no line is not a split, so the notice applies");
  const oneWrote = writePaste(onePlain, "");
  check(oneWrote && oneWrote.file && oneWrote.file !== wroteAt && oneWrote.replies === 1 && oneWrote.oneBlock === true,
    "19 writePaste of that block returns one card and the notice, in its own file");
  check(hasPair(
      "Studio found one reply only, as the text has no blank line or heading to split on. If it holds several, a blank line between them splits it.",
      "Studio znalazło tylko jedną odpowiedź, bo w tekście nie ma pustej linii ani nagłówka. Jeśli to kilka odpowiedzi, wystarczy oddzielić je pustą linią.")
    && appJs.indexOf('T("Studio found one reply only, as the text has no blank line or heading to split on. If it holds several, a blank line between them splits it.")') >= 0,
    "19 the page says her one-block notice");

  /* 20. The language the person names is where the cards land. The importer already takes an
     override; this leg holds the paste's own map to that, and the question to her sentence. */
  const mapped = typeof pasteOverride === "function" ? pasteOverride("pl") : null;
  check(!!mapped && mapped.Title === "title.pl" && mapped.Text === "body.pl"
    && Object.keys(mapped).length === 2,
    "20 pasteOverride names Title and Text in the language given");
  const plMade = await importCsv({
    text: pasteCsv(splitPaste("Reset a password\n" + EN_A, "")),
    file: PASTE_FILE, id: "paste-pl",
    override: { Title: "title.pl", Text: "body.pl" },
  });
  const plCard = plMade.catalog.cards[0];
  check(plMade.report.primary === "pl" && plCard.title.pl === "Reset a password"
    && plCard.body.pl === EN_A && plCard.title.en == null && plCard.body.en == null,
    "20 an override of pl lands the title and the text in pl, not en");
  check(plMade.report.paste === true,
    "20 the report of the paste file says it is a paste");
  const otherAt = path.join(SCRATCH, "not-a-paste.csv");
  fs.writeFileSync(otherAt, pasteCsv(splitPaste("Reset a password\n" + EN_A, "")), "utf8");
  check(hasPair("Which language are these replies in?", "W jakim języku są te odpowiedzi?")
    && appJs.indexOf('T("Which language are these replies in?")') >= 0
    && appJs.indexOf('Title: "title." + lang') >= 0
    && appJs.indexOf('Text: "body." + lang') >= 0,
    "20 the page asks her language question and sends that language as the override");

  /* 21. The queue says the paste in her words, beside the file's own line, and the file name
     stays on the proposal so the rest of the queue still has a name. */
  check(hasPair("imported from pasted text", "import z wklejonego tekstu")
    && appJs.indexOf('T("imported from pasted text")') >= 0
    && appJs.indexOf('T("imported from {FILE}"') >= 0,
    "21 her source line sits beside the file's own line");
  const homeAt = path.join(SCRATCH, "home");
  fs.mkdirSync(homeAt, { recursive: true });
  const seed = await importCsv({
    text: '"Title","Text"\r\n"Desk title","The desk opens on the cards, and you can search from there."\r\n',
    id: "home-catalog",
  });
  fs.writeFileSync(path.join(homeAt, DRAFT_FILE), json(seed.catalog), "utf8");
  fs.writeFileSync(path.join(homeAt, PROJECT_FILE), json({ id: "home-catalog", rev: 0,
    edition: "", draft: DRAFT_FILE, folder: null }), "utf8");
  const landedPaste = writePaste(plain16, html16);
  const landed = await importLand(SCRATCH, landedPaste.file, {}, homeAt);
  const opened = await openProposal(homeAt, landed.file);
  check(opened.ok && opened.importedFrom === path.basename(landedPaste.file) && opened.paste === true,
    "21 openProposal of a paste names that paste's file and says it was pasted text: "
    + JSON.stringify({ ok: opened.ok, from: opened.importedFrom, paste: opened.paste }));
  const landedFile = await importLand(SCRATCH, otherAt, {}, homeAt);
  const openedFile = await openProposal(homeAt, landedFile.file);
  check(openedFile.ok && openedFile.importedFrom === "not-a-paste.csv" && openedFile.paste !== true,
    "21 a file import is still named by its file, and is not a paste");

  /* 22. A long first line is the title, whole. This already holds; it is the proof that no
     shortening sentence is added. */
  const longTitle = "A".repeat(400);
  const longPiece = splitPaste(longTitle + "\nThe body stays under it.", "");
  check(longPiece.length === 1 && longPiece[0].title === longTitle,
    "22 the splitter keeps a 400-character first line whole");
  const longMade = await importCsv({
    text: pasteCsv(longPiece), file: path.join(SCRATCH, "long.csv"), id: "long-title",
  });
  check(longMade.catalog.cards[0].title.en === longTitle
    && longMade.catalog.cards[0].title.en.length === 400,
    "22 and importCsv stores that title whole");

  /* Her other sentences, so a pair that was not landed fails in this file. */
  check(hasPair("Replies to bring in", "Odpowiedzi do zaimportowania")
    && hasPair("Split into cards", "Podziel na karty")
    && hasPair("Replies found: {N}", "Znalezione odpowiedzi: {N}")
    && hasPair("Next: where it lands", "Dalej: gdzie trafia")
    && hasPair("Paste text", "Wklej tekst")
    && hasPair(
      "Paste replies from OneNote, Word, Google Docs or any text file. Each heading starts a new card, and blank lines stay inside it; in text with no headings, a blank line starts a new card. Each card's first line becomes its title.",
      "Można tu wkleić odpowiedzi z OneNote, Worda, Dokumentów Google albo dowolnego pliku tekstowego. Każdy nagłówek zaczyna nową kartę, a puste linie zostają w jej treści; w tekście bez nagłówków nową kartę zaczyna pusta linia. Pierwsza linia każdej karty staje się jej tytułem."),
    "23 her door, count, press and move-on sentences are in the table");

  /* A large paste whose HTML leaves its headings, comments and scripts unclosed splits in linear time: a lazy
     pattern rescans to the end of the text for each one (the test architect's read, 2026-11-02 17:10). */
  {
    const plain = Array.from({ length: 2000 }, (_, i) => "Title " + i + "\nBody " + i).join("\n\n");
    const html = "<h2>open ".repeat(20000) + "<!-- open ".repeat(20000) + "<script>open ".repeat(20000);
    const t0 = Date.now();
    const cards = splitPaste(plain, html);
    const ms = Date.now() - t0;
    check(cards.length === 2000 && ms < 1000,
      "24 a 2,000-reply paste with 60,000 unclosed tags in its HTML splits by its blank lines in under a second (" + ms + " ms)");
  }

  /* 25. Where the paste has headings, a heading starts a card and a blank line is a paragraph
     inside it. A piece with an empty body is never made from a heading followed by a blank line. */
  {
    const plain25 = "First guide topic\n\nWelcome to the handbook. Please read each section with care.\n\n"
      + "Contact the coordinator if anything is unclear.\n\n"
      + "Second guide topic\n\nAll keys must remain within the secure zone.\n\n"
      + "Return any temporary badge at the end of the visit.";
    const html25 = "<h1>First guide topic</h1><p>Welcome to the handbook. Please read each section with care.</p>"
      + "<p>Contact the coordinator if anything is unclear.</p>"
      + "<h2>Second guide topic</h2><p>All keys must remain within the secure zone.</p>"
      + "<p>Return any temporary badge at the end of the visit.</p>";
    const cards25 = splitPaste(plain25, html25);
    check(cards25.length === 2, "25 headed fixture gives one card per heading (2 cards)");
    check(cards25[0] && cards25[0].title === "First guide topic"
      && cards25[0].body === "Welcome to the handbook. Please read each section with care.\n\nContact the coordinator if anything is unclear.",
      "25 first card body whole with two paragraphs");
    check(cards25[1] && cards25[1].title === "Second guide topic"
      && cards25[1].body === "All keys must remain within the secure zone.\n\nReturn any temporary badge at the end of the visit.",
      "25 second card body whole with two paragraphs");
    const blankUnder = splitPaste("Topic title\n\nFollowed by body text.", "<h1>Topic title</h1>");
    check(blankUnder.length === 1 && blankUnder[0].body === "Followed by body text.",
      "25 a heading followed by a blank line never makes an empty piece");
  }

  /* 26. One unmatched heading does not stop the rest. The heading test looks the line up among
     all the headings not yet used (a set). Typographic and Polish named entities decode. */
  {
    const plain26 = "Writer\u2019s desk notes\nKeep all pencils sharp.\n"
      + "Editor\u2019s desk notes\nVerify every quotation.\n"
      + "Reader\u2019s desk notes\nCheck the chapter titles.";
    const html26 = "<h1>Writer&rsquo;s desk notes</h1><p>Keep all pencils sharp.</p>"
      + "<h2>Editor&rsquo;s desk notes</h2><p>Verify every quotation.</p>"
      + "<h3>Reader&rsquo;s desk notes</h3><p>Check the chapter titles.</p>";
    const cards26 = splitPaste(plain26, html26);
    check(cards26.length === 3, "26 fixture with &rsquo; in first heading splits at every heading (3 cards)");
    check(cards26[0] && cards26[0].title === "Writer\u2019s desk notes"
      && cards26[0].body === "Keep all pencils sharp.",
      "26 first heading with &rsquo; matches plain text title and body");
    check(cards26[1] && cards26[1].title === "Editor\u2019s desk notes",
      "26 second heading matches after decoded entity in first heading");
    check(cards26[2] && cards26[2].title === "Reader\u2019s desk notes",
      "26 third heading matches after decoded entity in first heading");

    /* An unmatched heading in HTML does not prevent later headings from splitting */
    const unmatchHtml = "<h1>Decoy unmatched heading</h1><h2>Section two</h2><p>Body two.</p><h3>Section three</h3><p>Body three.</p>";
    const unmatchPlain = "Intro line\nSection two\nBody two.\nSection three\nBody three.";
    const unmatchCards = splitPaste(unmatchPlain, unmatchHtml);
    check(unmatchCards.length === 3 && unmatchCards[1].title === "Section two"
      && unmatchCards[2].title === "Section three",
      "26 an unmatched heading does not stop subsequent headings from splitting");

    /* Polish and typographic named entities decode in headingsOf */
    const plHtml = "<h1>Cz&eogon;&sacute;&cacute; &lstrok;odzi &ndash; wst&eogon;p &mdash; rozdzia&lstrok; &hellip;</h1><p>Opis przystani.</p>";
    const plPlain = "Cz\u0119\u015b\u0107 \u0142odzi \u2013 wst\u0119p \u2014 rozdzia\u0142 \u2026\nOpis przystani.";
    const plCards = splitPaste(plPlain, plHtml);
    check(plCards.length === 1 && plCards[0].title === "Cz\u0119\u015b\u0107 \u0142odzi \u2013 wst\u0119p \u2014 rozdzia\u0142 \u2026",
      "26 Polish and typographic named entities decode in heading");
  }

  /* 27. Word, Outlook and OneNote headings count: <p class="MsoHeading1"...> and role="heading". */
  {
    const wordHtml = "Version:1.0\r\nStartHTML:0000000100\r\n"
      + "<html><body><!--StartFragment-->"
      + "<p class=MsoHeading1>First warehouse policy</p>"
      + "<p class=MsoNormal>All packages must be logged upon receipt.</p>"
      + "<p class=\"MsoHeading2\">Second warehouse policy</p>"
      + "<p class=MsoNormal>Safety boots must be worn beyond this point.</p>"
      + "<!--EndFragment--></body></html>";
    const wordPlain = "First warehouse policy\nAll packages must be logged upon receipt.\n"
      + "Second warehouse policy\nSafety boots must be worn beyond this point.";
    const wordCards = splitPaste(wordPlain, wordHtml);
    check(wordCards.length === 2, "27 Word-shaped fixture with MsoHeading splits into 2 cards");
    check(wordCards[0] && wordCards[0].title === "First warehouse policy"
      && wordCards[1] && wordCards[1].title === "Second warehouse policy",
      "27 Word-shaped headings become card titles");

    const oneNoteHtml = "<div role=\"heading\" aria-level=\"1\">Team briefing summary</div>"
      + "<p>Morning shift begins promptly at eight.</p>"
      + "<div role=\"heading\" aria-level=\"2\">Equipment handover</div>"
      + "<p>Sign the register before exchanging tools.</p>";
    const oneNotePlain = "Team briefing summary\nMorning shift begins promptly at eight.\n"
      + "Equipment handover\nSign the register before exchanging tools.";
    const oneNoteCards = splitPaste(oneNotePlain, oneNoteHtml);
    check(oneNoteCards.length === 2, "27 OneNote-shaped fixture with role=heading splits into 2 cards");
    check(oneNoteCards[0] && oneNoteCards[0].title === "Team briefing summary"
      && oneNoteCards[1] && oneNoteCards[1].title === "Equipment handover",
      "27 OneNote-shaped headings become card titles");
  }

  /* 28. A second paste is a second file. Two pastes land as two projects, and two pastes into
     one project are two proposals. Each holds that paste's text. Neither overwrites the other. */
  {
    const lab28 = path.join(SCRATCH, "leg28");
    fs.mkdirSync(lab28, { recursive: true });
    const titleOf = (dir) => {
      const name = fs.readdirSync(dir).find(n => n.endsWith(".draft.json"));
      const doc = JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
      const title = doc.cards[0].title;
      return title.en || title[Object.keys(title)[0]];
    };
    const propTitle = (file) => {
      const doc = JSON.parse(fs.readFileSync(file, "utf8"));
      const title = doc.cards[0].title;
      return title.en || title[Object.keys(title)[0]];
    };
    const w1 = writePaste("First paste card\nFirst body text\n");
    const bytes1 = fs.readFileSync(w1.file, "utf8");
    const w2 = writePaste("Second paste card\nSecond body text\n");
    check(w1.file !== w2.file && fs.readFileSync(w1.file, "utf8") === bytes1,
      "28 a second paste is a second file, and the first file's bytes survive it");
    const p1 = await importLand(lab28, w1.file, {}, null);
    const p2 = await importLand(lab28, w2.file, {}, null);
    check(p1 && p2 && p1.dir !== p2.dir && p1.name !== p2.name
          && titleOf(p1.dir) === "First paste card" && titleOf(p2.dir) === "Second paste card",
      "28 two pastes land as two projects, each with its own text: "
      + (p1 && p1.name) + " / " + (p2 && p2.name));

    const in1w = writePaste("Inbox paste one\nInbox body one\n");
    const in2w = writePaste("Inbox paste two\nInbox body two\n");
    const in1 = await importLand(lab28, in1w.file, {}, p1.dir);
    const in2 = await importLand(lab28, in2w.file, {}, p1.dir);
    check(in1 && in2 && in1.proposal !== in2.proposal
          && propTitle(in1.file) === "Inbox paste one" && propTitle(in2.file) === "Inbox paste two",
      "28 two pastes into one project are two proposals, each with its own text: "
      + (in1 && in1.proposal) + " / " + (in2 && in2.proposal));
    const op2 = await openProposal(p1.dir, in2.file);
    check(op2.ok && op2.paste === true, "28 second paste proposal is recognised as pasted text");
  }

  /* 29 / follow 11. --lang sets the language and, without it, a short paste keeps the code its draft was made with,
     the report saying it was assumed and the command line saying how to set it; no word goes into a code field. */
  const shortAt = path.join(SCRATCH, "short.txt");
  fs.writeFileSync(shortAt, "Zwrot kosztow\nProsimy o kontakt z biurem obslugi.", "utf8");
  const shortNoLang = cli(["--paste", path.join(SCRATCH, "short-none"), "--plain", shortAt, "--id", "short-none"]);
  const lintOf = (dir) => { const f = fs.existsSync(dir) ? fs.readdirSync(dir).find((n) => /lint/i.test(n) && /\.json$/.test(n)) : null;
    try { return f ? JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) : null; } catch { return null; } };
  const noLangReport = lintOf(path.join(SCRATCH, "short-none"));
  check(shortNoLang.status === 0
    && /primary en\b/.test(shortNoLang.stdout || "")
    && /languages:\s*en\b/.test(shortNoLang.stdout || "")
    && (shortNoLang.stdout || "").indexOf("Language not detected; assumed EN. Use --lang <code> to set it.") >= 0
    && !/undetermined from|primary undetermined/.test(shortNoLang.stdout || "")
    && !!noLangReport && noLangReport.languageDetected === false
    && (noLangReport.languages || []).every((l) => /^[a-z]{2,3}(-[A-Za-z0-9]+)?$/.test(l.code)),
    "29 without --lang, a short paste keeps en, the report says it was not detected and the line says how to set it: "
    + JSON.stringify((shortNoLang.stdout || "").split("\n").slice(0, 3)));
  const shortPl = cli(["--paste", path.join(SCRATCH, "short-pl"), "--plain", shortAt, "--lang", "pl", "--id", "short-pl"]);
  check(shortPl.status === 0
    && /primary pl/.test(shortPl.stdout || "")
    && /languages:\s*pl/.test(shortPl.stdout || "")
    && (shortPl.stdout || "").indexOf("Language not detected") < 0
    && !!lintOf(path.join(SCRATCH, "short-pl")) && lintOf(path.join(SCRATCH, "short-pl")).languageDetected !== false,
    "29 --lang sets the language: "
    + JSON.stringify((shortPl.stdout || "").split("\n").slice(0, 2)));
  /* A paste whose language nothing can find is refused as before, and the command line's refusal names the way out. */
  const blankAt = path.join(SCRATCH, "blank.txt");
  fs.writeFileSync(blankAt, "Hi\n\nThanks.\n", "utf8");
  const blank = cli(["--paste", path.join(SCRATCH, "short-blank"), "--plain", blankAt, "--id", "short-blank"]);
  check(blank.status === 2 && /pass --lang <code> to say which/.test(blank.stderr || ""),
    "29 a paste with no language found is refused, and the refusal says to pass --lang: "
    + JSON.stringify((blank.stderr || "").split("\n")[0]));

  dropScratch(SCRATCH, "paste");
  process.stdout.write("paste  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  process.stderr.write("paste  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
